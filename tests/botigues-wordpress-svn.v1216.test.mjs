/* tests/botigues-wordpress-svn.v1216.test.mjs — Onada v1.2.16 (prompt 261121_0216, T3.3). El publicador
   de WordPress.org per SVN amb Docker (scripts/botigues/puja-wordpress-svn.mjs): el paquet --directori
   verificat en local (zip sencer, versions, 10 MiB), la contrasenya que mai ix per argv, entorn ni
   eixida (només stdin), el sec que no escriu res i les refuses (tag amb un altre contingut, versió que
   no casa o més vella, zip massa gran, contrasenya amb permisos oberts o enllaçada, «sí» d'un altre zip,
   i, des del Gauntlet R2, contingut alié al paquet segons la política IDEA-62 compartida amb empaqueta.mjs).
   Un docker FALS (un executable de prova, injectat a main) fa de contenidor i de WordPress.org: apunta
   cada crida (argv, entorn i stdin) i, de propòsit, escriu la contrasenya a l'eixida per a provar el
   filtre. Cap xarxa, cap docker de veres, cap fitxer del repositori ni de ~/claus-socdepoble: tot a mkdtemp. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { EIXIDA } from '../scripts/botigues/entorn.mjs';
import * as svn from '../scripts/botigues/puja-wordpress-svn.mjs';

const TEMPORAL = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-v1216-wpsvn-')));
process.on('exit', () => fs.rmSync(TEMPORAL, { recursive: true, force: true }));
const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');
/* La contrasenya de proves es munta per parts (la porta de literals secrets no hi ha de vore cap credencial),
   amb un espai, una arrova i dos punts perquè les formes en Basic i en URL siguen diferents. */
const CONTRASENYA = ['prova', 'NOMES local', `v1216@wp:${crypto.randomBytes(6).toString('hex')}`].join('-');
const FORMES = [CONTRASENYA, Buffer.from(`socdepoble:${CONTRASENYA}`).toString('base64'), encodeURIComponent(CONTRASENYA)];

/* ───────────── Un zip de proves (guardat o deflate, amb el CRC32 i el mode Unix que es vulga) ───────────── */
function fesZip(entrades) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { nom, dades, metode = 8, mode = 0o100644, bandera = 0x800, crc = null } of entrades) {
    const nomB = Buffer.from(nom, 'utf8');
    const cru = Buffer.from(dades);
    const comp = metode === 8 ? zlib.deflateRawSync(cru) : cru;
    const suma = (crc ?? zlib.crc32(cru)) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(bandera, 6); local.writeUInt16LE(metode, 8);
    local.writeUInt32LE(suma, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(cru.length, 22); local.writeUInt16LE(nomB.length, 26);
    locals.push(local, nomB, comp);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE((3 << 8) | 20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(bandera, 8);
    central.writeUInt16LE(metode, 10); central.writeUInt32LE(suma, 16); central.writeUInt32LE(comp.length, 20); central.writeUInt32LE(cru.length, 24);
    central.writeUInt16LE(nomB.length, 28); central.writeUInt32LE((mode << 16) >>> 0, 38); central.writeUInt32LE(offset, 42);
    centrals.push(central, nomB);
    offset += 30 + nomB.length + comp.length;
  }
  const directori = Buffer.concat(centrals);
  const fi = Buffer.alloc(22);
  fi.writeUInt32LE(0x06054b50, 0); fi.writeUInt16LE(entrades.length, 8); fi.writeUInt16LE(entrades.length, 10);
  fi.writeUInt32LE(directori.length, 12); fi.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directori, fi]);
}

const PHP = (versio, extra = '') => `<?php\n/**\n * Plugin Name:       Sóc de Poble. Portal de Pobles Connectats\n * Version:           ${versio}\n${extra} */\n`;
/* Els fitxers d'un connector (rutes dins de socdepoble/). */
const fitxersDe = (versio, { stable = versio, php = PHP(versio), mes = {} } = {}) => ({
  'readme.txt': `=== Sóc de Poble ===\nStable tag: ${stable}\n`, 'socdepoble-enxufe.php': php, 'uninstall.php': '<?php // desinstal·la\n',
  'includes/ajustos.php': '<?php // ajustos\n', 'dist/app.js': 'console.log("Sóc de Poble!");\n', ...mes
});
const zipDe = (fitxers) => fesZip(Object.entries(fitxers).map(([ruta, dades]) => ({ nom: `socdepoble/${ruta}`, dades })));
const escriuZip = (nom, octets, { sha = true } = {}) => {
  const carpeta = fs.mkdtempSync(path.join(TEMPORAL, 'zip-'));
  const cami = path.join(carpeta, nom);
  fs.writeFileSync(cami, octets);
  if (sha) fs.writeFileSync(`${cami}.sha256`, `${sha256(octets)}  ${nom}\n`);
  return cami;
};
const NOU = fitxersDe('1.1.24', { mes: { 'includes/nou.php': '<?php // nou\n', 'dist/trossos/x.js': 'export default 1;\n' } });
const VELL = fitxersDe('1.1.23', { mes: { 'includes/vell.php': '<?php // vell\n', 'vell/a.js': 'a', 'vell/b.js': 'b' } });

/* ───────────── La contrasenya de proves (0600, de l'usuari) ───────────── */
function fitxerDeContrasenya(text = `${CONTRASENYA}\n`, mode = 0o600) {
  const cami = path.join(fs.mkdtempSync(path.join(TEMPORAL, 'clau-')), 'wp-svn.pass');
  fs.writeFileSync(cami, text, { mode });
  fs.chmodSync(cami, mode);
  return cami;
}

/* ───────────── El docker fals ───────────── */
const DOCKER_FALS = `#!${process.execPath}
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = __dirname;
const escenari = JSON.parse(fs.readFileSync(path.join(dir, 'escenari.json'), 'utf8'));
const args = process.argv.slice(2);
let stdin = '';
try { stdin = fs.readFileSync(0, 'utf8'); } catch { stdin = ''; }
const vol = args[args.indexOf('-v') + 1];
const wc = vol.slice(0, vol.lastIndexOf(':/sdp/wc'));
const script = args[args.indexOf('-euc') + 1];
const posicionals = args.slice(args.indexOf('sdp-svn') + 1);
const mode = script.includes('commit') ? 'publica' : 'consulta';
const llista = (arrel) => {
  const fitxers = {};
  const visita = (d, prefix) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.svn') continue;
      const ruta = prefix ? prefix + '/' + e.name : e.name;
      if (e.isDirectory()) visita(path.join(d, e.name), ruta);
      else fitxers[ruta] = crypto.createHash('sha256').update(fs.readFileSync(path.join(d, e.name))).digest('hex');
    }
  };
  visita(arrel, '');
  return fitxers;
};
const crida = { mode, args, env: process.env, stdin, posicionals };
const posa = (arrel, fitxers) => {
  fs.mkdirSync(arrel, { recursive: true });
  for (const [ruta, text] of Object.entries(fitxers || {})) {
    fs.mkdirSync(path.dirname(path.join(arrel, ruta)), { recursive: true });
    fs.writeFileSync(path.join(arrel, ruta), text);
  }
};
if (mode === 'consulta') {
  fs.appendFileSync(path.join(dir, 'crides.jsonl'), JSON.stringify(crida) + '\\n');
  if (escenari.fallaConsulta) { process.stderr.write('svn: E170013: Unable to connect to a repository\\n'); process.exit(1); }
  const repo = path.join(wc, 'repo');
  fs.mkdirSync(path.join(repo, '.svn'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.svn', 'wc.db'), 'fals');
  for (const d of ['assets', 'branches', 'tags']) fs.mkdirSync(path.join(repo, d), { recursive: true });
  /* Gauntlet v1.2.16 · Un repositori hostil (svn:special a l'arrel): trunk/ o un tag com a enllaç cap a fora. */
  if (escenari.trunkEnllac) fs.symlinkSync(escenari.trunkEnllac, path.join(repo, 'trunk'));
  else posa(path.join(repo, 'trunk'), escenari.trunk);
  for (const [tag, fitxers] of Object.entries(escenari.tags || {})) posa(path.join(repo, 'tags', tag), fitxers);
  for (const [tag, desti] of Object.entries(escenari.tagsEnllac || {})) fs.symlinkSync(desti, path.join(repo, 'tags', tag));
  process.stdout.write('revisió de WordPress.org: 100\\n');
  process.exit(0);
}
crida.afig = fs.readFileSync(path.join(wc, 'afig.txt'), 'utf8');
crida.elimina = fs.readFileSync(path.join(wc, 'elimina.txt'), 'utf8');
crida.trunk = llista(path.join(wc, 'repo', 'trunk'));
fs.appendFileSync(path.join(dir, 'crides.jsonl'), JSON.stringify(crida) + '\\n');
const clau = stdin.replace(/\\n$/, '');
/* Un svn hostil: escriu la contrasenya, en Basic i en URL, a les dues eixides. */
process.stdout.write('svn: depuracio: contrasenya=' + clau + '\\n');
process.stderr.write('Authorization: Basic ' + Buffer.from('socdepoble:' + clau).toString('base64') + '\\n');
process.stdout.write('url: https://socdepoble:' + encodeURIComponent(clau) + '@plugins.svn.wordpress.org/socdepoble\\n');
if (escenari.fallaCommit) { process.stderr.write('svn: E175002: Commit failed\\n'); process.exit(1); }
process.stdout.write('Committed revision 4242.\\n');
`;

function dockerFals(escenari = {}) {
  const carpeta = fs.mkdtempSync(path.join(TEMPORAL, 'docker-'));
  const cami = path.join(carpeta, 'docker');
  fs.writeFileSync(cami, DOCKER_FALS, { mode: 0o755 });
  fs.chmodSync(cami, 0o755);
  fs.writeFileSync(path.join(carpeta, 'escenari.json'), JSON.stringify(escenari));
  const crides = () => {
    try { return fs.readFileSync(path.join(carpeta, 'crides.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; }
  };
  return { cami, crides };
}

/* La pantalla de main, sencera (els trossos binaris són del corredor de node --test). */
async function ambPantalla(fes) {
  const [eixida, errada] = [process.stdout.write, process.stderr.write];
  let vist = '';
  const captura = (original, flux) => (tros, ...resta) => {
    if (typeof tros !== 'string') return original.call(flux, tros, ...resta);
    vist += tros;
    return true;
  };
  process.stdout.write = captura(eixida, process.stdout);
  process.stderr.write = captura(errada, process.stderr);
  try {
    const codi = await fes();
    return { codi, vist };
  } finally {
    process.stdout.write = eixida;
    process.stderr.write = errada;
  }
}

const apiFalsa = (versio = '1.1.24') => {
  const vistes = [];
  return { vistes, consulta: async () => { vistes.push('GET'); return { versio }; } };
};
const executa = (args, { docker, contrasenya = fitxerDeContrasenya(), api = apiFalsa() } = {}) => ambPantalla(() => svn.main(args, {
  docker: docker.cami, contrasenya, consultaApi: api.consulta, temporal: TEMPORAL
}));
const senseTreball = () => assert.deepEqual(fs.readdirSync(TEMPORAL).filter((nom) => nom.startsWith('sdp-wp-svn-')), [], 'cap carpeta de treball queda');
const senseContrasenya = (text, on) => {
  for (const forma of FORMES) assert.ok(!String(text).includes(forma), `la contrasenya ha eixit a ${on}`);
};

/* ───────────── Peces pures ───────────── */

test('v1.2.16 · el zip: s\'entén sencer i les entrades perilloses o trencades es refusen', () => {
  const bo = svn.llegixZip(zipDe(fitxersDe('1.1.24')));
  assert.deepEqual(bo.map((e) => e.nom).sort(), ['socdepoble/dist/app.js', 'socdepoble/includes/ajustos.php', 'socdepoble/readme.txt', 'socdepoble/socdepoble-enxufe.php', 'socdepoble/uninstall.php']);
  // Guardat i amb una carpeta declarada, també.
  assert.equal(svn.llegixZip(fesZip([{ nom: 'socdepoble/', dades: '' }, { nom: 'socdepoble/readme.txt', dades: 'x', metode: 0 }])).length, 1);
  const dolent = (entrada, motiu, codi = EIXIDA.ARBRE) => assert.throws(() => svn.llegixZip(fesZip([entrada])), (error) => error.codi === codi && motiu.test(error.message), entrada.nom);
  dolent({ nom: 'socdepoble/../fora.php', dades: 'x' }, /«\.\.»/);
  dolent({ nom: '/socdepoble/readme.txt', dades: 'x' }, /ruta absoluta/);
  dolent({ nom: 'altre/readme.txt', dades: 'x' }, /no és dins de socdepoble\//);
  dolent({ nom: 'socdepoble\\readme.txt', dades: 'x' }, /caràcters de control o reservats/);
  dolent({ nom: 'socdepoble/.svn/wc.db', dades: 'x' }, /\.svn/);
  dolent({ nom: 'socdepoble/__MACOSX/x', dades: 'x' }, /__MACOSX/);
  dolent({ nom: 'socdepoble/.DS_Store', dades: 'x' }, /\.DS_Store/);
  dolent({ nom: 'socdepoble/enllac', dades: '/etc/passwd', mode: 0o120777 }, /enllaç simbòlic/);
  dolent({ nom: 'socdepoble/xifrat.php', dades: 'x', bandera: 0x801 }, /xifrada/);
  dolent({ nom: 'socdepoble/readme.txt', dades: 'x', crc: 1 }, /CRC32/, EIXIDA.VERIFICACIO);
  assert.throws(() => svn.llegixZip(fesZip([{ nom: 'socdepoble/A.php', dades: 'a' }, { nom: 'socdepoble/a.php', dades: 'b' }])), /repetit/);
  assert.throws(() => svn.llegixZip(Buffer.from('no és un zip')), /no és un zip/);
});

test('v1.2.16 · el paquet: Stable tag i Version han de ser --versio, un sol fitxer principal i cap Update URI', () => {
  const entrades = (fitxers) => svn.llegixZip(zipDe(fitxers));
  const bo = svn.analitzaPaquet(entrades(NOU), '1.1.24');
  assert.deepEqual([bo.principal, bo.stableTag, bo.versioPhp, bo.fitxers.size], ['socdepoble-enxufe.php', '1.1.24', '1.1.24', 7]);
  assert.throws(() => svn.analitzaPaquet(entrades(NOU), '1.1.25'), /readme\.txt diu «Stable tag: 1\.1\.24», no 1\.1\.25/);
  assert.throws(() => svn.analitzaPaquet(entrades(fitxersDe('1.1.24', { php: PHP('1.1.23') })), '1.1.24'), /socdepoble-enxufe\.php diu «Version: 1\.1\.23», no 1\.1\.24/);
  assert.throws(() => svn.analitzaPaquet(entrades(fitxersDe('1.1.24', { php: PHP('1.1.24', ' * Update URI:        https://socdepoble.org/wp\n') })), '1.1.24'), /Update URI.*variant enxufe/);
  assert.throws(() => svn.analitzaPaquet(entrades(fitxersDe('1.1.24', { mes: { 'segon.php': PHP('1.1.24') } })), '1.1.24'), /un sol fitxer principal.*en porta 2/);
  const senseReadme = Object.fromEntries(Object.entries(NOU).filter(([ruta]) => ruta !== 'readme.txt'));
  assert.throws(() => svn.analitzaPaquet(entrades(senseReadme), '1.1.24'), /no porta socdepoble\/readme\.txt/);
  assert.equal(svn.confirmacioDelZip('1.1.24', 'abcdef0123456789'), '1.1.24@abcdef012345');
});

test('v1.2.16 · llegixPaquet: 10 MiB o més, un enllaç o un .sha256 que no casa paren abans de res', () => {
  const gran = escriuZip('gran.zip', Buffer.alloc(svn.MIDA_MAXIMA_ZIP + 1), { sha: false });
  assert.throws(() => svn.llegixPaquet(gran, '1.1.24'), (error) => error.codi === EIXIDA.ARBRE && /ha de fer menys de 10 MiB \(10485760\)/.test(error.message));
  /* «ZIP < 10 MiB» (ordre del Mestre): exactament 10 MiB també para (Gauntlet v1.2.16 R1, L4-05). */
  const just = escriuZip('just.zip', Buffer.alloc(svn.MIDA_MAXIMA_ZIP), { sha: false });
  assert.throws(() => svn.llegixPaquet(just, '1.1.24'), (error) => error.codi === EIXIDA.ARBRE && /ha de fer menys de 10 MiB/.test(error.message));
  const bo = escriuZip('bo.zip', zipDe(NOU));
  const enllac = path.join(path.dirname(bo), 'enllac.zip');
  fs.symlinkSync(bo, enllac);
  assert.throws(() => svn.llegixPaquet(enllac, '1.1.24'), /no és un fitxer regular \(un enllaç no val\)/);
  const llegit = svn.llegixPaquet(bo, '1.1.24');
  assert.deepEqual([llegit.ambSha256, llegit.sha256, llegit.mida], [true, sha256(fs.readFileSync(bo)), fs.statSync(bo).size]);
  fs.writeFileSync(`${bo}.sha256`, `${'0'.repeat(64)}  bo.zip\n`);
  assert.throws(() => svn.llegixPaquet(bo, '1.1.24'), (error) => error.codi === EIXIDA.VERIFICACIO && /no casa amb el seu \.sha256/.test(error.message));
});

test('v1.2.16 · la contrasenya: fitxer regular de l\'usuari en 0600 o 0400, mai un enllaç, i una sola línia; cap missatge en porta res', () => {
  for (const mode of [0o600, 0o400]) {
    const cami = fitxerDeContrasenya(`${CONTRASENYA}\n`, mode);
    assert.deepEqual(svn.comprovaFitxerContrasenya(cami), { mode: mode.toString(8) });
    assert.equal(svn.llegixContrasenya(cami), CONTRASENYA);
  }
  const refusa = (cami, motiu) => {
    for (const fes of [() => svn.comprovaFitxerContrasenya(cami), () => svn.llegixContrasenya(cami)]) {
      assert.throws(fes, (error) => {
        senseContrasenya(error.message, 'un missatge d\'error');
        return error.codi === EIXIDA.FITXER && motiu.test(error.message);
      });
    }
  };
  refusa(fitxerDeContrasenya(`${CONTRASENYA}\n`, 0o644), /permisos 644: fes chmod 600/);
  refusa(fitxerDeContrasenya(`${CONTRASENYA}\n`, 0o640), /permisos 640/);
  refusa(fitxerDeContrasenya('', 0o600), /és buit/);
  const real = fitxerDeContrasenya();
  const enllac = path.join(path.dirname(real), 'enllac.pass');
  fs.symlinkSync(real, enllac);
  refusa(enllac, /enllaç simbòlic/);
  refusa(path.join(TEMPORAL, 'no-hi-es.pass'), /no hi ha el fitxer de la contrasenya/);
  const dues = fitxerDeContrasenya(`${CONTRASENYA}\nuna altra\n`);
  assert.throws(() => svn.llegixContrasenya(dues), (error) => error.codi === EIXIDA.FITXER && /una sola línia/.test(error.message) && !error.message.includes(CONTRASENYA));
});

test('v1.2.16 · el filtre i els arguments de docker: la contrasenya mai hi és, el contenidor és efímer i sense credencials desades', () => {
  const formes = svn.formesDeLaContrasenya(CONTRASENYA);
  assert.deepEqual([...formes].sort(), [...FORMES].sort());
  const brut = `a ${FORMES[0]} b ${FORMES[1]} c ${FORMES[2]} d ${os.homedir()}/claus-socdepoble/wp-svn.pass`;
  const net = svn.filtraEixida(brut, formes);
  senseContrasenya(net, 'el filtre');
  assert.equal(net, 'a <contrasenya> b <contrasenya> c <contrasenya> d ~/claus-socdepoble/wp-svn.pass');
  const args = svn.argumentsDocker({ treball: '/private/var/folders/x/sdp-wp-svn-abc', script: svn.SCRIPT_PUBLICA, posicionals: ['1.1.24', 'socdepoble', 'missatge', 'nou'], ambEntrada: true });
  assert.deepEqual(args.slice(0, 3), ['run', '--rm', '-i']);
  assert.ok(args.includes('--tmpfs') && args[args.indexOf('--tmpfs') + 1].startsWith('/sdp/tmp:rw,nosuid,nodev,size=16m,mode=0700'));
  assert.deepEqual(args.filter((_, i) => args[i - 1] === '-e'), ['HOME=/sdp/tmp/home', 'LANG=C.UTF-8'], 'cap variable amb secrets');
  assert.ok(!svn.argumentsDocker({ treball: '/tmp/x', script: svn.SCRIPT_CONSULTA }).includes('-i'), 'sense entrada, sense -i');
  // El contenidor no desa credencials i llig la contrasenya de stdin.
  for (const peca of ['--no-auth-cache', '--non-interactive', '--config-dir /sdp/tmp/svn', 'store-passwords=no', 'store-auth-creds=no']) {
    assert.ok(svn.SCRIPT_PUBLICA.includes(peca) && svn.SCRIPT_CONSULTA.includes(peca), peca);
  }
  assert.match(svn.SCRIPT_PUBLICA, /cat > \/sdp\/tmp\/clau/);
  assert.match(svn.SCRIPT_PUBLICA, /--password-from-stdin -m "\$3" < \/sdp\/tmp\/clau/);
  assert.doesNotMatch(svn.SCRIPT_PUBLICA + svn.SCRIPT_CONSULTA, /--password(?!-from-stdin)/, 'mai --password a argv');
  assert.throws(() => svn.argumentsDocker({ imatge: 'ubuntu:latest', treball: '/tmp/x', script: 'true' }), /imatge alpine/);
  assert.throws(() => svn.argumentsDocker({ treball: '/tmp/amb espai', script: 'true' }), /caràcters que docker -v no admet/);
  assert.doesNotThrow(() => svn.argumentsDocker({ imatge: `alpine:3.22@sha256:${'a'.repeat(64)}`, treball: '/tmp/x', script: 'true' }));
});

test('v1.2.16 · comparaArbres i la versió: afegits, modificats, eliminats mínims; un canvi de tipus i una versió més vella paren', () => {
  const arbre = (fitxers) => {
    const mapa = new Map(Object.entries(fitxers).map(([ruta, text]) => [ruta, sha256(Buffer.from(text))]));
    const carpetes = new Set([...mapa.keys()].flatMap((ruta) => ruta.split('/').slice(0, -1).map((_, i, peces) => peces.slice(0, i + 1).join('/'))));
    return { fitxers: mapa, carpetes };
  };
  const paquet = new Map(Object.entries(NOU).map(([ruta, text]) => [ruta, Buffer.from(text)]));
  assert.deepEqual(svn.comparaArbres(arbre(VELL), paquet), {
    afegits: ['dist/trossos/x.js', 'includes/nou.php'], modificats: ['readme.txt', 'socdepoble-enxufe.php'], eliminats: ['includes/vell.php', 'vell']
  });
  assert.equal(svn.esIgual(arbre(NOU), paquet), true);
  assert.throws(() => svn.comparaArbres(arbre({ 'dist/trossos': 'era un fitxer' }), paquet), /és un fitxer i el paquet en fa una carpeta/);
  assert.throws(() => svn.comparaArbres(arbre({ 'readme.txt/x': 'era una carpeta' }), paquet), /és una carpeta i el paquet en fa un fitxer/);
  assert.throws(() => svn.comparaArbres(arbre({ 'Readme.txt': 'majúscula' }), paquet), /trunk\/Readme\.txt i el paquet \(readme\.txt\) només canvien de majúscules/);
  assert.throws(() => svn.comparaArbres(arbre({ 'Includes/ajustos.php': 'x' }), paquet), /només canvien de majúscules/);
  assert.equal(svn.problemaDeVersio('1.1.24', { stableTrunk: '1.1.23', tags: ['1.1.22', '1.1.23', 'beta'] }), null);
  assert.match(svn.problemaDeVersio('1.1.24', { stableTrunk: '1.1.25' }), /Stable tag: 1\.1\.25», més nova que 1\.1\.24/);
  assert.match(svn.problemaDeVersio('1.1.24', { stableTrunk: '1.1.23', tags: ['1.1.30', '1.1.25'] }), /ja hi ha tags\/1\.1\.30\//);
});

test('v1.2.16 · consultaApi: només GET a l\'API pública, i mai llança', async () => {
  const vistes = [];
  const r = await svn.consultaApi({
    fetch: async (url, opcions) => { vistes.push([url, opcions.method]); return { ok: true, status: 200, text: async () => JSON.stringify({ slug: 'socdepoble', version: '1.1.24' }) }; }
  });
  assert.deepEqual(r, { versio: '1.1.24' });
  assert.deepEqual(vistes, [[svn.API_WORDPRESS, 'GET']]);
  assert.equal(svn.API_WORDPRESS, 'https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=socdepoble');
  assert.deepEqual(await svn.consultaApi({ fetch: async () => ({ ok: false, status: 503, text: async () => '' }) }), { error: 'HTTP 503' });
  assert.deepEqual(await svn.consultaApi({ fetch: async () => { throw new Error('xarxa'); } }), { error: 'no respon o no és JSON' });
  assert.deepEqual(await svn.consultaApi({ fetch: async () => ({ ok: true, status: 200, text: async () => '{"version":"x"}' }) }), { error: 'la resposta no porta cap versió X.Y.Z' });
});

/* ───────────── main amb el docker fals ───────────── */

test('v1.2.16 · --sec (per defecte): un sol contenidor anònim, sense -i ni stdin, el pla complet i res escrit', async () => {
  const docker = dockerFals({ trunk: VELL, tags: { '1.1.22': null, '1.1.23': null } });
  const zip = escriuZip('261121_0300_wordpress_directori_v1.1.24.zip', zipDe(NOU));
  const api = apiFalsa();
  const r = await executa(['--zip', zip, '--versio', '1.1.24'], { docker, api });
  assert.equal(r.codi, EIXIDA.BE, r.vist);
  const crides = docker.crides();
  assert.deepEqual(crides.map((c) => c.mode), ['consulta'], 'cap commit');
  assert.equal(crides[0].stdin, '', 'res per stdin');
  assert.ok(!crides[0].args.includes('-i'));
  assert.deepEqual(crides[0].posicionals, [svn.REPOSITORI_SVN, '1.1.24']);
  assert.ok(crides[0].args.includes(svn.IMATGE_PER_DEFECTE));
  for (const ruta of ['dist/trossos/x.js', 'includes/nou.php', 'readme.txt', 'socdepoble-enxufe.php', 'includes/vell.php', 'vell']) assert.match(r.vist, new RegExp(`\\n      ${ruta.replace(/[./]/g, '\\$&')}\\n`), ruta);
  assert.match(r.vist, /afegits \(2\):[\s\S]*modificats \(2\):[\s\S]*eliminats \(2\):/);
  assert.match(r.vist, /trunk\/ \(Stable tag ara: 1\.1\.23 → 1\.1\.24\): 6 canvis/);
  assert.match(r.vist, /tags\/1\.1\.24\/: nou \(svn copy de trunk\/, en el mateix commit\)/);
  const sha12 = sha256(fs.readFileSync(zip)).slice(0, 12);
  assert.match(r.vist, new RegExp(`--publica --confirma=1\\.1\\.24@${sha12}`));
  assert.match(r.vist, /En sec: no s'ha llegit la contrasenya ni s'ha escrit res a WordPress\.org/);
  assert.deepEqual(api.vistes, [], 'en sec, cap API');
  senseTreball();
});

test('v1.2.16 · --publica: la contrasenya NOMÉS per stdin, mai a argv, entorn ni eixida; un commit amb trunk i el tag', async () => {
  const docker = dockerFals({ trunk: VELL, tags: { '1.1.23': null } });
  const zip = escriuZip('261121_0300_wordpress_directori_v1.1.24.zip', zipDe(NOU));
  const confirma = `--confirma=1.1.24@${sha256(fs.readFileSync(zip)).slice(0, 12)}`;
  const api = apiFalsa('1.1.24');
  const r = await executa(['--zip', zip, '--versio', '1.1.24', '--publica', confirma], { docker, api });
  assert.equal(r.codi, EIXIDA.BE, r.vist);
  const [consulta, publicacio] = docker.crides();
  assert.deepEqual([consulta.mode, publicacio?.mode], ['consulta', 'publica']);
  // Cap forma de la contrasenya a cap argument ni a cap variable d'entorn (ni del CLI de docker ni del contenidor).
  for (const crida of [consulta, publicacio]) {
    senseContrasenya(JSON.stringify(crida.args), 'argv de docker');
    senseContrasenya(JSON.stringify(crida.env), 'l\'entorn de docker');
  }
  assert.equal(publicacio.stdin, `${CONTRASENYA}\n`, 'per stdin, sencera i una vegada');
  assert.equal(publicacio.args[2], '-i');
  assert.deepEqual(publicacio.posicionals.slice(0, 2), ['1.1.24', svn.USUARI_SVN]);
  assert.equal(publicacio.posicionals[3], 'nou');
  // El svn hostil l'ha escrita a les dues eixides: el filtre la tapa a tota la pantalla.
  senseContrasenya(r.vist, 'la pantalla');
  assert.match(r.vist, /contrasenya=<contrasenya>/);
  assert.match(r.vist, /Authorization: Basic <contrasenya>/);
  assert.match(r.vist, /https:\/\/socdepoble:<contrasenya>@plugins\.svn\.wordpress\.org/);
  // trunk/ era exactament el paquet en el moment del commit, i les llistes són les del pla.
  assert.deepEqual(publicacio.trunk, Object.fromEntries(Object.entries(NOU).map(([ruta, text]) => [ruta, sha256(Buffer.from(text))])));
  assert.equal(publicacio.afig, 'dist/trossos/x.js\nincludes/nou.php\n');
  assert.equal(publicacio.elimina, 'includes/vell.php\nvell\n');
  assert.match(r.vist, /✓ WordPress\.org SVN: 1\.1\.24 publicat a trunk\/ i tags\/1\.1\.24\/ \(revisió 4242\)/);
  assert.deepEqual(api.vistes, ['GET']);
  assert.match(r.vist, /✓ WordPress\.org \(API pública\): socdepoble 1\.1\.24/);
  assert.match(r.vist, /REBUT \(cap secret\):[\s\S]*revisió SVN: 4242[\s\S]*trunk: \+2 ~2 -2 {2}tag: nou/);
  senseTreball();
});

test('v1.2.16 · les refuses: «sí» d\'un altre zip, versió que no casa, zip massa gran, contrasenya oberta o enllaçada i docker absent paren abans de cap contenidor', async () => {
  const docker = dockerFals({ trunk: VELL, tags: {} });
  const zip = escriuZip('261121_0300_wordpress_directori_v1.1.24.zip', zipDe(NOU));
  const cas = async (args, codi, motiu, mes = {}) => {
    const r = await executa(args, { docker, ...mes });
    assert.equal(r.codi, codi, `${args.join(' ')}: ${r.vist}`);
    assert.match(r.vist, motiu, args.join(' '));
    senseContrasenya(r.vist, 'la pantalla');
  };
  await cas(['--zip', zip, '--versio', '1.1.24', '--publica', '--confirma=1.1.24@000000000000'], EIXIDA.CONFIRMACIO, /--confirma ha de ser exactament 1\.1\.24@[0-9a-f]{12}: el «sí» va lligat a ESTE zip/);
  await cas(['--zip', zip, '--versio', '1.1.24', '--publica'], EIXIDA.US, /--publica necessita el «sí» del Mestre/);
  await cas(['--zip', zip, '--versio', '1.1.24', '--confirma=1.1.24@abc'], EIXIDA.US, /--confirma només va amb --publica/);
  await cas(['--zip', zip, '--versio', '1.1.24', '--sec', '--publica'], EIXIDA.US, /--sec i --publica no van juntes/);
  await cas(['--zip', zip, '--versio', '1.1.25'], EIXIDA.ARBRE, /Stable tag: 1\.1\.24», no 1\.1\.25/);
  await cas(['--zip', zip, '--versio', '1.1'], EIXIDA.US, /Ús:/);
  await cas(['--zip', escriuZip('gran.zip', Buffer.alloc(svn.MIDA_MAXIMA_ZIP + 1), { sha: false }), '--versio', '1.1.24'], EIXIDA.ARBRE, /ha de fer menys de 10 MiB/);
  await cas(['--zip', zip, '--versio', '1.1.24'], EIXIDA.FITXER, /permisos 644: fes chmod 600/, { contrasenya: fitxerDeContrasenya(`${CONTRASENYA}\n`, 0o644) });
  const real = fitxerDeContrasenya();
  const enllac = path.join(path.dirname(real), 'enllac.pass');
  fs.symlinkSync(real, enllac);
  await cas(['--zip', zip, '--versio', '1.1.24'], EIXIDA.FITXER, /enllaç simbòlic/, { contrasenya: enllac });
  await cas(['--zip', zip, '--versio', '1.1.24', '--imatge', 'ubuntu:24.04'], EIXIDA.US, /--imatge ha de ser una imatge alpine/);
  const r = await ambPantalla(() => svn.main(['--zip', zip, '--versio', '1.1.24'], { docker: path.join(TEMPORAL, 'no-hi-ha-docker'), contrasenya: fitxerDeContrasenya(), temporal: TEMPORAL }));
  assert.equal(r.codi, EIXIDA.EINA);
  assert.match(r.vist, /no es troba docker/);
  assert.deepEqual(docker.crides(), [], 'cap contenidor');
  senseTreball();
});

test('v1.2.16 · WordPress.org no deixa: un tag publicat amb un altre contingut, una versió més vella, la consulta o el commit que fallen', async () => {
  const zip = escriuZip('261121_0300_wordpress_directori_v1.1.24.zip', zipDe(NOU));
  const confirma = `--confirma=1.1.24@${sha256(fs.readFileSync(zip)).slice(0, 12)}`;
  const publica = (escenari) => {
    const docker = dockerFals(escenari);
    return executa(['--zip', zip, '--versio', '1.1.24', '--publica', confirma], { docker }).then((r) => ({ ...r, crides: docker.crides() }));
  };
  // El tag ja hi és amb un altre contingut: un tag publicat no es reescriu.
  let r = await publica({ trunk: VELL, tags: { '1.1.24': { 'readme.txt': 'un altre 1.1.24' } } });
  assert.equal(r.codi, EIXIDA.ARBRE, r.vist);
  assert.match(r.vist, /tags\/1\.1\.24\/ ja existix a WordPress\.org amb un altre contingut/);
  assert.deepEqual(r.crides.map((c) => c.mode), ['consulta'], 'cap commit');
  // trunk/ o un tag ja publiquen una versió més nova.
  r = await publica({ trunk: fitxersDe('1.1.30'), tags: {} });
  assert.equal(r.codi, EIXIDA.ARBRE);
  assert.match(r.vist, /Stable tag: 1\.1\.30», més nova que 1\.1\.24/);
  r = await publica({ trunk: VELL, tags: { '1.1.30': null } });
  assert.match(r.vist, /ja hi ha tags\/1\.1\.30\//);
  assert.deepEqual(r.crides.map((c) => c.mode), ['consulta']);
  // Ja publicat sencer (trunk i tag idèntics): res a fer, cap commit.
  r = await publica({ trunk: NOU, tags: { '1.1.24': NOU } });
  assert.equal(r.codi, EIXIDA.BE, r.vist);
  assert.match(r.vist, /ja publica exactament este paquet a trunk\/ i a tags\/1\.1\.24\/: no hi ha res a fer/);
  assert.deepEqual(r.crides.map((c) => c.mode), ['consulta']);
  // El tag idèntic ja hi és però trunk no: només trunk (cap svn copy).
  r = await publica({ trunk: VELL, tags: { '1.1.24': NOU } });
  assert.equal(r.codi, EIXIDA.BE, r.vist);
  assert.equal(r.crides[1].posicionals[3], 'existent');
  // La consulta que falla: eixida 8, res publicat.
  r = await publica({ trunk: VELL, fallaConsulta: true });
  assert.equal(r.codi, EIXIDA.EXTERNA);
  assert.match(r.vist, /el contenidor de consulta ha acabat amb 1: no s'ha fet res a WordPress\.org/);
  // El commit que falla: eixida 8 i on mirar abans de repetir; la contrasenya, tapada igualment.
  r = await publica({ trunk: VELL, fallaCommit: true });
  assert.equal(r.codi, EIXIDA.EXTERNA);
  assert.match(r.vist, /el commit a WordPress\.org ha acabat amb 1[\s\S]*plugins\.trac\.wordpress\.org\/log\/socdepoble/);
  senseContrasenya(r.vist, 'la pantalla');
  senseTreball();
});

/* ───────────── Gauntlet v1.2.16 (verificador adversarial) ───────────── */

test('v1.2.16 · Gauntlet: el zip refusa els noms que xocarien al Mac (fitxer i carpeta, caixa, NFC i NFD) abans de cap contrasenya', () => {
  const xoca = (noms, motiu) => assert.throws(
    () => svn.llegixZip(fesZip(noms.map((nom) => ({ nom, dades: nom.endsWith('/') ? '' : 'z' })))),
    (error) => error.codi === EIXIDA.ARBRE && motiu.test(error.message), noms.join(' + ')
  );
  xoca(['socdepoble/x', 'socdepoble/x/y'], /alhora un fitxer i una carpeta/);
  xoca(['socdepoble/x/y', 'socdepoble/x'], /alhora un fitxer i una carpeta/);
  xoca(['socdepoble/A/x.php', 'socdepoble/a'], /alhora un fitxer i una carpeta/);
  xoca(['socdepoble/x/', 'socdepoble/x'], /alhora un fitxer i una carpeta/);
  xoca(['socdepoble/só.php', 'socdepoble/só.php'], /repetit .*normalització Unicode/);
  // Els noms bons (carpetes declarades, lletres accentuades) continuen valent.
  const bons = svn.llegixZip(fesZip([{ nom: 'socdepoble/', dades: '' }, { nom: 'socdepoble/x/', dades: '' }, { nom: 'socdepoble/x/só.php', dades: 'z' }, { nom: 'socdepoble/xy', dades: 'z' }]));
  assert.deepEqual(bons.map((e) => e.nom), ['socdepoble/x/só.php', 'socdepoble/xy']);
});

test('v1.2.16 · Gauntlet: el filtre tapa la contrasenya encara que una lletra de diversos octets caiga entre dos trossos', async () => {
  const clau = `${CONTRASENYA}-cóm-ñ`;
  const octets = Buffer.from(`svn: ${clau}\nfinal sense salt ${clau}`);
  const tall = octets.indexOf(Buffer.from('ó')) + 1; // entre els dos octets de «ó»
  const carpeta = fs.mkdtempSync(path.join(TEMPORAL, 'docker-tall-'));
  const fals = path.join(carpeta, 'docker');
  fs.writeFileSync(fals, `#!${process.execPath}\nconst b = Buffer.from('${octets.toString('base64')}', 'base64');\nprocess.stdout.write(b.subarray(0, ${tall}), () => setTimeout(() => process.stdout.write(b.subarray(${tall})), 100));\n`, { mode: 0o755 });
  fs.chmodSync(fals, 0o755);
  const vistes = [];
  const r = await svn.executaDocker({ docker: fals, args: ['run'], formes: svn.formesDeLaContrasenya(clau), registra: (linia) => vistes.push(linia) });
  assert.equal(r.codi, 0);
  const tot = `${vistes.join('\n')}\n${r.eixida}`;
  senseContrasenya(tot, 'l\'eixida partida');
  assert.ok(!tot.includes('�'), 'cap lletra trencada');
  assert.deepEqual(vistes.slice(1), [`  │ svn: ${svn.MARCA_CONTRASENYA}`, `  │ final sense salt ${svn.MARCA_CONTRASENYA}`]);
});

test('v1.2.16 · Gauntlet: un trunk/ o un tag enllaçats cap a fora de la còpia paren, i res de fora s\'esborra ni s\'escriu', async () => {
  const zip = escriuZip('261121_0300_wordpress_directori_v1.1.24.zip', zipDe(NOU));
  const confirma = `--confirma=1.1.24@${sha256(fs.readFileSync(zip)).slice(0, 12)}`;
  const victima = fs.mkdtempSync(path.join(TEMPORAL, 'victima-'));
  fs.writeFileSync(path.join(victima, 'important.txt'), 'no es toca');
  for (const [escenari, motiu] of [
    [{ trunkEnllac: victima }, /trunk\/ de la còpia de treball no és una carpeta \(un enllaç no val\)/],
    [{ trunk: VELL, tagsEnllac: { '1.1.24': victima } }, /tags\/1\.1\.24 de la còpia de treball és un enllaç simbòlic/],
    [{ trunk: VELL, tagsEnllac: { '1.1.30': victima } }, /tags\/1\.1\.30 de la còpia de treball és un enllaç simbòlic/]
  ]) {
    for (const args of [['--zip', zip, '--versio', '1.1.24'], ['--zip', zip, '--versio', '1.1.24', '--publica', confirma]]) {
      const docker = dockerFals(escenari);
      const r = await executa(args, { docker });
      assert.equal(r.codi, EIXIDA.ARBRE, `${JSON.stringify(escenari)} ${args.join(' ')}: ${r.vist}`);
      assert.match(r.vist, motiu);
      assert.deepEqual(docker.crides().map((c) => c.mode), ['consulta'], 'cap commit');
      assert.deepEqual(fs.readdirSync(victima), ['important.txt'], 'res escrit fora de la còpia');
      assert.equal(fs.readFileSync(path.join(victima, 'important.txt'), 'utf8'), 'no es toca');
    }
  }
  senseTreball();
});

test('v1.2.16 · Gauntlet: en sec, l\'ordre per a publicar cita bé un zip amb espais i cometes', async () => {
  const carpeta = fs.mkdtempSync(path.join(TEMPORAL, 'amb espai-'));
  const zip = path.join(carpeta, 'l\'arxiu v1.1.24.zip');
  fs.writeFileSync(zip, zipDe(NOU));
  const r = await executa(['--zip', zip, '--versio', '1.1.24'], { docker: dockerFals({ trunk: VELL, tags: {} }) });
  assert.equal(r.codi, EIXIDA.BE, r.vist);
  const sha12 = sha256(fs.readFileSync(zip)).slice(0, 12);
  /* Dins de casa, ~/ va fora de les cometes (entre cometes la terminal no l'expandiria). */
  const cita = (text) => `'${text.replace(/'/g, '\'\\\'\'')}'`;
  const relativa = path.relative(os.homedir(), zip);
  const esperada = !relativa.startsWith('..') && !path.isAbsolute(relativa) ? `~/${cita(relativa)}` : cita(zip);
  assert.ok(r.vist.includes(`--zip ${esperada} --versio 1.1.24 --publica --confirma=1.1.24@${sha12}`), r.vist);
  senseTreball();
});

/* ───────────── Gauntlet v1.2.16 R2 (L4R2-01): la política d'higiene compartida (IDEA-62) ───────────── */

/* Les 66 rutes de dins de socdepoble/ del zip real 261120_2226_wordpress_directori_v1.1.23.zip (el que deixa
   empaqueta.mjs --directori), llistades amb llegixPaquet: l'estructura de la casa no ha de quedar refusada. */
const ESTRUCTURA_DIRECTORI = `
  dist/apple-touch-icon.png dist/assets/audio/veus_node0/mostra_01_olga_balear.wav dist/assets/audio/veus_node0/mostra_03_elia_central.wav
  dist/assets/audio/veus_node0/mostra_05_emma_occidental.wav dist/assets/audio/veus_node0/mostra_06_lluc_valencia.wav
  dist/assets/audio/veus_node0/mostra_07_gina_valencia.wav dist/assets/audio/veus_node0/mostra_08_arnau_valencia.wav
  dist/assets/audio/veus_node0/mostra_09_berta_valencia.wav dist/assets/cc-by-nc-sa.svg dist/assets/media_registry.json dist/assets/pedra-seca.css
  dist/assets/soc_de_poble_ibanez.webp dist/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.webp dist/assets/system/ui/logo-socdepoble-cuadrat-verd.svg
  dist/assets/system/ui/logo-socdepoble-rect-blanc-985x256.webp dist/assets/system/ui/logo-socdepoble-rect-blanc.svg
  dist/assets/system/ui/logo-socdepoble-rect-negre-985x256.webp dist/assets/system/ui/logo-socdepoble-rect-negre.svg dist/assets/system/ui/logo-socdepoble-rect.svg
  dist/assets/system/ui/og-llibre-d-or-1200x630.png dist/assets/system/ui/og-socdepoble-1200x630.webp dist/assets/system/ui/xat-bg-map-v2.webp
  dist/components/sp-identity-components.js dist/favicon.ico dist/favicon.svg dist/fonts/OFL.txt dist/fonts/noto-sans-wdth-wght-latin.woff2
  dist/fonts/noto-sans.css dist/fonts/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2 dist/opendata/activitystreams.json dist/opendata/agenda.ics
  dist/opendata/agenda.jsonld dist/opendata/configuracio.json dist/opendata/dades-obertes-la-torre-de-les-macanes-20261103.zip.sha256
  dist/opendata/directori.jsonld dist/opendata/llicencies.md dist/opendata/manifest.json dist/opendata/memoria-cultural.jsonld dist/opendata/memoria.md
  dist/opendata/municipi.jsonld dist/opendata/noticies.jsonld dist/opendata/snapshot-public.json dist/rag-index.json dist/sdp-inventari.json
  dist/sdp-release.json dist/slugIndex.json dist/soc-de-poble.standalone.js dist/versio-viva.json includes/abilities-mcp.php includes/ajustos.php
  includes/bloc/block.json includes/bloc/editor.asset.php includes/bloc/editor.js includes/bloc/render.php includes/copies.php includes/idioma.php
  includes/manifest.php includes/marcatge.php includes/salut.php includes/secrets-wp72.php includes/seo.php includes/traduccio.php readme.txt
  socdepoble-enxufe.php templates/pantalla-completa.php uninstall.php`.trim().split(/\s+/);

test('v1.2.16 · Gauntlet R2 (L4R2-01): la política IDEA-62 compartida refusa a analitzaPaquet el que empaqueta.mjs no hi posaria', () => {
  const entrades = (fitxers) => svn.llegixZip(zipDe(fitxers));
  for (const ruta of ['.env', '.env.production.local', '.git/config', 'includes/.git/HEAD', 'dist/app.js.map', 'dist/x.sql', 'dist/debug.log',
    'node_modules/a/index.js', 'coverage/index.html', 'includes/ajustos.test.js', 'dist/__fixtures__/a.json', 'assets/banner-772x250.png', 'assets/icon-128x128.png']) {
    assert.throws(() => svn.analitzaPaquet(entrades(fitxersDe('1.1.24', { mes: { [ruta]: 'x' } })), '1.1.24'),
      (error) => error instanceof svn.ErrorWp && error.codi === EIXIDA.ARBRE && /^dins de socdepoble\/, IDEA-62: contingut alié/.test(error.message) && error.message.includes(`- ${ruta}: `), ruta);
  }
  // Les rutes de dins de socdepoble/: la regla de la vitrina mira assets/ de l'arrel, no dist/assets/ (com empaqueta.mjs).
  assert.equal(svn.analitzaPaquet(entrades(fitxersDe('1.1.24', { mes: { 'dist/assets/banner-772x250.png': 'x', 'dist/assets/icon-128x128.png': 'x' } })), '1.1.24').fitxers.size, 7);
  // L'estructura real del zip de la casa (v1.1.23, 66 rutes) continua valent.
  assert.equal(ESTRUCTURA_DIRECTORI.length, 66);
  const casa = Object.fromEntries(ESTRUCTURA_DIRECTORI.map((ruta) => [ruta, `contingut de ${ruta}\n`]));
  casa['readme.txt'] = '=== Sóc de Poble ===\nStable tag: 1.1.24\n';
  casa['socdepoble-enxufe.php'] = PHP('1.1.24');
  const bo = svn.analitzaPaquet(entrades(casa), '1.1.24');
  assert.deepEqual([bo.fitxers.size, bo.principal], [66, 'socdepoble-enxufe.php']);
});

test('v1.2.16 · Gauntlet R2 (L4R2-01): un .env i un .git dins de socdepoble/ paren amb EIXIDA.ARBRE abans de docker i de la contrasenya', async () => {
  const contaminat = { ...NOU, '.env.production.local': 'SDP_FALS=1\n', '.git/config': '[core]\n' };
  const zip = escriuZip('261121_0300_wordpress_directori_v1.1.24.zip', zipDe(contaminat));
  const confirma = `--confirma=1.1.24@${sha256(fs.readFileSync(zip)).slice(0, 12)}`;
  for (const args of [['--zip', zip, '--versio', '1.1.24'], ['--zip', zip, '--versio', '1.1.24', '--publica', confirma]]) {
    const docker = dockerFals({ trunk: VELL, tags: {} });
    /* El fitxer de la contrasenya no hi és: si la higiene no parara abans, l'eixida seria FITXER (3), no ARBRE (7). */
    const r = await executa(args, { docker, contrasenya: path.join(TEMPORAL, 'no-hi-es.pass') });
    assert.equal(r.codi, EIXIDA.ARBRE, `${args.join(' ')}: ${r.vist}`);
    assert.match(r.vist, /El paquet no es pot publicar: dins de socdepoble\/, IDEA-62: contingut alié al paquet instal·lable:/);
    assert.match(r.vist, /- \.env\.production\.local: metadades locals o entorn privat/);
    assert.match(r.vist, /- \.git\/config: metadades locals o entorn privat/);
    assert.doesNotMatch(r.vist, /SDP_FALS|contrasenya de WordPress\.org|no es troba docker/, 'ni el contingut, ni la contrasenya, ni docker');
    assert.deepEqual(docker.crides(), [], 'cap contenidor');
  }
  senseTreball();
});

test('v1.2.16 · --comprova-api: només l\'API pública (GET), sense docker ni contrasenya', async () => {
  const api = apiFalsa('1.1.24');
  const r = await ambPantalla(() => svn.main(['--comprova-api'], { docker: path.join(TEMPORAL, 'no-hi-ha-docker'), contrasenya: path.join(TEMPORAL, 'no-hi-es.pass'), consultaApi: api.consulta }));
  assert.equal(r.codi, EIXIDA.BE, r.vist);
  assert.match(r.vist, /WordPress\.org \(API pública, GET\): socdepoble 1\.1\.24/);
  assert.deepEqual(api.vistes, ['GET']);
  const mal = await ambPantalla(() => svn.main(['--comprova-api', '--versio', '1.1.24'], { consultaApi: api.consulta }));
  assert.equal(mal.codi, EIXIDA.US);
});
