import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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

const CONFIG = Object.freeze({ tenantId: 'T' });
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
  const llarga = 'a'.repeat(150);
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'lead', llarga));
  await act(() => m.adapter.saveRemote('jo', 'lead', llarga));
  expect(m.updateProfile).not.toHaveBeenCalled();
  expect(m.toast).not.toHaveBeenCalled();
  expect(m.adapter.document.lead).toBe(llarga);
  const { error, comptador } = m.adapter.avisosCamps.lead;
  expect(comptador).toEqual({ llargaria: 150, maxim: 120 });
  // El text de l'alerta (role=alert) no porta la xifra viva: la porta el comptador.
  /* T47 (correcció de la revisió C01, 260928) · Eixir l'esborra (després d'avisar): el text ho diu. */
  expect(error.missatge).toBe('Com a màxim 120 caràcters. El text es guarda en esta pestanya fins que l’escurces o tanques la sessió.');
  expect(error.accions.map((accio) => accio.text)).toEqual(['Retallar a 120', 'Tornar al que hi ha desat']);
  await act(async () => { error.accions[0].onClick(); });
  expect(m.updateProfile).toHaveBeenCalledWith({ lema: 'a'.repeat(120) }, CONFIG);
  expect(m.adapter.document.lead).toBe('a'.repeat(120));
  expect(m.adapter.avisosCamps.lead.error).toBeUndefined();
  expect(m.adapter.estatDesament.estat).toBe('net');
});

test('T47 · «Tornar al que hi ha desat» renuncia a l’esborrany i la fitxa torna al valor del servidor', () => {
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, lema: 'Del Comtat' } }} />);
  act(() => m.adapter.updateLocal('jo', 'lead', 'b'.repeat(130)));
  expect(m.adapter.avisosCamps.lead.comptador).toEqual({ llargaria: 130, maxim: 120 });
  expect(m.adapter.avisosCamps.lead.error.missatge).toContain('Com a màxim 120 caràcters.');
  act(() => m.adapter.avisosCamps.lead.error.accions[1].onClick());
  expect(m.adapter.document.lead).toBe('Del Comtat');
  expect(m.adapter.avisosCamps.lead).toBeUndefined();
  expect(cuaDesament.llig({ ...m.autodesament, entitat: 'perfil', id: 'jo' }).camps).toEqual({});
  expect(m.updateProfile).not.toHaveBeenCalled();
});

test('T47 · mentre s’escriu per damunt del límit, el text de l’alerta no canvia a cada tecla: la xifra va al comptador', () => {
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'lead', 'd'.repeat(121)));
  const primer = m.adapter.avisosCamps.lead.error.missatge;
  act(() => m.adapter.updateLocal('jo', 'lead', 'd'.repeat(122)));
  expect(m.adapter.avisosCamps.lead.error.missatge).toBe(primer);
  expect(m.adapter.avisosCamps.lead.comptador).toEqual({ llargaria: 122, maxim: 120 });
});

test('T47 · el cos massa llarg també porta la xifra viva al comptador, fora de l’alerta', () => {
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'content', `<p>${'e'.repeat(20000)}</p>`));
  const { error, comptador } = m.adapter.avisosCamps.content;
  expect(error.missatge).toMatch(/^Com a màxim \d+ caràcters\. El text es guarda/);
  expect(comptador.llargaria).toBeGreaterThan(comptador.maxim);
});

test('T47 · el comptador apareix a partir del 80 % del límit', () => {
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.updateLocal('jo', 'lead', 'c'.repeat(95)));
  expect(m.adapter.avisosCamps.lead).toBeUndefined();
  act(() => m.adapter.updateLocal('jo', 'lead', 'c'.repeat(96)));
  expect(m.adapter.avisosCamps.lead).toEqual({ comptador: { llargaria: 96, maxim: 120 } });
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

test('la fitxa d’una entitat porta el poble de la persona: list_my_organizations no el du', () => {
  m.identitats = [jo, org('owner')];
  render(<PerfilEditor identitat={org('owner')} />);
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

test('T35 · la fitxa demana un sol botó «Editar capçalera i avatar» i amaga el logotip damunt del nom', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter).toMatchObject({ heroEditLabel: 'Editar capçalera i avatar', showLogoUpload: false });
  expect(typeof m.adapter.onHeroEdit).toBe('function');
});

test('T35 · el botó obri el diàleg; cancel·lar no torna la closca a la imatge', () => {
  const acaba = vi.fn();
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.onHeroEdit({ acaba }));
  expect(screen.getByRole('dialog', { name: 'Capçalera i avatar' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));
  expect(acaba).not.toHaveBeenCalled();
});

test('T35 · «Llevar l’avatar» buida avatar_url per la via de la fitxa i torna la closca a la imatge', async () => {
  const acaba = vi.fn();
  render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, avatar_url: 'https://poble.test/a.webp' } }} />);
  act(() => m.adapter.onHeroEdit({ acaba }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Llevar l’avatar' })); });
  expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
  expect(acaba).toHaveBeenCalledTimes(1);
});

test('T35 · un membre sense permís no té diàleg', () => {
  render(<PerfilEditor identitat={org('member')} />);
  expect(document.querySelector('dialog')).toBeNull();
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
