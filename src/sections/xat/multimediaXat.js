/**
 * multimediaXat.js — el contingut de la vista «Contingut multimèdia» del Xat
 * (/xat?vista=multimedia; ordre del Mestre del 261004, prompt 261004_0515,
 * T5), en funcions pures.
 *
 * Sense React ni xarxa. Reutilitza el motor de la cerca global (T69): un
 * missatge no es pot classificar d'una manera a la cerca i d'una altra ací.
 *   · classificaMissatge (cercaXat.js) diu on cau cada missatge: Fotos, GIF i
 *     Vídeos van a «Fitxers»; Documents, a «Documents». L'àudio (veu) no té
 *     pestanya a la captura 19.41.58 i no hi entra.
 *   · segmentaEnllacos (enllacos.js) trau les URL del text, de qualsevol
 *     tipus de missatge. «Enllaços» porta una entrada per URL de cada missatge
 *     (la mateixa URL dos vegades dins d'un missatge, una sola entrada), amb
 *     el domini i l'avís de domini enganyós (XAT-B05).
 *
 * Dades de veres, cap invent:
 *   · El client F0 només envia text (SDP-XAT-010): Fitxers i Documents
 *     quedaran buits fins als adjunts de F1, i la vista ho diu.
 *   · Només es veu el que ja s'ha carregat (els fils oberts en esta sessió,
 *     en pàgines de 50), igual que la cerca: la vista porta l'avís local.
 *   · Fora les làpides i els avisos del sistema (classificaMissatge no els
 *     classifica), els missatges en error i els pendents sense `seq`: encara
 *     no s'han compartit.
 *   · Cap previsualització de l'enllaç: demanaria un servidor intermediari i
 *     li diria a un tercer qui mira què.
 */
import { marcaTemps } from '../search/indexCerca.js';
import { classificaMissatge } from './cercaXat.js';
import { segmentaEnllacos } from './enllacos.js';
import { clauDia } from './temps.js';

/** Les tres pestanyes del control segmentat, en l'ordre de la captura 19.41.58. */
export const PESTANYES_MULTIMEDIA = Object.freeze(['fitxers', 'enllacos', 'documents']);

/* Del filtre de la cerca (FILTRES_CERCA_XAT) a la pestanya. «Enllaços» no
   hi és: ix del text, no del tipus del missatge. */
const PESTANYA_DE_FILTRE = new Map([
  ['fotos', 'fitxers'],
  ['gif', 'fitxers'],
  ['videos', 'fitxers'],
  ['documents', 'documents']
]);

const llista = (valor) => (Array.isArray(valor) ? valor : []);

/* `missatgesPerFil` pot ser un objecte { [filId]: missatges }, un Map o una
   funció com `getThreadMessages(filId)` del XatContext (com a cercaXat.js). */
function missatgesDe(font, filId) {
  if (typeof font === 'function') return llista(font(filId));
  if (font instanceof Map) return llista(font.get(filId));
  if (font && typeof font === 'object') return Object.hasOwn(font, filId) ? llista(font[filId]) : [];
  return [];
}

const seqNumeric = (missatge) => {
  const seq = Number(missatge?.seq);
  return missatge?.seq != null && Number.isFinite(seq) ? seq : -1;
};

/* Un missatge en error no ha arribat a ningú, i un de pendent sense `seq`
   encara no és al servidor: cap dels dos s'ha compartit. */
function compartit(missatge) {
  if (!missatge || typeof missatge !== 'object') return false;
  const estat = missatge.estatEnviament;
  if (estat === 'error') return false;
  return !(estat === 'pendent' && missatge.seq == null);
}

/**
 * El contingut d'una pestanya, del més recent al més antic (i, a la mateixa
 * hora, pel `seq`; dins d'un missatge, en l'ordre del text).
 *
 * @param {object} p
 * @param {Array} [p.fils] chatThreads del XatContext
 * @param {object|Map|Function} [p.missatgesPerFil] els missatges carregats de cada fil
 * @param {'fitxers'|'enllacos'|'documents'} [p.pestanya]
 * @returns {Array<{ clau: string, fil: object, missatge: object, tipus: string,
 *   enllac?: { text: string, href: string, host: string, sospitos: boolean } }>}
 *   `tipus` és 'enllac' a Enllaços; 'fotos', 'gif', 'videos' o 'documents' a
 *   les altres. `clau` és única i estable: servix de clau de React.
 *   Una pestanya desconeguda torna una llista buida.
 */
export function contingutMultimedia({ fils = [], missatgesPerFil = null, pestanya = 'fitxers' } = {}) {
  if (!PESTANYES_MULTIMEDIA.includes(pestanya)) return [];
  const vistes = new Set();
  const items = [];
  const afig = (clau, item) => {
    if (vistes.has(clau)) return;
    vistes.add(clau);
    items.push({ clau, ...item });
  };

  for (const fil of llista(fils)) {
    if (fil?.id == null) continue;
    missatgesDe(missatgesPerFil, fil.id).forEach((missatge, i) => {
      if (!compartit(missatge)) return;
      const filtres = classificaMissatge(missatge);
      /* Sense id, el missatge només es distingix per la posició. */
      const idMissatge = missatge.id != null ? String(missatge.id) : `#${i}`;
      if (pestanya === 'enllacos') {
        if (!filtres.has('enllacos')) return;
        for (const segment of segmentaEnllacos(missatge.text)) {
          if (segment.tipus !== 'enllac') continue;
          const { text, href, host, sospitos } = segment;
          afig(JSON.stringify([String(fil.id), idMissatge, href]), { fil, missatge, tipus: 'enllac', enllac: { text, href, host, sospitos } });
        }
        return;
      }
      const tipus = [...filtres].find((filtre) => PESTANYA_DE_FILTRE.get(filtre) === pestanya);
      if (tipus) afig(JSON.stringify([String(fil.id), idMissatge, tipus]), { fil, missatge, tipus });
    });
  }

  return items.sort((a, b) => (marcaTemps(b.missatge.creatAl) - marcaTemps(a.missatge.creatAl))
    || (seqNumeric(b.missatge) - seqNumeric(a.missatge)));
}

/** El nom del mes d'una data («Octubre de 2026»), amb Intl; buit sense data. */
export function titolDeMes(iso, locale = 'ca-ES') {
  if (!clauDia(iso)) return '';
  const text = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(iso));
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * Agrupa els elements per mes, en l'ordre en què arriben (contingutMultimedia
 * ja els dona del més recent al més antic). La clau és el mes local
 * («2026-10», de clauDia, temps.js); els que no porten data van a un grup de
 * clau i títol buits, al final.
 *
 * @returns {Array<{ clau: string, titol: string, items: Array }>}
 */
export function agrupaPerMes(items, { locale = 'ca-ES' } = {}) {
  const grups = [];
  const perClau = new Map();
  for (const item of llista(items)) {
    const creatAl = item?.missatge?.creatAl;
    const clau = clauDia(creatAl).slice(0, 7);
    let grup = perClau.get(clau);
    if (!grup) {
      grup = { clau, titol: titolDeMes(creatAl, locale), items: [] };
      perClau.set(clau, grup);
      grups.push(grup);
    }
    grup.items.push(item);
  }
  const senseData = perClau.get('');
  return senseData ? [...grups.filter((grup) => grup !== senseData), senseData] : grups;
}
