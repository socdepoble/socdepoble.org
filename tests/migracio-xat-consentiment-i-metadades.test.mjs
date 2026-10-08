// Prova estàtica de la migració 261008_1543 (auditoria del xat 261008, B03 i
// B08). No hi ha cap base de dades: es llig el SQL amb el mateix escàner de
// sentències que tests/migracio-xat-de-pagina.test.mjs (comentaris fora,
// cadenes i cossos $$ respectats) i es comprova que les tres funcions són
// l'última versió de les migracions anteriors LLETRA A LLETRA amb un sol
// canvi cadascuna, amb els mateixos permisos. A més, la porta de regressió:
// l'última definició vigent de cada funció, siga de qui siga, ha de conservar
// el filtre de consentiment i les metadades buides. S'executa amb `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOM = '2610081543_xat_consentiment_i_metadades.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const llig = (fitxer) => fs.readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const SQL = llig(NOM);
const CAPCALERA = SQL.slice(0, SQL.indexOf('begin;'));
const ORDRE = fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();

/** Talla el SQL en sentències pel `;` de nivell zero, sense comentaris.
 *  Còpia fidel de l'escàner de tests/migracio-xat-de-pagina.test.mjs. */
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

const STS = sentencies(SQL);
const CODI = STS.join(';\n');
/* Sense comentaris, amb els espais reduïts a un i en minúscules. «create or
   replace function» i «create function» són la mateixa definició. */
const normalitza = (text) => text.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  .replace(/^create or replace function /, 'create function ');
const esFuncio = (nom) => (st) => new RegExp(`^\\s*create\\s+(?:or\\s+replace\\s+)?function\\s+public\\.${nom}\\s*\\(`, 'i').test(st);
const funcioDe = (sts, nom) => sts.filter(esFuncio(nom)).at(-1) ?? null;
/** Els revoke i grant d'execució que segueixen la definició, normalitzats. */
const permisos = (sts, st, nom) => {
  const i = sts.indexOf(st);
  return sts.slice(i + 1, i + 3).map(normalitza)
    .filter((s) => /^(revoke|grant) execute on function /.test(s) && s.includes(`.${nom}(`));
};
/** L'última definició de `nom` a les migracions que van ABANS d'esta. */
function anterior(nom) {
  const abans = ORDRE.slice(0, ORDRE.indexOf(NOM));
  for (const fitxer of [...abans].reverse()) {
    const sts = sentencies(llig(fitxer));
    const st = funcioDe(sts, nom);
    if (st) return { fitxer, sts, st };
  }
  return null;
}
/** L'última definició VIGENT de `nom`, comptant també les migracions posteriors. */
function vigent(nom) {
  for (const fitxer of [...ORDRE].reverse()) {
    const st = funcioDe(sentencies(llig(fitxer)), nom);
    if (st) return { fitxer, st };
  }
  return null;
}

const CONSENTIMENT = 'and pr.consentiment_rgpd_at is not null';
const BLOC_CONSENTIMENT = "if not exists (select 1 from public.profiles pr where pr.id = p_altre_usuari and pr.consentiment_rgpd_at is not null) "
  + "then raise exception 'sdp-xat-016: l''interlocutor no és disponible al xat.' using errcode = '42501'; end if;";
const METADADES_ABANS = "coalesce(p_metadades, '{}'::jsonb) - array['com_org_id', 'comorgid', 'autor_nom', 'autornom', 'usuari_id', 'usuariid'], false)";
const METADADES_ARA = "'{}'::jsonb, false)";

test('el nom segueix el format de les migracions i va després de 2610081402', () => {
  assert.match(NOM, /^\d{10}_[a-z0-9_]+\.sql$/);
  assert.ok(ORDRE.indexOf(NOM) > ORDRE.indexOf('2610081402_membres_organitzacio.sql'), 'ha d’aplicar-se després de 2610081402');
  assert.ok(ORDRE.indexOf('2610081402_membres_organitzacio.sql') >= 0);
});

test('la capçalera diu què fa, que NO està aplicada, que l’aplica el Mestre i que va després de 2610081402', () => {
  assert.match(SQL, /^-- =+\n-- 261008_1543 · /);
  assert.match(CAPCALERA, /NO aplicada/);
  assert.match(CAPCALERA, /l'aplica el Mestre/);
  assert.match(CAPCALERA, /Va després\s+(?:--\s+)?de 2610081402/);
  for (const marca of ['B03', 'B08', 'SDP-XAT-016', 'regression.sql']) assert.ok(CAPCALERA.includes(marca), `${marca} absent de la capçalera`);
});

test('la capçalera porta la consulta prèvia del consentiment (2609080300) i el criteri per a aplicar-la', () => {
  /* Revisió 261008 · El filtre deixa fora del padró tots els perfils amb
     consentiment_rgpd_at a null: cal mirar-ho abans, en lectura. */
  const capcalera = CAPCALERA.replace(/^--[ \t]?/gm, '').replace(/\s+/g, ' ');
  assert.match(capcalera, /ABANS D'APLICAR-LA/);
  assert.ok(capcalera.includes('select count(*) filter (where consentiment_rgpd_at is null) as sense, count(*) as total from public.profiles;'),
    'falta la consulta de lectura del recompte');
  assert.match(capcalera, /no és residual/);
  assert.match(capcalera, /pla de reconsentiment/);
  assert.match(capcalera, /2609080300/);
  /* I diu què passa amb els directes que ja existixen. */
  assert.match(capcalera, /es continua retrobant/);
  assert.match(capcalera, /xat_envia hi continua acceptant missatges/);
  assert.match(capcalera, /decisió del Mestre/);
});

test('una sola transacció amb lock_timeout de 5 s i statement_timeout de 60 s, i reload de PostgREST abans del commit', () => {
  assert.equal(STS[0].trim().toLowerCase(), 'begin');
  assert.match(STS[1], /^\s*set local lock_timeout = '5s'\s*$/i);
  assert.match(STS[2], /^\s*set local statement_timeout = '60s'\s*$/i);
  assert.match(STS.at(-2), /^\s*notify pgrst, 'reload schema'\s*$/i);
  assert.equal(STS.at(-1).trim().toLowerCase(), 'commit');
  assert.equal(STS.filter((st) => /^\s*begin\s*$/i.test(st)).length, 1);
  assert.equal(STS.filter((st) => /^\s*commit\s*$/i.test(st)).length, 1);
});

test('només redefinix les tres funcions, sense drop, sense taules i sense obrir res a anon', () => {
  const funcions = STS.filter((st) => /^\s*create\s+(or\s+replace\s+)?function/i.test(st));
  assert.deepEqual(funcions.map((st) => /function\s+(public\.[a-z_]+)/i.exec(st)[1]),
    ['public.membres_del_poble', 'public.crea_fil_directe', 'public.xat_envia']);
  for (const st of funcions) assert.match(st, /^\s*create or replace function/i, 'additiva i idempotent: create or replace');
  assert.doesNotMatch(CODI, /\bdrop\s+(function|table|column|policy|trigger)\b/i);
  assert.doesNotMatch(CODI, /\b(create table|alter table|truncate|delete from|update public\.(?!xat_participants p set llegit_fins_seq))/i);
  assert.doesNotMatch(CODI, /create policy/i);
  assert.doesNotMatch(CODI, /grant [^;]*\bto\b[^;]*\banon\b/i);
  for (const st of funcions) assert.match(st, /security definer set search_path = ''/i);
});

test('B03 · membres_del_poble és la de 2609291210 lletra a lletra amb el filtre de consentiment a les persones', () => {
  const original = anterior('membres_del_poble');
  assert.equal(original?.fitxer, '2609291210_xat_cerca_accents.sql');
  const meua = funcioDe(STS, 'membres_del_poble');
  const n = normalitza(meua);
  assert.equal(n.split(CONSENTIMENT).length, 2, 'el filtre hi ha de ser una vegada');
  assert.equal(n.replace(` ${CONSENTIMENT}`, ''), normalitza(original.st));
  /* A la branca de les persones, al costat de la baixa; les entitats no hi passen. */
  assert.ok(n.includes(`pr.baixa_demanada_at is null ${CONSENTIMENT} union all`));
  assert.deepEqual(permisos(STS, meua, 'membres_del_poble'), permisos(original.sts, original.st, 'membres_del_poble'));
});

test('B03 · crea_fil_directe és la de 2609272200 lletra a lletra amb el consentiment de l’altra persona (SDP-XAT-016)', () => {
  const original = anterior('crea_fil_directe');
  assert.equal(original?.fitxer, '2609272200_xat_entitats.sql');
  const meua = funcioDe(STS, 'crea_fil_directe');
  const n = normalitza(meua);
  assert.equal(n.split(BLOC_CONSENTIMENT).length, 2, 'la comprovació hi ha de ser una vegada');
  assert.equal(n.replace(` ${BLOC_CONSENTIMENT}`, ''), normalitza(original.st));
  /* Revisió 261008 · «Directe nou» literal: dins de «if v_fil is null» de la
     branca de les persones, després de SDP-XAT-004, del bloqueig i de buscar
     el directe existent (que es continua retrobant), just abans de crear-lo.
     La branca de les entitats ja ha tornat abans. */
  const i004 = n.indexOf('sdp-xat-004');
  const iBloqueig = n.indexOf("hashtextextended('xat:persona:'");
  const iCerca = n.indexOf('and p.usuari_id = p_altre_usuari and p.visible_fins_seq is null) order by f.creat_al, f.id limit 1;');
  const i016 = n.indexOf(BLOC_CONSENTIMENT);
  const iInsercio = n.indexOf('insert into public.xat_fils (tenant_id, titol, creat_per, tipus) values');
  assert.ok(i004 > 0 && iBloqueig > i004 && iCerca > iBloqueig && i016 > iCerca && iInsercio > i016);
  assert.ok(n.includes(`limit 1; if v_fil is null then ${BLOC_CONSENTIMENT} insert into public.xat_fils (tenant_id, titol, creat_per, tipus) values`),
    'la comprovació ha de ser la primera sentència de «if v_fil is null» de les persones');
  assert.ok(n.indexOf("hashtextextended('xat:org:'") < i004, 'la branca de l’entitat no hi ha de passar');
  assert.deepEqual(permisos(STS, meua, 'crea_fil_directe'), permisos(original.sts, original.st, 'crea_fil_directe'));
});

/* Revisió 261008 · Només les migracions: el client pot (i hauria de) traduir
   SDP-XAT-016 a un missatge humà; és feina de l'adaptador i d'i18n. */
test('B03 · SDP-XAT-016 és nou: cap altra migració no l’usava', () => {
  const altres = ORDRE.filter((f) => f !== NOM && llig(f).includes('SDP-XAT-016'));
  assert.deepEqual(altres, []);
  assert.equal(SQL.split("raise exception 'SDP-XAT-016").length, 2);
});

test('B08 · xat_envia és la de 2609272200 lletra a lletra, però inserix sempre unes metadades buides', () => {
  const original = anterior('xat_envia');
  assert.equal(original?.fitxer, '2609272200_xat_entitats.sql');
  const meua = funcioDe(STS, 'xat_envia');
  const n = normalitza(meua);
  const o = normalitza(original.st);
  assert.equal(o.split(METADADES_ABANS).length, 2, 'l’original ha canviat: revisa la còpia');
  assert.equal(n, o.replace(METADADES_ABANS, METADADES_ARA));
  /* p_metadades només queda a la signatura i a la validació de tipus. */
  const cos = n.slice(n.indexOf('as $$'));
  assert.equal(cos.split('p_metadades').length - 1, 1);
  assert.match(cos, /jsonb_typeof\(coalesce\(p_metadades, '\{\}'::jsonb\)\) <> 'object'/);
  assert.match(cos, /p_resposta_a, '\{\}'::jsonb, false\) returning \* into v_m/);
  /* La mateixa signatura i el mateix retorn: create or replace no en pot canviar cap. */
  const capcalera = (s) => s.slice(0, s.indexOf(' as $$'));
  assert.equal(capcalera(n), capcalera(o));
  assert.deepEqual(permisos(STS, meua, 'xat_envia'), permisos(original.sts, original.st, 'xat_envia'));
  assert.deepEqual(permisos(STS, meua, 'xat_envia'), [
    'revoke execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) from public, anon',
    'grant execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) to authenticated'
  ]);
});

test('regressió · l’última definició vigent de cada funció conserva el consentiment i les metadades buides', () => {
  const membres = vigent('membres_del_poble');
  assert.ok(normalitza(membres.st).includes(CONSENTIMENT), `${membres.fitxer} ha perdut el filtre de consentiment de membres_del_poble`);
  const directe = vigent('crea_fil_directe');
  assert.ok(normalitza(directe.st).includes('pr.id = p_altre_usuari and pr.consentiment_rgpd_at is not null'),
    `${directe.fitxer} ha perdut el consentiment de crea_fil_directe`);
  const envia = normalitza(vigent('xat_envia').st);
  assert.ok(!envia.slice(envia.indexOf('as $$')).includes(METADADES_ABANS), 'xat_envia torna a guardar p_metadades');
  assert.match(envia, /p_resposta_a, '\{\}'::jsonb, false\)/);
});

test('el catàleg supabase/README.md la nomena, després de 2610081402, i diu que no està aplicada', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const nom = `migrations/${NOM}`;
  assert.ok(readme.includes(nom), 'falta l’entrada al README');
  assert.ok(readme.indexOf(nom) > readme.indexOf('migrations/2610081402_membres_organitzacio.sql'));
  const entrada = readme.slice(readme.indexOf(nom)).split('\n\n')[0];
  assert.match(entrada, /NO\s+aplicada/);
  assert.match(entrada, /2610081402/);
  for (const marca of ['B03', 'B08', 'SDP-XAT-016', 'consentiment_rgpd_at', "'{}'::jsonb"]) assert.ok(entrada.includes(marca), `${marca} absent`);
  /* Revisió 261008 · La consulta prèvia, el criteri i el directe existent. */
  const plana = entrada.replace(/\s+/g, ' ');
  assert.ok(plana.includes('select count(*) filter (where consentiment_rgpd_at is null) as sense, count(*) as total from public.profiles;'));
  assert.match(plana, /pla de reconsentiment/);
  assert.match(plana, /if v_fil is null/);
  assert.match(plana, /es continua retrobant/);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  assert.ok(SQL.endsWith(';\n') && !SQL.endsWith('\n\n'));
  assert.doesNotMatch(SQL, /offline-first|local-first/i);
});
