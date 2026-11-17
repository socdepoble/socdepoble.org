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

import { existsSync, readdirSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { fontUTF8 } from '../lib/lexic-css.mjs';

function principal() {
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--arrel' || !args[1]?.trim() || args[1].startsWith('--'))) throw new Error('Ús: [--arrel DIR]');
const ARREL = (() => {
  const i = process.argv.indexOf('--arrel');
  return path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
})();

const R = (rel) => path.join(ARREL, rel);
const CENS = '.agents/consell.json';
// Un comentari HTML no compta, però conserva els seus salts de línia: el diagnòstic fitxer:línia no es desplaça.
const visible = text => text.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
const escapa = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const rel of ['.agents', '_wiki_de_poble']) {
  const s = lstatSync(R(rel));
  if (s.isSymbolicLink() || !s.isDirectory()) throw new Error(`Font no certificable: ${rel} (directori o symlink)`);
}
if (lstatSync(R(CENS)).isSymbolicLink() || !lstatSync(R(CENS)).isFile()) throw new Error(`Font no regular o symlink: ${CENS}`);

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
  cens = JSON.parse(fontUTF8(R(CENS), 'utf8'));
} catch (e) {
  console.error(`❌ PARAT. ${CENS} no és JSON vàlid: ${e.message}`);
  process.exit(2);
}

if (!cens || typeof cens !== 'object' || Array.isArray(cens) || !Array.isArray(cens.membres) || !cens.membres.length) throw new Error(`${CENS}: membres ha de ser una llista no buida`);
const textValid = v => typeof v === 'string' && Boolean(v.trim());
for (const m of cens.membres) {
  if (!m || typeof m !== 'object' || Array.isArray(m) || ['id', 'nom', 'fortalesa', 'debilitat', 'rol'].some(k => !textValid(m[k])) || (m.actiu !== undefined && typeof m.actiu !== 'boolean')) throw new Error(`${CENS}: membre invàlid (id, nom, fortalesa, debilitat, rol i actiu booleà)`);
}
if (cens.no_membres !== undefined && (!cens.no_membres || typeof cens.no_membres !== 'object' || Array.isArray(cens.no_membres) || Object.entries(cens.no_membres).some(([nom, motiu]) => !textValid(nom) || !textValid(motiu)))) throw new Error(`${CENS}: no_membres invàlid`);
const membres = cens.membres.filter((m) => m.actiu !== false);
if (!membres.length) throw new Error(`${CENS}: no hi ha cap membre actiu per certificar`);
const noms = membres.map((m) => m.nom);
const N = membres.length;

{
  const LLEI = 'C1 · Cens vàlid';
  const totsIds = cens.membres.map(m => m.id);
  const dup = totsIds.filter((x, i) => totsIds.indexOf(x) !== i);
  const senseCamp = membres.filter(
    (m) => !m.nom || !m.fortalesa || !m.debilitat || !m.rol
  );
  if (dup.length) {
    falla(LLEI, CENS, 0, `ids duplicats: ${[...new Set(dup)].join(', ')}`);
  }
  const nomsDuplicats = noms.filter((nom, i) => noms.findIndex(n => n.toLocaleLowerCase() === nom.toLocaleLowerCase()) !== i);
  if (nomsDuplicats.length) falla(LLEI, CENS, 0, `noms actius duplicats: ${[...new Set(nomsDuplicats)].join(', ')}`);
  for (const m of senseCamp) {
    falla(LLEI, CENS, 0,
      `«${m.nom || m.id}» sense nom/fortalesa/debilitat/rol. La Regla Sagrada exigix respectar les característiques úniques de cadascuna: sense elles no es pot assignar rol.`);
  }
  if (!dup.length && !nomsDuplicats.length && !senseCamp.length) passa(LLEI);
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
    const s = lstatSync(abs);
    if (s.isSymbolicLink()) throw new Error(`Symlink en documents del cens: ${sub}`);
    if (s.isDirectory()) arbre(sub, eixida);
    else if (nom.endsWith('.md') && !nom.toUpperCase().includes('BUNDLE')) {
      if (!s.isFile()) throw new Error(`Document no regular del cens: ${sub}`);
      eixida.push(sub);
    }
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
const LLINDAR_CENS = 3;
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
    const text = visible(fontUTF8(R(rel), 'utf8'));
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
    const linies = visible(fontUTF8(R(rel), 'utf8')).split('\n');
    linies.forEach((l, i) => {
      if (!PARLA_DEL_CONJUNT.test(l) && !/\bpetorret/i.test(l)) return;
      for (const s of SOSPITOSES) {
        const re = new RegExp(`(^|[^\\w-])${escapa(s)}([^\\w-]|$)`, 'i');
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
  // Per això la xifra exigix un substantiu plural i una afirmació explícita
  // sobre el CONJUNT. Quatre IAs locals o nou revisores no són el cens global.
  // El vincle es comprova per ocurrència: una línia pot descriure un subconjunt
  // correcte i, alhora, declarar un total contradictori que cal detectar.
  const LLETRES = { zero: 0, un: 1, una: 1, dos: 2, dues: 2, tres: 3, quatre: 4, cinc: 5, sis: 6, set: 7, huit: 8, vuit: 8, nou: 9, deu: 10, onze: 11, dotze: 12, tretze: 13, catorze: 14, quinze: 15, setze: 16, disset: 17, divuit: 18, dènou: 19, dinou: 19, vint: 20 };
  // Sempre en PLURAL: en valencià «nou model» és «un model nou», no «nou models».
  // Exigir el plural elimina el fals positiu sense perdre cap cas real.
  const SUBSTANTIU = '(?:IAs|intel·ligències|models|proveïdors|proveidors|petorretes|ties|germanes|membres)';
  const NUMERO = `(?:\\d+|${Object.keys(LLETRES).join('|')})`;
  const CONJUNT = String.raw`(?:(?:el\s+)?(?:consell|cens)|(?:l['’]|el\s+)(?:equip|conjunt)\s+(?:complet|sencer|total))`;
  const DEL_CONJUNT = String.raw`(?:del\s+(?:consell|cens|conjunt)(?:\s+(?:complet|sencer|total))?|de\s+(?:tot\s+)?l['’]equip\s+(?:complet|sencer|total))`;
  // «Consell de quatre IAs» també pot designar una convocatòria concreta;
  // la preposició sola no declara el recompte del conjunt permanent.
  const COMPUT = String.raw`(?:té|te|compta\s+amb|consta\s+de|està\s+format\s+per|esta\s+format\s+per|reuneix|inclou|agrupa|són|son|sumen)`;
  const QUALIFICADOR = String.raw`(?:(?:només|nomes|exactament|actualment|hui|avui|encara|les|els|un\s+total\s+de|en\s+total)\s+)*`;
  const PREFIX_GLOBAL = new RegExp(`\\b${CONJUNT}\\s*(?::|=)?\\s*${QUALIFICADOR}(?:${COMPUT}\\s+)?${QUALIFICADOR}$`, 'i');
  const SUFIX_GLOBAL = new RegExp(`^\\s*(?:,\\s*)?(?:(?:actives|actius)\\s+)?(?:${DEL_CONJUNT}|en\\s+total)\\b`, 'i');
  const TOTES = /\b(?:totes\s+les|la\s+totalitat\s+de\s+les)\s*$/i;
  const SUBCONJUNT = /^\s*(?:locals?|revisores?|revisors?|convocades?|del\s+(?:torn|carril|lot|gauntlet))\b/i;
  const TOTAL_EXPLICIT = /\b(?:en\s+total|un\s+total\s+de)\b/i;
  const TOTAL_DESPRES_SUBCONJUNT = /^\s*(?:locals?|revisores?|revisors?|convocades?)\s+en\s+total\b/i;
  const SUBJECTE_GLOBAL = `(?:totes\\s+les\\s+${SUBSTANTIU}(?:\\s+actives)?|(?:les|els)\\s+${SUBSTANTIU}\\s+${DEL_CONJUNT})`;
  const INVERTIT = new RegExp(`\\b${SUBJECTE_GLOBAL}\\s*(?::|=|són|son|sumen)\\s*${QUALIFICADOR}(${NUMERO})\\b`, 'gi');

  function recomptesGlobals(linia) {
    // El format Markdown no canvia el significat del recompte.
    const text = linia.replace(/[`*_]/g, '');
    const trobats = new Map();
    for (const m of text.matchAll(new RegExp(`\\b(${NUMERO})\\s+${SUBSTANTIU}\\b`, 'gi'))) {
      const abans = text.slice(0, m.index);
      const despres = text.slice(m.index + m[0].length);
      const prefix = PREFIX_GLOBAL.exec(abans)?.[0];
      const prefixTotal = prefix && (!SUBCONJUNT.test(despres)
        || TOTAL_EXPLICIT.test(prefix) || TOTAL_DESPRES_SUBCONJUNT.test(despres));
      if (prefixTotal || SUFIX_GLOBAL.test(despres)
          || TOTES.test(abans) && !SUBCONJUNT.test(despres)) {
        trobats.set(m.index, { literal: m[0], valor: LLETRES[m[1].toLowerCase()] ?? Number(m[1]) });
      }
    }
    for (const m of text.matchAll(INVERTIT)) {
      const literal = m[1];
      trobats.set(m.index + m[0].lastIndexOf(literal), { literal, valor: LLETRES[literal.toLowerCase()] ?? Number(literal) });
    }
    return [...trobats.values()];
  }
  let net = true;
  for (const rel of DOCS) {
    if (rel.replace(/\\/g, '/') === CENS) continue;
    const linies = visible(fontUTF8(R(rel), 'utf8')).split('\n');
    linies.forEach((l, i) => {
      for (const recompte of recomptesGlobals(l)) {
        if (recompte.valor === N) continue;
        net = false;
        falla(LLEI, rel, i + 1,
          `Diu «${recompte.literal}» però el cens en té ${N}. → ${l.trim().slice(0, 88)}`);
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
  const SKILL = '.agents/skills/core-consell-i-colmena/SKILL.md';
  if (!existsSync(R(SKILL))) {
    falla(LLEI, SKILL, 0, 'Absent. És l\'única skill executiva que governa el Consell.');
  } else {
    const text = visible(fontUTF8(R(SKILL), 'utf8'));
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
}

try { principal(); }
catch (error) { console.error(`❌ [TRACTOR-CENS] ${error.message}`); process.exit(2); }
