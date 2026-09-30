/**
 * origenNota.js — D'on ve una nota que no ha escrit la persona (T5, Connectar).
 *
 * Una connexió («Connectar» sobre una casa, una faena, un poble…) crea una nota
 * al MAS de qui connecta, però el contingut és d'una altra persona. La nota
 * ho recorda amb `origen`, i per això l'editor canvia «Publicar» per
 * «Compartir» encara que la nota canvie de carpeta o d'etiquetes. El camp
 * viatja pel port com la resta de la nota: l'adaptador local el guarda tal
 * qual i el remot el desa a la columna `origen` (migració 260927_2100).
 *
 * T43 (ordre del Mestre, 260928) · l'origen també recorda:
 *   · `objecte`: QUÈ s'ha connectat, d'una llista tancada (un poble, una
 *     persona, una pàgina…). Els adaptadors no n'accepten cap altre.
 *   · `abast`: amb qui ho ha volgut compartir la persona (privada, persones
 *     concretes, grups de xat o tot el poble) i què s'ha fet de veres
 *     (`aplicat`). És una TRIA i un registre d'enviaments, no un permís: la
 *     nota continua sent només de qui la té (RLS de propietari o IndexedDB).
 *
 * T71 · Dos tipus d'origen:
 *   · 'connexio': un element de Sóc de Poble (secció, pàgina, perfil…)
 *     connectat al MAS (esConnexio). D4 (ordre del Mestre, 260930) · és una
 *     còpia editable, però es compartix citant l'autoria i l'original.
 *   · 'extern': un contingut de fora (una web), clonat com a nota pròpia i
 *     editable. Recorda d'on ve: `url` (només http o https, sense
 *     credencials i de 2048 caràcters com a màxim: la que passa es rebutja,
 *     mai es talla, perquè una adreça tallada en porta a una altra), `lloc`
 *     (el domini, deduït sempre de la url, mai rebut), `titol` i `autorNom`.
 *
 * D4 (ordre del Mestre, 260930) · Una connexió pot recordar els DRETS de
 * l'original (`drets`, opcional, de 256 caràcters com a màxim, com la columna
 * copyright). Només es prenen de l'element original resolt (item.copyright),
 * mai de l'URL: en republicar la connexió, el Mur porta eixos drets i no els
 * de la nota. La columna notes.origen és jsonb: cap migració.
 *
 * T71b · Tot camp de text de l'origen es talla per PUNTS DE CODI (caràcters
 * de veres, com char_length de Postgres i com compta contingutExtern.js),
 * mai per unitats UTF-16: un emoji no es parteix, i el que s'hi valida és el
 * que s'hi desa. Cap surrogate orfe hi queda (el jsonb el rebutja).
 *
 * Funció pura, sense React ni xarxa: la usen els dos adaptadors i la
 * interfície. Cap HTML: només text net i curt.
 */
import { netejaText } from '../utils/sanitize.js';

export const TIPUS_ORIGEN = Object.freeze(['connexio', 'extern']);
const CAMPS = Object.freeze(['sectionId', 'itemId', 'titol', 'autorId', 'autorNom', 'autorTipus', 'ruta']);
const CAMPS_EXTERN = Object.freeze(['titol', 'autorNom']);
const MAXIM = 300;
/** Llargària màxima de cada camp de text de l'origen (el títol inclòs), en caràcters de veres. */
export const MAXIM_CAMP_ORIGEN = MAXIM;
/** D4 · Llargària màxima dels drets de l'original: la mateixa que la columna copyright. */
export const MAXIM_DRETS = 256;

/* Amb la bandera u, un parell ben format és un sol punt de codi (astral): la
   classe només casa els surrogates orfes, que no són text. */
const SURROGATE_ORFE = /[\uD800-\uDFFF]/gu;

/**
 * T71b · Un camp de text de l'origen: sense surrogates orfes, net (netejaText:
 * caràcters de control, NFC i espais dels extrems) i, si passa de `maxim`
 * caràcters de veres, tallat per punts de codi. Per a un text sense caràcters
 * astrals el resultat és el mateix que netejaText(valor, maxim).
 */
export function netejaCampOrigen(valor, maxim = MAXIM) {
  const net = netejaText(String(valor ?? '').replace(SURROGATE_ORFE, ''), Infinity);
  const punts = Array.from(net);
  return punts.length > maxim ? punts.slice(0, maxim).join('') : net;
}
/** T71 · Llargària màxima d'una url externa. */
export const MAXIM_URL = 2048;

/**
 * T71 · Valida una url externa: { url, motiu }. `url` és l'adreça normalitzada
 * (URL.href) o '' si no val, i `motiu` diu per què no val: 'buida',
 * 'llarga' (més de MAXIM_URL, abans o després de normalitzar-la: mai es
 * talla), 'malformada' (espais, caràcters de control o no s'entén),
 * 'esquema' (qualsevol cosa que no siga http o https: javascript:, data:,
 * file:…; una ruta relativa no s'entén sense base i és 'malformada') o
 * 'credencials' (usuari o contrasenya dins de l'adreça). null si val.
 */
export function validaUrlExterna(valor) {
  const net = typeof valor === 'string' ? valor.trim() : '';
  if (!net) return { url: '', motiu: 'buida' };
  if (net.length > MAXIM_URL) return { url: '', motiu: 'llarga' };
  if (/[\u0000- \u007F-\u009F]/.test(net)) return { url: '', motiu: 'malformada' };
  let adreca;
  try {
    adreca = new URL(net);
  } catch {
    return { url: '', motiu: 'malformada' };
  }
  if (adreca.protocol !== 'http:' && adreca.protocol !== 'https:') return { url: '', motiu: 'esquema' };
  if (adreca.username || adreca.password) return { url: '', motiu: 'credencials' };
  if (!adreca.hostname) return { url: '', motiu: 'malformada' };
  if (adreca.href.length > MAXIM_URL) return { url: '', motiu: 'llarga' };
  return { url: adreca.href, motiu: null };
}

/** T71 · La url externa normalitzada, o '' si no val (validaUrlExterna). */
export const urlExterna = (valor) => validaUrlExterna(valor).url;

/* L'origen d'un contingut de fora: sense url vàlida, cap origen. */
function normalitzaOrigenExtern(origen) {
  const url = urlExterna(origen.url);
  if (!url) return null;
  const net = { tipus: 'extern', url, lloc: new URL(url).hostname };
  for (const camp of CAMPS_EXTERN) {
    if (origen[camp] === undefined || origen[camp] === null) continue;
    const valor = netejaCampOrigen(origen[camp]);
    if (valor) net[camp] = valor;
  }
  return net;
}

/** T43 · Tot el que es pot connectar. Llista tancada: el que no hi és, no entra. */
export const TIPUS_OBJECTE = Object.freeze([
  'publicacio', 'producte', 'esdeveniment', 'multimedia', 'poble',
  'persona', 'entitat', 'grup', 'ia', 'pagina',
  'nota', 'carpeta', 'categoria', 'etiqueta'
]);

/** T43 · Qui pot vore una connexió. 'privada' és el valor per defecte i el de caiguda. */
export const MODES_ABAST = Object.freeze(['privada', 'persones', 'grups', 'poble']);

/* Una llista de destinataris desada no passa de 50 (la interfície n'envia 20
   com a màxim; el marge és per a les llistes antigues o d'un altre client). */
export const MAXIM_DESTINS = 50;
const MAXIM_ID = 100;
const MAXIM_NOM = 120;
/* No es recorre una llista enorme només per a retallar-la després. */
const MAXIM_ENTRADA = 200;

function netejaDestins(llista) {
  if (!Array.isArray(llista)) return [];
  const vistos = new Set();
  const nets = [];
  for (const entrada of llista.slice(0, MAXIM_ENTRADA)) {
    if (!entrada || typeof entrada !== 'object') continue;
    const id = netejaCampOrigen(entrada.id, MAXIM_ID);
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    const nom = netejaCampOrigen(entrada.nom, MAXIM_NOM);
    nets.push(nom ? { id, nom } : { id });
    if (nets.length >= MAXIM_DESTINS) break;
  }
  return nets;
}

function netejaIds(llista) {
  if (!Array.isArray(llista)) return [];
  const vistos = new Set();
  for (const valor of llista.slice(0, MAXIM_ENTRADA)) {
    if (typeof valor !== 'string' && typeof valor !== 'number') continue;
    const id = netejaCampOrigen(valor, MAXIM_ID);
    if (id) vistos.add(id);
    if (vistos.size >= MAXIM_DESTINS) break;
  }
  return [...vistos];
}

function netejaAplicat(aplicat) {
  if (!aplicat || typeof aplicat !== 'object' || Array.isArray(aplicat)) return null;
  const net = { persones: netejaIds(aplicat.persones), grups: netejaIds(aplicat.grups), mur: aplicat.mur === true };
  const al = typeof aplicat.al === 'string' ? netejaCampOrigen(aplicat.al, 40) : '';
  if (al && Number.isFinite(Date.parse(al))) net.al = al;
  return net;
}

/**
 * T43 · L'abast net: `mode` sempre de la llista (un mode desconegut és
 * 'privada'); `persones` només en mode 'persones' i `grups` només en mode
 * 'grups', de 50 com a màxim, sense repetits i amb id i nom de text net;
 * `aplicat` només si ve, amb ids i una data vàlida. Qualsevol altra cosa es
 * descarta. Torna null si no és cap objecte.
 */
export function normalitzaAbast(abast) {
  if (!abast || typeof abast !== 'object' || Array.isArray(abast)) return null;
  const mode = MODES_ABAST.includes(abast.mode) ? abast.mode : 'privada';
  const net = {
    mode,
    persones: mode === 'persones' ? netejaDestins(abast.persones) : [],
    grups: mode === 'grups' ? netejaDestins(abast.grups) : []
  };
  const aplicat = netejaAplicat(abast.aplicat);
  if (aplicat) net.aplicat = aplicat;
  return net;
}

/** Torna l'origen net, o null si no és cap origen que coneguem. Una connexió
 * exigix itemId; un contingut de fora (T71), una url externa vàlida. */
export function normalitzaOrigen(origen) {
  if (!origen || typeof origen !== 'object') return null;
  if (!TIPUS_ORIGEN.includes(origen.tipus)) return null;
  if (origen.tipus === 'extern') return normalitzaOrigenExtern(origen);
  const net = { tipus: origen.tipus };
  for (const camp of CAMPS) {
    if (origen[camp] === undefined || origen[camp] === null) continue;
    const valor = netejaCampOrigen(origen[camp]);
    if (valor) net[camp] = valor;
  }
  if (TIPUS_OBJECTE.includes(origen.objecte)) net.objecte = origen.objecte;
  const drets = netejaDrets(origen.drets);
  if (drets) net.drets = drets;
  const abast = normalitzaAbast(origen.abast);
  if (abast) net.abast = abast;
  return net.itemId ? net : null;
}

/**
 * T43 (ordre del Mestre, 260928) · L'origen que es pot publicar: el mateix
 * que normalitzaOrigen però SENSE `abast`. L'abast diu a qui ha enviat la
 * persona la connexió (ids i noms de persones i de grups de xat privats) i
 * només pot viure a la nota, que és seua. Quan la connexió es compartix al
 * Mur, l'origen va dins de section_submissions.payload, i eixa fila la pot
 * llegir per REST qualsevol membre del poble. Torna null si no és cap origen
 * que coneguem.
 */
export function origenPublic(origen) {
  const net = normalitzaOrigen(origen);
  if (!net) return null;
  delete net.abast;
  return net;
}

/** D4 · Els drets de l'original, nets i de MAXIM_DRETS caràcters com a màxim; '' si no n'hi ha. */
export function netejaDrets(valor) {
  if (typeof valor !== 'string') return '';
  return netejaCampOrigen(valor, MAXIM_DRETS);
}

/** D4 · L'original porta els drets reservats (comencen per «©»): cal avisar abans de republicar-lo. */
export const teDretsReservats = (origen) => netejaDrets(origen?.drets).startsWith('©');

/** Una nota connectada: el contingut és d'una altra persona. */
export const esConnexio = (nota) => nota?.origen?.tipus === 'connexio';

/** T71 · Un contingut de fora clonat al MAS: és de la persona i s'edita,
 * però en portar-lo al Mur s'ha de citar d'on ve (origen.url). */
export const esExtern = (nota) => nota?.origen?.tipus === 'extern';
