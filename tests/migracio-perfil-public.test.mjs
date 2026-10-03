// Prova estàtica de la migració 261002_1520 (la persona al cercador:
// public.perfil_public). No hi ha cap base de dades: es llig el SQL i es
// comproven la forma de la RPC, els permisos, la guarda de sessió, l'exclusió
// de les baixes, la comprovació de poble i els camps mínims de legalContent §13.
// També es contrasta amb el client que la crida (src/data/supabase/perfils.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SQL = fs.readFileSync(path.join(ARREL, 'supabase/migrations/2610021520_perfil_public.sql'), 'utf8');
const CLIENT = fs.readFileSync(path.join(ARREL, 'src/data/supabase/perfils.js'), 'utf8');
// Sense comentaris de línia: es comprova el codi, no la prosa.
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos. */
function funcions(sql) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(sql))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = sql.indexOf(tanca, inici);
    assert.ok(fi > inici, `cos sense tancar a ${m[1]}.${m[2]}`);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: m[3], capcalera: m[4], cos: sql.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const RPC = FUNCIONS.find((f) => f.esquema === 'public' && f.nom === 'perfil_public');

/* Les columnes que torna, en ordre: les mínimes (§13) i les de la fitxa sencera. */
const MINIMES = ['id', 'full_name', 'avatar_url', 'town_name'];
const SENCERES = ['hero_url', 'lema', 'bio', 'presentacio_html', 'copyright', 'icon', 'is_public', 'created_at', 'updated_at'];
/* Les que no han d'eixir mai d'esta funció. */
const SENSIBLES = ['visibility', 'consentiment_rgpd_at', 'baixa_demanada_at', 'email', 'raw_user_meta_data', 'role'];

function columnesDeRetorn() {
  const taula = RPC.capcalera.match(/returns\s+table\s*\(([\s\S]*?)\)\s*language/i);
  assert.ok(taula, 'perfil_public ha de tornar una taula');
  return taula[1].split(',').map((c) => c.trim().split(/\s+/)[0].toLowerCase());
}

/** La llista de select de `return query`, separada per comes de primer nivell. */
function llistaDelSelect() {
  const cos = RPC.cos;
  const inici = cos.search(/return\s+query\s+select\s/i);
  assert.ok(inici >= 0, 'falta return query select');
  const desDe = cos.slice(inici).replace(/^return\s+query\s+select\s/i, '');
  const fi = desDe.search(/\bfrom\s+public\.profiles\b/i);
  assert.ok(fi > 0, 'el select ha de llegir public.profiles');
  const eixida = [];
  let nivell = 0;
  let actual = '';
  for (const c of desDe.slice(0, fi)) {
    if (c === '(') nivell += 1;
    if (c === ')') nivell -= 1;
    if (c === ',' && nivell === 0) { eixida.push(SENSE_ESPAIS(actual)); actual = ''; } else actual += c;
  }
  eixida.push(SENSE_ESPAIS(actual));
  return eixida;
}

/* La capacitat 'directori' no diu si la RPC existix (teCapacitat només mira el
   mètode del port): l'ordre de desplegament és l'única guarda del cercador. */
test('la capçalera i el README diuen que NO està aplicada i que va ABANS de publicar el client', () => {
  assert.match(SQL, /NO aplicada/);
  assert.match(SQL, /ABANS de publicar el client/);
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const nom = 'migrations/2610021520_perfil_public.sql';
  assert.ok(readme.includes(nom), 'falta l’entrada al README');
  assert.match(readme.slice(readme.indexOf(nom)).split('\n\n')[0], /abans de publicar el client/i);
});

test('la migració és una sola transacció amb temps d’espera curts i avisa PostgREST', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.match(CODI.trimEnd(), /commit;$/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
  assert.match(CODI, /set local lock_timeout = '5s';/i);
  assert.match(CODI, /set local statement_timeout = '60s';/i);
  assert.ok(CODI.search(/notify pgrst, 'reload schema';/i) < CODI.search(/commit;/i), 'notify abans de commit');
});

test('additiva: una sola funció nova, cap taula, política, columna ni esborrat', () => {
  assert.equal(FUNCIONS.length, 1);
  assert.ok(RPC, 'falta public.perfil_public');
  assert.doesNotMatch(CODI, /\bcreate\s+(table|policy|view|trigger|index)\b/i);
  assert.doesNotMatch(CODI, /\balter\s+table\b/i);
  assert.doesNotMatch(CODI, /\b(drop|delete|update|insert|truncate)\b/i);
});

test('forma del contracte: perfil_public(p_id uuid), stable, security definer i search_path buit', () => {
  assert.equal(SENSE_ESPAIS(RPC.params), 'p_id uuid');
  assert.match(RPC.capcalera, /\bstable\b/i);
  assert.match(RPC.capcalera, /security\s+definer/i);
  assert.match(RPC.capcalera, /set\s+search_path\s*=\s*''/i);
  assert.doesNotMatch(CODI, /set\s+search_path\s*=\s*public/i);
  assert.deepEqual(columnesDeRetorn(), [...MINIMES, ...SENCERES]);
});

test('permisos: revoke a public i anon, grant només a authenticated', () => {
  assert.match(CODI, /revoke execute on function public\.perfil_public\(uuid\) from public, anon;/i);
  assert.match(CODI, /grant execute on function public\.perfil_public\(uuid\) to authenticated;/i);
  assert.doesNotMatch(CODI, /grant execute on function[^;]*\bto\b[^;]*\banon\b/i);
  assert.doesNotMatch(CODI, /grant execute on function[^;]*\bto\b[^;]*\bpublic\s*;/i);
  assert.ok(CODI.search(/revoke execute/i) < CODI.search(/grant execute/i), 'el revoke va abans del grant');
});

test('guarda de sessió: sense auth.uid() llança SDP-PERFIL-010 abans de llegir res', () => {
  assert.match(RPC.cos, /v_jo uuid := \(select auth\.uid\(\)\);/i);
  const guarda = RPC.cos.search(/if v_jo is null then\s+raise exception 'SDP-PERFIL-010:[^']*' using errcode = '42501';/i);
  assert.ok(guarda >= 0, 'falta la guarda de sessió');
  assert.ok(guarda < RPC.cos.search(/return\s+query/i), 'la guarda va abans de la consulta');
});

test('una persona amb la baixa demanada no ix mai, ni per a ella mateixa', () => {
  const where = RPC.cos.slice(RPC.cos.search(/\bwhere p\.id = p_id\b/i));
  assert.match(where, /^where p\.id = p_id\s+and p\.baixa_demanada_at is null\s+and \(/i);
});

test('sencera només per a la mateixa persona o una fitxa publicada', () => {
  assert.match(RPC.cos, /cross join lateral \(select \(p\.id = v_jo or coalesce\(p\.is_public, false\)\) as sencera\) d/i);
});

test('sense publicar, només qui comparteix poble (town_memberships) la veu', () => {
  const resta = RPC.cos.slice(RPC.cos.search(/and \(d\.sencera or exists \(/i));
  assert.ok(resta.length > 0, 'falta la condició sencera o mateix poble');
  assert.match(resta, /from public\.town_memberships tm_jo\s+join public\.town_memberships tm_ella on tm_ella\.town_id = tm_jo\.town_id/i);
  assert.match(resta, /where tm_jo\.user_id = v_jo\s+and tm_ella\.user_id = p\.id/i);
});

test('legalContent §13: en el cas mínim només el nom, la foto, el poble i l’id', () => {
  const select = llistaDelSelect();
  assert.deepEqual(select.slice(0, MINIMES.length), MINIMES.map((c) => `p.${c}`));
  const cues = select.slice(MINIMES.length);
  assert.equal(cues.length, SENCERES.length);
  SENCERES.forEach((columna, i) => {
    const esperat = columna === 'is_public'
      ? 'case when d.sencera then coalesce(p.is_public, false) else false end'
      : `case when d.sencera then p.${columna} end`;
    assert.equal(cues[i], esperat, `la columna ${columna} només en la fitxa sencera`);
  });
});

test('cap dada sensible: ni correu, ni rol, ni visibilitat, ni consentiment, ni metadades de GoTrue', () => {
  for (const columna of SENSIBLES) {
    assert.ok(!llistaDelSelect().some((c) => c.includes(columna)), `${columna} no pot eixir`);
  }
  assert.doesNotMatch(RPC.cos, /\bauth\.users\b/i);
});

test('el client la crida amb p_id i llig columnes que la RPC torna', () => {
  assert.match(CLIENT, /rpc\('perfil_public', \{ p_id: clau \}/);
  const llegides = new Set([...CLIENT.slice(CLIENT.indexOf('export function perfilDePersona'))
    .slice(0, 1200).matchAll(/fila\.(\w+)/g)].map((m) => m[1]));
  const tornades = new Set(columnesDeRetorn());
  const fora = [...llegides].filter((c) => !tornades.has(c));
  assert.deepEqual(fora, [], `perfilDePersona llig columnes que la RPC no torna: ${fora.join(', ')}`);
});
