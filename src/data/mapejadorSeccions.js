import { sanitizeHtml, netejaText } from '../utils/sanitize.js';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const normalizeText = (value) =>
  String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const firstAsset = (value) => (Array.isArray(value) ? value[0] || null : value || null);
const buildSearchText = (parts) => normalizeText(parts.filter(Boolean).join(' '));

function validaUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('data:image/')) return s;
  if (s.startsWith('//')) return null; // Bloquejar protocol-relative (Z audit)
  if (s.startsWith('/') || s.startsWith('./')) return s;
  try {
    const p = new URL(s);
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch {
    return null;
  }
}

export function mapSectionSubmissionToItem(submission) {
  const payload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const sectionId = netejaText(submission?.sectionId || payload.sectionId || '');
  const createdAt = netejaText(submission?.createdAt || payload.created_at || new Date().toISOString());

  const baseItem = {
    ...payload,
    id: netejaText(payload.id || submission.id || generateUUID()),
    sectionId,
    created_at: payload.created_at || createdAt
  };

  if (sectionId === 'mur') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'post'),
      title: netejaText(baseItem.title || 'Publicació'),
      summary: netejaText(baseItem.summary || baseItem.post_subtitle || baseItem.description || ''),
      content: sanitizeHtml(baseItem.content || baseItem.description || baseItem.post_subtitle || ''),
      post_subtitle: netejaText(baseItem.post_subtitle || baseItem.description || ''),
      author: netejaText(baseItem.author || baseItem.author_name || 'Foraster'),
      author_name: netejaText(baseItem.author_name || baseItem.author || 'Foraster'),
      author_avatar: validaUrl(baseItem.author_avatar || baseItem.avatar_url),
      town_name: netejaText(baseItem.town_name || 'La Torre de les Maçanes'),
      imageSrc: validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url)),
      image_url: validaUrl(baseItem.image_url || baseItem.image || baseItem.imageSrc),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.post_subtitle, baseItem.description, baseItem.content,
        baseItem.author, baseItem.town_name, baseItem.tag, baseItem.sectionId
      ]))
    };
  }

  if (sectionId === 'mercat') {
    const imageSrc = validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url));
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'product'),
      title: netejaText(baseItem.title || 'Producte'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      summary: netejaText(baseItem.summary || baseItem.description || ''),
      seller: netejaText(baseItem.seller || baseItem.author_name || 'Foraster'),
      avatar_url: validaUrl(baseItem.avatar_url),
      imageSrc,
      image_url: validaUrl(baseItem.image_url || baseItem.image || imageSrc),
      image: validaUrl(baseItem.image || imageSrc),
      category_slug: netejaText(baseItem.category_slug || 'connectat'),
      tag: netejaText(baseItem.tag || 'Connectat'),
      variations: Array.isArray(baseItem.variations) ? baseItem.variations.map(netejaText) : [],
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.seller, baseItem.tag, baseItem.sectionId
      ]))
    };
  }

  if (sectionId === 'events') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'event'),
      title: netejaText(baseItem.title || 'Acte'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      summary: netejaText(baseItem.summary || baseItem.description || ''),
      author_name: netejaText(baseItem.author_name || baseItem.author || 'Foraster'),
      date: netejaText(baseItem.date || createdAt.slice(0, 10)),
      image_url: validaUrl(baseItem.image_url),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.author_name, baseItem.type
      ]))
    };
  }

  if (sectionId === 'multimedia') {
    const imageSrc = validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url));
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'media'),
      title: netejaText(baseItem.title || 'Arxiu Multimèdia'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      tag: netejaText(baseItem.tag || 'Multimèdia'),
      source: netejaText(baseItem.source || baseItem.author_name || 'Usuari'),
      src: validaUrl(baseItem.src || imageSrc),
      created_at: netejaText(baseItem.created_at || createdAt),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.tag, baseItem.source
      ]))
    };
  }

  if (sectionId === 'notes') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'note'),
      title: netejaText(baseItem.title || 'Nota Nova'),
      content: sanitizeHtml(baseItem.content || baseItem.description || baseItem.summary || ''),
      plainText: netejaText(baseItem.plainText || baseItem.description || baseItem.summary || ''),
      category: netejaText(baseItem.category || 'General'),
      tags: Array.isArray(baseItem.tags) ? baseItem.tags.map(netejaText) : [],
      folderId: netejaText(baseItem.folderId || 'f-root'),
      updatedAt: netejaText(baseItem.updatedAt || baseItem.created_at || createdAt),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.content, baseItem.category
      ]))
    };
  }

  return baseItem;
}

export function mergeById(primary = [], secondary = []) {
  const map = new Map();
  // El més vell primer, el més nou (per updated_at o created_at) esclafa.
  [...primary, ...secondary].forEach((item) => {
    if (!item) return;
    const existing = map.get(String(item.id));
    if (existing) {
      const t1 = new Date(existing.updated_at || existing.updatedAt || existing.created_at || 0).getTime();
      const t2 = new Date(item.updated_at || item.updatedAt || item.created_at || 0).getTime();
      if (t2 >= t1) map.set(String(item.id), item);
    } else {
      map.set(String(item.id), item);
    }
  });
  return Array.from(map.values());
}
