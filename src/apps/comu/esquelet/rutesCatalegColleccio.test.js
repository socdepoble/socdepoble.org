/* Esquelet comú de catàleg i col·lecció · les rutes que genera per a
   ClosaAplicacio: les accepta la plataforma tal com venen, en els dos ordres
   de pantalla estreta, amb paràmetres i amb una columna esquerra. */
import { describe, expect, test } from 'vitest';
import { coincidixRuta, esIdOpac, validaRutes, validaTaulaDeClosa } from '../../plataforma/index.js';
import { manifestDeProva } from '../../plataforma/__fixtures__/manifests.js';
import { rutesCatalegColleccio } from './rutesCatalegColleccio.js';

const Cataleg = () => null;
const Colleccio = () => null;
const Colleccions = () => null;

describe('rutesCatalegColleccio', () => {
  test('catàleg primer (el TPV): la col·lecció al mig, el catàleg al detall i el panell /colleccio', () => {
    const rutes = rutesCatalegColleccio({ path: 'caixa', Cataleg, Colleccio });
    expect(rutes).toEqual([
      { path: 'caixa', Mig: Colleccio, Detall: Cataleg, estret: 'detall' },
      { path: 'caixa/colleccio', Mig: Colleccio, Detall: Cataleg, estret: 'mig' }
    ]);
    expect(validaTaulaDeClosa(rutes, manifestDeProva())).toEqual({ ok: true, errors: [] });
  });

  test('col·lecció primer (La Compra): la mateixa taula amb el panell /cataleg', () => {
    const rutes = rutesCatalegColleccio({ path: 'inici', Cataleg, Colleccio, Esquerra: Colleccions, primer: 'colleccio' });
    expect(rutes.map((r) => [r.path, r.estret, r.Esquerra === Colleccions])).toEqual([
      ['inici', 'mig', true],
      ['inici/cataleg', 'detall', true]
    ]);
    expect(validaTaulaDeClosa(rutes, manifestDeProva()).ok).toBe(true);
  });

  test('amb paràmetres i un tram propi; es pot sumar a una taula més gran', () => {
    const rutes = [
      ...rutesCatalegColleccio({ path: 'caixa/:taula', params: { taula: esIdOpac }, Cataleg, Colleccio, tram: 'comanda' }),
      { path: 'inici', Mig: Colleccio, Detall: Cataleg }
    ];
    expect(rutes.map((r) => r.path)).toEqual(['caixa/:taula', 'caixa/:taula/comanda', 'inici']);
    expect(validaRutes(rutes, { columnes: true })).toEqual({ ok: true, errors: [] });
    expect(validaTaulaDeClosa(rutes, manifestDeProva()).ok).toBe(true);
  });

  /* ESQ-R6 · Amb diverses col·leccions (tiquets oberts, llistes), l'activa va
     al camí: <entrada>/<id> i el seu panell <entrada>/<id>/<tram>. */
  test('amb rutaColleccio: la col·lecció activa al camí, darrere de les rutes literals', () => {
    const rutes = rutesCatalegColleccio({ path: 'caixa', Cataleg, Colleccio, Esquerra: Colleccions, rutaColleccio: { parametre: 'tiquet' } });
    expect(rutes.map((r) => [r.path, r.estret])).toEqual([
      ['caixa', 'detall'], ['caixa/colleccio', 'mig'], ['caixa/:tiquet', 'detall'], ['caixa/:tiquet/colleccio', 'mig']
    ]);
    expect(validaTaulaDeClosa(rutes, manifestDeProva())).toEqual({ ok: true, errors: [] });
    expect(coincidixRuta(rutes, 'caixa/taula-3')).toMatchObject({ params: { tiquet: 'taula-3' } });
    expect(coincidixRuta(rutes, 'caixa/taula-3/colleccio')).toMatchObject({ ruta: { estret: 'mig' }, params: { tiquet: 'taula-3' } });
    /* El tram del panell és el panell, no cap col·lecció; i el validador mana. */
    expect(coincidixRuta(rutes, 'caixa/colleccio').ruta.path).toBe('caixa/colleccio');
    expect(coincidixRuta(rutes, 'caixa/colleccio/colleccio')).toBeNull();
    expect(coincidixRuta(rutesCatalegColleccio({ path: 'caixa', Cataleg, Colleccio, rutaColleccio: { parametre: 'tiquet', valida: (v) => v.startsWith('t-') } }), 'caixa/barra')).toBeNull();
  });

  test('amb rutaColleccio i col·lecció primer, sobre una entrada amb paràmetres', () => {
    const rutes = rutesCatalegColleccio({ path: 'caixa/:taula', params: { taula: esIdOpac }, Cataleg, Colleccio, primer: 'colleccio', rutaColleccio: { parametre: 'llista' } });
    expect(rutes.map((r) => [r.path, r.estret])).toEqual([
      ['caixa/:taula', 'mig'], ['caixa/:taula/cataleg', 'detall'], ['caixa/:taula/:llista', 'mig'], ['caixa/:taula/:llista/cataleg', 'detall']
    ]);
    expect(validaTaulaDeClosa(rutes, manifestDeProva()).ok).toBe(true);
    expect(coincidixRuta(rutes, 'caixa/t1/casa/cataleg')).toMatchObject({ params: { taula: 't1', llista: 'casa' } });
  });

  test('un paràmetre de col·lecció dolent no passa la validació de la closca', () => {
    for (const parametre of [undefined, 'Tiquet', 'tiquet-obert']) {
      expect(validaTaulaDeClosa(rutesCatalegColleccio({ path: 'caixa', Cataleg, Colleccio, rutaColleccio: { parametre } }), manifestDeProva()).ok, String(parametre)).toBe(false);
    }
  });

  test('una taula dolenta no passa: tram que no és slug, entrada que no és del manifest, columnes que falten', () => {
    expect(validaTaulaDeClosa(rutesCatalegColleccio({ path: 'caixa', Cataleg, Colleccio, tram: 'Comanda' }), manifestDeProva()).ok).toBe(false);
    expect(validaTaulaDeClosa(rutesCatalegColleccio({ path: 'barra', Cataleg, Colleccio }), manifestDeProva()).errors.join(' '))
      .toContain('«barra» no és cap entrada del manifest');
    expect(validaTaulaDeClosa(rutesCatalegColleccio({ path: 'caixa', Colleccio }), manifestDeProva()).errors.join(' '))
      .toContain('la columna Detall no és cap component');
  });
});
