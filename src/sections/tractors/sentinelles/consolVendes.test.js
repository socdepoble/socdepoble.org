// @vitest-environment node
/* Sentinella 3 · Cònsol de Vendes, amb tancaments sdp.bar.tancament.v1
   sintètics (cèntims enters, productes inventats). */
import { describe, expect, test } from 'vitest';
import { SENTINELLA_CONSOL, observaConsol } from './consolVendes.js';
import { validaTancament } from './formatsBar.js';

const ARA = Date.UTC(2026, 9, 2, 23);

function tancament({ torn = 't1', dia = 1, efectiu = 30000, targeta = 20000, perProducte, descomptes = 0, convidades = 0, anullacions = 0, devolucions = 0 } = {}) {
  return {
    schema: 'sdp.bar.tancament.v1',
    tornId: torn,
    obertA: `2026-10-${String(dia).padStart(2, '0')}T06:00:00Z`,
    tancatA: `2026-10-${String(dia).padStart(2, '0')}T15:00:00Z`,
    diferenciaCaixaCents: 0,
    resum: {
      vendesPerMetode: { efectiu, targeta, altre: 0 },
      tiquets: 50,
      tiquetMitjaCents: Math.round((efectiu + targeta) / 50),
      devolucionsCents: devolucions,
      anullacions: { nombre: anullacions ? 1 : 0, importCents: anullacions },
      descomptesCents: descomptes,
      convidadesCents: convidades,
      perCategoria: [{ categoriaId: 'begudes', nom: 'Begudes', unitats: 100, importCents: efectiu + targeta }],
      perProducte: perProducte ?? [
        { producteId: 'cafe', nom: 'Café', unitats: 60, importCents: 9000, costCents: 1800 },
        { producteId: 'entrepa', nom: 'Entrepà', unitats: 20, importCents: 7000, costCents: 3500 },
        { producteId: 'refresc', nom: 'Refresc', unitats: 20, importCents: 4000, costCents: null }
      ]
    }
  };
}
const observa = (tancaments) => observaConsol({ tancaments: tancaments.map((dades, i) => ({ nom: `t${i}.json`, dades })) }, { ara: ARA });
const codis = (eixida) => eixida.avisos.map((a) => a.codi);

describe('el format', () => {
  test('un tancament sintètic bo passa la validació', () => {
    expect(validaTancament(tancament())).toEqual([]);
  });

  test('un fitxer que no és un tancament: roja, i sense cap de vàlid no es compta res', () => {
    const eixida = observa([{ schema: 'sdp.bar.traspas.v1' }]);
    expect(codis(eixida)).toEqual(['CON-FORMAT', 'CON-SENSE-DADES']);
    expect(eixida.avisos.every((a) => a.severitat === 'roja')).toBe(true);
  });

  test('imports que no són cèntims enters no passen', () => {
    const dolent = tancament();
    dolent.resum.vendesPerMetode.efectiu = 12.5;
    expect(validaTancament(dolent).join(' ')).toMatch(/vendesPerMetode/);
  });
});

describe('on es guanya i on es perd', () => {
  test('un torn sense problemes: només els informatius (escandall i historial)', () => {
    const eixida = observa([tancament()]);
    expect(codis(eixida)).toEqual(['CON-SENSE-ESCANDALL', 'CON-SENSE-HISTORIAL']);
    expect(eixida.avisos.every((a) => a.severitat === 'info')).toBe(true);
    expect(eixida.informe).toContain('Vendes: 500,00 € en 50 tiquets');
    expect(eixida.informe).toContain('- Café: 72,00 € de marge (80 %)');
  });

  test('un producte per davall del cost és roja; un marge baix, groga', () => {
    const eixida = observa([tancament({
      perProducte: [
        { producteId: 'menu', nom: 'Menú', unitats: 10, importCents: 10000, costCents: 11000 },
        { producteId: 'aigua', nom: 'Aigua', unitats: 10, importCents: 1000, costCents: 800 }
      ]
    })]);
    expect(eixida.avisos.find((a) => a.codi === 'CON-PERD')).toMatchObject({ severitat: 'roja', font: 'producte:menu' });
    expect(eixida.avisos.find((a) => a.codi === 'CON-PERD').missatge).toContain('hi perds 10,00 €');
    expect(eixida.avisos.find((a) => a.codi === 'CON-MARGE-BAIX')).toMatchObject({ severitat: 'groga', font: 'producte:aigua' });
    expect(eixida.informe).toMatch(/On es perd:\n- Menú: -10,00 € de marge/);
  });

  test('massa descomptes, invitacions i anul·lacions: groga', () => {
    const eixida = observa([tancament({ descomptes: 1500, convidades: 1000, anullacions: 500 })]);
    expect(eixida.avisos.find((a) => a.codi === 'CON-FUGUES')).toMatchObject({ severitat: 'groga' });
  });
});

describe('vendes atípiques, amb historial', () => {
  const historial = [1, 2, 3].map((dia) => tancament({ torn: `h${dia}`, dia }));

  test('un torn normal no dispara res d’atípic', () => {
    const eixida = observa([...historial, tancament({ torn: 'avui', dia: 4 })]);
    expect(codis(eixida).filter((c) => /ATIPIQUES|ATURAT|DISPARAT|HISTORIAL/.test(c))).toEqual([]);
  });

  test('unes vendes molt per davall de la mediana i un producte habitual que no s’ha venut', () => {
    const avui = tancament({
      torn: 'avui', dia: 4, efectiu: 10000, targeta: 5000,
      perProducte: [{ producteId: 'entrepa', nom: 'Entrepà', unitats: 20, importCents: 7000, costCents: 3500 }]
    });
    const eixida = observa([avui, ...historial]);
    expect(eixida.avisos.find((a) => a.codi === 'CON-VENDES-ATIPIQUES').missatge).toContain('Hui s’ha venut 150,00 € i la mediana dels 3 torns anteriors és 500,00 €');
    expect(eixida.avisos.find((a) => a.codi === 'CON-PRODUCTE-ATURAT')).toMatchObject({ severitat: 'groga', font: 'producte:cafe' });
  });

  test('un producte que es dispara: informatiu', () => {
    const avui = tancament({
      torn: 'avui', dia: 4,
      perProducte: [{ producteId: 'cafe', nom: 'Café', unitats: 200, importCents: 30000, costCents: 6000 },
        { producteId: 'entrepa', nom: 'Entrepà', unitats: 20, importCents: 7000, costCents: 3500 },
        { producteId: 'refresc', nom: 'Refresc', unitats: 20, importCents: 4000, costCents: null }]
    });
    expect(observa([...historial, avui]).avisos.find((a) => a.codi === 'CON-PRODUCTE-DISPARAT')).toMatchObject({ severitat: 'info' });
  });

  test('un tancament amb data futura és groga', () => {
    const futur = { ...tancament({ torn: 'futur', dia: 9 }), tancatA: '2026-10-09T15:00:00Z' };
    expect(codis(observa([futur]))).toContain('CON-DATA-FUTURA');
  });
});

describe('l’entrada', () => {
  test('cada fitxer pot portar un tancament o una llista', () => {
    const { prepara } = SENTINELLA_CONSOL.entrada;
    const una = new TextEncoder().encode(JSON.stringify(tancament()));
    const dues = new TextEncoder().encode(JSON.stringify([tancament({ torn: 'a' }), tancament({ torn: 'b' })]));
    const entrada = prepara([{ nom: 'u.json', bytes: una }, { nom: 'd.json', bytes: dues }]);
    expect(entrada.tancaments.map((t) => [t.nom, t.dades.tornId])).toEqual([['u.json', 't1'], ['d.json', 'a'], ['d.json', 'b']]);
  });
});
