/* Gauntlet v1.2.16 (L6-P2-03) · La v1.2.16 retira la regla .sdp-alerta--ok de
   components.css. El comentari d'Alerta.jsx ja no la presenta com a àlies
   d'`exit`, i cap codi de src no passa to="ok": eixiria sense color. */
import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Alerta } from './Alerta.jsx';

afterEach(cleanup);

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fonts(dir, eixida = []) {
  for (const entrada of readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) fonts(ruta, eixida);
    else if (/\.(js|jsx)$/.test(entrada.name) && !/\.test\.jsx?$/.test(entrada.name)) eixida.push(ruta);
  }
  return eixida;
}

describe('Alerta · tons amb regla, sense l’àlies ok', () => {
  test('info, exit, avis i error tenen regla a components.css; ok, no', () => {
    const css = llig('src/css/components.css');
    for (const to of ['info', 'exit', 'avis', 'error']) {
      expect(css).toMatch(new RegExp(`\\.sdp-alerta--${to}\\b`));
      const { container } = render(<Alerta to={to}>Text</Alerta>);
      expect(container.firstElementChild.classList.contains(`sdp-alerta--${to}`)).toBe(true);
      cleanup();
    }
    expect(css).not.toMatch(/\.sdp-alerta--ok\b/);
  });

  test('el comentari d’Alerta.jsx diu que ok ja no existix i que s’usa exit', () => {
    const font = llig('src/components/PedraSeca/molecules/Alerta.jsx');
    expect(font).not.toMatch(/`ok` queda com a àlies/);
    expect(font).toMatch(/L'àlies `ok` ja no existix/);
  });

  test('cap font de src no passa to="ok" a una Alerta', () => {
    const usos = fonts('src').filter((ruta) => /<Alerta\b[^>]*\bto=(["'])ok\1|<Alerta\b[^>]*\bto=\{(["'])ok\2\}/.test(llig(ruta)));
    expect(usos).toEqual([]);
  });
});
