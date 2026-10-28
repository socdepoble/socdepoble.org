/* Política HTTP de la mateixa release. No consulta xarxa ni modifica la memòria cau. */
const SCHEMA = 'sdp.site-policy.v1';
const GLOBAL_HEADERS = new Set(['content-security-policy']);
const ASSET_HEADERS = new Set(['access-control-allow-origin', 'access-control-expose-headers', 'access-control-allow-headers']);
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exactKeys = (object, expected) => plainObject(object)
  && Object.keys(object).length === expected.length && Object.keys(object).every(key => expected.includes(key));
function headerMap(value, allowed) {
  if (!plainObject(value) || Object.keys(value).length !== allowed.size) throw new Error('Mapa de capçaleres de política invàlid');
  const result = {};
  for (const [name, content] of Object.entries(value)) {
    if (!allowed.has(name) || typeof content !== 'string' || !content.trim()
      || content.length > 16384 || /[\u0000-\u001f\u007f]/u.test(content)) throw new Error(`Capçalera de política invàlida: ${name}`);
    result[name] = content;
  }
  return Object.freeze(result);
}
export function validateSitePolicy(policy) {
  if (!exactKeys(policy, ['schema', 'source', 'sourceSha256', 'globalHeaders', 'assets'])
    || policy.schema !== SCHEMA || policy.source !== 'firebase.json'
    || !/^[a-f0-9]{64}$/.test(policy.sourceSha256 || '')
    || !exactKeys(policy.assets, ['prefix', 'headers']) || policy.assets.prefix !== '/assets/') {
    throw new Error('Política HTTP incompatible o incompleta');
  }
  return Object.freeze({ schema: SCHEMA, source: policy.source, sourceSha256: policy.sourceSha256,
    globalHeaders: headerMap(policy.globalHeaders, GLOBAL_HEADERS),
    assets: Object.freeze({ prefix: '/assets/', headers: headerMap(policy.assets.headers, ASSET_HEADERS) }) });
}
export function applySitePolicy(request, response, policy) {
  const checked = validateSitePolicy(policy);
  if (!(response instanceof Response)) throw new TypeError('La política necessita una Response');
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(checked.globalHeaders)) headers.set(name, value);
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith(checked.assets.prefix)) {
    for (const [name, value] of Object.entries(checked.assets.headers)) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
