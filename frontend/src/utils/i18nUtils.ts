export const parseI18nText = (text: string | null | undefined, lang: string) => {
  if (!text) return '';
  const parts = text.split(/\||｜/);
  if (parts.length === 1) return text;
  if (lang.startsWith('en')) return parts[1] || parts[0];
  if (lang.startsWith('ja')) return parts[2] || parts[0];
  return parts[0];
};
