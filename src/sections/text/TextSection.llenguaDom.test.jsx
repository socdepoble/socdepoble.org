/* Gauntlet 261030 (cicle 3, tc3-lang-ca-sobre-interficie-traduida) · El
   lang="ca" de TC3.3 anava a tot l'<article> de la pàgina: amb la interfície
   en anglés, el botó repetit al final («Obrir la Consola», traduït amb t())
   quedava marcat com a valencià (WCAG 3.1.2), i les etiquetes i l'alt de la
   portada, que són de PAGE_COPY, quedaven sense. Ara, amb la pàgina de veres
   (PageDetailSection → TextSection → UniversalPage → PageFrame), el lang va
   al text de la pàgina (H1, entradilla, cos, etiquetes, alt) i no a la
   interfície. Amb la interfície en valencià, cap lang (el DOM de sempre).
   Els dobles de PageDetailSection.consola.test.jsx, amb la llengua del text
   de la interfície (llenguaDelText) que llig PageFrame. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';

const estat = vi.hoisted(() => ({ toast: vi.fn(), ui: { externalConfig: {} } }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: estat.toast }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva }),
  useUIState: () => estat.ui,
  useUIActionsOpcional: () => null
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import PageDetailSection from '../detail/PageDetailSection.jsx';
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';

const visita = (clau) => render(
  <MemoryRouter rutaInicial={`/page/${clau}`}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
    </Routes>
  </MemoryRouter>
);
const langDe = (node) => node?.closest('[lang]')?.getAttribute('lang') ?? null;
const article = () => document.querySelector('article.content-wrapper');

beforeEach(() => {
  estat.toast.mockReset();
  estat.ui = { externalConfig: {}, llenguaDelText: 'en' };
});
afterEach(cleanup);

test('/page/consola amb la interfície en anglés: el botó del final no és valencià; el text de la pàgina, sí', () => {
  visita('consola');
  expect(langDe(document.querySelector('header.page-title h1'))).toBe('ca');
  expect(article().hasAttribute('lang')).toBe(false);
  expect(langDe(article().querySelector('.page-intro .lead'))).toBe('ca');
  const cos = article().querySelector(':scope > article.cms-preview');
  expect(cos.getAttribute('lang')).toBe('ca');
  // El botó repetit al final (AccioDeLaPagina, lloc «baix») és de la interfície.
  const baix = article().querySelector(':scope > .sdp-pagina-accio > a');
  expect(baix).toBeTruthy();
  expect(langDe(baix)).toBeNull();
  // El de dalt (capçalera) també.
  expect(langDe(document.querySelector('header.page-title .page-title-accio > a'))).toBeNull();
  // Les etiquetes de PAGE_COPY i l'alt de la portada són de la pàgina.
  const etiquetes = [...document.querySelectorAll('header.page-title .page-title-labels > li')];
  expect(etiquetes.map((li) => [li.textContent, li.getAttribute('lang')]))
    .toEqual(PAGE_COPY.consola.labels.map((etiqueta) => [etiqueta.text, 'ca']));
  expect(langDe(document.querySelector('.hero-image img'))).toBe('ca');
});

test('/page/consola amb la interfície en valencià: cap lang enlloc (el DOM de sempre)', () => {
  estat.ui = { externalConfig: {}, llenguaDelText: 'ca' };
  const { container } = visita('consola');
  expect(container.querySelectorAll('[lang]')).toHaveLength(0);
});

test('«Legal i privacitat» (cos amb targetes) amb la interfície en anglés: els trossos de text porten «ca»; la targeta i el peu de la interfície, no', () => {
  const { container } = render(
    <MemoryRouter rutaInicial="/legal">
      <TextSection page={PAGE_COPY.legal} pageKey="legal">
        <div className="peu-de-prova"><button type="button">Open the Console</button></div>
      </TextSection>
    </MemoryRouter>
  );
  const cos = container.querySelector('article.cms-preview.sdp-amb-targetes');
  expect(cos.hasAttribute('lang')).toBe(false);
  const trossos = [...cos.querySelectorAll(':scope > .sdp-cos-tros')];
  expect(trossos.length).toBeGreaterThan(1);
  expect(trossos.map((tros) => tros.getAttribute('lang'))).toEqual(trossos.map(() => 'ca'));
  expect(langDe(cos.querySelector('.sdp-targetes'))).toBeNull();
  expect(langDe(container.querySelector('.peu-de-prova button'))).toBeNull();
});
