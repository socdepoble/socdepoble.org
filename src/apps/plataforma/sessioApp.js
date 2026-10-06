/**
 * Plataforma d'Apps Enxufables · el PONT DE SESSIÓ, de només lectura.
 *
 * Ordre del Mestre (261006, TPV Universal): una app no toca mai la sessió. No
 * importa SessionContext ni el backend (fronteres.test.js, Model B) i no veu
 * el JWT, ni l'usuari, ni el rol de plataforma. La plataforma traduïx
 * `permisos.escriure` del manifest a `potEscriure` i, dins de l'app, li dona
 * això i res més:
 *
 *   useSessioApp() · Object.freeze({
 *     estat        'comprovant' | 'dins' | 'fora' (sense SessionProvider, 'fora');
 *     teSessio     cert només amb estat 'dins';
 *     potEscriure  cert amb els motius 'lliure', 'sessio', 'mode-proves',
 *                  'fora-de-linia' i 'comprovant-desada'; fals amb la resta;
 *     motiu        per què potEscriure val el que val (MOTIUS, més avall);
 *     enLinia      el que diu el dispositiu (useEnLinia): fals només si el
 *                  navegador diu explícitament que no té xarxa;
 *     modeProves   el mode de dades efectiu és 'seed' o 'local': no hi ha cap
 *                  servidor darrere i entrar és impossible per disseny;
 *     marca        { nom, logotip, slug } de l'organització activa, o null;
 *     rutaEntrada  /registre?mode=entrar&tornar=<ruta actual>, la mateixa
 *                  que construïx RequireAuth (rutaDEntrada)
 *   })
 *
 *   EL MOTIU (ordres del Mestre, 261006: offline prioritari, el permís per a
 *   tot el Bar, el mode de proves i la sessió desada sense xarxa). Es decidix
 *   en este ordre, i val el primer que es complix:
 *     'lliure'         el manifest no declara permisos.escriure → cert. Va
 *                      primer: a una app lliure la sessió no li canvia res
 *     'sessio'         teSessio i el permís es complix ('sessio'; 'superadmin'
 *                      només amb superadmin) → cert
 *     'mode-proves'    modeProves i el permís és 'sessio' (mai 'superadmin') → cert.
 *                      La vista ho ha de dir: les vendes no són de cap compte
 *     'fora-de-linia'  el permís és 'sessio', en este dispositiu hi ha una
 *                      sessió desada que el servidor encara pot tornar
 *                      (sessioRecuperable, identitat.js: qui ja havia entrat i
 *                      no ha eixit) i no s'ha pogut comprovar per falta de
 *                      xarxa: el navegador diu que no en té, o l'estat és
 *                      'fora' (la comprovació ja s'ha fet i el servidor no ha
 *                      respost: un router sense eixida a Internet, un servidor
 *                      caigut) → cert
 *     'comprovant-desada'  en línia, estat 'comprovant' i la mateixa sessió
 *                      desada: el servidor l'està comprovant i, mentrestant,
 *                      es continua venent → cert
 *     'comprovant'     estat 'comprovant' sense cap de les anteriors → fals
 *     'sense-permis'   teSessio però el permís (superadmin) no es complix → fals
 *     'sense-sessio'   la resta → fals
 *
 *   · D'ON VE LA SESSIÓ (correcció del 261006: desar una vista del Bar tombava
 *     l'app en desenvolupament). Este mòdul és a la clausura d'imports de
 *     l'API pública (index.js), que importen totes les apps, i per això NO
 *     importa cap context que tinga el proveïdor a l'arrel de l'app
 *     (SessionContext, IdentitatContext). Eixos dos mòduls són ascendents de
 *     les apps (SessionContext → sessionService → host.js → registreApps →
 *     import() de cada app): Vite els invalida cada vegada que es desa una
 *     vista, i la vista, en tornar-se a importar, en carregava una instància
 *     nova, amb un createContext nou. React Refresh posava la implementació
 *     nova al SessionProvider i a l'IdentitatProvider de l'arrel, i els
 *     consumidors que no s'havien tornat a executar (TopBar a App.jsx,
 *     CoreContentProvider) es quedaven sense proveïdor. Els llig fontSessio.js,
 *     que només importa RutaApps.jsx: ContenidorApp en passa el ganxo a
 *     ProveidorApp i ací es crida amb useSessioDeLaRuta (ContextApp.jsx, que
 *     tampoc no arriba a cap app: PlataformaContext.jsx, que sí, ja no és a
 *     la clausura). Torna la instantània mínima { estat, idUsuari,
 *     esSuperadmin, marca }, i només la llig l'app que crida este ganxo.
 *     RouterContext i UIContext sí que hi són: no són ascendents de cap app.
 *     La porta és fronteres.test.js. En producció no hi ha HMR, i la sessió
 *     que arriba és la mateixa.
 *   · potEscriure és un INDICADOR, no una barrera: no bloqueja res, i cada
 *     vista l'ha de consultar. La seguretat de les dades és la RLS, no este
 *     booleà; teSessio continua dient la veritat de la sessió encara que
 *     potEscriure siga cert per mode de proves o per la sessió desada.
 *   · LA SESSIÓ DESADA NOMÉS CAU quan la persona ix o quan el servidor
 *     rebutja el testimoni (400/401: auth.js, oblidaRegistre). Una renovació
 *     que falla per xarxa, per temps esgotat o per un error del servidor la
 *     deixa intacta, i el Bar continua venent: les dades són del dispositiu
 *     (ordres del Mestre (1) i (4), 261006). Per això la sessió desada val
 *     també amb el navegador «en línia».
 *   · LA RENOVACIÓ DEL JWT no talla l'app: SessionContext dona 'comprovant'
 *     amb el MATEIX compte mentre torna a llegir el rol, i el pont continua
 *     dient 'dins' (amb el permís de superadmin de l'últim 'dins'), com
 *     `mostrat` a RequireAuth. Amb el permís 'sessio', el rol no compta: una
 *     'comprovant' que ja porta el compte (el testimoni és bo i només falta
 *     el rol) també és 'dins', encara que no n'hi haja cap 'dins' previ (la
 *     tornada de la xarxa, l'arrencada). Amb 'superadmin', només la del
 *     mateix compte de l'últim 'dins'. L'id del compte (idUsuari de la
 *     instantània) es recorda en un ref intern que no ix mai del ganxo.
 *   · LA SESSIÓ DESADA només es mira quan pot decidir el motiu (permís
 *     'sessio', sense sessió viva i fora del mode de proves), i se'n trau un
 *     booleà i prou: cap compte, cap testimoni. Es torna a llegir a cada
 *     pintat, quan canvia la sessió d'esta pestanya (sdp:auth-change) o el
 *     que hi ha desat des d'una altra (l'esdeveniment `storage`: eixir allà
 *     la retira ací).
 *   · LÍMIT CONEGUT (troballa del 261006, decisió del Mestre: l'arrel és a
 *     src/data, sessionService i identitat). Una sessió de l'amfitrió
 *     (adoptaSessioExterna, Model B), la política auth.persistencia
 *     'pestanya' o el recurs efímer per quota no baixen al registre
 *     persistent: quan el JWT caduca sense xarxa, sessionService buida la
 *     pestanya (tancaPestanya) i sessioRecuperable torna fals. En eixos casos,
 *     vendre sense xarxa només dura fins que caduca el JWT. I amb el
 *     navegador «en línia» però sense eixida a Internet, sessionService no
 *     torna a provar la sessió fins a un esdeveniment 'online' o una
 *     recàrrega: el Bar ven, però la comprovació espera.
 *   · EL MODE DE DADES és el que decidix la closca (App.jsx, modeRemot):
 *     normalizeBackendConfig sobre la configuració de l'amfitrió de
 *     UIContext. Una configuració que no es pot normalitzar compta com a
 *     remota: en el dubte, la sessió és obligatòria.
 *   · La marca només hi és si l'actor actiu d'IdentitatContext és una entitat
 *     amb rol owner o admin (marcaDeLActor, a fontSessio.js, amb
 *     ROLS_QUE_SIGNEN), i mai amb estat 'fora'. En 'comprovant' es conserva
 *     perquè no parpellege.
 *     Tres camps i prou: cap id, correu, rol, kind ni cap altra clau. És
 *     l'ÚNIC contracte de la marca de l'organització (marcaNeta): el
 *     logotip, text o null, el filtra la peça en pintar-lo (fontSegura).
 *   · Cap crida al port del backend ni a la xarxa: només llig la instantània
 *     de la ruta, el navegador i el que hi ha desat en este dispositiu.
 *   · Proves: ProveidorPlataforma amb `entorn.sessio` ({ estat, esSuperadmin?,
 *     marca?, enLinia?, modeProves?, recuperable? }) substituïx la instantània
 *     de la ruta (PlataformaContext.jsx). La marca de l'entorn ja és la
 *     marca, i passa pel mateix filtre de camps. enLinia, modeProves i
 *     recuperable, si són booleans, fixen el navegador, el mode de dades i la
 *     sessió desada; si no hi són, es llegixen de veres.
 */
import { useMemo, useRef, useSyncExternalStore } from 'react';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { sessioRecuperable } from '../../data/identitat.js';
import { useEnLinia } from '../../components/universal/connexio/useEnLinia.js';
import { useApp, useSessioDeLEntorn, useSessioDeLaRuta } from './ContextApp.jsx';

/**
 * Els estats de la sessió: els valors de SessionContext.ESTAT, escrits ací
 * perquè este mòdul no el pot importar (vegeu «D'on ve la sessió»).
 * sessioApp.test.jsx comprova que coincidixen.
 */
export const ESTAT = Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' });

/** Els motius de potEscriure, en l'ordre en què es decidixen (vegeu la capçalera). */
export const MOTIUS = Object.freeze([
  'lliure', 'sessio', 'mode-proves', 'fora-de-linia', 'comprovant-desada', 'comprovant', 'sense-permis', 'sense-sessio'
]);
const MOTIUS_QUE_ESCRIUEN = new Set(['lliure', 'sessio', 'mode-proves', 'fora-de-linia', 'comprovant-desada']);
const MODES_DE_PROVES = new Set(['seed', 'local']);

/* Un estat desconegut no obri res: compta com a 'fora'. */
const estatNet = (estat) => (Object.values(ESTAT).includes(estat) ? estat : ESTAT.FORA);

const textONull = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor : null);

/* El valor fixat per l'entorn de proves si és un booleà; si no, el de veres. */
const booleaO = (valor, deVeres) => (typeof valor === 'boolean' ? valor : deVeres);

/**
 * La marca neta i congelada: { nom, logotip, slug } i cap altra clau, amb
 * logotip i slug de text o null. null si no hi ha nom.
 */
export function marcaNeta(marca) {
  if (marca === null || typeof marca !== 'object') return null;
  const nom = textONull(marca.nom);
  if (!nom) return null;
  return Object.freeze({ nom, logotip: textONull(marca.logotip), slug: textONull(marca.slug) });
}

/**
 * Cert si el mode de dades efectiu de la configuració de l'amfitrió és 'seed'
 * o 'local' (el criteri de la closca, App.jsx). Cap crida al port ni a la
 * xarxa. Una configuració que no es pot normalitzar no és mode de proves.
 */
export function esModeDeProves(externalConfig) {
  try {
    return MODES_DE_PROVES.has(normalizeBackendConfig(externalConfig || {}).dataMode);
  } catch {
    return false;
  }
}

/**
 * El motiu de potEscriure (vegeu la capçalera): el primer que es complix. Un
 * permís que no és del manifest (validaManifestApp no el deixaria passar) no
 * es complix mai, i tampoc no l'obrin el mode de proves ni la sessió desada.
 */
export function motiuDe({ escriure, teSessio, esSuperadmin, estat, enLinia, modeProves, recuperable }) {
  if (escriure === undefined) return 'lliure';
  const esComplix = escriure === 'sessio' || (escriure === 'superadmin' && esSuperadmin === true);
  if (teSessio === true && esComplix) return 'sessio';
  if (escriure === 'sessio' && modeProves === true) return 'mode-proves';
  if (escriure === 'sessio' && recuperable === true) {
    /* En línia i comprovant: el servidor encara no ha contestat. Si no, la xarxa no ha deixat comprovar-la. */
    return estat === ESTAT.COMPROVANT && enLinia !== false ? 'comprovant-desada' : 'fora-de-linia';
  }
  if (estat === ESTAT.COMPROVANT) return 'comprovant';
  if (teSessio === true) return 'sense-permis';
  return 'sense-sessio';
}

/* La sessió desada pot desaparéixer sense que canvie l'estat de la sessió:
   eixir des d'una altra pestanya (`storage`) o des d'esta (sdp:auth-change). */
function subscriuSessioDesada(avisa) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', avisa);
  window.addEventListener('sdp:auth-change', avisa);
  return () => {
    window.removeEventListener('storage', avisa);
    window.removeEventListener('sdp:auth-change', avisa);
  };
}

const capSessioDesada = () => false;

/* Fail-closed: si no es pot llegir, no n'hi ha. D'ací només ix el booleà. */
function hiHaSessioDesada() {
  try {
    return sessioRecuperable() === true;
  } catch {
    return false;
  }
}

/** Dins d'una app: el pont de sessió (vegeu la capçalera). Fora d'una app llança, com useApp. */
export function useSessioApp() {
  const { manifest } = useApp();
  const deLEntorn = useSessioDeLEntorn();
  /* La instantània de la font (fontSessio.js) que RutaApps ha passat a ProveidorApp, o null. */
  const deLaRuta = useSessioDeLaRuta();
  const externalConfig = useUIStateOpcional()?.externalConfig;
  const enLiniaDelDispositiu = useEnLinia();
  const { pathname, search } = useLocation();
  /* L'últim compte vist 'dins' per la instantània: { usuariId, esSuperadmin }. Intern. */
  const darrerDins = useRef(null);
  const escriure = manifest.permisos?.escriure;
  let estatDeLaSessio = deLaRuta ? deLaRuta.estat : undefined;
  let superadminDeLaSessio = deLaRuta?.esSuperadmin === true;
  const usuariId = typeof deLaRuta?.idUsuari === 'string' ? deLaRuta.idUsuari : null;
  if (estatDeLaSessio === ESTAT.DINS && usuariId) {
    darrerDins.current = { usuariId, esSuperadmin: superadminDeLaSessio };
  } else if (estatDeLaSessio === ESTAT.COMPROVANT && usuariId && darrerDins.current?.usuariId === usuariId) {
    /* La renovació del JWT del mateix compte: per a l'app, continua dins. */
    estatDeLaSessio = ESTAT.DINS;
    superadminDeLaSessio = darrerDins.current.esSuperadmin;
  } else if (estatDeLaSessio === ESTAT.COMPROVANT && usuariId && escriure === 'sessio') {
    /* El compte ja hi és i només falta el rol, que el permís 'sessio' no mira. */
    estatDeLaSessio = ESTAT.DINS;
    if (darrerDins.current?.usuariId !== usuariId) darrerDins.current = null;
  } else {
    darrerDins.current = null;
  }
  const estat = estatNet(deLEntorn ? deLEntorn.estat : estatDeLaSessio);
  const teSessio = estat === ESTAT.DINS;
  const esSuperadmin = deLEntorn ? deLEntorn.esSuperadmin === true : superadminDeLaSessio;
  const modeDeLaConfiguracio = useMemo(() => esModeDeProves(externalConfig), [externalConfig]);
  const enLinia = booleaO(deLEntorn?.enLinia, enLiniaDelDispositiu);
  const modeProves = booleaO(deLEntorn?.modeProves, modeDeLaConfiguracio);
  /* La sessió desada només es mira quan pot decidir el motiu: amb xarxa o sense. */
  const mira = escriure === 'sessio' && !teSessio && !modeProves;
  const desadaFixada = typeof deLEntorn?.recuperable === 'boolean';
  const desadaDeVeres = useSyncExternalStore(
    subscriuSessioDesada,
    mira && !desadaFixada ? hiHaSessioDesada : capSessioDesada,
    capSessioDesada
  );
  const recuperable = mira && (desadaFixada ? deLEntorn.recuperable : desadaDeVeres);
  const desti = pathname + (search ? `?${search}` : '');
  const marcaDeLaRuta = deLaRuta?.marca ?? null;

  return useMemo(() => {
    const motiu = motiuDe({ escriure, teSessio, esSuperadmin, estat, enLinia, modeProves, recuperable });
    let marca = null;
    /* La de la ruta ja ve neta (marcaDeLActor); torna a passar pel filtre, com la de l'entorn. */
    if (estat !== ESTAT.FORA) marca = marcaNeta(deLEntorn ? deLEntorn.marca : marcaDeLaRuta);
    return Object.freeze({
      estat,
      teSessio,
      potEscriure: MOTIUS_QUE_ESCRIUEN.has(motiu),
      motiu,
      enLinia,
      modeProves,
      marca,
      rutaEntrada: rutaDEntrada({ mode: 'entrar', tornar: desti })
    });
  }, [deLEntorn, estat, teSessio, esSuperadmin, enLinia, modeProves, recuperable, marcaDeLaRuta, escriure, desti]);
}
