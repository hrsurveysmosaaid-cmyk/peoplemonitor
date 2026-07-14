import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import {
  Users, Globe, FileText, Copy, CheckCheck,
  LogOut, Moon, Sun, Languages, Search, ExternalLink,
  UserCheck, Building2, Link as LinkIcon, Calendar, Mail, ShieldAlert
} from 'lucide-react';

interface Student {
  id: number;
  fullName: string;
  email: string;
  isVerified: boolean;
  registeredAt: string;
  portfolios: { slug: string; isPublished: boolean }[];
}

interface PartnerProfile {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  adminEmail: string;
  totalStudents: number;
  publishedCount: number;
}

export default function PartnerDashboardPage() {
  const { theme, toggleTheme, lang, setLang } = useUi();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('partnerToken');

  useEffect(() => {
    if (!token) { navigate('/partner/login'); return; }
    const headers = { Authorization: `Bearer ${token}` };

    const loadData = async () => {
      try {
        const [meRes, studentsRes] = await Promise.all([
          fetch('/api/partner/me', { headers }),
          fetch('/api/partner/students', { headers }),
        ]);
        if (meRes.status === 401 || studentsRes.status === 401) {
          localStorage.removeItem('partnerToken');
          navigate('/partner/login');
          return;
        }
        const meData = await meRes.json();
        const studentsData = await studentsRes.json();
        if (meData.success) setProfile(meData.data);
        if (studentsData.success) {
          setStudents(studentsData.data);
          setFiltered(studentsData.data);
        }
      } catch {
        setError(isAr ? 'حدث خطأ في تحميل البيانات' : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      students.filter(
        (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      )
    );
  }, [search, students]);

  const referralUrl = profile ? `${window.location.origin}/register?ref=${profile.slug}` : '';

  const copyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('partnerToken');
    localStorage.removeItem('partnerName');
    navigate('/partner/login');
  };

  const completedCount = students.filter((s) => s.portfolios.length > 0).length;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} px-4 py-8 md:px-10 lg:px-16 transition-colors duration-300 relative`}>
      {/* Decorative blurred backgrounds */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-[1280px] space-y-8 relative z-10">

        {/* Header */}
        <header className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all duration-300 ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/80 bg-white/80'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
              <Building2 size={28} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-indigo-500 text-[10px] uppercase tracking-[0.25em] font-extrabold">
                {isAr ? 'بوابة الشركاء والمراكز' : 'PARTNER PORTAL'}
              </p>
              <h1 className={`mt-0.5 text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {profile?.name || 'Partner'}
              </h1>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
                <Mail size={12} />
                {profile?.adminEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="icon-button w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200/40 hover:scale-105 transition-transform" onClick={toggleTheme} aria-label="toggle theme">
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
            </button>
            <button className="icon-button px-3 h-10 flex items-center gap-1.5 text-xs font-bold rounded-xl border border-slate-200/40 hover:scale-105 transition-transform" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
              <Languages size={16} />
              <span>{lang === 'en' ? 'ع' : 'EN'}</span>
            </button>
            <button className="icon-button w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors" onClick={handleLogout} title={isAr ? 'خروج' : 'Logout'}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center flex items-center justify-center gap-2">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Users size={24} />, label: isAr ? 'إجمالي الطلاب' : 'Total Students', value: profile?.totalStudents ?? 0, color: 'text-indigo-500', bg: 'from-indigo-500/20 to-indigo-500/5' },
            { icon: <FileText size={24} />, label: isAr ? 'أكملوا السيرة الذاتية' : 'CV Completed', value: completedCount, color: 'text-sky-500', bg: 'from-sky-500/20 to-sky-500/5' },
            { icon: <Globe size={24} />, label: isAr ? 'سير ذاتية منشورة' : 'Published CVs', value: profile?.publishedCount ?? 0, color: 'text-emerald-500', bg: 'from-emerald-500/20 to-emerald-500/5' },
          ].map((card, i) => (
            <div key={i} className={`rounded-3xl border p-6 flex items-center gap-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDark ? 'border-white/5 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.bg} ${card.color}`}>{card.icon}</div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                <p className={`text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Referral Link Card */}
        <div className={`rounded-3xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 ${isDark ? 'border-indigo-500/20 bg-indigo-950/20' : 'border-indigo-100 bg-indigo-50/50'}`}>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <LinkIcon size={18} className="text-indigo-500" />
              <h2 className="text-indigo-500 text-sm font-black uppercase tracking-wider">{isAr ? 'رابط التسجيل للمركز' : 'Your Referral Link'}</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{isAr ? 'شارك هذا الرابط مع طلابك. بمجرد قيامهم بالتسجيل من خلاله، سيتم ربطهم تلقائياً بهذا الحساب لتتمكن من متابعة سيرهم الذاتية وتفاصيلهم.' : 'Share this link with your students. Upon registration, they will be automatically linked to this account for tracking.'}</p>
            <div className="relative mt-3">
              <input
                readOnly
                value={referralUrl}
                onClick={copyReferral}
                className={`w-full rounded-2xl px-4 py-3.5 text-xs font-mono cursor-pointer transition-all duration-300 ${isDark ? 'bg-slate-900/90 text-indigo-300 border border-white/5 focus:border-indigo-500/50' : 'bg-white text-indigo-700 border border-slate-200 focus:border-indigo-500'}`}
              />
            </div>
          </div>
          <button onClick={copyReferral} className={`button-primary flex items-center gap-2 text-sm px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20 ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
            {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
            {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ رابط المركز' : 'Copy referral Link')}
          </button>
        </div>

        {/* Students Table */}
        <div className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isDark ? 'border-white/5 bg-slate-900/20 shadow-xl' : 'border-slate-200 bg-white shadow-md'}`}>
          <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'قائمة الطلاب المسجلين' : 'Registered Students'}
              </h2>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                {filtered.length}
              </span>
            </div>
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 border transition-all ${isDark ? 'border-white/5 bg-slate-900/90 focus-within:border-indigo-500/50' : 'border-slate-200 bg-slate-50 focus-within:border-indigo-500'}`}>
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder={isAr ? 'بحث باسم أو إيميل...' : 'Search name or email...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-500 w-52 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wider font-extrabold ${isDark ? 'bg-slate-900/50 text-slate-400 border-b border-white/5' : 'bg-slate-100/50 text-slate-500 border-b border-slate-200'}`}>
                  <th className="px-6 py-4 text-start">{isAr ? 'الاسم والطالب' : 'Student Info'}</th>
                  <th className="px-6 py-4 text-start">{isAr ? 'تأكيد الحساب' : 'Account Status'}</th>
                  <th className="px-6 py-4 text-start">{isAr ? 'الحقيبة المهنية' : 'Portfolio Link'}</th>
                  <th className="px-6 py-4 text-start">{isAr ? 'تاريخ الانضمام' : 'Join Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium">
                      {isAr ? 'لا يوجد طلاب مرتبطون بمركزكم حالياً.' : 'No students found.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((student, i) => {
                    const published = student.portfolios.find((p) => p.isPublished);
                    return (
                      <tr key={student.id} className={`transition-colors hover:bg-indigo-500/[0.02] ${i % 2 === 0 ? '' : isDark ? 'bg-slate-900/20' : 'bg-slate-50/40'}`}>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDark ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.fullName}</p>
                              <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                <Mail size={11} />
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          {student.isVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <UserCheck size={12} /> {isAr ? 'مفعل' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                              {isAr ? 'قيد التحقق' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4.5">
                          {published ? (
                            <a
                              href={`/p/${published.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-indigo-500 hover:text-indigo-400 hover:underline text-sm font-bold"
                            >
                              <Globe size={14} /> {published.slug} <ExternalLink size={12} />
                            </a>
                          ) : student.portfolios.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/10">
                              {isAr ? 'مسودة' : 'Draft'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-slate-400 text-xs font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={12} />
                            {new Date(student.registeredAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className={`py-6 text-center text-xs border-t transition-all ${isDark ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          &copy; {new Date().getFullYear()} People Monitor &bull; {isAr ? 'منصة إدارة وتتبع الحقائب المهنية' : 'Portfolio Tracking Platform'}
        </footer>
      </div>
    </div>
  );
}
