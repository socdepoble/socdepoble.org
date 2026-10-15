/**
 * xatDelPoble.js · Onada 6 (pla 261009_0245, ítem 4: «El fil de xat
 * específic també es dirà 'Gent de la Torre'») · El xat comú d'un poble es
 * diu com la seua gent, el mateix nom de l'H1 de la seua pàgina i de la
 * caputxa de la seua targeta.
 *
 * Un sol constructor (objecteDelPobleXat) per a tots els camins que obrin el
 * xat del poble: la caputxa i «Comentar» de la targeta de /pobles, el botó
 * blau i la barra taronja de la seua pàgina, l'objecte del detall i el `chat`
 * de la proposta de la Viquipèdia. El subjecte és el de sempre (poble:<id> i
 * /pobles/<id>): el fil és el mateix, només en canvia el títol que porta.
 *
 * Límit conegut · En remot el servidor deriva el títol del fil del nom del
 * poble i el congela en crear-lo (private.xat_subjecte, 2610042330): sense
 * migració, els fils ja creats continuen dient el nom del poble. Per a
 * pintar-los amb el nom de la gent sense tocar el servidor hi ha
 * titolDelFilDelPoble, una funció de presentació, i filsAmbLaGentDelPoble,
 * que l'aplica a la llista sencera: la crida el proveïdor del xat
 * (XatContext.jsx, filsVisibles) amb les fitxes de useCoreContent.
 *
 * Pur: sense React ni xarxa. Cap nom de poble escrit ací.
 */
import { objecteDe } from '../../config/navigation.js';
import { nomDeLaGentDelPoble, slugDelPoble } from './nomsDelPoble.js';

export { nomDeLaGentDelPoble };

const textDe = (valor) => (typeof valor === 'string' || typeof valor === 'number' ? String(valor).trim() : '');

/**
 * El descriptor connectable del xat d'un poble: el d'objecteDe(town,
 * 'pobles') amb el títol de la seua gent. Sense cap nom de gent, el títol de
 * sempre. null sense fitxa.
 */
export function objecteDelPobleXat(town) {
  const objecte = objecteDe(town, 'pobles');
  if (!objecte) return null;
  const gent = nomDeLaGentDelPoble(town);
  return gent ? { ...objecte, titol: gent } : objecte;
}

/* La fitxa d'un subjecte de xat 'poble': per l'id o pel slug de la fitxa, o
   per la ruta canònica /pobles/<id> (en remot el servidor pot guardar un
   altre id). */
function fitxaDelSubjecte(subjecte, towns) {
  if (!subjecte || subjecte.tipus !== 'poble' || !Array.isArray(towns)) return null;
  const id = textDe(subjecte.id);
  const ruta = textDe(subjecte.ruta);
  return towns.find((town) => {
    if (!town || typeof town !== 'object') return false;
    const propis = [textDe(town.id), textDe(town.slug)].filter(Boolean);
    if (id && propis.includes(id)) return true;
    const clau = slugDelPoble(textDe(town.id));
    return Boolean(ruta && clau && ruta === `/pobles/${clau}`);
  }) || null;
}

const esComunitatDeFil = (fil) => fil?.tipus === 'comunitat' || fil?.esComunitat === true;

/**
 * Presentació · El títol amb què es pinta un fil del xat (`fil.titol`, o
 * `title`/`name` de les files de la llista): el de la comunitat d'un poble és
 * el nom de la seua gent; la resta (el General, els Avisos, un xat que no és
 * d'un poble o un poble que no és a les fitxes), el que ja porta. No escriu
 * res ni demana res: `towns` són les fitxes que ja té qui la crida
 * (useCoreContent).
 */
export function titolDelFilDelPoble(fil, towns) {
  const propi = textDe(fil?.titol) || textDe(fil?.title) || textDe(fil?.name);
  if (!esComunitatDeFil(fil)) return propi;
  const fitxa = fitxaDelSubjecte(fil?.subjecte, towns);
  return (fitxa && nomDeLaGentDelPoble(fitxa)) || propi;
}

/* Un Fil de la interfície (mapejaFil: `name`, `title`, `searchText`) d'un
   poble que és a les fitxes, vestit amb el nom de la seua gent:
     · el subjecte de tots els fils del poble (la comunitat, els Avisos i el
       General) porta el nom de la gent com a títol, el de l'H1 de la pàgina
       on porta la capçalera de la conversa («Sobre: …»);
     · la comunitat es diu com la gent (titolDelFilDelPoble); els fills
       conserven el seu nom.
   La mateixa referència si no hi ha res a canviar. */
function filAmbLaGentDelPoble(fil, towns) {
  const subjecte = fil?.subjecte;
  if (!subjecte || subjecte.tipus !== 'poble') return fil;
  const fitxa = fitxaDelSubjecte(subjecte, towns);
  const gent = fitxa ? nomDeLaGentDelPoble(fitxa) : '';
  if (!gent) return fil;
  const canvis = {};
  if (textDe(subjecte.titol) !== gent) canvis.subjecte = { ...subjecte, titol: gent };
  if (esComunitatDeFil(fil)) {
    const titol = titolDelFilDelPoble(fil, towns);
    if (textDe(fil.name) !== titol || textDe(fil.title) !== titol) {
      canvis.name = titol;
      canvis.title = titol;
      if (typeof fil.searchText === 'string') canvis.searchText = `${titol} ${textDe(fil.ultimText)}`.toLowerCase();
    }
    const cara = textDe(fitxa?.avatar_url) || textDe(fitxa?.image_url) || textDe(fitxa?.imageSrc);
    if (cara && !textDe(fil.avatar_url)) {
      canvis.avatar_url = cara;
    }
  }
  return Object.keys(canvis).length ? { ...fil, ...canvis } : fil;
}

/**
 * Integració Xat i Pobles (Onada 6) · Els fils del xat amb el nom de la gent
 * als xats dels pobles que són a les fitxes (filAmbLaGentDelPoble). És
 * presentació: no escriu res, no demana res i no toca l'id, la ruta ni el
 * tipus del subjecte, que són els que van al servidor. Sense fitxes, o sense
 * cap fil de poble, la MATEIXA llista (cap derivat no es torna a calcular).
 */
export function filsAmbLaGentDelPoble(fils, towns) {
  if (!Array.isArray(fils) || !Array.isArray(towns) || !towns.length) return fils;
  const vestits = fils.map((fil) => filAmbLaGentDelPoble(fil, towns));
  return vestits.some((fil, i) => fil !== fils[i]) ? vestits : fils;
}
