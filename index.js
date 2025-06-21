const { app, BrowserWindow } = require('electron');
const http = require('http');

function waitForServer(url, callback) {
  const tryConnect = () => {
    http.get(url, () => callback()).on('error', () => setTimeout(tryConnect, 500));
  };
  tryConnect();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Note: In production, you might want to use contextIsolation: true for security
    }
  });

  // Wait for the dev server to be ready before loading
  const devServerUrl = 'http://localhost:8080';
  waitForServer(devServerUrl, () => {
    mainWindow.loadURL(devServerUrl).catch(err => {
      console.error('Failed to load dev server:', err);
    });
  });
}

app.whenReady().then(createWindow);

// Standard Electron window handling code...

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});