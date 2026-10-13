import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useNavigate, useRouter } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Alerta, Boto, Divisor } from '../../components/PedraSeca/index.js';
import { MARCA_SENSE_ENTRADA_AUTOMATICA, codiDEntrada, missatgeDEntrada } from './onboardingModel.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useUIState } from '../../app/contexts/UIContext';
import { RegistrationStep } from './OnboardingSteps.jsx';
import { ContrasenyaNovaStep, EnllacPerdutStep } from './RecuperacioSteps.jsx';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { eleccioRemotaActiva, enterRemoteMode, exitRemoteMode } from '../../config/dataMode.js';
import { RUTA_DESPRES_D_ENTRAR, aterratgeDespresDEntrar, modeDEntrada } from '../../config/rutaEntrada.js';
import { delEfimer, getEfimer, setEfimer } from '../../config/storage.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { ESTAT_ENLLAC } from '../../data/recuperacioPendent.js';
import { cancelAuthAttempts } from '../../data/authAttempt.js';
import { CODI_ENTRADA_EN_MARC, googleEnMarcAlie, urlPerAObrirFora } from '../../data/oauthRelay.js';

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
function consumixMarcaSenseEntrada() {
  try {
    if (getEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA, null) == null) return false;
    delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA);
    return true;
  } catch {
    return false;
  }
}

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
    enllacDeRecuperacio, oblidaEnllacDeRecuperacio
  } = useSession();
  const { externalConfig } = useUIState();
  const normalizedConfig = normalizeBackendConfig(externalConfig);
  const modeDades = normalizedConfig.dataMode;

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
  const tornaAEntrar = () => { setObreRecuperacio(false); oblidaEnllac(); };
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
        lead="Entra per a participar. A l'interior podràs configurar la teua identitat i gestionar grups o empreses."
        labels={['Online-First', 'Perfil privat', 'RGPD Segur']}
        chrome="system"
        showLogos={true}
      >
        <div className="content-wrapper">{pas}</div>
      </UniversalPage>
    );
  }

  return (
    <UniversalPage
      title="Benvinguda al Mas Electrònic"
      lead="Entra per a participar. A l'interior podràs configurar la teua identitat i gestionar grups o empreses."
      labels={['Online-First', 'Perfil privat', 'RGPD Segur']}
      chrome="system"
      showLogos={true}
    >
      <div className="content-wrapper">
        {activeStep === 0 && (
          <>
            <div className="onboarding-benvinguda">
              <h3>Benvinguda a la Beta de Sóc de Poble</h3>
              <p className="onboarding-card__intro onboarding-card__intro--espaiada">
                L'accés és <strong>totalment segur</strong> i les teues dades estan protegides per llei (RGPD Llei 05).
                Com que estem en proves, t'agrairem que ens avises si trobes algun problema, especialment al mòbil. Et mantindrem al dia de les novetats!
              </p>
            </div>

            {servidorCaigut && !simulaLocal ? (
              <Alerta
                to="avis"
                accions={<>
                  <Boto varietat="secundari" carregant={sondant} onClick={sondaIEntra}>Torna-ho a provar</Boto>
                  {(modeDades === 'local' || modeDades === 'seed') ? (
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
                    <div className="onboarding-card__action--ple">
                      <button
                        ref={botoGoogle}
                        type="button"
                        className="sdp-boto sdp-boto--secundari sdp-boto--ple"
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

            <Divisor text="O entra amb el teu correu" />
          </>
        )}

        {activeStep === 0 ? (
          <RegistrationStep
            modeInicial={obreRecuperacio ? 'recuperar' : modeInicial}
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
          />
        ) : null}
      </div>
    </UniversalPage>
  );
}
