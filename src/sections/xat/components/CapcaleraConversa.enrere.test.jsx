/* P0-24b · ARB-T2C-02: l'Escape i l'Arrere tanquen el menú visible
   i retornen el focus al botó obridor, també després d'entrar amb teclat.
   Damunt de resposta, només tanquen una capa. Una capçalera substituïda
   per selecció no conserva cap capa ni menú obert. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import CapcaleraConversa from './CapcaleraConversa.jsx';
import Conversa from './Conversa.jsx';
import { buidaEsborranys } from '../esborranys.js';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../../config/pilaEnrere.js';

const t = (_, alternativa) => alternativa;

/* Geometria fixa de la llista de la conversa (Conversa.enrere.test.jsx). */
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');
beforeEach(() => {
  buidaEsborranys();
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return esLlista(this) ? 1000 : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return esLlista(this) ? 400 : 0; } });
});
afterEach(() => {
  cleanup();
  _reiniciaPilaEnrere();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
});

/* Cada Arrere, un segon més tard: fora de la finestra d'absorció. */
let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

/* Un directe amb una persona: la capçalera enllaça al perfil i porta el «⋯». */
const FIL_DIRECTE = { id: 'd-pepa', tipus: 'directe', name: 'Pepa', altres: [{ id: 'P', tipus: 'persona', nom: 'Pepa' }], altresNoms: ['Pepa'] };

function pintaCapcalera() {
  return render(
    <MemoryRouter>
      <CapcaleraConversa fil={FIL_DIRECTE} onTorna={vi.fn()} onSeleccionar={vi.fn()} t={t} />
    </MemoryRouter>
  );
}

const opcions = () => screen.getByRole('button', { name: 'Opcions de la conversa' });
const menu = () => screen.queryByRole('menu');

test('el menú «⋯» obert és a la pila; l’Arrere fa el camí de l’Escape (tanca, i el focus es queda al «⋯»); tancat o desmuntat, cap capa', () => {
  const { unmount } = pintaCapcalera();
  expect(capesEnrereObertes()).toBe(0);
  /* Un clic de veritat deixa el focus al botó; fireEvent.click no el mou. */
  opcions().focus();
  fireEvent.click(opcions());
  expect(menu()).toBeTruthy();
  expect(opcions().getAttribute('aria-expanded')).toBe('true');
  expect(capesEnrereObertes()).toBe(1);
  // L'Escape tanca, queda consumit i retorna el focus al botó.
  expect(fireEvent.keyDown(opcions(), { key: 'Escape' })).toBe(false);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
  // L'Arrere: el mateix.
  fireEvent.click(opcions());
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(menu()).toBeNull();
  expect(opcions().getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  // Triar una entrada també el lleva de la pila.
  fireEvent.click(opcions());
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar missatges' }));
  expect(menu()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  // Desmuntar amb el menú obert el lleva de la pila.
  fireEvent.click(opcions());
  expect(capesEnrereObertes()).toBe(1);
  unmount();
  expect(capesEnrereObertes()).toBe(0);
});

/* ARB-T2C-02: Escape i Arrere retornen el focus al botó obridor. */
test('ARB-T2C-02 · amb el focus dins del menú de la capçalera, l’Escape i l’Arrere tanquen i el focus torna al botó', () => {
  pintaCapcalera();
  opcions().focus();
  fireEvent.click(opcions());
  const entrada = () => screen.getByRole('menuitem', { name: 'Seleccionar missatges' });
  entrada().focus();
  expect(document.activeElement).toBe(entrada());
  expect(capesEnrereObertes()).toBe(1);
  expect(fireEvent.keyDown(entrada(), { key: 'Escape' })).toBe(false);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
  // L'Arrere també torna el focus al botó.
  fireEvent.click(opcions());
  entrada().focus();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
});

/* La conversa de veres (Conversa.enrere.test.jsx): un grup on s'hi pot escriure. */
const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const m = (id, seq, sender) => ({
  id, seq, sender, text: `Text ${id}`, creatAl: hui(seq), estatEnviament: 'enviat', ...(sender === 'me' ? {} : { author: 'Pep', usuariId: 'pep' })
});
const FIL = { id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 };

function pintaConversa() {
  return render(
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa
          fil={FIL} messages={[m('1', 1, 'other'), m('2', 2, 'me')]} onSendMessage={vi.fn().mockResolvedValue(undefined)} onBack={vi.fn()}
          onEnviaAlBloc={vi.fn()} onCopia={vi.fn()} hiHaMes={false} carregantMes={false} onCarregaMes={vi.fn()} onReintenta={vi.fn()}
          onDescarta={vi.fn()} onMarcaVist={vi.fn()} locale="ca-ES" t={t}
        />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
}

const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const barra = () => screen.queryByRole('group', { name: 'Resposta a Pep' });
/* «Respon» al menú «⋯» de la bombolla: obri la barra amb el focus al camp. */
function respon(id) {
  fireEvent.click(within(document.querySelector(`[data-missatge="${id}"]`)).getByRole('button', { name: 'Opcions del missatge' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
}

test('dues capes: el menú «⋯» de la capçalera damunt de la resposta; el primer Arrere tanca el menú i la resposta continua, el segon la cancel·la', () => {
  pintaConversa();
  respon('1');
  expect(barra()).toBeTruthy();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(1);
  opcions().focus();
  fireEvent.click(opcions());
  expect(menu()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(2);
  // El primer Arrere: el menú, i la resposta queda.
  expect(arrere()).toBe(true);
  expect(menu()).toBeNull();
  expect(opcions().getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(opcions());
  expect(barra()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  // El segon: la resposta, amb el focus al camp (el camí del seu Escape).
  expect(arrere()).toBe(true);
  expect(barra()).toBeNull();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});

test('una capçalera substituïda per selecció no deixa capa ni reobri el menú en eixir', () => {
  const arbre = (seleccio = null) => <MemoryRouter><CapcaleraConversa fil={FIL_DIRECTE} seleccio={seleccio} onTorna={() => {}} onSeleccionar={() => {}} t={t}/></MemoryRouter>;
  const {rerender}=render(arbre());
  fireEvent.click(opcions()); expect(capesEnrereObertes()).toBe(1);
  rerender(arbre({quants:1,onEixir:()=>{}}));
  expect(menu()).toBeNull(); expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false); expect(fireEvent.keyDown(document.body,{key:'Escape'})).toBe(true);
  rerender(arbre()); expect(menu()).toBeNull(); expect(capesEnrereObertes()).toBe(0);
});

test('tancar amb clic fora conserva el focus del destí extern', () => {
  render(<MemoryRouter><CapcaleraConversa fil={FIL_DIRECTE} onTorna={()=>{}} onSeleccionar={()=>{}} t={t}/><button>Destí extern</button></MemoryRouter>);
  fireEvent.click(opcions());
  const fora=screen.getByRole('button',{name:'Destí extern'});fora.focus();fireEvent.pointerDown(fora);
  expect(menu()).toBeNull(); expect(document.activeElement).toBe(fora); expect(capesEnrereObertes()).toBe(0);
});
