/**
 * W4-09 (auditoria de Codex 261003_1950) · L'autor «Sóc de Poble» de la boina
 * del Panell porta al xat corporatiu de l'entitat REAL. En remot, l'id de
 * llavor ('socdepoble') arribava literal a crea_fil_directe, que exigix un
 * UUID: ara l'entitat es resol pel port del backend abans de fer l'enllaç.
 * Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6), per a
 * la boina: l'autor porta a la pàgina del projecte, i este xat és el de
 * Comentar del peu de les targetes del Panell. La resolució no canvia.
 *
 * W4-10 · El format de l'id és cosa del proveïdor: la interfície fa l'enllaç
 * amb l'id que torna el port («42», «wp:organization:42» o un UUID), només si
 * és una cadena no buida que cap en una consulta d'URL. Que crea_fil_directe
 * vol un UUID ho comprova l'adaptador de Supabase (data/supabase/xat.js i la
 * cadena sencera a data/supabase/xat.destinatari.test.js).
 *
 * Proves: id remot retornat (UUID i opac), entitat absent, error, canvi de
 * backend, mode seed, i que en remot l'enllaç només porta l'id que ha tornat
 * el port, mai el de la llavor. El port, l'amfitrió i la UI se substituïxen:
 * cap xarxa (Model B).
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({
  ui: null,
  teCapacitat: vi.fn(),
  load: vi.fn(),
  llest: vi.fn()
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => {
    if (!estat.ui) throw new Error('useUIState ha de ser usat dins de UIProvider');
    return estat.ui;
  }
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (...args) => estat.teCapacitat(...args),
  loadPerfilPublic: (...args) => estat.load(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: (...args) => estat.llest(...args) }));

import {
  AVISOS_XAT_CORPORATIU, XAT_DE_LLAVOR, avisDelXatCorporatiu, resolXatCorporatiu, rutaXatCorporatiu, useXatCorporatiu
} from './xatCorporatiu.js';
import { XAT_SOCDEPOBLE } from './destinsControl.js';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { resolRuta } from '../../app/contexts/politicaRouter.js';

const UUID = '7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f';
const ALTRE = '0f9e8d7c-6b5a-4c3d-9e2f-1a2b3c4d5e6f';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://poble.example' });
const ENTITAT = Object.freeze({ tipus: 'entitat', id: UUID, slug: 'soc-de-poble', nom: 'Sóc de Poble' });

beforeEach(() => {
  estat.ui = null;
  estat.teCapacitat.mockReset().mockReturnValue(true);
  estat.load.mockReset().mockResolvedValue(ENTITAT);
  estat.llest.mockReset().mockResolvedValue(undefined);
});
afterEach(() => { estat.ui = null; });

describe('resolXatCorporatiu · pur, amb el port injectat', () => {
  const port = () => ({ teCapacitat: estat.teCapacitat, loadPerfilPublic: estat.load });
  const llest = () => estat.llest();

  test('seed i local: el xat de la llavor, sense esperar l’amfitrió ni cridar el port', async () => {
    for (const dataMode of ['seed', 'local']) {
      await expect(resolXatCorporatiu({ dataMode, port: port(), llest })).resolves.toEqual({ estat: 'llavor', href: XAT_SOCDEPOBLE });
    }
    expect(XAT_SOCDEPOBLE).toBe('/xat?amb=socdepoble');
    expect([estat.llest, estat.teCapacitat, estat.load].map((f) => f.mock.calls.length)).toEqual([0, 0, 0]);
  });

  test('remot: resol el slug declarat pel port i l’enllaç porta l’UUID de l’entitat', async () => {
    const config = { ...REMOT, signal: new AbortController().signal };
    await expect(resolXatCorporatiu({ dataMode: 'remote', config, port: port(), llest })).resolves.toEqual({
      estat: 'remot', href: `/xat?amb=${UUID}`
    });
    expect(estat.teCapacitat).toHaveBeenCalledWith('directori');
    expect(estat.load).toHaveBeenCalledWith('soc-de-poble', config);
    expect(rutaXatCorporatiu('a b')).toBe('/xat?amb=a%20b');
  });

  test('remot sense entitat, sense id o amb un id que no cap en una consulta: cap enllaç', async () => {
    /* L'id del contracte és una cadena: un número no es convertix ací. */
    for (const perfil of [null, {}, { tipus: 'persona', id: UUID }, { tipus: 'entitat' }, { tipus: 'entitat', id: 42 },
      { tipus: 'entitat', id: '' }, { tipus: 'entitat', id: '   ' }, { tipus: 'entitat', id: ' 42' },
      { tipus: 'entitat', id: 'wp:organization:42\n' }, { tipus: 'entitat', id: 'a\u0000b' }, { tipus: 'entitat', id: 'x'.repeat(201) }]) {
      await expect(resolXatCorporatiu({ dataMode: 'remote', config: REMOT, port: { ...port(), loadPerfilPublic: async () => perfil }, llest }))
        .resolves.toEqual({ estat: 'absent', href: null });
    }
  });

  test('W4-10 · remot amb l’id opac d’un altre backend («42», «wp:organization:42»): enllaç amb l’id tal qual, codificat', async () => {
    const casos = [
      ['42', '/xat?amb=42'],
      ['wp:organization:42', '/xat?amb=wp%3Aorganization%3A42'],
      ['x'.repeat(200), `/xat?amb=${'x'.repeat(200)}`],
      [UUID, `/xat?amb=${UUID}`]
    ];
    for (const [id, href] of casos) {
      const resolt = await resolXatCorporatiu({
        dataMode: 'remote', config: REMOT, port: { ...port(), loadPerfilPublic: async () => ({ tipus: 'entitat', id }) }, llest
      });
      expect(resolt).toEqual({ estat: 'remot', href });
      /* El Xat llig ?amb= amb URLSearchParams (XatSection): li arriba l'id del port, sencer. */
      expect(new URLSearchParams(resolt.href.split('?')[1]).get('amb')).toBe(id);
    }
  });

  /* Revisió adversarial de W4-10 · La targeta només fa enllaç amb una ruta de
     l'app (esRutaDeLaPorta, W4-07: esRutaInterna i resolRuta, 300 caràcters
     com a molt). Un id curt però ple de caràcters que es codifiquen (é → %C3%A9,
     «:» → %3A) donava un href de més de 300: el resolutor deia «remot», la
     targeta llevava l'enllaç en silenci i el Panell no avisava de res. */
  test('W4-10 · un id que, codificat, no cap en una ruta de l’app: cap enllaç i el Panell ho diu, mai un «remot» que la targeta descarta', async () => {
    const resol = (id) => resolXatCorporatiu({
      dataMode: 'remote', config: REMOT, port: { ...port(), loadPerfilPublic: async () => ({ tipus: 'entitat', id }) }, llest
    });
    for (const id of ['é'.repeat(50), ':'.repeat(100), `wp:${'é'.repeat(48)}`]) {
      expect(id.length).toBeLessThanOrEqual(200);
      expect(esRutaInterna(rutaXatCorporatiu(id))).toBe(false);
      await expect(resol(id)).resolves.toEqual({ estat: 'absent', href: null });
    }
    /* Tot «remot» és un enllaç que la targeta seguix. */
    for (const id of ['42', 'wp:organization:42', 'x'.repeat(200), 'é'.repeat(48), UUID]) {
      const resolt = await resol(id);
      expect(resolt.estat).toBe('remot');
      expect(esRutaInterna(resolt.href) && resolRuta(resolt.href) !== null).toBe(true);
    }
  });

  test('remot sense la capacitat directori: cap crida al port i cap enllaç', async () => {
    estat.teCapacitat.mockReturnValue(false);
    await expect(resolXatCorporatiu({ dataMode: 'remote', config: REMOT, port: port(), llest })).resolves.toEqual({ estat: 'absent', href: null });
    expect(estat.load).not.toHaveBeenCalled();
  });

  test('remot amb error del port: la promesa es rebutja (qui la crida ho diu)', async () => {
    estat.load.mockRejectedValue(new Error('500'));
    await expect(resolXatCorporatiu({ dataMode: 'remote', config: REMOT, port: port(), llest })).rejects.toThrow('500');
  });
});

describe('useXatCorporatiu · el Comentar del Panell (abans, la boina)', () => {
  test('seed: el xat de la llavor des del primer pintat, sense crides', () => {
    estat.ui = { externalConfig: { dataMode: 'seed' } };
    const { result } = renderHook(() => useXatCorporatiu());
    expect(result.current).toEqual(XAT_DE_LLAVOR);
    expect([estat.llest, estat.load].map((f) => f.mock.calls.length)).toEqual([0, 0]);
  });

  test('fora de l’app (sense UIProvider): el xat de la llavor, sense crides', () => {
    const { result } = renderHook(() => useXatCorporatiu());
    expect(result.current).toEqual(XAT_DE_LLAVOR);
    expect(estat.load).not.toHaveBeenCalled();
  });

  test('remot: mentre resol, cap enllaç; després, l’UUID que torna el port, amb el senyal de cancel·lació', async () => {
    estat.ui = { externalConfig: REMOT };
    let resol;
    estat.load.mockImplementation(() => new Promise((r) => { resol = r; }));
    const { result } = renderHook(() => useXatCorporatiu());
    expect(result.current).toEqual({ estat: 'resolent', href: null });
    await waitFor(() => expect(estat.load).toHaveBeenCalledTimes(1));
    const [clau, config] = estat.load.mock.calls[0];
    expect([clau, config.supabaseUrl, config.signal instanceof AbortSignal]).toEqual(['soc-de-poble', 'https://poble.example', true]);
    expect(estat.llest).toHaveBeenCalledWith({ signal: config.signal });
    await act(async () => { resol(ENTITAT); });
    expect(result.current).toEqual({ estat: 'remot', href: `/xat?amb=${UUID}` });
  });

  test('W4-10 · remot amb un backend que no és Supabase: l’autor és enllaç amb l’id opac de l’entitat', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockResolvedValue({ tipus: 'entitat', id: 'wp:organization:42', slug: 'soc-de-poble' });
    const { result } = renderHook(() => useXatCorporatiu());
    await waitFor(() => expect(result.current.estat).toBe('remot'));
    expect(result.current.href).toBe('/xat?amb=wp%3Aorganization%3A42');
  });

  test('remot sense entitat: «absent», cap enllaç', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockResolvedValue(null);
    const { result } = renderHook(() => useXatCorporatiu());
    await waitFor(() => expect(result.current.estat).toBe('absent'));
    expect(result.current.href).toBeNull();
  });

  test('remot amb error: «error», cap enllaç i cap reintent sol', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockRejectedValue(new Error('503'));
    const { result } = renderHook(() => useXatCorporatiu());
    await waitFor(() => expect(result.current.estat).toBe('error'));
    expect([result.current.href, estat.load.mock.calls.length]).toEqual([null, 1]);
  });

  test('una configuració de backend invàlida: «absent» sense cap crida', () => {
    estat.ui = { externalConfig: { dataMode: 'remote', supabaseUrl: 'ftp://poble.example' } };
    const { result } = renderHook(() => useXatCorporatiu());
    expect(result.current).toEqual({ estat: 'absent', href: null });
    expect(estat.load).not.toHaveBeenCalled();
  });

  test('canvi de backend: es torna a resoldre i la resposta del backend vell es descarta', async () => {
    estat.ui = { externalConfig: REMOT };
    const pendents = [];
    estat.load.mockImplementation((_, config) => new Promise((r) => { pendents.push({ r, config }); }));
    const { result, rerender } = renderHook(() => useXatCorporatiu());
    await waitFor(() => expect(pendents).toHaveLength(1));
    estat.ui = { externalConfig: { dataMode: 'remote', supabaseUrl: 'https://altre.example' } };
    rerender();
    /* Entre canvi i resposta, l'enllaç del backend vell no es mostra. */
    expect(result.current).toEqual({ estat: 'resolent', href: null });
    await waitFor(() => expect(pendents).toHaveLength(2));
    expect(pendents[0].config.signal.aborted).toBe(true);
    expect(pendents[1].config.supabaseUrl).toBe('https://altre.example');
    await act(async () => { pendents[0].r({ tipus: 'entitat', id: UUID }); });
    expect(result.current.href).toBeNull();
    await act(async () => { pendents[1].r({ tipus: 'entitat', id: ALTRE }); });
    expect(result.current).toEqual({ estat: 'remot', href: `/xat?amb=${ALTRE}` });
  });

  /* T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · El xat corporatiu
     és ara el de Comentar. Sense xat on portar, Comentar avisa: mentre es
     resol, que encara es busca; sense entitat o amb error, el text de
     l'Alerta del Panell. Amb xat, cap avís. */
  test('T6 · avisDelXatCorporatiu: cap avís amb xat; «resolent» i «noDisponible» sense', () => {
    expect(avisDelXatCorporatiu(XAT_DE_LLAVOR)).toBeNull();
    expect(avisDelXatCorporatiu({ estat: 'remot', href: `/xat?amb=${UUID}` })).toBeNull();
    expect(avisDelXatCorporatiu({ estat: 'resolent', href: null })).toBe(AVISOS_XAT_CORPORATIU.resolent);
    for (const xat of [{ estat: 'absent', href: null }, { estat: 'error', href: null }, null, undefined, {}]) {
      expect(avisDelXatCorporatiu(xat)).toBe(AVISOS_XAT_CORPORATIU.noDisponible);
    }
    expect(AVISOS_XAT_CORPORATIU.noDisponible).toEqual([
      'section.control.xatCorporatiu.noDisponible', 'Xat de Sóc de Poble: encara no disponible en este servidor.'
    ]);
    expect(AVISOS_XAT_CORPORATIU.resolent[0]).toBe('section.control.xatCorporatiu.resolent');
    expect(Object.isFrozen(AVISOS_XAT_CORPORATIU)).toBe(true);
  });

  test('de remot a seed: el xat de la llavor a l’instant; desmuntar cancel·la la resolució', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockImplementation(() => new Promise(() => {}));
    const { result, rerender, unmount } = renderHook(() => useXatCorporatiu());
    await waitFor(() => expect(estat.load).toHaveBeenCalledTimes(1));
    const senyal = estat.load.mock.calls[0][1].signal;
    estat.ui = { externalConfig: { dataMode: 'seed' } };
    rerender();
    expect(result.current).toEqual(XAT_DE_LLAVOR);
    expect(senyal.aborted).toBe(true);
    unmount();
  });
});
