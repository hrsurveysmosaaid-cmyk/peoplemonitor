import { DynamicItem } from '../../types';
import { nanoid } from 'nanoid';
import type { TranslationType } from '../../translations';
import { Plus, Trash2 } from 'lucide-react';

type Props = {
  t: TranslationType;
  items: DynamicItem[];
  onChange: (items: DynamicItem[]) => void;
};

function SectionF({ t, items, onChange }: Props) {
  const addItem = () => {
    onChange([
      ...items,
      {
        id: nanoid(),
        type: 'project',
        title: '',
        description: '',
        link: '',
      },
    ]);
  };

  const updateItem = (id: string, next: Partial<DynamicItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <section className="glass-card p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
          <h2 className="section-title">{t.additional}</h2>
          <p className="section-description">{t.additionalDesc}</p>
        </div>
        <button type="button" className="button-primary" onClick={addItem} aria-label={t.addItem} title={t.addItem}>
          <Plus size={16} />
          <span className="hidden sm:inline">{t.addItem}</span>
        </button>
      </div>

      <div className="space-y-5">
                {items.length === 0 && (
                  <div className="glass-empty">
                    {t.noAdditional}
                  </div>
                )}

                {items.map((item, index) => (
                  <div key={item.id} className="glass-inner-card p-5">

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-semibold">{t.itemNum} {index + 1}</span>

                            <button
                type="button"
                className="button-secondary"
                onClick={() => removeItem(item.id)}
                aria-label={t.delete}
                title={t.delete}
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">{t.delete}</span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-slate-300">{t.type}</span>
                <select
                  className="input-field mt-2"
                  value={item.type}
                  onChange={(e) => updateItem(item.id, { type: e.target.value as DynamicItem['type'] })}
                >
                                    <option value="project">{t.project}</option>
                  <option value="award">{t.award}</option>
                  <option value="volunteer">{t.volunteer}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-slate-300">{t.titleLabel}</span>
                                <input
                  className="input-field mt-2"
                  value={item.title}
                  onChange={(e) => updateItem(item.id, { title: e.target.value })}
                  placeholder={t.titlePlaceholder}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-slate-300">{t.descLabel}</span>
                                <textarea
                  className="textarea-field mt-2"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder={t.descPlaceholder}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-slate-300">{t.link}</span>
                                <input
                  className="input-field mt-2"
                  value={item.link}
                  onChange={(e) => updateItem(item.id, { link: e.target.value })}
                  placeholder={t.linkPlaceholder}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SectionF;
