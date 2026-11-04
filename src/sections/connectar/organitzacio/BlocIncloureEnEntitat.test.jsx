import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · Targeta 2 quan es
   visita una PERSONA: qui administra entitats la inclou en 1 clic a l'entitat
   triada, amb el rol. «Usuari / Membre» per defecte; «Administrador», només la
   propietària i amb confirmació; «Treballador / Soci», desactivat (el servidor
   no el sap desar). Abans es llig si ja en forma part (només el seu rol: C10).
   El port es simula: cap prova no escriu enlloc de veres. */
const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), canCreate: true, user: { id: 'U' },
  params: new URLSearchParams(), config: {}, t: (_, alternativa) => alternativa, identitat: null,
  xat: { chatThreads: [], cercaMembres: vi.fn(), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  capacitats: new Set(), perfil: vi.fn(), segueix: vi.fn(), deixa: vi.fn(), estat: vi.fn(), titular: vi.fn(),
  llista: vi.fn(), desa: vi.fn(), preferencies: vi.fn(), inclouConnexions: vi.fn()
}));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navigate,
  useSearchParams: () => [m.params],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: m.t }), useUIActionsOpcional: () => ({ t: m.t }) }));
vi.mock('../../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../../xat/XatContext.jsx', () => ({ useXat: () => m.xat }));
vi.mock('../../mur/MurContext', () => ({ useMur: () => m.mur }));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => m.core }));
vi.mock('../../multimedia/MultimediaContext', () => ({ useMultimedia: () => m.media }));
vi.mock('../../notes/NotesDataContext', () => ({
  useNotesData: () => ({
    noteFolders: [], notes: [], creaNota: m.crea, updateNote: vi.fn(),
    canCreate: m.canCreate, config: m.config, status: 'ready', error: null, refresh: vi.fn()
  })
}));
/* El port, parcial: la resta d'exportacions és la de veres. */
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => m.capacitats.has(cap),
  loadPerfilPublic: (...args) => m.perfil(...args),
  segueix: (...args) => m.segueix(...args),
  deixaDeSeguir: (...args) => m.deixa(...args),
  estatSeguiment: (...args) => m.estat(...args),
  loadTitularPublic: (...args) => m.titular(...args),
  llistaMembresOrganitzacio: (...args) => m.llista(...args),
  desaMembreOrganitzacio: (...args) => m.desa(...args),
  preferenciesConnexions: (...args) => m.preferencies(...args),
  inclouPersonaEnEntitat: (...args) => m.inclouConnexions(...args)
}));
import ConnectarSection from '../ConnectarSection.jsx';
import { BlocIncloureEnEntitat } from './BlocIncloureEnEntitat.jsx';
import { configuraBackendSessio, desaSessio, entradaSessio } from '../../../data/identitat.js';
import { rolDeLaPersona, useIncloureEnEntitat } from './useIncloureEnEntitat.js';
import { XatSocDePobleContext } from '../../../components/PedraSeca/hooks/xatSocDePoble.js';
import { ERRORS_MEMBRES, TEXTOS_MEMBRES } from '../../profile/GestioMembres.jsx';
import { oblidaSondaConnexions } from '../sondaConnexions.js';

const UUID_PEPA = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const UUID_ORG = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091';
const UUID_SOCDEPOBLE = '0e9d8c7b-6a5f-4e3d-9c2b-1a0f9e8d7c6b';
const PEPA = Object.freeze({ tipus: 'persona', id: UUID_PEPA, nom: 'Pepa Soler', poble: 'La Torre' });
const TONI = Object.freeze({ tipus: 'persona', id: 'U', nom: 'Toni Ferrer' });
const RENTONAR = Object.freeze({ tipus: 'entitat', id: 'org-r', nom: 'El Rentonar', rol: 'owner', kind: 'entity' });
const FORN = Object.freeze({ tipus: 'entitat', id: 'org-f', nom: 'Forn de la Torre', rol: 'admin', kind: 'company' });
const PERFIL_PEPA = `item_id=${UUID_PEPA}&title=Impostora&sectionId=perfil&objecte=persona&ruta=%2Fgent%2F${UUID_PEPA}`;
const PERFIL_ORG = `item_id=${UUID_ORG}&title=Impostora&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2F${UUID_ORG}&organitzacio=${UUID_ORG}`;
const XAT_REMOT = Object.freeze({ estat: 'remot', href: `/xat?amb=${UUID_SOCDEPOBLE}`, avis: null, resol: null });
const vista = () => <XatSocDePobleContext.Provider value={XAT_REMOT}><ConnectarSection /></XatSocDePobleContext.Provider>;
const ENTITATS = Object.freeze([
  { valor: 'org-r', etiqueta: 'El Rentonar (entitat)', nom: 'El Rentonar', rol: 'owner' },
  { valor: 'org-f', etiqueta: 'Forn de la Torre (empresa)', nom: 'Forn de la Torre', rol: 'admin' }
]);
const bloc = (props = {}) => <BlocIncloureEnEntitat entitats={ENTITATS} persona={{ id: UUID_PEPA, nom: 'Pepa Soler' }} config={{}} usuariId="U" {...props} />;
const titol = () => screen.queryByRole('heading', { name: 'Incloure Pepa Soler en una entitat teua' });
const membre = (rol, id = UUID_PEPA) => ({ tipus: 'persona', id, nom: 'Algú', avatar: '', rol, desDe: null });
const ambCodi = (code) => Object.assign(new Error('Supabase 400: cru'), code ? { code } : {});

afterEach(cleanup);
beforeEach(() => {
  oblidaSondaConnexions();
  vi.clearAllMocks();
  m.canCreate = true;
  m.user = { id: 'U' };
  m.config = {};
  m.t = (_, alternativa) => alternativa;
  m.params = new URLSearchParams(PERFIL_PEPA);
  m.identitat = { actor: TONI, identitats: [TONI, RENTONAR, FORN], memberships: [] };
  m.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [] };
  m.capacitats = new Set(['directori', 'seguiments', 'membresOrganitzacio']);
  m.perfil.mockImplementation(async (id) => (id === UUID_PEPA ? PEPA : id === UUID_ORG ? { tipus: 'entitat', id: UUID_ORG, nom: 'La Colla' } : null));
  m.estat.mockResolvedValue({ seguint: false, creatAl: null });
  m.titular.mockResolvedValue(null);
  m.llista.mockResolvedValue([membre('member', 'una-altra')]);
  m.desa.mockImplementation(async (_org, dades) => ({ ...membre(dades.rol, dades.id), nom: 'Pepa Soler' }));
  m.xat.creaFil.mockImplementation(async (id) => `f-${id}`);
  m.xat.sendChatMessage.mockImplementation(async () => [{ id: 'm-1' }]);
});

describe('a /connectar · quan es pinta i quan no', () => {
  test('visitant una persona amb entitats administrades: la targeta «Incloure en la teua entitat» porta incloure-la', async () => {
    render(vista());
    /* Actualitzada a posta (revisió 261104, RA-03): el rètol diu el que fa, no «Formar part». */
    const targeta = await screen.findByRole('group', { name: 'Incloure en la teua entitat' });
    const titolDeLaTargeta = await within(targeta).findByRole('heading', { name: 'Incloure Pepa Soler en una entitat teua' });
    /* RA-03 · L'h3, només per al lector de pantalla: el rètol ja es veu i el botó diu a qui i on. */
    expect(titolDeLaTargeta.classList.contains('sdp-sr-only')).toBe(true);
    /* Ve després de la connexió directa i abans del plegable de les notes (ordre del DOM). */
    const directa = screen.getByRole('group', { name: 'Connexió directa' });
    expect(directa.compareDocumentPosition(targeta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(targeta.compareDocumentPosition(document.querySelector('details.sdp-connectar__notes')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(targeta.textContent).not.toContain('Impostora');
  });

  test.each([
    ['sense la capacitat de membres', () => { m.capacitats = new Set(['directori', 'seguiments']); }],
    ['sense cap entitat administrada', () => { m.identitat = { actor: TONI, identitats: [TONI, { ...FORN, rol: 'member' }], memberships: [] }; }],
    ['en el perfil propi', () => {
      m.user = { id: UUID_PEPA };
      m.identitat = { actor: PEPA, identitats: [PEPA, RENTONAR], memberships: [] };
    }]
  ])('%s, cap targeta d’incloure', async (_, prepara) => {
    prepara();
    render(vista());
    await waitFor(() => expect(m.perfil).toHaveBeenCalled());
    await act(async () => {});
    expect(titol()).toBeNull();
    expect(m.llista).not.toHaveBeenCalled();
  });

  test('sense sessió, cap targeta d’incloure', async () => {
    m.user = null;
    render(vista());
    await act(async () => {});
    expect(titol()).toBeNull();
    expect(m.llista).not.toHaveBeenCalled();
  });

  test('visitant una entitat, la targeta 2 és formar-ne part, no incloure', async () => {
    m.params = new URLSearchParams(PERFIL_ORG);
    render(vista());
    expect(await screen.findByRole('heading', { name: 'Formar part de l’entitat' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /^Incloure / })).toBeNull();
    expect(m.llista).not.toHaveBeenCalled();
  });

  test('en un element (disposició «element»), mai', async () => {
    m.params = new URLSearchParams('item_id=samarreta&title=Samarreta&sectionId=mercat');
    m.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [{ id: 'samarreta', title: 'Samarreta', author_name: 'Pepa Soler', author_user_id: UUID_PEPA }] };
    render(vista());
    expect(await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /^Incloure / })).toBeNull();
    expect(m.llista).not.toHaveBeenCalled();
  });
});

describe('la lectura · una per backend, entitat i persona, i només el rol', () => {
  test('per defecte, la primera entitat on és propietària; canviar d’entitat torna a llegir i la resposta tardana no es pinta', async () => {
    const pendents = {};
    m.llista.mockImplementation((org) => new Promise((resol) => { pendents[org] = resol; }));
    render(bloc({ entitats: [ENTITATS[1], ENTITATS[0]] }));
    await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
    expect(m.llista).toHaveBeenCalledWith('org-r', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    const seccio = titol().closest('section');
    expect(seccio.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Comprovant si Pepa Soler ja forma part de El Rentonar…')).toBeTruthy();
    /* Sense cap role=status mentre comprova. */
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Forn de la Torre (empresa)' }));
    await waitFor(() => expect(m.llista).toHaveBeenLastCalledWith('org-f', expect.objectContaining({ signal: expect.any(AbortSignal) })));
    await act(async () => { pendents['org-r']([membre('owner')]); });
    expect(screen.queryByText(/^Pepa Soler és la propietària/)).toBeNull();
    expect(screen.getByText('Comprovant si Pepa Soler ja forma part de Forn de la Torre…')).toBeTruthy();
    await act(async () => { pendents['org-f']([membre('member')]); });
    expect(screen.getByText('Pepa Soler ja és membre de Forn de la Torre.')).toBeTruthy();
    expect(seccio.getAttribute('aria-busy')).toBeNull();
  });

  test('un altre backend és una altra clau: la resposta del vell no es pinta', async () => {
    const pendents = [];
    m.llista.mockImplementation(() => new Promise((resol) => { pendents.push(resol); }));
    const { rerender } = render(bloc({ config: { dataMode: 'seed' } }));
    await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
    rerender(bloc({ config: { dataMode: 'local' } }));
    await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(2));
    await act(async () => { pendents[0]([membre('admin')]); });
    expect(screen.queryByText(/ja administra/)).toBeNull();
    await act(async () => { pendents[1]([]); });
    expect(screen.getByRole('group', { name: 'Amb quin rol?' })).toBeTruthy();
  });

  test('C10 · el hook només torna el rol de la persona, mai la llista de membres', async () => {
    m.llista.mockResolvedValue([membre('admin', 'una-altra'), membre('member'), { tipus: 'organitzacio', id: UUID_PEPA, rol: 'admin' }]);
    const { result } = renderHook(() => useIncloureEnEntitat({ orgId: 'org-r', personaId: UUID_PEPA, config: {}, usuariId: 'U' }));
    await waitFor(() => expect(result.current.estat).toBe('llest'));
    /* Integració 261104 · ambFuncions és un sí o un no, mai la llista de connexions. */
    expect(Object.keys(result.current).sort()).toEqual(['ambFuncions', 'error', 'estat', 'inclou', 'ocupat', 'resultat', 'rolActual']);
    expect(result.current.ambFuncions).toBe(false);
    expect(result.current.rolActual).toBe('member');
    expect(rolDeLaPersona([{ tipus: 'organitzacio', id: 'x', rol: 'owner' }], 'x')).toBeNull();
    expect(rolDeLaPersona(null, 'x')).toBeNull();
  });
});

describe('incloure', () => {
  test('membre en 1 clic: l’alta directa, el resultat i el focus al resultat', async () => {
    render(bloc());
    const boto = await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    expect(screen.getByRole('radio', { name: /^Usuari \/ Membre/ }).checked).toBe(true);
    /* C-01 (revisió 261104) · Les conseqüències, just abans del botó i en la seua descripció. */
    const avis = 'L’alta és directa i sense cap avís: parleu-ne abans. Ho veuran qui administra El Rentonar i Pepa Soler, al seu Perfil, d’on en podrà eixir quan vullga. De moment no es publica enlloc.';
    expect(boto.getAttribute('aria-describedby')).toBeTruthy();
    expect(boto.getAttribute('aria-describedby').split(' ').map((idAvis) => document.getElementById(idAvis)?.textContent)).toEqual([avis]);
    expect(screen.getByText(avis).compareDocumentPosition(boto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Formar part és una pertinença formal, no una connexió. Només s’hi pot incloure veïnat del poble de l’entitat.')).toBeTruthy();
    await act(async () => { fireEvent.click(boto); });
    expect(m.desa).toHaveBeenCalledTimes(1);
    expect(m.desa).toHaveBeenCalledWith('org-r', { tipus: 'persona', id: UUID_PEPA, rol: 'member' }, {});
    expect(screen.getByRole('status').textContent).toBe('Fet: Pepa Soler ja forma part de El Rentonar com a membre.');
    /* Actualitzada a posta (revisió 261104, RA-03): l'h3 no es veu; el focus va al resultat. */
    expect(document.activeElement).toBe(screen.getByRole('status'));
    expect(screen.getByText('Pepa Soler ja és membre de El Rentonar.')).toBeTruthy();
    expect(m.segueix).not.toHaveBeenCalled();
    expect(m.xat.creaFil).not.toHaveBeenCalled();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
  });

  test('«Treballador / Soci» va desactivat amb el motiu dins de l’etiqueta', async () => {
    render(bloc());
    const treballador = await screen.findByRole('radio', { name: /^Treballador \/ Soci/ });
    expect(treballador.disabled).toBe(true);
    expect(treballador.closest('.sdp-casella').textContent).toContain('Encara no es pot desar: el servidor del poble només distingix administradores i membres.');
  });

  test('administradora: només la propietària, amb confirmació; cancel·lar no escriu', async () => {
    render(bloc());
    fireEvent.click(await screen.findByRole('radio', { name: /^Administrador/ }));
    const boto = screen.getByRole('button', { name: 'Incloure Pepa Soler a El Rentonar i donar-li l’administració' });
    fireEvent.click(boto);
    const dialeg = screen.getByRole('dialog', { name: 'Donar l’administració de El Rentonar a Pepa Soler?' });
    expect(dialeg.textContent).toContain('Podrà editar la fitxa, gestionar els membres, respondre el xat de l’entitat i publicar en el seu nom.');
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(m.desa).not.toHaveBeenCalled();
    fireEvent.click(boto);
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Donar l’administració' })); });
    expect(m.desa).toHaveBeenCalledWith('org-r', { tipus: 'persona', id: UUID_PEPA, rol: 'admin' }, {});
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Fet: Pepa Soler ja administra El Rentonar.');
    /* Actualitzada a posta (revisió 261104, RA-03): el focus va al resultat, també després del diàleg. */
    expect(document.activeElement).toBe(screen.getByRole('status'));
  });

  test('RA-05 · la fitxa diu un altre poble: es diu abans del clic i en la descripció del botó, sense desactivar-lo', async () => {
    const ambPobles = [{ ...ENTITATS[0], poble: 'La Torre de les Maçanes' }, { ...ENTITATS[1], poble: '  la torre de les  maçanes ' }];
    const vista1 = render(bloc({ entitats: ambPobles, persona: { id: UUID_PEPA, nom: 'Pepa Soler', poble: 'Relleu' } }));
    const boto = await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    const altre = 'La fitxa de Pepa Soler diu Relleu, i a El Rentonar només s’hi pot incloure veïnat de La Torre de les Maçanes: si no hi consta, l’alta no es podrà fer.';
    expect(screen.getByText(altre).compareDocumentPosition(boto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const descrit = boto.getAttribute('aria-describedby').split(' ');
    expect(descrit).toHaveLength(2);
    expect(document.getElementById(descrit[1]).textContent).toBe(altre);
    expect(boto.disabled).toBe(false);
    vista1.unmount();
    /* El mateix poble (majúscules i espais a banda), o un poble desconegut: cap línia. */
    for (const persona of [{ id: UUID_PEPA, nom: 'Pepa Soler', poble: 'La Torre de les Maçanes' }, { id: UUID_PEPA, nom: 'Pepa Soler', poble: '' }]) {
      const vista2 = render(bloc({ entitats: [ambPobles[1]], persona }));
      const boto2 = await screen.findByRole('button', { name: 'Incloure Pepa Soler a Forn de la Torre' });
      expect(boto2.getAttribute('aria-describedby').split(' ')).toHaveLength(1);
      expect(screen.queryByText(/^La fitxa de /)).toBeNull();
      vista2.unmount();
    }
  });

  test('una administradora (no propietària) no pot nomenar administradores', async () => {
    render(bloc({ entitats: [ENTITATS[1]] }));
    const admin = await screen.findByRole('radio', { name: /^Administrador/ });
    expect(admin.disabled).toBe(true);
    expect(admin.closest('.sdp-casella').textContent).toContain('Només la propietària de l’entitat nomena administradores.');
    /* Una sola entitat: cap selector «A quina entitat?». */
    expect(screen.queryByRole('radiogroup', { name: 'A quina entitat?' })).toBeNull();
  });
});

describe('el rol actual', () => {
  test.each([
    ['owner', 'Pepa Soler és la propietària de El Rentonar.', null],
    ['admin', 'Pepa Soler ja administra El Rentonar.', 'Gestionar El Rentonar']
  ])('%s · ho diu, sense formulari', async (rol, text, boto) => {
    m.llista.mockResolvedValue([membre(rol)]);
    render(bloc());
    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Amb quin rol?' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Incloure / })).toBeNull();
    if (boto) {
      fireEvent.click(screen.getByRole('button', { name: boto }));
      expect(m.navigate).toHaveBeenLastCalledWith('/el-meu-perfil?organitzacio=org-r');
    } else {
      expect(screen.queryByRole('button', { name: /^Gestionar/ })).toBeNull();
    }
  });

  test('membre · la propietària la pot fer administradora (amb confirmació); una administradora, només gestionar', async () => {
    m.llista.mockResolvedValue([membre('member')]);
    const vista1 = render(bloc());
    expect(await screen.findByText('Pepa Soler ja és membre de El Rentonar.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Donar a Pepa Soler l’administració de El Rentonar' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Donar l’administració' })); });
    expect(m.desa).toHaveBeenCalledWith('org-r', { tipus: 'persona', id: UUID_PEPA, rol: 'admin' }, {});
    expect(screen.getByText('Pepa Soler ja administra El Rentonar.')).toBeTruthy();
    vista1.unmount();
    render(bloc({ entitats: [ENTITATS[1]] }));
    expect(await screen.findByText('Pepa Soler ja és membre de Forn de la Torre.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Donar a/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Gestionar Forn de la Torre' })).toBeTruthy();
  });
});

describe('els errors, pel seu codi (mai el text del servidor)', () => {
  test.each([
    ['SDP-ORGMEM-003', ERRORS_MEMBRES['SDP-ORGMEM-003'][1]],
    ['SDP-ORGMEM-006', ERRORS_MEMBRES['SDP-ORGMEM-006'][1]],
    ['NO-DISPONIBLE', ERRORS_MEMBRES['NO-DISPONIBLE'][1]],
    [null, TEXTOS_MEMBRES.errorAfegeix[1]]
  ])('%s', async (codi, text) => {
    m.desa.mockRejectedValue(ambCodi(codi));
    render(bloc());
    const boto = await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    await act(async () => { fireEvent.click(boto); });
    const avis = screen.getByRole('alert');
    expect(avis.textContent).toBe(text);
    expect(avis.textContent).not.toContain('Supabase');
    /* Actualitzada a posta (revisió 261104, C-02): el focus va a l'avís d'error, mai al <body>. */
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).not.toBe(titol());
    expect(document.activeElement.contains(avis)).toBe(true);
  });

  test('si la lectura falla, cap formulari: «Gestionar {entitat}»; sense l’esquema, ho diu', async () => {
    m.llista.mockRejectedValue(ambCodi('SDP-ORGMEM-002'));
    const vista1 = render(bloc());
    expect(await screen.findByText('No s’ha pogut comprovar si Pepa Soler ja forma part de El Rentonar. Mira-ho al teu Perfil.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Incloure / })).toBeNull();
    expect(screen.getByRole('button', { name: 'Gestionar El Rentonar' })).toBeTruthy();
    vista1.unmount();
    m.llista.mockRejectedValue(ambCodi('NO-DISPONIBLE'));
    render(bloc());
    expect(await screen.findByText(ERRORS_MEMBRES['NO-DISPONIBLE'][1])).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Incloure / })).toBeNull();
  });

  test('un AbortError (la sessió ha canviat) no es pinta', async () => {
    m.desa.mockRejectedValue(new DOMException('La sessió ha canviat.', 'AbortError'));
    render(bloc());
    const boto = await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    await act(async () => { fireEvent.click(boto); });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});

/* Integració 261104 (àrbitre) amb FEDI-23 de Codex · Una sola targeta
   d'incloure: si el servidor té les connexions (la lectura de
   preferenciesConnexions de l'entitat va bé), «Treballador / Soci» és actiu i
   l'escriptura és inclouPersonaEnEntitat; si no, desaMembreOrganitzacio com
   abans. VinculacioEntitat ja no es munta a /connectar. */
describe('amb les connexions de FEDI-23', () => {
  const NO_DISPONIBLE = () => Object.assign(new Error('Supabase 404'), { code: 'NO-DISPONIBLE' });
  const ambConnexions = () => { m.capacitats = new Set([...m.capacitats, 'connexionsPubliques']); };

  test('ronda 7 (GLOBAL-06) · un NO-DISPONIBLE es recorda per backend: la visita següent ja no pregunta', async () => {
    ambConnexions();
    m.preferencies.mockRejectedValue(NO_DISPONIBLE());
    const primera = render(bloc());
    await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    expect(m.preferencies).toHaveBeenCalledTimes(1);
    primera.unmount();
    render(bloc());
    await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    expect(m.preferencies).toHaveBeenCalledTimes(1);
    expect((await screen.findByRole('radio', { name: /^Treballador \/ Soci/ })).disabled).toBe(true);
  });

  test('ronda 7 (GLOBAL-06) · un altre error no es recorda: la visita següent torna a preguntar', async () => {
    ambConnexions();
    m.preferencies.mockRejectedValue(Object.assign(new Error('xarxa'), { code: 'DESCONEGUT' }));
    const primera = render(bloc());
    await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    primera.unmount();
    render(bloc());
    await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    expect(m.preferencies).toHaveBeenCalledTimes(2);
  });

  test('Treballador / Soci actiu: 1 clic, inclouPersonaEnEntitat amb el rol del contracte i cap altra escriptura', async () => {
    ambConnexions();
    m.preferencies.mockResolvedValue({ tipus: 'entitat', id: 'org-r', visibilitatConnexions: 'privada', connexions: [membre('member', 'secret')] });
    m.inclouConnexions.mockResolvedValue({ orgId: 'org-r', personaId: UUID_PEPA, rol: 'treballador' });
    render(bloc());
    const treballador = await screen.findByRole('radio', { name: /^Treballador \/ Soci/ });
    expect(treballador.disabled).toBe(false);
    expect(treballador.closest('.sdp-casella').textContent).toContain('Hi treballa o n’és sòcia: consta a la llista de membres, sense cap permís de gestió.');
    expect(m.preferencies).toHaveBeenCalledWith({ tipus: 'entitat', id: 'org-r' }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    /* Ronda 7 (SQL-03) · Diu el que fa el servidor: amb les dues globals públiques, la pertinença ix, amb el rol, a la fitxa de l'entitat. */
    expect(screen.getByText(/Si l’entitat i la persona tenen les connexions públiques, la pertinença, amb el rol, també eixirà a la fitxa pública de l’entitat, llevat que alguna de les dues l’amague\./)).toBeTruthy();
    fireEvent.click(treballador);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' })); });
    expect(m.inclouConnexions).toHaveBeenCalledTimes(1);
    expect(m.inclouConnexions).toHaveBeenCalledWith({ orgId: 'org-r', personaId: UUID_PEPA, rol: 'treballador' }, {});
    expect(m.desa).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('Fet: Pepa Soler ja forma part de El Rentonar amb el rol «Treballador / Soci».');
    expect(document.activeElement).toBe(screen.getByRole('status'));
    expect(screen.getByText('Pepa Soler ja és membre de El Rentonar.')).toBeTruthy();
    /* Minimització · de la lectura de connexions no es pinta res. */
    expect(document.body.textContent).not.toContain('secret');
  });

  test.each([
    ['member', 'usuari', 'Fet: Pepa Soler ja forma part de El Rentonar com a membre.'],
    ['admin', 'administrador', 'Fet: Pepa Soler ja administra El Rentonar.']
  ])('%s → «%s» al contracte de connexions', async (rolVista, rolContracte, resultat) => {
    ambConnexions();
    m.preferencies.mockResolvedValue({ tipus: 'entitat', id: 'org-r', visibilitatConnexions: 'privada', connexions: [] });
    m.inclouConnexions.mockResolvedValue({ orgId: 'org-r', personaId: UUID_PEPA, rol: rolContracte });
    render(bloc());
    if (rolVista === 'admin') {
      fireEvent.click(await screen.findByRole('radio', { name: /^Administrador/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Incloure Pepa Soler a El Rentonar i donar-li l’administració' }));
      await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Donar l’administració' })); });
    } else {
      const boto = await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
      await act(async () => { fireEvent.click(boto); });
    }
    expect(m.inclouConnexions).toHaveBeenCalledWith({ orgId: 'org-r', personaId: UUID_PEPA, rol: rolContracte }, {});
    expect(m.desa).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe(resultat);
  });

  test('sense la migració (NO-DISPONIBLE a la lectura), com abans: Treballador desactivat i desaMembreOrganitzacio', async () => {
    ambConnexions();
    m.preferencies.mockRejectedValue(NO_DISPONIBLE());
    render(bloc());
    const treballador = await screen.findByRole('radio', { name: /^Treballador \/ Soci/ });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' })).toBeTruthy());
    expect(treballador.disabled).toBe(true);
    expect(screen.getByText(/De moment no es publica enlloc\./)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' })); });
    expect(m.desa).toHaveBeenCalledWith('org-r', { tipus: 'persona', id: UUID_PEPA, rol: 'member' }, {});
    expect(m.inclouConnexions).not.toHaveBeenCalled();
  });

  test('un error d’inclusió es diu pel seu codi (ORGMEM passa pel port de connexions)', async () => {
    ambConnexions();
    m.preferencies.mockResolvedValue({ tipus: 'entitat', id: 'org-r', visibilitatConnexions: 'privada', connexions: [] });
    m.inclouConnexions.mockRejectedValue(ambCodi('SDP-ORGMEM-003'));
    render(bloc());
    const boto = await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    await act(async () => { fireEvent.click(boto); });
    expect(screen.getByText(m.t(...ERRORS_MEMBRES['SDP-ORGMEM-003']))).toBeTruthy();
    expect(document.activeElement).toBe(document.querySelector('.sdp-connectar__error'));
  });

  test('a /connectar, una sola targeta d’incloure: VinculacioEntitat no es munta', async () => {
    ambConnexions();
    m.preferencies.mockResolvedValue({ tipus: 'entitat', id: 'org-r', visibilitatConnexions: 'privada', connexions: [] });
    render(vista());
    await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' });
    expect(screen.queryByRole('heading', { name: 'Vincular esta persona a una entitat' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Vincular a l’entitat' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Incloure Pepa Soler a / })).toHaveLength(1);
  });
});

/* Frontera asíncrona: sessió real, A→B→A, operació nova i callback caducat. */
describe('àmbit vigent de la inclusió', () => {
  const A = { mode: 'local', tenantId: '11111111-1111-4111-8111-111111111111' };
  const B = { mode: 'local', tenantId: '22222222-2222-4222-8222-222222222222' };
  function pendent() { let resol; const promesa = new Promise(r => { resol = r; }); return { promesa, resol }; }
  beforeEach(() => {
    m.llista.mockReset().mockResolvedValue([]);
    m.desa.mockReset().mockImplementation(async (_org, dades) => membre(dades.rol));
    m.preferencies.mockReset().mockResolvedValue({ tipus: 'entitat', id: 'org-r', visibilitatConnexions: 'privada', connexions: [] });
    m.inclouConnexions.mockReset().mockResolvedValue({ orgId: 'org-r', personaId: UUID_PEPA, rol: 'usuari' });
    configuraBackendSessio(A);
    desaSessio({ access_token: 'synthetic-token', user: { id: 'U' } });
  });
  test('una entrada real nova del mateix compte no reutilitza el rol pendent anterior', async () => {
    const vella = pendent(); const nova = pendent();
    m.llista.mockImplementationOnce(() => vella.promesa).mockImplementationOnce(() => nova.promesa);
    const v = render(bloc({ config: A })); await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
    const entrada = entradaSessio(); desaSessio({ access_token: 'synthetic-new-token', user: { id: 'U' } }); expect(entradaSessio()).toBeGreaterThan(entrada);
    v.rerender(bloc({ config: A })); await act(async () => {});
    await act(async () => vella.resol([membre('admin')]));
    expect(screen.queryByText('Pepa Soler ja administra El Rentonar.')).toBeNull();
    expect(m.llista).toHaveBeenCalledTimes(2);
    await act(async () => nova.resol([])); expect(screen.getByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' })).toBeTruthy();
  });
  test('canviar entitat A B A no deixa que l’alta vella substituïsca el rol llegit després', async () => {
    const escriptura = pendent(); m.desa.mockImplementationOnce(() => escriptura.promesa);
    render(bloc({ config: A })); fireEvent.click(await screen.findByRole('button', { name: 'Incloure Pepa Soler a El Rentonar' }));
    await waitFor(() => expect(m.desa).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('radio', { name: 'Forn de la Torre (empresa)' }));
    await screen.findByRole('button', { name: 'Incloure Pepa Soler a Forn de la Torre' });
    m.llista.mockResolvedValue([membre('admin')]);
    fireEvent.click(screen.getByRole('radio', { name: 'El Rentonar (entitat)' }));
    await screen.findByText('Pepa Soler ja administra El Rentonar.');
    await act(async () => escriptura.resol(membre('member')));
    expect(screen.queryByRole('status')).toBeNull(); expect(screen.getByText('Pepa Soler ja administra El Rentonar.')).toBeTruthy();
  });
  test('el bloqueig nou sobreviu a la finalització antiga després del backend A B A', async () => {
    m.capacitats.add('connexionsPubliques'); const vella = pendent(); const nova = pendent();
    m.inclouConnexions.mockImplementationOnce(() => vella.promesa).mockImplementationOnce(() => nova.promesa);
    const v = renderHook(({ config }) => useIncloureEnEntitat({ orgId: 'org-r', personaId: UUID_PEPA, usuariId: 'U', config }), { initialProps: { config: A } });
    await waitFor(() => expect(v.result.current.ambFuncions).toBe(true)); let antiga; act(() => { antiga = v.result.current.inclou('treballador'); });
    v.rerender({ config: B }); await waitFor(() => expect(v.result.current.estat).toBe('llest'));
    v.rerender({ config: A }); await waitFor(() => expect(v.result.current.estat).toBe('llest'));
    let actual; act(() => { actual = v.result.current.inclou('admin'); }); expect(m.inclouConnexions).toHaveBeenCalledTimes(2);
    await act(async () => { vella.resol({ orgId: 'org-r', personaId: UUID_PEPA, rol: 'treballador' }); expect(await antiga).toBe(false); });
    expect(v.result.current.ocupat).toBe(true); expect(v.result.current.resultat).toBeNull();
    await act(async () => expect(await v.result.current.inclou('member')).toBe(false)); expect(m.inclouConnexions).toHaveBeenCalledTimes(2);
    await act(async () => { nova.resol({ orgId: 'org-r', personaId: UUID_PEPA, rol: 'administrador' }); expect(await actual).toBe(true); });
    expect(v.result.current.rolActual).toBe('admin'); expect(v.result.current.resultat).toBe('fetAdmin');
  });
  test('una funció retinguda no escriu en un àmbit posterior ni després de desmuntar', async () => {
    const v = renderHook(({ config }) => useIncloureEnEntitat({ orgId: 'org-r', personaId: UUID_PEPA, usuariId: 'U', config }), { initialProps: { config: A } });
    await waitFor(() => expect(v.result.current.estat).toBe('llest')); const antiga = v.result.current.inclou;
    v.rerender({ config: B }); await waitFor(() => expect(v.result.current.estat).toBe('llest'));
    await act(async () => expect(await antiga('member')).toBe(false)); expect(m.desa).not.toHaveBeenCalled();
    const ultima = v.result.current.inclou; v.unmount(); expect(await ultima('member')).toBe(false); expect(m.desa).not.toHaveBeenCalled();
  });
});
