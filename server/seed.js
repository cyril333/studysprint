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
  role: 'admin',
  bio: 'Platform system administrator maintaining user access.'
};

const STUDENT_DATA = {
  fullName: 'Cyril Antolijao',
  email: 'student@studysprint.com',
  username: 'student',
  password: 'Student@123',
  role: 'student',
  bio: 'Computer Science student focusing on automated study workflows.'
};

function seed() {
  const salt = bcrypt.genSaltSync(10);

  // Seed Admin
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_DATA.username);
  if (!existingAdmin) {
    const hashedAdmin = bcrypt.hashSync(ADMIN_DATA.password, salt);
    db.prepare(`
      INSERT INTO users (fullName, email, username, password, bio, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(ADMIN_DATA.fullName, ADMIN_DATA.email, ADMIN_DATA.username, hashedAdmin, ADMIN_DATA.bio, ADMIN_DATA.role);
    console.log('[Seed] Default admin account created (admin@studysprint.com / Admin@123)');
  } else {
    console.log('[Seed] Admin account already exists.');
  }

  // Seed Student
  const existingStudent = db.prepare('SELECT id FROM users WHERE username = ?').get(STUDENT_DATA.username);
  if (!existingStudent) {
    const hashedStudent = bcrypt.hashSync(STUDENT_DATA.password, salt);
    db.prepare(`
      INSERT INTO users (fullName, email, username, password, bio, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(STUDENT_DATA.fullName, STUDENT_DATA.email, STUDENT_DATA.username, hashedStudent, STUDENT_DATA.bio, STUDENT_DATA.role);
    console.log('[Seed] Default student account created (student@studysprint.com / Student@123)');
  } else {
    console.log('[Seed] Student account already exists.');
  }
}

seed();
process.exit(0);
