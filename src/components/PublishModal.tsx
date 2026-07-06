import React, { useEffect, useMemo, useState } from 'react';
import type { SiteSettings, AppFont } from '../types/SiteSettings';
import { slugify } from '../utils/slugify';
import './PublishModal.css';

type Props = {
  open: boolean;
  initial?: Partial<SiteSettings>;
  onClose: () => void;
  onPublish: (settings: SiteSettings) => void;
};

const defaultSettings: SiteSettings = {
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
  const [settings, setSettings] = useState<SiteSettings>({ ...defaultSettings, ...initial });
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
  }, [open]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setSettings((s) => ({ ...s, backgroundImage: url }));
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Dynamic CSS class injection to avoid inline styles while keeping live preview
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
    <div dir="rtl" className="publish-backdrop">
      <div className="publish-modal">
        <div className="publish-headerRow">
          <h2 className="publish-title">إعدادات النشر</h2>
          <div className="publish-headerActions">
            <button type="button" className="publish-btn" onClick={onClose}>إلغاء</button>
            <button type="button" className="publish-btn publish-btn--primary" onClick={() => onPublish(settings)}>
              نشر
            </button>
          </div>
        </div>

        {/* الاسم و الـ Slug */}
        <div className="publish-section">
          <label htmlFor="site-name">اسم الموقع</label>
          <input
            id="site-name"
            placeholder="اكتب اسم الموقع"
            value={settings.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, name: e.target.value })}
          />
          <label htmlFor="site-slug">Slug (يُستخدم في الرابط)</label>
          <input
            id="site-slug"
            placeholder="يتولد تلقائياً"
            value={settings.slug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSlugTouched(true);
              setSettings({ ...settings, slug: slugify(e.target.value) });
            }}
          />
        </div>

        {/* الألوان والخلفية */}
        <div className="publish-section">
          <h3 className="publish-h3">الألوان</h3>
          <div className="publish-row">
            <ColorInput
              id="color-text"
              label="لون النص"
              value={settings.colors.text}
              onChange={(v) => setSettings({ ...settings, colors: { ...settings.colors, text: v } })}
            />
            <ColorInput
              id="color-button"
              label="لون الأزرار"
              value={settings.colors.button}
              onChange={(v) => setSettings({ ...settings, colors: { ...settings.colors, button: v } })}
            />
            <ColorInput
              id="color-bg"
              label="لون الخلفية"
              value={settings.colors.background}
              onChange={(v) => setSettings({ ...settings, colors: { ...settings.colors, background: v } })}
              disabled={settings.backgroundType !== 'solid'}
            />
          </div>

          <div className="publish-mt8">
            <label className="publish-labelBlock">نوع الخلفية</label>
            <div className="publish-row">
              <Radio
                label="لون سادة"
                checked={settings.backgroundType === 'solid'}
                onChange={() => setSettings({ ...settings, backgroundType: 'solid' })}
              />
              <Radio
                label="غريدينت"
                checked={settings.backgroundType === 'gradient'}
                onChange={() => setSettings({ ...settings, backgroundType: 'gradient' })}
              />
              <Radio
                label="صورة كاملة"
                checked={settings.backgroundType === 'image'}
                onChange={() => setSettings({ ...settings, backgroundType: 'image' })}
              />
            </div>
          </div>

          {settings.backgroundType === 'gradient' && (
            <div className="publish-row publish-rowWrap publish-mt8">
              <ColorInput
                id="grad-from"
                label="من"
                value={settings.gradient?.from || '#ffffff'}
                onChange={(v) =>
                  setSettings({ ...settings, gradient: { ...(settings.gradient || { angle: 135, from: v, to: '#f1f5f9' }), from: v } })
                }
              />
              <ColorInput
                id="grad-to"
                label="إلى"
                value={settings.gradient?.to || '#f1f5f9'}
                onChange={(v) =>
                  setSettings({ ...settings, gradient: { ...(settings.gradient || { angle: 135, from: '#ffffff', to: v }), to: v } })
                }
              />
              <div className="publish-inputCol">
                <label htmlFor="grad-angle">زاوية</label>
                <input
                  id="grad-angle"
                  type="range"
                  min={0}
                  max={360}
                  value={settings.gradient?.angle || 135}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings({ ...settings, gradient: { ...(settings.gradient || { angle: 135, from: '#ffffff', to: '#f1f5f9' }), angle: Number(e.target.value) } })
                  }
                />
              </div>
            </div>
          )}

          {settings.backgroundType === 'image' && (
            <div className="publish-mt8">
              <label htmlFor="bg-image" className="publish-labelBlock">رفع صورة للخلفية</label>
              <input id="bg-image" type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] || null)} />
            </div>
          )}
        </div>

        {/* الخط */}
        <div className="publish-section">
          <h3 className="publish-h3">الخط</h3>
          <label htmlFor="font-select">اختر الخط</label>
          <select
            id="font-select"
            value={settings.font}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, font: e.target.value as AppFont })}
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <small>ملاحظة: Tajawal من Google Fonts. Dubai قد يتطلب ترخيص/استضافة محلية. "Times Romin" المقصود غالباً "Times New Roman".</small>
        </div>

        {/* المظاهر */}
        <div className="publish-section">
          <h3 className="publish-h3">المظهر</h3>
          <div className="publish-themeGrid">
            <ThemeCard
              title="عادي"
              description="صفحة سكرولينغ؛ الشهادات كبطاقات بحواف ناعمة وبلور وشادو فوق المحتوى"
              selected={settings.theme === 'normal'}
              onClick={() => setSettings({ ...settings, theme: 'normal' })}
            />
            <ThemeCard
              title="مهني"
              description="هيدر باسم + تبويبات للأقسام؛ البطاقات تظهر فوق القسم"
              selected={settings.theme === 'professional'}
              onClick={() => setSettings({ ...settings, theme: 'professional' })}
            />
            <ThemeCard
              title="إبداعي"
              description="Storyscrolling وانتقالات أفقية بين الأقسام؛ البطاقات فوق القسم"
              selected={settings.theme === 'creative'}
              onClick={() => setSettings({ ...settings, theme: 'creative' })}
            />
          </div>
        </div>

        {/* معاينة سريعة */}
        <div className="publish-section">
          <h3 className="publish-h3">معاينة سريعة</h3>
          <div className={`publish-preview ${dynamicClass}`}>
            <div className="publish-themeCardTitle">عنوان مثال</div>
            <p className="publish-themeCardDesc">نص تجريبي لعرض الخط والألوان.</p>
            <button className="publish-demoBtn">
              زر مثال
            </button>
            {/* بطاقة عائمة تمثل شهادات/قصص */}
            <div className="publish-floatingCard">
              <div className="publish-themeCardTitle">بطاقة توصية</div>
              <div className="publish-themeCardDesc">
                تصميم بحواف ناعمة وبلور وشادو فوق المحتوى.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// عناصر مساعدة بسيطة
const ColorInput: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean }> = ({
  id,
  label,
  value,
  onChange,
  disabled,
}) => (
  <div className="publish-inputCol">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="color" value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} disabled={disabled} aria-label={label} />
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

// خرائط الخطوط (للعرض فقط، التحميل يعتمد على الاستضافة/Google Fonts)
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

// لا توجد أنماط داخلية، تم نقل الأنماط إلى ملف CSS المستورد.

function makeHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0).toString(36).slice(0, 8);
}

function computeBackgroundCSS(settings: SiteSettings): string {
  if (settings.backgroundType === 'solid') return settings.colors.background;
  if (settings.backgroundType === 'gradient' && settings.gradient) {
    return `linear-gradient(${settings.gradient.angle}deg, ${settings.gradient.from}, ${settings.gradient.to})`;
  }
  if (settings.backgroundType === 'image' && settings.backgroundImage) {
    return `url("${settings.backgroundImage}") center/cover no-repeat`;
  }
  return '#ffffff';
}