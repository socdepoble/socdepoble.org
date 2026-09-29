/**
 * BotoVisibilitat.jsx — La bola del món (o el cadenat) de la barra taronja.
 *
 * T41 (ordre del Mestre, 260928) · Un sol <button> real (sense el Dropdown
 * informatiu ni interactius niats): obri el selector de visibilitat del pare,
 * el mateix que obri PUBLICAR. Extret de la closca (UniversalEditorShell) per
 * T51 perquè el catàleg pinte el de veres i no una còpia a mà. El DOM és el
 * de sempre: button.btn-icon-orange (cercle de vel fosc, icona blanca).
 *
 * CONTRACTE
 *   publicat (boolean: bola del món; si no, cadenat) · icona (node opcional
 *   que mana sobre les dues) · etiqueta (nom accessible i títol) · obert
 *   (aria-expanded) · onObri
 */
import { Globe, Lock } from 'lucide-react';

export function BotoVisibilitat({ publicat = false, icona = null, etiqueta = '', obert = false, onObri }) {
  return (
    <button type="button" className="btn-icon-orange" aria-haspopup="dialog" aria-expanded={obert}
      aria-label={etiqueta} title={etiqueta} onClick={onObri}>
      {icona ? icona : (publicat
        ? <Globe size={16} aria-hidden="true" focusable="false" />
        : <Lock size={16} aria-hidden="true" focusable="false" />)}
    </button>
  );
}

export default BotoVisibilitat;
