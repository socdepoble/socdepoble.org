/* 261002 · Les eines locals de la Wiki (Tractors, Sentinelles i, des del
   261006, Agents), que només hi són en desenvolupament: vitest corre amb
   import.meta.env.DEV cert. El
   mode producció el proven modulsLocalsActius (ací) i
   WikiDePobleSection.produccio.test.jsx. Els components són dobles: les seues
   proves són a tractors/. UniversalPage és la de veres: es mira la capçalera
   que pinta.
   Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la Gestoria de Poble ja no és cap eina local de la Wiki.
   Viu a la seua app (src/apps/gestoria): ací es prova que en desenvolupament
   la Wiki no en porta cap carpeta, cap ítem ni cap closca. Els dobles de la
   Gestoria es queden com a sonda: si la Wiki la tornara a importar, es veurien.
   261006 (MarIA, WikiDePobleSection.jsx de les 01:46; prompt 261006_0224, T6,
   «la retirada de la Consola/Tractors»): ni Tractors ni la Consola tenen ja
   carpeta pròpia. Les tres eines locals i la Consola pengen de maquinaria_cat
   («Maquinària de la IAIA»), que declara la Wiki, i modulsLocalsActius ja no
   en torna cap categoria.
   Ordre del Mestre (pla 261007_0012, §0.7) · Les carpetes de la Wiki (les
   fixes i les del manifest) i la portada porten el seu emoji
   (iconesWiki.js); la fitxa de la portada ja no porta la imatge, i la
   capçalera de la portada oberta, sí.
   Pla 261027_0845 (Guarda Nocturna), §3 · Les eines (els seus botons)
   continuen sent només de desenvolupament; la seua documentació pública es
   llig fora de DEV (documentacioMaquinariaActiva, provada ací en pur i en mode
   producció a WikiDePobleSection.produccio.test.jsx). En desenvolupament, cap
   ítem de documentació: hi són les eines, com sempre. */
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FileText, Folder } from 'lucide-react';
import { ICONA_PORTADA, ICONES_CARPETES_WIKI, ICONES_ITEMS_WIKI, glifDeCarpetaWiki } from './iconesWiki.js';
import { PAGE_COPY } from '../text/pageContent';

const fixture = vi.hoisted(() => ({ itemId: '__intro', search: '', props: null, showToast: vi.fn(), redireccions: [] }));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: (props) => {
    fixture.props = props;
    const { model, renderDetail, className } = props;
    return <div className={className}>{renderDetail({ item: model.items.find(item => item.id === fixture.itemId) })}</div>;
  }
}));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:02_saber', parentId: null, label: 'SABER' }],
    items: [
      { id: 'constructor', title: 'Constructor', subtitle: '', categoryId: 'folder:02_saber', tags: [], attributes: {}, content: '# Constructor de murs\n\nText.' }
    ]
  }
}));
/* Navigate és una sonda: la Wiki no redirigix enlloc, ni amb els enllaços
   antics de la Gestoria (ordre del Mestre, 261004). */
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), useLocation: () => ({ pathname: '/wikidepoble', search: fixture.search }), Link: 'a',
  Navigate: ({ to }) => { fixture.redireccions.push(to); return null; }
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: fixture.showToast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Doble dels Tractors</p> }));
vi.mock('../tractors/PanellSentinelles.jsx', () => ({ default: () => <p>Doble dels Sentinelles</p> }));
vi.mock('../tractors/PanellAgents.jsx', () => ({ default: () => <p>Doble dels Agents</p> }));
/* Sondes: si la Wiki tornara a carregar la closca o Aprendre, es veurien. */
vi.mock('../gestoria/tauler/ShellGestoria.jsx', () => ({ default: () => <p>Doble de la Gestoria</p> }));
vi.mock('../gestoria/aprendre/Aprendre.jsx', () => ({ default: () => <p>Doble d’Aprendre</p> }));

import WikiDePobleSection, {
  AVIS_EINA_LOCAL_SENSE_TRADUCCIO, DATA_DOCUMENTACIO, TIPUS_DOCUMENTACIO, documentacioMaquinariaActiva, modulsLocalsActius
} from './WikiDePobleSection.jsx';
import * as modulWiki from './WikiDePobleSection.jsx';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';

afterEach(() => {
  cleanup();
  fixture.itemId = '__intro';
  fixture.search = '';
  fixture.showToast.mockClear();
  fixture.redireccions.length = 0;
  fixture.props = null;
});

const obri = (itemId) => {
  fixture.itemId = itemId;
  fixture.search = `?item=${itemId}`;
  return render(<WikiDePobleSection />).container;
};
const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')]
  .map((li) => [li.textContent, li.className.replace('sp-card-label ', '')]);

const LOCALS = [
  ['tractors_aprovacio', 'Aprovació de tractors', 'maquinaria_cat', 'tractors', 'Doble dels Tractors'],
  ['sentinelles_panell', 'Sentinelles', 'maquinaria_cat', 'sentinelles', 'Doble dels Sentinelles'],
  ['agents_panell', 'Agents (BIOS)', 'maquinaria_cat', 'agents', 'Doble dels Agents']
];
const esDeLaGestoria = (text) => /gestoria/i.test(String(text));

describe('modulsLocalsActius: la decisió, pura', () => {
  test('amb DEV cert: cap categoria pròpia i tres ítems a la Maquinària, amb la forma dels de la Consola; res de la Gestoria', () => {
    const { categories, items } = modulsLocalsActius({ DEV: true });
    expect(categories).toEqual([]);
    expect(items.map((i) => [i.id, i.title, i.categoryId, i.tags[0]])).toEqual(LOCALS.map(([id, titol, cat, etiqueta]) => [id, titol, cat, etiqueta]));
    expect([...categories, ...items].filter((x) => esDeLaGestoria(x.id) || esDeLaGestoria(x.label) || esDeLaGestoria(x.title))).toEqual([]);
    for (const item of items) {
      expect(item).toMatchObject({ categoryIds: [item.categoryId], attributes: { type: 'Eina local', author: 'Sistema' }, content: '' });
      expect(item.subtitle).toEqual(expect.any(String));
    }
  });

  /* Ordre del Mestre, 261004 (pla 2045, Marató 2230, F3) · La carpeta que
     agrupa les eines portava Folder (des del §0.7, el seu emoji: 🎛️); les
     seues fitxes porten glif propi perquè no hereten la carpeta. Des del
     261006 la carpeta és maquinaria_cat i la declara la Wiki (en
     desenvolupament, avall).
     Ordre del Mestre (261007) · El glif propi de cada eina és el seu emoji
     (iconesWiki.js), distint per a cada una: ja no el FileText de Lucide. */
  test('amb DEV cert: cap carpeta pròpia, i cada eina, el seu emoji propi i distint', () => {
    const { categories, items } = modulsLocalsActius({ DEV: true });
    expect(categories).toHaveLength(0);
    expect(items.map((i) => i.id)).toEqual(LOCALS.map(([id]) => id));
    expect(items.map((i) => i.icon)).toEqual(['🚜', '💂', '🤖']);
    for (const item of items) {
      expect(item.icon, item.id).toBe(ICONES_ITEMS_WIKI[item.id]);
      expect(item.icon, item.id).not.toBe(FileText);
    }
  });

  test.each([
    ['DEV fals (el build de producció)', { DEV: false, PROD: true }],
    ['DEV com a text', { DEV: 'true' }],
    ['sense DEV', {}],
    ['sense entorn', undefined],
    ['entorn nul', null]
  ])('%s: cap categoria ni cap ítem', (_cas, env) => {
    expect(modulsLocalsActius(env)).toEqual({ categories: [], items: [] });
  });
});

/* Pla 261027_0845 (Guarda Nocturna), §3 · Transparència radical: la
   documentació pública de les tres peces, la decisió pura. */
describe('documentacioMaquinariaActiva: la documentació pública, pura', () => {
  test('amb DEV cert, cap ítem: en desenvolupament hi són les eines', () => {
    expect(documentacioMaquinariaActiva({ DEV: true })).toEqual({ items: [] });
  });

  test.each([
    ['DEV fals (el build de producció)', { DEV: false, PROD: true }],
    ['DEV com a text', { DEV: 'true' }],
    ['sense DEV', {}],
    ['sense entorn', undefined],
    ['entorn nul', null]
  ])('%s: les tres peces, amb la fitxa de l’eina i el tipus de la documentació (el costat segur)', (_cas, env) => {
    const eines = modulsLocalsActius({ DEV: true }).items;
    const { items } = documentacioMaquinariaActiva(env);
    /* Revisió adversarial del bloc B (Guarda Nocturna 261027) · Proves
       actualitzades a propòsit: la data del text (T51) a attributes.date, menys
       al BIOS, que no en té, i el subtítol dels Sentinelles sense «aprova’ls».
       Derogat: «la fitxa de l’eina» sencera, amb el seu subtítol. */
    const SUBTITOL_SENTINELLES = 'Els set sentinelles d’autonomia: què observen i com s’aproven';
    expect(items).toEqual(eines.map((eina) => ({
      ...eina,
      subtitle: eina.id === 'sentinelles_panell' ? SUBTITOL_SENTINELLES : eina.subtitle,
      attributes: {
        type: TIPUS_DOCUMENTACIO,
        author: 'Sistema',
        ...(eina.id === 'agents_panell' ? {} : { date: DATA_DOCUMENTACIO[eina.id] })
      }
    })));
    expect(items.map((i) => [i.id, i.categoryId, i.icon])).toEqual([
      ['tractors_aprovacio', 'maquinaria_cat', '🚜'], ['sentinelles_panell', 'maquinaria_cat', '💂'], ['agents_panell', 'maquinaria_cat', '🤖']
    ]);
    expect(TIPUS_DOCUMENTACIO).toBe('Documentació');
  });

  /* T51 (regla del Mestre, 260928): «Cap document existeix sense data». Una
     data real, amb hora i zona (la pastilla és completa: data i hora), i mai
     posterior al moment de la prova (no és la d'ara: és la de la versió). */
  test('T51 · la data de cada text és un instant real, amb hora i zona, i el BIOS no en té', () => {
    expect(Object.keys(DATA_DOCUMENTACIO)).toEqual(['tractors_aprovacio', 'sentinelles_panell']);
    for (const [id, data] of Object.entries(DATA_DOCUMENTACIO)) {
      expect(data, id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?[+-]\d{2}:\d{2}$/);
      expect(Number.isNaN(Date.parse(data)), id).toBe(false);
      expect(Date.parse(data), id).toBeLessThanOrEqual(Date.now());
    }
  });

  /* Una pàgina que només es llig no convida a cap acció que no fa. */
  test('cap subtítol ni entradilla de la documentació convida a aprovar', () => {
    for (const item of documentacioMaquinariaActiva({ DEV: false }).items) {
      expect(item.subtitle, item.id).not.toMatch(/aprova[’']ls/i);
      expect(item.lead ?? '', item.id).not.toMatch(/aprova[’']ls/i);
    }
  });
});

describe('en desenvolupament', () => {
  test('la Maquinària de la IAIA va darrere de la portada; la Consola i les tres eines hi pengen, i ja no hi ha carpeta de la Consola ni dels Tractors', () => {
    render(<WikiDePobleSection />);
    const { model } = fixture.props;
    expect(model.categories.map((c) => c.id)).toEqual(['__intro_cat', 'maquinaria_cat', 'folder:02_saber']);
    const maquinaria = model.categories.find((c) => c.id === 'maquinaria_cat');
    expect(maquinaria.label).toBe('Maquinària de la IAIA');
    // Ordre del Mestre (pla 261007_0012, §0.7) · La carpeta, el seu emoji, ja no Folder.
    expect(maquinaria.icon).toBe(ICONES_CARPETES_WIKI.maquinaria_cat);
    expect(maquinaria.icon).toBe('🎛️');
    expect(model.items.filter((i) => i.categoryId === 'maquinaria_cat').map((i) => i.id))
      .toEqual(['consola_termodinamica', ...LOCALS.map(([id]) => id)]);
    // Pla 261027_0845 (Guarda Nocturna), §3 · En desenvolupament, les eines: cap ítem de documentació.
    expect(model.items.filter((i) => i.attributes?.type === TIPUS_DOCUMENTACIO)).toEqual([]);
    for (const item of model.items.filter((i) => i.categoryId === 'maquinaria_cat')) {
      expect(item.categoryIds, item.id).toEqual(['maquinaria_cat']);
      // Regla del glif (261004): cap fitxa de la Maquinària hereta la carpeta.
      // Ordre del Mestre (261007): el glif propi és el seu emoji.
      expect(item.icon, item.id).toBe(ICONES_ITEMS_WIKI[item.id]);
    }
    expect(model.items.find((i) => i.id === 'consola_termodinamica').icon).toBe('⚙️');
    // Ordre del Mestre (pla 261007_0012, §0.7) · La portada, a l'arbre i a la
    // llista, el seu emoji (📖); ja no el FileText de la seua entrada.
    expect(model.categories.find((c) => c.id === '__intro_cat').icon).toBe(ICONA_PORTADA);
    expect(model.items.find((i) => i.id === '__intro').icon).toBe(ICONA_PORTADA);
    expect(ICONA_PORTADA).toBe('📖');
    expect(model.categories.map((c) => c.icon)).not.toContain(FileText);
  });

  /* Ordre del Mestre (261007) · Els documents del manifest porten el seu emoji
     (iconesWiki.js · iconaDeDocument): sense camp d'icona al manifest generat,
     «constructor» (cap tipus) és el document genèric.
     Ordre del Mestre (pla 261007_0012, §0.7) · I cada carpeta del manifest, el
     seu (glifDeCarpetaWiki): SABER, l'òliba. */
  test('els documents del manifest porten el seu emoji; les carpetes del manifest, també el seu, ja no Folder', () => {
    render(<WikiDePobleSection />);
    const { model } = fixture.props;
    expect(model.items.find((i) => i.id === 'constructor').icon).toBe('📄');
    const saber = model.categories.find((c) => c.id === 'folder:02_saber');
    expect(saber.icon).toBe('🦉');
    expect(saber.icon).toBe(glifDeCarpetaWiki('folder:02_saber'));
    expect(model.categories.map((c) => c.icon)).not.toContain(Folder);
  });

  /* Ordre del Mestre (pla 261007_0012, §0.7) · «sense perdre la seua imatge
     hero quan s'obri el document»: la fitxa de la llista porta l'emoji (sense
     imatge, ItemMedia no la pinta en lloc seu) i la portada oberta conserva la
     imatge de la capçalera, del seu copy (UniversalPage de veres). */
  test('la portada: la fitxa porta l’emoji i cap imatge; oberta, la imatge de la capçalera continua', () => {
    const arrel = render(<WikiDePobleSection />).container;
    const portada = fixture.props.model.items.find((i) => i.id === '__intro');
    expect(portada.icon).toBe(ICONA_PORTADA);
    expect(portada.image).toBeUndefined();
    const page = PAGE_COPY.wikidepoble;
    expect(page.image).toEqual(expect.any(String));
    const hero = arrel.querySelector('.hero-image img');
    expect(hero).not.toBeNull();
    expect(hero.getAttribute('alt')).toBe(page.imageAlt);
    expect(hero.getAttribute('src')).toContain(page.image);
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(page.title);
  });

  /* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
     Gestoria i Wiki») · En DEV la Wiki ja no porta cap carpeta ni cap ítem de
     la Gestoria, ni la closca com a eina amb pàgina pròpia. */
  test('cap carpeta, cap ítem ni cap eina de la Gestoria a la Wiki', () => {
    render(<WikiDePobleSection />);
    const { model } = fixture.props;
    expect(model.categories.filter((c) => esDeLaGestoria(c.id) || esDeLaGestoria(c.label))).toEqual([]);
    expect(model.items.filter((i) => esDeLaGestoria(i.id) || esDeLaGestoria(i.title) || (i.tags || []).some(esDeLaGestoria))).toEqual([]);
    expect(Object.keys(modulWiki)).not.toContain('EINES_AMB_PAGINA_PROPIA');
    expect(screen.queryByText(/^Doble (de la Gestoria|d’Aprendre)$/)).toBeNull();
  });

  /* Ordre del Mestre, 261004: la Wiki no coneix cap id ni cap ruta de la
     Gestoria. Una URL vella cau com qualsevol ítem desconegut: es munta el
     Workspace i el detall és la portada, sense redirigir enlloc ni pintar res
     de la Gestoria. Amb router i Workspace de veres, a migracioGestoria.test.jsx. */
  test.each([
    ['?categoria=gestoria_cat&item=gestoria_panell', 'gestoria_panell'],
    ['?categoria=gestoria_cat&item=gestoria_aprendre', 'gestoria_aprendre'],
    ['?item=gestoria_panell', 'gestoria_panell'],
    ['?categoria=gestoria_cat', null]
  ])('la URL vella %s: un ítem desconegut, la portada i cap rastre de la Gestoria', async (search, itemId) => {
    const portada = render(<WikiDePobleSection />).container.querySelector('header.page-title h1').textContent;
    cleanup();
    fixture.search = search;
    fixture.itemId = itemId;
    const arrel = render(<WikiDePobleSection />).container;
    expect(fixture.redireccions).toEqual([]);
    expect(fixture.props).not.toBeNull();
    expect(fixture.props.model.categories.map((c) => c.id)).not.toContain('gestoria_cat');
    expect(fixture.props.model.items.map((i) => i.id)).not.toContain(itemId);
    expect(fixture.props.selection.categoryId).not.toBe('gestoria_cat');
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(portada);
    await Promise.resolve();
    expect(screen.queryByText(/^Doble /)).toBeNull();
    expect(arrel.querySelector('.sdp-gestoria-closca')).toBeNull();
    expect(arrel.textContent).not.toMatch(/Full trimestral|Tauler Central/);
  });

  test.each(LOCALS)('%s: pàgina amb la capçalera de la Consola i el component carregat a demanda', async (id, titol, _cat, etiqueta, doble) => {
    const arrel = obri(id);
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(titol);
    expect(pindoles(arrel)).toEqual([
      ['WIKI DE POBLE', 'sdp-badge-system'],
      ['Eina local', 'sdp-badge-category'],
      [etiqueta, 'sdp-badge-tag']
    ]);
    expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
    expect(await screen.findByText(doble)).toBeTruthy();
    expect(arrel.querySelectorAll('h1')).toHaveLength(1);
  });

  /* El subtítol i l'entradilla de la porta d'aprovació són de la pàgina, no del
     panell: ací es prova el que abans provava PanellTractors.test.jsx (ordre
     del Mestre, 13-10-2026, pla 261013_1930, front 2: proves en verd). */
  test('la porta d’aprovació: el subtítol i l’entradilla diuen què cobrix l’empremta', async () => {
    const arrel = obri('tractors_aprovacio');
    await screen.findByText('Doble dels Tractors');
    expect(arrel.querySelector('.page-intro h2').textContent).toBe('Què fa cada tractor, la seua empremta i la teua signatura');
    const entradilla = arrel.querySelector('.page-intro p.lead').textContent;
    expect(entradilla).toMatch(/cada línia de les fonts llistades/);
    expect(entradilla).toMatch(/el codi del tractor, el de la seua interfície i el d’esta porta/);
    expect(entradilla).toMatch(/Els components comuns de l’app \(botons, diàlegs, navegació\) no hi entren\. Si en canvia una línia, torna a «pendent»\.$/);
  });

  /* IDEA-27 (ordre del Mestre, àudio de 01:54 del 261025) · L'entradilla de
     Sentinelles estava perduda al cos, davall de l'h3 de la porta. Ara és de la
     pàgina: centrada davall de l'H2, i diu què és un sentinella i què no
     cobrix l'empremta. */
  test('Sentinelles: l’entradilla és de la pàgina, davall de l’H2', async () => {
    const arrel = obri('sentinelles_panell');
    await screen.findByText('Doble dels Sentinelles');
    const intro = arrel.querySelector('.page-intro');
    expect(intro.querySelector('h2').textContent).toBe('Els set sentinelles d’autonomia: aprova’ls i mira què observen');
    expect(intro.querySelector('h2').nextElementSibling).toBe(intro.querySelector('p.lead'));
    const entradilla = intro.querySelector('p.lead').textContent;
    expect(entradilla).toMatch(/^Un sentinella és un tractor que només observa/);
    expect(entradilla).toMatch(/Els components comuns de l’app \(botons, diàlegs, navegació\) no hi entren/);
  });

  test('Traduir no envia el text de l’eina enlloc: ho diu i no obri cap menú', async () => {
    obri('tractors_aprovacio');
    await screen.findByText('Doble dels Tractors');
    fireEvent.click(screen.getByRole('button', { name: 'Traduir' }));
    expect(fixture.showToast).toHaveBeenCalledWith(AVIS_EINA_LOCAL_SENSE_TRADUCCIO);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('un document que es diu com una propietat d’objecte no és cap eina', () => {
    const arrel = obri('constructor');
    expect(arrel.querySelector('header.page-title h1').textContent).toBe('Constructor de murs');
    expect(pindoles(arrel)).toEqual([['SABER', 'sdp-badge-category']]);
  });
});
