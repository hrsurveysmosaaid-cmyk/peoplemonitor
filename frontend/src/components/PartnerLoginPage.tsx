import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import { Building2, Moon, Sun, Languages } from 'lucide-react';

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
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} px-4 py-12 flex items-center justify-center relative overflow-hidden`}>
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className={`auth-card max-w-md w-full p-8 relative z-10 ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/85 border-slate-200'}`}>
        {/* Brand & Controls */}
        <div className={`mb-8 flex items-start justify-between gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
              <Building2 size={22} className="text-indigo-400" />
            </div>
            <div>
              <p className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>People Monitor</p>
              <p className="text-slate-500 text-xs">{isAr ? 'بوابة المراكز التدريبية' : 'Training Center Portal'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={toggleTheme} aria-label="toggle theme">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="icon-button flex items-center gap-1 text-xs font-bold"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            >
              <Languages size={16} />
              <span>{lang === 'en' ? 'ع' : 'EN'}</span>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isAr ? 'دخول المركز التدريبي' : 'Training Center Login'}
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAr ? 'أدخل بيانات حساب مركزكم التدريبي' : 'Enter your training center account credentials'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <label className="block">
            <span className="text-slate-300 text-sm font-medium">{isAr ? 'البريد الإلكتروني للمسؤول' : 'Admin Email'}</span>
            <input
              id="input-partner-email"
              type="email"
              required
              className="input-field mt-2 font-sans"
              placeholder="center@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm font-medium">{isAr ? 'كلمة المرور' : 'Password'}</span>
            <input
              id="input-partner-password"
              type="password"
              required
              className="input-field mt-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </label>

          <button
            id="btn-partner-login"
            type="submit"
            disabled={loading}
            className="button-primary w-full py-3 text-base disabled:opacity-60"
          >
            {loading ? (isAr ? 'جارٍ الدخول...' : 'Logging in...') : (isAr ? 'دخول' : 'Login')}
          </button>
        </form>

        <div className={`mt-8 pt-5 border-t text-center ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <button
            onClick={() => navigate('/login')}
            className="text-sky-400 text-sm font-semibold hover:underline"
          >
            {isAr ? '← دخول المستخدم العادي' : '← Regular User Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
