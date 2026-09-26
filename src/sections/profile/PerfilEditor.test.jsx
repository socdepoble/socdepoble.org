import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ adapter: null, guardar: vi.fn(), puja: vi.fn(), toast: vi.fn(), recarrega: vi.fn(), identitats: [] }));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { m.adapter = adapter; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => ({ guardarCampPerfil: m.guardar, pujaMitja: m.puja, recarrega: m.recarrega, identitats: m.identitats }) }));
vi.mock('./SelectorIdentitat.jsx', () => ({ SelectorIdentitat: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
import { PerfilEditor, AVIS_SENSE_COLUMNA } from './PerfilEditor.jsx';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', avatar: 'a.webp', dades: { full_name: 'Pep', is_public: false, town_name: 'La Torre' } };
const org = (role, visibility = 'public') => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', dades: { name: 'Forn & Cia', description: 'Pa', lema: 'Matí', presentacio_html: '<p>Cos</p>', visibility, role } });

beforeEach(() => {
  m.adapter = null; m.guardar.mockReset().mockResolvedValue(undefined); m.puja.mockReset(); m.toast.mockReset();
  m.recarrega.mockReset(); m.identitats = [];
});
afterEach(cleanup);

test('D13 · les eines van davall de l’entradilla, sense llavor, i porta el selector d’identitat', () => {
  render(<PerfilEditor identitat={jo} />);
  expect(m.adapter.posicioEines).toBe('davall-entradilla');
  // Null explícit: sense la clau, DocumentEditor hi posaria la llavor de Notes.
  expect(m.adapter).toHaveProperty('seedContent', null);
  expect(m.adapter.identityActions).toBeTruthy();
  expect(m.adapter.document).toMatchObject({ id: 'jo', title: 'Pep', isPublished: false });
  expect(m.adapter).toMatchObject({ barAuthorName: 'Pep', barAuthorLocation: 'La Torre', barAuthorAvatar: 'a.webp' });
});

test('el títol es desa com a text pla a full_name', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', '<strong>Pep</strong> &amp; Maria'));
  expect(m.guardar).toHaveBeenCalledWith('full_name', 'Pep & Maria', 'jo');
});

test('el cos es desa a presentacio_html, sanejat', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'content', '<p>x</p><script>1</script>'));
  expect(m.guardar).toHaveBeenCalledWith('presentacio_html', '<p>x</p>', 'jo');
});

test('un títol buit no arriba al servidor i ho diu', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', ''));
  expect(m.guardar).not.toHaveBeenCalled();
  expect(m.toast).toHaveBeenCalledWith('El nom no pot quedar buit.', 'error');
});

test('una columna que encara no existix avisa clar, una sola vegada, i no torna a insistir', async () => {
  m.guardar.mockRejectedValue(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'lema\' column of \'profiles\' in the schema cache"}'));
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'lead', 'Del Mas'));
  await act(() => m.adapter.saveRemote('jo', 'lead', 'Del Mas i més'));
  expect(m.toast).toHaveBeenCalledTimes(1);
  expect(m.toast).toHaveBeenCalledWith(AVIS_SENSE_COLUMNA, 'error');
  expect(m.toast.mock.calls[0][0]).toContain('encara no té columna');
  expect(m.guardar).toHaveBeenCalledTimes(1);
});

test('42703 també es llig com a columna absent; un altre error passa tal qual', async () => {
  m.guardar.mockRejectedValueOnce(new Error('Supabase 400: {"code":"42703","message":"column profiles.hero_url does not exist"}'));
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'heroImage', 'https://poble.test/h.webp'));
  expect(m.toast).toHaveBeenLastCalledWith(AVIS_SENSE_COLUMNA, 'error');
  m.guardar.mockRejectedValueOnce(new Error('Sense xarxa'));
  await act(() => m.adapter.saveRemote('jo', 'subtitle', 'Llaurador'));
  expect(m.toast).toHaveBeenLastCalledWith('Sense xarxa', 'error');
});

test('un AbortError (sessió canviada) no molesta', async () => {
  m.guardar.mockRejectedValue(new DOMException('canvi', 'AbortError'));
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', 'Pere'));
  expect(m.guardar).toHaveBeenCalledTimes(1);
  expect(m.toast).not.toHaveBeenCalled();
});

test('un blur sense canvis no desa res: ni el nom ni una descripció de diversos paràgrafs', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.saveRemote('jo', 'title', m.adapter.document.title));
  await act(() => m.adapter.saveRemote('jo', 'lead', ''));
  expect(m.guardar).not.toHaveBeenCalled();
  cleanup();
  const ambSalts = { ...org('owner'), dades: { ...org('owner').dades, description: 'Pa de llenya.\nCada matí.' } };
  render(<PerfilEditor identitat={ambSalts} />);
  // El que torna la closca en eixir de l'H2 sense tocar-lo: el mateix HTML que s'hi va pintar.
  await act(() => m.adapter.saveRemote('O', 'subtitle', m.adapter.document.subtitle));
  expect(m.guardar).not.toHaveBeenCalled();
  await act(() => m.adapter.saveRemote('O', 'subtitle', 'Pa de llenya i coca.'));
  expect(m.guardar).toHaveBeenCalledWith('description', 'Pa de llenya i coca.', 'O');
});

test('un nom buit al servidor no es desa amb el de reserva només per entrar i eixir', async () => {
  const senseNom = { ...jo, nom: 'El meu compte', dades: { ...jo.dades, full_name: '' } };
  render(<PerfilEditor identitat={senseNom} />);
  await act(() => m.adapter.saveRemote('jo', 'title', m.adapter.document.title));
  expect(m.guardar).not.toHaveBeenCalled();
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

test('publicar commuta is_public per a la persona', async () => {
  render(<PerfilEditor identitat={jo} />);
  await act(() => m.adapter.publish());
  expect(m.guardar).toHaveBeenCalledWith('is_public', true, 'jo');
  expect(m.toast).toHaveBeenCalledWith('La fitxa ara és pública.', 'success');
});

test('publicar una organització pública la passa a «members»', async () => {
  render(<PerfilEditor identitat={org('admin')} />);
  await act(() => m.adapter.publish());
  expect(m.guardar).toHaveBeenCalledWith('visibility', 'members', 'O');
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
