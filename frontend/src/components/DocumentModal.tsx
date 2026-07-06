import React, { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  type?: 'pdf' | 'image' | 'text';
  url?: string;
  text?: string;
  title?: string;
  watermark?: string;
  lang?: 'ar' | 'en';
}

// Best-effort web-only protection: prevents some copy/print/context actions inside modal
function useDRMGuards(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const keydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const banned = ['print', 'p'];
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'x', 'v', 's', 'u', 'p'].includes(key)) handle(e);
      }
      if (e.key === 'F12' || e.key === 'ContextMenu') handle(e);
    };

    document.addEventListener('contextmenu', handle, { capture: true });
    document.addEventListener('copy', handle, { capture: true });
    document.addEventListener('cut', handle, { capture: true });
    document.addEventListener('paste', handle, { capture: true });
    document.addEventListener('keydown', keydown, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handle, { capture: true } as any);
      document.removeEventListener('copy', handle, { capture: true } as any);
      document.removeEventListener('cut', handle, { capture: true } as any);
      document.removeEventListener('paste', handle, { capture: true } as any);
      document.removeEventListener('keydown', keydown, { capture: true } as any);
    };
  }, [enabled]);
}

export default function DocumentModal({ open, onClose, type, url, text, title, watermark, lang = 'en' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useDRMGuards(open);

  const kind: 'pdf' | 'image' | 'text' = useMemo(() => {
    if (type) return type;
    if (url) {
      const lower = url.toLowerCase();
      if (lower.endsWith('.pdf')) return 'pdf';
      if (lower.match(/\.(png|jpe?g|webp|gif|bmp|svg)$/)) return 'image';
    }
    return 'text';
  }, [type, url]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (kind === 'image' && url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        if (watermark) {
          ctx.save();
          ctx.globalAlpha = 0.18;
          ctx.rotate((-15 * Math.PI) / 180);
          ctx.fillStyle = '#000000';
          ctx.font = '24px "Times New Roman", Times, serif';
          ctx.fillText(watermark, 20, canvas.height / 2);
          ctx.restore();
        }
      };
      img.src = url;
    }

    if (kind === 'pdf' && url) {
      // Lazy import pdf.js to reduce bundle size
      (async () => {
        // @ts-ignore - types are declared in src/types/pdfjs-dist.d.ts
        const pdfjs = await import('pdfjs-dist');
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        // @ts-ignore
        const task = pdfjs.getDocument({ url });
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.4 });
        canvas.width = viewport.width as number;
        canvas.height = viewport.height as number;
        const ctx2 = canvas.getContext('2d');
        if (!ctx2) return;
        // @ts-ignore
        await page.render({ canvasContext: ctx2, viewport }).promise;
        if (watermark) {
          ctx2.save();
          ctx2.globalAlpha = 0.18;
          ctx2.rotate((-15 * Math.PI) / 180);
          ctx2.fillStyle = '#000000';
          ctx2.font = '24px "Times New Roman", Times, serif';
          ctx2.fillText(watermark, 20, (canvas.height || 0) / 2);
          ctx2.restore();
        }
      })().catch(() => {
        // Silently ignore render errors
      });
    }
  }, [open, kind, url, watermark]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-inner-card relative max-h-[92vh] w-full max-w-4xl select-none" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-center border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest opacity-80">{lang === 'ar' ? 'معاينة آمنة' : 'Secure Preview'} • {lang === 'ar' ? 'Secure Preview' : 'معاينة آمنة'}</p>
            <h2 className="text-base font-semibold">{title || (lang === 'ar' ? 'معاينة' : 'Preview')}</h2>
          </div>
          <button className="absolute top-2.5 end-2.5 icon-button p-1.5" onClick={onClose} aria-label={`${lang === 'ar' ? 'إغلاق' : 'Close'} / ${lang === 'ar' ? 'Close' : 'إغلاق'}`}>
            <X size={16} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto overflow-x-hidden max-h-[calc(92vh-56px)]">
          {kind === 'text' && (
            <div className="glass-empty not-italic border-dashed border-white/15 p-4 text-sm break-words">
              {text || url}
            </div>
          )}
          {(kind === 'pdf' || kind === 'image') && (
            <div className="w-full overflow-y-auto overflow-x-hidden">
              <canvas ref={canvasRef} className="mx-auto block max-w-full" />
            </div>
          )}
          {watermark && (
            <div className="mt-3 text-center text-[11px] opacity-70">{watermark}</div>
          )}
          <div className="mt-3 text-center text-[12px] opacity-85 space-y-1">
            <p>تنبيه: هذه الوثيقة محمية للاطلاع فقط. يُحظر النسخ، الحفظ، الطباعة أو إعادة التوزيع. أي استخدام غير مصرح به قد يعرّضك للمساءلة.</p>
            <p>Notice: This document is protected for preview only. Copying, saving, printing, or redistribution is prohibited. Unauthorized use may lead to liability.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
