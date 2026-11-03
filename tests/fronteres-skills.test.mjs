/**
 * Porta Fronteres de Skills (P1-30) · tooling/brain/fronteres-skills.mjs
 *
 * B10-GOVERN §2.2d (marató 261101_2143, torn_3d9af83b). Fixtures completes a os.tmpdir()
 * (tres skills sintètiques amb el frontmatter que exigix inventari(), tokens.css,
 * package.json i els quatre fitxers .agents que llig cataleg_skills.mjs), un cas mínim
 * per regla (cau i, corregit, passa), el cicle de vida del deute i dues proves sobre
 * l'arbre real: (A) cap violació nova i (B) cap deute ranci (D-7: el segell del Mestre i
 * la retirada de les entrades van en el mateix lot).
 *
 * Ús:  node --test tests/fronteres-skills.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { arrelSegura } from '../tooling/lib/arrel.mjs';
import {
  DEUTE_ACCEPTAT, ESQUEMA, REGLES, auditaSkills, empremta, informe, main, motiuDeute, tokensDeclarats
} from '../tooling/brain/fronteres-skills.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODUL = path.join(ROOT, 'tooling/brain/fronteres-skills.mjs');

const TOKENS_CSS = [
  ':root {',
  '  --sdp-blanc-pur: #ffffff;',
  '  --sdp-fons-targeta: var(--sdp-blanc-pur);',
  '  --sdp-fons-lectura: #f7f6f3;',
  '  --sdp-ombra-1: 0 1px 3px rgba(14, 13, 12, 0.05);',
  '  /* --sdp-fals: #000000; un comentari no declara res */',
  '  --sdp-cicle-a: var(--sdp-cicle-b);',
  '  --sdp-cicle-b: var(--sdp-cicle-a);',
  '}',
  '[data-theme="dark"] {',
  '  --sdp-fons-targeta: #1c1b1a;',
  '}',
  ''
].join('\n');

/** SKILL.md sintètica amb el frontmatter mínim d'inventari(). llig/escriu = null → la clau no hi és. */
function skill(id, cos, { llig = ['docs/llig.md'], escriu = ['docs/escriu'] } = {}) {
  const llista = (clau, valors) => (valors === null ? [] : [`${clau}:`, ...valors.map((p) => `  - ${p}`)]);
  return [
    '---', `name: ${id}`, 'type: skill', 'status: actiu', `description: Skill sintètica ${id}.`,
    'triggers_on:', `  - ${id}`, ...llista('contracte.llig', llig), ...llista('contracte.escriu', escriu), '---',
    '', `# ${id}`, '', cos, '', '## Vincles', '- [[00_INDEX_SKILLS]]', ''
  ].join('\n');
}

const BASE = {
  'sdp-alfa': 'Executa `node tooling/gates/porta.mjs` i després `npm run porta`.\n\n```sh\nnpm run porta\n```',
  'sdp-beta': 'El fons de lectura és `var(--sdp-fons-lectura)` (`#f7f6f3`) i la targeta, `var(--sdp-fons-targeta)` (`#FFFFFF`).',
  'sdp-gamma': 'Mai escrigues `#fff` ni `border-radius: 5px;` a mà.\n\nNomena el Consell amb `node -e "console.log(require(\'./.agents/consell.json\').membres)"`.'
};

function fixture(t, { scripts = { porta: 'node tooling/gates/porta.mjs' } } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-fronteres-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const escriu = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  for (const f of ['PROFILE.md', 'AGENTS.md', 'BASELINE.md']) escriu(`.agents/${f}`, `# ${f}\n`);
  escriu('.agents/consell.json', '{"membres":[]}\n');
  escriu('src/css/tokens.css', TOKENS_CSS);
  // Ordenat abans que tokens.css: el tema clar és la primera declaració de tokens.css.
  escriu('src/css/altres.css', ':root { --sdp-fons-lectura: #000000; --sdp-propi: 4px; }\n');
  escriu('package.json', JSON.stringify({ private: true, scripts }));
  escriu('tooling/gates/porta.mjs', 'export default 0;\n');
  escriu('docs/llig.md', '# llig\n');
  escriu('docs/escriu/nota.md', '# escriu\n');
  escriu('.agents/skills/sdp-alfa/SKILL.md', skill('sdp-alfa', BASE['sdp-alfa']));
  escriu('.agents/skills/sdp-beta/SKILL.md', skill('sdp-beta', BASE['sdp-beta']));
  escriu('.agents/skills/sdp-gamma/SKILL.md', skill('sdp-gamma', BASE['sdp-gamma'], { llig: ['docs/llig.md', '.agents/consell.json'] }));
  const cas = (id, cos, opcions) => escriu(`.agents/skills/${id}/SKILL.md`, skill(id, cos, opcions));
  return { root, escriu, cas };
}

const audita = (root, deute = []) => auditaSkills(root, { deute });
const detalls = (r, id) => r.skills.find((s) => s.id === id).violacions.map((v) => `${v.regla} ${v.detall}`).sort();
const captura = () => {
  const linies = [];
  return { linies, text: () => linies.join('\n'), log: (s) => linies.push(String(s)), error: (s) => linies.push(String(s)) };
};

test('fixture neta: tres skills, cap violació, classe i motors', (t) => {
  const { root } = fixture(t);
  const r = audita(root);
  assert.equal(r.esquema, ESQUEMA);
  assert.equal(r.total, 3);
  assert.deepEqual(r.noves, []);
  assert.equal(r.valid, true);
  const alfa = r.skills.find((s) => s.id === 'sdp-alfa');
  assert.equal(alfa.classe, 'procediment_amb_motor');
  assert.deepEqual(alfa.motors, ['tooling/gates/porta.mjs']);
  assert.equal(r.skills.find((s) => s.id === 'sdp-beta').classe, 'procediment');
});

test('F1: contracte buit, no canònic o absent cau; el corregit passa', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f1', 'Cos.', { llig: null, escriu: ['../fora', '/etc', 'docs/absent.md'] });
  assert.deepEqual(detalls(audita(root), 'sdp-f1'), [
    'F1 contracte.escriu: absent docs/absent.md',
    'F1 contracte.escriu: camí no canònic ../fora',
    'F1 contracte.escriu: camí no canònic /etc',
    'F1 contracte.llig absent o buit'
  ]);
  cas('sdp-f1', 'Cos.', { llig: ['docs/llig.md'], escriu: ['docs/escriu/'] });
  assert.deepEqual(detalls(audita(root), 'sdp-f1'), []);
});

test('F2: motor absent i script absent (també dins d\'un bloc de codi) caen; el corregit passa', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f2', 'Executa `node tooling/gates/absent.mjs`.\n\n```sh\nnpm run inexistent\nnpm run constructor\n```');
  assert.deepEqual(detalls(audita(root), 'sdp-f2'), [
    'F2 motor absent tooling/gates/absent.mjs',
    'F2 script absent constructor',
    'F2 script absent inexistent'
  ]);
  cas('sdp-f2', 'Executa `node tooling/gates/porta.mjs`.\n\n```sh\nnpm run porta\n```');
  assert.deepEqual(detalls(audita(root), 'sdp-f2'), []);
});

test('F2: el motor ha de ser fitxer regular canònic, sense eixida de l’arrel ni symlinks', (t) => {
  const { root, cas } = fixture(t);
  const exterior = fs.mkdtempSync(path.join(path.dirname(root), 'sdp-fronteres-exterior-'));
  t.after(() => fs.rmSync(exterior, { recursive: true, force: true }));
  fs.writeFileSync(path.join(exterior, 'fora.mjs'), 'export default 0;\n');
  fs.mkdirSync(path.join(root, 'tooling/gates/directori.mjs'));
  fs.symlinkSync(path.join(exterior, 'fora.mjs'), path.join(root, 'tooling/gates/enllac.mjs'));
  const motors = [
    `tooling/../../${path.basename(exterior)}/fora.mjs`,
    'tooling/gates/directori.mjs',
    'tooling/gates/enllac.mjs'
  ];
  const diagnostics = motors.map((motor, i) => {
    cas(`sdp-motor-${i}`, `Executa \`node ${motor}\`.`);
    return detalls(audita(root), `sdp-motor-${i}`).map(d => d.slice(0, 2));
  });
  assert.deepEqual(diagnostics, [['F2'], ['F2'], ['F2']]);
  cas('sdp-motor-regular', 'Executa `node tooling/gates/porta.mjs`.');
  assert.deepEqual(detalls(audita(root), 'sdp-motor-regular'), []);
});

test('F3: una ordre recursiva cau; l\'exclusió de 01_produccio i la prohibició l\'eximixen; el bloc de codi també compta', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f3-ordre', "Neteja amb `find _wiki_de_poble -name '*.md' -exec sed -i 's/a/b/' {} +`.");
  cas('sdp-f3-exclou', "Neteja amb `find _wiki_de_poble -not -path '*/01_produccio/*' -name '*.md' -exec sed -i 's/a/b/' {} +`.");
  cas('sdp-f3-prohibicio', "Mai `sed -i 's/a/b/' fitxer.md` sobre la Wiki.");
  cas('sdp-f3-codi', "Exemple:\n\n```sh\nperl -0777 -pi -e 's/a/b/' x.md\nls | xargs -0 rm\n```");
  const r = audita(root);
  assert.deepEqual(detalls(r, 'sdp-f3-ordre').map((d) => d.slice(0, 2)), ['F3']);
  assert.deepEqual(detalls(r, 'sdp-f3-exclou'), []);
  assert.deepEqual(detalls(r, 'sdp-f3-prohibicio'), [], 'una prohibició no és una ordre');
  assert.deepEqual(detalls(r, 'sdp-f3-codi').map((d) => d.slice(0, 2)), ['F3', 'F3']);
  cas('sdp-f3-ordre', "Neteja amb `find _wiki_de_poble -name '*.md' -print`.");
  assert.deepEqual(detalls(audita(root), 'sdp-f3-ordre'), []);
});

// CORRECTOR B10G-B-ARB-02: cada família d'F3 té el seu cas sol (abans sed només caïa via find -exec).
test('F3: cada ordre compta sola, a la prosa i al codi (sed -i, sed -E -i, sed --in-place, find -delete); sed -n i find -print no', (t) => {
  const { root, cas } = fixture(t);
  const ordres = {
    'sed-i': "sed -i 's/a/b/' x.md",
    'sed-e-i': "sed -E -i 's/a+/b/' x.md",
    'sed-in-place': "sed --in-place 's/a/b/' x.md",
    'find-delete': "find _wiki_de_poble -name '*.tmp' -delete",
    'sed-n': "sed -n '1p' x.md",
    'find-print': "find _wiki_de_poble -name '*.tmp' -print"
  };
  for (const [nom, ordre] of Object.entries(ordres)) {
    cas(`sdp-f3-prosa-${nom}`, `Executa \`${ordre}\` en acabar.`);
    cas(`sdp-f3-codi-${nom}`, `Exemple:\n\n\`\`\`sh\n${ordre}\n\`\`\``);
  }
  const r = audita(root);
  for (const nom of ['sed-i', 'sed-e-i', 'sed-in-place', 'find-delete']) {
    assert.deepEqual(detalls(r, `sdp-f3-prosa-${nom}`).map((d) => d.slice(0, 2)), ['F3'], `prosa ${nom}`);
    assert.deepEqual(detalls(r, `sdp-f3-codi-${nom}`).map((d) => d.slice(0, 2)), ['F3'], `codi ${nom}`);
  }
  for (const nom of ['sed-n', 'find-print']) {
    assert.deepEqual(detalls(r, `sdp-f3-prosa-${nom}`), [], `prosa ${nom}`);
    assert.deepEqual(detalls(r, `sdp-f3-codi-${nom}`), [], `codi ${nom}`);
  }
});

// CORRECTOR B10G-B-ARB-01: la menció de 01_produccio no eximix; només una exclusió explícita al mateix tros.
test('F3: escriure dins de 01_produccio o només nomenar-la cau; -not -path, ! -path, -prune, --exclude-dir= i grep -v eximixen', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f3-dins-01', "Neteja: `find _wiki_de_poble/04_escriptori/01_produccio -name '*.md' -exec sed -i 's/a/b/' {} +`.");
  cas('sdp-f3-esborra-01', "Buida: `find _wiki_de_poble -path '*/01_produccio/*' -delete`.");
  cas('sdp-f3-mencio-01', "Neteja: `find _wiki_de_poble -name '*.md' -exec sed -i 's/a/b/' {} +` (la carpeta 01_produccio és zona humana).");
  cas('sdp-f3-codi-01', "```sh\nsed -i 's/a/b/' _wiki_de_poble/04_escriptori/01_produccio/*.md\n```");
  cas('sdp-f3-prune', "Neteja: `find _wiki_de_poble -path '*/01_produccio' -prune -o -name '*.md' -exec sed -i 's/a/b/' {} +`.");
  cas('sdp-f3-exclude-dir', "```sh\ngrep -rl --exclude-dir=01_produccio 'vell' _wiki_de_poble | xargs sed -i 's/vell/nou/'\n```");
  cas('sdp-f3-grep-v', "Neteja: `find _wiki_de_poble -name '*.md' | grep -v 01_produccio | xargs perl -pi -e 's/a/b/'`.");
  cas('sdp-f3-exclamacio', "Buida: `find _wiki_de_poble ! -path \"*/01_produccio/*\" -name '*.tmp' -delete`.");
  const r = audita(root);
  for (const id of ['sdp-f3-dins-01', 'sdp-f3-esborra-01', 'sdp-f3-mencio-01', 'sdp-f3-codi-01']) {
    assert.deepEqual(detalls(r, id).map((d) => d.slice(0, 2)), ['F3'], `${id}: nomenar 01_produccio no és excloure-la`);
  }
  for (const id of ['sdp-f3-prune', 'sdp-f3-exclude-dir', 'sdp-f3-grep-v', 'sdp-f3-exclamacio']) {
    assert.deepEqual(detalls(r, id), [], `${id}: exclusió explícita`);
  }
});

test('F4: un token no declarat cau (un comentari CSS no declara); el declarat passa', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f4-token', 'Usa `var(--sdp-inexistent)` i `var(--sdp-fals)`.');
  assert.deepEqual(detalls(audita(root), 'sdp-f4-token'), ['F4 token no declarat --sdp-fals', 'F4 token no declarat --sdp-inexistent']);
  cas('sdp-f4-token', 'Usa `var(--sdp-fons-lectura)` i `var(--sdp-propi)`.');
  assert.deepEqual(detalls(audita(root), 'sdp-f4-token'), []);
});

test('F4: el literal igual al valor (resolt, tema clar) del token que la línia nomena passa; sense token, cau', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f4-igual', 'La lectura és `var(--sdp-fons-lectura)` (`#f7f6f3`); la targeta, `var(--sdp-fons-targeta)` (`#FFFFFF`).');
  cas('sdp-f4-sol', 'El fons és `#f7f6f3`.');
  cas('sdp-f4-fosc', 'La targeta és `var(--sdp-fons-targeta)` (`#1c1b1a`).');
  const r = audita(root);
  assert.deepEqual(detalls(r, 'sdp-f4-igual'), []);
  assert.deepEqual(detalls(r, 'sdp-f4-sol'), ['F4 valor CSS literal #f7f6f3']);
  assert.deepEqual(detalls(r, 'sdp-f4-fosc'), ['F4 valor CSS literal #1c1b1a'], 'el valor del tema fosc no és el del token');
});

test('F4: les mides de disseny queden fora; radi i ombra literals caen, i l\'ombra compta una sola vegada', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f4-mides', 'Amplària `max-width: 800px`, alçària `min-height: 480px` i `padding: 0 0 env(safe-area-inset-bottom, 0px)`.');
  cas('sdp-f4-radi', 'Cantons `border-radius: 32px` i ombra `box-shadow: 0 4px 20px rgba(0,0,0,0.03)`.');
  const r = audita(root);
  assert.deepEqual(detalls(r, 'sdp-f4-mides'), []);
  assert.deepEqual(detalls(r, 'sdp-f4-radi'), [
    'F4 valor CSS literal border-radius: 32px',
    'F4 valor CSS literal box-shadow: 0 4px 20px rgba(0,0,0,0.03)'
  ]);
});

test('F4: una línia descriptiva amb «ni» no és una prohibició; una línia «Mai …» sí', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-f4-ni', "La lectura no és `rgba(0,0,0,.1)`, ni tampoc el fons de l'app.");
  cas('sdp-f4-mai', 'Mai `#fff` ni `border-radius: 5px;` escrits a mà.');
  const r = audita(root);
  assert.deepEqual(detalls(r, 'sdp-f4-ni'), ['F4 valor CSS literal rgba(0,0,0,.1)']);
  assert.deepEqual(detalls(r, 'sdp-f4-mai'), []);
});

test('F5: el que una ordre llig fora del contracte cau; dins del contracte passa', (t) => {
  const { root, cas, escriu } = fixture(t);
  escriu('_wiki_de_poble/10_actes/a.md', '# a\n');
  cas('sdp-f5', [
    'Consell: `node -e "console.log(require(\'./.agents/consell.json\').membres)"`.',
    "Estat: `node -e \"readFileSync('.agents/ESTAT.md')\"`.",
    'Actes: `cat _wiki_de_poble/10_actes/a.md`.'
  ].join('\n'));
  assert.deepEqual(detalls(audita(root), 'sdp-f5'), [
    'F5 lectura fora de contracte.llig .agents/ESTAT.md',
    'F5 lectura fora de contracte.llig .agents/consell.json',
    'F5 lectura fora de contracte.llig _wiki_de_poble/10_actes/a.md'
  ]);
  cas('sdp-f5', 'Consell: `node -e "console.log(require(\'./.agents/consell.json\').membres)"`.\nActes: `cat _wiki_de_poble/10_actes/a.md`.',
    { llig: ['.agents/consell.json', '_wiki_de_poble/10_actes'], escriu: ['docs/escriu'] });
  assert.deepEqual(detalls(audita(root), 'sdp-f5'), []);
});

// CORRECTOR B10G-B-ARB-03: F4-token i F5 també miren els blocs de codi; les tanques només tanquen amb el mateix caràcter.
test('F4-token i F5 també dins dels blocs de codi; una línia ``` no tanca un bloc ~~~', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-codi-token', 'Exemple:\n\n```css\n.x { color: var(--sdp-inexistent); }\n```');
  cas('sdp-codi-lectura', 'Exemple:\n\n```sh\ncat .agents/ESTAT.md\n```');
  cas('sdp-tanques', 'Exemple de markdown:\n\n~~~md\n```css\n`#123456` dins del bloc\n```\n~~~');
  const r = audita(root);
  assert.deepEqual(detalls(r, 'sdp-codi-token'), ['F4 token no declarat --sdp-inexistent']);
  assert.deepEqual(detalls(r, 'sdp-codi-lectura'), ['F5 lectura fora de contracte.llig .agents/ESTAT.md']);
  assert.deepEqual(detalls(r, 'sdp-tanques'), [], 'el ``` interior és contingut del bloc ~~~: `#123456` no és prosa');
});

// CORRECTOR B10G-B-ARB-04: `node ./tooling/…` és un motor; F4 veu cada declaració del tros, no només la primera.
test('F2 amb `node ./tooling/…`; F4 amb declaracions després d\'un selector o d\'una altra declaració', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-punt-barra', 'Executa `node ./tooling/gates/absent.mjs` i `node ./tooling/gates/porta.mjs`.');
  cas('sdp-f4-selector', 'Capçalera `.page-title { border-radius: 32px; }`.');
  cas('sdp-f4-segona', 'Reset `padding: 0; border-radius: 32px;` i `margin: 0; box-shadow: var(--sdp-ombra-1);`.');
  cas('sdp-f4-mixt', 'Targeta `.x { color: #123456; box-shadow: 0 0 1px #000 }`.');
  const r = audita(root);
  assert.deepEqual(detalls(r, 'sdp-punt-barra'), ['F2 motor absent tooling/gates/absent.mjs']);
  assert.deepEqual(r.skills.find((s) => s.id === 'sdp-punt-barra').motors.sort(), ['tooling/gates/absent.mjs', 'tooling/gates/porta.mjs']);
  assert.deepEqual(detalls(r, 'sdp-f4-selector'), ['F4 valor CSS literal border-radius: 32px']);
  assert.deepEqual(detalls(r, 'sdp-f4-segona'), ['F4 valor CSS literal border-radius: 32px']);
  assert.deepEqual(detalls(r, 'sdp-f4-mixt'), ['F4 valor CSS literal #123456', 'F4 valor CSS literal box-shadow: 0 0 1px #000'],
    'la declaració compta una vegada (no el seu #000); el color solt, a part');
});

test('avisos A1: un camí fora del contracte amb verb de lectura o escriptura avisa, però no bloqueja', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-a1', 'Llig `_wiki_de_poble/02_saber/fora.md` abans de començar.\n\nActualitza `src/fora.js` en acabar.');
  const r = audita(root);
  assert.deepEqual(r.avisos.filter((a) => a.skill === 'sdp-a1').map((a) => `${a.tipus} ${a.cami} ${a.linia}`),
    ['llig _wiki_de_poble/02_saber/fora.md 16', 'escriu src/fora.js 18']);
  assert.deepEqual(detalls(r, 'sdp-a1'), []);
  assert.equal(r.valid, true);
});

const DETALL_DEUTE = 'token no declarat --sdp-vell';
const entradaDeute = (detall = DETALL_DEUTE, skillId = 'sdp-deute') => ({
  skill: skillId, regla: 'F4', empremta: empremta('F4', skillId, detall), detall,
  motiu: `pegat a skills-per-segellar/${skillId}; prova sintètica`
});

test('deute: la violació acceptada no bloqueja, una de nova sí, i amb el deute buidat torna a ser nova (trinquet)', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-deute', 'El fons era `var(--sdp-vell)`.');
  const ambDeute = captura();
  assert.equal(main([], { arrel: root, sortida: ambDeute, deute: [entradaDeute()] }), 0);
  assert.match(ambDeute.text(), /0 violacions noves · 1 en deute · 0 deute ranci/);
  const r = audita(root, [entradaDeute()]);
  assert.deepEqual([r.noves.length, r.enDeute.length, r.deuteRanci.length], [0, 1, 0]);
  cas('sdp-deute', 'El fons era `var(--sdp-vell)`.\n\nI ara `var(--sdp-nou-inexistent)`.');
  const ambNova = captura();
  assert.equal(main([], { arrel: root, sortida: ambNova, deute: [entradaDeute()] }), 1);
  assert.match(ambNova.text(), /NOVA \[F4\] sdp-deute: token no declarat --sdp-nou-inexistent/);
  assert.doesNotMatch(ambNova.text(), /NOVA \[F4\] sdp-deute: token no declarat --sdp-vell/);
  cas('sdp-deute', 'El fons era `var(--sdp-vell)`.');
  assert.equal(main([], { arrel: root, sortida: captura(), deute: [] }), 1, 'retirada l\'entrada, la mateixa violació bloqueja');
});

test('deute ranci: una empremta que ja no ix avisa i main = 0 (no bloqueja el hook)', (t) => {
  const { root } = fixture(t);
  const ranci = entradaDeute('token no declarat --sdp-retirat', 'sdp-beta');
  const r = audita(root, [ranci]);
  assert.deepEqual(r.deuteRanci.map((e) => e.empremta), [ranci.empremta]);
  assert.equal(r.valid, true);
  const sortida = captura();
  assert.equal(main([], { arrel: root, sortida, deute: [ranci] }), 0);
  assert.match(sortida.text(), new RegExp(`deute ranci \\[F4\\] sdp-beta: token no declarat --sdp-retirat · empremta ${ranci.empremta}`));
});

test('l\'empremta no depén de la línia: moure el paràgraf no la canvia', (t) => {
  const { root, cas } = fixture(t);
  cas('sdp-deute', 'El fons era `var(--sdp-vell)`.');
  const abans = audita(root).skills.find((s) => s.id === 'sdp-deute').violacions;
  cas('sdp-deute', 'Paràgraf nou.\n\nUn altre.\n\nEl fons era `var(--sdp-vell)`.');
  const despres = audita(root).skills.find((s) => s.id === 'sdp-deute').violacions;
  assert.equal(abans.length, 1);
  assert.equal(despres.length, 1);
  assert.notDeepEqual(abans[0].linies, despres[0].linies);
  assert.equal(despres[0].empremta, abans[0].empremta);
  assert.equal(despres[0].empremta, entradaDeute().empremta);
  assert.equal(main([], { arrel: root, sortida: captura(), deute: [entradaDeute()] }), 0);
});

test('un deute mal escrit no eximix res: empremta incoherent o regla desconeguda → error i main = 2', (t) => {
  const { root } = fixture(t);
  const falsa = { ...entradaDeute(), empremta: '0000000000000000' };
  assert.throws(() => audita(root, [falsa]), /empremta incoherent/);
  assert.throws(() => audita(root, [{ ...entradaDeute(), regla: 'F9' }]), /regla desconeguda/);
  assert.throws(() => audita(root, [entradaDeute(), entradaDeute()]), /duplicada/);
  const sortida = captura();
  assert.equal(main([], { arrel: root, sortida, deute: [falsa] }), 2);
  assert.match(sortida.text(), /empremta incoherent/);
});

test('no executa cap ordre de les skills: ni el motor ni l\'script deixen rastre, i el mòdul no importa child_process', (t) => {
  const { root, escriu, cas } = fixture(t, { scripts: { porta: 'node tooling/gates/porta.mjs', marca: 'node tooling/gates/marca.mjs npm' } });
  escriu('tooling/gates/marca.mjs', "import fs from 'node:fs';\nfs.writeFileSync(new URL('../../MARCA-' + (process.argv[2] || 'node'), import.meta.url), 'executat');\n");
  cas('sdp-marca', 'Executa `node tooling/gates/marca.mjs` i `npm run marca`.\n\n```sh\nnode tooling/gates/marca.mjs\nnpm run marca\n```');
  const r = audita(root);
  assert.equal(main(['--json'], { arrel: root, sortida: captura(), deute: [] }), 0);
  assert.deepEqual(r.skills.find((s) => s.id === 'sdp-marca').motors, ['tooling/gates/marca.mjs']);
  assert.deepEqual(detalls(r, 'sdp-marca'), []);
  assert.equal(fs.existsSync(path.join(root, 'MARCA-node')), false, 'el motor no s\'ha d\'executar');
  assert.equal(fs.existsSync(path.join(root, 'MARCA-npm')), false, 'l\'script no s\'ha d\'executar');
  // El mòdul i les seues importacions locals (transitives) no carreguen child_process.
  const vistos = new Set();
  const pendents = [MODUL];
  while (pendents.length) {
    const f = pendents.pop();
    if (vistos.has(f)) continue;
    vistos.add(f);
    const font = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(font, /(?:from\s+|import\(\s*|require\(\s*)['"](?:node:)?child_process['"]/, `${path.relative(ROOT, f)} importa child_process`);
    for (const m of font.matchAll(/\bfrom\s+'(\.{1,2}\/[^']+)'/g)) pendents.push(path.resolve(path.dirname(f), m[1]));
  }
  assert.ok(vistos.size >= 4, 'fronteres-skills, cataleg_skills, arrel i frontmatter');
});

test('un symlink dins de .agents/skills llança un error (inventari) i main = 2', (t) => {
  const { root } = fixture(t);
  fs.symlinkSync(path.join(root, '.agents/skills/sdp-alfa'), path.join(root, '.agents/skills/sdp-enllac'));
  assert.throws(() => audita(root), /Symlink/);
  assert.equal(main([], { arrel: root, sortida: captura(), deute: [] }), 2);
});

test('main: un argument desconegut és un error d\'ús (2); --json emet l\'informe sencer', (t) => {
  const { root } = fixture(t);
  const us = captura();
  assert.equal(main(['--escriu'], { arrel: root, sortida: us }), 2);
  assert.match(us.text(), /Ús: node tooling\/brain\/fronteres-skills\.mjs \[--json\]/);
  const json = captura();
  assert.equal(main(['--json'], { arrel: root, sortida: json, deute: [] }), 0);
  const r = JSON.parse(json.text());
  assert.equal(r.esquema, ESQUEMA);
  assert.equal(r.total, 3);
  assert.deepEqual(Object.keys(REGLES), ['F1', 'F2', 'F3', 'F4', 'F5']);
});

// CORRECTOR B10G-B-ARB-03: --arrel=<dir> d'este argv mana (i s'audita eixe directori, no l'arbre real).
test('main --arrel=<dir>: audita eixe directori; buit o inexistent és error (2)', (t) => {
  const { root, cas } = fixture(t);
  const net = captura();
  assert.equal(main([`--arrel=${root}`], { sortida: net, deute: [] }), 0);
  assert.match(net.text(), /· 3 skills \(/);
  cas('sdp-arrel', 'Usa `var(--sdp-inexistent)`.');
  const brut = captura();
  assert.equal(main([`--arrel=${root}`, '--json'], { sortida: brut, deute: [] }), 1, 'ha d\'auditar la fixture, no l\'arbre real');
  assert.deepEqual(JSON.parse(brut.text()).noves.map((v) => `${v.skill} ${v.detall}`), ['sdp-arrel token no declarat --sdp-inexistent']);
  assert.equal(main(['--arrel='], { sortida: captura(), deute: [] }), 2);
  assert.equal(main([`--arrel=${path.join(root, 'no-hi-es')}`], { sortida: captura(), deute: [] }), 2);
});

test('tokensDeclarats: els comentaris no declaren, tokens.css mana i els var() es resolen sense penjar-se en un cicle', (t) => {
  const { root } = fixture(t);
  const tokens = tokensDeclarats(root);
  assert.equal(tokens.has('--sdp-fals'), false);
  assert.equal(tokens.get('--sdp-fons-lectura'), '#f7f6f3');
  assert.equal(tokens.get('--sdp-fons-targeta'), '#ffffff');
  assert.equal(tokens.get('--sdp-propi'), '4px');
  assert.match(tokens.get('--sdp-cicle-a'), /var\(--sdp-cicle-/);
});

/* ── Arbre real ─────────────────────────────────────────────────────────── */

test('arbre real (A): cap violació nova i totes les skills auditades', () => {
  const arrel = arrelSegura();
  const r = auditaSkills(arrel);
  const directoris = fs.readdirSync(path.join(arrel, '.agents/skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).length;
  assert.equal(r.total, directoris);
  assert.deepEqual(r.noves.map((v) => `${v.skill} ${v.regla} ${v.empremta}`), [], `Violacions noves de les skills:\n${informe(r)}`);
});

test('arbre real (B): cap deute ranci', () => {
  const r = auditaSkills(arrelSegura());
  assert.deepEqual(r.deuteRanci.map((e) => `${e.skill} ${e.empremta}`), [],
    `retira de DEUTE_ACCEPTAT les empremtes ${r.deuteRanci.map((e) => `${e.empremta} (${e.skill}: ${e.detall})`).join(', ')}: `
    + 'la skill ja s\'ha segellat amb el pegat (D-7, mateix lot)');
});

test('DEUTE_ACCEPTAT: cada entrada recalcula la seua empremta i nomena el seu pegat a skills-per-segellar', () => {
  for (const e of DEUTE_ACCEPTAT) {
    assert.equal(empremta(e.regla, e.skill, e.detall), e.empremta, `${e.skill}: empremta incoherent`);
    assert.ok(Object.hasOwn(REGLES, e.regla), `${e.skill}: regla ${e.regla}`);
    assert.equal(e.motiu, motiuDeute(e.skill), `${e.skill}: el motiu ha de nomenar el pegat`);
    assert.match(e.motiu, new RegExp(`skills-per-segellar/${e.skill};`));
    assert.ok(Object.isFrozen(e));
  }
  assert.ok(Object.isFrozen(DEUTE_ACCEPTAT));
});
