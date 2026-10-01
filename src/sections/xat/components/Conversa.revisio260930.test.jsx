/* Revisió adversarial 260930 (carril F-Conversa) · Les correccions de la
   conversa oberta, una prova per troballa:
     #1  obrir amb la memòria cau rància: s'espera la càrrega;
     #2  el visitant d'un fil de pàgina no té no llegits;
     #3  el text de ?context= no trepitja l'esborrany;
     #4  més no llegits que una pàgina: historial cap arrere fins al primer;
     #5  «Baixa al final» amb desplaçament suau;
     #6  «Baixa al final» en estret no obri el teclat;
     #7  Escape al menú «⋯» de la bombolla queda consumit;
     #8  el focus del menú de la bombolla;
     #9  «Baixa al final» sense compositor no perd el focus;
     #10 el contrast AA de la pastilla de «Baixa al final»;
     #11 la llista no és una regió en viu: s'anuncien només els nous d'altres;
     #12 la cita porta el focus a l'original;
     #13 el comptador de caràcters no es pinta damunt de la barra de resposta;
   i la neteja de l'espècimen (cap estat «entregat»).
   La mateixa geometria fixa que Conversa.test.jsx: jsdom no fa maquetació,
   i scrollTop es conserva tal qual. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { MS_ESPERA_OBERTURA } from '../conversa.js';
import { buidaEsborranys, desaEsborrany, llegixEsborrany } from '../esborranys.js';

const t = (_, alternativa) => alternativa;

const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();

const m = (id, seq, sender, extra = {}) => ({
  id, seq, sender, text: `Text ${id}`, creatAl: hui(seq ?? 0), estatEnviament: 'enviat',
  ...(sender === 'me' ? {} : { author: 'Pep', usuariId: 'pep' }),
  ...extra
});
const pagina = (des, fins) => Array.from({ length: fins - des + 1 }, (_, i) => m(String(des + i), des + i, 'other'));

const FIL = { id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 };

const geo = { scrollHeight: 1000, clientHeight: 400, caixes: new Map() };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');
function clauDeCaixa(el) {
  if (el.classList?.contains('sdp-xat-no-llegits')) return 'no-llegits';
  return el.getAttribute?.('data-missatge') ?? null;
}

/* IntersectionObserver fals: només registra què s'observa. Serveix per a
   saber si la conversa ja vigila les bombolles per a marcar-les llegides. */
let observadors = [];
class ObservadorFals {
  constructor(callback) {
    this.callback = callback;
    this.nodes = [];
    this.viu = true;
    observadors.push(this);
  }

  observe(node) { this.nodes.push(node); }

  disconnect() { this.viu = false; }
}
const vigilaVistos = () => observadors.filter((o) => o.viu && o.nodes.some((n) => n.hasAttribute('data-vist')));

beforeEach(() => {
  buidaEsborranys();
  observadors = [];
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
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
  delete HTMLElement.prototype.scrollTo;
  delete window.matchMedia;
});

function pinta({ mida = 'ample', ...canvis } = {}) {
  const props = {
    fil: FIL, messages: [], onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
    onCopia: vi.fn(), hiHaMes: false, carregantMes: false, onCarregaMes: vi.fn(), onReintenta: vi.fn(), onDescarta: vi.fn(),
    onMarcaVist: vi.fn(), locale: 'ca-ES', t, ...canvis
  };
  const arbre = () => (
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida }}>
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
const separador = () => document.querySelector('.sdp-xat-no-llegits');
const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const botoBaixar = () => screen.queryByRole('button', { name: 'Baixa al final' });
const botoOpcions = (id) => within(item(id)).getByRole('button', { name: 'Opcions del missatge' });

function pujaA(scrollTop) {
  llista().scrollTop = scrollTop;
  fireEvent.scroll(llista());
}

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('#1 · obrir amb la memòria cau rància', () => {
  /* Tornes a A després d'haver-la llegida: la memòria cau porta 1-3, tot
     llegit, però el fil ja diu ultimSeq 6. Els nous arriben després de muntar. */
  const CAU = [m('1', 1, 'other'), m('2', 2, 'me'), m('3', 3, 'other')];
  const FIL_A = { ...FIL, llegitFinsSeq: 3, ultimSeq: 6, noLlegits: 3 };

  test('espera la càrrega: cap separador ni cap marca de lectura abans; després, el separador davant del primer nou i el salt a ell', () => {
    vi.stubGlobal('IntersectionObserver', ObservadorFals);
    const { repinta } = pinta({ fil: FIL_A, messages: CAU });
    expect(separador()).toBeNull();
    /* Provisionalment al fons, i res no es marca com a llegit. */
    expect(llista().scrollTop).toBe(1000);
    expect(vigilaVistos()).toHaveLength(0);

    /* Arriba la càrrega incremental. Amb el scroll a 1000, el separador és
       a 500 px de dalt del contingut: la seua caixa, a 100 + 500 − 1000. */
    geo.scrollHeight = 1300;
    geo.caixes.set('no-llegits', { top: -400, height: 32 });
    repinta({ messages: [...CAU, m('4', 4, 'other'), m('5', 5, 'other'), m('6', 6, 'other')] });
    expect(separador().textContent).toBe('3 missatges no llegits');
    expect(separador().nextElementSibling).toBe(item('4'));
    expect(llista().scrollTop).toBe(500);
    /* No eres al fons (1300 − 500 − 400), però no són «nous mentre llegies». */
    expect(botoBaixar()).not.toBeNull();
    expect(botoBaixar().querySelector('.sdp-xat-baixa__pastilla')).toBeNull();
    expect(vigilaVistos()).toHaveLength(1);
  });

  test('un missatge teu enviat abans que arribe la càrrega no consumix el separador, i el salt no t’allunya del que has escrit', () => {
    const { repinta } = pinta({ fil: FIL_A, messages: CAU });
    geo.scrollHeight = 1100;
    repinta({ messages: [...CAU, { ...m('p', null, 'me'), estatEnviament: 'pendent' }] });
    expect(separador()).toBeNull();
    expect(llista().scrollTop).toBe(1100);
    geo.scrollHeight = 1400;
    geo.caixes.set('no-llegits', { top: -400, height: 32 });
    repinta({ messages: [...CAU, m('4', 4, 'other'), m('5', 5, 'other'), m('6', 6, 'other'), { ...m('p', null, 'me'), estatEnviament: 'pendent' }] });
    expect(separador().textContent).toBe('3 missatges no llegits');
    expect(separador().nextElementSibling).toBe(item('4'));
    expect(llista().scrollTop).toBe(1400);
  });

  test('si la càrrega no arriba, passat MS_ESPERA_OBERTURA es fixa amb el que hi ha i es marca el que es veu', () => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', ObservadorFals);
    pinta({ fil: FIL_A, messages: CAU });
    expect(vigilaVistos()).toHaveLength(0);
    act(() => { vi.advanceTimersByTime(MS_ESPERA_OBERTURA); });
    expect(separador()).toBeNull();
    expect(llista().scrollTop).toBe(1000);
    expect(vigilaVistos()).toHaveLength(1);
  });
});

describe('#2 · visitant d’un fil de pàgina', () => {
  test('sense marca pròpia no hi ha no llegits: cap separador i s’obri pel fons', () => {
    geo.caixes.set('no-llegits', { top: 600, height: 32 });
    pinta({
      fil: { ...FIL, participant: false, llegitFinsSeq: 0, ultimSeq: 3, noLlegits: 0 },
      messages: [m('1', 1, 'other'), m('2', 2, 'other'), m('3', 3, 'other')]
    });
    expect(separador()).toBeNull();
    expect(llista().scrollTop).toBe(1000);
    expect(botoBaixar()).toBeNull();
  });
});

describe('#3 · ?context= i l’esborrany', () => {
  test('el text de context es mostra però no trepitja l’esborrany; enviar-lo tal qual tampoc l’esborra; editar-lo, sí que es desa', async () => {
    desaEsborrany('A:f-1', 'Demà passe pel forn');
    const primera = pinta({ clauEsborrany: 'A:f-1', initialText: 'Context de Connectar', messages: [m('1', 1, 'other')] });
    expect(camp().value).toBe('Context de Connectar');
    expect(llegixEsborrany('A:f-1')).toBe('Demà passe pel forn');

    fireEvent.keyDown(camp(), { key: 'Enter' });
    await waitFor(() => expect(primera.props.onSendMessage).toHaveBeenCalledWith(FIL, 'Context de Connectar'));
    expect(llegixEsborrany('A:f-1')).toBe('Demà passe pel forn');
    primera.unmount();

    pinta({ clauEsborrany: 'A:f-1', initialText: 'Context de Connectar' });
    fireEvent.change(camp(), { target: { value: 'Context de Connectar, i més' } });
    expect(llegixEsborrany('A:f-1')).toBe('Context de Connectar, i més');
  });
});

describe('#4 · més no llegits que una pàgina', () => {
  /* ultimSeq 100, llegit fins al 20: 80 no llegits, i la pàgina en porta 50. */
  const FIL_GRAN = { ...FIL, llegitFinsSeq: 20, ultimSeq: 100, noLlegits: 80 };

  test('carrega cap arrere fins al primer no llegit abans de fixar el separador i de marcar res', () => {
    vi.stubGlobal('IntersectionObserver', ObservadorFals);
    const { props, repinta } = pinta({ fil: FIL_GRAN, messages: pagina(51, 100), hiHaMes: true });
    expect(props.onCarregaMes).toHaveBeenCalledTimes(1);
    expect(separador()).toBeNull();
    expect(vigilaVistos()).toHaveLength(0);

    repinta({ carregantMes: true });
    repinta({ carregantMes: false, messages: pagina(1, 100) });
    expect(props.onCarregaMes).toHaveBeenCalledTimes(1);
    expect(separador().textContent).toBe('80 missatges no llegits');
    expect(separador().nextElementSibling).toBe(item('21'));
    expect(vigilaVistos()).toHaveLength(1);
  });

  test('si l’historial no arriba, no es torna a demanar i el separador diu els no llegits del fil, no els de la pàgina', () => {
    const { props, repinta } = pinta({ fil: FIL_GRAN, messages: pagina(51, 100), hiHaMes: true });
    repinta({ carregantMes: true });
    repinta({ carregantMes: false });
    expect(props.onCarregaMes).toHaveBeenCalledTimes(1);
    expect(separador().textContent).toBe('80 missatges no llegits');
    expect(separador().nextElementSibling).toBe(item('51'));
  });
});

describe('#5 · «Baixa al final» amb desplaçament suau', () => {
  function baixaSuau() {
    window.matchMedia = vi.fn(() => ({ matches: false }));
    HTMLElement.prototype.scrollTo = vi.fn();
    const missatges = [m('1', 1, 'other')];
    const vista = pinta({ messages: missatges });
    pujaA(100);
    fireEvent.click(botoBaixar());
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    return { ...vista, missatges };
  }

  test('els scrolls intermedis de l’animació no tornen a traure el botó, i un nou d’un altre es seguix al fons', () => {
    const { repinta, missatges } = baixaSuau();
    pujaA(300);
    expect(botoBaixar()).toBeNull();
    geo.scrollHeight = 1100;
    repinta({ messages: [...missatges, m('2', 2, 'other')] });
    expect(llista().scrollTop).toBe(1100);
    expect(botoBaixar()).toBeNull();
  });

  test('si la persona toca la llista, el salt s’interromp i el botó torna', () => {
    baixaSuau();
    fireEvent.wheel(llista());
    pujaA(300);
    expect(botoBaixar()).not.toBeNull();
  });
});

describe('«Baixa al final» i el focus', () => {
  test('#6 · en estret el focus va a la llista i no al camp: el teclat del mòbil no s’obri', () => {
    pinta({ mida: 'estret', messages: [m('1', 1, 'other')] });
    pujaA(100);
    fireEvent.click(botoBaixar());
    expect(document.activeElement).toBe(llista());
    expect(llista().getAttribute('tabindex')).toBe('-1');
  });

  test('en ample continua anant al camp', () => {
    pinta({ messages: [m('1', 1, 'other')] });
    pujaA(100);
    fireEvent.click(botoBaixar());
    expect(document.activeElement).toBe(camp());
  });

  test('#9 · als Avisos de només lectura (sense camp) el focus va a la llista i no es perd a <body>', () => {
    pinta({ fil: { id: 'a-1', tipus: 'canal', name: 'Avisos', llegitFinsSeq: 100 }, messages: [m('1', 1, 'other')] });
    pujaA(100);
    const boto = botoBaixar();
    boto.focus();
    fireEvent.click(boto);
    expect(document.activeElement).toBe(llista());
  });

  test('#9 · en «Seleccionar missatges» (sense compositor) el focus també va a la llista', () => {
    pinta({ messages: [m('1', 1, 'other')] });
    fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar missatges' }));
    pujaA(100);
    const boto = botoBaixar();
    boto.focus();
    fireEvent.click(boto);
    expect(document.activeElement).toBe(llista());
  });
});

describe('menú «⋯» de la bombolla', () => {
  test('#7 · Escape tanca el menú, queda consumit (un sol Escape tanca UNA cosa) i el focus torna al «⋯»', () => {
    pinta({ messages: [m('1', 1, 'other', { text: 'Bon dia' })] });
    const boto = botoOpcions('1');
    fireEvent.click(boto);
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(fireEvent.keyDown(document.activeElement, { key: 'Escape' })).toBe(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(boto);
  });

  test('#8 · en obrir-lo el focus entra a la primera opció; «Copia el text» el torna al «⋯»', () => {
    const { props } = pinta({ messages: [m('1', 1, 'other', { text: 'Bon dia' })] });
    const boto = botoOpcions('1');
    fireEvent.click(boto);
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Respon' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copia el text' }));
    expect(props.onCopia).toHaveBeenCalledWith('Bon dia');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(boto);
  });

  test('#8 · sense «Respon», la primera opció és «Copia el text»', () => {
    pinta({ fil: { ...FIL, tipus: 'directe', potEscriure: false }, messages: [m('1', 1, 'other', { text: 'Bon dia' })] });
    fireEvent.click(botoOpcions('1'));
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Copia el text' }));
  });

  test('#8 · «Respon» sobre el missatge que ja és la resposta també porta el focus al camp', () => {
    pinta({ messages: [m('1', 1, 'other', { text: 'Bon dia' })] });
    fireEvent.click(botoOpcions('1'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
    expect(document.activeElement).toBe(camp());
    fireEvent.click(botoOpcions('1'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
    expect(document.activeElement).toBe(camp());
  });
});

describe('#10 · contrast de la pastilla de «Baixa al final»', () => {
  /* Els valors dels tokens: el primer és el del tema clar i el segon el del
     fosc; un token que el fosc no redefinix val igual en tots dos. */
  const TOKENS = `${llig('src/css/design-tokens.css')}\n${llig('src/css/tokens.css')}`;
  const declaracions = (nom) => [...TOKENS.matchAll(new RegExp(`${nom}\\s*:\\s*([^;]+);`, 'g'))].map((d) => d[1].trim());
  function hexDe(nom, tema) {
    const valors = declaracions(nom);
    let v = valors[tema] ?? valors[0];
    for (let i = 0; i < 8 && v?.startsWith('var('); i += 1) v = declaracions(v.slice(4, -1).trim())[0];
    return v;
  }
  function contrast(a, b) {
    const lum = (hex) => {
      const [r, g, bl] = [1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [clar, fosc] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (clar + 0.05) / (fosc + 0.05);
  }

  test('el recompte (14 px en negreta, text no gran) passa AA, 4,5:1, en clar i en fosc', () => {
    const bloc = senseComentaris(llig('src/css/modules.css')).match(/\.sdp-xat-baixa__pastilla\s*\{([^}]*)\}/)[1];
    const fons = bloc.match(/background:\s*var\((--[a-z0-9-]+)\)/)[1];
    const tinta = bloc.match(/(?:^|[;\s])color:\s*var\((--[a-z0-9-]+)\)/)[1];
    for (const tema of [0, 1]) {
      expect(contrast(hexDe(fons, tema), hexDe(tinta, tema))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('#11 · la regió en viu', () => {
  test('la llista no és una regió en viu; els antics per dalt i els propis no s’anuncien, els nous d’altres sí', () => {
    const missatges = [m('3', 3, 'other')];
    const { repinta } = pinta({ messages: missatges, hiHaMes: true });
    expect(llista().hasAttribute('aria-live')).toBe(false);
    const anunci = screen.getByRole('status');
    expect(llista().contains(anunci)).toBe(false);
    expect(anunci.textContent).toBe('');

    repinta({ messages: [m('1', 1, 'other'), m('2', 2, 'other'), ...missatges] });
    expect(anunci.textContent).toBe('');
    repinta({ messages: [m('1', 1, 'other'), m('2', 2, 'other'), ...missatges, m('4', 4, 'me')] });
    expect(anunci.textContent).toBe('');
    repinta({ messages: [m('1', 1, 'other'), m('2', 2, 'other'), ...missatges, m('4', 4, 'me'), m('5', 5, 'other', { text: 'Bon dia' })] });
    expect(anunci.textContent).toBe('Pep: Bon dia');
    repinta({ messages: [m('1', 1, 'other'), m('2', 2, 'other'), ...missatges, m('4', 4, 'me'), m('5', 5, 'other', { text: 'Bon dia' }), m('6', 6, 'other'), m('7', 7, 'other')] });
    expect(anunci.textContent).toBe('2 missatges nous');
  });

  test('la càrrega que arriba després d’obrir tampoc no s’anuncia', () => {
    const { repinta } = pinta({ messages: [] });
    repinta({ messages: [m('1', 1, 'other'), m('2', 2, 'other')] });
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

describe('#12 · la cita', () => {
  test('porta el focus a l’original, que és enfocable sense entrar a l’ordre de tabulació', () => {
    pinta({ messages: [m('1', 1, 'other', { text: 'Original' }), m('2', 2, 'me', { text: 'Resposta', respostaA: '1' })] });
    fireEvent.click(within(item('2')).getByRole('button', { name: 'Missatge citat: Pep Original' }));
    expect(document.activeElement).toBe(item('1'));
    expect(item('1').getAttribute('tabindex')).toBe('-1');
  });
});

describe('#13 · el comptador i la barra de resposta', () => {
  test('amb la barra, el compositor reserva l’alçada del comptador damunt del camp', () => {
    pinta({ messages: [m('1', 1, 'other', { text: 'Bon dia' })] });
    const formulari = () => camp().closest('form');
    fireEvent.change(camp(), { target: { value: 'x'.repeat(3900) } });
    /* Sense barra, el comptador ja existia i no canvia res. */
    expect(formulari().classList.contains('sdp-xat-compositor--comptador')).toBe(true);
    expect(formulari().previousElementSibling?.classList.contains('sdp-xat-resposta')).not.toBe(true);

    fireEvent.click(botoOpcions('1'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
    expect(formulari().previousElementSibling.classList.contains('sdp-xat-resposta')).toBe(true);
    expect(formulari().classList.contains('sdp-xat-compositor--comptador')).toBe(true);

    /* El comptador (text-meta × 1,5 d'alt) seu a space-1 damunt del camp: el
       coixí de dalt del compositor, que era space-2, hi afig la seua alçada. */
    const css = senseComentaris(llig('src/css/modules.css'));
    expect(css).toMatch(/\.sdp-xat-compositor__comptador\s*\{[^}]*bottom:\s*calc\(100% \+ var\(--sdp-space-1\)\);/);
    expect(css).toMatch(/\.sdp-xat-resposta\s*\+\s*\.sdp-xat-compositor--comptador\s*\{\s*padding-top:\s*calc\(var\(--sdp-space-2\)\s*\+\s*var\(--sdp-text-meta\)\s*\*\s*1\.5\);\s*\}/);

    fireEvent.change(camp(), { target: { value: 'curt' } });
    expect(formulari().classList.contains('sdp-xat-compositor--comptador')).toBe(false);
  });
});

describe('neteja · l’espècimen del Xat', () => {
  test('les dades de mostra només usen estats que MarquesEstat coneix (cap «entregat»)', () => {
    const font = llig('src/sections/disseny/cataleg/detalls/EspecimenXat.jsx');
    const estats = [...font.matchAll(/estatEnviament:\s*'([a-z]+)'/g)].map((e) => e[1]);
    expect(estats.length).toBeGreaterThan(0);
    expect(estats.filter((e) => !['pendent', 'enviat', 'llegit', 'error'].includes(e))).toEqual([]);
  });
});
