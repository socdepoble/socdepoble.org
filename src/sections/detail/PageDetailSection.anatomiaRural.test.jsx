/* IDEA-109 (onada R7) · /page/anatomia-rural amb la maquinària de sempre
   (PageDetailSection → TextSection → UniversalPage): el text breu del PAGE_COPY
   i, davall, el visor, carregat com a chunk lazy.
   P0-45 / IDEA-176 (decisió del Mestre i MarIA, 261107) · Hui la pàgina només
   mostra el visor 3D del Pou de la Neu del Rentonar (PouDeLaNeuAnatomiaCard):
   ni el visor general (VisorAnatomiaRural3D: almàssera, molí, forn de calç…)
   ni cap bloc «La resta d'artefactes agrícoles… En preparació documental». El
   text, en les 5 llengües, parla del pou amb les xifres de Josep Mª Segura
   Martí (1987), les mateixes de SEGURA_1987. */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';

/* La llengua de la interfície es pot canviar per prova (ui.language), com a l'herbari; per defecte, el valencià. */
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
import { localitzaPagina } from '../text/pageContent.r10.js';
import { SEGURA_1987 } from '../../components/patrimoni/iso/pouNeuRentonar.js';

afterEach(cleanup);

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/" element={<p data-testid="inici">Inici</p>} />
    </Routes>
  </MemoryRouter>
);

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const cosDe = (html) => new DOMParser().parseFromString(html, 'text/html').body;
/* Les xifres de Segura en la forma de cada llengua: coma decimal i punt de milers, menys en anglés. */
const xifra = (clau, llengua) => {
  const { valor, decimals } = SEGURA_1987[clau];
  return new Intl.NumberFormat(llengua === 'en' ? 'en-US' : 'de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(valor);
};
/* Les obres sense documentació completa: cap no ha d'eixir al text de la pàgina, en cap llengua. */
const ALTRES_OBRES = /almàssera|almazara|oil mill|olio|lagar|forn de calç|horno de cal|lime kiln|kare-labe|forno de cal|molí|molino|carbonera|resta d’artefactes|resta d'artefactes|preparació documental/i;

describe('/page/anatomia-rural', () => {
  test('la pàgina és al PAGE_COPY, amb un sol H1 i, davall del text, només el visor del Pou de la Neu', async () => {
    expect(PAGE_COPY['anatomia-rural'].title).toBe('Anatomia rural');
    visita('/page/anatomia-rural');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Anatomia rural');
    await waitFor(() => expect(document.querySelectorAll('.pou-neu-card')).toHaveLength(1), { timeout: 10000 });
    const cos = document.querySelector('.cms-preview');
    const hero = document.querySelector('.pou-neu-card');
    expect(cos.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hero.querySelector('.pou-neu-note').textContent).toContain('no mesures del monument');
    // El visor general ja no es munta: ni la secció, ni el control de muntar, ni la llista de peces.
    expect(document.querySelector('section.anatomia')).toBeNull();
    expect(screen.queryByLabelText('🔧 Muntar ↔ Desmuntar peça a peça')).toBeNull();
    expect(screen.queryByRole('group', { name: /ordre de l’esquema/ })).toBeNull();
    // Cap bloc de «la resta d'artefactes» en preparació.
    expect(document.querySelector('.sdp-anatomia-rural-properament')).toBeNull();
    expect(document.body.textContent).not.toMatch(/resta d.artefactes agrícoles|En preparació documental/);
    // El cos parla del pou de Segura, i de cap altra obra.
    expect(cos.textContent).toContain('Pou de la Neu del Rentonar');
    expect(cos.textContent).toContain('Josep Mª Segura Martí');
    expect(cos.textContent).not.toMatch(ALTRES_OBRES);
  });

  test('les altres pàgines no porten el visor', async () => {
    visita('/page/drets-autor');
    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelector('section.anatomia')).toBeNull();
    expect(document.querySelector('.pou-neu-card')).toBeNull();
  });

  /* Llei 0 · El subtítol, l'entradeta i el cos, en les 5 llengües, només parlen del Pou de la Neu del
     Rentonar, amb la mateixa estructura (2 h3 i 5 paràgrafs) i les xifres de SEGURA_1987: si una cota
     canvia a la font única, esta prova obliga a canviar el text. */
  test.each(LLENGUES)('%s · el text parla del Pou de la Neu amb les xifres de Segura (1987)', (llengua) => {
    const pagina = localitzaPagina(PAGE_COPY['anatomia-rural'], llengua);
    if (llengua !== 'ca') {
      expect(PAGE_COPY['anatomia-rural'].translations[llengua]).toBeTruthy();
      expect(pagina.contentLanguage).toBe(llengua);
    }
    const cos = cosDe(pagina.html);
    expect([cos.querySelectorAll('h3').length, cos.querySelectorAll('p').length]).toEqual([2, 5]);
    for (const text of [pagina.subtitle, pagina.lead, cos.textContent]) expect(text).not.toMatch(ALTRES_OBRES);
    expect(pagina.lead).toMatch(/Rentonar/);
    expect(pagina.subtitle).toMatch(/Rentonar/);
    expect(pagina.lead).toContain('Josep Mª Segura Martí');
    expect(pagina.lead).toContain('(1987)');
    for (const clau of ['diametreInterior', 'fondariaFinestres', 'gruixMur', 'capacitat', 'tunel', 'galeria']) {
      expect(cos.textContent, `${llengua}: ${clau}`).toContain(`${xifra(clau, llengua)} m`);
    }
    expect(cos.querySelector('a[href="/mur/noves-tecnologies-aplicades-a-la-cultura-rural"]')).not.toBeNull();
  });

  test.each(['es', 'en', 'eu', 'gl'])('%s · la pàgina traduïda, amb el visor del pou davall', async (llengua) => {
    ui.language = llengua;
    try {
      const traduccio = PAGE_COPY['anatomia-rural'].translations[llengua];
      visita('/page/anatomia-rural');
      const h1 = screen.getByRole('heading', { level: 1 });
      expect([h1.textContent, h1.getAttribute('lang')]).toEqual([traduccio.title, null]);
      const cos = document.querySelector('.cms-preview');
      expect(cos.getAttribute('lang')).toBeNull();
      expect(cos.querySelector('h3').textContent).toBe(cosDe(traduccio.html).querySelector('h3').textContent);
      await waitFor(() => expect(document.querySelectorAll('.pou-neu-card')).toHaveLength(1), { timeout: 10000 });
      expect(document.querySelector('section.anatomia')).toBeNull();
    } finally {
      ui.language = undefined;
    }
  });
});
