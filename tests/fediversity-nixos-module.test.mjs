import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validaOpcionsNode, llegeixOpenDataPublic, preparaPublicacio } from '../nix/prepare-public.mjs';
import { preparaFederacio, fitxersDelServidor, escriuFederacio } from '../tooling/seo/genera-federacio.mjs';
import { validatePublicCredentials } from '../src/config/publicCredentials.js';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const OPTIONS = Object.freeze({ domain: 'poble.example.org',
  municipality: Object.freeze({ slug: 'la-torre-de-les-macanes', name: 'La Torre de les Maçanes' }),
  enableActivityPub: true, enableOpenData: true });
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

// Lèxic mínim de Nix (comentaris, "…", ''…'' i ${…}): per a cada {, [ o ( de codi, on es
// tanca; falla si n'hi ha cap de desaparellat. És una comprovació textual: no parseja ni
// avalua Nix (això ho fa nix-instantiate a l'última prova, quan hi és).
function parellsNix(text) {
  const pila = [];
  const tancaments = new Map();
  const linia = i => text.slice(0, i).split('\n').length;
  for (let i = 0; i < text.length;) {
    const dins = pila.at(-1)?.obri;
    const dos = text.slice(i, i + 2);
    if (dins === '"' || dins === "''") {
      if (dins === '"' && text[i] === '\\') i += 2;
      else if (dins === "''" && /^''[$'\\]/.test(text.slice(i, i + 3))) i += text[i + 2] === '\\' ? 4 : 3;
      else if (dos === '$$') i += 2;
      else if (dos === '${') { pila.push({ obri: '${', i }); i += 2; }
      else if (dins === '"' ? text[i] === '"' : dos === "''") { pila.pop(); i += dins.length; }
      else i += 1;
    } else if (text[i] === '#') i = text.includes('\n', i) ? text.indexOf('\n', i) : text.length;
    else if (dos === '/*') {
      const fi = text.indexOf('*/', i + 2);
      if (fi < 0) throw new Error(`comentari sense tancar a la línia ${linia(i)}`);
      i = fi + 2;
    } else if (dos === "''" || text[i] === '"') { pila.push({ obri: dos === "''" ? dos : '"', i }); i += dos === "''" ? 2 : 1; }
    else if ('{[('.includes(text[i])) { pila.push({ obri: text[i], i }); i += 1; }
    else if ('}])'.includes(text[i])) {
      const obert = pila.pop();
      if (!obert || !{ '}': ['{', '${'], ']': ['['], ')': ['('] }[text[i]].includes(obert.obri)) {
        throw new Error(`«${text[i]}» desaparellat a la línia ${linia(i)}`);
      }
      tancaments.set(obert.i, i);
      i += 1;
    } else i += 1;
  }
  if (pila.length) throw new Error(`«${pila.at(-1).obri}» sense tancar des de la línia ${linia(pila.at(-1).i)}`);
  return tancaments;
}

// El cos { … } que obri la primera clau a partir d'inici, i el text que el seguix.
function brancaActiva(text, parells, inici) {
  const obri = text.indexOf('{', inici);
  const tanca = parells.get(obri);
  return { cos: text.slice(obri, tanca + 1), resta: text.slice(tanca + 1) };
}

// Cada location federada de l'arrel i cada ruta activa de la façana cauen en 404 si
// enableActivityPub és fals; cada location /opendata, si ho és enableOpenData.
function comprovaInterruptors(module, arrel) {
  const parells = parellsNix(module);
  const apPaths = [...module.match(/\bapPaths = \[([^\]]*)\]/)[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const federades = [...arrel.matchAll(/^\s*"([^"]+)" = \{/gm)].map(m => m[1]).filter(r => /\/ap\/|webfinger|nodeinfo/.test(r));
  assert.ok(federades.length >= 6, 'locations federades de l’arrel');
  for (const ruta of federades) assert.ok(apPaths.includes(ruta), `apPaths no desactiva ${ruta}`);
  const inici = module.indexOf('(if cfg.enableActivityPub then {');
  assert.ok(inici > 0, 'les rutes AP no depenen de cfg.enableActivityPub');
  const ap = brancaActiva(module, parells, inici);
  assert.match(ap.resta, /^ else lib\.genAttrs \(apPaths \+\+ \[ "= \/ap\/actor\.json" \]\) \(_: mkForce disabled\)\)/);
  const actives = [...ap.cos.matchAll(/^\s*"([^"]+)"(?:\.extraConfig)? =/gm)].map(m => m[1]);
  assert.ok(actives.length >= 5, 'rutes AP actives');
  for (const ruta of actives) assert.ok([...apPaths, '= /ap/actor.json'].includes(ruta), `${ruta} no es desactiva amb AP`);
  const opendata = [...module.matchAll(/^\s*"([^"]*\/opendata[^"]*)" = (.*)$/gm)];
  assert.ok(opendata.length >= 3, 'locations Open Data');
  for (const m of opendata) {
    if (m[2] === 'mkForce disabled;') continue;
    assert.ok(m[2].startsWith('mkForce (if cfg.enableOpenData then {'), `${m[1]} no depén de cfg.enableOpenData`);
    assert.match(brancaActiva(module, parells, m.index + m[0].indexOf(m[2])).resta, /^ else disabled\);/, m[1]);
  }
}

// Guarda en avaluar de nix/flake.nix: [, cos Nix de l'ERE, camp, valor per defecte, missatge].
const GUARDA_NIX = /assert lib\.assertMsg \(builtins\.match "((?:[^"\\]|\\.)*)" \(settings\.(publicKey|supabaseUrl) or "([^"]+)"\) != null\)\s*"([^"]*)";/g;
// Cos d'una cadena "…" de Nix → el text que rep builtins.match: \x val x, llevat de \n, \r i \t.
const desNix = s => s.replace(/\\(.)/gs, (_, c) => ({ n: '\n', r: '\r', t: '\t' })[c] ?? c);

// Subconjunt de POSIX ERE que std::regex::extended (el motor de builtins.match) compila a libc++ i
// a libstdc++ estricte (només escapa .[\()*+?{|^$), i que JS sense /u llig igual: torna el patró o
// llança. No és std::regex: la compilació real només la fa Nix, a l'última prova, quan hi és.
function ereComuna(ere) {
  let i = 0;
  let atom = false; // hi ha un àtom just davant: admet un quantificador
  let buida = true; // la branca actual encara no té res
  let grups = 0;
  const fora = motiu => { throw new Error(`ERE fora del subconjunt comú (posició ${i}): ${motiu}`); };
  if (/[^\x20-\x7e]/.test(ere)) fora('només ASCII imprimible (std::regex compara bytes UTF-8)');
  while (i < ere.length) {
    const c = ere[i];
    if (c === '\\') {
      if (!'.[\\()*+?{|^$'.includes(ere[i + 1] || '!')) fora(`escapament «\\${ere[i + 1] ?? ''}»`);
      i += 2;
    } else if (c === '[') {
      const inici = i + (ere[i + 1] === '^' ? 2 : 1);
      const fi = ere.indexOf(']', inici + 1);
      const cos = ere.slice(inici, fi);
      if (ere[inici] === ']' || fi < 0) fora('«]» inicial (JS hi veu una classe buida) o claudàtor sense tancar');
      if (/\\|\[[:.=]/.test(cos)) fora('barra o classe POSIX dins de claudàtors');
      const rangs = /^-?((?:[^-](?:-[^-])?)*)-?$/.exec(cos);
      if (!rangs || [...rangs[1].matchAll(/([^-])-([^-])/g)].some(([, a, b]) => a > b)) fora('guionet ambigu o rang invertit');
      i = fi + 1;
    } else if ('*+?{'.includes(c)) {
      const interval = /^\{(\d{1,3})(,(\d{1,3})?)?\}/.exec(ere.slice(i));
      if (!atom || (c === '{' && (!interval || (interval[3] && +interval[1] > +interval[3])))) fora(`quantificador «${c}» sense àtom, repetit o mal format`);
      i += c === '{' ? interval[0].length : 1;
      atom = false;
      continue;
    } else if (c === '(' || c === '|') {
      if (c === '|' && buida) fora('alternativa buida');
      grups += c === '(' ? 1 : 0;
      i += 1;
      atom = false;
      buida = true;
      continue;
    } else if (c === ')') {
      if (!grups || buida) fora('grup buit o «)» sense obrir');
      grups -= 1;
      i += 1;
    } else if ('.^$'.includes(c)) fora(`«${c}» sense escapar (comodí que en POSIX casa el salt de línia, o àncora)`);
    else i += 1;
    atom = true;
    buida = false;
  }
  if (grups || buida) fora('grup sense tancar o patró buit');
  return ere;
}

function temp(t) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-nixos-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
async function fixture(t, settings = OPTIONS) {
  const dist = temp(t);
  const options = validaOpcionsNode(settings);
  const fed = await preparaFederacio({ arrel: ROOT, origen: options.origin,
    identitat: { slug: options.municipality.slug, nom: options.municipality.name, origen: options.origin } });
  escriuFederacio({ desti: dist, ap: fed.ap, fitxers: new Map([...fed.fitxers, ...fitxersDelServidor(fed)]) });
  fs.cpSync(path.join(ROOT, 'public/opendata'), path.join(dist, 'opendata'), { recursive: true });
  return { dist, fed, options, args: { root: ROOT, dist, options } };
}

test('Pilar1: opcions primitives, identitat immutable i cap extensió d’autoritat', () => {
  const value = validaOpcionsNode({ ...OPTIONS, role: 'admin', privateKey: 'no es propaga' });
  assert.equal(value.origin, 'https://poble.example.org');
  assert.deepEqual(Object.keys(value).sort(), ['domain', 'enableActivityPub', 'enableOpenData', 'municipality', 'origin']);
  assert.ok(Object.isFrozen(value));
  assert.ok(Object.isFrozen(value.municipality));
});

test('Pilar1: municipality abreujat de La Torre publica el paquet real sense canviar-ne el nom', async t => {
  const f = await fixture(t, { ...OPTIONS, municipality: 'la-torre-de-les-macanes' });
  assert.deepEqual(f.options.municipality, OPTIONS.municipality);
  const result = await preparaPublicacio({ ...f.args, options: { ...OPTIONS, municipality: 'la-torre-de-les-macanes' } });
  assert.equal(result.openDataVersion, '1.2.0');
  const actor = JSON.parse(fs.readFileSync(path.join(f.dist, 'ap/actor.json')));
  assert.equal(actor.preferredUsername, OPTIONS.municipality.slug);
  const node = JSON.parse(fs.readFileSync(path.join(f.dist, 'nodeinfo/2.1.json')));
  assert.equal(node.metadata.nodeName, 'La Torre de les Maçanes · Sóc de Poble');
  assert.deepEqual(fs.readFileSync(path.join(f.dist, 'opendata/municipi.jsonld')), fs.readFileSync(path.join(ROOT, 'public/opendata/municipi.jsonld')));
});

test('Pilar1: un slug nou conserva nom=slug i publica AP sense atribuir-se Open Data de La Torre', async t => {
  const settings = { ...OPTIONS, municipality: 'sella', enableOpenData: false };
  const f = await fixture(t, settings);
  assert.deepEqual(f.options.municipality, { slug: 'sella', name: 'sella' });
  const result = await preparaPublicacio({ ...f.args, options: settings });
  assert.equal(result.actorAlias, true);
  assert.equal(result.openDataVersion, null);
  const node = JSON.parse(fs.readFileSync(path.join(f.dist, 'nodeinfo/2.1.json')));
  assert.equal(node.metadata.nodeName, 'sella · Sóc de Poble');
  assert.throws(() => llegeixOpenDataPublic(path.join(ROOT, 'public/opendata'), { ...settings, enableOpenData: true }), /no correspon al municipi/);
});

test('Pilar1: rebutja injecció Nginx, esquemes, ports, comodins, controls i DNS invàlid', () => {
  for (const domain of ['https://poble.example', 'poble.example:443', '*.example.org', 'poble.example/route',
    'poble.example; return 200;', 'poble.example\nserver{}', 'Poble.example', 'a..example', '-a.example',
    `${'a'.repeat(64)}.example`, {}, null, 'x'.repeat(254)]) {
    assert.throws(() => validaOpcionsNode({ ...OPTIONS, domain }), /domini/);
  }
});

test('Pilar1: rebutja identitat prestada, text no primitiu i flags ambigus', () => {
  for (const municipality of [{ slug: 'socdepoble', name: 'Poble' }, { slug: '../private', name: 'Poble' },
    { slug: 'poble', name: 'Nom\nretallat' }, { slug: 'poble', name: { toString() { throw new Error('no executar'); } } },
    'socdepoble', '../private', '', 'La-Torre', 'a\nsella', 'a'.repeat(65), new String('sella')]) {
    assert.throws(() => validaOpcionsNode({ ...OPTIONS, municipality }), /municipal/);
  }
  for (const enableActivityPub of ['false', 0, {}]) assert.throws(() => validaOpcionsNode({ ...OPTIONS, enableActivityPub }), /booleans/);
});

test('Pilar1: Open Data real 1.2.0, mida i SHA-256 de tots els recursos de la release', () => {
  const files = llegeixOpenDataPublic(path.join(ROOT, 'public/opendata'), OPTIONS);
  assert.equal(files.size, JSON.parse(read('public/opendata/manifest.json')).resources.length + 1);
  assert.ok(files.has('municipi.jsonld'));
  assert.ok(files.has('activitystreams.json'));
});

test('Pilar1: un recurs manipulat o absent falla abans de publicar cap aliàs', async t => {
  const f = await fixture(t);
  fs.appendFileSync(path.join(f.dist, 'opendata/agenda.jsonld'), ' ');
  await assert.rejects(preparaPublicacio(f.args), /Empremta o mida/);
  assert.equal(fs.existsSync(path.join(f.dist, 'ap/actor.json')), false);
  fs.unlinkSync(path.join(f.dist, 'opendata/agenda.jsonld'));
  await assert.rejects(preparaPublicacio(f.args), /ENOENT/);
});

test('Pilar1: el paquet d’un altre municipi no es reetiqueta ni s’inventa', async t => {
  const f = await fixture(t, { ...OPTIONS, municipality: { slug: 'sella', name: 'Sella' } });
  await assert.rejects(preparaPublicacio(f.args), /no correspon al municipi/);
  assert.equal(fs.existsSync(path.join(f.dist, 'ap/actor.json')), false);
});

test('Pilar1: traversal del manifest i symlink de recurs fallen tancats', async t => {
  const f = await fixture(t);
  const manifestFile = path.join(f.dist, 'opendata/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile));
  const original = manifest.resources[0].path;
  manifest.resources[0].path = '../fora.json';
  fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  assert.throws(() => llegeixOpenDataPublic(path.join(f.dist, 'opendata'), OPTIONS), /Camí públic/);
  manifest.resources[0].path = original;
  fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  const target = path.join(f.dist, 'opendata', original);
  fs.unlinkSync(target);
  fs.symlinkSync(path.join(ROOT, 'public/opendata', original), target);
  assert.throws(() => llegeixOpenDataPublic(path.join(f.dist, 'opendata'), OPTIONS), /enllaç simbòlic/);
});

test('Pilar1: actor/WebFinger/NodeInfo provenen del generador real i d’un sol poble', async t => {
  const f = await fixture(t);
  const result = await preparaPublicacio(f.args);
  assert.deepEqual(fs.readFileSync(path.join(f.dist, 'ap/actor.json')), fs.readFileSync(path.join(f.dist, `ap/actors/${OPTIONS.municipality.slug}.json`)));
  assert.equal(result.inboxRuntime, false);
  assert.equal(result.openDataVersion, '1.2.0');
  assert.deepEqual(f.fed.actors.map(a => a.slug), [OPTIONS.municipality.slug]);
  const jrd = JSON.parse(fs.readFileSync(path.join(f.dist, `.well-known/webfinger/${OPTIONS.municipality.slug}.json`)));
  assert.equal(jrd.subject, `acct:${OPTIONS.municipality.slug}@${OPTIONS.domain}`);
  const node = JSON.parse(fs.readFileSync(path.join(f.dist, 'nodeinfo/2.1.json')));
  assert.equal(node.version, '2.1');
  assert.equal(node.openRegistrations, false);
  assert.deepEqual(node.usage.users, {});
  assert.deepEqual(node.services.inbound, []);
  assert.equal(node.metadata.nodeName, 'La Torre de les Maçanes · Sóc de Poble');
});

test('Pilar1: servir Open Data en un altre domini conserva autoria, procedència i hashes originals', async t => {
  const f = await fixture(t);
  const before = llegeixOpenDataPublic(path.join(ROOT, 'public/opendata'), OPTIONS);
  await preparaPublicacio(f.args);
  for (const [name, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(f.dist, 'opendata', name)), bytes, name);
  const original = JSON.parse(before.get('municipi.jsonld'));
  assert.match(original.subjectOf.url, /^https:\/\/socdepoble\.org\//);
  assert.ok(!original.subjectOf.url.includes(OPTIONS.domain));
  const actor = JSON.parse(fs.readFileSync(path.join(f.dist, 'ap/actor.json')));
  assert.ok(actor.id.startsWith(`https://${OPTIONS.domain}/`));
});

test('Pilar1: un altre origen, un inbox no buit o NodeInfo d’un altre node no passen', async t => {
  for (const which of ['actor', 'inbox', 'nodeinfo']) {
    const f = await fixture(t);
    const file = which === 'actor' ? `ap/actors/${OPTIONS.municipality.slug}.json`
      : which === 'inbox' ? `ap/inbox/${OPTIONS.municipality.slug}` : 'nodeinfo/2.1.json';
    const obj = JSON.parse(fs.readFileSync(path.join(f.dist, file)));
    if (which === 'actor') obj.id = `https://altre.example/${file}`;
    if (which === 'inbox') obj.totalItems = 1;
    if (which === 'nodeinfo') obj.metadata.nodeName = 'Un altre poble';
    fs.writeFileSync(path.join(f.dist, file), JSON.stringify(obj));
    await assert.rejects(preparaPublicacio(f.args), /Actor, descoberta o NodeInfo/);
    assert.equal(fs.existsSync(path.join(f.dist, 'ap/actor.json')), false);
  }
});

test('Pilar1: symlink de descoberta o d’eixida no travessa la frontera del dist', async t => {
  const f = await fixture(t);
  const target = path.join(f.dist, '.well-known/nodeinfo');
  const outside = temp(t);
  fs.copyFileSync(target, path.join(outside, 'nodeinfo'));
  fs.unlinkSync(target);
  fs.symlinkSync(path.join(outside, 'nodeinfo'), target);
  await assert.rejects(preparaPublicacio(f.args), /enllaç simbòlic/);
  assert.equal(fs.existsSync(path.join(f.dist, 'ap/actor.json')), false);
});

test('Pilar1: interruptors independents; el municipi sense snapshot pot publicar només AP', async t => {
  const f = await fixture(t, { ...OPTIONS, municipality: { slug: 'sella', name: 'Sella' }, enableOpenData: false });
  const result = await preparaPublicacio(f.args);
  assert.equal(result.actorAlias, true);
  assert.equal(result.openDataVersion, null);
  const dist = temp(t);
  const none = await preparaPublicacio({ root: ROOT, dist, options: { ...OPTIONS, enableActivityPub: false, enableOpenData: false } });
  assert.deepEqual(none.files, []);
});

test('Pilar1: lliurament byte a byte estable i CLI real sobre dist separat', async t => {
  const f = await fixture(t);
  const config = path.join(temp(t), 'config.json');
  fs.writeFileSync(config, JSON.stringify(OPTIONS));
  const args = [path.join(ROOT, 'nix/prepare-public.mjs'), '--root', ROOT, '--dist', f.dist, '--config', config];
  const first = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  const bytes = fs.readFileSync(path.join(f.dist, 'ap/actor.json'));
  const second = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(fs.readFileSync(path.join(f.dist, 'ap/actor.json')), bytes);
  assert.equal(first.stdout, second.stdout);
});

test('Pilar1: CLI amb --open-data-source: paquet aportat, camí absent o d’un altre municipi', async t => {
  const config = path.join(temp(t), 'config.json');
  const font = path.join(temp(t), 'paquet-public');
  // El directori font conté els recursos del Data Package, no els annexos
  // locals ignorats per git. Els extraiem del ZIP real del snapshot immutable.
  const { generaOpenData } = await import('../tooling/seo/genera-opendata.mjs');
  const { llegeixZip } = await import('../src/utils/fulls/zip.js');
  const snapshot = JSON.parse(read('public/opendata/snapshot-public.json'));
  const { paquet } = await generaOpenData({ snapshot, escriu: false, fetchImpl: () => { throw new Error('Xarxa prohibida en la fixture.'); } });
  fs.mkdirSync(font);
  const prefix = `${paquet.arrel}/data/`;
  for (const fitxer of llegeixZip(paquet.zip).filter(f => f.nom.startsWith(prefix))) {
    const nom = fitxer.nom.slice(prefix.length);
    assert.ok(nom && !nom.includes('/'), 'La fixture municipal no crea subcarpetes.');
    fs.writeFileSync(path.join(font, nom === 'datapackage.json' ? 'manifest.json' : nom), fitxer.dades);
  }
  const cli = (dist, origen, settings) => {
    fs.writeFileSync(config, JSON.stringify(settings));
    return spawnSync(process.execPath, [path.join(ROOT, 'nix/prepare-public.mjs'), '--root', ROOT, '--dist', dist,
      '--config', config, '--open-data-source', origen], { encoding: 'utf8' });
  };
  // El paquet ve de l'opció, no del dist: sense dist/opendata, només la font aportada.
  const f = await fixture(t);
  fs.rmSync(path.join(f.dist, 'opendata'), { recursive: true });
  const ok = cli(f.dist, font, OPTIONS);
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(JSON.parse(ok.stdout).openDataVersion, '1.2.0');
  for (const name of fs.readdirSync(font)) {
    assert.deepEqual(fs.readFileSync(path.join(f.dist, 'opendata', name)), fs.readFileSync(path.join(font, name)), name);
  }
  // Un camí que el sandbox no veu falla tancat, abans de cap aliàs.
  const absent = await fixture(t);
  const sense = cli(absent.dist, path.join(font, 'no-existix'), OPTIONS);
  assert.equal(sense.status, 1);
  assert.match(sense.stderr, /ENOENT/);
  assert.equal(fs.existsSync(path.join(absent.dist, 'ap/actor.json')), false);
  const sella = { ...OPTIONS, municipality: { slug: 'sella', name: 'Sella' } };
  const alie = await fixture(t, sella);
  const prestat = cli(alie.dist, font, sella);
  assert.equal(prestat.status, 1);
  assert.match(prestat.stderr, /no correspon al municipi/);
  assert.equal(fs.existsSync(path.join(alie.dist, 'ap/actor.json')), false);
});

test('Pilar1: text estructural dels .nix (equilibri, interruptors, MIME i guardes); no avalua Nix ni nginx', () => {
  const module = read('nix/module.nix');
  const flake = read('nix/flake.nix');
  const arrel = read('flake.nix');
  // Equilibri de {[( fora de cadenes i comentaris, amb controls negatius perquè no siga buit.
  parellsNix(flake);
  for (const name of ['nix/node0.nix', 'nix/containers.nix']) parellsNix(read(name));
  const parells = parellsNix(module);
  assert.throws(() => parellsNix(module.slice(0, module.lastIndexOf('}'))), /sense tancar/);
  assert.throws(() => parellsNix(flake.replace('outputs = { self, nixpkgs }:', 'outputs = { self, nixpkgs :')), /sense tancar|desaparellat/);
  assert.throws(() => parellsNix(module.replace('mkForce disabled)', 'mkForce disabled]')), /desaparellat/);
  // Els interruptors condicionen de veritat les rutes; un interruptor anul·lat no passa.
  comprovaInterruptors(module, arrel);
  assert.throws(() => comprovaInterruptors(module.replace('(if cfg.enableActivityPub then {', '(if true then {'), arrel));
  assert.throws(() => comprovaInterruptors(module.replace('"= /ap/actor.json" = {', '"= /ap/actor.json" = {};\n        "= /ap/nou.json" = {'), arrel));
  assert.throws(() => comprovaInterruptors(module, `${arrel}\n                "^~ /ap/outbox/" = {`));
  // MIME: el del manifest 1.2.0, i charset=utf-8 per a text/* i per a la location exacta.
  const manifest = JSON.parse(read('public/opendata/manifest.json'));
  const general = brancaActiva(module, parells, module.indexOf('"^~ /opendata/" = mkForce (if')).cos;
  const perExtensio = new Map(general.match(/types \{([^}]*)\}/)[1].split(';').map(s => s.trim().split(/\s+/))
    .filter(p => p.length > 1).flatMap(([mime, ...exts]) => exts.map(ext => [ext, mime])));
  const ambCharset = /^\s*charset utf-8;$/m.test(general) ? general.match(/^\s*charset_types ([^;]+);$/m)?.[1].split(/\s+/) ?? [] : [];
  for (const { path: recurs, mediatype, encoding } of manifest.resources) {
    const exacta = module.indexOf(`"= /opendata/${recurs}" = mkForce (if`);
    const mime = perExtensio.get(recurs.split('.').pop());
    const servit = exacta >= 0 ? brancaActiva(module, parells, exacta).cos.match(/default_type "([^"]+)"/)[1]
      : `${mime}${ambCharset.includes(mime) ? '; charset=utf-8' : ''}`;
    assert.equal(servit.split(';')[0], mediatype, recurs);
    if (exacta >= 0 || mediatype.startsWith('text/')) assert.match(servit, /; charset=utf-8$/, recurs);
    if (servit.includes('charset=')) assert.equal(encoding, 'utf-8', recurs);
  }
  // host-meta anuncia la plantilla LRDD per camí, que en nginx és internal: no s'anuncia sense ruta pública.
  assert.ok(!/"= \/\.well-known\/host-meta"/.test(module) || /"\^~ \/\.well-known\/webfinger\/acct/.test(module), 'host-meta sense ruta LRDD pública');
  // openDataSource entra al magatzem amb context (path o derivació), mai com a text pla.
  assert.doesNotMatch(flake, /toString settings\.openDataSource/);
  assert.match(flake, /builtins\.isPath src then builtins\.path \{ path = src; name = "socdepoble-opendata"; \}/);
  assert.match(flake, /assert lib\.assertMsg \(builtins\.hasContext \(toString src\)\)/);
  assert.match(flake, /--open-data-source \$\{lib\.escapeShellArg openDataSrc\}/);
  assert.match(flake, /web-open-data-source = mkMunicipalWeb pkgs \(example \/\/ \{ openDataSource = \.\.\/public\/opendata; \}\)/);
  // Guardes en avaluar de publicKey/supabaseUrl: abans de base.overrideAttrs i sense el valor al missatge.
  const guardes = [...flake.matchAll(GUARDA_NIX)];
  assert.deepEqual(guardes.map(g => g[2]), ['publicKey', 'supabaseUrl']);
  for (const g of guardes) {
    assert.ok(g.index < flake.indexOf('base.overrideAttrs'), g[2]);
    assert.ok(!g[4].includes('${'), `${g[2]}: el missatge no repetix el valor`);
  }
  // Cada ERE, un cop desfets els escapaments de Nix, ha de caure en el subconjunt comú: només així la
  // prova en JS diu el que farà builtins.match. Controls: escapaments que std::regex no compila, sintaxi
  // que JS llig d'una altra manera, i els dos errors d'escapament (ERE i cadena Nix) sobre la guarda real.
  for (const fora of ['\\[::1\\]', 'a\\}', 'a\\d', '[]a]', '[[:alpha:]]', '[a\\]', '[z-a]', '[a-c-e]', 'a.b', '^a', 'a**',
    'a{2,1}', 'a{', '(|a)', '()', '(a', 'a|', 'à']) assert.throws(() => ereComuna(fora), /fora del subconjunt/, fora);
  assert.throws(() => ereComuna(desNix(guardes[1][1].replace('\\\\[::1]', '\\\\[::1\\\\]'))), /escapament «\\\]»/);
  assert.throws(() => ereComuna(desNix(guardes[1][1].replace('127\\\\.0', '127\\.0'))), /«\.» sense escapar/);
  // Els patrons es proven en JS ancorats; una mostra del que admeten també l'admet validatePublicCredentials
  // (no és una inclusió: un port >65535 només el rebutja vite, dins del build).
  const [clau, url] = guardes.map(g => ({ re: new RegExp(`^(?:${ereComuna(desNix(g[1]))})$`), perDefecte: g[3] }));
  for (const bona of [clau.perDefecte, 'sb_publishable_AbC-12_x']) {
    assert.ok(clau.re.test(bona), bona);
    validatePublicCredentials(url.perDefecte, bona);
  }
  const jwt = role => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role })).toString('base64url'), 'c2lnbmF0dXJh'].join('.');
  for (const dolenta of ['sb_secret_AbC123', jwt('service_role'), jwt('anon'), '', 'sb_publishable_', 'sb_publishable_x\n', ' sb_publishable_x']) {
    assert.ok(!clau.re.test(dolenta), JSON.stringify(dolenta));
  }
  for (const bona of [url.perDefecte, 'https://abc.supabase.co', 'https://abc.supabase.co/', 'https://db.example.org:8443',
    'http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321']) {
    assert.ok(url.re.test(bona), bona);
    validatePublicCredentials(bona, clau.perDefecte);
  }
  for (const dolenta of ['https://user:secret@abc.supabase.co', 'https://abc.supabase.co/rest/v1', 'https://abc.supabase.co?apikey=x',
    'https://abc.supabase.co#x', 'http://abc.supabase.co', 'ftp://abc.supabase.co', '']) {
    assert.ok(!url.re.test(dolenta), dolenta);
  }
  // Documentació dels límits que el codi no pot tancar dins de nix/.
  const readme = read('nix/README.md');
  assert.match(readme, /no l'importeu també a part/);
  assert.match(arrel, /\.\/scripts\/botigues\/associacio-apps\.json/);
  assert.doesNotMatch(flake, /cp .*associacio-apps\.json/);
  assert.equal(arrel.match(/inputs\.nixpkgs\.url = "([^"]+)"/)[1], flake.match(/inputs\.nixpkgs\.url = "([^"]+)"/)[1]);
  assert.match(readme, /Fonts alineades/);
  assert.match(readme, /No avalua Nix ni nginx/);
  for (const name of ['enable', 'domain', 'municipality', 'enableActivityPub', 'enableOpenData']) assert.match(module, new RegExp(`\\b${name}\\s*=`));
  for (const route of ['/ap/actor.json', '/.well-known/webfinger', '/.well-known/nodeinfo', '/nodeinfo/2.1.json', '/opendata/']) assert.ok(module.includes(route), route);
  assert.match(module, /builtins\.readFile \.\.\/firebase\.json/);
  assert.match(module, /types\.coercedTo \(types\.strMatching "\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*"\)/);
  assert.match(module, /name = if slug == "la-torre-de-les-macanes" then "La Torre de les Maçanes" else slug/);
  assert.match(flake, /assert shorthand\.config\.services\.socdepoble\.municipality == example\.municipality/);
  assert.match(flake, /assert newShorthand\.config\.services\.socdepoble\.municipality == \{ slug = "sella"; name = "sella"; \}/);
  assert.match(module, /mkBefore methodGuard/);
  assert.match(module, /lib\.genAttrs \(apPaths[\s\S]*mkForce disabled/);
  assert.match(module, /if cfg\.enableOpenData then/);
  assert.match(module, /tryFiles = "\$uri =404"/);
  assert.match(module, /Allow "GET, HEAD, OPTIONS" always/);
  assert.match(module, /return 405/);
  assert.ok(!module.includes('proxyPass'));
  assert.match(flake, /release\.lib\.mkWeb/);
  assert.match(flake, /7dcdd87373d72e7a2173e4db02e20d3d7f495cfd/);
  assert.ok(!flake.includes('fakeHash'));
  assert.match(arrel, /importNpmLock/);
  // Prova textual: la semàntica de Nix i nginx és de checks.module-evaluation/module-http, no executats sense Nix.
});

test('Pilar1: sintaxi Nix real i ERE de les guardes si l’eina està disponible; mai s’imita amb regex', t => {
  const nix = spawnSync('nix-instantiate', ['--version'], { encoding: 'utf8' });
  if (nix.error?.code === 'ENOENT') {
    if (process.env.SDP_REQUIRE_NIX === '1') assert.fail('Falta Nix real en un entorn que l’exigix.');
    t.skip('Nix no instal·lat: parse/eval/build/flake.lock no acreditats; cap CI del repositori instal·la Nix (SDP_REQUIRE_NIX=1 ho fa fallar).');
    return;
  }
  assert.equal(nix.status, 0, nix.stderr);
  for (const name of ['flake.nix', 'module.nix', 'node0.nix', 'containers.nix']) {
    const parsed = spawnSync('nix-instantiate', ['--parse', path.join(ROOT, 'nix', name)], { encoding: 'utf8', timeout: 15000 });
    assert.equal(parsed.status, 0, parsed.stderr);
  }
  // El parse no veu un ERE que std::regex no compila: builtins.match l'avalua i ha de casar com en JS.
  const mostres = { publicKey: ['sb_publishable_AbC-12_x', 'sb_secret_AbC123'],
    supabaseUrl: ['http://[::1]:54321', 'https://u:p@abc.supabase.co', 'https://abc.supabase.co/rest/v1'] };
  const casos = [...read('nix/flake.nix').matchAll(GUARDA_NIX)]
    .flatMap(g => [g[3], ...mostres[g[2]]].map(v => ({ nix: g[1], re: new RegExp(`^(?:${ereComuna(desNix(g[1]))})$`), v })));
  assert.equal(casos.length, 7);
  const expr = `map (c: builtins.match c.re c.v != null) [ ${casos.map(c => `{ re = "${c.nix}"; v = "${c.v}"; }`).join(' ')} ]`;
  const avaluat = spawnSync('nix-instantiate', ['--eval', '--strict', '--json', '--expr', expr], { encoding: 'utf8', timeout: 15000 });
  assert.equal(avaluat.status, 0, avaluat.stderr);
  assert.deepEqual(JSON.parse(avaluat.stdout), casos.map(c => c.re.test(c.v)));
});
