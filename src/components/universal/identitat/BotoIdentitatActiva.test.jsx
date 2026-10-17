import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* T43 (ordre del Mestre, 260928) · el botó de la identitat activa. La
   resolució de sdp-media:// es prova a useIdentitatDeLaBarra.test. */
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => (ref && ref.startsWith('https:') ? ref : '')
}));
import { BotoIdentitatActiva, etiquetaIdentitatActiva, etiquetaPerfilPropi } from './BotoIdentitatActiva.jsx';
import { UserRound } from '../../../icons.jsx';

afterEach(cleanup);

/* Acta 261004_1027 §3 · El Foraster (sense sessió) no canvia: el botó de
   sempre, escrit ací tal com era abans de l'avatar gran. */
function ForasterDeSempre() {
  return (
    <button type="button" className="icon sdp-top-bar-btn" onClick={() => {}} aria-label="Entrar" title="Entrar">
      <UserRound aria-hidden="true" focusable="false" />
    </button>
  );
}

test('sense sessió: icona de persona, «Entrar» i cap popup', () => {
  const onClick = vi.fn();
  render(<BotoIdentitatActiva teSessio={false} onClick={onClick} etiquetaEntrar="Entrar" />);
  const boto = screen.getByRole('button', { name: 'Entrar' });
  expect(boto.hasAttribute('aria-haspopup')).toBe(false);
  expect(boto.querySelector('.sdp-avatar')).toBeNull();
  fireEvent.click(boto);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('acta 261004_1027 · sense sessió, el Foraster de sempre: DOM idèntic, també amb `perfil`', () => {
  const referencia = render(<ForasterDeSempre />).container.innerHTML;
  cleanup();
  const { container, rerender } = render(<BotoIdentitatActiva teSessio={false} onClick={() => {}} etiquetaEntrar="Entrar" />);
  expect(container.innerHTML).toBe(referencia);
  expect(container.querySelector('.sdp-top-bar-avatar')).toBeNull();
  rerender(<BotoIdentitatActiva teSessio={false} perfil onClick={() => {}} etiquetaEntrar="Entrar" />);
  expect(container.innerHTML).toBe(referencia);
});

test('acta 261004_1027 · persona sola: l’avatar gran porta al perfil i diu «El teu perfil: {nom}»', () => {
  const onClick = vi.fn();
  render(<BotoIdentitatActiva teSessio perfil nom="Pepa Soler" avatar="https://lh3.googleusercontent.com/a/pepa" llavor="u-1" onClick={onClick} />);
  const boto = screen.getByRole('button', { name: 'El teu perfil: Pepa Soler' });
  expect(etiquetaPerfilPropi('Pepa Soler')).toBe('El teu perfil: Pepa Soler');
  /* Res a desplegar: és un enllaç de navegació, no un menú. */
  expect(boto.hasAttribute('aria-haspopup')).toBe(false);
  expect(boto.hasAttribute('aria-expanded')).toBe(false);
  expect(boto.getAttribute('title')).toBe('El teu perfil: Pepa Soler');
  /* L'avatar és el botó sencer: ni la caixa d'icona ni el radi d'utilities. */
  expect(boto.className).toBe('sdp-top-bar-avatar');
  const avatar = boto.querySelector('.sdp-avatar');
  expect(avatar.classList.contains('sdp-avatar--lg')).toBe(true);
  /* Cap títol propi dins: el rètol emergent és el del botó. */
  expect(avatar.hasAttribute('title')).toBe(false);
  /* La foto passa pel filtre de sempre i sense referent. */
  const img = boto.querySelector('img');
  expect(img.getAttribute('alt')).toBe('');
  expect(img.getAttribute('src')).toBe('https://lh3.googleusercontent.com/a/pepa');
  expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
  expect(boto.querySelectorAll('[style]')).toHaveLength(0);
  expect(boto.hasAttribute('style')).toBe(false);
  fireEvent.click(boto);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('acta 261004_1027 · sense foto, les inicials en el mateix cercle gran; una URL no segura no es pinta', () => {
  render(<BotoIdentitatActiva teSessio perfil nom="Pepa Soler" avatar="javascript:alert(1)" llavor="u-1" />);
  const boto = screen.getByRole('button', { name: 'El teu perfil: Pepa Soler' });
  expect(boto.querySelector('img')).toBeNull();
  const avatar = boto.querySelector('.sdp-avatar.sdp-avatar--lg');
  expect(avatar.textContent).toBe('PS');
});

test('persona amb organitzacions: el nom accessible diu amb qui actues i obri el calaix', () => {
  /* Un origen de fotos de sessió que l'Avatar accepta (utils/sanitize.js). */
  render(<BotoIdentitatActiva teSessio nom="Pepa Soler" avatar="https://lh3.googleusercontent.com/a/pepa" llavor="u-1" obert={false} />);
  const boto = screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' });
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  expect(boto.getAttribute('title')).toBe('Actues com a Pepa Soler');
  /* Acta 261004_1027 · també ací l'avatar és gran i és el botó sencer. */
  expect(boto.className).toBe('sdp-top-bar-avatar');
  expect(boto.querySelector('.sdp-avatar').classList.contains('sdp-avatar--lg')).toBe(true);
  /* L'avatar és decoració: el nom el porta el botó. */
  expect(boto.querySelector('img').getAttribute('alt')).toBe('');
  expect(boto.hasAttribute('style')).toBe(false);
});

test('entitat sense logo: les SEUES inicials, l’anell d’entitat i «(organització)» al nom', () => {
  render(<BotoIdentitatActiva teSessio entitat nom="Forn de la Torre" avatar={null} llavor="o-1" obert />);
  const boto = screen.getByRole('button', { name: 'Identitat activa: Forn de la Torre (organització). Canviar identitat' });
  expect(boto.classList.contains('sdp-top-bar-avatar--entitat')).toBe(true);
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  expect(boto.querySelector('img')).toBeNull();
  expect(boto.querySelector('.sdp-avatar').textContent).toBe('FD');
});

test('una entitat activa mai perd el calaix ni l’anell, encara que arribe `perfil`', () => {
  render(<BotoIdentitatActiva teSessio entitat perfil nom="Forn de la Torre" />);
  const boto = screen.getByRole('button', { name: /Forn de la Torre \(organització\)\. Canviar identitat/ });
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  expect(boto.classList.contains('sdp-top-bar-avatar--entitat')).toBe(true);
});

test('sense nom, un nom honest; l’etiqueta es construïx en un sol lloc', () => {
  render(<BotoIdentitatActiva teSessio nom={null} />);
  expect(screen.getByRole('button', { name: etiquetaIdentitatActiva('El meu compte') })).toBeTruthy();
  cleanup();
  render(<BotoIdentitatActiva teSessio perfil nom={null} />);
  expect(screen.getByRole('button', { name: etiquetaPerfilPropi('El meu compte') })).toBeTruthy();
});

/* Revisió del Gauntlet 261017 (ID4) · `pendent`: la sessió recordada encara
   es restaura. Cap botó (ni «Entrar» ni avatar), cap silueta del Foraster i
   cap clic: un estat ocupat (aria-busy) que diu, al lector de pantalla, que
   es comprova la sessió. Sense `pendent`, el Foraster de sempre (vegeu
   dalt). Amb sessió, `pendent` no hi compta. */
test('ID4 · pendent: cap botó ni silueta, un estat ocupat i neutre', () => {
  const onClick = vi.fn();
  const { container } = render(<BotoIdentitatActiva teSessio={false} pendent onClick={onClick} etiquetaEntrar="Entrar" />);
  expect(container.querySelector('button')).toBeNull();
  expect(container.querySelector('svg')).toBeNull();
  const estat = screen.getByRole('status');
  expect(estat.getAttribute('aria-busy')).toBe('true');
  expect(estat.textContent).toBe('Comprovant la sessió…');
  fireEvent.click(estat);
  expect(onClick).not.toHaveBeenCalled();
  cleanup();
  render(<BotoIdentitatActiva teSessio pendent perfil nom="Pepa Soler" onClick={onClick} />);
  expect(screen.getByRole('button', { name: etiquetaPerfilPropi('Pepa Soler') })).not.toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});
