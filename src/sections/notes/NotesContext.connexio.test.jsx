/* D4 (excepció del Mestre, 260930; desfà T54) · La connexió és una còpia
   editable: compartir-la al Mur publica el cos EDITAT, sense els paràgrafs
   fixos que parlen a qui la té, i hi afig la presentació de l'original
   (enllaç i autoria) només si el cos ja no l'enllaça. Els drets són els de
   l'original (origen.drets). La nota desada no canvia. Abans (T54) el Mur
   rebia sempre un cos fet només amb l'origen: les asercions que ho fixaven
   s'han actualitzat a l'ordre nova. Fitxer propi: el gestor de desament
   (bgSaveManager) és d'àmbit de mòdul (com emoticona). */
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

test('D4 · compartirNota d’una connexió sense editar: el cos desat sense els paràgrafs privats, amb l’enllaç una sola vegada', async () => {
  const result = renderitza();
  const connexio = { id: 'n-9', title: 'Samarreta', content: COS_PRIVAT, revision: 1, origen: ORIGEN };
  await act(async () => { expect(await result.current.compartirNota(connexio)).toBe(true); });
  const payload = payloadEnviat();
  expect(payload.type).toBe('compartit');
  expect(payload.content).toContain('Element connectat des del Mercat de Sóc de Poble');
  expect(payload.content.split('href="/mercat/samarreta-socdepoble"')).toHaveLength(2);
  // El cos ja enllaça l'original: la presentació no es duplica.
  expect(payload.content).not.toContain('Compartit des del');
  expect(payload.content).not.toMatch(/MAS|Guardat|Ordena|etiqueta|compartix-lo/);
  // La nota desada no canvia: el cos del Mur no es desa mai, i el que es desa és el que ja tenia.
  const cossosDesats = mocks.update.mock.calls.filter(([, canvis]) => 'content' in canvis).map(([, canvis]) => canvis.content);
  expect(cossosDesats.length).toBeGreaterThan(0);
  for (const cos of cossosDesats) expect(cos).not.toContain('Compartit des del');
  expect(cossosDesats.every((cos) => cos.includes('Guardat al teu MAS'))).toBe(true);
  expect(connexio.content).toBe(COS_PRIVAT);
  expect(mocks.update).toHaveBeenLastCalledWith('n-9', { isPublished: true, publishedSubmissionId: 'n-9' }, expect.any(Number));
});

test('D4 · una connexió sense ruta de l’original: el cos editat i, al final, la presentació amb l’avís', async () => {
  const result = renderitza();
  const cos = '<p>Element connectat des del directori: <strong>Pepa</strong>.</p><p>Connectat per a llegir-lo més tard.</p>';
  const connexio = { id: 'n-10', title: 'Pepa', content: cos, revision: 1, origen: { ...ORIGEN, ruta: '' } };
  await act(async () => { await result.current.compartirNota(connexio); });
  const contingut = payloadEnviat().content;
  expect(contingut.startsWith('<p>Element connectat des del directori')).toBe(true);
  expect(contingut).toContain('Compartit des del Mercat de Sóc de Poble: <strong>Samarreta</strong>');
  expect(contingut).toContain('no porta l’enllaç de l’original');
  expect(contingut).not.toContain('<a ');
  expect(contingut).not.toMatch(/teu MAS|llegir-lo més tard/);
});

test('D4 · una connexió EDITADA publica el text de la persona i hi afig l’enllaç i l’autoria de l’original', async () => {
  const result = renderitza();
  const editada = { id: 'n-12', title: 'Samarreta', content: '<p>La porte a la fira.</p>', revision: 1, origen: ORIGEN };
  await act(async () => { expect(await result.current.compartirNota(editada)).toBe(true); });
  const contingut = payloadEnviat().content;
  expect(contingut.startsWith('<p>La porte a la fira.</p>')).toBe(true);
  expect(contingut).toContain('Compartit des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble"');
  expect(contingut.split('href="/mercat/samarreta-socdepoble"')).toHaveLength(2);
});

test('D4 · amb origen.drets, el payload porta els drets de l’original, no els de la nota', async () => {
  const result = renderitza();
  const ambDrets = { id: 'n-13', title: 'Samarreta', content: COS_PRIVAT, revision: 1, copyright: 'CC0 1.0', origen: { ...ORIGEN, drets: '© Pepa Soler' } };
  await act(async () => { await result.current.compartirNota(ambDrets); });
  expect(payloadEnviat(0).copyright).toBe('© Pepa Soler');
  expect(payloadEnviat(0).origen).toMatchObject({ drets: '© Pepa Soler' });
  /* Revisió de D4 (260930) · Abans, sense drets a l'origen, hi anaven els de
     la nota («CC0 1.0»): triar una llicència a la còpia relicenciava l'obra
     d'altri. Ara cap copyright propi (''), i el Mur pinta el seu text de
     sèrie. Una nota pròpia continua publicant els seus i mai pren els d'un origen. */
  await act(async () => { await result.current.compartirNota({ ...ambDrets, id: 'n-14', origen: ORIGEN }); });
  expect(payloadEnviat(1).copyright).toBe('');
  await act(async () => { await result.current.publishNote({ id: 'propia-2', title: 'Hort', content: '<p>x</p>', revision: 1, copyright: 'CC BY 4.0' }); });
  expect(payloadEnviat(2).copyright).toBe('CC BY 4.0');
});

test('Revisió de D4 · compartir una connexió no desa cap copyright a la nota, ni el de l’original que li pinta l’editor', async () => {
  const result = renderitza();
  // NotesEditor li passa el document amb copyright = origen.drets (el que pinta): no s'ha d'escriure a la nota.
  const comLaPintaLEditor = { id: 'n-15', title: 'Samarreta', content: COS_PRIVAT, revision: 1, copyright: '© Pepa Soler', origen: { ...ORIGEN, drets: '© Pepa Soler' } };
  await act(async () => { expect(await result.current.compartirNota(comLaPintaLEditor)).toBe(true); });
  expect(payloadEnviat(0).copyright).toBe('© Pepa Soler');
  const canvisDeLaNota = mocks.update.mock.calls.filter(([id]) => id === 'n-15').map(([, canvis]) => canvis);
  expect(canvisDeLaNota.some((canvis) => 'content' in canvis)).toBe(true);
  expect(canvisDeLaNota.some((canvis) => 'copyright' in canvis)).toBe(false);
  // Una nota pròpia sí que desa el seu copyright abans de publicar (el desat de sempre).
  await act(async () => { await result.current.publishNote({ id: 'propia-3', title: 'Hort', content: '<p>x</p>', revision: 1, copyright: 'CC BY 4.0' }); });
  expect(mocks.update.mock.calls.some(([id, canvis]) => id === 'propia-3' && canvis.copyright === 'CC BY 4.0')).toBe(true);
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
  // D4 · el cos que ix és el de la nota (ja enllaça l'original), sense els paràgrafs privats.
  await act(async () => { await result.current.publishNote({ id: 'n-11', title: 'Samarreta', content: COS_PRIVAT, revision: 1, origen: ORIGEN }); });
  expect(payloadEnviat(1).type).toBe('compartit');
  expect(payloadEnviat(1).content).toContain('Element connectat des del Mercat de Sóc de Poble');
  expect(payloadEnviat(1).content).not.toMatch(/teu MAS|Ordena/);
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
