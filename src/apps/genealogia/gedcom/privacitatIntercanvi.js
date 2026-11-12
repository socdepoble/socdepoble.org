import { filtraVius } from '../nucli/vius.js';
import { comparaOrdreSosa } from '../nucli/sosa.js';

/** El text lliure d'una persona difunta pot identificar una persona viva. */
export function preparaIntercanvi(complet, { incloureVius = false, anyActual }) {
  const resultat = filtraVius(complet, { incloureVius, anyActual });
  if (!resultat.ocultes) return resultat;
  const { arbre, persones, relacions } = resultat.complet;
  return {
    ...resultat,
    complet: {
      arbre: { ...arbre, titol: 'Genealogia', malnomCasa: '', poble: '', mas: '' },
      persones: persones.map((p) => ({
        ...p, malnom: '', casa: '', lloc: '', ofici: '', notes: '', fonts: [], origen: null
      })),
      relacions: relacions.map((r) => ({ ...r, notes: '', fontIds: [] })),
      entrevista: null
    }
  };
}

/** Els identificadors locals i els instants originals tampoc ixen en una còpia amb persones ocultes. */
export function remapaCopiaRedactada(complet, ara) {
  const ids = new Map([...complet.persones].sort(comparaOrdreSosa).map((p, index) => [p.id, `p-${index + 1}`]));
  const arbreId = 'arbre';
  return {
    arbre: { ...complet.arbre, id: arbreId, arrelId: ids.get(complet.arbre.arrelId) ?? null, creat: ara, modificat: ara },
    persones: complet.persones.map((p) => ({
      ...p, id: ids.get(p.id), arbreId, sexe: p.privada ? 'U' : p.sexe, generacio: p.privada ? null : p.generacio,
      creada: ara, modificada: ara
    })),
    relacions: complet.relacions.map((r, index) => ({
      ...r, id: `r-${index + 1}`, arbreId, de: ids.get(r.de), a: ids.get(r.a), creada: ara, modificada: ara
    })),
    entrevista: null
  };
}
