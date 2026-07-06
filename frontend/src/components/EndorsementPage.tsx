import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import { Languages, Moon, Sun } from 'lucide-react';

export default function EndorsementPage() {
  const { token } = useParams<{ token: string }>();
  const { lang, setLang, theme, toggleTheme } = useUi();
  const isDark = theme === 'dark';

  const t = useMemo(() => {
    if (lang === 'ar') {
      return {
        badge: 'بوابة التوصية الموثوقة',
        title: 'نموذج التوصية المهنية المعتمد',
        invited: (full: string, company: string) => (
          <>
            تمت دعوتك بواسطة <strong>{full}</strong> لتقديم شهادة توصية مهنية عن عمله في <strong>{company}</strong>.
          </>
        ),
        name: 'الاسم الكامل للموصي',
        titleRole: 'المسمى الوظيفي والجهة',
        email: 'البريد الإلكتروني المهني',
        body: 'نص التوصية المهنية',
        signature: 'التوقيع الإلكتروني (اكتب اسمك الثلاثي)',
        namePh: 'مثال: د. أحمد علي',
        titlePh: 'مثال: رئيس قسم التقنية في الشركة',
        emailPh: 'name@company.com',
        bodyPh: 'اكتب شهادتك المهنية الصادقة هنا...',
        sigPh: 'مثال: أحمد محمد علي',
        send: 'إرسال التوصية المعتمدة',
        loading: 'جاري تحميل صفحة الاعتماد...',
        sending: 'جاري إرسال التوصية...',
        success: 'تم إرسال التوصية المعتمدة بنجاح! شكراً لمساهمتك.',
        genericErr: 'خطأ أثناء إرسال التوصية',
        netErr: 'خطأ في الاتصال بالخادم',
        badToken: 'طلب التوصية غير صالح أو انتهت صلاحيته.',
        requiredTriple: 'الرجاء كتابة توقيعك كاسم ثلاثي على الأقل',
      } as const;
    }
    return {
      badge: 'Verified Endorsement Portal',
      title: 'Verified Professional Recommendation Form',
      invited: (full: string, company: string) => (
        <>
          You were invited by <strong>{full}</strong> to provide a professional recommendation for their work at <strong>{company}</strong>.
        </>
      ),
      name: 'Recommender Full Name',
      titleRole: 'Job Title & Organization',
      email: 'Work Email',
      body: 'Recommendation Text',
      signature: 'Electronic signature (type your triple full name)',
      namePh: 'e.g., Dr. John Smith',
      titlePh: 'e.g., Head of Engineering at Company',
      emailPh: 'name@company.com',
      bodyPh: 'Write your honest professional endorsement here…',
      sigPh: 'e.g., John Michael Smith',
      send: 'Submit Verified Recommendation',
      loading: 'Loading endorsement page…',
      sending: 'Submitting recommendation…',
      success: 'Your verified recommendation was submitted successfully. Thank you!',
      genericErr: 'Failed to submit the recommendation',
      netErr: 'Server connection error',
      badToken: 'Invalid or expired endorsement link.',
      requiredTriple: 'Please type your signature as at least three words',
    } as const;
  }, [lang]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [endorserName, setEndorserName] = useState('');
  const [endorserEmail, setEndorserEmail] = useState('');
  const [endorserTitleRole, setEndorserTitleRole] = useState('');
  const [endorsementBodyText, setEndorsementBodyText] = useState('');
  const [signatureVectorStream, setSignatureVectorStream] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/endorsements/${token}`);
        const payload = await response.json();
        
        if (response.ok && payload.success) {
          setData(payload.data);
          setEndorserName(payload.data.endorser_name || '');
          setEndorserEmail(payload.data.endorser_email || '');
          setEndorserTitleRole(payload.data.endorser_title_role || '');
          setEndorsementBodyText(payload.data.endorsement_body_text || '');
        } else {
          setError(payload.error || t.badToken);
        }
      } catch (err) {
        console.error(err);
        setError(t.netErr);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchRequest();
  }, [token, t.badToken, t.netErr]);

  const isTripleName = (s: string) => s.trim().split(/\s+/).filter(Boolean).length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTripleName(signatureVectorStream)) {
      setStatus(t.requiredTriple);
      return;
    }

    setStatus(t.sending);

    try {
      const response = await fetch(`/api/endorsements/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endorserName,
          endorserEmail,
          endorserTitleRole,
          endorsementBodyText,
          signatureVectorStream: signatureVectorStream.trim(),
        }),
      });

      const payload = await response.json();
      if (response.ok && payload.success) {
        setStatus(t.success);
      } else {
        setStatus(payload.error || t.genericErr);
      }
    } catch (err) {
      console.error(err);
      setStatus(t.netErr);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl animate-pulse">{t.loading}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl font-extrabold text-red-500 mb-4">{lang === 'ar' ? 'خطأ' : 'Error'}</h1>
        <p className="text-xl">{error || (lang === 'ar' ? 'الرابط غير صالح' : 'Invalid link')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 md:px-12 lg:px-24 font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl glass-card p-8 rounded-3xl">
        <div className="relative mb-8">
          {/* Toggles on the top-right of the form card */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-button"
              title={lang === 'ar' ? 'المظهر' : 'Theme'}
              aria-label="toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="icon-button"
              title={lang === 'ar' ? 'اللغة' : 'Language'}
              aria-label="toggle language"
            >
              <Languages size={16} />
              <span className="sr-only">toggle language</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-xs uppercase tracking-widest font-bold bg-white/10 px-4 py-1.5 rounded-full">
              {t.badge}
            </span>
            <h1 className="text-3xl font-extrabold mt-4">{t.title}</h1>
            <p className="mt-2 text-sm">
              {t.invited(data.requestor_full_name, data.requestor_company_name)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold">{t.name}</span>
            <input
              type="text"
              required
              className="input-field mt-2"
              value={endorserName}
              onChange={(e) => setEndorserName(e.target.value)}
              placeholder={t.namePh}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">{t.titleRole}</span>
            <input
              type="text"
              required
              className="input-field mt-2"
              value={endorserTitleRole}
              onChange={(e) => setEndorserTitleRole(e.target.value)}
              placeholder={t.titlePh}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">{t.email}</span>
            <input
              type="email"
              required
              className="input-field mt-2 font-sans"
              value={endorserEmail}
              onChange={(e) => setEndorserEmail(e.target.value)}
              placeholder={t.emailPh}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">{t.body}</span>
            <textarea
              required
              rows={6}
              className="textarea-field mt-2"
              value={endorsementBodyText}
              onChange={(e) => setEndorsementBodyText(e.target.value)}
              placeholder={t.bodyPh}
            />
          </label>

          <div className="block">
            <span className="text-sm font-semibold">{t.signature}</span>
            <input
              type="text"
              required
              className="input-field mt-2 text-center"
              value={signatureVectorStream}
              onChange={(e) => setSignatureVectorStream(e.target.value)}
              placeholder={t.sigPh}
            />
            <p className="text-xs opacity-70 mt-2">{lang === 'ar' ? 'نقبل الاسم الثلاثي أو الرباعي. سيتم حفظ النص كما هو كتوقيع.' : 'Triple or quadruple full name is accepted. We will store the text as your signature.'}</p>
          </div>

          <button type="submit" className="button-primary w-full py-3 mt-4 text-base font-bold">
            {t.send}
          </button>
        </form>

        {status && (
          <div className="mt-6 p-4 glass-inner-card rounded-2xl text-center text-sm">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
