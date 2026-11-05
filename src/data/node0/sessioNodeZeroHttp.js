/** Transport privat del Node 0. La cookie HttpOnly pertany al navegador;
 * este mòdul no llig cookies, tokens ni cap magatzem de sessió. */
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';

const ENDPOINT = 'https://socdepoble.cat/api/v1/node0';
const MAX_BYTES = 2 * 1024 * 1024;
const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const typedArrayName = Object.getOwnPropertyDescriptor(typedArrayPrototype,Symbol.toStringTag).get;
const typedArrayByteLength = Object.getOwnPropertyDescriptor(typedArrayPrototype,'byteLength').get;
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const AUTH_BOUND = new Set(['logout','password','norms','norms-state']);
const AUTH = Object.freeze({
  policy: [], session: [], register: ['email','password','metadata'],
  'resend-verification': ['email'], 'verify-email': ['token','password','metadata'],
  'request-password-reset': ['email'], 'reset-password': ['token','password','metadata'],
  login: ['email','password'], logout: [], password: ['currentPassword','password'], norms: ['accept','version'], 'norms-state': []
});
const PRIVAT = Object.freeze({
  getProfile: [], elMeuRol: [], updateProfile: ['updates'], loadNotes: ['noteId','cursor','limit'],
  createNote: ['input'], updateNote: ['id','updates','expectedRevision'],
  listMyOrganizations: [], createOrganization: ['organization'], updateOrganization: ['id','updates'], loadFils: [],
  appendSectionSubmissionNetworkOnly: ['submission'], loadSeccioPage: ['sectionId','cursor','limit'],
  loadMissatges: ['filId','before','after','limit'], enviaMissatge: ['filId','id','text','tipus','respostaA','metadades'],
  marcaLlegit: ['filId','rebutFinsSeq','llegitFinsSeq'], creaFilDirecte: ['altreUsuariId','titol'], carregaMembres: ['cerca','limit']
});
const ERRORS_SERVIDOR = new Set([
  'session_required','permission_denied','conflict','node0_private_operation_failed','origin_rejected',
  'invalid_id','invalid_text','invalid_integer','invalid_fields','unsupported_field','invalid_boolean','invalid_list',
  'invalid_image_url','empty_fields','invalid_body','operation_unavailable','unexpected_field','ambiguous_cursor',
  'message_type_unavailable','message_metadata_unavailable','note_unavailable_or_revision_conflict',
  'email_invalid','password_invalid','credentials_invalid','auth_busy','auth_rate_limited','remote_address_required',
  'auth_origin_rejected','auth_json_required','auth_body_invalid','email_delivery_unavailable','consent_required',
  'consent_version_invalid','tenant_invalid','verification_invalid','norms_acceptance_required','norms_version_invalid',
  'auth_action_unavailable','auth_unavailable','actor_binding_required','session_actor_changed'
]);
const pla = v => v !== null && typeof v === 'object' && !Array.isArray(v) && [Object.prototype,null].includes(Object.getPrototypeOf(v));
const LOCAL_ERROR = Symbol('node0-http-local-error');
const error = (code, message, status) => Object.assign(new Error(message), { code, codi: code, [LOCAL_ERROR]:true, ...(status ? { status } : {}) });
const invalid = () => error('BACKEND_RESPOSTA_INVALIDA','El Node 0 ha tornat una resposta invàlida.');
const cancelacio = () => new DOMException('Operació cancel·lada.','AbortError');
const configuracioInvalida = () => new TypeError('Configuració privada del Node 0 invàlida.');
function claus(valor, admeses) {
  if (!pla(valor)) throw configuracioInvalida();
  for (const key of Reflect.ownKeys(valor)) {
    const d = Object.getOwnPropertyDescriptor(valor,key);
    if (typeof key !== 'string' || !admeses.includes(key) || !d?.enumerable || !Object.hasOwn(d,'value')) throw configuracioInvalida();
  }
}
function capturaCos(input, admeses) {
  claus(input,admeses); let nodes = 0;
  const copia = (value, depth = 0) => {
    if (++nodes > 20000 || depth > 20) throw configuracioInvalida();
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return value;
    if (Array.isArray(value)) {
      if (Reflect.ownKeys(value).length !== value.length + 1) throw configuracioInvalida();
      return Array.from({length:value.length},(_,i) => {
        const d = Object.getOwnPropertyDescriptor(value,String(i));
        if (!d?.enumerable || !Object.hasOwn(d,'value')) throw configuracioInvalida();
        return copia(d.value,depth+1);
      });
    }
    if (!pla(value)) throw configuracioInvalida();
    const out = Object.create(null);
    for (const key of Reflect.ownKeys(value)) {
      const d = Object.getOwnPropertyDescriptor(value,key);
      if (typeof key !== 'string' || !d?.enumerable || !Object.hasOwn(d,'value')) throw configuracioInvalida();
      out[key] = copia(d.value,depth+1);
    }
    return out;
  };
  const json = JSON.stringify(copia(input));
  if (new TextEncoder().encode(json).byteLength > MAX_BYTES) throw configuracioInvalida();
  return json;
}
function endpointPrivat(endpoint, origin) {
  if (typeof endpoint !== 'string' || endpoint !== endpoint.trim() || /[\u0000-\u0020\u007f\\]/.test(endpoint)) throw configuracioInvalida();
  let url, actual;
  try { url = new URL(endpoint); actual = new URL(origin); } catch { throw configuracioInvalida(); }
  const loopback = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || !['/api/v1/node0','/api/v1/node0/'].includes(url.pathname)
    || !(url.protocol === 'https:' || url.protocol === 'http:' && loopback)
    || actual.origin !== origin || url.origin !== actual.origin) throw configuracioInvalida();
  return url.href.replace(/\/$/,'');
}
async function jsonFitat(res, signal, url) {
  if (res?.redirected || res?.url && res.url !== url || !Number.isInteger(res?.status) || res.status < 200 || res.status > 599) throw invalid();
  if (!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:;|$)/i.test(res.headers?.get('content-type') || '')) throw invalid();
  const length = res.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) throw invalid();
  const reader = res.body?.getReader?.(); if (!reader) throw invalid();
  const cancel = () => { try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* flux ja tancat */ } };
  signal.addEventListener('abort',cancel,{once:true}); if (signal.aborted) cancel();
  let size = 0; const parts = [], decoder = new TextDecoder('utf-8',{fatal:true});
  try {
    while (true) {
      if (signal.aborted) throw signal.reason ?? cancelacio();
      const {value,done} = await reader.read(); if (done) break;
      // Fetch implementations/iframes can supply a genuine Uint8Array from a
      // different realm. Intrinsic brand/length getters also reject another
      // view with a forged toStringTag and ignore a shadowed byteLength.
      if (!ArrayBuffer.isView(value) || typedArrayName.call(value) !== 'Uint8Array' || (size += typedArrayByteLength.call(value)) > MAX_BYTES) throw invalid();
      parts.push(decoder.decode(value,{stream:true}));
    }
    parts.push(decoder.decode());
    let result; try { result = JSON.parse(parts.join('')); } catch { throw invalid(); }
    if (!res.ok) {
      const code = [401,403].includes(res.status) ? 'sense-permis' : [404,501].includes(res.status) ? 'sense-capacitat' : 'NODE0_HTTP';
      const failure = error(code,'El Node 0 no ha pogut completar l’operació.',res.status);
      if (pla(result) && ERRORS_SERVIDOR.has(result.error)) failure.serverCode = result.error;
      throw failure;
    }
    return result;
  } catch (cause) { cancel(); if (cause?.[LOCAL_ERROR] || signal.aborted) throw cause; throw invalid(); }
  finally { signal.removeEventListener('abort',cancel); reader.releaseLock(); }
}

/** origin és injectable només quan no hi ha location ambiental (SSR/proves).
 * Retorna DTOs crus; l'adaptador principal governa usuari, revisions i avisos. */
export function creaSessioNodeZeroHttp(opcions = {}) {
  claus(opcions,['endpoint','origin','fetchImpl','timeoutMs']);
  const {endpoint=ENDPOINT,fetchImpl=globalThis.fetch,timeoutMs=15000} = opcions;
  const ambient = globalThis.location?.origin ?? globalThis.window?.location?.origin;
  const origin = ambient ?? opcions.origin;
  if (ambient !== undefined && opcions.origin !== undefined && opcions.origin !== ambient) throw configuracioInvalida();
  const base = endpointPrivat(endpoint,origin);
  if (typeof fetchImpl !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw configuracioInvalida();
  let closed = false; const controls = new Set();
  const obert = () => { if (closed) throw error('NODE0_TANCAT','El transport privat del Node 0 està tancat.'); };
  async function demana(tipus, action, body = {}, config = {}) {
    obert(); const actions = tipus === 'auth' ? AUTH : PRIVAT;
    if (typeof action !== 'string' || !Object.hasOwn(actions,action)) throw error('sense-capacitat','Esta operació no està disponible al Node 0.');
    claus(config,['signal','expectedActor']);
    const bound = tipus === 'private' || AUTH_BOUND.has(action);
    const suppliedActor = Object.hasOwn(config,'expectedActor');
    if (!bound && suppliedActor) throw configuracioInvalida();
    if (bound && (typeof config.expectedActor !== 'string' || !UUID.test(config.expectedActor))) {
      throw error('actor_binding_required','Cal comprovar la identitat abans de fer esta operació.',409);
    }
    // Capture the exact comparison value before any asynchronous work. It is
    // never sent as owner/user/claims in a JSON body and grants no authority.
    const expectedActor = bound ? config.expectedActor.toLowerCase() : null;
    const serialized = capturaCos(body,actions[action]), signal = config.signal;
    if (signal && (typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function')) throw configuracioInvalida();
    if (signal?.aborted) throw cancelacio();
    const controller = new AbortController(); controls.add(controller);
    const onAbort = () => controller.abort(cancelacio()); signal?.addEventListener('abort',onAbort,{once:true});
    let interrupted;
    const interruption = new Promise((_,reject) => { interrupted = () => reject(controller.signal.reason ?? cancelacio()); controller.signal.addEventListener('abort',interrupted,{once:true}); });
    const timer = setTimeout(() => controller.abort(error(CODI_BACKEND_INABASTABLE,'El Node 0 no ha respost a temps.')),timeoutMs);
    const method = tipus === 'auth' && ['policy','session'].includes(action) ? 'GET' : 'POST';
    const url = `${base}/${tipus}/${action}`;
    try {
      const work = Promise.resolve().then(async () => {
        if (controller.signal.aborted) throw controller.signal.reason;
        const res = await fetchImpl(url,{ method, credentials:'same-origin', mode:'same-origin', redirect:'error', cache:'no-store', referrerPolicy:'no-referrer',
          headers: { Accept:'application/json', ...(method === 'POST' ? {'Content-Type':'application/json'} : {}),
            ...(bound ? {'X-SDP-Expected-Actor':expectedActor} : {}) },
          ...(method === 'POST' ? {body:serialized} : {}), signal:controller.signal });
        if (controller.signal.aborted) throw controller.signal.reason;
        const result = await jsonFitat(res,controller.signal,url);
        obert(); if (controller.signal.aborted) throw controller.signal.reason;
        return result;
      });
      return await Promise.race([work,interruption]);
    } catch (cause) {
      if (controller.signal.aborted) throw controller.signal.reason ?? cancelacio();
      if (cause?.[LOCAL_ERROR]) throw cause;
      throw error(CODI_BACKEND_INABASTABLE,'No es pot connectar amb el Node 0.');
    } finally { clearTimeout(timer); controls.delete(controller); signal?.removeEventListener('abort',onAbort); controller.signal.removeEventListener('abort',interrupted); }
  }
  return Object.freeze({
    demanaAuth: (action,body,config) => demana('auth',action,body,config),
    demanaPrivat: (action,body,config) => demana('private',action,body,config),
    destroy() { if (closed) return; closed = true; for (const controller of controls) controller.abort(error('NODE0_TANCAT','El transport privat del Node 0 està tancat.')); controls.clear(); }
  });
}
export default creaSessioNodeZeroHttp;
