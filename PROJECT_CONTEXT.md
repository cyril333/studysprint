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

## 3. Tech Stack Architecture
- **Frontend:** React 18 (Vite), React Router DOM v6, Axios, Custom CSS Tokens.
- **Backend:** Node.js + Express.js REST API.
- **Database:** SQLite (`better-sqlite3`), database file at `server/studysprint.db`.
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken` for auth tokens.
- **Host Binding:** `127.0.0.1` (loopback avoids university/campus firewall restrictions).

---

## 4. Default Seed Accounts
| Role | Email / Login | Username | Password |
|---|---|---|---|
| Admin | `admin@studysprint.com` | `admin` | `Admin@123` |
| Student | *(Register a new account at `/register`)* | — | — |

---

## 5. Upcoming Next Steps for Increment 2
When starting Increment 2 on your laptop, the roadmap features are:
1. **Feature 2 (FR-002): Subject, Topic, and Notes Management**
   - Create tables: `subjects`, `topics`, `notes`.
   - UI to organize subjects and paste/upload digital text notes.
2. **Feature 3 (FR-003): AI Quiz Generation**
   - Integration with external LLM API (Gemini / Claude API).
   - Generate 10 multiple-choice questions from notes within 30 seconds.
3. **Feature 4 (FR-004): Quiz Taking & Automated Scoring**
   - Interactive quiz interface with timer, scoring, and history attempts table.
4. **Cloud Database (Optional Upgrade):**
   - Connect backend to Supabase / PostgreSQL when preparing for final deployment on Render.
