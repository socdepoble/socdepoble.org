// @vitest-environment node
/* Contracte d'amfitrió sdp.amfitrio.v1 (contracteAmfitrio.js): la forma, la
   paritat amb el que viatja al manifest (vite.standalone.config.js) i amb el
   canal del global (configAmfitrio.js), i el validador de declaracions.
   La paritat amb l'element i amb host.js és a contracteAmfitrio.paritat.test.js
   (necessita jsdom). Totes les dades són sintètiques.
   vite.standalone.config.js s'importa de veritat, però en un procés de node a
   part: dins de vitest, @vitejs/plugin-react passa pel transformador (la
   configuració hi inlinea /react/) i no es pot avaluar. El build no es toca. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CLAUS_AMFITRIO, sanejaRuta } from './configAmfitrio.js';
import {
  CODIS_ERROR_AMFITRIO, CONTRACTE_AMFITRIO_V1 as C, ID_CONTRACTE_AMFITRIO, tapaRuta, validaDeclaracioAmfitrio
} from './contracteAmfitrio.js';

const UUID_SINTETIC = '44444444-4444-4444-8444-444444444444';

/** CONTRACTE_AMFITRIO tal com l'exporta vite.standalone.config.js, avaluat per node. */
function contracteDelManifest() {
  const url = pathToFileURL(path.join(process.cwd(), 'vite.standalone.config.js')).href;
  const codi = `const m = await import(${JSON.stringify(url)}); process.stdout.write(JSON.stringify(m.CONTRACTE_AMFITRIO));`;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '--eval', codi], { cwd: process.cwd(), encoding: 'utf8', timeout: 60000 }));
}

function congelatDeDalt(valor, cami = 'contracte') {
  if (valor === null || typeof valor !== 'object') return [];
  return [...(Object.isFrozen(valor) ? [] : [cami]),
    ...Object.entries(valor).flatMap(([clau, fill]) => congelatDeDalt(fill, `${cami}.${clau}`))];
}

/** Una declaració bona: el marcatge universal de tres peces. */
const bona = () => ({
  global: { nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' },
  elements: [{ atributs: {
    'plugin-url': 'https://cdn.amfitrio.test/dist/', 'fonts-href': 'https://cdn.amfitrio.test/dist/fonts/noto-sans.css',
    'nom-poble': 'Gent de Sella', poble: 'sella', 'ruta-inicial': '/xat?vista=comunitats'
  } }],
  scripts: [{ src: 'https://cdn.amfitrio.test/dist/soc-de-poble.standalone.js', tipus: 'classic' }]
});

const codis = (resultat) => resultat.errors.map((e) => `${e.codi}@${e.canal}${e.clau !== undefined ? `:${e.clau}` : ''}`);

describe('la forma del contracte', () => {
  test('és sdp.amfitrio.v1, congelat sencer', () => {
    expect(C.id).toBe('sdp.amfitrio.v1');
    expect(ID_CONTRACTE_AMFITRIO).toBe(C.id);
    expect(congelatDeDalt(C)).toEqual([]);
    expect(Object.isFrozen(CODIS_ERROR_AMFITRIO)).toBe(true);
  });

  test('el subconjunt de marcatge és exactament el CONTRACTE_AMFITRIO del manifest (vite.standalone.config.js)', () => {
    expect({ marcatge: C.marcatge, element: C.element, global: C.global, claus: [...C.claus], atributs: [...C.atributs] })
      .toEqual(contracteDelManifest());
  }, 60000);

  test('les claus del global són exactament CLAUS_AMFITRIO (configAmfitrio.js)', () => {
    expect([...C.claus]).toEqual([...CLAUS_AMFITRIO]);
  });

  test('cada atribut és d’una sola categoria; els del backend i el tenant són de Sóc de Poble', () => {
    const categories = [C.atributs, C.atributsOptIn, C.atributsDeConfig, C.atributsDeControl, C.atributsPropisDeSdP];
    const tots = categories.flat();
    expect(new Set(tots).size).toBe(tots.length);
    for (const nom of ['backend-url', 'tenant-id', 'supabase-url', 'supabase-anon-key', 'data-mode'])
      expect(C.atributsPropisDeSdP, nom).toContain(nom);
  });

  test('les claus de config de l’amfitrió i les de Sóc de Poble no es tallen; backend i tenant són de Sóc de Poble', () => {
    const { amfitrio, propiesDeSdP } = C.clausDeConfig;
    expect(amfitrio.filter((clau) => propiesDeSdP.includes(clau))).toEqual([]);
    for (const clau of ['supabaseUrl', 'supabaseAnonKey', 'dataMode', 'backendId', 'tenantId']) expect(propiesDeSdP).toContain(clau);
  });

  test('els verbs de la cua estan classificats; configura és el de l’API i té les seues restriccions', () => {
    expect(C.cua.verbs).toEqual({ sessio: 'amfitrio', configura: 'api' });
    expect(C.configura.prohibides).toEqual(['backend', 'backend_url', 'tenant_id']);
  });

  test('privacitat: sdp-navega porta la ruta tapada; la fase 2 porta la sencera i ho declara', () => {
    expect(C.esdeveniments.ruta).toEqual({ nom: 'sdp-navega', detall: 'tapada' });
    expect(C.esdeveniments.element).toContain(C.esdeveniments.ruta.nom);
    expect(C.rutaAUrl).toEqual({ clau: 'sdp', modes: ['fragment', 'parametre'], ruta: 'sencera', fragment: 'clau=valor' });
  });

  test('el límit de ruta-inicial és el del plugin de WordPress, i sanejaRuta no en té cap (divergència documentada)', () => {
    expect(C.limits.rutaInicial).toBe(200);
    const llarga = `/${'a'.repeat(C.limits.rutaInicial)}`;
    expect(sanejaRuta(llarga)).toBe(llarga);
  });
});

/* WP-R1 · La ruta que ix cap a l'amfitrió: mai la consulta ni un identificador. */
describe('tapaRuta', () => {
  test.each([
    ['/', '/'],
    ['', '/'],
    [undefined, '/'],
    ['/xat', '/xat'],
    ['/xat/', '/xat'],
    ['/cerca?q=nom-sintetic', '/cerca'],
    ['/mur?filtre=tot#ancora', '/mur'],
    ['/perfil/agent-sintetic-1', '/perfil/*'],
    ['/perfil/agent-sintetic-1?x=1', '/perfil/*'],
    ['/pobles/sella/xat', '/pobles/*'],
    ['/?q=nom-sintetic', '/']
  ])('%j → %j', (ruta, esperada) => {
    expect(tapaRuta(ruta)).toBe(esperada);
  });
});

describe('validaDeclaracioAmfitrio', () => {
  test('el marcatge universal de tres peces és conforme i el net és idèntic', () => {
    const decl = bona();
    const resultat = validaDeclaracioAmfitrio(decl);
    expect(codis(resultat)).toEqual([]);
    expect(resultat.ok).toBe(true);
    expect(resultat.net).toEqual(decl);
    expect(Object.isFrozen(resultat)).toBe(true);
    expect(Object.isFrozen(resultat.net.elements[0].atributs)).toBe(true);
  });

  test.each([
    ['global', { global: { nomPoble: 'Sella', tenantId: UUID_SINTETIC } }, 'tenant@global:tenantId'],
    ['global', { global: { nomPoble: 'Sella', tenant_id: UUID_SINTETIC } }, 'tenant@global:tenant_id'],
    ['global', { global: { supabaseUrl: 'https://backend.amfitrio.test' } }, 'backend@global:supabaseUrl'],
    ['element', { elements: [{ atributs: { 'tenant-id': UUID_SINTETIC } }] }, 'tenant@element:tenant-id'],
    ['element', { elements: [{ atributs: { 'backend-url': 'https://backend.amfitrio.test' } }] }, 'backend@element:backend-url'],
    ['element', { elements: [{ atributs: { 'supabase-anon-key': 'sb_publishable_sintetica' } }] }, 'backend@element:supabase-anon-key'],
    ['element', { elements: [{ atributs: { 'data-mode': 'local' } }] }, 'backend@element:data-mode'],
    ['cua', { cua: [['configura', { config: { tenantId: UUID_SINTETIC } }]] }, 'tenant@cua:config.tenantId'],
    ['cua', { cua: [['configura', { tenant_id: UUID_SINTETIC }]] }, 'tenant@cua:tenant_id'],
    ['cua', { cua: [['configura', { backend_url: 'https://backend.amfitrio.test' }]] }, 'backend@cua:backend_url'],
    ['cua', { cua: [['configura', { config: { dataMode: 'local' } }]] }, 'backend@cua:config.dataMode'],
    ['configura', { configura: [{ backend: {} }] }, 'backend@configura:backend'],
    ['configura', { configura: [{ config: { supabaseUrl: 'https://backend.amfitrio.test' } }] }, 'backend@configura:config.supabaseUrl'],
    // Correcció de l'A1: a l'arrel de configura(), el mateix judici que el nucli (abans, clau-desconeguda).
    ['configura', { configura: [{ tenantId: UUID_SINTETIC }] }, 'tenant@configura:tenantId'],
    ['configura', { configura: [{ supabaseUrl: 'https://backend.amfitrio.test' }] }, 'backend@configura:supabaseUrl'],
    ['cua', { cua: [['configura', { dataMode: 'local' }]] }, 'backend@cua:dataMode'],
    // Correcció de l'A1: les opcions del verb `sessio` són un canal de l'amfitrió.
    ['cua', { cua: [['sessio', { access_token: 'sintetic' }, { tenantId: UUID_SINTETIC }]] }, 'tenant@cua:opcions.tenantId'],
    ['cua', { cua: [['sessio', { access_token: 'sintetic' }, { backend_url: 'https://backend.amfitrio.test' }]] }, 'backend@cua:opcions.backend_url'],
    // WP-R2: la propietat JS `config` de l'element (Sollutia, React, Vue).
    ['propietats', { propietats: [{ tenantId: UUID_SINTETIC }] }, 'tenant@propietat:tenantId'],
    ['propietats', { propietats: [{ tenant_id: UUID_SINTETIC }] }, 'tenant@propietat:tenant_id'],
    ['propietats', { propietats: [{ supabaseUrl: 'https://backend.amfitrio.test' }] }, 'backend@propietat:supabaseUrl'],
    ['propietats', { propietats: [{ supabaseAnonKey: 'sb_publishable_sintetica' }] }, 'backend@propietat:supabaseAnonKey']
  ])('backend o tenant pel canal %s: es rebutja i no arriba al net', (canal, decl, esperat) => {
    const resultat = validaDeclaracioAmfitrio(decl);
    expect(resultat.ok).toBe(false);
    expect(codis(resultat)).toContain(esperat);
    expect(JSON.stringify(resultat.net)).not.toMatch(/tenant|backend|supabase|dataMode|data-mode|4444/);
  });

  test('atributs fora del marcatge, propis de Sóc de Poble i de configuració en JSON', () => {
    const resultat = validaDeclaracioAmfitrio({ elements: [{ atributs: {
      'plugin-url': '/dist/', 'bot-api-url': 'https://bot.amfitrio.test', 'oauth-relay-url': 'https://cb.amfitrio.test',
      'sollutia-issuer': 'https://emissor.amfitrio.test', config: '{}', 'config-id': 'x', 'color-de-fons': 'roig'
    } }] });
    expect(codis(resultat).sort()).toEqual([
      'atribut-desconegut@element:color-de-fons', 'atribut-desconegut@element:config', 'atribut-desconegut@element:config-id',
      'atribut-propi-de-sdp@element:bot-api-url', 'atribut-propi-de-sdp@element:oauth-relay-url', 'atribut-propi-de-sdp@element:sollutia-issuer'
    ]);
    expect(resultat.net.elements[0].atributs).toEqual({ 'plugin-url': '/dist/' });
  });

  test('els opt-in i els de control són del contracte, amb el valor exacte', () => {
    const bo = validaDeclaracioAmfitrio({ elements: [{ atributs: { 'ruta-a-url': 'fragment', arrencada: 'manual', 'pinta-amfitrio': '' } }] });
    expect(codis(bo)).toEqual([]);
    const dolent = validaDeclaracioAmfitrio({ elements: [{ atributs: { 'ruta-a-url': 'hash', arrencada: 'auto' } }] });
    expect(codis(dolent)).toEqual(['valor-invalid@element:ruta-a-url', 'valor-invalid@element:arrencada']);
  });

  test('valors: el poble amb el patró, la ruta que sanejaRuta conserva i el límit de longitud', () => {
    const resultat = validaDeclaracioAmfitrio({ elements: [
      { atributs: { poble: '../admin', 'ruta-inicial': '//evil.test/x', 'base-path': '//evil.test' } },
      { atributs: { poble: 'Sella', 'ruta-inicial': '/pobles/sella#portada', 'nom-poble': '  Gent  de Sella ' } },
      { atributs: { 'ruta-inicial': `/${'a'.repeat(C.limits.rutaInicial)}`, 'plugin-url': '' } }
    ] });
    expect(codis(resultat)).toEqual([
      'valor-invalid@element:poble', 'valor-invalid@element:ruta-inicial', 'valor-invalid@element:base-path',
      'valor-no-canonic@element:poble', 'valor-no-canonic@element:ruta-inicial', 'valor-no-canonic@element:nom-poble',
      'ruta-massa-llarga@element:ruta-inicial', 'valor-invalid@element:plugin-url'
    ]);
    expect(resultat.net.elements[1].atributs).toEqual({ poble: 'sella', 'ruta-inicial': '/pobles/sella', 'nom-poble': 'Gent de Sella' });
  });

  test('el global: claus fora del contracte i l’àlies `tenant` (que el nucli llig com a poble) no són conformes', () => {
    const resultat = validaDeclaracioAmfitrio({ global: { poble: 'sella', tenant: 'sella', routerType: 'browser' } });
    expect(codis(resultat)).toEqual(['clau-desconeguda@global:tenant', 'clau-desconeguda@global:routerType']);
    expect(resultat.net.global).toEqual({ poble: 'sella' });
  });

  test('la cua: sessio és del contracte; un verb desconegut o heretat d’Object.prototype, no', () => {
    const sessio = { access_token: 'sintetic' };
    const resultat = validaDeclaracioAmfitrio({ cua: [['sessio', sessio], ['constructor'], ['toString'], ['borra'], 'sessio'] });
    expect(codis(resultat)).toEqual(['verb-desconegut@cua:constructor', 'verb-desconegut@cua:toString', 'verb-desconegut@cua:borra', 'verb-desconegut@cua']);
    expect(resultat.net.cua).toEqual([['sessio', sessio]]);
    // El validador no congela ni muta el que li passa l'amfitrió.
    expect(Object.isFrozen(sessio)).toBe(false);
  });

  test('les opcions de sessio: emissorEsperat passa; les claus del paquet no, i la sessió no es toca', () => {
    const sessio = { access_token: 'sintetic' };
    const opcions = { emissorEsperat: 'https://emissor.amfitrio.test', oauthRelayUrl: 'https://socdepoble.sollutia.com/cb', anonKey: 'x' };
    const resultat = validaDeclaracioAmfitrio({ cua: [['sessio', sessio, opcions], ['sessio', sessio, { emissorEsperat: 'https://emissor.amfitrio.test' }]] });
    expect(codis(resultat)).toEqual(['clau-propia-de-sdp@cua:opcions.oauthRelayUrl', 'backend@cua:opcions.anonKey']);
    expect(resultat.net.cua).toEqual([
      ['sessio', sessio, { emissorEsperat: 'https://emissor.amfitrio.test' }],
      ['sessio', sessio, { emissorEsperat: 'https://emissor.amfitrio.test' }]
    ]);
    expect(resultat.net.cua[0][1]).toBe(sessio);
    expect(Object.isFrozen(sessio)).toBe(false);
    expect(Object.isFrozen(opcions)).toBe(false);
    expect(opcions).toHaveProperty('anonKey', 'x');
  });

  test('configura: auth i les claus de presentació passen; les de Sóc de Poble i les desconegudes, no', () => {
    const auth = { issuer: 'https://emissor.amfitrio.test', audiences: ['socdepoble'] };
    const resultat = validaDeclaracioAmfitrio({ configura: [{ auth, config: { nomPoble: 'Sella', apps: 'bar', botApiUrl: 'https://bot.amfitrio.test', color: 'roig' } }] });
    expect(codis(resultat)).toEqual(['clau-propia-de-sdp@configura:config.botApiUrl', 'clau-desconeguda@configura:config.color']);
    expect(resultat.net.configura).toEqual([{ auth, config: { nomPoble: 'Sella', apps: 'bar' } }]);
    expect(Object.isFrozen(auth)).toBe(false);
  });

  test('el paquet es carrega com a <script> clàssic, mai de mòdul', () => {
    const resultat = validaDeclaracioAmfitrio({ scripts: [{ src: '/dist/soc-de-poble.standalone.js', tipus: 'module' }, { tipus: 'classic' }] });
    expect(codis(resultat)).toEqual(['bundle-modul@script:/dist/soc-de-poble.standalone.js', 'declaracio-invalida@script']);
    expect(resultat.net.scripts).toEqual([]);
  });

  /* Relleu 261007 (peça «netes») · Decisió 5 del Mestre (261007, paquet
     trossejat) · La diagnosi diu la causa de veres: el que va en clàssic és el
     carregador, i els trossos els demana ell.
     Relleu 261007 (peça «netes», revisió) · El mateix fitxer es distribuïx
     també monolític (la variant del directori, SDP_VARIANT=wordpress, ho és
     sempre): la diagnosi nomena les dues formes i no presenta l'IIFE com
     l'única. */
  test('la diagnosi de bundle-modul nomena el carregador clàssic, els trossos i el monolític', () => {
    const [falta] = validaDeclaracioAmfitrio({ scripts: [{ src: '/dist/soc-de-poble.standalone.js', tipus: 'module' }] }).errors;
    expect(falta.codi).toBe('bundle-modul');
    expect(falta.detall).toMatch(/^soc-de-poble\.standalone\.js .*<script src> clàssic, mai de mòdul/);
    expect(falta.detall).toMatch(/carregador/);
    expect(falta.detall).toMatch(/trossos/);
    expect(falta.detall).toMatch(/IIFE monolític/);
    expect(falta.detall).not.toMatch(/El paquet és un IIFE/);
  });

  test.each([[null], [undefined], [[]], ['marcatge'], [42], [new Map()]])('una declaració sense forma (%j) no és conforme i no peta', (decl) => {
    const resultat = validaDeclaracioAmfitrio(decl);
    expect(resultat.ok).toBe(false);
    expect(codis(resultat)).toEqual(['declaracio-invalida@declaracio']);
  });

  test('canals sense forma: cada un dona declaracio-invalida', () => {
    const resultat = validaDeclaracioAmfitrio({ global: [], elements: {}, cua: 'sessio', configura: {}, propietats: {}, scripts: 'x' });
    expect(codis(resultat)).toEqual([
      'declaracio-invalida@global', 'declaracio-invalida@element', 'declaracio-invalida@configura',
      'declaracio-invalida@propietat', 'declaracio-invalida@cua', 'declaracio-invalida@script'
    ]);
  });

  /* WP-R2 · La propietat JS `config` és un canal de l'amfitrió com els altres:
     les mateixes claus que configura({config}), sense prefix. */
  test('propietats: les claus de l’amfitrió passen; les de Sóc de Poble, les desconegudes i les que no són objecte, no', () => {
    const resultat = validaDeclaracioAmfitrio({ propietats: [
      { nomPoble: 'Sella', apps: 'bar', rutaAUrl: 'fragment', botApiUrl: 'https://bot.amfitrio.test', color: 'roig' },
      [], 'x'
    ] });
    expect(codis(resultat)).toEqual([
      'clau-propia-de-sdp@propietat:botApiUrl', 'clau-desconeguda@propietat:color',
      'declaracio-invalida@propietat', 'declaracio-invalida@propietat'
    ]);
    expect(resultat.net.propietats).toEqual([{ nomPoble: 'Sella', apps: 'bar', rutaAUrl: 'fragment' }]);
  });

  test('un canal fora del contracte no s’ignora en silenci', () => {
    const resultat = validaDeclaracioAmfitrio({ ...bona(), propietat: { tenantId: UUID_SINTETIC }, iframe: [] });
    expect(resultat.ok).toBe(false);
    expect(codis(resultat)).toEqual(['declaracio-invalida@declaracio:propietat', 'declaracio-invalida@declaracio:iframe']);
    expect(resultat.net).not.toHaveProperty('propietat');
  });

  test('els canals del contracte són exactament els que jutja el validador', () => {
    expect([...C.canals]).toEqual(['global', 'elements', 'cua', 'configura', 'propietats', 'scripts']);
    const buida = Object.fromEntries(C.canals.map((canal) => [canal, canal === 'global' ? {} : []]));
    expect(codis(validaDeclaracioAmfitrio(buida))).toEqual([]);
  });

  test('tot codi que torna és un dels codis declarats', () => {
    const resultats = [
      validaDeclaracioAmfitrio(null),
      validaDeclaracioAmfitrio({ global: { tenantId: 'x', supabaseUrl: 'x', routerType: 'x', poble: 'X' },
        elements: [{ atributs: { 'tenant-id': 'x', 'data-mode': 'x', 'bot-api-url': 'x', x: 'x', poble: '..', 'ruta-inicial': `/${'a'.repeat(300)}` } }],
        cua: [['x'], ['configura', { config: { botApiUrl: 'x' } }]], scripts: [{ src: 'x', tipus: 'module' }] })
    ];
    const usats = new Set(resultats.flatMap((r) => r.errors.map((e) => e.codi)));
    expect([...usats].filter((codi) => !CODIS_ERROR_AMFITRIO.includes(codi))).toEqual([]);
    expect(usats.size).toBeGreaterThan(8);
  });
});
