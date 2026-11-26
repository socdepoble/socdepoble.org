/**
 * rutaDePindola.js — IDEA-365 (v1.2.26 · Micro-helper pur compartit entre
 * UniversalCard.jsx i PageFrame.jsx per garantir píndoles 100 % clicables).
 *
 * Sense imports externs; taula compactada per minimitzar el pes al nucli WP.
 */
const RUTES = {};
for (const [desti, claus] of [
  ['/categoria/sistema', 'sistema'],
  ['/mur', 'mur muro wall horma'],
  ['/mercat', 'mercat mercado market merkatua'],
  ['/calendari', 'calendari calendario calendar egutegia agenda esdeveniments'],
  ['/mapa', 'mapa map'],
  ['/categoria/transport', 'transport'],
  ['/vehicle', 'vehicle-compartit vehicle'],
  ['/categoria/animalets', 'animalets'],
  ['/treball', 'treball trabajo work lana traballo'],
  ['/habitatge', 'habitatge vivienda housing etxebizitza vivenda'],
  ['/categoria/catalegs', 'catalegs catalogos catalogues katalogoak'],
  ['/categoria/video', 'video'],
  ['/categoria/pdf', 'pdf'],
  ['/disseny', 'disseny diseno design diseinua deseno'],
  ['/pobles', 'pobles poble'],
  ['/xat', 'xat'],
  ['/wikidepoble', 'wikidepoble wiki-de-poble wiki']
]) {
  for (const clau of claus.split(' ')) RUTES[clau] = desti;
}

export function slugDePindola(valor) {
  return String(valor || '')
    .slice(0, 160)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Resol el destí clicable d'una píndola. Respecta `href` explícit o `inerta: true` / `href: false`. */
export function rutaDePindola(label) {
  if (label == null) return null;
  if (typeof label === 'object') {
    if (label.inerta === true || label.href === false) return null;
    if (typeof label.href === 'string' && label.href.trim()) return label.href.trim();
  }
  const slug = slugDePindola(typeof label === 'string' ? label : label.text);
  if (!slug) return null;
  if (Object.hasOwn(RUTES, slug)) return RUTES[slug];
  const cls = typeof label === 'object' && typeof label.className === 'string' ? label.className : '';
  return /\bsdp-badge-(system|category)\b/.test(cls) ? `/categoria/${slug}` : `/etiqueta/${slug}`;
}
