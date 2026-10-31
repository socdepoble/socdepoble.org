// @vitest-environment node
/* Gauntlet 261029 (cicle 1) · Fast Refresh (P1-71) · Un .jsx que exporta
   alguna cosa que no és un component (un hook, una constant, un mapa de
   textos, una funció en minúscula) no pot ser una frontera de Fast Refresh:
   @vitejs/plugin-react l'invalida i l'actualització puja en cadena fins a
   MultimediaSection, que torna a importar els contextos amb un ?t= nou (una
   edició de GraellaAlbumLocal.jsx deixava el Mas en «useSession ha de ser
   usat dins de SessionProvider»). Cada .jsx de la secció només exporta
   identificadors en PascalCase (els valors viuen a suportGestorLocal.js,
   miniaturesLocals.js…). Els fitxers de context (proveïdor + hook,
   *Context.jsx) són el patró de P1-71 que tracta G-deutes §2.1: fora. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const DIR = path.join(process.cwd(), 'src/sections/multimedia');
const COMPONENTS = readdirSync(DIR)
  .filter((nom) => nom.endsWith('.jsx') && !nom.endsWith('.test.jsx') && !nom.endsWith('Context.jsx'))
  .sort();

/** Els noms que exporta una font: declaracions i llistes `export { a, b as C }`. */
function exportacionsDe(font) {
  const noms = [];
  for (const m of font.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) noms.push(m[1]);
  for (const m of font.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const tros of m[1].split(',')) {
      const nom = tros.trim().split(/\s+as\s+/).pop()?.trim();
      if (nom) noms.push(nom);
    }
  }
  return noms;
}

describe('Fast Refresh · els .jsx de /multimedia només exporten components', () => {
  test('el detector troba les declaracions i les llistes', () => {
    expect(exportacionsDe('export const MAX = 1;\nexport function useX() {}\nexport { a as B, c };\nexport default function Pagina() {}'))
      .toEqual(['MAX', 'useX', 'Pagina', 'B', 'c']);
  });

  test.each(COMPONENTS)('%s', (nom) => {
    const exportacions = exportacionsDe(readFileSync(path.join(DIR, nom), 'utf8'));
    expect(exportacions.length, nom).toBeGreaterThan(0);
    expect(exportacions.filter((exportat) => !/^[A-Z]/.test(exportat)), nom).toEqual([]);
    /* Una constant en MAJÚSCULES (MAX_MINIATURA_BYTES, ICONES_TIPUS_LOCAL) tampoc és un component. */
    expect(exportacions.filter((exportat) => /^[A-Z][A-Z0-9_]+$/.test(exportat)), nom).toEqual([]);
  });
});
