import React from 'react';
import { Link } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import { Languages, Moon, Sun, Save, UploadCloud, FileDown, UserPlus, LogOut } from 'lucide-react';

type Props = {
  showAuthButtons?: boolean;
  showPortfolioActions?: boolean;
  showLogoutButton?: boolean;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  onExportPdf?: () => void;
  onLogout?: () => void;
};

export default function TopBar({ showAuthButtons, showPortfolioActions, showLogoutButton, onSaveDraft, onPublish, onExportPdf, onLogout }: Props) {
  const { theme, toggleTheme, lang, setLang, t } = useUi();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 mb-6 rounded-3xl border p-3 backdrop-blur-xl shadow-glass ${isDark ? 'bg-slate-950/80 border-white/10' : 'bg-white/85 border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${isDark ? 'bg-gradient-to-br from-indigo-500 to-sky-500' : 'bg-gradient-to-br from-indigo-400 to-sky-400'} flex items-center justify-center text-white text-base`}>🌐</div>
          <strong className={isDark ? 'text-white' : 'text-slate-900'}>PeopleOS</strong>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showAuthButtons && (
            <Link to="/register" className="button-secondary px-4 py-2 text-xs">
              <UserPlus size={16} />
              <span className="ml-2 hidden sm:inline">{t?.register || (lang === 'ar' ? 'إنشاء حساب' : 'Register')}</span>
            </Link>
          )}

          {showPortfolioActions && (
            <>
              <button className="button-secondary px-3 py-2 text-xs" onClick={onSaveDraft}>
                <Save size={16} />
                <span className="ml-2 hidden sm:inline">{t.saveDraft}</span>
              </button>
              <button className="button-primary px-3 py-2 text-xs" onClick={onPublish}>
                <UploadCloud size={16} />
                <span className="ml-2 hidden sm:inline">{t.publishPortfolio}</span>
              </button>
              <button className="button-secondary px-3 py-2 text-xs" onClick={onExportPdf}>
                <FileDown size={16} />
                <span className="ml-2 hidden sm:inline">{t.exportPdf}</span>
              </button>
            </>
          )}

          {showLogoutButton && (
            <button className="button-secondary px-3 py-2 text-xs" onClick={onLogout} title={t.logout}>
              <LogOut size={16} />
              <span className="ml-2 hidden sm:inline">{t.logout}</span>
            </button>
          )}

          <button
            className={`p-2 rounded-xl border ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-yellow-400' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
            onClick={toggleTheme}
            title={t.themeToggle}
            aria-label="toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            title="toggle language"
          >
            <Languages size={16} />
            <span className="hidden sm:inline">{lang === 'en' ? 'العربية' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
