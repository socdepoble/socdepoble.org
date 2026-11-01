/**
 * P1-22 (assalt 261101, T5b) · El resum de la connexió, l'execució de la
 * visibilitat i el contingut de fora, en la llengua de l'app: dins d'un
 * UIProvider en castellà (useTraductorOpcional) o amb el traductor passat a
 * la funció pura. Fora de l'app (sense UIProvider), el valencià de sempre.
 */
import { cleanup, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ creaFil: vi.fn(), send: vi.fn(), update: vi.fn(), moderacio: null }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => ({ creaFil: mocks.creaFil, sendChatMessage: mocks.send }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ updateNote: mocks.update }) }));
vi.mock('../../components/PedraSeca/hooks/moderacioDePoble.js', () => ({ useModeracio: () => mocks.moderacio }));

import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { LANGUAGE_STORAGE_KEY, createTranslator } from '../../config/i18n.js';
import { delVal } from '../../config/storage.js';
import { MAXIM_CAMP_ORIGEN, MAXIM_URL } from '../../data/origenNota.js';
/* Sense els diccionaris carregats, el castellà seria valencià i la prova passaria en buit. */
import '../../../tests/helpers/diccionaris.js';
import { ResumConnexio, veredicteDelResum } from './ResumConnexio.jsx';
import { useAplicaAbast } from './useAplicaAbast.js';
import { contingutExternDeParams, validaContingutExtern } from './contingutExtern.js';

const EnCastella = ({ children }) => <UIProvider externalConfig={{ language: 'es' }}>{children}</UIProvider>;
const NOTA = { id: 'n-1', revision: 0 };
const ORIGEN = { tipus: 'connexio', itemId: 'sella', titol: 'Sella', objecte: 'poble' };
const FILES = [
  { clau: 'mas', nom: 'Tus notas', estat: 'fet' },
  { clau: 'g', nom: 'Colla', estat: 'error' },
  { clau: 'mur', nom: 'Tu muro', estat: 'pendent' }
];

afterEach(() => { cleanup(); vi.unstubAllGlobals(); delVal(LANGUAGE_STORAGE_KEY); });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  delVal(LANGUAGE_STORAGE_KEY);
  mocks.moderacio = null;
  mocks.creaFil.mockImplementation(async (id) => `f-${id}`);
  mocks.send.mockImplementation(async () => [{ id: 'm' }]);
  mocks.update.mockResolvedValue({ id: 'n-1' });
});

describe('ResumConnexio', () => {
  test('dins de l’app en castellà, l’estat de cada fila i el títol són del diccionari', () => {
    const { container } = render(<EnCastella><ResumConnexio resultats={FILES} /></EnCastella>);
    const estats = [...container.querySelectorAll('.sdp-connexio-resum__estat')].map((e) => e.textContent);
    expect(estats).toEqual(['Hecho', 'No enviado', 'Pendiente']);
    expect(screen.getByRole('status').textContent).toContain('Conectado, pero no todo se ha enviado');
    expect(container.textContent).not.toMatch(/Fet|No enviat|Pendent|Connectat/);
  });

  test('veredicteDelResum amb el traductor gallec, i sense traductor el valencià', () => {
    const gl = createTranslator('gl');
    expect(veredicteDelResum([{ estat: 'pendent' }], gl)).toEqual({ to: 'info', titol: 'Conectado: fáltache un paso' });
    expect(veredicteDelResum([{ estat: 'fet' }], gl).titol).toBe('Conectado');
    expect(veredicteDelResum([{ estat: 'error' }]).titol).toBe('Connectat, però no tot s’ha enviat');
  });

  test('fora de l’app (catàleg, sense UIProvider), el valencià de sempre', () => {
    const { container } = render(<ResumConnexio resultats={FILES.slice(0, 1)} />);
    expect(container.querySelector('.sdp-connexio-resum__estat').textContent).toBe('Fet');
    expect(screen.getByText('Connectat', { selector: '.sdp-alerta__titol' })).toBeTruthy();
  });
});

describe('useAplicaAbast dins de l’app en castellà', () => {
  const aplica = (args) => renderHook(() => useAplicaAbast(), { wrapper: EnCastella }).result.current.aplica(args);

  test('persones: «Enviado por chat.» i, si no ix, el motiu en castellà', async () => {
    mocks.send.mockImplementation(async (fil) => (fil.id === 'f-u2' ? [] : [{ id: 'm' }]));
    const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }, { id: 'u2', nom: 'Toni' }] }, missatge: 'Hola' });
    expect(resultats.map((r) => r.detall)).toEqual(['Enviado por chat.', 'No se ha enviado. Lo encontrarás en el chat para volver a intentarlo.']);
  });

  test('tot el poble: el pas del Mur es diu «Tu muro» i el detall és el castellà', async () => {
    const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'poble' }, missatge: 'x' });
    expect(resultats).toEqual([expect.objectContaining({ nom: 'Tu muro', estat: 'pendent' })]);
    expect(resultats[0].detall).toMatch(/^Abre la conexión en tus notas y pulsa «Compartir en el Muro»/);
  });

  test('la nota no pot apuntar-ho, i les normes declinades: els dos motius en castellà', async () => {
    mocks.update.mockRejectedValueOnce(new Error('Conflicte'));
    const grups = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'grups', grups: [{ id: 'g1', nom: 'Colla' }] }, missatge: 'x' });
    expect(grups.resultats.at(-1)).toMatchObject({ clau: 'registre', nom: 'Registro en la nota', detall: 'Los envíos ya han salido, pero la nota no ha podido registrarlos.' });
    mocks.moderacio = { asseguraNormes: vi.fn().mockResolvedValue(false) };
    const declinades = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'grups', grups: [{ id: 'g1', nom: 'Colla' }] }, missatge: 'x' });
    expect(declinades.resultats[0].detall).toBe(createTranslator('es')('section.moderacio.normes.calAcceptar', ''));
    expect(declinades.resultats[0].detall).not.toBe('Per a publicar, cal acceptar les normes de convivència.');
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
});

describe('contingutExtern amb el traductor', () => {
  const ES = createTranslator('es');

  test('una adreça que no és web i un títol massa llarg: els motius en castellà, amb el límit resolt', () => {
    expect(contingutExternDeParams(new URLSearchParams({ url: 'ftp://x.org/a' }), ES).errors.url)
      .toBe('Solo se pueden conectar direcciones web (http o https).');
    const llarg = contingutExternDeParams(new URLSearchParams({ url: 'https://x.org/a', titol: 'a'.repeat(MAXIM_CAMP_ORIGEN + 1) }), ES);
    expect(llarg.errors.titol).toBe(`El título supera los ${MAXIM_CAMP_ORIGEN} caracteres.`);
    expect(validaContingutExtern({ url: `https://x.org/${'a'.repeat(MAXIM_URL)}` }, ES).errors.url)
      .toBe(`La dirección supera los ${MAXIM_URL} caracteres. No se recorta: una dirección recortada lleva a otra página.`);
  });

  test('sense traductor, els motius valencians d’abans, lletra per lletra', () => {
    expect(contingutExternDeParams(new URLSearchParams({ url: '' })).errors.url).toBe('Falta l’adreça de la pàgina.');
    expect(validaContingutExtern({ url: 'https://x.org/a', entradilla: 'a'.repeat(10000) }).errors.entradilla).toMatch(/^L’entradilla passa de \d+ caràcters\.$/);
    expect(validaContingutExtern({ url: 'https://usuari:clau@x.org/a' }).errors.url).toBe('L’adreça porta un usuari o una contrasenya, i no es connecta.');
  });
});
