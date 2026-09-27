/** Invariants de text de la migració Xat F0 (260927_0200_xat_f0_fonament.sql).
 *  No hi ha cap base de dades local: es comprova el SQL com a text, amb el
 *  mateix escàner de sentències que fa servir tractor-rls.mjs (comentaris
 *  fora, cadenes i cossos $$ respectats), perquè cap comentari puga donar
 *  un verd o un roig fals. Les regles són les del pla §4.A. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACIO = 'supabase/migrations/2609270200_xat_f0_fonament.sql';
const README = 'supabase/README.md';
const sql = fs.readFileSync(path.join(REPO, MIGRACIO), 'utf8');
const readme = fs.readFileSync(path.join(REPO, README), 'utf8');

/** Talla el SQL en sentències pel `;` de nivell zero, sense comentaris.
 *  Còpia fidel de l'escàner de tooling/gates/tractor-rls.mjs (no s'exporta). */
function sentencies(text) {
  const fora = [];
  let buf = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '-' && d === '-') {
      while (i < n && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {
      let prof = 1;
      i += 2;
      while (i < n && prof > 0) {
        if (text[i] === '/' && text[i + 1] === '*') { prof++; i += 2; continue; }
        if (text[i] === '*' && text[i + 1] === '/') { prof--; i += 2; continue; }
        i++;
      }
      buf += ' ';
      continue;
    }
    if (c === "'") {
      buf += c; i++;
      while (i < n) {
        if (text[i] === "'" && text[i + 1] === "'") { buf += "''"; i += 2; continue; }
        buf += text[i];
        if (text[i] === "'") { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '"') {
      buf += c; i++;
      while (i < n) {
        buf += text[i];
        if (text[i] === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '$') {
      const m = /^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/.exec(text.slice(i));
      if (m) {
        const tanca = m[0];
        const fi = text.indexOf(tanca, i + tanca.length);
        const tall = fi === -1 ? n : fi + tanca.length;
        buf += text.slice(i, tall);
        i = tall;
        continue;
      }
    }
    if (c === ';') {
      if (buf.trim()) fora.push(buf);
      buf = '';
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) fora.push(buf);
  return fora;
}

const STS = sentencies(sql);
const CODI = STS.join(';\n').toLowerCase();
/** Sentències `create [or replace] function`, amb esquema, nom i capçalera
 *  (tot el que hi ha abans del cos `as $$`). */
const FUNCIONS = STS.flatMap((st) => {
  const m = /^\s*create\s+(?:or\s+replace\s+)?function\s+(public|private)\.([a-zA-Z0-9_]+)\s*\(/i.exec(st);
  if (!m) return [];
  const cosA = st.search(/\bas\s+\$/i);
  return [{esquema: m[1], nom: m[2], capcalera: (cosA === -1 ? st : st.slice(0, cosA)).toLowerCase(), st}];
});

// ── Transacció i capçalera ────────────────────────────────────────────────────
test('la migració és una sola transacció amb temps d’espera i reload de PostgREST', () => {
  assert.equal(STS[0].trim().toLowerCase(), 'begin');
  assert.match(STS[1], /^\s*set local lock_timeout = '5s'\s*$/i);
  assert.match(STS[2], /^\s*set local statement_timeout = '120s'\s*$/i);
  assert.match(STS.at(-2), /^\s*notify pgrst, 'reload schema'\s*$/i);
  assert.equal(STS.at(-1).trim().toLowerCase(), 'commit');
});

test('els cinc codis nous apareixen al SQL i a la capçalera documentada', () => {
  for (const codi of ['SDP-XAT-006', 'SDP-XAT-007', 'SDP-XAT-008', 'SDP-XAT-009', 'SDP-XAT-010']) {
    assert.ok(CODI.includes(codi.toLowerCase()), `${codi} absent del codi`);
    const capcalera = sql.slice(0, sql.indexOf('begin;'));
    assert.ok(capcalera.includes(codi), `${codi} absent de la capçalera`);
  }
});

test('cap raise porta el text d’un missatge: només codi i frase fixa', () => {
  const raises = [...sql.matchAll(/raise\s+(?:exception|notice)\s+'([^']*(?:''[^']*)*)'([^;]*);/gi)];
  assert.ok(raises.length > 0);
  for (const [, missatge, resta] of raises) {
    assert.match(missatge, /^SDP-XAT-\d{3}: /, `raise sense codi: ${missatge}`);
    assert.doesNotMatch(missatge, /%/, `raise amb interpolació: ${missatge}`);
    assert.doesNotMatch(resta, /\b(new|old|p_text|v_text)\b/i, `raise que arrossega dades: ${resta}`);
  }
});

// ── Esquema additiu i idempotent ──────────────────────────────────────────────
test('tota columna nova és `add column if not exists` i cap `drop column`', () => {
  const afegides = CODI.match(/add column/g) ?? [];
  const segures = CODI.match(/add column if not exists/g) ?? [];
  assert.ok(afegides.length >= 30, `només ${afegides.length} columnes afegides`);
  assert.equal(afegides.length, segures.length);
  assert.doesNotMatch(CODI, /drop column/);
  assert.doesNotMatch(CODI, /drop table/);
});

test('seq: relleno per conversa, not null, índex únic (fil_id, seq) i ultim_seq alineat', () => {
  assert.match(CODI, /row_number\(\) over \(partition by x\.fil_id order by x\.creat_al, x\.id\)/);
  assert.match(CODI, /alter table public\.xat_missatges alter column seq set not null/);
  assert.match(CODI, /create unique index if not exists xat_missatges_seq_uq\s+on public\.xat_missatges \(fil_id, seq\)/);
  assert.match(CODI, /update public\.xat_fils f\s+set ultim_seq = s\.maxim/);
  assert.match(CODI, /alter table public\.xat_missatges alter column text drop not null/);
});

test('les marques es rellenen des de xat_lectures i mai retrocedixen', () => {
  assert.match(CODI, /set llegit_fins_seq = greatest\(\s*p\.llegit_fins_seq,/);
  assert.match(CODI, /m\.creat_al <= l\.ultim_llegit_al/);
  assert.match(CODI, /from public\.xat_lectures l\s+where l\.fil_id = p\.fil_id\s+and l\.usuari_id = p\.usuari_id/);
});

test('les restriccions de llargària són not valid i es validen només si cap fila les trenca', () => {
  for (const [nom, taula, limit] of [
    ['xat_fils_titol_llargaria', 'xat_fils', 100],
    ['xat_missatges_text_llargaria', 'xat_missatges', 4096],
  ]) {
    assert.ok(CODI.includes(`add constraint ${nom} check (char_length(`), `${nom} sense check`);
    assert.match(CODI, new RegExp(`add constraint ${nom} check \\(char_length\\((titol|text)\\) <= ${limit}\\) not valid`));
    assert.match(CODI, new RegExp(`alter table public\\.${taula} validate constraint ${nom}`));
    assert.match(CODI, new RegExp(`conname = '${nom}'`), `${nom} sense guarda d’idempotència`);
  }
});

// ── Disparadors ──────────────────────────────────────────────────────────────
test('el disparador de seq és BEFORE INSERT, on_nou_missatge desapareix i el límit de freqüència es queda', () => {
  assert.match(CODI, /create trigger xat_missatges_seq before insert on public\.xat_missatges/);
  assert.match(CODI, /drop trigger if exists on_nou_missatge on public\.xat_missatges/);
  assert.doesNotMatch(CODI, /drop trigger if exists trg_rate_limit_xat/);
  const f = FUNCIONS.find((x) => x.nom === 'xat_assigna_seq');
  assert.ok(f, 'private.xat_assigna_seq absent');
  assert.equal(f.esquema, 'private');
  assert.match(f.st, /set ultim_seq = f\.ultim_seq \+ 1,\s+actualitzat_al = now\(\)/i);
  assert.match(f.st, /returning f\.ultim_seq, f\.temporal_segons into new\.seq, v_temporal/i);
  assert.match(f.st, /new\.creat_al := now\(\)/i);
});

test('l’avís de temps real usa realtime.send al canal privat i cap error el fa tombar', () => {
  const f = FUNCIONS.find((x) => x.nom === 'xat_avisa_nous');
  assert.ok(f, 'private.xat_avisa_nous absent');
  assert.match(f.st, /perform realtime\.send\(/i);
  assert.match(f.st, /'xat:f:' \|\| new\.fil_id::text/i);
  assert.match(f.st, /exception when others then\s+null;/i);
  assert.match(CODI, /create trigger xat_missatges_avisa after insert on public\.xat_missatges/);
  assert.doesNotMatch(CODI, /on realtime\.messages/, 'cap política sobre realtime.messages (R1)');
});

// ── Permisos ─────────────────────────────────────────────────────────────────
test('cap escriptura directa: revoke insert, cap grant insert i la política d’inserció fora', () => {
  assert.match(CODI, /revoke insert on table public\.xat_missatges from authenticated/);
  assert.doesNotMatch(CODI, /grant\s+insert[^;]*xat_missatges/);
  assert.doesNotMatch(CODI, /grant\s+(select|insert|update|delete)\b/, 'cap grant de taula: tot per RPC');
  assert.match(CODI, /drop policy if exists "xat_missatges_insercio" on public\.xat_missatges/);
  const crea = STS.filter((st) => /^\s*create policy "xat_missatges_insercio"/i.test(st));
  assert.equal(crea.length, 0, 'la política d’inserció no es torna a crear');
});

test('cap política amb using (true) ni with check (true)', () => {
  for (const st of STS) {
    if (!/^\s*create policy/i.test(st)) continue;
    assert.doesNotMatch(st, /\busing\s*\(\s*true\s*\)/i);
    assert.doesNotMatch(st, /\bwith\s+check\s*\(\s*true\s*\)/i);
  }
});

test('tota funció security definer porta set search_path = \'\' a la capçalera', () => {
  assert.ok(FUNCIONS.length >= 10, `només ${FUNCIONS.length} funcions`);
  for (const f of FUNCIONS) {
    assert.ok(f.capcalera.includes('security definer'), `${f.esquema}.${f.nom} no és security definer`);
    assert.ok(f.capcalera.includes("set search_path = ''"), `${f.esquema}.${f.nom} sense search_path buit a la capçalera`);
    assert.match(f.capcalera, /language (plpgsql|sql)\b/, `${f.esquema}.${f.nom} sense language plpgsql/sql`);
  }
});

test('cada funció té el seu revoke … from public, anon just després, i grant a authenticated si és RPC o funció de política', () => {
  for (const f of FUNCIONS) {
    const idx = STS.indexOf(f.st);
    const seguent = (STS[idx + 1] ?? '').toLowerCase().replace(/\s+/g, ' ');
    assert.match(
      seguent,
      new RegExp(`^ ?revoke execute on function ${f.esquema}\\.${f.nom}\\([^)]*\\) from public, anon`),
      `${f.esquema}.${f.nom}: la sentència següent no és el seu revoke (${seguent.slice(0, 80)})`,
    );
    const esDisparador = /returns trigger/.test(f.capcalera);
    if (esDisparador) {
      assert.match(seguent, /from public, anon, authenticated$/, `${f.nom}: un disparador no dona execute a authenticated`);
      continue;
    }
    const grant = (STS[idx + 2] ?? '').toLowerCase().replace(/\s+/g, ' ');
    assert.match(
      grant,
      new RegExp(`^ ?grant execute on function ${f.esquema}\\.${f.nom}\\([^)]*\\) to authenticated$`),
      `${f.esquema}.${f.nom}: falta el grant a authenticated`,
    );
  }
});

test('la signatura del revoke i del grant coincidix amb la de la funció', () => {
  for (const f of FUNCIONS) {
    const params = /\(([^)]*)\)/.exec(f.st.slice(f.st.search(/\(/)))[1]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.replace(/\s+default\s+.*$/i, '').split(/\s+/).slice(1).join(' ').toLowerCase())
      .join(', ');
    const idx = STS.indexOf(f.st);
    const revoke = STS[idx + 1].toLowerCase().replace(/\s+/g, ' ');
    const signatura = /\(([^)]*)\)/.exec(revoke)[1].trim();
    assert.equal(signatura, params, `${f.nom}: revoke(${signatura}) vs funció(${params})`);
  }
});

// ── Funcions de seguretat i polítiques ───────────────────────────────────────
test('es_participant exigix membre actiu; seq_visible i es_admin_del_fil existixen', () => {
  const ep = FUNCIONS.find((x) => x.nom === 'es_participant');
  assert.ok(ep && ep.esquema === 'private');
  assert.match(ep.st, /and p\.visible_fins_seq is null/i);
  const sv = FUNCIONS.find((x) => x.nom === 'seq_visible');
  assert.ok(sv && sv.esquema === 'private');
  assert.match(sv.st, /p_seq > greatest\(p\.visible_des_de_seq, p\.buidat_fins_seq\)/i);
  assert.match(sv.st, /p\.visible_fins_seq is null or p_seq <= p\.visible_fins_seq/i);
  const ad = FUNCIONS.find((x) => x.nom === 'es_admin_del_fil');
  assert.ok(ad && ad.esquema === 'private');
  assert.match(ad.st, /p\.rol in \('propietari', 'admin'\)/i);
});

test('la lectura de xat_missatges passa per seq_visible i exclou els caducats', () => {
  const st = STS.find((s) => /^\s*create policy "xat_missatges_lectura"/i.test(s));
  assert.ok(st, 'política de lectura absent');
  assert.match(st, /for select to authenticated/i);
  assert.match(st, /private\.seq_visible\(fil_id, seq\)/i);
  assert.match(st, /caduca_al is null or caduca_al > now\(\)/i);
});

test('les tres polítiques de xat_lectures exigixen es_participant', () => {
  for (const nom of ['xat_lectures_lectura', 'xat_lectures_insercio', 'xat_lectures_actualitzacio']) {
    const st = STS.find((s) => new RegExp(`^\\s*create policy "${nom}"`, 'i').test(s));
    assert.ok(st, `${nom} absent`);
    assert.match(st, /usuari_id = \(select auth\.uid\(\)\)/i);
    assert.match(st, /private\.es_participant\(fil_id\)/i);
    assert.match(CODI, new RegExp(`drop policy if exists "${nom}" on public\\.xat_lectures`));
  }
});

// ── RPC ──────────────────────────────────────────────────────────────────────
test('xat_envia: idempotent per id, membre actiu, límits i codis 006-010', () => {
  const f = FUNCIONS.find((x) => x.nom === 'xat_envia');
  assert.ok(f && f.esquema === 'public');
  assert.match(f.capcalera, /p_id\s+uuid,\s*p_fil_id\s+uuid,\s*p_tipus\s+text\s+default 'text',\s*p_text\s+text\s+default null,\s*p_resposta_a\s+uuid\s+default null,\s*p_metadades\s+jsonb\s+default '\{\}'::jsonb/);
  assert.match(f.capcalera, /returns table \(id uuid, seq bigint, creat_al timestamptz\)/);
  assert.match(f.st, /on conflict \(id\) do nothing/i);
  assert.match(f.st, /p\.visible_fins_seq is null[\s\S]*SDP-XAT-006/i);
  assert.match(f.st, /char_length\(v_text\) > 4096[\s\S]*SDP-XAT-007/i);
  assert.match(f.st, /v_autor is distinct from v_jo[\s\S]*SDP-XAT-008/i);
  assert.match(f.st, /SDP-XAT-009/);
  assert.match(f.st, /v_tipus <> 'text'[\s\S]*SDP-XAT-010/i);
  assert.match(f.st, /es_ia\)/i, 'es_ia va sempre explícit');
  assert.match(f.st, /, false\)\s+on conflict/i, 'es_ia = false des del client');
  assert.match(f.st, /#variable_conflict use_column/);
});

test('xat_historial: seq < cursor, 50 per defecte, 100 màxim, ascendent, codi 009', () => {
  const f = FUNCIONS.find((x) => x.nom === 'xat_historial');
  assert.ok(f && f.esquema === 'public');
  assert.match(f.capcalera, /p_abans_de_seq\s+bigint\s+default null/);
  assert.match(f.capcalera, /p_limit\s+integer\s+default 50/);
  assert.match(f.st, /v_limit < 1 or v_limit > 100[\s\S]*SDP-XAT-009/i);
  assert.match(f.st, /p_abans_de_seq is null or m\.seq < p_abans_de_seq/i);
  assert.match(f.st, /order by m\.seq desc\s+limit v_limit\s*\)\s*sub\s+order by sub\.seq asc/i);
  assert.match(f.st, /m\.caduca_al is null or m\.caduca_al > now\(\)/i);
  assert.doesNotMatch(f.st, /xat_amagats/, 'xat_amagats no existix en F0');
});

test('xat_nous: seq > cursor dins de la finestra visible, ascendent', () => {
  const f = FUNCIONS.find((x) => x.nom === 'xat_nous');
  assert.ok(f && f.esquema === 'public');
  assert.match(f.capcalera, /p_despres_de_seq\s+bigint/);
  assert.match(f.st, /m\.seq > greatest\(v_des_de, p_despres_de_seq\)/i);
  assert.match(f.st, /order by m\.seq asc/i);
});

test('xat_marca: greatest(), null = ultim_seq, i convivència amb xat_lectures', () => {
  const f = FUNCIONS.find((x) => x.nom === 'xat_marca');
  assert.ok(f && f.esquema === 'public');
  assert.match(f.capcalera, /returns table \(rebut_fins_seq bigint, llegit_fins_seq bigint\)/);
  assert.match(f.st, /coalesce\(p_llegit_fins, v_ultim\)/i);
  assert.match(f.st, /rebut_fins_seq\s+= greatest\(p\.rebut_fins_seq, v_rebut\)/i);
  assert.match(f.st, /llegit_fins_seq\s+= greatest\(p\.llegit_fins_seq, v_llegit\)/i);
  assert.match(f.st, /insert into public\.xat_lectures as l/i);
  assert.match(f.st, /greatest\(l\.ultim_llegit_al, excluded\.ultim_llegit_al\)/i);
});

test('xat_fils_meus v2: drop previ, columnes del contracte i mínim dels altres membres actius', () => {
  assert.match(CODI, /drop function if exists public\.xat_fils_meus\(uuid\)/);
  const f = FUNCIONS.find((x) => x.nom === 'xat_fils_meus');
  assert.ok(f && f.esquema === 'public');
  for (const col of ['id', 'tipus', 'titol', 'imatge_url', 'actualitzat_al', 'altres_noms', 'ultim_text', 'ultim_al',
    'ultim_autor_id', 'ultim_seq', 'llegit_fins_seq', 'rebut_fins_seq', 'llegit_pels_altres_fins_seq', 'no_llegits',
    'arxivat_al', 'fixat_al', 'silenciat_fins_al', 'preferit_al', 'no_llegit_manual']) {
    assert.match(f.capcalera, new RegExp(`\\b${col}\\s+(uuid|text|text\\[\\]|timestamptz|bigint|integer|boolean)\\b`), `columna ${col} absent del returns table`);
  }
  assert.match(f.st, /select min\(p\.llegit_fins_seq\)[\s\S]*p\.visible_fins_seq is null[\s\S]*\), 0\) as llegit_pels_altres_fins_seq/i);
  assert.match(f.st, /greatest\(0, f\.ultim_seq - greatest\(jo\.llegit_fins_seq, jo\.buidat_fins_seq\)\)::integer as no_llegits/i);
  assert.match(f.st, /and jo\.visible_fins_seq is null/i);
});

test('xat_marca_llegit es conserva i puja llegit_fins_seq a ultim_seq; xat_missatges_del_fil no es toca', () => {
  const f = FUNCIONS.find((x) => x.nom === 'xat_marca_llegit');
  assert.ok(f && f.esquema === 'public');
  assert.match(f.capcalera, /returns timestamptz/);
  assert.match(f.st, /llegit_fins_seq\s+= greatest\(p\.llegit_fins_seq, f\.ultim_seq\)/i);
  assert.doesNotMatch(CODI, /drop function if exists public\.xat_missatges_del_fil/);
  assert.equal(FUNCIONS.some((x) => x.nom === 'xat_missatges_del_fil'), false);
});

// ── Portes veïnes i documentació ─────────────────────────────────────────────
test('res que la porta R1 de tractor-rls puga confondre: cap create table, create view ni política fora de public', () => {
  assert.doesNotMatch(sql.toLowerCase(), /create table/);
  assert.doesNotMatch(sql.toLowerCase(), /create (or replace )?view/);
  for (const st of STS) {
    const m = /^\s*create policy\s+"[^"]+"\s+on\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i.exec(st);
    if (!m) continue;
    assert.equal(m[1], 'public');
    assert.ok(['xat_missatges', 'xat_lectures'].includes(m[2]), `política sobre ${m[2]}`);
  }
});

test('el README llista la migració i explica l’ordre d’aplicació', () => {
  assert.ok(readme.includes('`migrations/2609270200_xat_f0_fonament.sql`'));
  assert.ok(readme.includes('## Xat F0: seq, marques i RPC'));
  assert.ok(readme.includes('Ordre d\'aplicació'));
  for (const codi of ['SDP-XAT-006', '007', '008', '009', '010']) {
    assert.ok(readme.includes(codi), `${codi} absent del README`);
  }
});

test('higiene de fitxer: línia buida final i cap vocabulari prohibit', () => {
  assert.ok(sql.endsWith('\n'));
  assert.ok(!sql.endsWith('\n\n'));
  assert.doesNotMatch(sql, /offline-first|local-first/i);
});
