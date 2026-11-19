// ============================================================
// StudySprint - Marketing Landing Page (10-Section Specification)
// ============================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0); // First item open by default as in wireframe

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  const logos = [
    { name: 'Halvorsen Tech', symbol: '■' },
    { name: 'Brightcast AI', symbol: '●' },
    { name: 'CIT-U Engineering', symbol: '◆' },
    { name: 'Ternwell Labs', symbol: '■' },
    { name: 'Quarrystone', symbol: '●' },
    { name: 'Pellucid Systems', symbol: '◆' },
  ];

  const faqs = [
    {
      q: 'How long does quiz generation take?',
      a: 'StudySprint processes uploaded lecture notes or pasted text and generates a structured 10-question quiz in under 30 seconds using advanced language synthesis.',
    },
    {
      q: 'Can we bring study materials from our existing files?',
      a: 'Yes. You can paste plain text, markdown, or upload notes per topic. StudySprint organizes them hierarchically into subjects and topics.',
    },
    {
      q: 'How does Google Calendar synchronization work?',
      a: 'When you schedule a study session in your dashboard, StudySprint integrates directly with the Google Calendar API to reserve time slots and trigger push reminders 15 minutes before.',
    },
    {
      q: 'How is user data and note content protected?',
      a: 'All authentication is secured with industry-standard bcrypt password hashing (10 salt rounds) and JSON Web Tokens (JWT). Your personal notes remain private to your account.',
    },
    {
      q: 'Is StudySprint free for college students?',
      a: 'Yes, the Student Starter plan is 100% free forever for enrolled students, providing unlimited note storage and full quiz creation.',
    },
    {
      q: 'What role-based controls are available for administrators?',
      a: 'System administrators have access to a dedicated dashboard to monitor active accounts, review flagged shared quizzes, and suspend or restore user accounts.',
    },
  ];

  return (
    <div className="landing-root">
      {/* ── 1. SITE HEADER ────────────────────────────────────── */}
      <header className="land-header">
        <div className="land-container land-header-inner">
          <div className="land-brand">
            <Link to="/">
              <span className="land-brand-badge">⚡</span>
              <span className="land-brand-text">StudySprint</span>
            </Link>
          </div>

          <nav className={`land-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#process" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          </nav>

          <div className="land-header-actions">
            <Link to="/login" className="land-btn-ghost">Sign in</Link>
            <Link to="/register" className="land-btn-primary">Start free</Link>
            <button
              className="land-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ───────────────────────────────────── */}
      <section className="land-hero">
        <div className="land-container land-hero-grid">
          <div className="land-hero-content">
            <div className="land-eyebrow">[ AI STUDY ARCHITECTURE ]</div>
            <h1 className="land-hero-title">
              Build faster study habits with less effort.
            </h1>
            <p className="land-hero-body">
              StudySprint keeps your lecture notes, AI practice quizzes, and calendar study sessions in one calm, unified workspace.
            </p>

            <div className="land-hero-cta">
              <Link to="/register" className="land-btn-primary land-btn-lg">
                Start free
              </Link>
              <Link to="/login" className="land-btn-secondary land-btn-lg">
                Explore demo →
              </Link>
            </div>

            <div className="land-trust-row">
              <div className="land-avatar-stack">
                <span className="land-avatar">CA</span>
                <span className="land-avatar">IT</span>
                <span className="land-avatar">SE</span>
              </div>
              <span className="land-trust-caption">Used by 3,200+ students and study groups</span>
            </div>

            <div className="land-hero-stats">
              <div className="land-stat-item">
                <span className="land-stat-val">&lt;30s</span>
                <span className="land-stat-lbl">Quiz generation</span>
              </div>
              <div className="land-stat-item">
                <span className="land-stat-val">4.9/5</span>
                <span className="land-stat-lbl">Student rating</span>
              </div>
              <div className="land-stat-item">
                <span className="land-stat-val">10k+</span>
                <span className="land-stat-lbl">Quizzes taken</span>
              </div>
              <div className="land-stat-item">
                <span className="land-stat-val">99.9%</span>
                <span className="land-stat-lbl">Uptime</span>
              </div>
            </div>
          </div>

          <div className="land-hero-media">
            <div className="land-browser-frame">
              <div className="land-browser-bar">
                <span className="land-dot"></span>
                <span className="land-dot"></span>
                <span className="land-dot"></span>
                <span className="land-browser-url">studysprint.app/student/quiz-preview</span>
              </div>
              <div className="land-browser-canvas">
                <div className="land-preview-header">
                  <div className="land-preview-tag">SUBJECT: IT342 ARCHITECTURE</div>
                  <div className="land-preview-score">Accuracy: 94% • Streak: 5 Days</div>
                </div>
                <div className="land-preview-card">
                  <div className="land-preview-q-num">QUESTION 03 OF 10</div>
                  <div className="land-preview-q-text">
                    Which architectural pattern decouples authentication state using signed stateless tokens?
                  </div>
                  <div className="land-preview-options">
                    <div className="land-preview-opt correct">
                      <span className="opt-marker">✓</span> JSON Web Tokens (JWT) Bearer Authentication
                    </div>
                    <div className="land-preview-opt">
                      <span className="opt-marker">B</span> Stateful In-Memory Session Stacks
                    </div>
                    <div className="land-preview-opt">
                      <span className="opt-marker">C</span> Unencrypted Cookie Storage
                    </div>
                  </div>
                </div>
                <div className="land-preview-footer">
                  <span className="land-gen-badge">⚡ Generated in 14.2s from uploaded notes</span>
                  <span className="land-preview-cta">Next Question →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. LOGO CLOUD ─────────────────────────────────────── */}
      <section className="land-logos">
        <div className="land-container">
          <p className="land-logos-caption">ENGINEERING AND COMPUTING DEPARTMENTS THAT STUDY WITH STUDYSPRINT</p>
          <div className="land-logos-grid">
            {logos.map((logo, i) => (
              <div key={i} className="land-logo-item">
                <span className="land-logo-icon">{logo.symbol}</span>
                <span className="land-logo-name">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES (3 SWAP-SIDE ROWS) ────────────────────── */}
      <section className="land-features" id="features">
        <div className="land-container">
          <div className="land-section-heading">
            <div className="land-eyebrow">[ CORE CAPABILITIES ]</div>
            <h2>One unified workspace for the entire study cycle.</h2>
            <p>From raw lecture slides to spaced repetition and calendar reminders, nothing gets scattered.</p>
          </div>

          {/* Feature 1: Image Left, Text Right */}
          <div className="land-feature-row">
            <div className="land-feature-visual">
              <div className="land-inset-box">
                <div className="land-inset-header">AI QUIZ ENGINE // GENERATE</div>
                <div className="land-code-mock">
                  <code>&gt; Analyzing 4,500 words from Notes.txt...</code>
                  <code>&gt; Extracted 12 core concepts &amp; terminology</code>
                  <code>&gt; Generated 10 multiple-choice questions</code>
                  <div className="land-progress-bar">
                    <div className="land-progress-fill" style={{ width: '100%' }}></div>
                  </div>
                  <code>&gt; Ready for student review in 18 seconds.</code>
                </div>
              </div>
            </div>
            <div className="land-feature-text">
              <span className="land-feature-num">01 // AUTOMATED ASSESSMENT</span>
              <h3>Instant AI Quiz Generation</h3>
              <p>
                Stop spending hours writing manual flashcards. Paste your digital notes or lecture transcript and receive comprehensive 10-question practice quizzes with instant grading and explanations.
              </p>
              <Link to="/register" className="land-text-link">Try generating a quiz →</Link>
            </div>
          </div>

          {/* Feature 2: Text Left, Image Right */}
          <div className="land-feature-row reverse">
            <div className="land-feature-visual">
              <div className="land-inset-box">
                <div className="land-inset-header">HIERARCHY // SUBJECTS &amp; TOPICS</div>
                <div className="land-tree-mock">
                  <div className="tree-node active">📁 Systems Integration &amp; Architecture 1</div>
                  <div className="tree-node sub">├─ 📄 Module 1: Software Requirements (SRS)</div>
                  <div className="tree-node sub">├─ 📄 Module 2: REST APIs &amp; JWT Security</div>
                  <div className="tree-node sub">└─ 📄 Module 3: Microservices vs Monoliths</div>
                </div>
              </div>
            </div>
            <div className="land-feature-text">
              <span className="land-feature-num">02 // KNOWLEDGE STRUCTURE</span>
              <h3>Hierarchical Subject &amp; Note Organizing</h3>
              <p>
                Keep coursework neatly organized into subjects, topics, and sub-topics. Stored securely under your student profile and immediately accessible whenever revision time arrives.
              </p>
              <Link to="/register" className="land-text-link">Explore note architecture →</Link>
            </div>
          </div>

          {/* Feature 3: Image Left, Text Right */}
          <div className="land-feature-row">
            <div className="land-feature-visual">
              <div className="land-inset-box">
                <div className="land-inset-header">CALENDAR SYNC // GOOGLE INTEGRATION</div>
                <div className="land-calendar-mock">
                  <div className="cal-event">
                    <span className="cal-dot"></span>
                    <div>
                      <strong>IT342 Exam Preparation</strong>
                      <p>Tomorrow at 7:00 PM • Push reminder scheduled</p>
                    </div>
                  </div>
                  <div className="cal-badge">✓ Synced to Google Calendar</div>
                </div>
              </div>
            </div>
            <div className="land-feature-text">
              <span className="land-feature-num">03 // TIMED ACCOUNTABILITY</span>
              <h3>Study Session Scheduling &amp; Reminders</h3>
              <p>
                Book dedicated focus slots linked directly to your upcoming exams. StudySprint syncs sessions to your calendar and sends browser notifications 15 minutes before study time.
              </p>
              <Link to="/register" className="land-text-link">See scheduling workflow →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PROCESS (3 CONNECTED STEPS) ────────────────────── */}
      <section className="land-process" id="process">
        <div className="land-container">
          <div className="land-section-heading">
            <div className="land-eyebrow">[ SYSTEM WORKFLOW ]</div>
            <h2>Up and running in three simple steps.</h2>
            <p>From initial registration to your first completed quiz in less than 3 minutes.</p>
          </div>

          <div className="land-steps-grid">
            <div className="land-step-card">
              <div className="land-step-badge">1</div>
              <h4>Create Your Account</h4>
              <p>Register as a student in seconds with your verified school email, username, and secure credentials.</p>
            </div>
            <div className="land-step-card">
              <div className="land-step-badge">2</div>
              <h4>Upload or Paste Notes</h4>
              <p>Paste lecture notes under your chosen subject and trigger one-click AI quiz generation.</p>
            </div>
            <div className="land-step-card">
              <div className="land-step-badge">3</div>
              <h4>Assess &amp; Track Mastery</h4>
              <p>Take interactive quizzes with immediate scoring, maintain your study streak, and review analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIALS ───────────────────────────────────── */}
      <section className="land-testimonials">
        <div className="land-container">
          <div className="land-section-heading">
            <div className="land-eyebrow">[ PROVEN IMPACT ]</div>
            <h2>Students study with calm and confidence.</h2>
          </div>

          <div className="land-quote-featured">
            <div className="land-quote-mark">“</div>
            <blockquote className="land-quote-text">
              StudySprint saved me hours of manually writing quiz cards before midterm exams. The automatic scoring and instant feedback pinpointed exactly which database architecture topics I had to review again.
            </blockquote>
            <div className="land-quote-author">
              <div className="author-avatar">CA</div>
              <div>
                <strong>Ave Cyril G. Antolijao</strong>
                <span>IT342 Project Developer, Cebu Institute of Technology - University</span>
              </div>
            </div>
          </div>

          <div className="land-quotes-subgrid">
            <div className="land-subquote-card">
              <p>“The Google Calendar integration means I never miss a planned study block. Everything is structured in one clean dashboard.”</p>
              <div className="subquote-author">
                <div className="author-avatar sm">DM</div>
                <div>
                  <strong>Danilo M.</strong>
                  <span>BS Computer Science, 3rd Year</span>
                </div>
              </div>
            </div>

            <div className="land-subquote-card">
              <p>“Clean, zero-distraction layout. No gimmicks, just direct recall quizzes generated right from our course handouts.”</p>
              <div className="subquote-author">
                <div className="author-avatar sm">RA</div>
                <div>
                  <strong>Rachel A.</strong>
                  <span>BS Information Technology, CIT-U</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PRICING ────────────────────────────────────────── */}
      <section className="land-pricing" id="pricing">
        <div className="land-container">
          <div className="land-section-heading">
            <div className="land-eyebrow">[ FAIR &amp; ACCESSIBLE ]</div>
            <h2>Plans designed for college students.</h2>
            <p>Always transparent. Get started at zero cost.</p>
          </div>

          <div className="land-pricing-grid">
            {/* Plan 1 */}
            <div className="land-price-card">
              <div className="plan-name">Student Starter</div>
              <div className="plan-price">₱0 <span>/ semester</span></div>
              <p className="plan-desc">For individual students organizing coursework.</p>
              <Link to="/register" className="land-btn-secondary full-width">Choose plan</Link>
              <ul className="plan-features">
                <li>✓ Unlimited Notes &amp; Topics</li>
                <li>✓ 20 AI Quizzes per month</li>
                <li>✓ Personal Progress Dashboard</li>
                <li>✓ Study Streak Tracking</li>
                <li>✓ Standard Support</li>
              </ul>
            </div>

            {/* Plan 2: Recommended */}
            <div className="land-price-card popular">
              <div className="plan-badge">RECOMMENDED</div>
              <div className="plan-name">Sprint Pro</div>
              <div className="plan-price">₱149 <span>/ month</span></div>
              <p className="plan-desc">For rigorous exam periods and thesis review.</p>
              <Link to="/register" className="land-btn-primary full-width">Start free trial</Link>
              <ul className="plan-features">
                <li>✓ Everything in Student Starter</li>
                <li>✓ Unlimited AI Quiz Generation</li>
                <li>✓ Google Calendar Auto-Sync</li>
                <li>✓ Push Notification Reminders</li>
                <li>✓ Sharable Quiz Links for Peers</li>
                <li>✓ Priority LLM Processing (&lt;15s)</li>
              </ul>
            </div>

            {/* Plan 3 */}
            <div className="land-price-card">
              <div className="plan-name">Study Group / Class</div>
              <div className="plan-price">₱399 <span>/ team</span></div>
              <p className="plan-desc">For study circles and peer review groups.</p>
              <Link to="/register" className="land-btn-secondary full-width">Choose plan</Link>
              <ul className="plan-features">
                <li>✓ Up to 10 Student Seats</li>
                <li>✓ Shared Question Banks</li>
                <li>✓ Group Score Leaderboard</li>
                <li>✓ Moderator &amp; Admin Tools</li>
                <li>✓ Dedicated Project Onboarding</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FAQ ────────────────────────────────────────────── */}
      <section className="land-faq" id="faq">
        <div className="land-container land-faq-layout">
          <div className="land-faq-left">
            <div className="land-eyebrow">[ COMMON QUESTIONS ]</div>
            <h2>Questions from students and admins.</h2>
            <p>Everything you need to know about the platform, authentication, and security standards.</p>
            <a href="mailto:support@studysprint.com" className="land-text-link">Have a custom question? Contact us →</a>
          </div>

          <div className="land-faq-accordion">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button className="faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.q}</span>
                    <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 9. CLOSING BANNER (INVERTED COLOURS #141314) ──────── */}
      <section className="land-closing">
        <div className="land-container land-closing-inner">
          <div className="land-closing-text">
            <h2>Ready to give your semester a calmer pace?</h2>
            <p>Sign up now to start organizing notes and taking AI-generated quizzes in seconds.</p>
          </div>
          <div className="land-closing-actions">
            <Link to="/register" className="land-btn-inverted-solid">
              Start free
            </Link>
            <Link to="/login" className="land-btn-inverted-outline">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER ────────────────────────────────────────── */}
      <footer className="land-footer">
        <div className="land-container land-footer-grid">
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <span className="land-brand-badge">⚡</span>
              <span className="land-brand-text">StudySprint</span>
            </div>
            <p className="footer-desc">
              AI-assisted study planner and quiz generator built for Systems Integration and Architecture 1 (IT342) at Cebu Institute of Technology - University.
            </p>
            <span className="footer-version">Release: Project Increment 1 • v1.0.0</span>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">AI Quiz Generator</a></li>
              <li><a href="#features">Notes Management</a></li>
              <li><a href="#features">Calendar Sync</a></li>
              <li><Link to="/login">Student Dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Administration</h4>
            <ul>
              <li><Link to="/login">Admin Portal</Link></li>
              <li><Link to="/login">User Moderation</Link></li>
              <li><Link to="/login">System Health</Link></li>
              <li><a href="#faq">Security &amp; JWT</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Academic</h4>
            <ul>
              <li><a href="https://cit.edu" target="_blank" rel="noreferrer">CIT-U Official</a></li>
              <li><a href="#process">Software Specification</a></li>
              <li><a href="https://github.com/cyril333/studysprint" target="_blank" rel="noreferrer">GitHub Repository</a></li>
              <li><a href="mailto:cyril.antolijao@example.com">Contact Developer</a></li>
            </ul>
          </div>
        </div>

        <div className="land-container land-footer-sub">
          <div>© 2026 StudySprint. Developed by Ave Cyril G. Antolijao. All rights reserved.</div>
          <div className="footer-sub-links">
            <Link to="/login">Privacy</Link>
            <Link to="/login">Terms</Link>
            <a href="https://github.com/cyril333/studysprint" target="_blank" rel="noreferrer">Source Code</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
