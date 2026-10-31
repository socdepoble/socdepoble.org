/**
 * suportGestorLocal.js — El suport sense React del Gestor d'arxius locals
 * (IDEA-54/55 · Onada 261029_1605). Gauntlet 261029 (cicle 1) · Abans vivia
 * dins dels .jsx dels components (OperacionsArxiuLocal, PropostaPobleLocal,
 * TaulaArxiusLocals): un fitxer de component que exporta valors trenca la
 * frontera de Fast Refresh (una edició invalidava en cadena fins a
 * MultimediaSection i tombava el Mas, P1-71). Ací, els valors; als .jsx, només
 * components (exportacionsComponents.test.js ho fixa).
 *
 *   · TEXTOS_VERIFICACIO_LOCAL i canviaElDisc: les operacions al disc.
 *   · comparaPesWebp: el pes de la WebP del Laboratori, amb signe.
 *   · TEXTOS_* de la proposta de poble: cada motiu, avís, àmbit i origen del
 *     motor té el seu text (textosGestorLocal.test.js els recorre tots).
 *   · dataCurtaLocal: «dd/mm/aaaa hh:mm».
 *   · nomVisibleLocal: un nom o una ruta local per a pintar-los.
 */
import { esCaracterInvisibleLocal } from './motorMultimediaLocal.js';
import { TEXTOS_LOCAL as T } from './textosGestorLocal.js';

/* ── Operacions al disc ─────────────────────────────────────────────────── */

export const TEXTOS_VERIFICACIO_LOCAL = Object.freeze({
  sha256: T['ops.verificacio.sha256'],
  bytes: T['ops.verificacio.bytes'],
  mida: T['ops.verificacio.mida']
});

/**
 * Gauntlet 261029 c1 (lab-webp-mateix-pes-fals) · La diferència de pes de la
 * WebP respecte de l'original, AMB SIGNE: { tipus: 'menys'|'igual'|'mes',
 * percent } (el percent, arredonit; 0 % és «igual»), o null si les mides no
 * són vàlides. Abans, una WebP més pesada que l'original es deia «mateix pes».
 * (Venia de LaboratoriWebpLocal.jsx, que només exporta components.)
 * @param {number} abans bytes de l'original
 * @param {number} despres bytes de la WebP
 */
export function comparaPesWebp(abans, despres) {
  if (!Number.isFinite(abans) || !Number.isFinite(despres) || abans <= 0 || despres < 0) return null;
  const percent = Math.round((Math.abs(despres - abans) / abans) * 100);
  if (percent === 0) return { tipus: 'igual', percent: 0 };
  return { tipus: despres < abans ? 'menys' : 'mes', percent };
}

/** Les fallades d'una operació després de les quals el disc pot haver canviat. */
export function canviaElDisc(error) {
  return error?.codi === 'MOVIMENT_INCOMPLET'
    || error?.codi === 'ORIGINAL_NO_MOGUT'
    || (error?.codi === 'CONFLICTE_DISC' && typeof error?.detall?.copiaConservada === 'string');
}

/* ── La proposta de poble ───────────────────────────────────────────────── */

export const TEXTOS_MOTIU_POBLE = Object.freeze({
  cens: T['proposta.motiu.cens'],
  gps: T['proposta.motiu.gps'],
  'gps-proximitat': T['proposta.motiu.gpsProximitat'],
  'gps-comarca': T['proposta.motiu.gpsComarca'],
  nom: T['proposta.motiu.nom'],
  'nom-alies': T['proposta.motiu.nomAlies']
});

export const TEXTOS_AVIS_POBLE = Object.freeze({
  NOM_AMBIGU: T['proposta.avis.nomAmbigu'],
  GPS_I_NOM_DISCREPEN: T['proposta.avis.gpsINomDiscrepen'],
  CENS_I_GPS_DISCREPEN: T['proposta.avis.censIGpsDiscrepen'],
  GPS_LLUNY_DELS_POBLES: T['proposta.avis.gpsLluny']
});

export const TEXTOS_CONFIANCA_POBLE = Object.freeze({
  alta: T['proposta.confianca.alta'],
  mitjana: T['proposta.confianca.mitjana'],
  baixa: T['proposta.confianca.baixa']
});

export const TEXTOS_AMBIT_LOCAL = Object.freeze({
  poble: T['proposta.ambit.poble'],
  persona: T['proposta.ambit.persona'],
  entitat: T['proposta.ambit.entitat'],
  ia: T['proposta.ambit.ia'],
  contingut: T['proposta.ambit.contingut']
});

export const TEXTOS_ORIGEN_LOCAL = Object.freeze({
  ia: T['proposta.origens.ia'],
  foto: T['proposta.origens.foto'],
  sistema: T['proposta.origens.sistema']
});

export const TEXTOS_MOTIU_ORIGEN_LOCAL = Object.freeze({
  cens: T['proposta.motiuOrigen.cens'],
  'exif-camera': T['proposta.motiuOrigen.exifCamera'],
  'nom-ia': T['proposta.motiuOrigen.nomIa']
});

/* ── Presentació ────────────────────────────────────────────────────────── */

const dosXifres = (n) => String(n).padStart(2, '0');

/** «dd/mm/aaaa hh:mm» en l'hora local, o «—» si no hi ha data. */
export function dataCurtaLocal(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const d = new Date(n);
  return `${dosXifres(d.getDate())}/${dosXifres(d.getMonth() + 1)}/${d.getFullYear()} ${dosXifres(d.getHours())}:${dosXifres(d.getMinutes())}`;
}

/** El símbol que pren el lloc d'un caràcter invisible en pantalla. */
export const SIMBOL_INVISIBLE_LOCAL = '�';

/**
 * Un nom o una ruta local per a pintar-los (Gauntlet 261029, cicle 1). Els
 * controls de direcció del text (U+202E…) i els invisibles C0/C1 que el motor
 * ja no deixa escriure (esCaracterInvisibleLocal) es veuen com a «�»: un
 * «RTL_<U+202E>gnp.md» que ja era al disc no es fa passar per «RTL_dm.png». Els
 * noms sense cap d'estos caràcters no canvien. Només per a pintar: la ruta de
 * veres continua sent la de sempre (cerca, ids, operacions).
 */
export function nomVisibleLocal(text) {
  const net = typeof text === 'string' ? text : String(text ?? '');
  let resultat = '';
  let canviat = false;
  for (const caracter of net) {
    if (esCaracterInvisibleLocal(caracter.codePointAt(0))) {
      resultat += SIMBOL_INVISIBLE_LOCAL;
      canviat = true;
    } else {
      resultat += caracter;
    }
  }
  return canviat ? resultat : net;
}
