import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import { Languages, Moon, Sun } from 'lucide-react';

// Google "G" SVG icon for the OAuth button
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.705c-.18-.54-.282-1.117-.282-1.705s.102-1.165.282-1.705V4.963H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.037l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function RegisterPage() {
  const { t, theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';

  // Registration form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP state
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // UI state
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // Handle Sign Up (local)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, confirmPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'تعذر إنشاء الحساب');
        return;
      }

      // Success -> ask for OTP
      setMsg('تم إنشاء الحساب. تم إرسال رمز التحقق إلى بريدك الإلكتروني. أدخل الرمز لتفعيل الحساب.');
      setUserId(data.data?.userId || null);
      setShowOtp(true);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP then log in
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
        return;
      }

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userEmail', data.data.email);
      localStorage.setItem('userName', data.data.fullName);
      setMsg('تم تفعيل حسابك بنجاح! جاري تحويلك...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error(err);
      setError('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled || !userId) return;
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل في إعادة الإرسال');
        return;
      }
      setMsg(data.message || 'تم إعادة إرسال رمز التحقق');
      
      setResendDisabled(true);
      setCountdown(120);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} px-4 py-12 relative overflow-hidden`}>
      <div className={`auth-card max-w-md w-full p-8 relative z-10 mx-auto ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/85 border-slate-200'} `}>
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-sky-500/12 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-indigo-500/12 blur-3xl" />
        </div>

        <div className={`mb-8 flex items-start justify-between gap-3 ${lang === 'ar' ? 'flex-row-reverse' : ''} transition-all duration-300`}>
          <div>
            <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-extrabold text-lg tracking-tight`}>People Monitor</p>
            <p className="text-slate-500 text-xs">Professional CV Platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={toggleTheme} title={t.themeToggle} aria-label="toggle theme">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="icon-button flex items-center gap-2 text-xs font-bold"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              title={t.languageToggle}
              aria-label="toggle language"
            >
              <Languages size={16} />
              <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
            </button>
          </div>
        </div>

        {!showOtp ? (
          <>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.signUpTitle || 'Create a new account'}</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.signUpSubtitle || 'Join PeopleOS and start building your verified CV'}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm text-center">{error}</div>
            )}
            {msg && (
              <div className="mb-4 p-3 bg-sky-500/20 border border-sky-500/30 rounded-2xl text-sky-200 text-sm text-center font-medium">{msg}</div>
            )}

            {/* Google OAuth Button */}
            <button
              id="btn-google-register"
              type="button"
              onClick={handleGoogleLogin}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl font-medium text-sm transition-all duration-200 mb-5 ${isDark ? 'border border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-[0_6px_16px_rgba(2,6,23,0.06)]'}`}
            >
              <GoogleIcon />
              {t.continueWithGoogle || 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-sky-500/12 blur-3xl" />
                <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-indigo-500/12 blur-3xl" />
              </div>
              <div className={`${isDark ? 'bg-white/10' : 'bg-slate-200'} flex-1 h-px`} />
              <span className="text-xs text-slate-500 font-medium">{t.or || 'OR'}</span>
              <div className={`${isDark ? 'bg-white/10' : 'bg-slate-200'} flex-1 h-px`} />
            </div>

            <form onSubmit={handleSignUp} className="space-y-5">
              <label className="block">
                <span className="text-slate-300 text-sm font-medium">{t.fullName || 'Full name'}</span>
                <input
                  id="input-signup-fullname"
                  type="text"
                  required
                  className="input-field mt-2"
                  placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Your full name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="text-slate-300 text-sm font-medium">{t.email || 'Email'} | Email</span>
                <input
                  id="input-signup-email"
                  type="email"
                  required
                  className="input-field mt-2 font-sans"
                  placeholder="example@peopleos.online"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="text-slate-300 text-sm font-medium">{t.password || 'Password'} | Password</span>
                <input
                  id="input-signup-password"
                  type="password"
                  required
                  className="input-field mt-2"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="text-slate-300 text-sm font-medium">{t.confirmPassword || 'Confirm password'}</span>
                <input
                  id="input-signup-confirm"
                  type="password"
                  required
                  className="input-field mt-2"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </label>

              <button id="btn-signup-submit" type="submit" disabled={loading} className="button-primary w-full py-3 mt-2 text-base disabled:opacity-60">
                {loading ? (t.checking || 'Checking…') : (t.register || 'Register')}
              </button>

              <div className="mt-2 text-center">
                <button onClick={() => navigate('/login')} type="button" className="text-sky-400 text-sm font-semibold hover:underline">
                  ← {t.backToLogin || 'Back to login'}
                </button>
            </div>
            </form>
          </>
        ) : (
          // OTP verification view
          <>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.verify || 'Verify'}</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.enterOtp || 'Enter the 6-digit code sent to your email'}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm text-center">{error}</div>
            )}
            {msg && (
              <div className="mb-4 p-3 bg-sky-500/20 border border-sky-500/30 rounded-2xl text-sky-200 text-sm text-center font-medium">{msg}</div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <label className="block">
                <span className="text-slate-300 text-sm font-medium">{t.otpCode || 'OTP Code'}</span>
                <input
                  id="input-otp"
                  type="text"
                  required
                  maxLength={6}
                  className="input-field mt-2 text-center text-xl font-bold tracking-[0.5em]"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                />
              </label>
              <button id="btn-verify-otp" type="submit" disabled={loading} className="button-primary w-full py-3 text-base disabled:opacity-60">
                {loading ? (t.verifying || 'Verifying…') : (t.verify || 'Verify')}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button 
                onClick={handleResendOtp} 
                disabled={resendDisabled || loading} 
                className="text-indigo-500 text-sm font-semibold hover:underline disabled:opacity-50"
              >
                {resendDisabled ? `إعادة الإرسال بعد ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : 'إعادة إرسال رمز التحقق'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button onClick={() => setShowOtp(false)} className="text-sky-400 text-sm font-semibold hover:underline">
                ← {t.backToLogin || 'Back to login'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
