// DESTÍ: tests/frontissa-contingut.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { comprova, empremta, retall, executa, carregaContingut, REGISTRE } from '../tooling/gates/frontissa-contingut.mjs';

const pagina = (html) => ({ title: 'T', html });

/** Un Mas mínim en un directori temporal, amb el contingut i els consumidors. */
function mas(pagines, registre = null) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'frontissa-'));
  const escriu = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
    fs.writeFileSync(path.join(arrel, rel), text);
  };
  escriu('package.json', '{"type":"module"}\n');
  escriu('src/sections/text/pageContent.js', `export const PAGE_COPY = ${JSON.stringify(pagines)};\n`);
  escriu('src/config/systemPages.js', "export const SYSTEM_PAGES = [{ key: 'projecte' }, { key: 'wikidepoble' }];\nexport const COVER_PAGE_KEYS = { wiki: 'wikidepoble' };\n");
  escriu('src/config/sections.js', "export const SECTIONS = [\n  { id: 'legal', pageKey: 'legal' }\n];\n");
  if (registre) escriu(REGISTRE, JSON.stringify(registre));
  return arrel;
}

const complet = () => ({ projecte: pagina('<p>projecte</p>'), wikidepoble: pagina('<p>wiki de poble</p>'), legal: pagina('<p>legal</p>') });

test('deriva les claus obligatòries dels consumidors', async () => {
  const { requerides } = await carregaContingut(mas(complet()));
  assert.deepEqual(requerides, ['legal', 'projecte', 'wikidepoble']);
});

test('una clau demanada i absent fa fallar la porta (el cas del 24-09)', () => {
  const r = comprova({ PAGE_COPY: { projecte: pagina('x'), legal: pagina('y') }, requerides: ['legal', 'projecte', 'wikidepoble'] }, null);
  assert.equal(r.valid, false);
  assert.deepEqual(r.errors.map((e) => e.codi), ['registre-absent', 'absent']);
  assert.equal(r.correctes, null);
});

test('un comentari que nomene la clau no la fa existir: es mira l’objecte', async () => {
  const arrel = mas({ projecte: pagina('x'), legal: pagina('y') });
  fs.appendFileSync(path.join(arrel, 'src/sections/text/pageContent.js'), '// wikidepoble\n');
  const contingut = await carregaContingut(arrel);
  assert.equal(comprova(contingut, null).errors.some((e) => e.codi === 'absent' && e.clau === 'wikidepoble'), true);
});

test('--inicia registra l’estat actual i després la porta passa', async () => {
  const arrel = mas(complet());
  await executa(['--inicia', '--per', 'Mestre'], arrel);
  const r = await executa([], arrel);
  assert.equal(r.valid, true);
  assert.equal(r.correctes, 3);
  assert.equal(r.requerides, 3);
});

test('--inicia no accepta un registre amb claus absents', async () => {
  const arrel = mas({ projecte: pagina('x') });
  await assert.rejects(() => executa(['--inicia', '--per', 'Mestre'], arrel), /claus absents/);
});

test('un canvi d’empremta falla fins que s’aprova, i l’aprovació és d’eixa empremta', () => {
  const abans = complet();
  const registre = { schema: 'sdp.contingut.v1', claus: Object.fromEntries(Object.entries(abans).map(([k, v]) => [k, { ...empremta(v), aprovat_per: 'Mestre', data: '2026-09-24' }])) };
  const despres = { ...abans, projecte: pagina('<p>projecte reescrit</p>') };
  const r = comprova({ PAGE_COPY: despres, requerides: Object.keys(despres) }, registre);
  assert.deepEqual(r.errors.map((e) => [e.clau, e.codi]), [['projecte', 'empremta-divergent']]);
  registre.claus.projecte = { ...empremta(despres.projecte), aprovat_per: 'Mestre', data: '2026-09-24' };
  assert.equal(comprova({ PAGE_COPY: despres, requerides: Object.keys(despres) }, registre).valid, true);
  const altra = { ...despres, projecte: pagina('<p>un altre canvi</p>') };
  assert.equal(comprova({ PAGE_COPY: altra, requerides: Object.keys(altra) }, registre).valid, false);
});

test('un retall del 30% o més es diu com a retall, no com a canvi', () => {
  const registrada = { ...empremta(pagina('x'.repeat(100))), aprovat_per: 'Mestre', data: '2026-09-24' };
  const actual = pagina('x'.repeat(60));
  assert.equal(Math.round(retall(registrada, empremta(actual)) * 100), 40);
  const r = comprova({ PAGE_COPY: { projecte: actual }, requerides: ['projecte'] }, { schema: 'sdp.contingut.v1', claus: { projecte: registrada } });
  assert.equal(r.errors[0].codi, 'retall');
});

test('--aprova refusa un retall gran sense --accepta-retall', async () => {
  const gran = { ...complet(), projecte: pagina('x'.repeat(100)) };
  const registre = { schema: 'sdp.contingut.v1', claus: Object.fromEntries(Object.entries(gran).map(([k, v]) => [k, { ...empremta(v), aprovat_per: 'Mestre', data: '2026-09-24' }])) };
  const arrel = mas({ ...gran, projecte: pagina('x'.repeat(10)) }, registre);
  await assert.rejects(() => executa(['--aprova', 'projecte', '--per', 'Mestre'], arrel), /--accepta-retall/);
  await executa(['--aprova', 'projecte', '--per', 'Mestre', '--accepta-retall'], arrel);
  assert.equal((await executa([], arrel)).valid, true);
});

test('--retira no deixa llevar una clau que un consumidor encara demana', async () => {
  const arrel = mas(complet());
  await executa(['--inicia', '--per', 'Mestre'], arrel);
  await assert.rejects(() => executa(['--retira', 'wikidepoble', '--per', 'Mestre'], arrel), /encara la demana/);
});
