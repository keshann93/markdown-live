// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Manager from './Manager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "markdown-live" is now active!');

  // Register our custom editor provider
  // MarkdownLiveEditorProvider.register(context);
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  const manager = new Manager(context);

  let markdownDisposable = vscode.commands.registerCommand('markdown-live.showMarkdown', () => {
    manager.enablePreview();
  });
  let heading1 = vscode.commands.registerCommand('markdown-live.heading.1', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Heading', 1]);
    }
  });

  let heading2 = vscode.commands.registerCommand('markdown-live.heading.2', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Heading', 2]);
    }
  });

  let heading3 = vscode.commands.registerCommand('markdown-live.heading.3', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Heading', 3]);
    }
  });

  let heading4 = vscode.commands.registerCommand('markdown-live.heading.4', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Heading', 4]);
    }
  });

  let heading5 = vscode.commands.registerCommand('markdown-live.heading.5', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Heading', 5]);
    }
  });

  let heading6 = vscode.commands.registerCommand('markdown-live.heading.6', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Heading', 6]);
    }
  });

  let paragraph = vscode.commands.registerCommand('markdown-live.normal', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Paragraph']);
    }
  });

  let bold = vscode.commands.registerCommand('markdown-live.bold', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Bold']);
    }
  });

  let italic = vscode.commands.registerCommand('markdown-live.italic', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Italic']);
    }
  });

  let strike = vscode.commands.registerCommand('markdown-live.strike', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Strike']);
    }
  });

  let task = vscode.commands.registerCommand('markdown-live.task', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Task']);
    }
  });

  let ul = vscode.commands.registerCommand('markdown-live.ul', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['UL']);
    }
  });

  let ol = vscode.commands.registerCommand('markdown-live.ol', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['OL']);
    }
  });

  let blockQuote = vscode.commands.registerCommand('markdown-live.blockquote', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Blockquote']);
    }
  });

  let code = vscode.commands.registerCommand('markdown-live.code', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Code']);
    }
  });

  let codeBlock = vscode.commands.registerCommand('markdown-live.codeblock', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['CodeBlock']);
    }
  });

  let indent = vscode.commands.registerCommand('markdown-live.indent', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Indent']);
    }
  });

  let outdent = vscode.commands.registerCommand('markdown-live.outdent', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['Outdent']);
    }
  });

  let hr = vscode.commands.registerCommand('markdown-live.hr', () => {
    if (currentPanel) {
      manager.hotkeyExec(currentPanel, ['HR']);
    }
  });

  vscode.commands.registerCommand('markdown-live.toggleScrollSync', () => {
    if (currentPanel) {
      manager.toggleScrollSync();
    }
  });

  // event subscription

  let saveTextDocument = vscode.workspace.onDidSaveTextDocument(document => {
    if (document) {
      manager.textDocumentChange(document);
    }
  });

  let textDocChange = vscode.workspace.onDidChangeTextDocument(({ document }) => {
    if (document) {
      manager.textDocumentChange(document);
    }
  });

  let configChange = vscode.workspace.onDidChangeConfiguration(() => {
    manager.updateConfiguration();
  });

  let textEditorSelectionChange = vscode.window.onDidChangeTextEditorSelection(event => {
    if (event) {
      manager.textEditorSelectionChange(event);
    }
  });

  let visibleRangeChange = vscode.window.onDidChangeTextEditorVisibleRanges(event => {
    if (event) {
      manager.visibleRangeChange(event);
    }
  });

  let textEditorChange = vscode.window.onDidChangeActiveTextEditor(textEditor => {
    if (textEditor && textEditor.document && textEditor.document.uri) {
      manager.textEditorChange(textEditor);
    }
  });

  // Register commands
  context.subscriptions.push(markdownDisposable);
  context.subscriptions.push(saveTextDocument);
  context.subscriptions.push(textDocChange);
  context.subscriptions.push(configChange);
  context.subscriptions.push(textEditorChange);
  context.subscriptions.push(textEditorSelectionChange);
  context.subscriptions.push(visibleRangeChange);
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
