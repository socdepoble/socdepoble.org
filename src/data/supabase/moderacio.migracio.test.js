/* Fase D (261020, tasca 2; pla 261020_1300) · Prova estàtica de la migració
   2610201500_moderacio_denuncies_i_bloquejos.sql. No hi ha cap base de
   dades: es llig el SQL i es comproven la capçalera (NO aplicada, l'aplica el
   Mestre, va ABANS del client), la transacció, la RLS, els quatre permisos del
   mandat Supabase 30-Oct-2026 al peu de la lletra i cap altre, les llistes
   blanques contra el contracte, les polítiques, les funcions i les RPC que
   crida l'adaptador moderacio.js, i l'entrada de supabase/README.md. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import {
  MAXIM_DETALL_DENUNCIA, MAXIM_NOM_BLOQUEJAT, MOTIUS_DENUNCIA, TIPUS_BLOQUEJAT, TIPUS_OBJECTE_DENUNCIA, VERSIO_NORMES_CONVIVENCIA
} from '../contracte.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610201500_moderacio_denuncies_i_bloquejos.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/moderacio.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const LINIES = SQL.split('\n');

const GRANTS_DEL_MANDAT = [
  'grant select, insert on public.denuncies to authenticated;',
  'grant insert on public.denuncies to anon;',
  'grant select, insert, delete on public.bloquejos to authenticated;',
  'grant select, insert, update, delete on public.denuncies, public.bloquejos to service_role;'
];

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
const funcio = (esquema, nom) => FUNCIONS.find((f) => f.esquema === esquema && f.nom === nom);
/* La llista d'un `check (columna in ('a', 'b'))`, en ordre. */
const llistaDelCheck = (columna) => {
  const m = new RegExp(`check \\(${columna} in \\(([^)]*)\\)\\)`, 'i').exec(CODI);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : null;
};

test('el nom segueix el format de les migracions i va després de l’última aplicable (2610181915)', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610181915_organitzacions_correu_i_membres.sql'));
});

test('la capçalera: pla, NO aplicada, l’aplica el Mestre i va ABANS del client, cada frase en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261020_1500 · Fase D \(Tasca 2\)/);
  expect(CAPCALERA).toMatch(/pla 261020_1300/);
  expect(CAPCALERA).toMatch(/NO aplicada/);
  expect(LINIES.filter((l) => /L'aplica el Mestre, mai un agent/.test(l))).toHaveLength(1);
  expect(LINIES.filter((l) => /ABANS de publicar el client/.test(l))).toHaveLength(1);
});

test('els codis SDP-MOD-000…005 i 429 són a la capçalera i al codi', () => {
  for (const codi of ['000', '001', '002', '003', '004', '005', '429']) {
    expect(CAPCALERA, `capçalera SDP-MOD-${codi}`).toContain(`SDP-MOD-${codi}`);
    expect(CODI, `codi SDP-MOD-${codi}`).toContain(`SDP-MOD-${codi}`);
  }
  expect(CODI).toMatch(/SDP-MOD-429[^;]*errcode = '42900'/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
});

test('les dues taules tenen la RLS activa', () => {
  expect(CODI).toContain('alter table public.denuncies enable row level security;');
  expect(CODI).toContain('alter table public.bloquejos enable row level security;');
  expect(CODI).toContain('alter table private.normes_acceptades enable row level security;');
});

test('els quatre permisos del mandat, al peu de la lletra, després de revocar-ho tot; cap altre permís de taula', () => {
  const revocaDenuncies = CODI.indexOf('revoke all on table public.denuncies from public, anon, authenticated, service_role;');
  const revocaBloquejos = CODI.indexOf('revoke all on table public.bloquejos from public, anon, authenticated, service_role;');
  expect(revocaDenuncies).toBeGreaterThan(0);
  expect(revocaBloquejos).toBeGreaterThan(0);
  for (const linia of GRANTS_DEL_MANDAT) {
    expect(CODI.split('\n').filter((l) => l.trim() === linia), linia).toHaveLength(1);
    expect(CODI.indexOf(linia)).toBeGreaterThan(Math.max(revocaDenuncies, revocaBloquejos));
  }
  const grantsDeTaula = [...CODI.matchAll(/^\s*grant\b[^;]*\bon\b(?!\s+function)[^;]*;/gim)].map((m) => m[0].trim());
  expect(grantsDeTaula.filter((g) => /public\.(denuncies|bloquejos)/.test(g)).sort()).toEqual([...GRANTS_DEL_MANDAT].sort());
  expect(CODI).toContain('revoke all on table private.normes_acceptades from public, anon, authenticated;');
});

test('les llistes blanques dels CHECK són les del contracte', () => {
  expect(llistaDelCheck('objecte_tipus')).toEqual([...TIPUS_OBJECTE_DENUNCIA]);
  expect(llistaDelCheck('motiu')).toEqual([...MOTIUS_DENUNCIA]);
  expect(llistaDelCheck('bloquejat_tipus')).toEqual([...TIPUS_BLOQUEJAT]);
  expect(CODI).toContain(`check (detall is null or char_length(detall) <= ${MAXIM_DETALL_DENUNCIA})`);
  expect(CODI).toContain(`check (nom is null or char_length(nom) <= ${MAXIM_NOM_BLOQUEJAT})`);
  expect(CODI).toContain("check (char_length(objecte_id) between 1 and 200 and objecte_id ~ '^[A-Za-z0-9._:~-]+$')");
  /* La versió vigent del client passa el CHECK de private.normes_acceptades. */
  expect(CODI).toContain("check (versio ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')");
  expect(VERSIO_NORMES_CONVIVENCIA).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
});

test('les claus foranes: qui denuncia es queda en null; bloquejador i bloquejats, en cascada', () => {
  expect(SENSE_ESPAIS(CODI)).toContain('denunciant uuid references auth.users (id) on delete set null');
  expect(SENSE_ESPAIS(CODI)).toContain('bloquejador uuid not null default auth.uid() references auth.users (id) on delete cascade');
  expect(SENSE_ESPAIS(CODI)).toContain('bloquejat_persona uuid references auth.users (id) on delete cascade');
  expect(SENSE_ESPAIS(CODI)).toContain('bloquejat_entitat uuid references public.organizations (id) on delete cascade');
});

test('les polítiques: noms, accions i rols; cap using (true) ni with check (true); la superadmin només amb coalesce', () => {
  const politiques = [...CODI.matchAll(/create policy "([^"]+)" on (public\.\w+)\s+for (\w+) to ([\w, ]+)\n/g)]
    .map((m) => [m[1], m[2], m[3], m[4].trim()]);
  expect(politiques).toEqual([
    ['denuncies: qualsevol en pot enviar', 'public.denuncies', 'insert', 'anon, authenticated'],
    ['denuncies: cadascu llig les seues', 'public.denuncies', 'select', 'authenticated'],
    ['bloquejos: cadascu veu els seus', 'public.bloquejos', 'select', 'authenticated'],
    ['bloquejos: cadascu afig els seus', 'public.bloquejos', 'insert', 'authenticated'],
    ['bloquejos: cadascu lleva els seus', 'public.bloquejos', 'delete', 'authenticated']
  ]);
  expect(CODI).not.toMatch(/using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i);
  expect(CODI).toContain('coalesce((select private.es_superadmin()), false)');
});

test('les funcions: cada SECURITY DEFINER té el search_path buit i les privades no les crida cap client', () => {
  const definidores = FUNCIONS.filter((f) => /security definer/.test(f.capcalera));
  expect(definidores.map((f) => `${f.esquema}.${f.nom}`).sort()).toEqual([
    'private.bloquejos_abans_insercio', 'private.denuncies_abans_insercio', 'private.empremta_ip_moderacio',
    'public.accepta_normes_convivencia', 'public.estat_normes_convivencia'
  ]);
  for (const f of definidores) expect(f.capcalera, f.nom).toContain("set search_path = ''");
  for (const nom of ['empremta_ip_moderacio', 'denuncies_abans_insercio', 'bloquejos_abans_insercio']) {
    expect(CODI).toContain(`revoke execute on function private.${nom}() from public, anon, authenticated;`);
  }
});

test('les RPC: denuncia_contingut és SECURITY INVOKER per a anon i authenticated; les de les normes, només authenticated', () => {
  const denuncia = funcio('public', 'denuncia_contingut');
  expect(denuncia.capcalera).toContain('security invoker');
  expect(denuncia.capcalera).toContain("set search_path = ''");
  expect(denuncia.params).toBe('p_objecte_tipus text, p_objecte_id text, p_motiu text, p_detall text default null, p_autor_tipus text default null, '
    + 'p_autor_id text default null, p_fil_id uuid default null, p_tenant_id uuid default null');
  expect(CODI).toContain('revoke execute on function public.denuncia_contingut(text, text, text, text, text, text, uuid, uuid) from public;');
  expect(CODI).toContain('grant execute on function public.denuncia_contingut(text, text, text, text, text, text, uuid, uuid) to anon, authenticated;');
  expect(funcio('public', 'estat_normes_convivencia').params).toBe('p_versio text');
  expect(funcio('public', 'accepta_normes_convivencia').params).toBe('p_versio text');
  for (const nom of ['accepta_normes_convivencia', 'estat_normes_convivencia']) {
    expect(CODI).toContain(`revoke execute on function public.${nom}(text) from public, anon;`);
    expect(CODI).toContain(`grant execute on function public.${nom}(text) to authenticated;`);
  }
});

test('l’adaptador crida les RPC i les columnes d’esta migració, amb els mateixos noms', () => {
  expect(CLIENT).toContain("rpc('denuncia_contingut'");
  expect(CLIENT).toContain("rpc('estat_normes_convivencia'");
  expect(CLIENT).toContain("rpc('accepta_normes_convivencia'");
  for (const parametre of ['p_objecte_tipus', 'p_objecte_id', 'p_motiu', 'p_detall', 'p_autor_tipus', 'p_autor_id', 'p_fil_id', 'p_tenant_id', 'p_versio']) {
    expect(CLIENT, parametre).toContain(`${parametre}:`);
    expect(CODI, parametre).toContain(parametre);
  }
  expect(CLIENT).toContain('/rest/v1/bloquejos');
  for (const columna of ['bloquejat_tipus', 'bloquejat_persona', 'bloquejat_entitat', 'nom', 'creat_al', 'bloquejador']) {
    expect(CODI, columna).toMatch(new RegExp(`\\b${columna}\\b`));
  }
});

test('el catàleg supabase/README.md la nomena després de 2610181800 i abans de seed.sql, NO aplicada, en un sol paràgraf', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610181800_perfil_public_per_defecte.sql'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/Pla 261020_1300 \(Tasca 2/);
  expect(entrada).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*/);
  expect(entrada).toMatch(/va ABANS de publicar el client/);
  expect(entrada).toMatch(/no depén de cap\s+altra pendent/i);
  expect(entrada).toContain("select id, objecte_tipus, objecte_id, motiu, creat_al from public.denuncies where estat = 'pendent' order by creat_al;");
  for (const linia of GRANTS_DEL_MANDAT) expect(entrada, linia).toContain(linia);
  /* Fase D (261020, revisió) · El sostre anònim, el /64, la porta de les normes i el compromís, també al catàleg. */
  expect(SENSE_ESPAIS(entrada)).toContain('on una ipv6 compta per la seua /64');
  expect(SENSE_ESPAIS(entrada)).toContain('un sostre comú de 300/hora entre totes les anònimes');
  expect(SENSE_ESPAIS(entrada)).toContain('només una versió que siga una data real i no futura al calendari de madrid, i 20 versions per persona com a molt');
  expect(SENSE_ESPAIS(entrada)).toContain('qui inunda pot gastar el sostre comú d\'una hora');
  expect(SENSE_ESPAIS(entrada)).toContain('llevar del tot la denúncia anònima és decisió del mestre');
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
});

test('Fase D (261020, revisió) · el sostre comú de les anònimes: 300/hora sota un sol pany, amb el seu índex parcial, abans del compte per IP', () => {
  const cos = funcio('private', 'denuncies_abans_insercio').cos;
  const branca = cos.slice(cos.search(/^\s*else\s*$/m));
  const pany = branca.indexOf("perform pg_advisory_xact_lock(hashtextextended('denuncies:anon-global', 0));");
  const total = branca.search(/select count\(\*\) into v_total from public\.denuncies d\s+where d\.denunciant is null and d\.creat_al > now\(\) - interval '1 hour';/);
  const sostre = branca.search(/if v_total >= 300 then\s+raise exception 'SDP-MOD-429: [^']+' using errcode = '42900';/);
  const perIp = branca.indexOf('d.ip_hash is not distinct from v_ip');
  expect(pany, 'el pany comú, a la branca anònima').toBeGreaterThan(0);
  expect(total, 'el compte de totes les anònimes, sota el pany').toBeGreaterThan(pany);
  expect(sostre, 'el sostre, després del compte').toBeGreaterThan(total);
  expect(perIp, 'el compte per IP continua, després del sostre').toBeGreaterThan(sostre);
  expect(cos).toMatch(/v_maxim := case when v_ip is null then 50 else 10 end;/);
  /* La branca de la sessió no passa pel pany comú. */
  expect(cos.slice(0, cos.search(/^\s*else\s*$/m))).not.toContain('anon-global');
  expect(CODI).toContain('create index if not exists idx_denuncies_anon_creat on public.denuncies (creat_al desc) where denunciant is null;');
  const prosa = SENSE_ESPAIS(CAPCALERA.replace(/^--/gm, ''));
  expect(prosa).toContain('300/hora entre totes les anònimes (el sostre comú)');
  expect(prosa).toContain('una ipv6 compta per la seua /64');
  expect(CAPCALERA).toMatch(/^-- Fase D \(261020, revisió\) · EL SOSTRE ANÒNIM, I QUÈ COSTA:$/m);
  expect(prosa).toContain('qui inunda pot gastar el sostre comú d\'una hora');
  expect(prosa).toContain('llevar del tot la denúncia anònima és decisió del mestre.');
});

test('Fase D (261020, revisió) · l’empremta d’IP: una IPv6 compta per la seua /64, una IPv4 per l’adreça, i el que no es llig es queda com venia', () => {
  const f = funcio('private', 'empremta_ip_moderacio');
  const cos = SENSE_ESPAIS(f.cos);
  /* La capçalera es llig dins del cos: un error a la declaració no l'agafaria l'excepció del bloc. */
  expect(f.cos.split(/^begin$/m)[0]).not.toContain('capcalera_client');
  expect(cos).toContain("v_crua := private.capcalera_client('ip'); if v_crua is null then return null; end if;");
  expect(cos).toContain("begin v_ip := v_crua::inet; v_clau := case when family(v_ip) = 6 and not (v_ip <<= '::ffff:0.0.0.0/96'::inet) "
    + "then host(network(set_masklen(v_ip, 64))) || '/64' else host(v_ip) end; exception when others then v_clau := v_crua; end;");
  expect(cos).toContain("return private.hash_subjecte('ip:' || v_clau); exception when undefined_function or undefined_table then return null; end;");
  expect(cos).not.toContain("'ip:' || private.capcalera_client");
});

test('Fase D (261020, revisió) · accepta_normes_convivencia: una data real que no siga futura, i 20 versions per persona sota el seu pany', () => {
  const cos = SENSE_ESPAIS(funcio('public', 'accepta_normes_convivencia').cos);
  const forma = cos.indexOf("if p_versio is null or p_versio !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'sdp-mod-005:");
  const data = cos.indexOf('begin v_data := p_versio::date; exception when invalid_datetime_format or datetime_field_overflow then v_data := null; end;');
  const futura = cos.search(/if v_data is null or v_data > \(now\(\) at time zone 'europe\/madrid'\)::date then raise exception 'sdp-mod-005: [^']+' using errcode = '22023';/);
  const pany = cos.indexOf("perform pg_advisory_xact_lock(hashtextextended('normes:' || v_jo::text, 0));");
  const sostre = cos.search(/if not exists \(select 1 from private\.normes_acceptades n where n\.usuari_id = v_jo and n\.versio = p_versio\) then select count\(\*\) into v_n from private\.normes_acceptades n where n\.usuari_id = v_jo; if v_n >= 20 then raise exception 'sdp-mod-429: [^']+' using errcode = '42900';/);
  const insercio = cos.indexOf('insert into private.normes_acceptades (usuari_id, versio, ip_hash)');
  expect(forma, 'la forma').toBeGreaterThan(0);
  expect(data, 'la data real, després de la forma').toBeGreaterThan(forma);
  expect(futura, 'ni futura, després de la data').toBeGreaterThan(data);
  expect(pany, 'el pany de la persona').toBeGreaterThan(futura);
  expect(sostre, 'les 20 versions, sota el pany').toBeGreaterThan(pany);
  expect(insercio, 'la inserció, després de les portes').toBeGreaterThan(sostre);
  /* La versió vigent del client és una data real (la porta del servidor la deixa passar). */
  expect(new Date(`${VERSIO_NORMES_CONVIVENCIA}T00:00:00Z`).toISOString().slice(0, 10)).toBe(VERSIO_NORMES_CONVIVENCIA);
  expect(CAPCALERA).toMatch(/SDP-MOD-005 la versió de les normes no és vàlida, no és una data o és futura \(22023\)/);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
});
