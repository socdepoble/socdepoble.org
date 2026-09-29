import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  CLAUS_AMFITRIO, sanejaEtiqueta, sanejaIdentificador, sanejaRuta, rutaDelPoble, llegeixConfigAmfitrio
} from './configAmfitrio.js';

afterEach(() => { vi.unstubAllGlobals(); delete globalThis.SocDePobleConfig; });

/* Tots els invisibles, marques bidi i caràcters de control d'aquest fitxer
   van escrits amb escapament (String.fromCodePoint o \u{…}), mai en cru: un
   caràcter cru no es veu a l'editor ni a la revisió, i un RLO cru gira el
   codi que es llig. L'última prova del fitxer ho comprova sobre la font. */
const INVISIBLES_I_BIDI = [0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0x202A, 0x202B, 0x202C,
  0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069, 0xFEFF, 0x061C, 0x2060].map((c) => String.fromCodePoint(c));
const RESTA_PERILLOSA = /[\u{0000}-\u{001F}\u{007F}-\u{009F}\u{061C}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2064}\u{2066}-\u{2069}\u{FEFF}]/u;

test('les claus del canal són exactament nomPoble i poble, congelades', () => {
  expect(CLAUS_AMFITRIO).toEqual(['nomPoble', 'poble']);
  expect(Object.isFrozen(CLAUS_AMFITRIO)).toBe(true);
});

describe('sanejaEtiqueta', () => {
  test('només cadenes: la resta, i les buides després de netejar, són undefined', () => {
    for (const valor of [undefined, null, 42, true, {}, ['Torre'], () => 'Torre', new String('Torre'), Symbol('x')])
      expect(sanejaEtiqueta(valor), String(typeof valor)).toBeUndefined();
    for (const buida of ['', '   ', '\t\n', '\u{200B}\u{202E}\u{FEFF}', '\u{0000}\u{0007}'])
      expect(sanejaEtiqueta(buida), JSON.stringify(buida)).toBeUndefined();
  });

  test('col·lapsa espais i els blancs de control passen a espai', () => {
    expect(sanejaEtiqueta('  Gent   de\tla\nTorre\r\n ')).toBe('Gent de la Torre');
    expect(sanejaEtiqueta('Gent\u{00A0}de\u{2028}la\u{3000}Torre')).toBe('Gent de la Torre');
  });

  test('lleva el control C0, DEL i C1 que no és blanc', () => {
    expect(sanejaEtiqueta('a\u{0000}b\u{0007}c\u{001B}d\u{007F}e\u{0085}f\u{009F}g')).toBe('abcdefg');
  });

  test.each(INVISIBLES_I_BIDI.map(c => [c.codePointAt(0).toString(16).toUpperCase(), c]))(
    'lleva l’invisible o marca bidi U+%s', (_, c) => {
      expect(sanejaEtiqueta(`Gent de la${c} Torre${c}`)).toBe('Gent de la Torre');
    });

  test('un nom girat amb RLO no arriba a la barra girat', () => {
    const atac = 'Gent de la Torre \u{202E}etneisrevda\u{202C} \u{2066}x\u{2069}';
    const net = sanejaEtiqueta(atac);
    expect(net).toBe('Gent de la Torre etneisrevda x');
    expect(RESTA_PERILLOSA.test(net)).toBe(false);
  });

  test('normalitza a NFC, també quan un invisible separava la lletra de l’accent', () => {
    expect(sanejaEtiqueta('Pena\u{0300}guila')).toBe('Penàguila');
    expect(sanejaEtiqueta('Pena\u{200B}\u{0300}guila')).toBe('Penàguila');
  });

  test('talla a 80 punts de codi per defecte, sense partir parells subrogats', () => {
    expect(sanejaEtiqueta('x'.repeat(10000))).toBe('x'.repeat(80));
    const emojis = sanejaEtiqueta('\u{1F33F}'.repeat(10000));
    expect(Array.from(emojis)).toHaveLength(80);
    expect(emojis).toBe('\u{1F33F}'.repeat(80));
    expect(emojis.length).toBe(160);
  });

  test('10.000 caràcters barrejats amb bidi i control: net i dins del límit', () => {
    const cru = Array.from({ length: 10000 }, (_, i) => ['a', '\u{202E}', '\u{0000}', ' ', '\u{200B}'][i % 5]).join('');
    const net = sanejaEtiqueta(cru);
    expect(Array.from(net).length).toBeLessThanOrEqual(80);
    expect(RESTA_PERILLOSA.test(net)).toBe(false);
    expect(net).toBe(net.trim());
  });

  test('el màxim és configurable i el tall no deixa espai final', () => {
    expect(sanejaEtiqueta('abcdef', 3)).toBe('abc');
    expect(sanejaEtiqueta('ab cd', 3)).toBe('ab');
    expect(sanejaEtiqueta('x'.repeat(100), 0)).toBe('x'.repeat(80));
    expect(sanejaEtiqueta('x'.repeat(100), -1)).toBe('x'.repeat(80));
    expect(sanejaEtiqueta('x'.repeat(100), 2.5)).toBe('x'.repeat(80));
  });

  test('és text, no HTML: l’escapament és feina de React i el valor no es reinterpreta', () => {
    expect(sanejaEtiqueta('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('sanejaIdentificador', () => {
  test('accepta ids de la secció Pobles i els passa a minúscules', () => {
    expect(sanejaIdentificador('la-torre-de-les-macanes')).toBe('la-torre-de-les-macanes');
    expect(sanejaIdentificador('  La-Torre-De-Les-Macanes \n')).toBe('la-torre-de-les-macanes');
    expect(sanejaIdentificador('a')).toBe('a');
    expect(sanejaIdentificador('0')).toBe('0');
    expect(sanejaIdentificador('a'.repeat(63))).toBe('a'.repeat(63));
  });

  test.each([
    ['64 caràcters', 'a'.repeat(64)], ['guió inicial', '-torre'], ['guió baix', 'torre_macanes'],
    ['espai intern', 'la torre'], ['accent', 'penàguila'], ['pujada', '../admin'], ['barra', 'a/b'],
    ['protocol relatiu', '//evil.example'], ['esquema', 'javascript:alert(1)'], ['consulta', 'x?y=1'],
    ['fragment', 'x#y'], ['percentatge', 'a%2fb'], ['punt', 'a.b'], ['proto', '__proto__'],
    ['bidi', 'torre\u{202E}'], ['control', 'torre\u{0000}'], ['buit', ''], ['només blancs', '   ']
  ])('rebutja %s', (_, valor) => {
    expect(sanejaIdentificador(valor)).toBeUndefined();
  });

  test('només cadenes', () => {
    for (const valor of [undefined, null, 42, {}, ['torre'], new String('torre')])
      expect(sanejaIdentificador(valor)).toBeUndefined();
  });
});

describe('sanejaRuta', () => {
  test.each([
    ['/pobles/la-torre-de-les-macanes', '/pobles/la-torre-de-les-macanes'],
    ['/', '/'],
    ['/mur?filtre=tot&ordre=nou', '/mur?filtre=tot&ordre=nou'],
    ['/pobles/penaguila#portada', '/pobles/penaguila'],
    ['/cerca?q=..', '/cerca?q=..'],
    ['/pobles/penàguila', '/pobles/pen%C3%A0guila'],
    ['/wikidepoble/consola-termodinamica', '/wikidepoble/consola-termodinamica']
  ])('accepta %s → %s', (valor, esperat) => {
    expect(sanejaRuta(valor)).toBe(esperat);
  });

  test.each([
    ['relativa', 'pobles/x'], ['protocol relatiu', '//evil.example/x'], ['triple barra', '///evil.example'],
    ['barra invertida', '/\\evil.example'], ['doble invertida', '\\\\evil.example'],
    ['esquema absolut', 'https://evil.example/x'], ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,<script>alert(1)</script>'], ['pujada', '/a/../b'], ['pujada final', '/..'],
    ['punt', '/./x'], ['pujada codificada', '/a/%2e%2e/b'], ['pujada mixta', '/a/%2E./b'],
    ['punt codificat', '/a/.%2e'], ['espai', '/a b'], ['tabulador', '/a\tb'], ['salt de línia', '/a\nb'],
    ['nul', '/a\u{0000}'], ['C1', '/a\u{0085}'], ['espai inicial', ' /x'], ['buida', '']
  ])('rebutja %s', (_, valor) => {
    expect(sanejaRuta(valor)).toBeUndefined();
  });

  test('només cadenes', () => {
    for (const valor of [undefined, null, 42, {}, ['/x'], new String('/x')])
      expect(sanejaRuta(valor)).toBeUndefined();
  });
});

describe('rutaDelPoble', () => {
  test('construïx /pobles/<id> amb l’id sanejat', () => {
    expect(rutaDelPoble('la-torre-de-les-macanes')).toBe('/pobles/la-torre-de-les-macanes');
    expect(rutaDelPoble(' Penaguila ')).toBe('/pobles/penaguila');
  });

  test('un id invàlid no dona ruta', () => {
    for (const valor of ['../admin', '//evil.example', 'a/b', 'x?y', 'x#y', '', undefined, null, 42, {}])
      expect(rutaDelPoble(valor), String(valor)).toBeUndefined();
  });

  test('la ruta que dona sempre supera sanejaRuta', () => {
    const ruta = rutaDelPoble('la-torre-de-les-macanes');
    expect(sanejaRuta(ruta)).toBe(ruta);
  });
});

describe('llegeixConfigAmfitrio', () => {
  const PLUGIN = Object.freeze({ nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' });

  test('sense global: objecte buit i congelat', () => {
    const config = llegeixConfigAmfitrio();
    expect(config).toEqual({});
    expect(Object.isFrozen(config)).toBe(true);
  });

  test('la forma que emet el plugin passa sencera i congelada', () => {
    const config = llegeixConfigAmfitrio(PLUGIN);
    expect(config).toEqual({ nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' });
    expect(Object.isFrozen(config)).toBe(true);
    expect(() => { config.poble = 'penaguila'; }).toThrow(TypeError);
  });

  test('per defecte llig window.SocDePobleConfig, i de nou a cada crida', () => {
    vi.stubGlobal('SocDePobleConfig', PLUGIN);
    expect(llegeixConfigAmfitrio()).toEqual(PLUGIN);
    vi.stubGlobal('SocDePobleConfig', { nomPoble: 'Penàguila' });
    expect(llegeixConfigAmfitrio()).toEqual({ nomPoble: 'Penàguila' });
  });

  test('mai copia claus de backend, credencials, rutes ni cap altra', () => {
    const config = llegeixConfigAmfitrio({
      ...PLUGIN, supabaseUrl: 'https://evil.example', supabaseAnonKey: 'sb_secret_x', backend_url: 'https://evil.example',
      backendId: 'wordpress', tenantId: '00000000-0000-0000-0000-000000000000', tenant_id: 'x', dataMode: 'local',
      routerType: 'browser', basename: '/', basePath: '/', rutaInicial: '/admin', pluginUrl: 'https://evil.example/',
      fontsHref: 'https://evil.example/f.css', oauthRelayUrl: 'https://evil.example/cb', manageDocumentHead: true,
      sollutiaIssuer: 'https://evil.example'
    });
    expect(Object.keys(config).sort()).toEqual(['nomPoble', 'poble']);
  });

  test('un __proto__ declarat per JSON no contamina el resultat', () => {
    const config = llegeixConfigAmfitrio(JSON.parse('{"__proto__":{"supabaseUrl":"https://evil.example"},"nomPoble":"Sella"}'));
    expect(config).toEqual({ nomPoble: 'Sella' });
    expect(Object.getPrototypeOf(config)).toBe(Object.prototype);
    expect(config.supabaseUrl).toBeUndefined();
  });

  test('un Object.prototype contaminat no declara cap poble', () => {
    Object.prototype.poble = 'evil';
    Object.prototype.nomPoble = 'Evil';
    try {
      expect(Object.keys(llegeixConfigAmfitrio({}))).toEqual([]);
    } finally {
      delete Object.prototype.poble;
      delete Object.prototype.nomPoble;
    }
  });

  test.each([
    ['null', null], ['cadena', 'la-torre-de-les-macanes'], ['número', 42], ['booleà', true],
    ['array', [PLUGIN]], ['funció', Object.assign(() => {}, PLUGIN)], ['Map', new Map(Object.entries(PLUGIN))],
    ['Date', Object.assign(new Date(), PLUGIN)], ['instància', Object.assign(new (class Config {})(), PLUGIN)],
    ['prototip heretat', Object.create(PLUGIN)], ['String', Object.assign(new String('x'), PLUGIN)]
  ])('una font que no és objecte pla (%s) dona objecte buit', (_, font) => {
    const config = llegeixConfigAmfitrio(font);
    expect(config).toEqual({});
    expect(Object.isFrozen(config)).toBe(true);
  });

  test('Object.create(null) és un objecte pla vàlid', () => {
    expect(llegeixConfigAmfitrio(Object.assign(Object.create(null), PLUGIN))).toEqual(PLUGIN);
  });

  test('un getter que llança dona objecte buit, no una excepció', () => {
    const font = { nomPoble: 'Gent de la Torre', get poble() { throw new Error('amfitrió trencat'); } };
    expect(llegeixConfigAmfitrio(font)).toEqual({});
  });

  test('un Proxy hostil dona objecte buit', () => {
    const llança = () => { throw new Error('trampa'); };
    for (const trampa of ['getPrototypeOf', 'getOwnPropertyDescriptor', 'get']) {
      const font = new Proxy({ ...PLUGIN }, { [trampa]: llança });
      expect(llegeixConfigAmfitrio(font), trampa).toEqual({});
    }
  });

  test('un global amb getter que llança no trenca la lectura per defecte', () => {
    Object.defineProperty(globalThis, 'SocDePobleConfig', {
      configurable: true, get() { throw new Error('amfitrió trencat'); }
    });
    expect(llegeixConfigAmfitrio()).toEqual({});
  });

  test('àlies tenant: només quan poble no s’ha declarat', () => {
    expect(llegeixConfigAmfitrio({ tenant: ' La-Torre-De-Les-Macanes ' })).toEqual({ poble: 'la-torre-de-les-macanes' });
    expect(llegeixConfigAmfitrio({ poble: 'penaguila', tenant: 'sella' })).toEqual({ poble: 'penaguila' });
    expect(llegeixConfigAmfitrio({ poble: 'no és vàlid', tenant: 'sella' })).toEqual({});
    expect(llegeixConfigAmfitrio({ poble: undefined, tenant: 'sella' })).toEqual({ poble: 'sella' });
    expect(llegeixConfigAmfitrio({ tenant: '../admin' })).toEqual({});
    expect(Object.keys(llegeixConfigAmfitrio({ tenant: 'sella' }))).not.toContain('tenant');
  });

  test('les claus absents o invàlides no apareixen, ni com a undefined', () => {
    const config = llegeixConfigAmfitrio({ nomPoble: ' \u{200B} ', poble: '../admin' });
    expect(config).toEqual({});
    expect('nomPoble' in config).toBe(false);
    expect('poble' in config).toBe(false);
    expect(Object.keys(llegeixConfigAmfitrio({ nomPoble: 'Sella' }))).toEqual(['nomPoble']);
  });

  test('sanitza els valors llegits: bidi al nom i majúscules al poble', () => {
    expect(llegeixConfigAmfitrio({ nomPoble: 'Gent de la\u{202E} Torre', poble: 'LA-TORRE-DE-LES-MACANES' }))
      .toEqual({ nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' });
    expect(llegeixConfigAmfitrio({ nomPoble: 'x'.repeat(10000) }).nomPoble).toHaveLength(80);
  });
});

/* Autocomprovació: la font d'aquest fitxer no porta cap caràcter de control
   (llevat del tabulador i el salt de línia), invisible ni bidi en cru. */
test('aquest fitxer no porta cap caràcter de control, invisible ni bidi en cru', () => {
  const CRU = /[\u{0000}-\u{0008}\u{000B}-\u{001F}\u{007F}-\u{009F}\u{061C}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2069}\u{FEFF}]/u;
  const crusDe = (text) => Array.from(text).filter((c) => CRU.test(c))
    .map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
  // La comprovació no és inerta: un RLO, un NUL i un BOM de veres sí que es detecten.
  expect(crusDe(`a${String.fromCodePoint(0x202E)}b${String.fromCodePoint(0x0)}c${String.fromCodePoint(0xFEFF)}\t\n`))
    .toEqual(['U+202E', 'U+0000', 'U+FEFF']);
  const font = readFileSync(new URL(import.meta.url), 'utf8');
  expect(font).toContain('aquest fitxer no porta cap caràcter de control, invisible ni bidi en cru');
  expect(crusDe(font)).toEqual([]);
});
