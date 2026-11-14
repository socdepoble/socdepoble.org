/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · La taula de rutes del Router,
 * llegida del CODI (AST amb @babel/parser, que ja és dependència), mai d'una
 * llista escrita a mà. La criden el productor del manifest social (les famílies
 * de la fitxa pública i els àlies de redirecció) i la Porta de cobertura social
 * (cobertura-router.mjs): una sola lectura del Router per a tots dos. Només llig.
 *
 * Què és una ruta: la semàntica de src/app/contexts/RouterContext.jsx · Routes,
 * no el nom de l'etiqueta. Tot fill JSX d'un <Routes> amb `path` o `index` és
 * una ruta; guanya el primer fill que casa; un `path` sense «*» casa exacte i
 * distingix majúscules; «:param» és un segment; «/*» al final, qualsevol sufix.
 *
 * Fail-closed: tot el que no es reconeix és una INFRACCIÓ (la Porta la fa
 * roja), mai un silenci:
 *   · un fitxer nou amb <Routes> (el conjunt és FITXERS_AMB_ROUTES);
 *   · un fill que no és un element amb path o index, un fragment, una variable
 *     o una crida fora de les formes conegudes, un atribut escampat ({...x});
 *   · un path que no es pot resoldre.
 * Formes de path conegudes: un literal; IDENT.slice(1); la variable d'un .map
 * sobre Object.entries(IDENT) o Object.values(IDENT), amb IDENT exportat per
 * src/config/navigation.js; un condicional de build amb una ruta o null; i,
 * només a RutaApps.jsx, la plantilla `${manifest.id}/*`, que s'expandix amb
 * els manifests de src/apps/<app>/manifest.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

/** Els fitxers de src/ que munten <Routes>, amb el seu tractament. Un de nou és porta roja. */
export const FITXERS_AMB_ROUTES = Object.freeze({
  'src/app/App.jsx': Object.freeze({arrel: true}),
  'src/apps/plataforma/RutaApps.jsx': Object.freeze({arrel: false, plantillaDApps: true})
});
const NAVEGACIO = 'src/config/navigation.js';
const USE_SEO = 'src/hooks/useSEO.js';
const DETALL = 'src/sections/detail/detailSectionMeta.jsx';
const DETALL_ITEM = 'src/sections/detail/ItemDetailSection.jsx';
const APPS = 'src/apps';
const NO_SON_CODI = /(?:\.test\.[cm]?jsx?|\.spec\.[cm]?jsx?)$|(?:^|\/)__(?:fixtures|tests|mocks)__\//;
/* Revisió adversària R22 · El mòdul que definix Routes (l'especificador d'un import) i, en el text, un import o un
   export que el pren sencer. */
const MODUL_DEL_ROUTER = /(?:^|\/)RouterContext(?:\.jsx?)?$/;
const MODUL_DEL_ROUTER_SENCER = /(?:\*\s*as\s+[\w$]+|export\s*\*)\s+from\s*['"][^'"]*RouterContext(?:\.jsx?)?['"]/;
/** Revisió adversària R22 · Els fitxers que poden passar Routes com a valor, amb el motiu. Un de nou és porta roja. */
export const FACANES_DEL_ROUTER = Object.freeze({
  'src/apps/plataforma/nucliModuls.js': 'la façana del nucli (NUCLI.router) per a les apps enxufables: munten sota /app/<id>/*, que és plataforma'
});
const GUARDA_DE_SESSIO = 'RequireAuth';
const FITXA_PUBLICA = 'PerfilPublicSection';
const DETALL_GENERIC = 'ItemDetailSection';

const nomJSX = n => (n?.type === 'JSXIdentifier' ? n.name : n?.type === 'JSXMemberExpression' ? `${nomJSX(n.object)}.${nomJSX(n.property)}` : null);
const atribut = (element, nom) => element.openingElement.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === nom) || null;
const expressioDe = a => (a?.value?.type === 'JSXExpressionContainer' ? a.value.expression : a?.value ?? null);
const literalDe = n => (n?.type === 'StringLiteral' ? n.value
  : n?.type === 'TemplateLiteral' && !n.expressions.length ? n.quasis.map(q => q.value.cooked).join('') : null);

function camina(node, visita, pares = []) {
  if (!node || typeof node.type !== 'string') return;
  visita(node, pares);
  const seguents = [...pares, node];
  for (const clau of Object.keys(node)) {
    if (clau === 'loc' || clau === 'leadingComments' || clau === 'trailingComments' || clau === 'innerComments') continue;
    const valor = node[clau];
    if (Array.isArray(valor)) for (const fill of valor) camina(fill, visita, seguents);
    else if (valor && typeof valor.type === 'string') camina(valor, visita, seguents);
  }
}

/* El nom de la funció (o de la constant) que conté un node. */
function funcioContenidora(pares) {
  for (let i = pares.length - 1; i >= 0; i -= 1) {
    const p = pares[i];
    if (p.type === 'FunctionDeclaration' && p.id) return p.id.name;
    if ((p.type === 'ArrowFunctionExpression' || p.type === 'FunctionExpression') && pares[i - 1]?.type === 'VariableDeclarator'
      && pares[i - 1].id.type === 'Identifier') return pares[i - 1].id.name;
  }
  return null;
}

/* Tots els fitxers de codi de src/ (ni proves ni fixtures), amb el camí relatiu a l'arrel. */
function fitxersDeCodi(root, rel = 'src', eixida = []) {
  for (const entrada of fs.readdirSync(path.join(root, rel), {withFileTypes: true}).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const cami = `${rel}/${entrada.name}`;
    if (entrada.isSymbolicLink()) continue;
    if (entrada.isDirectory()) { if (!NO_SON_CODI.test(`${cami}/`)) fitxersDeCodi(root, cami, eixida); continue; }
    if (entrada.isFile() && /\.[cm]?jsx?$/.test(entrada.name) && !NO_SON_CODI.test(cami)) eixida.push(cami);
  }
  return eixida;
}

/** L'expressió regular d'un patró del Router (RouterContext.jsx · pathToRegex). */
export function patroARegex(patro) {
  if (patro === '*') return /^(.*)$/;
  const exacte = !patro.includes('*');
  let text = patro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:([a-zA-Z0-9_]+)/g, '([^\\/]+)');
  text = text.endsWith('/\\*') ? text.replace(/\/\\\*$/, '(?:\\/(.*))?') : text.replace(/\\\*/g, '(.*)');
  return new RegExp(exacte ? `^${text}$` : `^${text}(?=\\/|$)`);
}

/* RouterContext.jsx · resolvePath: un path relatiu es resol sobre el prefix del pare. */
function resolPath(base, cami) {
  if (cami === '/' || cami === '') return base === '' ? '/' : base;
  if (cami.startsWith('/')) return cami;
  if (base === '/' || base === '') return `/${cami}`;
  return `${base}/${cami}`;
}
/* El prefix que una ruta dona als <Routes> del seu element (RouterContext.jsx). */
function prefixDe(patro) {
  let prefix = patro.replace(/\*$/, '');
  if (prefix.endsWith('/') && prefix.length > 1) prefix = prefix.slice(0, -1);
  return prefix;
}

/**
 * La lectura del Router. Torna:
 *   { rutes, infraccions, families, fitxers, redireccions, seccionsDeDetall, apps, privades }
 * Cada ruta: { patro, fitxer, funcio, component, props, guarda, rol, condicional,
 *   redireccio: null | { desti: string|null }, contenidor, comodi, ordre }.
 * `moduls.navegacio` (opcional) és el mòdul navigation.js ja carregat.
 */
export async function extrauRutes({root, policyRoot = root, moduls = {}} = {}) {
  if (!root) throw new Error('root és obligatori.');
  root = fs.realpathSync(root);
  const {parse} = createRequire(path.join(policyRoot, 'package.json'))('@babel/parser');
  const ast = rel => parse(fs.readFileSync(path.join(root, rel), 'utf8'), {sourceType: 'module', plugins: ['jsx']});
  const hiEs = rel => { try { return fs.statSync(path.join(root, rel)).isFile(); } catch { return false; } };
  const infraccions = [];
  const infraccio = (llei, detall) => infraccions.push({llei, detall});
  const navegacio = moduls.navegacio || await import(pathToFileURL(path.join(policyRoot, NAVEGACIO)).href);

  /* 1 · Els fitxers amb <Routes> de veres (un element JSX, no un comentari). */
  const fitxers = [];
  const arbres = new Map();
  for (const rel of fitxersDeCodi(root)) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    /* Revisió adversària R22 (14-11-2026) · Es llig per AST tot fitxer que nomena Routes o que pren el mòdul del
       Router sencer (import * as X, export *): abans, només els que portaven «<Routes» o l'import en una línia. */
    if (!/\bRoutes\b/.test(text) && !MODUL_DEL_ROUTER_SENCER.test(text)) continue;
    let programa;
    try { programa = ast(rel); } catch (error) { infraccio('S4', `${rel}: no s'ha pogut analitzar (${error.message})`); continue; }
    let teRoutes = false;
    /* El component Routes amb un altre nom (import { Routes as R }) muntaria rutes que este lector no veu. */
    const alies = [];
    /* Revisió adversària R22 · I tampoc les veuria per altres camins: const R = Routes, createElement(Routes, …),
       <RC.Routes> d'un import * as RC, un barril que el reexporta (export { Routes as X }, export * from …RouterContext).
       Només val <Routes> escrit com a element JSX amb el nom importat tal qual. */
    const amagades = [];
    const locals = new Set();
    camina(programa, (n, pares) => {
      if (n.type === 'JSXElement' && nomJSX(n.openingElement.name) === 'Routes') teRoutes = true;
      if (n.type === 'ImportSpecifier' && (n.imported?.name ?? n.imported?.value) === 'Routes') {
        locals.add(n.local.name);
        if (n.local.name !== 'Routes') alies.push(n.local.name);
      }
      if (n.type === 'ImportNamespaceSpecifier' && MODUL_DEL_ROUTER.test(pares.at(-1)?.source?.value || '')) amagades.push(`importa el mòdul del Router sencer («${n.local.name}»)`);
      if (n.type === 'ExportAllDeclaration' && MODUL_DEL_ROUTER.test(n.source?.value || '')) amagades.push('reexporta el mòdul del Router sencer (export *)');
      if (n.type === 'ExportSpecifier' && (n.local?.name ?? n.local?.value) === 'Routes') amagades.push('reexporta Routes');
      if (['MemberExpression', 'OptionalMemberExpression', 'JSXMemberExpression'].includes(n.type) && !n.computed && n.property?.name === 'Routes') {
        amagades.push(`fa servir «.Routes» (línia ${n.loc?.start.line ?? '?'})`);
      }
    });
    if (locals.size && !Object.hasOwn(FACANES_DEL_ROUTER, rel)) {
      camina(programa, (n, pares) => {
        if (n.type !== 'Identifier' || !locals.has(n.name)) return;
        const pare = pares.at(-1);
        if (pare?.type === 'ImportSpecifier' || pare?.type === 'ExportSpecifier') return;
        if (['MemberExpression', 'OptionalMemberExpression'].includes(pare?.type) && pare.property === n && !pare.computed) return;
        if (['ObjectProperty', 'ObjectMethod', 'ClassProperty', 'ClassMethod'].includes(pare?.type) && pare.key === n && !pare.computed && !pare.shorthand) return;
        amagades.push(`fa servir Routes com a valor, fora d'un element JSX (línia ${n.loc?.start.line ?? '?'})`);
      });
    }
    for (const nom of alies) infraccio('S4', `${rel}: importa Routes amb un altre nom («${nom}»); el lector del Router no en veuria les rutes`);
    for (const motiu of new Set(amagades)) infraccio('S4', `${rel}: ${motiu}; el lector del Router no en veuria les rutes`);
    if (!teRoutes) continue;
    fitxers.push(rel);
    arbres.set(rel, programa);
    if (!Object.hasOwn(FITXERS_AMB_ROUTES, rel)) infraccio('S4', `${rel}: un fitxer nou amb <Routes>; declareu-lo a FITXERS_AMB_ROUTES amb el seu tractament`);
  }

  /* 2 · Els manifests de les apps (id i permisos.veure), per AST. */
  const apps = [];
  const dirApps = path.join(root, APPS);
  if (fs.existsSync(dirApps)) {
    for (const entrada of fs.readdirSync(dirApps, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = `${APPS}/${entrada.name}/manifest.js`;
      if (!entrada.isDirectory() || !hiEs(rel)) continue;
      let id = null;
      const veure = new Set();
      camina(ast(rel), (n, pares) => {
        if (n.type !== 'ObjectProperty' || n.computed) return;
        const clau = n.key.type === 'Identifier' ? n.key.name : n.key.value;
        const avi = pares.at(-2);
        if (clau === 'id' && avi?.type === 'ExportDefaultDeclaration' && literalDe(n.value) !== null) id = literalDe(n.value);
        if (clau === 'veure') veure.add(literalDe(n.value) ?? '(no literal)');
      });
      if (!id || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) { infraccio('S4', `${rel}: manifest d'app sense id literal`); continue; }
      if (veure.size !== 1 || veure.has('(no literal)')) infraccio('S4', `${rel}: permisos.veure no és un sol literal`);
      apps.push({id, veure: veure.size === 1 ? [...veure][0] : null, fitxer: rel});
    }
  }

  /* 3 · Els components de redirecció de cada fitxer: funcions que només tornen <Navigate>. */
  const redireccions = new Map(); // `${fitxer}#${nom}` → expressió del `to`
  for (const [rel, programa] of arbres) {
    for (const node of programa.program.body) {
      const decl = node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration' ? node.declaration : node;
      if (decl?.type !== 'FunctionDeclaration' || !decl.id) continue;
      const retorns = [];
      camina(decl.body, (n, pares) => {
        if (n.type === 'ReturnStatement' && !pares.some(p => /Function/.test(p.type))) retorns.push(n.argument);
      });
      const jsx = retorns.map(r => (r?.type === 'ParenthesizedExpression' ? r.expression : r));
      if (!jsx.length || !jsx.every(r => r?.type === 'JSXElement' && nomJSX(r.openingElement.name) === 'Navigate')) continue;
      redireccions.set(`${rel}#${decl.id.name}`, jsx.map(r => expressioDe(atribut(r, 'to'))));
    }
  }

  /* El destí estàtic d'una expressió `to`: un camí sense consulta, o null si és dinàmic. */
  function destiEstatic(expr, props = {}) {
    if (!expr) return null;
    const net = text => (typeof text === 'string' && text.startsWith('/') ? text.split(/[?#]/)[0] : (typeof text === 'string' && text.startsWith('../') ? text : null));
    const literal = literalDe(expr);
    if (literal !== null) return net(literal);
    if (expr.type === 'Identifier') {
      if (Object.hasOwn(props, expr.name)) return net(props[expr.name]);
      return typeof navegacio[expr.name] === 'string' ? net(navegacio[expr.name]) : null;
    }
    if (expr.type === 'ConditionalExpression') {
      const [a, b] = [destiEstatic(expr.consequent, props), destiEstatic(expr.alternate, props)];
      return a !== null && a === b ? a : null;
    }
    if (expr.type === 'TemplateLiteral') {
      /* Un prefix literal o un identificador resoluble, seguit només de consulta o fragment. */
      let text = '';
      for (let i = 0; i < expr.quasis.length; i += 1) {
        const tros = expr.quasis[i].value.cooked;
        text += tros;
        if (/[?#]/.test(text)) return net(text);
        const dins = expr.expressions[i];
        if (!dins) break;
        const valor = destiEstatic(dins, props);
        if (valor === null) {
          /* Una expressió que només afig consulta o fragment (`${to}${search ? … : ''}`): es para ací. */
          return text.startsWith('/') && i > 0 ? net(text) : null;
        }
        text += valor;
      }
      return net(text);
    }
    return null;
  }

  /* 4 · Els blocs <Routes> i els seus fills. */
  const blocs = [];
  for (const [rel, programa] of arbres) {
    let exportPerDefecte = null;
    for (const node of programa.program.body) {
      if (node.type === 'ExportDefaultDeclaration') exportPerDefecte = node.declaration.id?.name || (node.declaration.type === 'Identifier' ? node.declaration.name : null);
    }
    camina(programa, (n, pares) => {
      if (n.type !== 'JSXElement' || nomJSX(n.openingElement.name) !== 'Routes') return;
      blocs.push({fitxer: rel, funcio: funcioContenidora(pares), exportPerDefecte, node: n, rutes: []});
    });
  }

  function rutaDe(bloc, element, {condicional = false, entorn = {}} = {}) {
    const on = `${bloc.fitxer}${element.loc ? `:${element.loc.start.line}` : ''}`;
    if (element.openingElement.attributes.some(a => a.type === 'JSXSpreadAttribute')) { infraccio('S4', `${on}: una ruta amb un atribut escampat ({...x})`); return; }
    const aPath = atribut(element, 'path'), aIndex = atribut(element, 'index');
    if (!aPath && !aIndex) { infraccio('S4', `${on}: un fill de <Routes> sense path ni index`); return; }
    let camins = [];
    if (aPath) {
      const expr = expressioDe(aPath);
      const literal = literalDe(expr);
      if (literal !== null) camins = [literal];
      else if (expr?.type === 'Identifier' && Object.hasOwn(entorn, expr.name) && typeof entorn[expr.name] === 'string') camins = [entorn[expr.name]];
      else if (expr?.type === 'CallExpression' && expr.callee.type === 'MemberExpression' && expr.callee.property.name === 'slice'
        && expr.arguments.length === 1 && expr.arguments[0].type === 'NumericLiteral' && expr.callee.object.type === 'Identifier') {
        const nom = expr.callee.object.name;
        const valor = Object.hasOwn(entorn, nom) ? entorn[nom] : navegacio[nom];
        if (typeof valor === 'string') camins = [valor.slice(expr.arguments[0].value)];
      } else if (FITXERS_AMB_ROUTES[bloc.fitxer]?.plantillaDApps && expr?.type === 'TemplateLiteral' && expr.expressions.length === 1
        && expr.expressions[0].type === 'MemberExpression' && expr.expressions[0].property.name === 'id'
        && expr.quasis[0].value.cooked === '' && expr.quasis[1].value.cooked === '/*') {
        camins = apps.map(app => `${app.id}/*`);
        if (!camins.length) infraccio('S4', `${on}: la plantilla d'apps no té cap manifest per a expandir-se`);
      }
      if (!camins.length) { infraccio('S4', `${on}: path no resoluble`); return; }
    } else camins = [''];
    const elementExpr = expressioDe(atribut(element, 'element'));
    let dins = elementExpr?.type === 'JSXElement' ? elementExpr : null;
    let guarda = false, rol = null;
    if (dins && nomJSX(dins.openingElement.name) === GUARDA_DE_SESSIO) {
      guarda = true;
      rol = literalDe(expressioDe(atribut(dins, 'rol')));
      dins = dins.children.find(fill => fill.type === 'JSXElement') || null;
    }
    const component = dins ? nomJSX(dins.openingElement.name) : null;
    const props = {};
    if (dins) for (const a of dins.openingElement.attributes) {
      if (a.type !== 'JSXAttribute') continue;
      const expr = expressioDe(a);
      const literal = literalDe(expr);
      if (literal !== null) props[a.name.name] = literal;
      else if (expr?.type === 'Identifier' && Object.hasOwn(entorn, expr.name)) props[a.name.name] = entorn[expr.name];
    }
    let redireccio = null;
    if (component === 'Navigate') redireccio = {desti: destiEstatic(expressioDe(atribut(dins, 'to')), {})};
    else if (component && redireccions.has(`${bloc.fitxer}#${component}`)) {
      const destins = redireccions.get(`${bloc.fitxer}#${component}`).map(expr => destiEstatic(expr, props));
      redireccio = {desti: destins.every(d => d !== null && d === destins[0]) ? destins[0] : null};
    }
    for (const cami of camins) bloc.rutes.push({cami, component, props, guarda, rol, condicional, redireccio, index: !aPath});
  }

  for (const bloc of blocs) {
    for (const fill of bloc.node.children) {
      const on = `${bloc.fitxer}${fill.loc ? `:${fill.loc.start.line}` : ''}`;
      if (fill.type === 'JSXText') { if (fill.value.trim()) infraccio('S4', `${on}: text solt dins de <Routes>`); continue; }
      if (fill.type === 'JSXElement') { rutaDe(bloc, fill); continue; }
      if (fill.type === 'JSXFragment') { infraccio('S4', `${on}: un fragment com a fill de <Routes> (el Router no en veu les rutes)`); continue; }
      if (fill.type !== 'JSXExpressionContainer') { infraccio('S4', `${on}: fill de <Routes> desconegut (${fill.type})`); continue; }
      const expr = fill.expression;
      if (expr.type === 'JSXEmptyExpression') continue;
      if (expr.type === 'ConditionalExpression') {
        const [si, no] = [expr.consequent, expr.alternate];
        const ruta = si.type === 'JSXElement' && no.type === 'NullLiteral' ? si : no.type === 'JSXElement' && si.type === 'NullLiteral' ? no : null;
        if (ruta) { rutaDe(bloc, ruta, {condicional: true}); continue; }
      }
      /* Object.entries(IDENT).map(([clau, valor]) => <Route …/>) o Object.values(IDENT).map(valor => <Route …/>). */
      if (expr.type === 'CallExpression' && expr.callee.type === 'MemberExpression' && expr.callee.property.name === 'map'
        && expr.arguments.length === 1 && expr.arguments[0].type === 'ArrowFunctionExpression') {
        const font = expr.callee.object;
        const metode = font.type === 'CallExpression' && font.callee.type === 'MemberExpression' && font.callee.object.name === 'Object' ? font.callee.property.name : null;
        const taula = metode && font.arguments.length === 1 && font.arguments[0].type === 'Identifier' ? navegacio[font.arguments[0].name] : null;
        const fletxa = expr.arguments[0];
        const cos = fletxa.body.type === 'ParenthesizedExpression' ? fletxa.body.expression : fletxa.body;
        const [param] = fletxa.params;
        if (taula && typeof taula === 'object' && cos.type === 'JSXElement' && ['entries', 'values'].includes(metode) && fletxa.params.length === 1) {
          const files = metode === 'entries' ? Object.entries(taula) : Object.values(taula);
          let lligat = true;
          for (const fila of files) {
            const entorn = {};
            if (metode === 'entries' && param.type === 'ArrayPattern' && param.elements.every(e => e?.type === 'Identifier')) {
              param.elements.forEach((e, i) => { entorn[e.name] = fila[i]; });
            } else if (metode === 'values' && param.type === 'Identifier') entorn[param.name] = fila;
            else { lligat = false; break; }
            rutaDe(bloc, cos, {entorn});
          }
          if (lligat) continue;
        }
      }
      infraccio('S4', `${on}: fill de <Routes> fora de les formes conegudes (${expr.type})`);
    }
  }

  /* 5 · Prefixos: cada bloc es resol sobre la ruta que el munta (el component
     del seu element és la funció del bloc o, des d'un altre fitxer, la seua
     exportació per defecte). El bloc arrel és el d'App.jsx que ningú munta. */
  const rutesDe = new Map(); // bloc → rutes absolutes
  const pendents = new Set(blocs);
  const muntadorDe = bloc => {
    for (const [altre, llista] of rutesDe) {
      const nom = altre.fitxer === bloc.fitxer ? bloc.funcio : bloc.exportPerDefecte;
      const ruta = nom ? llista.find(r => r.component === nom) : null;
      if (ruta) return ruta;
    }
    return null;
  };
  for (let volta = 0; pendents.size && volta < blocs.length + 2; volta += 1) {
    for (const bloc of [...pendents]) {
      const esArrel = FITXERS_AMB_ROUTES[bloc.fitxer]?.arrel === true
        && !blocs.some(altre => altre.fitxer === bloc.fitxer && altre.rutes.some(r => r.component === bloc.funcio));
      const muntador = esArrel ? null : muntadorDe(bloc);
      if (!esArrel && !muntador) continue;
      const prefix = esArrel ? '' : prefixDe(muntador.patro);
      rutesDe.set(bloc, bloc.rutes.map(r => {
        const patro = r.index ? (prefix || '/') : resolPath(prefix, r.cami);
        /* Un destí relatiu («../wikidepoble») es resol sobre l'adreça de la ruta, com fa el navegador. */
        const desti = r.redireccio?.desti;
        const redireccio = typeof desti === 'string' && desti.startsWith('../') && !/[:*]/.test(patro)
          ? {desti: new URL(desti, `https://router.invalid${patro}/`).pathname} : r.redireccio && desti?.startsWith('../') ? {desti: null} : r.redireccio;
        return {...r, redireccio, patro, fitxer: bloc.fitxer, funcio: bloc.funcio};
      }));
      bloc.muntador = muntador;
      pendents.delete(bloc);
    }
  }
  for (const bloc of pendents) infraccio('S4', `${bloc.fitxer}: un <Routes> (${bloc.funcio || 'sense funció'}) que cap ruta munta`);
  const rutes = [];
  for (const bloc of blocs) for (const r of rutesDe.get(bloc) || []) { r.ordre = rutes.length + 1; rutes.push(r); }
  for (const bloc of blocs) {
    const llista = rutesDe.get(bloc) || [];
    for (const r of llista) r.muntador = bloc.muntador ? bloc.muntador.ordre : 0;
    if (bloc.muntador) {
      bloc.muntador.contenidor = true;
      /* Un contenidor és pur si el seu bloc té un comodí final: tot camí que hi casa el resol un fill. */
      bloc.muntador.contenidorPur = (bloc.muntador.contenidorPur ?? true) && llista.some(f => f.cami === '*');
    }
  }
  for (const r of rutes) {
    r.comodi = r.cami === '*';
    r.contenidor = r.contenidor === true;
    r.contenidorPur = r.contenidor && r.contenidorPur === true;
    delete r.cami; delete r.index;
  }

  /* 6 · Les seccions del detall genèric (/:sectionId/:itemId): les claus de buildDetailSectionMeta i la de les receptes. */
  const seccionsDeDetall = [];
  if (hiEs(DETALL)) {
    camina(ast(DETALL), n => {
      if (n.type !== 'FunctionDeclaration' || n.id?.name !== 'buildDetailSectionMeta') return;
      const retorn = n.body.body.find(s => s.type === 'ReturnStatement')?.argument;
      if (retorn?.type !== 'ObjectExpression' || retorn.properties.some(p => p.type !== 'ObjectProperty' || p.computed)) {
        infraccio('S4', `${DETALL}: buildDetailSectionMeta no torna un objecte de claus literals`);
        return;
      }
      for (const p of retorn.properties) seccionsDeDetall.push(p.key.type === 'Identifier' ? p.key.name : p.key.value);
    });
  }
  if (hiEs(DETALL_ITEM)) {
    camina(ast(DETALL_ITEM), n => {
      if (n.type === 'VariableDeclarator' && n.id.name === 'SECCIO_DE_RECEPTES' && literalDe(n.init) !== null) seccionsDeDetall.push(literalDe(n.init));
    });
  }
  if (rutes.some(r => r.component === DETALL_GENERIC) && !seccionsDeDetall.length) infraccio('S4', 'el detall genèric no té cap secció llegible');

  /* 7 · La llista de rutes sense indexar del client (useSEO.js · PRIVATE), per AST: el mòdul no es carrega des de Node. */
  const privades = [];
  if (hiEs(USE_SEO)) {
    camina(ast(USE_SEO), n => {
      if (n.type !== 'VariableDeclarator' || n.id.name !== 'PRIVATE' || n.init?.type !== 'NewExpression') return;
      const llista = n.init.arguments[0];
      if (llista?.type !== 'ArrayExpression' || llista.elements.some(e => e?.type !== 'StringLiteral')) { infraccio('S4', `${USE_SEO}: PRIVATE no és una llista de literals`); return; }
      privades.push(...llista.elements.map(e => e.value));
    });
    if (!privades.length) infraccio('S4', `${USE_SEO}: no s'ha trobat la llista PRIVATE`);
  }

  /* 8 · Les famílies de la fitxa pública: /<prefix>/:param amb PerfilPublicSection. */
  const families = [];
  for (const r of rutes) {
    const forma = /^\/([A-Za-z0-9_-]+)\/:[A-Za-z0-9_]+$/.exec(r.patro);
    if (r.component === FITXA_PUBLICA && forma && !families.includes(forma[1])) families.push(forma[1]);
  }

  return {rutes, infraccions, families, fitxers, seccionsDeDetall, apps, privades};
}

/** Quina ruta del Router servix un camí: la primera que casa, baixant pels contenidors. null si cap. */
export function rutaQueServix(rutes, cami) {
  const tria = muntador => {
    for (const r of rutes) {
      if (r.muntador !== muntador || !patroARegex(r.patro).test(cami)) continue;
      return r.contenidor ? tria(r.ordre) || r : r;
    }
    return null;
  };
  return tria(0);
}
