// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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
<html lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Super Admin Gateway Portal</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;background:#030712;color:#f8fafc;margin:0;padding:0}header{background:#0f172a;padding:24px;text-align:center;border-bottom:1px solid #334155}main{padding:24px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #334155;padding:12px;text-align:left;font-size:13px}th{background:#0f172a;color:#e2e8f0}tr:nth-child(even){background:#020617}button{padding:8px 12px;border:none;border-radius:8px;background:#0284c7;color:#fff;cursor:pointer}button:hover{background:#0369a1}pre{background:#020617;padding:12px;border-radius:12px;overflow:auto}</style>
</head>
<body>
  <header>
    <h1>بوابة المشرف العليا المعزولة</h1>
    <p>يمكنك الوصول مباشرة إلى لوحات المستخدمين وإجراء اختراق برمي آمن.</p>
  </header>
  <main>
    <section>
      <button id="refreshBtn">تحديث بيانات المستخدمين</button>
      <div id="status" style="margin-top:12px;color:#94a3b8"></div>
      <div id="users"></div>
    </section>
  </main>
  <script>
    const statusEl = document.getElementById('status');
    const usersEl = document.getElementById('users');
    const refreshBtn = document.getElementById('refreshBtn');

    const renderUsers = (users) => {
      if (!users.length) {
        usersEl.innerHTML = '<p>لا يوجد مستخدمون حتى الآن.</p>';
        return;
      }

      const rows = users.map(function(user) {
        var portfolioHtml = user.portfolios.map(function(p) {
          return '<div>' + (p.slug || '-') + (p.isPublishedLive ? ' ✅' : '') + '</div>';
        }).join('');
        return '<tr>' +
          '<td>' + user.id + '</td>' +
          '<td>' + user.fullName + '</td>' +
          '<td>' + user.email + '</td>' +
          '<td>' + (user.isVerified ? 'نعم' : 'لا') + '</td>' +
          '<td>' + portfolioHtml + '</td>' +
          '<td><button data-user-id="' + user.id + '">جسر الوصول العميق</button></td>' +
        '</tr>';
      }).join('');

      usersEl.innerHTML = '<table>' +
        '<thead><tr><th>ID</th><th>الاسم</th><th>البريد</th><th>موثق</th><th>الحقائب</th><th>جسر</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';

      document.querySelectorAll('[data-user-id]').forEach((button) => {
        button.addEventListener('click', async () => {
          const userId = button.getAttribute('data-user-id');
          statusEl.textContent = 'جارٍ إنشاء رابط الجسر...';
          const response = await fetch('/api/admin/users/' + userId + '/deep-portal', { method: 'POST' });
          const payload = await response.json();
          if (!payload.success) {
            statusEl.textContent = payload.error || 'فشل إنشاء الجسر';
            return;
          }
          window.open(payload.data.bridgeUrl, '_blank');
          statusEl.textContent = 'تم فتح جسر الوصول في نافذة جديدة';
        });
      });
    };

    const loadUsers = async () => {
      statusEl.textContent = 'جارٍ تحميل قائمة المستخدمين...';
      const response = await fetch('/api/admin/users');
      const payload = await response.json();
      if (!payload.success) {
        statusEl.textContent = payload.error || 'فشل تحميل المستخدمين';
        return;
      }
      renderUsers(payload.data);
      statusEl.textContent = 'تم تحميل المستخدمين بنجاح';
    };

    refreshBtn.addEventListener('click', loadUsers);
    loadUsers();
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
