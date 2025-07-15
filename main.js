const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

// Flag to determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png') // You'll need to add an icon
  });

  if (isDev) {
    // Development mode - connect to webpack dev server
    const devServerUrl = 'http://localhost:8080';
    waitForServer(devServerUrl, () => {
      mainWindow.loadURL(devServerUrl).catch(err => {
        console.error('Failed to load dev server:', err);
      });
    });
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
      console.error('Failed to load production build:', err);
    });
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
  });
}

app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});