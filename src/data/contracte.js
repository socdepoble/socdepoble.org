/* SDP-LOCK */
/* T5 (ordre del Mestre, 260930) · Forma de loadMur().events[], els actes del
   Mur. Cap taula no té columna de dia de l'acte: viu al payload, sense cap
   migració.
     date?          'AAAA-MM-DD', el dia de paret del poble, sense fus. Només
                    si qui el publica n'ha triat un: cap adaptador el deriva de
                    created_at.
     time?          'HH:MM', l'hora de paret del poble.
     inici?, fi?, zona?, uid?, recurrencia?
                    en el format del model d'esdeveniment
                    (src/utils/esdeveniment.js), tal qual.
     created_at, updated_at
                    la publicació i l'última edició: un instant, mai el dia en
                    què passa l'acte.
   De l'element al model, una sola funció pura (acteAEsdeveniment,
   src/sections/mur/agendaMur.js): qualsevol backend que torne este payload
   funciona igual, i la interfície no llig cap columna com a dia de l'acte. */
export const CONTRACTE_NUCLI = Object.freeze([
  'loadCoreContent',
  'loadMur',
  'loadMultimedia',
  'loadNotes',
  'appendChatMessages',
  'appendSectionSubmissionNetworkOnly',
  'updateNote',
  'loginWithMagicLink',
  'registerWithPassword',
  'loginWithPassword',
  'loginWithGoogle',
  'listMyOrganizations',
  'createOrganization',
  'updateOrganization',
  'updateProfile',
  'updateUserPassword',
  'getProfile',
  'recullTornadaOAuth',
  'logout',
  'getCurrentUser',
  'getBackendConfigurat',
  'getRuntimeDataMode',
  'getDefaultUserId',
  'createNote',
  'loadFils',
  'loadMissatges',
  'enviaMissatge',
  'marcaLlegit',
  'creaFilDirecte',
  'carregaMembres',
  'subscribeToXat',
  'unsubscribeFromXat'
]);

export const CAPACITATS = Object.freeze({
  sessioExterna: Object.freeze(['adoptaSessioExterna']),
  paginacioNotes: Object.freeze(['loadNotesPage']),
  admin: Object.freeze([
    'adminListUsers',
    'adminListOrganizations'
  ]),

  sessio: Object.freeze([
    'refrescaSessio',
    'elMeuRol'
  ]),
  /* Fase 4. No és nucli a posta: un backend sense Storage segueix sent
     vàlid i la interfície cau cap a data URL. teCapacitat('mitjans')
     és l'única manera legítima de preguntar-ho. */
  mitjans: Object.freeze([
    'uploadToStorage',
    'getPublicUrl',
    'resolveAsset',
    'promoteToPublic'
  ]),
  agenda: Object.freeze([
    'loadActesAgenda'
  ]),
  /* Fase 1 · Compte i consentiment. Opcionals a posta: la portabilitat i la
     supressió (RGPD arts. 20 i 17) i el consentiment demostrable (art. 7.1)
     són deures d'este node sobre Supabase, no del contracte. Un node sense
     elles —un altre Sóc de Poble federat sobre WordPress o en local— continua
     sent vàlid; la interfície ho pregunta amb teCapacitat('compte') i
     teCapacitat('consentiment'). */
  compte: Object.freeze([
    'exportaLesMeuesDades',
    'estatBaixa',
    'demanaBaixa',
    'cancelaBaixa'
  ]),
  consentiment: Object.freeze([
    'estatConsentiment',
    'registraConsentiment',
    'revocaConsentiment'
  ]),
  /* Cicle de vida de les notes: paperera, arxiu i esborrat definitiu.
     Opcional a posta: un backend injectat sense ella continua sent vàlid i
     l'editor no pinta «Borrar». La interfície ho pregunta amb
     teCapacitat('cicleNotes'). */
  cicleNotes: Object.freeze([
    'mouNota',
    'esborraNota'
  ]),
  /* Lògica d'Usuari (T4): la fitxa pública d'una persona, una entitat o un
     agent IA per id o slug. Opcional a posta: sense ella, la pàgina de perfil
     cau al catàleg d'agents del contingut base i no promet res més. */
  directori: Object.freeze([
    'loadPerfilPublic'
  ]),
  /* Agents IA que la persona administra (la IAIA): fitxa editable des del
     Workspace amb el mateix Editor Universal. Opcional: un node sense agents
     continua sent vàlid i el Perfil no pinta el grup. */
  agents: Object.freeze([
    'listMyAgents',
    'updateAgent'
  ]),
  /* T43 (ordre del Mestre, 260928) · Connectar-se a una organització per a
     administrar-la (en remot, una petició que revisa l'equip de Sóc de
     Poble). Opcional: sense ella la vista Connectar ho diu i no promet res. */
  reclamacions: Object.freeze([
    'reclamaOrganitzacio',
    'lesMevesReclamacions'
  ]),
  /* T43 · El correu opcional d'una organització: privat per a qui
     l'administra i, si vol, visible a la fitxa pública. Opcional: sense
     ella «El compte» de l'organització ho diu i no el demana. */
  contacteOrganitzacio: Object.freeze([
    'llegeixContacteOrganitzacio',
    'desaContacteOrganitzacio'
  ]),
  /* T63.2 i T67 · El xat comú d'una Pàgina Universal: troba o crea el grup
     (o la comunitat amb «Avisos» i «General») del subjecte i en torna el fil
     de destinació. Opcional a posta: un node sense ella continua sent vàlid
     i «Comentar» ho diu amb un avís honest. La interfície ho pregunta amb
     teCapacitat('xatDePagina'). Forma: obriFilDePagina(objecte, config) →
     { filId, fils: Conversa[] } o null si el subjecte no té xat. */
  xatDePagina: Object.freeze([
    'obriFilDePagina'
  ])
});

export const CONTRACTE_BACKEND = Object.freeze([
  ...CONTRACTE_NUCLI,
  ...Object.values(CAPACITATS).flat()
]);

/* ── T63.2 i T67 · Qui té xat de pàgina ─────────────────────────────────
   Una sola llista blanca per a tots els adaptadors de 'xatDePagina' (la
   llavor, Supabase i qualsevol node federat): una entitat, un poble o una
   organització són una COMUNITAT (amb «Avisos» i «General»); la resta és un
   GRUP. Les notes, carpetes, categories, etiquetes, persones i IA no en
   tenen: persona i IA continuen amb el missatge directe. Els noms són els de
   TIPUS_OBJECTE (origenNota.js). 'organitzacio' és un àlies d'entitat: es
   guarda com a 'entitat', perquè la mateixa organització no tinga dos
   comunitats. Els tipus que es guarden són els del CHECK
   xat_fils_subjecte_tipus_valid de la migració 2609282100_xat_de_pagina.sql. */
export const TIPUS_SUBJECTE_XAT = Object.freeze({
  comunitat: Object.freeze(['entitat', 'poble', 'organitzacio']),
  grup: Object.freeze(['publicacio', 'producte', 'esdeveniment', 'multimedia', 'grup', 'pagina'])
});
const ALIES_SUBJECTE = Object.freeze({ organitzacio: 'entitat' });

const MAXIM_ID_SUBJECTE = 200;
const MAXIM_RUTA_SUBJECTE = 300;
const MAXIM_TITOL_FIL = 100;

/* Les pàgines amb xat comú: una llista TANCADA, no una forma de ruta. Una
   'pagina' no té id propi (la seua clau és la ruta) i el servidor no pot saber
   quines rutes existixen a l'SPA ni si són públiques: sense llista, una ruta
   inventada o privada (/notes/…, /gent/…, /xat/…) crearia un fil. Són les
   pàgines públiques de SECTION_ORDER (src/config/sections.js), sense el Xat
   ni les Notes, amb el seu nom; el títol del fil és este, no el del client.
   La mateixa llista, amb els mateixos títols, és a private.xat_subjecte
   (2609282100_xat_de_pagina.sql): tests/migracio-xat-de-pagina.test.mjs ho
   contrasta. PENDENT del Mestre (pregunta 4 del mapa T63-T67): quines
   pàgines en tenen; fins aleshores, la resta diu que no n'hi ha. */
export const PAGINES_AMB_XAT = Object.freeze({
  '/mur': 'Mur',
  '/mercat': 'Mercat',
  '/pobles': 'Pobles',
  '/multimedia': 'Multimèdia',
  '/dispositius': 'Dispositius',
  '/disseny': 'Disseny',
  '/wikidepoble': 'Wiki de Poble',
  '/projecte': 'El projecte',
  '/constitucio': 'Constitució',
  '/ia': "L'ànima de la iaia",
  '/roadmap': 'Full de ruta',
  '/versions': 'Versions',
  '/legal': 'Legal i privacitat'
});

/* On viu la Pàgina Universal de cada subjecte, com rutaDePerfil i
   getSectionItemPath (src/config/navigation.js), que no s'importen ací perquè
   el contracte no depén de cap altre mòdul. El servidor la deriva igual
   (private.xat_subjecte): la ruta del client no es guarda mai. */
const PREFIX_DE_SUBJECTE = Object.freeze({
  entitat: '/empresa/', grup: '/grup/', poble: '/pobles/', publicacio: '/mur/',
  producte: '/mercat/', esdeveniment: '/events/', multimedia: '/multimedia/'
});
/* Els caràcters que encodeURIComponent deixa com són: una clau amb altres no
   es codifica ací (seria una segona regla), i el subjecte es queda sense ruta. */
const CLAU_DE_RUTA = /^[A-Za-z0-9._~-]{1,200}$/;

/**
 * La ruta canònica de la Pàgina Universal d'un subjecte ja validat
 * ({ tipus, id } de subjecteDeXat, amb el tipus que es guarda), o null si la
 * seua clau no hi cap sense codificar. Pura.
 */
export function rutaDeSubjecte(tipus, id) {
  const clau = String(id ?? '');
  if (tipus === 'pagina') return Object.hasOwn(PAGINES_AMB_XAT, clau) ? clau : null;
  const prefix = PREFIX_DE_SUBJECTE[tipus];
  return prefix && CLAU_DE_RUTA.test(clau) ? `${prefix}${clau}` : null;
}

/* Ruta interna i segura, com esRutaInterna (objecteConnectable.js), que no
   s'importa ací perquè el contracte no depén de cap altre mòdul. */
function esRutaDeSubjecte(ruta) {
  if (typeof ruta !== 'string' || !ruta || ruta.length > MAXIM_RUTA_SUBJECTE) return false;
  if (!ruta.startsWith('/') || ruta.startsWith('//')) return false;
  return !/[\\\u0000-\u001F\u007F\s]/.test(ruta);
}

/**
 * El subjecte d'un xat de pàgina a partir del descriptor d'una Pàgina
 * Universal ({ tipus, id, ruta, titol }), o null si no en té: tipus fora de
 * la llista, sense id estable o una 'pagina' que no és de PAGINES_AMB_XAT (o
 * la ruta de la qual no en fa d'id). `classe` diu si naix una 'comunitat' o
 * un 'grup'. `ruta` i `titol` són els del client, una pista per a la
 * interfície: el fil els pren del servidor (o, en llavor, de rutaDeSubjecte i
 * de PAGINES_AMB_XAT). Pura.
 */
export function subjecteDeXat(objecte) {
  if (!objecte || typeof objecte !== 'object') return null;
  const brut = String(objecte.tipus ?? '').trim();
  const id = String(objecte.id ?? '').trim();
  const classe = TIPUS_SUBJECTE_XAT.comunitat.includes(brut) ? 'comunitat'
    : TIPUS_SUBJECTE_XAT.grup.includes(brut) ? 'grup' : null;
  if (!classe || !id || id.length > MAXIM_ID_SUBJECTE) return null;
  const tipus = ALIES_SUBJECTE[brut] || brut;
  const rutaBruta = typeof objecte.ruta === 'string' ? objecte.ruta.trim() : '';
  const ruta = esRutaDeSubjecte(rutaBruta) ? rutaBruta : null;
  if (tipus === 'pagina' && !(ruta === id && Object.hasOwn(PAGINES_AMB_XAT, id))) return null;
  const titol = String(objecte.titol ?? '').trim().slice(0, MAXIM_TITOL_FIL) || null;
  return { tipus, id, ruta, titol, classe };
}
