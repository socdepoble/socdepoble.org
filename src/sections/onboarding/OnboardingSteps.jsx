import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, MailCheck, UserRound, LoaderCircle } from 'lucide-react';
import {
  LONGITUD_MINIMA_CONTRASENYA, netejaUsernameEnEscriure, normalitzaUsername, proposaUsername, toDeLErrorDEntrada,
  validaUsername, validateRegistration
} from './onboardingModel.js';
import { CampsDIdentitatALAlta } from './CampsDIdentitatALAlta.jsx';
import { Alerta, Boto, ControlContrasenya, PillToggle } from '../../components/PedraSeca/index.js';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { ESTAT_RECUPERACIO_INICIAL, RecuperacioStep } from './RecuperacioSteps.jsx';
import { createTranslator } from '../../config/i18n.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';

/* Gauntlet 261025_0545 (TE-01) · El formulari parla la llengua triada: els
   textos passen pel traductor `t` (el de la interfície, des
   d'OnboardingSection); sense, el valencià de sempre. La reserva escrita al
   codi és el valor valencià del diccionari, i les claus que ja hi eren
   (section.login.loginEmail, …) tornen a tindre qui les cride. Els errors de
   validateRegistration (onboardingModel.js) no són d'ací. */
const TRADUCTOR_DE_RESERVA = createTranslator('ca');

/* T4 (ordre del Mestre, 260930) · El mode de la consulta (?mode=entrar|crear,
   src/config/rutaEntrada.js) al mode intern del formulari. R2 (261003) ·
   'recuperar' no ve mai de la URL (rutaEntrada.js no l'admet): el passa
   OnboardingSection per a «Demana un enllaç nou», i només si hi ha recuperació. */
const modeDelFormulari = (modeInicial, potRecuperar = false) => {
  if (modeInicial === 'recuperar') return potRecuperar ? 'recuperar' : 'login';
  return modeInicial === 'entrar' ? 'login' : 'register';
};

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
 *
 * R (Onada 3, 261003) · `onRecupera(correu)` (promesa) només arriba si el
 * backend té la capacitat 'recuperacioContrasenya'. Amb ella, el mode «Entrar»
 * guanya «Has oblidat la contrasenya?», que obri la vista de recuperació com
 * un mode intern més (com Entrar i Crear compte, sense URL): el correu escrit
 * es conserva en anar i en tornar. Sense ella, el formulari no canvia.
 * Correcció de la revisió: l'espera abans de reenviar i l'avís d'enviat també
 * es guarden ací, perquè tornar a «Entrar» i obrir la vista de nou no els
 * reinicie; en tornar, el focus va al correu.
 * R2 (261003) · `modeInicial` 'recuperar' obri directament eixa vista: és el
 * «Demana un enllaç nou» de la pantalla d'un enllaç caducat o perdut.
 *
 * Fase D (261020, revisió) · L2 · `introEntrada` (opcional): a l'app nativa,
 * l'explicació d'«Entra al teu compte», que nomena el botó de dalt (Apple o
 * Google) en lloc del Google web. Sense, el text de sempre.
 *
 * Gauntlet 261025_0545 (TE-01) · `t` (opcional): el traductor de la interfície,
 * que també rep la vista de recuperació. Sense, el valencià de sempre.
 *
 * P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre, 261028) · Crear
 * compte proposa l'identificador @usuari (proposaUsername, la regla del
 * servidor) i el va seguint mentre s'escriu el nom; quan la persona l'edita,
 * mana el seu, i buidar-lo torna a la proposta. Només un identificador
 * editat arriba a `onRegister` (`username`): sense, el servidor el fa del
 * nom, que és el mateix. El poble ve preseleccionat (La Torre de les
 * Maçanes, si és al catàleg) i va a `poble`; si el catàleg no la porta,
 * «Tria un poble…» i cap poble fins que la persona en tria un; sense catàleg
 * (useCoreContent buit) no es pinta. Sense poble, el servidor hi posa el de
 * sèrie.
 */
export function RegistrationStep({ isBusy, bloquejat = false, error, codiError = null, accionsError = null, modeInicial = 'crear', confirmationEmail, onRegister, onLogin, onClearError, onTornar, onRecupera = null, introEntrada = null, t = TRADUCTOR_DE_RESERVA }) {
  const potRecuperar = typeof onRecupera === 'function';
  const [mode, setMode] = useState(() => modeDelFormulari(modeInicial, potRecuperar));
  const [modeRebut, setModeRebut] = useState(modeInicial);
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '', rgpd: false, username: '', poble: '' });
  const [usernameTocat, setUsernameTocat] = useState(false);
  const { towns } = useCoreContent();
  const pobles = useMemo(() => [...new Set((Array.isArray(towns) ? towns : [])
    .map((town) => (typeof town?.title === 'string' ? town.title.trim() : '')).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ca')), [towns]);
  /* Només La Torre ve preseleccionada; si el catàleg no la porta, cap poble
     triat per la persona (el servidor hi posa el de sèrie). */
  const pobleTriat = fields.poble || (pobles.includes(POBLE_FUNDACIONAL) ? POBLE_FUNDACIONAL : '');
  const usernameVist = usernameTocat ? fields.username : (fields.name.trim() ? proposaUsername(fields.name) : '');
  const [errors, setErrors] = useState({});
  const [estatRecuperacio, setEstatRecuperacio] = useState(ESTAT_RECUPERACIO_INICIAL);
  const enviant = useRef(false);
  const correuRef = useRef(null);
  const tornaDeRecuperacio = useRef(false);
  const desactivat = Boolean(isBusy || bloquejat);

  /* Accessibilitat: el botó «Torna a entrar» ja no hi és; el focus, al correu. */
  useEffect(() => {
    if (mode !== 'login' || !tornaDeRecuperacio.current) return;
    tornaDeRecuperacio.current = false;
    correuRef.current?.focus();
  }, [mode]);
  /* Ajust en pintar (no en un efecte): el formulari no es pinta mai en el mode vell. */
  if (modeRebut !== modeInicial) {
    setModeRebut(modeInicial);
    if (!desactivat) {
      setMode(modeDelFormulari(modeInicial, potRecuperar));
      setErrors({});
    }
  }

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === 'username') {
      const net = netejaUsernameEnEscriure(value);
      setUsernameTocat(net !== '');
      setFields((current) => ({ ...current, username: net }));
      setErrors((current) => ({ ...current, username: undefined }));
      if (onClearError && error) onClearError();
      return;
    }
    setFields((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (onClearError && error) onClearError();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (desactivat || enviant.current) return;
    if (mode === 'register') {
      const nextErrors = validateRegistration(fields);
      const username = usernameTocat ? normalitzaUsername(fields.username) : '';
      const motiuUsername = username ? validaUsername(username) : null;
      if (motiuUsername) nextErrors.username = motiuUsername;
      if (fields.password !== fields.confirmPassword) {
        nextErrors.confirmPassword = t('section.login.registre.errorContrasenyes', 'Les contrasenyes no coincidixen');
      }
      if (!fields.rgpd) {
        nextErrors.rgpd = t('section.login.registre.errorRgpd', 'Has d’acceptar la política de privacitat per continuar.');
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      enviant.current = true;
      try {
        await onRegister({ ...fields, username, poble: pobleTriat });
        /* Les dues: un reintent no hereta mitja parella de contrasenyes. */
        setFields((current) => ({ ...current, password: '', confirmPassword: '' }));
      } finally { enviant.current = false; }
    } else {
      const nextErrors = {};
      const email = fields.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = t('section.login.registre.errorCorreu', 'Escriu un correu electrònic vàlid.');
      if (!fields.password) nextErrors.password = t('section.login.registre.errorContrasenya', 'Contrasenya obligatòria');
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

  const obriRecuperacio = () => {
    if (desactivat || enviant.current) return;
    setMode('recuperar');
    setErrors({});
    onClearError?.();
  };

  if (mode === 'recuperar' && typeof onRecupera === 'function' && !confirmationEmail) {
    return (
      <RecuperacioStep
        correu={fields.email}
        onCanviCorreu={(email) => setFields((current) => ({ ...current, email }))}
        onEnvia={onRecupera}
        onTorna={() => { tornaDeRecuperacio.current = true; setMode('login'); setErrors({}); }}
        bloquejat={bloquejat}
        estat={estatRecuperacio}
        onEstat={setEstatRecuperacio}
        t={t}
      />
    );
  }

  if (confirmationEmail) {
    /* El correu va en <strong> al mig de la frase: es partix pel {forat}, sense String.replace. */
    const [abansCorreu, despresCorreu] = t('section.login.registre.enviatText', 'Hem enviat l’enllaç de confirmació a {correu}. Quan l’hages confirmat, torna ací i entra amb el teu correu i la contrasenya.').split('{correu}');
    return (
      <UniversalCard
        variant="onboarding"
        icon={<MailCheck size={28} />}
        subtitle={t('section.login.registre.enviatSubtitol', 'Correu enviat')}
        title={t('section.login.registre.enviatTitol', 'Confirma el teu compte')}
        body={
          <>
            <p className="sdp-camp" role="status">
              {/* Gauntlet 261030 (cicle 2) · translate="no": el correu no va mai a cap traductor (blocsTraduibles, el del navegador). */}
              {abansCorreu}<strong translate="no">{confirmationEmail}</strong>{despresCorreu}
            </p>
            <div className="onboarding-card__action--ple">
              <button type="button" className="sdp-boto sdp-boto--secundari sdp-boto--ple" onClick={jaConfirmat}>
                {t('section.login.registre.jaConfirmat', 'Ja l’he confirmat: entrar')} <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </>
        }
      />
    );
  }

  /* Encàrrec 261018_1220 (Tasca 2, ordre del Mestre: «el formulari ha de
     distingir nítidament entre Entrar i Crear compte») · El títol i
     l'explicació diuen el mode triat. En Entrar, l'explicació avisa del cas
     que fa caure més entrades: un compte nascut amb Google no té contrasenya. */
  const entrant = mode === 'login';
  return (
    <UniversalCard
      variant="onboarding"
      title={entrant ? t('section.login.registre.titolEntrar', 'Entra al teu compte') : t('section.login.registre.titolCrear', 'Crea el teu compte')}
      body={
        <>
          {entrant ? (
            <p className="onboarding-card__intro">
              {introEntrada || t('section.login.registre.introEntrar', 'Entra amb el correu i la contrasenya del teu compte. Si el vas crear amb Google, no té contrasenya: entra amb Google.')}
            </p>
          ) : (
            <p className="onboarding-card__intro">
              {t('section.login.registre.introCrear', 'Primer entra una persona real. El teu perfil queda privat i separat de les organitzacions que crearàs després.')}
            </p>
          )}

          <div className="sdp-pindola--centrada onboarding-form__pindola">
            <PillToggle
              etiqueta={t('section.login.registre.opcions', 'Opcions d’accés')}
              disabled={desactivat}
              valor={mode}
              onCanvi={(v) => { if (desactivat || enviant.current) return; setMode(v); setErrors({}); onClearError?.(); }}
              opcions={[
                { valor: 'login', text: t('section.login.loginTitle', 'Entrar') },
                { valor: 'register', text: t('section.login.registerTitle', 'Crear compte') },
              ]}
            />
          </div>

          {error ? <Alerta to={toDeLErrorDEntrada(codiError)} accions={accionsError}>{error}</Alerta> : null}

          <form className="onboarding-form" onSubmit={submit} noValidate>
            {mode === 'register' && (
              <div className={errors.name ? 'sdp-camp ' : 'sdp-camp'}>
                <label className="sdp-camp__etiqueta" htmlFor="reg-name">{t('section.login.placeholder.name', 'Nom i cognoms')}</label>
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

            {mode === 'register' ? (
              <CampsDIdentitatALAlta
                t={t}
                error={errors.username}
                usuari={usernameVist}
                poble={pobleTriat}
                pobles={pobles}
                onChange={updateField}
                desactivat={desactivat}
              />
            ) : null}
            

            <div className={errors.email ? 'sdp-camp ' : 'sdp-camp'}>
              <label className="sdp-camp__etiqueta" htmlFor="reg-email">{t('section.login.loginEmail', 'Correu electrònic')}</label>
              <input
                ref={correuRef}
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
              <label className="sdp-camp__etiqueta" htmlFor="reg-password">{t('section.login.loginPassword', 'Contrasenya')}</label>
              <ControlContrasenya
                id="reg-password"
                etiquetaUll={t('section.login.registre.ullContrasenya', 'Mostra la contrasenya')}
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
                  {errors.password || t('section.login.registre.ajudaContrasenya', 'Mínim {minim} caràcters. No reutilitzes una contrasenya antiga.')
                    .replace('{minim}', () => String(LONGITUD_MINIMA_CONTRASENYA))}
                </p>
              )}
              {mode === 'login' && errors.password && (
                <p id="onboarding-login-password-error" className="sdp-camp__error">{errors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <div className={errors.confirmPassword ? 'sdp-camp ' : 'sdp-camp'}>
                <label className="sdp-camp__etiqueta" htmlFor="reg-confirm-password">{t('section.login.registre.confirmaContrasenya', 'Confirmar contrasenya')}</label>
                <ControlContrasenya
                  id="reg-confirm-password"
                  etiquetaUll={t('section.login.registre.ullConfirmacio', 'Mostra la confirmació de la contrasenya')}
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
                  {t('section.login.registre.consentiment', 'Consent el tractament de dades personals (RGPD Llei 05) exclusivament per a Sóc de Poble.')}
                </label>
                {errors.rgpd ? <p id="onboarding-rgpd-error" className="sdp-camp__error">{errors.rgpd}</p> : null}
              </div>
            )}

            <div className="onboarding-card__action--ple">
              <button type="submit" className="sdp-boto sdp-boto--secundari sdp-boto--ple" disabled={desactivat}>
                {isBusy ? <LoaderCircle className="sdp-boto__gir" size={18} aria-hidden="true" /> : <UserRound size={18} aria-hidden="true" />}
                <span>{mode === 'login' ? t('section.login.registre.botoEntrar', 'Entrar al compte') : t('section.login.registre.botoCrear', 'Crear el compte')}</span>
              </button>
            </div>

            {mode === 'login' && typeof onRecupera === 'function' ? (
              <div className="onboarding-card__action--ple">
                <Boto varietat="fantasma" ple onClick={obriRecuperacio} disabled={desactivat}>
                  {t('section.login.registre.oblidada', 'Has oblidat la contrasenya?')}
                </Boto>
              </div>
            ) : null}
          </form>
        </>
      }
    />
  );
}
