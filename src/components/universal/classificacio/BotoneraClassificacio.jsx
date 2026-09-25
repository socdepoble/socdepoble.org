/**
 * BotoneraClassificacio — Carpetes, Categories i Etiquetes davall del títol
 * d'un document en edició (punt 7 del Mestre). Cada botó obri la seua modal;
 * la botonera no guarda estat: qui la munta decidix quina modal s'obri.
 *
 * Només viu dins de l'editor. En lectura, targetes, Mur, Perfil i Pàgines es
 * continuen pintant les píndoles (PageFrame, sense la ranura `classificacio`).
 */
import { Folder, Shapes, Tags } from 'lucide-react';
import { Boto } from '../../PedraSeca/index.js';

export function BotoneraClassificacio({ carpeta, categories = [], etiquetes = [], onObri }) {
  const botons = [
    { tipus: 'carpeta', icona: Folder, text: 'Carpetes', resum: carpeta || '—' },
    { tipus: 'categories', icona: Shapes, text: 'Categories', resum: categories.length },
    { tipus: 'etiquetes', icona: Tags, text: 'Etiquetes', resum: etiquetes.length }
  ];
  return (
    <div className="sdp-classificacio-botonera" role="group" aria-label="Classificació del document">
      {botons.map(({ tipus, icona, text, resum }) => (
        <Boto key={tipus} icona={icona} aria-haspopup="dialog" onClick={() => onObri?.(tipus)}>
          {text}
          <span className="sdp-classificacio-botonera__resum">{resum}</span>
        </Boto>
      ))}
    </div>
  );
}

export default BotoneraClassificacio;
