/* D3 i D16 (ordres del Mestre, 260930) · El Panell de Control (/control i
   l'àlies /utilitats): cap targeta porta a una ruta que no és a la taula de
   rutes d'App, «Ajustos del xat» obri el Control del xat (l'entrada que
   substituïx «Novetats», amagada del rail), «Missatges per a dubtes» obri el
   Xat, «Gestoria de Poble» diu «EN OBRES» sense clic, i la pàgina i la
   pestanya del navegador es diuen «Panell de Control».

   Router propi en memòria (MemoryRouter) i les targetes de veres
   (UniversalCard); només se substituïxen la UniversalPage (la seua
   maquinària no entra en joc), l'eixida segura (SessionContext) i l'i18n. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { AVIS_SENSE_XAT } from '../../components/PedraSeca/hooks/useAccions.js';
import { RouteSEO } from '../../hooks/RouteSEO';
import { createTranslator } from '../../config/i18n';
import { resolvePageSlugPath } from '../../config/navigation.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { IDS_PLUGINS, PLUGINS, rutaDelPlugin } from '../plugins/registrePlugins.js';
import { AUTORIA_SOCDEPOBLE, DESTINS_CONTROL } from './destinsControl.js';
import fontApp from '../../app/App.jsx?raw';
import fontControl from './ControlSection.jsx?raw';

/* `traductor` (correcció de la revisió, 260930) · per defecte el t torna la
   reserva, com sempre; una prova hi posa el traductor real d'una llengua.
   `xat` (W4-09) · null: el xat corporatiu real (xatCorporatiu.js) en mode
   seed; un objecte { estat, href }: el que hauria resolt el port en remot. */
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
     W4-09 · dataMode 'seed': la boina porta al xat de la llavor sense xarxa. */
  useUIState: () => ({ externalConfig: { manageDocumentHead: true, dataMode: 'seed' } })
}));
vi.mock('./xatCorporatiu.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    useXatCorporatiu: () => {
      const llavor = real.useXatCorporatiu();
      return estat.xat ?? llavor;
    }
  };
});
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
const esDestiDeLApp = (ruta) => rutesEstatiques().has(camiDe(ruta)) || esPaginaServida(ruta);

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

function pinta(ruta = '/control') {
  return render(
    <MemoryRouter rutaInicial={ruta}>
      <ControlSection />
      <RouteSEO />
      <Ubicacio />
    </MemoryRouter>
  );
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

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
     temps no és el que es prova: el límit explícit no afluixa cap asserció. */
}, 30_000);

/* Ordre del Mestre, 261001 · El Panell és compacte: només les eines
   d'edició (Mur, Mercat, Agenda, Notes i Ajustos del xat), tal com diu l'Acta
   Marmota 261001_0045 (§1, «Control de Poble»). «Publicar al Xat» ja no hi
   és; el Xat continua obert des de «Missatges per a dubtes» (prova de baix). */
test('D3 · les targetes que naveguen i el seu destí, amb «Ajustos del xat» → /control-xat (D16)', () => {
  pinta();
  const esperats = [
    ['Publicar al Mur', '/mur'],
    ['Publicar al Mercat', '/mercat'],
    ["Publicar a l'Agenda", '/mur'],
    ['Editor de Notes', '/notes'],
    ['Ajustos del xat', '/control-xat'],
    /* CU (261003) · l'única Utilitat que navega: la seua fitxa. */
    ['Snippet', '/control?fitxa=snippet']
  ];
  expect([...document.querySelectorAll('button.sp-card-link-overlay')].map((b) => b.getAttribute('aria-label')))
    .toEqual(esperats.map(([titol]) => titol));
  for (const [titol, desti] of esperats) {
    fireEvent.click(screen.getByRole('button', { name: titol }));
    expect(ubicacio(), titol).toBe(desti);
  }
});

test('D16 · «Ajustos del xat» porta el dibuix de la capçalera del Control del xat (CircleDashed)', () => {
  pinta();
  const targeta = screen.getByRole('button', { name: 'Ajustos del xat' }).closest('article');
  expect(targeta.querySelector('.sp-card-title-icon svg.lucide-circle-dashed')).toBeTruthy();
  expect(within(targeta).queryByText('EN OBRES')).toBeNull();
});

/* Correcció de la revisió (260930) · «Ajustos del xat» és l'única porta al
   Control del xat (D16), que sí es tradueix: la targeta es tradueix amb ell. */
test('D16 · en anglés, la targeta «Ajustos del xat» es tradueix i continua obrint /control-xat', () => {
  estat.traductor = createTranslator('en');
  pinta();
  const boto = screen.getByRole('button', { name: 'Chat settings' });
  expect(within(boto.closest('article')).getByText('Column width and chat preferences')).toBeTruthy();
  expect(screen.queryByText('Ajustos del xat')).toBeNull();
  expect(screen.queryByText('Amplària de les columnes i preferències del xat')).toBeNull();
  fireEvent.click(boto);
  expect(ubicacio()).toBe('/control-xat');
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
const targetesDUtilitats = () => SECCIONS_DUTILITATS.flatMap((nom) => targetesDe(seccioDe(nom)));
const titolDeTargeta = (targeta) => targeta.querySelector('.sp-card-title').textContent;
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
   font: si en porta més (MarIA hi ha afegit «disseny»), també es pinten. */
const LES_ONZE = ['mapa', 'vehicle', 'animalets', 'gestoria', 'rebost', 'salut', 'consola', 'cervell', 'rss', 'tpv', 'bascula'];
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
  expect(IDS_PLUGINS).toEqual(expect.arrayContaining(LES_ONZE));
  const targetes = targetesDUtilitats();
  expect(targetes).toHaveLength(PLUGINS_DE_BAIX.length + 1);
  /* L'ordre del DOM i del focus és el del registre, i cada una hi és una vegada. */
  expect(senseSnippet(utilitats())).toEqual(TITOLS_DE_BAIX);
  expect(utilitats().filter((titol) => titol === 'Snippet')).toHaveLength(1);
  expect(titolDeTargeta(targetesDe(seccioDUtilitats()).at(-1))).toBe('Snippet');
  targetes.forEach((targeta) => {
    const titol = titolDeTargeta(targeta);
    /* La targeta de sempre: cap variant, cap etiqueta, cap porta. */
    expect(targeta.className, titol).toBe('sp-card');
    expect(targeta.querySelector('.sp-card-labels'), titol).toBeNull();
    expect(targeta.querySelector('.sp-card-portes'), titol).toBeNull();
    /* La boina de Sóc de Poble, dalt de tot i sense data (el registre no en porta).
       Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6):
       l'autor porta a la pàgina del projecte, no al xat corporatiu. */
    const capcal = targeta.querySelector('header.sp-card-header');
    expect(targeta.firstElementChild, titol).toBe(capcal);
    expect(capcal.querySelector('.sp-card-author-name').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.author);
    expect(capcal.querySelector('.sp-card-author-location').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.location);
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href'), titol).toBe('/projecte');
    expect(capcal.querySelector('.btn-date-time'), titol).toBeNull();
    /* L'enllaç de tota la targeta, amb el nom del títol. */
    const enllac = targeta.querySelector('a.sp-card-link-overlay');
    expect([enllac.getAttribute('href'), enllac.getAttribute('aria-label')], titol).toEqual([PAGINA_DUTILITAT.get(titol), titol]);
    expect(within(targeta).getByRole('heading', { level: 3, name: titol }).classList.contains('sdp-sr-only'), titol).toBe(false);
    /* El peu blau de P6: Traduir, Comentar i Compartir, sense Connectar. */
    expect(targeta.lastElementChild.className, titol).toBe('sp-card-footer');
    expect([...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label')), titol)
      .toEqual([`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`]);
  });
  /* Il·lustració, subtítol i entradilla: els del registre, sense cap canvi. */
  PLUGINS_DE_BAIX.forEach((plugin) => {
    const targeta = targetaDUtilitat(plugin.titol);
    const imatge = targeta.querySelector('img.sp-card-media');
    expect([imatge.getAttribute('src'), imatge.getAttribute('alt')], plugin.id).toEqual([plugin.imatge, plugin.imatgeAlt]);
    expect(within(targeta).getByRole('heading', { level: 4 }).textContent, plugin.id).toBe(sensePunt(plugin.subtitol));
    expect(targeta.querySelector('p.sp-card-text').textContent, plugin.id).toBe(plugin.entradilla);
  });
  /* El Snippet, amb la seua il·lustració i el seu subtítol de sempre. */
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
   el xat corporatiu (en seed, el de la llavor). Mai l'avís de xat comú. */
test('T6 · Comentar de cada utilitat obri el xat corporatiu de Sóc de Poble', () => {
  pinta();
  const total = targetesDUtilitats().length;
  expect(total).toBeGreaterThan(1);
  for (let index = 0; index < total; index += 1) {
    cleanup();
    estat.toast.mockClear();
    pinta();
    const targeta = targetesDUtilitats()[index];
    const titol = titolDeTargeta(targeta);
    fireEvent.click(within(targeta).getByRole('button', { name: `Comentar ${titol}` }));
    expect(ubicacio(), titol).toBe('/xat?amb=socdepoble');
    expect(estat.toast, titol).not.toHaveBeenCalledWith(AVIS_SENSE_XAT);
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
   registrePlugins.js. */
test('P7-B · cap text ni imatge dels plugins és copiat a ControlSection.jsx', () => {
  for (const plugin of PLUGINS) {
    for (const valor of [plugin.subtitol, plugin.entradilla, plugin.imatgeAlt, `${plugin.id}_vinyeta`]) {
      expect(fontControl.includes(valor), `${plugin.id}: ${valor}`).toBe(false);
    }
  }
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
    cleanup();
  }
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ gestoria: false, mapa: false, snippet: false, metriques: false, salut: true }));
  pinta();
  expect(utilitats()).toEqual(PLUGINS_DE_BAIX.filter((plugin) => plugin.id !== 'gestoria').map((plugin) => plugin.titol));
  expect(utilitats()).not.toContain('Snippet');
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
       amb Traduir, Comentar i Compartir; sense Connectar ni etiquetes. */
    expect(targeta.className, titol).toBe('sp-card');
    expect(targeta.querySelector('.sp-card-link-overlay'), titol).toBeNull();
    expect(targeta.lastElementChild.className, titol).toBe('sp-card-footer');
    expect([...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label')), titol).toEqual([
      `Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`
    ]);
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
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href'), titolDe(targeta)).toBe('/projecte');
    expect(capcal.textContent, titolDe(targeta)).not.toMatch(/IAIA|MarIA/);
    expect(capcal.querySelector('.sp-card-meta button.btn-date-time').closest('a'), titolDe(targeta)).toBeNull();
  }
  fireEvent.click(targetesDeDalt()[3].querySelector('a.sp-card-author-link'));
  expect(ubicacio()).toBe('/projecte');
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
    ['mercat', '/assets/nano_cards/mercat_nano_card.jpg'],
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
   corporatiu (vegeu la prova de Comentar). */
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
   seed, el de la llavor). Mai el xat de /control ni l'avís de xat comú. */
test('P6 · T6 · Comentar de cada targeta de dalt obri el xat corporatiu de Sóc de Poble', () => {
  for (let index = 0; index < DESTINS_CONTROL.length; index += 1) {
    estat.toast.mockClear();
    pinta();
    const targeta = targetesDeDalt()[index];
    fireEvent.click(accioDe(targeta, 'Comentar'));
    expect(ubicacio(), titolDe(targeta)).toBe('/xat?amb=socdepoble');
    expect(estat.toast, titolDe(targeta)).not.toHaveBeenCalledWith(AVIS_SENSE_XAT);
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
   d'Utilitats no: dos peus distints en el mateix Panell. */
test('R3 · cap targeta del Panell porta Connectar: dalt i baix, el mateix peu de tres accions', () => {
  pinta();
  expect(targetesDeDalt().length).toBeGreaterThan(0);
  expect(targetesDUtilitats().length).toBeGreaterThan(0);
  for (const targeta of [...targetesDeDalt(), ...targetesDUtilitats()]) {
    const titol = titolDe(targeta);
    expect(targeta.querySelector('.sp-card-connect'), titol).toBeNull();
    expect(targeta.lastElementChild.className, titol).toBe('sp-card-footer');
    expect([...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label')), titol)
      .toEqual([`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`]);
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
   la pàgina del plugin amb useDestiDelPlugin, que passa pels interruptors. */
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
   avisa (avisDelXatCorporatiu) i l'Alerta del Panell es conserva. */
const BOINES_AL_PROJECTE = () => [...targetesDeDalt(), ...targetesDUtilitats()]
  .map((targeta) => targeta.querySelector('a.sp-card-author-link')?.getAttribute('href'));

test('W4-09 · T6 · remot resolt: Comentar porta al xat de l’entitat real; la boina, al projecte; sense avís', () => {
  const href = '/xat?amb=7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f';
  estat.xat = { estat: 'remot', href };
  pinta();
  const boines = BOINES_AL_PROJECTE();
  expect(boines.length).toBeGreaterThan(DESTINS_CONTROL.length);
  expect(boines).toEqual(Array(boines.length).fill('/projecte'));
  expect(screen.queryByText(/Xat de Sóc de Poble/)).toBeNull();
  fireEvent.click(accioDe(targetesDeDalt()[0], 'Comentar'));
  expect(ubicacio()).toBe(href);
  cleanup();
  pinta();
  const utilitat = targetesDUtilitats()[0];
  fireEvent.click(within(utilitat).getByRole('button', { name: `Comentar ${titolDeTargeta(utilitat)}` }));
  expect(ubicacio()).toBe(href);
  expect(estat.toast).not.toHaveBeenCalled();
});

test('W4-09 · T6 · remot sense entitat o amb error: la boina continua al projecte, Comentar avisa i el Panell ho diu', () => {
  for (const xat of [{ estat: 'absent', href: null }, { estat: 'error', href: null }]) {
    estat.xat = xat;
    estat.toast.mockClear();
    pinta();
    const boines = BOINES_AL_PROJECTE();
    expect(boines, xat.estat).toEqual(Array(boines.length).fill('/projecte'));
    for (const targeta of targetesDeDalt()) {
      expect(targeta.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    }
    const avis = screen.getByText('Xat de Sóc de Poble: encara no disponible en este servidor.');
    expect(avis.closest('[role="status"]'), xat.estat).not.toBeNull();
    expect(document.querySelector('[href*="amb=socdepoble"]'), xat.estat).toBeNull();
    fireEvent.click(accioDe(targetesDeDalt()[4], 'Comentar'));
    expect(estat.toast, xat.estat).toHaveBeenLastCalledWith('Xat de Sóc de Poble: encara no disponible en este servidor.');
    expect(ubicacio(), xat.estat).toBe('/control');
    cleanup();
  }
});

test('W4-09 · T6 · remot resolent: la boina al projecte, cap Alerta, i Comentar diu que encara es busca', () => {
  estat.xat = { estat: 'resolent', href: null };
  pinta();
  const boines = BOINES_AL_PROJECTE();
  expect(boines).toEqual(Array(boines.length).fill('/projecte'));
  expect(screen.queryByText(/Xat de Sóc de Poble/)).toBeNull();
  fireEvent.click(accioDe(targetesDeDalt()[0], 'Comentar'));
  expect(estat.toast).toHaveBeenLastCalledWith('Xat de Sóc de Poble: encara s’està buscant en este servidor.');
  expect(ubicacio()).toBe('/control');
});

/* En anglés, l'avís de Comentar i l'Alerta passen pel traductor (reserva en
   valencià fins que el diccionari en porte la clau). */
test('T6 · l’avís del xat corporatiu passa pel traductor amb la seua clau', () => {
  const claus = [];
  estat.traductor = (clau, reserva) => { claus.push(clau); return reserva; };
  estat.xat = { estat: 'error', href: null };
  pinta();
  fireEvent.click(accioDe(targetesDeDalt()[0], 'Comentar'));
  expect(claus).toContain('section.control.xatCorporatiu.noDisponible');
});

test('D3 · el títol de la pàgina és «Panell de Control», i la pestanya també a /control i a /utilitats', () => {
  pinta('/control');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Panell de Control');
  expect(document.title).toBe('Panell de Control | Sóc de Poble');
  cleanup();
  pinta('/utilitats');
  expect(document.title).toBe('Panell de Control | Sóc de Poble');
});
