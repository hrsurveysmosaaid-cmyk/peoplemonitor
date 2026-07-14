import { useUi } from '../ui/UiContext';
import { useNavigate } from 'react-router-dom';
import { Languages, Moon, Sun, ArrowLeft, ArrowRight, ShieldCheck, FileText, UserCheck, HelpCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} px-4 py-12 relative overflow-hidden`}>
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-sky-500/12 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-indigo-500/12 blur-3xl" />
      </div>

      <div className={`auth-card max-w-4xl w-full p-8 relative z-10 mx-auto ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/85 border-slate-200'} `}>
        <div className={`mb-8 flex items-start justify-between gap-3 ${isAr ? 'flex-row-reverse' : ''} transition-all duration-300`}>
          <div>
            <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-extrabold text-lg tracking-tight`}>People Monitor</p>
            <p className="text-slate-500 text-xs">Professional CV Platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={toggleTheme} title={isAr ? "تبديل المظهر" : "Toggle Theme"} aria-label="toggle theme">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="icon-button flex items-center gap-2 text-xs font-bold"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              title={isAr ? "Toggle Language" : "تبديل اللغة"}
              aria-label="toggle language"
            >
              <Languages size={16} />
              <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-semibold hover:underline mb-8 text-sky-400 ${isAr ? 'flex-row-reverse' : ''}`}
        >
          {isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          <span>{isAr ? 'العودة للخلف' : 'Go Back'}</span>
        </button>

        <div className={`space-y-8 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
          <div>
            <h1 className={`text-3xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'سياسة الخصوصية واتفاقية الاستخدام الشاملة' : 'Comprehensive Privacy Policy & Terms of Use'}
            </h1>
            <p className="text-slate-400 text-xs">
              {isAr ? 'آخر تحديث: 14 يوليو 2026' : 'Last Updated: July 14, 2026'}
            </p>
          </div>

          <hr className={isDark ? 'border-white/10' : 'border-slate-200'} />

          {/* Section 1: Introduction */}
          <section className="space-y-4">
            <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
              <ShieldCheck className="text-sky-500" size={24} />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'تمهيد ومقدمة' : 'Introduction & Overview'}
              </h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isAr 
                ? 'أهلاً بك في منصة People Monitor التابعة لـ PeopleOS. تلتزم المنصة بتوفير مساحة آمنة واحترافية لمساعدتك في إنشاء وبناء سيرتك الذاتية ومحفظتك المهنية المعتمدة. توضح هذه الاتفاقية حقوقك والتزاماتك وشروط حماية بياناتك الشخصية.' 
                : 'Welcome to People Monitor by PeopleOS. We are committed to providing a secure and professional environment to help you build your verified CV and digital portfolio. This agreement details your rights, duties, and data protection policies.'}
            </p>
          </section>

          {/* Section 2: Terms of Use */}
          <section className="space-y-4">
            <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
              <FileText className="text-sky-500" size={24} />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? '1. شروط واتفاقية الاستخدام' : '1. Terms & Conditions of Use'}
              </h2>
            </div>
            <div className="space-y-3 pl-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {isAr ? 'أ. أهلية الاستخدام والحسابات' : 'A. Account Eligibility & Responsibilities'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isAr
                  ? 'عند إنشاء حساب، يجب أن تكون المعلومات المقدمة دقيقة، كاملة، ومحدثة في جميع الأوقات. المعلومات غير الدقيقة أو المضللة قد تؤدي إلى تعليق حسابك.'
                  : 'When creating an account, all information supplied must be accurate, complete, and up-to-date. Inaccurate or misleading data may result in account suspension.'}
              </p>
              
              <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {isAr ? 'ب. الاستخدام المقبول والمحتوى المحظور' : 'B. Acceptable Use & Prohibited Activities'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isAr
                  ? 'يُحظر تماماً استخدام المنصة لأي غرض غير قانوني، أو لنشر محتوى ينتهك حقوق الملكية الفكرية للآخرين، أو محتوى يحض على الكراهية، أو محتوى احتيالي.'
                  : 'You may not use the platform for any illegal purpose, or to upload copyrighted material without authorization, promote hate speech, or spread fraudulent claims.'}
              </p>

              <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {isAr ? 'ج. أمن وسلامة الحساب' : 'C. Password and Security'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isAr
                  ? 'أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك وعن جميع الأنشطة التي تحدث تحت حسابك. يجب إخطارنا فوراً بأي خرق أمني أو استخدام غير مصرح به.'
                  : 'You are responsible for safeguarding your password and for all activities that occur under your account. Notify us immediately of any security breach or unauthorized use.'}
              </p>
            </div>
          </section>

          {/* Section 3: Privacy Policy */}
          <section className="space-y-4">
            <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
              <UserCheck className="text-sky-500" size={24} />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? '2. سياسة خصوصية البيانات الشخصية' : '2. Privacy & Data Policy'}
              </h2>
            </div>
            <div className="space-y-3 pl-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {isAr ? 'أ. ما هي البيانات التي نجمعها؟' : 'A. Information We Collect'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isAr
                  ? 'نقوم بجمع البيانات الشخصية والمهنية التي تزودنا بها طواعية مثل: الاسم الكامل، المسمى الوظيفي، تفاصيل الاتصال (البريد الإلكتروني ورقم الهاتف)، والخبرات المهنية، والتعليم، والمهارات.'
                  : 'We collect personal and professional data that you voluntarily provide to us, including: Full Name, Job Title, contact details (email and phone), work history, education history, and skills.'}
              </p>

              <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {isAr ? 'ب. كيف نستخدم بياناتك الشخصية؟' : 'B. How We Use Your Data'}
              </h3>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-2">
                <li>{isAr ? 'لإنشاء وإدارة حسابك، وتوليد ملف السيرة الذاتية بصيغة PDF.' : 'To create and manage your account and to export your ATS-friendly PDF CV.'}</li>
                <li>{isAr ? 'لعرض ونشر محفظتك الرقمية كصفحة عامة بناءً على رغبتك واختيارك الفردي للنشر.' : 'To host and display your digital portfolio page publicly based on your manual publication settings.'}</li>
                <li>{isAr ? 'لتحسين خدمات المنصة وتطويرها بشكل مستمر.' : 'To monitor, maintain, and improve our services.'}</li>
              </ul>

              <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {isAr ? 'ج. مشاركة البيانات والجهات الخارجية' : 'C. Data Sharing & Third-Party Disclosure'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isAr
                  ? 'لا نقوم ببيع أو تأجير بياناتك للغير. نقوم فقط بمشاركتها مع موفري الخدمات المعتمدين لتشغيل السيرفرات أو لخدمات مصادقة الدخول (مثل Google OAuth).'
                  : 'We do not sell or lease your personal data. We only share it with vetted service providers to run our backend servers and for user authentication integrations (like Google OAuth).'}
              </p>

              <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {isAr ? 'د. حق الحذف وتعديل البيانات' : 'D. Data Portability and Erasure (Right to be Forgotten)'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isAr
                  ? 'يمكنك تعديل بياناتك أو سحب النشر العام لملفك الشخصي في أي وقت من لوحة التحكم. كما يمكنك التواصل معنا لطلب حذف حسابك وبياناتك بالكامل من خوادمنا بشكل نهائي.'
                  : 'You can modify your data or unpublish your profile at any time directly through the dashboard. You can also contact us to request the permanent deletion of your account and all associated data.'}
              </p>
            </div>
          </section>

          {/* Section 4: Contact & Help */}
          <section className="space-y-4">
            <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
              <HelpCircle className="text-sky-500" size={24} />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? '3. التواصل والاستفسار' : '3. Contact Us'}
              </h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isAr 
                ? 'إذا كان لديك أي استفسار بخصوص هذه الاتفاقية أو ترغب في تقديم طلب يخص بياناتك الشخصية، يرجى التواصل معنا عبر البريد الإلكتروني المخصص للدعم الفني:' 
                : 'If you have any questions about this agreement or wish to request data actions, please contact our support team at:'}
            </p>
            <p className="text-sky-400 text-base font-bold">
              support@peopleos.online
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
