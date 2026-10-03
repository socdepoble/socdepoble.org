/* Esquelet de catàleg i col·lecció (T4/T8) · MarcColumna: capçalera, eines,
   cos que fa scroll i peu, sempre en este ordre. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { MarcColumna } from './MarcColumna.jsx';

afterEach(cleanup);

describe('MarcColumna', () => {
  test('capçalera, eines, cos amb nom (regió enfocable) i peu, en este ordre', () => {
    const { container } = render(
      <MarcColumna capcalera={<p>cap</p>} eines={<p>eines</p>} peu={<p>peu</p>} etiqueta="Productes">
        <p>cos</p>
      </MarcColumna>
    );
    const marc = container.firstElementChild;
    expect(marc.className).toBe('sdp-marc-columna');
    expect([...marc.children].map((fill) => fill.className)).toEqual([
      'sdp-marc-columna__cap', 'sdp-marc-columna__eines', 'sdp-marc-columna__cos', 'sdp-marc-columna__peu'
    ]);
    const cos = screen.getByRole('region', { name: 'Productes' });
    expect(cos.tabIndex).toBe(0);
    expect(cos.textContent).toBe('cos');
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('sense etiqueta ni ranures: només el cos, sense rol ni tabulació', () => {
    const { container } = render(<MarcColumna><p>cos</p></MarcColumna>);
    expect([...container.firstElementChild.children].map((fill) => fill.className)).toEqual(['sdp-marc-columna__cos']);
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.querySelector('[tabindex]')).toBeNull();
  });
});
