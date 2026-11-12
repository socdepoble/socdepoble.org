import { describe, expect, it } from 'vitest';
import { buscaArbreMonumental2020 } from './arbresMonumentals2020.js';
import { calculaDeltaLongitudinalArbre, projectaFitxaCiefV232, revisionsDeLArbre } from './revisionsArbresCief.js';

describe('R18 · una fotografia conserva la seua data i el seu abast documental', () => {
  it('mostra la titularitat pendent quan la font conserva un propietari desconegut', () => {
    const arbre = { ...buscaArbreMonumental2020(19), propietari: null };
    const titularitat = projectaFitxaCiefV232(arbre).find(camp => camp.clau === 'titularitat').valor;
    expect(titularitat).toContain('Pendent d’acreditar');
    expect(titularitat).not.toContain('null');
  });

  it('manté pendent una qualificació CIEF que la font no consigna explícitament', () => {
    const arbre = buscaArbreMonumental2020(1);
    const foto = revisionsDeLArbre(arbre).find(revisio => revisio.any === 2020);
    expect(foto.afectacio).toBeNull();
    const delta = calculaDeltaLongitudinalArbre(arbre, 10, 2026);
    expect(delta.deltaGravetat).toBeNull();
    expect(delta.nivellActual).toBeNull();
    expect(delta.tendeciaText).toMatch(/pendent/i);
  });

  it('les cotes de 2007 no es daten de nou en la revisió fotogràfica de 2020', () => {
    const arbre = buscaArbreMonumental2020(1);
    const foto = revisionsDeLArbre(arbre).find(revisio => revisio.any === 2020);
    const camps = projectaFitxaCiefV232(arbre, foto);
    expect(camps.find(camp => camp.clau === 'alcadaTotalM').valor).toMatch(/pendent/i);
    expect(camps.find(camp => camp.clau === 'inspeccioIAfectacio').valor).toMatch(/pendent/i);
    expect(calculaDeltaLongitudinalArbre(arbre).anyUltimaRevisio).toBe(2007);
  });
});
