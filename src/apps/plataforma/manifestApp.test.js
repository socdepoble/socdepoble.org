// @vitest-environment node
/* Plataforma d'Apps Enxufables · el manifest sdp.app.v1 (manifestApp.js). */
import { describe, expect, test } from 'vitest';
import {
  INTEGRITAT_DE_PROVA, carregaDeProva, manifestDeProva, manifestExternDeProva, manifestModulDeProva
} from './__fixtures__/manifests.js';
import { ICONES_APP, iconaDe } from './iconesApp.js';
import {
  NOMS_ICONES, ORIGENS_APP, PATRO_INTEGRITAT, PERMISOS_TITULAR, PREFIXOS_ELEMENT, esCamiDeRecurs, esElementPermes, rutaDeApp, titolDe,
  validaManifestApp
} from './manifestApp.js';

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

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B: la boina de la
   Gestoria porta el titular de la sessió) · permisos.titular 'sessio': el
   pont dona el nom, l'avatar i el poble de la persona només a l'app interna
   que el declara. Cap app externa ni cap mòdul no el pot declarar. */
describe('permisos.titular', () => {
  test('«sessio» en una app interna: vàlid, normalitzat i congelat', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestDeProva({ permisos: { veure: 'public', escriure: 'sessio', titular: 'sessio' } }));
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest.permisos).toEqual({ veure: 'public', escriure: 'sessio', titular: 'sessio' });
    expect(Object.isFrozen(manifest.permisos)).toBe(true);
    expect(PERMISOS_TITULAR).toEqual(['sessio']);
    expect(Object.isFrozen(PERMISOS_TITULAR)).toBe(true);
  });

  test('sense declarar-lo, els permisos de sempre: cap clau titular', () => {
    const { manifest } = validaManifestApp(manifestDeProva());
    expect(manifest.permisos).toEqual({ veure: 'public' });
    expect('titular' in manifest.permisos).toBe(false);
  });

  test.each([
    ['un altre valor', 'tothom'],
    ['un booleà', true],
    ['null', null],
    ['la majúscula', 'Sessio']
  ])('%s no és cap permís de titular', (_nom, titular) => {
    const resultat = validaManifestApp(manifestDeProva({ permisos: { veure: 'public', titular } }));
    expect(resultat.ok).toBe(false);
    expect(resultat.manifest).toBeNull();
    expect(resultat.errors.join(' | ')).toContain('permisos.titular: sessio');
  });

  test('una app externa o un mòdul no el poden declarar: només les apps internes', () => {
    const permisos = { veure: 'public', titular: 'sessio' };
    const externa = validaManifestApp(manifestExternDeProva({ permisos }), { origen: 'externa' });
    expect(externa.ok).toBe(false);
    expect(externa.errors.join(' | ')).toContain('només les apps internes');
    const modul = validaManifestApp(manifestModulDeProva({ permisos }), { origen: 'modul' });
    expect(modul.ok).toBe(false);
    expect(modul.errors.join(' | ')).toContain('només les apps internes');
    /* Sense el titular, les mateixes passen. */
    expect(validaManifestApp(manifestExternDeProva(), { origen: 'externa' }).ok).toBe(true);
    expect(validaManifestApp(manifestModulDeProva(), { origen: 'modul' }).ok).toBe(true);
  });

  test('una clau de permís desconeguda continua sent un error', () => {
    expect(errorsDe(manifestDeProva({ permisos: { veure: 'public', identitat: 'sessio' } }))).toContain('permisos: clau desconeguda «identitat»');
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

/* Onada 6 (261009, ADR-2026-12) · el contracte sdp.modul.v1. */
describe('mòduls (origen «modul»)', () => {
  const modul = (canvis) => validaManifestApp(manifestModulDeProva(canvis), { origen: 'modul' });

  test('un mòdul porta cos amb integritat sha384 i el rang del nucli; cap carrega ni element', () => {
    const { ok, errors, manifest } = modul();
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(manifest).toMatchObject({ origen: 'modul', nucli: '^1', cos: { cami: '/moduls/llibreta/cos-Ab12Cd34.js', integrity: INTEGRITAT_DE_PROVA } });
    expect('carrega' in manifest).toBe(false);
    expect('element' in manifest).toBe(false);
    expect('estils' in manifest).toBe(false);
    expect(Object.isFrozen(manifest.cos)).toBe(true);
    expect(ORIGENS_APP).toEqual(['interna', 'externa', 'modul']);
  });

  test('estils opcionals amb la mateixa forma, i URL http(s) absolutes', () => {
    const { ok, manifest } = modul({
      cos: { cami: 'https://poble.invalid/wp-content/plugins/socdepoble-modul-llibreta/dist/cos-Ab12Cd34.js?ver=1', integrity: INTEGRITAT_DE_PROVA },
      estils: { cami: '/moduls/llibreta/estils-Ab12Cd34.css', integrity: INTEGRITAT_DE_PROVA },
      nucli: '^1.0'
    });
    expect(ok).toBe(true);
    expect(manifest.estils).toEqual({ cami: '/moduls/llibreta/estils-Ab12Cd34.css', integrity: INTEGRITAT_DE_PROVA });
    expect(Object.isFrozen(manifest.estils)).toBe(true);
  });

  test.each([
    ['sense cos', { cos: undefined }, 'cos: cal { cami, integrity }'],
    ['cos protocol-relatiu', { cos: { cami: '//cdn.invalid/cos.js', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['cos amb barra invertida (un altre domini per al navegador)', { cos: { cami: '/\\cdn.invalid/cos.js', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['cos relatiu sense arrel', { cos: { cami: 'cos.js', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['cos en javascript:', { cos: { cami: 'javascript:alert(1)//.js', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['cos en data:', { cos: { cami: 'data:text/javascript,1;.js', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['cos amb credencials', { cos: { cami: 'https://u:p@poble.invalid/cos.js', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['cos que no és .js', { cos: { cami: '/moduls/llibreta/cos.css', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['cos amb espais', { cos: { cami: '/moduls/lli breta/cos.js', integrity: INTEGRITAT_DE_PROVA } }, 'cos.cami'],
    ['integritat sha256', { cos: { cami: '/cos.js', integrity: `sha256-${'A'.repeat(43)}=` } }, 'cos.integrity'],
    ['integritat curta', { cos: { cami: '/cos.js', integrity: 'sha384-abc' } }, 'cos.integrity'],
    ['clau desconeguda al cos', { cos: { cami: '/cos.js', integrity: INTEGRITAT_DE_PROVA, type: 'module' } }, 'cos: clau desconeguda «type»'],
    ['estils que no són .css', { estils: { cami: '/estils.js', integrity: INTEGRITAT_DE_PROVA } }, 'estils.cami'],
    ['sense nucli', { nucli: undefined }, 'nucli'],
    ['nucli sense rang', { nucli: '1' }, 'nucli'],
    ['nucli amb comodí', { nucli: '*' }, 'nucli'],
    ['carrega en un mòdul', { carrega: carregaDeProva }, 'clau desconeguda «carrega»'],
    ['element en un mòdul', { element: 'sdp-ext-llibreta' }, 'clau desconeguda «element»'],
    ['capacitat inventada', { capacitats: ['teletransport'] }, 'no és cap capacitat del contracte']
  ])('%s', (_nom, canvis, missatge) => {
    const { ok, manifest, errors } = modul(canvis);
    expect(ok).toBe(false);
    expect(manifest).toBeNull();
    expect(errors.join(' | ')).toContain(missatge);
  });

  test('una interna ni una externa no poden portar cos ni nucli', () => {
    expect(errorsDe(manifestDeProva({ cos: { cami: '/cos.js', integrity: INTEGRITAT_DE_PROVA } }))).toContain('clau desconeguda «cos»');
    expect(errorsDe(manifestExternDeProva({ nucli: '^1' }), { origen: 'externa' })).toContain('clau desconeguda «nucli»');
  });

  test('esCamiDeRecurs: des de l’arrel o http(s) absolut, amb l’extensió demanada', () => {
    expect(esCamiDeRecurs('/a/cos-1.js', '.js')).toBe(true);
    expect(esCamiDeRecurs('/a/cos-1.js?ver=2', '.js')).toBe(true);
    expect(esCamiDeRecurs('http://localhost:3340/moduls/cos.js', '.js')).toBe(true);
    expect(esCamiDeRecurs('/a/cos-1.js', '.css')).toBe(false);
    expect(esCamiDeRecurs(`/${'a'.repeat(2050)}.js`, '.js')).toBe(false);
    expect(esCamiDeRecurs(null, '.js')).toBe(false);
    expect(esCamiDeRecurs('ftp://poble.invalid/cos.js', '.js')).toBe(false);
  });

  test('PATRO_INTEGRITAT és l’SRI sha384 en base64', () => {
    expect(PATRO_INTEGRITAT.test(INTEGRITAT_DE_PROVA)).toBe(true);
    expect(PATRO_INTEGRITAT.test(`${INTEGRITAT_DE_PROVA} sha384-x`)).toBe(false);
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
