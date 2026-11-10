import { useMemo } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { OBRA_QUE_DINEM, RECEPTES_QUE_DINEM, laminaDeRecepta } from '../../data/patrimoni/queDinem.js';
import TextSection from '../text/TextSection';
import CreditsQueDinem from './CreditsQueDinem.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { traductorPatrimoni } from './textosPatrimoni.js';
import { PaginaDeRecepta } from './ReceptaDetailSection.jsx';
/* Onada R15b (RV-06) · El text alternatiu de la làmina de cada targeta diu la pàgina on és impresa (la 79 → p. 89,
   la 115 → p. 127), en la llengua de la interfície: la mateixa regla que ReceptaDetailSection i ReceptesQueDinemSection
   (R15 P3-1), que /page/receptes ja no munta des que hi va el Workspace. */
const targetaDeLamina = (recepta, tr) => {
  const lamina = laminaDeRecepta(recepta);
  return { imageUrl: lamina?.src, imageAlt: lamina ? tr('patrimoni.receptes.altLamina', 'Làmina de la pàgina {n} del llibre', { n: lamina.pagina }) : '' };
};

export default function ReceptesWorkspaceSection({ page, accioPrincipal, children }) {
  const { t } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const model = useMemo(() => ({ status: 'ready', canAutoSelect: () => false,
    categories: OBRA_QUE_DINEM.apartats.map(a => ({ id: a.id, label: a.titol || a.nom || a.id,
      count: RECEPTES_QUE_DINEM.filter(r => r.apartat === a.id).length })),
    items: RECEPTES_QUE_DINEM.map(recepta => ({ id: recepta.slug, title: recepta.titol,
      categoryIds: [recepta.apartat], glyph: '🍲', recepta, ...targetaDeLamina(recepta, tr),
      searchText: [recepta.titol, ...recepta.ingredients.flatMap(bloc => bloc.linies)].join(' ')
    })) }), [tr]);
  return <CatalegWorkspace font="receptes" destiPublicacio="receptes" id="receptes-p069" ruta="/page/receptes" model={model}
    labels={{ categories: 'Apartats del llibre', items: 'Receptes', all: 'Totes les receptes' }}
    renderDetail={({ item, onClose }) => item ? <PaginaDeRecepta key={item.id} recepta={item.recepta} onTornaAlReceptari={onClose} />
      : <TextSection page={page} pageKey="receptes" accioPrincipal={accioPrincipal}><CreditsQueDinem tr={tr} />{children}</TextSection>} />;
}
