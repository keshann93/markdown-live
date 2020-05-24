'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

import * as vscode from 'vscode';
import * as path from 'path';

const extId = 'markdown-live';

export default class NotesConfig {
  public settings: any;
  public rootPath: any;
  public folderPath: any;
  public noteFileExtension: any;
  public mediaFolder: any;
  public mediafolder: any;
  public _onDidChange_editor_settings: any;
  public onDidChange_editor_settings: any;

  constructor() {
    this.settings = vscode.workspace.getConfiguration(extId);

    // media folder
    const defaultMediaFolder = '.media';
    this.mediaFolder = this.settings.get('mediaFolder', defaultMediaFolder);
    if (!this.mediaFolder) {
      this.mediafolder = defaultMediaFolder;
    }

    // setting change events
    this._onDidChange_editor_settings = new vscode.EventEmitter();
    this.onDidChange_editor_settings = this._onDidChange_editor_settings.event;
  }

  onChange(e: any) {
    if (e.affectsConfiguration(extId)) {
      this.settings = vscode.workspace.getConfiguration(extId);
      // fire events
      const editorPath = extId + '.editor';
      if (e.affectsConfiguration(editorPath)) {
        this._onDidChange_editor_settings.fire();
        if (e.affectsConfiguration(editorPath + '.display2X')) {
        }
      }
    }
  }
} // NotesConfig
