import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* IDEA-14 (Directiva del Mestre, 261024; auditoria Gemini G-04) · /connectar
   separa la relació humana de la pertinença formal i del MAS:
     · «Entre persones»: seguir (capacitat 'seguiments', amb l'avís al xat
       una sola vegada) i escriure, també des d'un perfil (la fitxa pública
       de confiança, mai l'URL);
     · «Formar part»: la sol·licitud estructurada al xat privat de l'entitat,
       amb confirmació i després a la conversa;
     · «A les teues notes» (abans «Al teu MAS»; 261024 correccions, Gemini
       G2-02): la connexió de sempre, l'únic botó primari.
   El port es simula a banda (la prova principal, ConnectarSection.test.jsx,
   no el simula i hi ha de continuar verda). */
const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), update: vi.fn(), canCreate: true, user: { id: 'U' },
  params: new URLSearchParams(), config: {}, t: (_, alternativa) => alternativa,
  identitat: null,
  xat: { chatThreads: [], cercaMembres: vi.fn(), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  capacitats: new Set(), perfil: vi.fn(), segueix: vi.fn(), deixa: vi.fn(), estat: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navigate,
  useSearchParams: () => [m.params],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: m.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => m.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => m.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => m.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => m.media }));
vi.mock('../notes/NotesDataContext', () => ({
  useNotesData: () => ({
    noteFolders: [], notes: [], creaNota: m.crea, updateNote: m.update,
    canCreate: m.canCreate, config: m.config, status: 'ready', error: null, refresh: vi.fn()
  })
}));
/* T43b · el bloc d'administrar té les seues proves; ací només es mira on es munta. */
vi.mock('./organitzacio/BlocAdministrarOrganitzacio.jsx', () => ({
  BlocAdministrarOrganitzacio: ({ orgId }) => React.createElement('p', { 'data-bloc-administrar': orgId }, 'Administrar')
}));
/* El port, parcial: la resta d'exportacions és la de veres. La capacitat
   'seguiments' (T6b) es simula amb la forma del contracte de la Directiva. */
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => m.capacitats.has(cap),
  loadPerfilPublic: (...args) => m.perfil(...args),
  segueix: (...args) => m.segueix(...args),
  deixaDeSeguir: (...args) => m.deixa(...args),
  estatSeguiment: (...args) => m.estat(...args)
}));
import ConnectarSection, { fitxesDeLaConnexio, perfilPerConnectar } from './ConnectarSection.jsx';
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { directeDeLlavor } from '../control/xatCorporatiu.js';
import { ambDeLEnllac } from './missatgeAlXat.js';
import { MISSATGES_SEGUIMENTS, errorDeSeguiment } from '../../data/contracte.js';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { TEXTOS_ERROR_SEGUIMENT, avisaDelSeguiment } from './useSeguiment.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import { FONTS_PER_IDIOMA } from '../../../tests/helpers/diccionaris.js';

const UUID_PEPA = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const UUID_ORG = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091';
const UUID_SOCDEPOBLE = '0e9d8c7b-6a5f-4e3d-9c2b-1a0f9e8d7c6b';
const PEPA = Object.freeze({ tipus: 'persona', id: UUID_PEPA, nom: 'Pepa Soler' });
const RENTONAR = Object.freeze({ tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar' });
/* El title de l'URL és d'una impostora: cap camí no l'ha de dir. */
const PERFIL_PEPA = `item_id=${UUID_PEPA}&title=Impostora&sectionId=perfil&objecte=persona&ruta=%2Fgent%2F${UUID_PEPA}`;
const PERFIL_RENTONAR = `item_id=${UUID_ORG}&title=Impostora&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2F${UUID_ORG}&organitzacio=${UUID_ORG}`;
const SAMARRETA = 'item_id=samarreta-socdepoble&title=Samarreta&sectionId=mercat';
const MERCAT_AMB = (camps) => ({
  status: 'ready', feedPosts: [], events: [],
  marketItems: [{ id: 'samarreta-socdepoble', title: 'Samarreta', ...camps }]
});
const XAT_REMOT = Object.freeze({ estat: 'remot', href: `/xat?amb=${UUID_SOCDEPOBLE}`, avis: null, resol: null });
const XAT_DE_LLAVOR = Object.freeze({ ...XAT_SOCDEPOBLE_DE_LLAVOR, directeAmb: directeDeLlavor });
const ambXat = (xat = XAT_REMOT) => <XatSocDePobleContext.Provider value={xat}><ConnectarSection /></XatSocDePobleContext.Provider>;
/* R4-04 · amb el proveïdor de moderació: la porta de les normes de veres (asseguraNormes). */
const ambNormes = (asseguraNormes, xat = XAT_REMOT) => (
  <ModeracioContext.Provider value={{ asseguraNormes }}>{ambXat(xat)}</ModeracioContext.Provider>
);
const AVIS_REMOT = (nom) => `${nom} rebrà un missatge al xat per a dir-li que t’hi has connectat.`;
/* 261024 correccions (R4-01) · El port dels seguiments, fidel a l'SQL
   (2610241430 i la columna/registre de «primer» de C3): deixa_de_seguir
   esborra la fila, i segueix torna `nou` = no hi era ARA i `primer` = no
   hi ha estat MAI. Amb `ambPrimer: false`, un servidor que encara no diu
   `primer` (el client cau a `nou`). */
function portFidel({ ambPrimer = true } = {}) {
  const ara = new Set();
  const mai = new Set();
  const clau = ({ tipus, id }) => `${tipus}:${id}`;
  m.estat.mockImplementation(async (seguit) => ({ seguint: ara.has(clau(seguit)), creatAl: null }));
  m.segueix.mockImplementation(async (seguit) => {
    const c = clau(seguit);
    const nou = !ara.has(c);
    const primer = !mai.has(c);
    ara.add(c);
    mai.add(c);
    return { seguint: true, creatAl: '2026-10-24T12:00:00Z', nou, ...(ambPrimer ? { primer } : {}) };
  });
  m.deixa.mockImplementation(async (seguit) => { ara.delete(clau(seguit)); return { seguint: false }; });
}
const CONNECTA = 'Connectar a «Safata d’Entrada»';
const cami = (nom) => screen.queryByRole('group', { name: nom });
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
  m.identitat = { actor: { tipus: 'persona', id: 'U', nom: 'Toni Ferrer' }, identitats: [{ tipus: 'persona', id: 'U', nom: 'Toni Ferrer' }], memberships: [] };
  m.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [] };
  m.capacitats = new Set(['directori', 'seguiments']);
  m.perfil.mockImplementation(async (id) => (id === UUID_ORG ? RENTONAR : id === UUID_PEPA ? PEPA : null));
  m.estat.mockResolvedValue({ seguint: false, creatAl: null });
  m.segueix.mockResolvedValue({ seguint: true, creatAl: '2026-10-24T12:00:00Z', nou: true });
  m.deixa.mockResolvedValue({ seguint: false });
  m.crea.mockResolvedValue({ id: 'n-9', revision: 0 });
  m.xat.cercaMembres.mockResolvedValue([]);
  m.xat.creaFil.mockImplementation(async (id) => `f-${id}`);
  m.xat.sendChatMessage.mockImplementation(async () => [{ id: 'm-1' }]);
});

describe('Entre persones · des d’un perfil', () => {
  test('el nom és el de la fitxa pública, mai el de l’URL; escriure-li obri el seu xat i no connecta res al MAS', async () => {
    render(ambXat());
    expect(await screen.findByRole('heading', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    expect(m.perfil).toHaveBeenCalledWith(UUID_PEPA, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    const relacio = cami('Entre persones');
    expect(relacio).toBeTruthy();
    expect(relacio.textContent).not.toContain('Impostora');
    expect(cami('Formar part')).toBeNull();
    fireEvent.click(within(relacio).getByRole('button', { name: 'Escriu-li a Pepa Soler' }));
    expect(m.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_PEPA}`);
    expect(m.crea).not.toHaveBeenCalled();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
  });

  test('seguir: l’avís es diu abans del clic, segueix() rep la fitxa de confiança i el xat rep UN missatge la primera vegada', async () => {
    /* Actualitzada a posta (261024 correccions): R4-01, el port és fidel a l'SQL (deixar de seguir esborra la fila, i el
       segon segueix torna nou: true, primer: false); R3-13, «per a dir-li que t’hi has connectat». */
    portFidel();
    render(ambXat());
    const avis = await screen.findByText(AVIS_REMOT('Pepa Soler'));
    expect(avis).toBeTruthy();
    expect(m.estat).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Seguir Pepa Soler' })); });
    expect(m.segueix).toHaveBeenCalledTimes(1);
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    expect(m.xat.creaFil).toHaveBeenCalledTimes(1);
    expect(m.xat.creaFil).toHaveBeenCalledWith(UUID_PEPA, null);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    const [fil, text] = m.xat.sendChatMessage.mock.calls[0];
    expect(fil).toEqual({ id: `f-${UUID_PEPA}` });
    expect(text).toBe('Connexió nova: m’he connectat amb tu a Sóc de Poble i ara et seguisc.');
    expect(screen.getByRole('status').textContent).toBe('Ara seguixes Pepa Soler. Li hem enviat un missatge al xat.');
    /* Correcció C17 · el botó premut se n'ha anat: el focus és al títol del bloc. */
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Connectar amb Pepa Soler' }));
    expect(m.crea).not.toHaveBeenCalled();
    expect(m.navigate).not.toHaveBeenCalled();

    /* Deixar de seguir no avisa ningú. */
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Deixar de seguir Pepa Soler' })); });
    expect(m.deixa).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    expect(screen.getByRole('status').textContent).toBe('Ja no seguixes Pepa Soler. No li hem dit res.');
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);

    /* Tornar a seguir després de deixar-ho: el servidor diu nou: true però no primer, i no ix cap missatge més. */
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Seguir Pepa Soler' })); });
    expect(m.segueix).toHaveBeenCalledTimes(2);
    await expect(m.segueix.mock.results[1].value).resolves.toMatchObject({ nou: true, primer: false });
    expect(m.xat.creaFil).toHaveBeenCalledTimes(1);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('Tornes a seguir Pepa Soler. Esta vegada no li hem enviat cap missatge: només s’avisa la primera.');
    expect(screen.getByRole('button', { name: 'Deixar de seguir Pepa Soler' })).toBeTruthy();
  });

  test('R4-01 · tres voltes de seguir i deixar de seguir: un sol missatge al xat', async () => {
    portFidel();
    render(ambXat());
    for (let volta = 0; volta < 3; volta += 1) {
      const seguir = await screen.findByRole('button', { name: 'Seguir Pepa Soler' });
      await act(async () => { fireEvent.click(seguir); });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Deixar de seguir Pepa Soler' })); });
    }
    expect(m.segueix).toHaveBeenCalledTimes(3);
    expect(m.deixa).toHaveBeenCalledTimes(3);
    expect(m.xat.creaFil).toHaveBeenCalledTimes(1);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
  });

  test('R4-01 · un servidor que encara no diu «primer» avisa amb «nou», com abans', async () => {
    portFidel({ ambPrimer: false });
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Seguir Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('Ara seguixes Pepa Soler. Li hem enviat un missatge al xat.');
    expect([
      avisaDelSeguiment({ nou: true, primer: true }), avisaDelSeguiment({ nou: true, primer: false }),
      avisaDelSeguiment({ nou: true }), avisaDelSeguiment({ nou: false }), avisaDelSeguiment(null)
    ]).toEqual([true, false, true, false, false]);
  });

  test('si ja la seguies, ho diu sense cap botó de seguir ni cap missatge', async () => {
    m.estat.mockResolvedValue({ seguint: true, creatAl: '2026-10-01T09:00:00Z' });
    render(ambXat());
    expect(await screen.findByText('Ja seguixes Pepa Soler.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Seguir Pepa Soler' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Deixar de seguir Pepa Soler' })).toBeTruthy();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
  });

  test.each([
    ['el missatge no ix', () => m.xat.sendChatMessage.mockResolvedValue([])],
    ['la conversa no s’obri', () => m.xat.creaFil.mockRejectedValue(Object.assign(new Error('SDP-XAT-016'), { code: 'SDP-XAT-016' }))],
    ['es declinen les normes', () => m.xat.sendChatMessage.mockRejectedValue(new DOMException('Cal acceptar les normes de convivència.', 'AbortError'))]
  ])('un avís que no arriba (%s) no desfà el seguiment, i es diu', async (_, prepara) => {
    prepara();
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Seguir Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('status').textContent).toBe('Ara seguixes Pepa Soler, però el missatge al xat no ha eixit. Si vols, escriu-li tu.');
    expect(screen.getByRole('button', { name: 'Deixar de seguir Pepa Soler' })).toBeTruthy();
    expect(m.deixa).not.toHaveBeenCalled();
  });

  test('R4-04 · seguir amb les normes declinades: cap conversa oberta, i es diu que el missatge no ha eixit', async () => {
    const asseguraNormes = vi.fn().mockResolvedValue(false);
    render(ambNormes(asseguraNormes));
    const seguir = await screen.findByRole('button', { name: 'Seguir Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(m.segueix).toHaveBeenCalledTimes(1);
    expect(asseguraNormes).toHaveBeenCalledTimes(1);
    expect(m.xat.creaFil).not.toHaveBeenCalled();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('Ara seguixes Pepa Soler, però el missatge al xat no ha eixit. Si vols, escriu-li tu.');
  });

  test('si seguir falla, ho diu i no envia res', async () => {
    m.segueix.mockRejectedValue(new Error('Supabase 500: boom'));
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Seguir Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut seguir Pepa Soler. Torna-ho a provar.');
    expect(screen.getByRole('alert').textContent).not.toContain('Supabase');
    expect(screen.getByRole('button', { name: 'Seguir Pepa Soler' })).toBeTruthy();
    expect(m.xat.creaFil).not.toHaveBeenCalled();
  });

  test('un error amb codi del contracte diu el seu motiu (mai el text del servidor)', async () => {
    m.segueix.mockRejectedValue(errorDeSeguiment('SDP-SEG-004', new Error('Supabase 400: raw')));
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Seguir Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('alert').textContent).toBe('L’has bloquejada: desbloqueja-la abans de seguir-la.');
    expect(m.xat.creaFil).not.toHaveBeenCalled();
  });

  /* 261024 correccions (R3-12) · el motiu es diu en la llengua de qui mira, i NO-DISPONIBLE amb un text per a la gent. */
  test.each([
    ['SDP-SEG-004', 'La has bloqueado: desbloquéala antes de seguirla.'],
    ['SDP-SEG-006', 'Demasiados seguimientos en poco tiempo. Vuelve a intentarlo dentro de un rato.'],
    ['NO-DISPONIBLE', 'Este pueblo todavía no permite seguir a nadie desde la app.'],
    ['DESCONEGUT', 'No se ha podido seguir a Pepa Soler. Vuelve a intentarlo.']
  ])('en castellà, un error %s de seguir es diu en castellà', async (codi, text) => {
    m.t = createTranslator('es');
    m.segueix.mockRejectedValue(errorDeSeguiment(codi, new Error('Supabase 400: raw')));
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Seguir a Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('alert').textContent).toBe(text);
    expect(screen.getByRole('alert').textContent).not.toMatch(/migraci|Supabase|seguiments/);
  });

  test('R3-12 · NO-DISPONIBLE en deixar de seguir no diu mai el text del desenvolupador', async () => {
    m.estat.mockResolvedValue({ seguint: true, creatAl: null });
    m.deixa.mockRejectedValue(errorDeSeguiment('NO-DISPONIBLE'));
    render(ambXat());
    const deixar = await screen.findByRole('button', { name: 'Deixar de seguir Pepa Soler' });
    await act(async () => { fireEvent.click(deixar); });
    expect(screen.getByRole('alert').textContent).toBe('Este poble encara no permet seguir ningú des de l’app.');
    expect(screen.getByRole('alert').textContent).not.toContain(MISSATGES_SEGUIMENTS['NO-DISPONIBLE']);
  });

  test('R3-12 · cada codi del contracte té el seu text, als cinc diccionaris i sense parlar de migracions', () => {
    expect(Object.keys(TEXTOS_ERROR_SEGUIMENT).sort()).toEqual(Object.keys(MISSATGES_SEGUIMENTS).sort());
    const ca = createTranslator('ca');
    for (const [clau, reserva] of Object.values(TEXTOS_ERROR_SEGUIMENT)) {
      expect(ca(clau, ''), clau).toBe(reserva);
      for (const { code } of SUPPORTED_LANGUAGES) {
        expect(FONTS_PER_IDIOMA[code], `${code} ${clau}`).toContain(`'${clau}':`);
        expect(createTranslator(code)(clau, ''), `${code} ${clau}`).not.toMatch(/migra|^$/i);
      }
    }
  });

  /* 261024 correccions (R3-11) · En llavor el xat és d'este dispositiu: l'avís no promet que l'altra banda rep res. */
  test('llavor · abans i després de seguir, el missatge es queda en este dispositiu', async () => {
    m.config = { dataMode: 'seed' };
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = MERCAT_AMB({ author_name: 'Sóc de Poble', seller: 'Sóc de Poble', author_entity_id: 'socdepoble' });
    render(ambXat(XAT_DE_LLAVOR));
    expect(await screen.findByText('Sense servidor, el missatge per a Sóc de Poble es queda al xat d’este dispositiu: ningú més el rep.')).toBeTruthy();
    expect(screen.queryByText(AVIS_REMOT('Sóc de Poble'))).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Seguir Sóc de Poble' })); });
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('Ara seguixes Sóc de Poble. El missatge s’ha quedat al xat d’este dispositiu: ningú més l’ha rebut.');
    expect(screen.getByRole('status').textContent).not.toContain('Li hem enviat');
  });

  test('un servidor sense l’esquema dels seguiments (NO-DISPONIBLE en llegir) es diu com sense la capacitat', async () => {
    m.estat.mockRejectedValue(errorDeSeguiment('NO-DISPONIBLE'));
    render(ambXat());
    expect(await screen.findByText('Este poble encara no permet seguir ningú des de l’app: de moment, la relació és la conversa.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Seguir / })).toBeNull();
    expect(m.segueix).not.toHaveBeenCalled();
  });

  test('sense la capacitat de seguir no hi ha botó ni crida: la relació és la conversa', async () => {
    m.capacitats = new Set(['directori']);
    render(ambXat());
    expect(await screen.findByText('Este poble encara no permet seguir ningú des de l’app: de moment, la relació és la conversa.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Seguir / })).toBeNull();
    expect(screen.getByRole('button', { name: 'Escriu-li a Pepa Soler' })).toBeTruthy();
    expect(m.estat).not.toHaveBeenCalled();
  });

  test('una fitxa que no és del tipus demanat (una entitat per a objecte=persona) no obri cap relació', async () => {
    m.perfil.mockResolvedValue(RENTONAR);
    m.params = new URLSearchParams(`item_id=${UUID_ORG}&title=Impostora&sectionId=perfil&objecte=persona`);
    render(ambXat());
    await waitFor(() => expect(m.perfil).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(cami('Entre persones')).toBeNull();
    expect(m.estat).not.toHaveBeenCalled();
  });

  test('el perfil propi, o el d’una entitat que representes, no té cap relació', async () => {
    m.user = { id: UUID_PEPA };
    const vista = render(ambXat());
    await waitFor(() => expect(m.perfil).toHaveBeenCalled());
    await act(async () => {});
    expect(cami('Entre persones')).toBeNull();
    vista.unmount();
    m.user = { id: 'U' };
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    m.identitat.identitats = [...m.identitat.identitats, { tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar' }];
    render(ambXat());
    expect(await screen.findByRole('heading', { name: 'Formar part de l’entitat' })).toBeTruthy();
    await act(async () => {});
    expect(cami('Entre persones')).toBeNull();
    expect(screen.queryByRole('button', { name: /Demanar formar part/ })).toBeNull();
    expect(m.estat).not.toHaveBeenCalled();
  });

  test('remot sense sessió: la fitxa d’una altra persona ni es demana; el camí no té nom i porta a entrar amb esta consulta', () => {
    m.user = null;
    render(ambXat());
    expect(m.perfil).not.toHaveBeenCalled();
    const relacio = cami('Entre persones');
    expect(within(relacio).getByRole('heading', { name: 'Connectar amb esta persona' })).toBeTruthy();
    expect(relacio.textContent).not.toContain('Impostora');
    fireEvent.click(within(relacio).getByRole('button', { name: 'Entra per a connectar-hi' }));
    expect(anadaAEntrar(m.navigate.mock.calls.at(-1)[0])).toEqual({ ruta: '/registre', mode: 'entrar', tornar: `/connectar?${m.params}` });
  });
});

describe('Entre persones · l’autor d’un element', () => {
  test('llavor · seguir l’entitat pilot (la Samarreta) avisa pel xat de Sóc de Poble', async () => {
    m.config = { dataMode: 'seed' };
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = MERCAT_AMB({ author_name: 'Sóc de Poble', seller: 'Sóc de Poble', author_entity_id: 'socdepoble' });
    render(ambXat(XAT_DE_LLAVOR));
    expect(screen.getByRole('heading', { name: 'Connectar amb l’autor' })).toBeTruthy();
    const seguir = await screen.findByRole('button', { name: 'Seguir Sóc de Poble' });
    await act(async () => { fireEvent.click(seguir); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'entitat', id: 'socdepoble' }, { dataMode: 'seed' });
    expect(m.xat.creaFil).toHaveBeenCalledWith('socdepoble', null);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
  });

  test('remot · la Samarreta (un id de la llavor) no es pot seguir des d’ací, però el xat de Sóc de Poble continua', async () => {
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = MERCAT_AMB({ author_name: 'Sóc de Poble', seller: 'Sóc de Poble', author_entity_id: 'socdepoble' });
    render(ambXat(XAT_REMOT));
    expect(screen.getByRole('button', { name: 'Escriu-li a Sóc de Poble' })).toBeTruthy();
    await act(async () => {});
    expect(screen.queryByRole('button', { name: /^Seguir / })).toBeNull();
    expect(m.estat).not.toHaveBeenCalled();
  });

  test('un autor amb l’id del servidor se segueix pel seu id i l’avís va al seu directe', async () => {
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = MERCAT_AMB({ author_name: 'Pepa Soler', author_user_id: UUID_PEPA });
    render(ambXat(XAT_REMOT));
    const seguir = await screen.findByRole('button', { name: 'Seguir Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    expect(m.xat.creaFil).toHaveBeenCalledWith(UUID_PEPA, null);
  });

  test('un element sense autor no obri cap camí: ni capçaleres ni l’entradeta dels camins', () => {
    m.params = new URLSearchParams('item_id=sella&title=Sella&sectionId=pobles&objecte=poble&ruta=%2Fpobles%2Fsella');
    render(ambXat());
    expect(cami('Entre persones')).toBeNull();
    expect(cami('Formar part')).toBeNull();
    /* Actualitzada a posta (261024 correccions): «A les teues notes» (Gemini G2-02). */
    expect(screen.queryByText('A les teues notes')).toBeNull();
    expect(screen.queryByText(/^Cada camí té el seu botó/)).toBeNull();
  });
});

describe('Formar part de l’entitat', () => {
  beforeEach(() => { m.params = new URLSearchParams(PERFIL_RENTONAR); });

  test('els tres camins en ordre, i una sola fitxa per a la relació i per a formar-ne part', async () => {
    const { container } = render(ambXat());
    expect(await screen.findByRole('heading', { name: 'Connectar amb El Rentonar' })).toBeTruthy();
    const capçaleres = [...container.querySelectorAll('.sdp-connectar__cami-cap .sdp-connectar__tipus')].map((p) => p.textContent);
    /* Actualitzada a posta (261024 correccions): directiva del Mestre 15:05 (Gemini G2-02), cap «MAS»; R3-05, l'entradeta
       i l'ajuda del camí diuen el mateix que «Qui ho pot vore?» (en privat no avisa ningú; persones o grups reben l'enllaç). */
    expect(capçaleres).toEqual(['Entre persones', 'Formar part', 'A les teues notes']);
    expect(screen.getByText('Cada camí té el seu botó: seguir o escriure a algú no et fa membre de res. Si guardes la connexió en privat, no avisa ningú; si tries persones o grups de xat, els enviarem l’enllaç.')).toBeTruthy();
    expect(screen.getByText(/^Una còpia al teu Bloc per a llegir-la després/).textContent)
      .toBe('Una còpia al teu Bloc per a llegir-la després, que no et fa membre de res. Tu tries qui ho pot vore: en privat no avisa ningú; a persones o grups de xat els enviarem l’enllaç per xat, i a tot el poble la compartiràs tu al Mur.');
    expect(m.perfil).toHaveBeenCalledTimes(1);
    const formarPart = cami('Formar part');
    expect(within(formarPart).getByRole('heading', { name: 'Formar part de l’entitat' })).toBeTruthy();
    expect(formarPart.querySelector('[data-bloc-administrar]').getAttribute('data-bloc-administrar')).toBe(UUID_ORG);
    expect(formarPart.textContent).not.toContain('Impostora');
    /* D1 · l'únic primari de la vista és el del MAS (el de la confirmació viu dins del <dialog>, tancat). */
    const primaris = [...container.querySelectorAll('.sdp-boto--primari')].filter((boto) => !boto.closest('dialog'));
    expect(primaris.map((boto) => boto.textContent)).toEqual([CONNECTA]);
  });

  test('la sol·licitud: confirmació amb el text que s’enviarà, l’afegit opcional, el xat de l’entitat i després la conversa', async () => {
    render(ambXat());
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    const dialeg = screen.getByRole('dialog', { name: 'Demanar formar part de El Rentonar' });
    expect(within(dialeg).getByText('Sol·licitud per a formar part de El Rentonar.')).toBeTruthy();
    expect(dialeg.textContent).not.toContain('Impostora');
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Vols afegir-hi res?' }), { target: { value: '  Toque la dolçaina.  ' } });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    expect(m.xat.creaFil).toHaveBeenCalledWith(UUID_ORG, null);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    const [fil, text] = m.xat.sendChatMessage.mock.calls[0];
    expect(fil).toEqual({ id: `f-${UUID_ORG}` });
    expect(text).toBe('Sol·licitud per a formar part de El Rentonar.\n\nToque la dolçaina.');
    expect(m.navigate).toHaveBeenLastCalledWith(`/xat/f-${UUID_ORG}`);
    expect(m.crea).not.toHaveBeenCalled();
    /* Cap seguiment de passada: formar part no és seguir. */
    expect(m.segueix).not.toHaveBeenCalled();
  });

  test('cancel·lar la confirmació no envia res', async () => {
    render(ambXat());
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel·lar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(m.xat.creaFil).not.toHaveBeenCalled();
    expect(m.navigate).not.toHaveBeenCalled();
  });

  test('si la sol·licitud no ix, la confirmació es tanca, es diu i es pot anar al xat a tornar-la a provar', async () => {
    m.xat.sendChatMessage.mockResolvedValue([]);
    render(ambXat());
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    const avis = screen.getByRole('alert');
    expect(avis.textContent).toContain('La sol·licitud no ha eixit. La trobaràs al xat de El Rentonar per a tornar-la a provar.');
    expect(m.navigate).not.toHaveBeenCalled();
    fireEvent.click(within(avis).getByRole('button', { name: 'Obrir el xat de El Rentonar' }));
    expect(m.navigate).toHaveBeenLastCalledWith(`/xat/f-${UUID_ORG}`);
  });

  test('declinar les normes no envia res i ho diu; una conversa que no s’obri, també', async () => {
    m.xat.sendChatMessage.mockRejectedValue(new DOMException('Cal acceptar les normes de convivència.', 'AbortError'));
    const vista = render(ambXat());
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    expect(screen.getByRole('alert').textContent).toContain('Per a publicar, cal acceptar les normes de convivència.');
    vista.unmount();
    m.xat.creaFil.mockRejectedValue(new Error('Supabase 500: boom'));
    render(ambXat());
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    const avis = screen.getByRole('alert');
    expect(avis.textContent).toContain('No s’ha pogut obrir el xat de El Rentonar.');
    expect(avis.textContent).not.toContain('Supabase');
    expect(within(avis).queryByRole('button')).toBeNull();
    expect(m.navigate).not.toHaveBeenCalled();
  });

  test('R4-04 · les normes es pregunten abans d’obrir el xat de l’entitat: declinades, cap conversa nova', async () => {
    const asseguraNormes = vi.fn().mockResolvedValue(false);
    render(ambNormes(asseguraNormes));
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    expect(asseguraNormes).toHaveBeenCalledTimes(1);
    expect(m.xat.creaFil).not.toHaveBeenCalled();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    expect(m.navigate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    const avis = screen.getByRole('alert');
    expect(avis.textContent).toContain('Per a publicar, cal acceptar les normes de convivència.');
    expect(within(avis).queryByRole('button')).toBeNull();
  });

  test('R4-04 · acceptades, primer les normes i després la conversa', async () => {
    const asseguraNormes = vi.fn().mockResolvedValue(true);
    render(ambNormes(asseguraNormes));
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    expect(asseguraNormes.mock.invocationCallOrder[0]).toBeLessThan(m.xat.creaFil.mock.invocationCallOrder[0]);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(m.navigate).toHaveBeenLastCalledWith(`/xat/f-${UUID_ORG}`);
  });

  test('R4-05 · si el bloc ja no hi és quan arriba la resposta, no porta enlloc', async () => {
    let obri;
    m.xat.creaFil.mockImplementation(() => new Promise((resolve) => { obri = resolve; }));
    const vista = render(ambXat());
    fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enviar la sol·licitud' })); });
    expect(m.xat.creaFil).toHaveBeenCalledTimes(1);
    vista.unmount();
    await act(async () => { obri(`f-${UUID_ORG}`); });
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(m.navigate).not.toHaveBeenCalled();
  });

  test('R4-05 · si la persona s’ha mogut des del clic, ni hi va ni es pinta cap avís; el diàleg es tanca', async () => {
    const abans = `${window.location.pathname}${window.location.search}`;
    let obri;
    m.xat.creaFil.mockImplementation(() => new Promise((resolve) => { obri = resolve; }));
    try {
      render(ambXat());
      fireEvent.click(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' }));
      await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Enviar la sol·licitud' })); });
      window.history.pushState({}, '', '/mur');
      await act(async () => { obri(`f-${UUID_ORG}`); });
      expect(m.navigate).not.toHaveBeenCalled();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByRole('dialog')).toBeNull();
    } finally {
      window.history.replaceState({}, '', abans);
    }
  });

  test.each([
    ['member', 'Ja formes part de El Rentonar'],
    ['admin', 'Ja formes part de El Rentonar i l’administres.']
  ])('qui ja en forma part (%s) ho llig i no té cap sol·licitud', async (role, text) => {
    m.identitat.memberships = [{ id: UUID_ORG, slug: 'el-rentonar', name: 'El Rentonar', role }];
    render(ambXat());
    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Demanar formar part/ })).toBeNull();
  });

  test('sense sessió: «Entra per a demanar-ho» porta a entrar i torna a esta consulta', async () => {
    m.user = null;
    render(ambXat());
    const formarPart = cami('Formar part');
    fireEvent.click(within(formarPart).getByRole('button', { name: 'Entra per a demanar-ho' }));
    expect(anadaAEntrar(m.navigate.mock.calls.at(-1)[0])).toEqual({ ruta: '/registre', mode: 'entrar', tornar: `/connectar?${m.params}` });
  });

  test('sense el directori no hi ha xat on arribar: ho diu, sense botó; mentre la fitxa carrega, busca', async () => {
    m.capacitats = new Set(['seguiments']);
    const vista = render(ambXat());
    expect(screen.getByText('Des d’ací encara no es pot arribar al xat d’esta entitat: parla directament amb qui l’administra.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Demanar formar part/ })).toBeNull();
    vista.unmount();
    m.capacitats = new Set(['directori']);
    m.perfil.mockReturnValue(new Promise(() => {}));
    render(ambXat());
    expect(screen.getByText('Buscant el xat de l’entitat…')).toBeTruthy();
  });

  test('una organització d’un element (?organitzacio en una altra consulta) es resol a banda, amb el seu nom', async () => {
    m.params = new URLSearchParams(`${SAMARRETA}&organitzacio=${UUID_ORG}`);
    render(ambXat());
    expect(await screen.findByRole('button', { name: 'Demanar formar part de El Rentonar' })).toBeTruthy();
    expect(m.perfil).toHaveBeenCalledTimes(1);
    expect(m.perfil).toHaveBeenCalledWith(UUID_ORG, expect.any(Object));
  });

  test('el MAS continua sent el seu camí: el botó gran connecta la nota i no va a cap xat', async () => {
    render(ambXat());
    await screen.findByRole('heading', { name: 'Connectar amb El Rentonar' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: CONNECTA })); });
    expect(m.crea).toHaveBeenCalledTimes(1);
    expect(m.crea.mock.calls[0][0].origen).toMatchObject({ objecte: 'entitat', ruta: `/empresa/${UUID_ORG}` });
    expect(m.navigate).toHaveBeenCalledWith('/notes?nota=n-9', { replace: true });
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    expect(m.segueix).not.toHaveBeenCalled();
  });
});

describe('peces pures', () => {
  test('fitxesDeLaConnexio: el perfil i l’organització, una sola fitxa si són la mateixa', () => {
    expect(fitxesDeLaConnexio(new URLSearchParams(PERFIL_RENTONAR), { teSessio: true })).toEqual({
      perfil: { id: UUID_ORG, tipus: 'entitat' }, organitzacio: null, orgId: UUID_ORG
    });
    expect(fitxesDeLaConnexio(new URLSearchParams(`${SAMARRETA}&organitzacio=${UUID_ORG}`), { teSessio: true })).toEqual({
      perfil: null, organitzacio: { id: UUID_ORG, tipus: 'entitat' }, orgId: UUID_ORG
    });
    expect(fitxesDeLaConnexio(new URLSearchParams(PERFIL_PEPA), { teSessio: false, dataMode: 'remote' }).perfil).toBeNull();
    expect(fitxesDeLaConnexio(new URLSearchParams(PERFIL_PEPA), { teSessio: false, dataMode: 'seed' }).perfil).toEqual({ id: UUID_PEPA, tipus: 'persona' });
    expect(fitxesDeLaConnexio(new URLSearchParams('item_id=iaia-maria&sectionId=perfil&objecte=ia'), { teSessio: true }).perfil).toBeNull();
  });

  test('perfilPerConnectar: una IA no és cap persona; el pilot va pel xat de Sóc de Poble', () => {
    const opcions = { currentUser: { id: 'U' }, dataMode: 'remote', xat: XAT_REMOT };
    expect(perfilPerConnectar({ tipus: 'ia', id: 'iaia-maria', nom: 'IAIA MarIA' }, opcions)).toBeNull();
    expect(perfilPerConnectar(PEPA, opcions)).toMatchObject({
      nom: 'Pepa Soler', deFitxa: true, interlocutor: { id: UUID_PEPA }, seguiment: { tipus: 'persona', id: UUID_PEPA }
    });
    expect(perfilPerConnectar({ tipus: 'grup', id: UUID_ORG, nom: 'Colla' }, opcions).seguiment).toEqual({ tipus: 'entitat', id: UUID_ORG });
    const pilot = perfilPerConnectar({ tipus: 'entitat', id: 'socdepoble', nom: 'Sóc de Poble' }, { ...opcions, dataMode: 'seed', xat: XAT_DE_LLAVOR });
    expect(pilot).toMatchObject({ interlocutor: null, seguiment: { tipus: 'entitat', id: 'socdepoble' } });
    expect(ambDeLEnllac(`/xat?amb=${UUID_SOCDEPOBLE}`)).toBe(UUID_SOCDEPOBLE);
    expect(ambDeLEnllac('/xat?sobre=entitat:x')).toBeNull();
    expect(ambDeLEnllac('https://fora.test/xat?amb=x')).toBeNull();
  });
});

/* Integració 261024 (T6b · qui_em_segueix amb orgId) · Qui administra una
   entitat veu el nom de qui la seguix («Qui seguix {nom}» a GestioMembres):
   abans del clic, el camí ho diu. D'una persona, no (ella veu «Gent que et
   seguix», i això ja ho diu l'avís del xat). */
describe('Entre persones · seguir una entitat diu qui veurà el teu nom', () => {
  const AVIS_ENTITAT = 'Les persones que administren El Rentonar voran el teu nom a la llista de gent que seguix l’entitat.';

  test('abans del clic, al costat de l’avís del xat; després de seguir, ja no cal', async () => {
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    render(ambXat());
    const avis = await screen.findByText(AVIS_ENTITAT);
    const relacio = cami('Entre persones');
    expect(relacio.contains(avis)).toBe(true);
    /* Actualitzada a posta (261024 correccions): R3-13, «per a dir-li que t’hi has connectat». */
    expect(within(relacio).getByText(AVIS_REMOT('El Rentonar'))).toBeTruthy();
    expect(m.segueix).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(within(relacio).getByRole('button', { name: 'Seguir El Rentonar' })); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'entitat', id: UUID_ORG }, {});
    expect(screen.queryByText(AVIS_ENTITAT)).toBeNull();
  });

  test('seguir una persona no ho diu', async () => {
    render(ambXat());
    expect(await screen.findByRole('button', { name: 'Seguir Pepa Soler' })).toBeTruthy();
    expect(screen.queryByText(/voran el teu nom/)).toBeNull();
  });

  test('en castellà, amb el nom de la fitxa', async () => {
    m.t = createTranslator('es');
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    render(ambXat());
    expect(await screen.findByText('Las personas que administran El Rentonar verán tu nombre en la lista de gente que sigue a la entidad.')).toBeTruthy();
  });
});

/* CA-6 · Tot per t(), als cinc diccionaris, cada clau amb nom amb un sol {nom} i cap sufix enganxat. */
const CLAUS_AMB_NOM = [
  'section.connectar.relacio.ajuda', 'section.connectar.persona.titol',
  'section.connectar.seguir.avis', 'section.connectar.seguir.avisEntitat', 'section.connectar.seguir.boto', 'section.connectar.seguir.deixa',
  'section.connectar.seguir.jaSegueixes', 'section.connectar.seguir.avisat', 'section.connectar.seguir.senseAvis',
  'section.connectar.seguir.deixat', 'section.connectar.seguir.senseSessio', 'section.connectar.seguir.comprovant',
  'section.connectar.seguir.errorLectura', 'section.connectar.seguir.errorSegueix', 'section.connectar.seguir.errorDeixa',
  'section.connectar.seguir.avisLlavor', 'section.connectar.seguir.avisatLlavor', 'section.connectar.seguir.represa',
  'section.connectar.formarPart.onArriba', 'section.connectar.formarPart.boto', 'section.connectar.formarPart.dialeg',
  'section.connectar.formarPart.sollicitud', 'section.connectar.formarPart.afegitAjuda', 'section.connectar.formarPart.administres',
  'section.connectar.formarPart.jaEnFormes', 'section.connectar.formarPart.noHaEixit', 'section.connectar.formarPart.senseConversa',
  'section.connectar.formarPart.obriXat'
];
const CLAUS_SENSE_NOM = [
  'section.connectar.lead', 'section.connectar.leadCamins', 'section.connectar.camins.relacio',
  'section.connectar.camins.formarPart', 'section.connectar.camins.mas', 'section.connectar.mas.ajuda',
  'section.connectar.persona.titolSenseNom', 'section.connectar.persona.ajudaSenseNom', 'section.connectar.persona.entraSenseNom',
  'section.connectar.seguir.missatge', 'section.connectar.seguir.noDisponible', 'section.connectar.formarPart.titol',
  'section.connectar.formarPart.que', 'section.connectar.formarPart.afegit', 'section.connectar.formarPart.envia',
  'section.connectar.formarPart.cancela', 'section.connectar.formarPart.entra', 'section.connectar.formarPart.senseSessio',
  'section.connectar.formarPart.jaEnFormesText', 'section.connectar.formarPart.comprovant', 'section.connectar.formarPart.senseXat',
  'section.connectar.connectada'
];

describe('CA-6 · els textos nous de Connectar', () => {
  test('són als cinc diccionaris, amb un sol {nom} les que en porten i cap sufix enganxat', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      const t = createTranslator(code);
      for (const clau of [...CLAUS_AMB_NOM, ...CLAUS_SENSE_NOM]) expect(FONTS_PER_IDIOMA[code], `${code} ${clau}`).toContain(`'${clau}':`);
      for (const clau of CLAUS_AMB_NOM) {
        expect(t(clau, '').split('{nom}'), `${code} ${clau}`).toHaveLength(2);
        expect(t(clau, ''), `${code} ${clau}`).not.toMatch(/\{nom\}-/);
      }
      for (const clau of CLAUS_SENSE_NOM) expect(t(clau, ''), `${code} ${clau}`).not.toContain('{nom}');
    }
  });

  test('en castellà, els camins i el seguiment parlen castellà amb el nom de la fitxa', async () => {
    m.t = createTranslator('es');
    render(ambXat());
    expect(await screen.findByRole('heading', { name: 'Conectar con Pepa Soler' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Entre personas' })).toBeTruthy();
    /* Actualitzada a posta (261024 correccions): «En tus notas», sense «MAS» (Gemini G2-02). */
    expect(screen.getByText('En tus notas')).toBeTruthy();
    expect(await screen.findByText('Pepa Soler recibirá un mensaje en el chat diciendo que has conectado.')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Seguir a Pepa Soler' })); });
    expect(m.xat.sendChatMessage.mock.calls[0][1]).toBe('Conexión nueva: he conectado contigo en Sóc de Poble y ahora te sigo.');
    expect(screen.getByRole('group', { name: 'Entre personas' }).textContent).not.toContain('Impostora');
  });
});

/* 261024 correccions (directiva del Mestre 15:05, Gemini G2-02) · Cap «MAS» a
   /connectar, en cap llengua: ni als camins, ni a l'entradeta, ni a les
   opcions, ni al peu. */
describe('G2-02 · /connectar no parla del «MAS»', () => {
  test.each(SUPPORTED_LANGUAGES.map(({ code }) => code))('%s · ni als camins ni al peu', async (code) => {
    m.t = createTranslator(code);
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    const { container } = render(ambXat());
    await screen.findByRole('group', { name: createTranslator(code)('section.connectar.camins.relacio', '') });
    expect(container.textContent).not.toMatch(/\bMAS/);
    for (const clau of ['section.connectar.connectada', 'section.connectar.leadCamins', 'section.connectar.camins.mas', 'section.connectar.mas.ajuda']) {
      expect(createTranslator(code)(clau, ''), `${code} ${clau}`).not.toMatch(/\bMAS/);
    }
  });
});
