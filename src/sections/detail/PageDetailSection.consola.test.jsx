/**
 * Onada 10 (261010; pla 261010_1121; decisió M2 del Mestre del 261010) · «La
 * Consola Termodinàmica» i «El Cervell» a /page/consola i /page/cervell, de
 * punta a punta, amb la UniversalPage i el PageFrame de veres. Bessona de
 * PageDetailSection.xat.test.jsx:
 *  · el botó «Obrir…» va DALT I AL FINAL, com les pàgines de Publicar: dins
 *    del bloc blanc de l'H1 (header.page-title > div.page-title-accio) i
 *    repetit després del cos (article.content-wrapper > div.sdp-pagina-accio,
 *    l'últim fill, darrere de .cms-preview). Els dos són la mateixa porta
 *    gran i blava de Pedra Seca, cap a /consola i /consola/explorador;
 *  · el cos són sis paràgrafs (PAGE_COPY, camp `html`);
 *  · la capçalera pinta Categoria i Etiqueta, les mateixes de la targeta del
 *    Mur (PAGE_COPY, camp `labels`).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';

const estat = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: estat.toast }) }));
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
import { RUTA_CONSOLA } from '../consola/consolaPagines.js';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const visita = (clau) => render(
  <MemoryRouter rutaInicial={`/page/${clau}`}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
    </Routes>
    <Ubicacio />
  </MemoryRouter>
);
const capcalera = () => document.querySelector('header.page-title');
const article = () => document.querySelector('article.content-wrapper');
const CLASSE = 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple';

const PAGINES = [
  ['consola', 'Obrir la Consola', RUTA_CONSOLA],
  ['cervell', 'Obrir el Cervell', `${RUTA_CONSOLA}/explorador`]
];

beforeEach(() => { estat.toast.mockReset(); });
afterEach(cleanup);

describe.each(PAGINES)('Onada 10 · /page/%s', (clau, verb, desti) => {
  test(`«${verb}» dalt, dins del bloc blanc de l’H1, i repetit al final, darrere del cos`, () => {
    visita(clau);
    expect(capcalera().querySelector('h1').textContent).toBe(PAGE_COPY[clau].title);
    // Dalt: davall de l'H1 i abans del copyright, com el de Publicar i el d'El Xat.
    const fills = [...capcalera().children].map((fill) => fill.tagName + (fill.className ? `.${fill.className.split(' ')[0]}` : ''));
    const h1 = fills.indexOf('H1');
    const accio = fills.indexOf('DIV.page-title-accio');
    const copyright = fills.indexOf('P.sp-card-copyright');
    expect([h1 >= 0, accio > h1, copyright > accio]).toEqual([true, true, true]);
    const dalt = capcalera().querySelectorAll('.page-title-accio > a');
    expect(dalt).toHaveLength(1);
    expect([dalt[0].className, dalt[0].getAttribute('href'), dalt[0].textContent]).toEqual([CLASSE, desti, verb]);
    // Baix: l'últim fill de l'article, just darrere del cos.
    const baix = article().querySelectorAll(':scope > .sdp-pagina-accio > a');
    expect(baix).toHaveLength(1);
    expect([baix[0].className, baix[0].getAttribute('href'), baix[0].textContent]).toEqual([CLASSE, desti, verb]);
    const caixa = baix[0].parentElement;
    expect(article().lastElementChild).toBe(caixa);
    expect(caixa.previousElementSibling.className).toBe('cms-preview');
    // Dos controls amb el mateix nom que porten al mateix lloc, i cap més.
    expect(screen.getAllByRole('link', { name: verb })).toHaveLength(2);
    expect(document.querySelectorAll('.sdp-boto--gran')).toHaveLength(2);
  });

  test('els dos botons naveguen al mateix destí', () => {
    visita(clau);
    fireEvent.click(capcalera().querySelector('.page-title-accio > a'));
    expect(ubicacio()).toBe(desti);
    cleanup();
    visita(clau);
    fireEvent.click(article().querySelector(':scope > .sdp-pagina-accio > a'));
    expect(ubicacio()).toBe(desti);
  });

  test('el cos són sis paràgrafs, sense cap títol ni cap altra peça', () => {
    visita(clau);
    const cos = article().querySelector(':scope > .cms-preview');
    expect([...cos.children].map((fill) => fill.tagName)).toEqual(['P', 'P', 'P', 'P', 'P', 'P']);
    for (const paragraf of cos.children) expect(paragraf.textContent.trim().length).toBeGreaterThan(80);
    // Cada paràgraf porta negretes per a llegir-lo d'un colp d'ull.
    for (const paragraf of cos.children) expect(paragraf.querySelector('strong')).not.toBeNull();
  });

  test('la capçalera pinta Categoria i Etiqueta, les de la targeta del Mur, i la il·lustració de la pàgina', () => {
    visita(clau);
    const etiquetes = PAGE_COPY[clau].labels;
    expect(etiquetes.map((etiqueta) => etiqueta.className)).toEqual(['sdp-badge-category', 'sdp-badge-tag']);
    for (const etiqueta of etiquetes) {
      const pindola = [...capcalera().querySelectorAll(`.${etiqueta.className}`)].find((node) => node.textContent === etiqueta.text);
      expect([clau, etiqueta.text, Boolean(pindola)]).toEqual([clau, etiqueta.text, true]);
    }
    // Ja no les píndoles de reserva de propsDePaginaDeText («CONSOLA · Pàgina»).
    expect(capcalera().textContent).not.toContain(clau.toUpperCase());
    const hero = document.querySelector('.hero-image img');
    expect([hero.getAttribute('src'), hero.getAttribute('alt')]).toEqual([PAGE_COPY[clau].image, PAGE_COPY[clau].imageAlt]);
  });
});

/* /page/xat no canvia amb l'Onada 10: un sol botó, dalt (la seua prova és
   PageDetailSection.xat.test.jsx). Ací, la frontera: una pàgina amb acció que
   no la repetix al final. */
test('El Xat continua amb un sol botó, dalt: cap div.sdp-pagina-accio', () => {
  visita('xat');
  expect(capcalera().querySelectorAll('.page-title-accio > a')).toHaveLength(1);
  expect(document.querySelector('.sdp-pagina-accio')).toBeNull();
  expect(screen.getAllByRole('link', { name: 'Anar al xat' })).toHaveLength(1);
});
