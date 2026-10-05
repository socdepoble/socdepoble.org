import { lazyRoute } from '../../../apps/plataforma/lazyRoute.js';

export const CATALOG_DETAIL_LOADERS = {
  'emoticones/xl': lazyRoute(() => import('./detalls/EspecimenEmojisXL.jsx')),
  'fonaments/panell': lazyRoute(() => import('./detalls/EspecimenPanell.jsx')),
  'fonaments/contracte': lazyRoute(() => import('./detalls/EspecimenContracte.jsx')),
  'fonaments/color': lazyRoute(() => import('./detalls/EspecimenColor.jsx')),
  'fonaments/tipografia': lazyRoute(() => import('./detalls/EspecimenTipografia.jsx')),
  'fonaments/espaiat': lazyRoute(() => import('./detalls/EspecimenEspaiat.jsx')),
  'fonaments/universalcard': lazyRoute(() => import('./detalls/EspecimenUniversalCard.jsx')),
  /* T50 (decisió del Mestre, 260928) · la targeta del document que s'escriu. */
  'fonaments/targeta-viva': lazyRoute(() => import('./detalls/EspecimenTargetaViva.jsx')),
  'fonaments/controls-barra': lazyRoute(() => import('./detalls/EspecimenControlsBarra.jsx')),
  /* T51 (ordre del Mestre, 260928) · l'espai central de la barra taronja. */
  'fonaments/emoticona-barra': lazyRoute(() => import('./detalls/EspecimenEmoticonaBarra.jsx')),
  'fonaments/avatar': lazyRoute(() => import('./detalls/EspecimenAvatar.jsx')),
  'fonaments/botonera': lazyRoute(() => import('./detalls/EspecimenBotonera.jsx')),
  'fonaments/taula': lazyRoute(() => import('./detalls/EspecimenTaula.jsx')),
  'fonaments/indicador': lazyRoute(() => import('./detalls/EspecimenIndicador.jsx')),
  'fonaments/xat': lazyRoute(() => import('./detalls/EspecimenXat.jsx')),
  /* Onada 3B (Pedra Seca §9) · les peces noves del Xat. */
  'fonaments/xat-llista': lazyRoute(() => import('./detalls/EspecimenXatLlista.jsx')),
  'fonaments/xat-cerca': lazyRoute(() => import('./detalls/EspecimenXatCerca.jsx')),
  'fonaments/xat-comunitats': lazyRoute(() => import('./detalls/EspecimenXatComunitats.jsx')),
  'superposicions/xat-nova-conversa': lazyRoute(() => import('./detalls/EspecimenXatNovaConversa.jsx')),
  /* Torn 260930 (T1) · el full «Ajustos» del Xat. */
  'superposicions/xat-ajustos': lazyRoute(() => import('./detalls/EspecimenXatAjustos.jsx')),
  'navegacio/xat-rail': lazyRoute(() => import('./detalls/EspecimenXatRail.jsx')),
  'fonaments/cerca-filtres': lazyRoute(() => import('./detalls/EspecimenCercaFiltres.jsx')),
  'fonaments/tasques-fitxers': lazyRoute(() => import('./detalls/EspecimenTasquesFitxers.jsx')),
  'fonaments/media-externa': lazyRoute(() => import('./detalls/EspecimenMediaExterna.jsx')),
  'fonaments/utilitats': lazyRoute(() => import('./detalls/EspecimenUtilitats.jsx')),
  'inventari/global': lazyRoute(() => import('./detalls/EspecimenInventariGlobal.jsx')),
  /* T52 (ordre del Mestre, 260928) · l'arbre universal va primer: diu qui és el pare de qui. */
  'estructura/arbre': lazyRoute(() => import('./detalls/EspecimenArbreUniversal.jsx')),
  'estructura/shell': lazyRoute(() => import('./detalls/EspecimenShell.jsx')),
  'estructura/page': lazyRoute(() => import('./detalls/EspecimenPage.jsx')),
  'estructura/gestor': lazyRoute(() => import('./detalls/EspecimenGestor.jsx')),
  'estructura/universalworkspace': lazyRoute(() => import('./detalls/EspecimenUniversalWorkspace.jsx')),
  'estructura/columnes': lazyRoute(() => import('./detalls/EspecimenColumnes.jsx')),
  'estructura/divisor': lazyRoute(() => import('./detalls/EspecimenDivisor.jsx')),
  'estructura/composicio': lazyRoute(() => import('./detalls/EspecimenComposicio.jsx')),
  'estructura/barra-eines': lazyRoute(() => import('./detalls/EspecimenBarraEines.jsx')),
  'formularis/boto': lazyRoute(() => import('./detalls/EspecimenBoto.jsx')),
  'formularis/camp': lazyRoute(() => import('./detalls/EspecimenCamp.jsx')),
  'formularis/opcions': lazyRoute(() => import('./detalls/EspecimenOpcions.jsx')),
  'formularis/pindola': lazyRoute(() => import('./detalls/EspecimenPindola.jsx')),
  'formularis/cerca': lazyRoute(() => import('./detalls/EspecimenCerca.jsx')),
  'formularis/formulari-complex': lazyRoute(() => import('./detalls/EspecimenFormulariComplex.jsx')),
  /* T40 (ordre del Mestre, 260928) · el mes compartit Consola–editor i la pastilla de data. */
  'formularis/calendari': lazyRoute(() => import('./detalls/EspecimenCalendari.jsx')),
  /* T39 (ordre del Mestre, 260928) · drets d'autor a pantalla completa dins de l'editor. */
  'formularis/drets-autor': lazyRoute(() => import('./detalls/EspecimenDretsAutor.jsx')),
  /* T52 (ordre del Mestre, 260928) · la botonera de davall del títol i els seus diàlegs. */
  'formularis/classificacio': lazyRoute(() => import('./detalls/EspecimenClassificacio.jsx')),
  'navegacio/pestanyes': lazyRoute(() => import('./detalls/EspecimenPestanyes.jsx')),
  'navegacio/molla': lazyRoute(() => import('./detalls/EspecimenMolla.jsx')),
  'navegacio/paginacio': lazyRoute(() => import('./detalls/EspecimenPaginacio.jsx')),
  'navegacio/acordio': lazyRoute(() => import('./detalls/EspecimenAcordio.jsx')),
  'navegacio/nav-mobil': lazyRoute(() => import('./detalls/EspecimenNavMobil.jsx')),
  'retroalimentacio/alerta': lazyRoute(() => import('./detalls/EspecimenAlerta.jsx')),
  'retroalimentacio/insignia': lazyRoute(() => import('./detalls/EspecimenInsignia.jsx')),
  'retroalimentacio/buit': lazyRoute(() => import('./detalls/EspecimenBuit.jsx')),
  'retroalimentacio/carrega': lazyRoute(() => import('./detalls/EspecimenCarrega.jsx')),
  'retroalimentacio/progres': lazyRoute(() => import('./detalls/EspecimenProgres.jsx')),
  'retroalimentacio/estat-desament': lazyRoute(() => import('./detalls/EspecimenEstatDesament.jsx')),
  'retroalimentacio/resum-connexio': lazyRoute(() => import('./detalls/EspecimenResumConnexio.jsx')),
  /* T7-T9 (ordre del Mestre, 261001) · el pilot de connexió i la llista de nodes. */
  'retroalimentacio/connexio': lazyRoute(() => import('./detalls/EspecimenConnexio.jsx')),
  /* T43 (ordre del Mestre, 260928) · identitat activa i administrar organitzacions. */
  'fonaments/identitat': lazyRoute(() => import('./detalls/EspecimenIdentitat.jsx')),
  'superposicions/dialeg': lazyRoute(() => import('./detalls/EspecimenDialeg.jsx')),
  'superposicions/confirmacio': lazyRoute(() => import('./detalls/EspecimenConfirmacio.jsx')),
  'superposicions/calaix': lazyRoute(() => import('./detalls/EspecimenCalaix.jsx')),
  /* Ordre del Mestre, 261001 · el Calendari a pantalla completa. */
  'superposicions/pantalla-completa': lazyRoute(() => import('./detalls/EspecimenPantallaCompleta.jsx')),
  'superposicions/pista': lazyRoute(() => import('./detalls/EspecimenPista.jsx')),
  'superposicions/menu': lazyRoute(() => import('./detalls/EspecimenMenu.jsx')),
  /* T41 (ordre del Mestre, 260928) · pública o privada, amb avís. */
  'superposicions/visibilitat': lazyRoute(() => import('./detalls/EspecimenSelectorVisibilitat.jsx')),
  'superposicions/toast': lazyRoute(() => import('./detalls/EspecimenToast.jsx')),
  /* T46 (ordre del Mestre, 260928) · re-enquadrar la capçalera, quadrat de sèrie. */
  'superposicions/enquadrament': lazyRoute(() => import('./detalls/EspecimenEnquadrament.jsx')),
  /* T52 (ordre del Mestre, 260928) · la vista A4 de l'editor. */
  'superposicions/impressio': lazyRoute(() => import('./detalls/EspecimenImpressio.jsx')),
  /* Fase 0 de les apps El Bar i Salut (Pedra Seca §9) · les peces genèriques noves. */
  'formularis/rajola': lazyRoute(() => import('./detalls/EspecimenRajola.jsx')),
  'formularis/teclat-numeric': lazyRoute(() => import('./detalls/EspecimenTeclatNumeric.jsx')),
  'fonaments/linia-del-temps': lazyRoute(() => import('./detalls/EspecimenLiniaDelTemps.jsx')),
  'fonaments/histograma': lazyRoute(() => import('./detalls/EspecimenHistograma.jsx')),
  /* Ordre del Mestre (261002, sinergies T4/T8) · l'esquelet comú de catàleg i col·lecció. */
  'fonaments/articles': lazyRoute(() => import('./detalls/EspecimenArticles.jsx')),
  'navegacio/seccions-categoria': lazyRoute(() => import('./detalls/EspecimenSeccionsCategoria.jsx')),
  'fonaments/colleccio': lazyRoute(() => import('./detalls/EspecimenColleccio.jsx')),
  'formularis/afegit-rapid': lazyRoute(() => import('./detalls/EspecimenAfegitRapid.jsx')),
  'superposicions/detall-article': lazyRoute(() => import('./detalls/EspecimenDetallArticle.jsx')),
  'estructura/marc-columna': lazyRoute(() => import('./detalls/EspecimenMarcColumna.jsx')),
  'estructura/esquelet-bar': lazyRoute(() => import('./detalls/EspecimenEsqueletBar.jsx')),
  'estructura/esquelet-compra': lazyRoute(() => import('./detalls/EspecimenEsqueletCompra.jsx')),
  /* Ordre del Mestre (261003, tancament del Lector RSS) · l'excepció 16:9, només per al Lector. */
  'fonaments/imatge-apaisada': lazyRoute(() => import('./detalls/EspecimenImatgeApaisada.jsx')),
  /* Ordre del Mestre, 261004 (prompt 261004_0515; D-A) · la graella de targetes i la pàgina de les apps. */
  'fonaments/graella-targetes': lazyRoute(() => import('./detalls/EspecimenGraellaTargetes.jsx')),
  'estructura/pagina-app': lazyRoute(() => import('./detalls/EspecimenPaginaApp.jsx')),
};
