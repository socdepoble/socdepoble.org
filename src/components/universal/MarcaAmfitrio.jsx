import { MapPin } from 'lucide-react';

/**
 * MarcaAmfitrio.jsx — Enxufe universal, T2 (260929).
 *
 * Quan un amfitrió declara el nom del poble (`nomPoble`: el canal
 * window.SocDePobleConfig, l'atribut nom-poble o la config de l'element), la
 * closca diu a la gent on és:
 *  - TitolAmfitrio: el nom a la barra negra, en escriptori (primer fill del
 *    header, darrere de la marca de la barra lateral).
 *  - FranjaAmfitrio: una franja davall de la barra negra, en compacte.
 * Qui tria l'una o l'altra és AppShell, per l'amplada del contenidor
 * (isCompact), no per media queries.
 *
 * El nom ve de l'amfitrió: només text pla de React, mai innerHTML. Sense nom
 * no es pinta cap node (socdepoble.org i el standalone no canvien ni un píxel).
 */

const PLANTILLA_SERVIDOR = 'Estàs al servidor de {nom}';

/** «Estàs al servidor de {nom}» a la llengua activa. `t` és el traductor d'UIContext. */
export function textDelServidor(t, nomPoble) {
  const plantilla = typeof t === 'function' ? t('amfitrio.servidor', PLANTILLA_SERVIDOR) : PLANTILLA_SERVIDOR;
  // Substitució amb funció: un «$&» o «$1» dins del nom no es reinterpreta.
  return String(plantilla).replace('{nom}', () => nomPoble);
}

export function TitolAmfitrio({ nomPoble }) {
  if (!nomPoble) return null;
  return (
    <p className="sdp-amfitrio-titol"><span aria-hidden="true">|</span> {nomPoble}</p>
  );
}

export function FranjaAmfitrio({ nomPoble, text }) {
  if (!nomPoble || !text) return null;
  return (
    <p className="sdp-amfitrio-franja"><MapPin aria-hidden="true" focusable="false" size={18} /> <span>{text}</span></p>
  );
}
