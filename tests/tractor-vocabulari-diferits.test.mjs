/**
 * tests/tractor-vocabulari-diferits.test.mjs — Onada R29 · La porta de vocabulari
 * (tooling/gates/tractor-vocabulari.mjs) sobre arbres fingits en una carpeta temporal i sobre el
 * worktree de veres.
 *
 *   · css-diferit-04 · Una classe que només declara un full diferit (src/css/diferit-<clau>.css) només
 *     es pot pintar en un fitxer que l'adopta amb useFullDiferit(ref, '<clau>', <import ?inline>) o en
 *     l'herència tancada (els detalls del catàleg dins d'<Especimen>). La clau ha de casar amb el full,
 *     cada full ha de tindre adoptant, no pot entrar per index.css i va dins de @layer components.
 *   · vocab-comentaris · Un `.x` escrit dins d'un comentari CSS no declara cap classe.
 *   · vocab-abast-apps · src/apps és dins de l'abast i el vocabulari d'arrencada és la cadena d'@import
 *     d'index.css (que porta apps.css), no una llista a mà.
 *
 * Ús:  node --test tests/tractor-vocabulari-diferits.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { escaneja, fullsArrencada, senseComentaris, teReglesForaDeCapa } from '../tooling/gates/tractor-vocabulari.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRACTOR = path.join(ROOT, 'tooling/gates/tractor-vocabulari.mjs');

const INDEX = `@layer reset, sdp, legacy, components, utilities;
@import url('./components.css');
@import url('../apps/plataforma/apps.css') layer(components);
@import url('./tipografia-estreta.css');
/* .comentari-fantasma: un comentari no declara cap classe */
`;

const BASE = Object.freeze({
  'src/css/index.css': INDEX,
  'src/css/components.css': `@layer components {
  .sdp-boto { color: var(--sdp-text-cos); }
  .sdp-comu-i-diferit { gap: var(--sdp-space-2); }
}
/* La mesura és de vores físiques (getBoundingClientRect().left i .right). */
`,
  'src/css/tipografia-estreta.css': `@import url('./nivell2.css');
@layer components { .sdp-estreta { font-stretch: 75%; } }
`,
  'src/css/nivell2.css': '@layer components { .sdp-nivell2 { margin: 0; } }\n',
  'src/apps/plataforma/apps.css': '.sdp-app-fitxa { display: grid; }\n.sdp-app-fitxa__titol { margin: 0; }\n',
  'src/css/diferit-refranyer.css': `@layer components {
  .sdp-refranyer__ambit { gap: var(--sdp-space-2); }
  .sdp-comu-i-diferit { gap: var(--sdp-space-2); }
}
`,
  'src/css/diferit-especimens.css': '@layer components { .sdp-especimen__cap { display: flex; } }\n',
  'src/components/patrimoni/RefranyerSonorCard.jsx': `import { useRef } from 'react';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssRefranyer from '../../css/diferit-refranyer.css?inline';
export default function RefranyerSonorCard() {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'refranyer', cssRefranyer);
  return <section ref={arrel} className="sdp-refranyer__ambit sdp-boto">x</section>;
}
`,
  'src/sections/disseny/cataleg/Especimen.jsx': `import { useRef } from 'react';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssEspecimens from '../../../css/diferit-especimens.css?inline';
export default function Especimen({ children }) {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'especimens', cssEspecimens);
  return <article ref={arrel} className="sdp-especimen__cap">{children}</article>;
}
`,
  'src/sections/disseny/cataleg/detalls/EspecimenProva.jsx': 'export const EspecimenProva = () => <div className="sdp-especimen__cap" />;\n',
});

/** Arbre fingit: BASE amb `extra` (un valor null lleva el fitxer). Torna l'arrel temporal. */
function arbreFingit(t, extra = {}) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-vocab-diferits-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  for (const [rel, text] of Object.entries({ ...BASE, ...extra })) {
    if (text === null) continue;
    const abs = path.join(arrel, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  return arrel;
}

const per = (infraccions, regla) => infraccions
  .filter((i) => i.regla === regla)
  .map((i) => `${i.fitxer.split(path.sep).join('/')}|${i.token}`)
  .sort();

test('arbre base: cap infracció, fora del full de secció de src/apps (deute V3 com AppGridShell.css)', (t) => {
  const { infraccions } = escaneja({ arrel: arbreFingit(t) });
  assert.deepEqual(infraccions.filter((i) => i.regla !== 'css-de-seccio').map((i) => `${i.regla}|${i.fitxer}|${i.token}`), []);
  assert.deepEqual(per(infraccions, 'css-de-seccio'), ['src/apps/plataforma/apps.css|src/apps/plataforma/apps.css']);
});

test('css-diferit-04 · una classe només diferida en un fitxer que no adopta el full és V4', (t) => {
  const arrel = arbreFingit(t, {
    'src/components/patrimoni/ProvaOrfe.jsx': 'export const ProvaOrfe = () => <p className="sdp-refranyer__ambit sdp-comu-i-diferit sdp-boto" />;\n',
  });
  const { infraccions } = escaneja({ arrel });
  // sdp-comu-i-diferit també és a l'arrencada: no és només diferida.
  assert.deepEqual(per(infraccions, 'classe-diferida-orfe'), ['src/components/patrimoni/ProvaOrfe.jsx|sdp-refranyer__ambit']);
  assert.deepEqual(per(infraccions, 'classe-forastera'), [], 'la classe és al vocabulari: V1 no la veu, per això cal V4');
});

test('css-diferit-04 · la clau ha de casar amb el full ?inline importat de src/css (si no, V5 i la classe queda orfe)', (t) => {
  const arrel = arbreFingit(t, {
    'src/components/patrimoni/ClauCreuada.jsx': `import { useRef } from 'react';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssRefranyer from '../../css/diferit-refranyer.css?inline';
export default function ClauCreuada() {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'especimens', cssRefranyer);
  return <p ref={arrel} className="sdp-refranyer__ambit" />;
}
`,
    'src/components/patrimoni/ClauVariable.jsx': `import { useRef } from 'react';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssRefranyer from '../../css/diferit-refranyer.css?inline';
const CLAU = 'refranyer';
export default function ClauVariable() {
  const arrel = useRef(null);
  useFullDiferit(arrel, CLAU, cssRefranyer);
  return <p ref={arrel} className="sdp-refranyer__ambit" />;
}
`,
    'src/components/patrimoni/CopiaDelFull.jsx': `import { useRef } from 'react';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssCopia from './copia/diferit-refranyer.css?inline';
export default function CopiaDelFull() {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'refranyer', cssCopia);
  return <p ref={arrel} className="sdp-refranyer__ambit" />;
}
`,
  });
  const { infraccions } = escaneja({ arrel });
  assert.deepEqual(per(infraccions, 'full-diferit-trencat'), [
    'src/components/patrimoni/ClauCreuada.jsx|clau:especimens≠full:refranyer',
    'src/components/patrimoni/ClauVariable.jsx|clau:?≠full:refranyer',
    'src/components/patrimoni/CopiaDelFull.jsx|clau:refranyer≠full:?',
  ]);
  assert.deepEqual(per(infraccions, 'classe-diferida-orfe'), [
    'src/components/patrimoni/ClauCreuada.jsx|sdp-refranyer__ambit',
    'src/components/patrimoni/ClauVariable.jsx|sdp-refranyer__ambit',
    'src/components/patrimoni/CopiaDelFull.jsx|sdp-refranyer__ambit',
  ]);
});

test('css-diferit-04 · l’herència és tancada: només els detalls del catàleg i només per a especimens', (t) => {
  const arrel = arbreFingit(t, {
    'src/sections/disseny/AltreLloc.jsx': 'export const AltreLloc = () => <div className="sdp-especimen__cap" />;\n',
    'src/sections/disseny/cataleg/detalls/EspecimenRefrany.jsx': 'export const EspecimenRefrany = () => <div className="sdp-refranyer__ambit" />;\n',
  });
  const { infraccions } = escaneja({ arrel });
  assert.deepEqual(per(infraccions, 'classe-diferida-orfe'), [
    'src/sections/disseny/AltreLloc.jsx|sdp-especimen__cap',
    'src/sections/disseny/cataleg/detalls/EspecimenRefrany.jsx|sdp-refranyer__ambit',
  ]);
});

test('css-diferit-04 · V5: un full diferit a l’arrencada, sense adoptant o amb regles fora de @layer components', (t) => {
  const arrel = arbreFingit(t, {
    'src/css/index.css': `${INDEX}@import url('./diferit-refranyer.css');\n`,
    'src/css/diferit-nou.css': '@layer components { .sdp-nou { gap: var(--sdp-space-2); } }\n',
    'src/css/diferit-solt.css': '.sdp-solt { gap: var(--sdp-space-2); }\n@layer components { .sdp-solt__dins { gap: 0; } }\n',
    'src/components/patrimoni/ProvaOrfe.jsx': 'export const ProvaOrfe = () => <p className="sdp-refranyer__ambit" />;\n',
  });
  const { infraccions } = escaneja({ arrel });
  assert.deepEqual(per(infraccions, 'full-diferit-trencat'), [
    'src/css/diferit-nou.css|nou:sense-adoptant',
    'src/css/diferit-refranyer.css|refranyer:a-l-arrencada',
    'src/css/diferit-solt.css|solt:fora-de-capa',
    'src/css/diferit-solt.css|solt:sense-adoptant',
  ]);
  // Si el full entra per index.css, les seues classes són d'arrencada: el fitxer que les pinta ja no és orfe.
  assert.deepEqual(per(infraccions, 'classe-diferida-orfe'), []);
});

test('vocab-comentaris · un `.x` de dins d’un comentari CSS no entra al vocabulari', (t) => {
  assert.equal(senseComentaris('/* .a */ .b { } /* .c\n .d */'), ' .b { } ');
  const arrel = arbreFingit(t, {
    'src/components/Prova.jsx': `export const Prova = () => (
  <div className="sdp-boto">
    <p className="right" />
    <p className="comentari-fantasma" />
  </div>
);
`,
  });
  const { infraccions, vocab } = escaneja({ arrel });
  assert.deepEqual(per(infraccions, 'classe-forastera'), ['src/components/Prova.jsx|comentari-fantasma', 'src/components/Prova.jsx|right']);
  for (const fantasma of ['right', 'left', 'comentari-fantasma']) assert.equal(vocab.has(fantasma), false, fantasma);
  assert.equal(vocab.has('sdp-boto'), true);
});

test('vocab-abast-apps · src/apps és a l’abast i el vocabulari és la cadena d’@import d’index.css', (t) => {
  const arrel = arbreFingit(t, {
    'src/apps/plataforma/PortalApps.jsx': `export const PortalApps = () => (
  <article className="sdp-app-fitxa">
    <h3 className="sdp-app-fitxa__titul">x</h3>
    <p className="sdp-estreta sdp-nivell2 sdp-fora-de-cadena" />
  </article>
);
`,
    'src/css/fora-de-cadena.css': '@layer components { .sdp-fora-de-cadena { margin: 0; } }\n',
  });
  const { infraccions, arrencada } = escaneja({ arrel });
  assert.deepEqual(arrencada, [
    'src/css/index.css', 'src/css/components.css', 'src/apps/plataforma/apps.css',
    'src/css/tipografia-estreta.css', 'src/css/nivell2.css',
  ]);
  // sdp-app-fitxa (apps.css), sdp-estreta i sdp-nivell2 (cadena, fora de l'abast) passen;
  // l'errada de nom i el full que index.css no porta, no.
  assert.deepEqual(per(infraccions, 'classe-forastera'), [
    'src/apps/plataforma/PortalApps.jsx|sdp-app-fitxa__titul',
    'src/apps/plataforma/PortalApps.jsx|sdp-fora-de-cadena',
  ]);
});

test('fullsArrencada: un @import cap a un full absent, i el CLI falla tancat', (t) => {
  const arrel = arbreFingit(t, { 'src/css/index.css': `${INDEX}@import "./absent.css";\n` });
  assert.deepEqual(fullsArrencada(arrel).absents, ['src/css/absent.css']);
  const r = spawnSync(process.execPath, [TRACTOR], { cwd: arrel, encoding: 'utf8', timeout: 60_000 });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /PARAT\. No es troben els fulls de la cadena d'arrencada següents: src\/css\/absent\.css/);
});

test('CLI: V4 és llei dura (una classe diferida orfe nova para la porta) i l’arbre net passa', (t) => {
  const deute = JSON.stringify({ 'css-de-seccio': { max: 1, identitats: ['css-de-seccio|src/apps/plataforma/apps.css|src/apps/plataforma/apps.css'] } });
  const net = arbreFingit(t, { '.agents/deute/.vocabulari-deute.json': deute });
  const verd = spawnSync(process.execPath, [TRACTOR], { cwd: net, encoding: 'utf8', timeout: 60_000 });
  assert.equal(verd.status, 0, verd.stderr);
  const orfe = arbreFingit(t, {
    '.agents/deute/.vocabulari-deute.json': deute,
    'src/components/patrimoni/ProvaOrfe.jsx': 'export const ProvaOrfe = () => <p className="sdp-refranyer__ambit" />;\n',
  });
  const roig = spawnSync(process.execPath, [TRACTOR], { cwd: orfe, encoding: 'utf8', timeout: 60_000 });
  assert.equal(roig.status, 1);
  assert.match(roig.stderr, /LLEI DURA · classe-diferida-orfe: 1 infraccions NOVES/);
  assert.match(roig.stderr, /classe-diferida-orfe\|src\/components\/patrimoni\/ProvaOrfe\.jsx\|sdp-refranyer__ambit/);
});

test('worktree de veres: cap classe diferida orfe ni cap full diferit trencat, i la porta no és buida', () => {
  const { infraccions, nomesDiferides, diferits, arrencada } = escaneja({ arrel: ROOT });
  assert.deepEqual(infraccions.filter((i) => i.regla === 'classe-diferida-orfe' || i.regla === 'full-diferit-trencat')
    .map((i) => `${i.regla}|${i.fitxer}:${i.linia}|${i.token}`), []);
  assert.ok(diferits.length >= 5, 'els cinc fulls diferits de src/css');
  for (const { clau, full } of diferits) {
    assert.equal(arrencada.includes(full), false, `${full} no entra per index.css`);
    assert.ok([...nomesDiferides.values()].some((claus) => claus.has(clau)), `${clau}: té classes que només declara el seu full`);
  }
  assert.ok(arrencada.includes('src/apps/plataforma/apps.css'), 'apps.css és a la cadena d’arrencada');
});

test('guarda barata dels fulls diferits de veres: dins de @layer components, sense html ni body i cada :root amb el seu :host()', () => {
  const { diferits } = escaneja({ arrel: ROOT });
  for (const { full } of diferits) {
    const css = fs.readFileSync(path.join(ROOT, full), 'utf8');
    assert.equal(teReglesForaDeCapa(css), false, `${full}: tot dins de @layer components`);
    for (const [, preludi] of senseComentaris(css).matchAll(/([^{};]+)\{/g)) {
      const selector = preludi.trim();
      if (selector.startsWith('@')) continue;
      assert.doesNotMatch(selector, /(^|[\s,>+~(])(?:html|body)(?=$|[\s,.:#[>+~)])/, `${full}: «${selector}» depén d'un ancestre de fora de l'ombra`);
      if (selector.includes(':root')) assert.match(selector, /:host\(/, `${full}: «${selector}» porta el seu bessó :host()`);
      if (selector.includes(':host')) assert.match(selector, /:root/, `${full}: «${selector}» porta el seu bessó :root`);
    }
  }
});


test('R29-D1: les claus en valors CSS no ixen de la capa', () => {
  for (const valor of ['"}"', '"{"', "'{'", "'}'", 'url(data:text/plain,{})']) {
    const css = '@layer components { .sdp-prova::after { content: ' + valor + '; } }';
    assert.equal(teReglesForaDeCapa(css), false, valor);
  }
});

test('R29-D1: un comentari dins d’una cadena no amaga una regla fora de capa', () => {
  const css = '@layer components { .sdp-prova { content: "/*"; } } .sdp-fora { content: "*/"; }';
  assert.equal(teReglesForaDeCapa(css), true);
});

test('R29-D1: comments i cadenes amb claus no invaliden blocs ni capes consecutives', () => {
  const css = '/* fora } */ @layer components { .a { content: "/*}*/"; } } /* separador { */ @layer components { .b { content: "{"; } }';
  assert.equal(teReglesForaDeCapa(css), false);
  assert.equal(teReglesForaDeCapa(css + ' .sdp-fora { display: block; }'), true);
});

test('R29-D1: un salt cru en una cadena no amaga regles fora de capa; les continuacions escapades són vàlides', () => {
  for (const cometa of ['"', "'"]) {
    for (const salt of ['\n', '\r', '\f', '\r\n']) {
      const css = `@layer components { .a { content: ${cometa}${salt} } } .sdp-fora { color: red; } ${cometa} }}`;
      assert.equal(teReglesForaDeCapa(css), true, `salt cru ${JSON.stringify(salt)} amb ${cometa}`);
      const continuacio = `@layer components { .a { content: ${cometa}ab\\${salt}cd${cometa}; } }`;
      assert.equal(teReglesForaDeCapa(continuacio), false, `continuació ${JSON.stringify(salt)} amb ${cometa}`);
    }
  }
});


test('R29-D1: URL sense cometes conserva marques de comentari, escapes i límits d’identificador', () => {
  const valors = [
    'url(data:text/plain,/*)',
    'URL(data:text/plain,/*})',
    'UrL(data:text/plain,{/*})',
    String.raw`u\72l(data:text/plain,/*)`,
    String.raw`\75rl(data:text/plain,/*)`,
    String.raw`url(data:text/plain,\))`,
    String.raw`url(data:text/plain,\7d)`,
    'url("data:text/plain,/*}")',
    'myurl(a/* } */b)',
    'my-url(a/* } */b)',
  ];
  for (const valor of valors) {
    const css = `@layer components { .a { background: ${valor}; } }`;
    assert.equal(teReglesForaDeCapa(css), false, valor);
    assert.equal(teReglesForaDeCapa(css + ' .sdp-fora { color: red; }'), true, valor);
  }
  for (const valor of ['url(data:text/plain,/*', 'url(a b)', 'url(a(b)', 'url(a\\\nb)']) {
    assert.equal(teReglesForaDeCapa(`@layer components { .a { background: ${valor}; } }`), true, valor);
  }
});
