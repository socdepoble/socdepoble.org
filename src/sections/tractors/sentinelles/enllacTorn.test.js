// @vitest-environment node
/* Sentinella 6 · Enllaç del Torn, amb notes de traspàs sdp.bar.traspas.v1
   sintètiques (noms inventats, cèntims enters). */
import { describe, expect, test } from 'vitest';
import { SENTINELLA_ENLLAC, observaEnllac } from './enllacTorn.js';
import { validaTraspas } from './formatsBar.js';

const ARA = Date.UTC(2026, 9, 2, 16);

function nota(canvis = {}) {
  return {
    schema: 'sdp.bar.traspas.v1',
    tornId: 'mati-261002',
    tancatA: '2026-10-02T15:00:00Z',
    de: 'Persona de Prova',
    fonsDeixatCents: 15000,
    comandesObertes: [],
    incidencies: [],
    reposicio: [],
    avisos: [],
    llegidaPer: 'Altra Persona',
    llegidaA: '2026-10-02T15:10:00Z',
    ...canvis
  };
}
function tancament(canvis = {}) {
  return {
    schema: 'sdp.bar.tancament.v1', tornId: 'mati-261002', obertA: '2026-10-02T06:00:00Z', tancatA: '2026-10-02T15:00:00Z', diferenciaCaixaCents: 0,
    resum: {
      vendesPerMetode: { efectiu: 1000, targeta: 0, altre: 0 }, tiquets: 1, tiquetMitjaCents: 1000, devolucionsCents: 0,
      anullacions: { nombre: 0, importCents: 0 }, descomptesCents: 0, convidadesCents: 0, perCategoria: [], perProducte: []
    },
    ...canvis
  };
}
const observa = (entrada) => observaEnllac(entrada, { ara: ARA });
const codis = (eixida) => eixida.avisos.map((a) => a.codi);

describe('una nota neta', () => {
  test('passa el format i no alça cap bandera', () => {
    expect(validaTraspas(nota())).toEqual([]);
    const eixida = observa({ traspas: nota(), tancament: tancament() });
    expect(eixida.avisos).toEqual([]);
    expect(eixida.informe).toContain('Nota de traspàs del torn mati-261002');
    expect(eixida.informe).toContain('Llegida: sí, per Altra Persona');
  });
});

describe('el que dispara', () => {
  test('sense nota o amb una nota mal formada: roja', () => {
    expect(observa({ traspas: null }).avisos).toEqual([expect.objectContaining({ codi: 'ENL-SENSE-NOTA', severitat: 'roja' })]);
    expect(codis(observa({ traspas: { schema: 'sdp.bar.traspas.v1' } }))).toEqual(['ENL-FORMAT']);
  });

  test('nota no llegida i comandes obertes: groga, amb el total', () => {
    const eixida = observa({
      traspas: nota({
        llegidaPer: null, llegidaA: null,
        comandesObertes: [{ id: 'c1', origen: { tipus: 'taula', taulaId: 4 }, totalCents: 1250 }, { id: 'c2', origen: { tipus: 'barra' }, totalCents: 300 }]
      })
    });
    expect(codis(eixida)).toEqual(['ENL-NO-LLEGIDA', 'ENL-COMANDES-OBERTES']);
    expect(eixida.avisos[1].missatge).toContain('2 comandes obertes per 15,50 €');
    expect(eixida.informe).toContain('- taula 4: 12,50 €');
    expect(eixida.informe).toContain('- barra: 3,00 €');
  });

  test('la diferència de caixa: groga si és poca, roja a partir de 20 €', () => {
    const poca = observa({ traspas: nota({ incidencies: [{ tipus: 'diferencia-caixa', detall: 'Falta canvi', importCents: -350 }] }) });
    expect(poca.avisos).toEqual([expect.objectContaining({ codi: 'ENL-DIFERENCIA-CAIXA', severitat: 'groga' })]);
    expect(poca.avisos[0].missatge).toContain('en falten 3,50 €');
    const molta = observa({ traspas: nota({ incidencies: [{ tipus: 'diferencia-caixa', detall: '', importCents: 2500 }] }) });
    expect(molta.avisos[0]).toMatchObject({ severitat: 'roja' });
    expect(molta.avisos[0].missatge).toContain('en sobren 25,00 €');
  });

  test('anul·lacions, devolucions i invitacions: groga, amb el detall a l’informe', () => {
    const eixida = observa({
      traspas: nota({
        incidencies: [
          { tipus: 'anullacions', detall: 'Comanda duplicada', importCents: 800 },
          { tipus: 'devolucions', detall: 'Cafè fred', importCents: 150 },
          { tipus: 'convidades', detall: 'Ronda de la casa', importCents: 600 }
        ]
      })
    });
    expect(codis(eixida)).toEqual(['ENL-ANULLACIONS', 'ENL-DEVOLUCIONS', 'ENL-CONVIDADES']);
    expect(eixida.informe).toContain('- anullacions: 8,00 €, Comanda duplicada');
  });

  test('sense fons o amb fons negatiu; reposició i avisos del torn', () => {
    expect(codis(observa({ traspas: nota({ fonsDeixatCents: 0 }) }))).toEqual(['ENL-SENSE-FONS']);
    expect(observa({ traspas: nota({ fonsDeixatCents: -1 }) }).avisos[0]).toMatchObject({ codi: 'ENL-FONS-INVALID', severitat: 'roja' });
    const eixida = observa({ traspas: nota({ reposicio: [{ producteId: 'llet', nom: 'Llet', unitats: 6 }], avisos: ['La cafetera fa soroll.', ' '] }) });
    expect(codis(eixida)).toEqual(['ENL-REPOSICIO', 'ENL-AVIS']);
    expect(eixida.avisos[1]).toMatchObject({ severitat: 'info', missatge: 'La cafetera fa soroll.', font: 'torn:mati-261002:avisos[0]' });
  });

  test('una nota de fa més de 24 hores: informativa', () => {
    expect(codis(observa({ traspas: nota({ tancatA: '2026-09-30T15:00:00Z' }) }))).toEqual(['ENL-NOTA-ANTIGA']);
  });

  test('el tancament no quadra amb la nota, és d’un altre torn o no té el format', () => {
    const caixa = { incidencies: [{ tipus: 'diferencia-caixa', detall: '', importCents: -200 }] };
    expect(codis(observa({ traspas: nota(caixa), tancament: tancament({ diferenciaCaixaCents: -500 }) }))).toEqual(['ENL-DIFERENCIA-CAIXA', 'ENL-INCOHERENT']);
    expect(codis(observa({ traspas: nota(caixa), tancament: tancament({ diferenciaCaixaCents: -200 }) }))).toEqual(['ENL-DIFERENCIA-CAIXA']);
    expect(codis(observa({ traspas: nota(), tancament: tancament({ tornId: 'tarda-261002' }) }))).toEqual(['ENL-TORN-DIFERENT']);
    expect(codis(observa({ traspas: nota(), tancament: { schema: 'sdp.bar.tancament.v1' } }))).toEqual(['ENL-TANCAMENT-FORMAT']);
  });
});

describe('l’entrada', () => {
  const json = (valor) => new TextEncoder().encode(JSON.stringify(valor));
  const { prepara } = SENTINELLA_ENLLAC.entrada;

  test('reconeix la nota i el tancament pel schema, en qualsevol ordre', () => {
    expect(prepara([{ nom: 't.json', bytes: json(tancament()) }, { nom: 'n.json', bytes: json(nota()) }])).toEqual({ traspas: nota(), tancament: tancament() });
  });

  test('dues notes o dos tancaments són ENTRADA_INVALIDA', () => {
    expect(() => prepara([{ nom: 'a.json', bytes: json(nota()) }, { nom: 'b.json', bytes: json(nota()) }])).toThrow(expect.objectContaining({ codi: 'ENTRADA_INVALIDA' }));
    expect(() => prepara([{ nom: 'a.json', bytes: json(tancament()) }, { nom: 'b.json', bytes: json(tancament()) }])).toThrow(/segon tancament/);
  });
});
