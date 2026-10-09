/**
 * Ordre del Mestre, 261001 · La portada de la Wiki i la seua targeta del Mur
 * diuen la mateixa data. Troballa P2 de la revisió, confirmada al navegador:
 * en mode seed /wikidepoble pintava el dia del copy (PAGE_COPY, un dia sol)
 * mentre la seua targeta del Mur i del Calendari portava la data de prova del
 * pageCopy (mur/datesDeProvaMur.js): la pastilla de la pàgina duia a un dia
 * del Calendari on la seua targeta no hi era.
 *
 * La llavor arriba com la servix el mode seed (llavorAmbDatesDeProva, com a
 * data/supabase/content.js) i el pageCopy es fa com a CoreContentContext. La
 * targeta és la de veres (TargetaDelMur) amb la pàgina de sistema que en fa
 * el Mur (targetesDeSistema): cap data recalculada a la prova.
 */
import React from 'react';
import { cleanup, findByText, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), core: { status: 'ready', pageCopy: {} }, itemId: '__intro' }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/wikidepoble', search: '' }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (uri) => uri }),
  useUIState: () => ({ externalConfig: {}, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
/* Onada 7 (261009) · La Consola arriba a demanda: el doble pinta una marca
   perquè la prova n'espere la càrrega. */
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => <p>Doble de la Consola</p> }));
vi.mock('../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [] } }));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: ({ model, renderDetail }) => renderDetail({ item: model.items.find((item) => item.id === mocks.itemId) })
}));

import WikiDePobleSection from './WikiDePobleSection.jsx';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { llavorAmbDatesDeProva } from '../mur/datesDeProvaMur.js';
import { APP_SEED } from '../../data/appSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { COVER_PAGE_KEYS } from '../../config/systemPages.js';

/* El pageCopy com el fa CoreContentContext de les pàgines del mode seed. */
const pageCopyDelSeed = (ara) => Object.fromEntries(
  llavorAmbDatesDeProva(APP_SEED, ara).pages.map((pagina) => [pagina.id, { ...pagina }])
);

const textos = (control) => [...(control?.querySelectorAll('span') || [])].map((span) => span.textContent);
const pastillaDeLaPagina = (arrel) => arrel.querySelector('section.bar-orange .btn-date-time');
const pastillaDeLaTargeta = (arrel) => arrel.querySelector('.sp-card-header .btn-date-time');
/* On porta el clic de la pastilla: la ruta del Calendari que navega. */
const destiDelClic = (control) => {
  mocks.navigate.mockClear();
  fireEvent.click(control);
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  return mocks.navigate.mock.calls[0][0];
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.itemId = '__intro';
  mocks.core = { status: 'ready', pageCopy: {} };
});

test.each([
  ['dijous, a l’hora de l’ordre', new Date(2026, 9, 1, 11, 15)],
  ['dilluns de matinada', new Date(2026, 8, 28, 3, 0)]
])('en seed (%s), la portada de la Wiki pinta el mateix dia i la mateixa hora que la seua targeta del Mur, i porten al mateix lloc del Calendari', (_, ara) => {
  const pageCopy = pageCopyDelSeed(ara);
  mocks.core = { status: 'ready', pageCopy };

  const pagina = pastillaDeLaPagina(render(<WikiDePobleSection />).container);
  const targetaDelMur = targetesDeSistema(pageCopy).find((item) => item.id === COVER_PAGE_KEYS.wiki);
  const targeta = pastillaDeLaTargeta(render(<TargetaDelMur item={targetaDelMur} />).container);

  // La data de prova porta hora: la pastilla sencera, hora i dia.
  const esperada = dataHoraDeBarra({ creat: pageCopy[COVER_PAGE_KEYS.wiki].date });
  expect(esperada.time).toMatch(/^\d{2}:\d{2}$/);
  expect(textos(pagina)).toEqual([esperada.time, esperada.date]);
  expect(textos(targeta)).toEqual(textos(pagina));
  // El defecte que es corregix: la del copy de reserva (PAGE_COPY) no és la
  // de la targeta. La prova distingix les dues fonts. T4 del prompt 1140
  // (ordre del Mestre, 261001): el copy és un instant (mitjanit UTC) i també
  // porta hora; abans (D5) era un dia sol.
  const deReserva = dataHoraDeBarra({ creat: PAGE_COPY[COVER_PAGE_KEYS.wiki].date });
  expect(deReserva.time).toMatch(/^\d{2}:\d{2}$/);
  expect(textos(pagina)).not.toEqual([deReserva.time, deReserva.date]);
  // Totes dues porten al mateix lloc del Calendari (la ruta exacta és de
  // pastillaCalendari.js, un altre carril: ací es fixa que coincidixen).
  const desti = destiDelClic(pagina);
  expect(desti).toMatch(/^\/calendari(\?|$)/);
  expect(desti).toBe(destiDelClic(targeta));
});

test('mentre el contingut core carrega (pageCopy buit) o sense la pàgina, mana PAGE_COPY: l’instant del copy (T4: hora i dia)', () => {
  const copy = PAGE_COPY[COVER_PAGE_KEYS.wiki];
  const { time, date } = dataHoraDeBarra({ creat: copy.date });
  mocks.core = { status: 'loading', pageCopy: {} };
  const arrel = render(<WikiDePobleSection />).container;
  expect(arrel.querySelector('header.page-title h1').textContent).toBe(copy.title);
  expect(textos(pastillaDeLaPagina(arrel))).toEqual([time, date]);
  cleanup();
  // Un core sense pageCopy (com el doble de barraTaronjaData.contracte.test.jsx).
  mocks.core = { status: 'ready' };
  expect(textos(pastillaDeLaPagina(render(<WikiDePobleSection />).container))).toEqual([time, date]);
});

test('el copy del core mana també en el títol de la portada i de la Consola incrustada', async () => {
  mocks.core = {
    status: 'ready',
    pageCopy: {
      [COVER_PAGE_KEYS.wiki]: { ...PAGE_COPY[COVER_PAGE_KEYS.wiki], title: 'Wiki del core' },
      [COVER_PAGE_KEYS.consola]: { ...PAGE_COPY[COVER_PAGE_KEYS.consola], title: 'Consola del core', date: '2026-09-29T10:30:00Z' }
    }
  };
  expect(render(<WikiDePobleSection />).container.querySelector('header.page-title h1').textContent).toBe('Wiki del core');
  cleanup();
  mocks.itemId = 'consola_termodinamica';
  const arrel = render(<WikiDePobleSection />).container;
  expect(arrel.querySelector('header.page-title h1').textContent).toBe('Consola del core');
  const { time, date } = dataHoraDeBarra({ creat: '2026-09-29T10:30:00Z' });
  expect(textos(pastillaDeLaPagina(arrel))).toEqual([time, date]);
  // Quan el tauler arriba, la capçalera del core continua igual.
  expect(await findByText(arrel, 'Doble de la Consola')).toBeTruthy();
  expect(arrel.querySelector('header.page-title h1').textContent).toBe('Consola del core');
  expect(textos(pastillaDeLaPagina(arrel))).toEqual([time, date]);
});
