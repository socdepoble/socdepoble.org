// @vitest-environment node
/* Plataforma d'Apps Enxufables · el manifest sdp.app.v1 (manifestApp.js). */
import { describe, expect, test } from 'vitest';
import { carregaDeProva, manifestDeProva, manifestExternDeProva } from './__fixtures__/manifests.js';
import { ICONES_APP, iconaDe } from './iconesApp.js';
import { NOMS_ICONES, PREFIXOS_ELEMENT, esElementPermes, rutaDeApp, titolDe, validaManifestApp } from './manifestApp.js';

const errorsDe = (m, opcions) => validaManifestApp(m, opcions).errors.join(' | ');

describe('validaManifestApp · el manifest bo', () => {
  test('un manifest intern vàlid es torna normalitzat i congelat', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestDeProva());
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest.origen).toBe('interna');
    expect(manifest.grups).toEqual([]);
    expect(manifest.interruptors).toEqual([]);
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.entrades)).toBe(true);
    expect(Object.isFrozen(manifest.entrades[0])).toBe(true);
    expect(Object.isFrozen(manifest.titol)).toBe(true);
    expect(manifest.carrega).toBe(carregaDeProva);
  });

  test('carrega null (app fora del build) també és vàlid', () => {
    expect(validaManifestApp(manifestDeProva({ carrega: null })).ok).toBe(true);
  });

  test('grups, permisos d’entrada i interruptors interns', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestDeProva({
      grups: [{ id: 'gestio', titol: { ca: 'Gestió' } }],
      entrades: [
        { slug: 'inici', titol: { ca: 'Inici' }, icona: 'LayoutGrid' },
        { slug: 'caixa', titol: { ca: 'Caixa' }, icona: 'Receipt', grup: 'gestio', permis: 'sessio' }
      ],
      interruptors: [
        { id: 'cuina', titol: { ca: 'Cuina' } },
        { id: 'escandalls', titol: { ca: 'Escandalls' }, nivell: 'premium', dret: 'sdp.app.prova.escandalls', actiuPerDefecte: true }
      ]
    }));
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest.interruptors[0]).toEqual({ id: 'cuina', titol: { ca: 'Cuina' }, nivell: 'gratuit', actiuPerDefecte: true });
    expect(manifest.entrades[1]).toMatchObject({ grup: 'gestio', permis: 'sessio' });
  });
});

describe('validaManifestApp · el que no passa', () => {
  test.each([
    ['schema', { schema: 'sdp.app.v2' }, 'schema'],
    ['id amb majúscules', { id: 'Bar' }, 'id'],
    ['id amb punts', { id: '..' }, 'id'],
    ['id amb guió final', { id: 'bar-' }, 'id'],
    ['id massa curt', { id: 'b' }, 'id'],
    ['títol sense ca', { titol: { es: 'Bar' } }, 'falta el títol en valencià'],
    ['títol amb HTML', { titol: { ca: '<b>Bar</b>' } }, 'HTML'],
    ['títol en una llengua desconeguda', { titol: { ca: 'Bar', fr: 'Bar' } }, 'llengua desconeguda'],
    ['icona fora de la llista', { icona: 'Skull' }, 'icona fora de la llista tancada'],
    ['icona en SVG', { icona: '<svg/>' }, 'icona fora de la llista tancada'],
    ['sense entrades', { entrades: [] }, 'cal almenys una entrada'],
    ['slug amb majúscules', { entrades: [{ slug: 'Inici', titol: { ca: 'Inici' }, icona: 'Inbox' }], entradaPerDefecte: 'Inici' }, 'slug'],
    ['slug repetit', { entrades: [{ slug: 'inici', titol: { ca: 'A' }, icona: 'Inbox' }, { slug: 'inici', titol: { ca: 'B' }, icona: 'Inbox' }] }, 'slug repetit'],
    ['entrada per defecte absent', { entradaPerDefecte: 'no-hi-es' }, 'entradaPerDefecte'],
    ['grup inexistent', { entrades: [{ slug: 'inici', titol: { ca: 'A' }, icona: 'Inbox', grup: 'fantasma' }] }, 'no existix'],
    ['grup sense entrades', { grups: [{ id: 'buit', titol: { ca: 'Buit' } }] }, 'no té cap entrada'],
    ['permisos absents', { permisos: undefined }, 'permisos'],
    ['permís desconegut', { permisos: { veure: 'tothom' } }, 'permisos.veure'],
    ['capacitat inventada', { capacitats: ['teletransport'] }, 'no és cap capacitat del contracte'],
    ['nivell desconegut', { nivell: 'gold' }, 'nivell'],
    ['premium sense dret', { nivell: 'premium' }, 'necessita un dret'],
    ['dret mal format', { nivell: 'premium', dret: 'bar' }, 'dret'],
    ['actiuPerDefecte no booleà', { actiuPerDefecte: 'si' }, 'actiuPerDefecte'],
    ['entorn desconegut', { entorn: 'staging' }, 'entorn'],
    ['dades personals desconegudes', { dadesPersonals: 'bancaries' }, 'dadesPersonals'],
    ['carrega que no és funció', { carrega: '../bar/AppBar.jsx' }, 'carrega'],
    ['clau desconeguda', { html: '<p>hola</p>' }, 'clau desconeguda «html»'],
    ['ruta declarada', { ruta: '/bar' }, 'clau desconeguda «ruta»'],
    ['interruptor premium sense dret', { interruptors: [{ id: 'cuina', titol: { ca: 'Cuina' }, nivell: 'premium' }] }, 'interruptor premium']
  ])('%s', (_nom, canvis, missatge) => {
    const { ok, manifest } = validaManifestApp(manifestDeProva(canvis));
    expect(ok).toBe(false);
    expect(manifest).toBeNull();
    expect(errorsDe(manifestDeProva(canvis))).toContain(missatge);
  });

  test('ni null ni una llista són un manifest', () => {
    expect(validaManifestApp(null).ok).toBe(false);
    expect(validaManifestApp([]).ok).toBe(false);
  });
});

describe('apps externes', () => {
  test('una app externa porta element amb prefix permés i cap carrega', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestExternDeProva(), { origen: 'externa' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest).toMatchObject({ origen: 'externa', element: 'sollutia-reserves' });
    expect('carrega' in manifest).toBe(false);
  });

  test.each([
    ['prefix no permés', { element: 'evil-widget' }],
    ['sense guió', { element: 'sollutia' }],
    ['només el prefix', { element: 'sdp-ext-' }],
    ['majúscules', { element: 'sollutia-Reserves' }],
    ['HTML', { element: '<sollutia-x>' }],
    ['carrega en una externa', { carrega: carregaDeProva }]
  ])('%s', (_nom, canvis) => {
    expect(validaManifestApp(manifestExternDeProva(canvis), { origen: 'externa' }).ok).toBe(false);
  });

  test('una interna no pot portar element', () => {
    expect(errorsDe(manifestDeProva({ element: 'sollutia-x' }))).toContain('clau desconeguda «element»');
  });

  test('esElementPermes coneix només els prefixos de la plataforma', () => {
    expect(PREFIXOS_ELEMENT).toEqual(['sollutia-', 'sdp-ext-']);
    expect(esElementPermes('sdp-ext-reserves')).toBe(true);
    expect(esElementPermes('wp-reserves')).toBe(false);
  });
});

describe('icones i ajudants', () => {
  test('la llista tancada i el mapa de lucide són exactament els mateixos noms', () => {
    expect(Object.keys(ICONES_APP).sort()).toEqual([...NOMS_ICONES].sort());
    for (const nom of NOMS_ICONES) expect(ICONES_APP[nom], nom).toBeTruthy();
  });

  test('una icona desconeguda cau a AppWindow, mai a un SVG d’una app', () => {
    expect(iconaDe('Skull')).toBe(ICONES_APP.AppWindow);
    expect(iconaDe('toString')).toBe(ICONES_APP.AppWindow);
  });

  test('titolDe tria la llengua i cau al valencià', () => {
    expect(titolDe({ ca: 'El Bar', es: 'El Bar (es)' }, 'es')).toBe('El Bar (es)');
    expect(titolDe({ ca: 'El Bar' }, 'en')).toBe('El Bar');
    expect(titolDe(null)).toBe('');
  });

  test('rutaDeApp deriva la ruta de l’id', () => {
    expect(rutaDeApp('bar')).toBe('/app/bar');
    expect(rutaDeApp('bar', 'taules', 't-3')).toBe('/app/bar/taules/t-3');
    expect(rutaDeApp('bar', '', null, undefined)).toBe('/app/bar');
  });
});
