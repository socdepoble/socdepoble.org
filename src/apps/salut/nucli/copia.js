/**
 * copia.js — la còpia de seguretat de Salut en JSON (nucli pur).
 *
 * Les dades només viuen en este dispositiu: si s'esborra el navegador, es
 * perden. La còpia és un fitxer que la persona guarda on vol.
 *   { schema: 'sdp.salut.copia.v1', creada, persona, jornades, periodes, apunts, valoracions }
 * En llegir-la, tot passa pel diccionari: el que no hi és es descarta i el
 * que no és vàlid no entra. Una versió d'esquema desconeguda es rebutja.
 * Dos maneres d'importar:
 *   · 'afegir'     el que ja hi ha es conserva; entra el que no hi és (per id)
 *   · 'substituir' la còpia ho reemplaça tot
 */
import {
  netejaApunt, netejaJornada, netejaPeriode, netejaValoracio, validaPersona
} from './diccionari.js';

export const ESQUEMA_COPIA = 'sdp.salut.copia.v1';
export const MODES_IMPORTACIO = Object.freeze(['afegir', 'substituir']);
/* Una còpia de diversos anys de diari cap de sobra; més és un fitxer equivocat. */
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_REGISTRES = 200000;

/** La còpia de les dades actuals (un objecte llest per a JSON.stringify). */
export function creaCopia({ persona = {}, jornades = [], periodes = [], apunts = [], valoracions = [] }, { ara = new Date() } = {}) {
  return {
    schema: ESQUEMA_COPIA,
    creada: ara.toISOString(),
    persona: validaPersona(persona).persona,
    jornades: [...jornades],
    periodes: [...periodes],
    apunts: [...apunts],
    valoracions: [...valoracions]
  };
}

/** El nom del fitxer de la còpia: neutre, com el del full. */
export const nomCopia = (data) => `copia_${data}.json`;

/* Neteja una llista: torna els vàlids i el nombre de descartats. */
function neteja(llista, fn) {
  const nets = [];
  let descartats = 0;
  for (const cru of Array.isArray(llista) ? llista : []) {
    try {
      nets.push(fn(cru));
    } catch {
      descartats += 1;
    }
  }
  return { nets, descartats };
}

/**
 * Llig una còpia (text JSON o objecte). Mai llança.
 * @returns {{ ok: boolean, error?: string, dades?: object, descartats?: number }}
 */
export function llegixCopia(entrada) {
  let cru = entrada;
  if (typeof entrada === 'string') {
    if (entrada.length > MAX_BYTES) return { ok: false, error: 'El fitxer és massa gran per a ser una còpia de Salut.' };
    try {
      cru = JSON.parse(entrada);
    } catch {
      return { ok: false, error: 'El fitxer no és una còpia de Salut (no és JSON).' };
    }
  }
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) return { ok: false, error: 'El fitxer no és una còpia de Salut.' };
  if (cru.schema !== ESQUEMA_COPIA) {
    return { ok: false, error: typeof cru.schema === 'string' && cru.schema.startsWith('sdp.salut.copia.')
      ? 'Esta còpia és d’una versió que esta app no coneix.' : 'El fitxer no és una còpia de Salut.' };
  }
  const total = ['jornades', 'periodes', 'apunts', 'valoracions'].reduce((n, clau) => n + (Array.isArray(cru[clau]) ? cru[clau].length : 0), 0);
  if (total > MAX_REGISTRES) return { ok: false, error: 'La còpia té massa registres.' };
  const apunts = neteja(cru.apunts, netejaApunt);
  const jornades = neteja(cru.jornades, netejaJornada);
  const periodes = neteja(cru.periodes, netejaPeriode);
  const valoracions = neteja(cru.valoracions, netejaValoracio);
  return {
    ok: true,
    dades: {
      persona: validaPersona(cru.persona || {}).persona,
      apunts: apunts.nets, jornades: jornades.nets, periodes: periodes.nets, valoracions: valoracions.nets
    },
    descartats: apunts.descartats + jornades.descartats + periodes.descartats + valoracions.descartats
  };
}

const CLAUS = Object.freeze({ apunts: 'id', jornades: 'data', periodes: 'id', valoracions: 'id' });

/**
 * El resultat d'importar `entrant` sobre `actual`, i l'informe.
 * @returns {{ dades: object, informe: { afegits: number, duplicats: number, substituits: boolean } }}
 */
export function fusionaCopia(actual, entrant, mode = 'afegir') {
  if (!MODES_IMPORTACIO.includes(mode)) throw new RangeError(`Mode desconegut: ${mode}`);
  if (mode === 'substituir') {
    const afegits = Object.keys(CLAUS).reduce((n, clau) => n + entrant[clau].length, 0);
    return { dades: { ...entrant }, informe: { afegits, duplicats: 0, substituits: true } };
  }
  let afegits = 0;
  let duplicats = 0;
  const dades = { persona: actual.persona };
  for (const [clau, id] of Object.entries(CLAUS)) {
    const existents = new Set((actual[clau] || []).map((registre) => registre[id]));
    const nous = [];
    for (const registre of entrant[clau] || []) {
      if (existents.has(registre[id])) duplicats += 1;
      else {
        existents.add(registre[id]);
        nous.push(registre);
        afegits += 1;
      }
    }
    dades[clau] = [...(actual[clau] || []), ...nous];
  }
  return { dades, informe: { afegits, duplicats, substituits: false } };
}
