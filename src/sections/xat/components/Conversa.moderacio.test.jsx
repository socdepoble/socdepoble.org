/* Fase D (261020, tasca 2; pla 261020_1300 · App Store 1.2 i Google Play
   UGC) · Denunciar i bloquejar des de la conversa, amb Conversa muntada sola
   i un valor de moderació de mentida que porta les regles de veres
   (config/moderacio.js): el menú de cada bombolla aliena, el de la capçalera
   d'un directe 1:1, el missatge de qui has bloquejat i el focus, que sempre
   torna al «⋯» que ha obert el diàleg (crítica 261020, 13). Sense la prop
   `moderacio`, els menús de sempre. La geometria de la llista, com a
   Conversa.test.jsx: jsdom no fa maquetació. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { IAIA_ID } from '../../../data/identitatsSeed.js';
import { objectiuDeContrapart, objectiuDeMissatge } from '../../../config/moderacio.js';
import Conversa from './Conversa.jsx';
import { buidaEsborranys } from '../esborranys.js';

const t = (_, alternativa) => alternativa;
const migdia = new Date();
migdia.setHours(12, 0, 0, 0);
const hui = (minuts) => new Date(migdia.getTime() + minuts * 60000).toISOString();
const m = (id, seq, extra = {}) => ({
  id, seq, sender: 'other', author: 'Pep', usuariId: 'pep', text: `Text ${id}`, creatAl: hui(seq), estatEnviament: 'enviat', ...extra
});
const DIRECTE = Object.freeze({
  id: 'f-pep', tipus: 'directe', name: 'Pep', potEscriure: true, llegitFinsSeq: 100,
  altres: [{ tipus: 'persona', id: 'pep', nom: 'Pep' }]
});
const GRUP = Object.freeze({ id: 'f-grup', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 });

const geo = { scrollHeight: 1000, clientHeight: 400 };
const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');
beforeEach(() => {
  buidaEsborranys();
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

function moderacio({ potBloquejar = true, bloquejades = [] } = {}) {
  const conjunt = new Set(bloquejades);
  return {
    disponible: true,
    potBloquejar,
    objectiuDeMissatge,
    objectiuDeContrapart,
    esPersonaBloquejada: (id) => conjunt.has(String(id)),
    demanaDenuncia: vi.fn(),
    demanaBloqueig: vi.fn(),
    desbloqueja: vi.fn().mockResolvedValue(undefined)
  };
}

function pinta({ fil = DIRECTE, messages = [m('1', 1)], mod = moderacio() } = {}) {
  const props = {
    fil, messages, onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
    onCopia: vi.fn(), hiHaMes: false, carregantMes: false, onCarregaMes: vi.fn(), onReintenta: vi.fn(), onDescarta: vi.fn(),
    onMarcaVist: vi.fn(), locale: 'ca-ES', t, ...(mod ? { moderacio: mod } : {})
  };
  return render(
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa {...props} />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
}

const bombolla = (id) => document.querySelector(`[data-missatge="${id}"]`);
function obriMenuDe(id) {
  const boto = within(bombolla(id)).getByRole('button', { name: 'Opcions del missatge' });
  act(() => { fireEvent.click(boto); });
  return { boto, files: within(bombolla(id)).getAllByRole('menuitem').map((fila) => fila.textContent) };
}
function obriMenuDeLaConversa() {
  const boto = screen.getByRole('button', { name: 'Opcions de la conversa' });
  act(() => { fireEvent.click(boto); });
  return { boto, files: screen.getAllByRole('menuitem').map((fila) => fila.textContent) };
}

describe('la bombolla', () => {
  test('sense moderació, el menú de sempre', () => {
    pinta({ mod: null });
    expect(obriMenuDe('1').files).toEqual(['Respon', 'Copia el text']);
  });

  test('amb moderació, una bombolla aliena: «Denuncia el missatge» i «Bloqueja Pep», darrere de «Copia el text»', () => {
    pinta();
    expect(obriMenuDe('1').files).toEqual(['Respon', 'Copia el text', 'Denuncia el missatge', 'Bloqueja Pep']);
  });

  test('qui no pot bloquejar només denuncia; un missatge signat per una entitat, també (no diu qui l’opera)', () => {
    pinta({ mod: moderacio({ potBloquejar: false }) });
    expect(obriMenuDe('1').files).toEqual(['Respon', 'Copia el text', 'Denuncia el missatge']);
    cleanup();
    pinta({ fil: GRUP, messages: [m('1', 1, { comEntitat: true, author: 'Ajuntament' })] });
    expect(obriMenuDe('1').files).toEqual(['Respon', 'Copia el text', 'Denuncia el missatge']);
  });

  test('ni la IAIA ni els propis porten res de nou', () => {
    pinta({ fil: GRUP, messages: [m('1', 1, { usuariId: IAIA_ID, author: 'IAIA MarIA', is_ai: true }), m('2', 2, { sender: 'me', usuariId: 'jo' })] });
    expect(obriMenuDe('1').files).toEqual(['Respon', 'Copia el text']);
    expect(obriMenuDe('2').files).toEqual(['Respon', 'Copia el text']);
  });

  test('«Denuncia el missatge» porta l’objectiu i el «⋯» al proveïdor, i el focus torna al «⋯»', () => {
    const mod = moderacio();
    pinta({ mod });
    const { boto } = obriMenuDe('1');
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Denuncia el missatge' })); });
    expect(mod.demanaDenuncia).toHaveBeenCalledWith(expect.objectContaining({
      tipus: 'missatge', id: '1', filId: 'f-pep', autor: expect.objectContaining({ id: 'pep', nom: 'Pep' }), bloquejable: true
    }), boto);
    expect(document.activeElement).toBe(boto);
    expect(screen.queryByRole('menu')).toBeNull();
    obriMenuDe('1');
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Bloqueja Pep' })); });
    expect(mod.demanaBloqueig).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), boto);
  });

  test('el missatge de qui has bloquejat: l’avís, sense text, sense nom i sense menú, amb data-vist i data-missatge', () => {
    pinta({ fil: GRUP, messages: [m('1', 1, { text: '', metadades: {}, bloquejat: true }), m('2', 2, { author: 'Rosa', usuariId: 'rosa' })] });
    const item = bombolla('1');
    expect(item.getAttribute('data-vist')).toBe('1');
    expect(item.getAttribute('tabindex')).toBe('-1');
    expect(item.textContent).toBe('Missatge amagat: has bloquejat esta persona.');
    expect(item.querySelector('.sdp-xat-bloquejat')).not.toBeNull();
    expect(within(item).queryByRole('button')).toBeNull();
    expect(item.textContent).not.toContain('Pep');
  });

  test('citar un missatge amagat diu «Missatge amagat», mai el text', () => {
    pinta({
      fil: GRUP,
      messages: [m('1', 1, { text: '', metadades: {}, bloquejat: true }), m('2', 2, { author: 'Rosa', usuariId: 'rosa', respostaA: '1' })]
    });
    expect(bombolla('2').textContent).toContain('Missatge amagat');
  });
});

describe('la capçalera d’un directe 1:1', () => {
  test('sense moderació, només «Seleccionar missatges»', () => {
    pinta({ mod: null });
    expect(obriMenuDeLaConversa().files).toEqual(['Seleccionar missatges']);
  });

  test('amb moderació: «Denuncia Pep» i «Bloqueja Pep»; amb Pep bloquejat, «Desbloqueja Pep»', () => {
    pinta();
    expect(obriMenuDeLaConversa().files).toEqual(['Seleccionar missatges', 'Denuncia Pep', 'Bloqueja Pep']);
    cleanup();
    pinta({ mod: moderacio({ bloquejades: ['pep'] }) });
    expect(obriMenuDeLaConversa().files).toEqual(['Seleccionar missatges', 'Denuncia Pep', 'Desbloqueja Pep']);
  });

  test('un grup no porta res de nou a la capçalera', () => {
    pinta({ fil: GRUP });
    expect(obriMenuDeLaConversa().files).toEqual(['Seleccionar missatges']);
  });

  test('després d’una acció de la capçalera, el focus torna al seu «⋯» (crítica 261020, 13)', () => {
    const mod = moderacio();
    pinta({ mod });
    const { boto } = obriMenuDeLaConversa();
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Denuncia Pep' })); });
    expect(mod.demanaDenuncia).toHaveBeenCalledWith(expect.objectContaining({ tipus: 'persona', id: 'pep', filId: 'f-pep' }), boto);
    expect(document.activeElement).toBe(boto);
    obriMenuDeLaConversa();
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Bloqueja Pep' })); });
    expect(mod.demanaBloqueig).toHaveBeenCalledWith(expect.objectContaining({ id: 'pep' }), boto);
    expect(document.activeElement).toBe(boto);
  });

  test('«Desbloqueja Pep» desbloqueja amb el nom', () => {
    const mod = moderacio({ bloquejades: ['pep'] });
    pinta({ mod });
    obriMenuDeLaConversa();
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Desbloqueja Pep' })); });
    expect(mod.desbloqueja).toHaveBeenCalledWith({ tipus: 'persona', id: 'pep', nom: 'Pep' });
  });
});
