/**
 * carpetes.js — El catàleg de carpetes del Bloc de Notes tal com es pinta:
 * icona per carpeta i la llista sense «Tot». Ho compartixen NotesSection i
 * Connectar (T5), que ha de mostrar les mateixes carpetes amb les mateixes
 * icones sense arrossegar tot l'espai de treball.
 */
import {
  CalendarDays, Folder, GalleryVerticalEnd, LandPlot, Link2, MapPin, Newspaper, NotebookPen, ShoppingCart
} from 'lucide-react';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';

export const CARPETA_CONNECTATS = 'f-connectats';

export const ICONA_CARPETA = Object.freeze({
  'f-mur': Newspaper,
  'f-mercat': ShoppingCart,
  'f-pobles': LandPlot,
  'f-media': GalleryVerticalEnd,
  'f-events': CalendarDays,
  'f-mapa': MapPin,
  [CARPETA_CONNECTATS]: Link2,
  'f-notes': NotebookPen
});

export const iconaDeCarpeta = (id) => ICONA_CARPETA[id] || Folder;

/** Les carpetes del Bloc, sense «Tot»: les del backend o, si no en dona, les
 *  de sèrie. «Connectats» (T5) és una secció del sistema, com el Mur o el
 *  Mercat: si el backend no la coneix, s'afig davant de «Notes» (o al final)
 *  perquè tota connexió tinga on caure. */
export function carpetesDelBloc(noteFolders) {
  const folders = (Array.isArray(noteFolders) && noteFolders.length ? noteFolders : NOTE_FOLDERS_SEED)
    .filter((folder) => String(folder.id) !== 'f-tot');
  if (folders.some((folder) => String(folder.id) === CARPETA_CONNECTATS)) return folders;
  const connectats = NOTE_FOLDERS_SEED.find((folder) => folder.id === CARPETA_CONNECTATS);
  const posicio = folders.findIndex((folder) => String(folder.id) === 'f-notes');
  return posicio < 0 ? [...folders, connectats] : [...folders.slice(0, posicio), connectats, ...folders.slice(posicio)];
}
