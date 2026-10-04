// @vitest-environment node
/* P7-A · Qualitat dels fitxers d'esta passada: les pàgines de plugin
   (src/sections/plugins/, proves incloses) i la portada plegable
   (UniversalPage.jsx i la seua prova). ESLint amb la configuració del
   projecte i zero missatges (l'equivalent de --max-warnings=0), i les regles
   de Pedra Seca per text. Els patrons vetats es componen a trossos perquè les
   portes que llegixen src/ no els troben ací (patró de
   src/apps/plataforma/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const PLUGINS = readdirSync(path.join(ARREL, 'src/sections/plugins'))
  .filter((nom) => /\.jsx?$/.test(nom)).map((nom) => `src/sections/plugins/${nom}`).sort();
const PORTADA = ['src/components/universal/UniversalPage.jsx', 'src/components/universal/UniversalPage.portada.test.jsx'];
const TOTS = [...PLUGINS, ...PORTADA];
const esProva = (f) => /\.test\.jsx?$/.test(f);
const PRODUCCIO = TOTS.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const senseComentarisCss = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

/* Els valors de className d'un JSX: literals i les dues branques d'una ternària. */
function classesDe(codi) {
  return [...codi.matchAll(/className=(?:"([^"]+)"|\{([^}]+)\})/g)]
    .flatMap(([, literal, expressio]) => (literal ? [literal] : [...expressio.matchAll(/'([^']+)'/g)].map((m) => m[1])))
    .flatMap((valor) => valor.split(/\s+/).filter(Boolean));
}

function classesAmbRegla() {
  const classes = new Set();
  for (const nom of readdirSync(path.join(ARREL, 'src/css')).filter((n) => n.endsWith('.css'))) {
    for (const [, selector] of senseComentarisCss(llig(`src/css/${nom}`)).matchAll(/([^{}]+)\{/g)) {
      if (selector.trim().startsWith('@')) continue;
      for (const m of selector.matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) classes.add(m[1]);
    }
  }
  return classes;
}

describe('el cens', () => {
  test('el registre, la pàgina, el destí i les seues proves hi són', () => {
    for (const esperat of ['registrePlugins.js', 'PluginPage.jsx', 'useDestiDelPlugin.js', 'registrePlugins.test.js',
      'PluginPage.test.jsx', 'PluginPage.app.test.jsx', 'qualitat.test.js']) {
      expect(PLUGINS).toContain(`src/sections/plugins/${esperat}`);
    }
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/plugins/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('cap style=, i cada classe dels JSX té regla en un full canònic', () => {
    const canoniques = classesAmbRegla();
    const orfes = [];
    for (const fitxer of JSX) {
      const codi = llig(fitxer);
      expect(/\sstyle=[{"]/.test(codi), `${fitxer}: style=`).toBe(false);
      for (const classe of classesDe(codi)) if (!canoniques.has(classe)) orfes.push(`${fitxer}: .${classe}`);
    }
    expect(orfes).toEqual([]);
  });

  test('les regles de la portada plegable viuen a modules.css, dins de @layer components, només amb tokens', () => {
    const css = llig('src/css/modules.css');
    const inici = css.indexOf('P7-A · PORTADA PLEGABLE');
    expect(inici).toBeGreaterThan(-1);
    const bloc = css.slice(css.indexOf('@layer components {', inici));
    const cos = bloc.slice(0, bloc.indexOf('\n}\n') + 2);
    expect(cos).toContain('.sdp-portada__barra');
    expect(cos).toContain('.sdp-portada__boto');
    expect(cos).not.toMatch(new RegExp(['#[0-9a-fA-F]{3,8}\\b|\\brgba?\\(|!', 'important|transition|animation'].join('')));
    for (const [, valor] of cos.matchAll(/:\s*([^;{}]+);/g)) {
      expect(/\d+(?:px|rem|em)\b/.test(valor), `valor en brut: ${valor}`).toBe(false);
    }
  });
});

describe('higiene', () => {
  test('fora de proves: cap emmagatzematge directe (només storage.js) ni global escrita', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge directe'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('cap HTML cru assignat (tampoc a les proves)', () => {
    const cru = new RegExp(['\\b(?:inner', 'HTML|outer', 'HTML)\\s*=|insertAdjacent', 'HTML|dangerously', 'SetInnerHTML'].join(''));
    for (const fitxer of TOTS) expect(cru.test(llig(fitxer)), fitxer).toBe(false);
  });

  test('el registre és pur: sense React ni xarxa', () => {
    const registre = llig('src/sections/plugins/registrePlugins.js');
    expect(registre).not.toMatch(/from 'react'|fetch\(|import\(/);
  });
});
