import { describe, expect, test, vi } from 'vitest';
import { campsPrivatsPaginaWp, creaPublicadorPaginaWp, potRevisarPaginesWp } from './revisioPaginesWp.js';

function setup() {
  const base = { teSessio: true, nomesLectura: false, config: { dataMode: 'supabase' },
    creaNota: vi.fn(async input => ({ ...input, revision: 0 })),
    updateNote: vi.fn(async () => ({ revision: 1 })), publishNote: vi.fn(async () => true), rebuigDePublicacio: vi.fn(() => null) };
  const state = { viu: true, ambit: 'account-a:epoch-1', base,
    sessio: { currentUser: { id: 'a' }, estat: 'dins', esSuperadmin: true, nivell: 'aal2' },
    pagina: { publicable: true, imatgesPendents: [] }, nota: { id: 'wp-review', title: 'Font', content: '<p>Real</p>', folderId: 'f-mur', categories: ['General'], isPublished: false } };
  return { state, base, publisher: creaPublicadorPaginaWp({ llig: () => state, nouId: () => 'new-uuid' }) };
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

describe('IDEA-111 · revisió privada abans de publicar', () => {
  test('muntar/preparar no escriu; publicar sense aprovar no crea res', async () => {
    const { publisher, base, state } = setup();
    expect(publisher.estaAprovat()).toBe(false); expect(base.creaNota).not.toHaveBeenCalled();
    await expect(publisher.publica(state.nota)).rejects.toMatchObject({ code: 'WP_REVISIO_PENDENT' });
    expect(base.creaNota).not.toHaveBeenCalled(); expect(base.publishNote).not.toHaveBeenCalled();
  });
  test.each([
    ['anònim', s => { s.sessio.currentUser = null; }], ['rol ordinari', s => { s.sessio.esSuperadmin = false; }],
    ['rol encara comprovant', s => { s.sessio.estat = 'comprovant'; }], ['segon factor pendent', s => { s.sessio.nivell = 'aal1'; }],
    ['només lectura', s => { s.base.nomesLectura = true; }], ['desmuntat', s => { s.viu = false; }]
  ])('%s no aprova ni publica', async (_name, change) => {
    const { state, publisher, base } = setup(); change(state);
    expect(() => publisher.aprova()).toThrow('WP_REVISIO_PRIVADA');
    await expect(publisher.publica()).rejects.toMatchObject({ code: 'WP_REVISIO_PRIVADA' });
    expect(base.creaNota).not.toHaveBeenCalled();
  });
  test('quarantena de mitjans: cap aprovació encara que el client escriga estat_revisio', async () => {
    const { state, publisher, base } = setup(); state.pagina = { publicable: false, imatgesPendents: ['https://socdepoble.net/imatge.jpg'] };
    state.nota.estat_revisio = 'aprovat'; state.nota.autoritzat = true;
    expect(() => publisher.aprova()).toThrow('WP_MITJANS_PENDENTS');
    await expect(publisher.publica()).rejects.toMatchObject({ code: 'WP_MITJANS_PENDENTS' });
    expect(base.publishNote).not.toHaveBeenCalled();
  });
  test('la revisió aprovada crea només nota privada i conserva HTML/vídeo inert pel canal habitual', async () => {
    const { state, publisher, base } = setup(); state.nota.content += '<div data-sdp-youtube="VBzEBQq_4LA"><a href="https://www.youtube.com/watch?v=VBzEBQq_4LA">Vídeo</a></div>';
    state.nota.ownerId = 'foreign'; state.nota.publishedSubmissionId = 'foreign-id'; state.nota.isPublished = true;
    expect(publisher.aprova()).toBe('aprovat');
    expect(await publisher.publica(state.nota)).toBe(true);
    expect(base.creaNota).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-uuid', isPublished: false }));
    for (const method of ['creaNota', 'updateNote']) {
      const fields = base[method].mock.calls[0][method === 'creaNota' ? 0 : 1];
      expect(fields.ownerId).toBeUndefined(); expect(fields.publishedSubmissionId).toBeUndefined(); expect(fields.autoritzat).toBeUndefined();
    }
    expect(base.publishNote).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-uuid', revision: 1, isPublished: false }));
    expect(base.publishNote.mock.calls[0][0].ownerId).toBeUndefined();
    expect(base.publishNote.mock.calls[0][0].publishedSubmissionId).toBeUndefined();
    expect(base.publishNote.mock.calls[0][0].content).toContain('data-sdp-youtube="VBzEBQq_4LA"');
  });
  test('editar després d’aprovar, o passar un document nou, obliga a revisar de nou', async () => {
    const { state, publisher, base } = setup(); publisher.aprova();
    await expect(publisher.publica({ ...state.nota, content: '<p>Una altra versió</p>' })).rejects.toMatchObject({ code: 'WP_REVISIO_PENDENT' });
    state.nota = { ...state.nota, title: 'Canvi' }; expect(publisher.estaAprovat()).toBe(false);
    await expect(publisher.publica()).rejects.toMatchObject({ code: 'WP_REVISIO_PENDENT' });
    expect(base.creaNota).not.toHaveBeenCalled();
  });
  test.each(['èxit', 'error incert'])('després de %s, reobri la nota real i no reutilitza una revisió CAS obsoleta', async mode => {
    const { publisher, base } = setup();
    let revision = 0;
    base.updateNote.mockImplementation(async (_id, _fields, expected) => {
      if (expected !== revision) throw new Error('CAS_STALE');
      revision += 1; return { revision };
    });
    base.publishNote.mockImplementation(async () => {
      revision += 1; // NotesContext links the submission with a second CAS.
      if (mode === 'error incert') throw new Error('reply-lost-after-server-write');
      return true;
    });
    publisher.aprova();
    if (mode === 'èxit') expect(await publisher.publica()).toBe(true);
    else await expect(publisher.publica()).rejects.toThrow('reply-lost');
    expect(publisher.notaCreada()).toBe('new-uuid');
    expect(() => publisher.aprova()).toThrow('WP_CONTINUA_AL_BLOC');
    await expect(publisher.publica()).rejects.toMatchObject({ code: 'WP_CONTINUA_AL_BLOC' });
    expect(base.creaNota).toHaveBeenCalledTimes(1); expect(base.updateNote).toHaveBeenCalledTimes(1); expect(base.publishNote).toHaveBeenCalledTimes(1);
  });
  test('resposta de creació perduda conserva el mateix UUID candidat i bloqueja duplicats', async () => {
    const { publisher, base } = setup(); base.creaNota.mockRejectedValue(Object.assign(new Error('lost reply'), { name: 'TimeoutError', status: 0 }));
    publisher.aprova(); await expect(publisher.publica()).rejects.toThrow('lost reply');
    expect(publisher.notaCreada()).toBeNull(); expect(publisher.notaPerRecuperar()).toBe('new-uuid');
    expect(() => publisher.aprova()).toThrow('WP_CREACIO_INCERTA');
    await expect(publisher.publica()).rejects.toMatchObject({ code: 'WP_CREACIO_INCERTA' });
    expect(base.creaNota).toHaveBeenCalledTimes(1); expect(base.updateNote).not.toHaveBeenCalled(); expect(base.publishNote).not.toHaveBeenCalled();
  });
  test.each(['compte', 'ABA', 'contingut', 'rol', 'desmuntatge'])('canvi %s durant la creació no publica ni continua escrivint', async change => {
    const { state, publisher, base } = setup(), wait = deferred();
    base.creaNota.mockImplementation(() => wait.promise); publisher.aprova();
    const pending = publisher.publica(); await Promise.resolve();
    if (change === 'compte') { state.ambit = 'b:epoch-2'; state.sessio = { ...state.sessio, currentUser: { id: 'b' } }; }
    if (change === 'ABA') state.ambit = 'a:epoch-3';
    if (change === 'contingut') state.nota = { ...state.nota, content: '<p>Nova versió</p>' };
    if (change === 'rol') state.sessio.esSuperadmin = false;
    if (change === 'desmuntatge') state.viu = false;
    wait.resolve({ id: 'new-uuid', revision: 0 });
    await expect(pending).rejects.toHaveProperty('code');
    expect(base.updateNote).not.toHaveBeenCalled(); expect(base.publishNote).not.toHaveBeenCalled();
  });
  test('canvi després del desat privat no publica; dos clics compartixen una operació', async () => {
    const { state, publisher, base } = setup(), wait = deferred();
    base.updateNote.mockImplementation(() => wait.promise); publisher.aprova();
    const a = publisher.publica(), b = publisher.publica(); expect(a).toBe(b);
    await vi.waitFor(() => expect(base.updateNote).toHaveBeenCalledTimes(1));
    state.ambit = 'epoch-2'; wait.resolve({ revision: 1 });
    await expect(a).rejects.toMatchObject({ code: 'WP_REVISIO_CANVIADA' });
    expect(base.creaNota).toHaveBeenCalledTimes(1); expect(base.publishNote).not.toHaveBeenCalled();
  });
  test('respecta el rebuig previ del Bloc; el sanejador continua rebutjant iframes arbitraris', async () => {
    const { publisher, state, base } = setup(); base.rebuigDePublicacio.mockReturnValue(new Error('RLS/identitat'));
    publisher.aprova(); await expect(publisher.publica()).rejects.toThrow('RLS/identitat'); expect(base.creaNota).not.toHaveBeenCalled();
    const clean = campsPrivatsPaginaWp({ content: '<p>Real</p><iframe src="https://evil.test"></iframe><img src="https://evil.test/pixel">', autoritzat: true }).content;
    expect(clean).toContain('<p>Real</p>'); expect(clean).not.toMatch(/<iframe|src=|evil\.test/);
    expect(potRevisarPaginesWp(state.sessio, base)).toBe(true);
  });
});
