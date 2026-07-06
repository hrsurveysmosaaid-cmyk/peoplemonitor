import ReactMarkdown from 'react-markdown';
import type { TranslationType } from '../../translations';

type Props = {
  t: TranslationType;
  summary: string;
  onChange: (summary: string) => void;
};

function SectionB({ t, summary, onChange }: Props) {
  return (
    <section className="glass-card p-6">
      <div className="mb-6">
        <h2 className="section-title">{t.summary}</h2>
        <p className="section-description">{t.summaryDesc}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <label className="block">
          <span className="text-slate-300">{t.markdownInput}</span>
          <textarea
            className="textarea-field mt-2 font-medium"
            value={summary}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t.previewPlaceholder}
          />
        </label>

                <div className="glass-inner-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold">{t.markdownPreview}</span>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">Live</span>
                  </div>
                  <div className="prose max-w-none space-y-4 text-sm leading-7 prose-slate dark:prose-invert">

            <ReactMarkdown>{summary || t.previewPlaceholder}</ReactMarkdown>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SectionB;

