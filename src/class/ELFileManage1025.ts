/**
 * ELFileManage.ts
 *
 * name：ELFileManage
 * function：file operation for electron
 * updated: 2025/10/25
 **/

'use strict';

// define modules
import * as path from 'node:path'; // path
import { promises, existsSync } from 'node:fs'; // file system
import { unlink, rmdir, readdir } from 'node:fs/promises'; // file 
// file system definition
const { mkdir } = promises;

// FileManage class
class FileManage {
  static logger: any; // static logger

  // construnctor
  constructor(logger: any) {
    // logger setting
    FileManage.logger = logger;
    FileManage.logger.debug('filemanage: mkdir initialized.');
  }

  // mkDir
  mkDir = async (dir: string): Promise<void> => {
    return new Promise(async (resolve, _) => {
      try {
        FileManage.logger.debug('filemanage: mkdir started.');
        // not exists
        if (!existsSync(dir)) {
          // make dir
          await mkdir(dir);

          FileManage.logger.debug('filemanage: mkdir completed.');
        } else {
          FileManage.logger.debug('already exists.');
        }
        resolve();
      } catch (err: unknown) {
        // error
        FileManage.logger.error(err);
        resolve();
      }
    });
  };

  // mkDirAll
  mkDirAll = async (dirs: string[]): Promise<void> => {
    return new Promise(async (resolve1, _) => {
      try {
        FileManage.logger.debug('filemanage: all mkdir started.');
        // make all dir
        Promise.all(
          dirs.map(async (dir: string): Promise<void> => {
            return new Promise(async (resolve2, _) => {
              try {
                // not exists
                if (!existsSync(dir)) {
                  // make dir
                  await mkdir(dir);
                  resolve2();
                } else {
                  // error
                  throw Error('already exists.');
                }
              } catch (err: unknown) {
                // error
                resolve2();
              }
            });
          })
        ).then(() => resolve1());
        FileManage.logger.debug('filemanage: mkDirAll started.');

        // make dir
      } catch (e: unknown) {
        // error
        FileManage.logger(e);
        resolve1();
      }
    });
  };

  // rmDir
  rmDir = async (dir: string): Promise<void> => {
    return new Promise(async (resolve1, _) => {
      try {
        FileManage.logger.debug('filemanage: rmDir started.');
        // dir not exists
        if (!existsSync(dir)) {
          FileManage.logger.debug('filemanage: dir not exists.');
          resolve1();
        }
        // directory list
        const tmpDirs: string[] = await readdir(dir);
        // empty
        if (tmpDirs.length == 0) {
          FileManage.logger.debug('filemanage: dir is empty.');
          resolve1();
        }
        // delete all files
        await Promise.all(tmpDirs.map((dr: string): Promise<void> => {
          return new Promise(async (resolve2, _) => {
            try {
              // txt file path
              const tmpTxtFiles: string[] = await readdir(path.join(dir, dr));
              console.log(tmpTxtFiles);
              // dir not exists
              if (!existsSync(dir)) {
                FileManage.logger.silly('filemanage: dir not exists.');
                resolve2();
              }
              // delete all files
              await Promise.all(tmpTxtFiles.map((file: string): Promise<void> => {
                return new Promise(async (resolve3, _) => {
                  try {
                    // target
                    const targetFile: string = path.join(dir, dr, file);
                    // dir not exists
                    if (!existsSync(targetFile)) {
                      resolve3();
                    }
                    // delete file
                    await unlink(path.join(dir, dr, file));
                    // result
                    resolve3();

                  } catch (err2: unknown) {
                    FileManage.logger.error(err2);
                  }
                })
              }));
              // delete empty dir
              await rmdir(path.join(dir, dr));
              resolve2();
            } catch (err: unknown) {
              // error
              FileManage.logger.error(err);
              resolve2();
            }
            FileManage.logger.debug('filemanage: rmDir end.');
            // result
            resolve1();
          });
        }));
      } catch (err: unknown) {
        // error
        FileManage.logger.error(err);
        resolve1();
      }
    });
  };
}

// export module
export default FileManage;
