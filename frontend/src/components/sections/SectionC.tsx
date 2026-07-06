import { useState } from 'react';
import { ExperienceBlock, PersonalDetails } from '../../types';
import { nanoid } from 'nanoid';
import type { TranslationType } from '../../translations';
import { Plus, Trash2, Send } from 'lucide-react';

type Props = {
  t: TranslationType;
  personal: PersonalDetails;
  experiences: ExperienceBlock[];
  onChange: (experiences: ExperienceBlock[]) => void;
};

function SectionC({ t, personal, experiences, onChange }: Props) {
  const [requestStatus, setRequestStatus] = useState('');

  const sanitizeSlug = (source: string) => {
    return source
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'peopleos-portfolio';
  };

    // Removed mailto fallback builder to keep flows localized and secure

    const requestEndorsement = async (experience: ExperienceBlock) => {
    if (!personal.fullName || !personal.email) {
      setRequestStatus(t.requestStatusMissingPersonal);
      return;
    }

    setRequestStatus(t.requestStatusCreatingLink);

    const requestorPortfolioSlug = sanitizeSlug(personal.fullName || personal.email || 'peopleos');

    try {
      const response = await fetch('/api/endorsements/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestorFullName: personal.fullName,
          requestorEmail: personal.email,
          requestorJobTitle: personal.jobTitle || 'Professional Contributor',
          requestorPortfolioSlug,
          requestorExperienceTitle: experience.title || experience.company || 'Work Experience',
          requestorCompanyName: experience.company || 'Company',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setRequestStatus(payload.error || t.requestStatusServerFailed);
        return;
      }

      window.location.href = payload.data.mailtoLink;
      setRequestStatus(t.requestStatusMailDraftOpened);
    } catch (error) {
      console.error(error);
      setRequestStatus(t.serverError);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedExp, setSelectedExp] = useState<ExperienceBlock | null>(null);
  const [endorserName, setEndorserName] = useState('');
  const [endorserEmail, setEndorserEmail] = useState('');
  const [endorserTitle, setEndorserTitle] = useState('');
  const [endorserCompany, setEndorserCompany] = useState('');
  const [modalStatus, setModalStatus] = useState('');

  const addBlock = () => {
    onChange([
      ...experiences,
            {
        id: nanoid(),
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
        attachedAssetUrl: '',
        successStory: ''
      },
    ]);
  };

  const updateBlock = (id: string, next: Partial<ExperienceBlock>) => {
    onChange(experiences.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };

    const removeBlock = (id: string) => {
    onChange(experiences.filter((item) => item.id !== id));
  };

    const handleDeleteFile = async (id: string, ref?: string) => {
    try {
      if (!window.confirm(t.confirmDeleteFile)) return;
      if (!ref || !ref.startsWith('private:')) {
        updateBlock(id, { attachedAssetUrl: '' });
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
      updateBlock(id, { attachedAssetUrl: '' });
    } catch (err) {
      console.error(err);
      alert(t.uploadError);
    }
  };

    const handleFileUpload = async (id: string, file: File) => {
    // Client-side validation for UX (server enforces too)
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Store opaque reference only; no public URL is exposed
        updateBlock(id, { attachedAssetUrl: `private:${data.fileId}` });
      } else {
        alert(data.error || t.uploadFailedGeneric);
      }
    } catch (err) {
      console.error(err);
      alert(t.uploadError);
    }
  };

  const openRecommendationModal = (experience: ExperienceBlock) => {
    setSelectedExp(experience);
    setEndorserCompany(experience.company || '');
    setEndorserTitle('');
    setEndorserName('');
    setEndorserEmail('');
    setModalStatus('');
    setShowModal(true);
  };

  const handleSendRecommendationRequest = async () => {
        if (!endorserName || !endorserEmail || !endorserTitle || !endorserCompany) {
      setModalStatus(t.modalFillAll);
      return;
    }

    setModalStatus(t.modalSending);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/endorsements/send-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endorserName,
          endorserEmail,
          endorserTitle,
          company: endorserCompany,
          experienceTitle: selectedExp?.title || 'Work Experience',
          experienceBlockId: selectedExp?.id
        })
      });

      const data = await response.json();
            if (response.ok && data.success) {
        setModalStatus(t.modalSuccess);
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setModalStatus(data.error || t.modalFailed);
      }
    } catch (err) {
      console.error(err);
      setModalStatus(t.serverError);
    }
  };

    // Cross-browser month field without input[type="month"] (keeps linters happy)
  const renderMonthField = (value: string, onValue: (v: string) => void, id?: string) => {
    return (
      <input
        id={id}
        className="input-field mt-2"
        type="text"
        inputMode="numeric"
        pattern="\d{4}-(0[1-9]|1[0-2])"
        placeholder="YYYY-MM"
        value={(value || '').slice(0,7)}
        onChange={(e) => onValue(e.target.value)}
        title="Use format YYYY-MM, e.g., 2023-09"
      />
    );
  };


  return (
    <section className="glass-card p-6 overflow-hidden break-words">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
          <h2 className="section-title">{t.experiences}</h2>
          <p className="section-description">{t.experiencesDesc}</p>
        </div>
        <button type="button" className="button-primary" onClick={addBlock} aria-label={t.addExperience} title={t.addExperience}>
          <Plus size={16} />
          <span className="hidden sm:inline">{t.addExperience}</span>
        </button>
      </div>

      <div className="space-y-5">
                {experiences.length === 0 && (
                  <div className="glass-empty">
                    {t.noExperiences}
                  </div>
                )}

                {experiences.map((experience, index) => (
                  <div key={experience.id} className="glass-inner-card p-5 overflow-hidden break-words">

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                          <span className="font-semibold">{t.experienceNum} {index + 1}</span>

              <button
                type="button"
                className="button-secondary"
                onClick={() => removeBlock(experience.id)}
                aria-label={t.deleteBlock}
                title={t.deleteBlock}
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">{t.deleteBlock}</span>
              </button>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-slate-300">{t.jobTitle}</span>
                <input
                                    className="input-field mt-2"
                  value={experience.title}
                  onChange={(e) => updateBlock(experience.id, { title: e.target.value })}
                  placeholder={t.jobTitlePlaceholder}
                />
              </label>

                            <label className="block">
                <span className="text-slate-300">{t.company}</span>
                <input
                                    className="input-field mt-2"
                  value={experience.company}
                  onChange={(e) => updateBlock(experience.id, { company: e.target.value })}
                  placeholder={t.companyPlaceholder}
                />
              </label>

              <label className="block">
                <span className="text-slate-300">{t.companyLocation}</span>
                <input
                  className="input-field mt-2"
                  value={experience.location || ''}
                  onChange={(e) => updateBlock(experience.id, { location: e.target.value })}
                  placeholder={t.companyLocationPlaceholder}
                />
              </label>

                            <label className="block">
                <span className="text-slate-300">{t.startDate}</span>
                {renderMonthField(
                  experience.startDate || '',
                  (v) => updateBlock(experience.id, { startDate: v }),
                  `exp-start-${experience.id}`
                )}
              </label>

              <label className="block">
                <span className="text-slate-300">{t.endDate}</span>
                {renderMonthField(
                  experience.endDate || '',
                  (v) => updateBlock(experience.id, { endDate: v }),
                  `exp-end-${experience.id}`
                )}
              </label>


              <label className="block md:col-span-2">
                <span className="text-slate-300">{t.jobDesc}</span>
                <textarea
                                    className="textarea-field mt-2"
                  value={experience.description}
                  onChange={(e) => updateBlock(experience.id, { description: e.target.value })}
                  placeholder={t.jobDescPlaceholder}
                />
              </label>

              <div className="block md:col-span-2">
                <span className="text-slate-300 block mb-2">{t.proofDoc}</span>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id={`file-upload-${experience.id}`}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(experience.id, e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor={`file-upload-${experience.id}`}
                                        className="button-secondary cursor-pointer"
                  >
                    {t.chooseFile}
                                    </label>
                  {experience.attachedAssetUrl ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sky-400 text-sm">{t.secureStored}</span>
                      <button
                        type="button"
                        className="button-secondary px-3 py-1 text-xs"
                        onClick={() => handleDeleteFile(experience.id, experience.attachedAssetUrl)}
                      >
                        {t.removeFile}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">{t.noDocUploaded}</span>
                  )}
                </div>
              </div>

              <label className="block md:col-span-2">
                                <span className="text-slate-300">{t.successStoryLabel}</span>
                <textarea
                  className="textarea-field mt-2 min-h-[100px]"
                  value={experience.successStory || ''}
                  onChange={(e) => updateBlock(experience.id, { successStory: e.target.value })}
                  placeholder={t.successStoryPlaceholder}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                type="button"
                className="button-primary"
                onClick={() => openRecommendationModal(experience)}
                aria-label={t.requestEndorsement}
                title={t.requestEndorsement}
              >
                <Send size={16} className="hidden sm:inline" />
                <span>{t.requestEndorsement}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                    <div className="glass-inner-card relative max-w-lg w-full p-6">

                        <h3 className="text-xl font-bold text-white mb-4">{t.requestModalTitle}</h3>
            <p className="text-sm text-slate-300 mb-6">
              {t.requestModalDesc}
            </p>
            
            <div className="space-y-4">
              <label className="block">
                                <span className="text-slate-300 text-sm">{t.endorserName}</span>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={endorserName}
                  onChange={(e) => setEndorserName(e.target.value)}
                  placeholder={t.endorserName}
                />
              </label>
              
              <label className="block">
                                <span className="text-slate-300 text-sm">{t.endorserEmail}</span>
                <input
                  type="email"
                  className="input-field mt-1"
                  value={endorserEmail}
                  onChange={(e) => setEndorserEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </label>

              <label className="block">
                                <span className="text-slate-300 text-sm">{t.endorserTitle}</span>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={endorserTitle}
                  onChange={(e) => setEndorserTitle(e.target.value)}
                  placeholder={t.endorserTitle}
                />
              </label>

              <label className="block">
                                <span className="text-slate-300 text-sm">{t.endorserCompany}</span>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={endorserCompany}
                  onChange={(e) => setEndorserCompany(e.target.value)}
                  placeholder={t.endorserCompany}
                />
              </label>

              {modalStatus && (
                <p className="text-sm text-sky-400 mt-2">{modalStatus}</p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowModal(false)}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleSendRecommendationRequest}
                >
                  {t.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SectionC;

