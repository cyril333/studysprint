const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const puppeteer = require('../server/node_modules/puppeteer-core');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('[1/5] Starting backend server...');
  const server = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..', 'server'),
    stdio: 'ignore'
  });

  await sleep(2500);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('[2/5] Launching Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // 1. Login Page
    console.log('[3/5] Navigating to /login...');
    await page.goto('http://127.0.0.1:5000/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(outDir, '01_login_page.png') });

    // 2. Forgot Password Page
    console.log('[Screenshot] Forgot Password Request...');
    await page.goto('http://127.0.0.1:5000/forgot-password', { waitUntil: 'networkidle0' });
    await page.type('#loginInput', 'admin@studysprint.com');
    await page.click('button[type="submit"]');
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, '02_forgot_password_token_generated.png') });

    // 3. Reset Password View
    console.log('[Screenshot] Reset Password View...');
    const continueBtn = await page.$('.token-preview-card button');
    if (continueBtn) {
      await continueBtn.click();
      await sleep(1500);
      await page.screenshot({ path: path.join(outDir, '03_reset_password_view.png') });
    }

    // 4. Login as Admin
    console.log('[Screenshot] Login as Admin & Go to Profile...');
    await page.goto('http://127.0.0.1:5000/login', { waitUntil: 'networkidle0' });
    await page.type('#login', 'admin');
    await page.type('#password', 'Admin@123');
    await page.click('button[type="submit"]');
    await sleep(2000);

    // 5. Profile Details Page
    await page.goto('http://127.0.0.1:5000/profile', { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.screenshot({ path: path.join(outDir, '04_user_profile_details.png') });

    // 6. Profile Edit Success
    await page.click('#fullName', { clickCount: 3 });
    await page.type('#fullName', 'System Administrator (Active)');
    const saveBtn = await page.$('form button[type="submit"]');
    if (saveBtn) await saveBtn.click();
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, '05_profile_updated_success.png') });

    // 7. Password & Security Tab
    const securityTab = (await page.$$('.tab-btn'))[1];
    if (securityTab) {
      await securityTab.click();
      await sleep(1000);

      // Validation Error: Mismatched passwords
      await page.type('#currentPassword', 'Admin@123');
      await page.type('#newPassword', 'NewAdminPass123!');
      await page.type('#confirmNewPassword', 'DifferentPass999!');
      const updatePwBtn = await page.$('form button[type="submit"]');
      if (updatePwBtn) await updatePwBtn.click();
      await sleep(1000);
      await page.screenshot({ path: path.join(outDir, '06_password_validation_error.png') });

      // Password Change Success
      await page.click('#confirmNewPassword', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type('#confirmNewPassword', 'NewAdminPass123!');
      if (updatePwBtn) await updatePwBtn.click();
      await sleep(1500);
      await page.screenshot({ path: path.join(outDir, '07_password_change_success.png') });
    }

    console.log('[4/5] All screenshots captured successfully in docs/screenshots/');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('[5/5] Teardown complete.');
  }
}

run();
