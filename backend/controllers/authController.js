// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GlobalUsersModel = require('../models/GlobalUsers');
const { sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../config/mail');
const { generateOTP, validateEmail } = require('../utils/helpers');

/**
 * Sign-up / Register new user
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, email, password, confirmPassword',
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    // Validate password strength (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
      });
    }

    // Check if user already exists
    const existingUser = await GlobalUsersModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otpToken = generateOTP(6);

    // Create user with is_verified = false
    const newUser = await GlobalUsersModel.createUser({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passSecureHash: hashedPassword,
      authProvider: 'local',
      isVerified: false,
    });

    // Set OTP token
    const otpExpirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES) || 10;
    await GlobalUsersModel.setOTPToken(newUser.id, otpToken, otpExpirationMinutes);

    // Send OTP email
    try {
      await sendOTPEmail(email, otpToken, fullName);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Don't fail signup even if email fails, but log it
      // In production, you might want to retry or queue this
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent to your inbox.',
      data: {
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        isVerified: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and email
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    // Validate required fields
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, otp',
      });
    }

    // Get user
    const user = await GlobalUsersModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
      });
    }

    // Verify OTP
    const isValidOTP = await GlobalUsersModel.verifyOTPToken(userId, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
    }

    // Mark user as verified and clear OTP
    await GlobalUsersModel.updateUser(userId, {
      isVerified: true,
      otpTokenString: null,
      otpExpiration: null,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.full_name);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    return res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        isVerified: true,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
      });
    }

    // Get user
    const user = await GlobalUsersModel.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
      });
    }

    // Generate new OTP
    const otpToken = generateOTP(6);
    const otpExpirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES) || 10;
    await GlobalUsersModel.setOTPToken(user.id, otpToken, otpExpirationMinutes);

    // Send OTP email
    try {
      await sendOTPEmail(email, otpToken, user.full_name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      throw emailError;
    }

    return res.json({
      success: true,
      message: 'OTP resent to your email',
      data: { email },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user (local authentication)
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password',
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Get user
    const user = await GlobalUsersModel.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        error: 'Email not verified. Please check your inbox for the OTP.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.pass_secure_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        isVerified: user.is_verified,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
      });
    }

    // Get user
    const user = await GlobalUsersModel.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If email exists, password reset link will be sent',
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.full_name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      throw emailError;
    }

    return res.json({
      success: true,
      message: 'If email exists, password reset link will be sent',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, newPassword, confirmPassword',
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    // Check token type
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token type',
      });
    }

    // Get user
    const user = await GlobalUsersModel.getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await GlobalUsersModel.updateUser(user.id, {
      passSecureHash: hashedPassword,
    });

    return res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
};
