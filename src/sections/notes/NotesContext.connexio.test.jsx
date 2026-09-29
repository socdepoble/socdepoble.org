/* T54 · Compartir una connexió al Mur no publica el cos desat de la nota, que
   és privat (el llig qui la té, al seu MAS): el Mur rep un cos fet amb
   l'origen (connexions.js), i la nota desada no canvia. Fitxer propi: el
   gestor de desament (bgSaveManager) és d'àmbit de mòdul (com emoticona). */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn() }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: [], noteFolders: [], scopeKey: 'tenant-user', workspaceKey: 'session', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: null }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null }) }));
vi.mock('../../data/backendPort.js', () => ({ promoteToPublic: vi.fn(), teCapacitat: () => false }));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes } from './NotesContext';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
});
afterEach(cleanup);

const ORIGEN = {
  tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta',
  autorNom: 'Sóc de Poble', ruta: '/mercat/samarreta-socdepoble', objecte: 'producte',
  abast: { mode: 'poble', persones: [], grups: [] }
};
/* El cos d'una connexió d'abans de T54 (paràgraf fix) i el d'ara: tots dos parlen a qui la té. */
const COS_PRIVAT = '<p>Element connectat des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.</p>'
  + '<p>Ordena\'l a les teues carpetes, etiqueta\'l i, si vols, compartix-lo al teu mur.</p>'
  + '<p>Guardat al teu MAS per a llegir-lo quan vulgues.</p>';

const payloadEnviat = (index = 0) => mocks.send.mock.calls[index][0].payload;
const renderitza = () => renderHook(useNotes, { wrapper: NotesProvider }).result;

test('compartirNota d’una connexió envia al Mur un cos fet amb l’origen, no el cos desat', async () => {
  const result = renderitza();
  const connexio = { id: 'n-9', title: 'Samarreta', content: COS_PRIVAT, revision: 1, origen: ORIGEN };
  await act(async () => { expect(await result.current.compartirNota(connexio)).toBe(true); });
  const payload = payloadEnviat();
  expect(payload.type).toBe('compartit');
  expect(payload.content).toContain('Compartit des del Mercat de Sóc de Poble');
  expect(payload.content).toContain('href="/mercat/samarreta-socdepoble"');
  expect(payload.content).not.toMatch(/MAS|Guardat|Ordena|etiqueta|compartix-lo/);
  // La nota desada no canvia: el cos del Mur no es desa mai, i el que es desa és el que ja tenia.
  const cossosDesats = mocks.update.mock.calls.filter(([, canvis]) => 'content' in canvis).map(([, canvis]) => canvis.content);
  expect(cossosDesats.length).toBeGreaterThan(0);
  for (const cos of cossosDesats) expect(cos).not.toContain('Compartit des del');
  expect(cossosDesats.every((cos) => cos.includes('Guardat al teu MAS'))).toBe(true);
  expect(connexio.content).toBe(COS_PRIVAT);
  expect(mocks.update).toHaveBeenLastCalledWith('n-9', { isPublished: true, publishedSubmissionId: 'n-9' }, expect.any(Number));
});

test('una connexió sense ruta de l’original porta l’avís al Mur, i tampoc el cos desat', async () => {
  const result = renderitza();
  const connexio = { id: 'n-10', title: 'Pepa', content: COS_PRIVAT, revision: 1, origen: { ...ORIGEN, ruta: '' } };
  await act(async () => { await result.current.compartirNota(connexio); });
  expect(payloadEnviat().content).toContain('no porta l’enllaç de l’original');
  expect(payloadEnviat().content).not.toContain('<a ');
  expect(payloadEnviat().content).not.toContain('teu MAS');
});

test('una nota pròpia (sense origen) continua publicant el seu cos', async () => {
  const result = renderitza();
  await act(async () => { await result.current.publishNote({ id: 'propia', title: 'Hort', content: '<p>Tomaques de l’hort.</p>', revision: 1 }); });
  expect(payloadEnviat().type).toBe('feed');
  expect(payloadEnviat().content).toBe('<p>Tomaques de l’hort.</p>');
});

/* ── T71b · el contingut de fora al Mur: es compartix citant l'origen, una sola vegada ── */
const URL_EXTERN = 'https://exemple.org/recepta?id=7&pas=2';
const ORIGEN_EXTERN = { tipus: 'extern', url: URL_EXTERN, lloc: 'exemple.org', titol: 'Coca de llanda' };
const CITA_EXTERN = '<p>Font: <a href="https://exemple.org/recepta?id=7&amp;pas=2">exemple.org</a></p>';
const cites = (html) => html.split('href="https://exemple.org/recepta?id=7&amp;pas=2"').length - 1;
const extern = (canvis = {}) => ({ id: 'x-1', title: 'Coca de llanda', content: CITA_EXTERN, revision: 1, origen: ORIGEN_EXTERN, ...canvis });

test('T71b · un contingut de fora sense editar es compartix amb la cita una sola vegada (no duplicada)', async () => {
  const result = renderitza();
  await act(async () => { expect(await result.current.compartirNota(extern())).toBe(true); });
  const payload = payloadEnviat();
  expect(payload.type).toBe('compartit');
  expect(payload.origen).toMatchObject({ tipus: 'extern', url: URL_EXTERN });
  expect(cites(payload.content)).toBe(1);
  expect(payload.content.split('Font:')).toHaveLength(2);
  expect(mocks.toast).toHaveBeenCalledWith('Compartit al teu mur, citant l’origen.', 'success');
});

test('T71b · publishNote d’un contingut de fora també el compartix: mai es publica com a propi', async () => {
  const result = renderitza();
  await act(async () => { await result.current.publishNote(extern({ id: 'x-2' })); });
  expect(payloadEnviat().type).toBe('compartit');
  expect(payloadEnviat().origen).toMatchObject({ tipus: 'extern', url: URL_EXTERN });
  // I una connexió, tampoc: la crida sense mode no la fa passar per pròpia.
  await act(async () => { await result.current.publishNote({ id: 'n-11', title: 'Samarreta', content: COS_PRIVAT, revision: 1, origen: ORIGEN }); });
  expect(payloadEnviat(1).type).toBe('compartit');
  expect(payloadEnviat(1).content).toContain('Compartit des del Mercat de Sóc de Poble');
});

test('T71b · editat: el cos de la persona ix, i la cita s’afig només si ja no la porta', async () => {
  const result = renderitza();
  // La persona ha esborrat la cita: s'afig al final.
  await act(async () => { await result.current.compartirNota(extern({ id: 'x-3', content: '<p>La meua versió de la coca.</p>' })); });
  const senseCita = payloadEnviat(0).content;
  expect(senseCita.startsWith('<p>La meua versió de la coca.</p>')).toBe(true);
  expect(cites(senseCita)).toBe(1);
  // L'editor ha reescrit la cita (atributs en un altre ordre) i hi ha afegit text: no es duplica.
  const reescrita = '<p>Afegit meu.</p><p>Font: <a target="_blank" rel="noopener noreferrer nofollow" href="https://exemple.org/recepta?id=7&amp;pas=2">exemple.org</a></p>';
  await act(async () => { await result.current.compartirNota(extern({ id: 'x-4', content: reescrita })); });
  const ambCita = payloadEnviat(1).content;
  expect(ambCita).toContain('Afegit meu.');
  expect(cites(ambCita)).toBe(1);
  expect(ambCita.split('Font:')).toHaveLength(2);
});

test('T71b · cap imatge de l’altra web arriba al Mur: ni al cos ni com a portada', async () => {
  const result = renderitza();
  const ambImatge = extern({
    id: 'x-5',
    content: `<p><img src="https://exemple.org/foto.jpg" alt="Coca"></p>${CITA_EXTERN}`,
    coverImage: 'https://exemple.org/foto.jpg'
  });
  await act(async () => { await result.current.compartirNota(ambImatge); });
  const payload = payloadEnviat();
  expect(payload.content).not.toContain('src="https://exemple.org');
  expect(payload.image).not.toContain('exemple.org');
  expect(cites(payload.content)).toBe(1);
});
