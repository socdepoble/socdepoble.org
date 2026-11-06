/* Onada R9 · C3 (IDEA-120 / P0-30; G8-10) · La píndola dels avisos push del Xat
   amb el registre DE DEBÒ (façana i motor) i un adaptador fals que s'hi
   registra una sola vegada (el registre n'admet un per càrrega): el motiu, el
   tipus i el resultat d'activa es lligen de `mock` a cada publicació. La
   sessió, el Xat i el port són simulats. Res d'altres kits: només el
   component, el hook del control i els diccionaris. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  sessio: { estat: 'dins', currentUser: { id: 'A' } },
  mode: 'remote',
  capacitat: true,
  motiu: null,
  activa: null
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => mock.sessio }));
vi.mock('../XatContext', () => ({ useXat: () => ({ modeDades: mock.mode }) }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'avisosPush' && mock.capacitat,
  desaDispositiuAvisos: vi.fn(async () => {}),
  retiraDispositiuAvisos: vi.fn(async () => {})
}));

/* El motor del registre, que s'endolla a la façana en avaluar-se (com a l'entrada). */
import '../../../config/motorAvisosPushXat.js';
import { desactivaAvisosPush, fixaServidorAvisosPush, instantaniaAvisosPush, registraAvisosPush } from '../../../config/avisosPushXat.js';
import { TEXTOS_AVISOS } from '../useAvisosPushXat.js';
import PindolaAvisosPushXat, { TEXTOS_PINDOLA } from './PindolaAvisosPushXat.jsx';

const adaptador = {
  tipus: 'web',
  motiu: () => mock.motiu,
  estat: vi.fn(async () => ({ estat: 'inactiu' })),
  activa: vi.fn((...args) => mock.activa(...args)),
  desactiva: vi.fn(async () => ({ estat: 'inactiu' })),
  sincronitza: vi.fn(async () => ({ estat: 'inactiu' })),
  neteja: vi.fn(async () => {}),
  oblida: vi.fn(),
  escoltaToc: vi.fn(() => () => {})
};
let registrat = false;
/* Registra (una vegada) i torna a publicar l'instantània amb el servidor de la persona, o sense. */
async function ambAdaptador({ motiu = null, servidor = true } = {}) {
  mock.motiu = motiu;
  if (!registrat) { registraAvisosPush(adaptador); registrat = true; }
  await act(async () => {
    fixaServidorAvisosPush(null);
    if (servidor) fixaServidorAvisosPush({ ambit: 'A', desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) });
    await desactivaAvisosPush({ local: true });
  });
}
const pinta = () => render(<PindolaAvisosPushXat />);
const boto = () => screen.queryByRole('button', { name: TEXTOS_PINDOLA.activa[1] });

beforeEach(() => {
  mock.sessio = { estat: 'dins', currentUser: { id: 'A' } };
  mock.mode = 'remote';
  mock.capacitat = true;
  mock.motiu = null;
  mock.activa = () => Promise.resolve({ estat: 'actiu' });
  vi.clearAllMocks();
});
afterEach(() => { cleanup(); });

describe('sense res a oferir, cap píxel', () => {
  test('sense cap adaptador registrat (el motor o l’adaptador encara no han arribat): no pinta res', () => {
    expect(instantaniaAvisosPush().disponible).toBe(false);
    const { container } = pinta();
    expect(container.innerHTML).toBe('');
  });
});

describe('amb un adaptador registrat', () => {
  test('amb totes les condicions: un sol botó, «🔔 Activar notificacions del xat», i la nota cega', async () => {
    await ambAdaptador();
    pinta();
    const seccio = screen.getByRole('region', { name: TEXTOS_PINDOLA.etiqueta[1] });
    expect(within(seccio).getAllByRole('button')).toHaveLength(1);
    expect(boto().textContent).toBe('🔔 Activar notificacions del xat');
    expect(within(seccio).getByText(TEXTOS_AVISOS.cec[1])).toBeTruthy();
  });

  test('el toc crida adaptador.activa en el MATEIX tic del gest (cap espera abans: iOS), i en acabar actiu la píndola s’amaga', async () => {
    await ambAdaptador();
    let resol;
    let dinsDelGest = false;
    mock.activa = () => { dinsDelGest = true; return new Promise((r) => { resol = r; }); };
    pinta();
    fireEvent.click(boto());
    /* Sense cap microtasca pel mig: el permís del navegador eixiria del gest. */
    expect(dinsDelGest).toBe(true);
    expect(adaptador.activa).toHaveBeenCalledTimes(1);
    /* Mentre dura, el botó és desactivat (el pany entre gestos del registre). */
    expect(screen.getByRole('button').disabled).toBe(true);
    await act(async () => { resol({ estat: 'actiu' }); });
    expect(instantaniaAvisosPush().estat).toBe('actiu');
    expect(screen.queryByRole('region')).toBeNull();
  });

  test('si el navegador els denega: sense botó (no faria res) i la nota de com tornar-los a permetre', async () => {
    await ambAdaptador();
    mock.activa = () => Promise.resolve({ estat: 'denegat' });
    pinta();
    await act(async () => { fireEvent.click(boto()); });
    expect(boto()).toBeNull();
    expect(screen.getByRole('status').textContent).toBe(TEXTOS_AVISOS.denegat[1]);
  });

  test('un error en activar: el botó continua i la nota d’error es veu', async () => {
    await ambAdaptador();
    mock.activa = () => Promise.resolve({ estat: 'error' });
    pinta();
    await act(async () => { fireEvent.click(boto()); });
    expect(boto()).not.toBeNull();
    const nota = screen.getByRole('status');
    expect(nota.textContent).toBe(TEXTOS_AVISOS.error[1]);
    expect(nota.className).toContain('sdp-xat-pindola-push__text--error');
  });

  test('Safari d’iPhone o iPad sense l’app a la pantalla d’inici: cap botó, les dues passes per a afegir-la', async () => {
    await ambAdaptador({ motiu: 'ios-sense-instalar' });
    pinta();
    expect(screen.queryByRole('button')).toBeNull();
    const passos = screen.getByRole('list');
    expect(within(passos).getAllByRole('listitem').map((li) => li.textContent)).toEqual([TEXTOS_PINDOLA.pas1[1], TEXTOS_PINDOLA.pas2[1]]);
    expect(screen.getByText(TEXTOS_PINDOLA.ios[1])).toBeTruthy();
    expect(adaptador.activa).not.toHaveBeenCalled();
  });

  test.each([
    ['sense clau pública VAPID (sense-clau)', () => ambAdaptador({ motiu: 'sense-clau' })],
    ['un navegador sense suport', () => ambAdaptador({ motiu: 'sense-suport' })],
    ['sense el servidor fixat', () => ambAdaptador({ servidor: false })],
    ['amb la sessió fora', async () => { await ambAdaptador(); mock.sessio = null; }],
    ['en llavor', async () => { await ambAdaptador(); mock.mode = 'seed'; }],
    ['sense la capacitat avisosPush del port', async () => { await ambAdaptador(); mock.capacitat = false; }]
  ])('%s: no pinta res i no pregunta res', async (_nom, prepara) => {
    await prepara();
    const { container } = pinta();
    expect(container.innerHTML).toBe('');
    expect(adaptador.activa).not.toHaveBeenCalled();
  });
});

describe('textos als cinc idiomes (G8-10)', () => {
  const llig = (llengua) => readFileSync(path.join(process.cwd(), `src/config/idiomes/${llengua}.js`), 'utf8');
  const valor = (codi, clau) => {
    const m = codi.match(new RegExp(`^\\s*'${clau.replace(/\./g, '\\.')}':\\s*(['"])(.*)\\1,\\s*$`, 'm'));
    return m ? m[2].replace(/\\'/g, '\'') : null;
  };
  test('cada clau de la píndola és als 5 diccionaris; la reserva és el valor valencià i les altres llengües el tradueixen', () => {
    const ca = llig('ca');
    for (const [clau, reserva] of Object.values(TEXTOS_PINDOLA)) {
      expect(valor(ca, clau), clau).toBe(reserva);
      for (const llengua of ['es', 'en', 'eu', 'gl']) {
        const tr = valor(llig(llengua), clau);
        expect(tr, `${llengua}: ${clau}`).toBeTruthy();
        expect(tr, `${llengua}: ${clau}`).not.toBe(reserva);
      }
    }
  });

  test('el component no porta cap estil en línia i només classes sdp-xat-pindola-push i el Boto canònic', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/sections/xat/components/PindolaAvisosPushXat.jsx'), 'utf8');
    expect(codi).not.toMatch(/style=\{/);
    const classes = [...codi.matchAll(/className=\{?['"]([^'"]+)['"]/g)].flatMap((m) => m[1].split(/\s+/));
    for (const classe of classes) expect(classe.startsWith('sdp-xat-pindola-push'), classe).toBe(true);
  });
});
