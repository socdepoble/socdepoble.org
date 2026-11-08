/* Revisió del Panell de Control (lot «control», 261104).

   control-03 · «Mode rural» i «Restaurar dades obertes» obrin la seua fitxa
   amb una consulta sobre la mateixa ruta (/control?fitxa=mode-rural|opendata):
   el camí no canvia i App no recoloca res. La fitxa s'ha d'obrir des de dalt
   amb el focus a <main> (també la primera vegada, quan encara es veu el text
   d'espera del mòdul diferit) i, en tornar, el Panell ha de ser on era, com
   ja fa el Snippet (vistaDeLaFitxa.js; ControlSection.test.jsx, «CU · la
   fitxa s’obri des de dalt…»). L'ordre de les proves importa: la primera
   visita de cada botó és la primera càrrega del seu mòdul diferit.

   control-06 · Els textos d'interfície del Panell passen per t(): els dos h2
   de baix i les seues entradetes i els dos botons d'acció (els textos
   d'espera de les fitxes diferides, a ControlSection.espera.test.jsx: un
   mòdul diferit ja carregat no torna a esperar, i cal un fitxer net). La reserva és el text d'abans, lletra a
   lletra: en valencià no canvia cap píxel. «L’empresa» i «La llar» venen del
   registre de plugins (ESPAIS_PLUGINS) i queden fora d'esta prova.

   Router propi en memòria; se substituïxen la UniversalPage, l'eixida segura,
   el toast, l'i18n i les dues fitxes diferides (una vista mínima amb el seu
   .content-wrapper i el botó de tornar), com a ControlSection.test.jsx. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { ESPAIS_PLUGINS } from '../plugins/registrePlugins.js';

const estat = vi.hoisted(() => ({ traductor: null, demanades: [] }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: (clau, reserva) => {
      estat.demanades.push([clau, reserva]);
      return estat.traductor ? estat.traductor(clau, reserva) : reserva;
    },
    resolveAsset: (valor) => valor
  }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' } })
}));
vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: () => ({ demana: vi.fn(), ocupat: false, avis: null, error: null })
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => (
    <section data-pagina="control">
      <p data-titol="pagina">{title}</p>
      {children}
    </section>
  )
}));
/* Les dues fitxes diferides: el cos de la vista porta el ref que els passa el
   Panell (ModeRural.poble.test.jsx i FitxaOpenData.poble.test.jsx proven que
   les de veres el posen al seu .content-wrapper). */
vi.mock('./ModeRural.jsx', () => ({
  default: ({ onBack, vistaRef }) => (
    <div ref={vistaRef} className="content-wrapper" data-fitxa="mode-rural">
      <button type="button" onClick={onBack}>Tornar</button>
    </div>
  )
}));
vi.mock('./FitxaOpenData.jsx', () => ({
  default: ({ onBack, vistaRef }) => (
    <div ref={vistaRef} className="content-wrapper" data-fitxa="opendata">
      <button type="button" onClick={onBack}>Tornar</button>
    </div>
  )
}));

import ControlSection from './ControlSection.jsx';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

/* <main> > desplaçador > l'app, com pintaDinsDeLApp de ControlSection.test.jsx:
   jsdom no fa maquetació, i el desplaçador és un element amb overflow-y i
   unes mides fixades a mà. */
function pintaDinsDeLApp({ ruta = '/control', posicio = 4000 } = {}) {
  const main = document.createElement('main');
  main.tabIndex = -1;
  const desplacador = document.createElement('div');
  desplacador.style.setProperty('overflow-y', 'auto');
  Object.defineProperty(desplacador, 'scrollHeight', { configurable: true, value: 6000 });
  Object.defineProperty(desplacador, 'clientHeight', { configurable: true, value: 750 });
  desplacador.scrollTop = posicio;
  const contenidor = document.createElement('div');
  desplacador.append(contenidor);
  main.append(desplacador);
  document.body.append(main);
  render(
    <MemoryRouter rutaInicial={ruta}>
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>,
    { container: contenidor }
  );
  return { main, desplacador, treu: () => main.remove() };
}

function pinta(ruta = '/control') {
  return render(
    <MemoryRouter rutaInicial={ruta}>
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>
  );
}

beforeEach(() => {
  estat.traductor = null;
  estat.demanades = [];
});
afterEach(cleanup);

const FITXES = [
  { boto: 'Mode rural', consulta: '/control?fitxa=mode-rural', fitxa: 'mode-rural' },
  { boto: 'Restaurar dades obertes del poble', consulta: '/control?fitxa=opendata', fitxa: 'opendata' }
];

test.each(FITXES)('control-03 · «$boto» obri la fitxa des de dalt amb el focus a <main>, també la segona vegada, i en tornar el Panell és on era', async ({ boto, consulta, fitxa }) => {
  const { main, desplacador, treu } = pintaDinsDeLApp({ posicio: 4000 });
  try {
    for (const visita of [1, 2]) {
      expect(document.querySelector('[data-titol="pagina"]').textContent, `visita ${visita}`).toBe('Panell de Control');
      fireEvent.click(screen.getByRole('button', { name: boto }));
      expect(ubicacio(), `visita ${visita}`).toBe(consulta);
      /* La primera vegada el mòdul diferit encara no hi és: es veu el text
         d'espera, i la vista ja s'ha de col·locar. La segona, ja és carregat. */
      expect(Boolean(document.querySelector('p[role="status"]')), `visita ${visita}`).toBe(visita === 1);
      if (visita === 1) {
        expect(desplacador.scrollTop, 'text d’espera').toBe(0);
        expect(document.activeElement, 'text d’espera').toBe(main);
      }
      await screen.findByRole('button', { name: 'Tornar' });
      expect(document.querySelector(`[data-fitxa="${fitxa}"]`), `visita ${visita}`).toBeTruthy();
      expect(desplacador.scrollTop, `visita ${visita}`).toBe(0);
      expect(document.activeElement, `visita ${visita}`).toBe(main);

      /* La persona baixa per la fitxa, el focus se'n va, i torna al Panell. */
      desplacador.scrollTop = 300;
      screen.getByRole('button', { name: 'Tornar' }).focus();
      fireEvent.click(screen.getByRole('button', { name: 'Tornar' }));
      expect(ubicacio(), `visita ${visita}`).toBe('/control');
      expect(desplacador.scrollTop, `visita ${visita}`).toBe(4000);
      expect(document.activeElement, `visita ${visita}`).toBe(main);
    }
  } finally {
    treu();
  }
});

/* Retirada del panell Node 0 i Mastodon (decisió de l'àrbitre, fusió del kit
   v3.0.0; Gauntlet G3: G3-posse-privacitat-01) · ?fitxa=node0-mastodon ja no
   és cap fitxa: com qualsevol valor que no n'és cap, pinta el Panell, sense
   text d'espera, i cap botó d'acció no hi porta. */
test('retirada del Node 0 · /control?fitxa=node0-mastodon pinta el Panell i cap botó porta a la fitxa retirada', () => {
  pinta('/control?fitxa=node0-mastodon');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Panell de Control');
  expect(document.querySelector('p[role="status"]')).toBeNull();
  expect(screen.queryByRole('button', { name: /node 0|mastodon/i })).toBeNull();
});

test('control-03 · en entrar directament a una fitxa diferida no es mou res', async () => {
  const { desplacador, treu } = pintaDinsDeLApp({ ruta: '/control?fitxa=mode-rural', posicio: 700 });
  try {
    await screen.findByRole('button', { name: 'Tornar' });
    expect(desplacador.scrollTop).toBe(700);
    expect(document.activeElement).toBe(document.body);
  } finally {
    treu();
  }
});

/* Els textos que el Panell pintava escrits a mà, amb la reserva d'abans. */
const TEXTOS_PANELL = [
  ['section.control.utilitats.titol', 'Utilitats i Connectors (Plugins)'],
  ['section.control.utilitats.lead', "El sistema s'anirà enriquint amb aquest tipus d'utilitats (o plugins) que es poden activar si es necessiten. Són independents del sistema base, cosa que permet endollar funcionalitats a mesura només per als usuaris o clients que les demanen."],
  ['section.control.maquinaria.titol', 'Maquinària i Sistema'],
  ['section.control.maquinaria.lead', "Panells d'administració i eines internes de la plataforma. Aquestes utilitats normalment s'activen només per a l'equip d'administració."],
  ['section.control.dubtes', 'Missatges per a dubtes'],
  /* P0-63 / IDEA-194 (261108) · L'accés directe a «El compte» del Perfil. */
  ['section.control.compte', 'Compte i contrasenya'],
  ['section.control.eixir', 'Eixir del poble']
];
const marca = (clau) => `⟦${clau}⟧`;

test('control-06 · cap h2, entradeta ni botó d’acció del Panell queda sense clau (fora dels espais del registre)', () => {
  estat.traductor = marca;
  pinta();
  const titolsDelsEspais = new Set(ESPAIS_PLUGINS.map((espai) => espai.titol));
  const h2 = [...document.querySelectorAll('.content-wrapper h2')]
    .map((h) => h.textContent)
    .filter((text) => !titolsDelsEspais.has(text));
  expect(h2.length).toBeGreaterThan(0);
  expect(h2.filter((text) => !/^⟦.+⟧$/.test(text))).toEqual([]);
  const entradetesDelsEspais = new Set(ESPAIS_PLUGINS.map((espai) => espai.entradeta));
  const leads = [...document.querySelectorAll('.content-wrapper section > p.lead')]
    .map((p) => p.textContent)
    .filter((text) => !entradetesDelsEspais.has(text));
  expect(leads.length).toBeGreaterThan(0);
  expect(leads.filter((text) => !/^⟦.+⟧$/.test(text))).toEqual([]);
  const accions = [...document.querySelectorAll('.sdp-control-actions button')].map((b) => b.textContent.trim());
  expect(accions).toHaveLength(5);
  expect(accions.filter((text) => !/^⟦.+⟧$/.test(text))).toEqual([]);
  expect(accions).toEqual([
    marca('section.control.rural.titol'),
    marca('section.pobles.restaurador.titol'),
    marca('section.control.dubtes'),
    marca('section.control.compte'),
    marca('section.control.eixir')
  ]);
});

test('control-06 · cada text nou es demana amb la seua clau i la reserva d’abans, i en valencià es pinta igual', () => {
  pinta();
  for (const [clau, reserva] of TEXTOS_PANELL) {
    expect(estat.demanades, clau).toContainEqual([clau, reserva]);
  }
  /* Llei del Píxel · En valencià, el text d'abans: els h2, les entradetes i els botons. */
  expect(screen.getByRole('heading', { level: 2, name: TEXTOS_PANELL[0][1] })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: TEXTOS_PANELL[2][1] })).toBeTruthy();
  expect(screen.getByText(TEXTOS_PANELL[1][1], { selector: 'p.lead' })).toBeTruthy();
  expect(screen.getByText(TEXTOS_PANELL[3][1], { selector: 'p.lead' })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PANELL[4][1] })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PANELL[5][1] })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PANELL[6][1] })).toBeTruthy();
});
