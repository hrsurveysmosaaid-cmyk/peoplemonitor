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
  ExternalLink, X, Copy, Zap, PenLine, Cpu, LayoutTemplate, Eye
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
    birthDay: '',
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // forces iframe refresh
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
              birthDay: personal.birthDay || '',
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
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

              {/* Save status pill (Hidden when it's just 'Loaded from database') */}
              {(saveState !== 'idle' || (saveLabel && saveLabel !== 'Loaded from database')) && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  saveState === 'saving' ? isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'
                  : saveState === 'saved' ? isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : saveState === 'error' ? isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
                  : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {saveState === 'saving' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                  {saveState === 'saved' && <CheckCircle2 size={11} />}
                  {saveLabel}
                </span>
              )}

              {/* Free guide */}
              <a
                href="https://t.me/HandbookDownloaded_bot"
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${isDark ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20' : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200'}`}
              >
                <Sparkles size={12} />
                {t.freeGuideCta}
              </a>

              <div className={`hidden lg:block w-px h-4 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

              {/* Save */}
              <button
                onClick={handleSaveDraft}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                  saveState === 'saving'
                    ? isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    : isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <Save size={13} className={saveState === 'saving' ? 'animate-pulse' : ''} />
                <span>{lang === 'ar' ? 'حفظ' : 'Save'}</span>
              </button>

              {/* Published Link (Shortened, next to Publish) */}
              {portfolioSlug && isPublished && (
                <div className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate" title={portfolioSlug}>
                    {portfolioSlug.length > 12 ? `${portfolioSlug.slice(0, 10)}...` : portfolioSlug}
                  </span>
                  <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/p/${portfolioSlug}`);
                        setSaveLabel(lang === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
                        setTimeout(() => setSaveLabel(''), 2000);
                      }}
                      className="hover:scale-110 transition-transform p-0.5"
                      title={lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                    >
                      <Copy size={11} />
                    </button>
                    <a
                      href={`/p/${portfolioSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-110 transition-transform p-0.5 text-inherit"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}

              {/* Publish */}
              <button
                onClick={() => setShowPublish(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-px transition-all duration-200 active:scale-95"
              >
                <UploadCloud size={13} />
                <span>{lang === 'ar' ? 'نشر' : 'Publish'}</span>
              </button>

              {/* Preview Toggle */}
              <button
                onClick={() => { setShowPreview(p => !p); setPreviewKey(k => k + 1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                  showPreview
                    ? isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-700 border border-sky-300'
                    : isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
                title={showPreview ? (lang === 'ar' ? 'إخفاء المعاينة' : 'Hide preview') : (lang === 'ar' ? 'معاينة حية' : 'Live preview')}
              >
                {showPreview ? <LayoutTemplate size={13} /> : <Eye size={13} />}
                <span className="hidden sm:inline">{showPreview ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'معاينة' : 'Preview')}</span>
              </button>

              {/* Export */}
              <button
                onClick={handleExportPDF}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
              >
                <FileDown size={13} />
                <span>{lang === 'ar' ? 'تصدير' : 'Export'}</span>
              </button>

              <div className="w-px h-4 bg-white/10" />

              {/* Theme */}
              <button
                onClick={toggleTheme}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200'}`}
                title={t.themeToggle}
                aria-label="toggle theme"
              >
                {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-indigo-500" />}
              </button>

              {/* Language */}
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200'}`}
                title={t.languageToggle}
                aria-label="toggle language"
              >
                <Languages size={13} />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'}`}
                title={t.logout}
                aria-label={t.logout}
              >
                <LogOut size={13} />
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

        {/* ── MAIN CONTENT AREA (Form + optional Live Preview) ── */}
        <div className={`flex gap-5 pb-10 transition-all duration-300 ${showPreview ? 'lg:flex-row items-start' : ''}`}>

          {/* Form Column */}
          <main
            id="cv-content-workstation"
            className={`grid gap-5 flex-1 min-w-0 transition-all duration-300 ${showPreview ? 'lg:max-w-[55%]' : ''}`}
          >
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

          {/* Live Preview Pane (only visible when showPreview is true, only on large screens) */}
          {showPreview && portfolioSlug && (
            <aside className="hidden lg:flex flex-col gap-3 flex-1 min-w-0 sticky top-24" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${
                isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewKey(k => k + 1)}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    title={lang === 'ar' ? 'تحديث' : 'Refresh'}
                  >
                    ↻
                  </button>
                  <a
                    href={`/p/${portfolioSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    title={lang === 'ar' ? 'فتح في تبويب جديد' : 'Open in new tab'}
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
              <div className={`flex-1 rounded-3xl overflow-hidden border shadow-xl ${
                isDark ? 'border-white/10 shadow-black/40' : 'border-slate-200 shadow-slate-200'
              }`}>
                <iframe
                  key={previewKey}
                  src={`/p/${portfolioSlug}`}
                  className="w-full h-full"
                  style={{ minHeight: 'calc(100vh - 180px)' }}
                  title="Live Portfolio Preview"
                  loading="lazy"
                />
              </div>
            </aside>
          )}

          {/* Mobile preview notice: show a link when preview is toggled on mobile */}
          {showPreview && portfolioSlug && (
            <div className={`lg:hidden fixed bottom-6 inset-x-4 z-50 flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              isDark ? 'bg-slate-900/90 border-white/15 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-xs font-semibold truncate">{lang === 'ar' ? 'البورتفوليو منشور' : 'Portfolio live'}</span>
              </div>
              <a
                href={`/p/${portfolioSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-sky-500 flex-shrink-0"
              >
                <Eye size={12} />
                {lang === 'ar' ? 'عرض' : 'View'}
              </a>
              <button onClick={() => setShowPreview(false)} className="p-1 opacity-50 hover:opacity-100 flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          )}

          {/* Preview hint when no slug yet */}
          {showPreview && !portfolioSlug && (
            <aside className="hidden lg:flex items-center justify-center flex-1 min-w-0 rounded-3xl border border-dashed min-h-[300px] ${
              isDark ? 'border-white/10 text-slate-600' : 'border-slate-300 text-slate-400'
            }">
              <p className="text-sm text-center px-6">
                {lang === 'ar' ? 'احفظ أو انشر ملفك أولاً لتظهر المعاينة هنا' : 'Save or publish your portfolio first to see the live preview here.'}
              </p>
            </aside>
          )}
        </div>

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
