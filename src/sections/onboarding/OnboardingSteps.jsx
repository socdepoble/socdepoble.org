import { useState } from 'react';
import { ArrowRight, MailCheck, UserRound, LoaderCircle } from 'lucide-react';
import { validateRegistration } from './onboardingModel.js';
import { PillToggle } from '../../components/PedraSeca/PillToggle.jsx';
import { UniversalCard } from '../../components/universal/UniversalElements.jsx';

export function RegistrationStep({ isBusy, error, confirmationEmail, onRegister, onLogin, onClearError }) {
  const [mode, setMode] = useState('register');
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '', rgpd: false });
  const [errors, setErrors] = useState({});

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setFields((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (onClearError && error) onClearError();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (mode === 'register') {
      const nextErrors = validateRegistration(fields);
      if (fields.password !== fields.confirmPassword) {
        nextErrors.confirmPassword = 'Les contrasenyes no coincideixen';
      }
      if (!fields.rgpd) {
        nextErrors.rgpd = 'Has d’acceptar la política de privacitat per continuar.';
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      await onRegister(fields);
      setFields((current) => ({ ...current, password: '' }));
    } else {
      const nextErrors = {};
      if (!fields.email) nextErrors.email = 'Correu obligatori';
      if (!fields.password) nextErrors.password = 'Contrasenya obligatòria';
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      await onLogin({ email: fields.email, password: fields.password });
    }
  };

  if (confirmationEmail) {
    return (
      <UniversalCard
        variant="onboarding"
        icon={<MailCheck size={28} />}
        subtitle="Correu enviat"
        title="Confirma el teu compte"
        body={
          <>
            <p className="sdp-camp">
              Hem enviat l’enllaç de confirmació a <strong>{confirmationEmail}</strong>.
              En confirmar-lo, torna a entrar per continuar amb l’empresa i el grup.
            </p>
            <div className="onboarding-card__action--ple">
              <button type="button" className="sdp-boto sdp-boto--secundari sdp-boto--ple" onClick={() => window.location.reload()}>
                Entés <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </>
        }
      />
    );
  }

  return (
    <UniversalCard
      variant="onboarding"
      title="Accés o nou registre"
      body={
        <>
          <p className="onboarding-card__intro">
            Primer entra una persona real. El teu perfil queda privat i separat de les
            organitzacions que crearàs després.
          </p>
          <p className="onboarding-card__intro onboarding-card__intro--espaiada">
            En entrar o crear compte, acceptes el tractament de dades (RGPD Llei 05) per a Sóc de Poble. 
            També comprens que estem en <strong>fase Beta</strong> (proves) i que les teues dades podrien patir reinicis o pèrdues.
          </p>

          <div className="sdp-pindola--centrada onboarding-form__pindola">
            <PillToggle
              etiqueta="Opcions d’accés"
              valor={mode}
              onCanvi={(v) => { setMode(v); setErrors({}); }}
              opcions={[
                { valor: 'login', text: 'Entrar' },
                { valor: 'register', text: 'Crear compte' },
              ]}
            />
          </div>

          {error ? <div className="sdp-alerta sdp-alerta--error" role="alert">{error}</div> : null}

          <form className="onboarding-form" onSubmit={submit} noValidate>
            {mode === 'register' && (
              <div className={errors.name ? 'sdp-camp ' : 'sdp-camp'}>
                <label className="sdp-camp__etiqueta" htmlFor="reg-name">Nom i cognoms</label>
                <input
                  id="reg-name"
                  className="sdp-control"
                  type="text"
                  name="name"
                  value={fields.name}
                  onChange={updateField}
                  autoComplete="name"
                  maxLength={120}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'onboarding-name-error' : undefined}
                  disabled={isBusy}
                />
                {errors.name ? <p id="onboarding-name-error" className="sdp-camp__error">{errors.name}</p> : null}
              </div>
            )}
            

            <div className={errors.email ? 'sdp-camp ' : 'sdp-camp'}>
              <label className="sdp-camp__etiqueta" htmlFor="reg-email">Correu electrònic</label>
              <input
                id="reg-email"
                className="sdp-control"
                type="email"
                name="email"
                value={fields.email}
                onChange={updateField}
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'onboarding-email-error' : undefined}
                disabled={isBusy}
              />
              {errors.email ? <p id="onboarding-email-error" className="sdp-camp__error">{errors.email}</p> : null}
            </div>

            <div className={errors.password ? 'sdp-camp ' : 'sdp-camp'}>
              <label className="sdp-camp__etiqueta" htmlFor="reg-password">Contrasenya</label>
              <input
                id="reg-password"
                className="sdp-control"
                type="password"
                name="password"
                value={fields.password}
                onChange={updateField}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                minLength={mode === 'register' ? 10 : undefined}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={mode === 'register' ? 'onboarding-password-help' : undefined}
                disabled={isBusy}
              />
              {mode === 'register' && (
                <p id="onboarding-password-help" className={errors.password ? 'sdp-camp__error' : 'sdp-camp__ajuda'}>
                  {errors.password || 'Mínim 10 caràcters. No reutilitzes una contrasenya antiga.'}
                </p>
              )}
              {mode === 'login' && errors.password && (
                <p className="sdp-camp__error">{errors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <div className={errors.confirmPassword ? 'sdp-camp ' : 'sdp-camp'}>
                <label className="sdp-camp__etiqueta" htmlFor="reg-confirm-password">Confirmar contrasenya</label>
                <input
                  id="reg-confirm-password"
                  className="sdp-control"
                  type="password"
                  name="confirmPassword"
                  value={fields.confirmPassword}
                  onChange={updateField}
                  autoComplete="new-password"
                  minLength={10}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'onboarding-confirm-password-error' : undefined}
                  disabled={isBusy}
                />
                {errors.confirmPassword ? <p id="onboarding-confirm-password-error" className="sdp-camp__error">{errors.confirmPassword}</p> : null}
              </div>
            )}

            {mode === 'register' && (
              <div className={errors.rgpd ? 'sdp-casella ' : 'sdp-casella'}>
                <input
                  type="checkbox"
                  name="rgpd"
                  id="reg-rgpd"
                  checked={fields.rgpd}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.rgpd)}
                  aria-describedby={errors.rgpd ? 'onboarding-rgpd-error' : undefined}
                  disabled={isBusy}
                  className="sdp-casella__control"
                />
                <label htmlFor="reg-rgpd" className="sdp-casella__etiqueta">
                  Consent el tractament de dades personals (RGPD Llei 05) exclusivament per a Sóc de Poble.
                </label>
                {errors.rgpd ? <p id="onboarding-rgpd-error" className="sdp-camp__error">{errors.rgpd}</p> : null}
              </div>
            )}

            <div className="onboarding-card__action--ple">
              <button type="submit" className="sdp-boto sdp-boto--secundari sdp-boto--ple" disabled={isBusy}>
                {isBusy ? <LoaderCircle className="sdp-boto__gir" size={18} aria-hidden="true" /> : <UserRound size={18} aria-hidden="true" />}
                <span>{mode === 'login' ? 'Entrar al compte' : 'Crear el compte'}</span>
              </button>
            </div>
          </form>
        </>
      }
    />
  );
}
