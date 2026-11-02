import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   IDEA-24 (Llibre Mestre; marató 261101_2143, B4 · M12-B4-UI) · TRANSFERIR
   LA PROPIETAT D'UNA ORGANITZACIÓ

   La propietària d'un grup o d'una empresa cedix la propietat a una persona
   que ja n'és membre, amb una confirmació destructiva (el focus a
   «Cancel·lar»). Confirmada pel port, la destinatària és la propietària i
   ella, administradora: ja no nomena ni lleva administradores ni torna a
   transferir. Mai d'una entitat ni d'un ajuntament, mai cap a una
   organització membre ni a ella mateixa, mai sense la capacitat
   'transferenciaPropietat'; i una resposta tardana d'una altra entitat no hi
   escriu (P1-15).

   Tres capes, de dins cap a fora:
   · GestioMembres, amb les accions a mà;
   · PerfilContext: la capacitat, el port amb la configuració, el rol a
     'admin' al selector d'identitat i la sessió vigent;
   · el camí sencer de l'App: PerfilProvider → DetallCompte («Membres i
     connexions») → GestioMembres, amb el port simulat.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({
  user: { id: 'JO' }, generation: 1, entrada: 1,
  capacitats: new Set(['membresOrganitzacio', 'transferenciaPropietat']),
  /* El port sense el mètode (un node o un mock parcial que no el sap fer). */
  senseMetode: false,
  getProfile: vi.fn(), listMyOrganizations: vi.fn(),
  llistaMembresOrganitzacio: vi.fn(), desaMembreOrganitzacio: vi.fn(), llevaMembreOrganitzacio: vi.fn(), carregaMembres: vi.fn(),
  transfereixPropietatOrganitzacio: vi.fn(),
}));

/* El port, sencer i simulat (cap adaptador de veres): ni la casella de la
   titular ni el veïnat connectat (les seues capacitats no hi són). */
vi.mock('../../data/backendPort.js', () => ({
  getCurrentUser: () => m.user,
  getProfile: (...a) => m.getProfile(...a),
  listMyOrganizations: (...a) => m.listMyOrganizations(...a),
  teCapacitat: (nom) => m.capacitats.has(nom),
  llistaMembresOrganitzacio: (...a) => m.llistaMembresOrganitzacio(...a),
  desaMembreOrganitzacio: (...a) => m.desaMembreOrganitzacio(...a),
  llevaMembreOrganitzacio: (...a) => m.llevaMembreOrganitzacio(...a),
  carregaMembres: (...a) => m.carregaMembres(...a),
  get transfereixPropietatOrganitzacio() { return m.senseMetode ? undefined : m.transfereixPropietatOrganitzacio; },
  updateProfile: vi.fn(), updateOrganization: vi.fn(), updateUserPassword: vi.fn(), createOrganization: vi.fn(), uploadToStorage: vi.fn(),
  llegeixContacteOrganitzacio: vi.fn(), desaContacteOrganitzacio: vi.fn(),
  estatTitularPublic: vi.fn(), marcaTitularPublic: vi.fn(), quiEmSegueix: vi.fn(),
  exportaLesMeuesDades: vi.fn(), estatBaixa: vi.fn(), estatConsentiment: vi.fn(),
}));
vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSession: () => ({ currentUser: m.user, generacio: m.generation, logout: vi.fn() }),
  useSessioOpcional: () => null,
}));
/* Com identitat.js: l'entrada només es mou en eixir o tornar a entrar. */
vi.mock('../../data/identitat.js', async (importOriginal) => ({
  ...(await importOriginal()),
  entradaSessio: () => m.entrada,
  capturaSessio: () => {
    const entrada = m.entrada, actor = m.user?.id;
    return () => { if (entrada !== m.entrada || actor !== m.user?.id) throw new DOMException('La sessió ha canviat.', 'AbortError'); };
  },
}));
/* El que DetallCompte necessita de l'App (com DetallCompte.test.jsx). */
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../admin/SegonFactor.jsx', () => ({ SegonFactor: () => null }));
/* La pàgina, només el contingut: ací no es prova la capçalera. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <main>{children}</main>,
}));

import { GestioMembres } from './GestioMembres.jsx';
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
import { DetallCompte } from './DetallCompte.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';

const persona = (id, nom, rol = 'member') => ({ tipus: 'persona', id, nom, avatar: '', rol, desDe: null });
const org = (id, nom) => ({ tipus: 'organitzacio', id, nom, avatar: '', rol: 'member', desDe: null });
const MEMBRES = () => [persona('JO', 'Jo', 'owner'), persona('A', 'Andreu', 'admin'), persona('M', 'Marta'), org('G', 'Colla')];
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
const errorAmb = (code, missatge = 'Text de l’adaptador que la vista no ha de pintar.') => Object.assign(new Error(missatge), { code });
const textLlegible = (node) => {
  const copia = node.cloneNode(true);
  copia.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return copia.textContent.trim();
};
const rolsDe = (regio) => [...regio.querySelectorAll('tbody tr')]
  .map((tr) => { const td = tr.querySelectorAll('td'); return [textLlegible(td[0]), td[2].textContent]; });
const BOTO = (nom) => ({ name: `Transferir la propietat: ${nom}` });
const CAP_BOTO = { name: /^Transferir la propietat/ };

beforeEach(async () => {
  await cuaDesament.reinicia();
  vi.clearAllMocks();
  m.user = { id: 'JO' }; m.generation = 1; m.entrada = 1;
  m.capacitats = new Set(['membresOrganitzacio', 'transferenciaPropietat']);
  m.senseMetode = false;
  m.getProfile.mockImplementation(async () => ({ id: m.user?.id, full_name: 'Jo' }));
  m.listMyOrganizations.mockImplementation(async () => [{ id: 'O', name: 'Forn', slug: 'forn', kind: 'company', role: 'owner' }]);
  m.llistaMembresOrganitzacio.mockImplementation(async () => MEMBRES());
  m.transfereixPropietatOrganitzacio.mockImplementation(async (orgId, dades) => ({ organizationId: orgId, anticOwnerId: 'JO', nouOwnerId: dades.id }));
});
afterEach(() => { cleanup(); });

/* ═══ 1 · GestioMembres, amb les accions a mà ═══ */
describe('GestioMembres · «Transferir la propietat»', () => {
  const ORG = (kind = 'company', rol = 'owner', id = 'O', nom = 'Forn') => ({ id, mena: 'empresa', nom, dades: { id, name: nom, role: rol, kind } });
  function pinta({ kind = 'company', rol = 'owner', membres = MEMBRES(), transfereixPropietat, organitzacio, ...extra } = {}) {
    const accions = {
      usuariId: 'JO',
      llistaMembres: vi.fn(async () => membres),
      desaMembre: vi.fn(async (_orgId, dades) => ({ ...dades, nom: dades.id, avatar: '', desDe: null })),
      llevaMembre: vi.fn(async () => ({ llevat: true })),
      cercaCandidats: vi.fn(async () => []),
      transfereixPropietat: transfereixPropietat === undefined
        ? vi.fn(async (orgId, membre) => ({ organizationId: orgId, anticOwnerId: 'JO', nouOwnerId: membre.id }))
        : transfereixPropietat,
      ...extra,
    };
    const vista = render(<GestioMembres organitzacio={organitzacio || ORG(kind, rol)} accions={accions} />);
    return { accions, vista };
  }
  const taula = (nom = 'Forn') => screen.findByRole('region', { name: `Membres de ${nom}` });
  const confirma = async () => {
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Transferir la propietat' })); });
  };

  test.each(['company', 'group'])('la propietària (%s) la veu a cada altra persona membre, entre el canvi de rol i «Llevar»; mai a una organització ni a ella', async (kind) => {
    pinta({ kind });
    const regio = await taula();
    expect(within(regio).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Tornar a membre: Andreu', 'Transferir la propietat: Andreu', 'Llevar: Andreu',
      'Nomenar administradora: Marta', 'Transferir la propietat: Marta', 'Llevar: Marta', 'Llevar: Colla',
    ]);
    // El text visible és el de l'acció; el nom només a l'etiqueta accessible.
    expect(within(regio).getByRole('button', BOTO('Marta')).textContent).toBe('Transferir la propietat');
  });

  test.each([
    ['una entitat', { kind: 'entity' }],
    ['un ajuntament', { kind: 'city_hall' }],
    ['sense tipus', { kind: null }],
    ['un tipus desconegut', { kind: 'COMPANY' }],
    ['una administradora', { rol: 'admin' }],
    ['un membre', { rol: 'member' }],
    ['sense la capacitat (accions sense la funció)', { transfereixPropietat: null }],
    ['amb una «funció» que no ho és', { transfereixPropietat: 'sí' }],
  ])('%s: cap «Transferir la propietat»', async (_cas, opcions) => {
    pinta(opcions);
    await taula();
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
  });

  test('un membre sense nom: l’etiqueta i la confirmació diuen «Sense nom», mai un buit', async () => {
    pinta({ membres: [persona('JO', 'Jo', 'owner'), persona('X', '')] });
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Sense nom')));
    const dialeg = screen.getByRole('dialog', { name: 'Transferir la propietat de Forn a Sense nom?' });
    expect(dialeg.textContent).toContain('Sense nom en serà la propietària');
  });

  test('demana confirmació destructiva: diu què canvia, el focus és a «Cancel·lar» i «Cancel·lar» no transferix res', async () => {
    const { accions } = pinta();
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Marta')));
    const dialeg = screen.getByRole('dialog', { name: 'Transferir la propietat de Forn a Marta?' });
    expect(within(dialeg).getByText('Marta en serà la propietària i tu passaràs a administradora: continuaràs gestionant la fitxa i els membres, però ja no podràs nomenar ni llevar administradores. Només Marta et podrà tornar la propietat.')).toBeTruthy();
    expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    // El botó de confirmar és el de perill (destructiu).
    expect(within(dialeg).getByRole('button', { name: 'Transferir la propietat' }).className).toMatch(/perill/);
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    expect(accions.transfereixPropietat).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('Escape tanca la confirmació sense transferir i el focus torna al botó de la fila', async () => {
    const { accions } = pinta();
    await taula();
    const boto = screen.getByRole('button', BOTO('Andreu'));
    boto.focus();
    fireEvent.click(boto);
    const dialeg = screen.getByRole('dialog', { name: 'Transferir la propietat de Forn a Andreu?' });
    const cancel = new Event('cancel', { cancelable: true });
    await act(async () => { dialeg.dispatchEvent(cancel); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(accions.transfereixPropietat).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(boto);
  });

  test('confirmada: el port rep l’entitat i la persona, els dos rols canvien i ja no nomena, ni lleva administradores, ni transferix', async () => {
    const { accions } = pinta();
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Marta')));
    await confirma();
    expect(accions.transfereixPropietat).toHaveBeenCalledTimes(1);
    expect(accions.transfereixPropietat).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'M' });
    expect(screen.queryByRole('dialog')).toBeNull();
    const regio = screen.getByRole('region', { name: 'Membres de Forn' });
    expect(rolsDe(regio)).toEqual([['Marta', 'Propietari'], ['Andreu', 'Administra'], ['Jo (tu)', 'Administra'], ['Colla', 'Membre']]);
    expect(screen.getAllByRole('status').map((n) => n.textContent)).toEqual(['Marta ja és la propietària de Forn. Tu continues com a administradora.']);
    // Ara és administradora: només pot llevar l'organització membre.
    expect(within(regio).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Llevar: Colla']);
    expect(document.activeElement).toBe(regio);
  });

  test('si el port rebutja (006), la confirmació es tanca, l’error té frase de transferència i cap rol canvia', async () => {
    pinta({ transfereixPropietat: vi.fn(async () => { throw errorAmb('SDP-ORGMEM-006', 'SDP-ORGMEM-006: només la propietària pot transferir la titularitat.'); }) });
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Andreu')));
    await confirma();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('Només la propietària pot transferir la propietat.');
    expect(rolsDe(screen.getByRole('region', { name: 'Membres de Forn' }))[0]).toEqual(['Jo (tu)', 'Propietari']);
    // Es pot tornar a provar.
    expect(screen.getByRole('button', BOTO('Andreu'))).toBeTruthy();
  });

  test('003 diu que la destinatària ha de ser membre; un codi de la gestió, la seua frase; sense codi, el genèric (mai el text de l’error)', async () => {
    const casos = [
      [errorAmb('SDP-ORGMEM-003'), 'Només es pot transferir a una persona que siga membre de l’organització i del seu poble i que no haja demanat la baixa.'],
      [errorAmb('SDP-ORGMEM-002'), 'Només qui administra l’organització en veu i en gestiona els membres.'],
      [new Error('Supabase 500: permission denied'), 'No s’ha pogut transferir la propietat.'],
      [errorAmb('__proto__'), 'No s’ha pogut transferir la propietat.'],
    ];
    for (const [error, esperat] of casos) {
      pinta({ transfereixPropietat: vi.fn(async () => { throw error; }) });
      await taula();
      fireEvent.click(screen.getByRole('button', BOTO('Andreu')));
      await confirma();
      expect(screen.getByRole('alert').textContent, String(error.code)).toBe(esperat);
      expect(document.body.textContent).not.toMatch(/Supabase|Text de l’adaptador/);
      cleanup();
    }
  });

  test('un servidor sense la RPC (NO-DISPONIBLE): diu què falta (no «no gestiona els membres») i ja no l’oferix, tampoc en una altra entitat', async () => {
    const transfereixPropietat = vi.fn(async () => { throw errorAmb('NO-DISPONIBLE'); });
    const { accions, vista } = pinta({ transfereixPropietat });
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Andreu')));
    await confirma();
    expect(screen.getByRole('alert').textContent).toBe('El servidor d’este poble encara no sap transferir la propietat de les organitzacions.');
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
    // La resta de la gestió continua: el servidor sí que gestiona els membres.
    expect(screen.getByRole('button', { name: 'Llevar: Andreu' })).toBeTruthy();
    await act(async () => { vista.rerender(<GestioMembres organitzacio={ORG('group', 'owner', 'C', 'Colla')} accions={accions} />); });
    await taula('Colla');
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
    expect(transfereixPropietat).toHaveBeenCalledTimes(1);
  });

  test('un doble clic a la confirmació només crida el port una vegada, i mentre treballa no es tanca', async () => {
    const espera = deferred();
    const transfereixPropietat = vi.fn(() => espera.promise);
    pinta({ transfereixPropietat });
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Marta')));
    const dialeg = screen.getByRole('dialog');
    const boto = within(dialeg).getByRole('button', { name: 'Transferir la propietat' });
    fireEvent.click(boto);
    fireEvent.click(boto);
    expect(transfereixPropietat).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await act(async () => { espera.resolve({ organizationId: 'O', anticOwnerId: 'JO', nouOwnerId: 'M' }); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('P1-15 · la confirmació oberta a O es tanca en canviar a C, i no transferix res', async () => {
    const { accions, vista } = pinta();
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Marta')));
    expect(screen.getByRole('dialog')).toBeTruthy();
    accions.llistaMembres.mockImplementation(async () => [persona('JO', 'Jo', 'owner'), persona('B', 'Berta')]);
    await act(async () => { vista.rerender(<GestioMembres organitzacio={ORG('group', 'owner', 'C', 'Colla')} accions={accions} />); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(accions.transfereixPropietat).not.toHaveBeenCalled();
  });

  test('P1-15 · la cessió d’O que contesta quan ja es veu C no escriu res a C; en tornar a O, encara amb la fitxa vella, ja no s’oferix', async () => {
    const espera = deferred();
    const transfereixPropietat = vi.fn(() => espera.promise);
    const { accions, vista } = pinta({ transfereixPropietat });
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Marta')));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Transferir la propietat' }));
    accions.llistaMembres.mockImplementation(async (orgId) => (orgId === 'C' ? [persona('JO', 'Jo', 'owner'), persona('M', 'Marta')] : MEMBRES()));
    await act(async () => { vista.rerender(<GestioMembres organitzacio={ORG('group', 'owner', 'C', 'Colla')} accions={accions} />); });
    const colla = await taula('Colla');
    await act(async () => { espera.resolve({ organizationId: 'O', anticOwnerId: 'JO', nouOwnerId: 'M' }); });
    expect(rolsDe(colla)).toEqual([['Jo (tu)', 'Propietari'], ['Marta', 'Membre']]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('button', BOTO('Marta'))).toBeTruthy();
    // Tornar a O amb la fitxa que encara diu 'owner' (cap context no l'ha actualitzada): fallada tancada.
    await act(async () => { vista.rerender(<GestioMembres organitzacio={ORG('company', 'owner', 'O', 'Forn')} accions={accions} />); });
    await taula('Forn');
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Nomenar administradora/ })).toBeNull();
  });

  /* Correcció de l'àrbitre (P3-1) · La guarda vigent() del finally de confirmaTransfereix. */
  test('P1-15 · la cessió d’O que torna tard no tanca la confirmació que ja s’ha obert a C, i la de C cedix C', async () => {
    const espera = deferred();
    const transfereixPropietat = vi.fn((orgId, membre) => (orgId === 'O' ? espera.promise
      : Promise.resolve({ organizationId: orgId, anticOwnerId: 'JO', nouOwnerId: membre.id })));
    const { accions, vista } = pinta({ transfereixPropietat });
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Marta')));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Transferir la propietat' }));
    accions.llistaMembres.mockImplementation(async (orgId) => (orgId === 'C' ? [persona('JO', 'Jo', 'owner'), persona('B', 'Berta')] : MEMBRES()));
    await act(async () => { vista.rerender(<GestioMembres organitzacio={ORG('group', 'owner', 'C', 'Colla')} accions={accions} />); });
    await taula('Colla');
    fireEvent.click(screen.getByRole('button', BOTO('Berta')));
    expect(screen.getByRole('dialog', { name: 'Transferir la propietat de Colla a Berta?' })).toBeTruthy();
    await act(async () => { espera.resolve({ organizationId: 'O', anticOwnerId: 'JO', nouOwnerId: 'M' }); });
    // La resposta d'O no la tanca ni hi escriu cap avís.
    expect(screen.getByRole('dialog', { name: 'Transferir la propietat de Colla a Berta?' })).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    await confirma();
    expect(transfereixPropietat).toHaveBeenCalledTimes(2);
    expect(transfereixPropietat).toHaveBeenLastCalledWith('C', { tipus: 'persona', id: 'B' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getAllByRole('status').map((n) => n.textContent)).toEqual(['Berta ja és la propietària de Colla. Tu continues com a administradora.']);
  });

  test('la marca de cedida s’allibera quan la fitxa ja no diu «owner»: si després li tornen la propietat, la torna a oferir', async () => {
    const { accions, vista } = pinta();
    await taula();
    fireEvent.click(screen.getByRole('button', BOTO('Marta')));
    await confirma();
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
    // El context del Perfil diu 'admin' (com fa PerfilContext després de la cessió).
    await act(async () => { vista.rerender(<GestioMembres organitzacio={ORG('company', 'admin')} accions={accions} />); });
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
    // Marta li la torna i la fitxa es rellig: torna a ser la propietària.
    accions.llistaMembres.mockImplementation(async () => MEMBRES());
    await act(async () => { vista.rerender(<GestioMembres organitzacio={ORG('company', 'owner')} accions={{ ...accions, llistaMembres: vi.fn(async () => MEMBRES()) }} />); });
    await waitFor(() => expect(screen.getByRole('button', BOTO('Marta'))).toBeTruthy());
  });
});

/* ═══ 2 · PerfilContext: la capacitat, el port i el rol ═══ */
describe('PerfilContext · transfereixPropietat', () => {
  const CONFIG = { tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase' };
  let valor, avis;
  function Sonda() { valor = usePerfil(); return null; }
  const arbre = () => <StrictMode><PerfilProvider config={CONFIG} onCanviOrganitzacions={avis}><Sonda /></PerfilProvider></StrictMode>;
  async function obri() {
    const vista = render(arbre());
    await waitFor(() => expect(valor.carregant).toBe(false));
    return vista;
  }
  const rolDe = (id) => valor.identitats.find((i) => String(i.id) === id)?.dades?.role;
  beforeEach(() => {
    valor = null;
    avis = vi.fn();
    m.listMyOrganizations.mockImplementation(async () => [
      { id: 'O', name: 'Forn', slug: 'forn', kind: 'company', role: 'owner' },
      { id: 'G', name: 'Colla', slug: 'colla', kind: 'group', role: 'owner' },
    ]);
  });

  test('sense la capacitat, o amb un port sense el mètode, null (la gestió no l’oferix) i cap crida', async () => {
    m.capacitats = new Set(['membresOrganitzacio']);
    await obri();
    expect(valor.ambMembres).toBe(true);
    expect(valor.transfereixPropietat).toBeNull();
    cleanup();
    m.capacitats = new Set(['membresOrganitzacio', 'transferenciaPropietat']);
    m.senseMetode = true;
    await obri();
    expect(valor.transfereixPropietat).toBeNull();
    expect(m.transfereixPropietatOrganitzacio).not.toHaveBeenCalled();
  });

  test('amb la capacitat: crida el port amb la configuració, l’entitat passa a «admin» al selector i avisa una vegada', async () => {
    await obri();
    expect(typeof valor.transfereixPropietat).toBe('function');
    let resultat;
    await act(async () => { resultat = await valor.transfereixPropietat('O', { tipus: 'persona', id: 'M', nom: 'Marta', rol: 'member' }); });
    expect(m.transfereixPropietatOrganitzacio).toHaveBeenCalledTimes(1);
    // Només el tipus i l'id: ni el nom ni el rol de la fila viatgen al port.
    expect(m.transfereixPropietatOrganitzacio).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'M' }, CONFIG);
    expect(resultat).toEqual({ organizationId: 'O', anticOwnerId: 'JO', nouOwnerId: 'M' });
    expect(rolDe('O')).toBe('admin');
    expect(rolDe('G')).toBe('owner');
    expect(valor.identitats.find((i) => i.id === 'O').rol).not.toBe(valor.identitats.find((i) => i.id === 'G').rol);
    expect(avis).toHaveBeenCalledTimes(1);
  });

  test('si el port rebutja, l’error arriba tal qual (amb el code) i cap rol canvia ni s’avisa', async () => {
    await obri();
    m.transfereixPropietatOrganitzacio.mockRejectedValueOnce(errorAmb('SDP-ORGMEM-006'));
    await expect(valor.transfereixPropietat('O', { tipus: 'persona', id: 'M' })).rejects.toMatchObject({ code: 'SDP-ORGMEM-006' });
    expect(rolDe('O')).toBe('owner');
    expect(avis).not.toHaveBeenCalled();
  });

  test('una transferència d’una sessió antiga rebutja sense arribar al port', async () => {
    const vista = await obri();
    const antic = valor;
    m.user = { id: 'ALTRA' }; m.entrada += 1; m.generation += 1;
    vista.rerender(arbre());
    await expect(antic.transfereixPropietat('O', { tipus: 'persona', id: 'M' })).rejects.toMatchObject({ name: 'AbortError' });
    expect(m.transfereixPropietatOrganitzacio).not.toHaveBeenCalled();
  });

  test('la resposta que arriba quan la sessió ja ha canviat no escriu cap rol ni avisa', async () => {
    const vista = await obri();
    const espera = deferred();
    m.transfereixPropietatOrganitzacio.mockReturnValueOnce(espera.promise);
    const antic = valor;
    const crida = antic.transfereixPropietat('O', { tipus: 'persona', id: 'M' });
    const rebuig = expect(crida).rejects.toMatchObject({ name: 'AbortError' });
    m.user = { id: 'ALTRA' }; m.entrada += 1; m.generation += 1;
    vista.rerender(arbre());
    await act(async () => { espera.resolve({ organizationId: 'O', anticOwnerId: 'JO', nouOwnerId: 'M' }); await rebuig; });
    expect(avis).not.toHaveBeenCalled();
  });
});

/* ═══ 3 · El camí sencer: PerfilProvider → DetallCompte → GestioMembres ═══ */
describe('el camí de l’App · «Membres i connexions» d’una empresa', () => {
  const CONFIG = { tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase' };
  let avis;
  /* Com PerfilShell: la identitat ve del context, i canvia quan el context canvia. */
  function Membres() {
    const perfil = usePerfil();
    const identitat = perfil.identitats.find((i) => String(i.id) === 'O');
    return identitat
      ? <DetallCompte identitat={identitat} guardarAjust={async () => undefined} pujaMitja={async () => ''} ambMembres={perfil.ambMembres} lloc="membres" />
      : null;
  }
  const pinta = () => render(<PerfilProvider config={CONFIG} onCanviOrganitzacions={avis}><Membres /></PerfilProvider>);
  beforeEach(() => { avis = vi.fn(); });

  test('la propietària confirma: el port rep la configuració, la llista i la fitxa canvien, i ja no s’oferix', async () => {
    pinta();
    const regio = await screen.findByRole('region', { name: 'Membres de Forn' });
    expect(m.llistaMembresOrganitzacio).toHaveBeenCalledWith('O', expect.objectContaining({ ...CONFIG, signal: expect.any(AbortSignal) }));
    fireEvent.click(within(regio).getByRole('button', BOTO('Marta')));
    const dialeg = screen.getByRole('dialog', { name: 'Transferir la propietat de Forn a Marta?' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Transferir la propietat' })); });
    expect(m.transfereixPropietatOrganitzacio).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'M' }, CONFIG);
    expect(screen.getByRole('status').textContent).toBe('Marta ja és la propietària de Forn. Tu continues com a administradora.');
    expect(rolsDe(screen.getByRole('region', { name: 'Membres de Forn' }))).toEqual([
      ['Marta', 'Propietari'], ['Andreu', 'Administra'], ['Jo (tu)', 'Administra'], ['Colla', 'Membre'],
    ]);
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Nomenar administradora/ })).toBeNull();
    expect(avis).toHaveBeenCalledTimes(1);
  });

  test('sense la capacitat, la gestió dels membres hi és però «Transferir la propietat» no', async () => {
    m.capacitats = new Set(['membresOrganitzacio']);
    pinta();
    const regio = await screen.findByRole('region', { name: 'Membres de Forn' });
    expect(within(regio).getByRole('button', { name: 'Llevar: Marta' })).toBeTruthy();
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
  });

  test('d’una entitat (kind «entity»), tampoc: només grups i empreses', async () => {
    m.listMyOrganizations.mockImplementation(async () => [{ id: 'O', name: 'Forn', slug: 'forn', kind: 'entity', role: 'owner' }]);
    pinta();
    const regio = await screen.findByRole('region', { name: 'Membres de Forn' });
    expect(within(regio).getByRole('button', { name: 'Llevar: Marta' })).toBeTruthy();
    expect(screen.queryByRole('button', CAP_BOTO)).toBeNull();
  });
});
