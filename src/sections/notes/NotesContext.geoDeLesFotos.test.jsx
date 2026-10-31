/* P1-64 (pla 261028_1526 §3.1.1; contracte de dades del Mapa, Mestre 261028)
   · publishNote deriva l'índex del Mapa fotogràfic: payload.fotos_geo (les
   fotos del cos amb data-*) i payload.geolocalitzacio i payload.dataCaptura
   del hero (el seu EXIF). Sense res, cap clau; si la lectura falla, la
   publicació ix igual. Fitxer propi: el gestor de desament (bgSaveManager) és
   d'àmbit de mòdul. */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn(), promou: vi.fn(), resol: vi.fn(), capacitats: new Set() }));
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
vi.mock('../../data/backendPort.js', () => ({
  promoteToPublic: (...args) => mocks.promou(...args),
  resolveAsset: (...args) => mocks.resol(...args),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat)
}));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes } from './NotesContext';
import { ajustaPrecisioGps } from '../../components/universal/enquadrament/exifIncrustat.js';
import { APP0_JFIF, IMATGE, SOI, app1Exif, concatena, dataOriginal, gpsTorre, tiff } from '../../../tests/helpers/jpegProva.js';

const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const heroAmbGps = (precisio) => `data:image/jpeg;base64,${aBase64(concatena(SOI, APP0_JFIF,
  app1Exif(ajustaPrecisioGps(tiff({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() }), precisio)), IMATGE))}`;
const HERO_NET = `data:image/jpeg;base64,${aBase64(concatena(SOI, APP0_JFIF, IMATGE))}`;
const COS = '<p>La font</p><img src="/assets/uploads/notes/font.webp" alt="Font" data-lat="38.592" data-lng="-0.418" data-precisio="100m" data-captura="2017-05-14T10:22:33">';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.capacitats = new Set();
  mocks.promou.mockReset().mockImplementation(async (ref) => ref.replace('mitjans_privats/', 'mitjans/'));
  mocks.resol.mockReset();
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
});
afterEach(cleanup);

const payloadEnviat = (index = 0) => mocks.send.mock.calls[index][0].payload;
const publica = async (nota) => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote(nota)).toBe(true); });
};

test('el hero en data: URL amb GPS porta geolocalitzacio (a la precisió del fitxer) i dataCaptura; el cos, fotos_geo', async () => {
  await publica({ id: 'font', title: 'La font', content: COS, revision: 1, coverImage: heroAmbGps('poble') });
  const payload = payloadEnviat();
  expect(payload.geolocalitzacio).toEqual({ lat: 38.59, lng: -0.42, altitud: 500, precisio: 'poble', precisio_m: 1000, origen: 'exif' });
  expect(payload.dataCaptura).toBe('2017-05-14T10:22:33');
  expect(payload.fotos_geo).toEqual([
    { src: '/assets/uploads/notes/font.webp', lat: 38.592, lng: -0.418, precisio: '100m', precisio_m: 100, dataCaptura: '2017-05-14T10:22:33' },
  ]);
});

test('sense GPS al hero ni registre al cos: cap clau nova', async () => {
  await publica({ id: 'neta', title: 'Neta', content: '<p>Text</p><img src="/assets/a.webp" alt="A">', revision: 1, coverImage: HERO_NET });
  const payload = payloadEnviat();
  for (const clau of ['geolocalitzacio', 'dataCaptura', 'fotos_geo']) expect(payload).not.toHaveProperty(clau);
});

test('sense capçalera pròpia (la reserva) no es llig res; el hero del bucket públic es llig pel port', async () => {
  await publica({ id: 'reserva', title: 'R', content: '', revision: 1 });
  expect(payloadEnviat()).not.toHaveProperty('geolocalitzacio');
  expect(mocks.resol).not.toHaveBeenCalled();
  cleanup();
  mocks.send.mockClear();
  mocks.capacitats = new Set(['mitjans']);
  mocks.resol.mockRejectedValue(new Error('Sense xarxa.'));
  await publica({ id: 'remot', title: 'R', content: '', revision: 1, coverImage: 'sdp-media://mitjans_privats/tenant/U/hero.webp' });
  // Promoguda al públic, es demana la URL; la lectura falla i la publicació ix igual, sense la clau.
  expect(mocks.resol).toHaveBeenCalledWith('sdp-media://mitjans/tenant/U/hero.webp', expect.anything());
  expect(payloadEnviat().image).toBe('sdp-media://mitjans/tenant/U/hero.webp');
  expect(payloadEnviat()).not.toHaveProperty('geolocalitzacio');
});

/* Revisió adversarial 261028 (mutants N1 i N3) · Compartir és d'altri: ni les
   fotos del cos amb registre ni el hero amb GPS no entren a l'índex del Mapa,
   ni amb compartirNota ni quan la nota porta un origen (una connexió). */
test('compartir (compartirNota o una connexió): cap fotos_geo, geolocalitzacio ni dataCaptura', async () => {
  const ORIGEN = {
    tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta',
    autorNom: 'Sóc de Poble', ruta: '/mercat/samarreta-socdepoble', objecte: 'producte', abast: { mode: 'poble', persones: [], grups: [] },
  };
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  const nota = { id: 'altri', title: 'Altri', content: COS, revision: 1, coverImage: heroAmbGps('exacta') };
  await act(async () => { expect(await result.current.compartirNota(nota)).toBe(true); });
  await act(async () => { expect(await result.current.publishNote({ ...nota, id: 'connexio', origen: ORIGEN })).toBe(true); });
  expect(mocks.send).toHaveBeenCalledTimes(2);
  for (const index of [0, 1]) {
    const payload = payloadEnviat(index);
    expect(payload.type).toBe('compartit');
    for (const clau of ['geolocalitzacio', 'dataCaptura', 'fotos_geo']) expect(payload, `${index} ${clau}`).not.toHaveProperty(clau);
  }
  // La mateixa nota, publicada com a pròpia, sí que en porta (la prova no és buida).
  await act(async () => { expect(await result.current.publishNote({ ...nota, id: 'propia' })).toBe(true); });
  expect(payloadEnviat(2)).toMatchObject({ type: 'feed', fotos_geo: [expect.objectContaining({ precisio: '100m' })], geolocalitzacio: expect.objectContaining({ precisio: 'exacta' }) });
});
