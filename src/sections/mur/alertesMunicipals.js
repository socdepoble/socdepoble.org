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
 *  (data/mapejadorSeccions.js) mai no la pren del payload. D-6 (assalt
 *  261101, migració 2611011500, aplicada a producció segons la lectura REST
 *  del 6-11-2026): un ajuntament, a més, només signa al seu poble (el
 *  tenant_id de l'entitat ha de ser el de la publicació). En un node sense
 *  la migració, qualsevol ajuntament del node; el client no hi mira el poble a posta (amb la
 *  divisió de tenants del node amagaria alertes legítimes). Un ajuntament
 *  (kind 'city_hall') no es crea ni es commuta des del client: només per
 *  reclamació revisada (2609281500, 2610311500). El tipus de l'entitat no
 *  viatja amb la publicació: el diu el directori públic de les
 *  organitzacions (useAjuntamentsDelMur.js). Qui pinta passa `esAjuntament`;
 *  sense resposta, cap distintiu.
 *
 * VIGÈNCIA
 *  Sense cap camp de caducitat al model, una alerta és vigent durant
 *  VIGENCIA_ALERTA_MS des de la data que pinta la seua targeta
 *  (targetesMur.js · momentDeLaTargeta: la triada o, sense, la de creació;
 *  R51, una edició no hi compta), i també si eixa data és futura. Una sense cap
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

/** El títol de l'avís de les vigents (RegioAlertesVigents), en parells; {n} és el nombre d'avisos.
 *  `vigentFins`: la caducitat de cada avís, amb {data} absoluta (dataDeCaducitat). */
export const TEXTOS_ALERTES = Object.freeze({
  una: Object.freeze(['section.mur.alertes.una', 'Hi ha 1 avís municipal urgent']),
  diverses: Object.freeze(['section.mur.alertes.diverses', 'Hi ha {n} avisos municipals urgents']),
  vigentFins: Object.freeze(['section.mur.alertes.vigentFins', 'vigent fins a {data}'])
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

/* T7 · S2 (assalt 261101) · El rellotge de la caducitat. Una alerta vigent
   (esVigent) ho és fins a `caducaAl` inclòs i deixa de ser-ho el mil·lisegon
   següent; com que una futura ja és vigent, el temps només en trau, mai
   n'hi posa: n'hi ha prou amb esperar la caducitat més pròxima
   (useRellotgeAlertes.js). */

/** L'instant (ms) fins al qual és vigent l'alerta del `moment` de la seua targeta, o null sense moment. */
export function caducaAl(moment, vigencia = VIGENCIA_ALERTA_MS) {
  return Number.isFinite(moment) ? moment + vigencia : null;
}

/** La caducitat més pròxima de les alertes [{ caducaAl }] que encara no ha passat `ara` (inclosa la d'ara mateix), o null. */
export function properaCaducitat(alertes, ara) {
  if (!Array.isArray(alertes) || !Number.isFinite(ara)) return null;
  let propera = null;
  for (const alerta of alertes) {
    const quan = alerta?.caducaAl;
    if (Number.isFinite(quan) && quan >= ara && (propera === null || quan < propera)) propera = quan;
  }
  return propera;
}

/** El màxim d'un setTimeout (2^31 − 1 ms, uns 24,8 dies): per damunt, el navegador el dispara de seguida. */
export const MAX_ESPERA_MS = 2_147_483_647;
/** El mínim entre dos tocs del rellotge: mai un bucle calent. */
export const MIN_ESPERA_MS = 1000;

/** Els ms que cal esperar perquè `quan` ja haja passat (`quan` + 1), entre MIN_ESPERA_MS i MAX_ESPERA_MS; null si no hi ha res a esperar. */
export function esperaFins(quan, ara) {
  if (!Number.isFinite(quan) || !Number.isFinite(ara)) return null;
  return Math.min(MAX_ESPERA_MS, Math.max(MIN_ESPERA_MS, quan - ara + 1));
}

/** El format de la data absoluta de caducitat: dia de la setmana, dia, mes i hora. */
export const OPCIONS_CADUCITAT = Object.freeze({ weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** Cert si `ms` és un instant que Date sap representar (±8,64·10¹⁵): una data triada absurda no tomba el Mur. */
export const esInstantRepresentable = (ms) => Number.isFinite(ms) && !Number.isNaN(new Date(ms).getTime());

/* El formatador de la caducitat en el locale de la interfície; 'ca-ES' si no n'hi ha o no és vàlid. */
function formatadorDeCaducitat(locale) {
  try {
    return new Intl.DateTimeFormat(locale || 'ca-ES', OPCIONS_CADUCITAT);
  } catch {
    return new Intl.DateTimeFormat('ca-ES', OPCIONS_CADUCITAT);
  }
}

/** La data absoluta de `caducaAlMs` en el locale de la interfície ('ca-ES' si no n'hi ha o no és vàlid); '' sense data representable. */
export function dataDeCaducitat(caducaAlMs, locale) {
  if (!esInstantRepresentable(caducaAlMs)) return '';
  return formatadorDeCaducitat(locale).format(new Date(caducaAlMs));
}

/* Els espais d'un literal d'Intl (també els no separables). */
const esEspai = (caracter) => caracter.trim() === '';

/**
 * Gauntlet transversal 261101 (VC-01) · La mateixa data en dos trossos:
 * `data` (el dia) i `hora` (l'hora amb les paraules que la presenten en cada
 * locale: «a les 17:44», «at 17:44», «(17:44)» o només «17:44»). `data` +
 * `hora` és sempre dataDeCaducitat, caràcter a caràcter. Qui pinta embolcalla
 * `hora` (AlertaMunicipal.jsx · .sdp-mur-alertes__hora, nowrap) perquè una
 * línia no talle «a les / 17:44»; la data, en canvi, pot baixar de línia. El
 * literal de davant de l'hora es partix després de l'última coma i dels
 * espais que la seguixen: el que queda («a les », «at », «(») va amb l'hora.
 * El tall es mesura amb formatToParts però els caràcters són els de format():
 * en-US, per exemple, hi posa un espai on formatToParts posa U+202F. Si les
 * dues formes no fan la mateixa llargària, o no hi ha cap tros d'hora, tot és
 * `data`; sense data representable, dos buits.
 */
export function trossosDeCaducitat(caducaAlMs, locale) {
  if (!esInstantRepresentable(caducaAlMs)) return { data: '', hora: '' };
  const formatador = formatadorDeCaducitat(locale);
  const quan = new Date(caducaAlMs);
  const completa = formatador.format(quan);
  const trossos = formatador.formatToParts(quan);
  const text = (llista) => llista.map((tros) => tros.value).join('');
  const iHora = trossos.findIndex((tros) => tros.type === 'hour');
  if (iHora < 0 || text(trossos).length !== completa.length) return { data: completa, hora: '' };
  const davant = iHora > 0 && trossos[iHora - 1].type === 'literal' ? trossos[iHora - 1].value : '';
  let tall = davant.lastIndexOf(',') + 1;
  while (tall < davant.length && esEspai(davant[tall])) tall += 1;
  const llargariaData = text(trossos.slice(0, davant ? iHora - 1 : iHora)).length + tall;
  return { data: completa.slice(0, llargariaData), hora: completa.slice(llargariaData) };
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
