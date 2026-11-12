/**
 * comu.js — peces compartides per la lectura i l'escriptura de GEDCOM.
 *
 * Només constants i funcions pures: els mesos de la data GEDCOM, les
 * etiquetes d'estat (amb la variant del kit R111) i el rànquing que tria
 * l'estat més feble d'un grup de vincles. Res d'ací toca el DOM ni la xarxa.
 */

import { ETIQUETES_ESTAT } from '../nucli/constants.js';

/** Nombre màxim de línies que s'accepten d'un fitxer. */
export const MAX_LINIES = 300000;

/** Llargada màxima d'una línia física; més enllà es descarta amb un avís. */
export const MAX_LLARGADA_LINIA = 65536;

/** Avisos com a màxim per importació (la resta es resumix en 'mes-avisos'). */
export const MAX_AVISOS = 200;

export const ETIQUETES_VINCLE = Object.freeze(['fontEscrita', 'memoriaOral', 'vincleExplicit']);
export const COMPTADOR_VINCLES = '_SDPVINCLES';
export const ETIQUETA_VINCLE = '_SDPVINCLE';

export function superaMidaImportacio(text, maxim) {
  return text.length > maxim || new TextEncoder().encode(text).byteLength > maxim;
}

/**
 * Etiquetes reconegudes en una NOTE, de la més llarga a la més curta perquè
 * «[CONTRADICCIÓ DETECTADA]» (forma del kit) no es confonga amb cap altra.
 */
export const ETIQUETES_LECTURA = Object.freeze([
  Object.freeze(['[CONTRADICCIÓ DETECTADA]', 'contradiccio']),
  Object.freeze(['[CONTRADICCIO DETECTADA]', 'contradiccio']),
  Object.freeze([ETIQUETES_ESTAT.contradiccio, 'contradiccio']),
  Object.freeze(['[CONTRADICCIO]', 'contradiccio']),
  Object.freeze([ETIQUETES_ESTAT['falta-confirmar'], 'falta-confirmar']),
  Object.freeze([ETIQUETES_ESTAT.confirmat, 'confirmat']),
  Object.freeze([ETIQUETES_ESTAT.aproximat, 'aproximat'])
]);

/** Rànquing de força d'un estat: el menor és el més feble. */
export const FORCA_ESTAT = Object.freeze({ contradiccio: 0, 'falta-confirmar': 1, aproximat: 2, confirmat: 3 });

/** Torna l'estat més feble d'una llista (o null si és buida). */
export function estatMesFeble(estats) {
  let millor = null;
  for (const estat of estats) {
    if (!Object.hasOwn(FORCA_ESTAT, estat)) continue;
    if (millor === null || FORCA_ESTAT[estat] < FORCA_ESTAT[millor]) millor = estat;
  }
  return millor;
}

/** Codis de rol GEDCOM 7.0 (ROLE) i 5.5.1 (RELA) per a les relacions FAN. */
export const ROL_FAN = Object.freeze({
  padri: Object.freeze({ role: 'GODP', rela: 'Godparent' }),
  testimoni: Object.freeze({ role: 'WITN', rela: 'Witness' }),
  vei: Object.freeze({ role: 'NGHBR', rela: 'Neighbor' }),
  germa: Object.freeze({ role: 'OTHER', rela: 'Sibling' })
});

/**
 * Valors de RELA (5.5.1) i de PHRASE (7.0) que es reconeixen en llegir, en
 * minúscules i comparats per igualtat (sense regex).
 */
export const RELA_LECTURA = Object.freeze({
  padri: Object.freeze(['godparent', 'godfather', 'godmother', 'padri', 'padrí', 'padrina', 'padrino', 'madrina', 'padriño', 'aitabitxi', 'amabitxi']),
  testimoni: Object.freeze(['witness', 'testimoni', 'testigo', 'testemuña', 'lekuko', 'lekukoa']),
  vei: Object.freeze(['neighbor', 'neighbour', 'veí', 'vei', 'veïna', 'vecino', 'vecina', 'veciño', 'auzokoa']),
  germa: Object.freeze(['sibling', 'brother', 'sister', 'germà', 'germa', 'germana', 'hermano', 'hermana', 'irmán', 'irmá', 'anaia', 'arreba', 'ahizpa'])
});

/** Lleva els caràcters de control d'un text (fora de \n i \t), sense regex. */
export function senseControl(valor) {
  const font = String(valor);
  let eixida = '';
  for (let i = 0; i < font.length; i += 1) {
    const codi = font.charCodeAt(i);
    if (codi === 10 || codi === 9 || (codi >= 32 && codi !== 127)) eixida += font[i];
  }
  return eixida;
}
