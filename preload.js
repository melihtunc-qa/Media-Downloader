// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    downloadVideo: (data) => ipcRenderer.send('download-video', data),
    onDownloadStatus: (callback) => {
        ipcRenderer.on('download-status', callback);
    },
    onDownloadComplete: (callback) => {
        ipcRenderer.on('download-complete', () => callback());
    },
    cancelDownload: () => ipcRenderer.send('cancel-download')
});
