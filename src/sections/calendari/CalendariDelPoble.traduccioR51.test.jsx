/* R51 (P0-46 / IDEA-177; forat G1 de l'auditoria R11) · El calendari únic
   (/calendari i la pestanya Calendari del Mur) pinta davall la MATEIXA
   targeta del Mur (TargetaDelMur). Un acte amb translation_mode protegit
   ('none', la revisada o un mode invàlid) no hi porta Traduir i l'article
   porta translate="no"; un acte sense mode o amb l'automàtica, el Traduir de
   sempre. L'arnés de CalendariDelPoble.test.jsx (router de veres). */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
import { blocsTraduibles } from '../../components/universal/traduccio/blocsTraduibles.js';
import { CalendariDelPoble } from './CalendariDelPoble.jsx';
import { entradesDelCalendari } from './calendariGlobal.js';
import { useEstatCalendari } from './useEstatCalendari.js';

const AVUI = new Date(2026, 9, 1);
const revisades = Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
  .map((codi) => [codi, { title: `Aplec revisat ${codi}`, content: `<p>Cos ${codi}</p>`, reviewed: true }]));
const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17' };
const AUTOMATICA = { id: 'auto', type: 'event', title: 'Concert automàtic', date: '2026-10-18', translation_mode: 'on_the_fly', source_language: 'ca' };
const SENSE = { id: 'sense', type: 'event', title: 'Missa sense traducció', date: '2026-10-19', translation_mode: 'none', source_language: 'ca' };
const REVISADA = { id: 'rev', type: 'event', title: 'Aplec original', date: '2026-10-20', translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades };
const INVALIDA = { id: 'err', type: 'event', title: 'Ball mal configurat', date: '2026-10-21', translation_mode: 'auto', source_language: 'ca' };

function Calendari({ entrades }) {
  const { estat, navega, canviaVista, triaDia, obriDia } = useEstatCalendari({ obertura: null, avui: AVUI });
  return (
    <CalendariDelPoble estat={estat} navega={navega} canviaVista={canviaVista} triaDia={triaDia} obriDia={obriDia}
      entrades={entrades} avui={AVUI} />
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test('G1 · les targetes de davall del calendari: Traduir i translate segons el pla de cada acte', () => {
  render(
    <MemoryRouter rutaInicial="/calendari?vista=mes&mes=2026-10">
      <Calendari entrades={entradesDelCalendari([FIRA, AUTOMATICA, SENSE, REVISADA, INVALIDA], [], [])} />
    </MemoryRouter>
  );
  const targetes = [...document.querySelectorAll('.sdp-card-grid > article')];
  const perTitol = Object.fromEntries(targetes.map((article) => [article.querySelector('.sp-card-title').textContent, article]));
  expect(Object.keys(perTitol).sort()).toEqual(['Aplec revisat ca', 'Ball mal configurat', 'Concert automàtic', 'Fira de tardor', 'Missa sense traducció']);
  const teTraduir = (titol) => [...perTitol[titol].querySelectorAll('.sp-card-footer button')]
    .some((boto) => boto.getAttribute('aria-label').startsWith('Traduir'));
  for (const titol of ['Fira de tardor', 'Concert automàtic']) {
    expect(teTraduir(titol), titol).toBe(true);
    expect(perTitol[titol].hasAttribute('translate'), titol).toBe(false);
  }
  for (const titol of ['Missa sense traducció', 'Aplec revisat ca', 'Ball mal configurat']) {
    expect(teTraduir(titol), titol).toBe(false);
    expect(perTitol[titol].getAttribute('translate'), titol).toBe('no');
  }
});

/* Troballa R12G-BH-02 · Les vistes del calendari pinten el títol de cada acte
   fora de la targeta (l'Agenda i la Setmana, en <li> que el Traduir de la
   pàgina llig; el Mes, en la capa aria-hidden). Quan tot el calendari és
   públic, el Traduir de la pàgina s'encén (CalendariSection i el Mur:
   totsPublics) i recull els blocs de l'article (blocsTraduibles): un acte
   protegit porta translate="no" a la seua peça i el seu títol no hi arriba;
   un acte sense mode o amb l'automàtica, el de sempre. */
const PROTEGITS = ['Missa sense traducció', 'Aplec original', 'Ball mal configurat'];
const pecaAmb = (selector, titol) => [...document.querySelectorAll(selector)].find((peca) => peca.textContent.includes(titol));
const textosTraduibles = (arrel) => blocsTraduibles(arrel).map((bloc) => bloc.text);

test('Agenda: les files dels actes protegits porten translate="no" i el Traduir de la pàgina no n’envia el títol', () => {
  const { container } = render(
    <MemoryRouter rutaInicial="/calendari?vista=agenda&mes=2026-10">
      <Calendari entrades={entradesDelCalendari([FIRA, AUTOMATICA, SENSE, REVISADA, INVALIDA], [], [])} />
    </MemoryRouter>
  );
  for (const titol of ['Fira de tardor', 'Concert automàtic']) {
    expect(pecaAmb('.sdp-cal-agenda__acte', titol).hasAttribute('translate'), titol).toBe(false);
  }
  for (const titol of PROTEGITS) {
    expect(pecaAmb('.sdp-cal-agenda__acte', titol).getAttribute('translate'), titol).toBe('no');
  }
  const textos = textosTraduibles(container);
  expect(textos.some((text) => text.includes('Fira de tardor')), 'el de sempre continua traduïble').toBe(true);
  for (const titol of PROTEGITS) expect(textos.filter((text) => text.includes(titol)), titol).toEqual([]);
});

test('Setmana: els blocs de la graella i les barres de la franja dels actes protegits porten translate="no"', () => {
  const setmana = [
    { ...FIRA, id: 'fira-s', date: '2026-10-22' },
    { ...AUTOMATICA, id: 'auto-s', date: '2026-10-23', time: '18:00' },
    SENSE,
    { ...SENSE, id: 'sense-h', title: 'Missa sense traducció amb hora', date: '2026-10-24', time: '11:00' },
    REVISADA,
    INVALIDA
  ];
  const { container } = render(
    <MemoryRouter rutaInicial="/calendari?vista=setmana&date=2026-10-19">
      <Calendari entrades={entradesDelCalendari(setmana, [], [])} />
    </MemoryRouter>
  );
  expect(pecaAmb('.sdp-cal-setmana__barres > li', 'Fira de tardor').hasAttribute('translate')).toBe(false);
  expect(pecaAmb('.sdp-cal-setmana__blocs > li', 'Concert automàtic').hasAttribute('translate')).toBe(false);
  for (const titol of PROTEGITS) {
    expect(pecaAmb('.sdp-cal-setmana__barres > li', titol).getAttribute('translate'), titol).toBe('no');
  }
  expect(pecaAmb('.sdp-cal-setmana__blocs > li', 'Missa sense traducció amb hora').getAttribute('translate')).toBe('no');
  const textos = textosTraduibles(container);
  expect(textos.some((text) => text.includes('Concert automàtic')), 'el de sempre continua traduïble').toBe(true);
  for (const titol of PROTEGITS) expect(textos.filter((text) => text.includes(titol)), titol).toEqual([]);
});

test('Mes: la peça d’un acte protegit (capa aria-hidden) també porta translate="no"; la del de sempre, no', () => {
  render(
    <MemoryRouter rutaInicial="/calendari?vista=mes&mes=2026-10">
      <Calendari entrades={entradesDelCalendari([FIRA, AUTOMATICA, SENSE, REVISADA, INVALIDA], [], [])} />
    </MemoryRouter>
  );
  expect(pecaAmb('.sdp-cal-mes__barres > li', 'Fira de tardor').hasAttribute('translate')).toBe(false);
  for (const titol of PROTEGITS) {
    expect(pecaAmb('.sdp-cal-mes__barres > li', titol).getAttribute('translate'), titol).toBe('no');
  }
});
