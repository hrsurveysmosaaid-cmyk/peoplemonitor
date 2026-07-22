import { useEffect, useState } from 'react';
import { PersonalDetails, LanguageEntry } from '../../types';
import type { TranslationType } from '../../translations';
import { nanoid } from 'nanoid';
import { Plus, Trash2 } from 'lucide-react';


type Props = {
  t: TranslationType;
  personal: PersonalDetails;
  onChange: (personal: PersonalDetails) => void;
};

function SectionA({ t, personal, onChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const ref = personal.profileImageUrl;
    if (!ref) {
      setPreviewUrl('');
      return;
    }
    if (typeof ref === 'string' && ref.startsWith('private:')) {
      const url = `/api/assets/signed?ref=${encodeURIComponent(ref)}`;
      fetch(url)
        .then((r) => r.json())
        .then((p) => {
          if (p && p.success && p.url) setPreviewUrl(p.url);
          else setPreviewUrl('');
        })
        .catch(() => setPreviewUrl(''));
    } else {
      setPreviewUrl(ref);
    }
  }, [personal.profileImageUrl]);

  const handleProfileImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined as any,
        body: formData
      });
            const data = await response.json();
      if (response.ok && data.success) {
        const fileId = data.fileId || data.filename || data.fileName;
        const ref = fileId ? `private:${fileId}` : '';
        onChange({ ...personal, profileImageUrl: ref });
        if (ref) {
          try {
            const signedRes = await fetch(`/api/assets/signed?ref=${encodeURIComponent(ref)}`);
            const payload = await signedRes.json();
            if (payload && payload.success && payload.url) {
              setPreviewUrl(payload.url);
            }
          } catch {}
        } else {
          setPreviewUrl('');
        }
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading image');
    }
  };

  return (
    <section className="glass-card p-6">
      <div className="mb-6">
        <h2 className="section-title">{t.personalDetails}</h2>
        <p className="section-description">{t.personalDetailsDesc}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Required fields */}
        {/* Full name with inline prefix selector (like phone country code) */}
        <label className="block">
          <span className="text-slate-300">{t.fullName} <span className="text-rose-400">*</span></span>
          <div className="mt-2 flex items-center gap-3">
            <select
              className="select-prefix w-fit flex-none whitespace-nowrap"
              aria-label={t.prefix}
              value={personal.prefix || ''}
              onChange={(e) => onChange({ ...personal, prefix: e.target.value as PersonalDetails['prefix'] })}
            >
              <option value="">{t.prefix}</option>
              <option value="Mr.">{t.prefixMr}</option>
              <option value="Ms.">{t.prefixMs}</option>
              <option value="Miss">{t.prefixMiss}</option>
              <option value="Mis.">{(t as any).prefixMis || 'Mis.'}</option>
            </select>
            <input
              className="input-field flex-1 min-w-0"
              value={personal.fullName}
              onChange={(e) => onChange({ ...personal, fullName: e.target.value })}
              placeholder={t.fullName}
              required
              
            />
          </div>
        </label>

        <label className="block">
          <span className="text-slate-300">{t.email} <span className="text-rose-400">*</span></span>
          <input
            className="input-field mt-2"
            type="email"
            value={personal.email}
            onChange={(e) => onChange({ ...personal, email: e.target.value })}
            placeholder="example@peopleos.online"
            required
            
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{t.phone} <span className="text-rose-400">*</span></span>
          <input
            className="input-field mt-2"
            type="tel"
            value={personal.phone}
            onChange={(e) => onChange({ ...personal, phone: e.target.value })}
            placeholder={t.phone}
            required
            
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{t.location} <span className="text-rose-400">*</span></span>
          <input
            className="input-field mt-2"
            value={personal.location}
            onChange={(e) => onChange({ ...personal, location: e.target.value })}
            placeholder={t.location}
            required
            
          />
        </label>

        {/* Optional fields */}
                <label className="block">
          <span className="text-slate-300">{t.jobTitle} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.jobTitle}
            onChange={(e) => onChange({ ...personal, jobTitle: e.target.value })}
            placeholder={t.jobTitle}
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{(t as any).availability || 'حالة التوفر'} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <select
            className="input-field mt-2"
            value={personal.availability || 'open'}
            onChange={(e) => onChange({ ...personal, availability: e.target.value as any })}
          >
            <option value="open">{(t as any).availabilityOpen || 'Open to work'}</option>
            <option value="freelance">{(t as any).availabilityFreelance || 'Available for freelance'}</option>
            <option value="consulting">{(t as any).availabilityConsulting || 'Available for contracts & consulting'}</option>
          </select>
        </label>


        <label className="block">
          <span className="text-slate-300">{t.residencyStatus} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.residencyStatus || ''}
            onChange={(e) => onChange({ ...personal, residencyStatus: e.target.value })}
            placeholder={t.residencyStatusPlaceholder || ''}
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{t.nationality} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.nationality || ''}
            onChange={(e) => onChange({ ...personal, nationality: e.target.value })}
            placeholder={t.nationalityPlaceholder || ''}
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{(t as any).birthDate || 'تاريخ الميلاد'} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            type="date"
            value={personal.birthYear ? `${personal.birthYear}-${String(personal.birthMonth || '01').padStart(2,'0')}-${String(personal.birthDay || '01').padStart(2,'0')}` : ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                onChange({ ...personal, birthYear: '', birthMonth: '', birthDay: '' });
                return;
              }
              const [yy, mm, dd] = v.split('-');
              onChange({
                ...personal,
                birthYear: yy || '',
                birthMonth: mm || '',
                birthDay: dd || ''
              });
            }}
          />
        </label>



        <div className="block">
          <span className="text-slate-300">{t.profileImgUrl} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <div className="mt-2 flex items-center gap-4">
            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProfileImageUpload(file);
              }}
            />
                        <label htmlFor="profile-image-input" className="button-secondary cursor-pointer">
              {personal.profileImageUrl ? (t.changeImage || 'Change Image') : (t.uploadImage || 'Upload Image')}
            </label>
            {personal.profileImageUrl && (
              <>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 text-sm hover:underline"
                  >
                    {t.viewUploaded || 'View'}
                  </a>
                )}
                <button
                  type="button"
                  className="button-secondary px-3 py-2 text-xs"
                  onClick={() => {
                    onChange({ ...personal, profileImageUrl: '' });
                    setPreviewUrl('');
                    const el = document.getElementById('profile-image-input') as HTMLInputElement | null;
                    if (el) el.value = '';
                  }}
                  aria-label={t.removeImage || 'Remove Image'}
                  title={t.removeImage || 'Remove Image'}
                >
                  {t.removeImage || 'Remove Image'}
                </button>
              </>
            )}

          </div>
          {personal.profileImageUrl && previewUrl && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="profile" className="h-20 w-20 rounded-2xl object-cover border border-white/10" />
            </div>
          )}

        </div>

        <label className="block">
          <span className="text-slate-300">{t.website} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.website}
            onChange={(e) => onChange({ ...personal, website: e.target.value })}
            placeholder="https://peopleos.online"
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{t.linkedin} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.linkedin}
            onChange={(e) => onChange({ ...personal, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/username"
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{t.github} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.github}
            onChange={(e) => onChange({ ...personal, github: e.target.value })}
            placeholder="https://github.com/username"
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{(t as any).behance || 'Behance'} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.behance}
            onChange={(e) => onChange({ ...personal, behance: e.target.value })}
            placeholder={(t as any).behancePlaceholder || 'Behance profile link'}
          />
        </label>

        <label className="block lg:col-span-3">
          <span className="text-slate-300">{(t as any).videoPitchUrlLabel || 'فيديو تعريفي (Video Pitch Link)'} <span className="text-slate-500 text-xs">({t.optional || 'Optional'})</span></span>
          <input
            className="input-field mt-2"
            value={personal.videoPitchUrl || ''}
            onChange={(e) => onChange({ ...personal, videoPitchUrl: e.target.value })}
            placeholder={(t as any).videoPitchUrlPlaceholder || 'YouTube / Drive / Vimeo URL (e.g. https://www.youtube.com/watch?v=...)'}
          />
        </label>

        {/* Languages */}
        <div className="block lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-slate-300">{(t as any).languagesLabel || 'Languages'}</span>
              <p className="text-xs text-slate-500 mt-0.5">{(t as any).languagesDesc || 'Add languages you speak and your proficiency level.'}</p>
            </div>
            <button
              type="button"
              className="button-secondary text-xs px-3 py-2"
              onClick={() => {
                const langs: LanguageEntry[] = personal.languages || [];
                onChange({ ...personal, languages: [...langs, { language: '', proficiency: '' }] });
              }}
            >
              <Plus size={14} />
              <span className="ml-1">{(t as any).addLanguage || 'Add Language'}</span>
            </button>
          </div>

          {(!personal.languages || personal.languages.length === 0) && (
            <p className="text-sm text-slate-500">{(t as any).noLanguages || 'No languages added yet.'}</p>
          )}

          <div className="space-y-3">
            {(personal.languages || []).map((langEntry, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  className="input-field flex-1"
                  value={langEntry.language}
                  onChange={(e) => {
                    const updated = [...(personal.languages || [])];
                    updated[idx] = { ...updated[idx], language: e.target.value };
                    onChange({ ...personal, languages: updated });
                  }}
                  placeholder={(t as any).languageNamePlaceholder || 'e.g., English, Arabic'}
                />
                <input
                  className="input-field flex-1"
                  value={langEntry.proficiency}
                  onChange={(e) => {
                    const updated = [...(personal.languages || [])];
                    updated[idx] = { ...updated[idx], proficiency: e.target.value };
                    onChange({ ...personal, languages: updated });
                  }}
                  placeholder={(t as any).languageProficiencyPlaceholder || 'e.g., Native, Fluent'}
                />
                <button
                  type="button"
                  className="button-secondary p-2"
                  onClick={() => {
                    const updated = (personal.languages || []).filter((_, i) => i !== idx);
                    onChange({ ...personal, languages: updated });
                  }}
                  aria-label="Remove language"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default SectionA;


