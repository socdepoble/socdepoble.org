// src/sections/multimedia/legacyMedia.js
/* Onada 0.3 (Gauntlet 261016; requisit del Mestre del 261007: «Apartat
   "IAIA" per a les imatges d'IA») · Cada entrada de l'arxiu diu d'on ve
   (`origen`, origenImatges.js):
    · 'ia'   · il·lustració generada amb IA (la Nano Banana, els personatges);
    · 'foto' · fotografia o document real, no generat;
    · 'sistema' · recurs de la interfície (cap, ací).
   Les quatre il·lustracions dels personatges (Carla Soriano, El Viatjant, la
   IAIA MarIA i Sultan) s'etiquetaven «Fotografia històrica / Fotògraf Sóc de
   Poble»: són il·lustracions d'IA (sultan.png és un còmic, verificat a ull a
   l'auditoria MCR del 261016) i ara ho diuen. La foto de perfil de la persona
   pilot és real: origen 'foto', i el seu camí ve de PERSONA_PILOT, la font
   única (identitatsSeed.js), no d'un literal copiat.
   Mòdul de la cadena de la llavor (mediaContent.js el carrega i
   scripts/generate-supabase-seed.mjs, amb node): només imports .js amb
   extensió, cap JSX. identitatsSeed.js només importa agentsSeed.js. */
import { PERSONA_PILOT } from '../../data/identitatsSeed.js';

/* Una il·lustració de la Nano Banana de l'arxiu. */
const nano = (id, title, fitxer) => ({
  id,
  title,
  subtitle: 'Nano Banana',
  description: 'Il·lustració generada per la Nano Banana.',
  src: `/assets/nano_cards/${fitxer}`,
  tag: 'Arxiu',
  kind: 'image',
  source: 'Nano Banana',
  origen: 'ia',
  created_at: '2023-01-01T00:00:00Z',
  sectionId: 'multimedia'
});

/* Una il·lustració d'IA d'un personatge de Sóc de Poble. */
const personatge = (id, title, fitxer) => ({
  id,
  title,
  subtitle: 'Il·lustració d’IA',
  description: 'Il·lustració generada amb IA.',
  src: `/assets/fotos/${fitxer}`,
  tag: 'Arxiu',
  kind: 'image',
  source: 'Sóc de Poble',
  origen: 'ia',
  created_at: '2022-01-01T00:00:00Z',
  sectionId: 'multimedia'
});

export const LEGACY_MEDIA = [
  nano('nano-animalets', 'Animalets', 'animalets_nano_card.jpg'),
  nano('nano-calendari', 'Calendari', 'calendari_nano_card.jpg'),
  nano('nano-cervell', 'Cervell', 'cervell_nano_card.jpg'),
  nano('nano-gestoria', 'Gestoria', 'gestoria_nano_card.jpg'),
  nano('nano-lector', 'Lector RSS', 'lector_rss_nano_card.jpg'),
  nano('nano-mercat', 'Mercat', 'mercat_nano_card.webp'),
  nano('nano-metriques', 'Mètriques', 'metriques_nano_card.jpg'),
  nano('nano-mur', 'Mur', 'mur_nano_card.jpg'),
  nano('nano-snippet', 'Snippet', 'snippet_nano_card.jpg'),
  nano('nano-vehicle', 'Vehicle', 'vehicle_nano_card.jpg'),
  personatge('foto-carla', 'Carla Soriano', 'carla-soriano.png'),
  personatge('foto-viatjant', 'El Viatjant', 'el-viatjant.png'),
  personatge('foto-iaia', 'IAIA MarIA', 'iaia-maria.png'),
  {
    id: 'foto-javi',
    title: 'Javi Llinares',
    subtitle: 'Fotografia històrica',
    description: 'Arxiu fotogràfic.',
    src: PERSONA_PILOT.avatar,
    tag: 'Arxiu',
    kind: 'image',
    source: 'Fotògraf Sóc de Poble',
    /* Revisió adversarial del 261016 (M06: «desconegut sense inventar») ·
       `source` diu d'on ve la foto a l'arxiu, no qui la va fer: el fotògraf no
       consta, i el visor diu «Autor: Desconegut» (panellDeLaFoto.js ·
       autorDeclarat). La font es queda (el Cercador la pinta). */
    autor: null,
    origen: 'foto',
    /* La foto d'una persona: el visor no en mostra la ubicació (origenImatges.js). */
    ambit: 'persona',
    created_at: '2022-01-01T00:00:00Z',
    sectionId: 'multimedia'
  },
  personatge('foto-sultan', 'Sultan', 'sultan.png')
];
