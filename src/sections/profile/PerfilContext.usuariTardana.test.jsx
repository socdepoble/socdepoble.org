/* QA-H01 (auditoria de Codex 261028_1611) · El nom tardà i l'@usuari.
   Quan el nom de veres arriba després de l'alta (Apple), el disparador de
   2610282100 regenera el comodí sense confirmar («veina») cap a la proposta
   del nom. La fitxa en memòria ha de prendre també username i
   username_confirmat_at, sense trepitjar un @usuari ja triat, sense dades
   d'una sessió anterior i sense llegir res a una base sense la migració. */
import React, { StrictMode } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
const mock = vi.hoisted(() => ({ user: { id: 'A' }, usuariReact: null, epoch: 1, generation: 1, entrada: 1,
  getProfile: vi.fn(), listMyOrganizations: vi.fn(), updateProfile: vi.fn(), updateOrganization: vi.fn(),
  updateUserPassword: vi.fn(), createOrganization: vi.fn(), uploadToStorage: vi.fn(),
  llegeixContacteOrganitzacio: vi.fn(), desaContacteOrganitzacio: vi.fn(),
  llistaMembresOrganitzacio: vi.fn(), desaMembreOrganitzacio: vi.fn(), llevaMembreOrganitzacio: vi.fn(), carregaMembres: vi.fn(),
}));
/* usuariReact: la persona que React encara pinta quan el port ja ha canviat
   (la finestra abans del nou pintat, on l'àmbit vell continua muntat). */
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mock.usuariReact ?? mock.user, generacio: mock.generation }) }));
/* Com identitat.js: l'entrada només es mou en eixir o tornar a entrar. */
vi.mock('../../data/identitat.js', () => ({
  get versioSessio() { return mock.epoch; },
  entradaSessio: () => mock.entrada,
  capturaSessio: () => {
    const entrada = mock.entrada, actor = mock.user?.id;
    return () => { if (entrada !== mock.entrada || actor !== mock.user?.id) throw new DOMException('La sessió ha canviat.', 'AbortError'); };
  },
}));
vi.mock('../../data/backendPort.js', () => ({ ...mock, getCurrentUser: () => mock.user, teCapacitat: () => true }));
import { cuaDesament } from '../../data/autodesament/cua.js';

const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
/* La reconciliació no s'espera: deixa córrer les promeses que encara volen. */
const buida = () => act(async () => { await new Promise((r) => { setTimeout(r, 0); }); });
let value;
function Probe() { value = usePerfil(); return null; }
const tree = (config) => <StrictMode><PerfilProvider config={config}><Probe /></PerfilProvider></StrictMode>;
const CONFIG = { tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase' };
function switchToB() { mock.user = { id: 'B' }; mock.epoch++; mock.generation++; mock.entrada++; }
async function open(config = CONFIG) {
  const view = render(tree(config)); await waitFor(() => expect(value.carregant).toBe(false)); return { ...view, config };
}
const dades = () => value.identitats[0].dades;
const usuari = () => [dades().username, dades().username_confirmat_at];
/* Sintètic: la fila que deixa el disparador (2610282100) després de l'alta sense nom. */
const ALTA_SENSE_NOM = Object.freeze({ id: 'A', full_name: 'Veí/na', username: 'veina', username_confirmat_at: null });
const CONFIRMAT = '2026-10-20T10:00:00Z';

beforeEach(async () => {
  await cuaDesament.reinicia();
  vi.clearAllMocks(); mock.user = { id: 'A' }; mock.usuariReact = null; mock.epoch = 1; mock.generation = 1; mock.entrada = 1;
  // Cap resposta d'una prova que ha fallat no passa a la següent.
  mock.updateProfile.mockReset();
  mock.getProfile.mockImplementation(async () => ({ ...ALTA_SENSE_NOM, id: mock.user?.id }));
  mock.listMyOrganizations.mockImplementation(async () => []);
  mock.llegeixContacteOrganitzacio.mockImplementation(async () => ({ correu: '', public: false, perDefecte: { origen: 'cap', correu: null } }));
});
afterEach(cleanup);

describe('QA-H01 · el nom tardà reconcilia l’@usuari regenerat pel servidor', () => {
  it('la resposta del desat del nom porta l’@usuari nou: la fitxa el pren, sense cap lectura més', async () => {
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    mock.updateProfile.mockResolvedValue({ id: 'A', full_name: 'Anna Pérez', username: 'annaperez', username_confirmat_at: null });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    expect(mock.updateProfile).toHaveBeenCalledWith({ full_name: 'Anna Pérez' }, expect.any(Object));
    expect(dades().full_name).toBe('Anna Pérez');
    expect(usuari()).toEqual(['annaperez', null]);
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures);
    // L'@usuari és de la fila, mai de les metadades del compte (dins del JWT).
    expect(value.usuari.user_metadata.name).toBe('Anna Pérez');
    expect(value.usuari.user_metadata).not.toHaveProperty('username');
    expect(value.usuari.user_metadata).not.toHaveProperty('username_confirmat_at');
  });

  it('el nom del títol, que ix per la cua d’autodesament, també el reconcilia', async () => {
    await open();
    mock.updateProfile.mockImplementation(async (canvis) => ({ ...ALTA_SENSE_NOM, ...canvis, username: 'annaperez' }));
    const ref = { ...value.autodesament, entitat: 'perfil', id: 'jo' };
    cuaDesament.encua(ref, 'title', 'Anna Pérez');
    let desat;
    await act(async () => { desat = await cuaDesament.desaAra(ref, 'title'); });
    expect(desat).toBe(true);
    expect(mock.updateProfile).toHaveBeenCalledWith({ full_name: 'Anna Pérez' }, expect.any(Object));
    await waitFor(() => expect(usuari()).toEqual(['annaperez', null]));
    expect(dades().full_name).toBe('Anna Pérez');
  });

  it('una confirmació de la cua mentre es llig el perfil: la lectura d’abans del PATCH no torna el comodí', async () => {
    const orgs = deferred();
    mock.listMyOrganizations.mockImplementation(() => orgs.promise);
    mock.updateProfile.mockImplementation(async (canvis) => ({ ...ALTA_SENSE_NOM, ...canvis, username: 'annaperez' }));
    render(tree(CONFIG));
    expect(value.carregant).toBe(true);
    const ref = { ...value.autodesament, entitat: 'perfil', id: 'jo' };
    cuaDesament.encua(ref, 'title', 'Anna Pérez');
    await act(async () => { await cuaDesament.desaAra(ref, 'title'); });
    await act(async () => { orgs.resolve([]); });
    await waitFor(() => expect(value.carregant).toBe(false));
    expect(dades().full_name).toBe('Anna Pérez');
    expect(usuari()).toEqual(['annaperez', null]);
  });

  it('sense les columnes a la resposta i amb el comodí a la fitxa, es rellig la fila una vegada', async () => {
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    mock.updateProfile.mockResolvedValue({ id: 'A', full_name: 'Anna Pérez' });
    mock.getProfile.mockImplementation(async () => ({ ...ALTA_SENSE_NOM, full_name: 'Anna Pérez', username: 'annaperez' }));
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    await buida();
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures + 1);
    expect(dades().full_name).toBe('Anna Pérez');
    expect(usuari()).toEqual(['annaperez', null]);
    expect(value.usuari.user_metadata).not.toHaveProperty('username');
  });

  it('una relectura que no torna no reté el desat del nom, que ja és fet', async () => {
    await open();
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Anna Pérez' });
    mock.getProfile.mockImplementation(() => new Promise(() => {}));
    let resolt = false;
    await act(async () => { void value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo').then(() => { resolt = true; }); });
    await buida();
    expect(resolt).toBe(true);
    expect(dades().full_name).toBe('Anna Pérez');
  });

  it.each(['veina-2', 'veina-1a2b3c4d'])('el comodí amb sufix (%s) també es reconcilia', async (comodi) => {
    mock.getProfile.mockImplementation(async () => ({ ...ALTA_SENSE_NOM, username: comodi }));
    await open();
    mock.updateProfile.mockResolvedValueOnce({ ...ALTA_SENSE_NOM, full_name: 'Anna Pérez', username: 'annaperez' });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    expect(usuari()).toEqual(['annaperez', null]);
  });

  it('una proposta ja regenerada no torna al comodí per una resposta que encara el porta', async () => {
    mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Anna Pérez', username: 'annaperez', username_confirmat_at: null }));
    await open();
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Anna P.', username: 'veina', username_confirmat_at: null });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna P.', 'jo'));
    expect(usuari()).toEqual(['annaperez', null]);
  });

  it('confirmat en una altra pestanya: la resposta del nom ho porta i la proposta vella se’n va', async () => {
    mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Anna Pérez', username: 'annaperez', username_confirmat_at: null }));
    await open();
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Anna Pérez Soler', username: 'pepeta', username_confirmat_at: CONFIRMAT });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez Soler', 'jo'));
    expect(usuari()).toEqual(['pepeta', CONFIRMAT]);
  });

  it('només el nom reconcilia: desar un altre camp no rellig res', async () => {
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', bio: 'Pastera' });
    await act(async () => value.guardarCampPerfil('bio', 'Pastera', 'jo'));
    await buida();
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures);
    expect(usuari()).toEqual(['veina', null]);
  });

  it('la resposta del nom amb la fila d’una altra persona no aterra', async () => {
    await open();
    mock.updateProfile.mockResolvedValueOnce({ id: 'B', full_name: 'Berta', username: 'bertaborras', username_confirmat_at: null });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    await buida();
    expect(usuari()).toEqual(['veina', null]);
  });

  it.each([
    ['la d’una altra persona', { id: 'B', full_name: 'Berta', username: 'bertaborras', username_confirmat_at: null }],
    ['la de reserva', { reserva: true, id: 'A', full_name: 'Anna Pérez', username: 'annaperez', username_confirmat_at: null }],
  ])('una relectura que torna %s no aterra', async (_, rellegida) => {
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Anna Pérez' });
    mock.getProfile.mockImplementation(async () => rellegida);
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    await buida();
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures + 1);
    expect(usuari()).toEqual(['veina', null]);
  });

  it('una resposta sense id (la fila del port) també compta', async () => {
    await open();
    mock.updateProfile.mockResolvedValueOnce({ full_name: 'Anna Pérez', username: 'annaperez', username_confirmat_at: null });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    expect(usuari()).toEqual(['annaperez', null]);
  });

  /* Dos desats del nom mentre es llig el perfil (la lectura és d'abans del
     PATCH): la captura guarda el que val més, amb la mateixa regla que la fitxa. */
  async function obriSenseAcabarDeLlegir() {
    const orgs = deferred();
    mock.listMyOrganizations.mockImplementation(() => orgs.promise);
    render(tree(CONFIG));
    expect(value.carregant).toBe(true);
    return async () => {
      await act(async () => { orgs.resolve([]); });
      await waitFor(() => expect(value.carregant).toBe(false));
    };
  }

  it('dos desats del nom durant la càrrega que tornen desordenats: guanya el regenerat', async () => {
    const acabaDeLlegir = await obriSenseAcabarDeLlegir();
    const vell = deferred();
    mock.updateProfile
      .mockReturnValueOnce(vell.promise)
      .mockResolvedValueOnce({ ...ALTA_SENSE_NOM, full_name: 'Anna Pérez', username: 'annaperez' });
    const primer = value.guardarCampPerfil('full_name', 'Veí/na', 'jo');
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    // El PATCH que va passar primer (sense regenerar) respon l'últim.
    await act(async () => { vell.resolve({ ...ALTA_SENSE_NOM }); await primer; });
    await acabaDeLlegir();
    expect(usuari()).toEqual(['annaperez', null]);
  });

  it('dos desats del nom durant la càrrega, el segon amb l’@usuari confirmat en una altra pestanya', async () => {
    const acabaDeLlegir = await obriSenseAcabarDeLlegir();
    mock.updateProfile
      .mockResolvedValueOnce({ ...ALTA_SENSE_NOM, full_name: 'Anna Pérez', username: 'annaperez' })
      .mockResolvedValueOnce({ id: 'A', full_name: 'Anna Pérez Soler', username: 'pepeta', username_confirmat_at: CONFIRMAT });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez Soler', 'jo'));
    await acabaDeLlegir();
    expect(usuari()).toEqual(['pepeta', CONFIRMAT]);
  });

  it('un @usuari confirmat no el toca un canvi de nom posterior (ni la resposta ni cap lectura)', async () => {
    mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Anna Pérez', username: 'pepeta', username_confirmat_at: CONFIRMAT }));
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    // Una resposta (sintètica) que portara una proposta: la fitxa no la pren.
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Bea Soler', username: 'beasoler', username_confirmat_at: null });
    await act(async () => value.guardarCampPerfil('full_name', 'Bea Soler', 'jo'));
    expect(dades().full_name).toBe('Bea Soler');
    expect(usuari()).toEqual(['pepeta', CONFIRMAT]);
    // I sense les columnes a la resposta, cap lectura: no hi ha comodí.
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Carla Vidal' });
    await act(async () => value.guardarCampPerfil('full_name', 'Carla Vidal', 'jo'));
    expect(usuari()).toEqual(['pepeta', CONFIRMAT]);
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures);
  });

  it.each([
    ['pepeta', 'la proposta regenerada', { username: 'annaperez', username_confirmat_at: null }],
    ['pepeta', 'un @usuari confirmat abans', { username: 'anna', username_confirmat_at: '2026-10-01T08:00:00Z' }],
    ['veina', 'la proposta regenerada (el comodí era el triat)', { username: 'annaperez', username_confirmat_at: null }],
  ])('la resposta tardana del nom no desfà @%s confirmat entretant (porta %s)', async (triat, _, vell) => {
    await open();
    const nom = deferred();
    mock.updateProfile
      .mockReturnValueOnce(nom.promise)
      .mockResolvedValueOnce({ id: 'A', username: triat, username_confirmat_at: CONFIRMAT });
    const treball = value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo');
    await act(async () => value.guardarCampPerfil('username', triat, 'jo'));
    expect(usuari()).toEqual([triat, CONFIRMAT]);
    // El PATCH del nom va passar abans que la RPC, però la resposta arriba ara.
    await act(async () => { nom.resolve({ id: 'A', full_name: 'Anna Pérez', ...vell }); await treball; });
    expect(dades().full_name).toBe('Anna Pérez');
    expect(usuari()).toEqual([triat, CONFIRMAT]);
  });

  it('la resposta del nom d’A que arriba després de canviar a B es descarta', async () => {
    const view = await open();
    const nom = deferred();
    mock.updateProfile.mockReturnValueOnce(nom.promise);
    const treball = value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo');
    const avortat = expect(treball).rejects.toMatchObject({ name: 'AbortError' });
    switchToB(); view.rerender(tree(view.config));
    await waitFor(() => expect(dades()?.id).toBe('B'));
    await act(async () => { nom.resolve({ id: 'A', full_name: 'Anna Pérez', username: 'annaperez', username_confirmat_at: null }); await avortat; });
    expect(dades().id).toBe('B');
    expect([dades().full_name, ...usuari()]).toEqual(['Veí/na', 'veina', null]);
  });

  it('la lectura d’A que arriba després de canviar a B es descarta i el desat no falla', async () => {
    const view = await open();
    const lectura = deferred();
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Anna Pérez' });
    mock.getProfile.mockImplementation(() => (mock.user.id === 'A' ? lectura.promise : Promise.resolve({ ...ALTA_SENSE_NOM, id: 'B' })));
    const lectures = mock.getProfile.mock.calls.length;
    const treball = value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo');
    await waitFor(() => expect(mock.getProfile).toHaveBeenCalledTimes(lectures + 1));
    switchToB(); view.rerender(tree(view.config));
    await waitFor(() => expect(dades()?.id).toBe('B'));
    await act(async () => { lectura.resolve({ ...ALTA_SENSE_NOM, full_name: 'Anna Pérez', username: 'annaperez' }); await treball; });
    await expect(treball).resolves.toBeUndefined();
    expect(dades().id).toBe('B');
    expect(usuari()).toEqual(['veina', null]);
  });

  /* La finestra abans del nou pintat: el port ja ha canviat i l'àmbit vell
     continua muntat. Ací només la guarda de la sessió (assertCurrent) para. */
  it('la relectura que torna quan la mateixa persona ja ha tornat a entrar no aterra en l’àmbit vell', async () => {
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    const lectura = deferred();
    mock.updateProfile.mockResolvedValueOnce({ id: 'A', full_name: 'Anna Pérez' });
    mock.getProfile.mockImplementation(() => lectura.promise);
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    await waitFor(() => expect(mock.getProfile).toHaveBeenCalledTimes(lectures + 1));
    mock.usuariReact = { id: 'A' }; mock.entrada++;
    await act(async () => { lectura.resolve({ ...ALTA_SENSE_NOM, full_name: 'Anna Pérez', username: 'annaperez' }); });
    await buida();
    expect(usuari()).toEqual(['veina', null]);
  });

  it('el desat de la cua que torna quan el port ja és de B no rellig res amb la sessió de B', async () => {
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    const nom = deferred();
    mock.updateProfile.mockReturnValueOnce(nom.promise);
    const ref = { ...value.autodesament, entitat: 'perfil', id: 'jo' };
    cuaDesament.encua(ref, 'title', 'Anna Pérez');
    const desat = cuaDesament.desaAra(ref, 'title');
    await waitFor(() => expect(mock.updateProfile).toHaveBeenCalled());
    mock.usuariReact = { id: 'A' }; mock.user = { id: 'B' }; mock.entrada++;
    await act(async () => { nom.resolve({ id: 'A', full_name: 'Anna Pérez' }); await desat; });
    await buida();
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures);
    expect(dades().id).toBe('A');
    expect(usuari()).toEqual(['veina', null]);
  });

  it('desar l’@usuari continua igual: el valor canònic de la RPC, sense cap lectura ni metadades', async () => {
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    mock.updateProfile.mockResolvedValue({ id: 'A', username: 'annaperez', username_confirmat_at: '2026-10-29T00:00:00Z' });
    await act(async () => value.guardarCampPerfil('username', 'annaperez', 'jo'));
    expect(mock.updateProfile).toHaveBeenCalledWith({ username: 'annaperez' }, expect.any(Object));
    expect(usuari()).toEqual(['annaperez', '2026-10-29T00:00:00Z']);
    expect(dades().full_name).toBe('Veí/na');
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures);
    expect(value.usuari.user_metadata ?? {}).not.toHaveProperty('username');
  });

  it('producció sense 2610282100: cap columna username, cap lectura i el nom es desa com sempre', async () => {
    mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Veí/na' }));
    await open();
    const lectures = mock.getProfile.mock.calls.length;
    mock.updateProfile.mockResolvedValue({ id: 'A', full_name: 'Anna Pérez' });
    await act(async () => value.guardarCampPerfil('full_name', 'Anna Pérez', 'jo'));
    // I per la cua, igual.
    const ref = { ...value.autodesament, entitat: 'perfil', id: 'jo' };
    cuaDesament.encua(ref, 'title', 'Anna Pérez Soler');
    mock.updateProfile.mockResolvedValue({ id: 'A', full_name: 'Anna Pérez Soler' });
    await act(async () => { await cuaDesament.desaAra(ref, 'title'); });
    await waitFor(() => expect(dades().full_name).toBe('Anna Pérez Soler'));
    expect(mock.getProfile).toHaveBeenCalledTimes(lectures);
    expect(dades()).not.toHaveProperty('username');
    expect(dades()).not.toHaveProperty('username_confirmat_at');
    expect(value.usuari.user_metadata.name).toBe('Anna Pérez Soler');
    expect(value.usuari.user_metadata).not.toHaveProperty('username');
  });
});
