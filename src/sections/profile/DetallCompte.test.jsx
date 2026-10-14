import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  navigate: vi.fn(), logout: vi.fn(), estatBaixa: vi.fn(), estatConsentiment: vi.fn(), exporta: vi.fn(), pagina: null,
  /* Grup C (261008) · els pobles del contingut core i el context del Perfil (null: sense proveïdor). */
  towns: [], perfil: null,
  /* Correcció 261008 · l'avís efímer de l'App (la confirmació d'«Eixir»). */
  toast: vi.fn(),
  /* Onada 11 (261010) · la sessió opcional (null: sense proveïdor, ningú és superadmin). */
  sessio: null,
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
}));
import { DetallCompte } from './DetallCompte.jsx';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { full_name: 'Pep', email: 'pep@poble.test', is_public: false, town_name: 'La Torre' } };
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
  expect(titols).toEqual(['Correu electrònic', 'Estat del perfil', 'Contrasenya', 'Segon factor', 'Panell de superadministració', 'Tancar sessió']);
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
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Correu electrònic', 'Estat del perfil', 'Contrasenya', 'Tancar sessió']);
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
  expect(titols).toEqual(['Correu electrònic', 'Estat del perfil', 'Contrasenya', 'Tancar sessió']);
  expect(within(seccio('Correu electrònic')).getByText('pep@poble.test')).toBeTruthy();
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

test('«Estat del perfil»: la casella té un nom estable, l’etiqueta visible hi apunta i el desat s’anuncia', async () => {
  pinta();
  const bloc = seccio('Estat del perfil');
  const casella = within(bloc).getByRole('checkbox', { name: 'Perfil públic' });
  expect(casella.checked).toBe(false);
  // L'etiqueta «Estat del perfil:» apunta a la casella (abans, a un id que no existia).
  expect(within(bloc).getByLabelText('Estat del perfil:')).toBe(casella);
  fireEvent.click(casella);
  expect(within(bloc).getByRole('checkbox', { name: 'Perfil públic' }).checked).toBe(true);
  await act(async () => { fireEvent.submit(casella.closest('form')); });
  expect(props.guardarAjust).toHaveBeenCalledWith('jo', 'privacitat', true);
  expect(within(bloc).getByRole('status').textContent).toBe('Desat correctament.');
  props.guardarAjust.mockRejectedValueOnce(new Error('Sense xarxa'));
  await act(async () => { fireEvent.submit(casella.closest('form')); });
  expect(within(bloc).getByRole('alert').textContent).toBe('Sense xarxa');
});

test('amb una baixa en curs, «Estat del perfil» no es pot desar i diu per què', () => {
  pinta({ ...jo, dades: { ...jo.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } });
  const bloc = seccio('Estat del perfil');
  expect(within(bloc).queryByRole('checkbox')).toBeNull();
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
