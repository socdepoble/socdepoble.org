/* Gestoria · ContenidorGestoria: la porta d'aprovació de veres (useTractors,
   contextAprovacio i el catàleg real amb la seua empremta) endollada al
   panell, amb un magatzem en memòria, un autenticador WebAuthn simulat i una
   carpeta sintètica servida per un selector simulat. Empreses fictícies;
   cap dada de cap persona. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { creaAutenticadorSimulat } from '../../../tests/helpers/autenticadorSimulat.js';
import { preparaRegistre } from '../tractors/nucli/aprovacio.js';
import { crearMagatzemMemoria } from '../tractors/nucli/magatzem.js';
import { TRACTORS, empremtaDe } from '../tractors/registreTractors.js';
import ContenidorGestoria, { CONSULTA_TRACTORS } from './ContenidorGestoria.jsx';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from './tractors.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 2, 10, 0, 0);
const rellotge = () => ARA;
const AVUI = () => new Date(2026, 9, 2, 12, 0, 0);
const bytes = (text) => new TextEncoder().encode(text);

/* L'empremta de la versió d'ara de cada tractor: la que el Mestre aprova. */
const INFO = Object.fromEntries(await Promise.all(TRACTORS.map(async (t) => [t.id, await empremtaDe(t, subtle)])));
const autenticador = await creaAutenticadorSimulat({ subtle });

const CSV_PROVEIDOR = [
  'Número de factura,7777777777',
  'Fecha de la factura,31 jul 2026',
  'Importe de la factura,"12,10 €"',
  'Descripción,Importe',
  'Servei,"10,00"',
  'Subtotal,"10,00"',
  'I.V.A. (21%),"2,10"',
  'Total,"12,10"'
].join('\n');

/* Una carpeta en memòria amb el contracte de File System Access (només lectura); apunta el contingut que es llig. */
function carpeta() {
  const lectures = [];
  const fitxer = (nom, dades) => ({
    kind: 'file',
    name: nom,
    getFile: async () => ({
      size: dades.length,
      lastModified: 0,
      arrayBuffer: async () => {
        lectures.push(nom);
        return dades.slice().buffer;
      }
    })
  });
  const noTrobat = () => new DOMException('No hi és.', 'NotFoundError');
  const csv = fitxer('7777777777.csv', bytes(CSV_PROVEIDOR));
  const trimestre = {
    kind: 'directory',
    name: '2026_3T',
    async *entries() { yield ['7777777777.csv', csv]; },
    async getDirectoryHandle() { throw noTrobat(); },
    async getFileHandle(n) {
      if (n !== csv.name) throw noTrobat();
      return csv;
    }
  };
  const arrel = {
    kind: 'directory',
    name: 'Facturacio',
    async *entries() { yield ['2026_3T', trimestre]; },
    async getDirectoryHandle(n) {
      if (n !== '2026_3T') throw noTrobat();
      return trimestre;
    },
    async getFileHandle() { throw noTrobat(); }
  };
  const showDirectoryPicker = vi.fn(async () => arrel);
  return { lectures, showDirectoryPicker };
}

function RutaDeLApp() {
  const { pathname, search } = useLocation();
  return <output aria-label="Ruta">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

function munta({ magatzem = crearMagatzemMemoria() } = {}) {
  const { lectures, showDirectoryPicker } = carpeta();
  const entorn = { location: { origin: autenticador.origen, hostname: autenticador.rpId }, showDirectoryPicker };
  const vista = render(
    <MemoryRouter rutaInicial="/wikidepoble?categoria=gestoria_cat&item=gestoria_panell">
      <ContenidorGestoria magatzem={magatzem} subtle={subtle} entorn={entorn} rellotge={rellotge}
        inflate={null} avui={AVUI} descarrega={vi.fn()} />
      <RutaDeLApp />
    </MemoryRouter>
  );
  return { ...vista, magatzem, lectures, showDirectoryPicker };
}

async function ambSignatura(manifest = TRACTOR_FACTURES) {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest, empremta: INFO[manifest.id].empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(1)
  }));
  return magatzem;
}

const pas = (n) => screen.getByRole('heading', { level: 2, name: new RegExp(`^${n}\\. `) }).closest('section');
const ruta = () => screen.getByLabelText('Ruta').textContent;
const primerPas = async () => within((await screen.findByRole('heading', { level: 2, name: '1. Aprovació dels tractors' })).closest('section'));

describe('la porta d’aprovació, endollada', () => {
  test('el catàleg real té empremta: cap font absent', () => {
    expect(Object.keys(INFO).sort()).toEqual([TRACTOR_CORREUS.id, TRACTOR_FACTURES.id].sort());
    for (const info of Object.values(INFO)) expect(info).toMatchObject({ estat: 'ok', fontsAbsents: [] });
  });

  test('mentre llig les aprovacions ho anuncia; sense cap, tots dos pendents amb la seua empremta curta', async () => {
    const { showDirectoryPicker } = munta();
    expect(screen.getByText('Llegint les aprovacions dels tractors…').closest('[role="status"]')).not.toBeNull();
    const primer = await primerPas();
    expect(primer.getAllByText('Pendent')).toHaveLength(2);
    expect(primer.getByText(INFO[TRACTOR_FACTURES.id].curta)).toBeTruthy();
    expect(primer.getByText(INFO[TRACTOR_CORREUS.id].curta)).toBeTruthy();
    expect(primer.getByText('Cal aprovar el tractor de factures')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tria la carpeta de factures' })).toBeNull();
    expect(showDirectoryPicker).not.toHaveBeenCalled();
  });

  test('«Obri el panell de Tractors» porta a l’ítem de la Wiki on s’aproven', async () => {
    munta();
    const primer = await primerPas();
    expect(ruta()).toBe('/wikidepoble?categoria=gestoria_cat&item=gestoria_panell');
    fireEvent.click(primer.getByRole('button', { name: 'Obri el panell de Tractors' }));
    expect(ruta()).toBe(`/wikidepoble${CONSULTA_TRACTORS}`);
    expect(ruta()).toBe('/wikidepoble?categoria=tractors_cat&item=tractors_aprovacio');
  });

  test('una confirmació escrita no aprova cap tractor de la Gestoria: les dades personals exigixen signatura', async () => {
    const magatzem = crearMagatzemMemoria();
    for (const [i, manifest] of [TRACTOR_FACTURES, TRACTOR_CORREUS].entries()) {
      await magatzem.afegixRegistre(preparaRegistre({
        manifest: { ...manifest, nivellMinim: 'confirmacio' }, empremta: INFO[manifest.id].empremta, decisio: 'aprovat',
        nivell: 'confirmacio', ara: ARA - 60000, nonce: new Uint8Array(16).fill(10 + i)
      }));
    }
    munta({ magatzem });
    const primer = await primerPas();
    expect(primer.getAllByText('Pendent')).toHaveLength(2);
    expect(primer.queryByText('Aprovat')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tria la carpeta de factures' })).toBeNull();
  });

  test('amb la signatura del tractor de factures: «Aprovat», i la porta de veres deixa llegir la carpeta', async () => {
    const { lectures, showDirectoryPicker } = munta({ magatzem: await ambSignatura() });
    const primer = await primerPas();
    expect(primer.getByText('Aprovat')).toBeTruthy();
    expect(primer.getByText('Pendent')).toBeTruthy();
    expect(primer.getByText(/El creuament amb el correu és opcional/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tria la carpeta de factures' }));
    await screen.findByText('«Facturacio»');
    expect(showDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' });
    fireEvent.click(screen.getByRole('button', { name: 'Analitza el 3T de 2026' }));
    const despeses = within(await screen.findByRole('region', { name: 'Despeses de la proposta' }));
    expect(despeses.getByRole('textbox', { name: 'Núm, despesa 1' }).value).toBe('7777777777');
    expect(lectures).toEqual(['7777777777.csv']);
  });

  test('revocar-la després de pintar el panell para l’anàlisi següent: l’aprovació es llig a cada acció', async () => {
    const magatzem = await ambSignatura();
    const { lectures } = munta({ magatzem });
    expect((await primerPas()).getByText('Aprovat')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tria la carpeta de factures' }));
    await screen.findByText('«Facturacio»');
    // Com si el Mestre la revocara al panell de Tractors, amb la Gestoria oberta.
    await act(async () => {
      await magatzem.afegixRegistre(preparaRegistre({
        manifest: TRACTOR_FACTURES, empremta: INFO[TRACTOR_FACTURES.id].empremta, decisio: 'revocat',
        nivell: 'confirmacio', ara: ARA - 1000, nonce: new Uint8Array(16).fill(2)
      }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analitza el 3T de 2026' }));
    const alerta = await within(pas(2)).findByRole('alert');
    expect(within(alerta).getByText('L’aprovació està revocada: cal tornar a aprovar el tractor.')).toBeTruthy();
    expect(lectures).toEqual([]);
    expect(screen.queryByRole('region', { name: 'Despeses de la proposta' })).toBeNull();
  });

  test('si no es poden llegir les aprovacions, ho diu i el panell continua tancat', async () => {
    const trencat = { ...crearMagatzemMemoria(), registres: async () => { throw new Error('IndexedDB tancada'); } };
    munta({ magatzem: trencat });
    const alerta = await screen.findByRole('alert');
    expect(within(alerta).getByText('No s’han pogut llegir les aprovacions dels tractors')).toBeTruthy();
    expect(alerta.textContent).toMatch(/IndexedDB tancada/);
    expect((await primerPas()).getByText('Cal aprovar el tractor de factures')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tria la carpeta de factures' })).toBeNull();
  });
});
