// @vitest-environment node
/* Lot BAR (T4 «El Bar») · les portes del repo sobre TOTS els fitxers de
   src/apps/bar (proves incloses):
   · ESLint amb la configuració del projecte i zero missatges (= --max-warnings=0).
   · Pedra Seca per text: cap style=, cap className (la geometria és de les
     peces), cap full CSS propi, cap h1/h2, cap <img> a mà, Baseline 2022.
   · ORDRE DEL MESTRE (261002, sinergies T4/T8): un sol esquelet visual. El
     Bar no definix cap component de graella ni de llista propi: cap <ul>,
     <ol>, <li>, <dl> ni <table> a mà, cap rol de llista o graella, cap
     component amb nom de peça de l'esquelet, cap Rajola ni AppGridShell
     directes; les vistes de catàleg i col·lecció importen l'esquelet comú.
     Una sonda demostra que el detector troba una graella pròpia.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const BASE = 'src/apps/bar';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else fitxers.push(ruta);
  }
  return fitxers.sort();
}

const TOTS = fitxersDe(BASE);
const CODI = TOTS.filter((f) => /\.jsx?$/.test(f));
const esProva = (f) => /\.test\.jsx?$/.test(f);
const PRODUCCIO = CODI.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

/* El detector de graelles i llistes pròpies (ordre del Mestre). Torna els motius. */
const ETIQUETES_LLISTA = new RegExp(`<(?:${['u', 'o', 'd'].map((x) => `${x}l`).join('|')}|li|ta${'ble'})[\\s>]`);
const ROLS_LLISTA = new RegExp(`role=["'{]+(?:${['list', 'listbox', 'grid', 'gridcell', 'row', 'rowgroup', 'tree'].join('|')})["'}]`);
const NOMS_PECA = /\b(?:function|const)\s+((?:Graella|Llista|Linia|Linies|Rajola|Targeta|Targetes|Pastilles|Seccions|Grid|List)[A-Z]\w*)/;
const PECES_BAIXES = /\b(?:Rajola|SeccionsCategoria|AppGridShell)\b/;
function motiusGraellaPropia(codi) {
  const net = senseComentaris(codi);
  const motius = [];
  if (ETIQUETES_LLISTA.test(net)) motius.push('etiqueta de llista o taula a mà');
  if (ROLS_LLISTA.test(net)) motius.push('rol de llista o graella');
  const nom = net.match(NOMS_PECA);
  if (nom) motius.push(`component propi amb nom de peça: ${nom[1]}`);
  const importats = [...net.matchAll(/import\s*\{([^}]*)\}/g)].map((m) => m[1]).join(',');
  if (PECES_BAIXES.test(importats) || especificadors(net).some((e) => /components\/layout\/AppGridShell/.test(e))) {
    motius.push('peça de l’esquelet importada per a fer-ne una pròpia');
  }
  return motius;
}

describe('el cens del lot', () => {
  test('el nucli, el magatzem, l’estat, les vistes, les rutes i les proves hi són', () => {
    for (const esperat of [
      'manifest.js', 'AppBar.jsx', 'rutesBar.js', 'magatzem.js', 'estat/ProveidorBar.jsx', 'estat/textos.js',
      'nucli/comu.js', 'nucli/ids.js', 'nucli/cataleg.js', 'nucli/linia.js', 'nucli/iva.js', 'nucli/comanda.js', 'nucli/cobrament.js',
      'nucli/divisio.js', 'nucli/tiquet.js', 'nucli/torn.js', 'nucli/traspas.js', 'nucli/escandall.js', 'nucli/reposicio.js',
      'nucli/fullTancament.js', 'nucli/llavor.js', 'nucli/sala.js',
      'vistes/Caixa.jsx', 'vistes/Cobrament.jsx', 'vistes/Taules.jsx', 'vistes/Tiquets.jsx', 'vistes/Torn.jsx', 'vistes/Tancament.jsx',
      'vistes/Torns.jsx', 'vistes/Carta.jsx', 'vistes/Ajustos.jsx',
      'qualitat.test.js', 'frontera.test.js', 'rutesBar.test.js', 'magatzem.test.js', 'AppBar.test.jsx'
    ]) expect(TOTS, esperat).toContain(`${BASE}/${esperat}`);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers del lot', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(CODI.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CODI.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${BASE}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('ordre del Mestre: un sol esquelet visual (T4/T8)', () => {
  test('sonda: el detector troba una graella o una llista pròpia', () => {
    const graella = ['function Graella', 'Productes({ productes }) { return <u', 'l>{productes.map((p) => <l', 'i key={p.id}>{p.nom}</l', 'i>)}</u', 'l>; }'].join('');
    expect(motiusGraellaPropia(graella)).toEqual(expect.arrayContaining(['etiqueta de llista o taula a mà', 'component propi amb nom de peça: GraellaProductes']));
    expect(motiusGraellaPropia(['<div ro', 'le="gr', 'id">'].join(''))).toEqual(['rol de llista o graella']);
    expect(motiusGraellaPropia(["import { Raj", "ola } from '../../../components/PedraSeca/index.js';"].join(''))).toContain('peça de l’esquelet importada per a fer-ne una pròpia');
    expect(motiusGraellaPropia('const PlanolSala = () => <ColumnaCataleg articles={[]} />;')).toEqual([]);
  });

  test('cap fitxer de producció del Bar definix una graella, una llista o una taula pròpia', () => {
    const trobats = PRODUCCIO.flatMap((f) => motiusGraellaPropia(llig(f)).map((motiu) => `${f}: ${motiu}`));
    expect(trobats).toEqual([]);
  });

  test('les vistes de catàleg i col·lecció pinten amb les columnes de l’esquelet comú', () => {
    const delEsquelet = /from '\.\.\/\.\.\/comu\/esquelet\/index\.js'/;
    for (const vista of ['Caixa', 'Taules', 'Tiquets', 'Torn', 'Tancament', 'Torns', 'Carta', 'Ajustos']) {
      const codi = llig(`${BASE}/vistes/${vista}.jsx`);
      expect(codi, vista).toMatch(delEsquelet);
      expect(codi, vista).toMatch(/<Columna(?:Cataleg|Colleccio|Colleccions)\b/);
    }
    /* La closca és la de la plataforma i les rutes de caixa, les de l'esquelet. */
    expect(llig(`${BASE}/AppBar.jsx`)).toMatch(/<ClosaAplicacio rutes=\{RUTES_BAR\}/);
    expect(llig(`${BASE}/rutesBar.js`)).toMatch(/rutesCatalegColleccio\(\{ path: 'caixa'/);
  });

  test('l’esquelet i la plataforma només per les seues API públiques', () => {
    const dolents = PRODUCCIO.flatMap((f) => especificadors(llig(f))
      .filter((e) => (e.includes('/plataforma/') && !/\/plataforma\/index\.js$/.test(e)) || (e.includes('/comu/') && !/\/comu\/esquelet\/index\.js$/.test(e)))
      .map((e) => `${f}: ${e}`));
    expect(dolents).toEqual([]);
  });
});

describe('Pedra Seca', () => {
  test('cap full CSS propi: les classes són de les peces', () => {
    expect(TOTS.filter((f) => /\.(?:css|scss|less)$/.test(f))).toEqual([]);
  });

  test('cap style=, cap className, cap <img> a mà, cap :has() ni h1/h2', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/\bclassName=/, 'className'],
      [new RegExp(['<i', 'mg[\\s>]'].join('')), '<img>'],
      [new RegExp([':ha', 's\\('].join('')), ':has()'],
      [new RegExp(['<h', '[12][\\s>]'].join('')), 'h1/h2']
    ];
    const trobats = JSX.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap color en brut ni mesura en píxels al codi', () => {
    const color = /['"`]#[0-9a-fA-F]{3,8}['"`]|\brgba?\(|\bhsla?\(/;
    const pixels = /['"`]\d+px['"`]/;
    for (const f of PRODUCCIO) {
      expect(color.test(llig(f)), `${f}: color`).toBe(false);
      expect(pixels.test(llig(f)), `${f}: px`).toBe(false);
    }
  });

  test('les vistes .jsx només exporten components (Fast Refresh): ganxos i constants van a .js', () => {
    const vistes = JSX.filter((f) => f !== `${BASE}/estat/ProveidorBar.jsx`);
    const dolents = vistes.flatMap((f) => [...llig(f).matchAll(/^export\s+(?:const|function|let)\s+([A-Za-z_]\w*)/gm)]
      .map((m) => m[1]).filter((nom) => !/^[A-Z][a-z]/.test(nom)).map((nom) => `${f}: ${nom}`));
    expect(dolents).toEqual([]);
  });

  test('Baseline 2022: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of PRODUCCIO) expect(vetat.test(llig(f)), f).toBe(false);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00A0, 0x00A0], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const f of TOTS) expect(re.test(llig(f)), f).toBe(false);
  });
});
