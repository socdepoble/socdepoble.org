/**
 * ClosCaXatSimplificat.r32_46.test.jsx — Verificació d'extrem a extrem de
 * IDEA-327 v2 (Ronda G2 · R32.46):
 *   1. Zero botons separats `[|>]` / `[<|]` i zero fila superior «⚙️ Menú» al rail.
 *   2. Capçalera clicable `[Icona + Nom de secció + ▸/◂]` en les 5 llengües
 *      (`Xats`, `Chats`, `Chats`, `Txatak`, `Chats`), i només `🔍` i `+` a la dreta.
 *   3. Fila explícita «⚙️ Ajustos del xat» (5 llengües) dins del menú lateral
 *      obrint `FullAjustos`.
 *   4. Peu esquerre amb l'avatar i nom de la identitat activa (`Javi`,
 *      `Sóc de Poble`, `El Rentonar`) obrint el selector global
 *      `CalaixIdentitats` («Amb qui actues?») i cridant `setActor`.
 *   5. v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · T47 C01: l'«Eixir» del
 *      calaix pregunta abans (preparaEixida), com la barra negra; i, sense
 *      sessió (IDEA-323), el peu és el de la v1.2.22, «Tu: ajustos» → FullAjustos.
 */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
/* v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · Tradueix a es/en/eu/gl: els cinc
   diccionaris abans de cap prova (i18n.idiomes.test.js ho exigix). */
import '../../../../tests/helpers/diccionaris.js';
import { carregaDiccionari, createTranslator } from '../../../config/i18n.js';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { columnaPlegadaDe, desaColumnaPlegada } from '../../../components/universal/workspace/persistenciaColumnesUI.js';
import { TEXTOS_AVIS_EIXIDA, textPendentsEixida } from '../../../components/universal/EixidaSegura.jsx';
import CalaixIdentitats from '../../../components/universal/identitat/CalaixIdentitats.jsx';
import { TEXTOS_CALAIX_IDENTITATS } from '../../../components/universal/identitat/textosCalaixIdentitats.js';
import ClosCaXat, { BotoTitolSeccioXat, CLAU_RAIL } from './ClosCaXat.jsx';
import PanellInicialMobil from './PanellInicialMobil.jsx';

const mocks = vi.hoisted(() => ({
  language: 'ca',
  amplada: 1280,
  navigate: vi.fn(),
  identitat: null,
  sessio: {
    currentUser: { id: 'javi-id', email: 'javi@socdepoble.org' },
    logout: vi.fn(async () => {})
  }
}));

vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitatOpcional: () => mocks.identitat,
  useIdentitat: () => mocks.identitat
}));

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/xat' }),
  useSearchParams: () => [new URLSearchParams()],
  useParams: () => ({})
}));

vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: createTranslator(mocks.language),
    setTheme: vi.fn(),
    setContrast: vi.fn(),
    setLanguage: vi.fn()
  }),
  useUIState: () => ({ themePreference: 'light', contrastPreference: 'normal', language: mocks.language })
}));

vi.mock('../../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', towns: [] })
}));

vi.mock('../../../app/contexts/SessionContext', () => ({
  useSessioOpcional: () => mocks.sessio,
  useSession: () => mocks.sessio
}));

vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => mocks.sessio,
  useSession: () => mocks.sessio
}));

const IDENTITATS_BASE = Object.freeze([
  { tipus: 'persona', id: 'javi-id', nom: 'Javi', avatar: '/assets/profile-javi.jpg', rol: 'persona' },
  { tipus: 'entitat', id: 'sdp-id', nom: 'Sóc de Poble', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png', rol: 'admin' },
  { tipus: 'entitat', id: 'rentonar-id', nom: 'El Rentonar', avatar: null, rol: 'editor' }
]);

/* `jo`: null és Javi amb sessió; v1.2.23 · { joId, joNom } fa de Foraster (remot,
   joId null) o de convidat de la llavor (joId local, sense nom ni sessió). */
const actorRef = vi.hoisted(() => ({ activaId: 'javi-id', jo: null }));

vi.mock('../XatContext', () => ({
  useXat: () => {
    if (actorRef.jo) {
      return { comunitats: [], joAvatar: null, entitatActiva: null, chatThreads: [], ...actorRef.jo };
    }
    const entitat = IDENTITATS_BASE.find((i) => i.tipus === 'entitat' && i.id === actorRef.activaId) || null;
    return {
      comunitats: [],
      joId: 'javi-id',
      joNom: 'Javi',
      joAvatar: '/assets/profile-javi.jpg',
      entitatActiva: entitat,
      chatThreads: []
    };
  }
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return mocks.amplada; }
});

let railAbans = null;
let columnaAbans = undefined;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  railAbans = getVal(CLAU_RAIL);
  columnaAbans = columnaPlegadaDe('xat', 'left');
  delVal(CLAU_RAIL);
  desaColumnaPlegada('xat', 'left', true);
  mocks.language = 'ca';
  mocks.amplada = 1280;
  mocks.navigate.mockReset();
  mocks.sessio = {
    currentUser: { id: 'javi-id', email: 'javi@socdepoble.org' },
    logout: vi.fn(async () => {})
  };
  actorRef.activaId = 'javi-id';
  actorRef.jo = null;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (railAbans == null) delVal(CLAU_RAIL);
  else setVal(CLAU_RAIL, railAbans);
  if (typeof columnaAbans === 'boolean') desaColumnaPlegada('xat', 'left', columnaAbans);
});

/* v1.2.23 · L5-01 (Gauntlet R1) · `remunta`: la closca porta la clau de l'actor,
   com XatSection.jsx (XatWorkspace key={xat.ambitEstable}, amb l'actorKey): triar
   una altra identitat la torna a muntar sencera. */
function ArbreAmbIdentitats({ setActorSpy = vi.fn(), remunta = false }) {
  const [activaId, setActivaId] = useState(actorRef.activaId);
  actorRef.activaId = activaId;
  const t = createTranslator(mocks.language);
  const titolXats = t('section.xat.llista.titol', 'Xats');

  const identitats = IDENTITATS_BASE.map((item) => ({
    ...item,
    activa: item.id === activaId
  }));
  const activa = identitats.find((i) => i.activa) || identitats[0];

  const canviaActor = (tipus, id) => {
    setActorSpy(tipus, id);
    setActivaId(tipus === 'persona' ? 'javi-id' : id);
  };

  mocks.identitat = {
    identitats,
    identitatActiva: activa,
    actor: { tipus: activa.tipus, id: activa.id },
    setActor: canviaActor
  };

  return (
    <ClosCaXat
      key={remunta ? activaId : 'closca'}
      middleTitle={titolXats}
      middleColumn={(
        <aside className="sdp-workspace-column" aria-label={titolXats}>
          <div className="app-grid-col-header app-grid-col-header--dark">
            <BotoTitolSeccioXat titol={titolXats} />
          </div>
        </aside>
      )}
      /* v1.2.23 · L5-01 (Gauntlet R1) · Com XatSection.jsx (rightColumn): en estret, la llista primer. En ample no fa res. */
      rightColumn={<div><PanellInicialMobil /></div>}
    />
  );
}

describe('IDEA-327 v2 (R32.46) · ClosCaXat simplificat', () => {
  test.each([
    ['ca', 'Xats', 'Ajustos del xat'],
    ['es', 'Chats', 'Ajustes del chat'],
    ['en', 'Chats', 'Chat settings'],
    ['eu', 'Txatak', 'Txataren ezarpenak'],
    ['gl', 'Chats', 'Axustes do chat']
  ])('llengua «%s»: títol «%s ▸/◂» desplega el rail sense fila «Menú» i obri «%s»', async (idioma, titolEsperat, ajustosEsperat) => {
    mocks.language = idioma;
    await carregaDiccionari(idioma);
    render(<ArbreAmbIdentitats />);

    const sidebar = document.getElementById('app-grid-sidebar');
    expect(sidebar.querySelector('.app-grid-col-header__rail-top')).toBeNull();
    expect(within(sidebar).queryByRole('button', { name: /Menú|Menu|Menua/ })).toBeNull();

    const botoTitol = document.querySelector('#app-grid-list .sdp-xat-titol-seccio');
    expect(botoTitol.querySelector('.app-grid-col-header__titol')?.textContent).toBe(titolEsperat);
    expect(botoTitol.querySelector('.sdp-xat-titol-seccio__fletxa')?.textContent).toBe('▸');
    expect(botoTitol.getAttribute('aria-expanded')).toBe('false');

    /* Desplega cap a la dreta: fletxa passa a `◂` i es veu la fila explícita d'Ajustos del xat. */
    fireEvent.click(botoTitol);
    expect(botoTitol.getAttribute('aria-expanded')).toBe('true');
    expect(botoTitol.querySelector('.sdp-xat-titol-seccio__fletxa')?.textContent).toBe('◂');

    const botoAjustos = within(sidebar).getByRole('button', { name: ajustosEsperat });
    fireEvent.click(botoAjustos);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  test('el peu esquerre mostra la identitat activa i obri «Amb qui actues?» commutant entre Javi, Sóc de Poble i El Rentonar', () => {
    setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', false);
    const setActorSpy = vi.fn();
    render(<ArbreAmbIdentitats setActorSpy={setActorSpy} />);

    const sidebar = document.getElementById('app-grid-sidebar');
    const peu = () => sidebar.querySelector('.sdp-xat-rail-peu');

    /* Inicialment actua com a Javi. */
    const botoJavi = within(peu()).getByRole('button', { name: 'Javi: Amb qui actues?' });
    expect(within(botoJavi).getByText('Javi')).toBeTruthy();
    fireEvent.click(botoJavi);

    /* S'obri CalaixIdentitats («Amb qui actues?») i triem Sóc de Poble. */
    const calaix = screen.getByRole('dialog', { name: 'Amb qui actues?' });
    fireEvent.click(within(calaix).getByRole('button', { name: /^Sóc de Poble/ }));
    expect(setActorSpy).toHaveBeenLastCalledWith('entitat', 'sdp-id');
    expect(screen.queryByRole('dialog', { name: 'Amb qui actues?' })).toBeNull();

    /* Ara el peu mostra Sóc de Poble; tornem a obrir i triem El Rentonar. */
    const botoSdp = within(peu()).getByRole('button', { name: 'Sóc de Poble: Amb qui actues?' });
    expect(within(botoSdp).getByText('Sóc de Poble')).toBeTruthy();
    fireEvent.click(botoSdp);
    const calaix2 = screen.getByRole('dialog', { name: 'Amb qui actues?' });
    fireEvent.click(within(calaix2).getByRole('button', { name: /^El Rentonar/ }));
    expect(setActorSpy).toHaveBeenLastCalledWith('entitat', 'rentonar-id');

    /* Ara el peu mostra El Rentonar; tornem a obrir i tornem a Javi. */
    const botoRentonar = within(peu()).getByRole('button', { name: 'El Rentonar: Amb qui actues?' });
    expect(within(botoRentonar).getByText('El Rentonar')).toBeTruthy();
    fireEvent.click(botoRentonar);
    const calaix3 = screen.getByRole('dialog', { name: 'Amb qui actues?' });
    fireEvent.click(within(calaix3).getByRole('button', { name: /^Javi/ }));
    expect(setActorSpy).toHaveBeenLastCalledWith('persona', 'javi-id');
    expect(within(peu()).getByRole('button', { name: 'Javi: Amb qui actues?' })).toBeTruthy();
  });
});

/* ═══ v1.2.23 · IDEA-327 v2 (ordre del Mestre 261123) · T47 C01 ═══════════
   «Res no s'oblida en silenci» (260928): l'«Eixir de Sóc de Poble» del calaix
   que munta el peu del rail pregunta abans a la sessió (preparaEixida), com la
   barra negra (useIdentitatDeLaBarra.eixida.test.jsx) i «Tanca la sessió» de
   FullAjustos (EixidaSegura). Si queda res, l'avís dins del calaix i cap
   logout; si el logout falla, l'error i cap navegació. */
const PENDENT = Object.freeze([{ entitat: 'nota', id: 'n-1', camps: ['content'] }]);

function obriCalaixIEixir() {
  setVal(CLAU_RAIL, 'obert');
  desaColumnaPlegada('xat', 'left', false);
  const t = createTranslator(mocks.language);
  render(<ArbreAmbIdentitats />);
  const peu = document.getElementById('app-grid-sidebar').querySelector('.sdp-xat-rail-peu');
  fireEvent.click(within(peu).getByRole('button', { name: t('section.xat.rail.ambQuiActues').replace('{nom}', 'Javi') }));
  /* v1.2.23 · L5-02 (Gauntlet R1) · El calaix porta el títol en la llengua del peu. */
  const calaix = screen.getByRole('dialog', { name: TEXTOS_CALAIX_IDENTITATS[mocks.language].titol });
  const eixir = within(calaix).getByRole('button', { name: t('topbar.identitat.eixir') });
  fireEvent.click(eixir);
  return { calaix, eixir };
}

describe('v1.2.23 · T47 C01 · l’eixida del calaix del xat pregunta abans', () => {
  test('amb canvis sense desar, «Eixir» no tanca la sessió: avís dins del calaix, «No eixir encara» torna el focus i només «Eixir igualment» ix', async () => {
    mocks.sessio.preparaEixida = vi.fn(async () => PENDENT);
    const { calaix, eixir } = obriCalaixIEixir();
    await within(calaix).findByText(TEXTOS_AVIS_EIXIDA.ca.titol);
    expect(within(calaix).getByText(textPendentsEixida(PENDENT, 'ca'))).toBeTruthy();
    expect(mocks.sessio.preparaEixida).toHaveBeenCalledTimes(1);
    expect(mocks.sessio.logout).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();

    fireEvent.click(within(calaix).getByRole('button', { name: TEXTOS_AVIS_EIXIDA.ca.noEixir }));
    expect(within(calaix).queryByText(TEXTOS_AVIS_EIXIDA.ca.titol)).toBeNull();
    expect(document.activeElement).toBe(eixir);
    expect(mocks.sessio.logout).not.toHaveBeenCalled();

    fireEvent.click(eixir);
    fireEvent.click(await within(calaix).findByRole('button', { name: TEXTOS_AVIS_EIXIDA.ca.eixirIgualment }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/registre', { replace: true }));
    expect(mocks.sessio.preparaEixida).toHaveBeenCalledTimes(2);
    expect(mocks.sessio.logout).toHaveBeenCalledTimes(1);
  });

  test('sense res pendent, ix a la primera: preparaEixida abans del logout, una sola vegada, i /registre', async () => {
    mocks.sessio.preparaEixida = vi.fn(async () => []);
    obriCalaixIEixir();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/registre', { replace: true }));
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(mocks.sessio.preparaEixida).toHaveBeenCalledTimes(1);
    expect(mocks.sessio.logout).toHaveBeenCalledTimes(1);
    expect(mocks.sessio.preparaEixida.mock.invocationCallOrder[0]).toBeLessThan(mocks.sessio.logout.mock.invocationCallOrder[0]);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Amb qui actues?' })).toBeNull());
  });

  test('si el logout falla, l’error es veu dins del calaix, no es navega i el botó torna a estar disponible', async () => {
    mocks.sessio.preparaEixida = vi.fn(async () => []);
    mocks.sessio.logout = vi.fn(async () => { throw new Error('sense xarxa'); });
    const { calaix, eixir } = obriCalaixIEixir();
    await within(calaix).findByText(TEXTOS_AVIS_EIXIDA.ca.error);
    expect(mocks.sessio.logout).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Amb qui actues?' })).toBeTruthy();
    expect(eixir.disabled).toBe(false);
    expect(eixir.getAttribute('aria-busy')).toBeNull();
  });

  test('l’avís parla la llengua de la interfície (es)', async () => {
    mocks.language = 'es';
    mocks.sessio.preparaEixida = vi.fn(async () => PENDENT);
    const { calaix } = obriCalaixIEixir();
    await within(calaix).findByText(TEXTOS_AVIS_EIXIDA.es.titol);
    expect(within(calaix).getByText(textPendentsEixida(PENDENT, 'es'))).toBeTruthy();
    expect(within(calaix).getByRole('button', { name: TEXTOS_AVIS_EIXIDA.es.eixirIgualment })).toBeTruthy();
    expect(mocks.sessio.logout).not.toHaveBeenCalled();
  });
});

/* ═══ v1.2.23 · IDEA-323 / IDEA-327 v2 (ordre del Mestre 261123) ══════════
   Sense sessió no hi ha identitat activa. Amb el SessionProvider de l'App i
   cap persona dins (el Foraster en remot, joId null; el convidat de la
   llavor, joId local), el peu no promet cap selector: és el de la v1.2.22,
   «Tu: ajustos», que obri FullAjustos, i no navega enlloc. */
describe('v1.2.23 · IDEA-323 · el peu del rail sense sessió', () => {
  test.each([
    ['el Foraster (remot)', true, { joId: null, joNom: null }],
    ['el Foraster (remot)', false, { joId: null, joNom: null }],
    ['el convidat de la llavor', true, { joId: 'convidat-local', joNom: null }],
    ['el convidat de la llavor', false, { joId: 'convidat-local', joNom: null }]
  ])('%s (plegat=%s): «Tu: ajustos» obri FullAjustos i no hi ha cap «Amb qui actues?»', (_cas, plegat, jo) => {
    actorRef.jo = jo;
    mocks.identitat = null;
    mocks.sessio = { currentUser: null, logout: vi.fn(async () => {}), preparaEixida: vi.fn(async () => []) };
    if (!plegat) setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', plegat);
    render(<ClosCaXat middleTitle="Xats" middleColumn={<div />} rightColumn={<div />} />);

    const peu = document.getElementById('app-grid-sidebar').querySelector(plegat ? '.sdp-xat-rail-peu--plegat' : '.sdp-xat-rail-peu');
    expect(within(peu).queryByRole('button', { name: /Amb qui actues\?/ })).toBeNull();
    const boto = within(peu).getByRole('button', { name: 'Tu: ajustos' });
    expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
    fireEvent.click(boto);
    expect(screen.getByRole('dialog', { name: 'Ajustos' })).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Amb qui actues?' })).toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

/* ═══ v1.2.23 · L5-01 (Gauntlet R1) ═══════════════════════════════════════
   Triar una altra identitat des del peu canvia l'actor, i a l'App el Xat es
   torna a muntar sencer (XatSection: XatWorkspace key={xat.ambitEstable}). El
   botó que havia obert el calaix se'n va amb la closca vella: el focus queia
   a <body>. Ara el rail nou el torna al seu peu, o al botó que obri el rail si
   el peu és dins del rail tancat (estret). */
describe('v1.2.23 · L5-01 · triar identitat amb el remunt del Xat no perd el focus', () => {
  test.each([
    ['desplegat', 1280, false, '.sdp-xat-rail-peu .sdp-xat-ajustos-entrada'],
    ['plegat', 1280, true, '.sdp-xat-rail-peu--plegat .sdp-workspace-rail__boto']
  ])('ample, rail %s: el focus va al peu de la closca nova («Sóc de Poble: Amb qui actues?»)', async (_cas, amplada, plegat, selector) => {
    mocks.amplada = amplada;
    if (!plegat) setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', plegat);
    const setActorSpy = vi.fn();
    render(<ArbreAmbIdentitats remunta setActorSpy={setActorSpy} />);
    const sidebar = () => document.getElementById('app-grid-sidebar');

    const peuVell = sidebar().querySelector(selector);
    expect(peuVell.getAttribute('aria-label')).toBe('Javi: Amb qui actues?');
    peuVell.focus();
    fireEvent.click(peuVell);
    const calaix = screen.getByRole('dialog', { name: 'Amb qui actues?' });
    fireEvent.click(within(calaix).getByRole('button', { name: /^Sóc de Poble/ }));
    await act(async () => {});

    expect(setActorSpy).toHaveBeenLastCalledWith('entitat', 'sdp-id');
    expect(peuVell.isConnected).toBe(false);
    const peuNou = sidebar().querySelector(selector);
    expect(peuNou.getAttribute('aria-label')).toBe('Sóc de Poble: Amb qui actues?');
    expect(document.activeElement).toBe(peuNou);
  });

  test('estret: el peu és dins del rail tancat i el focus va al títol que obri el rail', async () => {
    mocks.amplada = 400;
    setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', false);
    render(<ArbreAmbIdentitats remunta />);
    const obridor = () => document.querySelector('#app-grid-list .sdp-xat-obri-rail');

    fireEvent.click(obridor());
    const peuVell = document.getElementById('app-grid-sidebar').querySelector('.sdp-xat-rail-peu .sdp-xat-ajustos-entrada');
    peuVell.focus();
    fireEvent.click(peuVell);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Amb qui actues?' })).getByRole('button', { name: /^Sóc de Poble/ }));
    await act(async () => {});

    expect(peuVell.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(obridor());
  });

  test('sense remunt (la identitat que ja era activa), el focus torna al mateix peu i la marca no queda per a cap altre rail', async () => {
    setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', false);
    const { unmount } = render(<ArbreAmbIdentitats remunta />);
    const peu = document.getElementById('app-grid-sidebar').querySelector('.sdp-xat-rail-peu .sdp-xat-ajustos-entrada');
    peu.focus();
    fireEvent.click(peu);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Amb qui actues?' })).getByRole('button', { name: /^Javi/ }));
    await act(async () => {});
    expect(peu.isConnected).toBe(true);
    expect(document.activeElement).toBe(peu);

    /* v1.2.23 · L5-01 (Gauntlet R1) · La sonda del verificador: un rail que es
       munta tot seguit (abans d'1 s, VIDA_RETORN) amb el focus a <body> no
       hereta la marca de la tria sense remunt i no s'enduu el focus al peu. */
    unmount();
    document.body.focus();
    render(<ArbreAmbIdentitats remunta />);
    const peuNou = document.getElementById('app-grid-sidebar').querySelector('.sdp-xat-rail-peu .sdp-xat-ajustos-entrada');
    expect(peuNou).toBeTruthy();
    expect(document.activeElement).not.toBe(peuNou);
    expect(document.activeElement).toBe(document.body);
  });
});

/* ═══ v1.2.23 · L5-02 (Gauntlet R1) ═══════════════════════════════════════
   El peu del rail ja parla la llengua de la interfície («Javi: Who are you
   acting as?») i obria un calaix que només parlava valencià. El calaix del Xat
   porta ara el títol, la descripció, la llista, «Activa» i els rols en eixa
   llengua; el títol és el de section.xat.rail.ambQuiActues sense «{nom}: ». */
describe('v1.2.23 · L5-02 · el calaix del Xat parla la llengua del peu', () => {
  test.each(['ca', 'es', 'en', 'eu', 'gl'])('llengua «%s»: títol, descripció, llista, insígnia i rols', async (idioma) => {
    mocks.language = idioma;
    await carregaDiccionari(idioma);
    setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', false);
    render(<ArbreAmbIdentitats />);
    const t = createTranslator(idioma);
    const tx = TEXTOS_CALAIX_IDENTITATS[idioma];
    const plantilla = t('section.xat.rail.ambQuiActues');
    expect(plantilla.startsWith('{nom}: ')).toBe(true);
    expect(plantilla.slice('{nom}: '.length)).toBe(tx.titol);

    const peu = document.getElementById('app-grid-sidebar').querySelector('.sdp-xat-rail-peu');
    fireEvent.click(within(peu).getByRole('button', { name: plantilla.replace('{nom}', 'Javi') }));
    const calaix = screen.getByRole('dialog', { name: tx.titol });
    expect(within(calaix).getByText(tx.descripcio)).toBeTruthy();
    const llista = within(calaix).getByRole('list', { name: tx.llista });
    const javi = within(llista).getByRole('button', { name: /^Javi/ });
    expect(within(javi).getByText(tx.activa)).toBeTruthy();
    expect(within(javi).getByText(t('section.perfil.membres.tipus.persona'))).toBeTruthy();
    expect(within(within(llista).getByRole('button', { name: /^Sóc de Poble/ })).getByText(t('section.perfil.rol.admin'))).toBeTruthy();
    /* v1.2.23 · L5-02 (Gauntlet R1) · «editor» no és cap rol de rols.js: «Organització», com fins ara. */
    expect(within(within(llista).getByRole('button', { name: /^El Rentonar/ })).getByText(t('section.perfil.membres.tipus.organitzacio'))).toBeTruthy();
  });

  test('en anglés, el cas del Gauntlet: «Javi: Who are you acting as?» obri «Who are you acting as?», amb «Active» i «Administrator»', async () => {
    mocks.language = 'en';
    await carregaDiccionari('en');
    setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', false);
    render(<ArbreAmbIdentitats />);
    const peu = document.getElementById('app-grid-sidebar').querySelector('.sdp-xat-rail-peu');
    fireEvent.click(within(peu).getByRole('button', { name: 'Javi: Who are you acting as?' }));
    const calaix = screen.getByRole('dialog', { name: 'Who are you acting as?' });
    expect(within(calaix).queryByText('Amb qui actues?')).toBeNull();
    expect(within(calaix).getByRole('list', { name: 'Identities' })).toBeTruthy();
    expect(within(within(calaix).getByRole('button', { name: /^Javi/ })).getByText('Active')).toBeTruthy();
    expect(within(within(calaix).getByRole('button', { name: /^Sóc de Poble/ })).getByText('Administrator')).toBeTruthy();
  });

  test('sense etiquetes (el catàleg, i la barra negra en valencià), CalaixIdentitats pinta el valencià de textosCalaixIdentitats.ca', () => {
    const tx = TEXTOS_CALAIX_IDENTITATS.ca;
    render(<CalaixIdentitats obert identitats={[
      { tipus: 'persona', id: 'p', nom: 'Javi', rol: 'persona', activa: true },
      { tipus: 'entitat', id: 'e', nom: 'Sóc de Poble', rol: 'admin' }
    ]} />);
    const calaix = screen.getByRole('dialog', { name: tx.titol });
    expect(within(calaix).getByText(tx.descripcio)).toBeTruthy();
    const llista = within(calaix).getByRole('list', { name: tx.llista });
    expect(within(within(llista).getByRole('button', { name: /^Javi/ })).getByText(tx.activa)).toBeTruthy();
    expect(within(within(llista).getByRole('button', { name: /^Javi/ })).getByText('Persona')).toBeTruthy();
    expect(within(within(llista).getByRole('button', { name: /^Sóc de Poble/ })).getByText('Administra')).toBeTruthy();
  });
});

/* ═══ v1.2.23 · L5-05 (Gauntlet R1) ═══════════════════════════════════════
   Com la barra negra (useIdentitatDeLaBarra.js): si la identitat activa se'n
   va amb el calaix obert, el calaix es tanca. */
describe('v1.2.23 · L5-05 · el calaix del Xat es tanca si la sessió se’n va', () => {
  test('amb el calaix obert, sense sessió ja no hi ha calaix ni «Amb qui actues?»', () => {
    setVal(CLAU_RAIL, 'obert');
    desaColumnaPlegada('xat', 'left', false);
    const { rerender } = render(<ArbreAmbIdentitats />);
    const peu = () => document.getElementById('app-grid-sidebar').querySelector('.sdp-xat-rail-peu');
    fireEvent.click(within(peu()).getByRole('button', { name: 'Javi: Amb qui actues?' }));
    expect(screen.getByRole('dialog', { name: 'Amb qui actues?' })).toBeTruthy();

    mocks.sessio = { currentUser: null, logout: vi.fn(async () => {}), preparaEixida: vi.fn(async () => []) };
    rerender(<ArbreAmbIdentitats />);
    expect(screen.queryByRole('dialog', { name: 'Amb qui actues?' })).toBeNull();
    expect(within(peu()).getByRole('button', { name: 'Tu: ajustos' })).toBeTruthy();
  });
});
