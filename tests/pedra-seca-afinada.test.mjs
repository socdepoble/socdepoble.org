/* Decisió del Mestre (30-10-2026), deute CSS «la part segura ara» · La porta
   Pedra Seca s'afina sense afluixar-se. Cada cas porta la cara que ha de
   callar i la que ha de continuar caient:
     · L01 i L06 lligen el codi sense comentaris (límits de l'analitzador, no
       una heurística: l'apòstrof d'un text JSX no obri cap cadena);
     · L02 compta com a declarada la propietat --x que el JSX fixa al node,
       però només si el fitxer penja d'una entrada (mai un mòdul orfe ni una
       fixture);
     · L08 no pren per orfe la fixture de __fixtures__/ que una prova importa.
   El codi sense comentaris conserva llargària i línies: L01 i L06 hi compten
   la línia de l'informe.
   Cada fixture és un arbre sintètic a mkdtemp amb el deute buit: qualsevol
   infracció hi és nova i fa caure la porta. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { codiSenseComentaris } from '../tooling/lib/jsx-class-values.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = path.join(ROOT, 'tooling/brain/tractor-pedra-seca.mjs');

function arbre(t, fitxers) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-pedra-afinada-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  for (const [ruta, text] of Object.entries({ '.agents/deute/.pedra-seca-deute.json': '{}', ...fitxers })) {
    fs.mkdirSync(path.dirname(path.join(arrel, ruta)), { recursive: true });
    fs.writeFileSync(path.join(arrel, ruta), text);
  }
  const run = spawnSync(process.execPath, [PORTA, '--detall'], { cwd: arrel, encoding: 'utf8' });
  return { ...run, noves: run.stdout.split('\n').filter((l) => /^\s+\+ /.test(l)).map((l) => l.trim().slice(2)) };
}
const te = (noves, re) => noves.some((n) => re.test(n));

/* Un text de lectura amb dos apòstrofs i un camí «/perfil/*»: una heurística
   de cadenes hi veu una cadena i després un comentari obert que s'empassa la
   resta del fitxer (TaulerTelemetria.jsx, 30-10-2026: 17 classes perdudes). */
const TEXT_TRAIDOR = "    <p>L'acte i l'altre es compten per ruta (<code>/perfil/*</code>).</p>";

test('L01 · una classe nomenada en un comentari no és una classe; la de codi, encara que vinga darrere d’un text traïdor, sí', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './App.jsx';",
    'src/App.jsx': [
      '/* Abans hi havia <button class="comentada-bloc"> sense cap regla. */',
      '// <div className="comentada-linia">',
      'export const App = () => (',
      '  <div className="viva">',
      TEXT_TRAIDOR,
      '    <span className="orfena-real" />',
      '    {/* <i className="comentada-jsx" /> */}',
      '    <b className={actiu ? \'orfena-expressio\' : \'viva\'} />',
      '  </div>',
      ');'
    ].join('\n'),
    'src/estil.css': '.viva { color: inherit; }'
  });
  assert.equal(run.status, 1, run.stderr);
  assert.ok(te(run.noves, /^\.orfena-real\s+→\s+src\/App\.jsx$/), run.stdout);
  assert.ok(te(run.noves, /^\.orfena-expressio\s+→/), run.stdout);
  for (const comentada of ['comentada-bloc', 'comentada-linia', 'comentada-jsx']) {
    assert.ok(!te(run.noves, new RegExp(`^\\.${comentada}\\b`)), `${comentada}: un comentari no és codi\n${run.stdout}`);
  }
  assert.ok(!te(run.noves, /^\.viva\b/));
});

test('L01 · una classe dins d’una cadena d’HTML (com les de parseMarkdown) continua comptant', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './md.js';",
    'src/md.js': "export const li = (x) => `<li class=\"marca-html\">${x}</li>`; export const b = '<b class=\"marca-simple\">';"
  });
  assert.equal(run.status, 1);
  assert.ok(te(run.noves, /^\.marca-simple\s+→/), run.stdout);
});

test('L06 · document.body en un comentari calla; en codi cau, també darrere d’un text traïdor i dins d’una plantilla', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './Menu.jsx'; import './Vista.jsx';",
    'src/Menu.jsx': [
      '/* Es tanca en clicar fora o amb Escape, sense tocar document.body. */',
      '// document.head tampoc',
      'export const Menu = () => <p>res</p>;'
    ].join('\n'),
    'src/Vista.jsx': [
      'export const Vista = () => (',
      '  <div>',
      TEXT_TRAIDOR,
      '  </div>',
      ');',
      'export const amaga = () => { document.documentElement.dataset.x = `${document.head.childElementCount}`; };'
    ].join('\n')
  });
  assert.equal(run.status, 1);
  assert.ok(!te(run.noves, /^src\/Menu\.jsx\s+→/), run.stdout);
  assert.ok(te(run.noves, /^src\/Vista\.jsx\s+→\s+document\.documentElement$/), run.stdout);
  assert.ok(te(run.noves, /^src\/Vista\.jsx\s+→\s+document\.head$/), run.stdout);
});

test('L06 · una font que no s’analitza fa caure la porta: no s’audita a mitges', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './trencat.js';",
    'src/trencat.js': 'export const x = (; document.body.remove();'
  });
  assert.notEqual(run.status, 0);
  assert.doesNotMatch(run.stdout, /PASSA/);
});

test('L02 · la propietat que el JSX fixa al node (usePropietatsCss, setProperty, també opcional, style) és declarada', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './Graella.jsx';",
    'src/Graella.jsx': [
      "export function Graella({ r, ampliada, n }) {",
      "  usePropietatsCss(r, ampliada ? { '--fixada-hook': n } : {});",
      "  r.current?.style.setProperty('--fixada-opcional', `${n}px`);",
      "  return <div ref={r} style={{ '--fixada-style': n }} />;",
      '}'
    ].join('\n'),
    'src/graella.css': '.g { inline-size: calc(var(--fixada-hook) * var(--fixada-opcional) + var(--fixada-style)); }'
  });
  for (const nom of ['--fixada-hook', '--fixada-opcional', '--fixada-style']) {
    assert.ok(!te(run.noves, new RegExp(`^${nom}\\s+→`)), `${nom}: el JSX la fixa\n${run.stdout}`);
  }
  assert.match(run.stdout, /LLEI_02_TOKEN_FANTASMA\s+0/);
});

test('L02 · una cadena «--x» que no es fixa enlloc (text, mapa, comentari) no declara res', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './Doc.jsx';",
    'src/Doc.jsx': [
      "// usePropietatsCss(r, { '--en-comentari': 1 });",
      "export const MAPA = { '--en-mapa': 'documentació' };",
      "export const Doc = () => <p title=\"--en-text: 1\">{['--en-llista']}</p>;"
    ].join('\n'),
    'src/doc.css': '.d { a: var(--en-comentari); b: var(--en-mapa); c: var(--en-text); d: var(--en-llista); e: var(--enlloc); }'
  });
  assert.equal(run.status, 1);
  for (const nom of ['--en-comentari', '--en-mapa', '--en-text', '--en-llista', '--enlloc']) {
    assert.ok(te(run.noves, new RegExp(`^${nom}\\s+→\\s+src\\/doc\\.css$`)), `${nom}: continua sent fantasma\n${run.stdout}`);
  }
});

/* DCS-CR-01 · Un fitxer que cap entrada no importa no fixa res en cap node en
   execució. La fixture és el cas pitjor: L08 la perdona, i sense esta regla la
   porta passava sencera amb el token fantasma i sense cap rastre. */
test('L02 · un mòdul orfe o una fixture de prova que fan setProperty no declaren cap token', (t) => {
  const casos = {
    'mòdul orfe': { 'src/mort.js': "export const mort = (el) => el.style.setProperty('--fantasma', '1px');" },
    'fixture de prova': {
      'src/a.test.js': "import { fx } from './__fixtures__/fx.js'; test('x', () => fx(document.createElement('p')));",
      'src/__fixtures__/fx.js': "export const fx = (el) => el.style.setProperty('--fantasma', '1px');"
    }
  };
  for (const [cas, fitxers] of Object.entries(casos)) {
    const run = arbre(t, {
      'src/main.jsx': "import css from './css/index.css?inline'; import './App.jsx'; export default css;",
      'src/App.jsx': 'export const App = () => <p>hola</p>;',
      'src/css/index.css': '.a { inline-size: var(--fantasma); }',
      ...fitxers
    });
    assert.equal(run.status, 1, `${cas}\n${run.stdout}`);
    assert.ok(te(run.noves, /^--fantasma\s+→\s+src\/css\/index\.css$/), `${cas}: --fantasma continua sent fantasma\n${run.stdout}`);
  }
});

/* DCS-CR-02 · L01 i L06 busquen en el codi net i compten la línia en el brut:
   si traure els comentaris escurçara el text, l'informe --detall del deute
   conegut mostraria línies falses. */
test('codi sense comentaris · mateixa llargària, mateixos salts i el codi al mateix lloc', () => {
  const text = [
    '/* Un bloc',
    '   de dues línies. */',
    '// <div className="comentada-linia">',
    'export const App = () => (',
    '  <div>',
    TEXT_TRAIDOR,
    '    {/* <i className="comentada-jsx" />',
    '    */}',
    '    <span className="orfena-real" />',
    '  </div>',
    ');'
  ].join('\n');
  const net = codiSenseComentaris(text);
  const salts = (s) => [...s.matchAll(/\n/g)].map((m) => m.index);
  assert.equal(net.length, text.length);
  assert.deepEqual(salts(net), salts(text));
  assert.equal(net.indexOf('orfena-real'), text.indexOf('orfena-real'));
  assert.doesNotMatch(net, /Un bloc|comentada-linia|comentada-jsx/);
});

test('L06 · l’informe --detall del deute conegut dona la línia de veres, encara que hi haja comentaris a dalt', (t) => {
  const run = arbre(t, {
    '.agents/deute/.pedra-seca-deute.json': JSON.stringify({
      LLEI_06_ENCAPSULAMENT: { max: 1, coneguts: ['src/Vista.jsx  →  document.documentElement'] }
    }),
    'src/main.jsx': "import './Vista.jsx';",
    'src/Vista.jsx': [
      '/* Capçalera',
      '   de tres',
      '   línies. */',
      '// i una més',
      "export const Vista = () => <p>L'acte</p>;",
      'export const amaga = () => { document.documentElement.dataset.x = "1"; };'
    ].join('\n')
  });
  assert.equal(run.status, 0, run.stdout);
  assert.match(run.stdout, /^\s+src\/Vista\.jsx:6\s+→\s+document\.documentElement$/m);
});

test('L08 · la fixture que una prova importa no és orfe; la que cap prova no importa i l’ajudant fora de __fixtures__ sí', (t) => {
  const run = arbre(t, {
    'src/main.jsx': 'export const lloc = 1;',
    'src/apps/a.test.js': "import { fals } from './__fixtures__/fals.js'; import { ajuda } from './ajudaProva.js';",
    'src/apps/__fixtures__/fals.js': "import { niat } from './niat/dins.js'; export const fals = niat;",
    'src/apps/__fixtures__/niat/dins.js': 'export const niat = 1;',
    'src/apps/__fixtures__/morta.js': 'export const morta = 1;',
    'src/apps/ajudaProva.js': 'export const ajuda = 1;'
  });
  assert.equal(run.status, 1);
  assert.ok(!te(run.noves, /^src\/apps\/__fixtures__\/fals\.js$/), run.stdout);
  assert.ok(!te(run.noves, /^src\/apps\/__fixtures__\/niat\/dins\.js$/), run.stdout);
  assert.ok(te(run.noves, /^src\/apps\/__fixtures__\/morta\.js$/), run.stdout);
  assert.ok(te(run.noves, /^src\/apps\/ajudaProva\.js$/), run.stdout);
});

/* Pedra Seca, part C (proposta 261031) · Les quatre afinacions de la LLEI 1,
   la de la LLEI 6 i les dues de la LLEI 8. Cada una porta la cara que calla i
   la que continua caient. */
test('L01 · «class=…» dins d’una frase de la pantalla (un atribut de text o el text d’un element) no és cap classe; la del codi, sí', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './Fitxa.jsx';",
    'src/Fitxa.jsx': [
      'export const Fitxa = () => (',
      "  <Especimen descripcio=\"Substituïx la maqueta de <div class='en-atribut'>, que no rebia focus.\">",
      "    <p>Abans hi havia un class='en-text' sense regla.</p>",
      '    <div className="orfena-real" />',
      '  </Especimen>',
      ');'
    ].join('\n')
  });
  assert.equal(run.status, 1);
  assert.ok(te(run.noves, /^\.orfena-real\s+→\s+src\/Fitxa\.jsx$/), run.stdout);
  for (const prosa of ['en-atribut', 'en-text']) assert.ok(!te(run.noves, new RegExp(`^\\.${prosa}\\b`)), `${prosa}: és text\n${run.stdout}`);
});

test('L01 · el full <style> d’un document autònom dona regla a les classes de la mateixa font, i a cap altra', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './Paper.jsx'; import './Altre.jsx';",
    'src/Paper.jsx': [
      "const TINTA = '#000';",
      'export const paper = (t) => `<html><head><style>',
      '.portada { min-height: 245mm; color: ${TINTA}; } .portada-titol { font-size: 36pt; }',
      '@media screen { .portada { min-height: 80vh; } }',
      '</style></head><body><section class="portada"><p class="portada-titol">${t}</p><p class="sense-regla">x</p></section></body></html>`;'
    ].join('\n'),
    'src/Altre.jsx': 'export const Altre = () => <div className="portada" />;'
  });
  assert.equal(run.status, 1);
  assert.ok(!te(run.noves, /^\.portada-titol\b/), run.stdout);
  assert.ok(te(run.noves, /^\.portada\s+→\s+src\/Altre\.jsx$/), `el full del paper no arriba a Altre.jsx\n${run.stdout}`);
  assert.ok(te(run.noves, /^\.sense-regla\s+→\s+src\/Paper\.jsx$/), run.stdout);
});

test('L01 · «language-…» és la convenció de l’HTML per al <code>; una classe semblant que no ho és continua sent òrfena', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './md.js';",
    'src/md.js': "export const bloc = (c) => `<pre class=\"diagrama\"><code class=\"language-mermaid\">${c}</code></pre>`;",
    'src/md.css': '.diagrama { overflow: auto; }'
  });
  assert.equal(run.status, 1);
  assert.ok(!te(run.noves, /^\.language-mermaid\b/), run.stdout);
  const mutant = arbre(t, { 'src/main.jsx': "import './md.js';", 'src/md.js': "export const b = '<code class=\"lang-mermaid\">';" });
  assert.ok(te(mutant.noves, /^\.lang-mermaid\s+→/), mutant.stdout);
});

test('L01 · el deute és la classe: si la primera ocurrència canvia de fitxer, la mateixa òrfena no és nova; una altra, sí', (t) => {
  const run = arbre(t, {
    '.agents/deute/.pedra-seca-deute.json': JSON.stringify({ LLEI_01_CLASSE_ORFENA: { max: 1, coneguts: ['.vella  →  src/A.jsx'] } }),
    'src/main.jsx': "import './B.jsx';",
    'src/B.jsx': 'export const B = () => <div className="vella" />;'
  });
  assert.equal(run.status, 0, run.stdout);
  const mutant = arbre(t, {
    '.agents/deute/.pedra-seca-deute.json': JSON.stringify({ LLEI_01_CLASSE_ORFENA: { max: 2, coneguts: ['.vella  →  src/A.jsx'] } }),
    'src/main.jsx': "import './B.jsx';",
    'src/B.jsx': 'export const B = () => <div className="vella nova" />;'
  });
  assert.equal(mutant.status, 1);
  assert.ok(te(mutant.noves, /^\.nova\s+→\s+src\/B\.jsx$/), mutant.stdout);
  assert.ok(!te(mutant.noves, /^\.vella\b/), mutant.stdout);
});

test('L06 · comparar amb document.body (on és el focus?) no toca el document; penjar-hi, tornar-lo o llegir-ne un fill, sí', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './Focus.jsx'; import './Toca.jsx';",
    'src/Focus.jsx': [
      'export const perdut = (arrel) => { const a = arrel?.activeElement ?? document.activeElement;',
      '  return !a || a === document.body || document.body !== a || a == document.documentElement; };'
    ].join('\n'),
    'src/Toca.jsx': [
      'export const penja = (n) => { document.body.append(n); };',
      'export const capa = () => document.body;',
      'export const fill = (a) => a === document.body.firstChild;'
    ].join('\n')
  });
  assert.equal(run.status, 1);
  assert.ok(!te(run.noves, /^src\/Focus\.jsx\s+→/), run.stdout);
  assert.ok(te(run.noves, /^src\/Toca\.jsx\s+→\s+document\.body$/), run.stdout);
  assert.match(run.stdout, /LLEI_06_ENCAPSULAMENT\s+3\b/);
});

test('L08 · el que importa un config de Vite (codi de build) no és orfe; el que no importa ningú, sí; i no declara cap token', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import css from './css/index.css?inline'; export default css;",
    'src/css/index.css': '.a { inline-size: var(--de-build); }',
    'vite.standalone.config.js': "import { politica } from './src/config/politica.js'; export default { politica };",
    'src/config/politica.js': "import { comu } from './comu.js'; export const politica = (el) => el.style.setProperty('--de-build', comu);",
    'src/config/comu.js': "export const comu = '1px';",
    'src/config/morta.js': 'export const morta = 1;'
  });
  assert.equal(run.status, 1);
  assert.ok(!te(run.noves, /^src\/config\/(?:politica|comu)\.js$/), run.stdout);
  assert.ok(te(run.noves, /^src\/config\/morta\.js$/), run.stdout);
  assert.ok(te(run.noves, /^--de-build\s+→/), `un mòdul de build no fixa res en cap node\n${run.stdout}`);
});

test('L08 · una fixture de build que la prova nomena pel camí és de la prova, carpeta i imports inclosos; una carpeta no nomenada, i un camí fora de __fixtures__, no', (t) => {
  const run = arbre(t, {
    'src/main.jsx': 'export const lloc = 1;',
    'src/apps/modul.test.js': [
      "import path from 'node:path';",
      "const CARPETA = path.join(process.cwd(), 'src/apps/__fixtures__/modulDeProva');",
      "const SOL = 'src/apps/__fixtures__/solt/App.jsx';",
      "const AJUDA = 'src/apps/ajuda.js';"
    ].join('\n'),
    'src/apps/__fixtures__/modulDeProva/manifest.js': "export default { id: 'modul-de-prova' };",
    'src/apps/__fixtures__/modulDeProva/AppModul.jsx': "import { n } from './comptador.js'; export default () => <p>{n}</p>;",
    'src/apps/__fixtures__/modulDeProva/comptador.js': 'export const n = 1;',
    'src/apps/__fixtures__/solt/App.jsx': "import { x } from '../compartit.js'; export default () => <p>{x}</p>;",
    'src/apps/__fixtures__/compartit.js': 'export const x = 1;',
    'src/apps/__fixtures__/oblidat/App.jsx': 'export default () => <p>oblit</p>;',
    'src/apps/ajuda.js': 'export const ajuda = 1;'
  });
  assert.equal(run.status, 1);
  for (const f of ['modulDeProva/manifest.js', 'modulDeProva/AppModul.jsx', 'modulDeProva/comptador.js', 'solt/App.jsx', 'compartit.js'])
    assert.ok(!te(run.noves, new RegExp(`^src/apps/__fixtures__/${f.replace(/[./]/g, (c) => `\\${c}`)}$`)), `${f}\n${run.stdout}`);
  assert.ok(te(run.noves, /^src\/apps\/__fixtures__\/oblidat\/App\.jsx$/), run.stdout);
  assert.ok(te(run.noves, /^src\/apps\/ajuda\.js$/), run.stdout);
});

/* Revisió adversarial (261031) · Les dues relaxacions de la part C no van més
   enllà del que diuen: un srcDoc o un dangerouslySetInnerHTML porten un document
   de veres (la classe s'hi pinta), i el <style> propi d'un document autònom dona
   regla a l'HTML d'eixe document, mai al className del JSX de la mateixa font. */
test('L01 · la classe dins d’un srcDoc o d’un dangerouslySetInnerHTML és una classe; el full propi no cobrix el className del JSX', (t) => {
  const run = arbre(t, {
    'src/main.jsx': "import './Doc.jsx'; import './Paper.jsx';",
    'src/Doc.jsx': [
      'export const Doc = () => <>',
      '  <iframe title="paper" srcDoc="<p class=\'zz-orfena-srcdoc\'>x</p>" />',
      '  <div dangerouslySetInnerHTML={{ __html: "<b class=\'zz-orfena-html\'>x</b>" }} />',
      '  <p title="la maqueta de <div class=\'zz-prosa\'>">text</p>',
      '</>;'
    ].join('\n'),
    'src/Paper.jsx': [
      'export const paper = () => `<html><head><style>.zz-solo { color: red; } .zz-paper { color: red; }</style></head><body><p class="zz-paper">x</p></body></html>`;',
      'export const Paper = () => <div className="zz-solo" />;'
    ].join('\n')
  });
  assert.equal(run.status, 1);
  assert.ok(te(run.noves, /^\.zz-orfena-srcdoc\b/), run.stdout);
  assert.ok(te(run.noves, /^\.zz-solo\s+→\s+src\/Paper\.jsx$/), `el className del JSX no el cobrix el full del paper\n${run.stdout}`);
  assert.ok(!te(run.noves, /^\.zz-paper\b/), run.stdout);
  assert.ok(!te(run.noves, /^\.zz-prosa\b/), run.stdout);
});
