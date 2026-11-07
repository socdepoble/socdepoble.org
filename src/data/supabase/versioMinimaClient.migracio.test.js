/* P0-23 (BOT-A2; Gauntlet Claude 261025_1705; rebasat a l'assalt 261101) ·
   Prova estàtica de la migració 2611011510_versio_minima_client.sql (abans
   2610251930 al pegat versio.patch): la versió mínima de l'app nativa que el
   node encara servix. No hi ha cap base de dades: es llig el SQL i es
   comproven la capçalera (PER QUÈ, QUÈ FA, QUÈ NO FA, CODIS, Depén de, l'ordre
   independent de 2610241400, el build 1 que no protegix, NO aplicada,
   l'aplica el Mestre), la transacció, la funció (sql, stable, invoker, el
   search_path buit, cap taula), els permisos (anon i authenticated, i ningú
   més), les dues plataformes amb un mínim que no passa mai del
   VERSIO_CLIENT_NATIU del contracte (també en l'última migració que la torne a
   crear), els enllaços https de les botigues, l'adaptador versioClient.js i
   l'entrada de supabase/README.md. El parser és el de
   titularPublic.migracio.test.js. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { CAPACITATS, CONTRACTE_NUCLI, VERSIO_CLIENT_NATIU } from '../contracte.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2611011510_versio_minima_client.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const ORDRE = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
const llig = (fitxer) => readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const SQL = llig(NOM);
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/versioClient.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = senseComentaris(SQL);
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const LINIES = SQL.split('\n');
const ENLLACOS_DE_BOTIGA = /^https:\/\/(?:apps\.apple\.com|testflight\.apple\.com|play\.google\.com)\//;

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos. */
function funcions(sql) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(sql))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = sql.indexOf(tanca, inici);
    expect(fi, `cos sense tancar a ${m[1]}.${m[2]}`).toBeGreaterThan(inici);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: SENSE_ESPAIS(m[3]), capcalera: SENSE_ESPAIS(m[4]), cos: sql.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);

/** Les files (plataforma, mínim, enllaç) del VALUES d'un cos de versio_minima_client. */
function filesDe(cos) {
  return [...cos.matchAll(/\(\s*'([a-z]+)'\s*,\s*(\d+)\s*,\s*(null::text|null|'([^']*)')\s*\)/g)]
    .map((m) => ({ plataforma: m[1], minim: Number(m[2]), enllac: m[4] ?? null }));
}

/* El nom vell (2610251930) aniria per davant de migracions que el node remot
   ja pot tindre aplicades, i `supabase db push` el rebutjaria sense
   --include-all: el nom nou va després de l'última del 31-10 (2610312000). */
test('el nom segueix el format de les migracions i va després de l’última que hi havia (2610312000)', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  expect(ORDRE.indexOf('2610312000_e2ee_lot3_validadors_service_role.sql')).toBeGreaterThanOrEqual(0);
  expect(ORDRE.indexOf(NOM)).toBeGreaterThan(ORDRE.indexOf('2610312000_e2ee_lot3_validadors_service_role.sql'));
  expect(ORDRE.indexOf(NOM)).toBeGreaterThan(ORDRE.indexOf('2610241400_normes_exigides_ugc.sql'));
  expect(ORDRE.some((f) => f.startsWith('2610251930'))).toBe(false);
});

test('la capçalera: la procedència, PER QUÈ, QUÈ FA, QUÈ NO FA, CODIS, Depén de, l’ordre i NO aplicada, l’aplica el Mestre, en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261101_1510 · P0-23 \(BOT-A2; Gauntlet Claude 261025_1705\) · La versió\n/);
  for (const apartat of [/^-- PER QUÈ: /m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- CODIS: /m, /^-- Depén de: /m, /^-- ORDRE \(decisió del Mestre\): /m]) {
    expect(CAPCALERA).toMatch(apartat);
  }
  expect(LINIES.filter((l) => /^-- NO aplicada: l'aplica el Mestre, mai un agent\.$/.test(l))).toHaveLength(1);
  expect(CAPCALERA).toMatch(/Idempotent i en una sola transacció/);
  /* El matís del verificador: la porta no protegix el build 1. */
  expect(CAPCALERA).toMatch(/No protegix el build 1/);
  /* L'ordre: amb el mínim a 2 no deixa fora ningú, i per això no depén de
     2610241400 (ni li cal anar-hi davant); només ha d'anar abans de la primera
     migració que apuge el mínim. */
  expect(CAPCALERA).toMatch(/^-- ORDRE \(decisió del Mestre\): independent de 2610241400\./m);
  expect(CAPCALERA).toMatch(/l'única condició és que vaja abans de la\n-- primera migració que apuge el mínim/);
  expect(CAPCALERA).not.toMatch(/abans\s+(?:--\s+)?de\s+(?:--\s+)?2610241400/);
  expect(CAPCALERA).toMatch(/fail-open/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
});

test('una sola funció, pública, sql i stable, sense SECURITY DEFINER, amb el search_path buit i sense llegir cap taula', () => {
  expect(FUNCIONS.map((f) => `${f.esquema}.${f.nom}`)).toEqual(['public.versio_minima_client']);
  const [f] = FUNCIONS;
  expect(f.params).toBe('p_plataforma text');
  expect(f.capcalera).toBe("returns jsonb language sql stable set search_path = ''");
  expect(CODI).not.toMatch(/security\s+definer/i);
  /* Cap taula ni vista: només el VALUES del cos. Cap dada de sessió, de persona ni de poble. */
  expect(f.cos).not.toMatch(/\b(?:public|private|auth|storage)\.\w+/i);
  expect(f.cos).not.toMatch(/auth\.uid|current_user|tenant|profiles|email/i);
  expect(SENSE_ESPAIS(f.cos)).toContain("select jsonb_build_object('versio_minima', v.versio_minima, 'enllac', v.enllac) from (values");
  expect(SENSE_ESPAIS(f.cos)).toContain('as v (plataforma, versio_minima, enllac) where v.plataforma = p_plataforma;');
  /* Cap raise: una plataforma desconeguda torna null, sense cap error. */
  expect(f.cos).not.toMatch(/raise/i);
});

test('els permisos: el revoke a tots els rols i l’execució només per a anon i authenticated', () => {
  expect(CODI).toContain('revoke all on function public.versio_minima_client(text) from public, anon, authenticated, service_role;');
  const grants = CODI.split('\n').filter((l) => /^\s*grant\b/i.test(l));
  expect(grants).toEqual(['grant execute on function public.versio_minima_client(text) to anon, authenticated;']);
  expect(CODI.indexOf('revoke all on function public.versio_minima_client')).toBeLessThan(CODI.indexOf('grant execute on function public.versio_minima_client'));
  /* Cap taula, política ni permís de taula. */
  expect(CODI).not.toMatch(/create\s+(?:table|view|policy)|alter\s+table|drop\s+/i);
});

test('les dues plataformes natives, i cap més: un mínim enter que no passa del VERSIO_CLIENT_NATIU del contracte', () => {
  const files = filesDe(FUNCIONS[0].cos);
  expect(files.map((f) => f.plataforma)).toEqual(['ios', 'android']);
  expect(Number.isSafeInteger(VERSIO_CLIENT_NATIU) && VERSIO_CLIENT_NATIU >= 2).toBe(true);
  for (const { plataforma, minim } of files) {
    expect(Number.isSafeInteger(minim) && minim >= 1, plataforma).toBe(true);
    /* Un mínim més alt que el client publicat el bloquejaria a ell mateix. */
    expect(minim, plataforma).toBeLessThanOrEqual(VERSIO_CLIENT_NATIU);
  }
  /* El primer mínim és el build 2: el primer que porta la porta. */
  expect(files.map((f) => f.minim)).toEqual([2, 2]);
});

test('l’última migració que torna a crear la funció no demana mai més del que el client sap (VERSIO_CLIENT_NATIU)', () => {
  const definidores = ORDRE.filter((f) => /create\s+(?:or\s+replace\s+)?function\s+public\.versio_minima_client\s*\(/i.test(senseComentaris(llig(f))));
  expect(definidores[0]).toBe(NOM);
  const [vigent] = funcions(senseComentaris(llig(definidores.at(-1))));
  const files = filesDe(vigent.cos);
  expect(files.length).toBeGreaterThan(0);
  for (const { plataforma, minim } of files) expect(minim, `${definidores.at(-1)} · ${plataforma}`).toBeLessThanOrEqual(VERSIO_CLIENT_NATIU);
});

test('els enllaços: null o una adreça https d’una botiga; el d’Android, el del paquet org.socdepoble.app', () => {
  const files = filesDe(FUNCIONS[0].cos);
  for (const { plataforma, enllac } of files) {
    if (enllac !== null) expect(enllac, plataforma).toMatch(ENLLACOS_DE_BOTIGA);
  }
  expect(files.find((f) => f.plataforma === 'android').enllac).toBe('https://play.google.com/store/apps/details?id=org.socdepoble.app');
  /* Encara no se sap l'adreça de l'App Store: null, i l'app només hi ensenya la web. */
  expect(files.find((f) => f.plataforma === 'ios').enllac).toBeNull();
  const capacitor = JSON.parse(readFileSync(path.join(ARREL, 'capacitor.config.json'), 'utf8'));
  expect(capacitor.appId).toBe('org.socdepoble.app');
});

test('l’adaptador versioClient.js crida la RPC amb p_plataforma, i el contracte en té la capacitat fora del nucli', () => {
  expect(CLIENT).toMatch(/rpc\('versio_minima_client', \{ p_plataforma: plataforma \}/);
  expect(CLIENT).toMatch(/fila\?\.versio_minima/);
  expect(CLIENT).toMatch(/fila\.enllac/);
  expect(CAPACITATS.versioClient).toEqual(['versioMinimaClient']);
  expect(CONTRACTE_NUCLI).not.toContain('versioMinimaClient');
});

test('el catàleg supabase/README.md la nomena després de 2610312000, abans de seed.sql, aplicada a producció, amb l’ordre, en un sol paràgraf', () => {
  const posicio = README.indexOf(`- \`migrations/${NOM}\`\n`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('- `migrations/2610312000_e2ee_lot3_validadors_service_role.sql`\n'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/P0-23 \(BOT-A2; Gauntlet Claude 261025_1705\)/);
  // Onada R10 · B4: la lectura REST del 6-11-2026 hi troba la funció (200 a anon); la fila diu el mateix.
  expect(entrada.replace(/\s+/g, ' ')).toContain("**aplicada a producció** (lectura REST del 6-11-2026: `versio_minima_client('android')` respon 200 a anon; acta 261102_1456)");
  expect(entrada).not.toMatch(/NO aplicada/);
  expect(README).toMatch(/^\| \d+ \| `2611011510` \| `2611011510_versio_minima_client\.sql` \| Aplicada a producció \(lectura REST del 6-11: `versio_minima_client\('android'\)` respon 200 a anon; acta 261102_1456\) \| [^|]+ \|$/m);
  for (const text of ['`public.versio_minima_client(p_plataforma)`', '`VERSIO_CLIENT_NATIU`', '`versioClient`', 'build 1', 'build 2', '2610241400',
    'grant execute on function public.versio_minima_client(text) to anon, authenticated;', 'src/data/supabase/versioMinimaClient.migracio.test.js']) {
    expect(entrada, text).toContain(text);
  }
  expect(entrada).toMatch(/Ordre: independent de 2610241400\./);
  expect(entrada).not.toMatch(/abans\s+de\s+2610241400/);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first|masia/i);
});
