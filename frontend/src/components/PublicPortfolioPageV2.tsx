import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Mail, Phone, Globe, Award, Briefcase, Calendar } from 'lucide-react';
import type { PublishSettings } from '../types';
import DocumentModal from './DocumentModal';

export default function PublicPortfolioPageV2() {
  const { slug, template } = useParams<{ slug: string; template?: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ open: boolean; type?: 'pdf'|'image'|'text'; url?: string; title?: string; text?: string }>({ open: false });
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [profileResolvedUrl, setProfileResolvedUrl] = useState<string>('');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
        const safeSlug = encodeURIComponent(slug || '');
        const url = `${base}/api/portfolios/public/${safeSlug}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        let payload: any = null;
        try {
          payload = await response.json();
        } catch {}
        if (!response.ok) {
          setError(payload?.error || 'السيرة الذاتية غير موجودة أو غير منشورة حالياً.');
        } else {
          const normalized = payload?.data ?? payload ?? null;
          setData(normalized);
        }
      } catch (err) {
        console.error(err);
        setError('حدث خطأ أثناء تحميل السيرة الذاتية.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPublicData();
  }, [slug]);

  const portfolio = (data && data.portfolio) || {};
  const experienceBlocks = Array.isArray(data?.experienceBlocks) ? data.experienceBlocks : [];
  const endorsements = Array.isArray(data?.endorsements) ? data.endorsements : [];
  const personal = (portfolio && portfolio.personal_data_json) || {};
  const skills = (portfolio && portfolio.skills_classified_json) || {};
  const education = Array.isArray(personal.education) ? personal.education : [];
  const dynamicItems = Array.isArray(personal.dynamicItems) ? personal.dynamicItems : [];
  const publish: PublishSettings | undefined = personal.publishSettings;
  const lang: 'en' | 'ar' = personal.lang || 'en';

  const t = useMemo(() => ({
    profileLoading: lang === 'ar' ? 'جاري تحميل السيرة الذاتية...' : 'Loading portfolio...',
    notFound: lang === 'ar' ? 'الصفحة غير موجودة' : 'Page not found',
    goLogin: lang === 'ar' ? 'الذهاب لتسجيل الدخول' : 'Go to Login',
    summary: lang === 'ar' ? 'الخلاصة المهنية' : 'Professional Summary',
    work: lang === 'ar' ? 'خبرات العمل' : 'Work Experience',
    now: lang === 'ar' ? 'الآن' : 'Now',
    education: lang === 'ar' ? 'التعليم والمؤهلات' : 'Education',
    skills: lang === 'ar' ? 'المهارات المصنفة' : 'Skills',
    tech: lang === 'ar' ? 'المهارات التقنية' : 'Technical',
    inter: lang === 'ar' ? 'المهارات الشخصية' : 'Interpersonal',
    workRel: lang === 'ar' ? 'مهارات العمل' : 'Work-related',
    verified: 'Verified Endorsement',
  }), [lang]);

  const themeClass = useMemo(() => `portfolio-theme-${(slug || 'default').replace(/[^a-z0-9_-]/gi, '-')}`,[slug]);

  const endorsementsByExpId = useMemo(() => {
    const map: Record<string, any> = {};
    (endorsements || []).forEach((e: any) => {
      const key = e && e.experience_block_id != null ? String(e.experience_block_id) : '';
      if (key && !map[key]) map[key] = e;
    });
    return map;
  }, [endorsements]);

  const effectivePublish: PublishSettings | undefined = useMemo(() => {
    if (publish && publish.colors && publish.font) return publish;
    return {
      name: personal?.fullName || 'Profile',
      slug: slug || 'profile',
      colors: { text: '#111111', button: '#16a34a', background: '#ffffff' },
      backgroundType: 'solid',
      font: 'Times New Roman',
      theme: 'normal',
    } as PublishSettings;
  }, [publish, personal?.fullName, slug]);

  useEffect(() => {
    const styleId = `theme-${themeClass}`;
    const existing = document.getElementById(styleId);

    const p = effectivePublish;
    if (!p) {
      if (existing) existing.remove();
      return;
    }

    let background: string | undefined;
    if (p.backgroundType === 'solid') background = p.colors.background;
    else if (p.backgroundType === 'gradient' && p.gradient) background = `linear-gradient(${p.gradient.angle}deg, ${p.gradient.from}, ${p.gradient.to})`;
    else if (p.backgroundType === 'image' && p.backgroundImage) background = `url('${p.backgroundImage}') center/cover no-repeat`;

    const fontMap: Record<string, string> = {
      'Tajawal': '"Tajawal", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans"',
      'Dubai': '"Dubai", "Segoe UI", Tahoma, Arial, sans-serif',
      'Times New Roman': '"Times New Roman", Times, serif',
      'Arial': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
      'Tahoma': 'Tahoma, Geneva, Verdana, sans-serif',
      'Sans Serif': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'Calibri': 'Calibri, "Segoe UI", Arial, sans-serif'
    };

    const css = `.${themeClass}{ color: ${p.colors.text}; ${background ? `background: ${background};` : ''} font-family: ${fontMap[p.font] || 'system-ui, sans-serif'}; } .${themeClass} a, .${themeClass} button { color: ${p.colors.button}; }`;

    if (existing) existing.remove();
    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = css;
    document.head.appendChild(el);

    return () => {
      const toRemove = document.getElementById(styleId);
      if (toRemove) toRemove.remove();
    };
  }, [effectivePublish, themeClass]);

  const effectiveTemplate: 'classic' | 'professional' = (() => {
    const tmpl = (template || '').toLowerCase();
    if (tmpl === 'professional' || tmpl === 'classic') return tmpl as any;
    const saved = (effectivePublish?.theme || 'normal');
    if (saved === 'professional') return 'professional';
    return 'classic';
  })();

  // Resolve profile image to signed URL if needed
  useEffect(() => {
    const ref = personal?.profileImageUrl as string | undefined;
    if (!ref) { setProfileResolvedUrl(''); return; }
    const lower = String(ref).toLowerCase();
    if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
      (async () => {
        try {
          const base = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
          const endpoint = `${base}/api/assets/signed?ref=${encodeURIComponent(String(ref))}&slug=${encodeURIComponent(slug || '')}`;
          const res = await fetch(endpoint);
          if (res.ok) {
            const payload = await res.json();
            const signed = payload?.url || payload?.signedUrl;
            if (signed) { setProfileResolvedUrl(signed); return; }
          }
          setProfileResolvedUrl('');
        } catch { setProfileResolvedUrl(''); }
      })();
    } else {
      setProfileResolvedUrl(String(ref));
    }
  }, [personal?.profileImageUrl, slug]);

  const birthDisplay = useMemo(() => {
    const yy = personal?.birthYear as string | undefined;
    const mm = (personal?.birthMonth as string | undefined) || '';
    const dd = (personal?.birthDay as string | undefined) || '';
    if (!yy) return '';
    if (mm) {
      return dd ? `${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}` : `${yy}-${String(mm).padStart(2,'0')}`;
    }
    return yy;
  }, [personal?.birthYear, personal?.birthMonth, personal?.birthDay]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <p className="text-xl animate-pulse">{t.profileLoading}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-extrabold text-red-500 mb-4">404</h1>
        <p className="text-2xl mb-8 font-semibold">{error || t.notFound}</p>
        <a href="/login" className="px-6 py-3 rounded-2xl border">{t.goLogin}</a>
      </div>
    );
  }

  const hasAnyContent = Boolean(
    personal?.fullName ||
    portfolio?.professional_summary ||
    (experienceBlocks && experienceBlocks.length > 0) ||
    (education && education.length > 0) ||
    (dynamicItems && dynamicItems.length > 0) ||
    skills?.technical || skills?.interpersonal || skills?.workRelated ||
    (endorsements && endorsements.length > 0)
  );

  if (!hasAnyContent) {
    return (
      <div className={`min-h-screen px-3 py-8 sm:px-4 md:px-8 lg:px-12 ${effectivePublish ? themeClass : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-none text-center space-y-4">
          <h1 className="text-3xl font-extrabold">{lang === 'ar' ? 'لا توجد بيانات منشورة بعد' : 'No public data yet'}</h1>
          <p className="opacity-80">{lang === 'ar' ? 'تأكد من أنك نشرت سيرتك وضبطت بياناتك الشخصية على النشر.' : 'Make sure you published your profile and allowed public fields.'}</p>
        </div>
      </div>
    );
  }

  const visitorId = (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'visitor@example.com';

  const normUrl = (u?: string) => {
    if (!u) return '';
    return /^https?:\/\//i.test(u) ? u : `https://${u}`;
  };

  // Convert YouTube / Vimeo / Google Drive links to embeddable iFrame URLs
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    // YouTube: watch?v=ID or youtu.be/ID
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&showinfo=0`;
    // Vimeo: vimeo.com/ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    // Google Drive: /file/d/ID/
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    return null;
  };

  const openDocFromUrl = async (url: string, title?: string) => {
    const lower = url.toLowerCase();
    if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
      try {
        const base = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
        const endpoint = `${base}/api/assets/signed?ref=${encodeURIComponent(url)}&slug=${encodeURIComponent(slug || '')}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const payload = await res.json();
          const signed = payload?.url || payload?.signedUrl;
          if (signed && typeof signed === 'string') {
            const sLower = signed.toLowerCase();
            if (sLower.startsWith('data:application/pdf')) setModal({ open: true, type: 'pdf', url: signed, title });
            else if (sLower.startsWith('data:image/')) setModal({ open: true, type: 'image', url: signed, title });
            else if (sLower.endsWith('.pdf')) setModal({ open: true, type: 'pdf', url: signed, title });
            else if (sLower.match(/\.(png|jpe?g|webp|gif|bmp|svg)$/)) setModal({ open: true, type: 'image', url: signed, title });
            else setModal({ open: true, type: 'text', text: signed, title });
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (lower.endsWith('.pdf')) setModal({ open: true, type: 'pdf', url, title });
    else if (lower.match(/\.(png|jpe?g|webp|gif|bmp|svg)$/)) setModal({ open: true, type: 'image', url, title });
    else setModal({ open: true, type: 'text', text: url, title });
  };
  const openTextModal = (text: string, title?: string) => setModal({ open: true, type: 'text', text, title });

  const ProfileCard = (
    <section className="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
      <div className={`relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
        {profileResolvedUrl && (
          <img
            src={profileResolvedUrl}
            alt={personal.fullName}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-lg ring-4 ring-white/20 flex-shrink-0"
          />
        )}
        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 w-full">
            <div className={`min-w-0 flex-1 flex flex-col items-center ${lang === 'ar' ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} text-center`}>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide flex flex-wrap items-baseline justify-center md:justify-start gap-2">
                {personal.prefix && (
                  <span className="text-2xl md:text-4xl font-extrabold">{personal.prefix}</span>
                )}
                <span className="text-2xl md:text-4xl font-extrabold break-words">{personal.fullName || (lang === 'ar' ? 'الاسم الكامل' : 'Full name')}</span>
              </h1>
              <p className="text-lg md:text-xl font-semibold opacity-90 mt-1">{personal.jobTitle || (lang === 'ar' ? 'المسمى الوظيفي' : 'Job title')}</p>
            </div>
            <div className="shrink-0 flex flex-row md:flex-col items-center md:items-end gap-2 flex-wrap justify-center w-full md:w-auto">
              {(() => {
                const v = (personal as any).availability as string | undefined;
                if (!v) return null;
                const label = (() => {
                  if (v === 'freelance') return lang === 'ar' ? 'متاح للعمل الحر' : 'Available for freelance';
                  if (v === 'consulting') return lang === 'ar' ? 'متاح للعقود والاستشارات' : 'Available for contracts';
                  return lang === 'ar' ? 'متاح للعمل' : 'Open to work';
                })();
                return (
                  <span className="text-[11px] md:text-xs font-semibold rounded-full px-2.5 py-1 border border-emerald-400/20 bg-emerald-500/10">
                    {label}
                  </span>
                );
              })()}
              {(endorsements && endorsements.length > 0) && (
                <div className="px-3 py-1.5 md:py-2 rounded-xl border border-white/10 bg-white/10 shadow">
                  <div className="text-[11px] md:text-xs font-semibold flex items-center gap-1.5">
                    <Award size={13} />
                    <span>{lang === 'ar' ? 'توصية موثقة' : 'Verified endorsement'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(personal.email || personal.phone || personal.website || personal.linkedin || personal.github || (personal as any).behance) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 place-items-center md:place-items-start text-xs md:text-sm pt-4 border-t border-white/10">
              {personal.email && (
                <a className="inline-flex items-center gap-2 hover:underline break-all" href={`mailto:${personal.email}`}>
                  <Mail size={15} /> {personal.email}
                </a>
              )}
              {personal.phone && (
                <a className="inline-flex items-center gap-2 hover:underline" href={`tel:${personal.phone}`}>
                  <Phone size={15} /> {personal.phone}
                </a>
              )}
              {(personal.website || personal.linkedin || personal.github || (personal as any).behance) && (
                <div className="inline-flex items-center justify-center md:justify-start gap-3 w-full sm:col-span-2 md:col-span-1">
                  {personal.website && (
                    <a className="inline-flex items-center justify-center" href={normUrl(personal.website)} target="_blank" rel="noopener noreferrer" aria-label="Website">
                      <Globe size={18} />
                    </a>
                  )}
                  {personal.linkedin && (
                    <a className="inline-flex items-center justify-center" href={normUrl(personal.linkedin)} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <span className="inline-flex h-5 px-2 items-center rounded-[3px] font-black text-[11px] text-white bg-[#0A66C2]">in</span>
                    </a>
                  )}
                  {personal.github && (
                    <a className="inline-flex items-center justify-center" href={normUrl(personal.github)} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                      <svg aria-hidden width={18} height={18} viewBox="0 0 24 24" fill="currentColor" role="img" focusable="false"><path d="M12 0C5.37 0 0 5.46 0 12.2c0 5.4 3.44 9.97 8.2 11.59.6.12.82-.27.82-.6 0-.3-.01-1.11-.02-2.18-3.34.74-4.05-1.64-4.05-1.64-.55-1.43-1.34-1.81-1.34-1.81-1.1-.77.08-.75.08-.75 1.22.09 1.86 1.28 1.86 1.28 1.08 1.9 2.84 1.35 3.53 1.03.11-.8.42-1.35.76-1.66-2.67-.31-5.48-1.37-5.48-6.11 0-1.35.46-2.45 1.22-3.31-.12-.31-.53-1.58.12-3.28 0 0 1-.33 3.3 1.26a11 11 0 0 1 6 0c2.29-1.59 3.29-1.26 3.29-1.26.65 1.7.24 2.97.12 3.28.76.86 1.21 1.96 1.21 3.31 0 4.75-2.81 5.79-5.49 6.1.43.38.81 1.12.81 2.26 0 1.64-.01 2.96-.01 3.36 0 .33.22.73.82.6 4.76-1.62 8.2-6.19 8.2-11.59C24 5.46 18.63 0 12 0z"/></svg>
                    </a>
                  )}
                  {(personal as any).behance && (
                    <a className="inline-flex items-center justify-center" href={normUrl((personal as any).behance)} target="_blank" rel="noopener noreferrer" aria-label="Behance">
                      <span className="inline-flex h-5 px-2 items-center rounded-[3px] font-extrabold text-[11px] text-white bg-[#1769FF]">Be</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {personal.residencyStatus && (
              <span className="text-[11px] md:text-xs rounded-full px-2 py-0.5 border border-white/10 bg-white/5">{personal.residencyStatus}</span>
            )}
            {personal.nationality && (
              <span className="text-[11px] md:text-xs rounded-full px-2 py-0.5 border border-white/10 bg-white/5">{personal.nationality}</span>
            )}
            {birthDisplay && (
              <span className="text-[11px] md:text-xs inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-white/10 bg-white/5">
                <Calendar size={13} /> {birthDisplay}
              </span>
            )}
          </div>

          {/* Languages */}
          {((personal as any).languages && (personal as any).languages.length > 0) && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs font-semibold opacity-70 mb-2">{lang === 'ar' ? 'اللغات' : 'Languages'}</p>
              <div className="flex flex-wrap gap-2">
                {((personal as any).languages as Array<{language: string; proficiency: string}>).map((l, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full border border-white/15 bg-white/8">
                    {l.language}{l.proficiency ? ` — ${l.proficiency}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );

  // Video Pitch player — shown right below profile card if a video URL is configured
  const videoPitchUrl: string = (personal as any).videoPitchUrl || '';
  const embedUrl = videoPitchUrl ? getEmbedUrl(videoPitchUrl) : null;
  const VideoPitchSection = embedUrl ? (
    <section className="glass-card rounded-3xl overflow-hidden">
      <div className={`px-6 pt-5 pb-3 flex items-center gap-2 border-b border-white/10`}>
        <span className="text-lg">🎬</span>
        <h2 className="text-lg font-bold">{lang === 'ar' ? 'الفيديو التعريفي' : 'Video Introduction'}</h2>
      </div>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Pitch"
          loading="lazy"
        />
      </div>
    </section>
  ) : null;

  const SummarySection = portfolio.professional_summary ? (
    <section className="glass-card p-6 rounded-3xl">
      <h2 className={`text-2xl font-bold mb-4 ${lang==='ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>{t.summary}</h2>
      <div className="text-sm leading-relaxed opacity-90">
        <ReactMarkdown>{portfolio.professional_summary}</ReactMarkdown>
      </div>
    </section>
  ) : null;

  const ExperiencesSection = (experienceBlocks && experienceBlocks.length > 0) ? (
    <section className="glass-card p-6 rounded-3xl space-y-6">
      <h2 className={`text-2xl font-bold ${lang==='ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>{t.work}</h2>
      <div className="space-y-6">
        {experienceBlocks.map((block: any, idx: number) => (
          <div key={block.id || idx} className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <div className="space-y-1">
              <div className="grid grid-cols-2 items-center">
                <h3 className="text-lg font-bold truncate">{block.role_designation || block.title}</h3>
                <span className="text-xs font-semibold opacity-80 justify-self-end">
                  {(() => {
                    const rawS = (block as any).startDate || (block as any).date_start || '';
                    const rawE = (block as any).endDate || (block as any).date_end || '';
                    const fmt = (v: any) => {
                      if (!v) return '';
                      const s = String(v).trim();
                      // Non-numeric text (e.g. "now", "present") → capitalize and show as-is
                      if (!/^\d/.test(s)) return s.charAt(0).toUpperCase() + s.slice(1);
                      // YYYY-MM-DD or YYYY-MM → "Mon YYYY"
                      const m = s.match(/^(\d{4})[.\-\/](\d{1,2})/);
                      if (m) {
                        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        return `${months[parseInt(m[2],10)-1] || ''} ${m[1]}`;
                      }
                      return s;
                    };
                    const sF = fmt(rawS);
                    const eF = fmt(rawE);
                    return sF ? `${sF} – ${eF || t.now}` : (eF || t.now);
                  })()}
                </span>
              </div>
              {(block.institution_title || block.company) && (
                <div className="text-xs inline-flex items-center gap-2 opacity-80">
                  <Briefcase size={14} />
                  <span>
                    {block.institution_title || block.company}
                    {(block as any).location ? `, ${(block as any).location}` : ''}
                  </span>
                </div>
              )}
            </div>
            {(() => {
              const lines = String(block.description_narrative || '')
                .split(/\r?\n+/)
                .map(s => s.trim())
                .filter(Boolean);
              if (lines.length === 0) return null;
              return (
                <ul className={`text-sm leading-relaxed opacity-90 ${lang==='ar' ? 'pr-5 list-disc list-inside' : 'pl-5 list-disc list-inside'}`}>
                  {lines.map((line, i) => (<li key={i}>{line}</li>))}
                </ul>
              );
            })()}


            {(block.attached_asset_url || block.successStory || endorsementsByExpId[String(block.id)]?.endorsement_body_text) && (
              <div className="pt-2 text-sm flex flex-wrap items-center gap-2">
                {block.attached_asset_url && (
                  <button onClick={() => openDocFromUrl(block.attached_asset_url, lang==='ar'?'الوثيقة':'Document')} className="underline font-medium">
                    {lang==='ar'?'عرض الوثيقة':'View document'}
                  </button>
                )}
                {block.successStory && (
                  <>
                    {block.attached_asset_url && <span className="opacity-60">•</span>}
                    <button onClick={() => openTextModal(block.successStory, lang==='ar'?'قصة نجاح':'Success Story')} className="underline font-medium">
                      {lang==='ar'?'عرض قصة النجاح':'View success story'}
                    </button>
                  </>
                )}
                {endorsementsByExpId[String(block.id)]?.endorsement_body_text && (
                  <>
                    {(block.attached_asset_url || block.successStory) && <span className="opacity-60">•</span>}
                    <button onClick={() => openTextModal(endorsementsByExpId[String(block.id)].endorsement_body_text, lang==='ar'?'رسالة التوصية':'Recommendation')} className="underline font-medium">
                      {lang==='ar'?'عرض رسالة التوصية':'View recommendation'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Audio endorsement player */}
            {endorsementsByExpId[String(block.id)]?.audio_file_ref && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs font-semibold opacity-70 mb-2">{lang === 'ar' ? '🎙 رسالة صوتية من المُوصي' : '🎙 Voice message from endorser'}</p>
                <audio controls className="w-full max-w-xs" style={{ height: '32px' }}>
                  <source src={`/api/assets/signed?ref=${encodeURIComponent(endorsementsByExpId[String(block.id)].audio_file_ref)}&slug=${encodeURIComponent(slug || '')}`} />
                </audio>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const EducationSection = (education && education.length > 0) ? (
    <section className="glass-card p-6 rounded-3xl space-y-6">
      <h2 className={`text-2xl font-bold ${lang==='ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>{t.education}</h2>
      <div className="space-y-4">
        {education.map((item: any, idx: number) => (
          <div key={item.id || idx} className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">{item.degree}</h3>
              <span className="text-xs opacity-70">{(() => {
                const fmt = (v: any) => {
                  if (!v) return '';
                  const s = String(v);
                  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0,7);
                  return s;
                };
                const s = fmt(item.startDate);
                const e = fmt(item.endDate);
                return s ? `${s} - ${e || t.now}` : (e || t.now);
              })()}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-1">
              <p className="opacity-90">
                {item.institution}
                {(() => {
                  const displayLoc = item.location || [item.city, item.country].filter(Boolean).join(', ') || item.country;
                  return displayLoc ? <span className="opacity-70"> • {displayLoc}</span> : null;
                })()}
              </p>
              {item.attachedAssetUrl && (
                <button
                  onClick={() => openDocFromUrl(item.attachedAssetUrl, lang==='ar'?'شهادة/وثيقة':'Certificate/Document')}
                  className="underline text-xs font-medium whitespace-nowrap"
                >
                  {lang==='ar'?'عرض الوثيقة':'View document'}
                </button>
              )}
            </div>
            <p className="text-xs opacity-80 whitespace-pre-line">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

    const toList = (txt?: string): string[] => {
    if (!txt) return [];
    return txt
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const SkillsSection = (skills.technical || skills.interpersonal || skills.workRelated) ? (
    <section className="glass-card p-6 rounded-3xl">
      <h2 className={`text-2xl font-bold mb-6 ${lang==='ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>{t.skills}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {skills.technical && (
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <h3 className="font-bold mb-2">{t.tech}</h3>
            {toList(skills.technical).length > 0 ? (
              <ul className={`text-sm space-y-1 ${lang==='ar' ? 'pr-5 list-disc list-inside' : 'pl-5 list-disc list-inside'}`}>
                {toList(skills.technical).map((it, i) => (<li key={i}>{it}</li>))}
              </ul>
            ) : (
              <p className="text-sm whitespace-pre-line">{skills.technical}</p>
            )}
          </div>
        )}
        {skills.interpersonal && (
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <h3 className="font-bold mb-2">{t.inter}</h3>
            {toList(skills.interpersonal).length > 0 ? (
              <ul className={`text-sm space-y-1 ${lang==='ar' ? 'pr-5 list-disc list-inside' : 'pl-5 list-disc list-inside'}`}>
                {toList(skills.interpersonal).map((it, i) => (<li key={i}>{it}</li>))}
              </ul>
            ) : (
              <p className="text-sm whitespace-pre-line">{skills.interpersonal}</p>
            )}
          </div>
        )}
        {skills.workRelated && (
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <h3 className="font-bold mb-2">{t.workRel}</h3>
            {toList(skills.workRelated).length > 0 ? (
              <ul className={`text-sm space-y-1 ${lang==='ar' ? 'pr-5 list-disc list-inside' : 'pl-5 list-disc list-inside'}`}>
                {toList(skills.workRelated).map((it, i) => (<li key={i}>{it}</li>))}
              </ul>
            ) : (
              <p className="text-sm whitespace-pre-line">{skills.workRelated}</p>
            )}
          </div>
        )}
      </div>
    </section>
  ) : null;

  const AdditionalSection = (dynamicItems && dynamicItems.length > 0) ? (
    <section className="glass-card p-6 rounded-3xl space-y-4">
      <h2 className={`text-2xl font-bold ${lang==='ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>
        {lang==='ar' ? 'مشاريع وجوائز وأنشطة' : 'Projects, Awards & Activities'}
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {dynamicItems.map((it: any, idx: number) => (
          <div key={it.id || idx} className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{it.title || (lang==='ar'?'بدون عنوان':'Untitled')}</h3>
              <span className="text-[11px] opacity-75 rounded-full px-2 py-0.5 border border-white/10">
                {(() => {
                  const v = String(it.type || '').toLowerCase();
                  if (lang==='ar') {
                    if (v==='award') return 'جائزة';
                    if (v==='volunteer') return 'تطوع';
                    return 'مشروع';
                  }
                  if (v==='award') return 'Award';
                  if (v==='volunteer') return 'Volunteer';
                  return 'Project';
                })()}
              </span>
            </div>
            {it.description && (
              <p className="text-sm opacity-90 whitespace-pre-line">{it.description}</p>
            )}
            {it.link && (
              <a className="text-sm underline" href={normUrl(it.link)} target="_blank" rel="noopener noreferrer">
                {lang==='ar'?'فتح الرابط':'Open link'}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const EndorsementsSection = (endorsements && endorsements.length > 0) ? (
    <section className="glass-card p-6 rounded-3xl space-y-6">
      <h2 className={`text-2xl font-bold ${lang==='ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'}`}>{lang === 'ar' ? 'التوصيات والاعتمادات الخارجية المصدقة' : 'Verified Recommendations'}</h2>
      <div className="space-y-4">
        {endorsements.map((end: any, idx: number) => {
          if (!end.endorser_name) return null;
          return (
            <div key={end.id || idx} className="p-5 rounded-2xl border space-y-3 relative overflow-hidden border-white/10 bg-white/5">
              <div className={`absolute ${lang === 'ar' ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl'} px-3 py-1 text-[10px] font-bold uppercase bg-white/10`}>
                {t.verified}
              </div>
              <div className="flex justify-between items-start pt-2">
                <div>
                  <h4 className="font-bold">{end.endorser_name}</h4>
                  <p className="text-xs opacity-80">{end.endorser_title_role}</p>
                  {end.endorser_email && (
                    <a href={`mailto:${end.endorser_email}`} className="text-[11px] opacity-70 underline">{end.endorser_email}</a>
                  )}
                </div>
                <span className="text-[10px] opacity-70">{new Date(end.updated_at || end.created_at).toLocaleDateString()}</span>
              </div>
              <button onClick={() => openTextModal(end.endorsement_body_text, lang==='ar'?'رسالة التوصية':'Recommendation')} className="underline text-sm">
                {lang==='ar'?'عرض رسالة التوصية':'View recommendation'}
              </button>

              {end.signature_vector_stream && (
                (() => {
                  const sig = String(end.signature_vector_stream || '');
                  const looksLikeName = /\s/.test(sig) && !/^sig|secure|vector|hash|signed_/i.test(sig) && sig.length <= 100;
                  if (looksLikeName) {
                    return (
                      <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                        <span className="text-xs opacity-70">{lang === 'ar' ? 'مُوقَّعة من' : 'Signed by'}</span>
                        <span className="text-xs font-semibold">{sig}</span>
                      </div>
                    );
                  }
                  return (
                    <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                      <span className="text-xs opacity-70">{lang === 'ar' ? 'التوقيع الرقمي المشفر' : 'Encrypted e-signature'}</span>
                      <div className="h-10 w-32 border border-white/10 rounded p-1 flex items-center justify-center overflow-hidden bg-white/5">
                        <span className="text-[9px] font-mono tracking-widest block truncate max-w-full">
                          SIGNED_{end.token_auth_string?.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  if (effectiveTemplate === 'professional') {
    const tabs: { key: string; label: string; node: JSX.Element | null }[] = [
      { key: 'summary', label: t.summary, node: SummarySection },
      { key: 'work', label: t.work, node: ExperiencesSection },
      { key: 'education', label: t.education, node: EducationSection },
      { key: 'skills', label: t.skills, node: SkillsSection },
      { key: 'additional', label: lang==='ar'?'إضافات':'Additional', node: AdditionalSection },
      { key: 'endorse', label: lang==='ar'?'التوصيات':'Endorsements', node: EndorsementsSection },
    ];
    const activeKey = tabs.some(t => t.key === activeTab) ? activeTab : tabs[0].key;
    const activeNode = tabs.find(t => t.key === activeKey)?.node || null;

    return (
      <div className={`min-h-screen px-3 py-6 sm:px-4 md:px-8 lg:px-12 ${themeClass}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-none space-y-6">
          {/* Persistent professional header with profile & contacts */}
          {ProfileCard}
          {VideoPitchSection}

          {/* Tabs bar */}
          <div className="glass-inner-card rounded-2xl px-2 py-2 flex flex-wrap items-center gap-2">
            {tabs.map(ti => (
              <button key={ti.key} onClick={() => setActiveTab(ti.key)} className={`px-4 py-2 rounded-full text-sm ${activeKey===ti.key ? 'button-primary' : 'button-secondary'}`}>
                {ti.label}
              </button>
            ))}
          </div>

          {/* Active section only */}
          <main className="space-y-6">
            {activeNode}
          </main>
        </div>
        <DocumentModal open={modal.open} type={modal.type} url={modal.url} title={modal.title} text={modal.text} onClose={() => setModal({ open: false })} watermark={`${visitorId} • ${new Date().toLocaleString('en-GB')}`} lang={lang} />
      </div>
    );
  }



  return (
    <div className={`min-h-screen px-3 py-10 sm:px-4 md:px-8 lg:px-12 font-sans select-none ${themeClass}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-none space-y-8">
        {ProfileCard}
        {VideoPitchSection}
        {SummarySection}
        {ExperiencesSection}
        {EducationSection}
        {SkillsSection}
        {AdditionalSection}
        {EndorsementsSection}
      </div>
      <DocumentModal open={modal.open} type={modal.type} url={modal.url} title={modal.title} text={modal.text} onClose={() => setModal({ open: false })} watermark={`${visitorId} • ${new Date().toLocaleString('en-GB')}`} lang={lang} />
    </div>
  );
}
