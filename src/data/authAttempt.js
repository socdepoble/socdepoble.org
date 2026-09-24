import { versioSessio } from './identitat.js';

let active = null;
const cancelled = () => new DOMException('L’intent d’entrada ha caducat.', 'AbortError');

/** Tots els mètodes d'entrada competixen pel mateix intent, abans del primer await. */
export function cancelAuthAttempts() {
  active?.controller.abort(cancelled());
  active?.finish();
}

export function beginAuthAttempt() {
  cancelAuthAttempts();
  const epoch = versioSessio;
  const controller = new AbortController();
  const onChange = () => { if (epoch !== versioSessio) controller.abort(cancelled()); };
  const attempt = {
    controller,
    signal: controller.signal,
    assertCurrent() {
      if (active !== attempt || epoch !== versioSessio || controller.signal.aborted) throw cancelled();
    },
    finish() {
      globalThis.window?.removeEventListener('sdp:auth-change', onChange);
      if (active === attempt) active = null;
    },
  };
  active = attempt;
  globalThis.window?.addEventListener('sdp:auth-change', onChange);
  return attempt;
}
