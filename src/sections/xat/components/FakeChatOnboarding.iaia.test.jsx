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

/* Gauntlet 261016 (Bloc 3.6) · Les converses directes de la mostra: sense
   poble declarat, la comunitat de «Gent de la Torre» (els fake-poble*) també
   hi és, i Javi Llinares va a la cua. El nivell d'IA només toca la IAIA.
   Gauntlet 261016_1530 (Bloc 3.6.1) · 'fake-sdp' ja no és cap directe: és
   la comunitat de Sóc de Poble (els fake-sdp*), i tampoc no compta ací. */
const esDeComunitat = (id) => id.startsWith('fake-poble') || id.startsWith('fake-sdp');
const directes = () => valor.chatThreads.map((f) => f.id).filter((id) => !esDeComunitat(id));

/* Onada 261030 (cicle 2) · El total és la suma dels fils pintats (Avisos de
   Sóc de Poble, Avisos del poble i, encesa, la IAIA), el mateix que la llista. */
const sumaDelsFils = () => valor.chatThreads.reduce((suma, f) => suma + (f.noLlegits || 0), 0);

test('encesa: les dues entrades d’ajuda i tres no llegits', async () => {
  munta(false);
  expect(directes()).toEqual(['fake-iaia', 'fake-javi']);
  expect(valor.totalNoLlegits).toBe(sumaDelsFils());
  expect(valor.totalNoLlegits).toBe(3);
  expect((await valor.cercaMembres()).map((m) => m.nom)).toEqual(['Sóc de Poble', 'IAIA MarIA']);
  expect(valor.esFilAmagat('fake-iaia')).toBe(false);
});

test('apagada: només Sóc de Poble, dos no llegits (els Avisos), i la IAIA no es pot obrir', async () => {
  munta(true);
  expect(directes()).toEqual(['fake-javi']);
  expect(valor.chatThreads.some((f) => f.id === 'fake-sdp' && f.tipus === 'comunitat')).toBe(true);
  expect(valor.totalNoLlegits).toBe(sumaDelsFils());
  expect(valor.totalNoLlegits).toBe(2);
  expect((await valor.cercaMembres()).map((m) => m.nom)).toEqual(['Sóc de Poble']);
  expect(await valor.creaFil('ajuda:ia')).toBe('fake-sdp');
  expect(valor.esFilAmagat('fake-iaia')).toBe(true);
});
