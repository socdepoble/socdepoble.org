import { lazy } from 'react';

function ambReintent(importer) {
  return lazy(async () => {
    let pageHasAlreadyBeenForceRefreshed = false;
    try {
      pageHasAlreadyBeenForceRefreshed = JSON.parse(
        window.sessionStorage.getItem('sdp-chunk-refreshed') || 'false'
      );
    } catch (e) {
      console.warn("[ambReintent] No s'ha pogut llegir sessionStorage:", e);
    }

    try {
      const component = await importer();
      try { window.sessionStorage.setItem('sdp-chunk-refreshed', 'false'); } catch { /* silenci */ }
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        try { window.sessionStorage.setItem('sdp-chunk-refreshed', 'true'); } catch { /* silenci */ }
        window.location.reload();
        return new Promise(() => {}); // never resolves, page is reloading
      }
      throw error;
    }
  });
}

export const CATALOG_DETAIL_LOADERS = {
  'fonaments/universalcard': ambReintent(() => import('./detalls/EspecimenUniversalCard.jsx')),
  'inventari/global': ambReintent(() => import('./detalls/EspecimenInventariGlobal.jsx')),
  'estructura/shell': ambReintent(() => import('./detalls/EspecimenShell.jsx')),
  'estructura/page': ambReintent(() => import('./detalls/EspecimenPage.jsx')),
  'estructura/gestor': ambReintent(() => import('./detalls/EspecimenGestor.jsx')),
  'estructura/divisor': ambReintent(() => import('./detalls/EspecimenDivisor.jsx')),
  'formularis/boto': ambReintent(() => import('./detalls/EspecimenBoto.jsx')),
  'formularis/camp': ambReintent(() => import('./detalls/EspecimenCamp.jsx')),
  'formularis/opcions': ambReintent(() => import('./detalls/EspecimenOpcions.jsx')),
  'formularis/pindola': ambReintent(() => import('./detalls/EspecimenPindola.jsx')),
  'formularis/cerca': ambReintent(() => import('./detalls/EspecimenCerca.jsx')),
  'formularis/formulari-complex': ambReintent(() => import('./detalls/EspecimenFormulariComplex.jsx')),
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
  'superposicions/dialeg': ambReintent(() => import('./detalls/EspecimenDialeg.jsx')),
  'superposicions/confirmacio': ambReintent(() => import('./detalls/EspecimenConfirmacio.jsx')),
  'superposicions/calaix': ambReintent(() => import('./detalls/EspecimenCalaix.jsx')),
  'superposicions/pista': ambReintent(() => import('./detalls/EspecimenPista.jsx')),
  'superposicions/menu': ambReintent(() => import('./detalls/EspecimenMenu.jsx')),
  'superposicions/toast': ambReintent(() => import('./detalls/EspecimenToast.jsx')),
};
