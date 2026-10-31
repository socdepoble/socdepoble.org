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

  /* Ordre del Mestre, 30-10-2026 (/consola, punt 1.1) · La Consola pren
     l'amplària mínima canònica de les targetes (.sdp-card-grid, 360px).
     Derogat EN PART: «20rem» per a la Consola; la Gestoria no canvia. */
  test('la Consola (amb l’amplària canònica de 360px) i el Tauler de la Gestoria usen auto-fill', () => {
    const modules = senseComentaris(FULLS.find((f) => f.ruta === 'css/modules.css').text);
    for (const [selector, columnes] of [
      ['.sdp-card-grid.sdp-consola__graella', 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))'],
      ['.sdp-card-grid.sdp-gestoria-tauler__graella', 'repeat(auto-fill, minmax(min(100%, 20rem), 1fr))']
    ]) {
      const inici = modules.indexOf(`${selector} {`);
      expect(inici, selector).toBeGreaterThan(-1);
      const cos = modules.slice(inici, modules.indexOf('}', inici));
      expect(cos, selector).toContain(columnes);
    }
    const canonica = senseComentaris(FULLS.find((f) => f.ruta === 'css/modules.css').text).match(/\n\.sdp-card-grid \{([^}]*)\}/)[1];
    expect(canonica).toContain('repeat(auto-fill, minmax(min(100%, 360px), 1fr))');
  });
});

/* Ordre del Mestre, 30-10-2026 (/consola, punts 1.1 i 1.2) · Graella i
   targetes de /consola sense lletres òrfenes ni files desquadrades. Es fixa la
   regla escrita (jsdom no fa graelles ni @container); la mesura de veres és
   a l'informe del torn (Chrome a 1920, 1440, 1100, 800 i 375). */
describe('/consola · files de la mateixa alçada i títols sencers', () => {
  const MODULES = () => senseComentaris(FULLS.find((f) => f.ruta === 'css/modules.css').text);
  const cosDe = (css, selector) => {
    const inici = css.indexOf(`${selector} {`);
    return inici < 0 ? null : css.slice(inici + selector.length + 2, css.indexOf('}', inici)).trim();
  };

  test('les targetes d’una fila s’estiren a la més alta i el peu blau baixa al fons, sense height: 100%', () => {
    const css = MODULES();
    expect(cosDe(css, '.sdp-card-grid.sdp-consola__graella')).toMatch(/align-items:\s*stretch;/);
    expect(cosDe(css, '.sdp-consola__graella > .sp-card > .sp-card-footer')).toBe('margin-top: auto;');
    // La targeta porta 32px de marge inferior: amb height: 100% el marge eixiria de la fila.
    expect(css).not.toMatch(/\.sdp-consola__graella > \.sp-card \{[^}]*height:\s*100%/);
    // La canònica no canvia: la resta de graelles de targetes continuen alineades dalt.
    expect(css.match(/\n\.sdp-card-grid \{([^}]*)\}/)[1]).toMatch(/align-items:\s*start;/);
  });

  /* La regla global (la de tota targeta). La previsualització de Connectar
     (.sdp-connectar__previsualitzacio .sp-card .sp-card-title) conserva la
     seua, d'un altre mòdul i fora de l'ordre: la diu l'informe del torn. */
  test('el títol i el subtítol de tota targeta parten amb break-word, mai amb anywhere', () => {
    const css = MODULES();
    expect(cosDe(css, '.sp-card-title,\n  .sp-card-subtitle')).toBe('overflow-wrap: break-word;');
    const ambAnywhere = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , cos]) => /overflow-wrap:\s*anywhere/.test(cos))
      .flatMap(([, sel]) => sel.split(',').map((s) => s.trim()));
    expect(ambAnywhere.filter((s) => /^\.sp-card-(title|subtitle)$/.test(s))).toEqual([]);
    expect(ambAnywhere.filter((s) => /\.sp-card-(title|subtitle)\b/.test(s))).toEqual(['.sdp-connectar__previsualitzacio .sp-card .sp-card-title']);
  });

  /* Gauntlet 261030 (cicle 4, corrector de la Consola; troballa «vinyetes
     lluny del text centrat») · La insígnia de la marca fa de vinyeta: cap
     disc ni sagnat a la llista de problemes de la coberta. La llista
     d'evidències de les pàgines (AvisosMapa) conserva el seu sagnat. */
  test('la llista de problemes de la coberta no porta disc ni sagnat: en les targetes centrades, el disc quedava lluny del text', () => {
    const css = MODULES();
    const cos = cosDe(css, '.sdp-consola__problemes');
    expect(cos).toMatch(/list-style:\s*none;/);
    expect(cos).toMatch(/(^|\s)padding:\s*0;/);
    expect(css.indexOf('.sdp-consola__problemes {')).toBeGreaterThan(css.indexOf('.sdp-consola__evidencies {'));
    expect(cosDe(css, '.sdp-consola__evidencies')).toMatch(/padding:\s*0 0 0 var\(--sdp-space-5\);/);
  });

  test('a la coberta, el nom curt d’una ruta o d’una evidència ocupa una sola línia i acaba en «…» si no hi cap (punt 1.3)', () => {
    const cos = cosDe(MODULES(), '.sdp-consola__problemes .sdp-consola__mono');
    for (const d of ['display: inline-block;', 'max-inline-size: 100%;', 'overflow: hidden;', 'text-overflow: ellipsis;', 'white-space: nowrap;']) {
      expect(cos).toContain(d);
    }
  });

  test('una targeta de la Consola més estreta que la columna canònica dona espai al títol al costat del quadrat', () => {
    const css = MODULES();
    const estreta = css.match(/@container \(max-width: 359px\) \{\s*\.sdp-consola__targeta \.sp-card-calendar-badge \{([^}]*)\}/);
    expect(estreta?.[1]).toMatch(/width:\s*calc\(var\(--sdp-space-12\) \* 2\);/);
    expect(estreta?.[1]).toMatch(/height:\s*calc\(var\(--sdp-space-12\) \* 2\);/);
    const molt = css.match(/@container \(max-width: 325px\) \{\s*\.sdp-consola__targeta \.sp-card-calendar-badge \{([^}]*)\}/);
    expect(molt?.[1]).toMatch(/float:\s*none;/);
    expect(molt?.[1]).toMatch(/margin:\s*0 auto var\(--sdp-space-3\);/);
  });
});
