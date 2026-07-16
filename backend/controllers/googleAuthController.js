// backend/controllers/googleAuthController.js
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const GlobalUsersModel = require('../models/GlobalUsers');
const PartnersModel = require('../models/Partners');
const { sendWelcomeEmail } = require('../config/mail');

/**
 * Initialize Google OAuth2 client
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * Generate Google OAuth consent screen URL and redirect directly
 * GET /api/auth/google?ref=partner-slug
 * This endpoint is used when the frontend sets window.location.href = '/api/auth/google?ref=...'
 */
const getGoogleAuthURL = (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    // Read the partner referral slug from query params and encode it into OAuth state
    const partnerSlug = req.query.ref || '';
    const statePayload = JSON.stringify({ partnerSlug });
    const stateEncoded = Buffer.from(statePayload).toString('base64');

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: stateEncoded,
    });

    // Redirect directly to Google — used when the browser navigates to this endpoint
    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error('❌ Error generating Google auth URL:', error.message);
    const frontendBase = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${frontendBase}/login?error=google_auth_init_failed`);
  }
};

/**
 * Google OAuth callback handler
 * GET /api/auth/google/callback
 */
const googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not provided',
      });
    }

    // Decode partner slug from OAuth state parameter
    let partnerSlug = '';
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        partnerSlug = decoded.partnerSlug || '';
      } catch (e) {
        console.warn('⚠️ Failed to decode OAuth state:', e.message);
      }
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const { data: googleUser } = await google.oauth2('v2').userinfo.get({
      auth: oauth2Client,
    });

    if (!googleUser.email) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get email from Google account',
      });
    }

    const email = googleUser.email.toLowerCase().trim();
    const fullName = googleUser.name || 'Google User';

    // Resolve partner ID from slug
    let partnerId = null;
    if (partnerSlug && typeof partnerSlug === 'string' && partnerSlug.trim()) {
      try {
        const partner = await PartnersModel.getPartnerBySlug(partnerSlug.trim());
        if (partner) partnerId = partner.id;
      } catch (e) {
        console.warn('⚠️ Failed to resolve partner slug:', e.message);
      }
    }

    // Check if user exists
    let user = await GlobalUsersModel.getUserByEmail(email);

    if (user) {
      // Existing user - check if Google OAuth is linked
      if (user.auth_provider !== 'google' && user.auth_provider !== 'local') {
        return res.status(400).json({
          success: false,
          error: 'Account already registered with different auth method',
        });
      }

      // If local auth user, allow linking (in production, ask for confirmation)
      if (user.auth_provider === 'local') {
        // Update to support both local and google
        // For now, just use existing account
      }

      // If user has no partner_id yet and we have one from referral, update it
      if (partnerId && !user.partner_id) {
        try {
          await GlobalUsersModel.updateUser(user.id, { partnerId });
          console.log(`✅ Updated existing user ${email} with partner_id=${partnerId}`);
        } catch (e) {
          console.warn('⚠️ Failed to update partner_id for existing user:', e.message);
        }
      }
    } else {
      // New user - create account with immediate verification and partner association
      user = await GlobalUsersModel.createUser({
        fullName,
        email,
        passSecureHash: null, // No password for OAuth users
        authProvider: 'google',
        isVerified: true, // Automatically verify Google OAuth users
        partnerId,
      });

      console.log(`✅ New user created via Google OAuth: ${email}${partnerId ? ` (partner_id=${partnerId})` : ''}`);

      // Send welcome email
      try {
        await sendWelcomeEmail(email, fullName);
      } catch (emailError) {
        console.error('Welcome email failed:', emailError.message);
        // Don't fail the auth if email fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email || email, authProvider: 'google' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    // Redirect to frontend /auth/callback with JWT token + user info as query params
    // CORS_ORIGIN is the frontend base URL (e.g. http://localhost:5173 or https://peopleos.online)
    const frontendBase = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const userName = encodeURIComponent(user.full_name || fullName);
    const userEmail = encodeURIComponent(user.email || email);
    const redirectUrl = `${frontendBase}/auth/callback?token=${token}&email=${userEmail}&name=${userName}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error.message);
    const frontendBase = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${frontendBase}/login?error=google_auth_failed`);
  }
};

/**
 * Verify Google token (for frontend-initiated flow)
 * POST /api/auth/google/verify-token
 */
const verifyGoogleToken = async (req, res, next) => {
  try {
    const { idToken, partnerSlug } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required',
      });
    }

    // Verify token with Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload.email) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get email from Google token',
      });
    }

    const email = payload.email.toLowerCase().trim();
    const fullName = payload.name || 'Google User';

    // Validate domain if configured
    if (process.env.GOOGLE_ALLOWED_DOMAIN) {
      const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;
      const userDomain = email.split('@')[1];

      if (userDomain !== allowedDomain) {
        return res.status(403).json({
          success: false,
          error: `Only ${allowedDomain} emails are allowed`,
        });
      }
    }

    // Resolve partner ID from slug
    let partnerId = null;
    if (partnerSlug && typeof partnerSlug === 'string' && partnerSlug.trim()) {
      try {
        const partner = await PartnersModel.getPartnerBySlug(partnerSlug.trim());
        if (partner) partnerId = partner.id;
      } catch (e) {
        console.warn('⚠️ Failed to resolve partner slug:', e.message);
      }
    }

    // Check if user exists
    let user = await GlobalUsersModel.getUserByEmail(email);

    if (user) {
      // Existing user
      if (user.auth_provider !== 'google' && user.auth_provider !== 'local') {
        return res.status(400).json({
          success: false,
          error: 'Account already registered with different auth method',
        });
      }

      // If user has no partner_id yet and we have one from referral, update it
      if (partnerId && !user.partner_id) {
        try {
          await GlobalUsersModel.updateUser(user.id, { partnerId });
        } catch (e) {
          console.warn('⚠️ Failed to update partner_id:', e.message);
        }
      }
    } else {
      // New user - create with immediate verification and partner association
      user = await GlobalUsersModel.createUser({
        fullName,
        email,
        passSecureHash: null,
        authProvider: 'google',
        isVerified: true, // Auto-verified for Google OAuth
        partnerId,
      });

      console.log(`✅ New user created via Google OAuth: ${email}${partnerId ? ` (partner_id=${partnerId})` : ''}`);

      // Send welcome email
      try {
        await sendWelcomeEmail(email, fullName);
      } catch (emailError) {
        console.error('Welcome email failed:', emailError.message);
      }
    }

    // Generate JWT token with Google provider info
    const token = jwt.sign(
      { userId: user.id, email: user.email || email, authProvider: 'google' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    return res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        userId: user.id,
        email: user.email || email,
        fullName: user.full_name || fullName,
        isVerified: user.is_verified !== undefined ? user.is_verified : true,
        authProvider: user.auth_provider || 'google',
        token,
      },
    });
  } catch (error) {
    console.error('❌ Google token verification error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Failed to verify Google token',
    });
  }
};

module.exports = {
  getGoogleAuthURL,
  googleCallback,
  verifyGoogleToken,
};


