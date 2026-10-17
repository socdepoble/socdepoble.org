/**
 * certificacions.js — la Certificació humana del Govern del Mestre: el
 * registre de decisions i on es guarda, sense React.
 *
 * Pla 261016_1530, Onada 0.5, mòdul 3: «Botons senzills perquè el Mestre puga
 * validar, certificar o retornar una tasca amb un sol clic des de la web.»
 * Relleu de Codex (pla 261016_1639, fila I11): «persistència i registre
 * d'actor; la certificació humana no falseja resultat automàtic».
 *
 * Cada decisió és un registre que no es reescriu mai (només s'afig, com el
 * LEDGER): { schema, pla, id, decisio, nota, data, actor, empremta, nonce }.
 * L'empremta és el sha256 del JSON canònic de la fila de la matriu tal com la
 * va escriure Codex (CAMPS_FILA): si la fila canvia després (un altre estat,
 * una altra evidència), la decisió és d'una versió anterior i es diu.
 *
 * On es guarda: el patró del magatzem de la Porta d'Aprovació de Tractors
 * (src/sections/tractors/nucli/magatzem.js): IndexedDB amb pas a memòria si el
 * navegador no la deixa obrir, només afegir, i exportació en JSONL canònic.
 * La certificació viu en este navegador fins que MarIA endolle un canal: cap
 * agent la llig si el Mestre no l'exporta.
 */
/* Còpia pròpia: la frontera de la Gestoria (privacitat.test.js) no deixa
   importar el carril dels Tractors fora de la Wiki. Paritat a canonic.test.js. */
import { base64url, desdeBase64url, jsonCanonic, sha256Hex } from './canonic.js';
import { CAMPS_FILA } from './matriuGovern.js';

export const SCHEMA_CERTIFICACIO = 'sdp.certificacio.v1';
/** Les tres decisions del Mestre, en l'ordre dels botons. */
export const DECISIONS_GOVERN = Object.freeze(['validat', 'certificat', 'retornat']);
/** El verb de cada botó. */
export const VERB_DECISIO = Object.freeze({ validat: 'Valida', certificat: 'Certifica', retornat: 'Retorna amb nota' });
/** Com es diu cada decisió ja presa. */
export const TEXT_DECISIO = Object.freeze({ validat: 'Validada', certificat: 'Certificada', retornat: 'Retornada amb nota' });
/* El to de cada decisió vigent: una validació confirma la lectura de la fila
   i no és cap salut (neutre); una devolució torna a la tanda (taronja); una
   certificació es pot apuntar a qualsevol fila, però només es pinta de verd
   si la fila d'ara es veu [FET I SEGELLAT] (estatVist 'fet'): la d'una fila
   que la matriu no dona per feta va en taronja, amb TEXT_CERTIFICADA_SENSE_FET
   (estatCertificacio). Revisió adversarial del carril F1 · Derogat: «una
   certificació només es pot fer d'una fila feta i segellada». */
export const TO_DECISIO = Object.freeze({ validat: 'neutre', certificat: 'exit', retornat: 'avis' });
export const TEXT_VERSIO_ANTERIOR = 'Certificació d’una versió anterior';
/* Revisió adversarial del carril F1 (problema 13) · Els tres verbs ixen a
   totes les files (l'encàrrec: «tres verbs per fila»). Una certificació d'una
   fila que la matriu no dona per feta s'apunta igual, però es diu així i en
   taronja: la decisió del Mestre es pinta al costat de l'estat de la matriu i
   mai el fa passar per fet. */
export const TEXT_CERTIFICADA_SENSE_FET = 'Certificada (la matriu no la dona per feta)';

const CAMPS = Object.freeze(['schema', 'pla', 'id', 'decisio', 'nota', 'data', 'actor', 'empremta', 'nonce']);
export const PATRO_EMPREMTA_FILA = /^sha256:[0-9a-f]{64}$/;
const MAX_NOTA = 2000;

const textONul = (v) => v === null || (typeof v === 'string' && v.trim() !== '');
const instant = (iso) => (typeof iso === 'string' ? Date.parse(iso) : NaN);

/* La regla de la casa per a dir si un text és un correu: la mateixa expressió
   d'autoriaNota.js (nomPublic) i de search/indexCerca.js (esCorreu). No
   s'importa d'eixos mòduls perquè són d'altres seccions i porten un graf
   d'imports que la Consola no necessita. */
const RE_CORREU = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/**
 * El nom de qui decidix: el de la sessió oberta (les metadades de l'usuari,
 * com autoriaNota.js), mai el correu ni cap identificador. Els noms els
 * escriu l'usuari (l'alta desa el nom com a full_name) i alguns proveïdors
 * posen el correu a «name»: un candidat que és un correu es descarta i es
 * passa al següent, com fa nomPublic d'autoriaNota.js. Null si no hi ha
 * sessió o si la sessió no porta cap nom que no siga un correu: la decisió es
 * desa sense nom i la pàgina ho diu.
 */
export function actorDeLaSessio(usuari) {
  const meta = usuari?.user_metadata ?? {};
  for (const v of [meta.full_name, meta.name, usuari?.full_name]) {
    const nom = typeof v === 'string' ? v.trim() : '';
    if (nom && !RE_CORREU.test(nom)) return nom;
  }
  return null;
}

/** El text exacte que es resumix d'una fila: el JSON canònic dels seus camps de Codex. */
export function preimatgeFila(fila) {
  const brut = fila?.brut ?? {};
  return jsonCanonic(Object.fromEntries(CAMPS_FILA.map((c) => [c, typeof brut[c] === 'string' ? brut[c] : null])));
}

/** L'empremta d'una fila: «sha256:» i 64 hex. `subtle` per defecte, el del navegador. */
export async function empremtaFila(fila, subtle) {
  return `sha256:${await sha256Hex(preimatgeFila(fila), subtle)}`;
}

/** Les empremtes de totes les files d'una matriu: Map id → empremta. */
export async function empremtesDe(matriu, subtle) {
  const parelles = await Promise.all((matriu?.files ?? []).map(async (f) => [f.id, await empremtaFila(f, subtle)]));
  return new Map(parelles);
}

function nonceNou() {
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('Este navegador no pot generar aleatoris: no es pot apuntar cap decisió.');
  }
  return base64url(globalThis.crypto.getRandomValues(new Uint8Array(16)));
}

function nonceValid(text) {
  if (typeof text !== 'string' || !text) return false;
  try {
    const bytes = desdeBase64url(text);
    return bytes.length === 16 && base64url(bytes) === text;
  } catch {
    return false;
  }
}

/** Els errors d'un registre de certificació (llista buida si és vàlid). */
export function validaCertificacio(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return ['La certificació ha de ser un objecte.'];
  const errors = [];
  for (const clau of Object.keys(r)) if (!CAMPS.includes(clau)) errors.push(`Camp desconegut: «${clau}».`);
  if (r.schema !== SCHEMA_CERTIFICACIO) errors.push(`schema ha de ser «${SCHEMA_CERTIFICACIO}».`);
  if (!textONul(r.pla)) errors.push('pla ha de ser un text o null.');
  if (typeof r.id !== 'string' || !r.id.trim()) errors.push('id és obligatori.');
  if (!DECISIONS_GOVERN.includes(r.decisio)) errors.push(`decisio ha de ser ${DECISIONS_GOVERN.join(', ')}.`);
  if (!textONul(r.nota)) errors.push('nota ha de ser un text o null.');
  else if (typeof r.nota === 'string' && r.nota.length > MAX_NOTA) errors.push(`nota no pot passar de ${MAX_NOTA} caràcters.`);
  if (r.decisio === 'retornat' && r.nota === null) errors.push('Retornar una tasca demana una nota.');
  if (typeof r.data !== 'string' || !Number.isFinite(instant(r.data))) errors.push('data ha de ser una data ISO.');
  if (!textONul(r.actor)) errors.push('actor ha de ser un text o null.');
  if (typeof r.empremta !== 'string' || !PATRO_EMPREMTA_FILA.test(r.empremta)) errors.push('empremta ha de ser «sha256:» i 64 hex.');
  if (!nonceValid(r.nonce)) errors.push('nonce ha de ser base64url de 16 bytes.');
  return errors;
}

/**
 * Un registre nou, validat. Llança si no ho és. `nota` buida és null (i
 * aleshores no es pot retornar). La data és la d'ara, en UTC.
 */
export function preparaCertificacio({ pla = null, id, decisio, nota = null, actor = null, empremta, ara = Date.now(), nonce } = {}) {
  const net = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const registre = {
    schema: SCHEMA_CERTIFICACIO,
    pla: net(pla),
    id: typeof id === 'string' ? id.trim() : id,
    decisio,
    nota: net(nota),
    data: new Date(ara).toISOString(),
    actor: net(actor),
    empremta,
    nonce: nonce ?? nonceNou()
  };
  const errors = validaCertificacio(registre);
  if (errors.length) throw new TypeError(`Certificació invàlida: ${errors.join(' ')}`);
  return registre;
}

/** Per data ascendent; en empat, l'ordre d'arribada (el sort és estable). Una data il·legible va al final. */
export function ordenaCertificacions(registres) {
  const t = (r) => (Number.isFinite(instant(r?.data)) ? instant(r.data) : Infinity);
  return [...(registres ?? [])].sort((a, b) => t(a) - t(b));
}

/**
 * L'última decisió sobre una fila (mateix pla i mateix id); null si no n'hi
 * ha cap. El pla és la identitat de la matriu (normalitzaMcr: el que declara
 * la matriu o «mcr@» i la seua data): una decisió d'una altra matriu no es
 * pinta encara que l'id coincidisca, i continua al registre.
 */
export function ultimaDecisio(registres, { pla = null, id }) {
  const de = ordenaCertificacions(registres).filter((r) => r.id === id && (r.pla ?? null) === (pla ?? null));
  return de.at(-1) ?? null;
}

/* El text d'una decisió sobre la fila d'ara: una certificació d'una fila que
   la matriu no pinta [FET I SEGELLAT] ho diu. */
const textDeDecisio = (decisio, estatVist) => (decisio === 'certificat' && estatVist !== 'fet'
  ? TEXT_CERTIFICADA_SENSE_FET
  : TEXT_DECISIO[decisio]);

/**
 * Com es pinta la decisió del Mestre sobre una fila: null si no n'hi ha cap;
 * si no, { registre, text, to, vigent }. La decisió no canvia mai l'estat que
 * calcula la matriu: es pinta al costat.
 *  · `vigent: true`: l'empremta de la fila d'ara és la que es va decidir. Una
 *    certificació només és verda si la fila d'ara es pinta [FET I SEGELLAT]
 *    (`estatVist` 'fet'); si no, «Certificada (la matriu no la dona per
 *    feta)», en taronja.
 *  · `vigent: false`: l'empremta d'ara és una altra: la decisió és d'una
 *    versió anterior.
 *  · `vigent: null`: l'empremta d'ara encara no se sap (es calcula després
 *    d'arribar una matriu, o el navegador no té WebCrypto). No es pot dir ni
 *    que siga la mateixa fila ni que siga una altra: es diu la decisió, en to
 *    neutre (mai verd).
 */
export function estatCertificacio(registres, { pla = null, id, empremta = null, estatVist = null }) {
  const registre = ultimaDecisio(registres, { pla, id });
  if (!registre) return null;
  if (typeof empremta !== 'string') {
    return { registre, vigent: null, text: textDeDecisio(registre.decisio, estatVist), to: 'neutre' };
  }
  if (empremta !== registre.empremta) return { registre, vigent: false, text: TEXT_VERSIO_ANTERIOR, to: 'neutre' };
  const senseFet = registre.decisio === 'certificat' && estatVist !== 'fet';
  return {
    registre,
    vigent: true,
    text: textDeDecisio(registre.decisio, estatVist),
    to: senseFet ? 'avis' : TO_DECISIO[registre.decisio]
  };
}

/** Una línia de JSON canònic per registre, en ordre de data. */
export function exportaJsonl(registres) {
  const linies = ordenaCertificacions(registres).map((r) => jsonCanonic(r));
  return linies.length ? `${linies.join('\n')}\n` : '';
}

/* ── On es guarda ─────────────────────────────────────────────────────────
   El patró de src/sections/tractors/nucli/magatzem.js, amb una sola taula. */

export const VERSIO_BD_CERTIFICACIONS = 1;
const TAULA = 'certificacions';
const copia = (valor) => JSON.parse(JSON.stringify(valor));
const comprova = (registre) => {
  const errors = validaCertificacio(registre);
  if (errors.length) throw new TypeError(`Certificació invàlida: ${errors.join(' ')}`);
};
const errorDuplicat = () => new Error('Esta decisió ja està apuntada: el registre només admet afegir, mai sobreescriure.');

/** El magatzem en memòria: per a les proves i per a quan el navegador no deixa desar. */
export function crearMagatzemCertificacionsMemoria() {
  let registres = [];
  return {
    tipus: 'memoria',
    persistent: false,
    async registres() {
      return ordenaCertificacions(registres).map(copia);
    },
    async afegix(registre) {
      comprova(registre);
      if (registres.some((r) => r.nonce === registre.nonce)) throw errorDuplicat();
      registres.push(copia(registre));
    },
    async exporta() {
      return exportaJsonl(registres);
    },
    tanca() {}
  };
}

/** El magatzem d'IndexedDB. Llança si el navegador no en té. */
export function crearMagatzemCertificacionsIndexedDB({ nom = 'sdp-certificacions-consola', idb = globalThis.indexedDB } = {}) {
  if (!idb || typeof idb.open !== 'function') {
    throw new Error('Este navegador no oferix IndexedDB: les certificacions no es poden desar.');
  }
  let connexio = null;
  const obri = () => {
    if (!connexio) {
      connexio = new Promise((resol, rebutja) => {
        const peticio = idb.open(nom, VERSIO_BD_CERTIFICACIONS);
        peticio.onupgradeneeded = () => {
          const bd = peticio.result;
          if (!bd.objectStoreNames.contains(TAULA)) bd.createObjectStore(TAULA, { keyPath: 'nonce' });
        };
        peticio.onsuccess = () => {
          const bd = peticio.result;
          bd.onversionchange = () => { bd.close(); connexio = null; };
          resol(bd);
        };
        peticio.onerror = () => rebutja(peticio.error ?? new Error('No s’ha pogut obrir IndexedDB.'));
        peticio.onblocked = () => rebutja(new Error('IndexedDB està bloquejada per una altra pestanya.'));
      });
      connexio.catch(() => { connexio = null; });
    }
    return connexio;
  };
  /* Resol quan la transacció es completa, no quan acaba la petició. */
  const opera = async (mode, accio) => {
    const bd = await obri();
    return new Promise((resol, rebutja) => {
      const tx = bd.transaction([TAULA], mode);
      let resultat;
      tx.oncomplete = () => resol(resultat);
      tx.onerror = () => rebutja(tx.error ?? new Error('Error d’IndexedDB.'));
      tx.onabort = () => rebutja(tx.error ?? new Error('Transacció d’IndexedDB avortada.'));
      const peticio = accio(tx.objectStore(TAULA));
      if (peticio) peticio.onsuccess = () => { resultat = peticio.result; };
    });
  };
  const tots = async () => (await opera('readonly', (t) => t.getAll())) ?? [];
  return {
    tipus: 'indexeddb',
    persistent: true,
    async disponible() {
      try { await obri(); return true; } catch { return false; }
    },
    async registres() {
      return ordenaCertificacions(await tots());
    },
    async afegix(registre) {
      comprova(registre);
      try {
        await opera('readwrite', (t) => t.add(copia(registre)));
      } catch (error) {
        if (error?.name === 'ConstraintError') throw errorDuplicat();
        throw error;
      }
    },
    async exporta() {
      return exportaJsonl(await tots());
    },
    tanca() {
      if (connexio) connexio.then((bd) => bd.close(), () => {});
      connexio = null;
    }
  };
}

/**
 * IndexedDB si el navegador la deixa obrir; si no (cap IndexedDB, finestra
 * privada, una altra pestanya que la bloqueja), memòria amb persistent: false
 * per a tota la sessió, i la pàgina ho diu. La política de magatzem.js.
 */
export function crearMagatzemCertificacions({ nom, idb = globalThis.indexedDB } = {}) {
  if (!idb || typeof idb.open !== 'function') return crearMagatzemCertificacionsMemoria();
  const disc = crearMagatzemCertificacionsIndexedDB({ nom, idb });
  const memoria = crearMagatzemCertificacionsMemoria();
  let actiu = disc;
  const tria = async () => {
    if (actiu === disc && !(await disc.disponible())) {
      actiu = memoria;
      disc.tanca();
    }
    return actiu;
  };
  return {
    get tipus() { return actiu.tipus; },
    get persistent() { return actiu.persistent; },
    async registres() { return (await tria()).registres(); },
    async afegix(registre) { return (await tria()).afegix(registre); },
    async exporta() { return (await tria()).exporta(); },
    tanca() { disc.tanca(); }
  };
}
