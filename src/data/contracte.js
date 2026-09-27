/* SDP-LOCK */
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
  ])
});

export const CONTRACTE_BACKEND = Object.freeze([
  ...CONTRACTE_NUCLI,
  ...Object.values(CAPACITATS).flat()
]);
