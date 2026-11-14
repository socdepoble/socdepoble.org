/* Onada R22 · scripts/supabase/empremta-funcions.mjs, la porta que faltava
   (dossier R03: «cap porta compara md5(prosrc)»). Un catàleg sintètic de tres
   migracions sobre PostgreSQL 18.6 real i un bolcat de producció menut amb el
   format de q16a i q16b: una funció igual, una diferent (producció es va quedar
   en la primera versió) i una que només viu a producció. Comprova també la
   simulació d'una migració de reconciliació, la revisió de Git (--ref) i la
   línia d'ordres (exit 0, 1 i 2). Cap servei remot: el clúster escolta només
   en un socket Unix temporal. */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ESQUEMA_ORDRE } from '../scripts/supabase/verifica-migracions.mjs';
import {
  ajuntaBolcats, analitzaDefinicio, comparaFuncions, contrastaResolucio, empremtaFuncions, llegixBolcat, normalitzaCos, veredicte
} from '../scripts/supabase/empremta-funcions.mjs';

const execFileP = promisify(execFile);
const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ARREL, 'scripts/supabase/empremta-funcions.mjs');
const md5 = text => createHash('md5').update(text, 'utf8').digest('hex');

const M1 = '2601010000_empremta_base.sql';
const M2 = '2601020000_empremta_redefinix.sql';
const M3 = '2601030000_empremta_reconcilia.sql';
const COS_V1 = '\nbegin\n  return p + 1;\nend;\n';
const COS_V2 = '\nbegin\n  return p + 2;\nend;\n';
const COS_COSMETIC_GIT = '\nbegin\n  -- Git hi afig un comentari.\n  return 7;\nend;\n';
const COS_COSMETIC_PRODUCCIO = '\nBEGIN\n    RETURN 7;\nEND;\n';
const diferent = cos => `create or replace function private.empremta_diferent(p integer) returns integer
  language plpgsql security definer set search_path = '' as $$${cos}$$;\n`;

const MIGRACIONS = {
  [M1]: `create schema if not exists private;
create function public.empremta_igual() returns integer language sql stable security definer set search_path = '' as $$ select 1 $$;
${diferent(COS_V1)}create function public.empremta_nomes_git() returns text language sql immutable as $$ select 'git'::text $$;
create function public.empremta_cosmetica() returns integer language plpgsql security definer set search_path = '' as $$${COS_COSMETIC_GIT}$$;
`,
  [M2]: diferent(COS_V2),
  /* La reconciliació: torna a escriure la versió de Git i retira la que només té producció. */
  [M3]: `${diferent(COS_V2)}drop function if exists public.empremta_nomes_produccio();\n`
};

/* Text literal de pg_get_functiondef, com als bolcats q16a i q16b (claus de regprocedure). */
const DEF = {
  igual: "CREATE OR REPLACE FUNCTION public.empremta_igual()\n RETURNS integer\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO ''\nAS $function$ select 1 $function$\n",
  diferent: `CREATE OR REPLACE FUNCTION private.empremta_diferent(p integer)\n RETURNS integer\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$${COS_V1}$function$\n`,
  nomesProduccio: "CREATE OR REPLACE FUNCTION public.empremta_nomes_produccio()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nbegin\n  perform 1;\nend;\n$function$\n",
  cosmetica: `CREATE OR REPLACE FUNCTION public.empremta_cosmetica()\n RETURNS integer\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$${COS_COSMETIC_PRODUCCIO}$function$\n`
};
const bolcatSintetic = (extra = {}) => ({
  nom: 'q16_sintetic', sql: 'select 1', executat: '2026-11-13T14:27:03.351Z',
  d: { 'empremta_igual()': DEF.igual, 'private.empremta_diferent(integer)': DEF.diferent, 'empremta_nomes_produccio()': DEF.nomesProduccio, ...extra }
});

/** Un repositori de joguet: el catàleg, l'ordre i el bootstrap del Node 0. */
function fixture(t, migracions = [M1, M2]) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-empremta-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, 'supabase/migrations'), { recursive: true });
  fs.mkdirSync(path.join(arrel, 'tooling/node0'), { recursive: true });
  for (const fitxer of migracions) fs.writeFileSync(path.join(arrel, 'supabase/migrations', fitxer), MIGRACIONS[fitxer]);
  fs.writeFileSync(path.join(arrel, 'supabase/ordre_desplegament.json'), JSON.stringify({ esquema: ESQUEMA_ORDRE }));
  fs.copyFileSync(path.join(ARREL, 'tooling/node0/bootstrap-node0.sql'), path.join(arrel, 'tooling/node0/bootstrap-node0.sql'));
  return arrel;
}
const sigs = llista => llista.map(f => f.sig);

test('analitzaDefinicio: el cos entre cometes de dòlar és prosrc, i la capçalera diu SECURITY DEFINER', () => {
  const a = analitzaDefinicio(DEF.diferent);
  assert.equal(a.md5, md5(COS_V1));
  assert.equal(a.esquema, 'private');
  assert.equal(a.tipus, 'funcio');
  assert.equal(a.definer, true);
  assert.equal(a.llenguatge, 'plpgsql');
  assert.equal(a.redactat, false);
  assert.equal(a.capcalera, "CREATE OR REPLACE FUNCTION private.empremta_diferent(p integer)\n RETURNS integer\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''");
  /* PostgreSQL allarga l'etiqueta quan el cos conté $function$. */
  const llarga = analitzaDefinicio("CREATE OR REPLACE FUNCTION \"Rar\".f()\n RETURNS text\n LANGUAGE sql\nAS $functionx$select '$function$'$functionx$\n");
  assert.equal(llarga.md5, md5("select '$function$'"));
  assert.equal(llarga.esquema, 'Rar');
  assert.equal(llarga.definer, false);
  const procediment = analitzaDefinicio('CREATE OR REPLACE PROCEDURE public.p()\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $procedure$begin null; end$procedure$\n');
  assert.equal(procediment.tipus, 'procediment');
  assert.equal(procediment.definer, true);
  const estandard = analitzaDefinicio('CREATE OR REPLACE FUNCTION public.s(a integer)\n RETURNS integer\n LANGUAGE sql\n IMMUTABLE\nRETURN (a + 1)\n');
  assert.equal(estandard.cosSqlEstandard, true);
  assert.equal(estandard.md5, md5('RETURN (a + 1)'));
  assert.equal(analitzaDefinicio("CREATE OR REPLACE FUNCTION public.k()\n RETURNS text\n LANGUAGE sql\nAS $function$select '[REDACTAT]'$function$\n").redactat, true);
  assert.throws(() => analitzaDefinicio('select 1'), TypeError);
  assert.throws(() => analitzaDefinicio("CREATE OR REPLACE FUNCTION public.t()\n RETURNS int\n LANGUAGE sql\nAS $function$select 1"), TypeError);
});

test('normalitzaCos: comentaris, espais i majúscules no compten; cadenes i identificadors entre cometes sí', () => {
  assert.equal(normalitzaCos(COS_COSMETIC_GIT), normalitzaCos(COS_COSMETIC_PRODUCCIO));
  assert.equal(normalitzaCos('SELECT a  +  b /* nota /* niada */ */ FROM t'), normalitzaCos('select a+b from t'));
  assert.notEqual(normalitzaCos("select 'A b'"), normalitzaCos("select 'a  b'"));
  assert.notEqual(normalitzaCos('select "Col" from t'), normalitzaCos('select "col" from t'));
  assert.notEqual(normalitzaCos('x is not null'), normalitzaCos('x is notnull'));
  assert.notEqual(normalitzaCos("raise exception 'SDP-1'"), normalitzaCos("raise exception 'SDP-2'"));
  assert.equal(normalitzaCos("select E'a\\'b' -- c"), "select e'a\\'b'");
  assert.equal(normalitzaCos('perform $q$ -- es queda $q$; -- fora'), 'perform $q$ -- es queda $q$;');
  assert.equal(normalitzaCos('select $1 , $2'), 'select $1,$2');
});

test('llegixBolcat i ajuntaBolcats: format q16, d buit i signatures en conflicte', () => {
  const b = llegixBolcat(JSON.stringify(bolcatSintetic()), 'q16a.json');
  assert.equal(b.nom, 'q16_sintetic');
  assert.equal(b.funcions.size, 3);
  assert.equal(llegixBolcat({ nom: 'buit', d: null }).funcions.size, 0);
  assert.equal(llegixBolcat({ 'empremta_igual()': DEF.igual }).funcions.size, 1, 'també el mapa sol');
  assert.throws(() => llegixBolcat('[1]', 'x'), /format desconegut/);
  assert.throws(() => llegixBolcat('{', 'x'), /JSON no vàlid/);
  assert.throws(() => llegixBolcat({ d: { 'f()': 'select 1' } }, 'x'), /f\(\)/);
  const altre = llegixBolcat({ d: { 'empremta_igual()': DEF.igual.replace('select 1', 'select 2') } }, 'q16b.json');
  assert.throws(() => ajuntaBolcats([b, altre]), /definicions distintes/);
  assert.equal(ajuntaBolcats([b, llegixBolcat({ d: { 'empremta_igual()': DEF.igual } }, 'copia')]).size, 3, 'una còpia idèntica no és conflicte');
});

test('comparaFuncions i veredicte: SECURITY DEFINER a qualsevol costat fa fallar; només a Git no', () => {
  const mapa = defs => new Map(Object.entries(defs).map(([sig, def]) => [sig, { sig, def, ...analitzaDefinicio(def) }]));
  const invoker = DEF.igual.replace(' STABLE SECURITY DEFINER\n', ' STABLE\n');
  const r = comparaFuncions({ produccio: mapa({ 'empremta_igual()': invoker }), git: mapa({ 'empremta_igual()': DEF.igual, 'empremta_cosmetica()': DEF.cosmetica }) });
  assert.deepEqual(r.diferents.map(f => [f.sig, f.diferencies, f.definer_produccio, f.definer_git]), [['empremta_igual()', ['capcalera'], false, true]]);
  assert.deepEqual(r.diferents[0].capcalera, { produccio: [' STABLE'], git: [' STABLE SECURITY DEFINER'] });
  assert.deepEqual(sigs(r.nomes_git), ['empremta_cosmetica()']);
  assert.equal(r.porta.exit, 1);
  const nomesGit = comparaFuncions({ produccio: mapa({ 'empremta_igual()': DEF.igual }), git: mapa({ 'empremta_igual()': DEF.igual, 'empremta_cosmetica()': DEF.cosmetica }) });
  assert.equal(nomesGit.porta.exit, 0, 'una funció que només té Git (pendent d\'aplicar) no fa fallar la porta');
  const invokerNomesProduccio = comparaFuncions({ produccio: mapa({ 'empremta_igual()': invoker }), git: new Map() });
  assert.equal(invokerNomesProduccio.porta.exit, 0, 'només a producció però sense SECURITY DEFINER');
  assert.equal(veredicte({ diferents: [], nomes_produccio: [{ sig: 'x()', definer: true }] }).exit, 1);
  const cosmetica = { sig: 'c()', definer: true, diferencies: ['cos_cosmetic'] };
  assert.equal(veredicte({ diferents: [cosmetica], nomes_produccio: [] }).exit, 1, 'per defecte, també la cosmètica');
  assert.equal(veredicte({ diferents: [cosmetica], nomes_produccio: [] }, { ignoraCosmetiques: true }).exit, 0);
  assert.deepEqual(contrastaResolucio({ diferents: [{ sig: 'a()' }], nomes_produccio: [{ sig: 'b()' }], nomes_git: [] },
    { diferents: [], nomes_produccio: [{ sig: 'b()' }], nomes_git: [{ sig: 'c()' }] }),
  { resoltes: [{ sig: 'a()', abans: 'diferent' }], persistents: [{ sig: 'b()', abans: 'nomes_produccio', despres: 'nomes_produccio' }], noves: [{ sig: 'c()', despres: 'nomes_git' }] });
});

test('PostgreSQL 18.6: igual, diferent amb la migració de cada versió, només a producció i només a Git', { timeout: 240000 }, async t => {
  const arrel = fixture(t);
  const informe = await empremtaFuncions({ arrel, bolcats: [llegixBolcat(bolcatSintetic(), 'q16_sintetic.json')] });
  assert.match(informe.servidor_local, /^PostgreSQL 18\./);
  assert.equal(informe.cataleg.aplicades, 2);
  assert.deepEqual(informe.ambit, ['private', 'public']);
  assert.deepEqual(informe.iguals, [{ sig: 'empremta_igual()', md5: md5(' select 1 '), definer: true, migracio_git: M1 }]);
  assert.deepEqual(informe.diferents, [{
    sig: 'private.empremta_diferent(integer)', definer: true, definer_produccio: true, definer_git: true, diferencies: ['cos'],
    md5_produccio: md5(COS_V1), md5_git: md5(COS_V2), migracio_git: M2, retocada_per: null, produccio_coincidix_amb: M1
  }]);
  assert.deepEqual(informe.nomes_produccio, [{ sig: 'empremta_nomes_produccio()', md5: md5('\nbegin\n  perform 1;\nend;\n'), definer: true, llenguatge: 'plpgsql', historia_git: null }]);
  assert.deepEqual(sigs(informe.nomes_git), ['empremta_cosmetica()', 'empremta_nomes_git()']);
  assert.equal(informe.nomes_git.find(f => f.sig === 'empremta_nomes_git()').migracio_git, M1);
  assert.deepEqual(informe.porta.definer_diferents, ['private.empremta_diferent(integer)']);
  assert.deepEqual(informe.porta.definer_nomes_produccio, ['empremta_nomes_produccio()']);
  assert.equal(informe.porta.exit, 1);
  assert.ok(!JSON.stringify(informe).includes('return p + 2'), 'l\'informe no copia cap cos');

  await t.test('Cosmètica: la porta la compta per defecte i --ignora-cosmetiques la deixa passar', async () => {
    const bolcat = llegixBolcat({ d: { 'empremta_igual()': DEF.igual, 'empremta_cosmetica()': DEF.cosmetica } }, 'cosmetica.json');
    const estricte = await empremtaFuncions({ arrel, bolcats: [bolcat] });
    assert.deepEqual(estricte.diferents.map(f => [f.sig, f.diferencies]), [['empremta_cosmetica()', ['cos_cosmetic']]]);
    assert.equal(estricte.resum.cosmetiques, 1);
    assert.equal(estricte.porta.exit, 1);
    const tolerant = await empremtaFuncions({ arrel, bolcats: [bolcat], ignoraCosmetiques: true });
    assert.deepEqual(tolerant.porta.definer_cosmetiques, ['empremta_cosmetica()']);
    assert.equal(tolerant.porta.exit, 0);
  });
});

test('PostgreSQL 18.6: --simula aplica la reconciliació damunt de la producció i les diferències que resol desapareixen', { timeout: 240000 }, async t => {
  const arrel = fixture(t, [M1, M2, M3]);
  const informe = await empremtaFuncions({ arrel, bolcats: [llegixBolcat(bolcatSintetic(), 'q16_sintetic.json')], simula: ['2601030000'] });
  const s = informe.simulacio;
  assert.equal(informe.produccio, 'simulada');
  assert.deepEqual(s.migracions, [M3]);
  /* Abans: la producció real contra Git (amb M3, que reescriu la mateixa versió). */
  assert.deepEqual(sigs(s.abans.diferents), ['private.empremta_diferent(integer)']);
  assert.equal(s.abans.diferents[0].migracio_git, M2, 'l\'última VERSIÓ és de M2');
  assert.equal(s.abans.diferents[0].retocada_per, M3, 'M3 la torna a escriure igual');
  assert.equal(s.abans.porta.exit, 1);
  assert.deepEqual(s.substituides, ['private.empremta_diferent(integer)']);
  assert.deepEqual(s.creades, ['empremta_nomes_produccio()']);
  assert.deepEqual(s.retirades.sort(), ['empremta_cosmetica()', 'empremta_nomes_git()']);
  assert.deepEqual(s.no_simulades, []);
  /* Després: M3 resol la diferent i la que només tenia producció; la que només té Git es queda. */
  assert.deepEqual(s.resoltes, [{ sig: 'private.empremta_diferent(integer)', abans: 'diferent' }, { sig: 'empremta_nomes_produccio()', abans: 'nomes_produccio' }]);
  assert.deepEqual(sigs(s.persistents).sort(), ['empremta_cosmetica()', 'empremta_nomes_git()']);
  assert.deepEqual(s.noves, []);
  assert.deepEqual(sigs(informe.iguals), ['empremta_igual()', 'private.empremta_diferent(integer)']);
  assert.deepEqual(informe.diferents, []);
  assert.deepEqual(informe.nomes_produccio, []);
  assert.equal(informe.porta.exit, 0);
  await assert.rejects(empremtaFuncions({ arrel, bolcats: [llegixBolcat(bolcatSintetic(), 'x')], simula: ['2612310000'] }), /no és al catàleg/);
});

test('PostgreSQL 18.6: --ref HEAD pren el catàleg confirmat i deixa fora la migració sense confirmar', { timeout: 240000 }, async t => {
  const arrel = fixture(t);
  const env = Object.fromEntries(Object.entries(process.env).filter(([clau]) => !clau.startsWith('GIT_')));
  const git = (...args) => execFileP('git', ['-C', arrel, '-c', 'user.name=Prova de poble', '-c', 'user.email=prova@example.invalid',
    '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], { env });
  await git('init', '-q');
  await git('add', '-A');
  await git('commit', '-q', '-m', 'catàleg de prova');
  const commit = (await git('rev-parse', 'HEAD')).stdout.trim();
  fs.writeFileSync(path.join(arrel, 'supabase/migrations', M3), MIGRACIONS[M3]);
  const bolcats = [llegixBolcat(bolcatSintetic(), 'q16_sintetic.json')];
  const confirmat = await empremtaFuncions({ arrel, bolcats, ref: 'HEAD' });
  assert.equal(confirmat.cataleg.commit, commit);
  assert.equal(confirmat.cataleg.migracions, 2);
  assert.equal(confirmat.cataleg.darrera, M2);
  assert.equal(confirmat.diferents[0].retocada_per, null);
  assert.deepEqual(sigs(confirmat.nomes_produccio), ['empremta_nomes_produccio()']);
  const arbre = await empremtaFuncions({ arrel, bolcats });
  assert.equal(arbre.cataleg.migracions, 3);
  assert.equal(arbre.diferents[0].retocada_per, M3);
  await assert.rejects(empremtaFuncions({ arrel, bolcats, ref: '--output=/tmp/x' }), /revisió no admesa/);
  await assert.rejects(empremtaFuncions({ arrel, bolcats, ref: 'no-existix' }));
});

test('Línia d\'ordres: exit 1 amb JSON a l\'eixida i al fitxer; exit 0 amb --ajuda; exit 2 en errors d\'ús', { timeout: 240000 }, async t => {
  const arrel = fixture(t);
  const bolcat = path.join(arrel, 'q16a_sintetic.json');
  fs.writeFileSync(bolcat, JSON.stringify(bolcatSintetic()));
  const eixida = path.join(arrel, 'informes', 'empremta.json');
  const executa = args => execFileP(process.execPath, [SCRIPT, ...args], { cwd: ARREL, maxBuffer: 16 * 1024 * 1024 })
    .then(r => ({ codi: 0, ...r }), e => ({ codi: e.code, stdout: e.stdout, stderr: e.stderr }));
  const json = await executa(['--bolcat', bolcat, '--arrel', arrel, '--json', '--eixida', eixida]);
  assert.equal(json.codi, 1, json.stderr);
  const informe = JSON.parse(json.stdout);
  assert.deepEqual(JSON.parse(fs.readFileSync(eixida, 'utf8')), informe);
  assert.equal(informe.esquema, 'sdp.empremta-funcions.v1');
  assert.deepEqual(sigs(informe.diferents), ['private.empremta_diferent(integer)']);
  const text = await executa([bolcat, '--arrel', arrel]);
  assert.equal(text.codi, 1);
  assert.match(text.stdout, /Veredicte: la porta FALLA \(exit 1\)/);
  assert.match(text.stdout, /DEFINER {2}empremta_nomes_produccio\(\)/);
  const ajuda = await executa(['--ajuda']);
  assert.equal(ajuda.codi, 0);
  assert.match(ajuda.stdout, /^Ús: node scripts\/supabase\/empremta-funcions\.mjs/);
  assert.equal((await executa(['--opcio-inexistent', bolcat])).codi, 2);
  assert.equal((await executa([])).codi, 2);
  assert.equal((await executa([path.join(arrel, 'no-hi-es.json'), '--arrel', arrel])).codi, 2);
});
