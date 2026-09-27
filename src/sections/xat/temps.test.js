import { describe, expect, test } from 'vitest';
import { clauDia, diesDeDiferencia, etiquetaDia, etiquetaHora, etiquetaLlista } from './temps.js';

/* Un dilluns a mitja vesprada com a «ara»: cap prova depén del rellotge real. */
const ARA = new Date(2026, 8, 28, 17, 45).getTime();
const t = (clau, alternativa) => ({ 'section.xat.temps.ahir': 'AHIR', 'section.xat.temps.hui': 'HUI' }[clau] || alternativa);

describe('temps del xat', () => {
  test('la hora es formata amb el locale i sense text escrit a mà', () => {
    expect(etiquetaHora(new Date(2026, 8, 28, 14, 5), 'en-GB')).toBe('14:05');
    expect(etiquetaHora('data invàlida')).toBe('');
    expect(etiquetaHora(null)).toBe('');
  });

  test('la fila de la llista mostra hora, ahir, dia de la setmana o data', () => {
    expect(etiquetaLlista(new Date(2026, 8, 28, 9, 30), { locale: 'en-GB', t, ara: ARA })).toBe('09:30');
    expect(etiquetaLlista(new Date(2026, 8, 27, 23, 59), { locale: 'en-GB', t, ara: ARA })).toBe('AHIR');
    expect(etiquetaLlista(new Date(2026, 8, 25, 12, 0), { locale: 'en-GB', t, ara: ARA })).toBe('Friday');
    expect(etiquetaLlista(new Date(2026, 8, 4, 12, 0), { locale: 'en-GB', t, ara: ARA })).toBe('04/09/26');
  });

  test('sense traductor s\'usen les alternatives en valencià', () => {
    expect(etiquetaLlista(new Date(2026, 8, 27, 8, 0), { locale: 'ca-ES', ara: ARA })).toBe('Ahir');
    expect(etiquetaDia(new Date(2026, 8, 28, 8, 0), { locale: 'ca-ES', ara: ARA })).toBe('Hui');
  });

  test('el separador de dia dona hui, ahir, dia de la setmana o data llarga', () => {
    expect(etiquetaDia(new Date(2026, 8, 28, 1, 0), { locale: 'en-GB', t, ara: ARA })).toBe('HUI');
    expect(etiquetaDia(new Date(2026, 8, 27, 1, 0), { locale: 'en-GB', t, ara: ARA })).toBe('AHIR');
    expect(etiquetaDia(new Date(2026, 8, 24, 1, 0), { locale: 'en-GB', t, ara: ARA })).toBe('Thursday');
    expect(etiquetaDia(new Date(2026, 7, 15, 1, 0), { locale: 'en-GB', t, ara: ARA })).toBe('15 August 2026');
  });

  test('la clau de dia i la diferència de dies són locals i estables', () => {
    expect(clauDia(new Date(2026, 8, 4, 23, 59))).toBe('2026-09-04');
    expect(clauDia('res')).toBe('');
    expect(diesDeDiferencia(new Date(2026, 8, 27, 0, 1), ARA)).toBe(1);
    expect(diesDeDiferencia(new Date(2026, 8, 28, 23, 59), ARA)).toBe(0);
    expect(diesDeDiferencia(null, ARA)).toBeNull();
  });
});
