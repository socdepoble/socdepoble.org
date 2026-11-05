import { describe, expect, test } from 'vitest';
import {
  ENTITATS_SEED,
  ENTITAT_PILOT_ID,
  ENTITAT_PILOT_SLUG,
  ENTITAT_RENTONAR_SLUG,
  PERSONA_PILOT,
  aliesDeLActor,
} from './identitatsSeed.js';
import { aliesDeLaFitxa } from '../sections/profile/usePublicacionsDeLaFitxa.js';
import { deIdentitat } from '../sections/search/indexCerca.js';
import { propsDeTargetaDeResultat } from '../sections/search/targetaDeResultat.js';

describe('IDEA-73 · Sincronització universal d’aliesDeLaFitxa, aliesDeLActor i targetaDeResultat', () => {
  test('cada entitat del padró (Sóc de Poble, El Rentonar, Oli de La Torre) retorna el mateix conjunt d’àlies per id, slug o UUID remot', () => {
    for (const entitat of ENTITATS_SEED) {
      for (const identificador of [entitat.id, entitat.slug, ...(entitat.alies || [])]) {
        const desDeFitxa = aliesDeLaFitxa({ tipus: 'entitat', id: identificador });
        const desDActor = aliesDeLActor({ tipus: 'entitat', id: identificador });

        expect(desDeFitxa.has(entitat.id)).toBe(true);
        expect(desDeFitxa.has(entitat.slug)).toBe(true);
        expect(desDActor.has(entitat.id)).toBe(true);
        expect(desDActor.has(entitat.slug)).toBe(true);
        for (const alies of entitat.alies) {
          expect(desDeFitxa.has(alies)).toBe(true);
          expect(desDActor.has(alies)).toBe(true);
        }
      }
    }
  });

  test('un grup i una entitat amb l’UUID remot d’El Rentonar casen tant a aliesDeLaFitxa com a aliesDeLActor', () => {
    const uuidRentonar = 'b2c87505-53b1-4108-902f-2313e77b9968';
    const fitxaGrup = aliesDeLaFitxa({ tipus: 'grup', id: uuidRentonar });
    const actorGrup = aliesDeLActor({ tipus: 'grup', id: uuidRentonar });

    expect(fitxaGrup.has(ENTITAT_RENTONAR_SLUG)).toBe(true);
    expect(fitxaGrup.has(uuidRentonar)).toBe(true);
    expect(actorGrup.has(ENTITAT_RENTONAR_SLUG)).toBe(true);
    expect(actorGrup.has(uuidRentonar)).toBe(true);
  });

  test('un canvi de nom públic o @username en l’entrada d’identitat es reflecteix reactivament en propsDeTargetaDeResultat sense deixar noms fossilitzats', () => {
    const entradaInicial = deIdentitat(
      { tipus: 'persona', id: PERSONA_PILOT.id, nom: 'Nom Antic' },
      { poble: 'La Torre de les Maçanes' }
    );
    const actualitzada = propsDeTargetaDeResultat(entradaInicial, {
      nomActual: 'Javi Llinares',
      meta: ['@javillinares', 'La Torre de les Maçanes'],
    });

    expect(actualitzada.title).toBe('Javi Llinares');
    expect(actualitzada.location).toBe('@javillinares · La Torre de les Maçanes');
    expect(actualitzada.mainHref).toBe(`/${PERSONA_PILOT.slug}`);

    const entitatPilot = aliesDeLaFitxa({ tipus: 'entitat', id: ENTITAT_PILOT_ID });
    expect(entitatPilot.has(ENTITAT_PILOT_SLUG)).toBe(true);
  });
});
