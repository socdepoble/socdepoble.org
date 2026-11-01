import {
  AGENT_LIST,
  EVENTS,
  FEED_POSTS,
  MARKET_ITEMS,
  MEDIA_ITEMS,
  PAGE_COPY,
  TOWNS
} from './sectionContent.js';

export const APP_SEED_VERSION = 250035;
import { getDefaultUserId, idConvidat } from './identitat.js';
import { ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, entitatSeed } from './identitatsSeed.js';
export { getDefaultUserId, idConvidat };

/* El pla d'alta (la fila 'onboarding' d'app_content). No incorpora usuaris,
   correus ni cap altra dada personal: els identificadors i la propietat els
   fixa la BD amb auth.uid() quan s'executa create_organization.
   Auditoria 261007 (B) · L'slug de l'entitat pilot ve de la taula única
   d'identitats (identitatsSeed.js, ENTITAT_PILOT_SLUG): ací no es copia cap
   identificador. Cap codi de src no llig esta fila en temps d'execució; només
   viatja a supabase/seed.sql quan es regenera amb el seu script.
   createOnboardingSeed() s'ha retirat: no la cridava ningú.
   Front 3 (261013) · El grup també: Rentonar ja és una entitat de la taula
   única, i el seu tipus, nom, slug, lema i descripció es lligen de la seua
   fila. Els valors són els d'abans, i la fila d'app_content no canvia. */
const RENTONAR = entitatSeed(ENTITAT_RENTONAR_SLUG);
const ONBOARDING_TEMPLATE = {
  company: {
    kind: 'company',
    name: 'Sóc de Poble',
    slug: ENTITAT_PILOT_SLUG,
    description: 'Xarxa rural per connectar persones, pobles i projectes amb trellat.'
  },
  group: {
    kind: RENTONAR.kind,
    name: RENTONAR.name,
    slug: RENTONAR.slug,
    parentSlug: ENTITAT_PILOT_SLUG,
    lema: RENTONAR.lema,
    description: RENTONAR.description
  }
};

export const ONBOARDING_SEED = Object.freeze({
  company: Object.freeze({ ...ONBOARDING_TEMPLATE.company }),
  group: Object.freeze({ ...ONBOARDING_TEMPLATE.group })
});

/* Gauntlet 261017 (WP7b, P2) · Les carpetes de sèrie viuen a carpetesSeed.js
   perquè el catàleg de carpetes del tros d'entrada no arrossegue esta llavor
   (ni PAGE_COPY). Ací es reexporten: el mateix objecte, la mateixa API. */
import { NOTE_FOLDERS_SEED } from './carpetesSeed.js';
export { NOTE_FOLDERS_SEED };

export const NOTES_SEED = [
  {
    id: 'n1',
    isPublished: true,
    title: 'Bloc de notes',
    subtitle: 'El teu estudi d\'escriptura privat i lliure de distraccions',
    author: 'Sóc de Poble',
    authorAvatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
    location: 'La Torre de les Maçanes',
    logoImage: '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png',
    /* IDEA-59 / P1-72 (Mestre 261101, punt 0) · Les etiquetes de la Card que
       es restituïx (captura 01_produccio/261101_0256_card_bloc_de_notes_ploma.jpg). */
    labels: ['General', 'Mur', 'Productivitat', 'Tutorial'],
    copyright: '© Sóc de Poble / Fet per la IAIA i Nano Banana',
    lead: 'Benvingut al teu nou espai editorial. Aquest és un espai on pots escriure, esborrar i organitzar-te com vulgues sense que ningú ho veja. A continuació t\'expliquem com funciona la màquina d\'escriure de Sóc de Poble.',
    folderId: 'f-mur',
    categoryId: 'c-sistema',
    type: 'rich-text',
    /* Gauntlet 261101 · X-C-notes (C-07) · L'última frase val amb sessió i
       sense: sense sessió (dades remotes) no hi ha «CREAR NOTA» i la Card li
       diu que primer ha d'entrar.
       Gauntlet 2 · 261101 · Y-Notes (G2-N-06) · A l'editor de Notes, entre
       l'entradilla i la barra d'eines hi ha l'«Edició avançada» plegada
       (NotesEditor · edicioAvancada, UniversalEditorShell): el text diu on és
       de veritat la barra. */
    content: `
      <h3>1. La Identitat Visual: Com escrius, com es llig</h3>
      <p>L'editor està dissenyat perquè allò que veus a la pantalla siga exactament allò que llegiran les usuàries quan ho publiques. Sense sorpreses. La imatge de capçalera s'estén d'extrem a extrem, just per damunt de la teua targeta d'autoria. L'estructura de l'article sempre comença amb un gran Títol (H1), un subtítol (H2) que acompanya la lectura, i una entradilla o resum que convida a entrar en matèria.</p>
      
      <h3>2. Les Eines de Text (la barra d'eines)</h3>
      <p>Davall de l'entradilla, just després del desplegable «Edició avançada», tens la barra d'eines d'escriptura. Està pensada per a ser ràpida i intuïtiva:</p>
      <ul>
        <li><strong>Estructura:</strong> El desplegable d'encapçalaments (H3, H4, H5, H6 i H2) divideix el text en seccions i dona ritme a la lectura.</li>
        <li><strong>Llistes:</strong> Utilitza les llistes de punts o les numerades per a enumerar fets, receptes, materials o arguments.</li>
        <li><strong>Estil:</strong> Tens la negreta per a donar èmfasi i la cursiva per a citacions o localismes. Al botó «⋯» hi ha més eines: el text ratllat, la citació i el divisor.</li>
        <li><strong>Enllaços i imatges:</strong> Un enllaç enganxat al text es queda com a enllaç, i escrivint «/» pots inserir una imatge, una targeta o un emoji.</li>
      </ul>
      
      <h3>3. Organització al Bancal (la columna de l'esquerra)</h3>
      <p>A l'esquerra tens el teu arxivador privat. Està dividit en diverses seccions perquè no et perdes mai:</p>
      <ul>
        <li><strong>Carpetes:</strong> Cada nota viu en una de les carpetes del Bloc. La tries a l'«Edició avançada» de la nota.</li>
        <li><strong>Categories i Etiquetes:</strong> Abans de publicar, assegura't de classificar bé la teua nota. Aquestes etiquetes apareixeran tant ací a l'editor com en la publicació final al Mur.</li>
      </ul>

      <h3>4. El Procés de Publicació</h3>
      <p>Tot allò que escrius ací es guarda automàticament i és estrictament <strong>privat</strong>. Ningú ho pot veure fins que tu ho decidisques. Quan tingues un article polit, revisat i llest per vore la llum, simplement hauràs de fer servir el botó «Publicar» de la barra d'eines per a enviar-lo al Mur del teu poble o al teu grup de treball.</p>
      
      <p>Ara, prem «CREAR NOTA», dalt de la columna de les notes, per a començar a escriure la teua pròpia història (si no hi veus el botó, primer entra amb el teu compte). El llenç és teu!</p>
    `,
    category: 'Productivitat',
    tags: ['Tutorial'],
    heroImage: '/assets/notes/bloc_notes_vintage.jpg',
    createdAt: '2026-04-25T09:00:00.000Z',
    updatedAt: '2026-04-25T09:00:00.000Z'
  },
  {
    id: 'n2',
    isPublished: false,
    title: '',
    subtitle: '',
    lead: '',
    categoryId: null,
    folderId: 'f-mur',
    type: 'rich-text',
    content: '',
    category: null,
    tags: [],
    createdAt: '2026-06-25T10:00:00.000Z',
    updatedAt: '2026-06-25T10:00:00.000Z'
  }
];

export const PAGES_SEED = Object.entries(PAGE_COPY).map(([key, page]) => ({
  id: key,
  key,
  ...page
}));





export const APP_SEED = {
  agents: AGENT_LIST,
  feedPosts: FEED_POSTS,
  marketItems: MARKET_ITEMS,
  events: EVENTS,
  towns: TOWNS,
  mediaItems: MEDIA_ITEMS,
  noteFolders: NOTE_FOLDERS_SEED,
  notes: NOTES_SEED,
  pages: PAGES_SEED,
  onboarding: ONBOARDING_SEED
};

export const APP_CONTENT_ROWS = [
  { key: 'agents', payload: AGENT_LIST },
  { key: 'feedPosts', payload: FEED_POSTS },
  { key: 'marketItems', payload: MARKET_ITEMS },
  { key: 'events', payload: EVENTS },
  { key: 'towns', payload: TOWNS },
  { key: 'mediaItems', payload: MEDIA_ITEMS },
  { key: 'noteFolders', payload: NOTE_FOLDERS_SEED },
  { key: 'notes', payload: NOTES_SEED },
  { key: 'pages', payload: PAGES_SEED },
  { key: 'onboarding', payload: ONBOARDING_SEED }
].map((row) => ({
  ...row,
  version: APP_SEED_VERSION
}));
