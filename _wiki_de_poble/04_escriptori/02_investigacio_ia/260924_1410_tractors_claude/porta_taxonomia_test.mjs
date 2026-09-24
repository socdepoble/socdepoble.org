// DESTÍ: tests/porta-taxonomia.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analitzaNom, dinsAbast, comprovaRutes, categoriesDeLaPagina, paritat } from '../tooling/gates/porta-taxonomia.mjs';

const CONFIG = {
  schema: 'sdp.taxonomia.v1',
  pagina: 'pagina.md',
  superficies: ['_wiki_de_poble/04_escriptori', '_wiki_de_poble/10_actes'],
  exempts: { '00_index_escriptori.md': 'índex' },
  tolerancia_dies_passat: 30,
  categories: { acta: 'acta', auditoria: 'auditoria', pla: 'planificacio', pla_implementacio: 'pla.implementacio', prompt: 'prompt.local' }
};
const ARA = new Date(2026, 8, 24, 14, 10);
const lleis = (nom, opcions = {}) => analitzaNom(nom, CONFIG, { ara: ARA, ...opcions }).errors.map((e) => e.llei);

test('accepta els noms canònics i en trau categoria i títol', () => {
  assert.deepEqual(analitzaNom('260924_1410_auditoria_claude.md', CONFIG, { ara: ARA }),
    { nom: '260924_1410_auditoria_claude.md', valid: true, categoria: 'auditoria', titol: 'claude', errors: [] });
  const pla = analitzaNom('260924_1245_pla_implementacio_claude.md', CONFIG, { ara: ARA });
  assert.equal(pla.categoria, 'pla_implementacio');
  assert.equal(pla.titol, 'claude');
});

test('T1 diu la causa concreta del format', () => {
  const causa = (nom) => analitzaNom(nom, CONFIG, { ara: ARA }).errors[0].missatge;
  assert.match(causa('260924_1445_ACTA_MARMOTA_consola.md'), /majúscules/);
  assert.match(causa('260924_1445_acta-marmota.md'), /guions/);
  assert.match(causa('260924_1445_acta_incidència.md'), /accents/);
  assert.match(causa('260924_1445_acta marmota.md'), /espais/);
  assert.match(causa('acta_marmota.md'), /aammdd_hhmm_/);
});

test('T2 rebutja dates i hores que no existixen', () => {
  assert.deepEqual(lleis('260231_1000_acta_x.md'), ['T2']);
  assert.deepEqual(lleis('260924_2460_acta_x.md'), ['T2']);
});

test('T3 i T4: categoria del catàleg i títol obligatori', () => {
  assert.deepEqual(lleis('260924_1000_incidencia_protocol.md'), ['T3']);
  assert.deepEqual(lleis('260924_1000_auditoria.md'), ['T4']);
});

test('T5: la data no passa de demà', () => {
  assert.deepEqual(lleis('260925_0900_acta_x.md'), []);
  assert.deepEqual(lleis('261001_0900_acta_x.md'), ['T5']);
});

test('T6: un fitxer nou amb data de fa anys delata un DDMMAA', () => {
  assert.deepEqual(lleis('240926_1000_acta_x.md', { nou: true }), ['T6']);
  assert.deepEqual(lleis('240926_1000_acta_x.md', { nou: false }), []);
});

test('l’abast és per superfície i primer nivell, no per patró', () => {
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/x.md', CONFIG), true);
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/02_investigacio_ia/x.md', CONFIG), false);
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/00_index_escriptori.md', CONFIG), false);
  assert.equal(dinsAbast('_wiki_de_poble/04_escriptori/.ancora_sessio.json', CONFIG), false);
  assert.equal(dinsAbast('src/x.js', CONFIG), false);
});

test('comprovaRutes només torna els que fallen i compta els revisats', () => {
  const r = comprovaRutes([
    '_wiki_de_poble/04_escriptori/260924_1410_auditoria_claude.md',
    '_wiki_de_poble/10_actes/260924_1445_ACTA_MARMOTA_x.md',
    'src/app/App.jsx'
  ], CONFIG, { ara: ARA, nou: true });
  assert.equal(r.valid, false);
  assert.equal(r.revisats, 2);
  assert.deepEqual(r.resultats.map((x) => x.ruta), ['_wiki_de_poble/10_actes/260924_1445_ACTA_MARMOTA_x.md']);
});

test('paritat: la pàgina de la Wiki i el JSON han de dir el mateix', () => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'taxonomia-'));
  const taula = (cats) => ['<!-- SDP:TAXONOMIA:CATEGORIES -->', '| Categoria | Ruta |', '|---|---|',
    ...cats.map((c) => `| \`${c}\` | x |`), '<!-- /SDP:TAXONOMIA:CATEGORIES -->'].join('\n');
  fs.writeFileSync(path.join(arrel, 'pagina.md'), taula(Object.keys(CONFIG.categories)));
  assert.equal(paritat(arrel, CONFIG).valid, true);
  fs.writeFileSync(path.join(arrel, 'pagina.md'), taula(['acta', 'auditoria', 'incidencia']));
  const r = paritat(arrel, CONFIG);
  assert.equal(r.valid, false);
  assert.equal(r.errors.length, 4);
  assert.equal(categoriesDeLaPagina('sense marques'), null);
});
