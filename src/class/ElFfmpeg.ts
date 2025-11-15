/**
 * ElFfmpeg.ts
 *
 * ElFfmpeg
 * ElFfmpeg operation for electron
 * updated: 2025/08/24
 **/

'use strict';

// define modules
import { statSync } from 'node:fs'; // file system
import { execFile } from "child_process";
import { promisify } from "util";

// ffmpeg class
class ElFfmpeg {
  static logger: any; // static logger
  static execFileAsync: any; // exec

  // construnctor
  constructor(logger: any) {
    // logger setting
    ElFfmpeg.logger = logger;
    // set exec
    ElFfmpeg.execFileAsync = promisify(execFile);
  }

  // merge audios
  mergeAudio(
    filePaths: string[],
    outputPath: string,
    timeout: number,
    maxBuffer: number
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // merge commands
        let finalFiles: string[] = [];
        let fileCommands: string[] = [];
        let outCommands: string = '';

        // loop for files
        filePaths.forEach((file: any) => {
          // file info
          const fileInfo: any = statSync(file);
          if (fileInfo.size > 0) {
            finalFiles.push(file);
          }
        });
        console.log(finalFiles);
        // file length
        const fileLength: number = finalFiles.length;

        // loop for files
        for (let i = 0; i < fileLength; i++) {
          // file info
          const fileInfo: any = statSync(finalFiles[i]);
          // filesize is over 0
          if (fileInfo.size > 0) {
            fileCommands.push("-i");
            fileCommands.push(finalFiles[i]);
            outCommands += `[${i}:a]`;
          }
        }
        outCommands += `concat=n=${fileLength}:v=0:a=1`;

        // arguments
        const args = [
          "-y",
          fileCommands,
          "-filter_complex",
          outCommands,
          outputPath,
        ];

        // exec conversion
        await ElFfmpeg.execFileAsync("ffmpeg", args.flat(), {
          timeout: timeout,
          maxBuffer: maxBuffer,
        });
        // finish
        resolve();

      } catch (e: any) {
        // error
        ElFfmpeg.logger.error(e);
        resolve();
      }
    });
  }

  // convert to m4a
  convertAudioToM4a(
    inputPath: string,
    outputPath: string,
    timeout: number,
    maxBuffer: number
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // arguments
        const args = [
          "-y",
          "-i",
          inputPath,
          "-c:a",
          "aac",
          "-b:a",
          "96k",
          outputPath,
        ];

        // exec conversion
        await ElFfmpeg.execFileAsync("ffmpeg", args, {
          timeout: timeout,
          maxBuffer: maxBuffer,
        });
        // finish
        resolve();

      } catch (e: any) {
        // error
        ElFfmpeg.logger.error(e);
        resolve();
      }
    });
  }
}

// export module
export default ElFfmpeg;
