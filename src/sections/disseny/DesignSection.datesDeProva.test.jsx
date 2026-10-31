/**
 * Ordre del Mestre, 261001 · La portada de Disseny i la seua targeta del Mur
 * diuen la mateixa data. Troballa P2 de la revisió, confirmada al navegador:
 * en mode seed /disseny pintava el dia del copy (PAGE_COPY, un dia sol)
 * mentre la seua targeta del Mur i del Calendari portava la data de prova del
 * pageCopy (mur/datesDeProvaMur.js · TECNIQUES_DEL_MUR): la pastilla de la
 * pàgina duia a un dia del Calendari on la seua targeta no hi era.
 *
 * La llavor arriba com la servix el mode seed (llavorAmbDatesDeProva, com a
 * data/supabase/content.js) i el pageCopy es fa com a CoreContentContext. La
 * targeta és la de veres (TargetaDelMur) amb la pàgina de sistema que en fa
 * el Mur (targetesDeSistema).
 */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), core: { status: 'ready', pageCopy: {} } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (uri) => uri }),
  useUIState: () => ({ externalConfig: {}, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./cataleg/detailRegistry', () => ({ CATALOG_DETAIL_LOADERS: {} }));
/* Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · La portada registra ara el
   seu head (useSEO), que necessita la ubicació del router; esta suite mira dates i
   el router fals no en porta: el head el proven DesignSection.seo.test.jsx i el
   manifest social. */
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
/* La portada: el detall de l'element '__intro' del model. */
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({
  UniversalWorkspace: ({ model, renderDetail }) => renderDetail({ item: model.items.find((item) => item.id === '__intro') })
}));

import DesignSection from './DesignSection.jsx';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { llavorAmbDatesDeProva } from '../mur/datesDeProvaMur.js';
import { APP_SEED } from '../../data/appSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';

const textos = (control) => [...(control?.querySelectorAll('span') || [])].map((span) => span.textContent);
const pastillaDeLaPagina = (arrel) => arrel.querySelector('section.bar-orange .btn-date-time');
const destiDelClic = (control) => {
  mocks.navigate.mockClear();
  fireEvent.click(control);
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  return mocks.navigate.mock.calls[0][0];
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.core = { status: 'ready', pageCopy: {} };
});

/* Onada 8 (261009; requeriments 261009_1300, punt 2) · Disseny ja no porta
   data de prova: en seed, el pageCopy del core diu la data del Mestre (la de
   PAGE_COPY, 2026-09-10). Perquè la prova continue distingint les dues
   fonts, el core porta ací una altra data per a Disseny (la de prova
   d'abans, 2026-09-14T18:25:00+02:00), com un node que en tinguera una de
   pròpia: la portada i la targeta han de dir la del core. */
const DATA_DEL_CORE = '2026-09-14T18:25:00+02:00';

test('en seed, la portada de Disseny pinta la data del Mestre, la mateixa que la seua targeta del Mur', () => {
  const pageCopy = Object.fromEntries(
    llavorAmbDatesDeProva(APP_SEED, new Date(2026, 9, 1, 11, 15)).pages.map((pagina) => [pagina.id, { ...pagina }])
  );
  expect(pageCopy.disseny.date).toBe(PAGE_COPY.disseny.date);
  mocks.core = { status: 'ready', pageCopy };
  const pagina = pastillaDeLaPagina(render(<DesignSection />).container);
  const targeta = render(<TargetaDelMur item={targetesDeSistema(pageCopy).find((item) => item.id === 'disseny')} />)
    .container.querySelector('.sp-card-header .btn-date-time');
  expect(textos(pagina)).toEqual(['00:00', '10/09/26']);
  expect(textos(targeta)).toEqual(textos(pagina));
});

test('amb un core que diu una altra data, la portada de Disseny pinta el mateix dia i la mateixa hora que la seua targeta del Mur, i porten al mateix lloc del Calendari', () => {
  const pageCopy = Object.fromEntries(
    llavorAmbDatesDeProva(APP_SEED, new Date(2026, 9, 1, 11, 15)).pages.map((pagina) => [pagina.id, { ...pagina }])
  );
  pageCopy.disseny = { ...pageCopy.disseny, date: DATA_DEL_CORE };
  mocks.core = { status: 'ready', pageCopy };

  const pagina = pastillaDeLaPagina(render(<DesignSection />).container);
  const targetaDelMur = targetesDeSistema(pageCopy).find((item) => item.id === 'disseny');
  const targeta = render(<TargetaDelMur item={targetaDelMur} />).container.querySelector('.sp-card-header .btn-date-time');

  const esperada = dataHoraDeBarra({ creat: pageCopy.disseny.date });
  expect(esperada.time).toMatch(/^\d{2}:\d{2}$/);
  expect(textos(pagina)).toEqual([esperada.time, esperada.date]);
  expect(textos(targeta)).toEqual(textos(pagina));
  // El copy de reserva (PAGE_COPY) és un altre instant: la prova distingix
  // les dues fonts. T4 del prompt 1140 (ordre del Mestre, 261001): el copy
  // (mitjanit UTC) també porta hora; abans (D5) era un dia sol.
  const deReserva = dataHoraDeBarra({ creat: PAGE_COPY.disseny.date });
  expect(deReserva.time).toMatch(/^\d{2}:\d{2}$/);
  expect(textos(pagina)).not.toEqual([deReserva.time, deReserva.date]);
  // El mateix lloc del Calendari (la ruta exacta és de pastillaCalendari.js).
  const desti = destiDelClic(pagina);
  expect(desti).toMatch(/^\/calendari(\?|$)/);
  expect(desti).toBe(destiDelClic(targeta));
});

test('sense el pageCopy del core (carregant, o un core que no el porta), mana PAGE_COPY: l’instant del copy (T4: hora i dia)', () => {
  const { time, date } = dataHoraDeBarra({ creat: PAGE_COPY.disseny.date });
  for (const core of [{ status: 'loading', pageCopy: {} }, { status: 'ready' }]) {
    mocks.core = core;
    const arrel = render(<DesignSection />).container;
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(PAGE_COPY.disseny.title);
    expect(textos(pastillaDeLaPagina(arrel))).toEqual([time, date]);
    cleanup();
  }
});


test('la portada pròpia antiga usa el derivat lleuger amb espai reservat i conserva el copy del core', () => {
  mocks.core.pageCopy.disseny = { ...PAGE_COPY.disseny, image: '/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png', title: 'Disseny del core' };
  const { container } = render(<DesignSection />);
  const imatge = container.querySelector('.hero-image img');
  /* Pla 261022_1645 · El derivat lleuger és la bessona .webp del .png canònic (1.024 px). */
  expect(imatge.getAttribute('src')).toBe('/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.webp');
  expect(imatge.getAttribute('width')).toBe('1024');
  expect(imatge.getAttribute('height')).toBe('1024');
  expect(imatge.getAttribute('fetchpriority')).toBe('high');
  expect(container.querySelector('header.page-title h1').textContent).toBe('Disseny del core');
});

test('una portada remota diferent conserva la seua URL i no hereta una proporció inventada', () => {
  mocks.core.pageCopy.disseny = { ...PAGE_COPY.disseny, image: 'https://example.org/portada.jpg', imageWidth: undefined, imageHeight: undefined };
  const { container } = render(<DesignSection />);
  const imatge = container.querySelector('.hero-image img');
  expect(imatge.getAttribute('src')).toBe('https://example.org/portada.jpg');
  expect(imatge.hasAttribute('width')).toBe(false);
  expect(imatge.hasAttribute('height')).toBe(false);
});

/* Pla 261022_1645 · El .jpg de 768 px s'ha retirat de public/: un copy que encara
   el cite (un core vell, una llavor a mitges) també va a la bessona .webp. */
test('un copy que cita el .jpg retirat també pinta la bessona .webp del .png', () => {
  mocks.core.pageCopy.disseny = { ...PAGE_COPY.disseny, image: '/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.jpg', title: 'Disseny del core' };
  const { container } = render(<DesignSection />);
  const imatge = container.querySelector('.hero-image img');
  expect(imatge.getAttribute('src')).toBe('/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.webp');
  expect(imatge.getAttribute('width')).toBe('1024');
});
