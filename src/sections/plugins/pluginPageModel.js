/**
 * pluginPageModel.js — Constants de traducció i mapa de motius de l'estat sense
 * destí de cada plugin (separades de PluginPage.jsx per garantir puresa Fast Refresh / HMR).
 */

/* Gauntlet 261022_0225 (F1, F7) · Els textos de l'estat sense destí,
   traduïbles (el valencià és la reserva), en paraules de qualsevol veí. Un
   sol parell de verbs a tota la plataforma: «desactivar» i «tornar a
   activar» (el mateix del motiu 'persona-apagada', PortalApps.jsx). */
export const TEXTOS_EINA = Object.freeze({
  desactiva: Object.freeze(['section.plugin.eina.desactiva', 'Desactiva esta eina']),
  reactiva: Object.freeze(['section.plugin.eina.reactiva', 'Torna a activar esta eina']),
  notaActiva: Object.freeze(['section.plugin.eina.notaActiva', 'Desactivar-la només la trau del teu Panell, en este navegador. No s’esborra res del que hi tingues.']),
  notaDesactivada: Object.freeze(['section.plugin.eina.notaDesactivada', 'Està desactivada per a tu, només en este navegador. Si la tornes a activar, tornarà al teu Panell.']),
  notaApagada: Object.freeze(['section.plugin.eina.notaApagada', 'L’has desactivada a la llista d’eines, només en este navegador. Si la tornes a activar, la podràs tornar a obrir ací quan esta web la tinga.']),
  camiPosar: Object.freeze(['section.plugin.eina.camiPosar', 'Tu no has d’instal·lar ni baixar res. Esta eina només la pot afegir qui porta esta web, quan estiga a punt. Llavors, ací mateix tindràs el botó per a obrir-la.']),
  camiDemanar: Object.freeze(['section.plugin.eina.camiDemanar', 'Tu no has d’instal·lar ni pagar res. Només la pot posar en marxa qui porta esta web: si la vols fer servir, demana-li-ho.']),
  errorDesa: Object.freeze(['section.plugin.eina.errorDesa', 'No s’ha pogut guardar el canvi. Torna-ho a provar.'])
});

/* El camí que li queda a la persona, segons el motiu de la plataforma
   (interruptors.js). Cap instal·lació: hui no n'hi ha cap mecanisme. */
export const CAMI_DEL_MOTIU = Object.freeze({
  'no-compilada': TEXTOS_EINA.camiPosar,
  'entorn-desenvolupament': TEXTOS_EINA.camiPosar,
  'amfitrio-no-la-declara': TEXTOS_EINA.camiDemanar,
  'apagada-per-defecte': TEXTOS_EINA.camiDemanar,
  'sense-capacitat': TEXTOS_EINA.camiDemanar
});
