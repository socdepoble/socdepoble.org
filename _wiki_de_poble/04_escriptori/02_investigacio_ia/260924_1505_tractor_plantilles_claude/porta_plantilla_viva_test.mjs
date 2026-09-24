/* Destí: tests/porta-plantilla-viva.test.mjs · node --test */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  categoriaDelNom, vigilat, rutesDelNom, revisaEstructura, quarantena, vigila, plist, QUARANTENA
} from '../tooling/gates/porta-plantilla-viva.mjs';

const DESK = '_wiki_de_poble/04_escriptori';

const RUTA = Object.freeze({
  id: 'prompt.local', tipus: 'prompt',
  seccions: ['Registre', 'Context', 'Tasques', 'Vincles'],
  fixedBlocks: { Context: 'Text fix de la plantilla.' },
  output: { type: 'prompt', status: 'esborrany', description: 'x', tags: ['govern'] }
});
const ESQUEMA = Object.freeze({
  type: 'object', additionalProperties: false,
  properties: {
    type: { type: 'string' }, status: { type: 'string' }, description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } }, reflex: { type: 'string' }, visibility: { type: 'string' }
  }
});
const REGISTRE = ['Identificador', 'Model IA'];
const DADES = Object.freeze({ type: 'prompt', status: 'esborrany', description: 'Prova', tags: ['govern'], reflex: 'sdp:x' });
const COS = [
  '# Títol', '',
  '## Registre', '', '| Camp | Valor |', '| --- | --- |', '| Identificador | x |', '| Model IA | [pendent] |', '',
  '## Context', '', 'Text fix de la plantilla.', '',
  '## Tasques', '', '[pendent]', '',
  '### Criteris d’acceptació', '', '- un', '',
  '## Vincles', '', '- [[00_index]]', ''
].join('\n');
const revisa = (canvis = {}) => revisaEstructura({
  nom: '260924_1500_prompt_claude.md', data: DADES, body: COS, route: RUTA, schema: ESQUEMA, registre: REGISTRE, ...canvis
});

test('la categoria és el prefix més llarg del catàleg vigilat', () => {
  assert.equal(categoriaDelNom('260924_1500_pla_implementacio_claude.md'), 'pla_implementacio');
  assert.equal(categoriaDelNom('260924_1500_pla_fases.md'), 'pla');
  assert.equal(categoriaDelNom('260924_1500_prompt_claude.md'), 'prompt');
  assert.equal(categoriaDelNom('260924_1500_macro_prompt_z.md'), 'macro_prompt');
  assert.equal(categoriaDelNom('260924_1500_PROMPT_Claude.md'), 'prompt', 'les majúscules no escapen');
  assert.equal(categoriaDelNom('260924_1000_acta_pla_nou.md'), null, 'un títol amb «pla» no fa pla el document');
  assert.equal(categoriaDelNom('260924_1505_auditoria_claude.md'), null);
});

test('vigila prompts i plans amb nom lliure, i res més', () => {
  for (const nom of ["Pla d'implementació.md", 'prompt claude.md', 'Petorreta-Z.md', '260924_1500_prompt_claude.md']) assert.ok(vigilat(nom), nom);
  for (const nom of ['00_index_escriptori.md', '260924_1505_auditoria_claude.md', 'plantilla.md', '.ancora_sessio.json', 'prompt.txt']) assert.ok(!vigilat(nom), nom);
});

test('la ruta es deduïx del nom', () => {
  assert.deepEqual([...rutesDelNom('260924_1500_pla_implementacio_claude.md')], ['pla.implementacio']);
  assert.deepEqual([...rutesDelNom("Pla d'implementació.md")], ['pla.implementacio']);
  assert.equal(rutesDelNom('prompt claude.md')[0], 'prompt.local');
});

test('un document fidel a la plantilla passa encara amb seccions [pendent]', () => {
  assert.deepEqual(revisa(), []);
});

test('diu tots els incompliments alhora', () => {
  const cos = COS.replace('## Vincles', '## Diàleg a l’Olivera').replace('Text fix de la plantilla.', 'Context inventat.');
  const errors = revisa({ nom: '260924_1500_PROMPT_Claude.md', data: { ...DADES, type: 'document', tags: undefined }, body: cos });
  const te = (tros) => assert.ok(errors.some((e) => e.includes(tros)), `${tros} a ${JSON.stringify(errors)}`);
  te('nom:');
  te('type:');
  te('secció absent: «## Vincles»');
  te('secció fora de plantilla: «## Diàleg a l’Olivera»');
  te('bloc normatiu alterat: «Context»');
});

test('la clau de la plantilla ha d’estar, encara que l’esquema la permeta absent', () => {
  const { tags, ...sense } = DADES;
  assert.equal(tags.length, 1);
  assert.ok(revisa({ data: sense }).some((e) => e === 'frontmatter: falta «tags», que la plantilla porta'));
});

test('ordre, repetició i files del Registre', () => {
  const girat = COS.replace(/## Tasques[\s\S]*?(?=## Vincles)/, '').replace('## Registre', '## Tasques\n\n[pendent]\n\n## Registre');
  assert.ok(revisa({ body: girat }).some((e) => e.startsWith('ordre de seccions')));
  assert.ok(revisa({ body: `${COS}\n## Tasques\n\nbis\n` }).some((e) => e === 'secció repetida: «## Tasques»'));
  assert.ok(revisa({ body: COS.replace('| Model IA | [pendent] |\n', '') }).some((e) => e === 'Registre: falta la fila «Model IA»'));
});

test('un encapçalament dins d’un bloc de codi no compta com a secció', () => {
  assert.deepEqual(revisa({ body: COS.replace('- un', '```markdown\n## Inventada\n```') }), []);
});

function arrelTemporal() {
  // A macOS /var és un symlink: el vigilant ha d'observar la ruta real.
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'plantilla-viva-'));
  fs.mkdirSync(path.join(root, DESK), { recursive: true });
  return root;
}

test('la quarantena mou el document sense rebut i hi deixa el motiu; mai el que té rebut', () => {
  const root = arrelTemporal();
  try {
    const rel = `${DESK}/260924_1500_prompt_claude.md`;
    fs.writeFileSync(path.join(root, rel), '---\ntype: prompt\n---\n');
    const amb = quarantena(root, rel, { rebut: 'torn_x:y', ruta: 'prompt.local', errors: ['x'] });
    assert.equal(amb.mogut, false);
    assert.ok(fs.existsSync(path.join(root, rel)));
    const sense = quarantena(root, rel, { rebut: null, ruta: 'prompt.local', errors: ['reflex: sense rebut'] }, { ara: new Date('2026-09-24T13:00:00Z') });
    assert.equal(sense.mogut, true);
    assert.ok(!fs.existsSync(path.join(root, rel)));
    const desti = path.join(root, QUARANTENA, '260924_1500_prompt_claude.md');
    assert.ok(fs.existsSync(desti));
    const motiu = JSON.parse(fs.readFileSync(`${desti}.rebuig.json`, 'utf8'));
    assert.deepEqual(motiu.errors, ['reflex: sense rebut']);
    assert.ok(motiu.recuperacio.some((pas) => pas.includes('document.mjs context')));
    fs.writeFileSync(path.join(root, rel), 'segona');
    const segona = quarantena(root, rel, { rebut: null, ruta: null, errors: ['y'] }, { ara: new Date('2026-09-24T13:05:00Z') });
    assert.equal(segona.desti, `${QUARANTENA}/20260924T130500Z_260924_1500_prompt_claude.md`, 'no trepitja la primera');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('la quarantena no toca res fora del primer nivell', () => {
  const root = arrelTemporal();
  try {
    fs.mkdirSync(path.join(root, DESK, '00_bandeja_d_entrada'));
    const rel = `${DESK}/00_bandeja_d_entrada/prompt a mà.md`;
    fs.writeFileSync(path.join(root, rel), 'esborrany humà');
    assert.equal(quarantena(root, rel, { rebut: null, errors: ['x'] }).mogut, false);
    assert.ok(fs.existsSync(path.join(root, rel)));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('el vigilant mou el prompt que naix fora de plantilla i deixa estar la resta', async () => {
  const root = arrelTemporal();
  const registre = [];
  const revisor = (_root, rel) => ({ fitxer: rel, ruta: 'prompt.local', rebut: null, errors: rel.endsWith('_prompt_claude.md') ? ['reflex: sense rebut'] : [] });
  const v = vigila(root, { quarantena: true, espera: 40, revisor, log: (l) => registre.push(l) });
  try {
    fs.writeFileSync(path.join(root, DESK, '260924_1500_prompt_claude.md'), 'a mà');
    fs.writeFileSync(path.join(root, DESK, '260924_1501_auditoria_claude.md'), 'no vigilada');
    const limit = Date.now() + 3000;
    while (fs.existsSync(path.join(root, DESK, '260924_1500_prompt_claude.md')) && Date.now() < limit) {
      await new Promise((r) => setTimeout(r, 25));
    }
    assert.ok(!fs.existsSync(path.join(root, DESK, '260924_1500_prompt_claude.md')), 'el prompt ja no és a l’Escriptori');
    assert.ok(fs.existsSync(path.join(root, QUARANTENA, '260924_1500_prompt_claude.md')));
    assert.ok(fs.existsSync(path.join(root, DESK, '260924_1501_auditoria_claude.md')), 'l’auditoria no és cosa seua');
    assert.ok(registre.some((l) => l.includes('"mogut":true')));
  } finally { v.tanca(); fs.rmSync(root, { recursive: true, force: true }); }
});

test('el llançador escapa les rutes i arrenca el vigilant amb quarantena', () => {
  const xml = plist('/Users/x/Som & Poble', '/usr/local/bin/node');
  assert.ok(xml.includes('<string>org.socdepoble.plantilla-viva</string>'));
  assert.ok(xml.includes('/Users/x/Som &amp; Poble/tooling/gates/porta-plantilla-viva.mjs'));
  for (const flag of ['--vigila', '--quarantena', '--avisa']) assert.ok(xml.includes(`<string>${flag}</string>`));
});
