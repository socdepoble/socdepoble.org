/* IDEA-55 A.3 (Onada 261029_1605) · Les operacions físiques al disc des del
   Gestor d'arxius locals, com en Obsidian o el Finder: moure, reanomenar,
   eliminar (confirmació destructiva, sense `recursive`), nova carpeta i fitxer
   .md nou a la carpeta activa. El permís readwrite és la primera espera; amb
   canvis sense desar, tot queda bloquejat; amb la font de només lectura, no
   hi ha cap botó. Sempre sobre el doble tests/helpers/carpetaLocalFalsa.js,
   mai sobre les carpetes satèl·lit reals. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GestorMultimediaLocal } from './GestorMultimediaLocal.jsx';
import {
  arbreMultimedia, bytesPngFals, carpetesFalses, creaBibliotecaFalsa, nodeFals, rutesFalses, textFals
} from '../../../tests/helpers/carpetaLocalFalsa.js';

beforeEach(() => {
  let n = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
    n += 1;
    return `blob:prova/${n}`;
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
const operacions = async (nom) => {
  fireEvent.click(tessela(nom));
  const zona = await screen.findByRole('region', { name: nom });
  return within(zona).getByRole('region', { name: 'Operacions al disc' });
};
const ambPermisPerDemanar = () => arbreMultimedia({ permisos: { read: 'granted', readwrite: 'prompt' } });

describe('operacions sobre un fitxer', () => {
  test('«Moure» el porta a la carpeta triada (permís primer, cap `recursive`) i la selecció el seguix', async () => {
    const dir = ambPermisPerDemanar();
    await obri(dir);
    const ops = await operacions('llegeix-me.txt');
    fireEvent.change(within(ops).getByLabelText('Carpeta destí'), { target: { value: 'documents_i_pdfs' } });
    fireEvent.click(within(ops).getByRole('button', { name: 'Moure' }));
    expect(await screen.findByText(/^S’ha mogut a «documents_i_pdfs\/llegeix-me\.txt» \(comprovació: /)).not.toBeNull();
    expect(nodeFals(dir, 'llegeix-me.txt')).toBeNull();
    expect(textFals(dir, 'documents_i_pdfs/llegeix-me.txt')).toBe('Llegeix-me\n');
    const peticio = dir.registre.findIndex(([op, mode]) => op === 'request' && mode === 'readwrite');
    const copia = dir.registre.findIndex(([op]) => op === 'createWritable');
    expect(peticio).toBeGreaterThan(-1);
    expect(copia).toBeGreaterThan(peticio);
    expect(dir.registre.filter(([op]) => op === 'removeEntry').every(([, , opcions]) => opcions.recursive === false)).toBe(true);
    const zona = await screen.findByRole('region', { name: 'llegeix-me.txt' });
    expect(within(zona).getByText('documents_i_pdfs/llegeix-me.txt')).not.toBeNull();
  });

  test('«Reanomenar» conserva l’extensió; un canvi només de majúscules es refusa al disc del Mac', async () => {
    const dir = arbreMultimedia({ insensible: true });
    await obri(dir);
    let ops = await operacions('nota.md');
    let nom = within(ops).getByLabelText('Nom nou');
    expect(nom.value).toBe('nota.md');
    expect(within(ops).getByText('L’extensió «.md» es conserva.')).not.toBeNull();
    fireEvent.change(nom, { target: { value: 'Nota.md' } });
    fireEvent.click(within(ops).getByRole('button', { name: 'Reanomenar' }));
    expect(await within(ops).findByText('El nom nou només canvia majúscules o accents: per al disc és el mateix fitxer.')).not.toBeNull();
    expect(textFals(dir, '00_inbox/nota.md')).not.toBeNull();
    fireEvent.change(nom, { target: { value: 'idea' } });
    fireEvent.click(within(ops).getByRole('button', { name: 'Reanomenar' }));
    expect(await screen.findByText('Ara es diu «idea.md».')).not.toBeNull();
    expect(nodeFals(dir, '00_inbox/nota.md')).toBeNull();
    expect(textFals(dir, '00_inbox/idea.md')).toBe('# Nota\n\nHola, poble.\n');
    ops = within(await screen.findByRole('region', { name: 'idea.md' })).getByRole('region', { name: 'Operacions al disc' });
    nom = within(ops).getByLabelText('Nom nou');
    expect(nom.value).toBe('idea.md');
  });

  test('«Eliminar del disc» avisa que no va a la Paperera; Cancel·lar no esborra res; confirmar l’esborra i el focus torna a la llista', async () => {
    const dir = arbreMultimedia();
    await obri(dir);
    const ops = await operacions('llegeix-me.txt');
    fireEvent.click(within(ops).getByRole('button', { name: 'Eliminar del disc' }));
    let dialeg = await screen.findByRole('dialog', { name: 'Vols eliminar «llegeix-me.txt»?' });
    expect(within(dialeg).getByText('S’esborrarà del disc i no anirà a la Paperera.')).not.toBeNull();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(textFals(dir, 'llegeix-me.txt')).toBe('Llegeix-me\n');
    expect(document.activeElement).toBe(within(ops).getByRole('button', { name: 'Eliminar del disc' }));
    fireEvent.click(within(ops).getByRole('button', { name: 'Eliminar del disc' }));
    dialeg = await screen.findByRole('dialog', { name: 'Vols eliminar «llegeix-me.txt»?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Eliminar definitivament' }));
    expect(await screen.findByText('S’ha esborrat «llegeix-me.txt» del disc.')).not.toBeNull();
    expect(nodeFals(dir, 'llegeix-me.txt')).toBeNull();
    expect(dir.registre.filter(([op]) => op === 'removeEntry')).toEqual([['removeEntry', 'llegeix-me.txt', { recursive: false }]]);
    expect(screen.queryByRole('region', { name: 'llegeix-me.txt' })).toBeNull();
    await waitFor(() => expect(document.activeElement?.textContent).toMatch(/^Fitxers a la vista/));
  });

  test('amb canvis sense desar a l’editor, moure, reanomenar i eliminar queden bloquejats', async () => {
    await obri(arbreMultimedia());
    const ops = await operacions('llegeix-me.txt');
    fireEvent.change(await screen.findByLabelText('Contingut de «llegeix-me.txt»'), { target: { value: 'a mig fer' } });
    expect(within(ops).getByText(/Desa o descarta els canvis del text/)).not.toBeNull();
    expect(within(ops).getByRole('button', { name: 'Moure' }).disabled).toBe(true);
    expect(within(ops).getByRole('button', { name: 'Reanomenar' }).disabled).toBe(true);
    expect(within(ops).getByRole('button', { name: 'Eliminar del disc' }).disabled).toBe(true);
  });

  test('amb la font de només lectura (webkitdirectory) no hi ha cap operació al disc', async () => {
    render(<GestorMultimediaLocal magatzemCarpetes={creaBibliotecaFalsa()} entorn={{}} />);
    const foto = new File([bytesPngFals()], 'foto.png', { type: 'image/png' });
    Object.defineProperty(foto, 'webkitRelativePath', { value: 'arxiu/foto.png' });
    fireEvent.change(screen.getByTestId('input-carpeta-multimedia-local'), { target: { files: [foto] } });
    await screen.findByRole('heading', { name: 'Diagnòstic de «arxiu»' });
    fireEvent.click(tessela('foto.png'));
    await screen.findByRole('region', { name: 'foto.png' });
    expect(screen.queryByRole('region', { name: 'Operacions al disc' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Eliminar del disc' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nova carpeta' })).toBeNull();
  });
});

describe('accions de carpeta', () => {
  test('«Nova carpeta» la crea dins de l’activa, la tria i, buida, es pot eliminar (sense recursive)', async () => {
    const dir = arbreMultimedia();
    await obri(dir);
    fireEvent.click(screen.getByRole('button', { name: 'Nova carpeta' }));
    const nom = screen.getByLabelText('Nom de la carpeta nova');
    fireEvent.change(nom, { target: { value: 'a/b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear la carpeta' }));
    expect(await screen.findByText('Este nom no és vàlid per a un fitxer o una carpeta.')).not.toBeNull();
    fireEvent.change(nom, { target: { value: 'fotos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear la carpeta' }));
    expect(await screen.findByText('S’ha creat la carpeta «fotos».')).not.toBeNull();
    expect(carpetesFalses(dir)).toContain('fotos');
    expect(screen.getByRole('button', { name: /^fotos\s*0$/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Esta carpeta és buida.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar esta carpeta buida' }));
    const dialeg = await screen.findByRole('dialog', { name: 'Vols eliminar la carpeta «fotos»?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Eliminar definitivament' }));
    expect(await screen.findByText('S’ha esborrat la carpeta «fotos».')).not.toBeNull();
    expect(carpetesFalses(dir)).not.toContain('fotos');
    expect(dir.registre.filter(([op]) => op === 'removeEntry').every(([, , o]) => o.recursive === false)).toBe(true);
  });

  test('«Nou fitxer .md» a la carpeta activa el crea i l’obri; una carpeta amb fitxers no oferix eliminar-la', async () => {
    const dir = arbreMultimedia();
    await obri(dir);
    fireEvent.click(screen.getByRole('button', { name: /^00_inbox\s*3$/ }));
    expect(screen.queryByRole('button', { name: 'Eliminar esta carpeta buida' })).toBeNull();
    const accions = screen.getByRole('region', { name: 'Accions de carpeta' });
    fireEvent.click(within(accions).getByRole('button', { name: 'Nou fitxer .md' }));
    expect(within(accions).getByText('Es crearà a «00_inbox»; s’hi afegirà .md si cal.')).not.toBeNull();
    fireEvent.change(within(accions).getByLabelText('Nom del fitxer nou'), { target: { value: 'idees' } });
    fireEvent.click(within(accions).getByRole('button', { name: 'Crear el fitxer' }));
    expect(await screen.findByRole('heading', { name: 'idees.md', level: 3 })).not.toBeNull();
    expect(textFals(dir, '00_inbox/idees.md')).toBe('# idees\n');
    expect(rutesFalses(dir)).toContain('00_inbox/idees.md');
  });
});
