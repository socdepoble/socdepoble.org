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
 * Funció pura, sense React ni xarxa: la usen els dos adaptadors i la
 * interfície. Cap HTML: només text net i curt.
 */
import { netejaText } from '../utils/sanitize.js';

export const TIPUS_ORIGEN = Object.freeze(['connexio']);
const CAMPS = Object.freeze(['sectionId', 'itemId', 'titol', 'autorId', 'autorNom', 'autorTipus', 'ruta']);
const MAXIM = 300;

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
    const id = netejaText(entrada.id == null ? '' : String(entrada.id), MAXIM_ID);
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    const nom = netejaText(entrada.nom == null ? '' : String(entrada.nom), MAXIM_NOM);
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
    const id = netejaText(String(valor), MAXIM_ID);
    if (id) vistos.add(id);
    if (vistos.size >= MAXIM_DESTINS) break;
  }
  return [...vistos];
}

function netejaAplicat(aplicat) {
  if (!aplicat || typeof aplicat !== 'object' || Array.isArray(aplicat)) return null;
  const net = { persones: netejaIds(aplicat.persones), grups: netejaIds(aplicat.grups), mur: aplicat.mur === true };
  const al = typeof aplicat.al === 'string' ? aplicat.al.slice(0, 40) : '';
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

/** Torna l'origen net, o null si no és cap origen que coneguem. */
export function normalitzaOrigen(origen) {
  if (!origen || typeof origen !== 'object') return null;
  if (!TIPUS_ORIGEN.includes(origen.tipus)) return null;
  const net = { tipus: origen.tipus };
  for (const camp of CAMPS) {
    if (origen[camp] === undefined || origen[camp] === null) continue;
    const valor = netejaText(String(origen[camp]), MAXIM);
    if (valor) net[camp] = valor;
  }
  if (TIPUS_OBJECTE.includes(origen.objecte)) net.objecte = origen.objecte;
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

/** Una nota connectada: el contingut és d'una altra persona. */
export const esConnexio = (nota) => nota?.origen?.tipus === 'connexio';
