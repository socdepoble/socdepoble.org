/**
 * Lector de notícies · totes les fonts de la persona, tal com les veuen l'arbre
 * de l'espai de treball (Noticies.jsx) i la gestió de fonts (GestioFonts.jsx).
 *
 * Ordre del Mestre (261024, 15:05) · «Les fonts viuen a l'arbre de carpetes de
 * l'esquerra (Coneixement obert, Vídeos per a aprendre).» L'arbre porta TOTES
 * les fonts, no només les seguides:
 *   · les del catàleg del servei (o de la llavor), seguides o apagades: una
 *     apagada continua a l'arbre, marcada, per a poder-la tornar a encendre;
 *   · les que ha afegit la persona (fontsPersonals.js): llegides pel servei,
 *     si el servei en sap (entren al port amb el seu id «meva-…»), o
 *     PENDENTS, guardades en este dispositiu fins que el servei les llija.
 *
 *   fontsDelLector({ noticies, personals, llegixPersonals }) → [{
 *     id, nom, categoriaId, descripcio, lloc, url?, personal, pendent, senseHttps
 *   }]   primer les del catàleg, en el seu ordre; després les personals
 *   estatDeFont(font, estat)  → 'pendent' · 'apagada' · 'seguida'
 *   TEXT_PENDENT              el que es diu d'una font personal que encara no es llig
 */
import { PREFIX_PERSONAL, seguix } from '../nucli/index.js';

const PREFIX = `${PREFIX_PERSONAL}-`;

/** Si un id és d'una font personal (nucli/personals.js). */
export const esPersonal = (id) => typeof id === 'string' && id.startsWith(PREFIX);

const esHttps = (url) => typeof url === 'string' && url.startsWith('https:');

/* Correcció R5-08 i decisió de la plataforma (261024) · Quan el servei té les fonts personals
   apagades, les rebutja sense demanar res ('personals-off'): no han caigut, estan pendents. */
const PENDENT_DEL_SERVEI = 'personals-off';

export const TEXT_PENDENT = 'Queda guardada en este dispositiu. El servei de notícies encara no llig les fonts teues: '
  + 'la llegirà quan el servei les active.';

export function fontsDelLector({ noticies, personals = [], llegixPersonals = false }) {
  const motiuDe = new Map((noticies.caigudes || []).map((caiguda) => [caiguda.fontId, caiguda.motiu]));
  const propies = new Map(personals.map((font) => [font.id, font]));
  const delPort = new Set();
  const fonts = [];
  for (const font of noticies.fonts) {
    delPort.add(font.id);
    const personal = esPersonal(font.id);
    const url = personal ? propies.get(font.id)?.url ?? null : null;
    fonts.push(Object.freeze({
      id: font.id,
      nom: font.nom,
      categoriaId: font.categoriaId ?? null,
      descripcio: font.descripcio || '',
      lloc: font.lloc ?? null,
      url,
      personal,
      pendent: personal && (!llegixPersonals || motiuDe.get(font.id) === PENDENT_DEL_SERVEI),
      senseHttps: personal && url !== null && !esHttps(url)
    }));
  }
  /* Les personals que el port no porta: pendents (sense servei que les llija) o encara en camí
     (el servei les llig, i la ronda que les porta encara no ha acabat). */
  for (const propia of personals) {
    if (delPort.has(propia.id)) continue;
    fonts.push(Object.freeze({
      id: propia.id,
      nom: propia.nom,
      categoriaId: propia.categoriaId ?? null,
      descripcio: '',
      lloc: null,
      url: propia.url,
      personal: true,
      pendent: !llegixPersonals,
      senseHttps: !esHttps(propia.url)
    }));
  }
  return fonts;
}

/** 'pendent' (una personal que encara no es llig), 'apagada' (no se seguix) o 'seguida'. */
export function estatDeFont(font, estat) {
  if (font.pendent) return 'pendent';
  return seguix(estat, font.id) ? 'seguida' : 'apagada';
}
