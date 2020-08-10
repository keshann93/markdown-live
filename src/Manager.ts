import * as vscode from 'vscode';
import * as fs from 'fs';
import * as gl from 'glob';
import { Uri } from 'vscode';
import { join } from 'path';
import * as path from 'path';
import ContentProvider from './ContentProvider';
import { MarkdownLiveConfig } from './config';

type SupportedFiletypes = 'markdown' | '';

export default class Manager {
  // These are protected to allow unit test access because manager is extended
  private previewPanels: { [key: string]: vscode.WebviewPanel } = {};
  private preview2EditorMap: Map<vscode.WebviewPanel, vscode.TextEditor> = new Map();
  private context: vscode.ExtensionContext;
  private editorScrollDelay = Date.now();
  private config: MarkdownLiveConfig;
  private imageToConvert: any = null;
  private changeFromEditor: boolean = false;
  private currentUri: any;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = MarkdownLiveConfig.getCurrentConfig();
  }

  // function handles when there is text change in the .md document
  textDocumentChange(document: vscode.TextDocument) {
    if (this.isAcceptableLaguage(document.languageId as SupportedFiletypes) && !this.changeFromEditor) {
      this.updateMarkdown(document);
    }
  }

  // function handles when there is change in the workspace configuration defined
  updateConfiguration() {
    const newConfig = MarkdownLiveConfig.getCurrentConfig();
    if (!this.config.isEqualTo(newConfig)) {
      this.config = newConfig;
      this.closePreviews();
    }
  }

  // function handles when there is a change in the texteditor within vscode
  textEditorChange(textEditor: vscode.TextEditor) {
    if (this.isAcceptableLaguage(textEditor.document.languageId as SupportedFiletypes)) {
      const sourceUri = textEditor.document.uri;
      const config = vscode.workspace.getConfiguration('markdown-live');
      const automaticallyShowPreviewOfMarkdown = config.get<boolean>('automaticallyShowPreviewOfMarkdown');

      if (automaticallyShowPreviewOfMarkdown) {
        this.enablePreview(sourceUri);
      }
    }
  }

  // function handles when there is a visible range of text changes
  visibleRangeChange(event: vscode.TextEditorVisibleRangesChangeEvent) {
    const textEditor = event.textEditor as vscode.TextEditor;
    if (Date.now() < this.editorScrollDelay) {
      return;
    }
    if (this.isAcceptableLaguage(textEditor.document.languageId as SupportedFiletypes)) {
      const sourceUri = textEditor.document.uri;
      if (!event.textEditor.visibleRanges.length) {
        return undefined;
      } else {
        const topLine: number = this.getTopVisibleLine(textEditor) || 0;
        const bottomLine: number = this.getBottomVisibleLine(textEditor) || 0;
        let midLine;
        if (topLine === 0) {
          midLine = 0;
        } else if (Math.floor(bottomLine) === textEditor.document.lineCount - 1) {
          midLine = bottomLine;
        } else {
          midLine = Math.floor((topLine + bottomLine) / 2);
        }
        this.previewPostMessage(sourceUri, {
          command: 'changeTextEditorSelection',
          line: midLine,
        });
      }
    }
  }

  // funciton handles when there is a text editor selection change
  textEditorSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
    if (this.isAcceptableLaguage(event.textEditor.document.languageId as SupportedFiletypes)) {
      const topLine: number = this.getTopVisibleLine(event.textEditor) || 0;
      const bottomLine: number = this.getBottomVisibleLine(event.textEditor) || 0;
      let midLine;
      if (topLine === 0) {
        midLine = 0;
      } else if (Math.floor(bottomLine) === event.textEditor.document.lineCount - 1) {
        midLine = bottomLine;
      } else {
        midLine = Math.floor((topLine + bottomLine) / 2);
      }
      this.previewPostMessage(event.textEditor.document.uri, {
        command: 'changeTextEditorSelection',
        line: midLine,
      });
    }
  }

  // function handles the acceptable lang check for text docs
  isAcceptableLaguage(languageId: SupportedFiletypes): boolean {
    return languageId === 'markdown';
  }

  /** preview/ editor related supporting functionalities are implemented below */

  // function that helps to enable the preview/editor side panel
  enablePreview(uri?: vscode.Uri) {
    let resource: any = uri;
    if (!(resource instanceof vscode.Uri)) {
      if (vscode.window.activeTextEditor) {
        // we are relaxed and don't check for markdown files
        resource = vscode.window.activeTextEditor.document.uri;
      }
    }
    if (resource && vscode.window.activeTextEditor) {
      this.initPreview(resource, vscode.window.activeTextEditor, {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true,
      });
    }
  }

  // function that initiates the preview/editor panel for a markdown doc
  initPreview(sourceUri: vscode.Uri, editor: vscode.TextEditor, viewOptions: { viewColumn: vscode.ViewColumn; preserveFocus?: boolean }) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;
    let rootPath: string = '';
    const contentProvider = new ContentProvider();
    this.currentUri = sourceUri;

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length == 0) {
      rootPath = '';
    } else {
      rootPath = sourceUri.fsPath;
    }

    if (this.previewPanels[sourceUri.fsPath]) {
      currentPanel = this.previewPanels[sourceUri.fsPath];
      currentPanel.reveal(vscode.ViewColumn.Two, true);
    } else {
      currentPanel = vscode.window.createWebviewPanel('markdown-live', `Markdown Preview ${path.basename(sourceUri.fsPath)}`, viewOptions, {
        enableFindWidget: true,
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(rootPath)), vscode.Uri.file(path.join(this.context.extensionPath, 'build'))],
      });

      currentPanel.webview.html = contentProvider.getContent(this.context.extensionPath, currentPanel);

      const root = join(this.context.extensionPath, 'icons');
      currentPanel.iconPath = {
        dark: vscode.Uri.file(join(root, 'icon-light.png')),
        light: vscode.Uri.file(join(root, 'icon-dark.png')),
      };

      currentPanel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'applyChanges':
              if (this.imageToConvert) {
                const newContent = this.convertImage(message.data.content, this.imageToConvert, message.data.uri);
                if (newContent) {
                  message.data.content = newContent;
                }
              }
              this.updateActiveBlock(message.data.content, message.data.uri);
              break;
            case 'resized':
              this.refreshPreview(message.data);
              break;
            case 'convertImage':
              this.imageToConvert = message.data;
              break;
            case 'revealLine':
              if (this.config.scrollSync) {
                this.revealLine(message.data.uri, message.data.line);
              }
              break;
            default:
              console.log('Unknown webview message received:');
              console.log(message);
          }
        },
        undefined,
        this.context.subscriptions
      );

      currentPanel.onDidDispose(
        () => {
          this.destroyPreview(sourceUri);
        },
        null,
        this.context.subscriptions
      );
    }

    // register previewPanel
    this.previewPanels[sourceUri.fsPath] = currentPanel;
    this.preview2EditorMap.set(currentPanel, editor);
    this.previewPostMessage(sourceUri, { command: 'settings', settings: this.config });
    this.updateMarkdown(editor.document);
  }

  // destroys the selected preview panel
  destroyPreview(sourceUri: Uri) {
    const previewPanel = this.getPreview(sourceUri);
    if (previewPanel) {
      this.preview2EditorMap.delete(previewPanel);
      delete this.previewPanels[sourceUri.fsPath];
    }
  }

  // function that handles in closing all the preview panels/ editor panels
  closePreviews() {
    const previewPanels = [];
    for (const key in this.previewPanels) {
      if (this.previewPanels.hasOwnProperty(key)) {
        const previewPanel = this.previewPanels[key];
        if (previewPanel) {
          previewPanels.push(previewPanel);
        }
      }
    }

    previewPanels.forEach(previewPanel => previewPanel.dispose());
  }

  // function that helps to refresh the preview of editor/preview panel
  refreshPreview(uri: Uri) {
    const panel: vscode.WebviewPanel = this.getPreview(uri);
    panel.dispose();
    this.enablePreview(uri);
  }

  // function that helps to retrieve the preview/editor panel instance
  getPreview(sourceUri: Uri | undefined): vscode.WebviewPanel {
    return this.previewPanels[(sourceUri && sourceUri.fsPath) || ''];
  }

  // function that helps to send/post messages to the preview panel
  previewPostMessage(sourceUri: Uri | undefined, message: any) {
    const preview = this.getPreview(sourceUri);
    if (preview) {
      preview.webview.postMessage(message);
    }
  }

  // function that helps to send the updated doc content to the editor to render them properly
  updateMarkdown(document: vscode.TextDocument): void {
    if (document) {
      const activeFileContent = document.getText();
      this.previewPostMessage(document.uri, {
        command: 'setContent',
        content: activeFileContent,
        folderPath: vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].name,
        contentPath: document.fileName,
        uri: document.uri,
      });
    }
  }

  // function that helps to updated textdoc values when there is changes made in the editor/preview panel
  async updateActiveBlock(value: string, uri: Uri) {
    this.changeFromEditor = true;
    const preview = this.getPreview(uri);
    const activeTextEditor = this.preview2EditorMap.get(preview);
    if (activeTextEditor && activeTextEditor.document.getText() !== value) {
      const firstLine = activeTextEditor.document.lineAt(0);
      const lastLine = activeTextEditor.document.lineAt(activeTextEditor.document.lineCount - 1);
      const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
      await activeTextEditor.edit(editBuilder => {
        editBuilder.replace(textRange, value);
      });
      this.changeFromEditor = false;
    }
  }

  /**
   * Image handling related supporting functionalties are below
   */

  //Removes the given image data from the content, saves an image, puts a relative image path in its place
  convertImage(content: any, image: any, uri: Uri) {
    const preview = this.getPreview(uri);
    const activeTextEditor = this.preview2EditorMap.get(preview);
    try {
      if (activeTextEditor) {
        const noteFolder = vscode.workspace.rootPath;
        let found = 0;

        // get a unique image index
        let index = this.getNextImageIndex(noteFolder);

        // replace the embedded image with a relative file
        let newContent = content.replace(image, (d: any) => {
          let match = /data:image\/(.*);base64,(.*)$/g.exec(d);

          if (match) {
            // write the file
            const fname: string | undefined = this.saveMediaImage(
              noteFolder,
              Buffer.alloc(match[2].length, match[2], 'base64') as Buffer,
              index++,
              match[1]
            );

            found++;
            // replace the content with the the relative path
            return this.getImageTagUrl(fname || '');
          }
          return ''; // failed
        });

        if (found > 0) {
          return newContent;
        }
        return content;
      }
    } catch (e) {
      console.log(e);
    }
    return content;
  }

  // fn  to get the image index
  getNextImageIndex(folderPath: string | undefined) {
    let index = 0;
    const imgPrefix = 'img_';
    const mediaPath = path.join(folderPath || '', this.config.mediaFolder);
    if (!fs.existsSync(mediaPath)) {
      return 0;
    }
    const paths = gl.sync(`${imgPrefix}*.*`, { cwd: mediaPath, nodir: true, nocase: true });
    for (let i = 0; i < paths.length; ++i) {
      var re = new RegExp(`.*${imgPrefix}(\\d*)\\..*$`, 'g');
      let match = re.exec(paths[i]);
      if (match) {
        let val = parseInt(match[1]);
        if (index <= val) {
          index = val + 1;
        }
      }
    }
    return index;
  }

  // save image into the relative path defined
  saveMediaImage(folderPath: any, imgBuffer: Buffer, index: any, imgType: any) {
    let newIndex = index;
    const imgPrefix = 'img_';
    const mediaPath = path.join(folderPath, this.config.mediaFolder);

    // create the folder if needed
    if (!fs.existsSync(mediaPath)) {
      try {
        fs.mkdirSync(mediaPath);
      } catch (e) {
        vscode.window.showWarningMessage('Failed to create media folder.');
        return;
      }
    }
    if (index === undefined) {
      newIndex = this.getNextImageIndex(folderPath);
    }
    if (imgType === undefined) {
      imgType = 'png';
    }
    const imgName = `${imgPrefix}${newIndex}.${imgType}`;
    try {
      fs.writeFileSync(path.join(mediaPath, imgName), imgBuffer, 'base64');
    } catch (e) {
      vscode.window.showWarningMessage('Failed to save new media image.');
      return '';
    }
    return imgName;
  }

  getImageTagUrl(imgName: string) {
    return `${this.config.mediaFolder}/${imgName}`;
  }

  /** helper functions used for scroll related functionalities are below  */
  revealLine(uri: Uri, line: number) {
    const sourceUri = uri;
    line = line / 25;

    vscode.window.visibleTextEditors
      .filter(
        editor =>
          this.isAcceptableLaguage(editor.document.languageId as SupportedFiletypes) && editor.document.uri.fsPath === sourceUri.fsPath
      )
      .forEach(editor => {
        const sourceLine = Math.min(Math.floor(line), editor.document.lineCount - 1);
        const fraction = line - sourceLine;
        const text = editor.document.lineAt(sourceLine).text;
        const start = Math.floor(fraction * text.length);
        this.editorScrollDelay = Date.now() + 500;
        editor.revealRange(new vscode.Range(sourceLine, start, sourceLine + 1, 0), vscode.TextEditorRevealType.InCenter);
        this.editorScrollDelay = Date.now() + 500;
      });
  }

  //Get the top-most visible range of `editor`.
  getTopVisibleLine(editor: vscode.TextEditor): number | undefined {
    if (!editor['visibleRanges'].length) {
      return undefined;
    }

    const firstVisiblePosition = editor['visibleRanges'][0].start;
    const lineNumber = firstVisiblePosition.line;
    const line = editor.document.lineAt(lineNumber);
    const progress = firstVisiblePosition.character / (line.text.length + 2);
    return lineNumber + progress;
  }

  //Get the bottom-most visible range of `editor`
  getBottomVisibleLine(editor: vscode.TextEditor): number | undefined {
    if (!editor['visibleRanges'].length) {
      return undefined;
    }

    const firstVisiblePosition = editor['visibleRanges'][0].end;
    const lineNumber = firstVisiblePosition.line;
    let text = '';
    if (lineNumber < editor.document.lineCount) {
      text = editor.document.lineAt(lineNumber).text;
    }
    const progress = firstVisiblePosition.character / (text.length + 2);
    return lineNumber + progress;
  }

  // function that handles the toggleScrollSync command exec
  toggleScrollSync() {
    const config = vscode.workspace.getConfiguration('markdown-live');
    const scrollSync = !config.get<boolean>('scrollSync');
    config.update('scrollSync', scrollSync, true).then(() => {
      this.updateConfiguration();
      if (scrollSync) {
        vscode.window.showInformationMessage('Scroll Sync is enabled');
      } else {
        vscode.window.showInformationMessage('Scroll Sync is disabled');
      }
    });
  }

  /** functions for shortcut related functionalities are below */
  // shortcut execution
  hotkeyExec(args: any) {
    const panel: vscode.WebviewPanel = this.getPreview(this.currentUri);
    if (panel.active) {
      panel.webview.postMessage({ command: 'exec', args });
    }
  }
}
