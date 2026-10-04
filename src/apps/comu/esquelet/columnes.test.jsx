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

/* Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · forma="targetes": les
   mateixes columnes amb UniversalCard dins de GraellaTargetes. Sense la prop, el de sempre. */
describe('forma="targetes" (UniversalCard)', () => {
  const targetaDe = (nom) => screen.getByRole('button', { name: nom }).closest('article.sp-card');

  test('ColumnaCataleg: seccions h3 i targetes h4, el quadrat amb la icona de la secció, l’estat en etiqueta i data-element', () => {
    const { container } = munta(<ColumnaCataleg forma="targetes" titol="Productes" categories={CATEGORIES} articles={ARTICLES} commutable
      textosEstat={{ 'en-colleccio': 'A la comanda' }} />);
    const cos = screen.getByRole('region', { name: 'Productes' });
    expect(within(cos).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Cafès 2 articles', 'Begudes 1 article']);
    expect(within(cos).getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['Tallat', 'Cafè amb llet', 'Aigua']);
    expect([...container.querySelectorAll('.sdp-seccio__cos > div')].map((d) => d.className)).toEqual(['sdp-card-grid', 'sdp-card-grid']);
    expect(container.querySelector('.sdp-graella-articles, .sdp-llista-articles, .sdp-rajola, ul.sdp-graella-articles')).toBeNull();
    /* El toc commuta: aria-pressed a l'element principal, i l'estat també en text. */
    const llet = screen.getByRole('button', { name: 'Cafè amb llet' });
    expect(llet.getAttribute('aria-pressed')).toBe('true');
    expect(llet.dataset.element).toBe('cafe-llet');
    expect(within(targetaDe('Cafè amb llet')).getByText('A la comanda').className).toBe('sp-card-label sdp-badge-tag');
    expect(screen.getByRole('button', { name: 'Tallat' }).getAttribute('aria-pressed')).toBe('false');
    /* La línia de davall (el valor) i el quadrat amb la icona de la seua secció. */
    const tallat = targetaDe('Tallat');
    expect(tallat.querySelector('.sp-card-text').textContent).toBe('1,30 €');
    expect(tallat.querySelector('.sp-card-calendar-badge').getAttribute('aria-label')).toBe('Cafès');
    expect(tallat.querySelector('.sp-card-calendar-badge svg.lucide-coffee')).not.toBeNull();
    /* El peu per defecte, sense Compartir. */
    expect([...tallat.querySelectorAll('footer button')].map((b) => b.getAttribute('aria-label'))).toEqual(['Traduir Tallat', 'Comentar Tallat', 'Connectar amb Tallat']);
  });

  test('ColumnaCataleg: el toc crida onTria; el botó dret, Maj+F10 o la pulsació llarga obrin el detall per la URL', () => {
    const onTria = vi.fn();
    munta(<ColumnaCataleg forma="targetes" titol="Productes" categories={CATEGORIES} articles={ARTICLES} onTria={onTria} detall={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tallat' }));
    expect(onTria).toHaveBeenCalledWith(ARTICLES[0], expect.objectContaining({ obriDetall: expect.any(Function) }));
    const aigua = screen.getByRole('button', { name: 'Aigua' });
    expect(aigua.getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
    fireEvent.contextMenu(aigua);
    expect(ubicacio()).toBe('/app/bar/caixa?article=aigua');
    expect(screen.getByRole('dialog', { name: 'Aigua' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Tallat' }), { key: 'F10', shiftKey: true });
    expect(ubicacio()).toBe('/app/bar/caixa?article=tallat');
  });

  test('ColumnaCataleg: els destacats porten la icona de la seua secció; la vista llista, la targeta plana en columna; un article desactivat no es pot tocar', () => {
    const destacats = [{ id: 'recents', nom: 'Recents', articles: [ARTICLES[2]] }];
    const articles = [...ARTICLES, { id: 'gel', nom: 'Gel', categoriaId: 'begudes', estat: 'desactivat' }];
    const { container } = munta(<ColumnaCataleg forma="targetes" titol="Productes" categories={CATEGORIES} articles={articles} destacats={destacats} />,
      { ruta: '/app/bar/caixa?vista=llista' });
    const [recent] = within(screen.getByRole('region', { name: /^Recents/ })).getAllByRole('button', { name: 'Aigua' });
    expect(recent.closest('article').querySelector('.sp-card-calendar-badge').getAttribute('aria-label')).toBe('Begudes');
    expect([...container.querySelectorAll('.sdp-seccio__cos > div')].every((d) => d.className === 'sdp-card-llista')).toBe(true);
    expect(container.querySelectorAll('article.sp-card--pla')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Gel' })).toBeNull();
    expect(within(screen.getByRole('heading', { level: 4, name: 'Gel' }).closest('article')).getByText('No disponible')).toBeTruthy();
  });

  test('ColumnaCataleg sense categories: una sola graella amb el nom de la columna i targetes h3', () => {
    munta(<ColumnaCataleg forma="targetes" titol="Productes" articles={ARTICLES} selector={null} />);
    const graella = screen.getByRole('group', { name: 'Productes' });
    expect(graella.className).toBe('sdp-card-grid');
    expect(within(graella).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Tallat', 'Cafè amb llet', 'Aigua']);
    /* Sense secció ni icona pròpia, cap quadrat inventat. */
    expect(graella.querySelector('.sp-card-calendar-badge')).toBeNull();
  });

  /* Ordre del Mestre, 261004 (regressió de la Nevera) · L'element principal de la targeta només
     porta el nom: el que la rajola deia al lector (l'especificació, l'estat i la insígnia) ho
     diu la seua descripció accessible, en l'ordre de la rajola. Sense res a dir, cap descripció. */
  const descripcioDe = (boto) => {
    const id = boto.getAttribute('aria-describedby');
    return id ? document.getElementById(id).textContent : null;
  };

  test('ColumnaCataleg: la descripció accessible diu l’especificació, l’estat i la insígnia', () => {
    const articles = [
      ...ARTICLES,
      { id: 'llet', nom: 'Llet', categoriaId: 'begudes', secundari: 'sense lactosa', insignia: '2', estat: 'en-colleccio' },
      { id: 'sal', nom: 'Sal', categoriaId: 'begudes' },
      { id: 'gel', nom: 'Gel', categoriaId: 'begudes', valor: '0,50 €', estat: 'desactivat' }
    ];
    munta(<ColumnaCataleg forma="targetes" titol="Productes" categories={CATEGORIES} articles={articles} commutable
      textosEstat={{ 'en-colleccio': 'A la comanda' }} />);
    expect(descripcioDe(screen.getByRole('button', { name: 'Tallat' }))).toBe('1,30 €');
    expect(descripcioDe(screen.getByRole('button', { name: 'Cafè amb llet' }))).toBe('1,50 €, A la comanda');
    expect(descripcioDe(screen.getByRole('button', { name: 'Llet' }))).toBe('sense lactosa, A la comanda, 2');
    /* El nom continua sent només el nom. */
    expect(screen.getByRole('button', { name: 'Llet' }).getAttribute('aria-label')).toBe('Llet');
    /* Res a dir: cap descripció ni cap span. */
    const sal = screen.getByRole('button', { name: 'Sal' });
    expect(sal.hasAttribute('aria-describedby')).toBe(false);
    expect(sal.closest('article').querySelector('.sdp-nomes-lector')).toBeNull();
    /* Desactivat: no hi ha element principal; l'estat continua en l'etiqueta. */
    const gel = screen.getByRole('heading', { level: 4, name: 'Gel' }).closest('article');
    expect(gel.querySelector('[aria-describedby], .sdp-nomes-lector')).toBeNull();
    /* El text és dins de l'element principal, que continua sent el segon fill de l'article. */
    const llet = screen.getByRole('button', { name: 'Llet' });
    expect(document.getElementById(llet.getAttribute('aria-describedby')).parentElement).toBe(llet);
    expect([...llet.closest('article').children].map((e) => e.className)).toEqual(['sp-card-link-overlay', 'sp-card-body has-calendar-badge has-aside', 'sp-card-footer']);
  });

  test('ColumnaColleccio: pendent diu l’estat; fet i anul·lat, el seu text de la línia de davall; la quantitat, la insígnia', () => {
    const linies = [
      { id: 'p', articleId: 'pomes', quantitat: 3, nom: 'Pomes', detall: '1 kg' },
      { id: 'f', articleId: 'llet', quantitat: 1, nom: 'Llet', estat: 'fet' },
      { id: 'x', articleId: 'pa', quantitat: 1, nom: 'Pa', estat: 'anullat' }
    ];
    munta(<ColumnaColleccio forma="targetes" titol="Llista" linies={linies} textosLinies={{ fet: 'Comprat' }} textos={{ enColleccio: 'Per comprar' }} onTria={() => {}} />);
    expect(descripcioDe(screen.getByRole('button', { name: 'Pomes' }))).toBe('1 kg, Per comprar, 3');
    expect(descripcioDe(screen.getByRole('button', { name: 'Llet' }))).toBe('Comprat');
    expect(descripcioDe(screen.getByRole('button', { name: 'Pa' }))).toBe('Anul·lat');
  });

  /* REGLA D'OR 1 (ordre del Mestre, 261004) · La boina taronja amb l'autor real: la que l'app vestix
     a cada article (`autoria`, la forma de PaginaApp). L'esquelet no n'inventa cap. */
  test('la boina: `article.autoria` (nom, poble, avatar i ruta) a dalt de la targeta; sense, la targeta de sempre', () => {
    const PROJECTE = { nom: 'Sóc de Poble', poble: 'La Torre de les Maçanes', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', href: '/projecte' };
    const articles = [{ ...ARTICLES[0], autoria: PROJECTE }, { ...ARTICLES[1], autoria: { nom: 'Tu' } }, ARTICLES[2]];
    munta(<ColumnaCataleg forma="targetes" titol="Productes" categories={CATEGORIES} articles={articles} />);
    const tallat = targetaDe('Tallat');
    expect([...tallat.children].map((e) => e.className)[0]).toBe('sp-card-header');
    const autor = within(tallat.querySelector('header.sp-card-header')).getByRole('link', { name: /^Sóc de Poble/ });
    expect(autor.getAttribute('href')).toBe('/projecte');
    expect(tallat.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
    /* L'avatar és la imatge privada de les apps: el filtre de mitjans i sense referent. */
    const avatar = tallat.querySelector('img.sp-card-avatar');
    expect(avatar.getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg');
    expect(avatar.getAttribute('referrerpolicy')).toBe('no-referrer');
    /* Sense ruta: el nom, sense enllaç. */
    const llet = targetaDe('Cafè amb llet').querySelector('header.sp-card-header');
    expect(llet.querySelector('span.sp-card-author-block .sp-card-author-name').textContent).toBe('Tu');
    expect(within(llet).queryByRole('link')).toBeNull();
    /* Sense autoria: cap boina inventada. */
    expect(targetaDe('Aigua').querySelector('header.sp-card-header')).toBeNull();
  });

  test('ColumnaColleccio: la boina de cada línia (`linia.autoria`)', () => {
    const linies = [{ id: 'p', articleId: 'pomes', quantitat: 1, nom: 'Pomes', autoria: { nom: 'Sóc de Poble', href: '/projecte' } }];
    munta(<ColumnaColleccio forma="targetes" titol="Llista" linies={linies} onTria={() => {}} />);
    expect(within(targetaDe('Pomes')).getByRole('link', { name: 'Sóc de Poble' }).getAttribute('href')).toBe('/projecte');
  });

  test('Llei del Píxel: sense la prop, el cos de sempre (rajoles i files), cap UniversalCard', () => {
    const { container, unmount } = munta(<ColumnaCataleg titol="Productes" categories={CATEGORIES} articles={ARTICLES} />);
    expect(container.querySelector('.sdp-graella-articles')).not.toBeNull();
    expect(container.querySelector('.sp-card')).toBeNull();
    unmount();
    const colleccio = munta(<ColumnaColleccio titol="Llista" linies={LINIES} forma="rajoles" />).container;
    expect(colleccio.querySelector('.sdp-graella-articles')).not.toBeNull();
    expect(colleccio.querySelector('.sp-card')).toBeNull();
  });

  test('ColumnaColleccio: pendent premuda amb l’etiqueta, fet i anul·lat amb el text a la línia de davall; la icona de la línia; h4 sota el resum', () => {
    const onTria = vi.fn();
    const onEdita = vi.fn();
    const linies = [
      { id: 'p', articleId: 'pomes', quantitat: 1, nom: 'Pomes', detall: '1 kg', icona: CupSoda },
      { id: 'f', articleId: 'llet', quantitat: 1, nom: 'Llet', estat: 'fet' },
      { id: 'x', articleId: 'pa', quantitat: 1, nom: 'Pa', estat: 'anullat' }
    ];
    const { unmount } = munta(<ColumnaColleccio forma="targetes" titol="Llista" linies={linies} resum={RESUM} textosLinies={{ fet: 'Comprat' }}
      textos={{ enColleccio: 'Per comprar' }} onTria={onTria} onEdita={onEdita} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Comanda 2 línies']);
    expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['Pomes', 'Llet', 'Pa']);
    const pomes = screen.getByRole('button', { name: 'Pomes' });
    expect(pomes.getAttribute('aria-pressed')).toBe('true');
    expect(within(targetaDe('Pomes')).getByText('Per comprar')).toBeTruthy();
    expect(targetaDe('Pomes').querySelector('.sp-card-text').textContent).toBe('1 kg');
    expect(targetaDe('Pomes').querySelector('.sp-card-calendar-badge svg.lucide-cup-soda')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Llet' }).getAttribute('aria-pressed')).toBe('false');
    expect(targetaDe('Llet').querySelector('.sp-card-text').textContent).toBe('Comprat');
    expect(targetaDe('Pa').querySelector('.sp-card-text').textContent).toBe('Anul·lat');
    fireEvent.click(pomes);
    expect(onTria).toHaveBeenCalledWith(linies[0]);
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Llet' }));
    expect(onEdita).toHaveBeenCalledWith(linies[1]);
    unmount();
    /* Sense resum, el nom de la targeta és un h3; buida, l'estat buit de sempre. */
    const sola = munta(<ColumnaColleccio forma="targetes" titol="Llista" linies={linies.slice(0, 1)} />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Pomes');
    sola.unmount();
    munta(<ColumnaColleccio forma="targetes" titol="Llista" linies={[]} />);
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
