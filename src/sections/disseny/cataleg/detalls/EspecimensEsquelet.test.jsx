/* Ordre del Mestre (261002, sinergies T4/T8) · els espècimens de l'esquelet
   comú pinten els components de veres, sense h1 ni style= i sense cap avís
   de React; i els dos vestits (bar i compra) són LES MATEIXES columnes. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { REGISTRE } from '../registre.js';
import EspecimenArticles from './EspecimenArticles.jsx';
import EspecimenSeccionsCategoria from './EspecimenSeccionsCategoria.jsx';
import EspecimenColleccio from './EspecimenColleccio.jsx';
import EspecimenAfegitRapid from './EspecimenAfegitRapid.jsx';
import EspecimenDetallArticle from './EspecimenDetallArticle.jsx';
import EspecimenMarcColumna from './EspecimenMarcColumna.jsx';
import EspecimenEsqueletBar from './EspecimenEsqueletBar.jsx';
import EspecimenEsqueletCompra from './EspecimenEsqueletCompra.jsx';

const pla = (text) => text.replace(/[^\S\n\r\t ]/g, ' ');
const pinta = (Especimen) => render(<MemoryRouter rutaInicial="/disseny?categoria=estructura"><Especimen /></MemoryRouter>).container;

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

const PECES = [
  ['GraellaArticles', 'fonaments-articles', 'fonaments/articles'],
  ['LlistaArticles', 'fonaments-articles', 'fonaments/articles'],
  ['SeccionsCategoria', 'navegacio-seccions-categoria', 'navegacio/seccions-categoria'],
  ['SelectorCategoria', 'navegacio-seccions-categoria', 'navegacio/seccions-categoria'],
  ['OrdenaCategories', 'navegacio-seccions-categoria', 'navegacio/seccions-categoria'],
  ['LiniesColleccio', 'fonaments-colleccio', 'fonaments/colleccio'],
  ['BarraResum', 'fonaments-colleccio', 'fonaments/colleccio'],
  ['TargetesColleccions', 'fonaments-colleccio', 'fonaments/colleccio'],
  ['AfegitRapid', 'formularis-afegit-rapid', 'formularis/afegit-rapid'],
  ['DetallArticle', 'superposicions-detall-article', 'superposicions/detall-article'],
  ['MarcColumna', 'estructura-marc-columna', 'estructura/marc-columna']
];

/* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515) · GraellaArticles i
   LlistaArticles passen a 'obsolet' per a codi nou, amb el substitut al registre. L'espècimen
   continua viu (Salut i el Bar encara les fan servir). La resta, 'viu'. */
const OBSOLETES = new Map([
  ['GraellaArticles', 'UniversalCard + GraellaTargetes'],
  ['LlistaArticles', 'UniversalCard + GraellaTargetes']
]);

describe('el catàleg les coneix', () => {
  it('registre de PedraSeca («viu» o «obsolet» amb substitut), ítem del manifest i carregador per a cada peça', () => {
    for (const [nom, item, clau] of PECES) {
      const esperat = OBSOLETES.has(nom) ? { estat: 'obsolet', substitut: OBSOLETES.get(nom) } : { estat: 'viu' };
      expect(REGISTRE.find((e) => e.nom === nom), nom).toMatchObject(esperat);
      expect(REGISTRE.find((e) => e.nom === nom).fora, nom).toBeUndefined();
      expect(CATALOG_ITEMS.find((i) => i.id === item), item).toMatchObject({ detailKey: clau, status: 'viu' });
      expect(CATALOG_DETAIL_LOADERS[clau], clau).toBeTruthy();
    }
  });

  it('les columnes i la pantalla de src/apps/comu, fora de la porta; els dos vestits, a Estructura', () => {
    for (const nom of ['EsqueletCatalegColleccio', 'ColumnaCataleg', 'ColumnaColleccio', 'ColumnaColleccions']) {
      expect(REGISTRE.find((e) => e.nom === nom), nom).toMatchObject({ estat: 'viu', fora: true });
      expect(REGISTRE.find((e) => e.nom === nom).fitxer.startsWith('apps/comu/esquelet/'), nom).toBe(true);
    }
    for (const id of ['estructura-esquelet-bar', 'estructura-esquelet-compra']) {
      expect(CATALOG_ITEMS.find((i) => i.id === id), id).toMatchObject({ categoryIds: ['estructura'], status: 'viu' });
    }
  });
});

describe('els espècimens', () => {
  it.each([
    ['GraellaArticles · LlistaArticles', EspecimenArticles, '.sdp-graella-articles'],
    ['SeccionsCategoria · SelectorCategoria · OrdenaCategories', EspecimenSeccionsCategoria, '.sdp-ordena-categories'],
    ['LiniesColleccio · BarraResum · TargetesColleccions', EspecimenColleccio, '.sdp-linies'],
    ['AfegitRapid', EspecimenAfegitRapid, '.sdp-afegit-rapid'],
    ['DetallArticle', EspecimenDetallArticle, 'dialog.sdp-dialeg'],
    ['MarcColumna', EspecimenMarcColumna, '.sdp-marc-columna'],
    ['Esquelet · vestit de bar', EspecimenEsqueletBar, '.sdp-marc-columna .sdp-graella-articles'],
    ['Esquelet · vestit de compra', EspecimenEsqueletCompra, '.sdp-marc-columna .sdp-graella-articles']
  ])('%s: el component real, la fitxa sencera, sense h1 ni style=', (nom, Especimen, classe) => {
    const arrel = pinta(Especimen);
    expect(arrel.querySelector(classe), nom).not.toBeNull();
    expect(arrel.querySelector('h1')).toBeNull();
    expect(arrel.querySelector('[style]')).toBeNull();
    expect(arrel.querySelector('.sdp-especimen__nom').textContent).toBe(nom);
    expect(arrel.querySelector('table caption').textContent).toBe('Contracte');
  });

  /* Correcció F3 (261006) · el contracte de MarcColumna diu on va l'avís, i la mostra l'ensenya. */
  it('MarcColumna: el contracte nomena la prop avis, i la mostra la porta com a primer fill del cos', () => {
    const arrel = pinta(EspecimenMarcColumna);
    const props = [...arrel.querySelectorAll('table tbody tr')].map((fila) => fila.firstElementChild.textContent);
    expect(props).toEqual(['capcalera', 'eines', 'avis', 'children', 'peu', 'etiqueta']);
    const marc = arrel.querySelector('.sdp-marc-columna');
    expect(marc.firstElementChild.className).toBe('sdp-marc-columna__cap');
    expect(marc.querySelector(':scope > .sdp-marc-columna__cos').firstElementChild.classList.contains('sdp-alerta')).toBe(true);
  });

  it('Articles: graella i llista amb les mateixes dades; tocar i mantindre premut ho diuen', () => {
    const arrel = pinta(EspecimenArticles);
    const enGraella = [...arrel.querySelectorAll('[data-article]')].map((b) => b.dataset.article);
    fireEvent.click(screen.getByRole('button', { name: /^Tallat/ }));
    expect(screen.getByRole('status').textContent).toBe('Toc: Tallat.');
    fireEvent.contextMenu(screen.getByRole('button', { name: /^Aigua/ }));
    expect(screen.getByRole('status').textContent).toBe('Acció secundària (detall): Aigua.');
    fireEvent.click(screen.getByRole('button', { name: 'Llista' }));
    expect(arrel.querySelector('.sdp-llista-articles')).not.toBeNull();
    expect([...arrel.querySelectorAll('[data-article]')].map((b) => b.dataset.article)).toEqual(enGraella);
  });

  it('Seccions: filtrar, plegar i ordenar', () => {
    const arrel = pinta(EspecimenSeccionsCategoria);
    expect(screen.getByRole('button', { name: 'Forn 1 article' }).getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(within(screen.getByRole('group', { name: 'Categoria' })).getByRole('button', { name: 'Llet i formatge' }));
    expect([...arrel.querySelectorAll('.sdp-seccio__cap')].map((h) => h.textContent)).toEqual(['Llet i formatge 1 article']);
    fireEvent.click(screen.getByRole('button', { name: 'Baixa Fruita i verdura' }));
    expect(within(screen.getByRole('list', { name: 'Ordre de les categories' })).getAllByRole('listitem')[0].textContent).toBe('Forn');
  });

  it('Col·lecció: les accions de les línies i del resum arriben', () => {
    pinta(EspecimenColleccio);
    const avis = () => screen.getAllByRole('status').find((p) => p.tagName === 'P').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Suma una unitat: Aigua' }));
    expect(avis()).toBe('Una unitat més: Aigua.');
    fireEvent.click(screen.getByRole('button', { name: /^1 unitat de Paper de cuina/ }));
    expect(within(screen.getByRole('list', { name: 'Llista de mostra' })).getAllByText('Comprat')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /^Comanda 3 línies/ }));
    expect(avis()).toBe('Obri la comanda (en l’app, el panell de la col·lecció).');
  });

  it('Detall: obrir, triar la variant i acceptar', () => {
    pinta(EspecimenDetallArticle);
    fireEvent.click(screen.getByRole('button', { name: 'Obri el detall de mostra' }));
    const dialeg = screen.getByRole('dialog', { name: 'Cafè amb llet' });
    fireEvent.click(within(dialeg).getByRole('radio', { name: /^Got/ }));
    fireEvent.click(within(dialeg).getByRole('button', { name: '3' }));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Afig' }));
    expect(screen.getByRole('status').textContent).toBe('Acceptat: 3 × got.');
  });

  it('Detall: la tria directa és un toc i tanca', () => {
    pinta(EspecimenDetallArticle);
    fireEvent.click(screen.getByRole('button', { name: 'Obri la tria directa de mostra' }));
    const dialeg = screen.getByRole('dialog', { name: 'Entrepà de truita' });
    expect(within(dialeg).queryByRole('button', { name: 'Afig' })).toBeNull();
    fireEvent.click(within(within(dialeg).getByRole('group', { name: 'Pa' })).getByRole('button', { name: 'Pa de llesca · 3,50 €' }));
    expect(screen.getByRole('status').textContent).toBe('Tria directa: 1 × llesca.');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('un sol esquelet, dos vestits', () => {
  /* ESQ-R7 · Disseny del Bar §A.6, flux 1: com a màxim dos tocs per producte.
     El toc afig la variant per defecte; un grup obligatori és un diàleg menut
     on un toc tria i tanca; el detall sencer, amb l'acció secundària. */
  it('bar: el toc afig la variant per defecte, el grup obligatori són dos tocs i el total ho diu', () => {
    const arrel = pinta(EspecimenEsqueletBar);
    const tauleta = screen.getByRole('group', { name: 'Bar: tauleta i escriptori' });
    fireEvent.click(within(tauleta).getByRole('button', { name: /^Tallat/ }));
    fireEvent.click(within(tauleta).getByRole('button', { name: /^Tallat/ }));
    fireEvent.click(within(tauleta).getByRole('button', { name: /^Cervesa de barril 2 variants/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    /* Dos tocs: la rajola i el pa. */
    fireEvent.click(within(tauleta).getByRole('button', { name: /^Entrepà de truita/ }));
    const menut = screen.getByRole('dialog', { name: 'Entrepà de truita' });
    expect(within(menut).queryByRole('button', { name: 'Afig' })).toBeNull();
    fireEvent.click(within(within(menut).getByRole('group', { name: 'Pa' })).getByRole('button', { name: /^Pa de llesca · 3,50.€$/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    /* L'acció secundària obri el detall sencer: una gerra. */
    fireEvent.contextMenu(within(tauleta).getByRole('button', { name: /^Cervesa de barril/ }));
    const dialeg = screen.getByRole('dialog', { name: 'Cervesa de barril' });
    fireEvent.click(within(dialeg).getByRole('radio', { name: /^Gerra/ }));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Afig' }));
    const comanda = within(tauleta).getByRole('list', { name: 'Comanda' });
    expect(within(comanda).getAllByRole('listitem').map((li) => pla(li.querySelector('.sdp-linies__principal').textContent)))
      .toEqual([
        '2 ×2 unitats de Tallat 2,60 €',
        '1 ×1 unitat de Cervesa de barril 1,60 € Canya',
        '1 ×1 unitat de Entrepà de truita 3,50 € Pa de llesca',
        '1 ×1 unitat de Cervesa de barril 2,80 € Gerra'
      ]);
    expect(pla(arrel.querySelector('.sdp-barra-resum--capcalera .sdp-barra-resum__total').textContent)).toBe('Total: 10,50 €');
    /* Els detalls s'han tancat: la URL de la mostra torna a ser la de la caixa. */
    expect(screen.getByText('/app/bar/caixa').tagName).toBe('CODE');
    fireEvent.click(within(tauleta).getByRole('button', { name: 'Cobra' }));
    expect(screen.getAllByRole('status').find((p) => p.tagName === 'P' && p.textContent.startsWith('Cobrament')).textContent)
      .toMatch(/^Cobrament de mostra: 10,50.€\. No s’ha cobrat res\.$/);
  });

  /* ESQ-R6 · Els tiquets oberts: el tiquet actiu va al camí i cada targeta
     hi porta; cada tiquet té la seua comanda. */
  it('bar: cada tiquet obert és un enllaç al seu camí i té la seua comanda', () => {
    pinta(EspecimenEsqueletBar);
    const tauleta = screen.getByRole('group', { name: 'Bar: tauleta i escriptori' });
    const tiquets = () => within(tauleta).getByRole('list', { name: 'Tiquets oberts' });
    expect(within(tiquets()).getByRole('link', { name: /^Barra/ }).getAttribute('aria-current')).toBe('true');
    const taula = within(tiquets()).getByRole('link', { name: /^Taula 3 4 línies/ });
    expect(taula.getAttribute('href')).toBe('/app/bar/caixa/taula-3');
    fireEvent.click(taula);
    expect(screen.getByText('/app/bar/caixa/taula-3').tagName).toBe('CODE');
    expect(within(tiquets()).getByRole('link', { name: /^Taula 3/ }).getAttribute('aria-current')).toBe('true');
    expect(within(tiquets()).getByRole('link', { name: /^Barra/ }).getAttribute('aria-current')).toBeNull();
    expect(within(within(tauleta).getByRole('list', { name: 'Comanda' })).getAllByRole('listitem')).toHaveLength(4);
    fireEvent.click(within(tauleta).getByRole('button', { name: /^Refresc de cola/ }));
    expect(within(tiquets()).getByRole('link', { name: /^Taula 3 5 línies/ })).toBeTruthy();
    fireEvent.click(within(tiquets()).getByRole('link', { name: /^Barra/ }));
    expect(screen.getByText('/app/bar/caixa/barra').tagName).toBe('CODE');
    expect(within(tauleta).getByText('La comanda és buida')).toBeTruthy();
    /* En mòbil, el panell de la comanda és el del tiquet actiu. */
    fireEvent.click(screen.getByRole('button', { name: 'Mòbil' }));
    fireEvent.click(screen.getByRole('button', { name: /^Tallat/ }));
    expect(within(screen.getByRole('group', { name: 'Bar: mòbil' })).getByRole('link', { name: /^Comanda 1 línia/ }).getAttribute('href'))
      .toBe('/app/bar/caixa/barra/colleccio');
  });

  it('bar en mòbil: el catàleg primer i la barra de la comanda porta a la comanda', () => {
    pinta(EspecimenEsqueletBar);
    fireEvent.click(screen.getByRole('button', { name: /^Tallat/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mòbil' }));
    const mobil = screen.getByRole('group', { name: 'Bar: mòbil' });
    const peu = within(mobil).getByRole('link', { name: /^Comanda 1 línia/ });
    expect(peu.getAttribute('href')).toBe('/app/bar/caixa/colleccio');
    fireEvent.click(peu);
    expect(within(mobil).getByRole('heading', { level: 3 }).textContent).toBe('Comanda 1 línia');
    fireEvent.click(within(mobil).getByRole('button', { name: 'Torna al catàleg' }));
    expect(within(mobil).getByRole('region', { name: 'Productes' })).toBeTruthy();
  });

  it('compra: la mateixa columna de catàleg, commutable; la llista en rajoles i en el mòbil va primer', () => {
    pinta(EspecimenEsqueletCompra);
    const tauleta = screen.getByRole('group', { name: 'Compra: tauleta i escriptori' });
    const cataleg = within(tauleta).getByRole('region', { name: 'Articles' });
    const tomaques = within(cataleg).getByRole('button', { name: 'Tomaques' });
    expect(tomaques.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(tomaques);
    expect(within(cataleg).getByRole('button', { name: 'Tomaques' }).getAttribute('aria-pressed')).toBe('true');
    const llista = within(tauleta).getByRole('region', { name: 'Llista' });
    expect(within(llista).getByRole('button', { name: 'Tomaques' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(llista.closest('.sdp-marc-columna')).getByRole('heading', { level: 3 }).textContent).toBe('Llista 3 pendents');
    /* ESQ-R9 · El comprat ho diu amb text, també en rajoles. */
    const paper = within(llista).getByRole('button', { name: /^Paper de cuina/ });
    expect(paper.getAttribute('aria-pressed')).toBe('false');
    expect(pla(paper.textContent)).toContain('Comprat');
    /* «Necessite…» crea un article propi i el posa a la llista. */
    const camp = within(tauleta).getByRole('combobox', { name: 'Necessite…' });
    fireEvent.change(camp, { target: { value: 'Safrà' } });
    fireEvent.submit(camp.closest('form'));
    expect(within(llista).getByRole('button', { name: 'Safrà' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mòbil' }));
    const mobil = screen.getByRole('group', { name: 'Compra: mòbil' });
    expect(within(mobil).getByRole('region', { name: 'Llista' })).toBeTruthy();
    fireEvent.click(within(mobil).getByRole('button', { name: 'Afig des del catàleg' }));
    expect(within(mobil).getByRole('region', { name: 'Articles' })).toBeTruthy();
    expect(within(mobil).getByRole('link', { name: /^Llista 4 pendents/ }).getAttribute('href')).toBe('/app/compra/llista');
  });

  /* ESQ-R6 · Les llistes: la llista activa va al camí i cada targeta hi porta. */
  it('compra: cada llista és un enllaç al seu camí i té els seus articles', () => {
    pinta(EspecimenEsqueletCompra);
    const tauleta = screen.getByRole('group', { name: 'Compra: tauleta i escriptori' });
    const llistes = within(tauleta).getByRole('list', { name: 'Les meues llistes' });
    expect(within(llistes).getByRole('link', { name: /^Casa/ }).getAttribute('aria-current')).toBe('true');
    const mercat = within(llistes).getByRole('link', { name: /^Mercat del dijous 3 pendents/ });
    expect(mercat.getAttribute('href')).toBe('/app/compra/llista/mercat');
    fireEvent.click(mercat);
    expect(screen.getByText('/app/compra/llista/mercat').tagName).toBe('CODE');
    const llista = within(tauleta).getByRole('region', { name: 'Llista' });
    expect(within(llista).getAllByRole('button').filter((b) => b.dataset.article).map((b) => b.dataset.article))
      .toEqual(['l-tomaques', 'l-creilles', 'l-formatge-fresc']);
    expect(within(within(tauleta).getByRole('region', { name: 'Articles' })).getByRole('button', { name: /^Tomaques/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('els dos vestits munten les mateixes columnes (mateixes classes d’estructura)', () => {
    const estructura = (Especimen) => {
      const arrel = pinta(Especimen);
      const forma = [...arrel.querySelectorAll('.sdp-especimen__papers > .sdp-especimen__mostra > .sdp-marc-columna')]
        .map((marc) => [...marc.children].map((fill) => fill.className).join('|'));
      cleanup();
      return forma;
    };
    expect(estructura(EspecimenEsqueletBar)).toEqual(estructura(EspecimenEsqueletCompra));
  });
});
