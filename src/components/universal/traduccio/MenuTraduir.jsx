/**
 * MenuTraduir.jsx — El desplegable de llengües del botó «Traduir» de la barra
 * blava (Traductor Sobirà, ordre del Mestre, 260930 · via B).
 *
 * La llista és TANCADA (data/traductor.js): Castellà, Anglés, Francés i
 * Alemany i, quan la pàgina ja està traduïda, «Original (valencià)».
 * El mateix patró que els menús del Xat (FiltreConverses, MenuLlista):
 * role=menu amb menuitemradio i la triada marcada; es tanca en triar, en
 * clicar fora o amb Escape, sense tocar document.body. Les escoltes van a
 * l'arrel del node (getRootNode): dins del Shadow DOM de WordPress, l'arrel
 * és la de la instància i no el document de l'amfitrió. En obrir-lo el focus
 * entra a la primera opció; en tancar-lo (Escape o una tria) torna al botó
 * Traduir (`botoRef`). L'Escape que el tanca queda consumit: ni la pàgina ni
 * l'amfitrió el reben dos vegades. Fletxes, Inici i Fi mouen el focus.
 *
 * `mostra`: l'espècimen del catàleg el pinta obert i quiet, sense furtar el
 * focus ni escoltar la pàgina (Disseny no té cap barra que el tanque).
 */
import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

export const NOM_MENU_TRADUIR = 'Traduir la pàgina';
export const NOM_ORIGINAL = 'Original (valencià)';

const OPCIONS = '[role="menuitemradio"]';

export function MenuTraduir({ opcions = [], actual = null, onTria, onTanca, botoRef = null, mostra = false }) {
  const ref = useRef(null);
  /* Les escoltes no es tornen a posar a cada pintat (carregant, una altra
     llengua): el focus no ha de saltar a la primera opció a mitja tria. */
  const tancaRef = useRef(onTanca);
  useEffect(() => { tancaRef.current = onTanca; }, [onTanca]);

  useEffect(() => {
    if (mostra) return undefined;
    const node = ref.current;
    node?.querySelector(OPCIONS)?.focus();
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (event) => {
      if (!node || node.contains(event.target) || botoRef?.current?.contains(event.target)) return;
      tancaRef.current?.();
    };
    const tancaEsc = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      tancaRef.current?.();
      botoRef?.current?.focus();
    };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [mostra, botoRef]);

  const tria = (codi) => {
    if (mostra) return;
    onTanca?.();
    botoRef?.current?.focus();
    onTria?.(codi);
  };

  const mouFocus = (event) => {
    const passos = { ArrowDown: 1, ArrowUp: -1 };
    if (!(event.key in passos) && event.key !== 'Home' && event.key !== 'End') return;
    const botons = Array.from(ref.current?.querySelectorAll(OPCIONS) || []);
    if (!botons.length) return;
    event.preventDefault();
    const ara = botons.indexOf(event.target);
    let seguent = 0;
    if (event.key === 'End') seguent = botons.length - 1;
    else if (event.key in passos) seguent = (Math.max(ara, 0) + passos[event.key] + botons.length) % botons.length;
    botons[seguent].focus();
  };

  return (
    <div ref={ref} className={`sdp-menu-traduir${mostra ? ' sdp-menu-traduir--mostra' : ''}`}
      role="menu" aria-label={NOM_MENU_TRADUIR} onKeyDown={mouFocus}>
      {opcions.map(({ codi, nom }) => {
        const triat = codi === actual;
        return (
          <button key={codi} type="button" role="menuitemradio" aria-checked={triat}
            className="sdp-menu-traduir__item" onClick={() => tria(codi)}>
            {triat
              ? <Check className="sdp-menu-traduir__marca" size={20} aria-hidden="true" focusable="false" />
              : <span className="sdp-menu-traduir__marca" aria-hidden="true" />}
            {nom}
          </button>
        );
      })}
      {actual ? (
        <>
          <div className="sdp-menu-traduir__separador" role="separator" />
          <button type="button" role="menuitemradio" aria-checked={false}
            className="sdp-menu-traduir__item" onClick={() => tria(null)}>
            <span className="sdp-menu-traduir__marca" aria-hidden="true" />
            {NOM_ORIGINAL}
          </button>
        </>
      ) : null}
    </div>
  );
}

export default MenuTraduir;
