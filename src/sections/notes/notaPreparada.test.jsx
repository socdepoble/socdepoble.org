/* P4 (ordre del Mestre, 261003) · La «Nota sense títol» del Bloc de Notes
   (notaPreparada.js): no es crea al servidor fins que s'hi escriu, es crea
   una sola vegada i amb el MATEIX id, i el que s'escriu mentre viatja arriba
   a la cua de sempre. Dades sintètiques. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import {
  DETALL_CREACIO_PENDENT, detallDeCreacioFallida, nouIdDeNota, teContingut, useNotaPreparada
} from './notaPreparada.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const LLAVOR = '<h3>Llavor de prova</h3>';
const BASE = Object.freeze({ folderId: 'f-mur', copyright: 'CC BY-NC-SA 4.0' });
const CAP = Object.freeze([]);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/* El hook amb unes dades de prova; `notes` i `clau` es canvien amb rerender. */
function munta({
  creaNota = vi.fn(async (entrada) => ({ ...entrada, revision: 1 })), informaError = vi.fn(), resolNota = undefined, adopta = vi.fn()
} = {}) {
  const setLocalNoteField = vi.fn();
  const updateNote = vi.fn(async () => ({}));
  const props = { clau: 'ambit-A', base: BASE, llavor: LLAVOR, notes: CAP, creaNota, resolNota, setLocalNoteField, updateNote, informaError, adopta };
  const vista = renderHook((p) => useNotaPreparada(p), { initialProps: props });
  const amb = (canvis) => vista.rerender({ ...props, ...canvis });
  return { ...vista, props, amb, creaNota, informaError, setLocalNoteField, updateNote, adopta };
}
/* Un error de request() (runtime.js): el temps esgotat i un estat HTTP. */
const tempsEsgotat = () => Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' });
const ambEstat = (status, missatge) => Object.assign(new Error(missatge), { status });

/* Gauntlet 261016 (Bloc 3.9; verificació de la MCR) · La llavor es compara
   normalitzada: el cos que torna TipTap no porta els salts de línia de la
   llavor escrita, i abans la cadena exacta no casava mai (la plantilla
   intacta creava la nota). També accepta una llista (la d'ara i la d'abans), i
   amb una llavor la plantilla del Bloc tampoc no compta. */
test('Bloc 3.9 · teContingut: la plantilla verge normalitzada (llista de llavors, forma de TipTap) no crea la nota', async () => {
  const { LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA, LLAVORS_NOTA } = await import('./llavorNota.js');
  const compacta = (html) => html.replace(/>\s+</g, '><');
  for (const content of [LLAVOR_NOTA, compacta(LLAVOR_NOTA), LLAVOR_NOTA_ANTIGA, compacta(LLAVOR_NOTA_ANTIGA)]) {
    expect(teContingut({ content }, LLAVORS_NOTA)).toBe(false);
    // Amb una sola llavor (la de prova), la plantilla del Bloc tampoc compta.
    expect(teContingut({ content }, LLAVOR)).toBe(false);
  }
  expect(teContingut({ content: '<h3>Llavor de prova</h3>' }, [LLAVOR])).toBe(false);
  expect(teContingut({ content: '<h3>Llavor de prova</h3>\n' }, LLAVOR)).toBe(false);
  // Un text propi, també barrejat amb la plantilla, sí que crea la nota.
  expect(teContingut({ content: `${compacta(LLAVOR_NOTA)}<p>Ho he escrit jo</p>` }, LLAVORS_NOTA)).toBe(true);
  // Sense cap llavor, el criteri de sempre: el text compta.
  expect(teContingut({ content: LLAVOR_NOTA }, null)).toBe(true);
});

test('teContingut: text o imatge; la llavor, un cos buit i la classificació no compten', () => {
  expect(teContingut({}, LLAVOR)).toBe(false);
  expect(teContingut({ content: LLAVOR }, LLAVOR)).toBe(false);
  expect(teContingut({ content: '<p></p>' }, LLAVOR)).toBe(false);
  expect(teContingut({ content: '<p>   </p>', title: '' }, LLAVOR)).toBe(false);
  expect(teContingut({ folderId: 'f-notes', icon: '🍅', categories: ['Hort'], tags: ['Reg'], copyright: 'CC0 1.0', publishDate: '2026-10-03T10:00:00.000Z' }, LLAVOR)).toBe(false);
  expect(teContingut({ content: '<p>a</p>' }, LLAVOR)).toBe(true);
  expect(teContingut({ title: 'Hort' }, LLAVOR)).toBe(true);
  expect(teContingut({ lead: '<p>Entradilla</p>' }, LLAVOR)).toBe(true);
  expect(teContingut({ heroImage: 'sdp-media://mitjans_privats/a.webp' }, LLAVOR)).toBe(true);
  expect(teContingut({ content: '<p><img src="sdp-media://mitjans_privats/a.webp"></p>' }, LLAVOR)).toBe(true);
});

test('nouIdDeNota: un UUID v4, també en un amfitrió sense context segur (sense randomUUID)', () => {
  expect(nouIdDeNota()).toMatch(UUID_V4);
  const real = globalThis.crypto;
  vi.stubGlobal('crypto', { getRandomValues: (octets) => real.getRandomValues(octets) });
  const ids = new Set(Array.from({ length: 20 }, () => nouIdDeNota()));
  expect(ids.size).toBe(20);
  for (const id of ids) expect(id).toMatch(UUID_V4);
});

test('obrir-la, classificar-la o deixar la llavor no crea res; el document ho porta', async () => {
  const { result, creaNota } = munta();
  const { id } = result.current;
  expect(id).toMatch(UUID_V4);
  expect(result.current.document).toMatchObject({ ...BASE, id, preparada: true, isPublished: false });
  await act(async () => {
    result.current.escriu(id, 'folderId', 'f-notes');
    result.current.escriu(id, 'icon', '🍅');
    result.current.escriu(id, 'content', LLAVOR);
    result.current.escriu(id, 'content', '<p></p>');
  });
  expect(creaNota).not.toHaveBeenCalled();
  expect(result.current.id).toBe(id);
  expect(result.current.document).toMatchObject({ folderId: 'f-notes', icon: '🍅', content: '<p></p>', copyright: BASE.copyright });
});

test('la primera escriptura de veres la crea UNA vegada, amb el mateix id, la base i el que s’hi ha triat', async () => {
  const { result, creaNota } = munta();
  const { id } = result.current;
  await act(async () => {
    result.current.escriu(id, 'icon', '🍅');
    result.current.escriu(id, 'title', 'H');
  });
  expect(creaNota).toHaveBeenCalledTimes(1);
  expect(creaNota).toHaveBeenLastCalledWith({ ...BASE, icon: '🍅', title: 'H', id });
  // Les tecles de mentre viatja no tornen a crear: es queden ací.
  await act(async () => {
    result.current.escriu(id, 'title', 'Ho');
    result.current.escriu(id, 'content', '<p>Planter</p>');
  });
  expect(creaNota).toHaveBeenCalledTimes(1);
  expect(result.current.id).toBe(id);
  expect(result.current.camps).toEqual({ icon: '🍅', title: 'Ho', content: '<p>Planter</p>' });
  // Un id que no és el de la preparada (un editor d'abans) no hi escriu.
  await act(async () => { result.current.escriu('una-altra', 'title', 'Fora'); });
  expect(result.current.camps.title).toBe('Ho');
});

test('ja a la llista, el que s’ha escrit mentre viatjava va a la cua de sempre i se’n prepara una de nova', async () => {
  const { result, amb, creaNota, setLocalNoteField } = munta();
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'title', 'H'); });
  await act(async () => {
    result.current.escriu(id, 'title', 'Hort');
    result.current.escriu(id, 'subtitle', '<p>De maig</p>');
  });
  // creaNota l'ha posada a la llista amb el que portava en eixir (i sense subtítol: l'adaptador remot no el crea).
  const creada = { ...BASE, id, title: 'H', icon: '', revision: 1 };
  act(() => amb({ notes: [creada] }));
  expect(setLocalNoteField.mock.calls).toEqual([
    [id, 'title', 'Hort'],
    [id, 'subtitle', '<p>De maig</p>']
  ]);
  expect(result.current.id).not.toBe(id);
  expect(result.current.id).toMatch(UUID_V4);
  expect(result.current.camps).toEqual({});
  expect(result.current.document.preparada).toBe(true);
  expect(creaNota).toHaveBeenCalledTimes(1);
});

test('si la creació falla, ho diu una vegada; cada tecla no ho torna a provar, el desat amb pausa sí; un AbortError calla', async () => {
  const informaError = vi.fn();
  const creaNota = vi.fn()
    .mockRejectedValueOnce(new Error('Cal iniciar sessió per crear una nota.'))
    .mockRejectedValueOnce(new DOMException('Operació cancel·lada.', 'AbortError'))
    .mockResolvedValue({});
  const { result } = munta({ creaNota, informaError });
  const { id } = result.current;
  expect(result.current.creacio).toBeNull();
  await act(async () => { result.current.escriu(id, 'title', 'H'); });
  expect(informaError).toHaveBeenCalledTimes(1);
  expect(informaError.mock.calls[0][0].message).toBe('Cal iniciar sessió per crear una nota.');
  // Revisió de P4 · La barra taronja ho diu, amb el motiu i la veritat.
  expect(result.current.creacio).toEqual({ estat: 'error', detall: detallDeCreacioFallida('Cal iniciar sessió per crear una nota.') });
  expect(result.current.creacio.detall).toContain('només és en esta pestanya');
  // El text no ix de la pantalla, i les tecles següents no fan cap petició.
  await act(async () => {
    result.current.escriu(id, 'title', 'Ho');
    result.current.escriu(id, 'title', 'Hor');
  });
  expect(result.current.camps.title).toBe('Hor');
  expect(creaNota).toHaveBeenCalledTimes(1);
  // El desat amb pausa (saveRemote) sí que ho torna a provar.
  await act(async () => { result.current.desa(id, 'title', 'Hor'); });
  expect(creaNota).toHaveBeenCalledTimes(2);
  expect(informaError).toHaveBeenCalledTimes(1);
  // Una creació tallada no ha fallat, però la nota encara no hi és.
  expect(result.current.creacio).toEqual({ estat: 'pendent', detall: DETALL_CREACIO_PENDENT });
  await act(async () => { result.current.escriu(id, 'title', 'Hort'); });
  expect(creaNota).toHaveBeenCalledTimes(2);
  await act(async () => { result.current.desa(id, 'title', 'Hort'); });
  expect(creaNota).toHaveBeenCalledTimes(3);
  expect(creaNota).toHaveBeenLastCalledWith({ ...BASE, title: 'Hort', id });
});

test('desa també crea la primera vegada (la imatge de capçalera només arriba pel desat)', async () => {
  const { result, creaNota } = munta();
  const { id } = result.current;
  await act(async () => { result.current.desa(id, 'heroImage', 'sdp-media://mitjans_privats/hort.webp'); });
  expect(creaNota).toHaveBeenCalledTimes(1);
  expect(creaNota).toHaveBeenLastCalledWith({ ...BASE, heroImage: 'sdp-media://mitjans_privats/hort.webp', id });
});

test('eixir del Bloc amb la creació en vol no perd el que s’hi ha escrit mentrestant (ni el buidatge final de l’editor)', async () => {
  let torna;
  const creaNota = vi.fn(() => new Promise((resol) => { torna = resol; }));
  const { result, unmount, updateNote, setLocalNoteField } = munta({ creaNota });
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'title', 'H'); });
  expect(creaNota).toHaveBeenCalledTimes(1);
  await act(async () => { result.current.escriu(id, 'title', 'Hort'); });
  const { escriu, desa } = result.current;
  unmount();
  // El buidatge de l'editor arriba després de la neteja del pare.
  desa(id, 'content', '<p>Planter</p>');
  escriu('una-altra', 'title', 'Fora');
  expect(updateNote).not.toHaveBeenCalled();
  await act(async () => { torna({ ...BASE, id, title: 'H', revision: 1 }); });
  expect(updateNote).toHaveBeenCalledTimes(1);
  expect(updateNote).toHaveBeenLastCalledWith(id, { title: 'Hort', content: '<p>Planter</p>' }, 1);
  expect(setLocalNoteField).not.toHaveBeenCalled();
});

test('eixir sense creació en vol (o amb tot ja enviat) no envia res', async () => {
  const { result, unmount, updateNote } = munta();
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'folderId', 'f-notes'); });
  unmount();
  await act(async () => {});
  expect(updateNote).not.toHaveBeenCalled();
});

test('un altre àmbit (sessió, actor o poble): la preparada d’abans no hi passa', async () => {
  const { result, amb, creaNota } = munta();
  const abans = result.current.id;
  await act(async () => { result.current.escriu(abans, 'folderId', 'f-notes'); });
  act(() => amb({ clau: 'ambit-B' }));
  expect(result.current.id).not.toBe(abans);
  expect(result.current.camps).toEqual({});
  // L'editor de l'àmbit d'abans ja no hi pot escriure.
  await act(async () => { result.current.escriu(abans, 'title', 'De l’altre àmbit'); });
  expect(creaNota).not.toHaveBeenCalled();
});

/* ── Revisió de P4 (261003) ──────────────────────────────────────────── */

test('revisió · dues fallades de veres seguides: un sol avís; un motiu nou sí que avisa; la barra diu enviant mentre viatja', async () => {
  let rebutja;
  const informaError = vi.fn();
  const creaNota = vi.fn(() => new Promise((_resol, falla) => { rebutja = falla; }));
  const { result } = munta({ creaNota, informaError });
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'title', 'H'); });
  expect(result.current.creacio).toEqual({ estat: 'enviant', detall: '' });
  await act(async () => { rebutja(ambEstat(503, 'Supabase 503: caigut')); });
  expect(informaError).toHaveBeenCalledTimes(1);
  expect(result.current.creacio.estat).toBe('error');
  // El desat amb pausa ho torna a provar: en camí, i torna a fallar pel mateix.
  await act(async () => { result.current.desa(id, 'title', 'Ho'); });
  expect(creaNota).toHaveBeenCalledTimes(2);
  expect(result.current.creacio).toEqual({ estat: 'enviant', detall: '' });
  await act(async () => { rebutja(ambEstat(503, 'Supabase 503: caigut')); });
  expect(informaError).toHaveBeenCalledTimes(1);
  expect(result.current.creacio).toEqual({ estat: 'error', detall: detallDeCreacioFallida('Supabase 503: caigut') });
  // Un motiu diferent sí que es diu.
  await act(async () => { result.current.desa(id, 'title', 'Hor'); });
  await act(async () => { rebutja(ambEstat(403, 'Supabase 403: sense permís')); });
  expect(informaError).toHaveBeenCalledTimes(2);
  expect(informaError.mock.lastCall[0].message).toBe('Supabase 403: sense permís');
  expect(creaNota).toHaveBeenCalledTimes(3);
});

test('revisió · «Torna-ho a provar» crea sense cap tecla nova, amb el que ja hi ha', async () => {
  const creaNota = vi.fn()
    .mockRejectedValueOnce(ambEstat(503, 'Supabase 503: caigut'))
    .mockImplementation(async (entrada) => ({ ...entrada, revision: 1 }));
  const { result } = munta({ creaNota });
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'content', '<p>Planter</p>'); });
  expect(result.current.creacio.estat).toBe('error');
  await act(async () => { result.current.reintenta(); });
  expect(creaNota).toHaveBeenCalledTimes(2);
  expect(creaNota).toHaveBeenLastCalledWith({ ...BASE, content: '<p>Planter</p>', id });
  expect(result.current.creacio).toEqual({ estat: 'enviant', detall: '' });
  // Mentre viatja (o ja creada, a l'espera de la llista) no se'n fa cap altra.
  await act(async () => { result.current.reintenta(); });
  expect(creaNota).toHaveBeenCalledTimes(2);
});

test('revisió · un temps esgotat que sí que havia arribat: es resol per id, cap avís, i es materialitza', async () => {
  const informaError = vi.fn();
  const creaNota = vi.fn().mockRejectedValue(tempsEsgotat());
  const resolNota = vi.fn(async () => ({ status: 'found' }));
  const { result, amb, setLocalNoteField } = munta({ creaNota, informaError, resolNota });
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'title', 'H'); });
  expect(resolNota).toHaveBeenCalledWith(id);
  expect(informaError).not.toHaveBeenCalled();
  expect(result.current.creacio.estat).toBe('enviant');
  // Les tecles de mentre no tornen a crear.
  await act(async () => { result.current.desa(id, 'title', 'Hort'); });
  expect(creaNota).toHaveBeenCalledTimes(1);
  // resolveNote l'ha injectada a la llista: es materialitza pel camí de sempre.
  act(() => amb({ notes: [{ ...BASE, id, title: 'H', revision: 1 }] }));
  expect(setLocalNoteField.mock.calls).toEqual([[id, 'title', 'Hort']]);
  expect(result.current.id).not.toBe(id);
  expect(result.current.creacio).toBeNull();
});

test('revisió · el reintent topa amb la clau (409) i la nota no hi és: és una fallada, amb avís', async () => {
  const informaError = vi.fn();
  const creaNota = vi.fn().mockRejectedValue(ambEstat(409, 'Supabase 409: duplicate key'));
  const resolNota = vi.fn(async () => ({ status: 'not-found' }));
  const { result } = munta({ creaNota, informaError, resolNota });
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'title', 'H'); });
  expect(resolNota).toHaveBeenCalledTimes(1);
  expect(informaError).toHaveBeenCalledTimes(1);
  expect(result.current.creacio.estat).toBe('error');
  // Si no es pot resoldre (la consulta també falla), tampoc no s'inventa res.
  resolNota.mockRejectedValueOnce(ambEstat(0, 'Error de xarxa'));
  await act(async () => { result.current.desa(id, 'title', 'Ho'); });
  expect(resolNota).toHaveBeenCalledTimes(2);
  expect(result.current.creacio.estat).toBe('error');
  // Un error que no pot haver arribat no fa cap consulta.
  creaNota.mockRejectedValueOnce(ambEstat(403, 'Supabase 403: sense permís'));
  await act(async () => { result.current.desa(id, 'title', 'Hor'); });
  expect(resolNota).toHaveBeenCalledTimes(2);
});

test('revisió · un endoll que crea la nota amb un altre id: s’adopta, el text hi arriba i la selecció hi passa', async () => {
  const ID_SERVIDOR = '0f0e0d0c-0b0a-4000-8000-0000000000ff';
  const creaNota = vi.fn(async (entrada) => ({ ...entrada, id: ID_SERVIDOR, revision: 1 }));
  const { result, amb, setLocalNoteField, adopta } = munta({ creaNota });
  const { id } = result.current;
  await act(async () => { result.current.escriu(id, 'title', 'H'); });
  // Les tecles que arriben abans que la nota siga a la llista es queden ací, i no tornen a crear.
  await act(async () => { result.current.escriu(id, 'title', 'Hort'); });
  expect(creaNota).toHaveBeenCalledTimes(1);
  expect(result.current.id).toBe(id);
  act(() => amb({ notes: [{ ...BASE, id: ID_SERVIDOR, title: 'H', revision: 1 }] }));
  expect(setLocalNoteField.mock.calls).toEqual([[ID_SERVIDOR, 'title', 'Hort']]);
  expect(adopta).toHaveBeenCalledWith(id, ID_SERVIDOR);
  expect(result.current.id).not.toBe(id);
  expect(result.current.camps).toEqual({});
});

test('revisió · eixir en vol quan el primer contingut és la capçalera: la creació torna sense i updateNote la rep', async () => {
  let torna;
  const creaNota = vi.fn(() => new Promise((resol) => { torna = resol; }));
  const { result, unmount, updateNote } = munta({ creaNota });
  const { id } = result.current;
  const HERO = 'sdp-media://mitjans_privats/hort.webp';
  await act(async () => { result.current.desa(id, 'heroImage', HERO); });
  expect(creaNota).toHaveBeenLastCalledWith({ ...BASE, heroImage: HERO, id });
  unmount();
  // L'adaptador remot no insereix hero_image: la nota creada torna sense.
  await act(async () => { torna({ ...BASE, id, title: '', heroImage: null, revision: 1 }); });
  expect(updateNote).toHaveBeenCalledTimes(1);
  expect(updateNote).toHaveBeenLastCalledWith(id, { heroImage: HERO }, 1);
});

test('revisió · l’entrada de creaNota i l’eixida en vol passen pel sanejador del canal', async () => {
  let torna;
  const creaNota = vi.fn(() => new Promise((resol) => { torna = resol; }));
  const { result, unmount, updateNote } = munta({ creaNota });
  const { id } = result.current;
  await act(async () => {
    // Els drets sols no creen la nota.
    result.current.escriu(id, 'copyright', '  CC0 1.0\u0007 ');
    result.current.escriu(id, 'content', '<p>Planter<img src="planter.webp" onerror="alert(1)"></p>');
  });
  expect(creaNota).toHaveBeenCalledTimes(1);
  const entrada = creaNota.mock.lastCall[0];
  expect(entrada.copyright).toBe('CC0 1.0');
  expect(entrada.content).toContain('Planter');
  expect(entrada.content).not.toMatch(/onerror/i);
  // Ja en vol, una altra tecla amb marcatge, i la persona ix del Bloc.
  await act(async () => { result.current.escriu(id, 'lead', '<p>De maig<img src="x" onerror="alert(2)"></p>'); });
  unmount();
  await act(async () => { torna({ ...entrada, revision: 1 }); });
  expect(updateNote).toHaveBeenCalledTimes(1);
  const [idEnviat, enviats] = updateNote.mock.lastCall;
  expect(idEnviat).toBe(id);
  expect(Object.keys(enviats)).toEqual(['lead']);
  expect(enviats.lead).toContain('De maig');
  expect(enviats.lead).not.toMatch(/onerror/i);
});
