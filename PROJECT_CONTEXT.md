# StudySprint - AI Context & Handover Summary

This file preserves the full architectural context, design decisions, and state of **StudySprint** so you can continue development seamlessly on any laptop or device with any AI assistant.

---

## 1. Project Background & Scope
- **Project Title:** StudySprint: An AI-Assisted Study Planner and Quiz Generator
- **Author:** Ave Cyril G. Antolijao
- **Course:** IT342-G01 Systems Integration and Architecture 1 (CIT-U)
- **Repository:** `https://github.com/cyril333/studysprint`

---

## 2. Completed in Increment 1 (User Accounts & Authentication)
- **User Account Creation:**
  - Real-time client-side & server-side validation (Full Name, Email format, Username format, Password min 8 chars, Confirm Password).
  - Duplicate account prevention on email and username (HTTP 409).
  - Secure password hashing using **bcrypt** (10 salt rounds).
  - Persistent SQLite storage (`users` table).
  - Default role: `student` (with seeded `admin` account).
- **User Login & Logout:**
  - Authenticates by Email OR Username + Password.
  - Generates stateless **JWT** (24h validity).
  - Protected route middleware (`authenticate` and `authorize`).
  - Account suspension checks on login attempt.
  - Complete logout clearing auth state and redirection.
- **Role-Based Access Control (RBAC) & Dashboards:**
  - **Student Dashboard (`/student/dashboard`):** Personalized student stats (streak, quizzes taken, notes uploaded, quick actions).
  - **Admin Dashboard (`/admin/dashboard`):** System metrics (total, active, suspended users), recent registration tables.
  - **Admin User Management (`/admin/users`):** Live search/filtering, suspend/activate account actions.
  - Route guards blocking students from accessing admin pages.
- **Design System & Landing Page:**
  - 10-section landing page matching the 1440px wireframe layout.
  - Warm craft/parchment aesthetic (`#ede3d1` background, `#3b2a1a` buttons, `#92400e` accents).
  - Typography: `Host Grotesk` (display) and `IBM Plex Mono` (body/technical).
  - Zero-radius sharp corners across all buttons, cards, and inputs.

---

## 3. Completed in Increment 2 (User Profile & Password Management)
- **User Profile Management (`/profile`):**
  - Authenticated view for user identity details, monogram avatar initials, role badge, status badge, and member since date.
  - Real-time inline validation on Full Name, Email, and Username.
  - Backend API (`PUT /api/users/profile`) enforcing uniqueness on email and username across accounts.
  - Global `AuthContext` state updates immediately reflecting profile edits across Navbar and headers.
  - Strict ownership access control preventing unauthorized modifications to other users' profiles.
- **Change Password Functionality:**
  - Dedicated "Password & Security" tab inside `/profile`.
  - Verification of current password hash via `bcrypt.compareSync()`.
  - Validation enforcing 8+ character length, password confirmation match, and prevention of reusing current password.
  - Secure hashing and database update with instant feedback.
- **Reset Password (Forgot Password Flow):**
  - "Forgot password?" recovery link directly on Login page (`/login`).
  - Forgot Password interface (`/forgot-password`) accepting registered email or username.
  - Backend cryptographic 32-byte token generation stored in `password_resets` table with 30-minute expiration.
  - Token verification endpoint (`GET /api/auth/verify-reset-token/:token`).
  - Reset Password interface (`/reset-password?token=...`) allowing users to establish a new password.
  - Single-use token invalidation (`used = 1`) immediately after successful reset to prevent replay attacks.
- **Automated Integration Test Suite:**
  - 13-point end-to-end automated integration test suite (`server/test_increment2.js`, executable via `npm test` in `server`).
- **Official Documentation & Completion Report:**
  - Accomplished Project Increment Completion Report with tables, CRUD analysis, rules, and labeled screenshots in `docs/Increment-2-Completion-Report.pdf` and `docs/StudySprint-Antolijao-AveCyril-IT342G01-PD2.pdf`.

---

## 4. Tech Stack Architecture
- **Frontend:** React 18 (Vite), React Router DOM, Axios, Custom CSS Tokens.
- **Backend:** Node.js + Express.js REST API.
- **Database:** SQLite (`better-sqlite3`), database file at `server/studysprint.db`.
  - Tables: `users`, `password_resets`.
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken` for auth tokens, `crypto` for cryptographic tokens.
- **Host Binding:** `127.0.0.1` (loopback avoids campus firewall restrictions).

---

## 5. Default Seed Accounts
| Role | Email / Login | Username | Password |
|---|---|---|---|
| Admin | `admin@studysprint.com` | `admin` | `Admin@123` |
| Student | `student@studysprint.com` | `student1` | `Student@123` |

---

## 6. Upcoming Next Steps for Increment 3
1. **Feature 2 (FR-002): Subject, Topic, and Notes Management**
   - Create tables: `subjects`, `topics`, `notes`.
   - UI to organize subjects and paste/upload digital text notes.
2. **Feature 3 (FR-003): AI Quiz Generation**
   - Integration with external LLM API (Gemini / Claude API).
   - Generate 10 multiple-choice questions from notes within 30 seconds.
3. **Feature 4 (FR-004): Quiz Taking & Automated Scoring**
   - Interactive quiz interface with timer, scoring, and history attempts table.
