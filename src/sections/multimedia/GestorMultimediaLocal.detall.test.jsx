/* IDEA-54/55 (Onada 261029_1605) · El detall polimòrfic del Gestor d'arxius
   locals: l'editor de text (⌘S / Ctrl+S, BOM i CRLF conservats, permís com a
   primera espera, JSON trencat, conflicte de disc), «Enviar al Bloc de Notes»,
   «Nou fitxer .md», àudio, vídeo, PDF (cap iframe), SVG i HTML com a text,
   EXIF sense [object Object] i proposta de poble, el laboratori WebP i les
   respostes tardanes. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GestorMultimediaLocal } from './GestorMultimediaLocal.jsx';
import { TIPUS, gpsTorre, jpegAmbExif } from '../../../tests/helpers/jpegProva.js';
import {
  CarpetaFalsa, arbreMultimedia, bytesFals, bytesPdfFals, bytesPngFals, bytesWebpFals, contingutFals, creaBibliotecaFalsa,
  nodeFals, textFals
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
const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tessela = (nom) => screen.getByRole('button', { name: new RegExp(`^${escapa(nom)}`) });
const detall = (nom) => screen.findByRole('region', { name: nom });
const indexDe = (dir, op, ruta) => dir.registre.findIndex(([o, r]) => o === op && (ruta === undefined || r === ruta));
const BOM = '﻿';

describe('editor de text', () => {
  const ambNotes = (opcions = {}, extres = {}) => new CarpetaFalsa('_multimedia_de_poble', {
    notes: { 'llista.md': `${BOM}# Llista\r\n\r\nOli\r\n`, ...extres }
  }, { permisos: { read: 'granted', readwrite: 'prompt' }, ...opcions });

  test.each([['metaKey'], ['ctrlKey']])('%s+S desa: el permís readwrite primer, i el BOM i els CRLF es conserven', async (tecla) => {
    const dir = ambNotes();
    await obri(dir);
    fireEvent.click(tessela('llista.md'));
    const area = await screen.findByLabelText('Contingut de «llista.md»');
    expect(area.value).toBe('# Llista\n\nOli\n');
    expect(screen.getByText('Sense canvis pendents.')).not.toBeNull();
    fireEvent.change(area, { target: { value: '# Llista\n\nOli\npa\n' } });
    expect(screen.getByText('Hi ha canvis sense desar: ⌘S o Ctrl+S per a desar.')).not.toBeNull();
    fireEvent.keyDown(area, { key: 's', [tecla]: true });
    expect(await screen.findByText('Canvis desats a «notes/llista.md».')).not.toBeNull();
    const peticio = dir.registre.findIndex(([op, mode]) => op === 'request' && mode === 'readwrite');
    expect(peticio).toBeGreaterThan(-1);
    expect(indexDe(dir, 'createWritable', 'notes/llista.md')).toBeGreaterThan(peticio);
    const bytes = contingutFals(dir, 'notes/llista.md');
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('# Llista\r\n\r\nOli\r\npa\r\n');
    expect(screen.getByText('Sense canvis pendents.')).not.toBeNull();
  });

  test('amb el permís d’escriptura denegat, ho diu i no escriu res', async () => {
    const dir = ambNotes({ demanats: { readwrite: 'denied' } });
    await obri(dir);
    fireEvent.click(tessela('llista.md'));
    const area = await screen.findByLabelText('Contingut de «llista.md»');
    fireEvent.change(area, { target: { value: 'canviat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desar canvis al fitxer local' }));
    expect(await screen.findByText('S’ha denegat el permís d’escriptura a la carpeta local.')).not.toBeNull();
    expect(indexDe(dir, 'createWritable')).toBe(-1);
    expect(textFals(dir, 'notes/llista.md')).toContain('# Llista');
  });

  test('un .canvas amb JSON trencat no es desa fins a «Desar igualment»', async () => {
    const dir = ambNotes({}, { 'tauler.canvas': '{"nodes":[]}' });
    await obri(dir);
    fireEvent.click(tessela('tauler.canvas'));
    const area = await screen.findByLabelText('Contingut de «tauler.canvas»');
    fireEvent.change(area, { target: { value: '{"nodes":[' } });
    fireEvent.keyDown(area, { key: 's', metaKey: true });
    expect(await screen.findByText(/El contingut no és JSON vàlid/)).not.toBeNull();
    expect(indexDe(dir, 'createWritable')).toBe(-1);
    fireEvent.click(screen.getByRole('button', { name: 'Desar igualment' }));
    await screen.findByText('Canvis desats a «notes/tauler.canvas».');
    expect(textFals(dir, 'notes/tauler.canvas')).toBe('{"nodes":[');
  });

  test('si el fitxer ha canviat al disc: «Tornar a llegir» porta el text de fora, «Sobreescriure igualment» desa el meu', async () => {
    const dir = ambNotes();
    await obri(dir);
    fireEvent.click(tessela('llista.md'));
    let area = await screen.findByLabelText('Contingut de «llista.md»');
    nodeFals(dir, 'notes/llista.md').modificaDesDeFora('# Des de fora\n');
    fireEvent.change(area, { target: { value: 'meu' } });
    fireEvent.keyDown(area, { key: 's', metaKey: true });
    let dialeg = await screen.findByRole('dialog', { name: 'El fitxer ha canviat al disc' });
    expect(indexDe(dir, 'createWritable')).toBe(-1);
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Tornar a llegir' }));
    await waitFor(() => expect(screen.getByLabelText('Contingut de «llista.md»').value).toBe('# Des de fora\n'));
    nodeFals(dir, 'notes/llista.md').modificaDesDeFora('# Altra volta\n');
    area = screen.getByLabelText('Contingut de «llista.md»');
    fireEvent.change(area, { target: { value: 'meu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desar canvis al fitxer local' }));
    dialeg = await screen.findByRole('dialog', { name: 'El fitxer ha canviat al disc' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Sobreescriure igualment' }));
    await screen.findByText('Canvis desats a «notes/llista.md».');
    expect(textFals(dir, 'notes/llista.md')).toBe('meu');
  });

  /* QA-A03 (Gauntlet 261029, cicle 1) · L'editor passa també la mida de la versió oberta. */
  test('un canvi de fora amb la mateixa data però una altra mida també és un conflicte (no es trepitja)', async () => {
    const dir = ambNotes();
    await obri(dir);
    fireEvent.click(tessela('llista.md'));
    const area = await screen.findByLabelText('Contingut de «llista.md»');
    const node = nodeFals(dir, 'notes/llista.md');
    node.modificaDesDeFora('# Llista molt més llarga, escrita des de fora\n', { modificat: node.modificat });
    fireEvent.change(area, { target: { value: 'meu' } });
    fireEvent.keyDown(area, { key: 's', metaKey: true });
    expect(await screen.findByRole('dialog', { name: 'El fitxer ha canviat al disc' })).not.toBeNull();
    expect(indexDe(dir, 'createWritable')).toBe(-1);
    expect(textFals(dir, 'notes/llista.md')).toBe('# Llista molt més llarga, escrita des de fora\n');
  });

  test('«Enviar al Bloc de Notes» crea la nota sanejada a f-notes i l’obri; sense compte, el botó no va', async () => {
    const dir = new CarpetaFalsa('_multimedia_de_poble', { notes: { 'llista.md': '# Llista\n\nOli <script>alert(1)</script>\n' } });
    const crea = vi.fn(async () => ({ id: 'n-1' }));
    const obriNota = vi.fn();
    const { unmount } = await obri(dir, { blocDeNotes: { potCrear: true, crea, obri: obriNota } });
    fireEvent.click(tessela('llista.md'));
    await screen.findByLabelText('Contingut de «llista.md»');
    expect(screen.getByText(/amb sessió, la nota es desa al servidor del poble/)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar al Bloc de Notes' }));
    await waitFor(() => expect(obriNota).toHaveBeenCalledWith('n-1'));
    const [entrada] = crea.mock.calls[0];
    expect(entrada.folderId).toBe('f-notes');
    expect(entrada.title).toBe('Llista');
    expect(entrada.content).toContain('Oli');
    expect(entrada.content).not.toMatch(/<script/i);
    unmount();

    await obri(new CarpetaFalsa('_multimedia_de_poble', { 'a.md': '# A\n' }), { blocDeNotes: { potCrear: false, crea, obri: obriNota } });
    fireEvent.click(tessela('a.md'));
    await screen.findByLabelText('Contingut de «a.md»');
    expect(screen.getByRole('button', { name: 'Enviar al Bloc de Notes' }).disabled).toBe(true);
    expect(screen.getByText('Per a enviar-lo al Bloc de Notes cal entrar al compte.')).not.toBeNull();
  });

  test('«Nou fitxer .md» crea el fitxer a la mateixa carpeta i l’obri; un nom que ja hi és no es trepitja', async () => {
    const dir = ambNotes();
    await obri(dir);
    fireEvent.click(tessela('llista.md'));
    await screen.findByLabelText('Contingut de «llista.md»');
    const zona = await detall('llista.md');
    fireEvent.click(within(zona).getByRole('button', { name: 'Nou fitxer .md' }));
    const nom = within(zona).getByLabelText('Nom del fitxer nou');
    fireEvent.change(nom, { target: { value: 'llista' } });
    fireEvent.click(within(zona).getByRole('button', { name: 'Crear el fitxer' }));
    expect(await within(zona).findByText('«llista.md» ja existix en esta carpeta.')).not.toBeNull();
    fireEvent.change(nom, { target: { value: 'idees' } });
    fireEvent.click(within(zona).getByRole('button', { name: 'Crear el fitxer' }));
    expect(await screen.findByRole('heading', { name: 'idees.md', level: 3 })).not.toBeNull();
    expect(textFals(dir, 'notes/idees.md')).toBe('# idees\n');
    expect(screen.getByText('S’ha creat «notes/idees.md».')).not.toBeNull();
  });

  test('amb canvis sense desar, canviar de fitxer demana confirmació', async () => {
    const dir = ambNotes({}, { 'altra.txt': 'altra' });
    await obri(dir);
    fireEvent.click(tessela('llista.md'));
    const area = await screen.findByLabelText('Contingut de «llista.md»');
    fireEvent.change(area, { target: { value: 'a mig fer' } });
    tessela('altra.txt').focus();
    fireEvent.click(tessela('altra.txt'));
    let dialeg = await screen.findByRole('dialog', { name: 'Vols descartar els canvis sense desar?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByLabelText('Contingut de «llista.md»').value).toBe('a mig fer');
    expect(document.activeElement).toBe(tessela('altra.txt'));
    fireEvent.click(tessela('altra.txt'));
    dialeg = await screen.findByRole('dialog', { name: 'Vols descartar els canvis sense desar?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Descartar els canvis' }));
    expect(await screen.findByLabelText('Contingut de «altra.txt»')).not.toBeNull();
    expect(textFals(dir, 'notes/llista.md')).toContain('# Llista');
  });

  test('en tancar el detall, el focus torna a la tessel·la', async () => {
    await obri(ambNotes());
    fireEvent.click(tessela('llista.md'));
    const titol = await screen.findByRole('heading', { name: 'llista.md', level: 3 });
    await waitFor(() => expect(document.activeElement).toBe(titol));
    fireEvent.click(screen.getByRole('button', { name: 'Tancar el detall' }));
    await waitFor(() => expect(document.activeElement).toBe(tessela('llista.md')));
  });
});

describe('vistes de mitjans i seguretat', () => {
  test('àudio, vídeo i PDF: reproductors natius i un enllaç a pestanya nova, sense iframe, object ni embed', async () => {
    const dir = new CarpetaFalsa('_multimedia_de_poble', { 'so.mp3': bytesFals('ID3'), 'video.mp4': bytesFals('ftyp'), 'acta.pdf': bytesPdfFals() });
    const { container } = await obri(dir);
    fireEvent.click(tessela('so.mp3'));
    await waitFor(() => expect(container.querySelector('audio[controls][src^="blob:prova/"]')).not.toBeNull());
    fireEvent.click(tessela('video.mp4'));
    await waitFor(() => expect(container.querySelector('video[controls][src^="blob:prova/"]')).not.toBeNull());
    fireEvent.click(tessela('acta.pdf'));
    const enllac = await screen.findByRole('link', { name: 'Obrir el PDF en una pestanya nova' });
    expect(enllac.getAttribute('href')).toMatch(/^blob:prova\//);
    expect(enllac.getAttribute('target')).toBe('_blank');
    expect(enllac.getAttribute('rel')).toContain('noopener');
    expect(container.querySelector('iframe, object, embed')).toBeNull();
    const tipus = URL.createObjectURL.mock.calls.map(([blob]) => blob.type);
    expect(tipus).toContain('application/pdf');
    expect(tipus).toContain('application/octet-stream');
    expect(screen.getByRole('link', { name: 'Descarregar' }).getAttribute('download')).toBe('acta.pdf');
  });

  test('un fals PDF (sense «%PDF-») no s’obri: només es descarrega', async () => {
    await obri(new CarpetaFalsa('_multimedia_de_poble', { 'fals.pdf': '<html><script>x</script></html>' }));
    fireEvent.click(tessela('fals.pdf'));
    expect(await screen.findByText('El fitxer no comença com un PDF: només es pot descarregar.')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Obrir el PDF en una pestanya nova' })).toBeNull();
    expect(URL.createObjectURL.mock.calls.some(([blob]) => blob.type === 'application/pdf')).toBe(false);
  });

  test('SVG i HTML amb <script>: l’SVG com a data: dins d’un <img>, i el codi com a text; mai un blob: actiu', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const html = '<!doctype html><p>Hola</p><script>alert(2)</script>';
    const { container } = await obri(new CarpetaFalsa('_multimedia_de_poble', { 'logo.svg': svg, 'pagina.html': html }));
    fireEvent.click(tessela('logo.svg'));
    const zona = await detall('logo.svg');
    await waitFor(() => expect(zona.querySelector('img[src^="data:image/svg+xml;base64,"]')).not.toBeNull());
    expect(within(zona).getByText(svg)).not.toBeNull();
    fireEvent.click(tessela('pagina.html'));
    expect(await screen.findByText(html)).not.toBeNull();
    expect(container.querySelector('script, iframe, object, embed')).toBeNull();
    expect(URL.createObjectURL.mock.calls.some(([blob]) => /svg|html|xml|javascript/.test(blob.type))).toBe(false);
  });

  test('EXIF: la càmera és «Canon EOS 5D» (mai [object Object]) i la proposta de poble és una proposta', async () => {
    const jpeg = jpegAmbExif({
      ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS 5D' }],
      gps: gpsTorre()
    });
    const { container } = await obri(new CarpetaFalsa('_multimedia_de_poble', { fotos: { 'festa.jpg': jpeg } }));
    fireEvent.click(tessela('festa.jpg'));
    expect(await screen.findByText('Canon EOS 5D')).not.toBeNull();
    expect(container.textContent).not.toContain('[object Object]');
    expect(screen.getByText('Proposta per a catalogar (cal confirmar-la)')).not.toBeNull();
    expect(screen.getByText('Poble proposat: La Torre de les Maçanes')).not.toBeNull();
    expect(screen.getByText('Confiança alta')).not.toBeNull();
    expect(screen.getByText('Origen: Fotografia (l’EXIF nomena una càmera)')).not.toBeNull();
  });

  test('una resposta tardana d’un fitxer anterior no crea cap blob: ni el pinta', async () => {
    const dir = new CarpetaFalsa('_multimedia_de_poble', { 'a.png': bytesPngFals(64, 1), 'b.png': bytesPngFals(64, 2) });
    const { container, unmount } = await obri(dir);
    await waitFor(() => expect(container.querySelectorAll('img[src^="blob:prova/"]')).toHaveLength(2));
    const node = nodeFals(dir, 'a.png');
    const original = node.getFile.bind(node);
    const pendents = [];
    /* La primera lectura (el Blob del detall) passa; la segona (els bytes de la imatge) es queda
       penjada: la resposta tardana arriba quan el registre de blob: ja està tancat. */
    let lectures = 0;
    node.getFile = () => {
      lectures += 1;
      return lectures === 1 ? original() : new Promise((resol) => pendents.push(() => resol(original())));
    };
    fireEvent.click(tessela('a.png'));
    await waitFor(() => expect(pendents.length).toBeGreaterThan(0));
    fireEvent.click(tessela('b.png'));
    expect(await screen.findByRole('heading', { name: 'b.png', level: 3 })).not.toBeNull();
    await waitFor(() => expect(screen.getByAltText('b.png').getAttribute('src')).toMatch(/^blob:prova\//));
    const abans = URL.createObjectURL.mock.calls.length;
    await act(async () => {
      pendents.splice(0).forEach((allibera) => allibera());
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(URL.createObjectURL.mock.calls.length).toBe(abans);
    expect(screen.queryByRole('heading', { name: 'a.png', level: 3 })).toBeNull();
    unmount();
    const creades = new Set(URL.createObjectURL.mock.results.map((r) => r.value));
    expect(new Set(URL.revokeObjectURL.mock.calls.map(([u]) => u))).toEqual(creades);
  });
});

describe('laboratori WebP', () => {
  const canvasAmb = (tipus) => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
      cb(tipus === 'image/webp' ? new Blob([bytesWebpFals(900)], { type: 'image/webp' }) : new Blob([bytesPngFals(900)], { type: tipus }));
    });
  };
  const carrega = (nom) => {
    const img = screen.getByAltText(nom);
    Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 800 });
    Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 600 });
    fireEvent.load(img);
  };

  /* Gauntlet 261029 (cicle 1, IDEA-57) · Cap blob: revocat a la vista. */
  test('canviar la qualitat no revoca la previsualització mentre encara es pinta, i la revoca quan ja no hi és', async () => {
    canvasAmb('image/webp');
    const revocadesPintades = [];
    URL.revokeObjectURL.mockImplementation((url) => {
      if ([...document.querySelectorAll('img')].some((img) => img.getAttribute('src') === url)) revocadesPintades.push(url);
    });
    const dir = arbreMultimedia();
    await obri(dir);
    fireEvent.click(tessela('esbos_festa_tibi.png'));
    await waitFor(() => expect(screen.getByAltText('esbos_festa_tibi.png').getAttribute('src')).toMatch(/^blob:/));
    carrega('esbos_festa_tibi.png');
    const previa = () => screen.getByAltText('Previsualització WebP de «esbos_festa_tibi.png»');
    await waitFor(() => expect(previa().getAttribute('src')).toMatch(/^blob:/));
    const vella = previa().getAttribute('src');
    fireEvent.change(screen.getByLabelText('Qualitat WebP'), { target: { value: '0.72' } });
    await waitFor(() => expect(previa().getAttribute('src')).not.toBe(vella));
    expect(revocadesPintades).toEqual([]);
    expect(URL.revokeObjectURL.mock.calls.map(([url]) => url)).toContain(vella);
  });

  test('«Desar .webp a la carpeta local» escriu una WebP de veres al costat de l’original', async () => {
    canvasAmb('image/webp');
    const dir = arbreMultimedia();
    await obri(dir);
    fireEvent.click(tessela('esbos_festa_tibi.png'));
    await waitFor(() => expect(screen.getByAltText('esbos_festa_tibi.png').getAttribute('src')).toMatch(/^blob:/));
    carrega('esbos_festa_tibi.png');
    expect(await screen.findByText('800 × 600 px')).not.toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Desar .webp a la carpeta local' }));
    expect(await screen.findByText(/S’ha desat «00_inbox\/esbos_festa_tibi\.webp»/)).not.toBeNull();
    const webp = contingutFals(dir, '00_inbox/esbos_festa_tibi.webp');
    expect(new TextDecoder().decode(webp.slice(8, 12))).toBe('WEBP');
    await waitFor(() => expect(within(tessela('esbos_festa_tibi.png')).getByText('Bessona WebP')).not.toBeNull());
  });

  test('amb la bessona ja al costat, «Substituir la bessona .webp» demana confirmació abans de sobreescriure-la', async () => {
    canvasAmb('image/webp');
    const dir = new CarpetaFalsa('_multimedia_de_poble', { inbox: { 'x.png': bytesPngFals(900), 'x.webp': bytesWebpFals(10) } });
    await obri(dir);
    fireEvent.click(tessela('x.png'));
    await waitFor(() => expect(screen.getByAltText('x.png').getAttribute('src')).toMatch(/^blob:/));
    carrega('x.png');
    fireEvent.click(await screen.findByRole('button', { name: 'Substituir la bessona .webp' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Ja hi ha «inbox/x.webp»' });
    expect(contingutFals(dir, 'inbox/x.webp').byteLength).toBe(22);
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Substituir' }));
    expect(await screen.findByText(/S’ha desat «inbox\/x\.webp»/)).not.toBeNull();
    expect(contingutFals(dir, 'inbox/x.webp').byteLength).toBe(912);
  });

  test('si el navegador torna PNG en compte de WebP (WebKit), ho diu i no oferix desar', async () => {
    canvasAmb('image/png');
    await obri(arbreMultimedia());
    fireEvent.click(tessela('esbos_festa_tibi.png'));
    await waitFor(() => expect(screen.getByAltText('esbos_festa_tibi.png').getAttribute('src')).toMatch(/^blob:/));
    carrega('esbos_festa_tibi.png');
    expect(await screen.findByText(/no sap codificar WebP/)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Desar .webp a la carpeta local' })).toBeNull();
  });

  test('«Desar .webp i moure l’original a originals_raster_public/»: la WebP es queda, l’original se’n va i la selecció el seguix', async () => {
    canvasAmb('image/webp');
    const dir = arbreMultimedia();
    await obri(dir);
    fireEvent.click(tessela('nano_vinyeta.png'));
    await waitFor(() => expect(screen.getByAltText('nano_vinyeta.png').getAttribute('src')).toMatch(/^blob:/));
    carrega('nano_vinyeta.png');
    fireEvent.click(await screen.findByRole('button', { name: 'Desar .webp i moure l’original a originals_raster_public/' }));
    expect(await screen.findByText('S’ha desat «00_inbox/nano_vinyeta.webp» i l’original s’ha mogut a «originals_raster_public/nano_vinyeta.png».')).not.toBeNull();
    expect(nodeFals(dir, '00_inbox/nano_vinyeta.png')).toBeNull();
    expect(contingutFals(dir, 'originals_raster_public/nano_vinyeta.png')).not.toBeNull();
    expect(contingutFals(dir, '00_inbox/nano_vinyeta.webp')).not.toBeNull();
    const zona = await detall('nano_vinyeta.png');
    await waitFor(() => expect(within(zona).getByText('originals_raster_public/nano_vinyeta.png')).not.toBeNull());
    expect(within(zona).queryByRole('button', { name: /moure l’original/ })).toBeNull();
  });

  test('Gauntlet 261029 c1 · una WebP més pesada que l’original es diu «+X % més pesat», mai «mateix pes»; una més lleugera, «-X %»', async () => {
    canvasAmb('image/webp');
    /* La WebP del canvas fa 912 B: l'original de 88 B pesa menys i el de 1.824 B, el doble. */
    await obri(new CarpetaFalsa('_multimedia_de_poble', { inbox: { 'petita.png': bytesPngFals(80), 'gran.png': bytesPngFals(1816) } }));
    fireEvent.click(tessela('petita.png'));
    await waitFor(() => expect(screen.getByAltText('petita.png').getAttribute('src')).toMatch(/^blob:/));
    carrega('petita.png');
    expect(await screen.findByText(/^Després: 800 × 600 px · .+ · \+936 % més pesat$/)).not.toBeNull();
    expect(screen.queryByText(/mateix pes/)).toBeNull();
    fireEvent.click(tessela('gran.png'));
    await waitFor(() => expect(screen.getByAltText('gran.png').getAttribute('src')).toMatch(/^blob:/));
    carrega('gran.png');
    expect(await screen.findByText(/^Després: 800 × 600 px · .+ · -50 %$/)).not.toBeNull();
    expect(screen.queryByText(/més pesat|mateix pes/)).toBeNull();
  });
});
