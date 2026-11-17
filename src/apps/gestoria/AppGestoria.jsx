/**
 * Gestoria de Poble · l'app (export per defecte: RutaApps la carrega amb
 * lazy() dins de /app/gestoria/*, només si el manifest la compila).
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»): dins de la Wiki, la Gestoria muntava una segona closca
 * sencera al detall d'un document i el seu menú es barrejava amb el de la
 * Wiki. Ara és una app pròpia: la ruta tria el mòdul de ShellGestoria. La
 * closca es conserva entre els seus mòduls i porta contingut central, boina
 * personal i PaginaApp.
 *   · La navegació és només la BarraApp global, amb els grups del manifest
 *     (ordre de MarIA 261012_2145, acatada pel Mestre, que revoca el «rail
 *     intern» del Panell ERP): la closca no pinta cap menú i rep només el
 *     mòdul de la ruta.
 *   · El titular (petició 261012_2148) · sense sessió, la closca rep
 *     `hrefEntrada`: l'entrada al compte del pont de sessió (useSessioApp),
 *     amb la tornada al Tauler, perquè en entrar s'hi aterre (rutaEntrada.js,
 *     aterratgeDespresDEntrar). «El pont no passa cap dada de la persona»
 *     (261012_2148): Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla
 *     261013_1405, front B: «la boina taronja de TOTES les pàgines de la
 *     Gestoria porta el titular real autenticat, amb el seu avatar, i mai
 *     Sóc de Poble amb el logotip a la Facturació»). Amb sessió, el pont passa
 *     `titular` (useSessioApp().titular: { nom, avatar, poble } i res més,
 *     perquè el manifest declara permisos.titular 'sessio') a la closca, a
 *     l'Històric i a la Finestreta, i signa amb ell les PaginaApp d'Aprendre
 *     i de la Facturació (enllaçat al perfil). Sense sessió, la boina diu
 *     «Titular sense configurar», amb l'entrada al compte que torna al Tauler.
 *     Totes les pàgines del pont porten el rellotge viu (rellotgeViu) a
 *     l'extrem dret de la barra taronja.
 *   · /app/gestoria/aprendre · Aprendre, el repàs espaiat, dins d'una
 *     PaginaApp (la porta de pàgina permesa a les apps).
 *   · /app/gestoria/facturacio · ordre del Mestre, 261007 («tindre la
 *     facturació operativa inclús sense xarxa»): la pantalla de Facturació
 *     (sections/gestoria/facturar), també dins d'una PaginaApp. Arriba pel
 *     pont i no per la closca: ShellGestoria és font del tractor
 *     gestoria.tauler, i tocar-la en tornaria l'aprovació a «pendent».
 *     Com Aprendre, anar-hi desmunta la closca (la lectura dels bancs, que
 *     viu en memòria, s'ha de tornar a fer en tornar al Tauler).
 *   · /app/gestoria/historic · Onada 6, ordre del Mestre (261009): l'històric
 *     del banc, la despesa en IA, les simulacions i el llibre per a la
 *     gestora (sections/gestoria/historic), amb el seu tractor propi
 *     ('gestoria.historic'). També pel pont i amb la seua PaginaApp.
 *   · /app/gestoria/identitat · ordre del Mestre, 13-10-2026 (pla
 *     261013_1405, front H): «Identitat i Finestreta», la fitxa d'identitat
 *     privada (darrere del cofre, com l'Històric) i els tràmits preparats per
 *     a copiar (sections/gestoria/finestreta), amb el seu tractor propi
 *     ('gestoria.identitat') i la seua PaginaApp. També pel pont. La closca
 *     en rep només la ruta (`hrefIdentitat`): l'Escàner hi envia la persona.
 *
 * EL PONT · Este fitxer és l'ÚNIC de src/apps que importa codi de
 * src/sections/gestoria: una excepció escrita i provada a la llista blanca de
 * plataforma/fronteres.test.js, amb les importacions dinàmiques de VISTES
 * (la closca, Aprendre, des del 261007 la Facturació, des del 261009
 * l'Històric i des del 13-10-2026 la Finestreta) i cap altra.
 * VISTES segueix el literal d'exclusió del manifest (P0-113, ordre del Mestre,
 * 261111): la Gestoria és oberta al web propi i les vistes hi entren com a
 * trossos diferits; amb VITE_SDP_APP_GESTORIA=0 (el paquet de l'amfitrió,
 * vite.standalone.config.js, i el cos d'un mòdul, vite.modul.config.js) Vite
 * reemplaça el literal i en trau les importacions del build
 * (gestoria/privacitat.test.js ho compila). El codi de la Gestoria el
 * continua vigilant la seua guarda de privacitat.
 *
 * LA PORTA DELS TRACTORS · rutes.js: la consulta que la demana es porta a la
 * Wiki, on viu, sempre a la mateixa ruta fixa.
 *
 * Onada R32.5 (P0-112 / IDEA-285):
 *   · S'extirpa el literal antic «Factures i llibre Veri*Factu, també sense connexió»
 *     i se substituïx per un subtítol honest d'esborranys i registre local encadenat
 *     sense validesa Verifactu.
 *   · Internacionalització completa del pont en les 5 llengües (ca, es, en, eu, gl)
 *     via useApp().idioma, propagant l'idioma a Facturacio.jsx.
 */
import { Suspense } from 'react';
import { Navigate, useLocation } from '../../app/contexts/RouterContext';
import { Carregant, EstatBuit, PaginaApp } from '../../components/PedraSeca/index.js';
import { useApp, useSessioApp, lazyRoute } from '../plataforma/index.js';
import { ENTRADA_APRENDRE, ENTRADA_FACTURACIO, ENTRADA_FULL, ENTRADA_IDENTITAT, desviamentDeLaConsulta } from './rutes.js';

const VISTES = import.meta.env.VITE_SDP_APP_GESTORIA !== '0' ? Object.freeze({
  tauler: lazyRoute(() => import('../../sections/gestoria/tauler/ShellGestoria.jsx')),
  aprendre: lazyRoute(() => import('../../sections/gestoria/aprendre/Aprendre.jsx')),
  facturacio: lazyRoute(() => import('../../sections/gestoria/facturar/Facturacio.jsx')),
  historic: lazyRoute(() => import('../../sections/gestoria/historic/Historic.jsx')),
  identitat: lazyRoute(() => import('../../sections/gestoria/finestreta/Finestreta.jsx'))
}) : null;

/* Onada 6, ordre del Mestre (261009): «Històric i IA» entra pel pont, com la
   Facturació, i porta la seua pròpia PaginaApp (la boina amb l'ull de
   privacitat). */
const ENTRADA_HISTORIC = 'historic';

/*
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · La boina de les
 * pàgines que pinta el pont (Aprendre i la Facturació). El pont no pot
 * importar res de la Gestoria fora de VISTES: estes dues constants són les
 * mateixes de la closca (ShellGestoria.jsx, RUTA_TITULAR i
 * TITULAR_SENSE_CONFIGURAR), i AppGestoria.test.jsx ho comprova.
 */
/** La pàgina del titular amb sessió: el seu perfil. */
export const RUTA_TITULAR = '/el-meu-perfil';
/** El nom de la boina sense sessió: l'estat honest, mai una autora fingida. */
export const TITULAR_SENSE_CONFIGURAR = 'Titular sense configurar';

/* P0-113 · El que diu un build que desendolla la Gestoria (VITE_SDP_APP_GESTORIA=0): és l'únic text
   que porta el cos d'un mòdul (vite.modul.config.js), i per això va a banda de TEXTOS_PONT_GESTORIA,
   que segueix el literal d'exclusió com VISTES (modulDeBuild.test.jsx ho compila). */
const TEXTOS_NO_COMPILADA = Object.freeze({
  ca: Object.freeze({ titol: 'La Gestoria no és en este paquet', text: 'Esta versió de la web no porta la Gestoria.' }),
  es: Object.freeze({ titol: 'La Gestoría no está en este paquete', text: 'Esta versión de la web no incluye la Gestoría.' }),
  en: Object.freeze({ titol: 'Bookkeeping is not in this build', text: 'This web version does not include the Bookkeeping module.' }),
  eu: Object.freeze({ titol: 'Gestoria ez dago pakete honetan', text: 'Web bertsio honek ez dakar Gestoria.' }),
  gl: Object.freeze({ titol: 'A Xestoría non está neste paquete', text: 'Esta versión da web non inclúe a Xestoría.' })
});

/* Onada R32.5 · Els textos del pont en les 5 llengües. Darrere del mateix literal que VISTES: compilada
   com a mòdul, la Gestoria no porta cap nom de vista. */
export const TEXTOS_PONT_GESTORIA = import.meta.env.VITE_SDP_APP_GESTORIA !== '0' ? Object.freeze({
  ca: Object.freeze({
    titularSenseConfigurar: TITULAR_SENSE_CONFIGURAR,
    insigniaGestoria: 'GESTORIA',
    aprendreTitol: 'Aprendre',
    aprendreSubtitol: 'Repàs espaiat dels conceptes de la gestoria',
    carregantAprendre: 'Carregant Aprendre…',
    facturacioTitol: 'Facturació',
    facturacioSubtitol: 'Esborranys de factures i registre encadenat local, també sense connexió',
    carregantFacturacio: 'Carregant la Facturació…',
    carregantHistoric: 'Carregant l’Històric…',
    carregantIdentitat: 'Carregant Identitat i Finestreta…',
    carregantGestoria: 'Carregant la Gestoria…'
  }),
  es: Object.freeze({
    titularSenseConfigurar: 'Titular sin configurar',
    insigniaGestoria: 'GESTORÍA',
    aprendreTitol: 'Aprender',
    aprendreSubtitol: 'Repaso espaciado de los conceptos de gestoría',
    carregantAprendre: 'Cargando Aprender…',
    facturacioTitol: 'Facturación',
    facturacioSubtitol: 'Borradores de facturas y registro encadenado local, también sin conexión',
    carregantFacturacio: 'Cargando Facturación…',
    carregantHistoric: 'Cargando Histórico…',
    carregantIdentitat: 'Cargando Identidad y Ventanilla…',
    carregantGestoria: 'Cargando la Gestoría…'
  }),
  en: Object.freeze({
    titularSenseConfigurar: 'Account holder not set',
    insigniaGestoria: 'BOOKKEEPING',
    aprendreTitol: 'Learn',
    aprendreSubtitol: 'Spaced repetition of bookkeeping concepts',
    carregantAprendre: 'Loading Learn…',
    facturacioTitol: 'Invoicing',
    facturacioSubtitol: 'Invoice drafts and local chained ledger, offline-ready',
    carregantFacturacio: 'Loading Invoicing…',
    carregantHistoric: 'Loading History…',
    carregantIdentitat: 'Loading Identity and One-Stop Desk…',
    carregantGestoria: 'Loading Bookkeeping…'
  }),
  eu: Object.freeze({
    titularSenseConfigurar: 'Titularra konfiguratu gabe',
    insigniaGestoria: 'GESTORIA',
    aprendreTitol: 'Ikasi',
    aprendreSubtitol: 'Gestoriako kontzeptuen errepikapen tartekatua',
    carregantAprendre: 'Ikasi kargatzen…',
    facturacioTitol: 'Fakturazioa',
    facturacioSubtitol: 'Faktura-zirriborroak eta tokiko erregistro kateatua, konexiorik gabe ere',
    carregantFacturacio: 'Fakturazioa kargatzen…',
    carregantHistoric: 'Historikoa kargatzen…',
    carregantIdentitat: 'Nortasuna eta Leihatila kargatzen…',
    carregantGestoria: 'Gestoria kargatzen…'
  }),
  gl: Object.freeze({
    titularSenseConfigurar: 'Titular sen configurar',
    insigniaGestoria: 'XESTORÍA',
    aprendreTitol: 'Aprender',
    aprendreSubtitol: 'Repaso espazado dos conceptos da xestoría',
    carregantAprendre: 'Cargando Aprender…',
    facturacioTitol: 'Facturación',
    facturacioSubtitol: 'Borradores de facturas e rexistro encadeado local, tamén sen conexión',
    carregantFacturacio: 'Cargando Facturación…',
    carregantHistoric: 'Cargando Histórico…',
    carregantIdentitat: 'Cargando Identidade e Xanela…',
    carregantGestoria: 'Cargando a Xestoría…'
  })
}) : null;

/** El codi de llengua ('es-ES' → 'es') si la taula en té textos; si no, el valencià. */
const llenguaDe = (taula, idioma) => {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(taula, codi) ? codi : 'ca';
};

/** Els textos del pont en la llengua de la interfície (null en un build sense la Gestoria). */
export function textosPontGestoria(idioma) {
  return TEXTOS_PONT_GESTORIA ? TEXTOS_PONT_GESTORIA[llenguaDe(TEXTOS_PONT_GESTORIA, idioma)] : null;
}

/**
 * L'autor de les PaginaApp del pont: el titular de la sessió, enllaçat al
 * seu perfil; sense, l'estat honest amb l'entrada al compte.
 * @param {{ nom: string, avatar: string|null, poble: string }|null} titular el de useSessioApp
 * @param {string} entrada la ruta d'entrada al compte (entradaAlTauler)
 * @param {string} [idioma] la llengua de la interfície (Onada R32.5): el nom de la boina sense sessió
 * @returns {{ nom: string, avatar: string|null, poble: string, href: string }}
 */
export function autorDelPont(titular, entrada, idioma = 'ca') {
  return titular
    ? { ...titular, href: RUTA_TITULAR }
    : { nom: textosPontGestoria(idioma)?.titularSenseConfigurar ?? TITULAR_SENSE_CONFIGURAR, poble: '', avatar: null, href: entrada };
}

/**
 * L'entrada al compte del pont de sessió, amb la tornada canviada pel Tauler:
 * entre des del mòdul que entre, la persona aterra al Tauler (petició del
 * Mestre via MarIA, 261012_2148). La resta de la consulta no es toca.
 * @param {string} rutaEntrada la de useSessioApp (/registre?mode=entrar&tornar=…)
 * @param {string} tauler la ruta del Tauler de l'app
 * @returns {string}
 */
export function entradaAlTauler(rutaEntrada, tauler) {
  const [cami, consulta = ''] = String(rutaEntrada).split('?');
  const params = new URLSearchParams(consulta);
  params.set('tornar', tauler);
  return `${cami}?${params.toString()}`;
}

export default function AppGestoria() {
  const { base, idioma = 'ca' } = useApp();
  const sessio = useSessioApp();
  const { pathname, search } = useLocation();
  const desti = desviamentDeLaConsulta(search);
  if (desti) return <Navigate to={desti} replace />;
  /* P0-113 · Només en un build que la desendolla (VITE_SDP_APP_GESTORIA=0): el text no promet cap altre lloc. */
  if (!VISTES) {
    const nc = TEXTOS_NO_COMPILADA[llenguaDe(TEXTOS_NO_COMPILADA, idioma)];
    return <EstatBuit titol={nc.titol}>{nc.text}</EstatBuit>;
  }
  const tx = textosPontGestoria(idioma);

  /* El primer tram després de /app/gestoria: RutaApps ja ha comprovat que és una entrada del manifest. */
  const entrada = pathname.slice(base.length + 1).split('/')[0];
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el titular de la
     sessió (null sense sessió). Amb titular, la boina enllaça al perfil i no
     a l'entrada al compte. */
  const titular = sessio.titular ?? null;
  const entradaAlCompte = entradaAlTauler(sessio.rutaEntrada, `${base}/tauler`);
  const autor = autorDelPont(titular, entradaAlCompte, idioma);
  const etiquetesAprendre = [
    { text: tx.insigniaGestoria, className: 'sdp-badge-system' },
    { text: tx.aprendreTitol, className: 'sdp-badge-category' }
  ];
  const etiquetesFacturacio = [
    { text: tx.insigniaGestoria, className: 'sdp-badge-system' },
    { text: tx.facturacioTitol, className: 'sdp-badge-category' }
  ];

  if (entrada === ENTRADA_APRENDRE) {
    const Aprendre = VISTES.aprendre;
    return (
      <PaginaApp title={tx.aprendreTitol} subtitle={tx.aprendreSubtitol} labels={etiquetesAprendre}
        author={autor} rellotgeViu showComment={false} showShare={false} showConnect={false}>
        <Suspense fallback={<Carregant etiqueta={tx.carregantAprendre} />}>
          <Aprendre />
        </Suspense>
      </PaginaApp>
    );
  }
  if (entrada === ENTRADA_FACTURACIO) {
    const Facturacio = VISTES.facturacio;
    return (
      <PaginaApp title={tx.facturacioTitol} subtitle={tx.facturacioSubtitol} labels={etiquetesFacturacio}
        author={autor} rellotgeViu showComment={false} showShare={false} showConnect={false}>
        <Suspense fallback={<Carregant etiqueta={tx.carregantFacturacio} />}>
          <Facturacio idioma={idioma} />
        </Suspense>
      </PaginaApp>
    );
  }
  if (entrada === ENTRADA_HISTORIC) {
    const Historic = VISTES.historic;
    return (
      <Suspense fallback={<Carregant etiqueta={tx.carregantHistoric} />}>
        <Historic titular={titular} />
      </Suspense>
    );
  }
  if (entrada === ENTRADA_IDENTITAT) {
    const Finestreta = VISTES.identitat;
    return (
      <Suspense fallback={<Carregant etiqueta={tx.carregantIdentitat} />}>
        <Finestreta titular={titular} />
      </Suspense>
    );
  }
  const Closca = VISTES.tauler;
  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 3): la «Plantilla Gestoria» del Quadre de
     comandament porta al Full trimestral des del seu estat buit; com hrefIdentitat, la ruta la dona el pont
     (una relativa des de /app/gestoria resoldria a /app/full). */
  return (
    <Suspense fallback={<Carregant etiqueta={tx.carregantGestoria} />}>
      <Closca modulActiu={entrada} hrefEntrada={sessio.teSessio || titular ? null : entradaAlCompte}
        titular={titular} hrefIdentitat={`${base}/${ENTRADA_IDENTITAT}`} hrefFull={`${base}/${ENTRADA_FULL}`} />
    </Suspense>
  );
}
