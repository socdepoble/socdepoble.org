import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* D-P016 (Onada R9, ordre del Mestre del 261106) · La fitxa de La Torre (DetallPoble)
   (/pobles/la-torre-de-les-macanes) amb la cadena real de dades: el port
   delega en l'adaptador de Supabase de veres (seguiments.js) i en el seu
   runtime (runtime.js); només el fetch és de mentida.
     · Amb l'interruptor de 2611032100 apagat (el valor real), cap petició: el
       bloc de connexions no es pinta i no hi ha cap avís (el disseny de
       ConnexionsPubliques.sonda.test.jsx), la consola no veu cap 404 i
       sondaConnexions.js recorda que este backend no les té.
     · Amb l'interruptor encés i un servidor sense la migració (la producció
       de R8, mesurada amb c4/sonda_poble.mjs el 261106): PostgREST torna 404
       PGRST202, runtime.rpc() el convertix en un error sense codi, l'adaptador
       en fa DESCONEGUT, la fitxa pinta el títol amb l'avís de lectura i la
       sonda no ho recorda. Per això l'interruptor no s'ha d'encendre abans
       d'aplicar la migració. */
const bandera = vi.hoisted(() => ({ actiu: false }));
vi.mock('../../config/connexionsPubliques.js', () => ({ get CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES() { return bandera.actiu; } }));
vi.mock('../../sections/pobles/useEntitatsDelPoble.js', async (importa) => ({ ...(await importa()), useConfigDeLApp: () => null }));
vi.mock('../backendPort.js', async () => {
  const s = await import('./seguiments.js');
  return {
    teCapacitat: (cap) => cap === 'connexionsPubliques',
    connexionsPubliquesDe: s.connexionsPubliquesDe,
    membresIEntitatsConnectadesDe: s.membresIEntitatsConnectadesDe,
    preferenciesConnexions: s.preferenciesConnexions,
    desaVisibilitatConnexions: s.desaVisibilitatConnexions,
  };
});
import DetallPoble from '../../sections/pobles/DetallPoble.jsx';
import { ambitDeConnexions, connexionsPotserDisponibles, oblidaSondaConnexions } from '../../sections/connectar/sondaConnexions.js';

const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_fixture' });
const POBLE = { id: 'la-torre-de-les-macanes', slug: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes' };
const TITOL = 'Veïnat, empreses i entitats connectades al poble';
const ERROR_LECTURA = /No s’han pogut llegir les connexions/;
const COS_404 = JSON.stringify({ code: 'PGRST202', details: null, hint: null,
  message: 'Could not find the function public.membres_i_entitats_connectades_de(p_id, p_tipus) in the schema cache' });
const respira = () => new Promise((resol) => { setTimeout(resol, 30); });
const fetch404 = () => vi.fn(async () => ({ ok: false, status: 404, headers: { get: () => null }, text: async () => COS_404, json: async () => JSON.parse(COS_404) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
beforeEach(() => { oblidaSondaConnexions(); bandera.actiu = false; });

test('D-P016 · interruptor apagat (valor real): cap petició, ni títol ni avís de connexions, i la resta de la fitxa hi és', async () => {
  expect((await vi.importActual('../../config/connexionsPubliques.js')).CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES).toBe(false);
  const fetch = fetch404(); vi.stubGlobal('fetch', fetch);
  expect(connexionsPotserDisponibles(ambitDeConnexions(REMOT))).toBe(true);
  render(<DetallPoble poble={POBLE} config={REMOT} />);
  await respira();
  await waitFor(() => expect(screen.queryByRole('heading', { name: TITOL })).toBeNull());
  expect(screen.queryByText(ERROR_LECTURA)).toBeNull();
  expect(screen.queryByText(/Carregant les connexions/)).toBeNull();
  expect(screen.getByRole('button', { name: /Descarregar paquet Open Data/ })).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
  expect(connexionsPotserDisponibles(ambitDeConnexions(REMOT))).toBe(false);
});

test('D-P016 · interruptor encés sense la migració (producció de R8): un 404 a la consola i la fitxa pinta l’avís de lectura', async () => {
  bandera.actiu = true;
  const fetch = fetch404(); vi.stubGlobal('fetch', fetch);
  render(<DetallPoble poble={POBLE} config={REMOT} />);
  expect(await screen.findByText(ERROR_LECTURA)).toBeTruthy();
  expect(screen.getByRole('heading', { name: TITOL })).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(String(fetch.mock.calls[0][0])).toBe('http://localhost:54321/rest/v1/rpc/membres_i_entitats_connectades_de');
  expect(screen.getByRole('button', { name: /Descarregar paquet Open Data/ })).toBeTruthy();
  expect(connexionsPotserDisponibles(ambitDeConnexions(REMOT))).toBe(true);
});
