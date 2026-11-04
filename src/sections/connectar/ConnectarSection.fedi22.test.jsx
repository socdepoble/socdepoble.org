import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · /connectar a tota
   l'amplària, en una graella de targetes on el PRIMER que es veu és Connectar.
     · 'social' (el perfil d'una persona, una entitat o un grup amb relació):
       T1 «Connexió directa» (fitxa compacta i «Connectar com a» a l'esquerra;
       l'avís i el primari gran a la dreta), T2 «Incloure en la teua entitat»
       (una persona) o «Formar part» (demanar-ho amb rol, una entitat), sense
       columna lateral (revisió 261104, RA-01). Actualitzada a posta (FEDI-26,
       ordre directa del Mestre, Regla 1; correcció connectar-03, 261104): sense
       T3 «Guardar a les teues notes», que en 'social' no es munta.
     · 'element': l'objecte i les notes, obertes i primàries; la relació i
       formar part a la lateral.
   Un primari per vista. El contingut de fora no canvia de .sdp-connectar cap
   avall. El port es simula a banda, com a ConnectarSection.relacions.test. */
const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), canCreate: true, user: { id: 'U' },
  params: new URLSearchParams(), config: {}, t: (_, alternativa) => alternativa, identitat: null,
  xat: { chatThreads: [], cercaMembres: vi.fn(), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  capacitats: new Set(), perfil: vi.fn(), segueix: vi.fn(), deixa: vi.fn(), estat: vi.fn(), titular: vi.fn(),
  llista: vi.fn(), desa: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navigate,
  useSearchParams: () => [m.params],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: m.t }), useUIActionsOpcional: () => ({ t: m.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => m.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => m.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => m.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => m.media }));
vi.mock('../notes/NotesDataContext', () => ({
  useNotesData: () => ({
    noteFolders: [], notes: [], creaNota: m.crea, updateNote: vi.fn(),
    canCreate: m.canCreate, config: m.config, status: 'ready', error: null, refresh: vi.fn()
  })
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => m.capacitats.has(cap),
  loadPerfilPublic: (...args) => m.perfil(...args),
  segueix: (...args) => m.segueix(...args),
  deixaDeSeguir: (...args) => m.deixa(...args),
  estatSeguiment: (...args) => m.estat(...args),
  loadTitularPublic: (...args) => m.titular(...args),
  llistaMembresOrganitzacio: (...args) => m.llista(...args),
  desaMembreOrganitzacio: (...args) => m.desa(...args)
}));
import ConnectarSection from './ConnectarSection.jsx';
import { XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { createTranslator } from '../../config/i18n.js';
import '../../../tests/helpers/diccionaris.js';

const UUID_PEPA = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const UUID_ORG = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091';
const UUID_SOCDEPOBLE = '0e9d8c7b-6a5f-4e3d-9c2b-1a0f9e8d7c6b';
const PEPA = Object.freeze({ tipus: 'persona', id: UUID_PEPA, nom: 'Pepa Soler', poble: 'La Torre', avatar: '' });
const RENTONAR = Object.freeze({ tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar', poble: 'Relleu' });
const TONI = Object.freeze({ tipus: 'persona', id: 'U', nom: 'Toni Ferrer' });
const B_RENTONAR = Object.freeze({ tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar', rol: 'owner', kind: 'entity' });
const OLI = Object.freeze({ tipus: 'entitat', id: 'org-oli', nom: 'Oli de La Torre', rol: 'owner', kind: 'company' });
/* El title de l'URL és d'una impostora: cap camí no l'ha de dir. */
const PERFIL_PEPA = `item_id=${UUID_PEPA}&title=Impostora&sectionId=perfil&objecte=persona&ruta=%2Fgent%2F${UUID_PEPA}`;
const PERFIL_RENTONAR = `item_id=${UUID_ORG}&title=Impostora&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2F${UUID_ORG}&organitzacio=${UUID_ORG}`;
const SAMARRETA = 'item_id=samarreta-socdepoble&title=Samarreta&sectionId=mercat';
const XAT_REMOT = Object.freeze({ estat: 'remot', href: `/xat?amb=${UUID_SOCDEPOBLE}`, avis: null, resol: null });
const CONNECTA = 'Connectar a «Safata d’Entrada»';
const vista = () => <XatSocDePobleContext.Provider value={XAT_REMOT}><ConnectarSection /></XatSocDePobleContext.Provider>;
const arrel = (container) => container.querySelector('.sdp-connectar');
const notes = () => document.querySelector('details.sdp-connectar__notes');
const primaris = (container) => [...container.querySelectorAll('.sdp-boto--primari')].filter((boto) => !boto.closest('dialog'));
const anadaAEntrar = (crida) => {
  const url = new URL(crida, 'http://sdp.test');
  return { ruta: url.pathname, mode: url.searchParams.get('mode'), tornar: url.searchParams.get('tornar') };
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  m.canCreate = true;
  m.user = { id: 'U' };
  m.config = {};
  m.t = (_, alternativa) => alternativa;
  m.params = new URLSearchParams(PERFIL_PEPA);
  m.identitat = { actor: TONI, identitats: [TONI], memberships: [] };
  m.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [] };
  m.capacitats = new Set(['directori', 'seguiments']);
  m.perfil.mockImplementation(async (id) => (id === UUID_PEPA ? PEPA : id === UUID_ORG ? RENTONAR : null));
  m.estat.mockResolvedValue({ seguint: false, creatAl: null });
  m.titular.mockResolvedValue(null);
  m.segueix.mockResolvedValue({ seguint: true, creatAl: '2026-11-03T21:00:00Z', nou: true, primer: true });
  m.crea.mockResolvedValue({ id: 'n-9', revision: 0 });
  m.llista.mockResolvedValue([]);
  m.desa.mockResolvedValue({ tipus: 'persona', id: UUID_PEPA, rol: 'member' });
  m.xat.cercaMembres.mockResolvedValue([]);
  m.xat.creaFil.mockImplementation(async (id) => `f-${id}`);
  m.xat.sendChatMessage.mockImplementation(async () => [{ id: 'm-1' }]);
});

describe('social · el perfil d’una persona', () => {
  test('la graella: T1 → T2, sense notes; l’H2 i l’entradeta de la vista social', async () => {
    m.identitat = { actor: TONI, identitats: [TONI, B_RENTONAR, OLI], memberships: [] };
    m.capacitats = new Set(['directori', 'seguiments', 'membresOrganitzacio']);
    const { container } = render(vista());
    const directa = await screen.findByRole('group', { name: 'Connexió directa' });
    /* Actualitzada a posta (revisió 261104, RA-03): el rètol de T2 d'una persona diu el que fa. */
    const incloure = await screen.findByRole('group', { name: 'Incloure en la teua entitat' });
    expect(screen.queryByRole('group', { name: 'Formar part' })).toBeNull();
    expect(arrel(container).classList.contains('sdp-connectar--graella')).toBe(true);
    /* Actualitzada a posta (revisió 261104, RA-01): en 'social' no hi ha columna lateral.
       Actualitzada a posta (FEDI-26, Regla 1; correcció connectar-03, 261104): ni notes davall. */
    expect(arrel(container).classList.contains('sdp-connectar--amb-lateral')).toBe(false);
    expect(container.querySelector('.sdp-connectar__lateral')).toBeNull();
    expect(directa.classList.contains('sdp-connectar__targeta--directa')).toBe(true);
    expect(directa.closest('.sdp-connectar__principal--targetes')).toBeTruthy();
    expect(directa.compareDocumentPosition(incloure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(notes()).toBeNull();
    /* Un sol H1, i el header no porta cap altra capçalera. */
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('header.page-title').querySelectorAll('h2, h3')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Connecta’t i escriu-li');
    /* C5 · amb barrets, l'entradeta parla d'entitats. Actualitzada a posta (revisió 261104, RA-01): d'una línia. */
    expect(screen.getByText('Com a tu o en nom d’una entitat que administres.')).toBeTruthy();
    expect(container.querySelector('.sdp-divisor')).toBeNull();
    expect(container.querySelector('.sdp-connectar__cami-cap')).toBeNull();
  });

  test('C5 · sense barrets, l’entradeta no parla d’entitats', async () => {
    render(vista());
    await screen.findByRole('group', { name: 'Connexió directa' });
    /* Actualitzada a posta (revisió 261104, RA-01): d'una línia. */
    expect(screen.getByText('Connectar-te no et fa membre de res.')).toBeTruthy();
    expect(screen.queryByText(/^Com a tu o en nom/)).toBeNull();
  });

  test('RA-01 · dins de T1, qui i amb quin barret a l’esquerra i la relació a la dreta; sense barrets ni fitxa, una sola columna', async () => {
    m.identitat = { actor: TONI, identitats: [TONI, B_RENTONAR], memberships: [] };
    const vista1 = render(vista());
    const directa = await screen.findByRole('group', { name: 'Connexió directa' });
    await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    const cos = directa.querySelector('.sdp-connectar__directa');
    expect(cos.classList.contains('sdp-connectar__directa--dues')).toBe(true);
    const [qui, relacio] = cos.children;
    expect(cos.children).toHaveLength(2);
    expect(qui.classList.contains('sdp-connectar__qui')).toBe(true);
    expect(qui.querySelector('.sdp-connectar__fitxa')).toBeTruthy();
    expect(within(qui).getByRole('radiogroup', { name: 'Connectar com a' })).toBeTruthy();
    expect(relacio.classList.contains('sdp-connectar__relacio')).toBe(true);
    expect(within(relacio).getByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    /* L'ordre del DOM: qui, barret, l'avís i el botó (el focus seguix el DOM). */
    expect(qui.compareDocumentPosition(relacio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    vista1.unmount();
    /* Sense sessió en remot no hi ha fitxa ni barret: una sola columna. */
    m.user = null;
    render(vista());
    const sola = screen.getByRole('group', { name: 'Connexió directa' }).querySelector('.sdp-connectar__directa');
    expect(sola.classList.contains('sdp-connectar__directa--dues')).toBe(false);
    expect(sola.querySelector('.sdp-connectar__qui')).toBeNull();
  });

  test('RA-03 · amb el primari, l’h3 de la relació només per al lector de pantalla; C17: després de connectar, el focus al resultat', async () => {
    render(vista());
    const connecta = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    const titol = screen.getByRole('heading', { name: 'Connectar amb Pepa Soler' });
    expect(titol.classList.contains('sdp-sr-only')).toBe(true);
    expect(titol.classList.contains('sdp-connectar__titol-seccio')).toBe(false);
    await act(async () => { fireEvent.click(connecta); });
    const resultat = screen.getByRole('status');
    expect(resultat.textContent).toBe('T’has connectat amb Pepa Soler. Li hem enviat un missatge al xat.');
    expect(document.activeElement).toBe(resultat);
    expect(resultat.getAttribute('tabindex')).toBe('-1');
  });

  test('C-02 · si connectar falla, el focus va a l’avís d’error (mai al <body>)', async () => {
    m.segueix.mockRejectedValue(Object.assign(new Error('Supabase 400: cru'), { code: 'SDP-SEG-002' }));
    render(vista());
    const connecta = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    connecta.focus();
    await act(async () => { fireEvent.click(connecta); });
    const alerta = screen.getByRole('alert');
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement.contains(alerta)).toBe(true);
    expect(document.activeElement.getAttribute('tabindex')).toBe('-1');
    expect(alerta.textContent).not.toContain('Supabase');
  });

  test('C7 · la fitxa compacta: el nom de la fitxa (mai l’URL), l’avatar lg amb alt buit i «Persona · {poble}»', async () => {
    const { container } = render(vista());
    const directa = await screen.findByRole('group', { name: 'Connexió directa' });
    const fitxa = await waitFor(() => {
      const trobada = directa.querySelector('.sdp-connectar__fitxa');
      expect(trobada).toBeTruthy();
      return trobada;
    });
    expect(fitxa.querySelector('.sdp-connectar__fitxa-nom').textContent).toBe('Pepa Soler');
    expect(fitxa.querySelector('.sdp-connectar__fitxa-nom ~ .sdp-connectar__ajuda').textContent).toBe('Persona · La Torre');
    const avatar = fitxa.querySelector('.sdp-avatar');
    expect(avatar.classList.contains('sdp-avatar--lg')).toBe(true);
    expect(avatar.querySelector('.sdp-nomes-lector')).toBeNull();
    expect(container.textContent).not.toContain('Impostora');
    /* Sense mini-card en 'social'. */
    expect(container.querySelector('.sdp-connectar__previsualitzacio')).toBeNull();
  });

  test('sense un poble de text, només el tipus', async () => {
    m.perfil.mockImplementation(async () => ({ ...PEPA, poble: '   ' }));
    render(vista());
    const directa = await screen.findByRole('group', { name: 'Connexió directa' });
    await waitFor(() => expect(directa.querySelector('.sdp-connectar__fitxa-nom ~ .sdp-connectar__ajuda')?.textContent).toBe('Persona'));
  });

  test('un sol primari: «Connectar amb {nom}», descrit pels avisos pintats (C9); després, «Escriu-li»', async () => {
    const { container } = render(vista());
    const connecta = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    expect(primaris(container).map((boto) => boto.textContent)).toEqual(['Connectar amb Pepa Soler']);
    expect(connecta.classList.contains('sdp-boto--gran')).toBe(true);
    const descrit = connecta.getAttribute('aria-describedby').split(' ');
    expect(descrit.length).toBeGreaterThan(0);
    for (const id of descrit) expect(document.getElementById(id), id).toBeTruthy();
    expect(document.getElementById(descrit[0]).textContent).toBe('Pepa Soler rebrà un missatge al xat per a dir-li que t’hi has connectat.');
    /* L'avís va abans del botó (Directiva 261024). */
    expect(document.getElementById(descrit[0]).compareDocumentPosition(connecta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    /* Actualitzada a posta (FEDI-26, Regla 1; correcció connectar-03, 261104): cap botó de les notes en 'social'. */
    expect(screen.queryByRole('button', { name: CONNECTA })).toBeNull();
    await act(async () => { fireEvent.click(connecta); });
    expect(primaris(container).map((boto) => boto.textContent)).toEqual(['Escriu-li a Pepa Soler']);
    expect(screen.getByRole('button', { name: 'Deixar la connexió amb Pepa Soler' }).classList.contains('sdp-boto--fantasma')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Escriu-li a Pepa Soler' }));
    expect(m.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_PEPA}`);
  });

  test('amb una entitat seua com a barret: «Connectar El Rentonar amb Pepa Soler», i segueix rep el barret', async () => {
    m.identitat = { actor: TONI, identitats: [TONI, B_RENTONAR], memberships: [] };
    render(vista());
    const grup = await screen.findByRole('radiogroup', { name: 'Connectar com a' });
    expect(screen.getByRole('group', { name: 'Connexió directa' }).contains(grup)).toBe(true);
    fireEvent.click(within(grup).getByRole('radio', { name: 'El Rentonar (entitat)' }));
    const boto = await screen.findByRole('button', { name: 'Connectar El Rentonar amb Pepa Soler' });
    expect(boto.classList.contains('sdp-boto--primari')).toBe(true);
    await act(async () => { fireEvent.click(boto); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA, com: UUID_ORG }, {});
  });

  /* Actualitzada a posta (FEDI-26, Regla 1; correcció connectar-03, 261104): en 'social' no hi ha cap resum de
     les notes per a desplegar; que tampoc n'hi ha mentre la fitxa carrega ho diu «FEDI-26 · Regla 1», al final. */
  test('mentre la fitxa carrega, T1 és un esquelet amb aria-busy i sense status', () => {
    m.perfil.mockReturnValue(new Promise(() => {}));
    render(vista());
    const directa = screen.getByRole('group', { name: 'Connexió directa' });
    expect(directa.getAttribute('aria-busy')).toBe('true');
    expect(within(directa).getByText('Carregant la fitxa…')).toBeTruthy();
    expect(within(directa).queryByRole('status')).toBeNull();
  });

  /* Actualitzada a posta (FEDI-26, Regla 1; correcció connectar-03, 261104) · DEROGAT C11 (la nota d'un perfil
     amb el nom de la fitxa): d'un perfil no es crea cap nota («FEDI-26 · Regla 1», al final). Un element, sí. */
  test('la nota de la Samarreta porta el seu títol', async () => {
    m.params = new URLSearchParams(SAMARRETA);
    render(vista());
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: CONNECTA })); });
    expect(m.crea).toHaveBeenCalledTimes(1);
    expect(m.crea.mock.calls[0][0].title).toBe('Samarreta');
  });
});

describe('element · l’objecte i les notes primer', () => {
  test('la Samarreta amb autora: notes obertes i primàries, la relació a la lateral, la mini-card i cap fitxa', async () => {
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', author_name: 'Pepa Soler', author_user_id: UUID_PEPA }] };
    const { container } = render(vista());
    const directa = await screen.findByRole('group', { name: 'Connexió directa' });
    expect(notes().open).toBe(true);
    expect(primaris(container).map((boto) => boto.textContent)).toEqual([CONNECTA]);
    expect(directa.closest('.sdp-connectar__lateral')).toBeTruthy();
    expect(directa.classList.contains('sdp-connectar__targeta--directa')).toBe(false);
    expect(notes().closest('.sdp-connectar__principal')).toBeTruthy();
    expect(notes().compareDocumentPosition(directa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('.sdp-connectar__previsualitzacio')).toBeTruthy();
    expect(container.querySelector('.sdp-connectar__fitxa')).toBeNull();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('On vols connectar-ho?');
    expect(await within(directa).findByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    expect(within(directa).getByRole('button', { name: 'Connectar amb Pepa Soler' }).classList.contains('sdp-boto--secundari')).toBe(true);
  });

  test('un poble sense autor: sense columna lateral', () => {
    m.params = new URLSearchParams('item_id=sella&title=Sella&sectionId=pobles&objecte=poble&ruta=%2Fpobles%2Fsella');
    const { container } = render(vista());
    expect(arrel(container).classList.contains('sdp-connectar--amb-lateral')).toBe(false);
    expect(container.querySelector('.sdp-connectar__lateral')).toBeNull();
    expect(notes().open).toBe(true);
  });

  test('el teu perfil sense barrets: les notes obertes i primàries', async () => {
    m.user = { id: UUID_PEPA };
    m.identitat = { actor: PEPA, identitats: [PEPA], memberships: [] };
    const { container } = render(vista());
    await waitFor(() => expect(m.perfil).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByRole('group', { name: 'Connexió directa' })).toBeNull();
    expect(notes().open).toBe(true);
    expect(primaris(container).map((boto) => boto.textContent)).toEqual([CONNECTA]);
  });

  test('C1 · el perfil d’una entitat teua sense cap altre barret: element, mini-card, notes primàries i «Formar part» → «Gestionar» a la lateral', async () => {
    m.identitat = { actor: TONI, identitats: [TONI, B_RENTONAR], memberships: [{ id: UUID_ORG, slug: 'el-rentonar', name: 'El Rentonar', role: 'owner' }] };
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    const { container } = render(vista());
    /* Mentre la fitxa carrega, la vista és social; quan arriba sense cap relació, passa a 'element'. */
    await waitFor(() => expect(container.querySelector('.sdp-connectar__previsualitzacio')).toBeTruthy());
    const formarPart = screen.getByRole('group', { name: 'Formar part' });
    expect(screen.queryByRole('group', { name: 'Connexió directa' })).toBeNull();
    expect(formarPart.closest('.sdp-connectar__lateral')).toBeTruthy();
    expect(within(formarPart).getByRole('button', { name: 'Gestionar El Rentonar' })).toBeTruthy();
    expect(container.querySelector('.sdp-connectar__previsualitzacio')).toBeTruthy();
    expect(notes().open).toBe(true);
    expect(notes().closest('.sdp-connectar__principal')).toBeTruthy();
    expect(primaris(container).map((boto) => boto.textContent)).toEqual([CONNECTA]);
  });
});

describe('C3 · sense sessió', () => {
  test('el perfil d’una entitat en remot: el primari és entrar per a CONNECTAR; escriure-li continua secundari', async () => {
    m.user = null;
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    const { container } = render(vista());
    const entra = await screen.findByRole('button', { name: 'Entra per a connectar-hi' });
    expect(primaris(container)).toEqual([entra]);
    expect(screen.getByRole('button', { name: 'Entra per a escriure-li a El Rentonar' }).classList.contains('sdp-boto--secundari')).toBe(true);
    fireEvent.click(entra);
    expect(anadaAEntrar(m.navigate.mock.calls.at(-1)[0])).toEqual({ ruta: '/registre', mode: 'entrar', tornar: `/connectar?${m.params}` });
    expect(screen.getByRole('button', { name: 'Entra per a demanar-ho' }).classList.contains('sdp-boto--secundari')).toBe(true);
  });

  test('la persona en remot: sense fitxa, el primari porta a entrar', () => {
    m.user = null;
    const { container } = render(vista());
    expect(m.perfil).not.toHaveBeenCalled();
    const directa = screen.getByRole('group', { name: 'Connexió directa' });
    expect(within(directa).getByRole('heading', { name: 'Connectar amb esta persona' })).toBeTruthy();
    expect(primaris(container).map((boto) => boto.textContent)).toEqual(['Entra per a connectar-hi']);
    /* Actualitzada a posta (FEDI-26, Regla 1; correcció connectar-03, 261104): ni notes ni el seu botó («FEDI-26 · Regla 1»). */
    expect(screen.queryByRole('radiogroup', { name: 'Connectar com a' })).toBeNull();
  });

  test('un element sense sessió no porta el botó nou dins de la relació', async () => {
    m.user = null;
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', author_name: 'Pepa Soler', author_user_id: UUID_PEPA }] };
    const { container } = render(vista());
    const directa = await screen.findByRole('group', { name: 'Connexió directa' });
    expect(within(directa).queryByRole('button', { name: 'Entra per a connectar-hi' })).toBeNull();
    expect(primaris(container).map((boto) => boto.textContent)).toEqual(['Entra per a connectar']);
  });
});

describe('la pàgina i el contingut de fora', () => {
  test('el contenidor de la pàgina porta sdp-connectar-pagina, també amb un ?url de fora; el .sdp-connectar de fora no canvia', () => {
    const vista1 = render(vista());
    expect(vista1.container.querySelector('.sdp-universal-page-container').classList.contains('sdp-connectar-pagina')).toBe(true);
    vista1.unmount();
    m.params = new URLSearchParams('url=https%3A%2F%2Fexemple.test%2Fnoticia&title=Not%C3%ADcia');
    const { container } = render(vista());
    expect(container.querySelector('.sdp-universal-page-container').classList.contains('sdp-connectar-pagina')).toBe(true);
    expect(arrel(container).className).toBe('sdp-connectar');
    expect(container.querySelector('details')).toBeNull();
  });
});

describe('BlocFormarPart · demanar formar part amb un rol', () => {
  beforeEach(() => { m.params = new URLSearchParams(PERFIL_RENTONAR); });

  test('«Usuari / Membre» per defecte; les ajudes de cada rol (C12)', async () => {
    render(vista());
    const formarPart = await screen.findByRole('group', { name: 'Formar part' });
    const rols = await within(formarPart).findByRole('group', { name: 'Amb quin rol ho demanes?' });
    expect(within(rols).getByRole('radio', { name: /^Usuari \/ Membre/ }).checked).toBe(true);
    expect(within(rols).getByRole('radio', { name: /^Administrador/ }).closest('.sdp-casella').textContent)
      .toContain('Gestiona la fitxa, els membres i el xat de l’entitat, i pot publicar en el seu nom. Només la propietària de l’entitat nomena administradores.');
    fireEvent.click(within(rols).getByRole('radio', { name: /^Treballador \/ Soci/ }));
    expect(within(rols).getByRole('radio', { name: /^Treballador \/ Soci/ }).closest('.sdp-casella').textContent)
      .toContain('Qui l’administra decidirà amb quin rol t’hi dona d’alta.');
  });

  test('el diàleg mostra la capçalera i la línia del rol; el text enviat porta el rol, sense metadades ni crides de membres', async () => {
    render(vista());
    const rols = await screen.findByRole('group', { name: 'Amb quin rol ho demanes?' });
    fireEvent.click(within(rols).getByRole('radio', { name: /^Treballador \/ Soci/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    const dialeg = screen.getByRole('dialog', { name: 'Demanar formar part de El Rentonar' });
    const sollicitud = dialeg.querySelector('.sdp-connectar__sollicitud');
    expect([...sollicitud.querySelectorAll('span')].map((span) => span.textContent))
      .toEqual(['Sol·licitud per a formar part de El Rentonar.', 'Rol que demane: Treballador / Soci.']);
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    const crida = m.xat.sendChatMessage.mock.calls[0];
    expect(crida[1]).toBe('Sol·licitud per a formar part de El Rentonar.\nRol que demane: Treballador / Soci.');
    expect(m.llista).not.toHaveBeenCalled();
    expect(m.desa).not.toHaveBeenCalled();
  });
});

/* P1-22 · Cap text nou en valencià en les altres quatre llengües. */
const VALENCIA_DE_LA_VISTA = [
  'Guardar a les teues notes', 'Connecta’t i escriu-li', 'Incloure', 'Connexió directa',
  'Una còpia al teu Bloc', 'Amb quin rol?', 'Usuari / Membre', 'Treballador / Soci', 'A quina entitat?'
];
describe('FEDI-22 en cinc llengües', () => {
  test.each(['es', 'en', 'eu', 'gl'])('%s · la vista social, amb la targeta d’incloure, no parla valencià', async (code) => {
    const t = createTranslator(code);
    m.t = t;
    m.identitat = { actor: TONI, identitats: [TONI, B_RENTONAR, OLI], memberships: [] };
    m.capacitats = new Set(['directori', 'seguiments', 'membresOrganitzacio']);
    const { container } = render(vista());
    await screen.findByRole('group', { name: t('section.connectar.camins.relacio', '') });
    await screen.findByRole('group', { name: t('section.connectar.incloure.rol', '') });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(t('section.connectar.subtitolSocial', ''));
    /* Actualitzada a posta (FEDI-26, Regla 1; correcció connectar-03, 261104): les notes no es munten en 'social'. */
    expect(container.textContent).not.toContain(t('section.connectar.notes.titol', ''));
    for (const text of VALENCIA_DE_LA_VISTA) expect(container.textContent, `${code}: ${text}`).not.toContain(text);
  });
});

/* FEDI-26 (ordre directa del Mestre, 01:31 CET; Regla 1; correcció connectar-03,
   261104) · Connectar amb una persona, una entitat, una empresa o un grup és una
   connexió social: en la vista 'social' no es munta mai «Guardar a les teues
   notes» (notesDelBloc) ni es crea cap nota amb el nom del perfil. El Bloc és
   dels elements: la Samarreta (més amunt) conserva les notes obertes i primàries. */
describe('FEDI-26 · Regla 1 · cap nota des d’un perfil social', () => {
  const senseNotes = (container) => {
    expect(container.querySelector('details.sdp-connectar__notes')).toBeNull();
    expect(container.textContent).not.toContain('Guardar a les teues notes');
    expect(screen.queryByRole('button', { name: CONNECTA })).toBeNull();
  };

  test.each([
    ['una persona', PERFIL_PEPA, 'Connectar amb Pepa Soler'],
    ['una entitat', PERFIL_RENTONAR, 'Connectar amb El Rentonar']
  ])('%s: la connexió directa sense cap plegable de notes, i connectar no crea cap nota', async (_, consulta, rotul) => {
    m.params = new URLSearchParams(consulta);
    const { container } = render(vista());
    const connecta = await screen.findByRole('button', { name: rotul });
    senseNotes(container);
    await act(async () => { fireEvent.click(connecta); });
    expect(m.segueix).toHaveBeenCalledTimes(1);
    senseNotes(container);
    expect(m.crea).not.toHaveBeenCalled();
  });

  test('mentre la fitxa carrega, tampoc', () => {
    m.perfil.mockReturnValue(new Promise(() => {}));
    const { container } = render(vista());
    expect(screen.getByRole('group', { name: 'Connexió directa' }).getAttribute('aria-busy')).toBe('true');
    senseNotes(container);
  });

  test('sense sessió en remot: el primari porta a entrar per a connectar-hi i no hi ha el botó de les notes', () => {
    m.user = null;
    const { container } = render(vista());
    expect(primaris(container).map((boto) => boto.textContent)).toEqual(['Entra per a connectar-hi']);
    expect(container.querySelector('details.sdp-connectar__notes')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Entra per a connectar' })).toBeNull();
  });
});

/* FEDI-26 (correcció connectar-06, 261104) · Les entitats fundacionals amb l'id
   del servidor (El Rentonar b2c87505-…, Sóc de Poble a240e870-…, declarats a
   ENTITATS_SEED[].alies) no són ids de la llavor: en remot, el seu perfil
   conserva la connexió directa i no cau a 'element'. L'àlies de la llavor
   ('rentonar') continua sense contacte. La prova fixa els dos ids que nomena la
   decisió, no el format de l'id (W4-10). */
describe('FEDI-26 · entitats fundacionals amb l’id del servidor, en remot', () => {
  const UUID_RENTONAR_REAL = 'b2c87505-53b1-4108-902f-2313e77b9968';
  const UUID_SOCDEPOBLE_REAL = 'a240e870-4aef-4d92-b138-e8b4e2f2123a';
  const perfilDe = (id) => `item_id=${id}&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2F${id}&organitzacio=${id}`;
  const fitxes = {
    [UUID_RENTONAR_REAL]: { ...RENTONAR, id: UUID_RENTONAR_REAL },
    [UUID_SOCDEPOBLE_REAL]: { tipus: 'entitat', id: UUID_SOCDEPOBLE_REAL, nom: 'Sóc de Poble', poble: 'La Torre' },
    rentonar: { ...RENTONAR, id: 'rentonar' }
  };
  beforeEach(() => { m.perfil.mockImplementation(async (id) => fitxes[id] ?? null); });

  test.each([
    ['El Rentonar', UUID_RENTONAR_REAL],
    ['Sóc de Poble', UUID_SOCDEPOBLE_REAL]
  ])('%s: «Connexió directa» i connectar-hi segueix l’id del servidor, sense mini-card', async (nom, uuid) => {
    m.params = new URLSearchParams(perfilDe(uuid));
    const { container } = render(vista());
    const directa = await screen.findByRole('group', { name: 'Connexió directa' });
    const connecta = await within(directa).findByRole('button', { name: `Connectar amb ${nom}` });
    expect(container.querySelector('.sdp-connectar__previsualitzacio')).toBeNull();
    await act(async () => { fireEvent.click(connecta); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'entitat', id: uuid }, {});
  });

  test('l’àlies de la llavor «rentonar» continua sense contacte en remot', async () => {
    m.params = new URLSearchParams(perfilDe('rentonar'));
    const { container } = render(vista());
    await waitFor(() => expect(container.querySelector('.sdp-connectar__previsualitzacio')).toBeTruthy());
    expect(screen.queryByRole('group', { name: 'Connexió directa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Connectar amb El Rentonar' })).toBeNull();
  });
});
