/**
 * carpetes.js — El catàleg de carpetes del Bloc de Notes tal com es pinta:
 * icona per carpeta i la llista sense «Tot». Ho compartixen NotesSection i
 * Connectar (T5), que ha de mostrar les mateixes carpetes amb les mateixes
 * icones sense arrossegar tot l'espai de treball.
 *
 * D1 (ordre del Mestre, 260930) · La carpeta de les connexions és la «Safata
 * d’Entrada». L'id 'f-connectats' és el contracte (dades locals i remotes) i
 * no canvia; el nom visible té una sola font, la llavor (NOTE_FOLDERS_SEED),
 * i ací se'n deriva NOM_CARPETA_CONNECTATS perquè cap vista l'escriga a mà.
 */
import {
  CalendarDays, Folder, GalleryVerticalEnd, Inbox, LandPlot, MapPin, Newspaper, NotebookPen, ShoppingCart
} from 'lucide-react';
/* Gauntlet 261017 (WP7b, P2) · De carpetesSeed.js, la mateixa llavor que
   appSeed.js reexporta: importar-la d'appSeed portava PAGE_COPY al tros
   d'entrada. */
import { NOTE_FOLDERS_SEED } from '../../data/carpetesSeed.js';

export const CARPETA_CONNECTATS = 'f-connectats';

/** El nom visible de la Safata d’Entrada, tal com el porta la llavor. */
export const NOM_CARPETA_CONNECTATS = NOTE_FOLDERS_SEED
  .find((folder) => folder.id === CARPETA_CONNECTATS)?.name || CARPETA_CONNECTATS;

export const ICONA_CARPETA = Object.freeze({
  'f-mur': Newspaper,
  'f-mercat': ShoppingCart,
  'f-pobles': LandPlot,
  'f-media': GalleryVerticalEnd,
  'f-events': CalendarDays,
  'f-mapa': MapPin,
  /* D1 · la safata: tot el que es connecta hi arriba. */
  [CARPETA_CONNECTATS]: Inbox,
  'f-notes': NotebookPen
});

export const iconaDeCarpeta = (id) => ICONA_CARPETA[id] || Folder;

/** Les carpetes del Bloc, sense «Tot»: les del backend o, si no en dona, les
 *  de sèrie. La Safata d’Entrada (T5, D1) és una secció del sistema, com el
 *  Mur o el Mercat: si el backend no la coneix, s'afig davant de «Notes» (o
 *  al final) perquè tota connexió tinga on caure. */
export function carpetesDelBloc(noteFolders) {
  const folders = (Array.isArray(noteFolders) && noteFolders.length ? noteFolders : NOTE_FOLDERS_SEED)
    .filter((folder) => String(folder.id) !== 'f-tot');
  if (folders.some((folder) => String(folder.id) === CARPETA_CONNECTATS)) return folders;
  const connectats = NOTE_FOLDERS_SEED.find((folder) => folder.id === CARPETA_CONNECTATS);
  const posicio = folders.findIndex((folder) => String(folder.id) === 'f-notes');
  return posicio < 0 ? [...folders, connectats] : [...folders.slice(0, posicio), connectats, ...folders.slice(posicio)];
}

/**
 * T7 (P5) · Les carpetes del Bloc en la forma del contracte de les opcions
 * de carpeta: { id, nom, parentId }, ids en text i parentId null a l'arrel.
 * El parentId es conserva: el Workspace ja pinta l'arbre niat. Amb la llavor
 * (plana) totes són arrels i la vista no canvia. On es guarden les carpetes
 * niades ho decidix el Mestre: ací no s'inventa cap magatzem.
 */
export function opcionsDeCarpetes(noteFolders) {
  return carpetesDelBloc(noteFolders).map((folder) => ({
    id: String(folder.id),
    nom: folder.name,
    parentId: folder.parentId == null ? null : String(folder.parentId)
  }));
}
