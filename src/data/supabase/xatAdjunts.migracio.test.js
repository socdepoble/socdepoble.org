/* Gauntlet 261022_0225 (crítica Claude) · Prova estàtica de la migració
   2610220240_xat_adjunts_i_quota.sql. No hi ha cap base de dades: es llig el
   SQL i es comproven la capçalera (NO aplicada, l'aplica el Mestre, va ABANS
   del client), la transacció, el disparador que només valida l'escriptura
   final de Storage (F1 i revisió R1), la sonda i la publicació contra el flux
   real de storage-api, l'objecte orfe (F2), els sostres de pendents i
   freqüència (F3, R4 i R5), la neteja (F4) i els binaris a la cua dins de la
   quota (R2), les cerques per clau primària (F5), cap llistat del bucket (R6),
   els permisos del mandat Supabase 30-Oct-2026 (F10), el sostre per tipus i la
   llista MIME contra el client (F12, F14 i R7), el peu null i ultim_tipus a
   xat_fils_meus (F13 i R3), les RPC i la pujada de cos cru de l'adaptador (R8)
   i l'entrada de supabase/README.md (F7). El flux amb Storage de veres el
   prova tests/xat-multimedia-postgres.audit.mjs. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { MIME_XAT, QUOTA_XAT_BYTES } from '../xatMultimedia.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610220240_xat_adjunts_i_quota.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/xatMultimedia.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = senseComentaris(SQL);
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const LINIES = SQL.split('\n');
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const GRANT_SERVEI = 'grant select, delete on table public.xat_adjunts to service_role;';

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
const funcio = (esquema, nom) => {
  const f = FUNCIONS.find((x) => x.esquema === esquema && x.nom === nom);
  expect(f, `${esquema}.${nom}`).toBeTruthy();
  return f;
};
const cos = (esquema, nom) => SENSE_ESPAIS(funcio(esquema, nom).cos);

test('el nom segueix el format de les migracions i va després de l’última del catàleg (2610211715)', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610211715_revoca_correu_organitzacions.sql'));
});

test('la capçalera: Gauntlet 261022_0225, NO aplicada, l’aplica el Mestre i va ABANS del client, cada frase en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261022_0240 · Gauntlet 261022_0225 \(Tasca 3\)/);
  expect(CAPCALERA).toContain('Gauntlet 261022_0225 (crítica');
  expect(LINIES.filter((l) => /^-- NO aplicada/.test(l))).toHaveLength(1);
  expect(LINIES.filter((l) => /L'aplica el Mestre, mai un agent/.test(l))).toHaveLength(1);
  expect(LINIES.filter((l) => /ABANS de publicar el client/.test(l))).toHaveLength(1);
  for (const prerequisit of ['2609261500', '2609270200', '2609272200', '2610081543']) expect(CAPCALERA, prerequisit).toContain(prerequisit);
});

test('els codis de la capçalera són els del codi', () => {
  for (const codi of ['001', '006', '008', '009', '011', '020', '021', '022', '429']) {
    expect(CAPCALERA, `capçalera ${codi}`).toMatch(new RegExp(`\\b${codi}\\b`));
    expect(CODI, `codi SDP-XAT-${codi}`).toContain(`SDP-XAT-${codi}`);
  }
  expect(CODI).toMatch(/SDP-XAT-429[^;]*errcode = '42900'/);
  expect(CODI).toMatch(/SDP-XAT-022[^;]*errcode = '42900'/);
  expect(CODI).toMatch(/SDP-XAT-020[^;]*errcode = '23514'/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
});

test('F1 i R1 · un sol disparador sobre storage.objects, i només per a l’escriptura final (la sonda no porta size)', () => {
  expect(SQL).not.toContain('xat_valida_objecte');
  const disparadors = [...CODI.matchAll(/create trigger (\w+) (?:after|before) [\w ]+ on (\S+)/gi)].map((m) => [m[1], m[2]]);
  expect(disparadors).toEqual([['xat_adjunt_a_purga', 'public.xat_adjunts'], ['xat_escriptura_final', 'storage.objects']]);
  expect(CODI).toContain("create trigger xat_escriptura_final before insert or update on storage.objects\n  for each row when (new.bucket_id = 'xat_adjunts') execute function private.xat_escriptura_final();");
  const f = funcio('private', 'xat_escriptura_final');
  expect(f.capcalera).toContain('security definer');
  const c = SENSE_ESPAIS(f.cos);
  const sonda = c.indexOf("if not (coalesce(new.metadata, '{}'::jsonb) ? 'size') then return new; end if;");
  const pany = c.indexOf('select * into a from public.xat_adjunts where id = private.xat_id_de_ruta(new.name) for update;');
  const valida = c.indexOf('if not found or a.publicat or a.cancellant or new.owner_id is distinct from a.usuari_id::text '
    + "or lower(btrim(split_part(new.metadata->>'mimetype', ';', 1))) is distinct from a.mime "
    + "or (case when jsonb_typeof(new.metadata->'size') = 'number' then (new.metadata->>'size')::numeric <> a.bytes else true end) then "
    + "raise exception 'sdp-xat-021:");
  expect(sonda, 'la sonda passa sense tocar res').toBeGreaterThan(0);
  expect(pany).toBeGreaterThan(sonda);
  expect(valida).toBeGreaterThan(pany);
  expect(CODI).toContain('revoke all on function private.xat_escriptura_final() from public, anon, authenticated;');
});

test('F1 · la sonda: reserva pròpia i oberta de 15 minuts, POST o TUS, MIME sense paràmetres i Content-Length numèric exactes', () => {
  const f = funcio('private', 'xat_pujable_adjunt');
  expect(f.params).toBe('p_ruta text, p_metadata jsonb');
  const c = SENSE_ESPAIS(f.cos);
  expect(c).toContain('not a.publicat and not a.cancellant and a.usuari_id = (select auth.uid()) and private.es_participant(a.fil_id)');
  expect(c).toContain('a.id = private.xat_id_de_ruta(p_ruta)');
  expect(c).toContain("a.creat_al > now() - interval '15 minutes'");
  expect(c).toContain("storage.operation() in ('storage.object.upload', 'storage.tus.upload.create', 'storage.tus.upload.part')");
  expect(c).toContain("lower(btrim(split_part(p_metadata->>'mimetype', ';', 1))) = a.mime");
  expect(f.cos).toContain("case when jsonb_typeof(p_metadata->'contentLength') = 'number'\n      then (p_metadata->>'contentLength')::numeric = a.bytes else false end");
  expect(CODI).toContain("with check (bucket_id = 'xat_adjunts' and private.xat_pujable_adjunt(name, metadata));");
  expect(CODI).toContain("with check (bucket_id <> 'xat_adjunts' or private.xat_pujable_adjunt(name, metadata));");
});

test('F1 i F2 · la publicació valida l’escriptura final i la fixa: owner_id, created_at, mida i MIME; només es llig la versió publicada', () => {
  const c = cos('public', 'xat_publica_adjunt');
  const consulta = c.indexOf("select o.version into v_versio from storage.objects o where o.bucket_id = 'xat_adjunts' and o.name = p_id::text "
    + "and o.owner_id = v_jo::text and o.created_at >= a.creat_al and lower(btrim(split_part(o.metadata->>'mimetype', ';', 1))) = a.mime "
    + "and case when jsonb_typeof(o.metadata->'size') = 'number' then (o.metadata->>'size')::numeric = a.bytes else false end;");
  const falta = c.indexOf("if not found then raise exception 'sdp-xat-021: falta confirmar el fitxer.'");
  const envia = c.indexOf('perform public.xat_envia(p_id, a.fil_id,');
  const fixa = c.indexOf('update public.xat_adjunts set publicat = true, versio = v_versio where id = p_id;');
  expect(consulta, 'la consulta de l’objecte final').toBeGreaterThan(0);
  expect(falta).toBeGreaterThan(consulta);
  expect(envia).toBeGreaterThan(falta);
  expect(fixa).toBeGreaterThan(envia);
  expect(cos('private', 'xat_llegible_adjunt')).toContain("o.name = p_ruta and o.version is not distinct from a.versio");
  expect(CODI).toContain("create policy \"xat adjunts sense canvi\" on storage.objects as restrictive for update to authenticated\n  using (bucket_id <> 'xat_adjunts') with check (bucket_id <> 'xat_adjunts');");
});

test('F2 · un id amb objecte o a la cua de purga no es torna a reservar', () => {
  const c = cos('public', 'xat_reserva_adjunt');
  expect(c).toContain("or exists (select 1 from storage.objects where bucket_id = 'xat_adjunts' and name = p_id::text) "
    + "or exists (select 1 from private.purga_storage_pendent where bucket_id = 'xat_adjunts' and nom = p_id::text) then raise exception 'sdp-xat-008:");
});

test('F3, R4 i R5 · deu pendents (SDP-XAT-022) i seixanta adjunts vius reservats en l’última hora (SDP-XAT-429), sota el pany de la quota i abans d’inserir', () => {
  const c = cos('public', 'xat_reserva_adjunt');
  const pany = c.indexOf("perform pg_advisory_xact_lock(hashtextextended('xat:quota:' || v_jo::text, 0));");
  const compte = c.indexOf("select count(*) filter (where not publicat), count(*) filter (where creat_al > now() - interval '1 hour') into v_pendents, v_recents from public.xat_adjunts where usuari_id = v_jo;");
  const pendents = c.indexOf("if v_pendents >= 10 then raise exception 'sdp-xat-022:");
  const recents = c.indexOf("if v_recents >= 60 then raise exception 'sdp-xat-429:");
  const insercio = c.indexOf('insert into public.xat_adjunts(id, usuari_id, fil_id, bytes, mime, durada_ms)');
  expect(pany).toBeGreaterThan(0);
  expect(compte).toBeGreaterThan(pany);
  expect(pendents).toBeGreaterThan(compte);
  expect(recents).toBeGreaterThan(pendents);
  expect(insercio).toBeGreaterThan(recents);
  /* El reintent sense objecte renova la finestra de la sonda. */
  expect(c).toContain('if not a.publicat and not v_pujat then update public.xat_adjunts set creat_al = now() where id = p_id; end if;');
});

test('F4 · la neteja allibera caducats, esborrats, pendents vells i encua orfes; pg_cron la programa si hi és', () => {
  const f = funcio('private', 'xat_neteja_adjunts');
  expect(f.capcalera).toContain('security definer');
  const c = SENSE_ESPAIS(f.cos);
  expect(c).toContain("if not pg_try_advisory_xact_lock(hashtext('sdp-neteja-xat-adjunts')) then return 0; end if;");
  expect(c).toContain("c.creat_al < now() - interval '1 day'");
  expect(c).toContain("where c.publicat and (m.id is null or m.esborrat_al is not null or m.caduca_al <= now())");
  expect(c).toContain('insert into private.purga_storage_pendent(user_id, bucket_id, nom, referenciat)');
  expect(c).not.toMatch(/delete from storage\.objects/);
  expect(CODI).toContain("perform cron.schedule('sdp-neteja-xat-adjunts', '23 * * * *', $cron$select private.xat_neteja_adjunts(500)$cron$);");
  expect(CODI).toContain("raise notice 'SDP-XAT-903: pg_cron no està actiu; la neteja dels adjunts queda sense programar.';");
  expect(CODI).toContain('revoke all on function private.xat_neteja_adjunts(integer) from public, anon, authenticated;');
});

test('R2 · els binaris a la cua de purga encara a Storage compten en la quota de qui els va pujar, a la consulta i a la reserva', () => {
  const c = cos('private', 'xat_bytes_en_purga');
  expect(c).toContain('from private.purga_storage_pendent p join storage.objects o on o.bucket_id = p.bucket_id and o.name = p.nom');
  expect(c).toContain("where p.bucket_id = 'xat_adjunts' and p.user_id = p_usuari and p.feta_al is null;");
  expect(CODI).toContain('revoke all on function private.xat_bytes_en_purga(uuid) from public, anon, authenticated;');
  expect(CODI).toContain("create index purga_storage_pendent_xat_usuari on private.purga_storage_pendent(user_id)\n  where bucket_id = 'xat_adjunts' and feta_al is null;");
  expect(cos('public', 'xat_quota')).toContain('+ private.xat_bytes_en_purga((select auth.uid()))');
  const reserva = cos('public', 'xat_reserva_adjunt');
  const total = reserva.indexOf('select coalesce(sum(bytes), 0) + private.xat_bytes_en_purga(v_jo) into v_total from public.xat_adjunts where usuari_id = v_jo;');
  expect(total).toBeGreaterThan(reserva.indexOf("perform pg_advisory_xact_lock(hashtextextended('xat:quota:'"));
  expect(reserva.indexOf('if v_total + p_bytes > ')).toBeGreaterThan(total);
});

test('R3 · xat_fils_meus v5 és la v4 de 2609282100 sencera, més ultim_tipus al final', () => {
  const v4 = funcions(senseComentaris(readFileSync(path.join(MIGRACIONS, '2609282100_xat_de_pagina.sql'), 'utf8'))).find((f) => f.nom === 'xat_fils_meus');
  const v5 = funcio('public', 'xat_fils_meus');
  expect(v5.params).toBe(v4.params);
  expect(v5.capcalera).toBe(v4.capcalera.replace('rol text, participants integer )', 'rol text, participants integer, ultim_tipus text )'));
  expect(SENSE_ESPAIS(v5.cos)).toBe(SENSE_ESPAIS(v4.cos)
    .replace('where p.fil_id = f.id and p.visible_fins_seq is null) from public.xat_fils f', 'where p.fil_id = f.id and p.visible_fins_seq is null), u.tipus from public.xat_fils f')
    .replace('select m.text, m.creat_al, m.usuari_id from public.xat_missatges m', 'select m.text, m.creat_al, m.usuari_id, m.tipus from public.xat_missatges m'));
  expect(SENSE_ESPAIS(v5.cos)).not.toBe(SENSE_ESPAIS(v4.cos));
  expect(CODI).toContain('drop function if exists public.xat_fils_meus(uuid);\ncreate function public.xat_fils_meus(p_tenant_id uuid)');
  expect(CODI).toContain('revoke execute on function public.xat_fils_meus(uuid) from public, anon;\ngrant execute on function public.xat_fils_meus(uuid) to authenticated;');
  expect(CAPCALERA).toContain('2609282100');
});

test('R6 · cap llistat del bucket: les dues polítiques de lectura descarten les operacions de llista abans de cridar la funció', () => {
  const guarda = "coalesce(storage.operation(), '') not in ('storage.object.list', 'storage.object.list_v2', 'storage.s3.object.list')";
  const politiques = SENSE_ESPAIS(CODI);
  expect(politiques).toContain(`create policy "xat adjunts lectura" on storage.objects for select to authenticated using (bucket_id = 'xat_adjunts' and ${guarda} and private.xat_llegible_adjunt(name));`);
  expect(politiques).toContain(`create policy "xat adjunts frontera lectura" on storage.objects as restrictive for select to authenticated using (bucket_id <> 'xat_adjunts' or (${guarda} and private.xat_llegible_adjunt(name)));`);
});

test('F5 · les funcions de les polítiques cerquen per clau primària, amb l’uuid canònic, i hi ha els índexs', () => {
  for (const nom of ['xat_llegible_adjunt', 'xat_pujable_adjunt', 'xat_esborrable_adjunt']) {
    const c = cos('private', nom);
    expect(c, nom).toContain('a.id = private.xat_id_de_ruta(p_ruta)');
    expect(c, nom).not.toMatch(/p_ruta = a\.id::text|a\.id::text = p_ruta/);
  }
  expect(cos('private', 'xat_id_de_ruta')).toContain("p_ruta ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'");
  expect(CODI).toContain('create index xat_adjunts_usuari_creat on public.xat_adjunts(usuari_id, creat_al);');
  expect(CODI).toContain('create index xat_adjunts_fil on public.xat_adjunts(fil_id);');
  expect(CODI).toContain('create index xat_adjunts_pendents on public.xat_adjunts(creat_al) where not publicat;');
});

test('F10 · RLS activa, tot revocat a public, anon, authenticated i service_role i un sol permís explícit després', () => {
  expect(CODI).toContain('alter table public.xat_adjunts enable row level security;');
  const revoca = CODI.indexOf('revoke all on table public.xat_adjunts from public, anon, authenticated, service_role;');
  expect(revoca).toBeGreaterThan(0);
  expect(CODI.split('\n').filter((l) => l.trim() === GRANT_SERVEI)).toHaveLength(1);
  expect(CODI.indexOf(GRANT_SERVEI)).toBeGreaterThan(revoca);
  const grantsDeTaula = [...CODI.matchAll(/^\s*grant\b[^;]*\bon\b(?!\s+function)[^;]*;/gim)].map((m) => m[0].trim());
  expect(grantsDeTaula).toEqual([GRANT_SERVEI]);
});

test('F12, F14 i R7 · la llista MIME és la del client més el QuickTime; el bucket la repetix; sostre per tipus a la reserva i quota', () => {
  const llista = [...(/mime text not null check \(mime in \(([^)]*)\)\)/.exec(CODI)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  expect(new Set(llista)).toEqual(new Set([...Object.keys(MIME_XAT), 'video/quicktime']));
  const bucket = [...(/array\[([^\]]*)\]\)/.exec(CODI)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  expect(bucket).toEqual(llista);
  expect(CODI).toContain(`values ('xat_adjunts', 'xat_adjunts', false, ${QUOTA_XAT_BYTES},`);
  const sostre = cos('private', 'xat_maxim_adjunt');
  expect(sostre).toContain("when p_mime in ('image/webp', 'image/jpeg') then 2000000");
  expect(sostre).toContain("when p_mime in ('audio/mp4', 'audio/webm', 'audio/ogg') then 3000000");
  expect(sostre).toContain(`when p_mime in ('video/mp4', 'video/webm', 'video/quicktime') then ${QUOTA_XAT_BYTES}`);
  /* R7 · El CHECK no depén de cap funció: només els límits fixos, amb nom. */
  expect(CODI).toContain(`constraint xat_adjunts_mida check (bytes between 64 and ${QUOTA_XAT_BYTES}),`);
  const taula = CODI.slice(CODI.indexOf('create table public.xat_adjunts'), CODI.indexOf('create index xat_adjunts_usuari_creat'));
  expect(taula).not.toContain('xat_maxim_adjunt');
  const reserva = cos('public', 'xat_reserva_adjunt');
  expect(reserva).toContain('if p_bytes > private.xat_maxim_adjunt(p_mime) then raise exception');
  expect(reserva).toContain(`if v_total + p_bytes > ${QUOTA_XAT_BYTES} then raise exception 'sdp-xat-020:`);
});

test('F13 · sense peu, el missatge es desa amb text null: cap etiqueta en valencià al servidor', () => {
  const c = cos('public', 'xat_publica_adjunt');
  expect(c).toContain("v_peu text := nullif(btrim(p_text), '')");
  expect(c).toContain('update public.xat_missatges set tipus = v_tipus, text = v_peu,');
  expect(c).not.toMatch(/'foto'|'vídeo'|'missatge de veu'/);
});

test('les funcions SECURITY DEFINER tenen el search_path buit; les privades no les crida cap client', () => {
  const definidores = FUNCIONS.filter((f) => /security definer/.test(f.capcalera));
  expect(definidores.length).toBeGreaterThanOrEqual(11);
  for (const f of definidores) expect(f.capcalera, f.nom).toContain("set search_path = ''");
  for (const f of FUNCIONS) expect(f.capcalera, f.nom).toContain("set search_path = ''");
  expect(CODI).toContain('revoke all on function private.xat_adjunt_a_purga() from public, anon, authenticated;');
  expect(CODI).toContain('revoke all on function private.xat_maxim_adjunt(text), private.xat_id_de_ruta(text) from public, anon, authenticated;');
  expect(SENSE_ESPAIS(CODI)).toContain('grant execute on function public.xat_quota(), public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer), '
    + 'public.xat_publica_adjunt(uuid,text,uuid), public.xat_llegix_adjunt(uuid), public.xat_cancella_reserva(uuid), public.xat_prepara_descart(uuid) to authenticated;');
});

test('l’adaptador crida les RPC d’esta migració amb els mateixos paràmetres', () => {
  for (const rpc of ['xat_quota', 'xat_reserva_adjunt', 'xat_cancella_reserva', 'xat_prepara_descart', 'xat_publica_adjunt', 'xat_llegix_adjunt']) {
    expect(CLIENT, rpc).toContain(`'${rpc}'`);
    expect(CODI, rpc).toContain(`function public.${rpc}(`);
  }
  for (const parametre of ['p_id', 'p_fil_id', 'p_bytes', 'p_mime', 'p_durada_ms', 'p_text', 'p_resposta_a']) {
    expect(CLIENT, parametre).toContain(`${parametre}:`);
    expect(CODI, parametre).toContain(parametre);
  }
  /* La pujada del client és la que admet la sonda: POST de cos cru amb el
     Content-Type del fitxer. R8 · Multipart (FormData, el .upload() de
     supabase-js amb un Blob) porta la llargària del formulari i té 403. */
  expect(CLIENT).toMatch(/method: 'POST'[\s\S]*'Content-Type': fitxer\.type/);
  expect(CLIENT).toContain('body: fitxer,');
  expect(CLIENT).not.toMatch(/FormData|\.upload\(/);
});

test('F7 · el catàleg supabase/README.md la nomena després de 2610211715 i abans de seed.sql, NO aplicada, en un sol paràgraf', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610211715_revoca_correu_organitzacions.sql'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/Gauntlet 261022_0225 \(Tasca 3/);
  expect(entrada.split('\n').filter((l) => l.includes("**NO aplicada: l'aplica el Mestre, mai un agent**"))).toHaveLength(1);
  expect(entrada).toMatch(/va ABANS de publicar el\s+client/);
  expect(entrada).toContain(GRANT_SERVEI);
  const prosa = SENSE_ESPAIS(entrada);
  for (const text of ['2609261500', '2609282100', '2610081543', 'sdp-xat-903', '`022`', 'la durada del vídeo i de la veu és la que declara el client',
    'el worker amb `service_role`, que encara no existix', 'continuen comptant en la quota', 'envia multipart i storage el rebutja amb 403',
    'la llista de converses en diu «cap missatge.»', 'el disparador `private.xat_escriptura_final`', 'node tests/xat-multimedia-postgres.audit.mjs',
    "select cron.schedule('sdp-neteja-xat-adjunts', '23 * * * *', $cron$select private.xat_neteja_adjunts(500)$cron$);"]) {
    expect(prosa, text).toContain(text.toLowerCase());
  }
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
});
