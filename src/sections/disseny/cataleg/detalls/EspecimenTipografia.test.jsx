import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import EspecimenTipografia, { AMPLADES, ESCALA_FLUIDA, RITME } from './EspecimenTipografia.jsx';

/* Fase D (Q5 del Mestre, 261004) · el mostrari diu el que pinta el sistema:
   cada xifra es compara amb tokens.css, no amb una còpia escrita a mà. */
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const TOKENS = llig('src/css/tokens.css');
const BASE = llig('src/css/base.css');
/* La primera declaració: el bloc clar de :root, :host, .sdp-root. */
const valor = (nom) => new RegExp(`(?:^|[^a-z0-9-])${nom}\\s*:\\s*([^;]+);`, 'm').exec(TOKENS)?.[1].trim();
const remEnPx = (text) => Number(text.replace('rem', '')) * 16;

afterEach(cleanup);

describe('EspecimenTipografia · l’escala que ensenya és la de tokens.css', () => {
  test('cada token fluid existix i els seus límits són els px del mostrari', () => {
    expect(ESCALA_FLUIDA).toHaveLength(8);
    for (const [token, , min, max] of ESCALA_FLUIDA) {
      const clamp = /^clamp\(([\d.]+rem),\s*[\d.]+rem \+ [\d.]+vw,\s*([\d.]+rem)\)$/.exec(valor(token));
      expect(clamp, token).not.toBeNull();
      expect([remEnPx(clamp[1]), remEnPx(clamp[2])], token).toEqual([min, max]);
    }
  });

  /* Derogació (acta 261004_1027 i F06 de Codex, 261004): el mínim fluid ja
     no és la mida fixa P6 del mateix nivell. Es fa més menut perquè el títol
     càpia sencer a 320px. Es conserven tres coses: la jerarquia (cada
     encapçalament és més gran que el de davall, a 320 i a 1024px), el sòl del
     cos de 16px i un creixement de 1.8 com a màxim. */
  test('el mínim fluid conserva la jerarquia, el sòl de 16px i un creixement de 1.8 com a màxim', () => {
    const titols = ESCALA_FLUIDA.slice(0, 6);
    for (let i = 1; i < titols.length; i++) {
      expect(titols[i - 1][2], `${titols[i - 1][0]} > ${titols[i][0]} a 320px`).toBeGreaterThan(titols[i][2]);
      expect(titols[i - 1][3], `${titols[i - 1][0]} > ${titols[i][0]} a 1024px`).toBeGreaterThan(titols[i][3]);
    }
    for (const [fluid, , min, max] of ESCALA_FLUIDA) {
      expect(min, `${fluid}: sòl del cos`).toBeGreaterThanOrEqual(16);
      expect(max / min, `${fluid}: creixement moderat`).toBeLessThanOrEqual(1.8);
    }
  });

  test('els marges del ritme vertical són els de tokens.css', () => {
    for (const [, tokenSup, sup, tokenInf, inf] of RITME) {
      if (tokenSup) expect(valor(tokenSup), tokenSup).toBe(sup);
      expect(valor(tokenInf), tokenInf).toBe(inf);
    }
  });

  test('les amplades són les de tokens.css i cada classe del mostrari existix a base.css', () => {
    for (const [token, percent, classe] of AMPLADES) {
      if (token) expect(valor(token), token).toBe(percent);
      expect(BASE, classe).toContain(`.${classe} {`);
    }
  });

  test('pinta els tokens, les tres amplades i un sol h1', () => {
    const { container } = render(<EspecimenTipografia />);
    const text = container.textContent;
    for (const [token] of ESCALA_FLUIDA) expect(text).toContain(token);
    for (const [, , classe] of AMPLADES) expect(container.querySelector(`p.${classe}`), classe).not.toBeNull();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    // Els valors d'abans de la P6 (h1 de 40px, interlineat 1,65) ja no hi són.
    expect(text).not.toMatch(/2\.5rem \(40px\)|1,65|1\.65/);
  });

  /* Flux lliure (ordre del Mestre del 261004; D-C, xat 06:38): el mostrari
     no prescriu cap mesura. */
  test('el mostrari ja no recomana la mesura de 68 caràcters', () => {
    const { container } = render(<EspecimenTipografia />);
    expect(container.textContent).not.toMatch(/68 ?(ch|caràcters)/);
  });
});
