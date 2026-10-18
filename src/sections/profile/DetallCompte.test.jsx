import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  navigate: vi.fn(), logout: vi.fn(), estatBaixa: vi.fn(), estatConsentiment: vi.fn(), exporta: vi.fn(), pagina: null,
  /* Grup C (261008) · els pobles del contingut core i el context del Perfil (null: sense proveïdor). */
  towns: [], perfil: null,
  /* Correcció 261008 · l'avís efímer de l'App (la confirmació d'«Eixir»). */
  toast: vi.fn(),
  /* Onada 11 (261010) · la sessió opcional (null: sense proveïdor, ningú és superadmin). */
  sessio: null,
  /* Gauntlet 261016 (encàrrec D) · el port de la cua d'autodesament (la persona
     de la sessió i els dos PATCH), només per a les proves del 403, al final. */
  usuari: null, updateProfile: null, updateOrganization: null,
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ status: 'ready', towns: m.towns }) }));
vi.mock('./PerfilContext.jsx', async (importOriginal) => ({ ...(await importOriginal()), usePerfilOpcional: () => m.perfil }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ logout: m.logout }), useSessioOpcional: () => m.sessio }));
/* Onada 11 (261010) · El segon factor té proves pròpies (admin/SegonFactor.test.jsx). */
vi.mock('../admin/SegonFactor.jsx', () => ({ SegonFactor: () => <p>el segon factor, en línia</p> }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.pagina = props;
    const { title, lead, topBarData, children } = props;
    return (
      <main>
        <header className="page-title"><h1>{title}</h1></header>
        <p>{lead}</p><p>{topBarData?.authorName}</p>{children}
      </main>
    );
  },
}));
/* El compte ja no crida cap dret: si algú els tornara a posar ací, estes
   funcions ho delatarien. */
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => true,
  exportaLesMeuesDades: m.exporta, estatBaixa: m.estatBaixa, estatConsentiment: m.estatConsentiment,
  getCurrentUser: () => m.usuari,
  updateProfile: (...args) => m.updateProfile(...args),
  updateOrganization: (...args) => m.updateOrganization(...args),
}));
import { DetallCompte } from './DetallCompte.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { full_name: 'Pep', email: 'pep@poble.test', is_public: false, town_name: 'La Torre' } };
/* Pla 261016 (Bloc 3.1; ordre del Mestre) · El bloc nou de la persona. */
const DRETS_NOTES = 'Drets de sèrie de les meues notes';
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { name: 'Forn', slug: 'forn', kind: 'company', role: 'owner' } };

let props;
function pinta(identitat = jo, extra = {}) {
  props = { identitat, guardarAjust: vi.fn(async () => undefined), pujaMitja: vi.fn(), ...extra };
  return render(<DetallCompte {...props} />);
}
const seccio = (titol) => screen.getByRole('heading', { level: 2, name: titol }).closest('section');

beforeEach(() => {
  for (const f of [m.navigate, m.logout, m.estatBaixa, m.estatConsentiment, m.exporta, m.toast]) f.mockReset();
  m.towns = [];
  m.perfil = null;
  m.sessio = null;
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/* ── Onada 11 (261010; prompt 261010_1730, tasca 2) · el superadmin dins d'«El compte» ── */

test('Onada 11 · el superadmin veu «Segon factor» (en línia) i «Panell de superadministració» abans de «Tancar sessió»; el botó porta a /admin', () => {
  m.sessio = { esSuperadmin: true, nivell: 'aal1', calSegonFactor: true };
  pinta();
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  // Pla 261016 (Bloc 3.1) · Canvi deliberat: els drets de sèrie de les notes, després de l'estat.
  expect(titols).toEqual(['Correu electrònic', 'Estat del perfil', DRETS_NOTES, 'Contrasenya', 'Segon factor', 'Panell de superadministració', 'Tancar sessió']);
  expect(within(seccio('Segon factor')).getByText('el segon factor, en línia')).toBeTruthy();
  const boto = within(seccio('Panell de superadministració')).getByRole('button', { name: 'Panell de superadministració' });
  expect(boto.disabled).toBe(false);
  fireEvent.click(boto);
  expect(m.navigate).toHaveBeenCalledWith('/admin');
  // Cap element nou al menú del Perfil: tot va dins d'esta pàgina.
  expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['El compte']);
});

test('Onada 11 · sense ser superadmin, o sense sessió, el compte és el d’abans; i una organització no porta els dos ajustos ni amb superadmin', () => {
  m.sessio = { esSuperadmin: false, nivell: 'aal1', calSegonFactor: false };
  pinta();
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Correu electrònic', 'Estat del perfil', DRETS_NOTES, 'Contrasenya', 'Tancar sessió']);
  expect(screen.queryByText('el segon factor, en línia')).toBeNull();
  cleanup();
  m.sessio = { esSuperadmin: true, nivell: 'aal2', calSegonFactor: false };
  pinta(forn);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Poble', 'Correu de l’organització', 'Correu a la fitxa pública', 'Membres', 'Identificador', 'Fitxa pública', 'Eixir de l’organització']);
  expect(screen.queryByText('el segon factor, en línia')).toBeNull();
});

test('la persona veu els ajustos del compte i no els de la fitxa', () => {
  pinta();
  expect(screen.getByRole('heading', { level: 1, name: 'El compte' })).toBeTruthy();
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  // Pla 261016 (Bloc 3.1) · Canvi deliberat: el bloc nou dels drets de sèrie de les notes.
  expect(titols).toEqual(['Correu electrònic', 'Estat del perfil', DRETS_NOTES, 'Contrasenya', 'Tancar sessió']);
  expect(within(seccio('Correu electrònic')).getByText('pep@poble.test')).toBeTruthy();
});

/* ── Pla 261016 (Bloc 3.1; ordre del Mestre) · els drets de sèrie de les notes ── */

test('261016 · la persona tria a «El compte» els drets de sèrie de les seues notes: la píndola obri la vista dins del bloc i desa per guardarAjust', async () => {
  pinta({ ...jo, dades: { ...jo.dades, copyright: 'CC BY 4.0' } });
  expect(screen.getByText('Les dades d’accés (correu, contrasenya, sessió i estat del perfil) i els drets de sèrie de les teues notes.')).toBeTruthy();
  const bloc = seccio(DRETS_NOTES);
  fireEvent.click(within(bloc).getByRole('button', { name: "Drets d'autor: CC BY 4.0" }));
  const vista = within(bloc).getByRole('region', { name: 'Drets d’autor' });
  expect(within(vista).getByRole('status').textContent).toContain('Estos són els drets amb què naixen les teues notes noves.');
  fireEvent.click(within(vista).getByRole('radio', { name: /CC BY-SA 4\.0/ }));
  await act(async () => { fireEvent.click(within(vista).getByRole('button', { name: 'Desar autoria' })); });
  expect(props.guardarAjust).toHaveBeenCalledWith('jo', 'drets-notes', 'CC BY-SA 4.0');
  expect(within(bloc).getByRole('status').textContent).toBe('Desat correctament.');
  // La resta de blocs no canvien: un sol h1 i cap formulari nou fora del bloc.
  expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['El compte']);
});

test('261016 · amb una baixa en curs, els drets de sèrie es veuen però no es poden canviar; una organització no porta el bloc', () => {
  pinta({ ...jo, dades: { ...jo.dades, copyright: 'CC0 1.0', baixa_demanada_at: '2026-09-26T10:00:00Z' } });
  const bloc = seccio(DRETS_NOTES);
  expect(within(bloc).queryByRole('button')).toBeNull();
  expect(within(bloc).getByText('CC0 1.0')).toBeTruthy();
  expect(within(bloc).getByText(/baixa en curs/)).toBeTruthy();
  cleanup();
  pinta(forn);
  expect(screen.queryByRole('heading', { level: 2, name: DRETS_NOTES })).toBeNull();
});

test('una contrasenya de menys de 10 caràcters no s’envia', async () => {
  pinta();
  const camp = within(seccio('Contrasenya')).getByLabelText(/contrasenya/i);
  expect(camp.getAttribute('autocomplete')).toBe('new-password');
  fireEvent.change(camp, { target: { value: 'curta' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).not.toHaveBeenCalled();
  expect(screen.getByText('La contrasenya ha de tindre almenys 10 caràcters.')).toBeTruthy();
  fireEvent.change(camp, { target: { value: 'una-bona-contrasenya' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('jo', 'contrasenya', 'una-bona-contrasenya');
});

test('els drets tenen pàgina pròpia: ni amb les capacitats hi ha cap bloc de drets ni cap crida', () => {
  pinta();
  expect(screen.queryByRole('heading', { name: 'Les meues dades' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Donar-se de baixa' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Consentiment' })).toBeNull();
  expect(m.estatBaixa).not.toHaveBeenCalled();
  expect(m.estatConsentiment).not.toHaveBeenCalled();
  expect(m.exporta).not.toHaveBeenCalled();
});

/* Encàrrec d'harmonització (261018, ordre del Mestre) · Ja no és una casella
   «Privat»: dues targetes (GrupOpcions) amb el perfil públic primer, el poble
   a l'explicació, l'estat d'ara marcat, i Guardar centrat que confirma. */
test('«Estat del perfil»: dues eixides explicades, la pública primer, i el desat s’anuncia', async () => {
  pinta();
  const bloc = seccio('Estat del perfil');
  expect(within(bloc).queryByRole('checkbox')).toBeNull();
  const grup = within(bloc).getByRole('group', { name: 'Qui pot vore el teu perfil?' });
  const opcions = within(grup).getAllByRole('radio');
  expect(opcions.map((o) => o.value)).toEqual(['public', 'privat']);
  const [publica, privada] = opcions;
  expect(privada.checked).toBe(true);
  expect(publica.checked).toBe(false);
  expect(grup.textContent).toContain('Com està ara');
  expect(grup.textContent).toContain('trobar-te des de La Torre');
  expect(grup.textContent).toContain('només per a la gent de La Torre');
  const guardar = within(bloc).getByRole('button', { name: 'Guardar' });
  expect(guardar.parentElement.classList.contains('perfil-compte__accions')).toBe(true);
  fireEvent.click(publica);
  expect(publica.checked).toBe(true);
  await act(async () => { fireEvent.submit(publica.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('jo', 'privacitat', true);
  expect(within(bloc).getByRole('status').textContent).toBe('Desat correctament.');
  props.guardarAjust.mockRejectedValueOnce(new Error('Sense xarxa'));
  await act(async () => { fireEvent.submit(publica.closest('form')); });
  expect(within(bloc).getByRole('alert').textContent).toBe('Sense xarxa');
});

test('amb una baixa en curs, «Estat del perfil» no es pot desar i diu per què', () => {
  pinta({ ...jo, dades: { ...jo.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } });
  const bloc = seccio('Estat del perfil');
  expect(within(bloc).queryByRole('checkbox')).toBeNull();
  expect(within(bloc).queryByRole('radio')).toBeNull();
  expect(within(bloc).queryByRole('button', { name: 'Guardar' })).toBeNull();
  expect(within(bloc).getByText(/baixa en curs/)).toBeTruthy();
  expect(within(bloc).getByText(/Privacitat i dades/)).toBeTruthy();
});

test('una organització mostra el poble, el correu, l’identificador i les accions pendents', () => {
  pinta(forn);
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  /* T43 (ordre del Mestre, 260928) · el correu opcional de l'organització;
     grup C (ordre del Mestre, 261008) · el poble, abans. */
  expect(titols).toEqual(['Poble', 'Correu de l’organització', 'Correu a la fitxa pública', 'Membres', 'Identificador', 'Fitxa pública', 'Eixir de l’organització']);
  expect(within(seccio('Identificador')).getByText('forn')).toBeTruthy();
  expect(screen.getByText('Poble, correu, identificador, membres i eixida de Forn.')).toBeTruthy();
  /* Sense el port de membres (ni el context del Perfil), «Membres» és pendent, com abans. */
  expect(within(seccio('Membres')).getByRole('button', { name: 'Membres' }).disabled).toBe(true);
  expect(within(seccio('Membres')).getByText('Aquesta acció encara no està implementada en aquesta versió.')).toBeTruthy();
  /* Sense el correu llegit encara, els dos ajustos es pinten tancats i ho diuen. */
  expect(within(seccio('Correu de l’organització')).queryByRole('textbox')).toBeNull();
  expect(within(seccio('Correu de l’organització')).getByText('Carregant el correu de l’organització…')).toBeTruthy();
});

/* ── T43 · el correu opcional de l'organització ── */

const CONTACTE = { estat: 'llest', correu: '', public: false, perDefecte: { origen: 'creador', correu: 'pep@poble.test' } };

test('T43 · qui administra escriu un correu validat; l’ajuda diu d’on ix el per defecte, i buit és vàlid', async () => {
  pinta(forn, { contacte: CONTACTE });
  const bloc = seccio('Correu de l’organització');
  const camp = within(bloc).getByLabelText('Nou valor per a correu de l’organització:');
  expect(camp.getAttribute('type')).toBe('email');
  expect(camp.getAttribute('autocomplete')).toBe('email');
  const ajuda = within(bloc).getByText(/al teu correu \(pep@poble\.test\), perquè vas crear l’organització/);
  expect(camp.getAttribute('aria-describedby')).toBe(ajuda.id);
  fireEvent.change(camp, { target: { value: 'forn@x.cat?cc=altre@y.cat' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).not.toHaveBeenCalled();
  expect(within(bloc).getByRole('alert').textContent).toContain('Escriu un correu vàlid');
  fireEvent.change(camp, { target: { value: 'forn@exemple.cat' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('O', 'correu', 'forn@exemple.cat');
  fireEvent.change(camp, { target: { value: '' } });
  await act(async () => { fireEvent.submit(camp.closest('form')); });
  expect(props.guardarAjust).toHaveBeenLastCalledWith('O', 'correu', '');
});

test('T43 · «Mostrar el correu a la fitxa pública» només s’obri amb un correu desat', () => {
  pinta(forn, { contacte: CONTACTE });
  expect(within(seccio('Correu a la fitxa pública')).queryByRole('checkbox')).toBeNull();
  expect(within(seccio('Correu a la fitxa pública')).getByText('Primer desa un correu de l’organització.')).toBeTruthy();
  cleanup();
  pinta(forn, { contacte: { ...CONTACTE, correu: 'forn@exemple.cat' } });
  const casella = within(seccio('Correu a la fitxa pública')).getByRole('checkbox', { name: 'Mostrar el correu a la fitxa pública' });
  expect(casella.checked).toBe(false);
});

test('T43 · un membre no veu MAI el correu, encara que el context el tinguera', () => {
  pinta({ ...forn, dades: { ...forn.dades, role: 'member' } }, { contacte: { ...CONTACTE, correu: 'secret@forn.cat' } });
  expect(screen.queryByText('secret@forn.cat')).toBeNull();
  expect(screen.queryByDisplayValue('secret@forn.cat')).toBeNull();
  expect(within(seccio('Correu de l’organització')).getByText('Només qui administra aquesta organització ho pot canviar.')).toBeTruthy();
});

test('T43 · sense servidor que el dese, es diu amb el motiu honest', () => {
  pinta(forn, { contacte: { estat: 'no-disponible', motiu: 'El servidor d’este poble encara no desa el correu de les organitzacions.' } });
  expect(within(seccio('Correu de l’organització')).getByText('El servidor d’este poble encara no desa el correu de les organitzacions.')).toBeTruthy();
  expect(within(seccio('Correu de l’organització')).queryByRole('textbox')).toBeNull();
});

/* T51 · Regla del Mestre (260928): cap document sense data. «El compte» porta
   la de la fila (profiles o l'organització): la creació o l'última modificació. */
test('T51 · la barra taronja porta la data real del compte (la modificació, si és posterior)', () => {
  pinta({ ...jo, dades: { ...jo.dades, created_at: '2026-08-01T09:00:00', updated_at: '2026-09-27T17:30:00' } });
  expect(m.pagina).toMatchObject({ time: '17:30', date: '27/09/26' });
  cleanup();
  pinta({ ...forn, dades: { ...forn.dades, created_at: '2026-09-02T11:05:00', updated_at: '2026-09-01T08:00:00' } });
  expect(m.pagina).toMatchObject({ time: '11:05', date: '02/09/26' });
});

/* El port ja porta created_at i updated_at (remot i localPerfils en seed): una
   fila sense cap de les dues no té font, i la pàgina no se n'inventa cap. */
test('T51 · una fila sense created_at ni updated_at: cap data inventada (mai la d’ara)', () => {
  pinta();
  expect(m.pagina).toMatchObject({ time: '', date: '', dateTime: '' });
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». La pàgina privada del compte porta
   a la fitxa pública pròpia. */
test('261007 · la barra taronja del compte porta a la fitxa pública pròpia (persona per l’id real, no «jo»)', async () => {
  pinta({ ...jo, dades: { ...jo.dades, id: 'U' } });
  expect(m.pagina.topBarData.authorHref).toBe('/gent/U');
  cleanup();
  // Sense la fila, cap ruta inventada.
  pinta();
  expect(m.pagina.topBarData.authorHref).toBeNull();
  cleanup();
  pinta(forn);
  expect(m.pagina.topBarData.authorHref).toBe('/empresa/O');
  cleanup();
  pinta({ ...forn, id: 'G', mena: 'grup' });
  expect(m.pagina.topBarData.authorHref).toBe('/grup/G');
  cleanup();
  const { ENTITAT_PILOT_ID } = await import('../../data/identitatsSeed.js');
  const { RUTA_PERFIL_PROJECTE } = await import('../../config/navigation.js');
  pinta({ ...forn, id: ENTITAT_PILOT_ID });
  /* Onada 8 (261009) · El pilot, al seu perfil, ja no a /projecte. */
  expect(m.pagina.topBarData.authorHref).toBe(RUTA_PERFIL_PROJECTE);
});

/* Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
   Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
   oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · «El
   compte» diu el mateix que l'editor i «Les vistes» (avatarDeLaBarraDeFitxa,
   de fitxaDePerfil.js): el pilot, pel slug declarat o per l'id de la llavor,
   porta el PNG verd a la barra taronja, siga quin siga el logo de la fila. El
   nom, el poble i l'enllaç són els de sempre. */
test('prompt 261014_0400 · la barra taronja del compte del pilot porta el PNG verd oficial; una altra organització i la persona, el seu avatar', async () => {
  const { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } = await import('../../data/identitatsSeed.js');
  const { RUTA_PERFIL_PROJECTE } = await import('../../config/navigation.js');
  const { DEFAULT_AUTHOR } = await import('../../components/universal/UniversalUtils.js');
  expect(DEFAULT_AUTHOR.avatarUrl).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const pilot = { ...forn, id: uuid, nom: 'Sóc de Poble', dades: { ...forn.dades, slug: ENTITAT_PILOT_SLUG, town_name: 'Alcoi' } };
  for (const avatar of [null, '', 'sdp-media://organitzacions/x.png', '/assets/x.webp']) {
    pinta({ ...pilot, avatar });
    expect(m.pagina.topBarData).toMatchObject({ authorName: 'Sóc de Poble', authorAvatar: DEFAULT_AUTHOR.avatarUrl, authorLocation: 'Alcoi' });
    cleanup();
  }
  pinta({ ...forn, id: ENTITAT_PILOT_ID, avatar: null });
  expect(m.pagina.topBarData).toMatchObject({ authorAvatar: DEFAULT_AUTHOR.avatarUrl, authorHref: RUTA_PERFIL_PROJECTE });
  cleanup();
  pinta({ ...forn, avatar: '/assets/forn.webp' });
  expect(m.pagina.topBarData.authorAvatar).toBe('/assets/forn.webp');
  cleanup();
  pinta({ ...forn, id: uuid, nom: 'Sóc de Poble', avatar: null, dades: { ...forn.dades, slug: 'soc-de-poble-de-relleu' } });
  expect(m.pagina.topBarData.authorAvatar).toBe('');
  cleanup();
  pinta({ ...jo, avatar: '/assets/pep.webp', dades: { ...jo.dades, id: 'U', slug: ENTITAT_PILOT_SLUG } });
  expect(m.pagina.topBarData.authorAvatar).toBe('/assets/pep.webp');
});

/* Revisió del prompt 261014_0400 · Reproduïx un deute conegut, no el fixa:
   rutaDeLaFitxa (DetallCompte) no mira el slug, i el pilot amb un UUID que
   ningú ha registrat encara porta a /empresa/:uuid, mentre l'editor i «Les
   vistes» (rutaDeFitxaPublica) ja porten al seu perfil. L'avatar sí que és
   el de l'editor. L'enllaç queda fora per ordre (la Llei del Píxel del
   prompt): triar-lo és decisió pendent del Mestre. */
test('[DEFECTE] prompt 261014_0400 · el compte del pilot per slug, amb el UUID sense registrar, porta a /empresa/:uuid i no al seu perfil', async () => {
  const { ENTITAT_PILOT_SLUG } = await import('../../data/identitatsSeed.js');
  const { RUTA_PERFIL_PROJECTE } = await import('../../config/navigation.js');
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  pinta({ ...forn, id: uuid, nom: 'Sóc de Poble', dades: { ...forn.dades, slug: ENTITAT_PILOT_SLUG } });
  expect(m.pagina.topBarData.authorHref).toBe(`/empresa/${uuid}`);
  expect(m.pagina.topBarData.authorHref).not.toBe(RUTA_PERFIL_PROJECTE);
});

/* ── Grup C (ordre del Mestre, 261008) · el poble i els membres ── */

test('grup C · qui administra tria el poble entre els del node; es desa pel nom i la barra taronja el porta', async () => {
  m.towns = [{ id: 'b', title: 'Benilloba' }, { id: 'a', title: 'Alcoi' }];
  pinta({ ...forn, dades: { ...forn.dades, town_name: 'Sella' } });
  expect(m.pagina.topBarData.authorLocation).toBe('Sella');
  const bloc = seccio('Poble');
  const selector = within(bloc).getByLabelText('Nou valor per a poble:');
  expect(selector.tagName).toBe('SELECT');
  expect([...selector.options].map((o) => o.textContent)).toEqual(['Tria un poble…', 'Alcoi', 'Benilloba', 'Sella']);
  expect(selector.value).toBe('Sella');
  fireEvent.change(selector, { target: { value: 'Benilloba' } });
  await act(async () => { fireEvent.submit(selector.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('O', 'poble', 'Benilloba');
  expect(within(bloc).getByRole('status').textContent).toBe('Desat correctament.');
});

/* Correcció 261008 · Integració amb el catàleg de veres: com PerfilContext
   (aplicaColumnes), el pare porta el poble desat a identitat.dades i «El
   compte» refà l'ajust amb el valor nou. «Desat correctament.» es queda. */
function ArnesCompte() {
  const [identitat, setIdentitat] = React.useState({ ...forn, dades: { ...forn.dades, town_name: 'Sella' } });
  const guardarAjust = vi.fn(async (_id, _ajust, valor) => {
    setIdentitat((previ) => ({ ...previ, dades: { ...previ.dades, town_name: valor } }));
  });
  return <DetallCompte identitat={identitat} guardarAjust={guardarAjust} pujaMitja={vi.fn()} />;
}

test('grup C · desar el poble amb el pare que el torna: el selector i la barra taronja porten el nou, i el missatge es veu', async () => {
  m.towns = [{ id: 'b', title: 'Benilloba' }, { id: 's', title: 'Sella' }];
  render(<ArnesCompte />);
  const selector = within(seccio('Poble')).getByLabelText('Nou valor per a poble:');
  fireEvent.change(selector, { target: { value: 'Benilloba' } });
  await act(async () => { fireEvent.submit(selector.closest('form')); });
  expect(m.pagina.topBarData.authorLocation).toBe('Benilloba');
  expect(within(seccio('Poble')).getByLabelText('Nou valor per a poble:').value).toBe('Benilloba');
  expect(within(seccio('Poble')).getByRole('status').textContent).toBe('Desat correctament.');
});

test('grup C · sense cap poble al node, el selector continua obert (l’opció buida i el desat)', () => {
  pinta(forn);
  const selector = within(seccio('Poble')).getByLabelText('Nou valor per a poble:');
  expect([...selector.options].map((o) => o.value)).toEqual(['']);
  expect(within(seccio('Poble')).getByRole('button', { name: 'Guardar' })).toBeTruthy();
});

test('grup C · un membre veu el poble però no el canvia', () => {
  m.towns = [{ id: 'b', title: 'Benilloba' }];
  pinta({ ...forn, dades: { ...forn.dades, role: 'member', town_name: 'Benilloba' } });
  const bloc = seccio('Poble');
  expect(within(bloc).queryByRole('combobox')).toBeNull();
  expect(within(bloc).getByText('Benilloba')).toBeTruthy();
  expect(within(bloc).getByText('Només qui administra aquesta organització ho pot canviar.')).toBeTruthy();
});

test('grup C · sense la migració (PGRST204), desar el poble ho diu en valencià, no amb el text cru', async () => {
  m.towns = [{ id: 'b', title: 'Benilloba' }];
  pinta(forn);
  props.guardarAjust.mockRejectedValueOnce(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'town_name\' column of \'organizations\' in the schema cache"}'));
  const selector = within(seccio('Poble')).getByLabelText('Nou valor per a poble:');
  fireEvent.change(selector, { target: { value: 'Benilloba' } });
  await act(async () => { fireEvent.submit(selector.closest('form')); });
  const avis = within(seccio('Poble')).getByRole('alert').textContent;
  expect(avis).toBe('Este camp encara no té columna al servidor («town_name»): no s’ha desat. Cal aplicar al servidor la migració pendent.');
  expect(avis).not.toContain('Could not find');
});

const accionsDeMembres = () => ({
  ambMembres: true,
  usuari: { id: 'U' },
  llistaMembres: vi.fn(async () => [
    { tipus: 'persona', id: 'P', nom: 'Pepa', avatar: '', rol: 'owner', desDe: null },
    { tipus: 'persona', id: 'U', nom: 'Jo', avatar: '', rol: 'admin', desDe: null },
  ]),
  desaMembre: vi.fn(), llevaMembre: vi.fn(async () => ({ llevat: true })), cercaCandidats: vi.fn(async () => []),
});

test('grup C · amb ambMembres i el context del Perfil, «Membres» pinta la gestió i «Eixir» demana confirmació', async () => {
  m.perfil = accionsDeMembres();
  pinta({ ...forn, dades: { ...forn.dades, role: 'admin' } }, { ambMembres: true });
  expect(await within(seccio('Membres')).findByRole('region', { name: 'Membres de Forn' })).toBeTruthy();
  expect(m.perfil.llistaMembres).toHaveBeenCalledWith('O', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  const eixir = within(seccio('Eixir de l’organització')).getByRole('button', { name: 'Eixir de l’organització' });
  expect(eixir.disabled).toBe(false);
  fireEvent.click(eixir);
  const dialeg = screen.getByRole('dialog', { name: 'Eixir de Forn?' });
  expect(m.perfil.llevaMembre).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Eixir' })); });
  expect(m.perfil.llevaMembre).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'U' });
  // Correcció 261008 · la confirmació va a l'avís efímer de l'App, que sobreviu a esta pàgina.
  expect(m.toast).toHaveBeenCalledWith('Ja no formes part de Forn.', 'success');
});

test('grup C · ambMembres sense el context del Perfil, o amb un port que no en sap, continua pendent', () => {
  pinta({ ...forn, dades: { ...forn.dades, role: 'admin' } }, { ambMembres: true });
  expect(within(seccio('Membres')).getByRole('button', { name: 'Membres' }).disabled).toBe(true);
  expect(within(seccio('Eixir de l’organització')).getByRole('button', { name: 'Eixir de l’organització' }).disabled).toBe(true);
  cleanup();
  m.perfil = { ...accionsDeMembres(), ambMembres: false };
  pinta({ ...forn, dades: { ...forn.dades, role: 'admin' } }, { ambMembres: true });
  expect(within(seccio('Membres')).getByRole('button', { name: 'Membres' }).disabled).toBe(true);
  expect(m.perfil.llistaMembres).not.toHaveBeenCalled();
  cleanup();
  /* I el context amb capacitat, però sense que PerfilShell ho declare (undefined), tampoc. */
  m.perfil = accionsDeMembres();
  pinta({ ...forn, dades: { ...forn.dades, role: 'admin' } });
  expect(within(seccio('Membres')).getByRole('button', { name: 'Membres' }).disabled).toBe(true);
  expect(m.perfil.llistaMembres).not.toHaveBeenCalled();
});

test('sense identitat no pinta res', () => {
  const { container } = render(<DetallCompte identitat={null} />);
  expect(container.innerHTML).toBe('');
});

/* ═══════════════════════════════════════════════════════════════════
   GAUNTLET 261016 (ENCÀRREC D) · «EL COMPTE» I L'EDITOR, LA MATEIXA IMATGE

   Pla, Onada 1.1.4: «han de beure exactament de la mateixa instància de
   dades». Abans, la barra taronja d'«El compte» llegia identitat.avatar, el
   del servidor: després d'un avatar rebutjat (403), l'apartat tornava a la
   foto vella mentre l'editor, la targeta viva i «Les vistes» ensenyaven la
   nova. Ara, avatarDeLaFitxa (fitxaDePerfil.js). Com a DetallVistes.test.jsx,
   el 403 s'injecta al port i el viu la cua de veres (cuaDesament, amb els
   escriptors de perfilEscriptor.js), amb la clau de l'editor.
   ═══════════════════════════════════════════════════════════════════ */
describe('Gauntlet 261016 (encàrrec D) · un 403 al desat de la imatge: la barra d’«El compte» porta la de l’editor', () => {
  const CONTEXT = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
  const AMBIT_U = ambitDe(CONTEXT, 'U');
  const VELLA = '/assets/a.webp';
  const NOVA = '/assets/nou.webp';
  const error403 = (taula) => Object.assign(
    new Error(`Supabase 403: {"code":"42501","message":"permission denied for table ${taula}"}`), { status: 403, code: '42501' },
  );
  const javi = { ...jo, nom: 'Javi Llinares', avatar: VELLA, dades: { ...jo.dades, id: 'U', full_name: 'Javi Llinares', avatar_url: VELLA } };
  const rentonar = {
    id: 'R', mena: 'grup', nom: 'El Rentonar', avatar: '/assets/rentonar.webp',
    dades: { name: 'El Rentonar', role: 'owner', logo_url: '/assets/rentonar.webp' },
  };
  const refDe = (id, entitat) => ({ ambit: AMBIT_U, context: CONTEXT, entitat, id });
  /* El valor s'encua i el servidor el rebutja: la cua el conserva amb l'error. */
  async function rebutjat(ref, valor) {
    cuaDesament.encua(ref, 'logoImage', valor);
    await cuaDesament.desaAra(ref);
  }
  const barra = () => m.pagina.topBarData.authorAvatar;

  beforeEach(async () => {
    await cuaDesament.reinicia();
    m.usuari = { id: 'U' };
    m.perfil = { autodesament: { ambit: AMBIT_U, context: CONTEXT } };
    m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
    m.updateOrganization = vi.fn(async () => { throw error403('organizations'); });
  });
  afterEach(() => cuaDesament.reinicia());

  test('Javi Llinares · l’avatar rebutjat: la barra porta la foto nova de la cua, no la del servidor', async () => {
    await rebutjat(refDe('jo', 'perfil'), NOVA);
    const estat = cuaDesament.llig(refDe('jo', 'perfil'));
    expect([estat.estat, estat.camps.logoImage, estat.errors.logoImage.tipus]).toEqual(['error', NOVA, 'servidor']);
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: NOVA }, CONTEXT]]);
    pinta(javi);
    expect(barra()).toBe(NOVA);
  });

  test('Javi Llinares · «Llevar l’avatar» rebutjat: cap foto, mai la vella', async () => {
    await rebutjat(refDe('jo', 'perfil'), '');
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: null }, CONTEXT]]);
    pinta(javi);
    expect(barra()).toBe('');
  });

  test('El Rentonar · el logotip rebutjat, el mateix; «Tornar al que hi ha desat» (la cua neta) torna al del servidor', async () => {
    await rebutjat(refDe('R', 'organitzacio'), NOVA);
    expect(m.updateOrganization.mock.calls).toEqual([['R', { logo_url: NOVA }, CONTEXT]]);
    pinta(rentonar);
    expect(barra()).toBe(NOVA);
    cleanup();
    cuaDesament.descarta(refDe('R', 'organitzacio'), 'logoImage');
    pinta(rentonar);
    expect(barra()).toBe('/assets/rentonar.webp');
  });

  test('Sóc de Poble · amb un logotip rebutjat a la cua, la barra continua amb el PNG verd oficial', async () => {
    const { ENTITAT_PILOT_ID } = await import('../../data/identitatsSeed.js');
    const { DEFAULT_AUTHOR } = await import('../../components/universal/UniversalUtils.js');
    await rebutjat(refDe(ENTITAT_PILOT_ID, 'organitzacio'), 'sdp-media://organitzacions/nou.png');
    pinta({ ...forn, id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', avatar: null });
    expect(barra()).toBe(DEFAULT_AUTHOR.avatarUrl);
  });

  test('qui només n’és membre no llig la cua (com l’editor en lectura), i sense el context del Perfil, la fitxa del servidor', async () => {
    await rebutjat(refDe('R', 'organitzacio'), NOVA);
    pinta({ ...rentonar, dades: { ...rentonar.dades, role: 'member' } });
    expect(barra()).toBe('/assets/rentonar.webp');
    cleanup();
    m.perfil = null;
    pinta(rentonar);
    expect(barra()).toBe('/assets/rentonar.webp');
  });

  test('sense esborrany a la cua: la imatge de la fitxa i, sense cap, la reserva de la identitat (la foto de la sessió)', () => {
    pinta({ ...javi, avatar: 'https://proveidor.example/foto.jpg', dades: { ...javi.dades, avatar_url: '/assets/pep.webp' } });
    expect(barra()).toBe('/assets/pep.webp');
    cleanup();
    pinta({ ...jo, avatar: 'https://proveidor.example/foto.jpg' });
    expect(barra()).toBe('https://proveidor.example/foto.jpg');
  });
});
