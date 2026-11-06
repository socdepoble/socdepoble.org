/* IDEA-109 (onada R7) · /page/anatomia-rural amb la maquinària de sempre
   (PageDetailSection → TextSection → UniversalPage): el text breu del PAGE_COPY
   i, davall, el visor, carregat com a chunk lazy. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';

vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import PageDetailSection from './PageDetailSection.jsx';
import { PAGE_COPY } from '../text/pageContent.js';

afterEach(cleanup);

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/" element={<p data-testid="inici">Inici</p>} />
    </Routes>
  </MemoryRouter>
);

describe('/page/anatomia-rural', () => {
  test('la pàgina és al PAGE_COPY, amb un sol H1 i el visor davall del text', async () => {
    expect(PAGE_COPY['anatomia-rural'].title).toBe('Anatomia rural');
    visita('/page/anatomia-rural');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Anatomia rural');
    const visor = await screen.findByLabelText('🔧 Muntar ↔ Desmuntar peça a peça');
    expect(visor.getAttribute('type')).toBe('range');
    const cos = document.querySelector('.cms-preview');
    const section = document.querySelector('section.anatomia');
    expect(cos.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(screen.getByRole('group', { name: /ordre de l’esquema/ })).getAllByRole('button').length).toBeGreaterThan(5);
  });

  test('les altres pàgines no porten el visor', async () => {
    visita('/page/drets-autor');
    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelector('section.anatomia')).toBeNull();
  });
});
