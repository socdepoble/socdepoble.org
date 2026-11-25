/* CR-01 (Gauntlet de la integració v1.2.25) · El full del tiquet tèrmic d'El Bar i de l'arbre A4 de Genealogia (Lot G9)
   ja no viatja a l'arrencada del paquet de WordPress. diferit-apps-plataforma.css l'importa BarraApp.jsx, que és al tros
   d'entrada: les 15 regles hi sumaven 1.477 B d'arrencada estàtica i, amb credencials de llargària de producció, el
   pressupost de pesDelNucli.test.js passava del sostre (1.591.285 B contra 1.591.000 B). Ara viuen, amb els mateixos
   cossos, a diferit-impressio-apps.css, i l'adopta ContenidorApp (RutaApps.jsx, tros diferit de /app/*) sobre la caixa
   .sdp-app-contenidor, just darrere de diferit-apps-plataforma.css. L'àncora és .sdp-app-contenidor__cos, el cos de la
   mateixa caixa (mateixa especificitat), perquè la porta de vocabulari (css-diferit-04, tractor-vocabulari-diferits)
   vol que cada full diferit tinga alguna classe que només declaren fulls diferits. Les apps no l'importen:
   la llista blanca de Model B (fronteres.test.js) no canvia. Lligen les fonts, sense build, com qualitat.test.js; el
   pes de veres el mesura pesDelNucli.test.js sobre el build. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const IMPORTA_EL_FULL = /diferit-impressio-apps\.css\?inline/;

function fontsDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fontsDe(ruta));
    else if (/\.(?:[cm]?js|jsx)$/.test(entrada.name) && !/\.test\.[cm]?jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers;
}

describe('CR-01 · el full d’impressió de les apps és diferit', () => {
  test('diferit-apps-plataforma.css, que BarraApp.jsx porta a l’arrencada, ja no té cap regla del tiquet ni de l’arbre', () => {
    expect(llig('src/apps/plataforma/BarraApp.jsx')).toMatch(/diferit-apps-plataforma\.css\?inline/);
    expect(llig('src/css/diferit-apps-plataforma.css')).not.toMatch(/data-sdp-(?:tiquet|arbre)/);
  });

  test('diferit-impressio-apps.css porta les regles dins de @layer components, també les d’impressió', () => {
    const css = llig('src/css/diferit-impressio-apps.css');
    expect(css).toMatch(/^@layer components \{$/m);
    for (const selector of [
      '[data-sdp-tiquet-termic]', '[data-sdp-tiquet-termic="58mm"]', '[data-sdp-tiquet-termic="80mm"]', '[data-sdp-tiquet-controls]',
      '[data-sdp-arbre="llenc"]', '[data-sdp-arbre="branques"]', '[data-sdp-arbre="node"]', '[data-sdp-arbre="caixa"]',
      '[data-sdp-arbre="nom"]', '[data-sdp-arbre="meta"]'
    ]) expect(css, selector).toContain(`.sdp-app-contenidor__cos ${selector} {`);
    expect(css).not.toMatch(/\.sdp-app-contenidor \[/);
    expect(css.match(/@media print \{/g)).toHaveLength(1);
  });

  test('només RutaApps.jsx l’importa, i l’adopta sobre .sdp-app-contenidor just darrere de diferit-apps-plataforma.css', () => {
    expect(fontsDe('src').filter((rel) => IMPORTA_EL_FULL.test(llig(rel)))).toEqual(['src/apps/plataforma/RutaApps.jsx']);
    const ruta = llig('src/apps/plataforma/RutaApps.jsx');
    expect(ruta).toMatch(/useFullDiferit\(contenidorAppsRef, 'apps-plataforma', cssAppsPlataforma\);\n(?:\s*(?:\/\*[\s\S]*?\*\/)\s*\n)?\s*useFullDiferit\(contenidorAppsRef, 'impressio-apps', cssImpressioApps\);/);
    expect(ruta).toContain('<div ref={contenidorAppsRef} className="sdp-app-contenidor"');
    expect(ruta).toContain('<div className="sdp-app-contenidor__cos">');
    expect(llig('src/css/diferit-apps-plataforma.css')).toMatch(/^\.sdp-app-contenidor__cos \{$/m);
    /* Cap app no importa el full ni l'adopta pel seu compte (Model B). */
    for (const rel of fontsDe('src/apps').filter((r) => !r.startsWith('src/apps/plataforma/'))) {
      expect(llig(rel), rel).not.toMatch(/from\s+['"][^'"]*diferit-impressio-apps|\buseFullDiferit\s*\(/);
    }
  });
});
