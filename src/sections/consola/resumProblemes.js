/**
 * resumProblemes.js — el resum dels problemes d'una targeta de la Consola,
 * sense React.
 *
 * Gauntlet 261030 (cicle 4, corrector de la Consola; troballa
 * «redaccio-mecanica-repetida») · L'Índex de la Consola (indexConsola.js, que
 * no importa cap component) ha de nomenar els problemes d'una peça amb les
 * mateixes línies que la seua coberta. Per això nomCurt i resumDeProblemes
 * viuen ací, sense canviar ni una línia, i peces.jsx els importa i els
 * reexporta amb el mateix nom: la targeta i l'Índex resumixen igual.
 */
import { MAX_PROBLEMES_TARGETA } from './problemesConsola.js';

/** El nom curt d'una ruta: l'últim tram, amb la barra final si és una carpeta (`_wiki_de_poble/10_actes/` → `10_actes/`). */
export function nomCurt(ruta) {
  const tot = String(ruta ?? '');
  const ultim = tot.split('/').filter(Boolean).at(-1) ?? tot;
  return tot.endsWith('/') && ultim !== tot ? `${ultim}/` : ultim;
}

/**
 * Ordre del Mestre, 30-10-2026 (punt 1.3) · El resum dels problemes per a la
 * coberta d'una targeta: { visibles, resta }. Cada línia és { clau, marca,
 * to, text, curt, n }: els problemes amb la mateixa marca i el mateix text
 * fan una línia i `n` diu quants casos són; el que només és una ruta porta
 * el seu nom curt (`curt`): l'últim tram de la ruta o, si és una evidència
 * del Mapa («torn_… · actor · estat · caducat el …»), el seu primer tros.
 * Sense ruta sencera: la llista detallada és a la pàgina. Com a molt `max`
 * línies, en l'ordre dels problemes (el més greu primer); `resta` compta els
 * casos que no hi caben.
 */
export function resumDeProblemes(problemes, max = MAX_PROBLEMES_TARGETA) {
  const linies = new Map();
  for (const p of Array.isArray(problemes) ? problemes.filter(Boolean) : []) {
    const text = String(p.text ?? '');
    const curt = !text && p.ruta ? nomCurt(String(p.ruta).split(' · ')[0]) : null;
    const clau = [p.marca ?? '', p.to ?? '', text, curt ?? ''].join('|');
    const linia = linies.get(clau);
    if (linia) linia.n += 1;
    else linies.set(clau, { clau, marca: p.marca ?? null, to: p.to ?? 'neutre', text, curt, n: 1 });
  }
  const totes = [...linies.values()];
  return { visibles: totes.slice(0, max), resta: totes.slice(max).reduce((n, l) => n + l.n, 0) };
}
