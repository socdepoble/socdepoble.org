/**
 * Gestoria de Poble · l'app (export per defecte: RutaApps la carrega amb
 * lazy() dins de /app/gestoria/*, només si el manifest la compila).
 *
 * EL PONT · Este fitxer és l'ÚNIC de src/apps que importa codi de
 * src/sections/gestoria: una excepció escrita i provada a la llista blanca de
 * plataforma/fronteres.test.js, amb les importacions dinàmiques de VISTES
 * (la closca, Aprendre, la Facturació, l'Històric i la Finestreta) i cap altra.
 * VISTES segueix el literal d'exclusió del manifest (P0-113, ordre del Mestre,
 * 261111): la Gestoria és oberta al web propi i les vistes hi entren com a
 * trossos diferits; amb VITE_SDP_APP_GESTORIA=0 Vite reemplaça el literal i en
 * trau les importacions del build (gestoria/privacitat.test.js ho compila).
 *
 * Onada R32.5 + R32.11 (Lot 05):
 *   · Internacionalització completa del pont en les 5 llengües (ca, es, en, eu, gl).
 *   · Cobertura dels 6 estats UI (Loading, Empty, Error accionable amb reintent,
 *     Permission, Partial i Success), botons centrats (<Accions>) i transparència
 *     Llei 0 sobre l'abast pre-comptable i d'exportació per a l'assessoria.
 */
import { Component, Suspense } from 'react';
import { Link, Navigate, useLocation } from '../../app/contexts/RouterContext';
import { Accions, Alerta, Boto, Carregant, EstatBuit, PaginaApp, Pila } from '../../components/PedraSeca/index.js';
import { useApp, useSessioApp, lazyRoute } from '../plataforma/index.js';
import { ENTRADA_APRENDRE, ENTRADA_FACTURACIO, ENTRADA_FULL, ENTRADA_IDENTITAT, desviamentDeLaConsulta } from './rutes.js';
export {
  CODIS_IDIOMA_GESTORIA,
  TEXTOS_BUIT_GESTORIA,
  TEXTOS_SECCIONS_GESTORIA,
  textosBuitGestoria,
  textosSeccionsGestoria
} from './i18nGestoria.js';

const VISTES = import.meta.env.VITE_SDP_APP_GESTORIA !== '0' ? Object.freeze({
  tauler: lazyRoute(() => import('../../sections/gestoria/tauler/ShellGestoria.jsx')),
  aprendre: lazyRoute(() => import('../../sections/gestoria/aprendre/Aprendre.jsx')),
  facturacio: lazyRoute(() => import('../../sections/gestoria/facturar/Facturacio.jsx')),
  historic: lazyRoute(() => import('../../sections/gestoria/historic/Historic.jsx')),
  identitat: lazyRoute(() => import('../../sections/gestoria/finestreta/Finestreta.jsx'))
}) : null;

const ENTRADA_HISTORIC = 'historic';

/** La pàgina del titular amb sessió: el seu perfil. */
export const RUTA_TITULAR = '/el-meu-perfil';
/** El nom de la boina sense sessió: l'estat honest, mai una autora fingida. */
export const TITULAR_SENSE_CONFIGURAR = 'Titular sense configurar';

/* P0-113 · El que diu un build que desendolla la Gestoria (VITE_SDP_APP_GESTORIA=0): és l'únic text
   que porta el cos d'un mòdul (vite.modul.config.js), i per això va a banda de TEXTOS_PONT_GESTORIA. */
const TEXTOS_NO_COMPILADA = Object.freeze({
  ca: Object.freeze({ titol: 'La Gestoria no és en este paquet', text: 'Esta versió de la web no porta la Gestoria.', torna: 'Torna al catàleg d’aplicacions' }),
  es: Object.freeze({ titol: 'La Gestoría no está en este paquete', text: 'Esta versión de la web no incluye la Gestoría.', torna: 'Volver al catálogo de aplicaciones' }),
  en: Object.freeze({ titol: 'Bookkeeping is not in this build', text: 'This web version does not include the Bookkeeping module.', torna: 'Back to applications catalogue' }),
  eu: Object.freeze({ titol: 'Gestoria ez dago pakete honetan', text: 'Web bertsio honek ez dakar Gestoria.', torna: 'Itzuli aplikazioen katalogora' }),
  gl: Object.freeze({ titol: 'A Xestoría non está neste paquete', text: 'Esta versión da web non inclúe a Xestoría.', torna: 'Volver ao catálogo de aplicacións' })
});

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
    carregantGestoria: 'Carregant la Gestoria…',
    abastFacturacioTitol: 'Abast pre-comptable i exportació per a l’assessoria',
    abastFacturacioText: 'Este mòdul prepara esborranys, numeració encadenada en este dispositiu i fitxers revisables per a la teua assessoria fiscal. No està homologat com a programari de facturació davant l’AEAT ni fa enviaments tributaris automàtics.',
    senseSessioFacturacioTitol: 'Sessió no iniciada (ús en este dispositiu)',
    senseSessioFacturacioText: 'Pots preparar esborranys sense compte; si inicies sessió, la capçalera vincularà el teu perfil com a titular operatiu.',
    identificaTitularBoto: 'Identifica el titular',
    titularVinculatTitol: (nom) => `Titular operatiu actiu: ${nom}`,
    titularVinculatText: 'Les dades fiscals continuen guardades únicament en este dispositiu i mai s’envien sense la teua acció.',
    errorModulTitol: 'No s’ha pogut obrir este apartat de la Gestoria',
    errorModulText: 'La càrrega diferida del mòdul ha fallat temporalment. Cap dada desada en este dispositiu s’ha perdut.',
    reintentaModul: 'Torna a carregar el mòdul',
    vesAlTauler: 'Ves al Tauler'
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
    carregantGestoria: 'Cargando la Gestoría…',
    abastFacturacioTitol: 'Alcance precontable y exportación para asesoría',
    abastFacturacioText: 'Este módulo prepara borradores, numeración encadenada en este dispositivo y archivos revisables para tu asesoría fiscal. No está homologado como software de facturación ante la AEAT ni realiza envíos tributarios automáticos.',
    senseSessioFacturacioTitol: 'Sesión no iniciada (uso en este dispositivo)',
    senseSessioFacturacioText: 'Puedes preparar borradores sin cuenta; si inicias sesión, la cabecera vinculará tu perfil como titular operativo.',
    identificaTitularBoto: 'Identificar al titular',
    titularVinculatTitol: (nom) => `Titular operativo activo: ${nom}`,
    titularVinculatText: 'Los datos fiscales permanecen guardados únicamente en este dispositivo y nunca se envían sin tu acción.',
    errorModulTitol: 'No se ha podido abrir este apartado de la Gestoría',
    errorModulText: 'La carga diferida del módulo ha fallado temporalmente. Ningún dato guardado en este dispositivo se ha perdido.',
    reintentaModul: 'Volver a cargar el módulo',
    vesAlTauler: 'Ir al Tablero'
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
    carregantGestoria: 'Loading Bookkeeping…',
    abastFacturacioTitol: 'Pre-accounting scope & accountant export',
    abastFacturacioText: 'This module prepares invoice drafts, a chained ledger on this device and verifiable exports for your tax advisor. It is not certified tax-filing software with the Spanish Tax Agency (AEAT) and performs no automatic tax submissions.',
    senseSessioFacturacioTitol: 'Not signed in (device-only mode)',
    senseSessioFacturacioText: 'You can draft records without signing in; signing in links your profile as the active account holder in the header.',
    identificaTitularBoto: 'Sign in as account holder',
    titularVinculatTitol: (nom) => `Active account holder: ${nom}`,
    titularVinculatText: 'Tax and invoice records remain stored solely on this device and are never transmitted automatically.',
    errorModulTitol: 'Could not open this Bookkeeping section',
    errorModulText: 'Loading this deferred module failed temporarily. No records saved on this device were lost.',
    reintentaModul: 'Reload module',
    vesAlTauler: 'Go to Dashboard'
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
    carregantGestoria: 'Gestoria kargatzen…',
    abastFacturacioTitol: 'Aurre-kontabilitate esparrua eta aholkularitzarako esportazioa',
    abastFacturacioText: 'Modulu honek zirriborroak, gailu honetako zenbakitze kateatua eta zure zerga-aholkularitzarako fitxategi egiaztagarriak prestatzen ditu. Ez dago AEATen aurrean homologatuta eta ez du zerga-bidalketa automatikorik egiten.',
    senseSessioFacturacioTitol: 'Saioa hasi gabe (gailu honetako erabilera)',
    senseSessioFacturacioText: 'Konturik gabe zirriborroak presta ditzakezu; saioa hastean, goiburuak zure profila titular gisa lotuko du.',
    identificaTitularBoto: 'Identifikatu titularra',
    titularVinculatTitol: (nom) => `Titular operatibo aktiboa: ${nom}`,
    titularVinculatText: 'Zerga-datuak gailu honetan soilik gordetzen dira eta ez dira inoiz zure ekintzarik gabe bidaltzen.',
    errorModulTitol: 'Ezin izan da Gestoriako atal hau ireki',
    errorModulText: 'Moduluaren karga geroratuak huts egin du aldi baterako. Ez da galdu gailu honetan gordetako daturik.',
    reintentaModul: 'Berriro kargatu modulua',
    vesAlTauler: 'Joan Arbelera'
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
    carregantGestoria: 'Cargando a Xestoría…',
    abastFacturacioTitol: 'Alcance precontable e exportación para asesoría',
    abastFacturacioText: 'Este módulo prepara borradores, numeración encadeada neste dispositivo e ficheiros revisables para a túa asesoría fiscal. Non está homologado como software de facturación ante a AEAT nin realiza envíos tributarios automáticos.',
    senseSessioFacturacioTitol: 'Sesión non iniciada (uso neste dispositivo)',
    senseSessioFacturacioText: 'Podes preparar borradores sen conta; se inicias sesión, a cabeceira vinculará o teu perfil como titular operativo.',
    identificaTitularBoto: 'Identificar o titular',
    titularVinculatTitol: (nom) => `Titular operativo activo: ${nom}`,
    titularVinculatText: 'Os datos fiscais permanecen gardados unicamente neste dispositivo e nunca se envían sen a túa acción.',
    errorModulTitol: 'Non se puido abrir este apartado da Xestoría',
    errorModulText: 'A carga diferida do módulo fallou temporalmente. Ningún dato gardado neste dispositivo se perdeu.',
    reintentaModul: 'Volver cargar o módulo',
    vesAlTauler: 'Ir ao Taboleiro'
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
 */
export function autorDelPont(titular, entrada, idioma = 'ca') {
  return titular
    ? { ...titular, href: RUTA_TITULAR }
    : { nom: textosPontGestoria(idioma)?.titularSenseConfigurar ?? TITULAR_SENSE_CONFIGURAR, poble: '', avatar: null, href: entrada };
}

/**
 * L'entrada al compte del pont de sessió, amb la tornada canviada pel Tauler.
 */
export function entradaAlTauler(rutaEntrada, tauler) {
  const [cami, consulta = ''] = String(rutaEntrada).split('?');
  const params = new URLSearchParams(consulta);
  params.set('tornar', tauler);
  return `${cami}?${params.toString()}`;
}

/**
 * Límit d'error recuperable per als trossos diferits del pont (estat Error accionable).
 */
export class LimitErrorPontGestoria extends Component {
  constructor(props) {
    super(props);
    this.state = { fallat: false, intent: 0 };
  }

  static getDerivedStateFromError() {
    return { fallat: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.fallat && prevProps.clauRuta !== this.props.clauRuta) {
      this.setState({ fallat: false });
    }
  }

  render() {
    const { tx, rutaTauler, children } = this.props;
    if (this.state.fallat && tx) {
      return (
        <Alerta to="error" titol={tx.errorModulTitol}>
          <p>{tx.errorModulText}</p>
          <Accions>
            <Boto varietat="primari" type="button" onClick={() => this.setState(s => ({ fallat: false, intent: s.intent + 1 }))}>
              {tx.reintentaModul}
            </Boto>
            {rutaTauler ? (
              <Link className="sdp-boto sdp-boto--secundari" to={rutaTauler}>{tx.vesAlTauler}</Link>
            ) : null}
          </Accions>
        </Alerta>
      );
    }
    return <div key={this.state.intent}>{children}</div>;
  }
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
    return (
      <EstatBuit
        titol={nc.titol}
        accio={(
          <Accions>
            <Link className="sdp-boto sdp-boto--secundari" to="/app">{nc.torna}</Link>
          </Accions>
        )}
      >
        {nc.text}
      </EstatBuit>
    );
  }
  const tx = textosPontGestoria(idioma);

  const entrada = pathname.slice(base.length + 1).split('/')[0];
  const rutaTauler = `${base}/tauler`;
  const titular = sessio.titular ?? null;
  const entradaAlCompte = entradaAlTauler(sessio.rutaEntrada, rutaTauler);
  const autor = autorDelPont(titular, entradaAlCompte, idioma);
  const etiquetesAprendre = [
    { text: tx.insigniaGestoria, className: 'sdp-badge-system' },
    { text: tx.aprendreTitol, className: 'sdp-badge-category' }
  ];
  const etiquetesFacturacio = [
    { text: tx.insigniaGestoria, className: 'sdp-badge-system' },
    { text: tx.facturacioTitol, className: 'sdp-badge-category' }
  ];
  const propIdioma = idioma && idioma !== 'ca' ? { idioma } : {};

  if (entrada === ENTRADA_APRENDRE) {
    const Aprendre = VISTES.aprendre;
    return (
      <PaginaApp title={tx.aprendreTitol} subtitle={tx.aprendreSubtitol} labels={etiquetesAprendre}
        author={autor} rellotgeViu showComment={false} showShare={false} showConnect={false}>
        <LimitErrorPontGestoria clauRuta={pathname} tx={tx} rutaTauler={rutaTauler}>
          <Suspense fallback={<Carregant etiqueta={tx.carregantAprendre} />}>
            <Aprendre {...propIdioma} />
          </Suspense>
        </LimitErrorPontGestoria>
      </PaginaApp>
    );
  }
  if (entrada === ENTRADA_FACTURACIO) {
    const Facturacio = VISTES.facturacio;
    return (
      <PaginaApp title={tx.facturacioTitol} subtitle={tx.facturacioSubtitol} labels={etiquetesFacturacio}
        author={autor} rellotgeViu showComment={false} showShare={false} showConnect={false}>
        <Pila gap={4}>
          <Alerta to="info" viva={false} titol={tx.abastFacturacioTitol}>
            {tx.abastFacturacioText}
          </Alerta>
          {titular ? (
            <Alerta to="exit" viva={false} titol={tx.titularVinculatTitol(titular.nom)}>
              {tx.titularVinculatText}
            </Alerta>
          ) : (
            <Alerta to="avis" viva={false} titol={tx.senseSessioFacturacioTitol}>
              <p>{tx.senseSessioFacturacioText}</p>
              <Accions>
                <Link className="sdp-boto sdp-boto--secundari" to={entradaAlCompte}>{tx.identificaTitularBoto}</Link>
              </Accions>
            </Alerta>
          )}
          <LimitErrorPontGestoria clauRuta={pathname} tx={tx} rutaTauler={rutaTauler}>
            <Suspense fallback={<Carregant etiqueta={tx.carregantFacturacio} />}>
              <Facturacio idioma={idioma} />
            </Suspense>
          </LimitErrorPontGestoria>
        </Pila>
      </PaginaApp>
    );
  }
  if (entrada === ENTRADA_HISTORIC) {
    const Historic = VISTES.historic;
    return (
      <LimitErrorPontGestoria clauRuta={pathname} tx={tx} rutaTauler={rutaTauler}>
        <Suspense fallback={<Carregant etiqueta={tx.carregantHistoric} />}>
          <Historic titular={titular} {...propIdioma} />
        </Suspense>
      </LimitErrorPontGestoria>
    );
  }
  if (entrada === ENTRADA_IDENTITAT) {
    const Finestreta = VISTES.identitat;
    return (
      <LimitErrorPontGestoria clauRuta={pathname} tx={tx} rutaTauler={rutaTauler}>
        <Suspense fallback={<Carregant etiqueta={tx.carregantIdentitat} />}>
          <Finestreta titular={titular} {...propIdioma} />
        </Suspense>
      </LimitErrorPontGestoria>
    );
  }
  const Closca = VISTES.tauler;
  return (
    <LimitErrorPontGestoria clauRuta={pathname} tx={tx} rutaTauler={null}>
      <Suspense fallback={<Carregant etiqueta={tx.carregantGestoria} />}>
        <Closca modulActiu={entrada} hrefEntrada={sessio.teSessio || titular ? null : entradaAlCompte}
          titular={titular} hrefIdentitat={`${base}/${ENTRADA_IDENTITAT}`} hrefFull={`${base}/${ENTRADA_FULL}`}
          {...propIdioma} />
      </Suspense>
    </LimitErrorPontGestoria>
  );
}
