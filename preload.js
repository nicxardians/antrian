/**
 * preload.js — Context Bridge
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInfo: () => ipcRenderer.invoke('get-info'),
  openConsole: () => ipcRenderer.send('open-console'),
  openDisplay: () => ipcRenderer.send('open-display'),
  openBrowserConsole: () => ipcRenderer.send('open-browser-console'),
  openBrowserDisplay: () => ipcRenderer.send('open-browser-display'),
  onStateUpdate: (cb) => ipcRenderer.on('state-update', (_, data) => cb(data)),
});
