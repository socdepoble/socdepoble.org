import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ selected: null, visible: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ language: 'ca', t: (_key, value) => value }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../config/backendConfig.js', () => ({ normalizeBackendConfig: () => ({ dataMode: 'seed' }) }));
vi.mock('../../components/universal/CatalegWorkspace.jsx', async () => {
  const { useState } = await import('react');
  return { default: function MockCatalegWorkspace({ model, renderDetail }) {
    const [id, setId] = useState(model.items[0].id);
    m.selected = id;
    return <div>{renderDetail({ item: model.items.find(item => item.id === id), onTriaItem: setId, onClose() {} })}</div>;
  } };
});
vi.mock('../text/TextSection', () => ({ default: ({ children }) => <article>{children}</article> }));
vi.mock('./BancLlavorsSection.jsx', () => ({ FitxaDeLaFont: () => null, Fitxa: ({ entrada, totes, onTriaEntrada }) => {
  m.visible = entrada.id;
  return <><output>{entrada.nom}</output><button onClick={() => onTriaEntrada(totes.find(item => item.id !== entrada.id))}>Tria una varietat germana</button></>;
} }));
import BancLlavorsWorkspaceSection from './BancLlavorsWorkspaceSection.jsx';
afterEach(cleanup);
it('la varietat germana visible també és l’entitat seleccionada per a publicació transversal', () => {
  render(<BancLlavorsWorkspaceSection page={{}} />);
  const original = m.selected;
  fireEvent.click(screen.getByRole('button', { name: 'Tria una varietat germana' }));
  expect(m.visible).not.toBe(original);
  expect(m.selected).toBe(m.visible);
});
