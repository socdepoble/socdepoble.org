#!/usr/bin/env node
/**
 * matrix.mjs — BOOTLOADER COGNITIU DETERMINISTA
 *
 * SUBSTITUÏX `tooling/wiki/lib/context_preflight.mjs`, que tenia el disseny
 * correcte i les quatre funcions portants buides (`loadCanonicalRegistry`,
 * `routeSkills`, `extractDependencies`, `retrieveJIT` tornaven {} o []) i
 * retornava `ready: true` amb `omissions: []` com a literal. Una porta que
 * no tanca però encén el llum verd.
 *
 * QUÈ FA
 * ──────
 *   acció demanada → busca la skill → resol el protocol → llig els fitxers
 *   obligatoris SENCERS → n'emet rebut amb sha256 → només llavors diu `ready`.
 *
 * LLEI D'ESTA PORTA
 * ─────────────────
 *   Si no pot llegir una font obligatòria, ix amb codi 2 i `ready:false`.
 *   «No he pogut carregar el context» mai equival a «ja el tinc» (P-07).
 *
 * REGISTRE ÚNIC
 * ─────────────
 *   Llig directament els subdirectoris a `.agents/skills/`.
 *   El disc és la font de veritat única.
 *
 * ÚS
 *   node tooling/brain/matrix.mjs "fes una petorreta del bloc de notes"
 *   node tooling/brain/matrix.mjs --json "auditoria de les skills"
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ARREL = process.env.SDP_ARREL || process.cwd();
const R = (p) => path.join(ARREL, p);
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const PETICIO = args.filter((a) => !a.startsWith('--')).join(' ');

/* ══════════ 0 · Sense petició no hi ha encaminament ══════════ */
if (!PETICIO.trim()) {
  console.error('❌ [MATRIX] Cap petició. Ús: node tooling/brain/matrix.mjs "<el que t\'han demanat>"');
  process.exit(2);
}

const errors = [];
const avisos = [];

/* ══════════ 1 · Registre únic: directori .agents/skills/ ══════════ */

const dirSkills = R('.agents/skills');
const alDisc = fs.readdirSync(dirSkills, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(dirSkills, d.name, 'SKILL.md')))
  .map((d) => d.name)
  .sort();

/* ══════════ 2 · Càrrega de skills amb rebut ══════════ */

function frontmatter(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  let clau = null;
  for (const l of m[1].split('\n')) {
    const kv = l.match(/^([a-zA-Z_][\w]*):\s*(.*)$/);
    const it = l.match(/^\s+-\s+(.*)$/);
    if (kv) { clau = kv[1]; out[clau] = kv[2] === '' ? [] : kv[2].replace(/^['"]|['"]$/g, ''); }
    else if (it && clau) { if (!Array.isArray(out[clau])) out[clau] = []; out[clau].push(it[1].replace(/^['"]|['"]$/g, '')); }
  }
  return out;
}

const skills = [];
for (const nom of alDisc) {
  const ruta = `.agents/skills/${nom}/SKILL.md`;
  const txt = fs.readFileSync(R(ruta), 'utf8');
  const fm = frontmatter(txt);
  if (fm.name && fm.name !== nom) errors.push(`${ruta}: name «${fm.name}» ≠ carpeta «${nom}».`);
  if (!fm.triggers_on) avisos.push(`${ruta}: sense triggers_on. Skill morta en silenci.`);
  skills.push({
    nom, ruta, txt,
    core: String(fm.core) === 'true',
    triggers: [].concat(fm.triggers_on || []),
    prioritat: Number(fm.prioritat ?? 50)
  });
}

/* ══════════ 3 · Gallets sense col·lisió silenciosa ══════════ */

const perGallet = new Map();
for (const s of skills) for (const g of s.triggers) {
  if (!perGallet.has(g)) perGallet.set(g, []);
  perGallet.get(g).push(s);
}
for (const [g, llista] of perGallet) {
  if (llista.length < 2) continue;
  const prios = new Set(llista.map((s) => s.prioritat));
  if (prios.size !== llista.length) {
    errors.push(`Gallet «${g}» compartit per ${llista.map((s) => s.nom).join(', ')} sense «prioritat» que els desempate. La resolució quedaria a l'atzar.`);
  }
}

/* Casament per paraules amb prefix i farcit (portat de persona_router.mjs,
   correcció 260901: «codi» no s'encén dins de «descodificar», i «crear skill»
   casa amb «crear una skill»). */
const MAX_FARCIT = 2;
const paraules = (t) => String(t).toLowerCase().split(/[^\p{L}\p{N}·]+/u).filter(Boolean);
const MOTS = paraules(PETICIO);

function encés(gallet) {
  const busca = paraules(gallet);
  if (!busca.length) return false;
  for (let i0 = 0; i0 < MOTS.length; i0++) {
    if (!MOTS[i0].startsWith(busca[0])) continue;
    let i = i0 + 1, k = 1, farcit = 0;
    while (k < busca.length && i < MOTS.length && farcit <= MAX_FARCIT) {
      if (MOTS[i].startsWith(busca[k])) { k++; i++; } else { farcit++; i++; }
    }
    if (k === busca.length) return true;
  }
  return false;
}

const encesos = [];
for (const s of skills) {
  const gallets = s.triggers.filter(encés);
  if (s.core || gallets.length) encesos.push({ ...s, gallets, motiu: s.core ? 'core' : 'gallet' });
}
encesos.sort((a, b) => a.prioritat - b.prioritat || a.nom.localeCompare(b.nom));

/* ══════════ 4 · PROTOCOLLEDGE: de l'acció a la plantilla ══════════ */

/* La taula viu dins de reflexio-previa/SKILL.md. Ací s'extrau del fitxer,
   no es reescriu: una segona còpia seria una segona llei. */
const REFLEXIO = R('.agents/skills/skill-acte-reflex/SKILL.md');
const protocols = [];
if (fs.existsSync(REFLEXIO)) {
  const txt = fs.readFileSync(REFLEXIO, 'utf8');
  for (const l of txt.split('\n')) {
    const m = l.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(?:`([^`]+)`|\[\[([^\]]+)\]\])\s*\|/);
    if (!m) continue;
    const claus = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    protocols.push({ claus, protocol: m[2].trim(), ruta: (m[3] || m[4]).trim() });
  }
} else {
  errors.push('Falta .agents/skills/skill-acte-reflex/SKILL.md: sense PROTOCOLLEDGE no hi ha encaminament de plantilles.');
}

const aplicables = protocols.filter((p) => p.claus.some(encés));

/* Cada ruta declarada ha d'existir. Un protocol que apunta al no-res
   és pitjor que no tindre'n: promet cobertura i no en dona. */
for (const p of protocols) {
  if (!fs.existsSync(R(p.ruta))) errors.push(`PROTOCOLLEDGE → «${p.protocol}» apunta a ${p.ruta}, que no és al disc.`);
}

/* ── 4b · El defecte és un fitxer, no una frase impresa ──────────────
   Abans, quan cap protocol casava, matrix escrivia «cau a PLANTILLA_ISO_SDP»
   per pantalla i no la carregava ni comprovava que existira. Deia ready:true
   sense haver encaminat res: la mateixa porta que certifica el que no mira. */
const RUTA_DEFECTE = protocols.find((p) => /qualsevol altra acció/i.test(p.claus.join(' ')))?.ruta;
if (!aplicables.length) {
  if (!RUTA_DEFECTE) {
    errors.push('PROTOCOLLEDGE no declara fila per defecte. Sense encaminament ni defecte no hi ha protocol.');
  } else if (!fs.existsSync(R(RUTA_DEFECTE))) {
    errors.push(`El protocol per defecte apunta a ${RUTA_DEFECTE}, que no és al disc.`);
  } else {
    aplicables.push({ claus: ['(defecte)'], protocol: 'PLANTILLA_ISO_SDP (per defecte)', ruta: RUTA_DEFECTE });
  }
}

/* ── 4c · Cobertura: cap gallet de creació pot quedar sense encaminar ──
   Les dues skills que existixen per encaminar la creació de documents són
   skill-acte-reflex. Si un dels seus gallets no casa amb cap
   fila de la taula, eixa acció es generaria a mà lliure. És exactament el
   forat pel qual «crear un prompt» no arribava a cap plantilla. */
const CLAUS_TAULA = protocols.flatMap((p) => p.claus).filter((c) => !/qualsevol altra acció/i.test(c));
function casaAmbTaula(gallet) {
  const mots = paraules(gallet);
  return CLAUS_TAULA.some((clau) => {
    const busca = paraules(clau);
    if (!busca.length) return false;
    for (let i0 = 0; i0 < mots.length; i0++) {
      if (!mots[i0].startsWith(busca[0])) continue;
      let i = i0 + 1, k = 1, farcit = 0;
      while (k < busca.length && i < mots.length && farcit <= MAX_FARCIT) {
        if (mots[i].startsWith(busca[k])) { k++; i++; } else { farcit++; i++; }
      }
      if (k === busca.length) return true;
    }
    return false;
  });
}
for (const nom of ['skill-acte-reflex']) {
  const s = skills.find((x) => x.nom === nom);
  if (!s) { errors.push(`Falta la skill d'encaminament «${nom}».`); continue; }
  const orfes = s.triggers.filter((g) => !casaAmbTaula(g));
  if (orfes.length) errors.push(`Gallets de «${nom}» sense fila a PROTOCOLLEDGE: ${orfes.join(', ')}. Eixes accions es generarien a mà lliure.`);
}

/* ══════════ 5 · Fonts obligatòries: lectura sencera i rebut ══════════ */

const GLOBALS = ['.agents/BOOTSTRAP.md', '.agents/AGENTS.md', '.agents/PROTOCOL_PETORRETA.md'];
const obligatories = [...new Set([...GLOBALS, ...encesos.map((s) => s.ruta), ...aplicables.map((p) => p.ruta)])];

const rebuts = [];
for (const ruta of obligatories) {
  const abs = R(ruta);
  if (!fs.existsSync(abs)) { errors.push(`Font obligatòria absent: ${ruta}`); continue; }
  const contingut = fs.readFileSync(abs, 'utf8');
  rebuts.push({ ruta, bytes: Buffer.byteLength(contingut, 'utf8'), linies: contingut.split('\n').length, sha256: sha(contingut), lectura: 'sencera' });
}
if (rebuts.length !== obligatories.length) errors.push(`Rebuts ${rebuts.length} de ${obligatories.length} fonts obligatòries.`);

/* ══════════ 6 · El RAG veu la taula de treball? ══════════ */

for (const ind of ['tooling/wiki/core/build_rag_index.mjs', 'tooling/wiki/core/edge_rag.mjs', 'tooling/wiki/core/build_slug_index.mjs']) {
  const abs = R(ind);
  if (fs.existsSync(abs) && fs.readFileSync(abs, 'utf8').includes("includes('05_Escriptori')")) {
    avisos.push(`${ind} salta 05_Escriptori: la recuperació et portarà a l'arxiu i no a la taula de treball.`);
  }
}

/* ══════════ 7 · Veredicte ══════════ */

const ready = errors.length === 0;
const informe = {
  esquema: 'sdp.matrix.v1',
  peticio: PETICIO,
  peticio_sha256: sha(PETICIO),
  moment: new Date().toISOString(),
  ready,
  skills_enceses: encesos.map((s) => ({ nom: s.nom, motiu: s.motiu, gallets: s.gallets, prioritat: s.prioritat })),
  protocols_aplicables: aplicables.map((p) => ({ protocol: p.protocol, ruta: p.ruta })),
  fonts_obligatories: rebuts,
  errors,
  avisos
};

/* ══════════ 7b · El rebut queda al diari: Saber ≠ Fer ══════════
   Un informe imprés per pantalla no és una prova: ningú el pot comprovar
   després. El rebut s'escriu al diari de sessió perquè la porta
   d'escriptura (.agents/hooks/verify.mjs) puga exigir-lo abans de
   deixar crear cap document. Només s'escriu si ready:true — un rebut
   d'una càrrega fallida seria pitjor que cap rebut. */
if (ready) {
  try {
    const DIARI = R('.agents/.diari_sessio.jsonl');
    fs.mkdirSync(path.dirname(DIARI), { recursive: true });
    fs.appendFileSync(DIARI, `${JSON.stringify({
      t: informe.moment,
      tipus: 'matrix.rebut',
      peticio_sha256: informe.peticio_sha256,
      protocols: informe.protocols_aplicables.map((p) => p.ruta),
      fonts: rebuts.map((r) => ({ ruta: r.ruta, sha256: r.sha256 }))
    })}\n`, 'utf8');
  } catch { /* el diari no pot bloquejar el bootloader */ }
}

if (JSON_MODE) {
  console.log(JSON.stringify(informe, null, 2));
  process.exit(ready ? 0 : 2);
}

console.log(`\n🧠 [MATRIX] «${PETICIO}»\n`);
console.log(`Skills enceses (${encesos.length}):`);
for (const s of encesos) console.log(`   ${s.motiu === 'core' ? '●' : '○'} ${s.nom.padEnd(28)} ${s.gallets.length ? `gallets: ${s.gallets.join(', ')}` : '(sempre)'}`);
console.log(`\nProtocols obligatoris (${aplicables.length}):`);
if (!aplicables.length) console.log('   cap — cau a PLANTILLA_ISO_SDP');
for (const p of aplicables) console.log(`   → ${p.protocol.padEnd(26)} ${p.ruta}`);
console.log(`\nFonts llegides senceres (${rebuts.length}):`);
for (const r of rebuts) console.log(`   ${r.sha256.slice(0, 12)}  ${String(r.bytes).padStart(6)}b  ${r.ruta}`);
if (avisos.length) { console.log('\n⚠  Avisos:'); for (const a of avisos) console.log(`   ${a}`); }
if (errors.length) {
  console.log('\n❌ Errors:');
  for (const e of errors) console.log(`   ${e}`);
  console.log('\n❌ [MATRIX] ready:false. No generes res fins que això estiga net.\n');
  process.exit(2);
}
console.log('\n✅ [MATRIX] ready:true. Context carregat de veritat, amb rebut.\n');
process.exit(0);
