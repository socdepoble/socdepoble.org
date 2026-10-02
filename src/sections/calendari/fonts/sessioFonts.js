/**
 * sessioFonts.js — la sessió de les fonts de calendari, NOMÉS en memòria.
 *
 * T1 (prompt comú 261002_0125) · Un magatzem xicotet (per a
 * useSyncExternalStore) amb el que ha de sobreviure al canvi de vista de
 * /calendari, que desmunta un calendari i en munta un altre:
 *   · el token de cada compte, en un Map privat d'este mòdul. Mai a cap
 *     emmagatzematge del navegador ni a la URL: recarregar la pàgina el perd,
 *     i és a propòsit. L'instantània només diu si el compte està connectat;
 *     el token només el dona tokenDe, a la font que el demana.
 *   · la fase de la connexió de cada compte (connectant) i el seu error;
 *   · les caselles que el veí ha canviat a «Els meus calendaris».
 * Un compte es diu per la seua clau: l'adreça, o '' per al compte sense
 * adreça configurada.
 *
 * Bucle adversarial (auditoria Codex 261002_0148, punt 10) · VERSIÓ DE
 * SESSIÓ. Cada compte porta una `versio` que canvia en connectar (desaToken)
 * i en desconnectar (oblidaToken), d'un comptador que no torna mai arrere (ni
 * amb oblidaTot): dos sessions no compartixen mai versió. useFontsCalendari
 * guarda amb cada resultat la versió amb què el va demanar i només mostra el
 * de la versió vigent; així, les entrades del compte d'abans no tornen a
 * eixir mentre carrega el de després.
 *
 * IDENTITAT DE L'AMFITRIÓ. Els tokens són de la persona que hi havia en
 * connectar. Quan l'amfitrió avisa amb `sdp:auth-change` que ara és una
 * altra, o ningú (ha eixit), ho oblida tot (oblidaTot): tokens, connexions en
 * curs i caselles. Si en connectar encara no se sabia qui era (el calendari
 * es carrega tard, després d'entrar), el primer avís també ho oblida:
 * fallada tancada, val més tornar a connectar que veure el calendari d'una
 * altra persona en un ordinador compartit. L'escolta viu amb el mòdul (no
 * amb el calendari muntat): eixir des d'una altra secció també ho oblida.
 * Desmuntar el calendari no és cap senyal: passa a cada canvi de vista.
 *
 * Revisió adversarial (regressio-01) · El motiu que es mostra no menteix.
 * Amb la persona coneguda en connectar, MOTIU_IDENTITAT («Ha canviat qui ha
 * entrat»), que llavors és cert. Amb la identitat desconeguda, el primer avís
 * sol ser la renovació del JWT de la MATEIXA persona (l'amfitrió l'envia a
 * cada renovació i no n'envia cap en arrencar amb una sessió vigent): s'oblida
 * igualment, però amb MOTIU_SEGURETAT, que no afirma cap canvi.
 */
import { ERRORS_DE_FONT, ErrorDeFont, errorPla } from './contracteFonts.js';

const COMPTE_BUIT = Object.freeze({ connectat: false, versio: 0, connectant: false, error: null });
const INICIAL = Object.freeze({ comptes: Object.freeze({}), caselles: Object.freeze({}) });
/* El màxim d'un setTimeout (2^31 − 1 ms): un token que dura més s'oblida igualment a la primera petició. */
const MAX_TEMPORITZADOR = 2147483647;
/** L'avís de l'amfitrió quan canvia qui ha entrat (detail.user: la persona o null). */
export const AVIS_IDENTITAT = 'sdp:auth-change';
/* Encara no s'ha sentit cap avís: no se sap qui hi ha. No és igual a cap identitat. */
const DESCONEGUDA = Symbol('identitat desconeguda');
export const MOTIU_IDENTITAT = 'Ha canviat qui ha entrat a Sóc de Poble: torna a connectar el calendari.';
/** El motiu quan en connectar no se sabia qui hi havia: no es pot dir que haja canviat ningú. */
export const MOTIU_SEGURETAT = 'Per seguretat, torna a connectar el calendari.';

const tokens = new Map();
const intents = new Map();
const subscriptors = new Set();
let estat = INICIAL;
let versions = 0;
let identitat = DESCONEGUDA;
/* De qui són els tokens i les connexions que hi ha ara (la identitat del primer). */
let propietari = DESCONEGUDA;

function publica(canvi) {
  estat = Object.freeze({ ...estat, ...canvi });
  for (const avisa of [...subscriptors]) avisa();
}

function posaCompte(compte, canvis) {
  const previ = estat.comptes[compte] ?? COMPTE_BUIT;
  publica({ comptes: Object.freeze({ ...estat.comptes, [compte]: Object.freeze({ ...previ, ...canvis }) }) });
}

function oblidaTemporitzador(compte) {
  const desat = tokens.get(compte);
  if (desat) clearTimeout(desat.temporitzador);
}

/* Una versió que no ha tingut mai cap sessió. */
function versioNova() {
  versions += 1;
  return versions;
}

const hiHaSessio = () => tokens.size > 0 || intents.size > 0;

/* El primer token o la primera connexió d'una sessió és de qui hi ha ara. */
function prenPropietari() {
  if (!hiHaSessio()) propietari = identitat;
}

/** La clau d'un compte: l'adreça, o '' si no en porta. */
export const clauDelCompte = (compte) => (typeof compte === 'string' ? compte : '');

export function subscriu(avisa) {
  subscriptors.add(avisa);
  return () => subscriptors.delete(avisa);
}

/** L'estat immutable d'ara: { comptes: { [clau]: { connectat, versio, connectant, error } }, caselles: { [idFont]: bool } }. */
export const instantania = () => estat;

/** L'estat d'un compte en una instantània (el buit si no se n'ha parlat mai). */
export const estatDelCompte = (foto, compte) => foto.comptes[compte] ?? COMPTE_BUIT;

/** La casella d'una font: la que ha triat el veí o, si no n'ha triat cap, la de la font. */
export const casellaDe = (foto, font) => (Object.hasOwn(foto.caselles, font.id) ? foto.caselles[font.id] : font.activa);

/** El token d'un compte, o null si no n'hi ha o ja ha caducat (llavors l'oblida i ho diu). */
export function tokenDe(compte, ara = Date.now()) {
  const desat = tokens.get(compte);
  if (!desat) return null;
  if (desat.caduca <= ara) {
    oblidaToken(compte, new ErrorDeFont(ERRORS_DE_FONT.TOKEN_CADUCAT));
    return null;
  }
  return desat.token;
}

/** Guarda en memòria el token d'un compte fins que caduca. Cada token nou és una sessió nova: versió nova (les fonts tornen a demanar). */
export function desaToken(compte, { token, caduca } = {}, ara = Date.now()) {
  if (typeof token !== 'string' || !token || !(caduca > ara)) throw new TypeError('[fonts] Un token necessita el valor i quan caduca.');
  prenPropietari();
  oblidaTemporitzador(compte);
  const temporitzador = setTimeout(() => oblidaToken(compte, new ErrorDeFont(ERRORS_DE_FONT.TOKEN_CADUCAT)), Math.min(caduca - ara, MAX_TEMPORITZADOR));
  temporitzador?.unref?.();
  tokens.set(compte, { token, caduca, temporitzador });
  posaCompte(compte, { connectat: true, versio: versioNova(), connectant: false, error: null });
}

/** Oblida el token d'un compte (i la seua sessió: versió nova); amb `error`, el compte el diu (caducat, sense permís…). */
export function oblidaToken(compte, error = null) {
  oblidaTemporitzador(compte);
  tokens.delete(compte);
  posaCompte(compte, { connectat: false, versio: versioNova(), connectant: false, error: error ? errorPla(error) : null });
}

/** Comença una connexió (cancel·la la que hi haguera): torna l'AbortController de l'intent. */
export function iniciaConnexio(compte) {
  intents.get(compte)?.abort();
  intents.delete(compte);
  prenPropietari();
  const control = new AbortController();
  intents.set(compte, control);
  posaCompte(compte, { connectant: true, error: null });
  return control;
}

/** Acaba l'intent `control` (si encara és el viu) amb l'error, si n'hi ha. */
export function acabaConnexio(compte, control, error = null) {
  if (intents.get(compte) !== control) return;
  intents.delete(compte);
  posaCompte(compte, { connectant: false, error: error ? errorPla(error) : null });
}

/** El veí cancel·la la connexió en curs. */
export function cancellaConnexio(compte) {
  const control = intents.get(compte);
  if (!control) return;
  intents.delete(compte);
  control.abort();
  posaCompte(compte, { connectant: false, error: null });
}

/** Marca o desmarca la casella d'una font. */
export function posaCasella(idFont, activa) {
  publica({ caselles: Object.freeze({ ...estat.caselles, [idFont]: Boolean(activa) }) });
}

/** Ho oblida tot (tokens, intents i caselles): tornar a començar sense recarregar. Les versions no tornen arrere. */
export function oblidaTot() {
  for (const control of intents.values()) control.abort();
  intents.clear();
  for (const compte of tokens.keys()) oblidaTemporitzador(compte);
  tokens.clear();
  propietari = DESCONEGUDA;
  publica(INICIAL);
}

/* L'id d'una persona com a text, o null si no n'hi ha cap. */
function idDe(persona) {
  const id = persona && typeof persona === 'object' ? persona.id : null;
  if (typeof id === 'string' && id) return id;
  return typeof id === 'number' && Number.isFinite(id) ? String(id) : null;
}

/**
 * L'amfitrió diu qui ha entrat ara: la persona ({ id }) o ningú (null). Si hi
 * ha tokens o connexions d'una altra persona (o de qui no se sabia), ho oblida
 * tot, i els comptes que estaven connectats diuen per què (el veí no es troba
 * «Sense connectar» sense saber-ne la causa): MOTIU_IDENTITAT si se sabia qui
 * era, MOTIU_SEGURETAT si no. Un avís de la mateixa persona (una renovació,
 * un canvi de nom) no toca res.
 */
export function canviaIdentitat(persona) {
  const nova = idDe(persona);
  if (hiHaSessio() && propietari !== nova) {
    const tenien = new Set([...tokens.keys(), ...intents.keys()]);
    const coneguda = propietari !== DESCONEGUDA;
    oblidaTot();
    const motiu = new ErrorDeFont(ERRORS_DE_FONT.SENSE_AUTORITZACIO, coneguda ? MOTIU_IDENTITAT : MOTIU_SEGURETAT);
    for (const compte of tenien) posaCompte(compte, { error: errorPla(motiu) });
  }
  identitat = nova;
}

/**
 * Escolta els avisos `sdp:auth-change` de `finestra`. Només compten els que
 * diuen qui hi ha (detail.user, encara que siga null); els que no ho diuen
 * («alguna cosa ha canviat, torna a llegir») no canvien la identitat. Torna
 * la funció per a deixar d'escoltar.
 */
export function escoltaIdentitat(finestra = globalThis.window) {
  if (typeof finestra?.addEventListener !== 'function') return () => {};
  const escolta = (event) => {
    const detall = event?.detail;
    if (detall && typeof detall === 'object' && Object.hasOwn(detall, 'user')) canviaIdentitat(detall.user);
  };
  finestra.addEventListener(AVIS_IDENTITAT, escolta);
  return () => finestra.removeEventListener(AVIS_IDENTITAT, escolta);
}

escoltaIdentitat();
