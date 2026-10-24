// @vitest-environment node
/* Plataforma d'Apps Enxufables · el build d'un mòdul (vite.modul.config.js,
   contracte sdp.modul.v1, ADR-2026-12).
   1 · Les peces pures del config sobre els manifests reals de les cinc apps
       (el manifest de cada una és vàlid com a mòdul).
   2 · Les guardes del cos, amb chunks sintètics.
   3 · Builds DE VERITAT, en memòria (write: false, res al disc):
       · un mòdul de prova (__fixtures__/modulDeProva): el cos és un script
         clàssic sense React ni plataforma propis; el registre el registra
         amb l'URL i la integritat bones; i el cos, executat en una caixa
         amb el SocDePoble.nucli REAL (nucliModuls.js), lliura un component
         que es pinta amb el React, el router i la Pedra Seca de la pàgina;
       · la Gestoria amb el seu doble pany (producció): només el taló;
       · la Gestoria SENCERA, amb les quatre vistes: el literal de DEV es
         força a cert NOMÉS dins d'esta prova, per a passar-li les guardes
         del build. El pany del producte no canvia (privacitat.test.js).
       · Onada 7 (261009): el Bar, la Nevera, Salut i el Lector, cadascun
         amb la seua declaració (guardesDelModul.js) i contra el nucli
         1.1.0 (des del 261016, l'1.2.0); sense la declaració, el build
         s'aturaria. Els quatre cossos, executats amb el SocDePoble.nucli
         REAL, lliuren el seu component, i el del Lector es pinta amb la
         Pedra Seca de la pàgina.
       · Nucli 1.2.0 (261016): un mòdul de prova que munta l'espai de
         treball per la porta 'workspace' (__fixtures__/modulAmbEspai): el
         cos el pren del nucli i no porta res de l'espai ni del port.
   El JSX el transforma l'esbuild de Vite (el default del config hi posa
   @vitejs/plugin-react, que vitest no carrega: server.deps.inline /react/).
   Entorn node: esbuild no funciona dins de jsdom. Cap prova d'ací carrega el
   cos en un navegador: l'SRI i el <script> injectat són a carregaModul.test.jsx,
   amb fàbriques escrites a mà. L'ordre de la CLI de l'ADR és NO VERIFICADA. */
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'vite';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import {
  FITXER_FITXA, FITXER_REGISTRE, codiDelRegistre, configDelModul, infraccionsDelCos, llegixManifestDelModul,
  manifestDelModul, nomesAscii, rangDelNucli
} from '../../../vite.modul.config.js';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { INTEGRITAT_DE_PROVA } from './__fixtures__/manifests.js';
import { ProveidorApp } from './ContextApp.jsx';
import { VERSIO_NUCLI, exposaElNom, globalDeLaPorta, portaDeLaFont } from './contracteNucli.js';
import { DECLARACIONS_DELS_MODULS, infraccionsDelText } from './guardesDelModul.js';
import { validaManifestApp } from './manifestApp.js';
import { creaRegistre } from './registreApps.js';

const ARREL = process.cwd();
const CARPETA_DE_PROVA = path.join(ARREL, 'src/apps/plataforma/__fixtures__/modulDeProva');
const sri384 = (text) => `sha384-${createHash('sha384').update(text).digest('base64')}`;
const NOMES_ASCII = /^[\u0000-~]*$/;
/* El rang que demana un mòdul compilat contra este nucli. Actualitzat a posta (261016): l'1.2.0,
   que afig la porta 'workspace'; abans, l'1.1.0 de l'Onada 7.
   Actualitzada a posta (261024 T5): l'1.3.0, que afig useServeiNoticies a la porta 'plataforma'. */
const RANG = '^1.3';

describe('el manifest d’una app com a mòdul (llegixManifestDelModul)', () => {
  test.each(['gestoria', 'bar', 'salut', 'nevera', 'lector'])('%s: dada pura, sense carrega, i el manifest de mòdul és vàlid', (id) => {
    const { dades, component } = llegixManifestDelModul({ id, carpeta: path.join(ARREL, 'src/apps', id) });
    expect(dades.id).toBe(id);
    expect('carrega' in dades).toBe(false);
    expect(component).toMatch(new RegExp(`src/apps/${id}/App[A-Za-z]+\\.jsx$`));
    const manifest = manifestDelModul(dades, { cos: { cami: '/cos.js', integrity: INTEGRITAT_DE_PROVA } });
    expect(validaManifestApp(manifest, { origen: 'modul' }).ok).toBe(true);
  });

  test('la Gestoria com a mòdul conserva les dades financeres (i la guarda de document propi)', () => {
    const { dades } = llegixManifestDelModul({ id: 'gestoria', carpeta: path.join(ARREL, 'src/apps/gestoria') });
    expect(dades).toMatchObject({ dadesPersonals: 'financeres', entorn: 'desenvolupament', capacitats: [] });
  });

  test('el rang del nucli és el de la versió contra la qual es compila', () => {
    expect(VERSIO_NUCLI).toBe('1.3.0');
    expect(rangDelNucli()).toBe(RANG);
    expect(rangDelNucli('1.4.2')).toBe('^1.4');
  });

  test('un id que no és d’una app no compila', () => {
    expect(() => configDelModul({ id: '../salut' })).toThrow('SDP_MODUL');
    expect(() => configDelModul({ id: undefined })).toThrow('SDP_MODUL');
  });
});

describe('les guardes del cos (infraccionsDelCos)', () => {
  const net = { modules: { [`${ARREL}/src/apps/x/AppX.jsx`]: {} }, importedBindings: { react: ['useState'] }, dynamicImports: [], code: 'SocDePoble.lliuraCos("x",function(){})' };
  const amb = (canvis, id = null) => infraccionsDelCos({ ...net, ...canvis }, ARREL, null, id);

  test('un cos net no té cap infracció, i l’espai de noms d’SVG no és xarxa', () => {
    expect(amb({})).toEqual([]);
    expect(amb({ code: 'e("svg",{xmlns:"http://www.w3.org/2000/svg"})' })).toEqual([]);
  });

  test('una adreça que és dada només passa per al mòdul que la declara, i la xarxa no passa mai', () => {
    const qr = { code: ['const u="https:', '//www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif="+n;'].join('') };
    expect(amb(qr, 'gestoria')).toEqual([]);
    expect(amb(qr, 'bar').join(' | ')).toContain('URL externa que no declara: www2.agenciatributaria.gob.es');
    expect(amb({ code: ['fet', 'ch("https:', '//www2.agenciatributaria.gob.es/x")'].join('') }, 'gestoria')).toEqual(['obri xarxa: fetch']);
  });

  test.each([
    ['un React propi', { modules: { [`${ARREL}/node_modules/react/index.js`]: {} } }, 'porta el seu React'],
    ['un react-dom propi', { modules: { [`${ARREL}/node_modules/react-dom/client.js`]: {} } }, 'porta el seu React'],
    ['un context de la pàgina', { modules: { [`${ARREL}/src/app/contexts/UIContext.jsx`]: {} } }, 'porta el nucli de la pàgina'],
    ['el port del backend', { modules: { [`${ARREL}/src/data/backendPort.js`]: {} } }, 'porta el nucli de la pàgina'],
    ['host.js', { modules: { [`${ARREL}/src/host.js`]: {} } }, 'porta el nucli de la pàgina'],
    ['una peça de Pedra Seca fora del nucli', { modules: { [`${ARREL}/src/components/PedraSeca/atoms/Avatar.jsx`]: {} } }, 'fora del nucli'],
    ['un fitxer intern de la plataforma', { modules: { [`${ARREL}/src/apps/plataforma/sessioApp.js`]: {} } }, 'fora del nucli'],
    /* Nucli 1.2.0 (261016) · l'espai de treball, només per la porta: una peça de dins al cos, o un nom de la façana que la porta no exposa. */
    ['una peça de l’espai de treball fora del nucli', { modules: { [`${ARREL}/src/components/universal/workspace/NavGlyph.jsx`]: {} } },
      'porta l\'espai de treball fora del nucli'],
    ['un nom de l’espai de treball que el nucli no exposa', { importedBindings: { 'src/components/universal/workspace/index.js': ['ESPAI_COMU'] } },
      'no l\'exposa'],
    ['un nom que el nucli no exposa', { importedBindings: { 'src/components/PedraSeca/index.js': ['Avatar'] } }, 'no l\'exposa'],
    ['tota la façana de Pedra Seca', { importedBindings: { 'src/components/PedraSeca/index.js': ['*'] } }, 'importa tot'],
    ['un paquet que no és del nucli', { importedBindings: { 'react-dom': ['createPortal'] } }, 'no és del nucli'],
    ['un import() sense inlinar', { dynamicImports: ['vista-Ab12.js'] }, 'import() sense inlinar'],
    ['fetch', { code: ['fet', 'ch("/api")'].join('') }, 'obri xarxa: fetch'],
    ['una URL externa', { code: ['"https:', '//exemple.invalid/x"'].join('') }, 'URL externa que no declara: exemple.invalid'],
    ['una URL protocol-relativa', { code: ['i.src="', '//exemple.invalid/p.gif"'].join('') }, 'URL protocol-relativa'],
    ['fetch per claudàtors', { code: ['window["fet', 'ch"]("/api")'].join('') }, 'fetch per claudàtors'],
    ['una imatge-balisa', { code: ['(new Ima', 'ge).src=u'].join('') }, 'new Image'],
    ['un magatzem que no declara', { code: ['window.local', 'Storage.setItem("a","b")'].join('') }, 'magatzem que no declara']
  ])('%s', (_que, canvis, missatge) => {
    expect(amb(canvis).join(' | ')).toContain(missatge);
  });
});

describe('el registre (modul.js) i nomesAscii', () => {
  test('nomesAscii escapa el que no és ASCII i el codi continua sent el mateix', () => {
    const codi = 'var t = "Facturació l’app";';
    const ascii = nomesAscii(codi);
    expect(ascii).toMatch(NOMES_ASCII);
    expect(vm.runInNewContext(`${ascii} t`)).toBe('Facturació l’app');
  });

  test('codiDelRegistre: script clàssic ASCII que registra amb l’URL germana i la integritat', () => {
    const { dades } = llegixManifestDelModul({ id: 'gestoria', carpeta: path.join(ARREL, 'src/apps/gestoria') });
    const codi = codiDelRegistre({ dades, cos: { fitxer: 'cos-Ab12Cd34.js', integrity: INTEGRITAT_DE_PROVA } });
    expect(codi).toMatch(NOMES_ASCII);
    const registraModul = vi.fn(() => Promise.resolve({ ok: true }));
    const caixa = {
      document: { currentScript: { src: 'https://poble.invalid/wp-content/plugins/socdepoble-modul-gestoria/dist/modul.js?ver=1.0.0' } },
      window: { SocDePoble: { registraModul } }, console, Promise, URL
    };
    vm.runInNewContext(codi, caixa);
    expect(registraModul).toHaveBeenCalledTimes(1);
    const [manifest] = registraModul.mock.calls[0];
    expect(manifest.cos).toEqual({
      cami: 'https://poble.invalid/wp-content/plugins/socdepoble-modul-gestoria/dist/cos-Ab12Cd34.js', integrity: INTEGRITAT_DE_PROVA
    });
    expect(manifest.nucli).toBe(RANG);
    expect(manifest.titol.ca).toBe('Gestoria de Poble');
    expect(validaManifestApp(JSON.parse(JSON.stringify(manifest)), { origen: 'modul' }).ok).toBe(true);
  });

  test('sense el paquet abans, o carregat com a mòdul, ho diu i no registra res', () => {
    const { dades } = llegixManifestDelModul({ id: 'bar', carpeta: path.join(ARREL, 'src/apps/bar') });
    const codi = codiDelRegistre({ dades, cos: { fitxer: 'cos-x.js', integrity: INTEGRITAT_DE_PROVA } });
    const error = vi.fn();
    vm.runInNewContext(codi, { document: { currentScript: null }, window: {}, console: { error }, Promise, URL });
    expect(error.mock.calls[0][0]).toContain('cal un <script src>');
  });
});

/* ── 3 · El build de veritat, en memòria ─────────────────────────────── */

/* Un build de producció en memòria: res al disc (write: false), cap .env
   (envDir: la carpeta de prova, que no en té) i NODE_ENV 'production' només
   mentre dura (sota vitest val 'test', i Vite deixaria import.meta.env.DEV a
   cert i triaria jsx-dev-runtime). El JSX, amb l'esbuild de Vite.
   `definicions`: substitucions de compilació NOMÉS d'esta prova (la Gestoria
   sencera força el literal de DEV a cert per a passar-li les guardes).
   Torna `fitxers` (nom → text) i `cos`, el chunk de Rollup del cos (Onada 7,
   261009): els mòduls i les importacions que el build ha mirat. */
async function compilaEnMemoria({ id, carpeta, definicions = {} }) {
  const abans = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const config = configDelModul({ id, arrel: ARREL, carpeta, versio: '0.0.0-prova', generat: '2026-10-09T00:00:00.000Z' });
    const sortida = await build({
      ...config,
      mode: 'production',
      logLevel: 'silent',
      envDir: CARPETA_DE_PROVA,
      define: { ...config.define, ...definicions },
      esbuild: { jsx: 'automatic', jsxDev: false },
      build: { ...config.build, write: false, emptyOutDir: false }
    });
    const fitxers = {};
    let cos = null;
    for (const resultat of [].concat(sortida)) {
      for (const fitxer of resultat.output) {
        fitxers[fitxer.fileName] = fitxer.type === 'chunk' ? fitxer.code : String(fitxer.source);
        if (fitxer.type === 'chunk' && fitxer.isEntry) cos = fitxer;
      }
    }
    return { fitxers, cos };
  } finally {
    process.env.NODE_ENV = abans;
  }
}

const cosDe = (fitxers) => Object.keys(fitxers).find((nom) => /^cos-[A-Za-z0-9_-]+\.js$/.test(nom));

/* La Gestoria de veritat, amb el seu doble pany: en producció, AppGestoria
   no porta cap vista (VISTES val null) i el cos només diu que no és en este
   paquet. Les guardes passen i res de src/sections/gestoria hi viatja. Quan
   el Mestre llevi el pany (fase 2 de l'ADR), esta prova ha de canviar amb la
   decisió. */
describe('la Gestoria compilada com a mòdul (amb el doble pany DEV)', () => {
  let fitxers = {};
  beforeAll(async () => {
    ({ fitxers } = await compilaEnMemoria({ id: 'gestoria', carpeta: path.join(ARREL, 'src/apps/gestoria') }));
  }, 120000);

  test('passa les guardes i només porta el pont: cap vista ni nucli de la Gestoria, cap React propi', () => {
    const cos = fitxers[cosDe(fitxers)];
    expect(Object.keys(fitxers).sort()).toEqual([cosDe(fitxers), FITXER_REGISTRE, FITXER_FITXA].sort());
    expect(cos).toMatch(NOMES_ASCII);
    expect(cos.length).toBeLessThan(8000);
    expect(cos).toContain(nomesAscii('La Gestoria no és en este paquet'));
    expect(cos).not.toMatch(/ShellGestoria|Facturacio\b|Aprendre\b|sdp-gestoria/);
    expect(cos).toMatch(/SocDePoble\.lliuraCos\(["']gestoria["']/);
  });

  test('la fitxa i el registre porten les dades financeres i el rang del nucli', () => {
    const fitxa = JSON.parse(fitxers[FITXER_FITXA]);
    expect(fitxa).toMatchObject({ schema: 'sdp.modul.v1', id: 'gestoria', nucli: RANG, manifest: { dadesPersonals: 'financeres' } });
    expect(fitxa.cos.integrity).toBe(sri384(fitxers[cosDe(fitxers)]));
  });
});

/* La Gestoria SENCERA (Onada 6, correcció de la revisió): les quatre vistes
   del pont (el Tauler, Aprendre, la Facturació i l'Històric), amb els
   Tractors que porten. El literal de DEV es força a cert només en este build
   en memòria: és la prova que la recepta i les guardes valen per a la
   Gestoria de veritat el dia que el Mestre lleve el pany (fase 2 de l'ADR),
   no cap canvi del producte. Les marques són els noms de les bases
   d'IndexedDB de cada vista: contractes de dades, estables. */
describe('la Gestoria sencera compilada com a mòdul (DEV forçat només en esta prova)', () => {
  const BASES_DE_LA_GESTORIA = Object.freeze(['sdp-facturacio', 'sdp-gestoria-perfil', 'sdp-gestoria-cofre', 'sdp-aprendre']);
  let fitxers = {};
  beforeAll(async () => {
    ({ fitxers } = await compilaEnMemoria({
      id: 'gestoria', carpeta: path.join(ARREL, 'src/apps/gestoria'), definicions: { 'import.meta.env.DEV': 'true' }
    }));
  }, 180000);

  test('passa totes les guardes del build: cap React propi, cap context ni dada, Pedra Seca del nucli, cap xarxa', () => {
    const cos = fitxers[cosDe(fitxers)];
    expect(Object.keys(fitxers).sort()).toEqual([cosDe(fitxers), FITXER_REGISTRE, FITXER_FITXA].sort());
    expect(() => new vm.Script(cos)).not.toThrow();
    expect(cos).toMatch(NOMES_ASCII);
    expect(cos).toMatch(/SocDePoble\.lliuraCos\(["']gestoria["']/);
    for (const porta of ['React', 'jsxRuntime', 'router', 'plataforma', 'pedraSeca']) expect(cos).toContain(`SocDePoble.nucli.${porta}`);
  });

  test('porta les quatre vistes de veritat, inlinades al mateix script', () => {
    const cos = fitxers[cosDe(fitxers)];
    for (const vista of ['tauler', 'aprendre', 'facturacio', 'historic']) {
      expect(cos, vista).toMatch(new RegExp(`${vista}:[\\w$]+\\.lazyRoute\\(\\(\\)=>Promise\\.resolve\\(\\)\\.then\\(`));
    }
    for (const base of BASES_DE_LA_GESTORIA) expect(cos, base).toMatch(new RegExp(`["'\`]${base}["'\`]`));
    expect(cos.length).toBeGreaterThan(100000);
  });

  test('les adreces que porta són exactament les que declara la Gestoria; sense la declaració, el build s’aturaria', () => {
    const cos = fitxers[cosDe(fitxers)];
    expect(infraccionsDelText(cos, { id: 'gestoria' })).toEqual([]);
    const senseDeclarar = infraccionsDelText(cos, { id: null });
    for (const host of DECLARACIONS_DELS_MODULS.gestoria.adreces) {
      expect(senseDeclarar, host).toContain(`porta una URL externa que no declara: ${host}`);
    }
    expect(senseDeclarar).toContain('fa servir un magatzem que no declara: IndexedDB');
  });
});

describe('un mòdul compilat de veritat (vite build, write: false)', () => {
  const fitxers = {};
  const nomDelCos = () => cosDe(fitxers);

  beforeAll(async () => {
    Object.assign(fitxers, (await compilaEnMemoria({ id: 'modul-de-prova', carpeta: CARPETA_DE_PROVA })).fitxers);
  }, 120000);

  test('emet el cos, el registre i la fitxa, res més', () => {
    expect(Object.keys(fitxers).sort()).toEqual([nomDelCos(), FITXER_REGISTRE, FITXER_FITXA].sort());
  });

  test('el cos és un script clàssic ASCII, menut, que pren React, el router, la plataforma i Pedra Seca del nucli i lliura el seu component', () => {
    const cos = fitxers[nomDelCos()];
    expect(() => new vm.Script(cos)).not.toThrow();
    expect(cos).toMatch(NOMES_ASCII);
    expect(cos.length).toBeLessThan(8000);
    for (const porta of ['React', 'jsxRuntime', 'router', 'plataforma', 'pedraSeca']) expect(cos).toContain(`SocDePoble.nucli.${porta}`);
    expect(cos).toMatch(/SocDePoble\.lliuraCos\(["']modul-de-prova["']/);
    expect(cos).not.toMatch(/\bimport\s*\(|import\.meta/);
    expect(cos).toContain('Clics: ');
  });

  test('la fitxa diu l’esquema, el rang del nucli i les integritats de veritat', () => {
    const fitxa = JSON.parse(fitxers[FITXER_FITXA]);
    expect(fitxa).toMatchObject({ schema: 'sdp.modul.v1', id: 'modul-de-prova', versio: '0.0.0-prova', nucli: RANG, generat: '2026-10-09T00:00:00.000Z' });
    expect(fitxa.cos).toMatchObject({ cami: nomDelCos(), integrity: sri384(fitxers[nomDelCos()]) });
    expect(fitxa.registre).toMatchObject({ cami: FITXER_REGISTRE, integrity: sri384(fitxers[FITXER_REGISTRE]) });
    expect(fitxa.manifest).toMatchObject({ id: 'modul-de-prova', titol: { ca: 'Mòdul de Prova' } });
    expect('carrega' in fitxa.manifest).toBe(false);
    expect('estils' in fitxa).toBe(false);
  });

  test('el registre compilat registra el mòdul amb l’URL germana del cos i la seua integritat', () => {
    const registre = creaRegistre({ internes: [], carregador: { carregaCos: vi.fn(), oblida: vi.fn() } });
    vm.runInNewContext(fitxers[FITXER_REGISTRE], {
      document: { currentScript: { src: 'https://poble.invalid/moduls/modul-de-prova/modul.js?ver=0.0.0' } },
      window: { SocDePoble: { registraModul: (manifest) => registre.registraModul(JSON.parse(JSON.stringify(manifest))) } },
      console, Promise, URL
    });
    expect(registre.appPerId('modul-de-prova')).toMatchObject({
      origen: 'modul', nucli: RANG,
      cos: { cami: `https://poble.invalid/moduls/modul-de-prova/${nomDelCos()}`, integrity: sri384(fitxers[nomDelCos()]) }
    });
  });

  test('el cos, executat amb un SocDePoble.nucli, lliura un component que es pinta amb el React de la pàgina', () => {
    const lliurats = [];
    const nucli = Object.freeze({
      versio: VERSIO_NUCLI,
      React: Object.freeze({ ...React }),
      jsxRuntime: Object.freeze({ Fragment: jsxRuntime.Fragment, jsx: jsxRuntime.jsx, jsxs: jsxRuntime.jsxs }),
      router: Object.freeze({ useLocation: () => ({ pathname: '/app/modul-de-prova/inici' }) }),
      plataforma: Object.freeze({ useApp: () => ({ manifest: { id: 'modul-de-prova' } }) }),
      pedraSeca: Object.freeze({
        Boto: ({ children }) => React.createElement('button', { type: 'button' }, children),
        EstatBuit: ({ titol }) => React.createElement('p', null, titol)
      })
    });
    vm.runInNewContext(fitxers[nomDelCos()], { SocDePoble: { nucli, lliuraCos: (id, fabrica) => lliurats.push([id, fabrica(nucli)]) } });
    expect(lliurats).toHaveLength(1);
    const [[id, Component]] = lliurats;
    expect(id).toBe('modul-de-prova');
    const html = renderToStaticMarkup(React.createElement(Component));
    expect(html).toContain('Mòdul modul-de-prova a /app/modul-de-prova/inici');
    expect(html).toContain('<button type="button">Clics: 0</button>');
  });

  /* El cos compilat amb el SocDePoble.nucli REAL (nucliModuls.js): els hooks
     del router i de la plataforma que porta el nucli llegixen els contexts
     que munta la pàgina (MemoryRouter i ProveidorApp, del mateix arbre), i
     el Boto és el de Pedra Seca. */
  test('el cos, executat amb el nucli real, es pinta dins dels contexts de la pàgina', async () => {
    /* El nucli porta Pedra Seca, que en carregar-se demana un document (DOMPurify):
       una finestra de jsdom només mentre s'importa i es pinta. */
    const { JSDOM } = await import('jsdom');
    const { window: finestra } = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://poble.invalid/' });
    vi.stubGlobal('window', finestra);
    vi.stubGlobal('document', finestra.document);
    try {
      const { NUCLI } = await import('./nucliModuls.js');
      const lliurats = [];
      vm.runInNewContext(fitxers[nomDelCos()], { SocDePoble: { nucli: NUCLI, lliuraCos: (id, fabrica) => lliurats.push([id, fabrica(NUCLI)]) } });
      expect(lliurats.map(([id]) => id)).toEqual(['modul-de-prova']);
      const [[, Component]] = lliurats;
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, { rutaInicial: '/app/modul-de-prova/inici' },
        React.createElement(ProveidorApp, { manifest: { id: 'modul-de-prova' } }, React.createElement(Component))));
      expect(html).toContain('Mòdul modul-de-prova a /app/modul-de-prova/inici');
      expect(html).toContain('<button type="button" class="sdp-boto sdp-boto--secundari"><span>Clics: 0</span></button>');
    } finally {
      vi.unstubAllGlobals();
    }
  }, 60000); // importar el nucli transforma tota la Pedra Seca: amb la suite sencera en paral·lel, passa dels 5 s
});

/* ── Onada 7 (261009) · el Bar, la Nevera, Salut i el Lector compilats com a mòduls ──
   La fase 1 de l'ADR-2026-12 per a les quatre apps de la recepta, de veritat.
   Amb el nucli 1.0.0 cap d'estos cossos passava les guardes: l'esquelet comú
   demana useRouter, i les vistes, 21 peces de Pedra Seca que no exposava. Amb
   l'1.1.0, sí. Cada build és el de producció, sense cap literal forçat: les
   llavors de DEV (la carta de La Parròquia del Bar i els feeds del Lector)
   no hi han de ser: ni els seus fitxers entre els mòduls que Rollup hi posa,
   ni un tros del seu text. La marca del cos és el nom de la seua base
   d'IndexedDB, un contracte de dades estable (el criteri de pesDelNucli.test.js). */
/* `viatja`: el veí de la llavor que sí que hi és (la carta genèrica del Bar, la de la primera
   càrrega; el pont del Lector, que importa la llavor): la prova mira de veres eixa part de l'arbre.
   `nous`: noms que el cos compilat importa i que el nucli 1.0.0 no exposava (per això no passava).
   `workspace` (nucli 1.2.0, 261016): els de la porta de l'espai de treball; només el Lector, que
   munta el flux de Notícies sobre UniversalWorkspace per la seua façana.
   `plataforma` (nucli 1.3.0, 261024, T5): el nom que l'1.3.0 afig a la porta de la plataforma;
   només el Lector, que llig el servei de notícies (useServeiNoticies). */
const APPS_DE_LA_FASE_1 = Object.freeze({
  bar: Object.freeze({
    base: 'sdp-bar',
    nous: { router: ['useRouter'], pedraSeca: ['BarraResum', 'MarcColumna', 'TeclatNumeric', 'UniversalTPV'], workspace: [], plataforma: [] },
    llavor: {
      fitxers: ['src/apps/bar/llavors/laParroquia.js', 'src/apps/bar/llavors/la-parroquia-loyverse.csv'],
      textos: ['Vendido por peso', 'b5-malibu'],
      viatja: ['src/apps/bar/llavors/index.js', 'src/apps/bar/nucli/llavor.js']
    }
  }),
  nevera: Object.freeze({
    base: 'sdp-nevera',
    nous: { router: ['useRouter'], pedraSeca: ['MarcColumna', 'NavegacioPeriode', 'OrdenaCategories'], workspace: [], plataforma: [] },
    llavor: { fitxers: [], textos: [], viatja: [] }
  }),
  salut: Object.freeze({
    base: 'sdp-salut',
    nous: { router: [], pedraSeca: ['Fila', 'GraellaArticles', 'LlistaArticles', 'Pila'], workspace: [], plataforma: [] },
    llavor: { fitxers: [], textos: [], viatja: [] }
  }),
  /* Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, la pàgina de fonts se'n va
     amb les seues targetes (NavTargetes, sobre GraellaTargetes) i amb l'esquelet comú de catàleg i
     col·lecció (ColumnaCataleg, useVistesEsquelet, que portava useRouter): el Lector ja no importa ni
     GraellaTargetes ni useRouter (la Nevera i l'esquelet comú continuen fent-los servir,
     guardesDelModul.test.js). */
  lector: Object.freeze({
    base: 'sdp-lector',
    nous: {
      router: [], pedraSeca: ['LiniesColleccio', 'MarcColumna'], workspace: ['UniversalWorkspace'],
      plataforma: ['useServeiNoticies']
    },
    llavor: {
      fitxers: ['src/apps/lector/llavor/'],
      textos: ['example.org', 'Club de Pilota del Trinquet', 'Colla de Dimonis'],
      viatja: ['src/apps/lector/AppLector.jsx']
    }
  })
});
/* Les infraccions que el build trobaria sense cap declaració: exactament el que declara l'app. */
const senseDeclarar = (id) => [
  ...DECLARACIONS_DELS_MODULS[id].adreces.map((host) => `porta una URL externa que no declara: ${host}`),
  'fa servir un magatzem que no declara: IndexedDB'
].sort();

describe.each(Object.keys(APPS_DE_LA_FASE_1))(`Onada 7 · %s compilat com a mòdul contra el nucli ${VERSIO_NUCLI}`, (id) => {
  const { base, nous, llavor } = APPS_DE_LA_FASE_1[id];
  const carpeta = path.join(ARREL, 'src/apps', id);
  let fitxers = {};
  let cos = null;
  const codi = () => fitxers[cos.fileName];
  /* Els mòduls que Rollup ha posat dins del cos, des de l'arrel (sense els virtuals). */
  const moduls = () => Object.keys(cos.modules).filter((modul) => !modul.startsWith('\0'))
    .map((modul) => path.relative(ARREL, modul).split(path.sep).join('/'));

  beforeAll(async () => {
    ({ fitxers, cos } = await compilaEnMemoria({ id, carpeta }));
  }, 180000);

  test('un sol cos IIFE amb el registre i la fitxa; ASCII; crida lliuraCos amb el seu id; cap import() ni import.meta', () => {
    expect(Object.keys(fitxers).sort()).toEqual([cos.fileName, FITXER_REGISTRE, FITXER_FITXA].sort());
    expect(cos.fileName).toBe(cosDe(fitxers));
    expect(() => new vm.Script(codi())).not.toThrow();
    expect(codi()).toMatch(NOMES_ASCII);
    expect(codi()).toMatch(new RegExp(`SocDePoble\\.lliuraCos\\(["']${id}["']`));
    /* La forma minificada, sense espai: el text de la UI en té («Cobra este import (part)», al Bar).
       La prova de veres és la de Rollup: cap import() que no s'haja inlinat. */
    expect(codi()).not.toMatch(/(?:^|[^\w$.])(?:import|require)\(|\bimport\.meta\b/);
    expect(cos.dynamicImports).toEqual([]);
  });

  test('cada importació és una porta del nucli, i el cos les rep com a SocDePoble.nucli.<porta>', () => {
    expect(cos.imports.filter((font) => !portaDeLaFont(font))).toEqual([]);
    expect(Object.keys(cos.importedBindings).sort()).toEqual([...cos.imports].sort());
    expect(cos.imports).toEqual(expect.arrayContaining([
      'react', 'src/app/contexts/RouterContext.jsx', 'src/apps/plataforma/index.js', 'src/components/PedraSeca/index.js'
    ]));
    /* La crida de l'IIFE: un argument per importació, en el mateix ordre. */
    const crida = codi().match(/\}\)\(([\w$.,]*)\);?\s*$/);
    expect(crida, 'la crida final de l’IIFE').not.toBeNull();
    expect(crida[1].split(',')).toEqual(cos.imports.map((font) => globalDeLaPorta(portaDeLaFont(font))));
    /* Res del nucli de la pàgina viatja dins: ni React, ni Pedra Seca, ni la plataforma, ni cap context o dada. */
    expect(moduls().filter((font) => /node_modules\/(?:react|react-dom|scheduler)\/|^src\/(?:components\/PedraSeca|apps\/plataforma|app\/contexts|data)\//.test(font))).toEqual([]);
    expect(moduls()).toEqual(expect.arrayContaining([`src/apps/${id}/magatzem.js`, 'src/utils/magatzemLocal.js']));
  });

  /* Actualitzada a posta (261024 T5): també el nom de l'1.3.0 (useServeiNoticies, el Lector). */
  test('la porta mira de veres: el cos importa noms que l’1.1.0, l’1.2.0 i l’1.3.0 afigen al nucli, i el nucli els exposa', () => {
    for (const [font, noms] of [
      ['src/app/contexts/RouterContext.jsx', nous.router], ['src/components/PedraSeca/index.js', nous.pedraSeca],
      ['src/components/universal/workspace/index.js', nous.workspace], ['src/apps/plataforma/index.js', nous.plataforma]
    ]) {
      expect(cos.importedBindings[font] || [], font).toEqual(expect.arrayContaining(noms));
      for (const nom of noms) expect(exposaElNom(portaDeLaFont(font), nom), nom).toBe(true);
    }
  });

  test('porta la seua base d’IndexedDB i cap llavor de DEV', () => {
    expect(codi()).toMatch(new RegExp(`["'\`]${base}["'\`]`));
    expect(moduls().filter((font) => llavor.fitxers.some((fitxer) => font.startsWith(fitxer)))).toEqual([]);
    expect(moduls()).toEqual(expect.arrayContaining(llavor.viatja));
    for (const tros of llavor.textos) expect(codi(), tros).not.toContain(tros);
  });

  test('passa les guardes amb la seua declaració; sense, el build s’aturaria amb exactament el que declara', () => {
    expect(infraccionsDelCos(cos, ARREL, carpeta, id)).toEqual([]);
    expect(infraccionsDelText(codi(), { id })).toEqual([]);
    expect(infraccionsDelCos(cos, ARREL, carpeta, null).sort()).toEqual(senseDeclarar(id));
  });

  test(`la fitxa i el registre porten el rang del nucli ${VERSIO_NUCLI}, les dades del manifest i les integritats de veritat`, () => {
    const fitxa = JSON.parse(fitxers[FITXER_FITXA]);
    expect(fitxa).toMatchObject({ schema: 'sdp.modul.v1', id, nucli: RANG, manifest: { id } });
    expect(fitxa.cos).toMatchObject({ cami: cos.fileName, integrity: sri384(codi()) });
    expect(fitxa.registre).toMatchObject({ cami: FITXER_REGISTRE, integrity: sri384(fitxers[FITXER_REGISTRE]) });
    const registre = creaRegistre({ internes: [], carregador: { carregaCos: vi.fn(), oblida: vi.fn() } });
    vm.runInNewContext(fitxers[FITXER_REGISTRE], {
      document: { currentScript: { src: `https://poble.invalid/moduls/${id}/modul.js?ver=0.0.0` } },
      window: { SocDePoble: { registraModul: (manifest) => registre.registraModul(JSON.parse(JSON.stringify(manifest))) } },
      console, Promise, URL
    });
    expect(registre.appPerId(id)).toMatchObject({
      origen: 'modul', nucli: RANG, cos: { cami: `https://poble.invalid/moduls/${id}/${cos.fileName}`, integrity: sri384(codi()) }
    });
  });

  /* El cos amb el SocDePoble.nucli REAL (nucliModuls.js), com el del mòdul de prova. */
  test('executat amb el SocDePoble.nucli real, lliura un component', async () => {
    const { JSDOM } = await import('jsdom');
    const { window: finestra } = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://poble.invalid/' });
    vi.stubGlobal('window', finestra);
    vi.stubGlobal('document', finestra.document);
    try {
      const { NUCLI } = await import('./nucliModuls.js');
      expect(NUCLI.versio).toBe(VERSIO_NUCLI);
      const lliurats = [];
      vm.runInNewContext(codi(), { SocDePoble: { nucli: NUCLI, lliuraCos: (lliurat, fabrica) => lliurats.push([lliurat, fabrica(NUCLI)]) } });
      expect(lliurats.map(([lliurat]) => lliurat)).toEqual([id]);
      expect(typeof lliurats[0][1]).toBe('function');
      if (id === 'lector') {
        /* Sense port de notícies (la llavor és de DEV), el Lector ho diu amb l'EstatBuit de la Pedra Seca de la pàgina. */
        const [[, Component]] = lliurats;
        const html = renderToStaticMarkup(React.createElement(MemoryRouter, { rutaInicial: '/app/lector/noticies' },
          React.createElement(ProveidorApp, { manifest: { id: 'lector' } }, React.createElement(Component))));
        expect(html).toContain('Encara no hi ha cap font connectada');
        expect(html).toBe(renderToStaticMarkup(React.createElement(NUCLI.pedraSeca.EstatBuit, { titol: 'Encara no hi ha cap font connectada' },
          'Quan el poble connecte les seues fonts de notícies, les llegiràs ací.')));
      }
    } finally {
      vi.unstubAllGlobals();
    }
  }, 60000);
});

/* ── Nucli 1.2.0 (261016) · la porta 'workspace', de veritat ──
   Un mòdul de prova (__fixtures__/modulAmbEspai) que munta l'espai de treball del Bloc de notes
   per la seua façana, l'import que farà el Lector. La clausura de l'espai arriba al port del
   backend (ItemMedia → useResolvedAsset → backendPort, fronteres.test.js): el cos no en porta cap
   fitxer, el pren de SocDePoble.nucli.workspace, i passa les guardes del build sense declarar res.
   Executat amb el nucli REAL, pinta la targeta per defecte de la pàgina. Des del Gauntlet 261016
   l'espai el munta també una app de veres, el Lector (vistes/Noticies.jsx, UniversalWorkspace):
   el seu cos ho prova a l'Onada 7 (`nous.workspace`) i guardesDelModul.test.js, §6, ho comprova
   per a NOMS_DEL_NUCLI_1_2. Este mòdul de prova cobrix a més DefaultItemCard. */
describe('la porta workspace (nucli 1.2.0): un mòdul que munta l’espai de treball', () => {
  const CARPETA = path.join(ARREL, 'src/apps/plataforma/__fixtures__/modulAmbEspai');
  const FONT = 'src/components/universal/workspace/index.js';
  const ELEMENT = Object.freeze({ id: 'pou-del-raval', title: 'Pou del Raval', subtitle: 'Notícia de prova' });
  let fitxers = {};
  let cos = null;
  const codi = () => fitxers[cos.fileName];
  const moduls = () => Object.keys(cos.modules).filter((modul) => !modul.startsWith('\0'))
    .map((modul) => path.relative(ARREL, modul).split(path.sep).join('/'));

  beforeAll(async () => {
    ({ fitxers, cos } = await compilaEnMemoria({ id: 'modul-amb-espai', carpeta: CARPETA }));
  }, 120000);

  test('el cos pren l’espai de treball de SocDePoble.nucli.workspace, amb els dos noms de la porta i res més', () => {
    expect(Object.keys(fitxers).sort()).toEqual([cos.fileName, FITXER_REGISTRE, FITXER_FITXA].sort());
    expect(() => new vm.Script(codi())).not.toThrow();
    expect(codi()).toMatch(NOMES_ASCII);
    expect(cos.imports).toContain(FONT);
    expect(cos.imports.filter((font) => !portaDeLaFont(font))).toEqual([]);
    expect([...cos.importedBindings[FONT]].sort()).toEqual(['DefaultItemCard', 'UniversalWorkspace']);
    for (const nom of cos.importedBindings[FONT]) expect(exposaElNom(portaDeLaFont(FONT), nom), nom).toBe(true);
    expect(codi()).toContain('SocDePoble.nucli.workspace');
    const crida = codi().match(/\}\)\(([\w$.,]*)\);?\s*$/);
    expect(crida, 'la crida final de l’IIFE').not.toBeNull();
    expect(crida[1].split(',')).toEqual(cos.imports.map((font) => globalDeLaPorta(portaDeLaFont(font))));
    expect(codi().length).toBeLessThan(8000);
  });

  test('cap fitxer de l’espai ni del seu camí al port viatja dins del cos, i passa les guardes del build', () => {
    expect(moduls()).toEqual(['src/apps/plataforma/__fixtures__/modulAmbEspai/AppModulAmbEspai.jsx']);
    expect(codi()).not.toMatch(/sdp-gestor-fitxa|useResolvedAsset|resolveAsset/);
    expect(infraccionsDelCos(cos, ARREL, CARPETA, 'modul-amb-espai')).toEqual([]);
    const fitxa = JSON.parse(fitxers[FITXER_FITXA]);
    expect(fitxa).toMatchObject({ schema: 'sdp.modul.v1', id: 'modul-amb-espai', nucli: RANG });
  });

  test('executat amb el SocDePoble.nucli real, pinta la targeta per defecte de la pàgina', async () => {
    const { JSDOM } = await import('jsdom');
    const { window: finestra } = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://poble.invalid/' });
    vi.stubGlobal('window', finestra);
    vi.stubGlobal('document', finestra.document);
    try {
      const { NUCLI } = await import('./nucliModuls.js');
      const lliurats = [];
      vm.runInNewContext(codi(), { SocDePoble: { nucli: NUCLI, lliuraCos: (id, fabrica) => lliurats.push([id, fabrica(NUCLI)]) } });
      expect(lliurats.map(([id]) => id)).toEqual(['modul-amb-espai']);
      const [[, Component]] = lliurats;
      const html = renderToStaticMarkup(React.createElement(Component));
      expect(html).toContain('Pou del Raval');
      expect(html).toBe(renderToStaticMarkup(React.createElement(NUCLI.workspace.DefaultItemCard,
        { item: ELEMENT, active: false, onSelect: () => {} })));
    } finally {
      vi.unstubAllGlobals();
    }
  }, 60000);
});
