/* Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre: la plantilla
   de format «s'esvaeix al primer clic»; verificació de la MCR: publishNote no
   filtrava la llavor) · La plantilla verge no arriba mai al Mur: ni la d'ara
   ni la d'abans, ni escrita en diverses línies ni tal com la torna TipTap. El
   títol es publica amb el cos buit. Un cos amb qualsevol text propi, també
   barrejat amb la plantilla, es publica tal qual. Fitxer propi: el gestor de
   desament (bgSaveManager) és d'àmbit de mòdul (com NotesContext.emoticona). */
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
import { LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA } from './llavorNota.js';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
});
afterEach(cleanup);

const compacta = (html) => html.replace(/>\s+</g, '><');
const payloadEnviat = () => mocks.send.mock.calls.at(-1)[0].payload;
let comptador = 0;
const publica = async (content) => {
  comptador += 1;
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote({ id: `nota-${comptador}`, title: 'Hort de maig', content, revision: 1 })).toBe(true); });
  const payload = payloadEnviat();
  cleanup();
  return payload;
};

test('la plantilla verge (la d’ara o la d’abans, en qualsevol forma) es publica amb el cos buit', async () => {
  for (const llavor of [LLAVOR_NOTA, compacta(LLAVOR_NOTA), LLAVOR_NOTA_ANTIGA, compacta(LLAVOR_NOTA_ANTIGA)]) {
    const payload = await publica(llavor);
    expect(payload.content).toBe('');
    expect(payload.title).toBe('Hort de maig');
    expect(JSON.stringify(payload)).not.toMatch(/plantilla de format|Heading 3/);
  }
});

test('un cos amb text propi es publica tal qual, també barrejat amb la plantilla', async () => {
  expect((await publica('<p>Comprar planter</p>')).content).toBe('<p>Comprar planter</p>');
  const barrejat = compacta(LLAVOR_NOTA).replace('<h3>Títol de secció (H3)</h3>', '<h3>Títol de secció (H3)</h3><p>Ho he escrit jo</p>');
  const payload = await publica(barrejat);
  expect(payload.content).toContain('Ho he escrit jo');
  expect(payload.content).not.toBe('');
});

/* Gauntlet 261017 (C02, auditoria Codex) · Una coincidència de text no és la
   plantilla: la fotografia, l'enllaç, la negreta o el títol canviat que la
   persona hi ha posat arriben al Mur amb tot el cos, mai amb el cos buit. */
test.each([
  ['una fotografia pròpia', `${LLAVOR_NOTA}<p><img src="/assets/fotos/hort.jpg" alt="La meua foto"></p>`, '/assets/fotos/hort.jpg'],
  ['un enllaç propi', LLAVOR_NOTA.replace('Una llista amb pics', '<a href="https://example.org/personal">Una llista amb pics</a>'), 'https://example.org/personal'],
  ['una negreta', compacta(LLAVOR_NOTA).replace('El segon pas de la llista', '<strong>El segon pas de la llista</strong>'), '<strong>El segon pas de la llista</strong>'],
  ['l’H3 passat a H2', compacta(LLAVOR_NOTA).replace('<h3>', '<h2>').replace('</h3>', '</h2>'), '<h2>Títol de secció (H3)</h2>']
])('la plantilla amb %s es publica amb el cos sencer', async (_cas, content, esperat) => {
  const payload = await publica(content);
  expect(payload.content).toContain(esperat);
  expect(payload.content).toContain('Un paràgraf de prova davall d’un subtítol H4.');
});
