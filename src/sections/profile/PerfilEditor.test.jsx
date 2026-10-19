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
/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · El cercle de
   l'avatar obri ara la finestra de retall amb la imatge que ja hi ha: jsdom no
   té canvas ni xarxa, i la frontera amb el navegador (imatgeCanvas.js) se
   simula. Cap prova d'este fitxer no en llegia res. */
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: vi.fn(async () => new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' })),
}));
import { PerfilEditor, AVIS_SENSE_COLUMNA } from './PerfilEditor.jsx';
import { AvatarDeCapcalera } from '../../components/universal/PageFrame.jsx';
import { AVIS_IMATGE_PUJANT } from './useImatgeDeFitxa.jsx';
import { desaLlicenciaPerDefecte, llegixLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

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
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 800, alcada: 800, tipus: 'image/webp', element: {}, allibera: vi.fn() });
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

/* Pla 261015_1900 (Onada 1.2: «poda de la quarta columna»; deroga l'aside de
   T50, «Llista + dreta si hi cap») · L'editor del Perfil ja no porta la
   targeta fixa a la dreta, per a la persona i per a l'organització, també en
   lectura. Sense aside tampoc hi ha cap avís que dir (avisTargetaViva fora).
   La targeta viva continua a la llista (documentViu, la prova de baix) i a
   «Les vistes».
   Pla 261016 (canvi deliberat) · L'adaptador ja no porta ni la clau
   `targetaViva` (abans, false): la maquinària T50 de DocumentEditor es queda
   sense consumidor i es retira, com la de Notes (precedent P4,
   NotesEditor.test.jsx). PerfilShell.targetaViva.test.jsx continua dient que
   no hi ha cap aside. */
test('Pla 261015 · l’adaptador del Perfil no porta targetaViva ni cap avís de l’aside (també en lectura)', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter).not.toHaveProperty('targetaViva');
  expect(m.adapter).not.toHaveProperty('avisTargetaViva');
  cleanup();
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter).not.toHaveProperty('targetaViva');
  expect(m.adapter).not.toHaveProperty('avisTargetaViva');
  cleanup();
  render(<PerfilEditor identitat={org('member')} />);
  expect(m.adapter.document).toBeNull();
  expect(m.adapter).not.toHaveProperty('targetaViva');
});

/* Directiva de Dignitat Humana (pla 261015_1900, Onada 1.1) · La fitxa d'una
   persona no porta drets d'autor ni categories: l'adaptador hi diu
   ambDrets: false, sense dretsAutor ni dretsTriats, el document sense
   copyright (ni el «© Nom» de reserva, ni el desat) i sense la píndola del rol.
   L'organització i l'agent, com sempre. */
test('Dignitat Humana · la persona: ambDrets false, sense drets ni la píndola del rol; l’organització i l’agent, com sempre', () => {
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, copyright: 'CC BY 4.0' } }} />);
  expect(m.adapter.ambDrets).toBe(false);
  expect(m.adapter).not.toHaveProperty('dretsAutor');
  expect(m.adapter).not.toHaveProperty('dretsTriats');
  expect(m.adapter.document.copyright).toBe('');
  expect(m.adapter.labels).toEqual([]);
  cleanup();
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter).not.toHaveProperty('ambDrets');
  expect(m.adapter.dretsAutor).toEqual({ ambit: 'perfil', autor: 'Forn & Cia' });
  expect(m.adapter.document.copyright).toBe('© Forn & Cia');
  expect(m.adapter.labels).toEqual([{ text: 'Membre' }]);
  cleanup();
  render(<PerfilEditor identitat={{ id: 'iaia', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA', copyright: 'CC0 1.0' } }} />);
  expect(m.adapter).not.toHaveProperty('ambDrets');
  expect(m.adapter.dretsAutor).toEqual({ ambit: 'neutre', autor: 'IAIA' });
  expect(m.adapter.document.copyright).toBe('CC0 1.0');
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
  // Dignitat Humana (261015) · Sense la píndola del rol: només l'estat, que és un avís honest.
  expect(m.adapter.emptyDocument.labels).toEqual([{ text: 'Sense connexió' }]);
  expect(m.adapter.emptyDocument.copyright).toBe('');
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

/* Pla 261018_1605 (Tasca 1, D1; correcció de la revisió) · Un is_public
   absent o null es pinta públic, però el servidor el llig privat: triar
   «pública» l'envia explícit, no es dona per fet. */
test('261018 · amb is_public absent o null, triar pública l’envia explícit', async () => {
  for (const isPublic of [null, undefined]) {
    m.guardar.mockClear();
    const dades = { ...jo.dades, is_public: isPublic };
    if (isPublic === undefined) delete dades.is_public;
    render(<PerfilEditor identitat={{ ...jo, dades }} />);
    expect(m.adapter.document.isPublished).toBe(true);
    await act(async () => { expect(await m.adapter.visibilitat.onTria(true)).toBe(true); });
    expect(m.guardar).toHaveBeenCalledWith('is_public', true, 'jo');
    cleanup();
  }
  // Amb el valor desat explícit i igual, no toca res.
  m.guardar.mockClear();
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, is_public: true } }} />);
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
  // Dignitat Humana (261015) · Sense la píndola del rol ni drets: només l'estat.
  expect(m.adapter.emptyDocument.labels).toEqual([{ text: 'Baixa en curs' }]);
  expect(m.adapter.emptyDocument.copyright).toBe('');
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
   avatar té la ranura de damunt de l'H1. Les vistes no van al centre de la
   fitxa (CONTRACTE-3).
   Gauntlet 261016 (Bloc 3.5.4, verificació; ordre del Mestre: «És
   inadmissible que a la mateixa pantalla es mostre una foto al centre i una
   altra a la dreta») · Proves actualitzades a propòsit. Abans «sense avatar»
   era `jo` (avatar_url buit, però amb la foto de la sessió a
   identitat.avatar), i la ranura buida eixia damunt de l'H1 mentre la barra
   i la targeta pintaven la foto. Ara l'avatar redó beu d'avatarDeLaFitxa: la
   ranura és per a qui no té cap foto (senseFoto), i `jo` té la prova pròpia
   (davall: «sense avatar_url i amb la foto de la sessió»). */
const senseFoto = { ...jo, avatar: null };
/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2: «neteja visual
   total sota l'avatar») · Expectativa actualitzada a propòsit: sense cap foto,
   la persona ja no té la ranura «Avatar» (amb el seu text dels 10 MB): té el
   cercle buit amb la càmera, que obri el selector. La ranura queda per al
   logotip d'una organització. */
test('Onada 4 · dos botons separats: «Capçalera» (PNG, JPEG o WebP, fins a 10 MB) i, sense avatar, el cercle buit «Posa un avatar»', () => {
  render(<PerfilEditor identitat={senseFoto} />);
  expect(m.adapter).toMatchObject({
    heroEditLabel: 'Capçalera', heroEditHelp: 'PNG, JPEG o WebP, fins a 10 MB.', showLogoUpload: false, ambVistes: false,
  });
  expect(typeof m.adapter.onHeroEdit).toBe('function');
  expect(m.adapter).not.toHaveProperty('onLogoEdit');
  expect(m.adapter).not.toHaveProperty('logoEditLabel');
  expect(m.adapter).not.toHaveProperty('avatarAutor');
  /* Encàrrec d'harmonització (261018) · L'avatar redó ja no és avatarAutor sinó
     identitatEdicioAvancada (dins d'«Edició avançada»). Pla 2000 · Ara també
     sense foto: el cercle buit (botoBuit), sense cap píndola ni ajuda.
     Expectativa actualitzada a propòsit (correcció de la revisió, Pla 2000):
     i el text que el cercle anuncia mentre la foto nova puja (textOcupat). */
  expect(avatarRedo()).toEqual({
    src: '', alt: 'Avatar de Pep', onCanvia: expect.any(Function), nomBoto: 'Posa un avatar',
    botoBuit: true, obriFinestra: false, ocupat: false, textOcupat: AVIS_IMATGE_PUJANT,
  });
  expect(m.adapter).toMatchObject({ edicioAvancada: true, logoAlTitol: false, titolEdicioAvancada: 'Edició avançada de la fitxa', resumEdicioAvancada: 'Canvia el teu avatar, afig la teua foto de capçalera i gestiona les dades' });
});

/* Línia I2 (pla 261008_1201) · Les imatges pugen fora de la closca
   (useImatgeDeFitxa): el Perfil li diu quan n'hi ha una pujant i quin límit
   s'ha de dir abans de triar, a la ranura i davall del botó amb imatge.
   Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: la persona ja no
   té ranura (ni logoEditHelp ni logoPujant); el límit de la seua foto el diu
   la finestra de retall. L'organització, com sempre. */
test('Línia I2 · la closca rep la guarda de pujada i el límit: heroPujant, ajudaAmbImatge i, amb la ranura, logoEditHelp i logoPujant', () => {
  render(<PerfilEditor identitat={senseFoto} />);
  expect(m.adapter).toMatchObject({ heroPujant: false, ajudaAmbImatge: 'PNG, JPEG o WebP, fins a 10 MB.' });
  expect(m.adapter).not.toHaveProperty('logoEditHelp');
  expect(m.adapter).not.toHaveProperty('logoPujant');
  cleanup();
  // Una organització que no és la pilot: la ranura del logotip, igual.
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter).toMatchObject({ logoEditLabel: 'Logotip', logoEditHelp: 'PNG, JPEG o WebP, fins a 10 MB.', logoPujant: false, heroPujant: false });
});

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2: «lleva la línia
   dels 10 MB de davall del cercle») · Revisió adversarial · El contracte per
   mena: amb el cercle de l'avatar (persona i agent IA), ajudaNomesEnPujada;
   l'organització, sense (la seua «Capçalera» diu el límit com sempre). */
test('relleu del Pla 2000 · ajudaNomesEnPujada per a la persona i l’agent IA, mai per a l’organització', () => {
  render(<PerfilEditor identitat={senseFoto} />);
  expect(m.adapter).toMatchObject({ ajudaNomesEnPujada: true });
  cleanup();
  render(<PerfilEditor identitat={{ id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } }} />);
  expect(m.adapter).toMatchObject({ ajudaNomesEnPujada: true });
  cleanup();
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter).not.toHaveProperty('ajudaNomesEnPujada');
});

/* Línia I2 (pla 261008_1201) · La píndola dels drets diu la llicència TRIADA
   de veres: la que s'acaba de triar o, si no, la del servidor; mai el «© Nom»
   que la fitxa porta de lectura (document.copyright).
   Directiva de Dignitat Humana (pla 261015_1900) · Ara només l'organització
   (i l'agent) en porten: la persona no té píndola de drets ni cap copyright,
   tampoc amb una llicència desada o un esborrany vell a la cua. */
const orgAmbDrets = (copyright) => ({ ...org('owner'), dades: { ...org('owner').dades, copyright } });
test('Línia I2 · dretsTriats: buit sense llicència desada (encara que la fitxa diga «© Nom»), la del servidor, i la que s’acaba de triar', () => {
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.document.copyright).toBe('© Forn & Cia');
  expect(m.adapter.dretsTriats).toBe('');
  cleanup();
  // Un valor del servidor que no és text no és cap llicència triada.
  render(<PerfilEditor identitat={orgAmbDrets(null)} />);
  expect(m.adapter.dretsTriats).toBe('');
  cleanup();
  render(<PerfilEditor identitat={orgAmbDrets('CC BY 4.0')} />);
  expect(m.adapter.dretsTriats).toBe('CC BY 4.0');
  act(() => m.adapter.updateLocal('O', 'copyright', 'CC0 1.0'));
  expect(m.adapter.dretsTriats).toBe('CC0 1.0');
  cleanup();
  // L'esborrany de la cua guanya al servidor també en tornar a obrir la fitxa, com document.copyright.
  render(<PerfilEditor identitat={orgAmbDrets('CC BY 4.0')} />);
  expect(m.adapter.dretsTriats).toBe('CC0 1.0');
  expect(m.adapter.document.copyright).toBe('CC0 1.0');
  cleanup();
  // La persona: cap clau de drets i cap copyright, ni el desat ni el de l'esborrany.
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  expect(m.adapter).not.toHaveProperty('dretsTriats');
  expect(m.adapter.document.copyright).toBe('');
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  expect(m.adapter.document.copyright).toBe('');
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
/* Pla 261018_1605 (Tasca 3, D6) · Expectativa actualitzada a propòsit: la
   identitat porta la mateixa foto que la fila, com en producció (triaAvatar,
   PerfilContext). Amb una de pròpia a la identitat ('a.webp') i una de fora a
   la fila, ara guanya la pròpia (avatarDeLaFitxa; fitxaDePerfil.test.js). */
const ambAvatar = { ...jo, avatar: 'https://poble.test/a.webp', dades: { ...jo.dades, avatar_url: 'https://poble.test/a.webp' } };
const agentAmb = (avatar_url) => ({ id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA', avatar_url } });

/* Els selectors de fitxers amagats de les dues imatges (useImatgeDeFitxa). */
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);

/* Encàrrec d'harmonització (261018, ordre del Mestre: «fora l'avatar gegant del
   mig») · En edició, l'avatar redó ja no va a avatarAutor (damunt de l'H1): és
   l'element identitatEdicioAvancada, l'AvatarDeCapcalera de PageFrame (el mateix
   component, cap còpia) que la closca pinta dins del desplegable «Edició
   avançada». Les seues props són el descriptor de sempre (CONTRACTE-1). */
const avatarRedo = () => {
  const node = m.adapter.identitatEdicioAvancada;
  expect(node?.type).toBe(AvatarDeCapcalera);
  return node.props;
};

/* Línia I2 (pla 261008_1201) · I les claus de la línia I1: `ajuda` (el límit,
   dit abans de triar) i `pujant` (false en repòs).
   Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · Expectativa
   actualitzada a propòsit: fora les píndoles «Avatar» i «Llevar l’avatar» i
   la línia dels 10 MB de davall del cercle. El cercle sol és el botó
   («Ajusta o canvia l’avatar»), i el clic obri directament la finestra de
   retall amb la imatge que ja hi ha, no el selector de fitxers. */
test('Onada 4 · una persona amb avatar: cap ranura; el cercle sol porta onCanvia i el seu nom, sense píndoles ni ajuda; el clic obri el retall amb la imatge que ja hi ha', async () => {
  render(<PerfilEditor identitat={ambAvatar} />);
  expect(m.adapter.showLogoUpload).toBe(false);
  expect(m.adapter).not.toHaveProperty('onLogoEdit');
  expect(m.adapter).not.toHaveProperty('logoEditHelp');
  expect(m.adapter).not.toHaveProperty('logoPujant');
  /* Encàrrec d'harmonització (261018) · Damunt de l'H1 no queda res (cap
     avatarAutor, logoAlTitol false): l'avatar va a la barra taronja i, amb els
     seus botons, dins d'«Edició avançada» (identitatEdicioAvancada). */
  expect(m.adapter).not.toHaveProperty('avatarAutor');
  expect(m.adapter).toMatchObject({ edicioAvancada: true, logoAlTitol: false, titolEdicioAvancada: 'Edició avançada de la fitxa', resumEdicioAvancada: 'Canvia el teu avatar, afig la teua foto de capçalera i gestiona les dades' });
  expect(avatarRedo()).toEqual({
    src: 'https://poble.test/a.webp', alt: 'Avatar de Pep', onCanvia: expect.any(Function),
    nomBoto: 'Ajusta o canvia l’avatar', botoBuit: true, obriFinestra: true, ocupat: false, textOcupat: AVIS_IMATGE_PUJANT,
  });
  // PageFrame crida onCanvia amb l'esdeveniment del clic: la finestra de retall, amb la imatge de la fitxa; cap selector.
  const clic = vi.spyOn(selector('logoImage'), 'click');
  await act(async () => avatarRedo().onCanvia({ type: 'click', acaba: 'no' }));
  expect(clic).not.toHaveBeenCalled();
  const finestra = screen.getByRole('dialog', { name: 'Retalla la foto' });
  expect(dobles.carregaImatge.mock.calls.map(([font]) => font)).toEqual(['https://poble.test/a.webp']);
  expect(within(finestra).getByRole('button', { name: 'Canviar foto' })).toBeTruthy();
  expect(within(finestra).getByRole('button', { name: 'Llevar avatar' })).toBeTruthy();
  expect(within(finestra).getByRole('button', { name: 'Guardar enquadre' })).toBeTruthy();
  expect(within(finestra).getByText('PNG, JPEG o WebP, fins a 10 MB.')).toBeTruthy();
});

/* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: la ranura buida de
   la persona ja no hi és; el cercle buit fa el que feia ella (el selector). */
test('Onada 4 · el cercle buit de la persona obri el selector de l’avatar; la capçalera, el seu', () => {
  render(<PerfilEditor identitat={senseFoto} />);
  const avatar = vi.spyOn(selector('logoImage'), 'click');
  const capcalera = vi.spyOn(selector('heroImage'), 'click');
  act(() => avatarRedo().onCanvia({ type: 'click' }));
  expect(avatar).toHaveBeenCalledTimes(1);
  expect(capcalera).not.toHaveBeenCalled();
  act(() => m.adapter.onHeroEdit({ acaba: vi.fn() }));
  expect(capcalera).toHaveBeenCalledTimes(1);
  expect(avatar).toHaveBeenCalledTimes(1);
  expect(selector('heroImage').getAttribute('accept')).toBe('image/png,image/jpeg,image/webp');
  expect(screen.queryByRole('dialog', { name: 'Capçalera i avatar' })).toBeNull();
});

/* Gauntlet 261016 (Bloc 3.5.4, verificació; ordre del Mestre) · Una persona
   sense avatar_url (`jo`) que ha entrat amb una foto de la sessió (Google):
   la targeta viva i la barra taronja ja la pintaven (avatarDeLaFitxa →
   identitat.avatar), i damunt de l'H1 hi havia la ranura buida. Ara l'avatar
   redó porta la MATEIXA foto. «Avatar» la canvia; «Llevar l'avatar» no hi és,
   perquè la fitxa no té cap imatge pròpia que llevar (buidar un avatar_url ja
   buit no faria res). */
/* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: sense píndoles
   ni ajuda davall del cercle, i el clic obri la finestra de retall amb la
   foto de la sessió (la que el cercle pinta, ja resolta); dins, «Llevar
   avatar» no hi és: la fitxa no té cap imatge pròpia que llevar. */
test('Bloc 3.5.4 · sense avatar_url i amb la foto de la sessió: l’avatar redó, la barra i la targeta viva porten la mateixa foto, sense ranura ni «Llevar l’avatar»', async () => {
  const { llegixDocumentViu } = await import('../../components/universal/documentViu.js');
  render(<PerfilEditor identitat={jo} />);
  expect(jo.dades.avatar_url).toBeUndefined();
  /* Encàrrec d'harmonització (261018) · L'avatar redó, ara dins d'«Edició
     avançada» (identitatEdicioAvancada); la font continua sent la mateixa. */
  expect(m.adapter).not.toHaveProperty('avatarAutor');
  expect(avatarRedo()).toEqual({
    src: 'a.webp', alt: 'Avatar de Pep', onCanvia: expect.any(Function), nomBoto: 'Ajusta o canvia l’avatar',
    botoBuit: true, obriFinestra: true, ocupat: false, textOcupat: AVIS_IMATGE_PUJANT,
  });
  expect(avatarRedo()).not.toHaveProperty('onLleva');
  expect(m.adapter.showLogoUpload).toBe(false);
  expect(m.adapter).not.toHaveProperty('onLogoEdit');
  // La mateixa foto a les tres superfícies de la pantalla.
  expect(m.adapter.barAuthorAvatar).toBe('a.webp');
  expect(llegixDocumentViu('jo').autor.avatar).toBe('a.webp');
  // El cercle obri la finestra amb la foto de la sessió, ja resolta (resolveAsset); cap selector.
  const clic = vi.spyOn(selector('logoImage'), 'click');
  await act(async () => avatarRedo().onCanvia({ type: 'click' }));
  expect(clic).not.toHaveBeenCalled();
  expect(dobles.carregaImatge.mock.calls.map(([font]) => font)).toEqual(['/a.webp']);
  const finestra = screen.getByRole('dialog', { name: 'Retalla la foto' });
  expect(within(finestra).queryByRole('button', { name: 'Llevar avatar' })).toBeNull();
  expect(within(finestra).getByRole('button', { name: 'Canviar foto' })).toBeTruthy();
  // En lectura (una baixa en curs), la mateixa foto, sense cap botó.
  cleanup();
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } }} />);
  expect(m.adapter.emptyDocument.avatarAutor).toEqual({ src: 'a.webp', alt: 'Avatar de Pep' });
  /* Encàrrec d'harmonització (261018) · En lectura, cap avatar amb botons al desplegable. */
  expect(m.adapter).not.toHaveProperty('identitatEdicioAvancada');
  expect(m.adapter.barAuthorAvatar).toBe('a.webp');
});

/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
   sense poble») · Sense poble desat, Sóc de Poble i Rentonar (per l'id de la
   llavor) porten el seu a la barra taronja i a la targeta viva; una altra
   organització, cap, i el desat sempre mana. */
test('Bloc 3.5.2 · les entitats del Mestre sense poble el porten a la barra i a la targeta viva; una altra, cap', async () => {
  const { llegixDocumentViu } = await import('../../components/universal/documentViu.js');
  const { ENTITAT_PILOT_ID, ENTITAT_RENTONAR_SLUG, POBLE_FUNDACIONAL } = await import('../../data/identitatsSeed.js');
  const casos = [
    [{ ...org('owner'), id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' }, POBLE_FUNDACIONAL],
    [{ ...org('owner'), id: ENTITAT_RENTONAR_SLUG, mena: 'grup', nom: 'Rentonar' }, POBLE_FUNDACIONAL],
    [{ ...org('owner'), id: ENTITAT_RENTONAR_SLUG, mena: 'grup', nom: 'Rentonar', dades: { ...org('owner').dades, town_name: 'Benilloba' } }, 'Benilloba'],
    [org('owner'), ''],
  ];
  for (const [identitat, esperat] of casos) {
    render(<PerfilEditor identitat={identitat} />);
    expect([identitat.id, m.adapter.barAuthorLocation, llegixDocumentViu(identitat.id).autor.poble]).toEqual([identitat.id, esperat, esperat]);
    cleanup();
  }
});

/* Bloc 3.5.4 (verificació) · Amb avatar propi i amb la foto de la sessió alhora, mana el propi a totes. */
/* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: «Llevar avatar»
   ja no és una píndola de davall del cercle, és dins de la finestra de retall. */
test('Bloc 3.5.4 · amb avatar propi, el propi a l’avatar redó, a la barra i a la targeta viva; «Llevar l’avatar» hi és', async () => {
  const { llegixDocumentViu } = await import('../../components/universal/documentViu.js');
  render(<PerfilEditor identitat={{ ...jo, avatar: 'https://poble.test/a.webp', dades: { ...jo.dades, avatar_url: 'https://poble.test/a.webp' } }} />);
  /* Encàrrec d'harmonització (261018) · L'avatar redó, dins d'«Edició avançada». */
  expect(avatarRedo()).toMatchObject({ src: 'https://poble.test/a.webp', nomBoto: 'Ajusta o canvia l’avatar' });
  expect(avatarRedo()).not.toHaveProperty('onLleva');
  await act(async () => avatarRedo().onCanvia({ type: 'click' }));
  expect(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Llevar avatar' })).toBeTruthy();
  expect(m.adapter.barAuthorAvatar).toBe('https://poble.test/a.webp');
  expect(llegixDocumentViu('jo').autor.avatar).toBe('https://poble.test/a.webp');
});

/* Pla 2000 (punt 2: «per ajustar p. ex. la il·lustració de la IAIA MarIA i
   amagar el marc quadrat») · Expectativa actualitzada a propòsit: l'agent,
   com la persona, porta el cercle sol, que obri el retall de la il·lustració
   que ja té; sense avatar, el cercle buit (ja no la ranura «Avatar»). */
test('Onada 4 · un agent IA té l’avatar redó com la persona; sense avatar, el cercle buit', async () => {
  render(<PerfilEditor identitat={agentAmb('/assets/iaia.webp')} />);
  expect(m.adapter.showLogoUpload).toBe(false);
  /* Encàrrec d'harmonització (261018) · Com la persona: l'avatar redó dins
     d'«Edició avançada» i res damunt de l'H1. */
  expect(m.adapter).toMatchObject({ edicioAvancada: true, logoAlTitol: false, titolEdicioAvancada: 'Edició avançada de la fitxa', resumEdicioAvancada: 'Canvia l’avatar, afig la foto de capçalera i gestiona els drets i les dades' });
  expect(avatarRedo()).toMatchObject({ src: '/assets/iaia.webp', alt: 'Avatar de IAIA', nomBoto: 'Ajusta o canvia l’avatar', obriFinestra: true });
  await act(async () => avatarRedo().onCanvia({ type: 'click' }));
  expect(dobles.carregaImatge.mock.calls.map(([font]) => font)).toEqual(['/assets/iaia.webp']);
  expect(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Llevar avatar' })).toBeTruthy();
  cleanup();
  render(<PerfilEditor identitat={agentAmb('')} />);
  expect(m.adapter).toMatchObject({ showLogoUpload: false });
  expect(m.adapter).not.toHaveProperty('logoEditLabel');
  expect(avatarRedo()).toMatchObject({ src: '', nomBoto: 'Posa un avatar', botoBuit: true, obriFinestra: false });
});

test('Onada 4 · una organització que no és la pilot: la ranura «Logotip», que obri el seu selector i desa logo_url pel camí de sempre', async () => {
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.showLogoUpload).toBe(true);
  expect(m.adapter.logoEditLabel).toBe('Logotip');
  expect(m.adapter).not.toHaveProperty('avatarAutor');
  /* Encàrrec d'harmonització (261018) · Una organització no té avatar redó; la
     ranura va dins d'«Edició avançada» i el logotip desat, damunt de l'H1. */
  expect(m.adapter).not.toHaveProperty('identitatEdicioAvancada');
  expect(m.adapter).toMatchObject({ edicioAvancada: true, logoAlTitol: true, titolEdicioAvancada: 'Edició avançada de la fitxa', resumEdicioAvancada: 'Canvia el logotip, afig la foto de capçalera i gestiona els drets i les dades' });
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
  /* Encàrrec d'harmonització (261018) · Tampoc dins d'«Edició avançada». */
  expect(m.adapter).not.toHaveProperty('identitatEdicioAvancada');
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

test('Onada 4 · «Capçalera» obri directament la finestra de retall (quadrada des del Gauntlet 261016); cancel·lar no puja res ni torna la closca a la imatge', async () => {
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

/* Encàrrec d'harmonització (261018) · onLleva ja no ve d'avatarAutor: és la de
   l'avatar redó d'«Edició avançada» (identitatEdicioAvancada). La mateixa.
   Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: «Llevar avatar»
   és dins de la finestra de retall; la confirmació és la de sempre, damunt.
   Cancel·lada, la finestra continua oberta; confirmada, es tanquen totes dues. */
test('Onada 4 · «Llevar avatar» (dins de la finestra de retall) confirma abans i buida avatar_url per la via de la fitxa; cancel·lar no toca res', async () => {
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, avatar_url: 'https://poble.test/a.webp' } }} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => avatarRedo().onCanvia({ type: 'click' }));
  const finestra = () => screen.queryByRole('dialog', { name: 'Retalla la foto' });
  fireEvent.click(within(finestra()).getByRole('button', { name: 'Llevar avatar' }));
  let confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
  fireEvent.click(within(confirma).getByRole('button', { name: 'Cancel·lar' }));
  expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull();
  expect(finestra()).not.toBeNull();
  expect(m.updateProfile).not.toHaveBeenCalled();
  fireEvent.click(within(finestra()).getByRole('button', { name: 'Llevar avatar' }));
  confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
  await act(async () => { fireEvent.click(within(confirma).getByRole('button', { name: 'Llevar l’avatar' })); });
  expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
  expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull();
  expect(finestra()).toBeNull();
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

/* Directiva de Dignitat Humana (pla 261015_1900) · La vista de drets de la
   fitxa ja només la té l'organització: la persona no en porta (ambDrets). */
test('T39 · la vista de drets diu que la fitxa és la font de l’herència; l’autor és el del «© Nom» de sèrie', () => {
  render(<PerfilEditor identitat={org('owner')} />);
  expect(m.adapter.dretsAutor).toEqual({ ambit: 'perfil', autor: 'Forn & Cia' });
  expect(m.adapter.document.copyright).toBe('© Forn & Cia');
  cleanup();
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter).not.toHaveProperty('dretsAutor');
  expect(m.adapter.ambDrets).toBe(false);
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
  /* Pla 261016 (Bloc 3.1; canvi deliberat) · Per a la persona, l'esborrany ja
     no és la preferència (abans esta línia esperava 'CC0 1.0'): la seua fitxa
     ja no en pot crear cap i els drets de sèrie es trien a «El compte». Fins
     al desat, la preferència és la del servidor. L'organització conserva la
     conducta de sempre: la prova següent. */
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  expect(m.updateProfile).toHaveBeenCalledWith({ copyright: 'CC0 1.0' }, CONFIG);
  expect(m.adapter.estatDesament.estat).toBe('net');
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
});

/* Pla 261016 (Bloc 3.1) · La conducta T39 que la persona deixa, sencera per a
   l'organització (la seua fitxa sí que tria drets): l'esborrany és la
   preferència abans del desat, i un desat confirmat no la torna enrere. */
const fornAmbDrets = (copyright) => ({ ...org('owner'), dades: { ...org('owner').dades, copyright } });

test('T39 · per a l’organització, l’esborrany de «Desar autoria» és la preferència, i un desat confirmat no el torna enrere', async () => {
  render(<PerfilEditor identitat={fornAmbDrets('CC BY 4.0')} />);
  expect(llegixLlicenciaPerDefecte('O')).toBe('CC BY 4.0');
  // Com DocumentEditor: primer l'esborrany (desaLocal), que ja és la preferència, i després el desat.
  act(() => m.adapter.updateLocal('O', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('O')).toBe('CC0 1.0');
  await act(() => m.adapter.saveRemote('O', 'copyright', 'CC0 1.0'));
  expect(m.updateOrganization).toHaveBeenCalledWith('O', { copyright: 'CC0 1.0' }, CONFIG);
  expect(m.adapter.estatDesament.estat).toBe('net');
  expect(llegixLlicenciaPerDefecte('O')).toBe('CC0 1.0');
});

test('T39 · «Tornar al que hi ha desat» sobre els drets rebutjats també torna la preferència: sense valor al servidor, cap', async () => {
  m.updateProfile.mockRejectedValue(new Error(SENSE_COLUMNA_COPYRIGHT));
  render(<PerfilEditor identitat={joAmbId} />);
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC0 1.0');
  act(() => accioDeDrets('Tornar al que hi ha desat').onClick());
  // Dignitat Humana (261015) · La fitxa de la persona no pinta drets en cap moment.
  expect(m.adapter.document.copyright).toBe('');
  expect(cuaDesament.llig({ ...m.autodesament, entitat: 'perfil', id: 'jo' }).camps).toEqual({});
  // Les notes noves ja no hereten la CC0 que s'acaba de rebutjar.
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBeNull();
});

/* Pla 261016 (Bloc 3.1; ordre del Mestre: «per a la persona, no copies a la
   preferència un esborrany vell de copyright de la cua») · Canvi deliberat:
   abans, per a la persona, l'esborrany rebutjat guanyava al servidor en
   tornar a obrir la fitxa ('CC0 1.0'). Ara trepitjaria la tria d'«El compte»
   (i, amb una CC0, dedicaria al domini públic cada nota nova): mana el
   servidor. «Tornar al que hi ha desat» continua sent l'eixida de l'esborrany.
   L'organització, com sempre: la prova següent. */
test('T39 · per a la persona, un esborrany vell de drets rebutjat ja no guanya al servidor en tornar a obrir la fitxa; renunciar-hi continua tornant al servidor', async () => {
  m.updateProfile.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  cleanup();
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  // Dignitat Humana (261015) · La fitxa no el pinta; i l'esborrany continua a la cua, amb el seu avís.
  expect(m.adapter.document.copyright).toBe('');
  expect(cuaDesament.llig({ ...m.autodesament, entitat: 'perfil', id: 'jo' }).camps).toHaveProperty('copyright', 'CC0 1.0');
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
  act(() => accioDeDrets('Tornar al que hi ha desat').onClick());
  expect(m.adapter.document.copyright).toBe('');
  expect(llegixLlicenciaPerDefecte('uuid-pep')).toBe('CC BY 4.0');
});

test('T39 · per a l’organització, l’esborrany rebutjat guanya al servidor també en tornar a obrir la fitxa; renunciar-hi torna al valor del servidor', async () => {
  m.updateOrganization.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
  render(<PerfilEditor identitat={fornAmbDrets('CC BY 4.0')} />);
  act(() => m.adapter.updateLocal('O', 'copyright', 'CC0 1.0'));
  await act(() => m.adapter.saveRemote('O', 'copyright', 'CC0 1.0'));
  cleanup();
  render(<PerfilEditor identitat={fornAmbDrets('CC BY 4.0')} />);
  expect(m.adapter.document.copyright).toBe('CC0 1.0');
  expect(llegixLlicenciaPerDefecte('O')).toBe('CC0 1.0');
  act(() => accioDeDrets('Tornar al que hi ha desat').onClick());
  expect(m.adapter.document.copyright).toBe('CC BY 4.0');
  expect(llegixLlicenciaPerDefecte('O')).toBe('CC BY 4.0');
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

/* Directiva de Dignitat Humana (pla 261015_1900) · La fitxa de la persona ja
   no pinta drets, però l'autodesament compara el camp `copyright` amb la DADA
   del servidor (copyrightDeFitxa), no amb el '' que es pinta: un esborrany vell
   de «Desar autoria» no entra en un conflicte fals. */
test('Dignitat Humana · la base del copyright de la persona és la dada del servidor, no el buit que es pinta', () => {
  const verifica = vi.spyOn(cuaDesament, 'verifica');
  const encua = vi.spyOn(cuaDesament, 'encua');
  try {
    render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
    expect(m.adapter.document.copyright).toBe('');
    const ref = { ...m.autodesament, entitat: 'perfil', id: 'jo' };
    expect(verifica).toHaveBeenLastCalledWith(expect.objectContaining(ref), expect.objectContaining({ copyright: 'CC BY 4.0' }));
    act(() => m.adapter.updateLocal('jo', 'copyright', 'CC0 1.0'));
    expect(encua.mock.calls.find(([, camp]) => camp === 'copyright')[3]).toEqual({ baseValor: 'CC BY 4.0' });
    cleanup();
    // Sense llicència desada, la base és el «© Nom» de reserva de sempre (el valor que el servidor «té»).
    render(<PerfilEditor identitat={joAmbId} />);
    expect(verifica).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ copyright: '© Pep' }));
  } finally {
    verifica.mockRestore();
    encua.mockRestore();
  }
});

/* Directiva de Dignitat Humana (pla 261015_1900) · Un esborrany vell de
   drets de la persona en conflicte o en error només es pot deixar anar: res a
   triar a cegues sobre un valor que la fitxa ja no mostra. L'organització
   conserva les seues eixides. */
test('Dignitat Humana · un esborrany vell de drets de la persona en conflicte o en error: només «Tornar al que hi ha desat»', async () => {
  m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Conflicte'), { status: 409 }));
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC0 1.0'));
  expect(accioDeDrets('Tornar al que hi ha desat')).toBeTruthy();
  expect(m.adapter.avisosCamps.copyright.error.accions.map((accio) => accio.text)).toEqual(['Tornar al que hi ha desat']);
  cleanup();
  m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }));
  render(<PerfilEditor identitat={ambServidor('CC BY 4.0')} />);
  await act(() => m.adapter.saveRemote('jo', 'copyright', 'CC BY-SA 4.0'));
  expect(m.adapter.avisosCamps.copyright.error.accions.map((accio) => accio.text)).toEqual(['Tornar al que hi ha desat']);
  cleanup();
  m.updateOrganization.mockRejectedValueOnce(Object.assign(new Error('Conflicte'), { status: 409 }));
  render(<PerfilEditor identitat={orgAmbDrets('CC BY 4.0')} />);
  await act(() => m.adapter.saveRemote('O', 'copyright', 'CC0 1.0'));
  expect(m.adapter.avisosCamps.copyright.error.accions.map((accio) => accio.text)).toEqual(['Conservar el meu', 'Tornar al que hi ha desat']);
});
