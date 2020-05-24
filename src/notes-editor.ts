'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import NotesConfig from './notes-config';
import NotesUtil from './notes-util';

const Config = new NotesConfig();
const Utils = new NotesUtil();

let _currentPanel: any = null;

export default class NotesEditor {
  public extensionPath: any;
  public disposables: any;
  public reloadContentNeeded: any;
  public updateSettingsNeeded: any;
  public currentNote: any;
  public imageToConvert: any;
  public panel: any;
  public writingFile: any;

  static createOrShow(extensionPath: any, webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (_currentPanel) {
      _currentPanel.panel.reveal(column);
    } else {
      _currentPanel = new NotesEditor(extensionPath, column || vscode.ViewColumn.One, document, webviewPanel);
    }
  }

  static close() {
    try {
      _currentPanel.dispose();
      _currentPanel = null;
    } catch (e) {
      console.log(e);
    }
  }

  static recreate(extensionPath: any, currentNote: any, panel: any) {
    try {
      NotesEditor.close();
      NotesEditor.createOrShow(extensionPath, currentNote, panel);
      if (currentNote) {
        _currentPanel.showUNote(currentNote);
      }
    } catch (e) {
      console.log(e);
    }
  }

  static instance() {
    return _currentPanel;
  }

  constructor(extensionPath: any, column: any, document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    try {
      this.extensionPath = extensionPath;
      this.disposables = [];
      this.reloadContentNeeded = false;
      this.updateSettingsNeeded = false;
      this.currentNote = document.fileName;
      this.imageToConvert = null;

      webviewPanel.webview.options = {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(Config.rootPath)), vscode.Uri.file(path.join(this.extensionPath, 'build'))],
      };
      this.panel = webviewPanel;

      // vscode.window.createWebviewPanel('markdown-live', 'Markdown Live', column, {
      //   enableScripts: true,
      //   retainContextWhenHidden: true,
      //   enableFindWidget: true,
      //   localResourceRoots: [vscode.Uri.file(path.join(Config.rootPath)), vscode.Uri.file(path.join(this.extensionPath, 'build'))],
      // });

      // Set the webview's initial html content
      this.panel.webview.html = this.getWebviewContent();

      // Listen for when the panel is disposed
      // This happens when the user closes the panel or when the panel is closed programatically
      this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

      // Handle messages from the webview
      this.panel.webview.onDidReceiveMessage(
        (message: any) => {
          switch (message.command) {
            case 'applyChanges':
              // kind of a hack to replace pasted images with actual files
              if (this.imageToConvert) {
                const newContent = this.convertImage(message.content, this.imageToConvert);
                if (newContent) {
                  // will be empty on error
                  message.content = newContent;
                }
              }
              this.saveChanges(message.content);
              if (this.imageToConvert) {
                this.imageToConvert = null;
                this.updateContents();
              }
              break;
            case 'editorOpened':
              this.showUNote(this.currentNote);
              this.updateEditorSettings();
              this.updateRemarkSettings();
              break;
            case 'resized':
              NotesEditor.recreate(this.extensionPath, this.currentNote, this.panel);
              break;
            case 'convertImage':
              this.imageToConvert = message.data;
              break;
            default:
              console.log('Unknown webview message received:');
              console.log(message);
          }
        },
        null,
        this.disposables
      );

      this.panel.onDidChangeViewState(
        (e: any) => {
          if (e.webviewPanel.active) {
            if (this.reloadContentNeeded) {
              this.updateContents();
              this.reloadContentNeeded = false;
            }
            if (this.updateSettingsNeeded) {
              this.updateEditorSettings();
              this.updateSettingsNeeded = false;
            }
          }
        },
        null,
        this.disposables
      );

      // Register commands
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.heading.1', () => {
          this.hotkeyExec(['Heading', 1]);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.heading.2', () => {
          this.hotkeyExec(['Heading', 2]);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.heading.3', () => {
          this.hotkeyExec(['Heading', 3]);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.heading.4', () => {
          this.hotkeyExec(['Heading', 4]);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.heading.5', () => {
          this.hotkeyExec(['Heading', 5]);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.heading.6', () => {
          this.hotkeyExec(['Heading', 6]);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.normal', () => {
          this.hotkeyExec(['Paragraph']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.bold', () => {
          this.hotkeyExec(['Bold']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.italic', () => {
          this.hotkeyExec(['Italic']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.strike', () => {
          this.hotkeyExec(['Strike']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.task', () => {
          this.hotkeyExec(['Task']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.ul', () => {
          this.hotkeyExec(['UL']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.ol', () => {
          this.hotkeyExec(['OL']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.blockquote', () => {
          this.hotkeyExec(['Blockquote']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.code', () => {
          this.hotkeyExec(['Code']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.codeblock', () => {
          this.hotkeyExec(['CodeBlock']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.indent', () => {
          this.hotkeyExec(['Indent']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.outdent', () => {
          this.hotkeyExec(['Outdent']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.hr', () => {
          this.hotkeyExec(['HR']);
        })
      );
      this.disposables.push(
        vscode.commands.registerCommand('markdown-live.toggleMode', () => {
          this.toggleEditorMode();
        })
      );

      Utils.context.subscriptions.push(Config.onDidChange_editor_settings(this.updateEditorSettings.bind(this)));
      this.updateEditorSettings();
      this.updateRemarkSettings();
    } catch (e) {
      console.log(e);
    }
  }

  updateEditorSettings() {
    if (this.panel.active) {
      this.panel.webview.postMessage({ command: 'settings', settings: Config.settings.get('editor') });
    } else {
      this.updateSettingsNeeded = true;
    }
  }

  updateRemarkSettings() {
    const remarkSettingsFile = 'remark_settings.json';
    const remarkSettingsCommand = 'remarkSettings';
    const fp = path.join(Config.folderPath, remarkSettingsFile);
    if (fs.existsSync(fp)) {
      try {
        const data = fs.readFileSync(fp, { encoding: 'utf8' });
        const obj = JSON.parse(data);
        this.panel.webview.postMessage({ command: remarkSettingsCommand, settings: obj });
        return;
      } catch (e) {
        const msg = e.message;
        console.log(msg);
        vscode.window.showWarningMessage('Failed to load remark_settings.json file. \nNo Unotes remark formatting will be done.');
      }
    }
    this.panel.webview.postMessage({ command: remarkSettingsCommand, settings: null });
  }

  hotkeyExec(args: any) {
    if (this.panel.active) {
      this.panel.webview.postMessage({ command: 'exec', args });
    }
  }

  toggleEditorMode() {
    if (this.panel.active) {
      this.panel.webview.postMessage({ command: 'toggleMode' });
    }
  }

  saveChanges(content: any) {
    if (this.currentNote) {
      this.writingFile = this.currentNote;
      fs.writeFileSync(this.currentNote, content, 'utf8');
    }
  }

  showUNote(unote: any) {
    try {
      this.currentNote = unote;
      this.updateContents();
      const title = unote.replace(/^.*[\\\/]/, '');
      this.panel.title = 'Markdown - ' + title;
    } catch (e) {
      console.log(e);
    }
  }

  updateContents() {
    try {
      if (this.currentNote) {
        const content = fs.readFileSync(this.currentNote, 'utf8');
        //const folderPath = vscode.Uri.file(path.join(Config.rootPath, this.currentNote.folderPath)).path;
        this.panel.webview.postMessage({ command: 'setContent', content, folderPath: '', contentPath: this.currentNote });
      }
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Removes the given image data from the content,
   * saves an image, puts a relative image path in its place
   * @returns the new content, or blank if a failure happends
   */
  convertImage(content: any, image: any) {
    try {
      if (this.currentNote) {
        const noteFolder = path.join(Config.rootPath, this.currentNote.folderPath);
        let found = 0;

        // get a unique image index
        let index = Utils.getNextImageIndex(noteFolder);

        // replace the embedded image with a relative file
        let newContent = content.replace(image, (d: any) => {
          let match = /data:image\/(.*);base64,(.*)$/g.exec(d);

          if (match) {
            // write the file
            const size: number = match[2].length;
            const fill: string = match[2];
            const fname = Utils.saveMediaImage(noteFolder, new (Buffer.alloc as any)(size, fill, 'base64'), index++, match[1]);

            found++;
            // replace the content with the the relative path
            return Utils.getImageTagUrl(fname);
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

  updateFileIfOpen(filePath: any) {
    // update our view if an external change happens
    if (this.currentNote == filePath && filePath != this.writingFile) {
      // if the view is active then load now else flag to reload on showing
      if (this.panel.active) {
        this.updateContents();
      } else {
        this.reloadContentNeeded = true;
      }
      return true;
    }
    this.writingFile = '';
    return false;
  }

  switchIfOpen(oldNote: any, newNote: any) {
    if (this.currentNote == oldNote) {
      this.showUNote(newNote);
    }
  }

  closeIfOpen(filePath: any) {
    if (filePath == this.currentNote) {
      NotesEditor.close();
    }
  }

  checkCurrentFile() {
    if (!fs.existsSync(this.currentNote)) {
      NotesEditor.close();
    }
  }

  dispose() {
    _currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  getWebviewContent() {
    const mainScript = '/static/js/main.js';
    const mainStyle = '/static/css/main.css';

    const scriptPathOnDisk = vscode.Uri.file(path.join(this.extensionPath, 'build', mainScript));
    const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);
    const stylePathOnDisk = vscode.Uri.file(path.join(this.extensionPath, 'build', mainStyle));
    const styleUri = this.panel.webview.asWebviewUri(stylePathOnDisk);
    const baseUri = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'build')));

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();
    //<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: data:; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' vscode-resource: data:;style-src vscode-resource: 'unsafe-inline' http: https: data:;">

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>Markdown Live</title>
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: http: https: data:; script-src 'unsafe-inline' 'unsafe-eval' vscode-resource: data:;style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${baseUri}/">
			</head>

			<body class="unotes-common">
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <script>
          (function() {
            window.vscode = acquireVsCodeApi();
          }())
        </script>
				<div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
