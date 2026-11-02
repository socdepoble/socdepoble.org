/**
 * P2-15 · capítols d'ESTAT i mesura de l'arrencada (B10-GOVERN §2.3, marató 261101_2143).
 * ESTAT sintètic a os.tmpdir() que reproduïx l'anomalia real: entrades fora del bloc,
 * seccions llegades, `## Vincles` al mig i una entrada ESTAT_ACTUAL després de Vincles.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  segmentsEstat, planCapitolEstat, verificaCapitolEstat, escriuCapitolEstat, mesuraArrencada,
  segellDeAra, araMadrid, esAraValida, dataDeCapcalera, main, MARCADOR_OBRI, MARCADOR_TANCA, SECCIO_CAPITOLS, BYTES_PER_TOKEN
} from '../tooling/documental/capitol-estat.mjs';
import { estatActual } from '../tooling/brain/despertar.mjs';
import { dataEstat } from '../tooling/brain/fonts-vigilancia.mjs';
import { operationalDocumentText } from '../tooling/lib/document-corpus.mjs';
import { liveMarkdown } from '../tooling/wiki/core/parse.mjs';
import { parseFrontmatter } from '../tooling/wiki/lib/frontmatter.mjs';

const ARA = '2026-11-02T00:50:00+01:00';
const sha = (t) => createHash('sha256').update(t).digest('hex');

const entrada = (data, titol, cos) => `## ESTAT_ACTUAL · ${data} · Agent · ${titol}\n\n${cos}\n\n`;
const DINS = [
  entrada('2026-11-01T21:16:00+01:00', 'Conservada 1', '- **Torn:** `torn_aaa111-c1` · [[acta_c1]]'),
  entrada('2026-10-31 08:00', 'Conservada 2', '- Relleu de `torn_compartit-1`.'),
  entrada('2026-10-30', 'Conservada 3', '- Res de nou.'),
  entrada('2026-10-29T10:00:00+01:00', 'Moguda dins 1', '- `torn_compartit-1` i `torn_bbb222-m1`.'),
  entrada('2026-10-28', 'Moguda dins 2', '- `torn_bbb222-m2` · [[acta_m2]]'),
  entrada('2026-10-27', 'Moguda dins 3', '- Sense torn.')
];
const FORA = [
  entrada('2026-09-30', 'Moguda fora 1', '- `torn_ccc333-f1`\n\n```sh\n## ESTAT_ACTUAL · 2099-01-01 · fals dins de tanca\n## Vincles\n```'),
  entrada('2026-09-29', 'Moguda fora 2', '- `torn_ccc333-f2`')
];
const LLEGADA_1 = '## 260922_2335 · IAIA MarIA · Integració llegada\n\n- Text llegat amb [[enllac_llegat]].\n\n';
const LLEGADA_2 = '## Estat anterior conservat\n\n- Res.\n\n';
const VINCLES = '## Vincles\n\n- [[03_llibre_mestre_tasques_i_idees]]\n- [[01_genesi]]\n\n';
const LLEGADA_3 = '## 260921 05:55 — Claude — Reunió llegada posterior\n\n- Llegat després de Vincles.\n\n';
const POSTERIOR = '## ESTAT_ACTUAL · 2026-09-20 · Codex · Posterior a Vincles\n\n- `torn_posterior-vincles-1`\n';
const PREAMBUL = '---\ntype: document\nstatus: esborrany\ndescription: ESTAT DE LA SESSIÓ\n---\n';
const H1 = '# ESTAT DE LA SESSIÓ\n\n';

function estatSintetic({ dins = DINS, fora = FORA } = {}) {
  return [PREAMBUL, H1, `${MARCADOR_OBRI}\n\n`, ...dins, `${MARCADOR_TANCA}\n\n`, ...fora,
    LLEGADA_1, LLEGADA_2, VINCLES, LLEGADA_3, POSTERIOR].join('');
}

/** Validador equivalent a validaVincles (tractor-frontmatter.mjs): H2 «Vincles» reals fora de tanques i comentaris. */
function seccionsVincles(text) {
  const p = parseFrontmatter(text);
  assert.ok(!p.malformed && !p.errors.length, 'frontmatter llegible');
  let n = 0;
  for (const line of liveMarkdown(p.body).split('\n')) {
    const h = /^ {0,3}(#{1,6})[\t ]+(.+?)(?:[\t ]+#+)?[\t ]*$/.exec(line);
    if (h && h[1].length === 2 && h[2] === 'Vincles') n += 1;
  }
  return n;
}

function fixture(t, text = estatSintetic(), { cervell = null } = {}) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-capitol-estat-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const escriu = (rel, contingut) => {
    const abs = path.join(arrel, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contingut);
    return abs;
  };
  const estat = escriu('.agents/ESTAT.md', text);
  if (cervell) escriu('.agents/cervell.json', JSON.stringify(cervell));
  return { arrel, estat, escriu };
}

function sortida() {
  const s = { out: [], err: [] };
  s.log = (m) => s.out.push(String(m));
  s.error = (m) => s.err.push(String(m));
  return s;
}

/** Inventari (camí → sha256) de tot l'arbre de la fixture. */
function inventari(arrel) {
  const r = {};
  const recorre = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) recorre(abs);
      else r[path.relative(arrel, abs)] = sha(fs.readFileSync(abs));
    }
  };
  recorre(arrel);
  return r;
}

const multiconjunt = (textos) => [...textos].sort();

test('segmentsEstat: concatenació exacta; marcadors i Vincles són trams propis; tanques i frontmatter no tallen', () => {
  const text = estatSintetic();
  const trams = segmentsEstat(text);
  assert.equal(trams.map((s) => s.text).join(''), text);
  assert.equal(trams.map((s) => text.slice(s.inici, s.fi)).join(''), text);
  assert.equal(trams[0].tipus, 'preambul');
  assert.equal(trams[0].text, PREAMBUL);
  const perTipus = trams.reduce((a, s) => ({ ...a, [s.tipus]: (a[s.tipus] || 0) + 1 }), {});
  assert.deepEqual(perTipus, { preambul: 1, altra: 4, marcador: 2, entrada: 9, vincles: 1 });
  assert.equal(trams.find((s) => s.tipus === 'vincles').text, VINCLES);
  const marcadors = trams.filter((s) => s.tipus === 'marcador').map((s) => s.capcalera);
  assert.deepEqual(marcadors, [MARCADOR_OBRI, MARCADOR_TANCA]);
  // La tanca amb «## ESTAT_ACTUAL» i «## Vincles» a dins queda dins de la seua entrada.
  assert.equal(trams.find((s) => s.capcalera.includes('Moguda fora 1')).text, FORA[0]);
  // L'entrada #6 del bloc acaba al marcador, no s'emporta el tancament.
  assert.equal(trams.find((s) => s.capcalera.includes('Moguda dins 3')).text, DINS[5]);
  assert.equal(trams.find((s) => s.capcalera.includes('Posterior a Vincles')).text, POSTERIOR);
});

test('un comentari HTML de diverses línies no es talla (no es parteix entre capítol i ESTAT)', () => {
  const comentari = '<!--\n## ESTAT_ACTUAL · 2099-01-02 · dins de comentari\n## Vincles\n-->\n\n';
  const text = estatSintetic({ fora: [FORA[0].replace('- `torn_ccc333-f1`', `- \`torn_ccc333-f1\`\n\n${comentari.trimEnd()}`), FORA[1]] });
  const trams = segmentsEstat(text);
  assert.equal(trams.filter((s) => s.tipus === 'entrada').length, 9);
  assert.equal(trams.filter((s) => s.tipus === 'vincles').length, 1);
  assert.ok(trams.find((s) => s.capcalera.includes('Moguda fora 1')).text.includes('dins de comentari\n## Vincles\n-->'));
  assert.equal(seccionsVincles(text), 1);
});

test('el pla és pur i determinista amb la mateixa hora; sense `ara` (o amb una de falsa) llança', (t) => {
  const { arrel } = fixture(t);
  const text = fs.readFileSync(path.join(arrel, '.agents/ESTAT.md'), 'utf8');
  const abans = inventari(arrel);
  const a = planCapitolEstat(text, { conserva: 3, ara: ARA });
  const b = planCapitolEstat(text, { conserva: 3, ara: ARA });
  assert.deepEqual(inventari(arrel), abans, 'el pla no escriu res');
  for (const k of ['sha256Pla', 'sha256Capitol', 'sha256EstatNou', 'desti', 'ordreEscriu']) assert.equal(a[k], b[k]);
  assert.throws(() => planCapitolEstat(text, { conserva: 3 }), /ara és obligatori/);
  assert.throws(() => planCapitolEstat(text, { conserva: 3, ara: '2026-11-02 00:50' }), /ara és obligatori/);
  assert.throws(() => planCapitolEstat(text, { conserva: 3, ara: '2026-11-02T00:50:00' }), /ara és obligatori/);
  assert.throws(() => planCapitolEstat(text, { conserva: 3, ara: '2026-02-30T00:50:00+01:00' }), /ara és obligatori/);
  assert.throws(() => planCapitolEstat(text, { conserva: 1, ara: ARA }), /conserva/);
  assert.equal(esAraValida('2026-11-01T23:50:00Z'), true);
  assert.notEqual(planCapitolEstat(text, { conserva: 3, ara: '2026-11-02T00:51:00+01:00' }).sha256Pla, a.sha256Pla);
});

test('invariants 1-3: tot el que no és entrada moguda es queda al seu lloc; capítol exacte; àncora després del tancament', () => {
  const text = estatSintetic();
  const pla = planCapitolEstat(text, { conserva: 3, ara: ARA });
  assert.equal(pla.buit, false);
  assert.equal(pla.conservades.length, 3);
  assert.equal(pla.mogudes.length, 6);
  assert.equal(pla.mogudesDinsDelBloc, 3);
  assert.equal(pla.desti, '_wiki_de_poble/90_arxiu_historic/estat/261102_0050_estat_capitol_fins_20261029.md');
  assert.deepEqual(pla.rang, ['2026-09-20', '2026-10-29']);
  // Capítol = frontmatter + bytes exactes de les mogudes, en l'ordre original (també la de després de Vincles).
  const cos = [DINS[3], DINS[4], DINS[5], FORA[0], FORA[1], POSTERIOR].join('');
  assert.ok(pla.capitol.endsWith(cos));
  assert.match(pla.capitol, /^---\ntype: registre\nstatus: arxivat\ndescription: ".+"\n---\n## ESTAT_ACTUAL/);
  assert.equal(parseFrontmatter(pla.capitol).data.type, 'registre');
  // ESTAT nou sense l'àncora = original sense les mogudes, byte a byte i en el mateix ordre.
  const esperat = [PREAMBUL, H1, `${MARCADOR_OBRI}\n\n`, DINS[0], DINS[1], DINS[2], `${MARCADOR_TANCA}\n\n`,
    LLEGADA_1, LLEGADA_2, VINCLES, LLEGADA_3].join('');
  assert.equal(pla.estatNou.replace(pla.ancora, ''), esperat);
  // Les N primeres entrades continuen dins dels marcadors.
  const obri = pla.estatNou.indexOf(MARCADOR_OBRI);
  const tanca = pla.estatNou.indexOf(MARCADOR_TANCA);
  for (const e of DINS.slice(0, 3)) {
    const i = pla.estatNou.indexOf(e);
    assert.ok(i > obri && i < tanca, 'conservada dins del bloc');
  }
  // Multiconjunt: capítol + ESTAT nou sense àncora = trams originals.
  const originals = segmentsEstat(text).map((s) => s.text);
  const despres = [...segmentsEstat(esperat).map((s) => s.text), ...segmentsEstat(pla.capitol).filter((s) => s.tipus === 'entrada').map((s) => s.text)];
  assert.deepEqual(multiconjunt(despres), multiconjunt(originals));
  // Àncora: just després de la línia del marcador de tancament, camí entre `…`, sha, recompte, rang i torns.
  assert.ok(pla.estatNou.includes(`${MARCADOR_TANCA}\n\n${SECCIO_CAPITOLS}\n\n- \``));
  assert.ok(pla.estatNou.indexOf(SECCIO_CAPITOLS) < pla.estatNou.indexOf(LLEGADA_1));
  const linia = pla.ancora.trim().split('\n').at(-1);
  assert.equal(linia, `- \`${pla.desti}\` · sha256 ${sha(pla.capitol)} · 6 entrades · 2026-09-20..2026-10-29 · torns: torn_bbb222-m1 torn_bbb222-m2 torn_ccc333-f1 torn_ccc333-f2 torn_compartit-1 torn_posterior-vincles-1`);
  assert.ok(!/\[\[|\]\(/.test(linia), 'l’àncora no és cap enllaç resoluble');
});

test('invariant 4: una sola Vincles idèntica, els dos marcadors, i els lectors d’ESTAT donen el mateix', () => {
  const text = estatSintetic();
  const { estatNou } = planCapitolEstat(text, { conserva: 3, ara: ARA });
  assert.equal(seccionsVincles(text), 1);
  assert.equal(seccionsVincles(estatNou), 1);
  assert.equal((estatNou.match(/^## Vincles$/gm) || []).length, 1);
  assert.ok(estatNou.includes(VINCLES));
  assert.equal(estatNou.split(MARCADOR_OBRI).length - 1, 1);
  assert.equal(estatNou.split(MARCADOR_TANCA).length - 1, 1);
  assert.deepEqual(estatActual(estatNou), estatActual(text));
  assert.equal(dataEstat(estatNou), dataEstat(text));
  assert.equal(operationalDocumentText(estatNou, '.agents/ESTAT.md'), operationalDocumentText(text, '.agents/ESTAT.md'));
  // Una H2 sagnada fins a 3 espais també és capçalera per a validaVincles: talla i es queda al seu lloc.
  const sagnada = text.replace(VINCLES, `   ${VINCLES}`);
  const ambSagnat = planCapitolEstat(sagnada, { conserva: 3, ara: ARA }).estatNou;
  assert.equal(seccionsVincles(sagnada), 1);
  assert.equal(seccionsVincles(ambSagnat), 1);
  assert.ok(ambSagnat.includes(`   ${VINCLES}`));
});

test('segona rotació: una sola secció de capítols amb dues línies, i les dues verifiquen', () => {
  const pla1 = planCapitolEstat(estatSintetic(), { conserva: 3, ara: ARA });
  // ESTAT creix pel principi entre rotacions.
  const noves = entrada('2026-11-03', 'Nova A', '- `torn_nou-a`') + entrada('2026-11-02', 'Nova B', '- `torn_nou-b`');
  const crescut = pla1.estatNou.replace(`${MARCADOR_OBRI}\n\n`, `${MARCADOR_OBRI}\n\n${noves}`);
  const pla2 = planCapitolEstat(crescut, { conserva: 3, ara: '2026-11-04T09:30:00+01:00' });
  assert.equal(pla2.mogudes.length, 2);
  assert.equal(pla2.desti, '_wiki_de_poble/90_arxiu_historic/estat/261104_0930_estat_capitol_fins_20261031.md');
  assert.equal((pla2.estatNou.match(/^## Capítols arxivats d'ESTAT$/gm) || []).length, 1);
  const seccio = segmentsEstat(pla2.estatNou).find((s) => s.tipus === 'capitols').text;
  // La línia nova va al final de la llista (§2.3.3), després de la de la primera rotació (N09-ARB-04).
  assert.deepEqual(seccio.split('\n').filter((l) => l.startsWith('- `')).map((l) => l.split('`')[1]), [pla1.desti, pla2.desti]);
  assert.equal(verificaCapitolEstat(pla2.estatNou, pla1.capitol, pla1.desti), true);
  assert.equal(verificaCapitolEstat(pla2.estatNou, pla2.capitol, pla2.desti), true);
  assert.equal(seccionsVincles(pla2.estatNou), 1);
  assert.equal(pla2.estatNou.replace(pla2.ancora, ''), crescut.replace(pla2.mogudes.map((s) => s.text).join(''), ''));
  // El mateix destí (mateixa hora i mateixa primera data moguda) no s'afig dues vegades a l'àncora.
  const repetit = pla2.estatNou.replace(DINS[0], DINS[0] + entrada('2026-10-31', 'Repetida X', '- x') + entrada('2026-10-30', 'Repetida Y', '- y'));
  assert.throws(() => planCapitolEstat(repetit, { conserva: 3, ara: '2026-11-04T09:30:00+01:00' }), /ja és a l'àncora/);
});

test('verificaCapitolEstat: true amb el capítol bo; false si el capítol, el destí o el recompte no casen', () => {
  const pla = planCapitolEstat(estatSintetic(), { conserva: 3, ara: ARA });
  assert.equal(verificaCapitolEstat(pla.estatNou, pla.capitol, pla.desti), true);
  assert.equal(verificaCapitolEstat(pla.estatNou, pla.capitol.replace('Moguda dins 2', 'Moguda dins X'), pla.desti), false);
  assert.equal(verificaCapitolEstat(pla.estatNou, pla.capitol, pla.desti.replace('0050', '0051')), false);
  assert.equal(verificaCapitolEstat(pla.estatNou.replace('· 6 entrades ·', '· 5 entrades ·'), pla.capitol, pla.desti), false);
  assert.equal(verificaCapitolEstat(estatSintetic(), pla.capitol, pla.desti), false);
  // Un capítol fet a mà que s'endú una secció que no és entrada (p. ex. Vincles) no verifica, encara que el sha case.
  const ambVincles = `${pla.capitol}${VINCLES}`;
  const ancoraFalsa = pla.estatNou.replace(`sha256 ${pla.sha256Capitol}`, `sha256 ${sha(ambVincles)}`);
  assert.equal(verificaCapitolEstat(ancoraFalsa, ambVincles, pla.desti), false);
});

test('rebuigs fail-closed: marcadors, Vincles, dates; amb conserva+1 entrades o menys no hi ha res a moure', () => {
  const text = estatSintetic();
  const pla = (t) => planCapitolEstat(t, { conserva: 3, ara: ARA });
  assert.throws(() => pla(text.replace(`${MARCADOR_OBRI}\n`, '')), /Cal exactament un <!-- SDP:ESTAT_ACTUAL -->/);
  assert.throws(() => pla(text.replace(`${MARCADOR_TANCA}\n`, '')), /Cal exactament un <!-- \/SDP:ESTAT_ACTUAL -->/);
  assert.throws(() => pla(text.replace(LLEGADA_2, `${MARCADOR_OBRI}\n\n${LLEGADA_2}`)), /Cal exactament un/);
  const invertit = text.replace(`${MARCADOR_OBRI}\n`, 'XOBRI\n').replace(`${MARCADOR_TANCA}\n`, `${MARCADOR_OBRI}\n`).replace('XOBRI\n', `${MARCADOR_TANCA}\n`);
  assert.throws(() => pla(invertit), /tancament va abans/);
  assert.throws(() => pla(text.replace(VINCLES, '')), /exactament una secció ## Vincles \(n'hi ha 0\)/);
  assert.throws(() => pla(text.replace(LLEGADA_3, `${LLEGADA_3}${VINCLES}`)), /exactament una secció ## Vincles \(n'hi ha 2\)/);
  // Dues seccions de capítols: l'àncora seria ambigua (N09-ARB-04); es rebutja per estructura, no per accident.
  const dosCapitols = text.replace(LLEGADA_2, `${SECCIO_CAPITOLS}\n\n- \`a.md\`\n\n${SECCIO_CAPITOLS}\n\n- \`b.md\`\n\n${LLEGADA_2}`);
  assert.throws(() => pla(dosCapitols), /Hi ha 2 seccions «## Capítols arxivats d'ESTAT»/);
  const senseDates = text.replace(/ESTAT_ACTUAL · 20\d\d-\d\d-\d\d(?!T)/g, 'ESTAT_ACTUAL · sense-data').replace(/ESTAT_ACTUAL · 2026-10-29T10:00:00\+01:00/, 'ESTAT_ACTUAL · sense-data');
  assert.throws(() => pla(senseDates), /Cap data aaaa-mm-dd/);
  // 9 entrades: conserva 8 (= 9 - 1) → res a moure; conserva 7 → en mou 2.
  assert.deepEqual(planCapitolEstat(text, { conserva: 8, ara: ARA }), { ara: ARA, conserva: 8, buit: true, entrades: 9, motiu: 'res a moure' });
  assert.equal(planCapitolEstat(text, { conserva: 7, ara: ARA }).mogudes.length, 2);
});

test('hora del destí: Europe/Madrid fixa, independent del TZ del procés', () => {
  const tz = process.env.TZ;
  try {
    for (const zona of ['America/New_York', 'Asia/Tokyo', 'UTC']) {
      process.env.TZ = zona;
      assert.equal(segellDeAra('2026-11-02T00:50:00+01:00'), '261102_0050');
      assert.equal(segellDeAra('2026-11-01T23:50:00Z'), '261102_0050');
      assert.equal(araMadrid(new Date('2026-11-02T00:50:37.123Z')), '2026-11-02T01:50:00+01:00');
      assert.equal(araMadrid(new Date('2026-07-15T10:05:59Z')), '2026-07-15T12:05:00+02:00');
    }
  } finally {
    if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz;
  }
});

test('CLI en dos instants: --pla emet ara i ordre; --escriu en un altre minut escriu sense consultar el rellotge', (t) => {
  const { arrel, estat } = fixture(t);
  const font = fs.readFileSync(estat, 'utf8');
  const s1 = sortida();
  assert.equal(main(['--pla', '--conserva=3'], { arrel, sortida: s1, rellotge: () => new Date('2026-11-02T00:50:37Z') }), 0);
  const pla = JSON.parse(s1.out.join('\n'));
  assert.equal(pla.ara, '2026-11-02T01:50:00+01:00');
  assert.equal(pla.desti, '_wiki_de_poble/90_arxiu_historic/estat/261102_0150_estat_capitol_fins_20261029.md');
  assert.equal(pla.ordreEscriu, `node tooling/documental/capitol-estat.mjs --escriu --ara=${pla.ara} --autoritza=${pla.sha256Pla} --conserva=3`);
  assert.equal(pla.sha256Font, sha(font));
  const abans = inventari(arrel);

  const sense = sortida();
  assert.equal(main(['--escriu', `--autoritza=${pla.sha256Pla}`, '--conserva=3'], { arrel, sortida: sense }), 2);
  assert.equal(main(['--escriu', `--ara=${pla.ara}`, '--conserva=3'], { arrel, sortida: sense }), 2);
  assert.deepEqual(inventari(arrel), abans, 'sense --ara o --autoritza no escriu res');

  const altra = sortida();
  assert.equal(main(['--escriu', '--ara=2026-11-02T01:51:00+01:00', `--autoritza=${pla.sha256Pla}`, '--conserva=3'], { arrel, sortida: altra }), 1);
  assert.match(altra.err.join('\n'), /autorització no casa/);
  const dolenta = sortida();
  assert.equal(main(['--escriu', `--ara=${pla.ara}`, `--autoritza=${'0'.repeat(64)}`, '--conserva=3'], { arrel, sortida: dolenta }), 1);
  assert.deepEqual(inventari(arrel), abans, 'sense l’autorització correcta no escriu res');

  fs.chmodSync(estat, 0o640);
  const s2 = sortida();
  const rellotgeProhibit = () => { throw new Error('--escriu ha consultat el rellotge'); };
  assert.equal(main(pla.ordreEscriu.split(' ').slice(2), { arrel, sortida: s2, rellotge: rellotgeProhibit }), 0, s2.err.join('\n'));
  const capitol = fs.readFileSync(path.join(arrel, pla.desti), 'utf8');
  const estatNou = fs.readFileSync(estat, 'utf8');
  assert.equal(sha(capitol), pla.sha256Capitol);
  assert.equal(sha(estatNou), pla.sha256EstatNou);
  assert.equal(fs.statSync(estat).mode & 0o777, 0o640, 'el rename conserva els permisos d’ESTAT');
  assert.equal(verificaCapitolEstat(estatNou, capitol, pla.desti), true);
  assert.deepEqual(Object.keys(inventari(arrel)).sort(), ['.agents/ESTAT.md', pla.desti].sort(), 'cap altre fitxer (ni temporals)');
});

test('--escriu: ESTAT canviat després del pla, destí existent o rename fallit no deixen capítol ni ESTAT tocat', (t) => {
  const { arrel, estat, escriu } = fixture(t);
  const font = fs.readFileSync(estat, 'utf8');
  const pla = planCapitolEstat(font, { conserva: 3, ara: ARA });
  const args = ['--escriu', `--ara=${ARA}`, `--autoritza=${pla.sha256Pla}`, '--conserva=3'];

  // (a) Canvi entre --pla i --escriu: el pla recalculat ja no casa.
  const canviat = font.replace('- Res de nou.', '- Res de nou, editat per una altra IA.');
  fs.writeFileSync(estat, canviat);
  const sa = sortida();
  assert.equal(main(args, { arrel, sortida: sa }), 1);
  assert.equal(fs.readFileSync(estat, 'utf8'), canviat);
  assert.equal(fs.existsSync(path.join(arrel, pla.desti)), false);
  fs.writeFileSync(estat, font);

  // (b) Canvi entre la creació del capítol i el rename (CAS): avorta i retira el capítol.
  assert.throws(() => escriuCapitolEstat(arrel, { ara: ARA, conserva: 3, autoritza: pla.sha256Pla }, {
    despresDelCapitol: () => fs.writeFileSync(estat, canviat)
  }), (e) => e.codi === 'CAS');
  assert.equal(fs.readFileSync(estat, 'utf8'), canviat);
  assert.equal(fs.existsSync(path.join(arrel, pla.desti)), false);
  assert.deepEqual(fs.readdirSync(path.join(arrel, '.agents')), ['ESTAT.md']);
  assert.equal(fs.existsSync(path.join(arrel, '_wiki_de_poble')), false, 'retira els directoris buits que ha creat');
  fs.writeFileSync(estat, font);

  // (c) rename fallit: ni capítol ni temporal, ESTAT intacte.
  assert.throws(() => escriuCapitolEstat(arrel, { ara: ARA, conserva: 3, autoritza: pla.sha256Pla }, {
    rename: () => { throw Object.assign(new Error('EXDEV simulat'), { code: 'EXDEV' }); }
  }), /EXDEV simulat/);
  assert.equal(fs.readFileSync(estat, 'utf8'), font);
  assert.equal(fs.existsSync(path.join(arrel, pla.desti)), false);
  assert.deepEqual(fs.readdirSync(path.join(arrel, '.agents')), ['ESTAT.md']);

  // (d) Destí existent: EEXIST, ESTAT intacte i el fitxer d'altri tal com estava.
  escriu(pla.desti, 'capítol d’altri');
  const sd = sortida();
  assert.equal(main(args, { arrel, sortida: sd }), 1);
  assert.match(sd.err.join('\n'), /ja existix/);
  assert.equal(fs.readFileSync(estat, 'utf8'), font);
  assert.equal(fs.readFileSync(path.join(arrel, pla.desti), 'utf8'), 'capítol d’altri');
});

test('--pla i --escriu amb res a moure: exit 0, missatge i cap escriptura', (t) => {
  const { arrel } = fixture(t);
  const abans = inventari(arrel);
  const s = sortida();
  assert.equal(main(['--pla', '--conserva=8'], { arrel, sortida: s, rellotge: () => new Date('2026-11-02T00:50:00Z') }), 0);
  assert.equal(JSON.parse(s.out.join('\n')).motiu, 'res a moure');
  const e = sortida();
  assert.equal(main(['--escriu', `--ara=${ARA}`, `--autoritza=${'a'.repeat(64)}`, '--conserva=8'], { arrel, sortida: e }), 0);
  assert.match(e.out.join('\n'), /res a moure/);
  assert.deepEqual(inventari(arrel), abans);
});

test('--mesura: bytes i tokens estimats de cada font de cervell.json; absent → exit 1; camí fora de l’arrel → error', (t) => {
  const { arrel, escriu } = fixture(t, estatSintetic(), { cervell: { version: 1, entrada: ['AGENTS.md', '.agents/ESTAT.md'] } });
  escriu('AGENTS.md', 'x'.repeat(700));
  const m = mesuraArrencada(arrel);
  const bytesEstat = Buffer.byteLength(estatSintetic());
  assert.deepEqual(m.fonts.map((f) => [f.ruta, f.bytes, f.tokensEstimats]), [
    ['AGENTS.md', 700, 200], ['.agents/ESTAT.md', bytesEstat, Math.round(bytesEstat / BYTES_PER_TOKEN)]]);
  assert.equal(m.total, 700 + bytesEstat);
  assert.equal(m.tokensEstimats, Math.round((700 + bytesEstat) / 3.5));
  assert.equal(m.fonts[0].percent, Math.round((700 / m.total) * 1000) / 10);
  const s = sortida();
  assert.equal(main(['--mesura', '--json'], { arrel, sortida: s }), 0);
  assert.equal(JSON.parse(s.out.join('\n')).total, m.total);
  const text = sortida();
  assert.equal(main(['--mesura'], { arrel, sortida: text }), 0);
  assert.match(text.out.join('\n'), new RegExp(`^Arrencada \\(\\.agents/cervell\\.json · entrada\\): ${m.total} B · ~${m.tokensEstimats} tokens`));
  // El pla projecta l'arrencada després de la rotació.
  const p = sortida();
  assert.equal(main(['--pla', '--conserva=3'], { arrel, sortida: p, rellotge: () => new Date('2026-11-02T00:50:00Z') }), 0);
  const pla = JSON.parse(p.out.join('\n'));
  assert.equal(pla.arrencada.abans, m.total);
  assert.equal(pla.arrencada.despres, 700 + pla.bytes.estatNou);

  escriu('.agents/cervell.json', JSON.stringify({ entrada: ['AGENTS.md', 'absent.md'] }));
  const a = sortida();
  assert.equal(main(['--mesura'], { arrel, sortida: a }), 1);
  assert.match(a.out.join('\n'), /absent\.md: ABSENT/);
  escriu('.agents/cervell.json', JSON.stringify({ entrada: ['../fora.md'] }));
  const f = sortida();
  assert.equal(main(['--mesura'], { arrel, sortida: f }), 1);
  assert.match(f.err.join('\n'), /fora de l'arrel/);
  // Un camí de dins que és un symlink cap a fora també es rebutja (després de resoldre'l).
  const exterior = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-capitol-mesura-fora-'));
  t.after(() => fs.rmSync(exterior, { recursive: true, force: true }));
  fs.writeFileSync(path.join(exterior, 'secret.md'), 'fora');
  fs.symlinkSync(path.join(exterior, 'secret.md'), path.join(arrel, 'enllac.md'));
  escriu('.agents/cervell.json', JSON.stringify({ entrada: ['enllac.md'] }));
  const l = sortida();
  assert.equal(main(['--mesura'], { arrel, sortida: l }), 1);
  assert.match(l.err.join('\n'), /fora de l'arrel \(symlink\): enllac\.md/);
});

test('arguments: modes exclusius, cap bandera desconeguda, --json només amb --mesura, conserva >= 2', (t) => {
  const { arrel } = fixture(t);
  const abans = inventari(arrel);
  for (const argv of [[], ['--mesura', '--pla'], ['--pla', '--json'], ['--pla', '--conserva=1'], ['--pla', '--conserva=x'],
    ['--escriu', `--ara=${ARA}`, '--autoritza=abc'], ['--pla', `--ara=${ARA}`], ['--mesura', '--mesura'], ['--esborra'],
    // N09-ARB-04: una bandera de valor repetida és ambigua (quina val?), no «guanya l'última».
    ['--pla', '--conserva=3', '--conserva=20'],
    ['--escriu', `--ara=${ARA}`, `--ara=${ARA}`, `--autoritza=${'a'.repeat(64)}`]]) {
    const s = sortida();
    assert.equal(main(argv, { arrel, sortida: s }), 2, argv.join(' '));
    assert.match(s.err.join('\n'), /^Ús:/);
  }
  assert.deepEqual(inventari(arrel), abans);
});

test('C-B10-01 (kit Codex, N09-ARB-02): un ancestre symlink cap a fora es rebutja abans de crear cap directori', (t) => {
  const { arrel, estat } = fixture(t);
  const exterior = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-capitol-fora-'));
  t.after(() => fs.rmSync(exterior, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, '_wiki_de_poble'));
  fs.symlinkSync(exterior, path.join(arrel, '_wiki_de_poble/90_arxiu_historic'), 'dir');
  const original = fs.readFileSync(estat, 'utf8');
  const pla = planCapitolEstat(original, { conserva: 3, ara: ARA });
  assert.throws(() => escriuCapitolEstat(arrel, { conserva: 3, ara: ARA, autoritza: pla.sha256Pla }), /fora de l'arrel \(symlink\)/);
  assert.deepEqual(fs.readdirSync(exterior), [], 'el rebuig no pot haver creat estat/ fora');
  // La mateixa via des de la CLI: exit 1 i res fora.
  const s = sortida();
  assert.equal(main(['--escriu', `--ara=${ARA}`, `--autoritza=${pla.sha256Pla}`, '--conserva=3'], { arrel, sortida: s }), 1);
  assert.deepEqual(fs.readdirSync(exterior), []);
  assert.equal(fs.readFileSync(estat, 'utf8'), original);
  assert.deepEqual(fs.readdirSync(path.join(arrel, '.agents')), ['ESTAT.md'], 'cap temporal');
});

test('dates compactes aammdd[_hhmm] (N09-ARB-03): compten per al rang i per al destí; una data impossible no', () => {
  // L'ESTAT real té 42 mogudes amb capçalera `260923_2358 · …` o `260924 · …`, sense cap data ISO.
  const compacta = entrada('261030_0915', 'Moguda compacta nova', '- `torn_compacta-1`');
  const antiga = entrada('260915', 'Moguda compacta antiga sense hora', '- Res.');
  const impossible = entrada('261399_1200', 'Mes 13', '- Res.');
  const text = estatSintetic({
    dins: [...DINS.slice(0, 3), compacta, ...DINS.slice(3)],
    // Fora d'ordre a posta (l'ESTAT viu en té una inversió): el rang és el mínim i el màxim reals.
    fora: [FORA[0], antiga, impossible, FORA[1]]
  });
  const pla = planCapitolEstat(text, { conserva: 3, ara: ARA });
  assert.equal(pla.mogudes.length, 9);
  assert.equal(pla.finsA, '2026-10-30', 'la primera moguda és compacta: el destí no la pot ometre');
  assert.equal(pla.desti, '_wiki_de_poble/90_arxiu_historic/estat/261102_0050_estat_capitol_fins_20261030.md');
  assert.deepEqual(pla.rang, ['2026-09-15', '2026-10-30']);
  assert.match(pla.ancora, / · 9 entrades · 2026-09-15\.\.2026-10-30 · torns: /);
  assert.equal(verificaCapitolEstat(pla.estatNou, pla.capitol, pla.desti), true);
  assert.equal(dataDeCapcalera('## ESTAT_ACTUAL · 260923_2358 · Claude · x'), '2026-09-23');
  assert.equal(dataDeCapcalera('## ESTAT_ACTUAL · 260924 · Codex · x'), '2026-09-24');
  // Mana la data de darrere del separador; una ISO de més avall només és la reserva, com fins ara.
  assert.equal(dataDeCapcalera('## ESTAT_ACTUAL · 2026-10-03 · Codex · 261002_0244'), '2026-10-03');
  assert.equal(dataDeCapcalera('## ESTAT_ACTUAL · 260924_1900 · MarIA · retorn al 2026-09-20'), '2026-09-24');
  assert.equal(dataDeCapcalera('## ESTAT_ACTUAL · Codex · resum del 2026-09-20'), '2026-09-20');
  assert.equal(dataDeCapcalera('## ESTAT_ACTUAL · 261399 · resum del 2026-09-20'), '2026-09-20');
  for (const c of ['## ESTAT_ACTUAL · 261399_1200 · x', '## ESTAT_ACTUAL · 260431 · x', '## ESTAT_ACTUAL · 260923_12345 · x',
    '## ESTAT_ACTUAL · Codex · resum 260923_2358', '## ESTAT_ACTUAL · 2609231 · x']) {
    assert.equal(dataDeCapcalera(c), null, c);
  }
});
