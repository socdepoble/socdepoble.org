import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ETQ_SKILL_FORGE,
  analitzaWikiSyncDiferencial,
  detectaGapsWiki,
  esRangGitSegur,
  executaCli,
  obteFitxersDesDeGitDiff,
} from './wiki-forja-lint.mjs';
import { ESCRIPTORI_DIR, WIKI_DIR } from './lib/project_paths.mjs';

/* El nom de l'Escriptori ix de la SSOT, igual que a l'eina. */
const NOM_ESCRIPTORI = path.relative(WIKI_DIR, ESCRIPTORI_DIR);

function creaArbreWikiSintetic() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-wiki-forja-lint-'));

  const dirSaber = path.join(tmpDir, '_wiki_de_poble', '02_saber');
  const dirActuar = path.join(tmpDir, '_wiki_de_poble', '03_actuar');
  const dirActes = path.join(tmpDir, '_wiki_de_poble', '10_actes');
  const dirArxiuProhibit = path.join(tmpDir, '_wiki_de_poble', '90_arxiu_historic');
  const dirEscriptori = path.join(tmpDir, '_wiki_de_poble', NOM_ESCRIPTORI);
  const dirSrc = path.join(tmpDir, 'src', 'components', 'patrimoni');

  fs.mkdirSync(dirSaber, { recursive: true });
  fs.mkdirSync(dirActuar, { recursive: true });
  fs.mkdirSync(dirActes, { recursive: true });
  fs.mkdirSync(dirArxiuProhibit, { recursive: true });
  fs.mkdirSync(dirEscriptori, { recursive: true });
  fs.mkdirSync(dirSrc, { recursive: true });

  // Fitxer real a src/
  fs.writeFileSync(
    path.join(dirSrc, 'PassaportEscolarEtnograficCard.jsx'),
    'export default function PassaportEscolarEtnograficCard() {}\n',
    'utf8'
  );

  // Document de 02_saber ben formatat amb ## Vincles i ruta existent
  fs.writeFileSync(
    path.join(dirSaber, 'arquitectura_patrimoni.md'),
    [
      '# Arquitectura de Patrimoni Rural',
      '',
      'Component actiu: `src/components/patrimoni/PassaportEscolarEtnograficCard.jsx`.',
      'També cita el fantasma `src/components/patrimoni/ComponentInexistentFantasma.jsx`.',
      '',
      '## Vincles',
      '- [[00_index]]',
      '',
    ].join('\n'),
    'utf8'
  );

  // Document de 03_actuar sense secció ## Vincles
  fs.writeFileSync(
    path.join(dirActuar, ' guia_sense_vincles.md'.trim()),
    [
      '# Guia operativa sense vincles',
      '',
      'Referència a `tooling/wiki/wiki-forja-lint.mjs`.',
      '',
    ].join('\n'),
    'utf8'
  );

  // Acta amb etiquetes skill-forge
  fs.writeFileSync(
    path.join(dirActes, '261106_acta_prova.md'),
    [
      '# Acta de Prova',
      '',
      '- `[DECISION]` Disseny efímer d\'aula R7G-9-08.',
      '- `[SEQUENCE]` Primer vitest, després design_guard.',
      '- `[DEADEND]` Evitar # seguit de dígits hexadecimals.',
      '- `[CHECKPOINT]` Kit r79 verificat.',
      'Cita l\'antic `src/antic/RutaHistoricaRetirada.jsx`, que ja no existix.',
      '',
      '## Vincles',
      '- [[00_index]]',
      '',
    ].join('\n'),
    'utf8'
  );

  // Document dins de 90_arxiu_historic que MAI s'ha de llegir (AGENTS.md §5)
  fs.writeFileSync(
    path.join(dirArxiuProhibit, 'antic_arxiu.md'),
    [
      '# Arxiu Històric Ignorat',
      '[DECISION] [DECISION] [DECISION]',
      'src/components/patrimoni/NoLlegirMai90Arxiu.jsx',
    ].join('\n'),
    'utf8'
  );

  // K3 (R10, 2a ronda) · L'Escriptori també compta etiquetes skill-forge.
  fs.writeFileSync(
    path.join(dirEscriptori, '261106_acta_escriptori.md'),
    ['# Acta de l\'Escriptori', '', '- `[CORRECTION]` u.', '- `[CORRECTION]` dos.', '- `[CONVENTION]` tres.', '- `[DECISION]` quatre.', ''].join('\n'),
    'utf8'
  );

  // K3 (R10, 2a ronda) · Un `90_arxiu_historic` niat dins de les carpetes que SÍ es
  // recorren: la guarda és per nom, a qualsevol fondària, i MAI no s'hi entra.
  for (const pare of [dirSaber, dirActes, dirEscriptori]) {
    const niat = path.join(pare, '90_arxiu_historic');
    fs.mkdirSync(niat, { recursive: true });
    fs.writeFileSync(
      path.join(niat, 'arxiu_niat.md'),
      ['# Arxiu niat', '', '[DECISION] [DECISION] [DECISION] [DISCOVERY]', '`src/components/patrimoni/NoLlegirMaiArxiuNiat.jsx`', ''].join('\n'),
      'utf8'
    );
  }

  return tmpDir;
}

test('IDEA-130 · analitzaWikiSyncDiferencial identifica documents de 02_saber i 03_actuar afectats', () => {
  const tmpDir = creaArbreWikiSintetic();
  try {
    const resultat = analitzaWikiSyncDiferencial({
      arrel: tmpDir,
      fitxersModificats: [
        'src/components/patrimoni/PassaportEscolarEtnograficCard.jsx',
        'tooling/wiki/wiki-forja-lint.mjs',
      ],
    });

    assert.equal(resultat.totalDocsInspeccionats, 2);
    assert.equal(resultat.suggerimentsSync.length, 2);
    const docs = resultat.suggerimentsSync.map((s) => s.doc);
    assert.ok(docs.includes('_wiki_de_poble/02_saber/arquitectura_patrimoni.md'));
    assert.ok(docs.includes('_wiki_de_poble/03_actuar/guia_sense_vincles.md'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('IDEA-130 · detectaGapsWiki troba pàgines sense ## Vincles, rutes src/ inexistents i compta etiquetes skill-forge ignorant 90_arxiu_historic', () => {
  const tmpDir = creaArbreWikiSintetic();
  try {
    const gaps = detectaGapsWiki({ arrel: tmpDir });

    assert.equal(gaps.ETQ_SKILL_FORGE, undefined);
    assert.equal(ETQ_SKILL_FORGE.length, 7);

    // Només `guia_sense_vincles.md` no té `## Vincles`
    assert.deepEqual(gaps.senseVincles, [
      '_wiki_de_poble/03_actuar/guia_sense_vincles.md',
    ]);

    // Els 3 documents de 02_saber, 03_actuar i 10_actes; mai cap de 90_arxiu_historic
    assert.equal(gaps.totalDocsCanonics, 3);

    // Detecta la ruta fantasma i ignora la de 90_arxiu_historic i la de l'acta (10_actes)
    assert.deepEqual(gaps.rutesSrcInexistents, [
      {
        doc: '_wiki_de_poble/02_saber/arquitectura_patrimoni.md',
        ruta: 'src/components/patrimoni/ComponentInexistentFantasma.jsx',
      },
    ]);

    // Compta exactament les etiquetes de 10_actes i de l'Escriptori, i mai les de 90_arxiu_historic
    assert.deepEqual(gaps.recompteSkillForgeActes, {
      DECISION: 2,
      SEQUENCE: 1,
      CORRECTION: 2,
      DEADEND: 1,
      CONVENTION: 1,
      DISCOVERY: 0,
      CHECKPOINT: 1,
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('K3 (R10) · --diff: un valor que comença per «-» no arriba mai a git', () => {
  const crides = [];
  const executa = (...args) => {
    crides.push(args);
    return 'src/a.js\n';
  };
  const dolents = [
    '--output=/fora/pwn.txt', '-p', '--no-index', '', '   ', '..', 'HEAD;rm', 'a b', `x${'y'.repeat(250)}`,
    // 2a ronda: una revisió sola o un extrem buit comparen amb l'arbre de treball
    'b8904b465', 'HEAD', 'HEAD..', '..HEAD', 'a....b', 'HEAD..--output=x', 'HEAD...-p',
  ];
  for (const dolent of dolents) {
    assert.equal(esRangGitSegur(dolent), false, dolent);
    assert.deepEqual(obteFitxersDesDeGitDiff('/arrel', dolent, executa), [], dolent);
  }
  assert.equal(crides.length, 0);

  for (const bo of ['HEAD~3..HEAD', 'b8904b465..HEAD', 'main...fork/backup-notes-publish', 'HEAD@{1}..HEAD', 'v1.1.10..v1.1.11']) {
    assert.equal(esRangGitSegur(bo), true, bo);
  }
  assert.deepEqual(obteFitxersDesDeGitDiff('/arrel', 'HEAD~3..HEAD', executa), ['src/a.js']);
  assert.equal(crides.length, 1);
  assert.deepEqual(crides[0][1], ['diff', '--name-only', 'HEAD~3..HEAD', '--']);
  assert.equal(crides[0][2].cwd, '/arrel');
});

test('K3 (R10) · una ruta src/ amb «..» que ix de l’arrel no es mira al disc', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-wiki-forja-fora-'));
  try {
    const arrel = path.join(tmpDir, 'arrel');
    const dirSaber = path.join(arrel, '_wiki_de_poble', '02_saber');
    fs.mkdirSync(dirSaber, { recursive: true });
    // Un fitxer que SÍ existix, però fora de l'arrel.
    fs.writeFileSync(path.join(tmpDir, 'fora.json'), '{}\n', 'utf8');
    fs.writeFileSync(
      path.join(dirSaber, 'fuga.md'),
      ['# Fuga', '', 'Cita `src/../../fora.json` i `src/../../no-hi-es.json`.', '', '## Vincles', '- [[00_index]]', ''].join('\n'),
      'utf8'
    );

    const gaps = detectaGapsWiki({ arrel });
    assert.deepEqual(gaps.rutesSrcForaDeLArrel, [
      { doc: '_wiki_de_poble/02_saber/fuga.md', ruta: 'src/../../fora.json' },
      { doc: '_wiki_de_poble/02_saber/fuga.md', ruta: 'src/../../no-hi-es.json' },
    ]);
    assert.deepEqual(gaps.rutesSrcInexistents, []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

/* K3 (R10, 2a ronda) · CLI amb eixida i executor injectats: cap crida real a git. */
function executaCliProva(argv) {
  const crides = [];
  const eixida = [];
  const errors = [];
  const informe = executaCli(argv, {
    stdout: { write: (text) => eixida.push(text) },
    stderr: { write: (text) => errors.push(text) },
    executa: (...args) => {
      crides.push(args);
      return 'src/components/patrimoni/PassaportEscolarEtnograficCard.jsx\n';
    },
  });
  return { informe, crides, eixida: eixida.join(''), errors: errors.join('') };
}

test('K3 (R10, 2a ronda) · CLI: --diff amb una opció o amb una revisió sola ix amb codi 2 sense cridar git', () => {
  const tmpDir = creaArbreWikiSintetic();
  const codiAbans = process.exitCode;
  try {
    for (const dolent of ['--output=pwn.txt', 'b8904b465']) {
      process.exitCode = undefined;
      const r = executaCliProva(['--arrel', tmpDir, '--diff', dolent, '--json']);
      assert.equal(r.informe.ok, false, dolent);
      assert.equal(process.exitCode, 2, dolent);
      assert.equal(r.crides.length, 0, dolent);
      assert.match(r.errors, /--diff rebutjat/, dolent);
      assert.equal(JSON.parse(r.eixida).ok, false, dolent);
    }
    assert.equal(fs.existsSync(path.join(tmpDir, 'pwn.txt')), false);
  } finally {
    process.exitCode = codiAbans;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('K3 (R10, 2a ronda) · CLI: un rang de dos extrems arriba a git una sola vegada, a l’arrel i amb «--»', () => {
  const tmpDir = creaArbreWikiSintetic();
  const codiAbans = process.exitCode;
  try {
    process.exitCode = undefined;
    const r = executaCliProva(['--arrel', tmpDir, '--diff', 'HEAD~1..HEAD']);
    assert.equal(r.informe.ok, true);
    assert.equal(process.exitCode, undefined);
    assert.equal(r.crides.length, 1);
    assert.deepEqual(r.crides[0][1], ['diff', '--name-only', 'HEAD~1..HEAD', '--']);
    assert.equal(r.crides[0][2].cwd, tmpDir);
    assert.deepEqual(
      r.informe.wikiSync.suggerimentsSync.map((s) => s.doc),
      ['_wiki_de_poble/02_saber/arquitectura_patrimoni.md']
    );
    assert.match(r.eixida, /Docs canònics inspeccionats: 3 \|/);
    assert.equal(r.errors, '');
  } finally {
    process.exitCode = codiAbans;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
