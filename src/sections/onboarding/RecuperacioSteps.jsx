/**
 * RecuperacioSteps.jsx — Les dues vistes de la recuperació de contrasenya.
 *
 * R (Onada 3, 261003) · Encàrrec del Mestre: qui perd la contrasenya no es
 * pot quedar bloquejat. Disseny i alternatives:
 * _wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_produccio_claude/R.txt.
 *
 *   RecuperacioStep       «Recupera la contrasenya»: el correu i «Envia
 *                         l'enllaç». El missatge és SEMPRE el mateix, hi haja
 *                         compte o no. Desactivat mentre s'envia i amb una
 *                         espera abans de tornar a enviar.
 *   ContrasenyaNovaStep   «Definix la contrasenya nova». R2 (decisió del Mestre,
 *                         261003): l'enllaç del correu es verifica en prémer
 *                         «Desa», no en arribar; la pantalla és genèrica i no
 *                         diu de quin compte és. Mateixa política que el
 *                         registre, ull a cada camp i les dues iguals.
 *   EnllacPerdutStep      R2 · La pàgina s'ha recarregat i la memòria ja no té
 *                         l'enllaç: cal tornar a obrir-lo des del correu.
 *
 * Cap d'elles crida el backend: reben la promesa de qui les munta
 * (OnboardingSection, pel port). Només peces de Pedra Seca i les classes que
 * ja usa el formulari d'entrada.
 *
 * Correcció de la revisió · L'espera i l'avís d'enviat viuen a qui munta la
 * vista (RegistrationStep): tornar a «Entrar» i obrir-la de nou no les
 * reinicia. En obrir-la, el focus va al correu.
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, KeyRound, LockKeyhole, LogOut, Send } from 'lucide-react';
import { Alerta, Boto, ControlContrasenya, UniversalCard } from '../../components/PedraSeca/index.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import {
  LONGITUD_MINIMA_CONTRASENYA, codiDEntrada, esCorreuValid, missatgeDEntrada, toDeLErrorDEntrada, validaContrasenyaNova
} from './onboardingModel.js';

/* La freqüència mínima per defecte de GoTrue entre dos correus al mateix
   compte: abans, el servidor respondria «massa intents». */
export const ESPERA_REENVIAMENT_MS = 60000;

export const MISSATGE_RECUPERACIO_ENVIADA = 'Si hi ha un compte amb eixe correu, t’arribarà un enllaç per a definir una contrasenya nova. Mira també la carpeta de correu brossa.';

/** L'estat que sobreviu a tancar i tornar a obrir la vista: l'avís d'enviat i fins quan s'espera. */
export const ESTAT_RECUPERACIO_INICIAL = Object.freeze({ enviat: false, esperaFins: 0 });

/* Una resposta que arriba amb la vista desmuntada no pinta res. */
function useViu() {
  const viu = useRef(false);
  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; };
  }, []);
  return viu;
}

/**
 * «Recupera la contrasenya». `correu` és el del formulari d'entrada (es
 * conserva en tornar); `onEnvia(correu)` torna una promesa; `onTorna` torna a
 * «Entrar»; `bloquejat` desactiva sense gir (mode de proves). `estat` i
 * `onEstat(actualitza)` són l'avís d'enviat i l'espera, guardats per qui munta
 * la vista; sense ells, la vista els guarda ella mateixa.
 */
export function RecuperacioStep({
  correu = '', onCanviCorreu, onEnvia, onTorna, bloquejat = false, estat = null, onEstat = null
}) {
  const [enviant, setEnviant] = useState(false);
  const [error, setError] = useState(null);
  const [errorCorreu, setErrorCorreu] = useState('');
  const [estatPropi, setEstatPropi] = useState(ESTAT_RECUPERACIO_INICIAL);
  const extern = typeof onEstat === 'function';
  const { enviat, esperaFins } = (extern ? estat : estatPropi) ?? ESTAT_RECUPERACIO_INICIAL;
  const posaEstat = extern ? onEstat : setEstatPropi;
  /* L'hora d'ara des del muntatge: una espera heretada es compta de seguida. */
  const [ara, setAra] = useState(() => Date.now());
  const enCurs = useRef(false);
  const correuRef = useRef(null);
  const viu = useViu();

  /* Accessibilitat: el botó que l'ha oberta ja no hi és; el focus, al correu. */
  useEffect(() => { correuRef.current?.focus(); }, []);

  const restants = Math.max(0, Math.ceil((esperaFins - ara) / 1000));
  useEffect(() => {
    if (restants <= 0) return undefined;
    const id = setTimeout(() => setAra(Date.now()), 1000);
    return () => clearTimeout(id);
  }, [restants, ara]);

  /* L'espera es desa encara que la vista ja no hi siga: és el que la fa durar. */
  const comencaEspera = (canvis = {}) => {
    const instant = Date.now();
    if (viu.current) setAra(instant);
    posaEstat((actual) => ({ ...(actual ?? ESTAT_RECUPERACIO_INICIAL), ...canvis, esperaFins: instant + ESPERA_REENVIAMENT_MS }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (bloquejat || enCurs.current || restants > 0) return;
    if (!esCorreuValid(correu)) {
      setErrorCorreu('Escriu un correu electrònic vàlid.');
      return;
    }
    setErrorCorreu('');
    setError(null);
    enCurs.current = true;
    setEnviant(true);
    try {
      await onEnvia(String(correu).trim());
      comencaEspera({ enviat: true });
    } catch (err) {
      const codi = codiDEntrada(err);
      if (codi === CODI_ENTRADA.MASSA_INTENTS) comencaEspera();
      if (viu.current) setError({ text: missatgeDEntrada(err), codi });
    } finally {
      enCurs.current = false;
      if (viu.current) setEnviant(false);
    }
  };

  const descripcio = errorCorreu ? 'rec-email-error' : undefined;
  return (
    <UniversalCard
      variant="onboarding"
      icon={<KeyRound size={28} />}
      title="Recupera la contrasenya"
      body={
        <>
          <p className="onboarding-card__intro">
            Escriu el correu del teu compte i t’enviarem un enllaç per a definir una contrasenya nova.
          </p>

          {enviat ? <Alerta to="exit">{MISSATGE_RECUPERACIO_ENVIADA}</Alerta> : null}
          {error ? <Alerta to={toDeLErrorDEntrada(error.codi)}>{error.text}</Alerta> : null}

          <form className="onboarding-form" onSubmit={submit} noValidate>
            <div className="sdp-camp">
              <label className="sdp-camp__etiqueta" htmlFor="rec-email">Correu electrònic</label>
              <input
                ref={correuRef}
                id="rec-email"
                className="sdp-control"
                type="email"
                name="email"
                value={correu}
                onChange={(event) => { onCanviCorreu?.(event.target.value); setErrorCorreu(''); }}
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(errorCorreu)}
                aria-describedby={descripcio}
                disabled={bloquejat || enviant}
              />
              {errorCorreu ? <p id="rec-email-error" className="sdp-camp__error">{errorCorreu}</p> : null}
            </div>

            <div className="onboarding-card__action--ple">
              <Boto tipus="submit" varietat="secundari" ple icona={Send} carregant={enviant} disabled={bloquejat || restants > 0}>
                {enviat ? 'Torna a enviar l’enllaç' : 'Envia l’enllaç'}
              </Boto>
              {restants > 0 ? (
                <p className="sdp-camp__ajuda">Podràs tornar a demanar-lo d’ací a {restants} s.</p>
              ) : null}
            </div>

            <div className="onboarding-card__action--ple">
              <Boto varietat="fantasma" ple icona={ArrowLeft} onClick={onTorna} disabled={enviant}>
                Torna a entrar
              </Boto>
            </div>
          </form>
        </>
      }
    />
  );
}

/**
 * «Definix la contrasenya nova». `onDesa(contrasenya)` torna una promesa; en
 * el flux de R2 és la que verifica l'enllaç i definix la contrasenya. L'èxit el
 * gestiona qui munta. Botó desactivat i girant mentre treballa: cap doble
 * enviament.
 * R2 · Genèrica (sense `correu`): `onTorna()` deixa l'enllaç i torna al
 * formulari d'entrada. Si l'enllaç ja no val (ENLLAC_CADUCAT), l'avís oferix
 * `onDemanaUnAltre()` i «Desa» es queda desactivat: el reintent no serviria.
 * Compatibilitat (una sessió que encara ha de triar la contrasenya): `correu`
 * és el del compte, perquè qui obri un enllaç que no és seu veja de qui és, i
 * `onEix()` (promesa) és l'única altra eixida.
 */
export function ContrasenyaNovaStep({ correu = '', onDesa, onEix = null, onTorna = null, onDemanaUnAltre = null }) {
  const [fields, setFields] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [enviant, setEnviant] = useState(false);
  const [eixint, setEixint] = useState(false);
  const enCurs = useRef(false);
  const viu = useViu();
  const enllacMort = error?.codi === CODI_ENTRADA.ENLLAC_CADUCAT;
  const ocupat = enviant || eixint;

  const eixir = async () => {
    if (enCurs.current) return;
    enCurs.current = true;
    setEixint(true);
    setError(null);
    try {
      await onEix();
    } catch (err) {
      if (viu.current) setError({ text: missatgeDEntrada(err), codi: codiDEntrada(err) });
    } finally {
      enCurs.current = false;
      if (viu.current) setEixint(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setError(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (enCurs.current || enllacMort) return;
    const nextErrors = validaContrasenyaNova(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    enCurs.current = true;
    setEnviant(true);
    setError(null);
    try {
      await onDesa(fields.password);
    } catch (err) {
      if (viu.current) {
        setError({ text: missatgeDEntrada(err), codi: codiDEntrada(err) });
        /* Les dues: un reintent no hereta mitja parella de contrasenyes. */
        setFields({ password: '', confirmPassword: '' });
      }
    } finally {
      enCurs.current = false;
      if (viu.current) setEnviant(false);
    }
  };

  return (
    <UniversalCard
      variant="onboarding"
      icon={<LockKeyhole size={28} />}
      title="Definix la contrasenya nova"
      body={
        <>
          <p className="onboarding-card__intro">
            {correu ? <>Compte: <strong>{correu}</strong>. </> : null}
            Tria la contrasenya amb què entraràs d’ara endavant.
          </p>

          {error ? (
            <Alerta
              to={toDeLErrorDEntrada(error.codi)}
              accions={enllacMort && typeof onDemanaUnAltre === 'function'
                ? <Boto varietat="secundari" icona={Send} onClick={onDemanaUnAltre}>Demana un enllaç nou</Boto>
                : null}
            >
              {error.text}
            </Alerta>
          ) : null}

          <form className="onboarding-form" onSubmit={submit} noValidate>
            <div className="sdp-camp">
              <label className="sdp-camp__etiqueta" htmlFor="nova-password">Contrasenya nova</label>
              <ControlContrasenya
                id="nova-password"
                name="password"
                value={fields.password}
                onChange={updateField}
                autoComplete="new-password"
                minLength={LONGITUD_MINIMA_CONTRASENYA}
                aria-invalid={Boolean(errors.password)}
                aria-describedby="nova-password-help"
                disabled={ocupat || enllacMort}
              />
              <p id="nova-password-help" className={errors.password ? 'sdp-camp__error' : 'sdp-camp__ajuda'}>
                {errors.password || `Mínim ${LONGITUD_MINIMA_CONTRASENYA} caràcters. No reutilitzes una contrasenya antiga.`}
              </p>
            </div>

            <div className="sdp-camp">
              <label className="sdp-camp__etiqueta" htmlFor="nova-confirm-password">Confirmar contrasenya nova</label>
              <ControlContrasenya
                id="nova-confirm-password"
                etiquetaUll="Mostra la confirmació de la contrasenya"
                name="confirmPassword"
                value={fields.confirmPassword}
                onChange={updateField}
                autoComplete="new-password"
                minLength={LONGITUD_MINIMA_CONTRASENYA}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'nova-confirm-password-error' : undefined}
                disabled={ocupat || enllacMort}
              />
              {errors.confirmPassword ? (
                <p id="nova-confirm-password-error" className="sdp-camp__error">{errors.confirmPassword}</p>
              ) : null}
            </div>

            <div className="onboarding-card__action--ple">
              <Boto tipus="submit" varietat="secundari" ple icona={LockKeyhole} carregant={enviant} disabled={eixint || enllacMort}>
                Desa la contrasenya nova
              </Boto>
            </div>

            {typeof onEix === 'function' ? (
              <div className="onboarding-card__action--ple">
                <Boto varietat="fantasma" ple icona={LogOut} carregant={eixint} disabled={enviant} onClick={eixir}>
                  Eixir del compte
                </Boto>
              </div>
            ) : null}

            {typeof onTorna === 'function' ? (
              <div className="onboarding-card__action--ple">
                <Boto varietat="fantasma" ple icona={ArrowLeft} disabled={ocupat} onClick={onTorna}>
                  Torna a entrar
                </Boto>
              </div>
            ) : null}
          </form>
        </>
      }
    />
  );
}

/**
 * R2 · «Torna a obrir l'enllaç del correu». La pàgina s'ha recarregat i, per
 * seguretat, l'enllaç només vivia en la memòria del document. Si encara no
 * s'havia premut «Desa», el mateix enllaç continua valent. `onDemanaUnAltre()`
 * obri «Recupera la contrasenya»; `onTorna()`, el formulari d'entrada.
 */
export function EnllacPerdutStep({ onDemanaUnAltre, onTorna }) {
  return (
    <UniversalCard
      variant="onboarding"
      icon={<KeyRound size={28} />}
      title="Torna a obrir l’enllaç del correu"
      body={
        <>
          <p className="onboarding-card__intro">
            Esta pàgina s’ha recarregat i, per seguretat, ja no guarda l’enllaç per a definir la contrasenya nova.
            Torna a obrir l’enllaç del correu que t’hem enviat. Si ja no el tens o diu que ja no val, demana’n un altre.
          </p>

          <div className="onboarding-form">
            <div className="onboarding-card__action--ple">
              <Boto varietat="secundari" ple icona={Send} onClick={onDemanaUnAltre}>
                Demana un enllaç nou
              </Boto>
            </div>
            <div className="onboarding-card__action--ple">
              <Boto varietat="fantasma" ple icona={ArrowLeft} onClick={onTorna}>
                Torna a entrar
              </Boto>
            </div>
          </div>
        </>
      }
    />
  );
}
