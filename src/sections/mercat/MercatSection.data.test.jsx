/**
 * Ordre del Mestre, 261001 · La boina d'un producte del Mercat pinta la data
 * amb el format i el lector únics (editorial.js · dataDElement), els mateixos
 * que la seua targeta al Mur (TargetaDelMur): «dd/mm/aa» i «hh:mm», i porta
 * al Calendari en el seu dia. Abans el Mercat la feia amb toLocaleDateString
 * («30/9/2026», segons l'ICU de cada navegador) i no passava dateTime.
 */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), mur: { status: 'ready', sortedMarketItems: [] } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver.js', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));

import MercatSection from './MercatSection.jsx';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { dataDElement, dataHoraDeBarra } from '../../components/universal/editorial.js';

/* Una hora que toLocaleDateString('ca-ES') pintava «30/9/2026». */
const MEL = { id: 'mel', type: 'market', title: 'Mel de romer', created_at: '2026-09-30T10:05:00.000Z' };
/* Editat de veres (més d'un minut després): la pastilla diu la de l'edició. */
const OLI = { id: 'oli', type: 'market', title: 'Oli de la Torre', created_at: '2026-09-02T08:00:00.000Z', updated_at: '2026-09-29T17:40:00.000Z' };
const SENSE_DATA = { id: 'ous', type: 'market', title: 'Ous de corral' };

const textos = (control) => [...(control?.querySelectorAll('span') || [])].map((span) => span.textContent);
const targetaDe = (arrel, titol) => [...arrel.querySelectorAll('.sdp-card-grid > article')]
  .find((article) => article.querySelector('.sp-card-title')?.textContent === titol);
const pastillaDe = (targeta) => targeta.querySelector('.sp-card-header .btn-date-time');
const destiDelClic = (control) => {
  mocks.navigate.mockClear();
  fireEvent.click(control);
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  return mocks.navigate.mock.calls[0][0];
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.mur = { status: 'ready', sortedMarketItems: [MEL, OLI, SENSE_DATA] };
});

test('la boina pinta «hh:mm» i «dd/mm/aa» de dataDElement, mai el format de toLocaleDateString', () => {
  const arrel = render(<MercatSection />).container;
  for (const item of [MEL, OLI]) {
    const data = dataDElement(item);
    const pastilla = textos(pastillaDe(targetaDe(arrel, item.title)));
    expect(pastilla).toEqual([data.time, data.date]);
    expect(pastilla).toEqual([expect.stringMatching(/^\d{2}:\d{2}$/), expect.stringMatching(/^\d{2}\/\d{2}\/\d{2}$/)]);
  }
  // L'edició de veres mana (la regla del Mestre: la més recent), com al Mur.
  const edicio = dataHoraDeBarra({ creat: OLI.updated_at });
  expect(textos(pastillaDe(targetaDe(arrel, OLI.title)))).toEqual([edicio.time, edicio.date]);
  // Sense cap data real, cap pastilla (no se n'inventa cap).
  expect(pastillaDe(targetaDe(arrel, SENSE_DATA.title))).toBeNull();
});

test('la pastilla del Mercat és la mateixa que la del producte al Mur i porta al mateix lloc del Calendari (dateTime)', () => {
  const mercat = render(<MercatSection />).container;
  const delMercat = pastillaDe(targetaDe(mercat, MEL.title));
  const delMur = pastillaDe(render(<TargetaDelMur item={MEL} />).container.querySelector('article'));
  expect(textos(delMercat)).toEqual(textos(delMur));
  expect(delMercat.getAttribute('aria-label')).toBe(delMur.getAttribute('aria-label'));
  /* La ruta exacta del Calendari és de pastillaCalendari.js (un altre carril):
     ací només es fixa que el Mercat porta on porta el Mur. */
  const desti = destiDelClic(delMercat);
  expect(desti).toMatch(/^\/calendari(\?|$)/);
  expect(desti).toBe(destiDelClic(delMur));
});
