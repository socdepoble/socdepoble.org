/* B6-A (P1-01, marató 261101_2143) · el cost de benzina del comparador
   Poble · Gran superfície: el càlcul pur i els seus marges, la precedència del
   cost fix (les llistes d'abans fan el mateix) i la xifra a la targeta real
   sense cap canvi de vista. Persones i xifres de mostra. */
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { comparadorDe, costDesplacamentDe } from './rebost.js';
import { aplicaAccio, resumDe } from '../nucliComu.js';
import { UniversalListCard } from '../UniversalListCard.jsx';
import { formatEuros } from '../../../../utils/diners.js';

afterEach(cleanup);

const ARA = '2026-11-01T22:00:00.000Z';
const ANNA = { id: 'u-anna', nom: 'Anna' };
/* 20 km d'anada, 6,5 L/100 km i 165 c/L: 40 km × 0,065 L × 165 c = 429 c. */
const VIATGE = Object.freeze({ km: 20, consumL100km: 6.5, preuLitreCents: 165 });
const CLAUS = ['articles', 'sensePreu', 'pobleCents', 'granCents', 'desplacamentCents', 'totalGranCents', 'estalviCents'];

let comptador = 0;
const context = () => ({ actor: ANNA, ara: ARA, nouId: () => `id-${(comptador += 1)}` });
const llistaBuida = (extra = {}) => ({ id: 'l-rebost', mode: 'rebost', titol: 'Compra', propietariId: ANNA.id, revisio: 0, elementsComu: [], ...extra });

/** Tomaca (3 kg a 2,50 € o 2,95 €) i ous (una dotzena a 0,30 € o 0,25 € la unitat): 11,10 € al poble i 11,85 € a la gran superfície. */
function ambArticles(extra) {
  return [
    { nom: 'Tomaca', especificacio: '3 kg', preuPobleCents: 250, preuGranSuperficieCents: 295, unitatPreu: 'kg' },
    { nom: 'Ous', especificacio: '1 dotzena', preuPobleCents: 30, preuGranSuperficieCents: 25, unitatPreu: 'u' }
  ].reduce((l, entrada) => {
    const r = aplicaAccio(l, { tipus: 'afegeix', entrada }, context());
    expect(r.ok).toBe(true);
    return r.llista;
  }, llistaBuida(extra));
}

describe('costDesplacamentDe · la benzina del viatge, en cèntims', () => {
  test('anada i tornada per defecte: 20 km, 6,5 L/100 km i 165 c/L fan 429 c', () => {
    expect(costDesplacamentDe(VIATGE)).toBe(429);
    expect(costDesplacamentDe({ ...VIATGE, anadaITornada: true })).toBe(429);
  });

  test('només el camí d’anada: la meitat, arrodonida (214,5 → 215)', () => {
    expect(costDesplacamentDe({ ...VIATGE, anadaITornada: false })).toBe(215);
  });

  test('arrodonix al cèntim més pròxim, ni sempre amunt ni sempre avall (181,2 → 181; 188,75 → 189)', () => {
    expect(costDesplacamentDe({ km: 12, consumL100km: 5, preuLitreCents: 151 })).toBe(181);
    expect(costDesplacamentDe({ km: 12.5, consumL100km: 5, preuLitreCents: 151 })).toBe(189);
  });

  test('la coma flotant no resta cap cèntim a les meitats exactes (8,2 km × 2 × 7,5 L × 150 c = 184,5 → 185)', () => {
    expect(costDesplacamentDe({ km: 8.2, consumL100km: 7.5, preuLitreCents: 150 })).toBe(185);
    expect(costDesplacamentDe({ km: 18.9, consumL100km: 12.5, preuLitreCents: 380 })).toBe(1796);
    /* Km d'un decimal (0-60), consum de mig en mig litre (4-12) i preus de 5 en 5 c (130-210), contra l'aritmètica exacta amb enters. */
    const diferents = [];
    for (let km10 = 0; km10 <= 600; km10 += 1) {
      for (let consum10 = 40; consum10 <= 120; consum10 += 5) {
        for (let preu = 130; preu <= 210; preu += 5) {
          for (const trams of [1, 2]) {
            const exacte = Math.floor((2 * km10 * trams * consum10 * preu + 10_000) / 20_000);
            const calculat = costDesplacamentDe({ km: km10 / 10, consumL100km: consum10 / 10, preuLitreCents: preu, anadaITornada: trams === 2 });
            if (calculat !== exacte && diferents.length < 5) diferents.push({ km: km10 / 10, consum: consum10 / 10, preu, trams, calculat, exacte });
          }
        }
      }
    }
    expect(diferents).toEqual([]);
  });

  test('qualsevol valor d’anadaITornada que no siga false compta com a anada i tornada', () => {
    for (const valor of ['false', 0, null, undefined, 'no', {}]) {
      expect(costDesplacamentDe({ ...VIATGE, anadaITornada: valor }), String(valor)).toBe(429);
    }
  });

  test('els marges són inclusius, i 0 km és un viatge de franc (mai -0)', () => {
    expect(costDesplacamentDe({ km: 300, consumL100km: 25, preuLitreCents: 500 })).toBe(75_000);
    expect(costDesplacamentDe({ km: 0.5, consumL100km: 2, preuLitreCents: 50 })).toBe(1);
    expect(costDesplacamentDe({ ...VIATGE, km: 0 })).toBe(0);
    expect(Object.is(costDesplacamentDe({ ...VIATGE, km: -0 }), 0)).toBe(true);
  });

  test('dades no vàlides: null, mai una xifra inventada', () => {
    const dolents = [
      ...[-1, -0.01, 300.01, Number.NaN, Number.POSITIVE_INFINITY, '20', null, undefined, true].map((km) => ({ ...VIATGE, km })),
      ...[1.99, 25.01, Number.NaN, '6.5', null].map((consumL100km) => ({ ...VIATGE, consumL100km })),
      ...[165.5, 49, 501, '165', Number.NaN, null].map((preuLitreCents) => ({ ...VIATGE, preuLitreCents }))
    ];
    for (const d of dolents) expect(costDesplacamentDe(d), JSON.stringify(d)).toBeNull();
    for (const d of [null, undefined, 'x', 42, true, [], {}, [20, 6.5, 165]]) expect(costDesplacamentDe(d), String(d)).toBeNull();
  });

  test('pura: no muta l’entrada, accepta objectes congelats i ignora els camps de més', () => {
    const entrada = Object.freeze({ ...VIATGE, nota: 'de mostra', costDesplacamentCents: 1 });
    const copia = JSON.stringify(entrada);
    expect(costDesplacamentDe(entrada)).toBe(429);
    expect(JSON.stringify(entrada)).toBe(copia);
  });
});

describe('comparadorDe · la benzina entra al total de la gran superfície', () => {
  test('amb desplacament i sense cost fix, suma el càlcul (pel resum del mode de veres)', () => {
    expect(resumDe(ambArticles({ configMode: { desplacament: VIATGE } })).comparador).toEqual({
      articles: 2, sensePreu: 0, pobleCents: 750 + 360, granCents: 885 + 300, desplacamentCents: 429,
      totalGranCents: 885 + 300 + 429, estalviCents: 885 + 300 + 429 - (750 + 360)
    });
  });

  test('el cost fix explícit mana, també quan és 0', () => {
    expect(comparadorDe(ambArticles({ configMode: { costDesplacamentCents: 760, desplacament: VIATGE } })).desplacamentCents).toBe(760);
    expect(comparadorDe(ambArticles({ configMode: { costDesplacamentCents: '760', desplacament: VIATGE } })).desplacamentCents).toBe(760);
    const zero = comparadorDe(ambArticles({ configMode: { costDesplacamentCents: 0, desplacament: VIATGE } }));
    expect(zero.desplacamentCents).toBe(0);
    expect(zero.totalGranCents).toBe(885 + 300);
  });

  test('un cost fix que no és vàlid no mana: es calcula la benzina', () => {
    expect(comparadorDe(ambArticles({ configMode: { costDesplacamentCents: -5, desplacament: VIATGE } })).desplacamentCents).toBe(429);
  });

  test('sense cap dels dos, o amb dades dolentes, 0 de desplaçament (com abans)', () => {
    const casos = [undefined, {}, { costDesplacamentCents: -5 }, { desplacament: { ...VIATGE, km: '20' } }, { desplacament: 'lluny' }];
    for (const configMode of casos) {
      const c = comparadorDe(ambArticles(configMode === undefined ? {} : { configMode }));
      expect(c.desplacamentCents, JSON.stringify(configMode)).toBe(0);
      expect(c.totalGranCents).toBe(c.granCents);
    }
  });

  test('el resultat conserva les claus d’abans i no n’afig cap', () => {
    for (const configMode of [{}, { desplacament: VIATGE }, { costDesplacamentCents: 760, desplacament: VIATGE }]) {
      expect(Object.keys(comparadorDe(ambArticles({ configMode }))).sort()).toEqual([...CLAUS].sort());
    }
  });

  test('sense cap article comparable, cap comparador, encara que hi haja viatge', () => {
    const configMode = { desplacament: VIATGE };
    expect(comparadorDe(llistaBuida({ configMode }))).toBeNull();
    const r = aplicaAccio(llistaBuida({ configMode }),
      { tipus: 'afegeix', entrada: { nom: 'Oli', especificacio: '1 l', preuPobleCents: 800, preuGranSuperficieCents: 700, unitatPreu: 'kg' } }, context());
    expect(resumDe(r.llista).comparador).toBeNull();
  });
});

describe('la targeta real pinta la benzina calculada, sense cap canvi de vista', () => {
  const xifres = () => screen.getAllByRole('listitem').map((li) => li.textContent);
  const pinta = (llista) => render(createElement(UniversalListCard, { llista, actor: ANNA, rellotge: () => new Date(ARA), generaId: () => `g-${(comptador += 1)}` }));

  test('amb desplacament: «A la gran superfície: … (amb 4,29 € de desplaçament)» i l’estalvi el compta', () => {
    pinta(ambArticles({ configMode: { desplacament: VIATGE } }));
    expect(xifres()).toContain(`A la gran superfície: ${formatEuros(885 + 300 + 429)} (amb ${formatEuros(429)} de desplaçament)`);
    expect(xifres()).toContain(`Comprant al poble estalvieu ${formatEuros(885 + 300 + 429 - (750 + 360))}.`);
  });

  test('sense desplacament: la línia de sempre, sense cap desplaçament', () => {
    pinta(ambArticles({}));
    expect(xifres()).toContain(`A la gran superfície: ${formatEuros(885 + 300)}`);
    expect(xifres().some((t) => t.includes('de desplaçament'))).toBe(false);
  });

  test('qui governa la llista pot configurar km, consum L/100 km i preu del litre des de la taula i actualitza el comparador', () => {
    pinta(ambArticles({}));
    fireEvent.click(screen.getByRole('button', { name: 'Amplia en taula' }));
    const dialeg = screen.getByRole('dialog', { name: 'Taula: Compra' });
    fireEvent.change(within(dialeg).getByLabelText('Distància d’anada (km)'), { target: { value: '20' } });
    fireEvent.change(within(dialeg).getByLabelText('Consum (L/100 km)'), { target: { value: '6,5' } });
    fireEvent.change(within(dialeg).getByLabelText('Preu del litre (cèntims)'), { target: { value: '165' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Desa el desplaçament' }));
    expect(xifres()).toContain(`A la gran superfície: ${formatEuros(885 + 300 + 429)} (amb ${formatEuros(429)} de desplaçament)`);
  });
});
