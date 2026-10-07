// @vitest-environment node
/* Ordre del Mestre (261007) · «Comentaris = xat» · Qualitat del front del
   menú de Comentar (en privat o en públic): ESLint amb la configuració del
   projecte i zero missatges (avisos inclosos) en tots els fitxers del front,
   i les regles de Pedra Seca que hi apliquen: cap estil en línia, el CSS del
   menú dins de @layer components, només amb tokens i sense :has() ni CSS
   niat (Baseline 2022). I la porta tooling/gates/tractor-cataleg.mjs (C1, C2
   i C3) per a BotoComentar i MenuComentar (revisió R1). Els patrons vetats es
   componen a trossos perquè les portes que llegixen src/ no els troben ací
   (patró de control/qualitat.boina.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const FRONT = [
  'src/components/PedraSeca/hooks/useAccions.js',
  'src/components/PedraSeca/hooks/useAccions.test.jsx',
  'src/components/PedraSeca/hooks/useAccions.comentar.test.jsx',
  'src/components/PedraSeca/hooks/xatSocDePoble.js',
  /* Correcció C9 · la peça de Pedra Seca i el comportament comú dels menús. */
  'src/components/PedraSeca/hooks/useMenuEmergent.js',
  'src/components/PedraSeca/hooks/useMenuEmergent.test.jsx',
  /* Revisió final (261007) · el traductor opcional únic (Comentar, la roda
     dentada i el proveïdor del xat). */
  'src/components/PedraSeca/hooks/useTraductorOpcional.js',
  'src/components/PedraSeca/organismes/Comentar.jsx',
  'src/components/PedraSeca/organismes/textosComentar.js',
  'src/components/PedraSeca/index.js',
  'src/components/universal/traduccio/MenuTraduir.jsx',
  /* Correccions C1, C2 i C4 · les proves adaptades, el Panell i l'espècimen. */
  'src/components/universal/PageFrame.connectar.test.jsx',
  'src/components/universal/UniversalEditorShell.accions.test.jsx',
  'src/apps/lector/AppLector.test.jsx',
  'src/sections/notes/ConnexioDetall.test.jsx',
  'src/sections/profile/PerfilPublicSection.test.jsx',
  'src/sections/control/ControlSection.jsx',
  'src/sections/control/ControlSection.test.jsx',
  'src/sections/control/ControlSection.sessio.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimensUniversals.test.jsx',
  'src/sections/xat/XatSection.test.jsx',
  'src/components/universal/barres/BarraBlava.jsx',
  'src/components/universal/barres/BarraBlava.test.jsx',
  'src/components/universal/barres/BarraBlava.comentar.test.jsx',
  'src/components/universal/barres/qualitat.comentar.test.js',
  'src/components/PedraSeca/organismes/UniversalCard.jsx',
  'src/components/PedraSeca/organismes/UniversalCard.test.jsx',
  'src/components/PedraSeca/organismes/UniversalCard.vinyeta.test.jsx',
  'src/sections/control/xatCorporatiu.js',
  'src/sections/control/xatCorporatiu.test.jsx',
  'src/sections/text/TextSection.jsx',
  'src/sections/text/TextSection.test.jsx',
  'src/sections/mur/TargetaDelMur.jsx',
  'src/sections/mur/TargetaDelMur.xat.test.jsx',
  'src/sections/mur/MurSection.jsx',
  'src/sections/mur/MurSection.xat.test.jsx',
  'src/sections/mur/MurSection.comentar.test.jsx',
  'src/sections/calendari/CalendariSection.jsx',
  'src/app/App.jsx'
];
const JSX_DE_PRODUCCIO = FRONT.filter((ruta) => ruta.endsWith('.jsx') && !ruta.includes('.test.'));
/* Correcció C9 · El botó i el menú de Comentar, la peça de Pedra Seca. */
const PECA = 'src/components/PedraSeca/organismes/Comentar.jsx';
/* Un atribut d'estil en JSX, amb claus o amb cometes. */
const ESTIL_EN_LINIA = new RegExp(['\\ss', 'tyle=[{"]'].join(''));
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

/* El bloc del menú de Comentar a components.css: des del seu títol fins al
   final del seu @layer. */
function blocDelMenu() {
  const css = llig('src/css/components.css');
  const inici = css.indexOf('«COMENTARIS = XAT»: EL MENÚ DE COMENTAR');
  expect(inici).toBeGreaterThan(0);
  const capa = css.indexOf('@layer components {', inici);
  return css.slice(capa, css.indexOf('\n}\n', capa) + 2);
}

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, en tots els fitxers del front', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FRONT.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FRONT.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/components/universal/barres/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('cap estil en línia en el JSX del front', () => {
    expect(ESTIL_EN_LINIA.test(` s${'tyle'}={{ marginTop: '3rem' }}`)).toBe(true);
    for (const ruta of JSX_DE_PRODUCCIO) expect([ruta, ESTIL_EN_LINIA.test(llig(ruta))]).toEqual([ruta, false]);
  });

  test('el CSS del menú: un sol bloc dins de @layer components, només tokens, sense :has() ni CSS niat', () => {
    const bloc = senseComentaris(blocDelMenu());
    expect(bloc.startsWith('@layer components {')).toBe(true);
    expect(bloc).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    expect(bloc).not.toMatch(new RegExp([':h', 'as\\('].join('')));
    expect(bloc).not.toMatch(/box-shadow/);
    expect(bloc).not.toMatch(/&/);
    // Cap mida en brut: només tokens, rem (múltiples de 0,25) i percentatges.
    for (const [, valor] of bloc.matchAll(/(\d*\.?\d+)rem/g)) expect([valor, (Number(valor) * 4) % 1]).toEqual([valor, 0]);
    expect(bloc).not.toMatch(/\d+px/);
    // Cada classe del bloc la pinta el menú de Comentar (C9: la seua peça de Pedra Seca).
    const peca = llig(PECA);
    const classes = new Set([...bloc.matchAll(/\.(sdp-menu-comentar[\w-]*)/g)].map((m) => m[1]));
    expect([...classes].sort()).toEqual(['sdp-menu-comentar', 'sdp-menu-comentar__detall', 'sdp-menu-comentar__nom', 'sdp-menu-comentar__text']);
    for (const classe of classes) expect([classe, peca.includes(classe)]).toEqual([classe, true]);
  });

  /* Pedra Seca §12 (Pla 261004_2045) · En mòbil, un menú emergent fa com a
     molt 300px d'ample: el sostre és el token del Pla 2045
     (--sdp-menu-ample-max), el mateix del calaix de la barra lateral, i no
     un número propi. La línia de davall fa salt (cap nowrap) i el nom, que
     és l'etiqueta, es talla amb punts suspensius. */
  test('§12 · el sostre del menú és --sdp-menu-ample-max (300px); la línia de davall fa salt i el nom es talla', () => {
    const bloc = senseComentaris(blocDelMenu());
    const regla = (selector) => {
      const inici = bloc.indexOf(`${selector} {`);
      expect([selector, inici]).not.toEqual([selector, -1]);
      return bloc.slice(inici, bloc.indexOf('}', inici));
    };
    expect(llig('src/css/tokens.css')).toMatch(/--sdp-menu-ample-max: 300px;/);
    expect(regla('  .sdp-menu-comentar')).toMatch(/max-inline-size: min\(var\(--sdp-menu-ample-max\), calc\(100% - var\(--sdp-space-4\)\)\);/);
    // Cap altre sostre d'ample dins del bloc: el de 300px és l'únic.
    expect(bloc.match(/max-inline-size/g)).toHaveLength(1);
    expect(regla('.sdp-menu-comentar__detall')).not.toMatch(/white-space|text-overflow|overflow/);
    const nom = regla('.sdp-menu-comentar__nom');
    for (const declaracio of ['overflow: hidden;', 'text-overflow: ellipsis;', 'white-space: nowrap;']) expect(nom).toContain(declaracio);
    // El nom accessible és el text sencer: la fila es nomena pel span del nom.
    expect(llig(PECA)).toMatch(/aria-labelledby=\{`\$\{id\}-\$\{via\}`\}[\s\S]*<span id=\{`\$\{id\}-\$\{via\}`\} className="sdp-menu-comentar__nom">/);
  });

  /* Correcció C9 · DRY i capes: un sol comportament de menú emergent
     (useMenuEmergent) per a Traduir i Comentar, i el botó de Comentar és una
     peça de Pedra Seca que la targeta (un organisme de Pedra Seca) i la barra
     importen; cap organisme importa d'una barra concreta. */
  test('C9 · MenuTraduir i MenuComentar fan servir useMenuEmergent i cap porta escoltes pròpies', () => {
    for (const ruta of [PECA, 'src/components/universal/traduccio/MenuTraduir.jsx']) {
      const codi = senseComentaris(llig(ruta));
      expect([ruta, /useMenuEmergent\(\{ files: /.test(codi)]).toEqual([ruta, true]);
      expect([ruta, /addEventListener|getRootNode|stopPropagation|querySelectorAll/.test(codi)]).toEqual([ruta, false]);
    }
    expect(senseComentaris(llig('src/components/PedraSeca/hooks/useMenuEmergent.js'))).toMatch(/getRootNode[\s\S]*stopPropagation[\s\S]*querySelectorAll/);
  });

  test('C9 · UniversalCard i BarraBlava importen BotoComentar de la peça de Pedra Seca; la barra ja no el definix', () => {
    const targeta = llig('src/components/PedraSeca/organismes/UniversalCard.jsx');
    expect(targeta).toMatch(/import \{ BotoComentar \} from '\.\/Comentar\.jsx';/);
    expect(targeta).not.toMatch(/from '[^']*barres\/BarraBlava\.jsx'/);
    const barra = senseComentaris(llig('src/components/universal/barres/BarraBlava.jsx'));
    expect(barra).toMatch(/import \{ BotoComentar \} from '\.\.\/\.\.\/PedraSeca\/organismes\/Comentar\.jsx';/);
    expect(barra).not.toMatch(/function (MenuComentar|BotoComentar)\b|TEXTOS_COMENTAR = /);
  });

  test('les files del menú tenen l’àrea tàctil de les del menú de Traduir (--sdp-touch), que no es toca', () => {
    const bloc = senseComentaris(blocDelMenu());
    expect(bloc).not.toMatch(/min-block-size|block-size:|height/);
    expect(llig('src/css/components.css')).toMatch(/\.sdp-menu-traduir__item \{[^}]*min-block-size: var\(--sdp-touch\);/);
  });
});

/* Revisió R1 · La peça de Comentar és de Pedra Seca, i la porta del catàleg
   (tooling/gates/tractor-cataleg.mjs, pas «Porta Catàleg» de run-portes, que
   el pre-commit executa) vigila tot export PascalCase dels .jsx de
   PedraSeca/: C1, al registre del catàleg; C2, una entrada «viu» s'importa de
   PedraSeca/ en un espècimen modular; C3, cap entrada apunta a un export que
   ja no existix. El hook local no deixa executar la porta des de la shell:
   ací se'n reproduïxen les mateixes expressions, com a
   PedraSeca/qualitat.carrusel.test.js. La C1 la complix
   src/sections/disseny/cataleg/registre.js, amb una entrada per component. */
describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a BotoComentar i MenuComentar', () => {
  const CAT = 'src/sections/disseny/cataleg';
  const NOMS = ['MenuComentar', 'BotoComentar'];
  /* Les mateixes expressions que la porta. */
  const entrades = [...llig(`${CAT}/registre.js`).matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  test('C3 · la peça exporta els dos components, i la façana de Pedra Seca també', () => {
    const exportats = [...llig(PECA).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1]);
    expect(exportats).toEqual(NOMS);
    expect(llig('src/components/PedraSeca/index.js')).toContain("export { BotoComentar, MenuComentar } from './organismes/Comentar.jsx';");
  });

  test('C2 · un espècimen modular els importa de PedraSeca/ i els pinta (EspecimenControlsBarra)', () => {
    /* Sonda: l'expressió de la porta troba els àtoms que ja hi eren. */
    expect(importats.has('IconButton')).toBe(true);
    for (const nom of NOMS) expect([nom, importats.has(nom)]).toEqual([nom, true]);
    const especimen = llig(`${CAT}/detalls/EspecimenControlsBarra.jsx`);
    for (const nom of NOMS) expect([nom, new RegExp(`<${nom}\\b`).test(especimen)]).toEqual([nom, true]);
  });

  test('C1 · tots dos són al registre del catàleg, vius i dins de PedraSeca (sense «fora»)', () => {
    /* Sonda: l'expressió de la porta llig el registre (UniversalCard hi és, viva). */
    expect(entrades.find((e) => e.nom === 'UniversalCard')).toEqual({
      nom: 'UniversalCard', fitxer: 'PedraSeca/organismes/UniversalCard.jsx', estat: 'viu', fora: false
    });
    for (const nom of NOMS) {
      expect(entrades.find((e) => e.nom === nom), `${nom}: falta a ${CAT}/registre.js (revisió R1)`).toEqual({
        nom, fitxer: 'PedraSeca/organismes/Comentar.jsx', estat: 'viu', fora: false
      });
    }
  });
});
