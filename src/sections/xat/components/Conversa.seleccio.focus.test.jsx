/* xat-ux-a11y-02 (T7a, 261104) · «Seleccionar missatges» (el retall cap a
   Notes) amb teclat i amb l'Arrere d'Android, com la selecció de xats de la
   llista (XatSection, T68 i P1-36):
     · en entrar-hi des del menú «⋯», el focus va a la creu «Eixir de la
       selecció» (abans queia a <body>);
     · la selecció és a la pila de l'Arrere amb el camí de la creu, i
       l'Escape dins de la conversa també n'ix, consumit (un sol Escape tanca
       UNA cosa: la selecció de xats l'escolta a window);
     · en eixir-ne, el focus perdut torna al «⋯» i no es queda a la fletxa
       «Torna a la llista» (React reutilitzava el botó de la creu);
     · un Escape d'un diàleg obert és del diàleg. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { buidaEsborranys } from '../esborranys.js';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../../config/pilaEnrere.js';

const t = (_, alternativa) => alternativa;

/* Geometria fixa de la llista (Conversa.enrere.test.jsx). */
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

let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const m = (id, seq, sender) => ({
  id, seq, sender, text: `Text ${id}`, creatAl: hui(seq), estatEnviament: 'enviat', ...(sender === 'me' ? {} : { author: 'Pep', usuariId: 'pep' })
});
const FIL = { id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 };

function pinta(props = {}) {
  return render(
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa
          fil={FIL} messages={[m('1', 1, 'other'), m('2', 2, 'me')]} onSendMessage={vi.fn().mockResolvedValue(undefined)} onBack={vi.fn()}
          onEnviaAlBloc={vi.fn()} onCopia={vi.fn()} hiHaMes={false} carregantMes={false} onCarregaMes={vi.fn()} onReintenta={vi.fn()}
          onDescarta={vi.fn()} onMarcaVist={vi.fn()} locale="ca-ES" t={t} {...props}
        />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
}

const opcions = () => screen.getByRole('button', { name: 'Opcions de la conversa' });
const creu = () => screen.queryByRole('button', { name: 'Eixir de la selecció' });
const enSeleccio = () => document.querySelector('.sdp-xat-capcalera--seleccio') !== null;

/* Com amb el teclat: el focus és a l'opció quan s'activa (Enter). */
function entraAmbTeclat() {
  opcions().focus();
  fireEvent.click(opcions());
  const entrada = screen.getByRole('menuitem', { name: 'Seleccionar missatges' });
  entrada.focus();
  fireEvent.click(entrada);
}

test('entrar des del menú porta el focus a «Eixir de la selecció» i apunta la selecció a la pila de l’Arrere', () => {
  pinta();
  entraAmbTeclat();
  expect(enSeleccio()).toBe(true);
  expect(document.activeElement).toBe(creu());
  expect(capesEnrereObertes()).toBe(1);
});

test('l’Escape dins de la conversa ix de la selecció, queda consumit i el focus torna al «⋯»', () => {
  pinta();
  entraAmbTeclat();
  expect(fireEvent.keyDown(document.activeElement, { key: 'Escape' })).toBe(false);
  expect(enSeleccio()).toBe(false);
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
  /* Fora de la selecció, l'Escape de la conversa no és seu. */
  expect(fireEvent.keyDown(opcions(), { key: 'Escape' })).toBe(true);
});

test('l’Arrere ix de la selecció (el camí de la creu); el següent ja no és de la conversa', () => {
  pinta();
  entraAmbTeclat();
  expect(arrere()).toBe(true);
  expect(enSeleccio()).toBe(false);
  expect(document.activeElement).toBe(opcions());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});

test('la creu enfocada deixa el focus al «⋯», no a la fletxa «Torna a la llista»', () => {
  pinta();
  entraAmbTeclat();
  fireEvent.click(creu());
  expect(enSeleccio()).toBe(false);
  expect(document.activeElement).toBe(opcions());
  expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Torna a la llista' }));
});

test('amb una casella enfocada, eixir no li roba el focus', () => {
  pinta();
  entraAmbTeclat();
  const casella = screen.getAllByRole('checkbox')[0];
  casella.focus();
  expect(fireEvent.keyDown(casella, { key: 'Escape' })).toBe(false);
  expect(enSeleccio()).toBe(false);
  expect(document.activeElement).toBe(document.querySelector('[data-missatge="1"]'));
});

test('damunt de la resposta, el primer Arrere ix de la selecció i el segon cancel·la la resposta', () => {
  pinta();
  fireEvent.click(within(document.querySelector('[data-missatge="1"]')).getByRole('button', { name: 'Opcions del missatge' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
  expect(capesEnrereObertes()).toBe(1);
  entraAmbTeclat();
  expect(capesEnrereObertes()).toBe(2);
  expect(arrere()).toBe(true);
  expect(enSeleccio()).toBe(false);
  expect(screen.getByRole('group', { name: 'Resposta a Pep' })).toBeTruthy();
  expect(arrere()).toBe(true);
  expect(screen.queryByRole('group', { name: 'Resposta a Pep' })).toBeNull();
  expect(arrere()).toBe(false);
});

test('un Escape dins d’un diàleg obert és del diàleg: la selecció continua', () => {
  pinta({ peu: <dialog open><button type="button">Dins del diàleg</button></dialog> });
  entraAmbTeclat();
  const dins = screen.getByRole('button', { name: 'Dins del diàleg' });
  expect(fireEvent.keyDown(dins, { key: 'Escape' })).toBe(true);
  expect(enSeleccio()).toBe(true);
});

test('un Escape que ja ha consumit un altre no ix de la selecció', () => {
  pinta();
  entraAmbTeclat();
  const consumit = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  consumit.preventDefault();
  act(() => { creu().dispatchEvent(consumit); });
  expect(enSeleccio()).toBe(true);
});
