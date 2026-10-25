---
type: document
status: canonic
description: "Documentació canònica de Sóc de Poble."
---
# Supabase

## Fitxers

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
  Funcions RPC per a l'admin panel.
  
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

- `migrations/2609270200_xat_f0_fonament.sql`
  Xat F0 (Fonament): número d'ordre `seq` per conversa i marques per
  participant (`llegit_fins_seq`, `rebut_fins_seq`), cap escriptura directa a
  `xat_missatges` (tot per RPC), visibilitat per finestra de `seq`, i les RPC
  `xat_envia` (idempotent per `id`), `xat_historial`, `xat_nous`, `xat_marca` i
  `xat_fils_meus` v2. Vegeu «Xat F0: seq, marques i RPC».

- `migrations/2609272100_notes_origen.sql`
  Lògica d'Usuari (T5): la columna `notes.origen` (jsonb) que recorda d'on ve
  una nota connectada des de «Connectar». Sense ella, el Bloc continua
  funcionant (la llista de resums no la demana) però crear una connexió en
  remot falla fins que s'aplique.

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

- `migrations/2610042330_xat_pagina_iaia.sql`
  Correcció posterior al xat de pàgina: `/iaia` és la clau i ruta canòniques;
  l'entrada antiga exacta `/ia` resol al mateix fil. Reanomena les metadades
  del subjecte preservant id, missatges, seq, participants i permisos. Un
  CHECK impedeix recrear la clau antiga. Si un poble ja té les dos files,
  `SDP-XAT-014` avorta tota la transacció; no fusiona ni esborra històries.
  Va després de 2609282100 i les seues dependències, abans de publicar un
  client amb la nova ruta; conserva la condició de moderació. **Aplicada al
  node remot pel Mestre el 261009**, just després de 2609282100.

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
  (C11-05). Idempotent; **NO aplicada: l'aplica el Mestre, mai un agent**.

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

- `seed.sql`
  Contingut inicial del portal.

## Ordre correcte

1. Crear el projecte en Supabase.
2. Obrir el SQL Editor.
3. Executar els fitxers SQL del directori `migrations/` en ordre alfabètic.
4. Crear el poble corresponent a `VITE_TENANT_ID` i configurar el node. `seed.sql` és opcional per a demostracions; l’entrada real no requerix dades seed.
5. Configurar el `.env` local amb `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` i `VITE_TENANT_ID`. No usar mai `service_role` en el client.

Aplicar cada versió pendent amb el registre de migracions. Les migracions noves 2609272100 i 2609272200 s’han provat també repetides; no s’ha d’inferir que qualsevol migració històrica siga repetible sense revisar-la.

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
