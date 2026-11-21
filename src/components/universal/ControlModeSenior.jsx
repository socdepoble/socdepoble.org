import { useCallback, useRef, useSyncExternalStore } from 'react';
import * as uiContextModul from '../../app/contexts/UIContext';
import { useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';
import { useFullDiferit } from '../../config/fullDiferit.js';
import {
  aplicaSenior,
  arrelDePresentacio,
  commutaModeSenior,
  readSeniorPreference,
  subscriuModeSenior,
} from '../../config/theme.js';
import { textosModeSenior } from '../../config/textosModeSenior.js';
import cssModeSenior from '../../css/diferit-mode-senior.css?inline';

function lligEstatUISegur() {
  try {
    if (typeof uiContextModul.useUIStateOpcional === 'function') return uiContextModul.useUIStateOpcional();
    if (typeof uiContextModul.useUIState === 'function') return uiContextModul.useUIState();
  } catch { /* fora de UIProvider */ }
  return null;
}

function lligAccionsUISegures() {
  try {
    if (typeof uiContextModul.useUIActionsOpcional === 'function') return uiContextModul.useUIActionsOpcional();
    if (typeof uiContextModul.useUIActions === 'function') return uiContextModul.useUIActions();
  } catch { /* fora de UIProvider */ }
  return null;
}

const snapshotSenior = () => readSeniorPreference();
const snapshotServidor = () => false;

/**
 * ControlModeSenior — Onada R32.15 · P1-80 / IDEA-252 · Interruptor d'1 sol toc
 * per a Mode Sènior / Lectura Gran en les 5 llengües oficials (ca, es, en, eu, gl).
 *
 * Seguix modern-web-guidance (switch):
 *   · <button type="button" role="switch" aria-checked={actiu}> natiu amb etiqueta invariant;
 *   · estat visual explícit amb marca textual («✓ Actiu» / «Desactivat») mai confiat només al color;
 *   · sincronitzat amb storage.js i UIContext a través de config/theme.js.
 *
 * P0-ANDROID-PUSH (v1.2.16) · B11c · `etiquetaCurta`: l'etiqueta curta («Lletra gran», `xipCurt`) per a
 * l'accés del Xat, on el xip comparteix fila amb «Descarrega l'App». La pastilla d'estat es queda.
 */
export default function ControlModeSenior({
  llengua = null,
  ambDescripcio = false,
  variantFranja = '',
  testId = 'control-mode-senior',
  etiquetaCurta = false,
}) {
  const estatUI = lligEstatUISegur();
  const accionsUI = lligAccionsUISegures();
  const t = useTraductorOpcional();
  const externActiu = useSyncExternalStore(subscriuModeSenior, snapshotSenior, snapshotServidor);
  const actiu = typeof estatUI?.seniorMode === 'boolean' ? estatUI.seniorMode : externActiu;

  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'mode-senior', cssModeSenior);

  const codiLlengua = llengua || estatUI?.language || accionsUI?.language || null;
  const tx = textosModeSenior(codiLlengua, t || accionsUI?.t);

  const commuta = useCallback(() => {
    if (typeof accionsUI?.toggleSeniorMode === 'function') {
      accionsUI.toggleSeniorMode();
      return;
    }
    const seg = commutaModeSenior();
    const arrel = arrelDePresentacio(arrelRef.current, { amaDelDocument: true });
    aplicaSenior(arrel, seg);
  }, [accionsUI]);

  const boto = (
    <button
      type="button"
      role="switch"
      aria-checked={actiu ? 'true' : 'false'}
      className={actiu ? 'sdp-mode-senior-xip sdp-mode-senior-xip--actiu' : 'sdp-mode-senior-xip'}
      data-testid={testId}
      onClick={commuta}
    >
      <span className="sdp-mode-senior-xip__etiqueta">{etiquetaCurta ? tx.xipCurt : tx.xip}</span>
      <span className="sdp-mode-senior-xip__estat" aria-hidden="true">
        {actiu ? `✓ ${tx.actiu}` : tx.inactiu}
      </span>
    </button>
  );

  if (ambDescripcio) {
    return (
      <div ref={arrelRef} className="sdp-mode-senior-bloc">
        <p className="sdp-mode-senior-bloc__descripcio">{tx.descripcio}</p>
        {boto}
      </div>
    );
  }

  let classeFranja = 'sdp-mode-senior-franja';
  if (variantFranja === 'perfil') classeFranja = 'sdp-mode-senior-franja sdp-mode-senior-franja--perfil';

  return (
    <div ref={arrelRef} className={classeFranja} role="region" aria-label={tx.regio}>
      {boto}
    </div>
  );
}
