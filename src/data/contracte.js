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
   camp opcional `perDefecte` ('socdepoble' | 'javi' | 'iaia'; absent o null
   en una conversa de veres; 'javi', des del Gauntlet 261016, Bloc 3.6: Javi
   Llinares, la persona humana de contacte, CONTACTE_HUMA; des del Gauntlet
   261016_1530, Bloc 3.6.1, ja cap 'socdepoble': el seu actor és la
   comunitat, no cap directe sintètic). Marca una fila que
   el backend SINTETITZA perquè tota persona tinga amb qui parlar el primer
   dia (src/data/xatsPerDefecte.js · ACTORS_PERMANENTS):
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
  carpetesNotes: Object.freeze(['creaCarpetaNotes']),
  /* R12: patch d'un element existent d'app_content; whole-row version CAS, superadmin+aal2 al servidor. */
  edicioEditorial: Object.freeze(['adminActualitzaPublicacioEditorial']),
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

  /* R6 proposal: proof is supplied only by the user's explicit email form.
     No URL/storage reader or pre-registration password is accepted as proof.
     confirmaCorreu(token,password,{accepta_rgpd,versio_politica},config)
     reenviaVerificacioCorreu(email,config)
     demanaRestablimentCorreu(email,config)
     restablixContrasenyaAmbCorreu(token,password,metadata|null,config)
     Optional groups preserve every legacy provider when absent. */
  verificacioCorreu: Object.freeze(['confirmaCorreu','reenviaVerificacioCorreu']),
  recuperacioCorreu: Object.freeze(['demanaRestablimentCorreu','restablixContrasenyaAmbCorreu']),
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
  /* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · La
     biblioteca de fotos pròpies de l'apartat «Multimèdia» del Perfil.
     Capacitat a banda a posta, i no dins de 'mitjans': el control de
     capacitat parcial (backendPort.js) tombaria tot 'mitjans' en un backend
     que només sap pujar, i la pujada d'avatars deixaria de funcionar.
     Opcional: sense ella, «Multimèdia» només pinta les fotos actives de la
     fitxa. La interfície ho pregunta amb teCapacitat('mitjansPropis').
     Formes (config sempre l'últim):
       llistaElsMeusMitjans(config) → Promise<Mitja[]>
         Només les imatges de la persona de la sessió al bucket públic, de
         més nova a més vella. [] sense sessió i en seed o local.
       esborraElMeuMitja(ref, config) → Promise<void>
         Esborra de veritat una foto de la biblioteca del Perfil i només
         eixa: una ref 'sdp-media://mitjans/<poble>/<uid>/avatars/<fitxer>'
         del poble resolt i de la persona de la sessió (Mitja.esborrable).
     Mitja: { ref, ruta, nom, carpeta, creat (ISO o null), mida (bytes o
     null), etag (sense cometes, o null), tipus (MIME o null), esborrable }.
     Els errors porten `codi` (i el mateix a `code`) de CODI_MITJANS o
     CODI_BACKEND_INABASTABLE (errorsBackend.js), o 'no-disponible' en seed
     o local; el missatge, en valencià, mai porta la ruta ni el text cru del
     proveïdor. */
  mitjansPropis: Object.freeze([
    'llistaElsMeusMitjans',
    'esborraElMeuMitja'
  ]),
  /* Adjunts privats del xat; independents dels mitjans públics del perfil.
     quotaXat(config) → { usats, limit, pendents: [{id, bytes, mime}] } en bytes (reserves incloses).
     publicaAdjuntXat(filId, {id, fitxer: Blob, tipus, duradaMs, text?, respostaA?}, config)
       → Missatge confirmat; id estable per reintentar sense duplicar quota.
       config.onProgres(fraccio 0..1) és opcional (XAT-03): els bytes ja pujats;
       no viatja a les RPC i qui no puja res de veres (seed, local) l'ignora.
     descartaAdjuntXat(id, config) → true després d’esborrar un pendent propi.
     urlAdjuntXat(id, config, { renova }?) → URL temporal, només amb accés vigent al fil;
       renova=true obliga a una signatura nova (cap URL desada).
     Sense servidor/migració: error 'sense-capacitat', mai èxit local simulat. */
  xatMultimedia: Object.freeze(['quotaXat', 'publicaAdjuntXat', 'urlAdjuntXat', 'descartaAdjuntXat']),
  /* P1-12 · Disseny E2EE §8.3: transport opac i opcional, sense activar el
     decorador ni donar suport a un backend que no implemente el grup sencer.
     Els arguments i resultats els conserva l'adaptador; ací no es deriva cap
     RPC ni es recodifica cap sobre. fixaAmbit és del servei del decorador
     (§8.1 / §21.1), no una operació de transport. */
  clausXat: Object.freeze([
    'publicaIdentitatXat', 'laMevaIdentitatXat', 'desaFraseXat', 'clausDeXat',
    'desaLlibretaXat', 'laMevaLlibretaXat', 'estatXifratXat', 'epoquesDelFilXat',
    'sobresMeusXat', 'obriEpocaXat', 'enviaXifratXat', 'reembolcallaXat', 'demanaXifratXat'
  ]),
  /* Separada de xatMultimedia: els quatre mètodes antics continuen sent un
     grup complet, i un backend sense bytes xifrats no anuncia este grup nou. */
  xatMultimediaXifrat: Object.freeze(['publicaAdjuntXifratXat', 'bytesAdjuntXat']),
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
  /* Pla 261022_1955 (Cercador Universal, T1) · El directori públic de les
     organitzacions: el que /cerca indexa perquè tota empresa, entitat o grup
     públic es trobe, amb sessió o sense. Capacitat a banda a posta, i no dins
     de 'directori': el control de capacitat parcial (backendPort.js) tombaria
     'directori' sencer en un amfitrió que ja el té i no sap llistar, i la
     fitxa pública deixaria d'obrir-se. Opcional: sense ella, /cerca només
     troba les organitzacions que ja porten les altres fonts. La interfície ho
     pregunta amb teCapacitat('directoriEntitats'). Forma (config sempre l'últim):
       listPublicOrganizations({ consulta?, poble?, limit?, signal? }, config) → Promise<Fila[]>
         Les organitzacions amb visibility 'public' de TOTS els pobles del node
         (el poble actiu el pondera qui busca, no el filtra), per nom i id.
         Sense consulta, les primeres `limit` (≤ LIMIT_DIRECTORI_ENTITATS, per
         defecte eixe); amb consulta, les que porten totes les seues paraules
         (com a molt cinc) al nom, al slug, al lema o a la descripció. Pot
         tornar-ne de més (un patró tolerant als accents, mai de menys): qui
         busca torna a plegar i filtrar. Sense servidor, [].
         P1-11 (pla 261024_2230, T5B-01) · Amb `poble` (el NOM del poble, el
         que desa el selector a town_name; pobleOrganitzacio.js ·
         pobleDelFiltre), només les d'eixe poble: town_name (el valor desat,
         tal qual) igual al nom del filtre sense espais als extrems, filtrat ABANS del límit (al servidor, mai
         al client després de tallar). Ni de més ni de menys. Un servidor
         que no sap el poble de les organitzacions (sense la columna
         town_name) rebutja amb un error de `code` 'NO-DISPONIBLE' (C11-01 de
         Codex: mai les de tots els pobles ni un buit mut); és l'única
         excepció a «cap codi més» i només amb `poble`. Un `poble` buit o
         que no és text no filtra res.
       Fila: la de la vista organization_directory, i mai cap correu:
         { id, tenant_id, slug, name, kind ('company' | 'entity' | 'group'),
         parent_organization_id, lema, description, logo_url (URL, ruta
         pròpia o referència opaca 'sdp-media://…'), hero_url,
         presentacio_html, copyright, town_name (o null), created_at, updated_at }.
     Els errors porten l'estat HTTP (`status`) quan n'hi ha; un tall o una
     cancel·lació, el seu nom (AbortError, TimeoutError). Cap codi més: qui
     busca no decidix res pel tipus d'error del directori. */
  directoriEntitats: Object.freeze([
    'listPublicOrganizations'
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
  /* T8b · P0-23 (BOT-A2; Gauntlet Claude 261025_1705; assalt 261101) · La
     versió mínima de l'app nativa que el node encara servix. Opcional a
     posta: un node sense ella continua sent vàlid i l'app entra com sempre.
     Només la pregunta l'entrada nativa (src/natiu/entrada.jsx, amb
     teCapacitat('versioClient')); la web i el connector de WordPress no la
     pregunten mai. Forma (config sempre l'últim):
       versioMinimaClient(plataforma, config) → Promise<{ versioMinima, enllac } | null>
         plataforma 'ios' | 'android'. versioMinima és un enter ≥ 1, el que
         l'app compara amb VERSIO_CLIENT_NATIU (davall); enllac, l'adreça
         https on es baixa la versió nova (la botiga o la prova tancada), o
         null. Cap clau més. null quan no hi ha mínim: una altra plataforma,
         sense servidor (seed o local) o un servidor sense la migració.
     Els errors només són els de no arribar (l'estat HTTP, un tall, una
     cancel·lació): l'app no es bloqueja mai per un error (fail-open). Ho
     servix 2611011510_versio_minima_client.sql (NO aplicada: l'aplica el
     Mestre). */
  versioClient: Object.freeze([
    'versioMinimaClient'
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
  /* Fase D (261020, tasca 1; ordre del Mestre) · Entrar amb el testimoni OIDC
     (id_token) que un proveïdor ha emés fora de la web (el full natiu d'Apple o
     de Google). El port només parla OIDC: qui obri el full no és cosa del
     backend (config/entradaNativa.js). Opcional a posta: un backend sense ella
     continua sent vàlid i /registre no pinta els botons natius. La interfície
     ho pregunta amb teCapacitat('entradaAmbToken'). Forma (config sempre l'últim):
       entraAmbTokenDeProveidor(proveidor, { testimoni, nonce, testimoniAcces, nom, codiAutoritzacio }, config) → Promise<{ user }>
         proveidor 'apple' | 'google'; testimoni el JWT; nonce el CRU (el
         proveïdor n'ha rebut el SHA-256 en hex) o null; testimoniAcces l'access
         token de Google (at_hash) o null; nom el que el proveïdor dona fora del
         testimoni (Apple) o null, desat NOMÉS si la persona encara no en té cap
         de propi; codiAutoritzacio (T1, 261024; P0-04) el codi d'autorització
         d'un sol ús d'Apple (uns cinc minuts) o null: el backend el pot
         canviar al servidor per a revocar l'autorització d'Apple quan la
         persona es dona de baixa. Mai es guarda al client ni va a GoTrue, i
         si no es pot custodiar l'entrada no falla. Coreografia de
         loginWithPassword (sdp:auth-change, alta completada). Mai torna
         testimonis de sessió. Errors amb `code` de
         CODI_ENTRADA (TOKEN_REBUTJAT, PROVEIDOR_INACTIU…); en seed o local, MODE_LOCAL. */
  entradaAmbToken: Object.freeze([
    'entraAmbTokenDeProveidor'
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
  ]),
  /* IDEA-24 (Llibre Mestre; marató 261101_2143, B4) · La transferència
     atòmica de la propietat d'una organització: la propietària ('owner') la
     cedix a una persona que ja n'és membre i ella passa a 'admin'. Capacitat a
     banda a posta, i no dins de 'membresOrganitzacio' (el control de capacitat
     parcial de backendPort.js tombaria la gestió de membres d'un node que no
     la sap fer, com 'titularPublic'). Opcional: qui oferisca «Transferir la
     propietat» ha de preguntar abans per esta capacitat amb teCapacitat i,
     sense ella, no l'ha d'oferir. Forma (config sempre l'últim):
       transfereixPropietatOrganitzacio(orgId, { tipus: 'persona', id }, config)
         → Promise<{ organizationId, anticOwnerId, nouOwnerId }>
         Una sola transacció: o canvien tots dos rols o cap; mai cap
         organització sense propietària ni amb dues. Només la propietària i
         la seua sessió; només per a TIPUS_TRANSFERIBLES ('group' i 'company':
         una entitat o un ajuntament només canvia de titular per reclamació
         revisada); la destinatària és una persona, no és qui crida, ja és
         membre de l'organització i del seu poble i no ha demanat la baixa.
         La tria de mostrar-se com a titular (consentimentTitular) de l'antiga
         propietària es perd. Mai torna cap correu.
     Els errors porten `code` de MISSATGES_MEMBRES_ORGANITZACIO (000 sense
     sessió, 001 tipus no transferible o destinatària que no és una persona,
     002 organització que no existix o no s'administra, 003 destinatària que
     no n'és membre o ha demanat la baixa, 004 una mateixa, 006 no n'és la
     propietària), o NO-DISPONIBLE si el servidor encara no té la RPC
     (2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql). */
  transferenciaPropietat: Object.freeze([
    'transfereixPropietatOrganitzacio'
  ]),
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor (TOTP)
     del superadmin. private.es_superadmin() exigix aal2 (migració
     2610061448): sense ell, el Tauler no pot desar res. Opcional a posta: un
     node sense servidor d'autenticació (la llavor, WordPress) continua sent
     vàlid i «El compte» no pinta la inscripció. La interfície ho pregunta amb
     teCapacitat('segonFactor') i, per a saber si cal confirmar-lo, mira
     `calSegonFactor` de la sessió. Formes (config sempre l'últim):
       llistaFactors(config) → Promise<Factor[]>
         Els factors TOTP del compte; buida sense sessió o sense servidor.
       inscriuFactor(nom, config) → Promise<{ id, qr, secret, uri }>
         Crea un factor pendent: `qr` és l'SVG com a data URI, `secret` la
         clau per a escriure-la a mà i `uri` l'otpauth://.
       reptaFactor(factorId, config) → Promise<{ repteId, caduca }>
         Obri un repte del factor; `caduca` és un instant ISO o null.
       verificaFactor({ factorId, repteId, codi }, config) → Promise<{ nivell: 'aal2' }>
         Confirma el codi i DESA la sessió nova (aal2) en lloc de la vella, amb
         la mateixa coreografia que una renovació (rotació del registre
         persistent, resetClient, sdp:auth-change). Verifica també el primer
         codi d'un factor acabat d'inscriure.
       retiraFactor(factorId, config) → Promise<{ id }>
     Factor: { id, nom, tipus: 'totp', estat: 'verificat' | 'pendent' }.
     Els errors porten `code` de CODI_SEGON_FACTOR (errorsBackend.js); en seed
     o local, llistaFactors torna [] i la resta rebutja amb 'no-disponible'. */
  segonFactor: Object.freeze([
    'llistaFactors',
    'inscriuFactor',
    'reptaFactor',
    'verificaFactor',
    'retiraFactor'
  ]),
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
     poble que desa el superadmin: la taxonomia (categories i etiquetes) i
     l'estil (els tokens --sdp-* de la capa semàntica). Opcional a posta: un
     node sense ella continua sent vàlid i el Tauler no pinta «Desa». La
     interfície ho pregunta amb teCapacitat('personalitzacio'). Formes (config
     sempre l'últim):
       adminDesaPersonalitzacio({ clau, payload, versio }, config) → Promise<{ clau, payload, versio }>
         clau és 'taxonomia' o 'estil'; `versio` és la versió que s'editava
         (null o 0 si no n'hi havia) i la resposta porta la versió NOVA. Només
         amb el segon factor confirmat (aal2): si no, 'cal-segon-factor'; si
         algú ha desat pel camí, 'conflicte-versio'.
       adminHistorialPersonalitzacio(clau, config) → Promise<[{ versio, payload, creat, autor }]>
         Les versions desades, de més nova a més vella.
     La LECTURA no és cap mètode nou: loadCoreContent torna el camp ADDITIU i
     opcional `personalitzacio: { taxonomia: { payload, versio } | null,
     estil: { payload, versio } | null }`, que els consumidors fusionen amb
     la seua base (PAGE_COPY, tokens.css). Els errors porten `code` de
     CODI_PERSONALITZACIO (errorsBackend.js). */
  personalitzacio: Object.freeze([
    'adminDesaPersonalitzacio',
    'adminHistorialPersonalitzacio'
  ]),
  /* FEDI-04 · Administració de tenants reals, mai deduïda del directori públic.
     Opcional: adminLlistaPobles(config) → [{ id, slug, nom }];
     adminLligPersonalitzacio({ tenantId, ...config }) → { taxonomia, estil },
     cadascuna { payload, versio } o null. Superadmin amb aal2 al servidor.
     Les mutacions i l'historial usen la capacitat personalitzacio amb eixa
     mateixa config explícita; no canvien la sessió ni el poble global.
     Un tenant malformat rebutja abans de transport amb code 'abast-invalid'. */
  administracioMultipoble: Object.freeze([
    'adminLlistaPobles',
    'adminLligPersonalitzacio'
  ]),
  /* Fase D (261020, tasca 2; pla 261020_1300 · App Store 1.2 i Google Play
     UGC) · La moderació del contingut dels veïns: denunciar i bloquejar.
     Opcional a posta: un node sense ella continua sent vàlid i cap targeta
     ni bombolla no pinta «Més opcions». La interfície ho pregunta amb
     teCapacitat('moderacio'). Formes (config sempre l'últim):
       denunciaContingut({ objecte: { tipus, id }, motiu, detall?, autor?: { tipus, id }, filId? }, config)
         → Promise<{ rebuda: true, repetida: boolean }>
         tipus de TIPUS_OBJECTE_DENUNCIA; motiu de MOTIUS_DENUNCIA; detall de
         fins a MAXIM_DETALL_DENUNCIA caràcters. També sense sessió (anon).
         `repetida`: la mateixa persona ja l'havia denunciat i està pendent.
       llistaBloquejos(config) → Promise<Bloqueig[]>  (de qui crida; [] sense sessió)
       bloquejaAutor({ tipus, id, nom? }, config) → Promise<Bloqueig>  (idempotent)
       desbloquejaAutor({ tipus, id }, config) → Promise<{ desbloquejat: boolean }>
     Bloqueig: { tipus: 'persona' | 'entitat', id, nom: string | null, creatAl: ISO | null }.
     Els errors porten `code` de CODI_MODERACIO; sense la migració aplicada,
     'no-disponible'. */
  moderacio: Object.freeze([
    'denunciaContingut',
    'llistaBloquejos',
    'bloquejaAutor',
    'desbloquejaAutor'
  ]),
  /* Fase D (261020, tasca 2) · Les normes de convivència, acceptades abans
     de la primera publicació (Play UGC; App Store 1.2, tolerància zero).
     Opcional: sense ella la interfície ho recorda només en este dispositiu.
     Formes:
       estatNormes(config) → Promise<{ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: ISO | null }>
         L'acceptació de la versió vigent; sense sessió, acceptadaAl null.
       acceptaNormes(versio, config) → Promise<{ versio, acceptadaAl }>
         versio === VERSIO_NORMES_CONVIVENCIA (si no, 'versio-invalida');
         sense sessió, 'sense-sessio'. */
  normesConvivencia: Object.freeze([
    'estatNormes',
    'acceptaNormes'
  ]),
  /* T6b (IDEA-14; decisió del Mestre, 261024) · «Connectar / Seguir»: el
     seguiment d'un sol sentit d'una persona o d'una entitat. Qui és seguit ho
     sap i veu qui el seguix; cap algoritme (les llistes van per data, la més
     nova primer). Opcional a posta: un node sense ella continua sent vàlid i
     /connectar i el Perfil no pinten «Connectar amb {nom}» ni «Veïnat connectat amb tu». La
     interfície ho pregunta amb teCapacitat('seguiments'). Formes (config
     sempre l'últim; el seguit és { tipus: 'persona' | 'entitat', id }):
       segueix({ tipus, id }, config) → Promise<{ seguint: true, creatAl, nou, primer }>
         Idempotent: false si ja el seguies (creatAl, el d'aleshores).
         `primer` true NOMÉS la primera vegada de totes que seguixes eixa
         persona o entitat; tornar-la a seguir després de deixar-ho és
         false. `nou` es conserva per compatibilitat i val el mateix que
         `primer`: l'avís al xat ix una sola vegada per parella.
       deixaDeSeguir({ tipus, id }, config) → Promise<{ seguint: false }>
         Idempotent: també si no el seguies. Al servidor, un esborrat suau
         (la fila es queda amb deixat_al): no reinicia el límit per hora.
       estatSeguiment({ tipus, id }, config) → Promise<{ seguint: boolean, creatAl: ISO | null }>
         Sense sessió, { seguint: false, creatAl: null } i cap petició.
       elsMeusSeguiments(config) → Promise<[{ tipus, id, nom, creatAl }]>
         Només els de la persona (els fets amb `com` no hi són).
       quiEmSegueix({ orgId } = {}, config) → Promise<[{ tipus, id, nom, creatAl }]>
         Sense orgId, qui et seguix; amb orgId, qui seguix eixa entitat,
         només per a qui l'administra (owner o admin). Sense sessió, les
         dues llistes són [] i cap petició. `tipus` és 'persona' o
         'entitat' (TIPUS_SEGUIT): d'un seguiment fet com a entitat, `id` i
         `nom` són els de l'ENTITAT seguidora, mai els de la persona que el
         va fer.
     IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · Connectar
     des d'una entitat (B2B rural), sense canviar la sessió global:
     segueix, deixaDeSeguir i estatSeguiment admeten `com` al mateix objecte
     ({ tipus, id, com }): l'id d'una organització que la persona de la
     sessió ADMINISTRA (owner o admin; en remot, un UUID; en local, l'id de
     la llavor). Sense `com` (o null, o ''), exactament el de sempre: la
     persona. Amb `com`, la connexió és de l'entitat, amb les mateixes
     respostes; si no l'administres, SDP-SEG-007. Una entitat no es connecta
     amb ella mateixa (SDP-SEG-003); entitat A → entitat B val encara que la
     persona també administre B, i persona → entitat que administra
     continua sent SDP-SEG-003. La quota (altes per hora i espera de represa)
     la compta la PERSONA que actua, mai l'entitat, i els bloquejos són els
     seus. Una entitat seguix cada destí com a molt una vegada, siga qui siga
     qui l'administra que ho haja fet, i qualsevol d'elles la pot deixar.
     Ho servix supabase/migrations/2610250100_seguiments_des_d_entitat.sql.
     Regles, iguals a tots els adaptadors (2610241430_seguiments.sql): una
     persona, només si sou del mateix poble; una entitat, si és pública; mai
     tu mateix ni una entitat que administres; cap bloqueig teu (moderacio);
     un límit d'altes o represes per hora. El bloqueig de l'altra banda és a
     l'ombra: seguir funciona igual i les lectures de qui seguix no l'amaguen;
     només quiEmSegueix, la de qui és seguit, deixa fora qui seguix. Una
     lectura amaga el que el bloqueig del seu sentit o una baixa tapen. Els
     errors porten `code`: els de
     MISSATGES_SEGUIMENTS (SDP-SEG-000…007), o NO-DISPONIBLE si el servidor
     encara no té l'esquema. */
  seguiments: Object.freeze([
    'segueix',
    'deixaDeSeguir',
    'estatSeguiment',
    'elsMeusSeguiments',
    'quiEmSegueix'
  ]),
  /* IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla
     261025_0200) · «Si connectes amb una empresa i la persona propietària té
     el perfil públic, t'hi pots connectar també a la mateixa pantalla». El
     servidor no diu mai qui administra una entitat (2610250100): la titular
     només es mostra si ELLA ho ha triat (consentimentTitular, davall).
     Capacitat a banda a posta, i no dins de 'directori' (el control de
     capacitat parcial de backendPort.js tombaria la fitxa pública en un
     amfitrió que no la té, com 'directoriEntitats'), ni amb la tria (un
     amfitrió pot mostrar la titular sense gestionar-ne la tria). Opcional:
     sense ella, /connectar no en diu res. Forma (config sempre l'últim):
       loadTitularPublic(orgId, config) → Promise<{ tipus: 'persona', id, nom, avatar } | null>
         La propietària (role 'owner'; mai una administradora ni qui ha
         publicat res) d'una organització pública, NOMÉS si ha triat
         mostrar-se, té el perfil públic, no ha demanat la baixa i cap
         bloqueig no la separa de qui mira; si no, null (també d'una
         organització que no existix), sense dir per què. Mai cap correu ni
         cap rol. Sense sessió, null i cap petició. Un servidor sense la
         migració, null. Els errors només són els de no arribar (un tall,
         una cancel·lació). Ho servix 2610250300_titular_public.sql. */
  titularPublic: Object.freeze([
    'loadTitularPublic'
  ]),
  /* IDEA-22, punt 2 · La tria de la propietària: només ella (role 'owner' i
     la seua sessió) la llig o la canvia; una administradora no la pot fer per
     ella. Opcional: sense ella, la gestió dels membres no pinta la casella.
     Formes (config sempre l'últim):
       estatTitularPublic(orgId, config) → Promise<{ titularPublic: boolean }>
       marcaTitularPublic(orgId, titularPublic, config) → Promise<{ titularPublic: boolean }>
         titularPublic és un booleà (si no, SDP-TIT-002); torna el valor desat.
     Els errors porten `code` de MISSATGES_TITULAR (SDP-TIT-000 sense sessió,
     SDP-TIT-001 si no n'és la propietària o l'organització no existix), o
     NO-DISPONIBLE si el servidor encara no té la migració. */
  consentimentTitular: Object.freeze([
    'estatTitularPublic',
    'marcaTitularPublic'
  ]),
  /* T2 · D04/D10 (assalt 261101; pla 261101_1246, D-3) · Les dades obertes
     d'un poble que el servidor ja servix a qualsevol visitant. Opcional: sense
     ella, el paquet Open Data de la fitxa del poble deixa notícies, agenda,
     memòria cultural i memòria oral a «Fonts pendents». Capacitat a banda de
     la restauració (davall) a posta: un servidor que només llig no ha de
     tombar la validació del port (capacitat parcial, backendPort.js).
     Forma (config sempre l'últim):
       llegixDadesObertes({ poble: { slug, nom }, signal? }, config) → Promise<DadesObertes>
         DadesObertes = { noticies, agenda, memoria, memoriaOral }, les quatre
         claus SEMPRE presents (COLECCIONS_DADES_OBERTES, davall). Cada una és
         una llista o null: null vol dir «este servidor no té eixa font», []
         que la té i és buida. Sempre anònima: el mateix resultat amb sessió i
         sense, i mai cap secret. Només el que el servidor ja servix a tothom:
         mai publicacions del veïnat (section_submissions), notes, xat, Mercat
         ni perfils. Pot tornar elements d'altres pobles (qui exporta torna a
         filtrar i falla tancat). Cap llista passa de LIMIT_DADES_OBERTES.
         Fila de noticies i agenda: la forma de loadMur().feedPosts i .events.
         Fila de memoriaOral: { id, okf: { cami, frontmatter, cos },
         author_org_id, copyright?, created_at?, updated_at?, visibility? }.
         Un poble que no és { slug, nom } de text no buit: TypeError.
     Els errors porten l'estat HTTP (`status`) quan n'hi ha; un tall o una
     cancel·lació, el seu nom (AbortError, TimeoutError). */
  dadesObertes: Object.freeze([
    'llegixDadesObertes'
  ]),
  /* T2 · D04/D10 (assalt 261101; pla 261101_1246, D-3) · Tornar a carregar en
     este servidor un poble que ve d'un paquet Open Data ja verificat
     (src/data/importaMunicipiOpenData.js). Opcional: hui només la servix
     l'adaptador local. Forma (config sempre l'últim):
       restauraDadesObertes(lot, config) → Promise<{ creats, actualitzats, iguals }>
         lot: la forma de validaLotDadesObertes (src/data/dadesObertesLot.js).
         Cadascun dels tres és { entitats, noticies, agenda, memoria,
         memoriaOral } d'enters ≥ 0. Atòmica (o tot o res) i idempotent
         (upsert per col·lecció i id: el mateix lot dues voltes dona creats 0
         i actualitzats 0). Mai esborra res ni escriu cap persona. Un lot
         invàlid rebutja amb TypeError; un id o un slug que ja és d'un altre
         poble, amb `code` 'conflicte-identificador' i sense escriure res; en
         un servidor amb comptes, qui no administra el node, amb `code`
         'sense-permis'. */
  restauracioDadesObertes: Object.freeze([
    'restauraDadesObertes'
  ]),
  /* B8C-2 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · Els
     aparells que reben els avisos push del Xat (la fase N2 de
     src/config/avisosPushXat.js). Opcional a posta: sense ella, Ajustos →
     Notificacions continua «en construcció» i ningú no demana cap permís.
     Contracte únic amb el servidor: B8-SERVIDOR §2.9. Formes (config sempre
     l'últim):
       desaDispositiuAvisos(d, config) → Promise<void>
       retiraDispositiuAvisos(d, config) → Promise<void>
         d = { plataforma, adreca, caducaMs?, llengua?, gest? }: plataforma
         de PLATAFORMES_AVISOS (davall); adreca, l'endpoint https de la
         subscripció web o el testimoni natiu; caducaMs, l'expirationTime de
         la subscripció (o null); llengua, la de l'app (una altra o cap: la
         del servidor); gest, cert només quan naix del gest de la persona
         (activar): sense gest, el servidor no canvia mai l'amo d'un aparell.
         Mai cap clau de la subscripció (p256dh, auth) ni cap dada de tornada.
         retiraDispositiuAvisos és de cortesia i idempotent (la baixa en eixir).
     Errors amb `code`: AVISOS_INVALID (una entrada que no casa la forma,
     sense cap petició, o SDP-PUSH-002/003/004 del servidor), AVISOS_ALIE
     (SDP-PUSH-011: l'aparell és d'una altra sessió i cal el gest) i
     NO-DISPONIBLE (sense servidor, un servidor sense la migració o amb els
     avisos apagats, SDP-PUSH-010). Ho servixen xat_push_desa i
     xat_push_retira de 2611020417_xat_avisos_push.sql (B8-SERVIDOR; NO
     aplicada: l'aplica el Mestre). Un node sense servidor la declara amb el rebuig honest
     NO-DISPONIBLE (src/data/local/conversesLocal.js). */
  avisosPush: Object.freeze([
    'desaDispositiuAvisos',
    'retiraDispositiuAvisos'
  ]),
  /* B8C-2 (marató 261101_2143; Bloc B8) · Silenciar una conversa: la columna
     xat_participants.silenciat_fins_al, que ja es llig, es pot escriure.
     Opcional: sense ella, el silenci es queda en la memòria de la pàgina
     (XatContext), mai a l'emmagatzematge del navegador. Forma (config sempre
     l'últim):
       silenciaFil({ filId, durada }, config) → Promise<{ silenciatFinsAl: string | null }>
         durada de DURADES_SILENCI (davall): '8h', '1setmana', 'sempre' o
         'cap' (lleva el silenci). La interfície mai no calcula dates: passa
         la durada. silenciatFinsAl és la data ISO de fi (per a «sempre», el
         mateix instant que SILENCI_SEMPRE: una data finita, mai 'infinity'
         ni null) o null. El text pot variar d'un adaptador a l'altre (el
         servidor torna '+00:00', la llavor 'Z'): compareu l'instant
         (Date.parse) o l'any ≥ 9999, mai la igualtat de text.
     Errors amb `code`: SILENCI_INVALID (una durada o un fil invàlids, sense
     cap petició, o SDP-XAT-050 del servidor), XAT_NO_PARTICIPANT (no eres
     membre actiu del fil, SDP-XAT-006) i NO-DISPONIBLE (un servidor sense la
     RPC). Ho servix xat_silencia(p_fil_id, p_durada) de
     2611020417_xat_avisos_push.sql (NO aplicada: l'aplica el Mestre), i la data de fi la posa el
     rellotge del servidor; en llavor i en local, finsAlDelSilenci (davall). */
  silenciXat: Object.freeze([
    'silenciaFil'
  ]),
  /* FEDI23 · Opcional i completa; config sempre l'últim argument.
     preferenciesConnexions({tipus,id}, config) i desaVisibilitatConnexions(
       {tipus,id,visibilitatConnexions:'publica'|'privada',connexio?:{tipus,id}}, config)
       → {tipus,id,visibilitatConnexions,connexions:DTO[]} només per a la persona
       pròpia, owner/admin d'entitat o autoritat explícita de poble. Les files
       pròpies inclouen connexions privades d'entitat i pertinences vives.
     connexionsPubliquesDe({tipus,id}, config) i membresIEntitatsConnectadesDe(
       {tipus:'entitat'|'poble',id}, config) → DTO[], sense bypass de propietari.
       DTO:{tipus,id,nom,avatar,ruta,creatAl,direccio,rol?,visibilitatConnexions?};
       direccio:sortint|entrant|mutua|membre|poble. Només perfils públics,
       sense baixa/bloqueig i amb consentiment. Global privada per defecte
       domina el vincle (publica per defecte); exclusions privades dels dos
       extrems oculten la relació. Una inversa privada no es revela com a mútua.
     inclouPersonaEnEntitat({orgId,personaId,rol}, config) → {orgId,personaId,rol};
       administrador|treballador|usuari; treballador és funció sense autoritat,
       només owner nomena administradors i mai es crea owner per esta via.
     solicitaUnirSeAEntitat({orgId,rol}, config) → {orgId,personaId,rol,estat:'pendent'};
       idempotent per org/persona, màxim 20 pendents; mai atorga cap rol.
     Els membres públics requerixen pertinença viva i consentiment de persona
     i entitat; cap gestor pot publicar les preferències d'una altra persona. */
  connexionsPubliques: Object.freeze(['preferenciesConnexions', 'desaVisibilitatConnexions', 'connexionsPubliquesDe',
    'membresIEntitatsConnectadesDe', 'inclouPersonaEnEntitat', 'solicitaUnirSeAEntitat'])
});

/* Pla 261022_1955 (T1) · El sostre de listPublicOrganizations: una sola font per
   als adaptadors i per a qui busca (si torna el sostre, pregunta al servidor
   per la consulta, com el padró amb LIMIT_PADRO). */
export const LIMIT_DIRECTORI_ENTITATS = 500;

/* T2 · D04/D10 (assalt 261101) · Les col·leccions de llegixDadesObertes, en
   l'ordre del contracte, i el sostre de cada llista: una llista més llarga
   atura l'exportació (mai es talla en silenci). */
export const COLECCIONS_DADES_OBERTES = Object.freeze(['noticies', 'agenda', 'memoria', 'memoriaOral']);
export const LIMIT_DADES_OBERTES = 5000;

/* T8b · P0-23 (BOT-A2; Gauntlet Claude 261025_1705; assalt 261101) · La
   versió de l'app nativa d'este codi, la que es compara amb
   versioMinimaClient (capacitat 'versioClient'). Un enter que PUJA A CADA
   BUILD DE BOTIGA i que val el mateix que el --build de scripts/botigues (el
   versionCode d'android/app/build.gradle i el CURRENT_PROJECT_VERSION del
   pbxproj d'iOS, 2 tots dos des de 8bd00f0ab): puja-ios.mjs i
   puja-android.mjs paren si no casen (versio-client.mjs). El build 1
   (TestFlight 1.0.0 (1) i l'AAB 1.0.0+1) no porta la porta: el 2 és el primer
   que la porta. Mai per davall del mínim del servidor (2611011510 i les que la
   tornen a crear): l'app nova es bloquejaria ella mateixa. */
export const VERSIO_CLIENT_NATIU = 2;

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
   pàgines en tenen; fins aleshores, la resta diu que no n'hi ha.
   Gauntlet 261016_1530 (Bloc 3.6.3) · La clau '/iaia' NO canvia: és el xat
   públic de la IAIA MarIA, i des d'ara la ruta és la de la seua fitxa
   (RUTA_FITXA_IAIA, config/navigation.js), no la d'una secció. El manifest
   que hi vivia és a /anima, sense xat comú propi. El títol és el literal del
   servidor (2610042330_xat_pagina_iaia.sql): canviar-lo és una migració. */
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

/* IDEA-24 (marató 261101_2143, B4) · Els tipus d'organització que canvien de
   propietària per transferència (capacitat 'transferenciaPropietat'), els
   mateixos que la RPC transfereix_propietat_organitzacio (2610311500, R3
   SQL-01). Una sola font per als adaptadors i per a la interfície. */
export const TIPUS_TRANSFERIBLES = Object.freeze(['group', 'company']);

/**
 * La destinatària d'una transferència de propietat ({ tipus: 'persona', id }),
 * normalitzada amb la regla de membreDOrganitzacio; si no és una persona amb
 * id, llança SDP-ORGMEM-001. No valida la forma de l'id. Pura.
 */
export function destinatariaDeTransferencia(dades) {
  const membre = membreDOrganitzacio(dades, { ambRol: false });
  if (membre.tipus !== 'persona') throw errorDeMembre('SDP-ORGMEM-001');
  return membre;
}

/* ── Fase D (261020, tasca 2; pla 261020_1300) · La moderació ────────────
   Una sola llista blanca i una sola regla d'entrada per a tots els
   adaptadors de 'moderacio' i 'normesConvivencia' (Supabase, la llavor i
   qualsevol node federat), com TIPUS_SUBJECTE_XAT i
   MISSATGES_MEMBRES_ORGANITZACIO: la interfície decidix pel `code`, mai pel
   text. Són els CHECK de
   supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql, i
   src/data/supabase/moderacio.migracio.test.js els contrasta. */
export const TIPUS_OBJECTE_DENUNCIA = Object.freeze(['publicacio', 'producte', 'esdeveniment', 'missatge', 'persona', 'entitat']);
export const MOTIUS_DENUNCIA = Object.freeze(['ofensiu', 'spam_frau', 'desinformacio', 'altre']);
export const TIPUS_BLOQUEJAT = Object.freeze(['persona', 'entitat']);
export const MAXIM_DETALL_DENUNCIA = 1000;
export const MAXIM_NOM_BLOQUEJAT = 120;
/* Canviar el text de les normes vol dir pujar esta data: tothom les torna a acceptar. */
export const VERSIO_NORMES_CONVIVENCIA = '2026-10-24';
const RE_ID_MODERACIO = /^[A-Za-z0-9._:~-]{1,200}$/;
/** Cert si `id` és un identificador que el servidor accepta (el CHECK de la migració). Pura. */
export const esIdDeModeracio = (id) => typeof id === 'string' && RE_ID_MODERACIO.test(id);

export const CODI_MODERACIO = Object.freeze({
  OBJECTIU_INVALID: 'objectiu-invalid', MOTIU_INVALID: 'motiu-invalid', DETALL_MASSA_LLARG: 'detall-massa-llarg',
  AUTOBLOQUEIG: 'autobloqueig', VERSIO_INVALIDA: 'versio-invalida', LIMIT: 'limit',
  SENSE_SESSIO: 'sense-sessio', NO_DISPONIBLE: 'no-disponible', DESCONEGUT: 'desconegut'
});
export const MISSATGE_MODERACIO = Object.freeze({
  'objectiu-invalid': 'El contingut o la persona no són vàlids.',
  'motiu-invalid': 'Tria un dels motius de la llista.',
  'detall-massa-llarg': 'El detall passa de 1.000 caràcters.',
  autobloqueig: 'No et pots bloquejar a tu mateix.',
  'versio-invalida': 'La versió de les normes no és la vigent.',
  limit: 'Massa denúncies o bloquejos en poc de temps. Torna-ho a provar d’ací a una estona.',
  'sense-sessio': 'Cal entrar al compte.',
  'no-disponible': 'El servidor encara no té la moderació. Cal aplicar la migració pendent.',
  desconegut: 'No s’ha pogut completar. Torna-ho a provar.'
});

/** Un Error amb el `code` de CODI_MODERACIO (un codi desconegut és 'desconegut') i, si n'hi ha, la causa. Pura. */
export function errorDeModeracio(code, cause) {
  const codi = Object.hasOwn(MISSATGE_MODERACIO, code) ? code : CODI_MODERACIO.DESCONEGUT;
  return Object.assign(new Error(MISSATGE_MODERACIO[codi], cause ? { cause } : undefined), { code: codi });
}

/**
 * La denúncia normalitzada ({ objecte: { tipus, id }, motiu, detall, autor,
 * filId }); si no és vàlida, llança amb el code (OBJECTIU_INVALID,
 * MOTIU_INVALID o DETALL_MASSA_LLARG). Un autor o un fil que no casen amb
 * la regla es descarten (null), no tomben la denúncia. Pura.
 */
export function denunciaDelContracte(dades) {
  const tipus = String(dades?.objecte?.tipus ?? '').trim();
  const id = String(dades?.objecte?.id ?? '').trim();
  if (!TIPUS_OBJECTE_DENUNCIA.includes(tipus) || !esIdDeModeracio(id)) throw errorDeModeracio(CODI_MODERACIO.OBJECTIU_INVALID);
  const motiu = String(dades?.motiu ?? '').trim();
  if (!MOTIUS_DENUNCIA.includes(motiu)) throw errorDeModeracio(CODI_MODERACIO.MOTIU_INVALID);
  const detall = typeof dades?.detall === 'string' ? dades.detall.trim() : '';
  // .length compta unitats UTF-16 (≥ char_length de Postgres): mai s'envia el que el servidor rebutjaria.
  if (detall.length > MAXIM_DETALL_DENUNCIA) throw errorDeModeracio(CODI_MODERACIO.DETALL_MASSA_LLARG);
  const autorTipus = String(dades?.autor?.tipus ?? '').trim();
  const autorId = String(dades?.autor?.id ?? '').trim();
  const autor = TIPUS_BLOQUEJAT.includes(autorTipus) && esIdDeModeracio(autorId) ? { tipus: autorTipus, id: autorId } : null;
  const filId = String(dades?.filId ?? '').trim();
  return { objecte: { tipus, id }, motiu, detall: detall || null, autor, filId: esIdDeModeracio(filId) ? filId : null };
}

/**
 * { tipus, id, nom } d'un bloqueig (o { tipus, id } amb `ambNom: false`),
 * normalitzat; si no és vàlid, OBJECTIU_INVALID. El nom es retalla a
 * MAXIM_NOM_BLOQUEJAT i, buit, és null. No valida si l'id és un UUID: cada
 * adaptador sap quins ids són seus. Pura.
 */
export function autorDelContracte(dades, { ambNom = true } = {}) {
  const tipus = String(dades?.tipus ?? '').trim();
  const id = String(dades?.id ?? '').trim();
  if (!TIPUS_BLOQUEJAT.includes(tipus) || !esIdDeModeracio(id)) throw errorDeModeracio(CODI_MODERACIO.OBJECTIU_INVALID);
  if (!ambNom) return { tipus, id };
  const nom = typeof dades?.nom === 'string' ? dades.nom.trim().slice(0, MAXIM_NOM_BLOQUEJAT) : '';
  return { tipus, id, nom: nom || null };
}

/* ── T6b (IDEA-14; decisió del Mestre, 261024) · Els seguiments ──────────
   Una sola llista blanca, una sola taula de codis i una sola regla d'entrada
   per a tots els adaptadors de 'seguiments' (Supabase, la llavor i qualsevol
   node federat), com MISSATGES_MEMBRES_ORGANITZACIO: la interfície decidix
   pel `code`, mai pel text. Són el CHECK i els codis de
   supabase/migrations/2610241430_seguiments.sql, i
   src/data/supabase/seguiments.migracio.test.js els contrasta. SDP-SEG-007
   és d'IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025):
   2610250100_seguiments_des_d_entitat.sql, que contrasta
   src/data/supabase/seguimentsEntitat.migracio.test.js. */
export const TIPUS_SEGUIT = Object.freeze(['persona', 'entitat']);
export const MISSATGES_SEGUIMENTS = Object.freeze({
  'SDP-SEG-000': 'Cal entrar al compte per a seguir algú.',
  'SDP-SEG-001': 'La persona o l’entitat no són vàlides.',
  'SDP-SEG-002': 'No trobem esta persona o esta entitat, o no la pots seguir.',
  'SDP-SEG-003': 'No et pots seguir a tu mateix ni seguir una entitat que administres.',
  'SDP-SEG-004': 'L’has bloquejada: desbloqueja-la abans de seguir-la.',
  'SDP-SEG-005': 'Només qui administra l’entitat veu qui la seguix.',
  'SDP-SEG-006': 'Massa seguiments en poc de temps. Torna-ho a provar d’ací a una estona.',
  'SDP-SEG-007': 'No administres l’entitat amb què vols connectar.',
  'NO-DISPONIBLE': 'El servidor encara no té els seguiments. Cal aplicar la migració pendent.',
  DESCONEGUT: 'No s’ha pogut completar. Torna-ho a provar.'
});
const RE_ID_SEGUIT = /^[A-Za-z0-9._:~-]{1,200}$/;

/** Un Error amb el `code` de MISSATGES_SEGUIMENTS (un codi desconegut és DESCONEGUT) i, si n'hi ha, la causa. Pura. */
export function errorDeSeguiment(codi, cause) {
  const code = Object.hasOwn(MISSATGES_SEGUIMENTS, codi) ? codi : 'DESCONEGUT';
  return Object.assign(new Error(MISSATGES_SEGUIMENTS[code], cause ? { cause } : undefined), { code });
}

/**
 * El seguit ({ tipus, id }) normalitzat; si el tipus no és de TIPUS_SEGUIT o
 * l'id no és cap identificador, llança SDP-SEG-001. No valida si l'id és un
 * UUID: cada adaptador sap quins ids són seus. Pura.
 */
export function seguitDelContracte(dades) {
  const tipus = String(dades?.tipus ?? '').trim();
  const id = String(dades?.id ?? '').trim();
  if (!TIPUS_SEGUIT.includes(tipus) || !RE_ID_SEGUIT.test(id)) throw errorDeSeguiment('SDP-SEG-001');
  return { tipus, id };
}

/**
 * IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · L'entitat amb
 * què es connecta (`com` de { tipus, id, com }), normalitzada: null si no n'hi
 * ha (absent, null o ''), i si no és cap identificador, SDP-SEG-001, com l'id.
 * Si l'administres ho diu cada adaptador (SDP-SEG-007). Pura.
 */
export function comDelContracte(dades) {
  const com = dades?.com;
  if (com === undefined || com === null) return null;
  const id = String(com).trim();
  if (!id) return null;
  if (!RE_ID_SEGUIT.test(id)) throw errorDeSeguiment('SDP-SEG-001');
  return id;
}

/* IDEA-22, punt 2 (pla 261025_0200) · Els codis de la tria de la titular
   (capacitat 'consentimentTitular'), els mateixos que
   supabase/migrations/2610250300_titular_public.sql, que contrasta
   src/data/supabase/titularPublic.migracio.test.js. La lectura
   (loadTitularPublic) no en té cap: torna null sense dir per què. */
export const MISSATGES_TITULAR = Object.freeze({
  'SDP-TIT-000': 'Cal entrar al compte per a triar si et mostrem com a titular.',
  'SDP-TIT-001': 'Només la propietària de l’organització pot triar si es mostra com a titular.',
  'SDP-TIT-002': 'La tria no és vàlida.',
  'NO-DISPONIBLE': 'El servidor encara no sap mostrar la titular. Cal aplicar la migració pendent.',
  DESCONEGUT: 'No s’ha pogut completar. Torna-ho a provar.'
});

/** Un Error amb el `code` de MISSATGES_TITULAR (un codi desconegut és DESCONEGUT) i, si n'hi ha, la causa. Pura. */
export function errorDeTitular(codi, cause) {
  const code = Object.hasOwn(MISSATGES_TITULAR, codi) ? codi : 'DESCONEGUT';
  return Object.assign(new Error(MISSATGES_TITULAR[code], cause ? { cause } : undefined), { code });
}

/**
 * La titular de loadTitularPublic amb la forma del contracte, i res més (cap
 * correu ni cap rol encara que l'adaptador en porte): { tipus: 'persona', id,
 * nom, avatar } o null. Pura.
 */
export function titularDelContracte(valor) {
  if (!valor || typeof valor !== 'object' || valor.tipus !== 'persona') return null;
  const id = typeof valor.id === 'string' || typeof valor.id === 'number' ? String(valor.id).trim() : '';
  const nom = typeof valor.nom === 'string' ? valor.nom.trim() : '';
  if (!id || !nom) return null;
  return { tipus: 'persona', id, nom, avatar: typeof valor.avatar === 'string' ? valor.avatar : '' };
}

/* ── B8C-2 (marató 261101_2143; Bloc B8) · Avisos push i silenci del Xat ──
   Les plataformes d'un aparell d'avisos (capacitat 'avisosPush') i les
   durades del silenci (capacitat 'silenciXat'): les mateixes que B8-SERVIDOR
   §2.9 (xat_push_desa passa 'ios' a APNs i 'android' a FCM; xat_silencia
   només admet estes quatre durades). */
export const PLATAFORMES_AVISOS = Object.freeze(['web', 'ios', 'android']);
export const DURADES_SILENCI = Object.freeze(['8h', '1setmana', 'sempre', 'cap']);
/* «Sempre»: 9999-12-31 00:00:00 UTC, el mateix instant que torna el servidor.
   Una data finita a posta: new Date('infinity') és NaN i esSilenciat
   (src/sections/xat/missatges.js) la llegiria com a «no silenciada»; i les
   23:59:59 UTC ja serien l'any 10000 en una sessió de Europe/Madrid. */
export const SILENCI_SEMPRE = '9999-12-31T00:00:00.000Z';
const MS_DEL_SILENCI = Object.freeze({ '8h': 8 * 3600000, '1setmana': 7 * 24 * 3600000 });
const errorDeSilenci = (missatge) => Object.assign(new TypeError(missatge), { code: 'SILENCI_INVALID', codi: 'SILENCI_INVALID', retriable: false });

/**
 * La data de fi (ISO) d'un silenci que comença `ara` (ms o Date): '8h' i
 * '1setmana' sumen al rellotge de l'aparell, 'sempre' és SILENCI_SEMPRE i
 * 'cap' és null. Una durada desconeguda, o un rellotge que no dona una data
 * entre la del rellotge i SILENCI_SEMPRE: TypeError amb code
 * 'SILENCI_INVALID'. Pura. En remot no es desa: la data la posa el servidor
 * (xat_silencia); la usen la llavor, el node local i el silenci en memòria.
 */
export function finsAlDelSilenci(durada, ara = Date.now()) {
  if (typeof durada !== 'string' || !DURADES_SILENCI.includes(durada)) throw errorDeSilenci('La durada del silenci no és vàlida.');
  if (durada === 'cap') return null;
  if (durada === 'sempre') return SILENCI_SEMPRE;
  const inici = ara instanceof Date ? ara.getTime() : ara;
  const fi = typeof inici === 'number' ? inici + MS_DEL_SILENCI[durada] : Number.NaN;
  if (!Number.isFinite(fi) || fi < -8.64e15 || fi > Date.parse(SILENCI_SEMPRE)) throw errorDeSilenci('El rellotge de l’aparell no dona una data de fi vàlida.');
  return new Date(fi).toISOString();
}

/* FEDI23 · Entrades primitives compartides; cap conversió d'objectes ni getter. */
export const MISSATGES_CONNEXIONS = Object.freeze({
  'SDP-CONN-000': 'Cal iniciar sessió.',
  'SDP-CONN-001': 'Les dades de connexió no són vàlides.',
  'SDP-CONN-002': 'No pots gestionar les connexions d’este perfil.',
  'SDP-CONN-003': 'Este perfil no està disponible.',
  'NO-DISPONIBLE': 'El servidor encara no té esta capacitat.',
  DESCONEGUT: 'No s’ha pogut completar la connexió.'
});
export function errorDeConnexions(code, cause) {
  const clau = Object.hasOwn(MISSATGES_CONNEXIONS, code) ? code : 'DESCONEGUT';
  return Object.assign(new Error(MISSATGES_CONNEXIONS[clau]), { code: clau, ...(cause ? { cause } : {}) });
}
function campsConnexions(dades, admesos) {
  if (!dades || typeof dades !== 'object' || Array.isArray(dades)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(dades))) throw errorDeConnexions('SDP-CONN-001');
  const resultat = {};
  for (const clau of Reflect.ownKeys(dades)) {
    const descriptor = Object.getOwnPropertyDescriptor(dades, clau);
    if (typeof clau !== 'string' || !admesos.includes(clau) || !descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) throw errorDeConnexions('SDP-CONN-001');
    resultat[clau] = descriptor.value;
  }
  return resultat;
}
function idConnexions(valor) {
  if (typeof valor !== 'string' || !RE_ID_SEGUIT.test(valor.trim())) throw errorDeConnexions('SDP-CONN-001');
  return valor.trim();
}
export function subjecteConnexionsDelContracte(dades, { ambPoble = true } = {}) {
  const { tipus, id } = campsConnexions(dades, ['tipus', 'id']);
  if (!['persona', 'entitat', ...(ambPoble ? ['poble'] : [])].includes(tipus)) throw errorDeConnexions('SDP-CONN-001');
  return { tipus, id: idConnexions(id) };
}
export function visibilitatConnexionsDelContracte(dades) {
  const entrada = campsConnexions(dades, ['tipus', 'id', 'visibilitatConnexions', 'connexio']);
  const subjecte = subjecteConnexionsDelContracte({ tipus: entrada.tipus, id: entrada.id });
  if (!['publica', 'privada'].includes(entrada.visibilitatConnexions)) throw errorDeConnexions('SDP-CONN-001');
  return { ...subjecte, visibilitatConnexions: entrada.visibilitatConnexions,
    ...(entrada.connexio !== undefined ? { connexio: subjecteConnexionsDelContracte(entrada.connexio) } : {}) };
}
export function inclusioPersonaDelContracte(dades) {
  const { orgId, personaId, rol } = campsConnexions(dades, ['orgId', 'personaId', 'rol']);
  if (!['administrador', 'treballador', 'usuari'].includes(rol)) throw errorDeConnexions('SDP-CONN-001');
  return { orgId: idConnexions(orgId), personaId: idConnexions(personaId), rol };
}
export function sollicitudEntitatDelContracte(dades) {
  const { orgId, rol } = campsConnexions(dades, ['orgId', 'rol']);
  if (!['administrador', 'treballador', 'usuari'].includes(rol)) throw errorDeConnexions('SDP-CONN-001');
  return { orgId: idConnexions(orgId), rol };
}
