// @vitest-environment node
/* T7 (ordre del Mestre, prompt 261004_0515) · Qualitat del front «editor»
   (targetes incrustades): ESLint amb la configuració del projecte i zero
   missatges (avisos inclosos) sobre cada fitxer nou o tocat; Pedra Seca per
   text sobre el JSX; el bloc CSS del front a modules.css (capa, Baseline
   2022, tokens, espais de la reixeta) i el token de 360px; i les fronteres
   que fan que les proves amb mocks tancats no peten. Patró de
   src/components/universal/classificacio/qualitat.test.js. Els patrons
   vetats es componen a trossos perquè les portes que llegixen src/ no els
   troben ací. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const DIR = 'src/components/universal/richText/extensions/targetes';
const FITXERS = Object.freeze([
  `${DIR}/TargetesIncrustadesContext.js`,
  `${DIR}/formaDelGrup.js`,
  `${DIR}/formaDelGrup.test.js`,
  `${DIR}/targetesIncrustades.js`,
  `${DIR}/targetesIncrustades.test.js`,
  `${DIR}/TargetaIncrustadaNodeView.jsx`,
  `${DIR}/TargetaIncrustadaNodeView.test.jsx`,
  `${DIR}/DialegTriaTargeta.jsx`,
  `${DIR}/DialegTriaTargeta.test.jsx`,
  `${DIR}/CosAmbTargetes.jsx`,
  `${DIR}/ordresIBarra.test.js`,
  `${DIR}/qualitat.test.js`,
  'src/components/universal/richText/extensions/index.js',
  'src/components/universal/richText/toolbarContract.js',
  'src/components/universal/richText/tiptapToolbarAdapter.js',
  'src/components/universal/DocumentEditor.jsx',
  'src/components/universal/DocumentEditor.targetes.test.jsx',
  'src/components/universal/TargetaViva.jsx',
  'src/components/universal/traduccio/blocsTraduibles.js',
  'src/hooks/useImatgeTargeta.js',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/notes/NotesEditor.targetes.test.jsx',
  'src/sections/detail/detailRichText.jsx',
  'src/sections/detail/detailRichText.test.jsx',
  'src/utils/sanitize.test.js'
]);
const esProva = (f) => /\.test\.jsx?$/.test(f);
const JSX = FITXERS.filter((f) => f.endsWith('.jsx') && !esProva(f));
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
/* Les classes de sempre que un fitxer nou conserva sense el prefix:
   «detail-content» és l'article de renderRichText (detailRichText.jsx), i la
   lectura amb targetes no el pot perdre (Llei del Píxel). */
const EXCEPCIONS_DE_CLASSE = Object.freeze({ [`${DIR}/CosAmbTargetes.jsx`]: Object.freeze(['detail-content']) });

/* El bloc de CSS del front, a modules.css: de la seua capçalera fins al bloc
   del Bancal, que va l'últim. */
function blocT7() {
  const moduls = llig('src/css/modules.css');
  const inici = moduls.indexOf('/* T7 · Ordre del Mestre, 261004 (prompt 261004_0515) · Front «editor».');
  const fi = moduls.indexOf('/* ═══ MODE BANCAL', inici);
  return inici >= 0 && fi > inici ? moduls.slice(inici, fi) : '';
}

describe('el cens', () => {
  test('tots els fitxers del front existixen', () => {
    expect(FITXERS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers del front', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${DIR}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toContain('no-unused-vars');
  }, 120000);
});

describe('Pedra Seca al JSX', () => {
  test('cap style=, cap color cru, cap h1; classes pròpies amb prefix sdp-', () => {
    const h1 = new RegExp(['<h', '1[\\s>]'].join(''));
    for (const fitxer of JSX) {
      const codi = senseComentaris(llig(fitxer));
      expect(/\sstyle=[{"]/.test(codi), `${fitxer}: style=`).toBe(false);
      expect(/#[0-9a-fA-F]{3,8}\b/.test(codi), `${fitxer}: hex`).toBe(false);
      expect(h1.test(codi), `${fitxer}: h1`).toBe(false);
    }
    const nous = [`${DIR}/TargetaIncrustadaNodeView.jsx`, `${DIR}/DialegTriaTargeta.jsx`, `${DIR}/CosAmbTargetes.jsx`];
    for (const fitxer of nous) {
      for (const [, classe] of llig(fitxer).matchAll(/className="([^"]+)"/g)) {
        for (const nom of classe.split(/\s+/)) {
          if (EXCEPCIONS_DE_CLASSE[fitxer]?.includes(nom)) continue;
          expect(nom, `${fitxer}: ${nom}`).toMatch(/^sdp-/);
        }
      }
    }
  });

  /* Revisió del front «editor» (261004) · El className és literal: una
     plantilla («className={`…`}») escapava la comprovació de dalt (el
     prefix de CosAmbTargetes no es mirava). Una expressió només pot triar
     entre cadenes literals, i cada classe porta el prefix sdp-. */
  test('className literal: cap plantilla, i les cadenes d’una expressió també porten sdp-', () => {
    for (const fitxer of [`${DIR}/TargetaIncrustadaNodeView.jsx`, `${DIR}/DialegTriaTargeta.jsx`, `${DIR}/CosAmbTargetes.jsx`]) {
      const codi = senseComentaris(llig(fitxer));
      expect(/className=\{\s*`/.test(codi), `${fitxer}: className amb plantilla`).toBe(false);
      for (const [, expressio] of codi.matchAll(/className=\{([^}]*)\}/g)) {
        const cadenes = [...expressio.matchAll(/'([^']*)'/g)].map((m) => m[1]);
        expect(cadenes.length, `${fitxer}: className={${expressio}} sense cap cadena literal`).toBeGreaterThan(0);
        for (const nom of cadenes.join(' ').split(/\s+/).filter(Boolean)) expect(nom, `${fitxer}: ${nom}`).toMatch(/^sdp-/);
      }
    }
  });

  test('l’article de lectura porta la classe del cos amb targetes en literal, la mateixa de formaDelGrup', () => {
    const constant = llig(`${DIR}/formaDelGrup.js`).match(/export const CLASSE_AMB_TARGETES = '([^']+)';/)?.[1];
    expect(constant).toBe('sdp-amb-targetes');
    expect(llig(`${DIR}/CosAmbTargetes.jsx`)).toContain(`<article className="detail-content ${constant}">`);
  });

  test('tot HTML entra pel sanejador, en la forma literal de tractor-innerhtml', () => {
    for (const fitxer of ['src/sections/detail/detailRichText.jsx', `${DIR}/CosAmbTargetes.jsx`]) {
      const codi = senseComentaris(llig(fitxer));
      const usos = [...codi.matchAll(/__html:\s*([^}]+)\}/g)].map((m) => m[1].trim());
      expect(usos.length, fitxer).toBeGreaterThan(0);
      for (const us of usos) expect(us, fitxer).toMatch(/^sanitizeHtml\(/);
    }
  });
});

describe('fronteres de les proves amb mocks tancats', () => {
  test('DocumentEditor no demana cap símbol nou a «./richText» ni a «./richText/extensions»', () => {
    const codi = llig('src/components/universal/DocumentEditor.jsx');
    const deRichText = codi.match(/import \{([^}]*)\} from '\.\/richText';/)?.[1].split(',').map((s) => s.trim()).filter(Boolean);
    expect(deRichText?.sort()).toEqual(['UniversalRichTextContent', 'UniversalRichTextToolbar', 'useTipTapToolbarAdapter', 'useUniversalRichText']);
    expect(codi).toMatch(/import \{ extensionsRiques \} from '\.\/richText\/extensions';/);
  });

  test('la lectura no arrossega TipTap: formaDelGrup i CosAmbTargetes no l’importen', () => {
    for (const fitxer of [`${DIR}/formaDelGrup.js`, `${DIR}/CosAmbTargetes.jsx`, `${DIR}/TargetesIncrustadesContext.js`]) {
      expect(llig(fitxer), fitxer).not.toMatch(/from '@tiptap\//);
    }
  });

  test('cap peça del front importa una secció (Model B: la font és l’adaptador)', () => {
    for (const fitxer of FITXERS.filter((f) => f.startsWith(DIR) && !esProva(f))) {
      expect(llig(fitxer), fitxer).not.toMatch(/from '[^']*\/sections\//);
    }
  });
});

describe('el CSS del front', () => {
  test('el token de la targeta incrustada: 22.5rem (360px), al costat del de la targeta viva', () => {
    const tokens = llig('src/css/tokens.css');
    expect(tokens).toMatch(/\n {2}--sdp-targeta-incrustada-ample: 22\.5rem;/);
    expect(tokens.indexOf('--sdp-targeta-incrustada-ample')).toBeGreaterThan(tokens.indexOf('--sdp-targeta-viva-ample'));
  });

  test('un sol bloc, dins de @layer components i davant del Bancal', () => {
    const bloc = blocT7();
    expect(bloc.length).toBeGreaterThan(400);
    const net = senseComentaris(bloc).trim();
    expect(net.startsWith('@layer components {')).toBe(true);
    expect(net.endsWith('}')).toBe(true);
  });

  test('Baseline 2022: cap selector de pare, cap consulta de contenidor, flotants left i right', () => {
    const net = senseComentaris(blocT7());
    expect(net.includes([':h', 'as('].join('')), 'selector de pare').toBe(false);
    expect(net.includes(['@cont', 'ainer'].join('')), 'consulta de contenidor').toBe(false);
    expect(/float:\s*inline-/.test(net), 'flotant lògica').toBe(false);
    expect(net).toMatch(/\[data-alineacio="esquerra"\] > \.sdp-targeta \{\s*float: left;/);
    expect(net).toMatch(/\[data-alineacio="dreta"\] > \.sdp-targeta \{\s*float: right;/);
  });

  test('les regles del Mestre: 360px la sola, centrades la parella, la fórmula de .sdp-card-grid la graella', () => {
    const net = senseComentaris(blocT7());
    expect(net).toMatch(/\[data-forma="sola"\] > \.sdp-targeta \{\s*inline-size: min\(100%, var\(--sdp-targeta-incrustada-ample\)\);/);
    expect(net).toMatch(/\[data-forma="parella"\] \{[^}]*justify-content: center;/);
    expect(net).toMatch(/\[data-forma="graella"\] \{[^}]*grid-template-columns: repeat\(auto-fill, minmax\(min\(100%, var\(--sdp-targeta-incrustada-ample\)\), 1fr\)\);/);
    const grid = llig('src/css/modules.css').match(/\.sdp-card-grid \{[^}]*grid-template-columns: repeat\(auto-fill, minmax\(min\(100%, 360px\), 1fr\)\);/);
    expect(grid, 'la fórmula de .sdp-card-grid').toBeTruthy();
    // La parella i la graella deixen enrere qualsevol flotant d'abans.
    expect(net).toMatch(/\[data-forma="parella"\] \{[^}]*clear: both;/);
    expect(net).toMatch(/\[data-forma="graella"\] \{[^}]*clear: both;/);
  });

  test('només tokens: cap color cru, cap ombra, espais 0 o de la reixeta, lletra no per davall del sòl', () => {
    const net = senseComentaris(blocT7());
    expect(/#[0-9a-fA-F]{3,8}\b/.test(net), 'color hex').toBe(false);
    expect(new RegExp(['\\brgba?', '\\(|\\bhsla?\\('].join('')).test(net), 'color funcional').toBe(false);
    expect(net.includes('box-shadow'), 'ombra').toBe(false);
    expect(/--sdp-(?:pedra|primary|secondary)-\d/.test(net), 'token primitiu').toBe(false);
    for (const [, valor] of net.matchAll(/(?:margin|padding|gap)[\w-]*:\s*([^;]+);/g)) {
      expect(valor.trim(), `espai «${valor}»`).toMatch(/^(?:0|var\(--sdp-space-\d+\))(?:\s+(?:0|var\(--sdp-space-\d+\)))*$/);
    }
    for (const [, valor] of net.matchAll(/font-size:\s*([^;]+);/g)) expect(valor.trim()).toBe('var(--sdp-text-meta)');
  });

  test('tota classe pròpia nova del JSX i de l’extensió té regla al bloc del front', () => {
    const bloc = blocT7();
    for (const classe of ['sdp-targetes', 'sdp-targeta', 'sdp-amb-targetes', 'sdp-cos-tros', 'sdp-targeta-incrustada__eines', 'sdp-tria-targeta', 'sdp-tria-targeta__avis']) {
      expect(new RegExp(`\\.${classe}(?![\\w-])`).test(bloc), classe).toBe(true);
    }
  });
});
