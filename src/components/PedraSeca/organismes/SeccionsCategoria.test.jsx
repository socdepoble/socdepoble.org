/* Esquelet de catàleg i col·lecció (T4/T8) · les categories: seccions
   plegables, el selector (pastilles o desplegable) i ordenar amb botons
   amunt i avall, sense arrossegar, amb el focus que no es perd. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Apple } from 'lucide-react';
import { OrdenaCategories, SeccionsCategoria, SelectorCategoria } from './SeccionsCategoria.jsx';
import { mouCategoria } from './articles.js';

afterEach(cleanup);

const CATEGORIES = [
  { id: 'fruita', nom: 'Fruita i verdura', icona: Apple, ordre: 0, visible: true },
  { id: 'pa', nom: 'Pa', ordre: 1, visible: true },
  { id: 'neteja', nom: 'Neteja', ordre: 2, visible: false }
];
const ARTICLES = [
  { id: 'pomes', nom: 'Pomes', categoriaId: 'fruita' },
  { id: 'barra', nom: 'Barra de pa', categoriaId: 'pa' },
  { id: 'lleixiu', nom: 'Lleixiu', categoriaId: 'neteja' }
];

describe('SeccionsCategoria', () => {
  test('pinta cada grup amb children(articles, categoria) i un títol h3 sense botó si no es plega', () => {
    const pinta = vi.fn((articles, categoria) => <p>{`${categoria.id}: ${articles.map((a) => a.id).join(',')}`}</p>);
    render(<SeccionsCategoria categories={CATEGORIES} articles={ARTICLES}>{pinta}</SeccionsCategoria>);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Fruita i verdura 1 article', 'Pa 1 article']);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('fruita: pomes')).toBeTruthy();
    expect(pinta).toHaveBeenCalledTimes(2);
  });

  test('nivell de títol configurable dins de 3-6 (mai h1 ni h2)', () => {
    const { rerender } = render(<SeccionsCategoria categories={CATEGORIES} articles={ARTICLES} nivell={4}>{() => null}</SeccionsCategoria>);
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2);
    rerender(<SeccionsCategoria categories={CATEGORIES} articles={ARTICLES} nivell={1}>{() => null}</SeccionsCategoria>);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  test('plegada: aria-expanded fals, el cos amagat i children no es crida', () => {
    const pinta = vi.fn(() => <p>contingut</p>);
    render(<SeccionsCategoria categories={CATEGORIES} articles={ARTICLES} plegades={['fruita']} onPlega={() => {}}>{pinta}</SeccionsCategoria>);
    const boto = screen.getByRole('button', { name: 'Fruita i verdura 1 article' });
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(boto.getAttribute('aria-controls')).hidden).toBe(true);
    expect(pinta).toHaveBeenCalledTimes(1);
  });
});

describe('SelectorCategoria', () => {
  test('pastilles: «Totes» i les visibles; triar torna l’id, i «Totes», null', () => {
    const onCanvi = vi.fn();
    render(<SelectorCategoria categories={CATEGORIES} valor="pa" onCanvi={onCanvi} />);
    const grup = screen.getByRole('group', { name: 'Categoria' });
    expect(within(grup).getAllByRole('button').map((b) => b.textContent)).toEqual(['Totes', 'Fruita i verdura', 'Pa']);
    expect(within(grup).getByRole('button', { name: 'Pa' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(grup).getByRole('button', { name: 'Fruita i verdura' }));
    fireEvent.click(within(grup).getByRole('button', { name: 'Totes' }));
    expect(onCanvi.mock.calls).toEqual([['fruita'], [null]]);
  });

  test('desplegable: un select natiu amb etiqueta visible', () => {
    const onCanvi = vi.fn();
    render(<SelectorCategoria categories={CATEGORIES} forma="desplegable" etiqueta="Passadís" onCanvi={onCanvi} />);
    const select = screen.getByRole('combobox', { name: 'Passadís' });
    expect([...select.options].map((o) => o.textContent)).toEqual(['Totes', 'Fruita i verdura', 'Pa']);
    fireEvent.change(select, { target: { value: 'pa' } });
    fireEvent.change(select, { target: { value: '' } });
    expect(onCanvi.mock.calls).toEqual([['pa'], [null]]);
  });
});

function Ordenador() {
  const [categories, setCategories] = useState(CATEGORIES);
  return (
    <OrdenaCategories
      categories={categories}
      onMou={(id, direccio) => setCategories((actuals) => mouCategoria(actuals, id, direccio))}
      onVisibilitat={(id, visible) => setCategories((actuals) => actuals.map((c) => (c.id === id ? { ...c, visible } : c)))}
    />
  );
}

describe('OrdenaCategories', () => {
  test('totes les categories (també les amagades), amb els botons a la vora desactivats', () => {
    render(<Ordenador />);
    const llista = screen.getByRole('list', { name: 'Ordre de les categories' });
    expect(within(llista).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Fruita i verdura', 'Pa', 'Neteja (amagada)']);
    expect(screen.getByRole('button', { name: 'Puja Fruita i verdura' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Baixa Neteja' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Mostra Neteja' }).getAttribute('aria-pressed')).toBe('false');
  });

  test('baixar mou la fila, conserva el focus i diu la posició nova; a la vora el focus passa a l’altra fletxa', () => {
    render(<Ordenador />);
    const baixa = screen.getByRole('button', { name: 'Baixa Fruita i verdura' });
    baixa.focus();
    fireEvent.click(baixa);
    const files = () => screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(files()).toEqual(['Pa', 'Fruita i verdura', 'Neteja (amagada)']);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Baixa Fruita i verdura' }));
    expect(screen.getByRole('status').textContent).toBe('Fruita i verdura: posició 2 de 3.');
    fireEvent.click(screen.getByRole('button', { name: 'Baixa Fruita i verdura' }));
    expect(files()).toEqual(['Pa', 'Neteja (amagada)', 'Fruita i verdura']);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Puja Fruita i verdura' }));
  });

  test('mostrar i amagar és un interruptor (aria-pressed) amb el nom de la categoria', () => {
    render(<Ordenador />);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra Pa' }));
    expect(screen.getByRole('button', { name: 'Mostra Pa' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getAllByRole('listitem')[1].textContent).toBe('Pa (amagada)');
  });
});
