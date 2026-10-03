/* Esquelet de catàleg i col·lecció (T4/T8) · AfegitRapid: el combobox de
   «Necessite…» amb suggeriments i la creació d'un article nou. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AfegitRapid } from './AfegitRapid.jsx';

afterEach(cleanup);

const SUGGERIMENTS = [
  { id: 'llet', nom: 'Llet', secundari: 'Llet i formatge' },
  { id: 'llentilles', nom: 'Llentilles' },
  { id: 'pa-llet', nom: 'Pa de llet' },
  { id: 'creilles', nom: 'Creïlles' }
];

const munta = (props = {}) => {
  const onTria = vi.fn();
  const onCrea = vi.fn();
  render(<AfegitRapid suggeriments={SUGGERIMENTS} onTria={onTria} onCrea={onCrea} {...props} />);
  const camp = screen.getByRole('combobox', { name: 'Necessite…' });
  const escriu = (text) => fireEvent.change(camp, { target: { value: text } });
  return { onTria, onCrea, camp, escriu };
};

describe('AfegitRapid', () => {
  test('etiqueta visible i combobox tancat mentre no s’escriu res', () => {
    const { camp } = munta({ placeholder: 'Ex.: pa' });
    expect(camp.getAttribute('aria-expanded')).toBe('false');
    expect(camp.getAttribute('aria-autocomplete')).toBe('list');
    expect(document.getElementById(camp.getAttribute('aria-controls')).hidden).toBe(true);
    expect(screen.getByText('Necessite…').tagName).toBe('LABEL');
    expect(screen.getByRole('button', { name: 'Afig' }).disabled).toBe(true);
  });

  test('escriure filtra sense accents i ofereix crear el que no hi és', () => {
    const { camp, escriu } = munta();
    escriu('llet');
    expect(camp.getAttribute('aria-expanded')).toBe('true');
    const opcions = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(opcions.map((o) => o.textContent)).toEqual(['Llet Llet i formatge', 'Pa de llet']);
    expect(screen.getByRole('status').textContent).toBe('2 suggeriments');
    escriu('creill');
    expect(within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent))
      .toEqual(['Creïlles', 'Afig «creill» com a article nou']);
  });

  test('fletxes, aria-activedescendant i Intro trien; el camp es buida i es queda obert per a la següent', () => {
    const { onTria, camp, escriu } = munta();
    escriu('ll');
    fireEvent.keyDown(camp, { key: 'ArrowDown' });
    fireEvent.keyDown(camp, { key: 'ArrowDown' });
    const activa = document.getElementById(camp.getAttribute('aria-activedescendant'));
    expect(activa.getAttribute('aria-selected')).toBe('true');
    expect(activa.textContent).toBe('Llentilles');
    fireEvent.keyDown(camp, { key: 'ArrowUp' });
    fireEvent.keyDown(camp, { key: 'ArrowUp' });
    expect(document.getElementById(camp.getAttribute('aria-activedescendant')).textContent).toBe('Afig «ll» com a article nou');
    fireEvent.keyDown(camp, { key: 'ArrowDown' });
    fireEvent.submit(camp.closest('form'));
    expect(onTria).toHaveBeenCalledWith(SUGGERIMENTS[0]);
    expect(camp.value).toBe('');
    expect(camp.getAttribute('aria-expanded')).toBe('false');
  });

  test('Intro sense opció activa: tria l’article exacte o crea el nou', () => {
    const { onTria, onCrea, camp, escriu } = munta();
    escriu('creïlles');
    fireEvent.submit(camp.closest('form'));
    expect(onTria).toHaveBeenCalledWith(SUGGERIMENTS[3]);
    escriu('  Safrà ');
    fireEvent.click(screen.getByRole('button', { name: 'Afig' }));
    expect(onCrea).toHaveBeenCalledWith('Safrà');
  });

  test('el clic tria l’opció; Escape tanca i, tancada, buida', () => {
    const { onCrea, camp, escriu } = munta();
    escriu('safr');
    fireEvent.mouseDown(screen.getByRole('listbox'));
    fireEvent.click(screen.getByRole('option', { name: 'Afig «safr» com a article nou' }));
    expect(onCrea).toHaveBeenCalledWith('safr');
    escriu('llet');
    fireEvent.keyDown(camp, { key: 'Escape' });
    expect(camp.getAttribute('aria-expanded')).toBe('false');
    expect(camp.value).toBe('llet');
    fireEvent.keyDown(camp, { key: 'Escape' });
    expect(camp.value).toBe('');
  });

  test('sense onCrea no s’inventa res: només el que existix', () => {
    const onTria = vi.fn();
    render(<AfegitRapid etiqueta="Busca…" suggeriments={SUGGERIMENTS} onTria={onTria} />);
    const camp = screen.getByRole('combobox', { name: 'Busca…' });
    fireEvent.change(camp, { target: { value: 'safrà' } });
    expect(camp.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Afig' }).disabled).toBe(true);
  });

  /* ESQ-R4 · Al «Busca…» del TPV (sense onCrea) el botó «Afig» està desactivat
     mentre el text no és exacte, i un formulari amb el botó per defecte
     desactivat no s'envia amb Intro: la tecla l'ha de tractar el camp. */
  test('sense onCrea, Intro tria l’opció activa encara que el botó estiga desactivat', () => {
    const onTria = vi.fn();
    render(<AfegitRapid etiqueta="Busca…" suggeriments={SUGGERIMENTS} onTria={onTria} />);
    const camp = screen.getByRole('combobox', { name: 'Busca…' });
    fireEvent.change(camp, { target: { value: 'llen' } });
    fireEvent.keyDown(camp, { key: 'ArrowDown' });
    expect(document.getElementById(camp.getAttribute('aria-activedescendant')).textContent).toBe('Llentilles');
    expect(screen.getByRole('button', { name: 'Afig' }).disabled).toBe(true);
    const tecla = fireEvent.keyDown(camp, { key: 'Enter' });
    expect(tecla).toBe(false);
    expect(onTria).toHaveBeenCalledTimes(1);
    expect(onTria).toHaveBeenCalledWith(SUGGERIMENTS[1]);
    expect(camp.value).toBe('');
    expect(camp.getAttribute('aria-expanded')).toBe('false');
  });

  test('Intro mentre es compon (IME) o sense opció activa no tria res des del camp', () => {
    const onTria = vi.fn();
    render(<AfegitRapid etiqueta="Busca…" suggeriments={SUGGERIMENTS} onTria={onTria} />);
    const camp = screen.getByRole('combobox', { name: 'Busca…' });
    fireEvent.change(camp, { target: { value: 'llen' } });
    expect(fireEvent.keyDown(camp, { key: 'Enter' })).toBe(true);
    fireEvent.keyDown(camp, { key: 'ArrowDown' });
    expect(fireEvent.keyDown(camp, { key: 'Enter', isComposing: true })).toBe(true);
    expect(onTria).not.toHaveBeenCalled();
    expect(camp.value).toBe('llen');
  });

  test('controlat: valor i onCanvi', () => {
    const onCanvi = vi.fn();
    render(<AfegitRapid suggeriments={SUGGERIMENTS} valor="pa" onCanvi={onCanvi} onTria={() => {}} />);
    const camp = screen.getByRole('combobox', { name: 'Necessite…' });
    expect(camp.value).toBe('pa');
    fireEvent.change(camp, { target: { value: 'pa de' } });
    expect(onCanvi).toHaveBeenCalledWith('pa de');
  });
});
