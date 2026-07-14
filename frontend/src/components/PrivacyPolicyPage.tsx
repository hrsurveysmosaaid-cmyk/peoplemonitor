import { useUi } from '../ui/UiContext';
import { useNavigate } from 'react-router-dom';
import { Languages, Moon, Sun, ArrowLeft, ArrowRight } from 'lucide-react';

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

      <div className={`auth-card max-w-3xl w-full p-8 relative z-10 mx-auto ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/85 border-slate-200'} `}>
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
              {isAr ? 'سياسة الخصوصية وشروط الاستخدام' : 'Privacy Policy & Terms of Use'}
            </h1>
            <p className="text-slate-400 text-xs">
              {isAr ? 'آخر تحديث: 14 يوليو 2026' : 'Last Updated: July 14, 2026'}
            </p>
          </div>

          <hr className={isDark ? 'border-white/10' : 'border-slate-200'} />

          {/* Terms Section */}
          <section className="space-y-4">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? '1. شروط الاستخدام' : '1. Terms of Use'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isAr 
                ? 'باستخدامك لمنصة People Monitor، فإنك توافق على الالتزام بشروط الاستخدام الحالية. هذه المنصة مخصصة لإنشاء وإدارة السير الذاتية المهنية والمحافظ الرقمية.' 
                : 'By using the People Monitor platform, you agree to comply with these terms of use. This platform is dedicated to creating and managing professional CVs and digital portfolios.'}
            </p>
            <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 pl-4">
              <li>{isAr ? 'يجب تقديم معلومات دقيقة وصحيحة في سيرتك الذاتية.' : 'You must provide accurate and correct information in your CV.'}</li>
              <li>{isAr ? 'يُحظر استخدام المنصة لنشر محتوى غير قانوني أو مضلل.' : 'It is prohibited to use the platform to publish illegal or misleading content.'}</li>
              <li>{isAr ? 'أنت مسؤول بشكل كامل عن حماية بيانات حسابك وكلمة المرور الخاصة بك.' : 'You are fully responsible for protecting your account credentials and password.'}</li>
            </ul>
          </section>

          {/* Privacy Section */}
          <section className="space-y-4">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? '2. سياسة الخصوصية' : '2. Privacy Policy'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isAr 
                ? 'نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. يوضح هذا القسم كيفية جمعنا واستخدامنا لبياناتك عند استخدام المنصة.' 
                : 'We respect your privacy and are committed to protecting your personal data. This section explains how we collect and use your data when you use the platform.'}
            </p>
            <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 pl-4">
              <li>
                <strong>{isAr ? 'البيانات التي نجمعها:' : 'Data We Collect:'}</strong>{' '}
                {isAr ? 'الاسم، البريد الإلكتروني، معلومات الاتصال، والخبرات المهنية التي تقوم بإدخالها.' : 'Name, email address, contact details, and the professional experience you input.'}
              </li>
              <li>
                <strong>{isAr ? 'كيفية استخدام البيانات:' : 'How We Use Data:'}</strong>{' '}
                {isAr ? 'لتقديم وتخصيص خدمات المنصة وتوليد السيرة الذاتية وعرضها للشركات أو مشاركتها.' : 'To provide and customize platform services, generate the CV, and display or share it.'}
              </li>
              <li>
                <strong>{isAr ? 'حماية البيانات:' : 'Data Protection:'}</strong>{' '}
                {isAr ? 'نستخدم معايير أمان عالية مشفرة لحماية بياناتك من الوصول غير المصرح به.' : 'We use high encrypted security standards to protect your data from unauthorized access.'}
              </li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="space-y-4">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? '3. التواصل معنا' : '3. Contact Us'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isAr 
                ? 'إذا كانت لديك أي استفسارات أو أسئلة حول سياسة الخصوصية أو شروط الاستخدام، يمكنك التواصل معنا عبر البريد الإلكتروني: support@peopleos.online' 
                : 'If you have any inquiries or questions about our privacy policy or terms of use, you can contact us at support@peopleos.online'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
