// @vitest-environment node
/* Onada R24 · CODEX-R24-12 · La via de DEV de l'aprovació (el botó cap al panell de Tractors, que fora
   del servidor de desenvolupament no existix) no arriba al paquet de producció; la via en línia, sí.
   Vite compila AprovacioEnLinia.jsx sol (tota importació, externa) en mode producció i en mode
   desenvolupament, amb el mateix helper que PanellTractors.produccio.test.js: el literal
   import.meta.env.DEV es reemplaça i, en producció, la branca del panell desapareix. */
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const FITXER = 'src/sections/tractors/AprovacioEnLinia.jsx';

async function compila(entrada, produccio) {
  const abans = process.env.NODE_ENV;
  process.env.NODE_ENV = produccio ? 'production' : 'development';
  try {
    const resultat = await build({
      configFile: false,
      logLevel: 'silent',
      root: ARREL,
      mode: produccio ? 'production' : 'development',
      build: {
        write: false,
        minify: false,
        lib: { entry: path.join(ARREL, entrada), formats: ['es'], fileName: 'sonda' },
        rollupOptions: { external: (_id, importador) => Boolean(importador) }
      }
    });
    return (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output).map((o) => o.code ?? '').join('\n');
  } finally {
    if (abans === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = abans;
  }
}

describe('la via del panell no arriba al paquet de producció', () => {
  test('en desenvolupament, la via del panell; en producció, només la d’este navegador i la revocació', async () => {
    const desenvolupament = await compila(FITXER, false);
    expect(desenvolupament).toContain('Obri el panell de Tractors');
    expect(desenvolupament).toContain('al panell de Tractors');
    const produccio = await compila(FITXER, true);
    expect(produccio).not.toContain('Obri el panell de Tractors');
    expect(produccio).not.toContain('al panell de Tractors');
    // La sonda compila de veres: la via en línia continua al paquet.
    expect(produccio).toContain('Llig la fitxa i aprova’l');
    expect(produccio).toContain('en este navegador');
    expect(produccio).toContain('Revoca l’aprovació');
  }, 60000);
});
