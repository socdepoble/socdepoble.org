/* Gestoria · la vista «Històric i IA» (Onada 6, ordre del Mestre, 261009),
   amb la porta d'aprovació de veres: el catàleg real amb la seua empremta,
   un magatzem en memòria i un autenticador WebAuthn simulat que signa el
   tractor 'gestoria.historic'. Un CSV del banc sintètic: cap dada real.
   Es mira que cap xifra arriba al DOM amb l'ull tancat, que cap text del
   banc hi arriba mai, i que el llibre ix només després de confirmar-ho.
   Integració de l'Onada 6 (261009): ací es prova la vista sense la porta del
   cofre (VistaHistoric), amb la persistència injectada; la porta, el cofre i
   el bloqueig es proven a HistoricCofre.test.jsx.
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): amb el titular de
   la sessió (la prop que passa el pont), la boina, les targetes i la pàgina de
   cada targeta porten la persona; el rellotge viu és sempre l'últim de la
   barra, i la lectura és un xip a la seua esquerra. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { TRACTORS, empremtaDe } from '../../tractors/registreTractors.js';
import { CONSULTA_TRACTORS } from '../ContenidorGestoria.jsx';
import { TRACTOR_HISTORIC } from '../tractors.js';
import {
  CONSULTA_TRACTORS_HISTORIC, TITULAR_HISTORIC, VistaHistoric as Historic, pastillaDe, pastillaDeLectura, titularDelHistoric
} from './Historic.jsx';
import { CONFIGURACIO_BUIDA, VERSIO_CONFIGURACIO, configuracioNeta } from './useHistoric.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 9, 3, 0, 0);
const rellotge = () => ARA;
const AVUI = Object.freeze({ a: 2026, m: 10, d: 9 });
const autenticador = await creaAutenticadorSimulat({ subtle });
const INFO = await empremtaDe(TRACTORS.find((t) => t.id === TRACTOR_HISTORIC.id), subtle);
const entorn = { location: { origin: autenticador.origen, hostname: autenticador.rpId } };

/* Un CSV del banc sintètic: una compra d'IA amb targeta (amb una referència privada al concepte), un client, Google sense producte i la RETA. */
const CSV = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2025-01-05,2025-01-05,"OP.TARJ.COMPRA COMERCIO',
  '999999******1234 ANTHROPIC REFPRIVADA77",-21.50,978.50',
  '2025-01-10,2025-01-10,TRANSFERENCIA DE EMPRESA SINTETICA,1210.00,2188.50',
  '2025-02-03,2025-02-03,GOOGLE *SERVICES,-12.00,2176.50',
  '2025-02-28,2025-02-28,TGSS COTIZACION,-294.00,1882.50'
].join('\n');
const PRIVATS = ['REFPRIVADA77', 'EMPRESA SINTETICA', 'OP.TARJ', 'TGSS', '999999'];
const XIFRES = ['1.882,50', '306,00', '21,50', '210,00', '1.210,00'];
const fitxer = (nom, text) => {
  const dades = new TextEncoder().encode(text);
  return { name: nom, size: dades.length, arrayBuffer: vi.fn(async () => dades.slice().buffer) };
};

async function magatzemAprovat() {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest: TRACTOR_HISTORIC, empremta: INFO.empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(3)
  }));
  return magatzem;
}

function Ruta() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ruta">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

function munta({ magatzem = crearMagatzemMemoria(), persistencia, descarrega = vi.fn(), titular } = {}) {
  const vista = render(
    <MemoryRouter rutaInicial="/app/gestoria/historic">
      <Historic magatzem={magatzem} subtle={subtle} entorn={entorn} rellotge={rellotge} avui={AVUI}
        persistencia={persistencia} descarrega={descarrega} titular={titular} />
      <Ruta />
    </MemoryRouter>
  );
  return { ...vista, descarrega };
}

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el titular que passa el pont (sintètic: cap persona real). */
const TITULAR_SESSIO = Object.freeze({ nom: 'Pepa Soler', poble: 'Vilaprova de Dalt', avatar: null });
const barraTaronja = (arrel) => arrel.querySelector('section.bar-orange');
const nomDeLaBoina = (arrel) => barraTaronja(arrel).querySelector('.sp-card-author-name').textContent;
/* El rellotge viu: un <time> amb el nom «Data i hora d’ara…» i l'instant del rellotge injectat. */
const esRellotge = (node) => node?.tagName === 'TIME' && /^Data i hora d’ara: /.test(node.getAttribute('aria-label') ?? '')
  && node.getAttribute('datetime') === pastillaDe(ARA).dateTime;

async function llegit(opcions = {}) {
  const magatzem = await magatzemAprovat();
  const vista = munta({ magatzem, ...opcions });
  const selector = await screen.findByLabelText('Tria els extractes del banc de tot el període');
  const triat = fitxer('moviments.csv', CSV);
  fireEvent.change(selector, { target: { files: [triat] } });
  await screen.findByRole('heading', { level: 2, name: 'La foto del director financer' }, { timeout: 5000 });
  return { ...vista, triat };
}
const textDe = (container) => container.textContent;
/* Gauntlet 261016 (MCR o3_tpv_gestoria, proves 4 i 5): els recorreguts sencers (llegir el banc i treballar-hi)
   tarden 0,8-1,9 s sols i passaven dels 5 s per defecte amb la màquina carregada, cada vegada uns altres.
   Només el límit de temps, cap asserció: el component és font del tractor gestoria.historic i no es toca. */
const RECORREGUT = 20000;

describe('la porta', () => {
  test('sense l’aprovació del tractor: l’avís honest, cap selector, i el camí al panell de Tractors', async () => {
    munta();
    expect(await screen.findByText('Cal aprovar el tractor')).toBeTruthy();
    expect(screen.queryByLabelText('Tria els extractes del banc de tot el període')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(screen.getByLabelText('Ruta').textContent).toBe(`/app/gestoria/historic?${CONSULTA_TRACTORS_HISTORIC.slice(1)}`);
    expect(CONSULTA_TRACTORS_HISTORIC).toBe(CONSULTA_TRACTORS);
  });

  test('amb l’aprovació: el selector, l’estat buit i cap xifra; un H1', async () => {
    const { container } = munta({ magatzem: await magatzemAprovat() });
    expect(await screen.findByLabelText('Tria els extractes del banc de tot el període')).toBeTruthy();
    expect(screen.getByText('Encara no hi ha cap extracte')).toBeTruthy();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Històric i IA');
    expect(screen.getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('la lectura', () => {
  test('cap xifra al DOM amb l’ull tancat; amb l’ull obert, sí; cap text del banc, mai', async () => {
    const { container, triat } = await llegit();
    expect(triat.arrayBuffer).toHaveBeenCalledTimes(1);
    for (const titol of ['Caixa real', 'Despesa mensual mitjana', 'Consum net mensual', 'Autonomia de caixa', 'Pes de l’IA (% de la despesa)', 'Provisió d’impostos']) {
      expect(screen.getAllByText(titol).length, titol).toBeGreaterThan(0);
    }
    for (const xifra of XIFRES) expect(textDe(container), xifra).not.toContain(xifra);
    for (const privat of PRIVATS) expect(textDe(container), privat).not.toContain(privat);
    expect(screen.getAllByText('Import amagat').length).toBeGreaterThan(5);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));
    expect(screen.getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(textDe(container)).toContain('1.882,50 €'));
    expect(textDe(container)).toContain('306,00 €');
    for (const privat of PRIVATS) expect(textDe(container), privat).not.toContain(privat);
  });

  test('l’històric per mes diu «Sense dades» on no hi ha extractes; la IA per proveïdor; els avisos de la lectura', async () => {
    await llegit();
    const historic = screen.getByRole('region', { name: 'L’històric per mes' });
    expect(within(historic).getByRole('rowheader', { name: 'Gener 2025' })).toBeTruthy();
    expect(within(historic).getAllByText('Sense extractes').length).toBeGreaterThan(10);
    const ia = screen.getByRole('region', { name: 'La despesa en IA per proveïdor' });
    expect(within(ia).getByRole('rowheader', { name: 'Anthropic (Claude)' })).toBeTruthy();
    expect(within(ia).getByText('Inversió del subjecte passiu (UE)')).toBeTruthy();
    const categories = screen.getByRole('region', { name: 'El període per categoria' });
    expect(within(categories).getByRole('rowheader', { name: 'Intel·ligència artificial' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));
    expect(await screen.findByRole('figure', { name: 'Despesa neta en IA per mes' })).toBeTruthy();
    expect(screen.getByRole('figure', { name: 'Eixides per mes, sense traspassos' })).toBeTruthy();
  });

  test('amb l’ull tancat, els gràfics no es pinten (l’alçada de les barres és una xifra) i els recomptes s’amaguen', async () => {
    const { container } = await llegit();
    expect(container.querySelectorAll('.sdp-histograma__barra')).toHaveLength(0);
    expect(screen.queryByRole('figure', { name: 'Despesa neta en IA per mes' })).toBeNull();
    expect(screen.getByText('Gràfic amagat: «Despesa neta en IA per mes»')).toBeTruthy();
    expect(screen.getByText('Gràfic amagat: «Eixides per mes, sense traspassos»')).toBeTruthy();
    /* Els recomptes de la taula per categoria i de la nota de la simulació, també amagats. */
    const categories = screen.getByRole('region', { name: 'El període per categoria' });
    expect(within(categories).queryAllByText(/^\d+$/)).toEqual([]);
    expect(textDe(container)).toMatch(/Despeses sense proveïdor conegut, que van sense IVA deduïble: Xifra amagada/);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));
    await waitFor(() => expect(container.querySelectorAll('.sdp-histograma__barra').length).toBeGreaterThan(0));
    expect(within(screen.getByRole('region', { name: 'El període per categoria' })).getAllByText(/^\d+$/).length).toBeGreaterThan(0);
  });

  test('«Oblida les dades» ho buida tot i torna a tancar l’ull', async () => {
    const { container } = await llegit();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));
    await waitFor(() => expect(textDe(container)).toContain('1.882,50 €'));
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2, name: 'La foto del director financer' })).toBeNull());
    expect(textDe(container)).not.toContain('1.882,50');
    expect(screen.getByRole('button', { name: 'Mostra les xifres' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Encara no hi ha cap extracte')).toBeTruthy();
  });

  test('una targeta obri la seua pàgina; Tornar torna a la vista', async () => {
    await llegit();
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    await screen.findByRole('heading', { level: 1, name: 'Caixa real' });
    expect(screen.getByRole('heading', { level: 2, name: 'D’on ix' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'El detall de Caixa real' })).toBeTruthy();
  });
});

describe('revisar i regles', () => {
  test('Google sense producte és per revisar; reclassificar-lo a IA el porta a la taula d’IA; Desfés el torna', async () => {
    await llegit();
    const selector = screen.getByLabelText('Categoria del moviment del 03/02/2025');
    expect(selector.value).toBe('revisa');
    fireEvent.change(selector, { target: { value: 'ia' } });
    const ia = await screen.findByRole('region', { name: 'La despesa en IA per proveïdor' });
    await waitFor(() => expect(within(ia).getByRole('rowheader', { name: 'Google (sense producte)' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Desfés' }));
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'La despesa en IA per proveïdor' })).queryByRole('rowheader', { name: 'Google (sense producte)' })).toBeNull());
  }, RECORREGUT);

  test('el proveïdor d’un moviment es pot triar: Google reclassificat a IA com a Gemini', async () => {
    await llegit();
    fireEvent.change(screen.getByLabelText('Categoria del moviment del 03/02/2025'), { target: { value: 'ia' } });
    const proveidor = await screen.findByLabelText('Proveïdor del moviment del 03/02/2025');
    expect([...proveidor.options].map((o) => o.value)).toEqual(expect.arrayContaining(['', 'google', 'google-gemini', 'anthropic']));
    fireEvent.change(proveidor, { target: { value: 'google-gemini' } });
    const ia = await screen.findByRole('region', { name: 'La despesa en IA per proveïdor' });
    await waitFor(() => expect(within(ia).getByRole('rowheader', { name: 'Google Gemini' })).toBeTruthy());
    expect(within(ia).queryByRole('rowheader', { name: 'Google (sense producte)' })).toBeNull();
  }, RECORREGUT);

  test('les entrades sense origen són per revisar i es poden confirmar totes com a cobraments de clients', async () => {
    await llegit();
    const entrades = screen.getByRole('region', { name: 'Entrades per revisar' });
    expect(within(entrades).getByRole('rowheader', { name: '10/01/2025' })).toBeTruthy();
    expect(within(entrades).getByText('Una paraula genèrica del text')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Eixides per revisar' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirma la resta d’entrades com a cobraments de clients' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirma la resta d’entrades com a cobraments de clients' })).toBeNull());
    expect(within(screen.getByRole('region', { name: 'Entrades per revisar' })).getByText('Reclassificat a mà')).toBeTruthy();
  });

  test('una regla vàlida s’afig i es pot llevar; una de dues lletres, no', async () => {
    await llegit();
    const text = screen.getByLabelText('Text que apareix al moviment');
    fireEvent.change(text, { target: { value: 'go' } });
    fireEvent.click(screen.getByRole('button', { name: 'Afig la regla' }));
    expect(await screen.findByText('El text de la regla ha de tindre almenys 3 lletres.')).toBeTruthy();
    fireEvent.change(text, { target: { value: 'google *services' } });
    fireEvent.change(screen.getByLabelText('Categoria per a eixos moviments'), { target: { value: 'ia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Afig la regla' }));
    const regles = await screen.findByRole('list', { name: 'Les teues regles' });
    expect(within(regles).getByText('«google *services» → Intel·ligència artificial')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Torna a llegir amb les regles' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lleva la regla «google *services»' }));
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Les teues regles' })).toBeNull());
  }, RECORREGUT);
});

describe('simulacions i llibre', () => {
  test('els impostos de cada any, amb l’etiqueta [NO VERIFICAT]; un escenari en mostra la diferència', async () => {
    const { container } = await llegit();
    expect(screen.getByRole('heading', { level: 3, name: 'Els impostos de 2025' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Els impostos de 2026' })).toBeTruthy();
    expect(screen.getAllByText('[NO VERIFICAT] estimació per a revisar amb la gestoria').length).toBeGreaterThan(0);
    expect(screen.queryByRole('region', { name: 'El que canvia amb l’escenari' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Facturació (% de canvi)'), { target: { value: '10' } });
    expect(await screen.findByRole('region', { name: 'El que canvia amb l’escenari' })).toBeTruthy();
    for (const xifra of XIFRES) expect(textDe(container), xifra).not.toContain(xifra);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));
    await waitFor(() => expect(textDe(container)).toContain('210,00 €'));
  }, RECORREGUT);

  test('els trimestres sense extractes no tenen cap xifra al 130 ni al total (mai 0,00 €)', async () => {
    const { container } = await llegit();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra les xifres' }));
    await waitFor(() => expect(textDe(container)).toContain('210,00 €'));
    const taula = screen.getByRole('region', { name: 'Estimació trimestral de 2026' });
    for (const t of [1, 2, 3, 4]) {
      const fila = within(taula).getByRole('rowheader', { name: `${t}T 2026` }).closest('tr');
      expect(within(fila).getByText('Sense extractes')).toBeTruthy();
      expect(fila.textContent, `${t}T 2026`).not.toMatch(/0,00 €/);
      expect(within(fila).getAllByText('Sense dades')).toHaveLength(4);
    }
    const fila4T2025 = within(screen.getByRole('region', { name: 'Estimació trimestral de 2025' })).getByRole('rowheader', { name: '4T 2025' }).closest('tr');
    expect(fila4T2025.textContent).not.toMatch(/0,00 €/);
  });

  test('les escales són editables tram a tram: una de mal feta no canvia res; una de bona s’aplica i es pot restaurar', async () => {
    await llegit();
    fireEvent.click(screen.getByRole('button', { name: 'Edita els trams (escala autonòmica valenciana, 2025)' }));
    const form = screen.getByRole('form', { name: 'Trams: Escala autonòmica valenciana de 2025' });
    const primer = within(form).getByLabelText('Tram 1: tipus (%)');
    expect(primer.value).toBe('9');
    /* Un «fins a» més baix que el de l'anterior: no s'aplica. */
    fireEvent.change(within(form).getByLabelText('Tram 2: fins a (€)'), { target: { value: '100' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Aplica els trams de 2025' }));
    expect(await within(form).findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Torna als paràmetres per defecte de 2025' })).toBeNull();
    fireEvent.change(within(form).getByLabelText('Tram 2: fins a (€)'), { target: { value: '22000' } });
    fireEvent.change(primer, { target: { value: '10' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Aplica els trams de 2025' }));
    expect(await screen.findByText('Aplicada: Escala autonòmica valenciana de 2025.')).toBeTruthy();
    expect(screen.getByText(/fins a 12000 €: 10 %/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Torna als paràmetres per defecte de 2025' }));
    await waitFor(() => expect(screen.queryByText(/fins a 12000 €: 10 %/)).toBeNull());
  }, RECORREGUT);

  test('el llibre: es prepara, avisa que ix sense xifrar amb l’empremta, i només es descarrega en confirmar', async () => {
    const { descarrega } = await llegit();
    fireEvent.click(screen.getByRole('button', { name: 'Prepara el llibre (XLSX)' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Descarregar el llibre sense xifrar?' }, { timeout: 5000 });
    expect(within(dialeg).getByText(/SENSE xifrar/)).toBeTruthy();
    expect(within(dialeg).getByText('gestoria_historic_2025-01-01_2026-09-30.xlsx')).toBeTruthy();
    expect(within(dialeg).getByText(/^[0-9a-f]{64}$/)).toBeTruthy();
    expect(descarrega).not.toHaveBeenCalled();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Descarrega’l' }));
    expect(descarrega).toHaveBeenCalledTimes(1);
    const [{ nom, tipus, dades }] = descarrega.mock.calls[0];
    expect(nom).toBe('gestoria_historic_2025-01-01_2026-09-30.xlsx');
    expect(tipus).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(dades[0]).toBe(0x50);
    expect(await screen.findByText('S’ha descarregat «gestoria_historic_2025-01-01_2026-09-30.xlsx».')).toBeTruthy();
  });
});

describe('la persistència injectable', () => {
  test('llig la configuració desada en muntar i desa cada canvi, sense cap dada del banc', async () => {
    const desa = vi.fn(async () => {});
    const persistencia = {
      llig: vi.fn(async () => ({ versio: VERSIO_CONFIGURACIO, regles: [{ patro: 'forn de prova', categoria: 'altres' }], escenari: { facturacio: 5, despesaIa: 0 } })),
      desa
    };
    await llegit({ persistencia });
    expect(persistencia.llig).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('«forn de prova» → Altres')).toBeTruthy();
    expect(screen.getByLabelText('Facturació (% de canvi)').value).toBe('5');
    expect(desa).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Categoria del moviment del 03/02/2025'), { target: { value: 'programari' } });
    await waitFor(() => expect(desa).toHaveBeenCalledTimes(1));
    const desat = desa.mock.calls[0][0];
    expect(desat.versio).toBe(VERSIO_CONFIGURACIO);
    expect(Object.values(desat.reclassificacions)).toEqual([{ categoria: 'programari', proveidor: 'google' }]);
    const json = JSON.stringify(desat);
    for (const privat of [...PRIVATS, '-1200', '1882']) expect(json, privat).not.toContain(privat);
  }, RECORREGUT);

  test('un canvi fet abans que arribe la configuració desada no es perd: s’hi torna a aplicar damunt i es desa', async () => {
    let resol;
    const desa = vi.fn(async () => {});
    const persistencia = { llig: vi.fn(() => new Promise((r) => { resol = r; })), desa };
    await llegit({ persistencia });
    fireEvent.change(screen.getByLabelText('Categoria del moviment del 03/02/2025'), { target: { value: 'programari' } });
    expect(desa).not.toHaveBeenCalled();
    await act(async () => { resol({ versio: VERSIO_CONFIGURACIO, regles: [{ patro: 'forn de prova', categoria: 'altres' }] }); });
    expect(await screen.findByText('«forn de prova» → Altres')).toBeTruthy();
    await waitFor(() => expect(desa).toHaveBeenCalledTimes(1));
    const desat = desa.mock.calls[0][0];
    expect(desat.regles).toEqual([{ patro: 'forn de prova', categoria: 'altres', proveidor: null }]);
    expect(Object.values(desat.reclassificacions)).toEqual([{ categoria: 'programari', proveidor: 'google' }]);
    expect(screen.getByLabelText('Categoria del moviment del 03/02/2025').value).toBe('programari');
  }, RECORREGUT);

  test('si desar falla, ho diu; sense persistència, tot en memòria', async () => {
    const persistencia = { llig: async () => null, desa: async () => { throw new Error('el cofre està tancat'); } };
    await llegit({ persistencia });
    fireEvent.change(screen.getByLabelText('Categoria del moviment del 03/02/2025'), { target: { value: 'ia' } });
    expect(await screen.findByText('No s’ha pogut desar la configuració: el cofre està tancat')).toBeTruthy();
  }, RECORREGUT);

  test('configuracioNeta: només el que és vàlid, i res d’una altra versió', () => {
    expect(configuracioNeta(null)).toBe(CONFIGURACIO_BUIDA);
    expect(configuracioNeta({ versio: 99, regles: [{ patro: 'abc', categoria: 'ia' }] })).toBe(CONFIGURACIO_BUIDA);
    const neta = configuracioNeta({
      versio: VERSIO_CONFIGURACIO,
      regles: [{ patro: 'abc', categoria: 'ia' }, { patro: 'x', categoria: 'ia' }, { patro: 'abc', categoria: 'inventada' }],
      reclassificacions: { m0123abcd: { categoria: 'ia', proveidor: 'anthropic' }, 'no-es-un-id': { categoria: 'ia' }, m00000000: { categoria: 'res' } },
      parametres: { 2025: { pagament130: 1500, ivaGeneral: -1, origen: 'propis' }, any: { pagament130: 1 } },
      suposits: { retencioVendes: 1500 },
      escenari: { facturacio: 20, despesaIa: 'molt' }
    });
    expect(neta.regles).toEqual([{ patro: 'abc', categoria: 'ia', proveidor: null }]);
    expect(neta.reclassificacions).toEqual({ m0123abcd: { categoria: 'ia', proveidor: 'anthropic' } });
    expect(neta.parametres).toEqual({ 2025: { pagament130: 1500 } });
    expect(neta.suposits.retencioVendes).toBe(1500);
    expect(neta.escenari).toEqual({ facturacio: 20, despesaIa: 0 });
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): «la barra taronja de
   TOTES les pàgines de la Gestoria porta el titular real autenticat, i a la
   dreta SEMPRE la data i l'hora vives». */
describe('la boina: el titular de la sessió i el rellotge viu', () => {
  test('sense titular, l’estat honest; el rellotge viu és l’últim de la barra, i abans de llegir no hi ha cap xip de lectura', async () => {
    const { container } = munta({ magatzem: await magatzemAprovat() });
    await screen.findByLabelText('Tria els extractes del banc de tot el període');
    expect(nomDeLaBoina(container)).toBe('Titular sense configurar');
    expect(barraTaronja(container).querySelector('.sp-card-author').getAttribute('href')).toBe('/el-meu-perfil');
    const accions = barraTaronja(container).querySelector('.bar-actions');
    expect(esRellotge(accions.lastElementChild)).toBe(true);
    expect(accions.querySelectorAll('time')).toHaveLength(1);
    expect(accions.querySelector('.sdp-gestoria-boina__lectura')).toBeNull();
  });

  test('amb el titular de la sessió, la boina, les targetes i la pàgina d’una targeta porten la persona; mai «Titular sense configurar»', async () => {
    const { container } = await llegit({ titular: TITULAR_SESSIO });
    const autor = barraTaronja(container).querySelector('.sp-card-author');
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Pepa Soler');
    expect(autor.querySelector('.sp-card-author-location').textContent).toBe('Vilaprova de Dalt');
    expect(autor.getAttribute('href')).toBe('/el-meu-perfil');
    /* La boina de la pàgina i la de cada targeta de la foto del director financer. */
    expect(screen.getAllByText('Pepa Soler').length).toBeGreaterThan(1);
    expect(textDe(container)).not.toContain('Titular sense configurar');
    /* El nom no va mai a cap encapçalament: l'Índex de la barra blava els escriu a la URL. */
    for (const encapcalament of container.querySelectorAll('h1, h2, h3')) expect(encapcalament.textContent).not.toContain('Pepa Soler');
    fireEvent.click(screen.getByRole('button', { name: 'Caixa real' }));
    await screen.findByRole('heading', { level: 1, name: 'Caixa real' });
    expect(nomDeLaBoina(container)).toBe('Pepa Soler');
    const accions = barraTaronja(container).querySelector('.bar-actions');
    expect(esRellotge(accions.lastElementChild)).toBe(true);
    expect(screen.getByRole('button', { name: 'Mostra les xifres' })).toBeTruthy();
  });

  test('després de llegir, el xip de la lectura va a l’esquerra del rellotge: l’hora sola el mateix dia, i el nom accessible sencer', async () => {
    const { container } = await llegit();
    const accions = barraTaronja(container).querySelector('.bar-actions');
    expect(esRellotge(accions.lastElementChild)).toBe(true);
    const xip = accions.querySelector('.sdp-gestoria-boina .sdp-gestoria-boina__lectura time');
    const lectura = pastillaDe(ARA);
    expect(xip.getAttribute('aria-label')).toBe(`Dades llegides a les ${lectura.time} del ${lectura.date}`);
    expect(xip.getAttribute('datetime')).toBe(lectura.dateTime);
    expect([...xip.querySelectorAll('span')].map((span) => span.textContent)).toEqual([lectura.time]);
    expect(xip.compareDocumentPosition(accions.lastElementChild) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(accions.querySelectorAll('time')).toHaveLength(2);
  });
});

describe('peces', () => {
  test('la boina: el titular sense configurar, mai una autora fingida; la pastilla de la lectura', () => {
    expect(TITULAR_HISTORIC).toMatchObject({ nom: 'Titular sense configurar', href: '/el-meu-perfil' });
    expect(pastillaDe(null)).toBeNull();
    const pastilla = pastillaDe(new Date(2026, 9, 9, 7, 5).getTime());
    expect(pastilla).toEqual({ time: '07:05', date: '09/10/26', dateTime: '2026-10-09T07:05' });
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B). */
  test('pastillaDeLectura: la data només si la lectura no és d’avui; el dateTime i el nom accessible, sempre sencers', () => {
    const lectura = new Date(2026, 9, 9, 7, 5).getTime();
    expect(pastillaDeLectura(null, lectura)).toBeNull();
    expect(pastillaDeLectura(lectura, new Date(2026, 9, 9, 23, 59).getTime())).toEqual({
      time: '07:05', date: undefined, dateTime: '2026-10-09T07:05', etiqueta: 'Dades llegides a les 07:05 del 09/10/26'
    });
    expect(pastillaDeLectura(lectura, new Date(2026, 9, 10, 0, 1).getTime())).toEqual({
      time: '07:05', date: '09/10/26', dateTime: '2026-10-09T07:05', etiqueta: 'Dades llegides a les 07:05 del 09/10/26'
    });
    /* Sense un ara vàlid, la data es mostra: mai s'amaga una data que no se sap si és la d'avui. */
    expect(pastillaDeLectura(lectura, Number.NaN).date).toBe('09/10/26');
  });

  test('titularDelHistoric: el titular de la sessió enllaçat al perfil; sense nom, l’estat honest', () => {
    expect(titularDelHistoric(null)).toBe(TITULAR_HISTORIC);
    expect(titularDelHistoric({ nom: '   ' })).toBe(TITULAR_HISTORIC);
    expect(titularDelHistoric(TITULAR_SESSIO)).toEqual({ ...TITULAR_SESSIO, href: '/el-meu-perfil' });
    expect(titularDelHistoric({ nom: ' Pepa Soler ', poble: 3, avatar: 7, correu: 'pepa@poble.test' }))
      .toEqual({ nom: 'Pepa Soler', poble: '', avatar: null, href: '/el-meu-perfil' });
  });

  test('el desmuntatge en plena lectura no publica res', async () => {
    const magatzem = await magatzemAprovat();
    const { unmount } = munta({ magatzem });
    const selector = await screen.findByLabelText('Tria els extractes del banc de tot el període');
    await act(async () => {
      fireEvent.change(selector, { target: { files: [fitxer('moviments.csv', CSV)] } });
      unmount();
    });
    expect(document.body.textContent).toBe('');
  });
});
