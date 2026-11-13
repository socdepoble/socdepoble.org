// @vitest-environment node
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { MAPA_BESSONES_PUBLIC, extensioOriginalPublica } from './mapaBessonesPublic.js';

const ARREL_PUBLIC = path.resolve(process.cwd(), 'public');
const EXTENSIONS = ['.jpg', '.png', '.JPG', '.jpeg', '.JPEG', '.PNG'];

function escanejaBessonesReals(dir, acumulat = {}) {
  const noms = readdirSync(dir).sort();
  const conjuntExacte = new Set(noms);
  for (const nom of noms) {
    const ple = path.join(dir, nom);
    if (statSync(ple).isDirectory()) {
      escanejaBessonesReals(ple, acumulat);
      continue;
    }
    if (!nom.endsWith('.webp')) continue;
    const tronc = nom.slice(0, -5);
    const trobada = EXTENSIONS.find((ext) => conjuntExacte.has(`${tronc}${ext}`));
    if (trobada) {
      const rel = path.relative(ARREL_PUBLIC, ple).split(path.sep).join('/');
      acumulat[rel] = trobada;
    }
  }
  return acumulat;
}

test('R21.7 · MAPA_BESSONES_PUBLIC reflectix al 100% i sense cap fantasma els originals ràster de public/assets/', () => {
  const reals = escanejaBessonesReals(path.join(ARREL_PUBLIC, 'assets'));
  expect(MAPA_BESSONES_PUBLIC).toEqual(reals);
  for (const [relWebp, ext] of Object.entries(MAPA_BESSONES_PUBLIC)) {
    const relOriginal = `${relWebp.slice(0, -5)}${ext}`;
    expect(existsSync(path.join(ARREL_PUBLIC, relWebp)), relWebp).toBe(true);
    expect(existsSync(path.join(ARREL_PUBLIC, relOriginal)), relOriginal).toBe(true);
  }
});

test('R21.7 · xat_portada.webp és autònoma (sense .png/.JPG) i la-torre-de-les-macanes/2.webp apunta únicament a 2.jpg', () => {
  expect(existsSync(path.join(ARREL_PUBLIC, 'assets/uploads/brain/xat_portada.webp'))).toBe(true);
  expect(existsSync(path.join(ARREL_PUBLIC, 'assets/uploads/brain/xat_portada.png'))).toBe(false);
  expect(extensioOriginalPublica('assets/uploads/brain/xat_portada.webp')).toBe('');
  expect(extensioOriginalPublica('assets/towns/la-torre-de-les-macanes/2.webp')).toBe('.jpg');
  expect(existsSync(path.join(ARREL_PUBLIC, 'assets/towns/la-torre-de-les-macanes/2.png'))).toBe(false);
});
