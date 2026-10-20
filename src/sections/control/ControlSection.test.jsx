/* D3 i D16 (ordres del Mestre, 260930), P5 i W4-08 (261004) · El Panell de
   Control (/control i l'àlies /utilitats): les huit targetes de publicació
   tenen portes de lectura; Publicar al Mur obri el Bloc i la resta avisa
   que està en obres. Cap control porta a una ruta que no servix l'app.
   «Missatges per a dubtes» obri el Xat i la Gestoria, la seua fitxa de
   plugin. La pàgina i la pestanya es diuen «Panell de Control».

   Router propi en memòria (MemoryRouter) i les targetes de veres
   (UniversalCard); només se substituïxen la UniversalPage (la seua
   maquinària no entra en joc), l'eixida segura (SessionContext) i l'i18n.

   Onada 8 (261009; requeriments 261009_1300, punt 2; decisions D1, D2, D4,
   D5 i D7 de MarIA) · Totes les targetes del Panell són Universal Cards
   senceres: porten Connectar i el copyright (la Revisió R3 queda derogada).
   La Consola, el Cervell i Disseny ja no són plugins.

   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
   DEROGAT «Maquinària i Sistema les pinta primer, amb la targeta del Mur»
   (Onada 8): les tres pàgines ixen del Panell i viuen només al Mur. La
   secció porta només les eines del registre, i ací ja no hi ha cap prova
   pròpia de les pàgines de la maquinària: la prova «Onada 10 · …» vigila que
   no en quede res. DEROGADES també, per a les sis targetes de plugin
   (Gestoria, Rebost Domèstic, Salut, Lector RSS, TPV del Bar i el Snippet),
   la D6 («cap data per a les eines») i la P6 («cap etiqueta al Panell»):
   decisió M4, targeta canònica amb la data i les etiquetes de la seua font
   (el registre de plugins, o el Snippet). Les huit targetes de dalt
   conserven les seues assercions. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { TEXTOS_COMENTAR } from '../../components/PedraSeca/organismes/textosComentar.js';
import { RouteSEO } from '../../hooks/RouteSEO';
import { createTranslator } from '../../config/i18n';
import { resolvePageSlugPath, RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { RUTA_DRETS_AUTOR } from '../../config/systemPages.js';
import { IDS_PLUGINS, PLUGINS, rutaDelPlugin } from '../plugins/registrePlugins.js';
import { DATA_DEL_SNIPPET, ETIQUETES_DEL_SNIPPET as ETIQUETES_SNIPPET } from './destiSnippet.js';
import { AUTORIA_SOCDEPOBLE, DESTINS_CONTROL } from './destinsControl.js';
import * as destinsControl from './destinsControl.js';
import fontApp from '../../app/App.jsx?raw';
import fontControl from './ControlSection.jsx?raw';

/* `traductor` (correcció de la revisió, 260930) · per defecte el t torna la
   reserva, com sempre; una prova hi posa el traductor real d'una llengua.
   `xat` (W4-09) · null: sense proveïdor, el xat de Sóc de Poble de la llavor
   (useXatSocDePoble); un objecte { estat, href, avis, resol }: el que el
   proveïdor de l'app (ProveidorXatSocDePoble) dona en remot.
   Ordre del Mestre (261007, correcció C2) · El Panell ja no fa cap
   resolució pròpia (useXatCorporatiu, derogat): llig la del proveïdor. */
const estat = vi.hoisted(() => ({ demana: vi.fn(), traductor: null, toast: vi.fn(), xat: null }));
/* P5 · L'avís de les portes en obres (useToast). */
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: estat.toast })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: (clau, reserva) => (estat.traductor ? estat.traductor(clau, reserva) : reserva),
    resolveAsset: (valor) => valor
  }),
  /* La capçalera del document és opt-in: sense manageDocumentHead el títol
     de la pestanya no s'escriu i la prova de RouteSEO no provaria res.
     W4-09 · dataMode 'seed', sense xarxa. */
  useUIState: () => ({ externalConfig: { manageDocumentHead: true, dataMode: 'seed' } })
}));
vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: () => ({ demana: estat.demana, ocupat: false, avis: null, error: null })
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, children }) => (
    <section data-pagina="control">
      <p data-titol="pagina">{title}</p>
      <p>{subtitle}</p>
      {children}
    </section>
  )
}));

import ControlSection from './ControlSection.jsx';

/* Les rutes estàtiques de la taula d'App (App.jsx): sense paràmetres ni
   comodins, perquè una ruta com «/:usuari» o «*» no faça passar per bona una
   ruta que no té secció (la «/gestoria» d'abans queia a NotFoundPage). */
function rutesEstatiques() {
  const rutes = new Set();
  for (const m of fontApp.matchAll(/<Route\s+path="([^"]+)"/g)) {
    const ruta = m[1].replace(/^\//, '');
    if (!ruta.includes(':') && !ruta.includes('*')) rutes.add(ruta);
  }
  return rutes;
}
const camiDe = (ruta) => ruta.split('?')[0].replace(/^\//, '');
/* P5 (ESMENA 261003 22:34) · Una pàgina de /page/:slug que pinta
   PageDetailSection: una clau pròpia de PAGE_COPY sense ruta canònica. */
const esPaginaServida = (ruta) => {
  const trobat = /^\/page\/([^/?#]+)$/.exec(ruta);
  if (!trobat || !fontApp.includes('<Route path="/page/:slug"')) return false;
  const clau = decodeURIComponent(trobat[1]);
  return Object.hasOwn(PAGE_COPY, clau) && resolvePageSlugPath(clau) === null;
};
/* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil
   (RUTA_PERFIL_PROJECTE, /empresa/socdepoble), que servix la ruta amb
   paràmetre de la fitxa pública (App.jsx, empresa/:agentId). Abans, /projecte. */
const esPerfilDeLaBoina = (ruta) => ruta === RUTA_PERFIL_PROJECTE && fontApp.includes('<Route path="empresa/:agentId"');
const esDestiDeLApp = (ruta) => rutesEstatiques().has(camiDe(ruta)) || esPaginaServida(ruta) || esPerfilDeLaBoina(ruta);

/* P7-B · La preferència de les Utilitats (DetallEspai.jsx escriu
   sdp_utilitats_actives; ControlSection la llig) és d'EXCLUSIÓ: només un
   false explícit amaga una utilitat. Les proves parteixen de l'estat per
   defecte, sense preferència: es veuen totes. TOTES_LES_UTILITATS és el valor
   que deixava l'antiga activació (tot a true): també les mostra totes. */
const CLAU_UTILITATS = 'sdp_utilitats_actives';
const TOTES_LES_UTILITATS = Object.freeze({ gestoria: true, metriques: true, lector_rss: true, cervell: true, snippet: true });

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

/* El Panell dins del xat de Sóc de Poble que dona el proveïdor de l'app:
   estat.xat (null, la llavor). */
function pinta(ruta = '/control') {
  return render(
    <XatSocDePobleContext.Provider value={estat.xat}>
      <MemoryRouter rutaInicial={ruta}>
        <ControlSection />
        <RouteSEO />
        <Ubicacio />
      </MemoryRouter>
    </XatSocDePobleContext.Provider>
  );
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

/* Ordre del Mestre (261007) · «COMENTARIS = XAT» · El menú de Comentar d'una
   targeta: obrir-lo (Comentar diu que obri un menú) i les seues dues files. */
const PRIVAT = TEXTOS_COMENTAR.privat[1];
const PUBLIC = TEXTOS_COMENTAR.public[1];
function obriComentar(targeta, titol) {
  const boto = within(targeta).getByRole('button', { name: `Comentar ${titol}` });
  expect(boto.getAttribute('aria-haspopup'), titol).toBe('menu');
  fireEvent.click(boto);
  expect(boto.getAttribute('aria-expanded'), titol).toBe('true');
  const menu = within(targeta).getByRole('menu');
  return { privat: within(menu).getByRole('menuitem', { name: PRIVAT }), public: within(menu).getByRole('menuitem', { name: PUBLIC }) };
}

beforeEach(() => {
  estat.demana.mockReset();
  estat.toast.mockReset();
  estat.traductor = null;
  estat.xat = null;
  const titol = document.createElement('title');
  titol.textContent = 'Amfitrió';
  document.head.replaceChildren(titol);
  localStorage.removeItem(CLAU_UTILITATS);
});
afterEach(() => {
  cleanup();
  localStorage.removeItem(CLAU_UTILITATS);
});

test('D3 · la taula de rutes d’App té les rutes que el Panell necessita i no té /gestoria', () => {
  const rutes = rutesEstatiques();
  for (const ruta of ['control', 'utilitats', 'xat', 'control-xat', 'mur', 'mercat', 'notes']) {
    expect(rutes.has(ruta), ruta).toBe(true);
  }
  expect(rutes.has('gestoria')).toBe(false);
});

/* CU (261003) · Una pintada per clic: la targeta del Snippet obri la seua
   fitxa i desmunta el Panell, i un clic sobre un botó desmuntat no navegaria
   (es comptaria el destí de l'anterior).
   P5 (Onada 4, 261003) · Les targetes de dalt ja no són un enllaç sencer:
   naveguen les seues portes obertes (a.sp-card-porta), l'autor de la boina
   (el xat de socdepoble) i la pastilla de la data (el Calendari). Una porta
   pot portar a la pàgina de la targeta (/page/<clau>, PageDetailSection).
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6): l'autor
   de la boina porta a la pàgina del projecte (/projecte), no al xat. */
test('D3 · cap targeta ni botó del Panell navega a una ruta que no és a la taula d’App', () => {
  const clicables = () => [
    ...document.querySelectorAll('button.sp-card-link-overlay, a.sp-card-porta, a.sp-card-author-link, button.btn-date-time'),
    screen.getByRole('button', { name: /Missatges per a dubtes/ })
  ];
  pinta();
  const total = clicables().length;
  expect(total).toBeGreaterThan(1);
  const destins = [];
  for (let i = 0; i < total; i += 1) {
    cleanup();
    pinta();
    const element = clicables()[i];
    const esPorta = element.classList.contains('sp-card-porta');
    fireEvent.click(element);
    destins.push([esPorta, ubicacio()]);
  }
  /* P5 · Cada porta oberta porta a un lloc distint (abans, Mur i Agenda
     portaven tots dos a /mur). Les boines porten totes al mateix lloc (T6,
     261004: el projecte).
     W4-08 · Huit targetes: Publicar al Mur i els huit Saber-ne més. */
  const deLesPortes = destins.filter(([esPorta]) => esPorta).map(([, desti]) => desti);
  expect(deLesPortes).toHaveLength(DESTINS_CONTROL.length + 1);
  expect(deLesPortes).toHaveLength(9);
  expect(new Set(deLesPortes).size).toBe(deLesPortes.length);
  expect(destins.map(([, desti]) => desti).filter((desti) => !esDestiDeLApp(desti))).toEqual([]);
  expect(destins.map(([, desti]) => desti)).not.toContain('/gestoria');
  expect(destins.map(([, desti]) => desti)).not.toContain('/xat/0001');
  /* W4-08 (revisió adversarial de C3, 261004) · Una pintada del Panell sencer
     per cada clicable: amb huit targetes dalt i deu baix són 36 pintades, i
     sota càrrega passaven dels 5 s per defecte (6,1 i 8,8 s mesurats). El
     temps no és el que es prova: el límit explícit no afluixa cap asserció.
     Onada 10 (261010; decisió M4 del Mestre) · Les sis targetes de plugin
     porten ara la pastilla de la data, que també es prem ací: porta al
     Calendari del seu mes, una ruta d'App, com la de les targetes de dalt.
     Les tres pàgines de la maquinària, que també en portaven, ja no hi són. */
}, 30_000);

/* P5 (261003) i W4-08 (261004) substituïxen les targetes d'edició del
   Panell antic: les huit pàgines tenen una porta de lectura accessible.
   Mur publica des del Bloc; les altres portes d'escriptura expliquen que
   encara estan en obres (destinsControl.js). */
test('D3 · les huit targetes de publicació enllacen les seues pàgines en ordre', () => {
  pinta();
  const esperats = ['publicar_mur', 'publicar_mercat', 'publicar_calendari', 'publicar_mapa', 'vehicle_compartit', 'animalets', 'treball', 'habitatge'];
  const noms = ['Saber-ne més sobre el Mur', 'Saber-ne més sobre el Mercat', 'Saber-ne més sobre el Calendari', 'Saber-ne més sobre el Mapa', 'Saber-ne més: Vehicle Compartit', 'Saber-ne més: Animalets', 'Saber-ne més: Treball', 'Saber-ne més: Habitatge'];
  const targetes = [...document.querySelectorAll('article.sp-card')].slice(0, 8);
  expect(targetes).toHaveLength(8);
  const enllacos = targetes.map((targeta, i) => within(targeta).getByRole('link', { name: noms[i] }));
  expect(enllacos.map((enllac) => enllac.getAttribute('href')))
    .toEqual(esperats.map((pagina) => `/page/${pagina}`));
  for (const [i, targeta] of targetes.entries()) {
    expect(targeta.querySelector('.sp-card-link-overlay')).toBeNull();
    fireEvent.click(enllacos[i]);
    expect(ubicacio()).toBe(`/page/${esperats[i]}`);
  }
});

test('P5 · Publicar al Mur obri el Bloc; la resta de portes conserva l’avís accessible d’obres', () => {
  pinta();
  const publicar = screen.getByRole('link', { name: 'Publicar al Mur' });
  expect(publicar.getAttribute('href')).toBe('/notes');
  fireEvent.click(publicar);
  expect(ubicacio()).toBe('/notes');
  const inertes = [...document.querySelectorAll('button.sp-card-porta[aria-disabled="true"]')];
  expect(inertes).toHaveLength(7);
  const noms = [
    'Publicar al Mercat (en obres)', 'Publicar al Calendari (en obres)', 'Publicar al Mapa (en obres)',
    'Publicar: Vehicle Compartit (en obres)', 'Publicar: Animalets (en obres)',
    'Publicar: Treball (en obres)', 'Publicar: Habitatge (en obres)'
  ];
  for (const [i, boto] of inertes.entries()) expect(screen.getByRole('button', { name: noms[i] })).toBe(boto);
  fireEvent.click(inertes[0]);
  expect(ubicacio()).toBe('/notes');
  expect(estat.toast).toHaveBeenCalledWith('“Publicar al Mercat” encara està en obres.');
});

test('P5 · en anglés, les dues portes es tradueixen i Publicar al Mur continua obrint el Bloc', () => {
  estat.traductor = createTranslator('en');
  pinta();
  const targeta = document.querySelector('article.sp-card');
  expect(within(targeta).getByRole('link', { name: 'Publish on the Wall' }).querySelector('span:not(.sdp-sr-only)').textContent).toBe('Publish');
  expect(within(targeta).getByRole('link', { name: 'Learn more about the Wall' }).querySelector('span:not(.sdp-sr-only)').textContent).toBe('Learn more');
  expect(within(targeta).queryByText('Publicar')).toBeNull();
  expect(within(targeta).queryByText('Saber-ne més')).toBeNull();
  fireEvent.click(within(targeta).getByRole('link', { name: 'Publish on the Wall' }));
  expect(ubicacio()).toBe('/notes');
});

/* P7-B · La Gestoria ja no és la targeta «EN OBRES» sense clic: és una de les
   onze utilitats i obri la seua pàgina (/plugin/gestoria), que diu que està en
   obres i no navega (PluginPage.test.jsx). Continua sense portar mai a
   /gestoria, que no és cap ruta d'App. */
test('D3 · P7-B · la Gestoria obri la seua pàgina (/plugin/gestoria), mai /gestoria; cap targeta diu «ACTIU» ni «EN OBRES»', () => {
  pinta();
  expect(screen.queryByText('ACTIU')).toBeNull();
  expect(screen.queryByText('EN OBRES')).toBeNull();
  expect(document.querySelector('[href="/gestoria"]')).toBeNull();
  fireEvent.click(within(targetaDUtilitat('Gestoria')).getByRole('link', { name: 'Gestoria' }));
  expect(ubicacio()).toBe('/plugin/gestoria');
});

test('D3 · «Missatges per a dubtes» obri el Xat (/xat), no un fil inexistent', () => {
  pinta();
  fireEvent.click(screen.getByRole('button', { name: /Missatges per a dubtes/ }));
  expect(ubicacio()).toBe('/xat');
});

/* CU (Onada 3, 261003) · Control › Utilitats guanya el Snippet, amb la seua
   fitxa de detall (FitxaSnippet.test.jsx en prova el contingut).
   P7-B · Les utilitats del registre es poden repartir en més d'una graella
   (un altre actor les ha separat en «Utilitats i Connectors» i «Maquinària i
   Sistema», 261004 01:56): les proves les lligen totes, en l'ordre del DOM,
   sense fixar el repartiment. El Snippet viu a la graella d'Utilitats. Una
   targeta es busca sempre dins d'estes seccions.
   W4-08 · Decisió del Mestre (Acta 261004_0206, §4) · Mapa, Vehicle Compartit
   i Animalets viuen NOMÉS dalt, com a targetes de publicació: cap plugin amb
   targeta dalt (DESTINS_CONTROL) es repetix baix.
   Onada 2 de la Gestoria (261004; MAPA §2.2) · Els dos espais nous, «L’empresa»
   i «La llar», també són graelles del registre: van davant de les Utilitats,
   en l'ordre del DOM. ControlSection.espais.test.jsx en prova la separació. */
const SECCIONS_DUTILITATS = ['L’empresa', 'La llar', 'Utilitats i Connectors (Plugins)', 'Maquinària i Sistema'];
const seccioDe = (nom) => screen.queryByRole('heading', { level: 2, name: nom })?.closest('section') ?? null;
const seccioDUtilitats = () => seccioDe('Utilitats i Connectors (Plugins)');
const targetesDe = (seccio) => (seccio ? [...seccio.querySelectorAll('.sdp-card-grid > article.sp-card')] : []);
const titolDeTargeta = (targeta) => targeta.querySelector('.sp-card-title').textContent;
/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
   tres pàgines del sistema que l'Onada 8 pintava a «Maquinària i Sistema» i
   que ara viuen només al Mur: els seus títols (els de PAGE_COPY, la font de
   la targeta del Mur) i totes les rutes on portaven (la seua pàgina i el
   botó «Obrir…»). Ací només servixen per a afirmar que NO hi són. */
const CLAUS_FORA_DEL_PANELL = ['consola', 'cervell', 'disseny'];
const TITOLS_FORA_DEL_PANELL = CLAUS_FORA_DEL_PANELL.map((clau) => PAGE_COPY[clau].title);
const RUTES_FORA_DEL_PANELL = ['/page/consola', '/page/cervell', '/disseny', '/consola', '/consola/explorador'];
/* Les targetes de les eines (registre i Snippet): totes les de les quatre
   seccions de baix. Onada 10 · Ja no cal descartar-ne cap: abans, les tres
   pàgines del sistema de la maquinària. */
const targetesDUtilitats = () => SECCIONS_DUTILITATS.flatMap((nom) => targetesDe(seccioDe(nom)));
/* Onada 10 (decisió M4 del Mestre) · La targeta canònica de plugin: el que
   ha de pintar cada una ix de la seua FONT, pel títol de la targeta: el
   registre de plugins (camps `data` i `etiquetes`) o, per al Snippet, la seua
   data i les seues dues etiquetes (Categoria «Eina» i Etiqueta «Extensió»,
   l'esborrany de l'ordre). Cap títol escrit a mà decidix qui porta data: ho
   diu el registre.
   Onada 11 (261010; prompt 261010_1730, tasca 6, D5) · Les etiquetes del
   Snippet viuen a destiSnippet.js (ETIQUETES_DEL_SNIPPET), amb la data, i la
   fitxa les pinta també: abans eren de la constant SNIPPET del Panell. */
const ETIQUETES_DEL_SNIPPET = ETIQUETES_SNIPPET.map(({ text, className }) => [text, className]);
const fontDeLaTargeta = (titol) => {
  const plugin = PLUGINS.find((p) => p.titol === titol);
  if (plugin) return { data: plugin.data, etiquetes: plugin.etiquetes.map(({ text, className }) => [text, className]) };
  return titol === 'Snippet' ? { data: DATA_DEL_SNIPPET, etiquetes: ETIQUETES_DEL_SNIPPET } : null;
};
/* La pastilla de la boina, com la pinta la targeta: l'hora i el dia, o només
   el dia si la font no porta hora (l'hora no s'inventa). */
const pastillaEsperada = (data) => {
  const { time, date } = dataHoraDeBarra({ creat: data });
  return [time, date].filter(Boolean);
};
const pastillaDe = (targeta) => [...targeta.querySelectorAll('header.sp-card-header button.btn-date-time span')].map((s) => s.textContent);
const etiquetesDe = (targeta) => [...targeta.querySelectorAll('ul.sp-card-labels > li')].map((li) => [li.textContent, li.className]);
const etiquetesEsperades = (etiquetes) => etiquetes.map(([text, classe]) => [text, `sp-card-label ${classe}`]);
/* Onada 8 (261009; revisió R3 derogada) · El peu de totes les targetes del
   Panell: Traduir, Comentar, Compartir i Connectar. */
const PEU_SENCER = (titol) => [`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`, `Connectar amb ${titol}`];
const utilitats = () => targetesDUtilitats().map(titolDeTargeta);
const targetaDUtilitat = (titol) => targetesDUtilitats().find((targeta) => titolDeTargeta(targeta) === titol);
const senseSnippet = (titols) => titols.filter((titol) => titol !== 'Snippet');
/* W4-08 · Els plugins que es pinten baix: tot el registre menys els que ja
   tenen targeta de publicació dalt, en l'ordre del registre. */
const IDS_DE_DALT = new Set(DESTINS_CONTROL.map((desti) => desti.id));
const PLUGINS_DE_BAIX = PLUGINS.filter((plugin) => !IDS_DE_DALT.has(plugin.id));
const TITOLS_DE_BAIX = PLUGINS_DE_BAIX.map((plugin) => plugin.titol);
const NOMES_DALT = [['Mapa', 'mapa'], ['Vehicle Compartit', 'vehicle'], ['Animalets', 'animalets']];
/* Les onze de l'ordre del Mestre (prompt 261004_0015 T2). El registre és la
   font: si en porta més (MarIA hi ha afegit «disseny»), també es pinten.
   Ordre del Mestre (261007) · Bàscula descartada per ara: en queden deu
   d'aquelles onze; amb «disseny», el registre en porta onze.
   Onada 8 (261009) · La Consola i el Cervell (i «disseny») ja no són
   plugins, sinó pàgines del sistema: en queden huit al registre.
   Onada 10 (261010) · I cap de les tres és ja al Panell: viuen només al
   Mur. */
const LES_DE_LORDRE = ['mapa', 'vehicle', 'animalets', 'gestoria', 'rebost', 'salut', 'rss', 'tpv'];
/* On porta cada targeta d'Utilitats, pel seu títol (el Snippet, a la seua fitxa del Panell). */
const PAGINA_DUTILITAT = new Map([
  ...PLUGINS.map((plugin) => [plugin.titol, rutaDelPlugin(plugin.id)]),
  ['Snippet', '/control?fitxa=snippet']
]);

/* ═══ P7-B · Onada 4, setena passada, bloc B (prompt 261004_0015 T3; relleu
   PLUGINS_P7.txt) · Les utilitats de registrePlugins.js, l'única taula, com a
   UniversalCards canòniques, i el Snippet al final de les Utilitats ═══ */
test('P7-B · W4-08 · el registre sense les de dalt es veu una vegada, en l’ordre del registre, canònic; el Snippet tanca les Utilitats', () => {
  pinta();
  expect(IDS_PLUGINS).toEqual(expect.arrayContaining(LES_DE_LORDRE));
  /* Onada 10 (261010; decisió del Mestre del 261010) · Les tres pàgines del
     sistema ja no tenen cap targeta al Panell (abans ací es fixava la llista
     de les pàgines de la maquinària, que ja no existix). */
  expect(TITOLS_FORA_DEL_PANELL).toEqual(['Consola Termodinàmica', 'El Cervell', 'Disseny Pedra Seca']);
  const titolsDelPanell = [...document.querySelectorAll('article.sp-card .sp-card-title')].map((titol) => titol.textContent);
  expect(titolsDelPanell.filter((titol) => TITOLS_FORA_DEL_PANELL.includes(titol))).toEqual([]);
  expect(Object.keys(destinsControl)).not.toContain('PAGINES_MAQUINARIA');
  /* Ordre del Mestre (261007) · Bàscula descartada per ara: cap targeta ni enllaç seu al Panell. */
  expect(IDS_PLUGINS).not.toContain('bascula');
  expect(document.querySelector('[href="/plugin/bascula"]')).toBeNull();
  expect(document.querySelector('img[src*="bascula_vinyeta"]')).toBeNull();
  const targetes = targetesDUtilitats();
  expect(targetes).toHaveLength(PLUGINS_DE_BAIX.length + 1);
  /* L'ordre del DOM i del focus és el del registre, i cada una hi és una vegada. */
  expect(senseSnippet(utilitats())).toEqual(TITOLS_DE_BAIX);
  expect(utilitats().filter((titol) => titol === 'Snippet')).toHaveLength(1);
  expect(titolDeTargeta(targetesDe(seccioDUtilitats()).at(-1))).toBe('Snippet');
  targetes.forEach((targeta) => {
    const titol = titolDeTargeta(targeta);
    const font = fontDeLaTargeta(titol);
    expect(font, titol).not.toBeNull();
    /* La targeta de sempre: cap variant, cap porta i cap botó gran.
       Onada 10 (261010; decisió M4 del Mestre) · DEROGAT «cap etiqueta»: la
       targeta canònica porta la Categoria i l'Etiqueta de la seua font,
       exactament eixes dues i en eixe ordre. */
    expect(targeta.className, titol).toBe('sp-card');
    expect(font.etiquetes.map(([, classe]) => classe), titol).toEqual(['sdp-badge-category', 'sdp-badge-tag']);
    expect(etiquetesDe(targeta), titol).toEqual(etiquetesEsperades(font.etiquetes));
    expect(targeta.querySelectorAll('.sp-card-body > ul.sp-card-labels'), titol).toHaveLength(1);
    expect(targeta.querySelector('.sp-card-portes'), titol).toBeNull();
    expect(targeta.querySelector('.sp-card-accio'), titol).toBeNull();
    /* La boina de Sóc de Poble, dalt de tot.
       Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6):
       l'autor porta a la pàgina del projecte, no al xat corporatiu.
       Onada 10 (261010; decisió M4 del Mestre) · DEROGAT «sense data (el
       registre no en porta)»: la boina porta UNA pastilla amb la data de la
       seua font, llegida com la de les targetes de dalt (dataHoraDeBarra). */
    const capcal = targeta.querySelector('header.sp-card-header');
    expect(targeta.firstElementChild, titol).toBe(capcal);
    expect(capcal.querySelector('.sp-card-author-name').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.author);
    expect(capcal.querySelector('.sp-card-author-location').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.location);
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href'), titol).toBe(RUTA_PERFIL_PROJECTE);
    expect(targeta.querySelectorAll('.btn-date-time'), titol).toHaveLength(1);
    expect(pastillaEsperada(font.data).length, titol).toBeGreaterThan(0);
    expect(pastillaDe(targeta), titol).toEqual(pastillaEsperada(font.data));
    /* L'enllaç de tota la targeta, amb el nom del títol. */
    const enllac = targeta.querySelector('a.sp-card-link-overlay');
    expect([enllac.getAttribute('href'), enllac.getAttribute('aria-label')], titol).toEqual([PAGINA_DUTILITAT.get(titol), titol]);
    expect(within(targeta).getByRole('heading', { level: 3, name: titol }).classList.contains('sdp-sr-only'), titol).toBe(false);
    /* El peu blau de P6: Traduir, Comentar i Compartir.
       Onada 8 (261009; revisió R3 derogada) · I Connectar, i el copyright
       cap a «Drets d'autor». Abans, sense Connectar ni copyright. */
    expect(targeta.lastElementChild.className, titol).toBe('sp-card-footer');
    expect([...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label')), titol)
      .toEqual(PEU_SENCER(titol));
    const drets = targeta.querySelector('.sp-card-body > .sp-card-copyright > a.sp-card-copyright__enllac');
    expect([drets.textContent, drets.getAttribute('href')], titol).toEqual([COPYRIGHT_SDP, RUTA_DRETS_AUTOR]);
  });
  /* Il·lustració, subtítol i entradilla: els del registre, sense cap canvi. */
  PLUGINS_DE_BAIX.forEach((plugin) => {
    const targeta = targetaDUtilitat(plugin.titol);
    const imatge = targeta.querySelector('img.sp-card-media');
    expect([imatge.getAttribute('src'), imatge.getAttribute('alt')], plugin.id).toEqual([plugin.imatge, plugin.imatgeAlt]);
    expect(within(targeta).getByRole('heading', { level: 4 }).textContent, plugin.id).toBe(sensePunt(plugin.subtitol));
    expect(targeta.querySelector('p.sp-card-text').textContent, plugin.id).toBe(plugin.entradilla);
  });
  /* El Snippet, amb la seua il·lustració i el seu subtítol de sempre.
     Onada 8 (261009) · I sense entradilla, com sempre: la seua targeta mai
     n'ha portat cap (SNIPPET de ControlSection.jsx). Pendent de decisió de
     MarIA (requeriments 261009_1300, punt 2): si la targeta ha de llegir el
     lead de la seua fitxa (FitxaSnippet.jsx), una sola font, esta línia
     canviarà. Les decisions D1 i D6 no en diuen res. */
  const snippet = targetaDUtilitat('Snippet');
  expect(snippet.querySelector('img.sp-card-media').getAttribute('src')).toBe('/assets/nano_cards/snippet_nano_card.jpg');
  expect(within(snippet).getByRole('heading', { level: 4 }).textContent).toBe('Extensió de Chrome per a desar webs al Bloc');
  expect(snippet.querySelector('p.sp-card-text')).toBeNull();
});

/* L'enllaç és un Link del router: navega dins del router (en memòria a
   WordPress) i, amb base, la porta a l'href; la barra d'adreces de
   l'amfitrió no es toca. /plugin/:id és una ruta d'App i tots els ids són
   del registre: cap ruta fictícia. */
test('P7-B · cada targeta obri /plugin/<id> pel router; amb base, l’href la porta i l’amfitrió no es mou', () => {
  expect(fontApp.includes('<Route path="/plugin/:id"')).toBe(true);
  for (const plugin of PLUGINS_DE_BAIX) {
    pinta();
    fireEvent.click(within(targetaDUtilitat(plugin.titol)).getByRole('link', { name: plugin.titol }));
    expect(ubicacio(), plugin.id).toBe(`/plugin/${plugin.id}`);
    cleanup();
  }
  const adrecaDeLAmfitrio = window.location.href;
  render(
    <MemoryRouter rutaInicial="/control" basename="/poble">
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>
  );
  const salut = within(targetaDUtilitat('Salut')).getByRole('link', { name: 'Salut' });
  expect(salut.getAttribute('href')).toBe('/poble/plugin/salut');
  fireEvent.click(salut);
  expect(ubicacio()).toBe('/plugin/salut');
  expect(window.location.href).toBe(adrecaDeLAmfitrio);
});

/* El peu va a la mateixa pàgina que obri la targeta: Compartir en comparteix
   l'adreça (mai /control a seques), Comentar avisa que /plugin/<id> encara
   no té xat comú (PAGINES_AMB_XAT, com les pàgines de dalt) i Traduir porta
   al traductor de les targetes.
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6), per a
   Comentar: és el missatge directe a l'autor, el xat corporatiu (la prova
   següent). Compartir i Traduir no canvien. */
test('P7-B · el peu de cada utilitat: Compartir, la seua pàgina; Traduir, el de les targetes', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  try {
    pinta();
    const targetes = targetesDUtilitats();
    for (let index = 0; index < targetes.length; index += 1) {
      const titol = titolDeTargeta(targetes[index]);
      fireEvent.click(within(targetes[index]).getByRole('button', { name: `Compartir ${titol}` }));
      await waitFor(() => expect(share).toHaveBeenCalledTimes(index + 1));
      const [{ title, url }] = share.mock.calls[index];
      expect([title, url.endsWith(PAGINA_DUTILITAT.get(titol))], titol).toEqual([titol, true]);
    }
    expect(ubicacio()).toBe('/control');
    fireEvent.click(within(targetes[0]).getByRole('button', { name: `Traduir ${titolDeTargeta(targetes[0])}` }));
    expect(ubicacio()).toBe('/traduccions');
  } finally {
    delete navigator.share;
  }
});

/* T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · Comentar de cada
   utilitat (i del Snippet) és el missatge directe a l'autor, Sóc de Poble:
   el xat corporatiu (en seed, el de la llavor). Mai l'avís de xat comú.
   Ordre del Mestre (261007) · «COMENTARIS = XAT» (correcció C2) · Ja no hi
   va directe: Comentar obri el menú de dues vies de totes les targetes.
   «En privat» és este xat; «En públic» es queda desactivada (/plugin/<id> i
   la fitxa del Snippet no tenen xat públic) i el clic no fa res. */
test('261007 · Comentar de cada utilitat obri el menú: «En privat», el xat de Sóc de Poble; «En públic», desactivada', () => {
  pinta();
  const total = targetesDUtilitats().length;
  expect(total).toBeGreaterThan(1);
  for (let index = 0; index < total; index += 1) {
    cleanup();
    estat.toast.mockClear();
    pinta();
    const targeta = targetesDUtilitats()[index];
    const titol = titolDeTargeta(targeta);
    const vies = obriComentar(targeta, titol);
    expect(vies.public.getAttribute('aria-disabled'), titol).toBe('true');
    fireEvent.click(vies.public);
    expect(ubicacio(), titol).toBe('/control');
    fireEvent.click(vies.privat);
    expect(ubicacio(), titol).toBe('/xat?amb=socdepoble');
    expect(estat.toast, titol).not.toHaveBeenCalled();
  }
}, 30_000);

/* W4-08 · Decisió del Mestre (Acta 261004_0206, §4), que substituïx la doble
   presència del prompt 261004_0015 §3: Mapa, Vehicle Compartit i Animalets
   viuen NOMÉS dalt, com a targetes de publicació (W4-04, posicions 4, 5 i 6).
   Baix no hi ha cap targeta d'eina seua ni cap enllaç a /plugin/<id>; la
   seua pàgina d'eina continua servida per App (/plugin/:id). */
test('P7-B · W4-08 · Mapa, Vehicle Compartit i Animalets només dalt: cap targeta ni enllaç d’eina a les graelles de baix', () => {
  pinta();
  expect(targetesDeDalt().slice(3, 6).map(titolDe)).toEqual(['Publicar al Mapa', 'Vehicle Compartit', 'Animalets']);
  const deBaix = SECCIONS_DUTILITATS.map(seccioDe);
  expect(deBaix.every(Boolean)).toBe(true);
  for (const [titol, id] of NOMES_DALT) {
    expect(IDS_PLUGINS, id).toContain(id);
    expect(targetaDUtilitat(titol), titol).toBeUndefined();
    for (const seccio of deBaix) {
      expect(seccio.querySelector(`a[href="/plugin/${id}"]`), `${titol} baix`).toBeNull();
      expect(within(seccio).queryByRole('link', { name: titol }), `${titol} baix`).toBeNull();
    }
    /* Ni dalt ni enlloc del Panell: la targeta de dalt porta a /page/<clau>. */
    expect(document.querySelector(`[href="/plugin/${id}"]`), titol).toBeNull();
  }
  /* Cap targeta de baix repetix un id que ja té targeta dalt. */
  const titolsDeDalt = PLUGINS.filter((plugin) => IDS_DE_DALT.has(plugin.id)).map((plugin) => plugin.titol);
  expect(utilitats().filter((titol) => titolsDeDalt.includes(titol))).toEqual([]);
});

/* Cap text ni cap il·lustració dels plugins es copia al Panell: tot es llig de
   registrePlugins.js.
   Onada 10 (261010; decisió M4 del Mestre) · Tampoc els camps nous de la
   targeta canònica: ni la data ni el text de les etiquetes del registre.
   Onada 11 (261010; prompt 261010_1730, tasca 6, D5) · DEROGADA l'excepció
   del Snippet («el text de la seua constant sí que ha de ser al Panell, una
   sola vegada com a dada»): les seues etiquetes viuen a destiSnippet.js, com
   la data, i el Panell les llig (SNIPPET.etiquetes = ETIQUETES_DEL_SNIPPET). */
test('P7-B · cap text, imatge, data ni etiqueta dels plugins és copiat a ControlSection.jsx', () => {
  const delSnippet = new Set(ETIQUETES_DEL_SNIPPET.map(([text]) => text));
  const ambData = PLUGINS.filter((plugin) => plugin.data);
  expect(ambData.length).toBeGreaterThan(0);
  for (const plugin of PLUGINS) {
    const etiquetes = plugin.etiquetes.map((etiqueta) => etiqueta.text).filter((text) => !delSnippet.has(text));
    const valors = [plugin.subtitol, plugin.entradilla, plugin.imatgeAlt, `${plugin.id}_vinyeta`, ...etiquetes];
    if (plugin.data) valors.push(plugin.data, plugin.data.slice(0, 10));
    for (const valor of valors) {
      expect(fontControl.includes(valor), `${plugin.id}: ${valor}`).toBe(false);
    }
  }
  /* Cada plugin amb etiquetes en porta almenys una que NO és del Snippet: la
     comprovació de dalt no es queda buida per a cap. */
  for (const plugin of PLUGINS.filter((p) => p.etiquetes.length > 0)) {
    expect(plugin.etiquetes.some((etiqueta) => !delSnippet.has(etiqueta.text)), plugin.id).toBe(true);
  }
  /* Onada 11 (D5) · Els textos de les etiquetes del Snippet tampoc s'escriuen
     al Panell: viuen a destiSnippet.js i el Panell en llig la constant. */
  for (const text of delSnippet) {
    expect([text, fontControl.includes(`'${text}'`)]).toEqual([text, false]);
  }
  expect(fontControl).toContain('etiquetes: ETIQUETES_DEL_SNIPPET');
  /* La data del Snippet tampoc s'escriu al Panell: viu a destiSnippet.js. */
  expect(fontControl.includes(DATA_DEL_SNIPPET)).toBe(false);
  /* I el Panell llig els dos camps del registre, als tres llocs de crida. */
  expect(fontControl.split('data={plugin.data}').length - 1).toBe(3);
  expect(fontControl.split('etiquetes={plugin.etiquetes}').length - 1).toBe(3);
});

/* La preferència de DetallEspai és d'EXCLUSIÓ: una utilitat s'amaga només amb
   un false explícit. Sense preferència, malmesa, d'una altra forma o amb
   qualsevol altre valor (true, 0, null, 'false'), es veuen totes les del
   registre i el Snippet. La preferència no toca mai les targetes de dalt. */
test('P7-B · la preferència només amaga una utilitat amb un false explícit; per defecte es veuen totes', () => {
  const valors = [
    null, '{}', 'no és JSON', 'null', '[]', '5', '"gestoria"',
    JSON.stringify(TOTES_LES_UTILITATS),
    JSON.stringify({ gestoria: 0, cervell: null, rss: 'false', snippet: 'no', salut: true })
  ];
  for (const valor of valors) {
    if (valor === null) localStorage.removeItem(CLAU_UTILITATS);
    else localStorage.setItem(CLAU_UTILITATS, valor);
    pinta();
    expect(senseSnippet(utilitats()), String(valor)).toEqual(TITOLS_DE_BAIX);
    expect(utilitats(), String(valor)).toContain('Snippet');
    /* Onada 10 (261010) · I cap de les tres pàgines que han eixit del Panell,
       diga el que diga la preferència (abans, Onada 8: hi eren totes tres). */
    expect(utilitats().filter((titol) => TITOLS_FORA_DEL_PANELL.includes(titol)), String(valor)).toEqual([]);
    cleanup();
  }
  /* Una clau aliena (`inventada`) no amaga res. */
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ gestoria: false, mapa: false, snippet: false, inventada: false, salut: true }));
  pinta();
  expect(utilitats()).toEqual(PLUGINS_DE_BAIX.filter((plugin) => plugin.id !== 'gestoria').map((plugin) => plugin.titol));
  expect(utilitats()).not.toContain('Snippet');
  cleanup();
  /* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
     DEROGAT «`metriques` és l'id del Perfil per a la Consola i també
     l'amaga» (peça C, 261007) i «cada pàgina de la maquinària s'amaga per la
     seua clau» (Onada 8): la Consola, el Cervell i Disseny ja no tenen
     targeta al Panell. Les claus que algú ja tinga desades ('metriques',
     'consola', 'cervell', 'disseny') són ara alienes: no amaguen res, no
     fan aparéixer res i no s'esborren. */
  const VELLES = { metriques: false, consola: false, cervell: false, disseny: false };
  for (const preferencia of [{ metriques: false }, VELLES, { metriques: true, consola: true, cervell: true, disseny: true }]) {
    const desada = JSON.stringify(preferencia);
    localStorage.setItem(CLAU_UTILITATS, desada);
    pinta();
    expect(senseSnippet(utilitats()), desada).toEqual(TITOLS_DE_BAIX);
    expect(utilitats(), desada).toContain('Snippet');
    expect(targetesDe(seccioDe('Maquinària i Sistema')).map(titolDeTargeta), desada).toEqual(['Lector RSS', 'TPV del Bar']);
    expect(localStorage.getItem(CLAU_UTILITATS), desada).toBe(desada);
    cleanup();
  }
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ gestoria: false, mapa: false, snippet: false, inventada: false, salut: true }));
  pinta();
  /* Dalt, el Mapa continua a la seua posició i el Panell, sencer. */
  expect(targetesDeDalt()[3].querySelector('.sp-card-title').textContent).toBe('Publicar al Mapa');
  expect(screen.getByRole('button', { name: /Missatges per a dubtes/ })).toBeTruthy();
});

test('CU · la targeta del Snippet obri la seua fitxa sobre la mateixa ruta, a /control i a /utilitats', () => {
  for (const ruta of ['/control', '/utilitats']) {
    pinta(ruta);
    expect(screen.getByRole('link', { name: 'Snippet' }).getAttribute('href'), ruta).toBe(`${ruta}?fitxa=snippet`);
    fireEvent.click(screen.getByRole('link', { name: 'Snippet' }));
    expect(ubicacio(), ruta).toBe(`${ruta}?fitxa=snippet`);
    expect(document.querySelector('[data-titol="pagina"]').textContent, ruta).toBe('Snippet');
    expect(screen.getByRole('heading', { level: 2, name: 'Què és' })).toBeTruthy();
    expect(screen.getByText('Instal·la a Chrome').closest('.sdp-control-actions'), ruta).toBeTruthy();
    expect(screen.queryByText('Utilitats i Connectors (Plugins)'), ruta).toBeNull();
    cleanup();
  }
});

/* CU · Correcció de la revisió · Obrir la fitxa només canvia la consulta: App
   no mou el focus (mira el camí) i ningú torna a dalt el desplaçador del
   contingut. Al mòbil, la fitxa s'obria al final, amb el títol i el botó
   amagats per dalt i el focus al <body>. jsdom no fa maquetació: el
   desplaçador és un element amb overflow-y (el llig getComputedStyle) i unes
   mides fixades a mà, com a enllacosInterns.test.js. */
function Arrere() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Arrere</button>;
}

/* <main> > desplaçador > l'app, o, amb `deLAmfitrio`, desplaçador > <main> > l'app. */
function pintaDinsDeLApp({ ruta = '/control', posicio = 4000, deLAmfitrio = false } = {}) {
  const main = document.createElement('main');
  main.tabIndex = -1;
  const desplacador = document.createElement('div');
  desplacador.style.setProperty('overflow-y', 'auto');
  Object.defineProperty(desplacador, 'scrollHeight', { configurable: true, value: 6000 });
  Object.defineProperty(desplacador, 'clientHeight', { configurable: true, value: 750 });
  desplacador.scrollTop = posicio;
  const contenidor = document.createElement('div');
  if (deLAmfitrio) {
    main.append(contenidor);
    desplacador.append(main);
    document.body.append(desplacador);
  } else {
    desplacador.append(contenidor);
    main.append(desplacador);
    document.body.append(main);
  }
  render(
    <MemoryRouter rutaInicial={ruta}>
      <ControlSection />
      <Ubicacio />
      <Arrere />
    </MemoryRouter>,
    { container: contenidor }
  );
  return { main, desplacador, treu: () => (deLAmfitrio ? desplacador : main).remove() };
}

test('CU · la fitxa s’obri des de dalt amb el focus a <main>, i en tornar arrere el Panell és on era', () => {
  const { main, desplacador, treu } = pintaDinsDeLApp({ posicio: 4000 });
  try {
    expect(document.activeElement).toBe(document.body);
    /* P7-B · La targeta del Snippet és ara un enllaç (la UniversalCard canònica). */
    fireEvent.click(screen.getByRole('link', { name: 'Snippet' }));
    expect(ubicacio()).toBe('/control?fitxa=snippet');
    expect(desplacador.scrollTop).toBe(0);
    expect(document.activeElement).toBe(main);

    /* La persona baixa per la fitxa, el focus se'n va, i torna arrere. */
    desplacador.scrollTop = 300;
    screen.getByRole('button', { name: 'Arrere' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Arrere' }));
    expect(ubicacio()).toBe('/control');
    expect(screen.getByText('Snippet', { selector: '.sp-card-title' })).toBeTruthy();
    expect(desplacador.scrollTop).toBe(4000);
    expect(document.activeElement).toBe(main);
  } finally {
    treu();
  }
});

test('CU · en entrar directament a la fitxa no es mou res, i el desplaçador de l’amfitrió no és nostre', () => {
  const directa = pintaDinsDeLApp({ ruta: '/control?fitxa=snippet', posicio: 700 });
  try {
    expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Snippet');
    expect(directa.desplacador.scrollTop).toBe(700);
    expect(document.activeElement).toBe(document.body);
  } finally {
    directa.treu();
  }
  cleanup();

  const amfitrio = pintaDinsDeLApp({ posicio: 4000, deLAmfitrio: true });
  try {
    fireEvent.click(screen.getByRole('link', { name: 'Snippet' }));
    expect(ubicacio()).toBe('/control?fitxa=snippet');
    expect(amfitrio.desplacador.scrollTop).toBe(4000);
    expect(document.activeElement).toBe(amfitrio.main);
  } finally {
    amfitrio.treu();
  }
});

test('CU · un enllaç a la fitxa l’obri directament; una fitxa que no existix pinta el Panell', () => {
  pinta('/control?fitxa=snippet');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Snippet');
  cleanup();
  pinta('/utilitats?fitxa=brossa');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Panell de Control');
  expect(utilitats()).toContain('Snippet');
});

/* ═══ P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció»,
   aprovat pel Mestre el 261003, amb el W4-04 alçat per a la presentació) ═══
   ESMENA 261003 22:34 (directrius 2234 i 2245 del Mestre) · Les sis targetes
   de dalt són UniversalCards estàndard, en la graella de sempre, amb la boina
   de socdepoble, títol, subtítol i entradilla visibles (els de la seua
   pàgina) i dues portes (destinsControl.js). */
/* La secció de dalt és la que porta aria-labelledby (el seu h2 canvia de llengua). */
const targetesDeDalt = () => [
  ...document.querySelectorAll('section[aria-labelledby] > .sdp-card-grid > article.sp-card')
];
const titolDe = (targeta) => targeta.querySelector('.sp-card-title').textContent;
const TITOLS_2245 = ['Publicar al Mur', 'Publicar al Mercat', 'Publicar al Calendari', 'Publicar al Mapa', 'Vehicle Compartit', 'Animalets'];
/* W4-08 · I darrere, les dues que MarIA hi ha afegit (261004 01:10). */
const TITOLS_DALT = [...TITOLS_2245, 'Treball', 'Habitatge'];
const PAGINES = ['publicar_mur', 'publicar_mercat', 'publicar_calendari', 'publicar_mapa', 'vehicle_compartit', 'animalets', 'treball', 'habitatge'];
/* La pastilla de la boina de cada targeta: la data de la seua pàgina. */
const DATES_DALT = [...Array(6).fill(['22:45', '03/10/26']), ['01:10', '04/10/26'], ['01:10', '04/10/26']];
/* Sense el punt final del text (llevaPuntFinal), com tota targeta. */
const sensePunt = (text) => text.replace(/\.$/, '');

test('P5 · W4-08 · huit targetes estàndard en ordre, a la graella de sempre amb el seu h2, i cap és un enllaç sencer', () => {
  pinta();
  const h2 = screen.getByRole('heading', { level: 2, name: 'Publica al poble' });
  const graella = h2.closest('section').querySelector('.sdp-card-grid');
  expect(h2.closest('section').getAttribute('aria-labelledby')).toBe(h2.id);
  expect(graella.className).toBe('sdp-card-grid');
  expect(targetesDeDalt().map(titolDe)).toEqual(TITOLS_DALT);
  expect(targetesDeDalt()).toHaveLength(DESTINS_CONTROL.length);
  targetesDeDalt().forEach((targeta, index) => {
    const pagina = PAGE_COPY[PAGINES[index]];
    const titol = titolDe(targeta);
    /* La targeta de sempre: cap variant i cap overlay.
       P6 (directriu 2325, confirmació 2) · I el peu blau de sempre, al final,
       amb Traduir, Comentar i Compartir; sense etiquetes.
       Onada 8 (261009; revisió R3 derogada) · I Connectar, i el copyright.
       Abans, «sense Connectar». */
    expect(targeta.className, titol).toBe('sp-card');
    expect(targeta.querySelector('.sp-card-link-overlay'), titol).toBeNull();
    expect(targeta.lastElementChild.className, titol).toBe('sp-card-footer');
    expect([...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label')), titol).toEqual(PEU_SENCER(titol));
    expect(targeta.querySelector('.sp-card-copyright__enllac').textContent, titol).toBe(COPYRIGHT_SDP);
    expect(targeta.querySelector('.sp-card-labels'), titol).toBeNull();
    /* Títol, subtítol i entradilla visibles: els de la pàgina de la targeta. */
    expect(within(targeta).getByRole('heading', { level: 3, name: titol }).classList.contains('sdp-sr-only'), titol).toBe(false);
    expect(within(targeta).getByRole('heading', { level: 4 }).textContent, titol).toBe(sensePunt(pagina.subtitle));
    expect(targeta.querySelector('p.sp-card-text').textContent, titol).toBe(pagina.lead);
    expect(targeta.querySelectorAll('.sp-card-body > .sp-card-portes > .sp-card-porta'), titol).toHaveLength(2);
  });
});

/* Directriu 2234, punt 3 · La boina és l'entitat socdepoble, no la IAIA:
   l'autor (tret de la data i l'hora) obri el seu xat corporatiu.
   P6 (directriu 2325, confirmació 2) · Exactament la boina del Mur: autor,
   lloc i data i hora, dalt de tot. En seed, el xat de la llavor.
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6, deroga
   W4-09/2234 per a la boina): l'autor porta SEMPRE a la seua pàgina, la del
   projecte (/projecte). El xat corporatiu és ara Comentar del peu. */
test('P5 · T6 · la boina de cada targeta és socdepoble: l’autor obri la pàgina del projecte i la data, el Calendari', () => {
  pinta();
  for (const [index, targeta] of targetesDeDalt().entries()) {
    const capcal = targeta.querySelector('header.sp-card-header');
    expect(targeta.firstElementChild, titolDe(targeta)).toBe(capcal);
    expect(capcal.querySelector('.sp-card-author-location').textContent, titolDe(targeta)).toBe('La Torre de les Maçanes');
    expect([...capcal.querySelectorAll('.btn-date-time span')].map((s) => s.textContent), titolDe(targeta)).toEqual(DATES_DALT[index]);
    expect(capcal.querySelector('.sp-card-author-name').textContent, titolDe(targeta)).toBe('Sóc de Poble');
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href'), titolDe(targeta)).toBe(RUTA_PERFIL_PROJECTE);
    expect(capcal.textContent, titolDe(targeta)).not.toMatch(/IAIA|MarIA/);
    expect(capcal.querySelector('.sp-card-meta button.btn-date-time').closest('a'), titolDe(targeta)).toBeNull();
  }
  fireEvent.click(targetesDeDalt()[3].querySelector('a.sp-card-author-link'));
  expect(ubicacio()).toBe(RUTA_PERFIL_PROJECTE);
  cleanup();
  pinta();
  fireEvent.click(targetesDeDalt()[0].querySelector('button.btn-date-time'));
  expect(ubicacio()).toBe('/calendari?mes=2026-10');
});

/* W4-08 · Totes porten il·lustració (el Mapa ja té la seua vinyeta): les Nano
   de Mur, Mercat i Calendari i la vinyeta del plugin de la resta. Cap targeta
   pinta la icona a la insígnia lateral.
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T8,
   «imatges fantasma»): la imatge és la capçalera (hero) de la pàgina de cada
   targeta, amb el seu text alternatiu (PAGE_COPY image i imageAlt). Vehicle
   Compartit porta el SEAT 600 de la seua pàgina, no «El Titi»; Animalets, la
   seua Nano. Ja no és decorativa: diu el mateix que el hero. */
test('P5 · T8 · la imatge de cada targeta és el hero de la seua pàgina, amb el seu alt; cap targeta porta icona a la insígnia lateral', () => {
  pinta();
  const targetes = targetesDeDalt();
  const esperades = [
    ['mur', '/assets/nano_cards/mur_nano_card.jpg'],
    ['mercat', '/assets/nano_cards/mercat_nano_card.webp'],
    ['calendari', '/assets/nano_cards/calendari_nano_card.jpg'],
    ['mapa', '/assets/ui/plugins/mapa_vinyeta.jpg'],
    ['vehicle', '/assets/nano_cards/vehicle_nano_card.jpg'],
    ['animalets', '/assets/nano_cards/animalets_nano_card.jpg'],
    ['treball', '/assets/ui/plugins/treball_vinyeta.jpg'],
    ['habitatge', '/assets/ui/plugins/habitatge_vinyeta.jpg']
  ];
  expect(targetes).toHaveLength(esperades.length);
  for (const [index, [id, src]] of esperades.entries()) {
    const pagina = PAGE_COPY[PAGINES[index]];
    const imatge = targetes[index].querySelector('img.sp-card-media');
    /* Targeta == hero: la mateixa imatge i el mateix alt que la pàgina. */
    expect([id, imatge.getAttribute('src'), imatge.getAttribute('alt')]).toEqual([id, src, pagina.imageAlt]);
    expect([id, src]).toEqual([id, pagina.image]);
    expect(targetes[index].querySelector('.sp-card-calendar-badge svg.lucide-map-pin'), id).toBeNull();
  }
  /* «El Titi» (la vinyeta del plugin Vehicle) ja no és a cap targeta de dalt. */
  expect(targetes.some((targeta) => targeta.innerHTML.includes('vehicle_vinyeta'))).toBe(false);
});

/* T8 · L'anatomia de la targeta (D-B, 261004): boina dalt de tot, després la
   imatge, el cos i el peu. Mesurat al DOM de cada targeta del Panell. */
test('T8 · D-B · cada targeta de dalt: boina → imatge → cos → peu', () => {
  pinta();
  for (const targeta of targetesDeDalt()) {
    expect([titolDe(targeta), [...targeta.children].map((fill) => fill.className)]).toEqual([
      titolDe(targeta), ['sp-card-header', 'sp-card-media-container', 'sp-card-body', 'sp-card-footer']
    ]);
  }
});

/* W4-04 · La prova que bloqueja una tercera regressió (PRD §9): Mapa,
   Vehicle Compartit i Animalets, a les posicions 4, 5 i 6, amb el títol i el
   subtítol literals, i Publicar que no navega.
   ESMENA 261003 22:34 · Els literals són ara els de 2245 («Vehicle
   Compartit» i «Animalets» en lloc de «Compartir vehicle» i «Animalets i
   mascotes»): el Mestre els ha fixat com a definitius. «Saber-ne més» obri la
   pàgina de cada targeta, que ara existix; publicar continua en obres.
   P6 (directriu 2325, confirmació 2) · Abans l'invariant exigia també la
   píndola «EN OBRES». El Mestre l'ha llevada: les targetes amb portes no
   porten cap etiqueta. L'estat «en obres» el diu ara la porta Publicar
   inerta (aria-disabled, «(en obres)» al nom i el toast), i això és el que
   esta prova vigila. Posicions, títols literals i porta inerta no canvien. */
test('W4-04 · Mapa, Vehicle Compartit i Animalets: posicions 4, 5 i 6, text literal, cap etiqueta i Publicar inert', () => {
  pinta();
  const esperades = [
    [3, 'Publicar al Mapa', 'Si tens coses que vols geolocalitzar, este és el lloc', 'Publicar al Mapa', 'Saber-ne més sobre el Mapa', '/page/publicar_mapa'],
    [4, 'Vehicle Compartit', 'Aprofita els seients buits i estalvia en els trajectes', 'Publicar: Vehicle Compartit', 'Saber-ne més: Vehicle Compartit', '/page/vehicle_compartit'],
    [5, 'Animalets', 'Troba, adopta o avisa sobre els animals del poble', 'Publicar: Animalets', 'Saber-ne més: Animalets', '/page/animalets']
  ];
  for (const [posicio, titol, subtitol, nomPublicar, nomSaber, pagina] of esperades) {
    const targeta = targetesDeDalt()[posicio];
    expect(within(targeta).getByRole('heading', { level: 3, name: titol })).toBeTruthy();
    expect(targeta.querySelector('.sp-card-subtitle').textContent).toBe(subtitol);
    expect(targeta.querySelector('.sp-card-labels')).toBeNull();
    expect(within(targeta).queryByText('EN OBRES')).toBeNull();
    const publicar = within(targeta).getByRole('button', { name: `${nomPublicar} (en obres)` });
    expect(publicar.getAttribute('aria-disabled')).toBe('true');
    for (const zona of [publicar, targeta.querySelector('.sp-card-body'), targeta.querySelector('.sp-card-media-container')].filter(Boolean)) {
      fireEvent.click(zona);
      expect(ubicacio(), titol).toBe('/control');
    }
    expect(estat.toast).toHaveBeenLastCalledWith(`“${nomPublicar}” encara està en obres.`);
    expect(within(targeta).getByRole('link', { name: nomSaber }).getAttribute('href')).toBe(pagina);
  }
  for (const targeta of targetesDeDalt().slice(0, 3)) expect(targeta.querySelector('.sp-card-labels'), titolDe(targeta)).toBeNull();
  /* «Saber-ne més» del Mapa obri la seua pàgina. */
  fireEvent.click(screen.getByRole('link', { name: 'Saber-ne més sobre el Mapa' }));
  expect(ubicacio()).toBe('/page/publicar_mapa');
});

test('P5 · les portes obertes: Publicar al Mur → /notes i cada Saber-ne més → la UniversalPage de la targeta', () => {
  const esperades = [
    ['Publicar al Mur', '/notes'],
    ['Saber-ne més sobre el Mur', '/page/publicar_mur'],
    ['Saber-ne més sobre el Mercat', '/page/publicar_mercat'],
    ['Saber-ne més sobre el Calendari', '/page/publicar_calendari'],
    ['Saber-ne més sobre el Mapa', '/page/publicar_mapa'],
    ['Saber-ne més: Vehicle Compartit', '/page/vehicle_compartit'],
    ['Saber-ne més: Animalets', '/page/animalets'],
    /* W4-08 · Treball i Habitatge (MarIA, 261004). */
    ['Saber-ne més: Treball', '/page/treball'],
    ['Saber-ne més: Habitatge', '/page/habitatge']
  ];
  pinta();
  /* Totes les portes obertes, en l'ordre del DOM, amb el seu nom accessible. */
  expect([...document.querySelectorAll('a.sp-card-porta')].map((enllac) => enllac.getAttribute('href')))
    .toEqual(esperades.map(([, desti]) => desti));
  for (const [nom, desti] of esperades) expect(screen.getByRole('link', { name: nom }).getAttribute('href'), nom).toBe(desti);
  for (const nom of ['Publicar al Mercat', 'Publicar al Calendari', 'Publicar: Treball', 'Publicar: Habitatge']) {
    expect(screen.getByRole('button', { name: `${nom} (en obres)` }).getAttribute('aria-disabled')).toBe('true');
  }
  for (const [nom, desti] of esperades) {
    cleanup();
    pinta();
    fireEvent.click(screen.getByRole('link', { name: nom }));
    expect(ubicacio(), nom).toBe(desti);
    expect(esDestiDeLApp(desti), nom).toBe(true);
  }
  /* Tocar la imatge no fa res: només l'autor, la data i les portes són interactius. */
  cleanup();
  pinta();
  fireEvent.click(targetesDeDalt()[0].querySelector('.sp-card-media-container'));
  expect(ubicacio()).toBe('/control');
});

/* El títol, el subtítol i l'entradilla són els textos del Mestre (2245), els
   mateixos de la UniversalPage, que tampoc no passa per l'i18n: en anglés
   es tradueixen el títol de la graella i les portes, no el contingut. */
test('P5 · en anglés, les portes es tradueixen i porten al mateix lloc; el contingut és el del Mestre', () => {
  estat.traductor = createTranslator('en');
  pinta();
  expect(screen.getByRole('heading', { level: 2, name: 'Post to the village' })).toBeTruthy();
  expect(targetesDeDalt().map(titolDe)).toEqual(TITOLS_DALT);
  expect(screen.getByRole('button', { name: 'Publish: Shared Vehicle (under construction)' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Learn more: Animals' }).getAttribute('href')).toBe('/page/animalets');
  /* W4-08 · Les claus noves de Treball i Habitatge, traduïdes. */
  expect(screen.getByRole('button', { name: 'Publish: Jobs (under construction)' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Learn more: Housing' }).getAttribute('href')).toBe('/page/habitatge');
  expect(screen.queryByText('Saber-ne més')).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Publish on the Wall' }));
  expect(ubicacio()).toBe('/notes');
});

/* ═══ P6 · Directriu 261003_2325 del Mestre i notes de Codex (W4-08) ═══
   useAccions només encén el peu per defecte amb hasFooter === true: el Panell
   el passa, amb la pàgina de la targeta (/page/<clau>, la de «Saber-ne més»)
   com a mainHref i com a objecte de Comentar, i sense Connectar. Es prova el
   resultat del clic de cada acció, no només que hi siga.
   T6 (261004) · Comentar ja no és el de l'objecte de la pàgina: és el xat
   corporatiu (vegeu la prova de Comentar).
   Ordre del Mestre (261007) · És el menú de dues vies de totes les targetes:
   el xat corporatiu és la via «En privat». */
const PAGINA_DE = (index) => `/page/${PAGINES[index]}`;
const accioDe = (targeta, verb) => within(targeta).getByRole('button', { name: `${verb} ${titolDe(targeta)}` });

test('P6 · Traduir de cada targeta porta al traductor de les targetes, com al Mur', () => {
  for (let index = 0; index < DESTINS_CONTROL.length; index += 1) {
    pinta();
    fireEvent.click(accioDe(targetesDeDalt()[index], 'Traduir'));
    expect(ubicacio(), String(index)).toBe('/traduccions');
    cleanup();
  }
});

/* La pàgina /page/<clau> encara no és a la llista tancada de pàgines amb xat
   comú (PAGINES_AMB_XAT, data/contracte.js, pendent del Mestre): Comentar de
   la targeta ho diu i no navega. Abans, sense objecte ni pàgina, cap
   targeta del Panell sabia de quina pàgina era. Mai el xat de /control.
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6):
   Comentar és el missatge directe a l'autor (skill sdp-universal-page), i
   l'autor de les targetes del Panell és Sóc de Poble: el xat corporatiu (en
   seed, el de la llavor). Mai el xat de /control ni l'avís de xat comú.
   Ordre del Mestre (261007) · «COMENTARIS = XAT» (correcció C2) · Comentar
   obri el menú de dues vies, com a totes les targetes: «En privat», este
   xat; «En públic», desactivada mentre /page/<clau> no tinga xat públic. */
test('P6 · 261007 · Comentar de cada targeta de dalt obri el menú: «En privat», el xat de Sóc de Poble; «En públic», desactivada', () => {
  for (let index = 0; index < DESTINS_CONTROL.length; index += 1) {
    estat.toast.mockClear();
    pinta();
    const targeta = targetesDeDalt()[index];
    const vies = obriComentar(targeta, titolDe(targeta));
    expect(vies.public.getAttribute('aria-disabled'), titolDe(targeta)).toBe('true');
    fireEvent.click(vies.public);
    expect(ubicacio(), titolDe(targeta)).toBe('/control');
    fireEvent.click(vies.privat);
    expect(ubicacio(), titolDe(targeta)).toBe('/xat?amb=socdepoble');
    expect(estat.toast, titolDe(targeta)).not.toHaveBeenCalled();
    cleanup();
  }
});

test('P6 · Compartir comparteix l’adreça de la pàgina de la targeta (Saber-ne més), mai /control', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  try {
    pinta();
    const targetes = targetesDeDalt();
    for (let index = 0; index < targetes.length; index += 1) {
      fireEvent.click(accioDe(targetes[index], 'Compartir'));
      await waitFor(() => expect(share).toHaveBeenCalledTimes(index + 1));
      const [{ title, url }] = share.mock.calls[index];
      expect([title, url.endsWith(PAGINA_DE(index)), url.includes('/control')]).toEqual([TITOLS_DALT[index], true, false]);
      /* La mateixa pàgina que obri «Saber-ne més». */
      expect(targetes[index].querySelector('a.sp-card-porta.sdp-boto--secundari').getAttribute('href')).toBe(PAGINA_DE(index));
    }
    expect(ubicacio()).toBe('/control');
  } finally {
    delete navigator.share;
  }
});

/* ═══ Revisió R3 (261004) · Proves que no depenen de les decisions pendents del
   Mestre (quantes targetes hi ha dalt i si Mapa, Vehicle Compartit i
   Animalets es repetixen baix) ═══ */

/* La mateixa anatomia dalt i baix (directriu 2325, confirmació 2: «el peu blau
   baix (Traduir, Compartir, Comentar)»). Les targetes de dalt pintaven
   Connectar perquè TargetaDeDesti no passava showConnect={false}, i les
   d'Utilitats no: dos peus distints en el mateix Panell.
   Derogada per l'ordre del Mestre del 261009 (requeriments 261009_1300,
   punt 2: les targetes del Panell «no poden perdre elements» i «han de ser
   autèntiques Universal Cards»; decisió D1 de MarIA): la prova deia «cap
   targeta del Panell porta Connectar». Ara totes el porten, i el copyright,
   dalt, als espais, a les Utilitats i a la Maquinària: el mateix peu de
   quatre accions a tot el Panell. */
test('R3 · Onada 8 · totes les targetes del Panell porten Connectar i el copyright: el mateix peu de quatre accions', () => {
  pinta();
  expect(targetesDeDalt()).toHaveLength(DESTINS_CONTROL.length);
  expect(targetesDUtilitats().length).toBeGreaterThan(0);
  /* Onada 10 (261010) · Dalt i baix són TOTES les targetes del Panell: ja no
     n'hi ha de terceres (abans, les tres pàgines de la maquinària). */
  expect([...targetesDeDalt(), ...targetesDUtilitats()]).toHaveLength(document.querySelectorAll('article.sp-card').length);
  for (const targeta of [...targetesDeDalt(), ...targetesDUtilitats()]) {
    const titol = titolDe(targeta);
    expect(targeta.querySelector('.sp-card-footer > .sp-card-connect').getAttribute('aria-label'), titol).toBe(`Connectar amb ${titol}`);
    expect(targeta.lastElementChild.className, titol).toBe('sp-card-footer');
    expect([...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label')), titol)
      .toEqual(PEU_SENCER(titol));
    const drets = targeta.querySelector('.sp-card-copyright__enllac');
    expect([drets.textContent, drets.getAttribute('href')], titol).toEqual([COPYRIGHT_SDP, RUTA_DRETS_AUTOR]);
  }
});

/* Onada 8 · Connectar porta a /connectar, la ruta d'App, amb l'objecte de la
   targeta: la pàgina de «Saber-ne més» dalt i la de la targeta baix. Cap
   targeta del Panell es queda a /control.
   Onada 10 (261010) · La quarta fila era la primera pàgina de la maquinària
   (/page/consola), que ja no és al Panell: ara és la primera eina de
   «Maquinària i Sistema», que connecta amb la seua pàgina de plugin. */
test('R3 · Onada 8 · Connectar de cada targeta obri /connectar amb la seua pàgina', () => {
  const esperades = [
    [() => targetesDeDalt()[0], '/page/publicar_mur'],
    [() => targetaDUtilitat('Gestoria'), '/plugin/gestoria'],
    [() => targetaDUtilitat('Snippet'), '/control?fitxa=snippet'],
    [() => targetesDe(seccioDe('Maquinària i Sistema'))[0], '/plugin/rss']
  ];
  expect(rutesEstatiques().has('connectar')).toBe(true);
  for (const [targeta, pagina] of esperades) {
    pinta();
    fireEvent.click(targeta().querySelector('.sp-card-connect'));
    const desti = new URL(ubicacio(), 'https://poble.invalid');
    expect([pagina, desti.pathname]).toEqual([pagina, '/connectar']);
    expect([pagina, [...desti.searchParams.values()].some((valor) => valor.includes(pagina))]).toEqual([pagina, true]);
    cleanup();
  }
});

/* ═══ Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
   «Consola Termodinàmica», «El Cervell» i «Disseny Pedra Seca» ixen del
   Panell de Control i viuen només al Mur ═══
   DEROGADA la prova «Onada 8 · la maquinària comença per la Consola, el
   Cervell i Disseny, amb la targeta del Mur i la data del Mestre»
   (requeriments 261009_1300, punt 2; decisions D2, D4, D5 i D7 de MarIA),
   que n'afirmava la targeta, la data, la imatge, el botó «Obrir…» i les
   etiquetes de Disseny. L'ordre nova és la contrària: al Panell no en queda
   res. La targeta de cada una la vigilen ara les proves del Mur. */
test('Onada 10 · «Maquinària i Sistema» és exactament el Lector RSS i el TPV del Bar: la Consola, el Cervell i Disseny ja no són al Panell', () => {
  pinta();
  /* La secció es conserva, amb el seu h2, i porta només les eines del registre. */
  const seccio = seccioDe('Maquinària i Sistema');
  expect(seccio.classList.contains('sdp-control-maquinaria')).toBe(true);
  /* Onada 11 (261010; prompt 261010_1730, tasca 6, D6) · El lead perd
     «configuració de disseny», que ja no té cap targeta al Panell. DEROGAT
     «el lead es conserva literal» de l'Onada 10. */
  expect(seccio.querySelector(':scope > p.lead').textContent.replace(/\s+/g, ' ').trim())
    .toBe("Panells d'administració i eines internes de la plataforma. Aquestes utilitats normalment s'activen només per a l'equip d'administració.");
  expect(seccio.querySelector(':scope > p.lead').textContent).not.toContain('configuració de disseny');
  const eines = PLUGINS.filter((plugin) => ['rss', 'tpv'].includes(plugin.id));
  expect(eines.map((plugin) => plugin.titol)).toEqual(['Lector RSS', 'TPV del Bar']);
  expect(targetesDe(seccio).map(titolDeTargeta)).toEqual(eines.map((plugin) => plugin.titol));
  expect(targetesDe(seccio).map((targeta) => targeta.querySelector('a.sp-card-link-overlay').getAttribute('href')))
    .toEqual(eines.map((plugin) => rutaDelPlugin(plugin.id)));
  /* Cap targeta de tot el Panell porta cap dels tres títols. */
  expect(TITOLS_FORA_DEL_PANELL).toEqual(['Consola Termodinàmica', 'El Cervell', 'Disseny Pedra Seca']);
  const titols = [...document.querySelectorAll('article.sp-card .sp-card-title')].map((titol) => titol.textContent);
  expect(titols.length).toBeGreaterThan(DESTINS_CONTROL.length);
  expect(titols.filter((titol) => TITOLS_FORA_DEL_PANELL.includes(titol))).toEqual([]);
  for (const titol of TITOLS_FORA_DEL_PANELL) expect(screen.queryByText(titol), titol).toBeNull();
  /* Cap enllaç a la seua pàgina ni a l'eina on portava el botó «Obrir…». */
  const hrefs = [...document.querySelectorAll('[href]')].map((element) => element.getAttribute('href'));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs.filter((href) => RUTES_FORA_DEL_PANELL.includes(href.split(/[?#]/)[0]))).toEqual([]);
  for (const clau of CLAUS_FORA_DEL_PANELL) expect(document.querySelector(`[href="/plugin/${clau}"]`), clau).toBeNull();
  expect(screen.queryByRole('link', { name: 'Obrir la Consola' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Obrir el Cervell' })).toBeNull();
  /* Cap botó gran a cap targeta del Panell (la ranura `accio` de la targeta del Mur). */
  expect(document.querySelector('.sp-card-accio')).toBeNull();
  /* I la font del Panell ja no nomena la maquinària que les pintava. */
  for (const nom of ['TargetaDelMur', 'targetesDeSistema', 'PAGINES_MAQUINARIA']) {
    expect(fontControl.includes(nom), nom).toBe(false);
  }
  for (const nom of ['useCoreContent', 'accioDeLaPagina']) expect(fontControl.includes(nom), nom).toBe(false);
});

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4:
   «totes les targetes de plugin del Panell passen a targeta canònica»).
   DEROGADA la prova «Onada 8 · D6 i D7 · cap data per a les eines; cap
   etiqueta fora de les pàgines de la maquinària». L'ordre nova: les sis
   targetes de plugin (Gestoria, Rebost Domèstic, Salut, Lector RSS, TPV del
   Bar i el Snippet) porten la franja taronja amb la data i l'hora de la seua
   font, i les etiquetes Categoria i Etiqueta; continuen sense botó gran ni
   portes. La D6 es conserva en el que valia: cap data INVENTADA (la que es
   pinta és, lletra per lletra, la de la font). La P6 («cap etiqueta») val
   ara només per a les huit targetes de dalt. */
test('Onada 10 · M4 · les sis targetes de plugin són canòniques: data i hora de la seua font, Categoria i Etiqueta, i cap botó gran ni porta', () => {
  pinta();
  const targetes = targetesDUtilitats();
  expect(targetes.map(titolDeTargeta)).toEqual(['Gestoria', 'Rebost Domèstic', 'Salut', 'Snippet', 'Lector RSS', 'TPV del Bar']);
  for (const targeta of targetes) {
    const titol = titolDeTargeta(targeta);
    const font = fontDeLaTargeta(titol);
    expect(font, titol).not.toBeNull();
    /* La franja taronja: UNA pastilla, un botó dins de la boina, amb els
       mateixos textos que dataHoraDeBarra trau de la data de la font. */
    const pastilles = targeta.querySelectorAll('.btn-date-time');
    expect(pastilles, titol).toHaveLength(1);
    expect(pastilles[0].matches('header.sp-card-header .sp-card-meta > button.btn-date-time'), titol).toBe(true);
    expect(pastillaEsperada(font.data).length, titol).toBeGreaterThan(0);
    expect(pastillaDe(targeta), titol).toEqual(pastillaEsperada(font.data));
    /* Les etiquetes: exactament les de la font, una Categoria i una Etiqueta, sense enllaç. */
    expect(font.etiquetes.map(([, classe]) => classe), titol).toEqual(['sdp-badge-category', 'sdp-badge-tag']);
    expect(etiquetesDe(targeta), titol).toEqual(etiquetesEsperades(font.etiquetes));
    expect(targeta.querySelector('ul.sp-card-labels [href]'), titol).toBeNull();
    /* Cap botó gran ni cap porta: la targeta de plugin no n'ha portat mai. */
    expect(targeta.querySelector('.sp-card-accio'), titol).toBeNull();
    expect(targeta.querySelector('.sp-card-portes'), titol).toBeNull();
    expect(targeta.querySelector('.sp-card-porta'), titol).toBeNull();
  }
  /* Les del registre: la data amb hora (el dia i l'hora del registre). */
  for (const plugin of PLUGINS_DE_BAIX) {
    expect([plugin.id, typeof plugin.data, plugin.etiquetes.length]).toEqual([plugin.id, 'string', 2]);
    const { time, date } = dataHoraDeBarra({ creat: plugin.data });
    expect([plugin.id, time !== '', date !== '']).toEqual([plugin.id, true, true]);
    expect([plugin.id, pastillaDe(targetaDUtilitat(plugin.titol))]).toEqual([plugin.id, [time, date]]);
  }
  /* El Snippet: només el dia (cap font en documenta l'hora, i no s'inventa);
     les seues dues etiquetes, les de l'esborrany de l'ordre. */
  const snippet = targetaDUtilitat('Snippet');
  expect(DATA_DEL_SNIPPET).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(pastillaDe(snippet)).toEqual([dataHoraDeBarra({ creat: DATA_DEL_SNIPPET }).date]);
  expect(pastillaDe(snippet)).toEqual(['03/10/26']);
  expect(etiquetesDe(snippet)).toEqual([['Eina', 'sp-card-label sdp-badge-category'], ['Extensió', 'sp-card-label sdp-badge-tag']]);
  /* La pastilla porta al Calendari, al mes de la data, com la de les targetes de dalt. */
  fireEvent.click(targetaDUtilitat('Salut').querySelector('button.btn-date-time'));
  expect(ubicacio()).toBe('/calendari?mes=2026-10');
  /* Les huit de dalt no canvien: la data de la seua pàgina i cap etiqueta (P6). */
  cleanup();
  pinta();
  expect(targetesDeDalt()).toHaveLength(DESTINS_CONTROL.length);
  for (const targeta of targetesDeDalt()) {
    expect(targeta.querySelector('.sp-card-labels'), titolDe(targeta)).toBeNull();
    expect(targeta.querySelectorAll('.btn-date-time'), titolDe(targeta)).toHaveLength(1);
  }
});

/* D3 per a la graella de baix. La passada de D3 només prem
   button.sp-card-link-overlay, i les utilitats són enllaços
   (a.sp-card-link-overlay). Cada targeta pintada porta, pel router, a
   /plugin/<id> d'un id del registre (App la servix amb /plugin/:id) o a la
   fitxa del Snippet. Cap utilitat es repetix baix, i cap utilitat del registre
   que no té targeta dalt hi falta. */
const esPaginaDePlugin = (ruta) => {
  const trobat = /^\/plugin\/([^/?#]+)$/.exec(ruta);
  return Boolean(trobat) && fontApp.includes('<Route path="/plugin/:id"') && IDS_PLUGINS.includes(decodeURIComponent(trobat[1]));
};

test('R3 · D3 · cada utilitat pintada obri una pàgina que servix App, i cap es repetix ni falta', () => {
  pinta();
  const titols = utilitats();
  expect(new Set(titols).size).toBe(titols.length);
  const idsDeDalt = new Set(DESTINS_CONTROL.map((desti) => desti.id));
  for (const plugin of PLUGINS.filter((p) => !idsDeDalt.has(p.id))) expect(titols, plugin.id).toContain(plugin.titol);
  for (let index = 0; index < titols.length; index += 1) {
    cleanup();
    pinta();
    const targeta = targetesDUtilitats()[index];
    const plugin = PLUGINS.find((p) => p.titol === titols[index]);
    fireEvent.click(targeta.querySelector('a.sp-card-link-overlay'));
    const desti = ubicacio();
    expect(desti, titols[index]).toBe(plugin ? rutaDelPlugin(plugin.id) : '/control?fitxa=snippet');
    expect(esPaginaDePlugin(desti) || esDestiDeLApp(desti), titols[index]).toBe(true);
  }
});

/* W4-11 · La graella no decidix la disponibilitat: cap targeta porta a
   plugin.obrir a seques (ni a /consola, /app/… o /disseny); «Obrir» el decidix
   la pàgina del plugin amb useDestiDelPlugin, que passa pels interruptors.
   L'Onada 8 (261009; decisions D3 i D7 de MarIA) en va fer una excepció per a
   les tres pàgines del sistema, que portaven el botó «Obrir…» de la seua
   pàgina. DEROGADA per l'Onada 10 (261010; pla 261010_1121; decisió del
   Mestre del 261010): les tres ixen del Panell, la prova que vigilava
   l'excepció («Onada 8 · la maquinària comença per…») ja no existix, i W4-11
   torna a valdre per a TOTES les targetes de baix, que són les que mira esta
   prova (targetesDUtilitats). */
test('W4-11 · cap utilitat porta directament al destí d’«Obrir»: el Panell no llig plugin.obrir', () => {
  expect(fontControl).not.toMatch(/\.obrir\b/);
  expect(fontControl).not.toMatch(/\bappDelPlugin\b/);
  pinta();
  const hrefs = targetesDUtilitats().map((targeta) => targeta.querySelector('a.sp-card-link-overlay').getAttribute('href'));
  const obrir = new Set(PLUGINS.map((plugin) => plugin.obrir).filter(Boolean));
  expect(hrefs.filter((href) => obrir.has(href))).toEqual([]);
  expect(hrefs.every((href) => href.startsWith('/plugin/') || href === '/control?fitxa=snippet')).toBe(true);
});

/* W4-09 · En remot, l'autor porta a l'entitat resolta pel port (UUID); sense
   resoldre no hi ha enllaç (cap RPC amb el slug) i el Panell ho diu.
   xatCorporatiu.test.jsx en prova la resolució; ací, el cablejat.
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6, deroga
   W4-09/2234 per a la boina): la boina porta SEMPRE al projecte, es resolga
   o no el xat. El xat resolt és el de Comentar; sense resoldre, Comentar
   avisa (avisDelXatCorporatiu) i l'Alerta del Panell es conserva.
   Ordre del Mestre (261007, correcció C2) · El xat resolt és la via «En
   privat» del menú, i el dona el proveïdor de l'app amb el seu avís ja
   traduït: el Panell no en fa cap resolució pròpia. */
/* Onada 10 (261010) · Dalt i baix: totes les targetes del Panell. Abans
   (Onada 8), també les tres pàgines de la maquinària, amb la boina del Mur. */
const BOINES_AL_PROJECTE = () => [...targetesDeDalt(), ...targetesDUtilitats()]
  .map((targeta) => targeta.querySelector('a.sp-card-author-link')?.getAttribute('href'));
const NO_DISPONIBLE = 'Xat de Sóc de Poble: encara no disponible en este servidor.';
const ES_BUSCA = 'Xat de Sóc de Poble: encara s’està buscant en este servidor.';

test('W4-09 · 261007 · remot resolt: «En privat» porta al xat de l’entitat real; la boina, al projecte; sense avís', () => {
  const href = '/xat?amb=7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f';
  estat.xat = { estat: 'remot', href, avis: null, resol: null };
  pinta();
  const boines = BOINES_AL_PROJECTE();
  expect(boines.length).toBeGreaterThan(DESTINS_CONTROL.length);
  expect(boines).toEqual(Array(boines.length).fill(RUTA_PERFIL_PROJECTE));
  expect(screen.queryByText(/Xat de Sóc de Poble/)).toBeNull();
  fireEvent.click(obriComentar(targetesDeDalt()[0], titolDe(targetesDeDalt()[0])).privat);
  expect(ubicacio()).toBe(href);
  cleanup();
  pinta();
  const utilitat = targetesDUtilitats()[0];
  fireEvent.click(obriComentar(utilitat, titolDeTargeta(utilitat)).privat);
  expect(ubicacio()).toBe(href);
  expect(estat.toast).not.toHaveBeenCalled();
});

test('W4-09 · 261007 · remot sense entitat o amb error: la boina continua al projecte, «En privat» avisa i el Panell ho diu', () => {
  /* Amb error, el proveïdor encara oferix tornar-ho a provar (resol); absent, no. */
  const resolDeLError = vi.fn(() => new Promise(() => {}));
  for (const [estatDelXat, resol] of [['absent', null], ['error', resolDeLError]]) {
    estat.xat = { estat: estatDelXat, href: null, avis: NO_DISPONIBLE, resol };
    estat.toast.mockClear();
    pinta();
    const boines = BOINES_AL_PROJECTE();
    expect(boines, estatDelXat).toEqual(Array(boines.length).fill(RUTA_PERFIL_PROJECTE));
    for (const targeta of targetesDeDalt()) {
      expect(targeta.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    }
    const avis = screen.getByText(NO_DISPONIBLE);
    expect(avis.closest('[role="status"]'), estatDelXat).not.toBeNull();
    expect(document.querySelector('[href*="amb=socdepoble"]'), estatDelXat).toBeNull();
    /* Un error no es torna a demanar sol en obrir el Panell (cap bucle): ho fa el clic. */
    expect(resolDeLError, estatDelXat).not.toHaveBeenCalled();
    fireEvent.click(obriComentar(targetesDeDalt()[4], titolDe(targetesDeDalt()[4])).privat);
    expect(estat.toast, estatDelXat).toHaveBeenLastCalledWith(NO_DISPONIBLE);
    expect(ubicacio(), estatDelXat).toBe('/control');
    expect(resolDeLError.mock.calls.length, estatDelXat).toBe(estatDelXat === 'error' ? 1 : 0);
    cleanup();
  }
});

test('W4-09 · 261007 · remot resolent: la boina al projecte, cap Alerta, i «En privat» diu que encara es busca', () => {
  estat.xat = { estat: 'resolent', href: null, avis: ES_BUSCA, resol: vi.fn(() => new Promise(() => {})) };
  pinta();
  const boines = BOINES_AL_PROJECTE();
  expect(boines).toEqual(Array(boines.length).fill(RUTA_PERFIL_PROJECTE));
  expect(screen.queryByText(/Xat de Sóc de Poble/)).toBeNull();
  /* Ja es resol: obrir el Panell no en demana cap altra. */
  expect(estat.xat.resol).not.toHaveBeenCalled();
  fireEvent.click(obriComentar(targetesDeDalt()[0], titolDe(targetesDeDalt()[0])).privat);
  expect(estat.toast).toHaveBeenLastCalledWith(ES_BUSCA);
  expect(ubicacio()).toBe('/control');
});

/* Correcció C2 · L'Alerta sap l'estat sense esperar cap clic: en obrir el
   Panell en remot, useXatSocDePobleResolt demana UNA vegada la resolució del
   proveïdor de l'app ('pendent'), i el Panell no en fa cap de pròpia. */
test('261007 · remot pendent: obrir el Panell demana la resolució de l’app una sola vegada, i encara cap Alerta', () => {
  estat.xat = { estat: 'pendent', href: null, avis: ES_BUSCA, resol: vi.fn(() => new Promise(() => {})) };
  pinta();
  expect(estat.xat.resol).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Xat de Sóc de Poble/)).toBeNull();
  expect(estat.toast).not.toHaveBeenCalled();
  expect(ubicacio()).toBe('/control');
});

/* En anglés, l'Alerta passa pel traductor (reserva en valencià fins que el
   diccionari en porte la clau). L'avís de «En privat» el traduïx el proveïdor
   de l'app (xatCorporatiu.test.jsx). */
test('T6 · l’Alerta del xat de Sóc de Poble passa pel traductor amb la seua clau', () => {
  const claus = [];
  estat.traductor = (clau, reserva) => { claus.push(clau); return reserva; };
  estat.xat = { estat: 'error', href: null, avis: NO_DISPONIBLE, resol: null };
  pinta();
  expect(claus).toContain('section.control.xatCorporatiu.noDisponible');
  expect(screen.getByText(NO_DISPONIBLE).closest('[role="status"]')).not.toBeNull();
});

test('D3 · el títol de la pàgina és «Panell de Control», i la pestanya també a /control i a /utilitats', () => {
  pinta('/control');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Panell de Control');
  expect(document.title).toBe('Panell de Control | Sóc de Poble');
  cleanup();
  pinta('/utilitats');
  expect(document.title).toBe('Panell de Control | Sóc de Poble');
});
