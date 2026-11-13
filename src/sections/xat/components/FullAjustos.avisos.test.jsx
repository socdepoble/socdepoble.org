/* B8C-6 (marató 261101_2143; B8-CLIENT §5.1) · La pàgina «Notificacions» del
   full Ajustos, muntat de veres dins de ClosCaXat (el banc de
   FullAjustos.test.jsx), amb el registre DE DEBÒ dels avisos push i un
   adaptador fals que s'hi registra quan la prova ho demana.
     · Sense cap adaptador (encara no ha arribat; la bandera és encesa des
       del 261106, Onada R9): la pàgina és IDÈNTICA a la de hui
       (el DOM de PaginaEnConstruccio de HEAD 333af8c2c, amb els id normalitzats).
     · Amb un adaptador, sessió dins, mode remot, la capacitat i el servidor
       fixat: l'interruptor, i el gest arriba a l'adaptador en el mateix tic.
     · Amb el motiu d'iOS: només la nota d'instal·lar.
     · Amb un adaptador natiu sense connector ('sense-connector'), o sense
       alguna de les condicions: la construcció de hui (ARB-06). */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import EN from '../../../config/idiomes/en.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';
import ClosCaXat, { BotoObriRail, CLAU_RAIL } from './ClosCaXat.jsx';
import PanellInicialMobil from './PanellInicialMobil.jsx';
/* Onada R9 (C3) · El motor del registre, que s'endolla a la façana en avaluar-se (com a l'entrada). */
import '../../../config/motorAvisosPushXat.js';
import {
  AVISOS_PUSH_XAT_ACTIUS, avisosPushDisponibles, fixaServidorAvisosPush, registraAvisosPush
} from '../../../config/avisosPushXat.js';
import { TEXTOS_AVISOS, TEXTOS_AVISOS_ENTORN } from '../useAvisosPushXat.js';

/* Els diccionaris de les 5 llengües, per al t del banc (vegeu el mock d'UIContext). */
const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  sessio: null,
  mode: 'remote',
  capacitat: true,
  motiu: null,
  tipus: 'web',
  language: 'ca'
}));

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/xat' }),
  useSearchParams: () => [new URLSearchParams()],
  useParams: () => ({})
}));
/* El t del banc: les claus dels avisos de la pàgina «Notificacions», amb el diccionari de la llengua
   triada (com el t de UIContext); la resta, la reserva valenciana, perquè el banc navega pel full
   amb els noms de sempre. */
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: (clau, alternativa) => (String(clau).startsWith('section.xat.ajustos.avisos.') && DICCIONARIS[mocks.language]?.[clau]) || alternativa,
    setTheme: vi.fn(),
    setLanguage: vi.fn()
  }),
  useUIState: () => ({ themePreference: 'light', language: mocks.language })
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../XatContext', () => ({
  useXat: () => ({ comunitats: [], joId: 'A', joNom: 'Javi Llinares', chatThreads: [], modeDades: mocks.mode })
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => mocks.sessio,
  useSession: () => mocks.sessio
}));
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => cap === 'avisosPush' && mocks.capacitat
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

/* El DOM de la pàgina «Notificacions» a HEAD 333af8c2c (abans de B8C-6). */
const CONSTRUCCIO_DE_HUI = '<section class="sdp-xat-ajustos__buit" aria-labelledby="ID"><h3 id="ID" class="sdp-xat-ajustos__buit-titol">En construcció</h3>'
  + '<p class="sdp-xat-ajustos__buit-text">Ací podràs triar com t’avisa el xat dels missatges nous, dels grups i de les reaccions.</p>'
  + '<p class="sdp-xat-ajustos__buit-text">Encara no està disponible: es construirà en una fase següent del xat.</p></section>';

/* L'adaptador fals: el tipus i el motiu es lligen a cada publicació del registre. */
const adaptador = {
  get tipus() { return mocks.tipus; },
  motiu: () => mocks.motiu,
  estat: vi.fn(async () => ({ estat: 'inactiu' })),
  activa: vi.fn(() => Promise.resolve({ estat: 'actiu' })),
  desactiva: vi.fn(async () => ({ estat: 'inactiu' })),
  sincronitza: vi.fn(async () => ({ estat: 'inactiu' })),
  neteja: vi.fn(async () => {}),
  oblida: vi.fn(),
  escoltaToc: vi.fn(() => () => {})
};
/* Registra (una vegada) i torna a publicar l'instantània amb el servidor de la persona, o sense. */
function ambAdaptador({ tipus = 'web', motiu = null, servidor = true } = {}) {
  mocks.tipus = tipus;
  mocks.motiu = motiu;
  registraAvisosPush(adaptador);
  fixaServidorAvisosPush(null);
  if (servidor) fixaServidorAvisosPush({ ambit: 'A', desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) });
}

let abans = null;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  abans = getVal(CLAU_RAIL);
  setVal(CLAU_RAIL, 'obert');
  mocks.navigate.mockReset();
  mocks.sessio = { estat: 'dins', currentUser: { id: 'A', email: 'a@exemple.org' }, preparaEixida: vi.fn(async () => ({})), logout: vi.fn() };
  mocks.mode = 'remote';
  mocks.capacitat = true;
  mocks.language = 'ca';
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (abans == null) delVal(CLAU_RAIL);
  else setVal(CLAU_RAIL, abans);
});

const full = () => screen.getByRole('dialog', { name: 'Ajustos' });
function obriNotificacions() {
  const middle = (
    <aside className="sdp-workspace-column" aria-label="Xats">
      <PanellInicialMobil />
      <BotoObriRail etiqueta="Menú" />
    </aside>
  );
  render(<ClosCaXat middleTitle="Xats" middleColumn={middle} rightColumn={<div />} />);
  fireEvent.click(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Tu: ajustos' }));
  fireEvent.click(within(full()).getByRole('button', { name: /^Notificacions/ }));
  return full().querySelector('.sdp-xat-ajustos__cos');
}
const normalitza = (html) => html.replace(/(id|aria-labelledby)="[^"]*"/g, '$1="ID"');

/* Onada R9 (C3, G8-08 e) · La bandera de debò és encesa des del 261106. Este
   cas ja no és «la bandera apagada»: és l'estona (o la càrrega sense xarxa) en
   què el motor i l'adaptador encara no han arribat. Llavors no hi ha res a
   oferir i la pàgina ha de ser la de hui. La web sense clau VAPID (amb
   adaptador) és el cas «sense clau» de baix, que també ho prova. */
describe('bandera encesa (la de debò), abans que arribe cap adaptador', () => {
  test('cap adaptador registrat encara: la pàgina és idèntica a la de hui, sense interruptor', () => {
    expect(AVISOS_PUSH_XAT_ACTIUS).toBe(true);
    expect(avisosPushDisponibles()).toBe(false);
    const cos = obriNotificacions();
    expect(normalitza(cos.innerHTML)).toBe(CONSTRUCCIO_DE_HUI);
    expect(screen.queryByRole('switch')).toBeNull();
  });
});

describe('amb un adaptador registrat', () => {
  test('amb totes les condicions: l\'interruptor i les notes; el gest arriba a l\'adaptador en el mateix tic', () => {
    ambAdaptador();
    const cos = obriNotificacions();
    expect(within(cos).queryByRole('region', { name: 'En construcció' })).toBeNull();
    const interruptor = within(cos).getByRole('switch', { name: TEXTOS_AVISOS.interruptor[1] });
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
    expect([...cos.querySelectorAll('.sdp-xat-ajustos__nota')].map((n) => n.textContent))
      .toEqual([TEXTOS_AVISOS.cec[1], TEXTOS_AVISOS.eixida[1]]);
    fireEvent.click(interruptor);
    expect(adaptador.activa).toHaveBeenCalledTimes(1);
    /* El registre ja és ocupat: l'interruptor, desactivat (el pany entre gestos). */
    expect(interruptor.disabled).toBe(true);
  });

  test('amb el motiu d\'iOS (sense l\'app a la pantalla d\'inici): només la nota, sense interruptor', () => {
    ambAdaptador({ motiu: 'ios-sense-instalar' });
    const cos = obriNotificacions();
    expect(screen.queryByRole('switch')).toBeNull();
    expect([...cos.querySelectorAll('.sdp-xat-ajustos__nota')].map((n) => n.textContent)).toEqual([TEXTOS_AVISOS.ios[1]]);
  });

  test.each([
    ['web', 'sense-clau'],
    ['web', 'sense-config'],
    ['natiu', 'sense-connector']
  ])('R21.4-UI (R21.2-F04) · %s amb motiu %s mostra avís honest d\'entorn en les 5 llengües, sense interruptor ni "En construcció"', (tipus, motiu) => {
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      mocks.language = llengua;
      ambAdaptador({ tipus, motiu });
      const cos = obriNotificacions();
      expect(within(cos).queryByRole('region', { name: 'En construcció' })).toBeNull();
      expect(screen.queryByRole('switch')).toBeNull();
      const estat = within(cos).getByRole('status');
      expect(estat.textContent).toBe(DICCIONARIS[llengua][TEXTOS_AVISOS_ENTORN[motiu][0]]);
      cleanup();
    }
  });

  test.each([
    ['sense el servidor fixat', () => ambAdaptador({ servidor: false })],
    ['amb la sessió fora', () => { ambAdaptador(); mocks.sessio = null; }],
    ['amb la sessió en comprovant', () => { ambAdaptador(); mocks.sessio = { ...mocks.sessio, estat: 'comprovant' }; }],
    ['en llavor', () => { ambAdaptador(); mocks.mode = 'seed'; }],
    ['sense la capacitat avisosPush', () => { ambAdaptador(); mocks.capacitat = false; }]
  ])('%s: la construcció de hui', (_nom, prepara) => {
    prepara();
    const cos = obriNotificacions();
    expect(normalitza(cos.innerHTML)).toBe(CONSTRUCCIO_DE_HUI);
  });
});
