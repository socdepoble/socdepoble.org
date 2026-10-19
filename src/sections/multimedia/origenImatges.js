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

/* Auditoria de seguretat 261019 (F11) · Una aportació d'un veí porta la
   persona propietària (ownerUserId, la columna owner_user_id que hi posa
   mapejadorSeccions.js · elementDeFilaPublicada); el contingut de
   l'administració i el cens, no. El seu `origen` no és cap autoritat: amb
   origen 'ia', un veí posava la seua foto a l'apartat «IAIA» com a
   «Il·lustració d'IA», amb els drets de Sóc de Poble (dretsDe). I les marques
   de la casa (PATRONS_IA) només valen per als recursos del paquet
   ('/assets/…'): el nom d'una pujada al bucket el tria qui la puja
   ('…/nano_x.png'). Totes les il·lustracions de la casa viuen a /assets/, i
   un camí amb '.', '..', '%' o barra inversa no compta com a recurs del
   paquet. Revisió adversarial · I una aportació d'un veí no és mai una
   il·lustració de la casa, encara que reprenga una imatge del cens o del
   paquet: amb un srcDelPort propi (el visor el pinta abans que src) hi
   mostrava la seua foto a l'apartat «IAIA», amb els drets de la casa. Es
   queda com a 'foto', i els seus drets declarats ja no valen com a «Fet per
   la IAIA» (dretsDe). */
const esDUnVei = (item) => item?.ownerUserId != null;

function esRecursDelPaquet(src) {
  if (!src.startsWith('/assets/') || /[%\\]/.test(src)) return false;
  return !src.split(/[?#]/)[0].split('/').some((segment) => segment === '.' || segment === '..');
}

function origenSenseAutoritat(item, cens) {
  if (!esDUnVei(item) && ORIGENS.includes(item?.origen)) return item.origen;
  const src = srcDe(item);
  const delCens = cens?.get?.(src);
  if (delCens && ORIGENS.includes(delCens.origen)) return delCens.origen;
  if (/^\/assets\/system\//.test(src)) return 'sistema';
  if (esRecursDelPaquet(src) && PATRONS_IA.some((patro) => patro.test(src))) return 'ia';
  return 'foto';
}

/** L'origen d'una imatge: 'ia', 'foto' o 'sistema'. `cens` és un Map de indexaCens (opcional). */
export function origenDe(item, cens) {
  const origen = origenSenseAutoritat(item, cens);
  return origen === 'ia' && esDUnVei(item) ? 'foto' : origen;
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
/* Auditoria de seguretat 261019 (F11, revisió) · Amb la forma normalitzada
   (NFKC) i qualsevol espai entre paraules: un espai dur no el disfressa. */
const nomenaLaIaia = (text) => text === COPYRIGHT_SDP || /fet\s+per\s+la\s+iaia/i.test(text.normalize('NFKC'));

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
