const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...\n');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
if (fs.existsSync('dist-electron')) {
  fs.rmSync('dist-electron', { recursive: true, force: true });
}

// Build React app
console.log('\n📦 Building React application...');
try {
  execSync('npm run build:react', { stdio: 'inherit' });
  console.log('✅ React build completed successfully!');
} catch (error) {
  console.error('❌ React build failed:', error.message);
  process.exit(1);
}

// Check if dist folder was created
if (!fs.existsSync('dist')) {
  console.error('❌ Build failed: dist folder not created');
  process.exit(1);
}

// Copy main files to dist for electron-builder
console.log('\n📋 Copying Electron files...');
const filesToCopy = ['main-prod.js', 'preload.js', 'package.json'];
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    // For main-prod.js, rename it to main.js in dist
    const destFile = file === 'main-prod.js' ? 'main.js' : file;
    fs.copyFileSync(file, path.join('dist', destFile));
    console.log(`✅ Copied ${file} to dist/${destFile}`);
  }
});

console.log('\n🎉 Build preparation completed!');
console.log('\nTo package the app:');
console.log('  - For Windows: npm run dist:win');
console.log('  - For Linux: npm run dist:linux');
console.log('  - For both: npm run dist:all');