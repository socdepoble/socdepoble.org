import { expect, test, vi } from 'vitest';
const request = vi.hoisted(() => vi.fn(async () => []));
/* T2 · El mode resolt el tria cada prova; per defecte cap (una config sense mode és remota). */
const mode = vi.hoisted(() => ({ actual: undefined }));
vi.mock('./runtime.js', () => ({ request, getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: 'town', runtimeDataMode: mode.actual }),
  APP_SEED_VERSION: 1, buildSeedAppData: vi.fn(), generateUUID: vi.fn(), getCurrentUser: vi.fn(), mapContentRowsToData: vi.fn(), rpc: vi.fn() }));
vi.mock('./xat.js', () => ({ enviaMissatge: vi.fn() }));
import { appendSectionSubmissionNetworkOnly, loadMur, loadMultimedia, loadCoreContent } from './content.js';
import { getCurrentUser, buildSeedAppData, mapContentRowsToData } from './runtime.js';
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El camp additiu `personalitzacio` de loadCoreContent. */
import { adminDesaPersonalitzacio, reiniciaPersonalitzacioLocal } from './personalitzacio.js';
test('Mur i Multimèdia no consulten Notes ni descarreguen app_content alié', async () => {
  await loadMur('A'); await loadMultimedia('A');
  const urls = request.mock.calls.map(([url]) => url);
  expect(urls).toHaveLength(6);
  expect(urls.every(url => !url.includes('/notes') && !url.includes('section_id=eq.notes'))).toBe(true);
  expect(urls.filter(url => url.includes('app_content')).every(url => url.includes('key=in.('))).toBe(true);
  expect(urls.filter(url => url.includes('section_submissions')).every(url => url.includes('section_id=eq.'))).toBe(true);
});

/* T51 · Una publicació editada mostra la data d'edició: section_submissions
   porta updated_at (trigger de 2609261200) i el Mur l'ha de rebre. */
test('T51 · el Mur demana updated_at de cada publicació i el passa a l’element', async () => {
  request.mockReset();
  request.mockImplementation(async (url) => (url.includes('section_submissions') && url.includes('section_id=eq.mur')
    ? [{ id: 'p1', payload: { title: 'Fira' }, title: 'Fira', created_at: '2026-09-01T10:00:00+00:00', updated_at: '2026-09-20T12:15:00+00:00' }]
    : []));
  const { feedPosts } = await loadMur('A');
  const url = new URL(request.mock.calls.find(([u]) => u.includes('section_id=eq.mur'))[0], 'http://poble.test');
  expect(url.searchParams.get('select').split(',')).toContain('updated_at');
  expect(feedPosts).toEqual([expect.objectContaining({ id: 'p1', created_at: '2026-09-01T10:00:00+00:00', updated_at: '2026-09-20T12:15:00+00:00' })]);
  request.mockReset();
  request.mockResolvedValue([]);
});

/* Auditoria 261007 (B) · Abans ho comprovava loadAppData, codi mort retirat
   (ningú no la cridava): ara, amb els carregadors que usa el Mur. */
test('un backend nou buit és un estat remot vàlid sense contingut seed', async () => {
  request.mockClear();
  request.mockResolvedValue([]);
  buildSeedAppData.mockClear();
  getCurrentUser.mockReturnValue(null);
  const mur = await loadMur('A');
  expect(mur).toEqual({ feedPosts: [], events: [], marketItems: [] });
  expect(await loadMultimedia('A')).toEqual({ mediaItems: [] });
  expect(mur).not.toHaveProperty('seedVersion');
  expect(buildSeedAppData).not.toHaveBeenCalled();
});

/* ───────── Auditoria 261007 (B) · el payload d'un veí no és autoritat ───────── */
const filaDelMur = (fila) => request.mockImplementation(async (url) => (url.includes('section_submissions') && url.includes('section_id=eq.mur')
  ? [fila] : []));
test('una publicació amb un payload hostil no signa, no és «Sistema» ni enllaça fora', async () => {
  request.mockReset();
  filaDelMur({
    id: 'p-hostil', title: 'Avís important', created_at: '2026-10-07T10:00:00+00:00', updated_at: '2026-10-07T10:00:00+00:00',
    owner_user_id: 'U-REAL', author_org_id: null,
    payload: {
      title: 'Avís important', author_name: 'Sóc de Poble', isSystem: true, isAvis: true, type: 'sistema',
      is_pinned: true, pinned_position: 0, author_org_id: 'socdepoble', authorOrgId: 'socdepoble', author_entity_id: 'socdepoble',
      author_id: 'ALTRE', author_user_id: 'ALTRE', owner_user_id: 'ALTRE', ownerUserId: 'ALTRE',
      mainHref: 'https://fals-poble.example/entra', slug: 'p-legitima',
      labels: [{ text: 'Oficial', href: 'https://fals-poble.example', className: 'sdp-badge-system sp-card-link-overlay' }, 'Pla']
    }
  });
  const [element] = (await loadMur('A')).feedPosts;
  for (const clau of ['isSystem', 'isAvis', 'type', 'is_pinned', 'pinned_position', 'author_entity_id', 'author_id', 'author_user_id', 'owner_user_id', 'mainHref', 'slug']) {
    expect(element, clau).not.toHaveProperty(clau);
  }
  expect(element).toMatchObject({ id: 'p-hostil', ownerUserId: 'U-REAL', author_org_id: null, authorOrgId: null, title: 'Avís important' });
  expect(element.labels).toEqual([{ text: 'Oficial' }, 'Pla']);
  request.mockReset();
  request.mockResolvedValue([]);
});

test('la columna author_org_id mana i fa ombra a la clau del payload', async () => {
  request.mockReset();
  filaDelMur({ id: 'p-org', title: 'Pa', owner_user_id: 'U', author_org_id: 'ORG-REAL', payload: { title: 'Pa', author_org_id: 'socdepoble' } });
  const [element] = (await loadMur('A')).feedPosts;
  expect(element).toMatchObject({ author_org_id: 'ORG-REAL', authorOrgId: 'ORG-REAL', ownerUserId: 'U' });
  request.mockReset();
  request.mockResolvedValue([]);
});

test('una publicació legítima (la que escriu publishNote) arriba igual que abans', async () => {
  request.mockReset();
  const payload = {
    sectionId: 'mur', type: 'feed', title: 'Fira', subtitle: 'De tardor', description: 'Entradeta', content: '<p>Cos</p>',
    copyright: 'CC BY-SA 4.0', image: 'sdp-media://mitjans/T/U/notes/x.jpg', author_name: 'Pep', author_avatar: '/a.png',
    author_location: 'Benilloba', publish_date: '2026-10-01', icon: '🍂', logo_image: '/logo.png',
    labels: [{ text: 'Festes', className: 'sdp-badge-category' }, { text: 'tardor', className: 'sdp-badge-tag' }],
    origen: { tipus: 'connexio', itemId: 'sella', titol: 'Sella', sectionId: 'pobles', ruta: '/pobles/sella', objecte: 'poble' }
  };
  filaDelMur({ id: 'p-legit', title: 'Fira', created_at: '2026-10-01T10:00:00+00:00', updated_at: '2026-10-02T10:00:00+00:00',
    owner_user_id: 'U', author_org_id: null, payload });
  const [element] = (await loadMur('A')).feedPosts;
  expect(element).toEqual({ ...payload, id: 'p-legit', created_at: '2026-10-01T10:00:00+00:00', updated_at: '2026-10-02T10:00:00+00:00',
    ownerUserId: 'U', author_org_id: null, authorOrgId: null });
  request.mockReset();
  request.mockResolvedValue([]);
});

test('el contingut d’app_content conserva la signatura del projecte dins del payload', async () => {
  request.mockReset();
  const samarreta = { id: 'samarreta', title: 'La samarreta', author_org_id: 'socdepoble', isSystem: false, mainHref: '/mercat/samarreta', slug: 'samarreta' };
  request.mockImplementation(async (url) => (url.includes('app_content') ? [{ key: 'marketItems', payload: [samarreta] }] : []));
  const { marketItems } = await loadMur('A');
  expect(marketItems).toEqual([samarreta]);
  request.mockReset();
  request.mockResolvedValue([]);
});

/* Onada 12 (261011; ordres 261011_0130, punt 7) · Una fila d'app_content amb un
   objecte on toca una llista rebutjava loadMur sencer («primary is not
   iterable», mergeById): el Mur en error per una fila de l'administració. */
test('Onada 12 · una fila feedPosts que no és una llista no rebutja la càrrega del Mur: es pren buida i els veïns es pinten', async () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  request.mockReset();
  try {
    request.mockImplementation(async (url) => {
      if (url.includes('app_content')) return [{ key: 'feedPosts', payload: { id: 'malmesa' } }, { key: 'events', payload: 'text' }, { key: 'marketItems', payload: [{ id: 'mel' }] }];
      return url.includes('section_id=eq.mur') ? [{ id: 'p1', title: 'Fira', payload: { title: 'Fira' }, owner_user_id: 'U' }] : [];
    });
    const mur = await loadMur('A');
    expect(mur.feedPosts).toEqual([expect.objectContaining({ id: 'p1', title: 'Fira' })]);
    expect(mur.events).toEqual([]);
    expect(mur.marketItems).toEqual([{ id: 'mel' }]);
    expect(avis.mock.calls.flat().join(' ')).not.toContain('malmesa');
  } finally {
    avis.mockRestore();
    request.mockReset();
    request.mockResolvedValue([]);
  }
});

test('el core remot conserva documents estàtics, però identitats i pobles només venen del servidor', async () => {
  request.mockClear();
  buildSeedAppData.mockResolvedValue({ pages: [{ id: 'projecte' }], towns: [{ id: 'demo-town' }], agents: [{ id: 'demo-agent' }] });
  mapContentRowsToData.mockReturnValue({ towns: [], agents: [] });
  /* Onada 11 · Sense files de taxonomia ni estil, el camp additiu diu null per clau. */
  expect(await loadCoreContent('A')).toEqual({ ownerUserId: 'A', pages: [{ id: 'projecte' }], pageCopy: {}, towns: [], agents: [],
    personalitzacio: { taxonomia: null, estil: null } });
});

/* ───────── Onada 11 (261010; prompt 261010_1730, tasca 2) · la personalització dins de loadCoreContent ───────── */
test('Onada 11 · en remot, loadCoreContent demana també taxonomia i estil a app_content i les torna amb payload i versió', async () => {
  request.mockReset();
  buildSeedAppData.mockResolvedValue({ pages: [{ id: 'projecte' }], towns: [], agents: [] });
  mapContentRowsToData.mockReturnValue({ towns: [{ id: 'la-torre' }], agents: [] });
  request.mockResolvedValueOnce([
    { key: 'towns', payload: [{ id: 'la-torre' }], version: 1 },
    { key: 'taxonomia', payload: { categories: ['Festes'] }, version: 3 }
  ]);
  const core = await loadCoreContent('A');
  const url = new URL(request.mock.calls[0][0], 'http://poble.test');
  expect(url.pathname).toBe('/rest/v1/app_content');
  expect(url.searchParams.get('key')).toBe('in.(towns,agents,taxonomia,estil)');
  expect(core).toMatchObject({ towns: [{ id: 'la-torre' }], pages: [{ id: 'projecte' }], pageCopy: {},
    personalitzacio: { taxonomia: { payload: { categories: ['Festes'] }, versio: 3 }, estil: null } });
  request.mockReset();
  request.mockResolvedValue([]);
});

test('Onada 11 · en seed, loadCoreContent torna el que té el magatzem en memòria de personalitzacio.js (null si res)', () => ambMode('seed', async () => {
  reiniciaPersonalitzacioLocal();
  request.mockClear();
  buildSeedAppData.mockResolvedValue({ ...LLAVOR, pages: [{ id: 'projecte' }], towns: [{ id: 'demo-town' }], agents: [] });
  expect((await loadCoreContent('A')).personalitzacio).toEqual({ taxonomia: null, estil: null });
  getCurrentUser.mockReturnValue({ id: 'U' });
  // Decisió del Mestre (30-10-2026) · El valor es compon: tractor-tokens (T1) llig src sencer.
  const verd = ['var(', '--sdp-crom-verd-500', ')'].join('');
  await adminDesaPersonalitzacio({ clau: 'estil', payload: { '--sdp-accent': verd }, versio: null }, { dataMode: 'seed' });
  const core = await loadCoreContent('A');
  expect(core.personalitzacio).toEqual({ taxonomia: null, estil: { payload: { '--sdp-accent': verd }, versio: 1 } });
  expect(core).toMatchObject({ towns: [{ id: 'demo-town' }], pageCopy: {} });
  expect(request).not.toHaveBeenCalled();
  reiniciaPersonalitzacioLocal();
}));

test('Onada 11 · en local, loadCoreContent porta el camp additiu amb null per clau i cap petició', () => ambMode('local', async () => {
  reiniciaPersonalitzacioLocal();
  request.mockClear();
  buildSeedAppData.mockResolvedValue({ pages: [{ id: 'projecte' }], towns: [], agents: [] });
  expect(await loadCoreContent('A')).toEqual({ towns: [], pages: [{ id: 'projecte' }], pageCopy: {}, agents: [], ownerUserId: 'A',
    personalitzacio: { taxonomia: null, estil: null } });
  expect(request).not.toHaveBeenCalled();
}));

/* ───────── I2 · Qui signa la publicació (contracte §7) ───────── */
const publicacio = (actor) => ({ id: 'S1', sectionId: 'mur', title: 'Fira', payload: { title: 'Fira' },
  ...(actor === undefined ? {} : { actor }) });
const filaEnviada = () => request.mock.calls[0][2].body[0];
const preparaPublicacio = () => { request.mockClear(); getCurrentUser.mockReturnValue({ id: 'U' }); };
test('signada per una entitat: author_org_id és l’entitat i el retorn ho porta', async () => {
  preparaPublicacio();
  const desada = await appendSectionSubmissionNetworkOnly(publicacio({ tipus: 'entitat', id: 'ORG' }));
  expect(filaEnviada()).toMatchObject({ owner_user_id: 'U', author_org_id: 'ORG', section_id: 'mur' });
  expect(desada.authorOrgId).toBe('ORG');
  expect(desada.payload).not.toHaveProperty('actor');
  expect(filaEnviada().payload).not.toHaveProperty('actor');
});
test('signada per la persona: author_org_id és null explícit', async () => {
  preparaPublicacio();
  const desada = await appendSectionSubmissionNetworkOnly(publicacio({ tipus: 'persona', id: 'U' }));
  expect(filaEnviada()).toHaveProperty('author_org_id', null);
  expect(desada.authorOrgId).toBeNull();
});
test('sense actor (crida d’abans d’I2): la columna no viatja i l’upsert no esborra cap signatura', async () => {
  preparaPublicacio();
  const desada = await appendSectionSubmissionNetworkOnly(publicacio());
  expect(filaEnviada()).not.toHaveProperty('author_org_id');
  expect(desada.authorOrgId).toBeNull();
});
/* T43 (ordre del Mestre, 260928) · Compartir una connexió copia el seu origen
   al payload, i section_submissions la llig tot el poble per REST: a qui l'ha
   enviada la persona (origen.abast) no hi pot arribar mai. */
test('compartir una connexió: l’abast de l’origen no arriba a la fila', async () => {
  preparaPublicacio();
  const origen = {
    tipus: 'connexio', itemId: 'sella', titol: 'Sella', sectionId: 'pobles', ruta: '/pobles/sella', objecte: 'poble',
    abast: { mode: 'persones', persones: [{ id: 'u-toni', nom: 'Toni' }, { id: 'u-maria', nom: 'Maria' }],
      aplicat: { persones: ['u-toni', 'u-maria'], grups: [], mur: false } }
  };
  const desada = await appendSectionSubmissionNetworkOnly({ id: 'S2', sectionId: 'mur', payload: { title: 'Sella', type: 'compartit', origen } });
  const fila = filaEnviada();
  expect(fila.payload.origen).toEqual({ tipus: 'connexio', itemId: 'sella', titol: 'Sella', sectionId: 'pobles', ruta: '/pobles/sella', objecte: 'poble' });
  expect(JSON.stringify(fila)).not.toMatch(/Toni|Maria|u-toni|u-maria|abast/);
  expect(desada.payload.origen).not.toHaveProperty('abast');
});
test('un origen desconegut no viatja a la fila', async () => {
  preparaPublicacio();
  await appendSectionSubmissionNetworkOnly({ id: 'S3', sectionId: 'mur', payload: { title: 'X', origen: { tipus: 'altra', abast: { mode: 'grups' } } } });
  expect(filaEnviada().payload).not.toHaveProperty('origen');
});
/* T5 (ordre del Mestre, 260930) · Un acte publicat sense dia viatja sense
   date: la fila no porta el dia UTC de la publicació com si fóra el de l'acte,
   que després el poble sencer llegiria com a triat per una persona. */
test('T5 · un acte sense dia no porta date a la fila; created_at és la publicació', async () => {
  preparaPublicacio();
  await appendSectionSubmissionNetworkOnly({ id: 'E1', sectionId: 'events', createdAt: '2026-09-30T22:30:00.000Z', payload: { title: 'Ball' } });
  expect(filaEnviada()).toMatchObject({ section_id: 'events', created_at: '2026-09-30T22:30:00.000Z' });
  expect(filaEnviada().payload).not.toHaveProperty('date');
  expect(filaEnviada().payload.created_at).toBe('2026-09-30T22:30:00.000Z');
});
test('una entitat sense id no es degrada a persona: no publica', async () => {
  preparaPublicacio();
  await expect(appendSectionSubmissionNetworkOnly(publicacio({ tipus: 'entitat', id: '' })))
    .rejects.toThrow('Falta l’entitat');
  expect(request).not.toHaveBeenCalled();
});

/* T2 (ordre del Mestre, 260930) · En mode de proves (seed o local) el Mur i
   la Multimèdia no fan cap petició, i una publicació no viatja al servidor:
   ho diu amb el codi neutral 'mode-local', sense cap petició. */
const LLAVOR = { feedPosts: [{ id: 'crònica' }], events: [{ id: 'aplec' }], marketItems: [{ id: 'mel' }], mediaItems: [{ id: 'foto' }] };
const ambMode = async (valor, cos) => {
  mode.actual = valor;
  try { await cos(); } finally { mode.actual = undefined; }
};
test('T2 · en mode seed, el Mur i la Multimèdia ixen de la llavor sense cap petició', () => ambMode('seed', async () => {
  request.mockClear();
  buildSeedAppData.mockResolvedValue(LLAVOR);
  expect(await loadMur('A')).toEqual({ feedPosts: LLAVOR.feedPosts, events: LLAVOR.events, marketItems: LLAVOR.marketItems });
  expect(await loadMultimedia('A')).toEqual({ mediaItems: LLAVOR.mediaItems });
  expect(request).not.toHaveBeenCalled();
}));
test('T2 · en mode local, el Mur i la Multimèdia són buits sense cap petició', () => ambMode('local', async () => {
  request.mockClear();
  expect(await loadMur('A')).toEqual({ feedPosts: [], events: [], marketItems: [] });
  expect(await loadMultimedia('A')).toEqual({ mediaItems: [] });
  expect(request).not.toHaveBeenCalled();
}));
for (const valor of ['seed', 'local']) {
  test(`T2 · en mode ${valor}, publicar rebutja amb code 'mode-local' sense cap petició`, () => ambMode(valor, async () => {
    preparaPublicacio();
    const error = await appendSectionSubmissionNetworkOnly(publicacio({ tipus: 'persona', id: 'U' })).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'mode-local', message: 'En mode de proves no es publica al servidor.' });
    expect(request).not.toHaveBeenCalled();
  }));
}
test('T2 · amb el mode remot declarat, publicar continua viatjant al servidor', () => ambMode('remote', async () => {
  preparaPublicacio();
  await appendSectionSubmissionNetworkOnly(publicacio({ tipus: 'persona', id: 'U' }));
  expect(request).toHaveBeenCalledTimes(1);
  expect(filaEnviada()).toMatchObject({ owner_user_id: 'U', section_id: 'mur' });
}));
