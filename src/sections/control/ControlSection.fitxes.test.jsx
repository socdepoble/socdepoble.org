/* Revisió del Panell de Control (lot «control», 261104) + Reforma IDEA-341 (R32.63).
 *
 *  · control-03 · Les rutes profundes `/control?fitxa=mode-rural` i
 *    `/control?fitxa=opendata` continuen 100 % operatives per retrocompatibilitat
 *    i per als enllaços que arriben des d'«El meu perfil › Privacitat i dades» i
 *    d'«Administració del sistema»: s'obrin des de dalt amb el focus a <main>
 *    (també durant el text d'espera del primer muntatge diferit) i tornen netament
 *    al Panell.
 *  · control-06 + IDEA-341 · El Panell ja no pinta GinySalutDispositiuJarvis ni
 *    els 5 botonots de `.sdp-control-actions`; en el seu lloc pinta el peu sobri
 *    de «Filet pur i dur» traduït a les 5 llengües (`ca, es, en, eu, gl`) amb les
 *    3 files (`Escriure a Sóc de Poble`, `Escriure a Javi Llinares` i `El meu perfil...`).
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { Link, MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { ESPAIS_PLUGINS, TEXTOS_ESPAIS_PLUGINS } from '../plugins/registrePlugins.js';
import { SUPPORTED_LANGUAGES } from '../../config/i18n.js';
import { IDIOMES_PEU_CONTROL, TEXTOS_PEU_CONTROL } from './textosPeuControl.js';

const estat = vi.hoisted(() => ({ traductor: null, demanades: [], language: 'ca' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: (clau, reserva) => {
      estat.demanades.push([clau, reserva]);
      return estat.traductor ? estat.traductor(clau, reserva) : reserva;
    },
    language: estat.language,
    resolveAsset: (valor) => valor,
  }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' }, language: estat.language }),
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => (
    <section data-pagina="control">
      <p data-titol="pagina">{title}</p>
      {children}
    </section>
  ),
}));
vi.mock('./ModeRural.jsx', () => ({
  default: ({ onBack, vistaRef }) => (
    <div ref={vistaRef} className="content-wrapper" data-fitxa="mode-rural">
      <button type="button" onClick={onBack}>Tornar</button>
    </div>
  ),
}));
vi.mock('./FitxaOpenData.jsx', () => ({
  default: ({ onBack, vistaRef }) => (
    <div ref={vistaRef} className="content-wrapper" data-fitxa="opendata">
      <button type="button" onClick={onBack}>Tornar</button>
    </div>
  ),
}));

import ControlSection from './ControlSection.jsx';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

function EnllacosProfundsExterns() {
  return (
    <nav aria-label="Enllaços profunds externs">
      <Link to="/control?fitxa=mode-rural">Anar a Mode rural</Link>
      <Link to="/control?fitxa=opendata">Anar a OpenData</Link>
    </nav>
  );
}

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
      <EnllacosProfundsExterns />
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>,
    { container: contenidor },
  );
  return { main, desplacador, treu: () => main.remove() };
}

function pinta(ruta = '/control') {
  return render(
    <MemoryRouter rutaInicial={ruta}>
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  estat.traductor = null;
  estat.demanades = [];
  estat.language = 'ca';
});
afterEach(cleanup);

const FITXES = [
  { enllac: 'Anar a Mode rural', consulta: '/control?fitxa=mode-rural', fitxa: 'mode-rural' },
  { enllac: 'Anar a OpenData', consulta: '/control?fitxa=opendata', fitxa: 'opendata' },
];

test.each(FITXES)('control-03 · la ruta profunda «$consulta» obri la fitxa des de dalt amb el focus a <main>, també la segona vegada, i «Tornar» restitueix /control', async ({ enllac, consulta, fitxa }) => {
  const { main, desplacador, treu } = pintaDinsDeLApp({ posicio: 4000 });
  try {
    for (const visita of [1, 2]) {
      expect(document.querySelector('[data-titol="pagina"]').textContent, `visita ${visita}`).toBe('Panell de Control');
      fireEvent.click(screen.getByRole('link', { name: enllac }));
      expect(ubicacio(), `visita ${visita}`).toBe(consulta);
      expect(Boolean(document.querySelector('p[role="status"]')), `visita ${visita}`).toBe(visita === 1);
      if (visita === 1) {
        expect(desplacador.scrollTop, 'text d’espera').toBe(0);
        expect(document.activeElement, 'text d’espera').toBe(main);
      }
      await screen.findByRole('button', { name: 'Tornar' });
      expect(document.querySelector(`[data-fitxa="${fitxa}"]`), `visita ${visita}`).toBeTruthy();
      expect(desplacador.scrollTop, `visita ${visita}`).toBe(0);
      expect(document.activeElement, `visita ${visita}`).toBe(main);

      desplacador.scrollTop = 300;
      screen.getByRole('button', { name: 'Tornar' }).focus();
      fireEvent.click(screen.getByRole('button', { name: 'Tornar' }));
      expect(ubicacio(), `visita ${visita}`).toBe('/control');
      expect(document.activeElement, `visita ${visita}`).toBe(main);
    }
  } finally {
    treu();
  }
});

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

const TEXTOS_PANELL = [
  ['section.control.maquinaria.titol', 'Maquinària i Sistema'],
  ['section.control.maquinaria.lead', 'Altres eines de la plataforma, com el Lector RSS i el Snippet, l’extensió de Chrome per a desar webs al Bloc.'],
];
const marca = (clau) => `⟦${clau}⟧`;

const IDIOMES_CONTROL = ['ca', 'es', 'en', 'eu', 'gl'];
test.each(IDIOMES_CONTROL)('control-06 · IDEA-341 · encapçalaments globals amb clau i peu de Filet Pur localitzat en %s', (idioma) => {
  expect(SUPPORTED_LANGUAGES.map(({ code }) => code)).toEqual(IDIOMES_CONTROL);
  expect(IDIOMES_PEU_CONTROL).toEqual(IDIOMES_CONTROL);
  expect(Object.keys(TEXTOS_PEU_CONTROL)).toEqual(IDIOMES_CONTROL);
  estat.language = idioma;
  estat.traductor = marca;
  pinta();

  expect(screen.queryByTestId('giny-salut-dispositiu-jarvis')).toBeNull();
  expect(document.querySelector('.sdp-control-actions')).toBeNull();

  const peu = screen.getByTestId('control-peu-filet-pur');
  const tx = TEXTOS_PEU_CONTROL[idioma];
  expect(within(peu).getByRole('heading', { level: 3, name: tx.titol })).toBeTruthy();
  expect(peu.querySelector('p.lead')?.textContent).toBe(tx.subtitol);
  expect(within(peu).getByRole('button', { name: tx.socDePobleNom })).toBeTruthy();
  expect(within(peu).getByRole('button', { name: tx.javiNom })).toBeTruthy();
  expect(within(peu).getByRole('link', { name: tx.perfilNom }).getAttribute('href')).toBe('/el-meu-perfil?vista=compte');

  const espais = ESPAIS_PLUGINS.map((espai) => TEXTOS_ESPAIS_PLUGINS[idioma]?.[espai.id] ?? espai);
  const titolsDelsEspais = new Set(espais.map((espai) => espai.titol));
  const h3 = [...document.querySelectorAll('.content-wrapper h3')]
    .filter((h) => !peu.contains(h))
    .map((h) => h.textContent)
    .filter((text) => !titolsDelsEspais.has(text));
  expect(h3.length).toBeGreaterThan(0);
  expect(h3.filter((text) => !/^⟦.+⟧$/.test(text))).toEqual([]);

  const entradetesDelsEspais = new Set(espais.map((espai) => espai.entradeta));
  const leads = [...document.querySelectorAll('.content-wrapper section > p.lead')]
    .filter((p) => !peu.contains(p))
    .map((p) => p.textContent)
    .filter((text) => !entradetesDelsEspais.has(text));
  expect(leads.length).toBeGreaterThan(0);
  expect(leads.filter((text) => !/^⟦.+⟧$/.test(text))).toEqual([]);
});

test('control-06 · cada text de Maquinària es demana amb la seua clau i la reserva d’abans, i el peu de Filet Pur pinta les 3 files en valencià', () => {
  pinta();
  for (const [clau, reserva] of TEXTOS_PANELL) {
    expect(estat.demanades, clau).toContainEqual([clau, reserva]);
  }
  expect(screen.getByRole('heading', { level: 3, name: TEXTOS_PANELL[0][1] })).toBeTruthy();
  expect(screen.getByText(TEXTOS_PANELL[1][1], { selector: 'p.lead' })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PEU_CONTROL.ca.socDePobleNom })).toBeTruthy();
  expect(screen.getByRole('button', { name: TEXTOS_PEU_CONTROL.ca.javiNom })).toBeTruthy();
  expect(screen.getByRole('link', { name: TEXTOS_PEU_CONTROL.ca.perfilNom })).toBeTruthy();
});
