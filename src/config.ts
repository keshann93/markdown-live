import * as vscode from 'vscode';
import { Settings } from 'http2';

/**
 * The class used as interface definition for the list of configs defined in package
 */
export class MarkdownLiveConfig {
  // function to initiate the constructor with values from package.json
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

  // function to compare on the values to override if updated
  public isEqualTo(otherConfig: MarkdownLiveConfig) {
    const json1 = JSON.stringify(this);
    const json2 = JSON.stringify(otherConfig);
    return json1 === json2;
  }
}
