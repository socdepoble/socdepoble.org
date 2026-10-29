// @vitest-environment node
/* P1-12 i IDEA-48 · E2EE-1a (disseny_final_e2ee.md v1.1.0, §7.2 primera
   fila, §7.3, §7.4 i §7.9; esmenes_qa_261029.md §13.1 R3, R5, R8 i R9;
   auditoria Codex 261029_0340 E2EE-I03; pla 261029_0216, T7) · Prova
   estàtica de la migració 2610290400_xat_e2ee_claus_i_sobres.sql. Cap base de
   dades: es llig el SQL (patró d'usuariIPoble.migracio.test.js) i es
   comproven la capçalera (les cites del disseny i de les esmenes, QUÈ FA, QUÈ
   NO FA, CODIS, Depén de, les consultes d'abans i de després, la recepta de
   les dues sessions i una sola línia «NO aplicada»), la transacció, les
   guardes abans de cap objecte, cada taula nova amb RLS, tot revocat i només
   select, delete per a service_role (cap política, cap permís per a anon),
   cada funció SECURITY DEFINER amb search_path buit i els permisos d'execució,
   un sol rellotge per crida (now() de la transacció una sola vegada, mai
   clock_timestamp, cap rellotge dins d'un CHECK), el comparar-i-canviar de
   xat_publica_identitat (SDP-XAT-041) i de xat_canvia_rk (SDP-XAT-046), el
   comptador estrictament creixent de la llibreta (SDP-XAT-044), cap columna
   amb la RK ni cap privada en clar, el contracte R8 d'IDEA-48 (creat_ms i
   caduca_ms bigint, índex únic del cercle vigent, clau forana de la petició,
   el SDPN sencer en qualsevol estat), la llista d'orígens exacta, els codis
   tancats i sense cap oracle, que no toca xat_envia ni cap taula de
   missatges, la inversa (esborra exactament el que es crea) i l'entrada de
   supabase/README.md. Les sondes del final proven que els detectors veuen una
   variant dolenta. L'execució de veres (dues vegades, la inversa i una tanda
   de crides) la va fer la línia a PGlite 0.3.16 (fora del repositori); la de
   dues sessions és del Mestre. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const NOM = '2610290400_xat_e2ee_claus_i_sobres.sql';
const llig = (nom) => readFileSync(path.join(MIGRACIONS, nom), 'utf8');
const SQL = llig(NOM);
const LINIES = SQL.split('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const sensComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = sensComentaris(SQL);
const normal = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const AGENTS_SEED = readFileSync(path.join(ARREL, 'src/data/agentsSeed.js'), 'utf8');

/* El que esta migració crea (i el que la inversa ha d'esborrar, ni més ni menys). */
const TAULES_PUBLIQUES = Object.freeze(['xat_claus_usuari', 'xat_llibretes', 'xat_cercles_recuperacio', 'xat_avals_recuperacio',
  'xat_peticions_recuperacio', 'xat_verificacions_recuperacio', 'xat_alliberaments_recuperacio']);
const TAULES_PRIVADES = Object.freeze(['xat_origens_xifrat', 'xat_ritme_claus']);
const RPC = Object.freeze({
  xat_publica_identitat: 'text, text, text, text, jsonb',
  xat_la_meua_identitat: '',
  xat_desa_frase: 'text, jsonb',
  xat_claus_de: 'uuid[]',
  xat_desa_llibreta: 'bigint, jsonb',
  xat_la_meua_llibreta: '',
  xat_canvia_rk: 'text, text, jsonb, jsonb'
});
const PRIVADES = Object.freeze({
  xat_b64: 'text, integer', xat_b64_enc: 'bytea', xat_uuid16: 'uuid', xat_u32: 'bytea, integer', xat_jwk_punt: 'jsonb',
  xat_copia_forma: 'jsonb, text[]', xat_claus_usuari_immobil: '', xat_origen_admes: '', xat_ritme_claus_compta: 'uuid, text, timestamptz, integer'
});
const ORIGENS = Object.freeze(['https://socdepoble.org', 'capacitor://localhost', 'https://localhost']);
const CODIS = Object.freeze(['SDP-XAT-001', 'SDP-XAT-009', 'SDP-XAT-033', 'SDP-XAT-038', 'SDP-XAT-040', 'SDP-XAT-041', 'SDP-XAT-042',
  'SDP-XAT-043', 'SDP-XAT-044', 'SDP-XAT-045', 'SDP-XAT-046', 'SDP-XAT-900']);
const IAIA = '11111111-1a1a-0000-0000-000000000000';
/* La paraula vetada pel Mestre per a anomenar la plataforma (regla «el Mas»), composta perquè no aparega escrita. */
const PARAULA_VETADA = ['mas', 'ia'].join('');

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos (sense normalitzar). */
function funcions(codi) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(codi))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = codi.indexOf(tanca, inici);
    expect(fi, `cos sense tancar a ${m[1]}.${m[2]}`).toBeGreaterThan(inici);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: normal(m[3]), capcalera: normal(m[4]), cos: codi.slice(inici, fi), inici: m.index });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (codi, esquema, nom) => funcions(codi).find((f) => f.esquema === esquema && f.nom === nom) ?? null;
/** Els tipus dels paràmetres, sense noms ni valors de sèrie: «p text, p_bytes integer default null» → «text, integer». */
const tipus = (params) => params.split(',').map((p) => p.trim()).filter(Boolean)
  .map((p) => p.replace(/\s+default\s+.*$/, '').split(/\s+/).slice(1).join(' ')).join(', ');
/** El bloc d'una taula: de «create table if not exists esquema.nom (» fins al «);» que el tanca. */
function taula(codi, esquema, nom) {
  const inici = codi.search(new RegExp(`create table if not exists ${esquema}\\.${nom} \\(`));
  if (inici < 0) return null;
  const fi = codi.indexOf('\n);', inici);
  return codi.slice(inici, fi + 3);
}
/** Les clàusules check (…) d'un bloc, amb els parèntesis equilibrats. */
function checks(bloc) {
  const eixida = [];
  const re = /\bcheck\s*\(/gi;
  while (re.exec(bloc)) {
    let p = 1;
    let i = re.lastIndex;
    while (i < bloc.length && p > 0) {
      if (bloc[i] === '(') p += 1;
      else if (bloc[i] === ')') p -= 1;
      i += 1;
    }
    eixida.push(bloc.slice(re.lastIndex, i - 1));
  }
  return eixida;
}
/** Els noms de columna d'un bloc de taula: cada peça separada per una coma de nivell zero que comença per «nom tipus». */
function columnes(bloc) {
  const cos = bloc.slice(bloc.indexOf('(') + 1);
  const peces = [];
  let profunditat = 0;
  let actual = '';
  for (const ch of cos) {
    if (ch === '(') profunditat += 1;
    else if (ch === ')') profunditat -= 1;
    if (ch === ',' && profunditat === 0) { peces.push(actual); actual = ''; } else actual += ch;
  }
  peces.push(actual);
  return peces.map((peca) => peca.trim().split(/\s+/))
    .filter((t) => /^(uuid|bytea|text|bigint|integer|smallint|jsonb|timestamptz|boolean)$/.test(t[1] ?? ''))
    .map((t) => t[0]);
}
/* La inversa: el bloc comentat del final, sense els «-- ». */
const INVERSA = SQL.slice(SQL.indexOf('-- INVERSA')).split('\n').filter((l) => /^-- (begin|drop|notify|commit)/.test(l)).map((l) => l.slice(3));
const dropsDe = (inversa, tipus) => inversa.filter((l) => l.startsWith(`drop ${tipus} if exists `)).map((l) => l.replace(`drop ${tipus} if exists `, '').replace(/;$/, ''));
const SENTENCIES = CODI.split(';').map(normal).filter(Boolean);

/** Una sonda que no canvia el text no prova res (el reemplaç és literal: «$$» no és cap patró). */
const muta = (text, de, a) => {
  const nou = text.replace(de, () => a);
  expect(nou, String(de)).not.toBe(text);
  return nou;
};
/* Els detectors de les sondes. */
const totesAmbSearchPath = (codi) => funcions(codi).every((f) => /set search_path = ''/.test(f.capcalera));
const totesLesTaulesAmbRls = (codi) => [...TAULES_PUBLIQUES.map((t) => `public.${t}`), ...TAULES_PRIVADES.map((t) => `private.${t}`)]
  .every((t) => codi.includes(`alter table ${t} enable row level security;`));
const unSolRellotge = (codi) => !/clock_timestamp/i.test(codi) && funcions(codi).every((f) => {
  const ara = (f.cos.match(/\bnow\(\)/g) || []).length;
  return ara === 0 || (ara === 1 && /v_ara timestamptz := now\(\);/.test(f.cos));
});
const inversaExacta = (sql, codi) => {
  const inversa = sql.slice(sql.indexOf('-- INVERSA')).split('\n').filter((l) => /^-- drop/.test(l)).map((l) => l.slice(3));
  const taules = [...codi.matchAll(/create table if not exists (\w+\.\w+)/g)].map((m) => m[1]).sort();
  const funcs = funcions(codi).map((f) => `${f.esquema}.${f.nom}(${tipus(f.params)})`).sort();
  const triggers = [...codi.matchAll(/create trigger (\w+) before update on (\w+\.\w+)/g)].map((m) => `${m[1]} on ${m[2]}`).sort();
  return JSON.stringify(dropsDe(inversa, 'table').sort()) === JSON.stringify(taules)
    && JSON.stringify(dropsDe(inversa, 'function').sort()) === JSON.stringify(funcs)
    && JSON.stringify(dropsDe(inversa, 'trigger').sort()) === JSON.stringify(triggers);
};
const cercleVigentUnic = (codi) => /create unique index if not exists xat_cercles_recuperacio_vigent\s+on public\.xat_cercles_recuperacio \(usuari_id\) where retirat_al is null;/.test(codi);

describe('E2EE-1a · la migració: nom, capçalera i transacció', () => {
  test('el nom segueix el format i va després de totes les migracions de què depén', () => {
    expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
    const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
    for (const anterior of ['2609080000_initial_schema.sql', '2609080100_xat_v2.sql', '2609272200_xat_entitats.sql',
      '2610220240_xat_adjunts_i_quota.sql', '2610282100_usuari_i_poble_canonic.sql']) {
      expect(ordre.indexOf(anterior), anterior).toBeGreaterThanOrEqual(0);
      expect(ordre.indexOf(NOM), anterior).toBeGreaterThan(ordre.indexOf(anterior));
    }
  });

  test('la capçalera: el disseny i les esmenes citats, els apartats, les consultes, les dues sessions i UNA sola línia NO aplicada', () => {
    expect(SQL).toMatch(/^-- =+\n-- 261029_0400 · P1-12 i IDEA-48 \(disseny_final_e2ee\.md v1\.1\.0, §7\.2 primera\n-- fila, §7\.3, §7\.4 i §7\.9; esmenes_qa_261029\.md §13\.1 R3, R5, R8 i R9;\n-- auditoria Codex 261029_0340 E2EE-I03/);
    for (const apartat of [/^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- CODIS/m, /^-- Depén de: 2609080000/m, /^-- ABANS D'APLICAR-LA \(lectura/m,
      /^-- DESPRÉS D'APLICAR-LA \(lectura\):$/m, /^-- VERIFICACIÓ MANUAL AMB DUES SESSIONS/m]) {
      expect(CAPCALERA).toMatch(apartat);
    }
    for (const cita of ['§7.2', '§7.3', '§7.4', '§7.9', 'R3', 'R5', 'R8', 'R9', 'E2EE-I03', 'E2EE-1b', '2610282100']) expect(CAPCALERA, cita).toContain(cita);
    for (let n = 1; n <= 3; n += 1) expect(CAPCALERA, `consulta ${n}`).toMatch(new RegExp(`^--   ${n}\\. select `, 'm'));
    expect(CAPCALERA).toContain("select private.xat_b64_enc(private.xat_b64('AQID', 3));  (AQID)");
    expect(CAPCALERA).toMatch(/Sessió 2: rep SDP-XAT-041/);
    expect(LINIES.filter((l) => /NO aplicada/.test(l))).toEqual(["-- NO aplicada: l'aplica el Mestre, mai un agent."]);
    /* La plataforma és «el Mas»: la paraula vetada no apareix en cap lloc. */
    expect(SQL.toLowerCase()).not.toContain(PARAULA_VETADA);
  });

  test('una sola transacció amb temps d’espera curts, recàrrega de PostgREST i commit; cap rollback', () => {
    expect(CODI.trimStart()).toMatch(/^begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
    expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
    expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
    expect(CODI).toMatch(/notify pgrst, 'reload schema';\s*commit;\s*$/i);
    expect(CODI).not.toMatch(/\brollback\b/i);
  });

  test('guardes primer: la cadena fins a 2610282100 avorta (SDP-XAT-900) abans de cap objecte', () => {
    const guarda = CODI.search(/raise exception 'SDP-XAT-900: falta la cadena pendent/);
    expect(guarda).toBeGreaterThan(0);
    expect(guarda).toBeLessThan(CODI.search(/create (or replace function|table)/));
    for (const objecte of ["to_regclass('public.xat_participants')", "to_regprocedure('private.es_participant(uuid)')",
      "to_regclass('public.xat_adjunts')", "to_regprocedure('public.desa_el_meu_usuari(text)')"]) {
      expect(CODI.slice(0, guarda), objecte).toContain(objecte);
    }
  });
});

describe('E2EE-1a · taules: RLS, permisos i cap lectura directa', () => {
  test.each(TAULES_PUBLIQUES)('public.%s: IF NOT EXISTS, RLS activa, tot revocat i només select, delete per a service_role', (t) => {
    expect(taula(CODI, 'public', t), t).toBeTruthy();
    expect(CODI).toContain(`alter table public.${t} enable row level security;`);
    expect(CODI).toContain(`revoke all on table public.${t} from public, anon, authenticated, service_role;`);
    expect(CODI).toContain(`grant select, delete on table public.${t} to service_role;`);
  });

  test.each(TAULES_PRIVADES)('private.%s: RLS activa, tot revocat i cap permís', (t) => {
    expect(taula(CODI, 'private', t), t).toBeTruthy();
    expect(CODI).toContain(`alter table private.${t} enable row level security;`);
    expect(CODI).toContain(`revoke all on table private.${t} from public, anon, authenticated, service_role;`);
    expect(CODI).not.toMatch(new RegExp(`grant [^;]* on table private\\.${t}\\b`));
  });

  test('cap política, cap grant a anon ni a authenticated sobre cap taula; els grants són exactament els esperats', () => {
    expect(CODI).not.toMatch(/\b(create|alter|drop)\s+policy\b/i);
    expect(CODI).not.toMatch(/\bgrant\b[^;]*\bto\b[^;]*\banon\b/i);
    expect(CODI).not.toMatch(/\bgrant\b[^;]*\bon table\b[^;]*\bto\b[^;]*\bauthenticated\b/i);
    const grants = SENTENCIES.filter((s) => /^grant\b/.test(s)).sort();
    expect(grants).toEqual([
      ...TAULES_PUBLIQUES.map((t) => `grant select, delete on table public.${t} to service_role`),
      ...Object.entries(RPC).map(([nom, params]) => `grant execute on function public.${nom}(${params}) to authenticated`)
    ].sort());
    expect(totesLesTaulesAmbRls(CODI)).toBe(true);
  });

  test('xat_claus_usuari: un sol registre actiu per persona, mai la IAIA, només d’afegir (disparador SDP-XAT-038) i cap RK ni privada en clar', () => {
    expect(CODI).toMatch(/create unique index if not exists xat_claus_usuari_activa\s+on public\.xat_claus_usuari \(usuari_id\) where retirada_al is null;/);
    const bloc = taula(CODI, 'public', 'xat_claus_usuari');
    expect(bloc).toContain(`usuari_id <> '${IAIA}'::uuid`);
    expect(AGENTS_SEED).toContain(`id: '${IAIA}'`);
    expect(columnes(bloc)).toEqual(['kid', 'usuari_id', 'sig_pub', 'dh_pub', 'declaracio', 'autofirma', 'kid_anterior', 'firma_continuitat',
      'creat_al', 'retirada_al', 'backup_privat_ct', 'backup_iv', 'backup_rk_ct', 'backup_rk_iv', 'backup_sal', 'backup_kdf',
      'backup_iteracions', 'backup_llista', 'backup_al']);
    /* La RK i la privada només hi són xifrades (…_ct amb el seu IV): cap columna rk, frase, privada o clau en clar. */
    for (const c of columnes(bloc)) expect(c, c).not.toMatch(/^(rk|frase|privada|clau_privada|backup_rk|backup_privat|backup_frase)$/);
    expect(bloc).toMatch(/octet_length\(backup_privat_ct\) = 241 and octet_length\(backup_iv\) = 12/);
    expect(bloc).toMatch(/octet_length\(backup_rk_ct\) = 48 and octet_length\(backup_rk_iv\) = 12/);
    expect(bloc).toMatch(/backup_iteracions between 600000 and 10000000/);
    expect(bloc).toMatch(/retirada_al is not null and backup_privat_ct is null and backup_rk_ct is null/);
    expect(CODI).toMatch(/create trigger xat_claus_usuari_immobil before update on public\.xat_claus_usuari\s+for each row execute function private\.xat_claus_usuari_immobil\(\);/);
    expect(CODI).toMatch(/drop trigger if exists xat_claus_usuari_immobil on public\.xat_claus_usuari;/);
    const immobil = funcio(CODI, 'private', 'xat_claus_usuari_immobil');
    expect(immobil.cos).toMatch(/\(new\.kid, new\.usuari_id, new\.sig_pub, new\.dh_pub, new\.declaracio, new\.autofirma,\s+new\.kid_anterior, new\.firma_continuitat, new\.creat_al\)\s+is distinct from/);
    expect(immobil.cos).toMatch(/old\.retirada_al is not null and new\.retirada_al is distinct from old\.retirada_al/);
    expect(immobil.cos).toMatch(/SDP-XAT-038[^\n]*errcode = '42501'/);
  });

  test('xat_llibretes: una fila per persona, comptador des d’1, mides exactes', () => {
    const bloc = taula(CODI, 'public', 'xat_llibretes');
    expect(bloc).toMatch(/usuari_id uuid primary key references auth\.users\(id\) on delete cascade/);
    expect(bloc).toMatch(/comptador >= 1/);
    expect(bloc).toMatch(/octet_length\(ct\) between 32 and 262144 and octet_length\(firma\) = 64/);
  });

  test('cada CHECK torna fals si donaria NULL (coalesce(…, false)) i cap no porta cap rellotge', () => {
    const blocs = [...TAULES_PUBLIQUES.map((t) => taula(CODI, 'public', t)), ...TAULES_PRIVADES.map((t) => taula(CODI, 'private', t))];
    const totes = blocs.flatMap(checks);
    expect(totes.length).toBeGreaterThanOrEqual(9);
    for (const c of totes) {
      expect(c, c).not.toMatch(/\b(now|clock_timestamp|current_timestamp|localtimestamp|statement_timestamp|transaction_timestamp)\b/i);
      if (!/^accio in \(/.test(c.trim())) expect(normal(c), c).toMatch(/^coalesce\(/);
    }
  });
});

describe('E2EE-1a · el contracte de dades d’IDEA-48 (esmenes R5 i R8)', () => {
  test('creat_ms i caduca_ms bigint exactes, 2 h com a molt, i la clau forana de la petició al cercle', () => {
    const bloc = taula(CODI, 'public', 'xat_peticions_recuperacio');
    expect(bloc).toMatch(/creat_ms bigint not null, caduca_ms bigint not null/);
    expect(bloc).toMatch(/creat_ms > 0 and caduca_ms > creat_ms and caduca_ms <= creat_ms \+ 7200000/);
    expect(bloc).toMatch(/foreign key \(usuari_id, repartiment_id\)\s+references public\.xat_cercles_recuperacio \(usuari_id, repartiment_id\) on delete cascade/);
    expect(bloc).not.toMatch(/caduca_al|caduca timestamptz/);
  });

  test('un sol cercle vigent per persona (índex únic parcial) i k = 3 exacte amb n de 3 a 255', () => {
    expect(cercleVigentUnic(CODI)).toBe(true);
    const bloc = taula(CODI, 'public', 'xat_cercles_recuperacio');
    expect(bloc).toMatch(/k = 3 and n between k and 255 and octet_length\(declaracio\) = 83 \+ 97 \* n/);
  });

  test('el SDPN sencer (61 B) lligat al compte, al kid i a la petició, admés en qualsevol estat (R5), i cap retorn a oberta', () => {
    const bloc = taula(CODI, 'public', 'xat_peticions_recuperacio');
    expect(bloc).toMatch(/estat in \('oberta', 'completada', 'cancellada', 'no_soc_jo', 'caducada'\)/);
    expect(bloc).toMatch(/\(no_soc_jo_sdpn is null\) = \(no_soc_jo_firma is null\)/);
    expect(bloc).toMatch(/\(no_soc_jo_sdpn is null\) = \(no_soc_jo_al is null\)/);
    expect(bloc).toMatch(/octet_length\(no_soc_jo_sdpn\) = 61 and octet_length\(no_soc_jo_firma\) = 64/);
    expect(bloc).toMatch(/substring\(no_soc_jo_sdpn from 1 for 5\) = '\\x5344504e01'::bytea/);
    expect(bloc).toMatch(/substring\(no_soc_jo_sdpn from 6 for 16\) = private\.xat_uuid16\(usuari_id\)/);
    expect(bloc).toMatch(/substring\(no_soc_jo_sdpn from 22 for 16\) = kid/);
    expect(bloc).toMatch(/substring\(no_soc_jo_sdpn from 38 for 16\) = private\.xat_uuid16\(id\)/);
    expect(bloc).toMatch(/\(estat <> 'no_soc_jo' or no_soc_jo_sdpn is not null\)/);
    expect(bloc).toMatch(/\(estat = 'oberta'\) = \(tancat_al is null\)/);
    /* R5: la firma no va lligada a l'estat no_soc_jo (es pot disputar completada, cancellada o caducada). */
    expect(bloc).not.toMatch(/\(estat = 'no_soc_jo'\) = \(no_soc_jo/);
  });

  test('aval de 49 B amb x únic per repartiment; alliberament de 113 B amb x únic per petició i lligat a l’intent', () => {
    const avals = taula(CODI, 'public', 'xat_avals_recuperacio');
    expect(avals).toMatch(/unique \(usuari_id, repartiment_id, x\)/);
    expect(avals).toMatch(/octet_length\(ct\) = 49 and octet_length\(private\.xat_jwk_punt\(enc_jwk\)\) = 65/);
    const allib = taula(CODI, 'public', 'xat_alliberaments_recuperacio');
    expect(allib).toMatch(/unique \(peticio_id, x\)/);
    expect(allib).toMatch(/foreign key \(peticio_id, amic_id, intent\)\s+references public\.xat_verificacions_recuperacio \(peticio_id, amic_id, intent\)/);
    expect(allib).toMatch(/octet_length\(ct\) = 113/);
    expect(taula(CODI, 'public', 'xat_verificacions_recuperacio')).toMatch(/intent between 1 and 3/);
  });
});

describe('E2EE-1a · funcions: definer, search_path, permisos i rellotge', () => {
  test('les funcions són exactament les esperades, totes amb search_path buit', () => {
    const noms = (esquema) => FUNCIONS.filter((f) => f.esquema === esquema).map((f) => [f.nom, tipus(f.params)]).sort();
    expect(noms('public')).toEqual(Object.entries(RPC).sort());
    expect(noms('private')).toEqual(Object.entries(PRIVADES).sort());
    expect(totesAmbSearchPath(CODI)).toBe(true);
  });

  test.each(Object.entries(RPC))('public.%s: security definer, revocada a public i anon, donada només a authenticated, sessió i origen primer', (nom, params) => {
    const f = funcio(CODI, 'public', nom);
    expect(f.capcalera).toMatch(/language plpgsql (volatile|stable) security definer set search_path = ''/);
    expect(CODI).toContain(`revoke execute on function public.${nom}(${params}) from public, anon;\ngrant execute on function public.${nom}(${params}) to authenticated;`);
    const sessio = f.cos.indexOf("raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';");
    const origen = f.cos.indexOf("if not private.xat_origen_admes() then\n    raise exception 'SDP-XAT-045:");
    expect(sessio, 'sessió').toBeGreaterThan(0);
    expect(origen, 'origen').toBeGreaterThan(sessio);
    const primeraConsulta = f.cos.search(/\b(select|update|insert|delete|perform)\b/);
    expect(origen).toBeLessThan(primeraConsulta < 0 ? Infinity : f.cos.indexOf('from public.', origen));
  });

  test('les privades: cap execute per a public, anon ni authenticated; les de codificació són immutables i sense definer', () => {
    for (const [nom, params] of Object.entries(PRIVADES)) {
      expect(CODI, nom).toMatch(new RegExp(`revoke execute on function[^;]*private\\.${nom}\\(${params.replace(/[[\]]/g, '\\$&')}\\)[^;]*from public, anon, authenticated;`));
    }
    for (const nom of ['xat_b64', 'xat_b64_enc', 'xat_uuid16', 'xat_u32', 'xat_jwk_punt', 'xat_copia_forma']) {
      const f = funcio(CODI, 'private', nom);
      expect(f.capcalera, nom).toMatch(/\bimmutable\b/);
      expect(f.capcalera, nom).not.toMatch(/security definer/);
    }
    for (const nom of ['xat_claus_usuari_immobil', 'xat_origen_admes', 'xat_ritme_claus_compta']) {
      expect(funcio(CODI, 'private', nom).capcalera, nom).toMatch(/security definer set search_path = ''/);
    }
  });

  test('un sol rellotge per crida: now() de la transacció una sola vegada (v_ara), mai clock_timestamp', () => {
    expect(unSolRellotge(CODI)).toBe(true);
    for (const nom of ['xat_publica_identitat', 'xat_desa_frase', 'xat_desa_llibreta', 'xat_canvia_rk']) {
      const f = funcio(CODI, 'public', nom);
      expect(f.cos, nom).toContain('v_ara timestamptz := now();');
      expect(f.cos, nom).not.toMatch(/\bnow\(\)\s*-\s*interval/);
    }
    for (const nom of ['xat_la_meua_identitat', 'xat_claus_de', 'xat_la_meua_llibreta']) expect(funcio(CODI, 'public', nom).cos, nom).not.toMatch(/\bnow\(\)/);
    expect(funcio(CODI, 'private', 'xat_ritme_claus_compta').cos).toMatch(/r\.al <= p_ara - interval '24 hours'/);
  });

  test('el base64url és canònic (tornar a codificar dona la mateixa cadena) i el JWK és estricte (4 claus, mai d)', () => {
    const b64 = funcio(CODI, 'private', 'xat_b64');
    expect(b64.cos).toContain("p !~ '^[A-Za-z0-9_-]+$' or length(p) % 4 = 1");
    expect(b64.cos).toContain("rtrim(translate(encode(v, 'base64'), E'+/\\n', '-_'), '=') <> p");
    expect(b64.cos).toContain('p_bytes is not null and octet_length(v) <> p_bytes');
    const jwk = funcio(CODI, 'private', 'xat_jwk_punt');
    expect(jwk.cos).toMatch(/\(select count\(\*\) from jsonb_object_keys\(p\)\) = 4\s+and p->>'kty' = 'EC' and p->>'crv' = 'P-256' and p \? 'x' and p \? 'y'/);
    expect(jwk.cos).toContain("'\\x04'::bytea || private.xat_b64(p->>'x', 32) || private.xat_b64(p->>'y', 32)");
    expect(jwk.cos).toMatch(/if jsonb_typeof\(p\) is distinct from 'object' then/);
  });
});

describe('E2EE-1a · les RPC: comparar-i-canviar, límits, oracle i llibreta', () => {
  const PUBLICA = funcio(CODI, 'public', 'xat_publica_identitat');
  const CANVIA = funcio(CODI, 'public', 'xat_canvia_rk');
  const LLIBRETA = funcio(CODI, 'public', 'xat_desa_llibreta');

  test('xat_publica_identitat: forma SDPK, kid recalculat, pany, fila activa for update i comparar-i-canviar (SDP-XAT-041) abans d’escriure', () => {
    const cos = PUBLICA.cos;
    expect(cos).toContain("substring(v_d from 1 for 5) <> '\\x5344504b01'::bytea");
    expect(cos).toContain('substring(v_d from 6 for 16) <> private.xat_uuid16(v_jo)');
    expect(cos).toContain("substring(v_d from 152 for 16) <> coalesce(v_ant, '\\x00000000000000000000000000000000'::bytea)");
    expect(cos).toContain("v_kid := substring(sha256('\\x5344504901'::bytea || private.xat_uuid16(v_jo) || v_sig || v_dh) from 1 for 16);");
    const ordre = ["private.xat_b64(p_declaracio, 175)", "perform private.xat_copia_forma(p_copia, array['ct', 'iv', 'rk_ct', 'rk_iv', 'sal', 'iteracions', 'llista']);",
      "perform pg_advisory_xact_lock(hashtextextended('xat:identitat:' || v_jo::text, 0));",
      'where k.usuari_id = v_jo and k.retirada_al is null for update;', 'if v_actiu = v_kid then',
      "if v_actiu is distinct from v_ant then\n    raise exception 'SDP-XAT-041:", "raise exception 'SDP-XAT-042:",
      'update public.xat_claus_usuari k set retirada_al = v_ara,', 'update public.xat_cercles_recuperacio c set retirat_al = v_ara',
      'insert into public.xat_claus_usuari (kid, usuari_id,'].map((marca) => cos.indexOf(marca));
    expect(ordre.every((pos) => pos > 0), JSON.stringify(ordre)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    expect(cos).toMatch(/SDP-XAT-041[^\n]*errcode = '40001'/);
    /* La IAIA mai publica cap clau. */
    expect(cos).toContain(`if v_jo = '${IAIA}'::uuid then`);
  });

  test('xat_publica_identitat: 5 cada 24 h; sense continuïtat, 1 cada 24 h i 3 cada 30 dies; la retirada buida la còpia', () => {
    const cos = normal(PUBLICA.cos);
    expect(cos).toContain(normal("where k.usuari_id = v_jo and k.creat_al > v_ara - interval '24 hours') >= 5"));
    expect(cos).toContain(normal("and k.kid_anterior is not null and k.firma_continuitat is null and k.creat_al > v_ara - interval '24 hours') >= 1"));
    expect(cos).toContain(normal("and k.kid_anterior is not null and k.firma_continuitat is null and k.creat_al > v_ara - interval '30 days') >= 3"));
    expect(cos).toContain(normal(`update public.xat_claus_usuari k set retirada_al = v_ara,
      backup_privat_ct = null, backup_iv = null, backup_rk_ct = null, backup_rk_iv = null,
      backup_sal = null, backup_kdf = null, backup_iteracions = null, backup_llista = null, backup_al = null
      where k.usuari_id = v_jo and k.retirada_al is null;`));
  });

  test('esmena R9: un kid nou o una RK nova retiren el cercle vigent, n’esborren els avals i tanquen les peticions obertes', () => {
    for (const f of [PUBLICA, CANVIA]) {
      const cos = normal(f.cos);
      expect(cos, f.nom).toContain(normal(`update public.xat_cercles_recuperacio c set retirat_al = v_ara
        where c.usuari_id = v_jo and c.retirat_al is null returning c.repartiment_id into v_repartiment;`));
      expect(cos, f.nom).toContain(normal('delete from public.xat_avals_recuperacio a where a.usuari_id = v_jo and a.repartiment_id = v_repartiment;'));
      expect(cos, f.nom).toContain(normal(`update public.xat_peticions_recuperacio p set estat = 'caducada', tancat_al = v_ara
        where p.usuari_id = v_jo and p.repartiment_id = v_repartiment and p.estat = 'oberta';`));
    }
  });

  test('xat_canvia_rk (R3, E2EE-I03): comparar-i-canviar sobre el SHA-256 de la còpia viva (SDP-XAT-046), còpia i llibreta en la mateixa transacció', () => {
    const cos = CANVIA.cos;
    const ordre = ['v_hash := private.xat_b64(p_hash_copia, 32);', "perform pg_advisory_xact_lock(hashtextextended('xat:identitat:' || v_jo::text, 0));",
      'select k.backup_privat_ct into v_viva from public.xat_claus_usuari k', 'for update;',
      "if v_viva is null or sha256(v_viva) <> v_hash then\n    raise exception 'SDP-XAT-046:", "perform private.xat_ritme_claus_compta(v_jo, 'rk', v_ara, 10);",
      "raise exception 'SDP-XAT-044:", 'update public.xat_claus_usuari k', 'set backup_privat_ct = v_ct,', 'insert into public.xat_llibretes',
      'update public.xat_cercles_recuperacio c set retirat_al = v_ara', 'return query select private.xat_b64_enc(sha256(v_ct)), v_comptador;']
      .map((marca) => cos.indexOf(marca));
    expect(ordre.every((pos) => pos > 0), JSON.stringify(ordre)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    expect(cos).toMatch(/SDP-XAT-046[^\n]*errcode = '40001'/);
    expect(cos).toContain("private.xat_b64(p_llibreta->>'kid', 16) <> v_kid");
    expect(cos).toContain("not (p_llibreta ?& array['comptador', 'kid', 'iv', 'ct', 'firma'])");
  });

  test('la llibreta: comptador estrictament creixent (SDP-XAT-044, reintentable), firmada per la clau activa, upsert d’una sola fila', () => {
    for (const f of [LLIBRETA, CANVIA]) {
      expect(f.cos, f.nom).toMatch(/select l\.comptador into v_actual from public\.xat_llibretes l where l\.usuari_id = v_jo for update;\s+if found and v_actual >= (p_comptador|v_comptador) then\s+raise exception 'SDP-XAT-044:[^\n]*errcode = '40001'/);
      expect(f.cos, f.nom).toMatch(/on conflict \(usuari_id\) do update\s+set kid = excluded\.kid, comptador = excluded\.comptador, iv = excluded\.iv, ct = excluded\.ct,\s+firma = excluded\.firma, actualitzat_al = excluded\.actualitzat_al;/);
    }
    expect(LLIBRETA.cos).toMatch(/where k\.usuari_id = v_jo and k\.kid = v_kid and k\.retirada_al is null for share;\s+if not found then\s+raise exception 'SDP-XAT-033:/);
    expect(LLIBRETA.cos).toContain('if p_comptador is null or p_comptador < 1 or');
    expect(LLIBRETA.cos).toContain('if octet_length(v_ct) not between 32 and 262144 then');
  });

  test('xat_desa_frase: només l’activa pròpia (SDP-XAT-033), 10 cada 24 h i només l’embolcall de la frase', () => {
    const cos = funcio(CODI, 'public', 'xat_desa_frase').cos;
    expect(cos).toContain("perform private.xat_copia_forma(p_frase, array['rk_ct', 'rk_iv', 'sal', 'iteracions', 'llista']);");
    expect(cos).toMatch(/where k\.usuari_id = v_jo and k\.kid = v_kid and k\.retirada_al is null for update;\s+if not found then\s+raise exception 'SDP-XAT-033:/);
    expect(cos).toContain("perform private.xat_ritme_claus_compta(v_jo, 'frase', v_ara, 10);");
    expect(cos).not.toMatch(/backup_privat_ct|backup_iv\b/);
    expect(funcio(CODI, 'private', 'xat_ritme_claus_compta').cos).toMatch(/if v_n >= p_maxim then\s+raise exception 'SDP-XAT-042:[^\n]*errcode = '42900'/);
    expect(taula(CODI, 'private', 'xat_ritme_claus')).toMatch(/accio in \('frase', 'rk'\)/);
  });

  test('xat_claus_de: d’1 a 256, sense còpies, només de qui compartix un fil (es_participant) i sense cap oracle', () => {
    const f = funcio(CODI, 'public', 'xat_claus_de');
    expect(f.cos).toContain('if p_usuaris is null or cardinality(p_usuaris) not between 1 and 256 then');
    expect(normal(f.cos)).toContain(normal(`and (k.usuari_id = v_jo or exists (
      select 1 from public.xat_participants jo
      join public.xat_participants ell on ell.fil_id = jo.fil_id and ell.usuari_id = k.usuari_id
      where jo.usuari_id = v_jo and private.es_participant(jo.fil_id)))`));
    expect(f.cos).not.toMatch(/backup_/);
    /* Cap missatge no diu res d'una altra persona: només sessió, origen i paràmetre. */
    expect([...f.cos.matchAll(/SDP-XAT-\d{3}/g)].map((m) => m[0]).sort()).toEqual(['SDP-XAT-001', 'SDP-XAT-009', 'SDP-XAT-045']);
    expect(f.cos).not.toMatch(/no existix|no té clau|no hi ha cap persona/i);
    const meua = funcio(CODI, 'public', 'xat_la_meua_identitat').cos;
    expect(meua).toMatch(/case when k\.retirada_al is null and k\.backup_privat_ct is not null then jsonb_build_object\(/);
    expect(meua).toContain('where k.usuari_id = v_jo');
  });

  test('els orígens admesos són exactament els tres i la comprovació llig l’Origin de request.headers', () => {
    const insercio = /insert into private\.xat_origens_xifrat \(origen\)\s+values \(([^;]*)\)\s+on conflict do nothing;/.exec(CODI);
    expect(insercio).toBeTruthy();
    expect([...insercio[1].matchAll(/'([^']+)'/g)].map((m) => m[1])).toEqual(ORIGENS);
    const f = funcio(CODI, 'private', 'xat_origen_admes');
    expect(f.cos).toContain("v_h := nullif(current_setting('request.headers', true), '')::jsonb;");
    expect(f.cos).toMatch(/exception when others then\s+return false;/);
    expect(f.cos).toContain("where o.origen = v_h ->> 'origin'");
    for (const origen of ORIGENS) expect(CAPCALERA).toContain(origen);
  });

  test('els codis són una llista tancada, documentada a CODIS, amb els errcodes del contracte', () => {
    const usats = [...new Set([...CODI.matchAll(/SDP-XAT-\d{3}/g)].map((m) => m[0]))].sort();
    expect(usats).toEqual([...CODIS]);
    const codis = CAPCALERA.slice(CAPCALERA.indexOf('-- CODIS'), CAPCALERA.indexOf('-- Depén de:'));
    for (const codi of usats) expect(codis, codi).toContain(codi);
    for (const [codi, errcode] of [['001', '42501'], ['009', '22023'], ['033', '42501'], ['040', '22023'], ['041', '40001'], ['042', '42900'],
      ['043', '22023'], ['044', '40001'], ['045', '42501'], ['046', '40001']]) {
      const raises = [...CODI.matchAll(new RegExp(`raise exception 'SDP-XAT-${codi}:[^\\n]*`, 'g'))];
      expect(raises.length, codi).toBeGreaterThan(0);
      for (const m of raises) expect(m[0], codi).toContain(`errcode = '${errcode}'`);
    }
    /* 030..039 són d'E2EE-1b/1c (llevat de 033 i 038): cap no s'avança. */
    expect(usats.filter((c) => /SDP-XAT-03\d/.test(c))).toEqual(['SDP-XAT-033', 'SDP-XAT-038']);
  });
});

describe('E2EE-1a · el que no fa, la inversa i el README', () => {
  test('no toca xat_envia ni cap taula de missatges, fils, adjunts ni Storage; cap drop fora del disparador propi', () => {
    expect(CODI).not.toMatch(/xat_envia\b|xat_missatges\b|storage\.|xat_fils_meus|xat_historial|xat_nous/);
    expect(CODI).not.toMatch(/alter table public\.(xat_fils|xat_missatges|xat_adjunts|xat_participants|profiles)\b/);
    expect(CODI).not.toMatch(/\bdrop (function|table|index|policy)\b/);
    expect((CODI.match(/\bdrop trigger if exists/g) || []).length).toBe(1);
    /* Cap UUID literal fora de la identitat de la IAIA. */
    expect(CODI.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi).every((u) => u === IAIA)).toBe(true);
  });

  test('la inversa és un bloc comentat, dins d’una transacció, i esborra exactament els objectes que es creen', () => {
    expect(INVERSA[0]).toBe('begin;');
    expect(INVERSA.at(-2)).toBe("notify pgrst, 'reload schema';");
    expect(INVERSA.at(-1)).toBe('commit;');
    expect(inversaExacta(SQL, CODI)).toBe(true);
    /* Filles abans que mares, i les ajudes de codificació (que els CHECK usen) al final. */
    const taules = dropsDe(INVERSA, 'table');
    expect(taules.indexOf('public.xat_alliberaments_recuperacio')).toBeLessThan(taules.indexOf('public.xat_verificacions_recuperacio'));
    expect(taules.indexOf('public.xat_verificacions_recuperacio')).toBeLessThan(taules.indexOf('public.xat_peticions_recuperacio'));
    expect(taules.indexOf('public.xat_peticions_recuperacio')).toBeLessThan(taules.indexOf('public.xat_cercles_recuperacio'));
    expect(taules.indexOf('public.xat_avals_recuperacio')).toBeLessThan(taules.indexOf('public.xat_cercles_recuperacio'));
    const ultimaTaula = INVERSA.findLastIndex((l) => l.startsWith('drop table'));
    for (const ajuda of ['xat_b64', 'xat_uuid16', 'xat_jwk_punt']) {
      expect(INVERSA.findIndex((l) => l.includes(`private.${ajuda}(`)), ajuda).toBeGreaterThan(ultimaTaula);
    }
    expect(SQL.slice(SQL.indexOf('-- INVERSA'))).toContain('decisió\n-- del Mestre, no d\'un agent');
  });

  test('supabase/README.md la nomena després de 2610282100 i abans de seed.sql, NO aplicada', () => {
    const posicio = README.indexOf(`migrations/${NOM}`);
    expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610282100_usuari_i_poble_canonic.sql'));
    expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
    const entrada = README.slice(posicio).split('\n\n')[0];
    expect(entrada).toContain("**NO aplicada: l'aplica el Mestre, mai un agent**");
    for (const marca of ['E2EE-1a', 'xat_claus_usuari', 'xat_llibretes', 'xat_cercles_recuperacio', 'SDP-XAT-041', 'SDP-XAT-044', 'SDP-XAT-046',
      'xatE2ee.migracio.test.js', 'xat_envia', 'https://socdepoble.org', 'capacitor://localhost', 'https://localhost']) {
      expect(entrada, marca).toContain(marca);
    }
    expect(entrada.toLowerCase()).not.toContain(PARAULA_VETADA);
  });
});

describe('E2EE-1a · sondes: els detectors veuen una variant dolenta', () => {
  test('una funció sense search_path buit', () => {
    expect(totesAmbSearchPath(muta(CODI, "language sql immutable set search_path = '' as $$\n  select rtrim(", 'language sql immutable as $$\n  select rtrim('))).toBe(false);
  });

  test('una taula sense RLS', () => {
    expect(totesLesTaulesAmbRls(muta(CODI, 'alter table public.xat_llibretes enable row level security;', ''))).toBe(false);
  });

  test('un segon rellotge o clock_timestamp', () => {
    expect(unSolRellotge(muta(CODI, 'backup_al = v_ara\n   where k.usuari_id = v_jo and k.kid = v_kid and k.retirada_al is null;\n  return true;', 'backup_al = now()\n   where k.usuari_id = v_jo and k.kid = v_kid and k.retirada_al is null;\n  return true;'))).toBe(false);
    expect(unSolRellotge(muta(CODI, 'v_ara timestamptz := now();', 'v_ara timestamptz := clock_timestamp();'))).toBe(false);
  });

  test('una inversa que oblida una taula o una funció', () => {
    expect(inversaExacta(muta(SQL, '-- drop table if exists public.xat_llibretes;\n', ''), CODI)).toBe(false);
    expect(inversaExacta(muta(SQL, '-- drop function if exists private.xat_u32(bytea, integer);\n', ''), CODI)).toBe(false);
  });

  test('un cercle sense l’índex únic del vigent', () => {
    expect(cercleVigentUnic(muta(CODI, 'create unique index if not exists xat_cercles_recuperacio_vigent', 'create index if not exists xat_cercles_recuperacio_vigent'))).toBe(false);
  });
});
