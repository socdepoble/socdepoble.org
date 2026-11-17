/* Revisió del Panell de Control (lot «control», 261104).

   control-03 · «Mode rural» i «Restaurar dades obertes» obrin la seua fitxa
   amb una consulta sobre la mateixa ruta (/control?fitxa=mode-rural|opendata):
   el camí no canvia i App no recoloca res. La fitxa s'ha d'obrir des de dalt
   amb el focus a <main> (també la primera vegada, quan encara es veu el text
   d'espera del mòdul diferit) i, en tornar, el Panell ha de ser on era, com
   ja fa el Snippet (vistaDeLaFitxa.js; ControlSection.test.jsx, «CU · la
   fitxa s’obri des de dalt…»). L'ordre de les proves importa: la primera
   visita de cada botó és la primera càrrega del seu mòdul diferit.

   control-06 · Els textos globals del Panell passen per t(); el giny diferit
   real resol el seu catàleg local en ca/es/en/eu/gl. Es comproven tots els h2,
   entradetes i botons dels dos contractes (els textos
   d'espera de les fitxes diferides, a ControlSection.espera.test.jsx: un
   mòdul diferit ja carregat no torna a esperar, i cal un fitxer net). La reserva és el text d'abans, lletra a
   lletra: en valencià no canvia cap píxel. «L’empresa» i «La llar» venen del
   registre de plugins (ESPAIS_PLUGINS) i queden fora d'esta prova.

   Router propi en memòria; se substituïxen la UniversalPage, l'eixida segura,
   el toast, l'i18n i les dues fitxes diferides (una vista mínima amb el seu
   .content-wrapper i el botó de tornar), com a ControlSection.test.jsx. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { ESPAIS_PLUGINS, TEXTOS_ESPAIS_PLUGINS } from '../plugins/registrePlugins.js';
import { SUPPORTED_LANGUAGES } from '../../config/i18n.js';
import { IDIOMES_SALUT_DISPOSITIU, TEXTOS_SALUT_DISPOSITIU } from './textosSalutDispositiuJarvis.js';

const estat = vi.hoisted(() => ({ traductor: null, demanades: [], language: 'ca' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: (clau, reserva) => {
      estat.demanades.push([clau, reserva]);
      return estat.traductor ? estat.traductor(clau, reserva) : reserva;
    },
    language: estat.language,
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
  estat.language = 'ca';
});
afterEach(cleanup);

const FITXES = [
  { boto: 'Mode rural', consulta: '/control?fitxa=mode-rural', fitxa: 'mode-rural' },
  { boto: 'Restaurar dades obertes del municipi', consulta: '/control?fitxa=opendata', fitxa: 'opendata' }
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
  ['section.control.maquinaria.titol', 'Maquinària i Sistema'],
  ['section.control.maquinaria.lead', 'Altres eines de la plataforma, com el Lector RSS i el Snippet, l’extensió de Chrome per a desar webs al Bloc.'],
  ['section.control.dubtes', 'Missatges per a dubtes'],
  /* P0-63 / IDEA-194 (261108) · L'accés directe a «El compte» del Perfil. */
  ['section.control.compte', 'Compte i contrasenya'],
  ['section.control.eixir', 'Eixir de poble']
];
const marca = (clau) => `⟦${clau}⟧`;

/* Contractes complementaris: les claus globals conserven el marcador de
   t(); el giny diferit real resol un catàleg local en la llengua de UIActions.
   Només eixe únic node queda fora del marcador: tot el seu text d'interfície
   comprovat ací ha de coincidir exactament amb el catàleg real, sense reserves
   literals afegides a la prova. La llista explícita impedix perdre llengües. */
const IDIOMES_CONTROL = ['ca', 'es', 'en', 'eu', 'gl'];
test.each(IDIOMES_CONTROL)('control-06 · h2, entradetes i accions globals amb clau i giny real del catàleg local en %s', async (idioma) => {
  expect(SUPPORTED_LANGUAGES.map(({ code }) => code)).toEqual(IDIOMES_CONTROL);
  expect(IDIOMES_SALUT_DISPOSITIU).toEqual(IDIOMES_CONTROL);
  expect(Object.keys(TEXTOS_SALUT_DISPOSITIU)).toEqual(IDIOMES_CONTROL);
  estat.language = idioma;
  estat.traductor = marca;
  pinta();
  const ginys = await screen.findAllByTestId('giny-salut-dispositiu-jarvis');
  expect(ginys).toHaveLength(1);
  const [giny] = ginys;
  const tx = TEXTOS_SALUT_DISPOSITIU[idioma];
  expect(Object.hasOwn(TEXTOS_SALUT_DISPOSITIU, idioma)).toBe(true);
  expect([...giny.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([tx.titolSeccio]);
  expect([...giny.querySelectorAll('p.lead')].map((p) => p.textContent)).toEqual([tx.entradetaSeccio]);
  const botonsLocals = () => within(giny).getAllByRole('button').map((b) => b.textContent.trim());
  const botoPrincipal = () => giny.dataset.estatUi === 'error' ? tx.botoReintentar : tx.botoAlliberar;
  expect(botonsLocals()).toEqual([tx.botoRevisar, botoPrincipal()]);
  fireEvent.click(within(giny).getByRole('button', { name: tx.botoRevisar }));
  expect(within(giny).getByRole('button', { name: tx.botoTancarRevisio }).getAttribute('aria-expanded')).toBe('true');
  expect(botonsLocals()).toEqual([tx.botoTancarRevisio, botoPrincipal()]);

  const espais = ESPAIS_PLUGINS.map((espai) => TEXTOS_ESPAIS_PLUGINS[idioma]?.[espai.id] ?? espai);
  const titolsDelsEspais = new Set(espais.map((espai) => espai.titol));
  const h2 = [...document.querySelectorAll('.content-wrapper h2')]
    .filter((h) => !giny.contains(h))
    .map((h) => h.textContent)
    .filter((text) => !titolsDelsEspais.has(text));
  expect(h2.length).toBeGreaterThan(0);
  expect(h2.filter((text) => !/^⟦.+⟧$/.test(text))).toEqual([]);
  const entradetesDelsEspais = new Set(espais.map((espai) => espai.entradeta));
  const leads = [...document.querySelectorAll('.content-wrapper section > p.lead')]
    .filter((p) => !giny.contains(p))
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
  expect(screen.getByText(TEXTOS_PANELL[1][1], { selector: 'p.lead' })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PANELL[2][1] })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PANELL[3][1] })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PANELL[4][1] })).toBeTruthy();
});
