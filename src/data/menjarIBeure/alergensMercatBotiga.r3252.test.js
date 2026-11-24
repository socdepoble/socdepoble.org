// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { ALERGENS, matriuDeProducte } from './allergens.js';
import { producteBotigaAmbAlergens, matriuProducteBotiga } from './alergensMercatBotiga.js';
import { PRODUCTES } from '../../apps/nevera/nucli/productes.js';
import { ARTICLES_PRODUCTES, FONT, PRODUCTES_AMB_ALERGENS, producteBotigaPerId, matriuBotigaPerId } from '../../apps/nevera/nucli/index.js';
import { alimentMercat, matriuAlimentMercat } from '../../sections/mercat/alergensMercat.js';
import { mapSectionSubmissionToItem } from '../mapejadorSeccions.js';

const oli = () => ({
  id: 'oli-prova-250-ml', title: 'Oli de prova · botella 250 ml', type: 'product', category_slug: 'alimentacio',
  description: '<p>Naturalment lliure de gluten i al·lèrgens. Notes d’ametla i ús amb pa.</p>',
  variations: [{ id: 'botella-250', name: '250 ml', description: 'Sense gluten ni traces', price: '4,95 €' }]
});
const desconeguda = (matriu) => {
  expect(Object.keys(matriu)).toEqual(ALERGENS);
  for (const cell of Object.values(matriu)) expect(cell).toEqual({ estat: 'desconegut', simbol: '?', font: null });
};

describe('R32.52 · Corpus 6 comercial', () => {
  test('els 592 productes es projecten sense alterar les files ni els articles publicats', () => {
    expect(PRODUCTES).toHaveLength(592);
    expect(PRODUCTES_AMB_ALERGENS).toHaveLength(592);
    for (const [index, fila] of PRODUCTES.entries()) {
      const producte = PRODUCTES_AMB_ALERGENS[index];
      expect(fila).toHaveLength(8);
      expect(Object.isFrozen(fila)).toBe(true);
      expect(producteBotigaAmbAlergens(fila)).toEqual({ ...producte,
        procedenciaAlergens: expect.objectContaining({ origenVerificat: false, fitxer: null, tall: null }) });
      expect(producte.id).toBe(ARTICLES_PRODUCTES[index].id);
      expect(producte.procedenciaAlergens.tall).toBe(FONT.tall);
      expect(producteBotigaPerId(fila[0])).toBe(producte);
      desconeguda(matriuBotigaPerId(fila[0]));
      desconeguda(matriuDeProducte(producte));
    }
  });

  test('sense envàs acreditat hi ha traçabilitat i advertiment, cap font positiva ni aptitud', () => {
    for (const producte of [PRODUCTES_AMB_ALERGENS[0], alimentMercat(oli())]) {
      expect(producte.fontAlergens).toBeNull();
      expect(producte.estatEvidenciaAlergens).toBe('sense_fitxa_envas_acreditada');
      expect(producte.acreditatPerAlConsum).toBe(false);
      expect(producte.abastAlergens).toMatch(/cap declaració/);
      expect(producte.avisAlergens).toMatch(/Desconegut no acredita absència/);
      expect(producte.avisAlergens).toMatch(/aptitud per al consum/);
      expect(producte.procedenciaAlergens.canal).toMatch(/botiga|mercat/);
      for (const camp of ['alergens', 'tracesAlergens', 'alergensAbsents']) {
        expect(producte[camp]).toEqual([]);
        expect(Object.isFrozen(producte[camp])).toBe(true);
      }
    }
  });

  test('el camí real del mapejador Mercat arriba al contracte de matriu sense inferir la prosa', () => {
    const entrada = oli();
    const abans = structuredClone(entrada);
    const mapat = mapSectionSubmissionToItem({ id: entrada.id, sectionId: 'mercat', createdAt: '2026-11-23T17:00:00Z', payload: entrada });
    expect(mapat.id).toBe(entrada.id);
    expect(mapat.type).toBe('product');
    expect(mapat.category_slug).toBe('alimentacio');
    expect(mapat.variations).toHaveLength(1);
    const projectat = alimentMercat(mapat);
    expect(projectat).not.toBeNull();
    expect(projectat.procedenciaAlergens.origenVerificat).toBe(false);
    expect(projectat.procedenciaAlergens.colleccio).toBeNull();
    expect(projectat).not.toHaveProperty('description');
    expect(projectat).not.toHaveProperty('variations');
    desconeguda(matriuAlimentMercat(mapat));
    desconeguda(matriuDeProducte(projectat));
    expect(entrada).toEqual(abans);
  });

  test('ni categoria, nom, marca ni variants certifiquen un aliment o cap estat', () => {
    for (const nom of ['Llet', 'Peix', 'Ous', 'Ametles', 'Sin gluten', 'Sense al·lèrgens', 'Oli de La Torre']) {
      const fila = ['mer-prova', nom, 'carn-peix', 'Sin trazas', 'Certificat', 1, 'u', 1];
      desconeguda(matriuProducteBotiga(fila));
      const producte = alimentMercat({ ...oli(), title: nom, category_slug: 'roba', type: 'market' });
      expect(producte.acreditatPerAlConsum).toBe(false);
      desconeguda(matriuDeProducte(producte));
    }
  });

  test('una declaració lliure o un booleà d’envàs verificat no són acreditació', () => {
    const item = { ...oli(), alergens: ['llet'], tracesAlergens: ['ous'], alergensAbsents: ALERGENS,
      fontAlergens: 'Fitxa acreditada https://example.invalid/etiqueta.pdf',
      evidenciaEnvas: { verificada: true, lot: 'prova', sha256: 'a'.repeat(64) }, acreditatPerAlConsum: true };
    expect(alimentMercat(item).fontAlergens).toBeNull();
    expect(alimentMercat(item).acreditatPerAlConsum).toBe(false);
    desconeguda(matriuAlimentMercat(item));
  });

  test('malformats, desconeguts i objectes amb coerció no generen ni declaracions ni errors', () => {
    let crides = 0;
    const hostil = { [Symbol.toPrimitive]() { crides++; throw new Error('coerció'); } };
    const accessors = { ...oli() };
    Object.defineProperty(accessors, 'title', { get() { crides++; throw new Error('getter'); } });
    for (const item of [null, undefined, [], {}, 1, Symbol('id'), { ...oli(), id: hostil }, accessors]) {
      expect(alimentMercat(item)).toBeNull();
      desconeguda(matriuAlimentMercat(item));
    }
    for (const id of [null, {}, hostil, '__proto__', 'constructor', 'mer-inexistent']) {
      expect(producteBotigaPerId(id)).toBeNull();
      desconeguda(matriuBotigaPerId(id));
    }
    expect(crides).toBe(0);
  });

  test('camps comercials de declaració, prosa i URL amb getters hostils no s’executen', () => {
    let crides = 0;
    const entrada = { ...oli() };
    for (const camp of ['description', 'fontAlergens', 'alergens', 'tracesAlergens', 'alergensAbsents', 'evidenciaEnvas', 'external_url']) Object.defineProperty(entrada, camp, { get() { crides++; throw new Error('getter'); } });
    desconeguda(matriuAlimentMercat(entrada));
    expect(alimentMercat(entrada)).not.toBeNull();
    expect(crides).toBe(0);
  });

  test('les eixides congelades impedixen contaminar lectures i no congelen el payload rebut', () => {
    const entrada = oli();
    const projectat = alimentMercat(entrada), matriu = matriuAlimentMercat(entrada);
    expect(Object.isFrozen(entrada)).toBe(false);
    expect(Object.isFrozen(projectat)).toBe(true);
    expect(Object.isFrozen(projectat.procedenciaAlergens)).toBe(true);
    expect(() => projectat.alergens.push('llet')).toThrow(TypeError);
    expect(() => { matriu.gluten.estat = 'absent'; }).toThrow(TypeError);
    entrada.alergens = ['llet'];
    desconeguda(matriuAlimentMercat(entrada));
  });
});
