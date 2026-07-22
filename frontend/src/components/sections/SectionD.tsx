import { EducationBlock } from '../../types';
import { nanoid } from 'nanoid';
import type { TranslationType } from '../../translations';
import { Plus, Trash2 } from 'lucide-react';

type Props = {
  t: TranslationType;
  education: EducationBlock[];
  onChange: (education: EducationBlock[]) => void;
};

function SectionD({ t, education, onChange }: Props) {
  const addQualification = () => {
    onChange([
      ...education,
            {
        id: nanoid(),
        institution: '',
        degree: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        attachedAssetUrl: ''
      },
    ]);
  };

  const updateQualification = (id: string, next: Partial<EducationBlock>) => {
    onChange(education.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };

    const removeQualification = (id: string) => {
    onChange(education.filter((item) => item.id !== id));
  };

  const handleEduFileUpload = async (id: string, file: File) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      alert(t.uploadOnlyTypes);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert(t.uploadTooLarge);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok && data.success) {
        updateQualification(id, { attachedAssetUrl: `private:${data.fileId}` });
      } else {
        alert(data.error || t.uploadFailedGeneric);
      }
    } catch (err) {
      console.error(err);
      alert(t.uploadError);
    }
    };

    const handleEduFileDelete = async (id: string, ref?: string) => {
    try {
      if (!window.confirm(t.confirmDeleteFile)) return;
      if (!ref || !ref.startsWith('private:')) {
        updateQualification(id, { attachedAssetUrl: '' });
        return;
      }
      const fileId = ref.replace('private:', '');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/upload/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        alert(payload.error || t.uploadError);
        return;
      }
      updateQualification(id, { attachedAssetUrl: '' });
    } catch (err) {
      console.error(err);
      alert(t.uploadError);
    }
  };

    // Cross-browser month field without input[type="month"] (keeps linters happy)
  const renderMonthField = (value: string, onValue: (v: string) => void, id?: string) => {
    return (
      <input
        id={id}
        className="input-field mt-2"
        type="text"
        placeholder="YYYY-MM, Now, Present..."
        value={value || ''}
        onChange={(e) => onValue(e.target.value)}
        title="Use format YYYY-MM, or words like Now, Current, etc."
      />
    );
  };


  return (
    <section className="glass-card p-6">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
          <h2 className="section-title">{t.education}</h2>
          <p className="section-description">{t.educationDesc}</p>
        </div>
        <button type="button" className="button-primary" onClick={addQualification} aria-label={t.addEducation} title={t.addEducation}>
          <Plus size={16} />
          <span className="hidden sm:inline">{t.addEducation}</span>
        </button>
      </div>

      <div className="space-y-5">
                {education.length === 0 && (
                  <div className="glass-empty">
                    {t.noEducation}
                  </div>
                )}

                {education.map((qualification, index) => (
                  <div key={qualification.id} className="glass-inner-card p-5">

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-semibold">{t.qualificationNum} {index + 1}</span>

                            <button
                type="button"
                className="button-secondary"
                onClick={() => removeQualification(qualification.id)}
                aria-label={t.delete}
                title={t.delete}
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">{t.delete}</span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-slate-300">{t.instName}</span>
                                <input
                  className="input-field mt-2"
                  value={qualification.institution}
                  onChange={(e) => updateQualification(qualification.id, { institution: e.target.value })}
                  placeholder={t.instPlaceholder}
                />
              </label>

              <label className="block">
                <span className="text-slate-300">{t.degree}</span>
                                <input
                  className="input-field mt-2"
                  value={qualification.degree}
                  onChange={(e) => updateQualification(qualification.id, { degree: e.target.value })}
                  placeholder={t.degreePlaceholder}
                />
              </label>

              <label className="block">
                <span className="text-slate-300">{(t as any).eduLocation || 'City / Country'}</span>
                <input
                  className="input-field mt-2"
                  value={qualification.location || ''}
                  onChange={(e) => updateQualification(qualification.id, { location: e.target.value })}
                  placeholder={(t as any).eduLocationPlaceholder || 'e.g., Cairo, Egypt'}
                />
              </label>

                            <label className="block">
                <span className="text-slate-300">{t.from}</span>
                {renderMonthField(
                  qualification.startDate || '',
                  (v) => updateQualification(qualification.id, { startDate: v }),
                  `edu-start-${qualification.id}`
                )}
              </label>

              <label className="block">
                <span className="text-slate-300">{t.to}</span>
                {renderMonthField(
                  qualification.endDate || '',
                  (v) => updateQualification(qualification.id, { endDate: v }),
                  `edu-end-${qualification.id}`
                )}
              </label>


              <label className="block md:col-span-3">
                <span className="text-slate-300">{t.degreeDesc}</span>
                                <textarea
                  className="textarea-field mt-2"
                  value={qualification.description}
                  onChange={(e) => updateQualification(qualification.id, { description: e.target.value })}
                  placeholder={t.degreeDescPlaceholder}
                />
              </label>
            </div>

            <div className="mt-4 md:col-span-3">
              <span className="text-slate-300 block mb-2">{t.proofDoc}</span>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  id={`edu-file-upload-${qualification.id}`}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleEduFileUpload(qualification.id, e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor={`edu-file-upload-${qualification.id}`} className="button-secondary cursor-pointer">
                  {t.chooseFile}
                </label>
                                {qualification.attachedAssetUrl ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sky-400 text-sm">{t.secureStored}</span>
                    <button
                      type="button"
                      className="button-secondary px-3 py-1 text-xs"
                      onClick={() => handleEduFileDelete(qualification.id, qualification.attachedAssetUrl)}
                    >
                      {t.removeFile}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">{t.noDocUploaded}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SectionD;
