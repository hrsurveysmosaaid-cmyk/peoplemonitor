// backend/controllers/partnerController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PartnersModel = require('../models/Partners');

/**
 * Partner Login
 * POST /api/partner/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const partner = await PartnersModel.getPartnerByEmail(email);
    if (!partner) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, partner.pass_secure_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { partnerId: partner.id, email: partner.admin_email, role: 'partner' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        partnerId: partner.id,
        name: partner.name,
        slug: partner.slug,
        logoUrl: partner.logo_url,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get partner's own students
 * GET /api/partner/students
 * Requires: partner JWT
 */
const getStudents = async (req, res, next) => {
  try {
    const { partnerId } = req.partner;
    const students = await PartnersModel.getPartnerStudents(partnerId);
    return res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

/**
 * Get partner's own profile (for dashboard header)
 * GET /api/partner/me
 */
const getMe = async (req, res, next) => {
  try {
    const { partnerId } = req.partner;
    const partner = await PartnersModel.getPartnerById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }
    const students = await PartnersModel.getPartnerStudents(partnerId);
    return res.json({
      success: true,
      data: {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        logoUrl: partner.logo_url,
        adminEmail: partner.admin_email,
        totalStudents: students.length,
        publishedCount: students.filter((s) => s.portfolios.some((p) => p.isPublished)).length,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getStudents, getMe };
