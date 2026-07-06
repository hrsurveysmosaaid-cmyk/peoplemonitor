# Backend Setup Guide - دليل إعداد الواجهة الخلفية

## المتطلبات الأساسية

### البرامج المطلوبة:
- **Node.js**: الإصدار 16.0.0 أو أحدث
- **MySQL**: الإصدار 5.7 أو أحدث
- **npm**: الإصدار 8.0.0 أو أحدث

## خطوات الإعداد

### 1. تثبيت قاعدة البيانات MySQL

#### على Windows:
```bash
# استخدم مثبت MySQL من: https://dev.mysql.com/downloads/mysql/

# أو استخدم Chocolatey:
choco install mysql --version=8.0.33
```

#### على macOS:
```bash
# استخدم Homebrew:
brew install mysql
brew services start mysql
```

#### على Linux:
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
```

### 2. إنشاء قاعدة البيانات

```sql
CREATE DATABASE peopleos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'peopleos_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON peopleos_db.* TO 'peopleos_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. تثبيت المشروع

```bash
# انتقل إلى مجلد المشروع
cd "ATS CV Builder"

# ثبت المكتبات
npm install
```

### 4. تكوين متغيرات البيئة

```bash
# انسخ ملف البيئة
cp .env .env.local

# عدّل .env.local بيانات قاعدتك:
```

**محتوى الملف .env.local:**
```
# قاعدة البيانات
DB_HOST=localhost
DB_PORT=3306
DB_USER=peopleos_user
DB_PASSWORD=strong_password_here
DB_NAME=peopleos_db

# الخادم
SERVER_PORT=5000
SERVER_HOST=127.0.0.1
NODE_ENV=development

# CORS
CORS_ORIGIN=https://peopleos.online
ALLOW_CREDENTIALS=true

# الأمان (حالياً غير مستخدمة)
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here
```

### 5. اختبار الاتصال

```bash
# شغّل الخادم
npm run dev

# في نافذة طرفية أخرى، اختبر الصحة:
curl http://127.0.0.1:5000/api/health
```

## ملف المشروع - البنية الهندسية

```
backend/
│
├── config/                    # تكوينات المشروع
│   ├── database.js           # إعدادات اتصال MySQL
│   └── cors.js               # إعدادات CORS الصارمة
│
├── models/                   # نماذج قاعدة البيانات
│   ├── GlobalUsers.js
│   ├── CorePortfolios.js
│   ├── PortfolioExperienceBlocks.js
│   ├── MicroSuccessStories.js
│   └── ExternalLiveEndorsements.js
│
├── controllers/              # منطق التحكم (جاهزة للتطوير)
├── routes/                   # مسارات API
│   └── index.js
│
├── middleware/               # طبقات الوسيط
│   ├── authentication.js
│   └── errorHandler.js
│
├── utils/                    # دوال مساعدة مشتركة
│   └── helpers.js
│
└── server.js                # الملف الرئيسي للخادم
```

## أوامر التطوير

```bash
# تشغيل الخادم (مع إعادة تحميل تلقائية)
npm run dev

# تشغيل الخادم (بدون إعادة تحميل)
npm start

# فحص الأخطاء (linting)
npm run lint

# اختبارات (يتم التخطيط لها)
npm test
```

## ميزات الأمان المطبّقة

### 1. حماية CORS
- ✅ يسمح فقط بالطلبات من `https://peopleos.online`
- ✅ يحظر جميع الطلبات من مصادر غير مصرح بها
- ✅ يسمح بإرسال بيانات المصادقة

### 2. أمان قاعدة البيانات
- ✅ استخدام Prepared Statements (منع SQL Injection)
- ✅ تجميع الاتصالات (Connection Pooling)
- ✅ حماية كلمات المرور بالتشفير
- ✅ حذف تلقائي متسلسل للبيانات الفرعية

### 3. أمان الخادم
- ✅ يعمل على واجهة Loopback فقط (127.0.0.1)
- ✅ رؤوس أمان صارمة
- ✅ جاهز لـ HTTPS/TLS
- ✅ جاهز لـ JWT Authorization

## الجداول الرئيسية

### global_users
يخزن بيانات المستخدمين والمصادقة
- دعم المصادقة المحلية و Google
- التحقق بواسطة OTP
- تجزئة آمنة للكلمات المرورية

### core_portfolios
بيانات المحفظة الأساسية
- عنوان فريد (Slug) لكل محفظة
- تخزين JSON للمرونة
- التحكم في الحالة (منشورة/مسودة)

### portfolio_experience_blocks
الخبرات والإنجازات
- أنواع متعددة: عمل، تعليم، مشاريع، جوائز، تطوع
- تتبع النطاق الزمني
- ارتباط المؤسسات والأدوار

### micro_success_stories
قصص النجاح والإنجازات الفردية
- مرتبطة بكتل الخبرة
- دعم النصوص الغنية (Rich Text)
- قابلة للموافقة عليها (Endorsable)

### external_live_endorsements
الموافقات من جهات خارجية
- توكنات مصادقة فريدة
- توقيعات رقمية
- ربط محفظة وكتلة خبرة
- جاهزة للتحقق

## استكشاف الأخطاء

### الخادم لا يبدأ
```bash
# تحقق من أن المنفذ 5000 مجاني
netstat -ano | findstr :5000

# أو استخدم منفذ مختلف في .env
SERVER_PORT=5001
```

### لا تتصل بقاعدة البيانات
```bash
# تحقق من بيانات إعادة الاتصال في .env
# اختبر الاتصال باستخدام MySQL Workbench أو:
mysql -h localhost -u peopleos_user -p
```

### مشاكل CORS
- تأكد من أن `CORS_ORIGIN` في .env صحيح
- تحقق من رؤوس الطلب في متصفحك
- تأكد من أن الطلب من https://peopleos.online

## الخطوات التالية

1. تطوير روتات API كاملة
2. إضافة المصادقة JWT
3. تطبيق التحقق من الصحة (Validation)
4. إضافة اختبارات وحدة (Unit Tests)
5. وضع نظام إدارة الأخطاء
6. توثيق API كاملة

---

**ملاحظة**: هذا هو إعداد التطوير. للإنتاج، استخدم عمليات أكثر أماناً مثل:
- متغيرات البيئة من نظام التشغيل
- شهادات SSL/TLS
- جدران حماية ومفاتيح API
- قاعدة بيانات منفصلة وآمنة
