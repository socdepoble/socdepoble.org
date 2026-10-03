/* Esquelet comú de catàleg i col·lecció · les tres columnes, fora de la
   closca: el context d'AppGridShell es dona a mà (mida) i la URL viu en un
   router de memòria. Les proves poden importar el context de la graella; el
   codi de producció de les apps, no (qualitat.test.js de la plataforma). */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Coffee, CupSoda } from 'lucide-react';
import { MemoryRouter, useLocation, useNavigate } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { ColumnaCataleg } from './ColumnaCataleg.jsx';
import { ColumnaColleccio } from './ColumnaColleccio.jsx';
import { ColumnaColleccions } from './ColumnaColleccions.jsx';

afterEach(cleanup);

const CATEGORIES = [
  { id: 'cafes', nom: 'Cafès', icona: Coffee, ordre: 0, visible: true },
  { id: 'begudes', nom: 'Begudes', icona: CupSoda, ordre: 1, visible: true }
];
const ARTICLES = [
  { id: 'tallat', nom: 'Tallat', categoriaId: 'cafes', valor: '1,30 €' },
  { id: 'cafe-llet', nom: 'Cafè amb llet', categoriaId: 'cafes', valor: '1,50 €', estat: 'en-colleccio' },
  { id: 'aigua', nom: 'Aigua', categoriaId: 'begudes', valor: '2 variants' }
];
const LINIES = [
  { id: 'l1', articleId: 'cafe-llet', quantitat: 2, nom: 'Cafè amb llet', valor: '3,00 €' },
  { id: 'l2', articleId: 'aigua', quantitat: 1, nom: 'Aigua', detall: 'Got gran', valor: '1,80 €' }
];
const RESUM = { etiqueta: 'Comanda', comptador: 2, textComptador: (n) => `${n} línies`, total: '4,80 €' };

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

/* El botó «arrere» del navegador, dins del router de memòria. */
function Arrere() {
  const navega = useNavigate();
  return <button type="button" onClick={() => navega(-1)}>Arrere del navegador</button>;
}
const arrere = () => fireEvent.click(screen.getByRole('button', { name: 'Arrere del navegador' }));

function munta(fill, { ruta = '/app/bar/caixa', mida = 'ample' } = {}) {
  const graella = { mida, panellObert: null, setPanellObert: vi.fn(), tancaPanells: vi.fn() };
  return render(
    <MemoryRouter rutaInicial={ruta}>
      <AppGridContext.Provider value={graella}>{fill}<Ubicacio /><Arrere /></AppGridContext.Provider>
    </MemoryRouter>
  );
}

describe('ColumnaCataleg', () => {
  test('capçalera, eines (categoria, vista, afegit) i la graella per seccions', () => {
    munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} afegit={{ etiqueta: 'Busca…', suggeriments: ARTICLES }} />);
    expect(screen.getByRole('group', { name: 'Categoria' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Vista del catàleg' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Busca…' })).toBeTruthy();
    const cos = screen.getByRole('region', { name: 'Productes' });
    expect(within(cos).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Cafès 2 articles', 'Begudes 1 article']);
    expect(within(cos).getAllByRole('button').filter((b) => b.dataset.article)).toHaveLength(3);
  });

  test('la categoria i la vista viuen a la URL (push) i es poden enllaçar', () => {
    munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} />, { ruta: '/app/bar/caixa?categoria=begudes&vista=llista' });
    const cos = screen.getByRole('region', { name: 'Productes' });
    expect(within(cos).getAllByRole('button').filter((b) => b.dataset.article).map((b) => b.dataset.article)).toEqual(['aigua']);
    expect(cos.querySelector('.sdp-llista-articles')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Totes' }));
    expect(ubicacio()).toBe('/app/bar/caixa?vista=llista');
    fireEvent.click(screen.getByRole('button', { name: 'Graella' }));
    expect(ubicacio()).toBe('/app/bar/caixa');
    expect(cos.querySelector('.sdp-graella-articles')).not.toBeNull();
  });

  /* ESQ-R5 · PillToggle avisa també quan es toca l'opció activa: l'esquelet
     no ho ha de convertir en una entrada d'historial idèntica. */
  test('tocar la pastilla que ja és activa no apila cap entrada: el primer arrere torna a la vista d’abans', () => {
    munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} />);
    fireEvent.click(screen.getByRole('button', { name: 'Begudes' }));
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=begudes');
    fireEvent.click(screen.getByRole('button', { name: 'Begudes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Graella' }));
    fireEvent.click(screen.getByRole('button', { name: 'Llista' }));
    fireEvent.click(screen.getByRole('button', { name: 'Llista' }));
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=begudes&vista=llista');
    arrere();
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=begudes');
    arrere();
    expect(ubicacio()).toBe('/app/bar/caixa');
  });

  /* ESQ-R8 · Sense categories no hi ha seccions: cap capçalera «Altres». */
  test('sense categories, el catàleg és una sola peça plana, sense cap secció inventada', () => {
    munta(<ColumnaCataleg titol="Productes" articles={ARTICLES} selector={null} />);
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(screen.queryByText(/^Altres/)).toBeNull();
    expect(screen.getByRole('list', { name: 'Productes' }).className).toBe('sdp-graella-articles');
    expect(screen.getAllByRole('button').filter((b) => b.dataset.article)).toHaveLength(3);
  });

  /* ESQ-R7 · Disseny del Bar §A.6, flux 1: tocar afig la variant per defecte;
     amb un grup obligatori s'obri un diàleg menut on un toc tria i tanca. */
  test('tria directa: dos tocs per producte (la rajola i l’opció), sense «Afig»', () => {
    const onAccepta = vi.fn();
    const onTria = vi.fn((article, { obriDetall }) => { if (article.id === 'aigua') obriDetall(); });
    munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} onTria={onTria}
      detall={{
        triaDirecta: (a) => a.id === 'aigua',
        etiquetaVariants: 'Mida',
        variantsDe: (a) => (a.id === 'aigua' ? [{ valor: 'got', etiqueta: 'Got', ajuda: '1,00 €' }, { valor: 'got-gran', etiqueta: 'Got gran', ajuda: '1,80 €' }] : []),
        onAccepta
      }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aigua 2 variants' }));
    const dialeg = screen.getByRole('dialog', { name: 'Aigua' });
    expect(within(dialeg).queryByRole('radio')).toBeNull();
    expect(within(dialeg).queryByRole('button', { name: 'Afig' })).toBeNull();
    expect(within(dialeg).getByRole('group', { name: 'Mida' })).toBeTruthy();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Got gran · 1,80 €' }));
    expect(onAccepta).toHaveBeenCalledWith({ variant: 'got-gran', quantitat: 1, nota: '' }, ARTICLES[2]);
    expect(ubicacio()).toBe('/app/bar/caixa');
    expect(screen.queryByRole('dialog')).toBeNull();
    /* Un altre producte (sense grup obligatori) obri el detall sencer amb l'acció secundària. */
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Tallat 1,30 €' }));
    expect(within(screen.getByRole('dialog', { name: 'Tallat' })).getByRole('button', { name: 'Afig' })).toBeTruthy();
  });

  test('tocar crida onTria; obriDetall obri el detall per la URL i acceptar el tanca', () => {
    const onAccepta = vi.fn();
    const onTria = vi.fn((article, { obriDetall }) => { if (article.id === 'aigua') obriDetall(); });
    munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} onTria={onTria}
      detall={{ variantsDe: (a) => (a.id === 'aigua' ? [{ valor: 'got', etiqueta: 'Got' }, { valor: 'got-gran', etiqueta: 'Got gran' }] : []), onAccepta }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tallat 1,30 €' }));
    expect(onTria).toHaveBeenCalledWith(ARTICLES[0], expect.objectContaining({ obriDetall: expect.any(Function) }));
    expect(ubicacio()).toBe('/app/bar/caixa');
    fireEvent.click(screen.getByRole('button', { name: 'Aigua 2 variants' }));
    expect(ubicacio()).toBe('/app/bar/caixa?article=aigua');
    const dialeg = screen.getByRole('dialog', { name: 'Aigua' });
    fireEvent.click(within(dialeg).getByRole('radio', { name: 'Got gran' }));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Afig' }));
    expect(onAccepta).toHaveBeenCalledWith({ variant: 'got-gran', quantitat: 1, nota: '' }, ARTICLES[2]);
    expect(ubicacio()).toBe('/app/bar/caixa');
  });

  test('el botó dret obri el detall; un enllaç amb ?article= l’obri directament; un id que no hi és no obri res', () => {
    const { unmount } = munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} detall={{}} />);
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Tallat 1,30 €' }));
    expect(ubicacio()).toBe('/app/bar/caixa?article=tallat');
    expect(screen.getByRole('dialog', { name: 'Tallat' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    expect(ubicacio()).toBe('/app/bar/caixa');
    unmount();
    munta(<ColumnaCataleg titol="Productes" articles={ARTICLES} detall={{}} />, { ruta: '/app/bar/caixa?article=fantasma' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('ample: sense peu; estret: la BarraResum porta a la col·lecció amb push', () => {
    const { unmount } = munta(<ColumnaCataleg titol="Productes" articles={ARTICLES} resum={RESUM} />);
    expect(screen.queryByRole('link', { name: /^Comanda/ })).toBeNull();
    unmount();
    munta(<ColumnaCataleg titol="Productes" articles={ARTICLES} resum={RESUM} />, { mida: 'estret', ruta: '/app/bar/caixa?categoria=cafes' });
    const peu = screen.getByRole('link', { name: 'Comanda 2 línies 4,80 €' });
    expect(peu.getAttribute('href')).toBe('/app/bar/caixa/colleccio?categoria=cafes');
    fireEvent.click(peu);
    expect(ubicacio()).toBe('/app/bar/caixa/colleccio?categoria=cafes');
  });

  test('els destacats («Recents») van davant, només amb totes les categories', () => {
    const destacats = [{ id: 'recents', nom: 'Recents', articles: [ARTICLES[2]] }];
    const { unmount } = munta(<ColumnaCataleg titol="Articles" categories={CATEGORIES} articles={ARTICLES} destacats={destacats} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Recents 1 article', 'Cafès 2 articles', 'Begudes 1 article']);
    unmount();
    munta(<ColumnaCataleg titol="Articles" categories={CATEGORIES} articles={ARTICLES} destacats={destacats} />, { ruta: '/app/compra/llista?categoria=cafes' });
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Cafès 2 articles']);
  });

  test('sense agrupar (la llista del TPV mòbil): una sola peça amb tots els articles', () => {
    munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} agrupa={false} selector="desplegable" vistaPerDefecte="llista" ambVistes={false} />);
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(screen.getByRole('list', { name: 'Productes' }).className).toBe('sdp-llista-articles');
    expect(screen.getByRole('combobox', { name: 'Categoria' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Vista del catàleg' })).toBeNull();
  });
});

describe('ColumnaColleccio', () => {
  test('el resum dalt (capçalera) i les línies amb les seues accions', () => {
    const onResta = vi.fn();
    const cobra = vi.fn();
    munta(<ColumnaColleccio titol="Comanda" linies={LINIES} resum={{ ...RESUM, accio: { text: 'Cobra', onClick: cobra } }} onResta={onResta} />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Comanda 2 línies');
    fireEvent.click(screen.getByRole('button', { name: 'Resta una unitat: Aigua' }));
    expect(onResta).toHaveBeenCalledWith(LINIES[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Cobra' }));
    expect(cobra).toHaveBeenCalledTimes(1);
    /* En ample no hi ha cap botó per a tornar: el catàleg es veu al costat. */
    expect(screen.queryByRole('button', { name: 'Torna al catàleg' })).toBeNull();
  });

  test('estret: torna al catàleg (o l’obri, si la col·lecció va primer)', () => {
    const { unmount } = munta(<ColumnaColleccio titol="Comanda" linies={LINIES} />, { mida: 'estret', ruta: '/app/bar/caixa/colleccio?vista=llista' });
    fireEvent.click(screen.getByRole('button', { name: 'Torna al catàleg' }));
    expect(ubicacio()).toBe('/app/bar/caixa?vista=llista');
    unmount();
    munta(<ColumnaColleccio titol="Llista" linies={LINIES} primer="colleccio" />, { mida: 'estret', ruta: '/app/compra/llista' });
    fireEvent.click(screen.getByRole('button', { name: 'Afig des del catàleg' }));
    expect(ubicacio()).toBe('/app/compra/llista/cataleg');
  });

  test('forma rajoles (La Compra a l’estil Bring): tocar marca la línia i la quantitat va en la insígnia', () => {
    const onTria = vi.fn();
    const { container } = munta(<ColumnaColleccio titol="Llista" linies={LINIES} forma="rajoles" onTria={onTria} />);
    const llet = screen.getByRole('button', { name: /^Cafè amb llet/ });
    expect(llet.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.sdp-graella-articles__insignia').textContent).toBe('2');
    fireEvent.click(llet);
    expect(onTria).toHaveBeenCalledWith(LINIES[0]);
  });

  /* ESQ-R9 · En rajoles, l'estat de la línia porta text (visible i al nom
     accessible), «fet» i «anul·lat» es distingixen i un estat desconegut és
     pendent, com diu estatLinia. */
  test('forma rajoles: comprat i anul·lat porten text i es distingixen; un estat desconegut és pendent', () => {
    const linies = [
      { id: 'p', articleId: 'pomes', quantitat: 1, nom: 'Pomes', detall: '1 kg' },
      { id: 'f', articleId: 'llet', quantitat: 2, nom: 'Llet', estat: 'fet' },
      { id: 'x', articleId: 'pa', quantitat: 1, nom: 'Pa', estat: 'anullat' },
      { id: 'd', articleId: 'sal', quantitat: 1, nom: 'Sal', estat: 'estrany' }
    ];
    munta(<ColumnaColleccio titol="Llista" linies={linies} forma="rajoles" textosLinies={{ fet: 'Comprat' }} />);
    const rajola = (nom) => screen.getByRole('button', { name: new RegExp(`^${nom}`) });
    expect(rajola('Pomes').getAttribute('aria-pressed')).toBe('true');
    expect(rajola('Pomes').textContent).not.toMatch(/Comprat|Anul·lat/);
    expect(rajola('Llet').getAttribute('aria-pressed')).toBe('false');
    expect(rajola('Llet').textContent).toContain('Comprat');
    expect(rajola('Pa').getAttribute('aria-pressed')).toBe('false');
    expect(rajola('Pa').textContent).toContain('Anul·lat');
    expect(rajola('Sal').getAttribute('aria-pressed')).toBe('true');
    expect(rajola('Sal').textContent).not.toMatch(/Comprat|Anul·lat/);
  });

  test('buida: l’estat buit que diu què cal fer', () => {
    munta(<ColumnaColleccio titol="Comanda" linies={[]} />);
    expect(screen.getByText('Encara no hi ha res')).toBeTruthy();
  });
});

describe('ColumnaColleccions', () => {
  test('les targetes són enllaços dins de l’app; el clic navega amb push', () => {
    munta(<ColumnaColleccions titol="Tiquets oberts" colleccions={[{ id: 'barra', nom: 'Barra', comptador: 2 }, { id: 't3', nom: 'Taula 3', comptador: 5 }]}
      actiu="barra" hrefDe={(c) => `/app/bar/caixa/${c.id}`} />);
    const taula = screen.getByRole('link', { name: /^Taula 3/ });
    expect(taula.getAttribute('href')).toBe('/app/bar/caixa/t3');
    expect(screen.getByRole('link', { name: /^Barra/ }).getAttribute('aria-current')).toBe('true');
    act(() => { fireEvent.click(taula); });
    expect(ubicacio()).toBe('/app/bar/caixa/t3');
  });
});
