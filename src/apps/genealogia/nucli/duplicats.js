/** Suggeriments locals. Un cognom compartit no crea cap vincle ni cap fusió. */
import { indexa, netejaPersona } from './model.js';
import { errorCamp, MAX_FONTS_PER_PERSONA } from './segur.js';

const SIMETRIQUES = new Set(['parella', 'germa']);
const MAX_SUGGERIMENTS = 100;
const MAX_COMPARACIONS = 20000;
const clauParell = (a, b) => [a, b].sort().join('|');
const mateix = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const conflicte = () => errorCamp('persona', 'duplicat-conflicte');

function normalitza(valor) {
  return (valor || '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function datesCompatibles(a, b) {
  if (!a?.any || !b?.any) return true;
  if (a.any !== b.any) return false;
  if (a.mes && b.mes && a.mes !== b.mes) return false;
  return !(a.dia && b.dia && a.dia !== b.dia);
}

function provesDe(persona) {
  const nom = normalitza(persona.nom);
  const cognom = normalitza(persona.cognom1 || persona.cognom2);
  const data = persona.naixement;
  if (!nom || !cognom || data?.precisio !== 'exacta') return [];
  const parts = [];
  if (data.dia) parts.push(['data', nom, cognom, data.any, data.mes, data.dia]);
  const lloc = normalitza(persona.lloc);
  if (lloc) parts.push(['lloc-any', nom, cognom, data.any, lloc]);
  return parts.map((part) => JSON.stringify(part));
}

/**
 * Eixida amb ids locals i un codi d'evidència. Cap nom, data o lloc al resultat.
 * Els suggeriments no es guarden, i es calculen sobre el bolcat vigent.
 */
export function detectaDuplicats(complet) {
  const persones = [...(complet?.persones ?? [])].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const lligams = new Set((complet?.relacions ?? []).map((r) => clauParell(r.de, r.a)));
  const vistos = new Set();
  const grups = new Map();
  for (const persona of persones) {
    for (const clau of provesDe(persona)) {
      if (!grups.has(clau)) grups.set(clau, []);
      grups.get(clau).push(persona);
    }
  }
  const resultat = [];
  let comparacions = 0;
  for (const [clau, grup] of grups) {
    const [motiu] = JSON.parse(clau);
    for (let i = 0; i < grup.length - 1; i += 1) {
      const a = grup[i];
      for (let j = i + 1; j < grup.length; j += 1) {
        if (++comparacions > MAX_COMPARACIONS) return resultat;
        const b = grup[j];
        const clauIds = clauParell(a.id, b.id);
        if (vistos.has(clauIds) || lligams.has(clauIds) || !datesCompatibles(a.naixement, b.naixement)) continue;
        vistos.add(clauIds);
        const conservaB = b.id === complet.arbre.arrelId
          || (a.id !== complet.arbre.arrelId && !a.origen?.startsWith('entrevista:') && b.origen?.startsWith('entrevista:'));
        const [conserva, duplicada] = conservaB ? [b.id, a.id] : [a.id, b.id];
        resultat.push({ conserva, duplicada, motiu });
        if (resultat.length >= MAX_SUGGERIMENTS) return resultat;
      }
    }
  }
  return resultat;
}

function arribaA(fillsDe, inici, fi) {
  const vistos = new Set([inici]);
  const pendents = [inici];
  while (pendents.length) {
    const id = pendents.pop();
    if (id === fi) return true;
    for (const fill of fillsDe.get(id) ?? []) {
      if (vistos.has(fill)) continue;
      vistos.add(fill);
      pendents.push(fill);
    }
  }
  return false;
}

function uneixCamp(a, b, buit = '', compara = mateix) {
  if ((a ?? buit) === buit) return b;
  if ((b ?? buit) === buit || compara(a, b)) return a;
  throw conflicte();
}

function uneixData(a, b) {
  if (!a?.any) return b?.any ? b : a ?? b;
  if (!b?.any || mateix(a, b)) return a;
  if (a.precisio === 'exacta' && b.precisio === 'exacta' && datesCompatibles(a, b)) {
    const bMesPrecisa = Boolean((b.mes && !a.mes) || (b.dia && !a.dia));
    return bMesPrecisa ? b : a;
  }
  throw conflicte();
}

function uneixPersona(a, b, ara, anyActual) {
  const persona = { ...a, modificada: ara };
  const normalIgual = (x, y) => normalitza(x) === normalitza(y);
  for (const clau of ['nom', 'cognom1', 'cognom2', 'malnom', 'casa', 'lloc', 'ofici']) {
    persona[clau] = uneixCamp(a[clau], b[clau], '', normalIgual);
  }
  persona.naixement = uneixData(a.naixement, b.naixement);
  persona.defuncio = uneixData(a.defuncio, b.defuncio);
  persona.sexe = uneixCamp(a.sexe, b.sexe, 'U');
  persona.viva = uneixCamp(a.viva, b.viva, 'desconegut');
  persona.generacio = uneixCamp(a.generacio, b.generacio, null);

  const origenA = a.origen?.startsWith('entrevista:') ? a.origen : null;
  const origenB = b.origen?.startsWith('entrevista:') ? b.origen : null;
  persona.origen = uneixCamp(origenA, origenB, null) ?? a.origen ?? b.origen;
  if (a.estat === 'contradiccio' || b.estat === 'contradiccio') persona.estat = 'contradiccio';

  const fonts = new Map(a.fonts.map((font) => [font.id, font]));
  for (const font of b.fonts) {
    if (fonts.has(font.id) && !mateix(fonts.get(font.id), font)) throw conflicte();
    fonts.set(font.id, font);
  }
  persona.fonts = [...fonts.values()];
  persona.notes = [...new Set([a.notes, b.notes].filter(Boolean))].join('\n\n');
  if (persona.notes.length > 2000 || persona.fonts.length > MAX_FONTS_PER_PERSONA) throw conflicte();
  return netejaPersona(persona, { anyActual });
}

/** Només després d'una confirmació explícita i una lectura nova en la transacció. */
export function fusionaDuplicats(complet, { conserva, duplicada, confirmada, ara, anyActual }) {
  if (confirmada !== true || conserva === duplicada) throw errorCamp('persona');
  const { perId, fillsDe, relacionsDe } = indexa(complet);
  const a = perId.get(conserva);
  const b = perId.get(duplicada);
  if (!a || !b) throw conflicte();
  const provesB = new Set(provesDe(b));
  if (!provesDe(a).some((clau) => provesB.has(clau))) throw conflicte();
  if (relacionsDe.get(conserva)?.some((r) => r.de === duplicada || r.a === duplicada)
    || arribaA(fillsDe, conserva, duplicada) || arribaA(fillsDe, duplicada, conserva)) throw conflicte();

  const persona = uneixPersona(a, b, ara, anyActual);
  const remapa = (id) => id === duplicada ? conserva : id;
  const clauRelacio = (relacio) => {
    const { tipus, de, a: aId, estat, evidencia, notes, fontIds } = relacio;
    const extrems = SIMETRIQUES.has(tipus) ? [de, aId].sort() : [de, aId];
    return JSON.stringify([tipus, extrems, estat, evidencia, notes, [...fontIds].sort()]);
  };
  const relacions = complet.relacions.filter((r) => r.de !== duplicada && r.a !== duplicada);
  const existents = new Set(relacions.map(clauRelacio));
  for (const vincle of relacionsDe.get(duplicada) ?? []) {
    const nou = { ...vincle, de: remapa(vincle.de), a: remapa(vincle.a), modificada: ara };
    const clau = clauRelacio(nou);
    if (!existents.has(clau)) {
      relacions.push(nou);
      existents.add(clau);
    }
  }
  return {
    ...complet,
    arbre: { ...complet.arbre, arrelId: remapa(complet.arbre.arrelId), modificat: ara },
    persones: complet.persones.filter((p) => p.id !== duplicada).map((p) => p.id === conserva ? persona : p),
    relacions
  };
}
