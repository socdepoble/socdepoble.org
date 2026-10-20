import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useNavigate, useRouter } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Alerta, Boto, Divisor } from '../../components/PedraSeca/index.js';
import { MARCA_ENTRADA_PILOT, MARCA_SENSE_ENTRADA_AUTOMATICA, codiDEntrada, missatgeDEntrada, toDeLErrorDEntrada } from './onboardingModel.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useUIState } from '../../app/contexts/UIContext';
import { RegistrationStep } from './OnboardingSteps.jsx';
import { ContrasenyaNovaStep, EnllacPerdutStep } from './RecuperacioSteps.jsx';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { eleccioRemotaActiva, enterRemoteMode, enterTestMode, exitRemoteMode } from '../../config/dataMode.js';
import { RUTA_DESPRES_D_ENTRAR, aterratgeDespresDEntrar, modeDEntrada } from '../../config/rutaEntrada.js';
import { delEfimer, getEfimer, setEfimer } from '../../config/storage.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { ESTAT_ENLLAC } from '../../data/recuperacioPendent.js';
import { cancelAuthAttempts } from '../../data/authAttempt.js';
import { CODI_ENTRADA_EN_MARC, googleEnMarcAlie, urlPerAObrirFora } from '../../data/oauthRelay.js';
import { PERSONA_PILOT } from '../../data/identitatsSeed.js';
import { entradaPilotDisponible } from '../../data/sessioPilot.js';
import { createTranslator } from '../../config/i18n.js';
import { CODI_ENTRADA_NATIVA, abandonaCredencialNativa, botonsNatius, esSilenciNatiu, plataformaNativa } from '../../config/entradaNativa.js';
import { EntradaNativa } from './EntradaNativa.jsx';
import { entraAmbProveidorNatiu } from './fluxEntradaNativa.js';

/* Fase D (261020, tasca 1) · Les proves que simulen useUIState sense `t`
   continuen pintant: el traductor de reserva és el valencià. */
const TRADUCTOR_DE_RESERVA = createTranslator('ca');
const SENSE_PROVEIDORS = Object.freeze([]);

/* Correcció de la revisió T1–T4 (260930) · host.arrenca() no s'espera abans del
   primer pintat i, fins que l'adaptador no s'instal·la, teCapacitat torna false
   per a tot. La capacitat 'salut' es pregunta quan el port ja està llest, com
   fan useScopedResource, XatContext o sessionService. Una arrencada que falla
   no penja la decisió: es pren amb el port que hi haja. */
const quanPortLlest = () => import('../../host.js')
  .then((host) => host.quanLlest())
  .catch(() => undefined);

/* Correcció de la revisió T1–T4 (260930) · La marca d'un sol ús de «Tornar al
   mode de proves» (onboardingModel.js): es llig i s'esborra alhora. */
function consumixMarca(marca) {
  try {
    if (getEfimer(marca, null) == null) return false;
    delEfimer(marca);
    return true;
  } catch {
    return false;
  }
}
const consumixMarcaSenseEntrada = () => consumixMarca(MARCA_SENSE_ENTRADA_AUTOMATICA);

/* C5 · La consulta de l'app (on es demana ?mode=) quan el router és en
   MEMÒRIA, el de tota incrustació per defecte: la barra d'adreces és de la
   pàgina amfitriona, i ni la consulta d'ella és nostra ni la nostra hi és.
   null al NAVEGADOR: allí la consulta és la de la barra d'adreces, llegida en
   el moment com sempre (el router la pren d'allí mateix), i socdepoble.org no
   canvia. També null sense router llegible (una prova que el simula només amb
   useNavigate): useRouter fa el seu useContext abans de queixar-se, i l'ordre
   dels hooks no canvia. Com useUbicacioApp (useAccions.js): dins del try,
   `return useRouter()`; una assignació rules-of-hooks la pren per condicional. */
function useRouterLlegible() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

function useConsultaDeMemoria() {
  const router = useRouterLlegible();
  return router?.memoria === true ? String(router.searchParams ?? '') : null;
}

/* La consulta de l'app: la del router en memòria o, si no n'hi ha, la barra d'adreces. */
const consultaDeLApp = (consultaDeMemoria) => (consultaDeMemoria ?? (typeof window === 'undefined' ? '' : window.location.search));

/* Un port sense la capacitat, o una prova que simula la sessió sense ella, no fa caure la vista. */
function teLaCapacitat(teCapacitat, nom) {
  try { return typeof teCapacitat === 'function' && teCapacitat(nom) === true; } catch { return false; }
}

export default function OnboardingSection() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const consultaDeMemoria = useConsultaDeMemoria();
  /* T4 (ordre del Mestre, 260930) · ?mode=entrar|crear obri el formulari en
     eixe mode. Sense mode, com sempre: crear el compte. */
  const modeInicial = modeDEntrada(new URLSearchParams(consultaDeLApp(consultaDeMemoria)).get('mode')) || 'crear';
  const {
    currentUser, loginWithGoogle, loginWithPassword, registerWithPassword, teCapacitat, comprovaServidor,
    demanaRecuperacioContrasenya, definixContrasenyaNova, recuperacioPendent: recuperacioDeLaSessio, logout,
    enllacDeRecuperacio, oblidaEnllacDeRecuperacio, entraComAPilot, estat: estatSessio, entraAmbTokenDeProveidor
  } = useSession();
  const { externalConfig, t } = useUIState();
  const tr = typeof t === 'function' ? t : TRADUCTOR_DE_RESERVA;
  const normalizedConfig = normalizeBackendConfig(externalConfig);
  const modeDades = normalizedConfig.dataMode;
  /* Gauntlet 261016_1530 (Bloc 3.6.4; F66) · L'entrada pilot local
     (data/sessioPilot.js): només en desenvolupament i en mode de proves. Quan
     n'hi ha, substituïx «Forçar entrada local (Mock)», que només desbloquejava
     un formulari que el mode de proves rebutja igualment. En un build de
     producció no n'hi ha mai, i l'avís continua com abans. */
  const pilotDisponible = entradaPilotDisponible(externalConfig);
  const potEntrarComAPilot = pilotDisponible && typeof entraComAPilot === 'function' && !currentUser;
  /* Encàrrec 261018_1220 (Tasques 0 i 2, ordre del Mestre: «en entorn DEV, fer
     visible i accessible el botó Entra com a persona pilot») · En
     desenvolupament i en un node remot (el de .env.local), el mateix botó passa
     la pestanya al mode de proves i hi entra com a persona pilot amb un sol
     clic (enterTestMode i MARCA_ENTRADA_PILOT). La sessió pilot continua naixent
     només en mode de proves: en remot no s'hi entra mai. En un build no hi és. */
  /* Revisió adversarial (261018) · Mai mentre una sessió recordada encara es
     comprova: passar al mode de proves buidaria eixa sessió de veres. */
  const potPassarAProves = import.meta.env.DEV === true && modeDades === 'remote'
    && typeof entraComAPilot === 'function' && !currentUser && estatSessio !== 'comprovant';

  /* R (Onada 3, 261003) · Recuperació de contrasenya, només amb la capacitat
     opcional del port: sense ella (Sollutia) ni enllaç ni pantalla nova. Es
     pregunta a cada pintat: abans que el port estiga llest torna false, i el
     canvi d'estat de la sessió (sessionService espera el port) torna a pintar. */
  const potRecuperar = teLaCapacitat(teCapacitat, 'recuperacioContrasenya')
    && typeof demanaRecuperacioContrasenya === 'function'
    && typeof definixContrasenyaNova === 'function';
  /* R2 (decisió del Mestre, 261003) · L'enllaç del correu espera «Desa» sense
     sessió (data/recuperacioPendent.js, via SessionContext): 'pendent', la
     pantalla genèrica; 'perdut', la pàgina s'ha recarregat i cal tornar a
     obrir l'enllaç. Passa davant d'una sessió que ja hi haguera. App.jsx porta
     ací qualsevol altra ruta. */
  const enllac = potRecuperar && (enllacDeRecuperacio === ESTAT_ENLLAC.PENDENT || enllacDeRecuperacio === ESTAT_ENLLAC.PERDUT)
    ? enllacDeRecuperacio : null;
  /* Compatibilitat: una sessió que encara ha de triar la contrasenya nova (un
     backend que la torna amb l'enllaç). Ho diu la marca de la sessió, no
     l'estat de navegació: sobreviu a recarregar. */
  const recuperacioPendent = potRecuperar && Boolean(currentUser) && recuperacioDeLaSessio === true;
  const recuperacioEnCurs = enllac !== null || recuperacioPendent;
  /* «Demana un enllaç nou» (enllaç caducat o perdut) obri «Recupera la contrasenya». */
  const [obreRecuperacio, setObreRecuperacio] = useState(false);
  const [busyStep, setBusyStep] = useState(null);
  const [googleError, setGoogleError] = useState('');
  /* B (Onada 4, quarta passada, 261003; directriu de MarIA 261003_2221) · En un
     marc d'un altre origen (política conservadora, data/oauthRelay.js), Google
     no pot acabar. Es sap abans del clic: en compte del botó, un avís honest i
     l'eixida a una pestanya nova, a l'entrada real de l'app. Si l'adaptador ho
     descobrix després (ENTRADA_EN_MARC), el mateix avís. Un marc no canvia
     l'origen de dalt mentre viu: es mira una vegada. */
  const [enMarcAlie, setEnMarcAlie] = useState(() => googleEnMarcAlie());
  const adrecaFora = enMarcAlie ? urlPerAObrirFora() : null;
  /* { text, codi }: la frase i el codi de CODI_ENTRADA, que tria el to de l'avís. */
  const [errorEntrada, setErrorEntrada] = useState(null);
  const mostraError = useCallback((err) => setErrorEntrada({ text: missatgeDEntrada(err), codi: codiDEntrada(err) }), []);
  const canviDeModeDemanat = useRef(false);
  const canviDeModePendent = modeDades !== 'remote';

  /* Una resposta que arriba amb la vista desmuntada no pinta res. Com a ref i
     no com a variable de l'efecte: en StrictMode l'efecte es desmunta i es torna
     a muntar abans que responga la sonda, i la sonda no es repetix. */
  const montat = useRef(false);
  useEffect(() => {
    montat.current = true;
    return () => { montat.current = false; };
  }, []);

  // Entrar o registrar-se és l'elecció de dades reals. El formulari conserva
  // el circuit directe; el nou document establix el scope abans de rebre credencials.
  const canviaAModeReal = useCallback(() => {
    try { enterRemoteMode(normalizeBackendConfig(externalConfig)); }
    catch (err) { mostraError(err); }
  }, [externalConfig, mostraError]);

  /* T2 i T4 (ordre del Mestre, 260930) · T16 es conserva, però amb sonda: amb
     la capacitat 'salut', l'elecció remota només es desa si el servidor
     respon. Si no, no es desa res i la persona continua en mode de proves amb
     un avís i «Torna-ho a provar». Sense la capacitat, com fins ara. */
  const [servidorCaigut, setServidorCaigut] = useState(false);
  const [simulaLocal, setSimulaLocal] = useState(false);
  const [sondant, setSondant] = useState(false);
  /* Correcció de la revisió T1–T4 (260930) · Entrada automàtica suspesa per la
     marca de «Tornar al mode de proves»: només el botó manual connecta. */
  const [entradaSuspesa, setEntradaSuspesa] = useState(false);
  const intentSonda = useRef(0);

  /* Fase D (261020, tasca 1; ordre del Mestre) · A l'app nativa, el registre diu
     la plataforma i els botons (síncron: natiu/entrada.jsx el fixa abans de
     pintar). El Google web no hi és mai (ARQUITECTURA §3.2): en el seu lloc, el
     full natiu d'Apple (només a iOS) i de Google. A la web, res no canvia. */
  const plataforma = plataformaNativa();
  const esNatiu = plataforma !== 'web';
  const potEntrarNatiu = esNatiu && teLaCapacitat(teCapacitat, 'entradaAmbToken') && typeof entraAmbTokenDeProveidor === 'function';
  const [portNatiuLlest, setPortNatiuLlest] = useState(false);
  useEffect(() => {
    if (!esNatiu) return undefined;
    let viu = true;
    quanPortLlest().then(() => { if (viu) setPortNatiuLlest(true); });
    return () => { viu = false; };
  }, [esNatiu]);
  /* Fins que el port és llest, els botons es pinten desactivats (cap salt de la
     pàgina); llest i sense la capacitat, fora. Com Google web, mai en mode de proves. */
  const proveidorsNatius = esNatiu && (potEntrarNatiu || !portNatiuLlest) ? botonsNatius() : SENSE_PROVEIDORS;
  const natiuBloquejat = !potEntrarNatiu || (canviDeModePendent && !simulaLocal) || busyStep !== null;
  /* Fase D (261020, revisió) · L2 · Amb els botons natius a la vista, «Entra al
     teu compte» nomena el botó de dalt (Apple o Google), no el Google web. */
  const introEntradaNativa = proveidorsNatius.length
    ? tr(plataforma === 'ios' ? 'section.login.nativa.introEntradaIos' : 'section.login.nativa.introEntradaAndroid')
    : null;
  const [errorNatiu, setErrorNatiu] = useState(null);
  const botonsNatiusRef = useRef({});
  /* Estat i no ref: un full que es tanca de seguida pot no arribar a pintar
     l'espera, i el focus ha de tornar igualment al botó. */
  const [focusNatiu, setFocusNatiu] = useState(null);
  const desaBotoNatiu = useCallback((p, node) => { botonsNatiusRef.current[p] = node; }, []);
  const sondaIEntra = useCallback(() => {
    const id = ++intentSonda.current;
    setSondant(true);
    Promise.resolve()
      .then(() => comprovaServidor(normalizeBackendConfig(externalConfig)))
      .catch(() => ({ ok: false }))
      .then((resposta) => {
        if (!montat.current || id !== intentSonda.current) return;
        setSondant(false);
        if (resposta?.ok === true) {
          setServidorCaigut(false);
          canviaAModeReal();
        } else {
          setServidorCaigut(true);
        }
      });
  }, [comprovaServidor, externalConfig, canviaAModeReal]);

  /* Correcció de la revisió T1–T4 (260930) · Es decidix quan el port està
     llest (quanPortLlest): amb 'salut', sonda; sense, el canvi directe de T16.
     Una vista desmuntada mentre espera no decidix res. */
  const decidixEntrada = useCallback(() => {
    quanPortLlest().then(() => {
      if (!montat.current) return;
      if (teLaCapacitat(teCapacitat, 'salut') && typeof comprovaServidor === 'function') sondaIEntra();
      else canviaAModeReal();
    });
  }, [teCapacitat, comprovaServidor, sondaIEntra, canviaAModeReal]);

  /* Una sola decisió per document, també en StrictMode (canviDeModeDemanat).
     Amb la marca de «Tornar al mode de proves», cap: ni sonda ni canvi. */
  useEffect(() => {
    if (!canviDeModePendent || canviDeModeDemanat.current) return;
    canviDeModeDemanat.current = true;
    if (consumixMarcaSenseEntrada()) setEntradaSuspesa(true);
    else decidixEntrada();
  }, [canviDeModePendent, decidixEntrada]);

  /* T2 · Ja en remot per una elecció desada des d'un mode de proves, i el
     servidor no respon: l'avís oferix tornar-hi (esborra l'elecció i recarrega). */
  const potTornarAProves = errorEntrada?.codi === CODI_ENTRADA.SERVIDOR_INABASTABLE
    && modeDades === 'remote' && eleccioRemotaActiva(normalizedConfig);
  /* Correcció de la revisió T1–T4 (260930) · La recàrrega torna a /registre
     en mode de proves: sense la marca, l'entrada automàtica hi tornaria a desar
     l'elecció remota. Si no es pot esborrar l'elecció, tampoc es deixa la marca. */
  const tornaAProves = () => {
    try { setEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA, true); } catch { /* sense capa efímera: com abans */ }
    try { exitRemoteMode(normalizeBackendConfig(externalConfig)); }
    catch (err) {
      try { delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA); } catch { /* res més a fer */ }
      mostraError(err);
    }
  };

  /* I4 · Si el servidor demana confirmar el correu, el registre torna sense
     sessió: ho diem clar en lloc de celebrar un compte que encara no entra. */
  const [confirmationEmail, setConfirmationEmail] = useState('');
  /* Cada intent porta número: només l'últim apaga l'espera o pinta l'error.
     Google té espera pròpia ('google'): un emergent obert (fins a 180 s) no
     congela el formulari de correu. Si s'envia el correu amb Google pendent,
     la capa d'autenticació avorta Google i el seu AbortError ja no pinta res. */
  const intent = useRef(0);
  const obriIntent = (pas) => {
    const id = ++intent.current;
    setBusyStep(pas);
    return {
      viu: () => intent.current === id,
      tanca: () => { if (intent.current === id) setBusyStep(null); },
    };
  };

  /* Tornada del bfcache (arrere des de la redirecció a Google): la promesa
     de l'anada no resol mai i l'espera quedaria penjada per sempre. */
  useEffect(() => {
    const enTornar = (event) => {
      if (!event.persisted) return;
      intent.current += 1;
      setBusyStep(null);
    };
    window.addEventListener('pageshow', enTornar);
    return () => {
      intent.current += 1;
      window.removeEventListener('pageshow', enTornar);
    };
  }, []);

  /* Ordre del Mestre (261002) · Amb sessió, sempre a la pròpia identitat
     (RUTA_DESPRES_D_ENTRAR), mai a la ruta d'origen: deroga T4 (260930) per a
     l'entrada. El ?tornar que porten les portes (barrera, Xat, Connectar…)
     ja no mana. Hi passen la contrasenya, el registre amb sessió, Google per
     finestra i Google per redirecció (GoTrue torna a la pàgina on s'ha premut
     el botó: data/oauthRelay.js, urlDeTornada).
     Excepció estreta (261012_2148): una tornada a una entrada de la Gestoria
     (/app/gestoria/<entrada>) sí que mana (aterratgeDespresDEntrar); la
     resta, també la de les altres apps, al perfil. */
  const tornar = new URLSearchParams(consultaDeLApp(consultaDeMemoria)).get('tornar');
  useEffect(() => {
    if (currentUser && modeDades === 'remote' && !recuperacioEnCurs) navigate(aterratgeDespresDEntrar(tornar), { replace: true });
  }, [currentUser, modeDades, navigate, recuperacioEnCurs, tornar]);

  /* R · Les dues crides de la recuperació, pel port amb la configuració del node. */
  const demanaRecuperacio = (correu) => demanaRecuperacioContrasenya(correu, externalConfig);
  /* R2 · «Desa» verifica l'enllaç i definix la contrasenya en una sola crida
     del port; la sessió naix ací. En desar (la sessió esborra l'estat),
     entrada normal: al perfil. */
  const desaContrasenyaNova = async (contrasenya) => {
    await definixContrasenyaNova(contrasenya, externalConfig);
    if (!montat.current) return;
    showToast('Contrasenya nova desada. Benvingut de nou al Mas!', 'success');
    navigate(RUTA_DESPRES_D_ENTRAR, { replace: true });
  };
  /* Correcció de la revisió · Compatibilitat: l'única altra eixida d'una
     sessió marcada és eixir del compte (qui obri un enllaç que no és seu no
     s'hi queda tancat). */
  const eixDeLaRecuperacio = () => logout();
  /* R2 · Les eixides de l'enllaç: deixar-lo i tornar al formulari, o
     demanar-ne un altre. */
  const oblidaEnllac = () => { if (typeof oblidaEnllacDeRecuperacio === 'function') oblidaEnllacDeRecuperacio(); };
  /* Revisió adversarial (261018) · «Torna a entrar» obri el formulari en Entrar,
     encara que la ruta de tornada de l'enllaç no porte ?mode=entrar. */
  const [modeForcat, setModeForcat] = useState(null);
  const tornaAEntrar = () => { setModeForcat('entrar'); setObreRecuperacio(false); oblidaEnllac(); };
  const demanaUnAltre = () => { setObreRecuperacio(true); oblidaEnllac(); };

  const activeStep = 0;

  const handleRegister = async (fields) => {
    const op = obriIntent('register');
    setErrorEntrada(null);
    try {
      const resultat = await registerWithPassword(fields.email, fields.password, { full_name: fields.name, avatar_url: fields.avatar_url, accepta_rgpd: Boolean(fields.rgpd), tenant_id: normalizedConfig.tenantId }, externalConfig);
      if (!op.viu()) return;
      if (resultat?.access_token) {
        showToast('Compte creat. Benvinguda al Mas.', 'success');
        window.dispatchEvent(new CustomEvent('sdp:auth-change'));
      } else {
        setConfirmationEmail(String(fields.email || '').trim().toLowerCase());
      }
    } catch (err) {
      if (op.viu()) mostraError(err);
    } finally {
      op.tanca();
    }
  };

  const handleLogin = async (fields) => {
    const op = obriIntent('register');
    setErrorEntrada(null);
    try {
      await loginWithPassword(fields.email, fields.password, externalConfig);
      if (!op.viu()) return;
      showToast('Benvingut de nou al Mas!', 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } catch (err) {
      if (op.viu()) mostraError(err);
    } finally {
      op.tanca();
    }
  };

  /* F66 · Síncrona i sense xarxa: la sessió de prova naix en este navegador i
     s'aterra on aterra qualsevol entrada (la pròpia identitat). Si es rebutja,
     l'avís diu per què i no es toca res. */
  const entraPilot = () => {
    setErrorEntrada(null);
    try {
      entraComAPilot(externalConfig);
    } catch (err) {
      mostraError(err);
      return;
    }
    showToast(`Has entrat com a ${PERSONA_PILOT.nom}, la persona pilot. Esta sessió de prova només viu en aquest ordinador.`, 'success');
    navigate(aterratgeDespresDEntrar(tornar), { replace: true });
  };

  /* Encàrrec 261018_1220 · La càrrega que ve de «Entra com a Javi Llinares» en
     remot: ja en mode de proves, s'hi entra com a persona pilot quan el port i
     la sessió estan llestos (SessionProvider configura el backend en el seu
     efecte, després del d'esta vista). Una sola vegada per document. */
  const entradaPilotDemanada = useRef(false);
  const entraPilotActual = useRef(entraPilot);
  useEffect(() => { entraPilotActual.current = entraPilot; });
  useEffect(() => {
    if (entradaPilotDemanada.current) return;
    entradaPilotDemanada.current = true;
    if (!consumixMarca(MARCA_ENTRADA_PILOT) || !potEntrarComAPilot) return;
    quanPortLlest().then(() => { if (montat.current) entraPilotActual.current(); });
  }, [potEntrarComAPilot]);

  /* Encàrrec 261018_1220 · Des d'un node remot en desenvolupament: les dues
     marques i el mode de proves; la recàrrega fa la resta. Si no es pot desar
     l'elecció, no queda cap marca i l'avís diu per què. */
  const passaAProvesIEntra = () => {
    setErrorEntrada(null);
    try {
      setEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA, true);
      setEfimer(MARCA_ENTRADA_PILOT, true);
      enterTestMode(normalizedConfig);
    } catch (err) {
      try { delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA); delEfimer(MARCA_ENTRADA_PILOT); } catch { /* res més a fer */ }
      mostraError(err);
    }
  };

  const googleLogin = async () => {
    const op = obriIntent('google');
    setGoogleError('');
    try {
      await loginWithGoogle(externalConfig);
      if (!op.viu()) return;
      showToast('Benvingut de nou al Mas!', 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } catch (loginError) {
      if (op.viu() && loginError?.code === CODI_ENTRADA_EN_MARC) setEnMarcAlie(true);
      else if (op.viu()) setGoogleError(missatgeDEntrada(loginError));
    } finally {
      op.tanca();
    }
  };

  /* F1 (Onada 4, 261003) · Amb COOP, la capa d'autenticació no sap si la
     finestra de Google encara és oberta (closed menteix: data/oauthRelay.js) i
     ja no rebutja sola quan la persona la tanca. L'eixida és explícita: avorta
     l'intent (fora el verificador i els escoltadors; un codi que arribe després
     no entra) i allibera l'espera, també amb un port que no l'avortara. En
     prémer-lo, «Cancel·la l’entrada» desapareix i el focus torna a Google. */
  const botoGoogle = useRef(null);
  const focusAGoogle = useRef(false);
  const cancelaGoogle = () => {
    cancelAuthAttempts();
    intent.current += 1;
    focusAGoogle.current = true;
    setBusyStep(null);
  };
  useEffect(() => {
    if (busyStep !== null || !focusAGoogle.current) return;
    focusAGoogle.current = false;
    botoGoogle.current?.focus();
  }, [busyStep]);

  /* Fase D (261020, tasca 1) · Apple o Google des del full natiu: el full (fase 1)
     i el port (fase 2, entraAmbTokenDeProveidor), amb l'intent de sempre. Tancar
     el full no diu res; el text propi de l'adaptador (una sessió que no s'ha
     pogut desar…) es conserva tal qual. Fase D (261020, revisió) · Un altre
     proveïdor amb un full encara obert (EN_CURS) ja no és un botó mort: l'avís
     diu que cal acabar o tancar el que hi ha al telèfon. */
  const entraNatiu = async (proveidor) => {
    const op = obriIntent(`natiu:${proveidor}`);
    setErrorNatiu(null);
    try {
      await entraAmbProveidorNatiu(proveidor, entraAmbTokenDeProveidor, externalConfig, { viu: op.viu });
      if (!op.viu()) return;
      showToast(tr('section.login.success.login'), 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } catch (err) {
      if (!op.viu()) return;
      setFocusNatiu(proveidor);
      if (esSilenciNatiu(err) || err?.name === 'AbortError') return;
      if (err?.code === CODI_ENTRADA_NATIVA.EN_CURS) {
        setErrorNatiu({ to: 'avis', text: tr('section.login.nativa.enCurs') });
      } else if (err?.code === CODI_ENTRADA_NATIVA.FALLIDA || err?.code === CODI_ENTRADA_NATIVA.NO_DISPONIBLE) {
        setErrorNatiu({
          to: 'error',
          text: tr(err.code === CODI_ENTRADA_NATIVA.NO_DISPONIBLE ? 'section.login.nativa.noDisponible' : 'section.login.nativa.error')
        });
      } else {
        const codi = codiDEntrada(err);
        setErrorNatiu({ to: codi ? toDeLErrorDEntrada(codi) : 'error', text: missatgeDEntrada(err) });
      }
    } finally {
      op.tanca();
    }
  };
  /* Eixida explícita, com cancelaGoogle: la resposta tardana del full ja no és de
     ningú (fluxEntradaNativa la descarta i l'oblida) i el focus torna al botó.
     Fase D (261020, revisió) · El registre també ho sap (abandonaCredencialNativa):
     un full que encara no s'ha obert ja no s'obri, l'altre proveïdor queda lliure
     i tornar a tocar el mateix s'afig al full que ja ve. */
  const cancelaNatiu = () => {
    cancelAuthAttempts();
    abandonaCredencialNativa();
    setFocusNatiu(busyStep?.startsWith('natiu:') ? busyStep.slice(6) : null);
    intent.current += 1;
    setBusyStep(null);
  };
  useEffect(() => {
    if (busyStep !== null || !focusNatiu) return;
    botonsNatiusRef.current[focusNatiu]?.focus();
    setFocusNatiu(null);
  }, [busyStep, focusNatiu]);

  /* Fase D (261020, revisió) · L1 · A l'app nativa, «Continua amb Apple» s'ha de
     vore sense desplaçar (HIG, App Store 4.8): damunt de la targeta, ni les
     etiquetes ni l'entradeta. El logotip es queda: llevar-lo (senseLogo) només
     es fa per ordre del Mestre (PageFrame.logo.test.jsx, via d'excepció), i en
     un iPhone xicotet (SE) la decisió és seua. A la web, la capçalera de sempre. */
  const capcalera = esNatiu
    ? { showLogos: true }
    : {
      lead: "Entra per a participar. A l'interior podràs configurar la teua identitat i gestionar grups o empreses.",
      labels: ['Online-First', 'Perfil privat', 'RGPD Segur'],
      showLogos: true
    };

  if (recuperacioEnCurs) {
    let pas;
    if (enllac === ESTAT_ENLLAC.PENDENT) {
      /* Genèrica a posta (decisió del Mestre): ni sessió ni compte fins a «Desa». */
      pas = <ContrasenyaNovaStep onDesa={desaContrasenyaNova} onTorna={tornaAEntrar} onDemanaUnAltre={demanaUnAltre} />;
    } else if (enllac === ESTAT_ENLLAC.PERDUT) {
      pas = <EnllacPerdutStep onDemanaUnAltre={demanaUnAltre} onTorna={tornaAEntrar} />;
    } else {
      pas = (
        <ContrasenyaNovaStep
          correu={currentUser?.email ?? ''}
          onDesa={desaContrasenyaNova}
          onEix={typeof logout === 'function' ? eixDeLaRecuperacio : null}
        />
      );
    }
    return (
      <UniversalPage
        title="Benvinguda al Mas Electrònic"
        {...capcalera}
        chrome="system"
      >
        <div className="content-wrapper">{pas}</div>
      </UniversalPage>
    );
  }

  /* Fase D (261020, tasca 1; decisió D2) · A l'app nativa, la benvinguda va
     davall del formulari: els botons d'Apple i Google, a la vista sense desplaçar. */
  const benvinguda = (
    <div className="onboarding-benvinguda">
      <h3>Benvinguda a la Beta de Sóc de Poble</h3>
      <p className="onboarding-card__intro onboarding-card__intro--espaiada">
        L'accés és <strong>totalment segur</strong> i les teues dades estan protegides per llei (RGPD Llei 05).
        Com que estem en proves, t'agrairem que ens avises si trobes algun problema, especialment al mòbil. Et mantindrem al dia de les novetats!
      </p>
    </div>
  );

  return (
    <UniversalPage
      title="Benvinguda al Mas Electrònic"
      {...capcalera}
      chrome="system"
    >
      <div className="content-wrapper">
        {activeStep === 0 && (
          <>
            {esNatiu ? null : benvinguda}

            {servidorCaigut && !simulaLocal ? (
              <Alerta
                to="avis"
                accions={<>
                  <Boto varietat="secundari" carregant={sondant} onClick={sondaIEntra}>Torna-ho a provar</Boto>
                  {(modeDades === 'local' || modeDades === 'seed') && !pilotDisponible ? (
                    <Boto varietat="terciari" onClick={() => setSimulaLocal(true)}>Forçar entrada local (Mock)</Boto>
                  ) : null}
                </>}
              >
                El servidor del poble no respon ara mateix. Continues en mode de proves: pots explorar l’app, però encara no pots crear el compte ni entrar.
              </Alerta>
            ) : null}

            {entradaSuspesa && !servidorCaigut && !simulaLocal ? (
              <Alerta
                to="avis"
                accions={<Boto varietat="secundari" carregant={sondant} onClick={decidixEntrada}>Connectar amb el servidor</Boto>}
              >
                Has tornat al mode de proves: pots explorar l’app amb dades de mostra. Per a crear el compte o entrar, connecta amb el servidor del poble.
              </Alerta>
            ) : null}

            {/* F66 · Fora de la regió viva (viva={false}): no és cap avís nou, és
                l'explicació d'una eixida. Només quan el servidor no hi és (avís
                «no respon» o mode de proves triat). Mentre se sonda, el botó
                espera: una sonda que respon recarrega en remot. */}
            {potEntrarComAPilot && (servidorCaigut || entradaSuspesa) ? (
              <Alerta
                to="info"
                viva={false}
                titol="Entra com a persona pilot · només en aquest ordinador"
                accions={(
                  <Boto varietat="secundari" disabled={sondant || busyStep !== null} onClick={entraPilot}>
                    Entra com a persona pilot
                  </Boto>
                )}
              >
                Per a provar l’app per dins sense el servidor del poble, pots entrar com a {PERSONA_PILOT.nom}, la persona pilot de les dades de mostra. És una sessió de prova: només viu en esta pestanya d’aquest ordinador, no passa pel servidor i no dona cap permís real. Només apareix en desenvolupament.
              </Alerta>
            ) : null}

            {/* Encàrrec 261018_1220 · En desenvolupament i en remot: l'accés
                pilot d'un sol clic (passa al mode de proves i hi entra). */}
            {potPassarAProves ? (
              <Alerta
                to="info"
                viva={false}
                titol="Accés pilot de desenvolupament · només en aquest ordinador"
                accions={(
                  <Boto varietat="secundari" disabled={busyStep !== null} onClick={passaAProvesIEntra}>
                    Entra com a {PERSONA_PILOT.nom}
                  </Boto>
                )}
              >
                Per a provar l’app per dins sense contrasenya, entra com a {PERSONA_PILOT.nom}, la persona pilot, amb les seues organitzacions. La pàgina es recarrega en mode de proves (dades de mostra): no passa pel servidor del poble ni dona cap permís real. Per a tornar al compte de veres, ix de la sessió i entra ací amb Google o amb el correu. Només apareix en desenvolupament.
              </Alerta>
            ) : null}

            {/* Fase D (261020, tasca 1) · A l'app nativa, el full d'Apple i de
                Google en lloc del Google web; sense cap botó, ni targeta ni divisor. */}
            {esNatiu && proveidorsNatius.length ? (
              <>
                <EntradaNativa
                  proveidors={proveidorsNatius}
                  t={tr}
                  enCurs={busyStep?.startsWith('natiu:') ? busyStep.slice(6) : null}
                  bloquejat={natiuBloquejat}
                  error={errorNatiu}
                  onEntra={entraNatiu}
                  onCancela={cancelaNatiu}
                  refBoto={desaBotoNatiu}
                />
                <Divisor text={tr('section.login.nativa.divisor')} />
              </>
            ) : null}

            {esNatiu ? null : (
            <section className="sp-card sp-card--onboarding">
              <div className="sp-card-body">
                <h3>Accés ràpid amb Google</h3>
                {enMarcAlie ? (
                  /* B · L'enllaç obri una pestanya nova (mai la finestra de dalt),
                     sense opener ni referent. Si el marc no deixa obrir-ne,
                     l'adreça es pot copiar. */
                  <Alerta
                    to="info"
                    accions={adrecaFora ? (
                      <a className="sdp-boto sdp-boto--secundari" href={adrecaFora} target="_blank" rel="noopener noreferrer">
                        <span>Obri en una pestanya nova</span>
                      </a>
                    ) : null}
                  >
                    <p><strong>Dins d’este marc no es pot entrar amb Google.</strong> Obri Sóc de Poble en una pestanya nova per a entrar.</p>
                    {adrecaFora ? <p>Si no s’obri, copia l’adreça: <code>{adrecaFora}</code></p> : null}
                  </Alerta>
                ) : (
                  <>
                    <p>
                      Crea o entra al teu compte amb un sol clic sense contrasenyes.
                    </p>
                    {/* Encàrrec 261018_1220 (Tasca 2, ordre del Mestre: «destacar
                        el botó Entrar amb Google com a via preferent d'un sol
                        clic») · Primari: és l'acció principal de la pàgina. */}
                    <div className="onboarding-card__action--ple">
                      <button
                        ref={botoGoogle}
                        type="button"
                        className="sdp-boto sdp-boto--primari sdp-boto--ple"
                        onClick={googleLogin}
                        disabled={(canviDeModePendent && !simulaLocal) || busyStep !== null}
                        aria-busy={busyStep === 'google' ? 'true' : undefined}
                      >
                        {busyStep === 'google' ? <LoaderCircle className="sdp-boto__gir" size={18} aria-hidden="true" /> : null}
                        Entrar amb Google
                      </button>
                    </div>
                    {busyStep === 'google' ? (
                      <Alerta
                        to="info"
                        accions={<Boto varietat="secundari" onClick={cancelaGoogle}>Cancel·la l’entrada</Boto>}
                      >
                        Acaba l’entrada a la finestra de Google. Si l’has tancada o no la trobes, cancel·la-la ací.
                      </Alerta>
                    ) : null}
                  </>
                )}
                {googleError && (
                  <div className="sdp-alerta sdp-alerta--error" role="alert">
                    {googleError}
                  </div>
                )}
              </div>
            </section>
            )}

            {/* Revisió adversarial (261018) · Neutre: davall hi ha Entrar i Crear compte. */}
            {esNatiu ? null : <Divisor text="O amb el teu correu" />}
          </>
        )}

        {activeStep === 0 ? (
          <RegistrationStep
            modeInicial={obreRecuperacio ? 'recuperar' : (modeForcat ?? modeInicial)}
            /* Correcció de la revisió T1–T4 (260930) · Gira només mentre sonda o
               envia; en mode de proves el formulari queda desactivat sense gir
               (no s'envien credencials en mode local). */
            isBusy={sondant || busyStep === 'register'}
            bloquejat={canviDeModePendent && !simulaLocal}
            error={errorEntrada?.text ?? ''}
            codiError={errorEntrada?.codi ?? null}
            accionsError={potTornarAProves
              ? <Boto varietat="secundari" onClick={tornaAProves}>Tornar al mode de proves</Boto>
              : null}
            confirmationEmail={confirmationEmail}
            onRegister={handleRegister}
            onLogin={handleLogin}
            onClearError={() => setErrorEntrada(null)}
            onTornar={() => setConfirmationEmail('')}
            onRecupera={potRecuperar ? demanaRecuperacio : null}
            introEntrada={introEntradaNativa}
          />
        ) : null}
        {activeStep === 0 && esNatiu ? benvinguda : null}
      </div>
    </UniversalPage>
  );
}
