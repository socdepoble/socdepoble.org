import { Suspense } from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import {
  ARBRE_UNIVERSAL, ARREL_UNIVERSAL, CATALOG_ITEMS, RELACIONS, cadenaUniversal, esTransversal, etiquetaRelacio,
  explicaRelacio, fillsUniversals, nodeUniversal, relacioDe, rutaEspecimen, usuarisUniversals
} from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { Llinatge } from '../Llinatge.jsx';
import EspecimenArbreUniversal from './EspecimenArbreUniversal.jsx';

/* jsdom no porta ResizeObserver; la barra d'eines el fa servir. */
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
});
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

/* T52 (ordre del Mestre, 260928) · L'arbre universal és una sola arrel (la
   closca d'App.jsx), sense cicles, i cada node apunta a un espècimen que existix. */
describe('Arbre universal (dades)', () => {
  it('té una sola arrel, la closca, i la resta penja d’ella o és transversal', () => {
    const arrels = ARBRE_UNIVERSAL.filter((node) => node.pare === null && !esTransversal(node));
    expect(arrels.map((node) => node.id)).toEqual([ARREL_UNIVERSAL]);
    for (const node of ARBRE_UNIVERSAL) {
      if (esTransversal(node)) continue;
      const cadena = cadenaUniversal(node.id);
      expect(cadena[0].id, node.id).toBe(ARREL_UNIVERSAL);
      expect(cadena[cadena.length - 1].id).toBe(node.id);
    }
  });

  it('els ids són únics i els pares, els usos, les relacions i els espècimens existixen', () => {
    const ids = ARBRE_UNIVERSAL.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    const items = new Set(CATALOG_ITEMS.map((item) => item.id));
    for (const node of ARBRE_UNIVERSAL) {
      if (node.pare) expect(nodeUniversal(node.pare), node.id).not.toBeNull();
      for (const usat of node.usa || []) expect(esTransversal(nodeUniversal(usat)), `${node.id} → ${usat}`).toBe(true);
      if (node.item) expect(items.has(node.item), node.item).toBe(true);
      if ('relacio' in node) expect(RELACIONS, node.id).toContain(node.relacio);
    }
    const perItem = ARBRE_UNIVERSAL.filter((node) => node.item).map((node) => node.item);
    expect(new Set(perItem).size, 'cada espècimen és d’una sola peça').toBe(perItem.length);
  });

  it('el pare universal de la pàgina, la targeta i l’editor és el que diu el mapa', () => {
    expect(cadenaUniversal('card').map((node) => node.id)).toEqual(['closca', 'page', 'card']);
    expect(cadenaUniversal('targeta-viva').map((node) => node.id)).toEqual(['closca', 'page', 'card', 'targeta-viva']);
    expect(cadenaUniversal('emoticona-barra').map((node) => node.id)).toEqual(['closca', 'page', 'barres', 'emoticona-barra']);
    expect(cadenaUniversal('barra-eines').map((node) => node.id)).toEqual(['closca', 'page', 'editor', 'barra-eines']);
    expect(usuarisUniversals('dialeg').map((node) => node.id)).toContain('classificacio');
  });

  /* Esmena D2 de la revisió de T52a · AppGridShell no importa AppGridColumn:
     la columna la munta UniversalWorkspace. */
  it('la columna penja d’UniversalWorkspace, no d’AppGridShell', () => {
    expect(cadenaUniversal('columna').map((node) => node.id)).toEqual(['closca', 'workspace', 'columna']);
    expect(fillsUniversals('appgrid').map((node) => node.id)).toEqual(['resizer']);
    expect(fillsUniversals('workspace').map((node) => node.id)).toEqual(['appgrid', 'columna']);
  });

  it('una peça desconeguda no té cadena i un espècimen desconegut no té ruta', () => {
    expect(cadenaUniversal('no-existix')).toEqual([]);
    expect(rutaEspecimen('no-existix')).toBeNull();
    expect(rutaEspecimen('estructura-columnes')).toBe('/disseny?categoria=estructura&item=estructura-columnes');
  });
});

/* Esmena D2 de la revisió de T52a · «qui toca un pare ho canvia per a tots
   els fills» no és cert per a la targeta: la relació ho diu. */
describe('Arbre universal (relacions)', () => {
  it('la targeta és una versió de PageFrame; l’editor i la targeta viva l’instancien; la resta, munta', () => {
    expect(relacioDe(nodeUniversal('card'))).toBe('versio');
    expect(relacioDe(nodeUniversal('editor'))).toBe('instancia');
    expect(relacioDe(nodeUniversal('targeta-viva'))).toBe('instancia');
    expect(relacioDe(nodeUniversal('columna'))).toBe('munta');
    expect(relacioDe(nodeUniversal('barres'))).toBe('munta');
    expect(relacioDe({ relacio: 'inventada' })).toBe('munta');
  });

  it('explica què passa en tocar el pare, amb el nom del pare, i res sense pare', () => {
    expect(explicaRelacio('card')).toMatch(/versió reduïda de UniversalPage → PageFrame.*no n’hereta res.*tots dos/);
    expect(explicaRelacio('targeta-viva')).toBe('Instancia UniversalCard: n’hereta qualsevol canvi.');
    expect(explicaRelacio('columna')).toMatch(/^UniversalWorkspace la munta: .*no en canvia l’anatomia/);
    expect(explicaRelacio('closca')).toBeNull();
    expect(explicaRelacio('dialeg')).toBeNull();
    expect(etiquetaRelacio(nodeUniversal('barres'))).toBeNull();
  });

  /* Esmena D1 · el Xat no és un UniversalWorkspace; Perfil i Admin, sí. */
  it('els consumidors d’UniversalWorkspace són Notes, Disseny, la Wiki, Perfil i Admin, i no el Xat', () => {
    const consumidors = nodeUniversal('workspace').consumidors.join(' ');
    for (const nom of ['Notes', 'Disseny', 'Wiki', 'Perfil', 'Admin']) expect(consumidors).toContain(nom);
    expect(consumidors).not.toMatch(/Xat/);
    expect(nodeUniversal('appgrid').consumidors.join(' ')).toContain('ClosCaXat');
  });

  /* F3 · Els consumidors són qui MÉS munta la peça: mai el pare, que ja el
     diu la molla i la relació. */
  it('cap node repetix el seu pare com a consumidor', () => {
    for (const node of ARBRE_UNIVERSAL.filter((n) => n.pare && n.consumidors)) {
      const pare = nodeUniversal(node.pare);
      const noms = [pare.nom, ...pare.nom.split(/ → | i /)];
      for (const consumidor of node.consumidors) {
        expect(noms, `${node.id}: «${consumidor}»`).not.toContain(consumidor.split(' (')[0]);
      }
    }
  });

  /* F3 · Tots els fitxers de l'app que pinten <UniversalCard> (rg, 260928),
     llevat de TargetaViva, que és un node fill de l'arbre. ResultatCerca no:
     només en compartix la regla de les imatges. */
  it('els consumidors d’UniversalCard són tots els que la munten a l’app', () => {
    const consumidors = nodeUniversal('card').consumidors.join(' · ');
    for (const fitxer of [
      'MurSection', 'MercatSection', 'PoblesSection', 'ConnectarSection', 'EventCard', 'SectionItemCard',
      'TargetaConsola', 'TargetaResum', 'OnboardingSteps', 'ControlSection', 'TranslationsSection'
    ]) expect(consumidors).toContain(fitxer);
    expect(consumidors).not.toContain('ResultatCerca');
    expect(consumidors).not.toContain('TargetaViva');
  });

  it('ResumConnexio: ConnectarSection la passa com a fill d’UniversalPage, que la pinta dins de l’article', () => {
    expect(relacioDe(nodeUniversal('resum-connexio'))).toBe('munta');
    const text = explicaRelacio('resum-connexio');
    expect(text).toBe('ConnectarSection la passa com a fill de UniversalPage → PageFrame: UniversalPage → PageFrame la pinta on van els fills, dins de l’article, i ConnectarSection decidix quan apareix. L’anatomia és seua.');
    expect(text).not.toContain('decidix on i quan');
    expect(explicaRelacio('barres')).toMatch(/^UniversalPage → PageFrame la munta: decidix on i quan apareix/);
  });
});

describe('Arbre universal (espècimen)', () => {
  const pinta = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

  it('el llinatge pinta la molla des de la closca, amb la peça actual sense enllaç', () => {
    pinta(<Llinatge id="barra-eines" />);
    const molla = screen.getByRole('navigation', { name: 'Molla de pa' });
    const passos = within(molla).getAllByRole('listitem').map((li) => li.textContent);
    expect(passos).toEqual(['Closca (App.jsx)', 'UniversalPage → PageFrame', 'DocumentEditor → UniversalEditorShell', 'UniversalToolbar']);
    expect(within(molla).getByText('UniversalToolbar').getAttribute('aria-current')).toBe('page');
    expect(within(molla).getByRole('link', { name: 'UniversalPage → PageFrame' }).getAttribute('href'))
      .toBe('/disseny?categoria=estructura&item=estructura-page');
  });

  it('el llinatge de la targeta diu que no hereta de PageFrame; el del workspace, qui el munta', () => {
    const { container, unmount } = pinta(<Llinatge id="card" />);
    expect(container.querySelector('.sdp-llinatge__relacio').textContent).toContain('no n’hereta res');
    unmount();
    pinta(<Llinatge id="workspace" />);
    const munten = screen.getByText(/^La munten a l’app:/).textContent;
    expect(munten).toContain('Perfil (PerfilShell) i Admin (AdminSection)');
    expect(munten).not.toContain('Xat');
  });

  it('un transversal diu qui el fa servir i no pinta cap molla ni relació', () => {
    const { container } = pinta(<Llinatge id="dialeg" />);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(container.querySelector('.sdp-llinatge__relacio')).toBeNull();
    expect(screen.getByText(/La fan servir:/).textContent).toContain('BotoneraClassificacio');
  });

  it('l’arbre sencer llista totes les peces, una vegada cadascuna, marca les relacions i cap h1', () => {
    const { container } = pinta(<EspecimenArbreUniversal />);
    const arbres = container.querySelectorAll('ul.sdp-arbre');
    expect(arbres).toHaveLength(2);
    const noms = [...container.querySelectorAll('.sdp-arbre li')].map((li) => li.firstElementChild.textContent);
    expect([...noms].sort()).toEqual(ARBRE_UNIVERSAL.map((node) => node.nom).sort());
    const relacions = [...container.querySelectorAll('.sdp-arbre__relacio')].map((em) => em.textContent);
    expect(relacions.sort()).toEqual([
      'instància: n’hereta qualsevol canvi', 'instància: n’hereta qualsevol canvi', 'versió reduïda: no n’hereta res'
    ]);
    expect(container.textContent).not.toContain('ho canvia per a tots els fills');
    expect(container.querySelector('h1')).toBeNull();
  });

  /* Esmena D10 · cada espècimen diu d'on penja: la peça de l'arbre que hi
     apunta es pinta, una sola vegada, al seu espècimen de veres. */
  it('cada peça amb espècimen hi pinta el seu llinatge, una sola vegada', async () => {
    for (const node of ARBRE_UNIVERSAL.filter((n) => n.item)) {
      const item = CATALOG_ITEMS.find((i) => i.id === node.item);
      const Carregador = CATALOG_DETAIL_LOADERS[item.detailKey];
      const vista = render(<MemoryRouter><Suspense fallback={null}><Carregador /></Suspense></MemoryRouter>);
      /* El carregador és lazy: sota càrrega, el primer import d'un espècimen
         (calendari) passa del segon per defecte de waitFor. */
      await waitFor(() => expect(vista.container.querySelector(`#llinatge-${node.id}`), node.id).not.toBeNull(), { timeout: 5000 });
      expect(vista.container.querySelectorAll('.sdp-llinatge'), node.id).toHaveLength(1);
      vista.unmount();
    }
  }, 20_000);
});
