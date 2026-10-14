// @vitest-environment node
/* Les portes del repo aplicades als fitxers de la UI de la porta d'aprovació:
   ESLint amb la configuració del projecte (zero avisos), cap classe sense
   regla al full canònic i cap token inventat al bloc CSS dels tractors. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARRIL = 'src/sections/tractors';
const CODI = ['registreTractors.js', 'useTractors.js', 'PanellTractors.jsx', 'DialegAprovacio.jsx'].map((f) => `${CARRIL}/${f}`);
const PROVES = [
  'registreTractors.test.js', 'useTractors.test.jsx', 'PanellTractors.test.jsx', 'PanellTractors.produccio.test.js',
  'DialegAprovacio.test.jsx', 'qualitat.test.js'
].map((f) => `${CARRIL}/${f}`);
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const MARCA = '/* ── TRACTORS (261002) ── */';
function blocTractors() {
  const css = llig('src/css/modules.css');
  const inici = css.indexOf(MARCA);
  expect(inici, 'falta el bloc dels tractors a modules.css').toBeGreaterThan(-1);
  expect(css.indexOf(MARCA, inici + 1)).toBe(-1);
  const obri = css.indexOf('{', inici);
  let profunditat = 0;
  for (let i = obri; i < css.length; i++) {
    if (css[i] === '{') profunditat += 1;
    if (css[i] === '}') profunditat -= 1;
    if (profunditat === 0) return css.slice(inici, i + 1);
  }
  throw new Error('El bloc dels tractors no es tanca.');
}

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, als fitxers del carril', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles([...CODI, ...PROVES].map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CODI.length + PROVES.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARRIL, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 60000);
});

describe('CSS del carril', () => {
  test('és una sola capa components, al final del full, amb només tokens declarats i sense fallback', () => {
    const bloc = blocTractors();
    expect(bloc).toMatch(/^\/\* ── TRACTORS \(261002\) ── \*\/\n@layer components \{/);
    const tokens = llig('src/css/tokens.css');
    const usats = [...new Set([...bloc.matchAll(/var\((--[\w-]+)([^)]*)\)/g)].map((m) => {
      expect(m[2], `fallback a ${m[1]}`).toBe('');
      return m[1];
    }))];
    expect(usats.filter((t) => !new RegExp(`${t}\\s*:`).test(tokens))).toEqual([]);
    expect(bloc).not.toMatch(/box-shadow|--sdp-text-meta|5[68]px|\{\s*\}/);
  });

  test('tota classe del JSX del carril té regla al bloc dels tractors o al full canònic', () => {
    const bloc = blocTractors();
    const canonic = ['modules.css', 'components.css', 'sdp.css', 'layout.css', 'base.css', 'index.css', 'utilities.css', 'wiki.css']
      .map((f) => { try { return llig(`src/css/${f}`); } catch { return ''; } }).join('\n');
    for (const fitxer of CODI.filter((f) => f.endsWith('.jsx'))) {
      for (const [, valor] of llig(fitxer).matchAll(/className="([^"]+)"/g)) {
        for (const classe of valor.split(/\s+/)) {
          const propia = classe.startsWith('sdp-tractors-');
          expect(propia || /^sdp-/.test(classe), `${fitxer}: ${classe} sense prefix del carril`).toBe(true);
          expect((propia ? bloc : canonic).includes(`.${classe}`), `${fitxer}: .${classe} no té regla`).toBe(true);
        }
      }
    }
  });
});

describe('higiene del codi', () => {
  test('cap API ni patró vetat per les portes', () => {
    // Alguns patrons es componen a trossos: si no, les portes que llegixen src/ els trobarien ací.
    const vetats = [
      [/\binner(?:HTML)\b|\bouter(?:HTML)\b|insertAdjacent(?:HTML)/, 'HTML cru'],
      [new RegExp(['local', 'Storage|session', 'Storage'].join('')), 'emmagatzematge del navegador'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [/\sstyle=\{/, 'style= al JSX'],
      [/from '@\//, 'import amb @/'],
      [new RegExp(['<h', '1[\\s>]'].join('')), 'h1'],
      [new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors'].join(''), 'i'), 'backend'],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/\.(?:findLast|toSorted|toReversed|groupBy)\(|withResolvers/, 'fora del Baseline']
    ];
    for (const fitxer of CODI) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
  });

  test('l\'HTML de la fitxa només entra per sanitizeHtml', () => {
    const panell = llig(`${CARRIL}/PanellTractors.jsx`);
    const usos = [...panell.matchAll(/dangerouslySetInnerHTML=\{\{ __html: ([^}]+) \}\}/g)].map((m) => m[1]);
    expect(usos).toEqual(['sanitizeHtml(parseMarkdown(rebaixaTitols(triat.fitxa)))']);
  });
});
