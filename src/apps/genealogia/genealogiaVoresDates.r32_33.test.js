// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { CODIS_IDIOMA_GENEALOGIA } from './i18nGenealogia.js';
import { detectaContradiccions } from './nucli/cronologia.js';
import { etiquetaData, intervalAny } from './nucli/dates.js';
import { creaArbre, creaPersona } from './nucli/model.js';

describe('Onada R32.33 · Arbre Genealogic · vores de dates GEDCOM i etiquetes en 5 llengues', () => {
  test('intervalAny rebutja intervals GEDCOM BET/FROM corruptes o invertits sense emetre NaN', () => {
    expect(intervalAny({ precisio: 'aproximada', any: 1900, mes: null, dia: null, gedcom: 'BET 1900 AND corrupte' })).toBeNull();
    expect(intervalAny({ precisio: 'aproximada', any: 1920, mes: null, dia: null, gedcom: 'BET 1920 AND 1910' })).toBeNull();
    expect(intervalAny({ precisio: 'aproximada', any: 1910, mes: null, dia: null, gedcom: 'FROM 1910 TO invalid' })).toBeNull();
    expect(intervalAny({ precisio: 'aproximada', any: 1900, mes: null, dia: null, gedcom: 'BET 1900 AND 1905' })).toEqual({ min: 1900, max: 1905 });
  });

  test('detectaContradiccions no propaga NaN quan una persona du un camp gedcom malmés', () => {
    const arbre = creaArbre({ id: 'a1', nom: 'Casa', ara: '2026-10-01T00:00:00.000Z' });
    const persona = creaPersona({ id: 'p1', arbreId: 'a1', nom: 'Joan', ara: '2026-10-01T00:00:00.000Z' }, { anyActual: 2026 });
    const malmesa = {
      ...persona,
      naixement: { precisio: 'aproximada', any: 1950, mes: null, dia: null, gedcom: 'BET 1950 AND text' },
      defuncio: { precisio: 'exacta', any: 1940, mes: null, dia: null },
    };
    const alertes = detectaContradiccions({ arbre, persones: [malmesa], relacions: [] }, { anyActual: 2026 });
    expect(Array.isArray(alertes)).toBe(true);
    expect(JSON.stringify(alertes)).not.toContain('NaN');
  });

  test('etiquetaData formata coherentment les 5 llengues (amb ordre AAAA/MM/DD en basc)', () => {
    const exacta = { precisio: 'exacta', any: 1908, mes: 3, dia: 12 };
    for (const idioma of CODIS_IDIOMA_GENEALOGIA) {
      const resultat = etiquetaData(exacta, idioma);
      expect(resultat).toBe(idioma === 'eu' ? '1908/03/12' : '12/03/1908');
    }
  });
});
