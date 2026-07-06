import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Mail, Phone, MapPin, Globe, Award, Briefcase, ExternalLink } from 'lucide-react';
import type { PublishSettings } from '../types';

export default function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string>('');

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
        } catch {
          // Non-JSON or empty response
        }
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

    if (slug) {
      fetchPublicData();
    }
  }, [slug]);





















  // Derived data and hooks moved above conditional returns to preserve hook order
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

  useEffect(() => {
    const ref = personal?.profileImageUrl as string | undefined;
    if (!ref) {
      setProfilePreviewUrl('');
      return;
    }
    if (ref.startsWith('private:')) {
      fetch(`/api/assets/signed?ref=${encodeURIComponent(ref)}`)
        .then((r) => r.json())
        .then((p) => {
          if (p && p.success && p.url) setProfilePreviewUrl(p.url);
          else setProfilePreviewUrl('');
        })
        .catch(() => setProfilePreviewUrl(''));
    } else {
      setProfilePreviewUrl(ref);
    }
  }, [personal?.profileImageUrl]);

  useEffect(() => {
    const styleId = `theme-${themeClass}`;
    const existing = document.getElementById(styleId);
    if (!publish) {
      if (existing) existing.remove();
      return;
    }

    let background: string | undefined;
    if (publish.backgroundType === 'solid') background = publish.colors.background;
    else if (publish.backgroundType === 'gradient' && publish.gradient) background = `linear-gradient(${publish.gradient.angle}deg, ${publish.gradient.from}, ${publish.gradient.to})`;
    else if (publish.backgroundType === 'image' && publish.backgroundImage) background = `url('${publish.backgroundImage}') center/cover no-repeat`;

    const fontMap: Record<string, string> = {
      'Tajawal': '"Tajawal", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans"',
      'Dubai': '"Dubai", "Segoe UI", Tahoma, Arial, sans-serif',
      'Times New Roman': '"Times New Roman", Times, serif',
      'Arial': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
      'Tahoma': 'Tahoma, Geneva, Verdana, sans-serif',
      'Sans Serif': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'Calibri': 'Calibri, "Segoe UI", Arial, sans-serif'
    };

    const css = `.${themeClass}{ color: ${publish.colors.text}; ${background ? `background: ${background};` : ''} font-family: ${fontMap[publish.font] || 'system-ui, sans-serif'}; }`;

    if (existing) existing.remove();
    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = css;
    document.head.appendChild(el);

    return () => {
      const toRemove = document.getElementById(styleId);
      if (toRemove) toRemove.remove();
    };
  }, [publish, themeClass]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <p className="text-xl animate-pulse">Loading portfolio...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300 px-4 text-center">
        <h1 className="text-6xl font-extrabold text-red-500 mb-4">404</h1>
        <p className="text-2xl mb-8 font-semibold">{error || 'Page not found'}</p>
        <a href="/login" className="button-primary px-6 py-3 rounded-2xl">
          Go to Login
        </a>
      </div>
    );
  }


  // Show friendly message if nothing meaningful to show
  const hasAnyContent = Boolean(
    personal?.fullName ||
    portfolio?.professional_summary ||
    (experienceBlocks && experienceBlocks.length > 0) ||
    (education && education.length > 0) ||
    skills?.technical || skills?.interpersonal || skills?.workRelated ||
    (endorsements && endorsements.length > 0)
  );

  if (!hasAnyContent) {
    return (
      <div className={`min-h-screen px-4 py-12 md:px-12 lg:px-24 ${publish ? themeClass : 'bg-slate-950 text-slate-100'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <h1 className="text-3xl font-extrabold">{lang === 'ar' ? 'لا توجد بيانات منشورة بعد' : 'No public data yet'}</h1>
          <p className="text-slate-300">{lang === 'ar' ? 'تأكد من أنك نشرت سيرتك وضبطت بياناتك الشخصية على النشر.' : 'Make sure you published your profile and allowed public fields.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-12 md:px-12 lg:px-24 font-sans select-none ${publish ? themeClass : 'bg-slate-950 text-slate-100'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Profile Card */}
        <section className="glass-card p-8 border border-white/10 bg-slate-900/40 relative overflow-hidden rounded-[2.5rem] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.15),_transparent_35%)]" />
          {(endorsements && endorsements.length > 0) && (
            <div className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} -bottom-4 z-10 backdrop-blur-md`}>
              {/* Floating badge/card */}
              <div className="px-4 py-3 rounded-2xl border border-white/20 bg-white/15 shadow-glass">
                <div className="text-xs font-semibold text-sky-200 flex items-center gap-2">
                  <Award size={14} />
                  <span>{lang === 'ar' ? 'توصية موثقة' : 'Verified endorsement'}</span>
                </div>
              </div>
            </div>
          )}
          <div className={`relative z-10 flex flex-col items-center text-center md:${lang === 'ar' ? 'text-right' : 'text-left'} md:flex-row md:items-start gap-8`}>
            {profilePreviewUrl && (
              <img
                src={profilePreviewUrl}
                alt={personal.fullName}
                className="w-32 h-32 rounded-full border-4 border-sky-400/30 object-cover shadow-lg"
              />
            )}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-4xl font-extrabold text-white tracking-wide">{personal.fullName || (lang === 'ar' ? 'الاسم الكامل' : 'Full name')}</h1>
                  <p className="text-xl text-sky-400 font-semibold">{personal.jobTitle || (lang === 'ar' ? 'المسمى الوظيفي' : 'Job title')}</p>
                </div>
                {(() => {
                  const v = (personal as any).availability as string | undefined;
                  if (!v) return null;
                  const label = (() => {
                    if (v === 'freelance') return lang === 'ar' ? 'متاح للعمل الحر فريلانس' : 'Available for freelance';
                    if (v === 'consulting') return lang === 'ar' ? 'متاح للعقود والاستشارات' : 'Available for contracts & consulting';
                    return lang === 'ar' ? 'متاح للعمل' : 'Open to work';
                  })();
                  return (
                    <span className="text-xs font-semibold rounded-full px-3 py-1 border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                      {label}
                    </span>
                  );
                })()}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300 pt-4 border-t border-white/5">
                {personal.email && (
                  <a className="inline-flex items-center gap-2 hover:underline" href={`mailto:${personal.email}`}>
                    <Mail size={16} /> {personal.email}
                  </a>
                )}
                {personal.phone && (
                  <a className="inline-flex items-center gap-2 hover:underline" href={`tel:${personal.phone}`}>
                    <Phone size={16} /> {personal.phone}
                  </a>
                )}
                {personal.location && (
                  <p className="inline-flex items-center gap-2">
                    <MapPin size={16} /> {personal.location}
                  </p>
                )}
                {personal.website && (
                  <a className="inline-flex items-center gap-2 hover:underline text-sky-300" href={personal.website} target="_blank" rel="noopener noreferrer">
                    <Globe size={16} /> {personal.website}
                  </a>
                )}
                {personal.linkedin && (
                  <a className="inline-flex items-center gap-2 hover:underline text-sky-300" href={personal.linkedin} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} /> LinkedIn
                  </a>
                )}
                {personal.github && (
                  <a className="inline-flex items-center gap-2 hover:underline text-sky-300" href={personal.github} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} /> GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        {portfolio.professional_summary && (
          <section className="glass-card p-6 border border-white/10 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-r-4 border-sky-400 pr-3">{t.summary}</h2>
            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
              <ReactMarkdown>{portfolio.professional_summary}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Experiences */}
        {experienceBlocks && experienceBlocks.length > 0 && (
          <section className="glass-card p-6 border border-white/10 rounded-3xl space-y-6">
            <h2 className="text-2xl font-bold text-white border-r-4 border-sky-400 pr-3">{t.work}</h2>
            <div className="space-y-6">
              {experienceBlocks.map((block: any, idx: number) => (
                <div key={block.id || idx} className="p-5 rounded-2xl border border-white/5 bg-slate-900/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">{block.role_designation}</h3>
                    <span className="text-xs text-sky-400 font-semibold bg-sky-500/10 px-3 py-1 rounded-full inline-flex items-center gap-2">
                      <Briefcase size={14} /> {block.institution_title} ({block.date_start ? block.date_start.slice(0, 7) : ''} - {block.date_end ? block.date_end.slice(0, 7) : t.now})
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{block.description_narrative}</p>
                  
                  {block.attached_asset_url && (
                    <div className="pt-2 text-[11px] text-slate-400">
                      📂 Internal verification document stored (not publicly accessible)
                    </div>
                  )}

                  {block.successStory && (
                    <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <p className="text-xs font-bold text-emerald-400">⭐ Success Story:</p>
                      <p className="text-slate-300 text-sm mt-1">{block.successStory}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="glass-card p-6 border border-white/10 rounded-3xl space-y-6">
            <h2 className="text-2xl font-bold text-white border-r-4 border-sky-400 pr-3">{t.education}</h2>
            <div className="space-y-4">
              {education.map((item: any, idx: number) => (
                <div key={item.id || idx} className="p-4 rounded-2xl border border-white/5 bg-slate-900/20">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">{item.degree}</h3>
                    <span className="text-xs text-slate-400">{item.startDate} - {item.endDate}</span>
                  </div>
                  <p className="text-sm text-sky-400 mb-1">{item.institution}{(() => { const displayLoc = (item as any).location || [(item as any).city, (item as any).country].filter(Boolean).join(', ') || (item as any).country; return displayLoc ? <span className="opacity-70"> • {displayLoc}</span> : null; })()}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(skills.technical || skills.interpersonal || skills.workRelated) && (
          <section className="glass-card p-6 border border-white/10 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-r-4 border-sky-400 pr-3">{t.skills}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {skills.technical && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="font-bold text-sky-400 mb-2">{t.tech}</h3>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{skills.technical}</p>
                </div>
              )}
              {skills.interpersonal && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="font-bold text-sky-400 mb-2">{t.inter}</h3>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{skills.interpersonal}</p>
                </div>
              )}
              {skills.workRelated && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="font-bold text-sky-400 mb-2">{t.workRel}</h3>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{skills.workRelated}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Endorsements/Recommendations */}
        {endorsements && endorsements.length > 0 && (
          <section className="glass-card p-6 border border-white/10 rounded-3xl space-y-6">
            <h2 className="text-2xl font-bold text-white border-r-4 border-sky-400 pr-3">{lang === 'ar' ? 'التوصيات والاعتمادات الخارجية المصدقة' : 'Verified Recommendations'}</h2>
            <div className="space-y-4">
              {endorsements.map((end: any, idx: number) => {
                if (!end.endorser_name) return null;
                return (
                  <div key={end.id || idx} className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-3 relative overflow-hidden">
                    <div className={`absolute ${lang === 'ar' ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl'} bg-sky-500/20 px-3 py-1 text-[10px] text-sky-300 font-bold uppercase`}>
                      {t.verified}
                    </div>
                    <div className="flex justify-between items-start pt-2">
                      <div>
                        <h4 className="font-bold text-white">{end.endorser_name}</h4>
                        <p className="text-xs text-sky-400">{end.endorser_title_role}</p>
                        {end.endorser_email && (
                          <a href={`mailto:${end.endorser_email}`} className="text-[11px] text-slate-300 underline">{end.endorser_email}</a>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(end.updated_at || end.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed italic">"{end.endorsement_body_text}"</p>
                    
                    {end.signature_vector_stream && (
                      (() => {
                        const sig = String(end.signature_vector_stream || '');
                        const looksLikeName = /\s/.test(sig) && !/^sig|secure|vector|hash|signed_/i.test(sig) && sig.length <= 100;
                        if (looksLikeName) {
                          return (
                            <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                              <span className="text-xs text-slate-400">{lang === 'ar' ? 'مُوقَّعة من' : 'Signed by'}</span>
                              <span className="text-xs font-semibold text-slate-200">{sig}</span>
                            </div>
                          );
                        }
                        return (
                          <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-400">{lang === 'ar' ? 'التوقيع الرقمي المشفر' : 'Encrypted e-signature'}</span>
                            <div className="h-10 w-32 border border-sky-400/20 rounded bg-slate-950/60 p-1 flex items-center justify-center overflow-hidden">
                              <span className="text-[9px] text-sky-400 font-mono tracking-widest block truncate max-w-full">
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
        )}
      </div>
    </div>
  );
}
