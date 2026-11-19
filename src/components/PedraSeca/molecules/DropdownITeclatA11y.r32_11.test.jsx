/* Onada R32.11 · Lot 06 (P0-24b + T3-UI-01 + A11y Teclat WCAG 2.2 AAA).
   Verifica navegació per fletxes, Tab sense tancament prematur, Escape LIFO des
   de dins dels ítems amb retorn de focus al disparador, absència d'interactius
   niats quan trigger és <button> i 0 tabIndex > 0 al codi de producció de src/. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { _reiniciaPilaEnrere, capesEnrereObertes } from '../../../config/pilaEnrere.js';
import { Dialeg } from '../organismes/Dialeg.jsx';
import { Dropdown, DropdownItem } from './Dropdown.jsx';

afterEach(() => {
  cleanup();
  _reiniciaPilaEnrere();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Onada R32.11 · Lot 06 · Dropdown A11y Teclat i Pila LIFO (P0-24b)', () => {
  test('ArrowDown/ArrowUp/Home/End mouen el focus pels ítems i Tab no tanca el desplegable per cap temporitzador', async () => {
    vi.useFakeTimers();
    render(
      <Dropdown trigger={<button type="button" className="sdp-boto sdp-boto--secundari">Opcions de la nota</button>}>
        <DropdownItem>Primera acció</DropdownItem>
        <DropdownItem>Segona acció</DropdownItem>
        <DropdownItem>Tercera acció</DropdownItem>
      </Dropdown>
    );

    // Zero interactius niats: un sol role="button" abans d'obrir
    const botonsInicials = screen.getAllByRole('button');
    expect(botonsInicials).toHaveLength(1);
    const disparador = botonsInicials[0];
    disparador.focus();

    await act(async () => {
      fireEvent.keyDown(disparador, { key: 'ArrowDown' });
      await Promise.resolve();
    });

    const b1 = screen.getByRole('button', { name: 'Primera acció' });
    const b2 = screen.getByRole('button', { name: 'Segona acció' });
    const b3 = screen.getByRole('button', { name: 'Tercera acció' });
    expect(document.activeElement).toBe(b1);

    // Un blur del disparador cap a b1 no tanca el desplegable ni passats 500 ms
    fireEvent.blur(disparador, { relatedTarget: b1 });
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByRole('button', { name: 'Segona acció' })).toBeTruthy();

    fireEvent.keyDown(b1, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(b2);

    fireEvent.keyDown(b2, { key: 'End' });
    expect(document.activeElement).toBe(b3);

    fireEvent.keyDown(b3, { key: 'Home' });
    expect(document.activeElement).toBe(b1);

    fireEvent.keyDown(b1, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(b3);
  });

  test('Escape des de dins d’un DropdownItem dins d’un Dialeg tanca només el Dropdown i retorna el focus al disparador', () => {
    const ordre = [];
    function Escenari() {
      const [dialeg, setDialeg] = useState(true);
      return (
        <Dialeg obert={dialeg} onTanca={(motiu) => { ordre.push(`dialeg:${motiu}`); setDialeg(false); }} titol="Editar nota">
          <Dropdown trigger="Accions ràpides">
            <DropdownItem onClick={() => ordre.push('duplica')}>Duplica</DropdownItem>
          </Dropdown>
        </Dialeg>
      );
    }

    render(<Escenari />);
    const disparador = screen.getByRole('button', { name: 'Accions ràpides' });
    disparador.focus();
    fireEvent.click(disparador);

    const item = screen.getByRole('button', { name: 'Duplica' });
    item.focus();
    expect(capesEnrereObertes()).toBe(2);

    const noConsumit = fireEvent.keyDown(item, { key: 'Escape' });
    expect(noConsumit).toBe(false);
    expect(screen.queryByRole('button', { name: 'Duplica' })).toBeNull();
    expect(ordre).toEqual([]);
    expect(document.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(disparador);
    expect(capesEnrereObertes()).toBe(1);
  });

  test('triar un DropdownItem executa onClick, tanca el menú i retorna el focus al disparador', () => {
    const accio = vi.fn();
    render(
      <Dropdown trigger="Més opcions">
        <DropdownItem onClick={accio}>Arxiva</DropdownItem>
      </Dropdown>
    );
    const disparador = screen.getByRole('button', { name: 'Més opcions' });
    fireEvent.click(disparador);
    fireEvent.click(screen.getByRole('button', { name: 'Arxiva' }));
    expect(accio).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Arxiva' })).toBeNull();
    expect(document.activeElement).toBe(disparador);
  });
});

function fitxersProduccioSrc(dir) {
  const out = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === '__fixtures__') continue;
      out.push(...fitxersProduccioSrc(abs));
    } else if (/\.[cm]?jsx?$/.test(entrada.name) && !/\.test\.[cm]?jsx?$/.test(entrada.name)) {
      out.push(abs);
    }
  }
  return out;
}

describe('Onada R32.11 · Lot 06 · Zero tabIndex positius (WCAG 2.4.3)', () => {
  test('cap fitxer de producció de src/ declara tabIndex > 0', () => {
    const patro = /tabIndex\s*=\s*(?:\{\s*([1-9]\d*)\s*\}|"([1-9]\d*)"|'([1-9]\d*)')/g;
    const trobats = [];
    for (const f of fitxersProduccioSrc(path.join(process.cwd(), 'src'))) {
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(patro)) {
        trobats.push(`${path.relative(process.cwd(), f)}: tabIndex=${m[1] || m[2] || m[3]}`);
      }
    }
    expect(trobats).toEqual([]);
  });
});
