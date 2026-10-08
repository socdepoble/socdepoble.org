/* Auditoria 261007 (B) \u00b7 S'han retirat stripAccents (malgrat el nom, feia un
   slug: \u00abS\u00f3c de Poble\u00bb \u2192 \u00absoc-de-poble\u00bb) i formatMonthLabel: cap consumidor,
   ni a les proves. Per a la cerca, normalizeSearchText. */
export const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const buildSearchText = (parts) => normalizeSearchText(parts.filter(Boolean).join(' '));

export const byId = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const id = item?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const stripMarkdownImages = (value) => String(value || '').replace(/!\[[^\]]*\]\([^)]+\)/g, '');
export const firstMediaSource = (value) => (Array.isArray(value) ? value[0] || null : value || null);

export const toFeedSummary = (value) =>
  stripMarkdownImages(value)
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, 220);

export const toMediaDescription = (value) => stripMarkdownImages(value).slice(0, 180);

export const sortPinnedContent = (items) =>
  [...items].sort((a, b) => {
    const pinA = a.pinned_position ?? (a.is_pinned ? 0 : 99);
    const pinB = b.pinned_position ?? (b.is_pinned ? 0 : 99);
    if (pinA !== pinB) return pinA - pinB;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

export const sortDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};
