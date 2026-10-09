/**
 * P7-A · Onada 4, setena passada · La pàgina de cada plugin (/plugin/:id):
 * una UniversalPage amb la il·lustració de portada (plegable), el títol, el
 * subtítol i l'entradilla del registre, signada per Sóc de Poble, i al final
 * el gran botó blau «Obrir …». Amb destí, un enllaç del router (amb la base de
 * l'amfitrió); sense destí, o amb una app apagada en este build, un botó
 * inert que ho diu (aria-disabled, avís en text i toast) i no navega mai.
 * Un id desconegut és la 404 de sempre (NotFoundPage).
 *
 * Router en memòria i plataforma de veres (ProveidorPlataforma amb un entorn
 * fixat). Les proves són fora de L2 (tractor-persistencia).
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { CLAU_PORTADES, _reiniciaPortades } from '../../components/universal/UniversalPage.jsx';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import { _reiniciaPreferencies, CLAU_PREFERENCIES } from '../../apps/plataforma/preferenciesApps.js';
import { creaRegistre, MANIFESTS_INTERNS } from '../../apps/plataforma/registreApps.js';
import { baseRecursos, fixaBaseRecursos } from '../../config/assetResolver';
import { createTranslator, SUPPORTED_LANGUAGES } from '../../config/i18n';
import { STORAGE_PREFIX } from '../../config/storage.js';
import PluginPage from './PluginPage.jsx';
import { PLUGINS, pluginPerId } from './registrePlugins.js';
import { portaDelPlugin } from './useDestiDelPlugin.js';

/* Un node on tot el que és compilat està encés (com el servidor de dev). */
const ENTORN_OBERT = Object.freeze({ produccio: false, teDret: () => true, teCapacitat: () => true, amaDelDocument: true });
/* Un build de producció sense cap VITE_SDP_APP_*: les apps en desenvolupament, apagades. */
const ENTORN_PRODUCCIO = Object.freeze({ produccio: true, teDret: () => false, teCapacitat: () => true, amaDelDocument: true });

function Ubicacio() {
  const { pathname } = useLocation();
  // Un <p>, no un <output>: <output> ja té el rol «status», el mateix de l'avís.
  return <p data-testid="ubicacio">{pathname}</p>;
}

/* Peça C (ordre del Mestre, 261007, prompt 261007_1628) · Un build de
   producció de veres sense cap VITE_SDP_APP_*: Vite hi deixa `carrega` a null
   (el literal de compilació de cada manifest). Vitest corre amb DEV=true i
   el registre del document les porta compilades totes; este registre
   reprodueix el paquet de producció. */
const registreDeProduccio = () => creaRegistre({ internes: MANIFESTS_INTERNS.map((m) => ({ ...m, carrega: null })) });

function munta(ruta, { entorn = ENTORN_OBERT, basename = '', externalConfig = {}, registre } = {}) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  return render(
    <UIProvider externalConfig={externalConfig}>
      <NotificationProvider>
        <MemoryRouter rutaInicial={ruta} basename={basename}>
          <ProveidorPlataforma entorn={entorn} registre={registre}>
            <Routes>
              <Route path="/plugin/:id" element={<PluginPage />} />
              <Route path="*" element={<p>Fora de la pàgina</p>} />
            </Routes>
            <Ubicacio />
          </ProveidorPlataforma>
        </MemoryRouter>
      </NotificationProvider>
    </UIProvider>
  );
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const accio = (container) => container.querySelector('.sdp-pagina-accio');

beforeEach(() => {
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PORTADES);
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PREFERENCIES);
  _reiniciaPortades();
  _reiniciaPreferencies();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PORTADES);
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PREFERENCIES);
  _reiniciaPortades();
  _reiniciaPreferencies();
});

describe('cada plugin té la seua pàgina', () => {
  test.each(PLUGINS.map((p) => [p.id, p]))('/plugin/%s: portada, títols, entradilla, autoria i el botó d’Obrir', (id, plugin) => {
    const { container } = munta(`/plugin/${id}`);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(plugin.titol);
    expect(screen.getByRole('heading', { level: 2, name: plugin.subtitol })).toBeTruthy();
    expect(container.querySelector('.page-intro .lead').textContent).toBe(plugin.entradilla);
    const portada = container.querySelector('.hero-image img');
    expect(portada.getAttribute('src')).toBe(`/assets/ui/plugins/${id}_vinyeta.jpg`);
    expect(portada.getAttribute('alt')).toBe(plugin.imatgeAlt);
    // La portada és plegable i es veu per defecte.
    const plega = screen.getByRole('button', { name: 'Amaga la portada' });
    expect(plega.getAttribute('aria-expanded')).toBe('true');
    // Signada per Sóc de Poble, com les pàgines de publicació.
    expect(within(container.querySelector('section.bar-orange')).getByText('Sóc de Poble')).toBeTruthy();
    // El gran botó blau, al final, a l'ample sencer.
    const boto = accio(container).firstElementChild;
    expect(boto.className).toBe('sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple');
    expect(boto.textContent.startsWith(plugin.etiquetaObrir)).toBe(true);
    expect(container.querySelector('article.content-wrapper').lastElementChild).toBe(accio(container));
  });
});

test('dins de WordPress (base del paquet fixada), la portada ve del paquet, no de l’arrel de l’amfitrió', () => {
  fixaBaseRecursos('https://amfitrio.example/wp-content/plugins/socdepoble/dist/');
  try {
    const { container } = munta('/plugin/gestoria');
    expect(container.querySelector('.hero-image img').getAttribute('src'))
      .toBe('https://amfitrio.example/wp-content/plugins/socdepoble/dist/assets/ui/plugins/gestoria_vinyeta.jpg');
  } finally {
    fixaBaseRecursos('/');
  }
  expect(baseRecursos()).toBe('');
});

test('un id que no és del registre és la 404 de sempre', () => {
  munta('/plugin/desconegut');
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ací no hi ha res');
  expect(screen.queryByRole('button', { name: /portada/ })).toBeNull();
  cleanup();
  munta('/plugin/constructor');
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ací no hi ha res');
});

/* Ordre del Mestre (261007) · Bàscula descartada per ara: ja no és del
   registre, i /plugin/bascula és la 404 de sempre, sense cap botó «Obrir». */
test('la Bàscula, descartada, ja no té pàgina: /plugin/bascula és la 404 de sempre', () => {
  munta('/plugin/bascula');
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ací no hi ha res');
  expect(screen.queryByRole('button', { name: /Bàscula/ })).toBeNull();
  expect(screen.queryByRole('link', { name: /Bàscula/ })).toBeNull();
});

/* Onada 8 (261009; requeriments 261009_1300, punt 2: «són pàgines, no
   plugins») · La Consola, el Cervell i el Panell de Disseny ixen del
   registre, com la Bàscula: /plugin/<id> és la 404 de sempre, sense cap botó
   «Obrir». Les seues pàgines són /page/consola, /page/cervell i /disseny
   (systemPages.test.js). */
test.each([['consola', /Consola/], ['cervell', /Cervell/], ['disseny', /Disseny/]])(
  'la pàgina del sistema «%s» ja no és un plugin: /plugin/<id> és la 404 de sempre', (id, nom) => {
    munta(`/plugin/${id}`);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ací no hi ha res');
    expect(screen.queryByRole('button', { name: nom })).toBeNull();
    expect(screen.queryByRole('link', { name: nom })).toBeNull();
  }
);

describe('el botó Obrir', () => {
  /* Onada 8 (261009) · Abans, amb la Consola (/consola), que ja no és un
     plugin: ara, amb el TPV del Bar, en un node on tot està encés. */
  test('amb destí és un enllaç del router: porta a la secció de veres sense eixir de l’app', () => {
    munta('/plugin/tpv');
    const enllac = screen.getByRole('link', { name: 'Obrir el Bar' });
    expect(enllac.getAttribute('href')).toBe('/app/bar');
    fireEvent.click(enllac);
    expect(ubicacio()).toBe('/app/bar');
  });

  /* Onada 8 (261009) · Abans també el Cervell (/consola/explorador), que ja no
     és un plugin. */
  test('el Rebost obri l’entrada «A casa» de la Nevera', () => {
    munta('/plugin/rebost');
    fireEvent.click(screen.getByRole('link', { name: 'Obrir el Rebost' }));
    expect(ubicacio()).toBe('/app/nevera/casa');
  });

  test('amb la base de l’amfitrió (WordPress), l’href la porta i el clic navega dins del router', () => {
    munta('/plugin/salut', { basename: '/poble' });
    const enllac = screen.getByRole('link', { name: 'Obrir Salut' });
    expect(enllac.getAttribute('href')).toBe('/poble/app/salut');
    fireEvent.click(enllac);
    expect(ubicacio()).toBe('/app/salut');
  });

  /* Onada 2 de la Gestoria (261004) · La Gestoria ja té destí (la seua app,
     només en desenvolupament).
     Ordre del Mestre (261007) · Bàscula descartada per ara: l'exemple de
     «sense destí» és ara Animalets, que tampoc té secció
     (control/destinsControl.js). */
  test('sense destí (en obres): botó inert, avís en text i toast, i no navega', () => {
    const { container } = munta('/plugin/animalets');
    expect(screen.queryByRole('link', { name: /Obrir Animalets/ })).toBeNull();
    const boto = screen.getByRole('button', { name: 'Obrir Animalets (en obres)' });
    expect(boto.getAttribute('aria-disabled')).toBe('true');
    expect(boto.getAttribute('type')).toBe('button');
    expect(within(accio(container).parentElement).getByText('Esta eina encara està en obres.')).toBeTruthy();
    fireEvent.click(boto);
    expect(ubicacio()).toBe('/plugin/animalets');
    expect(screen.getByText('“Obrir Animalets” encara està en obres.')).toBeTruthy();
  });

  /* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
     Gestoria i Wiki») · La Gestoria ja no viu dins de la Wiki: en dev,
     «Obrir» és un enllaç a la seua app, /app/gestoria (cap consulta, cap
     dada); mai la Wiki ni /gestoria. */
  test('la Gestoria en desenvolupament obri la seua app pel router, i cap lloc de la Wiki', () => {
    const { container } = munta('/plugin/gestoria', { entorn: ENTORN_OBERT });
    const enllac = screen.getByRole('link', { name: 'Obrir la Gestoria' });
    expect(enllac.getAttribute('href')).toBe('/app/gestoria');
    expect(document.querySelector('[href="/gestoria"]')).toBeNull();
    expect(container.querySelector('a[href*="wikidepoble"], a[href*="gestoria_"]')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(enllac);
    expect(ubicacio()).toBe('/app/gestoria');
  });

  /* Fora de desenvolupament, l'app no s'obri (entorn 'desenvolupament'): la
     pàgina es manté, diu honestament que està en obres i no navega a res. */
  test('la Gestoria en producció: cap enllaç, botó inert, diu que està en obres i no navega', () => {
    const { container } = munta('/plugin/gestoria', { entorn: ENTORN_PRODUCCIO });
    expect(screen.queryByRole('link', { name: /Obrir la Gestoria/ })).toBeNull();
    expect(container.querySelector('a[href*="wikidepoble"], a[href*="gestoria_"], a[href*="/app/gestoria"]')).toBeNull();
    const boto = screen.getByRole('button', { name: 'Obrir la Gestoria (no disponible ací)' });
    expect(boto.getAttribute('aria-disabled')).toBe('true');
    const motiu = 'Encara està en obres: només es pot provar en desenvolupament.';
    expect(screen.getByRole('status').textContent).toBe(motiu);
    fireEvent.click(boto);
    expect(ubicacio()).toBe('/plugin/gestoria');
    expect(screen.getAllByText(motiu)).toHaveLength(2);
    // La pàgina de la Gestoria continua sent la seua: portada, títol i entradilla.
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Gestoria');
    expect(container.querySelector('.hero-image img').getAttribute('src')).toBe('/assets/ui/plugins/gestoria_vinyeta.jpg');
  });

  /* Ordre del Mestre (261007) · Bàscula descartada per ara: fora d'esta llista. */
  test.each([['mapa', 'Obrir el Mapa'], ['vehicle', 'Obrir Vehicle Compartit'], ['animalets', 'Obrir Animalets']])(
    '%s: en obres, inert', (id, nom) => {
      munta(`/plugin/${id}`);
      expect(screen.getByRole('button', { name: `${nom} (en obres)` }).getAttribute('aria-disabled')).toBe('true');
      expect(screen.queryByRole('link', { name: new RegExp(nom) })).toBeNull();
    }
  );

  /* Peça C (ordre del Mestre, 261007, prompt 261007_1628) · Esta prova es
     deia «producció sense VITE_SDP_APP_*», però vitest corre amb DEV=true:
     el Lector hi és compilat i només l'apaga la capa d'entorn (manifest amb
     entorn 'desenvolupament' i produccio: true). Es conserva, amb el nom del
     que comprova de veres; el build real és la prova de davall. */
  test('capa d’entorn: una app compilada amb entorn «desenvolupament», en producció, no fa cap enllaç mort: inert i diu per què', () => {
    munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO });
    expect(screen.queryByRole('link', { name: /Obrir el Lector/ })).toBeNull();
    const boto = screen.getByRole('button', { name: 'Obrir el Lector (no disponible ací)' });
    expect(boto.getAttribute('aria-disabled')).toBe('true');
    const motiu = 'Encara està en obres: només es pot provar en desenvolupament.';
    expect(screen.getByRole('status').textContent).toBe(motiu);
    fireEvent.click(boto);
    expect(ubicacio()).toBe('/plugin/rss');
    expect(screen.getAllByText(motiu)).toHaveLength(2);
  });

  /* Peça C (261007) · El build de producció de veres sense VITE_SDP_APP_*:
     el Lector no és al paquet (carrega null) i la plataforma ho diu abans que
     l'entorn ('no-compilada', interruptors.js). Este és el text que veu
     producció, no el de la capa d'entorn. */
  test('build de producció sense VITE_SDP_APP_* (carrega null): inert, «Este node no porta esta app.» i no navega', () => {
    const registre = registreDeProduccio();
    // El registre simulat és el de producció: el Lector hi és, però sense compilar.
    expect(registre.appPerId('lector')).toMatchObject({ id: 'lector', origen: 'interna', carrega: null });
    expect(registre.componentDe('lector')).toBeNull();
    munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO, registre });
    expect(screen.queryByRole('link', { name: /Obrir el Lector/ })).toBeNull();
    const boto = screen.getByRole('button', { name: 'Obrir el Lector (no disponible ací)' });
    expect(boto.getAttribute('aria-disabled')).toBe('true');
    const motiu = 'Este node no porta esta app.';
    expect(screen.getByRole('status').textContent).toBe(motiu);
    fireEvent.click(boto);
    expect(ubicacio()).toBe('/plugin/rss');
    expect(screen.getAllByText(motiu)).toHaveLength(2);
  });

  /* Onada 8 (261009) · Abans, darrere, el Panell de Disseny (cap app de la
     plataforma, el seu enllaç no depenia del build): ja no és un plugin. */
  test('build de producció: cap app de la plataforma fa enllaç', () => {
    const registre = registreDeProduccio();
    for (const [id, nom] of [['tpv', 'Obrir el Bar'], ['rebost', 'Obrir el Rebost'], ['salut', 'Obrir Salut'], ['gestoria', 'Obrir la Gestoria']]) {
      munta(`/plugin/${id}`, { entorn: ENTORN_PRODUCCIO, registre });
      expect(screen.queryByRole('link', { name: new RegExp(nom) }), id).toBeNull();
      expect(screen.getByRole('button', { name: `${nom} (no disponible ací)` }).getAttribute('aria-disabled'), id).toBe('true');
      cleanup();
    }
  });

  /* Revisió P7-A · La Consola (i l'Explorador del Cervell) viu de
     /__iaia/consola.json i /__iaia/mapa.json, que només servix el middleware
     de desenvolupament (tooling/vite/consola-iaia.mjs, `apply: 'serve'`).
     Derogades per l'ordre del Mestre del 261009 (requeriments 261009_1300,
     punt 2; decisió D3 de MarIA) les proves «consola/cervell en producció:
     inert» i «la Consola en desenvolupament, un enllaç a /consola»: ja no són
     plugins, i /plugin/consola i /plugin/cervell són la 404. El seu botó
     «Obrir…» és el de la seua pàgina del sistema (/page/consola i
     /page/cervell), i la barrera de producció és la de la ruta, el rol de
     superadmin (RutaConsola d'App.jsx; systemPages.test.js). El que cau amb
     les proves és la superfície, no la regla: el botó de la pàgina no mira
     l'entorn, i si fora de desenvolupament ha de ser inert és una decisió
     pendent de MarIA o del Mestre (systemPages.js, OBRIR_CONSOLA). */

  test('si la persona apaga l’app al portal, el botó deixa de portar-hi', () => {
    window.localStorage.setItem(STORAGE_PREFIX + CLAU_PREFERENCIES, JSON.stringify({ v: 1, apps: { bar: false }, interruptors: {} }));
    _reiniciaPreferencies();
    munta('/plugin/tpv');
    expect(screen.queryByRole('link', { name: /Obrir el Bar/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Obrir el Bar (no disponible ací)' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('L’has apagada tu. La pots tornar a encendre quan vulgues.');
  });

  test('Salut dins d’una web d’altri (no és l’ama del document): inert, amb el motiu de la privacitat', () => {
    munta('/plugin/salut', { entorn: { ...ENTORN_OBERT, amaDelDocument: false } });
    expect(screen.queryByRole('link', { name: /Obrir Salut/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Guarda dades de salut');
  });
});

test('portaDelPlugin (la que pot reutilitzar la graella del Control): oberta, en obres o no disponible', () => {
  const t = (_clau, reserva) => reserva;
  const bar = pluginPerId('tpv');
  expect(portaDelPlugin(bar, { estat: 'obert', ruta: '/app/bar', motiu: null }, t)).toEqual({
    avis: null,
    porta: { id: 'obrir', verb: 'Obrir el Bar', nom: 'Obrir el Bar', varietat: 'primari', desti: '/app/bar' }
  });
  /* Ordre del Mestre (261007) · Bàscula descartada per ara: l'exemple en obres és Animalets. */
  expect(portaDelPlugin(pluginPerId('animalets'), { estat: 'en-obres', ruta: null, motiu: null }, t)).toEqual({
    avis: 'Esta eina encara està en obres.',
    porta: {
      id: 'obrir', verb: 'Obrir Animalets', nom: 'Obrir Animalets', varietat: 'primari', desti: null,
      enObres: '(en obres)', avis: '“Obrir Animalets” encara està en obres.'
    }
  });
  const apagada = portaDelPlugin(bar, { estat: 'no-disponible', ruta: null, motiu: 'persona-apagada' }, t);
  expect(apagada.avis).toBe('L’has apagada tu. La pots tornar a encendre quan vulgues.');
  expect(apagada.porta).toMatchObject({ desti: null, enObres: '(no disponible ací)', avis: apagada.avis });
});

describe('la portada de cada plugin es plega i es recorda per plugin', () => {
  test('plegar la Gestoria no plega la Salut; en tornar a la Gestoria continua plegada', () => {
    const { container } = munta('/plugin/gestoria');
    fireEvent.click(screen.getByRole('button', { name: 'Amaga la portada' }));
    expect(container.querySelector('.hero-image img').closest('[hidden]')).not.toBeNull();
    cleanup();
    _reiniciaPortades();
    munta('/plugin/salut');
    expect(screen.getByRole('button', { name: 'Amaga la portada' })).toBeTruthy();
    cleanup();
    _reiniciaPortades();
    munta('/plugin/gestoria');
    expect(screen.getByRole('button', { name: 'Mostra la portada' }).getAttribute('aria-expanded')).toBe('false');
  });
});

describe('textos nous de la UI en les cinc llengües', () => {
  const CLAUS = {
    'pagina.portada.amaga': 'Amaga la portada',
    'pagina.portada.mostra': 'Mostra la portada',
    'section.plugin.enObres': 'Esta eina encara està en obres.',
    'section.plugin.noDisponible': '(no disponible ací)'
  };
  test.each(Object.entries(CLAUS))('%s: valor propi en cada llengua i el valencià és la reserva del codi', (clau, valencia) => {
    expect(createTranslator('ca')(clau)).toBe(valencia);
    for (const { code } of SUPPORTED_LANGUAGES) {
      const valor = createTranslator(code)(clau);
      expect([code, valor !== clau && valor.length > 0]).toEqual([code, true]);
      if (code !== 'ca') expect([code, valor === valencia]).toEqual([code, false]);
    }
  });

  /* Ordre del Mestre (261007) · Bàscula descartada per ara: el plugin en obres d'esta prova és Animalets. */
  test('amb l’amfitrió en castellà, la portada i l’avís d’obres parlen castellà', () => {
    const es = createTranslator('es');
    munta('/plugin/animalets', { externalConfig: { language: 'es' } });
    expect(pluginPerId('animalets')).not.toBeNull();
    expect(screen.getByRole('button', { name: es('pagina.portada.amaga') })).toBeTruthy();
    expect(screen.getByText(es('section.plugin.enObres'))).toBeTruthy();
    expect(screen.getByRole('button', { name: `Obrir Animalets ${es('section.control.porta.enObres')}` })).toBeTruthy();
  });
});
