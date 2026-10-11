/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor (TOTP) del
   superadmin: render amb jsdom, el port i la sessió simulats. Es proven tots
   els estats (sense capacitat, carregant, error, sense factor, inscripció,
   factor verificat amb aal1, actiu amb aal2) i que cada error arriba amb la
   frase de CODI_SEGON_FACTOR, mai amb el text del proveïdor. Dades sintètiques. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  caps: new Set(), llista: vi.fn(), inscriu: vi.fn(), repta: vi.fn(), verifica: vi.fn(), retira: vi.fn(),
  sessio: { nivell: 'aal1', esSuperadmin: true, calSegonFactor: true },
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  llistaFactors: (...args) => m.llista(...args),
  inscriuFactor: (...args) => m.inscriu(...args),
  reptaFactor: (...args) => m.repta(...args),
  verificaFactor: (...args) => m.verifica(...args),
  retiraFactor: (...args) => m.retira(...args),
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => m.sessio }));
import { SegonFactor, NOM_FACTOR, XIFRES_CODI } from './SegonFactor.jsx';
import { CODI_SEGON_FACTOR, MISSATGE_SEGON_FACTOR, errorDeSegonFactor } from '../../data/errorsBackend.js';

const VERIFICAT = Object.freeze({ id: 'f1', nom: 'Autenticador del Mestre', tipus: 'totp', estat: 'verificat' });
const PENDENT = Object.freeze({ id: 'p1', nom: 'Autenticador del Mestre', tipus: 'totp', estat: 'pendent' });
const INSCRIPCIO = Object.freeze({ id: 'f-nou', qr: 'data:image/svg+xml;utf-8,<svg></svg>', secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/x' });
const ETIQUETA_CODI = 'Codi de l’aplicació d’autenticació';

beforeEach(() => {
  m.caps = new Set(['segonFactor']);
  m.sessio = { nivell: 'aal1', esSuperadmin: true, calSegonFactor: true };
  m.llista.mockReset().mockResolvedValue([]);
  m.inscriu.mockReset().mockResolvedValue(INSCRIPCIO);
  m.repta.mockReset().mockResolvedValue({ repteId: 'r1', caduca: null });
  m.verifica.mockReset().mockResolvedValue({ nivell: 'aal2' });
  m.retira.mockReset().mockImplementation(async (id) => ({ id }));
});
afterEach(cleanup);

const regio = () => screen.getByRole('region', { name: 'Segon factor' });
const campCodi = () => screen.getByLabelText(ETIQUETA_CODI);
async function escriuIConfirma(codi, nomBoto) {
  fireEvent.change(campCodi(), { target: { value: codi } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: nomBoto })); });
}

describe('SegonFactor', () => {
  test('sense la capacitat del port: ho diu amb la frase del codi i no crida res', () => {
    m.caps = new Set();
    render(<SegonFactor />);
    expect(within(regio()).getByText('Segon factor no disponible')).toBeTruthy();
    expect(within(regio()).getByText(MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.NO_DISPONIBLE])).toBeTruthy();
    expect(m.llista).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('carregant i, sense cap factor, l’explicació, «Activa el segon factor» i l’avís honest sobre la recuperació', async () => {
    render(<SegonFactor />);
    expect(screen.getByRole('status').textContent).toBe('Comprovant el segon factor…');
    expect(await screen.findByText('Sense segon factor')).toBeTruthy();
    expect(m.llista).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Activa el segon factor' })).toBeTruthy();
    expect(regio().textContent).toContain(`un codi de ${XIFRES_CODI} xifres`);
    expect(regio().textContent).toContain('este client no té codis de recuperació');
    expect(regio().textContent).toContain('retire el factor des del servidor');
    expect(screen.queryByLabelText(ETIQUETA_CODI)).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  test('si la llista falla, una alerta amb la frase del codi i un reintent que torna a llegir', async () => {
    m.llista.mockRejectedValueOnce(errorDeSegonFactor(CODI_SEGON_FACTOR.SENSE_SESSIO, new Error('invalid JWT')));
    render(<SegonFactor />);
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('No s’ha pogut comprovar el segon factor');
    expect(alerta.textContent).toContain(MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.SENSE_SESSIO]);
    expect(alerta.textContent).not.toContain('invalid JWT');
    await act(async () => { fireEvent.click(within(alerta).getByRole('button', { name: 'Torna-ho a provar' })); });
    expect(await screen.findByText('Sense segon factor')).toBeTruthy();
    expect(m.llista).toHaveBeenCalledTimes(2);
  });

  test('activar: inscriu amb el nom canònic i pinta el QR, la clau a mà, la pista i el camp del codi (6 xifres, numèric, one-time-code)', async () => {
    render(<SegonFactor />);
    await screen.findByText('Sense segon factor');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Activa el segon factor' })); });
    expect(m.inscriu).toHaveBeenCalledTimes(1);
    expect(m.inscriu).toHaveBeenCalledWith(NOM_FACTOR);
    expect(NOM_FACTOR).toBe('Autenticador del Mestre');
    const qr = screen.getByRole('img', { name: 'Codi QR per a l’aplicació d’autenticació' });
    expect(qr.getAttribute('src')).toBe(INSCRIPCIO.qr);
    expect(qr.getAttribute('width')).toBe(qr.getAttribute('height'));
    expect(qr.closest('.sdp-segon-factor__qr')).not.toBeNull();
    const clau = regio().querySelector('code');
    expect(clau.textContent).toBe(INSCRIPCIO.secret);
    expect(regio().textContent).toContain('Google Authenticator, Aegis, FreeOTP');
    const camp = campCodi();
    expect(camp.tagName).toBe('INPUT');
    expect(camp.className).toContain('sdp-control');
    expect(camp.getAttribute('inputmode')).toBe('numeric');
    expect(camp.getAttribute('autocomplete')).toBe('one-time-code');
    expect(camp.getAttribute('maxlength')).toBe(String(XIFRES_CODI));
    expect(screen.getByRole('button', { name: 'Confirma' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Activa el segon factor' })).toBeNull();
    // El camp només accepta xifres.
    fireEvent.change(camp, { target: { value: '12a3-45 6789' } });
    expect(campCodi().value).toBe('123456');
  });

  test('«Confirma» amb menys de 6 xifres no crida el port; amb 6, repta i verifica, i la llista es rellig amb el factor ja verificat', async () => {
    render(<SegonFactor />);
    await screen.findByText('Sense segon factor');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Activa el segon factor' })); });
    await escriuIConfirma('12345', 'Confirma');
    expect(screen.getByRole('alert').textContent).toBe(`Escriu les ${XIFRES_CODI} xifres que mostra l’aplicació d’autenticació.`);
    expect(m.repta).not.toHaveBeenCalled();
    expect(m.verifica).not.toHaveBeenCalled();
    // La sessió nova (aal2) arriba pel context; la llista ja porta el factor verificat.
    m.llista.mockResolvedValue([{ ...VERIFICAT, id: INSCRIPCIO.id }]);
    m.sessio = { ...m.sessio, nivell: 'aal2', calSegonFactor: false };
    await escriuIConfirma('123456', 'Confirma');
    expect(m.repta).toHaveBeenCalledWith(INSCRIPCIO.id);
    expect(m.verifica).toHaveBeenCalledWith({ factorId: INSCRIPCIO.id, repteId: 'r1', codi: '123456' });
    expect(screen.getByText('Segon factor confirmat: esta sessió ja pot administrar.').getAttribute('role')).toBe('status');
    expect(await screen.findByText('Segon factor actiu')).toBeTruthy();
    expect(m.llista).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByLabelText(ETIQUETA_CODI)).toBeNull();
  });

  test('una inscripció deixada a mitges (factor pendent) es retira abans d’inscriure’n una de nova', async () => {
    m.llista.mockResolvedValue([PENDENT]);
    render(<SegonFactor />);
    await screen.findByText('Sense segon factor');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Activa el segon factor' })); });
    expect(m.retira).toHaveBeenCalledWith(PENDENT.id);
    expect(m.inscriu).toHaveBeenCalledTimes(1);
    expect(m.retira.mock.invocationCallOrder[0]).toBeLessThan(m.inscriu.mock.invocationCallOrder[0]);
    expect(screen.getByRole('img')).toBeTruthy();
  });

  test('«Cancel·la» tanca la inscripció, retira el factor pendent del servidor i torna a l’estat d’abans', async () => {
    render(<SegonFactor />);
    await screen.findByText('Sense segon factor');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Activa el segon factor' })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' })); });
    expect(m.retira).toHaveBeenCalledWith(INSCRIPCIO.id);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Activa el segon factor' })).toBeTruthy();
  });

  test.each([
    ['inscriure', 'nom-repetit', (error) => m.inscriu.mockRejectedValueOnce(error), 'Activa el segon factor'],
  ])('un error del port en %s es diu amb la frase del seu codi (%s), mai amb el text del proveïdor', async (_, codi, prepara, boto) => {
    prepara(errorDeSegonFactor(codi, new Error('MFA factor with the friendly name already exists')));
    render(<SegonFactor />);
    await screen.findByText('Sense segon factor');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: boto })); });
    const alerta = screen.getByRole('alert');
    expect(alerta.textContent).toBe(MISSATGE_SEGON_FACTOR[codi]);
    expect(alerta.textContent).not.toMatch(/already exists/);
  });

  test('els errors de repta i de verifica: la frase del codi; sense codi conegut, la genèrica (cap anglés)', async () => {
    render(<SegonFactor />);
    await screen.findByText('Sense segon factor');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Activa el segon factor' })); });
    m.verifica.mockRejectedValueOnce(errorDeSegonFactor(CODI_SEGON_FACTOR.CODI_INVALID, new Error('Invalid TOTP code entered')));
    await escriuIConfirma('000000', 'Confirma');
    expect(screen.getByRole('alert').textContent).toBe(MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.CODI_INVALID]);
    expect(screen.getByRole('img')).toBeTruthy();   // la inscripció continua: es pot tornar a provar
    m.verifica.mockRejectedValueOnce(errorDeSegonFactor(CODI_SEGON_FACTOR.REPTE_CADUCAT));
    await escriuIConfirma('000000', 'Confirma');
    expect(screen.getByRole('alert').textContent).toBe(MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.REPTE_CADUCAT]);
    m.repta.mockRejectedValueOnce(new Error('mfa_challenge_expired: Challenge has expired'));
    await escriuIConfirma('000000', 'Confirma');
    expect(screen.getByRole('alert').textContent).toBe(MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.DESCONEGUT]);
    expect(regio().textContent).not.toMatch(/expired|Invalid/);
    // El servidor que no respon tampoc ix en anglés.
    m.repta.mockRejectedValueOnce(Object.assign(new TypeError('Failed to fetch'), { status: 0 }));
    await escriuIConfirma('000000', 'Confirma');
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut contactar amb el servidor. Comprova la connexió i torna-ho a provar.');
  });

  test('factor verificat i sessió en aal1: el codi i «Confirma amb l’autenticador», sense QR ni «Activa»; confirma amb eixe factor', async () => {
    m.llista.mockResolvedValue([VERIFICAT]);
    render(<SegonFactor />);
    expect(await screen.findByText('Confirma el segon factor en esta sessió')).toBeTruthy();
    expect(regio().textContent).toContain(`«${VERIFICAT.nom}»`);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Activa el segon factor' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retira el segon factor' })).toBeNull();
    expect(m.inscriu).not.toHaveBeenCalled();
    fireEvent.change(campCodi(), { target: { value: '654321' } });
    // El verify desa la sessió nova i el context passa a aal2 (ací, el doble).
    m.sessio = { ...m.sessio, nivell: 'aal2', calSegonFactor: false };
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirma amb l’autenticador' })); });
    expect(m.repta).toHaveBeenCalledWith(VERIFICAT.id);
    expect(m.verifica).toHaveBeenCalledWith({ factorId: VERIFICAT.id, repteId: 'r1', codi: '654321' });
    expect(await screen.findByText('Segon factor actiu')).toBeTruthy();
  });

  test('factor verificat i aal2: «Segon factor actiu» amb el nom, cap camp; «Retira» demana confirmació i només després crida el port', async () => {
    m.llista.mockResolvedValue([VERIFICAT]);
    m.sessio = { nivell: 'aal2', esSuperadmin: true, calSegonFactor: false };
    render(<SegonFactor />);
    expect(await screen.findByText('Segon factor actiu')).toBeTruthy();
    expect(regio().textContent).toContain(`${VERIFICAT.nom}. Esta sessió ja pot administrar.`);
    expect(regio().textContent).toContain('este client no té codis de recuperació');
    expect(screen.queryByLabelText(ETIQUETA_CODI)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Activa el segon factor' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retira el segon factor' }));
    let dialeg = screen.getByRole('dialog', { name: 'Retirar el segon factor?' });
    // Llei de la Por Orgànica: el focus inicial va a «Cancel·lar», i cancel·lar no fa res.
    expect(within(dialeg).getByRole('button', { name: 'Cancel·lar' }).hasAttribute('data-sdp-focus-inicial')).toBe(true);
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    expect(m.retira).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retira el segon factor' }));
    dialeg = screen.getByRole('dialog', { name: 'Retirar el segon factor?' });
    m.llista.mockResolvedValue([]);
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Retira' })); });
    expect(m.retira).toHaveBeenCalledTimes(1);
    expect(m.retira).toHaveBeenCalledWith(VERIFICAT.id);
    expect(screen.getByText('Segon factor retirat. Per a tornar a administrar caldrà activar-ne un altre.').getAttribute('role')).toBe('status');
    // Ningú queda atrapat: sense factor, es pot activar de nou.
    expect(await screen.findByRole('button', { name: 'Activa el segon factor' })).toBeTruthy();
    expect(m.llista).toHaveBeenCalledTimes(2);
  });

  test('si el servidor no deixa retirar, el motiu es diu amb la frase del codi i el factor continua actiu', async () => {
    m.llista.mockResolvedValue([VERIFICAT]);
    m.sessio = { nivell: 'aal2', esSuperadmin: true, calSegonFactor: false };
    m.retira.mockRejectedValueOnce(errorDeSegonFactor(CODI_SEGON_FACTOR.FACTOR_NO_TROBAT, new Error('MFA factor not found')));
    render(<SegonFactor />);
    await screen.findByText('Segon factor actiu');
    fireEvent.click(screen.getByRole('button', { name: 'Retira el segon factor' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retira' })); });
    expect(screen.getByRole('alert').textContent).toBe(MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.FACTOR_NO_TROBAT]);
    expect(screen.getByRole('button', { name: 'Retira el segon factor' }).disabled).toBe(false);
    expect(m.llista).toHaveBeenCalledTimes(1);
  });

  test('la data del factor es pinta si el contracte la porta (creat); sense ella, res inventat', async () => {
    m.sessio = { nivell: 'aal2', esSuperadmin: true, calSegonFactor: false };
    m.llista.mockResolvedValue([{ ...VERIFICAT, creat: '2026-10-02T11:05:00' }]);
    render(<SegonFactor />);
    await screen.findByText('Segon factor actiu');
    expect(regio().textContent).toContain(`${VERIFICAT.nom}, actiu des del 02/10/26.`);
    cleanup();
    m.llista.mockResolvedValue([VERIFICAT]);
    render(<SegonFactor />);
    await screen.findByText('Segon factor actiu');
    expect(regio().textContent).not.toMatch(/actiu des del/);
  });

  test('un factor amb un nom buit es diu pel nom canònic', async () => {
    m.sessio = { nivell: 'aal2', esSuperadmin: true, calSegonFactor: false };
    m.llista.mockResolvedValue([{ ...VERIFICAT, nom: '' }]);
    render(<SegonFactor />);
    await screen.findByText('Segon factor actiu');
    expect(regio().textContent).toContain(`${NOM_FACTOR}. Esta sessió ja pot administrar.`);
  });

  test('un port que torna una llista que no és llista o que llança de manera síncrona no peta', async () => {
    m.llista.mockResolvedValue(null);
    render(<SegonFactor />);
    expect(await screen.findByText('Sense segon factor')).toBeTruthy();
    cleanup();
    m.llista.mockImplementation(() => { throw new Error('[backendPort] El mètode no està implementat'); });
    render(<SegonFactor />);
    expect((await screen.findByRole('alert')).textContent).toContain(MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.DESCONEGUT]);
  });

  test('una resposta tardana després de desmuntar no escriu res (cap avís de React)', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let resol;
    m.llista.mockImplementation(() => new Promise((r) => { resol = r; }));
    const { unmount } = render(<SegonFactor />);
    await act(async () => {});   // la crida al port ix en una microtasca
    expect(m.llista).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { resol([VERIFICAT]); });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  test('Pedra Seca: cap style= en cap estat, i la regió porta el seu nom', async () => {
    m.llista.mockResolvedValue([VERIFICAT]);
    const { container } = render(<SegonFactor />);
    await screen.findByText('Confirma el segon factor en esta sessió');
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.firstElementChild.className).toBe('sdp-segon-factor');
    await waitFor(() => expect(regio()).toBeTruthy());
  });
});
