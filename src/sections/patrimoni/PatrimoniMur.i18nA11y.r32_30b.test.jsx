import { describe, expect, test } from 'vitest';
import { codiLlenguaMur, textosMurA11y } from '../mur/i18nMurA11y.js';
import { codiLlenguaPatrimoni, textosPatrimoniA11y } from './i18nPatrimoniA11y.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

describe('Mur i Patrimoni · i18n diferit d’accessibilitat en 5 llengües (Onada R32.30b)', () => {
  test('Mur: filtres i regions amb apòstrof tenen traducció en ca, es, en, eu i gl sense claus crues', () => {
    const claus = Object.keys(textosMurA11y('ca'));
    for (const codi of LLENGUES) {
      expect(codiLlenguaMur(codi)).toBe(codi);
      const tx = textosMurA11y(codi);
      for (const clau of claus) {
        expect(typeof tx[clau], `${codi}.${clau}`).toBe('string');
        expect(tx[clau].trim().length).toBeGreaterThan(0);
        expect(tx[clau]).not.toContain('undefined');
      }
    }
    expect(textosMurA11y('ca').revisioWpRegioAria).toBe("Mode Revisió d'Importació de WordPress");
    expect(textosMurA11y('ca').filtraCasUsEditorialAria).toBe("Filtra per cas d'ús editorial");
    expect(textosMurA11y('en').filtresMurAria).toBe('Wall filters');
    expect(textosMurA11y('eu').filtreMostrarTot).toBe('Erakutsi dena');
  });

  test('Patrimoni: tots els aria-label de llavors, calendari, arbres i receptes existixen en 5 llengües', () => {
    const claus = Object.keys(textosPatrimoniA11y('ca'));
    expect(claus.length).toBeGreaterThanOrEqual(16);
    for (const codi of LLENGUES) {
      expect(codiLlenguaPatrimoni(codi)).toBe(codi);
      const tx = textosPatrimoniA11y(codi);
      for (const clau of claus) {
        expect(typeof tx[clau], `${codi}.${clau}`).toBe('string');
        expect(tx[clau].trim().length).toBeGreaterThan(0);
        expect(tx[clau]).not.toContain('undefined');
      }
    }
    expect(textosPatrimoniA11y('ca').intercanviDadesArbresAria).toBe('Intercanvi de dades d’arbres');
    expect(textosPatrimoniA11y('ca').seccionsFitxaArbreAria).toBe('Seccions de la fitxa d’arbre singular');
    expect(textosPatrimoniA11y('es').calendariAgricolaAria).toContain('Calendario agrícola');
    expect(textosPatrimoniA11y('en').preparaCompraReceptaAria).toBe('Prepare a shopping list from this recipe');
    expect(textosPatrimoniA11y('gl').cotesDendrometriquesAria).toContain('Cotas dendrométricas');
  });
});
