# Authentication API Documentation

## نظرة عامة (Overview)

هذا المستند يوضح جميع endpoints المصادقة والتحقق المتاحة في منصة PeopleOS.

### نقاط القوة (Features)

✅ **Local Authentication** - تسجيل وتسجيل دخول محلي
✅ **Email Verification** - التحقق من البريد بـ OTP
✅ **Google OAuth 2.0** - تسجيل دخول آمن عبر جوجل
✅ **JWT Tokens** - توكنات آمنة وموثوقة
✅ **Password Reset** - استعادة الكلمات المرورية
✅ **Auto-Verification** - التحقق الفوري لمستخدمي جوجل

---

## 🔐 Local Authentication (المصادقة المحلية)

### 1. Sign-Up / التسجيل

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "fullName": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email with the OTP sent to your inbox.",
  "data": {
    "userId": 1,
    "email": "ahmed@example.com",
    "fullName": "أحمد محمد",
    "isVerified": false
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Password must be at least 8 characters with uppercase, lowercase, and numbers"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Notes:**
- عند التسجيل، يتم إرسال رمز OTP من 6 أرقام إلى البريد الإلكتروني
- الحساب لن يكون نشطاً إلا بعد التحقق من OTP
- كلمة المرور يتم تشفيرها بـ bcrypt قبل الحفظ

---

### 2. Verify OTP / التحقق من الرمز

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "userId": 1,
  "otp": "123456"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "userId": 1,
    "email": "ahmed@example.com",
    "fullName": "أحمد محمد",
    "isVerified": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

**Notes:**
- الرمز صالح لمدة 10 دقائق فقط
- بعد التحقق الناجح، يتم إرسال بريد ترحيب
- يتم إصدار JWT توكن للجلسة

---

### 3. Resend OTP / إعادة إرسال الرمز

**Endpoint:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "email": "ahmed@example.com"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "OTP resent to your email",
  "data": {
    "email": "ahmed@example.com"
  }
}
```

**Notes:**
- يمكن إعادة إرسال الرمز عدة مرات
- كل مرة يتم فيها الإرسال، يتم توليد رمز جديد

---

### 4. Login / تسجيل الدخول

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "SecurePass123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "email": "ahmed@example.com",
    "fullName": "أحمد محمد",
    "isVerified": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "error": "Email not verified. Please check your inbox for the OTP."
}
```

**Notes:**
- يجب التحقق من البريد أولاً قبل إمكانية تسجيل الدخول
- التوكن صالح لمدة 7 أيام

---

### 5. Forgot Password / نسيت كلمة المرور

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "ahmed@example.com"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "If email exists, password reset link will be sent"
}
```

**Notes:**
- الرسالة واحدة سواء وجد البريد أم لا (للأمان)
- رابط إعادة التعيين يكون صالحاً لمدة 1 ساعة فقط
- يتم إرسال بريد بـ رابط إعادة التعيين

---

### 6. Reset Password / إعادة تعيين كلمة المرور

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

**Notes:**
- التوكن يجب أن يكون من رابط إعادة التعيين
- يجب أن تطابق الكلمات المرورية الجديدة نفس المتطلبات

---

## 🔵 Google OAuth 2.0

### التكوين (Configuration)

**Hostinger Configuration (ضروري تم تكوينه):**
- Client ID: `804362761708-hah2p849et9hmh7f1c7mmsmfjpoer21s.apps.googleusercontent.com`
- Client Secret: `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`
- Authorized JavaScript Origins: `https://peopleos.online`
- Authorized redirect URIs: `https://api.peopleos.online/api/auth/google/callback`

---

### 1. Get Google Auth URL / الحصول على URL المصادقة

**Endpoint:** `GET /api/auth/google`

**Response Success (200):**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

**Frontend Implementation:**
```javascript
// اطلب URL من الباكيند
const response = await fetch('https://api.peopleos.online/api/auth/google');
const { authUrl } = await response.json();

// أعد التوجيه للمصادقة
window.location.href = authUrl;
```

---

### 2. Google OAuth Callback / معالج المرتد

**Endpoint:** `GET /api/auth/google/callback?code=...`

**Process Flow:**
1. المستخدم يوافق على المصادقة
2. جوجل يرسل authorization code إلى الـ callback
3. الباكيند يتبادل الـ code بـ tokens
4. يتم الحصول على بيانات المستخدم من جوجل
5. ✅ **AUTO-VERIFIED**: يتم وضع `is_verified = true` مباشرة في قاعدة البيانات
6. يتم إصدار JWT توكن
7. التوجيه إلى الفرونتند مع التوكن

**Response (Redirect):**
```
https://peopleos.online/auth-success?token=eyJhbGc...&userId=1
```

**Notes:**
- لا يوجد شاشة تحقق OTP لمستخدمي جوجل
- يتم تحديث `auth_provider = 'google'` تلقائياً
- إذا كان البريد موجوداً بالفعل، يتم تسجيل دخول المستخدم مباشرة

---

### 3. Verify Google ID Token (Frontend-Initiated) / التحقق من التوكن

**Endpoint:** `POST /api/auth/google/verify-token`

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "userId": 1,
    "email": "ahmed@gmail.com",
    "fullName": "Ahmed Mohamed",
    "isVerified": true,
    "authProvider": "google",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Frontend Implementation:**
```javascript
import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={async (credentialResponse) => {
    const response = await fetch(
      'https://api.peopleos.online/api/auth/google/verify-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential })
      }
    );
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('authToken', data.data.token);
      window.location.href = '/dashboard';
    }
  }}
/>
```

**Notes:**
- يتم التحقق من التوكن مع جوجل
- يمكن اختيار دومين معين (محالياً معطل)
- التحقق الفوري للبريد الإلكتروني

---

## 📋 Using JWT Tokens / استخدام التوكنات

### إرسال التوكن في الطلبات

جميع الطلبات المحمية يجب أن تتضمن التوكن في رأس `Authorization`:

```javascript
// Fetch API
fetch('https://api.peopleos.online/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Axios
axios.get('https://api.peopleos.online/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Token Payload

```json
{
  "userId": 1,
  "email": "ahmed@example.com",
  "authProvider": "local",
  "iat": 1234567890,
  "exp": 1235167890
}
```

**Notes:**
- التوكن صالح لمدة 7 أيام (يمكن تغييره في .env)
- عند انتهاء صلاحيته، يجب تسجيل الدخول مجدداً
- لا يوجد refresh token حالياً (سيتم إضافته لاحقاً)

---

## ⚠️ Error Handling / معالجة الأخطاء

### Common Error Responses

| Status | Error | الوصف |
|--------|-------|-------|
| 400 | Missing required fields | حقول مفقودة |
| 400 | Invalid email format | صيغة بريد غير صحيحة |
| 400 | Passwords do not match | الكلمات المرورية غير متطابقة |
| 400 | Password must be at least 8 characters... | كلمة مرور ضعيفة |
| 400 | Invalid or expired OTP | رمز OTP غير صحيح |
| 400 | Account already registered with different auth method | حساب موجود بطريقة تسجيل أخرى |
| 401 | Invalid email or password | بيانات تسجيل دخول خاطئة |
| 401 | No authorization token provided | لا يوجد توكن |
| 401 | Token expired | التوكن انتهت صلاحيته |
| 403 | Email not verified | البريد لم يتم التحقق منه |
| 409 | Email already registered | البريد مسجل بالفعل |

---

## 📧 Email Templates / نماذج البريد

### OTP Email
- يحتوي على رمز 6 أرقام
- صالح لمدة 10 دقائق
- تصميم احترافي ثنائي اللغة

### Password Reset Email
- رابط إعادة التعيين الآمن
- صالح لمدة 1 ساعة
- زر مباشر + رابط النسخ

### Welcome Email
- بريد ترحيب بعد التحقق
- قائمة بـ الميزات
- رابط الدخول المباشر

---

## 🔒 Security Best Practices / أفضل الممارسات الأمنية

### For Frontend Developers:

1. **Store Tokens Safely:**
   ```javascript
   // ✅ جيد - Session Storage (أفضل)
   sessionStorage.setItem('authToken', token);
   
   // ⚠️ متوسط - Local Storage
   localStorage.setItem('authToken', token);
   ```

2. **Send Secure Requests:**
   ```javascript
   // ✅ استخدم HTTPS فقط
   // ✅ أرسل التوكن في رأس Authorization
   // ❌ لا تضع التوكن في URL
   ```

3. **Handle Expiration:**
   ```javascript
   if (error.response?.status === 401) {
     localStorage.removeItem('authToken');
     window.location.href = '/login';
   }
   ```

### For Backend Security:

✅ Passwords hashed with bcrypt (10 rounds)
✅ OTP tokens unique and time-limited
✅ JWT tokens signed securely
✅ CORS restricted to peopleos.online
✅ All requests over HTTPS
✅ Rate limiting (to be implemented)
✅ Input validation on all endpoints

---

## 📝 Example Workflows

### Complete Sign-Up Flow

```
1. User fills registration form
   ↓
2. POST /api/auth/signup
   ↓
3. Backend hashes password, creates user (unverified)
   ↓
4. OTP sent to email
   ↓
5. User enters OTP
   ↓
6. POST /api/auth/verify-otp
   ↓
7. User marked as verified
   ↓
8. JWT token issued
   ↓
9. Welcome email sent
   ↓
10. User redirected to dashboard
```

### Google OAuth Flow (Simpler!)

```
1. User clicks "Sign in with Google"
   ↓
2. GET /api/auth/google → Get OAuth URL
   ↓
3. User consents in Google interface
   ↓
4. GET /api/auth/google/callback
   ↓
5. Backend creates user (ALREADY VERIFIED ✅)
   ↓
6. JWT token issued
   ↓
7. User redirected to dashboard
   ↓
(No OTP needed!)
```

---

## 🛠️ Environment Variables Required

```
# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=804362761708-...
GOOGLE_CLIENT_SECRET=GOCSPX-0d_UHz_...
GOOGLE_CALLBACK_URL=https://api.peopleos.online/api/auth/google/callback

# Email (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@peopleos-hr.com
SMTP_PASSWORD=PeopleOS.info@875875
SMTP_FROM_EMAIL=info@peopleos-hr.com
SMTP_FROM_NAME=PeopleOS

# OTP
OTP_EXPIRATION_MINUTES=10
```

---

**آخر تحديث:** July 3, 2026
**الحالة:** ✅ منتج جاهز للاستخدام
