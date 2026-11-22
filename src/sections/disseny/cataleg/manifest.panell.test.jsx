/* v1.2.22 · Gauntlet R2 (M4-07) · L'entradeta del Panell de Disseny al manifest (la de la pàgina
   /disseny?categoria=fonaments&item=fonaments-panell i la seua meta description) i la seua cerca descrivien tres
   controls (contrast, ombres i lletra Noto Sans) i «restablir els valors». Després de L2-01 i L3-05, el Panell té un
   sol interruptor, el «Mode Bancal · Sol i Lletra Gran» del xip i dels Ajustos, i els tres graons d'ombra, amb un sol
   «Restablir», el de l'ombra. Esta prova lliga cada afirmació de l'entradeta amb el que pinta EspecimenPanell.jsx
   (fora d'un UIProvider: es pinta igual i l'interruptor queda desactivat) i amb la regla de 56 px del Mode Sènior. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { TEXTOS_MODE_SENIOR } from '../../../config/textosModeSenior.js';
import { CATALOG_ITEMS } from './manifest.js';
import EspecimenPanell from './detalls/EspecimenPanell.jsx';

const MODE = TEXTOS_MODE_SENIOR.ca;
const panell = () => CATALOG_ITEMS.find((item) => item.id === 'fonaments-panell');
const munta = () => render(<MemoryRouter rutaInicial="/disseny"><EspecimenPanell /></MemoryRouter>);

afterEach(() => cleanup());

describe('v1.2.22 · M4-07 · l’entradeta del Panell de Disseny diu el Panell d’ara', () => {
  test('un sol interruptor, el del xip i dels Ajustos, i ni la lletra Noto Sans ni «restablir els valors»', () => {
    const { lead } = panell();
    expect(lead).toContain(`d’un sol toc el ${MODE.xip}`);
    expect(lead).toContain('el mateix del xip i dels Ajustos');
    expect(lead).not.toMatch(/lletra Noto Sans|restablir els valors/i);
    munta();
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(screen.getByRole('switch', { name: MODE.xip })).toBeTruthy();
  });

  test('els tres graons d’ombra i un sol botó per a tornar a l’ombra de sempre', () => {
    const { lead } = panell();
    expect(lead).toContain('els tres graons d’ombra de la targeta');
    expect(lead).toContain('un botó per a tornar a l’ombra de sempre');
    munta();
    const graons = within(screen.getByRole('group', { name: 'Ombra de la targeta de mostra' })).getAllByRole('button');
    expect(graons).toHaveLength(3);
    const restablir = screen.getAllByRole('button', { name: /Restablir/i });
    expect(restablir.map((boto) => boto.textContent)).toEqual(['Restablir l’ombra de sempre']);
  });

  test('les dianes d’acció de 56 px com a mínim: les diu el Panell i les posa el full del Mode Sènior', () => {
    expect(panell().lead).toContain('dianes d’acció de 56 px com a mínim');
    const { container } = munta();
    expect(container.textContent).toContain('Encés, les dianes d’acció primària fan 56 × 56 píxels com a mínim.');
    const full = readFileSync(path.join(process.cwd(), 'src/css/diferit-mode-senior.css'), 'utf8');
    /* 3.5rem = 56 px: la regla de les dianes d'acció primària, amb l'alçada i l'amplada mínimes. */
    const regla = full.slice(full.indexOf('Dianes d\'acció primària >= 56x56 px (3.5rem)'));
    expect(regla.length).toBeLessThan(full.length);
    const cos = regla.slice(regla.indexOf('{'), regla.indexOf('}'));
    expect(cos).toContain('min-height: 3.5rem;');
    expect(cos).toContain('min-width: 3.5rem;');
    expect(regla.slice(0, regla.indexOf('{'))).toContain('.sdp-boto');
  });

  test('la cerca troba el Panell pel mode, la lletra gran i l’ombra', () => {
    const { searchText } = panell();
    for (const terme of ['mode bancal', 'sol', 'lletra gran', 'contrast', 'ombra', 'restablir', '56']) {
      expect(searchText, terme).toContain(terme);
    }
    expect(searchText).not.toContain('ajustos del mode bancal, ombres i lletra');
  });
});
