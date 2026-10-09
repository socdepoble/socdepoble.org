/* Onada 2 de la Gestoria (ordre del Mestre, 261004; MAPA_EMPRESA_GESTORIA.txt
   §2.2; decisió A11: només les targetes que ja funcionen) · Els dos espais
   nous del Panell de Control, «L’empresa» i «La llar».

   Regla d'or 1 (261004): tota UniversalCard porta la boina de Sóc de Poble
   enllaçada a la seua pàgina (/projecte, resolta per rutaDAutoria, mai pel
   nom), el cos sencer (títol, subtítol i entradeta) i el peu canònic, i tota
   la targeta porta a la seua pàgina (/plugin/<id>), on la imatge de la
   targeta és la portada. R1: targetes estàtiques, cap xifra al Panell. R3:
   la llar mai es barreja amb l'empresa.

   Router propi en memòria i les targetes de veres (UniversalCard); se
   substituïxen la UniversalPage, l'eixida segura, el toast i l'i18n, com a
   ControlSection.test.jsx. En producció, la Gestoria no navega: ho prova
   PluginPage.test.jsx (la pàgina on porta la targeta). */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { RUTA_PERFIL_PROJECTE, rutaDAutoria } from '../../config/navigation.js';
import { RUTA_DRETS_AUTOR } from '../../config/systemPages.js';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { CLAU_UTILITATS_ACTIVES, desaUtilitatActiva } from '../profile/utilitatsActives.js';
import { ESPAIS_PLUGINS, PLUGINS, pluginsDeLEspai, rutaDelPlugin } from '../plugins/registrePlugins.js';
import { AUTORIA_SOCDEPOBLE } from './destinsControl.js';
import fontApp from '../../app/App.jsx?raw';

const estat = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: estat.toast })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, reserva) => reserva, resolveAsset: (valor) => valor }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' } })
}));
vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: () => ({ demana: vi.fn(), ocupat: false, avis: null, error: null })
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => (
    <section data-pagina="control">
      <p data-titol="pagina">{title}</p>
      {children}
    </section>
  )
}));

import ControlSection from './ControlSection.jsx';

const CLAU_UTILITATS = 'sdp_utilitats_actives';
/* Higiene d'amfitrió (ordre del Mestre, 261004) · La clau amb prefix que escriu DetallEspai. */
const CLAU_PROPIA = STORAGE_PREFIX + CLAU_UTILITATS_ACTIVES;

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

function pinta() {
  return render(
    <MemoryRouter rutaInicial="/control">
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>
  );
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

const seccioDe = (nom) => screen.queryByRole('heading', { level: 2, name: nom })?.closest('section') ?? null;
const targetesDe = (seccio) => (seccio ? [...seccio.querySelectorAll('.sdp-card-grid > article.sp-card')] : []);
const titolDe = (targeta) => targeta.querySelector('.sp-card-title').textContent;
const sensePunt = (text) => text.replace(/\.$/, '');
/* Les targetes dels dos espais, amb el plugin de cada una. */
const targetesDelsEspais = () => ESPAIS_PLUGINS.flatMap((espai) => targetesDe(seccioDe(espai.titol))
  .map((targeta) => [targeta, PLUGINS.find((plugin) => plugin.titol === titolDe(targeta))]));

/* Les rutes de la taula d'App, sense paràmetres ni comodins (com a ControlSection.test.jsx). */
const rutesEstatiques = () => new Set([...fontApp.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((m) => m[1].replace(/^\//, '')).filter((ruta) => !ruta.includes(':') && !ruta.includes('*')));

beforeEach(() => {
  estat.toast.mockReset();
  localStorage.removeItem(CLAU_UTILITATS);
  localStorage.removeItem(CLAU_PROPIA);
});
afterEach(() => {
  cleanup();
  localStorage.removeItem(CLAU_UTILITATS);
  localStorage.removeItem(CLAU_PROPIA);
});

test('els dos espais existixen, en ordre entre «Publica al poble» i les Utilitats, amb la seua entradeta', () => {
  pinta();
  const ordre = [
    screen.getByRole('heading', { level: 2, name: 'Publica al poble' }).closest('section'),
    seccioDe('L’empresa'),
    seccioDe('La llar'),
    seccioDe('Utilitats i Connectors (Plugins)'),
    seccioDe('Maquinària i Sistema')
  ];
  expect(ordre.every(Boolean)).toBe(true);
  expect(new Set(ordre).size).toBe(ordre.length);
  for (let index = 1; index < ordre.length; index += 1) {
    expect(ordre[index - 1].compareDocumentPosition(ordre[index]) & Node.DOCUMENT_POSITION_FOLLOWING, String(index)).toBeTruthy();
  }
  for (const espai of ESPAIS_PLUGINS) {
    const seccio = seccioDe(espai.titol);
    expect(seccio.querySelector('p.lead').textContent, espai.id).toBe(espai.entradeta);
    expect(seccio.querySelector('.sdp-card-grid').className, espai.id).toBe('sdp-card-grid');
  }
});

test('R3 · separats: «L’empresa» porta la Gestoria i «La llar» el Rebost i Salut; cap targeta en dos llocs', () => {
  pinta();
  expect(targetesDe(seccioDe('L’empresa')).map(titolDe)).toEqual(['Gestoria']);
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(['Rebost Domèstic', 'Salut']);
  expect(ESPAIS_PLUGINS.map((espai) => targetesDe(seccioDe(espai.titol)).map(titolDe)))
    .toEqual(ESPAIS_PLUGINS.map((espai) => pluginsDeLEspai(espai.id).map((plugin) => plugin.titol)));
  /* Cada targeta d'un espai es pinta UNA vegada en tot el Panell: ni a l'altre
     espai, ni a Utilitats, ni a Maquinària, ni dalt. */
  const titols = [...document.querySelectorAll('article.sp-card .sp-card-title')].map((titol) => titol.textContent);
  for (const plugin of PLUGINS.filter((p) => p.espai)) {
    expect([plugin.id, titols.filter((titol) => titol === plugin.titol).length]).toEqual([plugin.id, 1]);
  }
  const empresa = new Set(targetesDe(seccioDe('L’empresa')).map(titolDe));
  expect(targetesDe(seccioDe('La llar')).map(titolDe).filter((titol) => empresa.has(titol))).toEqual([]);
});

/* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil
   (RUTA_PERFIL_PROJECTE, que servix la ruta empresa/:agentId d'App), ja no a
   /projecte. Només canvien les assercions de la ruta de la boina. */
test('regla d’or 1 · cada targeta: boina de Sóc de Poble cap al seu perfil, cos sencer, peu canònic i cap a la seua pàgina', () => {
  pinta();
  const targetes = targetesDelsEspais();
  expect(targetes).toHaveLength(PLUGINS.filter((p) => p.espai).length);
  expect(AUTORIA_SOCDEPOBLE.authorHref).toBe(rutaDAutoria({ tipus: 'entitat', id: 'socdepoble' }));
  expect(AUTORIA_SOCDEPOBLE.authorHref).toBe(RUTA_PERFIL_PROJECTE);
  expect(fontApp.includes('<Route path="empresa/:agentId"')).toBe(true);
  expect(rutesEstatiques().has('projecte')).toBe(true);
  expect(fontApp.includes('<Route path="/plugin/:id"')).toBe(true);
  for (const [targeta, plugin] of targetes) {
    const titol = titolDe(targeta);
    expect(plugin, titol).toBeTruthy();
    /* L'anatomia de sempre: boina → (l'enllaç de tota la targeta) → imatge →
       cos → peu, cap variant ni etiqueta. */
    expect(targeta.className, titol).toBe('sp-card');
    expect([...targeta.children].map((fill) => fill.className), titol)
      .toEqual(['sp-card-header', 'sp-card-link-overlay', 'sp-card-media-container', 'sp-card-body', 'sp-card-footer']);
    expect(targeta.querySelector('.sp-card-labels'), titol).toBeNull();
    /* La boina: l'entitat Sóc de Poble, enllaçada a la seua pàgina. */
    const capcal = targeta.querySelector('header.sp-card-header');
    expect(capcal.querySelector('.sp-card-author-name').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.author);
    expect(capcal.querySelector('.sp-card-author-location').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.location);
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href'), titol).toBe(RUTA_PERFIL_PROJECTE);
    /* La imatge de la targeta és la portada de la seua pàgina (PluginPage). */
    const imatge = targeta.querySelector('img.sp-card-media');
    expect([imatge.getAttribute('src'), imatge.getAttribute('alt')], titol).toEqual([plugin.imatge, plugin.imatgeAlt]);
    /* El cos sencer i visible: títol, subtítol i entradeta. */
    expect(within(targeta).getByRole('heading', { level: 3, name: titol }).classList.contains('sdp-sr-only'), titol).toBe(false);
    expect(within(targeta).getByRole('heading', { level: 4 }).textContent, titol).toBe(sensePunt(plugin.subtitol));
    expect(targeta.querySelector('p.sp-card-text').textContent, titol).toBe(plugin.entradilla);
    /* Tota la targeta porta a la seua pàgina, amb el nom del títol. */
    const enllac = targeta.querySelector('a.sp-card-link-overlay');
    expect([enllac.getAttribute('href'), enllac.getAttribute('aria-label')], titol).toEqual([rutaDelPlugin(plugin.id), titol]);
    /* El peu canònic, al final: Traduir, Comentar i Compartir. El Connectar
       esperava la decisió del Mestre (revisió R3). Onada 8 (261009) · El
       Mestre ho ha decidit (requeriments 261009_1300, punt 2): Universal
       Card sencera, amb Connectar al peu i el copyright cap a «Drets d'autor». */
    const botons = [...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'));
    expect(botons, titol).toEqual([`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`, `Connectar amb ${titol}`]);
    expect(targeta.querySelector('.sp-card-copyright__enllac').getAttribute('href'), titol).toBe(RUTA_DRETS_AUTOR);
  }
});

test('regla d’or 1 · el clic de cada targeta obri /plugin/<id> i el de la boina, el perfil de Sóc de Poble', () => {
  pinta();
  const total = targetesDelsEspais().length;
  expect(total).toBeGreaterThan(0);
  for (let index = 0; index < total; index += 1) {
    cleanup();
    pinta();
    const [targeta, plugin] = targetesDelsEspais()[index];
    fireEvent.click(within(targeta).getByRole('link', { name: plugin.titol }));
    expect(ubicacio(), plugin.id).toBe(`/plugin/${plugin.id}`);
    cleanup();
    pinta();
    fireEvent.click(targetesDelsEspais()[index][0].querySelector('a.sp-card-author-link'));
    expect(ubicacio(), plugin.id).toBe(RUTA_PERFIL_PROJECTE);
  }
});

/* R1 · Targetes estàtiques: cap xifra, comptador, data ni avís que isca de
   les dades. El Panell també es munta dins de l'amfitrió.
   Onada 8 (261009) · El copyright de les targetes (COPYRIGHT_SDP, «CC
   BY-NC-SA 4.0…») porta el número de versió de la llicència, que no és cap
   dada: es comprova que és exactament eixe text i es deixa fora de la
   comprovació de xifres. La resta de la targeta, com abans. */
test('R1 · cap xifra als dos espais: ni al text, ni a la boina, ni al quadrat de la targeta', () => {
  pinta();
  for (const espai of ESPAIS_PLUGINS) {
    const seccio = seccioDe(espai.titol);
    const senseDrets = seccio.cloneNode(true);
    const drets = [...senseDrets.querySelectorAll('.sp-card-copyright')];
    expect([espai.id, drets.length]).toEqual([espai.id, targetesDe(seccio).length]);
    for (const paragraf of drets) {
      expect([espai.id, paragraf.textContent]).toEqual([espai.id, COPYRIGHT_SDP]);
      paragraf.remove();
    }
    expect([espai.id, /\d/.test(senseDrets.textContent)]).toEqual([espai.id, false]);
    expect([espai.id, [...seccio.querySelectorAll('[aria-label]')].filter((el) => /\d/.test(el.getAttribute('aria-label')))])
      .toEqual([espai.id, []]);
    expect(seccio.querySelector('.btn-date-time'), espai.id).toBeNull();
    expect(seccio.querySelector('.sp-card-calendar-badge'), espai.id).toBeNull();
  }
});

/* D3 · La targeta de la Gestoria porta a la seua pàgina, la mateixa en
   desenvolupament i en producció: el Panell no llig mai el destí d'«Obrir»
   (W4-11). Cap enllaç a l'eina local de la Wiki, a /gestoria ni a una app. */
test('D3 · cap targeta dels espais porta a l’eina local, a /gestoria ni directament a una app', () => {
  pinta();
  const gestoria = targetesDe(seccioDe('L’empresa')).find((targeta) => titolDe(targeta) === 'Gestoria');
  expect(gestoria.querySelector('a.sp-card-link-overlay').getAttribute('href')).toBe('/plugin/gestoria');
  const hrefs = ESPAIS_PLUGINS.flatMap((espai) => [...seccioDe(espai.titol).querySelectorAll('[href]')].map((el) => el.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs.filter((href) => /wikidepoble|gestoria_|^\/gestoria$|^\/app\//.test(href))).toEqual([]);
  /* Onada 8 (261009) · I el copyright, que porta a «Drets d'autor». */
  expect(hrefs.every((href) => href === RUTA_PERFIL_PROJECTE || href === RUTA_DRETS_AUTOR || /^\/plugin\/[a-z]+$/.test(href))).toBe(true);
});

/* R2 · Compartir d'una targeta del Panell comparteix la seua pàgina pública
   (/plugin/<id>), que no porta dades: mai l'app ni l'eina privada. */
test('R2 · Compartir de cada targeta dels espais comparteix la seua pàgina pública, mai l’app ni l’eina', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  try {
    pinta();
    const targetes = targetesDelsEspais();
    for (let index = 0; index < targetes.length; index += 1) {
      const [targeta, plugin] = targetes[index];
      fireEvent.click(within(targeta).getByRole('button', { name: `Compartir ${plugin.titol}` }));
      await waitFor(() => expect(share).toHaveBeenCalledTimes(index + 1));
      const [{ title, url }] = share.mock.calls[index];
      expect([plugin.id, title, url.endsWith(rutaDelPlugin(plugin.id))]).toEqual([plugin.id, plugin.titol, true]);
      expect([plugin.id, /\/app\/|wikidepoble|gestoria_/.test(url)]).toEqual([plugin.id, false]);
    }
    expect(ubicacio()).toBe('/control');
  } finally {
    delete navigator.share;
  }
});

/* La preferència de DetallEspai (exclusió amb un false explícit) també val
   als espais: llevar la Gestoria buida «L’empresa», i un espai buit no pinta
   cap capçalera. La llar no en depén. */
test('la preferència amaga una targeta d’un espai; un espai buit no es pinta i l’altre continua', () => {
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ gestoria: false }));
  pinta();
  expect(seccioDe('L’empresa')).toBeNull();
  expect(screen.queryByText('Gestoria', { selector: '.sp-card-title' })).toBeNull();
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(['Rebost Domèstic', 'Salut']);
  cleanup();
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ salut: false }));
  pinta();
  expect(targetesDe(seccioDe('L’empresa')).map(titolDe)).toEqual(['Gestoria']);
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(['Rebost Domèstic']);
});

/* Higiene d'amfitrió (ordre del Mestre, 261004) · Quan DetallEspai lleva una
   utilitat, el Panell que ja és a la vista se n'assabenta per l'estat
   compartit de l'app (utilitatsActives.js), sense cap 'storage' a window: dins
   de WordPress, eixe esdeveniment arribava a la pàgina de l'amfitrió. Abans,
   el Panell només llegia la preferència en muntar-se. */
test('una utilitat llevada des de DetallEspai desapareix del Panell a la vista, sense cap esdeveniment a window', () => {
  const aWindow = vi.spyOn(window, 'dispatchEvent');
  try {
    pinta();
    expect(targetesDe(seccioDe('L’empresa')).map(titolDe)).toEqual(['Gestoria']);
    act(() => { expect(desaUtilitatActiva('gestoria', false)).toBe(true); });
    expect(seccioDe('L’empresa')).toBeNull();
    expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ gestoria: false });
    act(() => { desaUtilitatActiva('gestoria', true); });
    expect(targetesDe(seccioDe('L’empresa')).map(titolDe)).toEqual(['Gestoria']);
    expect(aWindow).not.toHaveBeenCalled();
  } finally {
    aWindow.mockRestore();
  }
});

/* La clau amb prefix mana; sense ella, el llegat continua valent (ningú no perd la configuració). */
test('la clau amb prefix mana sobre la de llegat, i la de llegat val si no n’hi ha cap altra', () => {
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ gestoria: false }));
  localStorage.setItem(CLAU_PROPIA, JSON.stringify({ gestoria: true, salut: false }));
  pinta();
  expect(targetesDe(seccioDe('L’empresa')).map(titolDe)).toEqual(['Gestoria']);
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(['Rebost Domèstic']);
});
