import { useMemo } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import TextSection from './TextSection.jsx';
import AparadorFediversity from './AparadorFediversity.jsx';
import { FEDIVERSITY_ACTORS, FEDIVERSITY_ARCHITECTURE_TEXTS } from './fediversityArchitectureR11.js';

/** Selecting an architectural reference never activates a remote capability. */
export default function FediversityWorkspaceSection({ page, accioPrincipal, children }) {
  const ui = useUIActionsOpcional();
  const text = FEDIVERSITY_ARCHITECTURE_TEXTS[ui?.language] || FEDIVERSITY_ARCHITECTURE_TEXTS.ca;
  const model = useMemo(() => ({ status: 'ready', canAutoSelect: () => false,
    categories: [{ id: 'arquitectura', label: text.title }],
    items: Object.entries(FEDIVERSITY_ACTORS).map(([role, title]) => ({ id: role, title,
      lead: text.actors[role], categoryIds: ['arquitectura'], glyph: '🌐' }))
  }), [text]);
  return <CatalegWorkspace id="fediversity-p069" ruta="/page/fediversity" model={model}
    labels={{ categories: 'Documents', items: 'Fediversity', all: 'Arquitectura completa' }}
    renderDetail={({ item }) => <TextSection page={page} pageKey="fediversity" accioPrincipal={accioPrincipal}>
      {item ? <section className="sdp-cataleg-workspace__fitxa" aria-label={item.title}><h3>{item.title}</h3><p>{item.lead}</p></section> : null}
      <AparadorFediversity />{children}
    </TextSection>} />;
}
