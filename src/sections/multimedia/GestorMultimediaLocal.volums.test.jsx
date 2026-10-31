/* IDEA-54 (Onada 261029_1605) · Els volums del Gestor d'arxius locals: obrir
   sol amb el permís 'granted', bàner de reconnexió d'1 clic amb 'prompt' (el
   permís, primera espera del clic), «Vincular carpeta local», «Oblidar»,
   canvi de volum per pastilla, la reserva de només lectura (webkitdirectory)
   i la biblioteca que no pot recordar. Amb el doble únic
   tests/helpers/carpetaLocalFalsa.js. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GestorMultimediaLocal } from './GestorMultimediaLocal.jsx';
import {
  CarpetaFalsa, arbreMultimedia, bytesPngFals, creaBibliotecaFalsa, permisosDelRegistre
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

const diagnostic = (nom) => screen.findByRole('heading', { name: `Diagnòstic de «${nom}»` });
const conteOp = (arrel, op) => arrel.registre.findIndex(([o]) => o === op);

describe('volums recordats', () => {
  test('amb el permís concedit, la darrera carpeta s’obri sense cap clic i només es consulta (mai es demana)', async () => {
    const dir = arbreMultimedia();
    const bib = creaBibliotecaFalsa([{ id: 'v1', handle: dir }]);
    render(<GestorMultimediaLocal magatzemCarpetes={bib} entorn={{ showDirectoryPicker: vi.fn() }} />);
    expect(await diagnostic('_multimedia_de_poble')).not.toBeNull();
    expect(permisosDelRegistre(dir)).toEqual([['query', 'read']]);
    expect(screen.getByRole('button', { name: '_multimedia_de_poble' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(bib.crides).toContainEqual(['marcaAcces', 'v1']));
  });

  test('amb «prompt», el bàner «Carpeta recordada» i «Reconnectar amb 1 clic»: el permís és la primera cosa del clic', async () => {
    const dir = arbreMultimedia({ permisos: { read: 'prompt', readwrite: 'prompt' } });
    render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa([{ id: 'v1', handle: dir }])} entorn={{ showDirectoryPicker: vi.fn() }} />);
    const reconnecta = await screen.findByRole('button', { name: 'Reconnectar amb 1 clic' });
    expect(screen.getByText('Carpeta recordada: «_multimedia_de_poble»')).not.toBeNull();
    expect(permisosDelRegistre(dir)).toEqual([['query', 'read']]);
    expect(conteOp(dir, 'entries')).toBe(-1);
    fireEvent.click(reconnecta);
    expect(await diagnostic('_multimedia_de_poble')).not.toBeNull();
    expect(permisosDelRegistre(dir).at(-1)).toEqual(['request', 'read']);
    /* Cap lectura de la carpeta abans de la petició de permís. */
    const peticio = dir.registre.findIndex(([op, mode]) => op === 'request' && mode === 'read');
    expect(conteOp(dir, 'entries')).toBeGreaterThan(peticio);
    expect(screen.queryByText('Carpeta recordada: «_multimedia_de_poble»')).toBeNull();
  });

  test('un clic que no mostra la petició (gest caducat) deixa el bàner i ho explica', async () => {
    const dir = arbreMultimedia({ permisos: { read: 'prompt', readwrite: 'prompt' }, demanats: { read: 'prompt' } });
    render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa([{ id: 'v1', handle: dir }])} entorn={{ showDirectoryPicker: vi.fn() }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reconnectar amb 1 clic' }));
    expect(await screen.findByText(/torna a prémer «Reconnectar amb 1 clic»/)).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Reconnectar amb 1 clic' })).not.toBeNull();
  });

  test('«Oblidar» des del bàner l’oblida de la biblioteca i el focus va a «Vincular carpeta local»', async () => {
    const dir = arbreMultimedia({ permisos: { read: 'prompt', readwrite: 'prompt' } });
    const bib = creaBibliotecaFalsa([{ id: 'v1', handle: dir }]);
    render(<GestorMultimediaLocal magatzemCarpetes={bib} entorn={{ showDirectoryPicker: vi.fn() }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Oblidar' }));
    await waitFor(() => expect(bib.crides).toContainEqual(['oblida', 'v1']));
    await waitFor(() => expect(screen.queryByRole('button', { name: '_multimedia_de_poble' })).toBeNull());
    expect(screen.queryByText(/Carpeta recordada/)).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Vincular carpeta local' }));
  });

  test('amb el permís denegat, l’avís ho diu i oferix oblidar-la', async () => {
    const dir = arbreMultimedia({ permisos: { read: 'denied', readwrite: 'denied' } });
    render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa([{ id: 'v1', handle: dir }])} entorn={{ showDirectoryPicker: vi.fn() }} />);
    expect(await screen.findByText('El navegador ha denegat l’accés a «_multimedia_de_poble»: torna-la a vincular o oblida-la.')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Oblidar' })).not.toBeNull();
  });

  test('una carpeta que ja no hi és (NotFoundError) es diu «desapareguda»', async () => {
    const dir = arbreMultimedia();
    dir.injectaFallada('entries', { ruta: '', error: new DOMException('No hi és', 'NotFoundError') });
    render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa([{ id: 'v1', handle: dir }])} entorn={{ showDirectoryPicker: vi.fn() }} />);
    expect(await screen.findByText('No es troba «_multimedia_de_poble»: potser s’ha mogut o esborrat.')).not.toBeNull();
  });

  test('dos volums: la pastilla del segon en demana el permís (primera espera) i l’obri', async () => {
    const a = arbreMultimedia();
    const b = new CarpetaFalsa('_cultura_de_poble', { 'cartell.png': bytesPngFals() }, { permisos: { read: 'prompt', readwrite: 'prompt' } });
    render(<GestorMultimediaLocal
      magatzemCarpetes={creaBibliotecaFalsa([{ id: 'v1', handle: a }, { id: 'v2', handle: b }])}
      entorn={{ showDirectoryPicker: vi.fn() }}
    />);
    await diagnostic('_multimedia_de_poble');
    fireEvent.click(screen.getByRole('button', { name: '_cultura_de_poble' }));
    expect(await diagnostic('_cultura_de_poble')).not.toBeNull();
    expect(permisosDelRegistre(b)).toEqual([['query', 'read'], ['request', 'read']]);
    expect(screen.getByRole('button', { name: '_cultura_de_poble' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '_multimedia_de_poble' }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('vincular una carpeta', () => {
  test('«Vincular carpeta local» obri el selector (lectura, id propi), la desa a la biblioteca i l’obri', async () => {
    const dir = arbreMultimedia();
    const showDirectoryPicker = vi.fn(async () => dir);
    const bib = creaBibliotecaFalsa();
    render(<GestorMultimediaLocal magatzemCarpetes={bib} entorn={{ showDirectoryPicker }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vincular carpeta local' }));
    expect(await diagnostic('_multimedia_de_poble')).not.toBeNull();
    expect(showDirectoryPicker).toHaveBeenCalledWith({ mode: 'read', id: 'sdp-arxius-locals' });
    expect(bib.crides.find(([op]) => op === 'desa')?.[1]).toBe(dir);
    await waitFor(() => expect(screen.getByRole('button', { name: '_multimedia_de_poble' }).getAttribute('aria-pressed')).toBe('true'));
  });

  test('cancel·lar el selector no mostra cap error', async () => {
    const showDirectoryPicker = vi.fn(async () => {
      throw Object.assign(new Error('cancel·lat'), { name: 'AbortError' });
    });
    render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa()} entorn={{ showDirectoryPicker }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vincular carpeta local' }));
    await waitFor(() => expect(showDirectoryPicker).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('heading', { name: /Diagnòstic/ })).toBeNull();
  });

  test('si el navegador no la pot recordar, s’obri només per a esta sessió i ho diu', async () => {
    const dir = arbreMultimedia();
    render(<GestorMultimediaLocal
      magatzemCarpetes={creaBibliotecaFalsa([], { fallaDesa: 'SENSE_INDEXEDDB' })}
      entorn={{ showDirectoryPicker: vi.fn(async () => dir) }}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Vincular carpeta local' }));
    expect(await diagnostic('_multimedia_de_poble')).not.toBeNull();
    expect(await screen.findByText(/s’obri només per a esta sessió\. Este navegador no deixa recordar carpetes/)).not.toBeNull();
    expect(screen.getByText('Només esta sessió')).not.toBeNull();
  });

  test('sense selector (Safari, Firefox): el botó tria amb l’<input webkitdirectory>, només lectura i sense recordar-la', async () => {
    const bib = creaBibliotecaFalsa();
    render(<GestorMultimediaLocal magatzemCarpetes={bib} entorn={{}} />);
    expect(screen.getByText(/Este navegador no pot recordar carpetes ni escriure-hi/)).not.toBeNull();
    const input = screen.getByTestId('input-carpeta-multimedia-local');
    const clic = vi.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: 'Vincular carpeta local' }));
    expect(clic).toHaveBeenCalled();
    const nota = new File(['# Nota\n'], 'nota.md', { type: 'text/markdown' });
    Object.defineProperty(nota, 'webkitRelativePath', { value: '_multimedia_de_poble/00_inbox/nota.md' });
    const foto = new File([bytesPngFals()], 'foto.png', { type: 'image/png' });
    Object.defineProperty(foto, 'webkitRelativePath', { value: '_multimedia_de_poble/00_inbox/foto.png' });
    fireEvent.change(input, { target: { files: [nota, foto] } });
    expect(await diagnostic('_multimedia_de_poble')).not.toBeNull();
    expect(screen.getByText('Només lectura')).not.toBeNull();
    expect(bib.crides.some(([op]) => op === 'desa')).toBe(false);
    expect(screen.queryByRole('heading', { name: 'Accions de carpeta' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^nota\.md/ }));
    const area = await screen.findByLabelText('Contingut de «nota.md»');
    expect(area.readOnly).toBe(true);
    expect(screen.queryByRole('button', { name: 'Desar canvis al fitxer local' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Operacions al disc' })).toBeNull();
  });

  test('Gauntlet 261029 c1 · dins d’un marc d’un altre origen (Chrome hi exposa el selector, però el rebutja): el botó tria amb l’<input webkitdirectory>', async () => {
    const showDirectoryPicker = vi.fn(async () => {
      throw new DOMException('Cross origin sub frames aren’t allowed to show a file picker.', 'SecurityError');
    });
    const dalt = { get location() { throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError'); } };
    render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa()} entorn={{ showDirectoryPicker, top: dalt }} />);
    expect(screen.getByText(/Este navegador no pot recordar carpetes ni escriure-hi/)).not.toBeNull();
    const clic = vi.spyOn(screen.getByTestId('input-carpeta-multimedia-local'), 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: 'Vincular carpeta local' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vincular carpeta local' }));
    expect(clic).toHaveBeenCalledTimes(2);
    expect(showDirectoryPicker).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('textos', () => {
  test('cap text en dur: amb un traductor de claus, tot el que es veu és una clau del Gestor', async () => {
    const dir = new CarpetaFalsa('_multimedia_de_poble', { buida: {} });
    const { container } = render(<GestorMultimediaLocal
      t={(clau) => `⟦${clau}⟧`}
      magatzemCarpetes={creaBibliotecaFalsa([{ id: 'v1', handle: dir }])}
      entorn={{ showDirectoryPicker: vi.fn() }}
    />);
    expect(await screen.findByRole('heading', { name: '⟦section.multimedia.local.diagnostic⟧' })).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('⟦section.multimedia.local.titol⟧');
    expect(screen.getByRole('button', { name: '⟦section.multimedia.local.vincula⟧' })).not.toBeNull();
    const caminant = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const solts = [];
    for (let node = caminant.nextNode(); node; node = caminant.nextNode()) {
      const text = node.textContent.trim();
      if (!text || text.includes('⟦')) continue;
      if (/^[\d\s()·/.,:%×…?—-]*$/.test(text) || /^\d+(?:\.\d+)? [KM]B$/.test(text) || ['_multimedia_de_poble', 'buida'].includes(text)) continue;
      solts.push(text);
    }
    expect(solts).toEqual([]);
  });
});
