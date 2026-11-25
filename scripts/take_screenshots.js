const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('[1/4] Starting backend server...');
  const server = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..', 'server'),
    stdio: 'ignore'
  });

  // Wait 3 seconds for server to start
  await sleep(3000);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pages = [
    { name: '01_login_forgot_password_link.png', url: 'http://127.0.0.1:5000/login' },
    { name: '02_forgot_password_view.png', url: 'http://127.0.0.1:5000/forgot-password' },
    { name: '03_reset_password_view.png', url: 'http://127.0.0.1:5000/reset-password' }
  ];

  for (const page of pages) {
    console.log(`[Screenshot] Capturing ${page.name}...`);
    const targetFile = path.join(outDir, page.name);
    await new Promise((resolve) => {
      const proc = spawn(edgePath, [
        '--headless',
        '--disable-gpu',
        '--window-size=1280,800',
        `--screenshot=${targetFile}`,
        page.url
      ]);
      proc.on('close', resolve);
    });
  }

  server.kill();
  console.log('[Done] Base screenshots captured.');
}

run().catch(console.error);
