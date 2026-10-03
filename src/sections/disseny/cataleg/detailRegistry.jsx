import { getPreferenciaLlegat, setPreferenciaLlegat } from '../../../config/storage.js';
import { lazy } from 'react';

function ambReintent(importer) {
  return lazy(async () => {
    let pageHasAlreadyBeenForceRefreshed = false;
    try {
      pageHasAlreadyBeenForceRefreshed = JSON.parse(
        getPreferenciaLlegat('sdp-chunk-refreshed', null, true) || 'false'
      );
    } catch (e) {
      console.warn("[ambReintent] No s'ha pogut llegir sessionStorage:", e);
    }

    try {
      const component = await importer();
      try { setPreferenciaLlegat('sdp-chunk-refreshed', 'false', true); } catch { /* silenci */ }
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        try { setPreferenciaLlegat('sdp-chunk-refreshed', 'true', true); } catch { /* silenci */ }
        window.location.reload();
        return new Promise(() => {}); // never resolves, page is reloading
      }
      throw error;
    }
  });
}

export const CATALOG_DETAIL_LOADERS = {
  'fonaments/contracte': ambReintent(() => import('./detalls/EspecimenContracte.jsx')),
  'fonaments/color': ambReintent(() => import('./detalls/EspecimenColor.jsx')),
  'fonaments/tipografia': ambReintent(() => import('./detalls/EspecimenTipografia.jsx')),
  'fonaments/espaiat': ambReintent(() => import('./detalls/EspecimenEspaiat.jsx')),
  'fonaments/universalcard': ambReintent(() => import('./detalls/EspecimenUniversalCard.jsx')),
  /* T50 (decisió del Mestre, 260928) · la targeta del document que s'escriu. */
  'fonaments/targeta-viva': ambReintent(() => import('./detalls/EspecimenTargetaViva.jsx')),
  'fonaments/controls-barra': ambReintent(() => import('./detalls/EspecimenControlsBarra.jsx')),
  /* T51 (ordre del Mestre, 260928) · l'espai central de la barra taronja. */
  'fonaments/emoticona-barra': ambReintent(() => import('./detalls/EspecimenEmoticonaBarra.jsx')),
  'fonaments/avatar': ambReintent(() => import('./detalls/EspecimenAvatar.jsx')),
  'fonaments/botonera': ambReintent(() => import('./detalls/EspecimenBotonera.jsx')),
  'fonaments/taula': ambReintent(() => import('./detalls/EspecimenTaula.jsx')),
  'fonaments/indicador': ambReintent(() => import('./detalls/EspecimenIndicador.jsx')),
  'fonaments/xat': ambReintent(() => import('./detalls/EspecimenXat.jsx')),
  /* Onada 3B (Pedra Seca §9) · les peces noves del Xat. */
  'fonaments/xat-llista': ambReintent(() => import('./detalls/EspecimenXatLlista.jsx')),
  'fonaments/xat-cerca': ambReintent(() => import('./detalls/EspecimenXatCerca.jsx')),
  'fonaments/xat-comunitats': ambReintent(() => import('./detalls/EspecimenXatComunitats.jsx')),
  'superposicions/xat-nova-conversa': ambReintent(() => import('./detalls/EspecimenXatNovaConversa.jsx')),
  /* Torn 260930 (T1) · el full «Ajustos» del Xat. */
  'superposicions/xat-ajustos': ambReintent(() => import('./detalls/EspecimenXatAjustos.jsx')),
  'navegacio/xat-rail': ambReintent(() => import('./detalls/EspecimenXatRail.jsx')),
  'fonaments/cerca-filtres': ambReintent(() => import('./detalls/EspecimenCercaFiltres.jsx')),
  'fonaments/tasques-fitxers': ambReintent(() => import('./detalls/EspecimenTasquesFitxers.jsx')),
  'fonaments/media-externa': ambReintent(() => import('./detalls/EspecimenMediaExterna.jsx')),
  'fonaments/utilitats': ambReintent(() => import('./detalls/EspecimenUtilitats.jsx')),
  'inventari/global': ambReintent(() => import('./detalls/EspecimenInventariGlobal.jsx')),
  /* T52 (ordre del Mestre, 260928) · l'arbre universal va primer: diu qui és el pare de qui. */
  'estructura/arbre': ambReintent(() => import('./detalls/EspecimenArbreUniversal.jsx')),
  'estructura/shell': ambReintent(() => import('./detalls/EspecimenShell.jsx')),
  'estructura/page': ambReintent(() => import('./detalls/EspecimenPage.jsx')),
  'estructura/gestor': ambReintent(() => import('./detalls/EspecimenGestor.jsx')),
  'estructura/universalworkspace': ambReintent(() => import('./detalls/EspecimenUniversalWorkspace.jsx')),
  'estructura/columnes': ambReintent(() => import('./detalls/EspecimenColumnes.jsx')),
  'estructura/divisor': ambReintent(() => import('./detalls/EspecimenDivisor.jsx')),
  'estructura/composicio': ambReintent(() => import('./detalls/EspecimenComposicio.jsx')),
  'estructura/barra-eines': ambReintent(() => import('./detalls/EspecimenBarraEines.jsx')),
  'formularis/boto': ambReintent(() => import('./detalls/EspecimenBoto.jsx')),
  'formularis/camp': ambReintent(() => import('./detalls/EspecimenCamp.jsx')),
  'formularis/opcions': ambReintent(() => import('./detalls/EspecimenOpcions.jsx')),
  'formularis/pindola': ambReintent(() => import('./detalls/EspecimenPindola.jsx')),
  'formularis/cerca': ambReintent(() => import('./detalls/EspecimenCerca.jsx')),
  'formularis/formulari-complex': ambReintent(() => import('./detalls/EspecimenFormulariComplex.jsx')),
  /* T40 (ordre del Mestre, 260928) · el mes compartit Consola–editor i la pastilla de data. */
  'formularis/calendari': ambReintent(() => import('./detalls/EspecimenCalendari.jsx')),
  /* T39 (ordre del Mestre, 260928) · drets d'autor a pantalla completa dins de l'editor. */
  'formularis/drets-autor': ambReintent(() => import('./detalls/EspecimenDretsAutor.jsx')),
  /* T52 (ordre del Mestre, 260928) · la botonera de davall del títol i els seus diàlegs. */
  'formularis/classificacio': ambReintent(() => import('./detalls/EspecimenClassificacio.jsx')),
  'navegacio/pestanyes': ambReintent(() => import('./detalls/EspecimenPestanyes.jsx')),
  'navegacio/molla': ambReintent(() => import('./detalls/EspecimenMolla.jsx')),
  'navegacio/paginacio': ambReintent(() => import('./detalls/EspecimenPaginacio.jsx')),
  'navegacio/acordio': ambReintent(() => import('./detalls/EspecimenAcordio.jsx')),
  'navegacio/nav-mobil': ambReintent(() => import('./detalls/EspecimenNavMobil.jsx')),
  'retroalimentacio/alerta': ambReintent(() => import('./detalls/EspecimenAlerta.jsx')),
  'retroalimentacio/insignia': ambReintent(() => import('./detalls/EspecimenInsignia.jsx')),
  'retroalimentacio/buit': ambReintent(() => import('./detalls/EspecimenBuit.jsx')),
  'retroalimentacio/carrega': ambReintent(() => import('./detalls/EspecimenCarrega.jsx')),
  'retroalimentacio/progres': ambReintent(() => import('./detalls/EspecimenProgres.jsx')),
  'retroalimentacio/estat-desament': ambReintent(() => import('./detalls/EspecimenEstatDesament.jsx')),
  'retroalimentacio/resum-connexio': ambReintent(() => import('./detalls/EspecimenResumConnexio.jsx')),
  /* T7-T9 (ordre del Mestre, 261001) · el pilot de connexió i la llista de nodes. */
  'retroalimentacio/connexio': ambReintent(() => import('./detalls/EspecimenConnexio.jsx')),
  /* T43 (ordre del Mestre, 260928) · identitat activa i administrar organitzacions. */
  'fonaments/identitat': ambReintent(() => import('./detalls/EspecimenIdentitat.jsx')),
  'superposicions/dialeg': ambReintent(() => import('./detalls/EspecimenDialeg.jsx')),
  'superposicions/confirmacio': ambReintent(() => import('./detalls/EspecimenConfirmacio.jsx')),
  'superposicions/calaix': ambReintent(() => import('./detalls/EspecimenCalaix.jsx')),
  /* Ordre del Mestre, 261001 · el Calendari a pantalla completa. */
  'superposicions/pantalla-completa': ambReintent(() => import('./detalls/EspecimenPantallaCompleta.jsx')),
  'superposicions/pista': ambReintent(() => import('./detalls/EspecimenPista.jsx')),
  'superposicions/menu': ambReintent(() => import('./detalls/EspecimenMenu.jsx')),
  /* T41 (ordre del Mestre, 260928) · pública o privada, amb avís. */
  'superposicions/visibilitat': ambReintent(() => import('./detalls/EspecimenSelectorVisibilitat.jsx')),
  'superposicions/toast': ambReintent(() => import('./detalls/EspecimenToast.jsx')),
  /* T46 (ordre del Mestre, 260928) · re-enquadrar la capçalera, quadrat de sèrie. */
  'superposicions/enquadrament': ambReintent(() => import('./detalls/EspecimenEnquadrament.jsx')),
  /* T52 (ordre del Mestre, 260928) · la vista A4 de l'editor. */
  'superposicions/impressio': ambReintent(() => import('./detalls/EspecimenImpressio.jsx')),
  /* Fase 0 de les apps El Bar i Salut (Pedra Seca §9) · les peces genèriques noves. */
  'formularis/rajola': ambReintent(() => import('./detalls/EspecimenRajola.jsx')),
  'formularis/teclat-numeric': ambReintent(() => import('./detalls/EspecimenTeclatNumeric.jsx')),
  'fonaments/linia-del-temps': ambReintent(() => import('./detalls/EspecimenLiniaDelTemps.jsx')),
  'fonaments/histograma': ambReintent(() => import('./detalls/EspecimenHistograma.jsx')),
  /* Ordre del Mestre (261002, sinergies T4/T8) · l'esquelet comú de catàleg i col·lecció. */
  'fonaments/articles': ambReintent(() => import('./detalls/EspecimenArticles.jsx')),
  'navegacio/seccions-categoria': ambReintent(() => import('./detalls/EspecimenSeccionsCategoria.jsx')),
  'fonaments/colleccio': ambReintent(() => import('./detalls/EspecimenColleccio.jsx')),
  'formularis/afegit-rapid': ambReintent(() => import('./detalls/EspecimenAfegitRapid.jsx')),
  'superposicions/detall-article': ambReintent(() => import('./detalls/EspecimenDetallArticle.jsx')),
  'estructura/marc-columna': ambReintent(() => import('./detalls/EspecimenMarcColumna.jsx')),
  'estructura/esquelet-bar': ambReintent(() => import('./detalls/EspecimenEsqueletBar.jsx')),
  'estructura/esquelet-compra': ambReintent(() => import('./detalls/EspecimenEsqueletCompra.jsx')),
  /* Ordre del Mestre (261003, tancament del Lector RSS) · l'excepció 16:9, només per al Lector. */
  'fonaments/imatge-apaisada': ambReintent(() => import('./detalls/EspecimenImatgeApaisada.jsx')),
};
