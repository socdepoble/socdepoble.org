import { BrainCircuit, FileText, GalleryVerticalEnd, LandPlot, Newspaper, NotebookPen, Palette, Route, ShieldCheck, ShoppingCart, Waves, MessageSquare, Wifi, Settings, UserRound, CalendarDays, Network } from 'lucide-react';
import { RUTA_FITXA_IAIA, RUTES_CANONIQUES } from './navigation.js';

/*
 * Ordre del Mestre, 261001 · La secció Calendari ('/calendari',
 * sections/calendari/CalendariSection.jsx) és a SECTIONS i és operativa: el
 * mateix calendari del Mur amb totes les targetes del poble i, si el backend
 * declara la capacitat 'agenda', els actes de Sollutia. Substituïx l'antiga
 * AgendaSection (sections/agenda/), que va eixir de la quarantena de
 * l'auditoria «Sol Muy Alto» com a /calendari i queda sense cap importador.
 */
/* Disseny, Skills, IA i Realitat s'incorporen a la navegació pública a petició de l'usuari */
export const SECTION_ORDER = ['xat', 'mur', 'mercat', 'pobles', 'calendari', 'multimedia', 'dispositius', 'disseny', 'wikidepoble', 'notes', 'projecte', 'constitucio', 'ia', 'roadmap', 'versions', 'legal'];
/* T27 (ordre del Mestre, 260927 nit) · `subrutes`: rutes que viuen dins de la
   jerarquia d'una secció sense penjar del seu path (App.jsx, ActorRoutes).
   La barra principal i la mòbil les encenen com a filles (NavLink matchPaths),
   i també tot el que hi penja amb '/', perquè dins d'una jerarquia la barra
   no quede sense element actiu. Rutes sense pare declarat (cerca, registre,
   connectar, traduccions, page/:slug, consola, admin, el-meu-perfil): no
   encenen cap entrada, per decisió del Mestre.
   T61 (decisió del Mestre, 260928) · el-meu-perfil (i ?organitzacio=…) no és
   filla de Pobles: és l'espai de la identitat activa, s'hi arriba des de la
   barra negra i no des de Pobles, i penjar-la'n encenia Pobles en fals.
   No la torneu a declarar a cap secció (sections.test.js ho comprova).
   Gauntlet 261016 (Bloc 3.5.1) · Les tres rutes canòniques netes
   (RUTES_CANONIQUES, navigation.js: /javillinares, /socdepoble i /rentonar)
   obrin la mateixa fitxa pública que /gent/:id, /empresa/:id i /grup/:id:
   són subrutes de Pobles com elles, i Pobles s'encén igual. Es lligen de la
   seua font, mai escrites ací.
   Gauntlet 261016_1530 (Bloc 3.6.3; relleu F64 i F65) · El manifest
   «L'ànima de la iaia» (secció 'ia', la del desplegable «Sistema») passa de
   /iaia a /anima: és un assaig escrit per la IAIA, no la seua fitxa. /iaia
   és ara la fitxa pública de la IAIA MarIA (RUTA_FITXA_IAIA, navigation.js),
   la mateixa que /perfil/<id>: penja de Pobles com /perfil i les tres rutes
   canòniques, i Pobles s'encén igual.
   Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · /anima ja no porta
   cap subruta: «L'ànima de la iaia» és només l'article editorial del Mur. El
   Selector de Realitat viu al peu de /iaia (la seua secció 'realitat' i la
   subruta '/realitat' d'ací s'han llevat; /realitat redirigix a /iaia). */
export const SECTIONS = [
  { id: 'xat', path: '/xat', label: 'Xat', shortLabel: 'Xat', icon: MessageSquare, kind: 'xat', subrutes: ['/control-xat'] },
  { id: 'mur', path: '/mur', label: 'Mur', shortLabel: 'Mur', icon: Newspaper, kind: 'mur' },
  { id: 'mercat', path: '/mercat', label: 'Mercat', shortLabel: 'Mercat', icon: ShoppingCart, kind: 'market' },
  { id: 'pobles', path: '/pobles', label: 'Pobles', shortLabel: 'Pobles', icon: LandPlot, kind: 'pobles', subrutes: ['/poblacio', '/perfil', '/gent', '/empresa', '/ajuntament', '/grup', ...Object.values(RUTES_CANONIQUES), RUTA_FITXA_IAIA] },
  { id: 'calendari', path: '/calendari', label: 'Calendari', shortLabel: 'Calendari', icon: CalendarDays, kind: 'agenda' },
  { id: 'multimedia', path: '/multimedia', label: 'Multimèdia', shortLabel: 'Media', icon: GalleryVerticalEnd, kind: 'multimedia' },
  { id: 'dispositius', path: '/dispositius', label: 'Dispositius', shortLabel: 'P2P', icon: Wifi, kind: 'infra' },
  { id: 'disseny', path: '/disseny', label: 'Disseny', shortLabel: 'Disseny', icon: Palette, kind: 'text', pageKey: 'disseny' },
  { id: 'wikidepoble', path: '/wikidepoble', label: 'Wiki de Poble', shortLabel: 'Wiki', icon: Waves, kind: 'workspace' },
  { id: 'notes', path: '/notes', label: 'Notes', shortLabel: 'Notes', icon: NotebookPen, kind: 'notes' },
  { id: 'projecte', path: '/projecte', label: 'El projecte', shortLabel: 'Proj.', icon: FileText, kind: 'text', pageKey: 'projecte' },
  { id: 'constitucio', path: '/constitucio', label: 'Constitució', shortLabel: 'Lleis', icon: ShieldCheck, kind: 'text', pageKey: 'constitucio' },
  { id: 'ia', path: '/anima', label: "L'ànima de la iaia", shortLabel: 'IAIA', icon: BrainCircuit, kind: 'text', pageKey: 'anima' },
  { id: 'roadmap', path: '/roadmap', label: 'Full de ruta', shortLabel: 'Ruta', icon: Route, kind: 'text', pageKey: 'roadmap' },
  { id: 'versions', path: '/versions', label: 'Versions', shortLabel: 'Versions', icon: FileText, kind: 'text', pageKey: 'versions' },
  { id: 'legal', path: '/legal', label: 'Legal i privacitat', shortLabel: 'Legal', icon: FileText, kind: 'text', pageKey: 'legal' },
  { id: 'connectar', path: '/connectar', label: 'Connectar', shortLabel: 'Conn', icon: Wifi, kind: 'text' },
  { id: 'control', path: '/control', label: 'Control', shortLabel: 'Control', icon: Settings, kind: 'text' },

  { id: 'poblacio', path: '/poblacio', label: 'Població', shortLabel: 'Gent', icon: UserRound, kind: 'pobles' },
  /* T8 (ordre del Mestre, 261001) · On porta la franja de l'amfitrió: què és
     un node. Pàgina de text (PAGE_COPY.fedivers) fora de SECTION_ORDER: no
     ix a la barra lateral ni al Mur. El pageKey la posa sota la frontissa de
     contingut: cal l'empremta aprovada pel Mestre abans del commit. */
  { id: 'fedivers', path: '/fedivers', label: 'Nodes i Fedivers', shortLabel: 'Nodes', icon: Network, kind: 'text', pageKey: 'fedivers' }
];

export const DEFAULT_SECTION_PATH = '/xat';


