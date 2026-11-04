/* Fase D (261020, tasca 2; pla 261020_1300; crítiques 261020, 17 i 18) · El
   Control del xat, «Privacitat i seguretat»: amb la moderació de l'app, la
   llista de persones i entitats bloquejades (LlistaBloquejos) i un avís que
   continua dient el que encara falta (el xifratge); sense, l'avís «pendent» i
   res més. control-01 (261104): en tots dos, l'avís diu on és el silenci de
   cada conversa (B8C-5), que ja funciona. La closca i la graella, simulades:
   només compta el contingut de l'opció oberta. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* control-01 (261104) · El traductor es pot canviar per prova: per defecte,
   la reserva; amb createTranslator('ca'), el que llig de veres qui usa el Mas
   en valencià (el diccionari mana sobre la reserva). */
const traduccio = vi.hoisted(() => ({ t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (...args) => traduccio.t(...args) }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./components/ClosCaXat.jsx', () => ({
  default: ({ middleColumn, rightColumn }) => <div>{middleColumn}{rightColumn}</div>,
  BotoObriRail: () => null
}));
vi.mock('./components/PanellInicialMobil.jsx', () => ({ default: () => null }));
vi.mock('../../components/layout/AppGridColumn.jsx', () => ({ default: () => null }));
vi.mock('../../components/layout/AppGridShell.jsx', () => ({
  useAppGrid: () => ({ mida: 'ample', tancaPanells: () => {}, applyPreset: () => {}, columnWidths: { left: 80, middle: 360 } })
}));
import XatControlSection from './XatControlSection.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { createTranslator } from '../../config/i18n.js';
import { TEXTOS_SILENCI } from './silenciXat.js';

const RESERVA = traduccio.t;
afterEach(() => { cleanup(); traduccio.t = RESERVA; });

const AVIS_SENSE_MODERACIO = 'Per a silenciar una conversa, obri-la i, des del botó ⋮, tria «Silencia les notificacions». La resta d’esta opció encara no està disponible: es construirà en la fase següent del xat.';
const PEPA = Object.freeze({ tipus: 'persona', id: 'pepa', nom: 'Pepa', creatAl: null });
const moderacio = (mes = {}) => ({
  disponible: true, potBloquejar: true, estatBloquejos: 'llest', codiErrorBloquejos: null, bloquejats: [PEPA],
  desbloqueja: vi.fn().mockResolvedValue(undefined), ...mes
});
function obriPrivacitat() {
  act(() => { fireEvent.click(screen.getByRole('button', { name: /^Privacitat i seguretat/ })); });
  return screen.getByRole('article', { name: 'Privacitat i seguretat' });
}

test('sense moderació, l’avís «pendent» de l’opció i cap llista', () => {
  render(<XatControlSection />);
  const panell = obriPrivacitat();
  expect(within(panell).getByRole('status').textContent).toBe(AVIS_SENSE_MODERACIO);
  expect(within(panell).queryByRole('list')).toBeNull();
});

test('amb moderació, la llista de bloquejos amb «Desbloqueja» i l’avís del que encara falta', async () => {
  const valor = moderacio();
  render(<ModeracioContext.Provider value={valor}><XatControlSection /></ModeracioContext.Provider>);
  const panell = obriPrivacitat();
  expect(within(panell).getByRole('heading', { level: 3 }).textContent).toBe('Persones i entitats bloquejades');
  expect(within(panell).getAllByRole('listitem')).toHaveLength(1);
  expect(within(panell).getByRole('status').textContent)
    .toBe('Per a silenciar una conversa, obri-la i, des del botó ⋮, tria «Silencia les notificacions». El xifratge extrem a extrem encara no està disponible: es construirà en la fase següent del xat.');
  await act(async () => { fireEvent.click(within(panell).getByRole('button', { name: 'Desbloqueja Pepa' })); });
  expect(valor.desbloqueja).toHaveBeenCalledWith({ tipus: 'persona', id: 'pepa', nom: 'Pepa' });
});

test('amb el proveïdor però sense la capacitat, com sense moderació', () => {
  render(<ModeracioContext.Provider value={moderacio({ disponible: false })}><XatControlSection /></ModeracioContext.Provider>);
  const panell = obriPrivacitat();
  expect(within(panell).queryByRole('list')).toBeNull();
  expect(within(panell).getByRole('status').textContent).toBe(AVIS_SENSE_MODERACIO);
});

/* control-01 (261104) · El silenci per conversa (B8C-5) ja funciona des del
   botó ⋮ de cada conversa: l'avís de «Privacitat i seguretat» no pot dir que
   silenciar encara no existix, ni amb la moderació ni sense. Diu on és, amb
   l'etiqueta real del menú (TEXTOS_SILENCI.menu), i només dona per pendent
   el que encara ho és. Amb el diccionari valencià, no sols amb la reserva. */
const SILENCI_PENDENT = /Silenciar les notificacions[^.]*encara no/;

test('amb moderació, l’avís diu on és el silenci i que només falta el xifratge', () => {
  traduccio.t = createTranslator('ca');
  render(<ModeracioContext.Provider value={moderacio()}><XatControlSection /></ModeracioContext.Provider>);
  const avis = within(obriPrivacitat()).getByRole('status').textContent;
  expect(avis).not.toMatch(SILENCI_PENDENT);
  expect(avis).toContain(`«${TEXTOS_SILENCI.menu[1]}»`);
  expect(avis).toContain('⋮');
  expect(avis).toContain('El xifratge extrem a extrem encara no està disponible');
});

test('sense moderació, l’avís de «Privacitat i seguretat» també diu on és el silenci', () => {
  traduccio.t = createTranslator('ca');
  render(<XatControlSection />);
  const avis = within(obriPrivacitat()).getByRole('status').textContent;
  expect(avis).not.toBe('Esta opció encara no està disponible: es construirà en la fase següent del xat.');
  expect(avis).toContain(`«${TEXTOS_SILENCI.menu[1]}»`);
  expect(avis).toContain('encara no està disponible');
});

test('les altres opcions pendents conserven l’avís de sempre', () => {
  render(<XatControlSection />);
  act(() => { fireEvent.click(screen.getByRole('button', { name: /^Missatges temporals/ })); });
  const panell = screen.getByRole('article', { name: 'Missatges temporals' });
  expect(within(panell).getByRole('status').textContent)
    .toBe('Esta opció encara no està disponible: es construirà en la fase següent del xat.');
});
