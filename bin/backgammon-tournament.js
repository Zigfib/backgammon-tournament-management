
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this package is installed
const packageDir = path.dirname(__dirname);
const buildDir = path.join(packageDir, 'build');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory not found. Please run: npm run build');
  process.exit(1);
}

console.log('🎲 Starting Backgammon Tournament Manager...');
console.log('Open your browser to: http://localhost:3000');
console.log('Press Ctrl+C to stop the server\n');

// Start the server
const server = spawn('npx', ['serve', '-s', buildDir, '-l', '3000'], {
  cwd: packageDir,
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Backgammon Tournament Manager...');
  server.kill('SIGINT');
  process.exit(0);
});

server.on('error', (error) => {
  console.error('Error starting server:', error.message);
  process.exit(1);
});
