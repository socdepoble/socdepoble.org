/**
 * src/data/supabase/xatXifrat.js — Transport opac de les capacitats `clausXat`
 * (13 mètodes) i `xatMultimediaXifrat` (2) del port (src/data/contracte.js;
 * disseny E2EE §7.4, §8.3 i §8.4; pla 261029_1305, Bloc C, E1.1 i E1.2).
 *
 * Opac vol dir: cap criptografia, cap `trim`, cap recodificació. Cada mètode
 * és una RPC amb els seus paràmetres; els resultats es mapegen de snake_case
 * a la forma del port i prou. Les RPC d'identitat, frase, claus i llibreta
 * són de la migració 2610290400 (E2EE-1a); les d'estat, èpoques, sobres,
 * enviament, reembolcall, invitació i adjunts són de l'1b/1c (§7.4), encara
 * no al repositori: fins que s'apliquen, PostgREST respon «funció absent»
 * (PGRST202) i ací ix com a `codi: 'sense-capacitat-e2ee'`, mai com un èxit.
 *
 * Reutilitza les peces del transport d'adjunts (context de sessió, vigència,
 * traducció d'errors, crida, pujada): src/data/supabase/xatMultimedia.js.
 */
import { getResolvedConfig, request } from './runtime.js';
import { usuariDeSessio } from '../identitat.js';
import { transportAdjunts } from './xatMultimedia.js';
import { errorAdjuntXat, tempsLimitPujada } from '../xatMultimedia.js';
import { MAXIM_BLOB_ADJUNT, MIME_XIFRAT } from '../xatMultimediaXifrat.js';

const { BUCKET, SEGONS_SIGNATURA, UUID, context, vigent, tradueix, crida, primera, puja } = transportAdjunts;

const SENSE_CAPACITAT = 'sense-capacitat-e2ee';
const esBytes = (v) => Object.prototype.toString.call(v) === '[object Uint8Array]';

/* Una RPC absent al servidor no és «no disponible» a seques: és que esta fase de l'E2EE encara no hi és. */
async function rpcXifrat(nom, params, config) {
  try { return await crida(nom, params, config); }
  catch (error) {
    if (error?.code === 'sense-capacitat' || error?.code === 'no-disponible') error.codi = SENSE_CAPACITAT;
    throw error;
  }
}
const files = (data) => (Array.isArray(data) ? data : (data == null ? [] : [data]));
const numero = (v) => (typeof v === 'number' ? v : (typeof v === 'string' && /^[0-9]+$/.test(v) ? Number(v) : NaN));

const mapejaClau = (r) => ({
  usuariId: r.usuari_id ?? null, kid: r.kid, sigPub: r.sig_pub, dhPub: r.dh_pub, declaracio: r.declaracio, autofirma: r.autofirma,
  kidAnterior: r.kid_anterior ?? null, firmaContinuitat: r.firma_continuitat ?? null, creatAl: r.creat_al ?? null, retiradaAl: r.retirada_al ?? null,
  ...(Object.hasOwn(r, 'copia') ? { copia: r.copia ?? null } : {})
});
const mapejaEpoca = (r) => ({ epoca: numero(r.epoca), declaracio: r.declaracio, firma: r.firma, autorId: r.autor_id ?? null, creatAl: r.creat_al ?? null });
const mapejaSobre = (r) => ({ epoca: numero(r.epoca), receptor: r.receptor, kidReceptor: r.kid_receptor, enc: r.enc, ct: r.ct });

/* La fila d'un missatge xifrat: `text` nul i el sobre tal qual (text: null, tipus: 'text' sempre; §8.4). */
export const mapejaMissatgeXifrat = (m, filId) => ({
  id: m.id, filId: m.fil_id ?? filId, seq: numero(m.seq), usuariId: m.usuari_id, autorNom: m.autor_nom ?? null, text: null, tipus: 'text',
  respostaA: m.resposta_a ?? null, editatAl: m.editat_al ?? null, esborratAl: m.esborrat_al ?? null,
  metadades: m.metadades && typeof m.metadades === 'object' ? m.metadades : {}, esIA: Boolean(m.es_ia), comOrgId: m.com_org_id ?? null,
  creatAl: m.creat_al, xifrat: m.xifrat && typeof m.xifrat === 'object' ? m.xifrat : null
});

/* ── clausXat ─────────────────────────────────────────────────────────────── */

export async function publicaIdentitatXat({ kidAnterior = null, declaracio, autofirma, firmaContinuitat = null, copia } = {}, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_publica_identitat', { p_kid_anterior: kidAnterior, p_declaracio: declaracio, p_autofirma: autofirma, p_firma_continuitat: firmaContinuitat, p_copia: copia }, config);
  vigent(usuari, config);
  return primera(data)?.kid ?? null;
}

export async function laMevaIdentitatXat(config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_la_meua_identitat', {}, config);
  vigent(usuari, config);
  return files(data).map(mapejaClau);
}

export async function desaFraseXat({ kid, frase } = {}, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_desa_frase', { p_kid: kid, p_frase: frase }, config);
  vigent(usuari, config);
  return primera(data) === true;
}

export async function clausDeXat(usuaris, config = {}) {
  const usuari = context(config);
  const llista = Array.isArray(usuaris) ? usuaris : [];
  if (!llista.every((u) => typeof u === 'string' && UUID.test(u))) throw errorAdjuntXat('format', { codi: 'usuaris-invalids' });
  const data = await rpcXifrat('xat_claus_de', { p_usuaris: llista }, config);
  vigent(usuari, config);
  return files(data).map(mapejaClau);
}

export async function desaLlibretaXat({ comptador, llibreta } = {}, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_desa_llibreta', { p_comptador: comptador, p_llibreta: llibreta }, config);
  vigent(usuari, config);
  return numero(primera(data));
}

export async function laMevaLlibretaXat(config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_la_meua_llibreta', {}, config);
  vigent(usuari, config);
  const r = primera(data);
  return r ? { kid: r.kid, comptador: numero(r.comptador), iv: r.iv, ct: r.ct, firma: r.firma, actualitzatAl: r.actualitzat_al ?? null } : null;
}

export async function estatXifratXat(fils, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_estat_xifrat', { p_fils: Array.isArray(fils) ? fils : [] }, config);
  vigent(usuari, config);
  return files(data).map((r) => ({
    filId: r.fil_id, epoca: numero(r.epoca), cap: r.cap ?? null, e2eeDesDeSeq: r.e2ee_des_de_seq == null ? null : numero(r.e2ee_des_de_seq),
    abast: r.abast ?? null, declaracio: r.declaracio ?? null, sobre: r.sobre ?? null
  }));
}

export async function epoquesDelFilXat(filId, desDe = 0, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_epoques_del_fil', { p_fil_id: filId, p_des_de: desDe }, config);
  vigent(usuari, config);
  return files(data).map(mapejaEpoca);
}

export async function sobresMeusXat(filId, epoques, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_meus_sobres', { p_fil_id: filId, p_epoques: Array.isArray(epoques) ? epoques : [] }, config);
  vigent(usuari, config);
  return files(data).map(mapejaSobre);
}

export async function obriEpocaXat(filId, epocaNova, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_obri_epoca', { p_fil_id: filId, p_epoca_nova: epocaNova }, config);
  vigent(usuari, config);
  return primera(data) ?? null;
}

export async function enviaXifratXat(filId, paquet, config = {}) {
  const usuari = context(config);
  if (!paquet || typeof paquet !== 'object' || paquet.text !== null || !paquet.xifrat || typeof paquet.xifrat !== 'object') {
    throw errorAdjuntXat('format', { codi: 'SDP-XAT-031' });
  }
  const data = await rpcXifrat('xat_envia_xifrat', {
    p_id: paquet.id, p_fil_id: filId, p_resposta_a: paquet.respostaA ?? null, p_xifrat: paquet.xifrat, p_epoca_nova: paquet.epocaNova ?? null
  }, config);
  vigent(usuari, config);
  const m = primera(data);
  if (!m || m.id !== paquet.id) throw errorAdjuntXat('sense-confirmacio', { codi: 'eco-absent' });
  return mapejaMissatgeXifrat(m, filId);
}

export async function reembolcallaXat(filId, items, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_reembolcalla', { p_fil_id: filId, p_items: Array.isArray(items) ? items : [] }, config);
  vigent(usuari, config);
  return primera(data) ?? null;
}

export async function demanaXifratXat(filId, config = {}) {
  const usuari = context(config);
  const data = await rpcXifrat('xat_demana_xifrat', { p_fil_id: filId }, config);
  vigent(usuari, config);
  return primera(data) ?? null;
}

/* ── xatMultimediaXifrat ─────────────────────────────────────────────────── */

/** Puja el blob xifrat (octet-stream, mida exacta) i publica el missatge xifrat que el porta. El hash no viatja: viu dins del cos xifrat. */
export async function publicaAdjuntXifratXat(filId, entrada, { onProgres, ...config } = {}) {
  const usuari = context(config);
  vigent(usuari, config);
  if (!UUID.test(filId) || !UUID.test(entrada?.id)) throw errorAdjuntXat('format');
  const { id, blob, mida, xifrat, respostaA = null, epocaNova = null } = entrada;
  if (!esBytes(blob) || blob.length !== mida || mida < 64 || mida > MAXIM_BLOB_ADJUNT) throw errorAdjuntXat('format', { codi: 'adjunt-incoherent' });
  if (!xifrat || typeof xifrat !== 'object') throw errorAdjuntXat('format', { codi: 'adjunt-invalid' });
  const reserva = primera(await crida('xat_reserva_adjunt', { p_id: id, p_fil_id: filId, p_bytes: mida, p_mime: MIME_XIFRAT, p_durada_ms: null }, config));
  vigent(usuari, config);
  if (reserva?.ruta !== id) throw errorAdjuntXat('sense-confirmacio');
  if (!reserva.pujat) {
    try { await puja(reserva.ruta, new Blob([blob], { type: MIME_XIFRAT }), usuari, config, onProgres); }
    catch (error) {
      if (usuariDeSessio()?.id === usuari) await crida('xat_cancella_reserva', { p_id: id }, { ...config, signal: undefined }).catch(() => {});
      throw tradueix(error);
    }
  }
  vigent(usuari, config);
  const m = primera(await rpcXifrat('xat_publica_adjunt_xifrat', { p_id: id, p_resposta_a: respostaA, p_xifrat: xifrat, p_epoca_nova: epocaNova }, config));
  vigent(usuari, config);
  const seq = numero(m?.seq);
  if (m?.id !== id || !Number.isSafeInteger(seq) || seq <= 0 || m.cos != null) throw errorAdjuntXat('sense-confirmacio');
  return mapejaMissatgeXifrat(m, filId);
}

/* Baixada dels bytes d'un adjunt signat: temps límit rural, cancel·lació i mida comprovada abans de llegir el cos. */
async function baixa(url, usuari, config, midaEsperada) {
  const control = new AbortController();
  const temps = setTimeout(() => control.abort(new DOMException('Temps esgotat.', 'TimeoutError')), tempsLimitPujada(midaEsperada ?? MAXIM_BLOB_ADJUNT));
  const avorta = () => control.abort(new DOMException('Operació cancel·lada.', 'AbortError'));
  config.signal?.addEventListener?.('abort', avorta, { once: true });
  try {
    let resposta;
    try { resposta = await fetch(url, { method: 'GET', redirect: 'error', signal: control.signal }); }
    catch (error) {
      if (control.signal.aborted && control.signal.reason?.name === 'TimeoutError') throw errorAdjuntXat('temps-esgotat', { name: 'TimeoutError', cause: error });
      throw tradueix(error);
    }
    if (!resposta.ok) throw tradueix(Object.assign(new Error(`No hem pogut baixar el fitxer: ${resposta.status}`), { status: resposta.status }));
    const declarada = Number(resposta.headers?.get?.('content-length'));
    if (midaEsperada !== null && Number.isSafeInteger(declarada) && declarada !== midaEsperada) throw errorAdjuntXat('obrir', { codi: 'adjunt-incoherent' });
    const bytes = new Uint8Array(await resposta.arrayBuffer());
    if (bytes.length > MAXIM_BLOB_ADJUNT || (midaEsperada !== null && bytes.length !== midaEsperada)) throw errorAdjuntXat('obrir', { codi: 'adjunt-incoherent' });
    return bytes;
  } finally {
    clearTimeout(temps);
    config.signal?.removeEventListener?.('abort', avorta);
  }
}

/** Els bytes (xifrats) d'un adjunt: la signatura autoritza; el decorador verifica el hash i desxifra. */
export async function bytesAdjuntXat(id, { midaEsperada = null, ...config } = {}) {
  const usuari = context(config);
  vigent(usuari, config);
  if (!UUID.test(id)) throw errorAdjuntXat('no-disponible');
  const fila = primera(await crida('xat_llegix_adjunt', { p_id: id }, config));
  vigent(usuari, config);
  if (fila?.ruta !== id) throw errorAdjuntXat('no-disponible');
  let data;
  try { data = await request(`/storage/v1/object/sign/${BUCKET}/${fila.ruta}`, config, { method: 'POST', body: { expiresIn: SEGONS_SIGNATURA }, signal: config.signal }); }
  catch (error) { throw tradueix(error); }
  vigent(usuari, config);
  if (!data?.signedURL?.startsWith(`/object/sign/${BUCKET}/${fila.ruta}?`)) throw errorAdjuntXat('obrir');
  const bytes = await baixa(`${getResolvedConfig(config).supabaseUrl}/storage/v1${data.signedURL}`, usuari, config, midaEsperada);
  vigent(usuari, config);
  return bytes;
}
