// Dark Falcon 🦅 Desktop Preload Script (Context Isolation)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('DarkFalconDesktop', {
  isDesktop: true,
  getPlatform: () => ipcRenderer.invoke('dark-falcon:get-platform'),
  getVersion: () => ipcRenderer.invoke('dark-falcon:get-app-version'),
  setBadgeCount: (count) => ipcRenderer.send('dark-falcon:set-badge', count),
  minimizeWindow: () => ipcRenderer.send('dark-falcon:window-minimize'),
  maximizeWindow: () => ipcRenderer.send('dark-falcon:window-maximize'),
  closeWindow: () => ipcRenderer.send('dark-falcon:window-close'),
  onTriggerLock: (callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on('dark-falcon:trigger-lock', subscription);
    return () => ipcRenderer.removeListener('dark-falcon:trigger-lock', subscription);
  },
});
