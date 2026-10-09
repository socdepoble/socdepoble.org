import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ adapter: null, guardar: vi.fn(), puja: vi.fn(), toast: vi.fn(), recarrega: vi.fn(), identitats: [],
  autodesament: null, updateProfile: vi.fn(), updateOrganization: vi.fn(), updateAgent: vi.fn() }));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { m.adapter = adapter; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => ({ guardarCampPerfil: m.guardar, pujaMitja: m.puja, recarrega: m.recarrega,
  identitats: m.identitats, autodesament: m.autodesament }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
/* T47 · La fitxa es desa per la cua d'autodesament: els escriptors (perfilEscriptor.js)
   parlen amb el port, no amb guardarCampPerfil. La sessió és sempre la de «U». */
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: (...args) => m.updateProfile(...args),
  updateOrganization: (...args) => m.updateOrganization(...args),
  updateAgent: (...args) => m.updateAgent(...args),
}));
import { PerfilEditor, AVIS_SENSE_COLUMNA } from './PerfilEditor.jsx';
import { desaLlicenciaPerDefecte, llegixLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import { AVISOS_TARGETA_VIVA } from '../../components/universal/TargetaViva.jsx';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', avatar: 'a.webp', dades: { full_name: 'Pep', is_public: false, town_name: 'La Torre' } };
const org = (role, visibility = 'public') => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', dades: { name: 'Forn & Cia', description: 'Pa', lema: 'Matí', presentacio_html: '<p>Cos</p>', visibility, role } });

beforeEach(async () => {
  m.adapter = null; m.guardar.mockReset().mockResolvedValue(undefined); m.puja.mockReset(); m.toast.mockReset();
  m.recarrega.mockReset(); m.identitats = [];
  m.updateProfile.mockReset().mockImplementation(async (canvis) => ({ id: 'U', ...canvis }));
  m.updateOrganization.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.updateAgent.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.autodesament = { ambit: ambitDe(CONFIG, 'U'), context: CONFIG };
  await cuaDesament.reinicia();
});
afterEach(cleanup);

test('D13 · les eines van davall de l’entradilla i sense llavor; la identitat viu a la barra negra (T40)', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.posicioEines).toBe('davall-entradilla');
  // Null explícit: sense la clau, DocumentEditor hi posaria la llavor de Notes.
  expect(m.adapter).toHaveProperty('seedContent', null);
  expect(m.adapter.identityActions).toBeUndefined();
  // La fitxa no té data de publicació: el Perfil no activa el calendari.
  expect(m.adapter.ambDataPublicacio).toBeUndefined();
  expect(m.adapter.document).toMatchObject({ id: 'jo', title: 'Pep', isPublished: false });
  expect(m.adapter).toMatchObject({ barAuthorName: 'Pep', barAuthorLocation: 'La Torre', barAuthorAvatar: 'a.webp' });
});

/* T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · La fitxa del
   Perfil activa la targeta viva de l'editor i publica el document en curs per
   a la llista (documentViu, per l'id de la identitat). */
test('T50 · l’adaptador del Perfil porta targetaViva: true (també en lectura)', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.targetaViva).toBe(true);
  cleanup();
  render(<PerfilEditor identitat={org('member')} />);
  expect(m.adapter.document).toBeNull();
  expect(m.adapter.targetaViva).toBe(true);
});

/* Poliment T50 (revisió de W3B1, D3) · L'aside i el xip de l'editor diuen el
   mateix avís que la fitxa de la llista (PerfilShell): el del Perfil, que no
   promet cap publicació, per a una persona i per a una organització. */
test('T50 · l’adaptador del Perfil passa l’avís de la targeta viva del Perfil (persona i organització)', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.avisTargetaViva).toBe(AVISOS_TARGETA_VIVA.perfil);
  cleanup();
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.avisTargetaViva).toBe(AVISOS_TARGETA_VIVA.perfil);
  expect(`${m.adapter.avisTargetaViva.descripcio} ${m.adapter.avisTargetaViva.vista}`).not.toMatch(/publica|teua/i);
});

test('T50 · el document en curs es publica per a la llista, amb l’autoria de la barra i les píndoles, i es retira en desmuntar', async () => {
  const { llegixDocumentViu } = await import('../../components/universal/documentViu.js');
  const vista = render(<PerfilEditor identitat={jo} />);
  const viu = llegixDocumentViu('jo');
  expect(viu.document).toBe(m.adapter.document);
  /* Onada 8 (261009, revisió) · També la ruta de la barra (la boina de la
     targeta viva porta on la barra). Ací la persona no porta dades.id: cap. */
  expect(viu.autor).toEqual({ nom: 'Pep', avatar: 'a.webp', poble: 'La Torre', ruta: null });
  expect(viu.autor).toEqual({ nom: m.adapter.barAuthorName, avatar: m.adapter.barAuthorAvatar, poble: m.adapter.barAuthorLocation, ruta: m.adapter.barAuthorHref });
  expect(viu.etiquetes).toBe(m.adapter.labels);
  // El que s'escriu arriba a l'entrada, sense esperar el servidor.
  act(() => m.adapter.updateLocal('jo', 'title', 'Pep &amp; Maria'));
  expect(llegixDocumentViu('jo').document.title).toBe('Pep &amp; Maria');
  vista.unmount();
  expect(llegixDocumentViu('jo')).toBeNull();
  /* Una organització: la seua fitxa pública, la mateixa de la barra. */
  const deLOrg = render(<PerfilEditor identitat={org('owner')} />);
  expect(llegixDocumentViu('O').autor.ruta).toBe('/empresa/O');
  expect(llegixDocumentViu('O').autor.ruta).toBe(m.adapter.barAuthorHref);
  deLOrg.unmount();
});

test('el títol es desa com a text pla a full_name', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', '<strong>Pep</strong> &amp; Maria'));
  expect(m.updateProfile).toHaveBeenCalledWith({ full_name: 'Pep & Maria' }, CONFIG);
  expect(m.guardar).not.toHaveBeenCalled();
});

test('el cos es desa a presentacio_html, sanejat', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'content', '<p>x</p><script>1</script>'));
  expect(m.updateProfile).toHaveBeenCalledWith({ presentacio_html: '<p>x</p>' }, CONFIG);
});

/* T47 (ordre del Mestre, 260928) · Els errors de desat ja no són toasts
   efímers: van en línia (la closca els pinta amb role=alert) i el text es
   conserva com a esborrany. */
test('T47 · un títol buit no arriba al servidor: l’error és en línia i el text es conserva', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', ''));
  expect(m.updateProfile).not.toHaveBeenCalled();
  expect(m.toast).not.toHaveBeenCalled();
  expect(m.adapter.avisosCamps.title.error.missatge)
    .toBe('El nom no pot quedar buit. El text es guarda en esta pestanya fins que el corregisques o tanques la sessió.');
  expect(m.adapter.avisosCamps.title.error.accions.map((accio) => accio.text)).toEqual(['Tornar al que hi ha desat']);
  expect(m.adapter.document.title).toBe('');
  expect(m.adapter.estatDesament.estat).toBe('error');
});

test('T47 · una columna que encara no existix: quarantena d’eixe camp, avís en línia, cap insistència i el text es conserva', async () => {
  m.updateProfile.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'lema\' column of \'profiles\' in the schema cache"}'));
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'lead', 'Del Mas'));
  await act(() => m.adapter.saveRemote('jo', 'lead', 'Del Mas i més'));
  expect(m.updateProfile).toHaveBeenCalledTimes(1);
  expect(m.toast).not.toHaveBeenCalled();
  const { missatge } = m.adapter.avisosCamps.lead.error;
  expect(missatge.startsWith(AVIS_SENSE_COLUMNA)).toBe(true);
  expect(missatge).toContain('encara no té columna');
  // Diu QUINA columna falta, la que ha dit el servidor.
  expect(missatge).toContain('«lema»');
  expect(m.adapter.document.lead).toBe('Del Mas i més');
});

test('T47 · 42703 també es llig com a columna absent; un error de xarxa es veu a la ploma, tal qual, sense avís de camp', async () => {
  m.updateProfile.mockRejectedValueOnce(new Error('Supabase 400: {"code":"42703","message":"column profiles.hero_url does not exist"}'));
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'heroImage', 'https://poble.test/h.webp'));
  expect(m.adapter.avisosCamps.heroImage.error.missatge).toContain('encara no té columna al servidor («hero_url»)');
  /* T47 (correcció de la revisió, 260928) · De xarxa de veres: status 0, com l'adaptador. */
  m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Sense xarxa'), { status: 0 }));
  await act(() => m.adapter.saveRemote('jo', 'subtitle', 'Llaurador'));
  expect(m.adapter.estatDesament.estat).toBe('error');
  expect(m.adapter.estatDesament.detall).toContain('Sense xarxa');
  expect(m.adapter.estatDesament.detall).toContain('Es tornarà a provar sol');
  expect(m.adapter.avisosCamps.subtitle).toBeUndefined();
  expect(m.toast).not.toHaveBeenCalled();
});

test('T47 · un error de xarxa es reintenta sol i, quan el servidor confirma, la ploma desapareix', async () => {
  vi.useFakeTimers();
  try {
    m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Error de xarxa'), { status: 0 }));
    render(<PerfilEditor identitat={jo} />);
    await act(async () => { await m.adapter.saveRemote('jo', 'subtitle', 'Llaurador'); });
    expect(m.updateProfile).toHaveBeenCalledTimes(1);
    expect(m.adapter.estatDesament.estat).toBe('error');
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(m.updateProfile).toHaveBeenCalledTimes(2);
    expect(m.updateProfile).toHaveBeenLastCalledWith({ bio: 'Llaurador' }, CONFIG);
    expect(m.adapter.estatDesament).toEqual({ estat: 'net', detall: '' });
  } finally {
    vi.useRealTimers();
  }
});

/* Línia I2 (pla 261008_1201) · Amb un error temporal, la ploma porta
   `reintentant`: la icona sap que el pas a 'net' és la confirmació del
   servidor (pinta el check). La clau només hi és quan és certa. */
test('Línia I2 · estatDesament porta reintentant: true només mentre la cua torna a provar un error temporal', async () => {
  vi.useFakeTimers();
  try {
    m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Error de xarxa'), { status: 0 }));
    render(<PerfilEditor identitat={jo} />);
    act(() => m.adapter.updateLocal('jo', 'subtitle', 'Llaurador'));
    expect(m.adapter.estatDesament).toEqual({ estat: 'pendent', detall: '' });
    await act(async () => { await m.adapter.saveRemote('jo', 'subtitle', 'Llaurador'); });
    expect(m.adapter.estatDesament).toEqual({
      estat: 'error', detall: expect.stringContaining('Es tornarà a provar sol'), reintentant: true,
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(m.updateProfile).toHaveBeenCalledTimes(2);
    expect(m.adapter.estatDesament).toEqual({ estat: 'net', detall: '' });
    // Una fallada que no es torna a provar sola (un 4xx): error, sense la clau.
    m.updateProfile.mockRejectedValueOnce(new Error('El perfil no s’ha confirmat al servidor.'));
    await act(async () => { await m.adapter.saveRemote('jo', 'subtitle', 'Llauradora'); });
    expect(m.adapter.estatDesament.estat).toBe('error');
    expect(m.adapter.estatDesament).not.toHaveProperty('reintentant');
  } finally {
    vi.useRealTimers();
  }
});

test('T47 · una fallada que no és de xarxa (l’adaptador sense status, un 4xx) no es reintenta sola: avís en línia amb les dues eixides', async () => {
  vi.useFakeTimers();
  try {
    m.updateProfile.mockRejectedValueOnce(new Error('El perfil no s’ha confirmat al servidor.'));
    render(<PerfilEditor identitat={jo} />);
    await act(async () => { await m.adapter.saveRemote('jo', 'subtitle', 'Llaurador'); });
    const { missatge, accions } = m.adapter.avisosCamps.subtitle.error;
    expect(missatge).toBe('El servidor no ha acceptat el canvi (El perfil no s’ha confirmat al servidor). El text es guarda en esta pestanya fins que tanques la sessió.');
    expect(accions.map((accio) => accio.text)).toEqual(['Tornar a provar', 'Tornar al que hi ha desat']);
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
    expect(m.updateProfile).toHaveBeenCalledTimes(1);
    expect(m.adapter.document.subtitle).toBe('Llaurador');
    await act(async () => { accions[0].onClick(); await vi.advanceTimersByTimeAsync(0); });
    expect(m.updateProfile).toHaveBeenCalledTimes(2);
    expect(m.adapter.avisosCamps.subtitle).toBeUndefined();
  } finally {
    vi.useRealTimers();
  }
});

test('un AbortError (sessió canviada) no molesta: queda pendent, sense avís', async () => {
  m.updateProfile.mockRejectedValue(new DOMException('canvi', 'AbortError'));
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', 'Pere'));
  expect(m.updateProfile).toHaveBeenCalledTimes(1);
  expect(m.toast).not.toHaveBeenCalled();
  /* Amb la fitxa oberta, la persona és dins de la sessió de React: la ploma no
     diu «cal tornar a entrar» (és la finestra d'una renovació), sinó pendent. */
  expect(cuaDesament.llig({ ...m.autodesament, entitat: 'perfil', id: 'jo' }).estat).toBe('sessio');
  expect(m.adapter.estatDesament.estat).toBe('pendent');
  expect(m.adapter.avisosCamps.title).toBeUndefined();
  expect(m.adapter.document.title).toBe('Pere');
});

test('un blur sense canvis no desa res: ni el nom ni una descripció de diversos paràgrafs', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', m.adapter.document.title));
  await act(() => m.adapter.saveRemote('jo', 'lead', ''));
  expect(m.updateProfile).not.toHaveBeenCalled();
  cleanup();
  const ambSalts = { ...org('owner'), dades: { ...org('owner').dades, description: 'Pa de llenya.\nCada matí.' } };
  render(<PerfilEditor identitat={ambSalts} />);
  // El que torna la closca en eixir de l'H2 sense tocar-lo: el mateix HTML que s'hi va pintar.
  await act(() => m.adapter.saveRemote('O', 'subtitle', m.adapter.document.subtitle));
  expect(m.updateOrganization).not.toHaveBeenCalled();
  await act(() => m.adapter.saveRemote('O', 'subtitle', 'Pa de llenya i coca.'));
  expect(m.updateOrganization).toHaveBeenCalledWith('O', { description: 'Pa de llenya i coca.' }, CONFIG);
});

test('un nom buit al servidor no es desa amb el de reserva només per entrar i eixir', async () => {
  const senseNom = { ...jo, nom: 'El meu compte', dades: { ...jo.dades, full_name: '' } };
  render(<PerfilEditor identitat={senseNom} />);
  await act(() => m.adapter.saveRemote('jo', 'title', m.adapter.document.title));
  expect(m.updateProfile).not.toHaveBeenCalled();
});

test('T47 · una entradilla massa llarga es conserva com a esborrany, amb comptador i dues eixides; «Retallar» la desa', async () => {
  /* T49 · El límit de l'entradilla és 256 (limitsText.js): 300 en passa. */
  const llarga = 'a'.repeat(300);
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'lead', llarga));
  await act(() => m.adapter.saveRemote('jo', 'lead', llarga));
  expect(m.updateProfile).not.toHaveBeenCalled();
  expect(m.toast).not.toHaveBeenCalled();
  expect(m.adapter.document.lead).toBe(llarga);
  const { error, comptador } = m.adapter.avisosCamps.lead;
  expect(comptador).toEqual({ llargaria: 300, maxim: 256 });
  // El text de l'alerta (role=alert) no porta la xifra viva: la porta el comptador.
  /* T47 (correcció de la revisió C01, 260928) · Eixir l'esborra (després d'avisar): el text ho diu. */
  expect(error.missatge).toBe('Com a màxim 256 caràcters. El text es guarda en esta pestanya fins que l’escurces o tanques la sessió.');
  expect(error.accions.map((accio) => accio.text)).toEqual(['Retallar a 256', 'Tornar al que hi ha desat']);
  await act(async () => { error.accions[0].onClick(); });
  expect(m.updateProfile).toHaveBeenCalledWith({ lema: 'a'.repeat(256) }, CONFIG);
  expect(m.adapter.document.lead).toBe('a'.repeat(256));
  expect(m.adapter.avisosCamps.lead.error).toBeUndefined();
  expect(m.adapter.estatDesament.estat).toBe('net');
});

test('T47 · «Tornar al que hi ha desat» renuncia a l’esborrany i la fitxa torna al valor del servidor', () => {
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, lema: 'Del Comtat' } }} />);
  act(() => m.adapter.updateLocal('jo', 'lead', 'b'.repeat(270)));
  expect(m.adapter.avisosCamps.lead.comptador).toEqual({ llargaria: 270, maxim: 256 });
  expect(m.adapter.avisosCamps.lead.error.missatge).toContain('Com a màxim 256 caràcters.');
  act(() => m.adapter.avisosCamps.lead.error.accions[1].onClick());
  expect(m.adapter.document.lead).toBe('Del Comtat');
  expect(m.adapter.avisosCamps.lead).toBeUndefined();
  expect(cuaDesament.llig({ ...m.autodesament, entitat: 'perfil', id: 'jo' }).camps).toEqual({});
  expect(m.updateProfile).not.toHaveBeenCalled();
});

test('T47 · mentre s’escriu per damunt del límit, el text de l’alerta no canvia a cada tecla: la xifra va al comptador', () => {
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'lead', 'd'.repeat(257)));
  const primer = m.adapter.avisosCamps.lead.error.missatge;
  act(() => m.adapter.updateLocal('jo', 'lead', 'd'.repeat(258)));
  expect(m.adapter.avisosCamps.lead.error.missatge).toBe(primer);
  expect(m.adapter.avisosCamps.lead.comptador).toEqual({ llargaria: 258, maxim: 256 });
});

test('T47 · el cos massa llarg també porta la xifra viva al comptador, fora de l’alerta', () => {
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'content', `<p>${'e'.repeat(20000)}</p>`));
  const { error, comptador } = m.adapter.avisosCamps.content;
  expect(error.missatge).toMatch(/^Com a màxim \d+ caràcters\. El text es guarda/);
  expect(comptador.llargaria).toBeGreaterThan(comptador.maxim);
});

test('T47 · el comptador apareix a partir del 80 % del límit', () => {
  /* T49 · 0,8 × 256 = 204,8: 204 encara no el mostra, 205 sí. */
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'lead', 'c'.repeat(204)));
  expect(m.adapter.avisosCamps.lead).toBeUndefined();
  act(() => m.adapter.updateLocal('jo', 'lead', 'c'.repeat(205)));
  expect(m.adapter.avisosCamps.lead).toEqual({ comptador: { llargaria: 205, maxim: 256 } });
});

test('T49 · una entradilla de 256 caràcters es desa sense avís; la de 257 es queda com a esborrany', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'lead', 'f'.repeat(256)));
  expect(m.updateProfile).toHaveBeenCalledWith({ lema: 'f'.repeat(256) }, CONFIG);
  expect(m.adapter.avisosCamps.lead.error).toBeUndefined();
  act(() => m.adapter.updateLocal('jo', 'lead', 'f'.repeat(257)));
  await act(() => m.adapter.saveRemote('jo', 'lead', 'f'.repeat(257)));
  expect(m.updateProfile).toHaveBeenCalledTimes(1);
  expect(m.adapter.avisosCamps.lead.error.accions[0].text).toBe('Retallar a 256');
  expect(m.adapter.document.lead).toBe('f'.repeat(257));
});

test('T47 · la ploma: pendent mentre s’escriu, desapareix quan el servidor confirma exactament eixa versió', async () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.estatDesament).toEqual({ estat: 'net', detall: '' });
  act(() => m.adapter.updateLocal('jo', 'subtitle', 'Llaurador'));
  expect(m.adapter.estatDesament.estat).toBe('pendent');
  await act(() => m.adapter.saveRemote('jo', 'subtitle', 'Llaurador'));
  expect(m.updateProfile).toHaveBeenCalledTimes(1);
  expect(m.updateProfile).toHaveBeenCalledWith({ bio: 'Llaurador' }, CONFIG);
  expect(m.adapter.estatDesament.estat).toBe('net');
});

test('T47 · en tornar a obrir la fitxa, comença amb l’esborrany que encara no té el servidor', () => {
  const { unmount } = render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'subtitle', 'Llaurador'));
  unmount();
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.document.subtitle).toBe('Llaurador');
  expect(m.adapter.estatDesament.estat).toBe('pendent');
});

test('T47 · qui només veu la fitxa en lectura no té ni ploma ni esborranys', () => {
  render(<PerfilEditor identitat={org('member')} />);
  expect(m.adapter.estatDesament).toBeUndefined();
  expect(m.adapter.avisosCamps).toBeUndefined();
});

test('la fila de reserva (profiles no s’ha pogut llegir) es veu en lectura, ho diu i es pot tornar a provar', () => {
  const reserva = { ...jo, dades: { reserva: true, id: 'jo', full_name: 'Pep', avatar_url: '', town_name: 'La Torre' } };
  render(<PerfilEditor identitat={reserva} />);
  expect(m.adapter.document).toBeNull();
  expect(m.adapter.emptyDocument.labels).toEqual([{ text: 'Persona' }, { text: 'Sense connexió' }]);
  expect(screen.getByRole('alert').textContent).toMatch(/No s’ha pogut llegir la fitxa/);
  fireEvent.click(screen.getByRole('button', { name: 'Tornar a provar' }));
  expect(m.recarrega).toHaveBeenCalledTimes(1);
  expect(m.guardar).not.toHaveBeenCalled();
});

/* Onada 4 (decisió del Mestre, 261008, per coherència amb la fitxa pública) ·
   Una organització porta el SEU poble o cap: ja no hi entra el de la persona.
   Un agent conserva la reserva de sempre. */
test('Onada 4 · la fitxa d’una organització porta el seu poble i mai el de la persona; un agent, la reserva de sempre', () => {
  m.identitats = [jo, org('owner')];
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.barAuthorLocation).toBe('');
  cleanup();
  const ambPoble = { ...org('owner'), dades: { ...org('owner').dades, town_name: 'Benilloba' } };
  render(<PerfilEditor identitat={ambPoble} />);
  expect(m.adapter.barAuthorLocation).toBe('Benilloba');
  cleanup();
  render(<PerfilEditor identitat={{ id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } }} />);
  expect(m.adapter.barAuthorLocation).toBe('La Torre');
  cleanup();
  m.identitats = [];
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.barAuthorLocation).toBe('');
});

test('updateLocal guanya a les dades fins que es torna a obrir la fitxa', () => {
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'title', '<em>Pere</em>'));
  expect(m.adapter.document.title).toBe('<em>Pere</em>');
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». La barra taronja de la fitxa porta
   a la fitxa pública de la identitat: la persona, amb l'id de la seua fila,
   MAI amb 'jo'. */
test('261007 · la barra de la persona porta a la seua fitxa pública amb l’id real, no «jo»', () => {
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, id: 'U' } }} />);
  expect(m.adapter.barAuthorHref).toBe('/gent/U');
  expect(m.adapter.barAuthorHref).not.toContain('jo');
  cleanup();
  // Sense la fila (encara no llegida), cap enllaç: la ruta no s'endevina.
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.barAuthorHref).toBeNull();
});

test('261007 · una organització porta a la seua fitxa (també en lectura); un agent IA, a la seua', () => {
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.barAuthorHref).toBe('/empresa/O');
  cleanup();
  render(<PerfilEditor identitat={org('member')} />);
  expect(m.adapter.document).toBeNull();
  expect(m.adapter.barAuthorHref).toBe('/empresa/O');
  cleanup();
  render(<PerfilEditor identitat={{ id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } }} />);
  expect(m.adapter.barAuthorHref).toBe('/perfil/A');
});

/* Onada 8 (261009) · L'entitat pilot porta al seu perfil (RUTA_PERFIL_PROJECTE), ja no a /projecte. */
test('261007 · rutaDeFitxaPublica: persona per dades.id, grup a /grup, entitat pilot al seu perfil, sense id null', async () => {
  const { rutaDeFitxaPublica } = await import('./PerfilEditor.jsx');
  const { ENTITAT_PILOT_ID } = await import('../../data/identitatsSeed.js');
  const { RUTA_PERFIL_PROJECTE } = await import('../../config/navigation.js');
  expect(rutaDeFitxaPublica({ ...jo, dades: { id: 'U' } })).toBe('/gent/U');
  expect(rutaDeFitxaPublica(jo)).toBeNull();
  expect(rutaDeFitxaPublica({ id: 'G', mena: 'grup', nom: 'Colla' })).toBe('/grup/G');
  expect(rutaDeFitxaPublica({ id: 'O', mena: 'empresa', nom: 'Forn' })).toBe('/empresa/O');
  expect(rutaDeFitxaPublica({ id: ENTITAT_PILOT_ID, mena: 'empresa', nom: 'Sóc de Poble' })).toBe(RUTA_PERFIL_PROJECTE);
  expect(rutaDeFitxaPublica({ id: 'A', mena: 'agent', nom: 'IAIA' })).toBe('/perfil/A');
  expect(rutaDeFitxaPublica(null)).toBeNull();
});

/* Auditoria 261007 (retocs de l'ordre E) · En remot, l'id de l'entitat pilot
   és un UUID que rutaDAutoria no reconeix fins que algú el registra: la fitxa
   la reconeix pel slug de la seua fila (list_my_organizations), mai pel nom.
   Un grup, una persona o un agent amb eixe slug no són l'entitat pilot. */
test('Auditoria 261007 · rutaDeFitxaPublica: una entitat amb un UUID i el slug declarat porta al perfil del pilot; la resta, com sempre', async () => {
  const { rutaDeFitxaPublica } = await import('./PerfilEditor.jsx');
  const { ENTITAT_PILOT_SLUG } = await import('../../data/identitatsSeed.js');
  const { RUTA_PERFIL_PROJECTE } = await import('../../config/navigation.js');
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  /* Onada 8 (261009) · Al perfil pel slug (RUTA_PERFIL_PROJECTE), ja no a /projecte. */
  expect(rutaDeFitxaPublica({ id: uuid, mena: 'empresa', nom: 'Sóc de Poble', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe(RUTA_PERFIL_PROJECTE);
  expect(rutaDeFitxaPublica({ id: uuid, mena: 'empresa', nom: 'Sóc de Poble', dades: { slug: 'forn' } })).toBe(`/empresa/${uuid}`);
  expect(rutaDeFitxaPublica({ id: uuid, mena: 'empresa', nom: 'Sóc de Poble' })).toBe(`/empresa/${uuid}`);
  expect(rutaDeFitxaPublica({ id: 'G', mena: 'grup', nom: 'Colla', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe('/grup/G');
  expect(rutaDeFitxaPublica({ id: 'A', mena: 'agent', nom: 'IAIA', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe('/perfil/A');
  expect(rutaDeFitxaPublica({ ...jo, dades: { id: 'U', slug: ENTITAT_PILOT_SLUG } })).toBe('/gent/U');
  // Sense id, null, també amb el slug.
  expect(rutaDeFitxaPublica({ mena: 'empresa', nom: 'Sóc de Poble', dades: { slug: ENTITAT_PILOT_SLUG } })).toBeNull();
});

/* T41 (ordre del Mestre, 260928) · PUBLICAR i la bola del món obrin el
   selector de visibilitat (DocumentEditor): la fitxa posa el valor triat, no
   el commuta, i no fa cap toast d'èxit. */
test('T41 · triar pública posa is_public=true a la persona, sense toast d’èxit', async () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter).not.toHaveProperty('publish');
  expect(m.adapter).not.toHaveProperty('previewTitle');
  expect(m.adapter).not.toHaveProperty('previewHelp');
  await act(async () => { expect(await m.adapter.visibilitat.onTria(true)).toBe(true); });
  expect(m.guardar).toHaveBeenCalledWith('is_public', true, 'jo');
  expect(m.toast).not.toHaveBeenCalled();
});

test('T41 · triar el mateix que ja hi ha no toca res: no commuta', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(async () => { expect(await m.adapter.visibilitat.onTria(false)).toBe(true); });
  expect(m.guardar).not.toHaveBeenCalled();
  cleanup();
  render(<PerfilEditor identitat={org('admin')} />);
  await act(async () => { await m.adapter.visibilitat.onTria(true); });
  expect(m.guardar).not.toHaveBeenCalled();
});

test('T41 · triar privada en una organització posa «members», i el text ho diu', async () => {
  render(<PerfilEditor identitat={org('admin')} />);
  expect(m.adapter.visibilitat.textos.privada.explicacio).toContain('membres');
  expect(m.adapter.visibilitat.bloqueig).toBeNull();
  await act(async () => { await m.adapter.visibilitat.onTria(false); });
  expect(m.guardar).toHaveBeenCalledWith('visibility', 'members', 'O');
  expect(m.toast).not.toHaveBeenCalled();
});

test('T41 · la fitxa d’un agent sempre és pública: privada bloquejada, amb el motiu, i no toca res', async () => {
  const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };
  render(<PerfilEditor identitat={agent} />);
  expect(m.adapter.visibilitat.bloqueig).toEqual({ opcio: 'privada', motiu: expect.stringMatching(/agent IA sempre és pública/) });
  expect(m.adapter.visibilitat.textos.reversible).toBeNull();
  await act(async () => { await m.adapter.visibilitat.onTria(false); });
  expect(m.guardar).not.toHaveBeenCalled();
  expect(m.toast).not.toHaveBeenCalled();
});

test('T41 · un error del servidor torna al selector (en línia), sense toast', async () => {
  m.guardar.mockRejectedValueOnce(new Error('Sense xarxa'));
  render(<PerfilEditor identitat={jo} />);
  await act(async () => { await expect(m.adapter.visibilitat.onTria(true)).rejects.toThrow('Sense xarxa'); });
  expect(m.toast).not.toHaveBeenCalled();
});

test('un membre sense rol de gestió veu la fitxa en lectura, en text pla', () => {
  render(<PerfilEditor identitat={org('member')} />);
  expect(m.adapter.document).toBeNull();
  expect(m.adapter.emptyDocument).toMatchObject({ title: 'Forn & Cia', subtitle: 'Pa', lead: 'Matí', content: '<p>Cos</p>' });
  expect(m.adapter.emptyDocument.labels).toEqual([{ text: 'Membre' }]);
});

test('D12 · amb una baixa en curs, la persona veu la fitxa en lectura: el servidor la té congelada', () => {
  const enBaixa = { ...jo, dades: { ...jo.dades, full_name: 'Veïna que se n’ha anat', baixa_demanada_at: '2026-09-26T10:00:00Z' } };
  render(<PerfilEditor identitat={enBaixa} />);
  expect(m.adapter.document).toBeNull();
  expect(m.adapter.emptyDocument).toMatchObject({ title: 'Veïna que se n’ha anat' });
  expect(m.adapter.emptyDocument.labels).toEqual([{ text: 'Persona' }, { text: 'Baixa en curs' }]);
});

test('la pujada va a la carpeta de la identitat', async () => {
  m.puja.mockResolvedValue('sdp-media://mitjans/x');
  const { unmount } = render(<PerfilEditor identitat={jo} />);
  await m.adapter.uploadMedia('f1');
  unmount();
  render(<PerfilEditor identitat={org('owner')} />);
  await m.adapter.uploadMedia('f2');
  expect(m.puja.mock.calls).toEqual([['f1', 'avatars'], ['f2', 'organitzacions']]);
});

/* Onada 4 (retallador senzill, ordre del Mestre 261008) · Derogat el botó únic
   de T35: la capçalera té el seu botó, «Capçalera», que diu abans de triar què
   s'admet; la imatge pròpia, el seu («Avatar» o «Logotip»). Una persona sense
   avatar (jo: avatar_url buit) té la ranura de damunt de l'H1. Les vistes no
   van al centre de la fitxa (CONTRACTE-3). */
test('Onada 4 · dos botons separats: «Capçalera» (PNG, JPEG o WebP, fins a 10 MB) i, sense avatar, la ranura «Avatar»', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter).toMatchObject({
    heroEditLabel: 'Capçalera', heroEditHelp: 'PNG, JPEG o WebP, fins a 10 MB.', showLogoUpload: true, logoEditLabel: 'Avatar', ambVistes: false,
  });
  expect(typeof m.adapter.onHeroEdit).toBe('function');
  expect(typeof m.adapter.onLogoEdit).toBe('function');
  expect(m.adapter.onHeroEdit).not.toBe(m.adapter.onLogoEdit);
  expect(m.adapter).not.toHaveProperty('avatarAutor');
});

/* Línia I2 (pla 261008_1201) · Les imatges pugen fora de la closca
   (useImatgeDeFitxa): el Perfil li diu quan n'hi ha una pujant i quin límit
   s'ha de dir abans de triar, a la ranura i davall del botó amb imatge. */
test('Línia I2 · la closca rep la guarda de pujada i el límit: heroPujant, ajudaAmbImatge i, amb la ranura, logoEditHelp i logoPujant', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter).toMatchObject({
    heroPujant: false, ajudaAmbImatge: 'PNG, JPEG o WebP, fins a 10 MB.',
    logoEditHelp: 'PNG, JPEG o WebP, fins a 10 MB.', logoPujant: false,
  });
  cleanup();
  // Una organització que no és la pilot: la ranura del logotip, igual.
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter).toMatchObject({ logoEditLabel: 'Logotip', logoEditHelp: 'PNG, JPEG o WebP, fins a 10 MB.', logoPujant: false, heroPujant: false });
});

/* Línia I2 (pla 261008_1201) · La píndola dels drets diu la llicència TRIADA
   de veres: la que s'acaba de triar o, si no, la del servidor; mai el «© Nom»
   que la fitxa porta de lectura (document.copyright). */
test('Línia I2 · dretsTriats: buit sense llicència desada (encara que la fitxa diga «© Pep»), la del servidor, i la que s’acaba de triar', () => {
  render(<PerfilEditor identitat={joAmbId} />);
  expect(m.adapter.document.copyright).toBe('© Pep');
  expect(m.adapter.dretsTriats).toBe('');
  cleanup();
  // Un valor del servidor que no és text no és cap llicència triada.
  render(<PerfilEditor identitat={ambServidor(null)} />);
  expect(m.adapter.dretsTriats).toBe('');
  cleanup();
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.dretsTriats).toBe('');
  cleanup();
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  expect(m.adapter.dretsTriats).toBe('CC BY 4.0');
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  expect(m.adapter.dretsTriats).toBe('CC0 1.0');
  cleanup();
  // L'esborrany de la cua guanya al servidor també en tornar a obrir la fitxa, com document.copyright.
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  expect(m.adapter.dretsTriats).toBe('CC0 1.0');
  expect(m.adapter.document.copyright).toBe('CC0 1.0');
});

/* Línia I2 (pla 261008_1201) · La lògica pura de la fitxa té una sola font,
   fitxaDePerfil.js (la mateixa de «Les vistes»): el Perfil la torna a
   exportar, no en porta cap còpia. */
test('Línia I2 · rutaDeFitxaPublica, slugDEntitat i ETIQUETA_IA del Perfil són les de fitxaDePerfil.js', async () => {
  const perfil = await import('./PerfilEditor.jsx');
  const fitxa = await import('./fitxaDePerfil.js');
  expect(perfil.rutaDeFitxaPublica).toBe(fitxa.rutaDeFitxaPublica);
  expect(perfil.slugDEntitat).toBe(fitxa.slugDEntitat);
  expect(perfil.ETIQUETA_IA).toBe(fitxa.ETIQUETA_IA);
});

/* Ordre del Mestre (261007, ordre E) · Damunt del nom, el mateix que la fitxa
   pública, i a qui pot editar, el botó per a canviar-ho. */
const ambAvatar = { ...jo, dades: { ...jo.dades, avatar_url: 'https://poble.test/a.webp' } };
const agentAmb = (avatar_url) => ({ id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA', avatar_url } });

/* Els selectors de fitxers amagats de les dues imatges (useImatgeDeFitxa). */
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);

/* Línia I2 (pla 261008_1201) · I les claus de la línia I1: `ajuda` (el límit,
   dit abans de triar) i `pujant` (false en repòs). */
test('Onada 4 · una persona amb avatar: cap ranura; l’avatar redó porta onCanvia, «Avatar», onLleva, «Llevar l’avatar» (CONTRACTE-1), ajuda i pujant', () => {
  render(<PerfilEditor identitat={ambAvatar} />);
  expect(m.adapter.showLogoUpload).toBe(false);
  expect(m.adapter).not.toHaveProperty('onLogoEdit');
  expect(m.adapter).not.toHaveProperty('logoEditHelp');
  expect(m.adapter).not.toHaveProperty('logoPujant');
  expect(m.adapter.avatarAutor).toEqual({
    src: 'https://poble.test/a.webp', alt: 'Avatar de Pep',
    onCanvia: expect.any(Function), etiquetaCanvia: 'Avatar', onLleva: expect.any(Function), etiquetaLleva: 'Llevar l’avatar',
    ajuda: 'PNG, JPEG o WebP, fins a 10 MB.', pujant: false,
  });
  // PageFrame crida onCanvia amb l'esdeveniment del clic: obri el selector de l'avatar, cap diàleg intermedi.
  const clic = vi.spyOn(selector('logoImage'), 'click');
  act(() => m.adapter.avatarAutor.onCanvia({ type: 'click', acaba: 'no' }));
  expect(clic).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Onada 4 · la ranura buida de la persona obri el selector de l’avatar; la capçalera, el seu', () => {
  render(<PerfilEditor identitat={jo} />);
  const avatar = vi.spyOn(selector('logoImage'), 'click');
  const capcalera = vi.spyOn(selector('heroImage'), 'click');
  act(() => m.adapter.onLogoEdit({ acaba: vi.fn() }));
  expect(avatar).toHaveBeenCalledTimes(1);
  expect(capcalera).not.toHaveBeenCalled();
  act(() => m.adapter.onHeroEdit({ acaba: vi.fn() }));
  expect(capcalera).toHaveBeenCalledTimes(1);
  expect(avatar).toHaveBeenCalledTimes(1);
  expect(selector('heroImage').getAttribute('accept')).toBe('image/png,image/jpeg,image/webp');
  expect(screen.queryByRole('dialog', { name: 'Capçalera i avatar' })).toBeNull();
});

test('Onada 4 · un agent IA té l’avatar redó com la persona; sense avatar, la ranura «Avatar»', () => {
  render(<PerfilEditor identitat={agentAmb('/assets/iaia.webp')} />);
  expect(m.adapter.showLogoUpload).toBe(false);
  expect(m.adapter.avatarAutor).toMatchObject({ src: '/assets/iaia.webp', alt: 'Avatar de IAIA', etiquetaCanvia: 'Avatar' });
  cleanup();
  render(<PerfilEditor identitat={agentAmb('')} />);
  expect(m.adapter).toMatchObject({ showLogoUpload: true, logoEditLabel: 'Avatar' });
});

test('Onada 4 · una organització que no és la pilot: la ranura «Logotip», que obri el seu selector i desa logo_url pel camí de sempre', async () => {
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.showLogoUpload).toBe(true);
  expect(m.adapter.logoEditLabel).toBe('Logotip');
  expect(m.adapter).not.toHaveProperty('avatarAutor');
  const clic = vi.spyOn(selector('logoImage'), 'click');
  act(() => m.adapter.onLogoEdit({ acaba: vi.fn() }));
  expect(clic).toHaveBeenCalledTimes(1);
  await act(() => m.adapter.saveRemote('O', 'logoImage', 'sdp-media://mitjans/t/o/organitzacions/logo.webp'));
  expect(m.updateOrganization).toHaveBeenCalledWith('O', { logo_url: 'sdp-media://mitjans/t/o/organitzacions/logo.webp' }, CONFIG);
  expect(m.adapter.document.logoImage).toBe('sdp-media://mitjans/t/o/organitzacions/logo.webp');
});

/* Onada 8 (261009) · La fitxa del pilot és el seu perfil (RUTA_PERFIL_PROJECTE), ja no /projecte. */
test('ordre E · l’entitat pilot (el seu perfil): cap ranura ni avatar; PageFrame hi pinta el logotip de Sóc de Poble', async () => {
  const { ENTITAT_PILOT_ID } = await import('../../data/identitatsSeed.js');
  const { RUTA_PERFIL_PROJECTE } = await import('../../config/navigation.js');
  render(<PerfilEditor identitat={{ ...org('owner'), id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' }} />);
  expect(m.adapter.barAuthorHref).toBe(RUTA_PERFIL_PROJECTE);
  expect(m.adapter.showLogoUpload).toBe(false);
  expect(m.adapter).not.toHaveProperty('avatarAutor');
});

test('ordre E · en lectura, el mateix que la fitxa pública i sense botó: logotip d’una entitat, res per a un grup, avatar sense onCanvia', () => {
  render(<PerfilEditor identitat={{ ...org('member'), avatar: '/assets/forn.webp', dades: { ...org('member').dades, logo_url: '/assets/forn.webp' } }} />);
  expect(m.adapter.emptyDocument.logoEntitat).toEqual({ clar: '/assets/forn.webp', alt: 'Logotip de Forn' });
  expect(m.adapter.emptyDocument).not.toHaveProperty('avatarAutor');
  cleanup();
  render(<PerfilEditor identitat={{ ...org('member'), mena: 'grup', avatar: '/assets/colla.webp' }} />);
  expect(m.adapter.emptyDocument).not.toHaveProperty('logoEntitat');
  cleanup();
  const enBaixa = { ...ambAvatar, dades: { ...ambAvatar.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } };
  render(<PerfilEditor identitat={enBaixa} />);
  expect(m.adapter.emptyDocument.avatarAutor).toEqual({ src: 'https://poble.test/a.webp', alt: 'Avatar de Pep' });
});

test('Onada 4 · «Capçalera» obri directament la finestra de retall 16:9; cancel·lar no puja res ni torna la closca a la imatge', async () => {
  const acaba = vi.fn();
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.onHeroEdit({ acaba }));
  await act(async () => {
    fireEvent.change(selector('heroImage'), { target: { files: [new File(['x'], 'pomes.jpg', { type: 'image/jpeg' })] } });
  });
  const finestra = screen.getByRole('dialog', { name: 'Retalla la capçalera' });
  expect(within(finestra).queryByRole('radio')).toBeNull();
  fireEvent.click(within(finestra).getByRole('button', { name: 'Cancel·lar' }));
  expect(screen.queryByRole('dialog', { name: 'Retalla la capçalera' })).toBeNull();
  expect(acaba).not.toHaveBeenCalled();
  expect(m.puja).not.toHaveBeenCalled();
  expect(m.updateProfile).not.toHaveBeenCalled();
});

test('Onada 4 · una foto de més de 10 MB avisa amb un toast (cap finestra la tapa) i no obri res', async () => {
  render(<PerfilEditor identitat={jo} />);
  const gran = new File(['x'], 'gran.jpg', { type: 'image/jpeg' });
  Object.defineProperty(gran, 'size', { value: 11 * 1024 * 1024 });
  await act(async () => { fireEvent.change(selector('logoImage'), { target: { files: [gran] } }); });
  expect(m.toast).toHaveBeenCalledWith('Esta foto ocupa més de 10 MB. Tria’n una de més lleugera.', 'error');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Onada 4 · «Llevar l’avatar» (avatarAutor.onLleva) confirma abans i buida avatar_url per la via de la fitxa; cancel·lar no toca res', async () => {
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, avatar_url: 'https://poble.test/a.webp' } }} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  act(() => m.adapter.avatarAutor.onLleva());
  let confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
  fireEvent.click(within(confirma).getByRole('button', { name: 'Cancel·lar' }));
  expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull();
  expect(m.updateProfile).not.toHaveBeenCalled();
  act(() => m.adapter.avatarAutor.onLleva());
  confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
  await act(async () => { fireEvent.click(within(confirma).getByRole('button', { name: 'Llevar l’avatar' })); });
  expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
  expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull();
  expect(m.adapter.document.logoImage).toBe('');
});

test('T35 · un membre sense permís no té diàleg ni selectors de fitxers', () => {
  render(<PerfilEditor identitat={org('member')} />);
  expect(document.querySelector('dialog')).toBeNull();
  expect(document.querySelector('input[type="file"]')).toBeNull();
});

test('T35 · una foto pujada (sdp-media://) no arriba crua a la barra taronja', () => {
  render(<PerfilEditor identitat={{ ...jo, avatar: 'sdp-media://mitjans/t/u/avatars/a.webp' }} />);
  expect(m.adapter.barAuthorAvatar).not.toMatch(/sdp-media:/);
});

/* T39 (ordre del Mestre, 260928) · Els drets de la fitxa són els de sèrie de
   les notes noves: en desar el camp 'copyright', també la preferència heretable
   (per l'id de l'actor: la fila de la persona, l'organització), encara que el
   servidor el rebutge. */
const joAmbId = { ...jo, dades: { ...jo.dades, id: 'uuid-pep' } };
afterEach(() => { for (const id of ['uuid-pep', 'jo', 'O', 'A']) desaLlicenciaPerDefecte(id, ''); });

test('T39 · desar els drets de la fitxa desa també els de sèrie de les notes noves', async () => {
  render(<PerfilEditor identitat={joAmbId} />);
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC BY 4.0'));
  expect(m.updateProfile).toHaveBeenCalledWith({ copyright: 'CC BY 4.0' }, CONFIG);
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
  // Mai amb la clau de la vista ('jo'): les notes la busquen per l'id de l'actor.
  expect(llegixLlicenciaPerDefecte('jo')).toBeNull();
});

test('T39 · sense la columna al servidor (PGRST204), la preferència queda igualment', async () => {
  m.updateProfile.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'copyright\' column of \'profiles\' in the schema cache"}'));
  render(<PerfilEditor identitat={joAmbId} />);
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
  expect(m.adapter.avisosCamps.copyright.error.missatge.startsWith(AVIS_SENSE_COLUMNA)).toBe(true);
});

test('T39 · una organització la desa amb el seu id; un agent i qui només llig no en desen cap', async () => {
  render(<PerfilEditor identitat={org('owner')} />);
  await act(() => m.adapter.saveRemote('O', 'copyright', 'CC BY-NC 4.0'));
  expect(llegixLlicenciaPerDefecte('O')).toBe('CC BY-NC 4.0');
  desaLlicenciaPerDefecte('O', '');
  cleanup();
  render(<PerfilEditor identitat={org('member')} />);
  await act(() => m.adapter.saveRemote('O', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('O')).toBeNull();
  cleanup();
  const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };
  render(<PerfilEditor identitat={agent} />);
  await act(() => m.adapter.saveRemote('A', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('A')).toBeNull();
  expect(m.adapter.dretsAutor.ambit).toBe('neutre');
});

test('T39 · la vista de drets diu que la fitxa és la font de l’herència; l’autor és el del «© Nom» de sèrie', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.dretsAutor).toEqual({ ambit: 'perfil', autor: 'Pep' });
  expect(m.adapter.document.copyright).toBe('© Pep');
});

/* T39 (correcció de la revisió, 260928) · La preferència és el mirall de la
   fitxa: l'esborrany que la cua guarda o, sense esborrany, el valor del
   servidor, damunt de qualsevol còpia vella. */
const ambServidor = (copyright) => ({ ...joAmbId, dades: { ...joAmbId.dades, copyright } });
const SENSE_COLUMNA_COPYRIGHT = 'Supabase 400: {"code":"PGRST204","message":"Could not find the \'copyright\' column of \'profiles\' in the schema cache"}';
const accioDeDrets = (text) => m.adapter.avisosCamps.copyright.error.accions.find((accio) => accio.text === text);

test('T39 · en obrir la fitxa, el servidor trepitja la còpia sembrada abans si no hi ha res pendent', () => {
  // Dispositiu B: la primera visita copia «CC BY 4.0».
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
  cleanup();
  // Des del dispositiu A, la fitxa passa a «CC0 1.0»: en tornar a obrir-la a B, la preferència també.
  render(<PerfilEditor identitat={ambServidor('CC0 1.0')} />);
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
});

test('T39 · amb la fitxa oberta, un valor nou del servidor arriba a la preferència; un de buit no l’esborra', () => {
  const { rerender } = render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  rerender(<PerfilEditor identitat={ambServidor('CC BY-SA 4.0')} />);
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY-SA 4.0');
  // Sense la columna, la fila no porta `copyright`: no vol dir que no n'hi haja cap.
  rerender(<PerfilEditor identitat={ambServidor(undefined)} />);
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY-SA 4.0');
});

test('T39 · un desat confirmat no el torna enrere el valor vell que la fitxa encara porta', async () => {
  // La identitat no canvia: és el render en què la cua ja és buida i la fitxa encara no porta el valor confirmat.
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  // Com DocumentEditor: primer l'esborrany (desaLocal), que ja és la preferència, i després el desat.
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  expect(m.updateProfile).toHaveBeenCalledWith({ copyright: 'CC0 1.0' }, CONFIG);
  expect(m.adapter.estatDesament.estat).toBe('net');
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
});

test('T39 · «Tornar al que hi ha desat» sobre els drets rebutjats també torna la preferència: sense valor al servidor, cap', async () => {
  m.updateProfile.mockRejectedValue(new Error(SENSE_COLUMNA_COPYRIGHT));
  render(<PerfilEditor identitat={joAmbId} />);
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
  act(() => accioDeDrets('Tornar al que hi ha desat').onClick());
  expect(m.adapter.document.copyright).toBe('© Pep');
  expect(cuaDesament.llig({ ...m.autodesament, entitat: 'perfil', id: 'jo' }).camps).toEqual({});
  // Les notes noves ja no hereten la CC0 que s'acaba de rebutjar.
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBeNull();
});

test('T39 · l’esborrany rebutjat guanya al servidor també en tornar a obrir la fitxa; renunciar-hi torna al valor del servidor', async () => {
  m.updateProfile.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  cleanup();
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  expect(m.adapter.document.copyright).toBe('CC0 1.0');
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
  act(() => accioDeDrets('Tornar al que hi ha desat').onClick());
  expect(m.adapter.document.copyright).toBe('CC BY 4.0');
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
});

test('T39 · sense cua d’autodesament la fitxa no desa res, i la preferència tampoc', async () => {
  m.autodesament = null;
  render(<PerfilEditor identitat={joAmbId} />);
  await act(async () => { expect(await m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0')).toBe(false); });
  expect(m.updateProfile).not.toHaveBeenCalled();
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBeNull();
});

/* T66 (ordre del Mestre, 260928) · L'emoticona de la fitxa de la persona:
   l'espai central de la barra taronja obri DialegEmoticona (com a les Notes) i
   la tria es desa a profiles.icon per l'autodesament. sdp-pedra-seca §10: en
   edició, sempre un botó. */
const dialegEmoticona = () => screen.getByRole('dialog', { name: 'Emoticona del document' });
async function triaEmoticona(valor) {
  act(() => m.adapter.onObriEmoticona());
  const dialeg = dialegEmoticona();
  fireEvent.change(within(dialeg).getByRole('textbox'), { target: { value: valor } });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar' })); });
}

test('T66 · la persona que edita té el botó d’emoticona: sense tria, el camp cru és buit (la ploma)', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(typeof m.adapter.onObriEmoticona).toBe('function');
  expect(m.adapter.emoticona).toBe('');
  expect(m.adapter.document.icon).toBe('');
  // El diàleg només es munta quan s'obri.
  expect(screen.queryByRole('dialog', { name: 'Emoticona del document' })).toBeNull();
  act(() => m.adapter.onObriEmoticona());
  expect(dialegEmoticona()).toBeTruthy();
});

test('T66 · triar una emoticona la desa a profiles.icon, tanca el diàleg i la barra i la targeta la porten', async () => {
  render(<PerfilEditor identitat={jo} />);
  await triaEmoticona('🌾');
  expect(m.updateProfile).toHaveBeenCalledWith({ icon: '🌾' }, CONFIG);
  expect(screen.queryByRole('dialog', { name: 'Emoticona del document' })).toBeNull();
  expect(m.adapter.emoticona).toBe('🌾');
  expect(m.adapter.document.icon).toBe('🌾');
  expect(m.adapter.estatDesament.estat).toBe('net');
  const { llegixDocumentViu } = await import('../../components/universal/documentViu.js');
  expect(llegixDocumentViu('jo').document.icon).toBe('🌾');
});

test('T66 · «Llevar» buida l’emoticona desada (null a la columna); triar la mateixa no envia res', async () => {
  const ambIcon = { ...jo, dades: { ...jo.dades, icon: '🌾' } };
  render(<PerfilEditor identitat={ambIcon} />);
  expect(m.adapter.emoticona).toBe('🌾');
  await triaEmoticona('🌾');
  expect(m.updateProfile).not.toHaveBeenCalled();
  act(() => m.adapter.onObriEmoticona());
  await act(async () => { fireEvent.click(within(dialegEmoticona()).getByRole('button', { name: 'Llevar' })); });
  expect(m.updateProfile).toHaveBeenCalledWith({ icon: null }, CONFIG);
  expect(m.adapter.emoticona).toBe('');
});

test('T66 · sense la columna al servidor (PGRST204): quarantena, avís en línia «icon» i l’emoticona no es perd', async () => {
  m.updateProfile.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'icon\' column of \'profiles\' in the schema cache"}'));
  render(<PerfilEditor identitat={jo} />);
  await triaEmoticona('🍅');
  expect(m.updateProfile).toHaveBeenCalledTimes(1);
  expect(m.toast).not.toHaveBeenCalled();
  const { missatge, accions } = m.adapter.avisosCamps.icon.error;
  expect(missatge.startsWith(AVIS_SENSE_COLUMNA)).toBe(true);
  expect(missatge).toContain('«icon»');
  expect(accions.map((accio) => accio.text)).toContain('Tornar al que hi ha desat');
  expect(m.adapter.emoticona).toBe('🍅');
  expect(cuaDesament.llig({ ...m.autodesament, entitat: 'perfil', id: 'jo' }).camps.icon).toBe('🍅');
  // Renunciar-hi torna al que té el servidor (res).
  act(() => accions.find((accio) => accio.text === 'Tornar al que hi ha desat').onClick());
  expect(m.adapter.emoticona).toBe('');
  expect(m.adapter.avisosCamps.icon).toBeUndefined();
});

test('T66 · organització, agent, lectura, baixa i fila de reserva: cap botó d’emoticona (cel·la de lectura)', () => {
  const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };
  const enBaixa = { ...jo, dades: { ...jo.dades, icon: '🌾', baixa_demanada_at: '2026-09-26T10:00:00Z' } };
  const reserva = { ...jo, dades: { reserva: true, id: 'jo', full_name: 'Pep' } };
  for (const identitat of [org('owner'), org('member'), agent, enBaixa, reserva]) {
    render(<PerfilEditor identitat={identitat} />);
    expect(m.adapter.onObriEmoticona, identitat.id).toBeNull();
    cleanup();
  }
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.emoticona).toBe('');
  expect(m.adapter.document).not.toHaveProperty('icon');
});

/* T47 (correcció de la revisió C04, 260928) · Un esborrany vell d'un altre
   dispositiu no trepitja en silenci el que s'ha desat després: cada camp porta
   la base (el valor del servidor que la persona tenia davant) i, en obrir la
   fitxa, la cua el compara amb el que el servidor té ara (contracte a la cua). */
test('T47 · C04 · en obrir, la fitxa fa revisar els esborranys amb el servidor; el primer canvi d’un camp porta la base', () => {
  const verifica = vi.spyOn(cuaDesament, 'verifica');
  const encua = vi.spyOn(cuaDesament, 'encua');
  try {
    render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, lema: 'Del Comtat' } }} />);
    const ref = { ...m.autodesament, entitat: 'perfil', id: 'jo' };
    expect(verifica).toHaveBeenCalledWith(expect.objectContaining(ref), expect.objectContaining({ title: 'Pep', lead: 'Del Comtat' }));
    act(() => m.adapter.updateLocal('jo', 'lead', 'Del Mas'));
    act(() => m.adapter.updateLocal('jo', 'lead', 'Del Mas i més'));
    expect(encua.mock.calls[0]).toEqual([expect.objectContaining(ref), 'lead', 'Del Mas', { baseValor: 'Del Comtat' }]);
    expect(encua.mock.calls[1][3]).toBeUndefined();
  } finally {
    verifica.mockRestore();
    encua.mockRestore();
  }
});

test('T47 · C04 · un conflicte ofereix «Conservar el meu», que el torna a enviar damunt del que ara hi ha al servidor', async () => {
  m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Conflicte'), { status: 409 }));
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, lema: 'Del Comtat' } }} />);
  await act(() => m.adapter.saveRemote('jo', 'lead', 'Del Mas'));
  const { missatge, accions } = m.adapter.avisosCamps.lead.error;
  expect(missatge).toBe('Hi ha una versió més nova al servidor. El teu text es guarda en esta pestanya fins que tries o tanques la sessió.');
  expect(accions.map((accio) => accio.text)).toEqual(['Conservar el meu', 'Tornar al que hi ha desat']);
  await act(async () => { accions[0].onClick(); });
  await vi.waitFor(() => expect(m.updateProfile).toHaveBeenCalledTimes(2));
  await act(async () => {});
  expect(m.updateProfile).toHaveBeenLastCalledWith({ lema: 'Del Mas' }, CONFIG);
  expect(m.adapter.avisosCamps.lead).toBeUndefined();
});
