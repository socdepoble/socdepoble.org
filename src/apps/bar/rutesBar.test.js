/* El Bar · rutesBar.js i manifest.js contra la plataforma (disseny del Bar
   §A.13): la taula és vàlida per a ClosaAplicacio, cada entrada de la barra
   lateral té ruta, i els validadors dels paràmetres rebutgen '..', '%2e',
   majúscules i espais. */
import { describe, expect, test } from 'vitest';
import { coincidixRuta, validaRutes, validaTaulaDeClosa } from '../plataforma/index.js';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import manifestCru from './manifest.js';
import { RUTES_BAR } from './rutesBar.js';
import { CatalegCaixa, ComandaCaixa } from './vistes/Caixa.jsx';
import { CobramentCaixa, DivisioCaixa } from './vistes/Cobrament.jsx';
import { PasTancament } from './vistes/Tancament.jsx';

const { manifest } = validaManifestApp(manifestCru);

describe('manifest', () => {
  test('és un sdp.app.v1 vàlid, premium, de desenvolupament i sense capacitats del backend', () => {
    expect(validaManifestApp(manifestCru)).toMatchObject({ ok: true, errors: [] });
    expect(manifest).toMatchObject({ id: 'bar', entradaPerDefecte: 'caixa', nivell: 'premium', dret: 'sdp.app.bar', capacitats: [], dadesPersonals: false });
    expect(manifest.grups.map((g) => g.id)).toEqual(['servei', 'carta', 'torn', 'ajustos']);
    expect(manifest.interruptors.map((i) => [i.id, i.actiuPerDefecte])).toEqual([['taules', true], ['escandalls', true], ['cuina', false]]);
  });
});

describe('la taula de rutes', () => {
  test('passa validaTaulaDeClosa i validaRutes amb columnes', () => {
    expect(validaTaulaDeClosa(RUTES_BAR, manifest)).toEqual({ ok: true, errors: [] });
    expect(validaRutes(RUTES_BAR, { columnes: true })).toEqual({ ok: true, errors: [] });
  });

  test('cada entrada de la barra lateral té almenys una ruta, i cap ruta va fora de les entrades', () => {
    const primers = new Set(RUTES_BAR.map((r) => r.path.split('/')[0]));
    expect([...primers].sort()).toEqual(manifest.entrades.map((e) => e.slug).sort());
    for (const entrada of manifest.entrades) expect(RUTES_BAR.some((r) => r.path === entrada.slug), entrada.slug).toBe(true);
  });

  test.each([
    ['caixa', { Detall: CatalegCaixa, Mig: ComandaCaixa, estret: 'detall' }, {}],
    ['caixa/colleccio', { Mig: ComandaCaixa, estret: 'mig' }, {}],
    ['caixa/cobrar', { Detall: CobramentCaixa }, {}],
    ['caixa/c-mga1b2c3-4f2a', { Detall: CatalegCaixa }, { comanda: 'c-mga1b2c3-4f2a' }],
    ['caixa/c-mga1b2c3-4f2a/colleccio', { Mig: ComandaCaixa, estret: 'mig' }, { comanda: 'c-mga1b2c3-4f2a' }],
    ['caixa/c-mga1b2c3-4f2a/dividir', { Detall: DivisioCaixa }, { comanda: 'c-mga1b2c3-4f2a' }],
    ['taules/t3', { Detall: CatalegCaixa }, { taula: 't3' }],
    ['taules/terrassa-2/cobrar', { Detall: CobramentCaixa }, { taula: 'terrassa-2' }],
    ['tancament/resum', { Detall: PasTancament }, { pas: 'resum' }],
    ['tiquets/k-mga1b2c3-0000/retorn', {}, { tiquet: 'k-mga1b2c3-0000' }],
    ['ajustos/sala', {}, { seccio: 'sala' }],
    ['ajustos/carta', {}, { seccio: 'carta' }]
  ])('%s', (resta, columnes, params) => {
    const coincidencia = coincidixRuta(RUTES_BAR, resta);
    expect(coincidencia).not.toBeNull();
    expect(coincidencia.params).toEqual(params);
    for (const [clau, valor] of Object.entries(columnes)) expect(coincidencia.ruta[clau], clau).toBe(valor);
  });

  test('«cobrar», «dividir» i «colleccio» no es poden llegir com una comanda', () => {
    for (const tram of ['cobrar', 'dividir', 'colleccio']) expect(coincidixRuta(RUTES_BAR, `caixa/${tram}`).params).toEqual({});
  });

  test('un pas del tancament o una secció dels ajustos que no existixen no casen', () => {
    expect(coincidixRuta(RUTES_BAR, 'tancament/final')).toBeNull();
    expect(coincidixRuta(RUTES_BAR, 'ajustos/secrets')).toBeNull();
  });

  test.each(['..', '%2e', '%2E%2E', 'T3', 'taula 3', 'taula%203', 'c-ABC'])('un paràmetre «%s» no casa amb cap ruta', (dolent) => {
    for (const base of ['caixa', 'taules', 'tiquets', 'torns', 'tancament', 'productes', 'escandalls', 'ingredients', 'modificadors', 'ajustos']) {
      const coincidencia = coincidixRuta(RUTES_BAR, `${base}/${dolent}`);
      if (coincidencia) expect(Object.values(coincidencia.params), `${base}/${dolent}`).not.toContain(dolent);
    }
  });

  test('cada validador rebutja \'..\', \'%2e\', majúscules, espais i barres', () => {
    for (const ruta of RUTES_BAR) {
      for (const [nom, valida] of Object.entries(ruta.params || {})) {
        for (const dolent of ['..', '%2e', 'Taula', 'taula 3', 'a/b', '']) expect(valida(dolent), `${ruta.path} :${nom} «${dolent}»`).toBe(false);
      }
    }
  });
});
