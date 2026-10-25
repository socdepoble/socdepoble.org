/* Gauntlet 261025_0545 (verificació final, carril de la vista) · El que la
   verificació en Chrome i la revisió creuada han trobat després dels arreglos:
     · XU-05 · el navegador dispara l'esdeveniment scroll (d'una fixació
       anterior) ABANS de la crida del ResizeObserver: la foto que ja era a la
       memòria cau o el compositor que creix a tecla seguida deixaven el final
       tapat i «Baixa al final» a la vista. Un scroll només vol dir que la
       persona ha deixat el fons si scrollTop ha baixat.
     · D4 · desenfocada no es desfeia mai si un WKWebView, en tornar del fons,
       no torna el focus ni dispara 'focus': 'pageshow' i el primer toc o
       tecla dins de la conversa la desfan.
     · D5 · l'avís del fil diu què ha fallat (llegir o marcar), «Torna-ho a
       provar» diu que ja hi està mentre una lectura vola, i mai «Carregant la
       conversa…» i l'avís alhora.
   jsdom no fa maquetació: la geometria la fixem ací, i scrollTop es retalla
   com en un navegador (entre 0 i scrollHeight − clientHeight). */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { buidaEsborranys } from '../esborranys.js';
import Conversa from './Conversa.jsx';

const t = (_, alternativa) => alternativa;

const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const m = (id, seq, sender = 'other', extra = {}) => ({
  id, seq, sender, text: `Text ${id}`, creatAl: hui(seq ?? 0), estatEnviament: 'enviat',
  ...(sender === 'me' ? {} : { author: 'Pep', usuariId: 'pep' }),
  ...extra
});
const FIL = Object.freeze({ id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100, ultimSeq: 30 });
const AMB_FOTO = { fil: { ...FIL, ultimSeq: 31 } };
const MISSATGES = Array.from({ length: 30 }, (_, i) => m(`m${i + 1}`, i + 1));
const FOTO = m('foto', 31, 'other', { text: '', tipus: 'imatge', metadades: { adjunt: { id: '00000000-0000-4000-8000-000000000001' } } });

/* La geometria de la llista: scrollTop es retalla com en un navegador. */
const geo = { scrollHeight: 1000, clientHeight: 400, scrollTop: 0, separadorTop: 0 };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');
const maxim = () => Math.max(0, geo.scrollHeight - geo.clientHeight);
const altres = new WeakMap();

/* IntersectionObserver fals: la prova diu què és a la vista. */
let observadors = [];
class ObservadorFals {
  constructor(callback, opcions) {
    this.callback = callback;
    this.opcions = opcions || {};
    this.nodes = new Set();
    observadors.push(this);
  }

  observe(node) { this.nodes.add(node); }

  unobserve(node) { this.nodes.delete(node); }

  disconnect() { this.nodes.clear(); }

  notifica(entrades) { act(() => { this.callback(entrades, this); }); }
}
const vigiaDeLectura = () => observadors.find((o) => [...o.nodes].some((n) => n.hasAttribute('data-vist')));

/* ResizeObserver fals: la prova diu quan ha canviat la mida. */
let mides = [];
class MidesFalses {
  constructor(callback) {
    this.callback = callback;
    this.nodes = new Set();
    mides.push(this);
  }

  observe(node) { this.nodes.add(node); }

  unobserve(node) { this.nodes.delete(node); }

  disconnect() { this.nodes.clear(); }

  notifica() { act(() => { this.callback([...this.nodes].map((target) => ({ target })), this); }); }
}

beforeEach(() => {
  buidaEsborranys();
  observadors = [];
  mides = [];
  Object.assign(geo, { scrollHeight: 1000, clientHeight: 400, scrollTop: 0, separadorTop: 0 });
  vi.stubGlobal('IntersectionObserver', ObservadorFals);
  vi.stubGlobal('ResizeObserver', MidesFalses);
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return esLlista(this) ? geo.scrollHeight : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return esLlista(this) ? geo.clientHeight : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get() { return esLlista(this) ? Math.min(geo.scrollTop, maxim()) : altres.get(this) ?? 0; },
    set(valor) {
      if (esLlista(this)) geo.scrollTop = Math.min(Math.max(0, Number(valor) || 0), maxim());
      else altres.set(this, Number(valor) || 0);
    }
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    let caixa = { top: 0, height: 0 };
    if (esLlista(this)) caixa = { top: 100, height: geo.clientHeight };
    else if (this.classList?.contains('sdp-xat-no-llegits')) caixa = { top: geo.separadorTop, height: 24 };
    return { x: 0, y: caixa.top, left: 0, width: 0, right: 0, top: caixa.top, height: caixa.height, bottom: caixa.top + caixa.height, toJSON() {} };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
  delete HTMLElement.prototype.scrollTop;
  delete HTMLElement.prototype.scrollTo;
  delete window.matchMedia;
});

function pinta(canvis = {}) {
  const props = {
    fil: FIL, messages: MISSATGES, onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
    onCopia: vi.fn(), hiHaMes: false, carregantMes: false, onCarregaMes: vi.fn(), onReintenta: vi.fn(), onDescarta: vi.fn(),
    onMarcaVist: vi.fn(), locale: 'ca-ES', t, ...canvis
  };
  const arbre = () => (
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa {...props} />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
  const vista = render(arbre());
  return {
    ...vista,
    props,
    repinta(nous) {
      Object.assign(props, nous);
      vista.rerender(arbre());
    }
  };
}

const llista = () => document.querySelector('.sdp-xat-missatges');
const bombolla = (id) => document.querySelector(`[data-missatge="${id}"]`);
const botoBaixar = () => screen.queryByRole('button', { name: 'Baixa al final' });
/* L'esdeveniment scroll que el navegador dispara, sense moure res. */
const scrollDelNavegador = () => fireEvent.scroll(llista());
/* La persona puja: scrollTop baixa i el navegador ho diu amb un scroll. */
function pujaA(scrollTop) {
  llista().scrollTop = scrollTop;
  fireEvent.scroll(llista());
}
const mida = () => mides[0];

describe('XU-05 (verificació en Chrome) · el scroll arriba abans que el ResizeObserver', () => {
  test('una foto que ja era a la memòria cau: el scroll llig el creixement abans de l’observador, i el final es veu', () => {
    pinta({ ...AMB_FOTO, messages: [...MISSATGES, FOTO] });
    expect(llista().scrollTop).toBe(600);
    expect(botoBaixar()).toBeNull();

    /* La foto carrega al mateix fotograma: el scroll pendent de l'última
       fixació llig 256 px de distància (scrollTop no s'ha mogut) i, després,
       l'observador avisa del creixement. */
    geo.scrollHeight = 1256;
    scrollDelNavegador();
    expect(botoBaixar()).toBeNull();
    mida().notifica();
    expect(llista().scrollTop).toBe(856);
    expect(botoBaixar()).toBeNull();
  });

  test('el compositor que creix a tecla seguida: dos línies en un fotograma no deixen el final tapat', () => {
    pinta();
    expect(llista().scrollTop).toBe(600);
    /* Primera línia: la llista s'encongix i l'observador la fixa. */
    geo.clientHeight = 376;
    mida().notifica();
    expect(llista().scrollTop).toBe(624);
    /* Dos línies més abans del fotograma següent: primer el scroll de la
       fixació d'abans (48 px de distància), després l'observador. */
    geo.clientHeight = 328;
    scrollDelNavegador();
    mida().notifica();
    expect(llista().scrollTop).toBe(672);
    expect(botoBaixar()).toBeNull();
  });

  test('si la persona ha pujat de veritat (scrollTop baixa), res no salta i el botó hi és', () => {
    pinta({ ...AMB_FOTO, messages: [...MISSATGES, FOTO] });
    pujaA(400);
    expect(botoBaixar()).not.toBeNull();
    geo.scrollHeight = 1256;
    scrollDelNavegador();
    mida().notifica();
    expect(llista().scrollTop).toBe(400);
    expect(botoBaixar()).not.toBeNull();
  });

  test('pujar al mateix fotograma que creix la foto també compta com a pujar', () => {
    pinta({ ...AMB_FOTO, messages: [...MISSATGES, FOTO] });
    geo.scrollHeight = 1256;
    pujaA(560);
    mida().notifica();
    expect(llista().scrollTop).toBe(560);
    expect(botoBaixar()).not.toBeNull();
  });

  test('l’observador abans que el scroll d’una persona que puja (una animació de teclat): tampoc salta', () => {
    pinta({ ...AMB_FOTO, messages: [...MISSATGES, FOTO] });
    llista().scrollTop = 500;
    geo.scrollHeight = 1256;
    mida().notifica();
    expect(llista().scrollTop).toBe(500);
    scrollDelNavegador();
    expect(botoBaixar()).not.toBeNull();
  });

  test('el salt inicial al separador de no llegits es queda on és, encara que després arribe un scroll i el contingut cresca', () => {
    geo.separadorTop = 400;
    pinta({ fil: { ...FIL, llegitFinsSeq: 20, ultimSeq: 30, noLlegits: 10 } });
    expect(document.querySelector('.sdp-xat-no-llegits')).toBeTruthy();
    /* scrollPerDeixarDalt(0, llista a 100, separador a 400) = 300. */
    expect(llista().scrollTop).toBe(300);
    expect(botoBaixar()).not.toBeNull();
    scrollDelNavegador();
    geo.scrollHeight = 1256;
    mida().notifica();
    scrollDelNavegador();
    expect(llista().scrollTop).toBe(300);
    expect(botoBaixar()).not.toBeNull();
  });

  test('els antics carregats per dalt conserven la posició de lectura: el scroll de la compensació no porta al fons', () => {
    const missatges = [m('3', 3), m('4', 4)];
    const vista = pinta({ fil: { ...FIL, ultimSeq: 4 }, messages: missatges, hiHaMes: true });
    pujaA(0);
    geo.scrollHeight = 1500;
    vista.repinta({ messages: [m('1', 1), m('2', 2), ...missatges] });
    expect(llista().scrollTop).toBe(500);
    scrollDelNavegador();
    mida().notifica();
    expect(llista().scrollTop).toBe(500);
    expect(botoBaixar()).not.toBeNull();
  });

  test('«Baixa al final» suau: els scrolls de l’animació no la tallen, i pujar a mitjan animació la para sense saltar', () => {
    window.matchMedia = vi.fn(() => ({ matches: false }));
    HTMLElement.prototype.scrollTo = vi.fn();
    pinta();
    pujaA(100);
    fireEvent.click(botoBaixar());
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    expect(botoBaixar()).toBeNull();
    /* L'animació baixa: cap scroll intermedi torna el botó ni fixa d'una. */
    pujaA(300);
    expect(llista().scrollTop).toBe(300);
    expect(botoBaixar()).toBeNull();
    /* La persona toca la roda i puja: la baixada es para on és. */
    fireEvent.wheel(llista());
    pujaA(250);
    expect(botoBaixar()).not.toBeNull();
    geo.scrollHeight = 1256;
    mida().notifica();
    expect(llista().scrollTop).toBe(250);
    /* I el botó torna a baixar al fons. */
    window.matchMedia = vi.fn(() => ({ matches: true }));
    HTMLElement.prototype.scrollTo = function scrollTo({ top }) { this.scrollTop = top; };
    fireEvent.click(botoBaixar());
    expect(llista().scrollTop).toBe(856);
    expect(botoBaixar()).toBeNull();
  });

  test('la roda a mitjan baixada suau, amb el seu scroll i el de l’animació en un de sol: es para on és, no torna al fons', () => {
    window.matchMedia = vi.fn(() => ({ matches: false }));
    HTMLElement.prototype.scrollTo = vi.fn();
    pinta();
    pujaA(100);
    fireEvent.click(botoBaixar());
    /* L'animació ha mogut la llista a 300 sense que n'haja arribat el scroll,
       i la persona toca la roda (abans del seu scroll) i puja a 250. */
    llista().scrollTop = 300;
    fireEvent.wheel(llista());
    llista().scrollTop = 250;
    scrollDelNavegador();
    expect(llista().scrollTop).toBe(250);
    expect(botoBaixar()).not.toBeNull();
  });

  /* Mesurat en Chrome: la roda i el dit són passius, i el compositor pot
     moure la llista ABANS que arribe l'esdeveniment wheel. Si eixe moment es
     prenguera per punt de partida, el scroll de la persona semblaria
     contingut que creix i la tornaria al fons. */
  test('la roda passiva: la llista ja ha pujat quan arriba wheel, i el scroll no la torna al fons', () => {
    pinta();
    expect(llista().scrollTop).toBe(600);
    llista().scrollTop = 480;
    fireEvent.wheel(llista());
    scrollDelNavegador();
    expect(llista().scrollTop).toBe(480);
    expect(botoBaixar()).not.toBeNull();
  });

  test('anar a la cita des del fons: el scroll del salt no torna al fons', () => {
    const missatges = [...MISSATGES.slice(0, 29), m('m30', 30, 'other', { respostaA: 'm5' })];
    pinta({ messages: missatges });
    expect(llista().scrollTop).toBe(600);
    fireEvent.click(bombolla('m30').querySelector('.sdp-xat-cita'));
    /* scrollPerCentrar(600, llista a 100 i 400 d'alt, cita a 0) = 300. */
    const salt = llista().scrollTop;
    expect(salt).toBe(300);
    scrollDelNavegador();
    expect(llista().scrollTop).toBe(salt);
    expect(botoBaixar()).not.toBeNull();
  });
});

/* Gauntlet 261025_0545 (XU-05, revisió creuada) · Mesurat en Chrome 155: un
   trackpad, un dit o una roda de precisió lents (uns 60 px/s o menys) mouen
   la llista 1 px o menys per esdeveniment scroll. Com que cada scroll dins
   del fons apunta on és la llista, scrollTop mai no baixava més d'un píxel
   respecte de l'últim i, en passar el llindar, el scroll es prenia per
   contingut que creix: tornava al fons, sense botó, i qui pujava a poc a poc
   no eixia mai del fons. */
describe('XU-05 (revisió creuada) · pujar a poc a poc des del fons', () => {
  /* El navegador mou la llista `px` des d'on és i ho diu amb un scroll. */
  function pujaPocAPoc(px, vegades) {
    for (let i = 0; i < vegades; i++) {
      llista().scrollTop -= px;
      fireEvent.scroll(llista());
    }
  }

  test.each([0.5, 1, 2])('%s px per scroll, 120 scrolls: la persona ix del fons i «Baixa al final» hi és', (pas) => {
    pinta();
    expect(llista().scrollTop).toBe(600);
    pujaPocAPoc(pas, 120);
    expect(llista().scrollTop).toBe(600 - pas * 120);
    expect(botoBaixar()).not.toBeNull();
  });

  test('ja fora del fons a poc a poc, la foto que creix després no la torna al fons', () => {
    pinta({ ...AMB_FOTO, messages: [...MISSATGES, FOTO] });
    pujaPocAPoc(1, 40);
    expect(llista().scrollTop).toBe(560);
    expect(botoBaixar()).not.toBeNull();
    geo.scrollHeight = 1256;
    scrollDelNavegador();
    mida().notifica();
    expect(llista().scrollTop).toBe(560);
    expect(botoBaixar()).not.toBeNull();
  });

  test('a poc a poc però encara dins del fons, la foto que creix (scroll abans que l’observador) es veu sencera', () => {
    pinta({ ...AMB_FOTO, messages: [...MISSATGES, FOTO] });
    pujaPocAPoc(1, 5);
    expect(llista().scrollTop).toBe(595);
    expect(botoBaixar()).toBeNull();
    geo.scrollHeight = 1256;
    scrollDelNavegador();
    expect(llista().scrollTop).toBe(856);
    mida().notifica();
    expect(llista().scrollTop).toBe(856);
    expect(botoBaixar()).toBeNull();
  });

  test('baixar a poc a poc dins del fons no salta ni torna el botó', () => {
    pinta();
    pujaPocAPoc(1, 10);
    pujaPocAPoc(-1, 4);
    expect(llista().scrollTop).toBe(594);
    expect(botoBaixar()).toBeNull();
  });
});

describe('D4 ·la finestra desenfocada torna a ser atenta sense l’esdeveniment focus (WKWebView en tornar del fons)', () => {
  function desenfocadaAmbBombolla(id) {
    const vista = pinta();
    const vigia = vigiaDeLectura();
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    act(() => { window.dispatchEvent(new Event('blur')); });
    vigia.notifica([{ isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 60 }, target: bombolla(id) }]);
    expect(vista.props.onMarcaVist).not.toHaveBeenCalled();
    return vista;
  }

  /* pageshow d'una pàgina que torna de la memòria cau (persisted) o el de la
     primera càrrega (no persisted). */
  function mostraPagina(persisted) {
    const esdeveniment = new Event('pageshow');
    Object.defineProperty(esdeveniment, 'persisted', { value: persisted });
    act(() => { window.dispatchEvent(esdeveniment); });
  }

  test('pageshow amb la pàgina visible: es marca el que hi ha a la vista', () => {
    const { props } = desenfocadaAmbBombolla('m20');
    mostraPagina(true);
    expect(props.onMarcaVist).toHaveBeenLastCalledWith(20);
  });

  test('pageshow amb la pàgina amagada no marca res', () => {
    const { props } = desenfocadaAmbBombolla('m20');
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    mostraPagina(true);
    expect(props.onMarcaVist).not.toHaveBeenCalled();
  });

  /* Revisió creuada · Si la conversa es munta abans de l'esdeveniment load i
     la persona canvia de finestra abans que acabe, el pageshow de la primera
     càrrega (persisted false) no és tornar: la finestra continua sense focus. */
  test('el pageshow de la primera càrrega (no persisted) amb la finestra desenfocada no marca res', () => {
    const { props } = desenfocadaAmbBombolla('m20');
    mostraPagina(false);
    expect(props.onMarcaVist).not.toHaveBeenCalled();
  });

  test.each([
    ['un toc de punter a la llista', () => fireEvent.pointerDown(llista())],
    ['un toc tàctil al camp', () => fireEvent.touchStart(screen.getByRole('textbox', { name: 'Escriu un missatge' }))],
    ['una tecla a la llista', () => fireEvent.keyDown(llista(), { key: 'ArrowUp' })]
  ])('%s dins de la conversa la torna atenta i marca el que s’hi veu', (_, interactua) => {
    const { props } = desenfocadaAmbBombolla('m22');
    interactua();
    expect(props.onMarcaVist).toHaveBeenLastCalledWith(22);
  });

  test('sense interacció, o tocant fora de la conversa, continua sense marcar res', () => {
    const { props } = desenfocadaAmbBombolla('m22');
    fireEvent.pointerDown(document.body);
    fireEvent.keyDown(document.body, { key: 'Tab' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(props.onMarcaVist).not.toHaveBeenCalled();
  });
});

describe('D5 · l’avís del fil diu què ha fallat, i el reintent diu quan ja hi està', () => {
  const textLectura = "No s'ha pogut actualitzar la conversa.";
  const textMarca = "No s'ha pogut marcar la conversa com a llegida.";

  test('tipusAvisFil «marca»: el text de marcar, no el de llegir; sense tipus, el de llegir', () => {
    const vista = pinta({ avisFil: 'new row violates row-level security policy', tipusAvisFil: 'marca', onReintentaFil: vi.fn() });
    expect(screen.getByText(textMarca).getAttribute('role')).toBe('status');
    expect(screen.queryByText(textLectura)).toBeNull();
    vista.repinta({ tipusAvisFil: 'lectura' });
    expect(screen.getByText(textLectura)).toBeTruthy();
    expect(screen.queryByText(textMarca)).toBeNull();
    vista.repinta({ tipusAvisFil: undefined });
    expect(screen.getByText(textLectura)).toBeTruthy();
  });

  test('mentre una lectura del fil vola, «Torna-ho a provar» diu que hi està: ocupat, sense eixir de l’ordre de tabulació, i no torna a demanar', () => {
    const onReintentaFil = vi.fn();
    const vista = pinta({ avisFil: 'Load failed', onReintentaFil });
    const boto = screen.getByRole('button', { name: 'Torna-ho a provar' });
    boto.focus();
    vista.repinta({ llegintFil: true });
    const ocupat = within(screen.getByText(textLectura).parentElement).getByRole('button');
    expect(ocupat).toBe(boto);
    expect(document.activeElement).toBe(boto);
    expect(ocupat.textContent).toBe('Actualitzant…');
    expect(ocupat.getAttribute('aria-busy')).toBe('true');
    expect(ocupat.getAttribute('aria-disabled')).toBe('true');
    expect(ocupat.hasAttribute('disabled')).toBe(false);
    expect(ocupat.tabIndex).toBe(0);
    fireEvent.click(ocupat);
    expect(onReintentaFil).not.toHaveBeenCalled();

    vista.repinta({ llegintFil: false });
    expect(boto.textContent).toBe('Torna-ho a provar');
    expect(boto.hasAttribute('aria-busy')).toBe(false);
    expect(boto.hasAttribute('aria-disabled')).toBe(false);
    fireEvent.click(boto);
    expect(onReintentaFil).toHaveBeenCalledTimes(1);
  });

  test('la primera lectura ha fallat: l’avís i no «Carregant la conversa…» (mai els dos), ni «Cap missatge encara»', () => {
    const vista = pinta({ messages: [], carregat: false, avisFil: 'Failed to fetch', onReintentaFil: vi.fn() });
    expect(screen.getByText(textLectura)).toBeTruthy();
    expect(screen.queryByText('Carregant la conversa…')).toBeNull();
    expect(screen.queryByText('Cap missatge encara. Inicia la conversa!')).toBeNull();
    expect(llista().hasAttribute('aria-busy')).toBe(false);
    /* Torna-ho a provar: la llista torna a estar ocupada, però el text de
       càrrega no torna mentre hi ha l'avís. */
    vista.repinta({ llegintFil: true });
    expect(screen.queryByText('Carregant la conversa…')).toBeNull();
    expect(llista().getAttribute('aria-busy')).toBe('true');
    /* La lectura bona: ni avís ni càrrega. */
    vista.repinta({ llegintFil: false, avisFil: null, carregat: true });
    expect(screen.queryByText(textLectura)).toBeNull();
    expect(screen.getByText('Cap missatge encara. Inicia la conversa!')).toBeTruthy();
  });

  test('sense avís, la càrrega de sempre', () => {
    pinta({ messages: [], carregat: false, llegintFil: true });
    expect(screen.getByText('Carregant la conversa…')).toBeTruthy();
    expect(llista().getAttribute('aria-busy')).toBe('true');
  });
});
