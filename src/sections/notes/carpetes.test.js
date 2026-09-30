/**
 * D1 (ordre del Mestre, 260930) · La Safata d’Entrada és la carpeta
 * 'f-connectats' de sempre amb un nom visible nou: l'id és el contracte de
 * les dades locals i remotes i no canvia; el nom té una sola font, la llavor.
 */
import { expect, test } from 'vitest';
import { Folder, Inbox } from 'lucide-react';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';
import { CARPETA_CONNECTATS, NOM_CARPETA_CONNECTATS, carpetesDelBloc, iconaDeCarpeta } from './carpetes.js';

test('la carpeta de les connexions es diu «Safata d’Entrada» i conserva l’id f-connectats', () => {
  expect(CARPETA_CONNECTATS).toBe('f-connectats');
  expect(NOM_CARPETA_CONNECTATS).toBe('Safata d’Entrada');
  expect(NOM_CARPETA_CONNECTATS).toContain('’');
  const deLaLlavor = NOTE_FOLDERS_SEED.find((carpeta) => carpeta.id === 'f-connectats');
  expect(deLaLlavor).toEqual({ id: 'f-connectats', name: NOM_CARPETA_CONNECTATS, parentId: null });
  expect(NOTE_FOLDERS_SEED.some((carpeta) => carpeta.name === 'Connectats')).toBe(false);
});

test('la icona de la safata és Inbox; una carpeta desconeguda, la de sèrie', () => {
  expect(iconaDeCarpeta(CARPETA_CONNECTATS)).toBe(Inbox);
  expect(iconaDeCarpeta('f-inventada')).toBe(Folder);
});

test('carpetesDelBloc: sense «Tot», i la safata sempre present, davant d’«Altres notes» o al final', () => {
  const sencer = carpetesDelBloc([]);
  expect(sencer.some((carpeta) => carpeta.id === 'f-tot')).toBe(false);
  expect(sencer.find((carpeta) => carpeta.id === CARPETA_CONNECTATS).name).toBe(NOM_CARPETA_CONNECTATS);
  const senseSafata = carpetesDelBloc([{ id: 'f-mur', name: 'Mur' }, { id: 'f-notes', name: 'Altres notes' }]);
  expect(senseSafata.map((carpeta) => carpeta.id)).toEqual(['f-mur', CARPETA_CONNECTATS, 'f-notes']);
  expect(carpetesDelBloc([{ id: 'f-mur', name: 'Mur' }]).map((carpeta) => carpeta.id)).toEqual(['f-mur', CARPETA_CONNECTATS]);
  // Si el backend ja la porta, amb el seu nom, mana el del backend (l'id és el contracte).
  const delBackend = carpetesDelBloc([{ id: CARPETA_CONNECTATS, name: 'Nom del servidor' }]);
  expect(delBackend).toEqual([{ id: CARPETA_CONNECTATS, name: 'Nom del servidor' }]);
});
