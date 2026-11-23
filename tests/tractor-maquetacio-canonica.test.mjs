import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditaFonts, auditaMaquetacioConcurrent, EXCEPCIONS } from '../tooling/gates/tractor-maquetacio-canonica.mjs';

const page = body => `import { UniversalPage } from '../components/UniversalPage.jsx'; export function Vista(){return <UniversalPage>${body}</UniversalPage>}`;
const audit = (source, more = {}) => auditaFonts({ 'src/sections/Vista.jsx': source, ...more });
const codes = result => result.issues.map(issue => issue.code);

test('H3/H4 i subtítol de capçalera no són children H2', () => {
  assert.equal(audit(page('<section><h3>Secció</h3><h4>Fitxa</h4><p>Cos</p></section>').replace('<UniversalPage>', '<UniversalPage subtitle={<h2>Capçalera</h2>}>')).ok, true);
});
test('H2 directe dins de UniversalPage falla amb localització', () => {
  const result = audit(page('<h2>Secció</h2>'));
  assert.deepEqual(codes(result), ['MC2']);
  assert.equal(result.issues[0].file, 'src/sections/Vista.jsx');
  assert.equal(result.issues[0].line, 1);
});
test('H2 fora de UniversalPage conserva la seua jerarquia pròpia', () => {
  assert.equal(audit('export function Entrada(){return <dialog><h2>Confirmar</h2></dialog>}').ok, true);
});
test('comentaris, atributs i text escapat no són etiquetes JSX', () => {
  assert.equal(audit(page('<p title="<h2>literal</h2>">&lt;h2&gt; exemple {/* <h2>comentari</h2> */}</p>')).ok, true);
});
test('children prop i objecte expandit es comproven', () => {
  assert.deepEqual(codes(audit('const opts={children:<h2>Cos</h2>}; export function V(){return <UniversalPage {...opts}/> }')), ['MC2']);
  assert.deepEqual(codes(audit('export function V(){return <UniversalPage children={<h2>Cos</h2>}/> }')), ['MC2']);
});
test('condicions, arrays i map de JSX no amaguen H2', () => {
  assert.equal(audit(page('{ok ? <h2>Condició</h2> : null}{[1].map(x=><h2 key={x}>Mapa</h2>)}')).issues.length, 2);
});
test('constant JSX, funció local i crida de render es seguixen', () => {
  const result = audit(`const bloc=<h2>Constant</h2>; function Sub(){return <h2>Funció</h2>} const renderCos=()=> <h2>Crida</h2>; ${page('{bloc}<Sub/>{renderCos()}')}`);
  assert.equal(result.issues.length, 3);
});
test('component importat amb àlies es seguix sense executar el mòdul', () => {
  const result = audit(`import {Cos as B} from './Cos.jsx';${page('<B/>')}`, {
    'src/sections/Cos.jsx': 'throw new Error("no executar"); export function Cos(){return <h2>Importat</h2>}',
  });
  assert.deepEqual(codes(result), ['MC2']);
  assert.equal(result.issues[0].file, 'src/sections/Cos.jsx');
});
test('reexportacions explícites i export star de components es seguixen', () => {
  const files = {
    'src/sections/index.js': 'export * from "./Cos.jsx";',
    'src/sections/Cos.jsx': 'export function Cos(){return <h2>Importat</h2>}',
  };
  assert.deepEqual(codes(audit(`import {Cos} from './index.js';${page('<Cos/>')}`, files)), ['MC2']);
  files['src/sections/index.js'] = 'export {Cos as CosNou} from "./Cos.jsx";';
  assert.deepEqual(codes(audit(`import {CosNou} from './index.js';${page('<CosNou/>')}`, files)), ['MC2']);
});
test('export default i UniversalPage importada amb àlies es seguixen', () => {
  assert.deepEqual(codes(audit('import {UniversalPage as Pagina} from "../components/UniversalPage.jsx";import Cos from "./Cos.jsx";export const V=()=> <Pagina><Cos/></Pagina>', {
    'src/sections/Cos.jsx': 'export default ()=> <h2>Default</h2>;',
  })), ['MC2']);
});
test('embolcall que retorna UniversalPage propaga la regla als children', () => {
  assert.deepEqual(codes(audit('import {Marc} from "./Marc.jsx";export const V=()=> <Marc><h2>Cos</h2></Marc>', {
    'src/sections/Marc.jsx': 'export function Marc({children}){return <UniversalPage>{children}</UniversalPage>}',
  })), ['MC2']);
});
test('H2 de component local no muntat no és un fals positiu', () => {
  assert.equal(audit(`function NoMuntat(){return <h2>Mai</h2>}${page('<p>Cos</p>')}`).ok, true);
});
test('cicles de components i d’importacions no bloquegen la porta', () => {
  assert.deepEqual(codes(audit(`import A from './A.jsx';${page('<A/>')}`, {
    'src/sections/A.jsx': 'import B from "./B.jsx"; export default function A(){return <><h2>Cos</h2><B/></>}',
    'src/sections/B.jsx': 'import A from "./A.jsx"; export default function B(){return <A/>}',
  })), ['MC2']);
});
test('només H2 que etiqueta el dialog està exempt; la prosa interior falla', () => {
  const result = audit(page('<dialog aria-labelledby="titol"><h2 id="titol">Modal</h2><h2>Subsecció</h2></dialog>'));
  assert.deepEqual(codes(result), ['MC2']);
  assert.equal(result.exemptions[0].id, 'dialog-independent');
});
test('dialog sense aria-labelledby no genera una excepció cega', () => {
  assert.deepEqual(codes(audit(page('<dialog><h2>Títol sense connexió accessible</h2></dialog>'))), ['MC2']);
});
test('reutilitzar un H2 exempt dins i fora d’un dialog continua fallant fora', () => {
  const result = audit(`const titol=<h2 id="t">Títol</h2>;${page('<dialog aria-labelledby="t">{titol}</dialog>{titol}')}`);
  assert.deepEqual(codes(result), ['MC2']);
  assert.equal(result.exemptions.length, 1);
});
test('mateix component H2 reutilitzat en modal i en cos pla no hereta l’exempció', () => {
  const result = audit(`function Titol(){return <h2 id="t">Títol</h2>}${page('<dialog aria-labelledby="t"><Titol/></dialog><Titol/>')}`);
  assert.deepEqual(codes(result), ['MC2']);
  assert.equal(result.exemptions.length, 1);
});
test('mostra tipogràfica: excepció exacta de fitxer, text i contenidor', () => {
  const source = page('<div className="component-doc-preview"><h2>Subtítol que acompanya la lectura (h2)</h2><h2>Nova secció il·legal</h2></div>');
  const result = auditaFonts({ [EXCEPCIONS[0].file]: source });
  assert.deepEqual(codes(result), ['MC2']);
  assert.equal(result.exemptions[0].id, 'escala-tipografica');
  assert.equal(audit(source).issues.length, 2);
});
test('PAGE_COPY HTML: Babel i HTML distingixen comentaris i text literal', () => {
  assert.equal(auditaFonts({ 'src/sections/text/pageContent.js': 'export const PAGE_COPY={p:{html:"<!-- <h2>comentari</h2> --><p>&lt;h2&gt;</p><p title=\'<h2>atribut</h2>\'>Cos</p>"}};' }).ok, true);
  assert.deepEqual(codes(auditaFonts({ 'src/sections/text/pageContent.js': 'export const PAGE_COPY={p:{html:"<H2 class=\'seccio\'>Cos</H2>"}};' })), ['MC1']);
});
test('PAGE_COPY: escapes JavaScript, concatenacions i templates es descodifiquen', () => {
  for (const value of ['"\\x3ch2>Cos</h2>"', '"<h"+"2>Cos</h2>"', '`<h${2}>Cos</h2>`']) {
    assert.deepEqual(codes(auditaFonts({ 'src/sections/text/pageContent.nou.js': `export const BLOC=${value};` })), ['MC1']);
  }
});

test('localització JS conserva CRLF, separadors Unicode i columnes UTF-16', () => {
  const last = 'export const PAGE_COPY={"🚀":0,html:"<H2>Cos prohibit</H2>"};';
  for (const newline of ['\n', '\r\n', '\r', '\u2028', '\u2029']) {
    const report = auditaFonts({ 'src/pageContent.localitzacio.js': `// una línia${newline}${newline}${last}` });
    assert.equal(report.issues.length, 1);
    assert.equal(report.issues[0].code, 'MC1');
    assert.equal(report.issues[0].line, 3);
    assert.equal(report.issues[0].column, last.indexOf('"<H2>') + 1);
  }
});
test('HTML perillós sota children també s’analitza', () => {
  assert.deepEqual(codes(audit(`const html='<h2>Cos</h2>';${page('<div dangerouslySetInnerHTML={{__html:html}}/>')}`)), ['MC2']);
});
test('max-width i max-inline-size amb measure fallen també en regles niades', () => {
  const result = auditaFonts({ 'src/css/editorial.css': '.prosa p{max-width:var(--sdp-measure)}@media(min-width:30rem){.lectura{max-inline-size: var( --sdp-measure, 70ch ) !important}}' });
  assert.deepEqual(codes(result), ['MC3', 'MC3']);
  assert.equal(result.issues[0].selector, '.prosa p');
});
test('cap regla antiga queda exclosa per fitxer o baseline', () => {
  assert.deepEqual(codes(auditaFonts({ 'src/css/diferit-atles-2d.css': '.sdp-atles__bloc>p{max-inline-size:var(--sdp-measure)}' })), ['MC3']);
});
test('measure en comentaris, custom property o altra propietat no és max-width', () => {
  assert.equal(auditaFonts({ 'src/css/test.css': '/*p{max-width:var(--sdp-measure)}*/ :root{--sdp-measure:70ch} p{width:100%;max-width:100%;line-height:var(--sdp-measure)}' }).ok, true);
});
test('estil JSX no pot evitar la regla editorial', () => {
  assert.deepEqual(codes(audit(page('<p style={{maxInlineSize:"var(--sdp-measure)"}}>Cos</p>'))), ['MC3']);
});
test('sintaxi JS o CSS incorrecta falla tancada', () => {
  assert.deepEqual(codes(audit('export const V=()=> <UniversalPage><h2>')), ['MC0']);
  assert.deepEqual(codes(auditaFonts({ 'src/css/editorial.css': 'p{ max-width:var(--sdp-measure);' })), ['MC0']);
});
test('fonts de proves no es confonen amb codi de producció', () => {
  assert.equal(auditaFonts({ 'src/sections/Vista.test.jsx': page('<h2>Fixture</h2>'), 'src/sections/text/pageContent.test.js': 'const html="<h2>Fixture</h2>"' }).ok, true);
});
test('CLI --arrel --json retorna 0/1 i no executa les fonts', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'sdp-maquetacio-test-'));
  try {
    mkdirSync(path.join(temp, 'src/sections'), { recursive: true });
    const file = path.join(temp, 'src/sections/Vista.jsx');
    writeFileSync(file, page('<h3>Cos</h3>'));
    const run = () => spawnSync(process.execPath, [path.resolve('tooling/gates/tractor-maquetacio-canonica.mjs'), '--arrel', temp, '--json'], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    writeFileSync(file, `throw Error('mai executar');${page('<h2>Cos</h2>')}`);
    const fail = run();
    assert.equal(fail.status, 1);
    assert.deepEqual(codes(JSON.parse(fail.stdout)), ['MC2']);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

// Contraexemples descoberts pel crític independent R32.42.
test('spreads HTML i children niats no amaguen H2', () => {
  assert.equal(audit(`const props={dangerouslySetInnerHTML:{__html:'<h2>Mal</h2>'}};${page('<div {...props}/>')}`).ok, false);
  assert.equal(audit('const p1={children:<h2/>};const p2={...p1};export const V=()=> <UniversalPage {...p2}/>').ok, false);
});
test('HTML concatenat de component importat es comprova', () => {
  assert.equal(audit(`import {Cos} from './Cos.jsx';${page('<Cos/>')}`, {
    'src/sections/Cos.jsx': `const html='<'+'h2>Mal</'+'h2>';export const Cos=()=> <div dangerouslySetInnerHTML={{__html:html}}/>`,
  }).ok, false);
});
test('una definició local homònima no tapa el component exterior prohibit', () => {
  assert.equal(audit('const Contents=()=> <h2/>;function Good(){const Contents=()=> <h3/>;return <UniversalPage><Contents/></UniversalPage>}function Bad(){return <UniversalPage><Contents/></UniversalPage>}').ok, false);
});
test('components importats com namespace es comproven', () => {
  assert.equal(audit(`import * as Parts from './parts.jsx';${page('<Parts.Contents/>')}`, {
    'src/sections/parts.jsx':'export const Contents=()=> <h2/>;',
  }).ok, false);
});
test('destructuració de JSX estàtic es comprova', () => {
  assert.equal(audit(`const all={bad:<h2/>};const {bad}=all;${page('{bad}')}`).ok, false);
});

// R32.43: les propietats decoratives no són cos i els controls no són prosa.
test('tooltip que el component no renderitza queda fora del cos', () => {
  assert.equal(audit(`const Card=({children})=><section>{children}</section>;${page('<Card tooltip={<h2>Decoratiu</h2>}><h3>Cos</h3></Card>')}`).ok, true);
  assert.equal(audit(`const Card=({children})=><section>{children}</section>;const extra={tooltip:<h2>Decoratiu</h2>};${page('<Card {...extra}><h3>Cos</h3></Card>')}`).ok, true);
});
test('prop renderitzada pel component continua sent cos, també amb alias i spread', () => {
  assert.equal(audit(`const Card=({tooltip:body})=><section>{body}</section>;${page('<Card tooltip={<h2>Cos</h2>}/>')}`).ok, false);
  assert.equal(audit(`const Card=(props)=><section>{props.tooltip}</section>;const extra={tooltip:<h2>Cos</h2>};${page('<Card {...extra}/>')}`).ok, false);
});
test('component importat que ignora tooltip no dona fals positiu', () => {
  assert.equal(audit(`import {Card} from './Card.jsx';${page('<Card tooltip={<h2>Decoratiu</h2>}><h3>Cos</h3></Card>')}`, {
    'src/sections/Card.jsx': 'export const Card=({children})=><section>{children}</section>',
  }).ok, true);
});
test('children que el component ignora no es presenten com a renderitzats', () => {
  assert.equal(audit(`const Card=({title})=><section>{title}</section>;${page('<Card title="Vàlid"><h2>No muntat</h2></Card>')}`).ok, true);
});
test('subtítol de capçalera propagat a UniversalPage no es confon amb children', () => {
  assert.equal(audit('const props={subtitle:<h2>Capçalera</h2>};export const V=()=> <UniversalPage {...props}><h3>Cos</h3></UniversalPage>').ok, true);
});
test('max-width dels controls input no és prosa editorial', () => {
  assert.equal(auditaFonts({'src/control.css':'input { max-width: var(--sdp-measure); } input.field:focus { max-inline-size: var(--sdp-measure); } form > input[data-kind="a,b"]:not(.x) { max-width: var(--sdp-measure); }'}).ok, true);
  assert.equal(audit(page('<input style={{maxWidth:"var(--sdp-measure)"}}/>')).ok, true);
  assert.equal(audit(page('<input {...{style:{maxWidth:"var(--sdp-measure)"}}}/>')).ok, true);
});
test('selector mixt o descendent editorial no hereta excepció de control', () => {
  assert.equal(auditaFonts({'src/control.css':'input, p { max-width: var(--sdp-measure); }'}).ok, false);
  assert.equal(auditaFonts({'src/control.css':'input + p { max-width: var(--sdp-measure); }'}).ok, false);
});
test('la frontera de capçalera no amaga H2 real d’un component fill importat', () => {
  const files={
    'src/components/universal/UniversalPage.jsx':'export const UniversalPage=({children})=><PageFrame>{children}</PageFrame>',
    'src/components/universal/PageFrame.jsx':'export const PageFrame=({children})=><><h2>Header</h2>{children}</>',
    'src/sections/Body.jsx':'export const Body=()=> <h2>Infracció</h2>',
  };
  assert.equal(audit(`import {UniversalPage} from '../components/universal/UniversalPage.jsx';import {Body} from './Body.jsx';export const V=()=> <UniversalPage><Body/></UniversalPage>`,files).ok, false);
});
test('wrapper sense H2 propi governa el caller i no necessita la contaminació del header', () => {
  assert.equal(auditaFonts({
    'src/components/universal/UniversalPage.jsx':'export const UniversalPage=({children})=><PageFrame>{children}</PageFrame>',
    'src/components/universal/PageFrame.jsx':'export const PageFrame=({children})=><><h2>Header</h2>{children}</>',
    'src/Marc.jsx':'import {UniversalPage} from "./components/universal/UniversalPage.jsx";export const Marc=({children})=><UniversalPage>{children}</UniversalPage>',
    'src/Vista.jsx':'import {Marc} from "./Marc.jsx";export const Vista=()=> <Marc><h2>Cos</h2></Marc>',
  }).ok,false);
});

test('àlies exportats amb comentaris conserven el cos Page del caller', () => {
  for (const declaration of ['default /*a*/ Original /*b*/', 'const /*a*/ Frame /*b*/ = /*c*/ Original /*d*/', 'let Frame = Original', 'var Frame = Original']) {
    const name = declaration.startsWith('default') ? 'default' : 'Frame';
    const report = auditaFonts({
      'src/App.jsx': `import ${name === 'default' ? 'Frame' : '{Frame}'} from './barrel.js';export const App=()=> <Frame><h2>Cos prohibit</h2></Frame>`,
      'src/barrel.js': `import {Shell as Original} from './Shell.jsx';export /*cap*/ ${declaration};`,
      'src/Shell.jsx': 'export const Shell=({children})=><UniversalPage>{children}</UniversalPage>',
    });
    assert.deepEqual(codes(report), ['MC2']);
  }
});

test('diccionari exportat compost no tapa l’àlies del mateix barrel', () => {
  const report = auditaFonts({
    'src/App.jsx': "import {Frame} from './barrel.js';export const App=()=> <Frame><h2>Cos prohibit</h2></Frame>",
    'src/barrel.js': `import {Shell} from './Shell.jsx';export const dictionary=Object.freeze({value:${JSON.stringify('text sense contingut editorial '.repeat(5000))}});export const Frame=Shell;`,
    'src/Shell.jsx': 'export const Shell=({children})=><UniversalPage>{children}</UniversalPage>',
  });
  assert.deepEqual(codes(report), ['MC2']);
});

// Contraexemples mínims del crític independent R32.43, conservats com a regressió.
const criticR43 = [
  ['literal tag', false, "const Heading='h2';export const V=()=> <UniversalPage><Heading/></UniversalPage>"],
  ['template tag', false, "const Heading=`h${2}`;export const V=()=> <UniversalPage><Heading/></UniversalPage>"],
  ['escaped tag', false, "const Heading='\\x68\\x32';export const V=()=> <UniversalPage><Heading/></UniversalPage>"],
  ['concatenated tag', false, "const Heading='h'+'2';export const V=()=> <UniversalPage><Heading/></UniversalPage>"],
  ['createElement', false, "import React from 'react';export const V=()=> <UniversalPage>{React.createElement('h2',null,'Bad')}</UniversalPage>"],
  ['nested destructuring', false, "function Card({content:{body}}){return <div>{body}</div>};export const V=()=> <UniversalPage><Card content={{body:<h2/>}}/></UniversalPage>"],
  ['default destructuring', false, "function Card({body}={}){return <div>{body}</div>};export const V=()=> <UniversalPage><Card body={<h2/>}/></UniversalPage>"],
  ['ignored forwarding', true, "function Inner(){return <p>Safe</p>};function Outer({tooltip}){return <Inner tooltip={tooltip}/>};export const V=()=> <UniversalPage><Outer tooltip={<h2/>}/></UniversalPage>"],
  ['event callback', true, "function Card({render}){return <button onClick={render}>Safe</button>};export const V=()=> <UniversalPage><Card render={()=> <h2/>}/></UniversalPage>"],
  ['ignored wrapper parameter', true, "function Shell(props){return <UniversalPage><p>Safe</p></UniversalPage>};export const V=()=> <Shell><h2/></Shell>"],
  ['ignored wrapper children', true, "function Shell({children}){return <UniversalPage><p>Safe</p></UniversalPage>};export const V=()=> <Shell><h2/></Shell>"],
  ['style alias', false, "const style={maxWidth:'var(--sdp-measure)'};export const V=()=> <UniversalPage><p style={style}/></UniversalPage>"],
  ['style spread', false, "const style={maxWidth:'var(--sdp-measure)'};export const V=()=> <UniversalPage><p {...{style}}/></UniversalPage>"],
  ['overridden children', true, "export const V=()=> <UniversalPage children={<h2/>}><h3/></UniversalPage>"],
  ['overridden spread', true, "const props={children:<h2/>};export const V=()=> <UniversalPage {...props}><h3/></UniversalPage>"],
  ['scope shadow', true, "const Contents=()=> <h2/>;function Good(){const Contents=()=> <h3/>;return <UniversalPage><Contents/></UniversalPage>}"],
  ['static array member', false, "const tags=['h2'];const Heading=tags[0];export const V=()=> <UniversalPage><Heading/></UniversalPage>"],
  ['static array pattern', false, "const tags=['h2'];const [Heading]=tags;export const V=()=> <UniversalPage><Heading/></UniversalPage>"],
  ['component parameter', false, "function Card({Part}){return <Part/>};export const V=()=> <UniversalPage><Card Part={()=> <h2/>}/></UniversalPage>"],
  ['ignored explicit children forwarded', true, "function Inner(){return <p/>};function Outer({children}){return <Inner children={children}/>};export const V=()=> <UniversalPage><Outer><h2/></Outer></UniversalPage>"],
  ['ignored object spread forwarded', true, "function Inner(){return <p/>};function Outer(props){return <Inner {...props}/>};export const V=()=> <UniversalPage><Outer tooltip={<h2/>}/></UniversalPage>"],
  ['selected safe object member', true, "const all={bad:<h2/>,safe:<h3/>};export const V=()=> <UniversalPage>{all.safe}</UniversalPage>"],
];
for (const [name, expected, source] of criticR43) test(`R43 ${name}`, () => assert.equal(audit(source).ok, expected));

test('namespace UniversalPage i etiqueta estàtica importada conserven el cos', () => {
  assert.equal(auditaFonts({
    'src/Vista.jsx':"import * as UI from './Page.jsx';export const V=()=> <UI.UniversalPage><h2/></UI.UniversalPage>",
    'src/Page.jsx':'export const UniversalPage=({children})=><main>{children}</main>',
  }).ok, false);
  assert.equal(auditaFonts({
    'src/Vista.jsx':"import tags from './tags.js';const Heading=tags[0];export const V=()=> <UniversalPage><Heading/></UniversalPage>",
    'src/tags.js':"export default ['h2'];",
  }).ok, false);
});

test('escàner lineal salta comentaris truncats i conserva imports comentats', () => {
  const noise='// from '+ '/*from '.repeat(10000) +'*/ END';
  assert.equal(audit(noise).ok, true);
  const gap='/*x*/ '.repeat(1000);
  assert.equal(audit(`import${gap}{Cos}${gap}from${gap}'./Cos.jsx';${page('<Cos/>')}`, {
    'src/sections/Cos.jsx':'export const Cos=()=> <h2/>',
  }).ok, false);
});

test('spread JSX després d’atributs amb arrow i JSX niat no es perd', () => {
  assert.equal(audit(`function Shell(props){return <UniversalPage onClick={()=>true} extra={<b/>} {...props}/>};export const V=()=> <Shell><h2/></Shell>`).ok, false);
});

test('API i CLI comparteixen imports, HTML i regressions R43 sense executar fonts', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'sdp-maquetacio-paritat-'));
  const fonts = Object.fromEntries(criticR43.map(([, , source], index) => [`src/cas${index}/Vista.jsx`, source]));
  Object.assign(fonts, {
    'src/HTML.jsx':"import * as UI from './Pagina.jsx';import {html} from './body.js';throw Error('mai executar');export const V=()=> <UI.UniversalPage><div dangerouslySetInnerHTML={{__html:html}}/></UI.UniversalPage>",
    'src/Pagina.jsx':'export const UniversalPage=({children})=><main>{children}</main>',
    'src/body.js':"export const html='<'+'H2>Cos</H2>';",
    'src/sections/text/pageContent.corpus.js':"export const PAGE_COPY={body:'\\x3cH2>Cos</H2>'};",
  });
  try {
    for (const [file, source] of Object.entries(fonts)) {
      mkdirSync(path.dirname(path.join(temp, file)), {recursive:true});
      writeFileSync(path.join(temp, file), source);
    }
    const expected=auditaFonts(fonts);
    const child=spawnSync(process.execPath,[path.resolve('tooling/gates/tractor-maquetacio-canonica.mjs'),'--arrel',temp,'--json'],{encoding:'utf8'});
    assert.equal(child.status,1);
    const actual=JSON.parse(child.stdout);
    assert.equal(actual.stats.files, Object.keys(fonts).length);
    assert.equal(actual.stats.workers, 0);
    assert.equal(actual.stats.terminatedWorkers, 0);
    assert.equal(actual.stats.inventoryReadFiles, Object.keys(fonts).length);
    assert.equal(actual.stats.actualReads, Object.keys(fonts).length);
    assert.equal(actual.stats.inventoryReadBytes, Object.values(fonts).reduce((sum, source) => sum + Buffer.byteLength(source), 0));
    assert.deepEqual(actual.issues, expected.issues);
    assert.deepEqual(actual.exemptions, expected.exemptions);
  } finally { rmSync(temp,{recursive:true,force:true}); }
});

test('pool forçat acaba tots els workers també quan expira el termini', async () => {
  const temp=mkdtempSync(path.join(os.tmpdir(),'sdp-maquetacio-timeout-'));
  try {
    mkdirSync(path.join(temp,'src'),{recursive:true});
    writeFileSync(path.join(temp,'src/Vista.jsx'),page('<h2/>'));
    writeFileSync(path.join(temp,'src/Altra.jsx'),page('<p/>'));
    await assert.rejects(auditaMaquetacioConcurrent(temp,{workers:2,timeoutMs:1}), error => /Timeout/.test(error.message) && error.terminatedWorkers===2);
  } finally { rmSync(temp,{recursive:true,force:true}); }
});

test('un component importat pot renderitzar una etiqueta literal d’un tercer mòdul', () => {
  assert.equal(auditaFonts({
    'src/Vista.jsx':"import {Body} from './Body.jsx';export const V=()=> <UniversalPage><Body/></UniversalPage>",
    'src/Body.jsx':"import tags from './tags.js';const Heading=tags[0];export const Body=()=> <Heading/>",
    'src/tags.js':"export default ['h2'];",
  }).ok,false);
});

test('punt fix altern entre dos mòduls pot necessitar més rondes que fitxers', async () => {
  const count=6, temp=mkdtempSync(path.join(os.tmpdir(),'sdp-maquetacio-fixpoint-'));
  const fonts={
    'src/A.jsx':`import {${Array.from({length:count},(_,i)=>`B${i}`).join(',')}} from './B.jsx';export const A0=({children})=><UniversalPage>{children}</UniversalPage>;`
      +Array.from({length:count},(_,i)=>`export const A${i+1}=({children})=><B${i}>{children}</B${i}>;`).join('')
      +`export const V=()=> <A${count}><h2>Cos</h2></A${count}>;`,
    'src/B.jsx':`import {${Array.from({length:count},(_,i)=>`A${i}`).join(',')}} from './A.jsx';`
      +Array.from({length:count},(_,i)=>`export const B${i}=({children})=><A${i}>{children}</A${i}>;`).join(''),
  };
  try {
    mkdirSync(path.join(temp,'src'),{recursive:true});
    for (const [file,source] of Object.entries(fonts)) writeFileSync(path.join(temp,file),source);
    const expected=auditaFonts(fonts), actual=await auditaMaquetacioConcurrent(temp,{workers:2,timeoutMs:5000});
    assert.equal(actual.ok,false);
    assert.deepEqual(actual.issues,expected.issues);
    assert.deepEqual(actual.exemptions,expected.exemptions);
    assert.ok(actual.stats.discovery === 'demand' || actual.stats.wrapperRounds>Object.keys(fonts).length+1);
    assert.equal(actual.stats.terminatedWorkers,2);
  } finally { rmSync(temp,{recursive:true,force:true}); }
});

test('memo d’objectes conserva últim valor i claus numèriques', () => {
  assert.equal(audit(`const all={body:<h2/>,body:<h3/>};${page('{all.body}{all.body}')}`).ok,true);
  assert.equal(audit(`const tags={0:'h2'};const Heading=tags[0];${page('<Heading/>')}`).ok,false);
});

test('memo literal no transforma resultats parcials de cicles en omissions', () => {
  assert.equal(audit(`const a=b;const b=a;const all={bad:<h2/>,safe:<h3/>};${page('{a}{all.safe}{all.bad}')}`).ok,false);
});

test('delegar un UniversalPage niat no amputa el seu cos ni les props consumides de wrappers', () => {
  const files={
    'src/Vista.jsx':"import {Section} from './Section.jsx';export const V=()=> <UniversalPage><Section/></UniversalPage>",
    'src/Section.jsx':'export const Section=()=> <UniversalPage><h2>Cos prohibit</h2></UniversalPage>',
  };
  assert.equal(auditaFonts(files).ok,false);
  assert.equal(auditaFonts(files).issues.length,1);
  assert.equal(audit(`function Shell(props){return <UniversalPage>{props.body}{props.children}</UniversalPage>};${page('<Shell body={<h2>Consumit</h2>}><h3/></Shell>')}`).ok,false);
  assert.equal(audit(`function Section(){return <UniversalPage subtitle={<h2>Capçalera</h2>}><h3>Cos</h3></UniversalPage>};${page('<Section/>')}`).ok,true);
});

// Oracle independent de frontera Page: expectatives de DOM declarades, no paritat compartida.
const pageContexts={top:call=>`export const App=()=> ${call};`,nested:call=>`export const App=()=> <UniversalPage>${call}</UniversalPage>;`};
const pageShapes={identifier:['props','props.body'],destructured:['{body}','body'],default:['{body}={} ','body']};
const forbiddenBody='<h2>Forbidden body</h2>',forbiddenHtml='<article dangerouslySetInnerHTML={{__html:"<H2>Forbidden body</H2>"}}/>';
function boundaryCase(name,source,expectedOk=false,more={}) {
  test(`Page sink ${name}`,()=>{
    const report=auditaFonts({'src/App.jsx':"throw Error('APP_SOURCE_MUST_NOT_EXECUTE');"+source,...more});
    assert.equal(report.ok,expectedOk);
    if(!expectedOk){assert.ok(codes(report).includes('MC2'));assert.ok(!codes(report).includes('MC0'));}
  });
}
for(const[context,app]of Object.entries(pageContexts)){
  for(const[shape,[param,value]]of Object.entries(pageShapes)){
    const shell=`function Shell(${param}){return <UniversalPage>{${value}}</UniversalPage>};`;
    boundaryCase(`${context}_${shape}_body_jsx`,shell+app(`<Shell body={${forbiddenBody}}/>`));
    boundaryCase(`${context}_${shape}_body_spread`,shell+`const input={body:${forbiddenBody}};`+app('<Shell {...input}/>'));
    boundaryCase(`${context}_${shape}_html_jsx`,shell+app(`<Shell body={${forbiddenHtml}}/>`));
    const htmlShell=`function Shell(${param}){return <UniversalPage><article dangerouslySetInnerHTML={{__html:${value}}}/></UniversalPage>};`;
    boundaryCase(`${context}_${shape}_html_string`,htmlShell+app('<Shell body={"<H2>Forbidden body</H2>"}/>'));
    boundaryCase(`${context}_${shape}_html_spread`,htmlShell+'const input={body:"<H2>Forbidden body</H2>"};'+app('<Shell {...input}/>'));
    const childrenParam=shape==='identifier'?'props':shape==='default'?'{children}={}':'{children}',childrenValue=shape==='identifier'?'props.children':'children';
    const childrenShell=`function Shell(${childrenParam}){return <UniversalPage>{${childrenValue}}</UniversalPage>};`;
    boundaryCase(`${context}_${shape}_children`,childrenShell+app(`<Shell>${forbiddenBody}</Shell>`));
    boundaryCase(`${context}_${shape}_children_spread`,childrenShell+`const input={children:${forbiddenBody}};`+app('<Shell {...input}/>'));
  }
  boundaryCase(`${context}_ignored_tooltip`,'function Shell(props){return <UniversalPage><p>Safe</p></UniversalPage>};'+app(`<Shell tooltip={${forbiddenBody}}/>`),true);
  boundaryCase(`${context}_header`,'function Shell(props){return <UniversalPage subtitle={props.title}><p>Safe</p></UniversalPage>};'+app('<Shell title={<h2>Legal header</h2>}/>'),true);
  boundaryCase(`${context}_overridden_children`,'function Shell(props){return <UniversalPage {...props}><h3>Safe</h3></UniversalPage>};'+app(`<Shell>${forbiddenBody}</Shell>`),true);
  boundaryCase(`${context}_React_text`,'function Shell(props){return <UniversalPage>{props.body}</UniversalPage>};'+app('<Shell body={"<H2>Text literal</H2>"}/>'),true);
}
for(const[shape,[param,value]]of Object.entries(pageShapes))boundaryCase(`imported_${shape}`,`import{Shell}from'./Shell.jsx';export const App=()=> <Shell body={${forbiddenBody}}/>;`,false,{'src/Shell.jsx':`export function Shell(${param}){return <UniversalPage>{${value}}</UniversalPage>}`});
boundaryCase('namespace',`import * as Parts from './Shell.jsx';export const App=()=> <Parts.Shell body={${forbiddenBody}}/>;`,false,{'src/Shell.jsx':'export function Shell(props){return <UniversalPage>{props.body}</UniversalPage>}'});
boundaryCase('imported_ignored',`import{Shell}from'./Shell.jsx';export const App=()=> <Shell tooltip={${forbiddenBody}}/>;`,true,{'src/Shell.jsx':'export function Shell(props){return <UniversalPage><p>Safe</p></UniversalPage>}'});

boundaryCase('barrel_html',"import {Frame} from './index.js';export const App=()=> <Frame html={'<H2>Bad</H2>'}/>",false,{
  'src/index.js':"export {Shell as Frame} from './Shell.jsx'",'src/Shell.jsx':'export function Shell({html}){return <UniversalPage><div dangerouslySetInnerHTML={{__html:html}}/></UniversalPage>}',
});
boundaryCase('native_spread_safe',"function Shell({attrs}){return <UniversalPage><p {...attrs}/></UniversalPage>};export const App=()=> <Shell attrs={{title:'<h2>literal</h2>',children:<h3/>}}/>",true);
boundaryCase('native_spread_bad',"function Shell({attrs}){return <UniversalPage><p {...attrs}/></UniversalPage>};export const App=()=> <Shell attrs={{title:'safe',children:<h2/>}}/>");
boundaryCase('native_spread_HTML_path',"function Shell({attrs}){return <UniversalPage><p {...attrs}/></UniversalPage>};export const App=()=> <Shell attrs={{title:'<h2>literal</h2>',dangerouslySetInnerHTML:{__html:'<h3>Safe</h3>'}}}/>",true);
boundaryCase('outer_Page_outside_inner_Page',"function Shell({body}){return <><h2>Outside inner Page</h2><UniversalPage>{body}</UniversalPage></>};export const App=()=> <UniversalPage><Shell body={<h3/>}/></UniversalPage>");

// Oracle de delegació: comptatges declarats i paritat entre el cos propi i els
// callers, també quan les arrels viuen en workers diferents.
const delegationCases = [];
const delegationSource = source => ({ 'src/App.jsx': "throw Error('APP_SOURCE_MUST_NOT_EXECUTE');" + source });
const delegationCase = (name, fonts, issues, exemptions = 0) => delegationCases.push({ name, fonts, issues, exemptions });
delegationCase('outside_page', delegationSource('function Shell(){return <><h2>Outside</h2><UniversalPage><h3>Safe</h3></UniversalPage></>};export const App=()=> <UniversalPage><Shell/></UniversalPage>'), 1);
delegationCase('inside_and_outside_page', delegationSource('function Shell(){return <><h2>Outside</h2><UniversalPage><h2>Inside</h2></UniversalPage></>};export const App=()=> <UniversalPage><Shell/></UniversalPage>'), 2);
delegationCase('two_page_subtrees', delegationSource('function Shell(){return <><UniversalPage><h2>First</h2></UniversalPage><h2>Outside</h2><UniversalPage><h2>Second</h2></UniversalPage></>};export const App=()=> <UniversalPage><Shell/></UniversalPage>'), 3);
delegationCase('caller_body_and_children', delegationSource('function Shell({body,children}){return <UniversalPage>{body}{children}</UniversalPage>};export const App=()=> <UniversalPage><Shell body={<h2>Body</h2>}><h2>Children</h2></Shell></UniversalPage>'), 2);
delegationCase('caller_html_and_style', delegationSource('function Shell({body,style}){return <UniversalPage><p style={style} dangerouslySetInnerHTML={{__html:body}}/></UniversalPage>};export const App=()=> <UniversalPage><Shell body={"<H2>HTML</H2>"} style={{maxWidth:"var(--sdp-measure)"}}/></UniversalPage>'), 2);
delegationCase('caller_html_object', delegationSource('function Shell({html}){return <UniversalPage><p dangerouslySetInnerHTML={html}/></UniversalPage>};export const App=()=> <UniversalPage><Shell html={{__html:"<H2>HTML</H2>"}}/></UniversalPage>'), 1);
delegationCase('React_text_and_control_style', delegationSource('function Shell({body,style}){return <UniversalPage>{body}<input style={style}/></UniversalPage>};export const App=()=> <UniversalPage><Shell body={"<H2>Literal</H2>"} style={{maxWidth:"var(--sdp-measure)"}}/></UniversalPage>'), 0);
delegationCase('nested_props', delegationSource('function Shell({content:{body,style}}){return <UniversalPage><p style={style}>{body}</p></UniversalPage>};export const App=()=> <UniversalPage><Shell content={{body:<h2>Body</h2>,style:{maxInlineSize:"var(--sdp-measure)"}}}/></UniversalPage>'), 2);
delegationCase('subtitle_and_outside', delegationSource('function Shell(){return <><h2>Outside</h2><UniversalPage subtitle={<h2>Title</h2>}><h3>Body</h3></UniversalPage></>};export const App=()=> <UniversalPage><Shell/></UniversalPage>'), 1);
for (const [name, imported, tag] of [
  ['import_alias', "import{UniversalPage as Layout}from'./Page.jsx';", 'Layout'],
  ['namespace', "import * as UI from'./Page.jsx';", 'UI.UniversalPage'],
]) delegationCase(name, { ...delegationSource(imported + `function Shell(){return <${tag}><h2>Body</h2></${tag}>};export const App=()=> <UniversalPage><Shell/></UniversalPage>`), 'src/Page.jsx': 'export const UniversalPage=({children})=><main>{children}</main>' }, 1);
delegationCase('caller_dialog', delegationSource('function Shell(){return <UniversalPage><h2 id="title">Dialog title</h2></UniversalPage>};export const App=()=> <UniversalPage><dialog aria-labelledby="title"><Shell/></dialog></UniversalPage>'), 1, 1);
for (const [name, shell, caller] of [
  ['caller_preview', '<UniversalPage><h2>Subtítol que acompanya la lectura (h2)</h2></UniversalPage>', '<div className="component-doc-preview"><Shell/></div>'],
  ['own_page_preview', '<UniversalPage className="component-doc-preview"><h2>Subtítol que acompanya la lectura (h2)</h2></UniversalPage>', '<Shell/>'],
  ['literal_preview', '<UniversalPage><h2>Subtítol que acompanya la lectura (h2)</h2></UniversalPage>', '<div className={preview}><Shell/></div>'],
]) delegationCase(name, { [EXCEPCIONS[0].file]: `const preview='component-doc-preview';function Shell(){return ${shell}};export const App=()=> <UniversalPage>${caller}</UniversalPage>` }, 1, 1);
delegationCase('literal_h2_shadow', delegationSource("const UniversalPage='h2';function Shell(){return <UniversalPage>Forbidden</UniversalPage>};export const App=()=> <UniversalPage><Shell/></UniversalPage>"), 1);
delegationCase('own_page_in_ignored_prop', delegationSource('function Ignore(){return <p/>};function Shell(){return <Ignore tooltip={<UniversalPage><h2>Own</h2></UniversalPage>}/>};export const App=()=> <UniversalPage><Shell/></UniversalPage>'), 1);
delegationCase('barrel_alias_body_html_and_outside', {
  'src/App.jsx': "import{Alias}from'./barrel.js';export const App=()=> <UniversalPage><Alias body={<h2>Body</h2>} html={'<H2>HTML</H2>'}/></UniversalPage>",
  'src/barrel.js': "import{Shell}from'./Shell.jsx';export const Alias /* not trimmed */=Shell;",
  'src/Shell.jsx': 'export function Shell(props){return <><h2>Outside</h2><UniversalPage>{props.body}<p dangerouslySetInnerHTML={{__html:props.html}}/></UniversalPage></>}',
}, 3);
const delegationReport = result => ({ ok: result.ok, issues: result.issues, exemptions: result.exemptions, inventory: result.inventory });
for (const { name, fonts, issues, exemptions } of delegationCases) test(`delegació canònica ${name}`, async () => {
  const padded = { ...fonts };
  for (let index = 0; Object.keys(padded).length < 4; index++) padded[`src/pad${index}.js`] = 'export const n=0;';
  const expected = auditaFonts(padded);
  assert.equal(expected.issues.length, issues);
  assert.equal(expected.exemptions.length, exemptions);
  assert.ok(!codes(expected).includes('MC0'));
  const temp = mkdtempSync(path.join(os.tmpdir(), 'sdp-maquetacio-delegacio-'));
  try {
    for (const [file, source] of Object.entries(padded)) {
      mkdirSync(path.dirname(path.join(temp, file)), { recursive: true });
      writeFileSync(path.join(temp, file), source);
    }
    const actual = await auditaMaquetacioConcurrent(temp, { workers: 4 });
    assert.deepEqual(delegationReport(actual), delegationReport(expected));
    assert.equal(actual.stats.inventoryReadFiles, Object.keys(padded).length);
    assert.equal(actual.stats.inventoryReadBytes, Object.values(padded).reduce((sum, source) => sum + Buffer.byteLength(source), 0));
    assert.equal(actual.stats.workers, 4);
    assert.equal(actual.stats.terminatedWorkers, 4);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
for (const [name, pageClass, ancestorClass] of [
  ['ancestor_custom_exception', '', ' className="custom-preview"'],
  ['page_custom_exception', ' className="custom-preview"', ''],
]) test(`delegació canònica ${name}`, () => {
  const fonts = { 'src/App.jsx': `function Shell(){return <UniversalPage${pageClass}><h2>Custom sample</h2></UniversalPage>};export const App=()=> <UniversalPage><section${ancestorClass}><Shell/></section></UniversalPage>` };
  const exceptions = [{ id: 'custom-case', file: 'src/App.jsx', text: 'Custom sample', className: 'custom-preview', reason: 'Custom configured exemption' }];
  const report = auditaFonts(fonts, { exceptions });
  assert.equal(report.issues.length, 1);
  assert.equal(report.exemptions.length, 1);
  assert.equal(report.exemptions[0].id, 'custom-case');
});

test('entitat astral JSX conserva el text exacte de l’exempció també en fitxer JS', () => {
  const exceptions = [{ id: 'astral-sample', file: 'src/Astral.js', text: '🚀', className: 'configured-sample', reason: 'Mostra Unicode exacta' }];
  const report = auditaFonts({ 'src/Astral.js': 'export const View=()=> <UniversalPage><section className="configured-sample"><h2>&#x1F680;</h2></section></UniversalPage>' }, { exceptions });
  assert.deepEqual(codes(report), []);
  assert.equal(report.exemptions.length, 1);
  assert.equal(report.exemptions[0].id, 'astral-sample');
});

test('script CommonJS amb with i JSX manté el diagnòstic MC2 sense MC0', () => {
  const report = auditaFonts({ 'src/legacy.js': 'with (legacy) { const value=1; } exports.View=()=> <UniversalPage><h2>Cos prohibit</h2></UniversalPage>;' });
  assert.deepEqual(codes(report), ['MC2']);
});

test('Acorn absent conserva MC1 i MC2 amb el parser de reserva en subprocess net', () => {
  const gate = new URL('../tooling/gates/tractor-maquetacio-canonica.mjs', import.meta.url).href;
  const fonts = {
    'src/App.jsx': "throw Error('APP_SOURCE_MUST_NOT_EXECUTE');export const View=()=> <UniversalPage><h2>Cos</h2></UniversalPage>",
    'src/sections/text/pageContent.js': 'export const PAGE_COPY={html:"<H2>Cos HTML</H2>"};',
  };
  const script = `import Module from 'node:module';const load=Module._load;let attempts=0;Module._load=function(name,...args){if(name==='acorn'){attempts++;throw Object.assign(new Error('Acorn absent'),{code:'MODULE_NOT_FOUND'});}return load.call(this,name,...args);};try{const{auditaFonts}=await import(${JSON.stringify(gate)});const report=auditaFonts(${JSON.stringify(fonts)});process.stdout.write(JSON.stringify({attempts,codes:report.issues.map(issue=>issue.code)}));}finally{Module._load=load;}`;
  const child = runScriptFile(script);
  assert.equal(child.status, 0, child.stderr);
  const report = JSON.parse(child.stdout);
  assert.ok(report.attempts > 0);
  assert.deepEqual(report.codes.sort(), ['MC1', 'MC2']);
});

function runScriptFile(script) {
  const scratch = mkdtempSync(path.join(os.tmpdir(), 'sdp-gate-portable-'));
  try {
    const file = path.join(scratch, 'parser-check.mjs');
    writeFileSync(file, script);
    return spawnSync(process.execPath, [file], { encoding: 'utf8', timeout: 10000 });
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}

const correctnessPage=body=>`export const App=()=> <UniversalPage>${body}</UniversalPage>`;
const correctnessShell='export const Shell=({children})=><UniversalPage>{children}</UniversalPage>;';
const correctnessCodes=fonts=>auditaFonts(fonts).issues.map(issue=>issue.code).sort();
const correctnessCases=[
 ['default parenthesized',{'src/App.jsx':"import Frame from './barrel.js';export const App=()=> <Frame><h2/></Frame>",'src/barrel.js':"import{Shell}from'./Shell.jsx';export default(Shell);",'src/Shell.jsx':correctnessShell},['MC2']],
 ['default nested parenthesized',{'src/App.jsx':"import Frame from './barrel.js';export const App=()=> <Frame><h2/></Frame>",'src/barrel.js':"import{Shell}from'./Shell.jsx';export default((Shell));",'src/Shell.jsx':correctnessShell},['MC2']],
 ['namespace destructuring local',{'src/App.jsx':"import*as API from'./Shell.jsx';const{Shell:Frame}=API;export const App=()=> <Frame><h2/></Frame>",'src/Shell.jsx':correctnessShell},['MC2']],
 ['namespace destructuring reexport',{'src/App.jsx':"import{Frame}from'./barrel.js';export const App=()=> <Frame><h2/></Frame>",'src/barrel.js':"import*as API from'./Shell.jsx';const{Shell:Frame}=API;export{Frame};",'src/Shell.jsx':correctnessShell},['MC2']],
 ['absent object default',{'src/App.jsx':'const{body:Body=<h2/>}={};'+correctnessPage('{Body}')},['MC2']],
 ['absent array default',{'src/App.jsx':'const[Body=<h2/>]=[];'+correctnessPage('{Body}')},['MC2']],
 ['omitted prop default',{'src/App.jsx':'function Card({body=<h2/>}={}){return <section>{body}</section>};'+correctnessPage('<Card/>')},['MC2']],
 ['present object excludes default',{'src/App.jsx':'const{body:Body=<h2/>}={body:<h3/>};'+correctnessPage('{Body}')},[]],
 ['present array excludes default',{'src/App.jsx':'const[Body=<h2/>]=[<h3/>];'+correctnessPage('{Body}')},[]],
 ['null object excludes default',{'src/App.jsx':'const{body:Body=<h2/>}={body:null};'+correctnessPage('{Body}')},[]],
 ['undefined object uses default',{'src/App.jsx':'const{body:Body=<h2/>}={body:undefined};'+correctnessPage('{Body}')},['MC2']],
 ['supplied prop excludes default',{'src/App.jsx':'function Card({body=<h2/>}={}){return <section>{body}</section>};'+correctnessPage('<Card body={<h3/>}/>')},[]],
 ['unused prop default is not body',{'src/App.jsx':'function Card({body=<h2/>}={}){return <h3/>};'+correctnessPage('<Card/>')},[]],
 ['explicit undefined prop uses default',{'src/App.jsx':'function Card({body=<h2/>}={}){return <section>{body}</section>};'+correctnessPage('<Card body={undefined}/>')},['MC2']],
 ['explicit null prop excludes default',{'src/App.jsx':'function Card({body=<h2/>}={}){return <section>{body}</section>};'+correctnessPage('<Card body={null}/>')},[]],
 ['nested omitted prop default',{'src/App.jsx':'function Card({box:{body=<h2/>}={}}={}){return <section>{body}</section>};'+correctnessPage('<Card/>')},['MC2']],
];
for(const[name,fonts,expected]of correctnessCases)test(`correctness · ${name}`,()=>assert.deepEqual(correctnessCodes(fonts),expected));
test('correctness · cyclic default projection terminates without executing source',()=>{
  const result=auditaFonts({'src/App.jsx':'throw Error("NEVER_EXECUTE");const{body:Body=<h2/>}=Body;'+correctnessPage('{Body}')});
  assert.ok(result.issues.every(issue=>issue.code==='MC2'));
});
test('correctness · PAGE_COPY destructured default is available before Page traversal',()=>{
  const result=auditaFonts({'src/pageContent.default.js':'const{html="<h2>Cos</h2>"}={};export const PAGE_COPY={html};'});
  assert.deepEqual(result.issues.map(issue=>issue.code),['MC1']);
});

const edgePage=body=>`export const App=()=> <UniversalPage>${body}</UniversalPage>`;
for(const[id,newline]of[['CR','\r'],['LS','\u2028'],['PS','\u2029']])test(`edge · line comment ${id} ends before JSX`,()=>{
 const line='export const App=()=> <UniversalPage><h2 title="🚀">Cos</h2></UniversalPage>';
 const report=auditaFonts({'src/App.jsx':`const emoji="🚀";${newline}// segona${newline}${line}`});
 assert.deepEqual(report.issues.map(issue=>issue.code),['MC2']);assert.equal(report.issues[0].line,3);assert.equal(report.issues[0].column,line.indexOf('<h2')+1);
});
for(const[name,body]of[
 ['optional static call','const obj={Body(){return <h2/>}};'+edgePage('{obj?.Body()}')],
 ['local class field',"import React from 'react';class Body extends React.Component{render=()=> <h2/>};"+edgePage('<Body/>')],
 ['local JSX object getter','const obj={get Body(){return ()=> <h2/>}};'+edgePage('<obj.Body/>')]
])test(`edge · ${name}`,()=>assert.deepEqual(auditaFonts({'src/App.jsx':body}).issues.map(issue=>issue.code),['MC2']));
for(const[name,body]of[
 ['null optional receiver','const obj=null;'+edgePage('{obj?.Body()}')],
 ['unused class handler',"import React from 'react';class Body extends React.Component{onClick=()=> <h2/>;render=()=> <h3/>};"+edgePage('<Body/>')],
 ['static class render is not instance render',"import React from 'react';class Body extends React.Component{static render=()=> <h2/>};"+edgePage('<Body/>')],
 ['unused getter','const obj={get Body(){return ()=> <h2/>},Safe:()=> <h3/>};'+edgePage('<obj.Safe/>')]
])test(`edge negative · ${name}`,()=>assert.deepEqual(auditaFonts({'src/App.jsx':body}).issues.map(issue=>issue.code),[]));
for(const[id,newline]of[['CR','\r'],['LS','\u2028'],['PS','\u2029']])test(`edge · comment terminator ${id} in import/export and lexical head`,()=>{
 const report=auditaFonts({
  'src/App.jsx':`// head${newline}import Frame from './barrel.js';`+`export const App=()=> <Frame><h2/></Frame>`,
  'src/barrel.js':`import {Shell} from // link${newline}'./Shell.jsx';export default // default${newline}(Shell);`,
  'src/Shell.jsx':'export const Shell=({children})=><UniversalPage>{children}</UniversalPage>;'
 });
 assert.deepEqual(report.issues.map(issue=>issue.code),['MC2']);
});
