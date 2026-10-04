// @vitest-environment node
/* T6 i T8 (ordre del Mestre, 261004, prompt 261004_0515 §5 i §6) · Qualitat
   del front «boina-publicar»: la boina taronja enllaçada a la pàgina de
   l'autor, la imatge de les targetes del Panell llegida del hero de la seua
   pàgina i el botó Publicar també davall de l'H1. ESLint amb la configuració
   del projecte i zero missatges (avisos inclosos) en tots els fitxers del
   front, i les regles de Pedra Seca que hi apliquen: cap estil en línia i
   cap imatge escrita a mà a la taula del Panell. Els patrons vetats es
   componen a trossos perquè les portes que llegixen src/ no els troben ací
   (patró de control/qualitat.test.js). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const FRONT = [
  'src/sections/control/ControlSection.jsx',
  'src/sections/control/ControlSection.test.jsx',
  'src/sections/control/destinsControl.js',
  'src/sections/control/destinsControl.test.js',
  'src/sections/control/xatCorporatiu.js',
  'src/sections/control/xatCorporatiu.test.jsx',
  'src/sections/control/PublicarDeLaPagina.jsx',
  'src/sections/control/PublicarDeLaPagina.test.jsx',
  'src/sections/control/qualitat.boina.test.js',
  'src/sections/mur/TargetaDelMur.jsx',
  'src/sections/mur/TargetaDelMur.autoria.test.jsx',
  'src/components/universal/EventCard.jsx',
  'src/components/universal/EventCard.test.jsx',
  'src/components/SectionItemCard.jsx',
  'src/components/SectionItemCard.test.jsx',
  'src/sections/mercat/MercatSection.jsx',
  'src/sections/detail/PageDetailSection.jsx',
  'src/sections/detail/PageDetailSection.test.jsx',
  'src/sections/detail/PageDetailSection.publicar.test.jsx',
  'src/sections/detail/elementDeSeccio.js',
  'src/sections/detail/elementDeSeccio.test.js',
  'src/sections/text/TextSection.jsx',
  'src/sections/text/TextSection.test.jsx'
];
const JSX_DE_PRODUCCIO = FRONT.filter((ruta) => ruta.endsWith('.jsx') && !ruta.includes('.test.'));
/* Un atribut d'estil en JSX, amb claus o amb cometes. */
const ESTIL_EN_LINIA = new RegExp(['\\ss', 'tyle=[{"]'].join(''));

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, en tots els fitxers del front', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FRONT.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FRONT.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/control/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('cap estil en línia en el JSX del front', () => {
    // Sonda: el patró troba la forma vetada.
    expect(ESTIL_EN_LINIA.test(` s${'tyle'}={{ marginTop: '3rem' }}`)).toBe(true);
    for (const ruta of JSX_DE_PRODUCCIO) expect([ruta, ESTIL_EN_LINIA.test(llig(ruta))]).toEqual([ruta, false]);
  });

  /* T8 · La taula del Panell no porta cap imatge: la de la targeta és la de
     la seua pàgina. Una ruta d'il·lustració escrita a destinsControl.js seria
     una segona font (la de «El Titi»). */
  test('T8 · destinsControl.js no escriu cap ruta d’imatge', () => {
    const codi = llig('src/sections/control/destinsControl.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(codi).not.toMatch(new RegExp(['\\.', '(jpe?g|png|webp|svg)', '\\b'].join('')));
    expect(codi).not.toMatch(/imatge:\s*['`]/);
  });

  /* T6 · La boina no es resol pel nom que es veu: cap comparació amb el text
     «Sóc de Poble» per a decidir l'enllaç. */
  test('T6 · cap enllaç d’autor decidit comparant el nom «Sóc de Poble»', () => {
    const comparacio = new RegExp(['===?\\s*', "['\"]Sóc de Poble['\"]"].join(''));
    for (const ruta of ['src/sections/mur/TargetaDelMur.jsx', 'src/components/universal/EventCard.jsx', 'src/sections/control/destinsControl.js']) {
      expect([ruta, comparacio.test(llig(ruta))]).toEqual([ruta, false]);
    }
  });
});
