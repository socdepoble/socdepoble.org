/* Esquelet de catàleg i col·lecció (T4/T8) · LlistaArticles: la mateixa dada
   i les mateixes props que GraellaArticles, en files. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Milk } from 'lucide-react';
import { GraellaArticles } from './GraellaArticles.jsx';
import { LlistaArticles } from './LlistaArticles.jsx';

afterEach(cleanup);

const CATEGORIES = [
  { id: 'lactics', nom: 'Llet i formatge', icona: Milk, ordre: 0, visible: true },
  { id: 'neteja', nom: 'Neteja', ordre: 1, visible: true }
];
const ARTICLES = [
  { id: 'llet', nom: 'Llet', categoriaId: 'lactics', secundari: 'Sense lactosa', valor: '2 l', estat: 'en-colleccio' },
  { id: 'formatge', nom: 'Formatge fresc', categoriaId: 'lactics', insignia: 'NOU' },
  { id: 'sabo', nom: 'Sabó de rentar', categoriaId: 'neteja', estat: 'desactivat' },
  { id: 'paper', nom: 'Paper de cuina', categoriaId: 'neteja', imatge: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' }
];

describe('LlistaArticles', () => {
  test('cada fila és un botó natiu: quadrat 1:1, nom, línia secundària i el valor a la dreta', () => {
    const onTria = vi.fn();
    const { container } = render(<LlistaArticles articles={ARTICLES} etiqueta="Articles" onTria={onTria} />);
    const llet = screen.getByRole('button', { name: 'Llet Sense lactosa 2 l' });
    expect(llet.querySelector('.sdp-llista-articles__quadrat').getAttribute('aria-hidden')).toBe('true');
    expect(llet.querySelector('.sdp-llista-articles__valor').textContent).toBe('2 l');
    fireEvent.click(llet);
    expect(onTria).toHaveBeenCalledWith(ARTICLES[0]);
    expect(container.querySelector('[data-article="paper"] img').getAttribute('alt')).toBe('');
    expect(screen.getByRole('button', { name: 'Sabó de rentar' }).disabled).toBe(true);
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('estat i insígnia amb text; en mode commutable, aria-pressed', () => {
    const { container } = render(<LlistaArticles articles={ARTICLES} commutable textos={{ 'en-colleccio': 'A la llista' }} />);
    const llet = screen.getByRole('button', { name: /^Llet/ });
    expect(llet.getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById(llet.getAttribute('aria-describedby')).textContent).toBe('A la llista');
    expect(container.querySelector('.sdp-llista-articles__element--en-colleccio .sdp-llista-articles__marca-colleccio')).not.toBeNull();
    const formatge = screen.getByRole('button', { name: 'Formatge fresc' });
    expect(document.getElementById(formatge.getAttribute('aria-describedby')).textContent).toBe('NOU');
  });

  test('per seccions de categoria, com la graella', () => {
    render(<LlistaArticles articles={ARTICLES} categories={CATEGORIES} />);
    expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['Llet i formatge 2 articles', 'Neteja 2 articles']);
    expect(within(screen.getByRole('list', { name: 'Neteja' })).getAllByRole('button')).toHaveLength(2);
  });

  test('graella i llista són intercanviables: mateixes props, mateixos botons i mateixos gestos', () => {
    const props = { articles: ARTICLES, categories: CATEGORIES, onTria: vi.fn(), onAccioSecundaria: vi.fn() };
    const noms = () => screen.getAllByRole('button').filter((b) => b.dataset.article).map((b) => b.dataset.article);
    const { rerender } = render(<GraellaArticles {...props} />);
    const enGraella = noms();
    rerender(<LlistaArticles {...props} />);
    expect(noms()).toEqual(enGraella);
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Formatge fresc' }));
    expect(props.onAccioSecundaria).toHaveBeenCalledWith(ARTICLES[1], expect.any(HTMLButtonElement));
  });

  /* EXCEPCIÓ a la regla 1:1 (Pedra Seca §8), autoritzada pel Mestre el 261003 i
     limitada a les targetes del Lector de notícies (PedraSeca/qualitat.panoramica.test.js). */
  test('la variant panoramica (16:9, només el Lector): la miniatura permesa i el marcador, dins de .sdp-panoramica', () => {
    const { container } = render(<LlistaArticles panoramica articles={ARTICLES} etiqueta="Articles" />);
    const llista = screen.getByRole('list', { name: 'Articles' });
    expect(llista.className).toBe('sdp-llista-articles sdp-panoramica');
    expect(container.querySelector('[data-article="paper"] .sdp-llista-articles__quadrat > img.sdp-marca-article__imatge').closest('.sdp-panoramica')).toBe(llista);
    expect(container.querySelector('[data-article="llet"] .sdp-llista-articles__quadrat > .sdp-marca-article').closest('.sdp-panoramica')).toBe(llista);
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('sense articles, el buit', () => {
    render(<LlistaArticles articles={[]} categories={CATEGORIES} buit={<p>Llista buida</p>} />);
    expect(screen.getByText('Llista buida')).toBeTruthy();
  });
});
