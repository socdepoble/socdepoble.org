/* P0-24b (T2c, prompt 261102_1532) · El menú «⋯» del missatge («Opcions del
   missatge», fet a mà: ARB-T2B-04) és a la pila de l'Arrere d'Android
   (config/pilaEnrere.js) amb el MATEIX camí que el seu Escape: tancar el menú i
   tornar el focus al «⋯». Damunt de la resposta de Conversa (ja apuntada a
   T2b), el primer Arrere tanca el menú i la resposta continua; el segon la
   cancel·la. La bombolla sola es munta com a Bombolla.autor.test.jsx (cap
   ombra); la conversa, amb la geometria fixa de la llista de
   Conversa.enrere.test.jsx. Patró: PedraSeca/organismes/Dialeg.enrere.test.jsx. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Bombolla from './Bombolla.jsx';
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

const opcionsDe = (arrel) => within(arrel).getByRole('button', { name: 'Opcions del missatge' });
const menu = () => screen.queryByRole('menu');

/* Una bombolla aliena amb text: el «⋯» hi és, amb «Copia el text» i prou. */
const MISSATGE = { id: 'm-1', sender: 'other', author: 'Pep', usuariId: 'pep', text: 'Bon dia', creatAl: '2026-11-02T08:00:00Z', estatEnviament: 'enviat' };

function pintaBombolla() {
  return render(
    <MemoryRouter>
      <ul><Bombolla missatge={MISSATGE} locale="ca-ES" t={t} onCopia={vi.fn()} /></ul>
    </MemoryRouter>
  );
}

test('el menú «⋯» obert és a la pila; l’Arrere fa el camí de l’Escape (tanca i torna el focus al «⋯»); tancat o desmuntat, cap capa', () => {
  const { unmount } = pintaBombolla();
  const opcions = () => opcionsDe(document.body);
  expect(capesEnrereObertes()).toBe(0);
  fireEvent.click(opcions());
  expect(menu()).toBeTruthy();
  expect(opcions().getAttribute('aria-expanded')).toBe('true');
  expect(capesEnrereObertes()).toBe(1);
  // En obrir, el focus entra a la primera opció; l'Escape tanca (consumit) i el torna al «⋯».
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Copia el text' }));
  expect(fireEvent.keyDown(document.activeElement, { key: 'Escape' })).toBe(false);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
  // L'Arrere: el mateix, amb el focus dins del menú.
  fireEvent.click(opcions());
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Copia el text' }));
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
  fireEvent.click(screen.getByRole('menuitem', { name: 'Copia el text' }));
  expect(menu()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  // Desmuntar amb el menú obert el lleva de la pila.
  fireEvent.click(opcions());
  expect(capesEnrereObertes()).toBe(1);
  unmount();
  expect(capesEnrereObertes()).toBe(0);
});

/* ARB-T2C-01: les capes seguixen els menús visibles, també amb canvis remots. */
const arbreAmb = (missatge, seleccio = null) => (
  <MemoryRouter><ul><Bombolla missatge={missatge} seleccio={seleccio} locale="ca-ES" t={t} onCopia={vi.fn()} /></ul></MemoryRouter>
);
test.each([
  ['esborrat', { ...MISSATGE, esborrat: true }, null],
  ['bloquejat', { ...MISSATGE, bloquejat: true }, null],
  ['sistema', { ...MISSATGE, tipus: 'sistema' }, null],
  ['selecció', MISSATGE, { actiu: true, triat: false, onAlterna: () => {} }]
])('ARB-T2C-01 · %s lleva la capa i l’escolta invisibles; tornar no reobri el menú', (_, missatge, seleccio) => {
  const { rerender } = render(arbreAmb(MISSATGE));
  fireEvent.click(opcionsDe(document.body));
  expect(menu()).toBeTruthy(); expect(capesEnrereObertes()).toBe(1);
  rerender(arbreAmb(missatge, seleccio));
  expect(menu()).toBeNull();
  expect(screen.queryByRole('button', { name: 'Opcions del missatge' })).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(true);
  rerender(arbreAmb(MISSATGE));
  expect(menu()).toBeNull(); expect(capesEnrereObertes()).toBe(0);
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
const item = (id) => document.querySelector(`[data-missatge="${id}"]`);

test('dues capes: el menú «⋯» d’un missatge damunt de la resposta; el primer Arrere tanca el menú (focus al «⋯») i la resposta continua, el segon la cancel·la', () => {
  pintaConversa();
  // «Respon» canvia la capa del menú per la de la resposta: una sola capa.
  fireEvent.click(opcionsDe(item('1')));
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
  expect(menu()).toBeNull();
  expect(barra()).toBeTruthy();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(1);
  // El menú d'un altre missatge, damunt de la resposta.
  fireEvent.click(opcionsDe(item('2')));
  expect(menu()).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Respon' }));
  expect(capesEnrereObertes()).toBe(2);
  // El primer Arrere: el menú, amb el focus al seu «⋯», i la resposta queda.
  expect(arrere()).toBe(true);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(opcionsDe(item('2')));
  expect(barra()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  // El segon: la resposta, amb el focus al camp (el camí del seu Escape).
  expect(arrere()).toBe(true);
  expect(barra()).toBeNull();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});

/* R56 · El menú d’un missatge sense text pot dependre només d’un callback. */
test.each([
  ['resposta', { onRespon: () => {} }, {}],
  ['denúncia', { onDenuncia: () => {} }, {}],
  ['bloqueig', { onBloqueja: () => {}, nomAutor: 'Pep' }, { onBloqueja: () => {}, nomAutor: '' }]
])('R56 · retirar %s tanca la capa visible i restaurar-lo no reobri el menú', (_, abans, despres) => {
  const missatge = { ...MISSATGE, text: '' };
  const arbre = (callbacks) => <MemoryRouter><ul><Bombolla missatge={missatge} locale="ca-ES" t={t} {...callbacks}/></ul></MemoryRouter>;
  const { rerender, unmount } = render(arbre(abans));
  fireEvent.click(opcionsDe(document.body));
  expect(menu()).toBeTruthy(); expect(capesEnrereObertes()).toBe(1);
  rerender(arbre(despres));
  expect(menu()).toBeNull(); expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(true);
  rerender(arbre(abans));
  expect(menu()).toBeNull(); expect(capesEnrereObertes()).toBe(0);
  fireEvent.click(opcionsDe(document.body));
  expect(capesEnrereObertes()).toBe(1);
  unmount(); expect(capesEnrereObertes()).toBe(0);
});
