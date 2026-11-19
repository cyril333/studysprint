// ============================================================
// StudySprint - Seed Script
// ============================================================
// Creates a default admin account for demonstration.
// Run with: node seed.js
// ============================================================
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const ADMIN_DATA = {
  fullName: 'System Administrator',
  email: 'admin@studysprint.com',
  username: 'admin',
  password: 'Admin@123',
  role: 'admin'
};

function seed() {
  // Check if admin already exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_DATA.username);

  if (existing) {
    console.log('[Seed] Admin account already exists. Skipping.');
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(ADMIN_DATA.password, salt);

  db.prepare(`
    INSERT INTO users (fullName, email, username, password, role, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(
    ADMIN_DATA.fullName,
    ADMIN_DATA.email,
    ADMIN_DATA.username,
    hashedPassword,
    ADMIN_DATA.role
  );

  console.log('[Seed] Default admin account created:');
  console.log('       Email:    admin@studysprint.com');
  console.log('       Username: admin');
  console.log('       Password: Admin@123');
}

seed();
process.exit(0);
