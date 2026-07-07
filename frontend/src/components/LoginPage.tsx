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

export default function LoginPage() {
  const { t, theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const safeParse = async (res: Response) => {
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    try {
      if (ct.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return JSON.parse(text);
      }
    } catch {}
    return { success: false, error: text || 'Server error' } as any;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await safeParse(res);

      if (!res.ok) {
        if (res.status === 403) {
          const resendRes = await fetch('/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const resendData = await safeParse(resendRes);
          if (resendRes.ok) {
            setMsg('تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى إدخال الرمز لتفعيل الحساب.');
            if ((data as any).data?.userId) {
              setUserId((data as any).data.userId);
            } else {
              setError('الحساب غير مفعل. يرجى التسجيل مجدداً أو مراجعة بريدك الإلكتروني.');
              setLoading(false);
              return;
            }
            setShowOtp(true);
          } else {
            setError((resendData as any).error || 'خطأ في إرسال رمز التحقق');
          }
        } else {
          setError((data as any).error || 'البريد أو كلمة المرور غير صحيحة');
        }
        setLoading(false);
        return;
      }

      localStorage.setItem('token', (data as any).data.token);
      localStorage.setItem('userEmail', (data as any).data.email);
      localStorage.setItem('userName', (data as any).data.fullName);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

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
      const data = await safeParse(res);

      if (!res.ok) {
        setError((data as any).error || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', (data as any).data.token);
      localStorage.setItem('userEmail', (data as any).data.email);
      localStorage.setItem('userName', (data as any).data.fullName);
      setMsg('تم تفعيل حسابك بنجاح! جاري تحويلك...');
      setTimeout(() => navigate('/dashboard'), 1200);
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
        body: JSON.stringify({ userId }) // Or email if userId isn't always available, but backend needs userId or email depending on implementation. Wait, the endpoint uses userId or user object? Wait, in RegisterPage we send userId. But here we have userId in state.
      });
      const data = await safeParse(res);
      if (!res.ok) {
        setError((data as any).error || 'فشل في إعادة الإرسال');
        return;
      }
      setMsg((data as any).message || 'تم إعادة إرسال رمز التحقق');
      
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await safeParse(res);

      if (!res.ok) {
        setError((data as any).error || 'فشل إرسال رابط إعادة تعيين كلمة المرور');
      } else {
        setMsg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
      }
    } catch (err) {
      console.error(err);
      setError('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth initiation endpoint
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
            <button
              className="icon-button"
              onClick={toggleTheme}
              title={t.themeToggle}
              aria-label="toggle theme"
            >
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

        {!showForgot ? (
          <>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.login || 'Login'}</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>People Monitor — ATS CV Platform</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {msg && (
              <div className="mb-4 p-3 bg-sky-500/20 border border-sky-500/30 rounded-2xl text-sky-200 text-sm text-center font-medium">
                {msg}
              </div>
            )}

            {!showOtp ? (
              <>
                {/* Google OAuth Button */}
                <button
                  id="btn-google-login"
                  type="button"
                  onClick={handleGoogleLogin}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl font-medium text-sm transition-all duration-200 mb-5 ${isDark ? 'border border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-[0_6px_16px_rgba(2,6,23,0.06)]'}` }
                >
                  <GoogleIcon />
                  {t.continueWithGoogle || 'Continue with Google'}
                </button>

                <div className="flex items-center gap-3 mb-5">
              {/* Decorative glassy overlays */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-sky-500/12 blur-3xl" />
                <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-indigo-500/12 blur-3xl" />
              </div>
                  <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                  <span className="text-xs text-slate-500 font-medium">{t.or || 'OR'}</span>
                  <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <label className="block">
                    <span className="text-slate-300 text-sm font-medium">{t.email || 'Email'} | Email</span>
                    <input
                      id="input-login-email"
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
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300 text-sm font-medium">{t.password || 'Password'} | Password</span>
                      <button
                        type="button"
                        onClick={() => { setShowForgot(true); setError(''); setMsg(''); }}
                        className="text-xs text-sky-400 hover:underline"
                      >
                        {t.forgotPassword || 'Forgot password?'}
                      </button>
                    </div>
                    <input
                      id="input-login-password"
                      type="password"
                      required
                      className="input-field"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </label>

                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={loading}
                    className="button-primary w-full py-3 mt-4 text-base disabled:opacity-60"
                  >
                    {loading ? (t.checking || 'Checking…') : `${t.login || 'Login'} | Login`}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <p className="text-sm text-slate-300 text-center">{t.enterOtp || 'Enter the 6-digit code sent to your email'}</p>
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

                <button
                  id="btn-verify-otp"
                  type="submit"
                  disabled={loading}
                  className="button-primary w-full py-3 mt-4 text-base disabled:opacity-60"
                >
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
            )}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-slate-400">
                {t.noAccountYet || "Don't have an account?"}{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-sky-400 font-semibold hover:underline"
                >
                  {t.register || 'Register'}
                </button>
              </p>
            </div>
          </>
        ) : (
          /* Forgot Password View */
          <>
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.forgotPassword || 'Forgot Password'}</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.forgotPasswordDesc || 'Enter your email to receive a password reset link'}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {msg && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-200 text-sm text-center font-medium">
                {msg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <label className="block">
                <span className="text-slate-300 text-sm font-medium">{t.email || 'Email'} | Email</span>

                <input
                  id="input-forgot-email"
                  type="email"
                  required
                  className="input-field mt-2 font-sans"
                  placeholder="example@peopleos.online"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={loading}
                />
              </label>

              <button
                id="btn-forgot-submit"
                type="submit"
                disabled={loading}
                className="button-primary w-full py-3 text-base disabled:opacity-60"
              >
                {loading ? (t.sending || 'Sending…') : (t.sendResetLink || 'Send reset link')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setShowForgot(false); setError(''); setMsg(''); }}
                className="text-sky-400 text-sm font-semibold hover:underline"
              >
                ← {t.backToLogin || 'Back to login'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
