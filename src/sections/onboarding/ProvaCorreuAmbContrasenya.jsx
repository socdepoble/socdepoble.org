/** Review-only email proof form. Token is an explicit in-memory prop supplied
 * by the route; this component never reads a URL, cookie, storage or clipboard.
 * onConfirma(token,password,metadata,{signal}) is wired to the neutral optional
 * email-proof capability. No effect submits a request and success never logs in.
 */
import { useEffect, useRef, useState } from 'react';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { VERSIO_POLITICA_PRIVACITAT as VERSION, RUTA_POLITICA_PRIVACITAT } from '../../config/politicaPrivacitat.js';
import { textosOnboardingExtra } from './i18nOnboardingExtra.js';

function useIdiomaProvaCorreu() {
  try {
    return useUIStateOpcional()?.language || 'ca';
  } catch {
    return 'ca';
  }
}

export function ProvaCorreuAmbContrasenya({ token, onConfirma, mode = 'verify-email', scopeKey = 'initial', requiresConsent = mode === 'verify-email' }) {
  const tx = textosOnboardingExtra(useIdiomaProvaCorreu());
  const [pwd, setPwd] = useState('');
  const [again, setAgain] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [version, setVersion] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const alive = useRef(false);
  const sending = useRef(false);
  const controller = useRef(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    controller.current?.abort();
    setPwd('');
    setAgain('');
    setAccepted(false);
    setVersion('');
    setMessage('');
  }, [scopeKey, token, mode]);
  async function submit(event) {
    event.preventDefault();
    if (sending.current) return;
    if ((requiresConsent && (!accepted || version !== VERSION)) || pwd.length < 12 || pwd !== again) {
      setMessage(tx.provaErrorValidacio);
      return;
    }
    const control = new AbortController();
    controller.current = control;
    sending.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await onConfirma(token, pwd, requiresConsent ? { accepta_rgpd: true, versio_politica: version } : null, { signal: control.signal });
      if (result?.login_required !== true || !(result.verified === true || result.password_changed === true)) throw Error('email_proof_unconfirmed');
      if (alive.current && !control.signal.aborted) setMessage(tx.provaExit);
    } catch (error) {
      if (alive.current && !control.signal.aborted) setMessage(error?.requiresReload ? tx.provaRecarrega : tx.provaNoConfirmada);
    } finally {
      sending.current = false;
      if (controller.current === control) controller.current = null;
      if (alive.current) {
        setPwd('');
        setAgain('');
        setAccepted(false);
        setVersion('');
        setBusy(false);
      }
    }
  }
  return (
    <form aria-label={mode === 'reset-password' ? tx.provaAriaReset : tx.provaAriaVerify} onSubmit={submit}>
      <p>{tx.provaIntro}</p>
      <label>{tx.provaNova}<input type="password" autoComplete="new-password" minLength={12} maxLength={256} value={pwd} disabled={busy} onChange={(event) => setPwd(event.target.value)} /></label>
      <label>{tx.provaConfirma}<input type="password" autoComplete="new-password" minLength={12} maxLength={256} value={again} disabled={busy} onChange={(event) => setAgain(event.target.value)} /></label>
      {requiresConsent ? (
        <>
          <p><a href={RUTA_POLITICA_PRIVACITAT} target="_blank" rel="noopener noreferrer">{tx.provaPolitica(VERSION)}</a></p>
          <label><input type="checkbox" checked={accepted} disabled={busy} onChange={(event) => { setAccepted(event.target.checked); setVersion(event.target.checked ? VERSION : ''); }} />{tx.provaAccepte(VERSION)}</label>
        </>
      ) : null}
      <button type="submit" disabled={busy}>{tx.provaSubmit}</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
