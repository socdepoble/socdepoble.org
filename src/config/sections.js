import { BrainCircuit, FileText, GalleryVerticalEnd, LandPlot, Newspaper, NotebookPen, Palette, Route, ShieldCheck, ShoppingCart, Waves, MessageSquare, Wifi, Settings, UserRound } from 'lucide-react';

/* Disseny, Skills, IA i Realitat s'incorporen a la navegació pública a petició de l'usuari */
export const SECTION_ORDER = ['xat', 'mur', 'mercat', 'pobles', 'multimedia', 'notes', 'dispositius', 'projecte', 'constitucio', 'disseny', 'skills', 'ia', 'roadmap', 'versions', 'legal'];
export const SECCIONS_INTERNES = ['realitat'];

export const SECTIONS = [
  { id: 'xat', path: '/xat', label: 'Xat', shortLabel: 'Xat', icon: MessageSquare, kind: 'xat' },
  { id: 'mur', path: '/mur', label: 'Mur', shortLabel: 'Mur', icon: Newspaper, kind: 'mur' },
  { id: 'mercat', path: '/mercat', label: 'Mercat', shortLabel: 'Mercat', icon: ShoppingCart, kind: 'market' },
  { id: 'pobles', path: '/pobles', label: 'Pobles', shortLabel: 'Pobles', icon: LandPlot, kind: 'pobles' },
  { id: 'multimedia', path: '/multimedia', label: 'Multimèdia', shortLabel: 'Media', icon: GalleryVerticalEnd, kind: 'multimedia' },
  { id: 'notes', path: '/notes', label: 'Notes', shortLabel: 'Notes', icon: NotebookPen, kind: 'notes' },
  { id: 'dispositius', path: '/dispositius', label: 'Dispositius', shortLabel: 'P2P', icon: Wifi, kind: 'infra' },
  { id: 'projecte', path: '/projecte', label: 'El projecte', shortLabel: 'Proj.', icon: FileText, kind: 'text', pageKey: 'projecte' },
  { id: 'constitucio', path: '/constitucio', label: 'Constitució', shortLabel: 'Lleis', icon: ShieldCheck, kind: 'text', pageKey: 'constitucio' },
  { id: 'disseny', path: '/disseny', label: 'Disseny', shortLabel: 'Disseny', icon: Palette, kind: 'text', pageKey: 'disseny' },
  { id: 'skills', path: '/skills', label: 'Skills', shortLabel: 'Skills', icon: Waves, kind: 'text', pageKey: 'skills' },
  { id: 'ia', path: '/ia', label: "L'ànima de la iaia", shortLabel: 'IAIA', icon: BrainCircuit, kind: 'text', pageKey: 'anima' },
  { id: 'roadmap', path: '/roadmap', label: 'Full de ruta', shortLabel: 'Ruta', icon: Route, kind: 'text', pageKey: 'roadmap' },
  { id: 'versions', path: '/versions', label: 'Versions', shortLabel: 'Versions', icon: FileText, kind: 'text', pageKey: 'versions' },
  { id: 'legal', path: '/legal', label: 'Legal i privacitat', shortLabel: 'Legal', icon: FileText, kind: 'text', pageKey: 'legal' },
  { id: 'connectar', path: '/connectar', label: 'Connectar', shortLabel: 'Conn', icon: Wifi, kind: 'text' },
  { id: 'control', path: '/control', label: 'Control', shortLabel: 'Control', icon: Settings, kind: 'text' },

  { id: 'poblacio', path: '/poblacio', label: 'Població', shortLabel: 'Gent', icon: UserRound, kind: 'pobles' },
  { id: 'realitat', path: '/realitat', label: 'Realitat', shortLabel: 'Real', icon: BrainCircuit, kind: 'text' }
];

export const DEFAULT_SECTION_PATH = '/xat';


