// Slugify يدعم العربية: يبقي أحرف العربية واللاتينية والأرقام ويحوّل الفراغات والرموز إلى شرطات
export function slugify(input: string): string {
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, ''); // remove diacritics

  // Keep Arabic \u0600-\u06FF, letters, numbers; replace others with hyphen
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') // non allowed chars -> '-'
    .replace(/^-+|-+$/g, '')                  // trim '-'
    .replace(/-{2,}/g, '-');                  // collapse
}