// @vitest-environment node
/* Onada 8 (261009) · Front 8D: fantasmes i codi mort, amb la Llei del Píxel.
   Esta porta guarda el que el front ha deixat net:
   · cap node buit i sense atributs (<div />, <div></div>, <span />…) als
     components de producció de src: el de PageDetailSection i el de l'estat
     de càrrega de PoblesSection eren el rastre d'un indicador sense estil;
   · cap <div> nu al voltant d'un p.sp-card-text: CardBody (UniversalCard)
     ja l'embolcalla amb div.sp-card-text, i els marges es fusionen igual;
   · zero no-unused-vars a tot src. Als fitxers de producció, la regla va
     sense el perdó de `React` que posa eslint.config.js:36 (vegeu
     SENSE_PERDO_DE_REACT); a les proves, tal com la configura el projecte.
     El pre-commit ja passa el linter, però els commits d'esta onada es fan
     amb --no-verify: sense esta porta, un import orfe entraria sense que cap
     prova ho diguera.
   Viu al costat del primer fantasma llevat (PageDetailSection). */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const SRC = path.join(ARREL, 'src');

const recorre = (dir) => readdirSync(dir).flatMap((nom) => {
  const ple = path.join(dir, nom);
  return statSync(ple).isDirectory() ? recorre(ple) : [ple];
});
const esProva = (f) => /\.test\.[mc]?jsx?$/.test(f) || f.includes(`${path.sep}__fixtures__${path.sep}`);
/* Només els components (.jsx): els .js de contingut porten HTML de la Wiki i
   de PAGE_COPY, que és text i no marcatge de React. */
const COMPONENTS = recorre(SRC).filter((f) => f.endsWith('.jsx') && !esProva(f));
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const rel = (f) => path.relative(ARREL, f);

/* Un node buit i sense cap atribut: no pinta res, no es pot estilar sense
   una regla estructural i no el pot trobar cap prova. */
const NODE_BUIT = /<(div|span|p|section)\s*\/>|<(div|span|p|section)>\s*<\/\2>/;
const EMBOLCALL_DEL_COS = /<div>\s*<p className=["']sp-card-text["']/;

describe('fantasmes', () => {
  test('les sondes veuen el que han de vore', () => {
    expect(NODE_BUIT.test('<div />')).toBe(true);
    expect(NODE_BUIT.test('<div>\n  </div>')).toBe(true);
    expect(NODE_BUIT.test('<span></span>')).toBe(true);
    expect(NODE_BUIT.test('<div className="divider-major" />')).toBe(false);
    expect(NODE_BUIT.test('<div><p>Text</p></div>')).toBe(false);
    expect(EMBOLCALL_DEL_COS.test('<div>\n  <p className="sp-card-text">{x}</p>\n</div>')).toBe(true);
    expect(EMBOLCALL_DEL_COS.test('<p className="sp-card-text">{x}</p>')).toBe(false);
  });

  test('cap node buit i sense atributs als components de producció', () => {
    expect(COMPONENTS.length).toBeGreaterThan(100);
    const trobats = COMPONENTS.filter((f) => NODE_BUIT.test(senseComentaris(readFileSync(f, 'utf8')))).map(rel);
    expect(trobats).toEqual([]);
  });

  test('cap <div> nu al voltant del text d’una targeta', () => {
    const trobats = COMPONENTS.filter((f) => EMBOLCALL_DEL_COS.test(senseComentaris(readFileSync(f, 'utf8')))).map(rel);
    expect(trobats).toEqual([]);
  });
});

/* El perdó de `React` (varsIgnorePattern '^React$', eslint.config.js:36) és
   del runtime clàssic de JSX, on cada JSX necessitava React a l'abast. Ací el
   runtime és l'automàtic (vite.config.js:47, react() sense opcions), i un
   `import React` que ningú no usa és codi mort com qualsevol altre: el 261009
   n'hi havia 26 que ni ESLint ni llevar-imports-orfes podien vore. Als fitxers
   de producció la porta passa la mateixa regla sense eixe perdó. Les proves
   es queden amb la configuració del projecte: el seu React sobrant no arriba
   a cap paquet. Llevar el perdó per a tothom és canviar eslint.config.js, i
   això ho decidix MarIA. Les opcions van explícites: amb només la gravetat,
   la configuració plana hereta les d'abans, i el perdó es quedaria. */
const SENSE_PERDO_DE_REACT = {
  files: ['src/**/*.{js,jsx,mjs}'],
  ignores: ['**/*.test.*', '**/__fixtures__/**'],
  rules: { 'no-unused-vars': ['warn', { vars: 'all' }] }
};

describe('codi mort', () => {
  test('zero no-unused-vars a tot src, i cap fitxer que ESLint no puga llegir', async () => {
    // Sense comentaris de configuració: un eslint-disable no pot amagar un orfe.
    const eslint = new ESLint({ cwd: ARREL, overrideConfig: SENSE_PERDO_DE_REACT, allowInlineConfig: false });
    const orfes = async (codi, fitxer) => (await eslint.lintText(codi, { filePath: path.join(SRC, fitxer) }))[0]
      .messages.filter((m) => m.ruleId === 'no-unused-vars').map((m) => m.line);
    /* Les sondes van primer: si la regla deixara de vore els orfes, el cens
       de baix eixiria verd sense haver comprovat res. Un import orfe, un React
       orfe i una variable sense ús es veuen; un React usat només en JSX, no; i
       a les proves el perdó del projecte continua. */
    expect(await orfes('import React from "react";\nimport { orfe } from "./res.js";\nconst sobrant = 1;\n', 'sections/detail/sonda.js')).toEqual([1, 2, 3]);
    expect(await orfes('import React from "react";\nexport const A = () => <React.Fragment>x</React.Fragment>;\n', 'sections/detail/sonda.jsx')).toEqual([]);
    expect(await orfes('import React from "react";\n', 'sections/detail/sonda.test.jsx')).toEqual([]);
    const resultats = await eslint.lintFiles(['src/**/*.{js,jsx,mjs}']);
    expect(resultats.length).toBeGreaterThan(1000);
    const missatges = resultats.flatMap((r) => r.messages
      .filter((m) => m.fatal || m.ruleId === 'no-unused-vars')
      .map((m) => `${rel(r.filePath)}:${m.line} [${m.ruleId || 'fatal'}] ${m.message}`));
    expect(missatges).toEqual([]);
  }, 120000);
});
