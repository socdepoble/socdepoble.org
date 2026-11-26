import { normalitzaUnicodeSegura } from '../utils/normalitzaUnicodeSegura.js';

/* Auditoria 261007 (B) \u00b7 S'han retirat stripAccents (malgrat el nom, feia un
   slug: \u00abS\u00f3c de Poble\u00bb \u2192 \u00absoc-de-poble\u00bb) i formatMonthLabel: cap consumidor,
   ni a les proves. Per a la cerca, normalizeSearchText. */
export const normalizeSearchText = (value) =>
  normalitzaUnicodeSegura(String(value || '').toLowerCase(), 'NFD')
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

/* Auditoria de seguretat 261019 (R1, R2 i R4) · Llevar d'un text les imatges
   Markdown, els blocs <script> i <style> i les etiquetes, en temps lineal. Les
   expressions d'abans eren quadràtiques: amb moltes obertures ('![', '<script',
   '<') i cap tancament, cada obertura tornava a recórrer el text sencer fins al
   final. Un cos de publicació o de producte així congelava /cerca, el Mur i
   Multimèdia per a tot el poble (160.000 '<': uns 10 s). Cada funció torna
   exactament el mateix que l'expressió que substituïx (fuzz diferencial a
   contentHelpers.seguretat.test.js). */

/* La primera posició on comença `buscat` (un text, o una expressió global)
   des de `des`, per a preguntes amb un `des` que mai no recula: mentre la
   resposta d'abans encara cau endavant, val, i cada caràcter del text es mira
   un nombre fitat de vegades. */
export function cercadorEndavant(text, buscat) {
  let trobat = -2;
  return (des) => {
    if (trobat === -2 || (trobat !== -1 && trobat < des)) {
      if (typeof buscat === 'string') {
        trobat = text.indexOf(buscat, des);
      } else {
        buscat.lastIndex = des;
        trobat = buscat.exec(text)?.index ?? -1;
      }
    }
    return trobat;
  };
}

/* Abans: /!\[[^\]]*\]\([^)]+\)/g → ''. Compartit amb [text](url) i [[wiki|etiqueta]] (IDEA-357), lineal O(n). */
function treuCorxets(s, img) {
  const m = img ? '![' : '[';
  let i = s.indexOf(m);
  if (i < 0) return s;
  const c = cercadorEndavant(s, ']');
  const p = cercadorEndavant(s, ')');
  const w = img ? null : cercadorEndavant(s, ']]');
  let r = '';
  let f = 0;
  for (; i >= 0; i = s.indexOf(m, i)) {
    if (!img && s[i + 1] === '[') {
      const k = w(i + 2);
      if (k >= 0) {
        const d = s.slice(i + 2, k);
        r += s.slice(f, i) + d.slice(d.indexOf('|') + 1);
        i = f = k + 2;
        continue;
      }
    }
    const t = c(i + m.length);
    if (t < 0) break;
    if (s[t + 1] === '(') {
      const k = p(t + 2);
      if (k < 0) break;
      if (k > t + 2) {
        r += s.slice(f, i) + (img ? '' : s.slice(i + 1, t));
        i = f = k + 1;
        continue;
      }
    }
    i += 1;
  }
  return r + s.slice(f);
}

export const stripMarkdownImages = (value) => treuCorxets(String(value || ''), 1);

/* llevaScriptsIEstils viu a ./llevaScriptsIEstils.js: cap mòdul de l'arrencada no la fa servir. */
/* Abans: /<[^>]*>/g → ' '. Una etiqueta va d'un '<' al primer '>' (un altre
   '<' de dins no la tanca) i es fa un espai. Un '<' sense cap '>' més avant
   no n'obri cap, ni tampoc els que el seguixen. */
export function llevaEtiquetes(valor, separador = ' ') {
  const text = String(valor ?? '');
  let net = '';
  let fet = 0;
  let inici = text.indexOf('<');
  while (inici !== -1) {
    const fi = text.indexOf('>', inici + 1);
    if (fi === -1) break;
    net += text.slice(fet, inici) + separador;
    fet = fi + 1;
    inici = text.indexOf('<', fet);
  }
  return net + text.slice(fet);
}

/* IDEA-357 (v1.2.26) · Neteja lineal O(n) zero-ReDoS de Markdown cru, sense
   mutilar el contingut legítim (D2 de l'integrador C1-3): un «- » o un «+ »
   davant d'un dígit és un signe, no una llista; ** i * (com __ i _) només
   marquen amb un límit que no és lletra ni dígit, i 2*3*4 o 5**2 queden
   intactes. Un ** amb eixe límit se'n va encara que no tanque (IDEA-357.2).
   Per a * i ** el límit és el d'ASCII (\B i \w), el més curt per al nucli:
   només difereix quan el veí és una lletra no ASCII (à, ç) o un _. Una
   cursiva no comença ni acaba al costat d'un altre * (10**3 i a**b). */
export const llevaMd = (raw) => treuCorxets(raw, 0)
  .split('\n')
  .map((l) => l.trimStart().replace(/^>+\s*/, '').replace(/^(?:#{1,6}|\*|[-+](?!\s*\d))\s+/, ''))
  .join('\n')
  .replace(/`{3,}[^\s`\n]*\n?|~~|`/g, '')
  .replace(/\B\*\*|\*\*\B/g, '')
  .replace(/(^|[^\w*])\*([^\s*](?:[^*\n]*[^\s*])?)\*(?![\w*])/g, '$1$2')
  .replace(/(^|[^\p{L}\p{N}_])(_|__)([^\s_](?:[^_\n]*[^\s_])?)\2(?=$|[^\p{L}\p{N}_])/gu, '$1$3');

/* textPlaSenseMarkdown viu a ./textPlaSenseMarkdown.js: només el fan servir trossos diferits, i
   ací el pagava l'arrencada estàtica. No el reexportes des d'ací (integrador C1-3, tercera ronda). */

export const firstMediaSource = (value) => (Array.isArray(value) ? value[0] || null : value || null);

export const toFeedSummary = (value) =>
  llevaMd(stripMarkdownImages(value))
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, 220);

export const toMediaDescription = (value) => llevaMd(stripMarkdownImages(value)).slice(0, 180);

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
