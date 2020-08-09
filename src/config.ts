import * as vscode from 'vscode';
import { Settings } from 'http2';

export class MarkdownLiveConfig {
  public static getCurrentConfig() {
    return new MarkdownLiveConfig();
  }

  public readonly scrollSync: boolean;
  public readonly automaticallyShowPreviewOfMarkdown: boolean;
  public readonly display2X: boolean;
  public readonly convertPastedImages: boolean;
  public readonly mediaFolder: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('markdown-live');

    this.scrollSync = <boolean>config.get<boolean>('scrollSync');
    this.automaticallyShowPreviewOfMarkdown = <boolean>config.get<boolean>('automaticallyShowPreviewOfMarkdown');
    this.display2X = <boolean>config.get<boolean>('display2X');
    this.convertPastedImages = <boolean>config.get<boolean>('convertPastedImages');
    this.mediaFolder = <string>config.get<string>('mediaFolder');
  }

  public isEqualTo(otherConfig: MarkdownLiveConfig) {
    const json1 = JSON.stringify(this);
    const json2 = JSON.stringify(otherConfig);
    return json1 === json2;
  }
}
