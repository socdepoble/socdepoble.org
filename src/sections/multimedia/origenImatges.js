/**
 * origenImatges.js — d'on ve una imatge de l'Arxiu visual, qui en té els drets
 * i si és la foto d'una persona.
 *
 * Onada 0.3 (Gauntlet 261016; requisit del Mestre del 261007: «Apartat
 * "IAIA" per a les imatges d'IA») · Tres regles pures, les del visor
 * (VisorDeLArxiu.jsx) i del filtre «IAIA» de /multimedia:
 *
 *   origenDe · 'ia' | 'foto' | 'sistema'. Mana el camp `origen` de l'element
 *     (legacyMedia.js); si no en porta, el del cens (censImatges.js, fet a mà
 *     i mirat a ull); si la foto no hi és (una pujada, un article viu), el
 *     camí: system/ és 'sistema' i les marques inequívoques de la casa
 *     (nano_cards/, les vinyetes, uploads/ia/, «comic», «nano_», «ibanez») són
 *     'ia'. La resta, 'foto': en el dubte, una foto real.
 *
 *   dretsDe · el text dels drets, o null («No declarats»), en este ordre: el
 *     copyright que declara l'element; el Copyright de l'EXIF de la foto; el
 *     de la Viquipèdia per a les fotos dels pobles baixades de Wikimedia
 *     Commons (towns/, COPYRIGHT_VIQUIPEDIA); i el de Sóc de Poble («Fet per la
 *     IAIA i Nano Banana», COPYRIGHT_SDP) NOMÉS per a una il·lustració d'IA.
 *     Una foto real mai porta «Fet per la IAIA» (MCR 261016, b03_multimedia.5:
 *     la pàgina /multimedia/<id> ho deia de sèrie de qualsevol foto), ni quan
 *     algú li l'ha declarat: eixe text només val per a una il·lustració d'IA.
 *
 *   esFotoDePersona · l'àmbit 'persona' de l'element o del cens, o un camí de
 *     gent, usuaris, avatars o perfil (la carpeta o el nom del fitxer, com
 *     «javi-llinares-perfil-1200px.jpg»). El visor no en llig ni en pinta el
 *     GPS. No depén del cens, que arriba tard: l'arxiu ho diu al seu camp.
 */
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA } from '../../components/universal/editorial.js';

export const ORIGENS = Object.freeze(['ia', 'foto', 'sistema']);

const PATRONS_IA = Object.freeze([
  /\/nano_cards\//,
  /\/ui\/plugins\/[^/]*_vinyeta\.[a-z]+$/i,
  /\/uploads\/ia\//,
  /[-_]comic[-_.]/i,
  /\/nano[-_][^/]*$/i,
  /ibanez/i
]);

const srcDe = (item) => (typeof item?.src === 'string' ? item.src.trim() : '');

/** Una taula src → entrada del cens, per a consultar-la de pressa. */
export const indexaCens = (cens) => new Map((cens || []).map((entrada) => [entrada.src, entrada]));

/** L'origen d'una imatge: 'ia', 'foto' o 'sistema'. `cens` és un Map de indexaCens (opcional). */
export function origenDe(item, cens) {
  if (ORIGENS.includes(item?.origen)) return item.origen;
  const src = srcDe(item);
  const delCens = cens?.get?.(src);
  if (delCens && ORIGENS.includes(delCens.origen)) return delCens.origen;
  if (/^\/assets\/system\//.test(src)) return 'sistema';
  if (PATRONS_IA.some((patro) => patro.test(src))) return 'ia';
  return 'foto';
}

/** És una foto de la Viquipèdia: les dels pobles baixades de Wikimedia Commons. */
export function esDeLaViquipedia(src) {
  const net = typeof src === 'string' ? src.trim() : '';
  return /^\/assets\/towns\//.test(net) || /^https:\/\/upload\.wikimedia\.org\//.test(net);
}

const textNet = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null);

/* El text de sèrie de les il·lustracions de la casa. En una imatge que no és
   d'IA no es creu mai, encara que vinga declarat: és l'etiqueta per defecte
   que la pàgina /multimedia/<id> posava a qualsevol foto (MCR 261016,
   b03_multimedia.5), no uns drets de qui la va fer. */
const nomenaLaIaia = (text) => text === COPYRIGHT_SDP || /fet per la iaia/i.test(text);

/** Els drets d'ús, o null si ningú no els declara. */
export function dretsDe(item, { origen = origenDe(item), copyrightExif = null } = {}) {
  const creible = (valor) => {
    const text = textNet(valor);
    return text && (origen === 'ia' || !nomenaLaIaia(text)) ? text : null;
  };
  return creible(item?.copyright)
    || creible(copyrightExif)
    || (esDeLaViquipedia(srcDe(item)) ? COPYRIGHT_VIQUIPEDIA : null)
    || (origen === 'ia' ? COPYRIGHT_SDP : null);
}

/** La foto d'una persona: el visor no en mostra la ubicació. */
export function esFotoDePersona(item, cens) {
  const src = srcDe(item);
  const ambit = item?.ambit || cens?.get?.(src)?.ambit;
  if (ambit === 'persona') return true;
  return /\/avatars?\//i.test(src) || /\/uploads\/(?:gent|usuaris)\//i.test(src) || /\/perfil\//i.test(src) || /[-_]perfil[-_.]/i.test(src);
}
