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
<html lang="ar" id="adminHtml" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Super Admin Gateway Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #030712;
      --card-bg: rgba(15, 23, 42, 0.6);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-color: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --danger: #ef4444;
      --danger-hover: #dc2626;
      --success: #10b981;
      --input-bg: rgba(255, 255, 255, 0.03);
      --header-bg: #0f172a;
    }
    
    .light {
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --card-border: rgba(0, 0, 0, 0.08);
      --text-color: #0f172a;
      --text-muted: #64748b;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --danger: #ef4444;
      --danger-hover: #dc2626;
      --success: #10b981;
      --input-bg: rgba(0, 0, 0, 0.02);
      --header-bg: #f1f5f9;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
    body {
      font-family: 'Inter', 'Outfit', sans-serif;
      background: var(--bg-color);
      color: var(--text-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    header {
      background: var(--header-bg);
      border-bottom: 1px solid var(--card-border);
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .brand-section { display: flex; align-items: center; gap: 12px; }
    .brand-icon { font-size: 24px; padding: 8px; background: var(--primary); border-radius: 12px; color: #fff; }
    .brand-title h1 { font-size: 20px; font-weight: 700; }
    .brand-title p { font-size: 12px; color: var(--text-muted); }

    .control-actions { display: flex; gap: 12px; align-items: center; }

    main { padding: 40px; flex-grow: 1; max-width: 1400px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
    
    .tabs-container {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 12px;
    }

    .tab-btn {
      padding: 10px 20px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-weight: 600;
      cursor: pointer;
      border-radius: 10px;
      font-size: 14px;
    }

    .tab-btn.active {
      background: var(--primary);
      color: #fff;
    }
    
    .panel-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 30px;
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .partner-form-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .form-group input {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--card-border);
      background: var(--input-bg);
      color: var(--text-color);
      font-size: 13px;
      outline: none;
    }

    .form-group input:focus {
      border-color: var(--primary);
    }

    .table-container { overflow-x: auto; margin-top: 24px; border-radius: 12px; border: 1px solid var(--card-border); }
    
    table { width: 100%; border-collapse: collapse; text-align: left; }
    [dir="rtl"] table { text-align: right; }
    
    th, td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid var(--card-border); }
    th { background: var(--header-bg); font-weight: 600; color: var(--text-color); text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
    
    tr:last-child td { border-bottom: none; }
    tr:hover { background: var(--input-bg); }

    .badge-verified { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--success); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }
    .badge-unverified { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--danger); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }

    button, select {
      padding: 10px 18px;
      border: none;
      border-radius: 10px;
      font-weight: 500;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }

    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-danger:hover { background: var(--danger-hover); }
    .btn-secondary { background: var(--card-border); color: var(--text-color); }

    .status-msg { margin-top: 16px; font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <header>
    <div class="brand-section">
      <div class="brand-icon">🛡</div>
      <div class="brand-title">
        <h1 id="titleHeader">بوابة المشرف العليا</h1>
        <p id="subtitleHeader">لوحة التحكم الفائقة للأنظمة المعزولة</p>
      </div>
    </div>
    <div class="control-actions">
      <select id="langSelect">
        <option value="ar">العربية (AR)</option>
        <option value="en">English (EN)</option>
      </select>
      <button id="themeToggle" class="btn-secondary">🌓</button>
      <button id="refreshBtn" class="btn-primary">🔄 <span id="refreshBtnText">تحديث البيانات</span></button>
    </div>
  </header>
  
  <main>
    <div class="tabs-container">
      <button id="tabUsers" class="tab-btn active">👤 <span id="tabUsersText">المستخدمين</span></button>
      <button id="tabPartners" class="tab-btn">🏫 <span id="tabPartnersText">المراكز التدريبية</span></button>
    </div>

    <!-- Users Panel -->
    <div id="usersPanel" class="panel-card">
      <div class="status-msg" id="status"></div>
      <div class="table-container" id="usersTable"></div>
    </div>

    <!-- Partners Panel -->
    <div id="partnersPanel" class="panel-card hidden">
      <div class="partner-form-card">
        <h3 id="formTitle" style="font-weight: 700; margin-bottom: 8px;">إضافة مركز تدريبي جديد</h3>
        <form id="partnerForm" onsubmit="createPartner(event)">
          <div class="form-grid">
            <div class="form-group">
              <label id="lblPartnerName">اسم المركز</label>
              <input id="partnerName" type="text" required placeholder="مثال: أكاديمية البرمجة" />
            </div>
            <div class="form-group">
              <label id="lblPartnerSlug">الرمز التعريفي (Slug)</label>
              <input id="partnerSlug" type="text" required placeholder="coding-academy" pattern="^[a-z0-9-]+$" title="Letters, numbers and hyphens only" />
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
          <button type="submit" class="btn-primary" style="margin-top: 16px;">➕ <span id="btnCreatePartner">إنشاء الحساب</span></button>
        </form>
      </div>

      <div class="status-msg" id="partnerStatus"></div>
      <div class="table-container" id="partnersTable"></div>
    </div>
  </main>

  <script>
    const translations = {
      ar: {
        title: "بوابة المشرف العليا",
        subtitle: "لوحة التحكم الفائقة للأنظمة المعزولة",
        refreshBtn: "تحديث البيانات",
        loading: "جاري التحميل...",
        loaded: "تم تحديث البيانات",
        failLoad: "فشل تحميل البيانات",
        deleteConfirm: "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
        deleteSuccess: "تم الحذف بنجاح",
        deleteFail: "فشل الحذف",
        verified: "نعم",
        unverified: "لا",
        id: "ID",
        name: "الاسم",
        email: "البريد الإلكتروني",
        status: "موثق",
        portfolios: "الحقائب",
        actions: "الإجراءات",
        bridgeBtn: "جسر الوصول العميق",
        deleteBtn: "حذف",
        tabUsers: "إدارة الطلاب",
        tabPartners: "إدارة المراكز التدريبية (الشركاء)",
        partnerFormTitle: "إضافة مركز تدريبي جديد",
        partnerName: "اسم المركز",
        partnerSlug: "الرمز الفريد للرابط (Slug)",
        partnerEmail: "بريد المسؤول",
        partnerPassword: "كلمة المرور",
        btnCreatePartner: "إنشاء الشريك",
        partnerCreated: "تم إنشاء حساب الشريك بنجاح",
        partnerCreateFail: "فشل إنشاء حساب الشريك",
        totalStudents: "عدد الطلاب",
        refLink: "رابط الإحالة المباشر",
        jobTitle: "المسمى الوظيفي",
        partnerCenter: "الجهة/المركز"
      },
      en: {
        title: "Super Admin Gateway",
        subtitle: "Enterprise Super Admin Panel Control Hub",
        refreshBtn: "Refresh Data",
        loading: "Loading...",
        loaded: "Data loaded successfully",
        failLoad: "Failed to load data",
        deleteConfirm: "Are you sure? This action cannot be undone.",
        deleteSuccess: "Deleted successfully",
        deleteFail: "Failed to delete",
        verified: "Yes",
        unverified: "No",
        id: "ID",
        name: "Name",
        email: "Email Address",
        status: "Verified",
        portfolios: "Portfolios",
        actions: "Actions",
        bridgeBtn: "Deep Access Bridge",
        deleteBtn: "Delete",
        tabUsers: "Manage Students",
        tabPartners: "Manage Training Centers (Partners)",
        partnerFormTitle: "Add New Training Center",
        partnerName: "Center Name",
        partnerSlug: "Referral Slug",
        partnerEmail: "Admin Email",
        partnerPassword: "Password",
        btnCreatePartner: "Create Partner",
        partnerCreated: "Partner account created successfully",
        partnerCreateFail: "Failed to create partner account",
        totalStudents: "Students Count",
        refLink: "Referral Link",
        jobTitle: "Job Title",
        partnerCenter: "Partner/Center"
      }
    };

    let currentLang = localStorage.getItem('adminLang') || 'ar';
    document.getElementById('langSelect').value = currentLang;
    document.getElementById('adminHtml').dir = currentLang === 'ar' ? 'rtl' : 'ltr';

    const updateTexts = () => {
      const t = translations[currentLang];
      document.getElementById('titleHeader').textContent = t.title;
      document.getElementById('subtitleHeader').textContent = t.subtitle;
      document.getElementById('refreshBtnText').textContent = t.refreshBtn;
      document.getElementById('tabUsersText').textContent = t.tabUsers;
      document.getElementById('tabPartnersText').textContent = t.tabPartners;
      document.getElementById('formTitle').textContent = t.partnerFormTitle;
      document.getElementById('lblPartnerName').textContent = t.partnerName;
      document.getElementById('lblPartnerSlug').textContent = t.partnerSlug;
      document.getElementById('lblPartnerEmail').textContent = t.partnerEmail;
      document.getElementById('lblPartnerPassword').textContent = t.partnerPassword;
      document.getElementById('btnCreatePartner').textContent = t.btnCreatePartner;
    };

    const setLanguage = (lang) => {
      currentLang = lang;
      localStorage.setItem('adminLang', lang);
      document.getElementById('adminHtml').dir = lang === 'ar' ? 'rtl' : 'ltr';
      updateTexts();
      loadData();
    };

    document.getElementById('langSelect').addEventListener('change', (e) => setLanguage(e.target.value));

    // Tab switching
    const tabUsers = document.getElementById('tabUsers');
    const tabPartners = document.getElementById('tabPartners');
    const usersPanel = document.getElementById('usersPanel');
    const partnersPanel = document.getElementById('partnersPanel');

    tabUsers.addEventListener('click', () => {
      tabUsers.classList.add('active');
      tabPartners.classList.remove('active');
      usersPanel.classList.remove('hidden');
      partnersPanel.classList.add('hidden');
    });

    tabPartners.addEventListener('click', () => {
      tabPartners.classList.add('active');
      tabUsers.classList.remove('active');
      partnersPanel.classList.remove('hidden');
      usersPanel.classList.add('hidden');
    });

    // Theme toggler
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
      const html = document.getElementById('adminHtml');
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        html.classList.add('light');
      } else {
        html.classList.remove('light');
        html.classList.add('dark');
      }
    });

    const statusEl = document.getElementById('status');
    const partnerStatusEl = document.getElementById('partnerStatus');
    const usersTableEl = document.getElementById('usersTable');
    const partnersTableEl = document.getElementById('partnersTable');

    const deleteUser = async (userId) => {
      if (!confirm(translations[currentLang].deleteConfirm)) return;
      statusEl.textContent = "...";
      try {
        const res = await fetch('/api/admin/users/' + userId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          statusEl.textContent = translations[currentLang].deleteSuccess;
          loadUsers();
        } else {
          statusEl.textContent = (data.error || translations[currentLang].deleteFail);
        }
      } catch (err) {
        statusEl.textContent = translations[currentLang].deleteFail;
      }
    };

    const deletePartner = async (partnerId) => {
      if (!confirm(translations[currentLang].deleteConfirm)) return;
      partnerStatusEl.textContent = "...";
      try {
        const res = await fetch('/api/admin/partners/' + partnerId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          partnerStatusEl.textContent = translations[currentLang].deleteSuccess;
          loadPartners();
        } else {
          partnerStatusEl.textContent = (data.error || translations[currentLang].deleteFail);
        }
      } catch (err) {
        partnerStatusEl.textContent = translations[currentLang].deleteFail;
      }
    };

    const createPartner = async (e) => {
      e.preventDefault();
      partnerStatusEl.textContent = "...";
      const name = document.getElementById('partnerName').value;
      const slug = document.getElementById('partnerSlug').value;
      const adminEmail = document.getElementById('partnerEmail').value;
      const password = document.getElementById('partnerPassword').value;

      try {
        const res = await fetch('/api/admin/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug, adminEmail, password })
        });
        const data = await res.json();
        if (data.success) {
          partnerStatusEl.textContent = translations[currentLang].partnerCreated;
          document.getElementById('partnerForm').reset();
          loadPartners();
        } else {
          partnerStatusEl.textContent = data.error || translations[currentLang].partnerCreateFail;
        }
      } catch {
        partnerStatusEl.textContent = translations[currentLang].partnerCreateFail;
      }
    };

    const renderUsers = (users) => {
      if (!users.length) {
        usersTableEl.innerHTML = '<p style="padding: 24px; text-align: center;">No users found.</p>';
        return;
      }

      const t = translations[currentLang];
      const rows = users.map(function(user) {
        const portfolioHtml = user.portfolios.length === 0 ? '<span style="color:#64748b;font-size:12px;">No portfolio</span>' : user.portfolios.map(function(p) {
          if (!p.slug) return '<span style="color:#64748b;font-size:12px;">—</span>';
          if (p.isPublishedLive) {
            return '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">' +
              '<a href="/p/' + p.slug + '" target="_blank" style="color:#4f46e5;text-decoration:underline;font-weight:500;font-size:13px;">' + p.slug + '</a>' +
              '<span style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);padding:2px 7px;border-radius:12px;font-size:11px;font-weight:600;">✅ Live</span>' +
              '<a href="/super-admin/preview-portfolio/' + p.slug + '" target="_blank" style="background:rgba(99,102,241,0.15);color:#6366f1;border:1px solid rgba(99,102,241,0.3);padding:2px 7px;border-radius:12px;font-size:11px;font-weight:600;text-decoration:none;">👁 Preview</a>' +
            '</div>';
          } else {
            return '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">' +
              '<span style="color:#94a3b8;font-size:13px;">' + p.slug + '</span>' +
              '<span style="background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.25);padding:2px 7px;border-radius:12px;font-size:11px;font-weight:600;">⏸ Draft</span>' +
              '<a href="/super-admin/preview-portfolio/' + p.slug + '" target="_blank" style="background:rgba(99,102,241,0.15);color:#6366f1;border:1px solid rgba(99,102,241,0.3);padding:2px 7px;border-radius:12px;font-size:11px;font-weight:600;text-decoration:none;">👁 Preview</a>' +
            '</div>';
          }
        }).join('');
        
        const badgeClass = user.isVerified ? 'badge-verified' : 'badge-unverified';
        const badgeText = user.isVerified ? t.verified : t.unverified;
        
        const partnerNameHtml = user.partnerName 
          ? '<span style="background:rgba(99,102,241,0.15);color:#6366f1;border:1px solid rgba(99,102,241,0.3);padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;">🏫 ' + user.partnerName + '</span>'
          : '<span style="color:#64748b;font-size:12px;">مستقل / Independent</span>';

        return '<tr>' +
          '<td>' + user.id + '</td>' +
          '<td><strong>' + user.fullName + '</strong></td>' +
          '<td>' + user.email + '</td>' +
          '<td><span style="font-weight:500;">' + user.jobTitle + '</span></td>' +
          '<td>' + partnerNameHtml + '</td>' +
          '<td><span class="' + badgeClass + '">' + badgeText + '</span></td>' +
          '<td>' + portfolioHtml + '</td>' +
          '<td style="display: flex; gap: 8px;">' +
            '<button class="btn-primary" data-bridge-id="' + user.id + '">🔑 ' + t.bridgeBtn + '</button>' +
            '<button class="btn-danger" data-delete-id="' + user.id + '">🗑 ' + t.deleteBtn + '</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      usersTableEl.innerHTML = '<table>' +
        '<thead><tr>' +
          '<th>' + t.id + '</th>' +
          '<th>' + t.name + '</th>' +
          '<th>' + t.email + '</th>' +
          '<th>' + t.jobTitle + '</th>' +
          '<th>' + t.partnerCenter + '</th>' +
          '<th>' + t.status + '</th>' +
          '<th>' + t.portfolios + '</th>' +
          '<th>' + t.actions + '</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';

      document.querySelectorAll('[data-bridge-id]').forEach((button) => {
        button.addEventListener('click', async () => {
          const userId = button.getAttribute('data-bridge-id');
          statusEl.textContent = '...';
          const response = await fetch('/api/admin/users/' + userId + '/deep-portal', { method: 'POST' });
          const payload = await response.json();
          if (!payload.success) {
            statusEl.textContent = payload.error || 'Bridge error';
            return;
          }
          window.open(payload.data.bridgeUrl, '_blank');
          statusEl.textContent = t.loaded;
        });
      });

      document.querySelectorAll('[data-delete-id]').forEach((button) => {
        button.addEventListener('click', () => {
          deleteUser(button.getAttribute('data-delete-id'));
        });
      });
    };

    const renderPartners = (partners) => {
      if (!partners.length) {
        partnersTableEl.innerHTML = '<p style="padding: 24px; text-align: center;">No partners found.</p>';
        return;
      }

      const t = translations[currentLang];
      const origin = window.location.origin;

      const rows = partners.map(function(partner) {
        const refUrl = origin + '/register?ref=' + partner.slug;
        return '<tr>' +
          '<td>' + partner.id + '</td>' +
          '<td><strong>' + partner.name + '</strong><br/><small style="color:var(--text-muted)">slug: ' + partner.slug + '</small></td>' +
          '<td>' + partner.adminEmail + '</td>' +
          '<td><span class="badge-verified">' + partner.totalStudents + '</span></td>' +
          '<td><a href="' + refUrl + '" target="_blank" style="color:var(--primary); font-size:12px; text-decoration:underline;">' + refUrl + '</a></td>' +
          '<td>' +
            '<button class="btn-danger" data-partner-delete-id="' + partner.id + '">🗑 ' + t.deleteBtn + '</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      partnersTableEl.innerHTML = '<table>' +
        '<thead><tr>' +
          '<th>' + t.id + '</th>' +
          '<th>' + t.name + '</th>' +
          '<th>' + t.email + '</th>' +
          '<th>' + t.totalStudents + '</th>' +
          '<th>' + t.refLink + '</th>' +
          '<th>' + t.actions + '</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';

      document.querySelectorAll('[data-partner-delete-id]').forEach((button) => {
        button.addEventListener('click', () => {
          deletePartner(button.getAttribute('data-partner-delete-id'));
        });
      });
    };

    const loadUsers = async () => {
      statusEl.textContent = translations[currentLang].loading;
      try {
        const response = await fetch('/api/admin/users?t=' + new Date().getTime());
        const payload = await response.json();
        if (!payload.success) {
          statusEl.textContent = payload.error || translations[currentLang].failLoad;
          return;
        }
        renderUsers(payload.data);
        statusEl.textContent = translations[currentLang].loaded;
      } catch (err) {
        statusEl.textContent = translations[currentLang].failLoad;
      }
    };

    const loadPartners = async () => {
      partnerStatusEl.textContent = translations[currentLang].loading;
      try {
        const response = await fetch('/api/admin/partners?t=' + new Date().getTime());
        const payload = await response.json();
        if (!payload.success) {
          partnerStatusEl.textContent = payload.error || translations[currentLang].failLoad;
          return;
        }
        renderPartners(payload.data);
        partnerStatusEl.textContent = translations[currentLang].loaded;
      } catch {
        partnerStatusEl.textContent = translations[currentLang].failLoad;
      }
    };

    const loadData = () => {
      loadUsers();
      loadPartners();
    };

    document.getElementById('refreshBtn').addEventListener('click', loadData);
    
    // Initial Load
    updateTexts();
    loadData();
  </script>
</body>
</html>`;

const renderUserWorkstationPage = (user, portfolios) => `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Workstation Override - ${user.full_name}</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;background:#020617;color:#e2e8f0;margin:0;padding:24px}header{margin-bottom:24px}section{background:#0f172a;border:1px solid #334155;border-radius:20px;padding:24px;margin-bottom:18px}h1,h2{margin:0 0 12px 0}dl{display:grid;grid-template-columns:max-content 1fr;gap:8px}dt{color:#94a3b8}dd{margin:0}</style>
</head>
<body>
  <header>
    <h1>لوحة العمل للمستخدم</h1>
    <p>الوصول المباشر بصلاحيات تخطي قراءات/كتابة.</p>
  </header>
  <section>
    <h2>معلومات المستخدم</h2>
    <dl>
      <dt>الاسم الكامل:</dt><dd>${user.full_name}</dd>
      <dt>البريد الإلكتروني:</dt><dd>${user.email}</dd>
      <dt>موثق:</dt><dd>${user.is_verified ? 'نعم' : 'لا'}</dd>
      <dt>تاريخ الإنشاء:</dt><dd>${user.record_created}</dd>
    </dl>
  </section>
  <section>
    <h2>الحقائب المهنية</h2>
    ${portfolios.length === 0 ? '<p>لا توجد حقائب حالياً.</p>' : portfolios.map(function(portfolio) { return '<div style="margin-bottom:12px;padding:14px;border:1px solid #334155;border-radius:14px"><strong>Slug:</strong> ' + portfolio.unique_slug_string + '<br /><strong>منشور:</strong> ' + (portfolio.is_published_live ? 'نعم' : 'لا') + '</div>'; }).join('')}
  </section>
</body>
</html>`;

app.post('/super-admin-gateway-portal/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || !validateSuperAdminCredentials(email, password)) {
    return res.send(renderSuperAdminLoginPage('Invalid credentials. Please check your email and password.'));
  }
  createSuperAdminSessionCookie(res);
  res.redirect('/super-admin-gateway-portal');
}));

app.get('/super-admin-gateway-portal', (req, res) => {
  if (!isValidSuperAdminSession(req)) {
    return res.redirect('/super-admin-gateway-portal/login');
  }
  res.send(renderSuperAdminPortalPage());
});

const renderEndorsementWorkspacePage = (token) => `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>نموذج التوصية الآمنة</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;background:#020617;color:#f8fafc;margin:0;padding:24px}main{max-width:980px;margin:auto}header{margin-bottom:20px}section{background:#0f172a;border:1px solid #334155;border-radius:20px;padding:24px;margin-bottom:18px}label{display:block;margin-bottom:12px}input,textarea{width:100%;padding:12px;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#f8fafc;font-size:14px}button{cursor:pointer;padding:12px 18px;border:none;border-radius:12px;background:#0284c7;color:#fff;font-size:14px}canvas{border:1px solid #334155;border-radius:16px;background:#020617;width:100%;height:280px;touch-action:none}pre{white-space:pre-wrap;word-break:break-word;background:#02111f;border:1px solid #334155;padding:14px;border-radius:16px;color:#cbd5e1}</style>
</head>
<body>
  <main>
    <header>
      <h1>واجهة الموصي الخارجية</h1>
      <p>املأ بيانات التحقق والتوقيع الإلكتروني ثم احفظ التوصية لتظهر مباشرة بجانب تجربة الشركة.</p>
    </header>

    <section>
      <div id="requestInfo" style="margin-bottom:18px;color:#94a3b8">تحميل بيانات الطلب...</div>
      <form id="endorsementForm">
        <label>الاسم الكامل
          <input type="text" id="endorserName" placeholder="الاسم" required />
        </label>
        <label>المسمى الوظيفي
          <input type="text" id="endorserTitleRole" placeholder="مثال: مدير فريق تطوير" required />
        </label>
        <label>اسم الشركة
          <input type="text" id="endorserCompany" placeholder="مثال: PeopleOS" required />
        </label>
        <label>البريد الإلكتروني المؤسسي
          <input type="email" id="endorserEmail" placeholder="example@company.com" required />
        </label>
        <label>النص التوصية
          <textarea id="endorsementBodyText" rows="6" placeholder="اكتب توصية مهنية صادقة ومركزة" required></textarea>
        </label>
        <section>
          <h2>التوقيع الرقمي</h2>
          <p style="color:#94a3b8;margin-bottom:12px">استخدم الفأرة أو الإصبع للرسم داخل اللوحة ثم اضغط حفظ.</p>
          <canvas id="signatureCanvas"></canvas>
          <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap"><button id="clearCanvas" type="button">مسح التوقيع</button><button id="saveSignature" type="button">حفظ التوقيع</button></div>
          <pre id="signatureVector" style="margin-top:16px;display:none"></pre>
        </section>
        <button type="submit" style="margin-top:18px">إرسال التوصية</button>
      </form>
      <div id="feedback" style="margin-top:18px;color:#cbd5e1"></div>
    </section>
  </main>
  <script>
    const token = ${JSON.stringify(token)};
    const requestInfo = document.getElementById('requestInfo');
    const feedback = document.getElementById('feedback');
    const form = document.getElementById('endorsementForm');
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clearCanvas');
    const saveSignatureBtn = document.getElementById('saveSignature');
    const signatureVector = document.getElementById('signatureVector');
    let drawing = false;
    let points = [];

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#38bdf8';
    };

    const addPoint = (x, y) => {
      points.push({ x, y, time: Date.now() });
      if (points.length < 2) return;
      const prev = points[points.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const clearCanvas = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      points = [];
      signatureVector.style.display = 'none';
      signatureVector.textContent = '';
    };

    const toCoordinatesStream = () => JSON.stringify(points);

    canvas.addEventListener('pointerdown', (event) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      addPoint(event.clientX - rect.left, event.clientY - rect.top);
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      addPoint(event.clientX - rect.left, event.clientY - rect.top);
    });

    canvas.addEventListener('pointerup', () => { drawing = false; });
    canvas.addEventListener('pointerleave', () => { drawing = false; });

    clearBtn.addEventListener('click', clearCanvas);
    saveSignatureBtn.addEventListener('click', () => {
      signatureVector.textContent = toCoordinatesStream();
      signatureVector.style.display = 'block';
      feedback.textContent = 'تم حفظ التوقيع كتيار متجه.';
    });

    const loadRequestInfo = async () => {
      const res = await fetch('/api/endorsements/' + token);
      const payload = await res.json();
      if (!payload.success) {
        requestInfo.textContent = 'رابط التوصية غير صالح أو انتهى.';
        return;
      }
      const requestData = payload.data;
      requestInfo.innerHTML = '<strong>طلب من:</strong> ' + (requestData.requestor_full_name || 'غير معروف') + ' — <strong>شركة:</strong> ' + (requestData.requestor_company_name || 'غير معروف') + '<br /><strong>الخبرة:</strong> ' + (requestData.requestor_experience_title || 'غير محدد');
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('endorserName').value.trim();
      const title = document.getElementById('endorserTitleRole').value.trim();
      const company = document.getElementById('endorserCompany').value.trim();
      const email = document.getElementById('endorserEmail').value.trim();
      const bodyText = document.getElementById('endorsementBodyText').value.trim();
      const signatureData = toCoordinatesStream();
      if (!name || !title || !company || !email || !bodyText || !signatureData) {
        feedback.textContent = 'يرجى ملء جميع الحقول وحفظ التوقيع.';
        return;
      }

      const res = await fetch('/api/endorsements/submit/' + token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endorserName: name,
          endorserEmail: email,
          endorserTitleRole: title + ' في ' + company,
          endorsementBodyText: bodyText,
          signatureVectorStream: signatureData,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        feedback.textContent = result.error || 'حدث خطأ أثناء حفظ التوصية.';
        return;
      }
      feedback.textContent = 'تم حفظ التوصية بنجاح. ستظهر تلقائياً على الصفحة العامة للمستخدم.';
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    loadRequestInfo();
  </script>
</body>
</html>`;

app.get('/super-admin-gateway-portal/login', (req, res) => {
  // If already authenticated, redirect directly to portal
  if (isValidSuperAdminSession(req)) {
    return res.redirect('/super-admin-gateway-portal');
  }
  res.send(renderSuperAdminLoginPage());
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
