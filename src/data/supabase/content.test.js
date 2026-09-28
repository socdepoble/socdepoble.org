import { expect, test, vi } from 'vitest';
const request = vi.hoisted(() => vi.fn(async () => []));
vi.mock('./runtime.js', () => ({ request, getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: 'town' }),
  APP_SEED_VERSION: 1, buildSeedAppData: vi.fn(), generateUUID: vi.fn(), getCurrentUser: vi.fn(), mapContentRowsToData: vi.fn() }));
vi.mock('./xat.js', () => ({ enviaMissatge: vi.fn() }));
import { appendSectionSubmissionNetworkOnly, loadMur, loadMultimedia, loadAppData, loadCoreContent } from './content.js';
import { getCurrentUser, buildSeedAppData, mapContentRowsToData } from './runtime.js';
test('Mur i Multimèdia no consulten Notes ni descarreguen app_content alié', async () => {
  await loadMur('A'); await loadMultimedia('A');
  const urls = request.mock.calls.map(([url]) => url);
  expect(urls).toHaveLength(6);
  expect(urls.every(url => !url.includes('/notes') && !url.includes('section_id=eq.notes'))).toBe(true);
  expect(urls.filter(url => url.includes('app_content')).every(url => url.includes('key=in.('))).toBe(true);
  expect(urls.filter(url => url.includes('section_submissions')).every(url => url.includes('section_id=eq.'))).toBe(true);
});

test('un backend nou buit és un estat remot vàlid sense notes o comptes seed', async () => {
  request.mockClear();
  request.mockResolvedValue([]);
  getCurrentUser.mockReturnValue(null);
  mapContentRowsToData.mockReturnValue({ notes: [], agents: [], towns: [] });
  const result = await loadAppData('A');
  expect(result).toMatchObject({ notes: [], agents: [], towns: [] });
  expect(result).not.toHaveProperty('seedVersion');
});

test('el core remot conserva documents estàtics, però identitats i pobles només venen del servidor', async () => {
  request.mockClear();
  buildSeedAppData.mockResolvedValue({ pages: [{ id: 'projecte' }], towns: [{ id: 'demo-town' }], agents: [{ id: 'demo-agent' }] });
  mapContentRowsToData.mockReturnValue({ towns: [], agents: [] });
  expect(await loadCoreContent('A')).toEqual({ ownerUserId: 'A', pages: [{ id: 'projecte' }], pageCopy: {}, towns: [], agents: [] });
});

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
test('una entitat sense id no es degrada a persona: no publica', async () => {
  preparaPublicacio();
  await expect(appendSectionSubmissionNetworkOnly(publicacio({ tipus: 'entitat', id: '' })))
    .rejects.toThrow('Falta l’entitat');
  expect(request).not.toHaveBeenCalled();
});
