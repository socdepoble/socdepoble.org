/**
 * xatSocDePoble.js — Ordre del Mestre (261007) · «Comentaris = xat» · El xat
 * PRIVAT amb Sóc de Poble: el missatge directe amb l'entitat, que és l'opció
 * «En privat» del menú de Comentar de totes les targetes i de totes les
 * barres (useAccions).
 *
 * Es resol UNA sola vegada per a tota l'app, i només quan algú el tria: ho
 * fa ProveidorXatSocDePoble (sections/control/xatCorporatiu.js), muntat una
 * vegada a App.jsx, i ací només hi ha el context i la seua lectura. Un hook
 * amb un efecte per instància (el derogat useXatCorporatiu), cridat per
 * targeta o per llista, en remot faria una consulta al port per cada una.
 * Esta peça no importa res de sections/: la llig useAccions, que és de Pedra
 * Seca.
 *
 * El valor és { estat, href, avis, resol }:
 *  · href · l'enllaç del xat (/xat?amb=<id>, amb l'id que ha tornat el port)
 *    o null mentre no n'hi ha cap (pendent, resolent, absent, error).
 *  · avis · el text, ja traduït, que diu per què encara no hi porta
 *    (AVISOS_XAT_CORPORATIU), o null quan hi porta.
 *  · resol · null, o la funció que el demana (una promesa de { estat, href,
 *    avis, darrera }) quan encara es pot resoldre: en remot, abans del primer
 *    «En privat», mentre es resol, després d'un error o després d'un «absent»
 *    que ha dit el port (M4-01: torna a cridar el port passada l'espera de
 *    navigation.js; abans, la mateixa resposta). `darrera` diu si la
 *    demanda continua sent l'última de l'app quan arriba la resposta (C6).
 * Sense proveïdor (una peça muntada sola, un espècimen del catàleg, una
 * prova) es comporta com en llavor: el xat de l'entitat pilot del padró,
 * /xat?amb=socdepoble, sense cap crida al port.
 *
 * Qui n'ha de saber l'estat sense esperar cap clic (l'Alerta del Panell, que
 * diu si el xat no està disponible) fa servir useXatSocDePobleResolt: la
 * mateixa resolució del proveïdor, demanada en muntar.
 */
import { createContext, useContext, useEffect } from 'react';
import { ENTITAT_PILOT_ID } from '../../../data/identitatsSeed.js';

/** El xat de la llavor. Correcció C10 (revisió R2) · La font única del seu
    enllaç: XAT_DE_LLAVOR (xatCorporatiu.js) en deriva, i la segona font
    (destinsControl.XAT_SOCDEPOBLE) s'ha retirat. */
export const XAT_SOCDEPOBLE_DE_LLAVOR = Object.freeze({
  estat: 'llavor',
  href: `/xat?amb=${encodeURIComponent(ENTITAT_PILOT_ID)}`,
  avis: null,
  resol: null
});

/** null sense proveïdor: useXatSocDePoble hi posa el de la llavor. */
export const XatSocDePobleContext = createContext(null);

/** { estat, href, avis } del xat privat amb Sóc de Poble. */
export function useXatSocDePoble() {
  return useContext(XatSocDePobleContext) ?? XAT_SOCDEPOBLE_DE_LLAVOR;
}

/**
 * Ordre del Mestre (261007) · El mateix xat, demanat en muntar: per a qui en
 * vol l'estat abans de cap «En privat» (l'Alerta del Panell). Demana la
 * resolució del proveïdor, la MATEIXA per a tota l'app, i només mentre
 * encara no s'ha demanat ('pendent'): si ja es resol, o ja s'ha resolt, no
 * en demana cap altra. Un error no es torna a demanar sol (cap bucle): ho
 * torna a provar el clic següent a «En privat». En llavor, o sense
 * proveïdor, no hi ha res a demanar.
 */
export function useXatSocDePobleResolt() {
  const xat = useXatSocDePoble();
  const { estat, resol } = xat;
  useEffect(() => {
    if (estat === 'pendent' && typeof resol === 'function') resol();
  }, [estat, resol]);
  return xat;
}
