/* La Nevera de Casa · les vistes dins de la plataforma de veres
   (RutaApps → AppNevera → ClosaAplicacio → AppGridShell) amb el magatzem
   sobre el navegador fals de P2. Ample (1400 px) i estret (375 px).
   Totes les dades són sintètiques; els productes de botiga es prenen
   d'ARTICLES_PRODUCTES, mai escrits a mà, perquè una reexportació del full
   no trenque estes proves. */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { validaTaulaDeClosa } from '../plataforma/index.js';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { NOM_BASE, STORE, creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';
import {
  ARTICLES_BASE, ARTICLES_PRODUCTES, CATEGORIES, IDS_RESERVATS, LIMITS, afig, amagaSeccio, clauDeNom, creaLlista, esIdNevera,
  estatInicial, llegixCopia, marcaACasa, serialitzaCopia
} from './nucli/index.js';
import { RUTES } from './rutes.js';
import { detallDeProducte } from './vistes/vestits.js';
/* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil, ja no a /projecte. */
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const tancats = [];

/* Un navegador fals (compartible entre «pestanyes») i l'app registrada amb el seu magatzem. */
function prepara({ idb = creaIdbFals(), locks = creaLocksFals(), canal = creaCanalFals(), sensebase = false } = {}) {
  const magatzem = sensebase
    ? creaMagatzemNevera({ idb: null, navegador: {}, Canal: null })
    : creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
  tancats.push(magatzem);
  const descarrega = vi.fn();
  const App = () => <AppNevera magatzem={magatzem} descarrega={descarrega} />;
  const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
  return { idb, locks, canal, magatzem, descarrega, registre };
}

const munta = (url, entorn = prepara()) => {
  muntaPlataforma(url, { registre: entorn.registre, entorn: ENTORN });
  return entorn;
};
const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => within(document.getElementById(id));
const esquerra = () => columna('app-grid-sidebar');
const mig = () => columna('app-grid-list');
const detall = () => columna('app-grid-main');
/* El catàleg real té centenars de botons (targeta i peu). Acotem l'article
   pel seu id estable abans de comprovar el mateix rol i nom accessible:
   no es lleva cap guarda d'accessibilitat ni es consulten nodes amagats. */
const targetesDetall = (id) => [...document.querySelectorAll('#app-grid-main article.sp-card')]
  .filter((targeta) => [...targeta.querySelectorAll('[data-element]')].some((node) => node.dataset.element === id));
const botonsDetall = (id, nom) => targetesDetall(id)
  .flatMap((targeta) => within(targeta).queryAllByRole('button', { name: nom }));
const botoDetall = (id, nom) => {
  const targetes = targetesDetall(id);
  expect(targetes).toHaveLength(1);
  return within(targetes[0]).getByRole('button', { name: nom });
};
const closca = () => document.querySelector('.app-grid-shell');
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
/* El que hi ha al «disc» del navegador fals. */
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
const liniesDesades = (idb, llistaId = 'casa') => desat(idb)?.llistes.find((l) => l.id === llistaId)?.linies;
const espera = (ms) => act(() => new Promise((resolve) => { setTimeout(resolve, ms); }));
/* Una entrada de la barra de l'app (NavLink: push) i el botó arrere del navegador. */
const ves = (url) => act(async () => {
  window.history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
});
const arrere = async (esperat) => {
  await act(async () => { window.history.back(); });
  await waitFor(() => expect(ubicacio()).toBe(esperat));
};

/* Un producte de botiga amb nom sense sufix, d'una secció que la llista nova mostra. */
const PRODUCTE = ARTICLES_PRODUCTES.find((article) => !article.nom.includes(' · ') && !estatInicial().llistes[0].amagades.includes(article.categoriaId));
/* L'opció de l'afegit ràpid: el nom i, davall, «marca · envàs». */
const opcioDe = (article) => [article.nom, detallDeProducte(article)].filter(Boolean).join(' ');
/* El títol d'una secció de la graella amb els seus articles de base (i `mes` rajoles més). */
const titolDeSeccio = (categoriaId, mes = 0) => {
  const n = ARTICLES_BASE.filter((article) => article.categoriaId === categoriaId).length + mes;
  return `${CATEGORIES.find((categoria) => categoria.id === categoriaId).nom} ${n} ${n === 1 ? 'article' : 'articles'}`;
};
const comencaPer = (text) => (nom) => nom.startsWith(text);
/* La línia de davall de la targeta d'un element principal (l'especificació o l'estat), o null. */
const davallDe = (boto) => boto.closest('article.sp-card')?.querySelector('.sp-card-text')?.textContent ?? null;
const titolsDeSeccio = () => detall().getAllByRole('heading', { level: 3 }).map((titol) => titol.textContent);

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  ambAmplada(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('el contracte amb la plataforma', () => {
  test('el manifest és vàlid i la taula de rutes passa validaTaulaDeClosa', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestNevera);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(validaTaulaDeClosa(RUTES, manifest)).toEqual({ ok: true, errors: [] });
    expect(new Set(RUTES.map((ruta) => ruta.path.split('/')[0]))).toEqual(new Set(manifest.entrades.map((e) => e.slug)));
  });

  test('NEV-R2: cada entrada té la seua ruta amb :llista, i cap llista pot dur el nom d’un tram que va al mateix lloc', () => {
    const ambLlista = new Set(RUTES.filter((ruta) => ruta.path.split('/')[1] === ':llista').map((ruta) => ruta.path.split('/')[0]));
    expect(ambLlista).toEqual(new Set(manifestNevera.entrades.map((e) => e.slug)));
    const segons = new Set(RUTES.map((ruta) => ruta.path.split('/')[1]).filter((tram) => tram && !tram.startsWith(':')));
    expect([...segons].sort()).toEqual([...IDS_RESERVATS].sort());
    for (const tram of segons) expect(esIdNevera(tram), tram).toBe(false);
  });
});

describe('La compra en ample: llistes, la llista i el catàleg de costat', () => {
  /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, «no inventar targetes») · Les
     rajoles de la Nevera ja són UniversalCard (forma="targetes" de l'esquelet): el nom accessible de
     l'element principal és el nom de l'article, l'especificació o l'estat van a la línia de davall
     (.sp-card-text) i l'id, a data-element. */
  test('tocar un article del catàleg el posa a la llista (targeta) i es desa', async () => {
    const { idb } = munta('/app/nevera/llista');
    await screen.findByRole('region', { name: 'Catàleg' });
    expect(closca().dataset.layout).toBe('ample');
    expect(esquerra().getByRole('link', { name: /^Casa/ }).getAttribute('aria-current')).toBe('true');
    expect(esquerra().getByRole('link', { name: /^Casa/ }).getAttribute('href')).toBe('/app/nevera/llista/casa');
    expect(mig().getByText('La llista és buida')).toBeTruthy();
    expect(detall().getAllByRole('heading', { level: 3 })[0].textContent).toBe('Fruita i verdura 13 articles');

    const llet = botoDetall('llet', 'Llet');
    expect(llet.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(llet);
    expect(botoDetall('llet', 'Llet').getAttribute('aria-pressed')).toBe('true');
    const rajola = mig().getByRole('button', { name: 'Llet' });
    expect(rajola.dataset.element).toBe('llet');
    expect(rajola.getAttribute('aria-pressed')).toBe('true');
    expect(mig().getByRole('heading', { level: 3 }).textContent).toBe('Per comprar 1 article');
    await waitFor(() => expect(liniesDesades(idb)).toEqual([{ articleId: 'llet', especificacio: '' }]));
  });

  /* Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · L'anatomia de sempre i
     el peu per defecte, sense Compartir (una llista privada no té res a compartir) i amb el Connectar
     fora de la telemetria. Cap imatge: sense foto, la icona de la secció va al quadrat. */
  test('cada article és una UniversalCard: el quadrat amb la icona de la secció, l’estat en etiqueta, el peu sense Compartir i el Connectar sense telemetria', async () => {
    const vistos = [];
    const escolta = (event) => vistos.push(event.detail);
    window.addEventListener('sdp:telemetria', escolta);
    try {
      munta('/app/nevera/llista/casa');
      await screen.findByRole('region', { name: 'Catàleg' });
      fireEvent.click(botoDetall('llet', 'Llet'));
      const targeta = botoDetall('llet', 'Llet').closest('article.sp-card');
      /* REGLA D'OR 1 (ordre del Mestre, 261004) · Boina dalt (abans no n'hi havia), l'element
         principal, el cos i el peu: l'anatomia de tota UniversalCard. */
      expect([...targeta.children].map((e) => e.className)).toEqual(['sp-card-header', 'sp-card-link-overlay', 'sp-card-body has-calendar-badge has-aside', 'sp-card-footer']);
      /* Derogat per l'ordre del Mestre, 261004 (integració final, F04 de Codex) · La targeta porta
         també el subtítol (h4 d'UniversalCard): la secció de l'article. */
      expect(within(targeta).getAllByRole('heading').map((h) => `${h.tagName} ${h.textContent}`)).toEqual(['H4 Llet', 'H4 Llet i formatge']);
      const quadrat = targeta.querySelector('.sp-card-calendar-badge');
      expect(quadrat.getAttribute('aria-label')).toBe('Llet i formatge');
      expect(quadrat.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      /* Ordre del Mestre, 261004 (regressió de la Nevera) · L'estat va en l'etiqueta i, per al
         lector, a la descripció de l'element principal (un span .sdp-nomes-lector amb el mateix
         text): la consulta de text demana l'etiqueta. */
      expect(within(targeta).getByText('A la llista', { selector: '.sp-card-label' }).className).toBe('sp-card-label sdp-badge-tag');
      const descripcio = (boto) => document.getElementById(boto.getAttribute('aria-describedby'))?.textContent;
      expect(descripcio(botoDetall('llet', 'Llet'))).toBe('A la llista');
      /* A la llista, la mateixa targeta: «Per comprar» en etiqueta i aria-pressed. */
      const enLlista = mig().getByRole('button', { name: 'Llet' }).closest('article.sp-card');
      expect(within(enLlista).getByText('Per comprar', { selector: '.sp-card-label' })).toBeTruthy();
      expect(descripcio(mig().getByRole('button', { name: 'Llet' }))).toBe('Per comprar');
      expect(enLlista.querySelector('.sp-card-calendar-badge').getAttribute('aria-label')).toBeTruthy();
      /* Cap foto: les úniques imatges són el logo de Sóc de Poble a l'avatar de la boina (un recurs
         propi, sense referent). Onada 8 (261009) · El logo és el PNG (abans, l'SVG). */
      const imatges = [...document.querySelectorAll('#app-grid-main img, #app-grid-list img')];
      expect(imatges.length).toBeGreaterThan(0);
      for (const img of imatges) {
        expect(img.className).toBe('sp-card-avatar');
        expect(img.getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
        expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
      }
      const peu = targeta.querySelector('footer.sp-card-footer');
      expect([...peu.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual(['Traduir Llet', 'Comentar Llet', 'Connectar amb Llet']);
      fireEvent.click(within(peu).getByRole('button', { name: 'Connectar amb Llet' }));
      /* El clic s'ha fet (porta on sempre) i cap intent «connectar» ha eixit. */
      expect(ubicacio()).toMatch(/^\/connectar\?/);
      expect(vistos.filter((intent) => intent?.nom === 'connectar')).toEqual([]);
    } finally {
      window.removeEventListener('sdp:telemetria', escolta);
    }
  });

  /* REGLA D'OR 1 (ordre del Mestre, 261004) · Tota targeta porta la boina taronja amb l'autor real,
     enllaçat a la seua pàgina. El catàleg de la Nevera (els articles de base, els productes de botiga
     i els «Recents») és de l'entitat Sóc de Poble, que porta al seu perfil (Onada 8, 261009; abans,
     a la pàgina del projecte; resolt per identificador a la plataforma). Un article propi és de la
     persona, que la plataforma no dona a les apps: «Tu», sense enllaç ni perfil inventat (Onada 8,
     261009: l'enllaç a la pàgina de qui mira és pendent de MarIA, vistes/autoria.js). Munta el
     catàleg sencer i el recorre targeta a targeta: més temps que els 5 s per defecte. */
  test('REGLA D’OR 1: tota targeta porta la boina; el catàleg signa Sóc de Poble (porta al seu perfil) i un article propi, «Tu»', async () => {
    const boinaDe = (boto) => boto.closest('article.sp-card').querySelector('header.sp-card-header');
    const delProjecte = (boto) => {
      const boina = boinaDe(boto);
      expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
      expect(boina.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
      expect(within(boina).getByRole('link', { name: /^Sóc de Poble/ }).getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    };
    const entorn = prepara();
    await entorn.magatzem.desa(afig(afig(estatInicial(), 'casa', 'pa'), 'casa', PRODUCTE.id));
    munta('/app/nevera/llista/casa', entorn);
    await screen.findByRole('region', { name: 'Catàleg' });
    const camp = screen.getByRole('combobox', { name: 'Necessite…' });
    fireEvent.change(camp, { target: { value: 'Kombutxa' } });
    fireEvent.click(within(camp.closest('form')).getByRole('button', { name: 'Afig' }));
    /* Cap targeta sense boina, ni a la llista ni al catàleg. */
    const targetes = [...document.querySelectorAll('#app-grid-main article.sp-card, #app-grid-list article.sp-card')];
    expect(targetes.length).toBeGreaterThan(10);
    for (const targeta of targetes) {
      expect(targeta.querySelector('header.sp-card-header .sp-card-author-name'), targeta.textContent).not.toBeNull();
    }
    /* Un article de base i un producte de botiga, a la llista i al catàleg: Sóc de Poble. */
    delProjecte(botoDetall('llet', 'Llet'));
    delProjecte(mig().getByRole('button', { name: 'Pa' }));
    delProjecte(mig().getByRole('button', { name: PRODUCTE.nom }));
    delProjecte(botoDetall(PRODUCTE.id, PRODUCTE.nom));
    /* L'article propi: «Tu», sense enllaç ni foto (el cercle de reserva). */
    const propia = boinaDe(mig().getByRole('button', { name: 'Kombutxa' }));
    expect(propia.querySelector('.sp-card-author-name').textContent).toBe('Tu');
    expect(propia.querySelector('span.sp-card-author-block')).not.toBeNull();
    expect(within(propia).queryByRole('link')).toBeNull();
    expect(propia.querySelector('img')).toBeNull();
    /* «Recents» (Compra.jsx els vestix a part): també la boina. */
    fireEvent.click(mig().getByRole('button', { name: 'Pa' }));
    delProjecte(within(detall().getByRole('region', { name: /^Recents/ })).getByRole('button', { name: 'Pa' }));
  }, 30000);

  test('marcar comprat: la rajola ix de la llista i l’article passa a «Recents» del catàleg', async () => {
    const { idb } = munta('/app/nevera/llista/casa');
    await screen.findByRole('region', { name: 'Catàleg' });
    fireEvent.click(botoDetall('ous', 'Ous'));
    fireEvent.click(mig().getByRole('button', { name: 'Ous' }));
    expect(mig().getByText('La llista és buida')).toBeTruthy();
    expect(detall().getAllByRole('heading', { level: 3 })[0].textContent).toBe('Recents 1 article');
    await waitFor(() => expect(desat(idb)?.llistes[0].recents).toEqual([{ articleId: 'ous', especificacio: '' }]));
    /* Un toc a «Recents» el torna a posar. */
    fireEvent.click(botonsDetall('ous', 'Ous')[0]);
    expect(mig().getByRole('button', { name: 'Ous' })).toBeTruthy();
  });

  test('un enllaç amb ?article= obri el detall; l’especificació va a la llista i el detall es tanca', async () => {
    const { idb } = munta('/app/nevera/llista/casa?article=llet');
    const dialeg = await screen.findByRole('dialog', { name: 'Llet' });
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Especificació' }), { target: { value: 'sense lactosa' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Posa-ho a la llista' }));
    expect(ubicacio()).toBe('/app/nevera/llista/casa');
    expect(screen.queryByRole('dialog', { name: 'Llet' })).toBeNull();
    expect(davallDe(mig().getByRole('button', { name: 'Llet' }))).toBe('sense lactosa');
    const alCataleg = botoDetall('llet', 'Llet');
    expect(alCataleg.getAttribute('aria-pressed')).toBe('true');
    expect(davallDe(alCataleg)).toBe('sense lactosa');
    await waitFor(() => expect(liniesDesades(idb)).toEqual([{ articleId: 'llet', especificacio: 'sense lactosa' }]));
  });

  test('el botó dret d’una rajola de la llista obri el seu detall, que la pot llevar', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(afig(estatInicial(), 'casa', 'pa', { especificacio: 'de llenya' }));
    munta('/app/nevera/llista/casa', entorn);
    await screen.findByRole('region', { name: 'Catàleg' });
    const rajola = mig().getByRole('button', { name: 'Pa' });
    expect(davallDe(rajola)).toBe('de llenya');
    expect(rajola.getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
    fireEvent.contextMenu(rajola);
    expect(ubicacio()).toBe('/app/nevera/llista/casa?article=pa');
    const dialeg = screen.getByRole('dialog', { name: 'Pa' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Lleva de la llista' }));
    expect(mig().getByText('La llista és buida')).toBeTruthy();
  });

  test('«Necessite…»: un nom nou crea un article propi i el posa a la llista', async () => {
    const { idb } = munta('/app/nevera/llista/casa');
    const camp = await screen.findByRole('combobox', { name: 'Necessite…' });
    fireEvent.change(camp, { target: { value: 'Kombutxa' } });
    fireEvent.click(within(camp.closest('form')).getByRole('button', { name: 'Afig' }));
    expect(mig().getByRole('button', { name: 'Kombutxa' })).toBeTruthy();
    expect(camp.value).toBe('');
    await waitFor(() => expect(desat(idb)?.propis).toEqual([{ id: 'p-1', nom: 'Kombutxa' }]));
    expect(liniesDesades(idb)).toEqual([{ articleId: 'p-1', especificacio: '' }]);
  });

  test('«Necessite…» troba els productes de botiga amb «marca · envàs»; triar-ne un el posa a la llista i a la seua secció, i res més canvia', async () => {
    const { idb } = munta('/app/nevera/llista/casa');
    const camp = await screen.findByRole('combobox', { name: 'Necessite…' });
    const abans = titolsDeSeccio();
    expect(abans[0]).toBe('Fruita i verdura 13 articles');
    expect(abans).toContain(titolDeSeccio(PRODUCTE.categoriaId));
    expect(botonsDetall(PRODUCTE.id, PRODUCTE.nom)).toHaveLength(0);
    fireEvent.change(camp, { target: { value: PRODUCTE.nom.toLowerCase() } });
    fireEvent.click(screen.getByRole('option', { name: opcioDe(PRODUCTE) }));
    expect(camp.value).toBe('');
    expect(mig().getByRole('button', { name: PRODUCTE.nom })).toBeTruthy();
    expect(botoDetall(PRODUCTE.id, PRODUCTE.nom).getAttribute('aria-pressed')).toBe('true');
    /* Només la secció del producte guanya una rajola: la resta de la graella és la de sempre. */
    expect(titolsDeSeccio()).toEqual(abans.map((titol) => (titol === titolDeSeccio(PRODUCTE.categoriaId) ? titolDeSeccio(PRODUCTE.categoriaId, 1) : titol)));
    await waitFor(() => expect(liniesDesades(idb)).toEqual([{ articleId: PRODUCTE.id, especificacio: '' }]));
    expect(desat(idb).propis).toEqual([]);
  });

  test('«Necessite…»: els articles de base van davant dels productes de botiga', async () => {
    /* Un article de base que és el principi del nom d'un producte i de cap altre article de base. */
    const comenca = (nom, text) => clauDeNom(nom).startsWith(clauDeNom(text));
    const base = ARTICLES_BASE.find((article) => ARTICLES_PRODUCTES.some((producte) => comenca(producte.nom, article.nom))
      && ARTICLES_BASE.every((altre) => altre === article || !comenca(altre.nom, article.nom)));
    expect(base).toBeTruthy();
    const primer = ARTICLES_PRODUCTES.find((producte) => comenca(producte.nom, base.nom));
    munta('/app/nevera/llista/casa');
    const camp = await screen.findByRole('combobox', { name: 'Necessite…' });
    fireEvent.change(camp, { target: { value: base.nom.toLowerCase() } });
    const opcions = within(screen.getByRole('listbox', { name: 'Necessite…' })).getAllByRole('option').map((opcio) => opcio.textContent);
    expect(opcions.length).toBeGreaterThan(1);
    expect(opcions.length).toBeLessThanOrEqual(8);
    expect(opcions[0]).toBe(base.nom);
    expect(opcions[1]).toBe(opcioDe(primer));
  });

  test('una llista que no existix ho diu, i el catàleg no fa res', async () => {
    munta('/app/nevera/llista/l-99');
    expect(await screen.findByText('Esta llista no existix')).toBeTruthy();
    fireEvent.click(botoDetall('llet', 'Llet'));
    expect(mig().queryByRole('button', { name: 'Llet' })).toBeNull();
  });

  test('canviar de llista des de l’esquerra la fa l’activa (també per a les altres entrades)', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(afig(creaLlista(estatInicial(), 'Mercat'), 'l-1', 'tomaques'));
    munta('/app/nevera/llista/casa', entorn);
    await screen.findByRole('region', { name: 'Catàleg' });
    await waitFor(() => expect(desat(entorn.idb).darreraLlista).toBe('casa'));
    fireEvent.click(esquerra().getByRole('link', { name: /^Mercat/ }));
    expect(ubicacio()).toBe('/app/nevera/llista/l-1');
    expect(mig().getByRole('button', { name: 'Tomaques' })).toBeTruthy();
    await waitFor(() => expect(desat(entorn.idb).darreraLlista).toBe('l-1'));
  });
});

describe('La compra en estret', () => {
  test('la llista primer; «Afig des del catàleg» porta al catàleg (push) i arrere hi torna', async () => {
    ambAmplada(375);
    munta('/app/nevera/llista/casa');
    await screen.findByRole('region', { name: 'Casa' });
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.click(mig().getByRole('button', { name: 'Afig des del catàleg' }));
    expect(ubicacio()).toBe('/app/nevera/llista/casa/cataleg');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/llista/casa'));
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
  });

  test('el botó dret d’una rajola porta al catàleg amb el detall obert (la columna del catàleg no és inert)', async () => {
    ambAmplada(375);
    const entorn = prepara();
    await entorn.magatzem.desa(afig(estatInicial(), 'casa', 'ous'));
    munta('/app/nevera/llista/casa', entorn);
    const rajola = await screen.findByRole('button', { name: 'Ous' });
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.contextMenu(rajola);
    expect(ubicacio()).toBe('/app/nevera/llista/casa/cataleg?article=ous');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(screen.getByRole('dialog', { name: 'Ous' })).toBeTruthy();
  });
});

describe('A casa', () => {
  test('la tria directa marca «S’ha acabat»; «Cal comprar» el proposa i «+» l’afig a la llista', async () => {
    const { idb } = munta('/app/nevera/casa?article=ous');
    const dialeg = await screen.findByRole('dialog', { name: 'Ous' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'S’ha acabat' }));
    expect(screen.queryByRole('dialog', { name: 'Ous' })).toBeNull();
    expect(detall().getAllByRole('heading', { level: 3 })[0].textContent).toBe('El que tens a casa 1 article');
    const ous = botonsDetall('ous', 'Ous');
    expect(ous.map(davallDe)).toEqual(['S’ha acabat', 'S’ha acabat']);
    /* «Cal comprar» continua en línies (LiniesColleccio): el nom porta l'estat. */
    expect(mig().getByRole('button', { name: 'Ous S’ha acabat' })).toBeTruthy();
    fireEvent.click(mig().getByRole('button', { name: 'Afig Ous a «Casa»' }));
    expect(mig().getByText('No cal comprar res')).toBeTruthy();
    await waitFor(() => expect(liniesDesades(idb)).toEqual([{ articleId: 'ous', especificacio: '' }]));
    expect(desat(idb).casa).toEqual([{ articleId: 'ous', estat: 'acabat' }]);
  });

  test('un producte de botiga que se seguix ix a «El que tens a casa», a la seua secció i a «Cal comprar»', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(marcaACasa(estatInicial(), PRODUCTE.id, 'acabat'));
    munta('/app/nevera/casa', entorn);
    await screen.findByRole('region', { name: 'A casa' });
    expect(detall().getAllByRole('heading', { level: 3 })[0].textContent).toBe('El que tens a casa 1 article');
    expect(botonsDetall(PRODUCTE.id, PRODUCTE.nom).map(davallDe)).toEqual(['S’ha acabat', 'S’ha acabat']);
    expect(mig().getByRole('button', { name: `${PRODUCTE.nom} S’ha acabat` })).toBeTruthy();
    /* REGLA D'OR 1 (261004) · A «El que tens a casa» i a la seua secció, la boina del catàleg: Sóc de Poble. */
    for (const boto of botonsDetall(PRODUCTE.id, PRODUCTE.nom)) {
      const boina = boto.closest('article.sp-card').querySelector('header.sp-card-header');
      expect(within(boina).getByRole('link', { name: /^Sóc de Poble/ }).getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    }
    for (const targeta of document.querySelectorAll('#app-grid-main article.sp-card')) {
      expect(targeta.querySelector('header.sp-card-header .sp-card-author-name'), targeta.textContent).not.toBeNull();
    }
  });

  test('«Afig-ho tot» posa totes les propostes a la llista activa', async () => {
    const entorn = prepara();
    let estat = estatInicial();
    for (const [id, valor] of [['sal', 'se-n-acaba'], ['arros', 'acabat'], ['llet', 'hi-ha']]) {
      estat = { ...estat, casa: [...estat.casa, { articleId: id, estat: valor }] };
    }
    await entorn.magatzem.desa(estat);
    munta('/app/nevera/casa', entorn);
    await screen.findByRole('region', { name: 'A casa' });
    fireEvent.click(mig().getByRole('button', { name: 'Afig-ho tot' }));
    await waitFor(() => expect(liniesDesades(entorn.idb)).toEqual([
      { articleId: 'arros', especificacio: '' }, { articleId: 'sal', especificacio: '' }
    ]));
  });
});

describe('Llistes, Catàleg i Ajustos', () => {
  test('«Crea una llista» demana el nom, la crea i porta a /app/nevera/llista/<id>', async () => {
    munta('/app/nevera/llistes');
    fireEvent.click(await screen.findByRole('button', { name: 'Crea una llista' }));
    const dialeg = screen.getByRole('dialog', { name: 'Llista nova' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Crea la llista' }));
    expect(within(dialeg).getByText(/Escriu un nom/)).toBeTruthy();
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Nom de la llista' }), { target: { value: 'Mercat del dijous' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Crea la llista' }));
    expect(ubicacio()).toBe('/app/nevera/llista/l-1');
    expect(await screen.findByRole('region', { name: 'Mercat del dijous' })).toBeTruthy();
    expect(esquerra().getByRole('link', { name: /^Mercat del dijous/ }).getAttribute('aria-current')).toBe('true');
  });

  test('Catàleg: un article propi es crea, es pot posar a la llista i s’esborra amb confirmació', async () => {
    const { idb } = munta('/app/nevera/cataleg');
    const camp = await screen.findByRole('combobox', { name: 'Busca o crea un article' });
    fireEvent.change(camp, { target: { value: 'Tofu' } });
    fireEvent.click(within(camp.closest('form')).getByRole('button', { name: 'Afig' }));
    /* REGLA D'OR 1 (261004) · Al catàleg, l'article propi porta la boina de la persona («Tu», sense
       enllaç) i un de base, la del projecte. */
    const boinaDe = (boto) => boto.closest('article.sp-card').querySelector('header.sp-card-header');
    expect(boinaDe(botoDetall('p-1', 'Tofu')).querySelector('.sp-card-author-name').textContent).toBe('Tu');
    expect(within(boinaDe(botoDetall('p-1', 'Tofu'))).queryByRole('link')).toBeNull();
    expect(within(boinaDe(botoDetall('llet', 'Llet'))).getByRole('link', { name: /^Sóc de Poble/ }).getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    const propis = mig();
    fireEvent.click(propis.getByRole('button', { name: 'Tofu' }));
    expect(ubicacio()).toBe('/app/nevera/cataleg/casa?article=p-1');
    const dialeg = screen.getByRole('dialog', { name: 'Tofu' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Posa-ho a «Casa»' }));
    expect(propis.getByRole('button', { name: 'Tofu A «Casa»' })).toBeTruthy();
    fireEvent.click(propis.getByRole('button', { name: 'Esborra Tofu' }));
    const confirma = screen.getByRole('dialog', { name: 'Vols esborrar «Tofu»?' });
    fireEvent.click(within(confirma).getByRole('button', { name: 'Esborra' }));
    expect(propis.getByText('Encara no n’has creat cap')).toBeTruthy();
    await waitFor(() => expect(desat(idb)?.propis).toEqual([]));
    expect(liniesDesades(idb)).toEqual([]);
  });

  test('Catàleg: «Busca o crea un article» obri el detall d’un producte de botiga, que es posa a la llista sense crear cap propi', async () => {
    const { idb } = munta('/app/nevera/cataleg');
    const camp = await screen.findByRole('combobox', { name: 'Busca o crea un article' });
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/cataleg/casa'));
    expect(botonsDetall(PRODUCTE.id, comencaPer(PRODUCTE.nom))).toHaveLength(0);
    fireEvent.change(camp, { target: { value: PRODUCTE.nom.toLowerCase() } });
    fireEvent.click(screen.getByRole('option', { name: opcioDe(PRODUCTE) }));
    expect(ubicacio()).toBe(`/app/nevera/cataleg/casa?article=${PRODUCTE.id}`);
    const dialeg = screen.getByRole('dialog', { name: PRODUCTE.nom });
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Especificació' }), { target: { value: 'el gran' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Posa-ho a «Casa»' }));
    expect(ubicacio()).toBe('/app/nevera/cataleg/casa');
    expect(screen.queryByRole('dialog', { name: PRODUCTE.nom })).toBeNull();
    expect(botonsDetall(PRODUCTE.id, comencaPer(PRODUCTE.nom)).length).toBeGreaterThan(0);
    await waitFor(() => expect(liniesDesades(idb)).toEqual([{ articleId: PRODUCTE.id, especificacio: 'el gran' }]));
    expect(desat(idb).propis).toEqual([]);
  });

  test('Catàleg: el detall d’un producte que no s’usa li posa la rajola mentre és obert; tancat sense afegir-lo, la graella torna a ser la d’abans', async () => {
    const { idb } = munta('/app/nevera/cataleg');
    const camp = await screen.findByRole('combobox', { name: 'Busca o crea un article' });
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/cataleg/casa'));
    const abans = titolsDeSeccio();
    expect(abans).toContain(titolDeSeccio(PRODUCTE.categoriaId));
    fireEvent.change(camp, { target: { value: PRODUCTE.nom.toLowerCase() } });
    fireEvent.click(screen.getByRole('option', { name: opcioDe(PRODUCTE) }));
    const dialeg = screen.getByRole('dialog', { name: PRODUCTE.nom });
    /* Mentre el detall és obert, la seua secció compta la rajola (ColumnaCataleg el busca entre els articles). */
    expect(titolsDeSeccio()).toEqual(abans.map((titol) => (titol === titolDeSeccio(PRODUCTE.categoriaId) ? titolDeSeccio(PRODUCTE.categoriaId, 1) : titol)));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·la' }));
    expect(screen.queryByRole('dialog', { name: PRODUCTE.nom })).toBeNull();
    expect(ubicacio()).toBe('/app/nevera/cataleg/casa');
    expect(titolsDeSeccio()).toEqual(abans);
    expect(botonsDetall(PRODUCTE.id, comencaPer(PRODUCTE.nom))).toHaveLength(0);
    expect(liniesDesades(idb) ?? []).toEqual([]);
  });

  test('Ajustos: el nom, l’ordre de les seccions i la còpia sdp.nevera.copia.v1', async () => {
    const entorn = munta('/app/nevera/ajustos');
    const nom = await screen.findByRole('textbox', { name: 'Nom de la llista' });
    fireEvent.change(nom, { target: { value: 'Casa del poble' } });
    fireEvent.click(screen.getByRole('button', { name: 'Canvia el nom' }));
    expect(screen.getByRole('region', { name: 'Ajustos de «Casa del poble»' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Baixa Fruita i verdura' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mostra Mascotes' }));
    await waitFor(() => expect(desat(entorn.idb)?.llistes[0]).toMatchObject({ nom: 'Casa del poble', amagades: ['mascotes'] }));
    expect(desat(entorn.idb).llistes[0].ordre.slice(0, 2)).toEqual(['pa-pastissos', 'fruita-verdura']);

    fireEvent.click(screen.getByRole('button', { name: 'Descarrega una còpia' }));
    expect(entorn.descarrega).toHaveBeenCalledTimes(1);
    const [{ nom: fitxer, tipus, dades }] = entorn.descarrega.mock.calls[0];
    expect(fitxer).toMatch(/^nevera-de-casa-\d{4}-\d{2}-\d{2}\.json$/);
    expect(tipus).toBe('application/json');
    const copia = llegixCopia(dades);
    expect(copia.ok).toBe(true);
    expect(copia.estat.llistes[0]).toMatchObject({ nom: 'Casa del poble', amagades: ['mascotes'] });
  });

  test('Ajustos: recuperar una còpia demana confirmació i substituïx les dades; un fitxer dolent ho diu', async () => {
    const entorn = munta('/app/nevera/ajustos/dades');
    const camp = await screen.findByLabelText('Recupera una còpia');
    fireEvent.change(camp, { target: { files: [new File(['no és json'], 'x.json', { type: 'application/json' })] } });
    expect(await screen.findByText('El fitxer no és un JSON vàlid.')).toBeTruthy();

    const text = serialitzaCopia(afig(creaLlista(estatInicial(), 'Mercat'), 'l-1', 'tomaques'));
    fireEvent.change(camp, { target: { files: [new File([text], 'copia.json', { type: 'application/json' })] } });
    const confirma = await screen.findByRole('dialog', { name: 'Vols recuperar esta còpia?' });
    expect(within(confirma).getByText(/Porta 2 llistes i 1 article/)).toBeTruthy();
    fireEvent.click(within(confirma).getByRole('button', { name: 'Recupera la còpia' }));
    await waitFor(() => expect(desat(entorn.idb)?.llistes.map((l) => l.nom)).toEqual(['Casa', 'Mercat']));
    expect(screen.queryByText('El fitxer no és un JSON vàlid.')).toBeNull();
  });
});

describe('el disc', () => {
  test('una altra pestanya escriu: ací només es mira i els tocs no canvien res', async () => {
    const idb = creaIdbFals();
    const locks = creaLocksFals();
    const canal = creaCanalFals();
    const altra = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
    tancats.push(altra);
    expect(await altra.obtinBloqueig()).toBe('escriptora');
    munta('/app/nevera/llista/casa', prepara({ idb, locks, canal }));
    expect(await screen.findByText('Només lectura')).toBeTruthy();
    fireEvent.click(botoDetall('llet', 'Llet'));
    expect(mig().getByText('La llista és buida')).toBeTruthy();
    /* L'altra pestanya desa: esta es posa al dia. */
    await altra.desa(afig(estatInicial(), 'casa', 'pa'));
    expect(await mig().findByRole('button', { name: 'Pa' })).toBeTruthy();
  });

  test('cap crida de xarxa en tot un recorregut (afegir, especificar, comprar, a casa)', async () => {
    const xarxa = vi.fn(() => Promise.reject(new Error('cap xarxa')));
    vi.stubGlobal('fetch', xarxa);
    const obri = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const { idb } = munta('/app/nevera/llista/casa');
    await screen.findByRole('region', { name: 'Catàleg' });
    fireEvent.click(botoDetall('tomaques', 'Tomaques'));
    fireEvent.contextMenu(mig().getByRole('button', { name: 'Tomaques' }));
    fireEvent.change(within(screen.getByRole('dialog', { name: 'Tomaques' })).getByRole('textbox', { name: 'Especificació' }), { target: { value: '1 kg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Posa-ho a la llista' }));
    expect(davallDe(mig().getByRole('button', { name: 'Tomaques' }))).toBe('1 kg');
    fireEvent.click(mig().getByRole('button', { name: 'Tomaques' }));
    await waitFor(() => expect(desat(idb)?.llistes[0].recents).toEqual([{ articleId: 'tomaques', especificacio: '1 kg' }]));
    expect(xarxa).not.toHaveBeenCalled();
    expect(obri).not.toHaveBeenCalled();
  });

  test('sense base local, avisa que no es guarda', async () => {
    munta('/app/nevera/llista', prepara({ sensebase: true }));
    expect(await screen.findByText('No es guarda')).toBeTruthy();
  });
});

describe('correccions de la revisió (NEV-R1…R9)', () => {
  test('NEV-R1: si la primera lectura falla, cap toc reescriu el disc i no es perd cap llista', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(creaLlista(estatInicial(), 'Mercat'));
    entorn.idb.control.bloqueja = true;
    munta('/app/nevera/llista/casa', entorn);
    const avis = (await screen.findByText('No s’ha pogut llegir')).closest('[role="alert"]');
    expect(document.getElementById('app-grid-list').contains(avis)).toBe(true);
    expect(within(avis).getByText(/Tanca-la i torna-ho a provar\. Mentrestant no es pot canviar res/)).toBeTruthy();
    entorn.idb.control.bloqueja = false;
    /* Abans de tornar a llegir, cap toc fa res: ni a la vista ni al disc. */
    fireEvent.click(botoDetall('llet', 'Llet'));
    expect(mig().getByText('La llista és buida')).toBeTruthy();
    await espera(30);
    expect(desat(entorn.idb).llistes.map((l) => l.nom)).toEqual(['Casa', 'Mercat']);
    /* «Torna-ho a provar» llig el disc: les llistes tornen i ja es pot treballar. */
    fireEvent.click(within(avis).getByRole('button', { name: 'Torna-ho a provar' }));
    expect(await esquerra().findByRole('link', { name: /^Mercat/ })).toBeTruthy();
    expect(screen.queryByText('No s’ha pogut llegir')).toBeNull();
    fireEvent.click(botoDetall('llet', 'Llet'));
    await waitFor(() => expect(liniesDesades(entorn.idb)).toEqual([{ articleId: 'llet', especificacio: '' }]));
    expect(desat(entorn.idb).llistes.map((l) => l.nom)).toEqual(['Casa', 'Mercat']);
  });

  test('NEV-R1: «Crea la llista» tampoc no fa res mentre no s’ha llegit el disc, i ho diu', async () => {
    const entorn = prepara();
    entorn.idb.control.bloqueja = true;
    munta('/app/nevera/llistes/casa', entorn);
    fireEvent.click(await screen.findByRole('button', { name: 'Crea una llista' }));
    const dialeg = screen.getByRole('dialog', { name: 'Llista nova' });
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Nom de la llista' }), { target: { value: 'Mercat' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Crea la llista' }));
    expect(within(dialeg).getByText(/no s’han pogut llegir/)).toBeTruthy();
    expect(ubicacio()).toBe('/app/nevera/llistes/casa');
  });

  test('NEV-R2: cada entrada porta la llista al camí (replace) i arrere torna a la mateixa llista', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(creaLlista(estatInicial(), 'Mercat'));
    munta('/app/nevera/llista/casa', entorn);
    await screen.findByRole('region', { name: 'Catàleg' });
    await ves('/app/nevera/ajustos');
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/ajustos/casa'));
    expect(screen.getByRole('region', { name: 'Ajustos de «Casa»' })).toBeTruthy();
    await ves('/app/nevera/llistes');
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/llistes/casa'));
    fireEvent.click(mig().getByRole('link', { name: /^Mercat/ }));
    expect(ubicacio()).toBe('/app/nevera/llista/l-1');
    await waitFor(() => expect(desat(entorn.idb).darreraLlista).toBe('l-1'));
    await arrere('/app/nevera/llistes/casa');
    await arrere('/app/nevera/ajustos/casa');
    expect(screen.getByRole('region', { name: 'Ajustos de «Casa»' })).toBeTruthy();
    /* Avant torna a Llistes; l'entrada «A casa» obri l'última llista que esta pestanya ha tingut al camí. */
    await act(async () => { window.history.forward(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/llistes/casa'));
    await ves('/app/nevera/casa');
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/casa/casa'));
    expect(mig().getAllByRole('heading', { level: 3 })[0].textContent).toMatch(/^Per a «Casa»/);
  });

  test('NEV-R2: el camí conserva la consulta; una llista esborrada fora de La compra es canonitza a la per defecte', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(creaLlista(estatInicial(), 'Mercat'));
    munta('/app/nevera/cataleg?categoria=begudes', entorn);
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/cataleg/l-1?categoria=begudes'));
    await ves('/app/nevera/ajustos/l-1');
    expect(await screen.findByRole('region', { name: 'Ajustos de «Mercat»' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Esborra esta llista' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Vols esborrar «Mercat»?' })).getByRole('button', { name: 'Esborra la llista' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/ajustos/casa'));
    expect(screen.getByRole('region', { name: 'Ajustos de «Casa»' })).toBeTruthy();
    await ves('/app/nevera/casa/l-99/cal-comprar');
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/casa/casa/cal-comprar'));
  });

  test('NEV-R3: sense Web Locks, un canvi d’una altra pestanya no fa reescriure la llista del camí (cap bucle)', async () => {
    const idb = creaIdbFals();
    const canal = creaCanalFals();
    const entorn = prepara({ idb, canal, locks: null });
    await entorn.magatzem.desa(creaLlista(estatInicial(), 'Mercat'));
    munta('/app/nevera/llista/casa', entorn);
    await screen.findByRole('region', { name: 'Catàleg' });
    await waitFor(() => expect(desat(idb).darreraLlista).toBe('casa'));
    /* L'altra pestanya (també escriptora: sense Web Locks) és a /llista/l-1 i
       fa com feia esta: quan rellig i la darrera no és la seua, la torna a desar. */
    const altra = creaMagatzemNevera({ idb: idb.idb, navegador: {}, Canal: canal.Canal });
    tancats.push(altra);
    expect(await altra.obtinBloqueig()).toBe('escriptora');
    let reescriptures = 0;
    altra.subscriu((avis) => {
      if (avis.tipus !== 'canvi' || avis.local !== false || reescriptures >= 20) return;
      altra.llegix().then((llegit) => {
        if (llegit.darreraLlista === 'l-1') return undefined;
        reescriptures += 1;
        return altra.desa({ ...llegit, darreraLlista: 'l-1' });
      });
    });
    await altra.desa({ ...(await altra.llegix()), darreraLlista: 'l-1' });
    /* Diverses voltes: cada una deixa córrer la relectura, l'efecte i el desat. */
    for (let volta = 0; volta < 6; volta += 1) await espera(20);
    expect(reescriptures).toBe(0);
    expect(desat(idb).darreraLlista).toBe('l-1');
    expect(mig().getByRole('region', { name: 'Casa' })).toBeTruthy();
    /* La llista per defecte d'una entrada sense llista és la d'esta pestanya, no la de l'altra. */
    await ves('/app/nevera/cataleg');
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/cataleg/casa'));
    for (let volta = 0; volta < 3; volta += 1) await espera(20);
    expect(reescriptures).toBe(0);
  });

  test('NEV-R4: en una pestanya lectora, «A casa» i «Catàleg» també ho diuen', async () => {
    for (const [url, cataleg] of [['/app/nevera/casa', 'A casa'], ['/app/nevera/cataleg', 'Catàleg']]) {
      const idb = creaIdbFals();
      const locks = creaLocksFals();
      const canal = creaCanalFals();
      const altra = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
      tancats.push(altra);
      expect(await altra.obtinBloqueig()).toBe('escriptora');
      munta(url, prepara({ idb, locks, canal }));
      await screen.findByRole('region', { name: cataleg });
      await waitFor(() => expect(mig().getByText('Només lectura'), url).toBeTruthy());
      cleanup();
    }
  });

  test('NEV-R6: «A casa» mostra les seccions amagades a la llista activa', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa(amagaSeccio(estatInicial(), 'casa', 'mascotes', true));
    munta('/app/nevera/casa', entorn);
    await screen.findByRole('region', { name: 'A casa' });
    expect(botoDetall('pinso-gos', 'Pinso de gos')).toBeTruthy();
  });

  test('NEV-R7: al límit de llistes, «Crea la llista» no es tanca en silenci', async () => {
    const entorn = prepara();
    let ple = estatInicial();
    while (ple.llistes.length < LIMITS.llistes) ple = creaLlista(ple, `Llista ${ple.llistes.length}`);
    await entorn.magatzem.desa(ple);
    munta('/app/nevera/llistes/casa', entorn);
    fireEvent.click(await screen.findByRole('button', { name: 'Crea una llista' }));
    const dialeg = screen.getByRole('dialog', { name: 'Llista nova' });
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Nom de la llista' }), { target: { value: 'Una més' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Crea la llista' }));
    expect(screen.getByRole('dialog', { name: 'Llista nova' })).toBeTruthy();
    expect(within(dialeg).getByText(`Ja tens ${LIMITS.llistes} llistes: esborra’n una abans de crear-ne una altra.`)).toBeTruthy();
    expect(ubicacio()).toBe('/app/nevera/llistes/casa');
  });

  test('NEV-R7: en una pestanya lectora, «Crea la llista» diu per què no la crea', async () => {
    const idb = creaIdbFals();
    const locks = creaLocksFals();
    const canal = creaCanalFals();
    const altra = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
    tancats.push(altra);
    expect(await altra.obtinBloqueig()).toBe('escriptora');
    munta('/app/nevera/llistes/casa', prepara({ idb, locks, canal }));
    await screen.findByText('Només lectura');
    fireEvent.click(screen.getByRole('button', { name: 'Crea una llista' }));
    const dialeg = screen.getByRole('dialog', { name: 'Llista nova' });
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Nom de la llista' }), { target: { value: 'Mercat' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Crea la llista' }));
    expect(within(dialeg).getByText('La nevera està oberta en una altra pestanya: crea la llista des d’allà.')).toBeTruthy();
  });

  test('NEV-R8: el nom de la còpia porta la data local (també a mitjanit)', async () => {
    const entorn = munta('/app/nevera/ajustos/dades');
    const boto = await screen.findByRole('button', { name: 'Descarrega una còpia' });
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      for (const hora of [0, 23]) {
        vi.setSystemTime(new Date(2026, 9, 3, hora, 30));
        fireEvent.click(boto);
      }
    } finally {
      vi.useRealTimers();
    }
    expect(entorn.descarrega.mock.calls.map(([{ nom }]) => nom)).toEqual(['nevera-de-casa-2026-10-03.json', 'nevera-de-casa-2026-10-03.json']);
  });

  test('NEV-R9: el separador de la columna del mig du el nom de la columna de cada entrada', async () => {
    munta('/app/nevera/casa');
    await screen.findByRole('region', { name: 'A casa' });
    expect(screen.getByRole('separator', { name: 'Redimensionar Cal comprar' })).toBeTruthy();
    for (const [url, columna] of [
      ['/app/nevera/cataleg', 'Articles propis'], ['/app/nevera/ajustos', 'Ajustos de la llista'],
      ['/app/nevera/llistes', 'Les meues llistes'], ['/app/nevera/llista', 'La llista']
    ]) {
      await ves(url);
      expect(await screen.findByRole('separator', { name: `Redimensionar ${columna}` }), url).toBeTruthy();
    }
  });
});
