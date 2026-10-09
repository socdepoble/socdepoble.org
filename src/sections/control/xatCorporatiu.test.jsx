/**
 * W4-09 (auditoria de Codex 261003_1950) · L'autor «Sóc de Poble» de la boina
 * del Panell porta al xat corporatiu de l'entitat REAL. En remot, l'id de
 * llavor ('socdepoble') arribava literal a crea_fil_directe, que exigix un
 * UUID: ara l'entitat es resol pel port del backend abans de fer l'enllaç.
 * Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6), per a
 * la boina: l'autor porta a la pàgina del projecte (Onada 8, 261009: al seu
 * perfil), i este xat és el de Comentar del peu de les targetes del Panell.
 * La resolució no canvia.
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
 *
 * Ordre del Mestre (261007, correcció C2) · Derogats useXatCorporatiu i
 * comentarAlXatCorporatiu, que ja no feia servir ningú: les seues proves de
 * comportament (llavor, configuració invàlida, canvi de backend, de remot a
 * seed) són ara del proveïdor únic, ProveidorXatSocDePoble.
 */
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const estat = vi.hoisted(() => ({
  ui: null,
  accions: null,
  identitat: null,
  teCapacitat: vi.fn(),
  load: vi.fn(),
  llest: vi.fn(),
  navigate: vi.fn(),
  toast: vi.fn()
}));
/* Ordre del Mestre (261007) · Comentar navega amb el router i avisa amb el
   toast de l'app: tots dos, espies. `accions` són les de la interfície (el
   traductor del proveïdor); null, fora de l'app. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => estat.navigate }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: estat.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => {
    if (!estat.ui) throw new Error('useUIState ha de ser usat dins de UIProvider');
    return estat.ui;
  },
  useUIActionsOpcional: () => estat.accions
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (...args) => estat.teCapacitat(...args),
  loadPerfilPublic: (...args) => estat.load(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: (...args) => estat.llest(...args) }));
/* Onada 8 (261009, revisió) · Qui mira, la identitat de l'app que llig el
   proveïdor (useIdentitatOpcional); null, sense IdentitatProvider. */
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitatOpcional: () => estat.identitat }));

import {
  AVISOS_XAT_CORPORATIU, ProveidorXatSocDePoble, XAT_DE_LLAVOR, avisDelXatCorporatiu, directeDeLlavor, resolXatCorporatiu, rutaXatCorporatiu
} from './xatCorporatiu.js';
import { XAT_SOCDEPOBLE_DE_LLAVOR, useXatSocDePoble, useXatSocDePobleResolt } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import { TEXTOS_COMENTAR } from '../../components/universal/barres/BarraBlava.jsx';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { ESPERA_DESPRES_DE_FALLADA_MS, objecteDe, objecteDePerfil } from '../../config/navigation.js';
import { resolRuta } from '../../app/contexts/politicaRouter.js';
import { ENTITAT_PILOT_SLUG, IAIA_ID, PERSONA_PILOT } from '../../data/identitatsSeed.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { XAT_SEED_IDS, XAT_SEED_MEMBRES } from '../../data/xatSeed.js';
import { localXat } from '../../data/localXat.js';

const UUID = '7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f';
const ALTRE = '0f9e8d7c-6b5a-4c3d-9e2f-1a2b3c4d5e6f';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://poble.example' });
/* Ordre del Mestre (261007) · El slug declarat és el de producció,
   'socdepoble' (ENTITAT_PILOT_SLUG), el mateix text que l'id de la llavor:
   les proves de remot demostren que al port es demana eixe text i que
   l'enllaç porta l'UUID que torna el port. Si el text ve del slug o de l'id
   de la llavor ja no ho poden distingir: tots dos valen 'socdepoble'. */
const ENTITAT = Object.freeze({ tipus: 'entitat', id: UUID, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' });

beforeEach(() => {
  estat.ui = null;
  estat.accions = null;
  estat.identitat = null;
  estat.teCapacitat.mockReset().mockReturnValue(true);
  estat.load.mockReset().mockResolvedValue(ENTITAT);
  estat.llest.mockReset().mockResolvedValue(undefined);
  estat.navigate.mockReset();
  estat.toast.mockReset();
});
afterEach(() => {
  cleanup();
  estat.ui = null;
});

describe('resolXatCorporatiu · pur, amb el port injectat', () => {
  const port = () => ({ teCapacitat: estat.teCapacitat, loadPerfilPublic: estat.load });
  const llest = () => estat.llest();

  test('seed i local: el xat de la llavor, sense esperar l’amfitrió ni cridar el port', async () => {
    for (const dataMode of ['seed', 'local']) {
      await expect(resolXatCorporatiu({ dataMode, port: port(), llest })).resolves.toEqual({ estat: 'llavor', href: XAT_SOCDEPOBLE_DE_LLAVOR.href });
    }
    expect(XAT_SOCDEPOBLE_DE_LLAVOR.href).toBe('/xat?amb=socdepoble');
    expect([estat.llest, estat.teCapacitat, estat.load].map((f) => f.mock.calls.length)).toEqual([0, 0, 0]);
  });

  test('remot: resol el slug declarat pel port i l’enllaç porta l’UUID de l’entitat', async () => {
    const config = { ...REMOT, signal: new AbortController().signal };
    await expect(resolXatCorporatiu({ dataMode: 'remote', config, port: port(), llest })).resolves.toEqual({
      estat: 'remot', href: `/xat?amb=${UUID}`
    });
    expect(estat.teCapacitat).toHaveBeenCalledWith('directori');
    expect(estat.load).toHaveBeenCalledWith(ENTITAT_PILOT_SLUG, config);
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

describe('avisDelXatCorporatiu · l’avís quan «En privat» encara no hi pot portar', () => {
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

  /* Correcció C10 · La font de l'enllaç de la llavor és
     XAT_SOCDEPOBLE_DE_LLAVOR (PedraSeca/hooks/xatSocDePoble.js): XAT_DE_LLAVOR
     en deriva, i totes les esperances d'este fitxer la prenen d'ella. També
     les que fins ara només feia destinsControl.test.js: l'enllaç no és el de
     la IAIA i és una ruta de l'app que la targeta seguix (com els «remot»). */
  test('C10 · XAT_DE_LLAVOR deriva de la font de l’enllaç de la llavor, que és una ruta de l’app', () => {
    expect(XAT_DE_LLAVOR).toEqual({ estat: 'llavor', href: XAT_SOCDEPOBLE_DE_LLAVOR.href });
    expect(Object.isFrozen(XAT_DE_LLAVOR)).toBe(true);
    const { href } = XAT_SOCDEPOBLE_DE_LLAVOR;
    expect(href).not.toContain(encodeURIComponent(IAIA_ID));
    expect(esRutaInterna(href) && resolRuta(href) !== null).toBe(true);
  });

  /* Revisió R2 · C10 tancada: destinsControl.XAT_SOCDEPOBLE, l'única segona
     font, s'ha retirat (no tenia cap ús en producció). */
  test('C10 · cap segona font: destinsControl ja no compon l’enllaç de la llavor', async () => {
    expect(Object.keys(await import('./destinsControl.js'))).not.toContain('XAT_SOCDEPOBLE');
  });
});

/* Ordre del Mestre (261007) · «Comentaris = xat» · La via «En privat» del
   menú de Comentar de totes les targetes i barres és este xat. El resol
   ProveidorXatSocDePoble UNA sola vegada per a tota l'app (App.jsx), i només
   quan algú el tria: l'arrencada no fa cap consulta més (l'entitat pilot ja
   la resol AppDataLoader una vegada). Sense proveïdor, el de la llavor. */
describe('261007 · ProveidorXatSocDePoble · una sola resolució per a tota l’app', () => {
  const t = (clau, reserva) => `${clau}|${reserva}`;
  const ambProveidor = ({ children }) => <ProveidorXatSocDePoble>{children}</ProveidorXatSocDePoble>;
  const LLAVOR = Object.freeze({ estat: 'llavor', href: XAT_SOCDEPOBLE_DE_LLAVOR.href, avis: null, resol: null });
  /* Onada 8 (261009, revisió) · En llavor, el proveïdor hi afig directeAmb:
     el xat local només obri directes amb el seu padró. Sense proveïdor, no. */
  const LLAVOR_DEL_PROVEIDOR = Object.freeze({ ...LLAVOR, directeAmb: directeDeLlavor });

  test('sense proveïdor, la llavor (XAT_SOCDEPOBLE_DE_LLAVOR), sense crides', () => {
    const { result } = renderHook(() => useXatSocDePoble());
    expect(result.current).toBe(XAT_SOCDEPOBLE_DE_LLAVOR);
    expect(result.current).toEqual(LLAVOR);
    expect(estat.load).not.toHaveBeenCalled();
  });

  test('seed i fora de l’app: el proveïdor dona la llavor des del primer pintat, sense crides', () => {
    const { result: fora } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    expect(fora.current).toEqual(LLAVOR_DEL_PROVEIDOR);
    estat.ui = { externalConfig: { dataMode: 'seed' } };
    const { result } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    expect(result.current).toEqual(LLAVOR_DEL_PROVEIDOR);
    expect([estat.llest, estat.load].map((f) => f.mock.calls.length)).toEqual([0, 0]);
  });

  test('remot: cap consulta a l’arrencada; la primera tria la demana, i les que arriben mentre, la mateixa', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.accions = { t };
    let respon;
    estat.load.mockImplementation(() => new Promise((r) => { respon = r; }));
    const { result } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    expect(result.current).toMatchObject({ estat: 'pendent', href: null, avis: t(...AVISOS_XAT_CORPORATIU.resolent) });
    expect(typeof result.current.resol).toBe('function');
    await Promise.resolve();
    expect([estat.llest, estat.load].map((f) => f.mock.calls.length)).toEqual([0, 0]);
    let primera;
    let segona;
    act(() => { primera = result.current.resol(); });
    expect(result.current.estat).toBe('resolent');
    act(() => { segona = result.current.resol(); });
    await waitFor(() => expect(estat.load).toHaveBeenCalledTimes(1));
    expect(estat.load).toHaveBeenCalledWith(ENTITAT_PILOT_SLUG, expect.objectContaining({ supabaseUrl: 'https://poble.example' }));
    await act(async () => { respon(ENTITAT); });
    const esperat = { estat: 'remot', href: `/xat?amb=${UUID}`, avis: null };
    /* C6 · La mateixa resposta per a totes dues, però només la segona és
       encara l'última demanda de l'app (`darrera`): una sola navegació. */
    await expect(primera).resolves.toEqual({ ...esperat, darrera: false });
    await expect(segona).resolves.toEqual({ ...esperat, darrera: true });
    expect(result.current).toEqual({ ...esperat, resol: null });
    expect(estat.load).toHaveBeenCalledTimes(1);
  });

  /* Revisió del 261007 (M4-01) · Abans, «absent» no es tornava a demanar mai
     (resol: null). Però loadPerfilPublic convertix un tall de xarxa en null:
     ara l'«absent» del port es torna a demanar passada l'espera
     (ESPERA_DESPRES_DE_FALLADA_MS). Durant l'espera, cap crida nova. */
  test('remot sense entitat: «absent», l’avís «no disponible» (sense traductor, la reserva) i cap reintent durant l’espera', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockResolvedValue(null);
    const { result } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    let resultat;
    await act(async () => { resultat = await result.current.resol(); });
    expect(resultat).toEqual({ estat: 'absent', href: null, avis: AVISOS_XAT_CORPORATIU.noDisponible[1], darrera: true });
    expect(result.current).toMatchObject({ estat: 'absent', href: null, avis: AVISOS_XAT_CORPORATIU.noDisponible[1] });
    expect(typeof result.current.resol).toBe('function');
    await act(async () => { resultat = await result.current.resol(); });
    expect(resultat).toEqual({ estat: 'absent', href: null, avis: AVISOS_XAT_CORPORATIU.noDisponible[1], darrera: true });
    expect(estat.load).toHaveBeenCalledTimes(1);
  });

  test('M4-01 · el port torna null en el primer «En privat» (un tall de xarxa): passada l’espera, el següent hi porta', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockResolvedValueOnce(null).mockResolvedValueOnce(ENTITAT);
    const T0 = 1_000_000;
    const ara = vi.spyOn(Date, 'now').mockReturnValue(T0);
    try {
      render(
        <ProveidorXatSocDePoble>
          <UniversalCard title="Notícia" hasFooter objecte={{ tipus: 'publicacio', id: 'n1', titol: 'Notícia', ruta: '/mur/n1' }} />
        </ProveidorXatSocDePoble>
      );
      const enPrivat = () => {
        fireEvent.click(screen.getByRole('button', { name: 'Comentar Notícia' }));
        fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: TEXTOS_COMENTAR.privat[1] }));
      };
      enPrivat();
      await waitFor(() => expect(estat.load).toHaveBeenCalledTimes(1));
      await act(async () => { await Promise.resolve(); });
      expect(estat.navigate).not.toHaveBeenCalled();
      expect(estat.toast).toHaveBeenLastCalledWith(AVISOS_XAT_CORPORATIU.noDisponible[1]);
      // Abans de l'espera: l'avís, i cap crida nova al port.
      ara.mockReturnValue(T0 + ESPERA_DESPRES_DE_FALLADA_MS - 1);
      enPrivat();
      await act(async () => { await Promise.resolve(); });
      expect(estat.load).toHaveBeenCalledTimes(1);
      expect(estat.navigate).not.toHaveBeenCalled();
      // Passada l'espera: el port es torna a cridar i «En privat» porta al xat.
      ara.mockReturnValue(T0 + ESPERA_DESPRES_DE_FALLADA_MS);
      enPrivat();
      await waitFor(() => expect(estat.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID}`));
      expect(estat.navigate).toHaveBeenCalledTimes(1);
      expect(estat.load).toHaveBeenCalledTimes(2);
    } finally {
      ara.mockRestore();
    }
  });

  /* Correcció C2 · Les proves de comportament del derogat useXatCorporatiu,
     ara sobre el proveïdor únic. */
  test('una configuració de backend invàlida: «absent» sense cap crida ni res a demanar', () => {
    estat.ui = { externalConfig: { dataMode: 'remote', supabaseUrl: 'ftp://poble.example' } };
    const { result } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    expect(result.current).toEqual({ estat: 'absent', href: null, avis: AVISOS_XAT_CORPORATIU.noDisponible[1], resol: null });
    expect([estat.llest, estat.load].map((f) => f.mock.calls.length)).toEqual([0, 0]);
  });

  test('de remot a seed amb una resolució en curs: la llavor a l’instant, i la resposta del remot no la tapa', async () => {
    estat.ui = { externalConfig: REMOT };
    let respon;
    estat.load.mockImplementation(() => new Promise((r) => { respon = r; }));
    const { result, rerender } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    act(() => { result.current.resol(); });
    await waitFor(() => expect(estat.load).toHaveBeenCalledTimes(1));
    estat.ui = { externalConfig: { dataMode: 'seed' } };
    rerender();
    expect(result.current).toEqual(LLAVOR_DEL_PROVEIDOR);
    await act(async () => { respon(ENTITAT); });
    expect(result.current).toEqual(LLAVOR_DEL_PROVEIDOR);
  });

  test('canvi de backend amb una resolució en curs: la resposta del backend vell es descarta', async () => {
    estat.ui = { externalConfig: REMOT };
    const pendents = [];
    estat.load.mockImplementation((_, config) => new Promise((r) => { pendents.push({ r, config }); }));
    const { result, rerender } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    act(() => { result.current.resol(); });
    await waitFor(() => expect(pendents).toHaveLength(1));
    estat.ui = { externalConfig: { dataMode: 'remote', supabaseUrl: 'https://altre.example' } };
    rerender();
    /* L'abast nou encara no s'ha demanat: cap enllaç del backend vell. */
    expect(result.current).toMatchObject({ estat: 'pendent', href: null });
    await act(async () => { pendents[0].r({ tipus: 'entitat', id: UUID }); });
    expect(result.current).toMatchObject({ estat: 'pendent', href: null });
    let nova;
    act(() => { nova = result.current.resol(); });
    await waitFor(() => expect(pendents).toHaveLength(2));
    expect(pendents[1].config.supabaseUrl).toBe('https://altre.example');
    await act(async () => { pendents[1].r({ tipus: 'entitat', id: ALTRE }); });
    await expect(nova).resolves.toMatchObject({ estat: 'remot', href: `/xat?amb=${ALTRE}` });
    expect(result.current).toEqual({ estat: 'remot', href: `/xat?amb=${ALTRE}`, avis: null, resol: null });
  });

  test('remot amb error: «error», i el clic següent ho torna a provar', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce(ENTITAT);
    const { result } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    await act(async () => { await result.current.resol(); });
    expect(result.current).toMatchObject({ estat: 'error', href: null, avis: AVISOS_XAT_CORPORATIU.noDisponible[1] });
    await act(async () => { await result.current.resol(); });
    expect(result.current).toEqual({ estat: 'remot', href: `/xat?amb=${UUID}`, avis: null, resol: null });
    expect(estat.load).toHaveBeenCalledTimes(2);
  });

  test('remot: dotze targetes, UNA consulta al port, i cap fins al primer «En privat»', async () => {
    estat.ui = { externalConfig: REMOT };
    let respon;
    estat.load.mockImplementation(() => new Promise((r) => { respon = r; }));
    const titols = Array.from({ length: 12 }, (_, i) => `Notícia ${i + 1}`);
    render(
      <ProveidorXatSocDePoble>
        {titols.map((titol, i) => (
          <UniversalCard key={titol} title={titol} hasFooter objecte={{ tipus: 'publicacio', id: `n${i + 1}`, titol, ruta: `/mur/n${i + 1}` }} />
        ))}
      </ProveidorXatSocDePoble>
    );
    const tria = (titol, via) => {
      fireEvent.click(screen.getByRole('button', { name: `Comentar ${titol}` }));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: via }));
    };
    // La via pública no demana res al port.
    tria('Notícia 3', TEXTOS_COMENTAR.public[1]);
    expect(estat.navigate).toHaveBeenLastCalledWith(expect.stringContaining('/xat?sobre=publicacio:n3&'));
    await Promise.resolve();
    expect(estat.load).not.toHaveBeenCalled();
    // El primer «En privat» la demana i diu que encara es busca; quan arriba, hi va.
    estat.navigate.mockClear();
    tria('Notícia 1', TEXTOS_COMENTAR.privat[1]);
    expect(estat.toast).toHaveBeenLastCalledWith(AVISOS_XAT_CORPORATIU.resolent[1]);
    tria('Notícia 7', TEXTOS_COMENTAR.privat[1]);
    await waitFor(() => expect(estat.load).toHaveBeenCalledTimes(1));
    await act(async () => { respon(ENTITAT); });
    await waitFor(() => expect(estat.navigate).toHaveBeenLastCalledWith(`/xat?amb=${UUID}`));
    /* Correcció C6 · Dos «En privat» mentre es resolia: UNA sola navegació,
       la de l'última tria (abans, una per clic a l'historial). */
    await act(async () => { await Promise.resolve(); });
    expect(estat.navigate).toHaveBeenCalledTimes(1);
    // Resolt: les altres targetes hi van de seguida, sense cap consulta més.
    estat.navigate.mockClear();
    tria('Notícia 12', TEXTOS_COMENTAR.privat[1]);
    expect(estat.navigate.mock.calls).toEqual([[`/xat?amb=${UUID}`]]);
    expect(estat.load).toHaveBeenCalledTimes(1);
  });
});

/* Ordre del Mestre (261007) · Correcció C2 · L'Alerta del Panell ha de saber
   si el xat de Sóc de Poble no està disponible sense esperar cap clic:
   useXatSocDePobleResolt demana la resolució del proveïdor en muntar, la
   MATEIXA per a tota l'app, en lloc d'un segon useXatCorporatiu. */
describe('261007 · useXatSocDePobleResolt · l’estat en muntar, amb la resolució de tota l’app', () => {
  const ambProveidor = ({ children }) => <ProveidorXatSocDePoble>{children}</ProveidorXatSocDePoble>;

  test('sense proveïdor, i en llavor: el xat de la llavor, sense cap crida', () => {
    const { result: sol } = renderHook(() => useXatSocDePobleResolt());
    expect(sol.current).toBe(XAT_SOCDEPOBLE_DE_LLAVOR);
    estat.ui = { externalConfig: { dataMode: 'seed' } };
    const { result } = renderHook(() => useXatSocDePobleResolt(), { wrapper: ambProveidor });
    expect(result.current).toMatchObject({ estat: 'llavor', href: XAT_SOCDEPOBLE_DE_LLAVOR.href, resol: null });
    expect([estat.llest, estat.load].map((f) => f.mock.calls.length)).toEqual([0, 0]);
  });

  test('remot: la demana en muntar; dues lectures i dotze targetes, UNA consulta, i «En privat» ja hi va', async () => {
    estat.ui = { externalConfig: REMOT };
    let respon;
    estat.load.mockImplementation(() => new Promise((r) => { respon = r; }));
    let panell;
    let altra;
    function Panell() {
      panell = useXatSocDePobleResolt();
      altra = useXatSocDePobleResolt();
      return Array.from({ length: 12 }, (_, i) => (
        <UniversalCard key={i} title={`Targeta ${i + 1}`} hasFooter objecte={{ tipus: 'publicacio', id: `t${i + 1}`, titol: `Targeta ${i + 1}`, ruta: `/mur/t${i + 1}` }} />
      ));
    }
    render(<ProveidorXatSocDePoble><Panell /></ProveidorXatSocDePoble>);
    await waitFor(() => expect(estat.load).toHaveBeenCalledTimes(1));
    expect([panell.estat, altra.estat]).toEqual(['resolent', 'resolent']);
    await act(async () => { respon(ENTITAT); });
    expect(panell).toEqual({ estat: 'remot', href: `/xat?amb=${UUID}`, avis: null, resol: null });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar Targeta 5' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: TEXTOS_COMENTAR.privat[1] }));
    expect(estat.navigate.mock.calls).toEqual([[`/xat?amb=${UUID}`]]);
    expect(estat.toast).not.toHaveBeenCalled();
    expect(estat.load).toHaveBeenCalledTimes(1);
  });

  /* M4-01 · L'«absent» del port es pot tornar a demanar (resol, passada
     l'espera), però el hook no el demana sol: cap bucle. */
  test('remot sense entitat: «absent» sense cap clic (l’Alerta ho pot dir), i cap reintent sol', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockResolvedValue(null);
    const { result, rerender } = renderHook(() => useXatSocDePobleResolt(), { wrapper: ambProveidor });
    await waitFor(() => expect(result.current.estat).toBe('absent'));
    rerender();
    await act(async () => { await Promise.resolve(); });
    expect([result.current.estat, result.current.href, estat.load.mock.calls.length]).toEqual(['absent', null, 1]);
    expect(typeof result.current.resol).toBe('function');
  });

  test('remot amb error: «error» sense cap clic i cap reintent sol; el clic «En privat» següent ho torna a provar', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce(ENTITAT);
    const { result, rerender } = renderHook(() => useXatSocDePobleResolt(), { wrapper: ambProveidor });
    await waitFor(() => expect(result.current.estat).toBe('error'));
    rerender();
    await act(async () => { await Promise.resolve(); });
    expect([result.current.estat, estat.load.mock.calls.length]).toEqual(['error', 1]);
    await act(async () => { await result.current.resol(); });
    expect(result.current).toEqual({ estat: 'remot', href: `/xat?amb=${UUID}`, avis: null, resol: null });
    expect(estat.load).toHaveBeenCalledTimes(2);
  });

  test('canvi de backend: el torna a demanar per a l’abast nou', async () => {
    estat.ui = { externalConfig: REMOT };
    estat.load.mockResolvedValueOnce(ENTITAT).mockResolvedValueOnce({ tipus: 'entitat', id: ALTRE });
    const { result, rerender } = renderHook(() => useXatSocDePobleResolt(), { wrapper: ambProveidor });
    await waitFor(() => expect(result.current.href).toBe(`/xat?amb=${UUID}`));
    estat.ui = { externalConfig: { dataMode: 'remote', supabaseUrl: 'https://altre.example' } };
    rerender();
    await waitFor(() => expect(result.current.href).toBe(`/xat?amb=${ALTRE}`));
    expect(estat.load).toHaveBeenCalledTimes(2);
    expect(estat.load.mock.calls[1][1].supabaseUrl).toBe('https://altre.example');
  });
});

/* Onada 8 (261009, revisió adversarial) · «En privat» obri el xat amb
   l'autor, i el proveïdor de veres li diu dues coses a useAccions:
   esDeQuiMira (una publicació pròpia va al xat amb Sóc de Poble) i, en
   llavor, directeAmb (el xat local només obri directes amb el seu padró:
   la resta d'autors van a Sóc de Poble, mai a «Esta persona no és del
   poble»). Abans cap prova muntava el proveïdor amb una identitat ni amb el
   xat local de veres: el camí real no es provava. */
describe('Onada 8 · el proveïdor de veres: qui mira i el padró de la llavor', () => {
  const ambProveidor = ({ children }) => <ProveidorXatSocDePoble>{children}</ProveidorXatSocDePoble>;
  const PERSONA = Object.freeze({ tipus: 'persona', id: 'sessio-pepa', rol: 'persona' });
  const COOP = Object.freeze({ tipus: 'entitat', id: 'org-coop', slug: 'coop', rol: 'owner' });
  const AMB_SESSIO = Object.freeze({ actor: PERSONA, identitats: [PERSONA, COOP] });
  const CONVIDAT = Object.freeze({ actor: { tipus: 'persona', id: 'convidat-1', rol: 'convidat' }, identitats: [] });
  const SEED = Object.freeze({ externalConfig: { dataMode: 'seed' } });
  /* Un agent del catàleg que no és al padró del xat (com els 11111111-… de /perfil). */
  const FORA_DEL_PADRO = Object.values(AGENTS_MAP).find((a) => !XAT_SEED_MEMBRES.some((m) => m.usuariId === a.id));

  test('esDeQuiMira: l’actor, les organitzacions on mana (id i slug) i, en llavor, els àlies de la persona pilot', () => {
    estat.ui = SEED;
    estat.identitat = AMB_SESSIO;
    const { result } = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    const { esDeQuiMira } = result.current;
    for (const id of ['sessio-pepa', 'org-coop', 'coop', ...PERSONA_PILOT.alies]) expect([id, esDeQuiMira(id)]).toEqual([id, true]);
    for (const id of ['jordi', ENTITAT_PILOT_SLUG, IAIA_ID, '', null]) expect([id, esDeQuiMira(id)]).toEqual([id, false]);
  });

  test('en remot la persona no hereta els àlies de la llavor; un convidat tampoc; sense identitat, cap esDeQuiMira', () => {
    estat.ui = { externalConfig: REMOT };
    estat.identitat = AMB_SESSIO;
    const remot = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    expect([remot.result.current.esDeQuiMira('sessio-pepa'), remot.result.current.esDeQuiMira('javillinares')]).toEqual([true, false]);
    expect('directeAmb' in remot.result.current).toBe(false);
    remot.unmount();
    estat.ui = SEED;
    estat.identitat = CONVIDAT;
    const convidat = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    expect([convidat.result.current.esDeQuiMira('convidat-1'), convidat.result.current.esDeQuiMira('javillinares')]).toEqual([true, false]);
    convidat.unmount();
    estat.identitat = null;
    const sense = renderHook(() => useXatSocDePoble(), { wrapper: ambProveidor });
    expect('esDeQuiMira' in sense.result.current).toBe(false);
  });

  test('directeDeLlavor: el padró de XAT_SEED_MEMBRES; els àlies de la persona pilot, al seu usuariId; la resta, cap', () => {
    for (const membre of XAT_SEED_MEMBRES) {
      expect([membre.usuariId, directeDeLlavor({ tipus: membre.tipus, id: membre.usuariId })]).toEqual([membre.usuariId, membre.usuariId]);
    }
    for (const alies of PERSONA_PILOT.alies) expect([alies, directeDeLlavor({ tipus: 'persona', id: alies })]).toEqual([alies, XAT_SEED_IDS.javi]);
    expect(FORA_DEL_PADRO).toBeTruthy();
    expect(directeDeLlavor({ tipus: 'persona', id: FORA_DEL_PADRO.id })).toBeNull();
    /* Un àlies de persona en una entitat no és la persona; res inventat. */
    for (const qui of [{ tipus: 'entitat', id: 'javillinares' }, { tipus: 'persona', id: 'u-1' }, {}, null]) {
      expect([qui, directeDeLlavor(qui)]).toEqual([qui, null]);
    }
  });

  test('directeDeLlavor i el localXat de veres: el que torna, s’obri; el que rebutja, el xat local també', async () => {
    const config = { dataMode: 'seed' };
    for (const qui of [{ tipus: 'persona', id: 'javillinares' }, { tipus: 'ia', id: IAIA_ID }, { tipus: 'persona', id: XAT_SEED_IDS.javi }]) {
      await expect(localXat.creaFilDirecte(directeDeLlavor(qui), null, config)).resolves.toEqual(expect.any(String));
    }
    for (const id of ['javillinares', FORA_DEL_PADRO.id]) {
      await expect(localXat.creaFilDirecte(id, null, config)).rejects.toThrow('Esta persona no és del poble.');
    }
  });

  test('integració: una publicació pròpia, un autor de fora del padró i el Mac Mini de Javi, amb el proveïdor i les targetes de veres', () => {
    estat.ui = SEED;
    estat.identitat = { ...CONVIDAT, actor: { tipus: 'entitat', id: 'org-coop', slug: 'coop', rol: 'owner' } };
    const PROPIA = objecteDe({ id: 'p1', title: 'Pa de la coop', author_org_id: 'org-coop', author_name: 'La Coop' }, 'mur');
    const ANDREU = objecteDePerfil({ tipus: 'persona', id: FORA_DEL_PADRO.id, nom: 'Andreu Soler' });
    const MAC = objecteDe({ id: 'mac', title: 'Mac Mini', author_id: 'javillinares', author_name: 'Javi' }, 'mercat');
    render(
      <ProveidorXatSocDePoble>
        <UniversalCard title="Pa de la coop" hasFooter objecte={PROPIA} />
        <UniversalCard title="Andreu Soler" hasFooter objecte={ANDREU} />
        <UniversalCard title="Mac Mini" hasFooter objecte={MAC} />
      </ProveidorXatSocDePoble>
    );
    const enPrivat = (titol) => {
      fireEvent.click(screen.getByRole('button', { name: `Comentar ${titol}` }));
      const fila = within(screen.getByRole('menu')).getByRole('menuitem', { name: TEXTOS_COMENTAR.privat[1] });
      const detall = fila.querySelector('.sdp-menu-comentar__detall').textContent;
      fireEvent.click(fila);
      return [detall, estat.navigate.mock.calls.at(-1)?.[0]];
    };
    expect(enPrivat('Pa de la coop')).toEqual([TEXTOS_COMENTAR.privatDetall[1], XAT_SOCDEPOBLE_DE_LLAVOR.href]);
    expect(enPrivat('Andreu Soler')).toEqual([TEXTOS_COMENTAR.privatDetall[1], XAT_SOCDEPOBLE_DE_LLAVOR.href]);
    expect(enPrivat('Mac Mini')).toEqual(['Un xat només entre tu i Javi', `/xat?amb=${XAT_SEED_IDS.javi}`]);
    expect(estat.toast).not.toHaveBeenCalled();
  });
});
