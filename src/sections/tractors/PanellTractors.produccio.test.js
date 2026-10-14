// @vitest-environment node
/* Ordre del Mestre, 13-10-2026 (pla 261013_1930, front 2; risc «mai en el
   paquet compilat per a producció o WordPress») · L'aprovació en bloc dels
   tractors només existix al servidor de desenvolupament. Fins ara ho guardava
   el graf (gestoria/privacitat.test.js: la Wiki de producció no importa el
   panell); ací es comprova al mateix fitxer. Vite compila PanellTractors.jsx
   sol (tota importació, externa) en mode producció i en mode desenvolupament,
   amb el mateix helper que privacitat.test.js: el literal import.meta.env.DEV
   es reemplaça i, en producció, la branca del botó desapareix. */
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const PANELL = 'src/sections/tractors/PanellTractors.jsx';

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

describe('l’aprovació en bloc no arriba al paquet de producció', () => {
  test('en desenvolupament hi són el botó i la crida; en producció, cap dels dos, i la resta del panell sí', async () => {
    const desenvolupament = await compila(PANELL, false);
    expect(desenvolupament).toContain('Aprovar tots els pendents (DEV)');
    expect(desenvolupament).toContain('aprovaTotsPendents');
    const produccio = await compila(PANELL, true);
    expect(produccio).not.toContain('Aprovar tots els pendents');
    expect(produccio).not.toContain('aprovaTotsPendents');
    // La sonda compila de veres: el panell continua al paquet.
    expect(produccio).toContain('Exporta el registre');
  }, 60000);
});
