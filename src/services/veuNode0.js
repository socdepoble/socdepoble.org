/**
 * veuNode0.js · IDEA-108 (Onada R7, 261106) + Onada R23 (veus territorials en viu) ·
 * El camí Node 0 de la veu de la IAIA: l'únic lloc amb crides de xarxa.
 * Separat de veuIaiaService.js perquè cap fitxer de la IAIA del client en faça
 * (legal.iaia.test.js, P1-24). Només el crida veuIaiaService, mai amb
 * `privat: true` ni sense un punt HTTPS configurat; vegeu el contracte a
 * veuIaiaService.js.
 */

import { llegeixAudioNode0 } from '../data/audioNode0Segur.js';

export const CODI_VEU_NO_DISPONIBLE = 'VEU_NO_DISPONIBLE';
export const CODI_VEU_AVORTADA = 'VEU_AVORTADA';

export const PUNT_NODE0_PUBLIC = 'https://socdepoble.cat/api/v1/node0/veu';

export const TEMPS_LIMIT_NODE0_MS = 6000;
export const TEMPS_LIMIT_SALUT_MS = 2000;
export const VIDA_SALUT_BONA_MS = 5 * 60 * 1000;
export const VIDA_SALUT_DOLENTA_MS = 60 * 1000;
export const MAX_CARACTERS_BLOC_NODE0 = 240;

let salut = { punt: null, bona: false, finsA: 0 };
let revisioSalut = 0;
export const MAX_RECURSOS_VEU = 4;

/** Esborra la comprovació de salut en memòria. */
export function reiniciaSalutNode0() {
  revisioSalut += 1;
  salut = { punt: null, bona: false, finsA: 0 };
}

export const nouError = (codi, missatge, causa) => {
  const error = new Error(missatge);
  error.codi = codi;
  if (causa !== undefined) error.cause = causa;
  return error;
};

async function ambLimit(fn, ms, signalExtern) {
  if (signalExtern?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  const control = new AbortController();
  let rebutja;
  const cancelada = new Promise((_resolve, reject) => { rebutja = reject; });
  const avorta = (extern) => {
    control.abort();
    rebutja(nouError(extern ? CODI_VEU_AVORTADA : CODI_VEU_NO_DISPONIBLE, extern ? 'Locució aturada.' : 'El Node 0 ha trigat massa.'));
  };
  const temporitzador = setTimeout(() => avorta(false), ms);
  const alExtern = () => avorta(true);
  signalExtern?.addEventListener('abort', alExtern, { once: true });
  try {
    // També liquida la promesa si un transport alié ignora abort.
    return await Promise.race([fn(control.signal), cancelada]);
  } finally {
    clearTimeout(temporitzador);
    signalExtern?.removeEventListener('abort', alExtern);
  }
}

async function nodeZeroSa(punt, signal) {
  if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  const ara = Date.now();
  if (punt === salut.punt && ara < salut.finsA) return salut.bona;
  const revisio = revisioSalut;
  let bona = false;
  try {
    const resposta = await ambLimit((s) => fetch(`${punt}/salut`, { method: 'GET', signal: s, credentials: 'omit' }),
      TEMPS_LIMIT_SALUT_MS, signal);
    bona = Boolean(resposta?.ok);
  } catch {
    /* V-03 · Si l'han avortada de fora (atura() o un signal extern), no és
       cap dada sobre la salut del Node 0: no es desa com a dolenta. */
    if (signal?.aborted) return false;
    bona = false;
  }
  if (!signal?.aborted && revisioSalut === revisio) salut = { punt, bona, finsA: Date.now() + (bona ? VIDA_SALUT_BONA_MS : VIDA_SALUT_DOLENTA_MS) };
  return bona;
}

async function demanaBlocAudioNode0(punt, blocText, idioma, veu, signal) {
  const payload = typeof veu === 'string' && veu ? { text: blocText, idioma, veu } : { text: blocText, idioma };
  return ambLimit(async (s) => {
    const resposta = await fetch(punt, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: s,
      credentials: 'omit',
    });
    try { return await llegeixAudioNode0(resposta, { signal: s }); }
    catch (causa) {
      throw nouError(signal?.aborted ? CODI_VEU_AVORTADA : CODI_VEU_NO_DISPONIBLE,
        signal?.aborted ? 'Locució aturada.' : 'Resposta del Node 0 no vàlida.', causa);
    }
  }, TEMPS_LIMIT_NODE0_MS, signal);
}

function reprodueixBlob(blob, signal, registra, reproductorCompartit, onInici) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(nouError(CODI_VEU_AVORTADA, 'Locució aturada.')); return; }
    const adreca = URL.createObjectURL(blob);
    const audio = reproductorCompartit;
    let acabada = false;
    let iniciat = false;
    const enIniciar = () => { if (!acabada && !iniciat && !signal?.aborted) { iniciat = true; onInici?.(); } };
    const enAcabar = () => acaba();
    const enError = () => acaba(nouError(CODI_VEU_NO_DISPONIBLE, 'L\'àudio del Node 0 no es pot reproduir.'));
    const enAvortar = () => acaba(nouError(CODI_VEU_AVORTADA, 'Locució aturada.'));
    const acaba = (error) => {
      if (acabada) return;
      acabada = true;
      audio.removeEventListener?.('ended', enAcabar);
      audio.removeEventListener?.('error', enError);
      audio.removeEventListener?.('playing', enIniciar);
      signal?.removeEventListener('abort', enAvortar);
      if (error) { try { audio.pause(); } catch { /* ja parat */ } }
      URL.revokeObjectURL(adreca);
      if (error) reject(error); else resolve(audio);
    };
    try {
      registra((codi) => acaba(nouError(codi, 'Locució aturada.')));
      audio.addEventListener('ended', enAcabar);
      audio.addEventListener('error', enError);
      audio.addEventListener('playing', enIniciar);
      signal?.addEventListener('abort', enAvortar, { once: true });
      audio.src = adreca;
      Promise.resolve(audio.play()).catch((causa) => acaba(nouError(CODI_VEU_NO_DISPONIBLE, 'L\'àudio del Node 0 no s\'ha pogut iniciar.', causa)));
    } catch (causa) { acaba(nouError(CODI_VEU_NO_DISPONIBLE, 'L\'àudio del Node 0 no s\'ha pogut iniciar.', causa)); }
  });
}

/** Sessió curta de recursos: com a màxim quatre slots (Blob o petició).
 * L'actiu queda fixat; el lookahead guarda només el primer fragment de cada
 * bloc editorial. No es creen objectURL fins que es consumix un Blob. */
export function creaSessioNode0(signal) {
  const control = new AbortController();
  const recursos = new Map();
  let audio = null, cancelaAudio = null, salutPendent = null;
  const vigent = () => {
    if (control.signal.aborted || signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  };
  const tanca = () => {
    if (control.signal.aborted) return;
    control.abort(); cancelaAudio?.(CODI_VEU_AVORTADA);
    for (const entrada of recursos.values()) entrada.control.abort();
    recursos.clear();
    if (audio) {
      try { audio.pause(); audio.removeAttribute?.('src'); audio.load?.(); } catch { /* alliberament del reproductor */ }
    }
    signal?.removeEventListener('abort', tanca);
  };
  signal?.addEventListener('abort', tanca, { once: true });
  if (signal?.aborted) tanca();
  const demana = (punt, text, idioma, veu, fixat = false) => {
    vigent();
    const clau = JSON.stringify([punt, idioma, veu, text]);
    let entrada = recursos.get(clau);
    if (entrada) {
      entrada.fixat ||= fixat;
      recursos.delete(clau); recursos.set(clau, entrada);
      return entrada;
    }
    if (recursos.size >= MAX_RECURSOS_VEU) {
      const candidata = [...recursos.entries()].find(([, e]) => !e.fixat && e.blob);
      // Una petició encara en curs conserva el seu slot; no obrim una cinquena
      // connexió perquè un transport alié puga ignorar l'avortament de l'antiga.
      const expulsable = candidata;
      if (!expulsable) return null;
      recursos.delete(expulsable[0]); expulsable[1].control.abort();
    }
    entrada = { control: new AbortController(), fixat, blob: null, promesa: null };
    recursos.set(clau, entrada);
    const alTancar = () => entrada.control.abort();
    control.signal.addEventListener('abort', alTancar, { once: true });
    entrada.promesa = (async () => {
      salutPendent ||= nodeZeroSa(punt, control.signal).finally(() => { salutPendent = null; });
      if (!await salutPendent) throw nouError(CODI_VEU_NO_DISPONIBLE, 'Node 0 sense salut.');
      vigent();
      const blob = await demanaBlocAudioNode0(punt, text, idioma, veu, entrada.control.signal);
      vigent();
      if (recursos.get(clau) !== entrada || entrada.control.signal.aborted) throw nouError(CODI_VEU_AVORTADA, 'Precàrrega descartada.');
      entrada.blob = blob;
      return blob;
    })().catch((error) => {
      if (recursos.get(clau) === entrada) recursos.delete(clau);
      throw error;
    }).finally(() => control.signal.removeEventListener('abort', alTancar));
    entrada.promesa.catch(() => {});
    return entrada;
  };
  const precarrega = async (punt, text, idioma, veu) => {
    const entrada = demana(punt, text, idioma, veu);
    if (!entrada) return false;
    await entrada.promesa;
    return true;
  };
  const parla = async (punt, blocs, idioma, veu, onInici) => {
    for (let i = 0; i < blocs.length; i += 1) {
      vigent();
      const entrada = demana(punt, blocs[i], idioma, veu, true);
      if (!entrada) throw nouError(CODI_VEU_NO_DISPONIBLE, 'No queda espai per a preparar la veu.');
      const blob = await entrada.promesa;
      vigent();
      if (i + 1 < blocs.length) precarrega(punt, blocs[i + 1], idioma, veu).catch(() => {});
      audio ||= new Audio();
      await reprodueixBlob(blob, control.signal, (cancela) => { cancelaAudio = cancela; }, audio, i === 0 ? onInici : null);
      cancelaAudio = null;
      const clau = JSON.stringify([punt, idioma, veu, blocs[i]]);
      if (recursos.get(clau) === entrada) recursos.delete(clau);
    }
  };
  return { parla, precarrega, tanca };
}

const fragmentsNode0 = (text, partirBlocs) => typeof partirBlocs === 'function' && text.length > MAX_CARACTERS_BLOC_NODE0
  ? partirBlocs(text, MAX_CARACTERS_BLOC_NODE0) : [text];

export async function precarregaVeu(punt, text, idioma, signal, veu, partirBlocs, sessio) {
  if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  return sessio.precarrega(punt, fragmentsNode0(text, partirBlocs)[0], idioma, veu);
}

export async function parlaPerNodeZero(punt, text, idioma, signal, registra, veu = null, partirBlocs = null, sessio = null, onInici = null) {
  const recursos = sessio || creaSessioNode0(signal);
  registra(() => recursos.tanca());
  try {
    await recursos.parla(punt, fragmentsNode0(text, partirBlocs), idioma, veu, onInici);
  } finally {
    if (!sessio) recursos.tanca();
  }
}
