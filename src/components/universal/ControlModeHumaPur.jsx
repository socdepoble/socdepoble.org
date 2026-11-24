import { useCallback, useRef } from 'react';
import * as uiContextModul from '../../app/contexts/UIContext';
import { useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';
import { useFullDiferit } from '../../config/fullDiferit.js';
import { activaModeHumaPur, esModeHumaPur } from '../../sections/realitat/nivellIaia.js';
import useNivellIaia from '../../sections/realitat/useNivellIaia.js';
import { textosModeHumaPur } from '../../config/textosModeHumaPur.js';
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

/**
 * ControlModeHumaPur — Onada v1.2.23 (R32.50) · IDEA-334 · Interruptor d'1 sol toc
 * per a l'«Experiència 100 % humana (amagar assistents d'IA)» en les 5 llengües
 * oficials (ca, es, en, eu, gl).
 *
 * Seguix modern-web-guidance (`switch` + `accessibility`):
 *   · <button type="button" role="switch" aria-checked={actiu}> natiu amb nom
 *     accessible invariant (sense repetir l'estat dins de l'etiqueta);
 *   · estat visual explícit amb marca textual («✓ Actiu» / «Desactivat») oculta
 *     a lectors de pantalla (aria-hidden="true") per evitar doble anunci;
 *   · sincronitzat en temps real amb `nivellIaia` (nivell 0 = mode humà pur).
 */
export default function ControlModeHumaPur({
  llengua = null,
  ambDescripcio = false,
  variantFranja = '',
  testId = 'control-mode-huma-pur',
  etiquetaCurta = false,
}) {
  const estatUI = lligEstatUISegur();
  const accionsUI = lligAccionsUISegures();
  const t = useTraductorOpcional();
  const nivellIaia = useNivellIaia();
  const actiu = esModeHumaPur(nivellIaia);

  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'mode-senior', cssModeSenior);

  const codiLlengua = llengua || estatUI?.language || accionsUI?.language || null;
  const tx = textosModeHumaPur(codiLlengua, t || accionsUI?.t);

  const commuta = useCallback(() => {
    activaModeHumaPur(!actiu);
  }, [actiu]);

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
