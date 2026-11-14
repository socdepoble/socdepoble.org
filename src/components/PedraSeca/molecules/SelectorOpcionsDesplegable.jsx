import { useId, useLayoutEffect, useRef } from 'react';
import { desplacaASeccio, destiDelSalt } from '../../../utils/desplacamentApp.js';

/** Tria exclusiva nativa + explicació adjacent. No fa peticions ni canvia de pàgina.
 *  `resum`: Array<ReactNode>; es pinten les dues primeres frases, senceres i sense tall. */
export function SelectorOpcionsDesplegable({
  llegenda, opcions, valor, onCanvi, resum = [], resumTitol, disabled = false,
}) {
  const grup = useId();
  const files = useRef(new Map());
  const pendent = useRef(null);

  useLayoutEffect(() => {
    if (pendent.current !== valor) return;
    pendent.current = null;
    const fila = files.current.get(valor);
    if (!fila) return;
    const win = fila.ownerDocument.defaultView;
    const desti = destiDelSalt(fila);
    if (!desti) return; // Sense desplaçador propi no es mou mai l'amfitrió.
    const visor = desti.desplacador;
    const caixa = fila.getBoundingClientRect();
    const etiqueta = fila.querySelector('label').getBoundingClientRect();
    const detall = fila.querySelector('[data-revelacio]');
    const inici = Math.max(0, caixa.top + visor.scrollTop - desti.top);
    const final = Math.min(win.innerHeight, visor.getBoundingClientRect().bottom);
    const linia = parseFloat(win.getComputedStyle(detall).fontSize) * 1.6;
    const visible = etiqueta.height + Math.min(detall.getBoundingClientRect().height, linia * 2);
    if (caixa.top < inici || caixa.top + visible > final) {
      // Només si cal: manté títol i inici de l'explicació visibles al mateix visor.
      desplacaASeccio(fila, { block: 'start', behavior: 'instant', respectaFinestra: true });
    }
  }, [valor]);

  return (
    <fieldset className="sdp-selector-opcions" disabled={disabled}>
      <legend>{llegenda}</legend>
      <div className="sdp-selector-opcions__llista">
        {opcions.map((opcio, i) => {
          const actiu = valor === opcio.id;
          const id = `${grup}-${i}`;
          return (
            <div className="sdp-selector-opcions__opcio" key={opcio.id}
              ref={(node) => { if (node) files.current.set(opcio.id, node); else files.current.delete(opcio.id); }}>
              <label className="sdp-selector-opcions__tria" htmlFor={id} data-actiu={actiu} data-inhabilitada={disabled || Boolean(opcio.inhabilitada)}>
                <input id={id} name={grup} type="radio" value={opcio.id} checked={actiu}
                  disabled={opcio.inhabilitada} aria-controls={`${id}-detall`}
                  aria-describedby={actiu ? `${id}-detall` : undefined}
                  onChange={() => { pendent.current = opcio.id; onCanvi(opcio.id); }} />
                <span>{opcio.titol}</span>
              </label>
              <div id={`${id}-detall`} className="sdp-selector-opcions__detall" data-revelacio="" hidden={!actiu}>
                {opcio.explicacio}
              </div>
            </div>
          );
        })}
      </div>
      {resum.length ? <div className="sdp-selector-opcions__resum" role="status" aria-live="polite" aria-atomic="true"
        aria-label={resumTitol}>
        {/* R26.3 · Cap title: en mòbil el dit no el pot obrir. El text sencer es veu (modules.css). */}
        {resum.slice(0, 2).map((linia, i) => <span key={i}>{linia}</span>)}
      </div> : null}
    </fieldset>
  );
}
