# Architectural Documentation - التوثيق المعماري

## نظرة عامة على العمارة

هذا المشروع يتبع نموذج معمارية **Layered Architecture** مع فصل واضح للمسؤوليات (Separation of Concerns).

## مستويات التطبيق

```
┌─────────────────────────────────────────┐
│       Frontend (https://peopleos.online)│
└────────────────┬──────────────────────┘
                 │
          (CORS Restricted)
                 │
┌─────────────────┴──────────────────────┐
│   API Layer (Routes & Controllers)     │ ← Handles requests
├────────────────────────────────────────┤
│    Business Logic Layer                │ ← Process data
├────────────────────────────────────────┤
│    Data Access Layer (Models)          │ ← Database queries
├────────────────────────────────────────┤
│    Config & Utils                      │ ← Configurations
└────────────────────────────────────────┘
          │
        (MySQL)
          │
     Database Server
```

## مبادئ التصميم المطبقة

### 1. Separation of Concerns (فصل المسؤوليات)
كل ملف نموذج منفصل يتعامل مع جدول واحد فقط:
- `GlobalUsers.js` → جدول `global_users`
- `CorePortfolios.js` → جدول `core_portfolios`
- `PortfolioExperienceBlocks.js` → جدول `portfolio_experience_blocks`
- `MicroSuccessStories.js` → جدول `micro_success_stories`
- `ExternalLiveEndorsements.js` → جدول `external_live_endorsements`

### 2. Single Responsibility Principle (SRP)
كل ملف له مسؤولية واحدة واضحة:
- `server.js` → إعداد وتشغيل السيرفر
- `config/database.js` → إدارة الاتصال بقاعدة البيانات
- `config/cors.js` → إعدادات CORS والأمان
- `models/*.js` → عمليات قاعدة البيانات

### 3. DRY (Don't Repeat Yourself)
- وظائف مشتركة في `utils/helpers.js`
- إعادة استخدام وسيط CORS في كل الطلبات
- استخدام connection pool بدلاً من اتصالات منفصلة

### 4. Database Abstraction
- طبقة وسيطة بين السيرفر وقاعدة البيانات
- عمليات معدة مسبقاً لمنع SQL Injection
- إدارة مركزية للاتصالات

## تدفق الطلب (Request Flow)

```
Incoming Request
      │
      ↓
┌─────────────────────────────────┐
│  CORS Middleware                │
│  → Validate origin              │
│  → Set security headers         │
└────────────────┬────────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Route Handler      │
        │ → Validate input   │
        └────────┬───────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Controller/Logic   │
        │ → Process request  │
        └────────┬───────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Model Query        │
        │ → Database call    │
        └────────┬───────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Database           │
        │ → Execute query    │
        └────────┬───────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Return Result      │
        │ → Send response    │
        └────────────────────┘
```

## أمان الاتصال بقاعدة البيانات

### Connection Pool
```javascript
// كل طلب يحصل على اتصال من مجموعة مجهزة مسبقاً
const connection = await getConnection();
const results = await connection.execute(query, values);
connection.release();  // إعادة الاتصال للمجموعة
```

### Prepared Statements
```javascript
// ✅ آمن - منع SQL Injection
const query = 'SELECT * FROM users WHERE email = ?';
const results = await executeQuery(query, [email]);

// ❌ غير آمن - لا تستخدمه!
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

## سياسة CORS الصارمة

### المسموح به فقط:
```javascript
CORS_ORIGIN = 'https://peopleos.online'
```

### ما يتم حظره:
- ✗ `http://peopleos.online` (غير HTTPS)
- ✗ `http://localhost:3000` (جهاز محلي)
- ✗ `https://attacker.com` (مصدر آخر)
- ✗ بدون رأس Origin

### رؤوس الأمان المضافة:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## معايير الخطأ

### Response Success (النجاح):
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Response Error (الخطأ):
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## العمليات الحرجة

### إنشاء محفظة جديدة:
1. التحقق من المستخدم موجود
2. إنشاء slug فريد
3. حفظ البيانات (كـ JSON)
4. إرجاع معرّف المحفظة

### إضافة موافقة خارجية:
1. التحقق من المحفظة والخبرة موجودة
2. توليد توكن فريد
3. حفظ بيانات الموافقة
4. إرسال بريد تحقق (للمستقبل)
5. إرجاع الرابط للموافقة

### حذف كتلة خبرة:
1. التحقق من الصلاحيات
2. حذف جميع القصص المرتبطة (cascade)
3. حذف جميع الموافقات المرتبطة (cascade)
4. حذف الكتلة نفسها

## مقاييس الأداء

### Indexes المستخدمة:
```sql
-- سريع للبحث عن المستخدم
INDEX idx_email ON global_users(email)

-- سريع للبحث عن محفظة المستخدم
INDEX idx_user_id ON core_portfolios(user_id)

-- سريع للحصول على محفظة من الرابط
INDEX idx_unique_slug ON core_portfolios(unique_slug_string)
```

### Connection Pooling:
- الحد الأقصى للاتصالات: 10
- منع الاختناقات
- إعادة استخدام الاتصالات

## المراقبة والتسجيل

### السجلات المُطبعة:
```
✅ Success operations
❌ Error operations
📨 Incoming requests
🔌 Database operations
🔒 Security events
```

## الخطوات المستقبلية

1. **OAuth Integration** - دعم Google Sign-In
2. **Email Service** - إرسال رسائل التحقق
3. **File Upload** - رفع الأصول والمرفقات
4. **Caching** - Redis للبيانات المتكررة
5. **Analytics** - تتبع الإحصائيات
6. **Payment Gateway** - دعم الدفع
7. **Mobile API** - نسخة خفيفة للمحمول

---

**المزيد من التفاصيل متوفر في ملفات المشروع**
