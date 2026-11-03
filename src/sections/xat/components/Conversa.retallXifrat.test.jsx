/* O4-CLAUDE-3 (D3-xat-iaia-e2ee-03; disseny E2EE D-18 a) · Amb la bandera E2EE
   encesa (simulada), «Enviar al Bloc de Notes» en una conversa xifrada no guarda res:
   obri l'avís que la nota anirà al servidor sense xifratge d'extrem a extrem, i només
   «Guardar» crida onEnviaAlBloc amb la tria. «Cancel·lar» no envia res. En una
   conversa sense xifrar, el retall de sempre, sense avís. Amb la bandera apagada,
   Conversa.e2eeApagat.produccio.test.js fixa que res d'açò entra al paquet. jsdom no
   té showModal: es fa com el navegador. Dades sintètiques. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';

const estat = vi.hoisted(() => ({ xifratge: { estat: 'xifrat', visible: false } }));
vi.mock('../../../config/xifratXat.js', async (importOriginal) => ({ ...(await importOriginal()), E2EE_ACTIU_PER_DEFECTE: true }));
vi.mock('../useSeguretatDelFil.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatXifratgeDelFil: () => estat.xifratge
}));
vi.mock('../useCanvisDeClau.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useCanvisDeClau: () => ({ bloquejat: false, avis: false }),
  avisDelBloqueig: () => null
}));

import Conversa from './Conversa.jsx';

const ca = createTranslator('ca');
const m = (id, seq) => ({ id, seq, sender: 'other', author: 'Pep', usuariId: 'pep', text: `Text ${id}`, creatAl: '2026-11-02T10:00:00Z', estatEnviament: 'enviat' });
const MISSATGES = [m('m1', 1), m('m2', 2)];
const FIL = { id: 'f-1', tipus: 'directe', name: 'Pep', potEscriure: true, llegitFinsSeq: 2 };

beforeEach(() => {
  estat.xifratge = { estat: 'xifrat', visible: false };
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() {
    this.setAttribute('open', '');
    (this.querySelector('[autofocus]') || this.querySelector('button:not(:disabled)'))?.focus();
  } });
});
afterEach(() => {
  cleanup();
  delete HTMLDialogElement.prototype.showModal;
});

function pinta() {
  const onEnviaAlBloc = vi.fn(async () => {});
  render(
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa
          fil={FIL} messages={MISSATGES} onSendMessage={vi.fn()} onBack={vi.fn()} onEnviaAlBloc={onEnviaAlBloc}
          onCopia={vi.fn()} hiHaMes={false} carregantMes={false} onCarregaMes={vi.fn()} onReintenta={vi.fn()}
          onDescarta={vi.fn()} onMarcaVist={vi.fn()} locale="ca-ES" t={ca}
        />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
  return onEnviaAlBloc;
}
const bombolla = (id) => document.querySelector(`[data-missatge="${id}"]`);
async function triaIEnvia() {
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' })); });
  act(() => { fireEvent.click(screen.getByText('Seleccionar missatges')); });
  act(() => { fireEvent.click(bombolla('m2')); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar al Bloc de Notes' })); });
}
const AVIS = 'La nota es guardarà al servidor sense xifratge d’extrem a extrem.';
const avis = () => screen.queryByText(AVIS);
// L'avís és un tros lazy: la primera vegada arriba després de la Suspense.
const esperaDialeg = async () => (await screen.findByText(AVIS)).closest('dialog');

test('conversa xifrada: «Enviar al Bloc de Notes» obri l’avís i no envia res; «Guardar» envia la tria', async () => {
  const onEnviaAlBloc = pinta();
  await triaIEnvia();
  const obert = await esperaDialeg();
  expect(onEnviaAlBloc).not.toHaveBeenCalled();
  expect(obert.hasAttribute('open')).toBe(true);
  await act(async () => { fireEvent.click(within(obert).getByRole('button', { name: 'Guardar' })); });
  expect(onEnviaAlBloc).toHaveBeenCalledTimes(1);
  expect(onEnviaAlBloc.mock.lastCall[0].map((missatge) => missatge.id)).toEqual(['m2']);
});

test('conversa xifrada: «Cancel·lar» tanca l’avís sense enviar res', async () => {
  const onEnviaAlBloc = pinta();
  await triaIEnvia();
  const obert = await esperaDialeg();
  await act(async () => { fireEvent.click(within(obert).getByRole('button', { name: 'Cancel·lar' })); });
  expect(onEnviaAlBloc).not.toHaveBeenCalled();
  expect(obert.hasAttribute('open')).toBe(false);
});

test('conversa sense xifrar: el retall de sempre, sense cap avís', async () => {
  estat.xifratge = { estat: 'public', visible: false };
  const onEnviaAlBloc = pinta();
  await triaIEnvia();
  expect(avis()).toBeNull();
  expect(onEnviaAlBloc).toHaveBeenCalledTimes(1);
});
