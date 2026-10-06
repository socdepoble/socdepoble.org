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

  /* Correcció F3 (261006) · L'avís va DINS del marc, primer fill del cos (la Llei de Scroll només
     fixa capçalera, eines i peu): la capçalera continua sent el primer fill del marc. */
  test('avis: primer fill del cos, davall de la capçalera i de les eines; la capçalera no té res damunt', () => {
    const { container } = render(
      <MarcColumna capcalera={<p>cap</p>} eines={<p>eines</p>} peu={<p>peu</p>} etiqueta="Productes" avis={<p role="status">Entra per a vendre.</p>}>
        <p>cos</p>
      </MarcColumna>
    );
    const marc = container.firstElementChild;
    expect([...marc.children].map((fill) => fill.className)).toEqual([
      'sdp-marc-columna__cap', 'sdp-marc-columna__eines', 'sdp-marc-columna__cos', 'sdp-marc-columna__peu'
    ]);
    const cos = screen.getByRole('region', { name: 'Productes' });
    expect([...cos.children].map((fill) => fill.textContent)).toEqual(['Entra per a vendre.', 'cos']);
    expect(screen.getByRole('status').parentElement).toBe(cos);
  });

  test('sense avis (absent, null, false o un node que no pinta res), el DOM és idèntic', () => {
    const Res = () => null;
    const pinta = (avis) => render(
      <MarcColumna capcalera={<p>cap</p>} eines={<p>eines</p>} etiqueta="Productes" avis={avis}><p>cos</p></MarcColumna>
    ).container.innerHTML;
    const sempre = render(<MarcColumna capcalera={<p>cap</p>} eines={<p>eines</p>} etiqueta="Productes"><p>cos</p></MarcColumna>).container.innerHTML;
    expect(sempre).toBe('<div class="sdp-marc-columna"><div class="sdp-marc-columna__cap"><p>cap</p></div><div class="sdp-marc-columna__eines">'
      + '<p>eines</p></div><div class="sdp-marc-columna__cos" role="region" aria-label="Productes" tabindex="0"><p>cos</p></div></div>');
    for (const avis of [undefined, null, false, <Res key="res" />]) expect(pinta(avis)).toBe(sempre);
  });

  test('l’avís que apareix o desapareix no torna a muntar el cos', () => {
    const { container, rerender } = render(<MarcColumna etiqueta="Productes"><input aria-label="Camp" /></MarcColumna>);
    const camp = screen.getByRole('textbox', { name: 'Camp' });
    rerender(<MarcColumna etiqueta="Productes" avis={<p>Avís</p>}><input aria-label="Camp" /></MarcColumna>);
    expect(screen.getByRole('textbox', { name: 'Camp' })).toBe(camp);
    expect(container.querySelector('.sdp-marc-columna__cos').firstElementChild.textContent).toBe('Avís');
    rerender(<MarcColumna etiqueta="Productes"><input aria-label="Camp" /></MarcColumna>);
    expect(screen.getByRole('textbox', { name: 'Camp' })).toBe(camp);
  });
});
