import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import { Languages, Moon, Sun, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t, theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';

  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Parse token from query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tkn = params.get('token') || '';
    setToken(tkn);
  }, []);

  const isValidToSubmit = useMemo(() => {
    return newPassword.length >= 8 && confirmPassword.length >= 8 && newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!token) {
      setError(t.invalidOrExpiredLink || 'Invalid or expired link');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.passwordsNotMatch || 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (t.invalidOrExpiredLink || 'Invalid or expired link'));
        return;
      }

      setMsg(t.resetPasswordSuccess || 'Password reset successfully. You can now log in.');
    } catch (err) {
      console.error(err);
      setError(t.serverError || 'Server connection error');
    } finally {
      setLoading(false);
    }
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

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.resetPassword || 'Reset Password'}</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.resetPasswordSubtitle || 'Choose a new password to access your account.'}
          </p>
        </div>

        {!token && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm text-center">
            {t.invalidOrExpiredLink || 'Invalid or expired link'}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm text-center">{error}</div>
        )}
        {msg && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-200 text-sm text-center font-medium">{msg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-slate-300 text-sm font-medium">{t.newPassword || 'New Password'}</span>
            <div className="relative flex items-center mt-2">
              <input
                id="input-reset-new-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pr-10"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showPassword ? (lang === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password') : (lang === 'ar' ? 'إظهار كلمة المرور' : 'Show password')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm font-medium">{t.confirmNewPassword || 'Confirm New Password'}</span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.passwordRequirements || 'Must include uppercase, lowercase letters, and a number'}</span>
            </div>
            <div className="relative flex items-center mt-2">
              <input
                id="input-reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="input-field pr-10"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showConfirmPassword ? (lang === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password') : (lang === 'ar' ? 'إظهار كلمة المرور' : 'Show password')}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button
            id="btn-reset-submit"
            type="submit"
            disabled={loading || !isValidToSubmit}
            className="button-primary w-full py-3 text-base disabled:opacity-60"
          >
            {loading ? (t.resetting || 'Resetting…') : (t.resetPassword || 'Reset Password')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/login')} className="text-sky-400 text-sm font-semibold hover:underline">
            ← {t.backToLogin || 'Back to login'}
          </button>
        </div>
      </div>
    </div>
  );
}
