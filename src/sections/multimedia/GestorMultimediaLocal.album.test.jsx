/* IDEA-54/55 (Onada 261029_1605) · La fototeca mixta del Gestor d'arxius
   locals: graella de 24 per pàgina amb miniatures reals i revocació estricta
   de blob:, insígnies d'estat, duplicats exactes per SHA-256, la taula,
   l'arbre de carpetes (cada carpeta mostra TOTS els seus fitxers) i els
   filtres. L'SVG només com a data:, mai blob:. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GestorMultimediaLocal } from './GestorMultimediaLocal.jsx';
import {
  CarpetaFalsa, bytesFals, bytesPdfFals, bytesPngFals, bytesWebpFals, creaBibliotecaFalsa
} from '../../../tests/helpers/carpetaLocalFalsa.js';

let comptador = 0;
beforeEach(() => {
  comptador = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
    comptador += 1;
    return `blob:prova/${comptador}`;
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const obri = async (dir, props = {}) => {
  const vista = render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa([{ id: 'v1', handle: dir }])} entorn={{}} {...props} />);
  await screen.findByRole('heading', { name: `Diagnòstic de «${dir.name}»` });
  return vista;
};
const blobs = (container) => container.querySelectorAll('img[src^="blob:prova/"]');
const tessela = (nom) => screen.getByRole('button', { name: new RegExp(`^${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) });

describe('graella d’àlbum', () => {
  test('24 miniatures per pàgina, blob: només de PNG, i cada canvi de pàgina i el desmuntatge les revoquen totes', async () => {
    const fotos = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`foto_${String(i).padStart(2, '0')}.png`, bytesPngFals(64, i)]));
    const { container, unmount } = await obri(new CarpetaFalsa('album', fotos));
    await waitFor(() => expect(blobs(container)).toHaveLength(24));
    expect(URL.createObjectURL.mock.calls.every(([blob]) => blob.type === 'image/png')).toBe(true);
    expect(screen.getByText('Pàgina 1 de 2')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Pàgina anterior' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pàgina següent' }));
    await waitFor(() => expect(blobs(container)).toHaveLength(6));
    expect(screen.getByText('Pàgina 2 de 2')).not.toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(24);
    unmount();
    const creades = new Set(URL.createObjectURL.mock.results.map((r) => r.value));
    const revocades = new Set(URL.revokeObjectURL.mock.calls.map(([url]) => url));
    expect(creades.size).toBe(30);
    expect(revocades).toEqual(creades);
  });

  test('les insígnies d’estat: Publicada, Bessona WebP, Inèdita, Pes alt i Possible duplicat', async () => {
    const cens = new Map([['/assets/uploads/brain/web.webp', { titol: 'A la web', ambit: 'contingut' }]]);
    const dir = new CarpetaFalsa('_multimedia_de_poble', {
      originals_raster_public: { assets: { uploads: { brain: { 'web.jpg': bytesPngFals(64) } } } },
      bessones: { 'v.png': bytesPngFals(900), 'v.webp': bytesWebpFals(100) },
      inbox: { 'nova.png': bytesPngFals(64), 'gran.png': bytesPngFals(600 * 1024) },
      a: { 'dup.png': bytesPngFals(5000, 1) },
      b: { 'altra.png': bytesPngFals(5000, 2) }
    });
    await obri(dir, { cens });
    expect(within(tessela('web.jpg')).getByText('Publicada')).not.toBeNull();
    expect(within(tessela('v.png')).getByText('Bessona WebP')).not.toBeNull();
    expect(within(tessela('nova.png')).getByText('Inèdita')).not.toBeNull();
    expect(within(tessela('gran.png')).getByText('Pes alt')).not.toBeNull();
    expect(within(tessela('dup.png')).getByText('Possible duplicat')).not.toBeNull();
    expect(within(tessela('dup.png')).queryByText('Duplicada')).toBeNull();
  });

  test('«Verificar duplicats exactes (SHA-256)»: dos idèntics byte a byte són «Duplicada»; el de la mateixa mida, no', async () => {
    const igual = bytesPngFals(6000, 4);
    const dir = new CarpetaFalsa('_multimedia_de_poble', {
      a: { 'u.png': igual },
      b: { 'dos.png': new Uint8Array(igual) },
      c: { 'diferent.png': bytesPngFals(6000, 5) }
    });
    await obri(dir);
    fireEvent.click(screen.getByRole('button', { name: 'Verificar duplicats exactes (SHA-256)' }));
    expect(await screen.findByText('Grups de fitxers idèntics byte a byte: 1')).not.toBeNull();
    expect(within(tessela('u.png')).getByText('Duplicada')).not.toBeNull();
    expect(within(tessela('dos.png')).getByText('Duplicada')).not.toBeNull();
    expect(within(tessela('diferent.png')).queryByText('Duplicada')).toBeNull();
    expect(screen.getByText('Duplicats exactes: 2')).not.toBeNull();
  });

  test('SHA-256 sense cap duplicat ho diu, i el botó torna en acabar', async () => {
    await obri(new CarpetaFalsa('_multimedia_de_poble', { 'a.png': bytesPngFals(6000, 1), 'b.png': bytesPngFals(6000, 2) }));
    fireEvent.click(screen.getByRole('button', { name: 'Verificar duplicats exactes (SHA-256)' }));
    expect(await screen.findByText(/Cap duplicat exacte/)).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Verificar duplicats exactes (SHA-256)' })).not.toBeNull();
  });

  test('«Aturar la verificació» para la cerca i el resultat diu que és parcial', async () => {
    const fills = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`f${i}.png`, bytesPngFals(6000, i)]));
    await obri(new CarpetaFalsa('_multimedia_de_poble', fills));
    fireEvent.click(screen.getByRole('button', { name: 'Verificar duplicats exactes (SHA-256)' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Aturar la verificació' }));
    expect(await screen.findByText('Verificació aturada: el resultat és parcial.')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Verificar duplicats exactes (SHA-256)' })).not.toBeNull();
  });

  test('una foto gran es reduïx a una miniatura (createImageBitmap + canvas) i el bitmap es tanca', async () => {
    const tanca = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 320, height: 240, close: tanca })));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb, tipus) {
      cb(new Blob([bytesWebpFals(64)], { type: tipus }));
    });
    try {
      const { container } = await obri(new CarpetaFalsa('_multimedia_de_poble', { 'gran.png': bytesPngFals(300 * 1024), 'petita.png': bytesPngFals(64) }));
      await waitFor(() => expect(container.querySelectorAll('img[src^="blob:prova/"]')).toHaveLength(2));
      expect(globalThis.createImageBitmap).toHaveBeenCalledTimes(1);
      expect(globalThis.createImageBitmap.mock.calls[0][1]).toEqual({ resizeWidth: 320, resizeQuality: 'medium' });
      expect(tanca).toHaveBeenCalledTimes(1);
      expect(URL.createObjectURL.mock.calls.map(([blob]) => blob.type).sort()).toEqual(['image/png', 'image/webp']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test('un SVG (amb <script>) es pinta com a data: dins d’un <img> i mai com a blob:', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="4" height="4"/></svg>';
    const { container } = await obri(new CarpetaFalsa('_multimedia_de_poble', { 'logo.svg': svg }));
    await waitFor(() => expect(container.querySelector('img[src^="data:image/svg+xml;base64,"]')).not.toBeNull());
    expect(URL.createObjectURL.mock.calls.some(([blob]) => /svg|html|xml/.test(blob.type))).toBe(false);
    expect(container.querySelector('script, iframe, object, embed')).toBeNull();
  });
});

describe('fototeca mixta, arbre i filtres', () => {
  const barreja = () => new CarpetaFalsa('_multimedia_de_poble', {
    barreja: {
      'foto.png': bytesPngFals(),
      'nota.txt': 'Hola',
      'acta.pdf': bytesPdfFals(),
      'so.mp3': bytesFals('ID3'),
      'video.mp4': bytesFals('ftyp'),
      'pagina.html': '<p>hola</p>'
    },
    altra: { 'x.png': bytesPngFals(), buida: {} }
  });

  test('cada carpeta mostra TOTS els seus fitxers, i els que no són imatge porten la targeta d’arxiu', async () => {
    await obri(barreja());
    expect(screen.getByRole('heading', { name: 'Fitxers a la vista (7)' })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^barreja\s*6$/ }));
    expect(screen.getByRole('heading', { name: 'Fitxers a la vista (6)' })).not.toBeNull();
    for (const nom of ['foto.png', 'nota.txt', 'acta.pdf', 'so.mp3', 'video.mp4', 'pagina.html']) {
      expect(tessela(nom)).not.toBeNull();
    }
    expect(tessela('nota.txt').className).toContain('sdp-arxiu-local__tessela--arxiu');
    expect(tessela('foto.png').className).not.toContain('sdp-arxiu-local__tessela--arxiu');
    expect(screen.queryByRole('button', { name: /^x\.png/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tota la carpeta (7)' }));
    expect(screen.getByRole('heading', { name: 'Fitxers a la vista (7)' })).not.toBeNull();
  });

  test('l’arbre: plegar i desplegar, i una carpeta buida ho diu', async () => {
    await obri(barreja());
    const desplega = screen.getByRole('button', { name: 'Desplegar «altra»' });
    expect(desplega.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(desplega);
    expect(screen.getByRole('button', { name: 'Plegar «altra»' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /^buida\s*0$/ }));
    expect(screen.getByText('Esta carpeta és buida.')).not.toBeNull();
  });

  test('filtres per tipus, per estat i per nom', async () => {
    await obri(barreja());
    fireEvent.change(screen.getByLabelText('Tipus d’arxiu'), { target: { value: 'text' } });
    expect(screen.getByRole('heading', { name: 'Fitxers a la vista (1)' })).not.toBeNull();
    expect(tessela('nota.txt')).not.toBeNull();
    fireEvent.change(screen.getByLabelText('Tipus d’arxiu'), { target: { value: 'codi' } });
    expect(tessela('pagina.html')).not.toBeNull();
    fireEvent.change(screen.getByLabelText('Tipus d’arxiu'), { target: { value: 'tots' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inèdites (sense WebP)' }));
    expect(screen.getByRole('heading', { name: 'Fitxers a la vista (2)' })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tots els estats' }));
    fireEvent.change(screen.getByLabelText('Cerca per nom o ruta'), { target: { value: 'acta' } });
    expect(screen.getByRole('heading', { name: 'Fitxers a la vista (1)' })).not.toBeNull();
    fireEvent.change(screen.getByLabelText('Cerca per nom o ruta'), { target: { value: 'res-de-res' } });
    expect(screen.getByText('Cap fitxer coincidix amb els filtres.')).not.toBeNull();
  });

  test('l’«Explorador d’arxius (taula)»: una regió amb nom i les sis columnes', async () => {
    await obri(barreja());
    fireEvent.click(screen.getByRole('button', { name: 'Explorador d’arxius (taula)' }));
    const regio = screen.getByRole('region', { name: 'Explorador d’arxius (taula)' });
    expect(within(regio).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Nom', 'Carpeta', 'Tipus', 'Mida', 'Estat', 'Modificat']);
    expect(within(regio).getAllByRole('row')).toHaveLength(8);
    fireEvent.click(within(regio).getByRole('button', { name: 'acta.pdf' }));
    expect(await screen.findByRole('heading', { name: 'acta.pdf', level: 3 })).not.toBeNull();
  });
});
