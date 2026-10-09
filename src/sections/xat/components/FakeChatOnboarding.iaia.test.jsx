/* Onada 6 (tasca 12) · El xat de mostra sense sessió amb el nivell d'IA a 0
   (`iaiaApagada` del xat de veres): ni la conversa de la IAIA, ni el seu no
   llegit, ni a «Nova conversa». Encesa, com sempre. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';

vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));

import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import { XatContext } from '../XatContext.jsx';

let valor;
function Sonda() {
  valor = useContext(XatContext);
  return null;
}
const munta = (iaiaApagada) => render(
  <FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [], iaiaApagada }}><Sonda /></FakeChatOnboarding>
);

afterEach(cleanup);

test('encesa: les dues entrades d’ajuda i dos no llegits', async () => {
  munta(false);
  expect(valor.chatThreads.map((f) => f.id)).toEqual(['fake-iaia', 'fake-sdp']);
  expect(valor.totalNoLlegits).toBe(2);
  expect((await valor.cercaMembres()).map((m) => m.nom)).toEqual(['Sóc de Poble', 'IAIA MarIA']);
  expect(valor.esFilAmagat('fake-iaia')).toBe(false);
});

test('apagada: només Sóc de Poble, un no llegit, i la IAIA no es pot obrir', async () => {
  munta(true);
  expect(valor.chatThreads.map((f) => f.id)).toEqual(['fake-sdp']);
  expect(valor.totalNoLlegits).toBe(1);
  expect((await valor.cercaMembres()).map((m) => m.nom)).toEqual(['Sóc de Poble']);
  expect(await valor.creaFil('ajuda:ia')).toBe('fake-sdp');
  expect(valor.esFilAmagat('fake-iaia')).toBe(true);
});
