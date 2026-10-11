/* Plataforma d'Apps Enxufables · el registre (registreApps.js). */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { manifestDeProva, manifestExternDeProva, manifestModulDeProva } from './__fixtures__/manifests.js';
import {
  APPS_INTERNES, DADES_RESERVADES, MANIFESTS_INTERNS, analitzaRuta, appDeRuta, creaRegistre, entradaActiva, llistaApps,
  registraAppExterna, retiraAppExterna, subscriu
} from './registreApps.js';
import { validaManifestApp } from './manifestApp.js';

afterEach(() => { vi.restoreAllMocks(); });

describe('les apps internes', () => {
  test('cada manifest de src/apps/<id>/manifest.js és vàlid (cap queda fora del registre)', () => {
    for (const cru of MANIFESTS_INTERNS) {
      expect(validaManifestApp(cru).errors, cru?.id).toEqual([]);
    }
    expect(APPS_INTERNES.map((app) => app.id)).toEqual(MANIFESTS_INTERNS.map((m) => m.id));
  });

  test('bar i salut hi són, amb la càrrega compilada en desenvolupament', () => {
    expect(APPS_INTERNES.map((app) => app.id)).toEqual(expect.arrayContaining(['bar', 'salut']));
    for (const app of APPS_INTERNES) expect(typeof app.carrega, app.id).toBe('function');
    expect(APPS_INTERNES.find((app) => app.id === 'salut').dadesPersonals).toBe('salut');
  });

  /* Lot NEVERA (T8) · La Nevera de Casa, darrere de bar i salut, amb la
     mateixa porta de compilació (VITE_SDP_APP_NEVERA) i sense dades personals. */
  test('nevera hi és, darrere de bar i salut, gratuïta, sense dades personals i amb les seues entrades', () => {
    const ids = APPS_INTERNES.map((app) => app.id);
    expect(ids.indexOf('nevera')).toBeGreaterThan(ids.indexOf('salut'));
    expect(ids.indexOf('salut')).toBeGreaterThan(ids.indexOf('bar'));
    const nevera = APPS_INTERNES.find((app) => app.id === 'nevera');
    expect(nevera).toMatchObject({ origen: 'interna', nivell: 'gratuit', dadesPersonals: false, entradaPerDefecte: 'llista' });
    expect(typeof nevera.carrega).toBe('function');
    /* Onada 12 (261011; ordres 261011_0130, punt 6) · «receptes», darrere d'«A casa». */
    expect(nevera.entrades.map((entrada) => entrada.slug)).toEqual(['llistes', 'llista', 'cataleg', 'casa', 'receptes', 'temporada', 'ajustos']);
    expect(appDeRuta('/app/nevera/llista/casa')?.id).toBe('nevera');
    expect(entradaActiva(nevera, '/app/nevera/casa/cal-comprar')?.slug).toBe('casa');
  });

  /* Onada 3 (RSS) · Notícies del Poble, darrere de la Nevera, amb la seua
     porta de compilació (VITE_SDP_APP_LECTOR), sense dades personals i només
     en desenvolupament fins que l'amfitrió en proveïsca les notícies. */
  test('lector hi és, darrere de nevera, gratuïta, sense dades personals, en desenvolupament i amb les seues entrades', () => {
    const ids = APPS_INTERNES.map((app) => app.id);
    expect(ids.indexOf('lector')).toBeGreaterThan(ids.indexOf('nevera'));
    const lector = APPS_INTERNES.find((app) => app.id === 'lector');
    expect(lector).toMatchObject({
      origen: 'interna', nivell: 'gratuit', dadesPersonals: false, entorn: 'desenvolupament', capacitats: [], entradaPerDefecte: 'noticies'
    });
    expect(typeof lector.carrega).toBe('function');
    expect(lector.entrades.map((entrada) => entrada.slug)).toEqual(['noticies', 'fonts']);
    expect(appDeRuta('/app/lector/noticies/hui')?.id).toBe('lector');
    expect(entradaActiva(lector, '/app/lector/fonts/colleccio')?.slug).toBe('fonts');
  });

  test('el registre del document les llista en ordre', () => {
    expect(llistaApps().slice(0, APPS_INTERNES.length)).toEqual(APPS_INTERNES);
  });
});

describe('analitzaRuta, appDeRuta i entradaActiva', () => {
  test.each([
    ['/xat', { dins: false, id: null, trams: null }],
    ['/apps', { dins: false, id: null, trams: null }],
    ['/app', { dins: true, id: null, trams: [] }],
    ['/app/', { dins: true, id: null, trams: [] }],
    ['/app/bar', { dins: true, id: 'bar', trams: [] }],
    ['/app/bar/', { dins: true, id: 'bar', trams: [] }],
    ['/app/bar/taules/t-3', { dins: true, id: 'bar', trams: ['taules', 't-3'] }],
    ['/app/bar/%2e%2e/x', { dins: true, id: 'bar', trams: null }],
    ['/app/bar/../x', { dins: true, id: 'bar', trams: null }],
    ['/app/Bar/taules', { dins: true, id: 'Bar', trams: null }],
    ['/app/bar//taules', { dins: true, id: 'bar', trams: null }],
    /* P1-R3 · La barra doble just després de /app tampoc es menja. */
    ['/app//bar/taules', { dins: true, id: null, trams: null }],
    ['/app//', { dins: true, id: null, trams: null }],
    ['/app/bar/taula%20gran', { dins: true, id: 'bar', trams: null }]
  ])('%s', (ruta, esperat) => {
    expect(analitzaRuta(ruta)).toEqual(esperat);
  });

  test('appDeRuta torna el manifest registrat de /app/<id>/…', () => {
    expect(appDeRuta('/app/bar/caixa')?.id).toBe('bar');
    expect(appDeRuta('/app/salut')?.id).toBe('salut');
    expect(appDeRuta('/app/no-existix')).toBeNull();
    expect(appDeRuta('/app')).toBeNull();
    expect(appDeRuta('/bar')).toBeNull();
  });

  test('entradaActiva: el primer tram després de l’id, si és una entrada', () => {
    const registre = creaRegistre({ internes: [manifestDeProva()] });
    const app = registre.appPerId('prova');
    expect(entradaActiva(app, '/app/prova/caixa')?.slug).toBe('caixa');
    expect(entradaActiva(app, '/app/prova/caixa/t-3')?.slug).toBe('caixa');
    expect(entradaActiva(app, '/app/prova')).toBeNull();
    expect(entradaActiva(app, '/app/prova/fantasma')).toBeNull();
    expect(entradaActiva(app, '/app/altra/caixa')).toBeNull();
    expect(entradaActiva(null, '/app/prova/caixa')).toBeNull();
  });
});

describe('creaRegistre', () => {
  test('una interna invàlida queda fora i ho diu la consola, sense tombar res', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const registre = creaRegistre({ internes: [manifestDeProva(), manifestDeProva({ id: 'mala', icona: 'Skull' })] });
    expect(registre.llista().map((app) => app.id)).toEqual(['prova']);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  test('un id intern repetit també queda fora', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const registre = creaRegistre({ internes: [manifestDeProva(), manifestDeProva({ titol: { ca: 'Còpia' } })] });
    expect(registre.llista()).toHaveLength(1);
  });

  test('registraAppExterna: valida, avisa els subscrits i canvia la instantània', () => {
    const registre = creaRegistre({ internes: [manifestDeProva()] });
    const abans = registre.llista();
    const avis = vi.fn();
    const desubscriu = registre.subscriu(avis);
    const resultat = registre.registraAppExterna(manifestExternDeProva());
    expect(resultat.ok).toBe(true);
    expect(avis).toHaveBeenCalledTimes(1);
    const despres = registre.llista();
    expect(despres).not.toBe(abans);
    expect(Object.isFrozen(despres)).toBe(true);
    expect(despres.map((app) => [app.id, app.origen])).toEqual([['prova', 'interna'], ['reserves', 'externa']]);
    /* La instantània és estable mentre no canvia res (useSyncExternalStore). */
    expect(registre.llista()).toBe(despres);
    desubscriu();
    expect(registre.retiraAppExterna('reserves')).toBe(true);
    expect(avis).toHaveBeenCalledTimes(1);
    expect(registre.llista().map((app) => app.id)).toEqual(['prova']);
  });

  test('registraAppExterna rebutja un manifest invàlid o un id ja ocupat, sense avisar', () => {
    const registre = creaRegistre({ internes: [manifestDeProva()] });
    const avis = vi.fn();
    registre.subscriu(avis);
    expect(registre.registraAppExterna(manifestExternDeProva({ icona: 'Skull' })).ok).toBe(false);
    expect(registre.registraAppExterna(manifestExternDeProva({ element: 'evil-widget' })).ok).toBe(false);
    expect(registre.registraAppExterna(manifestExternDeProva({ titol: { ca: '<img src=x>' } })).ok).toBe(false);
    const ocupat = registre.registraAppExterna(manifestExternDeProva({ id: 'prova' }));
    expect(ocupat.ok).toBe(false);
    expect(ocupat.errors.join(' ')).toContain('ja hi ha una app');
    expect(avis).not.toHaveBeenCalled();
    expect(registre.retiraAppExterna('prova')).toBe(false);
  });

  test('componentDe: un lazy per id, mai recreat; res per a les externes', () => {
    const registre = creaRegistre({ internes: [manifestDeProva(), manifestDeProva({ id: 'sense-build', carrega: null })] });
    registre.registraAppExterna(manifestExternDeProva());
    const component = registre.componentDe('prova');
    expect(component).toBeTruthy();
    expect(registre.componentDe('prova')).toBe(component);
    expect(registre.componentDe('sense-build')).toBeNull();
    expect(registre.componentDe('reserves')).toBeNull();
    expect(registre.componentDe('fantasma')).toBeNull();
  });

  /* Onada 6 (261009, ADR-2026-12) · sdp.modul.v1. */
  test('registraModul: valida, avisa i el mòdul entra amb origen «modul»; mai sobre un id ocupat, tampoc el d’una interna', () => {
    const registre = creaRegistre({ internes: [manifestDeProva()] });
    const avis = vi.fn();
    registre.subscriu(avis);
    const resultat = registre.registraModul(manifestModulDeProva());
    expect(resultat).toMatchObject({ ok: true, errors: [], manifest: { id: 'llibreta', origen: 'modul', nucli: '^1' } });
    expect(avis).toHaveBeenCalledTimes(1);
    expect(registre.llista().map((app) => [app.id, app.origen])).toEqual([['prova', 'interna'], ['llibreta', 'modul']]);
    const ocupat = registre.registraModul(manifestModulDeProva({ id: 'prova' }));
    expect(ocupat.ok).toBe(false);
    expect(ocupat.errors.join(' ')).toContain('ja hi ha una app «prova»');
    expect(registre.registraModul(manifestModulDeProva()).errors.join(' ')).toContain('ja hi ha una app «llibreta»');
    expect(registre.registraAppExterna(manifestExternDeProva({ id: 'llibreta' })).ok).toBe(false);
    expect(avis).toHaveBeenCalledTimes(1);
  });

  test('un id amb dades sensibles reservades (la Gestoria, Salut) només entra declarant-les igual, també fora de les internes', () => {
    for (const { id, dadesPersonals } of MANIFESTS_INTERNS) {
      if (dadesPersonals) expect(DADES_RESERVADES[id], id).toBe(dadesPersonals);
    }
    const registre = creaRegistre({ internes: [] });
    const fluix = registre.registraModul(manifestModulDeProva({ id: 'gestoria', dadesPersonals: false }));
    expect(fluix).toEqual({ ok: false, errors: ['dadesPersonals: «gestoria» guarda dades financeres i ho ha de declarar'], manifest: null });
    expect(registre.registraModul(manifestModulDeProva({ id: 'gestoria', dadesPersonals: 'salut' })).ok).toBe(false);
    expect(registre.registraAppExterna(manifestExternDeProva({ id: 'salut', dadesPersonals: false })).ok).toBe(false);
    expect(registre.llista()).toEqual([]);
    expect(registre.registraModul(manifestModulDeProva({ id: 'gestoria', dadesPersonals: 'financeres' })).ok).toBe(true);
    expect(registre.appPerId('gestoria')).toMatchObject({ origen: 'modul', dadesPersonals: 'financeres' });
  });

  test('registraModul rebutja un manifest mal format, d’un altre origen o que demana un nucli que este no satisfà', () => {
    const registre = creaRegistre({ internes: [] });
    expect(registre.registraModul(manifestModulDeProva({ cos: { cami: '/cos.js', integrity: 'sha384-curt' } })).ok).toBe(false);
    expect(registre.registraModul(manifestExternDeProva()).ok).toBe(false);
    const futur = registre.registraModul(manifestModulDeProva({ nucli: '^2' }));
    expect(futur).toEqual({ ok: false, errors: ['nucli: este nucli és el 1.1.0 i el mòdul demana ^2'], manifest: null });
    expect(registre.registraModul(manifestModulDeProva({ nucli: '^1.9' })).ok).toBe(false);
    expect(registre.registraModul(manifestModulDeProva({ nucli: '^1.2' })).ok).toBe(false);
    expect(registre.llista()).toEqual([]);
  });

  test('componentDe d’un mòdul: un lazy per id que demana el cos al carregador; retirar-lo l’oblida', () => {
    const carregador = { carregaCos: vi.fn(() => Promise.resolve({ default: () => null })), oblida: vi.fn() };
    const registre = creaRegistre({ internes: [], carregador });
    registre.registraModul(manifestModulDeProva());
    const component = registre.componentDe('llibreta');
    expect(component).toBeTruthy();
    expect(registre.componentDe('llibreta')).toBe(component);
    expect(carregador.carregaCos).not.toHaveBeenCalled();
    expect(registre.retiraAppExterna('llibreta')).toBe(true);
    expect(carregador.oblida).toHaveBeenCalledWith('llibreta');
    expect(registre.componentDe('llibreta')).toBeNull();
    registre.registraModul(manifestModulDeProva());
    expect(registre.componentDe('llibreta')).not.toBe(component);
  });

  test('les funcions del registre del document funcionen sense nucli nou', () => {
    const avis = vi.fn();
    const desubscriu = subscriu(avis);
    try {
      expect(registraAppExterna(manifestExternDeProva({ id: 'reserves-doc' })).ok).toBe(true);
      expect(appDeRuta('/app/reserves-doc/inici')?.origen).toBe('externa');
      expect(avis).toHaveBeenCalledTimes(1);
    } finally {
      retiraAppExterna('reserves-doc');
      desubscriu();
    }
    expect(appDeRuta('/app/reserves-doc')).toBeNull();
  });
});
