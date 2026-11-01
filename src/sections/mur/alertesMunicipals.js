/**
 * alertesMunicipals.js — T3.3 (marató nocturna 261101, carril B3) · Les
 * alertes d'emergència i els bàndols urgents del Mur, pur.
 *
 * QUÈ ÉS UNA ALERTA MUNICIPAL
 *  · Una publicació de la secció Mur (mai un acte, un producte, un poble ni
 *    una pàgina del sistema) que porta, entre les seues categories o
 *    etiquetes, una d'estes (majúscules, accents, espais, guions i un «#»
 *    davant no compten):
 *      «alerta», «alerta municipal», «emergència», «emergència municipal»
 *        → Alerta municipal (el to de perill del semàfor: --sdp-error-*);
 *      «bàndol urgent» → Bàndol urgent (el to d'avís: --sdp-avis-*).
 *    Si en porta de les dues, mana l'alerta. El model del Mur no té cap camp
 *    de prioritat ni de caducitat: només les etiquetes (`labels`, que escriu
 *    NotesContext · publishNote amb les categories i les etiquetes de la nota)
 *    i, per al contingut de l'administració, `category`, `categories`,
 *    `tags` i `tag`.
 *  · I signada per un AJUNTAMENT (vegeu baix). Una publicació d'un veí amb
 *    l'etiqueta «Alerta» es queda com sempre: la seua etiqueta, sense
 *    distintiu.
 *
 * QUI LA POT MARCAR
 *  Les etiquetes viatgen al payload, que qualsevol membre del poble escriu
 *  per l'API: no proven res. L'autoritat és la signatura, la columna
 *  section_submissions.author_org_id: el servidor només la deixa escriure a
 *  la propietària o una administradora de l'entitat
 *  (pot_signar_com_organitzacio, 2609261200) i elementDeFilaPublicada
 *  (data/mapejadorSeccions.js) mai no la pren del payload. Un ajuntament
 *  (kind 'city_hall') no es crea ni es commuta des del client: només per
 *  reclamació revisada (2609281500, 2610311500). El tipus de l'entitat no
 *  viatja amb la publicació: el diu el directori públic de les
 *  organitzacions (useAjuntamentsDelMur.js). Qui pinta passa `esAjuntament`;
 *  sense resposta, cap distintiu.
 *
 * VIGÈNCIA
 *  Sense cap camp de caducitat al model, una alerta és vigent durant
 *  VIGENCIA_ALERTA_MS des de la data que pinta la seua targeta
 *  (targetesMur.js · momentDeLaTargeta: la triada, la de creació o una
 *  edició de veres posterior), i també si eixa data és futura. Una sense cap
 *  data real no és vigent (no se n'inventa cap). Només les vigents pugen al
 *  capdamunt del Mur i entren a l'avís de dalt; el distintiu de la targeta
 *  diu què és la publicació i es queda sempre.
 */
import { autorDe } from '../../config/navigation.js';

/* T7 · P1-22 (261101) · El nom de cada tipus en parell [clau i18n, reserva
   en valencià]: qui el pinta el passa pel traductor de la interfície
   (AlertaMunicipal.jsx). `text` és la reserva, el text de sempre. */
const ETIQUETA_ALERTA = Object.freeze(['section.mur.alerta.municipal', 'Alerta municipal']);
const ETIQUETA_BANDOL = Object.freeze(['section.mur.alerta.bandolUrgent', 'Bàndol urgent']);

/** Els dos tipus del distintiu, amb el text visible (i el seu parell i18n) i el to del semàfor (Insignia · `to`). */
export const TIPUS_ALERTA = Object.freeze({
  alerta: Object.freeze({ clau: 'alerta', etiqueta: ETIQUETA_ALERTA, text: ETIQUETA_ALERTA[1], to: 'error' }),
  bandol_urgent: Object.freeze({ clau: 'bandol_urgent', etiqueta: ETIQUETA_BANDOL, text: ETIQUETA_BANDOL[1], to: 'avis' })
});

/** El títol de l'avís de les vigents (RegioAlertesVigents), en parells; {n} és el nombre d'avisos. */
export const TEXTOS_ALERTES = Object.freeze({
  una: Object.freeze(['section.mur.alertes.una', 'Hi ha 1 avís municipal urgent']),
  diverses: Object.freeze(['section.mur.alertes.diverses', 'Hi ha {n} avisos municipals urgents'])
});

/* Cada etiqueta normalitzada (normalitzaEtiqueta) que vol dir un tipus. */
const SINONIMS = new Map([
  ['alerta', 'alerta'],
  ['alerta_municipal', 'alerta'],
  ['emergencia', 'alerta'],
  ['emergencia_municipal', 'alerta'],
  ['bandol_urgent', 'bandol_urgent']
]);
/* Si una publicació en porta de les dues, mana la primera. */
const PRECEDENCIA = Object.freeze(['alerta', 'bandol_urgent']);

/* El payload és d'un veí: una etiqueta molt llarga no pot ser cap de les de
   dalt, i una llista enorme no es recorre sencera. */
const MAXIM_ETIQUETA = 64;
const MAXIM_ETIQUETES = 32;

/* Els tipus d'element que mai no són una publicació del Mur. */
const TIPUS_FORA_DEL_MUR = new Set(['event', 'market', 'product', 'sistema', 'poble']);

/** Les hores de vigència d'una alerta sense caducitat pròpia: 72 h. */
export const VIGENCIA_ALERTA_MS = 72 * 60 * 60 * 1000;

/**
 * La forma comparable d'una etiqueta (un text o { text }): sense accents ni
 * majúscules, i cada tros que no és lletra o xifra fet un sol «_», sense «_»
 * als extrems. «Bàndol urgent!» → 'bandol_urgent'. '' si no és text o passa
 * de MAXIM_ETIQUETA. Sense cap regex que puga recular: lineal.
 */
export function normalitzaEtiqueta(etiqueta) {
  const text = typeof etiqueta === 'string' ? etiqueta
    : (etiqueta && typeof etiqueta === 'object' && typeof etiqueta.text === 'string' ? etiqueta.text : null);
  if (text === null || text.length > MAXIM_ETIQUETA) return '';
  let net = text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  if (net.startsWith('_')) net = net.slice(1);
  if (net.endsWith('_')) net = net.slice(0, -1);
  return net;
}

/* Les etiquetes on pot dir-se el tipus, en l'ordre en què es miren. */
function etiquetesDe(item) {
  const llista = (valor) => (Array.isArray(valor) ? valor.slice(0, MAXIM_ETIQUETES) : []);
  return [
    ...llista(item.labels), ...llista(item.categories), ...llista(item.tags),
    item.category, item.tag
  ];
}

/** Cert si l'element és una publicació del Mur (cap acte, producte, poble ni pàgina del sistema). */
export function esPublicacioDelMur(item) {
  return Boolean(item) && typeof item === 'object' && !Array.isArray(item)
    && item.isSystem !== true && !TIPUS_FORA_DEL_MUR.has(item.type);
}

/**
 * El tipus d'alerta que diuen les etiquetes d'una publicació del Mur
 * ('alerta' | 'bandol_urgent'), o null. Només les etiquetes: qui signa ho
 * mira alertaMunicipalDe.
 */
export function tipusDAlerta(item) {
  if (!esPublicacioDelMur(item)) return null;
  const trobats = new Set();
  for (const etiqueta of etiquetesDe(item)) {
    const clau = SINONIMS.get(normalitzaEtiqueta(etiqueta));
    if (clau) trobats.add(clau);
  }
  return PRECEDENCIA.find((clau) => trobats.has(clau)) ?? null;
}

/** L'id de l'entitat que signa (autorDe, la mateixa regla de la boina), o null si no en signa cap. */
export function entitatQueSigna(item) {
  const autor = autorDe(item);
  return autor?.tipus === 'entitat' ? autor.id : null;
}

/**
 * Les entitats que caldria comprovar: les que signen alguna publicació amb
 * etiqueta d'alerta. Sense repetir i en ordre, per a fer-ne una clau estable.
 * Una llista buida vol dir que no cal preguntar res a ningú.
 */
export function candidatsAAlerta(items) {
  if (!Array.isArray(items)) return [];
  const ids = new Set();
  for (const item of items) {
    if (!tipusDAlerta(item)) continue;
    const entitat = entitatQueSigna(item);
    if (entitat) ids.add(entitat);
  }
  return [...ids].sort();
}

/**
 * El tipus d'alerta municipal d'una publicació ('alerta' | 'bandol_urgent'),
 * o null: només si les etiquetes en diuen un i l'entitat que la signa és un
 * ajuntament per a `esAjuntament(id)` (cert i res més). Sense resolutor, null.
 */
export function alertaMunicipalDe(item, esAjuntament) {
  const clau = tipusDAlerta(item);
  if (!clau || typeof esAjuntament !== 'function') return null;
  const entitat = entitatQueSigna(item);
  return entitat && esAjuntament(entitat) === true ? clau : null;
}

/**
 * Cert si una alerta amb el `moment` (ms) de la seua targeta encara és
 * vigent `ara`: no fa més de `vigencia` ms, o és futura. Sense moment, no.
 */
export function esVigent(moment, ara = Date.now(), vigencia = VIGENCIA_ALERTA_MS) {
  return Number.isFinite(moment) && Number.isFinite(ara) && moment >= ara - vigencia;
}

/**
 * Les entrades ja ordenades, amb les que complixen `esAlertaVigent` al
 * capdamunt. Partició estable: dins de cada grup, l'ordre d'entrada.
 */
export function vigentsDalt(entrades, esAlertaVigent) {
  if (!Array.isArray(entrades) || typeof esAlertaVigent !== 'function') return Array.isArray(entrades) ? entrades : [];
  const dalt = [];
  const resta = [];
  for (const entrada of entrades) (esAlertaVigent(entrada) ? dalt : resta).push(entrada);
  return dalt.length ? [...dalt, ...resta] : entrades;
}
