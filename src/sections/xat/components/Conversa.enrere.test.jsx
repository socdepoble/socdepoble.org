/* P0-24b (T2b, prompt 261102_1532) · La resposta («Respon» → BarraResposta) és
   a la pila de l'Arrere d'Android (config/pilaEnrere.js) amb el MATEIX camí que
   l'Escape del camp (cancelaResposta: la barra se'n va i el focus torna al
   camp; B3-BACK §6). Amb el calaix d'emoticones damunt (ja apuntat), el primer
   Arrere tanca el calaix i el segon cancel·la la resposta, com els dos Escapes
   de Compositor.emoticones.test.jsx. La geometria fixa de la llista és la de
   Conversa.test.jsx. Patró: PedraSeca/organismes/Dialeg.enrere.test.jsx.
   D-T2b-1 (R16-G) · En estret, l'Arrere cancel·la la resposta i deixa el focus
   a la llista: no el torna al camp, que reobriria el teclat del mòbil. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { buidaEsborranys } from '../esborranys.js';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../../config/pilaEnrere.js';

/* El catàleg de veres pesa 292 kB: ací, una família sintètica. */
vi.mock('../../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({ GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }] })
}));

const t = (_, alternativa) => alternativa;
const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const m = (id, seq, sender) => ({
  id, seq, sender, text: `Text ${id}`, creatAl: hui(seq), estatEnviament: 'enviat', ...(sender === 'me' ? {} : { author: 'Pep', usuariId: 'pep' })
});
/* Un grup on s'hi pot escriure i sense res per llegir. */
const FIL = { id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 };

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

function pinta(mida = 'ample') {
  return render(
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida }}>
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
const calaix = () => screen.queryByRole('dialog', { name: 'Emoticones' });
/* «Respon» al menú «⋯» de la bombolla: obri la barra amb el focus al camp. */
function respon(id) {
  fireEvent.click(within(document.querySelector(`[data-missatge="${id}"]`)).getByRole('button', { name: 'Opcions del missatge' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
}

test('la resposta és a la pila; l’Arrere fa el camí de l’Escape del camp (cancel·la i el focus torna al camp); sense resposta o desmuntada, cap capa', () => {
  const { unmount } = pinta();
  expect(capesEnrereObertes()).toBe(0);
  respon('1');
  expect(barra()).toBeTruthy();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(1);
  // L'Escape del camp: cancel·la, consumit.
  expect(fireEvent.keyDown(camp(), { key: 'Escape' })).toBe(false);
  expect(barra()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  // L'Arrere: el mateix, també amb el focus fora del camp (a la ✕).
  respon('1');
  expect(capesEnrereObertes()).toBe(1);
  screen.getByRole('button', { name: 'Cancel·la la resposta' }).focus();
  expect(arrere()).toBe(true);
  expect(barra()).toBeNull();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  // La ✕ també la lleva de la pila.
  respon('1');
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la la resposta' }));
  expect(barra()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  respon('1');
  expect(capesEnrereObertes()).toBe(1);
  unmount();
  expect(capesEnrereObertes()).toBe(0);
});

test('amb resposta i el calaix d’emoticones damunt, el primer Arrere tanca el calaix (focus al camp, la resposta queda) i el segon cancel·la la resposta', async () => {
  pinta();
  respon('1');
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Emoticones' }), { detail: 1 });
  await screen.findByRole('tab', { name: 'Cares' });
  expect(calaix()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(2);
  expect(arrere()).toBe(true);
  expect(calaix()).toBeNull();
  expect(barra()).toBeTruthy();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(barra()).toBeNull();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});

test('D-T2b-1: en estret, l’Arrere cancel·la la resposta i el focus va a la llista, no al camp; l’Escape del camp continua al camp', () => {
  pinta('estret');
  const llista = document.querySelector('.sdp-xat-missatges');
  respon('1');
  expect(barra()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  // Amb el focus al camp (el teclat obert), l'Arrere el trau del camp.
  expect(document.activeElement).toBe(camp());
  expect(arrere()).toBe(true);
  expect(barra()).toBeNull();
  expect(document.activeElement).toBe(llista);
  expect(document.activeElement).not.toBe(camp());
  expect(capesEnrereObertes()).toBe(0);
  // Amb el focus a la ✕, tampoc no va al camp.
  respon('1');
  screen.getByRole('button', { name: 'Cancel·la la resposta' }).focus();
  expect(arrere()).toBe(true);
  expect(barra()).toBeNull();
  expect(document.activeElement).toBe(llista);
  // L'Escape del camp és un gest de teclat: cancel·la i el focus es queda al camp.
  respon('1');
  expect(fireEvent.keyDown(camp(), { key: 'Escape' })).toBe(false);
  expect(barra()).toBeNull();
  expect(document.activeElement).toBe(camp());
  expect(capesEnrereObertes()).toBe(0);
});
