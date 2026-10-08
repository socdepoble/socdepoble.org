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
/* Ordre del Mestre (261007) · Forma de loadFils()[], una Conversa del Xat:
   camp opcional `perDefecte` ('socdepoble' | 'iaia'; absent o null en una
   conversa de veres). Marca una fila que el backend SINTETITZA perquè tota
   persona tinga amb qui parlar el primer dia (src/data/xatsPerDefecte.js):
   no és cap fil del servidor, no té missatges ni marques, el seu id porta el
   prefix 'sdp-per-defecte:' i no s'ha de passar mai a loadMissatges,
   enviaMissatge, marcaLlegit ni subscribeToXat. La interfície l'obri per la
   via de la seua clau, i la fila desapareix quan arriba la conversa real. El
   kit de conformitat (conformitat/kit.js) no l'usa com a fil. */
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

/* Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
   PROGRESSIVA (LOAD MORE).» Les seccions de loadMur que es paginen, amb la
   clau de la llista que omplin a la seua resposta. Una sola font per a
   l'adaptador, el kit de conformitat i MurContext. Multimèdia i Notes no hi
   són: Notes té la seua capacitat (paginacioNotes) i Multimèdia no és d'esta
   ordre. */
export const SECCIONS_PAGINABLES = Object.freeze({
  mur: 'feedPosts',
  events: 'events',
  mercat: 'marketItems'
});

export const CAPACITATS = Object.freeze({
  sessioExterna: Object.freeze(['adoptaSessioExterna']),
  paginacioNotes: Object.freeze(['loadNotesPage']),
  /* Decisió 4 del Mestre (261007) · «Carregar-ne més» al Mur i al Mercat
     (ADR-2026-11-PAGINACIO-SECCIONS). Opcional a posta: un backend sense ella
     continua sent vàlid, loadMur torna la primera pàgina com sempre i la
     interfície no pinta el botó. La interfície ho pregunta amb
     teCapacitat('paginacioSeccions'). Formes:
       loadMur(ownerUserId, config) → { feedPosts[], events[], marketItems[],
         paginacio? }. `paginacio` és ADDITIU i opcional: { [seccio]: cursor }
         només per a les seccions de SECCIONS_PAGINABLES que tenen més files
         després de la primera pàgina. L'absència del camp o de la clau vol
         dir que la secció és completa. El cursor és opac: només l'adaptador
         que l'ha emés el sap llegir.
       loadSeccioPage({ seccio, cursor, limit, signal }, config) →
         { elements[], complete, nextCursor }. La pàgina següent de les
         publicacions dels veïns de la secció, amb el mateix mapatge que la
         primera pàgina de loadMur i en el mateix ordre (de més nova a més
         vella, estable amb empats). `limit` ≤ 50 (per defecte, 50). El
         contingut de l'administració només va a la primera pàgina. complete
         i nextCursor null van junts. Sense servidor (mode de proves), cap
         pàgina més: { elements: [], complete: true, nextCursor: null }.
         Relleu 261008 (revisió adversarial) · `cursor: null` vol dir des de
         la publicació més nova dels veïns de la secció, sense el contingut
         de l'administració: pot solapar-se amb la primera pàgina de loadMur,
         i la interfície fusiona per id. Una
         `seccio` que no és de SECCIONS_PAGINABLES rebutja amb un Error. El
         kit de conformitat comprova tots dos casos. */
  paginacioSeccions: Object.freeze(['loadSeccioPage']),
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
  ]),
  /* T2 i T4 (ordre del Mestre, 260930) · Saber si el node respon abans de
     canviar de mode: /registre no desa l'elecció remota contra un servidor
     aturat. Opcional a posta: sense ella el canvi es fa com fins ara (T16).
     Forma: comprovaServidor(config) → Promise<{ ok: boolean }>. Una fallada de
     xarxa o un temps esgotat tornen { ok: false }; no rebutja per això. */
  salut: Object.freeze([
    'comprovaServidor'
  ]),
  /* R (Onada 3, 261003) · Recuperar la contrasenya perduda. Opcional a posta:
     un backend sense ella continua sent vàlid i /registre no pinta
     «Has oblidat la contrasenya?». La interfície ho pregunta amb
     teCapacitat('recuperacioContrasenya'). Formes:
       demanaRecuperacioContrasenya(correu, config) → Promise<{ enviat: true }>
         Envia l'enllaç. Resol IGUAL tant si el compte existix com si no; només
         rebutja amb error.code de CODI_ENTRADA (servidor, límit, desconegut).
       definixContrasenyaNova(contrasenya, config) → Promise<true>
         UNA sola crida que verifica i definix (R2). Amb un enllaç pendent en
         este document, el verifica ARA i definix la contrasenya amb la sessió
         que en trau; la sessió només es desa i s'avisa (sdp:auth-change) quan
         la contrasenya ja és la nova. Sense cap recuperació en curs, la de la
         sessió viva. Rebutja amb CODI_ENTRADA (ENLLAC_CADUCAT, feble, mateixa
         contrasenya…); amb una recuperació en curs i sense enllaç, mai toca la
         sessió viva.
     La tornada de l'enllaç passa pel nucli. R2 (decisió del Mestre, 261003:
     Safe Links d'Outlook) · recullTornadaOAuth resol amb `{ recuperacio: true }`
     SENSE sessió i sense cap petició: l'adaptador guarda l'enllaç en la memòria
     del document i ho diu al nucli ABANS de tornar
     (data/recuperacioPendent.js, anunciaEnllacDeRecuperacio). La interfície no
     deixa anar enlloc més fins que es desa o es descarta.
     Compatibilitat · Si un backend torna sessió amb `recuperacio` (el contracte
     d'abans de R2), App.jsx marca el compte (recuperacioPendent.js, §2) i la
     interfície no deixa usar eixa sessió fins que es definix la contrasenya. */
  recuperacioContrasenya: Object.freeze([
    'demanaRecuperacioContrasenya',
    'definixContrasenyaNova'
  ]),
  /* Ordre del Mestre (261008, grup C) · Els membres d'una organització.
     Opcional a posta: un backend sense ella continua sent vàlid i el Perfil
     no pinta la gestió de membres ni «Eixir». La interfície ho pregunta amb
     teCapacitat('membresOrganitzacio'). Formes (config sempre l'últim):
       llistaMembresOrganitzacio(orgId, config) → Promise<Membre[]>
         Només per a qui administra l'organització (owner o admin).
       desaMembreOrganitzacio(orgId, { tipus, id, rol }, config) → Promise<Membre>
         Alta directa (sense invitació) o canvi de rol. rol per defecte
         'member'; una persona pot ser 'member' o 'admin', mai 'owner'; una
         organització, només 'member'.
       llevaMembreOrganitzacio(orgId, { tipus, id }, config) → Promise<{ llevat }>
         Idempotent: llevat false si ja no hi era. Amb el propi id i tipus
         'persona', és «Eixir», també per a qui només és membre.
     Membre: { tipus: 'persona' | 'organitzacio', id, nom, avatar,
     rol: 'owner' | 'admin' | 'member', desDe (ISO o null) }.
     Regles (decisions del Mestre, 261008), iguals a tots els adaptadors: la
     persona és del poble i no ha demanat la baixa; ningú canvia el seu propi
     rol; la propietària no es canvia ni es lleva; només ella nomena, degrada
     o lleva administradores; una organització membre és del mateix poble, no
     és ella mateixa, l'afig qui administra totes dues i no hereta cap permís.
     Els errors porten `code`: els de MISSATGES_MEMBRES_ORGANITZACIO, o
     NO-DISPONIBLE si el servidor encara no té l'esquema. */
  membresOrganitzacio: Object.freeze([
    'llistaMembresOrganitzacio',
    'desaMembreOrganitzacio',
    'llevaMembreOrganitzacio'
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
  '/iaia': "L'ànima de la iaia",
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

/* ── Ordre del Mestre (261008, grup C) · Els membres d'una organització ──
   Una sola taula de codis i una sola regla d'entrada per a tots els
   adaptadors de 'membresOrganitzacio' (Supabase, la llavor i qualsevol node
   federat), com TIPUS_SUBJECTE_XAT: la interfície decidix pel `code`, mai
   pel text. Els codis són els de les RPC de
   supabase/migrations/2610081402_membres_organitzacio.sql, i
   tests/migracio-membres-organitzacio.test.mjs els contrasta. */
export const MISSATGES_MEMBRES_ORGANITZACIO = Object.freeze({
  'SDP-ORGMEM-000': 'Cal iniciar sessió.',
  'SDP-ORGMEM-001': 'El tipus de membre o el rol no és vàlid.',
  'SDP-ORGMEM-002': 'Només qui administra l’organització en veu i en gestiona els membres.',
  'SDP-ORGMEM-003': 'Esta persona no és del poble de l’organització o ha demanat la baixa.',
  'SDP-ORGMEM-004': 'No pots canviar el teu propi rol.',
  'SDP-ORGMEM-005': 'La propietària no es canvia ni es lleva.',
  'SDP-ORGMEM-006': 'Només la propietària nomena, degrada o lleva administradores.',
  'SDP-ORGMEM-007': 'Una organització no pot ser membre d’ella mateixa ni d’una d’un altre poble.',
  'SDP-ORGMEM-008': 'Per a afegir una organització com a membre, cal que també l’administres.'
});

/** Un Error amb el `code` i el missatge de MISSATGES_MEMBRES_ORGANITZACIO. Pura. */
export function errorDeMembre(codi, cause) {
  return Object.assign(new Error(MISSATGES_MEMBRES_ORGANITZACIO[codi] || 'No s’han pogut desar els membres.'),
    { code: codi, ...(cause ? { cause } : {}) });
}

/**
 * El membre que es vol desar ({ tipus, id, rol }) o llevar ({ tipus, id },
 * amb `ambRol: false`), normalitzat; si no és vàlid, llança SDP-ORGMEM-001.
 * El rol per defecte és 'member'; una persona pot ser 'member' o 'admin' (mai
 * 'owner': la propietària no es nomena ací) i una organització, només 'member'.
 * No valida la forma de l'id: cada adaptador sap quins ids són seus. Pura.
 */
export function membreDOrganitzacio(dades, { ambRol = true } = {}) {
  const tipus = String(dades?.tipus ?? '').trim();
  const id = String(dades?.id ?? '').trim();
  const rol = String(dades?.rol ?? '').trim() || 'member';
  const rolValid = !ambRol || (tipus === 'persona' ? rol === 'member' || rol === 'admin' : rol === 'member');
  if ((tipus !== 'persona' && tipus !== 'organitzacio') || !id || !rolValid) throw errorDeMembre('SDP-ORGMEM-001');
  return ambRol ? { tipus, id, rol } : { tipus, id };
}
