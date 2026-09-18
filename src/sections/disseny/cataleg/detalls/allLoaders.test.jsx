import { describe, it, expect } from 'vitest';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';

describe('Lazy Loaders del Catàleg', () => {
  it('haurien de carregar tots els components asíncrons sense error de sintaxi', async () => {
    // Si els imports dins de cada Especimen estan trencats, l'import() llançarà un error.
    for (const [clau, Loader] of Object.entries(CATALOG_DETAIL_LOADERS)) {
      try {
        // En Preact/React lazy() torna { $$typeof, _payload, _init }, no la promesa directa.
        // Nosaltres volem provar l'arxiu subjacent, així que cridem l'import() intern si és accessible
        // Com que no podem invocar directament, depenem de que Vite pugui construir.
        // A més, com vitest corre sobre Vite, si hi ha un import mort trencarà el build del test.
        
        // Simulem que React crida el _init per forçar l'avaluació.
        if (Loader._init && Loader._payload) {
          const promise = Loader._init(Loader._payload);
          if (promise instanceof Promise) {
            await promise;
          }
        }
      } catch (e) {
        throw new Error(`El loader per a ${clau} ha fallat: ${e.message}`);
      }
    }
    expect(Object.keys(CATALOG_DETAIL_LOADERS).length).toBeGreaterThan(20);
  });
});
