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
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { eleccioRemotaActiva, enterRemoteMode, exitRemoteMode } from '../../config/dataMode.js';
import { RUTA_DESPRES_D_ENTRAR, modeDEntrada } from '../../config/rutaEntrada.js';
import { delEfimer, getEfimer, setEfimer } from '../../config/storage.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';

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
  const { currentUser, loginWithGoogle, loginWithPassword, registerWithPassword, teCapacitat, comprovaServidor } = useSession();
  const { externalConfig } = useUIState();
  const normalizedConfig = normalizeBackendConfig(externalConfig);
  const modeDades = normalizedConfig.dataMode;
  const [busyStep, setBusyStep] = useState(null);
  const [googleError, setGoogleError] = useState('');
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
     finestra i Google per redirecció (el relé torna a /registre). */
  useEffect(() => {
    if (currentUser && modeDades === 'remote') navigate(RUTA_DESPRES_D_ENTRAR, { replace: true });
  }, [currentUser, modeDades, navigate]);

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
      if (op.viu()) setGoogleError(missatgeDEntrada(loginError));
    } finally {
      op.tanca();
    }
  };

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

            {servidorCaigut ? (
              <Alerta
                to="avis"
                accions={<Boto varietat="secundari" carregant={sondant} onClick={sondaIEntra}>Torna-ho a provar</Boto>}
              >
                El servidor del poble no respon ara mateix. Continues en mode de proves: pots explorar l’app, però encara no pots crear el compte ni entrar.
              </Alerta>
            ) : null}

            {entradaSuspesa && !servidorCaigut ? (
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
                <p>
                  Crea o entra al teu compte amb un sol clic sense contrasenyes.
                </p>
                <div className="onboarding-card__action--ple">
                  <button
                    type="button"
                    className="sdp-boto sdp-boto--secundari sdp-boto--ple"
                    onClick={googleLogin}
                    disabled={canviDeModePendent || busyStep !== null}
                    aria-busy={busyStep === 'google' ? 'true' : undefined}
                  >
                    {busyStep === 'google' ? <LoaderCircle className="sdp-boto__gir" size={18} aria-hidden="true" /> : null}
                    Entrar amb Google
                  </button>
                </div>
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
            modeInicial={modeInicial}
            /* Correcció de la revisió T1–T4 (260930) · Gira només mentre sonda o
               envia; en mode de proves el formulari queda desactivat sense gir
               (no s'envien credencials en mode local). */
            isBusy={sondant || busyStep === 'register'}
            bloquejat={canviDeModePendent}
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
          />
        ) : null}
      </div>
    </UniversalPage>
  );
}
