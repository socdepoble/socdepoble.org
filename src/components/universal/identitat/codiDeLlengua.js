/**
 * codiDeLlengua.js — La llengua del text que es pinta, deduïda del traductor.
 *
 * v1.2.23 · L5-05 (Gauntlet R1) · Font única per a la barra negra
 * (useIdentitatDeLaBarra.js) i la closca del Xat (ClosCaXat.jsx), que en tenia
 * una còpia (llenguaDeLAvis). És la llengua del text, no la demanada: si el
 * diccionari d'eixa llengua encara no ha arribat, el traductor torna el
 * valencià i l'avís d'eixida i el calaix també parlen valencià.
 */
export function codiDeLlengua(t) {
  if (typeof t !== 'function') return 'ca';
  const mostra = t('section.xat.ajustos.tancaSessio', 'Tanca la sessió');
  if (mostra === 'Cerrar sesión') return 'es';
  if (mostra === 'Log out') return 'en';
  if (mostra === 'Itxi saioa') return 'eu';
  if (mostra === 'Pechar sesión') return 'gl';
  return 'ca';
}
