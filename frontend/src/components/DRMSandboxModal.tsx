import { useEffect, useMemo, useState } from 'react';

interface DRMSandboxModalProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}

const bannedKeys = ['c', 'x', 'v', 'p', 's', 'u', 'F12'];

const DRMSandboxModal = ({ open, onClose, userEmail }: DRMSandboxModalProps) => {
  const [time, setTime] = useState(() => new Date().toLocaleString('en-GB'));

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const updateClock = () => setTime(new Date().toLocaleString('en-GB'));
    const interval = window.setInterval(updateClock, 1000);

    const handleEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      if (isCtrlOrMeta && bannedKeys.includes(key)) {
        handleEvent(event);
      }

      if (event.key === 'F12' || event.key === 'ContextMenu') {
        handleEvent(event);
      }
    };

    document.addEventListener('contextmenu', handleEvent, { capture: true });
    document.addEventListener('copy', handleEvent, { capture: true });
    document.addEventListener('cut', handleEvent, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('contextmenu', handleEvent, { capture: true });
      document.removeEventListener('copy', handleEvent, { capture: true });
      document.removeEventListener('cut', handleEvent, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [open]);

  const watermarkText = useMemo(() => `${userEmail} • ${time}`, [userEmail, time]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 shadow-glass">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">DRM Secure Preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">صندوق الحماية</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>

        <div className="relative flex min-h-[420px] flex-col gap-6 overflow-hidden p-6 lg:p-8">
          <div className="drm-sandbox absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%)]" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_350px]">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-200 shadow-glass backdrop-blur-xl">
              <p className="text-sm text-sky-300">المستخدم</p>
              <h3 className="mt-2 text-xl font-semibold">عرض مرفقات وشهادات مشفرة</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                يتيح هذا الوضع عرض المرفقات والشهادات بدون السماح بالنسخ أو الطباعة أو الوصول غير المصرح به.
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-sm font-medium text-slate-200">ملف السيرة الذاتية</p>
                  <p className="mt-2 text-sm text-slate-400">PDF، نسخة عرض فقط، عناصر التحكم محمية.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-sm font-medium text-slate-200">شهادة اعتماد</p>
                  <p className="mt-2 text-sm text-slate-400">صورة معتمدة، لا يمكن نسخه أو طباعته من هذا العرض.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-sm font-medium text-slate-200">مرفق توظيف</p>
                  <p className="mt-2 text-sm text-slate-400">محتوى حساس مع حماية DRM كاملة.</p>
                </div>
              </div>
            </section>

            <aside className="space-y-6 rounded-[28px] border border-white/10 bg-slate-900/80 p-6 text-slate-300 shadow-glass backdrop-blur-xl">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">علامة مائية ديناميكية</p>
                <p className="mt-3 rounded-3xl border border-sky-400/10 bg-slate-950/80 px-4 py-3 text-sm text-sky-200">{watermarkText}</p>
              </div>
              <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">تفاصيل ال DRM</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-400">
                  <li>• تعطيل قائمة السياق والنسخ والقص.</li>
                  <li>• حظر الطباعة و F12 وأدوات المطور.</li>
                  <li>• حماية الأصول والتوثيق داخل وسيلة العرض.</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
                <p className="font-medium text-slate-100">المستوى</p>
                <p className="mt-2">عرض آمن محدود داخل الصندوق؛ لا يمكن الوصول إلى محتوى DRM عبر التحديد أو النقر الأيمن.</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DRMSandboxModal;
