// backend/config/mail.js
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Nodemailer transporter instance
 * Configured for Hostinger SMTP with strict SSL/TLS
 */
let transporter;

/**
 * Initialize mail transporter
 */
const initializeMailer = async () => {
  try {
    const port = parseInt(process.env.SMTP_PORT) || 465;
    const userEmail = process.env.SMTP_USER || '';
    const isGmail = userEmail.toLowerCase().includes('@gmail.com');
    const defaultHost = isGmail ? 'smtp.gmail.com' : 'smtp.hostinger.com';

    console.log(`[Mailer Setup] Connecting to ${process.env.SMTP_HOST || defaultHost} on port ${port} with user ${userEmail}`);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || defaultHost,
      port: port,
      secure: port === 465, // true for 465, false for 587/25
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Mail transporter initialized successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Mail transporter initialization failed:', error.message);
    throw error;
  }
};

/**
 * Send OTP email for email verification
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code (6 digits)
 * @param {string} fullName - User's full name
 * @returns {Promise<Object>} Send result
 */
const sendOTPEmail = async (email, otp, fullName = 'User') => {
  if (!transporter) {
    await initializeMailer();
  }

  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME || 'PeopleOS'} <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'تحقق من بريدك الإلكتروني - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تحقق من بريدك</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            direction: rtl;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .content p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin: 15px 0;
          }
          .otp-box {
            margin: 30px 0;
            padding: 20px;
            background: #f9f9f9;
            border: 2px solid #667eea;
            border-radius: 8px;
          }
          .otp-code {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 5px;
            font-family: 'Courier New', monospace;
          }
          .expiration {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 15px;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
          }
          .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 PeopleOS</h1>
            <p>تحقق من بريدك الإلكتروني</p>
          </div>
          
          <div class="content">
            <p>مرحباً ${fullName},</p>
            <p>شكراً لتسجيلك معنا في منصة PeopleOS!</p>
            
            <p>استخدم الرمز أدناه للتحقق من عنوان بريدك الإلكتروني:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiration">⏱️ ينتهي الرمز خلال 10 دقائق</div>
            </div>
            
            <div class="warning">
              ⚠️ لا تشارك هذا الرمز مع أحد. لن نطلب منك هذا الرمز عبر البريد أو الهاتف.
            </div>
            
            <p style="margin-top: 30px; color: #999; font-size: 14px;">
              إذا لم تطلب هذا الرمز، تجاهل هذا البريد.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 PeopleOS. جميع الحقوق محفوظة.</p>
            <p>هذا بريد آلي، يرجى عدم الرد عليه.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} fullName - User's full name
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetEmail = async (email, resetToken, fullName = 'User') => {
  if (!transporter) {
    await initializeMailer();
  }

    const baseUrl = process.env.CORS_ORIGIN || process.env.PUBLIC_APP_URL || 'http://localhost:5173';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;


  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME || 'PeopleOS'} <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'إعادة تعيين كلمة المرور - Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            direction: rtl;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .content p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            margin: 30px 0;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: scale(1.05);
          }
          .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
          }
          .warning {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-left: 4px solid #f5c6cb;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 PeopleOS</h1>
            <p>إعادة تعيين كلمة المرور</p>
          </div>
          
          <div class="content">
            <p>مرحباً ${fullName},</p>
            <p>تلقينا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
            
            <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
            
            <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
            
            <p style="font-size: 14px; color: #999;">
              أو انسخ واستخدم الرابط التالي:<br>
              <code>${resetLink}</code>
            </p>
            
            <div class="warning">
              ⏱️ هذا الرابط صالح لمدة 1 ساعة فقط.
            </div>
            
            <p style="margin-top: 30px; color: #999; font-size: 14px;">
              إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد أو تواصل معنا.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 PeopleOS. جميع الحقوق محفوظة.</p>
            <p>هذا بريد آلي، يرجى عدم الرد عليه.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @returns {Promise<Object>} Send result
 */
const sendWelcomeEmail = async (email, fullName = 'User') => {
  if (!transporter) {
    await initializeMailer();
  }

  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME || 'PeopleOS'} <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'مرحباً بك في PeopleOS - Welcome to PeopleOS',
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مرحباً بك</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            direction: rtl;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
          }
          .content {
            padding: 40px 30px;
            text-align: right;
          }
          .content p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin: 15px 0;
          }
          .feature-list {
            text-align: right;
            margin: 30px 0;
          }
          .feature-item {
            padding: 12px 0;
            color: #666;
            border-bottom: 1px solid #eee;
          }
          .feature-item:first-child {
            font-weight: bold;
            color: #667eea;
          }
          .button {
            display: inline-block;
            margin: 30px 0;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 مرحباً بك!</h1>
            <p>حسابك جاهز للاستخدام</p>
          </div>
          
          <div class="content">
            <p>مرحباً ${fullName},</p>
            <p>حسابك تم التحقق منه بنجاح! الآن يمكنك الوصول إلى جميع ميزات PeopleOS.</p>
            
            <a href="https://peopleos.online/dashboard" class="button">ادخل إلى لوحة التحكم</a>
            
            <h3 style="margin-top: 40px; color: #333;">ما الذي يمكنك فعله الآن؟</h3>
            <div class="feature-list">
              <div class="feature-item">✨ إنشاء محفظة احترافية</div>
              <div class="feature-item">📝 إضافة خبراتك ومشاريعك</div>
              <div class="feature-item">⭐ الحصول على موافقات واستشهادات</div>
              <div class="feature-item">🚀 نشر محفظتك للعالم</div>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2026 PeopleOS. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * Send automated follow-up email to remind users to complete and publish their portfolios
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @returns {Promise<Object>} Send result
 */
const sendFollowUpEmail = async (email, fullName = 'User') => {
  if (!transporter) {
    await initializeMailer();
  }

  const loginUrl = process.env.CORS_ORIGIN || 'https://peopleos.online';

  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME || 'PeopleOS'} <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'أكمل بيانات حقيبتك المهنية وانشرها للشركات - Complete and Publish Your PeopleOS CV',
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>أكمل بيانات حقيبتك المهنية</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
            direction: rtl;
          }
          .wrapper {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 26px;
            margin-bottom: 8px;
            font-weight: 850;
            letter-spacing: -0.02em;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
          }
          .text-p {
            font-size: 15px;
            color: #475569;
            margin-bottom: 20px;
          }
          .steps-box {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #e2e8f0;
          }
          .steps-title {
            font-size: 14px;
            font-weight: 800;
            color: #4f46e5;
            text-transform: uppercase;
            margin-bottom: 16px;
            letter-spacing: 0.05em;
          }
          .step-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 14px;
            font-size: 14px;
            color: #334155;
          }
          .step-number {
            width: 24px; height: 24px;
            background: #4f46e5; color: white;
            border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 12px;
            flex-shrink: 0;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(79,70,229,0.3);
          }
          .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
          }
          .footer {
            background: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🚀 PeopleOS</h1>
            <p>فرصتك المهنية بانتظارك</p>
          </div>
          
          <div class="content">
            <p class="greeting">مرحباً ${fullName}،</p>
            <p class="text-p">لقد لاحظنا أنه قد مر أكثر من أسبوع منذ انضمامك إلى منصة <strong>PeopleOS</strong>، ولكنك لم تقم بنشر حقيبتك المهنية وسيرتك الذاتية بعد.</p>
            
            <p class="text-p">الشركات ومسؤولو التوظيف يبحثون باستمرار في المنصة، والسبيل الوحيد ليظهر ملفك الشخصي لهم هو <strong>إكمال وتحديث بياناتك ثم تفعيل خيار النشر</strong>.</p>
            
            <div class="steps-box">
              <div class="steps-title">💡 خطوات بسيطة لإطلاق ملفك:</div>
              <div class="step-item">
                <div class="step-number">١</div>
                <div>ادخل إلى حسابك الشخصي في المنصة.</div>
              </div>
              <div class="step-item">
                <div class="step-number">٢</div>
                <div>أكمل ملء حقول المسمى الوظيفي، الخبرات، والمهارات.</div>
              </div>
              <div class="step-item">
                <div class="step-number">٣</div>
                <div>اضغط على زر <strong>"نشر"</strong> في الأعلى لتفعيل الرابط الشخصي ومشاركته.</div>
              </div>
            </div>
            
            <div class="btn-container">
              <a href="${loginUrl}" class="button">دخول لوحة التحكم وإكمال الملف ←</a>
            </div>
            
            <div class="divider"></div>
            
            <p class="text-p" style="font-size: 13px; color: #64748b;">
              <strong>English Summary:</strong> We noticed you registered 7 days ago but haven't published your portfolio. Recruiters cannot see your profile until it's published. Please log in and click "Publish" in the header to activate your profile.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 PeopleOS. جميع الحقوق محفوظة.</p>
            <p>لقد تلقيت هذا البريد الإلكتروني لأنك مسجل في PeopleOS.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Follow-up email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send follow-up email to ${email}:`, error.message);
    throw new Error(`Failed to send follow-up email: ${error.message}`);
  }
};

module.exports = {
  initializeMailer,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFollowUpEmail,
};
