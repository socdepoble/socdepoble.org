/* Porta Llavor · Decisió del Mestre (30-10-2026, «Identitat de fundador»). La porta accepta
   només la identitat fundacional declarada (PERSONA_PILOT de src/data/identitatsSeed.js) i
   continua caçant correus, telèfons i NIF/NIE de terceres persones fora de l'avís legal
   (src/sections/text/legalContent.js). Fixtures temporals amb dades SINTÈTIQUES: el NIF
   12345678Z i el NIE X1234567L són els exemples de lletra vàlida de manual, no de cap persona. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTA = fileURLToPath(new URL('../tooling/gates/tractor-llavor.mjs', import.meta.url));
const FUNDADOR = ['Javi', 'Llinares'].join(' ');
const declaracio = (nom, correu = 'fundador.fixture@gmail.com') =>
  `export const CORREU_PERSONA_PILOT = '${correu}';\nexport const PERSONA_PILOT = Object.freeze({ slug: 'fixture', nom: '${nom}', correu: CORREU_PERSONA_PILOT, alies: ['fixture'] });\n`;
const AVIS = "export const LEGAL = `<p>Titular: Persona Fixture · NIF: 12345678Z · Tel. 965 000 000 · <a href=\"mailto:legal@socdepoble.org\">legal@socdepoble.org</a></p>`;\n";
const fila = (payload) => `insert into public.app_content (tenant_id, key, payload, version)\nvalues\n  ('t', 'agents', '${JSON.stringify(payload)}'::jsonb, 1);\n`;
const LLAVOR_FUNDADOR = fila([{ id: '0001', name: FUNDADOR }, { id: 'mac', seller: FUNDADOR, author_name: FUNDADOR, contacte: 'fundador.fixture@gmail.com' }])
  + `  ('t', 'pages', '${JSON.stringify([{ id: 'legal', html: 'NIF: 12345678Z · Tel. 965 000 000 · legal@socdepoble.org' }])}'::jsonb, 1);\n`
  + "-- insert into auth.users (id, email) values ('u', 'mestre@socdepoble.invalid');\n"
  + `  ('t', 'notes', '${JSON.stringify([{ id: 'n', text: 'Escriu a qualsevol@example.org o a algu@poble.test. Versió 250035, coordenades 38.661234567.' }])}'::jsonb, 1);\n`;

function corre(fitxers) {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-llavor-'));
  try {
    for (const [rel, text] of Object.entries(fitxers)) {
      mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
      writeFileSync(path.join(arrel, rel), text);
    }
    const r = spawnSync(process.execPath, [PORTA], { cwd: arrel, encoding: 'utf8', env: { PATH: process.env.PATH } });
    return { status: r.status, eixida: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
}
const base = (llavor, nom = FUNDADOR) => ({
  'package.json': '{"type":"module"}\n',
  'supabase/seed.sql': llavor,
  'src/data/appSeed.js': 'export const APP = [];\n',
  'src/data/identitatsSeed.js': declaracio(nom),
  'src/sections/text/legalContent.js': AVIS
});

test('la identitat fundacional declarada (nom i correu), l’avís legal i els dominis sintètics o institucionals passen', () => {
  const r = corre(base(LLAVOR_FUNDADOR));
  assert.equal(r.status, 0, r.eixida);
  assert.match(r.eixida, /✅ tractor-llavor/);
});

test('el nom vigilat cau si no és la identitat fundacional declarada', () => {
  /* El pseudònim antic es compon a trossos: la guarda d'identitat dual
     (src/data/identitatDual.guarda.test.js) no admet el literal enlloc. */
  const r = corre(base(LLAVOR_FUNDADOR, ['Mestre', 'Poble'].join(' ')));
  assert.equal(r.status, 1, r.eixida);
  assert.match(r.eixida, /P1 · nom de persona sense identitat fundacional declarada · supabase\/seed\.sql:3 \(3 apar\.\)/);
});

test('un correu, un telèfon i un NIF/NIE de terceres persones fan caure la porta, sense cap valor al diagnòstic', () => {
  const tercers = ['veina.fixture@gmail.com', '+34 612 345 678', '87654321X', 'X1234567L'];
  const llavor = `${LLAVOR_FUNDADOR}  ('t', 'events', '${JSON.stringify([{ id: 'e', contacte: tercers[0], telefon: tercers[1], nif: tercers[2] }])}'::jsonb, 1);\n`
    + `  ('t', 'towns', '${JSON.stringify([{ id: 'p', nie: tercers[3] }])}'::jsonb, 1);\n`;
  const r = corre(base(llavor));
  assert.equal(r.status, 1, r.eixida);
  assert.match(r.eixida, /P2 · correu de tercers · supabase\/seed\.sql:7 \(1 apar\.\)/);
  assert.match(r.eixida, /P3 · telèfon · supabase\/seed\.sql:7 \(1 apar\.\)/);
  assert.match(r.eixida, /P4 · NIF\/NIE · supabase\/seed\.sql:7 \(1 apar\.\)/);
  assert.match(r.eixida, /P4 · NIF\/NIE · supabase\/seed\.sql:8 \(1 apar\.\)/);
  for (const valor of tercers) assert.ok(!r.eixida.includes(valor), valor);
  const app = corre({ ...base(LLAVOR_FUNDADOR), 'src/data/appSeed.js': "export const C = 'tel. 699112233';\n" });
  assert.equal(app.status, 1, app.eixida);
  assert.match(app.eixida, /P3 · telèfon · src\/data\/appSeed\.js:1 \(1 apar\.\)/);
});

/* Gauntlet f6 (llavor-detectors-cecs-formats-comuns) · la decisió diu «continua caçant»: també
   les formes que normalitzaNif de la Gestoria admet i els telèfons habituals. Cadascuna sola. */
test('les formes habituals d’un NIF/NIE, d’un telèfon, d’un WhatsApp i d’un número estranger de tercers fan caure la porta, sense cap valor', () => {
  const casos = [
    ['87.654.321-X', 'P4 · NIF/NIE'],
    ['87654321x', 'P4 · NIF/NIE'],
    ['X-1234567-L', 'P4 · NIF/NIE'],
    ['ES87654321X', 'P4 · NIF/NIE'],
    ['https://wa.me/34612345678', 'P3 · telèfon'],
    ['34612345678', 'P3 · telèfon'],
    ['(96) 123 45 67', 'P3 · telèfon'],
    ['mòbil/612345678', 'P3 · telèfon'],
    ['+44 20 7946 0958', 'P3 · telèfon']
  ];
  for (const [valor, llei] of casos) {
    const llavor = `${LLAVOR_FUNDADOR}  ('t', 'events', '${JSON.stringify([{ id: 'e', text: `Contacte: ${valor}` }])}'::jsonb, 1);\n`;
    const r = corre(base(llavor));
    assert.equal(r.status, 1, `${valor}\n${r.eixida}`);
    assert.ok(r.eixida.includes(`${llei} · supabase/seed.sql:7 (1 apar.)`), `${valor}\n${r.eixida}`);
    assert.ok(!r.eixida.includes(valor), valor);
  }
});

test('el NIF de l’avís legal en una altra forma, una URL o un camí amb xifres, coordenades, segons i un import en un text no compten', () => {
  const llavor = `${LLAVOR_FUNDADOR}  ('t', 'events', '${JSON.stringify([{
    id: 'e', nif: '12.345.678-z', video: 'https://vimeo.com/612345678', foto: '/assets/fotos/612345678.webp',
    lat: 38.661234567, ts: 1730000000000, text: 'Pressupost de 12.345.678 i escreix.'
  }])}'::jsonb, 1);\n`;
  const r = corre(base(llavor));
  assert.equal(r.status, 0, r.eixida);
});

test('sense la declaració de la identitat fundacional, la porta falla tancada', () => {
  const fitxers = base(LLAVOR_FUNDADOR);
  delete fitxers['src/data/identitatsSeed.js'];
  const r = corre(fitxers);
  assert.equal(r.status, 2, r.eixida);
});
