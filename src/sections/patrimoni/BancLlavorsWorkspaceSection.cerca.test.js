/* v1.2.22 · Gauntlet R2 (M4-04) · La cerca del Workspace de /page/banc-de-llavors llig els mateixos camps que
   filtraEntrades (nom, nom científic, nom de l'índex, origen, `llista` i `altres`) i l'autoria de la font. Prova pura:
   els elements de elementsDelBancDeLlavors passen pel mateix filtre que aplica el Workspace (filterWorkspaceItems). */
import { describe, expect, test } from 'vitest';
import { ALL_CATEGORY_ID, filterWorkspaceItems } from '../../components/universal/workspace/workspaceState.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg, filtraEntrades, textDeCercaDeLEntrada } from '../../data/patrimoni/bancLlavors.js';
import { elementsDelBancDeLlavors } from './BancLlavorsWorkspaceSection.jsx';

const ESTAT = Object.freeze({ activeCategoryId: ALL_CATEGORY_ID, activeTagIds: [], query: '' });
const cerca = (elements, query) => filterWorkspaceItems(elements, { ...ESTAT, query }).map((e) => e.id);

describe('v1.2.22 · M4-04 · la cerca del Banc de llavors al Workspace', () => {
  const elements = elementsDelBancDeLlavors();
  const totes = FONTS_BANC_LLAVORS.flatMap((font) => entradesDelCataleg(font.id).map((entrada) => ({ font, entrada })));

  test('«Alfafara», el nom de la font a la pàgina 78, troba l’olivera Alfafarenca, com a filtraEntrades', () => {
    expect(cerca(elements, 'Alfafara')).toEqual(['olivera-alfafarenca']);
    expect(cerca(elements, 'Alfafarenca')).toEqual(['olivera-alfafarenca']);
    expect(filtraEntrades(totes.map(({ entrada }) => entrada), 'Alfafara').map((e) => e.id)).toEqual(['olivera-alfafarenca']);
  });

  test('cada element porta els camps de filtraEntrades i l’autoria de la font', () => {
    expect(elements).toHaveLength(totes.length);
    elements.forEach((element, i) => {
      const { font, entrada } = totes[i];
      expect(element.id).toBe(entrada.id);
      expect(element.searchText).toContain(textDeCercaDeLEntrada(entrada));
      expect(element.searchText).toContain(font.autoria);
    });
  });

  test('cap nom de `llista` ni d’`altres` de cap font queda sense la seua entrada', () => {
    const perduts = [];
    let noms = 0;
    for (const { entrada } of totes) {
      for (const nom of [...(entrada.dada?.llista ?? []), ...(entrada.dada?.altres ?? [])]) {
        if (!String(nom ?? '').trim()) continue;
        noms += 1;
        if (!cerca(elements, nom).includes(entrada.id)) perduts.push(`${entrada.id} ← «${nom}»`);
      }
    }
    // Avui són 28 noms; amb el searchText d'abans (nom, nom científic i autoria) se'n perdien 26.
    expect(noms).toBeGreaterThan(26);
    expect(perduts).toEqual([]);
  });
});
