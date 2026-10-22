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
   vuit mòduls que encara pinta ella, i la Facturació té les seues.
   Ordre de MarIA 261012_2145, acatada pel Mestre (revoca el rail intern del
   Panell ERP): la navegació és NOMÉS la BarraApp global, amb els grups del
   manifest; la closca no en pinta cap i rep només el mòdul de la ruta i,
   sense sessió, l'entrada al compte que torna al Tauler (petició 261012_2148).
   Una sola barra de l'app, un sol aria-current a tota la pantalla.
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): «El pont no passa
   cap dada de la persona» (261012_2148) queda Derogat EN PART. Amb sessió, el
   pont passa el titular (useSessioApp().titular) a la closca, a l'Històric i a
   la Finestreta, i signa amb ell Aprendre i la Facturació, sempre amb el
   rellotge viu a l'extrem dret de la barra taronja; sense sessió, «Titular
   sense configurar» amb l'entrada al compte. Per això la closca rep ara
   quatre props (hrefEntrada, hrefIdentitat, modulActiu i titular).
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): «Identitat i
   Finestreta», la cinquena vista del pont, al grup Operacions.
   Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 3): la closca rep
   també hrefFull, la ruta del Full trimestral, per a l'estat buit de la
   «Plantilla Gestoria» del Quadre de comandament: cinc props. */
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
import { RUTA_TITULAR, TITULAR_SENSE_CONFIGURAR, autorDelPont, entradaAlTauler } from './AppGestoria.jsx';
import manifestGestoria from './manifest.js';
import {
  ENTRADA_APRENDRE, ENTRADA_FACTURACIO, ENTRADA_FULL, ENTRADA_IDENTITAT, ITEM_PORTA_TRACTORS, RUTA_PORTA_TRACTORS, desviamentDeLaConsulta
} from './rutes.js';

const closca = vi.hoisted(() => ({ muntatges: 0 }));
const MODULS = [
  ['tauler', 'Tauler d’Inici', 'Tauler Central'],
  ['facturacio', 'Facturació', 'Facturació'],
  ['contactes', 'Contactes', 'Contactes'],
  ['burocracia', 'Burocràcia', 'Burocràcia'],
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): la fitxa d'identitat i la Finestreta, pel pont. */
  ['identitat', 'Identitat i Finestreta', 'Identitat i Finestreta'],
  ['bancs', 'Bancs', 'Bancs i Tresoreria'],
  ['impostos', 'Impostos', 'Impostos'],
  ['full', 'Full trimestral', 'Full trimestral'],
  /* Onada 6, ordre del Mestre (261009): l'Històric i IA, pel pont com la Facturació. */
  ['historic', 'Històric i IA', 'Històric i IA'],
  ['informes', 'Informes', 'Informes'],
  ['escaner', 'Escàner Local', 'Escàner Local']
];
const ENTRADES = [...MODULS.map(([slug, etiqueta]) => [slug, etiqueta]), [ENTRADA_APRENDRE, 'Aprendre']];
/* Els mòduls que pinta la closca: tots menys la Facturació (261007), l'Històric (Onada 6) i la Finestreta (13-10-2026, front H), que van pel pont. */
const DEL_PONT = new Set([ENTRADA_FACTURACIO, 'historic', ENTRADA_IDENTITAT]);
const MODULS_CLOSCA = MODULS.filter(([slug]) => !DEL_PONT.has(slug));

/* El doble de la closca porta, com ella, la seua pàgina (una PaginaApp de
   veres) i demana la porta dels Tractors amb la consulta relativa de
   CONSULTA_TRACTORS (la confronta gestoria/privacitat.test.js). */
vi.mock('../../sections/gestoria/tauler/ShellGestoria.jsx', async () => {
  const { useEffect, useState } = await import('react');
  const { useNavigate } = await import('../../app/contexts/RouterContext');
  const { PaginaApp } = await import('../../components/PedraSeca/index.js');
  return {
    default: function DobleDeLaClosca(props) {
      const { modulActiu = 'tauler', hrefEntrada = null, hrefIdentitat = null, hrefFull = null, titular = null } = props;
      const navigate = useNavigate();
      const [comptador, setComptador] = useState(0);
      useEffect(() => { closca.muntatges += 1; }, []);
      const titol = MODULS.find(([id]) => id === modulActiu)?.[2];
      return (
        <div className="sdp-gestoria-closca">
          <PaginaApp title={titol} subtitle="Gestoria de Poble" showComment={false} showShare={false} showConnect={false}>
            <p>Doble de la closca</p>
            {/* Què li passa l'app: el mòdul de la ruta, l'entrada al compte, les rutes de la Finestreta i del Full i el titular de la sessió (cap prop de navegació pròpia). */}
            <output aria-label="Props de prova">{Object.keys(props).sort().join(',')}</output>
            <output aria-label="Entrada de prova">{hrefEntrada ?? ''}</output>
            <output aria-label="Identitat de prova">{hrefIdentitat ?? ''}</output>
            <output aria-label="Full de prova">{hrefFull ?? ''}</output>
            <output aria-label="Titular de prova">{titular ? JSON.stringify(titular) : ''}</output>
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
    default: (props) => (
      <PaginaApp title="Històric i IA" subtitle="El banc, la IA i les simulacions" showComment={false} showShare={false} showConnect={false}>
        <p>Doble de l’Històric</p>
        <output aria-label="Props de l’Històric">{Object.keys(props).sort().join(',')}</output>
        <output aria-label="Titular de l’Històric">{props.titular ? JSON.stringify(props.titular) : ''}</output>
      </PaginaApp>
    )
  };
});
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): la Finestreta té les seues proves a
   src/sections/gestoria/finestreta; el doble porta, com ella, la seua PaginaApp. */
vi.mock('../../sections/gestoria/finestreta/Finestreta.jsx', async () => {
  const { PaginaApp } = await import('../../components/PedraSeca/index.js');
  return {
    default: (props) => (
      <PaginaApp title="Identitat i Finestreta" subtitle="La teua fitxa legal, privada" showComment={false} showShare={false} showConnect={false}>
        <p>Doble de la Finestreta</p>
        <output aria-label="Props de la Finestreta">{Object.keys(props).sort().join(',')}</output>
        <output aria-label="Titular de la Finestreta">{props.titular ? JSON.stringify(props.titular) : ''}</output>
      </PaginaApp>
    )
  };
});

const ENTORN_DEV = Object.freeze({ ...ENTORN_OBERT, produccio: false });
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): una sessió de prova
   amb el titular que dona el pont (sintètic: cap persona real). El pont el
   torna a filtrar (titularNet): una clau de més no arriba mai a la Gestoria. */
const TITULAR = Object.freeze({ nom: 'Pepa Soler', poble: 'Vilaprova de Dalt', avatar: null });
const ENTORN_AMB_SESSIO = Object.freeze({
  ...ENTORN_DEV,
  sessio: Object.freeze({ estat: 'dins', titular: Object.freeze({ ...TITULAR, correu: 'pepa@poble.test', id: 'u-prova' }) })
});
const registre = (manifest = manifestGestoria) => creaRegistre({ internes: [manifest] });
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')].map((li) => li.textContent);
const ENTRADA_AL_TAULER = '/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Ftauler';
/* La barra taronja de la pàgina: l'autoria i les accions de la dreta (BarraTaronja). */
const barraTaronja = (arrel) => arrel.querySelector('section.bar-orange');
const esRellotge = (node) => node?.tagName === 'TIME' && /^Data i hora d’ara: \d{2}:\d{2} del \d{2}\/\d{2}\/\d{2}$/.test(node.getAttribute('aria-label') ?? '');

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
  test('vàlid, només en desenvolupament, apagat per defecte, amb dades financeres, el titular de la sessió i les dotze entrades; registrat a la plataforma', () => {
    const { errors, manifest } = validaManifestApp(manifestGestoria);
    expect(errors).toEqual([]);
    expect(manifest).toMatchObject({
      id: 'gestoria', origen: 'interna', entorn: 'desenvolupament', actiuPerDefecte: false, dadesPersonals: 'financeres',
      capacitats: [], nivell: 'gratuit', entradaPerDefecte: 'tauler'
    });
    /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): la Gestoria declara el titular de la sessió, i res més. */
    expect(manifest.permisos).toEqual({ veure: 'public', titular: 'sessio' });
    expect(manifest.entrades).toHaveLength(12);
    expect(manifest.titol.ca).toBe('Gestoria de Poble');
    expect(manifest.entrades.map((entrada) => [entrada.slug, entrada.titol.ca])).toEqual(ENTRADES);
    expect(typeof manifest.carrega).toBe('function');
    expect(APPS_INTERNES.map((app) => app.id)).toContain('gestoria');
  });

  /* Ordre de MarIA 261012_2145: els mòduls, en grups de la BarraApp global. */
  test('els grups de la barra: el Tauler solt a dalt i tres grups; l’ordre del manifest és el de la barra', () => {
    const { manifest } = validaManifestApp(manifestGestoria);
    expect(manifest.grups.map((grup) => [grup.id, grup.titol.ca])).toEqual([
      ['operacions', 'Operacions'], ['diners', 'Diners i impostos'], ['arxiu', 'Arxiu i eines']
    ]);
    expect(Object.fromEntries(manifest.entrades.map((entrada) => [entrada.slug, entrada.grup ?? null]))).toEqual({
      tauler: null, facturacio: 'operacions', contactes: 'operacions', burocracia: 'operacions', identitat: 'operacions',
      bancs: 'diners', impostos: 'diners', full: 'diners', historic: 'diners',
      informes: 'arxiu', escaner: 'arxiu', aprendre: 'arxiu'
    });
    /* La BarraApp pinta primer les entrades soltes i després cada grup sencer: escrites així, cap entrada canvia de lloc. */
    const pintades = [
      ...manifest.entrades.filter((entrada) => !entrada.grup),
      ...manifest.grups.flatMap((grup) => manifest.entrades.filter((entrada) => entrada.grup === grup.id))
    ];
    expect(pintades.map((entrada) => entrada.slug)).toEqual(manifest.entrades.map((entrada) => entrada.slug));
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): la icona de la Finestreta és de la llista tancada, i no la de cap altra entrada. */
  test('la Finestreta porta una icona de la llista tancada que no repetix cap altra entrada', () => {
    const { manifest } = validaManifestApp(manifestGestoria);
    const icones = manifest.entrades.map((entrada) => entrada.icona);
    expect(manifest.entrades.find((entrada) => entrada.slug === ENTRADA_IDENTITAT)).toMatchObject({
      titol: { ca: 'Identitat i Finestreta', es: 'Identidad y Ventanilla' }, icona: 'ClipboardList', grup: 'operacions'
    });
    expect(new Set(icones).size).toBe(icones.length);
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

  test('la barra de l’app ocupa el lloc de la de Sóc de Poble: els deu mòduls i Aprendre en una sola barra', async () => {
    const { container } = muntaPlataforma('/app/gestoria/tauler', { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    await screen.findByText('Doble de la closca');
    const barra = within(screen.getByRole('navigation', { name: 'Barra lateral' }));
    expect(barra.queryByText('Barra de Sóc de Poble')).toBeNull();
    expect(barra.getByText('Gestoria de Poble')).toBeTruthy();
    const entrades = barra.getAllByRole('link').map((enllac) => [enllac.getAttribute('aria-label'), enllac.getAttribute('href')]);
    expect(entrades).toEqual(ENTRADES.map(([slug, etiqueta]) => [etiqueta, `/app/gestoria/${slug}`]));
    expect(barra.getByRole('link', { name: 'Tauler d’Inici' }).getAttribute('aria-current')).toBe('page');
    expect(container.querySelectorAll('.app-sidebar-nav')).toHaveLength(1);
    /* Ordre de MarIA 261012_2145: cap navegació de la closca; els mòduls, en els grups de la barra global. */
    expect(container.querySelectorAll('[class*="closca__rail"], [class*="closca__modul"]')).toHaveLength(0);
    expect(screen.queryByRole('navigation', { name: 'Panell de control de la Gestoria' })).toBeNull();
    const enllacsDelGrup = (nom) => within(barra.getByRole('group', { name: nom })).getAllByRole('link').map((enllac) => enllac.getAttribute('aria-label'));
    expect(enllacsDelGrup('Operacions')).toEqual(['Facturació', 'Contactes', 'Burocràcia', 'Identitat i Finestreta']);
    expect(enllacsDelGrup('Diners i impostos')).toEqual(['Bancs', 'Impostos', 'Full trimestral', 'Històric i IA']);
    expect(enllacsDelGrup('Arxiu i eines')).toEqual(['Informes', 'Escàner Local', 'Aprendre']);
    /* La closca rep el mòdul de la ruta, la ruta de la Finestreta, el titular
       (sense sessió, cap) i, sense sessió, l'entrada al compte que torna al
       Tauler. Ordre del Mestre, 13-10-2026 (pla 261013_1405, fronts B i H):
       abans, «hrefEntrada,modulActiu» i prou. Ordre del Mestre, 14-10-2026
       (prompt 261014_2015, punt 3): i la ruta del Full trimestral. */
    expect(screen.getByLabelText('Props de prova').textContent).toBe('hrefEntrada,hrefFull,hrefIdentitat,modulActiu,titular');
    expect(screen.getByLabelText('Entrada de prova').textContent).toBe(ENTRADA_AL_TAULER);
    expect(screen.getByLabelText('Identitat de prova').textContent).toBe('/app/gestoria/identitat');
    expect(screen.getByLabelText('Full de prova').textContent).toBe(`/app/gestoria/${ENTRADA_FULL}`);
    expect(screen.getByLabelText('Titular de prova').textContent).toBe('');
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

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): «mai Sóc de Poble
     amb el logotip a la Facturació». Abans, sense autor, PaginaApp signava amb
     DEFAULT_AUTHOR i el logotip del projecte; ara, sense sessió, l'estat honest
     amb l'entrada al compte, i el rellotge viu a l'extrem dret. */
  test.each([ENTRADA_FACTURACIO, ENTRADA_APRENDRE])('sense sessió, /app/gestoria/%s diu «Titular sense configurar», enllaça a l’entrada al compte i porta el rellotge viu', async (slug) => {
    const { container } = muntaPlataforma(`/app/gestoria/${slug}`, { registre: registre(), entorn: ENTORN_DEV });
    await screen.findByText(slug === ENTRADA_FACTURACIO ? 'Doble de la Facturació' : 'Doble d’Aprendre');
    const boina = barraTaronja(container);
    const autor = boina.querySelector('.sp-card-author');
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Titular sense configurar');
    expect(autor.getAttribute('href')).toBe(ENTRADA_AL_TAULER);
    expect(container.textContent).not.toMatch(/Sóc de Poble/);
    expect(container.querySelector('.page-title-logo')).toBeNull();
    const accions = boina.querySelector('.bar-actions');
    expect(esRellotge(accions.lastElementChild)).toBe(true);
    expect(accions.querySelectorAll('time')).toHaveLength(1);
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

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): «Identitat i Finestreta», la cinquena vista del pont. */
  test('/app/gestoria/identitat: la Finestreta amb la seua pàgina, un sol H1, sense la closca, amb l’enllaç del grup Operacions marcat', async () => {
    const { container } = muntaPlataforma(`/app/gestoria/${ENTRADA_IDENTITAT}`, { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    expect(await screen.findByText('Doble de la Finestreta')).toBeTruthy();
    expect(ubicacio()).toBe('/app/gestoria/identitat');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Identitat i Finestreta');
    expect(screen.queryByText('Doble de la closca')).toBeNull();
    /* Sense sessió, la Finestreta rep el titular buit (i només eixa prop): la seua boina diu l'estat honest. */
    expect(screen.getByLabelText('Props de la Finestreta').textContent).toBe('titular');
    expect(screen.getByLabelText('Titular de la Finestreta').textContent).toBe('');
    const barra = screen.getByRole('navigation', { name: 'Barra lateral' });
    const grup = within(barra).getByRole('group', { name: 'Operacions' });
    expect(within(grup).getByRole('link', { name: 'Identitat i Finestreta' }).getAttribute('aria-current')).toBe('page');
    expect(barra.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    fireEvent.click(within(barra).getByRole('link', { name: 'Tauler d’Inici' }));
    expect(await screen.findByText('Doble de la closca')).toBeTruthy();
    expect(screen.queryByText('Doble de la Finestreta')).toBeNull();
  });

  test.each(MODULS_CLOSCA)('l’enllaç directe /app/gestoria/%s obri el mòdul amb l’única barra de l’app', async (slug, etiqueta, titol) => {
    const { container } = muntaPlataforma(`/app/gestoria/${slug}`, { registre: registre(), entorn: ENTORN_DEV, fills: ambBarra });
    await screen.findByText('Doble de la closca');
    expect(ubicacio()).toBe(`/app/gestoria/${slug}`);
    expect(screen.getByLabelText('Mòdul actiu de prova').textContent).toBe(slug);
    expect(screen.getByRole('heading', { level: 1, name: titol })).toBeTruthy();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelectorAll('.app-sidebar-nav')).toHaveLength(1);
    expect(container.querySelectorAll('[class*="closca__rail"]')).toHaveLength(0);
    /* Entre des del mòdul que entre, l'entrada al compte torna al Tauler. */
    expect(screen.getByLabelText('Entrada de prova').textContent).toBe('/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Ftauler');
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
      expect(container.querySelectorAll('[class*="closca__rail"]')).toHaveLength(0);
    }
  });

  test('entradaAlTauler: canvia només la tornada pel Tauler i conserva la resta de la consulta', () => {
    expect(entradaAlTauler('/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Fbancs', '/app/gestoria/tauler'))
      .toBe('/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Ftauler');
    expect(entradaAlTauler('/registre?mode=entrar', '/app/gestoria/tauler')).toBe('/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Ftauler');
    expect(entradaAlTauler('/registre', '/app/gestoria/tauler')).toBe('/registre?tornar=%2Fapp%2Fgestoria%2Ftauler');
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): «Si hi ha un usuari
   autenticat, la barra taronja de TOTES les pàgines ha de mostrar
   automàticament el seu avatar i el seu nom. Mai ha de recaure en “Titular
   sense configurar” si hi ha sessió, ni pintar “Sóc de Poble” amb el logo
   corporatiu a la Facturació». Derogat EN PART el «el pont no passa cap dada
   de la persona» de la petició 261012_2148. */
describe('amb sessió, el pont passa el titular de la sessió', () => {
  test('la closca rep el titular net (sense correu ni id), cap entrada al compte i les rutes de la Finestreta i del Full', async () => {
    muntaPlataforma('/app/gestoria/tauler', { registre: registre(), entorn: ENTORN_AMB_SESSIO });
    await screen.findByText('Doble de la closca');
    expect(screen.getByLabelText('Props de prova').textContent).toBe('hrefEntrada,hrefFull,hrefIdentitat,modulActiu,titular');
    expect(screen.getByLabelText('Full de prova').textContent).toBe('/app/gestoria/full');
    expect(JSON.parse(screen.getByLabelText('Titular de prova').textContent)).toEqual(TITULAR);
    expect(screen.getByLabelText('Entrada de prova').textContent).toBe('');
    expect(screen.getByLabelText('Identitat de prova').textContent).toBe('/app/gestoria/identitat');
    expect(document.body.textContent).not.toMatch(/pepa@poble\.test|u-prova/);
  });

  test.each([
    ['historic', 'Doble de l’Històric', 'Titular de l’Històric'],
    [ENTRADA_IDENTITAT, 'Doble de la Finestreta', 'Titular de la Finestreta']
  ])('/app/gestoria/%s rep el mateix titular de la sessió', async (slug, doble, etiqueta) => {
    muntaPlataforma(`/app/gestoria/${slug}`, { registre: registre(), entorn: ENTORN_AMB_SESSIO });
    await screen.findByText(doble);
    expect(JSON.parse(screen.getByLabelText(etiqueta).textContent)).toEqual(TITULAR);
  });

  test.each([ENTRADA_FACTURACIO, ENTRADA_APRENDRE])('/app/gestoria/%s signa amb el titular (nom i poble, enllaçat al perfil), sense el logotip de Sóc de Poble, i el rellotge és l’últim de la barra', async (slug) => {
    const { container } = muntaPlataforma(`/app/gestoria/${slug}`, { registre: registre(), entorn: ENTORN_AMB_SESSIO });
    await screen.findByText(slug === ENTRADA_FACTURACIO ? 'Doble de la Facturació' : 'Doble d’Aprendre');
    const boina = barraTaronja(container);
    const autor = boina.querySelector('.sp-card-author');
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Pepa Soler');
    expect(autor.querySelector('.sp-card-author-location').textContent).toBe('Vilaprova de Dalt');
    expect(autor.getAttribute('href')).toBe('/el-meu-perfil');
    expect(container.textContent).not.toMatch(/Titular sense configurar|Sóc de Poble/);
    expect(container.querySelector('.page-title-logo')).toBeNull();
    const accions = boina.querySelector('.bar-actions');
    expect(esRellotge(accions.lastElementChild)).toBe(true);
    expect(accions.querySelectorAll('time')).toHaveLength(1);
  });

  test('les constants de la boina del pont són les de la closca; autorDelPont, amb titular o sense', async () => {
    const real = await vi.importActual('../../sections/gestoria/tauler/ShellGestoria.jsx');
    expect(RUTA_TITULAR).toBe(real.RUTA_TITULAR);
    expect(TITULAR_SENSE_CONFIGURAR).toBe(real.TITULAR_SENSE_CONFIGURAR);
    expect(autorDelPont(TITULAR, ENTRADA_AL_TAULER)).toEqual({ ...TITULAR, href: '/el-meu-perfil' });
    expect(autorDelPont(null, ENTRADA_AL_TAULER)).toEqual({ nom: 'Titular sense configurar', poble: '', avatar: null, href: ENTRADA_AL_TAULER });
    /* Gauntlet 261016 (MCR o3_tpv_gestoria, proves 2 i 4): la importació real i en fred de la closca sencera
       (ShellGestoria.jsx i tot el seu graf) tarda ~1,1 s sola i passava dels 5 s per defecte amb la màquina
       carregada. Només el límit de temps, cap asserció. */
  }, 20000);
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
    // Gauntlet 261022_0225 (F7) · El motiu de la plataforma, sense «desenvolupament».
    expect(screen.getByText('Esta eina encara està en proves i no està a punt per a tothom.')).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
    expect(screen.queryByText('Doble de la closca')).toBeNull();
  });
});
