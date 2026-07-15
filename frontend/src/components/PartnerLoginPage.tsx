import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import {
  Building2, Moon, Sun, Languages, Mail, Lock,
  ArrowRight, AlertCircle, Sparkles, Shield
} from 'lucide-react';

export default function PartnerLoginPage() {
  const { theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
        return;
      }
      localStorage.setItem('partnerToken', data.data.token);
      localStorage.setItem('partnerName', data.data.name);
      navigate('/partner/dashboard');
    } catch {
      setError(isAr ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-500 overflow-hidden relative ${isDark ? 'bg-[#060818] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full blur-[110px] opacity-30 ${isDark ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
        <div className={`absolute -bottom-40 -left-24 w-[400px] h-[400px] rounded-full blur-[100px] opacity-25 ${isDark ? 'bg-sky-600' : 'bg-sky-200'}`} />
        <div className={`absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full blur-[80px] opacity-15 ${isDark ? 'bg-violet-600' : 'bg-violet-100'}`} />
      </div>

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 ring-1 ring-white/10' : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 ring-1 ring-slate-200 shadow-sm'}`}
          aria-label="toggle theme"
        >
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-500" />}
        </button>
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 ring-1 ring-white/10' : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 ring-1 ring-slate-200 shadow-sm'}`}
        >
          <Languages size={14} />
          {lang === 'en' ? 'ع' : 'EN'}
        </button>
      </div>

      {/* Login Card */}
      <div className={`relative z-10 w-full max-w-[420px] rounded-3xl border p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${isDark ? 'border-white/[0.07] bg-slate-900/80 shadow-slate-950/80' : 'border-white bg-white/90 shadow-slate-200/60'}`}>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/15 ring-1 ring-indigo-500/25' : 'bg-indigo-50 ring-1 ring-indigo-200'}`}>
            <Building2 size={22} className="text-indigo-500" />
          </div>
          <div>
            <p className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>People Monitor</p>
            <p className="text-slate-500 text-xs">{isAr ? 'بوابة المراكز التدريبية' : 'Training Center Portal'}</p>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6 space-y-1">
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isAr ? 'تسجيل دخول المركز' : 'Partner Login'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isAr ? 'أدخل بيانات حساب مركزكم التدريبي للوصول للوحة التحكم' : 'Enter your center credentials to access the dashboard'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${isDark ? 'border-white/[0.07] bg-slate-800/60 focus-within:border-indigo-500/50 focus-within:bg-slate-800' : 'border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm'}`}>
              <Mail size={15} className="text-slate-500 flex-shrink-0" />
              <input
                id="input-partner-email"
                type="email"
                required
                placeholder="center@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-sm placeholder-slate-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${isDark ? 'border-white/[0.07] bg-slate-800/60 focus-within:border-indigo-500/50 focus-within:bg-slate-800' : 'border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm'}`}>
              <Lock size={15} className="text-slate-500 flex-shrink-0" />
              <input
                id="input-partner-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-sm placeholder-slate-500"
              />
            </div>
          </div>

          <button
            id="btn-partner-login"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {isAr ? 'جاري الدخول...' : 'Logging in...'}
              </>
            ) : (
              <>
                {isAr ? 'دخول إلى اللوحة' : 'Access Dashboard'}
                <ArrowRight size={15} className={isAr ? 'rotate-180' : ''} />
              </>
            )}
          </button>
        </form>

        {/* Security note */}
        <div className={`mt-5 flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <Shield size={13} className="text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500">
            {isAr ? 'اتصال آمن ومشفر — تسجيل الدخول خاص بمسؤولي المراكز التدريبية' : 'Secure encrypted connection — partners only'}
          </p>
        </div>

        {/* Divider + nav link */}
        <div className={`mt-6 pt-5 border-t text-center ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <button
            onClick={() => navigate('/login')}
            className="text-indigo-500 hover:text-indigo-400 text-sm font-bold hover:underline transition-colors"
          >
            {isAr ? '← دخول المستخدم العادي' : '← Regular User Login'}
          </button>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        <Sparkles size={12} className="text-indigo-500/40" />
        <span className="text-xs text-slate-600 font-medium">People Monitor &copy; {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}
