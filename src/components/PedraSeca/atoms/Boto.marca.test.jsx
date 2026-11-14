/**
 * Onada R26.3 (ordre del Mestre del 14-11-2026, revisió de Gemini §1.B.4) · El botó de marca
 * és l'àtom Boto amb `marca`: les mateixes classes que ja pintaven a mà EntradaNativa.jsx i
 * l'espècimen de respiració (.sdp-boto--marca + .sdp-boto--apple|--google), sense la classe
 * de varietat: el hover del secundari (0,3,0) taparia el fons de la marca, que no en porta.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Boto } from './Boto.jsx';

afterEach(cleanup);

function Logotip({ size }) {
  return <svg data-testid="logotip" data-mida={size} aria-hidden="true" focusable="false" />;
}

describe('Boto · marca', () => {
  test('marca apple: classes de marca, sense varietat, amb la icona decorativa i el text com a nom', () => {
    render(<Boto marca="apple" mida="gran" icona={Logotip}>Disponible a l’App Store</Boto>);
    const boto = screen.getByRole('button', { name: 'Disponible a l’App Store' });
    expect(boto.className).toBe('sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran');
    expect(boto.getAttribute('type')).toBe('button');
    expect(screen.getByTestId('logotip').getAttribute('aria-hidden')).toBe('true');
  });

  test('marca google amb ple: la combinació d’EntradaNativa.jsx', () => {
    render(<Boto marca="google" ple>Continua amb Google</Boto>);
    expect(screen.getByRole('button').className.split(' ').sort())
      .toEqual(['sdp-boto', 'sdp-boto--google', 'sdp-boto--marca', 'sdp-boto--ple']);
  });

  test('la marca guanya a una varietat explícita, i una marca desconeguda torna a la varietat', () => {
    const { rerender } = render(<Boto marca="apple" varietat="primari">App Store</Boto>);
    expect(screen.getByRole('button').classList.contains('sdp-boto--primari')).toBe(false);
    rerender(<Boto marca="desconeguda" varietat="primari">Altra</Boto>);
    const boto = screen.getByRole('button');
    expect(boto.className).toBe('sdp-boto sdp-boto--primari');
    expect(boto.className).not.toMatch(/marca|desconeguda/);
  });

  test('sense marca res no canvia: secundari per defecte', () => {
    render(<Boto>Desar</Boto>);
    expect(screen.getByRole('button').className).toBe('sdp-boto sdp-boto--secundari');
  });
});
