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
 *
 * P1-22 (marató 261101_2143, B3-I18N §3.A) · El nom de les carpetes de sèrie
 * es tradueix NOMÉS en pintar-lo (nomDeCarpeta): la llavor és dada (va a
 * app_content.noteFolders i el folder_id hi apunta) i no es toca mai.
 * carpetesDelBloc continua tornant les dades crues, que són les que es desen.
 */
import {
  CalendarDays, Folder, GalleryVerticalEnd, Inbox, LandPlot, Layers, MapPin, Newspaper, NotebookPen, ShoppingCart, SquarePen
} from 'lucide-react';
/* Gauntlet 261017 (WP7b, P2) · De carpetesSeed.js, la mateixa llavor que
   appSeed.js reexporta: importar-la d'appSeed portava PAGE_COPY al tros
   d'entrada. */
import { NOTE_FOLDERS_SEED } from '../../data/carpetesSeed.js';

export const CARPETA_CONNECTATS = 'f-connectats';
export const CARPETA_EN_PRODUCCIO = 'f-produccio';
export const CARPETA_SISTEMA = 'f-sistema';

/** El nom visible de la Safata d’Entrada, tal com el porta la llavor. */
export const NOM_CARPETA_CONNECTATS = NOTE_FOLDERS_SEED
  .find((folder) => folder.id === CARPETA_CONNECTATS)?.name || CARPETA_CONNECTATS;

export const ICONA_CARPETA = Object.freeze({
  'f-mur': Newspaper,
  [CARPETA_SISTEMA]: Layers,
  'f-mercat': ShoppingCart,
  'f-pobles': LandPlot,
  'f-media': GalleryVerticalEnd,
  'f-events': CalendarDays,
  'f-mapa': MapPin,
  /* D1 · la safata: tot el que es connecta hi arriba. */
  [CARPETA_CONNECTATS]: Inbox,
  /* IDEA-358 · notes en elaboració activa abans de passar a publicació. La seua
     icona no és la d'«Altres notes»: és la ploma sobre el full (SquarePen), la
     mateixa de l'«Editar» i del panell de visibilitat de l'editor del Bloc, que
     ja la porten al seu tros diferit. carpetes.js no és al nucli d'arrencada. */
  [CARPETA_EN_PRODUCCIO]: SquarePen,
  'f-notes': NotebookPen
});

export const iconaDeCarpeta = (id) => ICONA_CARPETA[id] || Folder;

/* Com abastConnexio.js: sense portar UIContext a un mòdul pur. */
const text = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
const parellCarpeta = (nom, reserva) => Object.freeze([`section.notes.carpeta.${nom}`, reserva]);

/* Els noms visibles de les carpetes de sèrie: la reserva és el nom de la
   llavor amb el mateix id (ho guarda i18n.p122.test.js). La Safata d’Entrada
   és un nom propi (D1, i així la diuen es/en/eu/gl a section.connectar.*):
   no en porta (D-1 de B3-I18N, reversible afegint-la ací). */
export const NOMS_CARPETES_DE_SERIE = Object.freeze({
  'f-mur': parellCarpeta('mur', 'Mur'),
  'f-mercat': parellCarpeta('mercat', 'Mercat'),
  'f-pobles': parellCarpeta('pobles', 'Pobles'),
  'f-media': parellCarpeta('media', 'Multimèdia'),
  'f-events': parellCarpeta('events', 'Esdeveniments'),
  'f-mapa': parellCarpeta('mapa', 'Mapa'),
  'f-produccio': parellCarpeta('produccio', 'En producció'),
  'f-notes': parellCarpeta('notes', 'Altres notes')
});

/** El nom que es pinta d'una carpeta ({ id, name } o { id, nom }): traduït
 *  només si l'id és de sèrie I el nom és encara el de la llavor; si no (una
 *  carpeta reanomenada o pròpia), tal com es va desar. Cap dada canvia. */
export function nomDeCarpeta(carpeta, t = null) {
  const nom = carpeta?.name ?? carpeta?.nom;
  const id = String(carpeta?.id);
  const parell = Object.hasOwn(NOMS_CARPETES_DE_SERIE, id) ? NOMS_CARPETES_DE_SERIE[id] : null;
  const [, deLaLlavor] = parell ?? [];
  return parell && nom === deLaLlavor ? text(t, parell) : nom;
}

/** Les carpetes del Bloc, sense «Tot»: les del backend o, si no en dona, les
 *  de sèrie. La Safata d’Entrada (T5, D1) i «En producció» (IDEA-358) són
 *  carpetes del sistema: si el backend no les coneix, s'afigen davant d'«Altres
 *  notes» (o al final) perquè tota connexió i tot esborrany tinga el seu lloc.
 *  v1.2.26 (Lent 1, punt 10) · Amb `{ afigSafata: false }`, només s'afig «En
 *  producció»: és la llista de destinacions del selector de carpeta de
 *  l'editor, on la Safata només ix si el servidor (o la llavor) ja la porta,
 *  com abans. Si la Safata ha de ser destinació manual ho decidix el Mestre. */
export function carpetesDelBloc(noteFolders, { afigSafata = true } = {}) {
  let folders = (Array.isArray(noteFolders) && noteFolders.length ? noteFolders : NOTE_FOLDERS_SEED)
    .filter((folder) => String(folder.id) !== 'f-tot');
  for (const idSistema of afigSafata ? [CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO] : [CARPETA_EN_PRODUCCIO]) {
    if (folders.some((folder) => String(folder.id) === idSistema)) continue;
    const seed = NOTE_FOLDERS_SEED.find((folder) => folder.id === idSistema);
    if (!seed) continue;
    const posicio = folders.findIndex((folder) => String(folder.id) === 'f-notes');
    folders = posicio < 0 ? [...folders, seed] : [...folders.slice(0, posicio), seed, ...folders.slice(posicio)];
  }
  return folders;
}

/**
 * T7 (P5) · Les carpetes del Bloc en la forma del contracte de les opcions
 * de carpeta: { id, nom, parentId }, ids en text i parentId null a l'arrel.
 * El parentId es conserva: el Workspace ja pinta l'arbre niat. Amb la llavor
 * (plana) totes són arrels i la vista no canvia. On es guarden les carpetes
 * niades ho decidix el Mestre: ací no s'inventa cap magatzem.
 * P1-22 · `nom` és el que es pinta (nomDeCarpeta, en la llengua de `t`); l'id
 * és el que es desa.
 */
export function opcionsDeCarpetes(noteFolders, t = null) {
  return carpetesDelBloc(noteFolders).map((folder) => ({
    id: String(folder.id),
    nom: nomDeCarpeta(folder, t),
    parentId: folder.parentId == null ? null : String(folder.parentId)
  }));
}
