// Un sol propietari per document. La ruta té un fallback i les vistes poden
// concretar-lo; en desmuntar desapareixen les metadades de la vista anterior.
const owners = new Map();
let baseline = null;
let activePath = null;
let sequence = 0;
// Les propietats d'imatge van darrere d'og:image: restaurar per este ordre
// manté cada propietat estructurada després de la imatge que descriu.
const PROPIETATS_IMATGE = [['og:image:type', 'type'], ['og:image:width', 'width'],
  ['og:image:height', 'height'], ['og:image:alt', 'alt']];
const selectors = [
  'meta[name="description"]', 'meta[name="robots"]', 'meta[name="twitter:title"]',
  'meta[name="twitter:description"]', 'meta[name="twitter:image"]', 'meta[name="twitter:image:alt"]',
  'meta[name="twitter:card"]', 'meta[property="og:title"]', 'meta[property="og:description"]',
  'meta[property="og:image"]', ...PROPIETATS_IMATGE.map(([nom]) => `meta[property="${nom}"]`),
  'meta[property="og:url"]', 'link[rel="canonical"]', 'script[data-sdp-seo]'
];

function capture() {
  return { title: document.title, nodes: selectors.map(selector => ({ selector,
    nodes: [...document.head.querySelectorAll(selector)].map(node => node.cloneNode(true)) })) };
}
function restore() {
  if (!baseline) return;
  document.title = baseline.title;
  for (const { selector, nodes } of baseline.nodes) {
    document.head.querySelectorAll(selector).forEach(node => node.remove());
    nodes.forEach(node => document.head.appendChild(node.cloneNode(true)));
  }
}
function deLaBase(selector) {
  return baseline.nodes.find(row => row.selector === selector)?.nodes[0]?.content;
}
function meta(name, content, attribute = 'name') {
  const selector = `meta[${attribute}="${name}"]`;
  const matches = [...document.head.querySelectorAll(selector)];
  let node = matches.shift();
  matches.forEach(extra => extra.remove());
  if (!content) { node?.remove(); return; }
  if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, name); document.head.appendChild(node); }
  node.content = content;
}
function apply() {
  const eligible = [...owners.values()].filter(owner => owner.path === activePath)
    .sort((a, b) => b.priority - a.priority || b.sequence - a.sequence);
  restore();
  const chosen = eligible[0];
  if (!chosen) return;
  const { data } = chosen;
  const fullTitle = data.title ? `${data.title} | Sóc de Poble` : 'Sóc de Poble';
  document.title = fullTitle;
  meta('og:title', fullTitle, 'property'); meta('twitter:title', fullTitle);
  const description = data.description || deLaBase('meta[name="description"]') || 'Sóc de Poble, la xarxa dels pobles valencians.';
  meta('description', description); meta('og:description', description, 'property'); meta('twitter:description', description);
  meta('robots', data.index ? null : 'noindex, nofollow');
  // La imatge és un conjunt (URL, MIME, mides i alt). La base es deixa tal com
  // l'ha restaurada restore(); una altra porta les seues propietats o cap.
  const image = typeof data.image === 'string' ? { url: data.image } : data.image || null;
  const baseUrl = deLaBase('meta[property="og:image"]');
  if (!(baseUrl && image && (image.base || image.url === baseUrl))) {
    meta('og:image', image?.url, 'property');
    PROPIETATS_IMATGE.forEach(([nom, clau]) => meta(nom, image?.[clau], 'property'));
    meta('twitter:image', image?.url); meta('twitter:image:alt', image?.alt);
  }
  meta('twitter:card', image ? 'summary_large_image' : null);
  document.head.querySelectorAll('link[rel="canonical"], script[data-sdp-seo]').forEach(node => node.remove());
  if (data.index && data.canonical) {
    const link = document.createElement('link'); link.rel = 'canonical'; link.href = data.canonical; document.head.appendChild(link);
  }
  meta('og:url', data.index ? data.canonical : null, 'property');
  if (data.index && data.jsonLd) {
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.dataset.sdpSeo = 'true';
    script.textContent = data.jsonLd; document.head.appendChild(script);
  }
}
export function registerSeo(owner, { path, priority = 1, ...data }, options = {}) {
  // L'únic propietari de head exigix autoritat explícita (l'amfitrió la declara amb
  // manageDocumentHead: true); en iframe o amb __SDP_EMBEDDED__ no s'escriu mai al
  // document amfitrió, ni cridant directament.
  if (options?.manageDocumentHead !== true || typeof window === 'undefined'
    || typeof document === 'undefined' || window.self !== window.top || window.__SDP_EMBEDDED__) return () => {};
  baseline ||= capture();
  owners.set(owner, { path, priority, data, sequence: ++sequence });
  // El fallback fixa la ruta fins i tot quan la secció encara està carregant.
  if (priority === 0 || ![...owners.values()].some(entry => entry.priority === 0)) activePath = path;
  apply();
  return () => {
    owners.delete(owner);
    if (!owners.size) { restore(); baseline = null; activePath = null; }
    else apply();
  };
}
