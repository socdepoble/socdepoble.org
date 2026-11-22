import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppBar from './AppBar.jsx';
import { ESQUEMA_CAPTURA_LOYVERSE, importaLoyverseApi } from './loyverseApi.js';
import { creaMagatzemBar } from './magatzem.js';
import manifestBar from './manifest.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { afegeixProducte, convida, creaComanda, totals } from './nucli/comanda.js';
import { fullTancament, horaLocal } from './nucli/fullTancament.js';
import { llavorCarta } from './nucli/llavor.js';
import { creaDevolucio, importLiniaTiquet } from './nucli/tiquet.js';
import { arqueig, obriTorn, resumTorn, tancaTorn } from './nucli/torn.js';
import { notaDeTraspas } from './nucli/traspas.js';
import { dataLocal, horaEnZona } from './nucli/vendes.js';
import { horaCurta } from './vistes/vestits.js';

const ARA = '2026-10-02T10:00:00.000Z';
const TANCAT = '2026-10-02T14:00:00.000Z';
const CARTA = llavorCarta();

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Onada R32.33 · El Bar · vores aritmetiques (-0), dates invalides i guardes UI', () => {
  test('importaLoyverseApi normalitza -0 a 0 positiu en preu, cost i suplement de modificador', () => {
    const item = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const cat = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const botiga = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const variant = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const taxa = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    const mod = '12121212-1212-1212-1212-121212121212';
    const opcio = '13131313-1313-1313-1313-131313131313';
    const captura = {
      esquema: ESQUEMA_CAPTURA_LOYVERSE,
      items: {
        items: [{
          id: item,
          item_name: 'Aigua cortesia',
          category_id: cat,
          tax_ids: [taxa],
          modifiers_ids: [mod],
          variants: [{
            variant_id: variant,
            item_id: item,
            default_pricing_type: 'FIXED',
            default_price: -0,
            cost: -0,
            stores: [{ store_id: botiga, available_for_sale: true }]
          }]
        }]
      },
      categories: { categories: [{ id: cat, name: 'Begudes' }] },
      taxes: { taxes: [{ id: taxa, type: 'INCLUDED', rate: 10, stores: [botiga] }] },
      modifiers: {
        modifiers: [{
          id: mod,
          name: 'Glaçons',
          stores: [botiga],
          modifier_options: [{ id: opcio, name: 'Sense gel', price: -0, position: 1 }]
        }]
      }
    };
    const { carta } = importaLoyverseApi(captura, { botigaId: botiga, moneda: 'EUR' });
    expect(Object.is(carta.productes[0].variants[0].preuCents, -0)).toBe(false);
    expect(carta.productes[0].variants[0].preuCents).toBe(0);
    expect(Object.is(carta.grups[0].opcions[0].deltaCents, -0)).toBe(false);
    expect(carta.grups[0].opcions[0].deltaCents).toBe(0);
  });

  test('importLiniaTiquet i resumTorn mai produeixen -0 en retornar linies convidades o de cost 0', () => {
    const producteCostZero = {
      ...CARTA.productes[0],
      id: 'mostra-zero',
      variants: [{ ...CARTA.productes[0].variants[0], costCents: 0 }]
    };
    const torn = obriTorn({ id: 'torn-r3233', per: 'Caixa', fonsInicialCents: 1000, ara: ARA });
    let comanda = creaComanda({ id: 'cmd-1', tornId: torn.id, origen: { tipus: 'barra' }, ara: ARA });
    comanda = afegeixProducte(comanda, { producte: CARTA.productes[1], ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'lin-1' });
    comanda = afegeixProducte(comanda, { producte: producteCostZero, ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'lin-2' });
    comanda = convida(comanda, 'lin-2', { motiu: 'Cortesia', ara: ARA });
    comanda = afegeixPagament(
      comanda,
      { metode: 'efectiu', importCents: totals(comanda).pendentCents },
      { id: 'pag-1', ara: ARA }
    );
    const venda = tanca(comanda, { numero: 1, ara: ARA });
    const devolucio = creaDevolucio(venda, [{ liniaId: 'lin-2', quantitat: 1 }], {
      motiu: 'Prova zero',
      metode: 'efectiu',
      id: 'dev-1',
      ara: ARA,
      numero: 2,
      tornId: torn.id
    });

    const importLinia = importLiniaTiquet(devolucio, devolucio.linies[0]);
    expect(Object.is(importLinia, -0)).toBe(false);
    expect(importLinia).toBe(0);

    const resum = resumTorn(torn, [venda, devolucio], [], { categories: CARTA.categories });
    const resumMostra = resum.perProducte.find((p) => p.producteId === 'mostra-zero');
    expect(Object.is(resumMostra.importCents, -0)).toBe(false);
    expect(Object.is(resumMostra.costCents, -0)).toBe(false);
  });

  test('horaLocal i horaCurta rebutgen null, nombres i textos invalids sense escriure NaN:NaN ni 1970', () => {
    for (const valor of [null, undefined, '', '   ', 'ahir', 0, NaN]) {
      expect(horaLocal(valor)).toBe('');
      expect(horaCurta(valor)).toBe('');
    }
    const perDenominacio = { 1000: 1 };
    const torn = obriTorn({ id: 'torn-h', per: 'Caixa', fonsInicialCents: 1000, ara: ARA });
    const resum = resumTorn(torn, [], []);
    const traspas = notaDeTraspas({
      torn,
      resum,
      fonsDeixatCents: 1000,
      diferenciaCaixaCents: arqueig(perDenominacio) - resum.efectiuEsperatCents,
      ara: TANCAT
    });
    const tancat = tancaTorn(torn, { arqueig: { perDenominacio }, resum, traspas, ara: TANCAT });
    const tornAmbMomentBuit = {
      ...tancat,
      moviments: [{ id: 'm1', tipus: 'entrada', importCents: 100, motiu: 'Prova', moment: '' }]
    };
    const full = fullTancament(tornAmbMomentBuit, []);
    expect(full.fulles[2].files[0][0]).toBe('');
  });

  test('dataLocal i horaEnZona fallen tancat amb codi MOMENT davant instants no ISO', () => {
    for (const dolent of [null, undefined, '', 'ahir', '2026-99-99T99:99:00Z', 12345]) {
      expect(() => dataLocal(dolent, 'Europe/Madrid')).toThrow(expect.objectContaining({ codi: 'MOMENT' }));
      expect(() => horaEnZona(dolent, 'Europe/Madrid')).toThrow(expect.objectContaining({ codi: 'MOMENT' }));
    }
  });

  test('HistorialTorns no peta ni escriu NaN/NaN si arriba un torn incomplet de migracio', async () => {
    const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
    await magatzem.carrega();
    await magatzem.desaTorn({ id: 't-antic', obertA: '', obertPer: 'Torn antic', estat: 'tancat', tancatA: '' });
    const App = () => <AppBar magatzem={magatzem} rellotge={() => ARA} atzar={() => 0.25} />;
    const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });
    muntaPlataforma('/app/bar/torns', {
      registre,
      entorn: {
        ...ENTORN_OBERT,
        produccio: false,
        sessio: { estat: 'dins', enLinia: true, modeProves: false },
      },
      externalConfig: { language: 'es' },
    });
    expect(await screen.findByText('Torn antic')).toBeTruthy();
    expect(document.body.textContent).not.toContain('NaN');
  });
});
