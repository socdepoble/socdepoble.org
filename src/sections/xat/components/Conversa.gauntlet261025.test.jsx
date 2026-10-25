/* Gauntlet 261025_0545 (carril de la vista del xat) · La conversa:
   enganxada al fons quan la llista o el contingut canvien de mida (XU-05),
   marcar llegit només amb la finestra visible i atenta, i tornar-ho a mirar en
   tornar-hi (XU-08, XC-12), un missatge més alt que la llista també es llig
   (MISSED de verify-xat-ux), «Carregant la conversa…» i l'avís del fil
   (XC-14 / XU-07), la benvinguda de la IAIA amb «· IA» i dalt de tot
   (IA-07 i MISSED de verify-iaia-xat), i dos anuncis iguals seguits (XU-13).
   jsdom no fa maquetació: la geometria de la llista la fixem ací. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { BENVINGUDA_IAIA } from '../../../data/identitatsSeed.js';
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
const MISSATGES = Array.from({ length: 30 }, (_, i) => m(`m${i + 1}`, i + 1));

const geo = { scrollHeight: 1000, clientHeight: 400 };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');

/* IntersectionObserver fals: guarda les opcions i notifica quan la prova vol. */
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
  geo.scrollHeight = 1000;
  geo.clientHeight = 400;
  vi.stubGlobal('IntersectionObserver', ObservadorFals);
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return esLlista(this) ? geo.scrollHeight : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return esLlista(this) ? geo.clientHeight : 0; } });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const caixa = esLlista(this) ? { top: 100, height: geo.clientHeight } : { top: 0, height: 0 };
    return { x: 0, y: caixa.top, left: 0, width: 0, right: 0, top: caixa.top, height: caixa.height, bottom: caixa.top + caixa.height, toJSON() {} };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
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
function pujaA(scrollTop) {
  llista().scrollTop = scrollTop;
  fireEvent.scroll(llista());
}

describe('XU-05 · enganxada al fons quan creix el contingut o s’encongix la llista', () => {
  test('a baix, una foto que carrega o el compositor que creix no amaguen el final; lluny del fons, no salta', () => {
    vi.stubGlobal('ResizeObserver', MidesFalses);
    const foto = m('foto', 31, 'other', { text: '', tipus: 'imatge', metadades: { adjunt: { id: '00000000-0000-4000-8000-000000000001' } } });
    pinta({ messages: [...MISSATGES, foto] });
    const [mida] = mides;
    expect(mida).toBeTruthy();
    expect(mida.nodes.has(llista())).toBe(true);
    expect(mida.nodes.has(bombolla('foto'))).toBe(true);
    expect(llista().scrollTop).toBe(1000);

    /* La foto carrega: el contingut creix 256 px i la llista es queda al fons. */
    geo.scrollHeight = 1256;
    mida.notifica();
    expect(llista().scrollTop).toBe(1256);
    expect(screen.queryByRole('button', { name: 'Baixa al final' })).toBeNull();

    /* Lluny del fons, res no es mou. */
    pujaA(200);
    geo.scrollHeight = 1500;
    mida.notifica();
    expect(llista().scrollTop).toBe(200);
  });

  test('sense ResizeObserver (navegadors vells, jsdom), la conversa es pinta igual', () => {
    pinta();
    expect(llista().scrollTop).toBe(1000);
  });
});

describe('XU-08 / XC-12 · llegit només amb la finestra visible i atenta', () => {
  test('la llista no és l’arrel: el que és fora de la pantalla (la pàgina de l’amfitrió) no compta', () => {
    pinta();
    const vigia = vigiaDeLectura();
    expect(vigia.opcions.root ?? null).toBeNull();
    expect(vigia.opcions.threshold).toEqual(expect.arrayContaining([0, 0.5]));
  });

  test('amb la finestra desenfocada no es marca res; en tornar-hi el focus, es marca el que s’hi veu', () => {
    const { props } = pinta();
    const vigia = vigiaDeLectura();
    const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    act(() => { window.dispatchEvent(new Event('blur')); });
    vigia.notifica([{ isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 60 }, target: bombolla('m20') }]);
    expect(props.onMarcaVist).not.toHaveBeenCalled();
    focus.mockReturnValue(true);
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(props.onMarcaVist).toHaveBeenLastCalledWith(20);
  });

  test('el que ha entrat amb la pestanya amagada es marca en tornar visible, sense esperar cap missatge ni cap scroll', () => {
    const { props } = pinta();
    const vigia = vigiaDeLectura();
    const visibilitat = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    vigia.notifica([{ isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 60 }, target: bombolla('m25') }]);
    expect(props.onMarcaVist).not.toHaveBeenCalled();
    visibilitat.mockReturnValue('visible');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(props.onMarcaVist).toHaveBeenLastCalledWith(25);
  });

  /* Revisió 261025 · El focus es vigila des que es munta la conversa: si
     se'n va mentre carrega, quan es fa llesta no es marca res. */
  test('canviar d’app mentre la conversa carrega: llesta sense el focus, no es marca res fins que torna', () => {
    const vista = pinta({ messages: [] });
    expect(vigiaDeLectura()).toBeFalsy();
    const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    act(() => { window.dispatchEvent(new Event('blur')); });
    vista.repinta({ messages: MISSATGES });
    const vigia = vigiaDeLectura();
    expect(vigia).toBeTruthy();
    vigia.notifica([{ isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 60 }, target: bombolla('m30') }]);
    expect(vista.props.onMarcaVist).not.toHaveBeenCalled();
    focus.mockReturnValue(true);
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(vista.props.onMarcaVist).toHaveBeenLastCalledWith(30);
  });

  /* Revisió 261025 · Una finestra tapada compta com a amagada: destapar-la
     mentre una altra app té el focus la fa visible, però no atenta. */
  test('tornar a ser visible sense el focus (la finestra destapada, una altra app al davant) no marca res', () => {
    const { props } = pinta();
    const vigia = vigiaDeLectura();
    const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    act(() => { window.dispatchEvent(new Event('blur')); });
    const visibilitat = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    visibilitat.mockReturnValue('visible');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    vigia.notifica([{ isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 60 }, target: bombolla('m28') }]);
    expect(props.onMarcaVist).not.toHaveBeenCalled();
    /* Torna amb el focus (visible i atenta): ara sí. */
    focus.mockReturnValue(true);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(props.onMarcaVist).toHaveBeenLastCalledWith(28);
  });

  test('desmuntada la conversa, tornar a la finestra no marca res', () => {
    const { props, unmount } = pinta();
    const vigia = vigiaDeLectura();
    vigia.notifica([{ isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 60 }, target: bombolla('m25') }]);
    props.onMarcaVist.mockClear();
    unmount();
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(props.onMarcaVist).not.toHaveBeenCalled();
  });
});

describe('MISSED (verify-xat-ux) · un missatge més alt que la llista també es llig', () => {
  test('mig missatge no hi cap mai, però si en veus mitja llista, l’has vist', () => {
    const { props } = pinta();
    const vigia = vigiaDeLectura();
    /* Chromium: ràtio 0,2 per davall del llindar, isIntersecting false. */
    vigia.notifica([{ isIntersecting: false, intersectionRatio: 0.2, intersectionRect: { height: 300 }, target: bombolla('m30') }]);
    expect(props.onMarcaVist).toHaveBeenLastCalledWith(30);
  });

  test('un tros menut d’una bombolla a la vora no la fa llegida', () => {
    const { props } = pinta();
    const vigia = vigiaDeLectura();
    vigia.notifica([{ isIntersecting: true, intersectionRatio: 0.1, intersectionRect: { height: 6 }, target: bombolla('m30') }]);
    expect(props.onMarcaVist).not.toHaveBeenCalled();
  });
});

describe('XC-14 / XU-07 · mentre carrega, ni «Cap missatge encara» ni silenci', () => {
  test('sense missatges i sense càrrega, «Carregant la conversa…» (status) i la llista ocupada', () => {
    const vista = pinta({ messages: [], carregat: false });
    expect(screen.queryByText('Cap missatge encara. Inicia la conversa!')).toBeNull();
    expect(screen.getByText('Carregant la conversa…').closest('[role="status"]')).toBeTruthy();
    expect(llista().getAttribute('aria-busy')).toBe('true');
    vista.repinta({ carregat: true });
    expect(screen.queryByText('Carregant la conversa…')).toBeNull();
    expect(screen.getByText('Cap missatge encara. Inicia la conversa!')).toBeTruthy();
    expect(llista().hasAttribute('aria-busy')).toBe(false);
  });

  test('sense les props noves (el context d’abans), la conversa buida diu el de sempre', () => {
    pinta({ messages: [] });
    expect(screen.getByText('Cap missatge encara. Inicia la conversa!')).toBeTruthy();
    expect(screen.queryByText('Carregant la conversa…')).toBeNull();
  });

  test('l’avís del fil no bloqueja: es veu damunt del compositor, traduït, i «Torna-ho a provar» torna a llegir', () => {
    const onReintentaFil = vi.fn();
    /* El context en dona el text cru de l'error: la vista diu què passa. */
    const vista = pinta({ avisFil: 'Load failed', onReintentaFil });
    expect(screen.queryByText('Load failed')).toBeNull();
    const avis = screen.getByText("No s'ha pogut actualitzar la conversa.");
    expect(avis.getAttribute('role')).toBe('status');
    const fila = avis.parentElement;
    expect(fila.compareDocumentPosition(llista()) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    fireEvent.click(within(fila).getByRole('button', { name: 'Torna-ho a provar' }));
    expect(onReintentaFil).toHaveBeenCalledTimes(1);
    /* Les bombolles i el camp continuen. */
    expect(bombolla('m1')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
    vista.repinta({ avisFil: null });
    expect(screen.queryByText("No s'ha pogut actualitzar la conversa.")).toBeNull();
  });

  test('sense onReintentaFil, l’avís sense botó', () => {
    pinta({ avisFil: "No s'han pogut carregar els missatges." });
    expect(screen.getByText("No s'ha pogut actualitzar la conversa.")).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Torna-ho a provar' })).toBeNull();
  });
});

describe('IA-07 · la benvinguda automàtica de la IAIA', () => {
  test('diu que és IA, com les bombolles de la IA, i va abans dels missatges: no sembla una resposta', () => {
    pinta({ cortesiaIAIA: true });
    const benvinguda = screen.getByText(BENVINGUDA_IAIA).closest('li');
    expect(within(benvinguda).getByText('IAIA MarIA · IA')).toBeTruthy();
    expect(benvinguda.compareDocumentPosition(bombolla('m1')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(benvinguda.compareDocumentPosition(bombolla('m30')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('XU-13 · dos anuncis iguals seguits', () => {
  test('el segon «Pep: ok» també canvia la regió en viu', () => {
    const vista = pinta({ fil: { ...FIL, ultimSeq: 1 }, messages: [m('1', 1)] });
    const anunci = () => document.querySelector('.sdp-nomes-lector[role="status"]').textContent;
    geo.scrollHeight = 1100;
    vista.repinta({ messages: [m('1', 1), m('2', 2, 'other', { text: 'ok' })] });
    const primer = anunci();
    expect(primer.trim()).toBe('Pep: ok');
    geo.scrollHeight = 1200;
    vista.repinta({ messages: [m('1', 1), m('2', 2, 'other', { text: 'ok' }), m('3', 3, 'other', { text: 'ok' })] });
    expect(anunci()).not.toBe(primer);
    expect(anunci().trim()).toBe('Pep: ok');
  });
});
