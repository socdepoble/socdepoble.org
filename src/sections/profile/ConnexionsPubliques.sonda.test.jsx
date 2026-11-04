import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* llibre-deutes-01 i connectar-01 (261104, P0-16 · IDEA-73) · Les fitxes
   públiques consulten la sonda de connexions (sondaConnexions.js): sense la
   migració 2611032100 al servidor (NO-DISPONIBLE) o amb un subjecte que el
   remot no admet (SDP-CONN-001, la persona de reserva del paquet), el bloc no
   es pinta, i el NO-DISPONIBLE es recorda per backend: el muntatge següent ja
   no pregunta. La resta d'errors manté l'avís. */
const m = vi.hoisted(() => ({ membres: vi.fn(), publics: vi.fn(), preferencies: vi.fn() }));
vi.mock('../pobles/useEntitatsDelPoble.js', async importa => ({ ...(await importa()), useConfigDeLApp: () => null }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: cap => cap === 'connexionsPubliques',
  connexionsPubliquesDe: (...a) => m.publics(...a), membresIEntitatsConnectadesDe: (...a) => m.membres(...a),
  preferenciesConnexions: (...a) => m.preferencies(...a), desaVisibilitatConnexions: vi.fn(),
}));
import { ConnexionsPubliques, VisibilitatConnexions } from './ConnexionsPubliques.jsx';
import DetallPoble from '../pobles/DetallPoble.jsx';
import { oblidaSondaConnexions } from '../connectar/sondaConnexions.js';

const UUID = 'b2c87505-53b1-4108-902f-2313e77b9968';
const ERROR_LECTURA = /No s’han pogut llegir les connexions/;
const ambCodi = code => Object.assign(new Error('missatge del servidor'), { code });
const respira = () => new Promise(resol => { setTimeout(resol, 20); });
afterEach(cleanup);
beforeEach(() => {
  oblidaSondaConnexions();
  for (const fn of [m.membres, m.publics, m.preferencies]) fn.mockReset();
});

test('NO-DISPONIBLE: la fitxa no pinta res i el muntatge següent del mateix backend no torna a preguntar', async () => {
  m.membres.mockRejectedValue(ambCodi('NO-DISPONIBLE'));
  const entitat = render(<ConnexionsPubliques tipus="entitat" id={UUID} />);
  await waitFor(() => expect(m.membres).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(entitat.container.textContent).toBe(''));
  expect(screen.queryByText(ERROR_LECTURA)).toBeNull();
  entitat.unmount();
  const poble = render(<ConnexionsPubliques tipus="poble" id="la-torre-de-les-macanes" />);
  expect(poble.container.textContent).toBe('');
  await respira();
  expect(m.membres).toHaveBeenCalledTimes(1);
});

test('SDP-CONN-001 (persona de reserva sense UUID): no pinta res, però no es recorda', async () => {
  m.publics.mockRejectedValue(ambCodi('SDP-CONN-001'));
  const primera = render(<ConnexionsPubliques tipus="persona" id="0001" />);
  await waitFor(() => expect(m.publics).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(primera.container.textContent).toBe(''));
  primera.unmount();
  render(<ConnexionsPubliques tipus="persona" id="0001" />);
  await waitFor(() => expect(m.publics).toHaveBeenCalledTimes(2));
});

test.each([['DESCONEGUT', ambCodi('DESCONEGUT')], ['un error de xarxa', new TypeError('Failed to fetch')]])('%s manté l’avís de lectura', async (_nom, error) => {
  m.publics.mockRejectedValue(error);
  render(<ConnexionsPubliques tipus="persona" id={UUID} />);
  expect(await screen.findByText(ERROR_LECTURA)).toBeTruthy();
});

test('VisibilitatConnexions amb NO-DISPONIBLE no pinta res i la vista pública ja no pregunta', async () => {
  m.preferencies.mockRejectedValue(ambCodi('NO-DISPONIBLE'));
  const vista = render(<VisibilitatConnexions id={UUID} />);
  await waitFor(() => expect(m.preferencies).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(vista.container.textContent).toBe(''));
  vista.unmount();
  render(<ConnexionsPubliques tipus="entitat" id={UUID} />);
  await respira();
  expect(m.membres).not.toHaveBeenCalled();
});

test('VisibilitatConnexions manté l’avís amb SDP-CONN-001 i amb un error de xarxa: la propietària ho ha de saber', async () => {
  m.preferencies.mockRejectedValueOnce(ambCodi('SDP-CONN-001')).mockRejectedValueOnce(new TypeError('Failed to fetch'));
  const primera = render(<VisibilitatConnexions id="0001" />);
  expect(await screen.findByText(ERROR_LECTURA)).toBeTruthy();
  primera.unmount();
  render(<VisibilitatConnexions id={UUID} />);
  expect(await screen.findByText(ERROR_LECTURA)).toBeTruthy();
});

test('la fitxa del poble, sense la migració, no pinta el bloc de connexions ni cap error', async () => {
  m.membres.mockRejectedValue(ambCodi('NO-DISPONIBLE'));
  render(<DetallPoble poble={{ id: 'sella', title: 'Sella' }} />);
  await waitFor(() => expect(m.membres).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Veïnat, empreses i entitats connectades al poble' })).toBeNull());
  expect(screen.queryByText(ERROR_LECTURA)).toBeNull();
  expect(screen.getByRole('button', { name: /Descarregar paquet Open Data/ })).toBeTruthy();
});
