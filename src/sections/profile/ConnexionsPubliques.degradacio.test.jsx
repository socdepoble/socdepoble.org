/**
 * ConnexionsPubliques.degradacio.test.jsx · IDEA-73
 *
 * Verifica la degradació silenciosa i elegant de ConnexionsPubliques en fitxes
 * públiques (/empresa/rentonar, /gent/:id, /pobles/:id) quan una consulta
 * remota sense sessió rep un error d'esquema absent (PGRST202, 42883, HTTP 404)
 * o una denegació de permís per a visitant anònim (PGRST301, 42501, HTTP 401/403,
 * SENSE-SESSIO, PERMISSION_DENIED), mentre preserva l'avís d'error per a fallades
 * inesperades de xarxa o servidor.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ membres: vi.fn(), publics: vi.fn(), preferencies: vi.fn() }));
vi.mock('../pobles/useEntitatsDelPoble.js', async (importa) => ({ ...(await importa()), useConfigDeLApp: () => null }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'connexionsPubliques',
  connexionsPubliquesDe: (...a) => m.publics(...a),
  membresIEntitatsConnectadesDe: (...a) => m.membres(...a),
  preferenciesConnexions: (...a) => m.preferencies(...a),
  desaVisibilitatConnexions: vi.fn()
}));

import { ConnexionsPubliques, esErrorSilenciosConnexionsPubliques } from './ConnexionsPubliques.jsx';
import { esErrorNoDisponibleConnexions, oblidaSondaConnexions } from '../connectar/sondaConnexions.js';

const UUID_RENTONAR = 'b2c87505-53b1-4108-902f-2313e77b9968';
const ERROR_LECTURA = /No s’han pogut llegir les connexions/;

afterEach(cleanup);
beforeEach(() => {
  oblidaSondaConnexions();
  for (const fn of [m.membres, m.publics, m.preferencies]) fn.mockReset();
});

describe('IDEA-73 · Degradació elegant de ConnexionsPubliques en fitxes públiques', () => {
  test('classifica com a no disponible els codis PostgREST/PostgreSQL d’RPC o taula absent', () => {
    expect(esErrorNoDisponibleConnexions({ code: 'PGRST202', message: 'Could not find the function public.list_public_connections' })).toBe(true);
    expect(esErrorNoDisponibleConnexions({ code: '42883', message: 'function does not exist' })).toBe(true);
    expect(esErrorNoDisponibleConnexions({ status: 404, message: 'Not Found' })).toBe(true);
    expect(esErrorNoDisponibleConnexions({ code: 'DESCONEGUT', message: 'Error intern' })).toBe(false);
  });

  test('classifica com a silenciosos els errors de lectura pública sense sessió o permís anònim', () => {
    expect(esErrorSilenciosConnexionsPubliques({ code: 'PGRST301', status: 401 })).toBe(true);
    expect(esErrorSilenciosConnexionsPubliques({ code: '42501', message: 'permission denied for function list_public_connections' })).toBe(true);
    expect(esErrorSilenciosConnexionsPubliques({ code: 'SENSE-SESSIO' })).toBe(true);
    expect(esErrorSilenciosConnexionsPubliques({ status: 403, message: 'Forbidden' })).toBe(true);
    expect(esErrorSilenciosConnexionsPubliques(new Error('email-privat@example.invalid'))).toBe(false);
  });

  test.each([
    ['PGRST202 (RPC inexistent)', Object.assign(new Error('Could not find the function in the schema cache'), { code: 'PGRST202' })],
    ['42501 (permís anònim denegat)', Object.assign(new Error('permission denied for table entity_member_links'), { code: '42501' })],
    ['HTTP 401 (sense sessió)', Object.assign(new Error('Unauthorized'), { status: 401 })],
    ['SENSE-SESSIO', Object.assign(new Error('Cal sessió'), { code: 'SENSE-SESSIO' })]
  ])('en /empresa/rentonar (%s), ConnexionsPubliques es degrada en silenci sense mostrar caixa d’error', async (_cas, error) => {
    m.membres.mockRejectedValue(error);
    const { container } = render(<ConnexionsPubliques tipus="entitat" id={UUID_RENTONAR} />);
    await waitFor(() => expect(m.membres).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.textContent).toBe(''));
    expect(screen.queryByText(ERROR_LECTURA)).toBeNull();
  });
});
