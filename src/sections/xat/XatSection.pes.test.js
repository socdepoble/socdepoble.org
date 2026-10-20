// @vitest-environment node
/* Fase D (261020, L4) · El pes de /xat en mòbil. XatSection ja no porta el
   document destacat de la columna dreta (TextSection i PAGE_COPY): el demana
   en diferit i només en ample o mitjà. Esta prova recorre el tancament
   ESTÀTIC dels imports des de XatSection.jsx (els import() no hi compten) i
   comprova que cap camí no hi torna a portar els mòduls del document.
   Rollup encara sacseja alguns camins que el tancament de la font sí que veu
   (el barril de PedraSeca), així que els bytes es mesuren al build; ací només
   es vigilen els quatre mòduls de text. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SRC = path.join(ARREL, 'src');
const ENTRADA = path.join(SRC, 'sections', 'xat', 'XatSection.jsx');
const IMPORT_ESTATIC = /\b(?:import|export)\s+(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"\n]+)['"]/g;
const EXTENSIONS = ['', '.js', '.jsx', '/index.js', '/index.jsx'];

const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** El fitxer real d'un especificador relatiu o amb @/, o null (un paquet, un ?raw…). */
function resol(des, especificador) {
  const base = especificador.startsWith('@/') ? path.join(SRC, especificador.slice(2))
    : especificador.startsWith('.') ? path.resolve(path.dirname(des), especificador) : null;
  if (!base || especificador.includes('?')) return null;
  for (const ext of EXTENSIONS) {
    const cami = base + ext;
    try { if (fs.statSync(cami).isFile()) return cami; } catch { /* el següent */ }
  }
  return null;
}

/** Tots els fitxers de src/ que arriben des d'`entrada` per imports estàtics. */
function tancamentEstatic(entrada) {
  const vistos = new Set([entrada]);
  const pendents = [entrada];
  while (pendents.length) {
    const fitxer = pendents.pop();
    for (const [, especificador] of senseComentaris(fs.readFileSync(fitxer, 'utf8')).matchAll(IMPORT_ESTATIC)) {
      const fill = resol(fitxer, especificador);
      if (fill && !vistos.has(fill)) { vistos.add(fill); pendents.push(fill); }
    }
  }
  return new Set([...vistos].map((f) => path.relative(ARREL, f).split(path.sep).join('/')));
}

describe('L4 · /xat no porta el document destacat al seu tros', () => {
  const tancament = tancamentEstatic(ENTRADA);

  test('el tancament estàtic de XatSection.jsx no arriba als mòduls del document de text', () => {
    const document = ['src/sections/text/TextSection.jsx', 'src/sections/text/pageContent.js',
      'src/sections/text/legalContent.js', 'src/sections/text/paginaDeText.js'];
    expect(document.filter((rel) => tancament.has(rel)),
      'un import estàtic hi torna a portar el document: −72 KB perduts a /xat en mòbil').toEqual([]);
  });

  test('sanitat: el recorregut veu els mòduls que XatSection sí importa', () => {
    expect(tancament.has('src/sections/xat/paginaDestacada.js')).toBe(true);
    expect(tancament.has('src/components/layout/AppGridShell.jsx')).toBe(true);
    expect(tancament.size).toBeGreaterThan(20);
  });
});
