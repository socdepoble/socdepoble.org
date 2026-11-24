// @vitest-environment node
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { expect, test } from 'vitest';

function executa(module, method, pattern) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve('tests/helpers/seoAdversarialWorker.mjs'), {
      workerData: { module: path.resolve(module), method, pattern, length: 100000 }
    });
    const timer = setTimeout(() => { worker.terminate().then(() => reject(new Error('L’entrada adversària no acaba en 2 s.'))); }, 2000);
    worker.once('message', value => { clearTimeout(timer); worker.terminate().then(() => resolve(value)); });
    worker.once('error', error => { clearTimeout(timer); reject(error); });
  });
}
test.each([
  ['src/config/metadadesSocials.js', 'textPla', '<'],
  ['src/config/metadadesSocials.js', 'textPla', '['],
  ['src/config/metadadesSocials.js', 'textPla', '[a]('],
  ['src/config/publicationPolicy.js', 'pobleAllowsIndex', '<'],
  ['tooling/wiki/lib/publication-policy.mjs', 'pobleAllowsIndex', '<'],
  ['src/sections/notes/proposaCard.js', 'campBuit', '<'],
  ['src/sections/wiki-de-poble/parseMarkdown.js', 'extreuEditorial', '<'],
  ['src/sections/wiki-de-poble/parseMarkdown.js', 'extreuEditorialSuffix', ' ']
])('R32.56: %s %s amb obertures %s sense tancament acaba en temps fitat', async (module, method, pattern) => {
  const result = await executa(module, method, pattern);
  expect(result.result).toBe(method === 'campBuit' ? false : method === 'pobleAllowsIndex' ? true : method === 'extreuEditorialSuffix' ? 'x#' : pattern.repeat(160).slice(0, 160));
}, 5000);
