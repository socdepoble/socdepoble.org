/* TPV Universal (ordre del Mestre, 261006: prompt 261006_1215 i skill
   sdp-clon-loiverse) · la peça presentacional: les rajoles i el seu nom, els
   filtres interns (categoria i cerca sense accents), el toc i el detall, el
   desactivat, les línies i onEdita, el resum i el total, la barra d'accions,
   els dos diàlegs (un toc tria i tanca) i la disposició estreta, amb
   l'amplada pròpia simulada i les pestanyes Productes / Tiquet. Sense xarxa,
   la foto o el logotip que no carreguen tornen a la marca o a les inicials.
   Els al·lèrgens de cada article, a la cantonada i al nom de la rajola.
   Cap avís de React a la consola. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Coffee } from 'lucide-react';
import { UniversalTPV } from './UniversalTPV.jsx';
import { DURADA_PULSACIO } from './pulsacioLlarga.js';
import { TEXTOS_ARTICLES } from './articles.js';

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  expect(crides).toEqual([]);
});

/* El temporitzador de la pulsació i el rellotge (Date.now, per als duplicats). */
const rellotgeFals = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });

const CATEGORIES = [
  { id: 'cafes', nom: 'Cafès', icona: Coffee, visible: true, ordre: 0 },
  { id: 'menjar', nom: 'Menjar', visible: true, ordre: 1 },
  { id: 'amagada', nom: 'Amagada', visible: false, ordre: 2 }
];
const ARTICLES = [
  { id: 'cafe', nom: 'Cafè sol', categoriaId: 'cafes', valor: '1,10 €' },
  { id: 'llet', nom: 'Cafè amb llet', categoriaId: 'cafes', valor: '2 variants', estat: 'en-colleccio', insignia: '2' },
  { id: 'creilles', nom: 'Creïlles fregides', categoriaId: 'menjar', valor: '3,00 €' },
  { id: 'croissant', nom: 'Croissant', categoriaId: 'menjar', secundari: 'Esgotat', valor: '1,40 €', estat: 'desactivat' },
  { id: 'secret', nom: 'Plat amagat', categoriaId: 'amagada', valor: '9,00 €' }
];
const LINIES = [
  { id: 'l1', articleId: 'llet', quantitat: 2, nom: 'Cafè amb llet', detall: 'Got', valor: '3,20 €' },
  { id: 'l2', articleId: 'cafe', quantitat: 1, nom: 'Cafè sol', valor: '1,10 €', estat: 'anullat' }
];

function propietats(canvis = {}) {
  return {
    etiqueta: 'TPV de prova',
    marca: { nom: 'Bar de prova' },
    tiquet: {
      titol: 'Tiquet', comptador: 2, linies: LINIES,
      total: { etiqueta: 'Total', valor: '3,20 €' }, resum: [{ etiqueta: 'IVA inclòs', valor: '0,29 €' }],
      buit: { titol: 'El tiquet és buit', text: 'Toca un producte.' }
    },
    accions: {
      secundaria: { text: 'Tiquets oberts', comptador: 3, onClick: vi.fn() },
      principal: { text: 'Cobra', valor: '3,20 €', onClick: vi.fn() }
    },
    cataleg: {
      categories: CATEGORIES, articles: ARTICLES, onTria: vi.fn(),
      textosEstat: { 'en-colleccio': 'A la comanda' }, buit: { titol: 'La carta és buida' }
    },
    ...canvis
  };
}

const pinta = (canvis) => {
  const p = propietats(canvis);
  return { ...render(<UniversalTPV {...p} />), p };
};
const graella = () => screen.getByRole('list', { name: /^Productes/ });
const rajoles = () => within(graella()).getAllByRole('button');
const noms = () => rajoles().map((boto) => boto.getAttribute('aria-label'));
const pastilles = () => screen.getByRole('group', { name: 'Categoria' });
const tpv = () => screen.getByRole('region', { name: 'TPV de prova' });

/* L'amplada pròpia de la peça: un ResizeObserver de mentida i la caixa que mesura. */
function ambAmplada(inicial) {
  let avisa = null;
  let ample = inicial;
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { avisa = callback; }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: ample }));
  return (nova) => {
    ample = nova;
    act(() => { avisa(); });
  };
}

describe('la disposició ampla', () => {
  test('una regió amb nom, el tiquet i el catàleg com a regions, i cap style ni h1/h2', () => {
    const { container } = pinta();
    expect(tpv().dataset.mida).toBe('ampla');
    expect(tpv().tagName).toBe('SECTION');
    expect(within(tpv()).getByRole('region', { name: 'Tiquet 2' })).toBeTruthy();
    expect(within(tpv()).getByRole('region', { name: 'Productes' })).toBeTruthy();
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.querySelector('h1, h2')).toBeNull();
  });

  test('la capçalera: les inicials de la marca sense logotip, i el logotip 1:1 quan n’hi ha', () => {
    const { container, rerender, p } = pinta();
    expect(screen.getByText('Bar de prova')).toBeTruthy();
    expect(container.querySelector('.sdp-tpv__marca').textContent).toBe('BD');
    rerender(<UniversalTPV {...p} marca={{ nom: 'Bar de prova', logotip: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' }} />);
    const logotip = container.querySelector('.sdp-tpv__marca > img.sdp-tpv__logotip');
    expect(logotip.getAttribute('alt')).toBe('');
    rerender(<UniversalTPV {...p} marca={null} />);
    expect(container.querySelector('.sdp-tpv__marca')).toBeNull();
    expect(within(tpv()).getByRole('region', { name: 'Tiquet 2' })).toBeTruthy();
  });

  test('l’avís va damunt del tiquet, dins de la seua regió; una llista, sencera i en ordre', () => {
    const { p, rerender, container } = pinta({ avis: 'Entra per a vendre.' });
    const tiquet = screen.getByRole('region', { name: 'Tiquet 2' });
    expect(within(tiquet).getByText('Entra per a vendre.').className).toBe('sdp-tpv__avis');
    rerender(<UniversalTPV {...p} avis={[<span key="a">Entra per a vendre.</span>, null, <span key="b">Per emportar.</span>]} />);
    expect([...container.querySelectorAll('.sdp-tpv__tiquet > .sdp-tpv__avis > span')].map((s) => s.textContent))
      .toEqual(['Entra per a vendre.', 'Per emportar.']);
    rerender(<UniversalTPV {...p} avis={[]} />);
    expect(container.querySelector('.sdp-tpv__avis')).toBeNull();
  });

  test('el nom del tiquet actiu va al títol, darrere de «Tiquet», i al nom de la regió', () => {
    const { container } = pinta({ tiquet: { ...propietats().tiquet, nom: 'Taula 3' } });
    expect(screen.getByRole('region', { name: 'Tiquet Taula 3 2' })).toBeTruthy();
    expect(container.querySelector('.sdp-tpv__titol > .sdp-tpv__nom-tiquet').textContent).toBe('Taula 3');
  });

  test('un missatge d’estat, sempre al DOM, anuncia les unitats quan canvien (WCAG 4.1.3)', () => {
    const { p, rerender } = pinta();
    const estat = screen.getByRole('status');
    expect(estat.className).toBe('sdp-nomes-lector');
    expect(estat.textContent).toBe('Tiquet: 2 unitats');
    rerender(<UniversalTPV {...p} tiquet={{ ...p.tiquet, nom: 'Barra', comptador: 1 }} />);
    expect(screen.getByRole('status')).toBe(estat);
    expect(estat.textContent).toBe('Tiquet Barra: 1 unitat');
    rerender(<UniversalTPV {...p} tiquet={{ ...p.tiquet, comptador: undefined }} />);
    expect(estat.textContent).toBe('');
  });
});

describe('les rajoles', () => {
  test('botons quadrats amb el nom «Nom, valor» i l’estat en text; la categoria amagada no es pinta', () => {
    pinta();
    expect(noms()).toEqual([
      'Cafè sol, 1,10 €',
      'Cafè amb llet, 2 variants, A la comanda',
      'Creïlles fregides, 3,00 €',
      'Croissant, Esgotat · 1,40 €, No disponible'
    ]);
    expect(within(graella()).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /^Plat amagat/ })).toBeNull();
  });

  test('a la comanda: la vora i la marca de la cantonada, i la insígnia a la descripció', () => {
    pinta();
    const llet = screen.getByRole('button', { name: /^Cafè amb llet/ });
    const element = llet.closest('li');
    expect(element.className).toBe('sdp-tpv__element sdp-tpv__element--en-colleccio');
    expect(element.querySelector('.sdp-tpv__marca-colleccio')).not.toBeNull();
    expect(document.getElementById(llet.getAttribute('aria-describedby')).textContent).toBe('2');
    expect(screen.getByRole('button', { name: /^Cafè sol/ }).closest('li').querySelector('.sdp-tpv__marca-colleccio')).toBeNull();
  });

  test('amb insigniaLector, es veu el número i el lector en diu de què és', () => {
    pinta({ cataleg: { ...propietats().cataleg, articles: ARTICLES.map((a) => (a.id === 'llet' ? { ...a, insigniaLector: '2 unitats a la comanda' } : a)) } });
    const llet = screen.getByRole('button', { name: /^Cafè amb llet/ });
    const insignia = document.getElementById(llet.getAttribute('aria-describedby'));
    expect(insignia.className).toBe('sdp-tpv__insignia');
    expect(insignia.querySelector('[aria-hidden="true"]').textContent).toBe('2');
    expect(insignia.querySelector('.sdp-nomes-lector').textContent).toBe('2 unitats a la comanda');
  });

  test('sense foto, la marca (icona i inicials) i la banda; amb foto, la foto ompli el quadrat', () => {
    const { container } = pinta({
      cataleg: { ...propietats().cataleg, articles: [...ARTICLES, { id: 'foto', nom: 'Amb foto', categoriaId: 'cafes', imatge: '/assets/notes/bloc_notes_vintage.jpg' }] }
    });
    const cafe = container.querySelector('[data-article="cafe"]');
    expect(cafe.className).toBe('sdp-tpv__rajola');
    expect(cafe.querySelector('.sdp-tpv__media .sdp-marca-article__inicials').textContent).toBe('CS');
    expect(cafe.querySelector('.sdp-tpv__media svg')).not.toBeNull();
    expect(cafe.querySelector('.sdp-tpv__banda .sdp-tpv__nom').textContent).toBe('Cafè sol');
    expect(cafe.querySelector('.sdp-tpv__banda .sdp-tpv__valor').textContent).toBe('1,10 €');
    const foto = container.querySelector('[data-article="foto"]');
    expect(foto.className).toBe('sdp-tpv__rajola sdp-tpv__rajola--imatge');
    expect(foto.querySelector('.sdp-tpv__media > img').getAttribute('alt')).toBe('');
  });

  test('el toc crida onTria amb l’article', () => {
    const { p } = pinta();
    fireEvent.click(screen.getByRole('button', { name: /^Creïlles/ }));
    expect(p.cataleg.onTria).toHaveBeenCalledTimes(1);
    expect(p.cataleg.onTria).toHaveBeenCalledWith(ARTICLES[2]);
  });

  test('desactivat: l’article esgotat i, amb cataleg.desactivat, totes; cap toc arriba', () => {
    const { p, rerender } = pinta();
    const croissant = screen.getByRole('button', { name: /^Croissant/ });
    expect(croissant.disabled).toBe(true);
    fireEvent.click(croissant);
    expect(p.cataleg.onTria).not.toHaveBeenCalled();
    rerender(<UniversalTPV {...p} cataleg={{ ...p.cataleg, desactivat: true }} />);
    expect(rajoles().every((boto) => boto.disabled)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^Cafè sol/ }));
    expect(p.cataleg.onTria).not.toHaveBeenCalled();
  });

  test('sense cap control actiu, la graella i les línies reben el focus per a fer scroll; amb controls, no', () => {
    const { p, rerender } = pinta();
    const linies = () => screen.getByRole('list', { name: 'Línies' });
    /* Hi ha rajoles actives; les línies, sense onEdita, no són botons. */
    expect(graella().hasAttribute('tabindex')).toBe(false);
    expect(linies().tabIndex).toBe(0);
    rerender(<UniversalTPV {...p} cataleg={{ ...p.cataleg, desactivat: true }} tiquet={{ ...p.tiquet, onEdita: vi.fn() }} />);
    expect(graella().tabIndex).toBe(0);
    expect(linies().hasAttribute('tabindex')).toBe(false);
    /* Tots els articles esgotats: tampoc no hi ha res enfocable. */
    rerender(<UniversalTPV {...p} cataleg={{ ...p.cataleg, articles: ARTICLES.map((a) => ({ ...a, estat: 'desactivat' })) }} />);
    expect(graella().tabIndex).toBe(0);
  });
});

/* Ordre del Mestre, 261006 («vital per a la Carta Digital i el TPV») · els
   al·lèrgens de la rajola: IconesAlergens a la cantonada, aria-hidden, i el
   nom del botó els diu tots. Sense al·lèrgens, la rajola de sempre. */
describe('els al·lèrgens de la rajola', () => {
  const ambAlergens = (perId) => pinta({
    cataleg: { ...propietats().cataleg, articles: ARTICLES.map((a) => (perId[a.id] ? { ...a, alergens: perId[a.id] } : a)) }
  });
  const element = (id) => document.querySelector(`[data-article="${id}"]`).closest('li');
  const fills = (li) => [...li.children].map((fill) => fill.className);

  test('sense al·lèrgens, la rajola de sempre: el botó i res més (o la marca i la insígnia)', () => {
    pinta();
    expect(document.querySelector('.sdp-tpv__alergens')).toBeNull();
    expect(fills(element('cafe'))).toEqual(['sdp-tpv__rajola']);
    expect(fills(element('llet'))).toEqual(['sdp-tpv__rajola', 'sdp-tpv__marca-colleccio', 'sdp-tpv__insignia']);
    expect(element('llet').querySelector('.sdp-tpv__marca-colleccio').outerHTML).toMatch(/^<span class="sdp-tpv__marca-colleccio" aria-hidden="true"><svg /);
  });

  test('amb al·lèrgens: la cantonada aria-hidden, les icones i «, conté …» al nom, en l’ordre de l’annex II', () => {
    ambAlergens({ cafe: ['llet', 'gluten'] });
    const cafe = screen.getByRole('button', { name: 'Cafè sol, 1,10 €, conté gluten, llet' });
    const li = cafe.closest('li');
    expect(fills(li)).toEqual(['sdp-tpv__rajola', 'sdp-tpv__alergens']);
    const cantonada = li.querySelector('.sdp-tpv__alergens');
    expect(cantonada.getAttribute('aria-hidden')).toBe('true');
    expect(cantonada.firstElementChild.className).toBe('sdp-alergens');
    expect([...cantonada.querySelectorAll('img')].map((img) => [img.dataset.alergen, img.getAttribute('alt')]))
      .toEqual([['gluten', ''], ['llet', '']]);
    /* Les icones no són al botó: el toc i el nom no canvien de lloc. */
    expect(cafe.querySelector('.sdp-alergens')).toBeNull();
    /* aria-hidden: el lector no les llig dues vegades. */
    expect(within(li).queryByRole('img')).toBeNull();
  });

  test('com a molt 4 peces: fins a 4 icones o, amb més, 3 i «+N»; el nom els diu tots', () => {
    ambAlergens({ creilles: ['gluten', 'crustacis', 'ous', 'peix', 'cacauets', 'soja'], cafe: ['gluten', 'crustacis', 'ous', 'peix'] });
    const boto = screen.getByRole('button', { name: /^Creïlles fregides, 3,00 €, conté / });
    expect(boto.getAttribute('aria-label')).toBe('Creïlles fregides, 3,00 €, conté gluten, crustacis, ous, peix, cacauets, soja');
    const cantonada = boto.closest('li').querySelector('.sdp-tpv__alergens');
    expect(cantonada.querySelectorAll('img')).toHaveLength(3);
    expect(cantonada.querySelector('.sdp-alergens__resta').textContent).toBe('+3');
    const quatre = element('cafe').querySelector('.sdp-tpv__alergens');
    expect(quatre.querySelectorAll('img')).toHaveLength(4);
    expect(quatre.querySelector('.sdp-alergens__resta')).toBeNull();
  });

  test('a la comanda i amb insígnia: la marca i la insígnia de sempre, i la cantonada darrere al DOM', () => {
    ambAlergens({ llet: ['llet'] });
    const boto = screen.getByRole('button', { name: 'Cafè amb llet, 2 variants, A la comanda, conté llet' });
    const li = boto.closest('li');
    expect(fills(li)).toEqual(['sdp-tpv__rajola', 'sdp-tpv__marca-colleccio', 'sdp-tpv__insignia', 'sdp-tpv__alergens']);
    expect(li.className).toBe('sdp-tpv__element sdp-tpv__element--en-colleccio');
    expect(fills(li.querySelector('.sdp-tpv__alergens'))).toEqual(['sdp-alergens']);
    /* La insígnia continua descrivint el botó. */
    expect(document.getElementById(boto.getAttribute('aria-describedby')).textContent).toBe('2');
  });

  test('esgotat: el nom diu l’estat i els al·lèrgens; els ids desconeguts no compten', () => {
    ambAlergens({ croissant: ['gluten', 'ous', 'llet'], cafe: ['xocolata'] });
    expect(screen.getByRole('button', { name: 'Croissant, Esgotat · 1,40 €, No disponible, conté gluten, ous, llet' }).disabled).toBe(true);
    const cafe = screen.getByRole('button', { name: 'Cafè sol, 1,10 €' });
    expect(cafe.closest('li').querySelector('.sdp-tpv__alergens')).toBeNull();
  });
});

/* Ordre del Mestre, 261006 (capacitat offline prioritària) · la peça no depén
   de la xarxa per a pintar: la foto o el logotip que no carreguen tornen a la
   marca o a les inicials. jsdom no carrega imatges: l'error es dispara a mà. */
describe('sense xarxa: les imatges que no carreguen', () => {
  const AMB_FOTO = { id: 'foto', nom: 'Amb foto', categoriaId: 'cafes', imatge: '/assets/notes/bloc_notes_vintage.jpg' };
  const ambFoto = (...mes) => pinta({ cataleg: { ...propietats().cataleg, articles: [...ARTICLES, AMB_FOTO, ...mes] } });

  test('la foto de la rajola: lazy, decoding async, alt buit i sense referent', () => {
    const { container } = ambFoto();
    const img = container.querySelector('[data-article="foto"] > .sdp-tpv__media > img');
    expect(img.className).toBe('sdp-marca-article__imatge');
    expect(['loading', 'decoding', 'alt', 'referrerpolicy'].map((atribut) => img.getAttribute(atribut))).toEqual(['lazy', 'async', '', 'no-referrer']);
  });

  test('la foto que falla pinta la marca: el mateix botó, el focus on era i la rajola sense classe de foto', () => {
    const { container } = ambFoto({ ...AMB_FOTO, id: 'veina', nom: 'Foto veïna', imatge: '/assets/notes/foto_veina.jpg' });
    const foto = container.querySelector('[data-article="foto"]');
    foto.focus();
    fireEvent.error(foto.querySelector('img'));
    expect(container.querySelector('[data-article="foto"]')).toBe(foto);
    expect(document.activeElement).toBe(foto);
    expect(foto.className).toBe('sdp-tpv__rajola');
    expect(foto.querySelector('img')).toBeNull();
    expect(foto.querySelector('.sdp-tpv__media .sdp-marca-article__inicials').textContent).toBe('AF');
    expect(foto.querySelector('.sdp-tpv__media svg')).not.toBeNull();
    /* El nom i la banda no canvien: només el quadrat de dalt. */
    expect(foto.getAttribute('aria-label')).toBe('Amb foto');
    expect(foto.querySelector('.sdp-tpv__banda .sdp-tpv__nom').textContent).toBe('Amb foto');
    /* L'estat és de cada element: la rajola veïna conserva la seua foto. */
    const veina = container.querySelector('[data-article="veina"]');
    expect(veina.className).toBe('sdp-tpv__rajola sdp-tpv__rajola--imatge');
    expect(veina.querySelector('.sdp-tpv__media > img').getAttribute('src')).toBe('/assets/notes/foto_veina.jpg');
  });

  test('la font fallida es recorda mentre l’element viu; una font nova es torna a provar', () => {
    const { container, p, rerender } = ambFoto();
    const foto = container.querySelector('[data-article="foto"]');
    fireEvent.error(foto.querySelector('img'));
    rerender(<UniversalTPV {...p} cataleg={{ ...p.cataleg, articles: [...ARTICLES, { ...AMB_FOTO }] }} />);
    expect(foto.querySelector('img')).toBeNull();
    rerender(<UniversalTPV {...p} cataleg={{ ...p.cataleg, articles: [...ARTICLES, { ...AMB_FOTO, imatge: '/assets/notes/una_altra_foto.jpg' }] }} />);
    expect(foto.className).toBe('sdp-tpv__rajola sdp-tpv__rajola--imatge');
    expect(foto.querySelector('.sdp-tpv__media > img').getAttribute('src')).toBe('/assets/notes/una_altra_foto.jpg');
  });

  test('el logotip que falla pinta les inicials; un logotip nou es torna a provar', () => {
    const { container, p, rerender } = pinta({ marca: { nom: 'Bar de prova', logotip: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' } });
    const logotip = container.querySelector('.sdp-tpv__marca > img.sdp-tpv__logotip');
    expect(['loading', 'decoding', 'alt', 'referrerpolicy'].map((atribut) => logotip.getAttribute(atribut))).toEqual(['lazy', 'async', '', 'no-referrer']);
    fireEvent.error(logotip);
    expect(container.querySelector('.sdp-tpv__marca img')).toBeNull();
    expect(container.querySelector('.sdp-tpv__marca').textContent).toBe('BD');
    expect(screen.getByText('Bar de prova')).toBeTruthy();
    expect(within(tpv()).getByRole('region', { name: 'Tiquet 2' })).toBeTruthy();
    rerender(<UniversalTPV {...p} marca={{ nom: 'Bar de prova', logotip: '/assets/system/ui/un_altre_logotip.svg' }} />);
    expect(container.querySelector('.sdp-tpv__marca > img.sdp-tpv__logotip').getAttribute('src')).toBe('/assets/system/ui/un_altre_logotip.svg');
  });
});

describe('el detall (onDetall)', () => {
  const ambDetall = () => {
    const onDetall = vi.fn();
    const muntat = pinta({ cataleg: { ...propietats().cataleg, onDetall } });
    return { ...muntat, onDetall, cafe: screen.getByRole('button', { name: /^Cafè sol/ }) };
  };

  test('anuncia la drecera i la pista; sense onDetall, cap', () => {
    const { cafe, unmount } = ambDetall();
    expect(cafe.getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
    expect(document.getElementById(cafe.getAttribute('aria-describedby')).textContent).toBe(TEXTOS_ARTICLES.pista);
    unmount();
    pinta();
    const sense = screen.getByRole('button', { name: /^Cafè sol/ });
    expect(sense.hasAttribute('aria-keyshortcuts')).toBe(false);
    expect(sense.hasAttribute('aria-describedby')).toBe(false);
  });

  test('el botó dret obri el detall', () => {
    const { onDetall, cafe } = ambDetall();
    fireEvent.contextMenu(cafe);
    expect(onDetall).toHaveBeenCalledTimes(1);
    expect(onDetall.mock.calls[0][0]).toBe(ARTICLES[0]);
  });

  test('Maj+F10 obri el detall', () => {
    const { onDetall, cafe } = ambDetall();
    fireEvent.keyDown(cafe, { key: 'F10', shiftKey: true });
    expect(onDetall.mock.calls[0][0]).toBe(ARTICLES[0]);
  });

  test('la pulsació llarga obri el detall i el clic de després no tria', () => {
    rellotgeFals();
    const { onDetall, cafe, p } = ambDetall();
    fireEvent.pointerDown(cafe, { button: 0, clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    expect(onDetall.mock.calls[0][0]).toBe(ARTICLES[0]);
    fireEvent.pointerUp(cafe);
    fireEvent.click(cafe);
    expect(p.cataleg.onTria).not.toHaveBeenCalled();
  });
});

describe('els filtres del catàleg (estat de la peça)', () => {
  test('les pastilles: «Totes» primer i activa; una categoria filtra i dona nom a la graella', () => {
    pinta();
    expect(within(pastilles()).getAllByRole('button').map((boto) => boto.textContent)).toEqual(['Totes', 'Cafès', 'Menjar']);
    expect(within(pastilles()).getByRole('button', { name: 'Totes' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(pastilles()).getByRole('button', { name: 'Menjar' }));
    expect(within(pastilles()).getByRole('button', { name: 'Menjar' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('list', { name: 'Productes: Menjar' })).toBeTruthy();
    expect(noms()).toEqual(['Creïlles fregides, 3,00 €', 'Croissant, Esgotat · 1,40 €, No disponible']);
    fireEvent.click(within(pastilles()).getByRole('button', { name: 'Totes' }));
    expect(rajoles()).toHaveLength(4);
  });

  test('la cerca, sense accents ni majúscules, dins de la categoria triada', () => {
    pinta();
    /* La fita de cerca porta nom: dos TPV a la mateixa pàgina no es confonen. */
    expect(screen.getByRole('search', { name: 'Busca un producte' }).className).toBe('sdp-tpv__cerca');
    const cerca = screen.getByRole('searchbox', { name: 'Busca un producte' });
    expect(cerca.getAttribute('placeholder')).toBe('Busca un producte');
    fireEvent.change(cerca, { target: { value: 'CREILLES' } });
    expect(noms()).toEqual(['Creïlles fregides, 3,00 €']);
    fireEvent.change(cerca, { target: { value: 'cafe' } });
    expect(noms()).toEqual(['Cafè sol, 1,10 €', 'Cafè amb llet, 2 variants, A la comanda']);
    fireEvent.click(within(pastilles()).getByRole('button', { name: 'Menjar' }));
    expect(screen.queryByRole('list', { name: /^Productes/ })).toBeNull();
    expect(screen.getByText('Cap resultat per a «cafe».')).toBeTruthy();
  });

  test('sense cap article, el buit del catàleg', () => {
    pinta({ cataleg: { ...propietats().cataleg, articles: [] } });
    expect(screen.queryByRole('list', { name: /^Productes/ })).toBeNull();
    expect(screen.getByText('La carta és buida')).toBeTruthy();
  });

  test('una categoria triada sense cap article ho diu: no és la carta buida', () => {
    const postres = { id: 'postres', nom: 'Postres', visible: true, ordre: 3 };
    const { p, rerender } = pinta({ cataleg: { ...propietats().cataleg, categories: [...CATEGORIES, postres] } });
    fireEvent.click(within(pastilles()).getByRole('button', { name: 'Postres' }));
    expect(screen.queryByRole('list', { name: /^Productes/ })).toBeNull();
    expect(screen.getByText('Cap producte a «Postres».')).toBeTruthy();
    expect(screen.getByText('Tria una altra categoria.')).toBeTruthy();
    expect(screen.queryByText('La carta és buida')).toBeNull();
    /* L'app en pot donar el text, i sense cap article és el buit del catàleg. */
    rerender(<UniversalTPV {...p} cataleg={{ ...p.cataleg, textCategoriaBuida: (nom) => `Res per emportar a «${nom}».` }} />);
    expect(screen.getByText('Res per emportar a «Postres».')).toBeTruthy();
    rerender(<UniversalTPV {...p} cataleg={{ ...p.cataleg, articles: [] }} />);
    expect(screen.getByText('La carta és buida')).toBeTruthy();
  });
});

describe('el tiquet', () => {
  test('les línies: nom, quantitat, valor i detall; l’anul·lada es ratlla i ho diu', () => {
    pinta();
    const linies = screen.getByRole('list', { name: 'Línies' });
    expect(linies.tagName).toBe('OL');
    const [primera, segona] = within(linies).getAllByRole('listitem');
    expect(primera.querySelector('.sdp-tpv__linia-nom').textContent).toBe('Cafè amb llet');
    expect(primera.querySelector('.sdp-tpv__linia-quantitat').textContent).toBe('× 22 unitats');
    expect(primera.querySelector('.sdp-tpv__linia-valor').textContent).toBe('3,20 €');
    expect(primera.querySelector('.sdp-tpv__linia-detall').textContent).toBe('Got');
    expect(segona.className).toBe('sdp-tpv__element-linia sdp-tpv__element-linia--anullat');
    expect(segona.querySelector('.sdp-tpv__linia-estat').textContent).toBe('Anul·lat');
    /* Sense onEdita, cap línia és un botó. */
    expect(within(linies).queryAllByRole('button')).toEqual([]);
  });

  test('amb onEdita, tocar una línia l’edita', () => {
    const onEdita = vi.fn();
    pinta({ tiquet: { ...propietats().tiquet, onEdita } });
    const linies = screen.getByRole('list', { name: 'Línies' });
    const boto = within(linies).getByRole('button', { name: /^Cafè amb llet 2 unitats 3,20 € Got$/ });
    expect(boto.className).toBe('sdp-tpv__linia');
    fireEvent.click(boto);
    expect(onEdita).toHaveBeenCalledWith(LINIES[0]);
  });

  test('el resum i el total, en text que es llig', () => {
    const { container } = pinta();
    const files = [...container.querySelectorAll('dl.sdp-tpv__resum > div')].map((fila) => [
      fila.querySelector('dt').textContent, fila.querySelector('dd').textContent
    ]);
    expect(files).toEqual([['IVA inclòs', '0,29 €'], ['Total', '3,20 €']]);
    expect(container.querySelector('.sdp-tpv__fila-resum--total dd').textContent).toBe('3,20 €');
  });

  test('sense línies, el buit del tiquet; sense total ni resum, cap llista de definicions', () => {
    const { container } = pinta({ tiquet: { titol: 'Llista', comptador: 0, linies: [], buit: { titol: 'La llista és buida', text: 'Toca un article.' } } });
    expect(screen.getByRole('region', { name: 'Llista 0' })).toBeTruthy();
    expect(screen.getByText('La llista és buida')).toBeTruthy();
    expect(screen.getByText('Toca un article.')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Línies' })).toBeNull();
    expect(container.querySelector('dl')).toBeNull();
  });
});

describe('la barra d’accions', () => {
  test('secundària i principal, amb el comptador i el valor al nom', () => {
    const { p, container } = pinta();
    const barra = container.querySelector('.sdp-tpv__tiquet > .sdp-tpv__accions');
    const [secundaria, principal] = within(barra).getAllByRole('button');
    expect(secundaria).toBe(within(barra).getByRole('button', { name: 'Tiquets oberts 3' }));
    expect(principal).toBe(within(barra).getByRole('button', { name: 'Cobra 3,20 €' }));
    fireEvent.click(principal);
    fireEvent.click(secundaria);
    expect(p.accions.principal.onClick).toHaveBeenCalledTimes(1);
    expect(p.accions.secundaria.onClick).toHaveBeenCalledTimes(1);
  });

  test('desactivables; sense secundària, la principal sola', () => {
    const { p, rerender, container } = pinta();
    rerender(<UniversalTPV {...p} accions={{
      secundaria: { ...p.accions.secundaria, desactivada: true }, principal: { ...p.accions.principal, desactivada: true }
    }} />);
    const barra = container.querySelector('.sdp-tpv__accions');
    expect(within(barra).getAllByRole('button').map((boto) => boto.disabled)).toEqual([true, true]);
    fireEvent.click(within(barra).getByRole('button', { name: 'Cobra 3,20 €' }));
    expect(p.accions.principal.onClick).not.toHaveBeenCalled();
    rerender(<UniversalTPV {...p} accions={{ principal: { text: 'Afig a la llista', onClick: vi.fn() } }} />);
    expect(within(container.querySelector('.sdp-tpv__accions')).getAllByRole('button').map((boto) => boto.textContent)).toEqual(['Afig a la llista']);
  });
});

describe('els diàlegs', () => {
  const ELEMENTS = [
    { id: 'barra', nom: 'Barra', detall: '2 línies', valor: '3,20 €', actiu: true },
    { id: 'taula-3', nom: 'Taula 3', detall: '1 línia', valor: '1,50 €' }
  ];

  test('tiquets oberts: botons grans, l’actiu amb aria-current; un toc tria i tanca; «nou» al peu', () => {
    const onTria = vi.fn();
    const onTanca = vi.fn();
    const nou = vi.fn();
    pinta({ oberts: { obert: true, onTanca, titol: 'Tiquets oberts', elements: ELEMENTS, onTria, nou: { text: 'Tiquet nou', onClick: nou } } });
    const dialeg = screen.getByRole('dialog', { name: 'Tiquets oberts' });
    const opcions = within(within(dialeg).getByRole('list', { name: 'Tiquets oberts' })).getAllByRole('button');
    expect(opcions.map((boto) => boto.getAttribute('aria-current'))).toEqual(['true', null]);
    expect(opcions.map((boto) => boto.className)).toEqual(['sdp-tpv__opcio', 'sdp-tpv__opcio']);
    fireEvent.click(within(dialeg).getByRole('button', { name: /^Taula 3/ }));
    expect(onTria).toHaveBeenCalledWith(ELEMENTS[1]);
    expect(onTanca).toHaveBeenCalledWith('tria');
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Tiquet nou' }));
    expect(nou).toHaveBeenCalledTimes(1);
  });

  test('tria: el diàleg menut; un toc crida onTria i tanca; tancat, no es veu', () => {
    const onTria = vi.fn();
    const onTanca = vi.fn();
    const tria = { obert: true, onTanca, titol: 'Cafè amb llet', descripcio: 'Tria la variant.', onTria,
      opcions: [{ id: 'tassa', nom: 'Tassa', valor: '1,50 €' }, { id: 'got', nom: 'Got', valor: '1,60 €', actiu: true }] };
    const { p, rerender } = pinta({ tria });
    const dialeg = screen.getByRole('dialog', { name: 'Cafè amb llet' });
    expect(within(dialeg).getByText('Tria la variant.')).toBeTruthy();
    expect(within(dialeg).getByRole('button', { name: 'Got 1,60 €' }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Tassa 1,50 €' }));
    expect(onTria).toHaveBeenCalledWith(tria.opcions[0]);
    expect(onTanca).toHaveBeenCalledWith('tria');
    expect(onTria.mock.invocationCallOrder[0]).toBeLessThan(onTanca.mock.invocationCallOrder[0]);
    rerender(<UniversalTPV {...p} tria={{ ...tria, obert: false }} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('sense cap tiquet obert, el buit del diàleg', () => {
    pinta({ oberts: { obert: true, onTanca: vi.fn(), titol: 'Llistes', elements: [], onTria: vi.fn() } });
    expect(within(screen.getByRole('dialog', { name: 'Llistes' })).getByText('Encara no n’hi ha cap.')).toBeTruthy();
  });
});

describe('la disposició estreta (amplada pròpia per davall de 46em)', () => {
  test('la barra d’accions dalt i les pestanyes Productes / Tiquet N; l’estat del catàleg es conserva', () => {
    const canvia = ambAmplada(375);
    pinta({ avis: 'Entra per a vendre.' });
    expect(tpv().dataset.mida).toBe('estreta');
    const fills = [...tpv().children];
    expect(fills[0].className).toBe('sdp-tpv__accions');
    expect(within(fills[0]).getByRole('button', { name: 'Cobra 3,20 €' })).toBeTruthy();
    expect(fills[1].textContent).toBe('Entra per a vendre.');
    const llista = screen.getByRole('tablist', { name: 'Vista' });
    const [productes, tiquet] = within(llista).getAllByRole('tab');
    expect(productes.textContent).toBe('Productes');
    expect(tiquet).toBe(within(llista).getByRole('tab', { name: 'Tiquet 2' }));
    expect(productes.getAttribute('aria-selected')).toBe('true');
    /* Productes: la graella es veu; el tiquet, no. */
    fireEvent.click(within(pastilles()).getByRole('button', { name: 'Menjar' }));
    expect(screen.getByRole('list', { name: 'Productes: Menjar' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Tiquet 2' })).toBeNull();
    fireEvent.click(tiquet);
    expect(tiquet.getAttribute('aria-selected')).toBe('true');
    const regio = screen.getByRole('region', { name: 'Tiquet 2' });
    expect(within(regio).getByRole('list', { name: 'Línies' })).toBeTruthy();
    /* En el mòbil, el tiquet no repetix la barra ni l'avís. */
    expect(regio.querySelector('.sdp-tpv__accions')).toBeNull();
    expect(regio.querySelector('.sdp-tpv__avis')).toBeNull();
    expect(screen.queryByRole('list', { name: /^Productes/ })).toBeNull();
    /* El missatge d'estat és fora de les pestanyes: es diu també des de «Productes». */
    expect(screen.getByRole('status').textContent).toBe('Tiquet: 2 unitats');
    /* Torna a ser ampla: les dues àrees, i la categoria triada continua triada. */
    canvia(1024);
    expect(tpv().dataset.mida).toBe('ampla');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('list', { name: 'Productes: Menjar' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tiquet 2' }).querySelector('.sdp-tpv__accions')).not.toBeNull();
  });

  test('una llista d’avisos: en el mòbil, el primer fora de les pestanyes i la resta a la del tiquet', () => {
    ambAmplada(375);
    pinta({ avis: [<span key="a">Entra per a vendre.</span>, <span key="b">Per emportar.</span>] });
    const fills = [...tpv().children];
    expect(fills[1].className).toBe('sdp-tpv__avis');
    expect(fills[1].textContent).toBe('Entra per a vendre.');
    fireEvent.click(within(screen.getByRole('tablist', { name: 'Vista' })).getByRole('tab', { name: 'Tiquet 2' }));
    const regio = screen.getByRole('region', { name: 'Tiquet 2' });
    expect(regio.querySelector('.sdp-tpv__avis').textContent).toBe('Per emportar.');
  });

  test('la frontera és 46em, per les dues bandes: 735 px estreta, 736 px ampla', () => {
    const canvia = ambAmplada(735);
    pinta();
    expect(tpv().dataset.mida).toBe('estreta');
    canvia(736);
    expect(tpv().dataset.mida).toBe('ampla');
    canvia(735);
    expect(tpv().dataset.mida).toBe('estreta');
  });
});
