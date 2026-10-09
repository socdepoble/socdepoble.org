/**
 * Pestanyes (WAI-ARIA tabs) · Onada 6 (pàgina del poble): la variant
 * centrada (`centrades`, modificador sdp-pestanyes--centrades). Centrada amb
 * marges automàtics a les puntes de la llista: quan desborda valen 0 i la
 * primera pestanya no es talla (justify-content: safe center no és del
 * Baseline 2022). Sense la prop, el DOM de sempre.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Pestanyes } from './Pestanyes.jsx';

afterEach(cleanup);

const PESTANYES = [
  { id: 'gent', etiqueta: 'Gent de Vilanova', contingut: <p>Targetes</p> },
  { id: 'fotos', etiqueta: 'Fotografies', contingut: <p>Fotos</p> }
];

/* El CSS sense comentaris, en una línia. */
const CSS = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

describe('la variant centrada', () => {
  test('centrades afig el modificador a l’arrel; sense, la classe de sempre', () => {
    const { container, rerender } = render(<Pestanyes etiqueta="Continguts" pestanyes={PESTANYES} centrades />);
    expect(container.firstElementChild.className).toBe('sdp-pestanyes sdp-pestanyes--centrades');
    rerender(<Pestanyes etiqueta="Continguts" pestanyes={PESTANYES} />);
    expect(container.firstElementChild.className).toBe('sdp-pestanyes');
    rerender(<Pestanyes etiqueta="Continguts" pestanyes={PESTANYES} centrades className="propia" />);
    expect(container.firstElementChild.className).toBe('sdp-pestanyes sdp-pestanyes--centrades propia');
  });

  test('el CSS centra amb marges automàtics a la primera i a l’última pestanya, mai amb safe center', () => {
    expect(CSS).toContain('.sdp-pestanyes--centrades .sdp-pestanyes__pestanya:first-child { margin-inline-start: auto; }');
    expect(CSS).toContain('.sdp-pestanyes--centrades .sdp-pestanyes__pestanya:last-child { margin-inline-end: auto; }');
    expect(CSS).not.toMatch(/justify-content:\s*safe/);
    /* La pestanya centrada no encavalca la vora (margin-bottom -2px de
       sèrie): dins d'overflow-x: auto, eixos 2px desbordaven en vertical i
       Chrome hi pintava una barra de desplaçament (vist al navegador). */
    expect(CSS).toContain('.sdp-pestanyes--centrades .sdp-pestanyes__pestanya { margin-bottom: 0; }');
  });
});

describe('el patró de sempre, també centrat', () => {
  test('tablist amb nom, la primera seleccionada i només ella tabulable; el panell amb el seu nom', () => {
    render(<Pestanyes etiqueta="Continguts del poble" pestanyes={PESTANYES} centrades />);
    expect(screen.getByRole('tablist', { name: 'Continguts del poble' })).not.toBeNull();
    const [gent, fotos] = screen.getAllByRole('tab');
    expect([gent.getAttribute('aria-selected'), gent.tabIndex]).toEqual(['true', 0]);
    expect([fotos.getAttribute('aria-selected'), fotos.tabIndex]).toEqual(['false', -1]);
    expect(screen.getByRole('tabpanel', { name: 'Gent de Vilanova' }).textContent).toBe('Targetes');
  });

  test('←/→ mouen i activen; Inici i Fi van a les puntes', () => {
    render(<Pestanyes etiqueta="Continguts" pestanyes={PESTANYES} centrades />);
    const [gent, fotos] = screen.getAllByRole('tab');
    fireEvent.keyDown(gent, { key: 'ArrowRight' });
    expect(fotos.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(fotos);
    fireEvent.keyDown(fotos, { key: 'Home' });
    expect(gent.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(gent, { key: 'End' });
    expect(fotos.getAttribute('aria-selected')).toBe('true');
  });

  test('amb una sola pestanya, la barra també es pinta i el panell és visible', () => {
    render(<Pestanyes etiqueta="Continguts" pestanyes={[PESTANYES[0]]} centrades />);
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByRole('tabpanel').hidden).toBe(false);
  });
});
