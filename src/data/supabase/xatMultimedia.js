import { getResolvedConfig, request, rpc } from './runtime.js';
import { jwtPerBackend, usuariDeSessio } from '../identitat.js';
import { ERRORS_ADJUNT_XAT, errorAdjuntXat, tempsLimitPujada, validaAdjuntXat } from '../xatMultimedia.js';

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
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-5) · Tota fallada ix amb un
   `code` d'ERRORS_ADJUNT_XAT: els codis SDP del servidor, l'esquema absent,
   la xarxa i, per a la resta, «servidor». El cos cru («Supabase 403: {…}»)
   només queda a `cause`. Les cancel·lacions i les ja codificades passen. */
function tradueix(error) {
  if (error?.name === 'AbortError' || Object.hasOwn(ERRORS_ADJUNT_XAT, String(error?.code ?? ''))) return error;
  const text = String(error?.message || '');
  const codi = RE_CODI_SDP.exec(text)?.[0];
  if (codi && Object.hasOwn(ERRORS_ADJUNT_XAT, codi)) return errorAdjuntXat(codi, { cause: error });
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
    const avorta = () => xhr.abort();
    const acaba = (fes) => { signal.removeEventListener('abort', avorta); fes(); };
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && e.total > 0) onProgres(Math.min(1, e.loaded / e.total)); };
    xhr.onload = () => acaba(() => {
      if (xhr.responseURL && xhr.responseURL !== new URL(url).href) { reject(new TypeError('Redirecció no admesa.')); return; }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: async () => xhr.responseText });
    });
    xhr.onerror = () => acaba(() => reject(new TypeError('Failed to fetch')));
    xhr.onabort = () => acaba(() => reject(new DOMException('Operació cancel·lada.', 'AbortError')));
    xhr.open(method, url);
    for (const [nom, valor] of Object.entries(headers)) xhr.setRequestHeader(nom, valor);
    if (signal.aborted) { reject(new DOMException('Operació cancel·lada.', 'AbortError')); return; }
    signal.addEventListener('abort', avorta, { once: true });
    xhr.send(body);
  });
}

async function puja(ruta, fitxer, usuari, config, onProgres) {
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  const jwt = jwtPerBackend(config);
  if (!jwt) throw errorAdjuntXat('sessio-caducada');
  const controller = new AbortController();
  let esgotat = false;
  const avorta = () => controller.abort();
  const sessioCanvia = () => { if (usuariDeSessio()?.id !== usuari) avorta(); };
  const timer = setTimeout(() => { esgotat = true; avorta(); }, tempsLimitPujada(fitxer.size));
  config.signal?.addEventListener('abort', avorta, { once: true });
  globalThis.window?.addEventListener('sdp:auth-change', sessioCanvia);
  try {
    vigent(usuari, config);
    const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${ruta}`;
    const peticio = {
      method: 'POST', signal: controller.signal, body: fitxer,
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${jwt}`, 'Content-Type': fitxer.type, 'x-upsert': 'false' }
    };
    const resposta = typeof onProgres === 'function' && typeof XMLHttpRequest === 'function'
      ? await enviaAmbProgres(url, peticio, onProgres)
      : await fetch(url, { ...peticio, redirect: 'error' });
    // Reintent amb el mateix ID: la RPC de publicació valida l'objecte existent.
    if (!resposta.ok && resposta.status !== 409) {
      const cos = await resposta.text();
      throw tradueix(Object.assign(new Error(`No hem pogut pujar el fitxer: ${cos || resposta.status}`), { status: resposta.status }));
    }
  } catch (error) {
    if (esgotat) throw errorAdjuntXat('temps-esgotat', { name: 'TimeoutError' });
    throw error;
  } finally {
    clearTimeout(timer);
    config.signal?.removeEventListener('abort', avorta);
    globalThis.window?.removeEventListener('sdp:auth-change', sessioCanvia);
  }
}

export async function quotaXat(config = {}) {
  const usuari = context(config);
  const quota = primera(await crida('xat_quota', {}, config));
  vigent(usuari, config);
  if (!Number.isSafeInteger(Number(quota?.usats)) || Number(quota?.usats) < 0 || Number(quota?.limit) !== 20_000_000) throw noDisponible();
  const pendents = Array.isArray(quota.pendents) ? quota.pendents.filter((a) => UUID.test(a?.id) && Number.isSafeInteger(a.bytes) && a.bytes > 0) : [];
  return { usats: Number(quota.usats), limit: Number(quota.limit), pendents };
}

export async function descartaAdjuntXat(id, config = {}) {
  const usuari = context(config);
  vigent(usuari, config);
  if (!UUID.test(id)) throw errorAdjuntXat('descart');
  const fila = primera(await crida('xat_prepara_descart', { p_id: id }, config));
  vigent(usuari, config);
  if (fila?.ruta === null) return true;
  if (fila?.ruta !== id) throw errorAdjuntXat('descart');
  try { await request(`/storage/v1/object/${BUCKET}`, config, { method: 'DELETE', body: { prefixes: [fila.ruta] }, signal: config.signal }); }
  catch (error) { throw tradueix(error); }
  vigent(usuari, config);
  if (!(await crida('xat_cancella_reserva', { p_id: id }, config))) throw errorAdjuntXat('descart');
  return true;
}

/* XAT-03 · `onProgres(fraccio 0..1)` és opcional i no passa a les RPC. */
export async function publicaAdjuntXat(filId, entrada, { onProgres, ...config } = {}) {
  const usuari = context(config);
  vigent(usuari, config);
  if (!UUID.test(filId) || !UUID.test(entrada?.id)) throw errorAdjuntXat('format');
  validaAdjuntXat(entrada);
  const { id, fitxer, tipus, duradaMs, respostaA = null } = entrada;
  const reserva = primera(await crida('xat_reserva_adjunt', {
    p_id: id, p_fil_id: filId, p_bytes: fitxer.size, p_mime: fitxer.type, p_durada_ms: duradaMs ?? null
  }, config));
  vigent(usuari, config);
  if (reserva?.ruta !== id) throw errorAdjuntXat('sense-confirmacio');
  if (!reserva.pujat) {
    try { await puja(reserva.ruta, fitxer, usuari, config, onProgres); }
    catch (error) {
      // Una reserva sense objecte pot alliberar-se. Si Storage ha acabat encara
      // que es perdera la resposta, la RPC la conserva per al reintent.
      if (usuariDeSessio()?.id === usuari) {
        await crida('xat_cancella_reserva', { p_id: id }, { ...config, signal: undefined }).catch(() => {});
      }
      throw tradueix(error);
    }
  }
  vigent(usuari, config);
  /* Gauntlet 261022_0225 (crítica Claude, MEDIA-5) · Sense peu, text null:
     cap «Foto» en valencià desat al servidor (la migració 2610220240 ho
     admet); l'etiqueta traduïda la pinta qui llig. */
  const text = String(entrada.text ?? '').trim() || null;
  const m = primera(await crida('xat_publica_adjunt', { p_id: id, p_text: text, p_resposta_a: respostaA }, config));
  vigent(usuari, config);
  if (m?.id !== id || !Number.isSafeInteger(Number(m.seq)) || Number(m.seq) <= 0 || m.tipus !== tipus) throw errorAdjuntXat('sense-confirmacio');
  return { id: m.id, filId, seq: Number(m.seq), usuariId: m.usuari_id, autorNom: m.autor_nom,
    text: m.cos, tipus: m.tipus, respostaA: m.resposta_a, metadades: m.metadades,
    comOrgId: m.com_org_id, creatAl: m.creat_al, esIA: false };
}

/* Gauntlet 261022_0225 (crítica Claude, MEDIA-8, STRESS-2 i STRESS-7) · La
   ruta d'un adjunt no canvia mai i la signatura dura 60 s. Per persona, es
   guarden la ruta i l'última URL: una bombolla que es torna a muntar (el mode
   de selecció, tornar a la conversa) dins de la finestra reutilitza la
   mateixa URL, sense cap petició i amb la memòria cau HTTP del navegador; si
   ha caducat, només es torna a signar (una petició, no dues), i Storage
   continua aplicant la mateixa política de lectura. `renova` (després d'un
   error de càrrega) força una signatura nova. Un canvi de sessió no hereta
   res. */
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

export async function urlAdjuntXat(id, config = {}, { renova = false } = {}) {
  const usuari = context(config);
  if (!UUID.test(id)) throw errorAdjuntXat('no-disponible');
  const desat = propietariSignatures === usuari ? signatures.get(id) : null;
  if (!renova && desat?.url && desat.caducaAl - Date.now() > MARGE_SIGNATURA_MS) return desat.url;
  let ruta = desat?.ruta;
  if (!ruta) {
    const fila = primera(await crida('xat_llegix_adjunt', { p_id: id }, config));
    vigent(usuari, config);
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
    if (propietariSignatures === usuari) signatures.delete(id);
    throw tradueix(error);
  }
  vigent(usuari, config);
  const esperat = `/object/sign/${BUCKET}/${ruta}?`;
  if (!data?.signedURL?.startsWith(esperat)) throw errorAdjuntXat('obrir');
  const url = `${getResolvedConfig(config).supabaseUrl}/storage/v1${data.signedURL}`;
  recordaSignatura(usuari, id, { ruta, url, caducaAl: inici + SEGONS_SIGNATURA * 1000 });
  return url;
}
