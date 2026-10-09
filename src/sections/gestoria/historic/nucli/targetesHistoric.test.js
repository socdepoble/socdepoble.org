// @vitest-environment node
/* Històric · les targetes del director financer (Onada 6, ordre del Mestre,
   261009): sis targetes, cap dada als títols ni als subtítols (l'Índex en fa
   la URL), i sense dades el perquè, mai «0,00 €». */
import { describe, expect, test } from 'vitest';
import { indicadors, serieHistorica } from '../../despeses/nucli/serieHistorica.js';
import { ETIQUETA_NO_VERIFICAT } from '../../impostos/nucli/simulacio.js';
import { SENSE_XIFRA_HISTORIC, TEXT_COBERTURA, nomDelTram, targetesHistoric } from './targetesHistoric.js';

const d = (iso) => ({ a: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });
const mov = (iso, centims, categoria, proveidor = null) => ({
  dataOperacio: d(iso), dataValor: d(iso), centims, id: `m${iso.replace(/-/g, '')}`, categoria, proveidor, confianca: 'mitjana', motiu: 'TEXT'
});
const LECTURA = {
  extractes: [{
    lectura: {
      comptes: [{
        capcalera: { entitat: '9999', compte4: '4321', dataInicial: d('2025-01-01'), dataFinal: d('2025-02-28'), saldoInicial: 400000, divisa: 'EUR' },
        moviments: [mov('2025-01-03', -2150, 'ia', 'anthropic'), mov('2025-02-03', -100000, 'altres')],
        peu: { saldoFinal: 400000 - 2150 - 100000 }
      }],
      avisos: []
    }
  }]
};

describe('les targetes', () => {
  const serie = serieHistorica({ lectura: LECTURA });
  const ind = indicadors({ serie, provisio: { valor: 4200, any: 2025, t: 1 } });
  const targetes = targetesHistoric({ serie, indicadors: ind, provisio: { valor: 4200, any: 2025, t: 1 } });

  test('sis, en ordre, amb les icones del Tauler i la llegenda de les estimacions', () => {
    expect(targetes.map((t) => t.id)).toEqual(['historic-caixa', 'historic-despesa', 'historic-consum', 'historic-runway', 'historic-ia', 'historic-provisio']);
    expect(targetes.map((t) => t.icona)).toEqual(['wallet', 'trendingDown', 'scale', 'hourglass', 'percent', 'landmark']);
    expect(targetes[5].notes).toContain(ETIQUETA_NO_VERIFICAT);
    expect(targetes[5].subtitol).toBe('Models 303 i 130 · 1T 2025');
  });

  test('les xifres ixen de la sèrie i dels indicadors', () => {
    expect(targetes[0].xifra).toEqual({ tipus: 'import', valor: 297850, moneda: 'EUR' });
    expect(targetes[1].xifra.valor).toBe(Math.round((2150 + 100000) / 2));
    expect(targetes[3].xifra).toEqual({ tipus: 'mesos', valor: ind.runway.valor });
    expect(targetes[4].xifra).toEqual({ tipus: 'recompte', valor: 2 });
    expect(targetes[5].xifra.valor).toBe(4200);
    expect(targetes[0].detall).toEqual([{ etiqueta: 'Compte 1', xifra: { tipus: 'import', valor: 297850, moneda: 'EUR' } }]);
  });

  test('cap xifra ni dígit del compte als títols ni als subtítols', () => {
    for (const t of targetes) {
      expect(`${t.titol} ${t.subtitol}`, t.id).not.toMatch(/4321|2978|€/);
      expect(t.font.length).toBeGreaterThan(20);
    }
  });

  test('sense dades, el perquè i cap xifra', () => {
    const buides = targetesHistoric({ serie: null, indicadors: indicadors({ serie: null }), provisio: null });
    for (const t of buides) {
      expect(t.xifra, t.id).toBeNull();
      expect(t.senseXifra.length, t.id).toBeGreaterThan(10);
    }
    expect(buides[0].senseXifra).toBe(SENSE_XIFRA_HISTORIC.SENSE_DADES);
    expect(buides[5].subtitol).toBe('Models 303 i 130 · el trimestre');
  });
});

describe('els noms dels trams', () => {
  test('mes, trimestre i any; la cobertura en paraules', () => {
    expect(nomDelTram({ clau: '2025-01', any: 2025, mes: 1 })).toBe('Gener 2025');
    expect(nomDelTram({ clau: '2025-T3', any: 2025, t: 3 })).toBe('3T 2025');
    expect(nomDelTram({ clau: '2025', any: 2025 })).toBe('2025');
    expect(TEXT_COBERTURA).toEqual({ completa: 'Completa', parcial: 'Parcial', cap: 'Sense extractes' });
  });
});
