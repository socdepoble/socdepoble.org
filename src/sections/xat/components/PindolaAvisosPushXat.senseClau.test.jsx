/* Onada R9 · C3 (IDEA-120 / P0-30) · Degradació honesta, amb l'adaptador web DE
   DEBÒ (src/pwa/adaptadorAvisosPush.js) i el registre de debò: cap .env del
   projecte porta la clau pública VAPID (VITE_PUSH_VAPID_PUBLICA). Sense clau,
   l'adaptador diu 'sense-clau' i, en producció, amb un navegador que sí que
   admet el push: la píndola no es pinta, no es demana cap permís, no es fa
   cap petició i la consola queda muda (la sonda P0-16), ni en pintar ni en
   sincronitzar ni en tocar res. Un fitxer a banda perquè el registre només
   admet un adaptador per càrrega. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const mock = vi.hoisted(() => ({ sessio: { estat: 'dins', currentUser: { id: 'A' } } }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => mock.sessio }));
vi.mock('../XatContext', () => ({ useXat: () => ({ modeDades: 'remote' }) }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'avisosPush',
  desaDispositiuAvisos: vi.fn(async () => {}),
  retiraDispositiuAvisos: vi.fn(async () => {})
}));

import '../../../config/motorAvisosPushXat.js';
import { activaAvisosPush, fixaServidorAvisosPush, instantaniaAvisosPush, registraAvisosPush, sincronitzaAvisosPush } from '../../../config/avisosPushXat.js';
import { creaAvisosPushWeb } from '../../../pwa/adaptadorAvisosPush.js';
import PindolaAvisosPushXat from './PindolaAvisosPushXat.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('sense clau VAPID: motiu sense-clau, cap píndola, cap permís, cap petició i cap línia a la consola', async () => {
  const consola = ['log', 'info', 'warn', 'error', 'debug'].map((nivell) => vi.spyOn(console, nivell).mockImplementation(() => {}));
  const requestPermission = vi.fn(async () => 'granted');
  const subscribe = vi.fn();
  const getSubscription = vi.fn(async () => null);
  const registre = { active: { scriptURL: 'https://socdepoble.org/sw.js' }, waiting: null, installing: null, pushManager: { subscribe, getSubscription } };
  /* Un navegador amb push de veres: només hi falta la clau del servidor. */
  const finestra = {
    isSecureContext: true, PushManager: function PushManager() {}, Notification: Object.assign(function Notification() {}, { permission: 'default', requestPermission }),
    addEventListener: vi.fn(), removeEventListener: vi.fn()
  };
  finestra.top = finestra;
  finestra.self = finestra;
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const desa = vi.fn(async () => {});
  const retira = vi.fn(async () => {});
  try {
    registraAvisosPush(creaAvisosPushWeb({
      registreActiu: async () => registre, registreDelSw: async () => registre,
      esdevenimentToc: 'sdp:avis-xat', clau: undefined, produccio: true, finestra, navegador: {}
    }));
    expect(instantaniaAvisosPush()).toMatchObject({ disponible: true, tipus: 'web', motiu: 'sense-clau' });
    fixaServidorAvisosPush({ ambit: 'A', desa, retira });
    const { container } = render(<PindolaAvisosPushXat />);
    expect(container.innerHTML).toBe('');
    /* Ni la sincronització en tornar a la vista ni un gest a la força no pregunten res. */
    await expect(sincronitzaAvisosPush()).resolves.toEqual({ estat: 'no-oferit' });
    await expect(activaAvisosPush()).resolves.toEqual({ estat: 'no-oferit' });
    expect(requestPermission).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(desa).not.toHaveBeenCalled();
    expect(retira).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
