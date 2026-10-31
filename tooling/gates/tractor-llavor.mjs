#!/usr/bin/env node
/**
 * tractor-llavor.mjs — LA LLAVOR NO PORTA DADES PERSONALS DE TERCERES PERSONES
 *
 * Decisió del Mestre (30-10-2026, «Identitat de fundador») · La identitat
 * pública del fundador és consentida i declarada: PERSONA_PILOT de
 * src/data/identitatsSeed.js, la font única del padró pilot. La porta n'admet
 * el nom i el correu declarats (p.nom, p.correu i CORREU_PERSONA_PILOT); l'àlies
 * no el llig. Abans només buscava el literal del seu nom, que el Bloc -1
 * (Identitat Dual, 261016) va tornar a la llavor. De terceres persones caça els
 * correus, els telèfons i els NIF/NIE, però no els noms: un nom sense cap
 * d'eixes dades passa. Un detector de noms, o una llista més llarga a
 * NOMS_VIGILATS, és decisió del Mestre.
 *
 * ABAST: supabase/seed.sql i src/data/appSeed.js (els de sempre).
 *
 * LLEIS (cap valor al diagnòstic: fitxer, línia, llei i recompte)
 *   P1 · IDENTITAT DECLARADA — un nom vigilat (NOMS_VIGILATS) només hi pot
 *        aparéixer mentre siga el nom de la identitat fundacional declarada.
 *        NOMS_VIGILATS només porta eixe nom: P1 cau si la declaració en canvia
 *        el nom, no amb el nom d'una altra persona.
 *   P2 · CORREU — cap correu fora dels dominis sintètics (RFC 2606 i 6761:
 *        example.com/net/org, .example, .test, .invalid, .localhost) o
 *        institucionals (DOMINIS_INSTITUCIONALS), del correu declarat del
 *        fundador o dels de l'avís legal.
 *   P3 · TELÈFON — cap telèfon fora dels de l'avís legal: l'espanyol (9 xifres
 *        de 6 a 9; +34, 0034, 34 o res davant; espais, punts, guions o el
 *        prefix entre parèntesis), també darrere d'una paraula i una barra
 *        («mòbil/…», cap URL ni camí), l'enllaç de WhatsApp (wa.me/…,
 *        whatsapp.com/send?phone=…) i l'estranger (+ o 00 i el codi del país).
 *   P4 · NIF/NIE — cap NIF ni NIE amb la lletra de control vàlida fora dels de
 *        l'avís legal, en les formes que normalitzaNif de la Gestoria admet
 *        (src/sections/gestoria/nucli/nif.js): punts, espais o guions, el
 *        prefix ES i la lletra en minúscula (esta, enganxada a les xifres o
 *        darrere d'un guió, perquè «12.345.678 i» d'un text no hi compte).
 *   Decisió del Mestre (30-10-2026): la porta «continua caçant correus,
 *   telèfons i NIF/NIE de terceres persones», en totes les formes habituals
 *   (Gauntlet f6, llavor-detectors-cecs-formats-comuns).
 *
 * L'avís legal és src/sections/text/legalContent.js (LSSI, art. 10): el
 * titular hi ha de constar amb el NIF, i els valors que hi consten són els
 * únics admesos per P2, P3 i P4. La llavor en porta una còpia (pàgina legal).
 *
 * Fail-closed: sense la declaració de la identitat fundacional, eixida 2.
 * Ús: node tooling/gates/tractor-llavor.mjs   (des de l'arrel del repositori)
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ARREL = process.cwd();
const FITXERS = ['supabase/seed.sql', 'src/data/appSeed.js'];
const DECLARACIO = 'src/data/identitatsSeed.js';
const AVIS_LEGAL = 'src/sections/text/legalContent.js';

/** Noms de persones reals que la porta ha vigilat sempre (el literal de la porta antiga). */
const NOMS_VIGILATS = ['Javi Llinares'];
/** Domini propi del projecte (avís legal i adreces de contacte). */
const DOMINIS_INSTITUCIONALS = ['socdepoble.org'];
const DOMINIS_SINTETICS = ['example.com', 'example.net', 'example.org'];
const TLD_SINTETICS = ['example', 'test', 'invalid', 'localhost'];

/* Detectors amb quantificadors fitats i frontera esquerra (cap ReDoS). */
const CORREU = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@([A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63}){1,8})/g;
/* P3: el nucli espanyol, amb el prefix entre parèntesis («(96) 123 45 67») i el 34 sense + ni 00. */
const TELEFON_NUCLI = String.raw`(?:(?:\+|00)?34[\s.-]?)?\(?[6789](?:\)?[\s.-]?\d){8}(?![\w]|[.,/-]?\d)`;
const TELEFON = new RegExp(String.raw`(?<![\w.,/+-])${TELEFON_NUCLI}`, 'g');
/* Darrere d'una barra només si la precedix una paraula soltera («mòbil/…»): cap URL
   («vimeo.com/…», «https://…/…»), cap camí («/assets/…») ni cap fitxer («…/612345678.jpg»). */
const TELEFON_BARRA = new RegExp(String.raw`(?<=(?:^|[\s"'\x60(>:;=,])\p{L}{1,24}\/)${TELEFON_NUCLI}(?!\.\p{L})`, 'gu');
const WHATSAPP = /\bwa\.me\/\+?(\d{8,15})|\bwhatsapp\.com\/send\?phone=\+?(\d{8,15})/g;
const INTERNACIONAL = /(?<![\w.,/+-])(?:\+|00)(?!34)[1-9]\d{0,2}(?:[\s.-]?\d){6,12}(?![\w]|[.,/-]?\d)/g;
/* P4: majúscula darrere d'un separador opcional; minúscula, enganxada o darrere d'un guió. */
const NIF = /(?<![A-Za-z0-9])(?:[Ee][Ss][\s-]?)?([XYZxyz][\s.-]?\d{7}|\d{2}[.\s]?\d{3}[.\s]?\d{3})(?:[\s.-]?([A-Z])|-?([a-z]))(?![A-Za-z0-9])/g;
const LLETRES_NIF = 'TRWAGMYFPDXBNJZSQVHLCKE';

const nifValid = (numero, lletra) =>
  LLETRES_NIF[Number(numero.replace(/^[XYZ]/, (x) => String('XYZ'.indexOf(x)))) % 23] === lletra;
const xifres = (text) => text.replace(/\D/g, '').replace(/^00/, '').replace(/^34(?=\d{9}$)/, '');

function correus(text) {
  return [...text.matchAll(CORREU)].map((m) => ({ valor: m[0].toLowerCase(), domini: m[1].toLowerCase(), index: m.index }));
}
/* Un telèfon que casen dos detectors (whatsapp.com/send?phone=34…) compta una vegada. */
function telefons(text) {
  const trobades = [TELEFON, TELEFON_BARRA, WHATSAPP, INTERNACIONAL].flatMap((re) => [...text.matchAll(re)])
    .map((m) => ({ valor: xifres(m[1] || m[2] || m[0]), index: m.index, fi: m.index + m[0].length }))
    .sort((a, b) => a.index - b.index);
  const uniques = [];
  for (const t of trobades) if (!uniques.length || t.index >= uniques[uniques.length - 1].fi) uniques.push(t);
  return uniques.map(({ valor, index }) => ({ valor, index }));
}
/* Normalitzat com normalitzaNif: sense separadors ni prefix, la lletra en majúscula. */
function nifs(text) {
  return [...text.matchAll(NIF)]
    .map((m) => ({ numero: m[1].toUpperCase().replace(/[\s.-]/g, ''), lletra: (m[2] || m[3]).toUpperCase(), index: m.index }))
    .filter((n) => nifValid(n.numero, n.lletra))
    .map((n) => ({ valor: `${n.numero}${n.lletra}`, index: n.index }));
}

const dominiSintetic = (domini) => {
  const tld = domini.split('.').pop();
  return TLD_SINTETICS.includes(tld) || DOMINIS_SINTETICS.some((d) => domini === d || domini.endsWith(`.${d}`));
};
const dominiInstitucional = (domini) => DOMINIS_INSTITUCIONALS.some((d) => domini === d || domini.endsWith(`.${d}`));

async function identitatDeclarada() {
  const abs = path.join(ARREL, DECLARACIO);
  if (!fs.existsSync(abs)) return null;
  try {
    const m = await import(pathToFileURL(abs).href);
    const p = m.PERSONA_PILOT;
    if (!p || typeof p.nom !== 'string' || !p.nom.trim()) return null;
    const correusDeclarats = [p.correu, m.CORREU_PERSONA_PILOT].filter((c) => typeof c === 'string' && c.includes('@'));
    return { nom: p.nom.trim(), correus: new Set(correusDeclarats.map((c) => c.trim().toLowerCase())) };
  } catch {
    return null;
  }
}

function avisLegal() {
  const abs = path.join(ARREL, AVIS_LEGAL);
  const text = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  return {
    correus: new Set(correus(text).map((c) => c.valor)),
    telefons: new Set(telefons(text).map((t) => t.valor)),
    nifs: new Set(nifs(text).map((n) => n.valor))
  };
}

const fundador = await identitatDeclarada();
if (!fundador) {
  console.error(`💥 tractor-llavor: no es pot llegir la identitat fundacional declarada (PERSONA_PILOT de ${DECLARACIO}). Fallem tancat.`);
  process.exit(2);
}
const legal = avisLegal();

const infraccions = [];
const linia = (text, index) => text.slice(0, index).split('\n').length;
function anota(llei, fitxer, text, trobades) {
  const perLinia = new Map();
  for (const t of trobades) {
    const l = linia(text, t.index);
    perLinia.set(l, (perLinia.get(l) || 0) + 1);
  }
  for (const [l, compte] of perLinia) infraccions.push({ llei, fitxer, linia: l, compte });
}

for (const fitxer of FITXERS) {
  const abs = path.join(ARREL, fitxer);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, 'utf8');

  for (const nom of NOMS_VIGILATS) {
    if (nom === fundador.nom) continue;
    const trobades = [];
    for (let i = text.indexOf(nom); i !== -1; i = text.indexOf(nom, i + nom.length)) trobades.push({ index: i });
    anota('P1 · nom de persona sense identitat fundacional declarada', fitxer, text, trobades);
  }
  anota('P2 · correu de tercers', fitxer, text, correus(text).filter((c) =>
    !dominiSintetic(c.domini) && !dominiInstitucional(c.domini) && !fundador.correus.has(c.valor) && !legal.correus.has(c.valor)));
  anota('P3 · telèfon', fitxer, text, telefons(text).filter((t) => !legal.telefons.has(t.valor)));
  anota('P4 · NIF/NIE', fitxer, text, nifs(text).filter((n) => !legal.nifs.has(n.valor)));
}

if (infraccions.length) {
  console.error('❌ tractor-llavor: la llavor porta dades personals de terceres persones.');
  for (const i of infraccions) console.error(`   ${i.llei} · ${i.fitxer}:${i.linia} (${i.compte} apar.)`);
  console.error(`   Només s'admet la identitat fundacional declarada (${DECLARACIO}) i l'avís legal (${AVIS_LEGAL}).`);
  process.exit(1);
}
console.log(`✅ tractor-llavor: cap dada personal de tercers. Identitat fundacional declarada: PERSONA_PILOT (${DECLARACIO}).`);
process.exit(0);
