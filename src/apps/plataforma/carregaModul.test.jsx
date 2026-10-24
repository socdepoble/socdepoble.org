/* Plataforma d'Apps Enxufables · el carregador del cos d'un mòdul
   (carregaModul.js, contracte sdp.modul.v1, ADR-2026-12).
   jsdom no baixa ni executa cap <script src>: la prova fa de navegador. Fixa
   document.currentScript al script injectat (el que veuria el cos mentre
   s'executa), crida lliuraCos i, quan cal, dispara `load` o `error`. Cap
   xarxa ni URL real: l'origen és el de jsdom. */
import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Route, Routes } from '../../app/contexts/RouterContext.jsx';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary.jsx';
import { INTEGRITAT_DE_PROVA, manifestModulDeProva } from './__fixtures__/manifests.js';
import { muntaPlataforma } from './__fixtures__/munta.jsx';
import { TEMPS_LIMIT_DEL_COS, carregadorDelDocument, creaCarregadorDeModuls } from './carregaModul.js';
import { VERSIO_NUCLI } from './contracteNucli.js';
import { LazyRouteError } from './lazyRoute.js';
import { validaManifestApp } from './manifestApp.js';
import { creaRegistre } from './registreApps.js';
import RutaApps from './RutaApps.jsx';
import { useApp } from './index.js';

/* La versió és la del contracte: el carregador només admet el nucli d'esta pàgina (261016: l'1.2.0, amb la porta 'workspace';
   261024, T5: l'1.3.0, amb useServeiNoticies). */
const NUCLI_DE_PROVA = Object.freeze({ versio: VERSIO_NUCLI, marca: 'nucli de prova' });
const importaNucliDeProva = () => Promise.resolve({ NUCLI: NUCLI_DE_PROVA });
const manifestDe = (canvis) => validaManifestApp(manifestModulDeProva(canvis), { origen: 'modul' }).manifest;
const scriptsDelModul = () => [...document.querySelectorAll('script[data-sdp-modul]')];

/* El que faria el navegador: executa el script injectat (currentScript) i el
   cos crida lliuraCos. */
function executaComSiFora(script, accio) {
  Object.defineProperty(document, 'currentScript', { configurable: true, get: () => script });
  try {
    return accio();
  } finally {
    delete document.currentScript;
  }
}

/* Espera que el carregador haja injectat el script (després del nucli). No
   compta voltes del rellotge: el nucli real és un import() que tarda el que
   tarda, i sota càrrega una espera de 20 voltes hi anava en carrera (Onada 7,
   261009). Espera que el script aparega al document; si no arriba mai, la
   prova cau pel seu temps límit. */
function scriptInjectat() {
  const [ja] = scriptsDelModul();
  if (ja) return Promise.resolve(ja);
  return new Promise((resol) => {
    const observador = new MutationObserver(() => {
      const [script] = scriptsDelModul();
      if (!script) return;
      observador.disconnect();
      resol(script);
    });
    observador.observe(document, { childList: true, subtree: true });
    onTestFinished(() => observador.disconnect());
  });
}

function CosDeProva() {
  return <p>Cos del mòdul</p>;
}

afterEach(() => {
  cleanup();
  for (const script of scriptsDelModul()) script.remove();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('carregaCos · el camí bo', () => {
  test('demana el nucli una vegada, injecta el script del mateix origen amb integritat i espera el lliurament del seu script', async () => {
    const importaNucli = vi.fn(importaNucliDeProva);
    const carregador = creaCarregadorDeModuls({ importaNucli });
    expect(carregador.nucli()).toBeNull();
    const promesa = carregador.carregaCos(manifestDe());
    const script = await scriptInjectat();
    expect(importaNucli).toHaveBeenCalledTimes(1);
    expect(script.getAttribute('src')).toBe(`${window.location.origin}/moduls/llibreta/cos-Ab12Cd34.js`);
    expect(script.getAttribute('integrity')).toBe(INTEGRITAT_DE_PROVA);
    expect(script.getAttribute('crossorigin')).toBe('anonymous');
    expect(script.getAttribute('data-sdp-modul')).toBe('llibreta');
    expect(script.parentNode).toBe(document.head);
    expect(carregador.nucli()).toBe(NUCLI_DE_PROVA);

    const fabrica = vi.fn(() => CosDeProva);
    expect(executaComSiFora(script, () => carregador.lliuraCos('llibreta', fabrica))).toBe(true);
    expect(fabrica).toHaveBeenCalledWith(NUCLI_DE_PROVA);
    await expect(promesa).resolves.toEqual({ default: CosDeProva });
    /* El `load` que arriba després no canvia res, i un segon lliurament s'ignora. */
    script.dispatchEvent(new Event('load'));
    expect(executaComSiFora(script, () => carregador.lliuraCos('llibreta', fabrica))).toBe(false);
  });

  /* Onada 7 (261009) · el nucli tarda el que tarda: el script no s'injecta
     abans, i l'espera de la prova tampoc no es cansa. El nucli només arriba
     quan la prova el lliura: cap carrera amb el rellotge. */
  test('amb un nucli lent, el script no s’injecta fins que el nucli arriba', async () => {
    let lliuraNucli;
    const carregador = creaCarregadorDeModuls({ importaNucli: () => new Promise((resol) => { lliuraNucli = resol; }) });
    const promesa = carregador.carregaCos(manifestDe());
    const esperat = scriptInjectat();
    await new Promise((resol) => { setTimeout(resol, 50); });
    expect(scriptsDelModul()).toEqual([]);
    expect(carregador.nucli()).toBeNull();
    lliuraNucli({ NUCLI: NUCLI_DE_PROVA });
    const script = await esperat;
    expect(script.getAttribute('data-sdp-modul')).toBe('llibreta');
    expect(carregador.nucli()).toBe(NUCLI_DE_PROVA);
    expect(executaComSiFora(script, () => carregador.lliuraCos('llibreta', () => CosDeProva))).toBe(true);
    await expect(promesa).resolves.toEqual({ default: CosDeProva });
  });

  test('la mateixa promesa per al mateix id; oblida en fa una de nova', async () => {
    const carregador = creaCarregadorDeModuls({ importaNucli: importaNucliDeProva, tempsLimit: 20 });
    const manifest = manifestDe();
    const primera = carregador.carregaCos(manifest);
    expect(carregador.carregaCos(manifest)).toBe(primera);
    await expect(primera).rejects.toBeInstanceOf(LazyRouteError);
    carregador.oblida('llibreta');
    const segona = carregador.carregaCos(manifest);
    expect(segona).not.toBe(primera);
    await expect(segona).rejects.toBeInstanceOf(LazyRouteError);
  });

  test('amb estils, el cos es pinta amb el seu <link> d’estils dins del mateix arbre, amb integritat', async () => {
    const carregador = creaCarregadorDeModuls({ importaNucli: importaNucliDeProva });
    const promesa = carregador.carregaCos(manifestDe({ estils: { cami: '/moduls/llibreta/estils-Ab12Cd34.css', integrity: INTEGRITAT_DE_PROVA } }));
    const script = await scriptInjectat();
    executaComSiFora(script, () => carregador.lliuraCos('llibreta', () => CosDeProva));
    const { default: Component } = await promesa;
    const { container } = render(<Component />);
    const enllac = container.querySelector('link');
    expect(enllac.getAttribute('rel')).toBe('stylesheet');
    expect(enllac.getAttribute('href')).toBe(`${window.location.origin}/moduls/llibreta/estils-Ab12Cd34.css`);
    expect(enllac.getAttribute('integrity')).toBe(INTEGRITAT_DE_PROVA);
    expect(enllac.getAttribute('crossorigin')).toBe('anonymous');
    expect(screen.getByText('Cos del mòdul')).toBeTruthy();
  });

  /* L'importador per defecte, de veritat: el primer import() del nucli
     transforma tota la Pedra Seca que porta. Després, el mateix mòdul que
     importaria qualsevol altre, no una còpia. */
  test('el nucli real (nucliModuls.js) es carrega a soles, congelat i versionat', async () => {
    const carregador = creaCarregadorDeModuls();
    const promesa = carregador.carregaCos(manifestDe());
    const script = await scriptInjectat();
    /* Actualitzat a posta (261016): el nucli real és l'1.2.0, que afig la porta 'workspace'.
       Actualitzada a posta (261024 T5): ara l'1.3.0, que afig useServeiNoticies a la plataforma. */
    expect(carregador.nucli()).toMatchObject({ versio: '1.3.0' });
    expect(carregador.nucli().plataforma.useServeiNoticies).toBeTypeOf('function');
    expect(Object.keys(carregador.nucli().workspace).sort()).toEqual(['DefaultItemCard', 'UniversalWorkspace']);
    expect(Object.isFrozen(carregador.nucli())).toBe(true);
    expect(carregador.nucli()).toBe((await import('./nucliModuls.js')).NUCLI);
    expect(executaComSiFora(script, () => carregador.lliuraCos('llibreta', (nucli) => nucli.pedraSeca.Boto))).toBe(true);
    await expect(promesa).resolves.toMatchObject({ default: expect.any(Function) });
  }, 60000); // com a modulDeBuild.test.jsx: amb la suite sencera en paral·lel, importar el nucli passa dels 5 s

  test('el temps límit per defecte és de 2 minuts: només ha de tallar un fitxer penjat, no una baixada lenta', () => {
    expect(TEMPS_LIMIT_DEL_COS).toBe(120000);
  });
});

describe('carregaCos · el que no passa (LazyRouteError, mai una recàrrega)', () => {
  const carregaAmbFallada = async (canvis, provoca, opcions = {}) => {
    const carregador = creaCarregadorDeModuls({ importaNucli: importaNucliDeProva, tempsLimit: 50, ...opcions });
    const promesa = carregador.carregaCos(canvis === null ? manifestDe() : manifestDe(canvis));
    if (provoca) provoca(await scriptInjectat(), carregador);
    const error = await promesa.then(() => null, (motiu) => motiu);
    expect(error).toBeInstanceOf(LazyRouteError);
    return error;
  };

  test('un cos d’un altre origen no s’injecta mai, ni es demana el nucli', async () => {
    const importaNucli = vi.fn(importaNucliDeProva);
    const error = await carregaAmbFallada({ cos: { cami: 'https://cdn.invalid/cos.js', integrity: INTEGRITAT_DE_PROVA } }, null, { importaNucli });
    expect(error.cause.message).toContain('no és del mateix origen');
    expect(scriptsDelModul()).toEqual([]);
    expect(importaNucli).not.toHaveBeenCalled();
  });

  test('uns estils d’un altre origen, tampoc', async () => {
    const error = await carregaAmbFallada({ estils: { cami: 'https://cdn.invalid/estils.css', integrity: INTEGRITAT_DE_PROVA } });
    expect(error.cause.message).toContain('no és del mateix origen');
    expect(scriptsDelModul()).toEqual([]);
  });

  test('si el fitxer no baixa o no casa amb la integritat (error)', async () => {
    const error = await carregaAmbFallada(null, (script) => script.dispatchEvent(new Event('error')));
    expect(error.cause.message).toContain('no casa amb la seua integritat');
  });

  test('si s’executa sense lliurar el cos (load)', async () => {
    const error = await carregaAmbFallada(null, (script) => script.dispatchEvent(new Event('load')));
    expect(error.cause.message).toContain('sense cridar lliuraCos');
  });

  test('si no arriba a temps', async () => {
    const error = await carregaAmbFallada(null, null);
    expect(error.cause.message).toContain('no s’ha lliurat en 50 ms');
  });

  test.each([
    ['la fàbrica peta', () => { throw new Error('fàbrica trencada'); }, 'fàbrica trencada'],
    ['la fàbrica no és una funció', CosDeProva(), 'ha de ser una funció'],
    ['la fàbrica no torna cap component', () => 'text', 'no ha tornat cap component']
  ])('si %s', async (_que, fabrica, missatge) => {
    const lliura = (script, carregador) => executaComSiFora(script, () => carregador.lliuraCos('llibreta', fabrica));
    const error = await carregaAmbFallada(null, lliura);
    expect(error.cause.message).toContain(missatge);
  });

  /* Actualitzat a posta (261016): el missatge nomena la versió del contracte, ara l'1.2.0.
     Actualitzada a posta (261024 T5): ara l'1.3.0. */
  test('un nucli que no és el 1.3.0 congelat', async () => {
    const error = await carregaAmbFallada(null, null, { importaNucli: () => Promise.resolve({ NUCLI: { versio: VERSIO_NUCLI } }) });
    expect(error.cause.message).toContain('no és el 1.3.0 congelat');
  });

  /* Onada 7 (261009) · un nucli congelat d'una altra versió (l'1.0.0 d'abans) tampoc no passa.
     261016 · tampoc l'1.1.0, el d'abans de la porta 'workspace'. 261024 (T5) · tampoc l'1.2.0. */
  test.each(['1.0.0', '1.1.0', '1.2.0'])('un nucli congelat d’una altra versió (%s)', async (versio) => {
    const error = await carregaAmbFallada(null, null, { importaNucli: () => Promise.resolve({ NUCLI: Object.freeze({ versio }) }) });
    expect(error.cause.message).toContain('no és el 1.3.0 congelat');
  });

  test('una app que no és un mòdul', async () => {
    const carregador = creaCarregadorDeModuls({ importaNucli: importaNucliDeProva });
    await expect(carregador.carregaCos({ id: 'prova', origen: 'interna' })).rejects.toBeInstanceOf(LazyRouteError);
  });
});

describe('lliuraCos · només el script injectat, i només per a un id que es carrega', () => {
  test('un altre script, un id sense càrrega o sense document: s’ignora i la càrrega continua', async () => {
    const carregador = creaCarregadorDeModuls({ importaNucli: importaNucliDeProva });
    expect(carregador.lliuraCos('llibreta', () => CosDeProva)).toBe(false);
    const promesa = carregador.carregaCos(manifestDe());
    const script = await scriptInjectat();
    const intrus = document.createElement('script');
    expect(executaComSiFora(intrus, () => carregador.lliuraCos('llibreta', () => () => null))).toBe(false);
    expect(carregador.lliuraCos('llibreta', () => () => null)).toBe(false);
    expect(executaComSiFora(script, () => carregador.lliuraCos('altre', () => CosDeProva))).toBe(false);
    expect(executaComSiFora(script, () => carregador.lliuraCos('llibreta', () => CosDeProva))).toBe(true);
    await expect(promesa).resolves.toEqual({ default: CosDeProva });
    expect(creaCarregadorDeModuls({ finestra: undefined }).lliuraCos('llibreta', () => CosDeProva)).toBe(false);
  });

  test('el carregador de la pàgina no té cap càrrega en marxa ni nucli fins que algú obri un mòdul', () => {
    expect(carregadorDelDocument.nucli()).toBeNull();
    expect(carregadorDelDocument.lliuraCos('gestoria', () => CosDeProva)).toBe(false);
  });
});

/* De punta a punta amb la plataforma: /app/<id> d'un mòdul es pinta amb el
   cos que lliura el seu script, dins de ProveidorApp (useApp funciona). */
describe('un mòdul a /app/<id>', () => {
  function CosAmbApp() {
    const { manifest, ruta } = useApp();
    return <p>{`Mòdul ${manifest.id} a ${ruta('inici')}`}</p>;
  }

  test('s’obri amb el seu cos i la plataforma del nucli', async () => {
    const carregador = creaCarregadorDeModuls({ importaNucli: importaNucliDeProva });
    const registre = creaRegistre({ internes: [], carregador });
    expect(registre.registraModul(manifestModulDeProva()).ok).toBe(true);
    muntaPlataforma('/app/llibreta/inici', { registre });
    expect(screen.getByText('Carregant l’app…')).toBeTruthy();
    const script = await scriptInjectat();
    executaComSiFora(script, () => carregador.lliuraCos('llibreta', () => CosAmbApp));
    expect(await screen.findByText('Mòdul llibreta a /app/llibreta/inici')).toBeTruthy();
    expect(document.querySelector('.sdp-app-contenidor').getAttribute('data-sdp-app')).toBe('llibreta');
  });

  test('si el cos no arriba, la ruta ho explica (RouteErrorBoundary) i no es recarrega res', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    /* React en desenvolupament també avisa la finestra de l'error capturat: jsdom el pintaria. */
    const silencia = (event) => event.preventDefault();
    window.addEventListener('error', silencia);
    onTestFinished(() => window.removeEventListener('error', silencia));
    const carregador = creaCarregadorDeModuls({ importaNucli: importaNucliDeProva, tempsLimit: 30 });
    const registre = creaRegistre({ internes: [], carregador });
    registre.registraModul(manifestModulDeProva());
    muntaPlataforma('/app/llibreta/inici', {
      registre,
      fills: (
        <RouteErrorBoundary resetKey="/app/llibreta/inici" externalConfig={{}} enLinia mostraDetall={false}>
          <Routes>
            <Route path="/app/*" element={<RutaApps />} />
          </Routes>
        </RouteErrorBoundary>
      )
    });
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Torna a obrir el mòdul des de la pàgina que l’allotja.')).toBeTruthy();
  });
});
