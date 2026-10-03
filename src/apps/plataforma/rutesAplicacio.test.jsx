/* Plataforma d'Apps Enxufables · rutes i paràmetres (rutesAplicacio.js). */
import { afterEach, describe, expect, test } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { BrowserRouter } from '../../app/contexts/RouterContext.jsx';
import {
  coincidixRuta, esData, esIdOpac, esSlug, esUuid, restaDeApp, tramsSegurs, useParametresConsulta, useRutaApp,
  validaRutes
} from './rutesAplicacio.js';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const VOLENTS = ['..', '.', '%2e', '%2E%2e', 'a b', ' ', 'A', 'Taula', '', 'a/b', 'a%2fb', 'a?b', 'a#b', 'ñ'];

describe('validadors', () => {
  test.each(VOLENTS)('tots rebutgen «%s»', (valor) => {
    for (const valida of [esSlug, esIdOpac, esData, esUuid]) expect(valida(valor), valida.name).toBe(false);
  });

  test('esSlug', () => {
    expect(esSlug('taules')).toBe(true);
    expect(esSlug('caixa-1')).toBe(true);
    expect(esSlug('-caixa')).toBe(false);
    expect(esSlug('caixa--1')).toBe(false);
    expect(esSlug('caixa_1')).toBe(false);
    expect(esSlug('a'.repeat(65))).toBe(false);
  });

  test('esIdOpac', () => {
    expect(esIdOpac('t-3')).toBe(true);
    expect(esIdOpac('n_0a9')).toBe(true);
    expect(esIdOpac('_x')).toBe(false);
    expect(esIdOpac('a'.repeat(65))).toBe(false);
    expect(esIdOpac(3)).toBe(false);
  });

  test('esData: AAAA-MM-DD i que existisca', () => {
    expect(esData('2026-10-02')).toBe(true);
    expect(esData('2024-02-29')).toBe(true);
    expect(esData('2026-02-29')).toBe(false);
    expect(esData('2026-13-01')).toBe(false);
    expect(esData('2026-1-01')).toBe(false);
    expect(esData('02-10-2026')).toBe(false);
  });

  test('esUuid: forma canònica en minúscules', () => {
    expect(esUuid('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
    expect(esUuid('123E4567-E89B-42D3-A456-426614174000')).toBe(false);
    expect(esUuid('123e4567e89b42d3a456426614174000')).toBe(false);
  });

  test('tramsSegurs i restaDeApp', () => {
    expect(tramsSegurs('/bar/taules/t-3')).toEqual(['bar', 'taules', 't-3']);
    expect(tramsSegurs('')).toEqual([]);
    expect(tramsSegurs('/bar/')).toEqual(['bar']);
    expect(tramsSegurs('/bar//x')).toBeNull();
    /* P1-R3 · Una barra doble a l'inici també és un tram buit: no es menja. */
    expect(tramsSegurs('/')).toEqual([]);
    expect(tramsSegurs('//bar/x')).toBeNull();
    expect(tramsSegurs('//')).toBeNull();
    expect(tramsSegurs('/bar//')).toBeNull();
    expect(tramsSegurs('/bar/%2e%2e')).toBeNull();
    expect(tramsSegurs(7)).toBeNull();
    expect(restaDeApp('/app/bar/taules/t-3')).toBe('taules/t-3');
    expect(restaDeApp('/app/bar')).toBe('');
    expect(restaDeApp('/xat/bar')).toBe('');
  });
});

describe('validaRutes i coincidixRuta', () => {
  const RUTES = [
    { path: 'taules' },
    { path: 'taules/:taulaId', params: { taulaId: esIdOpac } },
    { path: 'diari/:dia', params: { dia: esData } }
  ];

  test('una taula bona', () => {
    expect(validaRutes(RUTES)).toEqual({ ok: true, errors: [] });
  });

  test.each([
    ['buida', []],
    ['absoluta', [{ path: '/taules' }]],
    ['barra final', [{ path: 'taules/' }]],
    ['majúscules', [{ path: 'Taules' }]],
    ['comodí', [{ path: 'taules/*' }]],
    ['punts', [{ path: '../taules' }]],
    ['paràmetre sense validador', [{ path: 'taules/:id' }]],
    ['validador sobrant', [{ path: 'taules', params: { id: esIdOpac } }]],
    ['paràmetre repetit', [{ path: 'a/:id/:id', params: { id: esIdOpac } }]],
    ['repetida', [{ path: 'taules/:a', params: { a: esIdOpac } }, { path: 'taules/:b', params: { b: esSlug } }]],
    /* P1-R4 · Un nom heretat d'Object.prototype no és un validador declarat. */
    ['paràmetre heretat sense params', [{ path: 'taules/:constructor' }]],
    ['paràmetre heretat amb params buits', [{ path: 'taules/:valueOf', params: {} }]],
    ['paràmetre heretat amb un altre validador', [{ path: 'taules/:toString/:id', params: { id: esIdOpac } }]]
  ])('rebutja: %s', (_nom, rutes) => {
    expect(validaRutes(rutes).ok).toBe(false);
  });

  test('P1-R4 · coincidixRuta no pren cap validador heretat ni peta', () => {
    for (const nom of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf']) {
      const rutes = [{ path: `taules/:${nom}`, params: {} }];
      expect(() => coincidixRuta(rutes, 'taules/t-3'), nom).not.toThrow();
      expect(coincidixRuta(rutes, 'taules/t-3'), nom).toBeNull();
    }
    /* Declarat com a propi, el mateix nom funciona. */
    const propi = [{ path: 'taules/:constructor', params: { constructor: esIdOpac } }];
    expect(validaRutes(propi)).toEqual({ ok: true, errors: [] });
    expect(coincidixRuta(propi, 'taules/t-3')?.params).toEqual({ constructor: 't-3' });
  });

  test('coincidixRuta valida els paràmetres', () => {
    expect(coincidixRuta(RUTES, 'taules')).toEqual({ ruta: RUTES[0], params: {} });
    expect(coincidixRuta(RUTES, 'taules/t-3')).toEqual({ ruta: RUTES[1], params: { taulaId: 't-3' } });
    expect(coincidixRuta(RUTES, 'diari/2026-10-02')?.params).toEqual({ dia: '2026-10-02' });
    expect(coincidixRuta(RUTES, 'diari/2026-02-30')).toBeNull();
    expect(coincidixRuta(RUTES, 'taules/T-3')).toBeNull();
    expect(coincidixRuta(RUTES, 'taules/%2e%2e')).toBeNull();
    expect(coincidixRuta(RUTES, 'caixa')).toBeNull();
    expect(coincidixRuta(null, 'taules')).toBeNull();
  });
});

describe('hooks', () => {
  const VALIDADORS = { dia: esData, vista: esSlug };
  let consulta;
  function Sonda({ rutes }) {
    consulta = useParametresConsulta(VALIDADORS);
    const coincidencia = useRutaApp(rutes);
    return <output data-testid="ruta">{coincidencia ? coincidencia.ruta.path : 'cap'}</output>;
  }

  test('useParametresConsulta llig només el declarat i vàlid, i escriu amb push', () => {
    window.history.replaceState(null, '', '/app/salut/diari?dia=2026-10-02&vista=Setmana&altre=x');
    const { getByTestId } = render(<BrowserRouter><Sonda rutes={[{ path: 'diari' }]} /></BrowserRouter>);
    expect(getByTestId('ruta').textContent).toBe('diari');
    expect(consulta[0]).toEqual({ dia: '2026-10-02', vista: null });

    const llarg = window.history.length;
    let fet;
    act(() => { fet = consulta[1]({ vista: 'mes' }); });
    expect(fet).toBe(true);
    expect(window.location.search).toBe('?dia=2026-10-02&vista=mes&altre=x');
    expect(window.history.length).toBe(llarg + 1);
    expect(consulta[0]).toEqual({ dia: '2026-10-02', vista: 'mes' });

    /* Un valor invàlid o un paràmetre no declarat no escriu res. */
    act(() => { fet = consulta[1]({ dia: '2026-02-30' }); });
    expect(fet).toBe(false);
    act(() => { fet = consulta[1]({ nom: 'Pepa' }); });
    expect(fet).toBe(false);
    /* P1-R4 · Un nom heretat d'Object.prototype tampoc és un paràmetre declarat. */
    for (const nom of ['constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
      expect(() => act(() => { fet = consulta[1]({ [nom]: 'x' }); }), nom).not.toThrow();
      expect(fet, nom).toBe(false);
    }
    expect(window.location.search).toBe('?dia=2026-10-02&vista=mes&altre=x');

    /* Esborrar és null; la canonització pot demanar replace. */
    act(() => { consulta[1]({ dia: null }, { replace: true }); });
    expect(window.location.search).toBe('?vista=mes&altre=x');
    expect(window.history.length).toBe(llarg + 1);
  });
});
