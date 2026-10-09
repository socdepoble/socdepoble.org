/* Gestoria de Poble · l'app /app/gestoria. Ordre del Mestre, 261004
   («contaminació crítica de rutes/estats entre Gestoria i Wiki»): la Gestoria
   ix de la Wiki i és una app pròpia. La plataforma de veres (RutaApps i la
   barra de l'app, amb el manifest real en un registre propi) i dobles de la
   closca i d'Aprendre: les seues proves són a src/sections/gestoria. Es mira
   que s'obri sola, sense la Wiki al voltant; que els nou mòduls i Aprendre
   s'hi arriben des de l'única barra de l'app, sense rail intern; que la closca
   conserva la memòria entre mòduls; que la porta dels Tractors porta a la Wiki, sempre a la
   mateixa ruta fixa; i que fora de desenvolupament no s’obri ni carregue res.
   Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
   xarxa»): la Facturació ja no és un mòdul «en obres» de la closca, sinó la
   tercera vista del pont, dins de la seua PaginaApp com Aprendre. Per això les
   proves de la closca (enllaç directe i memòria entre mòduls) passen a ser dels
   vuit mòduls que encara pinta ella, i la Facturació té les seues. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from '../../app/contexts/RouterContext';
import { delVal } from '../../config/storage.js';
import { BarraLateral } from '../plataforma/BarraLateral.jsx';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import { CLAU_PREFERENCIES, _reiniciaPreferencies } from '../plataforma/preferenciesApps.js';
import { APPS_INTERNES, creaRegistre } from '../plataforma/registreApps.js';
import RutaApps from '../plataforma/RutaApps.jsx';
import manifestGestoria from './manifest.js';
import { ENTRADA_APRENDRE, ENTRADA_FACTURACIO, ITEM_PORTA_TRACTORS, RUTA_PORTA_TRACTORS, desviamentDeLaConsulta } from './rutes.js';

const closca = vi.hoisted(() => ({ muntatges: 0 }));
const MODULS = [
  ['tauler', 'Tauler d’Inici', 'Tauler Central'],
  ['facturacio', 'Facturació', 'Facturació'],
  ['contactes', 'Contactes', 'Contactes'],
  ['burocracia', 'Burocràcia', 'Burocràcia'],
  ['bancs', 'Bancs', 'Bancs i Tresoreria'],
  ['impostos', 'Impostos', 'Impostos'],
  ['full', 'Full trimestral', 'Full trimestral'],
  /* Onada 6, ordre del Mestre (261009): l'Històric i IA, pel pont com la Facturació. */
  ['historic', 'Històric i IA', 'Històric i IA'],
  ['informes', 'Informes', 'Informes'],
  ['escaner', 'Escàner Local', 'Escàner Local']
];
const ENTRADES = [...MODULS.map(([slug, etiqueta]) => [slug, etiqueta]), [ENTRADA_APRENDRE, 'Aprendre']];
/* Els mòduls que pinta la closca: tots menys la Facturació (261007) i l'Històric (Onada 6), que van pel pont. */
const MODULS_CLOSCA = MODULS.filter(([slug]) => slug !== ENTRADA_FACTURACIO && slug !== 'historic');

/* El doble de la closca porta, com ella, la seua pàgina (una PaginaApp de
   veres) i demana la porta dels Tractors amb la consulta relativa de
   CONSULTA_TRACTORS (la confronta gestoria/privacitat.test.js). */
vi.mock('../../sections/gestoria/tauler/ShellGestoria.jsx', async () => {
  const { useEffect, useState } = await import('react');
  const { useNavigate } = await import('../../app/contexts/RouterContext');
  const { PaginaApp } = await import('../../components/PedraSeca/index.js');
  return {
    default: function DobleDeLaClosca({ modulActiu = 'tauler', mostrarRail = true }) {
      const navigate = useNavigate();
      const [comptador, setComptador] = useState(0);
      useEffect(() => { closca.muntatges += 1; }, []);
      const titol = MODULS.find(([id]) => id === modulActiu)?.[2];
      return (
        <div className="sdp-gestoria-closca">
          {mostrarRail ? <nav className="sdp-gestoria-closca__rail" aria-label="Panell de control de la Gestoria">Rail interior de prova</nav> : null}
          <PaginaApp title={titol} subtitle="Gestoria de Poble" showComment={false} showShare={false} showConnect={false}>
            <p>Doble de la closca</p>
            <output aria-label="Mòdul actiu de prova">{modulActiu}</output>
            <output aria-label="Comptador de memòria de prova">{comptador}</output>
            <button type="button" onClick={() => setComptador((abans) => abans + 1)}>Incrementa la memòria de prova</button>
            <button type="button" onClick={() => navigate('?categoria=tractors_cat&item=tractors_aprovacio')}>Obri el panell de Tractors</button>
            <button type="button" onClick={() => navigate('?seccio=compte-1', { replace: true })}>Una secció de l’Índex</button>
          </PaginaApp>
        </div>
      );
    }
  };
});
vi.mock('../../sections/gestoria/aprendre/Aprendre.jsx', () => ({ default: () => <p>Doble d’Aprendre</p> }));
/* La pantalla de Facturació té les seues proves a src/sections/gestoria/facturar. */
vi.mock('../../sections/gestoria/facturar/Facturacio.jsx', () => ({ default: () => <p>Doble de la Facturació</p> }));
/* L'Històric té les seues proves a src/sections/gestoria/historic; el doble porta, com ell, la seua PaginaApp. */
vi.mock('../../sections/gestoria/historic/Historic.jsx', async () => {
  const { PaginaApp } = await import('../../components/PedraSeca/index.js');
  return {
    default: () => (
      <PaginaApp title="Històric i IA" subtitle="El banc, la IA i les simulacions" showComment={false} showShare={false} showConnect={false}>
        <p>Doble de l’Històric</p>
      </PaginaApp>
    )
  };
});

const ENTORN_DEV = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const registre = (manifest = manifestGestoria) => creaRegistre({ internes: [manifest] });
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')].map((li) => li.textContent);

/* Com App.jsx: la barra lateral fa relleu dins d'una app, i la ruta /app/* és la de la plataforma. */
const ambBarra = (
  <>
    <nav aria-label="Barra lateral">
      <BarraLateral><p>Barra de Sóc de Poble</p></BarraLateral>
    </nav>
    <Routes>
      <Route path="/app/*" element={<RutaApps />} />
      <Route path="/*" element={<p>Fora de les apps</p>} />
    </Routes>
  </>
);

beforeEach(() => {
  closca.muntatges = 0;
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
});

describe('el manifest', () => {
  test('vàlid, només en desenvolupament, apagat per defecte, amb dades financeres i les onze entrades; registrat a la plataforma', () => {
    const { errors, manifest } = validaManifestApp(manifestGestoria);
    expect(errors).toEqual([]);
    expect(manifest).toMatchObject({
      id: 'gestoria', origen: 'interna', entorn: 'desenvolupament', actiuPerDefecte: false, dadesPersonals: 'financeres',
      capacitats: [], nivell: 'gratuit', entradaPerDefecte: 'tauler', permisos: { veure: 'public' }
    });
    expect(manifest.titol.ca).toBe('Gestoria de Poble');
    expect(manifest.entrades.map((entrada) => [entrada.slug, entrada.titol.ca])).toEqual(ENTRADES);
    expect(typeof manifest.carrega).toBe('function');
    expect(APPS_INTERNES.map((app) => app.id)).toContain('gestoria');
  });
});

describe('en desenvolupament, una app pròpia', () => {
  test('/app/gestoria va al Tauler i munta la closca sola: un H1, cap Wiki al voltant', async () => {
    const { container } = muntaPlataforma('/app/gestoria', { registre: registre(), entorn: ENTORN_DEV });
    expect(await screen.findByText('Doble de la closca')).toBeTruthy();
    expect(ubicacio()).toBe('/app/gestoria/tauler');
    const app = container.querySelector('[data-sdp-app="gestoria"]');
    expect(app.querySelector('.sdp-gestoria-closca')).not.toBeNull();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Tauler Central');
    expect(container.querySelector('.sdp-wiki-workspace')).toBeNull();
    expect(container.textContent).not.toMatch(/WIKI DE POBLE|Eina local|DOCUMENTS/);
  });

  test('/app/gestoria/aprendre: Aprendre dins de la seua pàgina, amb un sol H1 i sense la closca', async () => {
    const { container } = muntaPlataforma('/app/gestoria/aprendre', { registre: registre(), entorn: ENTORN_DEV });
    expect(await screen.findByText('Doble d’Aprendre')).toBeTruthy();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Aprendre');
    expect(screen.getByRole('heading', { level: 2, name: 'Repàs espaiat dels conceptes de la gestoria' })).toBeTruthy();
    expect(pindoles(container)).toEqual(['GESTORIA', 'Aprendre']);
    expect(screen.queryByText('Doble de la closca')).toBeNull();
    expect(container.textContent).not.toMatch(/WIKI DE POBLE|Eina local/);
  });

  test('la barra de l’app ocupa el lloc de la de Sóc de Poble: els nou mòduls i Aprendre en una sola barra', async () => {
    const { container } = muntaPlataforma('/app/gestoria/tauler', { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    await screen.findByText('Doble de la closca');
    const barra = within(screen.getByRole('navigation', { name: 'Barra lateral' }));
    expect(barra.queryByText('Barra de Sóc de Poble')).toBeNull();
    expect(barra.getByText('Gestoria de Poble')).toBeTruthy();
    const entrades = barra.getAllByRole('link').map((enllac) => [enllac.getAttribute('aria-label'), enllac.getAttribute('href')]);
    expect(entrades).toEqual(ENTRADES.map(([slug, etiqueta]) => [etiqueta, `/app/gestoria/${slug}`]));
    expect(barra.getByRole('link', { name: 'Tauler d’Inici' }).getAttribute('aria-current')).toBe('page');
    expect(container.querySelectorAll('.app-sidebar-nav')).toHaveLength(1);
    expect(container.querySelector('.sdp-gestoria-closca__rail')).toBeNull();
    fireEvent.click(barra.getByRole('link', { name: 'Aprendre' }));
    expect(ubicacio()).toBe('/app/gestoria/aprendre');
    expect(await screen.findByText('Doble d’Aprendre')).toBeTruthy();
    expect(barra.getByRole('link', { name: 'Aprendre' }).getAttribute('aria-current')).toBe('page');
  });

  test('/app/gestoria/facturacio: la Facturació dins de la seua pàgina, amb un sol H1, sense la closca i amb l’enllaç de la barra marcat', async () => {
    const { container } = muntaPlataforma(`/app/gestoria/${ENTRADA_FACTURACIO}`, { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    expect(await screen.findByText('Doble de la Facturació')).toBeTruthy();
    expect(ubicacio()).toBe('/app/gestoria/facturacio');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Facturació');
    expect(screen.getByRole('heading', { level: 2, name: 'Factures i llibre Veri*Factu, també sense connexió' })).toBeTruthy();
    expect(pindoles(container)).toEqual(['GESTORIA', 'Facturació']);
    expect(screen.queryByText('Doble de la closca')).toBeNull();
    expect(container.querySelector('.sdp-wiki-workspace')).toBeNull();
    const barra = screen.getByRole('navigation', { name: 'Barra lateral' });
    expect(within(barra).getByRole('link', { name: 'Facturació' }).getAttribute('aria-current')).toBe('page');
    expect(barra.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    // Des de la Facturació, la barra torna a la closca.
    fireEvent.click(within(barra).getByRole('link', { name: 'Tauler d’Inici' }));
    expect(await screen.findByText('Doble de la closca')).toBeTruthy();
    expect(screen.queryByText('Doble de la Facturació')).toBeNull();
  });

  /* Onada 6, ordre del Mestre (261009): l'Històric i IA, la quarta vista del pont, amb la seua PaginaApp. */
  test('/app/gestoria/historic: l’Històric amb la seua pàgina, un sol H1, sense la closca i amb l’enllaç de la barra marcat', async () => {
    const { container } = muntaPlataforma('/app/gestoria/historic', { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    expect(await screen.findByText('Doble de l’Històric')).toBeTruthy();
    expect(ubicacio()).toBe('/app/gestoria/historic');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Històric i IA');
    expect(screen.queryByText('Doble de la closca')).toBeNull();
    const barra = screen.getByRole('navigation', { name: 'Barra lateral' });
    expect(within(barra).getByRole('link', { name: 'Històric i IA' }).getAttribute('aria-current')).toBe('page');
    expect(barra.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    fireEvent.click(within(barra).getByRole('link', { name: 'Tauler d’Inici' }));
    expect(await screen.findByText('Doble de la closca')).toBeTruthy();
    expect(screen.queryByText('Doble de l’Històric')).toBeNull();
  });

  test.each(MODULS_CLOSCA)('l’enllaç directe /app/gestoria/%s obri el mòdul amb l’única barra exterior', async (slug, etiqueta, titol) => {
    const { container } = muntaPlataforma(`/app/gestoria/${slug}`, { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    await screen.findByText('Doble de la closca');
    expect(ubicacio()).toBe(`/app/gestoria/${slug}`);
    expect(screen.getByLabelText('Mòdul actiu de prova').textContent).toBe(slug);
    expect(screen.getByRole('heading', { level: 1, name: titol })).toBeTruthy();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelectorAll('.app-sidebar-nav')).toHaveLength(1);
    expect(container.querySelector('.sdp-gestoria-closca__rail')).toBeNull();
    const barra = screen.getByRole('navigation', { name: 'Barra lateral' });
    expect(within(barra).getByRole('link', { name: etiqueta }).getAttribute('aria-current')).toBe('page');
    expect(barra.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(container.querySelector('.sdp-wiki-workspace')).toBeNull();
  });

  test('navegar entre els mòduls de la closca canvia el contingut sense remuntar-la ni perdre la memòria', async () => {
    const { container } = muntaPlataforma('/app/gestoria/tauler', { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    await screen.findByText('Doble de la closca');
    fireEvent.click(screen.getByRole('button', { name: 'Incrementa la memòria de prova' }));
    const barra = screen.getByRole('navigation', { name: 'Barra lateral' });
    expect(MODULS_CLOSCA).toHaveLength(8);
    for (const [slug, etiqueta, titol] of [...MODULS_CLOSCA.slice(1), MODULS_CLOSCA[0]]) {
      fireEvent.click(within(barra).getByRole('link', { name: etiqueta }));
      expect(ubicacio()).toBe(`/app/gestoria/${slug}`);
      expect(screen.getByLabelText('Mòdul actiu de prova').textContent).toBe(slug);
      expect(screen.getByRole('heading', { level: 1, name: titol })).toBeTruthy();
      expect(screen.getByLabelText('Comptador de memòria de prova').textContent).toBe('1');
      expect(closca.muntatges).toBe(1);
      expect(container.querySelectorAll('.app-sidebar-nav')).toHaveLength(1);
      expect(container.querySelector('.sdp-gestoria-closca__rail')).toBeNull();
    }
  });
});

describe('la porta dels Tractors', () => {
  test('la consulta de la closca porta a la Wiki, a la ruta fixa i sense deixar el pas a l’historial; la de l’Índex es queda a l’app', async () => {
    muntaPlataforma('/app/gestoria/tauler', { registre: registre(), entorn: ENTORN_DEV });
    await screen.findByText('Doble de la closca');
    fireEvent.click(screen.getByRole('button', { name: 'Una secció de l’Índex' }));
    expect(ubicacio()).toBe('/app/gestoria/tauler?seccio=compte-1');
    expect(screen.getByText('Doble de la closca')).toBeTruthy();
    const llargaria = window.history.length;
    fireEvent.click(screen.getByRole('button', { name: 'Obri el panell de Tractors' }));
    await waitFor(() => expect(ubicacio()).toBe(RUTA_PORTA_TRACTORS));
    expect(window.history.length).toBe(llargaria + 1);
    expect(screen.getByText('Fora de les apps')).toBeTruthy();
  });

  test('desviamentDeLaConsulta: només la porta dels Tractors, sempre a la mateixa ruta, sense passar res de la consulta', () => {
    expect(ITEM_PORTA_TRACTORS).toBe('tractors_aprovacio');
    expect(RUTA_PORTA_TRACTORS).toBe('/wikidepoble?categoria=tractors_cat&item=tractors_aprovacio');
    expect(desviamentDeLaConsulta('?categoria=tractors_cat&item=tractors_aprovacio')).toBe(RUTA_PORTA_TRACTORS);
    expect(desviamentDeLaConsulta('categoria=una-altra&item=tractors_aprovacio&tornar=/fora')).toBe(RUTA_PORTA_TRACTORS);
    for (const res of ['', '?seccio=compte-1', '?item=sentinelles_panell', '?item=gestoria_panell', '?categoria=tractors_cat', null, undefined, 3]) {
      expect([String(res), desviamentDeLaConsulta(res)]).toEqual([String(res), null]);
    }
  });
});

describe('fora de desenvolupament', () => {
  test('la plataforma no l’obri: diu per què i no carrega res de la Gestoria', () => {
    const carrega = vi.fn(manifestGestoria.carrega);
    muntaPlataforma('/app/gestoria', { registre: registre({ ...manifestGestoria, carrega }), entorn: ENTORN_OBERT });
    expect(screen.getByText('Esta app no està activada')).toBeTruthy();
    expect(screen.getByText('Encara està en obres: només es pot provar en desenvolupament.')).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
    expect(screen.queryByText('Doble de la closca')).toBeNull();
  });
});
