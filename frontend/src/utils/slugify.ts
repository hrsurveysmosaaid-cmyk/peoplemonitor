export function slugify(input: string): string {
  const normalized = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
