import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* T43 (ordre del Mestre, 260928) · el botó de la identitat activa. La
   resolució de sdp-media:// es prova a useIdentitatDeLaBarra.test. */
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => (ref && ref.startsWith('https:') ? ref : '')
}));
import { BotoIdentitatActiva, etiquetaIdentitatActiva } from './BotoIdentitatActiva.jsx';

afterEach(cleanup);

test('sense sessió: icona de persona, «Entrar» i cap popup', () => {
  const onClick = vi.fn();
  render(<BotoIdentitatActiva teSessio={false} onClick={onClick} etiquetaEntrar="Entrar" />);
  const boto = screen.getByRole('button', { name: 'Entrar' });
  expect(boto.hasAttribute('aria-haspopup')).toBe(false);
  expect(boto.querySelector('.sdp-avatar')).toBeNull();
  fireEvent.click(boto);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('persona: el nom accessible diu amb qui actues i obri el calaix', () => {
  /* Un origen de fotos de sessió que l'Avatar accepta (utils/sanitize.js). */
  render(<BotoIdentitatActiva teSessio nom="Pepa Soler" avatar="https://lh3.googleusercontent.com/a/pepa" llavor="u-1" obert={false} />);
  const boto = screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' });
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  expect(boto.getAttribute('title')).toBe('Actues com a Pepa Soler');
  expect(boto.className).toBe('icon sdp-top-bar-btn sdp-top-bar-btn--identitat');
  /* L'avatar és decoració: el nom el porta el botó. */
  expect(boto.querySelector('img').getAttribute('alt')).toBe('');
  expect(boto.hasAttribute('style')).toBe(false);
});

test('entitat sense logo: les SEUES inicials, l’anell d’entitat i «(organització)» al nom', () => {
  render(<BotoIdentitatActiva teSessio entitat nom="Forn de la Torre" avatar={null} llavor="o-1" obert />);
  const boto = screen.getByRole('button', { name: 'Identitat activa: Forn de la Torre (organització). Canviar identitat' });
  expect(boto.classList.contains('sdp-top-bar-btn--entitat')).toBe(true);
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  expect(boto.querySelector('img')).toBeNull();
  expect(boto.querySelector('.sdp-avatar').textContent).toBe('FD');
});

test('sense nom, un nom honest; l’etiqueta es construïx en un sol lloc', () => {
  render(<BotoIdentitatActiva teSessio nom={null} />);
  expect(screen.getByRole('button', { name: etiquetaIdentitatActiva('El meu compte') })).toBeTruthy();
});
