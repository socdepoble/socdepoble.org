/* D-v128-2 · El menú «Opcions del missatge» de l'últim missatge s'obria sempre cap avall i la llista
   el retallava (Reenvia, Copia el text, Elimina i Selecciona missatges fora de la vista a 375 i a
   1440 px). Si davall hi cap, el menú no canvia; si no hi cap i damunt hi ha més lloc, s'obri cap
   amunt; si tampoc no hi cap sencer, es limita a eixe espai. jsdom no maqueta: les mesures es fixen. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';
import { _reiniciaPilaEnrere } from '../../../config/pilaEnrere.js';
import { limitsVisibles, triaOberturaMenu } from './oberturaMenu.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';

vi.mock('../../../config/fullDiferit.js', async (original) => {
  const modul = await original();
  return { ...modul, adoptaFullDiferit: vi.fn(modul.adoptaFullDiferit) };
});

const t = (_, alternativa) => alternativa;
const MISSATGE = { id: 'm-1', sender: 'me', text: 'Bon dia', creatAl: '2026-11-02T08:00:00Z', estatEnviament: 'enviat' };

afterEach(() => {
  cleanup();
  _reiniciaPilaEnrere();
  vi.restoreAllMocks();
  adoptaFullDiferit.mockClear();
});

describe('triaOberturaMenu', () => {
  const IGUAL = { amunt: false, dalt: null, sostre: null };
  const base = { ancoraDalt: 600, menuDalt: 636, alcada: 420, limitDalt: 64, limitBaix: 707, separacio: 4 };

  test('si hi cap davall, no canvia res', () => {
    expect(triaOberturaMenu({ ...base, ancoraDalt: 100, menuDalt: 136 })).toEqual(IGUAL);
  });
  test('si no hi cap davall i damunt sí, s’obri cap amunt', () => {
    expect(triaOberturaMenu(base)).toEqual({ amunt: true, dalt: null, sostre: null });
  });
  test('si no hi cap ni davall ni damunt, puja el just perquè la vora de baix toque la franja', () => {
    /* 375x812: franja 178–707 (davall del bàner fixat, damunt de l'avís del xat públic). */
    expect(triaOberturaMenu({ ...base, ancoraDalt: 538, menuDalt: 574, limitDalt: 178 }))
      .toEqual({ amunt: false, dalt: 707 - 4 - 420 - 538, sostre: null });
  });
  test('si la franja és més baixa que el menú, comença dalt de la franja amb sostre', () => {
    expect(triaOberturaMenu({ ...base, limitDalt: 400 }))
      .toEqual({ amunt: false, dalt: 404 - 600, sostre: 707 - 400 - 8 });
  });
  test('sense maquetació (alçada 0 o xifres que no ho són), no canvia res', () => {
    expect(triaOberturaMenu({ ...base, alcada: 0 })).toEqual(IGUAL);
    expect(triaOberturaMenu({ ...base, menuDalt: Number.NaN })).toEqual(IGUAL);
  });
});

describe('limitsVisibles', () => {
  test('retalla la pantalla amb els avantpassats que no són overflow visible', () => {
    const llista = document.createElement('div');
    llista.style.overflowY = 'auto';
    const fill = document.createElement('div');
    llista.appendChild(fill);
    document.body.appendChild(llista);
    vi.spyOn(llista, 'getBoundingClientRect').mockReturnValue({ top: 64, bottom: 707 });
    expect(limitsVisibles(fill)).toEqual({ dalt: 64, baix: Math.min(707, window.innerHeight) });
    llista.remove();
  });
});

function fixaMaquetacio({ ancoraDalt, offsetTop, alcada }) {
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function dalt() {
    return this.getAttribute('role') === 'menu' ? offsetTop : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function alt() {
    return this.getAttribute('role') === 'menu' ? alcada : 0;
  });
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    if (this.classList.contains('sdp-xat-bombolla__accions')) return { top: ancoraDalt, bottom: ancoraDalt + 44, left: 0, right: 0, width: 0, height: 44 };
    return original.call(this);
  });
}

function obriMenu() {
  render(
    <MemoryRouter>
      <ul><Bombolla missatge={MISSATGE} locale="ca-ES" t={t} onRespon={vi.fn()} onCopia={vi.fn()} onElimina={vi.fn()} onSelecciona={vi.fn()} /></ul>
    </MemoryRouter>
  );
  fireEvent.click(within(document.body).getByRole('button', { name: 'Opcions del missatge' }));
  return screen.getByRole('menu');
}

describe('Bombolla · obertura del menú', () => {
  test('amb lloc davall, el menú es pinta com sempre (sense modificador ni sostre)', () => {
    fixaMaquetacio({ ancoraDalt: 100, offsetTop: 36, alcada: 240 });
    const menu = obriMenu();
    expect(menu.className).toBe('sdp-xat-menu');
    expect(menu.style.maxBlockSize).toBe('');
    expect(adoptaFullDiferit).not.toHaveBeenCalled();
  });

  test('l’últim missatge, sense lloc davall, obri el menú cap amunt i n’adopta el full', () => {
    fixaMaquetacio({ ancoraDalt: window.innerHeight - 60, offsetTop: 36, alcada: 240 });
    const menu = obriMenu();
    expect(menu.className).toBe('sdp-xat-menu sdp-xat-menu--amunt');
    expect(menu.style.maxBlockSize).toBe('');
    expect(adoptaFullDiferit).toHaveBeenCalledWith(menu, 'xat-menu', expect.any(String));
  });

  test('sense lloc ni davall ni damunt, el menú puja el just (top en línia) sense modificador', () => {
    fixaMaquetacio({ ancoraDalt: 300, offsetTop: 36, alcada: 700 });
    const menu = obriMenu();
    expect(menu.className).toBe('sdp-xat-menu');
    expect(menu.style.top).toBe(`${window.innerHeight - 4 - 700 - 300}px`);
    expect(menu.style.maxBlockSize).toBe('');
    expect(adoptaFullDiferit).not.toHaveBeenCalled();
  });

  test('en tancar i tornar a obrir es torna a mesurar des de l’obertura de sempre', () => {
    fixaMaquetacio({ ancoraDalt: window.innerHeight - 60, offsetTop: 36, alcada: 240 });
    const menu = obriMenu();
    expect(menu.className).toContain('sdp-xat-menu--amunt');
    fireEvent.click(within(document.body).getByRole('button', { name: 'Opcions del missatge' }));
    expect(screen.queryByRole('menu')).toBeNull();
    vi.restoreAllMocks();
    fixaMaquetacio({ ancoraDalt: 100, offsetTop: 36, alcada: 240 });
    fireEvent.click(within(document.body).getByRole('button', { name: 'Opcions del missatge' }));
    expect(screen.getByRole('menu').className).toBe('sdp-xat-menu');
  });
});
