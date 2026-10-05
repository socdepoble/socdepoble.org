/**
 * Plataforma d'Apps Enxufables · l'API pública per a les apps.
 *
 * Una app (src/apps/<id>/) només importa de la plataforma per ací. La resta
 * de fitxers de src/apps/plataforma/ són del nucli i poden canviar.
 *
 *   useApp()               · { manifest, base: '/app/<id>', ruta(...trams) }
 *   useInterruptorsApp()   · { avalua(id), actiu(id), apaga(id, apagat) }
 *   ClosaAplicacio         · l'esquelet comú de tres columnes (TPV, La Compra…):
 *                            una taula de rutes { path, params?, Esquerra?, Mig,
 *                            Detall, estret? } i les columnes ixen de la URL
 *   useClosaAplicacio()    · dins d'una columna: { mida, panellObert, obriPanell, tancaPanells }
 *   validaTaulaDeClosa     · la validació de la taula de ClosaAplicacio
 *   useParametresConsulta  · llig i escriu la consulta (push) amb validadors
 *   useRutaApp(rutes)      · la ruta interna que casa amb la URL, amb els paràmetres validats
 *   validaRutes, coincidixRuta, esSlug, esIdOpac, esData, esUuid, VALIDADORS
 *   ESDEVENIMENT_NAVEGA    · per a les apps externes (custom elements)
 *   ENTITAT_PROJECTE, autoriaDe(autor) · la boina d'autor de les targetes
 *                            d'una app ({ nom, poble, avatar, href }),
 *                            resolta per identificador (REGLA D'OR 1, 261004)
 */
export { useApp, useInterruptorsApp } from './PlataformaContext.jsx';
export { ClosaAplicacio, useClosaAplicacio, validaTaulaDeClosa } from './ClosaAplicacio.jsx';
export {
  PANELLS_ESTRET, VALIDADORS, coincidixRuta, esData, esIdOpac, esSegmentSegur, esSlug, esUuid,
  useParametresConsulta, useRutaApp, validaRutes
} from './rutesAplicacio.js';
export { ESDEVENIMENT_NAVEGA } from './ElementExtern.jsx';
export { ESQUEMA_APP, NOMS_ICONES, rutaDeApp, titolDe } from './manifestApp.js';
export { ENTITAT_PROJECTE, autoriaDe } from './autoria.js';

/* Loading delegates recovery to the enclosing route owner. */
export { lazyRoute } from './lazyRoute.js';
