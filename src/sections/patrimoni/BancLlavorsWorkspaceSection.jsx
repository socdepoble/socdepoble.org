import { useMemo } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { useUIActions } from '../../app/contexts/UIContext';
import TextSection from '../text/TextSection';
import { Fitxa, FitxaDeLaFont } from './BancLlavorsSection.jsx';
import { traductorPatrimoni } from './textosPatrimoni.js';
export default function BancLlavorsWorkspaceSection({ page, accioPrincipal, children }) {
  const { t } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const model = useMemo(() => ({ status: 'ready', canAutoSelect: () => false,
    categories: FONTS_BANC_LLAVORS.map(font => ({ id: font.id, label: font.autoria, count: entradesDelCataleg(font.id).length })),
    items: FONTS_BANC_LLAVORS.flatMap(font => entradesDelCataleg(font.id).map(entrada => ({
      id: entrada.id, title: entrada.nom, subtitle: entrada.nomCientific,
      categoryIds: [font.id], glyph: '🌱', lead: font.autoria, entrada, font,
      searchText: [entrada.nom, entrada.nomCientific, font.autoria].join(' ')
    }))) }), []);
  return <CatalegWorkspace id="banc-llavors-p069" font="llavors" destiPublicacio="llavors" ruta="/page/banc-de-llavors" model={model}
    labels={{ categories: 'Catàlegs', items: 'Varietats', all: 'Tots els catàlegs' }}
    renderDetail={({ item, onClose, onTriaItem }) => {
      const entrada = item?.entrada;
      return <TextSection page={page} pageKey="banc-de-llavors" accioPrincipal={accioPrincipal}>
        {(item ? [item.font] : FONTS_BANC_LLAVORS).map(font => <section className="sdp-cataleg-workspace__fitxa" key={font.id}><h3>{font.autoria}</h3><FitxaDeLaFont font={font} tr={tr} /></section>)}
        {item && <div className="sdp-cataleg-workspace__fitxa"><Fitxa key={entrada.id} entrada={entrada} autoFocus={false}
          totes={entradesDelCataleg(item.font.id)} font={item.font} tr={tr}
          onTriaEntrada={nou => onTriaItem(nou.id)}
          onTanca={onClose} /></div>}{children}
      </TextSection>;
    }} />;
}
