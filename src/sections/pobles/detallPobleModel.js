/**
 * detallPobleModel.js — Funcions pures i descàrrega del paquet Open Data d'un
 * poble (separades de DetallPoble.jsx per garantir puresa Fast Refresh / HMR).
 */

export const senseTraductorDetallPoble = (_clau, reserva) => reserva;

/* T2 · D04/D10 (assalt 261101) · El resum del paquet descarregat, col·lecció a
   col·lecció, amb els recomptes i els pendents de veres (paquet.comptes i
   paquet.pendents de exportaMunicipiOpenData). Parells [clau, reserva]
   literals: i18n.usades.test.js els troba. */
export const COLECCIONS_DEL_RESUM = Object.freeze([
  ['noticies', ['section.detail.pobles.opendata.coleccio.noticies', 'Notícies']],
  ['agenda', ['section.detail.pobles.opendata.coleccio.agenda', 'Agenda']],
  ['directori', ['section.detail.pobles.opendata.coleccio.directori', 'Entitats']],
  ['memoria', ['section.detail.pobles.opendata.coleccio.memoria', 'Memòria cultural']],
  ['memoriaOral', ['section.detail.pobles.opendata.coleccio.memoriaOral', 'Memòria oral']]
]);

/** «Notícies: 2 · Agenda: 1 · … · Memòria oral: encara no s’exporta», o null si el paquet no porta recomptes. */
export function resumDelPaquet(paquet, t = senseTraductorDetallPoble) {
  const comptes = paquet?.comptes;
  if (!comptes || typeof comptes !== 'object') return null;
  const pendents = new Set(Array.isArray(paquet.pendents) ? paquet.pendents : []);
  const parts = COLECCIONS_DEL_RESUM
    .filter(([coleccio]) => pendents.has(coleccio) || Number.isSafeInteger(comptes[coleccio]))
    .map(([coleccio, [clau, reserva]]) => `${t(clau, reserva)}: ${pendents.has(coleccio)
      ? t('section.detail.pobles.opendata.pendent', 'encara no s’exporta') : comptes[coleccio]}`);
  return parts.length ? parts.join(' · ') : null;
}

export function descarregaPaquet(paquet) {
  const url = URL.createObjectURL(new Blob([paquet.zip], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = paquet.nomFitxer;
  a.rel = 'noopener';
  /* Enllaç despenjat (Llei 06), com descarregaPerDefecte de PanellGestoria.jsx:
     el clic no necessita penjar-lo del document. */
  try { a.click(); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
