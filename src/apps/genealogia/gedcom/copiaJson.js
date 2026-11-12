/**
 * copiaJson.js — còpia local de l'arbre en JSON, revisable per la persona.
 *
 * «Prepara, no publica»: creaCopiaJson torna el text; la interfície l'ensenya
 * i només el descarrega amb un clic. Per defecte les persones vives van
 * anonimitzades i l'entrevista no hi va (les respostes porten noms de vius).
 *
 * llegeixCopiaJson és defensiva: límit de mida, reviver que rebutja les claus
 * __proto__, constructor i prototype, esquema comprovat, límits de persones i
 * relacions, llista blanca del nucli per a cada registre i ids NOUS (amb les
 * relacions remapejades): una còpia importada mai xafa cap arbre existent.
 */

import { esInstantIso, netejaArbre, netejaPersona, netejaRelacio, netejaEntrevista } from '../nucli/model.js';
import { MIDA_MAXIMA_IMPORTACIO, esClauSegura, objectePla as esObjectePla, revivorSegur, MAX_PERSONES, MAX_RELACIONS } from '../nucli/segur.js';
import { comparaOrdreSosa } from '../nucli/sosa.js';
import { preparaIntercanvi, remapaCopiaRedactada } from './privacitatIntercanvi.js';
import { superaMidaImportacio } from './comu.js';

export const ESQUEMA_COPIA = 'sdp.genealogia.copia.v1';

/**
 * Crea el text JSON de la còpia.
 * @returns {{ text: string, ocultes: number }}
 */
export function creaCopiaJson(complet, { incloureVius = false, anyActual, ara } = {}) {
  if (!complet || !Array.isArray(complet.persones) || !Array.isArray(complet.relacions)) throw new TypeError('complet');
  const inclou = incloureVius === true;
  const { complet: filtrat, ocultes } = preparaIntercanvi(complet, { incloureVius: inclou, anyActual });
  const instant = esInstantIso(ara) ? ara : '1970-01-01T00:00:00.000Z';
  const segur = ocultes ? remapaCopiaRedactada(filtrat, instant) : filtrat;
  const copia = {
    schema: ESQUEMA_COPIA,
    creada: typeof ara === 'string' ? ara : null,
    incloureVius: inclou,
    arbre: segur.arbre,
    persones: segur.persones,
    relacions: segur.relacions,
    entrevista: inclou ? segur.entrevista ?? null : null,
    ocultes
  };
  const text = JSON.stringify(copia, null, 2);
  if (superaMidaImportacio(text, MIDA_MAXIMA_IMPORTACIO)) throw Object.assign(new TypeError('Mida'), { codiLectura: 'mida' });
  return { text, ocultes };
}

/**
 * Llig una còpia JSON i torna un ArbreComplet amb ids nous.
 * @returns {{ ok: boolean, errors: string[], avisos: string[], complet: object|null }}
 */
export function llegeixCopiaJson(textJson, { nouId, anyActual } = {}) {
  if (typeof nouId !== 'function') throw new TypeError('nouId');
  const avisos = [];
  const falla = (codi) => ({ ok: false, errors: [codi], avisos, complet: null });

  if (textJson === null || textJson === undefined) return falla('buit');
  if (typeof textJson !== 'string') return falla('tipus');
  if (superaMidaImportacio(textJson, MIDA_MAXIMA_IMPORTACIO)) return falla('mida');
  const cadena = textJson.charCodeAt(0) === 0xfeff ? textJson.slice(1) : textJson;
  if (cadena.trim() === '') return falla('buit');

  let dades;
  try {
    dades = JSON.parse(cadena, revivorSegur);
  } catch (error) {
    return falla(error instanceof TypeError ? 'clau-perillosa' : 'json');
  }
  if (!esObjectePla(dades) || dades.schema !== ESQUEMA_COPIA) return falla('esquema');
  if (!esObjectePla(dades.arbre) || !Array.isArray(dades.persones) || !Array.isArray(dades.relacions)) return falla('esquema');
  if (dades.persones.length > MAX_PERSONES || dades.relacions.length > MAX_RELACIONS) return falla('limit');

  const arbreId = nouId();
  const idsNous = new Map();
  const persones = [];
  const idFont = new Map();
  const rangSosa = new Map(dades.persones.filter((p) => esObjectePla(p) && typeof p.id === 'string')
    .sort(comparaOrdreSosa).map((p, index) => [p.id, index]));
  dades.persones.forEach((cru, index) => {
    if (!esObjectePla(cru) || typeof cru.id !== 'string' || !esClauSegura(cru.id) || idsNous.has(cru.id)) {
      avisos.push(`persona-invalida:${index}`);
      return;
    }
    try {
      const neta = netejaPersona({ ...cru, id: nouId(), arbreId, ordreSosa: rangSosa.get(cru.id) }, { anyActual });
      const fonts = neta.fonts.map((font) => {
        if (!idFont.has(font.id)) idFont.set(font.id, nouId());
        return { ...font, id: idFont.get(font.id) };
      });
      const persona = { ...neta, fonts };
      idsNous.set(cru.id, persona.id);
      persones.push(persona);
    } catch {
      avisos.push(`persona-invalida:${index}`);
    }
  });

  const relacions = [];
  dades.relacions.forEach((cru, index) => {
    if (!esObjectePla(cru) || !idsNous.has(cru.de) || !idsNous.has(cru.a)) {
      avisos.push(`relacio-invalida:${index}`);
      return;
    }
    try {
      const neta = netejaRelacio({ ...cru, id: nouId(), arbreId, de: idsNous.get(cru.de), a: idsNous.get(cru.a) });
      relacions.push({ ...neta, fontIds: neta.fontIds.map((id) => idFont.get(id)).filter(Boolean) });
    } catch {
      avisos.push(`relacio-invalida:${index}`);
    }
  });

  let arbre;
  try {
    const arrelVella = dades.arbre.arrelId;
    arbre = netejaArbre({ ...dades.arbre, id: arbreId, arrelId: idsNous.get(arrelVella) ?? null });
  } catch {
    return falla('arbre');
  }

  let entrevista = null;
  if (esObjectePla(dades.entrevista)) {
    try {
      entrevista = netejaEntrevista({ ...dades.entrevista, arbreId });
    } catch {
      avisos.push('entrevista-invalida');
    }
  }

  return { ok: true, errors: [], avisos, complet: { arbre, persones, relacions, entrevista } };
}
