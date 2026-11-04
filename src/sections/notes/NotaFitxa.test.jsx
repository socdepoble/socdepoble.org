import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  identitat: { actorId: null },
  session: { currentUser: null },
  notesData: {},
  modeResolt: null
}));

vi.mock('../../config/dataMode.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    resolveDataMode: (config) => mocks.modeResolt ?? real.resolveDataMode(config)
  };
});

import { NotaFitxa } from './NotaFitxa.jsx';
import {
  AUTORIA_PILOT,
  ID_NOTA_BENVINGUDA,
  RUTA_PERSONA_PILOT,
  autoriaDeNota,
  signaturaDeNota
} from './autoriaNota.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';
import { TITOL_NOTA_PREPARADA } from './notaPreparada.js';

beforeEach(() => {
  mocks.identitat = { actorId: null };
  mocks.session = { currentUser: null };
  mocks.notesData = {};
  mocks.modeResolt = null;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const nota = (data, extra = {}) => ({
  id: data.id,
  title: data.title || '',
  subtitle: data.formattedDate,
  updatedAt: data.updatedAt,
  data,
  ...extra
});

const PROVA = nota({
  id: 'n7',
  title: 'Prova',
  formattedDate: '02/01/26',
  formattedTime: '09:37',
  updatedAt: '2026-01-02T08:37:00Z'
});

test('AH-02 · tant la nota activa com la inactiva es mostren sempre com a fitxa compacta (button.sdp-gestor-fitxa) sense TargetaViva a la llista', () => {
  const onSelect = vi.fn();
  const { container, unmount } = render(<NotaFitxa active item={PROVA} onSelect={onSelect} />);
  const fitxaActiva = container.querySelector('button.sdp-gestor-fitxa');
  expect(fitxaActiva).not.toBeNull();
  expect(fitxaActiva.classList.contains('is-active')).toBe(true);
  expect(fitxaActiva.getAttribute('aria-current')).toBe('true');
  expect(container.querySelector('.sp-card')).toBeNull();
  expect(container.querySelector('.sdp-nota-fitxa-viva')).toBeNull();
  fireEvent.click(fitxaActiva);
  expect(onSelect).toHaveBeenCalledTimes(1);
  unmount();

  const inactiva = render(<NotaFitxa item={{ ...PROVA, excerpt: 'Resum' }} onSelect={vi.fn()} />);
  const fitxaInactiva = inactiva.container.querySelector('button.sdp-gestor-fitxa');
  expect(fitxaInactiva).not.toBeNull();
  expect(fitxaInactiva.classList.contains('is-active')).toBe(false);
  expect(fitxaInactiva.hasAttribute('aria-current')).toBe(false);
  expect(fitxaInactiva.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Prova');
  expect(fitxaInactiva.querySelector('time.sdp-nota-fitxa__data').textContent).toBe('02/01/26');
  expect(fitxaInactiva.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Resum');
});

test('una nota buida ensenya el mateix títol de reserva que l’H1 («Nota sense títol») i l’entradilla de llavor tant activa com inactiva', () => {
  expect(TITOL_NOTA_PREPARADA).toBe('Nota sense títol');
  const buida = {
    ...nota({ id: 'n9', title: '', formattedDate: '25/09/26', updatedAt: '2026-09-25T09:00:00Z' }),
    excerpt: ''
  };
  render(<NotaFitxa item={buida} onSelect={vi.fn()} />);
  expect(screen.getByText(TITOL_NOTA_PREPARADA)).toBeTruthy();
  expect(screen.queryByText(TEXTOS_LLAVOR.titol)).toBeNull();
  expect(screen.getByText(TEXTOS_LLAVOR.entradilla)).toBeTruthy();
  cleanup();

  const { container } = render(<NotaFitxa active item={buida} onSelect={vi.fn()} />);
  expect(container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe(TITOL_NOTA_PREPARADA);
  expect(container.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe(TEXTOS_LLAVOR.entradilla);
});

test('D1 · títol i subtítol/entradilla vius es pinten en text pla sense &nbsp; ni etiquetes HTML literals', () => {
  const item = nota({
    id: 'n7',
    title: '<p>Prova&nbsp;<b>viva</b></p>',
    lead: '<p><b>Hola</b>&nbsp;món</p>'
  });
  const { container } = render(<NotaFitxa active item={item} onSelect={vi.fn()} />);
  expect(container.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe('Prova viva');
  expect(container.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Hola món');
  expect(container.textContent).not.toMatch(/&nbsp;|<b>/);
});

/* G3-g2-matriu-25 (AH-02.1: «data i subtítol/entradilla») · Amb subtítol i
   entradilla, la fila diu el subtítol, com el model de la llista (NotesSection
   · excerpt: subtitle || lead) i ConnexioFitxa; l'entradilla només sense
   subtítol. Un subtítol buit en HTML (<p></p>) no amaga l'entradilla. */
test('la fila diu el subtítol abans que l’entradilla, activa o no; sense subtítol, l’entradilla; i després el resum', () => {
  const amb = nota({ id: 'n1', title: 'Bloc de notes', subtitle: '<p>El teu estudi d’escriptura privat</p>', lead: '<p>Benvingut al teu nou espai editorial</p>' });
  for (const active of [true, false]) {
    const { container, unmount } = render(<NotaFitxa active={active} item={amb} onSelect={vi.fn()} />);
    expect(container.querySelector('.sdp-gestor-fitxa__subtitol').textContent, String(active)).toBe('El teu estudi d’escriptura privat');
    unmount();
  }
  const senseSubtitol = nota({ id: 'n2', title: 'Prova', subtitle: '<p></p>', lead: '<p>Només entradilla</p>' });
  const { container: c2, unmount: u2 } = render(<NotaFitxa item={senseSubtitol} onSelect={vi.fn()} />);
  expect(c2.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Només entradilla');
  u2();
  const nomesResum = { ...nota({ id: 'n3', title: 'Prova' }), excerpt: 'Resum de la llista' };
  const { container: c3 } = render(<NotaFitxa item={nomesResum} onSelect={vi.fn()} />);
  expect(c3.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Resum de la llista');
});

test('261007 · la fitxa compacta sense imatge pinta l’emoji en XL tant quan està activa com inactiva', () => {
  const item = nota({ id: 'n7', title: 'Prova', icon: '🍅' }, { icon: '🍅' });
  const { container, unmount } = render(<NotaFitxa active item={item} onSelect={vi.fn()} />);
  const glifActiu = container.querySelector('.sdp-gestor-fitxa__media .sdp-gestor-fitxa__inicial');
  expect([glifActiu.textContent, glifActiu.className]).toEqual(['🍅', 'sdp-gestor-fitxa__inicial sdp-fitxa-emoji-xl']);
  unmount();

  const inactiva = render(<NotaFitxa item={item} onSelect={vi.fn()} />);
  const glifInactiu = inactiva.container.querySelector('.sdp-gestor-fitxa__media .sdp-gestor-fitxa__inicial');
  expect([glifInactiu.textContent, glifInactiu.className]).toEqual(['🍅', 'sdp-gestor-fitxa__inicial sdp-fitxa-emoji-xl']);
});

test('autoriaDeNota i signaturaDeNota conserven el contracte de la barra taronja i dels perfils', () => {
  const currentUser = {
    id: 'U',
    user_metadata: { name: 'Pepa', avatar_url: 'https://exemple.org/pepa.png', town_name: 'Benifallim' }
  };
  const actor = { tipus: 'entitat', id: 'O', nom: 'Forn & Cia', avatar: 'https://exemple.org/forn.png' };
  expect(autoriaDeNota({ notaId: 'n7', actor, actorId: 'O', agents: [], currentUser })).toEqual({
    nom: 'Forn & Cia',
    avatar: 'https://exemple.org/forn.png',
    poble: ''
  });
  expect(signaturaDeNota({ notaId: 'n7', actor, actorId: 'O', agents: [], currentUser }).ruta).toBe('/empresa/O');
  expect(signaturaDeNota({ notaId: ID_NOTA_BENVINGUDA, agents: [], currentUser: null }).ruta).toBe(RUTA_PERFIL_PROJECTE);
  expect(signaturaDeNota({ notaId: 'n7', agents: [], currentUser: null, dataMode: 'seed' })).toEqual({
    ...AUTORIA_PILOT,
    ruta: RUTA_PERSONA_PILOT
  });

  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const sdp = signaturaDeNota({
    notaId: 'n7',
    actor: { tipus: 'entitat', id: uuid, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble', avatar: null, rol: 'owner' },
    actorId: uuid,
    agents: [],
    currentUser
  });
  expect(sdp.avatar).toBe(DEFAULT_AUTHOR.avatarUrl);
  expect(sdp.ruta).toBe(RUTA_PERFIL_PROJECTE);
});
