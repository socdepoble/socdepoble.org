/**
 * MenuTraduir.jsx — El desplegable unificat d'idioma i de veu territorial del
 * botó «Traduir» de la barra blava (Traductor de Poble, 260930 · via B +
 * Onada R23: «Escoltar en veu alta + Selector d'accent/veu»).
 *
 * Quan `lecturaVeu` no es passa (espècimens o proves antigues), pinta
 * exactament les files de llengües amb `role="menuitemradio"`. Quan
 * `lecturaVeu` està activa, afegeix a sota la lectura en veu alta de la pàgina
 * (`role="menuitem"`) i el selector tancat d'accent/veu (`role="menuitemradio"`),
 * governats tots pel mateix hook `useMenuEmergent` (fletxes, Inici, Fi, Escape
 * i Tab, sense afegir cap botó extra a la barra).
 */
import { Check, Square, Volume2 } from 'lucide-react';
import { useMenuEmergent } from '../../PedraSeca/hooks/useMenuEmergent.js';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';

export const NOM_MENU_TRADUIR = 'Traduir la pàgina';
export const NOM_ORIGINAL = 'Original (valencià)';
export const NOM_ESCOLTAR_PAGINA = 'Escoltar esta pàgina en veu alta';
export const NOM_ATURAR_LECTURA = 'Aturar la lectura en veu alta';
export const NOM_GRUP_VEU = 'Veu i accent';

const OPCIONS = '[role="menuitem"], [role="menuitemradio"]';

export function MenuTraduir({
  opcions = [],
  actual = null,
  onTria,
  onTanca,
  botoRef = null,
  mostra = false,
  lecturaVeu = null,
}) {
  const { ref, tria, mouFocus } = useMenuEmergent({ files: OPCIONS, onTria, onTanca, botoRef, mostra, tancaAmbTab: true });
  const t = useTraductorOpcional();
  const tabIndexDeFila = mostra ? undefined : -1;

  const teOpcionsIdioma = Array.isArray(opcions) && opcions.length > 0;
  const teLecturaVeu = Boolean(lecturaVeu && Array.isArray(lecturaVeu.veus) && lecturaVeu.veus.length > 0);

  const executaAccioVeu = (fn) => {
    if (mostra) return;
    onTanca?.();
    botoRef?.current?.focus();
    fn?.();
  };

  return (
    <div
      ref={ref}
      className="sdp-menu-traduir"
      role="menu"
      aria-label={tradueix(t, ['section.traduir.menu', NOM_MENU_TRADUIR])}
      onKeyDown={mouFocus}
    >
      {opcions.map(({ codi, nom }) => {
        const triat = codi === actual;
        return (
          <button
            key={codi}
            type="button"
            role="menuitemradio"
            aria-checked={triat}
            tabIndex={tabIndexDeFila}
            className="sdp-menu-traduir__item"
            onClick={() => tria(codi)}
          >
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
          <button
            type="button"
            role="menuitemradio"
            aria-checked={false}
            tabIndex={tabIndexDeFila}
            className="sdp-menu-traduir__item"
            onClick={() => tria(null)}
          >
            <span className="sdp-menu-traduir__marca" aria-hidden="true" />
            {tradueix(t, ['section.traduir.original', NOM_ORIGINAL])}
          </button>
        </>
      ) : null}
      {teLecturaVeu ? (
        <>
          {teOpcionsIdioma ? <div className="sdp-menu-traduir__separador" role="separator" /> : null}
          <button
            type="button"
            role="menuitem"
            tabIndex={tabIndexDeFila}
            className={lecturaVeu.parlant ? 'sdp-menu-traduir__item sdp-menu-traduir__item--actiu' : 'sdp-menu-traduir__item'}
            onClick={() => executaAccioVeu(lecturaVeu.onEscoltar)}
          >
            {lecturaVeu.parlant
              ? <Square className="sdp-menu-traduir__marca" size={18} aria-hidden="true" focusable="false" />
              : <Volume2 className="sdp-menu-traduir__marca" size={20} aria-hidden="true" focusable="false" />}
            {lecturaVeu.parlant
              ? tradueix(t, ['section.traduir.aturarLectura', NOM_ATURAR_LECTURA])
              : tradueix(t, ['section.traduir.escoltarPagina', NOM_ESCOLTAR_PAGINA])}
          </button>
          <div className="sdp-menu-traduir__grup-titol" role="presentation">
            {tradueix(t, ['section.traduir.grupVeu', NOM_GRUP_VEU])}
          </div>
          {lecturaVeu.veus.map((veu) => {
            const veuTriada = veu.id === lecturaVeu.veuActual;
            return (
              <button
                key={veu.id}
                type="button"
                role="menuitemradio"
                aria-checked={veuTriada}
                tabIndex={tabIndexDeFila}
                className="sdp-menu-traduir__item"
                onClick={() => executaAccioVeu(() => lecturaVeu.onTriaVeu?.(veu.id))}
              >
                {veuTriada
                  ? <Check className="sdp-menu-traduir__marca" size={20} aria-hidden="true" focusable="false" />
                  : <span className="sdp-menu-traduir__marca" aria-hidden="true" />}
                {tradueix(t, [veu.clauNom, veu.reservaNom])}
              </button>
            );
          })}
        </>
      ) : null}
    </div>
  );
}

export default MenuTraduir;
