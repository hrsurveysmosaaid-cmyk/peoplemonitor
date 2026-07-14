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

import { Languages, Moon, Sun, Save, UploadCloud, FileDown, LogOut } from 'lucide-react';
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

export default function DashboardPage() {
  const [workstationData, setWorkstationData] = useState<WorkstationData>(initialData);
  const [saveStatus, setSaveStatus] = useState('Saved locally');
  const { t, theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';
    const [portfolioSlug, setPortfolioSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState<string>('');
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    // Load saved workspace data from database
    const fetchPortfolio = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await fetch('/api/portfolios/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
          setSaveStatus('Loaded from database');
        } else {
          // Fallback to local storage if database empty
          const stored = localStorage.getItem('local_backup');
          if (stored) {
            try {
              setWorkstationData(JSON.parse(stored));
            } catch {
              setWorkstationData(initialData);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPortfolio();
  }, [navigate]);


  const handleSaveDraft = async () => {
    setSaveStatus('Saving Draft...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...workstationData,
          isPublishedLive: false
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSaveStatus('Draft Saved successfully');
        setIsPublished(false);
        if (data.data?.slug) {
          setPortfolioSlug(data.data.slug);
        }
        if (data.data?.experiences) {
          setWorkstationData((prev: WorkstationData) => ({
            ...prev,
            experiences: data.data.experiences
          }));
        }
      } else {
        setSaveStatus('Error saving draft');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Error saving draft');
    }
  };

  const submitPublish = async (settings: PublishSettings) => {
    setSaveStatus('Publishing...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...workstationData,
          personal: { ...workstationData.personal, lang, publishSettings: settings },
          isPublishedLive: true,
          desiredSlug: settings.slug || undefined,
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSaveStatus('Published successfully!');
        setIsPublished(true);
        const origin = window.location.origin;
        const slug = data.data?.slug || data.data?.unique_slug_string || '';
        if (slug) {
          setPortfolioSlug(slug);
          const url = `${origin}/p/${slug}`;
          setPublishSuccessUrl(url);
          setShowPublishSuccess(true);
        }
        if (data.data?.experiences) {
          setWorkstationData((prev: WorkstationData) => ({
            ...prev,
            experiences: data.data.experiences
          }));
        }
      } else {
        setSaveStatus('Error publishing');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Error publishing');
    } finally {
      setShowPublish(false);
    }
  };


  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Compute public profile URL to include in PDF (replaces website field)
      const origin = window.location.origin;
      const profileUrl = workstationData && (portfolioSlug ? `${origin}/p/${portfolioSlug}` : '');

      // Prepare strict ATS payload: monochrome, text-only, no images/attachments/success stories
      const sanitized = {
        personal: {
          ...workstationData.personal,
          profileImageUrl: undefined, // exclude images
          website: profileUrl || workstationData.personal.website || '',
          languages: workstationData.personal.languages || []
        },
        summary: workstationData.summary || '',
        experiences: workstationData.experiences.map((e) => ({
          title: e.title,
          company: e.company,
          location: e.location,
          startDate: e.startDate,
          endDate: e.endDate,
          description: e.description
          // intentionally exclude attachedAssetUrl and successStory
        })),
        education: workstationData.education.map((q) => ({
          institution: q.institution,
          degree: q.degree,
          location: q.location,
          startDate: q.startDate,
          endDate: q.endDate,
          description: q.description
          // exclude attachedAssetUrl if present
        })),
        skills: workstationData.skills,
        dynamicItems: workstationData.dynamicItems.map((it) => ({
          id: it.id,
          type: it.type,
          title: it.title,
          description: it.description,
          link: it.link
        }))
      };

      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sanitized)
      });

      if (!res.ok) {
        console.error('Failed to export PDF');
        return;
      }

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



  return (
    <div className={`min-h-screen px-4 py-8 md:px-10 lg:px-16 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto max-w-[1440px]">
        <header className={`mb-8 rounded-[2rem] border p-6 shadow-glass backdrop-blur-xl transition-all duration-300 ${isDark ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/90'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sky-500 text-sm uppercase tracking-[0.35em] font-bold">PeopleOS Workstation</p>
              <h1 className={`mt-2 text-3xl font-extrabold sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h1>
                            <a
                href="https://t.me/HandbookDownloaded_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary mt-3 hidden md:inline-flex text-xs sm:text-sm w-fit"
              >
                {t.freeGuideCta}
              </a>
              {portfolioSlug && isPublished && (
                <p className="mt-3 text-sm text-emerald-500 font-semibold">/p/{portfolioSlug}</p>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
              <div className="flex items-center">
                <button className="button-secondary px-2 sm:px-3 py-2 text-xs" onClick={handleSaveDraft}>
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" title={lang === 'ar' ? 'تم الحفظ تلقائياً' : 'Auto-saved'} />
                  <Save size={16} />
                  <span className="ml-2 hidden sm:inline">{lang === 'ar' ? 'حفظ' : 'Save'}</span>
                </button>
              </div>
                            <button className="button-primary px-2 sm:px-3 py-2 text-xs" onClick={() => setShowPublish(true)}>
                <UploadCloud size={16} />
                <span className="ml-2 hidden sm:inline">{lang === 'ar' ? 'نشر' : 'Publish'}</span>
              </button>

              <button className="button-secondary px-2 sm:px-3 py-2 text-xs" onClick={handleExportPDF}>
                <FileDown size={16} />
                <span className="ml-2 hidden sm:inline">{lang === 'ar' ? 'تصدير' : 'Export'}</span>
              </button>
              <button
                className="icon-button"
                onClick={toggleTheme}
                title={t.themeToggle}
                aria-label="toggle theme"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                className="icon-button flex items-center text-xs font-bold"
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                title={t.languageToggle}
                aria-label="toggle language"
              >
                <Languages size={16} />
              </button>
              <button className="icon-button" onClick={handleLogout} title={t.logout} aria-label={t.logout}>
                <LogOut size={16} />
              </button>
            </div>
          </div>


        </header>

        {/* Success banner after publish */}
        {showPublishSuccess && (
          <div className={`mb-4 rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50'}`} role="status" aria-live="polite">
            <div className="space-y-1">
              <p className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{lang === 'ar' ? 'تم النشر بنجاح' : 'Published successfully'}</p>
              <div className="flex items-center gap-2">
                <input
                  className={`px-2 py-1 rounded-md text-xs w-[300px] ${isDark ? 'bg-slate-900 text-emerald-200 border border-emerald-500/30' : 'bg-white text-emerald-700 border border-emerald-300'}`}
                  readOnly
                  value={publishSuccessUrl}
                  aria-label={lang === 'ar' ? 'رابط البروفايل' : 'Profile URL'}
                />
                <button
                  className="button-secondary text-xs px-2 py-1"
                  onClick={() => navigator.clipboard.writeText(publishSuccessUrl)}
                >
                  {lang === 'ar' ? 'نسخ' : 'Copy'}
                </button>
                <a
                  className="button-primary text-xs px-2 py-1"
                  href={publishSuccessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {lang === 'ar' ? 'فتح' : 'Open'}
                </a>
              </div>
            </div>
            <button
              className="icon-button self-end sm:self-auto"
              aria-label={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
              title={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
              onClick={() => setShowPublishSuccess(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Content wrapper */}
        <main id="cv-content-workstation" className="grid gap-6">
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
        
        <footer className={`mt-12 py-6 border-t text-center space-y-2 transition-all duration-300 ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} People Monitor. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <div>
            <button
              onClick={() => navigate('/privacy-policy')}
              className="text-xs text-sky-500 hover:text-sky-400 font-semibold hover:underline"
            >
              {lang === 'ar' ? 'سياسة الخصوصية وشروط الاستخدام' : 'Privacy Policy & Terms of Use'}
            </button>
          </div>
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

