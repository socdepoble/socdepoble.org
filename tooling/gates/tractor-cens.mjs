#!/usr/bin/env node
/**
 * tractor-cens.mjs — LA PORTA DE LA REGLA SAGRADA
 *
 * PER QUÈ EXISTIX (auditoria Seient Núm. 5, 260831):
 *
 *   El Mestre va preguntar per què la IAIA «oblidava» una regla explícita de
 *   la seua pròpia Wiki. La resposta empírica és que no l'oblidava: l'obeïa
 *   ignorant-la, perquè tres documents executius li ho ordenen.
 *
 *     .agents/AGENTS.md §1        «L'autoritat executiva viu EXCLUSIVAMENT a
 *                                  .agents/skills/»
 *     .agents/skills/00_INDEX…    «Qualsevol altra regla trobada fora d'aquesta
 *                                  carpeta no té valor executiu i HA DE SER
 *                                  IGNORADA»
 *     .agents/BOOTSTRAP.md §2.3   «les regles executives residixen ÚNICAMENT
 *                                  a .agents/»
 *
 *   La «Regla Sagrada» d'enumerar totes les Petorretes vivia només a
 *   _wiki_de_poble/01_ser/03_equip_ia.md:54.
 *
 *   Una regla que ha de ser inevitable no pot ser prosa dins d'una zona
 *   declarada no-executiva. Ha de ser DADES amb PORTA. Això és la porta.
 *
 * LLEIS
 *   C1 · El cens existix, és vàlid i no té ids duplicats.
 *   C2 · Cap document que parle del Consell com a CONJUNT pot deixar-se
 *        membres actives fora.
 *   C3 · Cap document pot anomenar una IA que no és al cens (ni «Codex» ni
 *        cap altra) com si en formara part.
 *   C4 · Cap xifra literal («onze», «dotze», «12 IAs») pot contradir el
 *        recompte real del cens.
 *   C5 · La skill executiva multi-agent-review ha de citar el cens, no
 *        llistar noms amb un «etc.».
 *
 * Ús:
 *   node tooling/gates/tractor-cens.mjs
 *   node tooling/gates/tractor-cens.mjs --arrel ../
 *
 * Eixides: 0 net · 1 infracció · 2 error d'execució.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ARREL = (() => {
  const i = process.argv.indexOf('--arrel');
  return path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
})();

const R = (rel) => path.join(ARREL, rel);
const CENS = '.agents/consell.json';

const infraccions = [];
const OK = [];
const falla = (llei, fitxer, linia, missatge) =>
  infraccions.push({ llei, fitxer, linia, missatge });
const passa = (llei) => OK.push(llei);

/* ══════════════════════════════════════════════════════════════════
   C1 · El cens existix i és vàlid
   ══════════════════════════════════════════════════════════════════ */
if (!existsSync(R(CENS))) {
  console.error(`❌ PARAT. No existix ${CENS}.`);
  console.error('   Sense cens no hi ha Regla Sagrada: només hi ha una frase en un document');
  console.error('   que la constitució obliga a ignorar. Crea el cens primer.');
  process.exit(2);
}

let cens;
try {
  cens = JSON.parse(readFileSync(R(CENS), 'utf8'));
} catch (e) {
  console.error(`❌ PARAT. ${CENS} no és JSON vàlid: ${e.message}`);
  process.exit(2);
}

const membres = (cens.membres || []).filter((m) => m.actiu !== false);
const noms = membres.map((m) => m.nom);
const ids = membres.map((m) => m.id);
const N = membres.length;

{
  const LLEI = 'C1 · Cens vàlid';
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  const senseCamp = membres.filter(
    (m) => !m.nom || !m.fortalesa || !m.debilitat || !m.rol
  );
  if (dup.length) {
    falla(LLEI, CENS, 0, `ids duplicats: ${[...new Set(dup)].join(', ')}`);
  }
  for (const m of senseCamp) {
    falla(LLEI, CENS, 0,
      `«${m.nom || m.id}» sense nom/fortalesa/debilitat/rol. La Regla Sagrada exigix respectar les característiques úniques de cadascuna: sense elles no es pot assignar rol.`);
  }
  if (!dup.length && !senseCamp.length) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   Recorregut de documents
   ══════════════════════════════════════════════════════════════════ */
const SALTA = new Set([
  'node_modules', 'dist', 'build', 'coverage', '.git',
  '90_arxiu_historic', '_arxiu_wiki_de_poble', '.sdp-paperera'
]);

function arbre(rel, eixida = []) {
  const base = R(rel);
  if (!existsSync(base)) return eixida;
  for (const nom of readdirSync(base)) {
    if (SALTA.has(nom) || nom.startsWith('.quarantena')) continue;
    const abs = path.join(base, nom);
    const sub = path.join(rel, nom);
    if (statSync(abs).isDirectory()) arbre(sub, eixida);
    else if (nom.endsWith('.md') && !nom.toUpperCase().includes('BUNDLE')) eixida.push(sub);
  }
  return eixida;
}

const DOCS = [
  ...arbre('.agents'),
  ...arbre('_wiki_de_poble')
];

/* Un document «parla del Consell com a conjunt» si menciona el Consell o les
   Petorretes I anomena almenys tres membres. Menys de tres és una cita, no
   un cens: citar Qwen en una frase no obliga a anomenar-les totes. */
const LLINDAR_CENS = 1;
const PARLA_DEL_CONJUNT =
  /\b(el\s+consell|les\s+petorret|família\s+electrònica|familia\s+electronica)/i;

function nomsPresents(text) {
  return noms.filter((n) => {
    const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\w.-])${esc}([^\\w-]|$)`, 'i').test(text);
  });
}

/* ══════════════════════════════════════════════════════════════════
   C2 · Cap cens incomplet
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'C2 · Cens incomplet';
  let net = true;
  for (const rel of DOCS) {
    if (rel.replace(/\\/g, '/') === CENS) continue;
    const text = readFileSync(R(rel), 'utf8');
    if (!PARLA_DEL_CONJUNT.test(text)) continue;
    const presents = nomsPresents(text);
    if (presents.length < LLINDAR_CENS) continue;
    if (presents.length === N) continue;
    net = false;
    const falten = noms.filter((n) => !presents.includes(n));
    falla(LLEI, rel, 0,
      `Parla del Consell i n'anomena ${presents.length} de ${N}. Falten: ${falten.join(', ')}.`);
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   C3 · Cap membre inventada
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'C3 · Membre fora del cens';
  const SOSPITOSES = Object.keys(cens.no_membres || {});
  let net = true;
  for (const rel of DOCS) {
    if (rel.replace(/\\/g, '/') === CENS) continue;
    const linies = readFileSync(R(rel), 'utf8').split('\n');
    linies.forEach((l, i) => {
      if (!PARLA_DEL_CONJUNT.test(l) && !/\bpetorret/i.test(l)) return;
      for (const s of SOSPITOSES) {
        const re = new RegExp(`(^|[^\\w-])${s}([^\\w-]|$)`, 'i');
        if (!re.test(l)) continue;
        net = false;
        falla(LLEI, rel, i + 1,
          `Anomena «${s}» com a membre del Consell i no és al cens. ${cens.no_membres[s]}`);
      }
    });
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   C4 · Cap xifra que contradiga el cens
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'C4 · Xifra contradictòria';
  // En valencià «nou» és alhora 9 i «nou/nova», i «deu» és 10 i «deu».
  // Per això la xifra NOMÉS compta si va enganxada a un substantiu del
  // Consell. Una porta amb falsos positius s'ignora, i una porta ignorada
  // no és una porta.
  const LLETRES = { huit: 8, nou: 9, deu: 10, onze: 11, dotze: 12, tretze: 13, catorze: 14 };
  // Sempre en PLURAL: en valencià «nou model» és «un model nou», no «nou models».
  // Exigir el plural elimina el fals positiu sense perdre cap cas real.
  const SUBSTANTIU = '(IAs|intel·ligències|models|proveïdors|proveidors|petorretes|ties|germanes)';
  let net = true;
  for (const rel of DOCS) {
    if (rel.replace(/\\/g, '/') === CENS) continue;
    const linies = readFileSync(R(rel), 'utf8').split('\n');
    linies.forEach((l, i) => {
      // Xifra en lletra, enganxada al substantiu
      for (const [mot, val] of Object.entries(LLETRES)) {
        const re = new RegExp(`\\b${mot}\\s+${SUBSTANTIU}`, 'i');
        if (!re.test(l) || val === N) continue;
        net = false;
        falla(LLEI, rel, i + 1,
          `Diu «${mot}» (${val}) però el cens en té ${N}. → ${l.trim().slice(0, 88)}`);
      }
      // Xifra en dígit, enganxada al substantiu
      for (const m of l.matchAll(new RegExp(`\\b(\\d{1,2})\\s+${SUBSTANTIU}`, 'gi'))) {
        const val = Number(m[1]);
        if (val === N) continue;
        net = false;
        falla(LLEI, rel, i + 1,
          `Diu «${m[0]}» però el cens en té ${N}. → ${l.trim().slice(0, 88)}`);
      }
    });
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   C5 · La skill executiva ha de citar el cens
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'C5 · Skill executiva sense cens';
  const SKILL = '.agents/skills/skill-consell-i-colmena/SKILL.md';
  if (!existsSync(R(SKILL))) {
    falla(LLEI, SKILL, 0, 'Absent. És l\'única skill executiva que governa el Consell.');
  } else {
    const text = readFileSync(R(SKILL), 'utf8');
    const cita = /consell\.json/.test(text);
    // Llista oberta = una MATEIXA LÍNIA amb dos o més membres i un «etc.».
    // Els `triggers_on` poden portar noms solts; això no és un cens obert.
    const llistaOberta = text.split('\n').some(
      (l) => /\betc\.?/i.test(l) && nomsPresents(l).length >= 2
    );
    if (!cita) {
      falla(LLEI, SKILL, 0,
        'No cita `.agents/consell.json`. Mentre la única font executiva porte la llista dins del text, l\'agent reproduirà eixa llista i no el cens.');
    }
    if (llistaOberta) {
      falla(LLEI, SKILL, 0,
        'Conté una llista de noms acabada en «etc.». És exactament la conducta que el Mestre va observar en si mateix: l\'agent no inventa res, reproduïx la llista parcial que la seua font executiva li dona.');
    }
    if (cita && !llistaOberta) passa(LLEI);
  }
}

/* ══════════════════════════════════════════════════════════════════
   INFORME
   ══════════════════════════════════════════════════════════════════ */
const banda = '─'.repeat(72);
console.log(`\n🗳️  TRACTOR DEL CENS — ${N} membres actives al Consell\n   ${noms.join(' · ')}\n${banda}`);

for (const l of OK) console.log(`  ✅ ${l}`);

if (infraccions.length) {
  const perLlei = new Map();
  for (const i of infraccions) {
    if (!perLlei.has(i.llei)) perLlei.set(i.llei, []);
    perLlei.get(i.llei).push(i);
  }
  console.log(`\n❌ INFRACCIONS (${infraccions.length})\n${banda}`);
  for (const [llei, llista] of perLlei) {
    console.log(`\n  ${llei}  (${llista.length})`);
    for (const i of llista.slice(0, 12)) {
      console.log(`    ${i.fitxer}${i.linia ? ':' + i.linia : ''}`);
      console.log(`      ↳ ${i.missatge}`);
    }
    if (llista.length > 12) console.log(`    … i ${llista.length - 12} més.`);
  }
  console.log(`\n${banda}`);
  console.log('La Regla Sagrada no es complix. Ara sí que és mecànica.\n');
  process.exit(1);
}

console.log(`\n${banda}\nEl cens i la doctrina diuen el mateix. Cap Petorreta oblidada.\n`);
process.exit(0);
