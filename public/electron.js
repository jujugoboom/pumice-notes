const path = require('path');

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs/promises');
const {constants, read} = require('fs');
const isDev = require('electron-is-dev');

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({properties: ['openDirectory']})
  if (canceled) {
    return
  } else {
    return filePaths[0]
  }
}

async function listDirectory(_event, dirname, create=false) {
  try {
    await fs.access(dirname, constants.F_OK);
  } catch {
    if (create) {
      await fs.mkdir(dirname);
    } else {
      return false;
    }
  }
  try {
    let files = await fs.readdir(dirname, {withFileTypes: true});
    let res = [];
    for (let file of files) {
      if (file.isFile() && !file.name.endsWith('.md')) {
        continue;
      }
      res.push({
        name: file.name,
        path: `${dirname}/${file.name}`,
        file: file.isFile(),
        directory: file.isDirectory(),
      });
    }
    return res;
  } catch {
    console.error("Error opening dir");
    return false;
  } 
}

async function readFile(_e, file, create=false) {
  try {
    await fs.access(file, constants.F_OK);
  } catch {
    console.error("Unable to open file")
    if (create) {
      await fs.writeFile(file, '');
    } else {
      return false;
    }
  }
  try {
    return await fs.readFile(file, 'utf-8');
  } catch {
    return false;
  }
}

async function saveFile(_e, file, content) {
  try {
    await fs.access(file, constants.W_OK);
  } catch {
    return false;
  }
  try {
    await fs.writeFile(file, content);
  } catch {
    return false;
  }
}

function openBrowser(_e, url) {
  shell.openExternal(url);
}

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle("dialog:openFile", handleFileOpen);
  ipcMain.handle('listDirectory', listDirectory);
  ipcMain.handle('readFile', readFile);
  ipcMain.handle('saveFile', saveFile);
  ipcMain.handle('openBrowser', openBrowser);
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});