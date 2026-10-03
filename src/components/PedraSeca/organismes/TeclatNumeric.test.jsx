import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { TeclatNumeric, seguentValor } from './TeclatNumeric.jsx';

afterEach(cleanup);

const pla = (text) => text.replace(/[^\S\n\r\t ]/g, ' ');

function Controlat({ inicial = 0, onValor, ...props }) {
  const [valor, setValor] = useState(inicial);
  return <TeclatNumeric valor={valor} onCanvi={(nou) => { setValor(nou); onValor?.(nou); }} {...props} />;
}

const tecla = (nom) => fireEvent.click(screen.getByRole('button', { name: nom }));
const visor = () => pla(document.querySelector('output.sdp-teclat__visor .sdp-teclat__xifra').textContent);

describe('seguentValor', () => {
  test('xifres a la dreta, esborra i neteja; mai passa del màxim', () => {
    expect(seguentValor(0, '1', 99)).toBe(1);
    expect(seguentValor(12, '5', 999)).toBe(125);
    expect(seguentValor(125, 'esborra', 999)).toBe(12);
    expect(seguentValor(125, 'neteja', 999)).toBe(0);
    expect(seguentValor(99, '1', 99)).toBe(99);
    expect(seguentValor(-5, '3', 99)).toBe(3);
    expect(seguentValor(1.5, '3', 99)).toBe(3);
    expect(seguentValor(7, 'x', 99)).toBe(7);
  });
});

describe('TeclatNumeric · import', () => {
  test('teclejar 1, 2, 5 dona 125 cèntims i el visor diu 1,25 €', () => {
    const onValor = vi.fn();
    render(<Controlat onValor={onValor} />);
    expect(screen.getByRole('group', { name: 'Import' })).toBeTruthy();
    expect(visor()).toBe('0,00 €');
    ['1', '2', '5'].forEach(tecla);
    expect(onValor).toHaveBeenLastCalledWith(125);
    expect(visor()).toBe('1,25 €');
    tecla('Esborra l’última xifra');
    expect(onValor).toHaveBeenLastCalledWith(12);
    tecla('C, posa a zero');
    expect(onValor).toHaveBeenLastCalledWith(0);
    expect(onValor.mock.calls.every(([v]) => Number.isSafeInteger(v))).toBe(true);
  });

  test('el nom accessible de cada tecla comença pel text que es veu (WCAG 2.5.3)', () => {
    render(<Controlat />);
    const tecles = within(screen.getByRole('group', { name: 'Import' })).getAllByRole('button');
    const ambText = tecles.filter((boto) => boto.textContent.trim() !== '');
    expect(ambText).toHaveLength(11);
    for (const boto of ambText) {
      const visible = boto.textContent.trim();
      const nom = boto.getAttribute('aria-label') ?? visible;
      expect(nom.startsWith(visible), `${visible} → ${nom}`).toBe(true);
    }
    expect(screen.getByRole('button', { name: 'C, posa a zero' })).toBeTruthy();
  });

  test('el teclat físic també val, amb el focus dins', () => {
    const onValor = vi.fn();
    render(<Controlat onValor={onValor} />);
    const grup = screen.getByRole('group', { name: 'Import' });
    const set = screen.getByRole('button', { name: '7' });
    set.focus();
    fireEvent.keyDown(set, { key: '4' });
    fireEvent.keyDown(set, { key: '0' });
    expect(onValor).toHaveBeenLastCalledWith(40);
    fireEvent.keyDown(grup, { key: 'Backspace' });
    expect(onValor).toHaveBeenLastCalledWith(4);
    fireEvent.keyDown(grup, { key: 'Delete' });
    expect(onValor).toHaveBeenLastCalledWith(0);
    onValor.mockClear();
    fireEvent.keyDown(grup, { key: 'a' });
    fireEvent.keyDown(grup, { key: '5', ctrlKey: true });
    fireEvent.keyDown(grup, { key: 'Escape' });
    expect(onValor).not.toHaveBeenCalled();
  });

  test('una xifra que passaria del màxim no s’afig', () => {
    const onValor = vi.fn();
    render(<Controlat inicial={99} maxim={99} onValor={onValor} />);
    tecla('9');
    expect(onValor).not.toHaveBeenCalled();
    expect(visor()).toBe('0,99 €');
  });

  test('onAccepta rep l’enter; desactivat no canvia res', () => {
    const accepta = vi.fn();
    const onCanvi = vi.fn();
    const { rerender } = render(<TeclatNumeric valor={1250} onCanvi={onCanvi} onAccepta={accepta} textAccepta="Cobra" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cobra' }));
    expect(accepta).toHaveBeenCalledWith(1250);
    rerender(<TeclatNumeric valor={1250} onCanvi={onCanvi} onAccepta={accepta} textAccepta="Cobra" desactivat />);
    const grup = screen.getByRole('group', { name: 'Import' });
    expect(within(grup).getAllByRole('button').every((b) => b.disabled)).toBe(true);
    fireEvent.keyDown(grup, { key: '1' });
    expect(onCanvi).not.toHaveBeenCalled();
  });
});

describe('TeclatNumeric · quantitat', () => {
  test('enters amb la unitat al visor, el nom propi i el visor que avisa', () => {
    render(<Controlat mode="quantitat" unitat="ml" etiqueta="Begut" />);
    expect(screen.getByRole('group', { name: 'Begut' })).toBeTruthy();
    ['2', '5', '0'].forEach(tecla);
    expect(visor()).toBe('250 ml');
    const sortida = document.querySelector('output.sdp-teclat__visor');
    expect(sortida.getAttribute('aria-live')).toBe('polite');
    expect(screen.getAllByRole('button')).toHaveLength(12);
    expect(document.querySelector('[style]')).toBeNull();
  });

  test('el màxim per defecte de quantitat és 9999', () => {
    const onValor = vi.fn();
    render(<Controlat mode="quantitat" inicial={9999} onValor={onValor} />);
    tecla('1');
    expect(onValor).not.toHaveBeenCalled();
  });
});
