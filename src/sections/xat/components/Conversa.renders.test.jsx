/* Gauntlet 261022_0225 (crítica Claude, F4–F7) · Regressió de l'estrès de la
   conversa: compta RENDERS i observacions, no temps. Amb 10.000 missatges,
   cada tecla repintava totes les bombolles, cada missatge d'altri feia dos
   renders sencers, obrir en feia dos i cada missatge nou tornava a observar
   totes les bombolles. Ací, amb N moderada.
   · Les bombolles es compten per etiquetaHora (temps.js), que només crida el
     cos de Bombolla, una vegada per render.
   · Els renders de Conversa, per estatObertura (conversa.js), que crida una
     vegada per render.
   REV-ESTRES-2 · També amb la llista tal com la deriva XatContext
   (combinaMissatges i anotaMissatgesBloquejats), no només amb objectes estables. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { anotaMissatgesBloquejats, objectiuDeContrapart, objectiuDeMissatge } from '../../../config/moderacio.js';
import { combinaMissatges } from '../missatges.js';
import { buidaEsborranys } from '../esborranys.js';
import { etiquetaHora } from '../temps.js';
import { estatObertura } from '../conversa.js';
import Conversa from './Conversa.jsx';

vi.mock('../temps.js', async (original) => {
  const real = await original();
  return { ...real, etiquetaHora: vi.fn(real.etiquetaHora) };
});
vi.mock('../conversa.js', async (original) => {
  const real = await original();
  return { ...real, estatObertura: vi.fn(real.estatObertura) };
});

const N = 120;
const t = (_, alternativa) => alternativa;
const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const m = (i, extra = {}) => ({
  id: `m${i}`, seq: i, sender: i % 3 ? 'other' : 'me', text: `Missatge ${i}`,
  creatAl: new Date(migdia.getTime() - (N - i) * 60000).toISOString(), estatEnviament: 'enviat',
  ...(i % 3 ? { author: 'Pep', usuariId: 'pep' } : {}), ...extra
});
const missatges = (n) => Array.from({ length: n }, (_, i) => m(i + 1));
const GRUP = Object.freeze({ id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: N, ultimSeq: N });

/* jsdom no fa maquetació: la llista té alçada i la resta, cap. */
const geo = { scrollHeight: 1000, clientHeight: 400 };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');

/* IntersectionObserver fals que diu quantes vegades es crea i quant observa. */
let observadors = [];
class ObservadorComptat {
  constructor(callback) {
    this.callback = callback;
    this.nodes = new Set();
    this.observacions = 0;
    this.viu = true;
    observadors.push(this);
  }

  observe(node) { this.nodes.add(node); this.observacions++; }

  unobserve(node) { this.nodes.delete(node); }

  disconnect() { this.viu = false; this.nodes.clear(); }

  notifica(entrades) { act(() => { this.callback(entrades, this); }); }
}

beforeEach(() => {
  buidaEsborranys();
  observadors = [];
  vi.stubGlobal('IntersectionObserver', ObservadorComptat);
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

function moderacio({ potBloquejar = true } = {}) {
  return {
    disponible: true, potBloquejar, objectiuDeMissatge, objectiuDeContrapart,
    esPersonaBloquejada: () => false, demanaDenuncia: vi.fn(), demanaBloqueig: vi.fn(), desbloqueja: vi.fn().mockResolvedValue(undefined)
  };
}

function pinta(canvis = {}) {
  const props = {
    fil: GRUP, messages: missatges(N), onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn().mockResolvedValue(undefined),
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
      act(() => { vista.rerender(arbre()); });
    }
  };
}

const bombollesPintades = () => etiquetaHora.mock.calls.length;
const rendersDeConversa = () => estatObertura.mock.calls.length;
const comptadors = () => { etiquetaHora.mockClear(); estatObertura.mockClear(); };
const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const bombolla = (id) => document.querySelector(`[data-missatge="${id}"]`);

describe('cada bombolla es pinta només quan canvia', () => {
  test('obrir la conversa: un sol render de Conversa i de cada bombolla (F6)', () => {
    comptadors();
    pinta();
    expect(rendersDeConversa()).toBe(1);
    expect(bombollesPintades()).toBe(N);
  });

  test('una tecla al compositor no repinta cap bombolla (F4)', () => {
    pinta();
    comptadors();
    fireEvent.change(camp(), { target: { value: 'h' } });
    fireEvent.change(camp(), { target: { value: 'ho' } });
    expect(camp().value).toBe('ho');
    expect(bombollesPintades()).toBe(0);
  });

  test('un missatge nou només pinta la seua bombolla, i anunciar el d’altri no torna a pintar Conversa (F4, F5)', () => {
    const vista = pinta();
    /* El primer repintat després de muntar en fa un de més a React (es
       renderitza i es descarta, sense cap bombolla): fora del compte. */
    vista.repinta({});
    comptadors();
    vista.repinta({ messages: [...vista.props.messages, m(N + 1, { sender: 'me', author: undefined, usuariId: undefined })] });
    expect(bombollesPintades()).toBe(1);
    const rendersAmbElPropi = rendersDeConversa();

    comptadors();
    vista.repinta({ messages: [...vista.props.messages, m(N + 2)] });
    expect(bombollesPintades()).toBe(1);
    expect(rendersDeConversa()).toBe(rendersAmbElPropi);
    expect(screen.getByRole('status').textContent).toBe(`Pep: Missatge ${N + 2}`);
  });

  test('amb la llista que deriva XatContext, un missatge nou continua pintant només el seu (REV-ESTRES-2)', () => {
    /* Com mapejaMissatge, tots arriben «enviat»: a cada derivació,
       combinaMissatges fa un objecte nou per a cada propi ja llegit, i
       anotaMissatgesBloquejats per a cada un de qui has bloquejat. */
    const deriva = (servidor, llegitFins) => anotaMissatgesBloquejats(combinaMissatges(servidor, [], llegitFins), (id) => id === 'bloc');
    let servidor = missatges(N).map((x) => (x.seq % 10 === 1 && x.sender === 'other' ? { ...x, usuariId: 'bloc', author: 'Bloc' } : x));
    /* La bombolla d'un bloquejat no pinta l'hora: es compta pel seu avís. */
    const tComptat = vi.fn(t);
    const avisosDeBloqueig = () => tComptat.mock.calls.filter(([clau]) => clau === 'section.moderacio.bloquejat.missatge').length;
    const vista = pinta({ messages: deriva(servidor, N), t: tComptat });
    expect(avisosDeBloqueig()).toBeGreaterThan(0);
    vista.repinta({});
    comptadors();
    tComptat.mockClear();
    servidor = [...servidor, m(N + 1)];
    vista.repinta({ messages: deriva(servidor, N) });
    expect(bombollesPintades()).toBe(1);
    expect(avisosDeBloqueig()).toBe(0);

    /* Una derivació sense cap canvi (s'ha mogut un altre fil): cap bombolla. */
    comptadors();
    vista.repinta({ messages: deriva(servidor, N) });
    expect(bombollesPintades()).toBe(0);

    /* Un canvi de debò sí que es pinta: els altres llegixen el meu missatge nou. */
    servidor = [...servidor, m(N + 3)];
    vista.repinta({ messages: deriva(servidor, N) });
    expect(bombolla(`m${N + 3}`).textContent).toContain('Enviat');
    comptadors();
    vista.repinta({ messages: deriva(servidor, N + 3) });
    expect(bombollesPintades()).toBe(1);
    expect(bombolla(`m${N + 3}`).textContent).toContain('Llegit');
  });

  test('el pare torna a pintar amb les mateixes props: cap bombolla', () => {
    const vista = pinta();
    comptadors();
    vista.repinta({});
    expect(bombollesPintades()).toBe(0);
  });

  test('amb moderació, una tecla tampoc repinta res, i les accions van a la moderació d’ara', () => {
    const primera = moderacio();
    const vista = pinta({ moderacio: primera });
    comptadors();
    fireEvent.change(camp(), { target: { value: 'h' } });
    expect(bombollesPintades()).toBe(0);

    /* Una moderació nova amb les mateixes regles: cap bombolla canvia, però
       el clic va a la nova. */
    const segona = moderacio();
    comptadors();
    vista.repinta({ moderacio: segona });
    expect(bombollesPintades()).toBe(0);
    const boto = within(bombolla('m1')).getByRole('button', { name: 'Opcions del missatge' });
    act(() => { fireEvent.click(boto); });
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Denuncia el missatge' })); });
    expect(primera.demanaDenuncia).not.toHaveBeenCalled();
    expect(segona.demanaDenuncia).toHaveBeenCalledWith(expect.objectContaining({ tipus: 'missatge', id: 'm1' }), boto);

    /* Qui ja no pot bloquejar: es repinten les alienes i «Bloqueja» se'n va. */
    comptadors();
    vista.repinta({ moderacio: moderacio({ potBloquejar: false }) });
    expect(bombollesPintades()).toBe(N - Math.floor(N / 3));
    act(() => { fireEvent.click(within(bombolla('m1')).getByRole('button', { name: 'Opcions del missatge' })); });
    expect(within(bombolla('m1')).getAllByRole('menuitem').map((fila) => fila.textContent)).toEqual(['Respon', 'Copia el text', 'Denuncia el missatge']);
  });

  test('mode de selecció: entrar repinta totes; triar-ne una, només eixa; el Retall porta la triada', async () => {
    const vista = pinta();
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' })); });
    comptadors();
    act(() => { fireEvent.click(screen.getByText('Seleccionar missatges')); });
    expect(bombollesPintades()).toBe(N);

    comptadors();
    act(() => { fireEvent.click(bombolla('m2')); });
    expect(bombollesPintades()).toBe(1);
    expect(bombolla('m2').getAttribute('aria-checked')).toBe('true');
    expect(bombolla('m4').getAttribute('aria-checked')).toBe('false');

    comptadors();
    act(() => { fireEvent.click(bombolla('m4')); });
    act(() => { fireEvent.click(bombolla('m4')); });
    expect(bombollesPintades()).toBe(2);
    expect(bombolla('m4').getAttribute('aria-checked')).toBe('false');

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar al Bloc de Notes' })); });
    expect(vista.props.onEnviaAlBloc).toHaveBeenCalledWith([vista.props.messages[1]]);
    expect(bombolla('m2').getAttribute('role')).toBeNull();
  });
});

describe('un sol observador per a marcar llegit (F7)', () => {
  test('un missatge nou observa només la bombolla nova; el que és a la vista es marca fins al més alt', () => {
    const alienes = Math.ceil((N * 2) / 3);
    const vista = pinta();
    expect(observadors).toHaveLength(1);
    const [observador] = observadors;
    expect(observador.observacions).toBe(alienes);

    vista.repinta({ messages: [...vista.props.messages, m(N + 1)] });
    expect(observadors).toHaveLength(1);
    expect(observador.observacions).toBe(alienes + 1);

    observador.notifica([{ isIntersecting: true, target: bombolla('m10') }, { isIntersecting: true, target: bombolla('m11') }]);
    expect(vista.props.onMarcaVist).toHaveBeenLastCalledWith(11);
    /* Una altra entra a la vista: es marca fins a la més alta de les que s'hi veuen. */
    observador.notifica([{ isIntersecting: true, target: bombolla('m5') }]);
    expect(vista.props.onMarcaVist).toHaveBeenLastCalledWith(11);
  });

  test('una bombolla que ix de la llista es deixa d’observar', () => {
    const vista = pinta();
    const [observador] = observadors;
    const node = bombolla('m1');
    expect(observador.nodes.has(node)).toBe(true);
    vista.repinta({ messages: vista.props.messages.slice(1) });
    expect(observador.nodes.has(node)).toBe(false);
    expect(observadors).toHaveLength(1);
  });

  test('amb la pestanya amagada no es marca res; tornada visible, la notificació següent marca el que s’hi veu', () => {
    const vista = pinta();
    const [observador] = observadors;
    const visibilitat = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    observador.notifica([{ isIntersecting: true, target: bombolla('m20') }]);
    expect(vista.props.onMarcaVist).not.toHaveBeenCalled();
    visibilitat.mockReturnValue('visible');
    observador.notifica([{ isIntersecting: true, target: bombolla('m8') }]);
    expect(vista.props.onMarcaVist).toHaveBeenLastCalledWith(20);
  });
});
