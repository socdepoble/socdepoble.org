/* Fase D (261020, tasca 2; pla 261020_1300) · Conversa muntada sola, amb
   missatges que XatContext ja ha anotat com de qui has bloquejat
   (bloquejat: true, sense text): ni compten a «N missatges nous» del botó
   «Baixa al final» ni s'anuncien a la regió en viu (crítica 261020,
   troballa 15). La geometria de la llista la fixem com Conversa.test.jsx:
   jsdom no fa maquetació. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { buidaEsborranys } from '../esborranys.js';

const t = (_, alternativa) => alternativa;
const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const m = (id, seq, extra = {}) => ({
  id, seq, sender: 'other', author: 'Pep', usuariId: 'pep', text: `Text ${id}`, creatAl: hui(seq), estatEnviament: 'enviat', ...extra
});
const amagat = (id, seq) => m(id, seq, { text: '', metadades: {}, bloquejat: true });
const FIL = { id: 'f-1', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 };

const geo = { scrollHeight: 1000, clientHeight: 400 };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');
beforeEach(() => {
  buidaEsborranys();
  geo.scrollHeight = 1000;
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
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
});

function pinta(messages) {
  const props = {
    fil: FIL, messages, onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
    onCopia: vi.fn(), hiHaMes: false, carregantMes: false, onCarregaMes: vi.fn(), onReintenta: vi.fn(), onDescarta: vi.fn(),
    onMarcaVist: vi.fn(), locale: 'ca-ES', t
  };
  const arbre = () => (
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa {...props} />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
  const vista = render(arbre());
  return { repinta(nous) { props.messages = nous; vista.rerender(arbre()); } };
}
const llista = () => document.querySelector('.sdp-xat-missatges');
const botoBaixar = () => screen.queryByRole('button', { name: 'Baixa al final' });
const anunci = () => document.querySelector('.sdp-nomes-lector[role="status"]').textContent;

test('lluny del fons, un missatge nou de qui has bloquejat no compta a «Baixa al final»; el d’una altra persona, sí', () => {
  const missatges = [m('1', 1), m('2', 2)];
  const { repinta } = pinta(missatges);
  llista().scrollTop = 200;
  fireEvent.scroll(llista());
  geo.scrollHeight = 1100;
  repinta([...missatges, amagat('3', 3)]);
  expect(botoBaixar()).not.toBeNull();
  expect(botoBaixar().hasAttribute('aria-describedby')).toBe(false);
  expect(botoBaixar().querySelector('.sdp-xat-baixa__pastilla')).toBeNull();
  repinta([...missatges, amagat('3', 3), m('4', 4)]);
  expect(document.getElementById(botoBaixar().getAttribute('aria-describedby')).textContent).toBe('1 missatge nou');
});

test('al fons, el missatge nou de qui has bloquejat no s’anuncia; el d’una altra persona, sí', () => {
  const missatges = [m('1', 1)];
  const { repinta } = pinta(missatges);
  geo.scrollHeight = 1100;
  repinta([...missatges, amagat('2', 2)]);
  expect(anunci()).toBe('');
  geo.scrollHeight = 1200;
  repinta([...missatges, amagat('2', 2), m('3', 3, { text: 'Bon dia' })]);
  expect(anunci()).toBe('Pep: Bon dia');
});
