const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Note: In production, you might want to use contextIsolation: true for security
    }
  });

  // Load your HTML file with the Tailwind CDN
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Standard Electron window handling code...
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});