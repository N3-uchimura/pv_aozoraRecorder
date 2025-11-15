/**
 * ElDialog.ts
 *
 * name：ElDialog
 * function：Dialog operation for electron
 * updated: 2025/07/21
 **/

'use strict';

/// import modules
import { dialog } from 'electron'; // electron

// ElectronDialog class
class Dialog {
  static logger: any; // static logger

  // construnctor
  constructor(logger: any) {
    // logger setting
    Dialog.logger = logger;
    Dialog.logger.debug('dialog: initialize mode');
  }

  /// show question
  // show yes/no
  showQuetion(title: string, message: string, detail: string): number {
    try {
      Dialog.logger.debug('dialog: showQuetion started.');
      // quetion message option
      const options: Electron.MessageBoxSyncOptions = {
        type: 'question',
        title: title,
        message: message,
        detail: detail,
        buttons: ['yes', 'no'],
        cancelId: -1 // Esc
      };
      // selected number
      const selected: number = dialog.showMessageBoxSync(options);
      Dialog.logger.debug('dialog: showQuetion finished.');
      // return selected
      return selected;
    } catch (e) {
      // error
      Dialog.logger.error(e);
      return 99;
    }
  }

  // show message
  showmessage(type: string, message: string) {
    try {
      Dialog.logger.debug('dialog: showmessage started.');
      // mode
      let tmpType:
        | 'none'
        | 'info'
        | 'error'
        | 'question'
        | 'warning'
        | undefined;
      // title
      let tmpTitle: string | undefined;

      // url
      switch (type) {
        // info mode
        case 'info':
          tmpType = 'info';
          tmpTitle = 'info';
          break;

        // error mode
        case 'error':
          tmpType = 'error';
          tmpTitle = 'error';
          break;

        // warning mode
        case 'warning':
          tmpType = 'warning';
          tmpTitle = 'warning';
          break;

        // others
        default:
          tmpType = 'none';
          tmpTitle = '';
      }

      // options
      const options: Electron.MessageBoxOptions = {
        type: tmpType, // type
        message: tmpTitle, // title
        detail: message // description
      };
      // show dialog
      dialog.showMessageBox(options);
      Dialog.logger.debug('dialog: showmessage finished.');
    } catch (e) {
      Dialog.logger.error(e);
    }
  }
}

// export module
export default Dialog;
