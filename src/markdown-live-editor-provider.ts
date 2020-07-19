// import * as vscode from 'vscode';
// import { MarkdownLiveEditor } from './markdown-live-editor';

// export class MarkdownLiveEditorProvider implements vscode.CustomTextEditorProvider {
//   private static readonly viewType = 'markdown-live.showMarkdown';
//   private docToMarkupMapper: Map<vscode.TextDocument, MarkdownLiveEditor> = new Map();

//   public static register(context: vscode.ExtensionContext): vscode.Disposable {
//     const provider = new MarkdownLiveEditorProvider(context);
//     const providerRegistration = vscode.window.registerCustomEditorProvider(MarkdownLiveEditorProvider.viewType, provider);
//     return providerRegistration;
//   }

//   constructor(private readonly context: vscode.ExtensionContext) {}

//   async resolveCustomTextEditor(
//     document: vscode.TextDocument,
//     webviewPanel: vscode.WebviewPanel,
//     _token: vscode.CancellationToken
//   ): Promise<void> {
//     let markdownEditor: any = this.docToMarkupMapper.get(document);
//     if (!markdownEditor) {
//       markdownEditor = new MarkdownLiveEditor(document, webviewPanel, this.context);
//       this.docToMarkupMapper.set(document, markdownEditor);

//       webviewPanel.onDidDispose(() => {
//         markdownEditor.dispose();
//         this.docToMarkupMapper.delete(document);
//       });
//     }
//   }
// }
