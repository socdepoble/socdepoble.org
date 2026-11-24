/**
 * i18nRecuperacioRuta.jsx — Diccionari 5 llengües, adopció d'estils Pedra Seca
 * i preservació de context (ruta + desplaçament) per a l'auto-recuperació
 * amable d'un ChunkLoadError post-desplegament (R32.55 · R-RES-02).
 *
 * Es precarrega en repòs quan la pestanya ja està oberta (0 B a l'arrencada estàtica)
 * perquè continue disponible en memòria RAM encara que un desplegament posterior
 * retire els trossos antics del servidor.
 */
import { adoptaFullDiferit } from '../config/fullDiferit.js';
import { STORAGE_PREFIX, delEfimer, getEfimer, setEfimer } from '../config/storage.js';
import cssRecuperacioRuta from '../css/diferit-recuperacio-ruta.css?inline';

const CLAU_EFIMERA_RECUPERACIO_RUTA = 'recuperacio-ruta:context:v1';
export const CLAU_CONTEXT_RECUPERACIO_RUTA = `${STORAGE_PREFIX}${CLAU_EFIMERA_RECUPERACIO_RUTA}`;
export const FINESTRA_CONTEXT_RECUPERACIO_MS = 60000;

const adoptaEstilsRecuperacioRuta = (node) => {
  if (node) adoptaFullDiferit(node, 'recuperacio-ruta', cssRecuperacioRuta);
};

export const TEXTOS_RECUPERACIO_RUTA_CA = Object.freeze({
  titol: 'Hi ha hagut un problema',
  subtitolGeneral: 'Aquesta secció no ha pogut carregar-se correctament.',
  insigniaDeploy: 'Nova versió disponible o connexió interrompuda',
  explicacioDeploy: 'S’ha publicat una actualització mentre tenies esta pestanya oberta, o la xarxa s’ha tallat en carregar la secció. Es conservarà la ruta actual en actualitzar.',
  avisMemoria: 'Recarregar reinicia l’aplicació i descarta les dades que només viuen a la memòria. Desa o exporta el que necessites abans.',
  avisAllotjada: 'Torna a obrir el mòdul des de la pàgina que l’allotja.',
  avisSenseConnexio: 'Recupera la connexió abans de tornar a carregar.',
  etiquetaContext: 'Ruta conservada:',
  botoRecarrega: 'Recarrega l’aplicació',
  vistaContinuaFallant: 'La vista continua fallant. Pots obrir una altra secció amb el menú.',
  botoReintent: 'Intentar de nou',
});

export const TEXTOS_RECUPERACIO_RUTA = Object.freeze({
  ca: TEXTOS_RECUPERACIO_RUTA_CA,
  es: Object.freeze({
    titol: 'Ha habido un problema',
    subtitolGeneral: 'Esta sección no ha podido cargarse correctamente.',
    insigniaDeploy: 'Nueva versión disponible o conexión interrumpida',
    explicacioDeploy: 'Se ha publicado una actualización mientras tenías esta pestaña abierta, o se ha cortado la red al cargar la sección. Se conservará la ruta actual al actualizar.',
    avisMemoria: 'Recargar reinicia la aplicación y descarta los datos que solo viven en la memoria. Guarda o exporta lo que necesites antes.',
    avisAllotjada: 'Vuelve a abrir el módulo desde la página que lo aloja.',
    avisSenseConnexio: 'Recupera la conexión antes de volver a cargar.',
    etiquetaContext: 'Ruta conservada:',
    botoRecarrega: 'Recargar la aplicación',
    vistaContinuaFallant: 'La vista sigue fallando. Puedes abrir otra sección desde el menú.',
    botoReintent: 'Intentar de nuevo',
  }),
  en: Object.freeze({
    titol: 'Something went wrong',
    subtitolGeneral: 'This section could not be loaded properly.',
    insigniaDeploy: 'New version available or connection interrupted',
    explicacioDeploy: 'An update was published while this tab was open, or the network dropped while loading this section. Your current route will be preserved when reloading.',
    avisMemoria: 'Reloading restarts the application and discards data held only in memory. Save or export anything you need beforehand.',
    avisAllotjada: 'Reopen this module from the host page.',
    avisSenseConnexio: 'Restore your internet connection before reloading.',
    etiquetaContext: 'Preserved route:',
    botoRecarrega: 'Reload application',
    vistaContinuaFallant: 'This view is still failing. You can open another section from the menu.',
    botoReintent: 'Try again',
  }),
  eu: Object.freeze({
    titol: 'Arazo bat gertatu da',
    subtitolGeneral: 'Atal hau ezin izan da behar bezala kargatu.',
    insigniaDeploy: 'Bertsio berria eskuragarri edo konexioa etenda',
    explicacioDeploy: 'Eguneratze bat argitaratu da fitxa hau irekita zenuen bitartean, edo sarea moztu da atala kargatzean. Uneko bidea mantenduko da berritzean.',
    avisMemoria: 'Birkargatzeak aplikazioa berrabiarazten du eta memorian bakarrik dauden datuak baztertzen ditu. Gorde edo esportatu behar duzuna aurretik.',
    avisAllotjada: 'Ireki berriro modulua ostatatzen duen orritik.',
    avisSenseConnexio: 'Berreskuratu konexioa berriro kargatu aurretik.',
    etiquetaContext: 'Gordetako bidea:',
    botoRecarrega: 'Birkargatu aplikazioa',
    vistaContinuaFallant: 'Ikuspegiak huts egiten jarraitzen du. Beste atal bat ireki dezakezu menutik.',
    botoReintent: 'Saiatu berriro',
  }),
  gl: Object.freeze({
    titol: 'Houbo un problema',
    subtitolGeneral: 'Esta sección non puido cargarse correctamente.',
    insigniaDeploy: 'Nova versión dispoñible ou conexión interrompida',
    explicacioDeploy: 'Publicouse unha actualización mentres tiñas esta lapela aberta, ou cortouse a rede ao cargar a sección. Conservarase a ruta actual ao actualizar.',
    avisMemoria: 'Recargar reinicia a aplicación e descarta os datos que só viven na memoria. Garda ou exporta o que precises antes.',
    avisAllotjada: 'Volve abrir o módulo desde a páxina que o aloxa.',
    avisSenseConnexio: 'Recupera a conexión antes de volver cargar.',
    etiquetaContext: 'Ruta conservada:',
    botoRecarrega: 'Recargar a aplicación',
    vistaContinuaFallant: 'A vista segue fallando. Podes abrir outra sección desde o menú.',
    botoReintent: 'Tentar de novo',
  }),
});

export function textosRecuperacioRuta(idioma) {
  const codi = String(idioma || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_RECUPERACIO_RUTA, codi)
    ? TEXTOS_RECUPERACIO_RUTA[codi]
    : TEXTOS_RECUPERACIO_RUTA_CA;
}

/** Extreu només el camí públic net (sense consulta `?` ni fragment `#`, màxim 160 caràcters). */
export function rutaContextSegura(resetKey, fallbackPathname = '') {
  const brut = String(resetKey || fallbackPathname || '').split(/[?#]/)[0].trim();
  if (!brut || !brut.startsWith('/')) return '/';
  const net = brut.replace(/\/{2,}/g, '/').slice(0, 160);
  return net || '/';
}

/** Desa a sessionStorage el camí i el desplaçament abans de recarregar per desplegament. */
export function desaContextRecuperacioRuta({ resetKey, pathname = '', scrollY = 0, ara = Date.now() } = {}) {
  try {
    const ruta = rutaContextSegura(resetKey, pathname);
    const registre = {
      ruta,
      scrollY: Number.isFinite(scrollY) ? Math.max(0, Math.round(scrollY)) : 0,
      desatAl: Number.isFinite(ara) ? ara : Date.now(),
    };
    return setEfimer(CLAU_EFIMERA_RECUPERACIO_RUTA, registre);
  } catch {
    return false;
  }
}

/** Llig i neteja d'una sola passada el context desat si encara és dins de la finestra temporal. */
export function consumeixContextRecuperatRuta(ara = Date.now()) {
  try {
    const dades = getEfimer(CLAU_EFIMERA_RECUPERACIO_RUTA, null);
    if (!dades) return null;
    delEfimer(CLAU_EFIMERA_RECUPERACIO_RUTA);
    if (!dades || typeof dades.ruta !== 'string' || !dades.ruta.startsWith('/')) return null;
    if (!Number.isFinite(dades.desatAl) || Math.abs(ara - dades.desatAl) > FINESTRA_CONTEXT_RECUPERACIO_MS) {
      return null;
    }
    return {
      ruta: rutaContextSegura(dades.ruta),
      scrollY: Number.isFinite(dades.scrollY) ? Math.max(0, Math.round(dades.scrollY)) : 0,
    };
  } catch {
    return null;
  }
}

export function DetallContextDeploy({ tx, ruta }) {
  return (
    <div ref={adoptaEstilsRecuperacioRuta} className="sdp-route-error__deploy" data-recuperacio-deploy="true">
      <span className="sdp-route-error__insignia">{tx.insigniaDeploy}</span>
      <p className="sdp-route-error__explicacio">{tx.explicacioDeploy}</p>
      {ruta ? (
        <p className="sdp-route-error__context">
          <span>{tx.etiquetaContext}</span> <code>{ruta}</code>
        </p>
      ) : null}
    </div>
  );
}
