import { SkillSet } from '../../types';
import type { TranslationType } from '../../translations';

type Props = {
  t: TranslationType;
  skills: SkillSet;
  onChange: (skills: SkillSet) => void;
};

function SectionE({ t, skills, onChange }: Props) {
  return (
    <section className="glass-card p-6">
            <div className="mb-6">
        <h2 className="section-title">{t.skills}</h2>
        <p className="section-description">{t.skillsDesc}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="text-slate-300">{t.technicalSkills}</span>
          <textarea
            className="textarea-field mt-2"
            value={skills.technical}
            onChange={(e) => onChange({ ...skills, technical: e.target.value })}
            placeholder={t.technicalPlaceholder}
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{t.interpersonalSkills}</span>
          <textarea
            className="textarea-field mt-2"
            value={skills.interpersonal}
            onChange={(e) => onChange({ ...skills, interpersonal: e.target.value })}
            placeholder={t.interpersonalPlaceholder}
          />
        </label>

        <label className="block">
          <span className="text-slate-300">{t.workRelatedSkills}</span>
          <textarea
            className="textarea-field mt-2"
            value={skills.workRelated}
            onChange={(e) => onChange({ ...skills, workRelated: e.target.value })}
            placeholder={t.workRelatedPlaceholder}
          />
        </label>
      </div>
    </section>
  );
}

export default SectionE;
