import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Rajola, inicialsDe } from './Rajola.jsx';

afterEach(cleanup);

describe('inicialsDe', () => {
  test('les dues primeres paraules, en majúscula; sense text, «?»', () => {
    expect(inicialsDe('Cafè amb llet')).toBe('CA');
    expect(inicialsDe('  aigua  ')).toBe('A');
    expect(inicialsDe('')).toBe('?');
    expect(inicialsDe(null)).toBe('?');
  });
});

describe('Rajola', () => {
  test('és un botó natiu amb el títol i la línia secundària com a nom; el marcador és decoració', () => {
    const premuda = vi.fn();
    const { container } = render(<Rajola titol="Cafè amb llet" secundari="1,40 €" onClick={premuda} />);
    const boto = screen.getByRole('button', { name: 'Cafè amb llet 1,40 €' });
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.classList.contains('sdp-rajola')).toBe(true);
    expect(boto.hasAttribute('aria-pressed')).toBe(false);
    expect(container.querySelector('.sdp-rajola__media').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.sdp-rajola__marcador').textContent).toBe('CA');
    fireEvent.click(boto);
    expect(premuda).toHaveBeenCalledTimes(1);
  });

  test('un marcador propi substituïx les inicials; un node propi, el quadrat', () => {
    const { container, rerender } = render(<Rajola titol="Begudes" marcador="BG" />);
    expect(container.querySelector('.sdp-rajola__marcador').textContent).toBe('BG');
    rerender(<Rajola titol="Begudes" media={<span className="sdp-nomes-lector">propi</span>} />);
    expect(container.querySelector('.sdp-rajola__marcador')).toBeNull();
    expect(container.querySelector('.sdp-rajola__media').textContent).toBe('propi');
  });

  test('una imatge pròpia es pinta quadrada i sense alt; una font insegura torna al marcador', () => {
    const { container, rerender } = render(<Rajola titol="Logo" imatge="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg" />);
    const img = container.querySelector('img.sdp-rajola__imatge');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg');
    rerender(<Rajola titol="Logo" imatge="javascript:alert(1)" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.sdp-rajola__marcador').textContent).toBe('L');
  });

  test('seleccionada diu aria-pressed; desactivada és disabled i no crida', () => {
    const premuda = vi.fn();
    const { rerender } = render(<Rajola titol="Begudes" seleccionada onClick={premuda} />);
    expect(screen.getByRole('button', { name: 'Begudes' }).getAttribute('aria-pressed')).toBe('true');
    rerender(<Rajola titol="Begudes" seleccionada={false} onClick={premuda} />);
    expect(screen.getByRole('button', { name: 'Begudes' }).getAttribute('aria-pressed')).toBe('false');
    rerender(<Rajola titol="Croissant" secundari="Esgotat" desactivada onClick={premuda} />);
    const boto = screen.getByRole('button', { name: 'Croissant Esgotat' });
    expect(boto.disabled).toBe(true);
    fireEvent.click(boto);
    expect(premuda).not.toHaveBeenCalled();
  });

  test('les props de més van al botó i cap style', () => {
    const { container } = render(<Rajola titol="X" data-producte="p-1" aria-describedby="nota" className="extra" />);
    const boto = container.querySelector('button');
    expect(boto.dataset.producte).toBe('p-1');
    expect(boto.getAttribute('aria-describedby')).toBe('nota');
    expect(boto.className).toBe('sdp-rajola extra');
    expect(container.querySelector('[style]')).toBeNull();
  });
});
