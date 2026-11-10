import { useMemo } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import TextSection from '../text/TextSection';
import FitxaHerbari from './FitxaHerbari.jsx';
import { creaLocutorHerbariLocal } from './locutorHerbariLocal.js';
import { textosHerbari } from './textosHerbari.js';
import { modelHerbariWorkspace } from './modelHerbariWorkspace.js';
export default function HerbariWorkspaceSection({ locutor: injectat = null, page = null, accioPrincipal = null, children = null }) {
  const { language = 'ca' } = useUIActions(), textos = textosHerbari(language);
  const model = useMemo(() => modelHerbariWorkspace(textos), [textos]);
  const locutor = useMemo(() => injectat ?? creaLocutorHerbariLocal(), [injectat]);
  const fitxa = (item, onClose) => item ? <section className="sdp-cataleg-workspace__fitxa" aria-label={item.title}>
    <div className="sdp-herbari-fitxa__capcalera">
      <h3 lang="ca">{item.title}</h3>
      {typeof onClose === 'function' ? (
        <button type="button" className="sdp-boto sdp-boto--secundari sdp-herbari-fitxa__tornar" onClick={onClose}>
          {`← ${textos.titol}`}
        </button>
      ) : null}
    </div>
    <FitxaHerbari key={item.id} especie={item.dades} textos={textos} locutor={locutor} />
  </section> : <p>{textos.documental}</p>;
  return <CatalegWorkspace font="herbari" destiPublicacio="herbari" model={model} id="herbari-p069" ruta="/page/herbari"
    labels={{ categories: textos.us, items: textos.titol, all: textos.tots, search: textos.cerca, empty: textos.buit, noResults: textos.buit }}
    renderDetail={({ item, onClose }) => page ? <TextSection page={page} pageKey="herbari" accioPrincipal={accioPrincipal} amagaCos={Boolean(item)}>
      {fitxa(item, onClose)}{children}
    </TextSection> : fitxa(item, onClose)} />;
}
