# IT342 – Systems Integration and Architecture 1
## Project Development 3 — Implementation / Completion Report

| Field | Value | Field | Value |
|---|---|---|---|
| **System Name** | StudySprint: An AI-Assisted Study Planner and Quiz Generator | **Student Name** | Antolijao, Ave Cyril G. |
| **Section** | IT342-G01 | **Increment** | Project Development 3 – Core System Features Implementation |
| **GitHub Repository** | [https://github.com/cyril333/studysprint](https://github.com/cyril333/studysprint) | **Date Submitted** | 11/26/2026 |

---

## 1. Project Overview
**StudySprint** is an AI-assisted web application engineered to help college and senior high school students organize study schedules, structure lecture notes, and assess their learning through automated practice quizzes and progress analytics.

- **Core features for this increment:** Subject/Topic/Notes Management (`FR-002`), AI Quiz Generation (`FR-003`), Interactive Quiz Taking & Scoring (`FR-004`), and Admin Content Moderation (`FR-010`).
- **Additional features implemented:** Study Session Scheduling (`FR-005`), Progress Analytics Dashboard (`FR-008`), and Collaborative Quiz Sharing (`FR-009`).

---

## 2. Features Implemented in This Increment

### 2.1 Previously Completed Features (Increments 1 & 2 — Preserved & Operational)
| Feature | SRS ID | Status | Notes |
|---|---|---|---|
| **Account Registration, Login & Logout** | `FR-001` | **Complete** | Real-time validation, `bcrypt` hashing (10 salt rounds), JWT authentication (24h), suspension checks, and logout. |
| **Role-Based User Dashboards & RBAC** | `FR-001`, `FR-010` | **Complete** | Dedicated Student (`/student/dashboard`) and Admin (`/admin/dashboard`) views with frontend/backend route guards. |
| **User Profile & Password Management** | `FR-001` | **Complete** | Profile editing (`/profile`), current-password verification, and single-use cryptographic reset tokens (`/forgot-password`, `/reset-password`). |

### 2.2 Core System Features (Mandatory — Must Have)
| Feature | SRS ID | Status | Implementation Summary |
|---|---|---|---|
| **Subject, Topic & Notes Management** | `FR-002` | **Complete** | Hierarchical workspace (`/student/notes`) supporting full CRUD for Subjects, Sub-topics, and digital text/file (`.pdf`/`.txt`/`.md`) Notes stored under the user's profile. |
| **AI Quiz Generation & Draft Review** | `FR-003` | **Complete** | Generates 10-question MCQs and study summaries from note content in under 30 seconds (`Gemini LLM API` when configured + built-in deterministic NLP Concept & Cloze Engine). Students can edit prompts, options, and answers before saving. |
| **Interactive Quiz Taking & Auto-Scoring** | `FR-004` | **Complete** | Interactive quiz runner (`/student/quizzes/:id`) with automatic grading, immediate per-question feedback/explanations, and persistent attempt history (`quiz_attempts`). |
| **Admin Content Moderation** | `FR-010` | **Complete** | Dedicated moderation queue (`/admin/moderation`) where admins inspect shared and flagged quizzes, dismiss false flags, or permanently delete inappropriate content. |

### 2.3 Additional System Features (Should Have / Could Have)
| Feature | SRS ID | Priority | Status | Implementation Summary |
|---|---|---|---|---|
| **Study Session Scheduling** | `FR-005` | Should Have | **Complete** | Built-in scheduler (`/student/schedule`) to plan, track, and complete study blocks linked to Subjects and Topics. |
| **Progress Analytics Dashboard** | `FR-008` | Could Have | **Complete** | Student Dashboard (`/student/dashboard`) displays live SQLite metrics: Active Study Days, Quizzes Taken, Notes Uploaded, Average Score, and Per-Subject Accuracy bars. |
| **Collaborative Quiz Sharing** | `FR-009` | Could Have | **Complete** | Generates unique `shareToken` URLs (`/shared-quiz/:shareToken`) so classmates can attempt shared quizzes and report inappropriate quizzes for moderation. |

---

## 3. User Roles, Flows & CRUD Operations

### 3.1 User Roles and Access
| Role | Capabilities in Increment 3 |
|---|---|
| **Student** | Create/edit/delete own Subjects, Topics, and Notes; generate, review, and save AI Quizzes; take quizzes and view historical scores; schedule/complete study sessions; share quizzes and flag inappropriate shared quizzes. |
| **Admin** | View system-wide quiz & moderation metrics; inspect all shared and flagged quizzes on `/admin/moderation`; dismiss flags or remove inappropriate shared quizzes; manage user accounts. |

### 3.2 Database Models (SQLite)
| Model / Table | Key Fields | Relationships & Constraints |
|---|---|---|
| `subjects` | `id, userId, name, code, description, createdAt, updatedAt` | FK: `userId → users(id) ON DELETE CASCADE` |
| `topics` | `id, subjectId, userId, name, createdAt, updatedAt` | FK: `subjectId → subjects(id) ON DELETE CASCADE`, `userId → users(id)` |
| `notes` | `id, topicId, userId, title, content, createdAt, updatedAt` | FK: `topicId → topics(id) ON DELETE CASCADE`, `userId → users(id)` |
| `quizzes` | `id, noteId, userId, title, summary, shareToken, isShared, isFlagged, flagReason, createdAt` | FK: `noteId → notes(id) ON DELETE CASCADE`, `shareToken UNIQUE` |
| `questions` | `id, quizId, prompt, options, correctIndex, explanation` | FK: `quizId → quizzes(id) ON DELETE CASCADE` |
| `quiz_attempts` | `id, quizId, userId, score, totalQuestions, percentage, answers, completedAt` | FK: `quizId → quizzes(id) ON DELETE CASCADE`, `userId → users(id)` |
| `study_sessions` | `id, userId, subjectId, topicId, title, scheduledAt, durationMinutes, status, createdAt` | FK: `userId → users(id) ON DELETE CASCADE` |

---

## 4. Key Files Added / Updated
| Layer | File Path(s) |
|---|---|
| **Database** | `server/config/database.js` |
| **Backend Logic & Routes** | `server/utils/quizGenerator.js`, `server/routes/subjects.js`, `server/routes/quizzes.js`, `server/routes/sessions.js`, `server/routes/dashboard.js`, `server/routes/users.js`, `server/index.js` |
| **Frontend Pages & Routing** | `client/src/pages/StudentNotes.jsx`, `client/src/pages/StudentQuizzes.jsx`, `client/src/pages/QuizRunner.jsx`, `client/src/pages/StudentSchedule.jsx`, `client/src/pages/AdminModeration.jsx`, `client/src/pages/StudentDashboard.jsx`, `client/src/pages/AdminDashboard.jsx`, `client/src/components/Navbar.jsx`, `client/src/App.jsx`, `client/src/App.css` |
| **Automated Tests** | `server/test_increment3.js` (19/19 integration tests passing), `server/test_increment2.js` (13/13 passing) |

---

## 5. Verification & Test Results
- **Frontend Production Build:** `npx vite build` succeeded with 0 errors (`122 modules transformed`).
- **Automated Backend Integration Suite (`npm test`):** All **19 end-to-end tests** passed, verifying registration, subject/topic/note CRUD, 10-question quiz generation (`<30s`), quiz editing & saving, automatic grading (10/10 = 100%), study session scheduling, live dashboard analytics, collaborative quiz sharing, flagging, RBAC (403 enforcement), and admin moderation removal.
