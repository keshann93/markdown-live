import * as vscode from 'vscode';

type SupportedFiletypes = 'markdown' | '';

export default class Manager {
  // These are protected to allow unit test access because manager is extended
  protected activeEditor: vscode.TextEditor | undefined;
  protected panel: vscode.WebviewPanel;
  protected languageId: SupportedFiletypes = '';

  constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;

    vscode.window.onDidChangeActiveTextEditor(activeEditor => {
      const languageId = activeEditor ? activeEditor.document.languageId : undefined;

      if (languageId === 'markdown') {
        this.activeEditor = activeEditor;
        this.languageId = languageId;
      }
    });

    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      if (this.isAcceptableLaguage(document.languageId as SupportedFiletypes)) {
        this.parseFromActiveEditor();
      }
    });

    vscode.window.onDidChangeTextEditorSelection(({ textEditor }) => {
      if (textEditor && this.isAcceptableLaguage(textEditor.document.languageId as SupportedFiletypes)) {
        this.activeEditor = textEditor;
        this.parseFromActiveEditor();
      }
    });
  }

  isAcceptableLaguage(languageId: SupportedFiletypes): boolean {
    return languageId === 'markdown';
  }

  parseFromActiveEditor(): void {
    if (this.activeEditor && !this.panel.active) {
      const activeFileContent = this.activeEditor.document.getText();
      this.panel.webview.postMessage({
        command: 'setContent',
        content: activeFileContent,
        folderPath: '',
        contentPath: this.activeEditor.document.fileName,
      });
    }
  }

  async updateActiveBlock(value: string) {
    if (this.activeEditor && this.activeEditor.document.getText() !== value) {
      const firstLine = this.activeEditor.document.lineAt(0);
      const lastLine = this.activeEditor.document.lineAt(this.activeEditor.document.lineCount - 1);
      const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
      await this.activeEditor.edit(editBuilder => {
        editBuilder.replace(textRange, value);
      });
    }
  }

  static hotkeyExec(panel: vscode.WebviewPanel, args: any) {
    if (panel.active) {
      panel.webview.postMessage({ command: 'exec', args });
    }
  }
}
