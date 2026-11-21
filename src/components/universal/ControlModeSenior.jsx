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
 * l'accés del Xat, on el xip comparteix fila amb «Descarrega l'App».
 *
 * v1.2.18 · Gauntlet R1 (L1-04) · Amb `etiquetaCurta`, la marca textual («✓ Actiu» / «Desactivat»)
 * només és de la variant per defecte. La curta pinta el glif compacte ○ / ✓, amb aria-hidden (l'estat
 * el diu aria-checked) i sense pastilla: `__estat--curt` (diferit-mode-senior.css) en lleva el
 * padding i la vora. La seua geometria per llengua a l'accés del Xat queda pendent de la decisió C-2
 * del Mestre (L1-03).
 *
 * v1.2.18 · Gauntlet R2 (L1R2-02) · El xip curt és d'una sola línia en mode normal (`--curt`,
 * nowrap); en Sènior la regla de les dianes (diferit-mode-senior.css) torna `white-space: normal`
 * i, amb el text molt gran, l'etiqueta pot partir.
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

  const classesXip = [
    'sdp-mode-senior-xip',
    etiquetaCurta ? 'sdp-mode-senior-xip--curt' : '',
    actiu ? 'sdp-mode-senior-xip--actiu' : '',
  ].filter(Boolean).join(' ');

  const textEstat = etiquetaCurta
    ? (actiu ? '✓' : '○')
    : (actiu ? `✓ ${tx.actiu}` : tx.inactiu);

  const boto = (
    <button
      type="button"
      role="switch"
      aria-checked={actiu ? 'true' : 'false'}
      className={classesXip}
      data-testid={testId}
      onClick={commuta}
    >
      <span className="sdp-mode-senior-xip__etiqueta">{etiquetaCurta ? tx.xipCurt : tx.xip}</span>
      <span
        className={etiquetaCurta ? 'sdp-mode-senior-xip__estat sdp-mode-senior-xip__estat--curt' : 'sdp-mode-senior-xip__estat'}
        aria-hidden="true"
      >
        {textEstat}
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
