// @vitest-environment node
/* Ordre del Mestre (30-10-2026, prompt 2208; SEO-CRIT-02) · Les opcions del
   selector social (urlSocialDe) viuen en un mòdul pur de config/. Si una
   portada les tornara a prendre de TextSection.jsx, el build posaria el
   component de Text i les seues dependències a l'entrada de /disseny (15 chunks,
   ~83 KB, mesurat al dist). Es fixa:
     · la regla de les opcions (origen https o res, base del Supabase del
       paquet, cap origen de tercers);
     · que el mòdul només importa origenPublic i capaDelPaquet;
     · que cap fitxer de src/ les importa de TextSection.jsx i que el graf
       d'importacions ESTÀTIQUES de DesignSection.jsx i ConsolaSection.jsx no
       arriba a TextSection.jsx (els import() dinàmics no compten: són chunks a
       part). */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { afterEach, describe, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({ origen: 'https://socdepoble.org', supabaseUrl: 'https://prova.supabase.co' }));
vi.mock('./origenPublic.js', () => ({ origenPublic: () => estat.origen }));
vi.mock('./capaDelPaquet.js', () => ({ capaDelPaquet: () => ({ supabaseUrl: estat.supabaseUrl }) }));

const { opcionsDeLaImatgeSocial } = await import('./opcionsImatgeSocial.js');

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const TEXT_SECTION = 'src/sections/text/TextSection.jsx';

/* Els especificadors estàtics (import, export … from) d'un fitxer. */
function importsEstatics(codi) {
  const { program } = parse(codi, { sourceType: 'module', plugins: ['jsx'] });
  return program.body
    .filter((n) => ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(n.type) && n.source)
    .map((n) => ({ font: n.source.value, noms: (n.specifiers || []).map((s) => s.imported?.name ?? s.local?.name) }));
}

const resol = (des, especificador) => {
  if (!especificador.startsWith('.')) return null;
  const base = path.posix.join(path.posix.dirname(des), especificador.split('?')[0]);
  return [base, ...['.js', '.jsx', '.mjs', '/index.js', '/index.jsx'].map((ext) => base + ext)]
    .find((ruta) => existsSync(path.join(ARREL, ruta)) && statSync(path.join(ARREL, ruta)).isFile()) || null;
};

/* El tancament estàtic d'una entrada, només fitxers de codi del repositori. */
function tancamentEstatic(entrada) {
  const vistos = new Set();
  const pila = [entrada];
  while (pila.length) {
    const ruta = pila.pop();
    if (vistos.has(ruta) || !/\.[cm]?jsx?$/.test(ruta)) continue;
    vistos.add(ruta);
    for (const { font } of importsEstatics(llig(ruta))) {
      const desti = resol(ruta, font);
      if (desti) pila.push(desti);
    }
  }
  return vistos;
}

afterEach(() => {
  estat.origen = 'https://socdepoble.org';
  estat.supabaseUrl = 'https://prova.supabase.co';
});

describe('opcionsDeLaImatgeSocial (config/opcionsImatgeSocial.js)', () => {
  test('l’origen públic només si és https; la base del paquet; cap origen de tercers', () => {
    expect(opcionsDeLaImatgeSocial()).toEqual({ origen: 'https://socdepoble.org', supabaseUrl: 'https://prova.supabase.co', permesos: [] });
    estat.origen = 'http://localhost:3340';
    estat.supabaseUrl = undefined;
    expect(opcionsDeLaImatgeSocial()).toEqual({ supabaseUrl: undefined, permesos: [] });
  });

  test('mòdul pur: només origenPublic i capaDelPaquet', () => {
    expect(importsEstatics(llig('src/config/opcionsImatgeSocial.js')).map(({ font }) => font).sort())
      .toEqual(['./capaDelPaquet.js', './origenPublic.js']);
  });

  test('ningú no les pren de TextSection.jsx: les portades les importen de config/', () => {
    const fonts = readdirSync(path.join(ARREL, 'src'), { recursive: true })
      .map((rel) => `src/${String(rel).split(path.sep).join('/')}`)
      .filter((rel) => /\.[cm]?jsx?$/.test(rel) && !/\.(?:test|spec)\.[cm]?jsx?$/.test(rel));
    const deText = fonts.filter((rel) => importsEstatics(llig(rel))
      .some(({ font, noms }) => resol(rel, font) === TEXT_SECTION && noms.includes('opcionsDeLaImatgeSocial')));
    expect(deText).toEqual([]);
    for (const rel of ['src/sections/disseny/DesignSection.jsx', 'src/sections/consola/ConsolaSection.jsx', 'src/sections/plugins/PluginPage.jsx', TEXT_SECTION]) {
      expect(importsEstatics(llig(rel)).some(({ font, noms }) => resol(rel, font) === 'src/config/opcionsImatgeSocial.js'
        && noms.includes('opcionsDeLaImatgeSocial')), rel).toBe(true);
    }
  });

  test.each(['src/sections/disseny/DesignSection.jsx', 'src/sections/consola/ConsolaSection.jsx'])(
    '%s no arriba a TextSection.jsx per cap import estàtic', (entrada) => {
      const tancament = tancamentEstatic(entrada);
      expect(tancament.has('src/config/opcionsImatgeSocial.js')).toBe(true);
      expect(tancament.has(TEXT_SECTION)).toBe(false);
    }
  );
});
