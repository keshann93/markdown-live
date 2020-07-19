// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import ContentProvider from './ContentProvider';
import { join } from 'path';
import Manager from './Manager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "markdown-live" is now active!');

  // Register our custom editor provider
  // MarkdownLiveEditorProvider.register(context);
  const contentProvider = new ContentProvider();
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let rootPath: string = '';
  let markdownDisposable = vscode.commands.registerCommand('markdown-live.showMarkdown', () => {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length == 0) {
      rootPath = '';
    } else {
      rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }

    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Two);
    } else {
      currentPanel = vscode.window.createWebviewPanel('markdown', 'Markdown-live', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(rootPath)), vscode.Uri.file(path.join(context.extensionPath, 'build'))],
      });
    }

    currentPanel.webview.html = contentProvider.getContent(context.extensionPath, currentPanel);

    const root = join(context.extensionPath, 'icons');
    currentPanel.iconPath = {
      dark: vscode.Uri.file(join(root, 'icon-light.png')),
      light: vscode.Uri.file(join(root, 'icon-dark.png')),
    };

    const manager = new Manager(currentPanel);

    currentPanel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'applyChanges':
            manager.updateActiveBlock(message.content);
            break;
          case 'editorOpened':
            // manager.updateActiveBlock(this.currentNote);
            console.log('opened');
            break;
          default:
            console.log('Unknown webview message received:');
            console.log(message);
        }
        // manager.updateActiveBlock(message.prop, message.value, message.type);
      },
      undefined,
      context.subscriptions
    );

    currentPanel.onDidDispose(
      () => {
        currentPanel = undefined;
      },
      null,
      context.subscriptions
    );
  });

  let heading1 = vscode.commands.registerCommand('markdown-live.heading.1', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Heading', 1]);
    }
  });

  let heading2 = vscode.commands.registerCommand('markdown-live.heading.2', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Heading', 2]);
    }
  });

  let heading3 = vscode.commands.registerCommand('markdown-live.heading.3', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Heading', 3]);
    }
  });

  let heading4 = vscode.commands.registerCommand('markdown-live.heading.4', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Heading', 4]);
    }
  });

  let heading5 = vscode.commands.registerCommand('markdown-live.heading.5', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Heading', 5]);
    }
  });

  let heading6 = vscode.commands.registerCommand('markdown-live.heading.6', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Heading', 6]);
    }
  });

  let paragraph = vscode.commands.registerCommand('markdown-live.normal', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Paragraph']);
    }
  });

  let bold = vscode.commands.registerCommand('markdown-live.bold', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Bold']);
    }
  });

  let italic = vscode.commands.registerCommand('markdown-live.italic', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Italic']);
    }
  });

  let strike = vscode.commands.registerCommand('markdown-live.strike', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Strike']);
    }
  });

  let task = vscode.commands.registerCommand('markdown-live.task', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Task']);
    }
  });

  let ul = vscode.commands.registerCommand('markdown-live.ul', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['UL']);
    }
  });

  let ol = vscode.commands.registerCommand('markdown-live.ol', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['OL']);
    }
  });

  let blockQuote = vscode.commands.registerCommand('markdown-live.blockquote', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Blockquote']);
    }
  });

  let code = vscode.commands.registerCommand('markdown-live.code', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Code']);
    }
  });

  let codeBlock = vscode.commands.registerCommand('markdown-live.codeblock', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['CodeBlock']);
    }
  });

  let indent = vscode.commands.registerCommand('markdown-live.indent', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Indent']);
    }
  });

  let outdent = vscode.commands.registerCommand('markdown-live.outdent', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['Outdent']);
    }
  });

  let hr = vscode.commands.registerCommand('markdown-live.hr', () => {
    if (currentPanel) {
      Manager.hotkeyExec(currentPanel, ['HR']);
    }
  });

  context.subscriptions.push(markdownDisposable);
  // Register commands
  context.subscriptions.push(heading1);
  context.subscriptions.push(heading2);
  context.subscriptions.push(heading3);
  context.subscriptions.push(heading4);
  context.subscriptions.push(heading5);
  context.subscriptions.push(heading6);
  context.subscriptions.push(paragraph);
  context.subscriptions.push(bold);
  context.subscriptions.push(italic);
  context.subscriptions.push(strike);
  context.subscriptions.push(task);
  context.subscriptions.push(ul);
  context.subscriptions.push(ol);
  context.subscriptions.push(blockQuote);
  context.subscriptions.push(code);
  context.subscriptions.push(codeBlock);
  context.subscriptions.push(indent);
  context.subscriptions.push(outdent);
  context.subscriptions.push(hr);
}

// this method is called when your extension is deactivated
export function deactivate() {}
