/* xat-ux-a11y-05 (T7a, 261104) · «Envia l’esborrany al Bloc de Notes» va
   davall d'una resposta de la IAIA a una pregunta, i només amb sessió:
     · davall de la salutació o de la crida a registrar-se (cap pregunta
       abans) no hi ha res a guardar, i el botó la feia semblar una resposta
       (IA-07);
     · sense sessió (el Xat de mostra, `senseSessio`), crear la nota falla
       sempre: no s'oferix, tampoc darrere d'una pregunta.
   Els enllaços «Obri …» de la resposta no canvien. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { buidaEsborranys } from '../esborranys.js';

const t = (_, alternativa) => alternativa;
const ESBORRANY = 'Envia l’esborrany al Bloc de Notes';

const esLlista = (el) => el.classList?.contains('sdp-xat-missatges');
beforeEach(() => {
  buidaEsborranys();
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return esLlista(this) ? 1000 : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return esLlista(this) ? 400 : 0; } });
});
afterEach(() => {
  cleanup();
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
});

const ara = new Date().toISOString();
/* El fil de mostra de la IAIA (FakeChatOnboarding): la salutació i la crida. */
const SALUTACIO = { id: 'm1', seq: 1, text: 'Ara no estic pa tonteries.', sender: 'other', author: 'IAIA MarIA', is_ai: true, creatAl: ara };
const CRIDA = { id: 'm2', seq: 2, text: "Si t'agrada el que veus, registra't per a entrar al xat de veritat!", sender: 'other', author: 'IAIA MarIA', is_ai: true, creatAl: ara };
const PREGUNTA = { id: 'p1', seq: 3, text: 'Què és el Mercat?', sender: 'me', author: 'Jo', creatAl: ara, estatEnviament: 'enviat' };
const RESPOSTA = { id: 'r1', seq: 4, text: 'El Mercat és un tauler d’anuncis.\n· El Mercat — /mercat', sender: 'other', author: 'IAIA MarIA', is_ai: true, creatAl: ara };

function pinta(props = {}) {
  return render(
    <MemoryRouter>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa
          fil={{ id: 'fake-iaia', tipus: 'ia', name: 'IAIA MarIA', potEscriure: true, llegitFinsSeq: 100 }}
          messages={[SALUTACIO, CRIDA]} onSendMessage={vi.fn().mockResolvedValue(undefined)} onBack={vi.fn()}
          onEnviaAlBloc={vi.fn()} onCopia={vi.fn()} hiHaMes={false} carregantMes={false} onCarregaMes={vi.fn()} onReintenta={vi.fn()}
          onDescarta={vi.fn()} onMarcaVist={vi.fn()} locale="ca-ES" t={t} consultaIAIA {...props}
        />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
}

const esborranys = () => screen.queryAllByRole('button', { name: ESBORRANY });

test('davall de la salutació i de la crida (cap pregunta abans) no hi ha botó d’esborrany', () => {
  pinta();
  expect(esborranys()).toHaveLength(0);
});

test('amb sessió, davall de la resposta a una pregunta, un botó, i l’enllaç «Obri» continua', () => {
  pinta({ messages: [SALUTACIO, CRIDA, PREGUNTA, RESPOSTA] });
  expect(esborranys()).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Obri El Mercat' })).toBeTruthy();
});

test('sense sessió, cap botó d’esborrany, tampoc darrere d’una pregunta; l’enllaç «Obri» continua', () => {
  pinta({ messages: [SALUTACIO, CRIDA, PREGUNTA, RESPOSTA], senseSessio: true });
  expect(esborranys()).toHaveLength(0);
  expect(screen.getByRole('link', { name: 'Obri El Mercat' })).toBeTruthy();
});
