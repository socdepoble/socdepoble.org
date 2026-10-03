/* Esquelet de catàleg i col·lecció (T4/T8) · LiniesColleccio: el tiquet del
   TPV i la llista de la compra amb la mateixa peça. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { LiniesColleccio } from './LiniesColleccio.jsx';

afterEach(cleanup);

const TIQUET = [
  { id: 'l1', articleId: 'cafe-llet', quantitat: 2, nom: 'Cafè amb llet', detall: 'Got · sense lactosa', valor: '3,00 €' },
  { id: 'l2', articleId: 'torrada', quantitat: 1, nom: 'Torrada amb tomaca', valor: '2,50 €', estat: 'anullat' }
];
const LLISTA = [
  { id: 'c1', articleId: 'llet', quantitat: 2, nom: 'Llet', detall: '1 l' },
  { id: 'c2', articleId: 'pomes', nom: 'Pomes', detall: '1 kg', estat: 'fet' }
];

describe('LiniesColleccio', () => {
  test('«quantitat × nom», detall i valor; el lector sent unitats, no un signe', () => {
    const { container } = render(<LiniesColleccio linies={TIQUET} etiqueta="Comanda" />);
    const files = within(screen.getByRole('list', { name: 'Comanda' })).getAllByRole('listitem');
    expect(files).toHaveLength(2);
    expect(files[0].querySelector('.sdp-linies__quantitat [aria-hidden="true"]').textContent).toBe('2 ×');
    expect(files[0].querySelector('.sdp-linies__quantitat .sdp-nomes-lector').textContent).toBe('2 unitats de');
    expect(files[0].querySelector('.sdp-linies__detall').textContent).toBe('Got · sense lactosa');
    expect(files[0].querySelector('.sdp-linies__valor').textContent).toBe('3,00 €');
    /* Sense accions, la línia és text quiet. */
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('l’estat porta text (Insígnia), no només color ni ratllat', () => {
    render(<LiniesColleccio linies={[...TIQUET, ...LLISTA]} textos={{ fet: 'Comprat' }} />);
    const files = screen.getAllByRole('listitem');
    expect(files[1].className).toBe('sdp-linies__linia sdp-linies__linia--anullat');
    expect(within(files[1]).getByText('Anul·lat').className).toBe('sdp-insignia sdp-insignia--neutre');
    expect(within(files[3]).getByText('Comprat').className).toBe('sdp-insignia sdp-insignia--exit');
    expect(files[2].querySelector('.sdp-linies__quantitat')).not.toBeNull();
    expect(files[3].querySelector('.sdp-linies__quantitat')).toBeNull();
  });

  test('TPV: tocar la línia l’edita; restar, sumar i llevar porten el nom de la línia', () => {
    const accions = { onEdita: vi.fn(), onResta: vi.fn(), onSuma: vi.fn(), onLleva: vi.fn() };
    render(<LiniesColleccio linies={TIQUET} {...accions} />);
    fireEvent.click(screen.getByRole('button', { name: /^2 unitats de Cafè amb llet/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Resta una unitat: Cafè amb llet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Suma una unitat: Torrada amb tomaca' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lleva Torrada amb tomaca' }));
    expect(accions.onEdita).toHaveBeenCalledWith(TIQUET[0]);
    expect(accions.onResta).toHaveBeenCalledWith(TIQUET[0]);
    expect(accions.onSuma).toHaveBeenCalledWith(TIQUET[1]);
    expect(accions.onLleva).toHaveBeenCalledWith(TIQUET[1]);
    /* Amb el toc per a editar, no hi ha un llapis repetit. */
    expect(screen.queryByRole('button', { name: /^Edita/ })).toBeNull();
  });

  test('La Compra: tocar la línia la marca i editar és un botó a part', () => {
    const onTria = vi.fn();
    const onEdita = vi.fn();
    render(<LiniesColleccio linies={LLISTA} onTria={onTria} onEdita={onEdita} />);
    fireEvent.click(screen.getByRole('button', { name: /^2 unitats de Llet 1 l/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Edita Pomes' }));
    expect(onTria).toHaveBeenCalledWith(LLISTA[0]);
    expect(onEdita).toHaveBeenCalledWith(LLISTA[1]);
  });

  test('sense línies, el buit', () => {
    render(<LiniesColleccio linies={[]} buit={<p>La comanda és buida</p>} />);
    expect(screen.getByText('La comanda és buida')).toBeTruthy();
  });
});
