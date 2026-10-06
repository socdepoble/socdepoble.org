// @vitest-environment node
/* W4-08 · Revisió adversarial de C3 (261004) · Qualitat del Panell de
   Control en els fitxers d'esta passada: ESLint amb la configuració del
   projecte i zero missatges (avisos inclosos), i les regles de Pedra Seca que
   el Mestre ha fixat («zero tolerància a la injecció d'estils»).
   La porta design_guard ix en roig per fitxers d'altres actors, i un roig
   global no vigila res: esta prova és el pany propi del Control. Els patrons
   vetats es componen a trossos perquè les portes que llegixen src/ no els
   troben ací (patró de src/sections/plugins/qualitat.test.js). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const CONTROL = [
  'src/sections/control/ControlSection.jsx',
  'src/sections/control/ControlSection.test.jsx',
  /* Onada 2 de la Gestoria (261004) · Els espais «L’empresa» i «La llar». */
  'src/sections/control/ControlSection.espais.test.jsx',
  /* T4 (261006) · «Eixir del poble» dins de SessionProvider, amb les rutes lazy reals. */
  'src/sections/control/ControlSection.sessio.test.jsx',
  'src/sections/control/destinsControl.js',
  'src/sections/control/destinsControl.test.js',
  'src/sections/control/qualitat.test.js'
];
const PANELL = 'src/sections/control/ControlSection.jsx';
/* Un atribut d'estil en JSX, amb claus o amb cometes. */
const ESTIL_EN_LINIA = new RegExp(['\\ss', 'tyle=[{"]'].join(''));
const senseComentarisCss = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(CONTROL.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CONTROL.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/control/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('el Panell no porta cap estil en línia', () => {
    // Sonda: el patró troba la forma que hi havia a «Maquinària i Sistema».
    expect(ESTIL_EN_LINIA.test(` s${'tyle'}={{ marginTop: '3rem' }}`)).toBe(true);
    expect(ESTIL_EN_LINIA.test(llig(PANELL))).toBe(false);
  });

  test('«Maquinària i Sistema» s’aparta amb la classe del full, dins de @layer components i només amb tokens', () => {
    const panell = llig(PANELL);
    expect(panell).toMatch(/<section className="sdp-control-maquinaria">\s*<h2>Maquinària i Sistema<\/h2>/);
    const css = senseComentarisCss(llig('src/css/modules.css'));
    const regla = /\.sdp-control-maquinaria\s*\{([^}]*)\}/g;
    const regles = [...css.matchAll(regla)];
    expect(regles).toHaveLength(1);
    const [{ index, 1: cos }] = regles;
    /* La regla és a primer nivell dins d'un bloc @layer components: des de
       l'última obertura d'eixe bloc fins a la regla, una sola clau oberta. */
    const obertura = css.lastIndexOf('@layer components {', index);
    expect(obertura).toBeGreaterThan(-1);
    const entremig = css.slice(obertura, index);
    expect((entremig.match(/\{/g) || []).length - (entremig.match(/\}/g) || []).length).toBe(1);
    expect(cos.trim()).toBe('margin-block-start: var(--sdp-space-12);');
  });
});
