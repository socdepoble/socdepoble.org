/* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-11) · MEDIA-10 pel camí de
   producció: Conversa amb onSendMedia (sessió remota, fil que no és de la
   IAIA) munta ControlsAdjunt amb el port real. Un node sense la migració
   (la quota respon 404/PGRST202 → 'sense-capacitat') no pinta cap panell ni
   cap alerta; amb la quota, el panell hi és. */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { errorAdjuntXat } from '../../../data/xatMultimedia.js';
import Conversa from './Conversa.jsx';

const m = vi.hoisted(() => ({ quotaXat: vi.fn() }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, quotaXat: m.quotaXat, teCapacitat: (capacitat) => capacitat === 'xatMultimedia' || real.teCapacitat(capacitat) };
});

const t = (_clau, alternativa) => alternativa;
const FIL = { id: 'f-adjunts', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollTo = function scrollTo() {};
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
});
afterEach(() => {
  cleanup();
  delete HTMLElement.prototype.scrollTo;
  delete window.matchMedia;
});

// Cada prova, una persona: la quota desada (ADV-MEDIA-4) és de cada una.
const pinta = (usuari) => render(
  <MemoryRouter>
    <AppGridContext.Provider value={{ mida: 'ample' }}>
      <Conversa
        fil={FIL} messages={[]} onSendMessage={vi.fn()} onSendMedia={vi.fn()} usuariAdjunts={usuari}
        onBack={vi.fn()} onEnviaAlBloc={vi.fn()} onCopia={vi.fn()} hiHaMes={false} carregantMes={false}
        onCarregaMes={vi.fn()} onReintenta={vi.fn()} onDescarta={vi.fn()} onMarcaVist={vi.fn()} locale="ca-ES" t={t}
      />
    </AppGridContext.Provider>
  </MemoryRouter>
);

test('un node sense la migració: Conversa no pinta cap panell d’adjunts ni cap alerta', async () => {
  m.quotaXat.mockRejectedValue(errorAdjuntXat('sense-capacitat'));
  const vista = pinta('sense-migracio');
  await waitFor(() => expect(m.quotaXat).toHaveBeenCalledOnce());
  await act(async () => {});
  expect(vista.container.querySelector('.sdp-xat-adjunts')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Foto o vídeo' })).toBeNull();
  expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
});

test('amb la migració, el mateix muntatge pinta el panell amb la quota', async () => {
  m.quotaXat.mockResolvedValue({ usats: 0, limit: 20_000_000, pendents: [] });
  pinta('amb-migracio');
  expect(await screen.findByRole('group', { name: 'Adjunts del xat' })).toBeTruthy();
  expect(screen.getByText('0,0 de 20 MB del xat')).toBeTruthy();
});
