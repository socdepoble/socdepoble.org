/* Salut · l'app sencera dins de la plataforma (jsdom): la guarda d'ama del
   document, la porta de l'avís, apuntar una micció en dos tocs i veure-la a
   la línia del temps, el flux ABC amb ?pas= a l'URL, l'exportació (el nom
   escrit no es desa) i «Esborra-ho tot», que demana l'àlies. Dades sintètiques
   en un magatzem en memòria. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { _reiniciaTelemetria, darrersEnviaments, declaraEncastada, registraVisita } from '../../data/telemetria.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from '../plataforma/preferenciesApps.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestSalut from './manifest.js';
import AppSalut from './AppSalut.jsx';
import { carregaTot, creaMagatzemSalut, desaMeta } from './magatzem.js';
import { textError } from './textos.js';
import { creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA = new Date(2026, 9, 5, 9, 30);
let magatzem;
let n;

function registreAmb(carrega) {
  return creaRegistre({ internes: [{ ...manifestSalut, carrega }] });
}

function munta(url, { entorn = ENTORN, ara = ARA } = {}) {
  const App = () => (
    <AppSalut magatzem={magatzem} rellotge={() => ara} ofsetDe={() => 120}
      nouId={() => { n += 1; return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`; }} />
  );
  const carrega = vi.fn(() => Promise.resolve({ default: App }));
  muntaPlataforma(url, { registre: registreAmb(carrega), entorn });
  return carrega;
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const acceptaAvis = () => desaMeta(magatzem, 'avis', { acceptatA: '2026-10-01T08:00:00.000Z', versio: 1 });

beforeEach(() => {
  n = 0;
  window.localStorage.clear();
  _reiniciaPreferencies();
  magatzem = creaMagatzemSalut({ idb: null, navegador: null, Canal: null });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('les guardes', () => {
  test('fora del document propi (encastada) no es carrega: un avís i res més', async () => {
    const carrega = munta('/app/salut/diari', { entorn: { ...ENTORN, amaDelDocument: false } });
    expect(await screen.findByText('Esta app no es pot obrir ací')).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
  });

  test('la porta de l’avís: fins que no s’accepta, només l’avís; acceptar porta a Avui', async () => {
    munta('/app/salut/diari');
    expect(await screen.findByRole('button', { name: 'Ho he entés' })).toBeTruthy();
    expect(ubicacio()).toBe('/app/salut/avis');
    expect(screen.getByText(/No és un producte sanitari/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ho he entés' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari'));
    expect((await carregaTot(magatzem)).avis).toEqual({ acceptatA: ARA.toISOString(), versio: 1 });
    expect(await screen.findByRole('button', { name: 'Ha orinat' })).toBeTruthy();
  });

  test('un paràmetre que no és una data no obri res', async () => {
    await acceptaAvis();
    munta('/app/salut/dies/2026-02-30');
    expect(await screen.findByText('Esta pàgina de l’app no existix')).toBeTruthy();
  });
});

describe('apuntar', () => {
  test('una micció en dos tocs, i es veu a la línia del temps d’avui', async () => {
    await acceptaAvis();
    munta('/app/salut/diari');
    fireEvent.click(await screen.findByRole('button', { name: 'Ha orinat' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=miccio'));
    fireEvent.click(await screen.findByRole('button', { name: 'Desa' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari'));
    expect(await screen.findByText('Ha orinat · sense mesurar, a les 09:30.')).toBeTruthy();
    const linia = await screen.findByRole('list', { name: /Apunts de / });
    expect(within(linia).getByRole('link', { name: /09:30:.*Ha orinat · sense mesurar/ }).getAttribute('href'))
      .toBe('/app/salut/dies/2026-10-05/00000000-0000-4000-8000-000000000001');
    const { apunts } = await carregaTot(magatzem);
    expect(apunts).toHaveLength(1);
    expect(apunts[0]).toMatchObject({ tipus: 'miccio', moment: '2026-10-05T09:30', ofsetMin: -ARA.getTimezoneOffset(), mesura: 'no-mesurat', jornada: '2026-10-05' });
  });

  test('escriure un volum el marca com a mesurat', async () => {
    await acceptaAvis();
    munta('/app/salut/diari?nou=miccio');
    fireEvent.change(await screen.findByRole('textbox', { name: 'Quant (ml)' }), { target: { value: '250' } });
    expect(screen.getByRole('radio', { name: 'Mesurat' }).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Desa' }));
    await waitFor(async () => expect((await carregaTot(magatzem)).apunts[0]?.volumMl).toBe(250));
  });

  test('conducta: el registre ABC en tres passos, amb ?pas= a l’URL', async () => {
    await acceptaAvis();
    munta('/app/salut/diari');
    fireEvent.click(await screen.findByRole('button', { name: 'Conducta' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta'));
    expect(screen.getByText('Pas 1 de 3 · Què ha fet')).toBeTruthy();
    /* Sense dir què ha fet no es passa al pas següent. */
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    expect(await screen.findByText('Falta «Què ha fet».')).toBeTruthy();
    expect(ubicacio()).toBe('/app/salut/diari?nou=conducta');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cridar' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Moderat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta&pas=b'));
    expect(screen.getByText('Pas 2 de 3 · Què passava abans')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ganes d’orinar o de fer de ventre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta&pas=c'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Acompanyar-lo al vàter' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Es calma prompte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desa' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari'));
    const [apunt] = (await carregaTot(magatzem)).apunts;
    expect(apunt).toMatchObject({ tipus: 'conducta', conductes: ['cridar'], intensitat: 2, antecedents: ['ganes-vater'], accions: ['acompanyar-vater'], resultat: 'es-calma-prompte' });
  });
});

/* SAL-09 · Clàusula dels Slugs: arrere recorre seccions. Desar no deixa
   entrades repetides a l'historial ni un formulari buit darrere. Abans de
   muntar s'empeny una entrada perquè «arrere» tinga on anar (fora de l'app). */
describe('l’historial després de desar', () => {
  const ambEntradaAbans = () => window.history.pushState(null, '', '/abans');
  const arrere = () => act(async () => {
    window.history.back();
    await new Promise((resolve) => { window.addEventListener('popstate', resolve, { once: true }); });
  });

  test('una micció: desar torna a la botonera i arrere ix de l’app, no reobri el formulari', async () => {
    await acceptaAvis();
    ambEntradaAbans();
    munta('/app/salut/diari');
    fireEvent.click(await screen.findByRole('button', { name: 'Ha orinat' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=miccio'));
    fireEvent.click(await screen.findByRole('button', { name: 'Desa' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari'));
    expect(await screen.findByText('Ha orinat · sense mesurar, a les 09:30.')).toBeTruthy();
    await arrere();
    await waitFor(() => expect(ubicacio()).toBe('/'));
  });

  test('una conducta en tres passos: desar no deixa el «Pas 2 de 3» buit darrere', async () => {
    await acceptaAvis();
    ambEntradaAbans();
    munta('/app/salut/diari');
    fireEvent.click(await screen.findByRole('button', { name: 'Conducta' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cridar' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Moderat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta&pas=b'));
    /* Arrere del navegador entre passos: torna al pas d'abans amb el que s'havia escrit. */
    await arrere();
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta'));
    expect(screen.getByRole('checkbox', { name: 'Cridar' }).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta&pas=b'));
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?nou=conducta&pas=c'));
    fireEvent.click(screen.getByRole('radio', { name: 'Es calma prompte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desa' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari'));
    expect((await carregaTot(magatzem)).apunts).toHaveLength(1);
    await arrere();
    await waitFor(() => expect(ubicacio()).toBe('/'));
  });

  test('cancel·lar també torna on era abans d’obrir el formulari', async () => {
    await acceptaAvis();
    ambEntradaAbans();
    munta('/app/salut/diari?mode=nit');
    fireEvent.click(await screen.findByRole('button', { name: 'Ha orinat' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?mode=nit&nou=miccio'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari?mode=nit'));
    await arrere();
    await waitFor(() => expect(ubicacio()).toBe('/'));
  });

  test('un formulari obert per un enllaç (sense història pròpia) es tanca amb replace, com abans', async () => {
    await acceptaAvis();
    munta('/app/salut/diari?nou=miccio');
    fireEvent.click(await screen.findByRole('button', { name: 'Desa' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/diari'));
    expect((await carregaTot(magatzem)).apunts).toHaveLength(1);
  });

  test('corregir un apunt: desar empeny el dia, i arrere torna a l’apunt corregit, no al mateix dia', async () => {
    await acceptaAvis();
    const id = '00000000-0000-4000-8000-000000000099';
    await magatzem.desa('apunts', { id, tipus: 'miccio', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', mesura: 'no-mesurat', lloc: 'vater' });
    munta('/app/salut/dies/2026-10-05');
    const linia = await screen.findByRole('list', { name: /Apunts de / });
    fireEvent.click(within(linia).getByRole('link', { name: /08:00/ }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/salut/dies/2026-10-05/${id}`));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Quant (ml)' }), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desa' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/dies/2026-10-05'));
    await arrere();
    await waitFor(() => expect(ubicacio()).toBe(`/app/salut/dies/2026-10-05/${id}`));
    expect(screen.getByRole('textbox', { name: 'Quant (ml)' }).value).toBe('250');
  });
});

describe('pantalla estreta i mode nit', () => {
  test('en un mòbil, Avui obri la botonera; «Estat» obri el panell i «Torna» hi torna', async () => {
    await acceptaAvis();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    munta('/app/salut/diari');
    await screen.findByRole('button', { name: 'Ha orinat' });
    const closca = () => document.querySelector('.app-grid-shell');
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(closca().dataset.panell).toBe('');
    fireEvent.click(within(document.getElementById('app-grid-main')).getByRole('button', { name: 'Estat' }));
    await waitFor(() => expect(closca().dataset.panell).toBe('left'));
    fireEvent.click(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Torna' }));
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
  });

  /* SAL-02: en estret, una ruta «mig» no ensenya mai el detall. Marcar la
     jornada com a completa i començar el diari han de tindre camí des del mig. */
  const closca = () => document.querySelector('.app-grid-shell');
  const detall = () => within(document.getElementById('app-grid-main'));

  test('en un mòbil es pot marcar el dia com a complet des de la línia del temps', async () => {
    await acceptaAvis();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    munta('/app/salut/dies/2026-10-05');
    await screen.findByText('Encara no hi ha cap apunt en esta jornada.');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    /* La línia del temps tapa el detall: sense l'enllaç, l'interruptor no és abastable. */
    expect(screen.queryByRole('switch', { name: 'He apuntat tot el dia' })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Resum del dia' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/dies/2026-10-05/resum'));
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    fireEvent.click(detall().getByRole('switch', { name: 'He apuntat tot el dia' }));
    await waitFor(async () => expect((await carregaTot(magatzem)).jornades).toEqual([{ data: '2026-10-05', completa: true }]));
  });

  test('en un mòbil es pot començar el diari de 3 dies des de la llista de dies', async () => {
    await acceptaAvis();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    munta('/app/salut/dies');
    fireEvent.click(await screen.findByRole('link', { name: 'Diari de 3 dies' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/dies/periodes'));
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    fireEvent.click(detall().getByRole('button', { name: 'Comença un diari de 3 dies' }));
    await waitFor(async () => expect((await carregaTot(magatzem)).periodes).toMatchObject([{ inici: '2026-10-05', dies: 3, estat: 'en-curs' }]));
  });

  test.each([
    ['/app/salut/resum?des=2026-10-03&dies=3', 'Mesures del període', '/app/salut/resum/mesures?des=2026-10-03&dies=3', 'Mitjana de 0 jornades completes de 3.'],
    ['/app/salut/agitacio', 'Patrons', '/app/salut/agitacio/patrons', 'Encara no hi ha episodis']
  ])('en un mòbil, %s porta al detall amb «%s»', async (url, enllac, desti, text) => {
    await acceptaAvis();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    munta(url);
    fireEvent.click(await screen.findByRole('link', { name: enllac }));
    await waitFor(() => expect(ubicacio()).toBe(desti));
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(detall().getByText(text)).toBeTruthy();
  });

  /* Llei del Píxel: en ample (i en mitja) el detall ja es veu; el mig queda igual que abans. */
  test.each([
    ['/app/salut/dies/2026-10-05', 'Resum del dia', ['Dia anterior']],
    ['/app/salut/dies', 'Diari de 3 dies', null],
    ['/app/salut/resum', 'Mesures del període', null],
    ['/app/salut/agitacio', 'Patrons', ['Apunta’n un', 'Valoració setmanal']]
  ])('en ample, %s no porta l’enllaç «%s» ni cap franja d’eines nova', async (url, enllac, eines) => {
    await acceptaAvis();
    munta(url);
    const mig = await waitFor(() => {
      const columna = document.getElementById('app-grid-list');
      expect(columna.querySelector('.sdp-marc-columna__cos')).toBeTruthy();
      return columna;
    });
    expect(screen.queryByRole('link', { name: enllac })).toBeNull();
    const franja = mig.querySelector('.sdp-marc-columna__eines');
    if (eines === null) expect(franja).toBeNull();
    else expect([...franja.querySelectorAll('a')].map((a) => a.textContent)).toEqual(eines);
  });

  test('de nit, només els tres botons de la nit', async () => {
    await acceptaAvis();
    munta('/app/salut/diari?mode=nit');
    const graella = await screen.findByRole('list', { name: 'Què vols apuntar' });
    expect(within(graella).getAllByRole('button').map((boto) => boto.textContent)).toEqual(['Ha orinat', 'Absorbent', 'Es desperta']);
  });
});

describe('telemetria', () => {
  test.each([
    '/app/salut/dies/2026-10-02',
    '/app/salut/dies/2026-10-02/00000000-0000-4000-8000-000000000001',
    '/app/salut/full?des=2026-10-02&dies=3'
  ])('%s viatja com a /app/*, sense dates ni ids', (ruta) => {
    _reiniciaTelemetria();
    declaraEncastada(false);
    registraVisita(ruta);
    const [intent] = darrersEnviaments();
    expect(intent.url).toBe('/app/*');
    const resta = { ...intent };
    delete resta.moment;
    expect(JSON.stringify(resta)).not.toMatch(/salut|dies|full|2026|0000/);
    _reiniciaTelemetria();
  });
});

describe('el full i les dades', () => {
  test('exportar: el nom escrit va a la capçalera, no al nom del fitxer ni al dispositiu', async () => {
    await acceptaAvis();
    await magatzem.desa('apunts', { id: '00000000-0000-4000-8000-000000000099', tipus: 'miccio', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', mesura: 'no-mesurat', lloc: 'vater' });
    const blobs = [];
    const descarregues = [];
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: (blob) => { blobs.push(blob); return 'blob:prova'; }, revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function enregistra() { descarregues.push(this.download); });
    munta('/app/salut/full?des=2026-10-05&dies=1');
    fireEvent.click(await screen.findByRole('button', { name: 'Exporta' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Exportar el full per al metge' });
    fireEvent.click(within(dialeg).getByRole('radio', { name: /Text separat \(CSV\)/ }));
    fireEvent.click(within(dialeg).getByRole('checkbox', { name: /Afig un nom a la capçalera/ }));
    fireEvent.change(within(dialeg).getByRole('textbox', { name: 'Nom per a la capçalera' }), { target: { value: 'Nom Sintètic' } });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Descarrega' }));
    await waitFor(() => expect(descarregues).toEqual(['diari_2026-10-05_1d.csv']));
    const text = await blobs[0].text();
    expect(text).toContain('Data;Hora;Dia o nit');
    /* El CSV només porta el diari; el nom va a l'XLSX, però mai es desa. */
    const desat = JSON.stringify(await magatzem.bolca());
    expect(desat).not.toContain('Nom Sintètic');
    fireEvent.click(within(dialeg).getByRole('radio', { name: /Full de càlcul/ }));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Descarrega' }));
    await waitFor(() => expect(descarregues).toHaveLength(2));
    expect(descarregues[1]).toBe('diari_2026-10-05_1d.xlsx');
    const bytes = new TextDecoder().decode(new Uint8Array(await blobs[1].arrayBuffer()));
    expect(bytes).toContain('Persona: Nom Sintètic');
    expect(JSON.stringify(await magatzem.bolca())).not.toContain('Nom Sintètic');
  });

  /* SAL-04: l'àlies es veu a la pantalla del dispositiu, però no viatja al fitxer si no s'escriu un nom. */
  test('exportar sense nom: la capçalera del fitxer és neutra, encara que la pantalla porte l’àlies', async () => {
    await acceptaAvis();
    await desaMeta(magatzem, 'persona', { alias: 'el iaio' });
    const blobs = [];
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: (blob) => { blobs.push(blob); return 'blob:prova'; }, revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    munta('/app/salut/full?des=2026-10-05&dies=1');
    expect(await screen.findByText('Persona: el iaio')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Exporta' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Exportar el full per al metge' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Descarrega' }));
    await waitFor(() => expect(blobs).toHaveLength(1));
    const bytes = new TextDecoder().decode(new Uint8Array(await blobs[0].arrayBuffer()));
    expect(bytes).toContain('Persona: la persona');
    expect(bytes).not.toContain('el iaio');
  });

  /* SAL-08: un període importat de 10 dies («Obri el full» porta ?dies=10): el
     selector ha de dir el mateix que el full que es calcula. */
  test('un enllaç amb dies=10 calcula 10 dies i el selector diu 10', async () => {
    await acceptaAvis();
    munta('/app/salut/full?des=2026-09-26&dies=10');
    expect(await screen.findByText('Període: 26/09/2026 – 05/10/2026 (10 dies)')).toBeTruthy();
    const selector = screen.getByRole('combobox', { name: 'Dies' });
    expect(selector.value).toBe('10');
    expect(within(selector).getAllByRole('option').map((opcio) => opcio.value)).toEqual(['1', '2', '3', '4', '5', '6', '7', '10', '14']);
    fireEvent.change(selector, { target: { value: '7' } });
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/full?des=2026-09-26&dies=7'));
    expect(within(screen.getByRole('combobox', { name: 'Dies' })).getAllByRole('option')).toHaveLength(8);
  });

  /* SAL-06: fer una còpia només llig. En una pestanya que només mira, es descarrega igual. */
  test('en una pestanya de només lectura, «Descarrega una còpia» descarrega', async () => {
    const locks = creaLocksFals();
    const altra = creaMagatzemSalut({ idb: null, navegador: { locks }, Canal: null });
    expect(await altra.obtinBloqueig()).toBe('escriptora');
    magatzem = creaMagatzemSalut({ idb: null, navegador: { locks }, Canal: null });
    await acceptaAvis();
    await magatzem.desa('apunts', { id: '00000000-0000-4000-8000-000000000099', tipus: 'miccio', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', mesura: 'no-mesurat', lloc: 'vater' });
    const blobs = [];
    const descarregues = [];
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: (blob) => { blobs.push(blob); return 'blob:prova'; }, revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function enregistra() { descarregues.push(this.download); });
    munta('/app/salut/copia');
    expect(await screen.findByText('Una altra pestanya està apuntant. Tanca-la per a apuntar ací.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Descarrega una còpia' }));
    await waitFor(() => expect(descarregues).toEqual(['copia_2026-10-05.json']));
    expect(await blobs[0].text()).toContain('00000000-0000-4000-8000-000000000099');
    expect(screen.queryByText(textError({ codi: 'NOMES_LECTURA' }))).toBeNull();
    altra.tanca();
  });

  /* SAL-07: les marques es desen en UTC (toISOString) i es mostren amb el dia
     del rellotge de casa. Les proves corren a Europe/Madrid (vite.config.js). */
  test('una còpia i un avís de les 01:30 de l’estiu són del dia de casa, no del d’UTC', async () => {
    const nit = new Date(2026, 9, 6, 1, 30);
    expect(nit.toISOString()).toBe('2026-10-05T23:30:00.000Z');
    await desaMeta(magatzem, 'avis', { acceptatA: nit.toISOString(), versio: 1 });
    await desaMeta(magatzem, 'ultimaCopia', nit.toISOString());
    await magatzem.desa('apunts', { id: '00000000-0000-4000-8000-000000000099', tipus: 'miccio', moment: '2026-10-13T08:00', ofsetMin: 120, jornada: '2026-10-13', mesura: 'no-mesurat', lloc: 'vater' });
    munta('/app/salut/copia', { ara: new Date(2026, 9, 13, 9, 30) });
    expect(await screen.findByText('L’última còpia és del 06/10/2026.')).toBeTruthy();
    /* Del 6 al 13 són 7 dies: encara no toca el recordatori (més de 7). */
    expect(screen.queryByText(/L’última còpia és de fa/)).toBeNull();
    cleanup();
    munta('/app/salut/avis', { ara: new Date(2026, 9, 13, 9, 30) });
    expect(await screen.findByText('Avís acceptat el 06/10/2026.')).toBeTruthy();
  });

  /* SAL-03: el que la família no vol apuntar també és una dada de salut. Va a
     la base local de Salut, mai a l'emmagatzematge de preferències del navegador. */
  test('apagar un apartat el desa a la base de Salut, no a localStorage, i «Esborra-ho tot» l’oblida', async () => {
    await acceptaAvis();
    munta('/app/salut/persona');
    fireEvent.click(await screen.findByRole('switch', { name: 'Medicació' }));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Medicació' }).getAttribute('aria-checked')).toBe('false'));
    const navegador = Object.keys(window.localStorage).map((clau) => `${clau}=${window.localStorage.getItem(clau)}`).join('\n');
    expect(navegador).not.toMatch(/salut|medicacio/);
    expect((await carregaTot(magatzem)).apagats).toEqual(['medicacio']);
    cleanup();

    munta('/app/salut/diari');
    const graella = await screen.findByRole('list', { name: 'Què vols apuntar' });
    expect(within(graella).queryByRole('button', { name: 'Medicació' })).toBeNull();
    expect(within(graella).getByRole('button', { name: 'Conducta' })).toBeTruthy();
    cleanup();

    await magatzem.buidaTot();
    await acceptaAvis();
    munta('/app/salut/diari');
    expect(within(await screen.findByRole('list', { name: 'Què vols apuntar' })).getByRole('button', { name: 'Medicació' })).toBeTruthy();
  });

  test('una apagada antiga a les preferències de la plataforma ja no mana: la font és la base de Salut', async () => {
    window.localStorage.setItem('sdp_embed_apps-interruptors', JSON.stringify({ v: 1, apps: {}, interruptors: { salut: { medicacio: false } } }));
    _reiniciaPreferencies();
    await acceptaAvis();
    munta('/app/salut/persona');
    expect((await screen.findByRole('switch', { name: 'Medicació' })).getAttribute('aria-checked')).toBe('true');
  });

  test('«Esborra-ho tot» demana l’àlies exacte', async () => {
    await acceptaAvis();
    await magatzem.desa('apunts', { id: '00000000-0000-4000-8000-000000000099', tipus: 'miccio', moment: '2026-10-05T08:00', ofsetMin: 120, jornada: '2026-10-05', mesura: 'no-mesurat', lloc: 'vater' });
    munta('/app/salut/copia');
    fireEvent.click(await screen.findByRole('button', { name: 'Esborra-ho tot' }));
    let dialeg = await screen.findByRole('dialog', { name: 'Esborrar-ho tot' });
    fireEvent.change(within(dialeg).getByRole('textbox', { name: /escriu «el pare»/ }), { target: { value: 'el iaio' } });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Esborra-ho tot' })); });
    expect(await screen.findByText('Per a esborrar-ho tot, escriu «el pare» exactament.')).toBeTruthy();
    expect((await carregaTot(magatzem)).apunts).toHaveLength(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Esborra-ho tot' })[0]);
    dialeg = await screen.findByRole('dialog', { name: 'Esborrar-ho tot' });
    fireEvent.change(within(dialeg).getByRole('textbox', { name: /escriu «el pare»/ }), { target: { value: 'el pare' } });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Esborra-ho tot' })); });
    await waitFor(async () => expect((await carregaTot(magatzem)).apunts).toEqual([]));
    /* Sense l'avís acceptat, torna a la porta. */
    await waitFor(() => expect(ubicacio()).toBe('/app/salut/avis'));
  });
});
