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
export { getDefaultUserId, idConvidat };

const ONBOARDING_TEMPLATE = {
  company: {
    kind: 'company',
    name: 'Sóc de Poble',
    slug: 'soc-de-poble',
    description: 'Xarxa rural per connectar persones, pobles i projectes amb trellat.'
  },
  group: {
    kind: 'group',
    name: 'Rentonar',
    slug: 'rentonar',
    parentSlug: 'soc-de-poble',
    lema: 'Natura i Patrimoni',
    description: 'Grup de treball de l’Associació ecologista El Rentonar.'
  }
};

/**
 * Genera una còpia neta del pla d'alta. No incorpora usuaris, correus ni cap
 * altra dada personal: els identificadors i la propietat els fixa la BD amb
 * auth.uid() quan s'executa create_organization.
 */
export function createOnboardingSeed() {
  return {
    company: { ...ONBOARDING_TEMPLATE.company },
    group: { ...ONBOARDING_TEMPLATE.group }
  };
}

export const ONBOARDING_SEED = Object.freeze({
  company: Object.freeze({ ...ONBOARDING_TEMPLATE.company }),
  group: Object.freeze({ ...ONBOARDING_TEMPLATE.group })
});

export const NOTE_FOLDERS_SEED = [
  { id: 'f-tot', name: 'Tot', parentId: null },
  { id: 'f-mur', name: 'Mur', parentId: null },
  { id: 'f-mercat', name: 'Mercat', parentId: null },
  { id: 'f-pobles', name: 'Pobles', parentId: null },
  { id: 'f-media', name: 'Multimèdia', parentId: null },
  { id: 'f-events', name: 'Esdeveniments', parentId: null },
  { id: 'f-mapa', name: 'Mapa', parentId: null },
  { id: 'f-notes', name: 'Altres notes', parentId: null }
];

export const NOTES_SEED = [
  {
    id: 'n1',
    isPublished: true,
    title: 'Bloc de notes',
    subtitle: 'El teu estudi d\'escriptura privat i lliure de distraccions',
    author: 'Sóc de Poble',
    authorAvatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
    location: 'La Torre de les Maçanes',
    headerImage: '/assets/system/ui/logo-socdepoble-rect-blanc.svg',
    lead: 'Benvingut al teu nou espai editorial. Aquest és un espai on pots escriure, esborrar i organitzar-te com vulgues sense que ningú ho veja. A continuació t\'expliquem com funciona la màquina d\'escriure de Sóc de Poble.',
    folderId: 'f-mur',
    categoryId: 'c-sistema',
    type: 'rich-text',
    content: `
      <h3>1. La Identitat Visual: Com escrius, com es llig</h3>
      <p>L'editor està dissenyat perquè allò que veus a la pantalla siga exactament allò que llegiran les usuàries quan ho publiques. Sense sorpreses. La imatge de capçalera s'estén d'extrem a extrem, just per damunt de la teua targeta d'autoria. L'estructura de l'article sempre comença amb un gran Títol (H1), un subtítol (H2) que acompanya la lectura, i una entradilla o resum que convida a entrar en matèria.</p>
      
      <h3>2. Les Eines de Text (La Barra Superior)</h3>
      <p>A la part superior tens la barra de ferramentes d'escriptura. Està pensada per a ser ràpida i intuïtiva:</p>
      <ul>
        <li><strong>Estructura:</strong> Pots inserir encapçalaments (Títols i Subtítols d'apartat) per dividir el text en seccions lògiques i donar ritme a la lectura.</li>
        <li><strong>Llistes:</strong> Utilitza les llistes de punts o llistes numerades per enumerar fets, receptes, materials o arguments.</li>
        <li><strong>Estil:</strong> Tens a la teua disposició la negreta per donar èmfasi, la cursiva per a citacions o localismes, i el text ratllat.</li>
        <li><strong>Enllaços i Multimèdia:</strong> Pots incrustar enllaços a altres pàgines web i inserir vídeos directament dins del text.</li>
      </ul>
      
      <h3>3. Organització al Bancal (La Barra Lateral)</h3>
      <p>A l'esquerra tens el teu arxivador privat. Està dividit en diverses seccions perquè no et perdes mai:</p>
      <ul>
        <li><strong>Carpetes:</strong> Pots crear tantes carpetes com necessites per agrupar articles. Per exemple: "Històries del Poble", "Receptes" o "Captures de recerca".</li>
        <li><strong>Categories i Etiquetes:</strong> Abans de publicar, assegura't de classificar bé la teua nota. Aquestes etiquetes apareixeran tant ací a l'editor com en la publicació final al Mur.</li>
      </ul>

      <h3>4. El Procés de Publicació</h3>
      <p>Tot allò que escrius ací es guarda automàticament i és estrictament <strong>privat</strong>. Ningú ho pot veure fins que tu ho decidisques. Quan tingues un article polit, revisat i llest per vore la llum, simplement hauràs de fer servir el botó de publicar (la bola del món superior) per enviar-lo directament al Mur del teu poble o al teu grup de treball.</p>
      
      <p>Ara, torna a la barra lateral esquerra i clica sobre la "Nota Buida" per començar a escriure la teua pròpia història. El llenç és teu!</p>
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
