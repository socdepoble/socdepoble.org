import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import * as uiContextModul from '../../app/contexts/UIContext';
import { useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';
import { useFullDiferit } from '../../config/fullDiferit.js';
import {
  ATRIBUT_CONTRAST,
  ATRIBUT_SENIOR,
  CONTRAST_BANCAL,
  ESDEVENIMENT_CONTRAST,
  arrelDePresentacio,
  esModeBancal,
  readContrastPreference,
  readSeniorPreference,
  subscriuModeSenior,
  reclamaAtribut,
  writeContrastPreference,
  writeSeniorPreference,
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

const snapshotSenior = () => esModeBancal(readSeniorPreference(), readContrastPreference());
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
 *
 * IDEA-323.4 · DOL-31 (v1.2.22, ordre del Mestre del 261122) · És l'interruptor del «Mode Bancal · Sol i
 * Lletra Gran» (theme.js, esModeBancal): encén i apaga alhora la lletra gran (data-sdp-senior) i el
 * contrast Bancal (data-contrast). Fora d'UIProvider fa el mateix sobre la seua arrel de presentació.
 *
 * v1.2.22 · Gauntlet R2 (M2-03) · Fora d'UIProvider, els dos atributs no els escriu el toc: es deriven de l'estat global
 * (el magatzem, que avisa per subscriuModeSenior) en un sol efecte, que els reclama junts (reclamaAtribut) mentre el mode
 * està encés i els allibera junts quan s'apaga o el xip es desmunta. Dos xips no es deixen el mode a mitges, i mai no
 * queda un atribut sol. En tornar un 'bancal' antic a 'normal', el xip avisa per ESDEVENIMENT_CONTRAST, com desaContrast
 * (UIContext), perquè un proveïdor de la mateixa pàgina se n'assabente. Dins del proveïdor no canvia res: el toc és
 * toggleSeniorMode i els atributs els posa App.jsx.
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
  const dinsProveidor = typeof accionsUI?.toggleSeniorMode === 'function';
  /* v1.2.22 · Gauntlet R2 (M2-03) · Fora d'UIProvider, un sol efecte deriva els dos atributs del mode global i els
     reclama junts (reclamaAtribut, W4-12): en apagar, o en desmuntar, l'element recupera els valors que tenia (els de
     l'amfitrió, o cap). Abans de pintar, com App.jsx: un mode desat encés ja porta els dos atributs en el primer
     fotograma. Dins del proveïdor no fa res. */
  useLayoutEffect(() => {
    if (dinsProveidor || !externActiu) return undefined;
    const arrel = arrelDePresentacio(arrelRef.current, { amaDelDocument: true });
    const alliberaSenior = reclamaAtribut(arrel, ATRIBUT_SENIOR, 'true');
    const alliberaContrast = reclamaAtribut(arrel, ATRIBUT_CONTRAST, CONTRAST_BANCAL);
    return () => { alliberaContrast(); alliberaSenior(); };
  }, [dinsProveidor, externActiu]);

  const codiLlengua = llengua || estatUI?.language || accionsUI?.language || null;
  const tx = textosModeSenior(codiLlengua, t || accionsUI?.t);

  const commuta = useCallback(() => {
    if (typeof accionsUI?.toggleSeniorMode === 'function') {
      accionsUI.toggleSeniorMode();
      return;
    }
    const contrast = readContrastPreference();
    const seg = !esModeBancal(readSeniorPreference(), contrast);
    /* Un 'bancal' desat per una versió anterior, en apagar, torna a 'normal'. Abans que la clau de
       Sènior, que avisa els oients: quan la lligen, el mode ja és el nou. I amb el mateix avís que
       desaContrast (Gauntlet R2, M2-03): un proveïdor de la pàgina també deixa el 'bancal'. */
    const contrastSeg = !seg && contrast === CONTRAST_BANCAL ? 'normal' : contrast;
    if (contrastSeg !== contrast) {
      writeContrastPreference(contrastSeg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(ESDEVENIMENT_CONTRAST, { detail: { contrast: contrastSeg } }));
      }
    }
    /* Els atributs no es toquen ací: el magatzem avisa tots els xips (useSyncExternalStore) i l'efecte de cada un
       els reclama o els allibera. */
    writeSeniorPreference(seg);
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
