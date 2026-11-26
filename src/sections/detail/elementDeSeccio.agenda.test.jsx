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

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), language: 'ca' }));
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
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa, language: mocks.language }) }));

import { paginaDElement } from './elementDeSeccio.js';
import { buildEventsDetailSectionMeta, buildMercatDetailSectionMeta, buildMurDetailSectionMeta } from './detailSectionMeta.jsx';
import { EventCard } from '../../components/universal/EventCard.jsx';
import { PageFrame } from '../../components/universal/PageFrame.jsx';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { acteAEsdeveniment } from '../mur/agendaMur.js';
import { CALENDAR_EVENTS, CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../mur/eventsSeed.js';
import { MANIFEST_DE_POBLE_POST } from '../mur/feedSeed.js';
import { IDIOMES_TAXONOMIA, localitzaCategoriesMares, nomEstructural } from '../../data/taxonomia/taxonomiaCanonica.js';

afterEach(() => { cleanup(); vi.unstubAllEnvs(); mocks.language = 'ca'; });

const t = (_, alternativa) => alternativa;
const ACTES = buildEventsDetailSectionMeta({ events: [], t });

test('l’etiqueta «Agenda» d’un acte porta al seu dia al Calendari, amb la diana de l’etiqueta enllaçada', () => {
  const pagina = paginaDElement(ACTES, { id: 'fira', title: 'Fira de tardor', date: '2026-11-14' });
  expect(pagina.labels).toEqual([
    { text: 'Agenda', className: 'sdp-badge-system sp-card-label--enllac', href: '/calendari?vista=mes&date=2026-11-14' }
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

/* P0-40 (Kit R88; arbitratge R11, R88-C2-01) · L'Aplec i els Cursos ja no
   porten «Agenda» a la targeta: la categoria mare hi porta al dia de l'acte.
   La targeta i el detall continuen portant al mateix dia, i el detall no
   repeteix l'enllaç (ja hi porta l'etiqueta de la secció).
   G26-2 · Canvi intencionat, IDEA-365 (21:40, regla 3: «píndoles 100 % clicables arreu»): les etiquetes
   també són enllaços (/etiqueta/<slug>). Es comproven a part dels destins de sistema. */
const APLEC_I_CURSOS = () => [
  [CALENDAR_EVENTS.find((e) => e.id === 'aplec-2023'), '2023-01-29', ['/etiqueta/aplec']],
  [CURSOS_PEDRA_EN_SEC_2026_EVENT, '2026-10-23', ['/etiqueta/pedra-seca', '/etiqueta/bioconstruccio', '/etiqueta/patrimoni', '/etiqueta/activitats']]
];
test('l’Aplec i els Cursos conserven categories de sistema i una diana de data igual a Card i detall', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  for (const [item, dia, deLesEtiquetes] of APLEC_I_CURSOS()) {
    const arrel = document.createElement('div');
    act(() => { render(<EventCard item={item} esdeveniment={acteAEsdeveniment(item)} />, { container: arrel }); });
    const enllacos = [...arrel.querySelectorAll('.sp-card-labels a')].map((a) => a.getAttribute('href'));
    const dateLink = `/calendari?vista=mes&date=${dia}`;
    expect(enllacos.filter(href => href === dateLink), item.id).toHaveLength(1);
    const destins = item.categoriesSistema.map(nom => nom === 'Mur' ? '/mur' : nom === 'Calendari' ? '/calendari' : '/categoria/video');
    expect(enllacos.filter(href => href !== dateLink && !href.startsWith('/etiqueta/')), item.id).toEqual(destins);
    expect(enllacos.filter(href => href.startsWith('/etiqueta/')), item.id).toEqual(deLesEtiquetes);
    expect(deLesEtiquetes, item.id).toEqual(item.tags.map((tag) => rutaDePindola({ text: tag, className: 'sdp-badge-tag' })));
    const etiquetes = paginaDElement(ACTES, item).labels;
    expect(etiquetes, item.id).toEqual(item.labels);
    expect(etiquetes.filter(l => l.href === dateLink), item.id).toHaveLength(1);
    expect(etiquetes.filter(l => l.className === 'sdp-badge-system').map(l => l.text)).toEqual(item.categoriesSistema);
    cleanup();
  }
});

/* C26-2 #9 (Gauntlet c13) · IDEA-365 (21:40, regla 3; 21:58, punt 1: paritat absoluta Card ↔ UniversalPage) ·
   En les 5 llengües, la Card del Mur (TargetaDelMur → EventCard) i el detall (paginaDElement, amb les mares de
   la interfície com ItemDetailSection) pinten les MATEIXES píndoles de l'Aplec i dels Cursos, i les de sistema
   diuen la Categoria de Sistema en la llengua de la interfície i porten a la seua ruta canònica (abans, «Mur» i
   «Calendari» en valencià a totes, i en basc «Bideoa» portava a /categoria/bideoa). */
const RUTA_CANONICA = { Mur: '/mur', Calendari: '/calendari', 'Vídeo': '/categoria/video' };
const pindolesDeLaCard = (container) => [...container.querySelectorAll('li.sp-card-label')].map((li) => [
  li.textContent, li.className.replace(/^sp-card-label\s*/, ''), li.querySelector('a')?.getAttribute('href') ?? null
]);
test.each(IDIOMES_TAXONOMIA)('%s · l’Aplec i els Cursos: Card i detall iguals, amb les Categories de Sistema de la interfície', (idioma) => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  mocks.language = idioma;
  const actes = buildEventsDetailSectionMeta({ events: [], t });
  for (const [item] of APLEC_I_CURSOS()) {
    const card = pindolesDeLaCard(render(<TargetaDelMur item={item} esdeveniment={acteAEsdeveniment(item)} />).container);
    cleanup();
    const detall = localitzaCategoriesMares(paginaDElement(actes, item, { idioma, t }).labels, idioma)
      .map((label) => [label.text, label.className, rutaDePindola(label)]);
    expect([item.id, card]).toEqual([item.id, detall]);
    const sistema = card.filter(([, classe]) => classe === 'sdp-badge-system');
    expect([item.id, sistema]).toEqual([item.id, item.categoriesSistema.map((nom) => [nomEstructural(nom, idioma), 'sdp-badge-system', RUTA_CANONICA[nom]])]);
    if (idioma === 'es') expect(sistema.map(([text]) => text).slice(0, 2)).toEqual(['Muro', 'Calendario']);
  }
});

/* Integrador C1-3 (IDEA-365, línies 3804 i 3827; verificador R2-3/R2-4, P2) · Una publicació nova del Mur
   declara les seues Categories de Sistema i no porta labels: Card i pàgina pinten les mateixes píndoles,
   en la llengua de la interfície i cap a la ruta canònica, mai «Publicació» cap a /categoria/publicacio. */
test.each(IDIOMES_TAXONOMIA)('%s · una publicació del Mur amb categoriesSistema i sense labels: Card i detall iguals', (idioma) => {
  mocks.language = idioma;
  const mur = buildMurDetailSectionMeta({ feedPosts: [], t });
  for (const categoriesSistema of [['Mur'], ['Mur', 'Vídeo']]) {
    const item = { id: `nova-${categoriesSistema.length}`, title: 'Publicació nova', type: 'post', categoriesSistema, created_at: '2026-11-20T10:00:00Z' };
    const card = pindolesDeLaCard(render(<TargetaDelMur item={item} />).container);
    cleanup();
    const detall = paginaDElement(mur, item, { idioma, t }).labels.map((label) => [label.text, label.className, rutaDePindola(label)]);
    expect([categoriesSistema, card]).toEqual([categoriesSistema, detall]);
    expect([categoriesSistema, detall]).toEqual([categoriesSistema, categoriesSistema.map((nom) => [nomEstructural(nom, idioma), 'sdp-badge-system', RUTA_CANONICA[nom]])]);
  }
});

/* P0-40 (Kit R88; arbitratge R11, R88-C2-05) · Fora del Calendari, el detall
   només pinta les etiquetes pròpies d'una targeta recategoritzada (porta
   categoria_tematica_id). Una publicació del veïnat o un producte del Mercat
   amb etiquetes continuen com abans: la secció i l'id (Llei del Píxel). */
test('fora del Calendari, les etiquetes pròpies només passen al detall amb categoria_tematica_id', () => {
  const mur = buildMurDetailSectionMeta({ feedPosts: [], t });
  const mercat = buildMercatDetailSectionMeta({ marketItems: [], t });
  expect(paginaDElement(mur, MANIFEST_DE_POBLE_POST).labels).toEqual([
    { text: 'Publicació', className: 'sdp-badge-system' },
    ...MANIFEST_DE_POBLE_POST.labels
  ]);
  const vei = { id: '7f0c', title: 'Recepta de coca', labels: [{ text: 'Receptes', className: 'sdp-badge-category' }, { text: 'Forn', className: 'sdp-badge-tag' }] };
  expect(paginaDElement(mur, vei).labels).toEqual([
    { text: 'Publicació', className: 'sdp-badge-system' }
  ]);
  expect(paginaDElement(mur, { id: 'cc', title: 'Sense etiquetes' }).labels).toEqual([
    { text: 'Publicació', className: 'sdp-badge-system' }
  ]);
  expect(paginaDElement(mercat, { id: 'mel', title: 'Mel', labels: ['Mel', 'Venda'] }).labels).toEqual([
    { text: 'Mur', className: 'sdp-badge-system', href: '/mur' },
    { text: 'Mercat', className: 'sdp-badge-system', href: '/mercat' }
  ]);
});
