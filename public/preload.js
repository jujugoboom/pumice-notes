const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  listDirectory: (dir, create = false) =>
    ipcRenderer.invoke("listDirectory", dir, create),
  readFile: (file, create = false) =>
    ipcRenderer.invoke("readFile", file, create),
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  saveFile: (file, content) => ipcRenderer.invoke("saveFile", file, content),
  openBrowser: (url) => ipcRenderer.invoke("openBrowser", url),
  deleteFile: (file) => ipcRenderer.invoke("deleteFile", file),
  createFolder: (folder) => ipcRenderer.invoke("createFolder", folder),
});
