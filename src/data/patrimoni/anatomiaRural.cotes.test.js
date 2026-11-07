/**
 * Kit r75 (Gemini, D-G4-1..3), integrat per K3 a l'Onada R10 · Cens d'integritat
 * de les cotes de l'Anatomia Rural.
 *
 * Les proves F1 de VisorAnatomiaRural3D.test.jsx ja fixen cota a cota el pou de neu,
 * el molí hidràulic i l'almàssera. Esta prova fixa el CENS sencer: quines cotes de
 * les 9 estructures NO estan confirmades per una font ('unica', 'discrepant' o
 * 'pendent'). Si algú confirma, rebaixa o afig una cota no confirmada, el cens
 * canvia i esta prova ho diu; s'ha d'actualitzar amb la font a la mà.
 *
 * El mòdul resumCotesAnatomiaRural.js del kit no s'integra: no tenia cap
 * consumidor (LLEI_08 del Tractor Pedra Seca) i classificava com a 'ok' un estat
 * desconegut. Ací el cens es calcula en línia, i un estat desconegut falla.
 */
import { describe, expect, it } from 'vitest';
import { ESTRUCTURES } from './anatomiaRural.js';

const ESTATS = Object.freeze(['ok', 'unica', 'discrepant', 'pendent']);

function censDeCotes(estructures) {
  const cens = { ok: [], unica: [], discrepant: [], pendent: [], desconegut: [] };
  for (const estructura of estructures) {
    for (const cota of estructura.cotes || []) {
      const clau = ESTATS.includes(cota.estat) ? cota.estat : 'desconegut';
      cens[clau].push(`${estructura.id}:${cota.etiqueta}`);
    }
  }
  return cens;
}

describe('r75 · D-G4 · cens de les cotes no confirmades de l’Anatomia Rural', () => {
  const cens = censDeCotes(ESTRUCTURES);

  it('les 9 estructures i cap estat fora dels 4 coneguts', () => {
    expect(ESTRUCTURES).toHaveLength(9);
    expect(cens.desconegut).toEqual([]);
  });

  /* Loop 3 (R11) · Les tres discrepants i l'«Alçada total» del pou eren xifres de l'esbós 76150
     (sense autor ni escala) contra Segura (1987). Ara el pou du les cotes de Segura i l'esbós
     només queda a la nota: cap cota discrepant, i 3 d'una sola font. */
  it('D-G4-1 · cap cota discrepant: el pou de neu du les de Segura i l’esbós 76150 només a la nota', () => {
    expect(cens.discrepant).toEqual([]);
    const pou = ESTRUCTURES.find((e) => e.id === 'pou-de-neu');
    for (const etiqueta of ['Fondària des de les finestres superiors', 'Diàmetre interior', 'Galeria d’escorredor, a l’est']) {
      expect(pou.cotes.find((c) => c.etiqueta === etiqueta).nota, etiqueta).toMatch(/76150/);
    }
  });

  it('D-G4-2 · exactament 3 cotes d’una sola font', () => {
    expect(cens.unica).toEqual([
      'pou-de-neu:Cim dels Plans',
      'moli-electric:Tancament',
      'forn-de-calc:Temperatura de cocció',
    ]);
  });

  it('D-G4-3 · una sola cota pendent: els anys del molí hidràulic, sense font del disc', () => {
    expect(cens.pendent).toEqual(['moli-hidraulic:Anys del molí hidràulic de La Torre']);
    const moli = ESTRUCTURES.find((e) => e.id === 'moli-hidraulic');
    expect(moli.cotes.find((c) => c.estat === 'pendent')).toMatchObject({
      valor: '1925–2022',
      font: 'cap font del disc',
    });
  });

  it('cada estat no confirmat ho diu: la discrepant mostra totes les fonts, la única i la pendent porten nota', () => {
    for (const estructura of ESTRUCTURES) {
      for (const cota of estructura.cotes) {
        const qui = `${estructura.id}:${cota.etiqueta}`;
        if (cota.estat === 'discrepant') expect(cota.font.split(';').length, qui).toBeGreaterThanOrEqual(2);
        if (cota.estat === 'unica' || cota.estat === 'pendent') expect(String(cota.nota || '').length, qui).toBeGreaterThan(10);
      }
    }
  });
});
