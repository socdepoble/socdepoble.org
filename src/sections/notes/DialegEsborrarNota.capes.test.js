import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* jsdom no calcula la cascada: es comprova la regla. Les proves del diàleg
   només miren className, i amb className correcte els botons eixien blaus
   i el diàleg a dalt a l'esquerra (components.css, peu del diàleg). */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const components = net('src/css/components.css');

test('el diàleg recupera el centrat natiu que el reset li lleva', () => {
  expect(components).toMatch(/\.sdp-dialeg \{ margin: auto;/);
});

test('al peu, «perill» és roig i «secundari» blanc encara que un altre full redefinisca .sdp-boto', () => {
  expect(components).toContain('.sdp-dialeg__peu .sdp-boto--perill { background: var(--sdp-error);');
  expect(components).toContain('.sdp-dialeg__peu .sdp-boto--perill:hover:not(:disabled) { background: var(--sdp-error-text); }');
  expect(components).toContain('.sdp-dialeg__peu .sdp-boto--secundari { background: var(--sdp-fons-targeta);');
  expect(components).toContain('.sdp-dialeg__peu .sdp-boto--secundari:hover:not(:disabled) { background: var(--sdp-fons-subtil); }');
});
