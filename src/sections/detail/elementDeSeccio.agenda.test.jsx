/**
 * Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16: «El botó
 * "Agenda" de la targeta portarà a la data específica del Calendari») · La
 * pàgina de detall d'un acte: l'etiqueta «Agenda» (la de la secció) porta a la
 * vista Mes del Calendari amb el dia de l'acte triat, el mateix dia que la
 * seua targeta (EventCard: la insígnia). La resta de seccions, i un acte sense
 * dia real, l'etiqueta de sempre.
 */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));

import { paginaDElement } from './elementDeSeccio.js';
import { buildEventsDetailSectionMeta, buildMurDetailSectionMeta } from './detailSectionMeta.jsx';
import { EventCard } from '../../components/universal/EventCard.jsx';
import { PageFrame } from '../../components/universal/PageFrame.jsx';
import { acteAEsdeveniment } from '../mur/agendaMur.js';

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

const t = (_, alternativa) => alternativa;
const ACTES = buildEventsDetailSectionMeta({ events: [], t });

test('l’etiqueta «Agenda» d’un acte porta al seu dia al Calendari, amb la diana de l’etiqueta enllaçada', () => {
  const pagina = paginaDElement(ACTES, { id: 'fira', title: 'Fira de tardor', date: '2026-11-14' });
  expect(pagina.labels).toEqual([
    { text: 'Agenda', className: 'sdp-badge-system sp-card-label--enllac', href: '/calendari?vista=mes&date=2026-11-14' },
    { text: 'fira', className: 'sdp-badge-category' }
  ]);
});

test('un acte sense dia real, o una altra secció, l’etiqueta de sempre', () => {
  expect(paginaDElement(ACTES, { id: 'ball', title: 'Ball', created_at: '2026-09-30T22:30:00Z' }).labels[0])
    .toEqual({ text: 'Agenda', className: 'sdp-badge-system' });
  const mur = buildMurDetailSectionMeta({ feedPosts: [], t });
  expect(paginaDElement(mur, { id: 'cronica', title: 'Crònica', date: '2026-11-14', created_at: '2026-11-01T10:00:00Z' }).labels[0])
    .toEqual({ text: 'Publicació', className: 'sdp-badge-system' });
});

/* El detall no importa EventCard (el barril de Pedra Seca): el dia es
   calcula ací amb la mateixa regla. La targeta i la pàgina diuen el mateix
   dia, també amb una hora a la vora de la mitjanit i amb un inici amb zona. */
test('el detall i la targeta porten al mateix dia', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  const items = [
    { id: 'a', title: 'Fira', date: '2026-11-14' },
    { id: 'b', title: 'Ball', date: '2026-08-14', time: '00:30' },
    { id: 'c', title: 'Concert', inici: '2026-10-03T23:30:00Z' },
    { id: 'd', title: 'Tardor', date: '2026-10-25', time: '02:30' }
  ];
  for (const item of items) {
    const arrel = document.createElement('div');
    act(() => { render(<EventCard item={item} esdeveniment={acteAEsdeveniment(item)} />, { container: arrel }); });
    const deLaTargeta = [...arrel.querySelectorAll('.sp-card-labels a')].map((a) => a.getAttribute('href'))[0];
    expect(paginaDElement(ACTES, item).labels[0].href, item.id).toBe(deLaTargeta);
    cleanup();
  }
});

test('P0-27 / IDEA-102 · el quadrat de 128×128 px d’un acte va davall de l’entradilla (no a la capçalera), és clicable al mes de l’acte i la capçalera no porta classes d’aside', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  mocks.navigate.mockClear();
  const item = { id: 'fira', title: 'Fira de tardor', date: '2026-11-14', entradilla: 'Una entradilla.' };
  const pagina = paginaDElement(ACTES, item);
  expect(pagina.calendarBadge).toEqual({
    dia: '14',
    mes: 'NOVEMBRE',
    any: '2026',
    dateTime: '2026-11-14'
  });

  const { container: cSenseLogo } = render(
    <PageFrame {...pagina} senseLogo={true}>
      <p>Cos</p>
    </PageFrame>
  );
  const capSenseLogo = cSenseLogo.querySelector('header.page-title');
  expect(capSenseLogo.classList.contains('has-aside')).toBe(false);
  expect(capSenseLogo.classList.contains('has-aside--sense-logo')).toBe(false);
  expect(capSenseLogo.querySelector('.sp-card-calendar-badge')).toBeNull();
  const fila = cSenseLogo.querySelector('article.content-wrapper > .sdp-pagina-insignia');
  expect(fila).toBeTruthy();
  const quadratPagina = fila.querySelector('.sp-card-calendar-badge');
  expect(quadratPagina).toBeTruthy();
  // L'ordre de lectura: capçalera, entradilla, quadrat, cos.
  const lead = cSenseLogo.querySelector('.page-intro .lead');
  expect(lead.compareDocumentPosition(fila) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(fila.compareDocumentPosition(cSenseLogo.querySelector('article.content-wrapper > p')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(fila.getAttribute('translate')).toBe('no');
  act(() => { quadratPagina.click(); });
  expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-11');
  cleanup();

  // Sense entradilla: el quadrat és el primer fill del cos.
  const { container: cSenseLead } = render(
    <PageFrame {...paginaDElement(ACTES, { id: 'f2', title: 'Fira', date: '2026-11-14' })} showLogos={true}>
      <p>Cos</p>
    </PageFrame>
  );
  expect(cSenseLead.querySelector('header.page-title .sp-card-calendar-badge')).toBeNull();
  expect(cSenseLead.querySelector('article.content-wrapper').firstElementChild.classList.contains('sdp-pagina-insignia')).toBe(true);
});

test('P0-27 / IDEA-102 · un preu a PageFrame pinta el quadrat en la fila pròpia amb el modificador --preu (el color d’acció)', () => {
  const { container } = render(<PageFrame title="Tomaques" price="15 €" lead="Entradilla"><p>Cos</p></PageFrame>);
  expect(container.querySelector('header.page-title .sp-card-calendar-badge')).toBeNull();
  const fila = container.querySelector('article > .sdp-pagina-insignia.sdp-pagina-insignia--preu');
  expect(fila.querySelector('.sp-card-calendar-badge__dia').textContent).toBe('15 €');
});
