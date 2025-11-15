/**
 * preload.ts
 **
 * function：ipc bridge
**/

'use strict';

// module
import { contextBridge, ipcRenderer } from 'electron'; // electron

// contextBridge
contextBridge.exposeInMainWorld(
    "api", {
    // send to ipcMain
    send: (channel: string, data: any) => {
        try {
            ipcRenderer.send(channel, data);

        } catch (e) {
            console.log(e);
        }
    },
    // recieve from ipcMain
    on: (channel: string, func: any) => {
        try {
            ipcRenderer.on(channel, (_, ...args) => func(...args));

        } catch (e) {
            console.log(e);
        }
    }
}
);
