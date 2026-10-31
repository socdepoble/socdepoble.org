#!/usr/bin/env node
/* P1-23 (ordre del Mestre, 30-10-2026; decisió 6 de l'encàrrec) · El comprovador
 * de reproductibilitat del frontal, executable sense Nix.
 *
 *   node tooling/seo/comprova-reproductibilitat.mjs --treball /tmp/sdp [--recepta flake|vite]
 *        [--epoca 1793288187] [--origen https://socdepoble.org] [--exigeix ap/actors/]…
 *        [--sense-exigencies] [--nomes-versionats] [--sense-variacions] [--conserva] [--json]
 *
 * Què fa, i per què així:
 *   1. Pren una instantània de les fonts que veu el flake: els camins de
 *      lib.fileset.unions de flake.nix (entre «# sdp:font-inici» i «# sdp:font-fi»),
 *      dels fitxers que git versiona o versionaria (--cached --others
 *      --exclude-standard; amb --nomes-versionats, només els versionats, com Nix).
 *      L'arbre és compartit i es mou: les dues construccions partixen de la
 *      MATEIXA instantània, no de l'arbre viu.
 *   2. La copia a dos directoris temporals de rutes diferents (mai dins del
 *      repositori: ni dist/ ni cap altre), amb node_modules com a directori real
 *      d'enllaços, un per paquet (mai un enllaç a la carpeta sencera: la caché de
 *      Vite aniria a parar a l'arbre viu).
 *   3. Executa en cada còpia la mateixa recepta amb el mateix SOURCE_DATE_EPOCH:
 *      «flake» són les línies de buildPhase de flake.nix (entre
 *      «# sdp:recepta-inici» i «# sdp:recepta-fi»), «vite» només `npm run build:web`.
 *      Entorn net i igual al del flake (configuració d'exemple llegida de
 *      flake.nix, sense xarxa remota per al prerender social), amb dues variacions
 *      deliberades que Nix no té però un build fora de Nix sí: zona horària i
 *      locale (UTC/C contra Europe/Madrid/ca_ES).
 *   4. Compara el SHA-256 de cada fitxer de dist/ (també els que comencen per
 *      punt i els JSON-LD federats de /ap/) i, si n'hi ha cap de diferent, en
 *      mostra el primer byte que canvia.
 * Codis d'eixida: 0 reproduïble; 1 no reproduïble o falta un prefix exigit;
 * 2 ús o entorn; 3 una construcció ha fallat.
 * No desplega res, no escriu dins del repositori i no fa cap petició de xarxa
 * pròpia (el prerender social s'hi executa amb SDP_SOCIAL_SENSE_REMOT=1). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { arrel as arrelDelProjecte } from '../lib/arrel.mjs';

export const ESQUEMA = 'sdp.reproduible.v1';
export const MARQUES_FONT = Object.freeze(['# sdp:font-inici', '# sdp:font-fi']);
export const MARQUES_RECEPTA = Object.freeze(['# sdp:recepta-inici', '# sdp:recepta-fi']);
export const ORIGEN_PER_DEFECTE = 'https://socdepoble.org';
/* Els JSON-LD estàtics que l'ordre del Mestre (30-10-2026) vol al build web. */
export const EXIGITS_PER_DEFECTE = Object.freeze(['ap/actors/', 'ap/outbox/']);
/* Les dues variacions: la primera s'assembla al sandbox de Nix, la segona al Mac del Mestre. */
export const VARIACIONS = Object.freeze([
  Object.freeze({ id: 'a', TZ: 'UTC', LANG: 'C', LC_ALL: 'C' }),
  Object.freeze({ id: 'b', TZ: 'Europe/Madrid', LANG: 'ca_ES.UTF-8', LC_ALL: 'ca_ES.UTF-8' })
]);

const sha256 = (dades) => createHash('sha256').update(dades).digest('hex');

/** Les línies entre dues marques (sense les marques). Cada marca hi ha de ser una sola vegada i en ordre. */
export function entreMarques(text, [inici, fi]) {
  const linies = String(text).split('\n');
  const posicions = (marca) => linies.flatMap((l, i) => (l.trim() === marca ? [i] : []));
  const [a, b] = [posicions(inici), posicions(fi)];
  if (a.length !== 1 || b.length !== 1 || a[0] >= b[0]) {
    throw new Error(`flake.nix: calen les marques «${inici}» i «${fi}», una vegada cada una i en este ordre`);
  }
  return linies.slice(a[0] + 1, b[0]);
}

const significatives = (linies) => linies.map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

/** Els camins de la font del flake (lib.fileset.unions), relatius a l'arrel. Cap «..», cap camí absolut. */
export function fontDelFlake(textFlake) {
  const camins = significatives(entreMarques(textFlake, MARQUES_FONT)).map((linia) => {
    const m = /^\.\/([A-Za-z0-9_.@-][A-Za-z0-9_.@/-]*)$/.exec(linia);
    if (!m || m[1].split('/').some((s) => s === '' || s === '.' || s === '..')) {
      throw new Error(`flake.nix: entrada de font no admesa: ${linia}`);
    }
    return m[1];
  });
  if (!camins.length) throw new Error('flake.nix: la font del flake és buida');
  return camins;
}

/* Un argument de la recepta: paraules planes, o "$SDP_ORIGEN" (l'origen de la instància). */
const ARGUMENT = /^[A-Za-z0-9_.:/=@+-]+$/;
/** Les ordres de buildPhase entre marques, com a vectors d'arguments; "$SDP_ORIGEN" → «{origen}».
 *  Res de shell: ni «&&», ni «;», ni redireccions, ni cap altra variable. */
export function receptaDelFlake(textFlake) {
  const ordres = significatives(entreMarques(textFlake, MARQUES_RECEPTA)).map((linia) => linia.split(/\s+/).map((paraula) => {
    if (paraula === '"$SDP_ORIGEN"') return '{origen}';
    if (!ARGUMENT.test(paraula)) throw new Error(`flake.nix: la recepta només admet ordres planes; «${paraula}» no ho és`);
    return paraula;
  }));
  if (!ordres.length) throw new Error('flake.nix: la recepta és buida');
  return ordres;
}

/** La configuració d'exemple del flake (bloc `exemple = { … };`): el backend fictici i el mode de dades. */
export function exempleDelFlake(textFlake) {
  const bloc = /\n\s*exemple = \{([^}]*)\};/.exec(String(textFlake));
  if (!bloc) throw new Error('flake.nix: falta el bloc «exemple = { … };»');
  const valors = Object.fromEntries([...bloc[1].matchAll(/(\w+) = "([^"$\\]*)";/g)].map((m) => [m[1], m[2]]));
  for (const clau of ['supabaseUrl', 'clauPublica', 'modeDades']) {
    if (!valors[clau]) throw new Error(`flake.nix: l'exemple no porta ${clau}`);
  }
  return valors;
}

/** Les receptes que sap executar: la del flake (sencera) o només el vite build del frontal. */
export function receptaPerNom(nom, textFlake) {
  if (nom === 'flake') return receptaDelFlake(textFlake);
  if (nom === 'vite') return [['npm', 'run', 'build:web']];
  throw new Error(`Recepta desconeguda: ${nom} (flake o vite)`);
}

/** L'entorn de cada construcció: res heretat que puga canviar el resultat (cap VITE_*, cap CI). */
export function entornDeBuild({ base = process.env, epoca, origen = ORIGEN_PER_DEFECTE, exemple, variacio, home }) {
  const entorn = {};
  for (const clau of ['PATH', 'TMPDIR', 'USER', 'LOGNAME', 'SHELL']) if (base[clau]) entorn[clau] = base[clau];
  return Object.assign(entorn, {
    HOME: home,
    npm_config_cache: path.join(home, '.npm'),
    npm_config_update_notifier: 'false',
    npm_config_fund: 'false',
    npm_config_audit: 'false',
    NO_COLOR: '1',
    SOURCE_DATE_EPOCH: String(epoca),
    HUSKY: '0',
    SDP_SOCIAL_SENSE_REMOT: '1',
    SDP_ORIGEN: origen,
    VITE_SUPABASE_URL: exemple.supabaseUrl,
    VITE_SUPABASE_ANON_KEY: exemple.clauPublica,
    VITE_DATA_MODE: exemple.modeDades,
    TZ: variacio.TZ,
    LANG: variacio.LANG,
    LC_ALL: variacio.LC_ALL
  }, origen === ORIGEN_PER_DEFECTE ? {} : { VITE_CANONICAL_URL: origen });
}

/** Cap directori de treball dins del repositori (ni dist/ ni cap altre). Torna el camí real. */
export function validaTreball(arrel, treball) {
  if (!treball) throw new Error('Cal --treball DIRECTORI (fora del repositori)');
  const real = fs.realpathSync(path.resolve(treball));
  const arrelReal = fs.realpathSync(arrel);
  const rel = path.relative(arrelReal, real);
  if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
    throw new Error(`El directori de treball és dins del repositori (${real}): tria'n un de fora`);
  }
  return real;
}

/** Els fitxers de la font: git ls-files sobre els camins del flake, ordenats i existents. */
export function fitxersDeLaFont(arrel, camins, { nomesVersionats = false } = {}) {
  const args = ['ls-files', '-z', '--cached', ...(nomesVersionats ? [] : ['--others', '--exclude-standard']), '--', ...camins];
  const r = spawnSync('git', args, { cwd: arrel, encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });
  if (r.error || r.status !== 0) throw new Error(`git ls-files ha fallat: ${r.error?.message || r.stderr.toString().trim()}`);
  const llista = [...new Set(r.stdout.toString('utf8').split('\0').filter(Boolean))].sort();
  const absents = [];
  const presents = llista.filter((rel) => {
    try { fs.lstatSync(path.join(arrel, rel)); return true; } catch { absents.push(rel); return false; }
  });
  const senseCap = camins.filter((cami) => !presents.some((rel) => rel === cami || rel.startsWith(`${cami}/`)));
  if (senseCap.length) throw new Error(`Camins del flake sense cap fitxer: ${senseCap.join(', ')}`);
  return { fitxers: presents, absents };
}

/** Copia la instantània (fitxers regulars i enllaços tal qual) i en torna l'inventari de la font. */
export function copiaFont(arrel, fitxers, desti) {
  const inventari = new Map();
  for (const rel of fitxers) {
    const origen = path.join(arrel, rel);
    const objectiu = path.join(desti, rel);
    fs.mkdirSync(path.dirname(objectiu), { recursive: true });
    const stat = fs.lstatSync(origen);
    if (stat.isSymbolicLink()) {
      const enllac = fs.readlinkSync(origen);
      fs.symlinkSync(enllac, objectiu);
      inventari.set(rel, `enllac:${enllac}`);
    } else if (stat.isFile()) {
      const dades = fs.readFileSync(origen);
      fs.writeFileSync(objectiu, dades);
      inventari.set(rel, sha256(dades));
    }
  }
  return inventari;
}

/** Copia un directori ja copiat (la segona construcció parteix dels mateixos bytes). */
export function copiaArbre(origen, desti) {
  fs.cpSync(origen, desti, { recursive: true, verbatimSymlinks: true });
}

/** node_modules com a directori real amb un enllaç per paquet (i per paquet dins de cada @àmbit, i .bin). */
export function enllacaNodeModules(origen, desti) {
  fs.mkdirSync(desti);
  if (!fs.existsSync(origen)) return 0;
  let n = 0;
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    if (entrada.name.startsWith('.') && entrada.name !== '.bin') continue;
    const o = path.join(origen, entrada.name);
    const d = path.join(desti, entrada.name);
    if (entrada.name.startsWith('@') && entrada.isDirectory()) {
      fs.mkdirSync(d);
      for (const paquet of fs.readdirSync(o)) { fs.symlinkSync(path.join(o, paquet), path.join(d, paquet)); n += 1; }
    } else {
      fs.symlinkSync(o, d);
      n += 1;
    }
  }
  return n;
}

/** Quants paquets del node_modules viu coincidixen amb package-lock.json (la font de Nix és el lockfile). */
export function contrastaNodeModules(arrel) {
  let lock;
  try { lock = JSON.parse(fs.readFileSync(path.join(arrel, 'package-lock.json'), 'utf8')); } catch { return null; }
  const resum = { coincidents: 0, diferents: [], absents: 0, opcionalsAbsents: 0 };
  for (const [clau, entrada] of Object.entries(lock.packages || {})) {
    if (!clau.startsWith('node_modules/') || entrada.link) continue;
    let versio = null;
    try { versio = JSON.parse(fs.readFileSync(path.join(arrel, clau, 'package.json'), 'utf8')).version; } catch { /* absent */ }
    if (versio === null) { if (entrada.optional) resum.opcionalsAbsents += 1; else resum.absents += 1; }
    else if (versio === entrada.version) resum.coincidents += 1;
    else resum.diferents.push(`${clau.slice('node_modules/'.length)} ${versio} ≠ ${entrada.version}`);
  }
  return resum;
}

/** L'inventari d'un directori: camí relatiu (amb «/») → SHA-256, o «enllac:<destí>» per a un enllaç. */
export function inventari(dir) {
  const eixida = new Map();
  (function camina(rel) {
    for (const entrada of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const fill = rel ? `${rel}/${entrada.name}` : entrada.name;
      const abs = path.join(dir, fill);
      if (entrada.isSymbolicLink()) eixida.set(fill, `enllac:${fs.readlinkSync(abs)}`);
      else if (entrada.isDirectory()) camina(fill);
      else if (entrada.isFile()) eixida.set(fill, sha256(fs.readFileSync(abs)));
      else eixida.set(fill, 'especial');
    }
  }(''));
  return new Map([...eixida.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/** El digest del llistat «hash  camí» ordenat (el format de sha256sum). */
export function digestDelLlistat(inv) {
  const linies = [...inv.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([rel, hash]) => `${hash}  ${rel}\n`);
  return sha256(linies.join(''));
}

export function comparaInventaris(a, b) {
  const nomesA = [...a.keys()].filter((rel) => !b.has(rel));
  const nomesB = [...b.keys()].filter((rel) => !a.has(rel));
  const diferents = [...a.keys()].filter((rel) => b.has(rel) && a.get(rel) !== b.get(rel));
  return { identics: !nomesA.length && !nomesB.length && !diferents.length, nomesA, nomesB, diferents };
}

/** On canvien dos fitxers: el primer byte diferent i un tros de context de cada costat. */
export function primeraDiferencia(fitxerA, fitxerB, context = 40) {
  const [x, y] = [fs.readFileSync(fitxerA), fs.readFileSync(fitxerB)];
  let i = 0;
  const limit = Math.min(x.length, y.length);
  while (i < limit && x[i] === y[i]) i += 1;
  if (i === limit && x.length === y.length) return null;
  const tros = (buf) => buf.subarray(Math.max(0, i - context), Math.min(buf.length, i + context)).toString('utf8');
  return { offset: i, midaA: x.length, midaB: y.length, a: tros(x), b: tros(y) };
}

/** Un prefix exigit (p. ex. ap/actors/) i quants fitxers el porten a la primera construcció. */
export function exigencies(inv, prefixos) {
  return prefixos.map((prefix) => ({ prefix, fitxers: [...inv.keys()].filter((rel) => rel.startsWith(prefix)).length }));
}

/** L'època per defecte: SOURCE_DATE_EPOCH si és un enter, si no la data del commit de HEAD (la de self.lastModified). */
export function epocaPerDefecte(arrel, env = process.env) {
  if (env.SOURCE_DATE_EPOCH && /^\d+$/.test(env.SOURCE_DATE_EPOCH)) return { epoca: Number(env.SOURCE_DATE_EPOCH), font: 'SOURCE_DATE_EPOCH' };
  const r = spawnSync('git', ['log', '-1', '--format=%ct', 'HEAD'], { cwd: arrel, encoding: 'utf8' });
  const valor = (r.stdout || '').trim();
  if (r.status !== 0 || !/^\d+$/.test(valor)) throw new Error('Sense SOURCE_DATE_EPOCH ni commit de HEAD: passa --epoca');
  return { epoca: Number(valor), font: 'git log -1 --format=%ct (HEAD)' };
}

function executa(ordres, { cwd, env, origen, registre }) {
  const fd = fs.openSync(registre, 'w');
  try {
    for (const ordre of ordres) {
      const argv = ordre.map((a) => (a === '{origen}' ? origen : a));
      fs.writeSync(fd, `$ ${argv.join(' ')}\n`);
      const r = spawnSync(argv[0], argv.slice(1), { cwd, env, stdio: ['ignore', fd, fd] });
      if (r.error || r.status !== 0) return { ok: false, ordre: argv.join(' '), codi: r.status, error: r.error?.message };
    }
    return { ok: true };
  } finally {
    fs.closeSync(fd);
  }
}

/* Les últimes línies del registre, cada una fitada (els avisos de Vite en fan de quilòmetres). */
const cua = (fitxer, linies = 25, ample = 400) => {
  try {
    return fs.readFileSync(fitxer, 'utf8').trimEnd().split('\n').slice(-linies)
      .map((l) => (l.length > ample ? `${l.slice(0, ample)} …(${l.length - ample} caràcters més)` : l)).join('\n');
  } catch { return ''; }
};

/**
 * Les dues construccions i la comparació. Torna l'informe (esquema sdp.reproduible.v1) i el codi d'eixida.
 * Injectable per a les proves: arrel, flake, origen de node_modules i les variacions.
 */
export function comprova({
  arrel, treball, flake = path.join(arrel, 'flake.nix'), nodeModules = path.join(arrel, 'node_modules'),
  recepta = 'flake', epoca = null, origen = ORIGEN_PER_DEFECTE, exigits = EXIGITS_PER_DEFECTE,
  nomesVersionats = false, variacions = VARIACIONS, conserva = false, base = process.env
}) {
  const textFlake = fs.readFileSync(flake, 'utf8');
  const camins = fontDelFlake(textFlake);
  const ordres = receptaPerNom(recepta, textFlake);
  const exemple = exempleDelFlake(textFlake);
  const ep = epoca === null ? epocaPerDefecte(arrel, base) : { epoca, font: '--epoca' };
  const desti = fs.mkdtempSync(path.join(validaTreball(arrel, treball), 'sdp-reproduible-'));
  const informe = {
    esquema: ESQUEMA, recepta, ordres: ordres.map((o) => o.join(' ')), sourceDateEpoch: ep.epoca, fontEpoca: ep.font,
    origen, treball: desti, nodeModules: contrastaNodeModules(arrel)
  };

  const { fitxers, absents } = fitxersDeLaFont(arrel, camins, { nomesVersionats });
  const primera = path.join(desti, variacions[0].id, 'font');
  const invFont = copiaFont(arrel, fitxers, primera);
  informe.font = { camins, fitxers: invFont.size, esborratsAlDisc: absents.length, digestDelLlistat: digestDelLlistat(invFont) };

  // La segona còpia ix de la primera abans de construir res: els mateixos bytes, una altra ruta.
  const copies = variacions.map((v, i) => {
    const cami = i === 0 ? primera : path.join(desti, `${v.id}-una-altra-ruta-mes-llarga`, 'font');
    if (i > 0) copiaArbre(primera, cami);
    return cami;
  });

  informe.construccions = [];
  for (const [i, v] of variacions.entries()) {
    const cwd = copies[i];
    enllacaNodeModules(nodeModules, path.join(cwd, 'node_modules'));
    const home = path.join(path.dirname(cwd), 'home');
    fs.mkdirSync(home, { recursive: true });
    const env = entornDeBuild({ base, epoca: ep.epoca, origen, exemple, variacio: v, home });
    const registre = path.join(path.dirname(cwd), 'build.log');
    const inici = process.hrtime.bigint();
    const r = executa(ordres, { cwd, env, origen, registre });
    const segons = Number(process.hrtime.bigint() - inici) / 1e9;
    if (!r.ok) {
      informe.construccions.push({ id: v.id, ok: false, ordre: r.ordre, codi: r.codi, error: r.error, registre, cua: cua(registre) });
      return { informe, codi: 3 };
    }
    const dist = path.join(cwd, 'dist');
    if (!fs.existsSync(dist)) {
      informe.construccions.push({ id: v.id, ok: false, error: 'la recepta no ha deixat cap dist/', registre });
      return { informe, codi: 3 };
    }
    const inv = inventari(dist);
    informe.construccions.push({
      id: v.id, ok: true, cami: cwd, variacio: { TZ: v.TZ, LANG: v.LANG }, segons: Math.round(segons * 10) / 10,
      fitxers: inv.size, digestDelLlistat: digestDelLlistat(inv), inv
    });
  }

  const [a, b] = informe.construccions;
  const comparacio = comparaInventaris(a.inv, b.inv);
  informe.identiques = comparacio.identics;
  informe.diferencies = {
    nomesA: comparacio.nomesA, nomesB: comparacio.nomesB, diferents: comparacio.diferents,
    mostres: comparacio.diferents.slice(0, 5).map((rel) => ({
      fitxer: rel, ...(primeraDiferencia(path.join(a.cami, 'dist', rel), path.join(b.cami, 'dist', rel)) || {})
    }))
  };
  informe.federacio = [...a.inv.keys()].filter((rel) => rel.startsWith('ap/') || rel.startsWith('.well-known/'));
  informe.exigits = exigencies(a.inv, exigits);
  for (const c of informe.construccions) delete c.inv;

  const falten = informe.exigits.filter((e) => e.fitxers === 0);
  const codi = !informe.identiques || falten.length ? 1 : 0;
  if (codi === 0 && !conserva) {
    fs.rmSync(desti, { recursive: true, force: true });
    informe.treball = null;
  }
  return { informe, codi };
}

function llegixArguments(argv) {
  const opcions = { recepta: 'flake', exigits: [...EXIGITS_PER_DEFECTE], epoca: null, origen: ORIGEN_PER_DEFECTE };
  let exigitsExplicits = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const valor = () => {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} necessita un valor`);
      i += 1;
      return v;
    };
    if (a.startsWith('--arrel=')) continue; // el llig tooling/lib/arrel.mjs
    else if (a === '--treball') opcions.treball = valor();
    else if (a === '--recepta') opcions.recepta = valor();
    else if (a === '--epoca') {
      const v = valor();
      if (!/^\d+$/.test(v)) throw new Error('--epoca ha de ser un enter (segons des de 1970)');
      opcions.epoca = Number(v);
    } else if (a === '--origen') {
      const v = valor();
      const url = new URL(v);
      if (url.protocol !== 'https:' || url.href !== `${url.origin}/`) throw new Error('--origen ha de ser un origen https net');
      opcions.origen = url.origin;
    } else if (a === '--exigeix') {
      if (!exigitsExplicits) { opcions.exigits = []; exigitsExplicits = true; }
      opcions.exigits.push(valor());
    } else if (a === '--sense-exigencies') opcions.exigits = [];
    else if (a === '--nomes-versionats') opcions.nomesVersionats = true;
    else if (a === '--sense-variacions') opcions.variacions = VARIACIONS.map((v) => ({ ...VARIACIONS[0], id: v.id }));
    else if (a === '--conserva') opcions.conserva = true;
    else if (a === '--json') opcions.json = true;
    else throw new Error(`Opció desconeguda: ${a}`);
  }
  if (!opcions.treball) opcions.treball = os.tmpdir();
  return opcions;
}

function imprimix(informe, codi) {
  const l = [];
  l.push(`Recepta ${informe.recepta} · SOURCE_DATE_EPOCH=${informe.sourceDateEpoch} (${informe.fontEpoca}) · origen ${informe.origen}`);
  if (informe.font) l.push(`Font: ${informe.font.fitxers} fitxers de ${informe.font.camins.length} camins del flake · digest ${informe.font.digestDelLlistat}`);
  if (informe.nodeModules) {
    const nm = informe.nodeModules;
    l.push(`node_modules viu contra package-lock.json: ${nm.coincidents} coincidents, ${nm.diferents.length} diferents, ${nm.absents} absents (+${nm.opcionalsAbsents} opcionals d'altres plataformes)`);
  }
  for (const c of informe.construccions || []) {
    if (c.ok) l.push(`Construcció ${c.id} (TZ=${c.variacio.TZ}, LANG=${c.variacio.LANG}): ${c.fitxers} fitxers en ${c.segons} s · digest ${c.digestDelLlistat}`);
    else l.push(`Construcció ${c.id} FALLADA: ${c.ordre || ''} ${c.error || `codi ${c.codi}`}\n  registre: ${c.registre}\n${c.cua || ''}`);
  }
  if (codi !== 3 && informe.identiques !== undefined) {
    l.push(informe.identiques ? 'REPRODUÏBLE: els dos dist/ són idèntics byte a byte.' : 'NO REPRODUÏBLE:');
    const d = informe.diferencies;
    for (const rel of d.nomesA) l.push(`  només a la primera: ${rel}`);
    for (const rel of d.nomesB) l.push(`  només a la segona: ${rel}`);
    for (const m of d.mostres) l.push(`  diferent: ${m.fitxer} · byte ${m.offset} (${m.midaA} / ${m.midaB} B)\n    a: ${JSON.stringify(m.a)}\n    b: ${JSON.stringify(m.b)}`);
    if (d.diferents.length > d.mostres.length) l.push(`  … i ${d.diferents.length - d.mostres.length} fitxers diferents més`);
    l.push(`Federació al dist/: ${informe.federacio.length} fitxers${informe.federacio.length ? ` (${informe.federacio.slice(0, 8).join(', ')}${informe.federacio.length > 8 ? ', …' : ''})` : ''}`);
    for (const e of informe.exigits) l.push(`  exigit ${e.prefix}: ${e.fitxers} fitxers${e.fitxers ? '' : ' · FALTA'}`);
  }
  if (informe.treball) l.push(`Directori de treball conservat: ${informe.treball}`);
  return `${l.join('\n')}\n`;
}

/**
 * La CLI. L'arrel ix dels MATEIXOS argv i env que rep (--arrel=…, SDP_ARREL o l'estructura), no
 * dels del procés: cridada amb uns altres argv, no construïx en silenci l'arbre on viu el mòdul.
 * L'env és també la base de l'entorn de build i de l'època per defecte (SOURCE_DATE_EPOCH).
 */
export function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr, env = process.env } = {}) {
  let opcions;
  try {
    opcions = llegixArguments(argv);
  } catch (error) {
    stderr.write(`${error.message}\nÚs: node tooling/seo/comprova-reproductibilitat.mjs --treball DIR [--recepta flake|vite] [--epoca N] [--origen URL] [--exigeix PREFIX]… [--sense-exigencies] [--nomes-versionats] [--sense-variacions] [--conserva] [--json]\n`);
    return 2;
  }
  try {
    const { informe, codi } = comprova({ ...opcions, arrel: arrelDelProjecte({ argv, env }), base: env });
    stdout.write(opcions.json ? `${JSON.stringify(informe, null, 2)}\n` : imprimix(informe, codi));
    return codi;
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 2;
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
