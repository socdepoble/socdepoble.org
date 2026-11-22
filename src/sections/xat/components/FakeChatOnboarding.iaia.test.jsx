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
import { IAIA_ID } from '../../../data/identitatsSeed.js';

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
   hi era, i Javi Llinares va a la cua. IDEA-323.1 (v1.2.22) · Des d'ara, sense
   poble declarat cap comunitat de poble; la de Sóc de Poble sí. El nivell d'IA només toca la IAIA.
   Gauntlet 261016_1530 (Bloc 3.6.1) · 'fake-sdp' ja no és cap directe: és
   la comunitat de Sóc de Poble (els fake-sdp*), i tampoc no compta ací. */
const esDeComunitat = (id) => id.startsWith('fake-poble') || id.startsWith('fake-sdp');
const directes = () => valor.chatThreads.map((f) => f.id).filter((id) => !esDeComunitat(id));

/* Onada 261030 (cicle 2) · El total és la suma dels fils pintats, el mateix
   que la llista. P0-ANDROID-PUSH (v1.2.16) · B5 (doctrina del Foraster, ordre
   del Mestre 261121) · Cap fil de mostra porta cap no llegit: encesa o apagada,
   el total és 0. S'actualitza a posta (abans, 3 i 2). */
const sumaDelsFils = () => valor.chatThreads.reduce((suma, f) => suma + (f.noLlegits || 0), 0);

test('encesa: les dues entrades d’ajuda i cap no llegit', async () => {
  munta(false);
  expect(directes()).toEqual(['fake-iaia', 'fake-javi']);
  expect(valor.totalNoLlegits).toBe(sumaDelsFils());
  expect(valor.totalNoLlegits).toBe(0);
  expect((await valor.cercaMembres()).map((m) => m.nom)).toEqual(['Sóc de Poble', 'IAIA MarIA']);
  expect(valor.esFilAmagat('fake-iaia')).toBe(false);
});

test('apagada: només Sóc de Poble, cap no llegit, i la IAIA no es pot obrir', async () => {
  munta(true);
  expect(directes()).toEqual(['fake-javi']);
  expect(valor.chatThreads.some((f) => f.id === 'fake-sdp' && f.tipus === 'comunitat')).toBe(true);
  expect(valor.totalNoLlegits).toBe(sumaDelsFils());
  expect(valor.totalNoLlegits).toBe(0);
  expect((await valor.cercaMembres()).map((m) => m.nom)).toEqual(['Sóc de Poble']);
  /* Teler: un destinatari no disponible no es convertix en Sóc de Poble. */
  await expect(valor.creaFil('ajuda:ia')).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
  await expect(valor.creaFil(IAIA_ID)).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
  expect(valor.esFilAmagat('fake-iaia')).toBe(true);
});
