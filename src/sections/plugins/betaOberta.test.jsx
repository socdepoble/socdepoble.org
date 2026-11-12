/**
 * betaOberta.test.jsx — R18 · T2 (P0-101; prompt 261111_0148, encàrrec T2) ·
 * La insígnia honesta «En proves · Beta oberta».
 *
 * Una eina del registre en proves (`estat` 'proves', registrePlugins.js) pinta
 * la mateixa insígnia a la seua targeta del Panell (ControlSection.jsx) i a la
 * seua pàgina (PluginPage.jsx), en la llengua de la interfície i darrere de
 * les dues etiquetes del registre: <li class="sp-card-label
 * sdp-insignia-beta-oberta">, sense enllaç. Una eina estable no la pinta, i el
 * registre continua amb exactament dues etiquetes per plugin.
 * Tractor-promesa: la insígnia no promet cap còpia al servidor ni cap
 * sincronització, i només la pot portar una eina que es pot obrir en
 * producció.
 *
 * P0-113 (ordre del Mestre, 261111: «ENCÉN en producció TPV del Bar, Rebost
 * Domèstic, Salut, Lector RSS i Gestoria … i insígnia «En proves · Beta
 * oberta» (`estat: 'proves'` a `registrePlugins.js`) … deixant només Arbre
 * Genealògic en obres») · Ara amb el REGISTRE DE VERES: les cinc eines amb app
 * porten la insígnia a la targeta del Panell i a la pàgina, en ca i en es;
 * l'Arbre Genealògic no. I la promesa es comprova: en un node de producció,
 * la pàgina de cada eina en proves porta el seu «Obrir…» de veres.
 * DEROGAT «la taula de prova» (vi.mock de registrePlugins.js, amb només el
 * Rebost marcat en proves): ja no cal, el registre real ja en porta cinc.
 *
 * R19 · T3 (ordre del Mestre, 261111; pla 261111_1720: «encesa de
 * /app/genealogia a registrePlugins.js») · L'Arbre Genealògic s'encén i va en
 * proves: totes les targetes de plugin del Panell porten ara la insígnia, i
 * cap targeta estable hi queda. La prova «l'eina estable no la porta»
 * conserva la intenció amb les pàgines estables del registre (Mapa, Vehicle
 * Compartit i Animalets, que no tenen targeta de plugin al Panell). DEROGAT
 * «deixant només Arbre Genealògic en obres» i ESTABLES_AL_PANELL
 * ['genealogia'].
 *
 * Les dues superfícies es munten amb la UniversalPage i la UniversalCard de
 * veres i amb el UIProvider real (la llengua ix d'externalConfig.language,
 * com a PluginPage.test.jsx). Només se substituïx l'eixida segura del Panell,
 * que necessitaria la sessió (com a ControlSection.test.jsx).
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { _reiniciaPortades, CLAU_PORTADES } from '../../components/universal/UniversalPage.jsx';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import { _reiniciaPreferencies, CLAU_PREFERENCIES } from '../../apps/plataforma/preferenciesApps.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { CLAU_UTILITATS_ACTIVES } from '../profile/utilitatsActives.js';
import ControlSection from '../control/ControlSection.jsx';
import PluginPage from './PluginPage.jsx';
import {
  CLASSE_BETA_OBERTA, ESTAT_PROVES, PLUGINS, TEXTOS_BETA_OBERTA, etiquetesAmbEstat, pluginPerId
} from './registrePlugins.js';

vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: () => ({ demana: vi.fn(), ocupat: false, avis: null, error: null })
}));

/* Un node on tot el que és compilat està encés (com el servidor de dev). */
const ENTORN_OBERT = Object.freeze({ produccio: false, teCapacitat: () => true, amaDelDocument: true });
/* P0-113 · Un node de producció, amb l'App ama del document (sense iframe ni WordPress): el que
   veu qui obri la web pròpia de Sóc de Poble. */
const ENTORN_PRODUCCIO = Object.freeze({ produccio: true, teCapacitat: () => true, amaDelDocument: true });
const EN_PROVES = PLUGINS.filter((plugin) => plugin.estat === ESTAT_PROVES);
/* Els estables que tenen targeta de plugin al Panell (data i etiquetes, Onada 10): des de R19 · T3,
   cap. Abans de R19, l'Arbre Genealògic (en obres). */
const ESTABLES_AL_PANELL = PLUGINS.filter((plugin) => plugin.data !== null && plugin.estat !== ESTAT_PROVES).map((plugin) => plugin.id);
/* Els estables del registre, amb pàgina i sense targeta de plugin al Panell (W4-08: viuen dalt). */
const ESTABLES = PLUGINS.filter((plugin) => plugin.estat !== ESTAT_PROVES).map((plugin) => plugin.id);
const LLENGUES = ['ca', 'es'];

const netejaPreferencies = () => {
  for (const clau of [CLAU_PORTADES, CLAU_UTILITATS_ACTIVES, CLAU_PREFERENCIES]) window.localStorage.removeItem(STORAGE_PREFIX + clau);
  window.localStorage.removeItem('sdp_utilitats_actives');
  _reiniciaPortades();
  _reiniciaPreferencies();
};

function munta(ruta, language, entorn = ENTORN_OBERT) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  return render(
    <UIProvider externalConfig={{ language, dataMode: 'seed' }}>
      <NotificationProvider>
        <XatSocDePobleContext.Provider value={null}>
          <MemoryRouter rutaInicial={ruta}>
            <ProveidorPlataforma entorn={entorn}>
              <Routes>
                <Route path="/control" element={<ControlSection />} />
                <Route path="/plugin/:id" element={<PluginPage />} />
              </Routes>
            </ProveidorPlataforma>
          </MemoryRouter>
        </XatSocDePobleContext.Provider>
      </NotificationProvider>
    </UIProvider>
  );
}

/* Les etiquetes d'una llista (targeta o pàgina): [text, classe]. */
const etiquetesDe = (llista) => [...(llista?.children ?? [])].map((li) => [li.textContent, li.className]);
const esperades = (plugin, llengua) => etiquetesAmbEstat(plugin, llengua).map(({ text, className }) => [text, `sp-card-label ${className}`]);
const targetaDelPanell = (container, id) => container.querySelector(`article.sp-card[data-testid="control-plugin-${id}"]`);
const insigniesDe = (arrel) => [...arrel.querySelectorAll(`.${CLASSE_BETA_OBERTA}`)];

beforeEach(netejaPreferencies);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  netejaPreferencies();
});

describe('P0-113 · el registre de veres', () => {
  /* P0-114 (ordre del Mestre, 261111: «estat: ESTAT_PROVES («En proves · Beta oberta»)») · I
     L'Avisador, que s'obri ara en producció (la seua pàgina) i guarda els ajustos al dispositiu. */
  /* R19 · T3 (261111) · I l'Arbre Genealògic, encés. Abans: «l'Arbre Genealògic, no». */
  test('les sis eines amb app i L’Avisador, en proves; cap targeta del Panell estable; i cada plugin continua amb exactament dues etiquetes', () => {
    expect(EN_PROVES.map((plugin) => plugin.id)).toEqual(['gestoria', 'tpv', 'rebost', 'salut', 'genealogia', 'avisador', 'rss']);
    expect(pluginPerId('genealogia').estat).toBe(ESTAT_PROVES);
    expect(ESTABLES_AL_PANELL).toEqual([]);
    expect(ESTABLES).toEqual(['mapa', 'vehicle', 'animalets']);
    for (const plugin of PLUGINS) {
      const esperat = plugin.data === null ? 0 : 2;
      expect([plugin.id, plugin.etiquetes.length]).toEqual([plugin.id, esperat]);
      expect([plugin.id, plugin.etiquetes.some((etiqueta) => etiqueta.className === CLASSE_BETA_OBERTA)]).toEqual([plugin.id, false]);
    }
  });

  /* Tractor-promesa · La insígnia no pot dir «sincronitzat», «al núvol», «servidor» ni «còpia»: on
     les dades només viuen al dispositiu, cap paraula pot prometre el contrari. I l'entradilla de
     cada eina en proves diu que està en proves i on es guarden les dades. */
  test('tractor-promesa · cap text de la insígnia promet servidor ni sincronització; l’entradilla diu en proves i al dispositiu', () => {
    const PROMESA = /sincron|n[úu]vol|servidor|server|nube|copia|còpia|backup|cloud|hodei|zerbitzari|sincroniz/i;
    expect(Object.values(TEXTOS_BETA_OBERTA).filter((text) => PROMESA.test(text))).toEqual([]);
    for (const plugin of EN_PROVES) {
      expect([plugin.id, /en proves/.test(plugin.entradilla), /en este dispositiu/.test(plugin.entradilla), PROMESA.test(plugin.entradilla)])
        .toEqual([plugin.id, true, true, false]);
    }
  });
});

describe.each(LLENGUES)('R18 · T2 i P0-113 · amb la interfície en %s', (llengua) => {
  test('la targeta del Panell de cada eina en proves porta la insígnia, darrere de les dues del registre i sense enllaç', () => {
    const { container } = munta('/control', llengua);
    for (const plugin of EN_PROVES) {
      const targeta = targetaDelPanell(container, plugin.id);
      expect(targeta, plugin.id).not.toBeNull();
      const llista = targeta.querySelector('.sp-card-body > ul.sp-card-labels');
      expect(etiquetesDe(llista), plugin.id).toEqual(esperades(plugin, llengua));
      expect(etiquetesDe(llista).at(-1), plugin.id).toEqual([TEXTOS_BETA_OBERTA[llengua], `sp-card-label ${CLASSE_BETA_OBERTA}`]);
      expect(etiquetesDe(llista).slice(0, 2), plugin.id)
        .toEqual(plugin.etiquetes.map(({ text, className }) => [text, `sp-card-label ${className}`]));
      expect(insigniesDe(targeta).map((li) => li.tagName), plugin.id).toEqual(['LI']);
      expect(llista.querySelector('a, button'), plugin.id).toBeNull();
    }
  });

  /* R19 · T3 (261111) · Cap targeta de plugin estable al Panell: cada una porta la insígnia, i en tot
     el Panell n'hi ha una per eina en proves i cap més. Abans: «l'Arbre Genealògic (en obres) no
     porta la insígnia al Panell». */
  test('cada targeta de plugin del Panell és d’una eina en proves; en tot el Panell, una insígnia per eina en proves', () => {
    const { container } = munta('/control', llengua);
    const targetes = [...container.querySelectorAll('article.sp-card[data-testid^="control-plugin-"]')];
    expect(targetes.map((targeta) => targeta.dataset.testid.slice('control-plugin-'.length)).sort())
      .toEqual(EN_PROVES.map((plugin) => plugin.id).sort());
    for (const targeta of targetes) expect(insigniesDe(targeta), targeta.dataset.testid).toHaveLength(1);
    // En tot el Panell, una insígnia per cada eina en proves i cap més.
    expect(insigniesDe(container)).toHaveLength(EN_PROVES.length);
    expect(screen.getAllByText(TEXTOS_BETA_OBERTA[llengua])).toHaveLength(EN_PROVES.length);
  });

  test('la pàgina de cada eina en proves diu el mateix que la seua targeta', () => {
    for (const plugin of EN_PROVES) {
      const { container } = munta(`/plugin/${plugin.id}`, llengua);
      const llista = container.querySelector('header.page-title ul.page-title-labels');
      expect(etiquetesDe(llista), plugin.id).toEqual(esperades(plugin, llengua));
      expect(etiquetesDe(llista).at(-1), plugin.id).toEqual([TEXTOS_BETA_OBERTA[llengua], `sp-card-label ${CLASSE_BETA_OBERTA}`]);
      expect(insigniesDe(container), plugin.id).toHaveLength(1);
      expect(llista.querySelector('a, button'), plugin.id).toBeNull();
      cleanup();
      // La mateixa llista que la targeta del Panell, en la mateixa llengua.
      const panell = munta('/control', llengua).container;
      expect(etiquetesDe(targetaDelPanell(panell, plugin.id).querySelector('.sp-card-body > ul.sp-card-labels')), plugin.id)
        .toEqual(esperades(plugin, llengua));
      cleanup();
    }
  });

  /* R19 · T3 (261111) · La intenció es conserva amb les eines estables que encara existixen: la seua
     pàgina no porta cap insígnia. Abans: «la pàgina de l'Arbre Genealògic (en obres)». */
  test('la pàgina d’una eina estable (Mapa, Vehicle Compartit, Animalets) no porta la insígnia', () => {
    for (const id of ESTABLES) {
      const { container } = munta(`/plugin/${id}`, llengua);
      expect(container.querySelector('header.page-title'), id).not.toBeNull();
      expect(insigniesDe(container), id).toEqual([]);
      expect(etiquetesAmbEstat(pluginPerId(id), llengua), id).toBe(pluginPerId(id).etiquetes);
      cleanup();
    }
  });

  /* Tractor-promesa · «Beta oberta» vol dir que s'obri ara: en un node de producció (App ama del
     document), cada eina en proves porta el seu «Obrir…» cap a la seua app, i cap avís de no
     disponible. */
  test('en producció, la pàgina de cada eina en proves s’obri de veres: el seu «Obrir…» porta a l’app', () => {
    for (const plugin of EN_PROVES) {
      const { container } = munta(`/plugin/${plugin.id}`, llengua, ENTORN_PRODUCCIO);
      const enllacos = [...container.querySelectorAll('.sdp-pagina-accio a[href]')];
      expect(enllacos.map((enllac) => enllac.getAttribute('href')), plugin.id).toEqual([plugin.obrir]);
      expect(screen.queryByRole('status'), plugin.id).toBeNull();
      expect(insigniesDe(container), plugin.id).toHaveLength(1);
      cleanup();
    }
  });
});
