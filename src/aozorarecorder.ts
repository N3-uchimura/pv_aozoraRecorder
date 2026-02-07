/*
 * aozorarecorder.ts
 *
 * aozorarecorder - aozora recording tools -
 **/

'use strict';

/// Constants
// namespace
import { myConst, myNums, mySynthesis } from './consts/globalvariables';

/// Modules
import * as path from 'node:path'; // path
import { createWriteStream, existsSync } from 'node:fs'; // file system
import { readFile, writeFile, readdir } from 'node:fs/promises'; // promise fs
import { exec } from 'child_process'; // child process
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import axios from 'axios'; // http communication
import iconv from 'iconv-lite'; // Text converter
import { promisify } from 'util'; // promisify
import * as stream from 'stream'; // steramer
import NodeCache from "node-cache"; // node-cache
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0721'; // dialog
import FileManage from './class/ELFileManage1025'; // file operation

// log level
const LOG_LEVEL: string = myConst.LOG_LEVEL ?? 'all';
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.COMPANY_NAME, myConst.APP_NAME, LOG_LEVEL);
// dialog instance
const dialogMaker: Dialog = new Dialog(logger);
// filemanage instance
const fileManager = new FileManage(logger);
// cache instance
const cacheMaker: NodeCache = new NodeCache();

/// interfaces
// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

/*
 main
*/
// main window
let mainWindow: Electron.BrowserWindow;
// quit flg
let isQuiting: boolean;
// global path
let globalRootPath: string;

// set rootpath
if (!myConst.DEVMODE) {
  globalRootPath = path.join(path.resolve(), 'resources');
} else {
  globalRootPath = path.join(__dirname, '..');
}
// file root path
const fileRootPath: string = path.join(globalRootPath, 'file');

// create main window
const createWindow = (): void => {
  try {
    // window options
    const windowOptions: windowOption = {
      width: myNums.WINDOW_WIDTH, // window width
      height: myNums.WINDOW_HEIGHT, // window height
      defaultEncoding: myConst.DEFAULT_ENCODING, // encoding
      webPreferences: {
        nodeIntegration: false, // node
        contextIsolation: true, // isolate
        preload: path.join(__dirname, "preload.js"), // preload
      }
    }
    // Electron window
    mainWindow = new BrowserWindow(windowOptions);
    // hide menubar
    mainWindow.setMenuBarVisibility(false);
    // index.html load
    mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // ready
    mainWindow.once('ready-to-show', () => {
      // dev mode
      if (!app.isPackaged) {
        //mainWindow.webContents.openDevTools();
      }
    });

    // close window
    mainWindow.on('close', (event: any): void => {
      // not closing
      if (!isQuiting && process.platform !== 'darwin') {
        // quit
        app.quit();
        // return false
        event.returnValue = false;
      }
    });

    // closing
    mainWindow.on('closed', (): void => {
      // destroy window
      mainWindow.destroy();
    });

  } catch (e: unknown) {
    logger.error(e);
  }
}

// enable sandbox
app.enableSandbox();

// main app
app.on('ready', async () => {
  try {
    logger.info('app: electron is ready');
    // create window
    createWindow();
    // menu label
    let displayLabel: string = '';
    // close label
    let closeLabel: string = '';
    // txt path
    const languageTxtPath: string = path.join(globalRootPath, 'assets', 'language.txt');
    // not exists
    if (!existsSync(languageTxtPath)) {
      logger.debug('app: making txt ...');
      // make txt file
      await writeFile(languageTxtPath, 'japanese');
    }
    // get language
    const language = await readFile(languageTxtPath, 'utf8');
    logger.debug(`language is ${language}`);
    // japanese
    if (language == 'japanese') {
      // set menu label
      displayLabel = '表示';
      // set close label
      closeLabel = '閉じる';
    } else {
      // set menu label
      displayLabel = 'show';
      // set close label
      closeLabel = 'close';
    }
    // cache
    cacheMaker.set('language', language);

    // make root dir
    await fileManager.mkDir(fileRootPath);
    // make file dir
    await fileManager.mkDirAll([path.join(fileRootPath, 'source'), path.join(fileRootPath, 'output'), path.join(fileRootPath, 'backup'), path.join(fileRootPath, 'partial')]);
    // icons
    const icon: Electron.NativeImage = nativeImage.createFromPath(path.join(globalRootPath, 'assets', 'aozora.ico'));
    // tray
    const mainTray: Electron.Tray = new Tray(icon);
    // context menu
    const contextMenu: Electron.Menu = Menu.buildFromTemplate([
      // show
      {
        label: displayLabel,
        click: () => {
          mainWindow.show();
        }
      },
      // close
      {
        label: closeLabel,
        click: () => {
          app.quit();
        }
      }
    ]);
    // context menu
    mainTray.setContextMenu(contextMenu);
    // Wclick reopen
    mainTray.on('double-click', () => mainWindow.show());

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// activate
app.on('activate', () => {
  // no window
  if (BrowserWindow.getAllWindows().length === 0) {
    // reload
    createWindow();
  }
});

// close
app.on('before-quit', () => {
  // turn on close flg
  isQuiting = true;
});

// end
app.on('window-all-closed', () => {
  logger.info('app: close app');
  // exit
  app.quit();
});

/*
 IPC
*/
// ready
ipcMain.on("beforeready", async (event: any, _) => {
  logger.info("app: beforeready app");
  // models
  let models: any = [];
  // get all models
  const modelsArray: any = await getModelsRequest();
  // set models
  modelsArray.forEach((model: any) => {
    models.push(model[1].model_path.split('\\')[1]);
  })
  // language
  const language = cacheMaker.get('language') ?? '';
  // be ready
  event.sender.send("ready", {
    language: language,
    models: models,
  });
});

// open
ipcMain.on('open', async (_: any, __: any): Promise<void> => {
  try {
    logger.info('app: open dir');
    // switch on OS
    const command = process.platform === 'win32' ? `explorer "${fileRootPath}"` :
      process.platform === 'darwin' ? `open "${fileRootPath}"` :
        `xdg-open "${fileRootPath}"`;
    // open root dir
    exec(command);

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// record
ipcMain.on('record', async (event: any, arg: any) => {
  try {
    logger.info('ipc: record started.');
    // language
    const language: string = cacheMaker.get('language') ?? 'japanese';
    // connection test
    const testResult: string = await testRequest();
    // test result
    if (testResult == 'ng') {
      // japanese
      if (language == 'japanese') {
        throw new Error('通信エラー');
      } else {
        throw new Error('communication error');
      }
    }
    logger.debug('ipc: test is ok.');
    // subdir list
    const allDirents: any = await readdir(path.join(fileRootPath, 'source'), { withFileTypes: true });
    // remove all files
    await fileManager.rmDir(path.join(fileRootPath, 'partial'));
    // if empty
    if (allDirents.length == 0) {
      // japanese
      if (language == 'japanese') {
        throw new Error('file/sourceフォルダが空です');
      } else {
        throw new Error('file/source directory is empty');
      }
    }
    // file list
    const files: string[] = await readdir(path.join(fileRootPath, 'source'));
    // loop
    await Promise.allSettled(files.map(async (fl: string): Promise<void> => {
      return new Promise(async (resolve1, reject1) => {
        try {
          logger.silly(`record: operating ${fl}`);
          // filename
          const fileId: string = path.parse(fl).name;
          // save path
          const outDirPath: string = path.join(fileRootPath, 'partial', fileId);
          // make dir
          if (!existsSync(outDirPath)) {
            await fileManager.mkDir(outDirPath);
            logger.silly(`finished making.. ${outDirPath}`);
          }
          // file path
          const filePath: string = path.join(fileRootPath, 'source', fl);
          // file reading
          const txtdata: Buffer = await readFile(filePath);
          // decode
          const str: string = iconv.decode(txtdata, 'UTF8');
          logger.silly('record: char decoding finished.');
          // over 10000
          if (str.length > 10000) {
            // japanese
            if (language == 'japanese') {
              throw new Error('1万文字を超えています');
            } else {
              throw new Error('over 10,000 words.');
            }
          }
          // filename
          const tmpFileName = `${path.parse(fl).name}.wav`;
          // synthesis request
          await synthesisRequest(tmpFileName, str, arg, outDirPath);
          // complete
          resolve1();

        } catch (err3: unknown) {
          // error
          logger.error(err3);
          // reject
          reject1();
        }
      });
    }));
    // status message
    let finishedMessage: string = '';
    // switch on language
    if (language == 'japanese') {
      // set finish message
      finishedMessage = '完了しました';
    } else {
      // set finish message
      finishedMessage = 'Finished.';
    }
    // status
    event.sender.send('statusUpdate', {
      status: finishedMessage,
      target: ''
    });
    // finish message
    dialogMaker.showmessage('info', finishedMessage);
    // complete
    logger.info('ipc: operation finished.');

  } catch (e: unknown) {
    // error
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// config
ipcMain.on('config', async (event: any, _) => {
  try {
    logger.info('app: config app');
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // goto config page
    await mainWindow.loadFile(path.join(globalRootPath, 'www', 'config.html'));
    // language
    event.sender.send('confready', language);

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// save
ipcMain.on('save', async (event: any, arg: any) => {
  try {
    logger.info('app: save config');
    // language
    const language: string = String(arg.language);
    // txt path
    const languageTxtPath: string = path.join(globalRootPath, "assets", "language.txt");
    // make txt file
    await writeFile(languageTxtPath, language);
    // cache
    cacheMaker.set('language', language);
    // goto config page
    await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // language
    event.sender.send('ready', language);

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

ipcMain.on('top', async (event: any, _: any) => {
  try {
    logger.info('app: top');
    // goto config page
    await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // language
    const language = cacheMaker.get('language') ?? '';
    // language
    event.sender.send('ready', language);

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// exit
ipcMain.on('exit', async () => {
  try {
    logger.info('ipc: exit mode');
    // title
    let questionTitle: string = '';
    // message
    let questionMessage: string = '';
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // japanese
    if (language == 'japanese') {
      questionTitle = '終了';
      questionMessage = '終了していいですか';
    } else {
      questionTitle = 'exit';
      questionMessage = 'exit?';
    }
    // selection
    const selected: number = dialogMaker.showQuetion('question', questionTitle, questionMessage);

    // when yes
    if (selected == 0) {
      // close
      app.quit();
    }

  } catch (e: unknown) {
    logger.error(e);
  }
});

/*
 Functions
*/
// synthesis audio
const synthesisRequest = async (filename: string, text: string, modelname: string, outDir: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // pipe
      const finished = promisify(stream.finished);
      // query
      const query: any = new URLSearchParams(mySynthesis.params(text, modelname));
      // requestURL
      const requestUrl: string = `http://${myConst.HOSTNAME}:${myNums.PORT}/voice?${query}`;
      // file path
      const filePath: string = path.join(outDir, filename);
      // file writer
      const writer = createWriteStream(filePath);
      // GET request
      await axios({
        method: 'get',
        url: requestUrl,
        responseType: 'stream'

      }).then(async (response: any) => {
        // pipe
        await response.data.pipe(writer);
        // finish recording
        await finished(writer);
        // resolve
        resolve();

      }).catch((err: unknown) => {
        if (err instanceof Error) {
          // error
          throw new Error(err.message);
        }
      });

    } catch (e: unknown) {
      // error
      logger.error(e);
      reject();
    }
  });
}

// get models
const getModelsRequest = async (): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('get models started.');
      // requestURL
      const tmpUrl: string = `http://${myConst.HOSTNAME}:${myNums.PORT}/models/info`;
      // GET request
      await axios({
        method: 'get',
        url: tmpUrl,

      }).then(async (data: any) => {
        // get model data
        const pairs: [string, any][] = Object.entries(data.data);
        // return them
        resolve(pairs);

      }).catch((err: any) => {
        if (err instanceof Error) {
          // error
          throw new Error(err.message);
        }
      });

    } catch (e: unknown) {
      // error
      if (e instanceof Error) {
        // error
        logger.error(e);
        reject('ng');
      }
    }
  });
}

// test
const testRequest = async (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug(`test started.`);
      // requestURL
      const tmpUrl: string = `http://${myConst.HOSTNAME}:${myNums.PORT}/docs`;
      // GET request
      await axios({
        method: 'get',
        url: tmpUrl,

      }).then(async (_: any) => {
        // test ok
        resolve('ok');

      }).catch((err: unknown) => {
        if (err instanceof Error) {
          // error
          throw new Error(err.message);
        }
      });

    } catch (e: unknown) {
      // error
      logger.error(e);
      reject('ng');
    }
  });
}
