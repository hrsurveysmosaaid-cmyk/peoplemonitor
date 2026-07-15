import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../ui/UiContext';
import {
  Users, Globe, FileText, Copy, CheckCheck,
  LogOut, Moon, Sun, Languages, Search, ExternalLink,
  UserCheck, Building2, Link2, CalendarDays, Mail,
  ShieldAlert, ArrowUpRight, Sparkles, TrendingUp,
  ChevronDown, ChevronUp, Clock, BadgeCheck, AlertCircle,
  Briefcase, LayoutGrid, RefreshCw
} from 'lucide-react';

interface Student {
  id: number;
  fullName: string;
  email: string;
  jobTitle?: string;
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

type SortKey = 'name' | 'date' | 'status';

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
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('partnerToken');

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    const headers = { Authorization: `Bearer ${token}` };
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
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/partner/login'); return; }
    loadData();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let list = students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.fullName.localeCompare(b.fullName);
      else if (sortKey === 'date') cmp = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
      else if (sortKey === 'status') cmp = Number(b.isVerified) - Number(a.isVerified);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    setFiltered(list);
  }, [search, students, sortKey, sortDir]);

  const referralUrl = profile ? `${window.location.origin}/register?ref=${profile.slug}` : '';

  const copyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem('partnerToken');
    localStorage.removeItem('partnerName');
    navigate('/partner/login');
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const completedCount = students.filter((s) => s.portfolios.length > 0).length;
  const verifiedCount = students.filter((s) => s.isVerified).length;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#060818]' : 'bg-slate-50'}`}>
        <div className="text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Building2 size={16} className="text-indigo-400" />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            {isAr ? 'جاري تحميل البيانات...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#060818] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className={`absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 ${isDark ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
        <div className={`absolute -bottom-64 -left-32 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 ${isDark ? 'bg-sky-600' : 'bg-sky-200'}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[140px] opacity-10 ${isDark ? 'bg-purple-600' : 'bg-purple-100'}`} />
      </div>

      <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">

        {/* ── TOP NAVBAR ── */}
        <header className={`rounded-2xl border px-6 py-4 flex items-center justify-between gap-4 backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? 'border-white/[0.07] bg-slate-900/70' : 'border-white/80 bg-white/80 shadow-slate-200/60'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${isDark ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' : 'bg-indigo-50 ring-1 ring-indigo-200'}`}>
              <Building2 size={22} className="text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-indigo-500 text-[10px] uppercase tracking-[0.2em] font-extrabold">
                {isAr ? 'بوابة المراكز التدريبية' : 'PARTNER PORTAL'}
              </p>
              <h1 className={`text-lg font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {profile?.name || 'Partner Center'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
              title={isAr ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
              aria-label="toggle theme"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
            >
              <Languages size={14} />
              <span>{lang === 'en' ? 'ع' : 'EN'}</span>
            </button>
            <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-2 px-3 py-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                {profile?.name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{profile?.adminEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-red-500/10 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
              title={isAr ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Users size={20} />,
              label: isAr ? 'إجمالي الطلاب' : 'Total Students',
              value: profile?.totalStudents ?? 0,
              sub: isAr ? 'مسجل عبر مركزكم' : 'via your center',
              accent: 'indigo',
              bg: isDark ? 'from-indigo-500/15 to-transparent' : 'from-indigo-50 to-white',
              border: isDark ? 'border-indigo-500/20' : 'border-indigo-100',
              iconBg: isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600',
            },
            {
              icon: <BadgeCheck size={20} />,
              label: isAr ? 'حسابات مفعّلة' : 'Verified Accounts',
              value: verifiedCount,
              sub: isAr ? 'أكدوا بريدهم الإلكتروني' : 'email confirmed',
              accent: 'emerald',
              bg: isDark ? 'from-emerald-500/15 to-transparent' : 'from-emerald-50 to-white',
              border: isDark ? 'border-emerald-500/20' : 'border-emerald-100',
              iconBg: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600',
            },
            {
              icon: <FileText size={20} />,
              label: isAr ? 'أكملوا السيرة الذاتية' : 'CV Completed',
              value: completedCount,
              sub: isAr ? 'لديهم حقيبة مهنية' : 'have a portfolio',
              accent: 'sky',
              bg: isDark ? 'from-sky-500/15 to-transparent' : 'from-sky-50 to-white',
              border: isDark ? 'border-sky-500/20' : 'border-sky-100',
              iconBg: isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600',
            },
            {
              icon: <Globe size={20} />,
              label: isAr ? 'سير منشورة' : 'Published CVs',
              value: profile?.publishedCount ?? 0,
              sub: isAr ? 'متاحة للعرض العام' : 'publicly visible',
              accent: 'violet',
              bg: isDark ? 'from-violet-500/15 to-transparent' : 'from-violet-50 to-white',
              border: isDark ? 'border-violet-500/20' : 'border-violet-100',
              iconBg: isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600',
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border p-5 bg-gradient-to-br ${card.bg} ${card.border} backdrop-blur-sm overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                  {card.icon}
                </div>
                <TrendingUp size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className={`text-4xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {card.value}
              </p>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{card.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── REFERRAL LINK CARD ── */}
        <div className={`rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 ${isDark ? 'border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-slate-900/50' : 'border-indigo-100 bg-gradient-to-br from-indigo-50 to-white'}`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
                  <Link2 size={16} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-indigo-500 text-xs font-black uppercase tracking-widest">
                    {isAr ? 'رابط التسجيل الخاص بمركزكم' : 'YOUR REFERRAL LINK'}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {isAr
                      ? 'شارك هذا الرابط مع طلابك — سيتم ربطهم بمركزكم تلقائياً عند التسجيل'
                      : 'Share with students — they\'ll be automatically linked to your center upon registration'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border transition-all ${isDark ? 'bg-slate-900/80 border-white/5' : 'bg-white border-slate-200'}`}>
                <Link2 size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  readOnly
                  value={referralUrl}
                  onClick={copyReferral}
                  className="flex-1 bg-transparent outline-none text-xs font-mono cursor-pointer text-indigo-400 truncate min-w-0"
                />
                <ArrowUpRight size={14} className="text-slate-500 flex-shrink-0" />
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={copyReferral}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 ${
                  copied
                    ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                }`}
              >
                {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
                {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
              </button>
            </div>
          </div>
        </div>

        {/* ── STUDENTS TABLE ── */}
        <div className={`rounded-2xl border overflow-hidden backdrop-blur-sm transition-all duration-300 ${isDark ? 'border-white/[0.06] bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm'}`}>

          {/* Table Header */}
          <div className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <LayoutGrid size={16} className="text-indigo-500" />
              </div>
              <div>
                <h2 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isAr ? 'قائمة الطلاب المسجلين' : 'Registered Students'}
                </h2>
                <p className="text-slate-500 text-xs">{isAr ? `${filtered.length} طالب` : `${filtered.length} students`}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${isDark ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20' : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'}`}>
                {filtered.length}
              </span>
            </div>

            {/* Search */}
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all w-full sm:w-auto ${isDark ? 'border-white/[0.06] bg-slate-900 focus-within:border-indigo-500/40' : 'border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:shadow-sm'}`}>
              <Search size={15} className="text-slate-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Search name or email...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm placeholder-slate-500 w-full sm:w-52 font-medium"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-500 bg-slate-900/60 border-b border-white/[0.04]' : 'text-slate-400 bg-slate-50/80 border-b border-slate-100'}`}>
                  {[
                    { key: 'name' as SortKey, label: isAr ? 'الطالب' : 'Student' },
                    { key: null, label: isAr ? 'المسمى الوظيفي' : 'Job Title' },
                    { key: 'status' as SortKey, label: isAr ? 'الحالة' : 'Status' },
                    { key: null, label: isAr ? 'الحقيبة المهنية' : 'Portfolio' },
                    { key: 'date' as SortKey, label: isAr ? 'تاريخ الانضمام' : 'Joined' },
                  ].map((col, ci) => (
                    <th
                      key={ci}
                      className={`px-6 py-3.5 text-start ${col.key ? 'cursor-pointer select-none hover:text-indigo-400 transition-colors' : ''}`}
                      onClick={() => col.key && toggleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.label}
                        {col.key && sortKey === col.key && (
                          sortDir === 'asc' ? <ChevronUp size={13} className="text-indigo-400" /> : <ChevronDown size={13} className="text-indigo-400" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`px-6 py-20 text-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <Users size={28} className="text-slate-500" />
                        </div>
                        <p className="font-semibold text-sm">
                          {isAr ? 'لا يوجد طلاب مرتبطون بمركزكم حالياً' : 'No students linked to your center yet'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isAr ? 'شارك رابط التسجيل مع طلابك لربطهم بمركزكم' : 'Share your referral link with students to link them'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((student, i) => {
                  const published = student.portfolios.find((p) => p.isPublished);
                  const hasDraft = student.portfolios.length > 0 && !published;
                  return (
                    <tr
                      key={student.id}
                      className={`group transition-colors duration-150 ${
                        isDark
                          ? `${i % 2 === 1 ? 'bg-slate-900/20' : ''} hover:bg-indigo-500/[0.03] border-b border-white/[0.03]`
                          : `${i % 2 === 1 ? 'bg-slate-50/60' : ''} hover:bg-indigo-50/60 border-b border-slate-100`
                      }`}
                    >
                      {/* Student Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${isDark ? 'bg-indigo-500/15 text-indigo-300 group-hover:bg-indigo-500/25' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm leading-snug ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                              {student.fullName}
                            </p>
                            <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <Mail size={10} />
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="px-6 py-4">
                        {student.jobTitle ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            <Briefcase size={11} />
                            {student.jobTitle}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {student.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {isAr ? 'مفعّل' : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                            <Clock size={11} />
                            {isAr ? 'قيد التحقق' : 'Pending'}
                          </span>
                        )}
                      </td>

                      {/* Portfolio */}
                      <td className="px-6 py-4">
                        {published ? (
                          <a
                            href={`/p/${published.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors group/link"
                          >
                            <Globe size={13} />
                            <span className="group-hover/link:underline">{published.slug}</span>
                            <ExternalLink size={11} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ) : hasDraft ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-slate-700/60 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            <FileText size={11} />
                            {isAr ? 'مسودة' : 'Draft'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <CalendarDays size={12} />
                          {new Date(student.registeredAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className={`py-5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t text-xs transition-all ${isDark ? 'border-white/[0.05] text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-500/60" />
            People Monitor &bull; {isAr ? 'منصة إدارة الحقائب المهنية' : 'Professional Portfolio Platform'}
          </span>
          <span>&copy; {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
