import { getResolvedConfig, request, rpc } from './runtime.js';
import { capturaSessio, entradaSessio, jwtPerBackend, usuariDeSessio } from '../identitat.js';
import { backendScope } from '../../config/backendConfig.js';
import { ERRORS_ADJUNT_XAT, QUOTA_XAT_BYTES, normalitzaUbicacioXat, errorAdjuntXat, tempsLimitPujada, validaAdjuntXat } from '../xatMultimedia.js';

const BUCKET = 'xat_adjunts';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_CODI_SDP = /SDP-XAT-\d{3}/;
const noDisponible = () => errorAdjuntXat('sense-capacitat');
function context(config) {
  if (getResolvedConfig(config).runtimeDataMode !== 'remote') throw noDisponible();
  const usuari = usuariDeSessio();
  if (!usuari?.id) throw errorAdjuntXat('SDP-XAT-001');
  return usuari.id;
}
function vigent(usuari, config) {
  if (config.signal?.aborted || usuariDeSessio()?.id !== usuari) throw new DOMException('Operació cancel·lada.', 'AbortError');
}
/* La branca xifrada reutilitza context/vigent amb el seu contracte d'UUID.
   El camí públic captura, a més, l'entrada i el backend: una renovació conserva
   l'entrada; eixir i tornar a entrar amb el mateix UUID no la conserva. */
function capturaOperacio(config) {
  const usuari = context(config);
  const sessioVigent = capturaSessio();
  const backend = backendScope(config);
  const entrada = entradaSessio();
  const comprova = ({ ignoraAbort = false } = {}) => {
    sessioVigent();
    if ((!ignoraAbort && config.signal?.aborted) || backendScope(config) !== backend) {
      throw new DOMException('Operació cancel·lada.', 'AbortError');
    }
    const actual = usuariDeSessio();
    if (!jwtPerBackend(config) || !actual) throw errorAdjuntXat('sessio-caducada', { status: 401 });
    if (actual.id !== usuari) throw new DOMException('Operació cancel·lada.', 'AbortError');
  };
  comprova();
  return { usuari, comprova, clau: JSON.stringify([backend, usuari, entrada]) };
}
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-5) · Tota fallada ix amb un
   `code` d'ERRORS_ADJUNT_XAT: els codis SDP del servidor, l'esquema absent,
   la xarxa i, per a la resta, «servidor». El cos cru («Supabase 403: {…}»)
   només queda a `cause`. Les cancel·lacions i les ja codificades passen. */
function tradueix(error) {
  if (error?.name === 'AbortError' || Object.hasOwn(ERRORS_ADJUNT_XAT, String(error?.code ?? ''))) return error;
  const text = String(error?.message || '');
  const codi = RE_CODI_SDP.exec(text)?.[0];
  if (codi && Object.hasOwn(ERRORS_ADJUNT_XAT, codi)) return errorAdjuntXat(codi, { cause: error });
  if (error?.status === 401) return errorAdjuntXat('sessio-caducada', { status: 401, cause: error });
  if (error?.status === 404 || /PGRST20[25]|esquema requerit/.test(text)) return noDisponible();
  if (error?.name === 'TimeoutError') return errorAdjuntXat('temps-esgotat', { name: 'TimeoutError', cause: error });
  if (error instanceof TypeError || error?.status === 0) return errorAdjuntXat('xarxa', { cause: error });
  return errorAdjuntXat('servidor', { status: error?.status, cause: error });
}
async function crida(nom, params, config) {
  try { return await rpc(nom, params, config, { signal: config.signal }); }
  catch (error) { throw tradueix(error); }
}
const primera = (valor) => Array.isArray(valor) ? valor[0] : valor;

/* EXIF_T03 · La reserva i el seu objecte són immutables. Un adjunt antic
   amb GPS s'ha de preparar de nou (ID nou), abans de reservar: no podem
   substituir a cegues un objecte que Storage pot haver confirmat ja.
   Ni senseUbicacio:true ni l'absència de p_ubicacio acrediten els bytes. */
async function comprovaImatgeSenseUbicacio(fitxer, comprova, signal) {
  const { imatgeSenseUbicacio } = await import('../../components/universal/enquadrament/exifIncrustat.js');
  comprova();
  let buffer;
  try {
    const lectura = typeof fitxer.arrayBuffer === 'function' ? fitxer.arrayBuffer() : new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(fitxer);
    });
    buffer = await new Promise((resolve, reject) => {
      const cancella = () => { signal?.removeEventListener('abort', cancella); reject(new DOMException('Operació cancel·lada.', 'AbortError')); };
      signal?.addEventListener('abort', cancella, { once: true });
      Promise.resolve(lectura).then(resolve, reject).finally(() => signal?.removeEventListener('abort', cancella));
      if (signal?.aborted) cancella();
    });
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause;
    throw errorAdjuntXat('foto-codificacio', { cause });
  }
  comprova();
  const bytes = new Uint8Array(buffer);
  const net = imatgeSenseUbicacio(bytes);
  if (!net || net.format !== fitxer.type) throw errorAdjuntXat('foto-codificacio');
  if (net.bytes.length !== bytes.length || net.bytes.some((b, i) => b !== bytes[i])) throw errorAdjuntXat('SDP-XAT-008');
}

/* El fallback antic no pot dir «sense la ubicació» d'un vídeo que només
   s'ha inspectat o que declara una bandera local. MP4/MOV: es comparen els
   bytes amb el sanejament existent. Format opac: error visible, sense RPC3. */
async function comprovaVideoSenseUbicacio(fitxer, comprova, signal) {
  const { senseUbicacioVideo } = await import('../../utils/ubicacioMitjans.js');
  const net = await senseUbicacioVideo(fitxer, { signal });
  comprova();
  if (!net.net) throw errorAdjuntXat('ubicacio-no-eliminable');
  const [a, b] = await Promise.all([fitxer.arrayBuffer(), net.fitxer.arrayBuffer()]);
  comprova();
  const bytes = new Uint8Array(a), nets = new Uint8Array(b);
  if (bytes.length !== nets.length || bytes.some((v, i) => v !== nets[i])) throw errorAdjuntXat('ubicacio-no-eliminable');
}

function esperaAmbSenyal(promesa, signal) {
  return new Promise((resolve, reject) => {
    const cancella = () => { signal.removeEventListener('abort', cancella); reject(signal.reason); };
    signal.addEventListener('abort', cancella, { once: true });
    Promise.resolve(promesa).then(resolve, reject).finally(() => signal.removeEventListener('abort', cancella));
    if (signal.aborted) cancella();
  });
}

/* Una reserva ja pujada o un 409 només acrediten que hi ha un objecte.
   Abans de publicar-lo, GET privat amb JWT i comparació SHA-256 exacta del
   cos amb el Blob local. La lectura té sostre, termini i sessió vigent;
   cap confiança en el nom, la mida declarada o una bandera del client. */
async function comprovaObjectePujat(ruta, fitxer, config, comprova) {
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  const jwt = jwtPerBackend(config), controller = new AbortController();
  const avorta = () => controller.abort(config.signal?.reason);
  const sessioCanvia = () => { try { comprova(); } catch (error) { controller.abort(error); } };
  const timer = setTimeout(() => controller.abort(errorAdjuntXat('temps-esgotat', { name: 'TimeoutError' })), tempsLimitPujada(fitxer.size));
  config.signal?.addEventListener('abort', avorta, { once: true });
  globalThis.window?.addEventListener('sdp:auth-change', sessioCanvia);
  let reader;
  try {
    comprova();
    const resposta = await esperaAmbSenyal(fetch(`${supabaseUrl}/storage/v1/object/authenticated/${BUCKET}/${ruta}`, {
      method: 'GET', signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store',
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${jwt}` }
    }), controller.signal);
    comprova();
    const mime = resposta.headers?.get('content-type')?.split(';')[0].trim().toLowerCase();
    const llargaria = resposta.headers?.get('content-length');
    if (!resposta.ok || mime !== fitxer.type || (llargaria != null && llargaria !== String(fitxer.size))
      || !resposta.body?.getReader || !globalThis.crypto?.subtle) throw errorAdjuntXat('SDP-XAT-008');
    reader = resposta.body.getReader();
    const remot = new Uint8Array(fitxer.size); let total = 0, trossos = 0;
    for (;;) {
      const { done, value } = await esperaAmbSenyal(reader.read(), controller.signal);
      comprova();
      if (done) break;
      if (!ArrayBuffer.isView(value) || value.BYTES_PER_ELEMENT !== 1 || !value.byteLength
        || value.byteLength > remot.length - total || ++trossos > 65_536) throw errorAdjuntXat('SDP-XAT-008');
      const tros = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      remot.set(tros, total); total += tros.length;
    }
    if (total !== fitxer.size) throw errorAdjuntXat('SDP-XAT-008');
    const local = typeof fitxer.arrayBuffer === 'function' ? fitxer.arrayBuffer() : new Promise((resolve, reject) => {
      const f = new FileReader(); f.onload = () => resolve(f.result); f.onerror = () => reject(f.error); f.readAsArrayBuffer(fitxer);
    });
    const [a, b] = await esperaAmbSenyal(Promise.all([
      Promise.resolve(local).then(bytes => crypto.subtle.digest('SHA-256', bytes)), crypto.subtle.digest('SHA-256', remot)
    ]), controller.signal);
    comprova();
    const hashLocal = new Uint8Array(a), hashRemot = new Uint8Array(b);
    if (hashLocal.some((v, i) => v !== hashRemot[i])) throw errorAdjuntXat('SDP-XAT-008');
  } catch (cause) {
    if (controller.signal.aborted) throw controller.signal.reason;
    if (cause?.name === 'AbortError') throw cause;
    throw errorAdjuntXat('SDP-XAT-008', { cause });
  } finally {
    if (reader) { try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* Cos ja tancat o avortat. */ } }
    clearTimeout(timer);
    config.signal?.removeEventListener('abort', avorta);
    globalThis.window?.removeEventListener('sdp:auth-change', sessioCanvia);
  }
}

/* XAT-03 · Amb `onProgres`, la pujada va per XMLHttpRequest: fetch no diu
   quants bytes han eixit. El temps límit, la cancel·lació i els codis són els
   de sempre (puja), i la resposta es llig com la de fetch.
   Seguretat (pendent de decisió del Mestre): la interfície sempre passa
   onProgres, així que tota pujada real va per ací, i XHR seguix les
   redireccions sense poder-les vetar com redirect: 'error'. Davant d'un 307
   o 308 del Storage, el cos (la foto o la nota privada) ja ha eixit cap al
   destí redirigit abans que es mire responseURL: esta comprovació només evita
   publicar-lo (falla com xarxa). Cal que el Storage del node redirigisca, i
   eixe node ja rep el cos. La branca fetch queda per a qui no demana progrés. */
function enviaAmbProgres(url, { method, signal, body, headers }, onProgres) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const autoritzada = new URL(url);
    let tancada = false;
    const avorta = () => xhr.abort();
    const acaba = fes => {
      if (tancada) return;
      tancada = true;
      signal.removeEventListener('abort', avorta);
      xhr.onload = xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;
      xhr.upload.onprogress = null;
      fes();
    };
    const respostaAutoritzada = () => {
      if (!xhr.responseURL) return false;
      try {
        const rebuda = new URL(xhr.responseURL);
        return rebuda.origin === autoritzada.origin && !rebuda.username && !rebuda.password;
      } catch { return false; }
    };
    const vetaRedireccio = () => {
      acaba(() => reject(new TypeError('Origen de resposta de pujada no autoritzat.')));
      xhr.abort();
    };
    xhr.upload.onprogress = e => { if (!tancada && e.lengthComputable && e.total > 0) onProgres(Math.min(1, e.loaded / e.total)); };
    xhr.onreadystatechange = () => { if (xhr.readyState === 2 && !respostaAutoritzada()) vetaRedireccio(); };
    xhr.onload = () => {
      if (!respostaAutoritzada()) { vetaRedireccio(); return; }
      acaba(() => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: async () => xhr.responseText }));
    };
    xhr.onerror = () => acaba(() => reject(new TypeError('Failed to fetch')));
    xhr.onabort = () => acaba(() => reject(new DOMException('Operació cancel·lada.', 'AbortError')));
    xhr.open(method, url);
    for (const [nom, valor] of Object.entries(headers)) xhr.setRequestHeader(nom, valor);
    if (signal.aborted) { acaba(() => reject(new DOMException('Operació cancel·lada.', 'AbortError'))); return; }
    signal.addEventListener('abort', avorta, { once: true });
    xhr.send(body);
  });
}

async function puja(ruta, fitxer, usuari, config, onProgres, comprova = () => vigent(usuari, config)) {
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  const jwt = jwtPerBackend(config);
  if (!jwt) throw errorAdjuntXat('sessio-caducada');
  const controller = new AbortController();
  let esgotat = false;
  const avorta = () => controller.abort();
  const sessioCanvia = () => { try { comprova(); } catch (error) { controller.abort(error); } };
  const timer = setTimeout(() => { esgotat = true; avorta(); }, tempsLimitPujada(fitxer.size));
  config.signal?.addEventListener('abort', avorta, { once: true });
  globalThis.window?.addEventListener('sdp:auth-change', sessioCanvia);
  try {
    comprova();
    const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${ruta}`;
    const peticio = {
      method: 'POST', signal: controller.signal, body: fitxer,
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${jwt}`, 'Content-Type': fitxer.type, 'x-upsert': 'false' }
    };
    const resposta = typeof onProgres === 'function' && typeof XMLHttpRequest === 'function'
      ? await enviaAmbProgres(url, peticio, onProgres)
      : await fetch(url, { ...peticio, redirect: 'error' });
    if (controller.signal.aborted) throw controller.signal.reason;
    // Un 409 exigix GET + SHA-256 abans de publicar: MIME/mida de la RPC no acrediten el cos.
    if (!resposta.ok && resposta.status !== 409) {
      const cos = await resposta.text();
      throw tradueix(Object.assign(new Error(`No hem pogut pujar el fitxer: ${cos || resposta.status}`), { status: resposta.status }));
    }
    return resposta.status === 409;
  } catch (error) {
    if (esgotat) throw errorAdjuntXat('temps-esgotat', { name: 'TimeoutError' });
    if (controller.signal.reason?.code === 'sessio-caducada') throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timer);
    config.signal?.removeEventListener('abort', avorta);
    globalThis.window?.removeEventListener('sdp:auth-change', sessioCanvia);
  }
}

export async function quotaXat(config = {}) {
  const { comprova } = capturaOperacio(config);
  const quota = primera(await crida('xat_quota', {}, config));
  comprova();
  if (!Number.isSafeInteger(Number(quota?.usats)) || Number(quota?.usats) < 0 || ![20_000_000, QUOTA_XAT_BYTES].includes(Number(quota?.limit))) throw noDisponible();
  const pendents = Array.isArray(quota.pendents) ? quota.pendents.filter((a) => UUID.test(a?.id) && Number.isSafeInteger(a.bytes) && a.bytes > 0) : [];
  return { usats: Number(quota.usats), limit: Number(quota.limit), pendents };
}

export async function descartaAdjuntXat(id, config = {}) {
  const { comprova } = capturaOperacio(config);
  if (!UUID.test(id)) throw errorAdjuntXat('descart');
  const fila = primera(await crida('xat_prepara_descart', { p_id: id }, config));
  comprova();
  if (fila?.ruta === null) return true;
  if (fila?.ruta !== id) throw errorAdjuntXat('descart');
  try { await request(`/storage/v1/object/${BUCKET}`, config, { method: 'DELETE', body: { prefixes: [fila.ruta] }, signal: config.signal }); }
  catch (error) { throw tradueix(error); }
  comprova();
  if (!(await crida('xat_cancella_reserva', { p_id: id }, config))) throw errorAdjuntXat('descart');
  comprova();
  return true;
}

/* XAT-03 · `onProgres(fraccio 0..1)` és opcional i no passa a les RPC. */
export async function publicaAdjuntXat(filId, entrada, { onProgres, ...config } = {}) {
  const { usuari, comprova } = capturaOperacio(config);
  if (!UUID.test(filId) || !UUID.test(entrada?.id)) throw errorAdjuntXat('format');
  validaAdjuntXat(entrada);
  const { id, fitxer, tipus, duradaMs, respostaA = null } = entrada;
  const ubicacio = normalitzaUbicacioXat(entrada.ubicacio);
  const text = String(entrada.text ?? '').trim() || null;
  if (tipus === 'imatge') await comprovaImatgeSenseUbicacio(fitxer, comprova, config.signal);
  const reserva = primera(await crida('xat_reserva_adjunt', {
    p_id: id, p_fil_id: filId, p_bytes: fitxer.size, p_mime: fitxer.type, p_durada_ms: duradaMs ?? null
  }, config));
  comprova();
  if (reserva?.ruta !== id) throw errorAdjuntXat('sense-confirmacio');
  let duplicat = false;
  if (!reserva.pujat) {
    try { duplicat = await puja(reserva.ruta, fitxer, usuari, config, onProgres, comprova); }
    catch (error) {
      // Una reserva sense objecte pot alliberar-se. Si Storage ha acabat encara
      // que es perdera la resposta, la RPC la conserva per al reintent.
      const fallada = tradueix(error);
      let mateixaSessio = false;
      try { comprova({ ignoraAbort: true }); mateixaSessio = true; } catch { /* Cap neteja amb una altra sessió o un JWT caducat. */ }
      if (mateixaSessio) {
        try { await crida('xat_cancella_reserva', { p_id: id }, { ...config, signal: undefined }); }
        catch (errorAlliberament) { fallada.errorAlliberament = errorAlliberament; }
      }
      throw fallada;
    }
  }
  comprova();
  if (reserva.pujat || duplicat) await comprovaObjectePujat(reserva.ruta, fitxer, config, comprova);
  /* Gauntlet 261022_0225 (crítica Claude, MEDIA-5) · Sense peu, text null:
     cap «Foto» en valencià desat al servidor (la migració 2610220240 ho
     admet); l'etiqueta traduïda la pinta qui llig. */
  const params = { p_id: id, p_text: text, p_resposta_a: respostaA, ...(ubicacio ? { p_ubicacio: ubicacio } : {}) };
  /* Compatibilitat amb nodes que només tenen la RPC de tres arguments.
     La foto ja ha acreditat bytes sense GPS abans de la reserva; llevar
     p_ubicacio només lleva el DTO. Mai és una operació de sanejament binari. */
  let ubicacioNoAdmesa = false;
  let m;
  try { m = primera(await crida('xat_publica_adjunt', params, config)); }
  catch (error) {
    if (!ubicacio || error?.code !== noDisponible().code) throw error;
    comprova();
    if (tipus === 'video') await comprovaVideoSenseUbicacio(fitxer, comprova, config.signal);
    const sense = { ...params };
    delete sense.p_ubicacio;
    m = primera(await crida('xat_publica_adjunt', sense, config));
    ubicacioNoAdmesa = true;
  }
  comprova();
  const seq = typeof m?.seq === 'number' ? m.seq : typeof m?.seq === 'string' && /^[1-9]\d*$/.test(m.seq) ? Number(m.seq) : NaN;
  if (m?.id !== id || m.encuat === true || !Number.isSafeInteger(seq) || seq <= 0 || m.tipus !== tipus
    || (m.fil_id != null && m.fil_id !== filId)) throw errorAdjuntXat('sense-confirmacio');
  const llocConfirmat = normalitzaUbicacioXat(m.metadades?.ubicacio);
  if ((ubicacio && !ubicacioNoAdmesa && (!llocConfirmat || llocConfirmat.lat !== ubicacio.lat || llocConfirmat.lng !== ubicacio.lng))
    || ((!ubicacio || ubicacioNoAdmesa || entrada.conservaUbicacio === false) && llocConfirmat)) throw errorAdjuntXat('sense-confirmacio');
  return { id: m.id, filId, seq, usuariId: m.usuari_id, autorNom: m.autor_nom,
    text: m.cos, tipus: m.tipus, respostaA: m.resposta_a, metadades: m.metadades,
    comOrgId: m.com_org_id, creatAl: m.creat_al, esIA: false, ...(ubicacioNoAdmesa ? { ubicacioNoAdmesa: true } : {}) };
}

/* Gauntlet 261022_0225 (crítica Claude, MEDIA-8, STRESS-2 i STRESS-7) · La
   ruta d'un adjunt no canvia mai i la signatura dura 60 s. Per persona, es
   guarden la ruta i l'última URL: una bombolla que es torna a muntar (el mode
   de selecció, tornar a la conversa) dins de la finestra reutilitza la
   mateixa URL, sense cap petició i amb la memòria cau HTTP del navegador; si
   ha caducat, només es torna a signar (una petició, no dues), i Storage
   continua aplicant la mateixa política de lectura. `renova` (després d'un
   error de càrrega) força una signatura nova. Un canvi de sessió no hereta
   res. La cau també queda separada per backend, poble i entrada de sessió. */
const SEGONS_SIGNATURA = 60;
const MARGE_SIGNATURA_MS = 15_000;
const MAXIM_SIGNATURES = 300;
const signatures = new Map();
let propietariSignatures = null;
function recordaSignatura(usuari, id, valor) {
  if (propietariSignatures !== usuari) { signatures.clear(); propietariSignatures = usuari; }
  signatures.delete(id);
  signatures.set(id, valor);
  if (signatures.size > MAXIM_SIGNATURES) signatures.delete(signatures.keys().next().value);
}

/* Gauntlet R22 (xat-05) · «Descarrega» del visor: la URL signada és d'un altre
   origen (Storage) i el navegador hi ignora l'atribut `download` de l'enllaç
   (obria la foto en una pestanya nova). Storage admet el paràmetre `download`
   a la URL signada (GET /object/sign/…?token=…&download=<nom>, el mateix que
   afig createSignedUrl(ruta, segons, { download }) de storage-js) i respon amb
   Content-Disposition: attachment. No és part de la signatura (el token):
   s'afig a la URL que es torna, mai a la desada, i la bombolla continua rebent
   la de veure. `descarrega: true` deixa el nom de l'objecte; un text, eixe nom
   si és un nom de fitxer net (lletres i xifres ASCII, punt, guió i guió baix,
   fins a 120); si no, també el de l'objecte. */
const RE_NOM_DESCARREGA = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
function ambDescarrega(url, descarrega) {
  if (descarrega !== true && typeof descarrega !== 'string') return url;
  const nom = typeof descarrega === 'string' && RE_NOM_DESCARREGA.test(descarrega) ? descarrega : '';
  return `${url}&download=${encodeURIComponent(nom)}`;
}

export async function urlAdjuntXat(id, config = {}, { renova = false, descarrega = false } = {}) {
  const { comprova, clau } = capturaOperacio(config);
  if (!UUID.test(id)) throw errorAdjuntXat('no-disponible');
  const desat = propietariSignatures === clau ? signatures.get(id) : null;
  if (!renova && desat?.url && desat.caducaAl - Date.now() > MARGE_SIGNATURA_MS) return ambDescarrega(desat.url, descarrega);
  let ruta = desat?.ruta;
  if (!ruta) {
    const fila = primera(await crida('xat_llegix_adjunt', { p_id: id }, config));
    comprova();
    if (fila?.ruta !== id) throw errorAdjuntXat('no-disponible');
    ruta = fila.ruta;
  }
  const inici = Date.now();
  let data;
  try {
    data = await request(`/storage/v1/object/sign/${BUCKET}/${ruta}`, config,
      { method: 'POST', body: { expiresIn: SEGONS_SIGNATURA }, signal: config.signal });
  } catch (error) {
    // Sense lectura vigent, la ruta tampoc es guarda.
    if (propietariSignatures === clau) signatures.delete(id);
    throw tradueix(error);
  }
  comprova();
  const esperat = `/object/sign/${BUCKET}/${ruta}?`;
  if (!data?.signedURL?.startsWith(esperat)) throw errorAdjuntXat('obrir');
  const url = `${getResolvedConfig(config).supabaseUrl}/storage/v1${data.signedURL}`;
  recordaSignatura(clau, id, { ruta, url, caducaAl: inici + SEGONS_SIGNATURA * 1000 });
  return ambDescarrega(url, descarrega);
}

/* E1.2 (pla 261029_1305) · Les peces del transport que la branca xifrada
   (xatXifrat.js) reutilitza, sense duplicar la pujada ni la traducció d'errors. */
export const transportAdjunts = Object.freeze({ BUCKET, SEGONS_SIGNATURA, UUID, context, vigent, tradueix, crida, primera, puja });
