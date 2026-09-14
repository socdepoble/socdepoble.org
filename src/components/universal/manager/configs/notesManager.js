import { FileText, Inbox, Newspaper, ShoppingCart, LandPlot, GalleryVerticalEnd, NotebookPen, Calendar, MapPinned } from 'lucide-react';

const FOLDER_ICONS = {
  'f-tot': Inbox,
  'f-mur': Newspaper,
  'f-mercat': ShoppingCart,
  'f-pobles': LandPlot,
  'f-media': GalleryVerticalEnd,
  'f-events': Calendar,
  'f-mapa': MapPinned,
  'f-notes': NotebookPen
};

export function buildNotesFacets(noteFolders = []) {
  // 1. Faceta de carpetes
  const folderOptions = noteFolders.map(f => {
    const Icon = FOLDER_ICONS[f.id] || NotebookPen;
    return {
      id: f.id,
      label: f.name,
      icon: Icon,
      isGlobal: !!FOLDER_ICONS[f.id]
    };
  });

  const folderFacet = {
    id: 'folderId',
    label: 'CARPETES',
    title: 'CARPETES',
    type: 'tree',
    hideHeader: true,
    options: folderOptions,
    getValue: (item) => item.folderId
  };

  // 2. Faceta de categories
  const categoryFacet = {
    id: 'category',
    label: 'CATEGORIES',
    title: 'CATEGORIES',
    type: 'flat',
    options: [
      { id: 'Sistema', label: 'Sistema' },
      { id: 'Productivitat', label: 'Productivitat' }
    ],
    getValue: (item) => item.category
  };

  // 3. Faceta d'etiquetes
  const tagsFacet = {
    id: 'tags',
    label: 'ETIQUETES',
    title: 'ETIQUETES',
    type: 'flat',
    options: [
      { id: 'Tutorial', label: 'Tutorial' }
    ],
    getValue: (item) => item.tags || []
  };

  return [folderFacet, categoryFacet, tagsFacet];
}

export const notesManagerConfig = {
  id: 'notes',
  title: 'Notes',
  icon: FileText,
  getItemId: (item) => item.id,
  getItemSearchText: (item) => item.searchText || item.title || '',
  getItemCard: (nota) => ({
    titol: nota.title || 'Sense títol',
    subtitol: nota.lead || nota.subtitle,
    imatge: nota.coverImage || nota.heroImage,
    icona: FOLDER_ICONS[nota.folderId] || NotebookPen,
  }),
};
