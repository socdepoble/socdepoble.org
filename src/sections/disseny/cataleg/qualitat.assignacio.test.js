// @vitest-environment node
/* Ordre del Mestre (261007) · «Assignar» des del catàleg Emojis XL · qualitat:
   ESLint amb la configuració del projecte i zero missatges (avisos inclosos)
   sobre cada fitxer que el lot crea o toca, les comprovacions de Pedra Seca
   per text i el bloc CSS nou de modules.css. Patró de
   src/sections/notes/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CATALEG = 'src/sections/disseny/cataleg';

const FITXERS = Object.freeze([
  `${CATALEG}/AssignacioEmoji.jsx`,
  `${CATALEG}/AssignacioEmoji.test.jsx`,
  `${CATALEG}/destinsEmoji.js`,
  `${CATALEG}/destinsEmoji.test.js`,
  `${CATALEG}/detalls/EspecimenEmojisXL.jsx`,
  `${CATALEG}/detalls/EspecimenEmojisXL.test.jsx`,
  `${CATALEG}/qualitat.assignacio.test.js`
]);
const FULL = 'src/css/modules.css';
const MARCA = 'Ordre del Mestre (261007) · ASSIGNAR UN EMOJI DES DEL CATÀLEG';

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '');

/* El bloc @layer que seguix la marca, sencer (claus aparellades). */
function blocDeLaMarca(css) {
  const inici = css.indexOf('@layer components {', css.indexOf(MARCA));
  if (css.indexOf(MARCA) < 0 || inici < 0) return '';
  let profunditat = 0;
  for (let i = inici; i < css.length; i += 1) {
    if (css[i] === '{') profunditat += 1;
    if (css[i] === '}' && --profunditat === 0) return css.slice(inici, i + 1);
  }
  return '';
}
/* Les regles del bloc: [selectors, { propietat: valor }]. */
const regles = (bloc) => [...senseComentaris(bloc).replace(/^@layer components \{/, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selectors, cos]) => [selectors.trim(), Object.fromEntries([...cos.matchAll(/([\w-]+)\s*:\s*([^;]+?)\s*;/g)]
    .map(([, propietat, valor]) => [propietat, valor]))]);

describe('el cens', () => {
  test('tots els fitxers del lot existixen', () => {
    expect(FITXERS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${CATALEG}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca al codi', () => {
  test('fora de proves: cap style=, cap hex, cap :has(), cap localStorage, res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/:has\(/, ':has()'],
      [/localStorage|sessionStorage/, 'persistència fora de config/storage.js'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('cap peça inventada: la pantalla munta PantallaCompleta, Boto i les files del Xat, sense ruta nova', () => {
    const especimen = llig(`${CATALEG}/detalls/EspecimenEmojisXL.jsx`);
    expect(especimen).toMatch(/<PantallaCompleta\b/);
    expect(especimen).toMatch(/usePantallaCompleta\(\)/);
    expect(especimen).toMatch(/<Boto varietat="primari" className="sdp-emojis-xl__assigna"/);
    expect(especimen).not.toMatch(/useNavigate|<Route\b|Dropdown|popover/i);
    /* La pantalla arriba en obrir-la: l'espècimen no la importa en estàtic. */
    expect(especimen).toMatch(/lazyRoute\(\(\) => import\('\.\.\/AssignacioEmoji\.jsx'\)\)/);
    expect(especimen).not.toMatch(/^import .*AssignacioEmoji/m);
    const pantalla = senseComentaris(llig(`${CATALEG}/AssignacioEmoji.jsx`));
    expect(pantalla).toMatch(/className="sdp-xat-fila"/);
    expect(pantalla).toMatch(/className="sdp-xat-seccio"/);
    /* El canal de desar de la nota és el de l'editor, i només per a notes. */
    expect(pantalla.match(/setLocalNoteField\(/g)).toHaveLength(1);
    expect(pantalla).not.toMatch(/saveNoteField|updateNote|PAGE_COPY\[[^\]]+\]\s*=|\.icon\s*=/);
    /* Les pàgines del sistema i la barra lateral, de les seues fonts; les
       eines locals de la Wiki, de la seua funció i només en desenvolupament
       (el literal DEV que Vite fa false: la importació no arriba al build). */
    expect(pantalla).toMatch(/destinsDelSistema\(SYSTEM_PAGES, SECTIONS,/);
    expect(pantalla).toMatch(/import\.meta\.env\.DEV\s*\?\s*import\('\.\.\/\.\.\/wiki-de-poble\/WikiDePobleSection\.jsx'\)/);
    expect(pantalla).not.toMatch(/^import .*WikiDePobleSection/m);
    /* Les carpetes del Bloc, de la mateixa font que la seua columna. */
    expect(senseComentaris(llig(`${CATALEG}/destinsEmoji.js`))).toMatch(/opcionsDeCarpetes\(noteFolders\)/);
  });
});

describe('el bloc CSS nou de modules.css', () => {
  const bloc = blocDeLaMarca(llig(FULL));
  const llista = regles(bloc);

  test('existix i viu dins de @layer components', () => {
    expect(bloc).not.toBe('');
    expect(bloc.startsWith('@layer components {')).toBe(true);
    expect(llista.length).toBeGreaterThan(5);
  });

  test('només classes sdp-, sense :has(), sense niament, sense consultes de contenidor ni media queries', () => {
    const classes = llista.flatMap(([selectors]) => [...selectors.matchAll(/\.([\w-]+)/g)].map(([, classe]) => classe));
    expect(classes.filter((classe) => !classe.startsWith('sdp-'))).toEqual([]);
    expect(bloc).not.toMatch(/:has\(|&|@container|@media|container-type/);
  });

  test('només tokens: cap color cru, cap ombra, espais de l’escala i radis de token', () => {
    const dolentes = [];
    for (const [selectors, declaracions] of llista) {
      for (const [propietat, valor] of Object.entries(declaracions)) {
        const on = `${selectors} { ${propietat}: ${valor} }`;
        if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/.test(valor)) dolentes.push(`${on}: color cru`);
        if (/shadow/.test(propietat)) dolentes.push(`${on}: ombra`);
        if (/^(margin|padding|gap)/.test(propietat)) {
          const peces = valor.split(/\s+/);
          if (!peces.every((peca) => /^(0|auto|var\(--sdp-space-\d+\))$/.test(peca))) dolentes.push(`${on}: espai fora de l’escala`);
        }
        if (/radius/.test(propietat) && !/^var\(--sdp-radi-(s|m|g|xl|pastilla)\)$/.test(valor)) dolentes.push(`${on}: radi`);
        if (/color|background/.test(propietat) && !/^(var\(--sdp-[\w-]+\)|transparent)$/.test(valor)) dolentes.push(`${on}: color sense token`);
      }
    }
    expect(dolentes).toEqual([]);
  });

  test('l’«Assignar» té l’àrea tàctil de --sdp-touch i el cercle de l’emoji actual també', () => {
    const de = (selector) => llista.find(([selectors]) => selectors === selector)?.[1] ?? {};
    expect(de('.sdp-boto.sdp-emojis-xl__assigna')).toMatchObject({ 'min-height': 'var(--sdp-touch)', 'min-width': 'var(--sdp-touch)' });
    expect(de('.sdp-assigna-emoji__actual')).toMatchObject({ 'inline-size': 'var(--sdp-touch)', 'block-size': 'var(--sdp-touch)' });
  });
});
