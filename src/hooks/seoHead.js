// Un sol propietari per document. La ruta té un fallback i les vistes poden
// concretar-lo; en desmuntar desapareixen les metadades de la vista anterior.
const owners = new Map();
let baseline = null;
let activePath = null;
let sequence = 0;
const selectors = [
  'meta[name="description"]', 'meta[name="robots"]', 'meta[name="twitter:title"]',
  'meta[name="twitter:description"]', 'meta[name="twitter:image"]', 'meta[name="twitter:card"]',
  'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]',
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
  const defaultDescription = baseline.nodes.find(row => row.selector === 'meta[name="description"]')?.nodes[0]?.content;
  const description = data.description || defaultDescription || 'Sóc de Poble, la xarxa dels pobles valencians.';
  meta('description', description); meta('og:description', description, 'property'); meta('twitter:description', description);
  meta('robots', data.index ? null : 'noindex, nofollow');
  meta('og:image', data.image, 'property'); meta('twitter:image', data.image);
  meta('twitter:card', data.image ? 'summary_large_image' : null);
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
