/**
 * BotoneraClassificacio — Carpetes, Categories i Etiquetes davall del títol
 * d'un document en edició (punt 7 del Mestre). Cada botó obri la seua modal;
 * la botonera no guarda estat: qui la munta decidix quina modal s'obri.
 *
 * Només viu dins de l'editor. En lectura, targetes, Mur, Perfil i Pàgines es
 * continuen pintant les píndoles (PageFrame, sense la ranura `classificacio`).
 */
import { Feather, Folder, Shapes, Tags } from 'lucide-react';
import { Boto } from '../../PedraSeca/index.js';

/* T23 (ordre del Mestre, 260927 nit) · el quart botó és l'emoticona del
   document. La botonera només es pinta en edició: sense emoticona hi va una
   PLOMA (Feather), que diu «això és editable»; en eixir de l'edició la
   botonera desapareix i amb ella la ploma. Amb emoticona, la mateixa
   emoticona ocupa el lloc de la icona, fixa i guardada al document. */
export function BotoneraClassificacio({ carpeta, categories = [], etiquetes = [], emoticona = '', onObri }) {
  const botons = [
    { tipus: 'carpeta', icona: Folder, text: 'Carpetes', resum: carpeta || '—' },
    { tipus: 'categories', icona: Shapes, text: 'Categories', resum: categories.length },
    { tipus: 'etiquetes', icona: Tags, text: 'Etiquetes', resum: etiquetes.length },
    emoticona
      ? { tipus: 'emoticona', icona: null, glif: emoticona, text: 'Emoticona', resum: null }
      : { tipus: 'emoticona', icona: Feather, glif: null, text: 'Emoticona', resum: '—' }
  ];
  return (
    <div className="sdp-classificacio-botonera" role="group" aria-label="Classificació del document">
      {botons.map(({ tipus, icona, glif, text, resum }) => (
        <Boto key={tipus} icona={icona} aria-haspopup="dialog" onClick={() => onObri?.(tipus)}>
          {glif ? <span className="sdp-classificacio-botonera__glif" aria-hidden="true">{glif}</span> : null}
          {text}
          {resum === null ? null : <span className="sdp-classificacio-botonera__resum">{resum}</span>}
        </Boto>
      ))}
    </div>
  );
}

export default BotoneraClassificacio;
