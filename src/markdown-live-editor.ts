import * as vscode from 'vscode';
import * as path from 'path';
import NotesEditor from './notes-editor';

export class MarkdownLiveEditor {
  private disposables: vscode.Disposable[] = [];
  private ignoreContentChanges = false;

  constructor(private document: vscode.TextDocument, private webviewPanel: vscode.WebviewPanel, private context: vscode.ExtensionContext) {
    NotesEditor.createOrShow(this.context.extensionPath, webviewPanel, document);
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.disposables = [];
  }
}
