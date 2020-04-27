import * as vscode from 'vscode';
import * as path from 'path';

export class MarkdownLiveEditor {
  private disposables: vscode.Disposable[] = [];
  private ignoreContentChanges = false;

  constructor(private document: vscode.TextDocument, private webviewPanel: vscode.WebviewPanel) {
    webviewPanel.webview.options = { enableScripts: true };

    webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case 'ready':
          this.whenCustomEditorReady(document, webviewPanel);
          break;
        case 'changeContent':
          this.changedFileContent(e.payload);
          break;
      }
    });

    webviewPanel.webview.html = this.getEditorAsHtml(webviewPanel);
  }

  private whenCustomEditorReady(document: vscode.TextDocument, panel: vscode.WebviewPanel): void {
    // initial text from document
    panel.webview.postMessage({
      type: 'init',
      payload: document.getText(),
    });

    // listen for changes and send over
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document !== this.document) {
          return;
        }

        if (this.ignoreContentChanges) {
          return;
        }

        panel.webview.postMessage({
          type: 'updateContent',
          payload: document.getText(),
        });
      })
    );
  }

  private getEditorAsHtml(webviewPanel: vscode.WebviewPanel): string {
    return `
		<html>
			<head>
				
			<!-- Styles -->
				<link rel="stylesheet" href="https://uicdn.toast.com/tui-editor/latest/tui-editor.css"></link>
				<link rel="stylesheet" href="https://uicdn.toast.com/tui-editor/latest/tui-editor-contents.css"></link>
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.4/codemirror.css"></link>
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/github.min.css"></link>
			<!-- Editor's Plugin -->
				<script src="https://uicdn.toast.com/editor-plugin-chart/1.0.0/toastui-editor-plugin-chart.min.js"></script>
				<script src="https://uicdn.toast.com/editor-plugin-code-syntax-highlight/1.0.0/toastui-editor-plugin-code-syntax-highlight-all.min.js"></script>
				<script src="https://uicdn.toast.com/editor-plugin-color-syntax/1.0.0/toastui-editor-plugin-color-syntax.min.js"></script>
				<script src="https://uicdn.toast.com/editor-plugin-table-merged-cell/1.0.0/toastui-editor-plugin-table-merged-cell.min.js"></script>
				<script src="https://uicdn.toast.com/editor-plugin-uml/1.0.0/toastui-editor-plugin-uml.min.js"></script>
			<!-- Scripts -->
				<script src="https://uicdn.toast.com/tui-editor/latest/tui-editor-Editor-full.js"></script>
			</head>	
			<body>
				<div id="editorSection"></div>
				<script src="${webviewPanel.webview.asWebviewUri(vscode.Uri.file(path.resolve(__dirname, '..', 'ui', 'markdownEditor.js')))}"></script>
			</body>
		</html>`;
  }

  private changedFileContent(newContent: string): void {
    if (newContent === this.document.getText()) {
      return; // ignore changes that are not a change actually
    }

    (async () => {
      this.ignoreContentChanges = true;
      try {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          this.document.uri,
          this.document.validateRange(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(999999, 999999))),
          newContent
        );
        await vscode.workspace.applyEdit(edit);
      } finally {
        this.ignoreContentChanges = false;
      }
    })();
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.disposables = [];
  }
}
