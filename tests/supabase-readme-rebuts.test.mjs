// P0-05 / P1-11 G-P11-01 / P1-68 / P2-10: l'«Estat declarat» de la taula canònica de supabase/README.md
// cita un rebut per fila. Font del veredicte: deriva R22 (bolcat de producció del 13-11-2026).
// Només llig l'arbre real; cap xarxa ni base de dades.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as V from '../scripts/supabase/verifica-migracions.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const README = fs.readFileSync(path.join(REPO, 'supabase/README.md'), 'utf8');
const taula = V.llegixReadme(README).taula;
const informe = V.verifica({ arrel: REPO, ara: new Date('2026-11-18T00:00:00Z') });
const declarat = new Map(informe.migracions.map((m) => [m.versio, m.estatDeclarat]));
const fila = (versio) => taula.find((f) => f.versio === versio);

// Rebuts d'una lectura de la base (no narratives del manifest com el «70/70»).
// Onada v1.2.13 · També la postverificació 10/10 del Super-Bundle R32.14 que el Mestre va executar a producció el 19-11-2026.
// v1.2.24 · F-03 · I el rebut de les sondes de la tanda 132 a 136 (nit del 24 al 25-11-2026).
const RE_REBUT = /bolcat del 13-11-2026|T2 del 13-11-2026|13-11-2026 al T2|certificat 261117_0155|captura 2611\d{2}_\d{4}|lectura REST del 6-11|REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE|REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES|261125_0039_rebut_sql_produccio_132_136\.json/;
// v1.2.24 · F-03 · L'estat de les files 133, 134 i 136 que el rebut 261125_0039 dona APLICADA amb les sondes en verd.
const RE_APLICADA_V1224 = /^Aplicada a producció la nit del 24 al 25-11-2026 \(00:31–00:38 CET\) per l'integrador de la v1\.2\.24 \(Claude Opus 5\.5\), autoritzat pel Mestre, amb els bytes del commit 840c31d33 i SHA-256 comprovada a l'editor[,;] .*\(`261125_0039_rebut_sql_produccio_132_136\.json`\)$/;
// El text sencer de la vinyeta «- `migrations/<versió>_…`» del README, en una sola línia.
function vinyeta(versio) {
  const linies = README.split('\n');
  const i = linies.findIndex((l) => l.startsWith(`- \`migrations/${versio}_`));
  if (i < 0) return null;
  let j = i + 1;
  while (j < linies.length && !/^(- |#)/.test(linies[j])) j += 1;
  return linies.slice(i, j).join(' ').replace(/\s+/g, ' ');
}
// NO aplicades que el bolcat del 13-11-2026 confirma o contradiu: cada una ho cita.
const NO_APLICADES_DEL_BOLCAT = [
  '2610061448', '2610061450', '2610081400', '2610081543', '2610101900', '2611110010',
  '2611070600', '2611080430', '2611080432', '2611082238',
];

// Veredictes congelats de la deriva R22 per a les files problemàtiques.
const MAI_APLICADES = [
  '2610061448', '2610061450', '2610081400', '2610081543', '2610101900', // NO aplicades
  '2610081401', '2610282100', '2609080000', '2609130500', '2609140100', '2609160600', // parcials
];
const JA_NO_DESCONEGUDES = ['2610201500', '2610220240', '2610241400', '2610290400', '2610312000'];
// Les úniques files que continuen «no acreditat»: sense empremta d'esquema (5), parcials (6), evidència REST
// contradictòria (2609121600), cap objecte coincident sinó només superats (5) o desconeguts (2), i la guarda
// de curadoria i la RPC de revisió de 2611091500, que no coincidixen amb cap versió de Git.
const DESCONEGUDES = [
  '2609211820', '2610042350', '2610090100', '2610211715', '2611121700',
  '2609080000', '2609130500', '2609140100', '2609160600', '2610081401', '2610282100',
  '2609121600',
  '2609110600', '2609200600', '2610021520', '2610241410', '2610311900',
  '2610160250', '2610181800',
  '2611091500',
];

test('la taula canònica es llig sencera i cada estat és reconegut', () => {
  // R32.14 adds 20261119143000; R32.25 afig 20261121090000, encara NO aplicada.
  // Onada v1.2.13 · Les files 122–124 giren a «Aplicada» amb el rebut del Super-Bundle
  // R32.14 (19-11-2026); la resta de rebuts històrics es queden com eren, i l'empremta es torna a fixar.
  // v1.2.22 · R32.42 (lots 02 i 03) afig 20261122160000, 20261122160200 i 20261122160300 (files 127 a 129),
  // NO aplicades a Producció en esta versió: les 124 files històriques i la seua empremta no canvien.
  // Preserva els rebuts de producció del HEAD; contrasta totes les files amb els SQL reals.
  const fitxers = fs.readdirSync(path.join(REPO, 'supabase/migrations'), { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.sql')).map((e) => e.name).sort();
  assert.equal(taula.length, fitxers.length, 'una fila per fitxer SQL real');
  assert.equal(new Set(taula.map((f) => f.versio)).size, taula.length, 'cap versió duplicada');
  assert.deepEqual(taula.map((f) => f.fitxer).sort(), fitxers, 'cap migració absent ni fila fantasma, encara que el recompte coincidisca');
  // v1.2.24 · IDEA-339 (Claude 01c) afig 20261124030000: per ordre de versió és la fila 134, entre la 133 (R32.64)
  // i la 135 (C12/R32.72); les 124 files històriques no canvien.
  const R3242 = [
    [127, '20261122160000', '20261122160000_r3242_ajuntament_acreditacio_institucional.sql'],
    [128, '20261122160200', '20261122160200_r32_42_xat_ubicacio_dos_decimals.sql'],
    [129, '20261122160300', '20261122160300_r32_42_mur_visibilitat_publica.sql'],
    [130, '20261122230000', '20261122230000_r3244_edicio_propia_i_page_revisions.sql'],
    [131, '20261123010000', '20261123010000_r3246_quota_owner_id.sql']
  ];
  const KITS_RECONCILIATS = [
    [130, '20261122230000', '20261122230000_r3244_edicio_propia_i_page_revisions.sql'],
    [131, '20261123010000', '20261123010000_r3246_quota_owner_id.sql']
  ];
  // C1..C12 afigen només estes tres propostes: no entren al rebut històric.
  const PROPOSTES_C1_C12 = [
    [132, '20261123180000', '20261123180000_r3252_indexs_suport_fk_verificats.sql'],
    [133, '20261123233000', '20261123233000_r3264_xat_elimina_per_a_tothom_sense_caducitat.sql'],
    [135, '20261124033000', '20261124033000_r3272_profiles_sense_enumeracio_i_execute_minim.sql']
  ];
  // v1.2.24 · IDEA-339 (Claude 01c) · Va per versió entre la 133 i la de C12: fila 134, fora del rebut històric.
  const FILA_V1224 = [134, '20261124030000', '20261124030000_v1224_integritat_xat_perfils_i_realtime.sql'];
  // v1.2.24 · R32.87 (blindatges P0 de Gemini Neon) · fila 136, fora del rebut històric.
  const FILA_R3287 = [136, '20261124174000', '20261124174000_r3287_blindatge_xat_elimina_lssi_i_resol_reclamacio.sql'];
  // v1.2.25 · Costura 1 (Claude) · C1, C2 i C16 de Codex afigen les files 137, 138 i 139, NO aplicades: fora del rebut
  // històric, nomenades una a una perquè cap migració nova entre a l'històric sense revisar-la.
  const FILES_V1225 = [
    [137, '20261125010000', '20261125010000_v1225_xat_cerca_fil_documents_i_purga_blobs.sql'],
    [138, '20261125013000', '20261125013000_v1225_calendari_agricola_subscripcions.sql'],
    [139, '20261125020000', '20261125020000_v1225_purga_lssi_abans_claim.sql']
  ];
  // v1.2.26 · Lot C1-3 · C26-3 de Codex afig la fila 140 (IDEA-375), NO aplicada: fora del rebut històric i nomenada,
  // com les de la v1.2.25, perquè cap migració nova entre a l'històric sense revisar-la.
  const FILES_V1226 = [
    [140, '20261126030500', '20261126030500_v1226_taxonomia_pagines.sql']
  ];
  // v1.2.24 · F-03 · Rebut 261125_0039: la nit del 24 al 25-11-2026, amb els bytes de 840c31d33, s'apliquen a Producció
  // la 133, la 134 i la 136; les guardes de la 132 i la 135 les refusen sense canvis, i continuen NO aplicades.
  const APLICADES_V1224 = [PROPOSTES_C1_C12[1], FILA_V1224, FILA_R3287];
  const REFUSADES_V1224 = [
    [...PROPOSTES_C1_C12[0], /ERROR 55000 `r3252_fk_constraint_drift`.{0,20}87 de 88 FK casen.{0,10} falta `public\.app_content_historial`, que crea `2610101900`, NO aplicada per decisió del Mestre/],
    [...PROPOSTES_C1_C12[2], /ERROR 55000 `r3272_hygiene_function_drift`.{0,20}3 de 4 funcions casen; `private\.trigger_rate_limit_xat\(\)` té el cos de 2609080200\/R22\.0 i la migració espera el de R22\.3, `20261114000200`, NO aplicada per decisió del Mestre/]
  ];
  const historic = taula.filter(f => !['20261119143000', '20261121090000', FILA_V1224[1], FILA_R3287[1], ...FILES_V1225.map(([, versio]) => versio), ...FILES_V1226.map(([, versio]) => versio), ...R3242.map(([, versio]) => versio), ...KITS_RECONCILIATS.map(([, versio]) => versio), ...PROPOSTES_C1_C12.map(([, versio]) => versio)].includes(f.versio));
  assert.equal(historic.length, 124);
  assert.equal(createHash('sha256').update(JSON.stringify(historic.map(({ ordre, versio, fitxer, estat }) => ({ ordre, versio, fitxer, estat })))).digest('hex'),
    'bdda6ff119c42476c82de334a9788b18f2e8d87660d913f5a90bf876f209e096');
  assert.equal(fila('20261119143000').ordre, 125);
  assert.equal(fila('20261119143000').fitxer, '20261119143000_r32_14_xat_fils_previa_sense_amagats.sql');
  assert.equal(declarat.get('20261119143000'), 'declarada_aplicada');
  assert.equal(fila('20261124030000').ordre, 134);
  assert.equal(fila('20261124030000').fitxer, '20261124030000_v1224_integritat_xat_perfils_i_realtime.sql');
  assert.equal(declarat.get('20261124030000'), 'declarada_aplicada');
  assert.match(fila('20261124030000').estat, RE_APLICADA_V1224);
  assert.match(fila('20261124030000').estat, /sonda prèvia del sublot 01c: 1 compte d'`auth\.users` sense `profiles`.*posterior en verd: 0 comptes sense `profiles` i els 2 disparadors diferits presents/);
  assert.equal(fila('20261121090000').ordre, 126);
  assert.equal(fila('20261121090000').fitxer, '20261121090000_r32_25_push_directes_i_bandols.sql');
  assert.equal(declarat.get('20261121090000'), 'declarada_no_aplicada');
  assert.match(fila('20261121090000').estat, /NO aplicada/);
  for (const [ordre, versio, fitxer] of [...R3242, ...KITS_RECONCILIATS]) {
    assert.equal(fila(versio).ordre, ordre, versio);
    assert.equal(fila(versio).fitxer, fitxer, versio);
    // v1.2.23 · T2 · Aplicades a producció la nit del 23 al 24-11-2026 per l'integrador, amb el rebut de les sondes.
    assert.equal(declarat.get(versio), 'declarada_aplicada', versio);
    assert.match(fila(versio).estat, /^Aplicada a producció la nit del 23 al 24-11-2026 .*12d34bc46.*REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES\.json/, versio);
  }
  assert.deepEqual(taula.filter(f => f.ordre >= 132).map(({ ordre, versio, fitxer }) => [ordre, versio, fitxer]),
    [...PROPOSTES_C1_C12.slice(0, 2), FILA_V1224, PROPOSTES_C1_C12[2], FILA_R3287, ...FILES_V1225, ...FILES_V1226], 'cap proposta nova es pot absorbir automàticament dins de l’històric');
  // v1.2.25 · Costura 1 · Cada fila nova diu «NO aplicada a Producció», la seua vinyeta també i dona una lectura de verificació.
  for (const [ordre, versio, fitxer] of FILES_V1225) {
    assert.equal(fila(versio).ordre, ordre, versio);
    assert.equal(fila(versio).fitxer, fitxer, versio);
    assert.equal(declarat.get(versio), 'declarada_no_aplicada', versio);
    assert.match(fila(versio).estat, /^NO aplicada a Producció; v1\.2\.25 · C(?:1|2|16) de Codex, Kit CAS provat només en (?:PGlite|local \(PGlite i PostgreSQL 18\.6\)), després de 13[678]/, versio);
    assert.doesNotMatch(fila(versio).estat, /^Aplicada|rebut/i, versio);
    assert.match(vinyeta(versio), /\*\*NO aplicada a Producció\*\*/, versio);
    assert.match(vinyeta(versio), /Verificació posterior \(lectura\): `select [^`]+;`/, versio);
  }
  // Les dependències que la vinyeta declara són fitxers reals del catàleg.
  for (const [, versio] of FILES_V1225) {
    for (const dep of vinyeta(versio).matchAll(/`(\d{10}|\d{14})`/g)) assert.ok(taula.some((f) => f.versio === dep[1]), `${versio} cita ${dep[1]}, sense fila`);
  }
  assert.match(vinyeta('20261125010000'), /SDP-C1-DRIFT/);
  assert.match(vinyeta('20261125020000'), /SDP-PURGA-LSSI-DRIFT/);
  assert.match(vinyeta('20261125020000'), /private\.xat_adjunt_protegit_lssi\(private\.xat_id_de_ruta\(c\.nom\)\)/);
  assert.match(vinyeta('20261125020000'), /Límit declarat: una protecció apareguda després del claim/);
  assert.match(vinyeta('20261125013000'), /private\.xat_participant_vigent\(uuid,uuid\)/);
  assert.match(vinyeta('20261125013000'), /private\.es_participant\(uuid\)/);
  assert.match(vinyeta('20261125013000'), /private\.is_town_member\(uuid\)/);
  // v1.2.26 · Lot C1-3 · La 140 diu la dependència real: es_superadmin més aal2 en línia, i la frontera canònica del Mur.
  for (const [ordre, versio, fitxer] of FILES_V1226) {
    assert.equal(fila(versio).ordre, ordre, versio);
    assert.equal(fila(versio).fitxer, fitxer, versio);
    assert.equal(declarat.get(versio), 'declarada_no_aplicada', versio);
    assert.match(fila(versio).estat, /^NO aplicada a Producció; v1\.2\.26 · C26-3 de Codex, Kit CAS provat només en PGlite, després de 139$/, versio);
    assert.match(vinyeta(versio), /\*\*NO aplicada a Producció\*\*/, versio);
    assert.match(vinyeta(versio), /Verificació posterior \(lectura\): `select [^`]+;`/, versio);
    for (const dep of vinyeta(versio).matchAll(/`(\d{10}|\d{14})`/g)) assert.ok(taula.some((f) => f.versio === dep[1]), `${versio} cita ${dep[1]}, sense fila`);
  }
  const v140 = vinyeta('20261126030500');
  assert.match(v140, /`private\.es_superadmin\(\)` de `2609080000` \*\*i\*\*, en línia a les dues RPC, `auth\.jwt\(\)->>'aal'='aal2'`/);
  assert.match(v140, /`2610061448` no està aplicada a Producció/);
  assert.match(v140, /frontera canònica del Mur de `2611121430` i `2611122200` \(`visibility='public'`, `moderation_state='visible'`, `deleted_at is null`, `private\.mur_public_eligible\(payload\)` i cap fila a `private\.mur_publicacions_revocades`\)/);
  // La vinyeta d'abans deia que la 140 reutilitzava publicacio_mur_es_publica directament: la migració no la crida.
  assert.doesNotMatch(fs.readFileSync(path.join(REPO, 'supabase/migrations/20261126030500_v1226_taxonomia_pagines.sql'), 'utf8'), /publicacio_mur_es_publica/);
  assert.doesNotMatch(README, /reutilitza `private\.es_superadmin\(\)` i `private\.publicacio_mur_es_publica\(\)`/);
  for (const [ordre, versio, fitxer] of APLICADES_V1224) {
    assert.equal(fila(versio).ordre, ordre, versio);
    assert.equal(fila(versio).fitxer, fitxer, versio);
    assert.equal(declarat.get(versio), 'declarada_aplicada', versio);
    assert.match(fila(versio).estat, RE_APLICADA_V1224, versio);
    assert.doesNotMatch(fila(versio).estat, /NO aplicada/, versio);
    assert.match(vinyeta(versio), /Estat vigent: aplicada a producció la nit del 24 al 25-11-2026 \(v1\.2\.24, bytes de 840c31d33, `261125_0039_rebut_sql_produccio_132_136\.json`\)/, versio);
    assert.doesNotMatch(vinyeta(versio), /Estat vigent: NO aplicada/, versio);
  }
  assert.match(fila('20261123233000').estat, /sonda posterior en verd: RPC `xat_elimina_per_a_tothom\(uuid,uuid\)` present, EXECUTE per a authenticated i no per a anon, i índex de la cua push/);
  assert.match(fila('20261124174000').estat, /encara que la 135, que la precedix, no s'hi va aplicar perquè la seua guarda la va refusar; verificació posterior en verd: les quatre columnes `r3287_\*` a `true` i cap EXECUTE anon de la RPC del xat/);
  for (const [ordre, versio, fitxer, guarda] of REFUSADES_V1224) {
    assert.equal(fila(versio).ordre, ordre, versio);
    assert.equal(fila(versio).fitxer, fitxer, versio);
    assert.equal(declarat.get(versio), 'declarada_no_aplicada', versio);
    assert.match(fila(versio).estat, /^NO aplicada a Producció;/, versio);
    assert.match(fila(versio).estat, /; la nit del 24 al 25-11-2026 \(00:31–00:38 CET\), amb els bytes del commit 840c31d33, la seua guarda la va refusar sense canvis \(/, versio);
    assert.match(fila(versio).estat, guarda, versio);
    assert.match(fila(versio).estat, /; `261125_0039_rebut_sql_produccio_132_136\.json`\)$/, versio);
    assert.match(vinyeta(versio), /Estat vigent: NO aplicada\. La nit del 24 al 25-11-2026 \(00:31–00:38 CET\), amb els bytes del commit 840c31d33, la seua guarda la va refusar sense canvis: /, versio);
    assert.match(vinyeta(versio), guarda, versio);
    assert.match(vinyeta(versio), /261125_0039_rebut_sql_produccio_132_136\.json/, versio);
  }
  assert.deepEqual(informe.errors, []);
  assert.deepEqual(informe.avisos.filter((a) => a.codi === 'A-ESTAT-NO-RECONEGUT'), []);
});

test('cap fila es recolza en el «70/70» ni en «declarat en esta llista»', () => {
  for (const f of taula) {
    assert.doesNotMatch(f.estat, /70\/70 verificat pel Mestre|declarat en esta llista/, `fila ${f.ordre} (${f.versio})`);
  }
});

test('tota fila «Aplicada» cita un rebut d’una lectura de la base', () => {
  for (const f of taula) {
    if (declarat.get(f.versio) !== 'declarada_aplicada') continue;
    assert.match(f.estat, RE_REBUT, `fila ${f.ordre} (${f.versio}) sense rebut`);
    // El bolcat només acredita una migració si hi ha algun objecte amb l'estat exacte que deixa.
    assert.doesNotMatch(f.estat, /^Aplicada a producció segons el bolcat del 13-11-2026 \(deriva R22: 0 coincidents/, `fila ${f.ordre}`);
  }
});

test('les «NO aplicada» que el bolcat del 13-11-2026 confirma o contradiu el citen', () => {
  for (const v of NO_APLICADES_DEL_BOLCAT) {
    assert.equal(declarat.get(v), 'declarada_no_aplicada', v);
    assert.match(fila(v).estat, /bolcat del 13-11-2026/, v);
  }
});

test('els veredictes de la deriva R22 es respecten', () => {
  for (const v of MAI_APLICADES) {
    assert.ok(fila(v), `${v} absent de la taula`);
    assert.notEqual(declarat.get(v), 'declarada_aplicada', `${v} no es pot declarar aplicada`);
  }
  for (const v of ['2610061448', '2610061450', '2610081400', '2610081543', '2610101900']) {
    assert.equal(declarat.get(v), 'declarada_no_aplicada', v);
  }
  for (const v of JA_NO_DESCONEGUDES) assert.equal(declarat.get(v), 'declarada_aplicada', v);
  // Les instruccions d'R22 es conserven.
  assert.match(fila('2610081543').estat, /MAI sencera, la substituïx `20261114000100`/);
  assert.match(fila('2610081400').estat, /sencera després de `20261114000100`/);
  assert.match(fila('2610061450').estat, /sencera després de `20261114000100`/);
  // Evidència contradictòria: es diu, però no es gira.
  for (const v of ['2611070600', '2611080430', '2611080432', '2611082238']) {
    assert.equal(declarat.get(v), 'declarada_no_aplicada', v);
    assert.match(fila(v).estat, /evidència contradictòria: el bolcat del 13-11-2026 hi troba \d+ objectes? coincidents?/, v);
  }
});

test('només les files sense rebut que les acredite continuen «no acreditat», i cada una diu per què', () => {
  const desconegudes = taula.filter((f) => declarat.get(f.versio) === 'desconegut').map((f) => f.versio);
  assert.deepEqual([...desconegudes].sort(), [...DESCONEGUDES].sort());
  for (const v of desconegudes) assert.match(fila(v).estat, /bolcat del 13-11-2026/, v);
});

test('2611091500 no es declara aplicada: les dues funcions que no coincidixen amb Git són de seguretat i s’hi nomenen', () => {
  const e = fila('2611091500').estat;
  assert.equal(declarat.get('2611091500'), 'desconegut');
  assert.match(e, /`private\.pot_curar_cultura\(\)`/);
  assert.match(e, /`revisa_aportacio_cultural\(uuid,text,text\)`/);
  assert.match(e, /no exigix aal2 \(2610061448 encara no aplicada\)/);
});

test('tota vinyeta d’una fila declarada aplicada que encara diu «NO aplicada» o «no acreditat» porta l’estat vigent', () => {
  assert.match(README, /L'estat vigent és el d'esta taula/);
  const linies = README.split('\n');
  for (const f of taula) {
    if (declarat.get(f.versio) !== 'declarada_aplicada') continue;
    const i = linies.findIndex((l) => l.startsWith(`- \`migrations/${f.versio}_`));
    if (i < 0) continue;
    let j = i + 1;
    while (j < linies.length && !/^(- |#)/.test(linies[j])) j += 1;
    const text = linies.slice(i, j).join(' ').replace(/\s+/g, ' ');
    if (!/NO aplicada|no acreditat/.test(text)) continue;
    assert.match(text, /Estat vigent: aplicada a producció (?:segons el bolcat del 13-11-2026|el 19-11-2026|la nit del 23 al 24-11-2026 \(T2 de la v1\.2\.23|la nit del 24 al 25-11-2026 \(v1\.2\.24, bytes de 840c31d33, `261125_0039_rebut_sql_produccio_132_136\.json`\))/, `vinyeta de ${f.versio}`);
  }
});
