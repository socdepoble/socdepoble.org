import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ disponible: true, entrada: 0, configApp: null, publics: vi.fn(), membres: vi.fn(), preferencies: vi.fn(), desa: vi.fn(), inclou: vi.fn(), solicita: vi.fn() }));
vi.mock('../../data/identitat.js', async importa => ({ ...(await importa()), entradaSessio: () => m.entrada }));
vi.mock('../pobles/useEntitatsDelPoble.js', async importa => ({ ...(await importa()), useConfigDeLApp: () => m.configApp }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: cap => m.disponible && cap === 'connexionsPubliques',
  connexionsPubliquesDe: (...a) => m.publics(...a), membresIEntitatsConnectadesDe: (...a) => m.membres(...a),
  preferenciesConnexions: (...a) => m.preferencies(...a), desaVisibilitatConnexions: (...a) => m.desa(...a),
  inclouPersonaEnEntitat: (...a) => m.inclou(...a), solicitaUnirSeAEntitat: (...a) => m.solicita(...a),
}));
import { ConnexionsPubliques, VisibilitatConnexions, rutaDeConnexio } from './ConnexionsPubliques.jsx';
/* Només les regressions del formulari retirat usen esta fixture històrica; /connectar actual es prova muntat a ConnectarSection.fedi22.test.jsx. */
import { VinculacioEntitat } from '../../../tests/helpers/vinculacioEntitatLegacy.jsx';
import DetallPoble from '../pobles/DetallPoble.jsx';

const ajornat = () => { let resol; const promesa = new Promise(r => { resol = r; }); return { promesa, resol }; };
const prefs = (visibilitatConnexions = 'privada') => ({ visibilitatConnexions, connexions: [{ tipus: 'persona', id: 'carmen', nom: 'Carmen', visibilitatConnexions: 'publica' }] });
const contacte = { tipus: 'persona', nom: 'Carmen', seguiment: { tipus: 'persona', id: 'carmen' } };
const org = { tipus: 'entitat', id: 'oli', nom: 'Oli de La Torre', rol: 'owner' };
afterEach(cleanup);
beforeEach(() => {
  m.disponible = true;
  m.entrada = 0; m.configApp = null;
  for (const fn of [m.publics, m.membres, m.preferencies, m.desa, m.inclou, m.solicita]) fn.mockReset();
  m.publics.mockResolvedValue([]); m.membres.mockResolvedValue([]); m.preferencies.mockResolvedValue(prefs()); m.desa.mockResolvedValue({});
  m.inclou.mockImplementation(async dades => ({ ...dades }));
  m.solicita.mockImplementation(async dades => ({ ...dades, personaId: 'jo', estat: 'pendent' }));
});

test('sense capacitat no pinta ni consulta res', () => {
  m.disponible = false;
  const vista = render(<><ConnexionsPubliques tipus="persona" id="jo" /><VisibilitatConnexions id="jo" />
    <VinculacioEntitat contacte={contacte} usuariId="jo" identitats={[org]} /></>);
  expect(vista.container.textContent).toBe(''); expect(m.publics).not.toHaveBeenCalled(); expect(m.preferencies).not.toHaveBeenCalled();
});
test('la lectura pública no consulta preferències ni confia en rutes del servidor', async () => {
  m.publics.mockResolvedValue([{ tipus: 'persona', id: 'carmen', nom: 'Carmen', ruta: 'javascript:alert(1)' }, { tipus: 'secret', id: 'x', nom: 'Secret' }]);
  render(<ConnexionsPubliques tipus="persona" id="javi" />);
  expect((await screen.findByRole('link', { name: 'Carmen' })).getAttribute('href')).toBe('/gent/carmen');
  expect(screen.queryByText('Secret')).toBeNull(); expect(m.preferencies).not.toHaveBeenCalled();
});
test.each(['entitat', 'poble'])('consulta agregada de %s', async tipus => {
  m.membres.mockResolvedValue([{ tipus: 'entitat', id: 'oli', nom: 'Oli', direccio: 'poble' }]);
  render(<ConnexionsPubliques tipus={tipus} id="la-torre" />);
  expect(await screen.findByRole('link', { name: 'Oli' })).toBeTruthy();
  expect(m.membres.mock.calls[0][0]).toEqual({ tipus, id: 'la-torre' }); expect(m.publics).not.toHaveBeenCalled();
});
test('canviar perfil amaga immediatament la llista i ignora respostes tardanes', async () => {
  const tard = ajornat(); m.publics.mockReturnValueOnce(tard.promesa).mockResolvedValueOnce([{ tipus: 'persona', id: 'berta', nom: 'Berta' }]);
  const vista = render(<ConnexionsPubliques tipus="persona" id="anna" />);
  await waitFor(() => expect(m.publics).toHaveBeenCalledTimes(1));
  vista.rerender(<ConnexionsPubliques tipus="persona" id="berta" />);
  expect(await screen.findByRole('link', { name: 'Berta' })).toBeTruthy();
  await act(async () => tard.resol([{ tipus: 'persona', id: 'anna', nom: 'Anna secreta' }]));
  expect(screen.queryByText('Anna secreta')).toBeNull();
});
test('els errors públics no mostren dades del servidor', async () => {
  m.publics.mockRejectedValue(new Error('email-privat@example.invalid'));
  render(<ConnexionsPubliques tipus="persona" id="jo" />);
  expect(await screen.findByText(/No s’han pogut llegir/)).toBeTruthy(); expect(screen.queryByText(/email-privat/)).toBeNull();
});
test('la visibilitat espera el servidor abans de canviar i permet excepció individual', async () => {
  const tard = ajornat(); m.desa.mockReturnValueOnce(tard.promesa); m.preferencies.mockResolvedValueOnce(prefs()).mockResolvedValueOnce(prefs('publica')).mockResolvedValueOnce({ visibilitatConnexions: 'publica', connexions: [{ ...prefs().connexions[0], visibilitatConnexions: 'privada' }] });
  render(<VisibilitatConnexions id="jo" />);
  const global = await screen.findByRole('switch', { name: 'Mostrar les meues connexions públicament' });
  fireEvent.click(global); expect(global.getAttribute('aria-checked')).toBe('false'); expect(global.disabled).toBe(true);
  await act(async () => tard.resol({}));
  await waitFor(() => expect(global.getAttribute('aria-checked')).toBe('true'));
  fireEvent.click(screen.getByRole('switch', { name: 'Mostrar esta connexió: Carmen' }));
  await waitFor(() => expect(m.desa).toHaveBeenCalledTimes(2));
  expect(m.desa.mock.calls[1][0]).toEqual({ tipus: 'persona', id: 'jo', connexio: { tipus: 'persona', id: 'carmen' }, visibilitatConnexions: 'privada' });
});
test('una denegació no canvia la preferència ni publica res', async () => {
  m.desa.mockRejectedValue(new Error('token-privat'));
  render(<VisibilitatConnexions id="jo" />);
  const control = await screen.findByRole('switch', { name: 'Mostrar les meues connexions públicament' });
  fireEvent.click(control); expect(await screen.findByText(/No s’ha pogut completar/)).toBeTruthy();
  expect(control.getAttribute('aria-checked')).toBe('false'); expect(screen.queryByText(/token-privat/)).toBeNull();
});
test('un canvi de sessió A→B→A invalida l’escriptura antiga', async () => {
  const tard = ajornat(); m.desa.mockReturnValueOnce(tard.promesa);
  const vista = render(<VisibilitatConnexions id="anna" visor="A" />);
  fireEvent.click(await screen.findByRole('switch', { name: 'Mostrar les meues connexions públicament' }));
  vista.rerender(<VisibilitatConnexions id="berta" visor="B" />);
  await waitFor(() => expect(m.preferencies).toHaveBeenCalledTimes(2));
  vista.rerender(<VisibilitatConnexions id="anna" visor="A" />);
  await waitFor(() => expect(m.preferencies).toHaveBeenCalledTimes(3));
  await act(async () => tard.resol({}));
  expect(m.preferencies).toHaveBeenCalledTimes(3);
  expect(screen.getByRole('switch', { name: 'Mostrar les meues connexions públicament' }).getAttribute('aria-checked')).toBe('false');
});
test('un administrador vincula la persona amb rol funcional explícit', async () => {
  render(<VinculacioEntitat contacte={contacte} usuariId="jo" identitats={[org]} />);
  fireEvent.change(screen.getByLabelText('Rol en l’entitat'), { target: { value: 'treballador' } });
  fireEvent.click(screen.getByRole('button', { name: 'Vincular a l’entitat' }));
  expect(await screen.findByText('Persona vinculada a l’entitat amb el rol triat.')).toBeTruthy();
  expect(m.inclou.mock.calls[0][0]).toEqual({ orgId: 'oli', personaId: 'carmen', rol: 'treballador' });
});
test('admin sense propietat no pot triar administrador', () => {
  render(<VinculacioEntitat contacte={contacte} usuariId="jo" identitats={[{ ...org, rol: 'admin' }]} />);
  expect(screen.getByRole('option', { name: 'Administrador' }).disabled).toBe(true);
});
test('una petició no concedix pertinença ni invoca incloure', async () => {
  render(<VinculacioEntitat contacte={{ tipus: 'entitat', nom: 'Oli', seguiment: { tipus: 'entitat', id: 'oli' } }} usuariId="jo" />);
  fireEvent.click(screen.getByRole('button', { name: 'Enviar la sol·licitud' }));
  expect(await screen.findByText('Sol·licitud guardada, pendent de revisió per l’entitat.')).toBeTruthy();
  expect(m.solicita.mock.calls[0][0]).toEqual({ orgId: 'oli', rol: 'usuari' }); expect(m.inclou).not.toHaveBeenCalled();
});
test('cap èxit amb resposta de pertinença malformada', async () => {
  m.inclou.mockResolvedValue({}); render(<VinculacioEntitat contacte={contacte} usuariId="jo" identitats={[org]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Vincular a l’entitat' }));
  expect(await screen.findByText(/No s’ha pogut guardar el vincle/)).toBeTruthy(); expect(screen.queryByText(/Persona vinculada/)).toBeNull();
});
test('el canvi de contacte descarta l’èxit tardà i no duplica la mutació', async () => {
  const tard = ajornat(); m.inclou.mockReturnValueOnce(tard.promesa);
  const vista = render(<VinculacioEntitat contacte={contacte} usuariId="jo" identitats={[org]} />);
  const boto = screen.getByRole('button', { name: 'Vincular a l’entitat' }); fireEvent.click(boto); fireEvent.click(boto);
  vista.rerender(<VinculacioEntitat contacte={{ ...contacte, seguiment: { tipus: 'persona', id: 'berta' } }} usuariId="jo" identitats={[org]} />);
  await act(async () => tard.resol({ orgId: 'oli', personaId: 'carmen', rol: 'usuari' }));
  expect(m.inclou).toHaveBeenCalledTimes(1); expect(screen.queryByText(/Persona vinculada/)).toBeNull();
});
test('rutes relatives generades sense executar esquemes aportats', () => {
  expect(rutaDeConnexio({ tipus: 'persona', id: '../x?y' })).toBe('/gent/..%2Fx%3Fy');
  expect(rutaDeConnexio({ tipus: 'email', id: 'privat' })).toBeNull();
});

test('la mateixa persona amb una nova entrada de sessió descarta la petició anterior', async () => {
  const tard = ajornat(); m.solicita.mockReturnValueOnce(tard.promesa);
  const props = { contacte: { tipus: 'entitat', nom: 'Oli', seguiment: { tipus: 'entitat', id: 'oli' } }, usuariId: 'jo' };
  const vista = render(<VinculacioEntitat {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Enviar la sol·licitud' }));
  m.entrada += 1; vista.rerender(<VinculacioEntitat {...props} />);
  await act(async () => tard.resol({ orgId: 'oli', personaId: 'jo', rol: 'usuari', estat: 'pendent' }));
  expect(screen.queryByText('Sol·licitud guardada, pendent de revisió per l’entitat.')).toBeNull();
  expect(screen.getByRole('button', { name: 'Enviar la sol·licitud' }).disabled).toBe(false);
});
test('una resposta de sol·licitud d’una altra persona no anuncia èxit', async () => {
  m.solicita.mockResolvedValue({ orgId: 'oli', personaId: 'altra', rol: 'usuari', estat: 'pendent' });
  render(<VinculacioEntitat contacte={{ tipus: 'entitat', nom: 'Oli', seguiment: { tipus: 'entitat', id: 'oli' } }} usuariId="jo" />);
  fireEvent.click(screen.getByRole('button', { name: 'Enviar la sol·licitud' }));
  expect(await screen.findByText(/No s’ha pogut guardar el vincle/)).toBeTruthy(); expect(screen.queryByText(/Sol·licitud guardada/)).toBeNull();
});
test('el poble conserva la configuració de l’amfitrió quan el caller no la passa', async () => {
  m.configApp = { backendId: 'sdp-local', tenantId: '11111111-1111-4111-8111-111111111111', dataMode: 'local' };
  render(<DetallPoble poble={{ id: 'sella', title: 'Sella' }} />);
  await waitFor(() => expect(m.membres).toHaveBeenCalledTimes(1));
  expect(m.membres.mock.calls[0][0]).toEqual({ tipus: 'poble', id: 'sella' });
  expect(m.membres.mock.calls[0][1]).toEqual(expect.objectContaining(m.configApp));
});
test('ocultar connexions confirma el canvi i buida la vista pública del mateix subjecte', async () => {
  let publica = true;
  m.membres.mockImplementation(async () => publica ? [{ tipus: 'persona', id: 'berta', nom: 'Berta pública' }] : []);
  m.preferencies.mockImplementation(async () => ({ visibilitatConnexions: publica ? 'publica' : 'privada', connexions: [] }));
  m.desa.mockImplementation(async dades => { publica = dades.visibilitatConnexions === 'publica'; });
  function Perfil() {
    const [revisio, setRevisio] = useState(0);
    return <><ConnexionsPubliques tipus="entitat" id="oli" revisio={revisio} />
      <VisibilitatConnexions tipus="entitat" id="oli" onCanvi={() => setRevisio(n => n + 1)} /></>;
  }
  render(<Perfil />);
  expect(await screen.findByRole('link', { name: 'Berta pública' })).toBeTruthy();
  fireEvent.click(await screen.findByRole('switch', { name: 'Mostrar les meues connexions públicament' }));
  await waitFor(() => expect(m.membres).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole('link', { name: 'Berta pública' })).toBeNull();
  expect(await screen.findByText('No hi ha connexions públiques per a mostrar.')).toBeTruthy();
});
