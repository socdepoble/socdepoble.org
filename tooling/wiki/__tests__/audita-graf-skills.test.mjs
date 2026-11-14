import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  analitzaCosMarkdownFenceAware,
  auditaGrafSkills,
} from '../audita-graf-skills.mjs';
import { CAMINS } from '../../lib/arrel.mjs';

const DIR_TEST = path.dirname(fileURLToPath(import.meta.url));
const ARREL_REPO = path.resolve(DIR_TEST, '../../..');

test('audita-graf-skills valida el catàleg real sense anomalies crítiques i detecta les àncores del sistema', () => {
  const informe = auditaGrafSkills(ARREL_REPO);
  assert.equal(informe.ok, true, `Anomalies crítiques inesperades: ${JSON.stringify(informe.anomalies)}`);
  assert.ok(informe.resum.totalSkills >= 40);
  assert.ok(informe.ancoresSistema['sdp-workflow']?.includes('.agents/cervell.json'));
  assert.ok(informe.ancoresSistema['wiki-documentacio-i-reflex']?.includes('.agents/cervell.json'));
  assert.ok(informe.ancoresSistema['wiki-cicle-de-vida']?.includes('.agents/protocolledge.json'));
});

test('analitzaCosMarkdownFenceAware ignora H1 i wikilinks dins de tanques ``` i ~~~~~ (R25-SK04)', () => {
  const markdown = [
    '# Títol Canònic Únic',
    '',
    'Text amb vincle real [[00_index|Índex]] i inline `[[no_resoluble_inline]]`.',
    '',
    '~~~~~text',
    '# Fals H1 dins de tanca de 5 titlles',
    '~~~',
    '# Encara dins de la tanca de 5 titlles!',
    '[[enllac_fantasma_dins_tanca]]',
    '~~~~~',
    '',
    '```markdown',
    '# Segon fals H1 dins de backticks',
    '```',
  ].join('\n');

  const resultat = analitzaCosMarkdownFenceAware(markdown);
  assert.equal(resultat.h1.length, 1);
  assert.equal(resultat.h1[0].titol, 'Títol Canònic Únic');
  assert.equal(resultat.wikilinks.length, 1);
  assert.equal(resultat.wikilinks[0].desti, '00_index');
});

test('suporta claus de prototip (constructor, toString, __proto__) i detecta triggers duplicats i deprecated (R25-SK01/03)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-skills-audit-'));
  try {
    fs.mkdirSync(path.join(dir, '.agents/skills/skill-alfa'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.agents/skills/skill-beta'), { recursive: true });
    fs.mkdirSync(path.join(dir, '_wiki_de_poble'), { recursive: true });
    fs.writeFileSync(path.join(dir, '_wiki_de_poble/00_index.md'), '# Índex\n', 'utf8');

    fs.writeFileSync(
      path.join(dir, '.agents/cervell.json'),
      JSON.stringify({ entrada: ['.agents/skills/skill-alfa/SKILL.md'] }),
      'utf8',
    );

    fs.writeFileSync(
      path.join(dir, '.agents/skills/skill-alfa/SKILL.md'),
      [
        '---',
        'type: skill',
        'status: canonic',
        'name: skill-alfa',
        'description: Skill Alfa ancorada.',
        'triggers_on:',
        '  - constructor',
        '  - toString',
        '  - obrir el torn',
        'contracte.escriu:',
        '  - __proto__',
        '  - _wiki_de_poble/04_escriptori',
        '---',
        '# Skill Alfa',
        '',
        'Enllaç vàlid [[00_index]] i enllaç trencat [[fitxer_absent_xyz]].',
      ].join('\n'),
      'utf8',
    );

    fs.writeFileSync(
      path.join(dir, '.agents/skills/skill-beta/SKILL.md'),
      [
        '---',
        'type: skill',
        'status: deprecated',
        'name: skill-beta',
        'description: Skill Beta obsoleta dins de .agents/skills.',
        'triggers_on:',
        '  - constructor',
        '  - obrir el torn',
        'contracte.escriu:',
        '  - _wiki_de_poble/04_escriptori',
        '---',
        '# Skill Beta',
      ].join('\n'),
      'utf8',
    );

    const informe = auditaGrafSkills(dir);
    assert.equal(informe.ok, false, 'status: deprecated dins de .agents/skills ha de marcar anomalia crítica');
    assert.ok(informe.anomalies.some((a) => a.tipus === 'ESTAT_NO_CATALOGABLE' && a.skill === 'skill-beta'));
    assert.ok(informe.anomalies.some((a) => a.tipus === 'WIKILINK_TRENCAT' && a.skill === 'skill-alfa'));
    assert.ok(informe.triggersDuplicatsExactes.some((t) => t.trigger === 'constructor'));
    assert.ok(informe.triggersDuplicatsExactes.some((t) => t.trigger === 'obrir el torn'));
    assert.ok(informe.escripturesCompartides.some((e) => e.ruta === '_wiki_de_poble/04_escriptori'));
    assert.equal(informe.ancoresSistema['skill-alfa']?.[0], '.agents/cervell.json');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R25.2-G01/G02: rebutja does-not-exist/SKILL per basename, ignora comentaris HTML i detecta ANCORA_SISTEMA_ABSENT', () => {
  const mdAmbComentari = [
    '<!-- # Comentari inicial no és H1 ni [[enllac_comentat]] -->',
    '# H1 Real Únic',
    '<!--',
    '# H1 comentat multilínia',
    '[[does-not-exist/SKILL]]',
    '-->',
    'Vincle qualificat inexistent [[does-not-exist/SKILL]].',
  ].join('\n');

  const analisi = analitzaCosMarkdownFenceAware(mdAmbComentari);
  assert.equal(analisi.h1.length, 1);
  assert.equal(analisi.wikilinks.length, 1);
  assert.equal(analisi.wikilinks[0].desti, 'does-not-exist/SKILL');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-skills-g01-'));
  try {
    fs.mkdirSync(path.join(dir, '.agents/skills/skill-viva'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, '.agents/cervell.json'),
      JSON.stringify({ entrada: ['.agents/skills/skill-fantasma/SKILL.md'] }),
      'utf8',
    );
    fs.writeFileSync(
      path.join(dir, '.agents/skills/skill-viva/SKILL.md'),
      [
        '---',
        'type: skill',
        'status: canonic',
        'name: skill-viva',
        'description: Skill viva.',
        'triggers_on:',
        '  - prova g01',
        '---',
        mdAmbComentari,
      ].join('\n'),
      'utf8',
    );

    const inf = auditaGrafSkills(dir);
    assert.equal(inf.ok, false);
    assert.ok(inf.anomalies.some((a) => a.tipus === 'WIKILINK_TRENCAT' && a.detall.includes('does-not-exist/SKILL')));
    assert.ok(inf.anomalies.some((a) => a.tipus === 'ANCORA_SISTEMA_ABSENT' && a.skill === 'skill-fantasma'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ═══════════ Onada R26 · negatives explícites de l'auditoria Codex R25.2 (G01 i G02) ═══════════ */

function grafFixture(skills, extres = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-skills-r26-'));
  fs.mkdirSync(path.join(dir, '.agents/skills'), { recursive: true });
  fs.mkdirSync(path.join(dir, '_wiki_de_poble'), { recursive: true });
  fs.writeFileSync(path.join(dir, '_wiki_de_poble/00_index.md'), '# Índex\n', 'utf8');
  for (const [id, { frontmatter, cos = `# ${id}\n` }] of Object.entries(skills)) {
    fs.mkdirSync(path.join(dir, '.agents/skills', id), { recursive: true });
    fs.writeFileSync(path.join(dir, '.agents/skills', id, 'SKILL.md'), `---\n${frontmatter}\n---\n${cos}`, 'utf8');
  }
  for (const [rel, text] of Object.entries(extres)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text, 'utf8');
  }
  return dir;
}

const fmValid = (id, extra = '') => `type: skill\nstatus: canonic\nname: ${id}\ndescription: Skill ${id}.\ntriggers_on:\n  - disparador ${id}${extra ? `\n${extra}` : ''}`;

test('R25.2-G01 · un nom curt ambigu no es resol pel primer basename; des de l\'origen o únic, sí', () => {
  const dir = grafFixture({
    'skill-origen': { frontmatter: fmValid('skill-origen'), cos: '# Origen\n\nVincles [[nota]], [[propia]] i [[unica]].\n' },
  }, {
    '_wiki_de_poble/a/nota.md': '# A\n',
    '_wiki_de_poble/b/nota.md': '# B\n',
    '.agents/skills/skill-origen/propia.md': '# Pròpia\n',
    '_wiki_de_poble/c/propia.md': '# Pròpia c\n',
    '_wiki_de_poble/d/unica.md': '# Única\n',
  });
  try {
    const inf = auditaGrafSkills(dir);
    const ambigus = inf.anomalies.filter((a) => a.tipus === 'WIKILINK_AMBIGU');
    assert.equal(ambigus.length, 1, JSON.stringify(inf.anomalies));
    assert.match(ambigus[0].detall, /\[\[nota\]\]/);
    assert.ok(!inf.anomalies.some((a) => /propia|unica/.test(a.detall)), JSON.stringify(inf.anomalies));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R25.2-G01 · ruta qualificada: caixa exacta, cap basename d\'un altre SKILL.md i cap eixida de l\'arrel', () => {
  const dir = grafFixture({
    'skill-viva': { frontmatter: fmValid('skill-viva'), cos: '# Viva\n\n[[skill-viva/SKILL]] [[skill-viva/skill]] [[does-not-exist/SKILL]] [[../../etc/passwd]]\n' },
  });
  try {
    const trencats = auditaGrafSkills(dir).anomalies.filter((a) => a.tipus === 'WIKILINK_TRENCAT').map((a) => a.detall);
    assert.equal(trencats.length, 3, JSON.stringify(trencats));
    assert.ok(trencats.some((d) => d.includes('[[skill-viva/skill]]')));
    assert.ok(trencats.some((d) => d.includes('[[does-not-exist/SKILL]]')));
    assert.ok(trencats.some((d) => d.includes('[[../../etc/passwd]]')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R25.2-G02 · tipus crus: triggers_on escalar, name en llista, core i prioritat invàlids són crítics com a cataleg_skills', () => {
  const dir = grafFixture({
    'skill-escalar': { frontmatter: 'type: skill\nstatus: canonic\nname: skill-escalar\ndescription: Escalar.\ntriggers_on: obrir el torn' },
    'skill-llista': { frontmatter: 'type: skill\nstatus: canonic\nname: [skill-llista]\ndescription: Llista.\ntriggers_on:\n  - llista' },
    'skill-core': { frontmatter: fmValid('skill-core', 'core: si') },
    'skill-prioritat': { frontmatter: fmValid('skill-prioritat', 'prioritat: alta') },
  });
  try {
    const inf = auditaGrafSkills(dir);
    assert.equal(inf.ok, false);
    const critica = (skill, tipus) => inf.anomalies.some((a) => a.skill === skill && a.tipus === tipus);
    assert.ok(critica('skill-escalar', 'TRIGGERS_TIPUS_INVALID'), JSON.stringify(inf.anomalies));
    assert.ok(critica('skill-llista', 'IDENTITAT_DIVERGENT'), JSON.stringify(inf.anomalies));
    assert.ok(critica('skill-core', 'CORE_INVALID'), JSON.stringify(inf.anomalies));
    assert.ok(critica('skill-prioritat', 'PRIORITAT_INVALIDA'), JSON.stringify(inf.anomalies));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R25.2-G02 · contracte.escriu normalitzat: «04_escriptori» i «04_escriptori/» són el mateix carril', () => {
  const dir = grafFixture({
    'skill-a': { frontmatter: fmValid('skill-a', 'contracte.escriu:\n  - _wiki_de_poble/04_escriptori') },
    'skill-b': { frontmatter: fmValid('skill-b', 'contracte.escriu:\n  - ./_wiki_de_poble/04_escriptori/') },
  });
  try {
    const inf = auditaGrafSkills(dir);
    const carril = inf.escripturesCompartides.find((e) => e.ruta === '_wiki_de_poble/04_escriptori');
    assert.ok(carril, JSON.stringify(inf.escripturesCompartides));
    assert.deepEqual(carril.skills, ['skill-a', 'skill-b']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R25.2-G02 · un «<!--» dins de codi en línia no obri cap comentari HTML ni amaga H1 o vincles', () => {
  const analisi = analitzaCosMarkdownFenceAware([
    '# Títol únic',
    '',
    'Per a obrir un comentari, escriu `<!--` al principi de la línia.',
    '',
    '# Segon H1 real',
    'Vincle viu [[00_index]].',
  ].join('\n'));
  assert.equal(analisi.h1.length, 2);
  assert.deepEqual(analisi.wikilinks.map((w) => w.desti), ['00_index']);
});

test('R25.2-G02 · la cobertura de les àncores del sistema es declara, també els directoris no recorreguts', () => {
  const dir = grafFixture({ 'skill-x': { frontmatter: fmValid('skill-x') } });
  try {
    const inf = auditaGrafSkills(dir);
    assert.equal(inf.coberturaAncores.recursiu, false);
    assert.ok(inf.coberturaAncores.fitxers.includes('.agents/cervell.json'));
    assert.ok(inf.coberturaAncores.directorisPlans.includes('tooling/gates'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('R26-r2 · WIKILINK_AMBIGU amb «[[./nom]]» o «[[./nom.md]]» informa i no peta', () => {
  const dir = grafFixture({
    'skill-punt': { frontmatter: fmValid('skill-punt'), cos: '# Punt\n\nVincles [[./nota]] i [[./nota.md|àlies]].\n' },
  }, {
    [`${CAMINS.wiki}/a/nota.md`]: '# A\n',
    [`${CAMINS.wiki}/b/nota.md`]: '# B\n',
  });
  try {
    const inf = auditaGrafSkills(dir);
    const ambigus = inf.anomalies.filter((a) => a.tipus === 'WIKILINK_AMBIGU');
    assert.equal(ambigus.length, 2, JSON.stringify(inf.anomalies));
    assert.ok(ambigus.every((a) => /coincidix amb 2 fitxers/.test(a.detall)), JSON.stringify(ambigus));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
