#!/usr/bin/env node
/**
 * tractor-arrel.mjs — LA PORTA QUE VIGILA LES PORTES
 *
 * PER QUÈ EXISTIX
 * ───────────────
 * L'auditoria 260830 no va trobar regles sense porta. Va trobar el contrari, i
 * és pitjor: portes que no arrancaven, que no trobaven el que vigilaven, o que
 * deien ✅ sense haver comprovat res. Cinc casos reals:
 *
 *   · tractor-cognitiu.mjs buscava `AGENTS.md` a l'arrel. L'"Operació Tret al
 *     Cap" l'havia mogut a `.agents/`. Només arrancava amb `--arrel=.`, un flag
 *     màgic amagat dins d'`npm run porta`.
 *   · project_paths.mjs exigia `_wiki_de_poble`, que és un repositori separat.
 *     Sense la Wiki clonada llançava un stack trace cru.
 *   · tractor-doctrina.mjs llegia les exempcions de `.agents/doctrina-ignora.txt`
 *     mentre el fitxer vivia a `tooling/gates/`. La llista mai es carregava.
 *   · design_guard.mjs va viure mesos declarat a `npm run porta` sense bloc CLI:
 *     Node l'importava, definia funcions i eixia amb codi 0. Mai va fallar
 *     perquè mai es va executar.
 *   · `npm run time-machine` apuntava a `tooling/gates/estela.sh`, esborrat.
 *
 * Cap d'aquests defectes és detectable llegint el codi amb bona fe. Tots ho són
 * mecànicament. Açò és el que fa aquesta porta.
 *
 * COMPROVA
 *   A1 · Cap eina calcula l'arrel pel seu compte (només tooling/lib/arrel.mjs)
 *   A2 · Tot script de `package.json` apunta a un fitxer que existix
 *   A3 · `main` / `module` / `exports` no prometen artefactes que ningú construix
 *   A4 · Tota porta de `tooling/gates/` té punt d'entrada CLI (arranca de veres)
 *   A5 · Tot fitxer de configuració citat pel tooling existix on el cita
 *
 * Parser JavaScript ja declarat al projecte. Fail-closed.
 *
 * ÚS
 *   node tooling/gates/tractor-arrel.mjs
 *   node tooling/gates/tractor-arrel.mjs --json
 *   node tooling/gates/tractor-arrel.mjs --arrel=/ruta
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { R, rel, CAMINS, EXCLOSOS, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

const JSON_OUT = process.argv.includes('--json');

/** L'únic fitxer autoritzat a saber com es troba l'arrel. */
const CUSTODI = 'tooling/lib/arrel.mjs';

/** Fitxers que poden citar marcadors d'arrel sense ser el custodi. */
const EXEMPTS_A1 = new Set([
  CUSTODI,
  'tooling/gates/tractor-arrel.mjs',
  'tooling/verify-bios.mjs', // el seu ofici és precisament comprovar que hi són
]);

const infraccions = [];
const anota = (llei, fitxer, detall, pista) => infraccions.push({ llei, fitxer, detall, pista });

/* ═══════════════════════ Recorregut ═══════════════════════ */

function fitxers(dirRelatiu, exts = ['.mjs', '.cjs', '.js']) {
  const eixida = [];
  const arrelDir = R(dirRelatiu);
  if (!fs.existsSync(arrelDir)) return eixida;
  (function camina(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (EXCLOSOS.has(e.name)) continue;
      const c = path.join(d, e.name);
      if (e.isDirectory()) camina(c);
      else if (exts.includes(path.extname(e.name))) eixida.push(c);
    }
  }(arrelDir));
  return eixida;
}

const llegeix = (abs) => { try { return fs.readFileSync(abs, 'utf8'); } catch { return ''; } };

/* ═══════════════════════ A1 · Monopoli del descobriment d'arrel ═══════════════════════ */

/**
 * Detecta el patró «buscar un marcador d'arrel a mà». No busca noms de funció
 * (es poden dir com siga): busca la petjada semàntica, que és citar un marcador
 * estructural dins d'una comprovació d'existència o d'una llista de marcadors.
 */
const PATRONS_A1 = [
  { re: /existsSync\s*\([^)]*['"`](?:\.agents\/)?AGENTS\.md['"`]/, què: 'comprovació manual del marcador AGENTS.md' },
  { re: /MARCADORS?\s*=\s*\[[^\]]*['"`]AGENTS\.md['"`]/, què: 'llista pròpia de marcadors d\'arrel' },
  { re: /REQUIRED_(?:FILES|DIRECTORIES)\s*=/, què: 'contracte estructural paral·lel' },
  { re: /function\s+(?:trobaArrel|discoverProjectRoot|findRoot|getProjectRoot)\b/, què: 'funció pròpia de descobriment d\'arrel' },
];

for (const abs of fitxers(CAMINS.tooling)) {
  const r = rel(abs);
  if (EXEMPTS_A1.has(r)) continue;
  const text = llegeix(abs);
  // Si el fitxer importa el custodi, qualsevol funció amb nom de descobriment
  // és una capa de compatibilitat que delega, no una implementació rival.
  // Sense aquesta excepció, un adaptador correcte quedaria marcat per sempre.
  if (/from\s+['"](?:\.\/|[^'"]*\/lib\/)arrel\.mjs['"]/.test(text)) continue;
  for (const p of PATRONS_A1) {
    if (p.re.test(text)) {
      anota('A1', r, p.què,
        `importa { R, rel, CAMINS } de '${path.relative(path.dirname(r), CUSTODI).split(path.sep).join('/')}'`);
      break;
    }
  }
}

/* ═══════════════════════ A2 · Scripts de package.json vius ═══════════════════════ */

let pkg = null;
try { pkg = JSON.parse(llegeix(R('package.json'))); } catch { /* A2 ho reportarà */ }

if (!pkg) {
  anota('A2', 'package.json', 'no existix o no és JSON vàlid', 'sense manifest no es poden validar les portes');
} else {
  /* Extrau tota ruta de fitxer del cos d'un script i comprova que existix.
     Es reconeixen les invocacions habituals: node/sh/bash/python3 <fitxer>. */
  const RE_INVOCACIO = /(?:^|[\s&|;])(?:node|sh|bash|python3?|npx\s+\S+)\s+(--?\S+\s+)*([A-Za-z0-9_./-]+\.(?:mjs|cjs|js|sh|py))/g;
  for (const [nom, cos] of Object.entries(pkg.scripts ?? {})) {
    for (const m of String(cos).matchAll(RE_INVOCACIO)) {
      const objectiu = m[2];
      if (objectiu.startsWith('-')) continue;
      if (!fs.existsSync(R(objectiu))) {
        anota('A2', 'package.json', `l'script "${nom}" invoca ${objectiu}, que no existix`,
          'esborra l\'script o restaura el fitxer: un script mort enganya qui col·labore');
      }
    }
  }
}

/* ═══════════════════════ A3 · Punts d'entrada del paquet ═══════════════════════ */

if (pkg) {
  /** Cerca si alguna configuració de Vite declara `build.lib`. */
  const hiHaLib = fitxers('.', ['.js', '.mjs'])
    .filter((f) => /vite\..*config\.(js|mjs)$/.test(path.basename(f)))
    .some((f) => /\blib\s*:/.test(llegeix(f)));

  const promeses = [
    ['main', pkg.main],
    ['module', pkg.module],
    ...Object.entries(pkg.exports ?? {}).flatMap(([k, v]) => (typeof v === 'object'
      ? Object.entries(v).map(([cond, ruta]) => [`exports["${k}"].${cond}`, ruta])
      : [[`exports["${k}"]`, v]])),
  ].filter(([, v]) => typeof v === 'string');

  for (const [camp, ruta] of promeses) {
    const net = ruta.replace(/^\.\//, '');
    if (fs.existsSync(R(net))) continue;
    if (!hiHaLib) {
      anota('A3', 'package.json',
        `${camp} promet "${ruta}" però cap config de Vite declara build.lib`,
        'qui faça `npm install` i l\'importe rebrà un ERR_MODULE_NOT_FOUND');
    }
  }
}

/* ═══════════════════════ A4 · Les portes arranquen ═══════════════════════ */

/**
 * Una porta que només exporta i mai s'executa passa sempre. És el defecte que
 * `design_guard.mjs` documenta a la seua pròpia capçalera com a lliçó apresa.
 * Es reconeix un punt d'entrada per qualsevol d'aquestes formes:
 *   · crida de nivell superior:  main();  run();  principal();
 *   · guarda d'entrada directa:  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
 *   · eixida explícita:          process.exit(...)  fora d'una funció exportada
 */
// L'AST separa sintaxi executable de comentaris, fixtures i cossos mai cridats.
// No executem cap porta per a descobrir-la: una porta pot tindre efectes laterals.
function programa(text) {
  try { return parse(text, {sourceType: 'unambiguous', plugins: ['jsx'], createImportExpressions: true}).program; }
  catch { return null; }
}
function visita(node, fn) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') fn(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end', 'extra', 'comments', 'tokens', 'errors'].includes(key)) continue;
    if (Array.isArray(value)) for (const child of value) visita(child, fn);
    else if (value && typeof value === 'object') visita(value, fn);
  }
}
const esFuncio = node => /^(?:Function|ArrowFunction|ObjectMethod|ClassMethod|ClassPrivateMethod)/.test(node?.type || '');
function booleaConstant(node) {
  if (!node) return null;
  if (['BooleanLiteral', 'StringLiteral', 'NumericLiteral'].includes(node.type)) return Boolean(node.value);
  if (node.type === 'NullLiteral') return false;
  if (node.type === 'UnaryExpression' && node.operator === '!') { const value = booleaConstant(node.argument); return value === null ? null : !value; }
  if (node.type === 'LogicalExpression') {
    const a = booleaConstant(node.left), b = booleaConstant(node.right);
    if (node.operator === '&&') return a === false || b === false ? false : a === true && b === true ? true : null;
    if (node.operator === '||') return a === true || b === true ? true : a === false && b === false ? false : null;
  }
  return null;
}
function visitaExecutada(node, fn) {
  if (!node || typeof node !== 'object' || esFuncio(node)) return;
  if (node.type === 'IfStatement' && booleaConstant(node.test) !== null) { visitaExecutada(booleaConstant(node.test) ? node.consequent : node.alternate, fn); return; }
  if (typeof node.type === 'string') fn(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end', 'extra', 'comments', 'tokens', 'errors'].includes(key)) continue;
    if (Array.isArray(value)) for (const child of value) visitaExecutada(child, fn);
    else if (value && typeof value === 'object') visitaExecutada(value, fn);
  }
}
function algun(node, predicate) { let found = false; visita(node, n => { found ||= predicate(n); }); return found; }
function membre(node, name) {
  return node?.type === 'MemberExpression' && ((!node.computed && node.property.name === name)
    || node.computed && node.property.value === name);
}
function argvPrimer(node) {
  return node?.type === 'MemberExpression' && node.computed && node.property.value === 1
    && membre(node.object, 'argv') && node.object.object?.name === 'process';
}
function metaUrl(node) { return membre(node, 'url') && node.object?.type === 'MetaProperty' && node.object.meta.name === 'import'; }
function identitatCli(node) {
  return node?.type === 'BinaryExpression' && ['===', '=='].includes(node.operator)
    && ((algun(node.left, argvPrimer) && algun(node.right, metaUrl)) || (algun(node.right, argvPrimer) && algun(node.left, metaUrl)));
}
function cridesDeNode(ast) {
  const bindings = new Set();
  for (const n of ast.body) if (n.type === 'ImportDeclaration' && n.source.value === 'node:test') {
    for (const s of n.specifiers) if (s.type === 'ImportDefaultSpecifier' || ['test', 'it', 'describe'].includes(s.imported?.name)) bindings.add(s.local.name);
  }
  return ast.body.some(n => n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && bindings.has(n.expression.callee.name));
}
function entradaCli(ast) {
  if (!ast) return false;
  const canonical = new Set(), writes = new Map(), aliases = new Set(), guardFunctions = new Set();
  const callable = new Set(ast.body.filter(n => n.type === 'FunctionDeclaration').map(n => n.id?.name));
  for (const n of ast.body) if (n.type === 'VariableDeclaration' && n.kind === 'const') {
    for (const d of n.declarations) if (d.id.type === 'Identifier' && algun(d.init, metaUrl)) aliases.add(d.id.name);
  }
  for (const n of ast.body) if (n.type === 'ImportDeclaration' && /(?:^|\/)lib\/arrel\.mjs$/.test(n.source.value)) {
    for (const s of n.specifiers) if (s.imported?.name === 'esMain') canonical.add(s.local.name);
  }
  const canonicalCall = n => n?.type === 'CallExpression' && canonical.has(n.callee?.name) && n.arguments.length === 1 && metaUrl(n.arguments[0]);
  const identity = n => identitatCli(n) || canonicalCall(n) || n?.type === 'BinaryExpression' && ['===', '=='].includes(n.operator)
    && ((algun(n.left, argvPrimer) && algun(n.right, x => x.type === 'Identifier' && aliases.has(x.name)))
      || (algun(n.right, argvPrimer) && algun(n.left, x => x.type === 'Identifier' && aliases.has(x.name))));
  const remember = (name, expression, at) => { if (!writes.has(name)) writes.set(name, []); writes.get(name).push({expression, at}); };
  visitaExecutada(ast, n => {
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') remember(n.id.name, n.init, n.end);
    if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier') remember(n.left.name, n.operator === '=' ? n.right : null, n.end);
    if (n.type === 'UpdateExpression' && n.argument.type === 'Identifier') remember(n.argument.name, null, n.end);
  });
  function guarda(n, at = n?.start ?? Infinity, seen = new Set()) {
    if (!n || booleaConstant(n) === false) return false;
    if (identity(n)) return true;
    if (n.type === 'LogicalExpression') {
      if (n.operator === '&&') return booleaConstant(n.left) !== false && booleaConstant(n.right) !== false
        && (guarda(n.left, at, seen) || guarda(n.right, at, seen));
      if (n.operator === '||') return [n.left, n.right].filter(x => booleaConstant(x) !== false).every(x => guarda(x, at, seen));
      return false;
    }
    if (n.type === 'UnaryExpression' && n.operator === '!' && n.argument.type === 'UnaryExpression' && n.argument.operator === '!') return guarda(n.argument.argument, at, seen);
    if (n.type === 'CallExpression' && guardFunctions.has(n.callee?.name)) return !(writes.get(n.callee.name) || []).some(w => w.at < at);
    if (n.type === 'Identifier' && !seen.has(n.name)) {
      const previous = (writes.get(n.name) || []).filter(w => w.at < at).at(-1);
      return previous ? guarda(previous.expression, previous.at, new Set([...seen, n.name])) : false;
    }
    return false;
  }
  for (const n of ast.body) if (n.type === 'FunctionDeclaration') {
    let returnsIdentity = false, otherReturn = false;
    visitaExecutada(n.body, x => {
      if (x.type !== 'ReturnStatement' || booleaConstant(x.argument) === false) return;
      const proved = guarda(x.argument, x.start);
      returnsIdentity ||= proved; otherReturn ||= !proved;
    });
    if (returnsIdentity && !otherReturn) guardFunctions.add(n.id.name);
  }
  const activitat = n => {
    let active = false;
    visitaExecutada(n, x => {
      active ||= x.type === 'CallExpression' || x.type === 'AssignmentExpression' && membre(x.left, 'exitCode') && x.left.object?.name === 'process';
    });
    return active;
  };
  function sentencia(n) {
    if (!n || esFuncio(n) || n.type.startsWith('Export')) return false;
    if (n.type === 'IfStatement') {
      if (booleaConstant(n.test) !== null) return sentencia(booleaConstant(n.test) ? n.consequent : n.alternate);
      let exits = false;
      visitaExecutada(n.consequent, x => { exits ||= x.type === 'CallExpression' && membre(x.callee, 'exit') && x.callee.object?.name === 'process'; });
      return guarda(n.test) && activitat(n.consequent) || exits || sentencia(n.alternate);
    }
    if (n.type === 'TryStatement') {
      let invoked = false;
      visitaExecutada(n.block, x => { invoked ||= x.type === 'CallExpression' && (x.callee.object?.name === 'console'
        || membre(x.callee, 'write') && ['stdout', 'stderr'].some(stream => membre(x.callee.object, stream) && x.callee.object.object?.name === 'process')
        || membre(x.callee, 'exit') && x.callee.object?.name === 'process'
        || callable.has(x.callee.name) && !guardFunctions.has(x.callee.name)); });
      return invoked;
    }
    if (n.type === 'BlockStatement') return n.body.some(sentencia);
    if (n.type !== 'ExpressionStatement') return false;
    const e = n.expression.type === 'AwaitExpression' ? n.expression.argument : n.expression;
    if (e.type !== 'CallExpression') return false;
    return (['main', 'run', 'principal', 'arrenca'].includes(e.callee.name) || callable.has(e.callee.name))
      || membre(e.callee, 'exit') && e.callee.object?.name === 'process';
  }
  return ast.body.some(sentencia);
}

// Cada rol no-CLI té consumidor i API verificables. Cap directori s'exclou.
const BIBLIOTEQUES_A4 = new Map([
  ['tooling/gates/mutation-policy.mjs', {consumer: 'tooling/gates/hooks-local.mjs', exports: ['mutationPath', 'knownRead']}],
  ['tooling/gates/zero-ia-endpoints.mjs', {consumer: 'tooling/gates/tractor-zero-dependencia-ia.mjs', exports: ['classificaEndpoint']}],
  ['tooling/gates/lib/cataleg-unanimitat.mjs', {consumer: 'tooling/gates/verifica-alergens-unanimitat.mjs', exports: ['CATALEG_UNANIMITAT', 'FONTS_CATALEG_UNANIMITAT']}],
  ['tooling/gates/lib/r3254-migracio132.mjs', {consumer: 'tooling/gates/prepara-migracio132-r3254.mjs', exports: ['preparaMigracio132']}],
  ['tooling/gates/lib/radiografia-local.mjs', {consumer: 'tooling/gates/verifica-radiografia-supabase-viu.mjs', exports: ['auditLocal']}],
  ['tooling/gates/lib/radiografia-snapshot.mjs', {consumer: 'tooling/gates/verifica-radiografia-supabase-viu.mjs', exports: ['readSnapshot', 'compareSnapshots', 'projectSnapshot', 'sha256']}],
  ['tooling/gates/fixtures/zero-ia.vitest.config.mjs', {consumer: 'tooling/gates/tractor-zero-dependencia-ia.test.mjs', role: 'config'}],
  ['tooling/gates/fixtures/zero-ia-outage.mjs', {consumer: 'tooling/gates/tractor-zero-dependencia-ia.test.mjs', role: 'preload'}],
  // v1.2.25 · K-ARREL-PROMESA · C4/C14: la reconciliació 132/135 no té CLI; la consumix la prova PGlite que la valida.
  ['tooling/gates/lib/v1225-reconciliacio132135.mjs', {consumer: 'tests/v1225-sql-reconciliacio-pglite.test.mjs', exports: ['contracteSonda132', 'avaluaSonda132135', 'preparaReconciliacio132135']}],
  // v1.2.25 · K-ARREL-PROMESA · C10: la biblioteca del rebut FN-009; el productor lent és el seu consumidor CLI.
  ['tooling/gates/lib/fn009-wp-build.mjs', {consumer: 'tooling/gates/compila-fn009-wp.mjs', exports: ['createContext', 'captureSnapshot', 'validateReceipt', 'invalidResult', 'exitCode']}],
]);
function exportsDeclarats(ast) {
  const names = new Set();
  for (const n of ast.body) if (n.type === 'ExportNamedDeclaration') {
    if (n.declaration?.id?.name) names.add(n.declaration.id.name);
    for (const d of n.declaration?.declarations || []) if (d.id.type === 'Identifier') names.add(d.id.name);
    for (const s of n.specifiers || []) names.add(s.exported.name || s.exported.value);
  }
  return names;
}
function referenciaImport(ast, from, target) {
  let found = false;
  visita(ast, n => {
    const source = n.type === 'ImportDeclaration' || n.type === 'ImportExpression' ? n.source : n.type === 'CallExpression' && n.callee.type === 'Import' ? n.arguments[0] : null;
    if (source?.type === 'StringLiteral' && source.value.startsWith('.') && path.posix.normalize(path.posix.join(path.posix.dirname(from), source.value)) === target) found = true;
  });
  return found;
}
function bibliotecaDeclarada(file, ast) {
  const d = BIBLIOTEQUES_A4.get(file);
  if (!d || !ast) return false;
  const consumer = programa(llegeix(R(d.consumer)));
  if (!consumer) return false;
  if (d.role === 'config') {
    const config = ast.body.some(n => n.type === 'ExportDefaultDeclaration' && n.declaration.type === 'CallExpression' && n.declaration.callee.name === 'defineConfig');
    return config && algun(consumer, n => n.type === 'ArrayExpression' && n.elements.some((x, i) => x?.value === '--config' && n.elements[i + 1]?.value === file));
  }
  if (d.role === 'preload') {
    let consumed = false;
    visita(consumer, n => {
      if (n.type !== 'TemplateLiteral' || n.expressions.length) return;
      const embedded = programa(n.quasis.map(q => q.value.cooked).join(''));
      consumed ||= embedded !== null && referenciaImport(embedded, 'fixture.mjs', file);
    });
    return consumed && ast.body.some(n => n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.name === 'syncBuiltinESMExports');
  }
  const names = exportsDeclarats(ast);
  return d.exports.every(name => names.has(name)) && referenciaImport(consumer, d.consumer, file);
}
for (const abs of fitxers(CAMINS.portes)) {
  const r = rel(abs), text = llegeix(abs);
  const ast = programa(text);
  const invocat = Object.values(pkg?.scripts || {}).some(command => String(command).includes(r));
  if (/\.test\.(?:mjs|cjs|js)$/.test(r) && !invocat) continue;
  if (!ast) { anota('A4', r, 'sintaxi JavaScript no analitzable', 'corregix la sintaxi; no s’acredita cap entrada'); continue; }
  const library = BIBLIOTEQUES_A4.has(r);
  const valid = library ? !invocat && bibliotecaDeclarada(r, ast) : entradaCli(ast) || /\.test\.(?:mjs|cjs|js)$/.test(r) && cridesDeNode(ast);
  if (!valid) anota('A4', r, library ? 'rol no-CLI sense consumidor/API acreditats, o invocat com a CLI' : 'no té punt d’entrada CLI executable acreditat',
    'declara el consumidor real o una guarda d’identitat amb execució; un literal o una funció sense crida no són entrada');
}

/* ═══════════════════════ A5 · Configuracions citades existents ═══════════════════════ */

/**
 * Camins de configuració construïts dins del tooling que han d'existir al disc.
 * Es limita a literals amb extensió de configuració per no perseguir prosa.
 */
const RE_CONFIG = /['"`]((?:\.[a-z-]+|[a-z_][a-z0-9_-]*)(?:\/[A-Za-z0-9_.-]+)*\.(?:json|txt|lock|yaml|yml))['"`]/g;
const SALTA_A5 = /node_modules|package\.json|tsconfig|\$\{|\.\.\//;

/** Artefactes que els builds generen: no han d'existir al repositori net. */
const GENERAT_A5 = /(^|\/)(dist|build|coverage|\.sdp-[a-z]+)\//;
// Marca transaccional creada per executor-mutacio: absència és l'estat saludable.
const ESTAT_TRANSITORI_A5 = new Set(['.agents/runtime/mutation.pending.json', '.agents/runtime/guarda_nocturna.json']);

/**
 * Lleva comentaris abans de buscar literals. Sense això, una porta que
 * DOCUMENTA una ruta trencada (com fa aquesta mateixa) s'autodenuncia.
 */
function senseComentaris(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
}

for (const abs of [...fitxers(CAMINS.portes), ...fitxers(CAMINS.cervell), ...fitxers('tooling/lib')]) {
  const r = rel(abs);
  const text = senseComentaris(llegeix(abs));

  // Primera passada: recollir tots els literals i saber quins resolen.
  const citats = [];
  const vistos = new Set();
  for (const m of text.matchAll(RE_CONFIG)) {
    const cami = m[1];
    if (vistos.has(cami) || SALTA_A5.test(cami) || GENERAT_A5.test(cami) || ESTAT_TRANSITORI_A5.has(cami)
      || r === 'tooling/gates/frontissa-contingut.mjs' && cami === '.agents/' + 'TORN_ACTIU.json') continue;
    vistos.add(cami);
    if (!cami.includes('/')) continue;
    if (/deute|baseline|lock|manifest|index|snapshot/i.test(path.basename(cami))) continue;
    citats.push({ cami, existix: fs.existsSync(R(cami)), base: path.basename(cami) });
  }

  // Una cadena de candidats («busca ací, si no ací») és legítima mentre almenys
  // un dels emplaçaments resolga. Sense aquesta regla, un fallback correcte
  // quedaria marcat com a ruta morta.
  const resolts = new Set(citats.filter((c) => c.existix).map((c) => c.base));

  for (const c of citats) {
    if (c.existix || resolts.has(c.base)) continue;
    const alternatives = [];
    (function busca(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (EXCLOSOS.has(e.name)) continue;
        const x = path.join(d, e.name);
        if (e.isDirectory()) busca(x);
        else if (e.name === c.base) alternatives.push(rel(x));
      }
    }(arrelSegura()));
    anota('A5', r, `cita ${c.cami}, que no existix`,
      alternatives.length ? `potser volies: ${alternatives.slice(0, 3).join(' | ')}` : 'crea el fitxer o lleva la referència');
  }
}

/* ═══════════════════════ Informe ═══════════════════════ */

const LLEIS = {
  A1: 'Monopoli del descobriment d\'arrel',
  A2: 'Scripts de package.json vius',
  A3: 'Punts d\'entrada del paquet reals',
  A4: 'Les portes arranquen de veres',
  A5: 'Configuracions citades existents',
};

function informe() {
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: infraccions.length === 0, arrel: arrelSegura(), infraccions }, null, 2));
    return infraccions.length ? 1 : 0;
  }

  console.log('\n🚜 TRACTOR D\'ARREL — la porta que vigila les portes');
  console.log(`   Arrel: ${arrelSegura()}`);
  console.log('─'.repeat(72));

  for (const [codi, nom] of Object.entries(LLEIS)) {
    const meues = infraccions.filter((i) => i.llei === codi);
    if (!meues.length) { console.log(`  ✅ ${codi} · ${nom}`); continue; }
    console.log(`  ❌ ${codi} · ${nom}  (${meues.length})`);
    const perFitxer = new Map();
    for (const i of meues) {
      if (!perFitxer.has(i.fitxer)) perFitxer.set(i.fitxer, []);
      perFitxer.get(i.fitxer).push(i);
    }
    for (const [f, llista] of [...perFitxer].sort()) {
      console.log(`       ${f}`);
      for (const i of llista.slice(0, 4)) {
        console.log(`         · ${i.detall}`);
        if (i.pista) console.log(`           ↳ ${i.pista}`);
      }
      if (llista.length > 4) console.log(`         · … i ${llista.length - 4} més`);
    }
  }

  console.log('─'.repeat(72));
  if (infraccions.length) {
    console.error(`\n❌ ${infraccions.length} infracció(ns). Una porta que no arranca és pitjor que cap porta:\n`
      + '   dona un ✅ que ningú s\'ha guanyat.\n');
    return 1;
  }
  console.log('\n✅ Cap ruta morta. Les portes arranquen i vigilen el que diuen.\n');
  return 0;
}

try {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); process.exit(2); }
  process.exit(informe());
} catch (err) {
  if (err instanceof ErrorArrel) { console.error(err.informe()); process.exit(2); }
  console.error(`\n❌ [TRACTOR-ARREL] Error inesperat: ${err.message}\n`);
  process.exit(2);
}
