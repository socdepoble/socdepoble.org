// QA-R2-07 (Codex 261029_1859) i P-16 dels residus de les auditories (261030) ·
// El bot s'empaqueta sencer. La imatge de Docker ha de portar tot el graf de mòduls
// que carrega (bot/ i els mòduls de tooling/ que importa amb ../tooling), cap secret
// ni estat del bot, un Node exacte dins dels engines del package.json i un usuari
// sense privilegis; la CI ha de fer servir un Node dins dels mateixos engines.
// Sense Docker ni xarxa: el Dockerfile, el .dockerignore i el compose es lligen com
// a text, la imatge es reconstruïx en un mkdtemp (fora del repositori) i un procés
// fill hi arrenca el cervell amb @google/genai fals i sense cap fetch.
// La persona, el corpus i el servidor remot són del Mestre: la prova només fixa on
// els busca el bot dins del contenidor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { builtinModules } from 'node:module';
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'acorn';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const llig = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

/* ── Dockerfile: només les instruccions que fa servir este; qualsevol altra peta ── */
function llegixDockerfile(text) {
  const imatge = { from: null, workdir: '/', env: {}, copies: [], runs: [], user: 'root', cmd: null };
  const linies = text.replace(/\\\r?\n/g, ' ').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  for (const linia of linies) {
    const [, ordre = '', resta = ''] = /^(\S+)\s*(.*)$/.exec(linia) ?? [];
    switch (ordre.toUpperCase()) {
      case 'FROM':
        assert.equal(imatge.from, null, 'el simulador no preveu imatges de diverses etapes');
        imatge.from = resta;
        break;
      case 'WORKDIR':
        imatge.workdir = path.posix.resolve(imatge.workdir, resta);
        break;
      case 'ENV':
        for (const parell of resta.split(/\s+/)) {
          const m = /^([A-Za-z_][A-Za-z0-9_]*)=([^\s"'$]*)$/.exec(parell);
          assert.ok(m, `ENV no previst pel simulador: ${parell}`);
          imatge.env[m[1]] = m[2];
        }
        break;
      case 'COPY': {
        const parts = resta.split(/\s+/);
        assert.ok(parts.length === 2 && !parts.some((p) => p.startsWith('--')), `COPY no previst pel simulador: ${linia}`);
        const [font, desti] = parts;
        imatge.copies.push({
          font: path.posix.normalize(font).replace(/\/$/, ''),
          desti: path.posix.resolve(imatge.workdir, desti),
          desticarpeta: desti.endsWith('/') || desti === '.',
        });
        break;
      }
      case 'RUN':
        imatge.runs.push(resta);
        break;
      case 'USER':
        imatge.user = resta;
        break;
      case 'CMD':
        imatge.cmd = JSON.parse(resta);
        break;
      default:
        assert.fail(`Instrucció no prevista pel simulador: ${linia}`);
    }
  }
  return imatge;
}

/* ── .dockerignore amb la semàntica de Docker (moby/patternmatcher): camins
   relatius a l'arrel del context, `*` i `?` dins d'un segment, `**` per a
   qualsevol fondària, un patró que casa un pare exclou els fills, i l'última
   regla que casa (amb `!` d'excepció) mana. ── */
function patroARegex(patro) {
  assert.doesNotMatch(patro, /[[\\]/, `patró no previst pel simulador: ${patro}`);
  let re = '';
  for (let i = 0; i < patro.length; i += 1) {
    const ch = patro[i];
    if (ch === '*' && patro[i + 1] === '*') {
      if (patro[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
    } else if (ch === '*') re += '[^/]*';
    else if (ch === '?') re += '[^/]';
    else re += ch.replace(/[.+^${}()|]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

function filtreDockerignore(text) {
  const regles = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((cru) => {
    const nega = cru.startsWith('!');
    const patro = path.posix.normalize((nega ? cru.slice(1) : cru).trim()).replace(/^\/+/, '').replace(/\/+$/, '');
    return { nega, re: patroARegex(patro) };
  });
  const exclos = (rel) => {
    const camins = [];
    for (let c = rel; c && c !== '.' && c !== '/'; c = path.posix.dirname(c)) camins.push(c);
    let fora = false;
    for (const { nega, re } of regles) if (camins.some((c) => re.test(c))) fora = !nega;
    return fora;
  };
  exclos.ambExcepcions = regles.some((r) => r.nega);
  return exclos;
}

/* ── Fitxers de la imatge: camí dins del contenidor → camí del repositori ── */
function recorre(rel, exclos, eixida) {
  for (const entrada of readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    const fill = path.posix.join(rel, entrada.name);
    if (exclos(fill) && (entrada.isDirectory() ? !exclos.ambExcepcions : true)) continue;
    assert.ok(!entrada.isSymbolicLink(), `enllaç simbòlic dins de la imatge: ${fill}`);
    if (entrada.isDirectory()) recorre(fill, exclos, eixida);
    else if (entrada.isFile()) eixida.push(fill);
  }
  return eixida;
}

function fitxersDeLaImatge(imatge, exclos) {
  const fitxers = new Map();
  for (const { font, desti, desticarpeta } of imatge.copies) {
    const estat = lstatSync(path.join(ROOT, font));
    if (estat.isDirectory()) {
      for (const rel of recorre(font, exclos, [])) fitxers.set(path.posix.join(desti, path.posix.relative(font, rel)), rel);
    } else {
      assert.ok(estat.isFile() && !exclos(font), `COPY d'una font absent o exclosa: ${font}`);
      fitxers.set(desticarpeta ? path.posix.join(desti, path.posix.basename(font)) : desti, font);
    }
  }
  return fitxers;
}

/* ── Graf de mòduls resolt dins del contenidor, no al repositori ── */
function especificadors(codi, fitxer) {
  const trobats = [];
  const visita = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (/^(Import|ExportAll|ExportNamed)Declaration$/.test(node.type) && node.source) trobats.push(node.source.value);
    if (node.type === 'ImportExpression') {
      assert.equal(node.source.type, 'Literal', `${fitxer}: import() dinàmic que el simulador no pot seguir`);
      trobats.push(node.source.value);
    }
    for (const valor of Object.values(node)) {
      if (Array.isArray(valor)) valor.forEach(visita);
      else if (valor && typeof valor === 'object') visita(valor);
    }
  };
  visita(parse(codi, { ecmaVersion: 'latest', sourceType: 'module' }));
  return trobats;
}

const PAQUET_DE = (esp) => (esp.startsWith('@') ? esp.split('/').slice(0, 2).join('/') : esp.split('/')[0]);
const NATIU = (esp) => esp.startsWith('node:') || builtinModules.includes(esp);

function grafDeLaImatge(imatge, fitxers) {
  const entrades = [...fitxers.keys()].filter((c) => c.startsWith(`${imatge.workdir}/`) && c.endsWith('.mjs'));
  if (imatge.cmd?.[0] === 'node') entrades.push(path.posix.resolve(imatge.workdir, imatge.cmd[1]));
  const vistos = new Set();
  const absents = [];
  const paquets = new Set();
  const cua = [...entrades];
  while (cua.length) {
    const actual = cua.shift();
    if (vistos.has(actual)) continue;
    vistos.add(actual);
    const font = fitxers.get(actual);
    if (!font) continue;
    for (const esp of especificadors(readFileSync(path.join(ROOT, font), 'utf8'), font)) {
      if (esp.startsWith('.') || esp.startsWith('/')) {
        const objectiu = path.posix.resolve(path.posix.dirname(actual), esp);
        if (!fitxers.has(objectiu)) absents.push(`${actual} → ${esp}`);
        cua.push(objectiu);
      } else if (!NATIU(esp)) paquets.add(PAQUET_DE(esp));
    }
  }
  return { entrades, vistos, absents, paquets };
}

/* ── engines del package.json: només les formes que hi ha (^x.y.z i >=x.y.z) ── */
const versio = (text) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(text));
  return m ? m.slice(1).map(Number) : null;
};
const compara = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
function dinsDelsEngines(v, rang) {
  return rang.split('||').map((c) => c.trim()).some((condicio) => {
    const m = /^(\^|>=)(\d+\.\d+\.\d+)$/.exec(condicio);
    assert.ok(m, `condició d'engines no prevista: ${condicio}`);
    const minim = versio(m[2]);
    return compara(v, minim) >= 0 && (m[1] === '>=' || v[0] === minim[0]);
  });
}

const imatge = () => llegixDockerfile(llig('Dockerfile'));
const exclosos = () => filtreDockerignore(llig('.dockerignore'));
const ENGINES = JSON.parse(llig('package.json')).engines.node;

test('el filtre del .dockerignore seguix la semàntica de Docker (arrel, **, pares i excepcions)', () => {
  const f = filtreDockerignore('# comentari\n.env\n**/.iaia_auth\nbot/var\n*.log\n!bot/importa.log\n');
  assert.equal(f('.env'), true);
  assert.equal(f('bot/.env'), false, 'sense **/, un patró només casa a l’arrel del context');
  assert.equal(f('.iaia_auth/creds.json'), true);
  assert.equal(f('bot/.iaia_auth/creds.json'), true, '**/ casa a qualsevol fondària, també els fills');
  assert.equal(f('bot/var/memoria/x.json'), true, 'un pare exclòs exclou els fills');
  assert.equal(f('bot/variable.mjs'), false);
  assert.equal(f('error.log'), true);
  assert.equal(f('bot/error.log'), false, '* no travessa la barra');
  assert.equal(f('bot/importa.log'), false, 'l’última regla que casa mana');
});

test('el Dockerfile parteix d’un Node exacte dins dels engines i la CI fa servir un Node dins dels mateixos engines', () => {
  const { from } = imatge();
  const m = /^node:(\d+\.\d+\.\d+)-alpine(?:\d+(?:\.\d+)*)?(?:@sha256:[0-9a-f]{64})?$/.exec(from ?? '');
  assert.ok(m, `FROM sense versió exacta de Node (una etiqueta mòbil canvia la imatge entre construccions): ${from}`);
  assert.ok(dinsDelsEngines(versio(m[1]), ENGINES), `Node ${m[1]} de la imatge fora dels engines ${ENGINES}`);

  const fluxos = readdirSync(path.join(ROOT, '.github/workflows')).filter((f) => /\.ya?ml$/.test(f));
  assert.ok(fluxos.length > 0);
  for (const flux of fluxos) {
    const text = llig(`.github/workflows/${flux}`);
    const configuracions = (text.match(/uses:\s*actions\/setup-node@/g) ?? []).length;
    const versions = [...text.matchAll(/^\s*node-version:\s*['"]?([^'"\s#]+)['"]?\s*$/gm)].map((x) => x[1]);
    assert.equal(versions.length, configuracions, `${flux}: setup-node sense node-version explícit`);
    for (const v of versions) {
      assert.ok(versio(v), `${flux}: node-version ${v} no és una versió exacta`);
      assert.ok(dinsDelsEngines(versio(v), ENGINES), `${flux}: Node ${v} fora dels engines ${ENGINES}`);
    }
  }
});

test('la imatge conté tot el graf de mòduls del bot (../tooling inclòs) i només paquets declarats a bot/package.json', () => {
  const im = imatge();
  const fitxers = fitxersDeLaImatge(im, exclosos());
  assert.equal(fitxers.get(`${im.workdir}/package.json`), 'bot/package.json', 'el package.json del bot ha de quedar al WORKDIR');
  assert.ok(im.runs.some((r) => /\bnpm (ci|install)\b/.test(r)), 'cap RUN instal·la les dependències del bot');
  assert.deepEqual(im.cmd?.slice(0, 1), ['node'], 'CMD ha d’arrencar node directament (rep SIGTERM i desa la sessió en parar)');
  const { entrades, vistos, absents, paquets } = grafDeLaImatge(im, fitxers);
  assert.ok(entrades.includes(`${im.workdir}/index.mjs`) && entrades.includes(`${im.workdir}/cervell.mjs`));
  assert.deepEqual(absents, [], 'mòduls que el contenidor no trobaria (ERR_MODULE_NOT_FOUND)');
  assert.ok([...vistos].some((c) => c.includes('/tooling/')), 'el cervell importa ../tooling: el graf ha d’arribar-hi');
  const declarats = Object.keys(JSON.parse(llig('bot/package.json')).dependencies ?? {});
  assert.deepEqual([...paquets].filter((p) => !declarats.includes(p)), [], 'paquets importats que la imatge no instal·la');
});

test('el .dockerignore deixa fora de la imatge els secrets i l’estat del bot a qualsevol fondària', () => {
  const exclos = exclosos();
  for (const cami of ['.env', '.env.local', 'bot/.env', 'bot/.env.production', '.iaia_auth/creds.json',
    'bot/.iaia_auth/creds.json', 'bot/.wwebjs_auth/sessio', 'bot/.wwebjs_cache/x', 'bot/var/memoria/x.json',
    'bot/var/baileys-runtime/x', 'bot/node_modules/baileys/index.js', 'tooling/wiki/core/.env']) {
    assert.equal(exclos(cami), true, `${cami} entraria a la imatge`);
  }
  const fitxers = fitxersDeLaImatge(imatge(), exclos);
  const sensibles = [...fitxers.values()].filter((f) => /(^|\/)(\.env(\.[^/]*)?|\.iaia_auth|\.wwebjs_auth|\.wwebjs_cache|node_modules|var)(\/|$)/.test(f));
  assert.deepEqual(sensibles, []);
});

test('usuari sense privilegis, i els volums d’estat i de la Wiki pública on els busca el bot', () => {
  const im = imatge();
  assert.ok(!['', 'root', '0', '0:0', 'root:root'].includes(im.user), `la imatge corre com a ${im.user}`);
  const arrel = im.env.IAIA_PROJECT_ROOT;
  assert.ok(arrel, 'IAIA_PROJECT_ROOT ha de dir al bot on és l’arrel dins del contenidor');
  assert.equal(path.posix.resolve(im.workdir, '..'), arrel, 'el WORKDIR del bot és <arrel>/bot, com al repositori');
  const fitxers = fitxersDeLaImatge(im, exclosos());
  assert.equal(fitxers.get(`${arrel}/public/rag-index.json`), 'public/rag-index.json', 'l’índex públic del productor (RUTES.indexRag)');

  const compose = llig('docker-compose.yml');
  const volums = [...compose.matchAll(/^\s*-\s*(\.\/[^\s:]*):(\/[^\s:]+)(?::(ro|rw))?\s*$/gm)]
    .map(([, host, contenidor, mode = 'rw']) => ({ host, contenidor, mode }));
  // IAIA_STATE_ROOT sense definir: l'estat penja de bot/ (arrels.mjs), és a dir del WORKDIR.
  for (const estat of ['.iaia_auth', 'var']) {
    assert.ok(volums.some((v) => v.contenidor === `${im.workdir}/${estat}` && v.mode === 'rw'), `volum d’estat ${estat} absent`);
    assert.ok(im.runs.some((r) => r.includes(estat) && new RegExp(`chown -R ${im.user}\\b`).test(r)),
      `${estat} ha de ser de ${im.user} dins de la imatge`);
  }
  assert.ok(volums.some((v) => v.host === './_wiki_de_poble' && v.contenidor === `${arrel}/_wiki_de_poble` && v.mode === 'ro'),
    'la Wiki (RUTES.wiki) es munta només de lectura; publication-policy hi fa la frontera');
});

test('la imatge reconstruïda arrenca el cervell sense res del repositori, sense xarxa i amb @google/genai fals', (t) => {
  const im = imatge();
  const fitxers = fitxersDeLaImatge(im, exclosos());
  // realpath: a macOS tmpdir() penja d'un enllaç (/var → /private/var) i el
  // resolutor d'ESM torna camins reals; sense això la guarda de baix no actua.
  const tmp = realpathSync(mkdtempSync(path.join(tmpdir(), 'sdp-imatge-bot-')));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const dins = (c) => path.join(tmp, 'contenidor', ...c.split('/').filter(Boolean));
  for (const [contenidor, font] of fitxers) {
    mkdirSync(path.dirname(dins(contenidor)), { recursive: true });
    copyFileSync(path.join(ROOT, font), dins(contenidor));
  }
  // La persona és del Mestre: ací n'hi ha una de prova on la busca RUTES.persona.
  const arrel = im.env.IAIA_PROJECT_ROOT ?? '/sense-arrel';
  mkdirSync(dins(`${arrel}/bot/persona`), { recursive: true });
  writeFileSync(dins(`${arrel}/bot/persona/IAIA_MARIA.md`), '# Persona de prova\n');

  const dinsUrl = pathToFileURL(path.join(tmp, 'contenidor')).href + '/';
  const ganxos = path.join(tmp, 'ganxos.mjs');
  writeFileSync(ganxos, `import { registerHooks } from 'node:module';
const FALS = 'data:text/javascript,' + encodeURIComponent(
  'export const Type = {}; export class GoogleGenAI { constructor() { this.models = {}; } }');
globalThis.fetch = async () => { throw new Error('la prova de la imatge no fa xarxa'); };
registerHooks({
  resolve(esp, context, seguent) {
    if (esp === '@google/genai') return { url: FALS, shortCircuit: true };
    const r = seguent(esp, context);
    if (r.url.startsWith('file:') && !r.url.startsWith(${JSON.stringify(dinsUrl)}) && context.parentURL?.startsWith(${JSON.stringify(dinsUrl)})) {
      throw new Error('fora de la imatge: ' + r.url);
    }
    return r;
  },
});
`);
  const cervell = pathToFileURL(dins(`${im.workdir}/cervell.mjs`)).href;
  const immunite = pathToFileURL(dins(`${im.workdir}/immunite.mjs`)).href;
  const env = { PATH: process.env.PATH, HOME: tmp, GEMINI_API_KEY: 'fals' };
  for (const [clau, valor] of Object.entries(im.env)) env[clau] = valor.startsWith('/') ? dins(valor) : valor;
  const r = spawnSync(process.execPath, ['--import', pathToFileURL(ganxos).href, '--input-type=module', '-e',
    `const c = await import(${JSON.stringify(cervell)}); await c.iniciaCervell(); await import(${JSON.stringify(immunite)}); console.log('ARRENCADA_OK');`],
  { cwd: dins(im.workdir), env, encoding: 'utf8', timeout: 30000 });
  assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`);
  assert.match(r.stdout, /Índex preparat: \d+ fitxers/);
  assert.match(r.stdout, /ARRENCADA_OK/);
});
