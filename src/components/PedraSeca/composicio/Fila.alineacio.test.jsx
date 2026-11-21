/* Gauntlet v1.2.16 (L5-01, L6-P1-02; Llei del Píxel) · La Fila de R32.22 passa
   l'alineació per un mapa literal tancat. A ded51467c la classe era
   `sdp-align-${align}`: amb 'flex-end' o 'flex-start' (Salut: Agitacio.jsx,
   Full.jsx i FormulariApunt.jsx) eixia una classe sense regla i la fila quedava
   en stretch. Un valor fora del mapa no ha de caure a 'sdp-align-center'. */
import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Fila } from './index.jsx';

afterEach(cleanup);

const classesDAlineacio = (node) => [...node.classList].filter((classe) => classe.startsWith('sdp-align-'));
const pinta = (props) => render(<Fila {...props}>Contingut</Fila>).container.firstElementChild;

describe('Fila · alineació idèntica a ded51467c', () => {
  test('sense align, el valor per defecte continua sent sdp-align-center', () => {
    expect(classesDAlineacio(pinta({}))).toEqual(['sdp-align-center']);
  });

  test('cada valor del mapa porta la seua classe literal', () => {
    for (const [align, classe] of Object.entries({
      center: 'sdp-align-center',
      start: 'sdp-align-start',
      end: 'sdp-align-end',
      stretch: 'sdp-align-stretch'
    })) {
      expect(classesDAlineacio(pinta({ align }))).toEqual([classe]);
      cleanup();
    }
  });

  test.each(['flex-end', 'flex-start', 'baseline', null])('align=%s, fora del mapa: cap classe d’alineació (stretch, com a la base)', (align) => {
    const node = pinta({ align });
    expect(classesDAlineacio(node)).toEqual([]);
    expect(node.classList.contains('sdp-fila')).toBe(true);
  });

  test('el full no fixa cap align-items a .sdp-fila ni té regla per a sdp-align-flex-*: sense classe, stretch', () => {
    const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8');
    expect(css).toMatch(/\.sdp-fila\s*\{\s*display:\s*flex;\s*flex-direction:\s*row;\s*\}/);
    expect(css).not.toMatch(/\.sdp-align-flex-/);
  });
});
