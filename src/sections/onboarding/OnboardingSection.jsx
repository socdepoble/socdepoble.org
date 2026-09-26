import { useEffect, useState } from 'react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Divisor } from '../../components/PedraSeca/index.js';
import { readableBackendError } from './onboardingModel.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useUIState } from '../../app/contexts/UIContext';
import { RegistrationStep } from './OnboardingSteps.jsx';

export default function OnboardingSection() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle, loginWithPassword, registerWithPassword } = useSession();
  const { externalConfig } = useUIState();
  const [busyStep, setBusyStep] = useState(null);
  const [googleError, setGoogleError] = useState('');
  const [error, setError] = useState('');
  /* I4 · Si el servidor demana confirmar el correu, el registre torna sense
     sessió: ho diem clar en lloc de celebrar un compte que encara no entra. */
  const [confirmationEmail, setConfirmationEmail] = useState('');

  useEffect(() => {
    if (currentUser) {
      const tornar = new URLSearchParams(window.location.search).get('tornar');
      navigate(tornar && tornar.startsWith('/') && !tornar.startsWith('//') ? tornar : '/el-meu-perfil', { replace: true });
    }
  }, [currentUser, navigate]);

  const activeStep = 0;

  const handleRegister = async (fields) => {
    setBusyStep('register');
    setError('');
    try {
      const resultat = await registerWithPassword(fields.email, fields.password, { full_name: fields.name, avatar_url: fields.avatar_url, accepta_rgpd: Boolean(fields.rgpd), tenant_id: externalConfig.tenantId }, externalConfig);
      if (resultat?.access_token) {
        showToast('Compte creat. Benvinguda al Mas.', 'success');
        window.dispatchEvent(new CustomEvent('sdp:auth-change'));
      } else {
        setConfirmationEmail(String(fields.email || '').trim().toLowerCase());
      }
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

        {activeStep === 0 ? (
          <RegistrationStep
            isBusy={busyStep === 'register'}
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
