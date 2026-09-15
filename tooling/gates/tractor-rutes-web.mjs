#!/usr/bin/env node
/**
 * tractor-rutes-web.mjs — LA RUTA WEB ES DECLARA UNA VEGADA O NO ES DECLARA
 *
 * PREMISSA (auditoria 260829, Seient Núm. 5):
 * `tractor-rutes.mjs` vigila literals de rutes de FITXERS a tooling/. Cap porta
 * vigilava les rutes WEB. Resultat: quatre fonts de veritat que es contradiuen
 * (App.jsx, sections.js, navigation.js, seo-routes.json) i cap `exit 1`.
 *
 * FONTS:
 *   App.jsx        → <Route path element>  (AST amb @babel/parser, ja devDependency)
 *   sections.js    → SECTIONS[].path, DEFAULT_SECTION_PATH  (AST)
 *   navigation.js  → prefix d'ítem de cada secció  (AST)
 *   seo-routes.json (o --manifest=fitxer) → rutes que el contenidor publica
 *
 * LLEIS (DURES = bloquegen):
 *   W1 · seccio-sense-ruta        Una secció de sections.js no té <Route> o el seu <Route> és un <Navigate>. DURA.
 *   W2 · portada-alies            DEFAULT_SECTION_PATH no és el `path` d'una secció declarada. DURA.
 *   W3 · item-fora-de-llista      navigation.js construïx ítems amb un prefix que no és la llista de la secció. DURA.
 *   W4 · manifest-redirigit       El manifest publica com a 200 una ruta que l'App redirigeix. DURA.
 *   W5 · portada-fora-del-manifest El manifest no conté la portada de l'App. DURA.
 *   W6 · seccio-no-declarada      Una carpeta src/sections/<x> té <Route path="/<x>"> però <x> no és a sections.js. AVÍS.
 *   W7 · contingut-duplicat       Un mateix component es servix a N rutes sense redirecció. AVÍS.
 *
 * ÚS:  node tooling/gates/tractor-rutes-web.mjs [--arrel=.] [--manifest=ruta.json] [--avisos]
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || null;
const ARREL = path.resolve(arg('arrel') || '.');
const AVISOS_BLOQUEGEN = process.argv.includes('--avisos');
const R = (p) => path.join(ARREL, p);
const llig = (p) => fs.readFileSync(R(p), 'utf8');
const ast = (p) => parse(llig(p), { sourceType: 'module', plugins: ['jsx'] });

/* Recorregut d'AST sense dependències: visita tots els nodes. */
function camina(node, fn) {
  if (!node || typeof node.type !== 'string') return;
  fn(node);
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach((x) => camina(x, fn));
    else if (v && typeof v.type === 'string') camina(v, fn);
  }
}
const nomJSX = (n) => n?.type === 'JSXIdentifier' ? n.name : n?.type === 'JSXMemberExpression' ? `${nomJSX(n.object)}.${nomJSX(n.property)}` : null;
const attr = (el, nom) => el.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === nom);
const valorStr = (a) => a?.value?.type === 'StringLiteral' ? a.value.value : a?.value?.type === 'JSXExpressionContainer' && a.value.expression.type === 'StringLiteral' ? a.value.expression.value : null;

/* ───────────── 1 · App.jsx: taula de rutes ───────────── */
const rutes = []; // { path, tipus: 'component'|'redirect', component, desti }
camina(ast('src/app/App.jsx'), (n) => {
  if (n.type !== 'JSXOpeningElement' || nomJSX(n.name) !== 'Route') return;
  const ruta = valorStr(attr(n, 'path'));
  const el = attr(n, 'element')?.value?.expression;
  if (!ruta || !el || el.type !== 'JSXElement') return;
  const nom = nomJSX(el.openingElement.name);
  if (nom === 'Navigate' || nom === 'SectionRedirect') {
    const attrTo = attr(el.openingElement, 'to') || attr(el.openingElement, 'ruta') || attr(el.openingElement, 'desti');
    rutes.push({ path: ruta, tipus: 'redirect', desti: valorStr(attrTo) || '(dinàmica)' });
  } else {
    /* Identitat = component + props literals (TextRoute pageKey="legal" ≠ pageKey="ia"). */
    const props = el.openingElement.attributes.filter((a) => a.type === 'JSXAttribute' && valorStr(a) !== null).map((a) => `${a.name.name}=${valorStr(a)}`);
    let normalizedPath = ruta;
    if (normalizedPath && !normalizedPath.startsWith('/') && normalizedPath !== '*') {
      normalizedPath = '/' + normalizedPath;
    }
    rutes.push({ path: normalizedPath, tipus: 'component', component: props.length ? `${nom}(${props.join(',')})` : nom });
  }
});

/* ───────────── 2 · sections.js ───────────── */
const seccions = []; let portada = null;
camina(ast('src/config/sections.js'), (n) => {
  if (n.type === 'VariableDeclarator' && n.id.name === 'DEFAULT_SECTION_PATH' && n.init?.type === 'StringLiteral') portada = n.init.value;
  if (n.type === 'VariableDeclarator' && n.id.name === 'SECTIONS' && n.init?.type === 'ArrayExpression') {
    for (const o of n.init.elements) {
      const prop = (k) => o.properties.find((p) => p.key?.name === k)?.value;
      seccions.push({ id: prop('id')?.value, path: prop('path')?.value, kind: prop('kind')?.value });
    }
  }
});

/* ───────────── 3 · navigation.js: prefixos d'ítem ───────────── */
const prefixosItem = new Map(); // sectionId → prefix
camina(ast('src/config/navigation.js'), (n) => {
  if (n.type !== 'FunctionDeclaration' && n.type !== 'VariableDeclarator') return;
  const nom = n.id?.name;
  if (nom !== 'getSectionItemPath') return;
  camina(n, (m) => {
    if (m.type === 'IfStatement' && m.test.type === 'BinaryExpression' && m.test.right?.type === 'StringLiteral') {
      camina(m.consequent, (t) => {
        if (t.type === 'TemplateLiteral' && t.quasis[0]?.value.raw.startsWith('/')) prefixosItem.set(m.test.right.value, t.quasis[0].value.raw.replace(/\/$/, ''));
      });
    }
  });
});

/* ───────────── 4 · manifest SEO (opcional) ───────────── */
let manifest = null;
const rutaManifest = arg('manifest') || 'wordpress-plugin/dist/seo-routes.json';
try { manifest = JSON.parse(fs.readFileSync(path.resolve(ARREL, rutaManifest), 'utf8')); } catch { manifest = null; }

/* ───────────── Lleis ───────────── */
const inf = []; const avis = [];
const perPath = new Map(rutes.map((r) => [r.path, r]));
const componentDe = (p) => perPath.get(p);

for (const s of seccions) {
  const r = componentDe(s.path);
  if (!r) inf.push(`W1 · ${s.id}: sections.js declara ${s.path} i App.jsx no té cap <Route>.`);
  else if (r.tipus === 'redirect') inf.push(`W1 · ${s.id}: sections.js declara ${s.path} com a secció, però App.jsx la redirigix a ${r.desti}. O és secció o és àlies.`);
}

if (!portada) inf.push('W2 · No s\'ha trobat DEFAULT_SECTION_PATH a sections.js.');
else if (!seccions.some((s) => s.path === portada)) {
  const r = componentDe(portada);
  inf.push(`W2 · La portada és ${portada}, que no és el path de cap secció declarada${r ? ` (és ${r.tipus === 'redirect' ? 'una redirecció' : 'un àlies de ' + r.component.replace(/\(.*\)$/, '')})` : ' (ni tan sols té <Route>)'}. La portada ha de ser canònica.`);
}

for (const [id, prefix] of prefixosItem) {
  const s = seccions.find((x) => x.id === id);
  if (s && s.path !== prefix) inf.push(`W3 · ${id}: la llista viu a ${s.path} però navigation.js construïx els ítems a ${prefix}/:id. Dues URL canòniques per a una secció.`);
}

if (manifest?.routes) {
  for (const slug of Object.keys(manifest.routes)) {
    const r = componentDe('/' + slug);
    if (r?.tipus === 'redirect' && manifest.routes[slug].index) inf.push(`W4 · /${slug}: el manifest la publica 200/indexable i App.jsx la redirigix a ${r.desti}. Google veurà una pàgina que no existix.`);
  }
  if (portada && !manifest.routes[portada.replace(/^\//, '')] && !manifest.aliases?.[portada.replace(/^\//, '')]) inf.push(`W5 · La portada ${portada} no és al manifest: si el contenidor resol per manifest, la portada de l'App és un 404.`);
} else {
  avis.push(`W4/W5 · Sense manifest (${rutaManifest}); passa --manifest=… o genera'l amb build-seo-manifest.mjs.`);
}

const dirsSeccions = fs.existsSync(R('src/sections')) ? fs.readdirSync(R('src/sections')).filter((d) => fs.statSync(R(`src/sections/${d}`)).isDirectory()) : [];
for (const d of dirsSeccions) {
  const r = componentDe('/' + d);
  if (r?.tipus === 'component' && !seccions.some((s) => s.id === d)) avis.push(`W6 · /${d}: carpeta src/sections/${d} amb <Route> pròpia, però '${d}' no és a sections.js (invisible per a nav, SEO i tractors).`);
}

const perComponent = new Map();
for (const r of rutes) if (r.tipus === 'component' && !r.path.includes(':') && r.path !== '*') perComponent.set(r.component, [...(perComponent.get(r.component) || []), r.path]);
for (const [c, ps] of perComponent) if (ps.length > 1) avis.push(`W7 · ${c} es servix a ${ps.length} URL sense redirecció (${ps.join(', ')}): contingut duplicat.`);

/* ───────────── Informe ───────────── */
console.log(`\n🧭 TRACTOR RUTES WEB — ${rutes.length} <Route> · ${seccions.length} seccions · portada ${portada}`);
for (const i of inf) console.log(`  ❌ ${i}`);
for (const a of avis) console.log(`  ⚠️  ${a}`);
const bloquejants = inf.length + (AVISOS_BLOQUEGEN ? avis.length : 0);
console.log(bloquejants ? `\n❌ PORTA TANCADA. ${inf.length} infraccions · ${avis.length} avisos.\n` : `\n✅ Rutes coherents. ${avis.length} avisos.\n`);
process.exit(bloquejants ? 1 : 0);
