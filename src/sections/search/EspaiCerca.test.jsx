/**
 * EspaiCerca.test.jsx — L'espai de cerca en tres columnes (IDEA-46, B6-B3 de
 * la marató 261101_2143). L'espai de veres (UniversalWorkspace) i la cerca de
 * veres de l'índex (cercaEntrades) sobre unes entrades sintètiques; només
 * useCercaGlobal és simulat (sense contextos de dades), i el router és un
 * doble amb historial: push, replace i Arrere, com el del navegador.
 */
import '../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../config/i18n.js';
import EspaiCerca from './EspaiCerca.jsx';
import SearchSection from './SearchSection.jsx';
import { cercaEntrades, deActeDelCalendari, deAgent, deMembre, deNota, dePoble, dePublicacio } from './indexCerca.js';
import { useCercaGlobal } from './useCercaGlobal.js';

const estat = vi.hoisted(() => ({
  historial: [''],
  posicio: 0,
  oients: new Set(),
  escriptures: [],
  t: (_, reserva) => reserva,
  errors: [],
  carregant: false,
  senseSessio: false
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const React = await import('react');
  const actual = () => estat.historial[estat.posicio];
  const subscriu = (oient) => {
    estat.oients.add(oient);
    return () => estat.oients.delete(oient);
  };
  const Link = ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children);
  return {
    /* Una sola URL per a tots els que la lligen; el replace per defecte, com el router de veres. */
    useSearchParams: () => {
      const cerca = React.useSyncExternalStore(subscriu, actual);
      const params = React.useMemo(() => new URLSearchParams(cerca), [cerca]);
      const setParams = React.useCallback((nous, opcions = { replace: true }) => {
        const seguents = new URLSearchParams(actual());
        Object.entries(nous).forEach(([clau, valor]) => (valor == null ? seguents.delete(clau) : seguents.set(clau, valor)));
        const replace = opcions?.replace !== false;
        estat.escriptures.push({ nous, replace });
        if (replace) estat.historial[estat.posicio] = seguents.toString();
        else {
          estat.historial = [...estat.historial.slice(0, estat.posicio + 1), seguents.toString()];
          estat.posicio += 1;
        }
        estat.oients.forEach((oient) => oient());
      }, []);
      return [params, setParams];
    },
    useNavigate: () => () => {},
    useLocation: () => ({ pathname: '/cerca', search: `?${actual()}` }),
    useRouter: () => ({ navigate: () => {}, currentPath: '/cerca', basename: '' }),
    Link,
    NavLink: Link
  };
});
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: estat.t }),
  useUIActionsOpcional: () => ({ t: estat.t }),
  useUIState: () => ({ locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('./useCercaGlobal.js', () => ({ useCercaGlobal: vi.fn() }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
/* La /cerca de sempre, per a la prova de l'embolcall: la Pàgina Universal simulada (SearchSection.test.jsx). */
vi.mock('../../components/universal/UniversalPage', async () => {
  const { createElement } = await import('react');
  return {
    UniversalPage: ({ title, accioPrincipal, children }) => createElement('main', null,
      createElement('header', null, createElement('p', null, title), accioPrincipal), children)
  };
});

/* Dades sintètiques. «festa» en troba cinc: dues publicacions (una d'avui a
   Benifallim, una del 2020 a la Torre), un acte del 2099, una persona de
   Benifallim sense data i una nota privada del 2020. */
const ARA = new Date().toISOString();
const P1 = dePublicacio({ id: 'p1', title: 'Festa major de Benifallim', town_name: 'Benifallim', created_at: ARA, summary: 'Programa de la festa major del poble.' });
const P2 = dePublicacio({ id: 'p2', title: 'Festa de la pilota', town_name: 'La Torre de les Maçanes', created_at: '2020-03-01', summary: 'Partida de pilota valenciana.' });
/* G3-pedra-seca-i18n-16 · Un acte de /cerca (useCercaGlobal · deActeDelCalendari), del Calendari. */
const A1 = deActeDelCalendari({ id: 'a1', title: 'Concert de festa', date: '2099-06-01', summary: 'Concert a la plaça.' });
const U9 = deAgent({ id: 'u9', name: 'Pepa Festa', type: 'PERSON', town_name: 'Benifallim' });
const N1 = deNota({ id: 'n1', title: 'Llista de la festa', lead: 'Coses per a la festa.', updatedAt: '2020-02-02' });
const POBLE = dePoble({ id: 'benifallim', title: 'Benifallim', comarca: "L'Alcoià" });
const MEMBRE = deMembre({ usuari_id: 'u-ferrer', nom: 'Javi Ferrer', tipus: 'persona', fil_id: null });
const ENTRADES = Object.freeze([P1, P2, A1, U9, N1, POBLE, MEMBRE]);
/* IDEA-61 (T0, prompt 261102_1532) · Dues fitxes de Compartir cotxe (viuen a
   la secció 'mur' amb l'àmbit al payload), que només «cotxe» troba. */
const DADES_COTXE = Object.freeze({ modalitat: 'oferisc_places', lloc_eixida: 'Benifallim', lloc_arribada: 'Alcoi', data_eixida: '2026-12-01', places: 3 });
const V1 = dePublicacio({ id: 'v1', title: 'Cotxe a Alcoi dilluns', ambit: 'vehicle', estat: 'disponible', dades: DADES_COTXE, town_name: 'Benifallim', created_at: ARA });
const V2 = dePublicacio({ id: 'v2', title: 'Cotxe a Xixona', ambit: 'vehicle', estat: 'reservat', dades: { ...DADES_COTXE, lloc_arribada: 'Xixona' }, created_at: ARA });
const AMB_COTXES = Object.freeze([...ENTRADES, V1, V2]);

let resultatsPerConsulta;
let amplada = 1400;
/* El hook simulat sobre unes entrades: com el de veres, memoritza una llista
   per consulta (la mateixa identitat). */
const ambEntrades = (entrades) => {
  resultatsPerConsulta = new Map();
  vi.mocked(useCercaGlobal).mockImplementation(({ q = '', tipus = 'tot' } = {}) => {
    const clau = `${q}|${tipus}`;
    if (!resultatsPerConsulta.has(clau)) resultatsPerConsulta.set(clau, cercaEntrades(entrades, q, tipus));
    return { resultats: resultatsPerConsulta.get(clau), fonts: [], errors: estat.errors, carregant: estat.carregant, senseSessio: estat.senseSessio };
  });
};
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: l'amplada de la closca la diu esta variable (1400: les tres columnes).
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
});
beforeEach(() => {
  estat.historial = [''];
  estat.posicio = 0;
  estat.escriptures = [];
  estat.t = (_, reserva) => reserva;
  estat.errors = [];
  estat.carregant = false;
  estat.senseSessio = false;
  amplada = 1400;
  try { window.sessionStorage.clear(); window.localStorage.clear(); } catch { /* sense emmagatzematge */ }
  vi.mocked(useCercaGlobal).mockReset();
  ambEntrades(ENTRADES);
});
afterEach(() => cleanup());

const url = () => new URLSearchParams(estat.historial[estat.posicio]);
const pinta = (cerca) => {
  estat.historial = [cerca];
  estat.posicio = 0;
  return render(<EspaiCerca />);
};
const espera = (ms) => act(() => new Promise((resol) => { setTimeout(resol, ms); }));
const enrere = () => act(() => {
  estat.posicio -= 1;
  estat.oients.forEach((oient) => oient());
});
const titols = () => [...document.querySelectorAll('.sdp-gestor-fitxa__titol')].map((node) => node.textContent);
const fitxa = (titol) => [...document.querySelectorAll('.sdp-gestor-fitxa')]
  .find((boto) => boto.querySelector('.sdp-gestor-fitxa__titol')?.textContent === titol);
const detall = () => document.querySelector('.sdp-workspace-detail');
const criteris = () => screen.getByRole('complementary', { name: 'CRITERIS' });
const lupa = () => screen.getByRole('searchbox', { name: 'Cerca a Sóc de Poble' });
const ordreDe = (q) => cercaEntrades(ENTRADES, q, 'tot').llista.map((entrada) => entrada.titol);
const escripturesDe = (camp) => estat.escriptures.filter(({ nous }) => camp in nous);

describe('les tres columnes', () => {
  test.each([
    ['ca', '1 resultat', '2 resultats'],
    ['es', '1 resultado', '2 resultados'],
    ['en', '1 result', '2 results'],
    ['eu', '1 emaitza', '2 emaitza'],
    ['gl', '1 resultado', '2 resultados']
  ])('ARB-07 · %s anuncia una coincidència en singular i diverses en plural', (idioma, singular, plural) => {
    estat.t = createTranslator(idioma);
    pinta('mode=espai&q=festa');
    const nav = within(screen.getByRole('complementary', { name: estat.t('section.search.espai.navegacio') }));
    expect(nav.getAllByRole('button', { name: new RegExp(` ${singular}$`) }).length).toBeGreaterThan(0);
    expect(nav.getAllByRole('button', { name: new RegExp(` ${plural}$`) }).length).toBeGreaterThan(0);
    if (singular !== plural.replace('2 ', '1 ')) expect(nav.queryAllByRole('button', { name: new RegExp(` ${plural.replace('2 ', '1 ')}$`) })).toHaveLength(0);
  });

  test('criteris Tipus, Pobles i Data amb el recompte de cada opció, la llista en l’ordre del rànquing i el detall que demana triar', () => {
    pinta('mode=espai&q=festa');
    expect(vi.mocked(useCercaGlobal)).toHaveBeenLastCalledWith({ q: 'festa', tipus: 'tot' });
    const nav = within(criteris());
    for (const grup of ['Tipus', 'Pobles', 'Data']) expect(nav.getByRole('button', { name: grup }).getAttribute('aria-expanded')).toBe('true');
    for (const opcio of ['Publicacions 2 resultats', 'Calendari 1 resultat', 'Notes 1 resultat', 'Persones 1 resultat',
      'Benifallim 2 resultats', 'La Torre de les Maçanes 1 resultat',
      'Pròximament 1 resultat', 'Hui 1 resultat', 'Esta setmana 1 resultat', 'Este mes 1 resultat', 'Este any 1 resultat', 'Abans 2 resultats']) {
      expect(nav.getByRole('button', { name: opcio })).toBeTruthy();
    }
    /* Cap opció sense resultats (Pobles, Mercat…), i cap correu ni grup buit. */
    expect(nav.queryByRole('button', { name: /^Mercat/ })).toBeNull();
    expect(nav.getByRole('button', { name: 'Tots els resultats' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('complementary', { name: 'RESULTATS' })).toBeTruthy();
    expect(titols()).toEqual(ordreDe('festa'));
    expect(titols()).toHaveLength(5);
    expect(within(detall()).getByText("Tria un resultat per a vore'l ací.")).toBeTruthy();
    /* Ni el traductor de pàgina ni cap pàgina universal dins de l'espai. */
    expect(document.querySelector('main')).toBeNull();
  });

  test('sense consulta: l’estat inicial de /cerca al detall, la llista ho pregunta i no hi ha cap criteri', () => {
    pinta('mode=espai');
    expect(vi.mocked(useCercaGlobal)).toHaveBeenLastCalledWith({ q: '', tipus: 'tot' });
    expect(within(detall()).getByText('Què vols buscar?')).toBeTruthy();
    expect(within(detall()).getByText(/Escriu un nom o unes paraules/)).toBeTruthy();
    expect(within(screen.getByRole('complementary', { name: 'RESULTATS' })).getByText('Què vols buscar?')).toBeTruthy();
    expect(within(criteris()).queryByRole('button', { name: 'Tipus' })).toBeNull();
    /* La lupa és tancada fins que la persona l'obri. */
    expect(screen.queryByRole('searchbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cerca a Sóc de Poble' }));
    expect(lupa().value).toBe('');
  });

  test('mentre carrega sense cap resultat, «Buscant…»; amb resultats i fonts pendents, la llista i l’avís al detall', () => {
    estat.carregant = true;
    const vista = pinta('mode=espai&q=zzz');
    expect(screen.getAllByText('Buscant…').length).toBeGreaterThan(0);
    expect(titols()).toEqual([]);
    vista.unmount();
    pinta('mode=espai&q=festa');
    expect(titols()).toHaveLength(5);
    expect(within(detall()).getByText("Encara arriben resultats d'algunes fonts…")).toBeTruthy();
  });

  test('els trams de data compten el dia local amb l’horari de cada data: la mitjanit d’un dia d’estiu, mirada a l’hivern, cau al seu dia', () => {
    /* Rellotge i zona fixos, siga quina siga la de la màquina: el 2 de
       novembre a les 12:00 (CET), i una zona com la de València (UTC+2 a
       l'estiu, d'abril a octubre; UTC+1 a l'hivern). */
    const zona = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function desfas() {
      const mes = this.getUTCMonth();
      return mes >= 3 && mes <= 9 ? -120 : -60;
    });
    const rellotge = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-02T11:00:00Z'));
    try {
      /* La mitjanit local del 2 d'octubre (CEST) és l'1 a les 22:00 UTC, la
         marca que dona l'índex a «2026-10-02» en esta zona. El 2 de novembre,
         el 2 d'octubre és el primer dia de «Este mes»: amb el desfasament de
         l'hivern (o cap), cauria l'1 i quedaria fora. */
      ambEntrades([dePublicacio({ id: 'oct', title: 'Festa d’octubre', created_at: '2026-10-01T22:00:00.000Z' })]);
      pinta('mode=espai&q=festa');
      const nav = within(criteris());
      expect(nav.getByRole('button', { name: 'Este mes 1 resultat' })).toBeTruthy();
      expect(nav.getByRole('button', { name: 'Este any 1 resultat' })).toBeTruthy();
      expect(nav.queryByRole('button', { name: /^Esta setmana/ })).toBeNull();
    } finally {
      zona.mockRestore();
      rellotge.mockRestore();
    }
  });
});

describe('la consulta i l’URL', () => {
  test('la lupa escriu ?q= 250 ms després de l’última tecla, en replace; la llista no es filtra per subcadena entre tecles i el camp no es torna a muntar', async () => {
    pinta('mode=espai&q=festa');
    const camp = lupa();
    expect(camp.value).toBe('festa');
    fireEvent.change(camp, { target: { value: 'p' } });
    fireEvent.change(camp, { target: { value: 'pil' } });
    fireEvent.change(camp, { target: { value: 'pilota' } });
    /* Encara no (ni als 120 ms): ni URL, ni cerca nova, ni filtre propi de l'espai. */
    expect(url().get('q')).toBe('festa');
    expect(titols()).toEqual(ordreDe('festa'));
    await espera(120);
    expect(url().get('q')).toBe('festa');
    expect(titols()).toEqual(ordreDe('festa'));
    await espera(220);
    expect(url().get('q')).toBe('pilota');
    expect(url().get('mode')).toBe('espai');
    expect(escripturesDe('q')).toEqual([{ nous: { q: 'pilota' }, replace: true }]);
    expect(estat.historial).toHaveLength(1);
    expect(vi.mocked(useCercaGlobal)).toHaveBeenLastCalledWith({ q: 'pilota', tipus: 'tot' });
    expect(titols()).toEqual(['Festa de la pilota']);
    expect(lupa()).toBe(camp);
    expect(camp.value).toBe('pilota');
  });

  test('«Tancar» la lupa buida ?q= i torna a l’estat inicial', async () => {
    pinta('mode=espai&q=festa');
    fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
    await espera(320);
    expect(url().has('q')).toBe(false);
    expect(within(detall()).getByText('Què vols buscar?')).toBeTruthy();
    expect(titols()).toEqual([]);
  });

  test('l’Arrere cap a un altre ?q= torna a muntar l’espai amb aquella consulta', async () => {
    pinta('mode=espai&q=festa');
    fireEvent.click(fitxa('Festa de la pilota'));
    expect(estat.historial).toHaveLength(2);
    fireEvent.change(lupa(), { target: { value: 'concert' } });
    await espera(320);
    expect(url().get('q')).toBe('concert');
    expect(titols()).toEqual(['Concert de festa']);
    await enrere();
    expect(url().get('q')).toBe('festa');
    expect(lupa().value).toBe('festa');
    expect(titols()).toEqual(ordreDe('festa'));
    expect(within(detall()).getByText("Tria un resultat per a vore'l ací.")).toBeTruthy();
    /* Tornar a muntar no escriu res a l'URL. */
    await espera(320);
    expect(url().get('q')).toBe('festa');
    expect(estat.historial[0]).toBe('mode=espai&q=festa');
  });

  test('després de l’Arrere a un altre ?q=, tornar a escriure el text d’abans torna a arribar a l’URL', async () => {
    pinta('mode=espai&q=festa');
    fireEvent.click(fitxa('Festa de la pilota'));
    fireEvent.change(lupa(), { target: { value: 'concert' } });
    await espera(320);
    expect(url().get('q')).toBe('concert');
    await enrere();
    expect(lupa().value).toBe('festa');
    /* El mateix text que abans de l'Arrere: la lupa no el dona per escrit. */
    fireEvent.change(lupa(), { target: { value: 'concert' } });
    await espera(320);
    expect(url().get('q')).toBe('concert');
    expect(titols()).toEqual(['Concert de festa']);
  });
});

describe('els criteris', () => {
  test('un criteri filtra la llista i fa push de ?faceta=; «Tots els resultats» el lleva', () => {
    pinta('mode=espai&q=festa');
    const agenda = within(criteris()).getByRole('button', { name: 'Calendari 1 resultat' });
    fireEvent.click(agenda);
    expect(titols()).toEqual(['Concert de festa']);
    expect(url().get('faceta')).toBe('tipus:calendari');
    expect(estat.historial).toHaveLength(2);
    expect(agenda.getAttribute('aria-current')).toBe('page');
    /* Triar un criteri no obri cap resultat per la persona. */
    expect(url().has('resultat')).toBe(false);
    expect(within(detall()).getByText("Tria un resultat per a vore'l ací.")).toBeTruthy();
    fireEvent.click(within(criteris()).getByRole('button', { name: 'Benifallim 2 resultats' }));
    expect(titols()).toEqual(ordreDe('festa').filter((titol) => ['Festa major de Benifallim', 'Pepa Festa'].includes(titol)));
    expect(url().get('faceta')).toBe('poble:benifallim');
    fireEvent.click(within(criteris()).getByRole('button', { name: 'Abans 2 resultats' }));
    expect([...titols()].sort()).toEqual(['Festa de la pilota', 'Llista de la festa']);
    fireEvent.click(within(criteris()).getByRole('button', { name: 'Tots els resultats' }));
    expect(titols()).toEqual(ordreDe('festa'));
    expect(url().has('faceta')).toBe(false);
    expect(estat.historial).toHaveLength(5);
  });

  test('l’Arrere després de triar un criteri torna a «Tots els resultats» i a la llista sencera', async () => {
    pinta('mode=espai&q=festa');
    fireEvent.click(within(criteris()).getByRole('button', { name: 'Calendari 1 resultat' }));
    expect(titols()).toEqual(['Concert de festa']);
    await enrere();
    expect(url().has('faceta')).toBe(false);
    expect(titols()).toEqual(ordreDe('festa'));
    expect(within(criteris()).getByRole('button', { name: 'Tots els resultats' }).getAttribute('aria-pressed')).toBe('true');
  });

  test('un ?faceta= de més de 160 caràcters, o un poble que no és un slug, mostra «Tots els resultats» i no escriu res', () => {
    const vista = pinta(`mode=espai&q=festa&faceta=${encodeURIComponent(`poble:${'a'.repeat(200)}`)}`);
    expect(within(criteris()).getByRole('button', { name: 'Tots els resultats' }).getAttribute('aria-pressed')).toBe('true');
    expect(titols()).toHaveLength(5);
    vista.unmount();
    pinta('mode=espai&q=festa&faceta=poble%3ABenifallim');
    expect(within(criteris()).getByRole('button', { name: 'Tots els resultats' }).getAttribute('aria-pressed')).toBe('true');
    expect(titols()).toHaveLength(5);
    expect(estat.escriptures).toEqual([]);
  });

  test('el criteri actiu es queda, amb recompte 0, quan la consulta nova no en porta cap resultat (l’espai no salta a un altre)', async () => {
    pinta('mode=espai&q=festa&faceta=poble%3Abenifallim');
    expect(within(criteris()).getByRole('button', { name: 'Benifallim 2 resultats' }).getAttribute('aria-current')).toBe('page');
    fireEvent.change(lupa(), { target: { value: 'concert' } });
    await espera(320);
    expect(url().get('q')).toBe('concert');
    expect(url().get('faceta')).toBe('poble:benifallim');
    expect(escripturesDe('faceta')).toEqual([]);
    const benifallim = within(criteris()).getByRole('button', { name: 'Benifallim' });
    expect(benifallim.getAttribute('aria-current')).toBe('page');
    expect(within(criteris()).getByRole('button', { name: 'Calendari 1 resultat' }).getAttribute('aria-current')).toBeNull();
    expect(titols()).toEqual([]);
    expect(within(screen.getByRole('complementary', { name: 'RESULTATS' })).getByText('Cap resultat per a «concert»')).toBeTruthy();
  });

  test('un criteri de l’URL que no és cap criteri mostra «Tots els resultats»; un de vàlid sense resultats es pinta al seu lloc', () => {
    const vista = pinta('mode=espai&q=festa&faceta=tipus%3Azzz');
    expect(within(criteris()).getByRole('button', { name: 'Tots els resultats' }).getAttribute('aria-pressed')).toBe('true');
    expect(titols()).toHaveLength(5);
    vista.unmount();
    /* Un poble d'un enllaç que cap resultat no porta: el nom, del seu slug. */
    const altra = pinta('mode=espai&q=festa&faceta=poble%3Ala-vall-d-alcala');
    expect(within(criteris()).getByRole('button', { name: 'la vall d alcala' }).getAttribute('aria-current')).toBe('page');
    expect(within(criteris()).getByRole('button', { name: 'Tots els resultats' }).getAttribute('aria-pressed')).toBe('false');
    altra.unmount();
    pinta('mode=espai&q=festa&faceta=tipus%3Amercat');
    /* Al seu lloc de TIPUS_CERCA: entre les Publicacions i el Calendari (G3-pedra-seca-i18n-16: els actes són del Calendari, darrere del Mercat). */
    const noms = [...criteris().querySelectorAll('.sdp-workspace-nav-item__label')].map((node) => node.textContent);
    expect(noms.slice(noms.indexOf('Tipus') + 1, noms.indexOf('Pobles'))).toEqual(['Persones', 'Publicacions', 'Mercat', 'Calendari', 'Notes']);
    expect(within(criteris()).getByRole('button', { name: 'Mercat' }).getAttribute('aria-current')).toBe('page');
    expect(titols()).toEqual([]);
  });
});

describe('IDEA-61 · l’Estat de les fitxes d’àmbit', () => {
  const etiquetesDeNavegacio = () => [...criteris().querySelectorAll('.sdp-workspace-nav-item__label')].map((node) => node.textContent);

  test('els criteris porten Estat, entre Tipus i Pobles, amb el recompte de cada estat; un estat filtra la llista i fa push de ?faceta=', () => {
    ambEntrades(AMB_COTXES);
    pinta('mode=espai&q=cotxe');
    const nav = within(criteris());
    for (const grup of ['Tipus', 'Estat', 'Pobles', 'Data']) expect(nav.getByRole('button', { name: grup }).getAttribute('aria-expanded')).toBe('true');
    const noms = etiquetesDeNavegacio();
    const posicions = ['Tipus', 'Estat', 'Pobles', 'Data'].map((nom) => noms.indexOf(nom));
    expect(posicions.every((posicio, i) => posicio >= 0 && (i === 0 || posicio > posicions[i - 1]))).toBe(true);
    expect(noms.slice(noms.indexOf('Estat') + 1, noms.indexOf('Pobles'))).toEqual(['Disponible', 'Reservat']);
    for (const opcio of ['Compartir cotxe 2 resultats', 'Disponible 1 resultat', 'Reservat 1 resultat', 'Benifallim 1 resultat']) {
      expect(nav.getByRole('button', { name: opcio })).toBeTruthy();
    }
    expect(titols()).toHaveLength(2);
    const reservat = nav.getByRole('button', { name: 'Reservat 1 resultat' });
    fireEvent.click(reservat);
    expect(titols()).toEqual(['Cotxe a Xixona']);
    expect(url().get('faceta')).toBe('estat:reservat');
    expect(estat.historial).toHaveLength(2);
    expect(reservat.getAttribute('aria-current')).toBe('page');
    /* El detall d'una fitxa obri la seua vertical: /vehicle/<id>. */
    fireEvent.click(fitxa('Cotxe a Xixona'));
    expect(url().get('resultat')).toBe(V2.clau);
    expect(within(detall()).getByRole('link', { name: 'Obri' }).getAttribute('href')).toBe('/vehicle/v2');
    fireEvent.click(within(criteris()).getByRole('button', { name: 'Tots els resultats' }));
    expect(titols()).toHaveLength(2);
    expect(url().has('faceta')).toBe(false);
  });

  test('sense cap fitxa d’àmbit entre els resultats no hi ha cap grup Estat', () => {
    ambEntrades(AMB_COTXES);
    pinta('mode=espai&q=festa');
    expect(within(criteris()).queryByRole('button', { name: 'Estat' })).toBeNull();
    expect(titols()).toEqual(ordreDe('festa'));
  });

  test('?faceta=estat:… de l’URL filtra des del primer pintat; un estat que no ho és mostra «Tots els resultats»; un de vàlid sense resultats es pinta al seu lloc', () => {
    ambEntrades(AMB_COTXES);
    const vista = pinta('mode=espai&q=cotxe&faceta=estat%3Adisponible');
    expect(within(criteris()).getByRole('button', { name: 'Disponible 1 resultat' }).getAttribute('aria-current')).toBe('page');
    expect(titols()).toEqual(['Cotxe a Alcoi dilluns']);
    expect(estat.escriptures).toEqual([]);
    vista.unmount();
    const altra = pinta('mode=espai&q=cotxe&faceta=estat%3Avenut');
    expect(within(criteris()).getByRole('button', { name: 'Tots els resultats' }).getAttribute('aria-pressed')).toBe('true');
    expect(titols()).toHaveLength(2);
    altra.unmount();
    /* «festa» no troba cap fitxa d'àmbit: el criteri es queda, amb recompte 0, al seu lloc (davant de Pobles). */
    pinta('mode=espai&q=festa&faceta=estat%3Atancat');
    expect(within(criteris()).getByRole('button', { name: 'Tancat' }).getAttribute('aria-current')).toBe('page');
    const noms = etiquetesDeNavegacio();
    expect(noms.slice(noms.indexOf('Estat') + 1, noms.indexOf('Pobles'))).toEqual(['Tancat']);
    expect(titols()).toEqual([]);
  });
});

describe('el detall', () => {
  test('triar un resultat el pinta amb el títol enllaçat i ressaltat, la meta i «Obri», i fa push de ?resultat=', () => {
    pinta('mode=espai&q=festa');
    fireEvent.click(fitxa('Festa major de Benifallim'));
    expect(url().get('resultat')).toBe(P1.clau);
    expect(estat.historial).toHaveLength(2);
    const cos = within(detall());
    const titol = cos.getByRole('heading', { level: 2, name: 'Festa major de Benifallim' });
    expect(within(titol).getByRole('link').getAttribute('href')).toBe(P1.href);
    expect([...titol.querySelectorAll('mark')].map((marca) => marca.textContent)).toEqual(['Festa']);
    expect(cos.getByText('Benifallim')).toBeTruthy();
    expect(cos.getByRole('link', { name: 'Obri' }).getAttribute('href')).toBe(P1.href);
    expect(cos.queryByText("Tria un resultat per a vore'l ací.")).toBeNull();
    /* Tornar a triar el mateix resultat no fa cap entrada nova a l'historial. */
    fireEvent.click(fitxa('Festa major de Benifallim'));
    expect(estat.historial).toHaveLength(2);
    /* En ample, cap fletxa ←: la llista és al costat. */
    expect(cos.queryByRole('button', { name: 'Tornar a la llista' })).toBeNull();
    /* Una nota és privada: ho diu, com a /cerca. */
    fireEvent.click(fitxa('Llista de la festa'));
    expect(within(detall()).getByText('Privada: només la veus tu')).toBeTruthy();
    expect(url().get('resultat')).toBe(N1.clau);
  });

  test('un enllaç amb ?resultat= l’obri; «Escriu-li» hi és quan l’entrada el porta; l’Arrere el tanca', async () => {
    pinta(`mode=espai&q=ferrer&resultat=${encodeURIComponent(MEMBRE.clau)}`);
    const cos = within(detall());
    expect(cos.getByRole('heading', { level: 2, name: 'Javi Ferrer' })).toBeTruthy();
    expect(cos.getByRole('link', { name: 'Escriu-li a Javi Ferrer' }).getAttribute('href')).toBe(MEMBRE.accio.href);
    estat.historial = ['mode=espai&q=ferrer', estat.historial[0]];
    estat.posicio = 1;
    await enrere();
    expect(url().has('resultat')).toBe(false);
    expect(within(detall()).getByText("Tria un resultat per a vore'l ací.")).toBeTruthy();
  });

  test('una consulta nova que ja no porta el resultat obert el conserva a l’URL i el detall demana triar', async () => {
    pinta('mode=espai&q=festa');
    fireEvent.click(fitxa('Festa de la pilota'));
    fireEvent.change(lupa(), { target: { value: 'concert' } });
    await espera(320);
    expect(url().get('resultat')).toBe(P2.clau);
    expect(await within(detall()).findByText("Tria un resultat per a vore'l ací.")).toBeTruthy();
    expect(within(detall()).queryByText('L’element no és accessible o ja no existix.')).toBeNull();
  });

  test('les fonts que fallen avisen damunt del detall, amb «Torna-ho a provar»', () => {
    const reintenta = vi.fn();
    estat.errors = [{ id: 'mur', etiqueta: "el Mur, l'agenda i el mercat", error: 'No ha respost a temps.', reintenta }];
    pinta('mode=espai&q=festa');
    const cos = within(detall());
    expect(cos.getByText("No s'ha pogut buscar en el Mur, l'agenda i el mercat")).toBeTruthy();
    fireEvent.click(cos.getByRole('button', { name: 'Torna-ho a provar' }));
    expect(reintenta).toHaveBeenCalledTimes(1);
  });

  test('sense sessió, el detall ho avisa amb l’enllaç per a entrar, que torna a l’espai', () => {
    estat.senseSessio = true;
    pinta('mode=espai&q=festa');
    const cos = within(detall());
    expect(cos.getByText('Sense entrar, la cerca no veu la gent registrada al poble.')).toBeTruthy();
    const entra = cos.getByRole('link', { name: 'Entra per a buscar gent del teu poble' });
    expect(new URL(entra.getAttribute('href'), 'http://x').searchParams.get('tornar')).toBe('/cerca?mode=espai&q=festa');
  });

  test('sense sessió i sense consulta, cap avís damunt: «Entra» només és a l’estat inicial i torna a l’espai', () => {
    estat.senseSessio = true;
    pinta('mode=espai');
    const cos = within(detall());
    expect(cos.queryByText('Sense entrar, la cerca no veu la gent registrada al poble.')).toBeNull();
    const entra = cos.getAllByRole('link', { name: 'Entra per a buscar gent del teu poble' });
    expect(entra).toHaveLength(1);
    expect(new URL(entra[0].getAttribute('href'), 'http://x').searchParams.get('tornar')).toBe('/cerca?mode=espai');
  });

  test('un href insegur no fa cap enllaç: ni «Obri» ni el títol', () => {
    const insegura = { ...P1, clau: 'publicacions:insegura', id: 'insegura', titol: 'Festa insegura', href: 'javascript:alert(1)' };
    ambEntrades([...ENTRADES, insegura]);
    pinta(`mode=espai&q=festa&resultat=${encodeURIComponent(insegura.clau)}`);
    const cos = within(detall());
    expect(cos.getByRole('heading', { level: 2, name: 'Festa insegura' })).toBeTruthy();
    expect(cos.queryByRole('link', { name: 'Obri' })).toBeNull();
    expect(detall().querySelector('a[href^="javascript"]')).toBeNull();
  });

  test('en estret, el detall obert porta la fletxa ← que torna a la llista', () => {
    amplada = 375;
    pinta(`mode=espai&q=festa&resultat=${encodeURIComponent(A1.clau)}`);
    const fletxa = within(detall()).getByRole('button', { name: 'Tornar a la llista' });
    expect(within(detall()).getByRole('heading', { level: 2, name: 'Concert de festa' })).toBeTruthy();
    fireEvent.click(fletxa);
    expect(within(detall()).queryByRole('button', { name: 'Tornar a la llista' })).toBeNull();
  });
});

describe('les llengües', () => {
  test('en castellà, les columnes, els grups, els trams i els recomptes de l’espai es tradueixen', () => {
    estat.t = createTranslator('es');
    pinta('mode=espai&q=festa');
    const nav = within(screen.getByRole('complementary', { name: 'CRITERIOS' }));
    expect(screen.getByRole('complementary', { name: 'RESULTADOS' })).toBeTruthy();
    for (const nom of ['Tipo', 'Pueblos', 'Fecha', 'Todos los resultados', 'Hoy 1 resultado', 'Próximamente 1 resultado',
      'Antes 2 resultados', 'Este año 1 resultado']) {
      expect(nav.getByRole('button', { name: nom })).toBeTruthy();
    }
    expect(within(detall()).getByText('Elige un resultado para verlo aquí.')).toBeTruthy();
    fireEvent.click(fitxa('Concert de festa'));
    expect(within(detall()).getByRole('link', { name: 'Abrir' })).toBeTruthy();
  });

  /* IDEA-61 (T0, prompt 261102_1532) · El grup Estat, els seus estats i la
     vertical del Tipus ixen en castellà (es.js: Estado, Disponible, Reservado,
     Compartir coche); l'URL conserva l'id de l'estat, mai la traducció. */
  test('en castellà, el grup Estado, els seus estats i «Compartir coche» al Tipo es tradueixen; ?faceta= porta l’id', () => {
    estat.t = createTranslator('es');
    ambEntrades(AMB_COTXES);
    pinta('mode=espai&q=cotxe');
    const columna = screen.getByRole('complementary', { name: 'CRITERIOS' });
    const nav = within(columna);
    for (const nom of ['Tipo', 'Estado', 'Pueblos', 'Fecha', 'Compartir coche 2 resultados', 'Disponible 1 resultado', 'Reservado 1 resultado']) {
      expect(nav.getByRole('button', { name: nom })).toBeTruthy();
    }
    /* Cap etiqueta en la llengua de la reserva. */
    for (const nom of ['Estat', 'Reservat 1 resultat', 'Compartir cotxe 2 resultats']) expect(nav.queryByRole('button', { name: nom })).toBeNull();
    const noms = [...columna.querySelectorAll('.sdp-workspace-nav-item__label')].map((node) => node.textContent);
    expect(noms.slice(noms.indexOf('Estado') + 1, noms.indexOf('Pueblos'))).toEqual(['Disponible', 'Reservado']);
    fireEvent.click(nav.getByRole('button', { name: 'Reservado 1 resultado' }));
    expect(titols()).toEqual(['Cotxe a Xixona']);
    expect(url().get('faceta')).toBe('estat:reservat');
  });

  test('en castellà, a la /cerca de sempre les pastilles i el grup de la vista Tot diuen «Compartir coche», «Trabajo» i «Vivienda»', () => {
    estat.t = createTranslator('es');
    ambEntrades(AMB_COTXES);
    estat.historial = ['q=cotxe'];
    render(<SearchSection />);
    for (const nom of ['Compartir coche 2', 'Trabajo 0', 'Vivienda 0', 'Mercado 0']) {
      expect(screen.getByRole('button', { name: nom })).toBeTruthy();
    }
    expect(screen.queryByRole('button', { name: 'Compartir cotxe 2' })).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Compartir coche (2)' })).toBeTruthy();
  });
});

describe('/cerca: l’embolcall', () => {
  test('sense ?mode=espai, la /cerca de sempre; amb ?mode=espai, l’espai, carregat a part', async () => {
    estat.historial = ['q=festa'];
    const vista = render(<SearchSection />);
    expect(screen.getByRole('search', { name: 'Cerca a Sóc de Poble' })).toBeTruthy();
    expect(document.querySelector('.sdp-workspace')).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'CRITERIS' })).toBeNull();
    vista.unmount();
    estat.historial = ['mode=espai&q=festa'];
    render(<SearchSection />);
    expect(await screen.findByRole('complementary', { name: 'CRITERIS' })).toBeTruthy();
    expect(screen.queryByRole('search')).toBeNull();
    expect(titols()).toEqual(ordreDe('festa'));
  });

  test('només ?mode=espai, exacte, obri l’espai: un altre valor és la /cerca de sempre', () => {
    for (const mode of ['Espai', 'espais']) {
      estat.historial = [`mode=${mode}&q=festa`];
      const vista = render(<SearchSection />);
      expect(screen.getByRole('search', { name: 'Cerca a Sóc de Poble' })).toBeTruthy();
      expect(document.querySelector('.sdp-workspace')).toBeNull();
      vista.unmount();
    }
  });
});
