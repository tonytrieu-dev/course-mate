const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

// Handle opening syllabus files
ipcMain.on('view-syllabus', async (event, syllabusData) => {
  try {
    console.log('Received request to view syllabus');
    
    // Create a temporary file path to save the syllabus
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `syllabus-${Date.now()}.pdf`);
    
    // Convert data URL to buffer
    const base64Data = syllabusData.split(';base64,').pop();
    
    // Write to temporary file
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
    
    // Open file with default system application
    shell.openPath(tempFilePath);
    
    console.log(`Opened syllabus at ${tempFilePath}`);
  } catch (error) {
    console.error('Error opening syllabus:', error);
  }
});

app.whenReady().then(createWindow);

// Standard Electron window handling code...
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});