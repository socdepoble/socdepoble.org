/* Plataforma d'Apps Enxufables · la ruta /app/* (RutaApps.jsx).
   Router de navegador sobre la URL de jsdom: la Clàusula dels Slugs es
   comprova a window.location i window.history (enllaç profund, push, pop i
   replace només per a canonitzar). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Link, Route, Routes, useParams } from '../../app/contexts/RouterContext.jsx';
import { delVal } from '../../config/storage.js';
import { ENTORN_OBERT, muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva, manifestExternDeProva } from './__fixtures__/manifests.js';
import { ESDEVENIMENT_NAVEGA } from './ElementExtern.jsx';
import { useApp, useInterruptorsApp } from './PlataformaContext.jsx';
import { CLAU_PREFERENCIES, _reiniciaPreferencies } from './preferenciesApps.js';
import { creaRegistre } from './registreApps.js';

function Tiquet() {
  const { tiquetId } = useParams();
  return <p>Tiquet {tiquetId}</p>;
}

/* Una app de prova amb rutes relatives a /app/prova i enllaços absoluts. */
function AppDeProva() {
  const { ruta, manifest } = useApp();
  return (
    <div>
      <p>App {manifest.id}</p>
      <Link to={ruta('caixa')}>Ves a la caixa</Link>
      <Link to={ruta('caixa', 't-9')}>Obri el tiquet</Link>
      <Routes>
        <Route path="inici" element={<p>Vista inici</p>} />
        <Route path="caixa" element={<p>Vista caixa</p>} />
        <Route path="caixa/:tiquetId" element={<Tiquet />} />
      </Routes>
    </div>
  );
}

const carregaDeLaProva = vi.fn(() => Promise.resolve({ default: AppDeProva }));
const registreDeProva = (canvis = {}) => creaRegistre({ internes: [manifestDeProva({ carrega: carregaDeLaProva, ...canvis })] });
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

beforeEach(() => {
  carregaDeLaProva.mockClear();
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
  const titol = document.createElement('title');
  titol.textContent = 'Amfitrió';
  document.head.replaceChildren(titol);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
});

describe('Clàusula dels Slugs', () => {
  test('enllaç profund: una URL copiada obri exactament eixe estat', async () => {
    muntaPlataforma('/app/prova/caixa/t-3', { registre: registreDeProva() });
    expect(await screen.findByText('Tiquet t-3')).toBeTruthy();
    expect(ubicacio()).toBe('/app/prova/caixa/t-3');
    expect(document.querySelector('.sdp-app-contenidor').getAttribute('data-sdp-app')).toBe('prova');
  });

  test('/app/<id> es canonitza amb replace a l’entrada per defecte', async () => {
    window.history.replaceState(null, '', '/');
    const llarg = window.history.length;
    muntaPlataforma('/app/prova', { registre: registreDeProva() });
    expect(await screen.findByText('Vista inici')).toBeTruthy();
    expect(window.location.pathname).toBe('/app/prova/inici');
    expect(window.history.length).toBe(llarg);
  });

  test('navegar fa push; arrere i avant recorren les vistes', async () => {
    muntaPlataforma('/app/prova/inici', { registre: registreDeProva() });
    await screen.findByText('Vista inici');
    const llarg = window.history.length;

    fireEvent.click(screen.getByRole('link', { name: 'Ves a la caixa' }));
    expect(await screen.findByText('Vista caixa')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Obri el tiquet' }));
    expect(await screen.findByText('Tiquet t-9')).toBeTruthy();
    expect(window.history.length).toBe(llarg + 2);

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/prova/caixa'));
    expect(screen.getByText('Vista caixa')).toBeTruthy();

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/prova/inici'));

    await act(async () => { window.history.forward(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/prova/caixa'));
  });

  /* Un tram que és sencer '%2e%2e' el normalitza el parser d'URL (puja un
     nivell abans d'arribar a l'app); un '%2e', un espai o una majúscula
     dins d'un tram arriben, i la plataforma els rebutja. */
  test.each(['/app/prova/caixa%2ex', '/app/prova/taula%20gran', '/app/Prova/inici', '/app/prova//caixa', '/app//prova/inici', '/app//'])(
    'una ruta no segura (%s) no carrega l’app i ho diu', (url) => {
      muntaPlataforma(url, { registre: registreDeProva() });
      expect(screen.getByText('Esta adreça no és vàlida')).toBeTruthy();
      expect(carregaDeLaProva).not.toHaveBeenCalled();
    }
  );

  test('un %2e%2e sencer no escapa de /app: el parser d’URL el resol abans', () => {
    muntaPlataforma('/app/prova/%2e%2e/xat', { registre: registreDeProva() });
    expect(ubicacio()).toBe('/app/xat');
    expect(screen.getByText('No coneixem esta app')).toBeTruthy();
    expect(carregaDeLaProva).not.toHaveBeenCalled();
  });
});

describe('apps que no s’obrin', () => {
  test('una app desconeguda diu que no la coneix i torna al portal', () => {
    muntaPlataforma('/app/fantasma/inici', { registre: registreDeProva() });
    expect(screen.getByText('No coneixem esta app')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Torna a les apps' }).getAttribute('href')).toBe('/app');
    expect(carregaDeLaProva).not.toHaveBeenCalled();
  });

  test('una app desactivada no es carrega i explica per què', () => {
    muntaPlataforma('/app/prova/inici', { registre: registreDeProva({ actiuPerDefecte: false }) });
    expect(screen.getByText('Esta app no està activada')).toBeTruthy();
    expect(screen.getByText('Este node no l’activa per defecte.')).toBeTruthy();
    expect(carregaDeLaProva).not.toHaveBeenCalled();
    expect(ubicacio()).toBe('/app/prova/inici');
  });

  test('en producció, una app en obres (entorn desenvolupament) no es carrega', () => {
    muntaPlataforma('/app/prova/inici', { registre: registreDeProva({ entorn: 'desenvolupament' }) });
    expect(screen.getByText('Encara està en obres: només es pot provar en desenvolupament.')).toBeTruthy();
    expect(carregaDeLaProva).not.toHaveBeenCalled();
  });

  test('premium sense dret: ho diu clar, sense amagar-ho', () => {
    muntaPlataforma('/app/prova/inici', {
      registre: registreDeProva({ nivell: 'premium', dret: 'sdp.app.prova' }),
      entorn: { ...ENTORN_OBERT, teDret: () => false }
    });
    expect(screen.getByText('Esta app és premium')).toBeTruthy();
    expect(screen.getByText(/projecte lliure/)).toBeTruthy();
    expect(carregaDeLaProva).not.toHaveBeenCalled();
  });

  test('salut fora del document propi: un EstatBuit explicatiu i cap càrrega', async () => {
    muntaPlataforma('/app/prova/inici', {
      registre: registreDeProva({ dadesPersonals: 'salut' }),
      entorn: { ...ENTORN_OBERT, amaDelDocument: false }
    });
    expect(screen.getByText('Esta app no es pot obrir ací')).toBeTruthy();
    expect(screen.getByText(/només s’obri a la pàgina pròpia/)).toBeTruthy();
    expect(carregaDeLaProva).not.toHaveBeenCalled();
    cleanup();
    muntaPlataforma('/app/prova/inici', { registre: registreDeProva({ dadesPersonals: 'salut' }) });
    expect(await screen.findByText('Vista inici')).toBeTruthy();
  });

  test('una entrada que no existix ho diu i porta a l’entrada per defecte', () => {
    muntaPlataforma('/app/prova/fantasma', { registre: registreDeProva() });
    expect(screen.getByText('Esta pàgina de l’app no existix')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ves a La Prova' }).getAttribute('href')).toBe('/app/prova/inici');
    expect(carregaDeLaProva).not.toHaveBeenCalled();
  });
});

describe('el portal /app', () => {
  test('llista les apps amb l’estat en text i obri la disponible a la seua entrada', () => {
    const registre = creaRegistre({
      internes: [manifestDeProva({ carrega: carregaDeLaProva }), manifestDeProva({ id: 'tancada', titol: { ca: 'Tancada' }, actiuPerDefecte: false })]
    });
    muntaPlataforma('/app', { registre });
    expect(screen.getByRole('heading', { level: 1, name: 'Apps' })).toBeTruthy();
    const [prova, tancada] = screen.getAllByRole('listitem');
    expect(within(prova).getByRole('heading', { level: 2, name: 'La Prova' })).toBeTruthy();
    expect(within(prova).getByText('Disponible')).toBeTruthy();
    expect(within(prova).getByRole('link', { name: 'Obri' }).getAttribute('href')).toBe('/app/prova/inici');
    expect(within(tancada).getByText('Apagada')).toBeTruthy();
    expect(within(tancada).queryByRole('link', { name: 'Obri' })).toBeNull();
    expect(within(tancada).getByRole('switch', { name: 'Vull vore Tancada' }).disabled).toBe(true);
    expect(carregaDeLaProva).not.toHaveBeenCalled();
  });

  test('l’interruptor de la persona apaga i torna a encendre l’app', () => {
    muntaPlataforma('/app', { registre: registreDeProva() });
    const interruptor = screen.getByRole('switch', { name: 'Vull vore La Prova' });
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(interruptor);
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText('Apagada')).toBeTruthy();
    expect(screen.getByText('L’has apagada tu. La pots tornar a encendre quan vulgues.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Obri' })).toBeNull();
    fireEvent.click(interruptor);
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('link', { name: 'Obri' })).toBeTruthy();
  });

  test('/app/ es canonitza a /app', async () => {
    muntaPlataforma('/app/', { registre: registreDeProva() });
    await waitFor(() => expect(window.location.pathname).toBe('/app'));
    expect(screen.getByRole('heading', { level: 1, name: 'Apps' })).toBeTruthy();
  });

  test('títol de pestanya «Apps» i mai indexable; dins d’una app, el títol de l’app', async () => {
    muntaPlataforma('/app', { registre: registreDeProva(), seo: true, externalConfig: { manageDocumentHead: true } });
    await waitFor(() => expect(document.title).toBe('Apps | Sóc de Poble'));
    expect(document.head.querySelector('meta[name="robots"]').content).toBe('noindex, nofollow');
    fireEvent.click(screen.getByRole('link', { name: 'Obri' }));
    await screen.findByText('Vista inici');
    await waitFor(() => expect(document.title).toBe('La Prova | Sóc de Poble'));
    expect(document.head.querySelector('meta[name="robots"]').content).toBe('noindex, nofollow');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });
});

describe('els interruptors interns d’una app (useInterruptorsApp)', () => {
  function AppAmbInterruptors() {
    const { actiu, apaga, avalua } = useInterruptorsApp();
    return (
      <div>
        <p>Cuina: {actiu('cuina') ? 'sí' : 'no'}</p>
        <p>Escandalls: {avalua('escandalls').estat}</p>
        <button type="button" onClick={() => apaga('cuina', actiu('cuina'))}>Canvia la cuina</button>
      </div>
    );
  }

  test('l’app llig els seus interruptors i la persona n’apaga un', async () => {
    const registre = creaRegistre({
      internes: [manifestDeProva({
        carrega: () => Promise.resolve({ default: AppAmbInterruptors }),
        interruptors: [
          { id: 'cuina', titol: { ca: 'Cuina' } },
          { id: 'escandalls', titol: { ca: 'Escandalls' }, nivell: 'premium', dret: 'sdp.app.prova.escandalls' }
        ]
      })]
    });
    muntaPlataforma('/app/prova/inici', { registre, entorn: { ...ENTORN_OBERT, teDret: (dret) => dret === 'sdp.app.prova' } });
    expect(await screen.findByText('Cuina: sí')).toBeTruthy();
    expect(screen.getByText('Escandalls: unsubscribed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Canvia la cuina' }));
    expect(await screen.findByText('Cuina: no')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Canvia la cuina' }));
    expect(await screen.findByText('Cuina: sí')).toBeTruthy();
  });
});

describe('una app externa (custom element)', () => {
  test('es pinta l’element amb la ruta i navega amb push quan el demana', async () => {
    const registre = creaRegistre({ internes: [] });
    expect(registre.registraAppExterna(manifestExternDeProva()).ok).toBe(true);
    muntaPlataforma('/app/reserves/inici', { registre });
    const element = document.querySelector('sollutia-reserves');
    expect(element.getAttribute('data-sdp-app')).toBe('reserves');
    expect(element.getAttribute('data-sdp-ruta')).toBe('/inici');
    const llarg = window.history.length;

    act(() => { element.dispatchEvent(new CustomEvent(ESDEVENIMENT_NAVEGA, { detail: { ruta: 'caixa/t-9' } })); });
    await waitFor(() => expect(ubicacio()).toBe('/app/reserves/caixa/t-9'));
    expect(window.history.length).toBe(llarg + 1);
    expect(document.querySelector('sollutia-reserves').getAttribute('data-sdp-ruta')).toBe('/caixa/t-9');

    /* Fora de l'app, trams no segurs o una entrada que no existix: res. */
    for (const ruta of ['../xat', '/caixa/%2e%2e', 'fantasma', 'https://exemple.invalid/x', '']) {
      act(() => { document.querySelector('sollutia-reserves').dispatchEvent(new CustomEvent(ESDEVENIMENT_NAVEGA, { detail: { ruta } })); });
    }
    expect(ubicacio()).toBe('/app/reserves/caixa/t-9');
    expect(window.history.length).toBe(llarg + 1);
  });
});
