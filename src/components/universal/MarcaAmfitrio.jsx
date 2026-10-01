import { ChevronRight, X } from 'lucide-react';
import { NavLink } from '../../app/contexts/RouterContext';
import { getEfimer, setEfimer } from '../../config/storage.js';
import { PilotConnexio } from './connexio/PilotConnexio.jsx';
import { estatValid } from './connexio/estatConnexio.js';

/**
 * MarcaAmfitrio.jsx — Enxufe universal, T2 (260929); franja del node, T7-T8 (261001).
 *
 * Quan un amfitrió declara el nom del poble (`nomPoble`: el canal
 * window.SocDePobleConfig, l'atribut nom-poble o la config de l'element), la
 * closca diu a la gent on és:
 *  - TitolAmfitrio: el nom a la barra negra, en escriptori (primer fill del
 *    header, darrere de la marca de la barra lateral).
 *  - FranjaAmfitrio: una franja davall de la barra negra, en compacte. Diu
 *    l'estat de la connexió amb el node (pilot i text), enllaça amb /fedivers
 *    i porta una X que l'amaga per a eixe node fins a la pròxima pestanya.
 * Qui tria l'una o l'altra és AppShell, per l'amplada del contenidor
 * (isCompact), no per media queries.
 *
 * Totes dues són presentacionals: cap hook de proveïdor (el catàleg les munta
 * sense UIProvider). Els textos arriben per props, ja traduïts.
 * El nom ve de l'amfitrió: només text pla de React, mai innerHTML. Sense nom
 * no es pinta cap node (socdepoble.org i el standalone no canvien ni un píxel).
 */

/** On porta la franja: la pàgina que explica què és un node. */
export const RUTA_FEDIVERS = '/fedivers';

/**
 * La frase de la franja a la llengua activa, segons l'estat de la connexió
 * (estatConnexio.js). Zero mentides belles: només el verd diu «Connectat».
 * Una crida t() per estat amb el valencià de reserva literal
 * (i18n.claus.test.js el busca tal qual en este fitxer). `traductor` és el
 * d'UIContext; sense, la reserva.
 */
export function textDelNode(traductor, nomPoble, estat) {
  const t = typeof traductor === 'function' ? traductor : (_clau, reserva) => reserva;
  const valid = estatValid(estat);
  let plantilla;
  if (valid === 'connectat') plantilla = t('amfitrio.node', 'Connectat al node de {nom}');
  else if (valid === 'connectant') plantilla = t('amfitrio.nodeConnectant', 'Connectant amb el node de {nom}…');
  else plantilla = t('amfitrio.nodeSenseConnexio', 'Sense connexió amb el node de {nom}');
  // Substitució amb funció: un «$&» o «$1» dins del nom no es reinterpreta.
  return String(plantilla).replace('{nom}', () => nomPoble);
}

/** Els dos noms accessibles de la franja: el de l'enllaç i el de la X. */
export function etiquetesDeLaFranja(traductor) {
  const t = typeof traductor === 'function' ? traductor : (_clau, reserva) => reserva;
  return {
    mesInfo: t('amfitrio.mesInfo', 'Què és un node?'),
    tanca: t('amfitrio.tanca', 'Tancar l’avís del node')
  };
}

/* La X es recorda per pestanya (sessionStorage), només a través de
   storage.js: es desa com a sdp_embed_amfitrio-franja-tancada. Es guarda el
   nom del node: si l'amfitrió en declara un altre, la franja torna a eixir. */
export const CLAU_FRANJA_TANCADA = 'amfitrio-franja-tancada';
const VERSIO_FRANJA = 1;

/** El node per al qual la franja s'ha tancat en esta pestanya, o null. */
export function franjaTancadaPer() {
  const desat = getEfimer(CLAU_FRANJA_TANCADA);
  return desat && typeof desat === 'object' && desat.v === VERSIO_FRANJA && typeof desat.nom === 'string'
    ? desat.nom
    : null;
}

/** Recorda la X per a este node. Torna true només si ha quedat escrit. */
export function desaFranjaTancada(nom) {
  if (typeof nom !== 'string' || !nom) return false;
  return setEfimer(CLAU_FRANJA_TANCADA, { v: VERSIO_FRANJA, nom });
}

export function TitolAmfitrio({ nomPoble }) {
  if (!nomPoble) return null;
  return (
    <p className="sdp-amfitrio-titol"><span aria-hidden="true">|</span> {nomPoble}</p>
  );
}

/**
 * Dos germans, mai un botó dins d'un enllaç: l'enllaç (NavLink, perquè a
 * /fedivers porte aria-current) amb el pilot, la frase, «Què és un node?»
 * només per al lector i la fletxa; i, si hi ha onTanca, la X.
 */
export function FranjaAmfitrio({ nomPoble, text, estat, ruta = RUTA_FEDIVERS, etiquetaRuta, etiquetaTanca, onTanca }) {
  if (!nomPoble || !text) return null;
  return (
    <div className="sdp-amfitrio-franja">
      <NavLink to={ruta} className="sdp-amfitrio-franja__enllac">
        <PilotConnexio estat={estat} />
        <span className="sdp-amfitrio-franja__text">{text}</span>
        {etiquetaRuta ? <>{' '}<span className="sr-only">{etiquetaRuta}</span></> : null}
        <ChevronRight aria-hidden="true" focusable="false" size={18} />
      </NavLink>
      {onTanca ? (
        <button type="button" className="sdp-amfitrio-franja__tanca" aria-label={etiquetaTanca} onClick={onTanca}>
          <X aria-hidden="true" focusable="false" size={20} />
        </button>
      ) : null}
    </div>
  );
}
