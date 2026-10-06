/**
 * Plataforma d'Apps Enxufables · l'API pública per a les apps.
 *
 * Una app (src/apps/<id>/) només importa de la plataforma per ací. La resta
 * de fitxers de src/apps/plataforma/ són del nucli i poden canviar.
 *
 * Res del que s'importa des d'ací arriba a cap app, ni pel registre ni pel
 * backend, ni a SessionContext ni a IdentitatContext (fronteres.test.js):
 * si hi arribava, desar una vista en desenvolupament tornava a carregar
 * contexts amb proveïdor ja muntat i l'app queia (correcció del 261006; el
 * perquè, a ContextApp.jsx i fontSessio.js).
 *
 *   useApp()               · { manifest, base: '/app/<id>', ruta(...trams) }
 *   useInterruptorsApp()   · { avalua(id), actiu(id), apaga(id, apagat) }
 *   ClosaAplicacio         · l'esquelet comú de tres columnes (TPV, La Compra…):
 *                            una taula de rutes { path, params?, Esquerra?, Mig,
 *                            Detall, estret? } i les columnes ixen de la URL;
 *                            o, en lloc de columnes, { path, params?, Unica }:
 *                            una sola àrea a tota la caixa (el TPV, 261006)
 *   useClosaAplicacio()    · dins d'una columna: { mida, panellObert, obriPanell, tancaPanells }
 *   useSessioApp()         · el pont de sessió, de només lectura: { estat, teSessio,
 *                            potEscriure, motiu, enLinia, modeProves,
 *                            marca: { nom, logotip, slug } | null, rutaEntrada };
 *                            mai el JWT ni l'usuari (261006). motiu: 'lliure',
 *                            'sessio', 'mode-proves', 'fora-de-linia' o
 *                            'comprovant-desada' (escriu); 'comprovant',
 *                            'sense-permis' o 'sense-sessio' (no)
 *   validaTaulaDeClosa     · la validació de la taula de ClosaAplicacio
 *   useParametresConsulta  · llig i escriu la consulta (push) amb validadors
 *   useRutaApp(rutes)      · la ruta interna que casa amb la URL, amb els paràmetres validats
 *   validaRutes, coincidixRuta, esSlug, esIdOpac, esData, esUuid, VALIDADORS
 *   ESDEVENIMENT_NAVEGA    · per a les apps externes (custom elements)
 *   ENTITAT_PROJECTE, autoriaDe(autor) · la boina d'autor de les targetes
 *                            d'una app ({ nom, poble, avatar, href }),
 *                            resolta per identificador (REGLA D'OR 1, 261004)
 */
export { useApp, useInterruptorsApp } from './ContextApp.jsx';
export { ClosaAplicacio, useClosaAplicacio, validaTaulaDeClosa } from './ClosaAplicacio.jsx';
export { useSessioApp } from './sessioApp.js';
export {
  PANELLS_ESTRET, VALIDADORS, coincidixRuta, esData, esIdOpac, esSegmentSegur, esSlug, esUuid,
  useParametresConsulta, useRutaApp, validaRutes
} from './rutesAplicacio.js';
export { ESDEVENIMENT_NAVEGA } from './ElementExtern.jsx';
export { ESQUEMA_APP, NOMS_ICONES, rutaDeApp, titolDe } from './manifestApp.js';
export { ENTITAT_PROJECTE, autoriaDe } from './autoria.js';

/* Loading delegates recovery to the enclosing route owner. */
export { lazyRoute } from './lazyRoute.js';
