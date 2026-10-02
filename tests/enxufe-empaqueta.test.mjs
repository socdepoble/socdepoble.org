/** Proves de wordpress-plugin/eines/empaqueta.mjs (torn torn_2c123d78, 260929).
 *  El build sintètic es genera amb manifestDeRelease() de
 *  vite.standalone.config.js: si el build i l'empaquetador deixen de parlar el
 *  mateix sdp.release.v1, estes proves ho diuen. Tot s'escriu en carpetes
 *  temporals; el repositori no es toca. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifestDeRelease } from '../vite.standalone.config.js';
import {
  ADAPTADOR,
  AJUDA,
  ENTRADA,
  FITXER_INVENTARI,
  FITXER_RELEASE,
  NOMES_CANAL_PROPI,
  SLUG,
  clauIncrustada,
  clauPublicaHex,
  crc32,
  creaZip,
  comprovaSecretsDeepL,
  empaqueta,
  errorsDelBuild,
  estampaReadme,
  estampaVersio,
  executa,
  fitxersAdaptador,
  generaClau,
  llegixZip,
  marcaDelBuild,
  patronsActualitzadorEn,
  signa,
  slugDelNom,
  variantDirectori,
  variantDirectoriReadme,
  verifica
} from '../wordpress-plugin/eines/empaqueta.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_REAL = path.join(ARREL, 'wordpress-plugin');
const TENANT = '11111111-2222-3333-4444-555555555555';
const NODE_BO = Object.freeze({ origen: 'https://abc.supabase.co', mode: 'remote', tenant: TENANT, desenvolupament: false });
const NODE_LOCAL = Object.freeze({ origen: 'http://localhost:54321', mode: 'seed', tenant: TENANT, desenvolupament: true });
const URL_BASE = 'https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v{versio}/';
const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');

/** Còpia de l'adaptador real més un dist sintètic amb manifest i inventari. */
function fixture({ node = NODE_BO, versio = '0.2.0', clauPublica = '' } = {}) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-empaqueta-'));
  const plugin = path.join(arrel, 'wordpress-plugin');
  fs.mkdirSync(plugin, { recursive: true });
  for (const rel of ADAPTADOR.fitxers) fs.copyFileSync(path.join(PLUGIN_REAL, rel), path.join(plugin, rel));
  for (const carpeta of ADAPTADOR.carpetes) fs.cpSync(path.join(PLUGIN_REAL, carpeta), path.join(plugin, carpeta), { recursive: true });
  if (clauPublica) {
    const actualitzador = path.join(plugin, NOMES_CANAL_PROPI);
    const text = fs.readFileSync(actualitzador, 'utf8');
    fs.writeFileSync(actualitzador, text.replace("define( 'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA', '' );", `define( 'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA', '${clauPublica}' );`));
  }
  const dist = path.join(plugin, 'dist');
  const fitxers = [
    { cami: ENTRADA, contingut: Buffer.from('var SocDePoble = 1;\n') },
    { cami: 'fonts/noto-sans.css', contingut: Buffer.from('@font-face{font-family:x}') },
    { cami: 'assets/fotos/àrea.png', contingut: crypto.randomBytes(4096) },
    { cami: 'rag-index.json', contingut: Buffer.from('{"documents":[]}') }
  ];
  for (const { cami, contingut } of fitxers) {
    fs.mkdirSync(path.dirname(path.join(dist, cami)), { recursive: true });
    fs.writeFileSync(path.join(dist, cami), contingut);
  }
  const { manifestText, inventariText } = manifestDeRelease({ versio, node, fitxers, generat: '2026-09-29T20:00:00.000Z' });
  fs.writeFileSync(path.join(dist, FITXER_RELEASE), manifestText);
  fs.writeFileSync(path.join(dist, FITXER_INVENTARI), inventariText);
  // Restes de builds anteriors: no han d'entrar mai.
  fs.writeFileSync(path.join(dist, 'socdepoble-react.css'), 'vell');
  fs.mkdirSync(path.join(dist, '.vite'), { recursive: true });
  fs.writeFileSync(path.join(dist, '.vite', 'manifest.json'), '{}');
  const directori = path.join(plugin, 'builds/directori/dist');
  const fitxersWp = fitxers.map(f => f.cami === ENTRADA ? { ...f, contingut: Buffer.from('var SocDePoble = React.createElement;\n') } : f);
  for (const { cami, contingut } of fitxersWp) {
    fs.mkdirSync(path.dirname(path.join(directori, cami)), { recursive: true });
    fs.writeFileSync(path.join(directori, cami), contingut);
  }
  const wp = manifestDeRelease({ versio, node, fitxers: fitxersWp, generat: '2026-09-29T20:00:00.000Z', variant: 'wordpress' });
  fs.writeFileSync(path.join(directori, FITXER_RELEASE), wp.manifestText);
  fs.writeFileSync(path.join(directori, FITXER_INVENTARI), wp.inventariText);
  return { arrel, plugin, dist, directori, sortida: path.join(plugin, 'builds/paquets') };
}

const neteja = (f) => fs.rmSync(f.arrel, { recursive: true, force: true });
const entradesDe = (fitxer) => new Map(llegixZip(fs.readFileSync(fitxer)).map((e) => [e.nom, e.dades]));

/* ─────────────────────────────── ZIP ─────────────────────────────── */

test('crc32 és el de ZIP', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xCBF43926);
  assert.equal(crc32(Buffer.alloc(0)), 0);
});

test('creaZip: determinista, UTF-8, deflate o emmagatzemat, i llegixZip el torna intacte', () => {
  const entrades = [
    { nom: 'b/àrea.txt', dades: Buffer.from('Sóc de Poble '.repeat(200)) },
    { nom: 'a/aleatori.bin', dades: crypto.randomBytes(3000) },
    { nom: 'a/buit.txt', dades: Buffer.alloc(0) }
  ];
  const data = new Date('2026-09-29T20:00:00Z');
  const zip = creaZip(entrades, { data });
  assert.deepEqual(zip, creaZip([...entrades].reverse(), { data }), 'el mateix contingut dona els mateixos bytes');
  const llegides = llegixZip(zip);
  assert.deepEqual(llegides.map((e) => e.nom), ['a/aleatori.bin', 'a/buit.txt', 'b/àrea.txt']);
  for (const e of llegides) assert.deepEqual(e.dades, entrades.find((x) => x.nom === e.nom).dades, e.nom);
  assert.ok(zip.length < 3000 + 2600 + 400, 'el text repetit es comprimix');
  for (const nom of ['/abs', '../fora', 'a/../b', 'a\\b', 'a//b', '']) {
    assert.throws(() => creaZip([{ nom, dades: Buffer.alloc(1) }]), /no vàlid/, JSON.stringify(nom));
  }
  assert.throws(() => creaZip([{ nom: 'x', dades: Buffer.alloc(1) }, { nom: 'x', dades: Buffer.alloc(1) }]), /repetida/);
});

/* ──────────────────────────── Textos del paquet ──────────────────────────── */

test('estampa la versió a la capçalera, a la constant i al Stable tag, una sola vegada', () => {
  const php = fs.readFileSync(path.join(PLUGIN_REAL, 'socdepoble-enxufe.php'), 'utf8');
  const estampat = estampaVersio(php, '0.3.1');
  assert.match(estampat, /^ \* Version:\s+0\.3\.1$/m);
  assert.match(estampat, /^const SOCDEPOBLE_ENXUFE_VERSIO\s*=\s*'0\.3\.1';$/m);
  assert.equal(estampat.split('\n').length, php.split('\n').length);
  assert.match(estampaReadme(fs.readFileSync(path.join(PLUGIN_REAL, 'readme.txt'), 'utf8'), '0.3.1'), /^Stable tag: 0\.3\.1$/m);
  assert.throws(() => estampaVersio(`${php}\n * Version: 9.9.9\n`, '1.0.0'), /una sola coincidència/);
  assert.throws(() => estampaReadme('sense capçalera', '1.0.0'), /una sola coincidència/);
});

test('la variant del directori perd Update URI, el paràgraf del canal i tot patró d\'actualitzador', () => {
  const php = fs.readFileSync(path.join(PLUGIN_REAL, 'socdepoble-enxufe.php'), 'utf8');
  const readme = fs.readFileSync(path.join(PLUGIN_REAL, 'readme.txt'), 'utf8');
  assert.doesNotMatch(variantDirectori(php), /Update URI:/);
  assert.match(readme, /^Update channel \(/m);
  const directori = variantDirectoriReadme(readme);
  assert.doesNotMatch(directori, /^(?:Update channel|Canal d'actualització)/m);
  assert.match(directori, /== External services ==/);
  assert.match(directori, /api-free\.deepl\.com/);
  assert.match(directori, /^Requires at least: 6\.6$/m);
  assert.equal(variantDirectoriReadme(readme.replace('Update channel (', "Canal d'actualització (")), directori);
  assert.throws(() => variantDirectoriReadme(readme + '\nUpdate channel (duplicate): test.\n\n'), /una sola coincidència/);
  assert.ok(patronsActualitzadorEn([{ nom: 'x/actualitzador.php', dades: fs.readFileSync(path.join(PLUGIN_REAL, NOMES_CANAL_PROPI)) }]).length > 0, 'el detector reconeix el nostre actualitzador');
  assert.ok(patronsActualitzadorEn([{ nom: 'x/p.php', dades: Buffer.from(php) }]).length > 0, 'i la capçalera Update URI');
});

/* ─────────────────────────────── Signatura ─────────────────────────────── */

test('Ed25519: signa els bytes exactes, verifica com sodium i refusa qualsevol canvi', () => {
  const { pem, publicaHex } = generaClau();
  assert.match(publicaHex, /^[0-9a-f]{64}$/);
  assert.equal(clauPublicaHex(crypto.createPrivateKey(pem)), publicaHex);
  const dades = Buffer.from('{"schema":"sdp.release.v1"}\n');
  const signatura = signa(dades, pem);
  assert.match(signatura, /^[0-9a-f]{128}$/);
  assert.equal(verifica(dades, signatura, publicaHex), true);
  assert.equal(verifica(Buffer.from('{"schema":"sdp.release.v1"} \n'), signatura, publicaHex), false);
  assert.equal(verifica(dades, signatura, generaClau().publicaHex), false);
  assert.equal(verifica(dades, 'zz', publicaHex), false);
  assert.throws(() => signa(dades, crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' })), /Ed25519/);
});

test('el plugin del repositori porta la clau buida fins que el Mestre en genera una', () => {
  assert.equal(clauIncrustada(fs.readFileSync(path.join(PLUGIN_REAL, NOMES_CANAL_PROPI), 'utf8')), '');
  assert.throws(() => clauIncrustada('<?php // res'), /no definix/);
});

/* ─────────────────────────────── Empaquetat ─────────────────────────────── */

test('una release: tres paquets amb dos runtimes explícits i un canal signat que el plugin pot verificar', () => {
  const { pem, publicaHex } = generaClau();
  const f = fixture({ clauPublica: publicaHex });
  try {
    const r = empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: pem, notes: 'https://socdepoble.org/enxufe/0.2.0' });
    assert.equal(r.versio, '0.2.0');
    assert.equal(r.signat, true);
    assert.deepEqual([...r.escrits].sort(), [
      '0.2.0.json', '0.2.0.json.sig', 'directori/socdepoble-enxufe-v0.2.0-260929_2200.zip', 'socdepoble-enxufe-v0.2.0-260929_2200.zip', 'socdepoble-spa-v0.2.0-260929_2200.zip', 'stable.json', 'stable.json.sig'
    ]);
    assert.deepEqual(r.restes.sort(), ['.vite/manifest.json', 'socdepoble-react.css']);

    const textCanal = fs.readFileSync(path.join(f.sortida, 'stable.json'));
    assert.deepEqual(textCanal, fs.readFileSync(path.join(f.sortida, '0.2.0.json')), 'còpia immutable per versió');
    assert.equal(verifica(textCanal, fs.readFileSync(path.join(f.sortida, 'stable.json.sig'), 'utf8').trim(), publicaHex), true);

    const canal = JSON.parse(textCanal);
    const wp = canal.adaptadors.wordpress;
    // Els camps que exigix socdepoble_enxufe_valida_canal() (includes/actualitzador.php).
    assert.equal(canal.schema, 'sdp.release.v1');
    assert.equal(canal.producte, 'soc-de-poble');
    assert.deepEqual(canal.node, NODE_BO);
    assert.equal(canal.entrada.cami, ENTRADA);
    assert.match(canal.entrada.integrity, /^sha384-[A-Za-z0-9+/]{64}$/);
    assert.equal(wp.slug, SLUG);
    assert.equal(wp.versio, '0.2.0');
    assert.deepEqual([wp.requires, wp.requires_php, wp.tested], ['6.5', '7.4', '7.1']);
    assert.ok(r.avisos.some((avis) => avis.includes('soc-de-poble-enxufe')), 'avisa de l\'slug que derivaria WordPress.org');
    assert.equal(canal.notes, 'https://socdepoble.org/enxufe/0.2.0');
    for (const [clau, nom] of [['wordpress', 'socdepoble-enxufe-v0.2.0-260929_2200.zip'], ['estatic', 'socdepoble-spa-v0.2.0-260929_2200.zip']]) {
      const paquet = clau === 'wordpress' ? wp.paquet : canal.estatic.paquet;
      const zip = fs.readFileSync(path.join(f.sortida, nom));
      assert.equal(paquet.url, `https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v0.2.0/${nom}`);
      assert.equal(paquet.mida, zip.length);
      assert.equal(paquet.sha256, sha256(zip));
    }
    assert.equal(wp.directori.nom, wp.paquet.nom);
    assert.equal(wp.directori.cami, 'directori/' + wp.directori.nom);
    assert.equal(wp.directori.sha256, sha256(fs.readFileSync(path.join(f.sortida, 'directori/socdepoble-enxufe-v0.2.0-260929_2200.zip'))));

    const propi = entradesDe(path.join(f.sortida, 'socdepoble-enxufe-v0.2.0-260929_2200.zip'));
    const directori = entradesDe(path.join(f.sortida, 'directori/socdepoble-enxufe-v0.2.0-260929_2200.zip'));
    const estatic = entradesDe(path.join(f.sortida, 'socdepoble-spa-v0.2.0-260929_2200.zip'));
    assert.ok([...propi.keys()].every((nom) => nom.startsWith(`${SLUG}/`)), 'arrel socdepoble-enxufe/');
    assert.ok([...estatic.keys()].every((nom) => nom.startsWith('soc-de-poble/')));
    const bundle = propi.get(`${SLUG}/dist/${ENTRADA}`);
    assert.notDeepEqual(directori.get(`${SLUG}/dist/${ENTRADA}`), bundle);
    assert.equal(sha256(directori.get(`${SLUG}/dist/${ENTRADA}`)), wp.directori.entrada.sha256);
    assert.deepEqual(wp.directori.runtime.dependencies, ['react', 'react-dom', 'react-jsx-runtime']);
    assert.equal(wp.directori.requires, '6.6');
    assert.match(directori.get(`${SLUG}/socdepoble-enxufe.php`).toString(), /^ \* Requires at least:\s+6\.6$/m);
    assert.match(directori.get(`${SLUG}/readme.txt`).toString(), /^Requires at least:\s+6\.6$/m);
    assert.deepEqual(estatic.get(`soc-de-poble/${ENTRADA}`), bundle);
    assert.equal(sha256(bundle), canal.entrada.sha256, 'el bundle autònom al canal propi i a l’estàtic');
    for (const nom of [...propi.keys(), ...estatic.keys()]) {
      assert.ok(!/socdepoble-react\.css|\/\.vite\/|\/eines\/|\/\./.test(nom), `resta o fitxer ocult: ${nom}`);
    }
    assert.ok(propi.has(`${SLUG}/dist/assets/fotos/àrea.png`));
    assert.ok(propi.has(`${SLUG}/dist/${FITXER_RELEASE}`) && estatic.has(`soc-de-poble/${FITXER_RELEASE}`));

    const principal = propi.get(`${SLUG}/socdepoble-enxufe.php`).toString('utf8');
    assert.match(principal, /^ \* Version:\s+0\.2\.0$/m);
    assert.match(principal, /^const SOCDEPOBLE_ENXUFE_VERSIO\s*=\s*'0\.2\.0';$/m);
    assert.match(principal, /^ \* Update URI:/m);
    assert.equal(clauIncrustada(propi.get(`${SLUG}/${NOMES_CANAL_PROPI}`).toString('utf8')), publicaHex);
    assert.match(propi.get(`${SLUG}/readme.txt`).toString('utf8'), /^Stable tag: 0\.2\.0$/m);

    assert.ok(!directori.has(`${SLUG}/${NOMES_CANAL_PROPI}`));
    assert.deepEqual(patronsActualitzadorEn([...directori].map(([nom, dades]) => ({ nom, dades }))), []);
    assert.deepEqual([...propi.keys()].filter((nom) => !directori.has(nom)), [`${SLUG}/${NOMES_CANAL_PROPI}`], 'l\'única diferència és l\'actualitzador');
  } finally { neteja(f); }
});

test('les portes de l\'empaquetador: node de desenvolupament, fitxers canviats, clau i URL', () => {
  const { pem, publicaHex } = generaClau();
  const local = fixture({ node: NODE_LOCAL, versio: '1.0.0-dev', clauPublica: publicaHex });
  try {
    assert.throws(() => empaqueta({ arrelPlugin: local.plugin, sortida: local.sortida, urlBase: URL_BASE, clauPem: pem }), /desenvolupament/);
    assert.throws(() => empaqueta({ arrelPlugin: local.plugin, sortida: local.sortida, urlBase: 'http://localhost:8881/enxufe/', prova: true, clauPem: pem }), /--prova no signa mai/);
    const prova = empaqueta({ arrelPlugin: local.plugin, sortida: local.sortida, urlBase: 'http://localhost:8881/enxufe/', prova: true });
    assert.equal(prova.signat, false);
    assert.ok(!prova.escrits.some((nom) => nom.endsWith('.sig')));
  } finally { neteja(local); }

  const f = fixture({ clauPublica: publicaHex });
  try {
    assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE }), /Cal --clau/);
    assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: generaClau().pem }), /no és la de la clau que signa/);
    assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: 'http://example.org/', clauPem: pem }), /https/);
    assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, clauPem: pem }), /--url-base/);
    assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: path.join(f.plugin, 'release'), urlBase: URL_BASE, clauPem: pem }), /dins de wordpress-plugin\/builds/);
    fs.appendFileSync(path.join(f.dist, 'rag-index.json'), ' ');
    assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: pem }), /Ha canviat després de compilar: rag-index\.json/);
  } finally { neteja(f); }

  const buida = fixture();
  try {
    assert.throws(() => empaqueta({ arrelPlugin: buida.plugin, sortida: buida.sortida, urlBase: URL_BASE, clauPem: pem }), /clau pública del plugin \(buida\)/);
  } finally { neteja(buida); }
});

test('un canal amb nom (rc) per a provar a Studio sense tocar stable.json', () => {
  const { pem, publicaHex } = generaClau();
  const f = fixture({ clauPublica: publicaHex, versio: '0.2.0-rc.1' });
  try {
    const r = empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: pem, canal: 'rc' });
    assert.ok(r.escrits.includes('rc.json') && r.escrits.includes('rc.json.sig') && !r.escrits.includes('stable.json'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.sortida, 'rc.json'), 'utf8')).canal, 'rc');
    for (const canal of ['../stable', 'Stable', '1.0.0', '', 'a'.repeat(40)]) {
      assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: pem, canal }), /canal no vàlid/, JSON.stringify(canal));
    }
  } finally { neteja(f); }
});

test('slugDelNom: l\'slug que WordPress.org trauria del Plugin Name', () => {
  assert.equal(slugDelNom('Sóc de Poble — Enxufe'), 'soc-de-poble-enxufe');
  assert.equal(slugDelNom('socdepoble-enxufe'), SLUG);
  assert.equal(slugDelNom('  Àrea_de  Proves.v2 '), 'area-de-proves-v2');
});

test('errorsDelBuild: una release només surt d\'un build de release', () => {
  const release = (canvis) => ({
    schema: 'sdp.release.v1', producte: 'soc-de-poble', versio: '0.2.0', node: NODE_BO,
    entrada: { cami: ENTRADA, sha256: 'a'.repeat(64) }, inventari: { cami: FITXER_INVENTARI, sha256: 'b'.repeat(64) }, ...canvis
  });
  assert.deepEqual(errorsDelBuild(release({})), []);
  assert.equal(errorsDelBuild(release({ versio: '1.0.0-dev' })).length, 1);
  assert.deepEqual(errorsDelBuild(release({ versio: '1.0.0-dev', node: NODE_LOCAL }), { prova: true }), []);
  assert.equal(errorsDelBuild(release({ node: NODE_LOCAL })).length, 2);
  assert.equal(errorsDelBuild(release({ schema: 'x' })).length, 1);
});

/* ──────────────────────────────── CLI i adaptador ──────────────────────────────── */

test('CLI: ajuda, genera-clau fora del repositori i mai sobreescriu una clau', () => {
  const registre = { linies: [], log(missatge) { this.linies.push(missatge); } };
  assert.equal(executa(['--ajuda'], registre), 0);
  assert.equal(registre.linies[0], AJUDA);
  assert.throws(() => executa(['--genera-clau', path.join(ARREL, 'clau.pem')], registre), /dins del repositori/);
  assert.throws(() => executa(['--desconeguda'], registre), /desconeguda/);
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-clau-'));
  try {
    const fitxer = path.join(carpeta, 'enxufe.pem');
    assert.equal(executa(['--genera-clau', fitxer], registre), 0);
    assert.equal(fs.statSync(fitxer).mode & 0o777, 0o600);
    const publica = registre.linies.at(-1).split('\n').at(-1);
    assert.equal(clauPublicaHex(crypto.createPrivateKey(fs.readFileSync(fitxer, 'utf8'))), publica);
    assert.throws(() => executa(['--genera-clau', fitxer], registre), /no se sobreescriu/);
  } finally { fs.rmSync(carpeta, { recursive: true, force: true }); }
});

test('l\'adaptador real: la llista blanca porta tot el plugin i res de dist/, eines/ ni ocults', () => {
  const rels = fitxersAdaptador(PLUGIN_REAL).map((f) => f.rel);
  for (const rel of ['socdepoble-enxufe.php', 'uninstall.php', 'readme.txt', 'includes/actualitzador.php', 'includes/bloc/block.json', 'includes/bloc/render.php', 'includes/bloc/editor.js', 'includes/bloc/editor.asset.php', 'templates/pantalla-completa.php', 'languages/socdepoble-enxufe-ca.l10n.php']) {
    assert.ok(rels.includes(rel), rel);
  }
  assert.ok(rels.every((rel) => !rel.startsWith('dist/') && !rel.startsWith('eines/') && !rel.split('/').some((s) => s.startsWith('.'))));
});


test('porta DeepL: rebutja claus en PHP i bundle abans del ZIP, sense imprimir-les', () => {
  const key = ['00000000', '1111', '2222', '3333', '444444444444'].join('-') + ':fx';
  for (const nom of ['socdepoble-enxufe/includes/debug.php', 'socdepoble-enxufe/dist/app.js', 'asset.svg', 'module.mjs', 'strings.po', 'data.xml', 'blob.bin']) {
    assert.throws(() => comprovaSecretsDeepL([{nom, dades: Buffer.from(key)}]), err => err.message.includes(nom) && !err.message.includes(key));
  }
  assert.doesNotThrow(() => comprovaSecretsDeepL([{nom: 'app.js', dades: Buffer.from('const token = "public-id";')} ]));
});

test('no empaqueta variants absents, canviades, intercanviades o d’un altre node/versió', () => {
  for (const cas of ['absent', 'bytes', 'runtime', 'versio', 'node', 'contracte', 'desconegut']) {
    const f = fixture();
    try {
      const fitxer = path.join(f.directori, FITXER_RELEASE);
      const manifest = JSON.parse(fs.readFileSync(fitxer));
      if (cas === 'absent') fs.unlinkSync(fitxer);
      else if (cas === 'bytes') fs.appendFileSync(path.join(f.directori, ENTRADA), 'x');
      else {
        if (cas === 'runtime') manifest.runtime = { amfitrio: 'autonom', dependencies: [] };
        if (cas === 'desconegut') manifest.runtime.dependencies.push('remote-script');
        if (cas === 'versio') manifest.versio = '0.3.0';
        if (cas === 'node') manifest.node.tenant = '22222222-2222-3333-4444-555555555555';
        if (cas === 'contracte') manifest.contracte.marcatge = 'sdp.markup.v2';
        fs.writeFileSync(fitxer, JSON.stringify(manifest));
      }
      assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, prova: true }),
        /build:wp:directori|Ha canviat|Runtime incoherent|compartir versió/, cas);
      assert.equal(fs.existsSync(f.sortida), false, 'zero paquets parcials');
    } finally { neteja(f); }
  }
});

test('el mínim del directori no rebaixa una versió futura de WordPress', () => {
  const php = fs.readFileSync(path.join(PLUGIN_REAL, 'socdepoble-enxufe.php'), 'utf8');
  assert.match(variantDirectori(php.replace('Requires at least: 6.5', 'Requires at least: 7.2')), /Requires at least: 7.2/);
});


test('marca del build: Madrid, canvi de dia/any i data invàlida', () => {
  assert.equal(marcaDelBuild('2026-09-29T20:00:00Z'), '260929_2200');
  assert.equal(marcaDelBuild('2026-12-31T23:30:00Z'), '270101_0030');
  for (const generat of [undefined, null, '', 'no-data']) assert.throws(() => marcaDelBuild(generat), /data generat/);
});

test('destinació per defecte dins de builds, sense trepitjar el build del directori', () => {
  const f = fixture({ node: NODE_LOCAL });
  try {
    const abans = fs.readFileSync(path.join(f.directori, ENTRADA));
    const r = empaqueta({ arrelPlugin: f.plugin, urlBase: 'http://localhost/enxufe/', prova: true });
    assert.equal(r.desti, path.join(f.plugin, 'builds'));
    assert.ok(r.escrits.every(nom => fs.existsSync(path.join(r.desti, nom))));
    assert.deepEqual(fs.readFileSync(path.join(f.directori, ENTRADA)), abans);
    assert.equal(fs.existsSync(path.join(f.arrel, 'release')), false);
  } finally { neteja(f); }
});

test('destinació: rebutja eixides i enllaços abans d’escriure cap paquet', () => {
  for (const cas of ['fora', 'prefix', 'carpeta', 'fitxer']) {
    const f = fixture({ node: NODE_LOCAL });
    try {
      const exterior = path.join(f.arrel, 'exterior');
      fs.mkdirSync(exterior);
      const sentinel = path.join(exterior, 'sentinel');
      fs.writeFileSync(sentinel, 'intacte');
      let sortida = f.sortida;
      if (cas === 'fora') sortida = exterior;
      if (cas === 'prefix') sortida = path.join(f.plugin, 'builds-altra');
      if (cas === 'carpeta') fs.symlinkSync(exterior, sortida, 'dir');
      if (cas === 'fitxer') {
        fs.mkdirSync(sortida);
        fs.symlinkSync(sentinel, path.join(sortida, 'stable.json'));
      }
      assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida, urlBase: 'http://localhost/enxufe/', prova: true }),
        /dins de wordpress-plugin\/builds|enllaços simbòlics/);
      assert.equal(fs.readFileSync(sentinel, 'utf8'), 'intacte');
      assert.equal(fs.existsSync(path.join(sortida, 'socdepoble-spa-v0.2.0-260929_2200.zip')), false);
    } finally { neteja(f); }
  }
});
