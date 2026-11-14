/**
 * veuNode0.js · IDEA-108 (Onada R7, 261106) + Onada R23 (veus territorials en viu) ·
 * El camí Node 0 de la veu de la IAIA: l'únic lloc amb crides de xarxa.
 * Separat de veuIaiaService.js perquè cap fitxer de la IAIA del client en faça
 * (legal.iaia.test.js, P1-24). Només el crida veuIaiaService, mai amb
 * `privat: true` ni sense un punt HTTPS configurat; vegeu el contracte a
 * veuIaiaService.js.
 */

export const CODI_VEU_NO_DISPONIBLE = 'VEU_NO_DISPONIBLE';
export const CODI_VEU_AVORTADA = 'VEU_AVORTADA';

export const PUNT_NODE0_PUBLIC = 'https://socdepoble.cat/api/v1/node0/veu';

export const TEMPS_LIMIT_NODE0_MS = 6000;
export const TEMPS_LIMIT_SALUT_MS = 2000;
export const VIDA_SALUT_BONA_MS = 5 * 60 * 1000;
export const VIDA_SALUT_DOLENTA_MS = 60 * 1000;
export const MAX_CARACTERS_BLOC_NODE0 = 240;

let salut = { bona: false, finsA: 0 };

/** Esborra la comprovació de salut en memòria. */
export function reiniciaSalutNode0() {
  salut = { bona: false, finsA: 0 };
}

export const nouError = (codi, missatge, causa) => {
  const error = new Error(missatge);
  error.codi = codi;
  if (causa !== undefined) error.cause = causa;
  return error;
};

async function ambLimit(fn, ms, signalExtern) {
  const control = new AbortController();
  const temporitzador = setTimeout(() => control.abort(), ms);
  const alExtern = () => control.abort();
  signalExtern?.addEventListener('abort', alExtern, { once: true });
  try {
    return await fn(control.signal);
  } finally {
    clearTimeout(temporitzador);
    signalExtern?.removeEventListener('abort', alExtern);
  }
}

async function nodeZeroSa(punt, signal) {
  const ara = Date.now();
  if (ara < salut.finsA) return salut.bona;
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
  salut = { bona, finsA: Date.now() + (bona ? VIDA_SALUT_BONA_MS : VIDA_SALUT_DOLENTA_MS) };
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
    const tipus = resposta?.headers?.get?.('content-type') || '';
    if (!resposta?.ok || !/^audio\//i.test(tipus)) throw nouError(CODI_VEU_NO_DISPONIBLE, 'Resposta del Node 0 no vàlida.');
    const dades = await resposta.blob();
    if (!dades || !dades.size) throw nouError(CODI_VEU_NO_DISPONIBLE, 'Àudio buit.');
    return dades;
  }, TEMPS_LIMIT_NODE0_MS, signal);
}

function reprodueixBlob(blob, signal, registra, reproductorCompartit = null) {
  return new Promise((resolve, reject) => {
    const adreca = URL.createObjectURL(blob);
    let audio = reproductorCompartit;
    if (audio && 'src' in audio) {
      audio.src = adreca;
    } else {
      audio = new Audio(adreca);
    }
    let acabada = false;
    const enAcabar = () => acaba();
    const enError = () => acaba(nouError(CODI_VEU_NO_DISPONIBLE, 'L\'àudio del Node 0 no es pot reproduir.'));
    const enAvortar = () => acaba(nouError(CODI_VEU_AVORTADA, 'Locució aturada.'));
    const acaba = (error) => {
      if (acabada) return;
      acabada = true;
      audio.removeEventListener?.('ended', enAcabar);
      audio.removeEventListener?.('error', enError);
      signal?.removeEventListener('abort', enAvortar);
      try { audio.pause(); } catch { /* ja parat */ }
      URL.revokeObjectURL(adreca);
      if (error) reject(error); else resolve(audio);
    };
    registra((codi) => acaba(nouError(codi, 'Locució aturada.')));
    audio.addEventListener('ended', enAcabar);
    audio.addEventListener('error', enError);
    signal?.addEventListener('abort', enAvortar, { once: true });
    Promise.resolve(audio.play()).catch((causa) => acaba(nouError(CODI_VEU_NO_DISPONIBLE, 'L\'àudio del Node 0 no s\'ha pogut iniciar.', causa)));
  });
}

/* Torna una promesa si ha parlat pel Node 0; llança qualsevol error perquè qui
   crida passe al navegador (llevat de VEU_AVORTADA, que es respecta).
   Onada R23 · En articles llargs (> 240 caràcters) encadena blocs de frases amb
   pre-descàrrega (prefetch) del bloc següent i reutilitza el mateix element Audio
   perquè sone de principi a fi sense talls en mòbil amb qualsevol de les 7 veus. */
export async function parlaPerNodeZero(punt, text, idioma, signal, registra, veu = null, partirBlocs = null) {
  if (!await nodeZeroSa(punt, signal)) throw nouError(CODI_VEU_NO_DISPONIBLE, 'Node 0 sense salut.');
  const blocs = typeof partirBlocs === 'function' && text.length > MAX_CARACTERS_BLOC_NODE0
    ? partirBlocs(text, MAX_CARACTERS_BLOC_NODE0)
    : [text];
  if (!blocs.length) return;

  if (blocs.length === 1) {
    const blob = await demanaBlocAudioNode0(punt, blocs[0], idioma, veu, signal);
    await reprodueixBlob(blob, signal, registra);
    return;
  }

  let reproductor = null;
  let promesaSeguent = demanaBlocAudioNode0(punt, blocs[0], idioma, veu, signal);

  for (let i = 0; i < blocs.length; i += 1) {
    if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
    const actualPromesa = promesaSeguent;
    const teSeguent = i + 1 < blocs.length;
    const blobActual = await actualPromesa;
    if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
    if (teSeguent) {
      promesaSeguent = demanaBlocAudioNode0(punt, blocs[i + 1], idioma, veu, signal);
      /* Evita unhandled rejection si s'avorta mentre es reprodueix el bloc actual. */
      promesaSeguent.catch(() => {});
    }
    reproductor = await reprodueixBlob(blobActual, signal, registra, reproductor);
  }
}
