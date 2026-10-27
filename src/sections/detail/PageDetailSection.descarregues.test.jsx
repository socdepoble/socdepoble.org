/**
 * Ordre del Mestre (261026_2126; prompt i pla 261026_2130, tasca 1; P1-38) ·
 * «Descàrregues i Aplicacions» a /page/descarregues, de punta a punta, amb la
 * UniversalPage i el PageFrame de veres (PageDetailSection, cap component
 * nou):
 *  · l'H1 és el títol del Mestre i la capçalera, la il·lustració de la pàgina
 *    (1024×1024, amb prioritat alta, com El Xat);
 *  · el cos porta un apartat per a cada camí (Android, iPhone i iPad,
 *    l'ordinador) i un per a la visió, amb els subapartats en H4 i H5;
 *  · cap botó gran, ni dalt ni baix: no en té, com Drets d'autor.
 * Revisió (261026_2126, segona volta) · L'adreça curta /descarregues ja no es
 * redeclara ací (passava encara que App.jsx no la tinguera): la prova amb
 * l'app de veres és src/app/App.descarregues.test.jsx.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
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

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/" element={<p data-testid="inici">Inici</p>} />
    </Routes>
  </MemoryRouter>
);
const capcalera = () => document.querySelector('header.page-title');
const cos = () => document.querySelector('.cms-preview');

afterEach(cleanup);

test('/page/descarregues: l’H1 del Mestre, la il·lustració de la pàgina i cap botó gran', () => {
  visita('/page/descarregues');
  expect(capcalera().querySelector('h1').textContent).toBe('Descàrregues i Aplicacions');
  const hero = document.querySelector('.hero-image img');
  expect([hero.getAttribute('src'), hero.getAttribute('alt')]).toEqual([PAGE_COPY.descarregues.image, PAGE_COPY.descarregues.imageAlt]);
  expect([hero.getAttribute('width'), hero.getAttribute('height'), hero.getAttribute('fetchpriority')]).toEqual(['1024', '1024', 'high']);
  expect(capcalera().querySelector('.page-title-accio')).toBeNull();
  expect(document.querySelector('.sdp-pagina-accio')).toBeNull();
});

test('/page/descarregues: un apartat per a cada camí i un per a la visió, amb H4 i H5 dins', () => {
  visita('/page/descarregues');
  const text = (selector) => [...cos().querySelectorAll(selector)].map((titol) => titol.textContent);
  expect(text('h3')).toEqual([
    'La mateixa aplicació, a cada aparell',
    'Android',
    'iPhone i iPad',
    "A l'ordinador i des de qualsevol navegador",
    'Com funciona per dins: hui i demà'
  ]);
  expect(text('h4')).toEqual(expect.arrayContaining(['Google Play', 'APK directe', 'Apple TestFlight', 'App Store']));
  expect(text('h5')).toEqual(["A l'ordinador", 'Al mòbil i a la tauleta']);
  // Cap enllaç: ni botigues ni APK encara no són públics per a tothom.
  expect(cos().querySelectorAll('a')).toHaveLength(0);
});

/* Ordre del Mestre (261027; auditoria Gauntlet R5, G1-01 i G5-01) · Dins de
   l'app nativa (el pont de Capacitor que llig esAppNativa) la pàgina no s'obri:
   nomena Android, Google Play i l'APK (regla 2.3.10 de l'App Store). L'adreça
   curta /descarregues hi porta (App.jsx), i d'ací, a l'inici. Les altres
   pàgines del sistema s'obrin igual. */
test('dins de l’app nativa, /page/descarregues porta a l’inici; Drets d’autor s’obri igual', () => {
  window.Capacitor = { isNativePlatform: () => true };
  try {
    visita('/page/descarregues');
    expect(document.querySelector('[data-testid="inici"]')).not.toBeNull();
    expect(capcalera()).toBeNull();
    expect(document.body.textContent).not.toMatch(/Android|Google Play|APK/);
    cleanup();
    visita('/page/drets-autor');
    expect(capcalera().querySelector('h1')).not.toBeNull();
  } finally {
    delete window.Capacitor;
  }
});
