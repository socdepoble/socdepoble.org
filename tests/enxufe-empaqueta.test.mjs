/** Proves de wordpress-plugin/eines/empaqueta.mjs (torn torn_2c123d78, 260929).
 *  El build sintètic es genera amb manifestDeRelease() de
 *  vite.standalone.config.js: si el build i l'empaquetador deixen de parlar el
 *  mateix sdp.release.v1, estes proves ho diuen. Tot s'escriu en carpetes
 *  temporals; el repositori no es toca. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
  creaPaquetLleuger,
  LIMIT_LLEUGER,
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
  slugDelPlugin,
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
  {
    const actualitzador = path.join(plugin, NOMES_CANAL_PROPI);
    const text = fs.readFileSync(actualitzador, 'utf8');
    const patro = /define\(\s*'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA'\s*,\s*'[0-9a-fA-F]*'\s*\)/g;
    assert.equal([...text.matchAll(patro)].length, 1, 'una única clau pública a la fixture');
    fs.writeFileSync(actualitzador, text.replace(patro, `define( 'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA', '${clauPublica}' )`));
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

test('connector lleuger: inventari verificat, assets externs, mida màxima i cap canal modificat', () => {
  const f = fixture();
  const mitjans = { origen: 'https://socdepoble.org', externs: ['assets/'], bessones: [] };
  const fitxers = [
    { cami: ENTRADA, contingut: Buffer.from('var SocDePoble = 1;\n') },
    { cami: 'fonts/noto-sans.css', contingut: Buffer.from('@font-face{font-family:x}') },
    { cami: 'rag-index.json', contingut: Buffer.from('{"documents":[]}') }
  ];
  const segella = (llista, politica = mitjans) => {
    for (const { cami, contingut } of llista) {
      fs.mkdirSync(path.dirname(path.join(f.dist, cami)), { recursive: true });
      fs.writeFileSync(path.join(f.dist, cami), contingut);
    }
    const result = manifestDeRelease({ versio: '1.1.10-beta.1', node: NODE_BO, fitxers: llista,
      generat: '2026-10-22T00:00:00.000Z', mitjans: politica });
    fs.writeFileSync(path.join(f.dist, FITXER_RELEASE), result.manifestText);
    fs.writeFileSync(path.join(f.dist, FITXER_INVENTARI), result.inventariText);
  };
  try {
    assert.throws(() => creaPaquetLleuger({ arrelPlugin: f.plugin }), /SDP_MITJANS=externs/);
    segella(fitxers);
    const resultat = creaPaquetLleuger({ arrelPlugin: f.plugin });
    const entrades = new Map(llegixZip(resultat.zip).map(e => [e.nom, e.dades]));
    assert.ok(resultat.mida < LIMIT_LLEUGER);
    assert.equal(resultat.sha256, sha256(resultat.zip));
    assert.ok(![...entrades.keys()].some(cami => cami.startsWith(`${SLUG}/dist/assets/`)));
    assert.ok(entrades.has(`${SLUG}/dist/fonts/noto-sans.css`));
    assert.match(entrades.get(`${SLUG}/readme.txt`).toString(), /https:\/\/socdepoble.org\/assets\//);
    assert.match(entrades.get(`${SLUG}/socdepoble-enxufe.php`).toString(), /Version:\s+1\.1\.10-beta\.1/);
    assert.ok(!fs.existsSync(path.join(f.plugin, 'builds/stable.json')));
    fs.appendFileSync(path.join(f.dist, ENTRADA), 'alterat');
    assert.throws(() => creaPaquetLleuger({ arrelPlugin: f.plugin }), /no coincidix|mida|sha256|canviat/i);
    segella([...fitxers, { cami: 'gran.bin', contingut: crypto.randomBytes(LIMIT_LLEUGER) }]);
    assert.throws(() => creaPaquetLleuger({ arrelPlugin: f.plugin }), /ha de quedar per davall/);
    segella([...fitxers, { cami: 'assets/fotos/encara.png', contingut: Buffer.from('imatge') }]);
    assert.throws(() => creaPaquetLleuger({ arrelPlugin: f.plugin }), /encara porta assets locals/);
    segella(fitxers, { ...mitjans, origen: 'https://localhost' });
    assert.throws(() => creaPaquetLleuger({ arrelPlugin: f.plugin }), /origen https públic/);
  } finally { neteja(f); }
});

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

test('la clau pública del plugin verifica el canal estable i el parser admet la fixture sense clau', () => {
  const publica = clauIncrustada(fs.readFileSync(path.join(PLUGIN_REAL, NOMES_CANAL_PROPI), 'utf8'));
  assert.match(publica, /^[0-9a-f]{64}$/);
  const canal = fs.readFileSync(path.join(PLUGIN_REAL, 'builds/stable.json'));
  const signatura = fs.readFileSync(path.join(PLUGIN_REAL, 'builds/stable.json.sig'), 'utf8').trim();
  assert.equal(verifica(canal, signatura, publica), true, 'la clau instal·lada verifica els bytes del canal');
  assert.equal(clauIncrustada("<?php define( 'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA', '' );"), '');
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
      '0.2.0.json', '0.2.0.json.sig', '260929_2200_wordpress_directori_v0.2.0.zip', '260929_2200_wordpress_enxufe_v0.2.0.zip', '260929_2200_estatic_spa_v0.2.0.zip', 'stable.json', 'stable.json.sig'
    ].sort());
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
    assert.ok(r.avisos.some((avis) => avis.includes('soc-de-poble-portal-de-pobles-connectats')), 'avisa de l\'slug que derivaria WordPress.org');
    assert.equal(canal.notes, 'https://socdepoble.org/enxufe/0.2.0');
    for (const [clau, nom] of [['wordpress', '260929_2200_wordpress_enxufe_v0.2.0.zip'], ['estatic', '260929_2200_estatic_spa_v0.2.0.zip']]) {
      const paquet = clau === 'wordpress' ? wp.paquet : canal.estatic.paquet;
      const zip = fs.readFileSync(path.join(f.sortida, nom));
      assert.equal(paquet.url, `https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v0.2.0/${nom}`);
      assert.equal(paquet.mida, zip.length);
      assert.equal(paquet.sha256, sha256(zip));
    }
    assert.equal(wp.directori.nom, '260929_2200_wordpress_directori_v0.2.0.zip');
    assert.equal(wp.directori.cami, wp.directori.nom);
    assert.equal(wp.directori.sha256, sha256(fs.readFileSync(path.join(f.sortida, '260929_2200_wordpress_directori_v0.2.0.zip'))));

    const propi = entradesDe(path.join(f.sortida, '260929_2200_wordpress_enxufe_v0.2.0.zip'));
    const directori = entradesDe(path.join(f.sortida, '260929_2200_wordpress_directori_v0.2.0.zip'));
    const estatic = entradesDe(path.join(f.sortida, '260929_2200_estatic_spa_v0.2.0.zip'));
    assert.ok([...propi.keys()].every((nom) => nom.startsWith(`${SLUG}/`)), `arrel ${SLUG}/`);
    assert.ok([...directori.keys()].every((nom) => nom.startsWith(`${SLUG}/`)), `arrel ${SLUG}/ també al directori`);
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
  // Gauntlet 261025_0545 (WP-01) · l'SLUG ja no és 'socdepoble-enxufe': la mateixa comprovació, amb el valor literal.
  assert.equal(slugDelNom('socdepoble-enxufe'), 'socdepoble-enxufe');
  assert.equal(slugDelNom('socdepoble'), SLUG);
  assert.equal(slugDelNom('  Àrea_de  Proves.v2 '), 'area-de-proves-v2');
});

/* Gauntlet 261025_0545 (WP-01) · 9027265e1 va canviar SOCDEPOBLE_ENXUFE_SLUG a 'socdepoble' i
   l'empaquetador va continuar amb 'socdepoble-enxufe': el PHP de HEAD rebutjava el canal, la
   carpeta i el zip que fabricava l'eina de HEAD. Una sola font: la constant del plugin. */
test('WP-01: l\'SLUG de l\'empaquetador és el SOCDEPOBLE_ENXUFE_SLUG del plugin (decisió del Mestre, 261023)', () => {
  const php = fs.readFileSync(path.join(PLUGIN_REAL, 'socdepoble-enxufe.php'), 'utf8');
  const delPlugin = php.match(/^const SOCDEPOBLE_ENXUFE_SLUG\s*=\s*'([^']+)';$/m)?.[1];
  assert.equal(SLUG, delPlugin, 'arrel dels zips i adaptadors.wordpress.slug han de ser la carpeta que exigix el PHP');
  assert.equal(SLUG, 'socdepoble', 'una sola variant universal amb l\'slug de WordPress.org');
  assert.equal(slugDelPlugin(php), SLUG);
});

test('WP-01: l\'empaquetador no fabrica cap paquet si el plugin exigix una altra carpeta', () => {
  const { pem, publicaHex } = generaClau();
  const f = fixture({ clauPublica: publicaHex });
  try {
    const principal = path.join(f.plugin, 'socdepoble-enxufe.php');
    const php = fs.readFileSync(principal, 'utf8');
    assert.throws(() => slugDelPlugin(php.replace(/^const SOCDEPOBLE_ENXUFE_SLUG\b.*$/m, '')), /no definix SOCDEPOBLE_ENXUFE_SLUG/);
    fs.writeFileSync(principal, php.replace(/^(const SOCDEPOBLE_ENXUFE_SLUG\s*=\s*')[^']*(';)$/m, '$1socdepoble-enxufe$2'));
    assert.throws(() => empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: pem }), /exigix la carpeta socdepoble-enxufe/);
    assert.equal(fs.existsSync(f.sortida), false, 'zero paquets parcials');
    // El lleuger, amb un build que passa totes les altres portes: només l'slug el para.
    const lleuger = [{ cami: ENTRADA, contingut: Buffer.from('var SocDePoble = 1;\n') }];
    fs.rmSync(path.join(f.dist, 'assets'), { recursive: true, force: true });
    const segellat = manifestDeRelease({ versio: '1.1.10-beta.1', node: NODE_BO, fitxers: lleuger,
      generat: '2026-10-22T00:00:00.000Z', mitjans: { origen: 'https://socdepoble.org', externs: ['assets/'], bessones: [] } });
    fs.writeFileSync(path.join(f.dist, FITXER_RELEASE), segellat.manifestText);
    fs.writeFileSync(path.join(f.dist, FITXER_INVENTARI), segellat.inventariText);
    assert.throws(() => creaPaquetLleuger({ arrelPlugin: f.plugin }), /exigix la carpeta socdepoble-enxufe/);
    fs.writeFileSync(principal, php);
    assert.equal(creaPaquetLleuger({ arrelPlugin: f.plugin }).versio, '1.1.10-beta.1', 'amb l\'slug coherent, el mateix build s\'empaqueta');
  } finally { neteja(f); }
});

/* Gauntlet 261025_0545 (WP-06) · build:seo escriu dist/seo-routes.json després del build, fora de
   l'inventari: l'empaquetador el deixa com a resta i cap paquet no el porta. El readme no pot
   prometre unes previsualitzacions que cap instal·lació pot servir. */
test('WP-06: seo-routes.json fora de l\'inventari no viatja i el readme dels paquets no en promet les previsualitzacions', () => {
  const { pem, publicaHex } = generaClau();
  const f = fixture({ clauPublica: publicaHex });
  try {
    fs.writeFileSync(path.join(f.dist, 'seo-routes.json'), '{"/mur":{"titol":"Mur"}}\n');
    const r = empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: pem });
    assert.ok(r.restes.includes('seo-routes.json'), 'resta fora de l\'inventari');
    for (const nom of r.escrits.filter((n) => n.endsWith('.zip'))) {
      const entrades = entradesDe(path.join(f.sortida, nom));
      assert.ok(![...entrades.keys()].some((n) => n.endsWith('/seo-routes.json')), `${nom} no porta la taula`);
      const readme = entrades.get(`${SLUG}/readme.txt`)?.toString('utf8');
      if (!readme) continue;
      const seccio = readme.split(/^== Link previews per route ==$/m)[1]?.split(/^== /m)[0] ?? '';
      if (seccio) assert.match(seccio, /do not include the route table `dist\/seo-routes\.json`/, `${nom}: el readme diu que la taula no viatja`);
    }
  } finally { neteja(f); }
});

/* ───────── Gauntlet 261025_0545 (WP-01 i MISSED P3) · el canal de punta a punta amb PHP real ─────────
   El paquet que fabrica l'empaquetador, descomprimit a WP_PLUGIN_DIR i carregat pel seu fitxer
   principal com faria WordPress, amb el canal signat que l'acompanya. Només els stubs de WordPress
   que recorre el camí; cap xarxa: wp_safe_remote_get servix el canal i la seua .sig. */

function cercaPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const instal_lats = fs.existsSync(studio)
    ? fs.readdirSync(studio).sort().reverse().map((versio) => path.join(studio, versio, 'php'))
    : [];
  return ['php', ...instal_lats].find((binari) => spawnSync(binari, ['-v'], { timeout: 5000 }).status === 0);
}

const PHP = cercaPhp();
const AMB_PHP = { skip: !PHP && 'PHP absent: instal·la PHP o indica PHP_BIN (també es detecta WordPress Studio).' };

const RUNNER_CANAL = String.raw`<?php
define( 'ABSPATH', __DIR__ . '/' );
define( 'WP_PLUGIN_DIR', realpath( $argv[1] ) );
$cas                = json_decode( (string) file_get_contents( 'php://stdin' ), true );
$GLOBALS['filtres'] = array();
$GLOBALS['opcions'] = array();
$GLOBALS['servit']  = array();
function add_filter( $nom, $callback, $prioritat = 10, $arguments = 1 ) { $GLOBALS['filtres'][ $nom ][] = $callback; return true; }
function add_action( $nom, $callback, $prioritat = 10, $arguments = 1 ) { return add_filter( $nom, $callback, $prioritat, $arguments ); }
function register_activation_hook( $fitxer, $callback ) {}
function __( $text, $domini = 'default' ) { return $text; }
function esc_html__( $text, $domini = 'default' ) { return $text; }
function esc_html( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $url ) { return (string) $url; }
function esc_url_raw( $url, $protocols = null ) { return (string) $url; }
function wp_kses_post( $html ) { return $html; }
function sanitize_text_field( $text ) { return trim( strip_tags( (string) $text ) ); }
function wp_parse_url( $url, $component = -1 ) { return parse_url( $url, $component ); }
function trailingslashit( $text ) { return rtrim( $text, '/' ) . '/'; }
function untrailingslashit( $text ) { return rtrim( $text, '/' ); }
function plugin_basename( $fitxer ) { return substr( $fitxer, strlen( trailingslashit( WP_PLUGIN_DIR ) ) ); }
function plugin_dir_path( $fitxer ) { return trailingslashit( dirname( $fitxer ) ); }
function is_multisite() { return false; }
function wp_get_environment_type() { return 'production'; }
function get_site_option( $clau, $defecte = false ) { return $GLOBALS['opcions'][ $clau ] ?? $defecte; }
function update_option( $clau, $valor, $autoload = null ) { $GLOBALS['opcions'][ $clau ] = $valor; return true; }
function is_wp_version_compatible( $versio ) { return true; }
function is_php_version_compatible( $versio ) { return true; }
function get_file_data( $fitxer, $capcaleres ) {
	$text   = (string) file_get_contents( $fitxer );
	$valors = array();
	foreach ( $capcaleres as $clau => $nom ) {
		$valors[ $clau ] = preg_match( '/^[ \t\/*#@]*' . preg_quote( $nom, '/' ) . ':(.*)$/mi', $text, $m ) ? trim( $m[1] ) : '';
	}
	return $valors;
}
class WP_Error {
	private $missatge;
	public function __construct( $codi = '', $missatge = '' ) { $this->missatge = $missatge; }
	public function get_error_message() { return $this->missatge; }
}
function is_wp_error( $valor ) { return $valor instanceof WP_Error; }
function wp_safe_remote_get( $url, $args = array() ) { return $GLOBALS['servit'][ $url ] ?? new WP_Error( 'sdp_prova', 'sense resposta' ); }
function wp_remote_retrieve_response_code( $resposta ) { return $resposta['code']; }
function wp_remote_retrieve_body( $resposta ) { return $resposta['body']; }

$principals = glob( WP_PLUGIN_DIR . '/*/socdepoble-enxufe.php' );
if ( 1 !== count( $principals ) ) {
	fwrite( STDERR, 'Esperava una sola carpeta del plugin.' );
	exit( 1 );
}
require $principals[0];
$fitxer  = plugin_basename( SOCDEPOBLE_ENXUFE_FITXER );
$sortida = array( 'fitxer' => $fitxer, 'slug' => SOCDEPOBLE_ENXUFE_SLUG, 'filtres' => array_keys( $GLOBALS['filtres'] ), 'zip' => class_exists( 'ZipArchive' ) );
if ( function_exists( 'socdepoble_enxufe_analitza_canal' ) ) {
	$cos = (string) file_get_contents( $cas['canal'] );
	$sig = (string) file_get_contents( $cas['canal'] . '.sig' );
	$GLOBALS['servit'][ SOCDEPOBLE_ENXUFE_CANAL ]          = array( 'code' => 200, 'body' => $cos );
	$GLOBALS['servit'][ SOCDEPOBLE_ENXUFE_CANAL . '.sig' ] = array( 'code' => 200, 'body' => $sig );
	list( $canal, $motiu ) = socdepoble_enxufe_analitza_canal( $cos, $sig );
	$sortida['canal']    = null !== $canal ? $canal['versio'] : $motiu;
	$sortida['bloqueig'] = socdepoble_enxufe_bloqueig_instal_lacio();
	$sortida['arrel']    = socdepoble_enxufe_error_arrel_zip( $cas['zip'] );
	$origen              = socdepoble_enxufe_seleccio_origen( dirname( SOCDEPOBLE_ENXUFE_FITXER ) . '/', '', null, array( 'plugin' => $fitxer ) );
	$sortida['origen']   = is_wp_error( $origen ) ? $origen->get_error_message() : '';
	$sortida['update']   = socdepoble_enxufe_update_plugins( false, array( 'Version' => $cas['installada'] ), $fitxer, array() );
	foreach ( array( 'directori' => SOCDEPOBLE_ENXUFE_SLUG, 'propi' => $sortida['update']['slug'] ) as $clau => $slug ) {
		$info                    = socdepoble_enxufe_plugins_api( false, 'plugin_information', (object) array( 'slug' => $slug ) );
		$sortida['api'][ $clau ] = is_object( $info ) ? array( 'slug' => $info->slug, 'download_link' => $info->download_link ) : $info;
	}
}
echo json_encode( $sortida );
`;

/** Empaqueta una fixture signada, descomprimix el zip triat a una carpeta de plugins i hi passa el runner. */
function canalAmbPhp(f, variant, cas = {}) {
  const { pem, publicaHex } = generaClau();
  fs.writeFileSync(path.join(f.plugin, NOMES_CANAL_PROPI), fs.readFileSync(path.join(f.plugin, NOMES_CANAL_PROPI), 'utf8')
    .replace(/define\(\s*'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA'\s*,\s*'[0-9a-fA-F]*'\s*\)/, `define( 'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA', '${publicaHex}' )`));
  const r = empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: URL_BASE, clauPem: pem });
  const zip = path.join(f.sortida, r.escrits.find((nom) => nom.includes(`_wordpress_${variant}_`)));
  const plugins = path.join(f.arrel, `plugins-${variant}`);
  for (const { nom, dades } of llegixZip(fs.readFileSync(zip))) {
    fs.mkdirSync(path.dirname(path.join(plugins, nom)), { recursive: true });
    fs.writeFileSync(path.join(plugins, nom), dades);
  }
  const runner = path.join(f.arrel, 'canal.php');
  fs.writeFileSync(runner, RUNNER_CANAL);
  const p = spawnSync(PHP, [runner, plugins], {
    encoding: 'utf8', timeout: 15000,
    input: JSON.stringify({ canal: path.join(f.sortida, 'stable.json'), zip, installada: '0.1.0', ...cas })
  });
  assert.equal(p.status, 0, p.error?.message || p.stderr || p.stdout);
  assert.equal(p.stderr, '');
  return JSON.parse(p.stdout);
}

test('WP-01: el PHP del paquet accepta el canal, la carpeta i el zip que fabrica l\'empaquetador', AMB_PHP, () => {
  const f = fixture();
  try {
    const propi = canalAmbPhp(f, 'enxufe');
    assert.equal(propi.slug, SLUG, 'la mateixa carpeta per al PHP i per a l\'empaquetador');
    assert.equal(propi.fitxer, `${SLUG}/socdepoble-enxufe.php`, 'el zip s\'instal·la a la carpeta que exigix el PHP');
    assert.equal(propi.canal, '0.2.0', 'el PHP del paquet accepta el canal signat que l\'acompanya');
    assert.equal(propi.bloqueig, '', 'instal·lat on el deixa el seu zip, es pot actualitzar');
    if (propi.zip) assert.equal(propi.arrel, '', 'l\'arrel del zip és la que exigix la primera barrera');
    assert.equal(propi.origen, '', 'i la segona (upgrader_source_selection)');
    assert.equal(propi.update.version, '0.2.0');
    assert.equal(propi.update.package, 'socdepoble-enxufe:0.2.0', 'paquet simbòlic de l\'oferta');
  } finally { neteja(f); }
});

/* MISSED P3 (verify-wp.txt) · amb SOCDEPOBLE_ENXUFE_SLUG = 'socdepoble', plugins_api responia per
   l'slug del plugin de WordPress.org: amb un paquet del canal propi actiu, «Instal·la ara» del
   plugin oficial rebia un download_link buit o simbòlic. */
test('MISSED P3: el canal propi només respon per la seua identitat, mai per l\'slug del directori; la variant universal no intercepta res', AMB_PHP, () => {
  const f = fixture();
  try {
    const propi = canalAmbPhp(f, 'enxufe');
    assert.equal(propi.api.directori, false, 'plugins_api deixa passar l\'slug de WordPress.org');
    assert.notEqual(propi.update.slug, SLUG, 'update_plugins no s\'anuncia amb l\'slug del directori');
    assert.equal(propi.api.propi?.slug, propi.update.slug, '«Mostra els detalls» respon amb el mateix slug que update_plugins');
    assert.ok(propi.filtres.includes('plugins_api') && propi.filtres.includes('update_plugins_socdepoble.org'));
  } finally { neteja(f); }
  const g = fixture();
  try {
    const directori = canalAmbPhp(g, 'directori');
    assert.equal(directori.fitxer, `${SLUG}/socdepoble-enxufe.php`);
    assert.equal(directori.canal, undefined, 'la variant del directori no porta l\'actualitzador');
    assert.ok(!directori.filtres.includes('plugins_api') && !directori.filtres.some((nom) => nom.startsWith('update_plugins_')), 'cap intercepció a la variant universal');
  } finally { neteja(g); }
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
      assert.equal(fs.existsSync(path.join(sortida, '260929_2200_estatic_spa_v0.2.0.zip')), false);
    } finally { neteja(f); }
  }
});

/* ───────────── Encàrrec 261019_1425 · Mitjans externs del directori ───────────── */

const MITJANS = Object.freeze({ origen: 'https://socdepoble.org', externs: ['assets/fotos/'], bessones: ['assets/ui/v.jpg'] });

/** La fixture amb una vinyeta i la seua bessona; el directori declara els mitjans
 *  i no porta ni la carpeta externa (fotos/) ni l'original substituït. */
function fixtureAmbMitjans(opcions = {}) {
  const { autonomAmbBessones = false, ...resta } = opcions;
  const f = fixture(resta);
  const vinyeta = crypto.randomBytes(2048);
  const bessona = crypto.randomBytes(512);
  const reescriu = (dist, fitxers, variant, mitjans) => {
    for (const { cami, contingut } of fitxers) {
      fs.mkdirSync(path.dirname(path.join(dist, cami)), { recursive: true });
      fs.writeFileSync(path.join(dist, cami), contingut);
    }
    const r = manifestDeRelease({ versio: '0.2.0', node: NODE_BO, fitxers, generat: '2026-09-29T20:00:00.000Z', variant, mitjans });
    fs.writeFileSync(path.join(dist, FITXER_RELEASE), r.manifestText);
    fs.writeFileSync(path.join(dist, FITXER_INVENTARI), r.inventariText);
  };
  const llig = (dist, cami) => ({ cami, contingut: fs.readFileSync(path.join(dist, cami)) });
  const comuns = ['fonts/noto-sans.css', 'rag-index.json'];
  reescriu(f.dist, [llig(f.dist, ENTRADA), ...comuns.map((c) => llig(f.dist, c)), llig(f.dist, 'assets/fotos/àrea.png'),
    ...(autonomAmbBessones ? [] : [{ cami: 'assets/ui/v.jpg', contingut: vinyeta }]), { cami: 'assets/ui/v.webp', contingut: bessona }], 'autonom',
    autonomAmbBessones ? { origen: null, externs: [], bessones: MITJANS.bessones } : undefined);
  if (autonomAmbBessones) fs.rmSync(path.join(f.dist, 'assets/ui/v.jpg'), { force: true });
  fs.rmSync(path.join(f.directori, 'assets/fotos'), { recursive: true, force: true });
  reescriu(f.directori, [llig(f.directori, ENTRADA), ...comuns.map((c) => llig(f.directori, c)),
    { cami: 'assets/ui/v.webp', contingut: bessona }], 'wordpress', MITJANS);
  return f;
}

test('verificaMitjans: l’autònom, com a molt les bessones i cap origen (D3); el directori només deixa fora externs i originals amb bessona', async () => {
  const { verificaMitjans } = await import('../wordpress-plugin/eines/empaqueta.mjs');
  const autonom = ['assets/fotos/a.png', 'assets/ui/v.jpg', 'assets/ui/v.webp', 'assets/ui/x.svg', ENTRADA];
  const directori = ['assets/ui/v.webp', 'assets/ui/x.svg', ENTRADA];
  const mitjans = { origen: 'https://socdepoble.org', externs: ['assets/fotos/'], bessones: 1 };
  assert.deepEqual(verificaMitjans({}, {}, autonom, autonom), { externs: 0, substituits: 0 }, 'sense política, res a comprovar');
  assert.deepEqual(verificaMitjans({}, { mitjans }, autonom, directori), { externs: 1, substituits: 1 });
  assert.throws(() => verificaMitjans({ mitjans }, { mitjans }, autonom, directori), /autònom no pot declarar/);
  // Decisió D3 del Mestre (261019) · L'autònom pot substituir les bessones, però mai sense declarar-ne les mateixes ni amb cap origen.
  const autonomBessones = { origen: null, externs: [], bessones: 1 };
  assert.deepEqual(verificaMitjans({ mitjans: autonomBessones }, { mitjans }, ['assets/fotos/a.png', 'assets/ui/v.webp', 'assets/ui/x.svg', ENTRADA], directori), { externs: 1, substituits: 0 });
  assert.throws(() => verificaMitjans({ mitjans: { ...autonomBessones, bessones: 2 } }, { mitjans }, autonom, directori), /mateixes bessones \(2 i 1\)/);
  for (const dolent of [{ ...autonomBessones, origen: 'https://socdepoble.org' }, { ...autonomBessones, externs: ['assets/fotos/'] }, { bessones: 1 }]) {
    assert.throws(() => verificaMitjans({ mitjans: dolent }, { mitjans }, autonom, directori), /autònom no pot declarar/, JSON.stringify(dolent));
  }
  assert.throws(() => verificaMitjans({}, { mitjans }, autonom, [...directori, 'assets/fotos/a.png']), /porta un mitjà extern: assets\/fotos\/a\.png/);
  assert.throws(() => verificaMitjans({}, { mitjans }, autonom, ['assets/ui/v.webp', ENTRADA]), /sense ser extern ni tindre la bessona: assets\/ui\/x\.svg/);
  assert.throws(() => verificaMitjans({}, { mitjans }, autonom, ['assets/ui/x.svg', ENTRADA]), /sense ser extern ni tindre la bessona: assets\/ui\/v\.jpg/);
  // La regla d'única font del build: amb un germà del mateix nom, l'original no té bessona i no pot faltar.
  const ambGerma = [...autonom, 'assets/ui/v.png'];
  assert.throws(() => verificaMitjans({}, { mitjans }, ambGerma, [...directori, 'assets/ui/v.png']), /sense ser extern ni tindre la bessona: assets\/ui\/v\.jpg/);
  for (const origen of ['http://socdepoble.org', 'https://socdepoble.org/', 'socdepoble.org', '', 'https://x.org?a=1', 'https://localhost:3340', 'https://192.168.1.10', 'http://localhost:3340']) {
    assert.throws(() => verificaMitjans({}, { mitjans: { ...mitjans, origen } }, autonom, directori), /origen dels mitjans/, origen);
  }
  // Amb --prova, un origen local (WordPress Studio contra el servidor de desenvolupament), com origenDeMitjans fora de les releases.
  for (const origen of ['http://localhost:3340', 'https://localhost:3340']) {
    assert.deepEqual(verificaMitjans({}, { mitjans: { ...mitjans, origen } }, autonom, directori, { prova: true }), { externs: 1, substituits: 1 }, origen);
  }
  assert.throws(() => verificaMitjans({}, { mitjans: { ...mitjans, origen: 'http://socdepoble.org' } }, autonom, directori, { prova: true }), /origen dels mitjans/);
  for (const externs of [['assets/fotos'], ['fotos/'], ['assets/../x/'], 'assets/fotos/', null]) {
    assert.throws(() => verificaMitjans({}, { mitjans: { ...mitjans, externs } }, autonom, directori), /carpetes d'assets/, JSON.stringify(externs));
  }
});

test('el readme del directori declara el servidor de mitjans en lloc del canal propi; sense mitjans, com abans', () => {
  const readme = fs.readFileSync(path.join(PLUGIN_REAL, 'readme.txt'), 'utf8');
  const sense = variantDirectoriReadme(readme);
  assert.doesNotMatch(sense, /media server/);
  const amb = variantDirectoriReadme(readme, { origen: 'https://socdepoble.org', externs: ['assets/uploads/', 'assets/towns/'] });
  assert.match(amb, /^6\. Sóc de Poble media server: .*: uploads, towns\) are not bundled\. The visitor's browser loads each one from https:\/\/socdepoble\.org\/assets\/ when a page shows it; .*IP address, browser user agent and the address of the page\. Terms and privacy information: https:\/\/socdepoble\.org\/legal$/m);
  assert.doesNotMatch(amb, /no visitor data is sent|to keep this package small/, 'cap afirmació falsa ni cap motiu de mida');
  assert.doesNotMatch(amb, /Update channel \(/);
  assert.ok(amb.indexOf('6. Sóc de Poble media server') > amb.indexOf('== External services =='));
  assert.ok(amb.indexOf('6. Sóc de Poble media server') < amb.indexOf('== Link previews per route =='));
  // Un «$» de l'origen no es llig com a patró de replace().
  assert.match(variantDirectoriReadme(readme, { origen: 'https://x.example/$1$&', externs: ['assets/uploads/'] }), /https:\/\/x\.example\/\$1\$&\/assets\//);
  assert.ok(Buffer.byteLength(amb) < 20480, 'el readme del directori continua dins del límit');
});

test('empaqueta amb mitjans: el directori no porta els externs ni els originals substituïts; amb un autònom sense política (d’abans de D3), el canal propi i l’estàtic, tot', () => {
  const f = fixtureAmbMitjans();
  try {
    const r = empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: 'http://localhost:8881/enxufe/', prova: true });
    assert.deepEqual({ externs: r.mitjans.externs, substituits: r.mitjans.substituits, origen: r.mitjans.origen, bessones: r.mitjans.bessones, bessonesAutonom: r.mitjans.bessonesAutonom },
      { externs: 1, substituits: 1, origen: 'https://socdepoble.org', bessones: 1, bessonesAutonom: 0 });
    const zipDe = (prefix) => entradesDe(path.join(f.sortida, r.escrits.find((nom) => nom.includes(prefix))));
    const propi = zipDe('_wordpress_enxufe_');
    const estatic = zipDe('_estatic_spa_');
    const directori = zipDe('_wordpress_directori_');
    for (const cami of ['assets/fotos/àrea.png', 'assets/ui/v.jpg', 'assets/ui/v.webp']) {
      assert.ok(propi.has(`${SLUG}/dist/${cami}`), `canal propi: ${cami}`);
      assert.ok(estatic.has(`soc-de-poble/${cami}`), `estàtic: ${cami}`);
    }
    assert.ok(!directori.has(`${SLUG}/dist/assets/fotos/àrea.png`), 'l’extern no viatja');
    assert.ok(!directori.has(`${SLUG}/dist/assets/ui/v.jpg`), 'l’original substituït no viatja');
    assert.ok(directori.has(`${SLUG}/dist/assets/ui/v.webp`), 'la bessona sí');
    const manifest = JSON.parse(directori.get(`${SLUG}/dist/${FITXER_RELEASE}`).toString('utf8'));
    assert.deepEqual(manifest.mitjans, { origen: 'https://socdepoble.org', externs: ['assets/fotos/'], bessones: 1 });
    assert.match(directori.get(`${SLUG}/readme.txt`).toString('utf8'), /6\. Sóc de Poble media server/);
    assert.doesNotMatch(propi.get(`${SLUG}/readme.txt`).toString('utf8'), /media server/);
    // La diferència entre el canal propi i el directori: l'actualitzador i el que la política declara.
    assert.deepEqual([...propi.keys()].filter((nom) => !directori.has(nom)).sort(),
      [`${SLUG}/${NOMES_CANAL_PROPI}`, `${SLUG}/dist/assets/fotos/àrea.png`, `${SLUG}/dist/assets/ui/v.jpg`].sort());
  } finally { neteja(f); }
});

test('empaqueta amb l’autònom substituint també (D3): cap zip porta l’original amb bessona; només el directori deixa fora els externs', () => {
  const f = fixtureAmbMitjans({ autonomAmbBessones: true });
  try {
    const r = empaqueta({ arrelPlugin: f.plugin, sortida: f.sortida, urlBase: 'http://localhost:8881/enxufe/', prova: true });
    const zipDe = (prefix) => entradesDe(path.join(f.sortida, r.escrits.find((nom) => nom.includes(prefix))));
    const propi = zipDe('_wordpress_enxufe_');
    const estatic = zipDe('_estatic_spa_');
    const directori = zipDe('_wordpress_directori_');
    for (const [zip, prefix] of [[propi, `${SLUG}/dist/`], [estatic, 'soc-de-poble/'], [directori, `${SLUG}/dist/`]]) {
      assert.ok(!zip.has(`${prefix}assets/ui/v.jpg`) && zip.has(`${prefix}assets/ui/v.webp`), prefix);
    }
    assert.ok(propi.has(`${SLUG}/dist/assets/fotos/àrea.png`), 'l’autònom porta el contingut del servei');
    assert.ok(!directori.has(`${SLUG}/dist/assets/fotos/àrea.png`), 'el directori, no');
    const manifest = JSON.parse(propi.get(`${SLUG}/dist/${FITXER_RELEASE}`).toString('utf8'));
    assert.deepEqual(manifest.mitjans, { origen: null, externs: [], bessones: 1 });
    // El canal signat porta el manifest de l'autònom: la clau additiva hi va, sense cap origen extern.
    assert.deepEqual(r.canal.mitjans, { origen: null, externs: [], bessones: 1 });
    assert.deepEqual([...propi.keys()].filter((nom) => !directori.has(nom)).sort(),
      [`${SLUG}/${NOMES_CANAL_PROPI}`, `${SLUG}/dist/assets/fotos/àrea.png`].sort());
  } finally { neteja(f); }
});
