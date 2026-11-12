/* Onada 2 de la Gestoria (ordre del Mestre, 261004; MAPA_EMPRESA_GESTORIA.txt
   §2.2; decisió A11: només les targetes que ja funcionen) · Els dos espais
   nous del Panell de Control, «L’empresa» i «La llar».

   Regla d'or 1 (261004): tota UniversalCard porta la boina de Sóc de Poble
   enllaçada a la seua pàgina (/projecte, resolta per rutaDAutoria, mai pel
   nom), el cos sencer (títol, subtítol i entradeta) i el peu canònic, i tota
   la targeta porta a la seua pàgina (/plugin/<id>), on la imatge de la
   targeta és la portada. R1: targetes estàtiques, cap xifra al Panell. R3:
   la llar mai es barreja amb l'empresa.

   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · M3: el
   Rebost Domèstic i Salut es queden a «La llar» (no entren al Mur). M4: les
   targetes de plugin passen a targeta canònica, amb la franja taronja de la
   data i l'hora i les etiquetes Categoria i Etiqueta del registre. DEROGADES,
   per a estes targetes, «cap etiqueta» (regla d'or 1, P6) i la part de R1 que
   deia «cap data»: la pastilla amb la data FIXA del registre és l'única xifra
   admesa. La resta de R1 continua sencera.

   R16-W1 · «L’empresa» passa a dir-se «Economia i Empresa» i hi van la
   Gestoria, el TPV del Bar i el Rebost Domèstic; «La llar» porta Salut i
   l'Arbre Genealògic. Ho diu el registre (camp `espai`), i la secció
   «Utilitats i Connectors (Plugins)», que es quedava buida, ja no es pinta.

   R18 · T2 (P0-101; prompt 261111_0148) · Les targetes pinten
   etiquetesAmbEstat: les dues del registre i, si l'eina és en proves, la
   insígnia «En proves · Beta oberta». Les proves comparen el DOM amb
   etiquetesAmbEstat i el registre continua amb dues. Correcció de la T2:
   l'Avisador no entra a «La llar» (la seua vinyeta no és a public/), i
   l'entradeta torna a ser la d'abans.
   P0-114 (ordre del Mestre, 261111) · DEROGADA «l'Avisador no entra a «La
   llar»»: hi torna, darrere de l'Arbre Genealògic, amb la seua vinyeta. Les
   entradetes dels espais no canvien (Llei del Píxel).

   Router propi en memòria i les targetes de veres (UniversalCard); se
   substituïxen la UniversalPage, l'eixida segura, el toast i l'i18n, com a
   ControlSection.test.jsx. La targeta mai navega a l'app: porta a la seua
   pàgina, i on porta la pàgina ho prova PluginPage.test.jsx. P0-113 (ordre
   del Mestre, 261111) · En producció la Gestoria ja s'obri des de la seua
   pàgina; abans: «En producció, la Gestoria no navega». */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { RUTA_PERFIL_PROJECTE, rutaDAutoria } from '../../config/navigation.js';
import { RUTA_DRETS_AUTOR } from '../../config/systemPages.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { CLAU_UTILITATS_ACTIVES, desaUtilitatActiva } from '../profile/utilitatsActives.js';
import { ESPAIS_PLUGINS, PLUGINS, etiquetesAmbEstat, pluginsDeLEspai, rutaDelPlugin } from '../plugins/registrePlugins.js';
/* Les targetes de «La llar», en l'ordre del registre. P0-114 (ordre del Mestre, 261111:
   «RESTITUÏX IMMEDIATAMENT «L'Avisador · Batec de Vida» A «La llar» DE /control») · I L'Avisador. */
const DE_LA_LLAR = ['Salut', 'Arbre Genealògic', 'L’Avisador'];
import { AUTORIA_SOCDEPOBLE } from './destinsControl.js';
import fontApp from '../../app/App.jsx?raw';

/* R16b · `idioma` és la llengua de la interfície; sense, la de sempre.
   R16b (tercera ronda) · El Panell la llig de useUIActions (la mateixa `language` que UIProvider
   posa a l'estat): l'estat del mock ja no en porta cap. */
const estat = vi.hoisted(() => ({ toast: vi.fn(), idioma: undefined }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: estat.toast })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, reserva) => reserva, resolveAsset: (valor) => valor, language: estat.idioma }),
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
/* Onada 10 (decisió M4 del Mestre) · La pastilla de la boina, com la pinta la
   targeta, i la que ha de pintar segons la data del registre: l'hora i el
   dia (dataHoraDeBarra, la mateixa lectura de les targetes de dalt). */
const pastillaDe = (targeta) => [...targeta.querySelectorAll('header.sp-card-header button.btn-date-time span')].map((s) => s.textContent);
const pastillaDelRegistre = (plugin) => {
  const { time, date } = dataHoraDeBarra({ creat: plugin.data });
  return [time, date].filter(Boolean);
};

/* Les rutes de la taula d'App, sense paràmetres ni comodins (com a ControlSection.test.jsx). */
const rutesEstatiques = () => new Set([...fontApp.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((m) => m[1].replace(/^\//, '')).filter((ruta) => !ruta.includes(':') && !ruta.includes('*')));

beforeEach(() => {
  estat.toast.mockReset();
  estat.idioma = undefined;
  localStorage.removeItem(CLAU_UTILITATS);
  localStorage.removeItem(CLAU_PROPIA);
});
afterEach(() => {
  cleanup();
  localStorage.removeItem(CLAU_UTILITATS);
  localStorage.removeItem(CLAU_PROPIA);
});

test('els dos espais existixen, en ordre entre «Publica al poble» i «Maquinària i Sistema», amb la seua entradeta', () => {
  pinta();
  const ordre = [
    screen.getByRole('heading', { level: 2, name: 'Publica al poble' }).closest('section'),
    seccioDe('Economia i Empresa'),
    seccioDe('La llar'),
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

/* R16b (C3-12) · Els espais parlen la llengua de la interfície: amb el castellà (també amb la
   variant regional), el títol i l'entradeta de TEXTOS_ESPAIS_PLUGINS.es, i les mateixes targetes. */
test.each(['es', 'es-ES'])('cinc llengües · amb la interfície en %s, els espais es diuen «Economía y Empresa» i «El hogar», amb la seua entradeta', (idioma) => {
  estat.idioma = idioma;
  pinta();
  expect(seccioDe('Economia i Empresa')).toBeNull();
  expect(seccioDe('La llar')).toBeNull();
  const empresa = seccioDe('Economía y Empresa');
  const llar = seccioDe('El hogar');
  expect(empresa.querySelector('p.lead').textContent).toBe('Las herramientas de la actividad: la gestoría, el TPV del bar y la despensa doméstica. El Panel no muestra ninguna cifra de tus datos; los datos solo se ven dentro de cada herramienta.');
  expect(llar.querySelector('p.lead').textContent).toBe('Las herramientas de casa: el cuaderno de salud y la memoria de la familia. Viven separadas de las de la empresa, y el Panel no muestra ningún dato tuyo.');
  expect(targetesDe(empresa).map(titolDe)).toEqual(['Gestoria', 'TPV del Bar', 'Rebost Domèstic']);
  expect(targetesDe(llar).map(titolDe)).toEqual(DE_LA_LLAR);
  /* En el mateix lloc: entre «Publica al poble» i «Maquinària i Sistema». */
  const maquinaria = seccioDe('Maquinària i Sistema');
  expect(empresa.compareDocumentPosition(llar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(llar.compareDocumentPosition(maquinaria) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('R3 · separats: «Economia i Empresa» porta Gestoria, TPV del Bar i Rebost Domèstic, i «La llar» Salut i l’Arbre Genealògic; cap targeta en dos llocs', () => {
  pinta();
  expect(targetesDe(seccioDe('Economia i Empresa')).map(titolDe)).toEqual(['Gestoria', 'TPV del Bar', 'Rebost Domèstic']);
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(DE_LA_LLAR);
  expect(ESPAIS_PLUGINS.map((espai) => targetesDe(seccioDe(espai.titol)).map(titolDe)))
    .toEqual(ESPAIS_PLUGINS.map((espai) => pluginsDeLEspai(espai.id).map((plugin) => plugin.titol)));
  /* Cada targeta d'un espai es pinta UNA vegada en tot el Panell: ni a l'altre
     espai, ni a Maquinària, ni dalt. */
  const titols = [...document.querySelectorAll('article.sp-card .sp-card-title')].map((titol) => titol.textContent);
  for (const plugin of PLUGINS.filter((p) => p.espai)) {
    expect([plugin.id, titols.filter((titol) => titol === plugin.titol).length]).toEqual([plugin.id, 1]);
  }
  const empresa = new Set(targetesDe(seccioDe('Economia i Empresa')).map(titolDe));
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
       cos → peu, cap variant.
       Onada 10 (261010; decisió M4 del Mestre) · DEROGAT «ni etiqueta»: la
       targeta canònica porta exactament les etiquetes del registre, una
       Categoria i una Etiqueta, en eixe ordre i sense enllaç. Continua sense
       botó gran ni portes. */
    expect(targeta.className, titol).toBe('sp-card');
    expect([...targeta.children].map((fill) => fill.className), titol)
      .toEqual(['sp-card-header', 'sp-card-link-overlay', 'sp-card-media-container', 'sp-card-body', 'sp-card-footer']);
    /* R18 · T2 (P0-101) · El registre continua amb exactament dues; la targeta
       pinta les de etiquetesAmbEstat: les dues i, si l'eina és en proves, la insígnia. */
    expect(plugin.etiquetes.map((etiqueta) => etiqueta.className), titol).toEqual(['sdp-badge-category', 'sdp-badge-tag']);
    expect([...targeta.querySelectorAll('.sp-card-body > ul.sp-card-labels > li')].map((li) => [li.textContent, li.className]), titol)
      .toEqual(etiquetesAmbEstat(plugin, 'ca').map((etiqueta) => [etiqueta.text, `sp-card-label ${etiqueta.className}`]));
    expect(targeta.querySelectorAll('ul.sp-card-labels'), titol).toHaveLength(1);
    expect(targeta.querySelector('ul.sp-card-labels [href]'), titol).toBeNull();
    expect(targeta.querySelector('.sp-card-accio'), titol).toBeNull();
    expect(targeta.querySelector('.sp-card-portes'), titol).toBeNull();
    /* La boina: l'entitat Sóc de Poble, enllaçada a la seua pàgina.
       Onada 10 (M4) · I la franja taronja: UNA pastilla, un botó, amb la
       data i l'hora del registre. */
    const capcal = targeta.querySelector('header.sp-card-header');
    expect(capcal.querySelector('.sp-card-author-name').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.author);
    expect(capcal.querySelector('.sp-card-author-location').textContent, titol).toBe(AUTORIA_SOCDEPOBLE.location);
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href'), titol).toBe(RUTA_PERFIL_PROJECTE);
    expect(targeta.querySelectorAll('.btn-date-time'), titol).toHaveLength(1);
    expect(pastillaDelRegistre(plugin), titol).toHaveLength(2);
    expect(pastillaDe(targeta), titol).toEqual(pastillaDelRegistre(plugin));
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

/* R1 · Targetes estàtiques: cap xifra, comptador ni avís que isca de les
   dades. El Panell també es munta dins de l'amfitrió.
   Onada 8 (261009) · El copyright de les targetes (COPYRIGHT_SDP, «CC
   BY-NC-SA 4.0…») porta el número de versió de la llicència, que no és cap
   dada: es comprova que és exactament eixe text i es deixa fora de la
   comprovació de xifres. La resta de la targeta, com abans.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   DEROGADA EN PART: R1 deia també «cap data» i la prova exigia que cap
   targeta dels espais portara pastilla. L'ordre nova: cada targeta porta la
   franja taronja amb la data FIXA del registre, que no ix de les dades de
   ningú (no és de cap apunt, de cap comptador ni de cap eina, i és la
   mateixa per a tothom i a qualsevol amfitrió). La pastilla és l'ÚNICA
   xifra admesa: es comprova que és exactament la del registre i es retira
   d'un clon, com el copyright, i a la resta s'exigix zero xifres, com
   sempre. */
test('R1 · Onada 10 · als dos espais, l’única xifra és la pastilla de la data del registre: cap altra al text, a la boina ni al quadrat', () => {
  pinta();
  for (const espai of ESPAIS_PLUGINS) {
    const seccio = seccioDe(espai.titol);
    const plugins = pluginsDeLEspai(espai.id);
    const net = seccio.cloneNode(true);
    const drets = [...net.querySelectorAll('.sp-card-copyright')];
    expect([espai.id, drets.length]).toEqual([espai.id, targetesDe(seccio).length]);
    for (const paragraf of drets) {
      expect([espai.id, paragraf.textContent]).toEqual([espai.id, COPYRIGHT_SDP]);
      paragraf.remove();
    }
    /* Una pastilla per targeta, dins de la boina, amb la data del registre i res més. */
    const pastilles = [...net.querySelectorAll('.btn-date-time')];
    expect([espai.id, pastilles.length]).toEqual([espai.id, plugins.length]);
    for (const [index, pastilla] of pastilles.entries()) {
      const plugin = plugins[index];
      const esperada = pastillaDelRegistre(plugin);
      expect([plugin.id, pastilla.matches('header.sp-card-header .sp-card-meta > button.btn-date-time')]).toEqual([plugin.id, true]);
      expect([plugin.id, [...pastilla.querySelectorAll('span')].map((s) => s.textContent)]).toEqual([plugin.id, esperada]);
      expect([plugin.id, pastilla.textContent]).toEqual([plugin.id, esperada.join('')]);
      /* El seu nom accessible només diu eixa mateixa data (i on porta). */
      expect([plugin.id, pastilla.getAttribute('aria-label').startsWith(`${esperada.join(' ')} · `)]).toEqual([plugin.id, true]);
      expect([plugin.id, /\d/.test(pastilla.getAttribute('aria-label').slice(esperada.join(' ').length))]).toEqual([plugin.id, false]);
      pastilla.remove();
    }
    /* Sense el copyright ni la pastilla: zero xifres, al text i als noms accessibles. */
    expect([espai.id, /\d/.test(net.textContent)]).toEqual([espai.id, false]);
    expect([espai.id, [...net.querySelectorAll('[aria-label]')].filter((el) => /\d/.test(el.getAttribute('aria-label')))])
      .toEqual([espai.id, []]);
    expect([espai.id, [...net.querySelectorAll('[title]')].filter((el) => /\d/.test(el.getAttribute('title')))])
      .toEqual([espai.id, []]);
    /* Ni les etiquetes noves ni el quadrat de la targeta porten cap xifra. */
    expect([espai.id, [...seccio.querySelectorAll('ul.sp-card-labels > li')].filter((li) => /\d/.test(li.textContent))]).toEqual([espai.id, []]);
    expect(seccio.querySelector('.sp-card-calendar-badge'), espai.id).toBeNull();
  }
});

/* D3 · La targeta de la Gestoria porta a la seua pàgina, la mateixa en
   desenvolupament i en producció: el Panell no llig mai el destí d'«Obrir»
   (W4-11). Cap enllaç a l'eina local de la Wiki, a /gestoria ni a una app. */
test('D3 · cap targeta dels espais porta a l’eina local, a /gestoria ni directament a una app', () => {
  pinta();
  const gestoria = targetesDe(seccioDe('Economia i Empresa')).find((targeta) => titolDe(targeta) === 'Gestoria');
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
   als espais: llevar les tres d'«Economia i Empresa» la buida, i un espai buit
   no pinta cap capçalera. La llar no en depén. */
test('la preferència amaga una targeta d’un espai; un espai buit no es pinta i l’altre continua', () => {
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ gestoria: false, tpv: false, rebost: false }));
  pinta();
  expect(seccioDe('Economia i Empresa')).toBeNull();
  expect(screen.queryByText('Gestoria', { selector: '.sp-card-title' })).toBeNull();
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(DE_LA_LLAR);
  cleanup();
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ salut: false }));
  pinta();
  expect(targetesDe(seccioDe('Economia i Empresa')).map(titolDe)).toEqual(['Gestoria', 'TPV del Bar', 'Rebost Domèstic']);
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(['Arbre Genealògic', 'L’Avisador']);
  cleanup();
  /* P0-114 (ordre del Mestre, 261111) · L'Avisador també es pot llevar del Panell, com les altres. */
  localStorage.setItem(CLAU_UTILITATS, JSON.stringify({ avisador: false }));
  pinta();
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(['Salut', 'Arbre Genealògic']);
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
    expect(targetesDe(seccioDe('Economia i Empresa')).map(titolDe)).toEqual(['Gestoria', 'TPV del Bar', 'Rebost Domèstic']);
    act(() => { expect(desaUtilitatActiva('gestoria', false)).toBe(true); });
    expect(targetesDe(seccioDe('Economia i Empresa')).map(titolDe)).toEqual(['TPV del Bar', 'Rebost Domèstic']);
    expect(JSON.parse(localStorage.getItem(CLAU_PROPIA))).toEqual({ gestoria: false });
    act(() => { desaUtilitatActiva('gestoria', true); });
    expect(targetesDe(seccioDe('Economia i Empresa')).map(titolDe)).toEqual(['Gestoria', 'TPV del Bar', 'Rebost Domèstic']);
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
  expect(targetesDe(seccioDe('Economia i Empresa')).map(titolDe)).toEqual(['Gestoria', 'TPV del Bar', 'Rebost Domèstic']);
  expect(targetesDe(seccioDe('La llar')).map(titolDe)).toEqual(['Arbre Genealògic', 'L’Avisador']);
});
