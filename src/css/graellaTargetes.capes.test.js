/**
 * Graelles de targetes sense forat fantasma (avís del Mestre, 261004, a
 * /consola/pols). La .sp-card porta max-width 500px i marge auto: en una
 * graella amb auto-fit, una fila incompleta esfondra les pistes buides, les
 * columnes s'eixamplen més enllà dels 500px i cada targeta queda centrada en
 * la seua cel·la, amb un forat al mig. Les graelles de targetes van amb
 * auto-fill, com la canònica .sdp-card-grid.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = resolve(process.cwd(), 'src');
const FULLS = readdirSync(ARREL, { recursive: true })
  .filter((ruta) => String(ruta).endsWith('.css'))
  .map((ruta) => ({ ruta: String(ruta), text: readFileSync(join(ARREL, String(ruta)), 'utf8') }));

const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles (les més internes) amb selector de graella de targetes i auto-fit. */
function infraccions(css) {
  const trobades = [];
  for (const [, selector, cos] of senseComentaris(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = selector.trim();
    if (!/\.sdp-card-(grid|llista)\b/.test(sel)) continue;
    if (/grid-template-columns\s*:[^;]*auto-fit/.test(cos)) trobades.push(sel);
  }
  return trobades;
}

describe('graelles de targetes: auto-fill, mai auto-fit', () => {
  test('el detector troba l’auto-fit en una graella de targetes i deixa passar la resta', () => {
    expect(infraccions('.sdp-card-grid.x { grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); }')).toEqual(['.sdp-card-grid.x']);
    expect(infraccions('@layer components {\n  .a .sdp-card-llista { grid-template-columns: repeat(auto-fit, 1fr); }\n}')).toEqual(['.a .sdp-card-llista']);
    expect(infraccions('.sdp-card-grid.x { grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); }')).toEqual([]);
    expect(infraccions('.sdp-grup__targetes { grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }')).toEqual([]);
    expect(infraccions('/* .sdp-card-grid { grid-template-columns: repeat(auto-fit, 1fr); } */')).toEqual([]);
  });

  test('el recorregut llig els fulls de veres', () => {
    expect(FULLS.map((f) => f.ruta)).toEqual(expect.arrayContaining(['css/modules.css', 'css/components.css']));
  });

  test('cap full de src porta una graella de targetes amb auto-fit', () => {
    const totes = FULLS.flatMap((f) => infraccions(f.text).map((sel) => `${f.ruta}: ${sel}`));
    expect(totes).toEqual([]);
  });

  test('la Consola i el Tauler de la Gestoria usen auto-fill', () => {
    const modules = senseComentaris(FULLS.find((f) => f.ruta === 'css/modules.css').text);
    for (const selector of ['.sdp-card-grid.sdp-consola__graella', '.sdp-card-grid.sdp-gestoria-tauler__graella']) {
      const inici = modules.indexOf(`${selector} {`);
      expect(inici, selector).toBeGreaterThan(-1);
      const cos = modules.slice(inici, modules.indexOf('}', inici));
      expect(cos, selector).toContain('repeat(auto-fill, minmax(min(100%, 20rem), 1fr))');
    }
  });
});
