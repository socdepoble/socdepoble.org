/**
 * FiltresCerca.jsx — la llista VERTICAL de filtres de la cerca global del
 * Xat (T69, captura de referència 19.13.56). Apareix en lloc de la
 * llista de converses quan el cercador té el focus i el camp és buit: cada
 * fila porta la icona de contorn del tipus, l'etiqueta i, a la dreta, la
 * fletxa diagonal. Cap capçalera nova.
 *
 * L'ordre i els textos són els de FILTRES_CERCA_XAT (cercaXat.js), que és el
 * contracte; ací només es tria la icona de lucide pel seu nom.
 *
 * Triar un filtre no ha de fer perdre el focus al cercador (el filtre es
 * posa com una fitxa dins del camp i s'hi continua escrivint): el
 * `pointerdown` no mou el focus i qui la munta decidix què fa el `blur`.
 *
 * Teclat: des del camp, Fletxa avall (o Tab) entra a la primera fila (ho
 * fa XatSection). Ací, les fletxes, Inici i Fi es mouen entre files;
 * Fletxa amunt a la primera, Maj+Tab a la primera i Escape tornen al camp
 * (`onTornaAlCamp`); Retorn tria. La llista no es tanca mentre el focus hi és.
 */
import { forwardRef } from 'react';
import {
  ArrowUpLeft, CalendarDays, Camera, ChartBarBig, FileText, ImagePlay, Link as LinkIcon, Music, Video
} from 'lucide-react';
import { FILTRES_CERCA_XAT } from '../cercaXat.js';

/* El nom de cada icona a FILTRES_CERCA_XAT, cap al component de lucide. */
export const ICONES_FILTRE = Object.freeze({
  Camera, ImagePlay, Link: LinkIcon, Video, FileText, Music, ChartBarBig, CalendarDays
});

export function IconaFiltre({ nom, size = 24 }) {
  const Icona = ICONES_FILTRE[nom] || FileText;
  return <Icona size={size} aria-hidden="true" focusable="false" />;
}

/* La fila de destí per a cada tecla, o 'camp' per a tornar al cercador. */
function destiDeTecla(e, i, total) {
  switch (e.key) {
    case 'ArrowDown': return Math.min(i + 1, total - 1);
    case 'ArrowUp': return i === 0 ? 'camp' : i - 1;
    case 'Home': return 0;
    case 'End': return total - 1;
    case 'Escape': return 'camp';
    case 'Tab': return e.shiftKey && i === 0 ? 'camp' : null;
    default: return null;
  }
}

const FiltresCerca = forwardRef(function FiltresCerca({ onTria, onBlur, onTornaAlCamp, t }, ref) {
  const etiqueta = t('section.xat.cerca.filtres', 'Filtres de cerca');
  const alTeclat = (e) => {
    const files = [...e.currentTarget.querySelectorAll('.sdp-xat-filtres-cerca__fila')];
    const i = files.indexOf(e.target);
    if (i < 0) return;
    const desti = destiDeTecla(e, i, files.length);
    if (desti == null) return;
    e.preventDefault();
    if (desti === 'camp') onTornaAlCamp?.();
    else files[desti].focus();
  };
  return (
    <ul className="sdp-xat-filtres-cerca" aria-label={etiqueta} ref={ref} onBlur={onBlur} onKeyDown={alTeclat}>
      {FILTRES_CERCA_XAT.map((filtre) => (
        <li key={filtre.id}>
          <button
            type="button"
            className="sdp-xat-filtres-cerca__fila"
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTria(filtre.id)}
          >
            <span className="sdp-xat-filtres-cerca__icona"><IconaFiltre nom={filtre.icona} /></span>
            <span className="sdp-xat-filtres-cerca__nom">{t(filtre.clauI18n, filtre.etiqueta)}</span>
            <ArrowUpLeft className="sdp-xat-filtres-cerca__fletxa" size={20} aria-hidden="true" focusable="false" />
          </button>
        </li>
      ))}
    </ul>
  );
});

export default FiltresCerca;
