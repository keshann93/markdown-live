import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Class that host the tui-editor as an external web content
 */
export default class ContentProvider {
  getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  getProdContent(extensionPath: string, panel: vscode.WebviewPanel) {
    const mainScript = '/static/js/main.js';
    const mainStyle = '/static/css/main.css';

    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'build', mainScript));
    const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);
    const stylePathOnDisk = vscode.Uri.file(path.join(extensionPath, 'build', mainStyle));
    const styleUri = panel.webview.asWebviewUri(stylePathOnDisk);
    const baseUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'build')));

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();
    //<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: data:; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' vscode-resource: data:;style-src vscode-resource: 'unsafe-inline' http: https: data:;">

    return `
    <!DOCTYPE html>
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
			</html>
    `;
  }

  getContent(extensionPath: string, panel: vscode.WebviewPanel) {
    return this.getProdContent(extensionPath, panel);
  }
}
