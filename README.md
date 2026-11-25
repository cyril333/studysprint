# StudySprint

**An AI-Assisted Study Planner and Quiz Generator**

A full-stack web application designed to help students manage study sessions more efficiently through automated quiz generation, intelligent study scheduling, and personalized performance tracking.

> **Course:** IT342 – Systems Integration and Architecture 1  
> **Institution:** Cebu Institute of Technology – University (CIT-U)  
> **Developer:** Cyril A. Antolijao

---

## Features (Project Increment 2 – User Profile & Password Management)

### User Profile Management
- View authenticated profile details (monogram initials, role, account status, member since date)
- Edit Full Name, Username, and Email Address with instant frontend and database synchronization
- Strict input validation and duplicate prevention (email & username uniqueness)
- Protected access preventing unauthorized modifications to other users' profiles

### Change Password
- Authenticated credential update located in Profile > Password & Security
- Mandatory verification of current password hash using bcrypt
- Enforced 8+ character length, confirmation matching, and prevention of reusing current password

### Reset Password (Forgot Password)
- "Forgot password?" recovery link directly on login screen
- Single-use, expiring (30 minutes) cryptographic token generation
- Token verification and reset password view for effortless credential recovery
- Single-use invalidation immediately upon reset completion to prevent replay attacks

### Automated Testing & Documentation
- 13-point automated integration test suite (`npm test` in `server/`)
- Accomplished Increment 2 Completion Report PDF in `docs/Increment-2-Completion-Report.pdf`

---

## Features (Project Increment 1)

### User Account Creation
- Register with full name, email, username, and password
- Real-time field validation with inline error messages
- Duplicate account prevention (email & username)
- Secure password hashing with **bcrypt** (10 salt rounds)
- Default **Student** role assignment on registration

### User Login & Logout
- Login with email or username + password
- JWT-based authentication with 24-hour token expiration
- Proper error messages for invalid credentials
- Suspended account detection
- Logout clears session and redirects to login
- Protected routes prevent unauthorized access

### Role-Based Dashboards
- **Student Dashboard**: Welcome greeting, study streak, quiz stats, quick actions (Upload Notes, Take Quiz, View Schedule)
- **Admin Dashboard**: System overview with total/active/suspended user stats, recent registrations table, user management link
- **Admin User Management**: View all users, search/filter, suspend/activate accounts
- Frontend & backend RBAC enforcement

---

## Features (Project Increment 2)

### User Profile Management
- Authenticated profile overview and edit screen (`/profile`)
- Update Full Name, Email, Username, and Bio with inline and server-side validation
- Prevention of duplicate email and username collisions across accounts
- Ownership-based authorization (users can only modify their own profile data)
- Instant client state synchronization across navigation headers and user monograms

### Change Password
- Authenticated password modification module inside `/profile`
- Required verification of current password hash using `bcrypt`
- Validation enforcing 8+ characters, match confirmation, and new password differentiation
- Secure password hashing and instant invalidation of previous password

### Reset Password (Forgot Password)
- "Forgot password?" recovery link on login screen
- Identity verification via registered email or username (`/forgot-password`)
- Single-use, 30-minute expiring cryptographically secure token generation in `password_resets` table
- Token verification endpoint (`/api/auth/verify-reset-token/:token`)
- Dedicated reset interface (`/reset-password?token=...`) with real-time validation
- Single-use token consumption (`used = 1`) preventing token replay attacks

---

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Frontend    | React 18 + Vite + React Router DOM  |
| Backend     | Node.js + Express.js                |
| Database    | SQLite (via better-sqlite3)         |
| Auth        | JWT (jsonwebtoken) + bcryptjs       |
| HTTP Client | Axios                               |
| Icons       | React Icons (Feather Icons)         |

---

## Setup & Installation

### Prerequisites
- **Node.js** (v18 or later)
- **npm** (comes with Node.js)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/cyril333/studysprint.git
cd studysprint
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file inside the `server/` folder:
```env
PORT=5000
JWT_SECRET=studysprint_jwt_secret_key_2026_secure
JWT_EXPIRES_IN=24h
```

### 4. Seed the Admin Account
```bash
node seed.js
```
This creates a default admin account:
| Field    | Value                  |
| -------- | ---------------------- |
| Email    | admin@studysprint.com  |
| Username | admin                  |
| Password | Admin@123              |

### 5. Start the Backend Server
```bash
npm start
```
*(Or `node index.js`). The API will run on `http://127.0.0.1:5000` (loopback avoids campus firewall warnings).*

### 6. Install Frontend Dependencies
Open a **new terminal**:
```bash
cd client
npm install
```

### 7. Start the Frontend Dev Server
```bash
npm run dev
```
The app will open at `http://localhost:5173`

---

## Project Structure

```
studysprint/
├── server/                    # Backend API
│   ├── config/
│   │   └── database.js        # SQLite database setup
│   ├── middleware/
│   │   └── auth.js            # JWT authentication & RBAC middleware
│   ├── routes/
│   │   ├── auth.js            # Register, Login, Get Profile
│   │   ├── dashboard.js       # Student & Admin dashboard data
│   │   └── users.js           # Admin user management
│   ├── .env                   # Environment variables
│   ├── index.js               # Express server entry point
│   ├── seed.js                # Admin account seeder
│   └── package.json
├── client/                    # Frontend React App
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx     # Navigation bar
│   │   │   └── ProtectedRoute.jsx  # Route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   ├── StudentDashboard.jsx # Student dashboard
│   │   │   ├── AdminDashboard.jsx   # Admin dashboard
│   │   │   └── AdminUsers.jsx       # User management
│   │   ├── services/
│   │   │   └── api.js              # Axios HTTP client
│   │   ├── App.jsx                 # Main app + routing
│   │   └── App.css                 # Styles
│   └── package.json
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint                  | Auth Required | Role  | Description              |
| ------ | ------------------------- | ------------- | ----- | ------------------------ |
| POST   | `/api/auth/register`      | No            | —     | Create new account       |
| POST   | `/api/auth/login`         | No            | —     | Login & get JWT token    |
| GET    | `/api/auth/me`            | Yes           | Any   | Get current user profile |
| GET    | `/api/dashboard/student`  | Yes           | Student | Get student dashboard  |
| GET    | `/api/dashboard/admin`    | Yes           | Admin | Get admin dashboard      |
| GET    | `/api/users`              | Yes           | Admin | List all users           |
| GET    | `/api/users/stats`        | Yes           | Admin | Get user statistics      |
| PATCH  | `/api/users/:id/status`   | Yes           | Admin | Suspend/activate user    |

---

## Test Accounts

| Role    | Email                 | Username | Password  |
| ------- | --------------------- | -------- | --------- |
| Admin   | admin@studysprint.com | admin    | Admin@123 |
| Student | *(Register a new account)* | — | —       |

---

## License

This project is developed for academic purposes as part of the IT342 course at CIT-U.
