import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import {
  Users, Globe, FileText, Copy, CheckCheck,
  LogOut, Moon, Sun, Languages, Search, ExternalLink,
  TrendingUp, UserCheck, Building2, Link as LinkIcon
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
          <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} px-4 py-8 md:px-10 lg:px-16 transition-colors duration-300`}>
      <div className="mx-auto max-w-[1280px] space-y-6">

        {/* Header */}
        <header className={`rounded-[2rem] border p-6 shadow-glass backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/90'}`}>
          <div>
            <p className="text-sky-500 text-xs uppercase tracking-[0.3em] font-bold">
              {isAr ? 'لوحة تحكم المركز التدريبي' : 'Training Center Dashboard'}
            </p>
            <h1 className={`mt-1 text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {profile?.name || 'Partner'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">{profile?.adminEmail}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="icon-button" onClick={toggleTheme} aria-label="toggle theme">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="icon-button flex items-center gap-1 text-xs font-bold" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
              <Languages size={16} />
              <span>{lang === 'en' ? 'ع' : 'EN'}</span>
            </button>
            <button className="icon-button" onClick={handleLogout} title={isAr ? 'خروج' : 'Logout'}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">{error}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Users size={22} />, label: isAr ? 'إجمالي الطلاب' : 'Total Students', value: profile?.totalStudents ?? 0, color: 'text-sky-400' },
            { icon: <FileText size={22} />, label: isAr ? 'أكملوا السيرة الذاتية' : 'CV Completed', value: completedCount, color: 'text-indigo-400' },
            { icon: <Globe size={22} />, label: isAr ? 'سير ذاتية منشورة' : 'Published CVs', value: profile?.publishedCount ?? 0, color: 'text-emerald-400' },
          ].map((card, i) => (
            <div key={i} className={`rounded-2xl border p-5 flex items-center gap-4 ${isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
              <div className={`${card.color} p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>{card.icon}</div>
              <div>
                <p className="text-slate-400 text-xs">{card.label}</p>
                <p className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Referral Link Card */}
        <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isDark ? 'border-sky-500/20 bg-sky-500/5' : 'border-sky-200 bg-sky-50'}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon size={16} className="text-sky-400" />
              <p className="text-sky-400 text-sm font-bold">{isAr ? 'رابط الإحالة الخاص بمركزكم' : 'Your Center Referral Link'}</p>
            </div>
            <p className="text-xs text-slate-400 mb-2">{isAr ? 'شاركوا هذا الرابط مع الطلاب ليتم ربطهم تلقائياً بمركزكم عند التسجيل.' : 'Share this link with students so they get automatically linked to your center when they register.'}</p>
            <input
              readOnly
              value={referralUrl}
              className={`w-full rounded-xl px-3 py-2 text-xs font-mono ${isDark ? 'bg-slate-900 text-sky-300 border border-sky-500/20' : 'bg-white text-sky-700 border border-sky-200'}`}
            />
          </div>
          <button onClick={copyReferral} className="button-primary flex items-center gap-2 text-sm whitespace-nowrap">
            {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
            {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
          </button>
        </div>

        {/* Students Table */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
          <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-sky-400" />
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isAr ? 'قائمة الطلاب' : 'Students List'}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                {filtered.length}
              </span>
            </div>
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder={isAr ? 'بحث باسم أو بريد إلكتروني...' : 'Search by name or email...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-slate-300 placeholder-slate-500 w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wider ${isDark ? 'bg-slate-900 text-slate-400 border-b border-white/5' : 'bg-slate-50 text-slate-500 border-b border-slate-100'}`}>
                  <th className="px-5 py-3 text-start">{isAr ? 'الطالب' : 'Student'}</th>
                  <th className="px-5 py-3 text-start">{isAr ? 'التحقق' : 'Verified'}</th>
                  <th className="px-5 py-3 text-start">{isAr ? 'المحفظة' : 'Portfolio'}</th>
                  <th className="px-5 py-3 text-start">{isAr ? 'تاريخ التسجيل' : 'Registered'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-500 text-sm">
                      {isAr ? 'لا يوجد طلاب مرتبطون بمركزكم بعد.' : 'No students linked to your center yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((student, i) => {
                    const published = student.portfolios.find((p) => p.isPublished);
                    return (
                      <tr key={student.id} className={`border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/3' : 'border-slate-100 hover:bg-slate-50'} ${i % 2 === 0 ? '' : isDark ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}>
                        <td className="px-5 py-3">
                          <div>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.fullName}</p>
                            <p className="text-slate-500 text-xs">{student.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {student.isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                              <UserCheck size={11} /> {isAr ? 'مفعل' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
                              {isAr ? 'بانتظار التفعيل' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {published ? (
                            <a
                              href={`/p/${published.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sky-400 hover:underline text-xs font-semibold"
                            >
                              <Globe size={12} /> {`/p/${published.slug}`} <ExternalLink size={10} />
                            </a>
                          ) : student.portfolios.length > 0 ? (
                            <span className="text-xs text-slate-500">{isAr ? 'مسودة' : 'Draft'}</span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-400 text-xs">
                          {new Date(student.registeredAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')}
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
        <footer className={`py-4 text-center text-xs border-t ${isDark ? 'border-white/10 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          &copy; {new Date().getFullYear()} People Monitor — {isAr ? 'لوحة تحكم الشريك' : 'Partner Portal'}
        </footer>
      </div>
    </div>
  );
}
