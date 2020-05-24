import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as gl from 'glob';

import NotesConfig from './notes-config';

const imgPrefix = 'img_';
const Config = new NotesConfig();

export default class NotesUtil {
  context: any = null;

  constructor() {}

  /**
   * Returns the next image index in the media folder for the document folder
   */
  getNextImageIndex(folderPath: any) {
    let index = 0;
    const mediaPath = path.join(folderPath, Config.mediaFolder);
    if (!fs.existsSync(mediaPath)) {
      return 0;
    }
    const paths = gl.sync(`${imgPrefix}*.*`, { cwd: mediaPath, nodir: true, nocase: true });
    for (let i = 0; i < paths.length; ++i) {
      var re = new RegExp(`.*${imgPrefix}(\\d*)\\..*$`, 'g');
      let match = re.exec(paths[i]);
      if (match) {
        let val = parseInt(match[1]);
        if (index <= val) {
          index = val + 1;
        }
      }
    }
    return index;
  }

  /**
   * Saves an image buffer to a note media directory
   * @param folderPath the folder path of the note
   * @param imgBuffer the image Buffer to be written (base64)
   * @param index optional param for the suffix index number
   * @param imgType optional param for the image type
   */
  saveMediaImage(folderPath: any, imgBuffer: any, index: any, imgType: any) {
    let newIndex = index;
    const mediaPath = path.join(folderPath, Config.mediaFolder);

    // create the folder if needed
    if (!fs.existsSync(mediaPath)) {
      try {
        fs.mkdirSync(mediaPath);
      } catch (e) {
        vscode.window.showWarningMessage('Failed to create media folder.');
        return;
      }
    }
    if (index === undefined) {
      newIndex = this.getNextImageIndex(folderPath);
    }
    if (imgType === undefined) {
      imgType = 'png';
    }
    const imgName = `${imgPrefix}${newIndex}.${imgType}`;
    try {
      fs.writeFileSync(path.join(mediaPath, imgName), imgBuffer, 'base64');
    } catch (e) {
      vscode.window.showWarningMessage('Failed to save new media image.');
      return '';
    }
    return imgName;
  }

  getImageTag(imgName: any) {
    return `![${imgName}](${this.getImageTagUrl(imgName)})`;
  }

  getImageTagUrl(imgName: any) {
    return `${Config.mediaFolder}/${imgName}`;
  }
}
