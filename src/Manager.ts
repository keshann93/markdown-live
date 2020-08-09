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
  protected previewPanels: { [key: string]: vscode.WebviewPanel } = {};
  private preview2EditorMap: Map<vscode.WebviewPanel, vscode.TextEditor> = new Map();
  protected context: vscode.ExtensionContext;
  protected languageId: SupportedFiletypes = '';
  protected editorScrollDelay = Date.now();
  private config: MarkdownLiveConfig;
  private imageToConvert: any = null;
  protected changeFromEditor: boolean = true;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = MarkdownLiveConfig.getCurrentConfig();

    // vscode.window.onDidChangeActiveTextEditor(activeEditor => {
    //   const languageId = activeEditor ? activeEditor.document.languageId : undefined;
    //   const sourceUri = activeEditor && activeEditor.document.uri;
    //   const config = vscode.workspace.getConfiguration('markdown-live');
    //   const automaticallyShowPreviewOfMarkdown = config.get<boolean>('automaticallyShowPreviewOfMarkdown');

    //   if (languageId === 'markdown') {
    //     this.activeEditor = activeEditor;
    //     this.languageId = languageId;
    //     if (automaticallyShowPreviewOfMarkdown) {
    //       this.enablePreview(sourceUri);
    //     }
    //   }
    // });

    // vscode.window.onDidChangeTextEditorSelection(({ textEditor }) => {
    //   if (textEditor && this.isAcceptableLaguage(textEditor.document.languageId as SupportedFiletypes)) {
    //     this.activeEditor = textEditor;
    //     // this.parseFromActiveEditor();
    //   }
    // });
  }

  textDocumentChange(document: vscode.TextDocument) {
    if (this.isAcceptableLaguage(document.languageId as SupportedFiletypes) && !this.changeFromEditor) {
      this.updateMarkdown(document);
    } else {
      this.changeFromEditor = !this.changeFromEditor;
    }
  }

  updateConfiguration() {
    const newConfig = MarkdownLiveConfig.getCurrentConfig();
    if (!this.config.isEqualTo(newConfig)) {
      this.config = newConfig;
      this.closePreviews();
    }
  }

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

  textEditorSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
    if (this.isAcceptableLaguage(event.textEditor.document.languageId as SupportedFiletypes)) {
      const firstVisibleScreenRow: number = this.getTopVisibleLine(event.textEditor) || 0;
      const lastVisibleScreenRow: number = this.getBottomVisibleLine(event.textEditor) || 0;
      const topRatio = (event.selections[0].active.line - firstVisibleScreenRow) / (lastVisibleScreenRow - firstVisibleScreenRow);

      this.previewPostMessage(event.textEditor.document.uri, {
        command: 'changeTextEditorSelection',
        line: event.selections[0].active.line,
        topRatio,
      });
    }
  }

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

  isAcceptableLaguage(languageId: SupportedFiletypes): boolean {
    return languageId === 'markdown';
  }

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
    this.changeFromEditor = false;
  }

  refreshPreview(uri: Uri) {
    const panel: vscode.WebviewPanel = this.getPreview(uri);
    panel.dispose();
    this.enablePreview(uri);
  }

  initPreview(sourceUri: vscode.Uri, editor: vscode.TextEditor, viewOptions: { viewColumn: vscode.ViewColumn; preserveFocus?: boolean }) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;
    let rootPath: string = '';
    const contentProvider = new ContentProvider();

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
                  // will be empty on error
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
              this.revealLine(message.data.uri, message.data.line);
              break;
            default:
              console.log('Unknown webview message received:');
              console.log(message);
          }
          // manager.updateActiveBlock(message.prop, message.value, message.type);
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

  destroyPreview(sourceUri: Uri) {
    const previewPanel = this.getPreview(sourceUri);
    if (previewPanel) {
      this.preview2EditorMap.delete(previewPanel);
      delete this.previewPanels[sourceUri.fsPath];
    }
  }
  /**
   * Removes the given image data from the content,
   * saves an image, puts a relative image path in its place
   * @returns the new content, or blank if a failure happends
   */
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

  getPreview(sourceUri: Uri | undefined): vscode.WebviewPanel {
    return this.previewPanels[(sourceUri && sourceUri.fsPath) || ''];
  }

  public previewPostMessage(sourceUri: Uri | undefined, message: any) {
    const preview = this.getPreview(sourceUri);
    if (preview) {
      preview.webview.postMessage(message);
    }
  }

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
    }
  }

  revealLine(uri: Uri, line: number) {
    const sourceUri = uri;

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

  /**
   * Get the top-most visible range of `editor`.
   *
   * Returns a fractional line number based the visible character within the line.
   * Floor to get real line number
   */
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

  /**
   * Get the bottom-most visible range of `editor`.
   *
   * Returns a fractional line number based the visible character within the line.
   * Floor to get real line number
   */
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

  hotkeyExec(panel: vscode.WebviewPanel, args: any) {
    if (panel.active) {
      panel.webview.postMessage({ command: 'exec', args });
    }
  }
}
