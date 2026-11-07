---
type: document
status: canonic
description: "Documentació canònica de Sóc de Poble."
---
# Supabase

## Fitxers

- `migrations/2609080000_initial_schema.sql`
  Taules base, funcions de `private`, triggers d'alta i polítiques RLS.

- `migrations/2609080100_xat_v2.sql`
  Les quatre taules del Xat v2 (`xat_fils`, `xat_participants`, `xat_missatges`,
  `xat_lectures`), el trigger de `actualitzat_al` i les polítiques RLS.

- `migrations/2609080200_xat_v2_correccions.sql`
  Pegat correctiu del Xat v2. **Tampoc és opcional.** Vegeu «Per què cal el
  pegat» més avall.

- `migrations/2609080300_xat_v2_membres.sql`
  L'RPC `membres_del_poble()`. Sense ell no hi ha manera d'obtindre l'uuid de
  ningú i el botó «Nova conversa» és impossible. Porta una decisió de
  governança dins: vegeu «El directori del poble».

- `migrations/2609110600_perfil_avatar_i_permisos.sql`
  Permisos DML i definició RLS bàsica per a perfils.

- `migrations/2609121500_correccio_privacitat_perfils.sql`
  Correcció estricta RLS per a perfils i organitzacions.

- `migrations/2609121600_admin_panel.sql`
  Funcions RPC per a l'admin panel: `admin_list_users()` i
  `admin_list_organizations()`. **Estat remot no acreditat sencer**: la
  lectura REST del 6-11-2026 hi troba `admin_list_users()` (401 42501).
  `admin_list_organizations()` donava 404 PGRST202 a les 22:08 CET (era el 404
  de «Calcula els indicadors» de la captura de les 21:53), i a les 23:22 i a
  les 23:53 respon 401 42501: algú l'ha creada entremig, sense cap migració
  nova al repositori, i no se sap si amb esta migració sencera. No la torneu a
  aplicar sencera: tornaria a concedir a `authenticated` l'EXECUTE
  d'`admin_list_users()`, que la 2609200300 revoca. Si ja s'hi ha tornat a
  aplicar, ho dirà
  `select has_function_privilege('authenticated', 'public.admin_list_users()', 'EXECUTE');`
  (lectura), i caldrà tornar a passar-hi la revocació de la 2609200300.

- `migrations/2609130500_bucket_mitjans.sql`
  Creació del bucket `mitjans` per a àudios i avatars.

- `migrations/2609140000_schema_notes.sql`
  La taula `notes` i les seues quatre polítiques. **No és opcional**: sense ella
  el Bloc de Notes torna 404 i el «Retall» del Xat no es pot guardar.

- `migrations/2609140100_auditoria_rls_fixes.sql`
  Paquet global d'auditoria (Deepseek, Perplexity, Dola, Claude).
  Resol spoofing de tenant al registre, SSRF i accessos anon RLS.

- `migrations/2609150000_seguretat_profunda_deepseek.sql`
  La taula `consentiments`, l'RPC `registra_consentiment()`, l'alta amb
  `tenant_id` obligatori i la paginació d'`admin_list_users`.

- `migrations/2609160600_politiques_superadmin_organitzacions.sql`
  Lectura pública d'`app_content` i del directori d'organitzacions per a
  convidats, i `create_organization` sense l'upsert que fallava sempre.

- `migrations/2609162300_correccions_mur_i_xat.sql`
  El trigger d'autor neteja `id`, `created_at` i `author` del payload (C1), i
  només qui ha creat un fil hi pot afegir persones (C2).

- `migrations/2609191650_bucket_mitjans_privats.sql`
  El bucket privat `mitjans_privats` per als adjunts de les notes.

- `migrations/2609200300_blindatge_storage_i_contingut.sql`
  Rutes pròpies a Storage, polítiques restrictives de frontera i llista
  explícita de claus públiques d'`app_content`.

- `migrations/2609200600_xat_limit_correccio.sql`
  `xat_missatges_del_fil()` torna els 50 missatges més recents.

- `migrations/2609211820_fix_security_definer.sql`
  Força `security_invoker` a la vista `organization_directory`.

- `migrations/2609261200_publicacions_autoria.sql`
  Autoria dual de les publicacions (persona o entitat), `updated_at` i
  `organizations.logo_url`.

- `migrations/2609261500_identitat_perfil_f1.sql`
  Fase 1: fitxa editable de persona i d'organització (`lema`,
  `presentacio_html`, `hero_url`), consentiment versionat i demostrable, alta
  que no cau mai, exportació de dades, baixa amb quarantena i purga. Vegeu
  «Baixa, purga i consentiment».

- `migrations/2609262232_copyright_editor.sql`
  Drets d'autor lliures de l'editor (límit de 256 caràcters compartit amb el
  client): afig la columna `copyright text not null default ''` amb el seu
  `CHECK (char_length(copyright) <= 256)` a `public.notes`, `public.profiles`
  i `public.organizations`, concedeix `select (copyright)` a `anon` i
  `authenticated` sobre `public.organizations` i `update (copyright)` a
  `authenticated` sobre `public.organizations` i `public.profiles`, i
  recrea la vista `public.organization_directory` (`security_invoker = true`,
  `security_barrier = true`) incloent-hi `copyright` al final. Va després de
  2609261500. Estat remot no acreditat: comprovar abans d'aplicar.

- `migrations/2609270200_xat_f0_fonament.sql`
  Xat F0 (Fonament): número d'ordre `seq` per conversa i marques per
  participant (`llegit_fins_seq`, `rebut_fins_seq`), cap escriptura directa a
  `xat_missatges` (tot per RPC), visibilitat per finestra de `seq`, i les RPC
  `xat_envia` (idempotent per `id`), `xat_historial`, `xat_nous`, `xat_marca` i
  `xat_fils_meus` v2. Vegeu «Xat F0: seq, marques i RPC».

- `migrations/2609271400_notes_paperera.sql`
  Paperera i arxiu del bloc de notes (`public.notes`): afig l'ajust
  `dies_paperera_notes = 30` a `private.ajustos`, les columnes `status`
  (`activa`, `paperera`, `arxivada`; CHECK `notes_status_valid`) i
  `trashed_at` amb la coherència `notes_paperera_amb_data` i l'índex
  `idx_notes_tenant_owner_status`, el disparador `trg_notes_paperera`
  (`public.notes_marca_paperera()`) perquè `trashed_at` el fixe sempre el
  servidor, i la purga `private.purga_paperera_notes(integer)` als 30 dies,
  programada amb `pg_cron` (`sdp-purga-paperera-notes`) només si l'extensió
  és activa. Codis: `SDP-NOTES-900`. Va després de 2609261500. Estat remot no acreditat: comprovar abans d'aplicar.

- `migrations/2609272100_notes_origen.sql`
  Lògica d'Usuari (T5): la columna `notes.origen` (jsonb) que recorda d'on ve
  una nota connectada des de «Connectar». Sense ella, el Bloc continua
  funcionant (la llista de resums no la demana) però crear una connexió en
  remot falla fins que s'aplique.

- `migrations/2609272200_xat_entitats.sql`
  Xat d'entitats (conversa privada entre persona veïna i organització): afig
  `interlocutor_id` a `public.xat_fils`, `com_org_id` a
  `public.xat_missatges` i l'índex únic `xat_fils_entitat_interlocutor_uq`,
  redefinix `private.xat_participant_vigent`, `private.es_participant`,
  `private.xat_pot_veure_participant`, `private.seq_visible` i
  `private.es_admin_del_fil`, afig `private.xat_alta_gestor_entitat` i
  `public.membres_del_poble`, i torna a crear `crea_fil_directe`,
  `xat_envia`, `xat_historial`, `xat_nous`, `xat_marca`, `xat_fils_meus` i
  `xat_missatges_del_fil`. Va després de 2609272100. Aplicada al node remot
  el 261009 segons la capçalera de 2610241410.

- `migrations/2609272201_grups_mare.sql`
  Coherència entre RPC i RLS en crear un grup amb entitat mare: redefinix
  `private.can_create_group(p_parent_organization_id uuid, p_tenant_id uuid)`
  (`SECURITY DEFINER`, `search_path = ''`) exigint que
  `p_parent_organization_id` no siga `null` i apunte a una organització del
  mateix poble de tipus `company`, `entity` o `city_hall` on qui crida siga
  `owner` o `admin`, evitant el 403 opac posterior de la política d'inserció.
  Va després de 2609261200. Estat remot no acreditat: comprovar abans d'aplicar.

- `migrations/2609281500_lema_entradilla_256.sql`
  T49: l'entradilla (`lema`) de perfils i organitzacions passa de 120 a 256
  caràcters. Deixa un sol CHECK per taula (`profiles_lema_llargaria`,
  `organizations_lema_llargaria`), trobat per definició perquè el
  d'organitzacions naix sense nom, i torna a crear `create_organization` amb
  el lema retallat a 256. El client en té la font única a
  `src/data/limitsText.js`. **Cal aplicar-la abans de publicar el client**: si
  no, un lema de 121 a 256 caràcters rep l'avís genèric del servidor (el text
  es conserva, però no es desa). Si la columna no existix, ho avisa
  `SDP-LEMA-001` i la migració no falla.

- `migrations/2609282035_perfil_emoticona.sql`
  T66: l'emoticona de la fitxa de la persona, `profiles.icon` (text, admet
  `null`), amb el CHECK `profiles_icon_llargaria` (`char_length(icon) <= 16`)
  i el permís de columna `grant update (icon)` per a `authenticated`. La
  lectura ja la dona el SELECT de taula; cap política, vista ni RPC nova. El
  client en té el límit a `src/data/limitsText.js` (`MAXIM_EMOTICONA`) i la
  forma (un sol emoji) la valida `emojiSol`. Additiva i idempotent. **Va
  després de 2609281500 i abans de publicar el client**: si no, el desat de
  l'emoticona es queda en quarantena al dispositiu amb l'avís «Este camp
  encara no té columna» (PGRST204) i no es perd. Deute declarat: les
  organitzacions i els agents no en tenen columna, i la baixa no la retira
  ni la torna (com `copyright`).

- `migrations/2609282100_xat_de_pagina.sql`
  T63.2 i T67: el xat comú de les Pàgines Universals. `xat_fils` guarda el
  subjecte (`subjecte_tipus`, `subjecte_id`, `subjecte_ruta`,
  `subjecte_titol` i `subjecte_uri`) amb llista blanca i índex únic parcial;
  les RPC `obri_fil_de_pagina`, `xat_llig_fil_de_pagina` i
  `xat_entra_al_fil_de_pagina`, el disparador dels Avisos i la v4 de
  `xat_fils_meus`. Redefinix, amb una sola condició més cadascuna,
  `private.xat_participant_vigent`, `private.xat_pot_veure_participant`
  (2609272200) i `private.purga_una_baixa` (2609261500). Va després de F0
  (2609270200), de `xat_entitats` (2609272200) i de 2609282035. **Aplicada
  al node remot pel Mestre el 261009**, a mà a l'editor SQL i en l'ordre
  2609282100 → 2610042330 → 2610090100, amb «Success» a totes tres. Les
  dependències ja hi eren: l'èxit de la convergència (`SDP-CONV-004`) ho
  acredita. Sense moderació: vegeu «Xat de pàgina i comunitats».

- `migrations/2609291200_baixa_icon_copyright.sql`
  La quarantena retira també `icon` i `copyright` del perfil i de les
  metadades d'autenticació; cancel·lar la baixa els restaura de la còpia privada.

- `migrations/2609291210_xat_cerca_accents.sql`
  El directori busca sense accents ni distinció de majúscules i admet paraules
  en qualsevol ordre, conservant les restriccions de poble i visibilitat.

- `migrations/2609291230_xat_realtime_lectura.sql`
  Autoritza només els participants vigents a rebre avisos privats del seu fil.
  Exigix RLS ja actiu a `realtime.messages`; no autoritza emissions del client.

- `migrations/2610021520_perfil_public.sql`
  Ordre del Mestre (261002): la persona al cercador. L'RPC
  `perfil_public(p_id)` torna la fitxa sencera a la mateixa persona o si és
  publicada (`is_public`); si no, només `id`, `full_name`, `avatar_url` i
  `town_name`, i només a qui comparteix poble (legalContent §13). Mai una
  baixa, mai sense sessió (`SDP-PERFIL-010`). Additiva; **no aplicada**.
  **Va després de 2609291230 i abans de publicar el client**: l'adaptador de
  Supabase declara sempre la capacitat `directori` i el cercador enllaça cada
  persona del padró a la seua fitxa; sense la funció, el clic acaba en «Perfil
  no trobat».

- `migrations/2610042330_xat_pagina_iaia.sql`
  Correcció posterior al xat de pàgina: `/iaia` és la clau i ruta canòniques;
  l'entrada antiga exacta `/ia` resol al mateix fil. Reanomena les metadades
  del subjecte preservant id, missatges, seq, participants i permisos. Un
  CHECK impedeix recrear la clau antiga. Si un poble ja té les dos files,
  `SDP-XAT-014` avorta tota la transacció; no fusiona ni esborra històries.
  Va després de 2609282100 i les seues dependències, abans de publicar un
  client amb la nova ruta; conserva la condició de moderació. **Aplicada al
  node remot pel Mestre el 261009**, just després de 2609282100.

- `migrations/2610042350_convergencia_perfil_i_create_organization.sql`
  Ordre del Mestre (261004, F1): convergència d'una base desfasada. Errors
  reals: Visibilitat de la fitxa amb PGRST204 (`profiles.is_public` absent),
  Avatar i Subtítol amb «no tens permís» i Nova organització amb PGRST203
  (més d'una `create_organization`). Que l'error d'Avatar i Subtítol siga un
  42501 de PostgREST (permís de columna absent) és una INFERÈNCIA: podria ser
  un 403 de GoTrue al PUT de `/auth/v1/user`, i es confirma a la pestanya
  Xarxa del navegador; si és GoTrue, esta migració no el cura. Afig
  `is_public` si falta, torna a donar el permís d'UPDATE de cada columna de
  `CAMPS_PERFIL` que existix (`SDP-CONV-001` avisa de les absents) i esborra,
  sense CASCADE, tota funció `create_organization` (`prokind = 'f'`) que no
  siga la canònica de 7 arguments; si la canònica falta, avorta sencera
  (`SDP-CONV-002`). Cap
  política ni funció nova; **no aplicada**. **Va després de totes les
  pendents d'esta llista, en ordre alfabètic, i abans de publicar el
  client**; no en substituïx cap. Abans d'aplicar-la, el Mestre o Sollutia
  executen les quatre consultes de només lectura de la capçalera.
  **No torneu a executar 2609110600 sola per a «arreglar» `is_public`**: la
  seua política «profiles read own» per a `authenticated` i `anon` reobriria
  el padró sencer, que 2609121500, 2609150000 i 2609160600 tornen a tancar.

- `migrations/2610061448_superadmin_aal2.sql`
  Exigència de segon factor (AAL2 / 2FA) per als privilegis de
  superadministració: redefinix `private.es_superadmin()` (`SECURITY DEFINER`,
  `search_path = ''`) comprovant tant la fila `role = 'superadmin'` a
  `public.user_platform_roles` com `(select auth.jwt() ->> 'aal') = 'aal2'`.
  2610101900 va després d'esta. **NO aplicada: l'aplica el Mestre, mai un
  agent**.

- `migrations/2610061450_capcalera_client_ip.sql`
  V-FW-02 i V-LOGIN-07 (estil Vigilante 2.11.8): endurix
  `private.capcalera_client(p_que text)` (`search_path = ''`) per a llegir
  primer `cf-connecting-ip`, després `x-real-ip` i, si només hi ha
  `x-forwarded-for`, l'últim element de la dreta (l'afegit per la
  passarel·la de confiança, mai l'esquerra falsificable pel visitant), i
  trunca `user-agent` a 300 caràcters. Va després de 2609261500. **NO
  aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610072230_mur_imatges_propies.sql`
  Decisió 3 del Mestre (261007 · Privacitat d'IP al Mur): prohibix imatges
  externes de tercers a `public.section_submissions` per a les seccions
  `mur`, `mercat` i `events`. Crea `private.origens_mitjans_propis()`,
  `private.mur_imatge_propia(jsonb, text[])`,
  `private.mur_neteja_imatges(jsonb, text[])` i el disparador
  `sdp_mur_imatges_propies` (`private.trg_mur_imatges_propies()`, `BEFORE
  INSERT OR UPDATE`), que buida qualsevol URL d'imatge que no siga pròpia
  (`/assets/…`, `sdp-media://…`, `data:image/(png|jpeg|jpg|webp|gif|avif)` o
  un origen declarat a `private.ajustos`). Les files existents no es toquen.
  Requerix 2609080000..2609261500. Estat remot no acreditat: comprovar abans d'aplicar.

- `migrations/2610081400_grups_sense_mare.sql`
  Ordre del Mestre (261008, grup C): un grup ja no necessita empresa mare.
  `private.can_create_group` torna a acceptar una mare nul·la i la política
  d'INSERT «members create organizations» ja no l'exigix al grup; amb mare,
  la frontera de 2609272201 (mateix poble, `company`, `entity` o
  `city_hall`, administrada per qui crida) no canvia. No redefinix
  `create_organization`. Additiva; **no aplicada: s'aplica
  ABANS de publicar el client, després de 2610072230**. Sense ella, un grup
  sense mare rep «El grup necessita una empresa mare que pugues administrar».

- `migrations/2610081401_organitzacions_poble.sql`
  Ordre del Mestre (261008, grup C): el poble d'una organització.
  `organizations.town_name` (text, `null` = sense poble, CHECK de 120
  caràcters), permís de lectura per a `anon` i `authenticated` i
  d'actualització per a `authenticated` (la fila la protegix la política de
  gestores), i la columna al final de `organization_directory` i de
  `list_my_organizations`. Additiva; **no aplicada: s'aplica
  ABANS de publicar el client, després de 2610081400**. Abans d'aplicar-la,
  la consulta de lectura de la capçalera ha de tornar les 14 columnes del
  directori de 2609262232.

- `migrations/2610081402_membres_organitzacio.sql`
  Ordre del Mestre (261008, grup C): els membres d'una organització. La
  taula `organization_member_organizations` (una organització membre d'una
  altra del mateix poble, sense cap permís heretat) i les RPC
  `membres_organitzacio`, `desa_membre_organitzacio` i
  `lleva_membre_organitzacio` (alta directa, eixida pròpia, només la
  propietària gestiona les administradores, llista només per a owner i
  admin; codis `SDP-ORGMEM-000` a `008`). Additiva; **no aplicada: s'aplica
  ABANS de publicar el client, després de 2610081401**. Sense ella, la
  pestanya «Membres» diu que el servidor encara no els gestiona.

- `migrations/2610081543_xat_consentiment_i_metadades.sql`
  Auditoria del xat 261008 (B03 i B08). `membres_del_poble` torna a filtrar
  les persones per consentiment RGPD (`consentiment_rgpd_at is not null`,
  com 2609261500) i `crea_fil_directe` rebutja crear un directe nou amb una
  persona sense consentiment (`SDP-XAT-016`, només dins de `if v_fil is
  null`; les entitats no hi canvien). Un directe que ja existix es continua
  retrobant i `xat_envia` hi continua acceptant missatges: tancar-los quan
  algú retira el consentiment és decisió del Mestre (B03, amb B02).
  `xat_envia` ignora `p_metadades` i guarda sempre `'{}'::jsonb`, amb la
  mateixa signatura i els mateixos permisos. Les tres són les últimes
  versions lletra a lletra amb eixe sol canvi. Additiva i idempotent; **NO
  aplicada: l'aplica el Mestre, després de 2610081402**. Abans d'aplicar-la,
  una consulta de lectura al node: `select count(*) filter (where
  consentiment_rgpd_at is null) as sense, count(*) as total from
  public.profiles;`. Tots els perfils de `sense` desapareixen del padró del
  xat: si no és un recompte residual (clau antiga 'rgpd' de 2609080000, altes
  per OAuth de 2609261500), cal un pla de reconsentiment abans d'aplicar-la.
  La fixture `tests/fixtures/xat-entitats/regression.sql` també ha de donar
  consentiment als perfils amb qui obri directes nous.

- `migrations/2610090100_convergencia_xat_de_pagina.sql`
  Onada 5 (261009, F6): convergència del xat de pàgina. Error real: `POST
  /rest/v1/rpc/obri_fil_de_pagina` → 404 (PGRST202). El client ja envia els
  noms de l'única signatura de 2609282100 (`p_tenant_id`, `p_tipus`, `p_id`,
  `p_titol`); que al node li falte la cadena 2609270200 → 2609272200 →
  2609282100 → 2610042330 és una INFERÈNCIA. No crea ni redefinix la funció:
  avorta sencera si falten les dependències de la RPC (`SDP-CONV-004`, amb la
  llista i la migració que les crea), si falta la canònica
  `obri_fil_de_pagina(uuid, text, text, text)` security definer amb
  `search_path` buit (`SDP-CONV-005`) o si falta el CHECK
  `xat_fils_pagina_iaia_canonica` de 2610042330 (`SDP-CONV-007`); esborra,
  sense CASCADE, tota altra sobrecàrrega (`SDP-CONV-006`), torna a donar els
  permisos de 2609282100 (revoke de `public` i `anon`, grant a
  `authenticated`) i recarrega l'esquema. Cap taula, política ni funció
  nova. L'aplica el Mestre, després de les pendents d'esta llista en ordre
  alfabètic (com a mínim la cadena de dalt); no en substituïx cap. **Aplicada
  al node remot pel Mestre el 261009**, després de 2609282100 i 2610042330,
  amb «Success»: com que avorta si falta res, el seu èxit acredita la cadena
  sencera. Verificació sense efectes del mateix dia, amb la clau anònima
  pública: `rpc/obri_fil_de_pagina` torna 401 `42501` («permission denied»),
  ja no 404 `PGRST202`. El fitxer es conserva byte a byte tal com es va
  aplicar. Per a reaplicar-la en un altre node, primer cinc consultes de
  només lectura, amb el resultat guardat: (1) `select oid::regprocedure, prosecdef,
  proconfig from pg_catalog.pg_proc where proname = 'obri_fil_de_pagina' and
  pronamespace = 'public'::regnamespace;` (buit confirma la inferència);
  (2) `select version from supabase_migrations.schema_migrations order by
  1;`; (3) `select column_name from information_schema.columns where
  table_schema = 'public' and table_name = 'xat_fils' order by
  ordinal_position;`; (4) `select p.oid::regprocedure,
  has_function_privilege('authenticated', p.oid, 'execute') from
  pg_catalog.pg_proc p where p.proname in ('obri_fil_de_pagina',
  'xat_historial', 'xat_envia', 'xat_fils_meus');`; (5) `select conname from
  pg_catalog.pg_constraint where conname = 'xat_fils_pagina_iaia_canonica';`.
  **Avís:** 2609282100 obri els fils de pàgina a tot el poble sense la
  moderació que ella mateixa posa com a condició prèvia (vegeu «Xat de pàgina
  i comunitats»): aplicar la cadena és una decisió del Mestre.

- `migrations/2610101900_personalitzacio_superadmin.sql`
  Onada 11 (261010, tasca 2): la personalització del poble que desa el
  superadmin. Les tres polítiques de lectura d'`app_content` (2609200300)
  admeten dues claus més, `taxonomia` i `estil` (no `agents`: decisió del
  Mestre pendent); la taula `app_content_historial` (una fila per versió
  desada, només la llig la superadmin amb aal2); i les RPC
  `admin_desa_contingut(p_tenant_id, p_clau, p_payload, p_versio)` (control
  de versió optimista: `SDP-ADMIN-006` si la vigent ja no és la que
  s'editava) i `admin_historial_contingut(p_tenant_id, p_clau)` (fins a 50
  versions), darrere de `private.es_superadmin()` (codis `SDP-ADMIN-003` a
  `006`). Additiva i idempotent; **NO aplicada: l'aplica el Mestre, després
  de 2610090100 i de 2610061448**, i **va abans de publicar el client**:
  sense ella la faceta «Etiquetes i categories» del Tauler diu que el
  servidor encara no té les funcions (NO-DISPONIBLE).

- `migrations/2610160250_perfil_update_propi.sql`
  Onada 1.1 (261016, Gauntlet nocturn; Bloc 3.5.3): el 403 del PATCH de la
  fitxa. Error real a producció (gentdelatorre.net) en publicar la fitxa o
  desar-ne un camp: `PATCH /rest/v1/profiles?id=eq.<uid>` → 403, `42501`
  («permission denied for table profiles»). El 42501 és de privilegis de
  columna, no de RLS: Postgres comprova els permisos de taula i de columna
  abans de mirar cap política, i un rebuig de RLS no dona eixe missatge (el
  WITH CHECK en dona un altre i el USING torna zero files, sense error). Per
  això la política sola de l'ordre no el cura. Avorta sencera si
  `public.profiles` no hi és o no té la RLS activa (`SDP-PERFIL-020`); torna a
  donar a `authenticated` el permís d'UPDATE de cada columna de
  `CAMPS_PERFIL` que existix (`SDP-PERFIL-021` avisa de les absents), i deixa
  una sola política permissiva d'UPDATE propi, «profiles update own», amb
  `(select auth.uid()) = id` al USING i al WITH CHECK; si algú ja ha creat a
  mà la de l'ordre («Users can update own profile»), també l'esborra.
  `SDP-PERFIL-022` i `SDP-PERFIL-023` només diagnostiquen. Cap lectura, dada,
  columna, funció, rol ni `create_organization`. Idempotent; **NO aplicada:
  l'aplica el Mestre, mai un agent**. **No depén de cap altra pendent d'esta
  llista** i no n'exigix cap abans: ni 2610021520, ni 2610042350, ni
  2610081400 a 2610081402, ni 2610081543, ni 2610101900. Cap d'elles toca els
  permisos d'UPDATE ni les polítiques de `profiles`, tret de 2610042350, que
  en dona el mateix permís de columna. Ací l'ordre alfabètic del directori no
  és cap dependència, i l'ordre el fixa esta entrada (la capçalera del fitxer
  remet ací). El que sí que ha d'estar aplicat de veres és la RLS de
  `public.profiles` i les columnes de la fitxa, que creen 2609080000
  (`full_name`, `visibility`), 2609110600 (`avatar_url`, `town_name`, `bio`,
  `is_public`), 2609261500 (`lema`, `presentacio_html`, `hero_url`, i la
  restrictiva «profiles sense baixa», que continua congelant la fitxa en
  quarantena), 2609262232 (`copyright`) i 2609282035 (`icon`). Una columna
  absent no atura la migració: `SDP-PERFIL-021` l'avisa i eixe camp es queda
  sense permís; crear-la és una decisió a part, fora d'esta reparació. No
  espera cap client nou: el publicat ja envia estos camps. Abans d'aplicar-la,
  el Mestre executa les quatre consultes de només lectura de la capçalera i
  en guarda el resultat, que és el que permet desfer-la.
  **No torneu a executar 2609110600 ni 2610042350 senceres per a «arreglar» el
  403**: la primera obri la lectura del padró sencer (`using (true)` per a
  `anon`), i la segona esborra sobrecàrregues de `create_organization`, fora
  d'esta reparació.

- `migrations/2610181800_perfil_public_per_defecte.sql`
  Pla 261018_1605 (Tasca 1, D2; ordre del Mestre, 18-10-2026): la fitxa d'una
  persona naix pública. Només `alter table public.profiles alter column
  is_public set default true`: les funcions que alcen la fila pròpia (el
  trigger d'alta, la reparació `completa_la_meua_alta` i l'RPC que crea una
  organització) no hi escriuen `is_public` i prenen el default. Cap backfill:
  les fitxes que ja existixen es queden com estan. `visibility` no es toca: el
  seu CHECK continua exigint `'private'` (2609080000), i la publicació d'una
  persona la diu `is_public`. Cap dada, funció, política, permís ni
  restricció. Idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**.
  No depén de cap altra pendent d'esta llista: només necessita la columna
  `is_public`, que crea 2609110600 (2610042350 l'assegura en una base
  desfasada); sense la columna, falla i no canvia res. Abans d'aplicar-la, el
  Mestre executa la consulta de només lectura de la capçalera (el default
  vigent de la columna) i en guarda el resultat; per a desfer-la, `alter
  column is_public set default false`.

- `migrations/2610181915_organitzacions_correu_i_membres.sql`
  Ordre del Mestre (18-10-2026): el correu de contacte d'una organització
  (`contact_email`, privat, i `public_email`, l'opt-in) amb les RPC
  `contacte_organitzacio` i `desa_contacte_organitzacio`, i la gestió de
  membres (`organization_member_organizations` i les RPC `membres_`,
  `desa_membre_` i `lleva_membre_organitzacio`). **P0-01 (ordre del Mestre,
  20-10-2026):** el correu privat no té cap SELECT per a `anon` ni per a
  `authenticated`; el llig només qui administra l'organització, per
  `contacte_organitzacio`. El fitxer fa `revoke select (contact_email)`
  explícit, de manera que, si ja s'havia aplicat la versió d'abans (que el
  donava a `anon` i `authenticated` i, amb la política «public read public
  organizations», el deixava llegir sense sessió), tornar-lo a aplicar el
  tanca. Idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610201500_moderacio_denuncies_i_bloquejos.sql`
  Pla 261020_1300 (Tasca 2; App Store 1.2 i Google Play UGC): la moderació
  del contingut dels veïns. Crea `public.denuncies` (una fila per denúncia
  d'una publicació, un producte, un acte, un missatge, una persona o una
  entitat, amb motiu tancat i detall de fins a 1.000 caràcters; també des
  d'anon) i `public.bloquejos` (qui bloqueja a qui, persona o entitat), les
  dues amb la RLS activa; dos disparadors d'abans d'inserir, SECURITY
  DEFINER amb `search_path` buit, que forcen les columnes que el client no
  tria i posen els límits (20 denúncies/hora per persona, 10/hora per IP
  anònima, on una IPv6 compta per la seua /64, 50 si no se sap la IP, un
  sostre comú de 300/hora entre totes les anònimes, una sola pendent per
  persona i contingut, 1.000 bloquejos per persona); l'RPC
  `denuncia_contingut` (SECURITY INVOKER: corre amb els permisos i la RLS,
  mai amb els del propietari); i
  `private.normes_acceptades` amb les RPC `accepta_normes_convivencia(p_versio)`
  i `estat_normes_convivencia(p_versio)`, la prova al servidor que la persona
  ha acceptat les normes de convivència (només una versió que siga una data
  real i no futura al calendari de Madrid, i 20 versions per persona com a
  molt). El compromís del sostre anònim (revisió 261020): la denúncia anònima
  continua oberta, com mana l'ordre del Mestre, però qui inunda pot gastar el
  sostre comú d'una hora, i mentre dura cap altra anònima no entra
  (`SDP-MOD-429`, que el client diu com a límit); les de les persones amb
  sessió no hi compten. Llevar del tot la denúncia anònima és decisió del
  Mestre. Els permisos del mandat Supabase
  30-Oct-2026, sencers, en la mateixa transacció i després de revocar-ho tot
  a `public`, `anon`, `authenticated` i `service_role`:
  `grant select, insert on public.denuncies to authenticated;`,
  `grant insert on public.denuncies to anon;`,
  `grant select, insert, delete on public.bloquejos to authenticated;` i
  `grant select, insert, update, delete on public.denuncies, public.bloquejos to service_role;`.
  Additiva i idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**, i
  va ABANS de publicar el client: sense ella, les denúncies diuen
  `no-disponible` i els bloquejos només duren la sessió. No depén de cap
  altra pendent d'esta llista: només necessita `auth.users`, `public.towns`,
  `public.organizations` i `private.es_superadmin()` (2609080000; aal2 des de
  2610061448) i, si hi són, `private.hash_subjecte` i
  `private.capcalera_client` (2609261500, 2610061450); sense elles, l'empremta
  d'IP és null i les anònimes compartixen el compte de 50/hora (dins del
  sostre de 300/hora). La moderació revisa la cua amb
  la consulta de només lectura
  `select id, objecte_tipus, objecte_id, motiu, creat_al from public.denuncies where estat = 'pendent' order by creat_al;`
  i en canvia l'estat amb `service_role`. Pendent del Mestre (el «QUÈ NO FA»
  de la capçalera): ningú no rep cap avís quan arriba una denúncia (la cua es
  revisa a mà); el servidor no amaga el contingut de qui has bloquejat (ho fa
  el client) ni li impedix escriure't; no es guarda cap còpia del contingut
  denunciat i no hi ha cap filtre abans de publicar.

- `migrations/2610211715_revoca_correu_organitzacions.sql`
  P0-01 cap avant (auditoria de Claude 261021_1645): repetix el
  `revoke select (contact_email) … from public, anon, authenticated` de
  2610181915 en una versió nova. Si la primera versió de 2610181915 (la que
  donava el correu a `anon` i `authenticated`) ja consta al registre de
  migracions, l'eina no la torna a executar i el REVOKE afegit dins del mateix
  fitxer no arribaria a la base; esta sí. No dona cap permís. Va després de
  2610181915 (necessita la columna). Abans d'aplicar-la, el Mestre executa la
  consulta de només lectura de la capçalera (`has_column_privilege` d'`anon` i
  `authenticated` sobre `contact_email`) i en guarda el resultat; després, les
  dues files han de tornar `false`. Idempotent; **NO aplicada: l'aplica el
  Mestre, mai un agent**.

- `migrations/2610220240_xat_adjunts_i_quota.sql`
  Gauntlet 261022_0225 (Tasca 3; disseny de GPT Codex, reparat per la crítica
  de Claude, F1-F14 i revisió R1-R8): els adjunts privats del xat (foto, nota
  de veu i vídeo de fins a 10 s) i la quota rural de 20 MB per persona. Crea
  `public.xat_adjunts` (una reserva per adjunt; l'id és el del missatge i el
  nom opac de l'objecte), el bucket privat `xat_adjunts`, les polítiques de
  `storage.objects`, el disparador `private.xat_escriptura_final`, les RPC
  `xat_quota`, `xat_reserva_adjunt`, `xat_cancella_reserva`,
  `xat_prepara_descart`, `xat_publica_adjunt` i `xat_llegix_adjunt`, la v5 de
  `xat_fils_meus` (la v4 de 2609282100 sencera més `ultim_tipus`) i la neteja
  `private.xat_neteja_adjunts`. storage-api fa una sonda de permisos (un
  INSERT com a `authenticated` amb `mimetype` i `contentLength`, sense
  `size`, que desfà) i després l'escriptura final com a superusuari (sense
  RLS, amb `size`). La política d'inserció valida la sonda (reserva pròpia de
  fa menys de 15 minuts, MIME i `Content-Length` exactes, només POST o TUS,
  cap URL de pujada signada); el disparador valida només l'escriptura final
  (reserva viva, ni publicada ni en descart, de qui puja, mida i MIME exactes,
  sota el pany de la fila), de manera que cancel·lar a mitja pujada la fa
  fallar i no deixa cap objecte; `xat_publica_adjunt` ho torna a comprovar i
  fixa la versió que es podrà llegir. La pujada ha de ser un POST de cos cru
  (o TUS) amb `Content-Type` i `Content-Length` iguals als de la reserva: el
  `.upload()` de supabase-js amb un Blob o un File envia multipart i Storage el
  rebutja amb 403. Ningú no pot llistar el bucket. Sostres: foto WebP o JPEG
  fins a 2 MB, veu fins a 3 MB, vídeo MP4, WebM o QuickTime fins a 20 MB, 64
  bytes com a mínim (el CHECK `xat_adjunts_mida` de la taula només fixa 64
  bytes - 20 MB; un sostre per tipus es canvia amb una migració nova i només
  afecta les reserves noves); deu pendents sense publicar i seixanta adjunts
  vius reservats en l'última hora per persona (una reserva cancel·lada no
  compta, perquè no deixa res). Codis: `SDP-XAT-001`, `006`, `008`, `009`,
  `011`, `020`, `021`, `022` (deu pendents: cal enviar-ne o descartar-ne) i
  `429`, i en aplicar-la `SDP-XAT-903` (avís: pg_cron no està actiu). Els
  permisos del mandat Supabase 30-Oct-2026, després de revocar-ho tot a `public`, `anon`,
  `authenticated` i `service_role`:
  `grant select, delete on table public.xat_adjunts to service_role;` (el
  client només hi entra per les RPC).
  **NO aplicada: l'aplica el Mestre, mai un agent**, i va ABANS de publicar el
  client que envia adjunts. Prerequisits
  aplicats de veres: 2609261500 (`private.purga_storage_pendent`; sense ella,
  la cascada d'una baixa falla), 2609270200 i 2609272200 (seq,
  `es_participant`, `seq_visible`, `es_admin_del_fil`), 2609282100
  (`xat_fils_meus` v4), 2610081543 (la signatura vigent de `xat_envia`) i un
  storage-api amb `storage.operation()`, `owner_id` i `version` (provat amb
  v1.79.36); el rol que l'aplica ha de poder crear un disparador sobre
  `storage.objects` (si no, la transacció sencera es desfà). Si pg_cron no hi
  era, la neteja es programa a mà, com a `postgres`:
  `select cron.schedule('sdp-neteja-xat-adjunts', '23 * * * *', $cron$select private.xat_neteja_adjunts(500)$cron$);`.
  Límits coneguts: la durada del vídeo i de la veu és la que declara el client
  (el servidor no descodifica el fitxer); els binaris alliberats esperen a
  `private.purga_storage_pendent` el worker amb `service_role`, la funció
  `purga-fitxers` (vegeu «Funció `purga-fitxers`» al final; fins que el Mestre
  no la desplega i la programa, no corre), i fins que el worker no els purga
  continuen comptant en la quota
  de qui els va pujar; un adjunt sense peu es desa amb `text` null i, fins que
  el client llija `ultim_tipus`, la llista de converses en diu «Cap missatge.».
  Verificació posterior (lectura):
  `select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'xat_adjunts';`
  i `select jobname, schedule from cron.job where jobname = 'sdp-neteja-xat-adjunts';`;
  després, una pujada real des del client. La prova és
  `node tests/xat-multimedia-postgres.audit.mjs`: storage-api real si les
  imatges de Supabase són locals i, si no, la fixture, i diu quina ha corregut.

- `migrations/2610241400_normes_exigides_ugc.sql`
  T2 (P0-18; auditoria Codex 261024_1315 C-02; Google Play UGC i App Store
  1.2): el servidor exigix les normes de convivència abans d'admetre
  publicacions i missatges dels veïns. Crea `private.versio_normes_vigent()`
  (`'2026-10-24'`, la de `VERSIO_NORMES_CONVIVENCIA` de
  `src/data/contracte.js`; pujar-la vol dir redefinir-la en una migració
  nova), `private.ha_acceptat_normes(uuid)`, `private.he_acceptat_normes()`
  (SECURITY DEFINER i sense paràmetre: només respon per la persona de la
  sessió) i dos disparadors. `section_submissions_exigix_normes` salta abans
  d'inserir (també l'upsert) i abans d'actualitzar `section_id`, `tenant_id`,
  `title`, `description` o `payload`, fora de les notes privades; en una
  actualització, només per a les escriptures directes per l'API
  (`current_user = 'authenticated'`; la funció és SECURITY INVOKER a posta) i
  només si alguna d'eixes columnes canvia: així un PATCH directe que reescriu
  una publicació també passa per la porta (auditoria Codex D-07.2), i
  `demana_baixa` i `cancela_baixa`, SECURITY DEFINER, continuen retirant i
  tornant les claus personals del payload. `xat_missatges_exigix_normes`
  (SECURITY DEFINER) salta abans d'inserir, només amb els missatges `text`
  que envia la persona amb la seua sessió, que no són de la IAIA, i fora del
  xat privat amb la IAIA. Qui no ha acceptat la versió vigent rep
  `SDP-MOD-428` (42501); `service_role`, els seeds i el sistema (sense
  `auth.uid()`) queden fora. Cap taula, política ni permís de taula nou; les
  cinc funcions, `revoke execute ... from public, anon, authenticated,
  service_role`, i un sol grant:
  `grant execute on function private.he_acceptat_normes() to authenticated;`
  (la crida el disparador de publicacions amb el rol de qui escriu). En
  aplicar-la, `SDP-MOD-901` si falta 2610201500. Prerequisit aplicat de
  veres: 2610201500 (`private.normes_acceptades`), amb el mateix rol
  propietari. Va DESPRÉS de publicar el client amb
  `VERSIO_NORMES_CONVIVENCIA = '2026-10-24'` (un client antic només sap
  acceptar `'2026-10-20'`). El xat públic de la pàgina `/iaia` també les
  exigix, i el client hi passa la porta. Pendent del Mestre (el «QUÈ NO FA»
  de la capçalera): la resta del contingut dels veïns no hi passa (els camps
  del perfil que mostra `perfil_public`, els textos de les entitats i les
  pujades a Storage). La prova estàtica és
  `src/data/supabase/normesExigides.migracio.test.js`. Verificació posterior
  (lectura):
  `select tgname from pg_trigger where tgname in ('section_submissions_exigix_normes', 'xat_missatges_exigix_normes');`
  i `select private.versio_normes_vigent();`. Idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610241410_exporta_dades_moderacio.sql`
  P2-08 (pla 261024_1315, T7; auditoria Codex C-04): torna a crear
  `public.exporta_les_meues_dades()` amb el cos de 2609261500 al peu de la
  lletra (la mateixa signatura i el format `socdepoble.exportacio.v1`; només
  l'executa `authenticated`, ara després de revocar-ho tot a `public`, `anon`,
  `authenticated` i `service_role`) i hi afig `moderacio` (`denuncies_fetes`,
  `denuncies_rebudes` només amb `amb_mesura`, quantes de les que t'afecten han
  acabat retirant el contingut: cap recompte de les pendents, revisades o
  desestimades, ni per tipus ni per motiu, perquè comparant dues exportacions
  delataria qui denuncia, i el detall es respon per correu (RGPD, art. 15.4),
  els `bloquejos` que has fet tu i
  `normes_acceptades`), el xat sencer (`id`, `seq`, `tipus`, `metadades` i
  `esborrat_per_mi` dels missatges propis, el subjecte i els teus ajustos de
  cada conversa, i `adjunts_propis` amb el bucket i el nom de cada objecte: un
  àudio sense peu conserva la referència), `seguiments` (a qui seguixes ara i
  quantes persones et seguixen ara: només les files amb `deixat_al` null, i
  una 2610241430 sense eixa columna deixa la clau amb l'error),
  `apple` (només la data del permís desat, mai
  el testimoni xifrat) i `no_inclou` (qui t'ha denunciat o bloquejat, qui et
  seguix, les empremtes d'IP i el testimoni d'Apple, i per què). Cap taula,
  política ni permís de taula nou. Cada lectura nova va dins d'un
  `to_regclass`: sense 2610201500, 2610220240, 2610241420 (T1) o 2610241430
  (T6b), la clau ix null (`adjunts_propis`, buida) i l'exportació no falla; es
  comprova en cridar-la, i l'ordre entre elles no importa. La prova estàtica
  és `src/data/supabase/exportacio.migracio.test.js`. Verificació posterior,
  amb la sessió d'una persona de prova a l'editor SQL:
  `select jsonb_object_keys(public.exporta_les_meues_dades());`. Idempotent;
  **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610241420_revocacio_apple.sql`
  T1 (P0-04; App Store 5.1.1(v), Apple TN3194; auditoria Codex 261024_1315
  C-01): la custòdia i la revocació de Sign in with Apple quan una persona es
  dona de baixa. Crea `private.autoritzacions_apple` (el refresh token
  d'Apple xifrat amb AES-256-GCM per la funció `compte-apple`, amb la persona
  com a dades associades: la base no veu mai el text clar ni la clau), el
  registre `private.revocacions_apple` (empremta pseudònima, origen i
  resultat; sense clau forana, sobreviu a la purga), l'ajust
  `dies_espera_revocacio_apple` = `7` i quatre RPC SECURITY DEFINER només per
  a `service_role`: `apple_desa_autoritzacio` (només si el subjecte és la
  identitat d'Apple de la persona a `auth.identities`), `apple_autoritzacio_de`,
  `apple_revocacions_pendents` (primer les no provades i després les provades
  fa més temps: una fila que falla no tapa la cua) i `apple_registra_revocacio`
  (esborra la fila només quan Apple ha confirmat la revocació del mateix
  xifrat; un `sense_testimoni` només s'anota si la baixa ja existix i com a
  molt un per persona cada 24 hores). Permisos del
  mandat Supabase 30-Oct-2026: les dues taules, RLS activa i
  `revoke all ... from public, anon, authenticated, service_role` sense cap
  grant (només hi entren les RPC); cada RPC, el mateix `revoke all` i
  `grant execute on function ... to service_role`, i a dins la porta
  `auth.role()`. Codis `SDP-APPLE-000`, `001` i `002`. No crida cap URL ni
  toca `private.purga_una_baixa` (la porta de la purga és de 2610241440, T8).
  Prerequisit aplicat de veres: 2609261500 (`private.baixes`,
  `private.hash_subjecte`). Va ABANS de desplegar la funció `compte-apple`
  (secció «Funció `compte-apple`», al final) i ABANS de 2610241440.
  Verificació posterior (lectura):
  `select count(*) from private.autoritzacions_apple;`,
  `select origen, resultat, count(*) from private.revocacions_apple group by 1, 2;`
  i `select valor from private.ajustos where clau = 'dies_espera_revocacio_apple';`.
  Idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610241430_seguiments.sql`
  T6b (IDEA-14; decisió del Mestre, 261024): «Connectar / Seguir», el
  seguiment d'un sol sentit. Pots seguir una veïna o una entitat; qui és
  seguit ho sap i veu qui el seguix; cap algoritme. Crea `public.seguiments`
  (`seguidor`, `seguit_tipus` 'persona' o 'entitat', `seguit_persona` o
  `seguit_entitat`, `tenant_id`, `creat_al`, `reactivat_al` i `deixat_al`; un
  sol seguit del seu tipus, ningú no se seguix a si mateix i una sola fila
  per parella, per sempre, amb dos índexs únics parcials), amb la RLS activa i
  cap política; tres funcions privades
  (`private.poble_compartit`, `private.bloqueig_de_seguiment` i
  `private.seguiment_viu`) i cinc RPC SECURITY DEFINER amb `search_path` buit,
  només per a `authenticated`: `segueix(p_tipus, p_id)` (idempotent: torna
  `primer` true només la primera vegada de totes que la parella se seguix, i
  `nou`, conservat per compatibilitat, val el mateix; tornar a seguir dona
  false a tots dos, i el client només avisa al xat amb `primer`),
  `deixa_de_seguir(p_tipus, p_id)` (esborrat suau: marca `deixat_al`, mai
  esborra la fila; un seguiment viu és `deixat_al is null`),
  `estat_seguiment(p_tipus, p_id)`, `els_meus_seguiments()` i
  `qui_em_segueix(p_org_id)` (sense entitat, qui et seguix a tu; amb entitat,
  qui la seguix, només per a qui l'administra). Regles: una persona, només si
  sou del mateix poble i cap de les dues no ha demanat la baixa; una entitat,
  pública (o de la qual formes part), de qualsevol poble, si no has demanat la
  baixa; mai tu mateix ni
  una entitat que administres; cap bloqueig teu de `public.bloquejos` (es
  llig amb `to_regclass`); 30 altes o represes per hora (Gauntlet
  261024_1945: Codex G-01, Gemini G1945-02) en una finestra lliscant,
  comptades al registre `private.seguiments_altes` (T2 261024_1800,
  P2-10; auditoria Codex 261024_1800 C6-01: una fila per alta o represa
  acceptada, només qui i quan, que ni deixar de seguir ni tornar a seguir no
  esborren; abans es comptaven files i una parella represa diverses vegades
  en una hora hi pesava una sola; RLS activa i cap permís per a ningú, ni
  `service_role`; l'instant de cada alta és el d'admetre-la, `clock_timestamp()`
  després del pany; cada alta poda les de més d'una hora de qui seguix, i una
  purga de pg_cron cada 10 minuts, `sdp-purga-altes-seguiments`, si pg_cron hi
  és, les de tothom, de manera que cap fila no dura més d'una hora i deu
  minuts; sense pg_cron, una fila vella es queda fins a la pròxima alta de la
  mateixa persona o la baixa del compte, i la quota no la compta igualment;
  l'exportació no el dona), una represa de la mateixa
  parella cada 10 minuts, comptats des de l'última represa o, si no n'hi ha
  cap, des de l'alta (Gemini G1945-03: la primera represa ja no és lliure;
  `creat_al`, `reactivat_al` i l'espera usen el mateix instant
  d'admissió), i 1.000 seguiments vius per persona, sota el seu
  pany i en la mateixa transacció (depén del nivell READ COMMITTED de
  PostgREST; la purga salta les files bloquejades, `skip locked`). El bloqueig de l'altra banda és a l’ombra: seguir funciona igual i les
  lectures de qui seguix no l'amaguen; només `qui_em_segueix`, la llista de
  qui és seguit, deixa fora qui seguix si hi ha un bloqueig en qualsevol
  sentit (també d'algú que administra l'entitat). Les lectures només tornen
  seguiments vius, amaguen el que tapa ara una baixa o un canvi de poble, i
  van per data. Codis
  `SDP-SEG-000` (sense sessió), `001` (tipus o identificador), `002` (no
  existix, no és del teu poble o no la pots seguir; mai per un bloqueig de
  l'altra banda), `003` (tu mateix o una entitat que administres),
  `004` (l'has bloquejada tu), `005` (només qui administra veu qui seguix
  l'entitat) i `006` (el límit). Els permisos del mandat Supabase
  30-Oct-2026, després de revocar-ho tot a `public`, `anon`, `authenticated`
  i `service_role`: `grant select, insert, update, delete on public.seguiments to service_role;`
  (el client només hi entra per les RPC; cap permís per a `anon`).
  L'exportació de dades (2610241410, T7) en llig `seguidor`, `seguit_tipus`,
  `seguit_persona`, `seguit_entitat`, `creat_al` i `deixat_al` amb
  `to_regclass`.
  Additiva i idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**, i
  va ABANS de publicar el client: sense ella, Seguir diu `NO-DISPONIBLE`.
  Prerequisits aplicats de veres: 2609080000 i 2609261500
  (`baixa_demanada_at`); 2610201500 és opcional (sense ella, cap bloqueig no
  compta). La prova estàtica és `src/data/supabase/seguiments.migracio.test.js`.
  Verificació posterior (lectura):
  `select seguit_tipus, count(*) from public.seguiments group by 1;`,
  `select count(*) from private.seguiments_altes;` i
  `select jobname, schedule from cron.job where jobname = 'sdp-purga-altes-seguiments';`
  (sense pg_cron, programar-la a mà amb el mateix `delete` de la migració).
  Pendent del Mestre (el «QUÈ NO FA» de la capçalera): el servidor no
  notifica res (l'únic avís és el del client, un per parella); un bloqueig no
  esborra el seguiment, només l'amaga a qui bloqueja; les files deixades es
  queden fins a la baixa del compte; qui administra una entitat veu el nom de
  qui la seguix, també si és d'un altre poble.

- `migrations/2610241440_baixa_completa_ugc_i_fitxers.sql`
  T8 (P0-20; pla 261024_1315; auditoria Codex 261024_1315 C-06): la baixa
  completa. Torna a crear `private.purga_una_baixa`, la de 2609282100 literal
  amb tres canvis i prou (els comprova
  `src/data/supabase/baixaCompleta.migracio.test.js`): la porta d'Apple, just
  després de tornar a bloquejar la baixa (mentre quede una fila a
  `private.autoritzacions_apple`, la purga espera fins a
  `dies_espera_revocacio_apple` dies després de la data prevista, amb
  `SDP-BAIXA-030`; passada l'espera, purga i deixa una fila `purga` /
  `purgat_sense_revocar` a `private.revocacions_apple`); la neteja dels fils
  de pàgina de les publicacions que s'esborren (auditoria Codex D-02: el fil i
  els missatges d'altres persones es queden, però `titol` passa a
  `'Publicació esborrada'` i `subjecte_titol`, `subjecte_ruta` i
  `subjecte_uri` a null), i l'esborrat de les publicacions personals
  (`author_org_id` null), que abans passaven a l'uuid zero amb el títol, la
  descripció i el cos; les d'una entitat no es toquen. Torna a crear també
  `private.purga_baixes_vencudes`, la de 2609261500 literal amb un sol canvi:
  el lot va primer per les baixes que no han fallat mai (`ultim_intent_al`
  null) i després per les que ja han fallat, primer la que fa més temps que
  ho va provar; així qui espera Apple (`SDP-BAIXA-030` cada dia) no ocupa el
  lot de 100 i la resta es purga a temps. Afig a `private.purga_storage_pendent` les columnes `intents`,
  `ultim_error` i `ultim_intent_al` i l'índex `purga_storage_pendent_cua`, els
  ajustos `dies_espera_revocacio_apple` (7) i `purga_fitxers_max_intents` (10)
  si no hi són, i les tres RPC del worker `purga-fitxers`
  (`purga_fitxers_reclama`, `purga_fitxers_fets` i `purga_fitxers_fallits`),
  SECURITY DEFINER amb la guarda `auth.role()`. Codis: `SDP-BAIXA-030`,
  `SDP-PURGA-000`, `001` i `002`. Els permisos del mandat Supabase
  30-Oct-2026, després de revocar-ho tot a `public`, `anon`, `authenticated`
  i `service_role` (també la taula de la cua, sense cap permís nou):
  `grant execute on function public.purga_fitxers_reclama(integer) to service_role;`,
  `grant execute on function public.purga_fitxers_fets(bigint[]) to service_role;`
  i `grant execute on function public.purga_fitxers_fallits(bigint[], text) to service_role;`.
  Cap pg_net, cap URL i cap secret. Va després de 2609261500 i 2609282100 i,
  per a la porta d'Apple, de 2610241420 (sense ella, `to_regclass` deixa la
  porta apagada i la purga fa com abans), i ABANS de desplegar la funció
  `purga-fitxers` (vegeu «Funció `purga-fitxers`» al final). Pendent del
  Mestre (el «QUÈ NO FA» de la capçalera, custòdia legal): si cal conservar
  les publicacions d'un grup que desapareix amb la persona (ara s'esborren),
  si cal esborrar sencers els fils de pàgina de les publicacions esborrades
  (es conserven, amb els missatges d'altres persones i sense el títol), el nom
  d'aquell grup als seus fils (es conserva) i les denúncies sobre elles (es
  conserven). Verificació posterior (lectura):
  `select count(*) filter (where intents = 0) as noves, count(*) filter (where ultim_error is not null) as amb_error, count(*) filter (where referenciat) as conservades from private.purga_storage_pendent;`.
  Idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610242320_correu_propietaria_nomes_titular.sql`
  C11-02 (auditoria Codex 261024_2254, CWE-200; full de ruta P1-11 del
  Mestre): `contacte_organitzacio` (2610181915) tornava a QUALSEVOL persona
  que administra l'organització, com a `correu_per_defecte`, el correu d'accés
  (`auth.users.email`) de la propietària. Torna a crear la funció amb el
  mateix contracte i una sola condició més (`m.user_id = v_uid`): el correu
  d'accés només el rep la mateixa propietària; una administradora rep `''`
  (el client ja ho llig com «sense correu per defecte»). El correu corporatiu
  (`contact_email`) i l'opt-in públic, com abans. `desa_contacte_organitzacio`
  no es toca: crida esta funció i hereta la correcció. Cap columna, política
  ni permís nou; els mateixos REVOKE/GRANT d'execució. Va després de
  2610181915 i de 2610211715. Verificació posterior, amb la propietària A i
  una administradora B de prova: com B,
  `select correu_per_defecte from public.contacte_organitzacio('<org>');`
  torna `''`; com A, el seu correu. Pendents fora d'esta migració: la carrera
  de l'alta concurrent de membres (C11-03) i la projecció pública del contacte
  (C11-05), que porta `2610281730_membres_concurrents_i_correu_public.sql`.
  Idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610250100_seguiments_des_d_entitat.sql`
  IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025, àudios
  00:53-00:55): connectar des d'una entitat (B2B rural). Qui administra una
  organització (owner o admin) la connecta, com a eixa organització, amb una
  persona o amb una altra entitat, sense canviar la sessió global. Afig a
  `public.seguiments` la columna `seguidor_entitat` (null: la fila és de la
  persona `seguidor`, com totes les d'abans; amb valor: qui seguix és
  l'entitat, i `seguidor` és qui l'administra i hi ha fet l'última alta o
  represa, que cap lectura no torna). Refà els índexs únics per a separar
  persona i entitat (`seguiments_persona_a_persona_unic`,
  `seguiments_persona_a_entitat_unic`, `seguiments_entitat_a_persona_unic` i
  `seguiments_entitat_a_entitat_unic`, creats abans de llevar
  `seguiments_persona_unic` i `seguiments_entitat_unic`): una persona seguix
  cada destí com a molt una vegada, com ara, i una entitat també, siga qui
  siga l'admin que ho haja fet. Els CHECK: ningú no se seguix a si mateix
  (files de persona) i una entitat no se seguix a ella mateixa. Tres funcions
  privades noves (`private.poble_d_entitat_i_persona`,
  `private.seguiment_d_entitat_viu` i `private.entitat_bloquejada_pel_seguit`)
  i les RPC `segueix`, `deixa_de_seguir` i `estat_seguiment` amb `p_com uuid
  default null`: es llança la signatura `(text, uuid)` i es crea la `(text,
  uuid, uuid)` (PostgREST no tria entre dues sobrecàrregues), amb els
  REVOKE/GRANT de la signatura nova, només per a `authenticated`. Sense
  `p_com`, el comportament d'ara. Amb `p_com`, `private.can_manage_organization`
  després del pany de la persona que actua (que ara va abans de cap porta) i,
  si no l'administra, `SDP-SEG-007`; després, el pany de l'entitat. Una
  persona, si és del poble de l'entitat; una altra entitat, si és pública;
  mai ella mateixa (`SDP-SEG-003`); entitat A → entitat B val encara que la
  persona també administre B. La quota (30 altes o represes per hora i 10
  minuts de represa) la compta la persona que actua, mai l'entitat; els
  bloquejos, els seus, com ara; els 1.000 vius, de qui seguix (la persona o
  l'entitat). Deixar de seguir com a entitat el pot fer qualsevol admin.
  `qui_em_segueix(p_org_id)` es torna a crear amb `seguidor_tipus`
  ('persona' o 'entitat'): d'una entitat seguidora, el seu id i el seu nom,
  mai els de la persona que el va fer; `els_meus_seguiments()` no canvia de
  forma (només els de la persona). La taula continua amb la RLS activa, cap
  política i cap permís de taula per a `anon` ni `authenticated`
  (`grant select, insert, update, delete on public.seguiments to service_role;`):
  qui administra l'entitat en veu els seguiments per les RPC. Codi nou
  `SDP-SEG-007` (42501). Va després de 2610241430; no es pot tornar a aplicar
  2610241430 després d'esta (tornaria a crear les signatures velles i els
  índexs vells: cal tornar a aplicar esta just després). La prova estàtica és
  `src/data/supabase/seguimentsEntitat.migracio.test.js`. Verificació
  posterior (lectura):
  `select (seguidor_entitat is not null) as d_entitat, count(*) from public.seguiments group by 1;`
  i `select p.oid::regprocedure from pg_proc p where p.proname in ('segueix', 'deixa_de_seguir', 'estat_seguiment');`
  (una sola signatura de cada, amb tres `uuid`/`text`). Pendent del Mestre (el
  «QUÈ NO FA» de la capçalera): l'exportació (2610241410) llig
  `seguidor = v_uid` i hi eixiran, com a «a qui seguixes», també els
  seguiments fets com a entitat; si la persona que va fer l'última alta es
  dona de baixa, la fila de l'entitat se'n va amb ella; cap llista de «a qui
  seguix l'entitat». Idempotent i en una sola transacció; **NO aplicada:
  l'aplica el Mestre, mai un agent**.

- `migrations/2610250300_titular_public.sql`
  IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla
  261025_0200): a `/connectar`, amb una entitat, la seua persona titular,
  NOMÉS si ella ho ha triat (opt-in). Cap lectura no torna qui administra una
  entitat (2610250100), i un perfil públic no és cap permís per a lligar-lo a
  un negoci. Afig `public.organization_memberships.titular_public` (`boolean
  not null default false`: ningú no es mostra sense triar-ho) i un disparador
  (`private.titular_public_nomes_owner`) que la torna a `false` en tota fila
  que no és d'owner (si la propietat canvia de mans, la tria no hi passa).
  Reafirma els permisos de la taula: `anon` i `authenticated` no hi escriuen
  (`revoke insert, update, delete on table public.organization_memberships from public, anon, authenticated;`).
  Tres RPC `SECURITY DEFINER` amb el `search_path` buit i execució només per
  a `authenticated`: `marca_titular_public(p_org_id, p_public)` i
  `estat_titular_public(p_org_id)`, NOMÉS per a la propietària (`user_id =
  auth.uid()` i `role = 'owner'`; una administradora no la pot fer per ella),
  i `titular_public(p_org_id)` → com a molt una fila `{ id, full_name,
  avatar_url }` si la pertinença és d'owner, ella ho ha triat, el seu perfil
  és públic (`is_public`) i sense la baixa demanada, l'organització és
  pública i cap bloqueig no separa qui mira i la titular. Mai cap correu ni
  cap rol. Codis nous `SDP-TIT-000` i `SDP-TIT-001` (42501) i `SDP-TIT-002`
  (22023). El client la llig amb les capacitats `titularPublic` i
  `consentimentTitular` (contracte.js); sense la migració, no mostra cap
  titular. La prova estàtica és
  `src/data/supabase/titularPublic.migracio.test.js`. Va després de
  2610250100. Verificació posterior (lectura):
  `select count(*) filter (where titular_public) from public.organization_memberships;`
  (0 just després d'aplicar-la). Pendent del Mestre: opt-in o «perfil públic
  és prou», només la propietària o també les administradores, els grups, i la
  via que ja existix de `owner_user_id` a les publicacions signades com a
  entitat. Idempotent i en una sola transacció; **NO aplicada: l'aplica el
  Mestre, mai un agent**.

- `migrations/2610281730_membres_concurrents_i_correu_public.sql`
  P1-13 (C11-03 i C11-05; auditoria Codex 261024_2254 i 261028_1611 C28-08;
  pla 261028_1526, §3.6.1). **C11-03**: `desa_membre_organitzacio`
  (2610181915) bloquejava la fila de la persona amb `select … for update`,
  però una persona que encara no és membre no té cap fila: dues altes
  concurrents del mateix parell (la propietària la fa admin i una
  administradora, member) acabaven amb l'UPSERT de l'administradora
  sobreescrivint l'admin de la propietària. Torna a crear la funció amb la
  mateixa signatura i el mateix contracte i tres canvis: `v_n`,
  `pg_advisory_xact_lock(hashtextextended('sdp-orgmem:' || p_organization_id::text || ':' || p_membre_id::text, 0))`
  just abans del `select … for update` (la segona crida espera el commit de
  la primera, llig el rol confirmat i la guarda `SDP-ORGMEM-006` salta), i
  un UPSERT amb `where actual.role <> 'owner' and (v_meu = 'owner' or
  (actual.role <> 'admin' and excluded.role <> 'admin'))` seguit de `get
  diagnostics v_n = row_count`: si no ha escrit cap fila, `SDP-ORGMEM-006`.
  Els mateixos REVOKE/GRANT d'execució; cap codi nou. **C11-05**: el correu
  que una organització ha fet públic no arribava mai a la fitxa pública en
  remot (la vista no el projectava i el client llegia el booleà
  `public_email` com si fora el correu). Afig la columna generada
  `public.organizations.correu_public` (`case when public_email is true then
  nullif(btrim(contact_email), '') end`, stored), en dona el SELECT (només
  d'eixa columna) a `anon` i `authenticated`, i torna a crear
  `public.organization_directory` amb les 15 columnes de 2610081401 i
  `correu_public` al final, amb els mateixos revoke i grant. `contact_email`
  continua sense SELECT per a cap rol públic; el client
  (`src/data/supabase/perfils.js`) llig `correu_public` i, sense la columna,
  torna `''` com abans; el llistat del directori (`COLUMNES_DIRECTORI`) no
  el demana. La prova estàtica és
  `src/data/supabase/membresConcurrents.migracio.test.js`. Va després de
  2610250300. Abans (lectura):
  `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'organization_directory' order by ordinal_position;`
  (15 columnes acabades en `town_name`). Després (lectura):
  `select r.rolname, has_column_privilege(r.rolname, 'public.organizations', 'contact_email', 'select'), has_column_privilege(r.rolname, 'public.organizations', 'correu_public', 'select') from (values ('anon'), ('authenticated')) as r(rolname);`
  (false i true) i
  `select count(*) from public.organizations where public_email is not true and correu_public is not null;`
  (0). Verificació manual amb dues sessions, en una base de prova (la
  recepta sencera és a la capçalera): la propietària O fa admin una persona
  X sense confirmar, una administradora A la fa member i espera; O confirma,
  A rep `SDP-ORGMEM-006` i X continua admin. Pendent del Mestre: si el
  correu triat és també per a `anon` (ara sí, com la fitxa pública i el
  model local) o només amb sessió (caldria una lectura SECURITY DEFINER), i
  qui fa la verificació de les dues sessions en PostgreSQL de veres abans
  d'aplicar-la. Idempotent i en una sola transacció;
  **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610282100_usuari_i_poble_canonic.sql`
  P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre 261028: RPC pròpia
  i camp separat, públic si el perfil és públic, amagat durant la quarantena
  de la baixa). Les altes naixien amb `username`, `town_uuid` i
  `primary_town` a NULL. Afig (IF NOT EXISTS) `profiles.username`,
  `username_confirmat_at`, `town_uuid`, `primary_town`, `provinces`,
  `comarcas` i `secondary_towns`, i `towns.provincia` i `towns.comarca`
  (omplides una vegada del catàleg `towns` d'`app_content`). La regla de
  l'identificador és la del client (`onboardingModel.js`, literal a literal):
  el primer nom i el primer cognom sense partícules, en minúscules ASCII i
  sense separadors (24 com a molt; menys de 3, `veina`), amb `-2`, `-3`… si
  és d'algú, retingut o reservat (la llista, `baixa`, les còpies de les
  identitats de la plataforma i les fundacionals de `private.ajustos`
  `usuaris_reservats`, que hi posa el Mestre: cap nom de persona al SQL),
  `veina` si la base no pot dur cap sufix i 100 candidats com a molt, cada
  candidat sota el seu pany consultiu, i l'índex únic `profiles_usuari_unic`
  sobre `lower(username)` com a última guarda. Backfill genèric (abans del
  disparador, amb `trg_profiles_touch` desactivat) de les files sense
  identificador i dels camps de poble NULL o buits: cap camp que ja en porte
  no es reescriu. Guardes que avorten (`SDP-USER-022`) si una política, una
  vista o una regla de fora llig les columnes noves o si la lectura de
  `profiles` no és només la pròpia. El disparador `trg_profiles_usuari_i_poble`
  cobrix les tres altes sense redefinir-les (l'alta no cau mai:
  `SDP-REG-903`), valida els canvis (amb sessió, només per la RPC:
  `SDP-USER-006`; cap retingut: `SDP-USER-007`), reté l'identificador durant
  la baixa (`private.usuaris_retinguts`, `baixa-…` a la fila) i deriva el
  poble a l'alta i quan canvia `town_name` (`La Torre de les Maçanes` si no
  n'hi ha cap; una tria no es reescriu). La RPC `desa_el_meu_usuari(p_usuari)`
  (només `authenticated`) canvia o confirma el propi identificador, amb 10
  proves per hora (`private.usuari_intents`). `perfil_public` es torna a crear
  amb `usuari` al final, només a la fitxa sencera. Codis `SDP-USER-000`..`007`
  i `020`..`024`. Cap permís ni política nova; no toca `town_memberships`.
  Abans, les nou consultes de lectura de la capçalera (columnes,
  restriccions, polítiques, permisos, disparadors, repetits, pobles, ajustos i
  funcions que llegixen el poble) i, del Mestre, les identitats fundacionals
  a `private.ajustos`; després,
  `select count(*) from public.profiles where username is null;` (0) i la
  comprovació dels sufixos de les identitats fundacionals. La
  verificació de les dues sessions és a la capçalera. La prova estàtica és
  `src/data/supabase/usuariIPoble.migracio.test.js`. Va després de
  2610281730. Idempotent i en una sola transacció;
  **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610290400_xat_e2ee_claus_i_sobres.sql`
  P1-12 i IDEA-48 · E2EE-1a (`disseny_final_e2ee.md` v1.1.0, §7.2 primera
  fila, §7.3, §7.4 i §7.9; `esmenes_qa_261029.md` §13.1 R3, R5, R8 i R9;
  auditoria Codex 261029_0340 E2EE-I03; pla 261029_0216, T7). El servidor del
  xat xifrat d'extrem a extrem, primera part: les ajudes de codificació
  (base64url canònic, JWK estricte), el registre només d'afegir
  `public.xat_claus_usuari` (declaració SDPK de 175 bytes, les dues
  públiques, `kid` recalculat al servidor, continuïtat, còpia xifrada de la
  identitat i embolcall de la RK amb la frase; un sol actiu per persona; mai
  la IAIA; disparador d'immobilitat `SDP-XAT-038`; cap RK ni privada en
  clar), `public.xat_llibretes` (la llibreta de seguretat, comptador
  estrictament creixent), el contracte de dades d'IDEA-48 amb les esmenes R5 i
  R8 (`xat_cercles_recuperacio` amb un sol cercle vigent per persona,
  `xat_avals_recuperacio`, `xat_peticions_recuperacio` amb `creat_ms` i
  `caduca_ms` bigint exactes, clau forana al cercle i el SDPN sencer en
  qualsevol estat, `xat_verificacions_recuperacio` i
  `xat_alliberaments_recuperacio`), els orígens admesos
  (`private.xat_origens_xifrat`: `https://socdepoble.org`,
  `capacitor://localhost` i `https://localhost`; `private.xat_origen_admes`
  llig l'Origin de `request.headers`), el ritme per persona
  (`private.xat_ritme_claus`, 10 cada 24 h) i les set RPC d'E2EE-1a:
  `xat_publica_identitat` (comparar-i-canviar amb la fila activa,
  `SDP-XAT-041`; 5 publicacions cada 24 h i, sense continuïtat, 1 cada 24 h i
  3 cada 30 dies; la còpia és obligatòria; retira el cercle vigent, esmena
  R9), `xat_la_meua_identitat`, `xat_desa_frase` (10 cada 24 h),
  `xat_claus_de` (d'1 a 256 identificadors, sense còpies i només de qui
  compartix un fil: qui no en compartix cap no torna res), `xat_desa_llibreta`
  (`SDP-XAT-044` si el comptador no creix), `xat_la_meua_llibreta` i
  `xat_canvia_rk` (el nivell 3 de §5.6.5: comparar-i-canviar sobre el SHA-256
  de la còpia viva, `SDP-XAT-046`, i la còpia, l'embolcall de la frase i la
  llibreta nova en la mateixa transacció). Totes SECURITY DEFINER amb
  `search_path` buit, revocades a `public` i `anon` i només per a
  `authenticated`; sessió i origen sempre primer; un sol rellotge per crida
  (el `now()` de la transacció, mai `clock_timestamp`); el pany consultiu
  `xat:identitat:<usuari>` abans de la fila activa. Les taules noves amb RLS,
  tot revocat i només `select, delete` per a `service_role`: cap lectura
  directa des del client. No toca `xat_envia` ni cap taula de missatges, fils
  o adjunts (això és E2EE-1b). Codis `SDP-XAT-001`, `009`, `033`, `038`,
  `040`..`046` i `900` (guarda: la cadena fins a 2610282100). Abans, les tres
  consultes de lectura de la capçalera (la cadena, cap taula ni funció
  homònima); després, la RLS de les set taules (true), cap `select` per a
  `anon` ni `authenticated`, els tres orígens i
  `select private.xat_b64_enc(private.xat_b64('AQID', 3));` (`AQID`). La
  verificació de les dues sessions (el comparar-i-canviar) és a la capçalera.
  La inversa és un bloc comentat al final del fitxer i esborra exactament el
  que es crea. La prova estàtica és
  `src/data/supabase/xatE2ee.migracio.test.js`; l'execució (dues vegades, la
  inversa i una tanda de crides a les RPC) la va fer la línia a PGlite 0.3.16,
  fora del repositori. Va després de 2610282100 i abans d'E2EE-1b. Idempotent
  i en una sola transacció;
  **NO aplicada: l'aplica el Mestre, mai un agent**.

- `migrations/2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql`
  P1-59 (c) i IDEA-24 (lot 5 de Codex, reconciliat amb la Ronda 2). Disparador
  `trg_forca_visibilitat_publica_empresa` (BEFORE INSERT o UPDATE OF kind,
  visibility, parent_organization_id): només la propietària commuta entre
  `group` i `company` o canvia la mare; una empresa amb grups fills no passa a
  grup; `company`, `entity` i `city_hall` queden sempre `public` i sense mare
  (sense backfill: una fila `members` actual canvia en la seua pròxima
  actualització d'eixes columnes). Decisió del Mestre (xat 261031, RGPD):
  empreses, entitats i ajuntaments són figures públiques del directori, sense
  cap UPDATE massiu de les files existents; els grups conserven la visibilitat
  que trien, i la interfície no oferix «Fitxa privada» als tres tipus públics.
  `GRANT UPDATE (kind, parent_organization_id)`
  a `authenticated`. RPC `transfereix_propietat_organitzacio(uuid, uuid)` (owner →
  admin; una persona que ja és membre de l'organització i del seu poble, sense
  baixa demanada → owner; només per a `group` i `company`: la titularitat d'una
  entitat o d'un ajuntament només s'obté per reclamació revisada
  (`resol_reclamacio`) mentre encara no té propietària; amb propietària, cap via
  del client no la canvia (com abans de la 1500), i la RPC hi torna
  `SDP-ORGMEM-001`) i el pany
  `sdp-orgowner:` compartit amb `desa_membre_organitzacio` i
  `lleva_membre_organitzacio`. Torna a crear la política `orgs_read_auth` sense
  `created_by`: després d'una transferència, la creadora que ja no és membre no
  llig una fitxa `members`. El client del port la crida des de la marató
  261101_2143 (`transfereixPropietatOrganitzacio`, capacitat
  `transferenciaPropietat`); sense la migració aplicada, el client diu
  `NO-DISPONIBLE` i deixa d'oferir-la. Abans:
  `select kind, visibility, count(*) from
  public.organizations group by 1, 2;`. Va després de 2610290400. Idempotent i
  en una sola transacció; **aplicada a producció** (lectura REST del 6-11-2026:
  `transfereix_propietat_organitzacio(uuid, uuid)` existix, 401 42501; acta
  261101_0334). Cap agent no la torna a aplicar.

- `migrations/2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql`
  P1-12 i D03 · E2EE fases 1b i 1c (`sdp-xat-v1`: P-256, una identitat per
  persona; kit Codex Lot 3 de 261031). Afig `xifrat jsonb` i
  `resposta_a_xifrada uuid` a `public.xat_missatges`, `epoca_actual`,
  `cap_epoca_hash` i `e2ee_des_de_seq` a `public.xat_fils` i
  `xifrat boolean` a `public.xat_adjunts`, amb les CHECK
  `xat_missatges_sobre_lot3` i `xat_fils_marques_lot3`. Crea
  `public.xat_epoques`, `public.xat_epoques_membres`, `public.xat_claus_fil`
  i `public.xat_reembolcalls` (RLS; només `select` per a `authenticated` amb
  pertinença activa, i els sobres només de qui els rep; `select, delete` per a
  `service_role`; registres immutables) i `private.xat_cohort_e2ee` i
  `private.xat_configuracio_e2ee` (cap permís de client; cohort buida,
  `general = false`, `pausa = false`). Les huit RPC de la fase:
  `xat_estat_xifrat`, `xat_epoques_del_fil`, `xat_meus_sobres`,
  `xat_obri_epoca`, `xat_envia_xifrat`, `xat_reembolcalla`,
  `xat_demana_xifrat` i `xat_publica_adjunt_xifrat`, totes SECURITY DEFINER
  amb `search_path = public, pg_temp` (la migració s'atura si `public` permet
  CREATE als rols del client), revocades a `public` i `anon`. Torna a crear
  `xat_historial`, `xat_nous` i `xat_fils_meus` amb el mateix cos i els camps
  nous (`xifrat` i les marques del fil), i amplia els adjunts:
  `application/octet-stream` només per a reserves xifrades, la mateixa quota
  de 20 MB, l'RPC antiga rebutja els fils xifrats, i la sonda i l'escriptura
  final de Storage són més estrictes (reserva de menys de 15 minuts i
  participant vigent, també en els adjunts en clar). Un fil amb època activa
  rebutja el clar, les rebaixes i la reclassificació. L'auditoria és
  `select public.xat_verifica_prerequisits_e2ee();` (només `service_role`).
  No activa res: el client continua amb `E2EE_ACTIU_PER_DEFECTE = false` i
  cap gènesi és possible sense la cohort que afig el Mestre. Codis
  `SDP-XAT-001`..`045`, `429` i `900`. Va després de 2610290400. Idempotent i
  en una sola transacció; **aplicada a producció** (lectura REST del 6-11-2026:
  la taula `xat_epoques` existix, 401 42501; acta 261101_0334). Cap agent no
  la torna a aplicar.

- `migrations/2610311900_exporta_dades_filtre_servidor_rgpd.sql`
  P2-09 (Lot 6 de Codex): torna a crear `public.exporta_les_meues_dades()` amb
  el cos sencer de 2610241410 i canvia només el bloc `federacio_no_versionada`:
  la propietat es tria per precedència (`realms`: `owner_user_id`, `user_id`;
  `user_realms`: `user_id`; `connections`: `user_id`, `owner_user_id`;
  `posts`: `author_id`, `owner_user_id`, `user_id`) i només ixen les columnes
  del contracte de `src/data/supabase/contracteExportacioFederacio.js`. Cap
  fila on `auth.uid()` siga només `target_user_id`, `moderator_id` o una altra
  contrapart. Una propietat absent o no UUID, o una columna del contracte que
  no siga escalar, dona `SDP-FED-ESQUEMA-NO-ADMES` (exportació incompleta). Les
  columnes fora del contracte s'ometen. Mateixa ACL (només `authenticated`),
  `SECURITY DEFINER` i `search_path = ''`. Va després de 2610241410 i
  **abans de publicar el client** que l'espera. Idempotent i en una sola
  transacció. **Estat remot no acreditat**: l'acta 261101_0334 la dona
  aplicada (diu «64 migracions», de la 2610241400 a la 2610312000, però en eixe
  tram n'hi ha 15), i la lectura REST no veu el cos
  d'`exporta_les_meues_dades()`. Ho pot acreditar el Pas 0. Cap agent no
  l'aplica.

- `migrations/2610312000_e2ee_lot3_validadors_service_role.sql`
  Esmena de l'auditoria Claude al Lot 3 (261031). Les CHECK
  `xat_fils_marques_lot3` i `xat_missatges_sobre_lot3` criden
  `private.xat_lot3_b64` i `private.xat_sobre_format_v1_valid`; PostgreSQL
  comprova EXECUTE en inicialitzar la CHECK, per a qualsevol fila, i un DML
  directe amb `service_role` fallava (`permission denied for function
  xat_lot3_b64`, o `for schema private` en un fil ja xifrat). Les dues
  funcions, pures i sense accés a dades, passen a SECURITY DEFINER amb el
  mateix `search_path` i només `service_role` rep EXECUTE. Va just després de
  2610311800 i s'ha de tornar a aplicar si mai es reaplica el 2610311800.
  Idempotent i en una sola transacció. **Estat remot no acreditat**: l'acta
  261101_0334 la dona aplicada, però la lectura REST no veu
  `private.xat_lot3_b64`. Ho pot acreditar la columna `te_esmena_2610312000`
  del Pas 0. Cap agent no l'aplica.

- `migrations/2611011500_autoria_ajuntament_mateix_poble.sql`
  D-6 (informe 261101_0409; assalt 261101_1246, T7): un ajuntament només
  signa publicacions del seu poble. Torna a crear
  `public.pot_signar_com_organitzacio(p_org_id uuid, p_tenant_id uuid)` amb el
  cos de 2609261500 (propietària o administradora; LANGUAGE sql, STABLE,
  SECURITY DEFINER, `search_path` buit) i una condició més: si l'entitat és
  `city_hall`, el seu `tenant_id` ha de ser el de la publicació (el «town_id»
  del pla és `tenant_id`). Les empreses, els grups i les entitats no canvien.
  EXECUTE només per a `authenticated`. Torna a crear la CHECK
  `section_submissions_autoria_org_valida` amb `(author_org_id, tenant_id)`,
  NOT VALID (les files d'abans es conserven; una d'un ajuntament signada en
  un altre poble ja no es pot desar signada, però sí passar a la persona), i
  esborra la signatura vella `(uuid)`. Cap política, taula ni codi nou: el
  rebuig és el 23514 de sempre. Abans (lectura), les publicacions signades
  per una entitat d'un altre poble:
  `select o.kind, count(*) from public.section_submissions s join public.organizations o on o.id = s.author_org_id where s.tenant_id <> o.tenant_id group by 1;`
  (al node remot les entitats viuen al poble llavor: cal mirar-ho abans).
  I cada ajuntament, encara que no haja signat res, amb els pobles de les
  seues propietàries i administradores i els pobles on han publicat:
  `select o.id, o.name, o.tenant_id, (select array_agg(distinct tm.town_id) from public.organization_memberships m join public.town_memberships tm on tm.user_id = m.user_id where m.organization_id = o.id and m.role in ('owner', 'admin')) as pobles_administradores, (select array_agg(distinct s.tenant_id) from public.organization_memberships m join public.section_submissions s on s.owner_user_id = m.user_id where m.organization_id = o.id and m.role in ('owner', 'admin')) as pobles_on_publiquen from public.organizations o where o.kind = 'city_hall';`
  (un poble d'eixes llistes que no siga el `tenant_id` de l'ajuntament és un
  poble on ja no podrà signar: cal decidir-ho abans d'aplicar).
  Verificació posterior (lectura):
  `select to_regprocedure('public.pot_signar_com_organitzacio(uuid,uuid)') IS NOT NULL AS te_autoria_poble_2611011500, to_regprocedure('public.pot_signar_com_organitzacio(uuid)') IS NULL AS sense_signatura_vella;`
  (cert i cert). La inversa és a la capçalera. L'execució (les dues
  consultes d'abans, dues aplicacions, els casos, els permisos i la inversa:
  23 comprovacions) la va fer el torn torn_3f5652a2 a PGlite 0.3.16, fora
  del repositori: és evidència no versionada. La prova estàtica és
  `src/data/supabase/autoriaAjuntamentPoble.migracio.test.js`.
  Idempotent i en una sola transacció; **aplicada a producció** (lectura REST del 6-11-2026:
  `pot_signar_com_organitzacio(uuid, uuid)` existix, 401 42501, i la
  signatura vella `(uuid)` ja no, 404 PGRST202; acta 261102_1456). Cap agent
  no la torna a aplicar.

- `migrations/2611011510_versio_minima_client.sql`
  P0-23 (BOT-A2; Gauntlet Claude 261025_1705): la porta de versió mínima de
  l'app nativa, rebasada a l'assalt 261101 (al pegat es deia 2610251930, que
  aniria per davant de migracions que el node remot ja pot tindre aplicades). Crea
  `public.versio_minima_client(p_plataforma)` → `jsonb`: per a `'ios'` i
  `'android'`, `{ versio_minima, enllac }` (un enter i una adreça https de la
  botiga o `null`); per a qualsevol altra plataforma, `null`. LANGUAGE sql,
  STABLE, SECURITY INVOKER i el `search_path` buit: no llig cap taula ni cap
  dada de sessió, de persona ni de poble. L'app la crida en arrencar, abans
  de tindre sessió:
  `grant execute on function public.versio_minima_client(text) to anon, authenticated;`
  (després del revoke a tots els rols). L'app nativa (`src/natiu/entrada.jsx`)
  la pregunta pel port amb la capacitat `versioClient` (contracte.js) i, si
  el seu `VERSIO_CLIENT_NATIU` és més vell que el mínim, pinta la pantalla
  «Cal actualitzar l'app» amb l'enllaç de la botiga i el de la web. Si no
  arriba a saber-ho (sense xarxa, sense la migració, un error), entra igual;
  la web i el connector de WordPress no la pregunten mai. El mínim és 2 a
  les dues plataformes; l'enllaç d'Android és el de Google Play
  (`org.socdepoble.app`) i el d'iOS, `null` fins que se sàpiga l'adreça de
  l'App Store. No protegix el build 1 (TestFlight 1.0.0 (1) i l'AAB 1.0.0+1):
  no porta la porta; per a ell només hi ha fer-lo caducar a TestFlight i
  retirar l'APK beta. Ordre: independent de 2610241400. Amb el mínim a 2 no
  deixa fora ningú (el build 1 no pregunta i el build 2 entra): va en l'ordre
  alfabètic, en qualsevol moment, i abans de la primera migració que apuge el
  mínim. Pujar el mínim vol dir tornar a crear la funció en una migració
  nova, quan el build nou ja és a les botigues, i mai per damunt del
  `VERSIO_CLIENT_NATIU` publicat (l'app nova es bloquejaria ella mateixa):
  `scripts/botigues/puja-ios.mjs` i `puja-android.mjs` només admeten un
  `--build` igual a `VERSIO_CLIENT_NATIU`. Cap taula, política ni codi
  d'error. La prova estàtica és
  `src/data/supabase/versioMinimaClient.migracio.test.js`.
  Verificació posterior (lectura):
  `select public.versio_minima_client('ios'), public.versio_minima_client('android'), public.versio_minima_client('web');`
  (els dos objectes, amb `versio_minima` 2, i `null`). Idempotent i en una
  sola transacció; **aplicada a producció** (lectura REST del 6-11-2026:
  `versio_minima_client('android')` respon 200 a anon; acta 261102_1456). Cap
  agent no la torna a aplicar.

- `migrations/2611011800_contracte_exportacio_federacio_v1.sql`
  P2-09 (kit Onada 2 de Codex, integrat a l'assalt 261101): contracte
  explícit v1 de l'exportació RGPD de les taules de federació, escrit a
  `supabase/contracts/exportacio_federacio.v1.json`. Crea
  `private.exporta_federacio_v1(p_uid uuid)` (STABLE, SECURITY INVOKER,
  `search_path` buit i cap EXECUTE: revoke a `public`, `anon`,
  `authenticated` i `service_role`; només accepta l'uid de la sessió) i torna
  a crear `public.exporta_les_meues_dades()` amb el cos sencer de 2610311900:
  només el bloc `federacio_no_versionada` passa a ser la crida a la funció
  privada, protegida: si la crida mateixa falla (la propietària de l'RPC no
  pot executar la privada, o la privada s'ha esborrat abans de tornar a
  aplicar la 2610311900), els quatre recursos donen el SQLSTATE (`42501` o
  `42883`) i la resta de l'exportació continua. L'RPC continua SECURITY
  DEFINER, amb el `search_path` buit, `auth.uid()` i EXECUTE només per a
  `authenticated`. Cada recurs té UNA
  columna de propietat (`realms.owner_user_id`, `user_realms.user_id`,
  `connections.user_id`, `posts.author_id`), sense precedència ni
  alternatives, i només s'exporta si és una taula (no una vista), si `id` i
  la columna de propietat són `uuid`, si cap columna del contracte té un
  tipus fora de la seua llista i si la columna de propietat té una FK d'una
  sola columna, validada, cap a `auth.users(id)` o `public.profiles(id)`.
  Si no, eixe recurs dona `SDP-FED-ESQUEMA-NO-ADMES` (exportació incompleta)
  i la resta continua; una lectura que falla dona el seu SQLSTATE. Ixen les
  files on eixa columna és la persona de la sessió i només les columnes del
  contracte. La clau `_contracte` en diu la versió; el client (`compte.js` i
  `contracteExportacioFederacio.js`) no canvia: torna a filtrar, deixa passar
  sencer el que projecta el servidor i descarta `_contracte`. Abans
  (lectura): les tres consultes de la capçalera, les columnes i les FK reals
  de les quatre taules (una columna de propietat sense FK validada cap a un
  compte donarà `SDP-FED-ESQUEMA-NO-ADMES`: cal decidir-ho abans d'aplicar) i
  si qui aplica és la propietària de l'RPC actual (ha de donar cert; si no,
  la federació eixirà amb `42501` a cada recurs).
  Verificació posterior (lectura):
  `select to_regprocedure('private.exporta_federacio_v1(uuid)') is not null as te_contracte_2611011800, position('private.exporta_federacio_v1' in pg_get_functiondef(to_regprocedure('public.exporta_les_meues_dades()'))) > 0 as l_rpc_la_crida, has_function_privilege('authenticated', 'private.exporta_federacio_v1(uuid)', 'execute') as authenticated_la_crida, (select p.proowner from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.exporta_les_meues_dades()')) = (select p.proowner from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.exporta_federacio_v1(uuid)')) as mateixa_propietaria;`
  (cert, cert, fals i cert). Després d'esta, la sonda `te_filtre_rgpd_2610311900`
  dona fals: el filtre ja és a la funció privada, i no cal tornar a aplicar
  la 2610311900. Va després de 2610311900; si mai es torna a aplicar la
  2610311900, cal tornar a aplicar esta. La inversa és a la capçalera:
  primer la 2610311900 i només després el `drop` de la privada. L'execució
  (dues persones, nou mutacions d'esquema, permisos per rol, una propietària
  distinta i la inversa desordenada, les consultes de la capçalera, la sonda,
  la reaplicació i la inversa: 65 comprovacions) la va fer el torn torn_3f5652a2 a PGlite
  0.3.16, fora del repositori: és evidència no versionada. La prova estàtica
  és `src/data/supabase/exportacioFederacio.contracte.test.js`. Idempotent i
  en una sola transacció; **aplicada segons l'acta 261102_1456** (sense
  lectura REST: `private.exporta_federacio_v1` i el cos
  d'`exporta_les_meues_dades()` no són visibles per a anon; ho pot confirmar
  la columna `te_contracte_federacio_2611011800` del Pas 0, encara sense
  resultat registrat). Cap agent no la torna a aplicar.

- `migrations/2611012257_politica_privacitat_2_3.sql`
  T11-05 (Gemini, Tall 11; marató 261101_2143): segella per primera vegada
  una versió 2.x de la política de privacitat. Fins ara
  `public.politiques_privacitat` només tenia la `'v1'` de 2609261500, sense
  empremta; la 2.0, la 2.2 i la 2.3 del web no tenien cap fila, i
  `registra_consentiment` guardava els consentiments a la `'v1'`. Una sola
  fila `'2.3'`: `text_complet` és l'HTML exacte de `legalContent.html`
  (`src/sections/text/legalContent.js`, 52.392 caràcters), `text_sha256` el
  seu SHA-256 en UTF-8 (el CHECK `politiques_text_i_empremta` el torna a
  calcular), `vigent_des_de` la data del rètol (1-11-2026, 00:00 CET) i
  `on conflict (versio) do nothing`. Des que s'aplica, `estat_consentiment()`
  diu `cal_reconsentir` a qui va acceptar una versió anterior. Abans
  (lectura), ha de donar només la `'v1'` sense segellar:
  `select versio, vigent_des_de, text_sha256 is not null as segellada from public.politiques_privacitat order by vigent_des_de;`
  Verificació posterior (lectura):
  `select text_sha256 = 'abd827d07af5aa30dc364f156a551deed4e9a43a830b9f57eca5a861ea4eadca' as segellada_2_3 from public.politiques_privacitat where versio = '2.3';`
  (cert). Sense inversa: una versió segellada no s'esborra ni es canvia
  (`SDP-RGPD-020` i `021`). Va després del desplegament web amb este mateix
  text de `/legal` (pas 12 de l'ordre obligatori); si el text canvia abans
  d'aplicar-la, es corregix el fitxer, i després, una versió nova. El 1-11 a
  les 22:47 CET i el 2-11 a les 00:09 i a les 04:14 CET, `https://socdepoble.org`
  encara servia la 2.2 (el paquet `pageContent` de producció): la 2.3 no era
  pública i no calia dir-ne 2.4. Per això B10 (P1-24, mateix torn) hi va
  corregir, abans d'aplicar-la, els apartats 11 i 14: la IAIA MarIA de
  l'aplicació respon al dispositiu i no envia el text a cap empresa
  d'intel·ligència artificial (prova: `src/sections/text/legal.iaia.test.js`).
  L'execució (la `'v1'` d'abans, l'empremta, el text idèntic, la
  idempotència, `SDP-RGPD-020` i `021` i la mutació d'un caràcter: 10
  comprovacions) la va fer el torn torn_3d9af83b a PGlite 0.3.16, fora del
  repositori, i la va repetir amb el text de B10: és evidència no versionada. La prova estàtica és
  `src/data/supabase/politicaPrivacitat23.migracio.test.js`: comprova la
  migració per dins (una 2.4 en una migració nova no la fa caure) i exigix
  que l'última versió segellada porte el text que `/legal` servix hui (§18).
  Idempotent i en una sola transacció; **aplicada a producció** (lectura REST del 6-11-2026:
  `politiques_privacitat` té la 2.3, vigent des del 2026-10-31T23:00Z, amb
  l'empremta `abd827d0…` d'esta migració). L'acta 261102_1456 la cita amb un
  altre nom de fitxer (`2611012257_b2_kid_monoton_i_f2a.sql`). Cap agent no la
  torna a aplicar.

- `migrations/2611020106_ap_inbox_persistencia_i_cua.sql`
  P1-23 (fase 2) i la part ActivityPub de P2-07 (marató 261101_2143, carril
  M14-B5-SQL): la persistència de la inbox ActivityPub i la cua d'eixida
  signada, que fa servir la funció `ap-inbox-verifica` (no desplegada) a
  través de `magatzemPostgrest.js`. Cinc taules a `private`
  (`ap_inbox_lliuraments`, `ap_seguidors`, `ap_alertes_remotes`,
  `ap_lapides` i `ap_cua_eixida`) amb RLS, sense cap política i amb tots els
  permisos de taula revocats, també a `service_role`, que salta l'RLS: cap rol
  de l'API les llig ni les escriu directament. Tretze RPC `public.ap_*`
  SECURITY DEFINER, amb el `search_path` buit, la guarda
  `auth.role() = 'service_role'` i EXECUTE només per a `service_role` (el
  patró de `purga_fitxers_*`). Paràmetres tipats: l'únic jsonb és el cos de
  `ap_cua_encua` (un objecte de 64 KiB com a molt, amb el mateix id que
  l'activitat). Quotes amb els missatges de la memòria (`SDP-AP-QUOTA`,
  54000): per host de l'actor, un sostre global per als subdominis comodí
  (`p_maxim`, que es pot ometre: 100.000), per actor local i global de les
  alertes. TTL a cada reclamació i a `ap_purga()`. A la cua, encuar és
  idempotent per (activitat, inbox), el mateix Accept es reenvia com a molt
  una vegada per hora i mai un cos distint amb el mateix id, i una fila
  reclamada 50 vegades sense cap resolució passa a fallida. No encén res:
  sense la funció desplegada, les claus de l'actor i la llista de nodes de
  confiança, les taules es queden buides. Abans (lectura):
  `select to_regclass('private.ap_inbox_lliuraments') is null as sense_inbox_ap, to_regprocedure('public.ap_cua_reclama(integer)') is null as sense_cua_ap;`
  (cert i cert). Verificació posterior (lectura):
  `select to_regclass('private.ap_cua_eixida') is not null as te_cua_ap, has_function_privilege('service_role', 'public.ap_inbox_reclama(text,text,text,text,integer,integer,integer)', 'execute') as servidor_reclama, has_function_privilege('authenticated', 'public.ap_inbox_reclama(text,text,text,text,integer,integer,integer)', 'execute') as authenticated_reclama, has_table_privilege('service_role', 'private.ap_seguidors', 'select') as servidor_llig_taula;`
  (cert, cert, fals i fals). La inversa és a la capçalera i esborra els
  seguidors, les alertes i la cua. L'execució (privilegis per defecte hostils
  a `private` i la mutació sense els revoke de taula, guardes, idempotència,
  quotes, TTL, cua i purga: 108 comprovacions) la va fer el torn
  torn_3d9af83b a PGlite 0.3.16, fora del repositori: és evidència no
  versionada, i PGlite no prova la concurrència real de `SKIP LOCKED` ni dels
  panys. La prova estàtica és `src/data/supabase/apInbox.migracio.test.js`
  (també la paritat dels noms i dels paràmetres de les RPC amb
  `magatzemPostgrest.js`). Va abans del desplegament de la funció (vegeu
  «Funció `ap-inbox-verifica`»). Idempotent i en una sola transacció;
  **aplicada a producció** (lectura REST del 6-11-2026: `ap_alertes_vigents(timestamptz)`,
  que només crea esta migració, existix, 401 42501). L'acta 261102_1456 la
  cita amb un altre nom de fitxer
  (`2611020106_b5_dades_obertes_i_cua_federacio.sql`). Cap agent no la torna a
  aplicar.

- `migrations/2611020417_xat_avisos_push.sql`
  B8 (marató 261101_2143, carril P01-B8S-MIGRACIO; ordre del Mestre 261101):
  els avisos push del Xat al servidor, tots apagats. `public.xat_dispositius_push`:
  un aparell per fila (`web` amb l'endpoint d'un servei conegut, `apns` o
  `fcm` amb el testimoni); únic per tipus i adreça; RLS de propietari; cap
  columna d'adreça per a `authenticated`. Les RPC del client, amb el contracte
  únic de B8-SERVIDOR §2.9 (plataforma `web`, `ios` o `android`):
  `xat_push_desa` (només amb `private.ajustos` `push_xat_actiu` = `si`; una
  adreça d'una altra persona només canvia d'amo amb `p_gest` = cert, i sense,
  `SDP-PUSH-011`; deu aparells per persona) i `xat_push_retira` (sempre, també
  apagat: és la baixa en eixir). `xat_silencia(fil, durada)`: el silenci per
  conversa, que fins ara cap RPC no escrivia, amb `8h`, `1setmana`, `sempre` o
  `cap` i el rellotge del servidor; «sempre» és 9999-12-31 00:00 UTC, mai
  `infinity`. La cua `private.xat_push_cua`, amb el disparador
  `xat_missatges_push_encua`: només s'omple amb l'ajust, es poda sola (res de
  més d'una hora, com a molt 100 files per missatge) i mai atura un missatge.
  La cua i `private.xat_push_credencials` tenen RLS sense cap política: només
  hi entren les funcions. El General i els Avisos de pàgines i comunitats no
  avisen sense `push_xat_generals` = `si`; un `push_xat_dies_dispositiu` que
  no és un enter cau en 60 dies. Les RPC del worker `notifica-xat`, només per
  a `service_role` i amb la guarda `auth.role()`: `xat_push_reclama` (com a
  molt 5.000 aparells i 1.800.000 octets de JSON per lot, perquè el worker en
  llig 2 MiB; la resta compta a `retallats`), `xat_push_expulsa`,
  `xat_push_neteja`, `xat_push_credencial` i
  `xat_push_desa_credencial`. Cap pg_net, Vault ni secret. Abans (lectura), ha
  de donar fals:
  `select to_regclass('public.xat_dispositius_push') is not null as te_dispositius;`
  Verificació posterior (lectura):
  `select to_regclass('public.xat_dispositius_push') is not null as te_dispositius, to_regprocedure('public.xat_silencia(uuid, text)') is not null as te_silenci, has_function_privilege('authenticated', 'public.xat_push_reclama(integer)', 'execute') as authenticated_reclama, coalesce((select valor from private.ajustos where clau = 'push_xat_actiu'), 'no') as actiu;`
  (cert, cert, fals i no). L'execució (aplicar dues vegades, apagat i encés,
  els codis, les crides de B8-CLIENT amb paràmetres amb nom, l'aparell
  compartit amb gest i sense, el sostre, les quatre durades del silenci i la
  sentinella llegida a quatre zones horàries, els permisos per rol, per
  columna i amb `SET ROLE`, els filtres dels destinataris, els Avisos de
  pàgina, la retenció de la cua sense worker, una cua trencada que no atura
  el missatge, l'ajust de dies fora de rang, el silenci que només toca qui
  crida i l'RLS de les taules privades: 104 comprovacions; i el pressupost
  d'octets del reclam amb 5.000 aparells, també amb endpoints de 2.048
  caràcters plens de cometes: 7) la va fer el torn torn_3d9af83b a PGlite
  0.3.16, fora del repositori: és evidència no versionada. La prova estàtica és
  `src/data/supabase/xatAvisosPush.migracio.test.js` (també la paritat de la
  llista blanca amb el client i amb el worker, i dels paràmetres de cada
  `rpc()` de `notifica-xat`). Va abans del desplegament de `notifica-xat`
  (porta `funcio-notifica-xat`); `push_xat_actiu` es posa només després del
  cron (vegeu «Funció `notifica-xat`»). Idempotent i en una sola transacció;
  **aplicada a producció** (acta 261102_1456; lectura REST del 6-11-2026: la
  taula `public.xat_dispositius_push` existix). L'acta la cita amb un altre nom
  de fitxer (`2611020417_b8_push_xat.sql`). Cap agent no la torna a aplicar.

- `migrations/2611021800_notes_fitxa_ambit.sql`
  IDEA-61 (T0, prompt 261102_1532; carril L1): la fitxa d'àmbit d'una nota del
  Flux Universal de Publicació (Mur <-> Mercat · Compartir cotxe · Treball ·
  Habitatge). Afig `public.notes.fitxa` (`jsonb`, `null` a les notes de
  sempre): un sol objecte `{ ambit, estat, dades }` amb el CHECK lleuger
  `notes_fitxa_objecte` (`null` o `jsonb_typeof = 'object'`), com
  `notes.origen` (2609272100), i el comentari de la columna. La forma de dins
  la coacciona el client (`src/utils/publicacioUniversal.js` ·
  `coaccionaAmbit`) en escriure-la i en llegir-la; la fitxa publicada viu al
  payload de `section_submissions` (secció `mur` o `mercat`: cap `section_id`
  nou). Cap política, permís, índex, funció, disparador ni backfill. En un
  node sense la columna, el client la tracta com a columna opcional
  (`src/data/supabase/columnesOpcionals.js`, PGRST204): la fitxa es queda en
  quarantena al dispositiu, la resta de la nota es desa i publicar funciona
  igual, perquè `publishNote` la llig de la nota viva. Abans (lectura), ha de
  donar fals:
  `select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'fitxa') as te_fitxa;`
  Verificació posterior (lectura):
  `select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'fitxa') as te_fitxa, exists (select 1 from pg_constraint where conname = 'notes_fitxa_objecte') as te_check;`
  (cert i cert). Per a desfer-la: `alter table public.notes drop column if exists fitxa;`.
  La prova estàtica és `src/data/supabase/notesFitxa.migracio.test.js`.
  Idempotent i en una sola transacció; **aplicada a producció** (lectura REST
  del 6-11-2026: la columna `notes.fitxa` respon 200 a anon). Cap agent no la
  torna a aplicar.

- `migrations/2611030330_politica_privacitat_2_4.sql`
  Onada 6: presentació editorial de `/legal`, amb 6–8 negretes als 29
  paràgrafs abans plans. Rètol 2.4 en vigor des del 3 de novembre de 2026;
  la resta de paraules, dades, terminis i enllaços es conserva. La 2.3 i la
  migració `2611012257` no es reescriuen (`SDP-RGPD-021`). Una sola inserció
  idempotent, amb comprovació transaccional del conflicte: una 2.4 preexistent
  amb altre hash, URL, data o sense text causa error i rollback, sense cap
  UPDATE/DELETE de la 2.3. L'HTML exacte té SHA-256 `2956bc30112b2e8d097815d502f9cd711e9ee0c213c5c73634340d9657343ff3`.
  Abans (lectura): comprovar les versions i que la 2.3 conserva l'empremta
  `abd827d07af5aa30dc364f156a551deed4e9a43a830b9f57eca5a861ea4eadca`.
  Després (lectura): comprovar l'empremta de la 2.4 i tornar a comprovar la 2.3.
  Primer tornar a construir i desplegar web/connector amb el text 2.4 i
  verificar-ne l'empremta; només després, la migració (pas 13 de l'ordre).
  `estat_consentiment()` demanarà tornar a acceptar a qui tenia una versió
  anterior. No s'executa SQL des del kit ni s'activen serveis nous.
  Prova: `src/data/supabase/politicaPrivacitat24.migracio.test.js`.
  **Aplicada a producció** (lectura REST del 6-11-2026: `politiques_privacitat` té la 2.4,
  vigent des del 2026-11-02T23:00Z, amb l'empremta `2956bc30…` d'esta
  migració; la lectura de R9 del mateix dia encara no la hi trobava). Cap
  agent no la torna a aplicar.

- `migrations/2611031500_notes_logo_mode_nit.sql`
  IDEA-70: afig `notes.logo_image_dark` (`text`, opcional) per al logotip de
  capçalera en mode nit. `logo_image` conserva el mode dia. Idempotent i en
  una sola transacció, sense canvis de RLS ni backfill. El client conserva
  el camp en quarantena al dispositiu si la columna encara no existix i ho
  mostra a l'estat de desament; els resums no la demanen. Proves:
  `src/data/supabase/notes.logoDark.test.js`. Verificació posterior (lectura):
  `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'logo_image_dark';`.
  Per a desfer-la: `alter table public.notes drop column if exists logo_image_dark;`.
  **Aplicada a producció** (lectura REST del 6-11-2026: la columna
  `notes.logo_image_dark` respon 200 a anon). Cap agent no la torna a aplicar.

- `migrations/2611031700_administracio_multipoble.sql`
  FEDI-04: afig les RPC `admin_llista_pobles()` i
  `admin_llegix_personalitzacio(uuid)` per a seleccionar un tenant real de
  `public.towns` i llegir-ne només `taxonomia` i `estil`, amb les versions.
  Les dues comproven `private.es_superadmin()` abans de qualsevol lectura:
  exigixen rol superadmin i JWT `aal2`; ser admin a `town_memberships` no
  atorga este permís. `SECURITY DEFINER`, `search_path = ''`, EXECUTE revocat
  a `PUBLIC` i `anon` i concedit només a `authenticated`, darrere de la
  mateixa guarda. Additiva i idempotent, en una transacció; no canvia RLS,
  dades ni permisos de mutació. Depén de `2610061448_superadmin_aal2.sql` i
  de les taules existents `towns` i `app_content`. El client envia el tenant
  seleccionat explícitament; no modifica la sessió ni el tenant global.
  Prova estàtica: `src/data/supabase/admin.multipoble.test.js`.
  Verificació posterior (lectura):
  `select to_regprocedure('public.admin_llista_pobles()'), to_regprocedure('public.admin_llegix_personalitzacio(uuid)');`.
  Les proves de rol, segon factor i tenant contra PostgreSQL continuen
  pendents. **Aplicada a producció** (lectura REST del 6-11-2026: `admin_llista_pobles()`
  i `admin_llegix_personalitzacio(uuid)` existixen, 401 42501; la 2611032100,
  que la requerix, també hi és). Cap agent no la torna a aplicar.

- `migrations/2611032100_connexions_publiques_i_membres.sql`
  FEDI23: connexions públiques només amb consentiment global i per vincle,
  membres públics consentits i peticions de pertinença només pendents.
  Requerix 2610250100, 2610281730, 2610282100 i el catàleg fins a 2611031700.
  Quatre taules privades amb RLS sense permisos client/service_role; sis RPC
  amb ACL mínimes i auth.uid/rol vigent. Vegeu «FEDI23» al final.
  **Aplicada a producció** (lectura REST del 6-11-2026: `connexions_publiques_de` i
  `membres_i_entitats_connectades_de` responen 200 a anon; aplicada pel
  Mestre el 6-11). Cap agent no la torna a aplicar.

- `migrations/2611051930_edicio_publicacions_editorials.sql`
  R12 (kit de Codex, integrat per B4-S1): RPC `admin_actualitza_publicacio_editorial`
  (superadmin + aal2, camps blancs, CAS sobre `app_content.version`), backfill
  selectiu del Manifest i l'Aplec, i carpetes privades `note_folders` amb RLS de
  propietari + pertinença al poble i RPC `crea_carpeta_notes`. Requerix 2610061448.
  **Aplicada a producció** (lectura REST del 6-11-2026: la taula `note_folders` i les RPC
  `crea_carpeta_notes` i `admin_actualitza_publicacio_editorial` existixen,
  401 42501, i només les crea esta migració; aplicada pel Mestre el 6-11).
  Cap agent no la torna a aplicar.

- `migrations/2611052345_admin_usuaris_i_organitzacions.sql`
  R20b (kit de Codex, arbitratge G2): llista de perfils amb consentiment del
  poble seleccionat (correu emmascarat, cursor de 50 files com a màxim) i
  invitacions de `member` que només la destinatària accepta. Cal superadmin amb
  `aal2` que ja siga owner/admin de l'entitat; sense autoassignació ni rol admin.
  Dues taules privades amb RLS i sense permisos de client ni de service_role;
  `private.admin_accions` només admet insercions. Requerix 2611032100.
  **Aplicada a producció** (lectura REST del 6-11-2026: `admin_llista_usuaris_registrats`,
  `admin_convida_a_entitat`, `admin_connecta_usuari` i
  `les_meues_invitacions_admin` existixen, 401 42501; aplicada pel Mestre el
  6-11). Abans d'encendre `administracioUsuaris` continuen per decidir G2-04
  i G2-08 (informe 261106_0146). Cap agent no la torna a aplicar.

- `migrations/2611060010_restauracio_municipal_opendata.sql`
  IDEA-104c: importació idempotent (upsert) de les dades obertes públiques d'un
  poble (format 1.2.0), sense esborrar els absents; lectura pública fitada.
  Identificadors globals per col·lecció (K1-06). Independent de 2611052345.
  **Aplicada a producció** (lectura REST del 6-11-2026: `llegix_municipi_open_data_per_slug`
  respon 200 a anon; aplicada pel Mestre el 6-11). La lectura pública ja és
  oberta a anon: G2V-02 (fitxes orals `draft`) i G2V-03 (cap paginació)
  continuen per decidir (informe 261106_0146). Cap agent no la torna a aplicar.

- `migrations/2611061520_politica_privacitat_2_5.sql`
  Onada R9 (C3, IDEA-120 / P0-30): `/legal` diu els avisos push del xat,
  que l'ordre del Mestre del 261106 encén (`AVISOS_PUSH_XAT_ACTIUS`).
  Rètol 2.5 en vigor des del 6 de novembre de 2026; canvien només els
  apartats 8, 9, 10, 11, 12 i 20 (ho guarda
  `src/sections/text/legal.avisosPush.test.js`). La 2.3 i la 2.4 no es
  reescriuen (`SDP-RGPD-021`). Una sola inserció idempotent, amb la
  comprovació transaccional del conflicte. L'HTML exacte té SHA-256 `ea13f0c4ca8f69ebf8c29035d6f7804d401d48dbdc6e3b5d5fb2b1b975fc1fc7`.
  Abans (lectura): comprovar les versions i que la 2.3 conserva l'empremta
  `abd827d07af5aa30dc364f156a551deed4e9a43a830b9f57eca5a861ea4eadca`.
  Després (lectura): comprovar l'empremta de la 2.5 i tornar a comprovar la 2.3.
  Primer tornar a construir i desplegar web/connector amb el text 2.5 i
  verificar-ne l'empremta; només després, la migració (pas 14 de l'ordre).
  `estat_consentiment()` demanarà tornar a acceptar a qui tenia una versió
  anterior.
  Prova: `src/data/supabase/politicaPrivacitat25.migracio.test.js`.
  **Aplicada a producció** (lectura REST del 6-11-2026: `politiques_privacitat` té la 2.5,
  vigent des del 2026-11-05T23:00Z, amb l'empremta `ea13f0c4…` d'esta
  migració; aplicada pel Mestre el 6-11). Cap agent no la torna a aplicar.

- `seed.sql`
  Contingut inicial del portal.

## Ordre correcte

1. Crear el projecte en Supabase.
2. Obrir el SQL Editor.
3. Executar els fitxers SQL del directori `migrations/` en ordre alfabètic. En un node ja en marxa, l'ordre és el del pla del verificador: l'alfabètic tret de les inversions declarades a `ordre_desplegament.json` (ara, 2610312000 just després de 2610311800).
4. Crear el poble corresponent a `VITE_TENANT_ID` i configurar el node. `seed.sql` és opcional per a demostracions; l’entrada real no requerix dades seed.
5. Configurar el `.env` local amb `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` i `VITE_TENANT_ID`. No usar mai `service_role` en el client.

Aplicar cada versió pendent amb el registre de migracions. Les migracions noves 2609272100 i 2609272200 s’han provat també repetides; no s’ha d’inferir que qualsevol migració històrica siga repetible sense revisar-la.

### Verificació en 1 segon de l'estat de producció (`P0-05` / `DF-06`)

Abans d'aplicar qualsevol lot pendent al panell SQL de Supabase, el Mestre pot consultar el registre i els objectes crítics amb estos blocs **només de lectura**:

La rapidesa depén del node; esta consulta és només de lectura. Executeu primer
esta sonda. Si torna `null`, el registre no existix: **estat desconegut**, no
«cap migració aplicada». En eixe cas ometeu la segona consulta i executeu les
sondes d’objectes igualment.

```sql
SELECT to_regclass('supabase_migrations.schema_migrations') AS registre_migracions;
```

Només si la sonda confirma el registre (instal·lació per Supabase CLI):

```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

Sondes d’objectes independents del registre:

```sql
-- 2. Sonda ràpida d'objectes crítics de les fases D, E, Fortificació i Lot 3/4
SELECT
  to_regclass('public.denuncies') IS NOT NULL AS te_moderacio_2610201500,
  to_regclass('public.xat_adjunts') IS NOT NULL AS te_adjunts_2610220240,
  to_regprocedure('private.versio_normes_vigent()') IS NOT NULL AS te_normes_2610241400,
  to_regclass('private.autoritzacions_apple') IS NOT NULL AS te_apple_2610241420,
  to_regclass('public.seguiments') IS NOT NULL AS te_seguiments_2610241430,
  to_regclass('public.xat_claus_usuari') IS NOT NULL AS te_e2ee_1a_2610290400,
  to_regprocedure('public.transfereix_propietat_organitzacio(uuid,uuid)') IS NOT NULL AS te_transferencia_2610311500,
  to_regclass('public.xat_epoques') IS NOT NULL AS te_e2ee_1bc_2610311800,
  -- Fals després de 2611011800, i és correcte: el filtre ja és a private.exporta_federacio_v1
  -- (mireu te_contracte_federacio_2611011800). No torneu a aplicar 2610311900 per això.
  coalesce(position('SDP-FED-ESQUEMA-NO-ADMES' in pg_get_functiondef(to_regprocedure('public.exporta_les_meues_dades()'))) > 0, false) AS te_filtre_rgpd_2610311900,
  coalesce((SELECT p.prosecdef FROM pg_proc p WHERE p.oid = to_regprocedure('private.xat_lot3_b64(text,integer)')), false) AS te_esmena_2610312000,
  to_regprocedure('public.pot_signar_com_organitzacio(uuid,uuid)') IS NOT NULL AS te_autoria_poble_2611011500,
  coalesce(position('private.exporta_federacio_v1' in pg_get_functiondef(to_regprocedure('public.exporta_les_meues_dades()'))) > 0, false) AS te_contracte_federacio_2611011800;
```

### Verificador estàtic i pla de només lectura (`P0-05` · `P0-21`)

`node scripts/supabase/verifica-migracions.mjs` llig els fitxers de
`migrations/`, este README i `ordre_desplegament.json` i no es connecta a cap
base. Comprova noms, versions, dependències declarades i inferides,
transaccions, idempotència i que cada consulta marcada «(lectura)» siga de
veres de només lectura: creua cada crida amb la volatilitat que les migracions
declaren per a la funció, i les receptes de dues sessions per a una base de
prova no entren mai al pla. Amb `--pla` imprimix per al Mestre el Pas 0
(registre, sonda d'objectes i empremtes) i, quan rep `--aplicades <csv>` o
`--empremtes <csv>`, els passos d'aplicació en l'ordre que demana esta secció,
amb les portes de client i de funcions i els forats que obligarien a reaplicar
migracions posteriors. Sense evidència de l'estat remot només proposa, com a
declarades, les «NO aplicada» del final de l'ordre, i cal confirmar-les amb el
Pas 0. Si el registre contradiu les empremtes o la sonda, o és buit mentre este
README declara migracions aplicades, no proposa cap pas: dona error i demana
tornar a generar el pla només amb `--empremtes`. Les restriccions que l'ordre
alfabètic no expressa viuen a
`ordre_desplegament.json`, i el verificador comprova que diuen el mateix que la
seqüència següent. Una migració nova, posterior a totes, en una transacció,
amb formes idempotents, amb `-- Depén de:` i amb consultes «Abans (lectura)» i
«Verificació posterior (lectura)» en minúscula a la capçalera passa el
verificador sense avisos.

### Nota d'auditoria `DF-06` (`P0-05`) i seqüència obligatòria de desplegament (`P0-21`)

- **Aclariment `DF-06` (inexistència de `2610201400` i `elements_comu`):** Les referències històriques a una migració `2610201400` (esborrat de compte) o a una taula `elements_comu` no corresponen a cap fitxer real de `supabase/migrations/` ni de l'historial Git. La baixa amb quarantena i purga viu a `2609261500_identitat_perfil_f1.sql` i s'amplia a `2610241440_baixa_completa_ugc_i_fitxers.sql`.
- **Ordre obligatori del lot `P0-21` i `Lot 3/4`:**
  1. `2610201500_moderacio_denuncies_i_bloquejos.sql` (moderació UGC).
  2. Desplegament del client amb `VERSIO_NORMES_CONVIVENCIA = '2026-10-24'`.
  3. `2610241400_normes_exigides_ugc.sql` (amb el mateix rol propietari que `2610201500`).
  4. `2610241410_exporta_dades_moderacio.sql` (exportació RGPD ampliada).
  5. `2610241420_revocacio_apple.sql` (custòdia i cua de revocació d'Apple).
  6. `2610241430_seguiments.sql` (abans d'obrir el botó «Seguir» al públic).
  7. `2610241440_baixa_completa_ugc_i_fitxers.sql` (purga completa i porta d'Apple).
  8. `2610250100` → `2610250300` → `2610281730` → `2610282100` → `2610290400` → `2610311500` → `2610311800` → `2610312000` → `2610311900` (2610312000 just després de 2610311800 i de nou si mai es reaplica 2610311800; 2610311900 abans de publicar el client).
  9. Funcions de vora (`supabase/functions/`): `compte-apple` i `purga-fitxers` (secret compartit `SDP_CRON_SECRET`, crons horaris) i `noticies` (fonts personals desactivades fins a `SDP_NOTICIES_PERSONALS=1`).
  10. `2611011500` (només després de llegir les dues consultes «Abans» de la seua vinyeta) i `2611011510` (en qualsevol moment, sempre abans de cap migració que apuge el mínim per damunt de 2).
  11. `2610311900` → `2611011800` (P2-09: només després de llegir les tres consultes «Abans» de la seua capçalera, i aplicada per la propietària de l'RPC; si mai es reaplica 2610311900, cal tornar a aplicar 2611011800).
  12. Primer el desplegament web amb el text final de `/legal`; després `2611012257` (T11-05: si s'aplica abans, el servidor demana acceptar la 2.3 mentre `/legal` encara mostra la 2.2; i només després de llegir la consulta «Abans» de la seua vinyeta). Abans de desplegar, cal tornar a construir el web i el connector (els `dist/` de l'1-11 a les 19:28 porten una altra «Versió 2.3», sense la ubicació de les fotos) i comprovar que el `/legal` desplegat té l'empremta de la migració.

  13. Primer tornar a construir i desplegar web/connector amb `/legal` 2.4 i verificar-ne l'empremta; després `2611030330` (Onada 6; conserva la 2.3, demana nou consentiment; cap agent no l'aplica).
  14. Primer tornar a construir i desplegar web/connector amb `/legal` 2.5 i verificar-ne l'empremta; després `2611061520` (Onada R9, avisos push del xat; conserva la 2.3 i la 2.4, demana nou consentiment; cap agent no l'aplica). Al Node 0 amb POSSE (`SDP_NODE0_POSSE=1`), no es torna a hidratar fins que `tooling/node0/posse/posse-ledger.sql` no porte els llibres 77 i 79 amb esta migració exacta (R9V-C3-01): si el text de la 2.5 canvia, els pins s'han de tornar a calcular.

### Taula canònica ordenada: 60 fitxers de R1 + candidates 1500, 1800, 1900 i 2000 + assalt 2611011500, 2611011510 i 2611011800 + marató 2611012257 i 2611020106 + `seed.sql` + 2 snippets (`P0-05` / `DF-06`)

| Ordre | Versió | Fitxer a `supabase/migrations/` | Estat declarat | Objectiu resumit |
| :---: | :--- | :--- | :--- | :--- |
| 01 | `2609080000` | `2609080000_initial_schema.sql` | Estat remot no acreditat; comprovar abans d’aplicar | initial schema |
| 02 | `2609080100` | `2609080100_xat_v2.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat v2 |
| 03 | `2609080200` | `2609080200_xat_v2_correccions.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat v2 correccions |
| 04 | `2609080300` | `2609080300_xat_v2_membres.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat v2 membres |
| 05 | `2609110600` | `2609110600_perfil_avatar_i_permisos.sql` | Estat remot no acreditat; comprovar abans d’aplicar | perfil avatar i permisos |
| 06 | `2609121500` | `2609121500_correccio_privacitat_perfils.sql` | Estat remot no acreditat; comprovar abans d’aplicar | correccio privacitat perfils |
| 07 | `2609121600` | `2609121600_admin_panel.sql` | Estat remot no acreditat sencer (lectura REST del 6-11: `admin_list_users()` existix, 401 42501; `admin_list_organizations()` donava 404 PGRST202 a les 22:08 CET i respon 401 42501 a les 23:22 i a les 23:53, sense cap migració nova al repositori); no la torneu a aplicar sencera | admin panel |
| 08 | `2609130500` | `2609130500_bucket_mitjans.sql` | Estat remot no acreditat; comprovar abans d’aplicar | bucket mitjans |
| 09 | `2609140000` | `2609140000_schema_notes.sql` | Estat remot no acreditat; comprovar abans d’aplicar | schema notes |
| 10 | `2609140100` | `2609140100_auditoria_rls_fixes.sql` | Estat remot no acreditat; comprovar abans d’aplicar | auditoria rls fixes |
| 11 | `2609150000` | `2609150000_seguretat_profunda_deepseek.sql` | Estat remot no acreditat; comprovar abans d’aplicar | seguretat profunda deepseek |
| 12 | `2609160600` | `2609160600_politiques_superadmin_organitzacions.sql` | Estat remot no acreditat; comprovar abans d’aplicar | politiques superadmin organitzacions |
| 13 | `2609162300` | `2609162300_correccions_mur_i_xat.sql` | Estat remot no acreditat; comprovar abans d’aplicar | correccions mur i xat |
| 14 | `2609191650` | `2609191650_bucket_mitjans_privats.sql` | Estat remot no acreditat; comprovar abans d’aplicar | bucket mitjans privats |
| 15 | `2609200300` | `2609200300_blindatge_storage_i_contingut.sql` | Estat remot no acreditat; comprovar abans d’aplicar | blindatge storage i contingut |
| 16 | `2609200600` | `2609200600_xat_limit_correccio.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat limit correccio |
| 17 | `2609211820` | `2609211820_fix_security_definer.sql` | Estat remot no acreditat; comprovar abans d’aplicar | fix security definer |
| 18 | `2609261200` | `2609261200_publicacions_autoria.sql` | Estat remot no acreditat; comprovar abans d’aplicar | publicacions autoria |
| 19 | `2609261500` | `2609261500_identitat_perfil_f1.sql` | Estat remot no acreditat; comprovar abans d’aplicar | identitat perfil f1 |
| 20 | `2609262232` | `2609262232_copyright_editor.sql` | Estat remot no acreditat; comprovar abans d’aplicar | copyright editor |
| 21 | `2609270200` | `2609270200_xat_f0_fonament.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat f0 fonament |
| 22 | `2609271400` | `2609271400_notes_paperera.sql` | Estat remot no acreditat; comprovar abans d’aplicar | notes paperera |
| 23 | `2609272100` | `2609272100_notes_origen.sql` | Estat remot no acreditat; comprovar abans d’aplicar | notes origen |
| 24 | `2609272200` | `2609272200_xat_entitats.sql` | Aplicada al node remot el 261009 (declarat en esta llista) | xat entitats |
| 25 | `2609272201` | `2609272201_grups_mare.sql` | Estat remot no acreditat; comprovar abans d’aplicar | grups mare |
| 26 | `2609281500` | `2609281500_lema_entradilla_256.sql` | Estat remot no acreditat; comprovar abans d’aplicar | lema entradilla 256 |
| 27 | `2609282035` | `2609282035_perfil_emoticona.sql` | Estat remot no acreditat; comprovar abans d’aplicar | perfil emoticona |
| 28 | `2609282100` | `2609282100_xat_de_pagina.sql` | Aplicada al node remot el 261009 (declarat en esta llista) | xat de pagina |
| 29 | `2609291200` | `2609291200_baixa_icon_copyright.sql` | Estat remot no acreditat; comprovar abans d’aplicar | baixa icon copyright |
| 30 | `2609291210` | `2609291210_xat_cerca_accents.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat cerca accents |
| 31 | `2609291230` | `2609291230_xat_realtime_lectura.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat realtime lectura |
| 32 | `2610021520` | `2610021520_perfil_public.sql` | Estat remot no acreditat; comprovar abans d’aplicar | perfil public |
| 33 | `2610042330` | `2610042330_xat_pagina_iaia.sql` | Aplicada al node remot el 261009 (declarat en esta llista) | xat pagina iaia |
| 34 | `2610042350` | `2610042350_convergencia_perfil_i_create_organization.sql` | Estat remot no acreditat; comprovar abans d’aplicar | convergencia perfil i create organization |
| 35 | `2610061448` | `2610061448_superadmin_aal2.sql` | Estat remot no acreditat; comprovar abans d’aplicar | superadmin aal2 |
| 36 | `2610061450` | `2610061450_capcalera_client_ip.sql` | Estat remot no acreditat; comprovar abans d’aplicar | capcalera client ip |
| 37 | `2610072230` | `2610072230_mur_imatges_propies.sql` | Estat remot no acreditat; comprovar abans d’aplicar | mur imatges propies |
| 38 | `2610081400` | `2610081400_grups_sense_mare.sql` | Estat remot no acreditat; comprovar abans d’aplicar | grups sense mare |
| 39 | `2610081401` | `2610081401_organitzacions_poble.sql` | Estat remot no acreditat; comprovar abans d’aplicar | organitzacions poble |
| 40 | `2610081402` | `2610081402_membres_organitzacio.sql` | Estat remot no acreditat; comprovar abans d’aplicar | membres organitzacio |
| 41 | `2610081543` | `2610081543_xat_consentiment_i_metadades.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat consentiment i metadades |
| 42 | `2610090100` | `2610090100_convergencia_xat_de_pagina.sql` | Aplicada al node remot el 261009 (declarat en esta llista) | convergencia xat de pagina |
| 43 | `2610101900` | `2610101900_personalitzacio_superadmin.sql` | Estat remot no acreditat; comprovar abans d’aplicar | personalitzacio superadmin |
| 44 | `2610160250` | `2610160250_perfil_update_propi.sql` | Estat remot no acreditat; comprovar abans d’aplicar | perfil update propi |
| 45 | `2610181800` | `2610181800_perfil_public_per_defecte.sql` | Estat remot no acreditat; comprovar abans d’aplicar | perfil public per defecte |
| 46 | `2610181915` | `2610181915_organitzacions_correu_i_membres.sql` | Estat remot no acreditat; comprovar abans d’aplicar | organitzacions correu i membres |
| 47 | `2610201500` | `2610201500_moderacio_denuncies_i_bloquejos.sql` | Estat remot no acreditat; comprovar abans d’aplicar | moderacio denuncies i bloquejos |
| 48 | `2610211715` | `2610211715_revoca_correu_organitzacions.sql` | Estat remot no acreditat; comprovar abans d’aplicar | revoca correu organitzacions |
| 49 | `2610220240` | `2610220240_xat_adjunts_i_quota.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat adjunts i quota |
| 50 | `2610241400` | `2610241400_normes_exigides_ugc.sql` | Estat remot no acreditat; comprovar abans d’aplicar | normes exigides ugc |
| 51 | `2610241410` | `2610241410_exporta_dades_moderacio.sql` | Estat remot no acreditat; comprovar abans d’aplicar | exporta dades moderacio |
| 52 | `2610241420` | `2610241420_revocacio_apple.sql` | Estat remot no acreditat; comprovar abans d’aplicar | revocacio apple |
| 53 | `2610241430` | `2610241430_seguiments.sql` | Aplicada al node remot el 261103 (70/70 verificat pel Mestre) | seguiments |
| 54 | `2610241440` | `2610241440_baixa_completa_ugc_i_fitxers.sql` | Estat remot no acreditat; comprovar abans d’aplicar | baixa completa ugc i fitxers |
| 55 | `2610242320` | `2610242320_correu_propietaria_nomes_titular.sql` | Aplicada al node remot el 261103 (70/70 verificat pel Mestre) | correu propietaria nomes titular |
| 56 | `2610250100` | `2610250100_seguiments_des_d_entitat.sql` | Aplicada al node remot el 261103 (70/70 verificat pel Mestre) | seguiments des d entitat |
| 57 | `2610250300` | `2610250300_titular_public.sql` | Estat remot no acreditat; comprovar abans d’aplicar | titular public |
| 58 | `2610281730` | `2610281730_membres_concurrents_i_correu_public.sql` | Estat remot no acreditat; comprovar abans d’aplicar | membres concurrents i correu public |
| 59 | `2610282100` | `2610282100_usuari_i_poble_canonic.sql` | Aplicada al node remot el 261103 (70/70 verificat pel Mestre) | usuari i poble canonic |
| 60 | `2610290400` | `2610290400_xat_e2ee_claus_i_sobres.sql` | Estat remot no acreditat; comprovar abans d’aplicar | xat e2ee claus i sobres |
| 61 | `2610311500` | `2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql` | Aplicada a producció (lectura REST del 6-11: `transfereix_propietat_organitzacio(uuid, uuid)` existix, 401 42501; acta 261101_0334) | commutacio grup empresa i transferencia propietat |
| 62 | `2610311800` | `2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql` | Aplicada a producció (lectura REST del 6-11: la taula `xat_epoques` existix, 401 42501; acta 261101_0334) | e2ee fases 1b 1c rpcs i adjunts |
| 63 | `2610311900` | `2610311900_exporta_dades_filtre_servidor_rgpd.sql` | Estat remot no acreditat (l'acta 261101_0334 la dona aplicada; la lectura REST no veu el cos d'`exporta_les_meues_dades()`); ho pot acreditar el Pas 0 | filtre RGPD al servidor |
| 64 | `2610312000` | `2610312000_e2ee_lot3_validadors_service_role.sql` | Estat remot no acreditat (l'acta 261101_0334 la dona aplicada; la lectura REST no veu `private.xat_lot3_b64`); ho pot acreditar la columna `te_esmena_2610312000` del Pas 0 | validadors E2EE per a service_role |
| 65 | `2611011500` | `2611011500_autoria_ajuntament_mateix_poble.sql` | Aplicada a producció (lectura REST del 6-11: `pot_signar_com_organitzacio(uuid, uuid)` existix, 401 42501, i la signatura vella `(uuid)` ja no, 404 PGRST202; acta 261102_1456) | autoria d'ajuntament al seu poble (D-6) |
| 66 | `2611011510` | `2611011510_versio_minima_client.sql` | Aplicada a producció (lectura REST del 6-11: `versio_minima_client('android')` respon 200 a anon; acta 261102_1456) | versió mínima de l'app nativa (P0-23) |
| 67 | `2611011800` | `2611011800_contracte_exportacio_federacio_v1.sql` | Aplicada segons l'acta 261102_1456 (sense lectura REST: els seus objectes no són visibles per a anon) | contracte v1 de l'exportació de federació (P2-09) |
| 68 | `2611012257` | `2611012257_politica_privacitat_2_3.sql` | Aplicada a producció (lectura REST del 6-11: `politiques_privacitat` té la 2.3 amb l'empremta `abd827d0…` d'esta migració; acta 261102_1456, amb un altre nom de fitxer) | política de privacitat 2.3 segellada (T11-05) |
| 69 | `2611020106` | `2611020106_ap_inbox_persistencia_i_cua.sql` | Aplicada a producció (lectura REST del 6-11: `ap_alertes_vigents(timestamptz)` existix, 401 42501; acta 261102_1456, amb un altre nom de fitxer) | persistència de la inbox ActivityPub i cua d'eixida (P1-23 fase 2) |
| 70 | `2611020417` | `2611020417_xat_avisos_push.sql` | Aplicada a producció (acta 261102_1456; lectura REST del 6-11: la taula existix) | avisos push del Xat: aparells, silenci i cua (B8) |
| 71 | `2611021800` | `2611021800_notes_fitxa_ambit.sql` | Aplicada a producció (lectura REST del 6-11: la columna `notes.fitxa` respon 200 a anon) | fitxa d'àmbit de les notes del Flux Universal de Publicació (IDEA-61, T0) |
| 72 | `2611030330` | `2611030330_politica_privacitat_2_4.sql` | Aplicada a producció (lectura REST del 6-11: `politiques_privacitat` té la 2.4 amb l'empremta `2956bc30…` d'esta migració; aplicada el 6-11, perquè la lectura de R9 d'eixe dia encara no la hi trobava) | política 2.4: èmfasi editorial, 2.3 intacta (Onada 6) |
| 73 | `2611031500` | `2611031500_notes_logo_mode_nit.sql` | Aplicada a producció (lectura REST del 6-11: la columna `notes.logo_image_dark` respon 200 a anon) | logotip de capçalera de Notes per al mode nit (IDEA-70) |
| 74 | `2611031700` | `2611031700_administracio_multipoble.sql` | Aplicada a producció (lectura REST del 6-11: `admin_llista_pobles()` i `admin_llegix_personalitzacio(uuid)` existixen, 401 42501) | selecció de tenants i personalització per poble amb superadmin + aal2 (FEDI-04) |
| 75 | `2611032100` | `2611032100_connexions_publiques_i_membres.sql` | Aplicada a producció (lectura REST del 6-11: `connexions_publiques_de` i `membres_i_entitats_connectades_de` responen 200 a anon; aplicada pel Mestre el 6-11) | connexions consentides, membres públics i sol·licituds només pendents (FEDI23) |
| 76 | `2611051930` | `2611051930_edicio_publicacions_editorials.sql` | Aplicada a producció (lectura REST del 6-11: la taula `note_folders` i les RPC `crea_carpeta_notes` i `admin_actualitza_publicacio_editorial` existixen, 401 42501; aplicada pel Mestre el 6-11) | edició editorial amb CAS (superadmin + aal2) i carpetes privades de Notes (R12) |
| 77 | `2611052345` | `2611052345_admin_usuaris_i_organitzacions.sql` | Aplicada a producció (lectura REST del 6-11: `admin_llista_usuaris_registrats`, `admin_convida_a_entitat`, `admin_connecta_usuari` i `les_meues_invitacions_admin` existixen, 401 42501; aplicada pel Mestre el 6-11) | perfils consentits amb correu emmascarat; invitació de membre amb acceptació pròpia, sense autoassignació ni escalada; auditoria immutable |
| 78 | `2611060010` | `2611060010_restauracio_municipal_opendata.sql` | Aplicada a producció (lectura REST del 6-11: `llegix_municipi_open_data_per_slug` respon 200 a anon; aplicada pel Mestre el 6-11) | upsert atòmic Open Data 1.2.0 per tenant, lectura pública fitada i conflictes globals; independent de la 77, no esborra dades absents |
| 79 | `2611061520` | `2611061520_politica_privacitat_2_5.sql` | Aplicada a producció (lectura REST del 6-11: `politiques_privacitat` té la 2.5, vigent des del 2026-11-05T23:00Z, amb l'empremta `ea13f0c4…` d'esta migració; aplicada pel Mestre el 6-11) | política 2.5: avisos push del xat, 2.3 i 2.4 intactes (Onada R9) |

| Artefacte complementari | Ruta dins de `supabase/` | Rol operatiu |
| :--- | :--- | :--- |
| Llavor opcional | `seed.sql` | Contingut inicial de demostració del portal |
| Snippet manual 1 | `snippets/2610181800_alinea_perfil_javi_llinares.sql` | Alineació puntual del perfil de la persona pilot (ús manual del Mestre) |
| Snippet manual 2 | `snippets/2610181800_publica_perfil_javi_llinares.sql` | Publicació puntual del perfil de la persona pilot (ús manual del Mestre) |
| Snippet manual 3 | `snippets/2611031750_oli_de_la_torre_preus_i_taula_mobil.sql` | Correccions F1/F4 als set productes d’Oli de La Torre: preu de la taula i cel·les llargues en mòbil; preparat, aplicació remota no acreditada |

### Contracte explícit d'exportació RGPD per a les taules de federació (`P2-09` · `D06/D07`)

Per a neutralitzar el risc `P2-09` (inferència per qualsevol columna `uuid` al bloc `federacio_no_versionada` d'`exporta_les_meues_dades()`), el mòdul `src/data/supabase/contracteExportacioFederacio.js` i l'adaptador `src/data/supabase/compte.js` imposen este contracte explícit de propietat i projecció de columnes en el navegador, abans que la resposta isca de l'adaptador i es mostre o es descarregue. El filtre del servidor és la 2610311900 i, damunt d'ella, el contracte v1 de la 2611011800 (`supabase/contracts/exportacio_federacio.v1.json`: una sola columna de propietat amb FK validada cap a un compte, i tipus per columna). La 2610311900 consta a la taula canònica amb l'estat remot no acreditat (l'acta 261101_0334 la dona aplicada), i la 2611011800, aplicada segons l'acta 261102_1456, sense lectura REST. Fins que el Pas 0 ho acredite, el client no compta amb el filtre del servidor: les files poden arribar al navegador abans del filtre. La taula següent és el contracte del client, més ample que el v1 del servidor (admet alternatives de propietat i més columnes): el que projecta el servidor v1 hi passa sencer, i la prova `src/data/supabase/exportacioFederacio.contracte.test.js` ho comprova:

| Recurs (`federacio_no_versionada`) | Columna canònica de propietat (`=== auth.uid()`) | Precedència admesa | Columnes UUID excloses d'inferència | Columnes exportades permeses |
| :--- | :--- | :--- | :--- | :--- |
| `realms` | `owner_user_id` | `owner_user_id`, `user_id` | `id`, `tenant_id`, `parent_realm_id`, `moderator_id`, `reviewed_by`, `invited_by`, `target_user_id`, `updated_by` | `id`, `tenant_id`, `slug`, `name`, `title`, `description`, `domain`, `protocol`, `visibility`, `status`, `owner_user_id`, `user_id`, `created_at`, `updated_at` |
| `user_realms` | `user_id` | `user_id` | `id`, `tenant_id`, `realm_id`, `invited_by`, `granted_by`, `approved_by`, `revoked_by`, `moderator_id` | `id`, `tenant_id`, `user_id`, `realm_id`, `role`, `status`, `handle`, `actor_uri`, `created_at`, `updated_at` |
| `connections` | `user_id` | `user_id`, `owner_user_id` | `id`, `tenant_id`, `realm_id`, `target_user_id`, `connected_user_id`, `peer_user_id`, `follower_id`, `following_id`, `invited_by`, `blocked_user_id` | `id`, `tenant_id`, `user_id`, `owner_user_id`, `realm_id`, `provider`, `remote_actor_uri`, `remote_handle`, `direction`, `status`, `created_at`, `updated_at` |
| `posts` | `author_id` | `author_id`, `owner_user_id`, `user_id` | `id`, `tenant_id`, `realm_id`, `reply_to_user_id`, `in_reply_to_user_id`, `reblogged_by_id`, `moderator_id`, `mentioned_user_id`, `deleted_by` | `id`, `tenant_id`, `author_id`, `owner_user_id`, `user_id`, `realm_id`, `title`, `content`, `summary`, `visibility`, `status`, `uri`, `url`, `published_at`, `created_at`, `updated_at` |

Consulta només de lectura perquè el Mestre audite l'esquema efectiu de federació al node remot:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('realms', 'user_realms', 'connections', 'posts')
ORDER BY table_name, ordinal_position;
```


### Candidates posteriors i números reservats (Lot 6)

La taula anterior agrupa 60 fitxers de R1, les quatre candidates 1500, 1800,
1900 i 2000, i les tres de l'assalt 261101 (2611011500, D-6; 2611011510,
P0-23; i 2611011800, P2-09), que no estaven aplicades quan es van integrar
(ara, vegeu la taula: lectura REST del 6-11-2026 o acta 261102_1456). És una fotografia d’inventari, **no un recompte fix del
 directori ni una acreditació d’aplicació remota**. Les migracions posteriors
han de documentar-se ací amb el nom complet abans d’integrar-les. La prova de
catàleg exigix cobertura de tots els fitxers presents i rebutja els desconeguts;
no exigix que les candidates encara no integrades existisquen en R1.

- Candidat Lot 6: `migrations/2610311900_exporta_dades_filtre_servidor_rgpd.sql`.
  Endurix al servidor la selecció i projecció de les taules de federació.
  Transaccional i idempotent. Estat remot no acreditat: l'acta 261101_0334 la
  dona aplicada (vegeu la taula canònica).
- `migrations/2610312000_e2ee_lot3_validadors_service_role.sql`: esmena de
  Claude al Lot 3 perquè `service_role` puga escriure `xat_fils`/`xat_missatges`
  amb les CHECK del 2610311800. Documentada a la llista; estat remot no
  acreditat: l'acta 261101_0334 la dona aplicada (vegeu la taula canònica).
- `2610311600`: era un bloc diagnòstic il·lustratiu del Kit 1 de Gemini,
  substituït per les sondes d’este README; **no és una migració independent**
  (confirmació del Mestre en Lot 6). No es compta com a fitxer SQL.

**Límit P2-09:** `realms`, `user_realms`, `connections` i `posts` no tenen
`CREATE TABLE` al repositori. Les columnes del contracte són variants admeses
 explícites, no l’esquema remot acreditat. Executeu l’inventari SQL de columnes,
contrasteu propietat, tipus i dades pròpies legítimes abans d’aplicar el candidat.
Un camp de propietat absent o no UUID produïx `SDP-FED-ESQUEMA-NO-ADMES`;
amb la 2611011800, també una columna de propietat sense una FK d'una sola
columna, validada, cap a `auth.users(id)` o `public.profiles(id)`, un `id`
que no siga `uuid`, una vista o una columna del contracte d'un altre tipus.
Una exportació amb este marcador està **incompleta**. El filtre JS és una
 defensa addicional: no substituïx el filtre SQL abans de travessar la xarxa.
La projecció de columnes no és una promesa de sanejament arbitrari de JSONB.

## Per què cal el pegat

`2609080100_xat_v2.sql` crea les taules bé, però el xat no arriba a funcionar. Tres
defectes estructurals, tots tancats pel pegat:

- **P0-A · Inserció circular de participants.** La política
  `xat_participants_insercio` avalua `(select creat_per from public.xat_fils
  where id = fil_id)` dins d'un `WITH CHECK`. Eixa subconsulta passa per RLS, i
  `xat_fils_lectura` exigix ser participant. Qui acaba de crear el fil encara no
  ho és → 0 files → `NULL` → `false OR NULL` = `NULL` → INSERT rebutjat. Ningú
  pot afegir mai el primer participant. El pegat trenca el cicle amb
  `private.es_creador_del_fil()`, `SECURITY DEFINER`, igual que `es_participant`.

- **P0-B · Els noms no es poden llegir.** `profiles read own` (a `schema.sql`)
  només deixa llegir el teu propi perfil, i `xat_missatges.usuari_id` apunta a
  `auth.users`, no a `public.profiles`: ni tan sols hi ha embed possible per
  PostgREST. El pegat **no obri `profiles`**; afig `xat_fils_meus()` i
  `xat_missatges_del_fil()`, que tornen només el nom de qui comparteix fil amb
  tu. Divulgació mínima, i per funció, no per política.

- **P0-C · No hi ha porta d'entrada.** `seed.sql` només omple l'antiga
  `chat_threads`. `xat_fils` naix buida. `crea_fil_directe()` és l'única manera
  d'obrir una conversa, i és idempotent: dues crides amb la mateixa persona
  tornen el mateix fil.

El pegat afig, a més, els índexs que faltaven, la columna `es_ia` (el frontend
llegia `msg.is_ai`, que no existia enlloc) i `xat_marca_llegit()`, perquè
l'`upsert` directe contra `/rest/v1/xat_lectures` no avançava mai la marca:
`ultim_llegit_al` no anava al cos de la petició i PostgREST només actualitza les
columnes que rep.

## El directori del poble

`membres_del_poble(p_tenant_id, p_cerca, p_limit)` i `perfil_public(p_id)`
(2610021520) són les dues úniques funcions del projecte que ensenyen dades
d'una altra persona; la segona, amb el mateix criteri de poble, i la fitxa
sencera només si la persona l'ha publicada. Convé tindre-ho escrit:

**Què obri:** el `full_name` i l'`id` dels membres del teu poble, i l'`id` del
fil directe si ja en teniu un.

**Què NO obri:** correu, data d'alta, rol, `visibility`, `consentiment_rgpd_at`
i qualsevol dada d'un poble del qual tu no sigues membre. Hi ha dues portes: la
funció llança `SDP-XAT-003` si no eres membre del poble que demanes, i mai
t'inclou a tu mateix al resultat.

**Per què cal:** `crea_fil_directe` necessita l'uuid de l'altra persona, i
`profiles read own` només deixa llegir el teu propi perfil. Sense això no es pot
escriure a ningú.

**Què cal decidir:** això és una cessió intracomunitària de dades i el text
legal actual diu que les dades personals «mai es comparteixen sense
consentiment». O es matisa el text, o s'activa el filtre per consentiment RGPD
que hi ha comentat dins del fitxer. Decisió del Mestre, no de la màquina.

## Baixa, purga i consentiment

`2609261500_identitat_perfil_f1.sql` deixa tres peces que no es completen
soles. Convé saber-ho abans d'obrir la baixa a ningú.

**La purga s'ha de programar.** `demana_baixa()` anonimitza el perfil al
moment i deixa el compte en quarantena (`dies_quarantena_baixa` de
`private.ajustos`, 30 per defecte). Qui esborra de veres, passada la
quarantena, és `private.purga_baixes_vencudes()`, i ningú la crida si no es
programa:

- Si `pg_cron` ja estava actiu quan es va aplicar la migració, la tasca
  `sdp-purga-baixes` ja existix (cada dia a les 03:17 UTC).
- Si no, la migració ho avisa amb `SDP-BAIXA-900` i cal fer-ho a mà. Activa
  `pg_cron` al panell (Database → Extensions) i executa, com a `postgres`:
  `select cron.schedule('sdp-purga-baixes', '17 3 * * *', $cron$select private.purga_baixes_vencudes(100)$cron$);`
  O programa eixa mateixa crida des del panell (Integrations → Cron).
- Sense purga programada, les baixes queden anonimitzades però el compte no
  s'esborra mai.
- Els errors de purga no la paren: queden a `private.baixes` (`intents`,
  `ultim_error`, `ultim_intent_al`). Cal verificar en staging que `postgres`
  pot esborrar d'`auth.users`; si no, cada intent hi deixarà l'error. Des de
  2610241440, el lot de cada dia va primer per les baixes que no han fallat
  mai i després per les que ja han fallat (primer la que fa més temps que ho
  va provar): una baixa que falla cada dia no ocupa el lloc de les altres.
- `private.purga_una_baixa()` torna a llegir i bloqueja la fila de
  `private.baixes` abans d'esborrar res (i torna `false` si ja no hi és o no
  ha vençut): una cancel·lació confirmada mentre la purga corre no acaba
  esborrant el compte. Només es compten les purgades de veres.

**La porta d'Apple** (2610241440, T8; la custòdia és de 2610241420, T1).
Si la persona té una autorització d'Apple custodiada
(`private.autoritzacions_apple`), la purga no esborra el compte mentre la
funció `compte-apple` no la revoque i n'esborre la fila. L'espera té sostre:
`dies_espera_revocacio_apple` dies (`private.ajustos`, 7 per defecte, de 0 a
30) després de la data prevista. Mentrestant, cada intent deixa
`SDP-BAIXA-030` a `private.baixes.ultim_error` i la resta del lot continua.
Passada l'espera, purga igualment i en deixa una fila `purga` /
`purgat_sense_revocar` a `private.revocacions_apple`, amb l'empremta i
l'últim error (mai l'uid): el compte no es pot retindre per sempre perquè
Apple o els secrets fallen. Consulta (lectura):
`select resultat, count(*) from private.revocacions_apple where origen = 'purga' group by 1;`.

**Què esborra la purga.** El compte (i, en cascada, el perfil, les
pertinences, els missatges i les lectures del xat, les incidències, la baixa
i els consentiments, que passen a bloqueig), les notes i, des de 2610241440,
també les publicacions personals (les que no signa cap entitat, de qualsevol
secció); abans es quedaven a l'uuid zero amb el títol, la descripció i el
cos. Les signades per una entitat que continua són de l'entitat i es queden.
Els fils de pàgina d'una publicació esborrada es queden amb els missatges
d'altres persones, però sense la còpia del títol: `titol` passa a
`'Publicació esborrada'` i `subjecte_titol`, `subjecte_ruta` i
`subjecte_uri`, a null. Decisions pendents del Mestre (custòdia legal): les
publicacions d'un grup que desapareix amb la persona (n'era l'única membre
que no estava de baixa) perden l'entitat per la clau forana i ara s'esborren
amb les personals; si cal esborrar sencers els fils de pàgina d'una
publicació esborrada; i què es fa amb les denúncies sobre ella, que es
conserven com a historial de moderació. Les publicacions que una
purga d'abans de 2610241440 ja havia passat a l'uuid zero no s'esborren
soles; quantes n'hi ha (lectura):
`select count(*) from public.section_submissions where owner_user_id = '00000000-0000-0000-0000-000000000000' and author_org_id is null;`.
Esborrar-les és decisió del Mestre.

**Els fitxers de Storage no s'esborren des de SQL.** La purga posa a la cua
`private.purga_storage_pendent` els fitxers de la carpeta de la persona, i
marca `referenciat = true` els que encara usa una entitat (logotip,
capçalera o una imatge del cos de la fitxa) o una publicació que es queda.
Es compara amb `<bucket>/<nom>`: la còpia pública d'un adjunt té el mateix
nom que l'original privat, i l'original no queda referenciat per ella. Les
publicacions personals s'esborren abans, i les imatges que només usaven elles
hi entren amb `referenciat = false`. La cua la buida la funció
`purga-fitxers` (vegeu «Funció `purga-fitxers`» al final): esborra per l'API
de Storage les files amb `referenciat = false` i `feta_al` null, amb
reintents, i lleva cada fila quan el seu objecte ja no és a
`storage.objects`. Fins que el Mestre la desplegue i la programe, els fitxers
de qui se'n va (i els adjunts del xat alliberats, que continuen comptant en la
quota) es queden al bucket.

**El consentiment és versionat.** `public.politiques_privacitat` guarda cada
versió del text legal. La `v1` heretada no té empremta perquè el text no es
va arxivar. Per a publicar-ne una de nova, el Mestre afig una fila amb
`versio`, `vigent_des_de` i `text_complet` (el CHECK exigix que `text_sha256`
en siga l'empremta SHA-256). Des d'eixe moment `estat_consentiment()` torna
`cal_reconsentir = true` a tothom fins que accepte la nova. Una versió amb
empremta ja no es pot modificar, i cap versió es pot esborrar.

**Altres coses a mirar de tant en tant:**
- `private.incidencies_alta`: altes que han entrat sense poble o amb algun
  pas fallit. Les repara `completa_la_meua_alta()` quan la persona torna.
- `private.consentiments_bloquejats`: l'evidència pseudonimitzada dels
  comptes esborrats. Es purga sola després de 3 anys.
- `membres_del_poble()` ja no mostra qui té una baixa en curs.
- La baixa també retira de `auth.users.raw_user_meta_data` el nom, la foto i
  la bio (`full_name`, `name`, `avatar_url`, `picture`, `bio`), que el client
  hi copia en desar el perfil; la cancel·lació els torna. Si el rol propietari
  no pot escriure a `auth.users`, la baixa continua igual i ho avisa amb
  `SDP-BAIXA-021` (o `SDP-BAIXA-022` en cancel·lar). Una entrada amb Google
  durant la quarantena les pot tornar a omplir: GoTrue les refresca a cada
  entrada OAuth.
- `profiles_bio_llargaria` (bio de 500 caràcters com a màxim, el límit del
  client) només es crea si cap bio antiga el trenca; si no, `SDP-PERFIL-001`.
- `organizations_logo_url_valida` (la regla de `hero_url` per a `logo_url`:
  res de `data:`, `javascript:` ni del bucket privat) igual: si alguna fila
  vella la trenca, no es posa i ho avisa `SDP-PERFIL-002`.
- La baixa també retira `searchText` de les publicacions personals (Connectar
  hi escriu el nom de l'autora); el client el torna a compondre sense el nom.

## Xat F0: seq, marques i RPC

`2609270200_xat_f0_fonament.sql` és additiva i idempotent, però el client i
l'esquema van junts: l'adaptador nou crida `xat_envia`, `xat_historial`,
`xat_nous`, `xat_marca` i la v2 de `xat_fils_meus`. Contra una base amb
l'esquema anterior el xat remot falla fins que s'aplique; i un client antic que
inserisca directament a `xat_missatges` deixa de poder-ho fer després
d'aplicar-la (és intencionat).

**Ordre d'aplicació.** Després de `2609261500_identitat_perfil_f1.sql` (usa
la clau forana `creat_per` amb `set null` i el patró de transacció). Una sola
transacció amb `lock_timeout` de 5 s i `statement_timeout` de 120 s: el
relleno del `seq` (`row_number()` per conversa) i la validació de les
restriccions de llargària poden tardar en converses grans. Si algun títol passa
de 100 caràcters o algun text de 4096, la restricció queda `not valid` i ho
avisa `SDP-XAT-901` o `SDP-XAT-902`; la migració no falla.

**Què canvia.**
- `xat_missatges.seq` (únic per `fil_id`) l'assigna el disparador
  `xat_missatges_seq` dins de la mateixa transacció; `xat_fils.ultim_seq` és el
  comptador. `text` ja admet `null` (làpides).
- `xat_participants` porta les marques (`llegit_fins_seq`, `rebut_fins_seq`,
  `buidat_fins_seq`), la finestra visible (`visible_des_de_seq`,
  `visible_fins_seq`: `null` = membre actiu) i els ajustos personals.
  `no_llegits = ultim_seq - greatest(llegit_fins_seq, buidat_fins_seq)`.
- `private.es_participant` exigix membre actiu. La lectura de `xat_missatges`
  passa per `private.seq_visible(fil_id, seq)` i exclou els caducats.
- `xat_lectures` es conserva en convivència: `xat_marca` i `xat_marca_llegit`
  l'escriuen també, i les seues polítiques exigixen ser participant del fil.
- `revoke insert on xat_missatges`: només `xat_envia` escriu. És idempotent per
  `id` (el client genera l'UUID abans d'enviar): el mateix `id` dos vegades es
  guarda una; un `id` d'una altra persona és `SDP-XAT-008`.
- `xat_historial(p_fil_id, p_abans_de_seq, p_limit)` torna `seq < cursor`, 50
  per defecte i 100 com a màxim, en ordre ascendent; `xat_nous(p_fil_id,
  p_despres_de_seq)` el que ha arribat després. Les dues tornen el text a la
  columna `cos` (com `xat_missatges_del_fil`, que es conserva).
- `xat_marca(p_fil_id, p_rebut_fins, p_llegit_fins)` amb `greatest()`: una
  marca no retrocedix; `null` = fins a l'últim missatge.
- `xat_fils_meus(p_tenant_id)` v2 (`drop` + `create`): afig `tipus`,
  `imatge_url`, `ultim_autor_id`, `ultim_seq`, les marques pròpies,
  `llegit_pels_altres_fins_seq` (mínim dels altres membres actius) i els
  ajustos personals. Les fixades van primer.

**Codis nous:** `SDP-XAT-006` (no eres membre actiu), `007` (missatge buit o
massa llarg), `008` (identificador d'una altra persona), `009` (cursor, límit o
paràmetre invàlid), `010` (tipus de missatge reservat al servidor o no admés
encara: en F0 el client només envia `text`). Cap error porta el text del
missatge.

**Pendent (no entra en esta migració).** La clau forana de l'autor dels
missatges continua `on delete cascade` (ARQ-J04: la purga d'una baixa esborra
els missatges propis de les converses dels altres); canviar-la necessita ordre
expressa. La política de lectura del canal privat entra en la migració
`2609291230` (vegeu «Realtime»).

## Entrada real i converses d’entitat (T16)

`/registre` mostra directament el formulari original. Entrar en eixa ruta des
de seed/local selecciona les dades remotes per a eixe node i recarrega una
vegada abans d’admetre credencials. No hi ha cap pantalla intermèdia. La
preferència i les sessions s’aïllen per backend, endpoint i poble; els comptes
i missatges de demostració no es convertixen en comptes remots. Una base de
dades buida és vàlida i no torna a poblar-se amb perfils o notes falses.

`2609272200_xat_entitats.sql` amplia el directori amb organitzacions reals
visibles. Cada persona té una conversa privada diferent amb l’entitat; només
els seus gestors vigents poden respondre. El servidor deriva l’autoria i
verifica poble, pertinença, revocacions, cita visible i idempotència; el client
usa el contracte neutral del port. Els participants interns revocats no es
mostren, i la persona interlocutora no rep el cens de gestors de l’entitat.
Les garanties d’autorització continuen en el servidor, independentment del
proveïdor que implemente el contracte.

La persona es registra amb el seu correu; després crea l’organització des del
perfil. El nom públic «Sóc de Poble» correspon a una entitat administrada, no
a un UUID seed ni a una contrasenya compartida. `2609272201_grups_mare.sql` fa que la RPC i la RLS rebutgen de forma coherent
un grup sense empresa mare administrada; entitats institucionals conserven els permisos
previs. Des de `2610081400_grups_sense_mare.sql` (ordre del Mestre, 261008)
la mare és opcional a les dues capes: si n'hi ha, s'ha de poder administrar.
La confirmació per correu i OAuth depenen de la configuració del node.

Prova local explícita: `node tests/integration/local-auth-chat.mjs`, amb Vite
en 3340, API Supabase en 54321 i Docker local. Rebutja qualsevol endpoint
extern. Crea dos comptes temporals, verifica login, directori, entitat,
enviament/reintent/recepció i retira només els UUID creats per la prova.
Les credencials no s’imprimixen ni es desen. La fixture SQL
`tests/fixtures/xat-entitats/regression.sql` comprova aïllament, RLS,
revocacions i autoria dins d’una transacció que acaba en rollback.

## Xat de pàgina i comunitats (T63.2, T67)

`2609282100_xat_de_pagina.sql` dona a cada Pàgina Universal comentable un fil
comú. Una entitat o un poble són una comunitat amb el canal «Avisos» i el grup
«General»; una publicació, un producte, un acte, un mitjà, un grup o una de les
pàgines de la llista tancada, un grup. Les notes, les carpetes, les persones i
la IA no en tenen (persona i IA continuen amb el missatge directe). El client
ho pregunta amb la capacitat opcional `xatDePagina` (`src/data/contracte.js`),
fora del nucli de 32 mètodes.

- **Pàgines amb xat.** Una `pagina` no té id propi i el servidor no pot saber
  quines rutes de l'SPA existixen ni si són públiques: només en tenen les de
  `PAGINES_AMB_XAT` (`src/data/contracte.js`), les pàgines públiques de
  `SECTION_ORDER` sense el Xat ni les Notes, amb el seu nom com a títol. La
  mateixa llista viu a `private.xat_subjecte`, i
  `tests/migracio-xat-de-pagina.test.mjs` les contrasta. Pendent del Mestre
  (pregunta 4 del mapa T63-T67): quines pàgines en tenen.
- `obri_fil_de_pagina(p_tenant_id, p_tipus, p_id, p_titol)` valida que el
  subjecte existix i el pots vore (`private.xat_subjecte`), troba o crea el fil
  sota un bloqueig per subjecte i **no et fa participant**. Obrir no deixa
  rastre (`creat_per` null). Els gestors vigents de l'entitat entren a la
  comunitat i als Avisos, on signen com ella. La ruta i el títol del subjecte
  són del servidor (la ruta amb el format de `rutaDeSubjecte`); `p_titol` només
  titula el fil d'un contingut sense títol propi. Un fil que ja existia pren la
  URI i el títol del subjecte d'ara.
- `xat_llig_fil_de_pagina(p_fil_id, p_abans_de_seq, p_despres_de_seq, p_limit)`
  llig sense ser-ne participant: llegir no et publica. Un missatge signat per
  l'entitat hi torna sense `usuari_id`.
- `xat_entra_al_fil_de_pagina(p_fil_id)` és l'alta, idempotent, que el client
  fa just abans del primer missatge (en un General, també a la comunitat i als
  Avisos).
- El disparador `xat_missatges_canal` rebutja qualsevol missatge a una
  comunitat i als Avisos de qui no n'és administrador.
- `xat_fils_meus` v4 torna `comunitat_id`, el subjecte, el rol propi i quantes
  persones participen; un fil de pàgina no llista les persones.
- `private.xat_pot_veure_participant`: en un fil de pàgina, cada participant
  només veu la seua fila de `xat_participants` (ni les persones ni els seus
  ajustos), també per PostgREST directe.
- `private.xat_participant_vigent`: en el fil d'una entitat o d'un grup, qui
  hi participa perd l'accés (llegir, escriure, llista i marques) si
  l'organització deixa de ser visible per a ell o s'esborra.
- `private.purga_una_baixa` ja no esborra els fils de pàgina sense
  participants: naixen així, i esborrar-los canviaria els ids que els
  visitants tenen oberts.
- La URI canònica (`subjecte_uri`, per al Fedivers) només s'omple si
  `private.ajustos` té la clau `url_publica_node` (una URL `https://`); la
  migració no la posa.

**Deutes declarats.** Qui ja participa en el fil d'un contingut esborrat el
continua llegint (només l'organització es torna a comprovar). `xat_historial`,
`xat_nous` i la lectura directa de `xat_missatges` tornen l'`usuari_id` dels
missatges signats per l'entitat, com als fils d'entitat des de 2609272200.

**Codis nous:** `SDP-XAT-011` (només escriuen els administradors),
`SDP-XAT-012` (este subjecte no té xat) i `SDP-XAT-013` (la pàgina no existix o
no la pots vore).

**Condició abans d'obrir-ho a tot el poble.** No hi ha cap moderació: ni amagar
missatges d'altri, ni expulsar, ni tancar el fil, ni denunciar; només el límit
de freqüència. Tampoc no hi ha «eixir del fil» ni administració dels Avisos
d'un poble (sense administrador, són de només lectura). La moderació mínima,
per RPC, ha d'existir abans que els fils de pàgina s'obrin a tot el poble.

## Realtime

Les taules del xat **no** estan a la publicació `supabase_realtime`, a propòsit.
Mentre no hi estiguen, qualsevol subscripció per `postgres_changes` es connecta,
no dóna cap error i no rep res mai: el pitjor mode de fallada possible.

Des de `260927_0200`, el disparador `xat_missatges_avisa` emet un avís pel canal
privat `xat:f:<fil_id>` amb `realtime.send` (només `{ filId, seq }`: el client
demana les dades amb `xat_nous`). L'enviament està embolicat en
`exception when others`: si la funció no existix o el canal no té política,
l'avís es perd en silenci i el missatge es guarda igual. Perquè el client puga
subscriure's, aplica `2609291230_xat_realtime_lectura.sql` (ARQ-D02).
La política SELECT restringix `broadcast` a `xat:f:<uuid>` i comprova
`private.es_participant`; qualsevol tercer o tema malformat queda fora.
No hi ha política INSERT per als clients. La migració aborta si RLS no està
actiu. La porta R1 reconeix exclusivament `realtime.messages` com a taula
gestionada pel servei; R3 continua rebutjant polítiques `using (true)`.
El sondeig adaptatiu (`XatContext.jsx`) continua disponible si cau la connexió.

En el servei local comprovat el 2026-09-29, la clau fictícia
`sb_publishable_…` era admesa per REST però el WebSocket la rebutjava amb
`MalformedJWT`. `.env.local` ha d'usar la clau pública **anon** emesa per la
instància local, mai `service_role`. El procés de Vite ha de recarregar eixa
configuració. No és una credencial de Google OAuth: el botó de Google local
mostra l'alternativa de correu i contrasenya a través de l'adaptador.

`node tests/integration/local-auth-chat.mjs` comprova contra localhost el
registre, el login, la cerca amb accents, els missatges personals i d'entitat,
els avisos privats, la denegació a tercers i la baixa/restauració. Crea tres
comptes temporals i els retira en `finally`; no admet una URL remota.

## Notes

- `app_content` queda en lectura pública, però no en escriptura pública.
- `section_submissions` guarda les publicacions creades des de `Connectar` i
  després es fusiona amb `mur`, `mercat` o `events`.
- Les taules `chat_threads` i `chat_messages` són una **làpida**: el frontend ja
  no les usa. Es mantenen perquè `seed.sql` encara les omple i per compatibilitat de dades antigues. `loadAppData()` accepta una base buida i
  no fusiona converses o notes seed amb dades remotes.
- El frontend admet `VITE_DATA_MODE=remote|seed|local`; qualsevol altre valor, o cap, és `remote` (`src/config/dataMode.js`).
- Regenerar el SQL de dades seed és una mutació governada i requerix el segell
  criptogràfic de `canonada.mjs`.

## Vincles

- [[00_index]]

## Funció `compte-apple` (revocació d'Apple)

T1 (261024; P0-04, App Store Review Guideline 5.1.1(v), Apple TN3194;
auditoria Codex 261024_1315 C-01). Una Edge Function de Supabase:
`supabase/functions/compte-apple/index.ts` (l'embolcall Deno, dues línies),
`supabase/functions/compte-apple/gestor.js` (la lògica, provada a
`gestor.test.js`) i `supabase/functions/_shared/apple.js` (el protocol
d'Apple, provat a `apple.test.js`; una carpeta que comença per `_` no es
desplega sola). No hi ha `supabase/config.toml` a posta. Necessita
`migrations/2610241420_revocacio_apple.sql` aplicada.

Què fa, i en quin ordre:

1. **Custòdia.** Quan algú entra amb Apple a l'iPhone, l'app envia el codi
   d'autorització d'un sol ús (dura uns cinc minuts) a
   `POST /functions/v1/compte-apple` amb `{ "accio": "custodia", "codi": … }`
   i la seua sessió; mai a GoTrue. La funció comprova la sessió amb
   `/auth/v1/user`, canvia el codi a Apple amb un client secret ES256 de cinc
   minuts, comprova que l'`id_token` és d'Apple, per al nostre client i del
   mateix subjecte que la identitat d'Apple de la sessió (vincle A/B; la RPC
   ho torna a comprovar a `auth.identities`), xifra el refresh token i el desa.
   Si falla (sense xarxa, la funció sense desplegar), l'entrada no falla: no
   hi haurà res a revocar. Com que la revocació va ABANS de `demana_baixa`,
   la primera baixa d'eixa persona no deixa cap `sense_testimoni` (no s'ha
   revocat res); si la torna a demanar amb la baixa ja feta, se n'anota un,
   com a molt un cada 24 hores.
2. **Baixa.** Just abans de `demana_baixa`, que esborra les sessions, el
   client crida `{ "accio": "revoca" }` (de millor esforç, 10 s) amb el
   testimoni de la sessió que ha passat la comprovació, i només si eixa
   persona té Apple: primer Apple i després `apple_registra_revocacio`. Si
   la sessió canvia entremig, no s'envia res. Si no arriba, la baixa
   continua igual i ho fa el buidatge.
3. **Buidatge, cada hora.** `{ "accio": "buida" }` amb la capçalera
   `x-sdp-cron` revoca els pendents de les baixes: els desats abans de
   demanar-la i, quan falta un dia per a la purga, també els d'una entrada
   nova durant la quarantena (si la persona cancel·la la baixa, no se li
   revoca res). Una fallida espera mitja hora; 50 pendents per crida, primer
   els que no s'han provat mai i després els provats fa més temps. Cada
   testimoni es revoca amb el `client_id` amb què es va desar (el client
   secret es fa per a eixe client). Un error d'una sola fila (un xifrat que
   no es desxifra, un 400 d'un testimoni, un `client_id` d'abans) queda com
   a fallida d'eixa fila i el lot continua.
4. **Porta de la purga** (2610241440, T8). `private.purga_una_baixa` no
   esborra `auth.users` mentre quede una fila a `private.autoritzacions_apple`,
   com a molt `dies_espera_revocacio_apple` dies (7) passada la purga
   prevista; després purga i ho registra com a `purgat_sense_revocar`. Cap
   retenció indefinida.

Secrets. Els posa el Mestre amb `supabase secrets set … --project-ref <ref>`;
mai en cap `.env`, cap `VITE_*`, cap xat ni cap commit:

- `APPLE_TEAM_ID` · l'equip de desenvolupament (`9KNUA4JR8P`).
- `APPLE_KEY_ID` · els 10 caràcters de la clau de Sign in with Apple.
- `APPLE_CLIENT_ID` · el bundle `org.socdepoble.app` (no hi ha cap Services ID web).
- `APPLE_PRIVATE_KEY` · el contingut de la `.p8`.
- `APPLE_TESTIMONIS_CLAU` · 32 bytes aleatoris en base64 (`openssl rand -base64 32`).
  Si es perd o es canvia, els testimonis desats ja no es poden desxifrar ni
  revocar (acaben en `purgat_sense_revocar`): guardeu-la al gestor de
  contrasenyes. La rotació és una decisió del Mestre.
- `SDP_CRON_SECRET` · 32 caràcters com a mínim (`openssl rand -hex 32`); només
  el coneix el buidatge.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` i `SUPABASE_SERVICE_ROLE_KEY` els
  injecta Supabase (la clau nova `sb_secret_…` també val).

La clau `.p8`: Apple Developer → Certificates, IDs & Profiles → Keys → + →
Sign in with Apple → Configure (Primary App ID `org.socdepoble.app`) →
Download. Només es pot descarregar una vegada: guardeu-la fora del
repositori (`*.p8` ja és a `.gitignore`, però no ha d'entrar mai a l'arbre)
i carregueu-la directament des d'eixa ruta:

```
supabase secrets set APPLE_PRIVATE_KEY="$(cat /ruta/fora/del/repositori/AuthKey_XXXXXXXXXX.p8)" --project-ref <ref>
```

Desplegament (cal la sessió de la CLI; la funció autoritza ella mateixa cada
acció: la sessió amb `/auth/v1/user`, el buidatge amb `x-sdp-cron`):

```
supabase functions deploy compte-apple --no-verify-jwt --project-ref <ref>
```

L'ordre: 2610241420 aplicada → secrets → desplegament → buidatge programat →
client publicat. A Supabase Auth, el proveïdor Apple ha d'estar actiu amb
Client IDs = `org.socdepoble.app`.

El buidatge de cada hora: Integrations → Cron → Create job → Supabase Edge
Function `compte-apple`, mètode POST, horari `7 * * * *` (al minut 7, abans
de `sdp-purga-baixes` de les 03:17), capçalera `x-sdp-cron: <SDP_CRON_SECRET>`
i cos `{"accio":"buida"}`. L'alternativa és pg_cron amb pg_net i el secret a
Vault, mai dins d'una migració. Un `503 config` vol dir secrets dolents
(la clau `.p8`, la clau dels testimonis, o `invalid_client` del client
configurat) i para el lot. Verificació (lectura):
`select jobname, schedule from cron.job;` i
`select origen, resultat, count(*) from private.revocacions_apple group by 1, 2;`.

Revocació manual de qui va entrar amb Apple abans de la custòdia (TestFlight
i proves): no hi ha cap testimoni ni res a revocar, i la primera baixa no
deixa cap fila a `private.revocacions_apple`.
Qui són (lectura, com a `postgres`):

```
select i.user_id from auth.identities i where i.provider = 'apple' and not exists (select 1 from private.autoritzacions_apple a where a.user_id = i.user_id);
```

Dos camins: que entren una vegada amb Apple després del desplegament (la
custòdia desa el testimoni i la baixa ja el revoca), o que retiren el permís
ells mateixos des de l'iPhone (Configuració › el seu nom › Inici de sessió i
seguretat › Inici de sessió amb Apple › Sóc de Poble; el nom exacte canvia
amb la versió d'iOS) o des d'account.apple.com. La purga no els espera: sense
fila custodiada no hi ha porta.

Regla: mai esborreu un usuari d'Apple des del tauler (Authentication → Users
→ Delete). La cascada s'emporta la fila custodiada sense revocar res a Apple.
Una baixa passa sempre per `demana_baixa` i la purga.

## Funció `purga-fitxers` (cua de fitxers de la baixa)

T8 (261024; P0-20; auditoria Codex 261024_1315 C-06). Buida
`private.purga_storage_pendent`, la cua que omplin la purga d'una baixa i la
neteja dels adjunts del xat (`private.xat_neteja_adjunts`, 2610220240).
Fitxers: `supabase/functions/purga-fitxers/index.ts` (l'embolcall Deno, que
només li passa tres variables) i `supabase/functions/purga-fitxers/gestor.js`
(la lògica, provada a `gestor.test.js`). Necessita
`migrations/2610241440_baixa_completa_ugc_i_fitxers.sql` aplicada.

Què fa cada passada (un POST amb la capçalera `x-sdp-cron`):

1. Reclama un lot de 50 files amb `purga_fitxers_reclama` (`FOR UPDATE SKIP
   LOCKED`; només `referenciat = false`, `feta_al` null i per davall del
   sostre d'intents). Reclamar suma l'intent i en fixa l'hora: eixa és la
   reserva, i dos passades alhora no es reparteixen mai la mateixa fila.
2. Per a cada bucket, `DELETE /storage/v1/object/<bucket>` amb
   `{"prefixes": [...]}` (100 noms per petició; el mateix cos que el
   `remove()` de storage-js) i la clau de servei.
3. Si Storage respon 2xx, o 404 (no hi havia res a esborrar),
   `purga_fitxers_fets` lleva les files l'objecte de les quals ja no és a
   `storage.objects`; una que hi continua es queda amb `SDP-PURGA-002`. Si
   no, `purga_fitxers_fallits` hi anota l'error (`storage <estat>`, `xarxa` o
   `temps`), mai el nom.
4. Torna a reclamar fins que la cua es buida, 20 lots o 50 s de pressupost
   (8 s de topall per petició; no comença res que no hi càpia). Respon
   `{ok, fets, fallits, pendents, sense_provar, lots, esgotat}`: només
   recomptes, i el registre igual. Cap nom d'objecte ix de la funció.

Reintents. Una fila reclamada no torna fins que passa l'espera exponencial:
10 minuts després del primer intent, el doble a cada intent i un dia com a
molt, també si la passada cau a mitges (l'esborrat es pot repetir). Al sostre
`purga_fitxers_max_intents` (`private.ajustos`, 10 per defecte, d'1 a 100) la
fila ja no es reclama: es revisa a mà. Les files amb `referenciat = true` (les
usa una entitat o una publicació que es queda) i les que porten `feta_al`
(marques a mà d'abans del worker) no es reclamen mai.

Secrets. `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` els injecta Supabase (la
clau nova `sb_secret_…` també val: llavors només va a `apikey`).
`SDP_CRON_SECRET` és el mateix de `compte-apple` (32 caràcters com a mínim,
`openssl rand -hex 32`): si ja hi és, no cal tornar-lo a posar. Sense un dels
tres, la funció respon `503 config` i no fa res; sense la capçalera bona,
`401`.

Desplegament (la funció autoritza ella mateixa amb `x-sdp-cron`):

```
supabase functions deploy purga-fitxers --no-verify-jwt --project-ref <ref>
```

L'ordre: 2610241440 aplicada → secret → desplegament → programació.

Programació: Integrations → Cron → Create job → Supabase Edge Function
`purga-fitxers`, mètode POST, horari `47 * * * *` (cada hora al minut 47: la
primera passada després de `sdp-purga-baixes`, de les 03:17 UTC, és la de les
03:47, i els adjunts del xat que allibera `sdp-neteja-xat-adjunts`, al minut
23, deixen de comptar en la quota abans d'una hora), capçalera
`x-sdp-cron: <SDP_CRON_SECRET>`, cos `{}` i un temps d'espera de 60 s com a
mínim. L'alternativa és pg_cron amb pg_net i el secret a Vault, mai dins
d'una migració. Verificació (lectura): `select jobname, schedule from cron.job;`.

Les files encallades (lectura, com a `postgres`; els recomptes no ensenyen
cap nom):

```
select bucket_id, intents, ultim_error, count(*) from private.purga_storage_pendent where not referenciat and feta_al is null group by 1, 2, 3 order by 2 desc;
```

`SDP-PURGA-002` vol dir que Storage ha dit que sí però l'objecte encara hi és;
`storage 401` o `storage 403`, la clau de servei; `temps` o `xarxa`, Storage
lent o caigut. Per a tornar a provar una fila arribada al sostre, quan la
causa ja estiga resolta:

```
update private.purga_storage_pendent set intents = 0, ultim_error = null, ultim_intent_al = null where id = <id>;
```

Límits coneguts: un fitxer `referenciat = true` es queda encara que l'entitat
el deixe d'usar més avant (la marca es fixa en purgar); si storage-api lleva
la fila de `storage.objects` i després li falla el binari al backend (l'ordre
intern de storage-api, no verificat ací), eixe residu ja no el veu cap fila de
la cua; les còpies de seguretat del proveïdor seguixen el seu cicle de 30
dies.

## Funció `notifica-xat` (avisos push del Xat)

B8 (marató 261101_2143; ordre del Mestre 261101). Desperta els aparells dels
membres d'un fil quan hi arriba un missatge: un **despertador cec**. El web
rep un push sense cos (`public/sw.js` mostra sempre «Tens missatges nous») i
els natius, el mateix text en la llengua de l'aparell amb `desti: '/xat'`.
Cap fil, remitent ni text del missatge no ix mai cap a cap servei de push.
Fitxers: `supabase/functions/notifica-xat/index.ts` (l'embolcall Deno, que
només li passa les variables de baix), `gestor.js`, `webpush.js` i
`natius.js` (la lògica, provada a `gestor.test.js`, `webpush.test.js`,
`natius.test.js` i `paritat.test.js`). Necessita
`migrations/2611020417_xat_avisos_push.sql` aplicada.

Què fa cada passada (un POST amb la capçalera `x-sdp-cron`):

1. Sense `SDP_PUSH_ACTIU=si`, només crida `xat_push_neteja` (cap servei de
   push) i respon `{ok: true, apagat: true, neteja: {…}}`; si la base falla,
   `502`.
2. `xat_push_neteja`: aparells caducats o sense renovar en 60 dies, i la cua
   de més d'una hora (el disparador ja la poda sol: com a molt 100 files per
   missatge, també amb els avisos apagats).
3. `xat_push_reclama` (50 missatges, `FOR UPDATE SKIP LOCKED`, s'esborren en
   reclamar-los: com a molt una vegada): els aparells dels destinataris (els
   filtres són a la vinyeta de la migració), un per lot, com a molt 5.000 en
   ordre aleatori i 1.800.000 octets de JSON, perquè la funció llig com a
   molt 2 MiB de la base i el lot ja és esborrat (`retallats` diu quants
   s'han quedat fora).
4. Web Push amb VAPID (ES256, WebCrypto), sense cos: `TTL: 86400`,
   `Urgency: normal`, `Topic: sdp-xat`. APNs i FCM, si tenen secrets, amb el
   text literal en la llengua de l'aparell.
5. Només s'expulsa amb web 404 i 410, APNs 410 i FCM 404 `UNREGISTERED`
   (`xat_push_expulsa`). Web 401 i 403, APNs `BadDeviceToken` o
   `DeviceTokenNotForTopic` i FCM `SENDER_ID_MISMATCH` o
   `THIRD_PARTY_AUTH_ERROR` es compten per aparell: mai expulsen ni pausen
   el proveïdor, perquè una sola persona els pot provocar (G1-B-seg-01).
   Només pausa el proveïdor la credencial pròpia (la signatura VAPID, APNs
   403, FCM 401 o 403 sense codi d'aparell). Un 429 pausa l'amfitrió web o
   el proveïdor natiu, excepte el `TooManyRequests` d'Apple (APNs i Web Push
   d'Apple: massa avisos seguits a un sol aparell), que només salta eixe
   aparell la resta de la passada.
6. Com a molt 10 lots, 45 s, 8 peticions alhora i 8 s per petició. Respon
   només recomptes: `{ok, missatges, retallats, dispositius, enviats,
   expulsats, fallits, sense_proveidor, sense_provar, lots, esgotat}`.

Panys (tot apagat per defecte): `private.ajustos` `push_xat_actiu` = `si`
(sense, la cua no creix i desar dona `SDP-PUSH-010`), `SDP_PUSH_ACTIU=si` a la
funció i la bandera del client. Són independents per a enviar, no per a la
retenció: en cap combinació la cua guarda més d'una hora.

Secrets. `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` els injecta Supabase.
`SDP_CRON_SECRET` és el mateix de `compte-apple` i `purga-fitxers`.
`SDP_PUSH_VAPID_PUBLICA` (87 caràcters base64url; la mateixa que
`VITE_PUSH_VAPID_PUBLICA` del client), `SDP_PUSH_VAPID_PRIVADA` (43) i
`SDP_PUSH_VAPID_SUBJECTE` (`mailto:` o `https://`). Natius, només quan hi haja
el connector (D-WP-7): `SDP_APNS_EQUIP`, `SDP_APNS_CLAU_ID`,
`SDP_APNS_CLAU_P8`, `SDP_APNS_TOPIC` (`org.socdepoble.app` per defecte),
`SDP_APNS_ENTORN` (`produccio` per defecte; `sandbox` només en un projecte de
proves) i `SDP_FCM_COMPTE_SERVEI` (el JSON del compte de servei del mateix
projecte de Firebase que `google-services.json`). Sense VAPID, els aparells
web no es desperten (`sense_proveidor`) i no s'esborren. El parell VAPID es fa
a la màquina del Mestre, mai al repositori ni amb cap paquet (Node 20 o més):

```
node -e "const s=crypto.subtle;s.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign']).then(async(k)=>{const j=await s.exportKey('jwk',k.privateKey);const r=Buffer.from(await s.exportKey('raw',k.publicKey)).toString('base64url');console.log('SDP_PUSH_VAPID_PUBLICA='+r);console.log('SDP_PUSH_VAPID_PRIVADA='+j.d)})"
```

Desplegament (la funció autoritza ella mateixa amb `x-sdp-cron`):

```
supabase functions deploy notifica-xat --no-verify-jwt --project-ref <ref>
```

L'ordre: política de privacitat 2.4 amb els serveis de push com a
destinataris (D-B8S-8) → migració → secrets
(`supabase secrets set SDP_PUSH_ACTIU=si SDP_PUSH_VAPID_PUBLICA=<…> SDP_PUSH_VAPID_PRIVADA=<…> SDP_PUSH_VAPID_SUBJECTE=mailto:<correu> --project-ref <ref>`)
→ desplegament → cron → client amb la mateixa pública → per últim, la base:

```
insert into private.ajustos (clau, valor) values ('push_xat_actiu', 'si') on conflict (clau) do update set valor = excluded.valor;
```

Per a apagar, al revés: primer l'ajust, i buidar la cua (no queda cap
metadada); després, si cal, `supabase secrets unset SDP_PUSH_ACTIU` i esborrar
el cron:

```
delete from private.ajustos where clau = 'push_xat_actiu';
delete from private.xat_push_cua;
```

Programació: Integrations → Cron → Create job → Supabase Edge Function
`notifica-xat`, POST, horari `15 seconds`, capçalera
`x-sdp-cron: <SDP_CRON_SECRET>`, cos `{}` i un temps d'espera de 60 s.
Verificació (lectura): `select jobname, schedule from cron.job;`.

Lectura per al Mestre (cap adreça):

```
select tipus, llengua, count(*) from public.xat_dispositius_push group by 1, 2;
select count(*), min(creat_al) from private.xat_push_cua;
```

Límits coneguts: com a molt una vegada (un avís perdut si el worker cau a
mitges); APNs exigix HTTP/2 (cal provar-lo en sandbox, en un projecte de
proves, abans d'encendre iOS); el General i els Avisos de comunitat i de
pàgina no avisen si `push_xat_generals` no és `si`; els aparells no entren a
`exporta_les_meues_dades` (D-B8S-7: la persona els llig per RLS i la purga
se'ls emporta).

## Funció `noticies` (lector territorial)

T5 (261024; P1-07, auditoria Gemini 261024_1315 G-03), T5b (ordre del
Mestre, 261024), la passada del Lector de 261024 (troballes R5, D-08 de
Codex i G2-03 de Gemini) i la passada final del Lector (troballes R6 del
servei, 261024). El servei de notícies del poble per a
`/app/lector`: llig els feeds RSS i Atom de les fonts del Lector, i les seues
imatges, perquè el navegador del veí no toque mai l'origen d'una font. Les
fonts del sistema són EXACTAMENT els referents de coneixement obert del §23
del text legal (Emowe, AyudaWP, IA en Acción, Jon Hernández i els canals de
vídeo de Migue Baena i Ben Cord); les deu territorials del T5 ja no són
actives i queden documentades com a candidates a
`src/data/adaptadors/noticies/README.md`. La persona les pot apagar una per
una (el Lector ja no les demana). Les fonts personals (adreces que afig la
persona) també les pot llegir este servei, però estan **apagades per
defecte**. Una Edge Function de Supabase:
`supabase/functions/noticies/index.ts` (l'embolcall de `Deno.serve`),
`supabase/functions/noticies/gestor.js` (la lògica, pura i provada a
`gestor.test.js`) i `supabase/functions/noticies/fonts.json` (la llista
blanca). `paritat.test.js` vigila que `fonts.json` diga el mateix que el
catàleg del frontend, `src/data/adaptadors/noticies/cataleg.js`, id per id i
adreça per adreça. Cap migració, cap taula i cap secret. Tres variables, cap
secreta: `SDP_NOTICIES_PERSONALS` (només `'1'` encén les fonts personals;
sense valor, o un altre, apagades), `SDP_NOTICIES_IMATGES_EXTERNES` (R6
L-12: només `'1'` encén les imatges de hosts de fora del catàleg; sense
valor, o un altre, apagades) i `SUPABASE_URL` (la posa la plataforma; només
se'n pren el host, que cap adreça de fora no pot demanar).

El contracte (`sdp.noticies.v1`, detallat a
`src/data/adaptadors/noticies/README.md`):

- `GET /functions/v1/noticies/fonts` → `{ categories, fonts, personals }`,
  sense les adreces dels feeds; `personals` és cert només amb
  `SDP_NOTICIES_PERSONALS=1` i un resoledor de noms a l'entorn. El client
  guarda tota la sessió de pàgina una resposta definitiva (un 200 del
  contracte, o un 404 que no és del servei: la funció no hi és, i el Lector
  no demana cap feed més); una de passada (la xarxa que no arriba, 5xx, 429,
  temps), només 30–60 s, i després torna a preguntar (R6 L-01: una fallada de
  passada ja no apaga el Lector tota la sessió). Com a molt una petició
  fallida per ronda, no sis. Si diu `personals: false`, el navegador no envia
  cap adreça personal.
- `GET /functions/v1/noticies/feed?font=<id>` → `{ font, xml, obtingut,
  obsoleta }`, el feed en UTF-8.
- `GET /functions/v1/noticies/feed?url=<adreça https>` → `{ url, xml,
  obtingut, obsoleta }`, una font personal (`Cache-Control: private,
  max-age=300`; `obtingut` és l'hora de la petició).
- `GET /functions/v1/noticies/imatge?u=<adreça https>` → els bytes d'una
  imatge d'un host del catàleg o dels seus CDN (`CDN_IMATGES`), o, amb
  `SDP_NOTICIES_IMATGES_EXTERNES=1`, d'un altre host si ha eixit en un feed
  que la instància ha baixat les últimes 24 h (`Cache-Control: public,
  max-age=86400`, cap galeta).
- Error → `{ code: 'sdp_noticies_<codi>', message, data: { status } }`:
  `font_desconeguda`, `ruta` i `imatge_desconeguda` 404, `peticio` 400
  (també `url` amb les personals apagades), `metode` 405, `adreca_vetada`
  422, `limit` i `ocupat` 429 (amb `Retry-After`), `origen_temps` 504,
  `origen_buit` 504 (R6 L-06: un 304 a una petició sense condicions; el
  Lector hi diu «temps», mai «font»), `origen_caigut`, `origen_format` i
  `origen_mida` 502, `personals_sense_dns` i `imatge_sense_dns` 503,
  `imatge_de_fora` 403 (R6 L-12), `intern` 500. L'adreça demanada no torna
  mai en un error.

Les regles de les fonts del sistema: l'únic que entra és l'id d'una font de
`fonts.json` (cap adreça de la consulta); a l'origen, GET amb l'agent honest
`SocDePoble/1.0 (+https://socdepoble.org/projecte)`, 6 s, com a molt 2
redireccions dins del mateix host i en https, i 2 MiB; el text passa a UTF-8
(el BOM primer, després la capçalera i el pròleg; també ISO-8859-1 i
windows-1252) i l'arrel ha de ser `rss`, `feed` o `RDF`, sense cap
`<!ENTITY>`; memòria cau de la instància, fresca 15 min i de reserva fins a
24 h (`obsoleta: true`); `Cache-Control: public, max-age=300`; CORS `*` sense
credencials. La memòria i els límits són de cada instància: si la plataforma
n'arranca diverses, cadascuna porta els seus.

El límit per connexió: la connexió és `cf-connecting-ip`; si no, l'ÚLTIM salt
de `x-forwarded-for` (el que posa el proxy de la plataforma; el primer el pot
escriure qualsevol); si no, l'adreça remota; una IPv6 compta per la seua /64.
120 peticions cada 10 min per a `/fonts` i `/feed`, 60 per a les personals (a
banda) i 600 per a les imatges (a banda). R6 L-05: amb la taula mig plena
(2500 de 5000 finestres), una IPv6 compta per la seua /48; amb la taula
plena, una connexió nova fa lloc traient la finestra viva menys gastada (mai
una que ja és al límit), i només espera (429) si totes ho són. Abans, una
sola /48 que omplia la taula deixava fora tots els visitants nous 10 min.
No es guarda cap IP: només una empremta HMAC-SHA-256 amb una clau aleatòria
de la instància (naix i mor amb ella; no es pot exportar), i les finestres
vençudes s'esborren a cada petició.

Les regles de les fonts personals (`?url=`, contra el SSRF; totes a
`gestor.js` i provades una per una a `gestor.test.js`): APAGADES si
`SDP_NOTICIES_PERSONALS` no és `'1'`; enceses però sense `Deno.resolveDns`,
tancades (503 `personals_sense_dns`; mai «sense resoledor, és pública»);
només `https:`, port buit (443), cap usuari ni contrasenya, com a molt 2048
caràcters, sense fragment; el host ha de ser un nom DNS amb un punt, mai una
IP literal (el parser WHATWG normalitza `2130706433`, `0x7f000001` o
`0177.0.0.1` a quatre xifres, que no passen; `[::1]` porta claudàtors) ni un
nom local (`localhost`, `*.localhost`, `*.local`, `*.internal`, `*.arpa` amb
`*.home.arpa`, `*.localdomain`, `*.lan`…), ni el host del projecte ni el de
la petició; el nom es resol (A i AAAA) i cap resposta pot ser privada, de
bucle, d'enllaç local (169.254/16, amb 169.254.169.254), CGNAT (100.64/10),
ULA (`fc00::/7`), `fe80::/10`, `::1`, 0.0.0.0/8, de documentació, de
traducció (`64:ff9b:1::/48`, `::ffff:0:0:0/96`) ni de protocol
(`2001::/23`) (si no es pot resoldre, no es baixa res); cada redirecció
(manual, com a molt 2) torna a passar-ho tot; els mateixos 6 s (la resolució
inclosa), arrel de feed, agent honest i cap galeta, però 512 KiB; com a molt
4 baixades personals alhora en tota la instància i 1 per connexió (429
`ocupat`); memòria cau per connexió i adreça normalitzada (una connexió no
rep mai la còpia d'una altra), fitada (64 entrades, 16 M caràcters, 24 h).

Les regles de les imatges (`?u=`; R6, passada final): d'un host aprovat (el
del feed de cada font del catàleg i els CDN de `CDN_IMATGES`, hui
`i.ytimg.com` i `i1`–`i4.ytimg.com`), qualsevol imatge, encara que la
instància no l'haja vista (L-08); amb resoledor, el nom també es resol (T1,
261024_1800) i una resposta no pública el veta; d'un altre host,
APAGADES per defecte: 403 `imatge_de_fora`, sense resoldre ni baixar res
(L-12), també per a una redirecció cap a fora. Enceses
(`SDP_NOTICIES_IMATGES_EXTERNES=1`), només les que han eixit les últimes 24 h
en un feed del sistema baixat per la instància o en una font personal de la
mateixa connexió (L-11), mai una adreça qualsevol (404
`imatge_desconeguda`), i el nom es resol (sense resoledor, 503
`imatge_sense_dns`). Les imatges d'un feed (`enclosure` d'imatge,
`media:thumbnail`, `media:content` d'imatge, `itunes:image` i la primera
`<img>` de cada contingut) es trien i es resolen com al nucli del Lector,
relatives i de protocol relatiu incloses (L-09; `paritat.test.js`). Les
mateixes regles del nom per a tots; tipus `image/jpeg`, `png`, `webp`, `gif`
o `avif` (cap SVG) i una signatura de bytes que ho diga; 1 MiB; 6 s. Com a
molt 8 baixades alhora; la resta espera el seu torn en una cua (64 i 6 s com
a molt) i només si la cua és plena o el torn no arriba és 429 `ocupat` (L-02);
una memòria menuda dels bytes (64 imatges, 8 MiB, 15 min), compartida només
per a les imatges dels feeds del sistema.

El que es veu de qui demana, sense dir-ne més del que és: el gestor no
escriu a la consola ni guarda cap IP, però la memòria personal sí que lliga,
dins de la instància i com a molt 24 h, l'empremta d'una connexió amb les
adreces que ha demanat i amb les imatges d'eixes fonts (i, 15 min com a
molt, amb els bytes de les imatges que no són d'un feed del sistema). I **la
plataforma registra**: els registres d'accés de
Supabase guarden l'adreça de cada petició amb la consulta (`?url=` amb
l'adreça personal, `?u=` amb la imatge) i la IP de qui la fa, amb la seua
retenció. Que el gestor no registre res no ho impedix.

T1 (261024_1800, P1-07; auditoria Codex 261024_1800 C6-02 i C6-03), les fonts
del sistema i els hosts aprovats: la llista blanca NATIVA és
`HOSTS_DEL_SISTEMA` de `gestor.js` (`ayudawp.com`, `emowe.com`,
`iaenaccion.com`, `www.jonhernandez.education` i `www.youtube.com`: noms
exactes, cap subdomini per extensió); el feed i el lloc de cada font de
`fonts.json` n'han de ser, en `https:` net i sense port, o la funció no
arrenca (`validaCataleg`). Un nom aprovat no acredita la IP: amb resoledor,
cada salt d'una font del sistema, d'una imatge del catàleg o d'un CDN de
`CDN_IMATGES` també es resol, i una sola resposta privada, de bucle,
d'enllaç local (amb 169.254.169.254) o ULA el veta (422 `adreca_vetada`,
sense baixar res; el Lector rep la còpia de reserva si en té), encara que
l'altra família (A o AAAA) falle (Codex C6-02, segona passada: abans
`Promise.all` en perdia la resposta privada); sense cap adreça (cap resposta,
o les dues famílies fallades), tampoc no passa (502 `origen_caigut`), i una
sola família fallada tampoc (Gauntlet 261024_1945, Gemini G1945-01: abans,
una adreça pública i l'altra família amb error passaven). Un host sense IPv6
no cau: el `NotFound` de l'AAAA és cap resposta, no una fallada. Passa amb
una adreça pública com a mínim, cap de privada i cap família fallada. Només si el runtime no
té `Deno.resolveDns`, un host aprovat es servix sense resoldre: és l'única
porta oberta, i tancar-la també (el catàleg deixaria de funcionar en eixe
runtime) és decisió del Mestre. Després del desplegament, el `curl` de
`?font=ayudawp` de més avall ha de donar 200: si dona 502 o 504 sempre, pot
ser el resoledor del runtime (502 si falla de seguida; 504 si no respon dins
dels 6 s del salt, que compartixen la resolució i la baixada). Una adreça de
fora, mai sense resoldre.
Les redireccions d'una font del sistema, només dins del mateix host, en
`https:` i sense port (abans, una redirecció podia canviar-lo). `youtu.be` no
hi és: cap feed ni cap imatge del catàleg no hi viu.

G-03 (Gauntlet 261024_1945, Codex; CWE-1333): el recorregut de l'XML per a
les imatges (`imatgesDelFeed`) és lineal. Abans, un feed trencat a posta
(un element sense tancar, una etiqueta sense `>`, un CDATA sense `]]>` o una
`<img>` sense `src`, repetits) feia buscar el terminador des de cada `<`: 1 MB
costava 7 s de CPU (i fins a 57 s amb obertures sense `>`), ja fora dels 6 s
de la baixada. Ara són mil·lisegons, i el resultat és el mateix que abans
(contrast diferencial de 270.000 feeds). L'única fita nova: com a molt 32
noms de contingut distints sense tancar per tros.

Risc residual, que el Mestre ha de tancar ABANS d'encendre les personals: el
nom pot canviar de resposta entre la comprovació i la baixada (DNS
rebinding); el `fetch` de Deno torna a resoldre i la IP no es pot fixar sense
trencar el TLS. Ho fiten que només es torna un feed de 512 KiB com a molt,
que la funció no té cap secret i el límit de baixades alhora, però no ho
tanquen. Ho tanca un egrés aïllat a la plataforma (que la funció només puga
eixir a Internet pública, mai a la xarxa interna ni a les metadades). Les
imatges de fora del catàleg porten el mateix risc: per això estan apagades
per defecte (`SDP_NOTICIES_IMATGES_EXTERNES`, R6 L-12) i s'encenen en les
mateixes condicions que les personals. Per als hosts aprovats (T1), el
rebinding només el podria fer qui controlara el DNS d'un nom aprovat, i també
el tanca l'egrés aïllat. Que
`Deno.resolveDns` hi siga al runtime de Supabase no s'ha verificat ací (cap
CLI de Supabase ni de Deno en este equip); si no hi és, les personals i les
imatges de fora del catàleg es queden tancades soles.

Desplegament (el fa el Mestre, mai un agent), sense verificar el JWT perquè
el Lector la crida sense sessió:

```
supabase functions deploy noticies --no-verify-jwt
```

No cal cap secret. No hi ha `supabase/config.toml` a posta: la bandera va en
l'ordre. Les fonts personals i les imatges de fora del catàleg queden
apagades. Per a encendre-les (decisió del Mestre, i només amb l'egrés aïllat
ja posat):

```
supabase secrets set SDP_NOTICIES_PERSONALS=1
supabase secrets set SDP_NOTICIES_IMATGES_EXTERNES=1
```

Comprovació després de desplegar (lectura, des de qualsevol terminal):

```
curl -s https://<ref>.supabase.co/functions/v1/noticies/fonts
curl -s -o /dev/null -w '%{http_code}\n' 'https://<ref>.supabase.co/functions/v1/noticies/feed?font=ayudawp'
curl -s -o /dev/null -w '%{http_code}\n' 'https://<ref>.supabase.co/functions/v1/noticies/feed?url=https%3A%2F%2F127.0.0.1%2F'
curl -s -o /dev/null -w '%{http_code}\n' 'https://<ref>.supabase.co/functions/v1/noticies/imatge?u=https%3A%2F%2Fexample.org%2Fqualsevol.png'
```

La primera ha de dir `"personals":false` (apagades); la tercera ha de tornar
400 (apagades) o, enceses, 422 (una IP literal) o 503 (sense resoledor); la
quarta, 403 (`imatge_de_fora`: les imatges de fora del catàleg, apagades) o,
enceses, 404 (cap feed no ha portat eixa imatge).

Abans de desplegar-la, el Mestre aprova els hosts de `fonts.json` un per un
(`src/data/adaptadors/noticies/cataleg.test.js` en porta la instantània): un
host nou és una decisió seua, i cal posar-lo a les dues llistes; i també els
CDN d'imatges de `CDN_IMATGES` (`gestor.test.js` en porta la instantània). El
feed d'Emowe és `https://emowe.com/rss.xml` i no el `/feed/` de l'encàrrec
(404 a la comprovació HEAD del 261024), i el de Jon Hernández és
`https://www.jonhernandez.education/feed/atom/` i no `/feed/` (R6 L-06: a tot
GET sense condicions respon 304 i cap byte, la memòria cau de la seua web,
comprovat amb GET el 261024; un HEAD deia 200): el Mestre ha de confirmar les
dues substitucions. Les comprovacions del catàleg es fan amb GET, com les fa
el servei, mai només amb HEAD. Fins que la funció no hi és, el Lector (on
estiga encés) diu «Ara mateix no arriben les notícies», amb les portes a la
resta del poble, després d'una sola petició fallida (per sessió, o una cada
30–60 s quan torna a demanar, si el navegador veu el 404 com una xarxa que
no arriba); obrir-lo en producció (`VITE_SDP_APP_LECTOR=1` i l'entorn del
manifest) també és decisió del Mestre.

## Funció `ap-inbox-verifica` (inbox ActivityPub, fase 2)

P1-23 (fase 2) i la part ActivityPub de P2-07 (marató 261101_2143, Bloc B5).
Rep les activitats ActivityPub dirigides als actors locals, en verifica la
signatura HTTP (draft-cavage-12, el perfil de Mastodon; no és RFC 9421), les
processa amb la biblioteca pura `src/data/federacio/inboxActivityPub.js` i
envia els Accept per una cua signada amb reintents. Fitxers, a
`supabase/functions/ap-inbox-verifica/`: `index.ts` (l'embolcall Deno, que
només llig les variables i crida `Deno.serve`), `gestor.js` (les rutes i
l'obtenció de claus), `magatzemPostgrest.js` (el magatzem de la inbox i la cua
sobre les RPC `public.ap_*`), `cuaLliurament.js` (la signatura, l'espera
exponencial i el buidatge de la cua) i `conformitatMagatzem.js` (el joc de
casos que passen igual la memòria i l'adaptador), amb les seues proves.
Necessita `migrations/2611020106_ap_inbox_persistencia_i_cua.sql` aplicada:
sense les RPC, el magatzem respon `magatzem_no_disponible` i la inbox, 503.

Rutes (el camí intern és el de la petició sense el prefix de la funció):

1. `POST /ap/inbox/<slug>`: apagada (sense `SDP_AP_ACTIVA=1`), respon
   `503 {"error":"federacio_apagada"}` i no llig res. Encesa, un altre mètode
   és 405 i un `Content-Length` de més de 256 KiB és 413 abans de llegir; el cos es llig
   per flux amb el mateix sostre. La signatura es verifica amb el `host` i el
   camí públics de `SDP_AP_INBOX_PUBLICA` (no amb els que reescriga la
   passarel·la): una petició signada per a un altre host o camí no verifica.
   Una activitat nova es reclama (`ap_inbox_reclama`, idempotent per id) abans
   de cap efecte, i l'Accept d'un Follow va a la cua (`ap_cua_encua`). Una
   quota esgotada (`SDP-AP-QUOTA`) és 429 amb `Retry-After: 600`; el magatzem
   caigut, 503 amb `Retry-After: 60` (el remot ho torna a provar).
2. `POST /cua` amb la capçalera `x-sdp-cron` (comparada en temps constant):
   apagada, `503 federacio_apagada` i no envia res. Encesa, buida la cua per
   lots (`ap_cua_reclama`, `FOR UPDATE SKIP LOCKED`, reserva de 10 minuts),
   signa cada lliurament amb la clau de l'actor local (`<actor>#main-key`,
   rsa-sha256), l'envia sense seguir redireccions i amb un topall de 10 s, el
   resol (`ap_cua_resol`) i acaba amb `ap_purga()`. Respon
   `{ok, fets, reintents, fallits, sense_provar, lots, esgotat, purga}`: només
   recomptes. Sense la capçalera bona, 401; la base caiguda, 502.
3. La resta, 404.

Reintents. 2xx és fet; un 3xx (redirecció) i els 4xx, llevat de 408, 425 i
429, són fallits; 408, 425, 429, 5xx, la xarxa o el temps esgotat són reintents, amb
espera exponencial i «equal jitter» (60 s de base, 6 h com a molt per
espera, un `Retry-After` n'és el mínim). Al desé intent, fallit. Una inbox que
resol a una adreça no pública és fallida (`adreca_vetada`). Una fila que el
worker reclama 50 vegades sense resoldre-la mai passa sola a fallida. La purga
lleva la cua feta de fa més de 7 dies i la fallida de fa més de 30.

Variables. `SDP_AP_ACTIVA` (només `1` l'encén), `SDP_AP_ORIGEN` (l'origen dels
ids d'actor; per defecte `https://socdepoble.org`), `SDP_AP_INBOX_PUBLICA`
(l'URL base on arriben els POST; per defecte, l'origen),
`SDP_AP_CLAUS_PRIVADES` (JSON `{"<slug>": "<PKCS#8 PEM RSA>"}`; un slug només
és actor local si té clau i és de `socdepoble` o dels pobles federats),
`SDP_AP_NODES_CONFIANCA` (orígens separats per comes; buit = cap alerta
remota) i `SDP_CRON_SECRET` (el mateix de `compte-apple` i `purga-fitxers`).
`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` els injecta Supabase. Amb la
configuració incompleta, la funció respon `503 config` sense dir quina
variable falta. Cap secret ni cap cos d'activitat ix als registres ni a les
respostes.

Desplegament (acció del Mestre; la funció autoritza ella mateixa, amb la
signatura o amb `x-sdp-cron`):

```
supabase functions deploy ap-inbox-verifica --no-verify-jwt --project-ref <ref>
```

L'ordre: 2611020106 aplicada → secrets → desplegament → programació de `/cua`.
La porta `funcio-ap-inbox-verifica` de `ordre_desplegament.json` ho diu al
verificador de migracions.

Programació: Integrations → Cron → Create job → Supabase Edge Function
`ap-inbox-verifica`, mètode POST, camí `/cua`, cada 5 minuts (`*/5 * * * *`),
capçalera `x-sdp-cron: <SDP_CRON_SECRET>`, cos `{}` i un temps d'espera de
60 s com a mínim.

La cua encallada (lectura, com a `postgres`; els recomptes no ensenyen cap
inbox):

```
select estat, intents, ultim_error, count(*) from private.ap_cua_eixida group by 1, 2, 3 order by 1, 2 desc;
```

Què NO està encés, encara que es desplegue (decisions D-1 a D-5 del Mestre,
especificació B5): el camp `inbox` dels actors publicats continua apuntant a
`/ap/inbox/<slug>`, que el web respon amb 405 (D-1: on arriba el POST, directe
a la funció o per un proxy al mateix origen); els actors no publiquen
`publicKey` ni hi ha cap clau (D-2), de manera que cap remot no pot verificar
un Accept; la llista de nodes de confiança és buida (D-3); la migració ja és
a producció (lectura REST del 6-11-2026), però el desplegament de la funció no s'ha
comprovat (D-4); i el text de privacitat per a
les dades dels seguidors remots està pendent (D-5). La interoperabilitat real
amb Mastodon no s'ha provat: no hi ha desplegament ni endpoint públic. El
residu de DNS rebinding és el mateix de `noticies`: cal un egrés aïllat abans
d'encendre-ho.

## FEDI23 · Connexions públiques i pertinences consentides

`migrations/2611032100_connexions_publiques_i_membres.sql` és a producció: l'hi va aplicar el Mestre el 6-11-2026, i la lectura REST del 6-11-2026 troba les dues RPC públiques (200 a anon). Requerix el catàleg anterior: especialment `2610250100` (seguiments d'entitat), `2610281730` (membres concurrents), `2610282100` (poble canònic) i `2611031700`. L'ordre executable viu a `ordre_desplegament.json`: la 2100 va després de 1700; la restricció 1800→2000→1900 es conserva. El client no inventa resultats públics quan falta l'RPC: rep `NO-DISPONIBLE`.

Quatre taules `private.connexions_*`, totes amb RLS i sense concessions a PUBLIC, anon, authenticated o service_role, guarden preferències, excepcions per vincle, rol funcional i sol·licituds pendents. Les referències de persona/entitat/poble es purguen en cascada. El rol funcional treballador/usuari només té sentit sobre una pertinença viva; el rol owner/admin real preval, i una promoció/degradació antiga neteja etiquetes anteriors.

Les sis RPC són `SECURITY DEFINER` amb search_path buit i revocacions explícites. Només `connexions_publiques_de(text,text)` i `membres_i_entitats_connectades_de(text,text)` tenen EXECUTE per anon i authenticated. Preferències, escriptura, inclusió i sol·licitud només per authenticated; cap concessió nova a service_role. L'autoritat prové d'auth.uid i pertinences vigents: persona pròpia, owner/admin d'entitat o admin municipal. El poble es resol explícitament per UUID o slug en towns; no s'inferix de la configuració global.

Global privada per defecte; el vincle té reserva pública només darrere del global. Una excepció privada de qualsevol extrem domina. Les arestes entrants privades no es publiquen ni convertixen una sortint en mútua. Perfils privats, baixes i bloquejos d'extrems o del visor s'ometen sense revelar el motiu. El selector públic manté eixes regles també quan qui mira és la propietària. Les arestes d’entitat també respecten els bloquejos de la persona representant de l’alta o represa davant del destí i del visor; no es publica eixa persona ni cal que tinga perfil públic. Les preferències autoritzades del poble permeten configurar el seu propi vincle encara amb global o excepció pròpia privada, sense ignorar mai el consentiment de residents o entitats. Els DTO només tenen camps públics d'identitat, ruta relativa, data, direcció i rol funcional quan pertoca: cap correu ni id de qui administra en privat una entitat.

`inclou_persona_en_entitat` delega en la RPC real concurrent de membres: només owner pot nomenar administradores, i treballador/usuari no adquirixen eixe poder. `solicita_unir_se_a_entitat` només crea o actualitza una petició pendent, atribuïda al mateix auth.uid; no crea pertinença. És idempotent per persona/entitat i admet 20 pendents per persona.

Proves locals: `src/data/supabase/connexionsPubliques.test.js`, `src/data/supabase/connexionsPubliques.migracio.test.js` i `tests/connexions-publiques-postgres.test.mjs`. L'assaig PostgreSQL aplica totes les migracions reals en ordre canònic, amb rols anon/authenticated/service_role i proves de denegació; només Auth/Storage/Realtime són fixtures. Usa el mateix opt-in `SDP_PGLITE_MODULE` existent, sense instal·lar ni contactar servidors. Un verd local no acredita permisos de GoTrue/PostgREST reals, desplegament o aplicació remota.

Les preferències pròpies de persona i les administratives d'entitat també inclouen pertinences vives sense seguiment, amb el flag propi de vincle real. Es poden configurar amb global privat, sense publicar-les: el selector públic continua requerint consentiment independent dels extrems. Seguiment i pertinença de la mateixa parella es dedupliquen; el rol visible prové sempre de la pertinença actual. Un UUID explícit de poble també s'ha de confirmar exactament en la resposta del client; només un slug pot resoldre's a un UUID nou.

Les preferències autoritzades inclouen també les pertinences vives entre entitats, als dos extrems del vincle, sense exigir un seguiment. La mateixa fitxa pública segura i els bloquejos continuen filtrant cada fila; la publicació manté les regles de consentiment globals i individuals.
