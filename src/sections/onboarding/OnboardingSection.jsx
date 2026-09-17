import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { showToast } from '../../components/universal/AvisadorEfimer.jsx';
import { createOnboardingSeed } from '../../data/appSeed.js';
import { Divisor } from '../../components/PedraSeca/index.js';
import {
  createOrganization,
  listMyOrganizations,
  loginWithGoogle,
  registerWithPassword,
  loginWithPassword
} from '../../data/backendPort.js';
import {
  findSeedOrganization,
  readableBackendError
} from './onboardingModel.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useUIState } from '../../app/contexts/UIContext';
import { RegistrationStep } from './OnboardingSteps.jsx';

export default function OnboardingSection() {
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const { externalConfig } = useUIState();
  const seed = useMemo(() => createOnboardingSeed(), []);
  const [organizations, setOrganizations] = useState([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  const [busyStep, setBusyStep] = useState(null);
  const [googleError, setGoogleError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      const tornar = new URLSearchParams(window.location.search).get('tornar');
      navigate(tornar && tornar.startsWith('/') && !tornar.startsWith('//') ? tornar : '/jo/el-meu-perfil', { replace: true });
    }
  }, [currentUser, navigate]);

  const activeStep = 0;

  const loadOrganizations = useCallback(async (signal) => {
    if (!currentUser?.id) {
      setOrganizations([]);
      return;
    }
    setIsLoadingOrganizations(true);
    setError('');
    try {
      const rows = await listMyOrganizations({ ...externalConfig, signal });
      if (!signal.aborted) setOrganizations(rows);
    } catch (loadError) {
      if (!signal.aborted) setError(readableBackendError(loadError));
    } finally {
      if (!signal.aborted) setIsLoadingOrganizations(false);
    }
  }, [currentUser?.id, externalConfig]);

  useEffect(() => {
    const controller = new AbortController();
    loadOrganizations(controller.signal);
    return () => controller.abort();
  }, [loadOrganizations]);

  const handleRegister = async (fields) => {
    setBusyStep('register');
    setError('');
    try {
      await registerWithPassword(fields.email, fields.password, { full_name: fields.name, avatar_url: fields.avatar_url, accepta_rgpd: Boolean(fields.rgpd) }, externalConfig);
      showToast('Compte creat. Si cal, comprova el teu correu.', 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } catch (err) {
      setError(readableBackendError(err));
    } finally {
      setBusyStep(null);
    }
  };

  const handleLogin = async (fields) => {
    setBusyStep('register');
    setError('');
    try {
      await loginWithPassword(fields.email, fields.password, externalConfig);
      showToast('Benvingut de nou al Mas!', 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } catch (err) {
      setError(readableBackendError(err));
    } finally {
      setBusyStep(null);
    }
  };

  const googleLogin = async () => {
    setBusyStep('register');
    setGoogleError('');
    try {
      await loginWithGoogle(externalConfig);
      showToast('Benvingut de nou al Mas!', 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } catch (loginError) {
      setGoogleError(readableBackendError(loginError));
    } finally {
      setBusyStep(null);
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
        {activeStep === 0 && !isLoadingOrganizations && (
          <>
            <section className="sp-card sp-card--onboarding">
              <div className="sp-card-body">
                <h3>Accés ràpid amb Google</h3>
                <p>
                  Crea o entra al teu compte amb un sol clic sense contrasenyes.
                </p>
                <p className="onboarding-card__intro onboarding-card__intro--espaiada">
                  En entrar o crear compte, acceptes el tractament de dades (RGPD Llei 05) per a Sóc de Poble. 
                  També comprens que estem en <strong>fase Beta</strong> (proves) i que les teues dades podrien patir reinicis o pèrdues.
                </p>
                <div className="onboarding-card__action--ple">
                  <button 
                    type="button" 
                    className="sdp-boto sdp-boto--secundari sdp-boto--ple" 
                    onClick={googleLogin}
                    disabled={busyStep === 'register'}
                  >
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

        {isLoadingOrganizations ? (
          <div className="sdp-carregant" role="status" aria-live="polite">
            <span className="sdp-carregant__gir" aria-hidden="true" />
            <span>Comprovant el teu progrés…</span>
          </div>
        ) : activeStep === 0 ? (
          <RegistrationStep
            isBusy={busyStep === 'register'}
            error={error}
            onRegister={handleRegister}
            onLogin={handleLogin}
            onClearError={() => setError('')}
          />
        ) : null}
      </div>
    </UniversalPage>
  );
}
