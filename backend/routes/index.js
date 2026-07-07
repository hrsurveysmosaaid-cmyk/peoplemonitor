// backend/routes/index.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuthenticate } = require('../middleware/authentication');
const { validateSuperAdminSession } = require('../middleware/superAdminAuth');
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const pdfController = require('../controllers/pdfController');
const endorsementController = require('../controllers/endorsementController');
const adminController = require('../controllers/adminController');
const CorePortfoliosModel = require('../models/CorePortfolios');
const PortfolioExperienceBlocksModel = require('../models/PortfolioExperienceBlocks');
const ExternalLiveEndorsementsModel = require('../models/ExternalLiveEndorsements');
const GlobalUsersModel = require('../models/GlobalUsers');

/**
 * API Routes Aggregator
 * All routes are combined here for cleaner server.js
 */

// ============================================
// Health Check
// ============================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Authentication Routes (Local)
// ============================================

/**
 * Sign-up / Register
 * POST /api/auth/signup
 * Body: { fullName, email, password, confirmPassword }
 */
router.post(
  '/auth/signup',
  asyncHandler(authController.signup)
);

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 * Body: { userId, otp }
 */
router.post(
  '/auth/verify-otp',
  asyncHandler(authController.verifyOTP)
);

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 * Body: { email }
 */
router.post(
  '/auth/resend-otp',
  asyncHandler(authController.resendOTP)
);

/**
 * Login
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post(
  '/auth/login',
  asyncHandler(authController.login)
);

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 * Body: { email }
 */
router.post(
  '/auth/forgot-password',
  asyncHandler(authController.forgotPassword)
);

/**
 * Reset Password
 * POST /api/auth/reset-password
 * Body: { token, newPassword, confirmPassword }
 */
router.post(
  '/auth/reset-password',
  asyncHandler(authController.resetPassword)
);

// ============================================
// Google OAuth 2.0 Routes
// ============================================

/**
 * Get Google OAuth URL
 * GET /api/auth/google
 */
router.get(
  '/auth/google',
  asyncHandler(googleAuthController.getGoogleAuthURL)
);

/**
 * Google OAuth Callback
 * GET /api/auth/google/callback
 */
router.get(
  '/auth/google/callback',
  asyncHandler(googleAuthController.googleCallback)
);

/**
 * Verify Google ID Token (frontend-initiated)
 * POST /api/auth/google/verify-token
 * Body: { idToken }
 */
router.post(
  '/auth/google/verify-token',
  asyncHandler(googleAuthController.verifyGoogleToken)
);

// ============================================
// Portfolio Routes
// ============================================

/**
 * Get portfolio by slug (public)
 * GET /api/portfolios/:slug
 */
router.get('/portfolios/by-slug/:slug', asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  const portfolio = await CorePortfoliosModel.getPortfolioBySlug(slug);
  if (!portfolio) {
    return res.status(404).json({ success: false, error: 'Portfolio not found' });
  }

  const experienceBlocks = await PortfolioExperienceBlocksModel.getExperienceBlocksByPortfolioId(portfolio.id);
  const endorsements = await ExternalLiveEndorsementsModel.getEndorsementsByPortfolioSlug(slug);

  return res.json({
    success: true,
    data: {
      portfolio,
      experienceBlocks,
      endorsements,
    },
  });
}));

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MicroSuccessStoriesModel = require('../models/MicroSuccessStories');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Invalid file type. Only PDF, PNG, and JPG are allowed.');
    err.statusCode = 400;
    return cb(err);
  }
});

/**
 * File upload route
 * POST /api/upload
 * Note: Files are stored privately. No public URL is returned.
 */
router.post('/upload', authenticate(), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  // Return opaque file identifier only
  return res.json({ success: true, fileId: req.file.filename });
});

/**
 * Secure uploads access — disabled for direct access
 * GET /api/uploads/:id
 */
router.get('/uploads/:id', authenticate(), (req, res) => {
  return res.status(403).json({ success: false, error: 'Direct file access is disabled.' });
});

/**
 * Delete an uploaded file by id
 * DELETE /api/upload/:fileId
 */
router.delete('/upload/:fileId', authenticate(), (req, res) => {
  const fileId = req.params.fileId;
  if (!fileId) {
    return res.status(400).json({ success: false, error: 'File id is required' });
  }
  const safeName = path.basename(fileId);
  const filePath = path.join(__dirname, '../uploads', safeName);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to delete file:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to delete file' });
    }
    return res.json({ success: true });
  });
});

/**
 * Get current user's portfolio (authenticated)
 * GET /api/portfolios/my
 */
router.get('/portfolios/my', authenticate(), asyncHandler(async (req, res) => {
  const portfolios = await CorePortfoliosModel.getPortfoliosByUserId(req.user.userId);
  if (!portfolios || portfolios.length === 0) {
    return res.json({ success: true, data: null });
  }
  const portfolio = portfolios[0];
  const experienceBlocks = await PortfolioExperienceBlocksModel.getExperienceBlocksByPortfolioId(portfolio.id);
  
  // Attach success stories to experience blocks
  const blocksWithStories = await Promise.all(experienceBlocks.map(async (block) => {
    const stories = await MicroSuccessStoriesModel.getSuccessStoriesByExperienceBlockId(block.id);
    return {
      ...block,
      successStory: stories && stories.length > 0 ? stories[0].story_essay_text : ''
    };
  }));

  const endorsements = await ExternalLiveEndorsementsModel.getEndorsementsByPortfolioId(portfolio.id);

  return res.json({
    success: true,
    data: {
      portfolio,
      experienceBlocks: blocksWithStories,
      endorsements
    }
  });
}));

/**
 * Save draft / Create / Update portfolio (authenticated)
 * POST /api/portfolios
 */
router.post('/portfolios', authenticate(), asyncHandler(async (req, res) => {
  const { personal, summary, experiences, education, skills, dynamicItems, isPublishedLive, desiredSlug } = req.body;
  const userId = req.user.userId;


  // Find if user already has a portfolio
  const existingPortfolios = await CorePortfoliosModel.getPortfoliosByUserId(userId);
  let portfolio;

  // Skills format
  const skillsClassified = {
    technical: skills?.technical || '',
    interpersonal: skills?.interpersonal || '',
    workRelated: skills?.workRelated || ''
  };

    if (existingPortfolios && existingPortfolios.length > 0) {
    portfolio = existingPortfolios[0];

    // Optional slug update (ensure uniqueness)
    let nextSlug = null;
    if (desiredSlug && typeof desiredSlug === 'string') {
      const sanitized = desiredSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || null;
      if (sanitized && sanitized !== portfolio.unique_slug_string) {
        let candidate = sanitized;
        let counter = 1;
        // ensure unique
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const existing = await CorePortfoliosModel.getPortfolioBySlug(candidate);
          if (!existing || existing.id === portfolio.id) break;
          candidate = `${sanitized}-${counter++}`.slice(0, 64);
        }
        nextSlug = candidate;
      }
    }

    // Update core portfolio
    await CorePortfoliosModel.updatePortfolio(portfolio.id, {
      personalDataJson: personal,
      professionalSummary: summary,
      skillsClassifiedJson: skillsClassified,
      isPublishedLive: isPublishedLive !== undefined ? isPublishedLive : portfolio.is_published_live,
      uniqueSlugString: nextSlug || null,
    });
    if (nextSlug) {
      portfolio.unique_slug_string = nextSlug;
    }
  } else {
    // Create new portfolio
    const { generateSlug } = require('../utils/helpers');
    const base = personal?.fullName || 'user';
    const auto = generateSlug(base);
    let nextSlug = auto;
    if (desiredSlug && typeof desiredSlug === 'string') {
      const sanitized = desiredSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || null;
      if (sanitized) {
        let candidate = sanitized;
        let counter = 1;
        // ensure unique
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const existing = await CorePortfoliosModel.getPortfolioBySlug(candidate);
          if (!existing) break;
          candidate = `${sanitized}-${counter++}`.slice(0, 64);
        }
        nextSlug = candidate;
      }
    }

    portfolio = await CorePortfoliosModel.createPortfolio({
      userId,
      uniqueSlugString: nextSlug,
      personalDataJson: personal || {},
      professionalSummary: summary || '',
      skillsClassifiedJson: skillsClassified,
      isPublishedLive: isPublishedLive || false
    });
  }


  // Clear existing experience blocks and recreate them to ensure synchronization
  const currentBlocks = await PortfolioExperienceBlocksModel.getExperienceBlocksByPortfolioId(portfolio.id);
  for (const b of currentBlocks) {
    await MicroSuccessStoriesModel.deleteSuccessStoriesByExperienceBlockId(b.id);
    await PortfolioExperienceBlocksModel.deleteExperienceBlock(b.id);
  }

    // Save new experience blocks
  if (Array.isArray(experiences)) {
    // Normalize various date formats into YYYY-MM-01 for MySQL DATE
    const normalizeToDate = (input) => {
      if (!input) return null;
      try {
        let s = String(input).trim();
        if (!s) return null;
        // Common patterns: YYYY-MM, YYYY/MM, MM/YYYY, YYYY-MM-DD
        let year = '';
        let month = '';
        const mmYYYY = /^(\d{2})[\/\-](\d{4})$/; // MM-YYYY or MM/YYYY
        const yyyyMM = /^(\d{4})[\/\-](\d{2})$/; // YYYY-MM or YYYY/MM
        const full = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/; // YYYY-MM-DD
        if (mmYYYY.test(s)) {
          const m = s.match(mmYYYY);
          month = m[1];
          year = m[2];
        } else if (yyyyMM.test(s)) {
          const m = s.match(yyyyMM);
          year = m[1];
          month = m[2];
        } else if (full.test(s)) {
          const m = s.match(full);
          year = m[1];
          month = m[2];
        } else {
          // Try to split by non-digits and guess
          const parts = s.split(/[^0-9]+/).filter(Boolean);
          if (parts.length >= 2) {
            if (parts[0].length === 4) { year = parts[0]; month = parts[1]; }
            else if (parts[1].length === 4) { year = parts[1]; month = parts[0]; }
          }
        }
        if (!year || !month) return null;
        // Clamp and pad month
        const mm = String(Math.max(1, Math.min(12, parseInt(month, 10) || 0))).padStart(2, '0');
        const yyyy = String(parseInt(year, 10));
        if (!/^\d{4}$/.test(yyyy)) return null;
        return `${yyyy}-${mm}-01`;
      } catch {
        return null;
      }
    };

    for (const exp of experiences) {
      const block = await PortfolioExperienceBlocksModel.createExperienceBlock({
        portfolioId: portfolio.id,
        blockType: 'work',
        institutionTitle: exp.company || '',
        roleDesignation: exp.title || '',
                dateStart: normalizeToDate(exp.startDate),
        dateEnd: normalizeToDate(exp.endDate),
        descriptionNarrative: exp.description || '',
        attachedAssetUrl: exp.attachedAssetUrl || null,
        externalNavigationUrl: exp.externalNavigationUrl || null
      });

      // Save micro success story if provided
      if (exp.successStory && exp.successStory.trim() !== '') {
        await MicroSuccessStoriesModel.createSuccessStory({
          experienceBlockId: block.id,
          storyEssayText: exp.successStory
        });
      }
    }
  }

  // Persist education and dynamicItems inside personal_data_json as the single source of truth.
  // IMPORTANT: Do NOT pass uniqueSlugString here — omit the key entirely so the slug
  // updated in the first pass (lines above) is not overwritten with null.
  await CorePortfoliosModel.updatePortfolio(portfolio.id, {
    personalDataJson: {
      ...personal,
      education: education || [],
      dynamicItems: dynamicItems || []
    },
    professionalSummary: summary,
    skillsClassifiedJson: skillsClassified,
    isPublishedLive: isPublishedLive !== undefined ? isPublishedLive : portfolio.is_published_live,
    // uniqueSlugString intentionally omitted to preserve slug set above
  });

  return res.json({
    success: true,
    message: 'Portfolio draft saved successfully',
    data: {
      slug: portfolio.unique_slug_string || portfolio.uniqueSlugString
    }
  });
}));

/**
 * Public route for viewing a portfolio
 * GET /api/portfolios/public/:slug
 */
router.get('/portfolios/public/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const portfolio = await CorePortfoliosModel.getPortfolioBySlug(slug);
  if (!portfolio) {
    return res.status(404).json({ success: false, error: 'Portfolio not found' });
  }

  if (!portfolio.is_published_live) {
    return res.status(404).json({ success: false, error: 'Portfolio is not published' });
  }

  const experienceBlocks = await PortfolioExperienceBlocksModel.getExperienceBlocksByPortfolioId(portfolio.id);
  
  // Attach success stories
  const blocksWithStories = await Promise.all(experienceBlocks.map(async (block) => {
    const stories = await MicroSuccessStoriesModel.getSuccessStoriesByExperienceBlockId(block.id);
    return {
      ...block,
      successStory: stories && stories.length > 0 ? stories[0].story_essay_text : ''
    };
  }));

  const endorsements = await ExternalLiveEndorsementsModel.getEndorsementsByPortfolioId(portfolio.id);

  return res.json({
    success: true,
    data: {
      portfolio,
      experienceBlocks: blocksWithStories,
      endorsements
    }
  });
}));

/**
 * Send request for recommendation/endorsement
 * POST /api/endorsements/send-request
 */
router.post('/endorsements/send-request', authenticate(), asyncHandler(async (req, res) => {
  const { endorserName, endorserEmail, endorserTitle, company, experienceTitle, experienceBlockId } = req.body;
  if (!endorserName || !endorserEmail || !endorserTitle || !company) {
    return res.status(400).json({ success: false, error: 'Missing required endorser information' });
  }

  const userId = req.user.userId;
  const user = await GlobalUsersModel.getUserById(userId);
  const portfolios = await CorePortfoliosModel.getPortfoliosByUserId(userId);
  const portfolio = portfolios && portfolios.length > 0 ? portfolios[0] : null;

  if (!portfolio) {
    return res.status(400).json({ success: false, error: 'Create and save your portfolio before requesting recommendations' });
  }

  const token = require('crypto').randomBytes(32).toString('hex');
  const publicBaseUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const endorsementLink = `${publicBaseUrl}/endorse/${token}`;

  await ExternalLiveEndorsementsModel.createPendingEndorsement({
    portfolioId: portfolio.id,
    experienceBlockId: experienceBlockId || null,
    requestorFullName: user.full_name,
    requestorEmail: user.email,
    requestorJobTitle: portfolio.personal_data_json?.jobTitle || '',
    requestorPortfolioSlug: portfolio.unique_slug_string,
    requestorExperienceTitle: experienceTitle || 'Work Experience',
    requestorCompanyName: company,
    tokenAuthString: token
  });

  // Trigger professional formal email using the shared mailer
  const nodemailer = require('nodemailer');
  
  // Custom transporter logic or reuse the existing transporter in config/mail.js
  const mailConfig = require('../config/mail');
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'PeopleOS'}" <${process.env.SMTP_USER}>`,
    to: endorserEmail,
    subject: `Recommendation Request from ${user.full_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recommendation Request</title>
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>Hello ${endorserName},</h2>
        <p><strong>${user.full_name}</strong> has requested a professional endorsement/recommendation from you for their work at <strong>${company}</strong> as a <strong>${experienceTitle || 'team member'}</strong>.</p>
        <p>Please click the link below to securely submit your signed endorsement/recommendation:</p>
        <p style="margin: 24px 0;">
          <a href="${endorsementLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Write Recommendation</a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p><code>${endorsementLink}</code></p>
        <br>
        <p>Best regards,</p>
        <p>The PeopleOS Team</p>
      </body>
      </html>
    `
  };

  try {
    const transporter = await mailConfig.initializeMailer();
    await transporter.sendMail(mailOptions);
  } catch (emailErr) {
    console.error('Failed to send endorsement email:', emailErr.message);
    // Continue despite email error, but inform client
    return res.json({
      success: true,
      message: 'Endorsement request created, but automated email failed to send. Please share the link manually.',
      link: endorsementLink
    });
  }

  return res.json({
    success: true,
    message: 'Endorsement request email sent successfully!',
    link: endorsementLink
  });
}));

/**
 * Submit endorsement form and signature
 * POST /api/endorsements/submit/:token
 */
router.post('/endorsements/submit/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { endorserName, endorserEmail, endorserTitleRole, endorsementBodyText, signatureVectorStream } = req.body;

  if (!endorserName || !endorserEmail || !endorserTitleRole || !endorsementBodyText || !signatureVectorStream) {
    return res.status(400).json({ success: false, error: 'Missing required endorsement submission fields' });
  }

  const record = await ExternalLiveEndorsementsModel.getEndorsementByAuthToken(token);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Endorsement request not found or token invalid' });
  }

  await ExternalLiveEndorsementsModel.updateEndorsementByToken(token, {
    endorserName,
    endorserEmail,
    endorserTitleRole,
    endorsementBodyText,
    signatureVectorStream
  });

  return res.json({ success: true, message: 'Endorsement submitted and saved successfully' });
}));

/**
 * Get endorsement request state by token (public)
 * GET /api/endorsements/:token
 */
router.get('/endorsements/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const record = await ExternalLiveEndorsementsModel.getEndorsementByAuthToken(token);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Invalid or expired token' });
  }
  return res.json({ success: true, data: record });
}));

/**
 * Export ATS-safe PDF
 * POST /api/export/pdf
 */
router.post('/export/pdf', asyncHandler(pdfController.exportPdf));


// ============================================
// Experience Blocks Routes
// ============================================

/**
 * Get experience blocks for portfolio (authenticated)
 * GET /api/portfolios/:portfolioId/experience-blocks
 */
router.get(
  '/portfolios/:portfolioId/experience-blocks',
  authenticate(),
  (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Experience blocks retrieval - Not yet implemented'
    });
  }
);

// ============================================
// Endorsements Routes (additional via controller)
// ============================================
// NOTE: The inline routes above (POST /endorsements/send-request, GET /endorsements/:token,
// POST /endorsements/submit/:token) already handle the primary endorsement flow.
// The endorsementController.requestEndorsement alias is kept for legacy compatibility only.

/**
 * Legacy alias — Request endorsement via endorsementController
 * POST /api/endorsements/request
 */
router.post('/endorsements/request', asyncHandler(endorsementController.requestEndorsement));

/**
 * Get endorsements for a public portfolio by slug
 * GET /api/portfolios/:slug/endorsements
 */
router.get('/portfolios/:slug/endorsements', asyncHandler(endorsementController.getEndorsementsByPortfolioSlug));

// ============================================
// Admin Routes
// ============================================

/**
 * List all users for super admin
 * GET /api/admin/users
 */
router.get('/admin/users', validateSuperAdminSession(), asyncHandler(adminController.listUsers));

/**
 * Create deep portal bridge for super admin
 * POST /admin/users/:userId/deep-portal
 */
router.post('/admin/users/:userId/deep-portal', validateSuperAdminSession(), asyncHandler(adminController.createDeepPortalBridge));

/**
 * Delete user and all associated data
 * DELETE /admin/users/:userId
 */
router.delete('/admin/users/:userId', validateSuperAdminSession(), asyncHandler(adminController.deleteUser));

// ============================================
// User Routes (to be implemented)
// ============================================

/**
 * Get current user profile (authenticated)
 * GET /api/users/me
 */
router.get('/users/me', authenticate(), (req, res) => {
  res.status(501).json({
    success: false,
    error: 'User profile retrieval - Not yet implemented'
  });
});

/**
 * Update user profile (authenticated)
 * PUT /api/users/me
 */
router.put('/users/me', authenticate(), (req, res) => {
  res.status(501).json({
    success: false,
    error: 'User profile update - Not yet implemented'
  });
});

// ============================================
// Assets signing (DEV-friendly, returns data URL)
// ============================================
router.get('/assets/signed', asyncHandler(async (req, res) => {
  const { ref } = req.query;
  if (!ref || typeof ref !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing ref' });
  }
  // Expecting refs like: private:<fileId>
  const id = String(ref).replace(/^private:/i, '').trim();
  if (!id) return res.status(400).json({ success: false, error: 'Invalid ref' });
  const safe = path.basename(id);
  const filePath = path.join(__dirname, '../uploads', safe);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }
  // Infer mime
  const ext = path.extname(safe).toLowerCase();
  const mime = ext === '.pdf' ? 'application/pdf'
    : ext === '.png' ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : 'application/octet-stream';

  const buf = fs.readFileSync(filePath);
  const b64 = buf.toString('base64');
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ success: true, url: `data:${mime};base64,${b64}` });
}));

module.exports = router;

