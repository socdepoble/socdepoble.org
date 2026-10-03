/* Esquelet de catàleg i col·lecció (T4/T8) · BarraResum: capçalera del panell
   en tauleta i peu que obri la col·lecció en pantalla estreta. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { BarraResum } from './BarraResum.jsx';

afterEach(cleanup);

const linies = (n) => `${n} ${n === 1 ? 'línia' : 'línies'}`;

/* Un clic amb modificador: diu si l'app l'ha aturat (defaultPrevented) i
   l'atura després perquè jsdom no intente obrir cap document. */
function clicSenseNavegar(element, opcions) {
  let aturat = null;
  const espia = (event) => {
    aturat = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', espia);
  fireEvent.click(element, opcions);
  window.removeEventListener('click', espia);
  return aturat;
}

describe('BarraResum', () => {
  test('capçalera: títol h3 amb el comptador, el total i un sol primari', () => {
    const cobra = vi.fn();
    const { container } = render(<BarraResum etiqueta="Comanda" comptador={3} textComptador={linies} total="7,40 €"
      accio={{ text: 'Cobra', onClick: cobra }} />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Comanda 3 línies');
    expect(container.querySelector('.sdp-barra-resum__total').textContent).toBe('Total: 7,40 €');
    fireEvent.click(screen.getByRole('button', { name: 'Cobra' }));
    expect(cobra).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('.sdp-boto--primari')).toHaveLength(1);
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('sense total ni acció (La Compra en lectura): només el títol; un comptador estrany val 0', () => {
    const { container } = render(<BarraResum etiqueta="Llista" comptador={-4} />);
    expect(screen.getByRole('heading').textContent).toBe('Llista 0');
    expect(container.querySelector('.sdp-barra-resum__total')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('peu amb href: és un enllaç; el clic normal el gestiona onObri, el de pestanya nova no', () => {
    const onObri = vi.fn();
    render(<BarraResum forma="peu" etiqueta="Comanda" comptador={2} textComptador={linies} total="3,00 €"
      href="/app/bar/caixa/colleccio" onObri={onObri} />);
    const enllac = screen.getByRole('link', { name: 'Comanda 2 línies 3,00 €' });
    expect(enllac.getAttribute('href')).toBe('/app/bar/caixa/colleccio');
    expect(enllac.className).toBe('sdp-barra-resum__obri sdp-barra-resum__obri--primari');
    expect(fireEvent.click(enllac)).toBe(false);
    expect(onObri).toHaveBeenCalledTimes(1);
    expect(clicSenseNavegar(enllac, { ctrlKey: true })).toBe(false);
    expect(onObri).toHaveBeenCalledTimes(1);
  });

  test('peu amb acció: obrir passa a secundari i l’acció és el primari', () => {
    const onObri = vi.fn();
    render(<BarraResum forma="peu" etiqueta="Llista" comptador={7} onObri={onObri} accio={{ text: 'Fet', onClick: () => {} }} />);
    const obri = screen.getByRole('button', { name: 'Llista 7' });
    expect(obri.className).toBe('sdp-barra-resum__obri');
    fireEvent.click(obri);
    expect(onObri).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Fet' }).className).toContain('sdp-boto--primari');
  });
});
