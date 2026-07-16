const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

// Import configuration
const { initializeDatabase, closePool } = require('./config/database');
const { strictCorsMiddleware } = require('./config/cors');
const { initializeMailer } = require('./config/mail');
const apiRoutes = require('./routes/index');
const { asyncHandler } = require('./middleware/errorHandler');
const { validateSuperAdminCredentials, validateSuperAdminSession, createSuperAdminSessionCookie, isValidSuperAdminSession } = require('./middleware/superAdminAuth');
const endorsementController = require('./controllers/endorsementController');

// Import models
const GlobalUsersModel = require('./models/GlobalUsers');
const CorePortfoliosModel = require('./models/CorePortfolios');
const PortfolioExperienceBlocksModel = require('./models/PortfolioExperienceBlocks');
const MicroSuccessStoriesModel = require('./models/MicroSuccessStories');
const ExternalLiveEndorsementsModel = require('./models/ExternalLiveEndorsements');
const PartnersModel = require('./models/Partners');
const { initializeFollowUpScheduler } = require('./services/followUpService');

// Initialize Express app
const app = express();
const PORT = process.env.SERVER_PORT || 5000;
const HOST = process.env.SERVER_HOST || '127.0.0.1';

// ============================================
// Middleware Configuration
// ============================================

// Strict CORS middleware
app.use(strictCorsMiddleware);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Note: Uploads are stored privately and are NOT served statically to protect sensitive files.



// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Database Initialization
// ============================================
const initializeTables = async () => {
  try {
    console.log('\n🔧 Initializing database tables...');
    await GlobalUsersModel.createGlobalUsersTable();
    await CorePortfoliosModel.createCorePortfoliosTable();
    await PortfolioExperienceBlocksModel.createPortfolioExperienceBlocksTable();
    await MicroSuccessStoriesModel.createMicroSuccessStoriesTable();
    await ExternalLiveEndorsementsModel.createExternalLiveEndorsementsTable();
    await PartnersModel.createPartnersTable();
    console.log('\n✅ All database tables initialized successfully\n');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
    process.exit(1);
  }
};

// ============================================
// Public and Admin Routes
// ============================================

const renderSuperAdminLoginPage = (errorMsg) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PeopleOS — Super Admin Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #020617;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.18) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 80%, rgba(14,165,233,0.12) 0%, transparent 50%);
      pointer-events: none;
    }
    .card {
      background: rgba(15,23,42,0.85);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      position: relative;
      z-index: 1;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .logo-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #6366f1, #0ea5e9);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .logo-text { font-size: 18px; font-weight: 700; color: #fff; }
    .logo-sub { font-size: 11px; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; }
    h1 { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 6px; }
    p.sub { font-size: 13px; color: #64748b; margin: 0 0 28px; }
    label { display: block; margin-bottom: 16px; }
    label span { display: block; font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    input {
      width: 100%; padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      color: #e2e8f0;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    button {
      width: 100%; padding: 13px;
      border-radius: 12px; border: none;
      background: linear-gradient(135deg, #6366f1, #0ea5e9);
      color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; margin-top: 8px;
      transition: opacity 0.2s, transform 0.1s;
      font-family: inherit;
    }
    button:hover { opacity: 0.9; }
    button:active { transform: scale(0.99); }
    .error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #fca5a5;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      margin-bottom: 20px;
      text-align: center;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
      color: #6ee7b7; font-size: 11px; font-weight: 600;
      padding: 4px 10px; border-radius: 999px;
      margin-bottom: 20px;
    }
    .badge::before { content: ''; width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">🛡</div>
      <div>
        <div class="logo-text">PeopleOS</div>
        <div class="logo-sub">Super Admin Gateway</div>
      </div>
    </div>
    <h1>Secure Admin Portal</h1>
    <p class="sub">Restricted access. Authorized personnel only.</p>
    <div class="badge">Isolated Admin Session</div>
    ${errorMsg ? `<div class="error">⚠️ ${errorMsg}</div>` : ''}
    <form method="POST" action="/super-admin-gateway-portal/login">
      <label>
        <span>Admin Email</span>
        <input name="email" type="email" placeholder="admin@peopleos.online" required autocomplete="username" />
      </label>
      <label>
        <span>Password</span>
        <input name="password" type="password" placeholder="••••••••" required autocomplete="current-password" />
      </label>
      <button type="submit">Sign In to Admin Portal →</button>
    </form>
  </div>
</body>
</html>`;

const renderSuperAdminPortalPage = () => `<!DOCTYPE html>
<html lang="ar" id="adminHtml" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>People Monitor — Super Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #060818;
      --bg2: #0b1120;
      --surface: rgba(15,23,42,0.7);
      --surface2: rgba(15,23,42,0.4);
      --border: rgba(255,255,255,0.07);
      --border2: rgba(255,255,255,0.04);
      --text: #f1f5f9;
      --text2: #94a3b8;
      --text3: #64748b;
      --indigo: #6366f1;
      --indigo2: #4f46e5;
      --sky: #0ea5e9;
      --emerald: #10b981;
      --amber: #f59e0b;
      --red: #ef4444;
      --violet: #8b5cf6;
      --header-h: 64px;
    }
    .light {
      --bg: #f4f6fb;
      --bg2: #eef0f6;
      --surface: rgba(255,255,255,0.9);
      --surface2: rgba(255,255,255,0.6);
      --border: rgba(0,0,0,0.07);
      --border2: rgba(0,0,0,0.04);
      --text: #0f172a;
      --text2: #475569;
      --text3: #94a3b8;
    }

    html, body { min-height: 100vh; font-family: 'Inter', 'Outfit', sans-serif; }
    body {
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      transition: background 0.3s, color 0.3s;
    }

    /* Ambient orbs */
    body::before {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background:
        radial-gradient(ellipse at 10% 0%, rgba(99,102,241,0.18) 0%, transparent 40%),
        radial-gradient(ellipse at 90% 90%, rgba(14,165,233,0.12) 0%, transparent 40%),
        radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%);
    }

    /* ── HEADER ── */
    header {
      position: sticky; top: 0; z-index: 100;
      height: var(--header-h);
      background: rgba(6,8,24,0.85);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(20px);
      display: flex; align-items: center;
      padding: 0 32px; gap: 16px;
      justify-content: space-between;
      transition: background 0.3s;
    }
    .light header { background: rgba(244,246,251,0.9); }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--indigo), var(--sky));
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-icon svg { width: 18px; height: 18px; color: #fff; }
    .brand-name { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-sub { font-size: 11px; color: var(--text3); font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }

    .header-actions { display: flex; align-items: center; gap: 8px; }

    .icon-btn {
      width: 36px; height: 36px;
      border: 1px solid var(--border);
      background: var(--surface2);
      border-radius: 10px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text2);
      transition: all 0.2s;
      font-family: inherit;
    }
    .icon-btn:hover { background: var(--surface); color: var(--text); border-color: var(--border); }
    .icon-btn svg { width: 16px; height: 16px; }

    .lang-btn {
      padding: 0 12px; height: 36px;
      border: 1px solid var(--border);
      background: var(--surface2);
      border-radius: 10px;
      cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      color: var(--text2);
      font-size: 12px; font-weight: 700;
      transition: all 0.2s;
      font-family: inherit;
    }
    .lang-btn:hover { background: var(--surface); color: var(--text); }

    .divider { width: 1px; height: 20px; background: var(--border); }

    .refresh-btn {
      padding: 0 16px; height: 36px;
      background: linear-gradient(135deg, var(--indigo), var(--violet));
      border: none; border-radius: 10px;
      color: #fff; font-size: 12px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      font-family: inherit;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
      transition: all 0.2s;
    }
    .refresh-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99,102,241,0.4); }
    .refresh-btn svg { width: 14px; height: 14px; }

    .logout-btn {
      padding: 0 14px; height: 36px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      color: #f87171; font-size: 12px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      font-family: inherit;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); }
    .logout-btn svg { width: 14px; height: 14px; }

    /* ── MAIN ── */
    main {
      position: relative; z-index: 1;
      max-width: 1440px; width: 100%;
      margin: 0 auto;
      padding: 28px 32px;
      flex: 1;
      display: flex; flex-direction: column; gap: 24px;
    }

    /* ── STATS ROW ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 20px;
      backdrop-filter: blur(16px);
      display: flex; align-items: flex-start; gap: 14px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.2); }

    .stat-icon {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon svg { width: 20px; height: 20px; }
    .si-indigo { background: rgba(99,102,241,0.15); color: var(--indigo); }
    .si-emerald { background: rgba(16,185,129,0.15); color: var(--emerald); }
    .si-sky { background: rgba(14,165,233,0.15); color: var(--sky); }
    .si-violet { background: rgba(139,92,246,0.15); color: var(--violet); }

    .stat-val { font-size: 32px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
    .stat-label { font-size: 12px; color: var(--text2); font-weight: 600; margin-top: 4px; }

    /* ── TABS ── */
    .tabs-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap;
    }
    .tabs { display: flex; gap: 4px; background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 4px; }
    .tab-btn {
      padding: 8px 18px; border: none; border-radius: 9px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      background: transparent; color: var(--text2);
      font-family: inherit; transition: all 0.2s;
      display: flex; align-items: center; gap: 7px;
    }
    .tab-btn svg { width: 15px; height: 15px; }
    .tab-btn.active { background: var(--indigo); color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
    .tab-btn:not(.active):hover { background: var(--surface); color: var(--text); }

    /* ── SEARCH ── */
    .search-box {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px;
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 10px; transition: border-color 0.2s;
    }
    .search-box:focus-within { border-color: rgba(99,102,241,0.5); }
    .search-box svg { width: 15px; height: 15px; color: var(--text3); flex-shrink: 0; }
    .search-box input {
      background: transparent; border: none; outline: none;
      color: var(--text); font-size: 13px; font-family: inherit;
      width: 220px;
    }
    .search-box input::placeholder { color: var(--text3); }

    /* ── PANEL ── */
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      backdrop-filter: blur(16px);
      overflow: hidden;
    }
    .panel.hidden { display: none !important; }

    .panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border2);
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      flex-wrap: wrap;
    }
    .panel-title {
      display: flex; align-items: center; gap: 10px;
    }
    .panel-title-icon {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
    }
    .panel-title-icon svg { width: 16px; height: 16px; }
    .panel-title h2 { font-size: 15px; font-weight: 800; }
    .panel-count {
      font-size: 11px; font-weight: 800;
      padding: 3px 10px; border-radius: 20px;
      background: rgba(99,102,241,0.12);
      color: var(--indigo);
      border: 1px solid rgba(99,102,241,0.2);
    }

    /* ── TABLE ── */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    [dir="rtl"] table { text-align: right; }
    thead tr { background: var(--surface2); }
    th {
      padding: 12px 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--text3);
      border-bottom: 1px solid var(--border2);
      white-space: nowrap;
    }
    td { padding: 16px 20px; font-size: 13px; border-bottom: 1px solid var(--border2); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tbody tr { transition: background 0.15s; }
    tbody tr:hover { background: rgba(99,102,241,0.03); }

    /* ── BADGES ── */
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 20px;
      white-space: nowrap;
    }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .badge-green { background: rgba(16,185,129,0.1); color: var(--emerald); border: 1px solid rgba(16,185,129,0.2); }
    .badge-green .badge-dot { background: var(--emerald); }
    .badge-amber { background: rgba(245,158,11,0.1); color: var(--amber); border: 1px solid rgba(245,158,11,0.2); }
    .badge-amber .badge-dot { background: var(--amber); animation: pulse 1.5s infinite; }
    .badge-indigo { background: rgba(99,102,241,0.1); color: var(--indigo); border: 1px solid rgba(99,102,241,0.2); }
    .badge-sky { background: rgba(14,165,233,0.1); color: var(--sky); border: 1px solid rgba(14,165,233,0.2); }
    .badge-gray { background: rgba(100,116,139,0.1); color: var(--text3); border: 1px solid rgba(100,116,139,0.15); }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    /* Portfolio links */
    .portfolio-link {
      display: inline-flex; align-items: center; gap: 5px;
      color: var(--indigo); font-size: 12px; font-weight: 600;
      text-decoration: none; transition: color 0.2s;
    }
    .portfolio-link:hover { color: var(--sky); }
    .portfolio-link svg { width: 12px; height: 12px; }

    /* User avatar */
    .user-row { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 34px; height: 34px; border-radius: 10px;
      background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(14,165,233,0.2));
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 800; color: var(--indigo);
      flex-shrink: 0;
      border: 1px solid rgba(99,102,241,0.15);
    }
    .user-name { font-size: 13px; font-weight: 700; }
    .user-email { font-size: 11px; color: var(--text3); margin-top: 2px; }

    /* Action buttons */
    .actions-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .btn-action {
      padding: 6px 12px; border: none; border-radius: 8px;
      font-size: 11px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 5px;
      font-family: inherit; transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-action svg { width: 12px; height: 12px; }
    .btn-bridge { background: rgba(99,102,241,0.12); color: var(--indigo); border: 1px solid rgba(99,102,241,0.2); }
    .btn-bridge:hover { background: rgba(99,102,241,0.22); }
    .btn-del { background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.18); }
    .btn-del:hover { background: rgba(239,68,68,0.16); }

    /* Partner form */
    .form-card {
      padding: 24px;
      border-bottom: 1px solid var(--border2);
      background: rgba(99,102,241,0.03);
    }
    .form-title {
      font-size: 14px; font-weight: 800; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .form-title svg { width: 16px; height: 16px; color: var(--indigo); }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }
    .form-group input {
      padding: 10px 14px;
      border-radius: 10px; border: 1px solid var(--border);
      background: var(--surface2); color: var(--text);
      font-size: 13px; font-family: inherit; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .form-submit {
      margin-top: 16px; padding: 10px 20px;
      background: linear-gradient(135deg, var(--indigo), var(--violet));
      border: none; border-radius: 10px;
      color: #fff; font-size: 13px; font-weight: 700;
      cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
      font-family: inherit;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
      transition: all 0.2s;
    }
    .form-submit:hover { opacity: 0.9; transform: translateY(-1px); }
    .form-submit svg { width: 14px; height: 14px; }

    /* Status msg */
    .status-bar {
      padding: 12px 24px;
      font-size: 12px; color: var(--text3);
      border-bottom: 1px solid var(--border2);
      display: flex; align-items: center; gap: 6px;
      min-height: 42px;
    }
    .status-bar svg { width: 13px; height: 13px; }

    /* Ref link */
    .ref-link {
      font-size: 11px; color: var(--indigo);
      text-decoration: none; font-weight: 600;
      display: inline-flex; align-items: center; gap: 4px;
      max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .ref-link:hover { color: var(--sky); text-decoration: underline; }
    .ref-link svg { width: 11px; height: 11px; flex-shrink: 0; }

    /* Empty state */
    .empty-state {
      padding: 60px 24px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: var(--surface2); display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border);
    }
    .empty-icon svg { width: 24px; height: 24px; color: var(--text3); }
    .empty-title { font-size: 14px; font-weight: 700; color: var(--text2); }
    .empty-sub { font-size: 12px; color: var(--text3); }

    /* Footer */
    footer {
      position: relative; z-index: 1;
      padding: 16px 32px;
      border-top: 1px solid var(--border);
      font-size: 11px; color: var(--text3);
      display: flex; align-items: center; justify-content: space-between;
    }

    @media (max-width: 640px) {
      main { padding: 16px; }
      header { padding: 0 16px; }
      .search-box input { width: 140px; }
    }
  </style>
</head>
<body>

  <!-- ── HEADER ── -->
  <header>
    <div class="brand">
      <div class="brand-icon">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
      </div>
      <div>
        <div class="brand-name" id="titleHeader">بوابة المشرف العليا</div>
        <div class="brand-sub" id="subtitleHeader">Super Admin Control Hub</div>
      </div>
    </div>

    <div class="header-actions">
      <div class="search-box" id="globalSearchBox">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
        <input id="globalSearch" type="text" placeholder="بحث..." />
      </div>

      <div class="divider"></div>

      <button class="lang-btn" id="langBtn" title="Language">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"/></svg>
        <span id="langLabel">EN</span>
      </button>

      <button class="icon-btn" id="themeToggle" title="Toggle theme">
        <svg id="themeIconDark" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>
        <svg id="themeIconLight" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="display:none"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
      </button>

      <div class="divider"></div>

      <button class="refresh-btn" id="refreshBtn">
        <svg id="refreshIcon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
        <span id="refreshBtnText">تحديث</span>
      </button>

      <button class="logout-btn" onclick="window.location.href='/super-admin-gateway-portal/logout'">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
        <span id="logoutText">خروج</span>
      </button>
    </div>
  </header>

  <main>
    <!-- Stats Row -->
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card">
        <div class="stat-icon si-indigo">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
        </div>
        <div>
          <div class="stat-val" id="statTotalUsers">—</div>
          <div class="stat-label" id="statLabelUsers">إجمالي المستخدمين</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-emerald">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <div class="stat-val" id="statVerified">—</div>
          <div class="stat-label" id="statLabelVerified">حسابات موثقة</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-sky">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"/></svg>
        </div>
        <div>
          <div class="stat-val" id="statPublished">—</div>
          <div class="stat-label" id="statLabelPublished">سير منشورة</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-violet">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>
        </div>
        <div>
          <div class="stat-val" id="statPartners">—</div>
          <div class="stat-label" id="statLabelPartners">مراكز تدريبية</div>
        </div>
      </div>
    </div>

    <!-- Tabs + Search row -->
    <div class="tabs-row">
      <div class="tabs">
        <button class="tab-btn active" id="tabUsers">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
          <span id="tabUsersText">المستخدمين</span>
        </button>
        <button class="tab-btn" id="tabPartners">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>
          <span id="tabPartnersText">المراكز التدريبية</span>
        </button>
      </div>

      <div class="search-box">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
        <input id="tableSearch" type="text" placeholder="بحث بالاسم أو البريد..." />
      </div>
    </div>

    <!-- Users Panel -->
    <div class="panel" id="usersPanel">
      <div class="panel-header">
        <div class="panel-title">
          <div class="panel-title-icon si-indigo" style="background:rgba(99,102,241,0.12)">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
          </div>
          <h2 id="usersPanelTitle">إدارة المستخدمين</h2>
          <span class="panel-count" id="usersCount">0</span>
        </div>
      </div>
      <div class="status-bar" id="status">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
        <span id="statusText"></span>
      </div>
      <div class="table-wrap" id="usersTable"></div>
    </div>

    <!-- Partners Panel -->
    <div class="panel hidden" id="partnersPanel">
      <!-- Create Form -->
      <div class="form-card">
        <div class="form-title">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span id="formTitle">إضافة مركز تدريبي جديد</span>
        </div>
        <form id="partnerForm" onsubmit="createPartner(event)">
          <div class="form-grid">
            <div class="form-group">
              <label id="lblPartnerName">اسم المركز</label>
              <input id="partnerName" type="text" required placeholder="أكاديمية البرمجة" />
            </div>
            <div class="form-group">
              <label id="lblPartnerSlug">الرمز التعريفي (Slug)</label>
              <input id="partnerSlug" type="text" required placeholder="coding-academy" pattern="^[a-z0-9-]+$" />
            </div>
            <div class="form-group">
              <label id="lblPartnerEmail">البريد الإلكتروني للمسؤول</label>
              <input id="partnerEmail" type="email" required placeholder="admin@academy.com" />
            </div>
            <div class="form-group">
              <label id="lblPartnerPassword">كلمة المرور</label>
              <input id="partnerPassword" type="password" required placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" class="form-submit">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            <span id="btnCreatePartner">إنشاء الحساب</span>
          </button>
        </form>
      </div>

      <div class="panel-header" style="border-top:0">
        <div class="panel-title">
          <div class="panel-title-icon si-violet" style="background:rgba(139,92,246,0.12)">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>
          </div>
          <h2 id="partnersPanelTitle">المراكز التدريبية</h2>
          <span class="panel-count" id="partnersCount">0</span>
        </div>
      </div>
      <div class="status-bar" id="partnerStatus">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
        <span id="partnerStatusText"></span>
      </div>
      <div class="table-wrap" id="partnersTable"></div>
    </div>
  </main>

  <footer>
    <span style="display:flex;align-items:center;gap:6px">
      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
      People Monitor &bull; Super Admin Portal
    </span>
    <span>&copy; ${new Date().getFullYear()}</span>
  </footer>

<script>
  // ── TRANSLATIONS ──
  const T = {
    ar: {
      title:'بوابة المشرف العليا', subtitle:'لوحة التحكم الفائقة',
      refresh:'تحديث', logout:'خروج', langLabel:'EN',
      loading:'جاري التحميل...', loaded:'تم تحديث البيانات ✓', failLoad:'فشل التحميل',
      deleteConfirm:'هل أنت متأكد؟ لا يمكن التراجع.', deleteSuccess:'تم الحذف ✓', deleteFail:'فشل الحذف',
      verified:'مفعّل', unverified:'قيد التحقق',
      tabUsers:'المستخدمين', tabPartners:'المراكز التدريبية',
      usersPanelTitle:'إدارة المستخدمين', partnersPanelTitle:'إدارة المراكز التدريبية',
      colId:'ID', colName:'المستخدم', colEmail:'البريد', colJob:'المسمى الوظيفي',
      colCenter:'المركز / الجهة', colStatus:'الحالة', colPortfolio:'الحقيبة', colActions:'الإجراءات',
      bridge:'جسر الوصول', delete:'حذف',
      partnerFormTitle:'إضافة مركز تدريبي جديد',
      lblName:'اسم المركز', lblSlug:'الرمز التعريفي (Slug)', lblEmail:'بريد المسؤول', lblPass:'كلمة المرور',
      btnCreate:'إنشاء الحساب', partnerCreated:'تم إنشاء المركز بنجاح ✓', partnerFail:'فشل الإنشاء',
      colStudents:'الطلاب', colRefLink:'رابط الإحالة',
      statUsers:'إجمالي المستخدمين', statVerified:'حسابات موثقة',
      statPublished:'سير منشورة', statPartners:'مراكز تدريبية',
      indep:'مستقل', searchPh:'بحث بالاسم أو البريد...',
    },
    en: {
      title:'Super Admin Gateway', subtitle:'Enterprise Control Hub',
      refresh:'Refresh', logout:'Logout', langLabel:'ع',
      loading:'Loading...', loaded:'Data refreshed ✓', failLoad:'Failed to load',
      deleteConfirm:'Are you sure? This cannot be undone.', deleteSuccess:'Deleted ✓', deleteFail:'Delete failed',
      verified:'Active', unverified:'Pending',
      tabUsers:'Users', tabPartners:'Training Centers',
      usersPanelTitle:'User Management', partnersPanelTitle:'Training Centers',
      colId:'ID', colName:'User', colEmail:'Email', colJob:'Job Title',
      colCenter:'Center / Partner', colStatus:'Status', colPortfolio:'Portfolio', colActions:'Actions',
      bridge:'Access Bridge', delete:'Delete',
      partnerFormTitle:'Add New Training Center',
      lblName:'Center Name', lblSlug:'Referral Slug', lblEmail:'Admin Email', lblPass:'Password',
      btnCreate:'Create Partner', partnerCreated:'Partner created ✓', partnerFail:'Create failed',
      colStudents:'Students', colRefLink:'Referral Link',
      statUsers:'Total Users', statVerified:'Verified Accounts',
      statPublished:'Published CVs', statPartners:'Training Centers',
      indep:'Independent', searchPh:'Search name or email...',
    }
  };

  let lang = localStorage.getItem('adminLang') || 'ar';
  let allUsers = [], allPartners = [];

  const $ = id => document.getElementById(id);
  const html = $('adminHtml');

  // ── APPLY LANG ──
  const applyLang = () => {
    const t = T[lang];
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
    $('titleHeader').textContent = t.title;
    $('subtitleHeader').textContent = t.subtitle;
    $('refreshBtnText').textContent = t.refresh;
    $('logoutText').textContent = t.logout;
    $('langLabel').textContent = t.langLabel;
    $('tabUsersText').textContent = t.tabUsers;
    $('tabPartnersText').textContent = t.tabPartners;
    $('usersPanelTitle').textContent = t.usersPanelTitle;
    $('partnersPanelTitle').textContent = t.partnersPanelTitle;
    $('formTitle').textContent = t.partnerFormTitle;
    $('lblPartnerName').textContent = t.lblName;
    $('lblPartnerSlug').textContent = t.lblSlug;
    $('lblPartnerEmail').textContent = t.lblEmail;
    $('lblPartnerPassword').textContent = t.lblPass;
    $('btnCreatePartner').textContent = t.btnCreate;
    $('tableSearch').placeholder = t.searchPh;
    $('statLabelUsers').textContent = t.statUsers;
    $('statLabelVerified').textContent = t.statVerified;
    $('statLabelPublished').textContent = t.statPublished;
    $('statLabelPartners').textContent = t.statPartners;
    localStorage.setItem('adminLang', lang);
    renderUsers(filterUsers($('tableSearch').value));
    renderPartners(filterPartners($('tableSearch').value));
  };

  $('langBtn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; applyLang(); });

  // ── THEME ──
  let isDark = localStorage.getItem('adminTheme') !== 'light';
  const applyTheme = () => {
    if (isDark) { html.classList.remove('light'); $('themeIconDark').style.display=''; $('themeIconLight').style.display='none'; }
    else { html.classList.add('light'); $('themeIconDark').style.display='none'; $('themeIconLight').style.display=''; }
    localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
  };
  $('themeToggle').addEventListener('click', () => { isDark = !isDark; applyTheme(); });
  applyTheme();

  // ── TABS ──
  const tabUsers = $('tabUsers'), tabPartners = $('tabPartners');
  const usersPanel = $('usersPanel'), partnersPanel = $('partnersPanel');
  let activeTab = 'users';

  tabUsers.addEventListener('click', () => {
    activeTab = 'users';
    tabUsers.classList.add('active'); tabPartners.classList.remove('active');
    usersPanel.classList.remove('hidden'); partnersPanel.classList.add('hidden');
    $('tableSearch').placeholder = T[lang].searchPh;
  });
  tabPartners.addEventListener('click', () => {
    activeTab = 'partners';
    tabPartners.classList.add('active'); tabUsers.classList.remove('active');
    partnersPanel.classList.remove('hidden'); usersPanel.classList.add('hidden');
    $('tableSearch').placeholder = T[lang].searchPh;
  });

  // ── SEARCH ──
  $('tableSearch').addEventListener('input', e => {
    const q = e.target.value;
    if (activeTab === 'users') renderUsers(filterUsers(q));
    else renderPartners(filterPartners(q));
  });

  const filterUsers = q => {
    if (!q) return allUsers;
    const low = q.toLowerCase();
    return allUsers.filter(u => (u.fullName||'').toLowerCase().includes(low) || (u.email||'').toLowerCase().includes(low) || (u.partnerName||'').toLowerCase().includes(low));
  };
  const filterPartners = q => {
    if (!q) return allPartners;
    const low = q.toLowerCase();
    return allPartners.filter(p => (p.name||'').toLowerCase().includes(low) || (p.adminEmail||'').toLowerCase().includes(low));
  };

  // ── RENDER USERS ──
  const renderUsers = (users) => {
    const t = T[lang];
    $('usersCount').textContent = users.length;
    if (!users.length) {
      $('usersTable').innerHTML = '<div class="empty-state"><div class="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg></div><div class="empty-title">لا يوجد مستخدمون</div><div class="empty-sub">No users found</div></div>';
      return;
    }

    const rows = users.map(u => {
      const init = (u.fullName||'?').charAt(0).toUpperCase();
      const statusBadge = u.isVerified
        ? '<span class="badge badge-green"><span class="badge-dot"></span>' + t.verified + '</span>'
        : '<span class="badge badge-amber"><span class="badge-dot"></span>' + t.unverified + '</span>';

      const partnerBadge = u.partnerName
        ? '<span class="badge badge-indigo">🏫 ' + u.partnerName + '</span>'
        : '<span style="color:var(--text3);font-size:12px">' + t.indep + '</span>';

      const portfolioHtml = !u.portfolios || !u.portfolios.length
        ? '<span style="color:var(--text3);font-size:12px">—</span>'
        : u.portfolios.map(p => {
            if (!p.slug) return '<span style="color:var(--text3);font-size:12px">—</span>';
            const liveBadge = p.isPublishedLive
              ? '<span class="badge badge-green" style="font-size:10px">Live</span>'
              : '<span class="badge badge-gray" style="font-size:10px">Draft</span>';
            return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">' +
              '<a class="portfolio-link" href="/p/' + p.slug + '" target="_blank">' +
                '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>' +
                p.slug +
              '</a>' + liveBadge +
            '</div>';
          }).join('');

      return '<tr>' +
        '<td><span style="color:var(--text3);font-size:12px;font-weight:600">#' + u.id + '</span></td>' +
        '<td><div class="user-row"><div class="avatar">' + init + '</div><div><div class="user-name">' + (u.fullName||'—') + '</div><div class="user-email">' + u.email + '</div></div></div></td>' +
        '<td><span style="font-size:12px;color:var(--text2)">' + (u.jobTitle||'—') + '</span></td>' +
        '<td>' + partnerBadge + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + portfolioHtml + '</td>' +
        '<td><div class="actions-cell">' +
          '<button class="btn-action btn-bridge" data-bridge-id="' + u.id + '">' +
            '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>' +
            t.bridge +
          '</button>' +
          '<button class="btn-action btn-del" data-delete-id="' + u.id + '">' +
            '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>' +
            t.delete +
          '</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    $('usersTable').innerHTML =
      '<table><thead><tr>' +
        '<th>' + t.colId + '</th>' +
        '<th>' + t.colName + '</th>' +
        '<th>' + t.colJob + '</th>' +
        '<th>' + t.colCenter + '</th>' +
        '<th>' + t.colStatus + '</th>' +
        '<th>' + t.colPortfolio + '</th>' +
        '<th>' + t.colActions + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';

    document.querySelectorAll('[data-bridge-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-bridge-id');
        $('statusText').textContent = '...';
        const r = await fetch('/api/admin/users/' + id + '/deep-portal', { method: 'POST' });
        const d = await r.json();
        if (d.success) { window.open(d.data.bridgeUrl, '_blank'); $('statusText').textContent = T[lang].loaded; }
        else { $('statusText').textContent = d.error || 'Bridge error'; }
      });
    });
    document.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.getAttribute('data-delete-id')));
    });
  };

  // ── RENDER PARTNERS ──
  const renderPartners = (partners) => {
    const t = T[lang];
    $('partnersCount').textContent = partners.length;
    $('statPartners').textContent = allPartners.length;
    if (!partners.length) {
      $('partnersTable').innerHTML = '<div class="empty-state"><div class="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg></div><div class="empty-title">لا توجد مراكز مضافة</div><div class="empty-sub">No partners yet</div></div>';
      return;
    }

    const origin = window.location.origin;
    const rows = partners.map(p => {
      const refUrl = origin + '/register?ref=' + p.slug;
      const init = (p.name||'?').charAt(0).toUpperCase();
      return '<tr>' +
        '<td><span style="color:var(--text3);font-size:12px;font-weight:600">#' + p.id + '</span></td>' +
        '<td><div class="user-row"><div class="avatar" style="background:rgba(139,92,246,0.15);color:var(--violet)">' + init + '</div><div><div class="user-name">' + p.name + '</div><div class="user-email">/' + p.slug + '</div></div></div></td>' +
        '<td><span style="font-size:12px;color:var(--text2)">' + p.adminEmail + '</span></td>' +
        '<td><span class="badge badge-indigo">' + (p.totalStudents||0) + ' ' + t.colStudents + '</span></td>' +
        '<td><a class="ref-link" href="' + refUrl + '" target="_blank">' +
          '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>' +
          refUrl +
        '</a></td>' +
        '<td><div class="actions-cell">' +
          '<button class="btn-action btn-del" data-partner-delete-id="' + p.id + '">' +
            '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>' +
            t.delete +
          '</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    $('partnersTable').innerHTML =
      '<table><thead><tr>' +
        '<th>' + t.colId + '</th>' +
        '<th>' + t.colName + '</th>' +
        '<th>' + t.colEmail + '</th>' +
        '<th>' + t.colStudents + '</th>' +
        '<th>' + t.colRefLink + '</th>' +
        '<th>' + t.colActions + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';

    document.querySelectorAll('[data-partner-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => deletePartner(btn.getAttribute('data-partner-delete-id')));
    });
  };

  // ── DATA LOADING ──
  const loadUsers = async () => {
    $('statusText').textContent = T[lang].loading;
    try {
      const r = await fetch('/api/admin/users?t=' + Date.now());
      const d = await r.json();
      if (!d.success) { $('statusText').textContent = d.error || T[lang].failLoad; return; }
      allUsers = d.data;
      $('statTotalUsers').textContent = allUsers.length;
      $('statVerified').textContent = allUsers.filter(u => u.isVerified).length;
      $('statPublished').textContent = allUsers.reduce((n, u) => n + (u.portfolios||[]).filter(p => p.isPublishedLive).length, 0);
      renderUsers(filterUsers($('tableSearch').value));
      $('statusText').textContent = T[lang].loaded;
    } catch { $('statusText').textContent = T[lang].failLoad; }
  };

  const loadPartners = async () => {
    $('partnerStatusText').textContent = T[lang].loading;
    try {
      const r = await fetch('/api/admin/partners?t=' + Date.now());
      const d = await r.json();
      if (!d.success) { $('partnerStatusText').textContent = d.error || T[lang].failLoad; return; }
      allPartners = d.data;
      $('statPartners').textContent = allPartners.length;
      renderPartners(filterPartners($('tableSearch').value));
      $('partnerStatusText').textContent = T[lang].loaded;
    } catch { $('partnerStatusText').textContent = T[lang].failLoad; }
  };

  const loadData = () => { loadUsers(); loadPartners(); };

  // ── ACTIONS ──
  const deleteUser = async (id) => {
    if (!confirm(T[lang].deleteConfirm)) return;
    $('statusText').textContent = '...';
    try {
      const r = await fetch('/api/admin/users/' + id, { method: 'DELETE' });
      const d = await r.json();
      if (d.success) { $('statusText').textContent = T[lang].deleteSuccess; loadUsers(); }
      else { $('statusText').textContent = d.error || T[lang].deleteFail; }
    } catch { $('statusText').textContent = T[lang].deleteFail; }
  };

  const deletePartner = async (id) => {
    if (!confirm(T[lang].deleteConfirm)) return;
    $('partnerStatusText').textContent = '...';
    try {
      const r = await fetch('/api/admin/partners/' + id, { method: 'DELETE' });
      const d = await r.json();
      if (d.success) { $('partnerStatusText').textContent = T[lang].deleteSuccess; loadPartners(); }
      else { $('partnerStatusText').textContent = d.error || T[lang].deleteFail; }
    } catch { $('partnerStatusText').textContent = T[lang].deleteFail; }
  };

  const createPartner = async (e) => {
    e.preventDefault();
    $('partnerStatusText').textContent = '...';
    const body = {
      name: $('partnerName').value,
      slug: $('partnerSlug').value,
      adminEmail: $('partnerEmail').value,
      password: $('partnerPassword').value
    };
    try {
      const r = await fetch('/api/admin/partners', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.success) { $('partnerStatusText').textContent = T[lang].partnerCreated; $('partnerForm').reset(); loadPartners(); }
      else { $('partnerStatusText').textContent = d.error || T[lang].partnerFail; }
    } catch { $('partnerStatusText').textContent = T[lang].partnerFail; }
  };

  // ── REFRESH SPIN ──
  const refreshBtn = $('refreshBtn');
  const refreshIcon = $('refreshIcon');
  refreshBtn.addEventListener('click', () => {
    refreshIcon.style.transform = 'rotate(360deg)';
    refreshIcon.style.transition = 'transform 0.6s';
    setTimeout(() => { refreshIcon.style.transform = ''; refreshIcon.style.transition = ''; }, 700);
    loadData();
  });

  // ── INIT ──
  applyLang();
  loadData();
</script>
</body>
</html>`;

app.get('/super-admin-gateway-portal/login', (req, res) => {
  if (isValidSuperAdminSession(req)) {
    return res.redirect('/super-admin-gateway-portal');
  }
  res.send(renderSuperAdminLoginPage());
});

app.post('/super-admin-gateway-portal/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || !validateSuperAdminCredentials(email, password)) {
    return res.send(renderSuperAdminLoginPage('Invalid credentials. Please check your email and password.'));
  }
  createSuperAdminSessionCookie(res);
  res.redirect('/super-admin-gateway-portal');
}));

app.get('/super-admin-gateway-portal/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.redirect('/super-admin-gateway-portal/login');
});

app.get('/super-admin-gateway-portal', (req, res) => {
  if (!isValidSuperAdminSession(req)) {
    return res.redirect('/super-admin-gateway-portal/login');
  }
  res.send(renderSuperAdminPortalPage());
});

app.get('/endorse/:token', (req, res) => {
  const token = req.params.token;
  res.send(renderEndorsementWorkspacePage(token));
});

app.get('/super-admin/user-workstation/:userId', validateSuperAdminSession(), asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const user = await GlobalUsersModel.getUserById(userId);
  if (!user) {
    return res.status(404).send('User not found');
  }
  const portfolios = await CorePortfoliosModel.getPortfoliosByUserId(user.id);
  res.send(renderUserWorkstationPage(user, portfolios));
}));

// Super-admin portfolio preview — bypasses is_published_live check
app.get('/super-admin/preview-portfolio/:slug', validateSuperAdminSession(), asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const portfolio = await CorePortfoliosModel.getPortfolioBySlug(slug);
  if (!portfolio) {
    return res.status(404).send(`<h2 style="font-family:sans-serif;padding:40px;color:#ef4444;">Portfolio not found: ${slug}</h2>`);
  }
  // Temporarily mark as published so the public API serves it, then redirect
  // Instead: serve raw data as JSON for admin inspection
  const PortfolioExperienceBlocksModel = require('./models/PortfolioExperienceBlocks');
  const ExternalLiveEndorsementsModel = require('./models/ExternalLiveEndorsements');
  const MicroSuccessStoriesModel = require('./models/MicroSuccessStories');
  const experienceBlocks = await PortfolioExperienceBlocksModel.getExperienceBlocksByPortfolioId(portfolio.id);
  const endorsements = await ExternalLiveEndorsementsModel.getEndorsementsByPortfolioId(portfolio.id);
  const personal = portfolio.personal_data_json || {};
  const isPublished = portfolio.is_published_live;
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Preview — ${personal.fullName || slug}</title>
  <style>body{font-family:system-ui,sans-serif;background:#030712;color:#e2e8f0;margin:0;padding:0}
  .banner{background:${isPublished?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'};border-bottom:1px solid ${isPublished?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'};padding:12px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .banner-badge{background:${isPublished?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'};color:${isPublished?'#10b981':'#ef4444'};border:1px solid ${isPublished?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700}
  .banner-slug{font-family:monospace;background:rgba(255,255,255,0.06);padding:4px 10px;border-radius:8px;font-size:13px;color:#94a3b8}
  h2{margin:0;font-size:15px;flex:1}
  iframe{width:100%;border:0;height:calc(100vh - 60px)}
  </style></head><body>
  <div class="banner">
    <h2>🔐 Super Admin Preview</h2>
    <span class="banner-slug">${slug}</span>
    <span class="banner-badge">${isPublished?'✅ Published':'⏸ Draft — Not Published'}</span>
  </div>
  <iframe src="/p/${encodeURIComponent(slug)}" ${isPublished ? '' : 'srcdoc="<html><body style=\'background:#020617;color:#e2e8f0;font-family:sans-serif;padding:40px;text-align:center;\'><h2 style=\'color:#f87171;\'>⏸ Portfolio is saved as Draft</h2><p>This portfolio has not been published yet by the user.</p><p style=\'color:#94a3b8;margin-top:16px;\'>Slug: ${encodeURIComponent(slug)}</p><hr style=\'border-color:#334155;margin:24px 0;\'><h3>Personal Data</h3><pre style=\'text-align:left;background:#0f172a;padding:16px;border-radius:12px;overflow:auto;font-size:12px;\'>${JSON.stringify(personal, null, 2)}</pre></body></html>"'} allow="fullscreen"></iframe>
  </body></html>`);
}));

// Mount API routes (includes auth, portfolios, endorsements)
app.use('/api', apiRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler with proper HTTP status codes
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Default to 500 if status not set
  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
});

// ============================================
// Server Startup
// ============================================

const startServer = async () => {
  try {
    // Initialize mail service
    console.log('📧 Initializing mail service...');
    try {
      await initializeMailer();
    } catch (mailError) {
      console.error('⚠️ Warning: Mail service failed to initialize:', mailError.message);
      console.log('ℹ️ Server will start, but sending emails might fail until connection settings are fixed.');
    }

    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await initializeDatabase();
    
    // Initialize database tables
    await initializeTables();
    
    // Start Express server
    app.listen(PORT, HOST, () => {
      console.log(`\n🚀 Backend server started successfully!`);
      console.log(`📍 Server URL: http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS Origin: ${process.env.CORS_ORIGIN || 'https://peopleos.online'}`);
      console.log(`📧 Mail Service: Connected to ${process.env.SMTP_HOST}`);
      console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? `Configured (${process.env.GOOGLE_CLIENT_ID.slice(0, 20)}...)` : 'NOT CONFIGURED - set GOOGLE_CLIENT_ID in .env'}`);
      console.log(`\n✅ Ready to accept requests on loopback interface\n`);
      
      // Initialize automated email reminders for inactive users
      initializeFollowUpScheduler();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = async (signal) => {
  console.log(`\n\n${signal} received, shutting down gracefully...`);
  try {
    await closePool();
    console.log('✅ Database connection pool closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();
