/**
 * semafor.js — el semàfor únic de la Consola, pur (Onada 6, requisit 8).
 *
 * «Les pastilles i avisos han de tindre codis de colors (verd, taronja, roig)
 * segons la seua gravetat, com un semàfor.» Tres colors de gravetat, dits
 * amb el vocabulari d'Insignia (sense CSS nou): verd 'exit', taronja 'avis'
 * i roig 'error'. El que només informa (una relació inferida, una mètrica
 * sense mesura) no és bo ni dolent: 'neutre'. Cap quart color: el blau
 * ('info') queda per a l'acció, no per a la salut.
 *
 * Regla de la gravetat d'un avís del Mapa: alta → roig; mitjana i baixa →
 * taronja; cap avís → verd. Sense React, sense disc i sense xarxa.
 */

/** El to d'Insignia de cada color del semàfor. */
export const TO_SEMAFOR = Object.freeze({ verd: 'exit', taronja: 'avis', roig: 'error' });
/** El to del que només informa. */
export const NEUTRE = 'neutre';

/** El color de cada severitat del Mapa (contracteMapa.js · SEVERITATS). */
export const COLOR_DE_SEVERITAT = Object.freeze({ alta: 'roig', mitjana: 'taronja', baixa: 'taronja' });

const PES = Object.freeze({ verd: 0, taronja: 1, roig: 2 });

/** El to d'Insignia d'un color; un color que no és del semàfor, neutre. */
export const toDeColor = (color) => TO_SEMAFOR[color] ?? NEUTRE;

/** El color més greu d'una llista ('verd' si no n'hi ha cap). Ignora el que no és del semàfor. */
export function pitjor(colors) {
  let millor = 'verd';
  for (const c of colors ?? []) if (c in PES && PES[c] > PES[millor]) millor = c;
  return millor;
}

/**
 * El semàfor d'un grapat d'avisos per la seua gravetat, no pel seu nombre:
 * un sol avís alt és roig; només mitjans o baixos, taronja; cap, verd. Una
 * severitat desconeguda no es pot dir bona: taronja.
 */
export function colorDAvisos(avisos) {
  return pitjor((avisos ?? []).map((a) => COLOR_DE_SEVERITAT[a?.severitat] ?? 'taronja'));
}

/**
 * Les etiquetes d'estat de les peces (els textos en majúscules de les
 * targetes del Mapa), pel seu color. El que funciona, verd; el que falla del
 * tot, roig; el que no consta o va a mitges, taronja; el que no té mesura,
 * neutre. Un text que no és ací es pinta taronja: no se'l pot dir bo.
 */
export const COLOR_D_ESTAT = Object.freeze({
  VIU: 'verd',
  ACTIU: 'verd',
  'EN MARXA': 'verd',
  MORT: 'roig',
  'SENSE CONSUMIDOR': 'roig',
  'SENSE LLANÇADOR': 'taronja',
  'SENSE DECLARACIÓ': 'taronja',
  'SENSE CANDATS': 'taronja',
  'SENSE LECTOR': 'taronja',
  PARCIAL: 'taronja',
  DESCONEGUT: 'taronja',
  FALTA: 'taronja',
  'SENSE MESURA': null
});

/** El to d'Insignia d'un text d'estat (COLOR_D_ESTAT). */
export function toDEstat(text) {
  if (Object.hasOwn(COLOR_D_ESTAT, text)) return COLOR_D_ESTAT[text] === null ? NEUTRE : toDeColor(COLOR_D_ESTAT[text]);
  return toDeColor('taronja');
}

/**
 * El color de cada estat d'una tasca del Mapa (contracteMapa.js ·
 * ESTATS_TASCA): viva, verd; morta, roig; la que no consta que corra (sense
 * llançador, sense declaració o desconeguda), taronja. Un estat que no és
 * ací es pinta taronja: no se'l pot dir bo.
 */
export const COLOR_D_ESTAT_TASCA = Object.freeze({
  viu: 'verd',
  mort: 'roig',
  'declarat-sense-llancador': 'taronja',
  'llancador-sense-declaracio': 'taronja',
  desconegut: 'taronja'
});

/** El semàfor d'unes tasques pel seu pitjor estat; sense cap tasca, null: no hi ha res a jutjar (mai un verd). */
export function colorDeTasques(tasques) {
  const llista = Array.isArray(tasques) ? tasques : [];
  return llista.length ? pitjor(llista.map((t) => COLOR_D_ESTAT_TASCA[t?.estat] ?? 'taronja')) : null;
}

/** Una etiqueta de targeta amb el seu to: el vocabulari de les UniversalCard de la Consola (peces.jsx · aEtiqueta). */
export const etiquetaDeTo = (text, to) => Object.freeze({ text, to });

/* IDEA-40 (decisió del Mestre, 261028, Bloc H) · La insígnia quadrada d'una
   targeta porta el semàfor de les seues etiquetes: la més greu d'entre les
   dels tres colors (roig > taronja > verd), amb el seu text, que és el que en
   diu l'estat sense el color. «Canvis nous», «Sense font» i la resta del que
   només informa (neutre, o un to que no és del semàfor) no hi compten: sense
   cap etiqueta del semàfor, null, i la insígnia es queda amb el gris de sempre. */
const PES_DEL_TO = Object.freeze(Object.fromEntries(Object.entries(TO_SEMAFOR).map(([color, to]) => [to, PES[color]])));

/** L'etiqueta del semàfor més greu d'unes etiquetes ({ text, to }), com a { to, text }; cap del semàfor, null. */
export function semaforDEtiquetes(etiquetes) {
  let greu = null;
  for (const e of Array.isArray(etiquetes) ? etiquetes : []) {
    if (!e || typeof e !== 'object' || !Object.hasOwn(PES_DEL_TO, e.to)) continue;
    if (!greu || PES_DEL_TO[e.to] > PES_DEL_TO[greu.to]) greu = e;
  }
  return greu ? Object.freeze({ to: greu.to, text: String(greu.text ?? '') }) : null;
}
