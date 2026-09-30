import { useRef, useState } from 'react';
import { ArrowRight, MailCheck, UserRound, LoaderCircle } from 'lucide-react';
import { toDeLErrorDEntrada, validateRegistration } from './onboardingModel.js';
import { Alerta, ControlContrasenya, PillToggle } from '../../components/PedraSeca/index.js';
import { UniversalCard } from '../../components/universal/../PedraSeca';

/* T4 (ordre del Mestre, 260930) · El mode de la consulta (?mode=entrar|crear,
   src/config/rutaEntrada.js) al mode intern del formulari. */
const modeDelFormulari = (modeInicial) => (modeInicial === 'entrar' ? 'login' : 'register');

/**
 * T4 · `modeInicial` ('entrar' | 'crear') obri el formulari en eixe mode; si
 * canvia amb el formulari muntat (una altra porta cap a /registre), el segueix
 * mentre no hi ha cap enviament en curs. `codiError` (CODI_ENTRADA) tria el to
 * de l'Alerta i `accionsError` hi afig botons (tornar al mode de proves).
 *
 * Correcció de la revisió T1–T4 (260930) · `isBusy` és una faena en curs
 * (sonda o enviament): desactiva i fa girar el botó. `bloquejat` només
 * desactiva, sense gir: el formulari que encara no pot enviar res (mode de
 * proves, servidor caigut) no anuncia una faena que no s'està fent.
 */
export function RegistrationStep({ isBusy, bloquejat = false, error, codiError = null, accionsError = null, modeInicial = 'crear', confirmationEmail, onRegister, onLogin, onClearError, onTornar }) {
  const [mode, setMode] = useState(() => modeDelFormulari(modeInicial));
  const [modeRebut, setModeRebut] = useState(modeInicial);
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '', rgpd: false });
  const [errors, setErrors] = useState({});
  const enviant = useRef(false);
  const desactivat = Boolean(isBusy || bloquejat);
  /* Ajust en pintar (no en un efecte): el formulari no es pinta mai en el mode vell. */
  if (modeRebut !== modeInicial) {
    setModeRebut(modeInicial);
    if (!desactivat) {
      setMode(modeDelFormulari(modeInicial));
      setErrors({});
    }
  }

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setFields((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (onClearError && error) onClearError();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (desactivat || enviant.current) return;
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
      enviant.current = true;
      try {
        await onRegister(fields);
        /* Les dues: un reintent no hereta mitja parella de contrasenyes. */
        setFields((current) => ({ ...current, password: '', confirmPassword: '' }));
      } finally { enviant.current = false; }
    } else {
      const nextErrors = {};
      const email = fields.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Escriu un correu electrònic vàlid.';
      if (!fields.password) nextErrors.password = 'Contrasenya obligatòria';
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      enviant.current = true;
      try { await onLogin({ email, password: fields.password }); }
      finally { enviant.current = false; }
    }
  };

  /* I4 · Sense recarregar: el formulari torna en mode d'entrada, amb el
     correu que ja s'havia escrit. */
  const jaConfirmat = () => {
    setMode('login');
    setErrors({});
    if (onTornar) onTornar();
    else window.location.reload();
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
            <p className="sdp-camp" role="status">
              Hem enviat l’enllaç de confirmació a <strong>{confirmationEmail}</strong>.
              Quan l’hages confirmat, torna ací i entra amb el teu correu i la contrasenya.
            </p>
            <div className="onboarding-card__action--ple">
              <button type="button" className="sdp-boto sdp-boto--secundari sdp-boto--ple" onClick={jaConfirmat}>
                Ja l’he confirmat: entrar <ArrowRight size={18} aria-hidden="true" />
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

          <div className="sdp-pindola--centrada onboarding-form__pindola">
            <PillToggle
              etiqueta="Opcions d’accés"
              disabled={desactivat}
              valor={mode}
              onCanvi={(v) => { if (desactivat || enviant.current) return; setMode(v); setErrors({}); onClearError?.(); }}
              opcions={[
                { valor: 'login', text: 'Entrar' },
                { valor: 'register', text: 'Crear compte' },
              ]}
            />
          </div>

          {error ? <Alerta to={toDeLErrorDEntrada(codiError)} accions={accionsError}>{error}</Alerta> : null}

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
                  disabled={desactivat}
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
                disabled={desactivat}
              />
              {errors.email ? <p id="onboarding-email-error" className="sdp-camp__error">{errors.email}</p> : null}
            </div>

            <div className={errors.password ? 'sdp-camp ' : 'sdp-camp'}>
              <label className="sdp-camp__etiqueta" htmlFor="reg-password">Contrasenya</label>
              <ControlContrasenya
                id="reg-password"
                name="password"
                value={fields.password}
                onChange={updateField}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                minLength={mode === 'register' ? 10 : undefined}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={mode === 'register' ? 'onboarding-password-help' : errors.password ? 'onboarding-login-password-error' : undefined}
                disabled={desactivat}
              />
              {mode === 'register' && (
                <p id="onboarding-password-help" className={errors.password ? 'sdp-camp__error' : 'sdp-camp__ajuda'}>
                  {errors.password || 'Mínim 10 caràcters. No reutilitzes una contrasenya antiga.'}
                </p>
              )}
              {mode === 'login' && errors.password && (
                <p id="onboarding-login-password-error" className="sdp-camp__error">{errors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <div className={errors.confirmPassword ? 'sdp-camp ' : 'sdp-camp'}>
                <label className="sdp-camp__etiqueta" htmlFor="reg-confirm-password">Confirmar contrasenya</label>
                <ControlContrasenya
                  id="reg-confirm-password"
                  etiquetaUll="Mostra la confirmació de la contrasenya"
                  name="confirmPassword"
                  value={fields.confirmPassword}
                  onChange={updateField}
                  autoComplete="new-password"
                  minLength={10}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'onboarding-confirm-password-error' : undefined}
                  disabled={desactivat}
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
                  disabled={desactivat}
                  className="sdp-casella__control"
                />
                <label htmlFor="reg-rgpd" className="sdp-casella__etiqueta">
                  Consent el tractament de dades personals (RGPD Llei 05) exclusivament per a Sóc de Poble.
                </label>
                {errors.rgpd ? <p id="onboarding-rgpd-error" className="sdp-camp__error">{errors.rgpd}</p> : null}
              </div>
            )}

            <div className="onboarding-card__action--ple">
              <button type="submit" className="sdp-boto sdp-boto--secundari sdp-boto--ple" disabled={desactivat}>
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
