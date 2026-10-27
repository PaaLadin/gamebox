const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 640,
    minHeight: 500,
    backgroundColor: '#0a0a12',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
    title: 'GameBox',
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'app', 'games.html'));
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });