import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PublishSettings, AppFont } from '../types';
import { slugify } from '../utils/slugify';
import { useUi } from '../ui/UiContext';
import './PublishModal.css';

type Props = {
  open: boolean;
  initial?: Partial<PublishSettings>;
  onClose: () => void;
  onPublish: (settings: PublishSettings) => void;
};

const defaultSettings: PublishSettings = {
  name: '',
  slug: '',
  colors: { text: '#111111', button: '#2563EB', background: '#FFFFFF' },
  backgroundType: 'solid',
  gradient: { angle: 135, from: '#FFFFFF', to: '#F1F5F9' },
  backgroundImage: undefined,
  font: 'Tajawal',
  theme: 'normal',
};

const fonts: AppFont[] = [
  'Dubai',
  'Tajawal',
  'Times New Roman',
  'Arial',
  'Tahoma',
  'Sans Serif',
  'Calibri',
];

export const PublishModal: React.FC<Props> = ({ open, initial, onClose, onPublish }) => {
  const { lang } = useUi();
  const L = useMemo(() => (
    lang === 'ar'
      ? {
          title: 'إعدادات النشر',
          cancel: 'إلغاء',
          publish: 'نشر',
          siteName: 'اسم الموقع',
          siteSlug: 'Slug (يُستخدم في الرابط)',
          design: 'التصميم',
          textColor: 'لون النص',
          btnColor: 'لون الأزرار',
          bg: 'الخلفية',
          bgSolid: 'لون سادة',
          bgGradient: 'غريدينت',
          bgImage: 'صورة',
          bgColor: 'لون الخلفية',
          from: 'من',
          to: 'إلى',
          uploadImage: 'رفع صورة',
          chooseFont: 'اختر الخط',
          theme: 'المظهر',
          normal: 'عادي',
          professional: 'مهني',
          themeDesc: {
            normal: 'مظهر تمرير عمودي بسيط وبطاقات زجاجية ناعمة.',
            professional: 'تخطيط أكثر تنظيماً مع إبراز العناوين والأقسام.',
          },
          placeholderName: 'اكتب اسم الموقع',
          placeholderSlug: 'يتولد تلقائياً',
        }
      : {
          title: 'Publish Settings',
          cancel: 'Cancel',
          publish: 'Publish',
          siteName: 'Site Name',
          siteSlug: 'Slug (used in URL)',
          design: 'Design',
          textColor: 'Text Color',
          btnColor: 'Button Color',
          bg: 'Background',
          bgSolid: 'Solid Color',
          bgGradient: 'Gradient',
          bgImage: 'Image',
          bgColor: 'Background Color',
          from: 'From',
          to: 'To',
          uploadImage: 'Upload Image',
          chooseFont: 'Choose Font',
          theme: 'Theme',
          normal: 'Normal',
          professional: 'Professional',
          themeDesc: {
            normal: 'Simple vertical scrolling with soft glass cards.',
            professional: 'More structured layout with highlighted headings.',
          },
          placeholderName: 'Enter site name',
          placeholderSlug: 'Auto-generated',
        }
  ), [lang]);

  const [settings, setSettings] = useState<PublishSettings>({ ...defaultSettings, ...initial });
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDarkUI, setIsDarkUI] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setSettings((s) => ({ ...s, slug: slugify(s.name) }));
    }
  }, [settings.name, slugTouched]);

  useEffect(() => {
    if (!open) return;
    const id = 'tajawal-font-link';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap';
      document.head.appendChild(link);
    }

    try {
      const html = document.documentElement;
      const body = document.body;
      const hasDark = html.classList.contains('dark') || body.classList.contains('dark');
      let darkByBg = false;
      const bg = getComputedStyle(body).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (m) {
        const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
        const srgb = [r, g, b].map(v => v / 255).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
        const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
        darkByBg = luminance < 0.5;
      }
      setIsDarkUI(hasDark || darkByBg);
    } catch {
      setIsDarkUI(false);
    }
  }, [open]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setSettings((s) => ({ ...s, backgroundImage: url }));
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const dynamicClass = useMemo(() => {
    const token = makeHash(
      JSON.stringify({
        t: settings.colors.text,
        b: settings.colors.button,
        bgT: settings.backgroundType,
        g: settings.gradient,
        img: Boolean(settings.backgroundImage),
        f: settings.font,
      })
    );
    return `pp-${token}`;
  }, [settings]);

  useEffect(() => {
    const styleId = 'publish-modal-dyn';
    let tag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement('style') as HTMLStyleElement;
      tag.id = styleId;
      document.head.appendChild(tag);
    }
    const background = computeBackgroundCSS(settings);
    const fontFamily = mapFont(settings.font);
    const css = `\n.${dynamicClass} { color: ${settings.colors.text}; font-family: ${fontFamily}; background: ${background}; }\n.${dynamicClass} .publish-demoBtn { background: ${settings.colors.button}; }\n`;
    tag.textContent = css;
  }, [dynamicClass, settings]);

  if (!open) return null;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`publish-backdrop ${isDarkUI ? 'publish-dark' : ''}`}>
      <div className="publish-modal">
        <div className="publish-headerRow">
          <h2 className="publish-title">{L.title}</h2>
          <div className="publish-headerActions">
            <button type="button" className="publish-btn" onClick={onClose}>{L.cancel}</button>
            <button type="button" className="publish-btn publish-btn--primary" onClick={() => onPublish(settings)}>
              {L.publish}
            </button>
          </div>
        </div>

        {/* الاسم و الـ Slug */}
        <div className="publish-section">
          <div className="publish-two">
            <div className="publish-inputCol">
              <label htmlFor="site-name">{L.siteName}</label>
              <input
                id="site-name"
                className="publish-control"
                placeholder={L.placeholderName}
                value={settings.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>
            <div className="publish-inputCol">
              <label htmlFor="site-slug">{L.siteSlug}</label>
              <input
                id="site-slug"
                className="publish-control"
                placeholder={L.placeholderSlug}
                value={settings.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSlugTouched(true);
                  setSettings({ ...settings, slug: slugify(e.target.value) });
                }}
              />
            </div>
          </div>
        </div>

        {/* التصميم */}
        <div className="publish-section">
          <h3 className="publish-h3">{L.design}</h3>
          {/* ألوان النص/الأزرار + الخلفية (النوع + التحكم بجانب بعض) */}
          <div className="publish-row publish-rowWrap">
            <ColorInput
              id="color-text"
              label={L.textColor}
              value={settings.colors.text}
              onChange={(v) => setSettings({ ...settings, colors: { ...settings.colors, text: v } })}
            />
            <ColorInput
              id="color-button"
              label={L.btnColor}
              value={settings.colors.button}
              onChange={(v) => setSettings({ ...settings, colors: { ...settings.colors, button: v } })}
            />

            {/* مجموعة الخلفية */}
            <div className="publish-bgGroup">
              <span className="publish-labelBlock">{L.bg}</span>
              <div className="publish-bgRow">
                <div className="publish-bgTypes">
                  <Radio
                    label={L.bgSolid}
                    checked={settings.backgroundType === 'solid'}
                    onChange={() => setSettings({ ...settings, backgroundType: 'solid' })}
                  />
                  <Radio
                    label={L.bgGradient}
                    checked={settings.backgroundType === 'gradient'}
                    onChange={() => setSettings({ ...settings, backgroundType: 'gradient' })}
                  />
                  <Radio
                    label={L.bgImage}
                    checked={settings.backgroundType === 'image'}
                    onChange={() => setSettings({ ...settings, backgroundType: 'image' })}
                  />
                </div>

                <div className="publish-bgControlsInline">
                  {settings.backgroundType === 'solid' && (
                    <ColorInput
                      id="color-bg"
                      label={L.bgColor}
                      value={settings.colors.background}
                      onChange={(v) => setSettings({ ...settings, colors: { ...settings.colors, background: v } })}
                    />
                  )}

                  {settings.backgroundType === 'gradient' && (
                    <>
                      <ColorInput
                        id="grad-from"
                        label={L.from}
                        value={settings.gradient?.from || '#ffffff'}
                        onChange={(v) =>
                          setSettings({ ...settings, gradient: { ...(settings.gradient || { angle: 135, from: v, to: '#f1f5f9' }), from: v } })
                        }
                      />
                      <ColorInput
                        id="grad-to"
                        label={L.to}
                        value={settings.gradient?.to || '#f1f5f9'}
                        onChange={(v) =>
                          setSettings({ ...settings, gradient: { ...(settings.gradient || { angle: 135, from: '#ffffff', to: v }), to: v } })
                        }
                      />
                    </>
                  )}

                  {settings.backgroundType === 'image' && (
                    <div className="publish-inputCol">
                      <label htmlFor="bg-image" className="publish-labelBlock">{L.uploadImage}</label>
                      <input className="publish-control" id="bg-image" type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] || null)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* اختيار الخط */}
          <div className="publish-mt8">
            <label htmlFor="font-select">{L.chooseFont}</label>
            <FontSelect id="font-select" value={settings.font} onChange={(f) => setSettings({ ...settings, font: f })} />
          </div>
        </div>

        {/* المظاهر */}
        <div className="publish-section">
          <h3 className="publish-h3">{L.theme}</h3>
          <div className="publish-themeRow">
            <button type="button" className={`publish-chip ${settings.theme === 'normal' ? 'is-selected' : ''}`} onClick={() => setSettings({ ...settings, theme: 'normal' })} aria-label={L.normal}>{L.normal}</button>
            <button type="button" className={`publish-chip ${settings.theme === 'professional' ? 'is-selected' : ''}`} onClick={() => setSettings({ ...settings, theme: 'professional' })} aria-label={L.professional}>{L.professional}</button>
          </div>
          <div className="publish-muted" aria-live="polite">{(L.themeDesc as any)[settings.theme]}</div>
        </div>


      </div>
    </div>
  );
};

// عناصر مساعدة بسيطة
const FontSelect: React.FC<{ id: string; value: AppFont; onChange: (v: AppFont) => void }> = ({ id, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current || !btnRef.current) return;
      if (menuRef.current.contains(e.target as Node) || btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="publish-fontSelect">
      <button
        id={id}
        ref={btnRef}
        type="button"
        className={`publish-control publish-fontBtn ${fontClass(value)}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={`${id}-listbox`}
      >
        {value}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={`${id}-listbox`}
          className="publish-menu"
          role="listbox"
          aria-labelledby={id}
        >
          {fonts.map((f) => {
            const selected = value === f;
            return selected ? (
              <div
                key={f}
                role="option"
                aria-selected="true"
                className={`publish-menuItem is-active ${fontClass(f)}`}
                onClick={() => {
                  onChange(f);
                  setOpen(false);
                }}
                tabIndex={-1}
              >
                {f}
              </div>
            ) : (
              <div
                key={f}
                role="option"
                aria-selected="false"
                className={`publish-menuItem ${fontClass(f)}`}
                onClick={() => {
                  onChange(f);
                  setOpen(false);
                }}
                tabIndex={-1}
              >
                {f}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ColorInput: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean }> = ({
  id,
  label,
  value,
  onChange,
  disabled,
}) => (
  <div className="publish-inputCol">
    <label htmlFor={id}>{label}</label>
    <div className="publish-colorGroup">
      <input
        id={id}
        className="publish-color"
        type="color"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label}
      />
      <input
        className="publish-control publish-hex"
        type="text"
        inputMode="text"
        placeholder="#RRGGBB"
        maxLength={7}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value.trim();
          if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v)) onChange(v);
        }}
        disabled={disabled}
        aria-label={`${label} HEX`}
      />
    </div>
  </div>
);

const Radio: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className="publish-radioLabel">
    <input type="radio" checked={checked} onChange={onChange} />
    <span>{label}</span>
  </label>
);

const ThemeCard: React.FC<{ title: string; description: string; selected: boolean; onClick: () => void }> = ({
  title,
  description,
  selected,
  onClick,
}) => (
  <button onClick={onClick} className={`publish-themeCard ${selected ? 'is-selected' : ''}`}>
    <div className="publish-themeCardTitle">{title}</div>
    <div className="publish-themeCardDesc">{description}</div>
  </button>
);

function mapFont(f: AppFont): string {
  switch (f) {
    case 'Tajawal':
      return '"Tajawal", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"';
    case 'Dubai':
      return '"Dubai", "Segoe UI", Tahoma, Arial, sans-serif';
    case 'Times New Roman':
      return '"Times New Roman", Times, serif';
    case 'Arial':
      return 'Arial, "Helvetica Neue", Helvetica, sans-serif';
    case 'Tahoma':
      return 'Tahoma, Geneva, Verdana, sans-serif';
    case 'Sans Serif':
      return 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    case 'Calibri':
      return 'Calibri, "Segoe UI", Arial, sans-serif';
    default:
      return 'system-ui, sans-serif';
  }
}

function fontClass(f: AppFont): string {
  switch (f) {
    case 'Tajawal':
      return 'font-tajawal';
    case 'Dubai':
      return 'font-dubai';
    case 'Times New Roman':
      return 'font-times-new-roman';
    case 'Arial':
      return 'font-arial';
    case 'Tahoma':
      return 'font-tahoma';
    case 'Sans Serif':
      return 'font-sans-serif';
    case 'Calibri':
      return 'font-calibri';
    default:
      return '';
  }
}

function makeHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0).toString(36).slice(0, 8);
}

function computeBackgroundCSS(settings: PublishSettings): string {
  if (settings.backgroundType === 'solid') return settings.colors.background;
  if (settings.backgroundType === 'gradient' && settings.gradient) {
    return `linear-gradient(${settings.gradient.angle}deg, ${settings.gradient.from}, ${settings.gradient.to})`;
  }
  if (settings.backgroundType === 'image' && settings.backgroundImage) {
    return `url("${settings.backgroundImage}") center/cover no-repeat`;
  }
  return '#ffffff';
}
