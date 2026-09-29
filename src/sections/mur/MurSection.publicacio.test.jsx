/**
 * Poliment T39/T40 · La targeta del Mur pinta el que la publicació porta:
 * els drets triats a la vista de drets (payload.copyright) i la data triada al
 * calendari (payload.publish_date). El text de sèrie i created_at només quan
 * la publicació no en porta (la llavor i les publicacions d'abans).
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
import MurSection from './MurSection.jsx';
import { COPYRIGHT_SDP, dataDElement } from '../../components/universal/editorial.js';

/* Una publicació tal com la deixa loadSections: el payload de publishNote,
   amb l'id i el created_at de la fila. */
const publicacio = (payload) => ({ type: 'feed', labels: [{ text: 'Publicació', className: 'sdp-badge-category' }], ...payload });
const diaDelMur = (iso) => new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
const targetaDe = (titol) => {
  const targeta = [...document.querySelectorAll('.sdp-card-grid > *')].find((element) => element.textContent.includes(titol));
  expect(targeta, titol).toBeTruthy();
  return targeta.textContent;
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = {
    status: 'ready', error: null, sortedEvents: [], sortedMarketItems: [],
    sortedFeedPosts: [
      publicacio({ id: 'cc', title: 'Recepta de coca', copyright: 'CC BY 4.0', created_at: '2026-09-01T10:00:00.000Z', publish_date: '2026-10-05T08:30:00.000Z' }),
      publicacio({ id: 'vella', title: 'Crònica vella', created_at: '2026-08-15T10:00:00.000Z' })
    ]
  };
});

test('una publicació amb «CC BY 4.0» ho diu a la targeta; una sense drets porta el text de sèrie', () => {
  render(<MurSection />);
  expect(screen.getByText('CC BY 4.0')).toBeTruthy();
  expect(targetaDe('Recepta de coca')).toContain('CC BY 4.0');
  expect(targetaDe('Recepta de coca')).not.toContain(COPYRIGHT_SDP);
  expect(targetaDe('Crònica vella')).toContain(COPYRIGHT_SDP);
});

test('la data de la targeta és la triada al calendari; sense, la de creació', () => {
  render(<MurSection />);
  expect(targetaDe('Recepta de coca')).toContain(diaDelMur('2026-10-05T08:30:00.000Z'));
  expect(targetaDe('Crònica vella')).toContain(diaDelMur('2026-08-15T10:00:00.000Z'));
});

/* ── T51 · La data del Mur, pel lector únic (editorial.js) ────────────────
   La pastilla i l'ordre ixen de la MATEIXA data (dataDElement /
   momentDElement): el dia de l'acte, la triada o la de creació, i una edició
   de veres si és posterior. Cap data fixa inventada ni cap «02:00» de la
   mitjanit UTC a les pàgines de sistema. */
const elementDe = (titol) => [...document.querySelectorAll('.sdp-card-grid > *')].find((element) => element.textContent.includes(titol));
const pastillaDe = (titol) => [...elementDe(titol).querySelectorAll('.sp-card-header .btn-date-time span')].map((span) => span.textContent);
const esperada = (item) => {
  const { time, date } = dataDElement(item);
  return [time, date].filter(Boolean);
};
const COPY_PROJECTE = { title: 'El projecte', subtitle: 'Qui som', date: '2026-08-20T00:00:00.000Z' };
const EDITADA = { id: 'editada', title: 'Crònica editada', created_at: '2026-08-01T10:00:00.000Z', updated_at: '2026-09-10T10:00:00.000Z' };
const INSERCIO = { id: 'insercio', title: 'Crònica sense editar', created_at: '2026-07-01T10:00:00.100+00:00', updated_at: '2026-07-01T10:00:00.183412+00:00', publish_date: '2026-06-01T09:00:00.000Z' };

test('T51 · la pàgina de sistema porta el dia del seu copy, sense cap «02:00» inventada', () => {
  mocks.core = { status: 'ready', error: null, pageCopy: { projecte: COPY_PROJECTE } };
  render(<MurSection />);
  expect(pastillaDe('El projecte')).toEqual(['20/08/26']);
  expect(elementDe('El projecte').textContent).not.toMatch(/\d{2}:\d{2}/);
});

test('T51 · la pastilla de cada publicació és la del lector únic; l’updated_at de la inserció no compta com a edició', () => {
  mocks.mur.sortedFeedPosts = [...mocks.mur.sortedFeedPosts, publicacio(EDITADA), publicacio(INSERCIO)];
  render(<MurSection />);
  expect(pastillaDe('Recepta de coca')).toEqual(esperada({ publish_date: '2026-10-05T08:30:00.000Z' }));
  expect(pastillaDe('Recepta de coca')).toHaveLength(2);
  expect(pastillaDe('Crònica editada')).toEqual(esperada({ updated_at: EDITADA.updated_at }));
  // Publicada sense editar: la data triada (1 de juny), no l'hora d'inserció (1 de juliol).
  expect(pastillaDe('Crònica sense editar')).toEqual(esperada({ publish_date: INSERCIO.publish_date }));
  expect(pastillaDe('Crònica sense editar')[1]).toBe(diaDelMur(INSERCIO.publish_date));
});

test('T51 · l’ordre és el de la data que pinta la targeta; un element sense cap data va al final, sense data fixa inventada', () => {
  mocks.core = { status: 'ready', error: null, pageCopy: { projecte: COPY_PROJECTE } };
  mocks.mur.sortedFeedPosts = [
    publicacio({ id: 'sense', title: 'Sense cap data' }),
    ...mocks.mur.sortedFeedPosts,
    publicacio(EDITADA),
    publicacio(INSERCIO)
  ];
  render(<MurSection />);
  const titols = [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((titol) => titol.textContent);
  expect(titols).toEqual(['Recepta de coca', 'Crònica editada', 'El projecte', 'Crònica vella', 'Crònica sense editar', 'Sense cap data']);
  expect(elementDe('Sense cap data').querySelector('.btn-date-time')).toBeNull();
});
