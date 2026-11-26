import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { construeixManifest, compila } from '../tooling/wiki/compile-wiki-to-app.mjs';
import { publicSkillFile, publicWikiFile, publicSeoRoute, publicMetadata } from '../tooling/wiki/lib/publication-policy.mjs';
import { projectaSkills, escriuSkills, diferenciesSkills, emmascaraInfraPrivada } from '../tooling/wiki/lib/public-skills.mjs';
import { projectaLlms, escriuLlms, diferenciesLlms } from '../tooling/seo/genera-llms.mjs';
import { policiaVocabulari } from '../tooling/gates/policia-vocabulari.mjs';

const doc = (meta = '') => `---\ntype: document\nstatus: esborrany\n${meta}---\n# Revisió oberta\nCos públic.\n`;
const skill = (meta = '') => `---\nname: segura\ntype: skill\nstatus: canonic\ndescription: Procediment de poble\ntags: [wiki, proves]\ncore: true\n${meta}---\n# Skill oberta\n\nCos sencer amb /Users/prova/fitxer.\n`;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-c26-4-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text, mode) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
    fs.chmodSync(abs, mode ?? 0o644);
    return abs;
  };
  write('_wiki_de_poble/01_ser/revisio.md', doc('title: Revisió\n'));
  return { root, write };
}

test('D4 B: esborrany visible en SER/SABER/ACTUAR amb flags, privat exclòs i desconegut tancat', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/02_saber/public.md', doc('visibility: public\ntitle: Segon\n'));
  write('_wiki_de_poble/03_actuar/legacy.md', doc('title: Tercer\n'));
  write('_wiki_de_poble/02_saber/privat.md', doc('visibility: private\n'));
  write('_wiki_de_poble/02_saber/desconegut.md', doc('visibility: interna\n'));
  const { items } = construeixManifest(root);
  assert.equal(items.length, 3);
  for (const item of items) for (const flags of [item, item.attributes]) {
    assert.equal(flags.esborrany, true);
    assert.equal(flags.noindex, true);
  }
  assert.equal(publicSeoRoute('/wikidepoble/revisio', { status: 'esborrany' }), false);
  assert.equal(publicMetadata({ status: 'esborrany' }), true);
  /* v1.2.26 · Gauntlet C26-4 #2 (canvi intencionat de l'oracle) · L'esborrany es llig a /wikidepoble
     (el manifest de dalt), però no té còpia a /md: un «Robots: noindex» escrit dins del Markdown no és cap
     senyal HTTP i cap consumidor no llig eixa còpia. Abans l'oracle exigia la còpia amb eixa línia. */
  const projection = projectaLlms({ root });
  assert.equal(projection.fitxers.size, 0);
  assert.doesNotMatch(projection.llms, /\/md\//);
  escriuLlms(root);
  assert.deepEqual(fs.readdirSync(path.join(root, 'public/md')), ['skills']);
  assert.deepEqual(diferenciesLlms(root), []);
  // Un document que passa de canonic a esborrany retira la seua còpia anterior de /md.
  write('_wiki_de_poble/02_saber/canonic.md', '---\ntype: document\nstatus: canonic\ntitle: Canonic\n---\n# Canonic\nCos.\n');
  escriuLlms(root);
  assert.deepEqual(fs.readdirSync(path.join(root, 'public/md')).sort(), ['canonic.md', 'skills']);
  write('_wiki_de_poble/02_saber/canonic.md', '---\ntype: document\nstatus: esborrany\ntitle: Canonic\n---\n# Canonic\nCos.\n');
  assert.ok(diferenciesLlms(root).some((d) => /canonic\.md sobra/.test(d)));
  escriuLlms(root);
  assert.deepEqual(fs.readdirSync(path.join(root, 'public/md')), ['skills']);
});

test('IDEA-364: contracte complet, font única íntegra, camins emmascarats i eixida determinista', t => {
  const { root, write } = fixture(t);
  const source = write('.agents/skills/segura/SKILL.md', skill());
  const projection = projectaSkills(root);
  assert.deepEqual(projection.index.skills[0], {
    name: 'segura', title: 'Skill oberta', description: 'Procediment de poble', tags: ['wiki', 'proves'],
    core: true, url: '/md/skills/segura.md', bytes: Buffer.byteLength(skill().replace('/Users/prova/', '~/'))
  });
  assert.equal(projection.index.total, 1);
  // v1.2.26 · Gauntlet C26-4 #6 · Sense cap date/updated declarat, generatedAt és null, mai 1970.
  assert.equal(projection.index.generatedAt, null);
  assert.deepEqual(projectaSkills(root), projection);
  assert.equal(publicSkillFile(root, source), fs.realpathSync(source));
  assert.equal(publicWikiFile(root, source), null, 'excepció skills no amplia frontera Wiki/RAG');
  assert.match(projection.fitxers.get('segura'), /Cos sencer amb ~\/fitxer/);
  assert.equal(escriuSkills(root).changed, true);
  assert.equal(escriuSkills(root).changed, false);
  assert.deepEqual(diferenciesSkills(root), []);
  fs.appendFileSync(source, '\nCanvi únic de font.\n');
  assert.ok(diferenciesSkills(root).length);
  escriuSkills(root);
  assert.match(fs.readFileSync(path.join(root, 'public/md/skills/segura.md'), 'utf8'), /Canvi únic de font/);
});

test('P0: mai runtime/ESTAT/LEDGER/hooks/seals/privats/0600 ni traversal, noms o profunditats fora de llista blanca', t => {
  const { root, write } = fixture(t);
  write('.agents/skills/oberta/SKILL.md', skill());
  for (const rel of ['.agents/runtime/SKILL.md', '.agents/ESTAT.md', '.agents/LEDGER.md', '.agents/hooks/SKILL.md',
    '.agents/seal-transactions/SKILL.md', '.agents/skills/oberta/extra.md', '.agents/skills/oberta/nested/SKILL.md',
    '.agents/skills/BadName/SKILL.md']) {
    const file = write(rel, 'SECRET-P0');
    assert.equal(publicSkillFile(root, file), null, rel);
  }
  write('.agents/skills/privada/SKILL.md', skill('visibility: private\n'));
  write('.agents/skills/perfil/SKILL.md', skill(), 0o600);
  for (const rel of ['.agents/skills/oberta/../oberta/SKILL.md', '.agents/skills/oberta/SKILL.md/extra',
    '.agents/skills/oberta/./SKILL.md', '.agents\\skills\\oberta\\SKILL.md', '/etc/passwd']) assert.equal(publicSkillFile(root, rel), null, rel);
  assert.equal(publicSkillFile(root, `${root}/.agents/skills/oberta/../oberta/SKILL.md`), null);
  const projection = projectaSkills(root);
  assert.deepEqual(projection.index.skills.map(s => s.name), ['oberta']);
  assert.doesNotMatch(JSON.stringify([...projection.fitxers]), /SECRET-P0/);
});

test('P0: links de fitxer, carpeta skill i pare skills/agents no publiquen secrets', t => {
  for (const mode of ['file', 'skill', 'skills', 'agents']) {
    const { root, write } = fixture(t);
    const secret = write('secret/SKILL.md', skill());
    if (mode === 'file') { fs.mkdirSync(path.join(root, '.agents/skills/oberta'), { recursive: true }); fs.symlinkSync(secret, path.join(root, '.agents/skills/oberta/SKILL.md')); }
    if (mode === 'skill') { fs.mkdirSync(path.join(root, '.agents/skills'), { recursive: true }); fs.symlinkSync(path.dirname(secret), path.join(root, '.agents/skills/oberta')); }
    if (mode === 'skills') { write('outside/oberta/SKILL.md', skill()); fs.mkdirSync(path.join(root, '.agents')); fs.symlinkSync(path.join(root, 'outside'), path.join(root, '.agents/skills')); }
    if (mode === 'agents') { write('outside/skills/oberta/SKILL.md', skill()); fs.symlinkSync(path.join(root, 'outside'), path.join(root, '.agents')); }
    assert.equal(projectaSkills(root).index.total, 0, mode);
  }
});

test('retirada: passar una skill a private/0600 elimina còpia i índex anteriors; llms reconeix skills', t => {
  const { root, write } = fixture(t);
  write('.agents/skills/oberta/SKILL.md', skill());
  escriuLlms(root);
  assert.deepEqual(diferenciesLlms(root), []);
  write('.agents/skills/oberta/SKILL.md', skill('visibility: private\n'));
  assert.ok(diferenciesLlms(root).length);
  escriuLlms(root);
  assert.equal(fs.existsSync(path.join(root, 'public/md/skills/oberta.md')), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'public/md/skills/index.json'))).total, 0);
});

test('compila genera skills sense afegir cos de skills a wikiManifest, i write:false no escriu', t => {
  const { root, write } = fixture(t);
  write('.agents/skills/oberta/SKILL.md', skill());
  assert.equal(compila({ root, write: false }).changed, false);
  assert.equal(fs.existsSync(path.join(root, 'public')), false);
  write('src/data/wikiManifest.js', '');
  compila({ root });
  assert.equal(fs.existsSync(path.join(root, 'public/md/skills/index.json')), true);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/data/wikiManifest.js'), 'utf8'), /Skill oberta|Cos sencer/);
});

test('P0: eixida public, md o skills simbòlica no escriu fora; output links no es seguixen', t => {
  for (const relative of ['public', 'public/md', 'public/md/skills']) {
    const { root, write } = fixture(t);
    write('.agents/skills/oberta/SKILL.md', skill());
    fs.mkdirSync(path.join(root, 'fora'));
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.symlinkSync(path.join(root, 'fora'), path.join(root, relative));
    assert.throws(() => escriuSkills(root), /carpeta real/);
    assert.deepEqual(fs.readdirSync(path.join(root, 'fora')), []);
  }
  const { root, write } = fixture(t);
  write('.agents/skills/oberta/SKILL.md', skill());
  const sentinel = write('sentinel.md', 'intacte');
  write('public/md/skills/stale.md', 'còpia privada antiga');
  fs.symlinkSync(sentinel, path.join(root, 'public/md/skills/oberta.md'));
  escriuSkills(root);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'intacte');
  assert.equal(fs.existsSync(path.join(root, 'public/md/skills/stale.md')), false);
});

test('policia: avisos contextuals sense substituir municipis, codi ni USA', () => {
  const text = 'La intel·ligència artificial del poble usa models.\nLa tecnologia del poble de Sella és municipal.\nL’ajuntament del poble conserva l’arxiu. USA.\n`usa`\n```js\nusa();\n```\n';
  assert.deepEqual(policiaVocabulari(text).map(a => a.codi), ['VOC-DE-POBLE', 'VOC-UTILITZA']);
  assert.equal(policiaVocabulari('La IAIA de poble utilitza models.').length, 0);
  assert.equal(policiaVocabulari('usa', { llengua: 'es' }).length, 0);
  assert.equal(policiaVocabulari('@'.repeat(100_000)).length, 0);
});

/* v1.2.26 · Gauntlet C26-4 #4 i #5 · Majúscula a l'inici de frase, frases canòniques de core-identitat,
   marques del sistema, gentilicis, URL d'enllaços i exempció metalingüística; sempre en mode avís. */
test('policia: «Usa/Usen» a l’inici de frase, frases canòniques i marques, sense falsos positius coneguts', () => {
  const codis = (text) => policiaVocabulari(text).map((a) => `${a.codi}:${a.original}`);
  assert.deepEqual(codis('Usa-la en arrencar. Usen el hook. S’usa poc.'), ['VOC-UTILITZA:Usa', 'VOC-UTILITZA:Usen', 'VOC-UTILITZA:usa']);
  assert.deepEqual(codis('la IA del poble; la filosofia del poble; les imatges del poble; al servei del poble'),
    ['VOC-DE-POBLE:IA del poble', 'VOC-DE-POBLE:filosofia del poble', 'VOC-DE-POBLE:imatges del poble', 'VOC-DE-POBLE:al servei del poble']);
  assert.deepEqual(policiaVocabulari('les imatges del poble').map((a) => a.proposta), ['l’imaginari de poble']);
  assert.deepEqual(policiaVocabulari('Wiki del Poble').map((a) => a.proposta), ['Wiki de Poble']);
  for (const net of ['USA i la NASA', 'la identitat cultural del poble valencià', 'la manera de ser del poble gitano',
    '[mapa](https://exemple.org/usa/mapa)', 'made-in-usa', 'la cita «se usa poco»', 'Visita https://usa.gov/usa ara',
    '[ref]: https://exemple.org/usa', 'el mercat del poble', 'la memòria del poble de Muro', 'mai *«La IAIA usa...»*',
    'no diem *«La IAIA usa...»*', '## Algoritme «de poble vs. del poble» i «utilitza vs. usa»', '(i mai *Sóc del Poble*)',
    'les repeticions que deien *«imatges del poble»*, *«al servei del poble»* i *«paraules del poble»* passen']) {
    assert.deepEqual(codis(net), [], net);
  }
  // L'exempció necessita la cita: «mai usa» en prosa és un calc i avisa.
  assert.deepEqual(codis('La IAIA mai usa la xarxa.'), ['VOC-UTILITZA:usa']);
  for (const patologic of ['usa «'.repeat(20_000), `${' '.repeat(100_000)}mai «usa»`, `${'*'.repeat(100_000)}usa`, `«${'a'.repeat(100_000)}`]) {
    const inici = Date.now();
    policiaVocabulari(patologic);
    assert.ok(Date.now() - inici < 2000, 'cap entrada fa explotar el temps');
  }
});

test('skills públiques: cap adreça de la xarxa local ni camí del perfil privat; la font no es toca', t => {
  const { root, write } = fixture(t);
  const cos = 'Les 4 IAIAs del Node 0 (`192.168.0.23:11434`) i 10.0.0.7, 172.20.1.2:8080 o mac-mini.local:11434.\n'
    + 'MarIA reescriu el punter a `~/.gemini/config/sdp-perfil-privat/punter_episodic.md` i regenera la còpia.\n'
    + 'Públiques: 8.8.8.8, 172.15.0.1, la versió 10.2.3 i https://socdepoble.org:443/.\n';
  const source = write('.agents/skills/segura/SKILL.md', skill() + cos);
  const abans = fs.readFileSync(source, 'utf8');
  const publica = projectaSkills(root).fitxers.get('segura');
  assert.doesNotMatch(publica, /192\.168|10\.0\.0\.7|172\.20|mac-mini\.local|11434|8080|sdp-perfil-privat|\.gemini/);
  assert.match(publica, /Node 0 \(`adreça de la xarxa local`\) i adreça de la xarxa local, adreça de la xarxa local o adreça de la xarxa local\./);
  assert.match(publica, /el punter a perfil local privat i regenera/);
  assert.match(publica, /8\.8\.8\.8, 172\.15\.0\.1, la versió 10\.2\.3 i https:\/\/socdepoble\.org:443\//);
  assert.equal(projectaSkills(root).index.skills[0].bytes, Buffer.byteLength(publica));
  assert.equal(fs.readFileSync(source, 'utf8'), abans, 'la skill font no es toca');
  const inici = Date.now();
  emmascaraInfraPrivada(`${'a'.repeat(100_000)}sdp-perfil-privat${'b'.repeat(100_000)} ${'1.'.repeat(50_000)}`);
  assert.ok(Date.now() - inici < 2000);
});

test('skills públiques: títol genèric → nom, generatedAt de les dates declarades i .DS_Store no posa en roig', t => {
  const { root, write } = fixture(t);
  write('.agents/skills/core-automillora/SKILL.md', '---\nname: core-automillora\ntype: skill\nstatus: canonic\ndescription: Millora\n---\n# CONCEPTE\n\nCos.\n');
  write('.agents/skills/datada/SKILL.md', skill('updated: 2026-11-20\n').replace('# Skill oberta', '# Skill datada'));
  write('.agents/skills/vella/SKILL.md', skill('date: 2026-10-01\n'));
  const { index } = projectaSkills(root);
  assert.deepEqual(index.skills.map((s) => [s.name, s.title]), [['core-automillora', 'core-automillora'], ['datada', 'Skill datada'], ['vella', 'Skill oberta']]);
  assert.equal(index.generatedAt, new Date('2026-11-20').toISOString());
  escriuSkills(root);
  fs.writeFileSync(path.join(root, 'public/md/skills/.DS_Store'), 'Finder');
  assert.deepEqual(diferenciesSkills(root), []);
  fs.writeFileSync(path.join(root, 'public/md/skills/sobrer.md'), 'no és cap skill');
  assert.deepEqual(diferenciesSkills(root), ['public/md/skills/sobrer.md sobra']);
  escriuSkills(root);
  assert.deepEqual(fs.readdirSync(path.join(root, 'public/md/skills')).sort(), ['core-automillora.md', 'datada.md', 'index.json', 'vella.md']);
});

test('índex buit absent no passa la comprovació de skills', t => {
  const { root } = fixture(t);
  assert.equal(projectaSkills(root).index.total, 0);
  assert.deepEqual(diferenciesSkills(root), ['public/md/skills falta']);
  escriuSkills(root);
  assert.deepEqual(diferenciesSkills(root), []);
});
