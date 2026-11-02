// @vitest-environment node
/* IDEA-42 (B7h, marató 261101_2143; corrector, troballa B7h-A04) · La targeta
   16:9 amb punt focal és una EXCEPCIÓ a la regla 1:1 de Pedra Seca (§8),
   validada per la directiva IDEA-42 del Mestre i LIMITADA a les publicacions
   del Mur (els cartells). Com la variant panoràmica del Lector
   (qualitat.panoramica.test.js), sense guarda qualsevol targeta podria passar
   `formaMitja` i deixar de ser quadrada amb totes les portes en verd.
   · Ús exclusiu: fora de la peça que la implementa (UniversalCard.jsx), cap
     fitxer de producció de src/ passa `formaMitja` ni `posicioMitja`, llevat
     de TargetaDelMur.jsx i, quan s'apliquen les peticions del carril, la
     targeta d'acte (EventCard.jsx) i el seu espècimen del catàleg.
   · La classe sp-card-media-container--16-9 només la definix components.css
     i només la posa la peça (mai a mà).
   · El full: l'únic aspect-ratio que no és 1:1 de la família .sp-card-media
     de components.css penja de la classe pròpia i és 16:9.
   Els comentaris no compten: només el codi. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const PECA = 'src/components/PedraSeca/organismes/UniversalCard.jsx';
const FULL = 'src/css/components.css';
const MUR = 'src/sections/mur/TargetaDelMur.jsx';
/* Les peticions del carril (EventCard.diff i EspecimenEnquadrament.diff): permeses, no exigides. */
const PERMESOS = new Set([PECA, MUR, 'src/components/universal/EventCard.jsx', 'src/sections/disseny/cataleg/detalls/EspecimenEnquadrament.jsx']);

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else fitxers.push(ruta);
  }
  return fitxers.sort();
}

/* El codi de producció de src/: sense proves ni fixtures, i sense la Wiki compilada (dades, no codi que pinte). */
const PRODUCCIO = fitxersDe('src').filter((f) => /\.(?:jsx?|mjs|css)$/.test(f)
  && !/\.test\.[cm]?jsx?$/.test(f) && !f.includes('/__fixtures__/') && f !== 'src/data/wikiManifest.js');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const usaForma = (codi) => /(?<![\w$-])(?:formaMitja|posicioMitja)(?![\w$-])/.test(codi);
const usaClasse = (codi) => /(?<![\w-])sp-card-media-container--16-9(?![\w-])/.test(codi);
const quiUsa = (prova) => PRODUCCIO.filter((f) => prova(senseComentaris(llig(f))));

describe('ús exclusiu: les publicacions del Mur', () => {
  test('les sondes: la guarda caça cada forma de passar la prop o d’escriure la classe', () => {
    for (const sonda of ['<UniversalCard formaMitja="16:9" />', '<UniversalCard\n  posicioMitja={punt}', "const props = { formaMitja: '16:9' };", '{...{ formaMitja }}', 'props.posicioMitja']) {
      expect(usaForma(sonda), sonda).toBe(true);
    }
    for (const sonda of ['formaMitjana', 'laFormaMitja_', 'forma-mitja', 'posicioMitjaX']) expect(usaForma(sonda), sonda).toBe(false);
    for (const sonda of ['className="sp-card-media-container sp-card-media-container--16-9"', "'.sp-card-media-container--16-9'"]) expect(usaClasse(sonda), sonda).toBe(true);
    expect(usaClasse('sp-card-media-container--16-9-ampla')).toBe(false);
    expect(senseComentaris('/* formaMitja */\n// posicioMitja\nconst a = 1;')).not.toMatch(/Mitja/);
  });

  test('formaMitja i posicioMitja només els passen el Mur (i, amb les peticions, la targeta d’acte i el seu espècimen)', () => {
    expect(PRODUCCIO.length).toBeGreaterThan(100);
    const usuaris = quiUsa(usaForma);
    expect(usuaris.filter((f) => !PERMESOS.has(f))).toEqual([]);
    expect(usuaris).toEqual(expect.arrayContaining([PECA, MUR]));
  });

  test('la classe 16:9 només la definix el full i només la posa la peça', () => {
    expect(quiUsa(usaClasse)).toEqual([FULL, PECA].sort());
  });
});

/* Les regles d'un full: [selectors, cos], amb els comentaris fora. */
const regles = (css) => [...senseComentaris(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selectors, cos]) => [selectors.split(',').map((s) => s.trim()), cos]);
const proporcio = (cos) => cos.match(/aspect-ratio:\s*([^;]+);/)?.[1].trim().replace(/\s+/g, ' ') ?? null;

describe('el full: el 16:9 penja només de la classe pròpia', () => {
  test('a components.css, tota proporció de .sp-card-media* que no és 1:1 és de sp-card-media-container--16-9 i és 16:9', () => {
    const ambMitja = regles(llig(FULL)).filter(([selectors]) => selectors.some((s) => s.includes('.sp-card-media')));
    expect(ambMitja.length).toBeGreaterThan(1);
    const noQuadrades = ambMitja.filter(([, cos]) => {
      const valor = proporcio(cos);
      return valor !== null && valor !== '1 / 1';
    });
    expect(noQuadrades.length).toBe(1);
    for (const [selectors, cos] of noQuadrades) {
      expect(proporcio(cos), selectors.join(', ')).toBe('16 / 9');
      for (const selector of selectors) expect(selector).toMatch(/\.sp-card-media-container--16-9(?![\w-])/);
    }
  });
});
