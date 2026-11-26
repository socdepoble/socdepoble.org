import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { analitzaSalut, extreuVincles, lligSnapshot, main, POLITICA, SCHEMA } from '../tooling/gates/tractor-salut-wiki-i-skills.mjs';

const ENGINE = fileURLToPath(new URL('../tooling/gates/tractor-salut-wiki-i-skills.mjs', import.meta.url));
const NOW = '2026-11-25';
const digest = text => createHash('sha256').update(text).digest('hex');
const doc = (name, text, more = {}) => ({ cami: `_wiki_de_poble/02_saber/${name}.md`, text, ...more });
const fm = (fields, text = 'Contingut documental.') => `---\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${text}`;
const run = (documents, more = {}) => analitzaSalut({ documents, ara: NOW, ...more });
const findings = (result, rule) => result.findings.filter(f => f.regla === rule);

function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-wiki-salut-'));
  fs.chmodSync(root, 0o700);
  fs.mkdirSync(path.join(root, '_wiki_de_poble'), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents/skills'), { recursive: true });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const write = (relative, text) => { const dest = path.join(root, relative); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, text); return dest; };
  return { root, write };
}

function inventory(root) {
  const rows = [];
  const walk = dir => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name), st = fs.lstatSync(full);
      if (st.isDirectory()) walk(full);
      else rows.push({ path: path.relative(root, full), mode: st.mode, size: st.size, sha: st.isSymbolicLink() ? fs.readlinkSync(full) : digest(fs.readFileSync(full)) });
    }
  };
  walk(root); return rows;
}

function cli(root, args = []) {
  return spawnSync(process.execPath, [ENGINE, '--arrel', root, '--sense-ia', '--json', '--ara', NOW, ...args],
    { encoding: 'utf8', env: { PATH: process.env.PATH, TZ: 'UTC' }, timeout: 10_000 });
}

function catalogue(kind = 'version', current = ['1.2.24'], template = 'Producció: {valor}') {
  const text = '{"version":"1.2.24","skillsLocals":44}';
  return { cataleg: { schema: 'sdp.salut-wiki-skills.cataleg.v1', sources: [{ id: 'ssot', path: 'package.json', sha256: digest(text) }],
    claims: [{ id: 'app', kind, sourceId: 'ssot', templates: [template], current }] }, evidencies: [{ path: 'package.json', text }] };
}

test('motor pur reproduïble, input intacte i cap fetch', () => {
  const docs = [doc('b', '[[a]]\nVersió 1.0.0'), doc('a', '[[b]]')];
  const before = JSON.stringify(docs), previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Xarxa prohibida'); };
  try {
    assert.equal(JSON.stringify(run(docs)), JSON.stringify(run([...docs].reverse())));
    assert.equal(JSON.stringify(docs), before);
  } finally { globalThis.fetch = previous; }
});

test('15 dies exactes no alerta;16 sí com edatdocument proxy', () => {
  assert.equal(findings(run([doc('15', fm({ status: 'esborrany', date: '2026-11-10' }))]), 'DRAFT_ANTIC').length, 0);
  const found = findings(run([doc('16', fm({ status: 'esborrany', date: '2026-11-09' }))]), 'DRAFT_ANTIC');
  assert.equal(found.length, 1); assert.equal(found[0].evidencia.precisio, 'edat_document_proxy');
  assert.match(found[0].missatge, /no acredita durada/u);
});

test('filename és proxy explícit, no duradaestatus inventada', () => {
  const result = run([{ cami: '_wiki_de_poble/04_escriptori/261109_1234_nota.md', text: fm({ status: 'esborrany' }) }]);
  const item = findings(result, 'DRAFT_ANTIC')[0];
  assert.equal(item.evidencia.font, 'nom_fitxer'); assert.equal(item.evidencia.precisio, 'edat_document_proxy');
});

test('dataestatus sintètica externa no es presenta comcampcanònic', () => {
  const result = run([doc('estat', fm({ status: 'esborrany', status_since: '2026-11-09' }))]);
  assert.equal(findings(result, 'DRAFT_ANTIC')[0].evidencia.precisio, 'estatus_aportat_no_camp_canonic');
});

for (const value of ['2026-11-26', '2026-02-30', 'not-a-date']) test(`datafutura/invàlida ${value} queda UNKNOWN`, () => {
  const result = run([doc('data', fm({ status: 'esborrany', date: value }))]);
  assert.equal(findings(result, 'DRAFT_ANTIC').length, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => /Edat/u.test(f.missatge)));
});

test('estat sense data no fa servir mtime ni rellotge implícit', () => {
  const result = run([doc('sense_data', fm({ estat: 'esborrany' }), { mtime: '1990-01-01' })]);
  assert.equal(findings(result, 'DRAFT_ANTIC').length, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => f.evidencia.font === 'absent'));
});

test('status/estat contradictoris no acrediten esborranyantic', () => {
  const result = run([doc('contradiccio', fm({ status: 'esborrany', estat: 'canonic', date: '2020-01-01' }))]);
  assert.equal(findings(result, 'DRAFT_ANTIC').length, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => /contradictoris/u.test(f.missatge)));
});

test('ara invàlida o absent és INCOMPLET, noverd', () => {
  for (const ara of [undefined, '2026-02-30', 'ayer']) {
    const result = analitzaSalut({ documents: [], ara });
    assert.equal(result.complet, false); assert.equal(result.estat, 'INCOMPLET');
  }
});

test('25 KB SI: límit exacte noelefant, bytesUTF8 no caràcters', () => {
  assert.equal(findings(run([doc('igual', 'é'.repeat(12_500))]), 'ELEFANT').length, 0);
  const result = run([doc('major', 'é'.repeat(12_501))]);
  assert.equal(findings(result, 'ELEFANT')[0].evidencia.bytes, 25_002);
  assert.equal(findings(result, 'ELEFANT')[0].evidencia.llindarBytes, 25_000);
});

test('elefants només01ser/02saber, noactes o03actuar', () => {
  const result = run([{ cami: '_wiki_de_poble/03_actuar/gran.md', text: 'x'.repeat(25_001) }, { cami: '_wiki_de_poble/10_actes/gran.md', text: 'x'.repeat(25_001) }]);
  assert.equal(findings(result, 'ELEFANT').length, 0);
});

test('claimdivergent requereixtemplate context iSSOT verificat', () => {
  const result = run([doc('versions', 'Producció: 1.2.23\nOnada objectiu: 1.2.25')], catalogue());
  const found = findings(result, 'CLAIM_DIVERGENT');
  assert.equal(found.length, 1); assert.equal(found[0].evidencia.valor, '1.2.23');
  assert.equal(found[0].evidencia.vigents[0], '1.2.24');
  assert.ok(findings(result, 'UNKNOWN').some(f => f.evidencia.mencio === '1.2.25'));
});

test('appvigent no marca objectiucomproducció', () => {
  const result = run([doc('versions', 'Producció: 1.2.24\nObjectiu 1.2.25')], catalogue());
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
});

test('44localssnapshot no converteix45totalexterna enerror', () => {
  const result = run([doc('skills', 'Skills locals: 44\n45 skills totals amb externa')], catalogue('count', ['44'], 'Skills locals: {valor}'));
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
});

test('countcontextual divergent esrevisa', () => {
  assert.equal(findings(run([doc('skills', 'Skills locals: 45')], catalogue('count', ['44'], 'Skills locals: {valor}')), 'CLAIM_DIVERGENT').length, 1);
});

test('font alterada/absent no acredita obsolescència', () => {
  for (const evidence of [[], [{ path: 'package.json', text: '{"version":"changed"}' }]]) {
    const result = run([doc('versions', 'Producció: 1.0.0')], { ...catalogue(), evidencies: evidence });
    assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
    assert.ok(findings(result, 'UNKNOWN').some(f => f.evidencia.claim === 'app'));
  }
});

test('quote de font també forma part de l’evidència', () => {
  const cat = catalogue(); cat.cataleg.sources[0].quote = 'absent';
  assert.equal(findings(run([doc('versions', 'Producció: 1.0.0')], cat), 'CLAIM_DIVERGENT').length, 0);
});

test('catàleg absent no inventa models caducats', () => {
  const result = run([doc('models', 'Claude Sonnet, Gemini 4 i GPT-3.5. Versió 0.0.1')]);
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.ok(findings(result, 'UNKNOWN').length >= 3);
});

test('modelsintètic amb font explícita és detectablesenseAPI', () => {
  const result = run([doc('model', 'Model actual: model-vell')], catalogue('model', ['model-nou'], 'Model actual: {valor}'));
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 1);
});

test('template regex ésliteral i tokenbuit no admés', () => {
  const cat = catalogue('version', ['1.2.24'], 'Producció (app): {valor}');
  assert.equal(findings(run([doc('regex', 'Producció (app): 1.2.0')], cat), 'CLAIM_DIVERGENT').length, 1);
  cat.cataleg.claims[0].templates = ['{valor}'];
  assert.equal(run([], cat).estat, 'INCOMPLET');
});

test('xifres/models històrics en actes no es declaren stale', () => {
  const result = run([{ cami: '_wiki_de_poble/10_actes/acta.md', text: 'Producció: 0.0.1\nGPT-3.5 i 10 skills' }, doc('tipus_acta', fm({ type: 'acta' }, 'Producció: 0.0.1\nGPT-3.5'))], catalogue());
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.equal(findings(result, 'UNKNOWN').filter(f => f.evidencia.mencio).length, 0);
});

test('duplicatWikiSkill és candidat amb límit citació explícit', () => {
  const body = 'El coneixement i la filosofia de Sóc de Poble es documenten en la Wiki amb una font única i una història que es conserva. '.repeat(3);
  const result = run([doc('norma', body), { cami: '.agents/skills/exemple/SKILL.md', text: fm({ status: 'canonic' }, body.replaceAll(' ', '  ')) }]);
  const found = findings(result, 'DUPLICAT_WIKI_SKILL');
  assert.equal(found.length, 1); assert.equal(found[0].nivell, 'revisio'); assert.match(found[0].evidencia.limit, /citació/u);
});

test('títols curts o duplicatWikiWiki no acreditenbraincopy', () => {
  const result = run([doc('a', '# Vincles'), doc('b', '# Vincles'), { cami: '.agents/skills/a/SKILL.md', text: '# Vincles' }]);
  assert.equal(findings(result, 'DUPLICAT_WIKI_SKILL').length, 0);
});

test('cicleA↔B no és literal0incoming, sensecertreachability', () => {
  const result = run([doc('a', '[[b]]'), doc('b', '[[a]]')]);
  assert.equal(findings(result, 'ORFE').length, 0); assert.equal(result.cobertura.arestesResoltes, 2);
  assert.ok(result.limits.some(v => /reachability/u.test(v)));
});

test('selflink norescataorfe i linksduplicatscomptenfontúnica', () => {
  const result = run([doc('a', '[[a]]\n[[b]]\n[[b]]'), doc('b', 'Contingut')]);
  assert.equal(result.cobertura.arestesResoltes, 1);
  assert.deepEqual(findings(result, 'ORFE').map(f => f.cami), ['_wiki_de_poble/02_saber/a.md']);
});

test('UnicodeNFC percentencoding alias i fragment noinventenaresta', () => {
  const result = run([doc('origen', '[[café|Etiqueta#fragment]]\n[cita](caf%C3%A9.md#fragment)'), doc('cafe\u0301', 'text')]);
  assert.equal(result.cobertura.arestesResoltes, 1);
  assert.equal(findings(result, 'ORFE').filter(f => f.cami.endsWith('/café.md')).length, 0);
});

test('enllaços relatius i suffix Wiki resolen amb àmbit', () => {
  const result = run([{ cami: '_wiki_de_poble/03_actuar/origen.md', text: '[nota](../02_saber/caf%C3%A9.md#x)\n[[02_saber/café]]' }, doc('café', 'text')]);
  assert.equal(result.cobertura.arestesResoltes, 1);
});

test('basenameambigu és UNKNOWN, no tria ni etiqueta certorfe', () => {
  const result = run([{ cami: '_wiki_de_poble/00_index.md', text: '[[igual]]' }, { cami: '_wiki_de_poble/01_ser/a/igual.md', text: 'a' }, { cami: '_wiki_de_poble/03_actuar/b/igual.md', text: 'b' }]);
  assert.equal(result.cobertura.arestesResoltes, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => /ambigu/u.test(f.missatge)));
  assert.equal(findings(result, 'ORFE').length, 0);
});

test('caixa errònia és UNKNOWN, no equivalència silenciosa', () => {
  const result = run([doc('origen', '[[Café]]'), doc('café', 'text')]);
  assert.equal(result.cobertura.arestesResoltes, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => f.missatge === 'Caixa no canònica'));
});

test('fences/inline/comments norescatenorfe; Unicode no desplaçaparser', () => {
  const text = '😀 `[[target]]`\n```md\n[[target]]\n```\n<!-- [[target]] -->\n%% [[target]] %%';
  assert.equal(extreuVincles(text).length, 0);
  assert.equal(findings(run([doc('origen', text), doc('target', 'text')]), 'ORFE').length, 2);
});

test('referència Markdown només compta si utilitzada', () => {
  const unused = run([doc('origen', '[ref]: target.md'), doc('target', 'text')]);
  assert.equal(unused.cobertura.arestesResoltes, 0);
  const used = run([doc('origen', '[cita][ref]\n[ref]: target.md'), doc('target', 'text')]);
  assert.equal(used.cobertura.arestesResoltes, 1);
});

test('skillregistradaicontrolentrypoint no s’etiquetenunused', () => {
  const result = run([{ cami: 'AGENTS.md', text: 'Autoritat' }, { cami: '.agents/skills/foo/SKILL.md', text: 'Procediment' }, doc('aillat', 'text')],
    { evidencies: [{ path: '.agents/cervell.json', text: '{"skills":["foo"]}' }] });
  assert.deepEqual(findings(result, 'ORFE').map(f => f.cami), ['_wiki_de_poble/02_saber/aillat.md']);
  assert.ok(findings(result, 'UNKNOWN').filter(f => f.evidencia.controlRef).length === 2);
});

test('camins Unicode col·lisionats fan INCOMPLET', () => {
  const result = run([doc('café', 'a'), doc('cafe\u0301', 'b')]);
  assert.equal(result.complet, false); assert.equal(result.estat, 'INCOMPLET');
});

test('adapter no llig90, zona humana oinvestigacióprotegida', t => {
  const { root, write } = fixture(t);
  for (const relative of ['_wiki_de_poble/90_arxiu_historic/no.md', '_wiki_de_poble/04_escriptori/01_produccio/no.md', '_wiki_de_poble/04_escriptori/02_investigacio_ia/no.md']) write(relative, Buffer.from([255]));
  write('_wiki_de_poble/02_saber/si.md', 'text');
  const snapshot = lligSnapshot({ arrel: root });
  assert.equal(snapshot.incidencies.length, 0); assert.equal(snapshot.documents.length, 1); assert.equal(snapshot.exclosos.length, 3);
});

test('symlink fulla/pare/fora/arxiu no se seguix i dónaINCOMPLET', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/90_arxiu_historic/prohibit.md', 'SECRETNO');
  fs.symlinkSync(path.join(root, '_wiki_de_poble/90_arxiu_historic'), path.join(root, '_wiki_de_poble/pare'));
  fs.symlinkSync('/not-existing', path.join(root, '_wiki_de_poble/penjant.md'));
  const snapshot = lligSnapshot({ arrel: root });
  assert.equal(snapshot.documents.length, 0); assert.equal(snapshot.incidencies.length, 2);
  assert.equal(run(snapshot.documents, snapshot).estat, 'INCOMPLET');
});

test('arrel inicialWiki comsymlink no evita guard de pares', t => {
  const { root, write } = fixture(t);
  fs.rmdirSync(path.join(root, '_wiki_de_poble'));
  write('fora/prohibit.md', 'NO');
  fs.symlinkSync(path.join(root, 'fora'), path.join(root, '_wiki_de_poble'));
  assert.equal(lligSnapshot({ arrel: root }).documents.length, 0);
  assert.ok(lligSnapshot({ arrel: root }).incidencies.length > 0);
});

test('límit8MiB explícit no silencia absències comsalutverda', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/gran.md', Buffer.alloc(POLITICA.maxFitxerBytes + 1, 120));
  const snapshot = lligSnapshot({ arrel: root });
  assert.equal(snapshot.documents.length, 0); assert.ok(snapshot.incidencies.length > 0);
  assert.equal(run(snapshot.documents, snapshot).estat, 'INCOMPLET');
});

test('fontcatàleg traversal refusa lectura', t => {
  const { root } = fixture(t);
  const snapshot = lligSnapshot({ arrel: root, cataleg: { sources: [{ path: '../escape.json' }] } });
  assert.ok(snapshot.incidencies.some(e => /Camí/u.test(e)));
});

test('CLIprodueixJSONreproduïble i preservatot elfixture', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/a.md', '[[b]]'); write('_wiki_de_poble/b.md', '[[a]]');
  const before = inventory(root), a = cli(root), b = cli(root);
  assert.equal(a.status, 0, a.stderr); assert.equal(a.stdout, b.stdout);
  assert.equal(JSON.parse(a.stdout).schema, SCHEMA);
  assert.deepEqual(inventory(root), before);
});

test('badargs/formatmalformat tenenstdoutJSON/exit2', t => {
  const { root } = fixture(t);
  for (const args of [['--unknown'], ['--format', 'xml'], ['--ara', '2026-02-30']]) {
    const child = cli(root, args); assert.equal(child.status, 2); assert.equal(JSON.parse(child.stdout).estat, 'INCOMPLET');
  }
});

test('CLIdefaultlocals i externa explícita tenen cobertura distinta', t => {
  const { root, write } = fixture(t);
  write('.agents/skills/local/SKILL.md', 'Procediment local');
  const external = write('autoritzada/maria/SKILL.md', 'Procediment extern');
  const local = JSON.parse(cli(root).stdout), extra = JSON.parse(cli(root, ['--skill-externa', external]).stdout);
  assert.equal(local.cobertura.skillsLocals, 1); assert.equal(local.cobertura.skillsExternes, 0);
  assert.equal(extra.cobertura.skillsLocals, 1); assert.equal(extra.cobertura.skillsExternes, 1);
});

test('maininjectat només stdout, incomplete noSENSE_TROBALLES', () => {
  let stdout = '';
  const rc = main(['--arrel', '/absent-sdp-path', '--ara', NOW], { stdout: { write: text => { stdout += text; } } });
  assert.equal(rc, 2); assert.equal(JSON.parse(stdout).estat, 'INCOMPLET');
});

test('C3-HARDEN aliases no-array són UNKNOWN sense excepció', () => {
  for (const value of ['false', '0', '{}', 'null']) {
    let result;
    assert.doesNotThrow(() => { result = run([doc('aliases', fm({ aliases: value }, 'Nota'))]); });
    assert.ok(findings(result, 'UNKNOWN').some(f => /Aliases/u.test(f.missatge)));
  }
});

test('C3-HARDEN font no verificada sense matches no es converteix en verd', () => {
  const cat = catalogue(); cat.evidencies = [];
  const result = run([], cat);
  assert.equal(result.complet, false); assert.equal(result.estat, 'INCOMPLET');
});

test('C3-HARDEN evidències del mateix path no acrediten el primer text', () => {
  const cat = catalogue(); cat.evidencies.push({ path: 'package.json', text: 'contradictori' });
  const result = run([doc('versio', 'Producció: 1.0.0')], cat);
  assert.equal(result.complet, false); assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => f.evidencia.claim === 'app'));
});

test('C3-HARDEN IDs de claim duplicats invaliden catàleg', () => {
  const cat = catalogue(); cat.cataleg.claims.push({ ...cat.cataleg.claims[0] });
  const result = run([doc('versio', 'Producció: 1.0.0')], cat);
  assert.equal(result.complet, false); assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
});

test('C3-HARDEN templates acreditats contradictoris produeixen UNKNOWN', () => {
  const cat = catalogue(); cat.cataleg.claims.push({ ...cat.cataleg.claims[0], id: 'conflicte', current: ['1.2.25'] });
  const result = run([doc('versio', 'Producció: 1.2.24')], cat);
  assert.equal(result.complet, false); assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => f.evidencia.claim));
});

test('C3-HARDEN col·lisió portable Cas/cas no tria path exacte', () => {
  const result = run([doc('Cas', 'A'), doc('cas', 'B'), doc('origen', '[[cas]]')]);
  assert.equal(result.cobertura.arestesResoltes, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => f.cami.endsWith('/origen.md') && /col·lisió/iu.test(f.missatge)));
});

test('C3-HARDEN externa duplicada o més de16 no infla cens', t => {
  const { root, write } = fixture(t), external = write('extra/maria/SKILL.md', 'Procediment');
  const duplicated = lligSnapshot({ arrel: root, skillsExternes: [external, external] });
  assert.equal(duplicated.documents.filter(d => d.origen === 'externa').length, 1);
  assert.ok(duplicated.incidencies.length > 0);
  const tooMany = lligSnapshot({ arrel: root, skillsExternes: Array(17).fill(external) });
  assert.ok(tooMany.incidencies.length > 0); assert.equal(tooMany.documents.length, 0);
});

test('C3-HARDEN template real conserva path inline però no claims en exemples inline', () => {
  const template = 'El repositori manté **{valor} skills actives** dins de `.agents/skills/`';
  const cat = catalogue('count', ['44'], template);
  const result = run([doc('real', template.replace('{valor}', '45')), doc('exemple', '`' + 'Producció: 1.0.0' + '`')], cat);
  assert.equal(findings(result, 'CLAIM_DIVERGENT').filter(f => f.cami.endsWith('/real.md')).length, 1);
  assert.equal(findings(run([doc('exemple', '`Producció: 1.0.0`')], catalogue()), 'CLAIM_DIVERGENT').length, 0);
});

test('C3-IOBOUNDED creixement després open refusa sense readFileSync(fd)', t => {
  const { root, write } = fixture(t), target = write('_wiki_de_poble/petit.md', 'petit');
  const open = fs.openSync, wholeRead = fs.readFileSync;
  let unbounded = 0, opened = false;
  fs.openSync = (file, ...args) => {
    const fd = open(file, ...args);
    if (file === target && !opened) {
      opened = true;
      const writer = open(file, 'r+');
      try { fs.ftruncateSync(writer, POLITICA.maxFitxerBytes + 1); } finally { fs.closeSync(writer); }
    }
    return fd;
  };
  fs.readFileSync = (file, ...args) => {
    if (typeof file === 'number') { unbounded++; throw new Error('Unbounded FD read oracle'); }
    return wholeRead(file, ...args);
  };
  try {
    const snapshot = lligSnapshot({ arrel: root });
    assert.equal(opened, true); assert.equal(unbounded, 0);
    assert.equal(snapshot.documents.length, 0); assert.ok(snapshot.incidencies.length > 0);
  } finally { fs.openSync = open; fs.readFileSync = wholeRead; }
});

test('C3-IOBOUNDED creixement durant read no supera mida inicial+1', t => {
  const { root, write } = fixture(t), target = write('_wiki_de_poble/petit.md', 'petit');
  const read = fs.readSync, wholeRead = fs.readFileSync;
  let grew = false, requested = 0, unbounded = 0;
  fs.readSync = (fd, buffer, offset, length, position) => {
    requested += length;
    const n = read(fd, buffer, offset, length, position);
    if (!grew) { grew = true; const writer = fs.openSync(target, 'r+'); try { fs.ftruncateSync(writer, POLITICA.maxFitxerBytes + 1); } finally { fs.closeSync(writer); } }
    return n;
  };
  fs.readFileSync = (file, ...args) => {
    if (typeof file === 'number') { unbounded++; throw new Error('Unbounded FD read oracle'); }
    return wholeRead(file, ...args);
  };
  try {
    const snapshot = lligSnapshot({ arrel: root });
    assert.equal(unbounded, 0); assert.equal(grew, true); assert.ok(requested <= 7);
    assert.equal(snapshot.documents.length, 0); assert.ok(snapshot.incidencies.length > 0);
  } finally { fs.readSync = read; fs.readFileSync = wholeRead; }
});

test('C3-LEXBOUND current multiword fora gramàtica no produeix claim parcial', () => {
  const cat = catalogue('model', ['Claude Opus 5.5'], 'Model configurat: {valor}');
  const result = run([doc('model', 'Model configurat: Claude Opus 5.5')], cat);
  assert.equal(result.complet, false);
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.ok(findings(result, 'UNKNOWN').length > 0);
});

test('C3-LEXBOUND version component llarg no compara un prefix truncat', () => {
  const result = run([doc('versio', 'Producció: 1.2.2400000')], catalogue());
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.ok(findings(result, 'UNKNOWN').length > 0);
});

test('C3-LEXBOUND count llarg no es converteix en un altre valor', () => {
  const cat = catalogue('count', ['44'], 'Cens: {valor}');
  const result = run([doc('count', 'Cens: 1234567890123')], cat);
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.ok(findings(result, 'UNKNOWN').length > 0);
});

test('C3-LEXBOUND model amb continuació multiword no acredita token inicial', () => {
  const cat = catalogue('model', ['Claude'], 'Model configurat: {valor}');
  const result = run([doc('model', 'Model configurat: Claude Opus 5.5')], cat);
  assert.equal(findings(result, 'CLAIM_DIVERGENT').length, 0);
  assert.ok(findings(result, 'UNKNOWN').some(f => f.evidencia.claim === 'app'));
});

test('C3-LEXBOUND positius bounded mantenen model colon, semver i puntuació final', () => {
  const model = run([doc('model', 'Model configurat: qwen2.5-coder:14b.')], catalogue('model', ['qwen2.5-coder:14b'], 'Model configurat: {valor}'));
  assert.equal(findings(model, 'CLAIM_DIVERGENT').length, 0); assert.equal(model.complet, true);
  const version = run([doc('versio', 'Producció: v1.2.24-dev+build.1.')], catalogue('version', ['1.2.24-dev+build.1']));
  assert.equal(findings(version, 'CLAIM_DIVERGENT').length, 0); assert.equal(version.complet, true);
});


// MarIA 20:48 · Candidate-only corrections. No repository services.
test('2048 DRAFT excludes typed acts, route acts and archived aliases before age checks', () => {
  const result = run([
    doc('typed', fm({ type: 'acta', status: 'esborrany', date: '2020-01-01' })),
    doc('tipada', fm({ tipus: 'acta', status: 'esborrany' })),
    { cami: '_wiki_de_poble/10_actes/acta.md', text: fm({ status: 'esborrany', date: '2020-01-01' }) },
    doc('archived', fm({ status: 'arxivat', date: '2020-01-01' })),
    doc('active', fm({ status: 'esborrany', date: '2026-11-09' }))
  ]);
  assert.deepEqual(findings(result, 'DRAFT_ANTIC').map(x => x.cami), ['_wiki_de_poble/02_saber/active.md']);
  assert.equal(findings(result, 'UNKNOWN').some(x => x.cami.endsWith('/tipada.md') && /Edat/u.test(x.missatge)), false);
});

test('2048 ELEFANT includes local and explicit external skills with exact UTF8 threshold', () => {
  const result = run([
    { cami: '.agents/skills/exact/SKILL.md', text: 'é'.repeat(12_500) },
    { cami: '.agents/skills/large/SKILL.md', text: 'é'.repeat(12_501) },
    { cami: 'externes/1-maria/SKILL.md', text: 'x'.repeat(25_001), origen: 'externa' },
    { cami: '_wiki_de_poble/03_actuar/large.md', text: 'x'.repeat(25_001) }
  ]);
  assert.deepEqual(findings(result, 'ELEFANT').map(x => x.cami), ['.agents/skills/large/SKILL.md', 'externes/1-maria/SKILL.md']);
});

test('2048 skill pairs are unordered, unique, no self pairs and preserve Wiki pairs', () => {
  const body = 'Una instrucció llarga compartida amb una font i amb una estructura que cal revisar, sense inferir que es puga podar automàticament. '.repeat(3);
  const docs = [doc('wiki', body),
    { cami: '.agents/skills/z/SKILL.md', text: body },
    { cami: '.agents/skills/a/SKILL.md', text: body },
    { cami: 'externes/1-extra/SKILL.md', text: body, origen: 'externa' }];
  const a = run(docs), b = run([...docs].reverse());
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const pairs = findings(a, 'DUPLICAT_SKILL_SKILL');
  assert.equal(pairs.length, 3);
  assert.equal(new Set(pairs.map(x => x.cami + '\0' + x.evidencia.relacionat)).size, 3);
  assert.ok(pairs.every(x => x.cami < x.evidencia.relacionat && x.cami !== x.evidencia.relacionat));
  assert.ok(pairs.every(x => /citació/u.test(x.evidencia.limit)));
  assert.equal(findings(a, 'DUPLICAT_WIKI_SKILL').length, 3);
  assert.equal(findings(run([docs[1]]), 'DUPLICAT_SKILL_SKILL').length, 0);
});

test('2048 repeated paragraphs produce one skill pair; short and Wiki-only bodies do not', () => {
  const part = 'Procediment llarg amb una font concreta que només demana revisió humana de la duplicació, sense cap autorització per a eliminar documents. '.repeat(2);
  const a = { cami: '.agents/skills/a/SKILL.md', text: part + '\n\n' + part };
  const b = { cami: '.agents/skills/b/SKILL.md', text: part + '\n\n' + part };
  assert.equal(findings(run([a, b]), 'DUPLICAT_SKILL_SKILL').length, 1);
  assert.equal(findings(run([{ ...a, text: '# Títol' }, { ...b, text: '# Títol' }]), 'DUPLICAT_SKILL_SKILL').length, 0);
  assert.equal(findings(run([doc('a', part), doc('b', part)]), 'DUPLICAT_SKILL_SKILL').length, 0);
});

test('2048 pure protocolledge registry controls exact paths without runtime usage claims', () => {
  const skill = { cami: '.agents/skills/foo/SKILL.md', text: 'Procediment' };
  const result = run([skill, doc('free', 'Text')], {
    evidencies: [{ path: '.agents/protocolledge.json', text: JSON.stringify({ rutes: [{ skill: skill.cami }] }) }]
  });
  assert.equal(findings(result, 'ORFE').some(x => x.cami === skill.cami), false);
  assert.equal(findings(result, 'ORFE').some(x => x.cami.endsWith('/free.md')), true);
  assert.equal(result.cobertura.registreProtocolledgeDisponible, true);
});

test('2048 malformed protocolledge is incomplete, not silently ignored', () => {
  const result = run([doc('a', 'Text')], { evidencies: [{ path: '.agents/protocolledge.json', text: '{' }] });
  assert.equal(result.complet, false);
  assert.match(result.incidencies.join('\n'), /protocolledge/u);
});

test('2048 CLI passes protocolledge and quoted source references with provenance; readonly', t => {
  const { root, write } = fixture(t);
  write('.agents/skills/registered/SKILL.md', 'Procediment');
  write('_wiki_de_poble/02_saber/quoted.md', 'Nota de control');
  write('.agents/protocolledge.json', JSON.stringify({ rutes: [{ skill: '.agents/skills/registered/SKILL.md' }] }));
  write('tooling/probe.mjs', "const control = '_wiki_de_poble/02_saber/quoted.md';\n");
  const before = inventory(root), a = cli(root), b = cli(root);
  assert.equal(a.status, 0, a.stderr); assert.equal(a.stdout, b.stdout);
  const result = JSON.parse(a.stdout);
  assert.equal(result.cobertura.registreProtocolledgeDisponible, true);
  assert.equal(findings(result, 'ORFE').length, 0);
  const quote = findings(result, 'UNKNOWN').find(x => x.cami.endsWith('/quoted.md') && x.evidencia.controlRef);
  assert.ok(quote);
  assert.ok(quote.evidencia.controlFonts.some(x => x.font === 'tooling/probe.mjs' && x.linia === 1 && x.tipus === 'literal_codi' && x.executat === false));
  assert.deepEqual(inventory(root), before);
});

test('2048 comments, substring IDs, dynamic templates and ambiguous basename are not consumers', t => {
  const { root, write } = fixture(t);
  write('.agents/skills/foo/SKILL.md', 'Procediment');
  write('_wiki_de_poble/02_saber/target.md', 'Nota');
  write('_wiki_de_poble/01_ser/same.md', 'A'); write('_wiki_de_poble/02_saber/same.md', 'B');
  write('src/probe.js', [
    "// '_wiki_de_poble/02_saber/target.md'",
    "/* '.agents/skills/foo/SKILL.md' */",
    "const noise = 'foobarbaz';",
    "const dynamic = " + String.fromCharCode(96) + "_wiki_de_poble/" + "$" + "{section}/target.md" + String.fromCharCode(96) + ";",
    "const ambiguous = 'same.md';"
  ].join('\n'));
  const result = JSON.parse(cli(root).stdout);
  assert.equal(findings(result, 'ORFE').length, 2);
  const ambiguous = findings(result, 'UNKNOWN').filter(x => x.evidencia.possibleAmbiguousControl);
  assert.equal(ambiguous.length, 2);
  assert.ok(ambiguous.every(x => x.evidencia.controlRef === false && x.evidencia.controlFonts.some(f => f.font === 'src/probe.js' && f.ambigu === true && f.executat === false)));
  assert.ok(result.limits.some(x => /literal/u.test(x) && /runtime/u.test(x)));
});

test('2048 control code ignores secrets/archive and refuses symlinks without following them', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/02_saber/a.md', 'Nota');
  write('src/.env', Buffer.from([255])); write('src/credentials.json', Buffer.from([255]));
  write('src/90_arxiu_historic/forbidden.js', Buffer.from([255]));
  write('outside/target.js', "const x = '_wiki_de_poble/02_saber/a.md';");
  fs.mkdirSync(path.join(root, 'tooling'));
  fs.symlinkSync(path.join(root, 'outside/target.js'), path.join(root, 'tooling/link.js'));
  const before = inventory(root), child = cli(root), result = JSON.parse(child.stdout);
  assert.equal(child.status, 2);
  assert.ok(result.incidencies.some(x => /symlink/u.test(x)));
  assert.equal(findings(result, 'ORFE').length, 1);
  assert.deepEqual(inventory(root), before);
});

test('2048 control file size limits remain fail closed and bounded', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/02_saber/a.md', 'Nota');
  write('src/large.js', Buffer.alloc(POLITICA.maxFitxerBytes + 1, 120));
  const result = cli(root);
  assert.equal(result.status, 2); assert.equal(JSON.parse(result.stdout).complet, false);
});


test('2048 control native prefilter retains uppercase MD and reports skipped lexical work', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/02_saber/Si.MD', 'Nota');
  write('src/a.js', "const x = 'no document reference';");
  write('src/b.js', "const x = '_wiki_de_poble/02_saber/Si.MD';");
  const child = cli(root), report = JSON.parse(child.stdout);
  assert.equal(child.status, 0);
  assert.equal(report.cobertura.controlLiteral.fonts, 2);
  assert.equal(report.cobertura.controlLiteral.fontsAmbLiteralMarkdown, 1);
  assert.ok(findings(report, 'UNKNOWN').some(x => x.evidencia.controlRef));
  assert.equal(report.cobertura.controlLiteral.maxBytesDocuments, 64 * 1024 * 1024);
  assert.equal(report.cobertura.controlLiteral.maxFitxerBytes, 8 * 1024 * 1024);
});

test('2048 global control budget stops once without reading later sources or flooding incidents', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/02_saber/a.md', 'Nota');
  const overflow = write('src/a-overflow.js', 'Small file, synthetic metadata budget oracle.');
  const later = write('src/b-later.js', Buffer.from([255]));
  const lstat = fs.lstatSync, open = fs.openSync;
  let laterOpened = false;
  fs.lstatSync = (file, ...args) => {
    const st = lstat(file, ...args);
    if (file !== overflow) return st;
    return new Proxy(st, { get(target, key) {
      if (key === 'size') return POLITICA.maxControlBytes + 1;
      const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
    } });
  };
  fs.openSync = (file, ...args) => { if (file === later) laterOpened = true; return open(file, ...args); };
  try {
    const snapshot = lligSnapshot({ arrel: root });
    assert.equal(snapshot.coberturaControl.aturat, true);
    assert.equal(snapshot.incidencies.length, 1);
    assert.match(snapshot.incidencies[0], /Límit global de bytes/u);
    assert.equal(laterOpened, false);
    assert.equal(run(snapshot.documents, snapshot).estat, 'INCOMPLET');
  } finally { fs.lstatSync = lstat; fs.openSync = open; }
});


test('2048 control invalid UTF8 without Markdown candidate remains incomplete', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/02_saber/a.md', 'Nota');
  write('src/invalid.js', Buffer.from([255]));
  const child = cli(root), result = JSON.parse(child.stdout);
  assert.equal(child.status, 2);
  assert.equal(result.complet, false);
  assert.ok(result.incidencies.some(x => /UTF-8/u.test(x)));
});

test('2048 control leaf metadata reuse still rejects growth after open', t => {
  const { root, write } = fixture(t), target = write('src/growing.js', 'text');
  write('_wiki_de_poble/02_saber/a.md', 'Nota');
  const open = fs.openSync;
  let changed = false;
  fs.openSync = (file, ...args) => {
    const fd = open(file, ...args);
    if (file === target && !changed) {
      changed = true; const writer = open(file, 'r+');
      try { fs.ftruncateSync(writer, 20); } finally { fs.closeSync(writer); }
    }
    return fd;
  };
  try {
    const snapshot = lligSnapshot({ arrel: root });
    assert.equal(changed, true);
    assert.ok(snapshot.incidencies.some(x => /canviat en obrir/u.test(x)));
    assert.equal(run(snapshot.documents, snapshot).complet, false);
  } finally { fs.openSync = open; }
});
