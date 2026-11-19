/**
 * referenciaPaginaXat.js — Ordre del Mestre (261118) · «Tota pàgina pot generar
 * un xat (de grup o privat) i la referència sempre ha d’estar a dalt amb un
 * xicotet bàner que dirigisca a la notícia / esdeveniment / pàgina d’on és el xat.»
 *
 * Dos orígens complementaris, sense tocar la URL (B05) ni localStorage:
 *   1. Xat públic de pàgina (`fil.subjecte`): tot fil amb `subjecte` que no siga
 *      un canal intern d'una comunitat (`!fil.comunitatId`) ni el xat de la IAIA
 *      ja porta la referència pròpia, tant si s'hi entra des de la pàgina com
 *      si s'obri des de la llista de converses.
 *   2. Xat privat o entrada amb esborrany des d'una pàgina (`recordaReferenciaPaginaXat`):
 *      quan una persona prem «Comentar → En privat» (o «Preguntar en privat» /
 *      «Comentar al xat públic» en un esdeveniment), recordem en memòria de
 *      pestanya `{ tipus, id, titol, ruta, esborrany }` i el lliguem a la
 *      primera conversa que s'obri (mateixa màquina d'estats idempotent que
 *      `origenDelXat.js`). En canviar de conversa o tornar a la llista, s'oblida.
 */
import { useState } from 'react';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { rutaDeSubjecte } from '../../data/contracte.js';
import { esXatDeLaIAIA } from '../../data/xatsPerDefecte.js';

const TIPUS_AMB_BANER = new Set(['esdeveniment', 'publicacio', 'producte', 'pagina', 'multimedia', 'grup']);
const MAXIM_ESBORRANY = 1000;

let darreraReferencia = null;
let esborranyPendent = '';

function textNet(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalitzaDescriptor(objecte) {
  if (!objecte || typeof objecte !== 'object') return null;
  const tipus = textNet(objecte.tipus) || 'pagina';
  if (!TIPUS_AMB_BANER.has(tipus)) return null;
  const id = textNet(objecte.id);
  const rutaDirecta = textNet(objecte.ruta);
  const ruta = esRutaInterna(rutaDirecta) ? rutaDirecta : (rutaDeSubjecte(tipus, id) || '');
  if (!esRutaInterna(ruta)) return null;
  const titol = textNet(objecte.titol).slice(0, 140) || ruta;
  return Object.freeze({ tipus, id: id || ruta, titol, ruta });
}

/**
 * Recorda la pàgina d'origen (i, opcionalment, un esborrany per al compositor)
 * just abans de navegar cap al Xat des d'una Pàgina Universal o targeta.
 */
export function recordaReferenciaPaginaXat(objecte, { esborrany = '' } = {}) {
  const neta = normalitzaDescriptor(objecte);
  darreraReferencia = neta;
  esborranyPendent = textNet(esborrany).slice(0, MAXIM_ESBORRANY);
  return neta;
}

/** Consumix l'esborrany pendent una sola vegada quan el fil destí s'obri. */
export function prenEsborranyReferenciaXat() {
  const valor = esborranyPendent;
  esborranyPendent = '';
  return valor;
}

/** Llig la darrera referència desada en memòria (sense consumir-la). */
export function referenciaPaginaXatActual() {
  return darreraReferencia;
}

/** Reinicia la memòria (per a proves i canvis de sessió). */
export function oblidaReferenciaPaginaXat() {
  darreraReferencia = null;
  esborranyPendent = '';
}

export const SENSE_REFERENCIA_PAGINA = Object.freeze({ referencia: null, fil: null });

/** Màquina d'estats pura (idempotent), bessona de `seguentOrigen` (`origenDelXat.js`). */
export function seguentReferenciaPagina(estat, { intencio = false, fil = null } = {}) {
  if (!estat?.referencia) return SENSE_REFERENCIA_PAGINA;
  if (!intencio) return SENSE_REFERENCIA_PAGINA;
  if (fil == null || fil === '') return estat;
  const id = String(fil);
  if (estat.fil == null) return { referencia: estat.referencia, fil: id };
  return estat.fil === id ? estat : SENSE_REFERENCIA_PAGINA;
}

/**
 * Ganxo d'entrada de `XatSection`: manté viva la referència d'entrada mentre
 * es resol `?amb=` o `?sobre=` cap a `/xat/<filId>`, i l'allibera en eixir o
 * triar una altra conversa.
 */
export function useReferenciaPaginaDelXat({ intencio = false, fil = null } = {}) {
  const [estat, setEstat] = useState(() => {
    const ref = intencio ? darreraReferencia : null;
    if (intencio && ref) darreraReferencia = null;
    return ref ? { referencia: ref, fil: null } : SENSE_REFERENCIA_PAGINA;
  });
  const seguent = seguentReferenciaPagina(estat, { intencio, fil });
  if (seguent !== estat) setEstat(seguent);
  return seguent.referencia && fil != null && seguent.fil === String(fil) ? seguent.referencia : null;
}

/**
 * Resol la referència visible al capdamunt d'una conversa:
 *   1. Si el fil té `subjecte` propi d'una pàgina/notícia/esdeveniment/producte
 *      (no és comunitat ni canal intern de comunitat ni xat de la IAIA), mana ell.
 *   2. Altrament, si s'ha entrat a un xat privat des d'una pàgina (`referenciaEntrada`),
 *      es mostra eixa referència mentre dure la conversa.
 */
export function resolReferenciaDeLaConversa(fil, referenciaEntrada = null) {
  if (!fil) return null;
  if (fil.subjecte && !fil.comunitatId && !fil.esComunitat && !esXatDeLaIAIA(fil)) {
    const desDelFil = normalitzaDescriptor({
      tipus: fil.subjecte.tipus,
      id: fil.subjecte.id,
      titol: fil.subjecte.titol || fil.title || fil.name || '',
      ruta: fil.subjecte.ruta || ''
    });
    if (desDelFil) return desDelFil;
  }
  return referenciaEntrada || null;
}
