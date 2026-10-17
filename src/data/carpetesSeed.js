/**
 * carpetesSeed.js — Les carpetes de sèrie del Bloc de Notes (NOTE_FOLDERS_SEED).
 *
 * Gauntlet 261017 (WP7b, P2) · Viuen ací, soles, perquè el catàleg de
 * carpetes (sections/notes/carpetes.js), que va al tros d'entrada, les puga
 * llegir sense arrossegar la llavor sencera d'appSeed.js (sectionContent.js i
 * PAGE_COPY, uns 141 KB minificats). appSeed.js les reexporta: la seua API i
 * el seu APP_SEED.noteFolders són el mateix objecte que abans, i la fila
 * 'noteFolders' d'app_content no canvia.
 */
export const NOTE_FOLDERS_SEED = [
  { id: 'f-tot', name: 'Tot', parentId: null },
  { id: 'f-mur', name: 'Mur', parentId: null },
  { id: 'f-mercat', name: 'Mercat', parentId: null },
  { id: 'f-pobles', name: 'Pobles', parentId: null },
  { id: 'f-media', name: 'Multimèdia', parentId: null },
  { id: 'f-events', name: 'Esdeveniments', parentId: null },
  { id: 'f-mapa', name: 'Mapa', parentId: null },
  /* T5 · la safata de les connexions: tot el que la persona connecta d'altri
     entra ací i des d'ací es distribuïx a les carpetes pròpies.
     D1 (ordre del Mestre, 260930) · el nom visible és «Safata d’Entrada»;
     l'id no canvia: les notes locals i les remotes (folder_id) continuen
     sent vàlides. */
  { id: 'f-connectats', name: 'Safata d’Entrada', parentId: null },
  { id: 'f-notes', name: 'Altres notes', parentId: null }
];
