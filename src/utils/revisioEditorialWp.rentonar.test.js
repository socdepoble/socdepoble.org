import { describe, expect, it } from 'vitest';
import {
  WP_IDS_CATALEG_ARBRES_RENTONAR,
  desaRevisioArticleImportatAmbServidor,
  esWpIdCatalegArbresRentonar,
  estatInicialArticleImportatWp,
  sincronitzaRevisionsEditorialsWpAmbServidor
} from './revisioEditorialWp.js';
import {
  AUTORIA_RENTONAR,
  ESTUDI_TECNIC_RENTONAR,
  ITEMS_CATALEG_ARBRES_RENTONAR_WP,
  trobaItemCatalegArbresRentonar
} from '../data/importacio/catalegArbresRentonarWp.js';
import {
  estadistiquesRevisioImportacio,
  lligArticlesImportatsAmbRevisio,
  lligCorpusImportatCompletAmbRevisio
} from './transformadorEditorialWpBlogger.js';
import { creaAdaptadorLocal } from '../data/local/adaptadorLocal.js';
import * as backendPort from '../data/backendPort.js';

function storageMemoria() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); }
  };
}

describe('P0-111 · Autoria sagrada Associació El Rentonar (20 ítems) + 423 pendents + sincronització port neutral', () => {
  it('verifica exactament 20 ítems d’El Rentonar (619 + 19 arbres incloent WP-1768 Llorer de Villa María) i MAI signats per Sóc de Poble', () => {
    expect(WP_IDS_CATALEG_ARBRES_RENTONAR).toHaveLength(20);
    expect(ITEMS_CATALEG_ARBRES_RENTONAR_WP).toHaveLength(20);
    expect(esWpIdCatalegArbresRentonar(619)).toBe(true);
    expect(esWpIdCatalegArbresRentonar(1768)).toBe(true);
    expect(esWpIdCatalegArbresRentonar(2014)).toBe(true);
    expect(esWpIdCatalegArbresRentonar(16893)).toBe(false);

    const llorer = trobaItemCatalegArbresRentonar(1768);
    expect(llorer.nom).toBe('Llorer de Villa María');
    expect(llorer.desti).toBe('arbres-monumentals');

    for (const item of ITEMS_CATALEG_ARBRES_RENTONAR_WP) {
      expect(estatInicialArticleImportatWp(item.wpId)).toBe('aprovat');
    }
  });

  it('separa al corpus complet de 443 entrades els 20 aprovats d’El Rentonar dels 423 pendent_admin', () => {
    const st = storageMemoria();
    const corpus443 = lligCorpusImportatCompletAmbRevisio(st);
    expect(corpus443).toHaveLength(443);

    const aprovats = corpus443.filter((x) => x.estat_revisio === 'aprovat');
    const pendents = corpus443.filter((x) => x.estat_revisio === 'pendent_admin');
    expect(aprovats).toHaveLength(20);
    expect(pendents).toHaveLength(423);
    expect(aprovats.every((x) => x.author === AUTORIA_RENTONAR)).toBe(true);
    expect(aprovats.every((x) => x.author !== 'Sóc de Poble')).toBe(true);
    expect(aprovats.every((x) => x.estudi_tecnic === ESTUDI_TECNIC_RENTONAR)).toBe(true);

    const articles425 = lligArticlesImportatsAmbRevisio(st);
    expect(articles425).toHaveLength(425);
    const stats = estadistiquesRevisioImportacio(st);
    expect(stats.total).toBe(425);
    expect(stats.totalPagines).toBe(18);
    expect(stats.totalCorpus443).toBe(443);
    expect(stats.aprovatsCorpus443).toBe(20);
    expect(stats.pendentsCorpus443).toBe(423);
  });

  it('sincronitza i desa revisions contra el port neutral quan la capacitat revisionsEditorialsWp és activa', async () => {
    const st = storageMemoria();
    const anterior = { ...backendPort.getBackendImplementation() };
    const adaptadorBase = creaAdaptadorLocal();
    const cridesDesa = [];
    try {
      backendPort.setBackendImplementation({
        ...adaptadorBase,
        llistaRevisionsEditorialsWp: async () => [
          { wpId: 16893, estat: 'amb_observacions', nota: 'Revisar subtítol', autoria: 'Sóc de Poble', desti: 'mur', actualitzatA: '2026-11-11T05:00:00Z' }
        ],
        desaRevisioEditorialWp: async (entrada) => {
          cridesDesa.push(entrada);
          return { ...entrada, actualitzatA: '2026-11-11T05:05:00Z' };
        }
      });

      const sync = await sincronitzaRevisionsEditorialsWpAmbServidor({ storage: st });
      expect(sync.sincronitzat).toBe(true);
      expect(sync.estat.estats['16893']).toBe('amb_observacions');
      expect(sync.estat.anotacions['16893']).toBe('Revisar subtítol');

      const desat = await desaRevisioArticleImportatAmbServidor(
        1768,
        { estat: 'aprovat', nota: 'Publicat al catàleg d’arbres', autoria: 'Associació El Rentonar', desti: 'arbres-monumentals' },
        { storage: st }
      );
      expect(desat.remot).toBe(true);
      expect(cridesDesa).toHaveLength(1);
      expect(cridesDesa[0]).toMatchObject({
        wpId: 1768,
        estat: 'aprovat',
        autoria: 'Associació El Rentonar',
        desti: 'arbres-monumentals'
      });
    } finally {
      if (Object.keys(anterior).length) backendPort.setBackendImplementation(anterior);
      else backendPort.setBackendImplementation(adaptadorBase);
    }
  });
});
