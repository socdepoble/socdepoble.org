/**
 * P7-A · Onada 4, setena passada · La pàgina de cada plugin (/plugin/:id):
 * una UniversalPage amb la il·lustració de portada (plegable), el títol, el
 * subtítol i l'entradilla del registre, signada per Sóc de Poble, i al final
 * el gran botó blau «Obrir …». Amb destí, un enllaç del router (amb la base de
 * l'amfitrió); sense destí, o amb una app apagada en este build, un botó
 * inert que ho diu (aria-disabled, avís en text i toast) i no navega mai.
 * Un id desconegut és la 404 de sempre (NotFoundPage).
 *
 * Gauntlet 261022_0225 (F1, F2, F4, F6, F7) · DEROGAT, per a les eines amb
 * app de la plataforma, «sense destí, un botó inert»: la Gestoria, el
 * Rebost, Salut, el Lector RSS i el TPV que ací no es poden obrir no pinten
 * cap «Obrir…» (ni dalt ni baix). Baix hi ha el camí que li queda a la
 * persona (cap instal·lació: no n'hi ha cap mecanisme) i «Desactiva esta
 * eina», que només escriu la preferència del Panell. Els textos, en les cinc
 * llengües. Les eines en obres (Mapa, Vehicle, Animalets) conserven el botó
 * inert.
 *
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
 *   · M4 · La pàgina diu el mateix que la targeta canònica: si el plugin
 *     porta `data`, la barra taronja en pinta la data i l'hora; si porta
 *     `etiquetes`, van davall de l'H1. El Rebost i Salut porten, a més, sis
 *     blocs de presentació entre l'entradilla i el botó: des de l'ordre del
 *     Mestre (261021, prompt 261021_0015, tasca 6; pla §7.3), un títol H3 i
 *     el seu paràgraf cada un.
 *   · M2 · El Rebost i Salut porten el botó «Obrir…» DALT I AL FINAL: un dins
 *     del bloc blanc de l'H1 (header.page-title > .page-title-accio) i un
 *     dins de .sdp-pagina-accio, l'últim fill de l'article. DEROGAT per a
 *     elles «un sol control Obrir per pàgina»: les consultes de coincidència
 *     única passen a demanar-ne exactament DOS (elsDosControls) i comproven
 *     el mateix que abans (destí, estat inert, avís) als dos. La resta de
 *     plugins conserva un sol botó, baix.
 *
 * Router en memòria i plataforma de veres (ProveidorPlataforma amb un entorn
 * fixat). Les proves són fora de L2 (tractor-persistencia).
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { CLAU_PORTADES, _reiniciaPortades } from '../../components/universal/UniversalPage.jsx';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import { _reiniciaPreferencies, CLAU_PREFERENCIES } from '../../apps/plataforma/preferenciesApps.js';
import { creaRegistre, MANIFESTS_INTERNS } from '../../apps/plataforma/registreApps.js';
import { baseRecursos, fixaBaseRecursos } from '../../config/assetResolver';
import { createTranslator, SUPPORTED_LANGUAGES } from '../../config/i18n';
import { desaUtilitatActiva, estaAlPanell, CLAU_UTILITATS_ACTIVES } from '../profile/utilitatsActives.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { textDelMotiu } from '../../apps/plataforma/PortalApps.jsx';
import PluginPage, { TEXTOS_EINA } from './PluginPage.jsx';
import { PRESENTACIO_PLUGINS, presentacioDelPlugin } from './presentacioPlugins.js';
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

function munta(ruta, opcions = {}) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  return render(arbre(ruta, opcions));
}

/* L'arbre de munta, a banda: una prova el pot tornar a pintar amb un altre
   entorn (rerender) sense desmuntar la pàgina. */
function arbre(ruta, { entorn = ENTORN_OBERT, basename = '', externalConfig = {}, registre } = {}) {
  return (
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
/* Onada 10 (M2) · El botó de dalt: dins del bloc blanc de l'H1, la ranura
   accioPrincipal d'UniversalPage. */
const accioDeDalt = (container) => container.querySelector('header.page-title > .page-title-accio');
const article = (container) => container.querySelector('article.content-wrapper');

/* Gauntlet 261022_0225 (F7) · Els textos en valencià que llig la persona,
   escrits ací a mà a posta: si algú els canvia, estes proves ho diuen. */
const MOTIU = Object.freeze({
  entorn: 'Esta eina encara està en proves i no està a punt per a tothom.',
  noCompilada: 'Esta web encara no té esta eina.',
  personaApagada: 'L’has desactivada tu. La pots tornar a activar quan vulgues.'
});
const CAMI = Object.freeze({
  posar: 'Tu no has d’instal·lar ni baixar res. Esta eina només la pot afegir qui porta esta web, quan estiga a punt. Llavors, ací mateix tindràs el botó per a obrir-la.',
  demanar: 'Tu no has d’instal·lar ni pagar res. Només la pot posar en marxa qui porta esta web: si la vols fer servir, demana-li-ho.'
});
const NOTA = Object.freeze({
  activa: 'Desactivar-la només la trau del teu Panell, en este navegador. No s’esborra res del que hi tingues.',
  desactivada: 'Està desactivada per a tu, només en este navegador. Si la tornes a activar, tornarà al teu Panell.',
  apagada: 'L’has desactivada a la llista d’eines, només en este navegador. Si la tornes a activar, la podràs tornar a obrir ací quan esta web la tinga.'
});
/* Els motius d'interruptors.js (avaluaApp), tots: cada un té el seu text. */
const MOTIUS = ['no-compilada', 'entorn-desenvolupament', 'amfitrio-no-la-declara', 'apagada-per-defecte', 'persona-apagada',
  'sense-capacitat', 'document-no-propi', 'document-no-propi-financeres', 'sense-dret'];
const DESACTIVA = 'Desactiva esta eina';
const REACTIVA = 'Torna a activar esta eina';
/* Cap paraula de la troballa F7 en l'estat buit: ni «node», ni «app», ni
   instal·lar amb un clic, ni paquets ni versions. */
const JARGO = /\bnode\b|\bapps?\b|amfitri|premium|desenvolupament|\bcodi\b|paquet|versió compatible|amb un clic/i;
/* Les preferències de la plataforma (el portal /app), tal com queden desades. */
const appsDesades = () => JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + CLAU_PREFERENCIES) || '{"apps":{}}').apps;

/* Onada 10 · Els plugins amb presentació (el Rebost i Salut) i la resta,
   derivats de les dades i no escrits a mà. */
const AMB_PRESENTACIO = PLUGINS.filter((p) => presentacioDelPlugin(p.id) !== null);
const SENSE_PRESENTACIO = PLUGINS.filter((p) => presentacioDelPlugin(p.id) === null);
/* El text pla de cada element de la presentació (un per línia: el títol H3 i
   el seu paràgraf), sense les marques. */
const liniesDe = (id) => presentacioDelPlugin(id).split('\n').map((linia) => linia.replace(/<[^>]+>/g, ''));
/* Només els títols H3 de la presentació, en ordre (261021, tasca 6). */
const titolsDe = (id) => presentacioDelPlugin(id).split('\n')
  .filter((linia) => linia.startsWith('<h3>'))
  .map((linia) => linia.replace(/<[^>]+>/g, ''));
/* Els controls grans de la pàgina que comencen pel nom del botó, siguen enllaç o botó. */
const controlsObrir = (container, plugin) => [...container.querySelectorAll('a, button')]
  .filter((el) => el.textContent.startsWith(plugin.etiquetaObrir));

/* Onada 10 (M2) · Els DOS controls «Obrir…» d'una pàgina amb presentació:
   exactament dos amb eixe rol i eixe nom, el de dalt dins del bloc blanc de
   l'H1 i el de baix dins de .sdp-pagina-accio. Substituïx la consulta de
   coincidència única d'abans sense afluixar-la: ni un de més, ni un de menys,
   i cada un al seu lloc. */
function elsDosControls(container, rol, nom) {
  const controls = screen.getAllByRole(rol, { name: nom });
  expect(controls).toHaveLength(2);
  const [dalt, baix] = controls;
  expect(dalt.parentElement).toBe(accioDeDalt(container));
  expect(baix.parentElement).toBe(accio(container));
  return { dalt, baix };
}

beforeEach(() => {
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PORTADES);
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_UTILITATS_ACTIVES);
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PREFERENCIES);
  _reiniciaPortades();
  _reiniciaPreferencies();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PORTADES);
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_UTILITATS_ACTIVES);
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
    // Gauntlet 261016 (Bloc 1, Llei del Quadrat) · la portada del TPV és la vinyeta nova en WebP.
    /* Expectativa actualitzada a propòsit (ordre del Mestre, 261021, torn fase
       2, Mòdul B, P0-14) · Les del Mapa, Vehicle, Animalets, el Rebost i Salut
       també són WebP: el seu original .jpg ix de public/ i la bessona, amb les
       mateixes mides, és la portada. Abans: només la del TPV. */
    const enWebp = ['mapa', 'vehicle', 'animalets', 'rebost', 'salut', 'tpv'].includes(id);
    expect(portada.getAttribute('src')).toBe(`/assets/ui/plugins/${id}_vinyeta.${enWebp ? 'webp' : 'jpg'}`);
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

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   Targeta i pàgina diuen el mateix (ordre del Mestre, 261001): la data i les
   etiquetes que el registre dona a la targeta canònica del Panell són les
   que pinta la pàgina. DEROGAT, per als plugins que en porten, «sense
   etiquetes» i «sense data» d'esta pàgina. */
describe('Onada 10 · la pàgina porta la data i les etiquetes de la targeta', () => {
  const AMB_DATA = PLUGINS.filter((p) => p.data !== null);
  const SENSE_DATA = PLUGINS.filter((p) => p.data === null);

  test('el cens: cinc amb data i etiquetes (Gestoria, Rebost, Salut, Lector RSS i TPV); tres sense', () => {
    expect(AMB_DATA.map((p) => p.id)).toEqual(['gestoria', 'rebost', 'salut', 'rss', 'tpv']);
    expect(SENSE_DATA.map((p) => p.id)).toEqual(['mapa', 'vehicle', 'animalets']);
    expect(PLUGINS.filter((p) => p.etiquetes.length > 0)).toEqual(AMB_DATA);
  });

  test.each(AMB_DATA.map((p) => [p.id, p]))('/plugin/%s: la barra taronja pinta la data i l’hora del registre', (id, plugin) => {
    const { container } = munta(`/plugin/${id}`);
    const pastilles = container.querySelectorAll('section.bar-orange .btn-date-time');
    expect(pastilles).toHaveLength(1);
    // El mateix lector que la targeta (dataHoraDeBarra): mateixa hora i mateix dia.
    const { time, date } = dataHoraDeBarra({ creat: plugin.data });
    expect([time, date]).toEqual(['00:15', '04/10/26']);
    expect([...pastilles[0].querySelectorAll('span')].map((span) => span.textContent)).toEqual([time, date]);
    // Com la de la targeta, la pastilla porta al Calendari.
    fireEvent.click(pastilles[0]);
    expect(ubicacio()).toBe('/calendari');
  });

  test.each(AMB_DATA.map((p) => [p.id, p]))('/plugin/%s: la Categoria i l’Etiqueta del registre, davall de l’H1 i sense enllaç', (id, plugin) => {
    const { container } = munta(`/plugin/${id}`);
    const llista = container.querySelector('header.page-title ul.page-title-labels');
    expect(container.querySelector('header.page-title h1').nextElementSibling).toBe(llista);
    expect([...llista.children].map((li) => [li.textContent, li.className])).toEqual(
      plugin.etiquetes.map((etiqueta) => [etiqueta.text, `sp-card-label ${etiqueta.className}`])
    );
    expect([...llista.children].map((li) => li.className.split(' ')[1])).toEqual(['sdp-badge-category', 'sdp-badge-tag']);
    expect(llista.querySelector('a, button')).toBeNull();
    // I el copyright continua tancant el bloc blanc.
    expect(container.querySelector('header.page-title').lastElementChild.className).toBe('sp-card-copyright page-title-copyright');
  });

  test.each(SENSE_DATA.map((p) => [p.id]))('/plugin/%s: sense data ni etiquetes al registre, la pàgina queda com abans (cap pastilla, cap píndola)', (id) => {
    const { container } = munta(`/plugin/${id}`);
    expect(container.querySelector('section.bar-orange')).not.toBeNull();
    expect(container.querySelector('.btn-date-time')).toBeNull();
    expect(container.querySelector('.page-title-labels')).toBeNull();
    expect(container.querySelector('header.page-title .sp-card-label')).toBeNull();
  });
});

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4 i
   M2) · El Rebost i Salut: sis blocs de presentació (un H3 i el seu
   paràgraf, des del 261021) entre l'entradilla i el botó, i el botó
   «Obrir…» dalt i al final. La resta de plugins, el DOM de l'article d'abans
   amb un sol botó. */
describe('Onada 10 · presentació de sis blocs i botó dalt i al final (Rebost i Salut)', () => {
  test('el cens: només el Rebost i Salut tenen presentació', () => {
    expect(AMB_PRESENTACIO.map((p) => p.id)).toEqual(['gestoria', 'rebost', 'salut', 'rss']);
    expect(Object.keys(PRESENTACIO_PLUGINS)).toEqual(['rebost', 'salut', 'gestoria', 'rss']);
    expect(SENSE_PRESENTACIO.map((p) => p.id)).toEqual(['mapa', 'vehicle', 'animalets', 'tpv']);
  });

  test.each(AMB_PRESENTACIO.map((p) => [p.id, p]))('/plugin/%s: el cos de sis blocs, un H3 i el seu paràgraf, entre l’entradilla i l’acció', (id, plugin) => {
    const { container } = munta(`/plugin/${id}`);
    // L'article, de dalt a baix: l'H2 i l'entradilla, el cos i el botó. Cap avís: ací es pot obrir.
    expect([...article(container).children].map((fill) => fill.className)).toEqual(['page-intro', 'cms-preview', 'sdp-pagina-accio']);
    const cos = article(container).querySelector(':scope > article.cms-preview');
    expect(cos.previousElementSibling).toBe(container.querySelector('.page-intro'));
    expect(cos.nextElementSibling).toBe(accio(container));
    // Sis blocs, fills directes: un <h3> i el seu <p>, amb el text literal de la presentació.
    expect([...cos.children].map((fill) => fill.tagName)).toEqual(Array.from({ length: 12 }, (_, index) => (index % 2 ? 'P' : 'H3')));
    expect([...cos.children].map((fill) => fill.textContent)).toEqual(liniesDe(id));
    // Ordre del Mestre (261021, prompt 261021_0015, tasca 6) · Títols H3, paràgrafs i negretes: cap altre
    // encapçalament (l'H1 i l'H2 són els del registre), cap enllaç, cap imatge.
    expect(cos.querySelector('h1, h2, h4, h5, h6, a, img, button')).toBeNull();
    expect(within(cos).getAllByRole('heading', { level: 3 }).map((titol) => titol.textContent)).toEqual(titolsDe(id));
    // L'escala de l'article, sense salts: l'H2 del registre i, davall, els sis H3 del cos.
    expect([...article(container).querySelectorAll('h1, h2, h3, h4, h5, h6')].map((titol) => titol.tagName))
      .toEqual(['H2', ...Array(6).fill('H3')]);
    expect(cos.querySelectorAll('strong').length).toBe(presentacioDelPlugin(id).split('<strong>').length - 1);
    // L'entradilla curta continua sent l'entradilla: la presentació no la substituïx.
    expect(container.querySelector('.page-intro .lead').textContent).toBe(plugin.entradilla);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelectorAll('h2')).toHaveLength(1);
  });

  test.each(AMB_PRESENTACIO.map((p) => [p.id, p]))('/plugin/%s: dos controls «Obrir…», el de dalt dins del bloc blanc de l’H1 i el de baix al final', (id, plugin) => {
    const { container } = munta(`/plugin/${id}`);
    expect(controlsObrir(container, plugin)).toHaveLength(2);
    const { dalt, baix } = elsDosControls(container, 'link', plugin.etiquetaObrir);
    // La mateixa porta: mateix destí, mateix text i la mateixa classe (el gran botó blau).
    expect([dalt.getAttribute('href'), baix.getAttribute('href')]).toEqual([plugin.obrir, plugin.obrir]);
    expect(dalt.textContent).toBe(baix.textContent);
    expect([dalt.className, baix.className]).toEqual(Array(2).fill('sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple'));
    // Dalt: dins de header.page-title, després de l'H1 i de les etiquetes i abans del copyright.
    const capcalera = container.querySelector('header.page-title');
    expect(accioDeDalt(container).parentElement).toBe(capcalera);
    expect(accioDeDalt(container).previousElementSibling).toBe(capcalera.querySelector('ul.page-title-labels'));
    expect(accioDeDalt(container).nextElementSibling).toBe(capcalera.querySelector('p.page-title-copyright'));
    expect(accioDeDalt(container).children).toHaveLength(1);
    // Baix: l'últim fill de l'article, després dels sis blocs.
    expect(article(container).lastElementChild).toBe(accio(container));
    expect(accio(container).children).toHaveLength(1);
    expect(container.querySelectorAll('.page-title-accio, .sdp-pagina-accio')).toHaveLength(2);
  });

  /* Gauntlet 261022_0225 (F2) · DEROGAT «si el destí no es pot obrir, tots
     dos són inerts» (M2): sense destí, cap «Obrir…», ni dalt ni baix. L'avís
     en text es diu una sola vegada, entre el cos i l'acció, i baix hi ha
     l'estat buit: el camí i «Desactiva esta eina». */
  test.each(AMB_PRESENTACIO.map((p) => [p.id, p]))('/plugin/%s en producció: cap «Obrir…», un sol avís entre el cos i l’acció, i l’estat buit baix', (id, plugin) => {
    const { container } = munta(`/plugin/${id}`, { entorn: ENTORN_PRODUCCIO });
    expect(screen.queryByRole('link', { name: new RegExp(plugin.etiquetaObrir) })).toBeNull();
    expect(controlsObrir(container, plugin)).toEqual([]);
    expect(accioDeDalt(container)).toBeNull();
    const avis = screen.getByRole('status');
    expect(avis.textContent).toBe(MOTIU.entorn);
    // L'ordre de l'article: entradilla, cos, avís i acció.
    const fills = [...article(container).children];
    expect(fills).toHaveLength(4);
    expect([fills[0].className, fills[1].className, fills[3].className]).toEqual(['page-intro', 'cms-preview', 'sdp-pagina-accio']);
    expect(fills[2] === avis || fills[2].contains(avis)).toBe(true);
    expect(fills[1].querySelectorAll(':scope > p')).toHaveLength(6);
    // Baix: el camí (qui la pot posar), «Desactiva esta eina» i què fa.
    expect(within(accio(container)).getByText(CAMI.posar)).toBeTruthy();
    expect(within(accio(container)).getByRole('button', { name: DESACTIVA })).toBeTruthy();
    expect(within(accio(container)).getByText(NOTA.activa)).toBeTruthy();
    expect(accio(container).querySelector('[aria-disabled="true"]')).toBeNull();
  });

  /* Llei del Píxel: la decisió M2 només nomena el Rebost i Salut. La resta
     conserva el DOM de l'article d'abans: cap cos, cap botó dalt i un sol
     control «Obrir…», baix. */
  test.each(SENSE_PRESENTACIO.map((p) => [p.id, p]))('/plugin/%s: sense presentació, un sol botó (baix), cap botó dalt i cap cos', (id, plugin) => {
    const { container } = munta(`/plugin/${id}`);
    expect(accioDeDalt(container)).toBeNull();
    expect(container.querySelector('.page-title-accio')).toBeNull();
    expect(container.querySelector('.cms-preview')).toBeNull();
    expect(controlsObrir(container, plugin)).toEqual([accio(container).firstElementChild]);
    // L'article d'abans: l'entradilla, l'avís si està en obres, i l'acció.
    const fills = [...article(container).children];
    const enObres = plugin.obrir === null;
    expect(fills).toHaveLength(enObres ? 3 : 2);
    expect(fills[0].className).toBe('page-intro');
    expect(fills[fills.length - 1]).toBe(accio(container));
    if (enObres) expect(fills[1].textContent).toBe('Esta eina encara està en obres.');
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
     és un plugin.
     Onada 10 (decisió M2 del Mestre, 261010) · El Rebost porta el botó dalt i
     al final: la prova demana exactament els dos i comprova que cada un obri
     la mateixa entrada (una muntada per clic: el clic ix de la pàgina). */
  test.each([['dalt'], ['baix']])('el Rebost obri l’entrada «A casa» de la Nevera, amb el botó de %s', (quin) => {
    const { container } = munta('/plugin/rebost');
    const enllac = elsDosControls(container, 'link', 'Obrir el Rebost')[quin];
    expect(enllac.getAttribute('href')).toBe('/app/nevera/casa');
    fireEvent.click(enllac);
    expect(ubicacio()).toBe('/app/nevera/casa');
  });

  /* Onada 10 (M2) · Salut també en porta dos: tots dos amb la base de
     l'amfitrió a l'href i tots dos pel router. */
  test.each([['dalt'], ['baix']])('amb la base de l’amfitrió (WordPress), l’href la porta i el clic navega dins del router (botó de %s)', (quin) => {
    const { container } = munta('/plugin/salut', { basename: '/poble' });
    const enllac = elsDosControls(container, 'link', 'Obrir Salut')[quin];
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
    const enllac = screen.getAllByRole('link', { name: 'Obrir la Gestoria' })[0];
    expect(enllac.getAttribute('href')).toBe('/app/gestoria');
    expect(document.querySelector('[href="/gestoria"]')).toBeNull();
    expect(container.querySelector('a[href*="wikidepoble"], a[href*="gestoria_"]')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(enllac);
    expect(ubicacio()).toBe('/app/gestoria');
  });

  /* Fora de desenvolupament, l'app no s'obri (entorn 'desenvolupament'): la
     pàgina es manté, diu honestament que està en obres i no navega a res. */
  test('la Gestoria compilada en producció: explica la limitació d’entorn sense suggerir instal·lar-la', () => {
    const { container } = munta('/plugin/gestoria', { entorn: ENTORN_PRODUCCIO });
    expect(screen.queryByRole('link', { name: /Obrir la Gestoria/ })).toBeNull();
    expect(container.querySelector('a[href*="wikidepoble"], a[href*="gestoria_"], a[href*="/app/gestoria"]')).toBeNull();
    expect(screen.queryByRole('button', { name: /instal·la/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Obrir.*no disponible/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe(MOTIU.entorn);
    fireEvent.click(screen.getByRole('button', { name: DESACTIVA }));
    expect(ubicacio()).toBe('/plugin/gestoria');
    expect(screen.getByRole('status').textContent).toBe(MOTIU.entorn);
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
  test('capa d’entorn: el Lector compilat en producció diu per què no es pot obrir, sense ajuda d’instal·lació', () => {
    munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO });
    expect(screen.queryByRole('link', { name: /Obrir el Lector/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /instal·la/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Obrir.*no disponible/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe(MOTIU.entorn);
    fireEvent.click(screen.getByRole('button', { name: DESACTIVA }));
    expect(ubicacio()).toBe('/plugin/rss');
    expect(screen.getByRole('status').textContent).toBe(MOTIU.entorn);
  });

  /* Peça C (261007) · El build de producció de veres sense VITE_SDP_APP_*:
     el Lector no és al paquet (carrega null) i la plataforma ho diu abans que
     l'entorn ('no-compilada', interruptors.js). Este és el text que veu
     producció, no el de la capa d'entorn.
     Gauntlet 261022_0225 (F7) · DEROGAT «Com instal·lar esta eina»: no hi
     ha cap manera d'instal·lar-la, i el botó prometia passos que no hi
     havia. Ara el text diu, sense cap botó, qui la pot posar. */
  test('build de producció sense VITE_SDP_APP_* (carrega null): «Esta web encara no té esta eina.», qui la pot posar, i cap botó d’instal·lar', () => {
    const registre = registreDeProduccio();
    // El registre simulat és el de producció: el Lector hi és, però sense compilar.
    expect(registre.appPerId('lector')).toMatchObject({ id: 'lector', origen: 'interna', carrega: null });
    expect(registre.componentDe('lector')).toBeNull();
    const { container } = munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO, registre });
    expect(screen.queryByRole('link', { name: /Obrir el Lector/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /instal·la/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Obrir.*no disponible/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe(MOTIU.noCompilada);
    expect(within(accio(container)).getByText(CAMI.posar)).toBeTruthy();
    expect(accio(container).querySelector('[aria-expanded]')).toBeNull();
    // Cap paraula de jerga en tot el que diu la pàgina sense destí.
    expect(JARGO.test(screen.getByRole('status').textContent + accio(container).textContent)).toBe(false);
  });

  /* Onada 8 (261009) · Abans, darrere, el Panell de Disseny (cap app de la
     plataforma, el seu enllaç no depenia del build): ja no és un plugin.
     Onada 10 (decisió M2 del Mestre, 261010) · El Rebost i Salut portaven el
     botó dalt i al final, tots dos inerts.
     Gauntlet 261022_0225 (F2) · DEROGAT el compte d'inerts (1 per al TPV, 2
     per al Rebost i Salut): cap de les cinc pinta cap «Obrir…», ni dalt ni
     baix, i totes oferixen el camí i «Desactiva esta eina». */
  test('build de producció: cap app de la plataforma fa enllaç ni pinta cap «Obrir…» inert', () => {
    const registre = registreDeProduccio();
    for (const [id, nom] of [['tpv', 'Obrir el Bar'], ['rebost', 'Obrir el Rebost'], ['salut', 'Obrir Salut'], ['gestoria', 'Obrir la Gestoria'], ['rss', 'Obrir el Lector']]) {
      const { container } = munta(`/plugin/${id}`, { entorn: ENTORN_PRODUCCIO, registre });
      expect(screen.queryByRole('link', { name: new RegExp(nom) }), id).toBeNull();
      expect(container.querySelector('a[href*="/app/"]'), id).toBeNull();
      expect([id, controlsObrir(container, pluginPerId(id)).length]).toEqual([id, 0]);
      expect([id, container.querySelectorAll('[aria-disabled="true"]').length]).toEqual([id, 0]);
      expect([id, accioDeDalt(container)]).toEqual([id, null]);
      // La Gestoria porta entorn 'desenvolupament' al registre: és la primera capa que la tanca (troballa F3).
      expect([id, screen.getByRole('status').textContent]).toEqual([id, id === 'gestoria' ? MOTIU.entorn : MOTIU.noCompilada]);
      expect(within(accio(container)).getByText(CAMI.posar)).toBeTruthy();
      expect(within(accio(container)).getByRole('button', { name: DESACTIVA })).toBeTruthy();
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
     pendent de MarIA o del Mestre (systemPages.js, OBRIR_CONSOLA).
     Decisió del Mestre (ordre del 30-10-2026, prompt 2208, T2.2) · Derogat
     «la barrera de producció és el rol de superadmin» i ja no és pendent: la
     Consola és pública en qualsevol entorn i el botó hi és actiu. La ruta
     /consola/* munta ConsolaSection sense RequireAuth ni guarda (App.jsx;
     guardaConsola.js i RutaConsola, retirades el 31-10-2026). */

  /* Gauntlet 261022_0225 (F2) · Abans, un «Obrir el Bar (no disponible
     ací)» inert. Ara, el motiu i el camí de tornada: el botó de baix. */
  test('si la persona apaga l’app al portal, el botó deixa de portar-hi i la pàgina oferix tornar-la a activar', () => {
    window.localStorage.setItem(STORAGE_PREFIX + CLAU_PREFERENCIES, JSON.stringify({ v: 1, apps: { bar: false }, interruptors: {} }));
    _reiniciaPreferencies();
    const { container } = munta('/plugin/tpv');
    expect(screen.queryByRole('link', { name: /Obrir el Bar/ })).toBeNull();
    expect(controlsObrir(container, pluginPerId('tpv'))).toEqual([]);
    expect(screen.getByRole('status').textContent).toBe(MOTIU.personaApagada);
    // Cap camí escrit: el camí és el botó.
    expect(accio(container).querySelectorAll('p')).toHaveLength(1);
    // Gauntlet 261022_0225 (R1) · Apagada només al portal: la targeta no ha eixit del Panell.
    expect(within(accio(container)).getByText(NOTA.apagada)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: REACTIVA }));
    expect(screen.getByRole('link', { name: 'Obrir el Bar' }).getAttribute('href')).toBe('/app/bar');
    expect(appsDesades()).toEqual({});
  });

  /* Onada 10 (decisió M2 del Mestre, 261010) · Salut portava el botó dalt i
     al final, tots dos inerts. Gauntlet 261022_0225 (F2) · Cap dels dos: el
     motiu de la privacitat es diu una sola vegada, damunt de l'estat buit, i
     no hi ha cap camí escrit (l'avís ja diu on s'obri) ni cap instal·lació. */
  test('Salut dins d’una web d’altri (no és l’ama del document): cap «Obrir…», amb el motiu de la privacitat', () => {
    const { container } = munta('/plugin/salut', { entorn: { ...ENTORN_OBERT, amaDelDocument: false } });
    expect(screen.queryByRole('link', { name: /Obrir Salut/ })).toBeNull();
    expect(container.querySelector('a[href*="/app/salut"]')).toBeNull();
    expect(controlsObrir(container, pluginPerId('salut'))).toEqual([]);
    expect(accioDeDalt(container)).toBeNull();
    const avis = screen.getByRole('status');
    expect(avis.textContent).toContain('Guarda dades de salut');
    expect(accio(container).previousElementSibling.contains(avis)).toBe(true);
    expect(accio(container).querySelectorAll('p')).toHaveLength(1);
    expect(within(accio(container)).getByRole('button', { name: DESACTIVA })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /instal·la/i })).toBeNull();
    expect(ubicacio()).toBe('/plugin/salut');
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
  expect(apagada.avis).toBe(MOTIU.personaApagada);
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

  /* Gauntlet 261022_0225 (F1, F7) · L'estat sense destí i el motiu de la
     plataforma: cada clau en les cinc llengües, i el valencià del
     diccionari és la reserva del codi (TEXTOS_EINA i textDelMotiu). */
  test.each(Object.values(TEXTOS_EINA).map(([clau, reserva]) => [clau, reserva]))('%s: valor propi en cada llengua i el valencià és la reserva del codi', (clau, reserva) => {
    expect(createTranslator('ca')(clau)).toBe(reserva);
    for (const { code } of SUPPORTED_LANGUAGES.filter((l) => l.code !== 'ca')) {
      const valor = createTranslator(code)(clau);
      expect([code, valor !== clau && valor.length > 0, valor === reserva]).toEqual([code, true, false]);
    }
  });

  test.each(MOTIUS)('el motiu «%s», en les cinc llengües i sense jerga en valencià', (motiu) => {
    const reserva = textDelMotiu(motiu);
    expect(reserva.length).toBeGreaterThan(0);
    expect(textDelMotiu(motiu, createTranslator('ca'))).toBe(reserva);
    expect(JARGO.test(reserva)).toBe(false);
    for (const { code } of SUPPORTED_LANGUAGES.filter((l) => l.code !== 'ca')) {
      const valor = textDelMotiu(motiu, createTranslator(code));
      expect([code, valor.length > 0, valor === reserva]).toEqual([code, true, false]);
    }
  });

  test('textDelMotiu: un motiu que no és de la plataforma no diu res', () => {
    for (const res of ['', 'constructor', '__proto__', 'toString', null, undefined, 3]) expect([String(res), textDelMotiu(res)]).toEqual([String(res), '']);
  });

  test('amb l’amfitrió en castellà, l’estat sense destí parla castellà', () => {
    const es = createTranslator('es');
    const { container } = munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO, registre: registreDeProduccio(), externalConfig: { language: 'es' } });
    expect(screen.getByRole('status').textContent).toBe(es('plataforma.motiu.noCompilada'));
    expect(within(accio(container)).getByText(es('section.plugin.eina.camiPosar'))).toBeTruthy();
    expect(within(accio(container)).getByText(es('section.plugin.eina.notaActiva'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: es('section.plugin.eina.desactiva') }));
    expect(screen.getByRole('button', { name: es('section.plugin.eina.reactiva') })).toBeTruthy();
    expect(within(accio(container)).getByText(es('section.plugin.eina.notaDesactivada'))).toBeTruthy();
    // Ni un mot del valencià de reserva.
    for (const [, reserva] of Object.values(TEXTOS_EINA)) expect(accio(container).textContent).not.toContain(reserva);
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


/* Gauntlet 261022_0225 (F2) · Les cinc eines amb app de la plataforma, no
   només la Gestoria i el Lector: la llista ix de la dada. */
const AMB_APP = PLUGINS.filter((p) => p.obrir?.startsWith('/app/')).map((p) => p.id);

test('el cens de les eines amb app de la plataforma (l’estat sense destí val per a totes)', () => {
  expect(AMB_APP).toEqual(['gestoria', 'rebost', 'salut', 'rss', 'tpv']);
});

test.each(AMB_APP)('%s: desactivar la trau del Panell, conserva dades i es pot desfer', (id) => {
  const registre = registreDeProduccio();
  munta(`/plugin/${id}`, { entorn: ENTORN_PRODUCCIO, registre });
  expect(estaAlPanell(id)).toBe(true);
  window.localStorage.setItem('dades-test-conservades', 'papers');
  fireEvent.click(screen.getByRole('button', { name: DESACTIVA }));
  expect(estaAlPanell(id)).toBe(false);
  expect(window.localStorage.getItem('dades-test-conservades')).toBe('papers');
  expect(screen.getByText(NOTA.desactivada)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: REACTIVA }));
  expect(estaAlPanell(id)).toBe(true);
  expect(screen.getByText(NOTA.activa)).toBeTruthy();
  expect(screen.queryByRole('link', { name: /Obrir/ })).toBeNull();
  window.localStorage.removeItem('dades-test-conservades');
});

test.each(['gestoria', 'rss'])('%s: recupera al primer clic una eina amagada abans des del Perfil', (id) => {
  desaUtilitatActiva(id, false);
  munta(`/plugin/${id}`, { entorn: ENTORN_PRODUCCIO, registre: registreDeProduccio() });
  expect(estaAlPanell(id)).toBe(false);
  expect(screen.queryByRole('button', { name: DESACTIVA })).toBeNull();
  expect(screen.getByText(NOTA.desactivada)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: REACTIVA }));
  expect(estaAlPanell(id)).toBe(true);
  expect(screen.getByRole('button', { name: DESACTIVA })).toBeTruthy();
  expect(screen.queryByRole('link', { name: /Obrir/ })).toBeNull();
});

test('el botó segueix els canvis de visibilitat del Panell mentre la pàgina està oberta', () => {
  munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO, registre: registreDeProduccio() });
  act(() => { desaUtilitatActiva('rss', false); });
  expect(screen.getByRole('button', { name: REACTIVA })).toBeTruthy();
  act(() => { desaUtilitatActiva('rss', true); });
  expect(screen.getByRole('button', { name: DESACTIVA })).toBeTruthy();
});

/* Gauntlet 261022_0225 (F6) · El botó premut desapareix (la porta torna) i
   el focus va al nou «Obrir…» de baix, no al <body>. */
test.each([['gestoria', 'gestoria'], ['rss', 'lector'], ['tpv', 'bar'], ['rebost', 'nevera'], ['salut', 'salut']])('%s: reactivar una app compilada i apagada recupera la porta sense instal·lació, amb el focus al nou «Obrir…»', (id, idApp) => {
  window.localStorage.setItem(STORAGE_PREFIX + CLAU_PREFERENCIES, JSON.stringify({ v: 1, apps: { [idApp]: false }, interruptors: {} }));
  _reiniciaPreferencies();
  const { container } = munta(`/plugin/${id}`);
  expect(screen.getByRole('status').textContent).toBe(MOTIU.personaApagada);
  expect(screen.queryByRole('button', { name: /instal·la/i })).toBeNull();
  const boto = screen.getByRole('button', { name: REACTIVA });
  boto.focus();
  fireEvent.click(boto);
  expect(estaAlPanell(id)).toBe(true);
  expect(screen.queryByRole('status')).toBeNull();
  const plugin = pluginPerId(id);
  const enllacos = screen.getAllByRole('link', { name: plugin.etiquetaObrir });
  expect(enllacos).toHaveLength(presentacioDelPlugin(id) ? 2 : 1);
  expect(document.activeElement).toBe(accio(container).querySelector('a[href]'));
  expect(document.activeElement).toBe(enllacos[enllacos.length - 1]);
});

test('reactivar sense que l’eina es puga obrir: el focus es queda al mateix botó', () => {
  desaUtilitatActiva('rss', false);
  const { container } = munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO, registre: registreDeProduccio() });
  const boto = screen.getByRole('button', { name: REACTIVA });
  boto.focus();
  fireEvent.click(boto);
  expect(document.activeElement).toBe(boto);
  expect(boto.textContent).toBe(DESACTIVA);
  expect(accio(container).contains(document.activeElement)).toBe(true);
});

test('reactivar una app apagada que una altra capa encara tanca: el motiu canvia, el focus es queda al botó', () => {
  window.localStorage.setItem(STORAGE_PREFIX + CLAU_PREFERENCIES, JSON.stringify({ v: 1, apps: { salut: false }, interruptors: {} }));
  _reiniciaPreferencies();
  munta('/plugin/salut', { entorn: { ...ENTORN_OBERT, amaDelDocument: false } });
  expect(screen.getByRole('status').textContent).toBe(MOTIU.personaApagada);
  const boto = screen.getByRole('button', { name: REACTIVA });
  boto.focus();
  fireEvent.click(boto);
  expect(screen.getByRole('status').textContent).toContain('Guarda dades de salut');
  expect(document.activeElement).toBe(boto);
  expect(boto.textContent).toBe(DESACTIVA);
});

/* Gauntlet 261022_0225 (R9) · La demanda de focus es desfà en el primer canvi
   del destí, encara que no es puga obrir: si l'eina s'obri més tard per una
   altra causa, el focus no salta al nou «Obrir…». */
test('reactivar quan una altra capa encara la tanca, i obrir-se més tard: el focus no salta', () => {
  window.localStorage.setItem(STORAGE_PREFIX + CLAU_PREFERENCIES, JSON.stringify({ v: 1, apps: { salut: false }, interruptors: {} }));
  _reiniciaPreferencies();
  const tancat = { ...ENTORN_OBERT, amaDelDocument: false };
  const { container, rerender } = munta('/plugin/salut', { entorn: tancat });
  fireEvent.click(screen.getByRole('button', { name: REACTIVA }));
  expect(screen.getByRole('status').textContent).toContain('Guarda dades de salut');
  // La persona se'n va a un altre control de la pàgina.
  const altre = screen.getByRole('button', { name: 'Amaga la portada' });
  altre.focus();
  rerender(arbre('/plugin/salut', { entorn: ENTORN_OBERT }));
  const baix = accio(container).querySelector('a[href]');
  expect(baix.textContent).toBe('Obrir Salut');
  expect(document.activeElement).toBe(altre);
});

/* Gauntlet 261022_0225 (F4) · «Desactiva esta eina» escriu UNA preferència,
   la del Panell (la mateixa del Perfil), i ho diu. Cap entrada deixa les
   dues fora de pas. */
describe('F4 · desactivar i tornar a activar, des de qualsevol entrada', () => {
  test('desactivar no apaga l’app al portal /app: només la trau del Panell', () => {
    munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO, registre: registreDeProduccio() });
    fireEvent.click(screen.getByRole('button', { name: DESACTIVA }));
    expect(estaAlPanell('rss')).toBe(false);
    expect(appsDesades()).toEqual({});
  });

  test('desactivada ací i mostrada des del Perfil: la pàgina torna a dir «Desactiva», sense cap preferència penjada', () => {
    munta('/plugin/gestoria', { entorn: ENTORN_PRODUCCIO, registre: registreDeProduccio() });
    fireEvent.click(screen.getByRole('button', { name: DESACTIVA }));
    // El Perfil («Mostrar al Panell») escriu la mateixa preferència.
    act(() => { desaUtilitatActiva('gestoria', true); });
    expect(screen.getByRole('button', { name: DESACTIVA })).toBeTruthy();
    expect(screen.getByText(NOTA.activa)).toBeTruthy();
    expect(appsDesades()).toEqual({});
  });

  /* Gauntlet 261022_0225 (R1) · Apagada només al portal («Vull vore: No»): la
     targeta continua al Panell, i la nota no ho pot negar. */
  test('apagada només al portal: la nota és la del portal i no parla del Panell', () => {
    window.localStorage.setItem(STORAGE_PREFIX + CLAU_PREFERENCIES, JSON.stringify({ v: 1, apps: { lector: false }, interruptors: {} }));
    _reiniciaPreferencies();
    const { container } = munta('/plugin/rss');
    expect(estaAlPanell('rss')).toBe(true);
    expect(screen.getByRole('button', { name: REACTIVA })).toBeTruthy();
    const nota = within(accio(container)).getByText(NOTA.apagada);
    expect(nota.textContent).not.toMatch(/Panell/);
    expect(accio(container).textContent).not.toContain(NOTA.desactivada);
    // Amagada també del Panell: llavors sí, la nota del Panell.
    act(() => { desaUtilitatActiva('rss', false); });
    expect(within(accio(container)).getByText(NOTA.desactivada)).toBeTruthy();
  });

  test('apagada al portal i amagada al Perfil: «Torna a activar» desfà totes dues i l’eina s’obri', () => {
    window.localStorage.setItem(STORAGE_PREFIX + CLAU_PREFERENCIES, JSON.stringify({ v: 1, apps: { lector: false }, interruptors: {} }));
    _reiniciaPreferencies();
    desaUtilitatActiva('rss', false);
    munta('/plugin/rss');
    fireEvent.click(screen.getByRole('button', { name: REACTIVA }));
    expect(estaAlPanell('rss')).toBe(true);
    expect(appsDesades()).toEqual({});
    expect(screen.getAllByRole('link', { name: 'Obrir el Lector' })).toHaveLength(2);
  });

  test('si no es pot guardar, ho diu en la llengua de la persona i no toca res més', () => {
    munta('/plugin/rss', { entorn: ENTORN_PRODUCCIO, registre: registreDeProduccio() });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('ple'); });
    fireEvent.click(screen.getByRole('button', { name: DESACTIVA }));
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut guardar el canvi. Torna-ho a provar.');
    expect(screen.getByRole('button', { name: DESACTIVA })).toBeTruthy();
  });
});

test('Gestoria en un document d’altri: desactivar i recuperar conserva el bloqueig financer sense proposar instal·lar', () => {
  munta('/plugin/gestoria', { entorn: { ...ENTORN_OBERT, amaDelDocument: false }, basename: '/poble' });
  const motiu = screen.getByRole('status').textContent;
  expect(motiu).toContain('Guarda dades financeres');
  expect(screen.queryByRole('button', { name: /instal·la/i })).toBeNull();
  expect(screen.queryByRole('link', { name: /Obrir la Gestoria/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: DESACTIVA }));
  expect(estaAlPanell('gestoria')).toBe(false);
  // F4 · El motiu de la privacitat no canvia: desactivar no toca el portal.
  expect(screen.getByRole('status').textContent).toBe(motiu);
  fireEvent.click(screen.getByRole('button', { name: REACTIVA }));
  expect(estaAlPanell('gestoria')).toBe(true);
  expect(screen.getByRole('status').textContent).toBe(motiu);
  expect(screen.queryByRole('button', { name: /instal·la/i })).toBeNull();
  expect(screen.queryByRole('link', { name: /Obrir la Gestoria/ })).toBeNull();
  expect(ubicacio()).toBe('/plugin/gestoria');
});
