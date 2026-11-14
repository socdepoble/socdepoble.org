/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · El text d'un veí abans d'eixir a
 * un <head> estàtic. El nom, el lema i la descripció d'una entitat són text lliure,
 * sense moderació prèvia, i el prerender els cou en una pàgina del domini que es
 * queda servida fins a la release següent. Pur: sense xarxa ni disc.
 *
 *   · textVeinal: el text pla del build (plainText: sense etiquetes ni Markdown,
 *     amb la guarda de secrets) i, a més, sense cap caràcter de format Unicode
 *     (classe Cf: els bidi U+202A–U+202E i U+2066–U+2069, l'espai d'amplada zero,
 *     el guionet opcional…), que un nom pot fer servir per a semblar-ne un altre.
 *   · teContacte: DETECTA, no muta. El mateix abast que el servidor aplica al Mur
 *     públic (private.mur_text_public, migració 2611122200): correu, telèfon, UUID,
 *     URL amb esquema, tel:, mailto:, wa.me i t.me; i les seues excepcions: una data
 *     real (2026-11-13), un rang d'anys (1987-2026) i un ISBN etiquetat no són cap
 *     telèfon. Un identificador de xarxa «@nom» no és cap correu. Qui crida decidix:
 *     un lema amb contacte no s'usa; un nom amb contacte exclou la fitxa.
 *   · esSuplantacio: un nom que, normalitzat, és el d'una identitat del paquet amb un
 *     id que eixa identitat no declara, o que comença per «Ajuntament» sense ser un
 *     ajuntament (kind city_hall).
 */
import {plainText} from './build-social-manifest.mjs';

/** El text pla d'un veí, sense caràcters de format; llança (com plainText) davant d'un possible secret. */
export function textVeinal(valor, limit = 300) {
  if (typeof valor !== 'string') return '';
  return plainText(valor.replace(/\p{Cf}/gu, ''), limit);
}

const CORREU = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/u;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const RECURS = /(?:https?:\/\/|data:|sdp-media:|tel:|mailto:|(?:www\.)?(?:wa\.me|t\.me)\/)[^\s<>]+/i;
const PROTEGIBLE = /(?<![\p{L}\p{N}])(\d{4}-\d{2}-\d{2}|\d{4}-\d{4}|ISBN(?:-1[03])?[\s:]+(?:\d[ -]?){9,12}[\dXx])(?![\p{L}\p{N}])/giu;
const TELEFON = /(?<![\p{L}\p{N}])[+]?(?:\d[\s()./_-]{0,3}){7,}\d(?![\p{L}\p{N}])/u;

function esDataReal(text) {
  const [any, mes, dia] = text.split('-').map(Number);
  if (mes < 1 || mes > 12 || dia < 1) return false;
  return dia <= new Date(Date.UTC(any, mes, 0)).getUTCDate();
}
function esIsbn(text) {
  const digits = text.replace(/^ISBN(?:-1[03])?[\s:]+/i, '').replace(/[ -]/g, '').toUpperCase();
  if (/^\d{9}[\dX]$/.test(digits)) return [...digits].reduce((suma, c, i) => suma + (10 - i) * (c === 'X' ? 10 : Number(c)), 0) % 11 === 0;
  if (/^\d{13}$/.test(digits)) return [...digits].reduce((suma, c, i) => suma + Number(c) * (i % 2 ? 3 : 1), 0) % 10 === 0;
  return false;
}
const esProtegit = candidat => (/^\d{4}-\d{2}-\d{2}$/.test(candidat) ? esDataReal(candidat)
  : /^\d{4}-\d{4}$/.test(candidat) ? /^[12]\d{3}-[12]\d{3}$/.test(candidat) && Number(candidat.slice(0, 4)) <= Number(candidat.slice(5))
    : esIsbn(candidat));

/** Si un text porta un contacte o un identificador (correu, telèfon, UUID o un recurs amb esquema). No el canvia. */
export function teContacte(valor) {
  if (typeof valor !== 'string' || valor === '') return false;
  if (CORREU.test(valor) || UUID.test(valor) || RECURS.test(valor)) return true;
  return TELEFON.test(valor.replace(PROTEGIBLE, (tot, candidat) => (esProtegit(candidat) ? ' ' : tot)));
}

/* Crítica de seguretat del lliurament R22 · Les lletres ciríl·liques i gregues que pinten com les llatines
   (la mateixa llista que private.organitzacions_frena_abus, migració 20261114000200). Sense elles, «Sóc de
   Pоble» amb una «о» ciríl·lica feia el mateix títol a la targeta i no suplantava ningú. */
const DE_CONFUSIBLES = 'аеіјорсухѕһԁӏԛԝкАВЕІЈКМНОРСТХЅҮУαεικνορτυχΑΒΕΖΗΙΚΜΝΟΡΤΥΧıȷ';
const A_LLATINES = 'aeijopcyxshdlqwkabeijkmhopctxsyyaeikvoptuxabezhikmnoptyxij';
const CONFUSIBLES = new Map([...DE_CONFUSIBLES].map((lletra, i) => [lletra, A_LLATINES[i]]));
const CONFUSIBLE = new RegExp(`[${DE_CONFUSIBLES}]`, 'gu');

/** Un nom per a comparar: el que es VEU (NFKD: també l'amplada completa; i les lletres que pinten igual), sense majúscules, accents, espais ni puntuació. */
export function nomNormalitzat(valor) {
  return String(valor ?? '').normalize('NFKD').replace(/\p{M}/gu, '').replace(CONFUSIBLE, lletra => CONFUSIBLES.get(lletra))
    .toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Si una fila del directori suplanta: { name, id, kind }.
 * `identitats` és [{ nom, clau }] (el nom d'una identitat del paquet i una clau seua) i
 * `reservadaPerAUnAltre(clau, id)` diu si eixa clau és d'una identitat que no declara l'id
 * (metadadesDePerfil.js · esClauReservadaPerAUnAltre).
 */
export function esSuplantacio({name, id, kind}, {identitats = [], reservadaPerAUnAltre = () => false} = {}) {
  const nom = nomNormalitzat(name);
  if (!nom) return false;
  if (nom.startsWith('ajuntament') && kind !== 'city_hall') return true;
  return identitats.some(identitat => nomNormalitzat(identitat.nom) === nom && reservadaPerAUnAltre(identitat.clau, id));
}
