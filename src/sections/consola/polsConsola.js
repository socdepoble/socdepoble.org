/**
 * polsConsola.js — els tres panells del «pols del cervell», sense React.
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada panell del pols és
 * una targeta sencera amb la boina de Sóc de Poble i té pàgina pròpia,
 * /consola/pols/<id>, amb el contingut que abans obria un desplegable. El
 * text de cada targeta (el «per a què» de subtítol i l'entradilla) viu ací,
 * perquè la targeta, la pàgina i les xifres que el pols compta diguen el
 * mateix.
 */
import { LLINDAR_SATURACIO, RUTA_CONSOLA, recompteArtefactes, registresDelDiari } from './consolaPagines.js';
import { resumSkills } from './consolaContent.js';
import { de, plural } from './concordanca.js';

export const RUTA_POLS = `${RUTA_CONSOLA}/pols`;
/** La ruta compartible de la pàgina d'un panell del pols. */
export const rutaPanell = (id) => `${RUTA_POLS}/${id}`;

/* La icona de cada panell és una clau: la pinta PolsConsola.jsx. L'entradilla
   marca els noms de fitxer entre accents greus (xifresComu.js): la targeta i
   la pàgina els pinten en <Mono>. */
const PANELLS = Object.freeze([
  {
    id: 'carrega', titol: 'Càrrega documental', icona: 'gauge',
    subtitol: 'Per a saber quan s’embossa el context',
    entradilla: 'Compta els artefactes actius del cervell i avisa quan passen del llindar de saturació. No arxiva res: només diu quan cal revisar rellevància i context.'
  },
  {
    id: 'rebuts', titol: 'Rebuts', icona: 'receipt',
    subtitol: 'Per a comprovar què ha llegit de veritat l’eixam',
    entradilla: 'Cada vegada que un agent llig senceres les fonts d’un protocol, en queda un rebut amb l’empremta de cada fitxer. Obri’l per vore quines fonts va llegir.'
  },
  {
    id: 'skills', titol: 'Skills', icona: 'puzzle',
    subtitol: 'Per a saber quins procediments cal cuidar',
    entradilla: 'L’inventari de procediments de l’eixam comparat amb `manifest.yaml`: quins són del nucli, quins viuen al disc fora del manifest i quins són al manifest sense disc. Les òrfenes i les fantasmes del Mapa són a l’Inventari de skills.'
  }
]);

/** Els ids dels panells, en l'ordre de la graella del pols. */
export const IDS_PANELLS = Object.freeze(PANELLS.map((p) => p.id));

/** Un panell pel seu id, amb la seua ruta; null si no existix. */
export function panellPols(id) {
  const p = PANELLS.find((x) => x.id === id);
  return p ? { ...p, ruta: rutaPanell(p.id) } : null;
}

/** Els tres panells, en ordre. */
export const panellsPols = () => IDS_PANELLS.map(panellPols);

/**
 * La coberta de cada panell al pols (PaginaPols): les mètriques vives (T2,
 * 260930: cada una en h5) o, si no n'hi ha, per què en un paràgraf
 * (`senseMesura`). Correcció 261004 (verificador de la segona passada, punt
 * 3) · cada mètrica concorda. Correcció 261004 (verificador de la tercera
 * passada, punts 4 i 5) · viu ací, sense React, perquè una prova la contraste
 * amb les targetes (XIFRES_DELS_PANELLS); sense el diari de sessió, els rebuts
 * no tenen mesura (mai «0 rebuts»).
 */
export function cobertesPols(dades, estat) {
  const inventari = dades ? resumSkills(dades.skills) : null;
  const recompte = recompteArtefactes(dades);
  const rebuts = registresDelDiari(dades, 'rebuts');
  const estatSenseDades = estat === 'loading' ? 'Llegint…'
    : estat === 'absent' ? 'No disponible en este entorn'
      : 'No s’ha pogut llegir';
  return {
    carrega: {
      metriques: recompte !== null
        ? [plural(recompte, 'artefacte actiu', 'artefactes actius'), `avís per damunt ${de(LLINDAR_SATURACIO)}`] : null,
      senseMesura: 'Recompte d’artefactes actius encara no disponible: les skills i els rebuts no en són cap mesura'
    },
    rebuts: {
      metriques: rebuts !== null ? [plural(rebuts, 'rebut de lectura', 'rebuts de lectura')] : null,
      senseMesura: dades ? 'Sense mesura: el diari de sessió no es pot llegir' : estatSenseDades
    },
    skills: {
      metriques: inventari
        ? [plural(inventari.total, 'skill', 'skills'), `${inventari.orfes.length} fora del manifest`, `${inventari.fantasmes.length} sense disc`]
        : null,
      senseMesura: estatSenseDades
    }
  };
}

/**
 * Correcció 261004 (verificador de la tercera passada, punt 5) · La targeta
 * de cada mètrica de la coberta dels panells, en ordre (consolaPagines.js ·
 * XIFRES_DE_LES_MESURES diu el mateix de les pàgines): el número de la
 * mètrica és al títol o al subtítol d'eixa targeta.
 */
export const XIFRES_DELS_PANELLS = Object.freeze({
  carrega: Object.freeze([['artefactes-actius'], ['artefactes-actius']]),
  rebuts: Object.freeze([['rebuts-de-lectura']]),
  skills: Object.freeze([['skills-del-manifest'], ['skills-fora-del-manifest'], ['skills-sense-disc']])
});

/**
 * L'id d'un panell a partir del comodí de la ruta (/consola/*):
 * 'pols/rebuts' (o amb barres a les vores) → 'rebuts'. Un id que no
 * existix també es torna: la seua pàgina diu que no existix. Qualsevol altra
 * forma ('pols' sol, el tauler, una xifra), null.
 */
export function segmentPols(comodi) {
  const net = String(comodi ?? '').replace(/^\/+|\/+$/g, '');
  const trobat = /^pols\/([^/]+)$/.exec(net);
  return trobat ? trobat[1] : null;
}
