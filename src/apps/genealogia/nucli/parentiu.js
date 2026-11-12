/**
 * parentiu.js — Arbre Genealògic · la llei «Cognom ≠ Parentiu» (IDEA-100).
 *
 * Adapta verificaVincleParentiuDocumentat del kit R111: un vincle només es
 * dona per bo amb un vincle generacional explícit, i el seu estat depén de
 * l'evidència (font escrita → confirmat; memòria oral → aproximat). Compartir
 * cognom al poble no acredita res.
 *
 * LLEI: cap funció del nucli, de gedcom ni d'arxius crea una relació a partir
 * d'un cognom. Ací només es detecta el cognom compartit per a avisar-ne.
 */

/** Màxim d'avisos de cognom compartit que es tornen (els cognoms comuns en farien milers). */
export const MAX_AVISOS_COGNOM = 500;

/** L'estat d'un vincle segons la seua evidència. */
export function estatDeVincle(evidencia) {
  const e = evidencia || {};
  if (e.fontEscrita === true && e.vincleExplicit === true) return 'confirmat';
  if (e.memoriaOral === true && e.vincleExplicit === true) return 'aproximat';
  return 'falta-confirmar';
}

/* Minúscules, sense accents ni espais repetits: «Martí» = «marti». */
export function normalitzaCognom(valor) {
  if (typeof valor !== 'string') return '';
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const cognomsDe = (persona) => [persona?.cognom1, persona?.cognom2].map(normalitzaCognom).filter((c) => c !== '');

/** true si les dues persones comparteixen algun cognom (primer o matern), normalitzat. */
export function mateixCognom(personaA, personaB) {
  const deB = new Set(cognomsDe(personaB));
  return cognomsDe(personaA).some((c) => deB.has(c));
}

/**
 * Verifica un vincle entre dues persones. Torna { vincleValid, estat, motiu }
 * amb motiu en clau: 'font-documental' | 'memoria-oral' |
 * 'cognom-no-es-parentiu' | 'sense-vincle'.
 */
export function verificaVincle(personaA, personaB, evidencia) {
  const estat = estatDeVincle(evidencia);
  if (estat === 'confirmat') return { vincleValid: true, estat, motiu: 'font-documental' };
  if (estat === 'aproximat') return { vincleValid: true, estat, motiu: 'memoria-oral' };
  return { vincleValid: false, estat, motiu: mateixCognom(personaA, personaB) ? 'cognom-no-es-parentiu' : 'sense-vincle' };
}

/* Els components connexos del graf de relacions (de qualsevol tipus). */
function components(complet) {
  const pare = new Map();
  const arrel = (id) => {
    let actual = id;
    while (pare.get(actual) !== actual) actual = pare.get(actual);
    let pas = id;
    while (pare.get(pas) !== actual) {
      const seguent = pare.get(pas);
      pare.set(pas, actual);
      pas = seguent;
    }
    return actual;
  };
  for (const persona of complet.persones) pare.set(persona.id, persona.id);
  for (const relacio of complet.relacions) {
    if (!pare.has(relacio.de) || !pare.has(relacio.a)) continue;
    const x = arrel(relacio.de);
    const y = arrel(relacio.a);
    if (x !== y) pare.set(x < y ? y : x, x < y ? x : y);
  }
  return arrel;
}

/**
 * Les parelles de persones que comparteixen cognom i que l'arbre NO connecta
 * per cap camí de relacions: la interfície hi recorda la llei «Cognom ≠
 * Parentiu». Mai crea cap relació. Ordre determinista; com a molt
 * MAX_AVISOS_COGNOM parelles.
 */
export function avisosCognom(complet) {
  if (!complet || !Array.isArray(complet.persones)) return [];
  const arrel = components(complet);
  const perCognom = new Map();
  for (const persona of complet.persones) {
    for (const cognom of new Set(cognomsDe(persona))) {
      if (!perCognom.has(cognom)) perCognom.set(cognom, []);
      perCognom.get(cognom).push(persona.id);
    }
  }
  const vistes = new Set();
  const avisos = [];
  for (const cognom of [...perCognom.keys()].sort()) {
    const ids = [...perCognom.get(cognom)].sort();
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        if (avisos.length >= MAX_AVISOS_COGNOM) return avisos;
        const [a, b] = [ids[i], ids[j]];
        const clau = `${a}|${b}`;
        if (vistes.has(clau) || arrel(a) === arrel(b)) continue;
        vistes.add(clau);
        avisos.push({ a, b });
      }
    }
  }
  return avisos.sort((x, y) => (x.a === y.a ? (x.b < y.b ? -1 : 1) : (x.a < y.a ? -1 : 1)));
}
