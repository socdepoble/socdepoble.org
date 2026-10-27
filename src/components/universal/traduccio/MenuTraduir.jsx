/**
 * MenuTraduir.jsx — El desplegable de llengües del botó «Traduir» de la barra
 * blava (Traductor Sobirà, ordre del Mestre, 260930 · via B).
 *
 * La llista és TANCADA (data/traductor.js): Castellà, Anglés, Francés i
 * Alemany i, quan la pàgina ja està traduïda, «Original (valencià)».
 * El mateix patró que els menús del Xat (FiltreConverses; MenuLlista, retirat el 261026):
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
 *
 * Ordre del Mestre (261007) · Correcció C9 · Tot este comportament (focus,
 * Escape consumit, clic fora a l'arrel del node, fletxes, Inici i Fi, tria i
 * `mostra`) és el de useMenuEmergent (PedraSeca/hooks), el MATEIX del menú de
 * Comentar. Ací només queden el marcatge i les llengües.
 */
import { Check } from 'lucide-react';
import { useMenuEmergent } from '../../PedraSeca/hooks/useMenuEmergent.js';

export const NOM_MENU_TRADUIR = 'Traduir la pàgina';
export const NOM_ORIGINAL = 'Original (valencià)';

const OPCIONS = '[role="menuitemradio"]';

export function MenuTraduir({ opcions = [], actual = null, onTria, onTanca, botoRef = null, mostra = false }) {
  const { ref, tria, mouFocus } = useMenuEmergent({ files: OPCIONS, onTria, onTanca, botoRef, mostra });

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
