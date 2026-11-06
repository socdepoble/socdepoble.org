/* Integradora R8 (261106; arbitratge R8, G4 i G6) · /page/herbari amb el
   PAGE_COPY real (no un pageCopy injectat, G6-06) i la maquinària de sempre
   (PageDetailSection → TextSection → UniversalPage): el text breu i, davall,
   l'herbari (HerbariLaTorreSection), carregat com a chunk lazy. Sense la
   reserva d'aplicaAparadorR20, que no es connecta (G1-01). */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';

/* Onada R9 · La llengua de la interfície es pot canviar per prova (ui.language); per defecte, el valencià. */
const ui = vi.hoisted(() => ({ language: undefined }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva, ...(ui.language ? { language: ui.language } : null) })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import PageDetailSection from './PageDetailSection.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../../data/patrimoni/herbariLaTorre117.js';

afterEach(cleanup);

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/" element={<p data-testid="inici">Inici</p>} />
    </Routes>
  </MemoryRouter>
);

describe('/page/herbari', () => {
  test('la pàgina és al PAGE_COPY, amb un sol H1, i l’herbari va davall del text', async () => {
    expect(PAGE_COPY.herbari.title).toBe('Herbari de La Torre');
    expect(ESPECIES_HERBARI_LA_TORRE_117).toHaveLength(117);
    expect(PAGE_COPY.herbari.subtitle).toContain('117');
    visita('/page/herbari');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Herbari de La Torre');
    const estat = await screen.findByText('117 / 117 fitxes');
    const seccio = estat.closest('section');
    const cos = document.querySelector('.cms-preview');
    expect(cos.compareDocumentPosition(seccio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(seccio.querySelectorAll('ol > li').length).toBeGreaterThan(0);
  });

  test('el text de la pàgina no promet cap aval de consum', () => {
    expect(PAGE_COPY.herbari.html).toContain('no són recomanacions de consum');
    expect(PAGE_COPY.herbari.html).toContain('sense consell expert');
  });

  /* Onada R9 (ordre del Mestre del 261106, 14:06) · /page/herbari traduïda a les altres 4 llengües
     de la interfície: el títol, el cos i les etiquetes de la traducció, sense lang (contingut i
     interfície en la mateixa llengua), i el mateix herbari de 117 fitxes davall. */
  test.each(['es', 'en', 'eu', 'gl'])('%s · la pàgina traduïda, amb l’herbari davall', async (llengua) => {
    ui.language = llengua;
    try {
      const traduccio = PAGE_COPY.herbari.translations[llengua];
      visita('/page/herbari');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect([h1.textContent, h1.getAttribute('lang')]).toEqual([traduccio.title, null]);
      const cos = document.querySelector('.cms-preview');
      expect(cos.getAttribute('lang')).toBeNull();
      expect(cos.querySelector('h3').textContent).toBe(new DOMParser().parseFromString(traduccio.html, 'text/html').querySelector('h3').textContent);
      for (const etiqueta of traduccio.labels) expect(screen.getByText(etiqueta.text)).toBeTruthy();
      const estat = await screen.findByText(new RegExp(`^117 / 117 `));
      expect(cos.compareDocumentPosition(estat.closest('section')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    } finally {
      ui.language = undefined;
    }
  });

  test('les altres pàgines no porten l’herbari', async () => {
    visita('/page/anatomia-rural');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('117 / 117 fitxes')).toBeNull();
  });
});
