import React, { useState } from 'react';
import { Bot, Upload, Link as LinkIcon, Sparkles, CheckCircle2, AlertCircle, RefreshCw, FileCheck, ArrowRight, FileText, Copy, Download } from 'lucide-react';
import { useUi } from '../ui/UiContext';

const LinkedinIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <span className={`inline-flex items-center justify-center font-black rounded-sm bg-[#0A66C2] text-white text-[10px] px-1 ${className}`} style={{ width: size, height: size }}>
    in
  </span>
);

type ToolType = 'ats' | 'linkedin' | 'cover-letter';

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  missingKeywords?: string[];
}

interface CoverLetterResult {
  coverLetter: string;
  tips: string[];
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

  // Cover Letter State
  const [clApplicantName, setClApplicantName] = useState('');
  const [clCompanyName, setClCompanyName] = useState('');
  const [clJobTitle, setClJobTitle] = useState('');
  const [clAdditionalNotes, setClAdditionalNotes] = useState('');
  const [clFile, setClFile] = useState<File | null>(null);
  const [clGenerating, setClGenerating] = useState(false);
  const [clResult, setClResult] = useState<CoverLetterResult | null>(null);
  const [clCopied, setClCopied] = useState(false);

  const [atsError, setAtsError] = useState('');
  const [linkedinError, setLinkedinError] = useState('');
  const [clError, setClError] = useState('');

  // ATS Analysis Handler — real OpenAI API
  const handleAtsAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atsFile && !jobDescription.trim()) return;

    setAtsAnalyzing(true);
    setAtsResult(null);
    setAtsError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      if (atsFile) formData.append('resume', atsFile);
      formData.append('jobDescription', jobDescription);
      formData.append('lang', lang);

      const res = await fetch('/api/career-assistant/ats', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed');
      setAtsResult(json.data);
    } catch (err: any) {
      setAtsError(err.message || 'Unexpected error');
    } finally {
      setAtsAnalyzing(false);
    }
  };

  // LinkedIn Analysis Handler — real OpenAI API
  const handleLinkedinAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.trim() && !linkedinFile) return;

    setLinkedinAnalyzing(true);
    setLinkedinResult(null);
    setLinkedinError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      if (linkedinFile) formData.append('profile', linkedinFile);
      formData.append('profileUrl', linkedinUrl);
      formData.append('lang', lang);

      const res = await fetch('/api/career-assistant/linkedin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed');
      setLinkedinResult(json.data);
    } catch (err: any) {
      setLinkedinError(err.message || 'Unexpected error');
    } finally {
      setLinkedinAnalyzing(false);
    }
  };

  // Cover Letter Handler — real OpenAI API
  const handleCoverLetterGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clJobTitle.trim() && !clCompanyName.trim()) return;

    setClGenerating(true);
    setClResult(null);
    setClError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      if (clFile) formData.append('resume', clFile);
      formData.append('applicantName', clApplicantName);
      formData.append('companyName', clCompanyName);
      formData.append('jobTitle', clJobTitle);
      formData.append('additionalNotes', clAdditionalNotes);
      formData.append('lang', lang);

      const res = await fetch('/api/career-assistant/cover-letter', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Generation failed');
      setClResult(json.data);
    } catch (err: any) {
      setClError(err.message || 'Unexpected error');
    } finally {
      setClGenerating(false);
    }
  };

  const copyCoverLetter = () => {
    if (!clResult?.coverLetter) return;
    navigator.clipboard.writeText(clResult.coverLetter);
    setClCopied(true);
    setTimeout(() => setClCopied(false), 2000);
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
                ? 'مساعدك الذكي الشخصي لتحليل توافق السيرة الذاتية مع الوظائف والمسميات الوظيفية، تطوير بروفايل لينكد إن، وتوليد رسائل التغطية الاحترافية (Cover Letter).'
                : 'Your personal AI consultant for ATS job matching, LinkedIn profile optimization, and professional Cover Letter generation.'}
            </p>
          </div>
        </div>

        {/* Tool Selection Tabs */}
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-500/15 flex-wrap">
          <button
            onClick={() => setActiveTool('ats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'ats'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.02]'
                : isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileCheck size={16} />
            <span>{lang === 'ar' ? 'فحص مطابقة ATS والوظائف' : 'ATS & Role Matcher'}</span>
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

          <button
            onClick={() => setActiveTool('cover-letter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'cover-letter'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 scale-[1.02]'
                : isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileText size={16} />
            <span>{lang === 'ar' ? 'توليد خطّاب التغطية (Cover Letter)' : 'Cover Letter Generator'}</span>
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

              {/* Job Description / Job Title Textarea */}
              <div>
                <label className="block text-xs font-bold mb-2">
                  {lang === 'ar' ? '2. المسمى الوظيفي أو التوصيف الوظيفي الكامل' : '2. Job Title or Full Job Description'}
                </label>
                <textarea
                  rows={5}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب المسمى الوظيفي (مثال: Senior Frontend Engineer) أو انسخ نص التوصيف الوظيفي الكامل ليقوم الـ AI بتحليل التطابق والتوافقية مع معايير ATS...' : 'Type a job title (e.g. Senior Frontend Engineer) OR paste full job description to compare ATS alignment & global standards...'}
                  className={`w-full p-3.5 rounded-2xl text-xs border outline-none transition-all resize-none ${
                    isDark ? 'bg-slate-950/60 border-white/10 focus:border-sky-500 text-slate-100' : 'bg-white border-slate-200 focus:border-sky-500 text-slate-900'
                  }`}
                />
              </div>

              {/* Error Display */}
              {atsError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{atsError}</span>
                </div>
              )}

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

              {/* Error Display */}
              {linkedinError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{linkedinError}</span>
                </div>
              )}

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

      {/* ── TOOL 3: COVER LETTER GENERATOR ── */}
      {activeTool === 'cover-letter' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Input Panel */}
          <div className={`lg:col-span-6 glass-card p-6 rounded-3xl border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-500/15">
              <FileText size={18} className="text-sky-500" />
              <h2 className="text-sm font-black">{lang === 'ar' ? 'بيانات توليد خطاب التغطية' : 'Cover Letter Details'}</h2>
            </div>

            <form onSubmit={handleCoverLetterGeneration} className="space-y-4">
              {/* Applicant Name */}
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={clApplicantName}
                  onChange={(e) => setClApplicantName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أسامة المحمد' : 'e.g. Alex Morgan'}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs border outline-none transition-all ${
                    isDark ? 'bg-slate-950/60 border-white/10 focus:border-sky-500 text-slate-100' : 'bg-white border-slate-200 focus:border-sky-500 text-slate-900'
                  }`}
                />
              </div>

              {/* Target Company & Job Title Grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {lang === 'ar' ? 'اسم الشركة المستهدفة' : 'Target Company Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={clCompanyName}
                    onChange={(e) => setClCompanyName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: PeopleOS / Google' : 'e.g. Microsoft'}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs border outline-none transition-all ${
                      isDark ? 'bg-slate-950/60 border-white/10 focus:border-sky-500 text-slate-100' : 'bg-white border-slate-200 focus:border-sky-500 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {lang === 'ar' ? 'المنصب الوظيفي المستهدف' : 'Target Job Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={clJobTitle}
                    onChange={(e) => setClJobTitle(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: Senior Product Designer' : 'e.g. Senior Software Engineer'}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs border outline-none transition-all ${
                      isDark ? 'bg-slate-950/60 border-white/10 focus:border-sky-500 text-slate-100' : 'bg-white border-slate-200 focus:border-sky-500 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Resume PDF Upload (Optional) */}
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {lang === 'ar' ? 'ارفع سيرتك الذاتية (PDF - اختياري لربط الخبرات)' : 'Upload Resume PDF (Optional for personalization)'}
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl p-3 text-center transition-all ${
                  clFile 
                    ? isDark ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-emerald-400 bg-emerald-50'
                    : isDark ? 'border-white/15 hover:border-sky-500/50 bg-white/5' : 'border-slate-300 hover:border-sky-400 bg-slate-50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setClFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center justify-center gap-2 pointer-events-none">
                    {clFile ? (
                      <>
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <span className="text-xs font-bold truncate max-w-[200px] text-emerald-500">{clFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="text-sky-500" />
                        <span className="text-xs font-semibold">{lang === 'ar' ? 'اضغط لرفع سيرتك الذاتية PDF' : 'Click to attach your Resume PDF'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {lang === 'ar' ? 'ملاحظات أو إنجازات خاصة تُحب التركيز عليها' : 'Additional Notes / Key Highlights'}
                </label>
                <textarea
                  rows={3}
                  value={clAdditionalNotes}
                  onChange={(e) => setClAdditionalNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أود التركيز على خبرتي في قيادة الفرق التقنية وزيادة المبيعات بنسبة 40%...' : 'e.g. Focus on my experience in team leadership and scaling SaaS apps...'}
                  className={`w-full p-3 rounded-2xl text-xs border outline-none transition-all resize-none ${
                    isDark ? 'bg-slate-950/60 border-white/10 focus:border-sky-500 text-slate-100' : 'bg-white border-slate-200 focus:border-sky-500 text-slate-900'
                  }`}
                />
              </div>

              {/* Error Display */}
              {clError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{clError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={clGenerating || (!clJobTitle.trim() && !clCompanyName.trim())}
                className="w-full py-3 px-4 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {clGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{lang === 'ar' ? 'جاري توليد خطّاب التغطية الذكي...' : 'Crafting Cover Letter via AI...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{lang === 'ar' ? 'توليد Cover Letter احترافي' : 'Generate Cover Letter'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Output Panel */}
          <div className="lg:col-span-6">
            {!clResult && !clGenerating && (
              <div className={`p-10 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center min-h-[420px] ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                <FileText size={48} className="text-sky-500/40 mb-3" />
                <h3 className="text-sm font-bold text-slate-300">{lang === 'ar' ? 'في انتظار إدخال البيانات' : 'Awaiting Cover Letter Inputs'}</h3>
                <p className="text-xs max-w-xs mt-1 leading-relaxed">
                  {lang === 'ar' ? 'أدخل اسم الشركة والمنصب واضغط توليد للحصول على خطاب تغطية مُصمم خصيصاً للوظيفة' : 'Fill in target job and company details to generate a highly tailored Cover Letter.'}
                </p>
              </div>
            )}

            {clGenerating && (
              <div className={`p-12 rounded-3xl border text-center flex flex-col items-center justify-center min-h-[420px] ${isDark ? 'border-white/10 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
                <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" />
                <h3 className="text-sm font-bold">{lang === 'ar' ? 'جاري صياغة الخطاب بالأسلوب المهني المناسب...' : 'Writing Cover Letter & Personalizing Narrative...'}</h3>
              </div>
            )}

            {clResult && !clGenerating && (
              <div className={`space-y-4 glass-card p-6 rounded-3xl border ${isDark ? 'border-sky-500/20' : 'border-sky-200'}`}>
                {/* Result Header & Copy Actions */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-500/15">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-sky-500" />
                    <h3 className="text-sm font-extrabold">{lang === 'ar' ? 'خطاب التغطية المولد (Cover Letter)' : 'Generated Cover Letter'}</h3>
                  </div>
                  <button
                    onClick={copyCoverLetter}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      clCopied 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isDark ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30' : 'bg-sky-100 hover:bg-sky-200 text-sky-700'
                    }`}
                  >
                    {clCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    <span>{clCopied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ النص' : 'Copy Text')}</span>
                  </button>
                </div>

                {/* Formatted Cover Letter Output */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap font-sans border max-h-[400px] overflow-y-auto ${
                  isDark ? 'bg-slate-950/80 border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  {clResult.coverLetter}
                </div>

                {/* AI Application Tips */}
                {clResult.tips && clResult.tips.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-2">
                      <Sparkles size={14} />
                      {lang === 'ar' ? 'نصائح لزيادة فرص القبول عند الإرسال' : 'AI Application Tips'}
                    </h4>
                    <ul className="space-y-1.5">
                      {clResult.tips.map((tip: string, i: number) => (
                        <li key={i} className="text-[11px] flex items-start gap-2 text-slate-300 bg-slate-900/40 p-2 rounded-xl border border-white/5">
                          <ArrowRight size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
