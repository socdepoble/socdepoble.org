/** Offline R5 laboratory. RFC9421/RFC9530 profile for Mastodon v4.7.5,
 * upstream commit 24cd1c875a1ac393e587421726394d5692ff5496.
 * No network, key generation, credential storage or automatic fallback. */
const encoder = new TextEncoder();
const MAX_BODY = 128 * 1024;
const MAX_INTEGER = 999999999999999;
const COMPONENTS = new Set(['@method','@target-uri','@path','@authority','date','content-digest','content-type','content-length']);
const fail = () => new TypeError('node0_rfc9421_input_invalid');
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
function options(value, allowed) {
  if (!plain(value)) throw fail();
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value,key);
    if (typeof key !== 'string' || !allowed.includes(key) || !d?.enumerable || !Object.hasOwn(d,'value')) throw fail();
  }
}
const integer = value => { if (!Number.isSafeInteger(value) || value < 0 || value > MAX_INTEGER) throw fail(); return value; };
function sfString(value) {
  if (typeof value !== 'string' || !value.length || value.length > 2048 || /[^\x20-\x7e]/.test(value)) throw fail();
  return `"${value.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}"`;
}
function base64(bytes) { let value=''; for (const byte of bytes) value+=String.fromCharCode(byte); return btoa(value); }
function canonicalUrl(value, key = false) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f-\uffff\\]/.test(value)) throw fail();
  let url; try { url = new URL(value); } catch { throw fail(); }
  if (url.protocol !== 'https:' || url.username || url.password || url.href !== value || (key ? !url.hash || url.search : url.hash)) throw fail();
  return url;
}
function bodyBytes(value) {
  if (typeof value === 'string') {
    if (value.length > MAX_BODY || !value.isWellFormed()) throw fail();
    const bytes = encoder.encode(value); if (bytes.byteLength > MAX_BODY) throw fail(); return bytes;
  }
  if (!(value instanceof Uint8Array) || value.byteLength > MAX_BODY) throw fail();
  return new Uint8Array(value);
}

/** Canonical formatter only; callers supply already-derived component values.
 * The production-profile signer below never accepts caller-selected headers. */
export function serialitzaBaseHttpMessage(input) {
  options(input,['components','created','expires','keyId','algorithm','label']);
  const {components,created,keyId,expires,algorithm,label='sig1'} = input;
  if (!Array.isArray(components) || !components.length || components.length > 16 || typeof label !== 'string' || !/^[a-z][a-z0-9_-]{0,31}$/.test(label)) throw fail();
  integer(created); if (expires !== undefined && integer(expires) <= created) throw fail();
  if (algorithm !== undefined && algorithm !== 'ed25519') throw fail();
  const seen = new Set(), entries=[];
  for (const pair of components) {
    if (!Array.isArray(pair) || pair.length !== 2) throw fail();
    const [name,value] = pair;
    if (!COMPONENTS.has(name) || seen.has(name) || typeof value !== 'string' || value.length > 4096 || /[^\x20-\x7e]/.test(value) || value.trim() !== value) throw fail();
    seen.add(name); entries.push([name,value]);
  }
  let parameters = `(${entries.map(([name]) => sfString(name)).join(' ')});created=${created}`;
  if (expires !== undefined) parameters += `;expires=${expires}`;
  parameters += `;keyid=${sfString(keyId)}`;
  if (algorithm !== undefined) parameters += `;alg=${sfString(algorithm)}`;
  return Object.freeze({
    base: [...entries.map(([name,value]) => `${sfString(name)}: ${value}`),`"@signature-params": ${parameters}`].join('\n'),
    signatureInput: `${label}=${parameters}`
  });
}

/** PureEdDSA over the complete signature base; never prehash the Ed25519 input.
 * actorId binds keyId to the configured actor, not to an arbitrary caller URL.
 * The private CryptoKey is supplied by the existing, separately validated key loader. */
export async function signaPeticioHttpMessageActivityPub(input = {}) {
  options(input,['metode','url','cos','actorId','keyId','clauPrivada','ara','subtle']);
  const {metode='POST',url,cos='',actorId,keyId,clauPrivada,ara,subtle=globalThis.crypto?.subtle} = input;
  if (!['POST','GET'].includes(metode) || !Number.isSafeInteger(ara) || ara < 0 || Number.isNaN(new Date(ara).getTime())) throw fail();
  const target = canonicalUrl(url), actor = canonicalUrl(actorId), key = canonicalUrl(keyId,true);
  if (actor.search || key.href.split('#')[0] !== actor.href) throw fail();
  if (clauPrivada?.type !== 'private' || clauPrivada.algorithm?.name !== 'Ed25519' || !clauPrivada.usages?.includes('sign') || typeof subtle?.sign !== 'function' || typeof subtle?.digest !== 'function') throw fail();
  const bytes = bodyBytes(cos); if (metode === 'GET' && bytes.byteLength) throw fail();
  const digest = subtle.digest.bind(subtle), sign = subtle.sign.bind(subtle);
  const created = integer(Math.floor(ara/1000)), expires = integer(created+300);
  const date = new Date(ara).toUTCString();
  const contentDigest = `sha-256=:${base64(new Uint8Array(await digest('SHA-256',bytes)))}:`;
  const contentType = 'application/activity+json';
  const {base,signatureInput} = serialitzaBaseHttpMessage({
    components: [['@method',metode],['@target-uri',target.href],['content-digest',contentDigest],['date',date],['content-type',contentType]],
    created,expires,keyId:key.href,algorithm:'ed25519'
  });
  const signature = new Uint8Array(await sign('Ed25519',clauPrivada,encoder.encode(base)));
  if (signature.byteLength !== 64) throw fail();
  return Object.freeze({
    host:target.host,date,'content-type':contentType,'content-digest':contentDigest,
    'signature-input':signatureInput,signature:`sig1=:${base64(signature)}:`
  });
}
