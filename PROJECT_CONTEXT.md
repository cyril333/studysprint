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

## 4. Completed in Increment 3 (Core System Features)
- **Subject, Topic & Notes Management (`FR-002`):**
  - Hierarchical workspace (`/student/notes`) with full CRUD for `subjects`, `topics`, and `notes`.
  - Supports pasting notes OR uploading `.pdf` (parsed via `multer` + `pdf-parse` on `POST /api/subjects/extract-pdf`), `.txt`, `.md`, and `.csv` files.
- **AI Quiz Generation & Draft Review (`FR-003`):**
  - `server/utils/quizGenerator.js` generates 10-question MCQs + study summary in `<30s`.
  - Uses Google Gemini (`GEMINI_API_KEY` in `server/.env`) when configured, with an automatic deterministic NLP Concept & Cloze Engine fallback.
  - Students can edit generated quiz titles, summaries, prompts, options, and correct answers before saving (`quizzes` + `questions`).
- **Quiz Taking & Auto-Scoring (`FR-004`):**
  - Interactive runner (`/student/quizzes/:id`), automatic grading (`POST /api/quizzes/:id/attempt`), immediate feedback/explanations, and `quiz_attempts` history.
- **Study Session Scheduling (`FR-005`), Progress Analytics (`FR-008`), Quiz Sharing (`FR-009`) & Admin Moderation (`FR-010`):**
  - `/student/schedule` (`study_sessions`), live SQLite analytics on `/student/dashboard`, shareable quiz links (`/shared-quiz/:shareToken`), and `/admin/moderation` queue for flagged quizzes.

---

## 5. Tech Stack Architecture
- **Frontend:** React 18 (Vite), React Router DOM, Axios, Custom CSS Tokens.
- **Backend:** Node.js + Express.js REST API (`multer`, `pdf-parse@1.1.1`).
- **Database:** SQLite (`better-sqlite3`), database file at `server/studysprint.db`.
  - Tables: `users`, `password_resets`, `subjects`, `topics`, `notes`, `quizzes`, `questions`, `quiz_attempts`, `study_sessions`.
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken` for auth tokens, `crypto` for cryptographic tokens.
- **Host Binding:** `127.0.0.1` (loopback avoids campus firewall restrictions).

---

## 6. Default Seed Accounts (`node server/seed.js`)
| Role | Email / Login | Username | Password |
|---|---|---|---|
| Admin | `admin@studysprint.com` | `admin` | `Admin@123` |
| Student | `student@studysprint.com` | `student` | `Student@123` |

---

## 7. Next Steps When Resuming on Laptop
1. Run `git pull origin main` (or `increment-3`), then `npm install` in both `server/` and `client/`, and `node server/seed.js`.
2. Optional: Add `GEMINI_API_KEY=your_key` to `server/.env` to switch quiz generation from the built-in NLP engine to live Gemini AI.
3. Optional Final Deployment tasks: Google OAuth 2.0 & Calendar Sync (`FR-001`, `FR-006`), FCM Push Reminders (`FR-007`), and Cloud PostgreSQL/Supabase + Render hosting.
