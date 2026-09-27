import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Divisor } from '../../components/PedraSeca/index.js';
import { readableBackendError } from './onboardingModel.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useUIState } from '../../app/contexts/UIContext';
import { RegistrationStep } from './OnboardingSteps.jsx';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { enterRemoteMode } from '../../config/dataMode.js';

export default function OnboardingSection() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle, loginWithPassword, registerWithPassword } = useSession();
  const { externalConfig } = useUIState();
  const normalizedConfig = normalizeBackendConfig(externalConfig);
  const modeDades = normalizedConfig.dataMode;
  const [busyStep, setBusyStep] = useState(null);
  const [googleError, setGoogleError] = useState('');
  const [error, setError] = useState('');
  const canviDeModeDemanat = useRef(false);
  const canviDeModePendent = modeDades !== 'remote';
  // Entrar o registrar-se és l'elecció de dades reals. El formulari conserva
  // el circuit directe; el nou document establix el scope abans de rebre credencials.
  useEffect(() => {
    if (!canviDeModePendent || canviDeModeDemanat.current) return;
    canviDeModeDemanat.current = true;
    try { enterRemoteMode(normalizeBackendConfig(externalConfig)); }
    catch (err) { setError(readableBackendError(err)); }
  }, [canviDeModePendent, externalConfig]);
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

  useEffect(() => {
    if (currentUser && modeDades === 'remote') {
      const tornar = new URLSearchParams(window.location.search).get('tornar');
      navigate(tornar && tornar.startsWith('/') && !tornar.startsWith('//') ? tornar : '/el-meu-perfil', { replace: true });
    }
  }, [currentUser, modeDades, navigate]);

  const activeStep = 0;

  const handleRegister = async (fields) => {
    const op = obriIntent('register');
    setError('');
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
      if (op.viu()) setError(readableBackendError(err));
    } finally {
      op.tanca();
    }
  };

  const handleLogin = async (fields) => {
    const op = obriIntent('register');
    setError('');
    try {
      await loginWithPassword(fields.email, fields.password, externalConfig);
      if (!op.viu()) return;
      showToast('Benvingut de nou al Mas!', 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } catch (err) {
      if (op.viu()) setError(readableBackendError(err));
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
      if (op.viu()) setGoogleError(readableBackendError(loginError));
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
            
            <Divisor text="O completar els 3 passos manuals" />
          </>
        )}

        {activeStep === 0 ? (
          <RegistrationStep
            isBusy={canviDeModePendent || busyStep === 'register'}
            error={error}
            confirmationEmail={confirmationEmail}
            onRegister={handleRegister}
            onLogin={handleLogin}
            onClearError={() => setError('')}
            onTornar={() => setConfirmationEmail('')}
          />
        ) : null}
      </div>
    </UniversalPage>
  );
}
