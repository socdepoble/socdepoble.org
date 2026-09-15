#!/usr/bin/env node
/**
 * porta-vigencia.mjs — Porta del tractor: deute semàntic i requisits zombi.
 *
 * Ubicació canònica: scripts/portes/porta-vigencia.mjs
 * Encadenable des de run-portes.mjs com una porta més.
 *
 * NO fa "buscar i reemplaçar" cec. Classifica cada coincidència pel seu
 * CONTEXT i només toca allò que és mecànicament segur.
 *
 *   HISTORIC  → menció legítima (ADR, memorial, bloc marcat). S'ignora.
 *   MECANIC   → token llegible per màquina amb substitut declarat. Auto-reparable.
 *   PROHIBIT  → requisit derogat viu dins d'un fitxer que alimenta l'agent. Bloqueja.
 *   AMBIGU    → prosa. Cal reescriptura humana o d'agent. Mai automàtic.
 *
 * Ús:
 *   node scripts/portes/porta-vigencia.mjs
 *   node scripts/portes/porta-vigencia.mjs --informe
 *   node scripts/portes/porta-vigencia.mjs --aplica        (només MECANIC)
 *   node scripts/portes/porta-vigencia.mjs --quarantena     (escriu el veto per a matrix.mjs)
 *   node scripts/portes/porta-vigencia.mjs --estricte       (AMBIGU també bloqueja)
 *
 * Eixides: 0 net · 1 troballes bloquejants · 2 configuració invàlida
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------- arguments

const ARG = new Set(process.argv.slice(2));
const opcio = (nom, def) => {
  const pre = `--${nom}=`;
  const t = process.argv.slice(2).find((a) => a.startsWith(pre));
  return t ? t.slice(pre.length) : def;
};

const ARREL = opcio('arrel', process.cwd());
const REGISTRE = opcio('registre', join(ARREL, 'docs/govern/paradigmes.json'));
const APLICA = ARG.has('--aplica');
const INFORME = ARG.has('--informe');
const QUARANTENA = ARG.has('--quarantena');
const ESTRICTE = ARG.has('--estricte');

const C = process.stdout.isTTY
  ? { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[34m', d: '\x1b[2m', x: '\x1b[0m' }
  : { r: '', g: '', y: '', b: '', d: '', x: '' };

const mor = (msg) => {
  console.error(`${C.r}✖ porta-vigencia: ${msg}${C.x}`);
  process.exit(2);
};

// ---------------------------------------------------------------- registre

let reg;
try {
  reg = JSON.parse(readFileSync(REGISTRE, 'utf8'));
} catch (e) {
  mor(`no puc llegir el registre ${REGISTRE} — ${e.message}`);
}

const SEGELL = createHash('sha256').update(readFileSync(REGISTRE)).digest('hex').slice(0, 12);

if (!Array.isArray(reg.paradigmes) || reg.paradigmes.length === 0) {
  mor('el registre no declara cap paradigma. Una porta que no vigila res no pot certificar res.');
}
if (!reg.abast?.feed_agent?.length) {
  mor('abast.feed_agent buit: sense zona vigilada, la porta donaria verd sempre. Això és una porta cega.');
}

// ------------------------------------------------- autotest de canaris
// Cap patró entra en servei sense demostrar que caça la seua pròpia presa.
// Sense açò, un regex trencat produeix "0 troballes" i certifica una mentida.

const derogats = [];
const fallits = [];

for (const p of reg.paradigmes) {
  for (const d of p.derogats ?? []) {
    let rx;
    try {
      rx = new RegExp(d.patro, 'gi');
    } catch (e) {
      fallits.push(`${p.id} · ${d.terme}: regex invàlid — ${e.message}`);
      continue;
    }
    if (typeof d.canari !== 'string' || !d.canari) {
      fallits.push(`${p.id} · ${d.terme}: sense canari. Cap patró entra sense prova viva.`);
      continue;
    }
    rx.lastIndex = 0;
    if (!rx.test(d.canari)) {
      fallits.push(`${p.id} · ${d.terme}: el patró NO caça el seu canari.`);
      continue;
    }
    if (d.auto && typeof d.substitut !== 'string') {
      fallits.push(`${p.id} · ${d.terme}: auto:true sense substitut. Reparació impossible.`);
      continue;
    }
    derogats.push({ paradigma: p.id, vigent: p.vigent, ...d, rx: new RegExp(d.patro, 'gi') });
  }
}

// ------------------------------------------- incoherències (2n detector)
// Una substitució cega deixa l'etiqueta nova damunt d'un cos antic. El resultat
// no conté cap terme prohibit: és lèxicament invisible i confiadament fals.
// Això no es caça amb paraules prohibides, sinó amb parells que no poden conviure.

const incoherencies = [];
for (const p of reg.paradigmes) {
  for (const inc of p.incoherencies ?? []) {
    try {
      const a = new RegExp(inc.si_conte, 'i');
      const b = new RegExp(inc.i_tambe, 'i');
      if (!a.test(inc.canari) || !b.test(inc.canari))
        fallits.push(`${p.id} · incoherència "${inc.nom}": el canari no dispara les dues cares.`);
      else incoherencies.push({ paradigma: p.id, ...inc, a, b });
    } catch (e) {
      fallits.push(`${p.id} · incoherència "${inc.nom}": regex invàlid — ${e.message}`);
    }
  }
}

if (fallits.length) mor(`autotest de canaris fallit:\n   - ${fallits.join('\n   - ')}`);

// ---------------------------------------------------------------- recorregut

const norm = (p) => p.split(sep).join('/');
const prefix = (rel, llista) => (llista ?? []).some((q) => rel === q || rel.startsWith(q));

const rxMorts = reg.abast.patro_fitxers_morts ? new RegExp(reg.abast.patro_fitxers_morts, 'i') : null;
const exclouDirs = new Set(reg.abast.exclou_directoris ?? []);
const exts = reg.abast.extensions ?? ['.md'];

function* recorre(dir) {
  let entrades;
  try {
    entrades = readdirSync(dir);
  } catch {
    return;
  }
  for (const nom of entrades) {
    if (exclouDirs.has(nom)) continue;
    const abs = join(dir, nom);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* recorre(abs);
    else if (exts.some((e) => nom.endsWith(e)) || rxMorts?.test(nom)) yield abs;
  }
}

// ------------------------------------------------- context línia per línia

function mapaContext(linies) {
  const ctx = [];
  let fm = false,
    fmVista = false,
    codi = false,
    historic = false,
    clauFm = '';

  linies.forEach((l, i) => {
    const t = l.trim();
    if (i === 0 && t === '---') {
      fm = true;
      fmVista = true;
      ctx.push({ fm: true, codi: false, historic: false, clauFm: '' });
      return;
    }
    if (fm && t === '---') {
      fm = false;
      ctx.push({ fm: true, codi: false, historic: false, clauFm: '' });
      return;
    }
    if (fm) {
      const m = /^([a-z_][a-z0-9_]*):/i.exec(l);
      if (m) clauFm = m[1];
      ctx.push({ fm: true, codi: false, historic: false, clauFm });
      return;
    }
    if (/^\s*(```|~~~)/.test(l)) codi = !codi;
    if (/<!--\s*VIGENCIA:HISTORIC\s+inici/i.test(l)) historic = true;
    ctx.push({ fm: false, codi, historic, clauFm: '', fmVista });
    if (/<!--\s*VIGENCIA:HISTORIC\s+fi/i.test(l)) historic = false;
  });
  return ctx;
}

function exempcionsDoc(linies) {
  const fora = new Set();
  if (linies[0]?.trim() !== '---') return fora;
  for (let i = 1; i < linies.length && linies[i].trim() !== '---'; i++) {
    const m = /^vigencia_exempt:\s*\[?(.*?)\]?\s*$/i.exec(linies[i]);
    if (m && m[1].trim()) m[1].split(',').forEach((s) => fora.add(s.trim().replace(/['"]/g, '')));
  }
  return fora;
}

// ---------------------------------------------------------------- anàlisi

const troballes = [];
let nFitxers = 0,
  nMorts = 0;

// El registre i la quarantena citen els termes derogats per obligació.
// Si es vigilaren a si mateixos, la porta no podria tancar-se mai.
const AUTOEXEMPTS = new Set([norm(relative(ARREL, REGISTRE)), 'docs/govern/quarantena.json']);

for (const abs of recorre(ARREL)) {
  const rel = norm(relative(ARREL, abs));
  if (AUTOEXEMPTS.has(rel)) continue;
  if (reg.abast.exclou_fitxers_morts && rxMorts?.test(rel)) {
    nMorts++;
    troballes.push({
      rel,
      linia: 0,
      classe: 'MORT',
      terme: 'fitxer residual',
      paradigma: '—',
      text: 'artefacte de merge/backup dins l\'arbre viu',
      substitut: null,
    });
    continue;
  }

  let text;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  nFitxers++;

  const linies = text.split('\n');
  const ctx = mapaContext(linies);
  const exempt = exempcionsDoc(linies);
  const esFeed = prefix(rel, reg.abast.feed_agent);
  const esHistoricNatura = prefix(rel, reg.abast.historic_per_natura);

  for (const d of derogats) {
    linies.forEach((linia, i) => {
      d.rx.lastIndex = 0;
      if (!d.rx.test(linia)) return;
      const c = ctx[i] ?? {};

      let classe;
      if (exempt.has(d.paradigma) || esHistoricNatura || c.historic) classe = 'HISTORIC';
      else if (c.fm && ['canvi_log', 'aliases', 'historic'].includes(c.clauFm)) classe = 'HISTORIC';
      else if (d.auto && d.substitut != null) classe = 'MECANIC';
      else if (c.codi) classe = 'AMBIGU';
      else if (esFeed) classe = 'PROHIBIT';
      else classe = 'AMBIGU';

      troballes.push({
        rel,
        linia: i + 1,
        classe,
        terme: d.terme,
        paradigma: d.paradigma,
        vigent: d.vigent,
        motiu: d.motiu,
        text: linia.trim().slice(0, 150),
        substitut: d.substitut,
        patro: d.patro,
      });
    });
  }

  for (const inc of incoherencies) {
    linies.forEach((linia, i) => {
      if (!inc.a.test(linia) || !inc.b.test(linia)) return;
      const c = ctx[i] ?? {};
      if (esHistoricNatura || c.historic) return;
      troballes.push({
        rel,
        linia: i + 1,
        classe: 'INCOHERENT',
        terme: inc.nom,
        paradigma: inc.paradigma,
        motiu: inc.motiu,
        text: linia.trim().slice(0, 150),
        substitut: null,
      });
    });
  }
}

// --------------------------------------------------- deduplicació de senyal
// Diversos patrons poden caçar la mateixa línia. Es conserva la classe més
// accionable perquè l'informe no duplique feina.

{
  const rang = { INCOHERENT: 0, PROHIBIT: 1, MECANIC: 2, AMBIGU: 3, MORT: 4, HISTORIC: 5 };
  const millor = new Map();
  for (const t of troballes) {
    const clau = `${t.rel}:${t.linia}:${t.paradigma}`;
    const prev = millor.get(clau);
    if (!prev || rang[t.classe] < rang[prev.classe]) millor.set(clau, t);
  }
  troballes.length = 0;
  troballes.push(...millor.values());
}

// ---------------------------------------------------------------- reparació

let reparats = 0;
if (APLICA) {
  const perFitxer = new Map();
  for (const t of troballes.filter((x) => x.classe === 'MECANIC'))
    perFitxer.set(t.rel, [...(perFitxer.get(t.rel) ?? []), t]);

  for (const [rel, llista] of perFitxer) {
    const abs = join(ARREL, rel);
    let text = readFileSync(abs, 'utf8');
    for (const t of llista) text = text.replace(new RegExp(t.patro, 'gi'), t.substitut);
    writeFileSync(abs, text);
    reparats += llista.length;
    console.log(`${C.g}  ✎ reparat${C.x} ${rel} · ${llista.length} token(s)`);
  }
  for (const t of troballes) if (t.classe === 'MECANIC') t.classe = 'REPARAT';
}

// ---------------------------------------------------------------- informe

const per = (c) => troballes.filter((t) => t.classe === c);
const ordre = ['INCOHERENT', 'PROHIBIT', 'MECANIC', 'AMBIGU', 'MORT', 'HISTORIC', 'REPARAT'];
const cnt = Object.fromEntries(ordre.map((c) => [c, per(c).length]));

const ara = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const stamp =
  reg.nomenclatura_informe === 'YYYYMMDD'
    ? `${ara.getFullYear()}${p2(ara.getMonth() + 1)}${p2(ara.getDate())}`
    : `${p2(ara.getFullYear() % 100)}${p2(ara.getMonth() + 1)}${p2(ara.getDate())}`;
const hora = `${p2(ara.getHours())}${p2(ara.getMinutes())}`;

console.log(`\n${C.b}▬ PORTA DE VIGÈNCIA${C.x} · segell ${SEGELL} · ${nFitxers} fitxers · ${derogats.length} patrons\n`);

for (const c of ordre) {
  const l = per(c);
  if (!l.length) continue;
  const col = c === 'PROHIBIT' || c === 'INCOHERENT' ? C.r : c === 'MECANIC' || c === 'MORT' ? C.y : c === 'REPARAT' ? C.g : C.d;
  console.log(`${col}${c}${C.x} (${l.length})`);
  for (const t of l.slice(0, 12)) console.log(`  ${t.rel}:${t.linia}${C.d}  ${t.text}${C.x}`);
  if (l.length > 12) console.log(`  ${C.d}… i ${l.length - 12} més${C.x}`);
  console.log('');
}

if (INFORME) {
  const dir = join(ARREL, 'docs/auditories');
  mkdirSync(dir, { recursive: true });
  const ruta = join(dir, `${stamp}_${hora}_AUDITORIA_purga_vigencia.md`);
  const secc = (c, titol) =>
    per(c).length
      ? `\n### ${titol} (${per(c).length})\n\n` +
        per(c).map((t) => `- \`${t.rel}:${t.linia}\` — **${t.terme}** [${t.paradigma}]\n  > ${t.text}`).join('\n')
      : '';
  writeFileSync(
    ruta,
    `---
doc_id: SDP-AUD-VIGENCIA-${stamp}-${hora}
titol: "Purga de vigència — deute semàntic i requisits zombi"
doc_type: auditoria
version_semver: "1.0.0"
estat: esborrany
date: ${ara.getFullYear()}-${p2(ara.getMonth() + 1)}-${p2(ara.getDate())}
authoring_agent: "[[porta-vigencia.mjs]]"
projecte: "[[Sóc de Poble]]"
vigencia_segell: ${SEGELL}
vigencia_exempt: [${reg.paradigmes.map((p) => p.id).join(', ')}]
aprovacio_humana: false
revisio_pendent: true
tags: [sdp/auditoria, domini/arquitectura]
---

# Purga de vigència

Generat per \`porta-vigencia.mjs\` · segell del registre \`${SEGELL}\`
Fitxers analitzats: ${nFitxers} · patrons actius: ${derogats.length}

| classe | recompte |
|---|---|
${ordre.map((c) => `| ${c} | ${cnt[c]} |`).join('\n')}
${secc('INCOHERENT', '🔴 Incoherència interna — etiqueta nova damunt de cos antic')}
${secc('PROHIBIT', '🔴 Requisit derogat viu en zona que alimenta l\'agent')}
${secc('MECANIC', '🟡 Token mecànic — reparable amb --aplica')}
${secc('AMBIGU', '🟠 Prosa — cal reescriptura que preserve el sentit')}
${secc('MORT', '⚫ Fitxers residuals dins l\'arbre viu')}

> Aquest document és **exempt** de la purga: cita termes derogats per necessitat forense.
`
  );
  console.log(`${C.b}  ⎙ informe${C.x} ${norm(relative(ARREL, ruta))}\n`);
}

if (QUARANTENA) {
  const dir = join(ARREL, 'docs/govern');
  mkdirSync(dir, { recursive: true });
  const vetats = [...new Set([...per('PROHIBIT'), ...per('INCOHERENT')].map((t) => t.rel))];
  writeFileSync(
    join(dir, 'quarantena.json'),
    JSON.stringify(
      {
        _: 'Generat per porta-vigencia.mjs. matrix.mjs NO ha d\'injectar aquests fitxers al context.',
        segell: SEGELL,
        generat: ara.toISOString(),
        vetats,
      },
      null,
      2
    ) + '\n'
  );
  console.log(`${C.b}  ⛔ quarantena${C.x} docs/govern/quarantena.json · ${vetats.length} fitxer(s) vetats\n`);
}

// ---------------------------------------------------------------- veredicte

const bloqueja = cnt.INCOHERENT + cnt.PROHIBIT + cnt.MECANIC + cnt.MORT + (ESTRICTE ? cnt.AMBIGU : 0);

if (bloqueja === 0) {
  console.log(`${C.g}✔ PORTA OBERTA${C.x} — cap requisit zombi en zona vigilada.`);
  process.exit(0);
}
console.log(
  `${C.r}✖ PORTA TANCADA${C.x} — ${bloqueja} troballa(es) bloquejant(s).` +
    (cnt.AMBIGU && !ESTRICTE ? ` ${C.d}(+${cnt.AMBIGU} AMBIGU no bloquejants)${C.x}` : '')
);
process.exit(1);
