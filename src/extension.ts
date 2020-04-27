// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MarkdownLiveEditorProvider } from './markdown-live-editor-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "markdown-live" is now active!');

  // Register our custom editor provider
  MarkdownLiveEditorProvider.register();
}

// this method is called when your extension is deactivated
export function deactivate() {}
