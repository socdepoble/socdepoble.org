/** Node 0 HTTP: lectures públiques explícites darrere del port neutral.
 * No adopta sessions Supabase, no admet secrets de servidor ni fallback.
 * Fins que Node 0 tinga sessions d'usuari, auth/escriptura/xat rebutgen. */
import { CONTRACTE_NUCLI } from '../contracte.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
export const BACKEND_ID_NODE_ZERO = 'sdp-node0-http';
export const URL_NODE_ZERO = 'https://socdepoble.cat/api/v1/node0';
export const CONVIDAT_NODE_ZERO = '00000000-0000-4000-8000-000000000001';
export const CAPACITATS_NODE_ZERO = Object.freeze(['salut']);
const MAX_BYTES = 2 * 1024 * 1024;
const FORMA_UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const FORMES = Object.freeze({ core: ['towns', 'pages', 'agents'], mur: ['feedPosts', 'events', 'marketItems'], multimedia: ['mediaItems'], notes: ['notes', 'noteFolders'] });
/* Projecció primitive explícita: cap spread del DTO, correu, telèfon o rol
   de gestió. Els camps estructurats no suportats es deixen fora en este MVP. */
const TEXT = Object.freeze(['id','slug','type','kind','sectionId','name','title','subtitle','summary','description','content','lead',
  'author','author_name','authorAvatar','author_avatar','author_org_id','authorOrgId','author_entity_id','ownerUserId','created_at','updated_at',
  'date','time','inici','fi','zona','uid','recurrencia','image_url','avatar_url','hero_url','logoImage','logo','image','avatar',
  'url','external_url','logo_url','href','linkTo','location','town_name','town','poble_id','provincia','comarca','population','role','short_bio','bio','lema',
  'presentacio_html','tag','icon','copyright','price','currency','seller','category','categoryId','folderId','post_subtitle',
  'post_title','post_content','alt','format','source','canonicalUrl','uri','searchText','body','text','source_url','author_handle','visibility','content_warning']);
const BOOL = Object.freeze(['isPublished','is_public','pinned','featured','portada_sencera','sensitive']);
const NUM = Object.freeze(['lat','lng','revision','duration','width','height']);
const LIST = Object.freeze(['labels','tags','images','image_urls','gallery','categories']);
const error = (codi, missatge, status) => Object.assign(new Error(missatge), { code:codi, codi, ...(status ? {status} : {}) });
const invalid = () => error('BACKEND_RESPOSTA_INVALIDA', 'El Node 0 ha tornat dades invàlides.');
const cancelacio = () => new DOMException('Operació cancel·lada.', 'AbortError');
const objecte = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const pla = v => objecte(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const text = v => typeof v === 'string' ? v.slice(0,512*1024) : typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
export function normalitzaEndpointNodeZero(valor = URL_NODE_ZERO) {
  if (typeof valor !== 'string' || valor !== valor.trim() || /[\u0000-\u0020\u007f\\]/.test(valor)) throw new TypeError('Endpoint del Node 0 invàlid.');
  let url; try { url = new URL(valor); } catch { throw new TypeError('Endpoint del Node 0 invàlid.'); }
  const loopback = ['127.0.0.1','localhost','[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash
    || !(url.protocol === 'https:' || url.protocol === 'http:' && loopback)
    || !['/api/v1/node0','/api/v1/node0/'].includes(url.pathname)) throw new TypeError('Endpoint del Node 0 invàlid.');
  return url.href.replace(/\/$/, '');
}
function filaPublica(fila) {
  if (!objecte(fila)) return null;
  const net = {};
  for (const key of TEXT) if (Object.hasOwn(fila,key)) net[key] = text(fila[key]);
  if (!net.id) return null;
  for (const key of BOOL) if (typeof fila[key] === 'boolean') net[key] = fila[key];
  for (const key of NUM) if (typeof fila[key] === 'number' && Number.isFinite(fila[key])) net[key] = fila[key];
  for (const key of LIST) if (Array.isArray(fila[key])) net[key] = fila[key].slice(0,200).filter(v => typeof v === 'string').map(v => v.slice(0,10000));
  return net;
}
function coleccions(valor, forma) {
  if (!objecte(valor)) throw invalid();
  const net = {};
  for (const key of FORMES[forma]) {
    if (!Array.isArray(valor[key]) || valor[key].length > 5000) throw invalid();
    net[key] = valor[key].map(filaPublica).filter(Boolean);
  }
  return net;
}
async function jsonFitat(resposta, signal) {
  if (!resposta.ok) {
    const status = Number.isInteger(resposta.status) ? resposta.status : 0;
    throw error([401,403].includes(status) ? 'sense-permis' : [404,501].includes(status) ? 'sense-capacitat' : 'NODE0_HTTP', 'El Node 0 no ha pogut completar la lectura.', status);
  }
  if (resposta.redirected || !/^application\/(?:json|[a-z0-9.+-]+\+json)(?:;|$)/i.test(resposta.headers?.get('content-type') || '')) throw invalid();
  const mida = resposta.headers?.get('content-length');
  if (mida && (!/^\d+$/.test(mida) || Number(mida) > MAX_BYTES)) throw invalid();
  let cos;
  const lector = resposta.body?.getReader?.();
  if (lector) {
    const decoder = new TextDecoder('utf-8', {fatal:true}); let bytes = 0; const parts = [];
    const interromp = () => { Promise.resolve(lector.cancel()).catch(() => {}); };
    signal.addEventListener('abort', interromp, {once:true});
    try {
      while (true) {
        if (signal.aborted) throw signal.reason ?? cancelacio();
        const {value,done} = await lector.read(); if (done) break;
        bytes += value.byteLength; if (bytes > MAX_BYTES) throw invalid();
        parts.push(decoder.decode(value,{stream:true}));
      }
      parts.push(decoder.decode()); cos = parts.join('');
    } catch (cause) { try { await lector.cancel(); } catch { /* transport tancat */ } throw cause; }
    finally { signal.removeEventListener('abort', interromp); lector.releaseLock(); }
  } else {
    cos = await resposta.text(); if (new TextEncoder().encode(cos).byteLength > MAX_BYTES) throw invalid();
  }
  try { return JSON.parse(cos); } catch { throw invalid(); }
}
/** Opcions capturades abans d'esperar. No token, sessió o fallback. */
export function creaAdaptadorNodeZeroHttp(opcions = {}) {
  if (!pla(opcions)) throw new TypeError('Opcions del Node 0 invàlides.');
  for (const key of Reflect.ownKeys(opcions)) {
    const d = Object.getOwnPropertyDescriptor(opcions,key);
    if (!['endpoint','tenantId','fetchImpl','timeoutMs'].includes(key) || !d || !Object.hasOwn(d,'value') || !d.enumerable) throw new TypeError('Opció del Node 0 no admesa.');
  }
  const {endpoint=URL_NODE_ZERO,tenantId=null,fetchImpl=globalThis.fetch,timeoutMs=15000} = opcions;
  const base = normalitzaEndpointNodeZero(endpoint);
  if (tenantId !== null && (typeof tenantId !== 'string' || !FORMA_UUID.test(tenantId))) throw new TypeError('El tenantId del Node 0 ha de ser un UUID.');
  if (typeof fetchImpl !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new TypeError('Transport del Node 0 invàlid.');
  const configuracio = Object.freeze({backendId:BACKEND_ID_NODE_ZERO,backendUrl:base,tenantId:tenantId?.toLowerCase()??null,dataMode:'remote'});
  let tancat = false; const controls = new Set();
  const obert = () => { if (tancat) throw error('NODE0_TANCAT','L’adaptador del Node 0 està tancat.'); };
  async function demana(ruta,config) {
    obert();
    const signal = objecte(config) ? config.signal : undefined;
    if (signal && (typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function')) throw new TypeError('Senyal del Node 0 invàlid.');
    if (signal?.aborted) throw signal.reason ?? cancelacio();
    const control = new AbortController(); controls.add(control);
    const avorta = () => control.abort(signal.reason ?? cancelacio()); signal?.addEventListener('abort',avorta,{once:true});
    const rellotge = setTimeout(() => control.abort(error(CODI_BACKEND_INABASTABLE,'El Node 0 no ha respost a temps.')),timeoutMs);
    let talla;
    const interrompuda = new Promise((_resolve,reject) => { talla = () => reject(control.signal.reason??cancelacio()); control.signal.addEventListener('abort',talla,{once:true}); });
    try {
      const feina = Promise.resolve().then(async () => {
        if (control.signal.aborted) throw control.signal.reason;
        const resposta = await fetchImpl(`${base}/${ruta}`,{method:'GET',credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',headers:{Accept:'application/json'},signal:control.signal});
        if (control.signal.aborted) throw control.signal.reason;
        const valor = await jsonFitat(resposta,control.signal);
        obert(); if (control.signal.aborted) throw control.signal.reason; return valor;
      });
      return await Promise.race([feina,interrompuda]);
    } catch (cause) {
      if (control.signal.aborted) throw control.signal.reason ?? cancelacio();
      if (cause?.codi) throw cause;
      throw error(CODI_BACKEND_INABASTABLE,'No es pot connectar amb el Node 0.');
    } finally { clearTimeout(rellotge); controls.delete(control); signal?.removeEventListener('abort',avorta); control.signal.removeEventListener('abort',talla); }
  }
  const absent = async () => { obert(); throw error('sense-capacitat','Esta operació encara no està disponible al Node 0.'); };
  const metodes = Object.fromEntries(CONTRACTE_NUCLI.map(name => [name,absent]));
  Object.assign(metodes,{
    loadCoreContent: async (_owner,config) => coleccions(await demana('core',config),'core'),
    loadMur: async (_owner,config) => coleccions(await demana('mur',config),'mur'),
    loadMultimedia: async (_owner,config) => coleccions(await demana('multimedia',config),'multimedia'),
    loadNotes: async (_owner,config) => coleccions(await demana('notes',config),'notes'),
    getCurrentUser: () => { obert(); return null; }, getDefaultUserId: () => { obert(); return CONVIDAT_NODE_ZERO; },
    getBackendConfigurat: () => { obert(); return true; }, getRuntimeDataMode: () => { obert(); return 'remote'; },
    getProfile: async () => { obert(); return null; }, listMyOrganizations: async () => { obert(); return []; }, logout: async () => { obert(); return true; },
    async comprovaServidor(config) { try { return {ok:(await demana('status',config))?.postgresql?.ok===true}; } catch { return {ok:false}; } },
    lligEstatNodeZero: config => demana('status',config),
    destroy() { if(tancat)return; tancat=true; for(const c of controls)c.abort(error('NODE0_TANCAT','L’adaptador del Node 0 està tancat.')); controls.clear(); },
    configuracio,operacions:Object.freeze({lecturaPublica:true,escriptura:false,autenticacio:false,xat:false})
  });
  return Object.freeze(metodes);
}
export default creaAdaptadorNodeZeroHttp;
