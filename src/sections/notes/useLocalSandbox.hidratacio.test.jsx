/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) · La guarda
   d'hidratació (isHydrated) de la còpia de prova del Foraster
   (useLocalSandbox). La còpia es pinta en l'acte amb la nota de benvinguda i
   l'esborrany desat arriba d'IndexedDB després: en un Android lent, centenars
   de mil·lisegons. Una tecla (un espai) o el buidatge de la llavor al primer
   focus en eixe interval no pot escriure al disc ni trepitjar el que ja hi
   havia desat.
   El disc es fa en memòria amb el mateix llegir-modificar-escriure de
   mutateDraft, i la lectura inicial (getDraftsForScope) la deixem anar a mà
   (hidrata), com faria un IndexedDB lent. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { backendScope } from '../../config/backendConfig.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

const disc = vi.hoisted(() => ({ registres: new Map(), lectures: [] }));
vi.mock('./GlobalSaveManager.js', () => ({
  getDraftsForScope: vi.fn((ambit) => new Promise((resolve) => { disc.lectures.push({ ambit, resolve }); })),
  mutateDraft: vi.fn(async (clau, transforma) => {
    const registre = transforma(disc.registres.get(clau) || {});
    if (registre == null) disc.registres.delete(clau);
    else disc.registres.set(clau, registre);
    return registre;
  })
}));
import { mutateDraft } from './GlobalSaveManager.js';
import { useLocalSandbox } from './useLocalSandbox.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-0000000000a1' });
const AMBIT = `sandbox:${backendScope(CONFIG)}`;
const ID = 'copia-de-prova';
const CLAU = `${AMBIT}:${ID}`;
/* Estable entre pintades, com el sandboxInitial memoritzat de NotesEditor. */
const INICIAL = Object.freeze({ id: ID, title: 'Benvinguda', subtitle: '', content: '<p>Benvinguda al Bloc</p>', revision: 0 });

const avisa = vi.fn();
const munta = () => renderHook(() => useLocalSandbox(INICIAL, CONFIG, avisa));
/* La lectura d'IndexedDB acaba: torna el que hi ha al disc per a l'àmbit. */
async function hidrata() {
  await act(async () => {
    for (const { ambit, resolve } of disc.lectures.splice(0)) {
      const esborranys = {};
      for (const [clau, registre] of disc.registres) {
        if (clau.startsWith(`${ambit}:`)) esborranys[clau.slice(ambit.length + 1)] = registre;
      }
      resolve(esborranys);
    }
  });
}

beforeEach(() => {
  disc.registres.clear();
  disc.lectures.length = 0;
  vi.mocked(mutateDraft).mockClear();
  avisa.mockReset();
});
afterEach(cleanup);

test('AH-R17-11 · un espai teclejat abans d’hidratar no escriu al disc ni trepitja el títol desat', async () => {
  disc.registres.set(CLAU, { title: 'La meua recepta', content: '<p>Tomaca de penjar</p>' });
  const { result } = munta();
  // Encara sense hidratar: la benvinguda, i la persona ja hi pot escriure.
  expect(result.current[0].title).toBe('Benvinguda');
  act(() => { result.current[1](ID, 'title', 'Benvinguda '); });
  expect(result.current[0].title).toBe(sanitizeHtml('Benvinguda '));
  // Res no ix cap al disc fins que la lectura inicial acaba.
  expect(mutateDraft).not.toHaveBeenCalled();
  expect(disc.registres.get(CLAU)).toEqual({ title: 'La meua recepta', content: '<p>Tomaca de penjar</p>' });

  await hidrata();
  // L'espai partia de la benvinguda, no de l'esborrany: guanya el desat.
  expect(result.current[0]).toMatchObject({ title: 'La meua recepta', content: '<p>Tomaca de penjar</p>' });
  expect(disc.registres.get(CLAU)).toEqual({ title: 'La meua recepta', content: '<p>Tomaca de penjar</p>' });
  // L'editor s'ha de tornar a muntar amb el desat: la revisió ho diu.
  expect(result.current[2]).toBe(1);
});

test('AH-R17-11 · el cos buidat (la llavor al primer focus) abans d’hidratar no esborra el cos desat', async () => {
  disc.registres.set(CLAU, { content: '<p>Tomaca de penjar</p>' });
  const { result } = munta();
  act(() => { result.current[1](ID, 'content', ''); });
  expect(mutateDraft).not.toHaveBeenCalled();
  await hidrata();
  expect(result.current[0].content).toBe('<p>Tomaca de penjar</p>');
  expect(disc.registres.get(CLAU)).toEqual({ content: '<p>Tomaca de penjar</p>' });
});

test('AH-R17-11 · el que es tecleja en un camp que l’esborrany no té es conserva, es pinta i es desa en hidratar', async () => {
  disc.registres.set(CLAU, { title: 'La meua recepta' });
  const { result } = munta();
  act(() => { result.current[1](ID, 'subtitle', 'Per a dinar'); });
  expect(mutateDraft).not.toHaveBeenCalled();
  await hidrata();
  expect(result.current[0]).toMatchObject({ title: 'La meua recepta', subtitle: sanitizeHtml('Per a dinar') });
  expect(disc.registres.get(CLAU)).toEqual({ title: 'La meua recepta', subtitle: sanitizeHtml('Per a dinar') });
  // Res no s'ha descartat: l'editor no es torna a muntar.
  expect(result.current[2]).toBe(0);
});

test('AH-R17-11 · si el camp desat és el mateix que el de la benvinguda, el que s’ha teclejat partia d’ell i guanya', async () => {
  disc.registres.set(CLAU, { title: 'Benvinguda', content: '<p>Meu</p>' });
  const { result } = munta();
  act(() => { result.current[1](ID, 'title', 'Benvinguda!'); });
  await hidrata();
  expect(result.current[0]).toMatchObject({ title: sanitizeHtml('Benvinguda!'), content: '<p>Meu</p>' });
  expect(disc.registres.get(CLAU)).toEqual({ title: sanitizeHtml('Benvinguda!'), content: '<p>Meu</p>' });
  expect(result.current[2]).toBe(0);
});

test('AH-R17-11 · sense cap esborrany desat, el que s’ha teclejat abans d’hidratar arriba al disc en hidratar', async () => {
  const { result } = munta();
  act(() => {
    result.current[1](ID, 'title', 'Primer');
    result.current[1](ID, 'title', 'Primera nota');
  });
  expect(mutateDraft).not.toHaveBeenCalled();
  await hidrata();
  expect(result.current[0].title).toBe(sanitizeHtml('Primera nota'));
  // Una sola escriptura, amb el format de sempre ({ camp: valor }).
  expect(mutateDraft).toHaveBeenCalledTimes(1);
  expect(disc.registres.get(CLAU)).toEqual({ title: sanitizeHtml('Primera nota') });
});

test('AH-R17-11 · hidratada, cada tecla s’escriu en l’acte i fusiona amb el registre (cap camp es perd)', async () => {
  disc.registres.set(CLAU, { title: 'La meua recepta', content: '<p>Tomaca de penjar</p>' });
  const { result } = munta();
  await hidrata();
  act(() => { result.current[1](ID, 'title', 'La meua recepta '); });
  await act(async () => {});
  expect(mutateDraft).toHaveBeenCalledTimes(1);
  expect(disc.registres.get(CLAU)).toEqual({ title: sanitizeHtml('La meua recepta '), content: '<p>Tomaca de penjar</p>' });
  expect(result.current[2]).toBe(0);
});

test('AH-R17-11 · una lectura que no acaba (desmuntat abans) no escriu res', async () => {
  disc.registres.set(CLAU, { title: 'La meua recepta' });
  const { result, unmount } = munta();
  act(() => { result.current[1](ID, 'title', 'Benvinguda '); });
  unmount();
  await hidrata();
  expect(mutateDraft).not.toHaveBeenCalled();
  expect(disc.registres.get(CLAU)).toEqual({ title: 'La meua recepta' });
});
