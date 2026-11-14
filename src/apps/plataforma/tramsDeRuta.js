/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · Els
   trams segurs d'una ruta d'app (la Clàusula dels Slugs de rutesAplicacio.js),
   en una fulla sense imports: registreApps.js, que és de l'arrencada, només en
   vol tramsSegurs i, important-la de rutesAplicacio.js, arrossegava al tros
   d'entrada els hooks de les rutes de les apps (useRutaApp,
   useParametresConsulta) i el validador de rutes, que només fan servir les apps
   diferides. rutesAplicacio.js els reexporta amb els mateixos noms: cap altre
   importador no canvia. */

/** Id opac: minúscules, xifres, '-' i '_'; comença per lletra o xifra. */
export function esIdOpac(valor) {
  return typeof valor === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(valor);
}

/** Un tram qualsevol d'una ruta d'app: el que admeten tots els validadors. */
export function esSegmentSegur(valor) {
  return esIdOpac(valor);
}

/**
 * Trams d'una ruta crua (sense descodificar) dins de /app. Torna null si
 * algun tram no és segur: una barra doble (també a l'inici, '//bar'), '..',
 * '%2e', una majúscula… Només es lleva UNA barra inicial i UNA de final
 * ('/app/bar/' no compta com a tram); qualsevol altra barra deixa un tram buit.
 */
export function tramsSegurs(cami) {
  if (typeof cami !== 'string') return null;
  const senseInici = cami.startsWith('/') ? cami.slice(1) : cami;
  if (senseInici === '') return [];
  const net = senseInici.endsWith('/') ? senseInici.slice(0, -1) : senseInici;
  const trams = net.split('/');
  return trams.every(esSegmentSegur) ? trams : null;
}
