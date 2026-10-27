/* Pla 261027_0845 (Guarda Nocturna), P1-55 · «Pàgina viva de comunitat»
   (revisió adversarial, bloquejant) · El scroll de la pàgina viva a la
   columna dreta del Xat, als fulls d'estil. jsdom no resol la cascada ni fa
   disposició: es comproven les regles de què depén. El DOM (on viu cada
   pàgina) el comprova FitxaVivaDeComunitat.test.jsx.
   La columna dreta no fa scroll (overflow: hidden). La pàgina d'un poble és
   de layout 'page', que no s'encongix (flex: none) ni fa scroll: sense
   contenidor, a 1440x900 només se'n veia la portada i la barra taronja. Viu
   dins de .sdp-xat-buit, el contenidor del document destacat, que sí que
   s'encongix i fa scroll. La fitxa d'una entitat és de layout 'contained':
   el seu contenidor ja en fa. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const full = (cami) => readFileSync(resolve(process.cwd(), cami), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** El valor d'una propietat a les regles d'un selector exacte (l'última guanya). */
function valor(text, selector, propietat) {
  let trobat = null;
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = net(m[1].split(';').pop()).split(',').map(net);
    if (!selectors.includes(selector)) continue;
    for (const declaracio of m[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

const graella = full('src/components/layout/AppGridShell.css');
const utilitats = full('src/css/utilities.css');
const modules = full('src/css/modules.css');

test('P1-55 · la columna dreta no fa scroll: qui en fa és el contenidor de la pàgina', () => {
  expect(valor(graella, '.app-grid-column--right', 'overflow')).toBe('hidden');
});

test('P1-55 · .sdp-xat-buit s’encongix a l’alçada de la columna i fa scroll (el contenidor de la pàgina del poble)', () => {
  expect(valor(modules, '.sdp-xat-buit', 'flex')).toBe('1 1 0');
  expect(valor(modules, '.sdp-xat-buit', 'min-height')).toBe('0');
  expect(valor(modules, '.sdp-xat-buit', 'overflow-y')).toBe('auto');
});

test('P1-55 · el layout «page» no fa scroll per ell mateix (necessita el contenidor); el «contained», sí', () => {
  expect(valor(utilitats, '.sdp-universal-page-container--page', 'flex')).toBe('none');
  expect(valor(utilitats, '.sdp-universal-page-container--page', 'overflow-y')).toBeNull();
  expect(valor(utilitats, '.sdp-universal-page-container--contained', 'overflow-y')).toBe('auto');
  expect(valor(utilitats, '.sdp-universal-page-container--contained', 'height')).toBe('100%');
  expect(valor(utilitats, '.sdp-universal-page-container--contained', 'min-height')).toBe('0');
});
