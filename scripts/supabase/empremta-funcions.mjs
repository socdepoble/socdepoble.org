#!/usr/bin/env node
/**
 * empremta-funcions.mjs · Onada R22 · porta de deriva de funcions entre
 * producció i Git.
 *
 * PER QUÈ. La deriva de l'R22 (dossier Fable 5.2, R03) va passar per totes les
 * portes perquè cap no comparava md5(prosrc). L'empremta «per existència» veu
 * que una funció hi és, però no veu un `create or replace` que no ha arribat
 * mai a producció (xat_envia de 2610081543, can_create_group de 2610081400,
 * capcalera_client de 2610061450) ni una funció que només viu a producció
 * (sdp_protegeix_propietari, delete_user).
 *
 * QUÈ FA. Llig un o més bolcats de producció amb el format de q16a i q16b
 * ({nom, sql, executat, d: {"signatura": "pg_get_functiondef redactat"}}; també
 * accepta el mapa {signatura: definició} sol), aplica el catàleg de migracions
 * en un PostgreSQL embegut i descartable (tests/fixtures/postgres-local.mjs)
 * amb el mateix pla que usen les proves SQL (creaPlaMigracions de
 * tooling/node0/hidrata-postgres-node0.mjs), fotografia les funcions després de
 * cada migració i compara cada funció de producció amb l'ÚLTIMA definició de Git:
 *   - iguals: mateix md5(prosrc) i mateixa capçalera (SECURITY DEFINER,
 *     search_path, volatilitat, tipus de retorn, paràmetres);
 *   - diferents: el md5 de cada costat, què canvia (cos, capçalera o tots dos),
 *     la migració de Git que dona l'última versió i, si n'hi ha, l'última
 *     migració de Git que tenia exactament el cos de producció;
 *   - només a producció (amb la migració de Git que la va retirar, si n'hi ha);
 *   - només a Git.
 * L'àmbit són els esquemes que apareixen als bolcats (o --esquemes); els
 * esquemes de plataforma de Supabase queden fora com als bolcats.
 *
 * ÚS (des de l'arrel del repositori)
 *   node scripts/supabase/empremta-funcions.mjs --bolcat q16a.json --bolcat q16b.json
 *   node scripts/supabase/empremta-funcions.mjs q16a.json q16b.json --json --eixida informe.json
 *   node scripts/supabase/empremta-funcions.mjs q16a.json q16b.json --ref HEAD
 *   node scripts/supabase/empremta-funcions.mjs q16a.json q16b.json \
 *     --simula 20261114000100,20261114000200,20261114000300,20261114000400
 *
 * OPCIONS
 *   --bolcat <fitxer>   Bolcat de producció. Repetible; també com a argument
 *                       posicional. Una signatura repetida amb definicions
 *                       distintes en dos bolcats és un error.
 *   --json              Escriu l'informe complet en JSON a l'eixida estàndard
 *                       (sense l'opció, un resum de text en valencià).
 *   --eixida <fitxer>   Desa també l'informe JSON complet en este fitxer.
 *   --ref <revisió>     Pren el catàleg (migracions, ordre_desplegament.json i
 *                       bootstrap) d'una revisió de Git, p. ex. HEAD, en lloc
 *                       de l'arbre de treball. Només llig (git cat-file).
 *   --arrel <dir>       Repositori del catàleg (per defecte, el d'este script).
 *   --sense <v,...>     Versions del catàleg que no s'apliquen per a construir Git.
 *   --simula <v,...>    Avalua la producció DESPRÉS d'aplicar estes migracions,
 *                       en l'ordre donat: construïx el catàleg sense elles, hi
 *                       posa les funcions dels bolcats (crea o substituïx les
 *                       de producció i retira les que producció no té), aplica
 *                       les migracions i compara el resultat amb Git. L'informe
 *                       porta la comparació real a simulacio.abans i les
 *                       diferències resoltes, persistents i noves.
 *   --esquemes <e,...>  Esquemes que es comparen (per defecte, els dels bolcats).
 *   --ignora-cosmetiques
 *                       Una diferència de cos que només és de comentaris, espais o
 *                       majúscules fora de cometes («cos_cosmetic») es llista però
 *                       no fa fallar la porta. Per defecte, sí que la fa fallar.
 *   --ajuda             Mostra esta ajuda.
 *
 * CODIS D'EIXIDA
 *   0  cap funció SECURITY DEFINER (a qualsevol dels dos costats) és diferent
 *      ni viu només a producció;
 *   1  n'hi ha almenys una: la porta falla. Amb --simula s'avalua l'estat simulat;
 *   2  error d'ús, de lectura dels bolcats o de construcció del catàleg.
 *
 * GARANTIES. Cap connexió de xarxa: el clúster escolta només en un socket Unix
 * temporal i es destruïx en acabar. Els bolcats no s'executen mai, llevat de
 * --simula, que crea en el clúster descartable les definicions de producció de
 * llenguatge sql o plpgsql, una a una, amb el protocol estés (una sola
 * sentència CREATE OR REPLACE per definició); usa-ho només amb bolcats propis.
 * L'informe no copia cap cos de funció: només signatures, md5 i les línies de
 * capçalera que diferixen.
 *
 * LÍMITS. Compara cos i capçalera de pg_get_functiondef; no compara permisos
 * (EXECUTE), propietari ni comentaris. Les funcions amb cos SQL estàndard
 * (BEGIN ATOMIC o RETURN) es comparen pel text del cos. Els bolcats redacten
 * patrons de clau com «[REDACTAT]»; la fotografia local aplica la mateixa
 * redacció abans del md5, de manera que el md5 és el de md5(prosrc) sempre que
 * no hi haja res redactat (el camp «redactat» ho avisa).
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { creaPlaMigracions, sentenciesSql } from '../../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from '../../tests/fixtures/postgres-local.mjs';

export const ESQUEMA_INFORME = 'sdp.empremta-funcions.v1';
export const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Els mateixos esquemes que exclouen els bolcats q15, q16a i q16b. */
export const ESQUEMES_DE_PLATAFORMA = Object.freeze(['pg_catalog', 'information_schema', 'auth', 'storage', 'realtime',
  'extensions', 'graphql', 'graphql_public', 'pgbouncer', 'vault', 'net', 'cron', 'supabase_functions', 'pgsodium',
  'pgsodium_masks', '_realtime', 'supabase_migrations', 'pgmq']);
/** La mateixa redacció que apliquen els bolcats de producció (regexp_replace de PostgreSQL). */
export const PATRO_REDACCIO = String.raw`(eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|sb_secret_[A-Za-z0-9_]+|Bearer\s+[A-Za-z0-9._-]{16,})`;
/** El search_path de la sessió de producció (q00_sessio): fixa el text de regprocedure. */
const SEARCH_PATH = '"$user", public, extensions';
const BOOTSTRAP = '(bootstrap)';
const LLENGUATGES_SIMULABLES = new Set(['sql', 'plpgsql']);
const execFileP = promisify(execFile);
const md5 = text => createHash('md5').update(text, 'utf8').digest('hex');
const sha256 = text => createHash('sha256').update(text).digest('hex');

const US = `Ús: node scripts/supabase/empremta-funcions.mjs [--bolcat] <bolcat.json>... [--json] [--eixida <fitxer>]
       [--ref <revisió>] [--arrel <dir>] [--sense <v,...>] [--simula <v,...>] [--esquemes <e,...>]
       [--ignora-cosmetiques] [--ajuda]
Compara md5(prosrc) i la capçalera de cada funció de producció amb l'última definició de Git.
Exit 0: cap SECURITY DEFINER diferent ni només a producció · 1: n'hi ha · 2: error.
`;

/* ───────────────────────── 1. Definicions ───────────────────────── */

const desfesIdentificador = id => (id.startsWith('"') ? id.slice(1, -1).replaceAll('""', '"') : id);
const esParaula = c => c !== undefined && /[\p{L}\p{N}_$]/u.test(c);

/**
 * Forma canònica d'un cos per a separar la deriva cosmètica de la real: sense
 * comentaris (-- i blocs niats), sense espais llevat dels que separen dues
 * paraules, i en minúscules FORA de les cometes. Les cadenes ('', E''), els
 * identificadors entre cometes dobles i les cometes de dòlar es copien intactes.
 */
export function normalitzaCos(text) {
  let eixida = '', i = 0, espai = false;
  const emet = tros => {
    if (espai && esParaula(eixida.at(-1)) && esParaula(tros[0])) eixida += ' ';
    espai = false;
    eixida += tros;
  };
  while (i < text.length) {
    const c = text[i], seguent = text[i + 1];
    if (/\s/u.test(c)) { espai = true; i += 1; continue; }
    if (c === '-' && seguent === '-') {
      const fi = text.indexOf('\n', i);
      i = fi < 0 ? text.length : fi;
      espai = true;
      continue;
    }
    if (c === '/' && seguent === '*') {
      let fondaria = 1;
      i += 2;
      while (i < text.length && fondaria) {
        if (text.startsWith('/*', i)) { fondaria += 1; i += 2; } else if (text.startsWith('*/', i)) { fondaria -= 1; i += 2; } else i += 1;
      }
      espai = true;
      continue;
    }
    if (c === "'" || c === '"') {
      const escapada = c === "'" && !espai && /^[eE]$/.test(eixida.at(-1) ?? '') && !esParaula(eixida.at(-2));
      let j = i + 1;
      while (j < text.length) {
        if (escapada && text[j] === '\\') { j += 2; continue; }
        if (text[j] === c) { if (text[j + 1] === c) { j += 2; continue; } break; }
        j += 1;
      }
      emet(text.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    const dolar = c === '$' && !esParaula(text[i - 1]) ? /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(i, i + 80)) : null;
    if (dolar) {
      const fi = text.indexOf(dolar[0], i + dolar[0].length);
      const tall = fi < 0 ? text.length : fi + dolar[0].length;
      emet(text.slice(i, tall));
      i = tall;
      continue;
    }
    emet(c.toLowerCase());
    i += 1;
  }
  return eixida;
}

/**
 * Separa capçalera i cos d'un text de pg_get_functiondef. El cos amb cometes
 * de dòlar és exactament prosrc: PostgreSQL tria una etiqueta ($function$,
 * $functionx$...) que no apareix dins del cos.
 */
export function analitzaDefinicio(def) {
  if (typeof def !== 'string') throw new TypeError('la definició ha de ser text');
  const inici = /^CREATE OR REPLACE (FUNCTION|PROCEDURE) ((?:"(?:[^"]|"")+"|[^\s."(]+))\./.exec(def);
  if (!inici) throw new TypeError('la definició no té el format de pg_get_functiondef (CREATE OR REPLACE FUNCTION esquema.nom)');
  const obertura = /\nAS (?:'(?:[^']|'')*', )?(\$(?:function|procedure)x*\$)/.exec(def);
  let capcalera, cos;
  if (obertura) {
    const etiqueta = obertura[1];
    const desDe = obertura.index + obertura[0].length;
    const fins = def.indexOf(etiqueta, desDe);
    if (fins < 0 || def.slice(fins + etiqueta.length).trim() !== '') throw new TypeError('cos de funció sense tancar o amb text després');
    capcalera = def.slice(0, obertura.index);
    cos = def.slice(desDe, fins);
  } else {
    const estandard = /\n(?:BEGIN ATOMIC|RETURN )/.exec(def);
    if (!estandard) throw new TypeError('definició sense cos reconeixible');
    capcalera = def.slice(0, estandard.index);
    cos = def.slice(estandard.index + 1).replace(/\s+$/, '');
  }
  const linies = capcalera.split('\n');
  return {
    tipus: inici[1] === 'FUNCTION' ? 'funcio' : 'procediment',
    esquema: desfesIdentificador(inici[2]),
    capcalera: linies.map(l => l.replace(/\s+$/, '')).join('\n'),
    definer: linies.slice(1).some(l => /^ (?:[A-Z]+ )*SECURITY DEFINER(?: |$)/.test(l)),
    llenguatge: linies.map(l => /^ LANGUAGE (\S+)$/.exec(l)?.[1]).find(Boolean) ?? null,
    md5: md5(cos),
    md5Normalitzat: md5(normalitzaCos(cos)),
    cosSqlEstandard: !obertura,
    redactat: def.includes('[REDACTAT]')
  };
}

/** Un bolcat q16a/q16b ({d: {...}}, d pot ser null) o el mapa sol {signatura: definició}. */
export function llegixBolcat(contingut, origen = 'bolcat') {
  let dades;
  try { dades = typeof contingut === 'string' ? JSON.parse(contingut) : contingut; }
  catch (error) { throw new TypeError(`${origen}: JSON no vàlid (${error.message})`, { cause: error }); }
  const embolcall = dades !== null && typeof dades === 'object' && !Array.isArray(dades) && Object.hasOwn(dades, 'd');
  const mapa = embolcall ? dades.d : dades;
  if (mapa !== null && (typeof mapa !== 'object' || Array.isArray(mapa))) {
    throw new TypeError(`${origen}: format desconegut; cal {d: {"signatura": "definició"}} com q16a i q16b`);
  }
  const funcions = new Map();
  for (const [sig, def] of Object.entries(mapa ?? {})) {
    let analisi;
    try { analisi = analitzaDefinicio(def); }
    catch (error) { throw new TypeError(`${origen}: ${sig}: ${error.message}`, { cause: error }); }
    funcions.set(sig, { sig, def, ...analisi });
  }
  return { origen, nom: embolcall && typeof dades.nom === 'string' ? dades.nom : null,
    executat: embolcall && typeof dades.executat === 'string' ? dades.executat : null, funcions };
}

/** Ajunta bolcats; una mateixa signatura amb dues definicions distintes no es tria a cegues. */
export function ajuntaBolcats(bolcats) {
  const funcions = new Map();
  for (const bolcat of bolcats) {
    for (const [sig, f] of bolcat.funcions) {
      const previ = funcions.get(sig);
      if (previ && previ.def !== f.def) throw new TypeError(`${sig}: definicions distintes a ${previ.font} i a ${bolcat.origen}`);
      if (!previ) funcions.set(sig, { ...f, font: bolcat.origen });
    }
  }
  return funcions;
}

/* ───────────────────────── 2. Comparació ───────────────────────── */

function diferenciaLinies(a, b) {
  const restants = [...b];
  const nomesA = [];
  for (const linia of a) {
    const i = restants.indexOf(linia);
    if (i >= 0) restants.splice(i, 1); else nomesA.push(linia);
  }
  return { nomesA, nomesB: restants };
}

function historiaDe(historia, sig) {
  const h = historia.get(sig);
  if (!h) return { migracioGit: null, retocadaPer: null, canvis: [] };
  const vius = h.canvis.filter(c => !c.absent);
  const migracioGit = h.canvis.at(-1)?.absent ? null : vius.at(-1)?.migracio ?? null;
  return { migracioGit, retocadaPer: h.tocadaPer && h.tocadaPer !== migracioGit ? h.tocadaPer : null, canvis: h.canvis };
}

/** L'última migració de Git que tenia exactament este cos (o la definició sencera, si és SQL estàndard). */
function coincidenciaEnGit(canvis, funcio) {
  const md5Def = funcio.cosSqlEstandard && typeof funcio.def === 'string' ? md5(funcio.def) : null;
  for (let i = canvis.length - 1; i >= 0; i -= 1) {
    const c = canvis[i];
    if (c.absent) continue;
    if (funcio.cosSqlEstandard ? c.md5Def === md5Def : c.md5 === funcio.md5) return c.migracio;
  }
  return null;
}

/**
 * Classifica cada funció de l'àmbit. `produccio` i `git` són Map(signatura →
 * analitzaDefinicio), `historia` és Map(signatura → canvis per migració).
 */
export function comparaFuncions({ produccio, git, historia = new Map(), esquemes = null, ignoraCosmetiques = false }) {
  const ambit = new Set(esquemes ?? [...produccio.values()].map(f => f.esquema));
  const iguals = [], diferents = [], nomesProduccio = [], nomesGit = [];
  const sigs = new Set([...produccio.keys(), ...git.keys()]);
  for (const sig of [...sigs].sort()) {
    const p = produccio.get(sig), g = git.get(sig);
    if (!ambit.has((p ?? g).esquema)) continue;
    const h = historiaDe(historia, sig);
    if (p && g) {
      const diferencies = [];
      /* «cos_cosmetic»: només comentaris, espais o majúscules fora de cometes. */
      if (p.md5 !== g.md5) diferencies.push(p.md5Normalitzat === g.md5Normalitzat ? 'cos_cosmetic' : 'cos');
      if (p.capcalera !== g.capcalera) diferencies.push('capcalera');
      if (!diferencies.length) { iguals.push({ sig, md5: g.md5, definer: g.definer, migracio_git: h.migracioGit }); continue; }
      const linies = diferenciaLinies(p.capcalera.split('\n'), g.capcalera.split('\n'));
      diferents.push({ sig, definer: p.definer || g.definer, definer_produccio: p.definer, definer_git: g.definer, diferencies,
        md5_produccio: p.md5, md5_git: g.md5, migracio_git: h.migracioGit, retocada_per: h.retocadaPer,
        produccio_coincidix_amb: coincidenciaEnGit(h.canvis, p),
        ...(diferencies.includes('capcalera') ? { capcalera: { produccio: linies.nomesA, git: linies.nomesB } } : {}),
        ...(p.redactat || g.redactat ? { redactat: true } : {}) });
    } else if (p) {
      const vius = h.canvis.filter(c => !c.absent);
      nomesProduccio.push({ sig, md5: p.md5, definer: p.definer, llenguatge: p.llenguatge,
        historia_git: vius.length ? { creada_per: vius[0].migracio, retirada_per: h.canvis.at(-1).migracio,
          produccio_coincidix_amb: coincidenciaEnGit(h.canvis, p) } : null,
        ...(p.redactat ? { redactat: true } : {}) });
    } else {
      nomesGit.push({ sig, md5: g.md5, definer: g.definer, migracio_git: h.migracioGit });
    }
  }
  const resum = { iguals: iguals.length, diferents: diferents.length, nomes_produccio: nomesProduccio.length, nomes_git: nomesGit.length,
    definer_diferents: diferents.filter(f => f.definer).length, definer_nomes_produccio: nomesProduccio.filter(f => f.definer).length };
  resum.cosmetiques = diferents.filter(f => f.diferencies.length === 1 && f.diferencies[0] === 'cos_cosmetic').length;
  return { ambit: [...ambit].sort(), resum, porta: veredicte({ diferents, nomes_produccio: nomesProduccio }, { ignoraCosmetiques }),
    iguals, diferents, nomes_produccio: nomesProduccio, nomes_git: nomesGit };
}

/**
 * La porta: cap SECURITY DEFINER diferent (a qualsevol costat) ni només a
 * producció. Amb ignoraCosmetiques, una diferència que només és de comentaris
 * o de format es llista però no fa fallar.
 */
export function veredicte({ diferents, nomes_produccio: nomesProduccio }, { ignoraCosmetiques = false } = {}) {
  const nomesCosmetica = f => f.diferencies.length === 1 && f.diferencies[0] === 'cos_cosmetic';
  const cosmetiques = diferents.filter(f => f.definer && nomesCosmetica(f)).map(f => f.sig);
  const definerDiferents = diferents.filter(f => f.definer && !(ignoraCosmetiques && nomesCosmetica(f))).map(f => f.sig);
  const definerNomesProduccio = nomesProduccio.filter(f => f.definer).map(f => f.sig);
  const motius = [];
  if (definerDiferents.length) motius.push(`${definerDiferents.length} funcions SECURITY DEFINER diferents de l'última definició de Git`);
  if (definerNomesProduccio.length) motius.push(`${definerNomesProduccio.length} funcions SECURITY DEFINER només a producció`);
  return { falla: motius.length > 0, exit: motius.length ? 1 : 0, motius, ignora_cosmetiques: ignoraCosmetiques,
    definer_diferents: definerDiferents, definer_nomes_produccio: definerNomesProduccio, definer_cosmetiques: cosmetiques };
}

/** Què desapareix, què es queda i què apareix entre dues comparacions. */
export function contrastaResolucio(abans, despres) {
  const estat = informe => new Map([
    ...informe.diferents.map(f => [f.sig, 'diferent']),
    ...informe.nomes_produccio.map(f => [f.sig, 'nomes_produccio']),
    ...informe.nomes_git.map(f => [f.sig, 'nomes_git'])
  ]);
  const a = estat(abans), d = estat(despres);
  const resoltes = [], persistents = [], noves = [];
  for (const [sig, e] of a) {
    if (!d.has(sig)) resoltes.push({ sig, abans: e });
    else persistents.push({ sig, abans: e, despres: d.get(sig) });
  }
  for (const [sig, e] of d) if (!a.has(sig)) noves.push({ sig, despres: e });
  return { resoltes, persistents, noves };
}

/* ───────────────────────── 3. Catàleg de Git en PostgreSQL ───────────────────────── */

const SQL_FOTO = ambDefinicio => `select p.oid::regprocedure::text as sig, n.nspname as esquema, p.xmin::text as xmin,
    md5(regexp_replace(p.prosrc, $1, '[REDACTAT]', 'g')) as md5_prosrc,
    md5(regexp_replace(pg_catalog.pg_get_functiondef(p.oid), $1, '[REDACTAT]', 'g')) as md5_def,
    format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)) as qualificada
    ${ambDefinicio ? ", regexp_replace(pg_catalog.pg_get_functiondef(p.oid), $1, '[REDACTAT]', 'g') as def" : ''}
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where p.prokind::text in ('f', 'p') and n.nspname <> all($2::text[]) and n.nspname !~ '^pg_'
    and not exists (select 1 from pg_catalog.pg_depend d where d.objid = p.oid and d.deptype::text = 'e')
  order by 1`;

async function fotografia(db, { ambDefinicio = false } = {}) {
  await db.query(`set search_path to ${SEARCH_PATH}`);
  return (await db.query(SQL_FOTO(ambDefinicio), [PATRO_REDACCIO, ESQUEMES_DE_PLATAFORMA])).rows;
}

function registraFoto(historia, files, etiqueta) {
  const vistes = new Set();
  for (const f of files) {
    vistes.add(f.sig);
    let h = historia.get(f.sig);
    if (!h) historia.set(f.sig, h = { esquema: f.esquema, canvis: [], xmin: null, tocadaPer: null });
    const darrer = h.canvis.at(-1);
    if (!darrer || darrer.absent || darrer.md5 !== f.md5_prosrc || darrer.md5Def !== f.md5_def) {
      h.canvis.push({ migracio: etiqueta, md5: f.md5_prosrc, md5Def: f.md5_def });
    }
    /* Un CREATE OR REPLACE idèntic, un GRANT o un ALTER també reescriuen la fila de pg_proc. */
    if (h.xmin !== f.xmin) { h.xmin = f.xmin; h.tocadaPer = etiqueta; }
  }
  for (const [sig, h] of historia) {
    if (!vistes.has(sig) && !h.canvis.at(-1)?.absent) {
      h.canvis.push({ migracio: etiqueta, absent: true });
      h.xmin = null;
      h.tocadaPer = etiqueta;
    }
  }
}

/** Map(signatura → analitzaDefinicio) d'una fotografia amb definicions; comprova el md5 contra el del servidor. */
function mapaDeFoto(files) {
  const funcions = new Map();
  for (const f of files) {
    const analisi = analitzaDefinicio(f.def);
    if (!analisi.cosSqlEstandard && analisi.md5 !== f.md5_prosrc) {
      throw new Error(`${f.sig}: el cos extret de pg_get_functiondef no fa el md5(prosrc) del servidor`);
    }
    funcions.set(f.sig, { sig: f.sig, def: f.def, qualificada: f.qualificada, xmin: f.xmin, ...analisi });
  }
  return funcions;
}

async function aplicaMigracio(db, migracio) {
  await db.query('begin');
  try {
    await db.query(migracio.body);
    await db.query('commit');
  } catch (error) {
    await db.query('rollback');
    throw new Error(`${migracio.file}: ${error.message}`, { cause: error });
  }
}

/** El clúster de proves resol la memòria cau relativa al directori actual: sempre la del repositori. */
async function iniciaCluster() {
  const anterior = process.cwd();
  if (anterior === ARREL) return startLocalPostgres();
  process.chdir(ARREL);
  try { return await startLocalPostgres(); } finally { process.chdir(anterior); }
}

const RE_REVISIO = /^[A-Za-z0-9_][A-Za-z0-9._/~^@{}-]{0,199}$/;

/** Exporta el catàleg d'una revisió a un directori temporal, sense tocar l'arbre ni l'índex. */
async function exportaRevisio(arrel, revisio) {
  if (!RE_REVISIO.test(revisio) || revisio.includes('..')) throw new TypeError(`--ref: revisió no admesa: ${revisio}`);
  /* Dins d'un hook, GIT_DIR o GIT_INDEX_FILE apuntarien a un altre repositori: fora. */
  const env = Object.fromEntries(Object.entries(process.env).filter(([clau]) => !clau.startsWith('GIT_')));
  const git = (args, opcions = {}) => execFileP('git', ['-C', arrel, ...args], { maxBuffer: 256 * 1024 * 1024, env, ...opcions });
  const commit = (await git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${revisio}^{commit}`])).stdout.trim();
  if (!/^[0-9a-f]{40,64}$/.test(commit)) throw new TypeError(`--ref: ${revisio} no és cap commit`);
  const llista = (await git(['ls-tree', '-r', '-z', '--name-only', commit, '--', 'supabase/migrations'])).stdout.split('\0').filter(Boolean);
  const fitxers = [...llista.filter(f => /^supabase\/migrations\/[^/]+\.sql$/.test(f)), 'supabase/ordre_desplegament.json', 'tooling/node0/bootstrap-node0.sql'];
  const desti = await mkdtemp(path.join(tmpdir(), 'sdp-empremta-ref-'));
  try {
    for (const fitxer of fitxers) {
      const { stdout } = await git(['cat-file', 'blob', `${commit}:${fitxer}`], { encoding: 'buffer' });
      await mkdir(path.join(desti, path.dirname(fitxer)), { recursive: true });
      await writeFile(path.join(desti, fitxer), stdout);
    }
  } catch (error) {
    await rm(desti, { recursive: true, force: true });
    throw error;
  }
  return { desti, commit };
}

async function preparaPla({ arrel, ref }) {
  if (!ref) return { pla: creaPlaMigracions({ root: arrel }), commit: null, neteja: async () => {} };
  const { desti, commit } = await exportaRevisio(arrel, ref);
  try {
    return { pla: creaPlaMigracions({ root: desti }), commit, neteja: () => rm(desti, { recursive: true, force: true }) };
  } catch (error) {
    await rm(desti, { recursive: true, force: true });
    throw error;
  }
}

/** Git: tot el catàleg (llevat de --sense) amb una fotografia després de cada migració. */
async function construeixGit(pla, sense) {
  const cluster = await iniciaCluster();
  try {
    const db = cluster.db;
    const servidor = (await db.query('select version() as v')).rows[0].v;
    const historia = new Map();
    await db.query(pla.bootstrap);
    registraFoto(historia, await fotografia(db), BOOTSTRAP);
    let aplicades = 0;
    for (const migracio of pla.migrations) {
      if (sense.has(migracio.version)) continue;
      await aplicaMigracio(db, migracio);
      aplicades += 1;
      registraFoto(historia, await fotografia(db), migracio.file);
    }
    return { servidor, historia, aplicades, funcions: mapaDeFoto(await fotografia(db, { ambDefinicio: true })) };
  } finally {
    await cluster.close();
  }
}

async function ambPuntDeRetorn(db, consulta) {
  await db.query('savepoint sdp_empremta');
  try {
    await db.query(consulta);
    await db.query('release savepoint sdp_empremta');
    return { ok: true };
  } catch (error) {
    await db.query('rollback to savepoint sdp_empremta');
    await db.query('release savepoint sdp_empremta');
    return { ok: false, codi: error.code ?? null, missatge: String(error.message).slice(0, 300) };
  }
}

/** Una definició de producció només es crea si és una sola sentència CREATE OR REPLACE de sql o plpgsql. */
function motiuNoSimulable(funcio) {
  if (!LLENGUATGES_SIMULABLES.has(funcio.llenguatge)) return `llenguatge ${funcio.llenguatge ?? 'desconegut'} no admés en la simulació`;
  if (funcio.redactat) return 'definició redactada: no es pot reproduir';
  let sentencies;
  try { sentencies = sentenciesSql(funcio.def).filter(s => s.trim()); }
  catch { return 'definició amb cometes sense tancar'; }
  if (sentencies.length !== 1) return 'la definició no és una sola sentència';
  return null;
}

/** Producció simulada: catàleg sense les migracions simulades + funcions dels bolcats + migracions simulades. */
async function simulaProduccio({ pla, sense, simula, produccio, ambit }) {
  const perVersio = new Map(pla.migrations.map(m => [m.version, m]));
  for (const versio of simula) if (!perVersio.has(versio)) throw new TypeError(`--simula: la versió ${versio} no és al catàleg`);
  const cluster = await iniciaCluster();
  try {
    const db = cluster.db;
    await db.query(pla.bootstrap);
    for (const migracio of pla.migrations) {
      if (!sense.has(migracio.version) && !simula.includes(migracio.version)) await aplicaMigracio(db, migracio);
    }
    const local = mapaDeFoto(await fotografia(db, { ambDefinicio: true }));
    const registre = { migracions: simula.map(v => perVersio.get(v).file), substituides: [], creades: [], retirades: [], no_simulades: [] };
    await db.query('begin');
    await db.query('set local check_function_bodies = off');
    for (const [sig, l] of local) {
      if (!ambit.has(l.esquema) || produccio.has(sig)) continue;
      const r = await ambPuntDeRetorn(db, `drop ${l.tipus === 'procediment' ? 'procedure' : 'function'} ${l.qualificada}`);
      if (r.ok) registre.retirades.push(sig);
      else registre.no_simulades.push({ sig, accio: 'retirar', motiu: `${r.codi}: ${r.missatge}` });
    }
    for (const [sig, p] of produccio) {
      const l = local.get(sig);
      if (l && l.md5 === p.md5 && l.capcalera === p.capcalera) continue;
      const motiu = motiuNoSimulable(p);
      if (motiu) { registre.no_simulades.push({ sig, accio: l ? 'substituir' : 'crear', motiu }); continue; }
      const crea = { text: p.def, queryMode: 'extended' };
      let r = await ambPuntDeRetorn(db, crea);
      if (!r.ok && l && r.codi === '42P13') {
        /* Canvi de tipus de retorn o de noms de paràmetres: cal retirar-la primer, sense CASCADE. */
        const retira = await ambPuntDeRetorn(db, `drop ${l.tipus === 'procediment' ? 'procedure' : 'function'} ${l.qualificada}`);
        r = retira.ok ? await ambPuntDeRetorn(db, crea) : retira;
      }
      if (r.ok) (l ? registre.substituides : registre.creades).push(sig);
      else registre.no_simulades.push({ sig, accio: l ? 'substituir' : 'crear', motiu: `${r.codi}: ${r.missatge}` });
    }
    await db.query('commit');
    const posada = new Map((await fotografia(db)).map(f => [f.sig, f.xmin]));
    for (const versio of simula) await aplicaMigracio(db, perVersio.get(versio));
    const final = mapaDeFoto(await fotografia(db, { ambDefinicio: true }));
    const simulada = new Map([...final].filter(([, f]) => ambit.has(f.esquema)));
    /* Una funció que no s'ha pogut posar com a producció i que cap migració simulada
       no ha tornat a escriure conserva l'estat real de producció (definició o absència). */
    for (const n of registre.no_simulades) {
      if (posada.get(n.sig) !== final.get(n.sig)?.xmin) { n.despres = 'reescrita per les migracions simulades'; continue; }
      const p = produccio.get(n.sig);
      if (p) simulada.set(n.sig, p); else simulada.delete(n.sig);
      n.despres = p ? 'conserva la definició de producció' : 'conserva l\'absència de producció';
    }
    return { funcions: simulada, registre };
  } finally {
    await cluster.close();
  }
}

const llistaVersions = text => (text ? String(text).split(',').map(v => v.trim()).filter(Boolean) : []);

/**
 * API: { bolcats: [{origen, funcions}], arrel, ref, sense: [], simula: [], esquemes: [] } → informe.
 * Llig els bolcats amb llegixBolcat abans de cridar-la.
 */
export async function empremtaFuncions({ bolcats, arrel = ARREL, ref = null, sense = [], simula = [], esquemes = null, ignoraCosmetiques = false }) {
  if (!Array.isArray(bolcats) || !bolcats.length) throw new TypeError('cal almenys un bolcat de producció');
  const produccio = ajuntaBolcats(bolcats);
  const ambit = new Set(esquemes?.length ? esquemes : [...produccio.values()].map(f => f.esquema));
  if (!ambit.size) throw new TypeError('els bolcats no tenen cap funció i no s\'ha indicat cap esquema (--esquemes)');
  const senseSet = new Set(sense);
  for (const v of simula) if (senseSet.has(v)) throw new TypeError(`--simula i --sense alhora per a ${v}`);
  const { pla, commit, neteja } = await preparaPla({ arrel, ref });
  try {
    for (const v of senseSet) if (!pla.migrations.some(m => m.version === v)) throw new TypeError(`--sense: la versió ${v} no és al catàleg`);
    const git = await construeixGit(pla, senseSet);
    const real = comparaFuncions({ produccio, git: git.funcions, historia: git.historia, esquemes: ambit, ignoraCosmetiques });
    const informe = {
      esquema: ESQUEMA_INFORME,
      generat: new Date().toISOString(),
      servidor_local: git.servidor,
      cataleg: { arrel, ref, commit, migracions: pla.migrations.length, aplicades: git.aplicades, sense: [...senseSet],
        ordre_sha256: pla.orderSha256, empremta: sha256(pla.migrations.map(m => `${m.file}:${m.sha256}`).join('\n')),
        darrera: pla.migrations.filter(m => !senseSet.has(m.version)).at(-1)?.file ?? null },
      bolcats: bolcats.map(b => ({ origen: b.origen, nom: b.nom, executat: b.executat, funcions: b.funcions.size })),
      produccio: 'real',
      ...real
    };
    if (!simula.length) return informe;
    const simulacio = await simulaProduccio({ pla, sense: senseSet, simula, produccio, ambit });
    const despres = comparaFuncions({ produccio: simulacio.funcions, git: git.funcions, historia: git.historia, esquemes: ambit, ignoraCosmetiques });
    return { ...informe, produccio: 'simulada', ...despres,
      simulacio: { ...simulacio.registre, ...contrastaResolucio(real, despres), abans: real } };
  } finally {
    await neteja();
  }
}

/* ───────────────────────── 4. Eixida de text ───────────────────────── */

const curt = valor => (valor ? valor.slice(0, 12) : '—');

export function formataText(informe) {
  const r = informe.resum;
  const linies = [
    'Empremta de funcions · producció contra l\'última definició de Git',
    `  Catàleg: ${informe.cataleg.aplicades} de ${informe.cataleg.migracions} migracions${informe.cataleg.ref ? ` de la revisió ${informe.cataleg.ref} (${curt(informe.cataleg.commit)})` : ' de l\'arbre de treball'}; darrera ${informe.cataleg.darrera}`,
    `  Servidor local: ${informe.servidor_local.split(' on ')[0]}`,
    `  Bolcats: ${informe.bolcats.map(b => `${b.nom ?? b.origen} (${b.funcions})`).join(', ')}`,
    `  Àmbit: ${informe.ambit.join(', ')}${informe.produccio === 'simulada' ? ` · producció SIMULADA després de ${informe.simulacio.migracions.join(', ')}` : ''}`,
    `  Iguals ${r.iguals} · Diferents ${r.diferents} (${r.definer_diferents} SECURITY DEFINER; ${r.cosmetiques} només cosmètiques) · Només a producció ${r.nomes_produccio} (${r.definer_nomes_produccio} SECURITY DEFINER) · Només a Git ${r.nomes_git}`
  ];
  const marca = f => (f.definer ? 'DEFINER ' : '        ');
  if (informe.diferents.length) {
    linies.push('', 'Diferents');
    for (const f of informe.diferents) {
      linies.push(`  ${marca(f)} ${f.sig} [${f.diferencies.join(', ')}]`,
        `           producció ${f.md5_produccio} · Git ${f.md5_git} (${f.migracio_git ?? 'sense migració'}${f.retocada_per ? `; retocada per ${f.retocada_per}` : ''})`);
      if (f.produccio_coincidix_amb) linies.push(`           el cos de producció és el de ${f.produccio_coincidix_amb}`);
      for (const l of f.capcalera?.produccio ?? []) linies.push(`           - producció: ${l.trim()}`);
      for (const l of f.capcalera?.git ?? []) linies.push(`           + Git:       ${l.trim()}`);
    }
  }
  if (informe.nomes_produccio.length) {
    linies.push('', 'Només a producció');
    for (const f of informe.nomes_produccio) {
      const h = f.historia_git;
      linies.push(`  ${marca(f)} ${f.sig} · ${f.md5}${h ? ` · a Git de ${h.creada_per} a ${h.retirada_per}${h.produccio_coincidix_amb ? `, cos de ${h.produccio_coincidix_amb}` : ''}` : ' · cap migració de Git'}`);
    }
  }
  if (informe.nomes_git.length) {
    linies.push('', 'Només a Git');
    for (const f of informe.nomes_git) linies.push(`  ${marca(f)} ${f.sig} · ${f.md5} (${f.migracio_git ?? 'sense migració'})`);
  }
  if (informe.simulacio) {
    const s = informe.simulacio;
    linies.push('', `Simulació: ${s.substituides.length} substituïdes, ${s.creades.length} creades, ${s.retirades.length} retirades, ${s.no_simulades.length} no simulades`,
      `  Abans: ${s.abans.resum.diferents} diferents, ${s.abans.resum.nomes_produccio} només a producció, ${s.abans.resum.nomes_git} només a Git (porta ${s.abans.porta.falla ? 'FALLA' : 'passa'})`,
      `  Resoltes (${s.resoltes.length}): ${s.resoltes.map(x => x.sig).join(', ') || 'cap'}`,
      `  Persistents (${s.persistents.length}): ${s.persistents.map(x => x.sig).join(', ') || 'cap'}`,
      `  Noves (${s.noves.length}): ${s.noves.map(x => x.sig).join(', ') || 'cap'}`);
    for (const n of s.no_simulades) linies.push(`  no simulada: ${n.sig} (${n.accio}): ${n.motiu}${n.despres ? `; ${n.despres}` : ''}`);
  }
  const ignorades = informe.porta.ignora_cosmetiques && informe.porta.definer_cosmetiques.length
    ? ` (${informe.porta.definer_cosmetiques.length} SECURITY DEFINER només cosmètiques, ignorades per --ignora-cosmetiques)` : '';
  linies.push('', informe.porta.falla
    ? `Veredicte: la porta FALLA (exit 1): ${informe.porta.motius.join('; ')}${ignorades}.`
    : `Veredicte: la porta passa (exit 0): cap SECURITY DEFINER diferent ni només a producció${ignorades}.`);
  return `${linies.join('\n')}\n`;
}

/* ───────────────────────── 5. Línia d'ordres ───────────────────────── */

export function llegixOpcions(argv) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, strict: true, options: {
    bolcat: { type: 'string', multiple: true }, json: { type: 'boolean' }, eixida: { type: 'string' },
    ref: { type: 'string' }, arrel: { type: 'string' }, sense: { type: 'string' }, simula: { type: 'string' },
    esquemes: { type: 'string' }, 'ignora-cosmetiques': { type: 'boolean' }, ajuda: { type: 'boolean' }
  } });
  const bolcats = [...(values.bolcat ?? []), ...positionals];
  if (!values.ajuda && !bolcats.length) throw new TypeError('cal almenys un bolcat de producció (--bolcat <fitxer>)');
  return { ajuda: values.ajuda === true, json: values.json === true, bolcats: bolcats.map(f => path.resolve(f)),
    eixida: values.eixida ? path.resolve(values.eixida) : null, ref: values.ref ?? null,
    arrel: values.arrel ? path.resolve(values.arrel) : ARREL, sense: llistaVersions(values.sense),
    simula: llistaVersions(values.simula), esquemes: llistaVersions(values.esquemes),
    ignoraCosmetiques: values['ignora-cosmetiques'] === true };
}

export async function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  let opcions;
  try { opcions = llegixOpcions(argv); }
  catch (error) { stderr.write(`empremta-funcions: ${error.message}\n${US}`); return 2; }
  if (opcions.ajuda) { stdout.write(US); return 0; }
  let informe;
  try {
    const bolcats = [];
    for (const fitxer of opcions.bolcats) bolcats.push(llegixBolcat(await readFile(fitxer, 'utf8'), path.basename(fitxer)));
    informe = await empremtaFuncions({ bolcats, arrel: opcions.arrel, ref: opcions.ref, sense: opcions.sense,
      simula: opcions.simula, esquemes: opcions.esquemes, ignoraCosmetiques: opcions.ignoraCosmetiques });
  } catch (error) {
    stderr.write(`empremta-funcions: ${error.message}\n`);
    return 2;
  }
  const json = `${JSON.stringify(informe, null, 1)}\n`;
  if (opcions.eixida) {
    await mkdir(path.dirname(opcions.eixida), { recursive: true });
    await writeFile(opcions.eixida, json);
  }
  stdout.write(opcions.json ? json : formataText(informe));
  return informe.porta.exit;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = await main();
