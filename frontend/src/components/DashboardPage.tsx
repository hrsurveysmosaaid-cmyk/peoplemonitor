import { useEffect, useState } from 'react';
import SectionA from './sections/SectionA';
import SectionB from './sections/SectionB';
import SectionC from './sections/SectionC';
import SectionD from './sections/SectionD';
import SectionE from './sections/SectionE';
import SectionF from './sections/SectionF';
import { WorkstationData } from '../types';
import { useUi } from '../ui/UiContext';
import { useNavigate } from 'react-router-dom';

import {
  Languages, Moon, Sun, Save, UploadCloud,
  FileDown, LogOut, CheckCircle2, Globe, Sparkles,
  ExternalLink, X, Copy, Zap, PenLine, Cpu
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { PublishModal } from './PublishModal';
import type { PublishSettings } from '../types';


const initialData: WorkstationData = {
  personal: {
    prefix: '',
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    residencyStatus: '',
    nationality: '',
    birthYear: '',
    birthMonth: '',
    profileImageUrl: '',
    website: '',
    linkedin: '',
    github: '',
    behance: '',
    availability: 'open',
  },
  summary: '',
  experiences: [],
  education: [],
  skills: {
    technical: '',
    interpersonal: '',
    workRelated: '',
  },
  dynamicItems: [],
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function DashboardPage() {
  const [workstationData, setWorkstationData] = useState<WorkstationData>(initialData);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveLabel, setSaveLabel] = useState('');
  const { t, theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';
  const [portfolioSlug, setPortfolioSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState<string>('');
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        const response = await fetch('/api/portfolios/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success && data.data) {
          const loaded = data.data;
          const personal = loaded.portfolio.personal_data_json || {};
          setWorkstationData({
            personal: {
              prefix: personal.prefix || '',
              fullName: personal.fullName || '',
              jobTitle: personal.jobTitle || '',
              email: personal.email || '',
              phone: personal.phone || '',
              location: personal.location || '',
              residencyStatus: personal.residencyStatus || '',
              nationality: personal.nationality || '',
              birthYear: personal.birthYear || '',
              birthMonth: personal.birthMonth || '',
              profileImageUrl: personal.profileImageUrl || '',
              website: personal.website || '',
              linkedin: personal.linkedin || '',
              github: personal.github || '',
              behance: personal.behance || personal.binance || '',
              availability: personal.availability || 'open',
            },
            summary: loaded.portfolio.professional_summary || '',
            experiences: loaded.experienceBlocks.map((block: any) => ({
              id: String(block.id),
              title: block.role_designation || '',
              company: block.institution_title || '',
              location: block.location || '',
              startDate: block.date_start || '',
              endDate: block.date_end || '',
              description: block.description_narrative || '',
              attachedAssetUrl: block.attached_asset_url || '',
              successStory: block.successStory || ''
            })),
            education: personal.education || [],
            skills: {
              technical: loaded.portfolio.skills_classified_json?.technical || '',
              interpersonal: loaded.portfolio.skills_classified_json?.interpersonal || '',
              workRelated: loaded.portfolio.skills_classified_json?.workRelated || '',
            },
            dynamicItems: personal.dynamicItems || []
          });
          setPortfolioSlug(loaded.portfolio.unique_slug_string);
          setIsPublished(!!loaded.portfolio.is_published_live);
          setSaveLabel('Loaded from database');
        } else {
          const stored = localStorage.getItem('local_backup');
          if (stored) {
            try { setWorkstationData(JSON.parse(stored)); } catch { setWorkstationData(initialData); }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPortfolio();
  }, [navigate]);


  const handleSaveDraft = async () => {
    setSaveState('saving');
    setSaveLabel(lang === 'ar' ? 'جاري الحفظ...' : 'Saving...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...workstationData, isPublishedLive: false })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSaveState('saved');
        setSaveLabel(lang === 'ar' ? 'تم الحفظ ✓' : 'Saved ✓');
        setIsPublished(false);
        if (data.data?.slug) setPortfolioSlug(data.data.slug);
        if (data.data?.experiences) {
          setWorkstationData((prev: WorkstationData) => ({ ...prev, experiences: data.data.experiences }));
        }
      } else {
        setSaveState('error');
        setSaveLabel(lang === 'ar' ? 'خطأ في الحفظ' : 'Save failed');
      }
    } catch (err) {
      console.error(err);
      setSaveState('error');
      setSaveLabel(lang === 'ar' ? 'خطأ في الحفظ' : 'Save failed');
    } finally {
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const submitPublish = async (settings: PublishSettings) => {
    setSaveState('saving');
    setSaveLabel(lang === 'ar' ? 'جاري النشر...' : 'Publishing...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...workstationData,
          personal: { ...workstationData.personal, lang, publishSettings: settings },
          isPublishedLive: true,
          desiredSlug: settings.slug || undefined,
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSaveState('saved');
        setSaveLabel(lang === 'ar' ? 'تم النشر ✓' : 'Published ✓');
        setIsPublished(true);
        const origin = window.location.origin;
        const slug = data.data?.slug || data.data?.unique_slug_string || '';
        if (slug) {
          setPortfolioSlug(slug);
          setPublishSuccessUrl(`${origin}/p/${slug}`);
          setShowPublishSuccess(true);
        }
        if (data.data?.experiences) {
          setWorkstationData((prev: WorkstationData) => ({ ...prev, experiences: data.data.experiences }));
        }
      } else {
        setSaveState('error');
        setSaveLabel(lang === 'ar' ? 'خطأ في النشر' : 'Publish failed');
      }
    } catch (err) {
      console.error(err);
      setSaveState('error');
      setSaveLabel(lang === 'ar' ? 'خطأ في النشر' : 'Publish failed');
    } finally {
      setShowPublish(false);
      setTimeout(() => setSaveState('idle'), 4000);
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const origin = window.location.origin;
      const profileUrl = workstationData && (portfolioSlug ? `${origin}/p/${portfolioSlug}` : '');
      const sanitized = {
        personal: {
          ...workstationData.personal,
          profileImageUrl: undefined,
          website: profileUrl || workstationData.personal.website || '',
          languages: workstationData.personal.languages || []
        },
        summary: workstationData.summary || '',
        experiences: workstationData.experiences.map((e) => ({
          title: e.title, company: e.company, location: e.location,
          startDate: e.startDate, endDate: e.endDate, description: e.description
        })),
        education: workstationData.education.map((q) => ({
          institution: q.institution, degree: q.degree, location: q.location,
          startDate: q.startDate, endDate: q.endDate, description: q.description
        })),
        skills: workstationData.skills,
        dynamicItems: workstationData.dynamicItems.map((it) => ({
          id: it.id, type: it.type, title: it.title, description: it.description, link: it.link
        }))
      };
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(sanitized)
      });
      if (!res.ok) { console.error('Failed to export PDF'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workstationData.personal.fullName || 'peopleos'}-ats-cv.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publishSuccessUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#060818] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'}`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-25 ${isDark ? 'bg-sky-600' : 'bg-sky-200'}`} />
        <div className={`absolute -bottom-48 -left-24 w-[420px] h-[420px] rounded-full blur-[90px] opacity-20 ${isDark ? 'bg-indigo-600' : 'bg-indigo-100'}`} />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── STICKY TOP NAV ── */}
        <header className={`sticky top-4 z-50 mx-0 mt-4 mb-6 rounded-2xl border px-4 sm:px-6 py-3 shadow-xl backdrop-blur-2xl transition-all duration-300 ${isDark ? 'border-white/[0.07] bg-slate-900/80' : 'border-white bg-white/90 shadow-slate-200/60'}`}>
          <div className="flex items-center justify-between gap-4">

            {/* Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl flex-shrink-0 ${isDark ? 'bg-sky-500/15 ring-1 ring-sky-500/25' : 'bg-sky-50 ring-1 ring-sky-200'}`}>
                <Cpu size={18} className="text-sky-500" />
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sky-500 text-[9px] uppercase tracking-[0.25em] font-black">PeopleOS Workstation</p>
                <h1 className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h1>
              </div>
            </div>

            {/* Status + Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Save status pill */}
              {(saveState !== 'idle' || saveLabel) && (
                <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  saveState === 'saving' ? isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                  : saveState === 'saved' ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                  : saveState === 'error' ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {saveState === 'saving' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  {saveState === 'saved' && <CheckCircle2 size={12} />}
                  {saveLabel}
                </span>
              )}

              {/* Published link */}
              {portfolioSlug && isPublished && (
                <a
                  href={`/p/${portfolioSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hidden md:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {portfolioSlug}
                  <ExternalLink size={11} />
                </a>
              )}

              <div className={`hidden sm:block w-px h-5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

              {/* Free guide */}
              <a
                href="https://t.me/HandbookDownloaded_bot"
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden lg:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${isDark ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 ring-1 ring-violet-500/20' : 'bg-violet-50 text-violet-600 hover:bg-violet-100 ring-1 ring-violet-200'}`}
              >
                <Sparkles size={13} />
                {t.freeGuideCta}
              </a>

              <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

              {/* Save */}
              <button
                onClick={handleSaveDraft}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                  saveState === 'saving'
                    ? isDark ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20' : 'bg-amber-50 text-amber-600'
                    : isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 ring-1 ring-slate-200'
                }`}
              >
                <Save size={14} className={saveState === 'saving' ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">{lang === 'ar' ? 'حفظ' : 'Save'}</span>
              </button>

              {/* Publish */}
              <button
                onClick={() => setShowPublish(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-px transition-all duration-200 active:scale-95"
              >
                <UploadCloud size={14} />
                <span className="hidden sm:inline">{lang === 'ar' ? 'نشر' : 'Publish'}</span>
              </button>

              {/* Export PDF */}
              <button
                onClick={handleExportPDF}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 ring-1 ring-slate-200'}`}
              >
                <FileDown size={14} />
                <span className="hidden sm:inline">{lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
              </button>

              <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

              {/* Theme */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                title={t.themeToggle}
                aria-label="toggle theme"
              >
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-500" />}
              </button>

              {/* Language */}
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                title={t.languageToggle}
                aria-label="toggle language"
              >
                <Languages size={15} />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-red-500/10 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                title={t.logout}
                aria-label={t.logout}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* ── PUBLISH SUCCESS BANNER ── */}
        {showPublishSuccess && (
          <div className={`mb-5 rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${isDark ? 'border-emerald-500/25 bg-emerald-500/8 backdrop-blur-sm' : 'border-emerald-200 bg-emerald-50'}`} role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl flex-shrink-0 ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}`}>
                <Globe size={16} className="text-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <p className={`text-sm font-black ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {lang === 'ar' ? '🎉 تم نشر حقيبتك المهنية بنجاح!' : '🎉 Your portfolio is now live!'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className={`px-2.5 py-1 rounded-lg text-xs font-mono ${isDark ? 'bg-slate-900 text-emerald-300 ring-1 ring-emerald-500/20' : 'bg-white text-emerald-700 ring-1 ring-emerald-200'}`}>
                    {publishSuccessUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                  >
                    <Copy size={11} />
                    {urlCopied ? (lang === 'ar' ? 'تم!' : 'Copied!') : (lang === 'ar' ? 'نسخ' : 'Copy')}
                  </button>
                  <a
                    href={publishSuccessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm hover:shadow-md transition-all"
                  >
                    <ExternalLink size={11} />
                    {lang === 'ar' ? 'فتح' : 'Open'}
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPublishSuccess(false)}
              className={`p-1.5 rounded-lg self-start sm:self-auto transition-all ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
              aria-label={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT SECTIONS ── */}
        <main id="cv-content-workstation" className="grid gap-5 pb-10">
          <SectionA
            t={t}
            personal={workstationData.personal}
            onChange={(personal) => {
              setWorkstationData((prev: WorkstationData) => {
                const next = { ...prev, personal };
                localStorage.setItem('local_backup', JSON.stringify(next));
                return next;
              });
            }}
          />
          <SectionB
            t={t}
            summary={workstationData.summary}
            onChange={(summary) => {
              setWorkstationData((prev: WorkstationData) => {
                const next = { ...prev, summary };
                localStorage.setItem('local_backup', JSON.stringify(next));
                return next;
              });
            }}
          />
          <SectionC
            t={t}
            personal={workstationData.personal}
            experiences={workstationData.experiences}
            onChange={(experiences) => {
              setWorkstationData((prev: WorkstationData) => {
                const next = { ...prev, experiences };
                localStorage.setItem('local_backup', JSON.stringify(next));
                return next;
              });
            }}
          />
          <SectionD
            t={t}
            education={workstationData.education}
            onChange={(education) => {
              setWorkstationData((prev: WorkstationData) => {
                const next = { ...prev, education };
                localStorage.setItem('local_backup', JSON.stringify(next));
                return next;
              });
            }}
          />
          <SectionE
            t={t}
            skills={workstationData.skills}
            onChange={(skills) => {
              setWorkstationData((prev: WorkstationData) => {
                const next = { ...prev, skills };
                localStorage.setItem('local_backup', JSON.stringify(next));
                return next;
              });
            }}
          />
          <SectionF
            t={t}
            items={workstationData.dynamicItems}
            onChange={(dynamicItems) => {
              setWorkstationData((prev: WorkstationData) => {
                const next = { ...prev, dynamicItems };
                localStorage.setItem('local_backup', JSON.stringify(next));
                return next;
              });
            }}
          />
        </main>

        {/* Footer */}
        <footer className={`py-5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t text-xs transition-all ${isDark ? 'border-white/[0.05] text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          <span className="flex items-center gap-1.5">
            <Zap size={12} className="text-sky-500/60" />
            &copy; {new Date().getFullYear()} People Monitor &bull; {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
          </span>
          <button
            onClick={() => navigate('/privacy-policy')}
            className="text-sky-500 hover:text-sky-400 font-semibold hover:underline transition-colors"
          >
            {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </button>
        </footer>
      </div>

      <PublishModal
        open={showPublish}
        initial={workstationData.personal.publishSettings}
        onClose={() => setShowPublish(false)}
        onPublish={submitPublish}
      />
    </div>
  );
}
