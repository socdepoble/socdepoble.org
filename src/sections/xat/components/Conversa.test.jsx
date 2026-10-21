/* Torn 260930 (T1 · la conversa amb el patró de missatgeria, ordre del
   Mestre) · Conversa muntada sola, sense XatContext: grups amb cua, el
   separador «N missatges no llegits» fix des de l'obertura, el scroll que no
   salta si no eres a baix i el botó «Baixa al final», les respostes (menú,
   barra, Escape, cita que porta a l'original) i els esborranys per clau.
   jsdom no fa maquetació: la geometria de la llista (scrollHeight,
   clientHeight i les caixes) la fixem ací, i scrollTop es conserva tal qual. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { RESPOSTA_IAIA } from '../../../data/identitatsSeed.js';
import EspecimenXat from '../../disseny/cataleg/detalls/EspecimenXat.jsx';
import { MS_RESSALT } from '../conversa.js';
import { buidaEsborranys, llegixEsborrany } from '../esborranys.js';

const t = (_, alternativa) => alternativa;

const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const ahir = (minuts) => new Date(migdia.getTime() - 86400000 + minuts * 60000).toISOString();

const m = (id, seq, sender, extra = {}) => ({
  id, seq, sender, text: `Text ${id}`, creatAl: hui(seq ?? 0), estatEnviament: 'enviat',
  ...(sender === 'me' ? {} : { author: 'Pep', usuariId: 'pep' }),
  ...extra
});

/* Un grup on s'hi pot escriure i sense res per llegir. */
const FIL = { id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 };

/* Geometria de la llista: només la llista té alçades i caixa; els altres
   elements, la caixa que diga `geo.caixes` (per data-missatge o el separador). */
const geo = { scrollHeight: 1000, clientHeight: 400, caixes: new Map() };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');
function clauDeCaixa(el) {
  if (el.classList?.contains('sdp-xat-no-llegits')) return 'no-llegits';
  return el.getAttribute?.('data-missatge') ?? null;
}

beforeEach(() => {
  buidaEsborranys();
  geo.scrollHeight = 1000;
  geo.clientHeight = 400;
  geo.caixes = new Map();
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return esLlista(this) ? geo.scrollHeight : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return esLlista(this) ? geo.clientHeight : 0; } });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const caixa = esLlista(this) ? { top: 100, height: geo.clientHeight } : geo.caixes.get(clauDeCaixa(this)) || { top: 0, height: 0 };
    return { x: 0, y: caixa.top, left: 0, width: 0, right: 0, top: caixa.top, height: caixa.height, bottom: caixa.top + caixa.height, toJSON() {} };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
  delete HTMLElement.prototype.scrollTo;
  delete window.matchMedia;
});

function pinta(canvis = {}) {
  const props = {
    fil: FIL, messages: [], onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
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
const item = (id) => document.querySelector(`[data-missatge="${id}"]`);
const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const botoBaixar = () => screen.queryByRole('button', { name: 'Baixa al final' });
const teCua = (id) => item(id).querySelector('.sdp-xat-bombolla').classList.contains('sdp-xat-bombolla--cua');

function menuDe(id) {
  fireEvent.click(within(item(id)).getByRole('button', { name: 'Opcions del missatge' }));
  return screen.getByRole('menu');
}

/* L'usuari puja: la llista deixa el fons i ho diu amb un scroll. */
function pujaA(scrollTop) {
  llista().scrollTop = scrollTop;
  fireEvent.scroll(llista());
}

describe('grups per autor', () => {
  test('la cua i el nom només a la primera bombolla de la tirada; les següents, més juntes; el sistema talla', () => {
    pinta({
      messages: [
        m('1', 1, 'other'), m('2', 2, 'other'), m('3', 3, 'other'),
        { id: 's', seq: 4, tipus: 'sistema', sender: 'other', metadades: {}, text: 'Canvi', creatAl: hui(4) },
        m('5', 5, 'other'), m('6', 6, 'me'), m('7', 7, 'me')
      ]
    });
    expect(['1', '2', '3', '5', '6', '7'].map(teCua)).toEqual([true, false, false, true, true, false]);
    expect(item('1').classList.contains('sdp-xat-item--segueix')).toBe(false);
    expect(item('2').classList.contains('sdp-xat-item--segueix')).toBe(true);
    expect(item('7').classList.contains('sdp-xat-item--segueix')).toBe(true);
    expect(within(item('1')).getByRole('link', { name: 'Obri el perfil de Pep' })).toBeTruthy();
    expect(item('2').querySelector('.sdp-xat-bombolla__autor')).toBeNull();
    expect(item('3').querySelector('.sdp-xat-bombolla__autor')).toBeNull();
    expect(item('5').querySelector('.sdp-xat-bombolla__autor')).not.toBeNull();
  });

  test('el mateix autor en dos dies són dos grups, amb el separador de dia entremig', () => {
    pinta({ messages: [m('1', 1, 'other', { creatAl: ahir(1) }), m('2', 2, 'other', { creatAl: hui(2) })] });
    expect([teCua('1'), teCua('2')]).toEqual([true, true]);
    expect(document.querySelectorAll('.sdp-xat-dia')).toHaveLength(2);
  });
});

describe('separador de no llegits', () => {
  test('es calcula en obrir, va davant del primer no llegit i no es mou mentre la conversa és oberta', () => {
    const missatges = [m('1', 1, 'other'), m('2', 2, 'me'), m('3', 3, 'other'), m('4', 4, 'me'), m('5', 5, 'other')];
    const { repinta } = pinta({ fil: { ...FIL, llegitFinsSeq: 2 }, messages: missatges });
    const separador = document.querySelector('.sdp-xat-no-llegits');
    expect(separador.textContent).toBe('2 missatges no llegits');
    expect(separador.nextElementSibling).toBe(item('3'));
    /* Llegir mou la marca del fil i arriben més missatges: el separador es queda. */
    repinta({ fil: { ...FIL, llegitFinsSeq: 6 }, messages: [...missatges, m('6', 6, 'other')] });
    expect(document.querySelectorAll('.sdp-xat-no-llegits')).toHaveLength(1);
    expect(document.querySelector('.sdp-xat-no-llegits').textContent).toBe('2 missatges no llegits');
    expect(document.querySelector('.sdp-xat-no-llegits').nextElementSibling).toBe(item('3'));
  });

  test('en singular; talla el grup; i si els missatges arriben després d’obrir, es calcula amb la marca d’obrir', () => {
    const { repinta } = pinta({ fil: { ...FIL, llegitFinsSeq: 2 }, messages: [] });
    expect(document.querySelector('.sdp-xat-no-llegits')).toBeNull();
    repinta({ fil: { ...FIL, llegitFinsSeq: 3 }, messages: [m('1', 1, 'me'), m('2', 2, 'other'), m('3', 3, 'other')] });
    expect(document.querySelector('.sdp-xat-no-llegits').textContent).toBe('1 missatge no llegit');
    expect([teCua('2'), teCua('3')]).toEqual([true, true]);
  });

  test('sense marca de lectura coneguda, o sense no llegits, cap separador', () => {
    pinta({ fil: { ...FIL, llegitFinsSeq: undefined }, messages: [m('1', 1, 'other')] });
    expect(document.querySelector('.sdp-xat-no-llegits')).toBeNull();
    cleanup();
    pinta({ messages: [m('1', 1, 'other')] });
    expect(document.querySelector('.sdp-xat-no-llegits')).toBeNull();
  });

  test('en obrir, el separador queda dalt de la vista en lloc d’anar al fons', () => {
    geo.caixes.set('no-llegits', { top: 600, height: 32 });
    pinta({ fil: { ...FIL, llegitFinsSeq: 1 }, messages: [m('1', 1, 'other'), m('2', 2, 'other')] });
    /* 600 − 100 (dalt de la llista) − 0 de coixí (jsdom no carrega el CSS). */
    expect(llista().scrollTop).toBe(500);
    /* 1000 − 500 − 400 = 100 px del fons: ix el botó per a baixar. */
    expect(botoBaixar()).not.toBeNull();
  });
});

describe('scroll i «Baixa al final»', () => {
  test('sense no llegits s’obri al fons i el botó no hi és', () => {
    pinta({ messages: [m('1', 1, 'other')] });
    expect(llista().scrollTop).toBe(1000);
    expect(botoBaixar()).toBeNull();
  });

  test('si no eres a baix, un missatge dels altres no et mou: el botó en compta els nous', () => {
    const missatges = [m('1', 1, 'other'), m('2', 2, 'other')];
    const { repinta } = pinta({ messages: missatges });
    pujaA(200);
    expect(botoBaixar()).not.toBeNull();
    expect(botoBaixar().hasAttribute('aria-describedby')).toBe(false);

    geo.scrollHeight = 1100;
    repinta({ messages: [...missatges, m('3', 3, 'other')] });
    expect(llista().scrollTop).toBe(200);
    expect(document.getElementById(botoBaixar().getAttribute('aria-describedby')).textContent).toBe('1 missatge nou');
    expect(botoBaixar().querySelector('.sdp-xat-baixa__pastilla').textContent).toBe('1');

    repinta({ messages: [...missatges, m('3', 3, 'other'), m('4', 4, 'other'), m('5', 5, 'other')] });
    expect(llista().scrollTop).toBe(200);
    expect(document.getElementById(botoBaixar().getAttribute('aria-describedby')).textContent).toBe('3 missatges nous');
  });

  test('si eres a baix, o si el missatge és teu, baixa al fons', () => {
    const missatges = [m('1', 1, 'other')];
    const { repinta } = pinta({ messages: missatges });
    geo.scrollHeight = 1100;
    repinta({ messages: [...missatges, m('2', 2, 'other')] });
    expect(llista().scrollTop).toBe(1100);
    expect(botoBaixar()).toBeNull();

    pujaA(100);
    geo.scrollHeight = 1200;
    repinta({ messages: [...missatges, m('2', 2, 'other'), { ...m('3', null, 'me'), estatEnviament: 'pendent' }] });
    expect(llista().scrollTop).toBe(1200);
    expect(botoBaixar()).toBeNull();
  });

  test('tornar al fons a mà buida el recompte', () => {
    const missatges = [m('1', 1, 'other')];
    const { repinta } = pinta({ messages: missatges });
    pujaA(100);
    repinta({ messages: [...missatges, m('2', 2, 'other')] });
    expect(botoBaixar().querySelector('.sdp-xat-baixa__pastilla')).not.toBeNull();
    pujaA(600);
    expect(botoBaixar()).toBeNull();
    pujaA(100);
    expect(botoBaixar().querySelector('.sdp-xat-baixa__pastilla')).toBeNull();
  });

  test.each([
    ['amb menys moviment, salt sec', true, 'auto'],
    ['sense, desplaçament suau', false, 'smooth']
  ])('prémer «Baixa al final» baixa al fons (%s), buida el recompte i deixa el focus al camp', (_, reduit, behavior) => {
    window.matchMedia = vi.fn(() => ({ matches: reduit }));
    HTMLElement.prototype.scrollTo = vi.fn();
    const missatges = [m('1', 1, 'other')];
    const { repinta } = pinta({ messages: missatges });
    pujaA(100);
    repinta({ messages: [...missatges, m('2', 2, 'other')] });
    fireEvent.click(botoBaixar());
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior });
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(botoBaixar()).toBeNull();
    expect(document.activeElement).toBe(camp());
  });

  test('els antics carregats per dalt conserven la posició de lectura i no compten com a nous', () => {
    const missatges = [m('3', 3, 'other'), m('4', 4, 'other')];
    const { repinta } = pinta({ messages: missatges, hiHaMes: true });
    pujaA(0);
    geo.scrollHeight = 1500;
    repinta({ messages: [m('1', 1, 'other'), m('2', 2, 'other'), ...missatges] });
    expect(llista().scrollTop).toBe(500);
    expect(botoBaixar().querySelector('.sdp-xat-baixa__pastilla')).toBeNull();
  });

  /* Auditoria de Codex 2150, C6-X1: 500 px d'historial per dalt i 300 px d'un
     missatge alié per baix en el mateix render. Es compensa només el que ha
     baixat el missatge que era el primer (500), no tot el creixement (800). */
  test('antics per dalt i nous per baix alhora: només es compensa el que ha entrat per dalt', () => {
    /* El missatge '3' (el primer) a 100 px de dalt de la caixa amb el scroll al
       fons (1000): al contingut, a 1000 px. */
    geo.caixes.set('3', { top: 100, height: 48 });
    const missatges = [m('3', 3, 'other'), m('4', 4, 'other')];
    const { repinta } = pinta({ messages: missatges, hiHaMes: true });
    pujaA(200);
    /* Després: al contingut ha baixat 500 (1500), i amb el scroll a 200 la
       seua caixa és a 1500 − 200 + 100 = 1400. */
    geo.caixes.set('3', { top: 1400, height: 48 });
    geo.scrollHeight = 1800;
    repinta({ messages: [m('1', 1, 'other'), m('2', 2, 'other'), ...missatges, m('5', 5, 'other')] });
    expect(llista().scrollTop).toBe(700);
    expect(botoBaixar().querySelector('.sdp-xat-baixa__pastilla').textContent).toBe('1');
  });
});

describe('respostes', () => {
  test('«Respon» encapçala el menú, obri la barra amb el focus al camp i envia amb respostaA', async () => {
    const { props } = pinta({ messages: [m('1', 1, 'other', { text: 'Bon dia' }), m('2', 2, 'me', { text: 'Hola' })] });
    const menu = menuDe('1');
    expect(within(menu).getAllByRole('menuitem').map((e) => e.textContent)).toEqual(['Respon', 'Copia el text']);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Respon' }));
    expect(screen.queryByRole('menu')).toBeNull();
    const barra = screen.getByRole('group', { name: 'Resposta a Pep' });
    expect(within(barra).getByText('Bon dia')).toBeTruthy();
    expect(document.activeElement).toBe(camp());

    fireEvent.change(camp(), { target: { value: '  I a tu  ' } });
    fireEvent.keyDown(camp(), { key: 'Enter' });
    await waitFor(() => expect(props.onSendMessage).toHaveBeenCalledWith(FIL, 'I a tu', { respostaA: '1' }));
    expect(screen.queryByRole('group', { name: /Resposta a/ })).toBeNull();
    expect(camp().value).toBe('');
    /* Llevar la barra no torna a muntar el camp: el focus s'hi queda per a
       continuar escrivint. */
    expect(document.activeElement).toBe(camp());
  });

  test('sense resposta, onSendMessage rep només el fil i el text (el contracte d’abans)', async () => {
    const { props } = pinta({ messages: [m('1', 1, 'other')] });
    fireEvent.change(camp(), { target: { value: 'Hola' } });
    fireEvent.keyDown(camp(), { key: 'Enter' });
    await waitFor(() => expect(props.onSendMessage).toHaveBeenCalledTimes(1));
    expect(props.onSendMessage.mock.calls[0]).toEqual([FIL, 'Hola']);
  });

  test('si l’enviament falla, es conserven el text i la resposta', async () => {
    const onSendMessage = vi.fn().mockRejectedValue(new Error('sense xarxa'));
    pinta({ onSendMessage, messages: [m('1', 1, 'me', { text: 'Meu' })] });
    fireEvent.click(within(menuDe('1')).getByRole('menuitem', { name: 'Respon' }));
    expect(screen.getByRole('group', { name: 'Resposta a Tu' })).toBeTruthy();
    fireEvent.change(camp(), { target: { value: 'Ho reenvie' } });
    fireEvent.keyDown(camp(), { key: 'Enter' });
    await waitFor(() => expect(camp().value).toBe('Ho reenvie'));
    expect(onSendMessage).toHaveBeenCalledWith(FIL, 'Ho reenvie', { respostaA: '1' });
    expect(screen.getByRole('group', { name: 'Resposta a Tu' })).toBeTruthy();
  });

  test('Escape dins del camp cancel·la la resposta i queda consumit; la ✕ també, i torna el focus al camp', () => {
    pinta({ messages: [m('1', 1, 'other')] });
    /* Sense resposta, Escape no es consumix. */
    expect(fireEvent.keyDown(camp(), { key: 'Escape' })).toBe(true);
    fireEvent.click(within(menuDe('1')).getByRole('menuitem', { name: 'Respon' }));
    expect(fireEvent.keyDown(camp(), { key: 'Escape' })).toBe(false);
    expect(screen.queryByRole('group', { name: /Resposta a/ })).toBeNull();

    fireEvent.click(within(menuDe('1')).getByRole('menuitem', { name: 'Respon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la la resposta' }));
    expect(screen.queryByRole('group', { name: /Resposta a/ })).toBeNull();
    expect(document.activeElement).toBe(camp());
  });

  test('no es respon a pendents, fallits ni esborrats', () => {
    pinta({
      messages: [
        m('1', 1, 'other'),
        { ...m('2', null, 'me'), estatEnviament: 'pendent' },
        { ...m('3', null, 'me'), estatEnviament: 'error' },
        m('4', 4, 'other', { esborrat: true })
      ]
    });
    const noms = (id) => {
      const menu = menuDe(id);
      const items = within(menu).getAllByRole('menuitem').map((e) => e.textContent);
      fireEvent.click(within(item(id)).getByRole('button', { name: 'Opcions del missatge' }));
      return items;
    };
    expect(noms('1')).toEqual(['Respon', 'Copia el text']);
    expect(noms('2')).toEqual(['Copia el text']);
    expect(noms('3')).toEqual(['Copia el text']);
    expect(within(item('4')).queryByRole('button', { name: 'Opcions del missatge' })).toBeNull();
  });

  test.each([
    ['un fil amb potEscriure: false', { ...FIL, tipus: 'directe', potEscriure: false }],
    ['un canal sense permís explícit (D7)', { id: 'a-1', tipus: 'canal', name: 'Avisos', llegitFinsSeq: 100 }]
  ])('%s: sense «Respon»', (_, fil) => {
    pinta({ fil, messages: [m('1', 1, 'other')] });
    expect(within(menuDe('1')).getAllByRole('menuitem').map((e) => e.textContent)).toEqual(['Copia el text']);
  });
});

describe('cites', () => {
  test('la cita diu qui i què, porta a l’original, el centra i el ressalta un moment', () => {
    vi.useFakeTimers();
    geo.caixes.set('1', { top: 700, height: 50 });
    pinta({ messages: [m('1', 1, 'other', { text: 'Original' }), m('2', 2, 'me', { text: 'Resposta', respostaA: '1' })] });
    const cita = within(item('2')).getByRole('button', { name: 'Missatge citat: Pep Original' });
    expect(item('2').querySelector('.sdp-xat-bombolla').firstElementChild).toBe(cita);
    llista().scrollTop = 0;
    fireEvent.click(cita);
    /* 0 + (700 − 100) − (400 − 50) / 2 */
    expect(llista().scrollTop).toBe(425);
    expect(item('1').classList.contains('sdp-xat-item--ressaltat')).toBe(true);
    act(() => { vi.advanceTimersByTime(MS_RESSALT); });
    expect(item('1').classList.contains('sdp-xat-item--ressaltat')).toBe(false);
  });

  test('la cita d’un missatge propi diu «Tu»; si l’original no s’ha carregat, ho diu i no promet cap salt', () => {
    pinta({
      messages: [
        m('1', 1, 'me', { text: 'Meu' }),
        m('2', 2, 'other', { respostaA: '1' }),
        m('3', 3, 'other', { respostaA: 'no-hi-es' })
      ]
    });
    expect(within(item('2')).getByRole('button', { name: 'Missatge citat: Tu Meu' })).toBeTruthy();
    expect(within(item('3')).getByText('Missatge no carregat')).toBeTruthy();
    expect(within(item('3')).queryByRole('button', { name: /Missatge citat/ })).toBeNull();
  });

  test('en mode de selecció la cita no és un botó (la bombolla ja és una casella)', () => {
    pinta({ messages: [m('1', 1, 'other', { text: 'Original' }), m('2', 2, 'me', { respostaA: '1' })] });
    fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar missatges' }));
    expect(within(item('2')).queryByRole('button', { name: /Missatge citat/ })).toBeNull();
    expect(item('2').querySelector('.sdp-xat-cita').tagName).toBe('DIV');
  });
});

/* Pedra Seca §9: les peces noves tenen el seu espècimen al catàleg. */
describe('espècimen del Xat', () => {
  test('mostra el grup de tres amb una sola cua, la cita, el separador, «Baixa al final» i la barra de resposta', () => {
    render(<MemoryRouter><EspecimenXat /></MemoryRouter>);
    expect(['g-1', 'g-2', 'g-3'].map(teCua)).toEqual([true, false, false]);
    expect(within(item('g-4')).getByRole('button', { name: /^Missatge citat: Pepica la Vall Les deixe/ })).toBeTruthy();
    expect(within(item('g-5')).getByText('Missatge no carregat')).toBeTruthy();
    expect(document.querySelector('.sdp-xat-no-llegits').textContent).toBe('3 missatges no llegits');
    expect(document.getElementById(botoBaixar().getAttribute('aria-describedby')).textContent).toBe('4 missatges nous');
    const barra = screen.getByRole('group', { name: 'Resposta a Pepica la Vall' });
    fireEvent.click(within(barra).getByRole('button', { name: 'Cancel·la la resposta' }));
    expect(screen.queryByRole('group', { name: 'Resposta a Pepica la Vall' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Respon a Pepica' }));
    expect(screen.getByRole('group', { name: 'Resposta a Pepica la Vall' })).toBeTruthy();
  });
});

describe('esborranys', () => {
  test('amb clauEsborrany el text a mig escriure torna en tornar a la conversa i s’esborra en enviar', async () => {
    const primera = pinta({ clauEsborrany: 'A:f-1', messages: [m('1', 1, 'other')] });
    fireEvent.change(camp(), { target: { value: 'Mig escrit' } });
    primera.unmount();
    expect(llegixEsborrany('A:f-1')).toBe('Mig escrit');

    const segona = pinta({ clauEsborrany: 'A:f-1', messages: [m('1', 1, 'other')] });
    expect(camp().value).toBe('Mig escrit');
    fireEvent.keyDown(camp(), { key: 'Enter' });
    await waitFor(() => expect(segona.props.onSendMessage).toHaveBeenCalledWith(FIL, 'Mig escrit'));
    expect(llegixEsborrany('A:f-1')).toBe('');
  });

  test('initialText guanya a l’esborrany; sense clau res no es conserva', () => {
    pinta({ clauEsborrany: 'A:f-1' });
    fireEvent.change(camp(), { target: { value: 'Esborrany' } });
    cleanup();
    pinta({ clauEsborrany: 'A:f-1', initialText: 'Context de Connectar' });
    expect(camp().value).toBe('Context de Connectar');
    cleanup();

    pinta();
    fireEvent.change(camp(), { target: { value: 'Sense clau' } });
    cleanup();
    pinta();
    expect(camp().value).toBe('');
  });
});


test('la cortesia remota de la IAIA és explícita i no inventa missatges ni crida el port', () => {
  const { props, container, repinta } = pinta({ cortesiaIAIA: true });
  expect(screen.getByText(RESPOSTA_IAIA)).toBeTruthy();
  expect(screen.getByText(/Benvinguda automàtica/)).toBeTruthy();
  expect(container.querySelector('[data-missatge]')).toBeNull();
  expect(props.onSendMessage).not.toHaveBeenCalled();
  repinta({ cortesiaIAIA: false });
  expect(screen.queryByText(RESPOSTA_IAIA)).toBeNull();
});
