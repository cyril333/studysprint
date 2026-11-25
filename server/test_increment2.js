const express = require('express');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

async function runTests() {
  const http = require('http');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, '127.0.0.1', resolve));

  const BASE = 'http://127.0.0.1:5099/api';

  async function post(url, data, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE + url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return { status: res.status, data: await res.json() };
  }

  async function put(url, data, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE + url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return { status: res.status, data: await res.json() };
  }

  async function get(url, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE + url, { headers });
    return { status: res.status, data: await res.json() };
  }

  console.log('--- Starting Increment 2 Verification Tests ---');

  // Clean test user if exists
  db.prepare('DELETE FROM users WHERE email = ?').run('teststudent@studysprint.com');

  // 1. Register test student
  const regRes = await post('/auth/register', {
    fullName: 'Test Student',
    email: 'teststudent@studysprint.com',
    username: 'teststudent',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  });
  console.log('1. Registration:', regRes.status === 201 ? 'PASS' : 'FAIL', regRes.data.message);

  // 2. Login
  const loginRes = await post('/auth/login', {
    login: 'teststudent@studysprint.com',
    password: 'Password123!'
  });
  console.log('2. Login:', loginRes.status === 200 ? 'PASS' : 'FAIL');
  let token = loginRes.data.token;

  // 3. View Profile
  const profileRes = await get('/users/profile', token);
  console.log('3. View Profile:', profileRes.status === 200 && profileRes.data.user.email === 'teststudent@studysprint.com' ? 'PASS' : 'FAIL');

  // 4. Update Profile
  const updateRes = await put('/users/profile', {
    fullName: 'Test Student Renamed',
    email: 'teststudent@studysprint.com',
    username: 'teststudent_renamed'
  }, token);
  console.log('4. Update Profile:', updateRes.status === 200 && updateRes.data.user.fullName === 'Test Student Renamed' ? 'PASS' : 'FAIL');
  token = updateRes.data.token;

  // 5. Change Password - Incorrect current password check
  const badPwRes = await put('/users/change-password', {
    currentPassword: 'WrongPassword!',
    newPassword: 'BrandNewPassword123!',
    confirmNewPassword: 'BrandNewPassword123!'
  }, token);
  console.log('5. Reject Wrong Current Password:', badPwRes.status === 401 ? 'PASS' : 'FAIL', badPwRes.data.message);

  // 6. Change Password - Success
  const changePwRes = await put('/users/change-password', {
    currentPassword: 'Password123!',
    newPassword: 'BrandNewPassword123!',
    confirmNewPassword: 'BrandNewPassword123!'
  }, token);
  console.log('6. Change Password Success:', changePwRes.status === 200 ? 'PASS' : 'FAIL', changePwRes.data.message);

  // 7. Verify Old Password Fails
  const oldLoginRes = await post('/auth/login', {
    login: 'teststudent_renamed',
    password: 'Password123!'
  });
  console.log('7. Old Password Rejected:', oldLoginRes.status === 401 ? 'PASS' : 'FAIL');

  // 8. Verify New Password Succeeds
  const newLoginRes = await post('/auth/login', {
    login: 'teststudent_renamed',
    password: 'BrandNewPassword123!'
  });
  console.log('8. New Password Accepted:', newLoginRes.status === 200 ? 'PASS' : 'FAIL');

  // 9. Forgot Password Token Generation
  const forgotRes = await post('/auth/forgot-password', {
    login: 'teststudent@studysprint.com'
  });
  console.log('9. Forgot Password Token Generated:', forgotRes.status === 200 && !!forgotRes.data.token ? 'PASS' : 'FAIL');
  const resetToken = forgotRes.data.token;

  // 10. Verify Reset Token
  const verifyRes = await get('/auth/verify-reset-token/' + resetToken);
  console.log('10. Token Verification:', verifyRes.status === 200 && verifyRes.data.valid ? 'PASS' : 'FAIL');

  // 11. Reset Password with Token
  const resetRes = await post('/auth/reset-password', {
    token: resetToken,
    newPassword: 'ResetPasswordSuccess999!',
    confirmPassword: 'ResetPasswordSuccess999!'
  });
  console.log('11. Reset Password Success:', resetRes.status === 200 ? 'PASS' : 'FAIL', resetRes.data.message);

  // 12. Single-Use Token Invalidation Check
  const reuseRes = await post('/auth/reset-password', {
    token: resetToken,
    newPassword: 'AnotherPassword123!',
    confirmPassword: 'AnotherPassword123!'
  });
  console.log('12. Reused Token Rejected (Single-Use):', reuseRes.status === 400 ? 'PASS' : 'FAIL', reuseRes.data.message);

  // 13. Login with Reset Password
  const finalLoginRes = await post('/auth/login', {
    login: 'teststudent_renamed',
    password: 'ResetPasswordSuccess999!'
  });
  console.log('13. Final Login with Reset Password:', finalLoginRes.status === 200 ? 'PASS' : 'FAIL');

  server.close();
  console.log('--- All 13 Tests Finished ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
