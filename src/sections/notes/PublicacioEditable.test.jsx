/**
 * P0-25 / IDEA-96 (Onada R6, Bloc 1; ordre del Mestre) · Una publicació pròpia
 * del Mur o de l'agenda oberta al Bloc s'edita viva a l'editor de notes, i
 * «Actualitzar al Mur» reescriu la MATEIXA fila (cap duplicat). L'editor és un
 * doble: ací es prova el contracte del context que PublicacioEditable li dona.
 */
import { useContext } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NotesContext } from './objectesDeContext.js';

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams('nota=publicacio:mur:x'), setParams: null, showToast: null, setRevision: null, vist: { ctx: null, nota: null }
}));
vi.mock('./NotesContext.jsx', async () => {
  const { NotesContext: Context } = await import('./objectesDeContext.js');
  return {
    useNotes: () => useContext(Context),
    ValorDeNotes: ({ value, children }) => <Context.Provider value={value}>{children}</Context.Provider>
  };
});
vi.mock('./NotesEditor.jsx', async () => {
  const { NotesContext: Context } = await import('./objectesDeContext.js');
  return {
    default: function DobleEditor({ activeNote }) {
      mocks.vist.ctx = useContext(Context);
      mocks.vist.nota = activeNote;
      return <p data-testid="editor">{activeNote?.content}</p>;
    }
  };
});
vi.mock('./GlobalSaveManager.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, bgSaveManager: { ...real.bgSaveManager, setRevision: (...args) => mocks.setRevision(...args) } };
});
vi.mock('../../app/contexts/RouterContext', () => ({
  useSearchParams: () => [mocks.params, mocks.setParams],
  useNavigate: () => () => {}
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
/* D-R6-1 (Bloc 3) · Qui signa i si és superadmin (la guarda dels actes). */
const sessio = vi.hoisted(() => ({ actor: { id: 'persona-1', tipus: 'persona' }, esSuperadmin: false }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({ useIdentitatOReserva: () => ({ actor: sessio.actor }) }));
vi.mock('../../hooks/useSuperadminEstable.js', () => ({ useSuperadminEstable: () => ({ esSuperadmin: sessio.esSuperadmin, rolPendent: false }) }));

import { PublicacioDetall } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { campsDeLaRevisio, cosDeLaPublicacio, esFilaActualitzable, esPublicacioEditable, esRevisioEditorial, motiuPublicacioDAltri } from './publicacioEditable.js';
import { motiuSignaturaDAltri } from './signaturaDAltri.js';
import { ErrorPublicacio } from './visibilitatNota.js';
import { ErrorIdentitatDeLectura } from '../../app/contexts/identitatDeReserva.js';
import { _reiniciaRevisionsEditorialsPerAProves, revisaElement, revisioEditorial } from '../../data/revisionsEditorials.js';
import { cosDeLArticle } from '../mur/articles/cosCanonic.js';
import { MANIFEST_DE_POBLE_HTML } from '../mur/articles/manifestDePobleContent.js';
import { APLEC_2023_HTML } from '../mur/articles/aplec2023Content.js';

const UUID_FILA = '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b';
const FILA_MUR = {
  id: UUID_FILA, title: 'Festa de la Torre', post_subtitle: 'Cada agost', entradilla: 'La festa del poble.',
  content: '<h3>Programa</h3><p>Missa i ball.</p>', image_url: '/assets/mur/festa.webp', author_entity_id: 'socdepoble'
};
const MANIFEST = { id: 'manifest-de-poble', title: 'Manifest de Poble', entradilla: 'Les associacions…', content: 'Un document obert.\n\nPer als pobles menuts.' };
const APLEC = { id: 'aplec-2023', title: '2n Aplec pel Territori', subtitle: 'Nou Aplec', content: APLEC_2023_HTML, author_name: 'Sóc de Poble' };
const APLEC_DALTRI = { ...APLEC, author_org_id: 'rentonar', author_name: 'El Rentonar' };
const MANIFEST_DALTRI = { ...MANIFEST, author_org_id: 'rentonar', author_name: 'El Rentonar' };
const TEXT_PLA = { id: 'una-crida', title: 'Una crida', content: 'Un document obert.\n\nPer als pobles menuts.' };

let base;
beforeEach(() => {
  _reiniciaRevisionsEditorialsPerAProves();
  sessio.actor = { id: 'persona-1', tipus: 'persona' };
  sessio.esSuperadmin = false;
  mocks.setParams = vi.fn();
  mocks.showToast = vi.fn();
  mocks.setRevision = vi.fn();
  mocks.vist = { ctx: null, nota: null };
  base = {
    config: { dataMode: 'remote' }, scopeKey: 'ambit', t: (_clau, reserva) => reserva, notes: [],
    setLocalNoteField: vi.fn(), saveNoteField: vi.fn(), compartirNota: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: true,
    creaNota: vi.fn(async (input) => ({ ...input, revision: 0 })),
    updateNote: vi.fn(async (id, canvis, revisio) => ({ id, ...canvis, revision: revisio + 1 })),
    publishNote: vi.fn(async () => true),
    rebuigDePublicacio: vi.fn(() => null)
  };
});
afterEach(cleanup);

const pinta = (element, seccio = 'mur') => render(
  <NotesContext.Provider value={base}><PublicacioDetall item={publicacioComANota(element, seccio)} /></NotesContext.Provider>
);

describe('les peces pures', () => {
  test('només el Mur i l’agenda s’editen; mai el Mercat, la Multimèdia ni una pàgina del sistema', () => {
    expect(esPublicacioEditable(publicacioComANota(FILA_MUR, 'mur'))).toBe(true);
    expect(esPublicacioEditable(publicacioComANota({ id: 'aplec-2023', title: 'Aplec' }, 'events'))).toBe(true);
    expect(esPublicacioEditable(publicacioComANota({ id: 'samarreta', title: 'S' }, 'mercat'))).toBe(false);
    expect(esPublicacioEditable(publicacioComANota({ id: 'foto', title: 'F', src: '/f.jpg' }, 'multimedia'))).toBe(false);
    expect(esPublicacioEditable(publicacioComANota({ id: 'xat', title: 'X', isSystem: true }, 'mur'))).toBe(false);
  });

  test('el cos: l’HTML de `content` tal qual, un text pla en paràgrafs escapats i, buit, la descripció', () => {
    expect(cosDeLaPublicacio(FILA_MUR)).toBe('<h3>Programa</h3><p>Missa i ball.</p>');
    expect(cosDeLaPublicacio(TEXT_PLA)).toBe('<p>Un document obert.</p><p>Per als pobles menuts.</p>');
    expect(cosDeLaPublicacio({ content: 'a < b' })).toBe('<p>a &lt; b</p>');
    expect(cosDeLaPublicacio({ content: '', description: 'Resum' })).toBe('<p>Resum</p>');
    expect(cosDeLaPublicacio({})).toBe('');
  });

  test('D2 · la llavor amb text pla (l’app_content vell) obri el canònic, com la vista pública; amb HTML, el seu', () => {
    expect(cosDeLaPublicacio(MANIFEST)).toBe(MANIFEST_DE_POBLE_HTML);
    expect(cosDeLaPublicacio(MANIFEST)).toBe(cosDeLArticle(MANIFEST, MANIFEST_DE_POBLE_HTML));
    expect(cosDeLaPublicacio({ ...MANIFEST, content: '<p>Revisat</p>' })).toBe('<p>Revisat</p>');
    expect(cosDeLaPublicacio({ id: 'aplec-2023', content: '' })).toBe(APLEC_2023_HTML);
  });

  test('la revisió editorial: la llavor del Mur sense UUID i els actes; només els camps canviats', () => {
    expect(esRevisioEditorial(publicacioComANota(MANIFEST, 'mur'))).toBe(true);
    expect(esRevisioEditorial(publicacioComANota(APLEC, 'events'))).toBe(true);
    expect(esRevisioEditorial(publicacioComANota(FILA_MUR, 'mur'))).toBe(false);
    expect(esRevisioEditorial(publicacioComANota({ ...MANIFEST, isSystem: true }, 'mur'))).toBe(false);
    expect(campsDeLaRevisio({ title: 'A', content: '<p>x</p>', tags: ['a'] }, { title: 'A', content: '<p>y</p>', tags: ['a'] })).toEqual({ content: '<p>y</p>' });
  });

  test('només una fila del Mur amb id de servidor s’actualitza', () => {
    expect(esFilaActualitzable(publicacioComANota(FILA_MUR, 'mur'))).toBe(true);
    expect(esFilaActualitzable(publicacioComANota(MANIFEST, 'mur'))).toBe(false);
    expect(esFilaActualitzable(publicacioComANota({ ...FILA_MUR }, 'events'))).toBe(false);
  });

  /* D-B4-1 (Bloc 4; decisió de MarIA) · Una sola guarda per al Mur i l'agenda. */
  test('D-B4-1 · Mur i agenda × superadmin i ordinari: la peça d’altri, només la revisa el superadmin', () => {
    const actor = { id: 'persona-1', tipus: 'persona' };
    for (const [element, seccio] of [[APLEC_DALTRI, 'events'], [MANIFEST_DALTRI, 'mur']]) {
      const alie = publicacioComANota(element, seccio);
      expect(motiuPublicacioDAltri(alie, { actor }), seccio).toContain('El Rentonar');
      expect(motiuPublicacioDAltri(alie, { actor, esSuperadmin: true }), seccio).toBeNull();
      expect(motiuPublicacioDAltri(alie, { actor: null }), seccio).toBeNull();
      expect(motiuPublicacioDAltri(publicacioComANota({ ...element, author_user_id: 'persona-1', author_org_id: null }, seccio), { actor }), seccio).toBeNull();
    }
    expect(motiuPublicacioDAltri(publicacioComANota(APLEC, 'events'), { actor })).toBeNull();
    // El Mercat no s'edita ací: la seua guarda és la de publishNote.
    expect(motiuPublicacioDAltri(publicacioComANota({ ...FILA_MUR, author_entity_id: 'rentonar' }, 'mercat'), { actor })).toBeNull();
    // La pura compartida: un acte amb només `organizer` ja no diu «signant desconegut».
    expect(motiuSignaturaDAltri({ id: 'x', author_org_id: 'rentonar', organizer: 'La Colla' }, { actor })).toContain('La Colla');
    expect(motiuSignaturaDAltri({ id: 'x', author_org_id: 'rentonar', author_name: 42 }, { actor })).not.toContain('42');
    expect(motiuSignaturaDAltri(null, { actor })).toBeNull();
    expect(motiuSignaturaDAltri('no és cap peça', { actor })).toBeNull();
    expect(motiuSignaturaDAltri({ id: 'x', author_org_id: 'rentonar' }, { actor, esSuperadmin: 'true' })).toContain('signa');
  });
});

describe('PublicacioDetall · una publicació pròpia del Mur s’obri a l’editor', () => {
  test('l’editor rep la nota viva de la publicació, sense peu ni Cards «Ja publicat al Mur»', () => {
    const { container } = pinta(FILA_MUR);
    expect(screen.getByTestId('editor').textContent).toBe(FILA_MUR.content);
    expect(mocks.vist.nota).toMatchObject({
      id: `publicacio:mur:${UUID_FILA}`, title: 'Festa de la Torre', subtitle: 'Cada agost', lead: 'La festa del poble.',
      heroImage: '/assets/mur/festa.webp', coverImage: '/assets/mur/festa.webp', isPublished: true,
      publishedSubmissionId: UUID_FILA, folderId: 'f-mur', contentLoaded: true
    });
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
    expect(screen.queryByRole('region', { name: /Ja publicat/ })).toBeNull();
    /* Cap esborrat, cap moviment, cap «Compartir» sobre una nota que no existix. */
    expect(mocks.vist.ctx).toMatchObject({ potEsborrar: false, mouNota: undefined, esborraNota: undefined, compartirNota: null });
  });

  test('escriure no toca cap nota del servidor: l’esborrany viu en memòria i torna a l’editor', () => {
    pinta(FILA_MUR);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>Nou programa.</p>'); });
    act(() => { void mocks.vist.ctx.saveNoteField(mocks.vist.nota.id, 'heroImage', '/assets/mur/nova.webp'); });
    expect(mocks.vist.nota.content).toBe('<p>Nou programa.</p>');
    expect(mocks.vist.nota.coverImage).toBe('/assets/mur/nova.webp');
    expect(base.setLocalNoteField).not.toHaveBeenCalled();
    expect(base.saveNoteField).not.toHaveBeenCalled();
    expect(base.creaNota).not.toHaveBeenCalled();
  });

  test('«Actualitzar al Mur» adopta la publicació en una nota lligada i reescriu la MATEIXA fila', async () => {
    pinta(FILA_MUR);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'title', 'Festa major'); });
    const doc = mocks.vist.nota;
    await act(async () => { await expect(mocks.vist.ctx.publishNote(doc)).resolves.toBe(true); });
    expect(base.creaNota).toHaveBeenCalledTimes(1);
    const creada = base.creaNota.mock.calls[0][0];
    expect(creada.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(creada).toMatchObject({ title: 'Festa major', content: FILA_MUR.content, folderId: 'f-mur' });
    expect(base.updateNote).toHaveBeenCalledWith(creada.id, expect.objectContaining({
      publishedSubmissionId: UUID_FILA, isPublished: true, subtitle: 'Cada agost', lead: 'La festa del poble.'
    }), 0);
    expect(mocks.setRevision).toHaveBeenCalledWith('ambit', creada.id, 1);
    expect(base.publishNote).toHaveBeenCalledWith(expect.objectContaining({
      id: creada.id, revision: 1, publishedSubmissionId: UUID_FILA, isPublished: true, title: 'Festa major'
    }));
    const [nous, opcions] = mocks.setParams.mock.calls[0];
    expect(nous.get('nota')).toBe(creada.id);
    expect(opcions).toEqual({ replace: true });
  });

  test('un reintent no crea cap segona nota', async () => {
    base.publishNote.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    pinta(FILA_MUR);
    await act(async () => { await mocks.vist.ctx.publishNote(mocks.vist.nota); });
    await act(async () => { await mocks.vist.ctx.publishNote(mocks.vist.nota); });
    expect(base.creaNota).toHaveBeenCalledTimes(1);
    expect(base.updateNote).toHaveBeenCalledTimes(1);
    const ids = base.publishNote.mock.calls.map(([nota]) => [nota.id, nota.publishedSubmissionId]);
    expect(ids[0]).toEqual(ids[1]);
  });

  test('el Manifest (llavor, sense UUID): «Actualitzar al Mur» desa una revisió i el Mur i la pàgina la pinten', async () => {
    pinta(MANIFEST);
    expect(mocks.vist.nota.content).toBe(MANIFEST_DE_POBLE_HTML);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>Manifest revisat.</p>'); });
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'lead', 'Entradilla nova'); });
    await act(async () => { await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true); });
    expect(revisioEditorial('mur', 'manifest-de-poble')).toEqual({ content: '<p>Manifest revisat.</p>', lead: 'Entradilla nova' });
    expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('Revisió desada'), 'success');
    expect(base.rebuigDePublicacio).toHaveBeenCalledWith(expect.objectContaining({ publishedSubmissionId: 'manifest-de-poble' }), { seccio: false, esSuperadmin: false });
    expect(base.creaNota).not.toHaveBeenCalled();
    expect(base.updateNote).not.toHaveBeenCalled();
    expect(base.publishNote).not.toHaveBeenCalled();
    /* El lector: el Mur (revisaLlista/revisaElement) i la ruta dedicada (cosDeLArticle). */
    const revisat = revisaElement('mur', MANIFEST);
    expect(revisat).toMatchObject({ content: '<p>Manifest revisat.</p>', entradilla: 'Entradilla nova', title: 'Manifest de Poble' });
    expect(cosDeLArticle(revisat, MANIFEST_DE_POBLE_HTML)).toBe('<p>Manifest revisat.</p>');
  });

  test('també en seed o local: la revisió es desa al navegador i no passa pel publishNote de proves', async () => {
    base.config = { dataMode: 'seed' };
    pinta(MANIFEST);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'title', 'Manifest de Poble (2026)'); });
    await act(async () => { await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true); });
    expect(revisioEditorial('mur', 'manifest-de-poble')).toEqual({ title: 'Manifest de Poble (2026)' });
    expect(base.publishNote).not.toHaveBeenCalled();
  });

  test('l’Aplec 2023 (agenda): «Actualitzar al Mur» desa la revisió de l’acte i /events la pinta', async () => {
    pinta(APLEC, 'events');
    expect(mocks.vist.nota.folderId).toBe('f-events');
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'subtitle', 'Benillup, 2023'); });
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>Crònica revisada.</p>'); });
    await act(async () => { await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true); });
    expect(revisioEditorial('events', 'aplec-2023')).toEqual({ subtitle: 'Benillup, 2023', content: '<p>Crònica revisada.</p>' });
    expect(revisioEditorial('mur', 'aplec-2023')).toBeNull();
    const revisat = revisaElement('events', APLEC);
    expect(revisat).toMatchObject({ subtitle: 'Benillup, 2023', content: '<p>Crònica revisada.</p>' });
    expect(cosDeLArticle(revisat, APLEC_2023_HTML)).toBe('<p>Crònica revisada.</p>');
    expect(base.creaNota).not.toHaveBeenCalled();
  });

  test('sense cap canvi, res desat i «Actualitzar» no falla', async () => {
    pinta(APLEC, 'events');
    await act(async () => { await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true); });
    expect(revisioEditorial('events', 'aplec-2023')).toBeNull();
  });

  test('una revisió signada per una altra identitat no es desa (la guarda de publishNote)', async () => {
    base.rebuigDePublicacio.mockReturnValue(new ErrorPublicacio('La signa una altra identitat.'));
    pinta(MANIFEST);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>No.</p>'); });
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toThrow('una altra identitat');
    expect(revisioEditorial('mur', 'manifest-de-poble')).toBeNull();
  });

  test('D-R6-1 · un acte de l’agenda signat per altri no es desa; qui és superadmin sí que el revisa', async () => {
    pinta(APLEC_DALTRI, 'events');
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>No.</p>'); });
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toBeInstanceOf(ErrorPublicacio);
    expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('El Rentonar'), 'info');
    expect(revisioEditorial('events', 'aplec-2023')).toBeNull();
    cleanup();
    sessio.esSuperadmin = true;
    pinta(APLEC_DALTRI, 'events');
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>Crònica del superadmin.</p>'); });
    await act(async () => { await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true); });
    expect(revisioEditorial('events', 'aplec-2023')).toEqual({ content: '<p>Crònica del superadmin.</p>' });
  });

  test('D-B4-1 · el Manifest del Mur signat per altri: l’ordinari no el desa; el superadmin, sí, i la guarda del Mur ho sap', async () => {
    pinta(MANIFEST_DALTRI);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>No.</p>'); });
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toBeInstanceOf(ErrorPublicacio);
    expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('El Rentonar'), 'info');
    expect(base.rebuigDePublicacio).toHaveBeenLastCalledWith(expect.anything(), { seccio: false, esSuperadmin: false });
    expect(revisioEditorial('mur', 'manifest-de-poble')).toBeNull();
    cleanup();
    sessio.esSuperadmin = true;
    pinta(MANIFEST_DALTRI);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>Revisat pel superadmin.</p>'); });
    await act(async () => { await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true); });
    expect(base.rebuigDePublicacio).toHaveBeenLastCalledWith(expect.anything(), { seccio: false, esSuperadmin: true });
    expect(revisioEditorial('mur', 'manifest-de-poble')).toEqual({ content: '<p>Revisat pel superadmin.</p>' });
  });

  test('D-B4-1 · una fila UUID d’altri: ni el superadmin hi passa l’excepció (publishNote re-signaria)', async () => {
    sessio.esSuperadmin = true;
    base.rebuigDePublicacio.mockReturnValue(new ErrorPublicacio('La signa una altra identitat.'));
    pinta(FILA_MUR);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>Canvi.</p>'); });
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toThrow('una altra identitat');
    expect(base.rebuigDePublicacio).toHaveBeenLastCalledWith(expect.objectContaining({ publishedSubmissionId: UUID_FILA }));
    expect(base.creaNota).not.toHaveBeenCalled();
    expect(base.publishNote).not.toHaveBeenCalled();
  });

  test('amb la reserva de només lectura, ni revisió ni adopció', async () => {
    base.nomesLectura = true;
    pinta(MANIFEST);
    act(() => { mocks.vist.ctx.setLocalNoteField(mocks.vist.nota.id, 'content', '<p>No.</p>'); });
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toBeInstanceOf(ErrorIdentitatDeLectura);
    cleanup();
    pinta(FILA_MUR);
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toBeInstanceOf(ErrorIdentitatDeLectura);
    expect(revisioEditorial('mur', 'manifest-de-poble')).toBeNull();
    expect(base.creaNota).not.toHaveBeenCalled();
    expect(base.rebuigDePublicacio).not.toHaveBeenCalled();
  });

  test('fila UUID: les guardes de publishNote van ABANS d’adoptar; un rebuig no deixa cap nota lligada', async () => {
    base.rebuigDePublicacio.mockReturnValue(new ErrorPublicacio('Esta publicació viu al Mercat.'));
    pinta(FILA_MUR);
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toThrow('viu al Mercat');
    expect(base.rebuigDePublicacio).toHaveBeenCalledWith(expect.objectContaining({ publishedSubmissionId: UUID_FILA }));
    expect(base.creaNota).not.toHaveBeenCalled();
    expect(base.updateNote).not.toHaveBeenCalled();
    expect(base.publishNote).not.toHaveBeenCalled();
    expect(mocks.setParams).not.toHaveBeenCalled();
    /* Passada la guarda, el camí UUID de sempre. */
    base.rebuigDePublicacio.mockReturnValue(null);
    await act(async () => { await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).resolves.toBe(true); });
    expect(base.creaNota).toHaveBeenCalledTimes(1);
    expect(base.publishNote).toHaveBeenCalledWith(expect.objectContaining({ publishedSubmissionId: UUID_FILA, isPublished: true }));
    expect(revisioEditorial('mur', UUID_FILA)).toBeNull();
  });

  test('en seed o local, el publishNote de sempre (el seu rebuig de proves) i cap nota creada', async () => {
    base.config = { dataMode: 'seed' };
    base.publishNote.mockRejectedValueOnce(new ErrorPublicacio('mode de proves'));
    pinta(FILA_MUR);
    await expect(mocks.vist.ctx.publishNote(mocks.vist.nota)).rejects.toThrow('mode de proves');
    expect(base.publishNote).toHaveBeenCalledWith(expect.objectContaining({ id: `publicacio:mur:${UUID_FILA}` }));
    expect(base.creaNota).not.toHaveBeenCalled();
  });
});
