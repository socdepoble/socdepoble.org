import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* IDEA-14 (Directiva del Mestre, 261024; auditoria Gemini G-04) · /connectar
   separa la relació humana de la pertinença formal i del MAS:
     · «Entre persones»: connectar (capacitat 'seguiments', amb l'avís al xat
       una sola vegada) i escriure, també des d'un perfil (la fitxa pública
       de confiança, mai l'URL). Actualitzada a posta (P1-11, pla
       261024_2230; G1945-04 de Gemini, ordre del Mestre): els textos diuen
       «Connectar amb {nom}», «Deixar la connexió amb {nom}», «Connectat amb
       {nom}.» i «veïnat connectat»; el port continua sent segueix,
       deixaDeSeguir i estatSeguiment;
     · «Formar part»: la sol·licitud estructurada al xat privat de l'entitat,
       amb confirmació i després a la conversa;
     · «A les teues notes» (abans «Al teu MAS»; 261024 correccions, Gemini
       G2-02): la connexió de sempre, l'únic botó primari.
   Actualitzada a posta (IDEA-22, pla 261025_0045 T5; Directiva del Mestre
   261025): el camí de la relació es diu «Connexió directa», i una entitat
   sense xat privat on arribar ja no és un carreró: el botó porta al xat de
   la seua pàgina.
   El port es simula a banda (la prova principal, ConnectarSection.test.jsx,
   no el simula i hi ha de continuar verda). */
const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), update: vi.fn(), canCreate: true, user: { id: 'U' },
  params: new URLSearchParams(), config: {}, t: (_, alternativa) => alternativa,
  identitat: null,
  xat: { chatThreads: [], cercaMembres: vi.fn(), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  capacitats: new Set(), perfil: vi.fn(), segueix: vi.fn(), deixa: vi.fn(), estat: vi.fn(), titular: vi.fn()
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
  estatSeguiment: (...args) => m.estat(...args),
  /* IDEA-22, punt 2 (pla 261025_0200) · La titular que ha triat mostrar-se (capacitat 'titularPublic'). */
  loadTitularPublic: (...args) => m.titular(...args)
}));
import ConnectarSection, {
  COM_PERSONA, actorsPerAlDesti, actorsPerConnectar, fitxesDeLaConnexio, identitatPropiaDe, perfilPerConnectar
} from './ConnectarSection.jsx';
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { directeDeLlavor } from '../control/xatCorporatiu.js';
import { ambDeLEnllac } from './missatgeAlXat.js';
import { BlocRelacio } from './BlocRelacio.jsx';
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
  m.titular.mockResolvedValue(null);
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
    const relacio = cami('Connexió directa');
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
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Pepa Soler' })); });
    expect(m.segueix).toHaveBeenCalledTimes(1);
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    expect(m.xat.creaFil).toHaveBeenCalledTimes(1);
    expect(m.xat.creaFil).toHaveBeenCalledWith(UUID_PEPA, null);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    const [fil, text] = m.xat.sendChatMessage.mock.calls[0];
    expect(fil).toEqual({ id: `f-${UUID_PEPA}` });
    expect(text).toBe('Connexió nova: m’he connectat amb tu a Sóc de Poble.');
    expect(screen.getByRole('status').textContent).toBe('T’has connectat amb Pepa Soler. Li hem enviat un missatge al xat.');
    /* Correcció C17 · el botó premut se n'ha anat: el focus és al títol del bloc. */
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Connectar amb Pepa Soler' }));
    expect(m.crea).not.toHaveBeenCalled();
    expect(m.navigate).not.toHaveBeenCalled();

    /* Deixar la connexió no avisa ningú. */
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Deixar la connexió amb Pepa Soler' })); });
    expect(m.deixa).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    expect(screen.getByRole('status').textContent).toBe('Has deixat la connexió amb Pepa Soler. No li hem dit res.');
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);

    /* Tornar a seguir després de deixar-ho: el servidor diu nou: true però no primer, i no ix cap missatge més. */
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Pepa Soler' })); });
    expect(m.segueix).toHaveBeenCalledTimes(2);
    await expect(m.segueix.mock.results[1].value).resolves.toMatchObject({ nou: true, primer: false });
    expect(m.xat.creaFil).toHaveBeenCalledTimes(1);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('T’has tornat a connectar amb Pepa Soler. Esta vegada no li hem enviat cap missatge: només s’avisa la primera.');
    expect(screen.getByRole('button', { name: 'Deixar la connexió amb Pepa Soler' })).toBeTruthy();
  });

  test('R4-01 · tres voltes de seguir i deixar de seguir: un sol missatge al xat', async () => {
    portFidel();
    render(ambXat());
    for (let volta = 0; volta < 3; volta += 1) {
      const seguir = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
      await act(async () => { fireEvent.click(seguir); });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Deixar la connexió amb Pepa Soler' })); });
    }
    expect(m.segueix).toHaveBeenCalledTimes(3);
    expect(m.deixa).toHaveBeenCalledTimes(3);
    expect(m.xat.creaFil).toHaveBeenCalledTimes(1);
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
  });

  test('R4-01 · un servidor que encara no diu «primer» avisa amb «nou», com abans', async () => {
    portFidel({ ambPrimer: false });
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('T’has connectat amb Pepa Soler. Li hem enviat un missatge al xat.');
    expect([
      avisaDelSeguiment({ nou: true, primer: true }), avisaDelSeguiment({ nou: true, primer: false }),
      avisaDelSeguiment({ nou: true }), avisaDelSeguiment({ nou: false }), avisaDelSeguiment(null)
    ]).toEqual([true, false, true, false, false]);
  });

  test('si ja la seguies, ho diu sense cap botó de seguir ni cap missatge', async () => {
    m.estat.mockResolvedValue({ seguint: true, creatAl: '2026-10-01T09:00:00Z' });
    render(ambXat());
    expect(await screen.findByText('Connectat amb Pepa Soler.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Deixar la connexió amb Pepa Soler' })).toBeTruthy();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
  });

  test.each([
    ['el missatge no ix', () => m.xat.sendChatMessage.mockResolvedValue([])],
    ['la conversa no s’obri', () => m.xat.creaFil.mockRejectedValue(Object.assign(new Error('SDP-XAT-016'), { code: 'SDP-XAT-016' }))],
    ['es declinen les normes', () => m.xat.sendChatMessage.mockRejectedValue(new DOMException('Cal acceptar les normes de convivència.', 'AbortError'))]
  ])('un avís que no arriba (%s) no desfà el seguiment, i es diu', async (_, prepara) => {
    prepara();
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('status').textContent).toBe('T’has connectat amb Pepa Soler, però el missatge al xat no ha eixit. Si vols, escriu-li tu.');
    expect(screen.getByRole('button', { name: 'Deixar la connexió amb Pepa Soler' })).toBeTruthy();
    expect(m.deixa).not.toHaveBeenCalled();
  });

  test('R4-04 · seguir amb les normes declinades: cap conversa oberta, i es diu que el missatge no ha eixit', async () => {
    const asseguraNormes = vi.fn().mockResolvedValue(false);
    render(ambNormes(asseguraNormes));
    const seguir = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(m.segueix).toHaveBeenCalledTimes(1);
    expect(asseguraNormes).toHaveBeenCalledTimes(1);
    expect(m.xat.creaFil).not.toHaveBeenCalled();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('T’has connectat amb Pepa Soler, però el missatge al xat no ha eixit. Si vols, escriu-li tu.');
  });

  test('si seguir falla, ho diu i no envia res', async () => {
    m.segueix.mockRejectedValue(new Error('Supabase 500: boom'));
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut connectar amb Pepa Soler. Torna-ho a provar.');
    expect(screen.getByRole('alert').textContent).not.toContain('Supabase');
    expect(screen.getByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    expect(m.xat.creaFil).not.toHaveBeenCalled();
  });

  test('un error amb codi del contracte diu el seu motiu (mai el text del servidor)', async () => {
    m.segueix.mockRejectedValue(errorDeSeguiment('SDP-SEG-004', new Error('Supabase 400: raw')));
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('alert').textContent).toBe('L’has bloquejada: desbloqueja-la abans de connectar-t’hi.');
    expect(m.xat.creaFil).not.toHaveBeenCalled();
  });

  /* 261024 correccions (R3-12) · el motiu es diu en la llengua de qui mira, i NO-DISPONIBLE amb un text per a la gent. */
  test.each([
    ['SDP-SEG-004', 'La has bloqueado: desbloquéala antes de conectar con ella.'],
    ['SDP-SEG-006', 'Demasiadas conexiones en poco tiempo. Vuelve a intentarlo dentro de un rato.'],
    ['NO-DISPONIBLE', 'Este pueblo todavía no permite conectar con nadie desde la app.'],
    ['DESCONEGUT', 'No se ha podido conectar con Pepa Soler. Vuelve a intentarlo.']
  ])('en castellà, un error %s de seguir es diu en castellà', async (codi, text) => {
    m.t = createTranslator('es');
    m.segueix.mockRejectedValue(errorDeSeguiment(codi, new Error('Supabase 400: raw')));
    render(ambXat());
    const seguir = await screen.findByRole('button', { name: 'Conectar con Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(screen.getByRole('alert').textContent).toBe(text);
    expect(screen.getByRole('alert').textContent).not.toMatch(/migraci|Supabase|seguiments/);
  });

  test('R3-12 · NO-DISPONIBLE en deixar de seguir no diu mai el text del desenvolupador', async () => {
    m.estat.mockResolvedValue({ seguint: true, creatAl: null });
    m.deixa.mockRejectedValue(errorDeSeguiment('NO-DISPONIBLE'));
    render(ambXat());
    const deixar = await screen.findByRole('button', { name: 'Deixar la connexió amb Pepa Soler' });
    await act(async () => { fireEvent.click(deixar); });
    expect(screen.getByRole('alert').textContent).toBe('Este poble encara no permet connectar amb ningú des de l’app.');
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
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Sóc de Poble' })); });
    expect(m.xat.sendChatMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toBe('T’has connectat amb Sóc de Poble. El missatge s’ha quedat al xat d’este dispositiu: ningú més l’ha rebut.');
    expect(screen.getByRole('status').textContent).not.toContain('Li hem enviat');
  });

  test('un servidor sense l’esquema dels seguiments (NO-DISPONIBLE en llegir) es diu com sense la capacitat', async () => {
    m.estat.mockRejectedValue(errorDeSeguiment('NO-DISPONIBLE'));
    render(ambXat());
    expect(await screen.findByText('Este poble encara no permet connectar amb ningú des de l’app: de moment, la relació és la conversa.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Connectar amb / })).toBeNull();
    expect(m.segueix).not.toHaveBeenCalled();
  });

  test('sense la capacitat de seguir no hi ha botó ni crida: la relació és la conversa', async () => {
    m.capacitats = new Set(['directori']);
    render(ambXat());
    expect(await screen.findByText('Este poble encara no permet connectar amb ningú des de l’app: de moment, la relació és la conversa.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Connectar amb / })).toBeNull();
    expect(screen.getByRole('button', { name: 'Escriu-li a Pepa Soler' })).toBeTruthy();
    expect(m.estat).not.toHaveBeenCalled();
  });

  test('una fitxa que no és del tipus demanat (una entitat per a objecte=persona) no obri cap relació', async () => {
    m.perfil.mockResolvedValue(RENTONAR);
    m.params = new URLSearchParams(`item_id=${UUID_ORG}&title=Impostora&sectionId=perfil&objecte=persona`);
    render(ambXat());
    await waitFor(() => expect(m.perfil).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(cami('Connexió directa')).toBeNull();
    expect(m.estat).not.toHaveBeenCalled();
  });

  /* Actualitzada a posta (C0200-06, auditoria Codex 261025_0200): abans tot
     destí de qui mira vetava la relació sencera, i A → B o entitat → la
     persona que l'administra no es podien fer, encara que 2610250100 els
     admet. Ara és la matriu U/A/B de public.segueix: persona → ella mateixa,
     persona → entitat que administra i entitat → ella mateixa, mai; una
     entitat → la persona que l'administra i A → B, sí. I mai cap xat amb tu
     mateixa. Els vetos de sempre es queden: sense cap altra identitat seua,
     cap relació. */
  describe('C0200-06 · la matriu U/A/B: qui pot connectar amb una identitat teua', () => {
    const UUID_A = '3c4d5e6f-7081-4923-8b4c-5d6e7f809102';
    const U = Object.freeze({ tipus: 'persona', id: UUID_PEPA, nom: 'Pepa Soler' });
    const A = Object.freeze({ tipus: 'entitat', id: UUID_A, nom: 'Forn de la Torre', rol: 'admin', kind: 'company' });
    const B = Object.freeze({ tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar', rol: 'owner', kind: 'entity' });
    const FITXA_A = Object.freeze({ tipus: 'entitat', id: UUID_A, nom: 'Forn de la Torre' });
    const PERFIL_A = `item_id=${UUID_A}&title=Impostora&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2F${UUID_A}&organitzacio=${UUID_A}`;
    const selector = () => screen.queryByRole('radiogroup', { name: 'Connectar com a' });
    /* Les píndoles del selector, exactament estes i en este ordre: [nom, triada]. */
    const opcions = (noms) => {
      const radios = within(selector()).getAllByRole('radio');
      expect(radios).toHaveLength(noms.length);
      return noms.map((nom, index) => {
        const radio = within(selector()).getByRole('radio', { name: nom });
        expect(radios[index]).toBe(radio);
        return [nom, radio.checked];
      });
    };
    const comU = (identitats, actor = U) => { m.user = { id: UUID_PEPA }; m.identitat = { actor, identitats, memberships: [] }; };
    beforeEach(() => {
      m.perfil.mockImplementation(async (id) => (id === UUID_ORG ? RENTONAR : id === UUID_PEPA ? PEPA : id === UUID_A ? FITXA_A : null));
    });

    test('U → U: sense cap entitat que administre, cap relació ni cap xat (el veto de sempre)', async () => {
      comU([U]);
      render(ambXat());
      await waitFor(() => expect(m.perfil).toHaveBeenCalled());
      await act(async () => {});
      expect(cami('Connexió directa')).toBeNull();
      expect(screen.queryByRole('button', { name: /^Escriu-li/ })).toBeNull();
      expect(m.estat).not.toHaveBeenCalled();
    });

    test('A → U i B → U: el perfil propi es connecta com a una entitat que administres, mai com a persona, i sense cap xat', async () => {
      portFidel();
      comU([U, A, B]);
      render(ambXat());
      const relacio = await screen.findByRole('group', { name: 'Connexió directa' });
      expect(within(relacio).getByRole('heading', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
      expect(opcions(['Forn de la Torre (empresa)', 'El Rentonar (entitat)'])).toEqual([['Forn de la Torre (empresa)', true], ['El Rentonar (entitat)', false]]);
      await waitFor(() => expect(m.estat).toHaveBeenLastCalledWith({ tipus: 'persona', id: UUID_PEPA, com: UUID_A }, {}));
      expect(m.estat).not.toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
      expect(within(relacio).queryByRole('button', { name: /^Escriu-li/ })).toBeNull();
      expect(relacio.textContent).not.toMatch(/conversa privada/);
      fireEvent.click(within(selector()).getByRole('radio', { name: 'El Rentonar (entitat)' }));
      const connecta = await within(relacio).findByRole('button', { name: 'Connectar amb Pepa Soler' });
      await act(async () => { fireEvent.click(connecta); });
      expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA, com: UUID_ORG }, {});
      expect(m.segueix).not.toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
      expect(m.xat.creaFil).not.toHaveBeenCalled();
      expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    });

    /* Revisió adversarial del torn 261025_0200 · Amb una identitat pròpia no
       hi ha conversa: un servidor sense els seguiments no pot dir «la relació
       és la conversa». */
    test('A → U amb un servidor sense els seguiments (NO-DISPONIBLE): un text cert, sense prometre cap conversa', async () => {
      portFidel();
      m.estat.mockRejectedValue(errorDeSeguiment('NO-DISPONIBLE'));
      comU([U, A]);
      render(ambXat());
      const relacio = await screen.findByRole('group', { name: 'Connexió directa' });
      expect(await within(relacio).findByText('Este poble encara no permet connectar les teues identitats entre elles des de l’app.')).toBeTruthy();
      expect(relacio.textContent).not.toMatch(/la relació és la conversa/);
      expect(within(relacio).queryByRole('button', { name: /^Escriu-li/ })).toBeNull();
    });

    test('A → B: una entitat que administres es connecta com a una altra que també administres; U → B i B → B, no', async () => {
      portFidel();
      comU([U, A, B]);
      m.params = new URLSearchParams(PERFIL_RENTONAR);
      render(ambXat());
      const relacio = await screen.findByRole('group', { name: 'Connexió directa' });
      expect(within(relacio).getByRole('heading', { name: 'Connectar amb El Rentonar' })).toBeTruthy();
      expect(opcions(['Forn de la Torre (empresa)'])).toEqual([['Forn de la Torre (empresa)', true]]);
      expect(within(relacio).queryByRole('button', { name: /^Escriu-li/ })).toBeNull();
      const connecta = await within(relacio).findByRole('button', { name: 'Connectar amb El Rentonar' });
      await act(async () => { fireEvent.click(connecta); });
      expect(m.segueix).toHaveBeenCalledTimes(1);
      expect(m.segueix).toHaveBeenCalledWith({ tipus: 'entitat', id: UUID_ORG, com: UUID_A }, {});
      expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
      /* «Formar part» d'una entitat que administres: cap sol·licitud. */
      expect(screen.queryByRole('button', { name: /Demanar formar part/ })).toBeNull();
    });

    test('B → A: actuant com a B a la sessió, el perfil de B ofereix A; el d’A, B', async () => {
      comU([U, A, B], B);
      m.params = new URLSearchParams(PERFIL_RENTONAR);
      const vista = render(ambXat());
      await screen.findByRole('group', { name: 'Connexió directa' });
      expect(opcions(['Forn de la Torre (empresa)'])).toEqual([['Forn de la Torre (empresa)', true]]);
      vista.unmount();
      m.params = new URLSearchParams(PERFIL_A);
      render(ambXat());
      await screen.findByRole('group', { name: 'Connexió directa' });
      expect(opcions(['El Rentonar (entitat)'])).toEqual([['El Rentonar (entitat)', true]]);
      await waitFor(() => expect(m.estat).toHaveBeenLastCalledWith({ tipus: 'entitat', id: UUID_A, com: UUID_ORG }, {}));
    });

    test('sense la capacitat de connectar, un destí teu no té relació: no hi ha cap xat amb tu mateixa per a oferir', async () => {
      m.capacitats = new Set(['directori']);
      comU([U, A, B]);
      render(ambXat());
      await waitFor(() => expect(m.perfil).toHaveBeenCalled());
      await act(async () => {});
      expect(cami('Connexió directa')).toBeNull();
      expect(screen.queryByRole('button', { name: /^Escriu-li/ })).toBeNull();
    });

    test('U → B i B → B, i res més: qui només administra B no té cap relació amb B (el veto de sempre)', async () => {
      comU([U, B]);
      m.params = new URLSearchParams(PERFIL_RENTONAR);
      render(ambXat());
      expect(await screen.findByRole('heading', { name: 'Formar part de l’entitat' })).toBeTruthy();
      await act(async () => {});
      expect(cami('Connexió directa')).toBeNull();
      expect(screen.queryByRole('button', { name: /Demanar formar part/ })).toBeNull();
      expect(m.estat).not.toHaveBeenCalled();
    });

    test('peces pures · identitatPropiaDe i actorsPerAlDesti, amb les mateixes regles', () => {
      const opcionsU = { currentUser: { id: UUID_PEPA }, actor: U, identitats: [U, A, B], dataMode: 'remote' };
      expect(identitatPropiaDe(UUID_PEPA, opcionsU)).toEqual({ tipus: 'persona' });
      expect(identitatPropiaDe(UUID_ORG, opcionsU)).toEqual({ tipus: 'entitat', id: UUID_ORG });
      expect(identitatPropiaDe('una-altra', opcionsU)).toBeNull();
      expect(identitatPropiaDe('del-xat', { ...opcionsU, xat: { esDeQuiMira: (id) => id === 'del-xat' } })).toEqual({ tipus: 'desconeguda' });
      const actors = actorsPerConnectar([U, A, B]);
      expect(actorsPerAlDesti(actors, null)).toBe(actors);
      expect(actorsPerAlDesti(actors, { tipus: 'persona' }).map((o) => o.valor)).toEqual([UUID_A, UUID_ORG]);
      expect(actorsPerAlDesti(actors, { tipus: 'entitat', id: UUID_ORG }).map((o) => o.valor)).toEqual([UUID_A]);
      expect(actorsPerAlDesti(actors, { tipus: 'desconeguda' })).toEqual([]);
      expect(actorsPerAlDesti([], { tipus: 'persona' })).toEqual([]);
      /* El contacte d'una identitat pròpia no té cap interlocutor: cap xat. */
      expect(perfilPerConnectar(PEPA, { ...opcionsU, xat: XAT_REMOT })).toMatchObject({
        propia: { tipus: 'persona' }, interlocutor: null, seguiment: { tipus: 'persona', id: UUID_PEPA }
      });
      expect(perfilPerConnectar(RENTONAR, { ...opcionsU, xat: XAT_REMOT })).toMatchObject({
        propia: { tipus: 'entitat', id: UUID_ORG }, interlocutor: null, seguiment: { tipus: 'entitat', id: UUID_ORG }
      });
      /* Un destí teu amb un tipus que no casa (l'id d'una entitat teua com a persona), res. */
      expect(perfilPerConnectar({ tipus: 'persona', id: UUID_ORG, nom: 'El Rentonar' }, { ...opcionsU, xat: XAT_REMOT })).toBeNull();
    });
  });

  test('remot sense sessió: la fitxa d’una altra persona ni es demana; el camí no té nom i porta a entrar amb esta consulta', () => {
    m.user = null;
    render(ambXat());
    expect(m.perfil).not.toHaveBeenCalled();
    const relacio = cami('Connexió directa');
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
    const seguir = await screen.findByRole('button', { name: 'Connectar amb Sóc de Poble' });
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
    expect(screen.queryByRole('button', { name: /^Connectar amb / })).toBeNull();
    expect(m.estat).not.toHaveBeenCalled();
  });

  test('un autor amb l’id del servidor se segueix pel seu id i l’avís va al seu directe', async () => {
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = MERCAT_AMB({ author_name: 'Pepa Soler', author_user_id: UUID_PEPA });
    render(ambXat(XAT_REMOT));
    const seguir = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    await act(async () => { fireEvent.click(seguir); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    expect(m.xat.creaFil).toHaveBeenCalledWith(UUID_PEPA, null);
  });

  test('un element sense autor no obri cap camí: ni capçaleres ni l’entradeta dels camins', () => {
    m.params = new URLSearchParams('item_id=sella&title=Sella&sectionId=pobles&objecte=poble&ruta=%2Fpobles%2Fsella');
    render(ambXat());
    expect(cami('Connexió directa')).toBeNull();
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
    expect(capçaleres).toEqual(['Connexió directa', 'Formar part', 'A les teues notes']);
    expect(screen.getByText('Cada camí té el seu botó: connectar amb algú o escriure-li no et fa membre de res. Si guardes l’element a les teues notes en privat, no avisa ningú; si tries persones o grups de xat, els enviarem l’enllaç.')).toBeTruthy();
    expect(screen.getByText(/^Una còpia al teu Bloc per a llegir-la després/).textContent)
      .toBe('Una còpia al teu Bloc per a llegir-la després, que no et fa membre de res. Tu tries qui ho pot vore: en privat no avisa ningú; a persones o grups de xat els enviarem l’enllaç per xat, i a tot el poble la compartiràs tu al Mur.');
    expect(m.perfil).toHaveBeenCalledTimes(1);
    const formarPart = cami('Formar part');
    expect(within(formarPart).getByRole('heading', { name: 'Formar part de l’entitat' })).toBeTruthy();
    /* Actualitzada a posta (IDEA-22, T5): el bloc d'administrar ja no es munta a /connectar (el simulacre es queda de guarda). */
    expect(formarPart.querySelector('[data-bloc-administrar]')).toBeNull();
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

  /* IDEA-22 (T5) · qui l'administra no l'administra ací: el botó la porta al seu Perfil («Membres i connexions»). */
  test('qui l’administra va al Perfil per a gestionar-la, i no hi ha cap bloc d’administrar a /connectar', async () => {
    m.identitat.memberships = [{ id: UUID_ORG, slug: 'el-rentonar', name: 'El Rentonar', role: 'admin' }];
    render(ambXat());
    const formarPart = cami('Formar part');
    expect(await within(formarPart).findByText('Els membres i els rols es gestionen al teu Perfil, a «Membres i connexions».')).toBeTruthy();
    expect(document.querySelector('[data-bloc-administrar]')).toBeNull();
    fireEvent.click(within(formarPart).getByRole('button', { name: 'Gestionar El Rentonar' }));
    expect(m.navigate).toHaveBeenLastCalledWith(`/el-meu-perfil?organitzacio=${UUID_ORG}`);
  });

  test('sense sessió: «Entra per a demanar-ho» porta a entrar i torna a esta consulta', async () => {
    m.user = null;
    render(ambXat());
    const formarPart = cami('Formar part');
    fireEvent.click(within(formarPart).getByRole('button', { name: 'Entra per a demanar-ho' }));
    expect(anadaAEntrar(m.navigate.mock.calls.at(-1)[0])).toEqual({ ruta: '/registre', mode: 'entrar', tornar: `/connectar?${m.params}` });
  });

  /* Actualitzada a posta (IDEA-22, T5): abans «ho diu, sense botó». */
  test('sense el directori no hi ha xat privat: el botó obri el xat de la pàgina de l’entitat, sense sol·licitud; mentre la fitxa carrega, busca', async () => {
    m.capacitats = new Set(['seguiments']);
    const vista = render(ambXat());
    const formarPart = cami('Formar part');
    /* Sense directori no hi ha fitxa de confiança: cap nom (ni el de l'URL), i els textos ho diuen sense forat. */
    expect(within(formarPart).getByText('Demana-ho al xat de la pàgina de l’entitat: és el seu canal per a preguntar i parlar amb qui l’administra.')).toBeTruthy();
    expect(formarPart.textContent).not.toContain('Impostora');
    expect(screen.queryByRole('button', { name: /Demanar formar part/ })).toBeNull();
    fireEvent.click(within(formarPart).getByRole('button', { name: 'Obrir el xat de l’entitat' }));
    expect(m.navigate.mock.calls.at(-1)[0]).toMatch(new RegExp(`^/xat\\?sobre=[a-z]+:${UUID_ORG}(?:&|$)`));
    expect(m.crea).not.toHaveBeenCalled();
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
   entitat veu el nom del veïnat connectat («Veïnat connectat amb {nom}» a
   GestioMembres): abans del clic, el camí ho diu. D'una persona, no (ella veu
   «Veïnat connectat amb tu», i això ja ho diu l'avís del xat). Actualitzada a
   posta (P1-11, pla 261024_2230; G1945-04 de Gemini, ordre del Mestre). */
describe('Entre persones · seguir una entitat diu qui veurà el teu nom', () => {
  const AVIS_ENTITAT = 'Les persones que administren El Rentonar voran el teu nom a la llista del veïnat connectat amb l’entitat.';

  test('abans del clic, al costat de l’avís del xat; després de seguir, ja no cal', async () => {
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    render(ambXat());
    const avis = await screen.findByText(AVIS_ENTITAT);
    const relacio = cami('Connexió directa');
    expect(relacio.contains(avis)).toBe(true);
    /* Actualitzada a posta (261024 correccions): R3-13, «per a dir-li que t’hi has connectat». */
    expect(within(relacio).getByText(AVIS_REMOT('El Rentonar'))).toBeTruthy();
    expect(m.segueix).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(within(relacio).getByRole('button', { name: 'Connectar amb El Rentonar' })); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'entitat', id: UUID_ORG }, {});
    expect(screen.queryByText(AVIS_ENTITAT)).toBeNull();
  });

  test('seguir una persona no ho diu', async () => {
    render(ambXat());
    expect(await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    expect(screen.queryByText(/voran el teu nom/)).toBeNull();
  });

  test('en castellà, amb el nom de la fitxa', async () => {
    m.t = createTranslator('es');
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    render(ambXat());
    expect(await screen.findByText('Las personas que administran El Rentonar verán tu nombre en la lista del vecindario conectado con la entidad.')).toBeTruthy();
  });
});

/* IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · Qui administra
   una entitat tria amb quin barret connecta: la persona o l'entitat (B2B,
   empresa↔empresa). El seguiment ix de l'actor triat (`com` al port), sense
   canviar la sessió global; un membre que no l'administra no parla en nom de
   ningú, i sense cap entitat que administre no hi ha res a triar. Com a
   entitat no ix cap missatge al xat (revisió adversarial 261025: el xat
   personal diria quina persona l'administra), i es diu abans i després. */
describe('IDEA-22 · connectar com a persona o com a entitat', () => {
  const TONI = Object.freeze({ tipus: 'persona', id: 'U', nom: 'Toni Ferrer' });
  const FORN = Object.freeze({ tipus: 'entitat', id: 'org-forn', nom: 'Forn de la Torre', rol: 'admin', kind: 'company' });
  const selector = () => screen.queryByRole('radiogroup', { name: 'Connectar com a' });

  test('sense cap entitat que administre no hi ha selector, i el port no rep cap com', async () => {
    portFidel();
    render(ambXat());
    const boto = await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' });
    expect(selector()).toBeNull();
    await act(async () => { fireEvent.click(boto); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
  });

  test('un membre que no l’administra no la pot triar', async () => {
    m.identitat = { actor: TONI, identitats: [TONI, { ...FORN, rol: 'member' }], memberships: [] };
    render(ambXat());
    expect(await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    expect(selector()).toBeNull();
  });

  test('per defecte la persona; triant l’entitat, el port rep com, cap missatge al xat i els textos parlen de l’entitat', async () => {
    portFidel();
    m.identitat = { actor: TONI, identitats: [TONI, FORN], memberships: [] };
    render(ambXat());
    const grup = await screen.findByRole('radiogroup', { name: 'Connectar com a' });
    expect(cami('Connexió directa').contains(grup)).toBe(true);
    expect(within(grup).getByRole('radio', { name: 'Toni Ferrer (persona)' }).checked).toBe(true);
    expect(await screen.findByText(AVIS_REMOT('Pepa Soler'))).toBeTruthy();
    fireEvent.click(within(grup).getByRole('radio', { name: 'Forn de la Torre (empresa)' }));
    await waitFor(() => expect(m.estat).toHaveBeenLastCalledWith({ tipus: 'persona', id: UUID_PEPA, com: 'org-forn' }, {}));
    expect(screen.getByText('Una relació directa entre Forn de la Torre i Pepa Soler, sense algoritmes ni intermediaris. No fa ningú membre de res.')).toBeTruthy();
    expect(await screen.findByText('Com a Forn de la Torre, no li enviarem cap missatge al xat: Pepa Soler ho veurà a la llista del veïnat connectat.')).toBeTruthy();
    expect(screen.queryByText(AVIS_REMOT('Pepa Soler'))).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Pepa Soler' })); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA, com: 'org-forn' }, {});
    expect(m.xat.creaFil).not.toHaveBeenCalled();
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    expect(screen.getByText('Has connectat Forn de la Torre amb Pepa Soler. No li hem enviat cap missatge al xat: ho veurà a la llista del veïnat connectat.')).toBeTruthy();
    /* La sessió global no canvia: ningú no ha tocat l'actor. */
    expect(m.identitat.actor).toBe(TONI);
  });

  test('canviar de barret a mitja connexió: el que torna tard no s’escriu en el nou, i el missatge és el del clic', async () => {
    m.identitat = { actor: TONI, identitats: [TONI, FORN], memberships: [] };
    let acaba;
    m.segueix.mockImplementation(() => new Promise((resol) => { acaba = resol; }));
    render(ambXat());
    const grup = await screen.findByRole('radiogroup', { name: 'Connectar com a' });
    fireEvent.click(await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' }));
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    fireEvent.click(within(grup).getByRole('radio', { name: 'Forn de la Torre (empresa)' }));
    await waitFor(() => expect(m.estat).toHaveBeenLastCalledWith({ tipus: 'persona', id: UUID_PEPA, com: 'org-forn' }, {}));
    expect(await screen.findByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    await act(async () => { acaba({ seguint: true, creatAl: '2026-10-25T00:00:00Z', nou: true, primer: true }); });
    /* La connexió del clic era personal: el seu missatge, el personal. */
    expect(m.xat.sendChatMessage.mock.calls.at(-1)[1]).toBe('Connexió nova: m’he connectat amb tu a Sóc de Poble.');
    /* El barret nou no s'ha quedat en «Comprovant…» ni diu cap resultat del vell. */
    expect(screen.getByRole('button', { name: 'Connectar amb Pepa Soler' })).toBeTruthy();
    expect(screen.queryByText(/Li hem enviat un missatge al xat/)).toBeNull();
    expect(screen.queryByText(/^Comprovant la connexió/)).toBeNull();
  });

  test('actuant com a l’entitat, ja ve triada; amb una altra entitat, l’avís diu que la llista mostrarà l’entitat', async () => {
    portFidel();
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    m.identitat = { actor: FORN, identitats: [TONI, FORN], memberships: [] };
    render(ambXat());
    const grup = await screen.findByRole('radiogroup', { name: 'Connectar com a' });
    expect(within(grup).getByRole('radio', { name: 'Forn de la Torre (empresa)' }).checked).toBe(true);
    expect(await screen.findByText('Les persones que administren El Rentonar voran Forn de la Torre a la llista del veïnat connectat amb l’entitat, sense cap missatge al xat.')).toBeTruthy();
    expect(screen.queryByText(AVIS_REMOT('El Rentonar'))).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar amb El Rentonar' })); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'entitat', id: UUID_ORG, com: 'org-forn' }, {});
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
  });

  /* C0200-02 (auditoria Codex 261025_0200) · El barret d'entitat no val per
     al xat: «Escriu-li» obri el directe personal de qui mira, i ho diu ABANS
     del clic (el botó i una línia), sense cap missatgeria d'entitat. */
  test('C0200-02 · com a entitat, «Escriu-li» diu que el xat és personal i amb quin nom, i obri el directe de la persona', async () => {
    m.identitat = { actor: TONI, identitats: [TONI, FORN], memberships: [] };
    render(ambXat());
    const grup = await screen.findByRole('radiogroup', { name: 'Connectar com a' });
    const relacio = cami('Connexió directa');
    /* Com a persona, el de sempre. */
    expect(within(relacio).getByRole('button', { name: 'Escriu-li a Pepa Soler' })).toBeTruthy();
    expect(within(relacio).queryByText(/^El xat és personal/)).toBeNull();
    fireEvent.click(within(grup).getByRole('radio', { name: 'Forn de la Torre (empresa)' }));
    const boto = await within(relacio).findByRole('button', { name: 'Escriu-li a Pepa Soler com a Toni Ferrer' });
    const nota = within(relacio).getByText('El xat és personal: Pepa Soler veurà que li escriu Toni Ferrer, no Forn de la Torre, que ací no té xat propi.');
    /* La nota és de cos (cap ajuda menuda) i va abans del botó. */
    expect(nota.tagName).toBe('P');
    expect(nota.className).toBe('');
    expect(nota.compareDocumentPosition(boto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(relacio).queryByRole('button', { name: 'Escriu-li a Pepa Soler' })).toBeNull();
    fireEvent.click(boto);
    expect(m.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID_PEPA}`);
    expect(m.xat.sendChatMessage).not.toHaveBeenCalled();
    expect(m.segueix).not.toHaveBeenCalled();
    /* Tornar a la persona torna el botó de sempre. */
    fireEvent.click(within(grup).getByRole('radio', { name: 'Toni Ferrer (persona)' }));
    expect(await within(relacio).findByRole('button', { name: 'Escriu-li a Pepa Soler' })).toBeTruthy();
    expect(within(relacio).queryByText(/^El xat és personal/)).toBeNull();
  });

  /* Revisió adversarial del torn 261025_0200 · En llavor el xat és d'este
     dispositiu: ningú «veurà» res. El botó diu igualment amb quin nom s'obri. */
  test('C0200-02 · en llavor, el botó diu el nom de la persona i no hi ha cap nota que prometa que l’altra banda ho veu', async () => {
    const contacte = { nom: 'Pepa Soler', tipus: 'persona', id: UUID_PEPA, interlocutor: { id: UUID_PEPA, nom: 'Pepa Soler', tipus: 'persona' } };
    const bloc = (dataMode) => (
      <XatSocDePobleContext.Provider value={XAT_DE_LLAVOR}>
        <BlocRelacio contacte={contacte} deFitxa dataMode={dataMode} com="org-forn" nomCom="Forn de la Torre" nomPersona="Toni Ferrer" />
      </XatSocDePobleContext.Provider>
    );
    const { rerender } = render(bloc('seed'));
    expect(await screen.findByRole('button', { name: 'Escriu-li a Pepa Soler com a Toni Ferrer' })).toBeTruthy();
    expect(screen.queryByText(/^El xat és personal/)).toBeNull();
    /* La mateixa peça en remot sí que ho diu: la diferència és només el mode. */
    rerender(bloc('remote'));
    expect(await screen.findByText(/^El xat és personal: Pepa Soler veurà que li escriu Toni Ferrer/)).toBeTruthy();
  });

  test('C0200-02 · en castellà, el botó i la nota també diuen el nom de la persona', async () => {
    m.t = createTranslator('es');
    m.identitat = { actor: FORN, identitats: [TONI, FORN], memberships: [] };
    render(ambXat());
    expect(await screen.findByRole('button', { name: 'Escríbele a Pepa Soler como Toni Ferrer' })).toBeTruthy();
    expect(screen.getByText('El chat es personal: Pepa Soler verá que le escribe Toni Ferrer, no Forn de la Torre, que aquí no tiene chat propio.')).toBeTruthy();
  });

  test('actorsPerConnectar · la persona i les entitats que administra, amb l’etiqueta del seu tipus; sense cap, res', () => {
    const GRUP = { tipus: 'entitat', id: 'g1', nom: 'Colla', rol: 'owner', kind: 'group' };
    const ASSOCIACIO = { tipus: 'entitat', id: 'e1', nom: 'Rentonar', rol: 'admin', kind: 'entity' };
    expect(actorsPerConnectar([TONI, FORN, GRUP, ASSOCIACIO, { ...FORN, id: 'm1', rol: 'member' }])).toEqual([
      { valor: COM_PERSONA, etiqueta: 'Toni Ferrer (persona)', nom: 'Toni Ferrer' },
      { valor: 'org-forn', etiqueta: 'Forn de la Torre (empresa)', nom: 'Forn de la Torre' },
      { valor: 'g1', etiqueta: 'Colla (grup)', nom: 'Colla' },
      { valor: 'e1', etiqueta: 'Rentonar (entitat)', nom: 'Rentonar' }
    ]);
    expect(actorsPerConnectar([TONI])).toEqual([]);
    expect(actorsPerConnectar([FORN])).toEqual([]);
    expect(actorsPerConnectar(null)).toEqual([]);
  });
});

/* IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla 261025_0200)
   · Amb una entitat, la seua persona titular al mateix grup «Connexió
   directa», NOMÉS si el servidor la torna (ella ho ha triat i té el perfil
   públic: loadTitularPublic, capacitat 'titularPublic'). Mai qui ha publicat
   l'element (owner_user_id). Cap capçalera de camí ni cap primari nous; sense
   la capacitat, sense sessió o amagada, ni rastre. */
describe('IDEA-22 · la titular d’una entitat, si ella ho ha triat', () => {
  const INTRO = 'Pepa Soler és titular de El Rentonar i ha triat que es veja ací.';
  const TITULAR = Object.freeze({ tipus: 'persona', id: UUID_PEPA, nom: 'Pepa Soler', avatar: '' });
  beforeEach(() => {
    m.params = new URLSearchParams(PERFIL_RENTONAR);
    m.capacitats = new Set(['directori', 'seguiments', 'titularPublic']);
    m.titular.mockResolvedValue(TITULAR);
  });

  test('la titular, al mateix grup i després de l’entitat, amb la seua línia; es connecta com a persona i cap camí ni primari nou', async () => {
    portFidel();
    const { container } = render(ambXat());
    const relacio = await screen.findByRole('group', { name: 'Connexió directa' });
    const intro = await within(relacio).findByText(INTRO);
    expect(intro.tagName).toBe('P');
    expect(intro.className).toBe('');
    expect(m.titular).toHaveBeenCalledWith(UUID_ORG, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    const titols = within(relacio).getAllByRole('heading').map((h) => h.textContent);
    expect(titols).toEqual(['Connectar amb El Rentonar', 'Connectar amb Pepa Soler']);
    expect(within(relacio).getByRole('heading', { name: 'Connectar amb El Rentonar' })
      .compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const capçaleres = [...container.querySelectorAll('.sdp-connectar__cami-cap .sdp-connectar__tipus')].map((p) => p.textContent);
    expect(capçaleres).toEqual(['Connexió directa', 'Formar part', 'A les teues notes']);
    const primaris = [...container.querySelectorAll('.sdp-boto--primari')].filter((boto) => !boto.closest('dialog'));
    expect(primaris.map((boto) => boto.textContent)).toEqual([CONNECTA]);
    /* Una sola fitxa de perfil: la titular arriba de la seua lectura, no d'un altre loadPerfilPublic. */
    expect(m.perfil).toHaveBeenCalledTimes(1);
    const connecta = await within(relacio).findByRole('button', { name: 'Connectar amb Pepa Soler' });
    await act(async () => { fireEvent.click(connecta); });
    expect(m.segueix).toHaveBeenCalledWith({ tipus: 'persona', id: UUID_PEPA }, {});
    expect(m.segueix).not.toHaveBeenCalledWith({ tipus: 'entitat', id: UUID_ORG }, {});
  });

  test('sense la tria (el servidor no la torna), sense la capacitat o sense sessió: ni rastre de cap titular', async () => {
    m.titular.mockResolvedValue(null);
    const vista = render(ambXat());
    await screen.findByRole('heading', { name: 'Connectar amb El Rentonar' });
    await waitFor(() => expect(m.titular).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(screen.queryByText(/és titular de/)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Connectar amb Pepa Soler' })).toBeNull();
    vista.unmount();
    m.titular.mockClear();
    m.titular.mockResolvedValue(TITULAR);
    m.capacitats = new Set(['directori', 'seguiments']);
    const sense = render(ambXat());
    await screen.findByRole('heading', { name: 'Connectar amb El Rentonar' });
    await act(async () => {});
    expect(m.titular).not.toHaveBeenCalled();
    expect(screen.queryByText(/és titular de/)).toBeNull();
    sense.unmount();
    m.capacitats = new Set(['directori', 'seguiments', 'titularPublic']);
    m.user = null;
    render(ambXat());
    await act(async () => {});
    expect(m.titular).not.toHaveBeenCalled();
    expect(screen.queryByText(/titular/)).toBeNull();
  });

  test('si qui mira n’és la titular, res; una persona no té titular', async () => {
    m.user = { id: UUID_PEPA };
    const vista = render(ambXat());
    await screen.findByRole('heading', { name: 'Connectar amb El Rentonar' });
    await waitFor(() => expect(m.titular).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByText(INTRO)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Connectar amb Pepa Soler' })).toBeNull();
    vista.unmount();
    m.titular.mockClear();
    m.user = { id: 'U' };
    m.params = new URLSearchParams(PERFIL_PEPA);
    render(ambXat());
    await screen.findByRole('heading', { name: 'Connectar amb Pepa Soler' });
    await act(async () => {});
    expect(m.titular).not.toHaveBeenCalled();
  });

  test('una entitat que administres no en demana cap: ja coneixes el seu equip', async () => {
    const A = { tipus: 'entitat', id: 'org-forn', nom: 'Forn de la Torre', rol: 'admin', kind: 'company' };
    m.identitat = {
      actor: { tipus: 'persona', id: 'U', nom: 'Toni Ferrer' },
      identitats: [{ tipus: 'persona', id: 'U', nom: 'Toni Ferrer' }, A, { tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar', rol: 'admin', kind: 'entity' }],
      memberships: []
    };
    render(ambXat());
    await screen.findByRole('group', { name: 'Connexió directa' });
    await act(async () => {});
    expect(m.titular).not.toHaveBeenCalled();
    expect(screen.queryByText(/és titular de/)).toBeNull();
  });

  test('d’un element signat per l’entitat: la titular de l’entitat, mai qui l’ha publicat (owner_user_id)', async () => {
    m.params = new URLSearchParams(SAMARRETA);
    m.mur = MERCAT_AMB({ author_name: 'El Rentonar', seller: 'El Rentonar', author_org_id: UUID_ORG, owner_user_id: UUID_PEPA });
    m.titular.mockResolvedValue(null);
    render(ambXat());
    await screen.findByRole('heading', { name: 'Connectar amb l’autor' });
    await waitFor(() => expect(m.titular).toHaveBeenCalledWith(UUID_ORG, expect.any(Object)));
    await act(async () => {});
    /* Qui l'ha publicat no és cap titular: sense la tria, ningú. */
    expect(screen.queryByRole('heading', { name: 'Connectar amb Pepa Soler' })).toBeNull();
    expect(screen.queryByText(/és titular de/)).toBeNull();
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
  'section.connectar.formarPart.obriXat', 'section.connectar.formarPart.senseXat', 'section.connectar.formarPart.gestiona',
  /* IDEA-22 (T5) · el selector «Connectar com a» i la relació d'una entitat ({entitat} a banda del {nom}). */
  'section.connectar.com.persona', 'section.connectar.com.empresa', 'section.connectar.com.entitat', 'section.connectar.com.grup',
  'section.connectar.relacio.ajudaEntitat', 'section.connectar.seguir.avisEntitatCom', 'section.connectar.seguir.avisCom',
  'section.connectar.seguir.avisatCom',
  /* C0200-02 · «Escriu-li a {nom} com a {persona}» i la nota del xat personal ({persona} i {entitat} a banda). */
  'section.connectar.autor.botoCom', 'section.connectar.autor.textCom',
  /* IDEA-22, punt 2 · la titular que ha triat mostrar-se ({entitat} a banda). */
  'section.connectar.titular.intro'
];
const CLAUS_SENSE_NOM = [
  'section.connectar.lead', 'section.connectar.leadCamins', 'section.connectar.camins.relacio',
  'section.connectar.camins.formarPart', 'section.connectar.camins.mas', 'section.connectar.mas.ajuda',
  'section.connectar.persona.titolSenseNom', 'section.connectar.persona.ajudaSenseNom', 'section.connectar.persona.entraSenseNom',
  'section.connectar.seguir.missatge', 'section.connectar.seguir.noDisponible', 'section.connectar.seguir.noDisponiblePropia', 'section.connectar.formarPart.titol',
  'section.connectar.formarPart.que', 'section.connectar.formarPart.afegit', 'section.connectar.formarPart.envia',
  'section.connectar.formarPart.cancela', 'section.connectar.formarPart.entra', 'section.connectar.formarPart.senseSessio',
  'section.connectar.formarPart.jaEnFormesText', 'section.connectar.formarPart.comprovant',
  'section.connectar.connectada', 'section.connectar.com.llegenda', 'section.connectar.formarPart.onSAdministra',
  'section.connectar.formarPart.senseXatSenseNom', 'section.connectar.formarPart.obriXatSenseNom'
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
    expect(screen.getByRole('group', { name: 'Conexión directa' })).toBeTruthy();
    /* Actualitzada a posta (261024 correccions): «En tus notas», sense «MAS» (Gemini G2-02). */
    expect(screen.getByText('En tus notas')).toBeTruthy();
    expect(await screen.findByText('Pepa Soler recibirá un mensaje en el chat diciendo que has conectado.')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Conectar con Pepa Soler' })); });
    expect(m.xat.sendChatMessage.mock.calls[0][1]).toBe('Conexión nueva: he conectado contigo en Sóc de Poble.');
    expect(screen.getByRole('group', { name: 'Conexión directa' }).textContent).not.toContain('Impostora');
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
