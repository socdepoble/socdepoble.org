// @vitest-environment node
/* Fase D (261020, revisió al navegador a 375px) · El menú d'un missatge del xat
   porta ara «Denuncia el missatge» i «Bloqueja …» (App Store 1.2) i fa 14rem.
   En pantalla estreta s'ha d'obrir cap a la bombolla: obert cap a la vora,
   al costat d'una bombolla ampla eixia de la pantalla (280 → 504px en 375px).
   jsdom no pinta: es comproven les regles escrites, sense comentaris. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const MODULES = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const reglaDe = (selector) => {
  const inici = MODULES.indexOf(`${selector} {`);
  if (inici === -1) return null;
  return net(MODULES.slice(MODULES.indexOf('{', inici) + 1, MODULES.indexOf('}', inici)));
};

describe('menú del missatge en pantalla estreta · modules.css', () => {
  test('el d’una altra persona s’obri cap a l’esquerra, damunt de la seua bombolla', () => {
    expect(reglaDe('.sdp-root[data-sdp-estret] .sdp-xat-item--altre .sdp-xat-menu'))
      .toBe('right: 0; left: auto; transform-origin: top right;');
  });

  test('el meu s’obri cap a la dreta, damunt de la meua bombolla', () => {
    expect(reglaDe('.sdp-root[data-sdp-estret] .sdp-xat-item--meu .sdp-xat-menu'))
      .toBe('right: auto; left: 0; transform-origin: top left;');
  });

  test('en pantalla ampla no canvia res: la regla d’abans es queda', () => {
    expect(reglaDe('.sdp-xat-item--altre .sdp-xat-menu')).toBe('right: auto; left: 0; transform-origin: top left;');
  });
});
