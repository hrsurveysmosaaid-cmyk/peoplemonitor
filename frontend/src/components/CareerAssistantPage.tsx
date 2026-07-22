import React, { useState } from 'react';
import { Bot, Upload, Link as LinkIcon, Sparkles, CheckCircle2, AlertCircle, RefreshCw, FileCheck, ArrowRight } from 'lucide-react';
import { useUi } from '../ui/UiContext';

const LinkedinIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <span className={`inline-flex items-center justify-center font-black rounded-sm bg-[#0A66C2] text-white text-[10px] px-1 ${className}`} style={{ width: size, height: size }}>
    in
  </span>
);

type ToolType = 'ats' | 'linkedin';

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  missingKeywords?: string[];
}

export default function CareerAssistantPage() {
  const { lang, theme } = useUi();
  const isDark = theme === 'dark';

  const [activeTool, setActiveTool] = useState<ToolType>('ats');

  // ATS State
  const [atsFile, setAtsFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [atsAnalyzing, setAtsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState<AnalysisResult | null>(null);

  // LinkedIn State
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [linkedinAnalyzing, setLinkedinAnalyzing] = useState(false);
  const [linkedinResult, setLinkedinResult] = useState<AnalysisResult | null>(null);

  // ATS Analysis Handler
  const handleAtsAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atsFile && !jobDescription.trim()) return;

    setAtsAnalyzing(true);
    setAtsResult(null);

    // Simulated AI analysis response with rich report
    setTimeout(() => {
      setAtsResult({
        score: 84,
        summary: lang === 'ar' 
          ? 'تظهر السيرة الذاتية توافقاً جيداً جداً مع متطلبات الوظيفة الشاغرة. تبرز نقاط القوة في المهارات التقنية، وتتطلب صياغة النتائج في بعض الخبرات مزيداً من التحديد الرقمي.'
          : 'Your resume shows a strong alignment with the target job description. Key technical skills match well, while metric-driven outcomes in experience sections could be strengthened.',
        strengths: lang === 'ar' ? [
          'استخدام مصطلحات تقنية دقيقة متوافقة مع أنظمة ATS.',
          'وضوح الهيكلية والتسلسل الزمني للخبرات.',
          'تضمين المهارات البرمجية الأساسية المطلوبة في الوصف الوظيفي.'
        ] : [
          'High relevance of core technical terms matched with ATS parsing engine.',
          'Clean structural layout and clear chronological progression.',
          'Included primary framework and language requirements mentioned in JD.'
        ],
        improvements: lang === 'ar' ? [
          'إضافة أرقام ونتائج قياسية (مثال: زيادة الإنتاجية بنسبة 25%).',
          'تعزيز الكلمات المفتاحية الناقصة في قسم الملخص المهني.',
          'استبدال بعض الجمل العامة بأفعال حركة أكثر قوة (Action Verbs).'
        ] : [
          'Quantify accomplishments with metrics and percentages (e.g., boosted efficiency by 25%).',
          'Integrate missing key phrases into the Professional Summary.',
          'Replace passive phrases with strong action-oriented verbs.'
        ],
        missingKeywords: ['CI/CD Pipelines', 'Agile/Scrum Leadership', 'System Architecture', 'Unit Testing Coverage'],
        recommendations: lang === 'ar' ? [
          'قم بإضافة مصطلح "CI/CD Pipelines" في قسم الخبرات العملية.',
          'اعد صياغة الملخص المهني ليركز على حلول البرمجيات السحابية.',
          'تأكد من مطابقة مسمى الوظيفة الحالي للمسمى المطلوب في الشاغر.'
        ] : [
          'Add "CI/CD Pipelines" explicitly under your main software developer experience block.',
          'Tailor the summary section towards Cloud-native Architecture.',
          'Ensure target Job Title aligns closely with the job description title.'
        ]
      });
      setAtsAnalyzing(false);
    }, 2500);
  };

  // LinkedIn Analysis Handler
  const handleLinkedinAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.trim() && !linkedinFile) return;

    setLinkedinAnalyzing(true);
    setLinkedinResult(null);

    setTimeout(() => {
      setLinkedinResult({
        score: 78,
        summary: lang === 'ar'
          ? 'بروفايل لينكد إن ممتاز ويحتوي على عناصر أساسية قوية. نقترح تحسين العنوان الرئيسي (Headline) وقسم "عنّي" (About) لجذب مسؤولي التوظيف بشكل أكفأ.'
          : 'Your LinkedIn profile carries solid foundation elements. Enhancing your Headline and About section will significantly increase recruiter outreach.',
        strengths: lang === 'ar' ? [
          'وجود صورة شخصية وصورة غلاف احترافيتين.',
          'توثيق الخبرات السابقة مع المسميات الوظيفية بشكل دقيق.',
          'تنوع قسم المهارات والتوصيات.'
        ] : [
          'Professional headshot and clean banner presentation.',
          'Detailed role descriptions and accurate title history.',
          'Well-populated skills matrix and endorsements.'
        ],
        improvements: lang === 'ar' ? [
          'تحديث العنوان الرئيسي ليحتوي القيمة المضافة وليس فقط المسمى الوظيفي.',
          'كتابة قسم "عنّي" بصيغة السرد القصصي المهني (Storytelling).',
          'زيادة التفاعل اليومي ونشر المحتوى في مجال تخصصك.'
        ] : [
          'Transform Headline from a basic job title to a value-proposition statement.',
          'Craft a compelling, first-person narrative in the About section.',
          'Boost visibility through consistent industry posts and engagement.'
        ],
        recommendations: lang === 'ar' ? [
          'غيّر العنوان الرئيسي إلى: "Senior Software Engineer | Building Scalable SaaS Solutions".',
          'أضف خيار "Open to Work" الموجه لمسؤولي التوظيف فقط (Recruiters Only).',
          'اطلب توصيتين مهنيتين إضافيتين من مدراء سابقين عبر المنصة.'
        ] : [
          'Update Headline to: "Senior Software Engineer | Building Scalable SaaS Solutions".',
          'Enable "Open to Work" visible exclusively to recruiters.',
          'Request 2 additional verified recommendations via PeopleOS.'
        ]
      });
      setLinkedinAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-purple-950/20 border-sky-500/20' : 'bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-sky-200'}`}>
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <div className={`p-3.5 rounded-2xl flex-shrink-0 ${isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'}`}>
            <Bot size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold">{lang === 'ar' ? 'المساعد المهني الذكي (Career Assistant)' : 'AI Career Assistant'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-sky-500 to-indigo-500 text-white uppercase tracking-wider">AI Powered</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'مساعدك الذكي الشخصي لتحليل توافق السيرة الذاتية مع الوظائف وتطوير بروفايل لينكد إن بأحدث تقنيات الـ AI.'
                : 'Your personal AI consultant for ATS job matching analysis and LinkedIn profile optimization.'}
            </p>
          </div>
        </div>

        {/* Tool Selection Tabs */}
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-500/15">
          <button
            onClick={() => setActiveTool('ats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'ats'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.02]'
                : isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileCheck size={16} />
            <span>{lang === 'ar' ? 'فحص مطابقة ATS' : 'ATS Resume Matcher'}</span>
          </button>

          <button
            onClick={() => setActiveTool('linkedin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'linkedin'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.02]'
                : isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <LinkedinIcon size={16} />
            <span>{lang === 'ar' ? 'تحليل بروفايل LinkedIn' : 'LinkedIn Optimizer'}</span>
          </button>
        </div>
      </div>

      {/* ── TOOL 1: ATS RESUME MATCHER ── */}
      {activeTool === 'ats' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Input Panel */}
          <div className={`lg:col-span-6 glass-card p-6 rounded-3xl border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-500/15">
              <Sparkles size={18} className="text-sky-500" />
              <h2 className="text-sm font-black">{lang === 'ar' ? 'بيانات الفحص والمطابقة' : 'Input Analysis Data'}</h2>
            </div>

            <form onSubmit={handleAtsAnalysis} className="space-y-4">
              {/* PDF Resume Upload */}
              <div>
                <label className="block text-xs font-bold mb-2">
                  {lang === 'ar' ? '1. ارفع سيرتك الذاتية (PDF)' : '1. Upload Resume (PDF)'}
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  atsFile 
                    ? isDark ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-emerald-400 bg-emerald-50'
                    : isDark ? 'border-white/15 hover:border-sky-500/50 bg-white/5' : 'border-slate-300 hover:border-sky-400 bg-slate-50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setAtsFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    {atsFile ? (
                      <>
                        <CheckCircle2 size={24} className="text-emerald-500" />
                        <span className="text-xs font-bold truncate max-w-full text-emerald-500">{atsFile.name}</span>
                        <span className="text-[10px] text-slate-400">{(atsFile.size / 1024).toFixed(1)} KB</span>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="text-sky-500" />
                        <span className="text-xs font-bold">{lang === 'ar' ? 'اضغط أو اسحب ملف الـ PDF هنا' : 'Click or drop your PDF resume here'}</span>
                        <span className="text-[10px] text-slate-500">{lang === 'ar' ? 'أقصى حجم: 10 ميجابايت' : 'Max file size: 10MB'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description Textarea */}
              <div>
                <label className="block text-xs font-bold mb-2">
                  {lang === 'ar' ? '2. ضع الوصف الوظيفي المستهدف (Job Description)' : '2. Target Job Description'}
                </label>
                <textarea
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={lang === 'ar' ? 'انسخ وانصق نص التوصيف الوظيفي للوظيفة التي ترغب بالتقديم عليها هنا...' : 'Paste the job requirements and description here...'}
                  className={`w-full p-3.5 rounded-2xl text-xs border outline-none transition-all resize-none ${
                    isDark ? 'bg-slate-950/60 border-white/10 focus:border-sky-500 text-slate-100' : 'bg-white border-slate-200 focus:border-sky-500 text-slate-900'
                  }`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={atsAnalyzing || (!atsFile && !jobDescription.trim())}
                className="w-full py-3 px-4 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {atsAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{lang === 'ar' ? 'جاري التحليل البرمجي عبر الـ AI...' : 'Analyzing with AI engine...'}</span>
                  </>
                ) : (
                  <>
                    <Bot size={16} />
                    <span>{lang === 'ar' ? 'بدء تحليل التوافق ومطابقة ATS' : 'Run ATS Match Analysis'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Report Panel */}
          <div className="lg:col-span-6">
            {!atsResult && !atsAnalyzing && (
              <div className={`p-10 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center min-h-[380px] ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                <Bot size={48} className="text-sky-500/40 mb-3" />
                <h3 className="text-sm font-bold text-slate-300">{lang === 'ar' ? 'التقرير ينتظر مدخلاتك' : 'Report awaiting inputs'}</h3>
                <p className="text-xs max-w-xs mt-1 leading-relaxed">
                  {lang === 'ar' ? 'ارفع سيرتك الذاتية وضع الوصف الوظيفي ثم اضغط بدء التحليل لاستخراج النسبة والتوصيات' : 'Upload your resume PDF and paste JD to receive deep AI matching insights.'}
                </p>
              </div>
            )}

            {atsAnalyzing && (
              <div className={`p-12 rounded-3xl border text-center flex flex-col items-center justify-center min-h-[380px] ${isDark ? 'border-white/10 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
                <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" />
                <h3 className="text-sm font-bold">{lang === 'ar' ? 'جاري فحص السيرة الذاتية وقراءة البيانات...' : 'Parsing PDF & Analyzing Job Description...'}</h3>
                <p className="text-xs opacity-60 mt-1">{lang === 'ar' ? 'نقوم الآن بمطابقة الكلمات المفتاحية والهيكلية البرمجية' : 'Extracting keywords and comparing skill vectors'}</p>
              </div>
            )}

            {atsResult && !atsAnalyzing && (
              <div className={`space-y-4 glass-card p-6 rounded-3xl border ${isDark ? 'border-sky-500/20' : 'border-sky-200'}`}>
                {/* Score Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-500/15">
                  <div>
                    <span className="text-[10px] uppercase font-black text-sky-500 tracking-wider">{lang === 'ar' ? 'نتيجة المطابقة' : 'Match Score'}</span>
                    <h3 className="text-lg font-extrabold">{lang === 'ar' ? 'تقرير التوافق الوظيفي' : 'ATS Compatibility Report'}</h3>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border ${
                    atsResult.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    <span className="text-xl font-black">{atsResult.score}%</span>
                    <span className="text-[8px] uppercase font-bold opacity-80">ATS Score</span>
                  </div>
                </div>

                {/* AI Summary */}
                <p className="text-xs leading-relaxed text-slate-300 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                  {atsResult.summary}
                </p>

                {/* Missing Keywords */}
                {atsResult.missingKeywords && atsResult.missingKeywords.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                      <AlertCircle size={14} />
                      {lang === 'ar' ? 'كلمات مفتاحية مفقودة (Missing Keywords)' : 'Missing Keywords'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {atsResult.missingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Recommendations */}
                <div>
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-2">
                    <Sparkles size={14} />
                    {lang === 'ar' ? 'التوصيات والتعديلات الواجب إجراؤها' : 'Actionable Recommendations'}
                  </h4>
                  <ul className="space-y-2">
                    {atsResult.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2 text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                        <ArrowRight size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOOL 2: LINKEDIN OPTIMIZER ── */}
      {activeTool === 'linkedin' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Input Panel */}
          <div className={`lg:col-span-6 glass-card p-6 rounded-3xl border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-500/15">
              <LinkedinIcon size={18} className="text-sky-500" />
              <h2 className="text-sm font-black">{lang === 'ar' ? 'بيانات حساب LinkedIn' : 'LinkedIn Profile Data'}</h2>
            </div>

            <form onSubmit={handleLinkedinAnalysis} className="space-y-4">
              {/* Profile Link Input */}
              <div>
                <label className="block text-xs font-bold mb-2">
                  {lang === 'ar' ? '1. ضع رابط بروفايل LinkedIn' : '1. LinkedIn Profile URL'}
                </label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    className={`w-full pl-10 pr-3.5 py-3 rounded-2xl text-xs border outline-none transition-all ${
                      isDark ? 'bg-slate-950/60 border-white/10 focus:border-sky-500 text-slate-100' : 'bg-white border-slate-200 focus:border-sky-500 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-500/20" />
                <span className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'ar' ? 'أو' : 'OR'}</span>
                <div className="flex-1 h-px bg-slate-500/20" />
              </div>

              {/* Profile PDF Upload */}
              <div>
                <label className="block text-xs font-bold mb-2">
                  {lang === 'ar' ? '2. ارفع ملف بروفايل LinkedIn (Save to PDF)' : '2. Upload Profile PDF'}
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  linkedinFile 
                    ? isDark ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-emerald-400 bg-emerald-50'
                    : isDark ? 'border-white/15 hover:border-sky-500/50 bg-white/5' : 'border-slate-300 hover:border-sky-400 bg-slate-50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setLinkedinFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    {linkedinFile ? (
                      <>
                        <CheckCircle2 size={24} className="text-emerald-500" />
                        <span className="text-xs font-bold truncate max-w-full text-emerald-500">{linkedinFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="text-sky-500" />
                        <span className="text-xs font-bold">{lang === 'ar' ? 'ارفع ملف PDF المنزّل من LinkedIn' : 'Upload LinkedIn profile PDF export'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={linkedinAnalyzing || (!linkedinUrl.trim() && !linkedinFile)}
                className="w-full py-3 px-4 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {linkedinAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{lang === 'ar' ? 'جاري فحص البروفايل عبر الـ AI...' : 'Analyzing LinkedIn profile...'}</span>
                  </>
                ) : (
                  <>
                    <LinkedinIcon size={16} />
                    <span>{lang === 'ar' ? 'تحليل بروفايل LinkedIn' : 'Run LinkedIn Analysis'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Report Panel */}
          <div className="lg:col-span-6">
            {!linkedinResult && !linkedinAnalyzing && (
              <div className={`p-10 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center min-h-[380px] ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                <LinkedinIcon size={48} className="text-sky-500/40 mb-3" />
                <h3 className="text-sm font-bold text-slate-300">{lang === 'ar' ? 'تقرير LinkedIn ينتظر بياناتك' : 'LinkedIn Analysis Pending'}</h3>
                <p className="text-xs max-w-xs mt-1 leading-relaxed">
                  {lang === 'ar' ? 'ضع رابط حسابك أو ارفع ملف الـ PDF لتحصل على توصيات تحسين ظهور حسابك أمام الشركات' : 'Enter your profile URL or PDF to evaluate headline, summary, and recruiter reach.'}
                </p>
              </div>
            )}

            {linkedinAnalyzing && (
              <div className={`p-12 rounded-3xl border text-center flex flex-col items-center justify-center min-h-[380px] ${isDark ? 'border-white/10 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
                <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" />
                <h3 className="text-sm font-bold">{lang === 'ar' ? 'جاري فحص العناصر وروافع الظهور...' : 'Analyzing Profile Assets & Visibility...'}</h3>
              </div>
            )}

            {linkedinResult && !linkedinAnalyzing && (
              <div className={`space-y-4 glass-card p-6 rounded-3xl border ${isDark ? 'border-sky-500/20' : 'border-sky-200'}`}>
                {/* Score Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-500/15">
                  <div>
                    <span className="text-[10px] uppercase font-black text-sky-500 tracking-wider">{lang === 'ar' ? 'جودة الحساب' : 'Profile Strength'}</span>
                    <h3 className="text-lg font-extrabold">{lang === 'ar' ? 'تقرير تحسين بروفايل LinkedIn' : 'LinkedIn Optimization Report'}</h3>
                  </div>
                  <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center border bg-sky-500/10 border-sky-500/30 text-sky-400">
                    <span className="text-xl font-black">{linkedinResult.score}%</span>
                    <span className="text-[8px] uppercase font-bold opacity-80">Strength</span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs leading-relaxed text-slate-300 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                  {linkedinResult.summary}
                </p>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-2">
                    <Sparkles size={14} />
                    {lang === 'ar' ? 'التعديلات المقترحة لزيادة الوصول (Recruiter Reach)' : 'Recommended Actions for Recruiter Reach'}
                  </h4>
                  <ul className="space-y-2">
                    {linkedinResult.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2 text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                        <ArrowRight size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
