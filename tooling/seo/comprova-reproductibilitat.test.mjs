/**
 * P1-23 · Proves del comprovador de reproductibilitat
 * (tooling/seo/comprova-reproductibilitat.mjs) i de la coherència de flake.nix
 * amb el que sí que s'executa ací, sense Nix:
 *   · la font i la recepta del flake són les que el comprovador construïx, i
 *     la recepta no es despenja de package.json (build, build:social);
 *   · la línia de federació del flake, executada de veres, deixa els fitxers
 *     que la prova del mòdul NixOS (testScript) espera trobar;
 *   · les regles d'nginx del mòdul diuen el mateix que activitypub.js i que el
 *     connector de desenvolupament (slugs, sostre del resource, tipus);
 *   · cap «return» amb una captura que admeta CR o LF (gixy, que NixOS passa
 *     en construir la configuració, ho tracta com a HTTP splitting i atura el
 *     build);
 *   · les capçaleres ixen de firebase.json; el paquet declara AGPL-3.0-or-later;
 *   · el comprovador mateix: marques, ordres planes, entorn net (la zona i el
 *     locale de cada variació), l'època per defecte, la font amb i sense
 *     --nomes-versionats (el que veu Nix), directori de treball fora del
 *     repositori, node_modules d'enllaços per paquet, inventari amb fitxers amb
 *     punt, la CLI (main() i el procés de veres) i, de cap a cap en un
 *     repositori git temporal, que dos builds iguals passen i que un que filtra
 *     la ruta, el rellotge, la zona horària o el locale no passa.
 * SDP_PROJECT_ROOT apunta a un altre arbre si cal (els mutants). Cap xarxa.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ORIGEN_PER_DEFECTE, VARIACIONS, comparaInventaris, comprova, digestDelLlistat, enllacaNodeModules, entornDeBuild,
  entreMarques, epocaPerDefecte, exempleDelFlake, fitxersDeLaFont, fontDelFlake, inventari, main, primeraDiferencia,
  receptaDelFlake, receptaPerNom, validaTreball
} from './comprova-reproductibilitat.mjs';

const ARREL = process.env.SDP_PROJECT_ROOT || path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const llig = (rel) => fs.readFileSync(path.join(ARREL, rel), 'utf8');
const FLAKE = llig('flake.nix');
const PAQUET = JSON.parse(llig('package.json'));
const FIREBASE = JSON.parse(llig('firebase.json'));
const importa = (rel) => import(pathToFileURL(path.join(ARREL, rel)).href);
const ap = await importa('src/data/activitypub.js');
const { TIPUS, gestorFederacio } = await importa('tooling/vite/federacio-iaia.mjs');
const { preparaFederacio } = await importa('tooling/seo/genera-federacio.mjs');
const { MOCK_TOWNS } = await importa('src/sections/pobles/townsSeed.js');

function temporal(t, prefix = 'sdp-reproduible-prova-') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/* Un literal de cadena de Nix entre cometes dobles, tal com el veu nginx (\\ → \, \" → "). */
const desNix = (text) => text.replace(/\\(["\\])/g, '$1');

/* Les ordres d'un script de package.json separades per «&&», com a vectors d'arguments. */
const ordresDelScript = (nom) => PAQUET.scripts[nom].split('&&').map((tros) => tros.trim().split(/\s+/));

/* La línia de federació del flake, executada de veres sobre un directori temporal (el dist del paquet). */
function generaComElFlake(t) {
  const desti = temporal(t);
  const ordre = receptaDelFlake(FLAKE).find((o) => o[1] === 'tooling/seo/genera-federacio.mjs');
  const argv = ordre.slice(1).map((a) => (a === 'dist' ? desti : a === '{origen}' ? 'https://socdepoble.org' : a));
  const r = spawnSync(process.execPath, [path.join(ARREL, argv[0]), ...argv.slice(1)], { cwd: ARREL, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return { desti, argv };
}

/* Un intèrpret mínim d'una location del mòdul NixOS amb les directives que hi ha (if amb =, ~, ~*, !~,
   !~*, !-f o una variable; set, amb $1 de l'últim if que ha casat; return; include; rewrite … last;
   try_files $uri =404), sobre la petició CRUA, com nginx (que no descodifica $arg_resource). L'include
   és el de les regles generades al dist; el rewrite de WebFinger va a la location interna, que fa
   try_files. Torna el codi HTTP. */
function nginxLocation(nom, { uri, metode = 'GET', consulta = '' }, desti) {
  const escapat = nom.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const bloc = new RegExp(`"${escapat}" = \\{\\s*extraConfig = ''([\\s\\S]*?)\\n\\s*'';`).exec(FLAKE)?.[1];
  assert.ok(bloc, `la location «${nom}» del flake`);
  const vars = { request_method: metode, args: consulta, uri, document_root: desti, arg_resource: /(?:^|&)resource=([^&]*)/i.exec(consulta)?.[1] ?? '' };
  let captures = [];
  const interpola = (text) => text.replace(/\$(\w+)/g, (_, v) => (/^\d+$/.test(v) ? captures[Number(v)] ?? '' : vars[v] ?? ''));
  const cert = (condicio) => {
    const fitxer = /^(!?)-f (\S+)$/.exec(condicio.trim());
    if (fitxer) return fs.existsSync(interpola(fitxer[2])) !== (fitxer[1] === '!');
    const m = /^\$(\w+)(?:\s+(=|~\*|~|!~\*|!~)\s+(?:"((?:[^"\\]|\\.)*)"|([^\s"]+)))?$/.exec(condicio.trim());
    assert.ok(m, `condició que l'intèrpret no coneix: ${condicio}`);
    const valor = vars[m[1]] ?? '';
    if (!m[2]) return valor !== '' && valor !== '0';
    const operand = m[3] !== undefined ? desNix(m[3]) : m[4];
    if (m[2] === '=') return valor === operand;
    const casa = new RegExp(operand, m[2].endsWith('*') ? 'i' : '').exec(valor);
    if (casa && !m[2].startsWith('!')) captures = [...casa];
    return m[2].startsWith('!') ? !casa : Boolean(casa);
  };
  const executa = (text) => {
    for (const [, condicio, cos, ordre, arg] of text.matchAll(/^\s*(?:if \((.+?)\) \{\n([\s\S]*?)\n\s*\}|(set|return|include|rewrite|try_files) ([^;\n]*);)/gm)) {
      const resultat = condicio !== undefined ? (cert(condicio) ? executa(cos) : null) : (() => {
        if (ordre === 'return') return Number(arg);
        if (ordre === 'set') { const [variable, valor] = arg.split(/\s+/); vars[variable.slice(1)] = valor === '""' ? '' : interpola(valor); return null; }
        if (ordre === 'include') return executa(fs.readFileSync(arg.replace(/^\$\{paquet\}/, desti), 'utf8'));
        if (ordre === 'try_files') {
          assert.equal(arg, '$uri =404', `try_files que l'intèrpret no coneix: ${arg}`);
          return fs.existsSync(path.join(desti, uri)) && fs.statSync(path.join(desti, uri)).isFile() ? 200 : 404;
        }
        const intern = /^\^ (\/\.well-known\/webfinger\/[a-z0-9-]+\.json)\? last$/.exec(arg)?.[1];
        assert.ok(intern, `rewrite que l'intèrpret no coneix: ${arg}`);
        return fs.existsSync(path.join(desti, intern)) ? 200 : 404;
      })();
      if (resultat !== null) return resultat;
    }
    return null;
  };
  return executa(bloc);
}

const nginxWebFinger = (consulta, desti, metode = 'GET') => nginxLocation('= /.well-known/webfinger', { uri: '/.well-known/webfinger', metode, consulta }, desti);

/* El connector de desenvolupament de veres (gestorFederacio), servit com https://socdepoble.org. */
async function devWebFinger(consulta) {
  const gestor = gestorFederacio({ prepara: (origen) => preparaFederacio({ arrel: ARREL, origen }), https: true });
  const res = { statusCode: 0, setHeader() {}, end() {} };
  let passa = false;
  await gestor({ url: `/.well-known/webfinger?${consulta}`, method: 'GET', headers: { host: 'socdepoble.org' } }, res, () => { passa = true; });
  return passa ? 0 : res.statusCode;
}

test('font i recepta: el flake i el comprovador diuen el mateix, i la recepta no es despenja de package.json', () => {
  const camins = fontDelFlake(FLAKE);
  for (const cami of camins) assert.ok(fs.existsSync(path.join(ARREL, cami)), `font del flake absent: ${cami}`);
  for (const imprescindible of ['package.json', 'package-lock.json', 'index.html', 'vite.config.js', '.agents/AGENTS.md', 'AGENTS.md', 'src', 'public', 'tooling']) {
    assert.ok(camins.includes(imprescindible), imprescindible);
  }
  const ordres = receptaDelFlake(FLAKE);
  for (const ordre of ordres) {
    if (ordre[0] === 'npm') {
      assert.equal(ordre[1], 'run', ordre.join(' '));
      assert.equal(typeof PAQUET.scripts[ordre[2]], 'string', `script absent: ${ordre[2]}`);
    } else {
      assert.equal(ordre[0], 'node', ordre.join(' '));
      assert.ok(fs.existsSync(path.join(ARREL, ordre[1])), `fitxer absent: ${ordre[1]}`);
    }
  }
  // «npm run build» de Firebase sense build:wp ni build:seo (són del connector WordPress), amb el prebuild davant.
  const npm = ordres.filter((o) => o[0] === 'npm').map((o) => o[2]);
  const deBuild = ordresDelScript('build').map((o) => o[2]).filter((nom) => !['build:wp', 'build:seo', 'build:social'].includes(nom));
  assert.deepEqual(npm, ['prebuild', ...deBuild]);
  // build:social amb l'origen de la instància en lloc de https://socdepoble.org.
  const social = ordresDelScript('build:social').map((o) => o.map((a) => (a === ORIGEN_PER_DEFECTE ? '{origen}' : a)));
  const nodeDeLaRecepta = ordres.filter((o) => o[0] === 'node');
  assert.deepEqual(nodeDeLaRecepta.slice(0, social.length), social);
  // L'última: el que només un servidor sap servir (WebFinger per paràmetre i NodeInfo).
  assert.deepEqual(ordres.at(-1), ['node', 'tooling/seo/genera-federacio.mjs', '--desti', 'dist', '--origen', '{origen}', '--servidor']);
  assert.deepEqual(receptaPerNom('vite', FLAKE), [['npm', 'run', 'build:web']]);
  assert.equal(PAQUET.scripts['build:web'], 'vite build');
  assert.throws(() => receptaPerNom('docker', FLAKE), /Recepta desconeguda/);
});

test('la línia de federació del flake, executada: els fitxers que la prova del mòdul NixOS espera', (t) => {
  const desti = temporal(t);
  const ordre = receptaDelFlake(FLAKE).find((o) => o[1] === 'tooling/seo/genera-federacio.mjs');
  const argv = ordre.slice(1).map((a) => (a === 'dist' ? desti : a === '{origen}' ? 'https://socdepoble.org' : a));
  const r = spawnSync(process.execPath, [path.join(ARREL, argv[0]), ...argv.slice(1)], { cwd: ARREL, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const existix = (rel) => fs.existsSync(path.join(desti, rel));
  for (const rel of ['.well-known/nodeinfo', 'nodeinfo/2.1.json', 'ap/actors/socdepoble.json', 'ap/outbox/socdepoble.json']) assert.ok(existix(rel), rel);
  for (const poble of MOCK_TOWNS) assert.ok(existix(`.well-known/webfinger/${poble.id}.json`) && existix(`ap/actors/${poble.id}.json`), poble.id);
  // Cada «assert codi(…)» del testScript del flake, contra els fitxers reals.
  const assercions = [...FLAKE.matchAll(/assert codi\("([^"]+)"(?:, "([^"]*)")?\) == "(\d{3})"/g)].map(([, ruta, extra, codi]) => ({ ruta, extra, codi }));
  assert.ok(assercions.length >= 15, `${assercions.length} assercions`);
  let comprovades = 0;
  for (const { ruta, extra, codi } of assercions) {
    const wf = /^\/\.well-known\/webfinger\?(.*)$/.exec(ruta);
    const actor = /^\/ap\/(actors|outbox)\/([a-z0-9-]+)\.json$/.exec(ruta);
    const inbox = /^\/ap\/inbox\/([a-z0-9-]+)$/.exec(ruta);
    if (wf && !extra) {
      // La location de WebFinger del flake, interpretada sobre els fitxers i les regles generades de veres.
      assert.equal(codi, String(nginxWebFinger(wf[1], desti)), ruta);
      // El slug ix de l'acct: o de l'URL de l'actor (G8, 261030), tal qual o codificada.
      const acct = /^resource=acct(?::|%3A)([a-z0-9-]+)(?:@|%40)/i.exec(wf[1])
        ?? /^resource=https(?::|%3A)(?:\/|%2F){2}socdepoble\.org(?:\/|%2F)ap(?:\/|%2F)actors(?:\/|%2F)([a-z0-9-]+)\.json$/i.exec(wf[1]);
      if (codi === '200') assert.equal(JSON.parse(fs.readFileSync(path.join(desti, `.well-known/webfinger/${acct[1].toLowerCase()}.json`), 'utf8')).subject, `acct:${acct[1].toLowerCase()}@socdepoble.org`);
      comprovades += 1;
    } else if (actor && !extra) {
      assert.equal(codi, existix(ruta.slice(1)) ? '200' : '404', ruta);
      comprovades += 1;
    } else if (inbox) {
      // La location de la inbox del flake, interpretada: es llig (la col·lecció buida del build), OPTIONS 204,
      // la resta 405; un poble que no existix, 404 (el mateix contracte que federacio-iaia.test.mjs prova en dev).
      const metode = /-X (\w+)/.exec(extra ?? '')?.[1] ?? 'GET';
      assert.equal(codi, String(nginxLocation('^~ /ap/inbox/', { uri: ruta, metode }, desti)), `nginx: ${metode} ${ruta}`);
      const esperat = !existix(`ap/actors/${inbox[1]}.json`) ? '404' : metode === 'OPTIONS' ? '204' : ['GET', 'HEAD'].includes(metode) ? '200' : '405';
      assert.equal(codi, esperat, `${metode} ${ruta}`);
      if (codi === '200') assert.equal(JSON.parse(fs.readFileSync(path.join(desti, ruta.slice(1)), 'utf8')).type, 'OrderedCollection');
      comprovades += 1;
    }
  }
  assert.ok(comprovades >= 19, `${comprovades} comprovades`);
  // Cridada per un enllaç simbòlic, la CLI escriu el mateix (no ix amb 0 sense fer res).
  const altre = temporal(t);
  const enllac = path.join(temporal(t), 'genera-federacio.mjs');
  fs.symlinkSync(path.join(ARREL, argv[0]), enllac);
  const perEnllac = spawnSync(process.execPath, [enllac, ...argv.slice(1).map((a) => (a === desti ? altre : a))], { cwd: ARREL, encoding: 'utf8' });
  assert.equal(perEnllac.status, 0, perEnllac.stderr);
  const llista = (dir) => fs.readdirSync(dir, { recursive: true }).sort();
  assert.deepEqual(llista(altre), llista(desti));
});

test('nginx del mòdul: els mateixos slugs, el mateix sostre del resource i els mateixos tipus que activitypub.js i el connector', () => {
  const slugInbox = /"\^\/ap\/inbox\/\((\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*)\)\$"/.exec(FLAKE);
  assert.ok(slugInbox, 'la regex de la inbox');
  const re = new RegExp(`^${slugInbox[1]}$`);
  for (const mostra of ['socdepoble', 'la-torre-de-les-macanes', 'a1', 'Sella', 'a--b', '-a', 'a-', 'a/b', 'a.json', 'à', '']) {
    assert.equal(re.test(mostra), ap.esSlugFederat(mostra) && mostra !== '', mostra);
  }
  const sostre = /\$arg_resource ~ "\^\.\{(\d+)\}"/.exec(FLAKE);
  assert.equal(Number(sostre?.[1]), ap.LIMITS.recurs + 1);
  // NodeInfo amb el mateix tipus que el connector de desenvolupament; el JRD, RFC 7033.
  assert.ok(FLAKE.includes(`default_type \${cometes "${TIPUS.nodeinfo.replace(/"/g, '\\"')}"}`), 'tipus de NodeInfo');
  assert.ok(FLAKE.includes(`default_type "${TIPUS.jrd}"`), 'tipus del JRD');
  assert.ok(FLAKE.includes(`default_type "${TIPUS.json}"`), 'tipus del descobriment de NodeInfo');
  // El 405 de la inbox porta Allow (RFC 9110 §15.5.6): el valor del connector de desenvolupament.
  const inbox = /"\^~ \/ap\/inbox\/" = \{\s*extraConfig = ''([\s\S]*?)\n\s*'';/.exec(FLAKE)?.[1] ?? '';
  assert.match(inbox, /\$\{capcaleres \([^)]*\bpermesos\b[^)]*\)\}/, 'la inbox afig les capçaleres «permesos»');
  assert.match(FLAKE, /permesos = \[\s*\{\s*key = "Allow";\s*value = "GET, HEAD, OPTIONS";/);
  assert.match(inbox, /return 405;/);
});

test('WebFinger: l’nginx del mòdul i el connector de desenvolupament responen el mateix codi (400, 404 o 200)', async (t) => {
  const { desti } = generaComElFlake(t);
  const poble = MOCK_TOWNS[0].id;
  // Consultes CRUES, com arriben a nginx (que no descodifica) i al connector (que sí, amb URLSearchParams).
  const consultes = [
    ['resource=acct:socdepoble@socdepoble.org', 200], ['resource=acct%3Asocdepoble%40socdepoble.org', 200],
    // Mastodon pregunta amb la caixa que escriu la persona (@Sella@…) i compara el subject sense caixa.
    ['resource=acct:Socdepoble@SocDePoble.org', 200], [`resource=ACCT%3A${poble.toUpperCase()}%40SOCDEPOBLE.ORG`, 200],
    [`resource=acct:${poble}@socdepoble.org&rel=self`, 200],
    // RFC 7033 §4.2: absent, buit, repetit, massa llarg o malformat → 400.
    ['rel=self', 400], ['resource=', 400], ['resource=acct:socdepoble@socdepoble.org&resource=acct:socdepoble@socdepoble.org', 400],
    [`resource=${'a'.repeat(600)}`, 400], [`resource=acct:${'a'.repeat(600)}@socdepoble.org`, 400],
    ['resource=acct:', 400], ['resource=notauri', 400], ['resource=acct:socdepoble', 400], ['resource=acct:@socdepoble.org', 400],
    ['resource=acct:socdepoble@', 400], ['resource=acct:a@b@socdepoble.org', 400], ['resource=acct:socde+poble@socdepoble.org', 400],
    ['resource=acct:socdepoble%40x@socdepoble.org', 400], ['resource=acct:socde"poble@socdepoble.org', 400], ['resource=1x:y', 400],
    // Ben formats, però no d'este servidor → 404.
    ['resource=acct:socdepoble@altre.example', 404], ['resource=acct:no-existix@socdepoble.org', 404],
    ['resource=acct:socdepoble@socdepoble.org.evil.example', 404], ['resource=mailto:socdepoble@socdepoble.org', 404],
    ['resource=acct:socdepoble%2540x@socdepoble.org', 404]
  ];
  /* Gauntlet 261030 (G8 de Gemini). L'URL de l'actor i la del perfil, com construeixWebFinger: exactes, amb
     caixa i amb l'esquema de l'origen; «:» i «/» tal qual o codificats. I el «+» d'un esquema (git+ssh:), que
     en el valor CRU arriba com a %2B: un «+» cru és un espai (URLSearchParams) i continua sent 400. */
  const actor = `https://socdepoble.org/ap/actors/${poble}.json`;
  const codifica = (url) => encodeURIComponent(url);
  consultes.push(
    ['resource=https://socdepoble.org/ap/actors/socdepoble.json', 200], [`resource=${codifica('https://socdepoble.org/ap/actors/socdepoble.json')}`, 200],
    ['resource=https%3a%2f%2fsocdepoble.org%2fap%2factors%2fsocdepoble.json', 200], [`resource=${actor}`, 200],
    ['resource=https://socdepoble.org/projecte', 200], [`resource=${codifica(`https://socdepoble.org/pobles/${poble}`)}`, 200],
    ['resource=http://socdepoble.org/ap/actors/socdepoble.json', 404], ['resource=HTTPS://socdepoble.org/ap/actors/socdepoble.json', 404],
    ['resource=https://SocDePoble.org/ap/actors/socdepoble.json', 404], ['resource=https://socdepoble.org/ap/actors/Socdepoble.json', 404],
    ['resource=https://socdepoble.org/ap/actors/socdepoble.json/', 404], ['resource=https://socdepoble.org/ap/actors/socdepoble.jsonx', 404],
    ['resource=https://socdepoble.org/ap/actors/socdepoble.json%3Fx', 404], ['resource=https://socdepoble.org/ap/outbox/socdepoble.json', 404],
    ['resource=https://socdepoble.org/pobles/no-existix', 404], ['resource=https://socdepoble.org/pobles/socdepoble', 404],
    ['resource=https://altre.example/ap/actors/socdepoble.json', 404], ['resource=https://socdepoble.org.evil.example/ap/actors/socdepoble.json', 404],
    ['resource=https://socdepoblexorg/ap/actors/socdepoble.json', 404], ['resource=https://socdepoble.org/ap/actors/socdepoblexjson', 404],
    ['resource=git%2Bssh:socdepoble@socdepoble.org', 404], ['resource=git%2bssh://socdepoble.org/x', 404],
    ['resource=git+ssh:socdepoble@socdepoble.org', 400], ['resource=%2Bgit:x', 400]
  );
  for (const [consulta, codi] of consultes) {
    assert.equal(nginxWebFinger(consulta, desti), codi, `nginx: ${consulta.slice(0, 80)}`);
    assert.equal(await devWebFinger(consulta), codi, `dev: ${consulta.slice(0, 80)}`);
  }
  // Diferència coneguda i documentada al flake: un %XX d'una altra lletra (ací el punt) només el resol el connector.
  const ambPuntCodificat = 'resource=https://socdepoble.org/ap/actors/socdepoble%2Ejson';
  assert.deepEqual([nginxWebFinger(ambPuntCodificat, desti), await devWebFinger(ambPuntCodificat)], [404, 200]);
  // OPTIONS: 204 abans de mirar res.
  assert.equal(nginxWebFinger('', desti, 'OPTIONS'), 204);
});

test('gixy: cap «return» del mòdul porta una captura que puga contindre CR o LF', () => {
  const locations = [...FLAKE.matchAll(/^\s*"(~\*?) ((?:[^"\\]|\\.)+)" = \{([\s\S]*?)\n\s*\};/gm)];
  const ambCaptura = locations.filter(([, , , cos]) => /return = "[^"]*\$\d/.test(cos));
  assert.ok(ambCaptura.length >= 1, 'la redirecció de la barra final');
  for (const [, modificador, regex] of ambCaptura) {
    // «s»: en PCRE (nginx) el punt casa amb CR; en JavaScript, sense «s», no. Així la prova no és més laxa que nginx.
    const re = new RegExp(desNix(regex), `${modificador === '~*' ? 'i' : ''}s`);
    for (const atac of ['/x\r/', '/x\n/', '/x\rSet-Cookie: a=b/', '/\r\n/']) assert.equal(re.test(atac), false, JSON.stringify(atac));
  }
  // I continua fent la seua feina: /projecte/ → /projecte.
  const barra = ambCaptura.map(([, , regex]) => new RegExp(desNix(regex))).find((re) => re.test('/projecte/'));
  assert.equal(barra?.exec('/projecte/')[1], '/projecte');
  assert.ok(FLAKE.includes('assert codi("/projecte/") == "301"'));
});

test('capçaleres: el mòdul les pren de firebase.json i les regles que cita hi són', () => {
  const regles = FIREBASE.hosting.headers;
  const citades = [...FLAKE.matchAll(/capcaleresDe "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(citades.length >= 3);
  for (const font of citades) assert.ok(regles.some((r) => r.source === font), font);
  assert.ok(regles.some((r) => typeof r.regex === 'string'), 'la regla regex dels actius');
  // El valor de reserva de /ap/** és el de firebase.json (si algun dia se separen, la prova cau).
  const reserva = /if r == null then\s*\[([\s\S]*?)\]\s*else/.exec(FLAKE)?.[1] ?? '';
  const parells = [...reserva.matchAll(/key = "([^"]+)";\s*value = "([^"]+)";/g)].map(([, key, value]) => ({ key, value }));
  assert.deepEqual(parells, regles.find((r) => r.source === '/ap/**').headers);
  // nginx: cap «$» (seria una variable) ni salt de línia a cap valor que el mòdul copia.
  for (const regla of regles) for (const { key, value } of regla.headers) assert.ok(!/[$\n\r]/.test(value), key);
});

test('exemple del flake sense cap credencial real i llicència AGPL-3.0-or-later declarada', () => {
  const exemple = exempleDelFlake(FLAKE);
  assert.match(new URL(exemple.supabaseUrl).hostname, /(^|\.)example\.(org|com|net)$/);
  assert.match(exemple.clauPublica, /^sb_publishable_exemple/);
  assert.equal(exemple.modeDades, 'seed');
  assert.equal(PAQUET.license, 'AGPL-3.0-or-later');
  assert.ok(FLAKE.includes('license = lib.licenses.agpl3Plus;'));
  const llicencia = llig('LICENSE');
  for (const frase of ['GNU Affero General Public License', 'either version 3', 'any later version']) assert.ok(llicencia.includes(frase), frase);
});

test('marques, font i recepta: el comprovador només accepta camins nets i ordres planes', () => {
  const [ini, fi] = ['# a', '# b'];
  assert.deepEqual(entreMarques(`x\n  ${ini}\nu\nv\n ${fi}\n`, [ini, fi]), ['u', 'v']);
  for (const dolent of [`${ini}\nu`, `${fi}\nu\n${ini}`, `${ini}\n${ini}\n${fi}`]) assert.throws(() => entreMarques(dolent, [ini, fi]), /marques/);
  const font = (linies) => `# sdp:font-inici\n${linies.join('\n')}\n# sdp:font-fi\n`;
  assert.deepEqual(fontDelFlake(font(['  ./src', '', '  # comentari', '  ./.agents/AGENTS.md'])), ['src', '.agents/AGENTS.md']);
  for (const dolenta of ['../x', './../x', '/etc/passwd', './a/../b', './a//b', './a b', '"./a"']) {
    assert.throws(() => fontDelFlake(font([dolenta])), /font/, dolenta);
  }
  assert.throws(() => fontDelFlake(font(['# només un comentari'])), /buida/);
  const recepta = (linies) => `# sdp:recepta-inici\n${linies.join('\n')}\n# sdp:recepta-fi\n`;
  assert.deepEqual(receptaDelFlake(recepta(['npm run build:web', 'node x.mjs --origin "$SDP_ORIGEN"'])), [
    ['npm', 'run', 'build:web'], ['node', 'x.mjs', '--origin', '{origen}']
  ]);
  for (const dolenta of ['npm run a && rm -rf /', 'echo $HOME', 'a;b', 'cat x > y', 'node `x`', 'node "$ALTRA"', 'a | b']) {
    assert.throws(() => receptaDelFlake(recepta([dolenta])), /ordres planes/, dolenta);
  }
  assert.throws(() => exempleDelFlake('{ }'), /exemple/);
});

test('entorn de build: el del flake, net, i sense res heretat que canvie el resultat', () => {
  const base = {
    PATH: '/bin', HOME: '/Users/algu', VITE_SUPABASE_URL: 'https://real.supabase.co', VITE_CANONICAL_URL: 'https://altre.example',
    VITE_TENANT_ID: 'x', CI: '1', NODE_ENV: 'production', SOURCE_DATE_EPOCH: '1', TZ: 'Asia/Tokyo', npm_config_registry: 'https://x',
    LANG: 'ja_JP.UTF-8', LC_ALL: 'ja_JP.UTF-8', LC_CTYPE: 'ja_JP.UTF-8', LC_NUMERIC: 'ja_JP.UTF-8', LANGUAGE: 'ja'
  };
  const exemple = exempleDelFlake(FLAKE);
  const env = entornDeBuild({ base, epoca: 42, exemple, variacio: VARIACIONS[1], home: '/tmp/casa' });
  assert.equal(env.PATH, '/bin');
  assert.equal(env.HOME, '/tmp/casa');
  assert.equal(env.SOURCE_DATE_EPOCH, '42');
  assert.equal(env.VITE_SUPABASE_URL, exemple.supabaseUrl);
  assert.equal(env.TZ, 'Europe/Madrid');
  // El locale també el posa la variació, no el Mac: LANG i LC_ALL (que mana sobre LANG i sobre cada LC_*).
  assert.deepEqual([env.LANG, env.LC_ALL], ['ca_ES.UTF-8', 'ca_ES.UTF-8']);
  const semblantANix = entornDeBuild({ base, epoca: 42, exemple, variacio: VARIACIONS[0], home: '/tmp/casa' });
  assert.deepEqual([semblantANix.TZ, semblantANix.LANG, semblantANix.LC_ALL], ['UTC', 'C', 'C']);
  for (const fora of ['CI', 'NODE_ENV', 'VITE_TENANT_ID', 'VITE_CANONICAL_URL', 'npm_config_registry', 'LC_CTYPE', 'LC_NUMERIC', 'LANGUAGE']) assert.equal(env[fora], undefined, fora);
  assert.equal(entornDeBuild({ base, epoca: 1, origen: 'https://poble.example.org', exemple, variacio: VARIACIONS[0], home: '/h' }).VITE_CANONICAL_URL, 'https://poble.example.org');
  // Cada variable de l'env del flake hi és (el comprovador reproduïx el sandbox, no el Mac).
  const blocEnv = /env = \{([\s\S]*?)\n\s*\}/.exec(FLAKE)[1];
  const claus = [...blocEnv.matchAll(/^\s*([A-Z_]+) = /gm)].map((m) => m[1]);
  assert.ok(claus.length >= 5, claus.join(', '));
  for (const clau of claus) assert.ok(Object.hasOwn(env, clau), clau);
  assert.notEqual(VARIACIONS[0].TZ, VARIACIONS[1].TZ);
  assert.notEqual(VARIACIONS[0].LANG, VARIACIONS[1].LANG);
});

test('directori de treball: mai dins del repositori', (t) => {
  const repositori = temporal(t, 'sdp-reproduible-arrel-');
  for (const dins of ['dist', 'tooling/seo']) fs.mkdirSync(path.join(repositori, dins), { recursive: true });
  for (const dins of ['.', 'dist', 'tooling/seo']) assert.throws(() => validaTreball(repositori, path.join(repositori, dins)), /dins del repositori/, dins);
  assert.throws(() => validaTreball(repositori, ''), /--treball/);
  const fora = temporal(t);
  assert.equal(validaTreball(repositori, fora), fora);
  // Un enllaç de fora que apunta dins també es rebutja (es compara el camí real).
  fs.symlinkSync(path.join(repositori, 'dist'), path.join(fora, 'drecera'));
  assert.throws(() => validaTreball(repositori, path.join(fora, 'drecera')), /dins del repositori/);
  // Un germà amb el mateix prefix de nom no és «dins».
  fs.mkdirSync(`${repositori}-germa`);
  t.after(() => fs.rmSync(`${repositori}-germa`, { recursive: true, force: true }));
  assert.equal(validaTreball(repositori, `${repositori}-germa`), `${repositori}-germa`);
});

test('inventari i comparació: fitxers amb punt, enllaços, el primer byte que canvia i un digest estable', (t) => {
  const arrel = temporal(t);
  const escriu = (rel, dades) => { fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true }); fs.writeFileSync(path.join(arrel, rel), dades); };
  for (const costat of ['a', 'b']) {
    escriu(`${costat}/index.html`, '<!doctype html>');
    escriu(`${costat}/.well-known/nodeinfo`, '{}\n');
    escriu(`${costat}/ap/actors/x.json`, '{"id":"https://socdepoble.org/ap/actors/x.json"}\n');
    fs.symlinkSync('index.html', path.join(arrel, costat, 'enllac.html'));
  }
  const [a, b] = ['a', 'b'].map((c) => path.join(arrel, c));
  let [ia, ib] = [inventari(a), inventari(b)];
  assert.deepEqual([...ia.keys()], ['.well-known/nodeinfo', 'ap/actors/x.json', 'enllac.html', 'index.html']);
  assert.equal(ia.get('enllac.html'), 'enllac:index.html');
  assert.deepEqual(comparaInventaris(ia, ib), { identics: true, nomesA: [], nomesB: [], diferents: [] });
  assert.equal(digestDelLlistat(ia), digestDelLlistat(new Map([...ia].reverse())));
  // Els mateixos camins amb un sol byte diferent: no són idèntiques.
  escriu('b/.well-known/nodeinfo', '{ }\n');
  assert.deepEqual(comparaInventaris(ia, inventari(b)), { identics: false, nomesA: [], nomesB: [], diferents: ['.well-known/nodeinfo'] });
  escriu('b/.well-known/nodeinfo', '{}\n');
  escriu('b/ap/actors/x.json', '{"id":"https://socdepoble.org/ap/actors/y.json"}\n');
  escriu('b/.well-known/webfinger/x.json', '{}\n');
  fs.rmSync(path.join(b, 'index.html'));
  ib = inventari(b);
  assert.deepEqual(comparaInventaris(ia, ib), { identics: false, nomesA: ['index.html'], nomesB: ['.well-known/webfinger/x.json'], diferents: ['ap/actors/x.json'] });
  assert.notEqual(digestDelLlistat(ia), digestDelLlistat(ib));
  const diferencia = primeraDiferencia(path.join(a, 'ap/actors/x.json'), path.join(b, 'ap/actors/x.json'));
  assert.equal(diferencia.offset, '{"id":"https://socdepoble.org/ap/actors/'.length);
  assert.equal(primeraDiferencia(path.join(a, 'ap/actors/x.json'), path.join(a, 'ap/actors/x.json')), null);
  ia = inventari(a);
  assert.equal(ia.size, 4);
});

test('node_modules: un directori real amb un enllaç per paquet, també dins dels @àmbits', (t) => {
  const arrel = temporal(t);
  const origen = path.join(arrel, 'origen');
  for (const rel of ['pkg-a', '@ambit/b', '@ambit/c', '.bin', '.vite', '.package-lock.json']) {
    if (rel.endsWith('.json')) fs.writeFileSync(path.join(origen, rel), '{}');
    else fs.mkdirSync(path.join(origen, rel), { recursive: true });
  }
  const desti = path.join(arrel, 'copia', 'node_modules');
  fs.mkdirSync(path.dirname(desti));
  assert.equal(enllacaNodeModules(origen, desti), 4);
  const tipus = (rel) => { const e = fs.lstatSync(path.join(desti, rel)); return e.isSymbolicLink() ? 'enllac' : e.isDirectory() ? 'directori' : 'fitxer'; };
  assert.equal(tipus('.'), 'directori');
  assert.equal(tipus('@ambit'), 'directori');
  for (const rel of ['pkg-a', '@ambit/b', '@ambit/c', '.bin']) assert.equal(tipus(rel), 'enllac', rel);
  assert.equal(fs.readlinkSync(path.join(desti, 'pkg-a')), path.join(origen, 'pkg-a'));
  for (const rel of ['.vite', '.package-lock.json']) assert.equal(fs.existsSync(path.join(desti, rel)), false, rel);
  // Sense node_modules d'origen: el directori igualment, buit.
  const buit = path.join(arrel, 'buit');
  assert.equal(enllacaNodeModules(path.join(arrel, 'no-existix'), buit), 0);
  assert.deepEqual(fs.readdirSync(buit), []);
});

/* Un repositori git mínim amb un flake de mentida: la font, la recepta i l'exemple, i un build de node. */
function repositoriDeProva(t, build) {
  const arrel = temporal(t, 'sdp-reproduible-repo-');
  fs.writeFileSync(path.join(arrel, 'flake.nix'), [
    '{', '  font = [', '    # sdp:font-inici', '    ./build.mjs', '    ./dades', '    # sdp:font-fi', '  ];',
    '  exemple = {', '    supabaseUrl = "https://backend.example.org";', '    clauPublica = "sb_publishable_exemple";', '    modeDades = "seed";', '  };',
    "  buildPhase = ''", '    # sdp:recepta-inici', '    node build.mjs --origen "$SDP_ORIGEN"', '    # sdp:recepta-fi', "  '';", '}', ''
  ].join('\n'));
  fs.mkdirSync(path.join(arrel, 'dades'));
  fs.writeFileSync(path.join(arrel, 'dades', 'poble.json'), '{"slug":"sella"}\n');
  fs.writeFileSync(path.join(arrel, 'build.mjs'), build);
  fs.writeFileSync(path.join(arrel, 'fora.txt'), 'no és de la font\n');
  const git = spawnSync('git', ['init', '-q'], { cwd: arrel, encoding: 'utf8' });
  assert.equal(git.status, 0, git.stderr);
  return arrel;
}

const BUILD_DETERMINISTA = `
import fs from 'node:fs';
const origen = process.argv[process.argv.indexOf('--origen') + 1];
const poble = JSON.parse(fs.readFileSync('dades/poble.json', 'utf8'));
fs.mkdirSync('dist/ap/actors', { recursive: true });
fs.mkdirSync('dist/.well-known', { recursive: true });
fs.writeFileSync('dist/index.html', '<!-- ' + new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() + ' -->');
fs.writeFileSync('dist/ap/actors/' + poble.slug + '.json', JSON.stringify({ id: origen + '/ap/actors/' + poble.slug + '.json' }) + '\\n');
fs.writeFileSync('dist/.well-known/nodeinfo', '{}\\n');
fs.writeFileSync('dist/fora.txt', String(fs.existsSync('fora.txt')));
`;

test('de cap a cap sense Nix: dues construccions iguals passen; la ruta, la zona o una ordre que falla, no', (t) => {
  const treball = temporal(t, 'sdp-reproduible-treball-');
  const opcions = { treball, epoca: 1793288187, nodeModules: path.join(treball, 'cap-node-modules'), base: process.env };
  // Bé: idèntiques, la federació (també amb punt) inventariada, el treball esborrat.
  const bo = comprova({ ...opcions, arrel: repositoriDeProva(t, BUILD_DETERMINISTA), exigits: ['ap/actors/'] });
  assert.equal(bo.codi, 0, JSON.stringify(bo.informe.diferencies ?? bo.informe.construccions));
  assert.equal(bo.informe.identiques, true);
  assert.deepEqual(bo.informe.federacio, ['.well-known/nodeinfo', 'ap/actors/sella.json']);
  assert.deepEqual(bo.informe.exigits, [{ prefix: 'ap/actors/', fitxers: 1 }]);
  assert.equal(bo.informe.font.fitxers, 2);
  assert.deepEqual(bo.informe.ordres, ['node build.mjs --origen {origen}']);
  assert.equal(bo.informe.treball, null);
  assert.equal(bo.informe.construccions[0].digestDelLlistat, bo.informe.construccions[1].digestDelLlistat);
  // Un prefix exigit que no hi és: codi 1 encara que siguen idèntiques.
  const falta = comprova({ ...opcions, arrel: repositoriDeProva(t, BUILD_DETERMINISTA), exigits: ['ap/outbox/'] });
  assert.equal(falta.codi, 1);
  assert.equal(falta.informe.identiques, true);
  assert.deepEqual(falta.informe.exigits, [{ prefix: 'ap/outbox/', fitxers: 0 }]);
  // La ruta del directori es filtra al dist/: la segona còpia, d'una altra ruta, ho delata.
  const ruta = comprova({ ...opcions, arrel: repositoriDeProva(t, `${BUILD_DETERMINISTA}\nfs.writeFileSync('dist/ruta.txt', process.cwd());\n`), exigits: [] });
  assert.equal(ruta.codi, 1);
  assert.deepEqual(ruta.informe.diferencies.diferents, ['ruta.txt']);
  assert.equal(typeof ruta.informe.diferencies.mostres[0].offset, 'number');
  assert.ok(fs.existsSync(ruta.informe.treball), 'una construcció no reproduïble conserva el treball');
  // La zona horària es filtra (UTC contra Europe/Madrid).
  const zona = comprova({ ...opcions, arrel: repositoriDeProva(t, `${BUILD_DETERMINISTA}\nfs.writeFileSync('dist/hora.txt', new Date(0).toString());\n`), exigits: [] });
  assert.equal(zona.codi, 1);
  assert.deepEqual(zona.informe.diferencies.diferents, ['hora.txt']);
  // Una ordre que falla: codi 3 i el registre.
  const falla = comprova({ ...opcions, arrel: repositoriDeProva(t, 'process.exit(7);\n'), exigits: [] });
  assert.equal(falla.codi, 3);
  assert.equal(falla.informe.construccions[0].ok, false);
  assert.equal(falla.informe.construccions[0].codi, 7);
});

/* git sobre un repositori de prova: sense cap GIT_* heretat (un hook definix GIT_DIR i GIT_INDEX_FILE i
   l'escriptura aniria a parar a un altre repositori), sense hooks ni signatura i amb una data de commit fixa. */
const ENTORN_GIT = Object.fromEntries(Object.entries(process.env).filter(([clau]) => !clau.startsWith('GIT_')));
function git(cwd, ...args) {
  const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', '-c', 'user.name=Prova', '-c', 'user.email=prova@example.org', ...args], {
    cwd, encoding: 'utf8', env: { ...ENTORN_GIT, GIT_AUTHOR_DATE: '@1700000000 +0000', GIT_COMMITTER_DATE: '@1700000000 +0000' }
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

/* Un repositori de prova que tooling/lib/arrel.mjs reconeix com a arrel (--arrel=…), amb una part
   versionada (build.mjs, dades/poble.json) i un fitxer de la font sense versionar (dades/nou.json). */
function repositoriArrel(t, build) {
  const arrel = repositoriDeProva(t, build);
  fs.mkdirSync(path.join(arrel, '.agents'));
  fs.writeFileSync(path.join(arrel, '.agents', 'AGENTS.md'), '# arrel de prova\n');
  git(arrel, 'add', 'build.mjs', 'dades/poble.json');
  fs.writeFileSync(path.join(arrel, 'dades', 'nou.json'), '{"slug":"nou"}\n');
  return arrel;
}

/* Només el que cal per a executar node i git: ni SOURCE_DATE_EPOCH ni SDP_ARREL del procés de les proves. */
const ENTORN_MINIM = Object.fromEntries(['PATH', 'TMPDIR'].filter((clau) => process.env[clau]).map((clau) => [clau, process.env[clau]]));

test('època per defecte: SOURCE_DATE_EPOCH si és un enter; si no, la data del commit de HEAD; sense cap dels dos, error', (t) => {
  const repositori = repositoriDeProva(t, BUILD_DETERMINISTA);
  // Un enter a l'entorn mana, sense preguntar a git (el repositori encara no té cap commit).
  assert.deepEqual(epocaPerDefecte(repositori, { SOURCE_DATE_EPOCH: '1793288187' }), { epoca: 1793288187, font: 'SOURCE_DATE_EPOCH' });
  // Sense commit i sense un enter a l'entorn, error que demana --epoca (mai 0 ni NaN).
  for (const env of [{}, { SOURCE_DATE_EPOCH: '' }, { SOURCE_DATE_EPOCH: 'abc' }, { SOURCE_DATE_EPOCH: '17.5' }, { SOURCE_DATE_EPOCH: '-1' }, { SOURCE_DATE_EPOCH: '1e9' }, { SOURCE_DATE_EPOCH: ' 42' }]) {
    assert.throws(() => epocaPerDefecte(repositori, env), /passa --epoca/, JSON.stringify(env));
  }
  // Amb un commit: la seua data (la de self.lastModified al flake), també quan l'entorn no porta un enter.
  git(repositori, 'add', 'flake.nix');
  git(repositori, 'commit', '-q', '-m', 'prova');
  const deHead = { epoca: 1700000000, font: 'git log -1 --format=%ct (HEAD)' };
  assert.deepEqual(epocaPerDefecte(repositori, {}), deHead);
  assert.deepEqual(epocaPerDefecte(repositori, { SOURCE_DATE_EPOCH: '17.5' }), deHead);
  assert.deepEqual(epocaPerDefecte(repositori, { SOURCE_DATE_EPOCH: '1' }), { epoca: 1, font: 'SOURCE_DATE_EPOCH' });
});

test('font del flake: --nomes-versionats veu el que veu Nix (només el versionat), cap fitxer ignorat, i un camí sense cap fitxer és un error', (t) => {
  const repositori = repositoriDeProva(t, BUILD_DETERMINISTA);
  const escriu = (rel, dades) => { fs.mkdirSync(path.dirname(path.join(repositori, rel)), { recursive: true }); fs.writeFileSync(path.join(repositori, rel), dades); };
  escriu('.gitignore', '*.tmp\n');
  escriu('dades/esborrat.json', '{}\n');
  git(repositori, 'add', 'build.mjs', 'dades/poble.json', 'dades/esborrat.json', '.gitignore');
  fs.rmSync(path.join(repositori, 'dades/esborrat.json')); // versionat, però esborrat del disc
  escriu('dades/nou.json', '{"slug":"nou"}\n'); // sense versionar
  escriu('dades/brossa.tmp', 'ignorat\n'); // ignorat per .gitignore
  escriu('nomes-nou/a.json', '{}\n'); // un camí amb només fitxers sense versionar
  fs.mkdirSync(path.join(repositori, 'buit')); // un camí sense cap fitxer
  const camins = ['build.mjs', 'dades'];
  assert.deepEqual(fitxersDeLaFont(repositori, camins), { fitxers: ['build.mjs', 'dades/nou.json', 'dades/poble.json'], absents: ['dades/esborrat.json'] });
  assert.deepEqual(fitxersDeLaFont(repositori, camins, { nomesVersionats: true }), { fitxers: ['build.mjs', 'dades/poble.json'], absents: ['dades/esborrat.json'] });
  // Un camí del flake sense cap fitxer (buit o absent): Nix no el trobaria a la font i el comprovador no el deixa passar.
  assert.throws(() => fitxersDeLaFont(repositori, [...camins, 'buit']), /^Error: Camins del flake sense cap fitxer: buit$/);
  assert.throws(() => fitxersDeLaFont(repositori, [...camins, 'no-existix', 'buit']), /sense cap fitxer: no-existix, buit$/);
  // Només amb fitxers sense versionar: el veu el mode de l'arbre de treball, però no el de Nix.
  assert.deepEqual(fitxersDeLaFont(repositori, ['nomes-nou']).fitxers, ['nomes-nou/a.json']);
  assert.throws(() => fitxersDeLaFont(repositori, ['nomes-nou'], { nomesVersionats: true }), /sense cap fitxer: nomes-nou$/);
});

test('de cap a cap: el locale també varia (C contra ca_ES), i un build que el filtra no passa', (t) => {
  const treball = temporal(t, 'sdp-reproduible-treball-');
  const opcions = { treball, epoca: 1793288187, nodeModules: path.join(treball, 'cap-node-modules'), base: process.env, exigits: [] };
  // El mateix número amb el format del locale de cada construcció: «1,234.5» (C) contra «1.234,5» (ca_ES).
  const locale = comprova({ ...opcions, arrel: repositoriDeProva(t, `${BUILD_DETERMINISTA}\nfs.writeFileSync('dist/xifra.txt', (1234.5).toLocaleString());\n`) });
  assert.equal(locale.codi, 1, JSON.stringify(locale.informe.construccions));
  assert.deepEqual(locale.informe.diferencies.diferents, ['xifra.txt']);
  assert.deepEqual(locale.informe.construccions.map((c) => c.variacio), [{ TZ: 'UTC', LANG: 'C' }, { TZ: 'Europe/Madrid', LANG: 'ca_ES.UTF-8' }]);
  // Amb les dues variacions iguals (--sense-variacions), el mateix build passa: la diferència era el locale.
  const igual = VARIACIONS.map((v) => ({ ...VARIACIONS[0], id: v.id }));
  const senseVariacions = comprova({ ...opcions, variacions: igual, arrel: repositoriDeProva(t, `${BUILD_DETERMINISTA}\nfs.writeFileSync('dist/xifra.txt', (1234.5).toLocaleString());\n`) });
  assert.equal(senseVariacions.codi, 0, JSON.stringify(senseVariacions.informe.diferencies));
});

/* Una eixida en memòria per a main(). */
function eixida() {
  const trossos = [];
  return { write: (text) => { trossos.push(String(text)); return true; }, text: () => trossos.join('') };
}

test('CLI (main): una opció errònia ix amb 2 sense construir; --sense-exigencies, --exigeix, --nomes-versionats, --sense-variacions, --conserva, --json i l’època de l’entorn fan el que diuen', (t) => {
  const crida = (argv, env = {}) => {
    const [stdout, stderr] = [eixida(), eixida()];
    const codi = main(argv, { stdout, stderr, env: { ...ENTORN_MINIM, ...env } });
    return { codi, stdout: stdout.text(), stderr: stderr.text() };
  };
  const repositori = repositoriArrel(t, BUILD_DETERMINISTA);
  const treball = temporal(t, 'sdp-reproduible-treball-');
  // Sempre amb --arrel al repositori de prova: si una opció errònia passara, construiria este, mai el del projecte.
  const base = [`--arrel=${repositori}`, '--treball', treball, '--epoca', '1793288187'];

  // Ús: codi 2, el motiu i l'ús a stderr, res a stdout.
  for (const [argv, motiu] of [
    [['--desconeguda'], /^Opció desconeguda: --desconeguda\nÚs: node tooling\/seo\/comprova-reproductibilitat\.mjs /],
    [['--origen', 'http://socdepoble.org'], /^--origen ha de ser un origen https net\nÚs: /],
    [['--origen', 'https://socdepoble.org/cami'], /^--origen ha de ser un origen https net\nÚs: /],
    [['--origen', 'no és una url'], /^Invalid URL\nÚs: /],
    [['--epoca', '17.5'], /^--epoca ha de ser un enter \(segons des de 1970\)\nÚs: /],
    [['--exigeix', '--json'], /^--exigeix necessita un valor\nÚs: /],
    [['--treball'], /^--treball necessita un valor\nÚs: /]
  ]) {
    const r = crida([...base, ...argv]);
    assert.deepEqual([r.codi, r.stdout], [2, ''], argv.join(' '));
    assert.match(r.stderr, motiu, argv.join(' '));
  }
  // Errors de la comprovació (no de l'ús): també 2, sense l'ús i sense res a stdout.
  for (const [argv, motiu] of [
    // La primera: una arrel sense el marcador de tooling/lib/arrel.mjs. Si main no llegira el --arrel dels seus
    // argv, «--recepta docker» la faria caure ací, abans de cap crida que construïsca (seria l'arbre del projecte).
    [[`--arrel=${treball}`, '--treball', treball, '--epoca', '1', '--recepta', 'docker'], /^Arrel imposada sense marcador: /],
    [[...base, '--recepta', 'docker'], /^Recepta desconeguda: docker \(flake o vite\)\n$/],
    [[...base, '--treball', path.join(repositori, 'dades')], /^El directori de treball és dins del repositori /]
  ]) {
    const r = crida(argv);
    assert.deepEqual([r.codi, r.stdout], [2, ''], argv.join(' '));
    assert.match(r.stderr, motiu, argv.join(' '));
  }

  // Per defecte exigix ap/actors/ i ap/outbox/; el build de prova no fa cap outbox: 1, ho diu i conserva el treball.
  const perDefecte = crida(base);
  assert.equal(perDefecte.codi, 1, perDefecte.stderr);
  assert.match(perDefecte.stdout, /^REPRODUÏBLE: els dos dist\/ són idèntics byte a byte\.$/m);
  assert.match(perDefecte.stdout, /^ {2}exigit ap\/actors\/: 1 fitxers$/m);
  assert.match(perDefecte.stdout, /^ {2}exigit ap\/outbox\/: 0 fitxers · FALTA$/m);
  assert.match(perDefecte.stdout, /^Directori de treball conservat: /m);
  assert.match(perDefecte.stdout, /^Font: 3 fitxers de 2 camins del flake/m);
  // --sense-exigencies: el mateix build passa i el treball s'esborra; --json és l'informe sencer.
  const sense = crida([...base, '--sense-exigencies', '--json']);
  assert.equal(sense.codi, 0, sense.stderr);
  const informe = JSON.parse(sense.stdout);
  assert.equal(informe.esquema, 'sdp.reproduible.v1');
  assert.deepEqual([informe.exigits, informe.identiques, informe.treball], [[], true, null]);
  assert.deepEqual([informe.sourceDateEpoch, informe.fontEpoca, informe.origen], [1793288187, '--epoca', ORIGEN_PER_DEFECTE]);
  // --exigeix substituïx els prefixos per defecte (no s'hi afig).
  const exigeix = JSON.parse(crida([...base, '--exigeix', 'ap/actors/', '--json']).stdout);
  assert.deepEqual(exigeix.exigits, [{ prefix: 'ap/actors/', fitxers: 1 }]);
  // --nomes-versionats: la font és la que veu Nix (2 fitxers versionats, no el nou).
  const versionats = crida([...base, '--sense-exigencies', '--nomes-versionats', '--json']);
  assert.equal(versionats.codi, 0, versionats.stderr);
  assert.deepEqual([informe.font.fitxers, JSON.parse(versionats.stdout).font.fitxers], [3, 2]);
  // --conserva: passa i el treball queda, dins del --treball.
  const conserva = JSON.parse(crida([...base, '--sense-exigencies', '--conserva', '--json']).stdout);
  assert.ok(conserva.treball.startsWith(`${treball}${path.sep}sdp-reproduible-`) && fs.existsSync(conserva.treball), conserva.treball);
  // Sense --epoca, la de l'env que rep main (no la del procés).
  const perEnv = JSON.parse(crida([`--arrel=${repositori}`, '--treball', treball, '--sense-exigencies', '--json'], { SOURCE_DATE_EPOCH: '1700000001' }).stdout);
  assert.deepEqual([perEnv.sourceDateEpoch, perEnv.fontEpoca], [1700000001, 'SOURCE_DATE_EPOCH']);
  // --sense-variacions: un build que filtra la zona no passa amb les variacions i sí sense.
  const zona = repositoriArrel(t, `${BUILD_DETERMINISTA}\nfs.writeFileSync('dist/hora.txt', new Date(0).toString());\n`);
  const ambZona = crida([`--arrel=${zona}`, '--treball', treball, '--epoca', '1', '--sense-exigencies']);
  assert.equal(ambZona.codi, 1, ambZona.stderr);
  assert.match(ambZona.stdout, /^NO REPRODUÏBLE:\n {2}diferent: hora\.txt · byte /m);
  const senseZona = JSON.parse(crida([`--arrel=${zona}`, '--treball', treball, '--epoca', '1', '--sense-exigencies', '--sense-variacions', '--json']).stdout);
  assert.deepEqual([senseZona.identiques, senseZona.construccions.map((c) => c.variacio.TZ)], [true, ['UTC', 'UTC']]);
});

test('CLI de veres: el procés node ix amb el codi de l’informe (0, 1 o 2)', (t) => {
  const repositori = repositoriArrel(t, BUILD_DETERMINISTA);
  const treball = temporal(t, 'sdp-reproduible-treball-');
  const executaCli = (arrel, ...argv) => spawnSync(process.execPath, [
    path.join(ARREL, 'tooling/seo/comprova-reproductibilitat.mjs'), `--arrel=${arrel}`, '--treball', treball, '--epoca', '1793288187', ...argv
  ], { cwd: treball, encoding: 'utf8', env: ENTORN_MINIM });
  // Primer, que l'arrel és la del --arrel (sense marcador → 2); si no ho fora, «--recepta docker» cau ací sense construir.
  const senseMarcador = executaCli(treball, '--recepta', 'docker');
  assert.equal(senseMarcador.status, 2);
  assert.match(senseMarcador.stderr, /^Arrel imposada sense marcador: /);
  const cli = (...argv) => executaCli(repositori, ...argv);
  const bo = cli('--sense-exigencies');
  assert.equal(bo.status, 0, bo.stderr);
  assert.match(bo.stdout, /^REPRODUÏBLE: /m);
  const falta = cli();
  assert.equal(falta.status, 1, falta.stderr);
  assert.match(falta.stdout, /exigit ap\/outbox\/: 0 fitxers · FALTA/);
  const dolenta = cli('--desconeguda');
  assert.deepEqual([dolenta.status, dolenta.stdout], [2, '']);
  assert.match(dolenta.stderr, /^Opció desconeguda: --desconeguda\n/);
});
