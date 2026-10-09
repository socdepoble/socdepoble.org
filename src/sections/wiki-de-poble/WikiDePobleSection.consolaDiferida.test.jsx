/* Onada 7 (261009) · La Consola, a demanda dins de la Wiki. Abans,
   WikiDePobleSection.jsx importava ConsolaIncrustada de manera estàtica i el
   tros de la Wiki arrossegava el codi de la Consola a cada visita. Ara la
   carrega lazyRoute en obrir la seua fitxa.
     · La frontera, sobre el font: ni la Wiki ni res del que importa de
       manera estàtica arriba a src/sections/consola/; l'única porta és un
       import() dins de lazyRoute.
     · La fallada (revisió adversarial de l'Onada 7): el tros que no arriba
       és un LazyRouteError i es queda dins del cos (BarreraDeLaConsola). La
       capçalera i la resta de la Wiki continuen, es pot triar un altre
       document, i la barrera de la ruta (RouteErrorBoundary) no rep res.
       Qualsevol altre error sí que hi puja.
   El doble de la Consola falla en importar-se: a este fitxer no arriba mai. */
import React from 'react';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const fixture = vi.hoisted(() => ({ itemId: 'consola_termodinamica' }));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', async () => {
  const { SlotErrorBoundary } = await import('../../components/universal/workspace/SlotErrorBoundary.jsx');
  return {
    UniversalWorkspace: ({ model, renderDetail, className }) => (
      <div className={className}>
        <SlotErrorBoundary domini="detall" resetKey={fixture.itemId}>
          {renderDetail({ item: model.items.find((item) => item.id === fixture.itemId) })}
        </SlotErrorBoundary>
      </div>
    )
  };
});
vi.mock('../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [] } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), useLocation: () => ({ pathname: '/wikidepoble', search: `?item=${fixture.itemId}` }), Link: 'a'
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../consola/ConsolaSection.jsx', () => { throw new TypeError('Failed to fetch dynamically imported module'); });

import WikiDePobleSection, { BarreraDeLaConsola } from './WikiDePobleSection.jsx';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary.jsx';
import { PAGE_COPY } from '../text/pageContent';

afterEach(() => { cleanup(); vi.restoreAllMocks(); fixture.itemId = 'consola_termodinamica'; });

const ARREL = process.cwd();
const WIKI = 'src/sections/wiki-de-poble/WikiDePobleSection.jsx';
const CONSOLA = /^src\/sections\/consola\//;
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

/* Els especificadors estàtics (import … from, import sense nom i
   reexportació), el criteri de src/apps/plataforma/fronteres.test.js. */
const IMPORT_ESTATIC = /(?:\bfrom\s*|\bimport\s+)(['"`])([^'"`\n]+)\1/g;
const estatics = (codi) => [...codi.matchAll(IMPORT_ESTATIC)].map((m) => m[2]);
const CODI = /\.(?:[cm]?js|jsx)$/;

/* El fitxer de codi darrere d'un especificador relatiu o amb l'àlies @/, o null (un paquet). */
function fitxerImportat(ruta, especificador) {
  const net = especificador.replace(/\?.*$/, '');
  let desti = null;
  if (net.startsWith('.')) desti = path.posix.normalize(path.posix.join(path.posix.dirname(ruta), net));
  else if (net.startsWith('@/')) desti = `src/${net.slice(2)}`;
  if (!desti) return null;
  return [desti, `${desti}.js`, `${desti}.jsx`, `${desti}/index.js`, `${desti}/index.jsx`]
    .find((candidat) => CODI.test(candidat) && existsSync(path.join(ARREL, candidat))) || null;
}

/* La clausura estàtica des d'`inici`: fitxer → qui l'ha importat primer. */
function clausuraEstatica(inici) {
  const vistes = new Map([[inici, null]]);
  const pendents = [inici];
  while (pendents.length) {
    const ruta = pendents.pop();
    for (const especificador of estatics(llig(ruta))) {
      const desti = fitxerImportat(ruta, especificador);
      if (desti && !vistes.has(desti)) {
        vistes.set(desti, ruta);
        pendents.push(desti);
      }
    }
  }
  return vistes;
}

describe('la frontera Wiki → Consola, sobre el font', () => {
  test('WikiDePobleSection.jsx no importa ConsolaSection.jsx de manera estàtica: només un import() dins de lazyRoute', () => {
    const codi = llig(WIKI);
    expect(estatics(codi).map((e) => fitxerImportat(WIKI, e)).filter((desti) => desti && CONSOLA.test(desti))).toEqual([]);
    expect(codi.match(/import\('\.\.\/consola\/ConsolaSection\.jsx'\)/g)).toHaveLength(1);
    expect(codi).toMatch(/= lazyRoute\(\(\) => import\('\.\.\/consola\/ConsolaSection\.jsx'\)/);
  });

  test('cap fitxer de la clausura estàtica de la Wiki arriba a src/sections/consola/', () => {
    const clausura = clausuraEstatica(WIKI);
    // La porta mira de veres: la clausura porta la pàgina i el workspace universals.
    expect([...clausura.keys()]).toEqual(expect.arrayContaining([
      'src/components/universal/UniversalPage.jsx', 'src/components/universal/workspace/UniversalWorkspace.jsx', 'src/apps/plataforma/lazyRoute.js'
    ]));
    const camins = [...clausura.keys()].filter((ruta) => CONSOLA.test(ruta)).map((ruta) => {
      const cami = [ruta];
      for (let pare = clausura.get(ruta); pare; pare = clausura.get(pare)) cami.unshift(pare);
      return cami.join(' > ');
    });
    expect(camins).toEqual([]);
  });

  test('sonda: la porta troba un import estàtic de la Consola', () => {
    const sonda = "import { ConsolaIncrustada } from '../consola/ConsolaSection.jsx';";
    expect(estatics(sonda).map((e) => fitxerImportat(WIKI, e))).toEqual(['src/sections/consola/ConsolaSection.jsx']);
    expect(estatics("const C = lazyRoute(() => import('../consola/ConsolaSection.jsx'));")).toEqual([]);
  });
});

describe('el tros de la Consola no arriba', () => {
  /* React avisa per consola de cada error que recull una barrera i, en
     desenvolupament, el torna a llançar dins d'un esdeveniment de jsdom: es
     dona per atés (el patró de detailSectionMeta.pobleDiferit.test.jsx). */
  const atesa = (event) => event.preventDefault();
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', atesa);
  });
  afterEach(() => { window.removeEventListener('error', atesa); });

  const ambLaRuta = () => (
    <RouteErrorBoundary resetKey="/wikidepoble" externalConfig={{ manageDocumentHead: true }} mostraDetall={false}>
      <WikiDePobleSection />
    </RouteErrorBoundary>
  );
  const capcalera = () => {
    expect([...document.querySelectorAll('h1')].map((h1) => h1.textContent)).toEqual([PAGE_COPY.consola.title]);
    expect(document.querySelector('header.page-title h1')).not.toBeNull();
    expect(document.querySelector('.page-title-copyright')).not.toBeNull();
  };
  // Ni el panell de la ruta ni cap botó: ni recarregar, ni reintentar.
  const capErrorDeRuta = () => {
    expect(document.querySelector('.sdp-route-error')).toBeNull();
    expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Recarrega l’aplicació' })).toBeNull();
    expect(screen.queryByText('Reintenta')).toBeNull();
    expect(screen.queryByText('Intentar de nou')).toBeNull();
    expect(screen.queryByText(/s'ha esfondrat/)).toBeNull();
    expect(screen.queryByText('Failed to fetch dynamically imported module')).toBeNull();
  };

  test('la capçalera ja s’ha pintat; la fallada es queda dins del cos i la barrera de la ruta no rep res', async () => {
    const { container } = render(ambLaRuta());
    capcalera();
    expect(screen.getByText('Carregant la Consola…')).toBeTruthy();
    const avis = await screen.findByRole('alert');
    expect(avis.className).toBe('sdp-alerta sdp-alerta--error');
    expect(avis.textContent).toBe('No s’ha pogut carregar la ConsolaLa resta de la Wiki continua com sempre.');
    expect(screen.getAllByRole('alert')).toEqual([avis]);
    expect(avis.closest('header.page-title')).toBeNull();
    expect(avis.querySelector('button')).toBeNull();
    expect(screen.queryByText('Carregant la Consola…')).toBeNull();
    // La resta de la Wiki continua: el workspace i la mateixa capçalera.
    expect(container.querySelector('.sdp-wiki-workspace').contains(avis)).toBe(true);
    capcalera();
    capErrorDeRuta();
  });

  test('es pot triar un altre document, i tornar a la Consola torna a dir-ho dins del cos', async () => {
    const vista = render(ambLaRuta());
    await screen.findByRole('alert');
    fixture.itemId = '__intro';
    vista.rerender(ambLaRuta());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.querySelector('header.page-title h1').textContent).toBe(PAGE_COPY.wikidepoble.title);
    capErrorDeRuta();
    // lazyRoute guarda el rebuig: sense recarregar, la Consola continua sense arribar.
    fixture.itemId = 'consola_termodinamica';
    vista.rerender(ambLaRuta());
    expect((await screen.findByRole('alert')).textContent).toContain('No s’ha pogut carregar la Consola');
    capcalera();
    capErrorDeRuta();
  });

  test('la barrera només es queda la fallada d’un import: un altre error puja a la ruta', () => {
    const Peta = () => { throw new Error('un tauler malformat'); };
    render(
      <RouteErrorBoundary resetKey="/wikidepoble" externalConfig={{ manageDocumentHead: true }} mostraDetall={false}>
        <BarreraDeLaConsola fallback={<p data-consola="avis">avís</p>}><Peta /></BarreraDeLaConsola>
      </RouteErrorBoundary>
    );
    expect(document.querySelector('[data-consola="avis"]')).toBeNull();
    expect(screen.getByText('Hi ha hagut un problema')).toBeTruthy();
    // El camí dels errors que no són d'un import: el reintent de la ruta.
    expect(screen.getByRole('button', { name: 'Intentar de nou' })).toBeTruthy();
  });
});
