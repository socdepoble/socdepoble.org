/**
 * cercaXat.js — El motor de la cerca global del Xat (T69), en funcions pures.
 *
 * Sense React ni xarxa. Seguix el patró estàndard de missatgeria (captura de
 * referència del Mestre, 19.13.56):
 *   · El camp busca a tot arreu per defecte i torna tres grups de resultats:
 *     converses, persones del padró i missatges ja carregats. «Converses» i
 *     «Persones» són grups, no filtres.
 *   · Els filtres són la llista vertical que apareix en fer focus amb el camp
 *     buit, en este ordre: Fotos, GIF, Enllaços, Vídeos, Documents, Àudio,
 *     Enquestes i Esdeveniments. Amb un filtre només hi ha missatges d'eixe
 *     tipus; amb filtre i terme, la intersecció.
 *
 * El plegat i el ressaltat són els de /cerca (indexCerca.js): «jose» troba
 * «José», «collegi» troba «col·legi» i cada paraula ha de ser-hi (AND). Un sol
 * motor, dues lents: /cerca i el Xat no poden plegar de manera diferent.
 *
 * Dades de veres, cap invent:
 *   · El tipus del missatge és el de la restricció de la BD (F0). El client
 *     només envia `text` (SDP-XAT-010): Fotos, Vídeos, Documents, Àudio,
 *     Enquestes i Esdeveniments quedaran buits fins que n'arriben d'altres.
 *   · GIF no és cap tipus: és una `imatge` amb `metadades.mime` = 'image/gif'.
 *     És la convenció proposada al mapa de T69; el backend encara no l'escriu.
 *   · Enllaços ix del text (enllacos.js), de qualsevol tipus de missatge.
 *   · La cerca de missatges només veu el que ja s'ha carregat (els fils oberts
 *     en esta sessió, en pàgines de 50): no hi ha cap RPC de cerca al servidor.
 *     `avisLocal` ho recorda perquè la interfície ho diga.
 */
import {
  esCorreu, extracteAmbContext, fitxes as fitxesDeConsulta, marcaTemps, partsRessaltades, plega
} from '../search/indexCerca.js';
import { segmentaEnllacos } from './enllacos.js';

/* La llista vertical de filtres, en l'ordre de la captura. `icona` és el nom
   de l'export de lucide-react; `etiqueta`, el text per defecte de `clauI18n`. */
export const FILTRES_CERCA_XAT = Object.freeze([
  Object.freeze({ id: 'fotos', etiqueta: 'Fotos', icona: 'Camera', clauI18n: 'section.xat.cerca.filtre.fotos' }),
  Object.freeze({ id: 'gif', etiqueta: 'GIF', icona: 'ImagePlay', clauI18n: 'section.xat.cerca.filtre.gif' }),
  Object.freeze({ id: 'enllacos', etiqueta: 'Enllaços', icona: 'Link', clauI18n: 'section.xat.cerca.filtre.enllacos' }),
  Object.freeze({ id: 'videos', etiqueta: 'Vídeos', icona: 'Video', clauI18n: 'section.xat.cerca.filtre.videos' }),
  Object.freeze({ id: 'documents', etiqueta: 'Documents', icona: 'FileText', clauI18n: 'section.xat.cerca.filtre.documents' }),
  Object.freeze({ id: 'audio', etiqueta: 'Àudio', icona: 'Music', clauI18n: 'section.xat.cerca.filtre.audio' }),
  Object.freeze({ id: 'enquestes', etiqueta: 'Enquestes', icona: 'ChartBarBig', clauI18n: 'section.xat.cerca.filtre.enquestes' }),
  Object.freeze({ id: 'esdeveniments', etiqueta: 'Esdeveniments', icona: 'CalendarDays', clauI18n: 'section.xat.cerca.filtre.esdeveniments' })
]);

const IDS_FILTRE = new Set(FILTRES_CERCA_XAT.map((filtre) => filtre.id));

/* Del tipus de la BD (xat_missatges_tipus_valid) al filtre. `text`, `ubicacio`,
   `contacte` i `adhesiu` no tenen filtre a la referència; `sistema` no es busca. */
const FILTRE_DE_TIPUS = new Map([
  ['imatge', 'fotos'],
  ['video', 'videos'],
  ['nota_video', 'videos'],
  ['document', 'documents'],
  ['veu', 'audio'],
  ['enquesta', 'enquestes'],
  ['esdeveniment', 'esdeveniments']
]);

/* Mida de l'extracte d'un missatge: prou per a dues línies de la columna. */
const MAX_EXTRACTE = 160;

const llista = (valor) => (Array.isArray(valor) ? valor : []);
const textDe = (valor) => (typeof valor === 'string' ? valor : '');

/* Una làpida (esborrat) ja no té contingut i un avís del sistema no l'ha
   escrit ningú: cap dels dos es troba. */
function esCercable(missatge) {
  if (!missatge || typeof missatge !== 'object') return false;
  if (missatge.esborrat || missatge.esborratAl) return false;
  return missatge.tipus !== 'sistema';
}

/**
 * Els filtres on cau un missatge, com a Set d'ids de FILTRES_CERCA_XAT.
 * Un missatge pot caure en dos: una foto amb un enllaç al peu és Fotos i
 * Enllaços. Un missatge esborrat o del sistema no cau en cap.
 */
export function classificaMissatge(missatge) {
  const filtres = new Set();
  if (!esCercable(missatge)) return filtres;
  const tipus = textDe(missatge.tipus) || 'text';
  const mime = textDe(missatge.metadades?.mime).trim().toLowerCase();
  if (tipus === 'imatge' && mime === 'image/gif') filtres.add('gif');
  else if (FILTRE_DE_TIPUS.has(tipus)) filtres.add(FILTRE_DE_TIPUS.get(tipus));
  if (segmentaEnllacos(missatge.text).some((segment) => segment.tipus === 'enllac')) filtres.add('enllacos');
  return filtres;
}

/* `missatgesPerFil` pot ser un objecte { [filId]: missatges }, un Map o una
   funció com `getThreadMessages(filId)` del XatContext. */
function missatgesDe(font, filId) {
  if (typeof font === 'function') return llista(font(filId));
  if (font instanceof Map) return llista(font.get(filId));
  if (font && typeof font === 'object') return Object.hasOwn(font, filId) ? llista(font[filId]) : [];
  return [];
}

const nomDeFil = (fil) => textDe(fil?.name) || textDe(fil?.title);
const conteTotes = (textPlegat, llistaFitxes) => llistaFitxes.every((fitxa) => textPlegat.includes(fitxa));

/* Una línia: els salts de línia d'un missatge no caben en una fila de resultat. */
function partsDExtracte(text, llistaFitxes) {
  const net = textDe(text).replace(/\s+/g, ' ').trim();
  return partsRessaltades(extracteAmbContext(net, llistaFitxes, MAX_EXTRACTE), llistaFitxes);
}

/* El mateix que ja trobava el Xat (nom i últim missatge) i el que indexa
   /cerca (deConversa: participants i entitat). */
function textDeConversa(fil) {
  return plega([nomDeFil(fil), ...llista(fil.altresNoms), fil.entitatNom, fil.ultimText]
    .filter((valor) => typeof valor === 'string' && valor)
    .join(' '));
}

function cercaConverses(fils, llistaFitxes) {
  return fils
    .filter((fil) => fil?.id != null && conteTotes(textDeConversa(fil), llistaFitxes))
    .sort((a, b) => (marcaTemps(b.ultimAl) - marcaTemps(a.ultimAl)) || nomDeFil(a).localeCompare(nomDeFil(b), 'ca'))
    .map((fil) => ({
      fil,
      parts: partsRessaltades(nomDeFil(fil), llistaFitxes),
      partsUltim: partsDExtracte(fil.ultimText, llistaFitxes)
    }));
}

/* El padró (membres_del_poble o la llavor): { usuari_id, nom, fil_id, … }.
   Mai un mateix, mai un correu com a nom, una fila per persona, i fora qui ja
   ix com a conversa (la seua conversa directa ja és al grup de dalt). */
function cercaPersones(membres, llistaFitxes, joId, filsTrobats) {
  const jo = joId == null ? null : String(joId);
  const vistes = new Set();
  const persones = [];
  for (const membre of membres) {
    const id = membre?.usuari_id ?? membre?.usuariId ?? null;
    const nom = (textDe(membre?.nom) || textDe(membre?.name)).trim();
    if (id == null || !nom || esCorreu(nom)) continue;
    const clau = String(id);
    if (clau === jo || vistes.has(clau)) continue;
    const filId = membre.fil_id ?? membre.filId ?? null;
    if (filId != null && filsTrobats.has(String(filId))) continue;
    if (!conteTotes(plega(nom), llistaFitxes)) continue;
    vistes.add(clau);
    persones.push({ membre, nom, parts: partsRessaltades(nom, llistaFitxes) });
  }
  return persones
    .sort((a, b) => a.nom.localeCompare(b.nom, 'ca'))
    .map(({ membre, parts }) => ({ membre, parts }));
}

const seqNumeric = (missatge) => {
  const seq = Number(missatge?.seq);
  return missatge?.seq != null && Number.isFinite(seq) ? seq : -1;
};

function cercaMissatges(fils, font, llistaFitxes, filtre) {
  const vistos = new Set();
  const trobats = [];
  for (const fil of fils) {
    if (fil?.id == null) continue;
    for (const missatge of missatgesDe(font, fil.id)) {
      if (!esCercable(missatge)) continue;
      if (filtre && !classificaMissatge(missatge).has(filtre)) continue;
      const text = textDe(missatge.text);
      if (llistaFitxes.length && !conteTotes(plega(text), llistaFitxes)) continue;
      if (missatge.id != null) {
        const clau = JSON.stringify([fil.id, missatge.id]);
        if (vistos.has(clau)) continue;
        vistos.add(clau);
      }
      trobats.push({ fil, missatge, parts: partsDExtracte(text, llistaFitxes) });
    }
  }
  return trobats.sort((a, b) => (marcaTemps(b.missatge.creatAl) - marcaTemps(a.missatge.creatAl))
    || (seqNumeric(b.missatge) - seqNumeric(a.missatge)));
}

/**
 * La cerca global del Xat.
 *
 * @param {object} p
 * @param {string} [p.terme] el text del camp
 * @param {string|null} [p.filtre] un id de FILTRES_CERCA_XAT; un id desconegut val com a cap
 * @param {Array} [p.fils] chatThreads del XatContext (els arxivats també: `fil.arxivat` ho diu)
 * @param {Array} [p.membres] el padró, tal com el torna `cercaMembres`
 * @param {object|Map|Function} [p.missatgesPerFil] els missatges carregats de cada fil
 * @param {string|null} [p.joId] qui busca: mai es troba a si mateix
 * @returns {{ converses: Array<{fil, parts, partsUltim}>, persones: Array<{membre, parts}>,
 *   missatges: Array<{fil, missatge, parts}>, buit: boolean, avisLocal: true, fitxes: string[] }}
 *   Les converses i els missatges, del més recent al més antic; les persones, per nom.
 *   `parts` són trossos { text, marca } per a pintar <mark>: ací no hi ha HTML.
 */
export function cercaXat({ terme = '', filtre = null, fils = [], membres = [], missatgesPerFil = null, joId = null } = {}) {
  const llistaFitxes = fitxesDeConsulta(terme);
  const filtreNet = IDS_FILTRE.has(filtre) ? filtre : null;
  const llistaFils = llista(fils);

  let converses = [];
  let persones = [];
  let missatges = [];
  if (filtreNet || llistaFitxes.length) {
    /* Amb un filtre, només es mostren missatges d'eixe tipus. */
    if (!filtreNet) {
      converses = cercaConverses(llistaFils, llistaFitxes);
      const filsTrobats = new Set(converses.map(({ fil }) => String(fil.id)));
      persones = cercaPersones(llista(membres), llistaFitxes, joId, filsTrobats);
    }
    missatges = cercaMissatges(llistaFils, missatgesPerFil, llistaFitxes, filtreNet);
  }

  return {
    converses,
    persones,
    missatges,
    buit: !converses.length && !persones.length && !missatges.length,
    avisLocal: true,
    fitxes: llistaFitxes
  };
}
