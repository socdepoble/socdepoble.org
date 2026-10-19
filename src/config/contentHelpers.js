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
function cercadorEndavant(text, buscat) {
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

/* Abans: /!\[[^\]]*\]\([^)]+\)/g → ''. Una imatge comença en un '![', el text
   alternatiu arriba fins al primer ']' (no en pot saltar cap), li ha de seguir
   un '(' i l'adreça, d'almenys un caràcter, arriba fins al primer ')'. Sense
   cap ']' (o cap ')') més avant ja no en pot quedar cap. */
export const stripMarkdownImages = (value) => {
  const text = String(value || '');
  const claudator = cercadorEndavant(text, ']');
  let net = '';
  let fet = 0;
  let inici = text.indexOf('![');
  while (inici !== -1) {
    const tanca = claudator(inici + 2);
    if (tanca === -1) break;
    if (text[tanca + 1] === '(') {
      const fi = text.indexOf(')', tanca + 2);
      if (fi === -1) break;
      if (fi > tanca + 2) {
        net += text.slice(fet, inici);
        fet = fi + 1;
        inici = text.indexOf('![', fet);
        continue;
      }
    }
    inici = text.indexOf('![', inici + 1);
  }
  return net + text.slice(fet);
};

/* Abans: /<(script|style)[\s\S]*?<\/\1>/gi → ' '. Un bloc va d'un '<script'
   (o '<style', en majúscules o minúscules) al primer '</script>' (o
   '</style>') que el seguix, i es fa un espai. L'obertura no demana '>' i el
   tancament no admet espais, com l'expressió; un bloc sense tancament no casa
   i la cerca continua després. */
export function llevaScriptsIEstils(valor) {
  const text = String(valor ?? '');
  const tancaments = {
    script: cercadorEndavant(text, /<\/script>/gi),
    style: cercadorEndavant(text, /<\/style>/gi)
  };
  const obertura = /<(script|style)/gi;
  let net = '';
  let fet = 0;
  let casa;
  while ((casa = obertura.exec(text)) !== null) {
    const nom = casa[1].toLowerCase();
    const fi = tancaments[nom](obertura.lastIndex);
    if (fi === -1) continue;
    net += `${text.slice(fet, casa.index)} `;
    fet = fi + nom.length + 3;
    obertura.lastIndex = fet;
  }
  return net + text.slice(fet);
}

/* Abans: /<[^>]*>/g → ' '. Una etiqueta va d'un '<' al primer '>' (un altre
   '<' de dins no la tanca) i es fa un espai. Un '<' sense cap '>' més avant
   no n'obri cap, ni tampoc els que el seguixen. */
export function llevaEtiquetes(valor) {
  const text = String(valor ?? '');
  let net = '';
  let fet = 0;
  let inici = text.indexOf('<');
  while (inici !== -1) {
    const fi = text.indexOf('>', inici + 1);
    if (fi === -1) break;
    net += `${text.slice(fet, inici)} `;
    fet = fi + 1;
    inici = text.indexOf('<', fet);
  }
  return net + text.slice(fet);
}

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
