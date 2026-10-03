/* Esquelet comú de catàleg i col·lecció · la pantalla sencera dins de la
   plataforma de veres (RutaApps → ClosaAplicacio → AppGridShell), amb una app
   de prova que hi posa una intel·ligència de dades mínima: tocar afig una
   línia. Ample (1400 px) i estret (375 px). */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useMemo, useState } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { manifestDeProva } from '../../plataforma/__fixtures__/manifests.js';
import { creaRegistre } from '../../plataforma/registreApps.js';
import { EsqueletCatalegColleccio, useColleccioActiva } from './index.js';

const CATEGORIES = [
  { id: 'cafes', nom: 'Cafès', ordre: 0, visible: true },
  { id: 'begudes', nom: 'Begudes', ordre: 1, visible: true }
];
const PRODUCTES = [
  { id: 'tallat', nom: 'Tallat', categoriaId: 'cafes', cents: 130 },
  { id: 'aigua', nom: 'Aigua', categoriaId: 'begudes', cents: 100 }
];
const euros = (cents) => `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')} €`;

/* La «intel·ligència de dades» de l'app de prova: una comanda en memòria. */
function AppDeProva() {
  const [quantitats, setQuantitats] = useState({});
  const articles = useMemo(() => PRODUCTES.map((p) => ({
    id: p.id, nom: p.nom, categoriaId: p.categoriaId, valor: euros(p.cents), estat: quantitats[p.id] ? 'en-colleccio' : 'normal'
  })), [quantitats]);
  const linies = PRODUCTES.filter((p) => quantitats[p.id]).map((p) => ({
    id: `l-${p.id}`, articleId: p.id, quantitat: quantitats[p.id], nom: p.nom, valor: euros(p.cents * quantitats[p.id])
  }));
  const total = PRODUCTES.reduce((suma, p) => suma + (quantitats[p.id] || 0) * p.cents, 0);
  const resum = { etiqueta: 'Comanda', comptador: linies.length, textComptador: (n) => `${n} línies`, total: euros(total) };
  const afig = (article) => setQuantitats((q) => ({ ...q, [article.id]: (q[article.id] || 0) + 1 }));
  return (
    <EsqueletCatalegColleccio
      entrada="caixa"
      cataleg={{ titol: 'Productes', categories: CATEGORIES, articles, onTria: afig, resum }}
      colleccio={{ titol: 'Comanda', linies, resum: { ...resum, accio: { text: 'Cobra', onClick: () => {} } } }}
      colleccions={{ titol: 'Tiquets oberts', colleccions: [{ id: 'barra', nom: 'Barra', comptador: linies.length }], actiu: 'barra' }}
    />
  );
}

/* ESQ-R6 · Una app amb diverses col·leccions (els tiquets oberts): l'activa
   viu al camí (/caixa/<tiquet>) i l'app la llig amb useColleccioActiva. */
const TIQUETS = [{ id: 'barra', nom: 'Barra' }, { id: 't-3', nom: 'Taula 3' }];
const RUTA_TIQUET = Object.freeze({ parametre: 'tiquet' });

function AppAmbTiquets() {
  const tiquet = useColleccioActiva({ entrada: 'caixa', rutaColleccio: RUTA_TIQUET }) || 'barra';
  const [comandes, setComandes] = useState({ barra: [], 't-3': ['aigua'] });
  const ids = comandes[tiquet] || [];
  const articles = PRODUCTES.map((p) => ({
    id: p.id, nom: p.nom, categoriaId: p.categoriaId, valor: euros(p.cents), estat: ids.includes(p.id) ? 'en-colleccio' : 'normal'
  }));
  const linies = ids.map((id) => ({ id: `l-${id}`, articleId: id, quantitat: 1, nom: PRODUCTES.find((p) => p.id === id).nom }));
  const resum = { etiqueta: 'Comanda', comptador: linies.length, textComptador: (n) => `${n} línies` };
  return (
    <EsqueletCatalegColleccio
      entrada="caixa"
      rutaColleccio={RUTA_TIQUET}
      cataleg={{ titol: 'Productes', categories: CATEGORIES, articles, resum,
        onTria: (a) => setComandes((c) => ({ ...c, [tiquet]: [...(c[tiquet] || []), a.id] })) }}
      colleccio={{ titol: 'Comanda', linies, resum }}
      colleccions={{ titol: 'Tiquets oberts', colleccions: TIQUETS.map((t) => ({ ...t, comptador: (comandes[t.id] || []).length })) }}
    />
  );
}

const registre = (App = AppDeProva) => creaRegistre({
  internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: App }) })]
});
const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => document.getElementById(id);
const closca = () => document.querySelector('.app-grid-shell');
const tancada = (id) => columna(id).getAttribute('aria-hidden') === 'true';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('EsqueletCatalegColleccio dins de la plataforma', () => {
  test('ample: col·leccions, col·lecció i catàleg de costat; tocar afig a la comanda', async () => {
    ambAmplada(1400);
    muntaPlataforma('/app/prova/caixa', { registre: registre() });
    await screen.findByRole('region', { name: 'Productes' });
    expect(closca().dataset.layout).toBe('ample');
    for (const id of ['app-grid-sidebar', 'app-grid-list', 'app-grid-main']) expect(tancada(id), id).toBe(false);
    expect(within(columna('app-grid-sidebar')).getByRole('button', { name: /^Barra/ })).toBeTruthy();
    expect(within(columna('app-grid-list')).getByText('Encara no hi ha res')).toBeTruthy();

    fireEvent.click(within(columna('app-grid-main')).getByRole('button', { name: 'Tallat 1,30 €' }));
    fireEvent.click(within(columna('app-grid-main')).getByRole('button', { name: 'Tallat 1,30 €' }));
    const comanda = within(columna('app-grid-list'));
    expect(comanda.getByRole('heading', { level: 3 }).textContent).toBe('Comanda 1 línies');
    const linia = comanda.getByRole('list', { name: 'Comanda' }).querySelector('[data-linia="l-tallat"]');
    expect(linia.querySelector('.sdp-linies__quantitat [aria-hidden="true"]').textContent).toBe('2 ×');
    expect(linia.querySelector('.sdp-linies__valor').textContent).toBe('2,60 €');
    expect(within(columna('app-grid-main')).getByRole('button', { name: 'Tallat 1,30 €' }).closest('li').className)
      .toContain('sdp-graella-articles__element--en-colleccio');
    /* En ample no hi ha peu al catàleg: la comanda ja es veu. */
    expect(screen.queryByRole('link', { name: /^Comanda/ })).toBeNull();
  });

  test('canviar de categoria no desmunta cap columna: la comanda continua on era', async () => {
    ambAmplada(1400);
    muntaPlataforma('/app/prova/caixa', { registre: registre() });
    await screen.findByRole('region', { name: 'Productes' });
    fireEvent.click(screen.getByRole('button', { name: 'Aigua 1,00 €' }));
    fireEvent.click(screen.getByRole('button', { name: 'Begudes' }));
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/prova/caixa?categoria=begudes');
    expect(within(columna('app-grid-list')).getByText('Aigua')).toBeTruthy();
    expect(within(columna('app-grid-main')).queryByRole('button', { name: /^Tallat/ })).toBeNull();
  });

  test('estret: el catàleg primer, la BarraResum porta a la comanda i arrere hi torna', async () => {
    ambAmplada(375);
    muntaPlataforma('/app/prova/caixa', { registre: registre() });
    await screen.findByRole('region', { name: 'Productes' });
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(closca().dataset.layout).toBe('estret');
    expect(tancada('app-grid-main')).toBe(false);
    expect(tancada('app-grid-list')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Tallat 1,30 €' }));
    const peu = screen.getByRole('link', { name: 'Comanda 1 línies 1,30 €' });
    expect(peu.getAttribute('href')).toBe('/app/prova/caixa/colleccio');
    fireEvent.click(peu);
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/prova/caixa/colleccio');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    expect(tancada('app-grid-list')).toBe(false);

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/prova/caixa');
  });

  test('estret dins de la comanda: «Torna al catàleg» navega amb push', async () => {
    ambAmplada(375);
    muntaPlataforma('/app/prova/caixa/colleccio', { registre: registre() });
    await screen.findByRole('region', { name: 'Comanda' });
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.click(within(columna('app-grid-list')).getByRole('button', { name: 'Torna al catàleg' }));
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/prova/caixa');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
  });

  test('diverses col·leccions: l’activa viu al camí, cada targeta és un enllaç de l’app i arrere hi torna', async () => {
    ambAmplada(1400);
    muntaPlataforma('/app/prova/caixa/t-3', { registre: registre(AppAmbTiquets) });
    await screen.findByRole('region', { name: 'Productes' });
    const esquerra = within(columna('app-grid-sidebar'));
    expect(esquerra.getByRole('link', { name: /^Taula 3/ }).getAttribute('aria-current')).toBe('true');
    expect(esquerra.getByRole('link', { name: /^Barra/ }).getAttribute('href')).toBe('/app/prova/caixa/barra');
    expect(within(columna('app-grid-list')).getByText('Aigua')).toBeTruthy();

    fireEvent.click(esquerra.getByRole('link', { name: /^Barra/ }));
    expect(screen.getByTestId('ubicacio').textContent).toBe('/app/prova/caixa/barra');
    expect(esquerra.getByRole('link', { name: /^Barra/ }).getAttribute('aria-current')).toBe('true');
    expect(esquerra.getByRole('link', { name: /^Taula 3/ }).getAttribute('aria-current')).toBeNull();
    expect(within(columna('app-grid-list')).getByText('Encara no hi ha res')).toBeTruthy();
    fireEvent.click(within(columna('app-grid-main')).getByRole('button', { name: 'Tallat 1,30 €' }));
    expect(within(columna('app-grid-list')).getByText('Tallat')).toBeTruthy();

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(screen.getByTestId('ubicacio').textContent).toBe('/app/prova/caixa/t-3'));
    expect(within(columna('app-grid-list')).queryByText('Tallat')).toBeNull();
    expect(within(columna('app-grid-list')).getByText('Aigua')).toBeTruthy();
  });

  test('diverses col·leccions en estret: el panell de la comanda d’un tiquet és <entrada>/<id>/colleccio', async () => {
    ambAmplada(375);
    muntaPlataforma('/app/prova/caixa/t-3', { registre: registre(AppAmbTiquets) });
    await screen.findByRole('region', { name: 'Productes' });
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    const peu = screen.getByRole('link', { name: /^Comanda 1 línies/ });
    expect(peu.getAttribute('href')).toBe('/app/prova/caixa/t-3/colleccio');
    fireEvent.click(peu);
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    expect(within(columna('app-grid-list')).getByText('Aigua')).toBeTruthy();
  });

  test('una ruta que no és de l’esquelet dona l’avís de la plataforma, mai una pantalla buida', async () => {
    muntaPlataforma('/app/prova/inici', { registre: registre() });
    expect(await screen.findByText('Esta pàgina de l’app no existix')).toBeTruthy();
  });
});
