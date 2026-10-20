// @vitest-environment node
/* P0-09 (ordre del Mestre, 261020) · La pàgina «anima» ja no s'encasta a ella
   mateixa (l'iframe de /iaia-maria, recursiu, amb estil en línia i una
   classe sense regla) i l'enllaç a la Wiki de Poble és /wiki, que App.jsx
   porta a /wikidepoble com /skills. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';

test('cap iframe a la pàgina «anima» ni a cap altra pàgina de text', () => {
  expect(PAGE_COPY.anima.html).not.toMatch(/<iframe\b/i);
  expect(Object.entries(PAGE_COPY).filter(([, pagina]) => /<iframe\b/i.test(pagina?.html ?? '')).map(([clau]) => clau)).toEqual([]);
});

test('l’enllaç a la Wiki és /wiki i App.jsx el porta a /wikidepoble', () => {
  expect(PAGE_COPY.anima.html).toContain('<a href="/wiki">Wiki de Poble</a>');
  expect(PAGE_COPY.anima.html).not.toContain('href="/skills"');
  const app = readFileSync(path.join(process.cwd(), 'src/app/App.jsx'), 'utf8');
  expect(app).toContain('<Route path="wiki" element={<Navigate to="../wikidepoble" replace />} />');
});
