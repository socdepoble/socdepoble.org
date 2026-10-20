/* Fase E (261020, tasca 3; pla 261020_2045 «El Comú») · Ordre del Mestre:
   Bombolla munta la llista viva quan missatge.tipus === 'llista_comu', sense
   afegir missatges ni trencar la conversa, i la targeta està memoritzada:
   escriure al compositor (que repinta totes les bombolles) no la torna a
   pintar. Persones i xifres de mostra. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Bombolla from './Bombolla.jsx';
import Conversa from './Conversa.jsx';
import { llistaDeMissatge, TIPUS_LLISTA_COMU } from '../llistaComu.js';

/* Un comptador de pintats de la peça de Pedra Seca, que continua sent la de veres. */
const pintats = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../../components/PedraSeca/index.js', async (original) => {
  const modul = await original();
  const Real = modul.UniversalListCard;
  return { ...modul, UniversalListCard: (props) => { pintats.n += 1; return <Real {...props} />; } };
});

const t = (_, alternativa) => alternativa;
const ARA = '2026-10-20T19:00:00.000Z';
const ANNA = Object.freeze({ id: 'u-anna', nom: 'Anna' });
const LLISTA = Object.freeze({
  id: 'l-compra', mode: 'rebost', titol: 'Compra del mas', propietariId: ANNA.id, revisio: 1,
  elementsComu: [{ id: 'r1', ordre: 1, nom: 'Tomaca', capaMode: { estat: 'falta', especificacio: '2 kg', demanatPer: [], compratPer: null } }]
});
const missatgeLlista = (extra = {}) => ({
  id: 'm-llista', seq: 10, sender: 'other', author: 'Anna', usuariId: ANNA.id, tipus: TIPUS_LLISTA_COMU,
  text: '🧺 Llista: Compra del mas', metadades: { llista: LLISTA }, creatAl: ARA, estatEnviament: 'enviat', ...extra
});
const dinsDeLlista = (node) => <MemoryRouter><ol className="sdp-xat-missatges">{node}</ol></MemoryRouter>;

beforeEach(() => { pintats.n = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('llistaDeMissatge', () => {
  test('només el tipus llista_comu amb una instantània que té la forma mínima', () => {
    expect(llistaDeMissatge(missatgeLlista())).toBe(LLISTA);
    expect(llistaDeMissatge(missatgeLlista({ tipus: 'text' }))).toBeNull();
    expect(llistaDeMissatge(missatgeLlista({ metadades: {} }))).toBeNull();
    expect(llistaDeMissatge(missatgeLlista({ metadades: { llista: { id: 'x', mode: 'rebost' } } }))).toBeNull();
    expect(llistaDeMissatge(null)).toBeNull();
    /* La mateixa validació que la targeta: un mode que este client no coneix, o sense títol, és text. */
    expect(llistaDeMissatge(missatgeLlista({ metadades: { llista: { ...LLISTA, mode: 'colla_quinto' } } }))).toBeNull();
    expect(llistaDeMissatge(missatgeLlista({ metadades: { llista: { ...LLISTA, titol: '' } } }))).toBeNull();
  });
});

describe('Bombolla · la llista viva', () => {
  test('el cos és la targeta, i l’autor, l’hora i el menú continuen; un toc no afig cap missatge', () => {
    render(dinsDeLlista(<Bombolla missatge={missatgeLlista()} esGrup locale="ca-ES" t={t} actorLlista={ANNA} />));
    const item = document.querySelector('[data-missatge="m-llista"]');
    expect(within(item).getByRole('region', { name: 'Compra del mas' })).toBeTruthy();
    expect(item.querySelector('.sdp-xat-bombolla__text')).toBeNull();
    expect(within(item).getByText('Anna')).toBeTruthy();
    expect(item.querySelector('time')).toBeTruthy();
    expect(within(item).getByRole('button', { name: 'Opcions del missatge' })).toBeTruthy();
    fireEvent.click(within(item).getByRole('button', { name: 'Tomaca, 2 kg, Falta' }));
    expect(within(item).getByRole('button', { name: 'Tomaca, 2 kg, Al cistell' })).toBeTruthy();
    expect(document.querySelectorAll('.sdp-xat-missatges > li')).toHaveLength(1);
  });

  test('sense instantània llegible, el text de sempre', () => {
    render(dinsDeLlista(<Bombolla missatge={missatgeLlista({ metadades: {} })} locale="ca-ES" t={t} />));
    expect(document.querySelector('.sdp-xat-bombolla__text').textContent).toBe('🧺 Llista: Compra del mas');
    expect(document.querySelector('.sdp-comu')).toBeNull();
  });

  test('una instantània que la targeta no pot llegir és el text de reserva, sense cap alerta', () => {
    render(dinsDeLlista(<Bombolla missatge={missatgeLlista({ metadades: { llista: { ...LLISTA, mode: 'colla_quinto' } } })} locale="ca-ES" t={t} />));
    expect(document.querySelector('.sdp-xat-bombolla__text').textContent).toBe('🧺 Llista: Compra del mas');
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  test('la bombolla amb llista puja per damunt de les següents mentre s’hi escriu (els suggeriments no queden davall)', () => {
    render(dinsDeLlista(<Bombolla missatge={missatgeLlista()} locale="ca-ES" t={t} actorLlista={ANNA} />));
    expect(document.querySelector('.sdp-xat-bombolla').classList.contains('sdp-xat-bombolla--llista')).toBe(true);
    const css = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
    expect(css).toMatch(/\.sdp-xat-bombolla--llista:focus-within \{ z-index: 1; \}/);
  });

  test('esborrada, la làpida i cap llista', () => {
    render(dinsDeLlista(<Bombolla missatge={missatgeLlista({ esborrat: true })} locale="ca-ES" t={t} />));
    expect(document.querySelector('.sdp-comu')).toBeNull();
    expect(screen.getByText("S'ha esborrat este missatge")).toBeTruthy();
  });

  test('en el mode de selecció la bombolla és una casella i la targeta no porta cap control', () => {
    render(dinsDeLlista(<Bombolla missatge={missatgeLlista()} locale="ca-ES" t={t} actorLlista={ANNA}
      seleccio={{ actiu: true, triat: false, onAlterna: () => {} }} />));
    const casella = screen.getByRole('checkbox');
    expect(within(casella).queryAllByRole('button')).toEqual([]);
    expect(within(casella).queryAllByRole('combobox')).toEqual([]);
    expect(within(casella).getByText('Tomaca')).toBeTruthy();
  });

  test('una bombolla de text pinta el DOM de sempre (sense cap rastre de la llista)', () => {
    render(dinsDeLlista(<Bombolla missatge={missatgeLlista({ tipus: 'text', metadades: {} })} locale="ca-ES" t={t} />));
    expect(document.querySelector('.sdp-xat-bombolla__text')).toBeTruthy();
    expect(pintats.n).toBe(0);
  });
});

describe('memoritzada · escriure al compositor no repinta la llista', () => {
  test('Bombolla repintada amb les mateixes props de la llista: la targeta no es torna a pintar', () => {
    const msg = missatgeLlista();
    const { rerender } = render(dinsDeLlista(<Bombolla missatge={msg} locale="ca-ES" t={t} actorLlista={ANNA} onCopia={() => {}} />));
    expect(pintats.n).toBe(1);
    rerender(dinsDeLlista(<Bombolla missatge={msg} locale="ca-ES" t={t} actorLlista={ANNA} onCopia={() => {}} ressaltat />));
    expect(pintats.n).toBe(1);
  });

  test('Conversa: cada tecla repinta les bombolles, però la llista es queda quieta', () => {
    const props = {
      fil: { id: 'f-1', tipus: 'grup', name: 'Colla', potEscriure: true, llegitFinsSeq: 100 },
      messages: [missatgeLlista()], onSendMessage: vi.fn().mockResolvedValue(undefined), onBack: vi.fn(), onEnviaAlBloc: vi.fn(),
      onCopia: vi.fn(), hiHaMes: false, carregantMes: false, onCarregaMes: vi.fn(), onReintenta: vi.fn(), onDescarta: vi.fn(),
      onMarcaVist: vi.fn(), locale: 'ca-ES', t, actorLlista: ANNA
    };
    render(
      <MemoryRouter>
        <AppGridContext.Provider value={{ mida: 'ample' }}>
          <Conversa {...props} />
        </AppGridContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole('region', { name: 'Compra del mas' })).toBeTruthy();
    const abans = pintats.n;
    const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
    for (const lletra of ['H', 'Ho', 'Hol', 'Hola']) act(() => { fireEvent.change(camp, { target: { value: lletra } }); });
    expect(camp.value).toBe('Hola');
    expect(pintats.n).toBe(abans);
  });
});
