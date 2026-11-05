/**
 * R12 (Onada R6, Bloc 4, B4-S1) · La revisió editorial passa pel port quan el
 * backend anuncia `edicioEditorial`, i es queda al navegador (ordre del
 * Mestre) en mode seed/local, sense RPC, sense superadmin, sense versió o si el
 * servidor la rebutja.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { STORAGE_PREFIX } from '../config/storage.js';

const port = vi.hoisted(() => ({ capacitats: new Set(), edita: vi.fn() }));
vi.mock('./backendPort.js', () => ({
  teCapacitat: (cap) => port.capacitats.has(cap),
  adminActualitzaPublicacioEditorial: (...args) => port.edita(...args)
}));

import {
  _reiniciaRevisionsEditorialsPerAProves,
  desaRevisioEditorialAmbServidor,
  rebutjadaPelServidor,
  revisaElement,
  revisioEditorial
} from './revisionsEditorials.js';

const CLAU = `${STORAGE_PREFIX}publicacions.revisions.v1`;
const REMOT = Object.freeze({ dataMode: 'remote', tenantId: '11111111-1111-4111-8111-111111111111' });
const MANIFEST = Object.freeze({ id: 'manifest-de-poble', title: 'Manifest', entradilla: 'Resum', content: '<p>Vell</p>', image_url: '/a.webp', _editorialClau: 'feedPosts', _editorialVersio: 7 });
const CAMPS = Object.freeze({ title: 'Manifest revisat', lead: 'Nou resum', content: '<p>Nou</p>', heroImage: '/b.webp' });
const opcions = (extra = {}) => ({ esSuperadmin: true, config: REMOT, ...extra });

beforeEach(() => {
  _reiniciaRevisionsEditorialsPerAProves();
  port.capacitats = new Set(['edicioEditorial']);
  port.edita.mockReset();
});

describe('sense servidor: la revisió es desa al navegador com sempre', () => {
  test('sense la capacitat (cap RPC anunciada) no es crida el port i la revisió hi és', async () => {
    port.capacitats = new Set();
    await expect(desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions())).resolves.toEqual({ desada: true, desti: 'navegador', motiu: 'sense-rpc' });
    expect(port.edita).not.toHaveBeenCalled();
    expect(revisioEditorial('mur', MANIFEST.id)).toMatchObject({ content: '<p>Nou</p>' });
    expect(JSON.parse(window.localStorage.getItem(CLAU))['mur:manifest-de-poble'].camps.title).toBe('Manifest revisat');
  });

  test('en mode seed o local, encara que la capacitat hi siga, no ix del navegador', async () => {
    for (const dataMode of ['seed', 'local']) {
      await expect(desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions({ config: { dataMode } }))).resolves.toMatchObject({ desti: 'navegador', motiu: 'mode-navegador' });
    }
    await expect(desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions({ config: null }))).resolves.toMatchObject({ desti: 'navegador', motiu: 'mode-navegador' });
    expect(port.edita).not.toHaveBeenCalled();
  });

  test('sense superadmin, sense versió o amb una fila d’una altra secció, tampoc', async () => {
    await expect(desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions({ esSuperadmin: false }))).resolves.toMatchObject({ motiu: 'sense-permis' });
    const { _editorialVersio, ...senseVersio } = MANIFEST;
    expect(_editorialVersio).toBe(7);
    await expect(desaRevisioEditorialAmbServidor('mur', senseVersio, CAMPS, opcions())).resolves.toMatchObject({ desti: 'navegador', motiu: 'sense-versio' });
    await expect(desaRevisioEditorialAmbServidor('events', { ...MANIFEST }, CAMPS, opcions())).resolves.toMatchObject({ motiu: 'sense-fila' });
    expect(port.edita).not.toHaveBeenCalled();
  });

  test('una revisió invàlida no es desa enlloc', async () => {
    await expect(desaRevisioEditorialAmbServidor('mercat', MANIFEST, CAMPS, opcions())).resolves.toEqual({ desada: false, desti: null, motiu: 'invalida' });
    expect(port.edita).not.toHaveBeenCalled();
  });
});

describe('amb la RPC: el port rep la revisió amb els camps blancs i la versió', () => {
  test('crida adminActualitzaPublicacioEditorial amb la secció, l’id, els camps del servidor i la versió del lector', async () => {
    port.edita.mockResolvedValue({ item: { id: MANIFEST.id }, versio: 8 });
    await expect(desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions())).resolves.toEqual({ desada: true, desti: 'servidor', motiu: null, versio: 8 });
    expect(port.edita).toHaveBeenCalledTimes(1);
    const [edicio, config] = port.edita.mock.calls[0];
    expect(edicio).toEqual({ seccio: 'mur', id: 'manifest-de-poble', versio: 7, canvis: { title: 'Manifest revisat', entradilla: 'Nou resum', content: '<p>Nou</p>', image_url: '/b.webp' } });
    expect(config).toMatchObject(REMOT);
    /* Mentre el lector porta la versió 7, la revisió es veu; amb la 8 (o més), mana la fila. */
    expect(revisaElement('mur', MANIFEST).content).toBe('<p>Nou</p>');
    const fila8 = { ...MANIFEST, content: '<p>Del servidor</p>', _editorialVersio: 8 };
    expect(revisaElement('mur', fila8)).toBe(fila8);
    expect(JSON.parse(window.localStorage.getItem(CLAU))['mur:manifest-de-poble'].servidor).toEqual({ versio: 8 });
  });

  test('la desada següent usa la versió confirmada i envia la revisió sencera', async () => {
    port.edita.mockResolvedValueOnce({ versio: 8 }).mockResolvedValueOnce({ versio: 9 });
    await desaRevisioEditorialAmbServidor('mur', MANIFEST, { content: '<p>Primera</p>' }, opcions());
    await desaRevisioEditorialAmbServidor('mur', MANIFEST, { title: 'Segona' }, opcions());
    expect(port.edita.mock.calls[1][0]).toMatchObject({ versio: 8, canvis: { content: '<p>Primera</p>', title: 'Segona' } });
  });

  test('si el servidor la rebutja, la revisió es queda al navegador i el resultat ho diu', async () => {
    for (const code of ['conflicte-versio', 'cal-segon-factor', 'no-disponible']) {
      port.edita.mockRejectedValueOnce(Object.assign(new Error(code), { code }));
      const resultat = await desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions());
      expect(resultat).toEqual({ desada: true, desti: 'navegador', motiu: code });
      expect(rebutjadaPelServidor(resultat)).toBe(true);
    }
    port.edita.mockRejectedValueOnce(new DOMException('La sessió ha canviat.', 'AbortError'));
    await expect(desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions())).resolves.toMatchObject({ motiu: 'avortada' });
    expect(revisioEditorial('mur', MANIFEST.id)).toMatchObject({ content: '<p>Nou</p>' });
    expect(revisaElement('mur', MANIFEST).content).toBe('<p>Nou</p>');
    expect(rebutjadaPelServidor({ desti: 'navegador', motiu: 'sense-rpc' })).toBe(false);
  });

  test('una resposta sense versió vàlida no marca la revisió com a servida', async () => {
    port.edita.mockResolvedValue({ item: {} });
    await expect(desaRevisioEditorialAmbServidor('mur', MANIFEST, CAMPS, opcions())).resolves.toMatchObject({ desti: 'navegador', motiu: 'resposta-invalida' });
    expect(JSON.parse(window.localStorage.getItem(CLAU))['mur:manifest-de-poble']).not.toHaveProperty('servidor');
  });
});

describe('àrbitre B4-S1 · la marca de servidor no amaga una revisió que el servidor no té', () => {
  test('una desada posterior en cua que el servidor rebutja continua manant al lector', async () => {
    let allibera;
    port.edita
      .mockImplementationOnce(() => new Promise((resol) => { allibera = () => resol({ versio: 8 }); }))
      .mockRejectedValueOnce(Object.assign(new Error('conflicte'), { code: 'conflicte-versio' }));
    const primera = desaRevisioEditorialAmbServidor('mur', MANIFEST, { content: '<p>A</p>' }, opcions());
    await vi.waitFor(() => expect(port.edita).toHaveBeenCalledTimes(1));
    const segona = desaRevisioEditorialAmbServidor('mur', MANIFEST, { title: 'B' }, opcions());
    allibera();
    await expect(primera).resolves.toMatchObject({ desti: 'servidor', versio: 8 });
    await expect(segona).resolves.toMatchObject({ desti: 'navegador', motiu: 'conflicte-versio' });
    const fila8 = { ...MANIFEST, content: '<p>A</p>', _editorialVersio: 8 };
    expect(revisaElement('mur', fila8).title).toBe('B');
  });

  test('si s’esborra la data (null), la RPC no la pot esborrar i la còpia del navegador no es marca', async () => {
    port.edita.mockResolvedValue({ versio: 8 });
    await desaRevisioEditorialAmbServidor('mur', { ...MANIFEST, publish_date: '2026-01-01' }, { title: 'T', publishDate: null }, opcions());
    expect(port.edita.mock.calls[0][0].canvis).toEqual({ title: 'T' });
    expect(JSON.parse(window.localStorage.getItem(CLAU))['mur:manifest-de-poble']).not.toHaveProperty('servidor');
  });
});
