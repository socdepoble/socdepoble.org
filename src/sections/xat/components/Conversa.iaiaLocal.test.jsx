/* IDEA-56 (pla 261029_1605, Bloc F.2) · En remot amb sessió, el fil de la
   IAIA és el grup públic de /iaia, on ningú no contesta. Amb la cortesia
   (cortesiaIAIA), després d'enviar la pregunta la IAIA respon ací amb el seu
   cervell local: una bombolla seua, amb enllaços interns i l'avís que només
   la veu qui pregunta. Mai no va al port, no porta seq ni marca res com a
   llegit, i no hi ha resposta si l'enviament no ha eixit. Conversa muntada
   sola, com a Conversa.test.jsx (la geometria de la llista, fixada ací). */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { IAIA_ID, RESPOSTA_IAIA } from '../../../data/identitatsSeed.js';
import { ENCAPCALAMENT_DE_SOC_DE_POBLE, SUGGERIMENTS_RAPIDS_IAIA, oblidaIndexDeLaWiki, respostaDeLaIAIA } from '../../../data/iaiaLocal.js';
import { construeixRetall } from '../retall.js';
import { proposaCard } from '../../notes/proposaCard.js';
import { buidaEsborranys } from '../esborranys.js';
import { creaIdbFals } from '../../../utils/__fixtures__/navegadorFals.js';

const t = (_, alternativa) => alternativa;
const AVIS = 'Resposta local de la IAIA: només la veus tu i no s’ha guardat al xat compartit.';
const RESPOSTA = `${ENCAPCALAMENT_DE_SOC_DE_POBLE}\nEl Mercat és un tauler d’anuncis.\n· El Mercat — /mercat`;

/* El grup públic de /iaia, vestit amb el nom de la IAIA. */
const FIL = { id: 'f-iaia', tipus: 'grup', name: 'IAIA MarIA', potEscriure: true, llegitFinsSeq: 0, ultimSeq: 1 };
const DEL_SERVIDOR = { id: 's-1', seq: 1, sender: 'other', author: 'Pep', usuariId: 'pep', text: 'Bon dia', creatAl: new Date().toISOString(), estatEnviament: 'enviat' };

const geo = { scrollHeight: 1000, clientHeight: 400 };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');

let observadors = [];
class ObservadorFals {
  constructor(callback) {
    this.callback = callback;
    this.nodes = [];
    observadors.push(this);
  }

  observe(node) { this.nodes.push(node); }

  unobserve(node) { this.nodes = this.nodes.filter((n) => n !== node); }

  disconnect() { this.nodes = []; }
}

beforeEach(() => {
  buidaEsborranys();
  observadors = [];
  geo.scrollHeight = 1000;
  geo.clientHeight = 400;
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return esLlista(this) ? geo.scrollHeight : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return esLlista(this) ? geo.clientHeight : 0; } });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
  oblidaIndexDeLaWiki();
});

function pinta(canvis = {}) {
  const props = {
    fil: FIL, messages: [], onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
    onCopia: vi.fn(), hiHaMes: false, carregantMes: false, onCarregaMes: vi.fn(), onReintenta: vi.fn(), onDescarta: vi.fn(),
    onMarcaVist: vi.fn(), locale: 'ca-ES', t, cortesiaIAIA: true, ...canvis
  };
  const vista = render(
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa {...props} />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
  return { ...vista, props };
}

const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const llista = () => document.querySelector('.sdp-xat-missatges');
const locals = () => [...document.querySelectorAll('[data-missatge^="iaia-local:"]')];
const buida = () => act(async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); });
async function pregunta(text) {
  fireEvent.change(camp(), { target: { value: text } });
  await act(async () => { fireEvent.keyDown(camp(), { key: 'Enter' }); });
  await buida();
}

test('la pregunta va una sola vegada al port; la resposta, només ací: la bombolla de la IAIA, l’enllaç intern i l’avís', async () => {
  const respostaLocalIAIA = vi.fn(async () => RESPOSTA);
  const { props } = pinta({ respostaLocalIAIA });
  await pregunta('Què és el Mercat?');
  expect(props.onSendMessage).toHaveBeenCalledTimes(1);
  expect(props.onSendMessage).toHaveBeenCalledWith(FIL, 'Què és el Mercat?');
  expect(respostaLocalIAIA).toHaveBeenCalledWith('Què és el Mercat?');
  const [bombolla] = locals();
  expect(within(bombolla).getByText('IAIA MarIA · IA')).toBeTruthy();
  const enllac = within(bombolla).getByRole('link', { name: '/mercat' });
  expect([enllac.getAttribute('href'), enllac.className, enllac.hasAttribute('target')]).toEqual(['/mercat', 'sdp-xat-enllac', false]);
  expect(bombolla.querySelector('.sdp-xat-bombolla__text').textContent).toBe(RESPOSTA);
  expect(bombolla.nextElementSibling.textContent).toBe(AVIS);
  expect(bombolla.nextElementSibling.className).toBe('sdp-xat-conversa-buida');
  /* La regió en viu l'anuncia, com un missatge nou d'una altra persona. */
  expect(document.querySelector('.sdp-nomes-lector[role="status"]').textContent).toContain('IAIA MarIA');
});

test('sense la cortesia (qualsevol altre fil o mode), el cervell local no es crida mai', async () => {
  const respostaLocalIAIA = vi.fn(async () => RESPOSTA);
  const { props } = pinta({ cortesiaIAIA: false, respostaLocalIAIA });
  await pregunta('Què és el Mercat?');
  expect(props.onSendMessage).toHaveBeenCalledTimes(1);
  expect(respostaLocalIAIA).not.toHaveBeenCalled();
  expect(locals()).toEqual([]);
  expect(screen.queryByText(AVIS)).toBeNull();
});

test('si la persona no accepta les normes (AbortError) o l’enviament llança, cap resposta', async () => {
  for (const error of [new DOMException('Cancel·lat', 'AbortError'), new Error('xarxa')]) {
    const respostaLocalIAIA = vi.fn(async () => RESPOSTA);
    pinta({ respostaLocalIAIA, onSendMessage: vi.fn().mockRejectedValue(error) });
    await pregunta('Què és el Mercat?');
    expect([error.name, respostaLocalIAIA.mock.calls.length, locals().length]).toEqual([error.name, 0, 0]);
    expect(camp().value).toBe('Què és el Mercat?');
    cleanup();
  }
});

test('si no troba res (o falla), la seua frase de sempre', async () => {
  pinta({ respostaLocalIAIA: vi.fn(async () => null) });
  await pregunta('asdfgh');
  expect(locals()[0].querySelector('.sdp-xat-bombolla__text').textContent).toBe(RESPOSTA_IAIA);
  cleanup();
  pinta({ respostaLocalIAIA: () => { throw new Error('x'); } });
  await pregunta('asdfgh');
  expect(locals()[0].querySelector('.sdp-xat-bombolla__text').textContent).toBe(RESPOSTA_IAIA);
});

test('sense seq: cap data-vist, i la lectura només marca els missatges del servidor', async () => {
  vi.stubGlobal('IntersectionObserver', ObservadorFals);
  const { props } = pinta({ messages: [DEL_SERVIDOR], respostaLocalIAIA: vi.fn(async () => RESPOSTA) });
  await pregunta('Què és el Mercat?');
  const [bombolla] = locals();
  expect(bombolla.hasAttribute('data-vist')).toBe(false);
  const observats = observadors.flatMap((observador) => observador.nodes);
  expect(observats.map((node) => node.getAttribute('data-missatge'))).toEqual(['s-1']);
  expect(observats).not.toContain(bombolla);
  act(() => {
    for (const observador of observadors) {
      observador.callback(observador.nodes.map((target) => ({ target, isIntersecting: true })), observador);
    }
  });
  expect(props.onMarcaVist).toHaveBeenCalledWith(1);
  expect(props.onMarcaVist.mock.calls.flat().every((seq) => seq === 1)).toBe(true);
});

test('les respostes, en l’ordre de les preguntes encara que la primera tarde més; com a molt 20 a la vista', async () => {
  let resolPrimera;
  const primera = new Promise((resol) => { resolPrimera = resol; });
  const respostaLocalIAIA = vi.fn((text) => (text === 'Primera' ? primera : Promise.resolve(`R ${text}`)));
  pinta({ respostaLocalIAIA });
  await pregunta('Primera');
  await pregunta('Segona');
  expect(locals()).toEqual([]);
  await act(async () => { resolPrimera('R Primera'); });
  await buida();
  expect(locals().map((bombolla) => bombolla.querySelector('.sdp-xat-bombolla__text').textContent)).toEqual(['R Primera', 'R Segona']);
  for (let i = 0; i < 20; i += 1) await pregunta(`P${i}`);
  const textos = locals().map((bombolla) => bombolla.querySelector('.sdp-xat-bombolla__text').textContent);
  expect(textos).toHaveLength(20);
  expect([textos[0], textos.at(-1)]).toEqual(['R P0', 'R P19']);
  expect(new Set(locals().map((bombolla) => bombolla.getAttribute('data-missatge'))).size).toBe(20);
});

test('si eres a baix, la resposta que arriba pel final no queda tapada', async () => {
  pinta({ respostaLocalIAIA: vi.fn(async () => { geo.scrollHeight = 1500; return RESPOSTA; }) });
  await pregunta('Què és el Mercat?');
  expect(llista().scrollTop).toBe(1500);
});

test('desmuntar amb una resposta pendent: res no es pinta ni avisa', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  let resol;
  const pendent = new Promise((r) => { resol = r; });
  const { unmount } = pinta({ respostaLocalIAIA: vi.fn(() => pendent) });
  await pregunta('Què és el Mercat?');
  unmount();
  await act(async () => { resol(RESPOSTA); });
  await buida();
  expect(error).not.toHaveBeenCalled();
});

test('amb el cervell de veres: «Què és el Mercat?» respon l’Atles sense cap càrrega', async () => {
  const carrega = vi.fn(async () => ({ items: [] }));
  pinta({ respostaLocalIAIA: (text) => respostaDeLaIAIA(text, { carrega }) });
  await pregunta('Què és el Mercat?');
  const text = locals()[0].querySelector('.sdp-xat-bombolla__text').textContent;
  expect(text.startsWith(ENCAPCALAMENT_DE_SOC_DE_POBLE)).toBe(true);
  expect(text).toContain('· El Mercat — /mercat');
  expect(carrega).not.toHaveBeenCalled();
  expect(locals()[0].querySelector('.sdp-xat-bombolla__autor')?.getAttribute('href')).toBe('/iaia');
  expect(IAIA_ID).toBeTruthy();
});

/* Gauntlet 261029 (cicle 1, iaia-local-respostes-desordenades) · Cada
   resposta local va just darrere de la SEUA pregunta, no al final de la
   llista: amb dues preguntes l'ordre era Q1, Q2, Pep, A1, A2, i la resposta
   semblava la de l'últim que algú havia escrit al grup públic de /iaia. */
const repinta = (vista, messages) => vista.rerender(
  <MemoryRouter>
    <AppGridContext.Provider value={{ mida: 'ample' }}>
      <Conversa {...vista.props} messages={messages} />
    </AppGridContext.Provider>
  </MemoryRouter>
);
const ordre = () => [...llista().querySelectorAll('[data-missatge]')].map((li) => li.getAttribute('data-missatge'));
const ARA = new Date().toISOString();
const propi = (id, seq, text, extra = {}) => ({ id, seq, sender: 'me', author: 'Jo', text, creatAl: ARA, estatEnviament: 'enviat', ...extra });
const dePep = (id, seq) => ({ id, seq, sender: 'other', author: 'Pep', usuariId: 'pep', text: 'Bona vesprada', creatAl: ARA, estatEnviament: 'enviat' });

test('dues preguntes i un veí: Q1, A1, Q2, A2, Pep; la pregunta de després de la IAIA torna a portar la cua', async () => {
  const vista = pinta({ respostaLocalIAIA: vi.fn(async (text) => `R ${text}`) });
  await pregunta('Què és el Mercat?');
  const q1 = propi('s-q1', 2, 'Què és el Mercat?');
  repinta(vista, [q1]);
  await pregunta('Què és el Mur?');
  repinta(vista, [q1, propi('s-q2', 3, 'Què és el Mur?'), dePep('s-pep', 4)]);
  await buida();
  expect(ordre()).toEqual(['s-q1', 'iaia-local:1', 's-q2', 'iaia-local:2', 's-pep']);
  expect(locals().map((bombolla) => bombolla.nextElementSibling.textContent)).toEqual([AVIS, AVIS]);
  expect(llista().querySelector('[data-missatge="s-q2"]').classList.contains('sdp-xat-item--segueix')).toBe(false);
});

test('amb l’id que torna l’enviament (XatContext): darrere del pendent i del seu eco, mai d’un missatge igual d’abans ni d’un altre dispositiu', async () => {
  const abans = propi('s-0', 1, 'Hola Mercat');
  /* El mateix text, escrit des d'un altre dispositiu mentre esta pregunta anava. */
  const altre = propi('s-altre', 2, 'Hola Mercat');
  const vista = pinta({ messages: [abans], onSendMessage: vi.fn().mockResolvedValue([{ id: 'p-1' }]), respostaLocalIAIA: vi.fn(async () => RESPOSTA) });
  await pregunta('Hola Mercat');
  /* El pendent encara no és a la llista: la resposta espera al final. */
  expect(ordre()).toEqual(['s-0', 'iaia-local:1']);
  repinta(vista, [abans, altre, propi('p-1', null, 'Hola Mercat', { estatEnviament: 'pendent' }), dePep('s-pep', 4)]);
  expect(ordre()).toEqual(['s-0', 's-altre', 'p-1', 'iaia-local:1', 's-pep']);
  repinta(vista, [abans, altre, propi('p-1', 3, 'Hola Mercat'), dePep('s-pep', 4)]);
  expect(ordre()).toEqual(['s-0', 's-altre', 'p-1', 'iaia-local:1', 's-pep']);
});

test('sense id, pel text: el missatge propi nou (i cada pregunta igual, el seu), mai un d’igual que ja hi era', async () => {
  const abans = propi('s-0', 1, 'Hola Mercat');
  const vista = pinta({ messages: [abans], respostaLocalIAIA: vi.fn(async () => RESPOSTA) });
  await pregunta('Hola Mercat');
  await pregunta('Hola Mercat');
  repinta(vista, [abans, propi('s-1', 2, 'Hola Mercat'), propi('s-2', 3, 'Hola Mercat'), dePep('s-pep', 4)]);
  expect(ordre()).toEqual(['s-0', 's-1', 'iaia-local:1', 's-2', 'iaia-local:2', 's-pep']);
});

test('una confirmació buida del port no fabrica una resposta de la IAIA al grup públic', async () => {
  const respostaLocalIAIA = vi.fn(async () => RESPOSTA);
  pinta({ respostaLocalIAIA, onSendMessage: vi.fn().mockResolvedValue([]) });
  await pregunta('Què és el Mercat?');
  expect(respostaLocalIAIA).not.toHaveBeenCalled();
  expect(locals()).toEqual([]);
});

test('suggeriments ràpids clicables, botons directes a cada secció i enviament d’esborrany al Bloc de Notes compatible amb Proposa Card (IDEA-28)', async () => {
  const carrega = vi.fn(async () => ({ items: [] }));
  const { props } = pinta({ respostaLocalIAIA: (text) => respostaDeLaIAIA(text, { carrega }) });
  const grupSuggeriments = screen.getByRole('group', { name: 'Suggeriments ràpids d’ajuda rural' });
  const botonsSug = within(grupSuggeriments).getAllByRole('button');
  expect(botonsSug.map((b) => b.textContent)).toEqual(SUGGERIMENTS_RAPIDS_IAIA.map((s) => s.etiqueta));

  /* Clic al suggeriment de redactar un bàndol o avís per al Mur */
  await act(async () => { fireEvent.click(botonsSug[1]); });
  await buida();

  expect(props.onSendMessage).toHaveBeenCalledWith(FIL, SUGGERIMENTS_RAPIDS_IAIA[1].pregunta);
  expect(screen.getByRole('link', { name: 'Obri El Mur' }).getAttribute('href')).toBe('/mur');

  const botoEsborrany = screen.getByRole('button', { name: 'Envia l’esborrany al Bloc de Notes' });
  await act(async () => { fireEvent.click(botoEsborrany); });
  expect(props.onEnviaAlBloc).toHaveBeenCalledTimes(1);
  const [missatgesEnviats] = props.onEnviaAlBloc.mock.calls[0];
  const retall = construeixRetall({ fil: FIL, missatges: missatgesEnviats, locale: 'ca-ES', t });
  expect(retall.title).toBe('El Mur');
  expect(retall.content).not.toContain('<blockquote>');
  const proposta = proposaCard(retall);
  expect(proposta.motiu).toBe('proposta');
  expect(proposta.camps.subtitle.length).toBeGreaterThan(10);
  expect(proposta.camps.lead.length).toBeGreaterThan(10);
});

/* R21 (carril f1) · Política 2.5 en vigor, §14: «la resposta de la IAIA només
   la veus tu i no es guarda». Cap base IndexedDB rep la resposta ni la
   pregunta, ni l'emmagatzematge del navegador, i en tornar a muntar el fil
   (canviar de fil o recarregar) la resposta ja no hi és. */
const contingutDelDisc = (fals) => JSON.stringify([...fals.bases].map(([nom, base]) => [
  nom, [...base.stores].map(([store, magatzem]) => [store, [...magatzem.files.values()]])
]));

test('R21 · la resposta de cortesia no es desa al dispositiu: ni IndexedDB ni localStorage, i en tornar al fil ja no hi és', async () => {
  const fals = creaIdbFals();
  const obri = vi.spyOn(fals.idb, 'open');
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const PREGUNTA = 'Com publique al Mercat?';
  const PRIVADA = 'Resposta privada de prova per al Mercat';
  const cervell = vi.fn(async () => PRIVADA);
  /* `ambitCortesia` era el prop amb què el kit R21.3 desava les respostes a
     IndexedDB; Conversa ja no el té i l'ha d'ignorar. */
  const AMBIT = JSON.stringify(['remot', 'usuari-1', 'usuari-1']);
  const primeraVista = pinta({ ambitCortesia: AMBIT, onSendMessage: vi.fn().mockResolvedValue([{ id: 'msg-q1' }]), respostaLocalIAIA: cervell });
  await pregunta(PREGUNTA);
  expect(locals()).toHaveLength(1);
  expect(locals()[0].querySelector('.sdp-xat-bombolla__text').textContent).toBe(PRIVADA);
  /* Les macrotasques de creaIdbFals (setTimeout 0) tindrien temps d'escriure. */
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(obri.mock.calls.map(([nom]) => nom)).not.toContain('xat-iaia-titols');
  expect(contingutDelDisc(fals)).not.toContain(PRIVADA);
  expect(contingutDelDisc(fals)).not.toContain(PREGUNTA);
  expect(JSON.stringify({ ...localStorage })).not.toContain(PRIVADA);
  expect(JSON.stringify({ ...sessionStorage })).not.toContain(PRIVADA);
  primeraVista.unmount();

  /* Tornar al fil: el servidor porta la pregunta publicada, la resposta local no torna. */
  pinta({ ambitCortesia: AMBIT, messages: [propi('msg-q1', 2, PREGUNTA), dePep('msg-pep', 3)], respostaLocalIAIA: cervell });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(ordre()).toEqual(['msg-q1', 'msg-pep']);
  expect(locals()).toEqual([]);
  expect(screen.queryByText(PRIVADA)).toBeNull();
  expect(cervell).toHaveBeenCalledTimes(1);
});
