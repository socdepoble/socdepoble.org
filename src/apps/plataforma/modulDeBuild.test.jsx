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
import { DECLARACIONS_DELS_MODULS, infraccionsDelText } from './guardesDelModul.js';
import { validaManifestApp } from './manifestApp.js';
import { creaRegistre } from './registreApps.js';

const ARREL = process.cwd();
const CARPETA_DE_PROVA = path.join(ARREL, 'src/apps/plataforma/__fixtures__/modulDeProva');
const sri384 = (text) => `sha384-${createHash('sha384').update(text).digest('base64')}`;
const NOMES_ASCII = /^[\u0000-~]*$/;

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
    expect(rangDelNucli()).toBe('^1.0');
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
    expect(manifest.nucli).toBe('^1.0');
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
   sencera força el literal de DEV a cert per a passar-li les guardes). */
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
    for (const resultat of [].concat(sortida)) {
      for (const fitxer of resultat.output) fitxers[fitxer.fileName] = fitxer.type === 'chunk' ? fitxer.code : String(fitxer.source);
    }
    return fitxers;
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
    fitxers = await compilaEnMemoria({ id: 'gestoria', carpeta: path.join(ARREL, 'src/apps/gestoria') });
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
    expect(fitxa).toMatchObject({ schema: 'sdp.modul.v1', id: 'gestoria', nucli: '^1.0', manifest: { dadesPersonals: 'financeres' } });
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
    fitxers = await compilaEnMemoria({
      id: 'gestoria', carpeta: path.join(ARREL, 'src/apps/gestoria'), definicions: { 'import.meta.env.DEV': 'true' }
    });
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
    Object.assign(fitxers, await compilaEnMemoria({ id: 'modul-de-prova', carpeta: CARPETA_DE_PROVA }));
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
    expect(fitxa).toMatchObject({ schema: 'sdp.modul.v1', id: 'modul-de-prova', versio: '0.0.0-prova', nucli: '^1.0', generat: '2026-10-09T00:00:00.000Z' });
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
      origen: 'modul', nucli: '^1.0',
      cos: { cami: `https://poble.invalid/moduls/modul-de-prova/${nomDelCos()}`, integrity: sri384(fitxers[nomDelCos()]) }
    });
  });

  test('el cos, executat amb un SocDePoble.nucli, lliura un component que es pinta amb el React de la pàgina', () => {
    const lliurats = [];
    const nucli = Object.freeze({
      versio: '1.0.0',
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
