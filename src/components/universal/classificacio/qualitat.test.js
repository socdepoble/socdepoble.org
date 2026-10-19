// @vitest-environment node
/* T7B · qualitat del lot «Editor, metadades i proves roges del Bloc»: ESLint
   amb la configuració del projecte i zero missatges (l'equivalent de
   --max-warnings=0) sobre cada fitxer nou o tocat pel lot, proves incloses,
   i les comprovacions de Pedra Seca per text sobre el JSX i el bloc de CSS
   del lot. Patró: src/sections/gestoria/qualitat.test.js. Els patrons vetats
   es componen a trossos perquè les portes que llegixen src/ no els troben ací. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const FITXERS = Object.freeze([
  'src/components/PedraSeca/atoms/controls.jsx',
  'src/components/PedraSeca/atoms/controls.test.jsx',
  'src/components/universal/barres/BarraBlava.jsx',
  'src/components/universal/barres/BarraBlava.test.jsx',
  'src/components/universal/UniversalEditorShell.jsx',
  'src/components/universal/UniversalEditorShell.accions.test.jsx',
  'src/components/universal/UniversalEditorShell.autodesament.test.jsx',
  'src/components/universal/classificacio/BotoneraClassificacio.jsx',
  'src/components/universal/classificacio/DialegCarpeta.jsx',
  'src/components/universal/classificacio/DialegValors.jsx',
  'src/components/universal/classificacio/Classificacio.test.jsx',
  'src/components/universal/classificacio/qualitat.test.js',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/notes/NotesEditor.test.jsx',
  'src/sections/notes/NotesDataContext.test.jsx',
  'src/sections/notes/NotesDataContext.amfitrio.test.jsx',
  /* Bloc 3.8 del Gauntlet (261016) · La graella del catàleg Emojis XL al
     DialegEmoticona. */
  'src/components/universal/classificacio/DialegEmoticona.jsx',
  'src/components/universal/classificacio/GraellaEmojis.jsx',
  'src/components/universal/classificacio/GraellaEmojis.test.jsx',
  'src/components/universal/classificacio/PaginaEmojis.jsx',
  'src/components/universal/classificacio/PaginaEmojis.test.jsx',
  /* Bloc 3.9 del Gauntlet (261016) · L'«Edició avançada» de la closca i del
     DocumentEditor, «Nota sense títol» i l'esvaïment de la plantilla. */
  'src/components/universal/DocumentEditor.jsx',
  'src/components/universal/DocumentEditor.edicioAvancada.test.jsx',
  'src/components/universal/UniversalEditorShell.edicioAvancada.test.jsx',
  'src/components/universal/richText/useUniversalRichText.js'
]);
const esProva = (f) => /\.test\.jsx?$/.test(f);
const JSX = FITXERS.filter((f) => f.endsWith('.jsx') && !esProva(f));
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

/* El bloc de CSS del lot, a modules.css: de la seua capçalera fins a la regla
   següent, que no és seua. */
function blocT7() {
  const moduls = llig('src/css/modules.css');
  const inici = moduls.indexOf('/* T7 (P8, ordre del Mestre)');
  const fi = moduls.indexOf('.sdp-bloc-icon,', inici);
  return inici >= 0 && fi > inici ? moduls.slice(inici, fi) : '';
}

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers del lot', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/components/universal/classificacio/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toContain('no-unused-vars');
  }, 120000);
});

describe('Pedra Seca', () => {
  test('JSX del lot: cap style= ni h1', () => {
    const h1 = new RegExp(['<h', '1[\\s>]'].join(''));
    for (const fitxer of JSX) {
      const codi = llig(fitxer);
      expect(/\sstyle=[{"]/.test(codi), `${fitxer}: style=`).toBe(false);
      expect(h1.test(codi), `${fitxer}: h1`).toBe(false);
    }
  });

  test('CSS del lot: només tokens, cap color cru, cap :has(), cap ombra, espais de la reixeta', () => {
    const bloc = blocT7();
    expect(bloc.length).toBeGreaterThan(200);
    const net = bloc.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(/#[0-9a-fA-F]{3,8}\b/.test(net), 'color hex').toBe(false);
    expect(new RegExp(['\\brgba?', '\\(|\\bhsla?\\('].join('')).test(net), 'color funcional').toBe(false);
    expect(net.includes([':h', 'as('].join('')), ':has()').toBe(false);
    expect(net.includes('box-shadow'), 'ombra').toBe(false);
    expect(/--sdp-(?:pedra|primary|secondary)-\d/.test(net), 'token primitiu').toBe(false);
    // Marges, farcits i buits: 0 o un token d'espai.
    for (const [, valor] of net.matchAll(/(?:margin|padding|gap)[\w-]*:\s*([^;]+);/g)) {
      expect(valor.trim(), `espai «${valor}»`).toMatch(/^(?:0|var\(--sdp-space-\d+\))(?:\s+(?:0|var\(--sdp-space-\d+\)))*$/);
    }
    // L'àrea tàctil de la píndola és la del sistema.
    expect(net).toContain('min-height: var(--sdp-touch);');
    expect(net).toContain('min-width: var(--sdp-touch);');
  });

  test('tota classe pròpia nova del JSX té regla al bloc del lot', () => {
    const bloc = blocT7();
    for (const classe of ['sdp-classificacio-pindola', 'sdp-classificacio-pindola__text', 'sdp-classificacio-carpeta--nivell-1', 'sdp-classificacio-carpeta--nivell-2']) {
      expect(new RegExp(`\\.${classe}(?![\\w-])`).test(bloc), classe).toBe(true);
    }
    // Les píndoles reutilitzen les classes de lectura: no n'inventen cap de color.
    // T7B-V2 · La carpeta, sdp-badge-system (sdp-universal-page §4.1).
    const botonera = llig('src/components/universal/classificacio/BotoneraClassificacio.jsx');
    for (const badge of ['sdp-badge-system', 'sdp-badge-category', 'sdp-badge-tag']) {
      expect(botonera).toContain(`'${badge}'`);
      expect(llig('src/css/modules.css')).toMatch(new RegExp(`\\.${badge}\\s*\\{`));
    }
    expect(botonera).not.toContain(`'sdp-badge-neutral'`);
  });

  /* T7B-V1 · Un botó per grup: les píndoles hi passen a una altra fila (no a
     un altre botó de 44 px), separades pel pas més curt de la reixeta. */
  test('el botó d’un grup ajunta les seues píndoles en files (T7B-V1)', () => {
    const net = blocT7().replace(/\/\*[\s\S]*?\*\//g, '');
    const regla = net.match(/\.sdp-classificacio-pindola\s*\{([^}]*)\}/);
    expect(regla, 'regla .sdp-classificacio-pindola').toBeTruthy();
    const declaracions = Object.fromEntries(regla[1].split(';').map((d) => d.split(':').map((t) => t.trim())).filter(([p, v]) => p && v));
    expect(declaracions).toMatchObject({
      display: 'inline-flex',
      'flex-wrap': 'wrap',
      gap: 'var(--sdp-space-1)',
      'min-height': 'var(--sdp-touch)',
      'min-width': 'var(--sdp-touch)',
      'max-width': '100%'
    });
  });

  /* T7B-R2 · Un valor llarg s'escurça amb punts suspensius. El text-overflow
     només s'aplica a l'element que retalla el seu propi text: el del valor,
     que a més ha de poder encongir-se dins de la píndola (min-width: 0). */
  test('el valor llarg d’una píndola s’escurça amb punts suspensius (T7B-R2)', () => {
    const net = blocT7().replace(/\/\*[\s\S]*?\*\//g, '');
    const regla = net.match(/\.sdp-classificacio-pindola__text\s*\{([^}]*)\}/);
    expect(regla, 'regla .sdp-classificacio-pindola__text').toBeTruthy();
    const declaracions = Object.fromEntries(regla[1].split(';').map((d) => d.split(':').map((t) => t.trim())).filter(([p, v]) => p && v));
    expect(declaracions).toMatchObject({
      'min-width': '0',
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap'
    });
  });

  test('cap avís en línia de l’editor sobreviu al CSS ni al JSX (T7 · P7)', () => {
    expect(llig('src/css/modules.css').includes('.sdp-avis-edicio')).toBe(false);
    expect(llig('src/components/universal/UniversalEditorShell.jsx').includes('sdp-avis-edicio')).toBe(false);
  });
});
