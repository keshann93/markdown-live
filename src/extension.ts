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
  const manager = new Manager(context);

  let markdownDisposable = vscode.commands.registerCommand('markdown-live.showMarkdown', () => {
    manager.enablePreview();
  });
  let heading1 = vscode.commands.registerCommand('markdown-live.heading.1', () => {
    manager.hotkeyExec(['Heading', 1]);
  });

  let heading2 = vscode.commands.registerCommand('markdown-live.heading.2', () => {
    manager.hotkeyExec(['Heading', 2]);
  });

  let heading3 = vscode.commands.registerCommand('markdown-live.heading.3', () => {
    manager.hotkeyExec(['Heading', 3]);
  });

  let heading4 = vscode.commands.registerCommand('markdown-live.heading.4', () => {
    manager.hotkeyExec(['Heading', 4]);
  });

  let heading5 = vscode.commands.registerCommand('markdown-live.heading.5', () => {
    manager.hotkeyExec(['Heading', 5]);
  });

  let heading6 = vscode.commands.registerCommand('markdown-live.heading.6', () => {
    manager.hotkeyExec(['Heading', 6]);
  });

  let paragraph = vscode.commands.registerCommand('markdown-live.normal', () => {
    manager.hotkeyExec(['Paragraph']);
  });

  let bold = vscode.commands.registerCommand('markdown-live.bold', () => {
    manager.hotkeyExec(['Bold']);
  });

  let italic = vscode.commands.registerCommand('markdown-live.italic', () => {
    manager.hotkeyExec(['Italic']);
  });

  let strike = vscode.commands.registerCommand('markdown-live.strike', () => {
    manager.hotkeyExec(['Strike']);
  });

  let task = vscode.commands.registerCommand('markdown-live.task', () => {
    manager.hotkeyExec(['Task']);
  });

  let ul = vscode.commands.registerCommand('markdown-live.ul', () => {
    manager.hotkeyExec(['UL']);
  });

  let ol = vscode.commands.registerCommand('markdown-live.ol', () => {
    manager.hotkeyExec(['OL']);
  });

  let blockQuote = vscode.commands.registerCommand('markdown-live.blockquote', () => {
    manager.hotkeyExec(['Blockquote']);
  });

  let code = vscode.commands.registerCommand('markdown-live.code', () => {
    manager.hotkeyExec(['Code']);
  });

  let codeBlock = vscode.commands.registerCommand('markdown-live.codeblock', () => {
    manager.hotkeyExec(['CodeBlock']);
  });

  let indent = vscode.commands.registerCommand('markdown-live.indent', () => {
    manager.hotkeyExec(['Indent']);
  });

  let outdent = vscode.commands.registerCommand('markdown-live.outdent', () => {
    manager.hotkeyExec(['Outdent']);
  });

  let hr = vscode.commands.registerCommand('markdown-live.hr', () => {
    manager.hotkeyExec(['HR']);
  });

  vscode.commands.registerCommand('markdown-live.toggleScrollSync', () => {
    manager.toggleScrollSync();
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
