/**
 * AcollidaForasterXat.jsx · v1.2.17 (IDEA-313, literal del Mestre 261121 16:03)
 *
 * La benvinguda del Foraster: qui aterra a /xat sense sessió (/ → /xat) veu una sola targeta neta
 * amb el títol, les dues línies del Mestre i un sol «Entrar», i una ✕ a dalt a la dreta.
 *   · La ✕ la tanca i ho recorda en aquest dispositiu (localStorage via config/storage.js): la
 *     targeta desapareix sense deixar cap pastilla, i el focus passa al control següent.
 *   · «Entrar» és el verb únic de B9 i porta a rutaDEntrada({ tornar }) amb una navegació normal:
 *     l'Arrere torna al Xat, mai se segresta.
 * Substituïx les propostes de R32.26 (cinta i hostaleria). Els textos viuen al model
 * (acollidaForasterXatModel.js): ací només s'exporta el component (puresa HMR). La llengua arriba
 * per prop (XatWorkspace li passa la de la interfície): el component no depén de cap context.
 * v1.2.17 · Gauntlet R1 (L1-02, L1-04, L1-06) · La <section> porta el lang dels textos que pinta;
 * `recorda = false` (l'espècimen de /disseny) tanca només en memòria, sense llegir ni escriure la
 * clau real; sense `onNavega`, «Entrar» no navega: dins d'un amfitrió no trau ningú de la pàgina.
 */
import { useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import { rutaDEntrada } from '../../../config/rutaEntrada.js';
import cssAcollidaForaster from '../../../css/diferit-acollida-foraster.css?inline';
import {
  benvingudaForasterTancada,
  desaBenvingudaForasterTancada,
  llenguaBenvingudaForaster,
  partsDeLinia,
  textosBenvingudaForaster,
} from './acollidaForasterXatModel.js';

const FOCUSABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* El primer control que ve després de la targeta dins del seu contenidor: on va el focus quan la
   ✕ la tanca, perquè el teclat i el lector de pantalla no es queden al buit. */
function controlSeguent(arrel) {
  const pare = arrel?.parentElement;
  if (!pare) return null;
  for (const el of pare.querySelectorAll(FOCUSABLES)) {
    if (!arrel.contains(el) && (arrel.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) return el;
  }
  return null;
}

export function AcollidaForasterXat({ idioma = 'ca', tornar = '/xat', onNavega = null, recorda = true }) {
  const codi = llenguaBenvingudaForaster(idioma);
  const tx = textosBenvingudaForaster(codi);
  const { abans, paraula, despres } = partsDeLinia(tx.linia2, tx.emfasi);
  const idTitol = useId();
  const arrelRef = useRef(null);
  const [tancada, setTancada] = useState(() => (recorda ? benvingudaForasterTancada() : false));
  useFullDiferit(arrelRef, 'acollida-foraster', cssAcollidaForaster);

  if (tancada) return null;

  const tanca = () => {
    if (recorda) desaBenvingudaForasterTancada(true);
    controlSeguent(arrelRef.current)?.focus();
    setTancada(true);
  };

  const entra = () => {
    if (typeof onNavega === 'function') onNavega(rutaDEntrada({ tornar }));
  };

  return (
    <section ref={arrelRef} className="sdp-foraster-xat" lang={codi} aria-labelledby={idTitol} data-sdp-foraster="benvinguda">
      <div className="sdp-foraster-xat__cap">
        <h2 id={idTitol} className="sdp-foraster-xat__titol">{tx.titol}</h2>
        <button type="button" className="sdp-foraster-xat__tanca" aria-label={tx.tanca} title={tx.tanca} onClick={tanca}>
          <X size={20} aria-hidden="true" focusable="false" />
        </button>
      </div>
      <p className="sdp-foraster-xat__text">{tx.linia1}</p>
      <p className="sdp-foraster-xat__text">
        {abans}
        {paraula ? <strong className="sdp-foraster-xat__emfasi">{paraula}</strong> : null}
        {despres}
      </p>
      <div className="sdp-foraster-xat__accions">
        <button type="button" className="sdp-foraster-xat__entrar" onClick={entra}>{tx.entrar}</button>
      </div>
    </section>
  );
}

export default AcollidaForasterXat;
