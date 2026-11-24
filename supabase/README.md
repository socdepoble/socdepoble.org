---
type: document
status: canonic
description: "Documentació canònica de Sóc de Poble."
---
# Supabase

## Verificació estàtica i excepcions històriques (`C3-VAL01` · R32.47)

`node scripts/supabase/verifica-migracions.mjs` i la mateixa ordre amb
`--estricte` han d'eixir amb `0` sobre este catàleg. `--format json` conserva
els diagnòstics i les empremtes complets. La porta és de lectura: no acredita
l'estat de Producció ni autoritza executar o reaplicar SQL.

[exempcions_historiques.json](exempcions_historiques.json) declara els set
diagnòstics heretats auditats en cinc fitxers. Cada excepció fixa el nom,
SHA-256 de **tots els bytes SQL**, codi, línia i missatge exactes, amb motiu i
mesura prèvia. Els avisos continuen visibles en text, JSON i pla, marcats com
a exempció auditada; només s'evita la seua promoció a error en `--estricte`.
Cap migració històrica ni estat remot s'ha modificat per fer passar la porta.

| Migració preservada | Regla històrica | Motiu i comprovació exigida |
| --- | --- | --- |
| `2610061448_superadmin_aal2.sql` | `A-SENSE-TRANSACCIO` | Una sola sentència `CREATE OR REPLACE FUNCTION`, atòmica per sentència; comparar cos i ACL de `private.es_superadmin()` i revisar l'activació AAL2. |
| `2610061448_superadmin_aal2.sql` | `A-SENSE-CONSULTES` | La presència de la funció anterior no acredita AAL2; cal comparar la definició i validar el comportament en una base local. |
| `2610061450_capcalera_client_ip.sql` | `A-SENSE-TRANSACCIO` | Una sola sentència `CREATE OR REPLACE FUNCTION`, atòmica per sentència; comparar cos i ACL abans i després. |
| `2610061450_capcalera_client_ip.sql` | `A-SENSE-CONSULTES` | La funció ja existia: comparar `private.capcalera_client(text)` i provar la prioritat de capçaleres i el costat dret de `x-forwarded-for` localment. |
| `2610081400_grups_sense_mare.sql` | `A-SENSE-CONSULTES` | Redefinix funció i política existents, sense empremta exclusiva; comparar els dos cossos i provar els permisos amb i sense mare localment. |
| `2611080430_iaia_xat.sql` | `A-IDEMPOTENCIA` (línia 8) | `CREATE TABLE` sense `IF NOT EXISTS` i `CREATE FUNCTION` sense `OR REPLACE`; la transacció falla netament en repetir. Continua **no repetible**: no reaplicar sobre objectes presents i conciliar la contradicció del bolcat abans de proposar aplicació. |
| `2611110010_autoria_256_caracters.sql` | `A-SENSE-CONSULTES` | Els tres CHECK es redefinixen en un `DO` dinàmic; comparar les definicions de Notes, Perfil i organitzacions i provar els límits 256/274 localment. |

Una declaració invàlida, migració absent, canvi d'empremta o diagnòstic pendent
que ja no coincidisca fa fallar **els dos modes**. Un diagnòstic nou fora de
la declaració continua fent fallar `--estricte`. Si evidència real acredita
una migració com a aplicada, la seua excepció pot quedar inactiva; no es
convertix mai una excepció en prova d'aplicació.

L'ordre operatiu normalitza només la comparació de dates de deu i catorze
dígits i aplica les restriccions de `ordre_desplegament.json`. El JSON manté
totes les parelles lèxiques a `inversions`; l'eixida textual agrupa les
causades exclusivament pel format en `A-ORDRE-MIXT` i conserva a part les
inversions cronològiques com `A-INVERSIO-ALFABETICA`, inclosa
`2610312000 → 2610311900`. Cal usar el pla calculat: l'ordre alfabètic cru i
`supabase db push` continuen sense implementar este ordre mixt.

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
  T2 del 13-11-2026 (Pas 0, empremtes): producció ja no té
  `admin_list_users()` sense arguments, només la paginada de 2609150000; la
  retira formalment `20261113112500` (R22.0). Des d'aleshores, eixa consulta
  dona 42883: useu `select to_regprocedure('public.admin_list_users()') is null;`.

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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  **NO l'apliqueu mai sencera** (Onada R22, R03): les línies 121-190
  redefinixen `crea_fil_directe` i desfarien el fil propi de 2611121630.
  `20261114000100` (R22.2) ja en porta, lletra a lletra, `xat_envia` (línies
  195-262) i `membres_del_poble` (línies 71-114). La vinyeta que seguix és
  l'original, per a la història.
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
  aplicada: l'aplica el Mestre, després de 2610081402**. Correcció de l'Onada
  R22 (R05): a producció `profiles.consentiment_rgpd_at` és `NOT NULL DEFAULT
  now()`, de manera que l'antiga comprovació, `select count(*) filter (where
  consentiment_rgpd_at is null) as sense, count(*) as total from
  public.profiles;`, hi torna sempre 0 i no prova res. La consulta de lectura
  ha de comptar qui no té cap acte d'atorgament al llibre de consentiments:
  `select count(*) filter (where not exists (select 1 from public.consentiments c where c.user_id = p.id and c.tipus = 'rgpd_acepta' and c.accio = 'atorga')) as sense_acte, count(*) as total from public.profiles p;`.
  Mentre el `DEFAULT now()` hi siga (etapa B pendent), el directori no amaga
  ningú; quan es lleve, els perfils de `sense_acte` desapareixen del padró del
  xat: si no és un recompte residual (clau antiga 'rgpd' de 2609080000, altes
  per OAuth de 2609261500), cal un pla de reconsentiment abans.
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
  2610081400 a 2610081402, ni 2610081543 (que no s'aplica mai sencera:
  `xat_envia` i `membres_del_poble` els porta `20261114000100`), ni
  2610101900. Cap d'elles toca els
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Estat vigent: aplicada a producció segons el bolcat del 13-11-2026 (deriva R22;
  vegeu la taula canònica). L'estat que esta vinyeta diu més avall és el de quan
  es va escriure.
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
  Idempotent i en una sola transacció. **Aplicada a producció** segons el
  bolcat del 13-11-2026 (deriva R22: els 2 objectes coincidents); l'acta
  261101_0334 també la dona aplicada, tot i que la lectura REST no veu
  `private.xat_lot3_b64`. La columna `te_esmena_2610312000` del Pas 0 ho torna
  a comprovar. Cap agent no l'aplica.

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

- `migrations/2611070600_seed_revisions.sql`
  P1-75: revisió vigent per poble, secció i peça de llavor; CAS inicial 0,
  increment per peça, camps blancs i font única d'`app_content`. `fontVersio`
  ha de ser la versió llegida d'eixa fila: qualsevol canvi de font oculta
  l'overlay antic, també l'edició d'una altra peça de la mateixa fila (la
  versió és de la fila sencera, no de la peça). El CAS és sobre el parell (`fontVersio`, `versio`): com que
  la fila d'una font antiga és invisible per a tothom, el rebase comença amb
  versió 0 sobre la font nova, reinicia la versió a 1 i només
  conserva els camps revisats de nou, sense ressuscitar camps de la font antiga.
  Les longituds es compten en unitats UTF-16, com el client, i la fila fusionada
  no pot passar de 700000 octets. Només
  superadmin amb `private.es_superadmin()` o `owner_user_id` de la font
  autoritativa (sense signatura d'entitat) poden escriure per RPC. Sense
  vinculació UUID, l'autoria textual no dona permís. Lectura pública fitada;
  cap INSERT, UPDATE o DELETE directe del client. La migració del storage
  antic és explícita i seleccionada: no es publica ni s'esborra en arrencar.
  P2-08: la RPC única `exporta_les_meues_dades()` conserva l'exportador canònic
  com a base privada sense permisos de client i afig les revisions de qui
  crida. `author_payload` conserva només els camps aportats per l'autor actual,
  separats del cos públic fusionat amb edicions anteriors; cap camp d'un autor
  anterior es reatribueix a l'exportació del nou. Si es reaplica `2611011800`,
  cal reaplicar després `2611070600` per restaurar l'extensió d'exportació.
  El veto explícit de publicació es comprova a l'arrel i dins dels contenidors
  `attributes` i `payload`, també combinats; la mateixa regla governa la RPC,
  la lectura RLS i el model local. No interpreta la data d'inici d'un acte.
  La transacció notifica explícitament `pgrst, 'reload schema'` perquè el
  descobriment de la nova signatura no depenga d'un DDL watcher del proveïdor.
  **NO aplicada: l'aplica el Mestre** després de verificar la font i el client.
  Prova: `tests/seed-revisions-r11.test.mjs`.

- `migrations/2611080430_iaia_xat.sql`
  **NO aplicada: proposta R54 en còpia.** Després del catàleg de xat/E2EE vigent. Registre d'un principal no interactiu existent i d'un únic grup no xifrat per tenant, tots dos explícits i amb disclosure; no crea ni inventa el compte, el grup Beta o el model. RPC de worker restringides; rol Node0 separat sense ampliar l'autenticador de sessions. La pertinença canònica i eixit_al es revaliden abans/després d'inferència. Jobs amb lease i idempotència; la resposta s'escriu amb el principal del bot i marca IA. Abans d'aplicar-la, comprovar esquema i permisos en una base de prova amb dos connexions; PGlite sintètica no acredita GoTrue/PostgREST ni totes les polítiques reals.

- `migrations/2611080431_xat_push_leases.sql`
  **Aplicada a producció** (radiografia del Mestre del 16-11-2026 14:54: la taula `private.xat_push_lliuraments`, que només crea esta migració, existix; captura `261116_1454`; la `20261116031000`, que en depén, s'hi va aplicar a les 15:03). Depén de2611020417. Pausar el cron antic durant la transició: la migració tanca les RPC destructivesv1 i el treballador nou exigix lease-v2, sense fallback. Cua privada sense FK en cascada: purga limitada100 per insert i5000 per reclam; el límit és treball i requerix activitat posterior, no TTL físic autònom. Nonce CAS120s, caducitat15min,8 intents amb backoff i revalidació de destinatari/propietari/renovació. Un proveïdor que accepte abans d'una fallada d'ACK pot generar un wake duplicat en recuperació; no es promet exactament-un. xat_push_retira_segura fixa la identitat capturada i no pot retirar l'aparell d'una sessió posterior. Després d'aplicar-la, verificar concessions, versions i recuperació d'un lease en una base de prova.

- `migrations/2611080432_xat_lliurament_i_presencia.sql`
  **NO aplicada: proposta R54 en còpia.** Per a este kit compost, després de2611080430. Rebuts d'entrega real per altres persones, mínim de lectura i TTL d'escrivint; el bot només s'exclou si consta al registre privat i al binding del fil/tenant. Sense altres humans, el mínim continua0. Ningú pot declarar-se bot o marcat com llegit des del navegador. Després d'aplicar-la, provar denegació a no membres, revocació i identitats E2EE en una base de prova.

- `migrations/2611080440_politica_privacitat_2_6.sql`
  **NO aplicada: l'aplica el Mestre.** Registre append-only de l'HTML publicat 2.6, SHA-256 `7db70d0101ef51d095ed94110ed560bbd010f62d7d1b8ccf6b0d3f6cc9901d4e` (61501 caràcters). Conserva totes les versions anteriors; no canvia més text legal. Proves: `src/data/supabase/politicaPrivacitat26.migracio.test.js` i `tests/policy26-sql.test.mjs`.
  ORDRE: **aturar les altes** en tots els punts d'entrada (GoTrue, OAuth i Node0), construir/desplegar web i connector amb `/legal` 2.6, extraure i comprovar l'HTML real, aplicar 2611080440 i verificar la fila vigent real. Només reobrir altes després de `tooling/privacy/verifica-politica-publicada.mjs` amb resultat `valid:true`, evidència recent i comprovació operativa que continuen aturades fins a eixe instant. El gate local no configura ni bloqueja GoTrue per si mateix. Si no es poden aturar totes les altes, **no habilitar el nou client**: cal una proposta d'arquitectura d'alta abans de publicar.
  Supabase `handle_new_user` substituïx silenciosament una 2.6 absent per la vigent (2.5); eixa transició no acredita consentiment a 2.6 i no es dona per provada. Node0 rebutja `consent_version_invalid`. No canviar cap versió mostrada després de consentir.
  L'empremta anterior és de l'HTML, igual a `PAGE_COPY.legal.html`; `d10b0acf880499e531df03779572ced8f2fc8cffc33a7d3a69ffbf729c987374` és de `JSON.stringify(PAGE_COPY.legal)` per a Frontissa i és legítimament diferent.
  **Sanejament R15 (B1):** el client continua mostrant, servint i enviant la 2.5 (`VERSIO_POLITICA_PRIVACITAT`, `/legal` i l'alta), amb el mateix text i la mateixa clau de Frontissa que HEAD ec865. El text 2.6 viu només dins d'esta migració, i la prova estàtica el segella pel hash i comprova que és la 2.5 servida més els paràgrafs R54 autoritzats i els dos de D1 Opció A (decisió del Mestre, 261112: el Mur i el Mercat del poble són públics, apartats 4 i 13; sense cap garantia de versió pública filtrada, que depén del kit SQL de Codex). L'empremta també la fixa `scripts/supabase/verifica_migracions_r15.sql`, dins de SECURITY_PATHS i segellat a la transacció de governança `r15b-protegits-261109`: s'hi canvia només amb `tooling/gates/executor-mutacio.mjs`, pla exacte i lease del Mestre, i sense eixe canvi `tests/migracions-r15-prevol.test.mjs` no passa amb esta 2.6. La 2.6 (text de `/legal`, versió del client i clau `legal` de Frontissa) es publica en un commit posterior, junt amb esta migració i l'ordre de dalt. Abans d'aplicar-la, cal posar-hi la data real de publicació, perquè «8 de novembre de 2026» ja és retroactiva (PRIV-05), i recalcular l'empremta a tots els fitxers que la fixen. Les banderes de build que activen el que només descriu la 2.6, `VITE_SDP_IAIA_SERVIDOR` (IAIA amb servidor, apartat 14) i `VITE_SDP_PUSH_NATIU` (push natiu, apartats 8, 11 i 20), no s'encenen abans de publicar-la. `VITE_SDP_XAT_RITME` espera `2611080430`, `2611080431` i `2611080432` i la funció `notifica-xat-desperta`.

  Gate local (sense xarxa, no aplica SQL ni canvia cap interruptor):
  `node tooling/privacy/verifica-politica-publicada.mjs --html /ruta/HTML-publicat-exacte.html --evidence /ruta/evidencia-politica.json`
  L'HTML d'entrada és el contingut font publicat de `/legal` (abans de normalitzacions de serialització DOM), no `JSON.stringify(PAGE_COPY.legal)` ni un text copiat de pantalla. Obtindre'l del desplegament que es pretén habilitar i conservar l'artefacte i la captura d'identitat. Si no es pot obtindre amb identitat verificable, el gate no acredita la publicació i les altes continuen aturades.
  L'evidència JSON ha de portar `schema: "sdp.policy-publication-evidence.v1"`, `backend: "supabase"` o `"node0"`, `observedAt` ISO recent (màxim15min), `signupsPaused: true` **només després de verificar operativament totes les portes d'alta**, `currentVersion` i `policy` amb la fila vigent completa (`versio`, `url`, `text_sha256`, `text_complet`, `vigent_des_de`). Per a Node0, afegir `node0Policy` de la seua ruta autenticadora `policy`, amb `privacy.version/url/sha256` coherents. És evidència aportada per l'operador, no una autenticació de l'estat remot feta pel script.
  Lectura del servidor per a `currentVersion` i `policy` (l'operador la captura; el kit no l'executa remotament):
  `select private.versio_vigent() as "currentVersion", jsonb_build_object('versio', p.versio, 'url', p.url, 'text_sha256', p.text_sha256, 'text_complet', p.text_complet, 'vigent_des_de', p.vigent_des_de) as policy, now() as "observedAt" from public.politiques_privacitat p where p.versio = private.versio_vigent();`
  Comprovar els dos punts d'entrada i repetir el gate immediatament abans de reobrir. Si falta una dada, és antiga, no coincidix, o Node0 encara declara2.5, el procés ix amb codi1. Les proves sintètiques no són autorització ni prova de l'aplicació remota. INVERSA operativa: tornar a aturar altes; no esborra ni reescriu la2.6 segellada.

- `migrations/2611082238_admin_resum_sessions_dispositius.sql`
  R13-C7 (ordre del Mestre del 8-11-2026, apartat «👥 Usuaris, Dispositius i
  Botigues» de l'Administració del sistema): `admin_resum_sessions_dispositius()`
  compta les persones distintes amb una sessió activa d'`auth.sessions` per camí
  (app d'iPhone i iPad, Safari d'iOS, app d'Android, navegador d'Android,
  escriptori i altres) en 24 hores, 7 dies i 14 dies, segons el `user_agent`.
  Només recomptes: cap identificador, nom, correu, IP ni `user_agent` no ix de
  la funció. Superadmin amb `aal2` (`private.es_superadmin()`); sense execució
  per a `anon`. Requerix 2610061448 i les columnes `user_agent`, `updated_at` i
  `refreshed_at` de GoTrue. Abans (lectura): les tres columnes existixen.
  Després (lectura): la funció existix i `anon` no la pot executar.
  **NO aplicada: l'aplica el Mestre.** Mentre no hi siga, el panell ho diu i no
  mostra cap xifra. El perfil històric R13-C7 de 81 conserva el seu pin a
  `tooling/node0/posse/posse-ledger.sql`; la composició R13/R54/R55 incorpora
  85 migracions amb un pin separat. Els sis pins històrics 76–81 es preserven.
  Prova: `tests/migracio-admin-resum-sessions-dispositius.test.mjs`.

- `migrations/2611091500_sessions_i_curadoria_cultural.sql`

  **Estat remot no acreditat sencer** (radiografia del Mestre del 16-11-2026 14:54: `private.pot_curar_cultura()`, que només crea esta migració, existix a producció, però ningú n'ha comparat el cos amb Git, i l'ESTAT del 10-11-2026 ja hi trobava objectes de curadoria abans d'aplicar res: conciliar-la abans de reaplicar-la). El bolcat del 13-11-2026 sí que les compara: `private.pot_curar_cultura()` i `revisa_aportacio_cultural(uuid,text,text)` no coincidixen amb cap versió de Git, i la resta, 56 objectes, sí (deriva R22; vegeu la taula canònica). Ordre: després de `2610061448` (guarda privada de superadmin amb aal2) i `2611082238` (contracte de resum de sessions preservat). Cap rol de curadoria s’assigna automàticament. Esmena SEG-R15b-01 i SEG-R15b-04 (9-11-2026): directori per persona i camí amb correu emmascarat i auditoria append-only; normes de convivència i quatre ulls a la safata cultural.

- `migrations/2611110010_autoria_256_caracters.sql`

  Proposta R17.2 pendent d’aplicació. Requerix `2609262232`. Substituïx
  les tres restriccions de longitud de `copyright`: el text d’autoria té un
  màxim de 256 punts de codi i la marca de llicència es compta a banda.
  Conserva les files existents i els permisos de Notes, Perfil i organitzacions.
  El client que admet autories de 256 s’ha de publicar després de la migració.

  Després (lectura): les tres restriccions han de comptar l’autoria a
  banda de la marca de drets.

  ```sql
  select conname, pg_get_constraintdef(oid)
  from pg_catalog.pg_constraint
  where conname in ('notes_copyright_longitud', 'profiles_copyright_longitud', 'organizations_copyright_longitud');
  ```

- `migrations/2611110100_cua_purga_storage_ugc.sql`

  P0-20. Registre i cua de purga d'objectes UGC en la baixa definitiva, amb comprovació de propietat i versió. **Aplicada a producció** el 13-11-2026 al T2 (pas 2; el SHA-256 del text executat, `fa6e25fc…`, és el del fitxer de Git; sonda: `cua_purga_storage_ugc` present). Evidència: registre de la sessió SQL del T2, `../_investigacio_ia_de_poble/261113_0330_r21_commit5_t2_sql_i_deploy_claude/sessio_sql_t2_261113.md`, i ESTAT del 13-11-2026 a les 21:18 («11 migracions SQL remotes (T2) aplicades»). El worker `purga-fitxers` no estava desplegat: les baixes amb fitxers esperen que s'execute.

- `migrations/2611110110_revisions_patrimoni_viu.sql`

  P1-75. Campanyes anuals de llavors, arbres i receptes per poble. Lectura pública de les columnes de la campanya amb autoria interna. L’autor amb pertinença al poble pot editar i retirar la seua campanya. Curadoria i administració municipal requerixen AAL2 i pertinença al poble. Superadmin amb AAL2 té abast global. **Aplicada a producció** pel Mestre el 16-11-2026, amb el disparador `revisions_patrimoni_quota` de la `20261115170000` (`pas3_patrimoni_quota_ok = true`, captura `261116_1503`; bytes idèntics als de Git). Proves a `tests/revisions-patrimoni-viu.test.mjs`.

- `migrations/2611110455_revisions_editorials_wp.sql`

  P0-111. Taula `public.revisions_editorials_wp` amb RLS i funcions RPC `llista_revisions_editorials_wp()` i `desa_revisio_editorial_wp(...)` reservades a `superadmin` amb `AAL2`, per sincronitzar entre navegadors l’estat de revisió editorial (`pendent_admin`, `aprovat`, `amb_observacions`), nota, autoria i destí de les entrades importades de WordPress darrere del port neutral (`revisionsEditorialsWp`), amb llavor inicial per als 20 ítems del Catàleg d’Arbres d’`Associació El Rentonar`. **Aplicada a producció** pel Mestre el 16-11-2026 a les 15:02 (receptari SQL R30/R31 i captura `261116_1503`; bytes idèntics als de Git).

- `migrations/2611111735_copublicacio_registrada.sql`

  R19. Assigna publicadors a una peça amb versió optimista, identificador de reintent i historial de traspàs i reversió. La font, els crèdits i la llicència queden en la seua taula original. La lectura verifica el padró vigent i conserva l'accés del Mur i dels perfils personals. Les escriptures requerixen superadmin amb AAL2 i compte actiu. Els ajustos privats opcionals `copublicacio_actor_socdepoble` i `copublicacio_actor_rentonar` vinculen els UUIDs de les organitzacions públiques quan el node usa uns altres identificadors fundacionals. **Aplicada a producció** el 13-11-2026 al T2 (pas 3, SHA-256 `a8770935…` igual al de Git; registre citat a la Nota d'auditoria §16), i la radiografia del Mestre del 16-11-2026 14:54 ho confirma: `private.copub_compte_actiu(uuid)`, que només crea esta migració, existix (captura `261116_1454`). No la torneu a aplicar aïllada: redefinix `private.copub_recurs`, que 2611121430 va reescriure després. R20: `npm run test:sql` executa PostgreSQL natiu descartable per defecte, sense `skip` ni servidor remot; requerix les dependències de desenvolupament del lockfile. Preferix els binaris locals i, si no n'hi ha, usa `embedded-postgres`. Dos clients independents proven conflicte, reintent idempotent i rollback amb espera de pany observada. Les fixtures d'Auth no acrediten JWT signat, TOTP, GoTrue ni PostgREST.

- `migrations/2611112005_mur_lectura_publica_foraster.sql`

  P0 Mur Foraster (11-11-2026). Substituïx la política «public read section_submissions» de 2609080000, l'única definició anterior: `anon` i `authenticated` lligen les seccions `mur`, `mercat`, `events` i `multimedia` d'un poble que existix a `public.towns`, i les files de `notes` només les llig la persona propietària que és membre del poble. Concedix lectura per columnes a `anon` i `authenticated`, també d'`owner_user_id` i `author_org_id`: l'UUID de l'autoria d'una publicació pública es pot llegir sense sessió. Sense `using (true)` ni cap permís d'escriptura per a `anon`. Aplicada segons l'ESTAT de l'11-11-2026 a les 21:21 (Mestre i MarIA), sense lectura REST registrada; `tractor-rls.mjs` (0 infraccions) és una comprovació estàtica del fitxer, no una evidència remota. Avís: la política no mira l'estat de publicació, i el Kit Codex R20 v1 hi reproduïx en local la lectura d'esborranys (`status: draft` o `payload.isPublished: false`) i en proposa la correcció additiva `2611112149_mur_estat_public_i_padro.sql`. S'ha aplicat a mà per davant de migracions pendents més antigues, i `supabase db push` les podria refusar sense `--include-all`. Si es torna a aplicar sencera la 2609080000, esta política es revertix.

- `migrations/2611112149_mur_estat_public_i_padro.sql`

  R20. Depén de 2611111735 i 2611112005. Predicat compartit entre la política SELECT i la resolució del padró de publicadors: esborranys, privats, marques contradictòries i metadades malformades no es projecten. Conserva els registres antics sense marques i les notes privades del propietari. Provada dues vegades sobre el mateix clúster amb `npm run test:sql`, incloent notes reals i frontera de 64 capes. **Aplicada a producció** el 13-11-2026 al T2 (pas 5, SHA-256 `12bd594e…` igual al de Git; sonda: `private.publicacio_mur_es_publica(jsonb)`, que només crea esta migració, present). **No la torneu a aplicar aïllada:** damunt de 2611121430 tornaria enrere `private.copub_recurs` (la definició vigent és la de 2611121430, que també mira `private.mur_publicacions_revocades`, la visibilitat, la moderació i l'esborrat) i tornaria a crear la política permissiva «public read section_submissions» que 2611121430 i 2611122200 retiren; 2611122200 només retira la política, i `copub_recurs` quedaria regressada.

- `migrations/2611121430_mur_foraster_projeccio_publica_opcio_a.sql`

  R21 D1 Opció A i F03. Depén de 2611111735, 2611112005 i 2611112149. Revoca SELECT cru anon (també concessions de columna), restringix la lectura autenticada al propietari i oferix RPC pública escalar amb catàleg validat, sense identitat interna, contacte, HTML o mitjans sense neteja EXIF acreditada. Estats public/visible/no esborrat, padró coherent, moderació protegida amb rol actiu+AAL2, esborrat/retirada de notes transaccional i tombstones contra resurreccions. Cua offline d'intencions CAS, ACK durable i replay concurrent; no equival a esborrat local ni ACK remot fins a confirmació. **Aplicada a producció** el 13-11-2026 al T2 (pas 6, SHA-256 `41a56b24…` igual al de Git; sonda: `mur_publicacions_revocades` present), i la radiografia del Mestre del 16-11-2026 14:54 ho confirma: `private.mur_anti_resurreccio()`, que crea esta migració, existix, i el seu cos és l'auditat que el preflight de `20261116040000` va acceptar a les 15:03 (captura `261116_1454`). Proves PostgreSQL 18.6 natives sense omissions. Es va aplicar abans de publicar el client v1.2.0 build 5, amb tota la cadena del Mur R21 (Nota d'auditoria §16, porta `client-v1-2-0-build-5-mur-r21`); no la torneu a aplicar.

- `migrations/2611121630_xat_propi.sql`

  R21.4. Fil propi privat, únic per propietari i poble, lectura automàtica i cap destinatari push propi. Requerix el xat E2EE vigent de 2610311800 i la cadena 2611020417 → 2611080431; assajat amb 2611080432. No requerix la migració IAIA 2611080430. Idempotent. **Aplicada a producció** el 13-11-2026 al T2 (pas 4, SHA-256 `d714656b…` igual al de Git; sonda: `public.xat_fils.propi_usuari_id` present; registre citat a la Nota d'auditoria §16), un dia abans que `20261114061000` (R24, aplicada el 14-11): producció ja té la `public.xat_fils_meus` d'R24 i no cal cap rebase per a ella. **No la torneu a aplicar:** damunt de R24 avorta sencera amb 42P13 (el tipus de retorn de `public.xat_fils_meus` ja no és el d'esta definició) i, si algú n'esborrara abans la funció, tornaria enrere `public.xat_fils_meus` a la versió anterior a R24 (contraprova a `tests/r32-fossils-i-xat-rebase-pglite.test.mjs`). **Conflicte d'evidència per al Mestre:** el receptari SQL R30/R31 del 16-11-2026 la dona pendent de rebase per una sonda (`public.obri_fil_propi()`, absent) que cap migració de Git crea; una sonda vàlida és `to_regprocedure('private.xat_propi_integritat()')` o la columna `public.xat_fils.propi_usuari_id`. Prova PostgreSQL 18.6: `tests/xat-propi-r21-4-postgres.test.mjs`.

  **R32 (`20261116170100_r32_xat_propi_rebase_r24.sql`, aplicada a producció pel Mestre el 17-11-2026 a les 01:55 CET):** si mai cal tornar a passar el fil propi en una base que ja té R24, l'única via és este rebase additiu, mai esta migració. Segons el T2 del 13-11-2026 no calia a Producció: esta migració hi va entrar abans que R24, i els dos ajudants de disparador que el rebase torna a crear (`private.xat_propi_integritat()` i `private.xat_propi_missatge()`) són byte a byte els d'ací. El Mestre l'hi va passar igualment, darrere de les dues R24 (pas 6 del certificat `../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md`, vinyeta de `20261116170100`).

- `migrations/2611121700_purga_agents_app_content_i_hidratacio_canonica.sql`

  R21.5. Depén d'`app_content` de 2609080000. Retira identificadors de ficció declarats i hidrata les tres identitats canòniques, preservant persones/entitats reals addicionals, ordre, duplicats i metadades. Valida formes/mides i aborta íntegrament davant d'entrada no admesa. Idempotent, sense grants ni RPC nous; estat remot no acreditat. Prova PostgreSQL 18.6: `tests/agents-app-content-r21-5-postgres.test.mjs`.

- `migrations/2611121830_frontera_contingut_editorial_i_notes_privades.sql`

  R21.6. Requerix les taules `app_content`/`notes` i `private.is_town_member`. Usa la guarda vigent de `private.es_superadmin()`: no requerix 2610061448 (assajat al T2 del 13-11-2026); quan 2610061448 estiga aplicada, l'excepció de superadmin exigirà també AAL2. Reafirma el contracte de nou claus de 2610101900 i les guardes restrictives contra polítiques permissives obsoletes. Notes privades només per propietari membre, sense privilegis PUBLIC/anon. No reescriu payloads, versions ni dates. Transaccional i idempotent. **Aplicada a producció** el 13-11-2026 al T2 (pas 1, SHA-256 `be47c0e7…` igual al de Git; registre citat a la Nota d'auditoria §16). Prova PostgreSQL 18.6: `tests/contingut-frontera-r21-6-postgres.test.mjs`.

- `migrations/2611121850_mur_text_dates_i_contactes.sql`

  R21.6. Després de la definició més recent del netejador privat de 2611121430 i després de 2611121830 en la integració d'esta onada. Preserva dates gregorianes ISO vàlides i rangs `AAAA-AAAA`, sense obrir telèfons curts separats, llargs/internacionals, contactes ni recursos privats. Funcions sense EXECUTE client, transaccional i idempotent. **Aplicada a producció** el 13-11-2026 al T2 (pas 7, SHA-256 `3661300e…` igual al de Git; sonda: `mur_es_data_iso` present). Assaig PostgreSQL 18.6: `tests/copublicacio-foraster-opcio-a.test.mjs`. La seqüència i els límits detallats són a `migrations/README.md`.

- `migrations/2611122200_mur_membres_i_actes_v2.sql`

  R21.1 v2. Després de 2611121430, 2611121630, 2611121830 i 2611121850; requerix 2611110100 (cua de purga, `SDP-MUR-DEPENDENCY`) i la signatura `pot_signar_com_organitzacio(uuid, uuid)` de 2611011500 (la línia 960 la crida amb el poble de la nota des de la correcció del T2 del 13-11-2026; abans cridava la d'un argument, que 2611011500 esborra). Separa lectura anònima mínima i lectura rica de membres; actes de Notes amb UUID i rebut d’operació transaccional, retirada durable, denúncia i bloqueig per UUID, tombstones mínims i Storage amb llistat propi. Qui no llig l’autoria d’un poble (Foraster autenticat o compte en baixa) bloqueja i denuncia sense rebre-la en cap fila pròpia: bloqueig opac `publicacio` a `public.bloquejos` i autoria en taules privades; si després entra al padró del poble d’una publicació bloquejada, el bloqueig hi continua valent (Gauntlet R22, ronda 3). Una retirada encua les còpies públiques, `sdp-net-v1` i les UUID de la promoció anterior (`<poble>/<uid>/notes/`), mai l’avatar ni l’original d’una nota d’abans del 19-09, i una còpia citada per un perfil, per una altra publicació o per una nota pròpia es conserva; tornar a publicar la mateixa còpia ja no topa amb `SDP-PURGA-004`. Canviar de secció un acte propi respon `SDP-SEC-002`; el redactor de text és lineal. Les dues lectures admeten `p_nomes_projeccions` (per defecte false): el servidor torna només les files amb marca de catàleg pública vàlida, abans del LIMIT, també a la branca pública de `llig_mur_membres`; les signatures de cinc i sis arguments es retiren. Una publicació nova del Mur, el Mercat, l'Agenda o Multimèdia no passa de 1.000 caràcters de títol, 20.000 de resum ni 100.000 de cos (`SDP-MUR-MIDA`, 22001); una fila antiga més llarga es pot moderar i editar sense créixer. **Aplicada a producció** el 13-11-2026 al T2 (pas 9, en la versió corregida de la línia 960; SHA-256 `398caea4…` igual al de Git; sonda: `mur_actes_notes` present), abans de publicar el client v1.2.0 build 5, amb tota la cadena del Mur R21 (Nota d'auditoria §16, porta `client-v1-2-0-build-5-mur-r21`); no la torneu a aplicar aïllada. Prova PostgreSQL 18.6: `tests/mur-membres-actes-v2-postgres.test.mjs`.

- `migrations/20261113003000_r21_9b_canal_beta_testers_i_sync_aparadors.sql`

  R21.9b. Aplicar després del catàleg històric complet, incloses 2611111735, 2611121630 i 2611122200, abans del client R21.9b. Beta amb clau canònica, pertinença vigent i reconciliació idempotent sense reactivar eixides; General conserva el seu UUID. Una reconciliació incoherent (rotació del principal, `SDP-XAT-018`) o amb el pany per poble ocupat (`55P03`) es descarta amb avís al registre, amb el SQLSTATE real, sense fer caure la safata; qualsevol altre error es propaga amb el seu SQLSTATE, i un membre ja reconciliat llista sense el pany per poble. PNG afegit al contracte d’adjunts amb els límits vigents i E2EE intacte. Registre de sincronització privat, consentiment i CAS només per al servei; no publica fitxes ni activa cron. **Aplicada a producció** el 13-11-2026 al T2 (pas 10, SHA-256 `c102490e…` igual al de Git; sonda: `public.xat_fils.canal_clau` present). Prova PostgreSQL 18.6: `tests/r21-9b-beta-postgres.test.mjs`.

- `migrations/20261113060000_r22_1_hero_video_url.sql`

  R22.1 (Gauntlet r221-dades-03, r221-dades-06 i r221-ui-04). Després de 20261113003000 i de 2609261500, 2610081401, 2610160250, 2610281730 i 2610282100. Crea `hero_video_url` a `profiles` i a `organizations` amb un CHECK per taula (buit, o com a molt 2.048 caràcters: el bucket públic `sdp-media://mitjans/`, un `https://` amb camí o un camí propi, sempre `.mp4` o `.webm`; mai `mitjans_privats`), l'UPDATE de la columna per a `authenticated` i el SELECT de la columna d'`organizations` per a `anon` i `authenticated`, i la torna a llegir: `organization_directory`, `list_my_organizations` i `perfil_public` (només a la fitxa sencera) la porten al final. Additiva i idempotent; cap dada, política ni permís retirat. **Aplicada a producció** el 13-11-2026 al T2 (pas 11a, SHA-256 `09969804…` igual al de Git; sonda: `hero_video_url` present); la capçalera SQL, de bytes immutables, encara diu que no ho està. El client no la requerix: sense ella, la fila no porta la columna, el panell del vídeo no s'oferix i el directori la lleva del select (42703). Cap contingut real d'una entitat no l'escriu el client; el posa un SQL revisat pel Mestre. Prova PostgreSQL 18.6: `tests/r22-1-hero-video-url-postgres.test.mjs`.

- `migrations/20261113112500_r22_0_reconciliacio_deriva_ritme_xat_i_mitjans_privats.sql`

  R22.0 (T2 del 13-11-2026; decisió del Mestre: remeis R1, R2 i R3). Reconcilia la deriva que el Pas 0 del T2 va trobar a producció. Torna la lectura de `mitjans_privats` a «només els propis» i les cinc polítiques restrictives «sdp mitjans …» de 2609200300; restaura `trg_rate_limit_xat` de 2609080200 (15 missatges cada 5 s per persona); retira `public.admin_list_users()` sense arguments, que la versió paginada de 2609150000 substituïx. Còpia literal de les línies que cita la capçalera, sense cap objecte nou. Independent de la cadena del Mur R21. Transaccional i repetible. Efectes: el límit de ritme compta també la IAIA i les insercions en lot del servidor; qui ix del poble deixa de llegir i d'esborrar els seus fitxers privats; un mitjà privat dins d'un payload del Mur només el resol l'autora. La sonda del Pas 0 en té la columna `te_reconciliacio_deriva_20261113112500`. **Aplicada a producció** el 13-11-2026 al T2 (pas 11b, SHA-256 `cbde9ad6…` igual al de Git), tal com la va aprovar el Mestre per a eixa sessió; abans, els cossos de `es_ruta_mitjans_propia` i `es_ruta_mitjans_publics_propia` de producció ja eren idèntics als de la migració. Prova PostgreSQL 18.6: `tests/r22-0-reconciliacio-deriva-postgres.test.mjs`.

- `migrations/20261113233000_refranyer_sonor_i_aportacions_dialectals.sql`

  Onada R23 («La Veu de Sóc de Poble»). Crea `public.refranys_poble` i `public.aportacions_veu_poble` amb RLS activada des del primer instant, cap `USING (true)` ni `WITH CHECK (true)`, revocació explícita sobre `PUBLIC`, consentiment explícit `cc-by-sa-4.0-v1` sense marca automàtica i sostres físics estrictes (`<= 15 s`, `<= 2 MB`). R24.2 (`D-codex_sql_port-3c` i Gauntlet): primer `REVOKE ALL` (també els privilegis per defecte de Supabase) i després `anon` i `authenticated` només lligen per columnes les públiques d'una aportació aprovada o pròpia, mai `user_id`, `audio_storage_path` ni `consentiment_acceptat_at` (la RLS d'autoria no necessita el privilegi de columna). Els CHECK de longitud limiten també la cadena crua, no només la retallada (Codex `R24.2-T1-02`). Marxa enrere a la capçalera. Transaccional i idempotent. **Aplicada a producció el 14-11-2026 pel Mestre** (paquet R24.2) (5/5 true, captura 261114_2339 del Mestre). Les aportacions que el client encara no envia (el refrany gravat i el joc amb la bandera `VITE_SDP_CONSENS_ISOGLOSSES` apagada) es guarden en local amb avís honest (`Llei 0`).

- `migrations/20261114000100_r22_2_reconciliacio_deriva_produccio.sql`

  R22.2 (Onada R22, receptari de l'Eix B del dossier de Fable 5.2: R02, R11, R03, R05 etapa A, R12, R13 i R14). Reconciliació de la deriva de producció en una sola transacció repetible. Retira el disparador fòssil `sdp_protegeix_propietari`, la seua funció i l'índex únic `idx_organization_memberships_one_owner` (residus de l'antic `schema.sql`) i torna `organizations.created_by` a la forma de Git (nul·lable, `ON DELETE SET NULL`): el titular públic, el traspàs de propietat, l'esborrat d'organitzacions i la purga d'una propietària tornen a funcionar, i l'invariant d'una sola propietària el continua guardant `sdp_una_propietaria` (23514). En la mateixa transacció revoca i esborra `public.delete_user()`, feta a mà i sense cridador. Torna a crear `public.xat_envia` amb les línies 195-262 de 2610081543 lletra a lletra (md5 `2ab3cc315219aaac4a0aa83b0f9768be`; `crea_fil_directe` no es toca) i hi afig el CHECK `xat_missatges_metadades_mida` (16384 bytes), validat només si cap fila el viola. `profiles.consentiment_rgpd_at` torna a ser nul·lable (etapa A; el `DEFAULT now()` es queda fins que el client tinga la porta de reconsentiment). `admin_list_organizations()` i `admin_list_users(integer, integer)` tornen al cos de 2609121600 i 2609150000 (la de producció llegia `public.entitats`, 42P01); efecte visible només per al superadmin: la llista d'usuaris torna a l'ordre d'alta. Fora TRUNCATE, REFERENCES, TRIGGER i MAINTAIN per a `anon` i `authenticated` a les taules de `public`, i els privilegis per defecte ja no fan executable per `anon` ni per PUBLIC cap funció nova; les 16 funcions heretades que només són a producció perden PUBLIC i `anon`. La CHECK `section_submissions_autoria_org_valida` passa al disparador `zz_sdp_autoria_org_valida`, amb la mateixa regla i el mateix 23514 per a tota petició de l'API que no siga `service_role` (l'editor SQL, les migracions i el servidor ja poden mantindre una publicació signada; la frontera de `tests/uuid-editorial-authorship-boundary-r19.test.mjs` es conserva). Crea `notes.icon` i `notes.publish_date`, que el client ja escrivia. NO fa el `revoke update (town_name)` de R06 (Perfil › Poble escriu la columna directament) ni toca `private.es_superadmin` (2610061448, reservada al Mestre). Si mai es reaplica `2611011500` (torna a crear la CHECK d'autoria) o `2609291210` (torna el `membres_del_poble` sense el filtre de consentiment), cal tornar a aplicar `20261114000100` (`reaplicacio` d'`ordre_desplegament.json`). **Aplicada a producció** pel Mestre el 15-11-2026 a les 23:11 (`pas1_r22_2_ok = true`, captura `261115_2311`). Prova PostgreSQL 18.6 amb els residus literals de producció i un rol sense superusuari: `tests/r22-2-reconciliacio-deriva-produccio-postgres.test.mjs`.

- `migrations/20261114000200_r22_3_sostres_de_volum.sql`

  R22.3 (R07). Sostres de volum per compte, després de 20261114000100 (usa `private.peticio_de_servidor()`). `user_tags` (heretada, només a producció) perd els privilegis i les polítiques. Notes: com a molt 8 MiB per nota, 16 MiB per petició i 2000 notes o 50 MiB per persona, emoticona (`notes.icon`) inclosa (`SDP-NOTES-MIDA`, `SDP-NOTES-LOT`, `SDP-NOTES-QUOTA`); un canvi que no fa créixer el contingut (paperera, restaurar, publicar-la o retirar-la del Mur, encongir-la) no mira ni la mida ni la quota, i qui ja és al sostre pot buidar; el fusible `SDP-BD-PLENA` atura altes i canvis de mida, també els de només l'emoticona (`notes.icon`, R24), quan la base passa de 350 MiB (la paperera continua). Organitzacions: 20 per persona i 5 al dia (`SDP-ORG-429`) i cap empresa ni grup amb un nom o identificador que COMENCE per una institució, amb article o tractament davant si cal (`SDP-ORG-403`; D-ORG, R24: «Forn de l'Ajuntament» o «Bar El Policia» són comerços). Xat: la ràfega de R22.0 (15 cada 5 s) i, per hora i compte, 600 missatges i 4 MiB (`SDP-XAT-429`; la IAIA en queda fora). Mur: `created_at` del servidor en l'alta, payload de com a molt 1 MiB (8 MiB a la secció de notes) i 60 publicacions noves per hora i 2000 en total (`SDP-MUR-MIDA`, `SDP-MUR-429`), també per `publica_nota_al_mur`. `service_role` i les sessions sense API (editor SQL, migracions, planificador i federació del Node 0) en queden fora. **NO aplicada: l'aplica el Mestre.** Prova PostgreSQL 18.6: `tests/r22-3-sostres-de-volum-postgres.test.mjs`.

- `migrations/20261114000300_r22_4_purga_baixes_avis_worker.sql`

  R22.4 (R09, D-PURGA). `private.purga_una_baixa` amb el cos de 2611110100 (el mateix que producció) més dos canvis: un assaig de l'esborrat d'Auth abans de destruir res en la primera passada (si l'esborrat final ha de fallar, l'error ix ara i la baixa continua cancel·lable) i l'avís `SDP-BAIXA-044` quan la cua de fitxers porta més de 24 h sense que el worker la reclame. Abans de l'assaig esborra les files de `private.xat_iaia_jobs` de qui se'n va (les seues claus no tenen `ON DELETE` i una sola pregunta a la IAIA pararia la purga per sempre), i torna la clau `town_memberships_user_id_fkey` de 2609080000, que producció no té (sense ella la pertinença al poble sobreviu al compte; `NOT VALID` i validada només si no hi ha cap pertinença òrfena). Precondició: la sonda `fk_storage_objects_cap_a_auth_users` = 0. Mateixa signatura i permisos. Cap planificador: l'ordre és el worker desplegat i provat, `pg_cron` i `pg_net`, el planificador del worker i, només al final, el de `private.purga_baixes_vencudes`. **NO aplicada: l'aplica el Mestre.** Prova PostgreSQL 18.6: `tests/r22-4-purga-baixes-avis-worker-postgres.test.mjs`.

- `migrations/20261114000400_r22_5_buckets_mitjans_i_heretats.sql`

  R22.5 (R10, D-BUCKETS). Només després de la còpia de seguretat i de baixar els objectes (R01). Copia la proposta v2 amb l'esmena del contrast: `mitjans` amb 5 MiB i només WebP, JPEG, PNG i AVIF; `chat_attachments`, `images` i `profiles` deixen de ser públics i perden les 12 polítiques fetes a mà, sense esborrar cap objecte; frontera restrictiva per llista de buckets; `mitjans llegir` només per als objectes propis; invariant de la imatge a la base (`SDP-MITJANS-001` i `002`, també per `move` i `copy`). Avorta neta si falta un bucket viu (`SDP-BUCKETS-001`) o si `mitjans` ja porta un objecte no conforme (`SDP-BUCKETS-005`, per exemple un vídeo de capçalera que el CHECK de R22.1 admetia). **NO aplicada: l'aplica el Mestre.** Prova PostgreSQL 18.6 amb els residus literals de Storage de producció: `tests/r22-5-buckets-mitjans-i-heretats-postgres.test.mjs`.

- `migrations/20261114023000_joc_isoglosses_consens_comarcal.sql`

  Onada R23 Fase 2 (`IDEA-252` i `IDEA-257`). Depén de `20261113233000`. Amplia `public.aportacions_veu_poble` amb les columnes primitives separades `poble`, `comarca_id` i `abast_comarcal`, crea `public.joc_isoglosses_vots_consens` amb RLS d'autoria pròpia i vot únic per persona i variant, i publica l'RPC agregada `public.resum_consens_isoglosses_poble(text)` (`SECURITY DEFINER`, `search_path = ''`) que retorna únicament recomptes sense cap identificador personal: una fila per pregunta, variant i comarca (`R23-U05`), amb la comarca normalitzada una sola vegada al CTE `comarca_neta` que fan servir alhora `SELECT`, `GROUP BY` i `ORDER BY` (`CODEX-R24-D1-07`: cap 42803), etiqueta i poble retallats, el poble d'exemple només quan dos vots de la fila el comparteixen, com a molt 20 files per pregunta i 250 en total, i ordre amb col·lació `C`. El mirall local (`creaConsensIsoglossesMemoria`) agrega igual. L'etiqueta i la clau d'una variant nova no passen per moderació: cal la decisió del Mestre abans d'encendre `VITE_SDP_CONSENS_ISOGLOSSES`. Marxa enrere a la capçalera. Transaccional i idempotent. **Aplicada a producció el 14-11-2026 pel Mestre** (paquet R24.2) (5/5 true, captura 261114_2339 del Mestre); la bandera `VITE_SDP_CONSENS_ISOGLOSSES` continua apagada per decisió. Prova PostgreSQL 18.6: `tests/r24-consens-isoglosses-postgres.test.mjs`.

- `migrations/20261114060000_r24_xat_directe_canonic_i_reconciliacio.sql`

  Onada R24 (`IDEA-260` a, costat del servidor; proposta C3 de l'informe `xat_duplicats` de l'onada 1). Depén de 2609272200, 2610290400 i 2611121630. Un sol directe persona↔persona per parella i poble: clau canònica `parella_menor` < `parella_major` a `public.xat_fils` amb el CHECK de forma `xat_fils_parella_forma` (només en un `directe` sense entitat, fil propi, comunitat ni subjecte) i l'índex únic `xat_fils_parella_uq (tenant_id, parella_menor, parella_major)`; el poble forma part de la clau, com a `xat_fils_entitat_interlocutor_uq`. Reconcilia els duplicats que ja hi haja: el supervivent és el més antic (el que ja tornava `crea_fil_directe`), els missatges hi passen amb els ids intactes i una numeració cronològica i monòtona per damunt de tot `seq` del grup, les marques de lectura queden en el prefix conservador, i adjunts, cua d'avisos, denúncies, `xat_lectures` i l'estat de cada persona (arxivat, fixat, silenci, preferit, avisos) es repunten o es fusionen; comprovacions `SDP-XAT-943` a `946` dins de la transacció. Làpides a `private.xat_fils_fusionats`; els grups amb E2EE, IAIA, marques de visibilitat o missatges temporals diferents no es fusionen i van a `private.xat_fusions_pendents` (avís `SDP-XAT-942`). Cap canal d'entitat no porta clau ni es fusiona mai amb un directe personal. El disparador `private.xat_parella_vigent` retira la clau quan una de les dues persones ix del fil, el deixa de veure o s'esborra el seu compte, o quan hi entra una tercera. `crea_fil_directe` busca per clau sota el mateix pany consultiu; mateixa signatura i mateixos permisos (`authenticated`, mai `anon` ni PUBLIC). Abans d'aplicar-la, les consultes de lectura Q1-Q5 (`xat_sql_diagnosi_lectura.sql` de la investigació R24, onada 2) i les de la capçalera. Pany exclusiu sobre `xat_fils` fins al COMMIT: a una hora sense ús i després de la còpia de seguretat. Repetible, també després de la marxa enrere: abans de reconciliar, retira les claus que ja no descriuen una parella viva (exactament dos participants, tots dos de la parella, sense entitat, visibles i no eixits) i el pas 4 les torna a posar on toca. La marxa enrere de la capçalera retira el disparador, l'índex **i les claus**, perquè sense el disparador cap baixa no les buidaria i quedaria l'UUID d'un compte suprimit. **Aplicada a producció** pel Mestre el 17-11-2026 a les 01:55 CET (pas 4 del certificat `../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md`: «Success» després de confirmar «Run without RLS» a l'avís de l'editor SQL, captura `261117_0152_modal_supabase_02a.png` de la mateixa carpeta; SHA-256 `9d52d1fc…`, el mateix fitxer que el de Git). El certificat no exporta cap avís `SDP-XAT-942` ni cap recompte de `private.xat_fils_fusionats` o `private.xat_fusions_pendents`: ho diuen les consultes de lectura de la capçalera. **Pendent (decisió del Mestre):** esta migració crea eixes dues taules amb `REVOKE ALL` i sense RLS, i quan es va aplicar la R29 (`20261115170000`, el 15-11-2026) encara no hi eren; en eixe cas el seu `SQL-R29-06` només avisa (`SDP-R29-010`) i no les tanca. Fins que una lectura no diga el contrari, cal comptar que no tenen RLS. Verificació posterior (lectura): `select c.relname, c.relrowsecurity from pg_catalog.pg_class c where c.oid in (to_regclass('private.xat_fils_fusionats'), to_regclass('private.xat_fusions_pendents')) order by 1;` Prova PostgreSQL 18.6: `tests/xat-directe-canonic-r24-postgres.test.mjs` i `tests/xat-r24-directe-marxa-enrere-postgres.test.mjs`.

- `migrations/20261114061000_r24_xat_rebuts_entrega.sql`

  Onada R24 (`IDEA-260` (b), P0-1 de `xat_entrega`). Va darrere de tot el catàleg; depén de `2611080432` i de `20261113003000`, i si en falta cap peça avorta neta abans de tocar res amb `SDP-XAT-947` (55000), com `SDP-XAT-941`. Crea `private.xat_cursors_altres(uuid, uuid)` (invocadora, cap rol de l'API la pot executar), el rebut i el llegit dels altres d'un fil amb el mateix conjunt humà que `xat_ritme` (visible, no eixit, vigent, no bot i l'altre costat als fils d'entitat), i torna a crear `xat_fils_meus` copiant literalment la R21.9b amb dos canvis: `llegit_pels_altres_fins_seq` ix del helper i la columna nova `rebut_pels_altres_fins_seq` va al final. Els bots lligats es resolen una vegada per fil amb `private.xat_bots_del_fil(uuid)` (cap rol de l'API la pot executar), no per participant. Regla D-1 (decidida pel Mestre el 14-11-2026, decisió D2 de l'Onada R24.2, a `D-xat_entrega-1`): el **mínim** dels destinataris vigents per a tothom, la mateixa semàntica que `xat_ritme`, perquè la llista i el fil obert diguen sempre el mateix; en un directe amb una entitat, el ✓✓ espera tots els gestors vigents. L'alternativa és el màxim, `max(...)`: n'hi ha prou amb un gestor, com WhatsApp Business, i cal canviar alhora el helper i `xat_ritme`. Efecte: el ✓✓ gris («ha arribat a l'aplicació») es veu a la llista i al fil obert sense el ritme; als grups amb la IAIA, el ✓✓ blau ja no l'espera. EXECUTE només a `authenticated`. Si es reaplica `20261113003000`, cal tornar a aplicar esta. El client tolera un servidor sense la columna (no diu res de l'entrega). **Aplicada a producció el 14-11-2026 pel Mestre** (R24) (5/5 true, captura 261114_2339 del Mestre). El 17-11-2026 a les 01:55 CET el Mestre la va tornar a executar sencera, darrere de la `20261114060000` (pas 5 del certificat `../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md`: «Success»; SHA-256 `ce6e49dd…`, el mateix fitxer que el de Git). La sonda de les 01:44 (`r24_xat_prereq_ok = false`) no diu si la del 14-11 hi era: exigix alhora `private.xat_cursors_altres(uuid,uuid)` i l'índex `xat_fils_parella_uq`, que només crea la `20261114060000`. Prova PostgreSQL 18.6: `tests/xat-entrega-r24-postgres.test.mjs`, `tests/xat-r24-entrega-precondicions-postgres.test.mjs` i `tests/xat-r24-entrega-bots-per-fil-postgres.test.mjs`.

- `migrations/20261114171500_r25_2_r23_octet_length_bounds.sql`

  Onada R25.2 (`CODEX-R24.2-T1-02`, kit de Gemini). Depén de `20261113233000` i de `20261114023000` i va darrere de totes dues: sense les taules R23 l'`ALTER TABLE` falla i la transacció no canvia res. Afig `refranys_poble_octets_bounds`, `aportacions_veu_poble_octets_bounds` i `joc_isoglosses_vots_consens_octets_bounds` (`CHECK ... octet_length(...) <= N`, `NOT VALID` i `VALIDATE` dins de la mateixa transacció, `lock_timeout` de 5 s). Cada sostre és 4 vegades el límit de caràcters de la columna R23, que en una base UTF-8 ja implicava eixe màxim d'octets: per a eixes columnes és defensa en profunditat sense efecte nou. L'únic sostre nou efectiu és `explicacio_i18n::text <= 4096` a `refranys_poble`; si una fila existent el supera, `VALIDATE` falla i no s'aplica res. Marxa enrere a la capçalera. Idempotent. **Aplicada a producció el 14-11-2026 pel Mestre** (5/5 true, captura 261114_2339 del Mestre). Verificació posterior (lectura): `select conname, convalidated from pg_catalog.pg_constraint where conname in ('refranys_poble_octets_bounds', 'aportacions_veu_poble_octets_bounds', 'joc_isoglosses_vots_consens_octets_bounds') order by conname;` Prova estàtica: `tooling/gates/__tests__/r25-2-octet-length-sql.test.mjs`.

- `migrations/20261115030000_r28_rgpd_exportacio_i_quotes_r23.sql`

  Onada R28 (decisions del Mestre `D-R24.2-5` i `D-R24.2-6`, model R22.3). Depén de `2611070600`, `20261114000100`, `20261113233000`, `20261114023000` i `20261114171500`, i va darrere de tot el catàleg. La precondició avorta neta abans de tocar res (`SDP-R28-001` a `003`, 55000) si falta `private.peticio_de_servidor()`, alguna taula o columna R23 o la base privada de l'exportació; no comprova els sostres d'octets de `20261114171500`, que cal aplicar abans per l'ordre del catàleg. Quotes per persona amb un disparador `BEFORE INSERT` (`SECURITY DEFINER`, `search_path = ''`) a `aportacions_veu_poble` i a `joc_isoglosses_vots_consens`: com a molt 60 files vives creades en l'última hora i 500 en les últimes 24 hores (`SDP-VEU-429` i `SDP-ISOGLOSSES-429`, 42900) i 2000 files vives en total (`SDP-VEU-QUOTA` i `SDP-ISOGLOSSES-QUOTA`, 53400; el missatge diu quantes en té la persona i el màxim). Les tres xifres compten les files vives, no les escriptures fetes: esborrar-ne (la RLS d'autoria ho permet a l'API) torna a fer lloc tant a la finestra d'una hora o de 24 hores on es van crear com al sostre de 2000. `created_at` és l'hora del servidor en cada alta de l'API, un vot repetit no compta, una fila amb una altra autoria la rebutja la RLS sense mirar la quota de ningú, i el servidor i les sessions sense petició de l'API en queden fora (`private.peticio_de_servidor()`). Un `pg_advisory_xact_lock` per persona i taula serialitza les insercions simultànies, també la d'un vot repetit; un `DELETE` no passa pel disparador, i la carrera que en resulta als vots (esborrar un vot mentre es torna a enviar el mateix el pot tornar a desar sense mirar les finestres, sense fer créixer el total) és a la capçalera, sense prova de concurrència. `refranys_poble` no en porta: no té cap columna d'autoria i cap rol de l'API no hi pot escriure. `exporta_les_meues_dades()` conserva el cos de `2611070600` i hi afig `veu_del_poble` (`aportacions` i `vots_isoglosses`): només les files que la persona ha escrit, amb les columnes que són dades seues i sense `user_id`; cap fila d'una altra persona. Cap `GRANT` nou ni cap política tocada. Si es torna a aplicar la `2611070600` o la `2611011800`, cal tornar a aplicar esta (`ordre_desplegament.json`, `reaplicacio`). Marxa enrere a la capçalera. Transaccional i idempotent. **Aplicada a producció** pel Mestre el 15-11-2026 a les 23:11, després de la `20261114000100` (`pas2_r28_ok = true`, captura `261115_2311`). Verificació posterior (lectura): `select t.tgname from pg_catalog.pg_trigger t where not t.tgisinternal and t.tgname in ('aportacions_veu_poble_limita_ritme', 'joc_isoglosses_vots_limita_ritme') order by 1;` Prova: `tests/r28-rgpd-quotes-r23.test.mjs` (PGlite, catàleg complet).

- `migrations/20261115170000_r29_quotes_rls_i_consens.sql`

  Onada R29 (correccions SQL de la revisió adversarial, `DECISIÓ-R29-02`; `DECISIÓ-R29-03` en va diferir l'aplicació fins al 15-11-2026). Depén de `2610241400`, `20261114000100`, `20261113233000`, `20261114023000`, `2611091500`, `2611110110` i `20261114060000`, i va darrere de tot el catàleg, també de la R28, que no necessita. La precondició avorta neta abans de tocar res (`SDP-R29-001` i `002`, 55000) si falta `private.peticio_de_servidor()`, `private.ha_acceptat_normes(uuid)`, alguna taula R23 o el resum del consens. `SQL-R29-06`: RLS activada, sense cap política, a `private.xat_fils_fusionats` i `private.xat_fusions_pendents` (si no hi són, avís `SDP-R29-010` i res més). `SQL-R29-03`: disparadors `BEFORE INSERT` `aportacions_veu_poble_exigix_normes` i `joc_isoglosses_vots_exigix_normes`: qui escriu per l'API sense les normes vigents rep `SDP-MOD-428` (42501), també amb un vot repetit, i pel nom la porta va abans de les quotes de la R28; la pertinença no s'exigix (les taules R23 no tenen `tenant_id`). `SQL-R29-01`: `aportacions_culturals_limita_ritme` (20 en una hora i 100 en 24 hores, `SDP-CULTURA-429`, 42900; 500 desades i 8 MiB de text, `SDP-CULTURA-QUOTA`, 53400; `creat_a` del servidor; `envia_aportacio_cultural` no es toca) i `revisions_patrimoni_quota` (1000 revisions desades i 8 MiB per persona, `SDP-PATRIMONI-QUOTA`, 53400; la taula no té data d'alta i no s'hi afig cap columna, de manera que no hi ha finestres; una edició pròpia que fa créixer la fila també mira els 8 MiB). Totes dues amb un `pg_advisory_xact_lock` per persona, un lot que passa el sostre cau sencer i el servidor en queda fora; si la taula no hi és, avís `SDP-R29-011` o `012`, cap disparador, i cal tornar a aplicar esta quan s'aplique la seua migració. `SQL-R29-02` i `SQL-R29-04`: `resum_consens_isoglosses_poble(text)`, mateixa signatura i permisos, només amb les dotze preguntes del joc (`PREGUNTES_ISOGLOSSES`: 12 × 20 = 240 files, dins de les 250) i amb l'etiqueta triada només entre les que tenen el mot de la clau (la regla de `clauDeMot`); si cap no hi casa, ix la clau. Una pregunta nova al joc vol dir una migració nova. No posa el fusible global de mida ni modera les variants noves (decisions del Mestre). Si es torna a aplicar la `20261114023000`, cal tornar a aplicar esta (`ordre_desplegament.json`, `reaplicacio`). Marxa enrere a la capçalera. Transaccional i idempotent. **Aplicada a producció** pel Mestre el 15-11-2026 a les 23:11, després de la R28 (`pas3_r29_ok = true`, captura `261115_2311`); com que la `2611110110` encara no hi era, el disparador `revisions_patrimoni_quota` es va crear el 16-11-2026 en aplicar-la (`pas3_patrimoni_quota_ok = true`, captura `261116_1503`). Verificació posterior (lectura): `select t.tgrelid::regclass::text as taula, t.tgname from pg_catalog.pg_trigger t where not t.tgisinternal and t.tgname in ('aportacions_veu_poble_exigix_normes', 'joc_isoglosses_vots_exigix_normes', 'aportacions_culturals_limita_ritme', 'revisions_patrimoni_quota') order by 1, 2;` Prova: `tests/r29-quotes-rls-i-consens.test.mjs` (PGlite, catàleg complet).

- `migrations/20261115230000_r30_revisions_editorials_cas.sql`

  R30 P1-79: depén de `2611110455`. `desa_revisio_editorial_wp_cas` compara atòmicament `actualitzat_a`, bloqueja també la primera inserció i conserva la signatura antiga només per a crear. Token nul significa absent; una fila existent exigix token llegit. Si es reaplica `2611110455`, cal tornar a aplicar esta per conservar la guarda CAS de la signatura antiga (`ordre_desplegament.json`). El client R32.10 conserva l’esborrany al navegador si falta la RPC CAS (404 + PGRST202 exacte) i retorna `no-disponible`: no intenta la signatura antiga, que sense esta migració podria fer un upsert sense guarda. Els clients anteriors a R30 que continuen oberts (PWA en memòria cau, paquets de WordPress sense actualitzar) només podien crear revisions noves fins que s’aplicara. **Aplicada a producció** pel Mestre el 16-11-2026, després de la `2611110455` (`pas1_wp_cas_ok = true`, captura `261116_1503`; bytes idèntics als de Git). Proves locals PGlite: `tests/r30-editorial-cas.test.mjs`, `tests/r30-editorial-cas-cataleg.test.mjs` i `tests/r30-independent-cas-aal-null.test.mjs`.

- `migrations/20261116031000_r31_push_sessio_i_revocacio.sql`

  R31 (kit de Codex, integrat a l'Onada R32). Depén de 2611080431. Vincula cada registre a `auth.jwt()->>'session_id'` i comprova `auth.sessions.id/user_id`; el logout Auth elimina els registres per FK `ON DELETE CASCADE`, inclòs el global. Es revoquen les files llegades sense sessió demostrable: recarregar/reiniciar els clients per renovar el registre, perquè una memòria web encara oberta pot recordar el desat anterior. No es concedix lectura de `sessio_id` ni d'adreces i no es canvia el port neutre. **Aplicada a producció** pel Mestre el 16-11-2026 (`pas2_push_sessio_ok = true`: el disparador `xat_push_vincula_sessio_r31` existix; captura `261116_1503`; bytes idèntics als de Git); la capçalera del SQL conserva el text d'abans d'aplicar-la, perquè una migració aplicada no canvia de bytes. **Pendent:** les claus Push VAPID/FCM/APNs i la prova en aparells físics no estan verificades, i cap prova local acredita que el logout real de GoTrue esborre la sessió. Un avís ja acceptat pel proveïdor abans de logout no es pot retirar. Idempotència, RLS, JWT revocat encara no caducat i A→B en telèfon compartit: `tests/r31-push-sessio-postgres.test.mjs` amb PGlite explícit.

- `migrations/20261116040000_r31_definer_search_path.sql`

  R31 ADD118 (kit de Codex, integrat a l'Onada R32). Depén de `20261116031000` i de tot el catàleg anterior: en este repositori és la migració 116, perquè les `20261115231000` i `20261115233000` del kit R30 no formen part del catàleg (la capçalera diu «catàleg complet117» amb la numeració del kit). Fixa `search_path = ''` de 29 funcions `SECURITY DEFINER` vigents amb precondicions SHA-256 del cos auditat o de la postimatge idempotent; qualsevol deriva desconeguda avorta abans de canviar res. 27 `ALTER FUNCTION` preserven el cos; `private.mur_anti_resurreccio()` i `public.xat_verifica_prerequisits_e2ee()` qualifiquen les relacions de `pg_catalog`, i este últim comprova el nou contracte de path buit sense retirar les comprovacions d'ACL/RLS/autoritat. Conserva propietari, OID, signatures i ACL; no modifica migracions històriques ni concedix permisos. Els paths explícits anteriors no són per si sols 29 vulnerabilitats demostrades. **Aplicada a producció** pel Mestre el 16-11-2026 (29/29 funcions auditades amb `search_path` buit; captura `261116_1503`; bytes idèntics als de Git). Producció conservava 7 funcions `SECURITY DEFINER` heretades fora de Git sense path buit (`check_market_rate_limit()`, `clean_expired_push_subscriptions()`, `log_push_notification(uuid,text,jsonb,boolean,text)`, `mark_messages_as_read(uuid,uuid)`, `omega_invalidate_stale_translations()`, `omega_set_default_parent_id()` i `refresh_entity_member_map()`; captura `261116_1508`), i esta migració no les toca: les blinda la `20261116170000`, aplicada pel Mestre el 17-11-2026 a les 01:55 CET (vegeu-ne la vinyeta; la sonda posterior encara no consta exportada). Prova PGlite del catàleg anterior més esta migració, reaplicació, descriptors/ACL, `pg_temp`, historial/E2EE i denegacions: `tests/r31-definer-search-path.test.mjs`. La fixture substituïx Auth/Storage/Realtime, sense acreditar Supabase remot. Reaplicar esta migració si es reinstal·len definicions històriques dels objectes auditats, després de revalidar els hashes i el catàleg.

- `migrations/20261116170000_r32_fossils_search_path.sql`

  R32 (kit de Codex, integrat a l'Onada R32.2). Depén de `20261114000100` i va darrere de `20261116040000`. Fins al 17-11-2026, producció conservava els 7 fòssils sense path buit (captura `261116_1508`, vinyeta de `20261116040000`). Primer exporta la sonda `snippets/r32_7_fossils_sonda.sql` (7 files, DDL íntegre, prosrc SHA-256, ACL, propietari i disparadors), i torna a passar-la després: una funció absent se salta sense avís, de manera que només la sonda diu quantes de les 7 han quedat amb `search_path` buit. La sonda i la migració identifiquen cada fòssil per la signatura exacta (`to_regprocedure`): una sobrecàrrega del mateix nom amb altres arguments hi consta absent i no es blinda, i per això el Mestre la busca també pel nom a `pg_catalog.pg_proc` abans d'aplicar. No hi ha consumidor al client, Edge Functions ni migracions canòniques de les 7 funcions, excepte la revocació de R22.2; els crons/consumidors remots queden per inventariar. La migració **conserva totes les funcions**: només admet els cossos literals revisats de la fixture R22.2, qualifica les relacions `public.*`, fixa `search_path = ''` amb set `ALTER FUNCTION` literals qualificats i conserva un backup íntegre privat per signatura. La requalificació de les relacions és un `CREATE OR REPLACE` dinàmic (`execute replace(...)` sobre `pg_get_functiondef`, només damunt dels cossos literals revisats): `tooling/gates/tractor-rls.mjs` hi dona 0 infraccions, però el marca com a R1 *detection-unknown* i no l'acredita. Sense cap fòssil no en blinda cap, tot i que crea igualment la taula privada del backup, buida. Un cos o una configuració inicial no revisats avorten; l'ACL i el propietari només es contrasten amb el backup quan es reaplica (`SDP-R32-FOSSIL-002`): a la primera aplicació, l'ACL vigent queda com a línia base, i per això la sonda l'exporta abans. La discrepància entre 3 hashes transcrits al receptari i les fixtures exigix exportar abans d'aplicar, mai substituir pins a cegues. `snippets/r32_7_fossils_rollback.sql` restaura només si el DDL encara és el que s'ha aplicat; el backup queda intacte. **Aplicada a producció** pel Mestre el 17-11-2026 a les 01:55 CET (pas 3 del certificat `../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md`: `COMMIT` després del `pg_advisory_xact_lock`; SHA-256 `20c5514f…`, el mateix fitxer que el de Git), precedida de la sonda conjunta de només lectura de les 01:44 (`resultat_sonda_produccio_261117_0144.json` de la mateixa carpeta, exportada amb `01_sonda_prevol_r32_read_only.sql`, no amb el snippet): els 7 fòssils hi eren per la signatura exacta, i el `source_sha256` exportat de cada un és literalment un dels pins d'esta migració, de manera que la discrepància del receptari R30/R31 ja no bloquejava res. **Pendent:** la sonda posterior (`snippets/r32_7_fossils_sonda.sql` després d'aplicar) no consta exportada a la carpeta del certificat; fins que hi siga, que les 7 tinguen el `search_path` buit i la còpia a `private.r32_fossils_backup` ho diu el certificat, no una lectura registrada. La marxa enrere és disponible i no s'ha executat. Prova PGlite: `tests/r32-fossils-i-xat-rebase-pglite.test.mjs`.

- `migrations/20261116170100_r32_xat_propi_rebase_r24.sql`

  R32 (kit de Codex, integrat a l'Onada R32.2). Depén de `20261114061000` i exigix la cadena R24 (cursors, parella i RPC compatibles). Reaplica només columna/índex/CHECK i dos helpers de trigger del fil propi de 2611121630: deixa intactes `xat_participant_vigent` R21.9b, `crea_fil_directe` R24 i `xat_fils_meus` R24, inclosos `canal_clau` i `rebut_pels_altres_fins_seq`. Idempotent amb missatges existents; cap DROP FUNCTION, canvi de signatura ni esborrat de dades. La migració antiga 2611121630 es conserva per al replay històric inicial; **mai reaplicar-la sobre R24**. Marxa enrere no destructiva: restaurar els dos helpers de trigger exportats abans, conservant columna/índex/files pròpies. **Aplicada a producció** pel Mestre el 17-11-2026 a les 01:55 CET, darrere de les dues R24 (pas 6 del certificat `../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md`: «Success. No rows returned»; SHA-256 `45f8f5d9…`, el mateix fitxer que el de Git), encara que segons el T2 del 13-11-2026 no hi calia (vinyeta de `2611121630`). La marxa enrere de la capçalera és disponible i no s'ha executat. Replay complet PGlite i contraproves al mateix test R32.

- `migrations/20261116170200_r32_baixa_sessions_atomiques.sql`

  R32 (kit de Codex, integrat a l'Onada R32.2): depén de `20261114000100`, va darrere de `20261116040000` i conserva la guarda de purga iniciada de `2611110100`. Backup privat íntegre de demana_baixa/cancela_baixa, pany per persona i revocació de sessions sense catch silenciós. Quarantena conservada, rollback en `snippets/r32_baixa_sessions_rollback.sql` (disponible, no executat). Abans d'aplicar-la, el Mestre exporta `pg_get_functiondef` de `public.demana_baixa(text)` i `public.cancela_baixa()`: qualsevol deriva de cos o de configuració rebutja tot el lot (`SDP-R32-BAIXA-005`). **Aplicada a producció** pel Mestre el 17-11-2026 a les 01:55 CET, la primera de les cinc (pas 2 del certificat `../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md`: `COMMIT` després del `pg_advisory_xact_lock`; SHA-256 `dbfed00b…`, el mateix fitxer que el de Git). La sonda conjunta de les 01:44 (`resultat_sonda_produccio_261117_0144.json`) n'havia exportat abans les dues definicions, i el `source_sha256` de cada una és literalment el pin d'esta migració. Prova: `tests/r32-baixa-sessions-pglite.test.mjs`.

- `migrations/20261117140000_r32_5_lssi_revisio_cautelar.sql`

  R32.5 · P0-114 (kit de Codex R32.5, integrat a l'Onada v1.2.7). Depén de `2610201500` (`public.denuncies` i la quota serialitzada del seu disparador), `2611122200` (`public.denuncia_publicacio_mur`, que resol el contingut al servidor) i `20261116040000`; usa també `private.mur_publicacions_revocades` (`2611121430`), `private.copub_compte_actiu` (`2611111735`) i `private.es_superadmin` (`2610061448`, amb AAL2), totes anteriors. Cap taula nova de denúncies. Crea l'auditoria privada `private.lssi_revisions` (RLS activa, `revoke all` a `public`, `anon`, `authenticated` i `service_role`; el revisor és nul·lable amb `on delete set null`, perquè la purga d'un compte no bloquege la decisió) i dues RPC `security definer` amb `search_path` buit: `admin_safata_denuncies_lssi(text,integer)` (filtre d'estat i límit d'1 a 100) i `admin_revisa_denuncia_lssi(uuid,text,text,text)` (revisada, desestimada o retirada). Totes dues exigixen superadmin real amb compte actiu i AAL2 al servidor (`SDP-LSSI-403`). L'ordre de panys és fila de la denúncia → pany consultiu `sdp:mur:` → fila de la publicació: el consultiu precedix la fila de la publicació, com a publica/revoca. La retirada cautelar canvia només `moderation_state` a `retirada_cautelar`: cap `delete`, ni canvi de `visibility`, payload, autoria o data original; cap retirada per nombre de denúncies. El reintent idèntic del mateix revisor és idempotent; una decisió incompatible falla amb 40001. Idempotent en tornar-la a passar (`create table if not exists`, `drop constraint if exists`, `create or replace`). Verificació posterior de només lectura: `select to_regprocedure('public.admin_safata_denuncies_lssi(text,integer)') is not null and to_regprocedure('public.admin_revisa_denuncia_lssi(uuid,text,text,text)') is not null and to_regclass('private.lssi_revisions') is not null as lssi_r32_5;` (`true` després d'aplicar-la). **NO aplicada: l'aplica el Mestre**, mai un agent, a cap base. El catàleg complet passa a 121 fonts i el Node 0 en té el pin POSSE 121 (`tooling/node0/posse/posse-ledger.sql`; es conserven els de 114, 116, 119 i el 120 d'R32.4, sense esta migració). El perfil 120 del kit (els 119 d'R32.2 més esta, sense `20261117150000`) no és cap catàleg publicat i no s'accepta. Proves: `tests/r32-5-lssi-postgres.test.mjs` (PostgreSQL natiu local: RLS, quota concurrent, replay i retirada cautelar), `src/data/supabase/lssi.r325.test.js`, `tests/r32-posse-cataleg.test.mjs` i `tests/node0-posse-sql.cases.mjs`; no certifiquen el servei remot ni el compliment legal integral.

- `migrations/20261117150000_r324_copublicacio_pagina_sistema_nervios.sql`

  R32.4 (lot_01 de Gemini, completat a l'Onada v1.2.6). Depén de `2611111735`, que crea `private.recursos_copublicacio_paquet` i diu a la capçalera que «una ampliació del paquet afig els IDs a este registre amb la seua pròpia migració»: és la primera d'eixes ampliacions. Afig una sola fila, la pàgina pública `/page/sistema-nervios` (`tipus = 'pagina'`, `recurs_id = 'sistema-nervios'`, sense `origen_clau`), perquè `PAGE_COPY` passa de 34 a 35 claus i el contracte de `src/data/copublicacio.migracio.test.js` exigix que el registre les cobrisca totes. Sense ella, `private.copub_recurs` no reconeix la pàgina com a peça del paquet i no en resol l'autoria editorial oficial, llevat que el poble l'haja desada a `app_content`. Additiva i idempotent (`on conflict (tipus, recurs_id) do nothing`): no esborra ni modifica cap fila, no crea cap objecte i no concedix cap permís. Verificació posterior de només lectura: `select count(*) as sistema_nervios from private.recursos_copublicacio_paquet where tipus = 'pagina' and recurs_id = 'sistema-nervios';` (1 després d'aplicar-la). **NO aplicada: l'aplica el Mestre**, mai un agent, a cap base. El catàleg complet passa a 120 fonts i el Node 0 en té el pin POSSE (`tooling/node0/posse/posse-ledger.sql`; es conserven els de 114, 116 i 119). Proves: `src/data/copublicacio.migracio.test.js`, `tests/copublicacio-postgres.test.mjs` (dues aplicacions seguides, una sola fila) i `tests/r32-posse-cataleg.test.mjs`. A l'Onada v1.2.7, la R32.5 `20261117140000`, de versió anterior, la desplaça a la fila 121 de la taula canònica; el pin 120 es conserva com a perfil històric.

- `migrations/20261117173000_r32_7_xat_reaccions_destacats_fixats_amagats.sql`

  R32.7 (kit de Codex R32.7, integrat a l'Onada v1.2.8). Depén de `public.xat_fils`, `public.xat_missatges` i dels ajudants `private.es_participant`, `private.seq_visible` i `private.es_admin_del_fil` (si en falta cap, falla amb `SDP-XAT-ACCIONS-DEPENDENCY` abans de tocar res). Reaccions, destacats, missatges fixats i «esborra per a mi» sobre missatges visibles; cap contingut ni identitat d'operador d'entitat ix del lot i els cursors/seq del xat no es modifiquen. **NO aplicada: l'aplica el Mestre.** Prova executable: `tests/r327-xat-accions-pglite.test.mjs` (amb `SDP_PGLITE_MODULE`). Estat vigent: aplicada a producció el 19-11-2026 a les 18:02 CET (Super-Bundle R32.14, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`).

- `migrations/20261117193000_r32_8_xat_quota_250mb_video_60s_i_ubicacio.sql`

  R32.8 (kit de Codex R32.8, integrat a l'Onada v1.2.8). Depén de `20261116040000` (search_path buit i RPCs E2EE vigents) i de `public.xat_adjunts`. Additiva: quota acumulada de 250 MB per persona, vídeo fins a 60 s i ubicació explícita; la RPC de tres arguments conserva OID, cos, owner i ACL, i la sobrecàrrega de quatre arguments no té valors per defecte. No amplia el bucket de 20 MB ni la mida per tipus ni toca RLS/ACL existents. S'ha d'aplicar abans del client que envia `p_ubicacio`. **NO aplicada: l'aplica el Mestre.** Prova executable: `tests/r328-xat-quota-video-ubicacio-postgres.test.mjs`. Estat vigent: aplicada a producció el 19-11-2026 a les 18:02 CET (Super-Bundle R32.14, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`).

- `migrations/20261118230000_a03_xat_push_credencials_per_configuracio.sql`

  P1-74 (A-03). Depén de `2611020417`. Additiva: crea `private.xat_push_credencials_v2` (una credencial nativa per proveïdor i empremta pública de la configuració, RLS sense cap política) i les RPC `public.xat_push_credencial_v2(text, text)` i `public.xat_push_desa_credencial_v2(text, text, text, timestamptz)`, només per a `service_role`, amb `search_path` buit, les mateixes comprovacions que les v1 (`SDP-PUSH-005`), «desa només si dura més» dins de cada configuració, esborrat de les caducades del proveïdor en desar i un sostre de quatre vives per proveïdor (`SDP-PUSH-014`). No toca la taula ni les RPC v1: un worker que encara no s'ha tornat a desplegar continua amb la seua fila única, i rotar `SDP_APNS_*` o `SDP_FCM_COMPTE_SERVEI` ja no obliga a apagar el cron (vegeu «Funció `notifica-xat`»). S'aplica abans de desplegar el `natius.js` que crida les `_v2`. Idempotent. **NO aplicada: l'aplica el Mestre.** Proves: `tests/a03-push-credencials-postgres.test.mjs` (PGlite explícit), `supabase/functions/notifica-xat/natius.test.js` («A-03: dues configuracions natives alhora») i `src/data/supabase/xatAvisosPush.migracio.test.js`. Estat vigent: aplicada a producció el 19-11-2026 a les 18:02 CET (Super-Bundle R32.14, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`).

- `migrations/20261119143000_r32_14_xat_fils_previa_sense_amagats.sql`

  R32.14 · Vista prèvia privada abans de carregar el fil. Depén de `20261117173000` i `20261114061000`. Redefinix `public.xat_fils_meus(uuid)` amb el mateix OID, signatura i rebuts: `ultim_text`, `ultim_al`, `ultim_autor_id` i `ultim_tipus` provenen de la mateixa darrera fila visible i no amagada per `auth.uid()`. Exclou també missatges esborrats, caducats i història buidada. La data canònica continua sent `ultim_al`; cap canvi de seq/cursors/comptadors ni cap concessió de SELECT a la taula d'amagats. Idempotent, transaccional i amb pins del cos anterior/final; la deriva desconeguda avorta. **NO aplicada: l'aplica el Mestre.** Prova executable: `tests/r3214-bundle-xat-postgres.test.mjs`, PostgreSQL 18.6 natiu amb dues sessions i PGlite. El perfil Node 0 passa a 125 fonts amb pin exacte, preservant els 16 perfils històrics. Estat vigent: aplicada a producció el 19-11-2026 a les 18:02 CET (Super-Bundle R32.14, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`).

- `migrations/20261121090000_r32_25_push_directes_i_bandols.sql`

  R32.25. Preparada i provada localment en PostgreSQL 18.6 natiu i PGlite; **NO aplicada a Producció**. Depén de `2611080431`, `2611122200`, `20261116031000` i `20261118230000`. Worker compatible primer; després la migració, que deixa `push_poble_actiu = no`. La provisió push (`tooling/push/aprovisiona-push.mjs`) **no** la porta: el seu `staged/schema.sql`, pas 1 de l'activació T-03 del Canal 1, acaba en `20261118230000`. Cal fer T-03 sencer amb el worker `notifica-xat` de la v1.2.17 (porta `funcio-notifica-xat-r32-25` d'`ordre_desplegament.json`) i només després aplicar esta migració, a part. Si mai es torna a passar `staged/schema.sql`, que reaplica `2611020417` i `2611080431`, cal tornar a aplicar `20261121090000` després (`reaplicacio` d'`ordre_desplegament.json`). D-24: deu directes nous per remitent en 24 hores. Bàndols city_hall del mateix poble amb consentiment, màxim dos en 24 hores, separació de deu minuts i silenci 22:00–08:00 Europe/Madrid. Detall i límits al final d’este document.

- `migrations/20261122160000_r3242_ajuntament_acreditacio_institucional.sql`

  R32.42 · lot 02 de Codex (IDEA-276 / DOL-42), integrat a la v1.2.22. **Aplicada a Producció la nit del 23 al 24-11-2026:** l'ha aplicada l'integrador al T2 de la v1.2.23, per encàrrec del Mestre (pla 261123_1246, D-V1223-SQL), amb els bytes del commit pujat. Transaccional. Afig `claimed` (per defecte `false`) i `municipi_ine` a `public.organizations`, amb un índex únic d'un sol `city_hall` amb INE per poble, i les exposa a `anon` i `authenticated` i, al final de les columnes, a la vista `public.organization_directory`. Crea `private.ajuntament_municipis_ine` (8.132 municipis de `src/data/nomenclator/municipis_ine_2026_espanya.v1.json`, sense grants a `anon` ni `authenticated`) i sembra una fitxa `city_hall` pública i neutral, sense propietària (`created_by` nul, `claimed = false`), només per a cada poble obert sense ajuntament el nom del qual coincidix literalment, i amb un sol municipi, amb un nom oficial o una variant documentada; els noms ambigus no s'assignen, el sembrat és idempotent i no esborra ni modifica cap fila existent. L'acreditació passa per tres RPC `SECURITY DEFINER` amb `search_path` buit, només per a `authenticated`: `registra_domini_ajuntament(uuid,text,text)` i `resol_acreditacio_ajuntament(uuid,boolean,text)` (superadmin, sense autorevisió) i `sollicita_acreditacio_ajuntament(uuid,text)` (correu verificat d'un domini municipal registrat), amb rastre a les taules privades `private.ajuntament_dominis_oficials`, `private.ajuntament_acreditacions` i `private.ajuntament_auditoria`. Redefinix `private.add_organization_owner()`, `public.sollicita_reclamacio(uuid,text)` i `public.resol_reclamacio(uuid,boolean)` (un `city_hall` ja no passa per la reclamació genèrica: `SDP-AJT-020`; des de la v1.2.23, M3-01, el missatge de `sollicita_reclamacio` diu «usa sollutia acreditació institucional») i `public.pot_signar_com_organitzacio(uuid,uuid)` de `2611011500`: un ajuntament només signa si està acreditat (`claimed`) i és del mateix poble. **Avís per al Mestre abans d'aplicar-la:** els ajuntaments que ja existixen queden amb `claimed = false`, i les seues titulars no poden signar com a ajuntament (restricció `section_submissions_autoria_org_valida`) fins que se'n resol la regularització (`sollicita_acreditacio_ajuntament` amb la mateixa titular, auditada com a `regularitzada`). La regularització exigix que la titular tinga un correu verificat d'un domini municipal que una superadmin haja registrat abans amb `registra_domini_ajuntament`: sense això, `sollicita_acreditacio_ajuntament` falla amb `SDP-AJT-004` (cap correu verificat) o `SDP-AJT-005` (domini municipal no acreditat), i una titular amb un correu genèric no pot regularitzar. Sol·licitar-la no basta: cal que una superadmin diferent l'aprove amb `resol_acreditacio_ajuntament` (`SDP-AJT-013` prohibix l'autorevisió), i és eixa aprovació la que posa `claimed = true`. L'AAL2 de superadmin la posa `2610061448`, NO aplicada segons el bolcat del 13-11-2026: sense ella, `private.es_superadmin()` no exigix aal2. **Sonda prèvia de només lectura, a l'editor SQL i abans d'aplicar-la**, que ha de tornar 0 files: `select c.id, c.organization_id, c.user_id, c.created_at from public.organization_claims c join public.organizations o on o.id = c.organization_id where o.kind = 'city_hall' and c.estat = 'pendent';`. Cada fila és una reclamació genèrica (`sollicita_reclamacio`) pendent sobre un ajuntament; n'hi pot haver si un `city_hall` s'ha quedat en algun moment sense owner (per exemple, perquè s'ha esborrat el compte de la titular) i algú l'ha reclamat per la via genèrica. Des de la v1.2.23 (M3-01), si se n'escapa alguna, la via genèrica no l'aprova mai (`resol_reclamacio(…, true)` dona `SDP-AJT-020`), però una superadmin la pot rebutjar després de la migració amb `resol_reclamacio(<id>, false)` des d'una sessió `authenticated` (a l'editor SQL no hi ha `auth.uid()`), amb el rastre `reclamacio_generica_rebutjada` a `private.ajuntament_auditoria`; una sol·licitud institucional (amb fila a `private.ajuntament_acreditacions`) no es pot rebutjar per eixa via (`SDP-AJT-020`) i `resol_acreditacio_ajuntament` no resol una reclamació genèrica (`SDP-AJT-012`). Mentre estiga pendent, per l'índex únic `idx_claims_una_pendent`, la mateixa persona no pot sol·licitar l'acreditació d'eixe ajuntament: rep una violació d'unicitat, no un codi `SDP-AJT`. El camí preferent continua sent la sonda: si en torna alguna, el Mestre la tanca a la mateixa sessió, abans d'aplicar la migració, amb `update public.organization_claims set estat = 'rebutjada', resolta_at = now() where estat = 'pendent' and id in (…);` (els `id` de la sonda), i repetix la sonda fins que torne 0 files; després de la migració, eixa persona pot demanar l'acreditació institucional. El client v1.2.22 no té cap camí d'acreditació: cap fitxer de `src/`, `tooling/` ni `scripts/` no crida `registra_domini_ajuntament`, `sollicita_acreditacio_ajuntament` ni `resol_acreditacio_ajuntament`, que només es criden a mà amb una sessió `authenticated`. Tampoc no té cap interfície muntada de reclamació genèrica: `reclamaOrganitzacio` només la crida `useAdministrarOrganitzacio`, que només fa servir `BlocAdministrarOrganitzacio`, i este bloc ja no es munta; cap pantalla no arriba a `SDP-AJT-020`. Depén de `2609080000` (`public.organization_claims` i `public.towns`), `2610081401` (`public.organization_directory`) i `2611011500`. Proves: `tests/r3242-ajuntament-sql.test.mjs` (PGlite amb `SDP_PGLITE_MODULE`; PostgreSQL natiu amb `SDP_R3242_SQL_ENGINE=native`) i `src/data/supabase/perfils.ajuntament.r3242.test.js` (el `claimed` del DTO és estricte i les rutes municipals, reversibles). Amb les tres R32.42, el catàleg arriba a 129 fonts. A la v1.2.23 (L4-10 i M3-01) el pin POSSE 129 del Node 0 es recalcula amb els bytes nous de `20261122160000` i `20261122160300` (`04b61ce7…`, recalculat al Gauntlet R2 de la v1.2.23 amb els bytes nous de `20261122160000`; el `7e3d0a4b…` d'abans i el `75dab97b…` de la v1.2.22 deixen de valer, i cap base no els havia aplicat) i s'afig el complet exacte 131 amb R32.44 i R32.46 (`c279b24d…`, recalculat al Gauntlet R2 de la v1.2.23 amb els bytes esmenats de `20261122160000` i `20261122230000`; el `3a3fb97f…` del Gauntlet R1 i el `56779e00…` d'abans deixen de valer), tots dos a `tooling/node0/posse/posse-ledger.sql`; es conserva el 126 de la v1.2.17.
  Estat vigent: aplicada a producció la nit del 23 al 24-11-2026 (T2 de la v1.2.23, `REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`).

- `migrations/20261122160200_r32_42_xat_ubicacio_dos_decimals.sql`

  R32.42 · lot 03 de Codex (DOL-55 / L1-03), integrat a la v1.2.22. **Aplicada a Producció la nit del 23 al 24-11-2026:** l'ha aplicada l'integrador al T2 de la v1.2.23, per encàrrec del Mestre (pla 261123_1246, D-V1223-SQL), amb els bytes del commit pujat. Depén de `20261117193000` (la RPC de quatre arguments dels adjunts amb ubicació). Transaccional. Crea el disparador `aa_xat_ubicacio_dos_decimals` (`BEFORE INSERT OR UPDATE` a `public.xat_missatges`) amb `private.xat_ubicacio_dos_decimals()` (`SECURITY DEFINER`, `search_path` buit, sense `EXECUTE` per a `public`, `anon`, `authenticated` ni `service_role`): `metadades.ubicacio` només admet `lat` i `lng` numèrics dins de rang (`SDP-XAT-009` si no), es desa arrodonida a dos decimals i un `null` explícit la lleva, també per als clients antics que envien més precisió. En la mateixa transacció reescriu a dos decimals les ubicacions ja desades, sense marxa enrere (la precisió anterior es perd), i després afig el `CHECK` `xat_ubicacio_dos_decimals`. No canvia RLS, ACL ni signatures. Verificació posterior de només lectura, que ha de tornar `true` a les dues columnes: `select exists(select 1 from pg_catalog.pg_trigger where tgrelid = 'public.xat_missatges'::regclass and tgname = 'aa_xat_ubicacio_dos_decimals' and not tgisinternal) as disparador_present, exists(select 1 from pg_catalog.pg_constraint where conrelid = 'public.xat_missatges'::regclass and conname = 'xat_ubicacio_dos_decimals') as check_present;`. Prova: `tests/r3242-xat-ubicacio-postgres.test.mjs` (PostgreSQL natiu; PGlite amb `SDP_R3242_ENGINE=pglite`). La part de client del mateix lot (els vídeos MP4/MOV s'acrediten sense GPS abans de reservar o de reenviar; si no, `video-no-acreditable`) la prova `src/data/supabase/xatMultimedia.privacitatVideoIMur.r3242.test.js`.
  Estat vigent: aplicada a producció la nit del 23 al 24-11-2026 (T2 de la v1.2.23, `REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`).

- `migrations/20261122160300_r32_42_mur_visibilitat_publica.sql`

  R32.42 · lot 03 de Codex (L1R2-01), integrat a la v1.2.22; la RPC7 es renomena a la v1.2.23 (L4-10). **Aplicada a Producció la nit del 23 al 24-11-2026:** l'ha aplicada l'integrador al T2 de la v1.2.23, per encàrrec del Mestre (pla 261123_1246, D-V1223-SQL), amb els bytes del commit pujat. Depén de `2611122200` (`public.llig_mur_public` de sis arguments, RPC6, que conserva OID i valors per defecte). Transaccional. Crea la RPC7 amb nom propi, `public.llig_mur_public_v7(boolean,uuid,text,integer,timestamptz,uuid,boolean)` (`SECURITY DEFINER`, `search_path` buit, `EXECUTE` només per a `anon` i `authenticated`): el primer paràmetre, `p_inclou_visibilitat`, és obligatori i no té valor per defecte; amb `true` afig a cada fila de RPC6 només `mostrar_al_mur` (derivat de `mostrarAlMur` i `ocultarDelMur` del payload; `false` davant d'un valor no booleà o contradictori), després que RPC6 haja filtrat files, permisos i paginació. El flag és editorial: no retira la fitxa del Mercat ni del Calendari. Des de la v1.2.23 no és cap sobrecàrrega de `public.llig_mur_public`: la de la v1.2.22 (mateix nom, amb el boolean primer) feia ambigua en SQL una crida posicional amb el primer argument sense tipus (42725). La migració esborra eixa signatura, i només eixa, si alguna base l'haguera rebuda (`drop function if exists`; per això l'editor SQL de Supabase avisa d'una operació destructiva), i avisa PostgREST perquè torne a llegir l'esquema. El kit demana aplicar-la abans de servir el client; el client només la negocia si es construïx amb `VITE_SDP_MUR_VISIBILITAT=1` (`negociaVisibilitatMur`, a `src/data/supabase/content.js`; cap build ho fa): sense la bandera llig directament la RPC6, que no porta el flag, i amb la bandera prova primer `llig_mur_public_v7` i, davant d'un 404 PGRST202, torna a la RPC6. Verificació posterior de només lectura, que ha de tornar `true` a les dues columnes: `select to_regprocedure('public.llig_mur_public_v7(boolean,uuid,text,integer,timestamptz,uuid,boolean)') is not null as rpc7_present, to_regprocedure('public.llig_mur_public(boolean,uuid,text,integer,timestamptz,uuid,boolean)') is null as sense_sobrecarrega;`. Proves: `tests/r3242-xat-ubicacio-postgres.test.mjs` (subproves de la RPC7, cap sobrecàrrega i neteja de la signatura de la v1.2.22), `tests/r32-5-lssi-postgres.test.mjs` (la retirada cautelar LSSI també amaga la fila a la RPC7) i `src/data/supabase/content.visibilitatMur.r3242.test.js`.
  Estat vigent: aplicada a producció la nit del 23 al 24-11-2026 (T2 de la v1.2.23, `REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`).

- `migrations/20261122230000_r3244_edicio_propia_i_page_revisions.sql`

  R32.44, dependència de la base reconciliada de QA C3. Preparada en Kit CAS; sense aplicació remota en esta verificació. **Aplicada a Producció la nit del 23 al 24-11-2026:** l'ha aplicada l'integrador al T2 de la v1.2.23, per encàrrec del Mestre (pla 261123_1246, D-V1223-SQL), amb els bytes del commit pujat. Edició pròpia amb control de versió i revisions de pàgina append-only. Transaccional, amb `lock_timeout` de 5 s i `statement_timeout` de 60 s. Crea el disparador `zzz_r3210_beta_token` (`BEFORE UPDATE` a `public.section_submissions`, amb `private.publicacions_beta_token()`, sense `EXECUTE` per a cap rol), que s'executa a cada UPDATE de la taula i avança `updated_at` almenys un microsegon. A Producció conviu amb `zzz_r3211_publicacions_cas_token` del paquet manual R32.11, que fa el mateix càlcul: es disparen per ordre alfabètic, primer el 3210, i el resultat és el mateix; es conserva perquè una base construïda només amb el catàleg no té el d'R32.11. Concedix `EXECUTE`, només a `authenticated`, de quatre RPC: `publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)`, `desa_revisio_pagina`, `restaura_revisio_pagina` i `llista_revisions_pagina`, que queden obertes en aplicar-la encara que cap build no les use fins que no s'encenen les banderes. Des del Gauntlet R1 de la v1.2.23 (L4-03, L6-01 i L6-02): la clau forana `page_revisions_item_fk`, en cascada, fa que esborrar una publicació (revocació o purga d'una baixa vençuda) s'enduga les seues revisions; un esborrat directe d'Auth no esborra la publicació (`2611110100`: `public.section_submissions` no té FK cap a `auth.users`) i les seues revisions hi queden amb `author_id` a null; una retirada LSSI cautelar no esborra la fila i les revisions la seguixen; les revisions editorials (amb slug) es queden i, en una baixa, només perden l'`author_id`. Afegir la clau forana bloqueja breument `public.section_submissions`, dins del `lock_timeout`. Des del Gauntlet R2 (R2D-03), en una base de laboratori amb la 130 d'abans de l'R1, les revisions òrfenes d'una publicació ja esborrada es retiren abans d'afegir-la, com faria ara la cascada, amb l'avís `SDP-R3244-FK`; a Producció i en una base nova no n'hi ha. Cada compte té un sostre de 8 MiB de revisions en 24 h i de 50 MiB en total de revisions de publicacions, que s'alliberen en esborrar la publicació (`SDP-PAGE-429`, `54000`), a més del de 100 revisions diàries; des del Gauntlet R2 (R2D-04), les editorials, que no s'esborren mai, només compten en el sostre de 24 h, i totes les mides, també la de la revisió nova, són les desades. `exporta_les_meues_dades()` inclou `page_revisions`, les revisions que ha escrit la persona, sense `request_sha256`: la migració reanomena la base privada vigent a `private.exporta_les_meues_dades_base_abans_r3244()` i crea una `private.exporta_les_meues_dades_base_r33()` nova que l'embolcalla (des del Gauntlet R2, R2F-01, la crea amb el nom de treball `private.exporta_les_meues_dades_embolcall_r3244()` i la reanomena dins de la mateixa transacció; en acabar, eixe nom no existix), de manera que l'embolcall públic (el d'R28 al catàleg; a Producció, el d'R32.11 sobre R28, que el seu preflight fixa per SHA) no canvia de cos. Porta dos `drop trigger if exists` (`zzz_r3210_beta_token` i `page_revisions_immutable`), que només hi són per a poder-la reaplicar: per això l'editor SQL de Supabase avisa d'una operació destructiva, però no esborra cap dada ni cap altre objecte. Depén de `2611122200`, `2611111735`, `2610241400`, `20261122160000` i `2611070600` (la base privada de l'exportació; a Producció l'acredita la precondició `SDP-R28-003` de la R28, aplicada el 15-11-2026; la fila 80 la concilia el Mestre al Pas 0). El registre documental no representa una nova execució de C1. Comprovació de lectura, que ha de tornar `true` a les tres columnes: `select to_regclass('public.page_revisions') is not null as revisions_presents, exists(select 1 from pg_catalog.pg_constraint where conname = 'page_revisions_item_fk') as revisions_en_cascada, to_regprocedure('private.exporta_les_meues_dades_base_abans_r3244()') is not null as exportacio_amb_revisions;`. El client fa servir l'edició pròpia amb `VITE_SDP_EDICIO_PROPIA_CAS=1` i les revisions de pàgina amb `VITE_SDP_REVISIONS_PAGINES=1`; s'encenen en un build nou quan esta comprovació torna `true`. La conformitat funcional es verifica amb `tests/r3244-edicio-propia-revisions-pglite.test.mjs`, segons les evidències C1 conservades.
  Estat vigent: aplicada a producció la nit del 23 al 24-11-2026 (T2 de la v1.2.23, `REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`).

- `migrations/20261123010000_r3246_quota_owner_id.sql`

  R32.46 C3-F01, correcció funcional de còmput de quota. Preparada en Kit CAS i verificada només en PGlite local; sense aplicació remota. Depén de `2610220240`. Per als objectes sense reserva, l'UUID canònic de `owner_id` té prioritat; si no és vàlid, conserva `owner` i, en absència de tots dos, UUID-zero. La migració comprova la identitat del cos anterior i del corregit, és idempotent i conserva OID, propietari, ACL i configuració. Una definició divergent produeix `55000` sense substitució. Regressió: `tests/r3246-storage-quotes-orfes-pglite.test.mjs`, incloent cinc variants d'atribució i quota pendent fins a confirmació de purga. Sonda de presència de només lectura: `select prosrc like '%coalesce(case when o.owner_id%' as quota_owner_id_present from pg_catalog.pg_proc where oid = 'private.xat_neteja_adjunts(integer)'::regprocedure;`. La sonda no substituïx la comprovació exacta del cos, l'ACL i les cinc variants de la prova M01/O03.
  Estat vigent: aplicada a producció la nit del 23 al 24-11-2026 (T2 de la v1.2.23, `REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`).

- `migrations/20261123180000_r3252_indexs_suport_fk_verificats.sql`

  R32.52 C4, proposta post-131 **NO aplicada a Producció**, esmenada per C12/R32.72 sobre HEAD v1.2.23. Depén de `20261123010000`. La proposta inicial conserva els seus bytes en el kit antic; el fitxer pendent actual fixa el productor canònic HEAD131 per SHA i manté el rebuig de qualsevol productor desconegut. Unió tancada de 88 objectius: 78 FK canòniques obligatòries i 10 de la radiografia observada, condicionades a la presència del catàleg. En la base canònica, 78 gaps útils passen a zero amb 76 índexs; una fixture estructural separada prova les 82 FK observades més sis gaps locals, amb 86 índexs nous per a 88 objectius. Eixes sis absències en el radar de producció no acrediten absència de constraints: podrien tindre índexs. Les fixtures no reconstruïxen tot el DDL de producció. Cap taula o columna absent es crea; una FK present que no coincidix o una col·lisió de nom avorta amb `55000`. Conserva parcials útils, privilegis i el CAS/postimatge R32.44. Proves: `tests/r3252-radiografia-pglite.test.mjs` i `tests/r3272-sql-pendent-pglite.test.mjs`. El comparador `tooling/gates/verifica-radiografia-supabase-viu.mjs` compara només la projecció observada; el catàleg usable es comprova amb `tooling/gates/lib/radiografia-fk-validada.sql`, no comptant noms d'índex. Verificació posterior (lectura): `select count(*) as indexs_r3252_presents from pg_catalog.pg_indexes where schemaname in ('public','private') and indexname like 'r3252_fk_%';`. El recompte només indica presència. L'envoltura `preparaMigracio132` fixa SHA i ordre de panys: admissió NOWAIT/lock_timeout 1 s, després el cos conserva 5 s i statement_timeout 120 s. SHARE ja adquirit bloqueja escriptors nous fins al commit/rollback; cal finestra i pressupost de bloqueig. No és `CONCURRENTLY` ni zero bloquejos.

- `migrations/20261123233000_r3264_xat_elimina_per_a_tothom_sense_caducitat.sql`

  R32.64 C10 · IDEA-342, preparada només en Kit CAS local; **NO aplicada a Producció**. Catàleg acumulatiu fins a 132. Afig `public.xat_elimina_per_a_tothom(uuid,uuid)` amb `SECURITY DEFINER`, `search_path` buit i EXECUTE només per a authenticated. Autoritza l’autor humà, gestió vigent de l’organització o administració del fil, sense filtre d’antiguitat/caducitat ni barret actiu. La purga estricta E2EE conserva la resta del sobre immutable; deriva de cos/índex/RPC es refusa i la reaplicació conserva OID/ACL i el primer tombstone. El commit elimina reaccions, fixats, destacats i cua/lliuraments push PostgreSQL; no retira notificacions ja enviades a serveis externs. L’adjunt esdevé il·legible, però la reserva i els bytes queden fins al cleaner/worker existent: no és una purga física immediata. El resum de fils conserva l’últim missatge viu anterior. Usa panys DDL i índex transaccionals amb lock_timeout 5s/statement_timeout 60s: pot retenir escriptors després de l’admissió; PGlite no acredita concurrència nativa ni zero bloquejos. Prova: `tests/r3264-xat-elimina-per-a-tothom-pglite.test.mjs`. Sonda de presència READ-ONLY: `select pg_catalog.to_regprocedure('public.xat_elimina_per_a_tothom(uuid,uuid)') is not null as rpc_r3264_present;`. La presència no suplix el contrast del cos, privilegis i comportament.

- `migrations/20261124030000_v1224_integritat_xat_perfils_i_realtime.sql`

  v1.2.24 · IDEA-339, de la radiografia adversarial de Producció del 24-11-2026. Depén de `2609261500` i `20261114060000`. Repara els comptes d'`auth.users` sense fila a `profiles` amb la mateixa fila que `handle_new_user` (fora de `private.baixes` i dels comptes esborrats de GoTrue), esborra els fils `directe` sense cap participant ni cap missatge (els de subjecte naixen sense participants per disseny i no es toquen), afig dos disparadors de restricció diferits (un directe naix amb almenys un participant, `SDP-XAT-051`; un directe que es queda sense ningú ni res s'esborra al COMMIT) i retira de la publicació `supabase_realtime` les taules de `public` (cap client actual no usa `postgres_changes`; Broadcast des de la base no en depén). Idempotent i portable al Node 0. Verificada en PGlite local (`tests/migracio-v1224-integritat-xat-perfils.test.mjs`).
  Estat vigent: NO aplicada: l'aplica el Mestre, després de la sonda de només lectura del kit (sublot 01c).

- `migrations/20261124033000_r3272_profiles_sense_enumeracio_i_execute_minim.sql`

  C12/R32.72, **NO aplicada a Producció**, després de `20261123233000`. Afig només una política `RESTRICTIVE FOR SELECT TO anon` que exclou `profiles`, encara que existisquen permissives antigues. No canvia bucket públic, URLs, bytes ni les polítiques existents; això talla enumeració de metadades, no acredita el comportament HTTP de Storage. Revoca EXECUTE de PUBLIC/anon sobre `private.comprova_una_propietaria()`, `private.is_town_member(uuid)`, `private.trigger_rate_limit_xat()` i `public.touch_updated_at()`; conserva l'EXECUTE authenticated del helper RLS i no toca les RPC públiques legítimes. Comprova cos, tipus, volatilitat i search_path exactes abans de mutar; noms ocupats, RLS desactivada, grant requerit absent o privilegis anònims heretats inesperats fan rollback. Prova real de rols, trigger d'UPDATE, idempotència i refusos: `tests/r3272-higiene-sql-pglite.test.mjs`. Verificació posterior (lectura): `select policyname,permissive,roles,qual from pg_catalog.pg_policies where schemaname='storage' and tablename='objects' and policyname='r3272 profiles sense llista anon';`. El suplement `snippets/r3272_cataleg_complementari_readonly.sql` retorna empremtes de prosrc/ACL, índexs, polítiques i dependències que el JSON original no inclou; és només lectura i no s'ha executat remotament. No activa cap purga ni quarantena de `chat_attachments`: les quatre peces observades requerixen una decisió operativa separada amb inventari i recuperació.

- `migrations/20261124174000_r3287_blindatge_xat_elimina_lssi_i_resol_reclamacio.sql`

  R32.87 · blindatges P0 de Gemini 4 Neon (auditoria 261124_1654, §3, Peix 1), **NO aplicada a Producció**, després de 135. Additiva: reescriu en el lloc quatre funcions amb una substitució de text única sobre `pg_get_functiondef` (CREATE OR REPLACE conserva OID, propietari i ACL). `public.xat_elimina_per_a_tothom`: l'autoria personal només val amb `com_org_id` nul i `private.xat_participant_vigent`; un membre expulsat o un ex-administrador revocat ja no esborra comunicats oficials (la gestió vigent de l'entitat i l'administració del fil continuen valent). `public.publica_section_submission_beta_cas` i `public.revoca_publicacio_mur`: refusen una fila que no és `visible` o que té `deleted_at`, i conserven la prova LSSI de `retirada_cautelar`. `public.resol_reclamacio`: `coalesce(es_superadmin, false)` (R7, ADMIN-NULL). Cada funció ha d'estar intacta (fragment antic exactament una vegada) o ja blindada; qualsevol altra forma avorta amb `55000` i fa rollback, i reaplicar-la no canvia res. Depén de `2611122200`, `20261122160000`, `20261122230000` i `20261123233000`. Prova: `tests/r3287-blindatges-p0-pglite.test.mjs` (reproduïx els tres forats amb el catàleg 135 i els comprova tancats amb 136). Verificació posterior (lectura): `select position('xat_participant_vigent' in pg_get_functiondef(to_regprocedure('public.xat_elimina_per_a_tothom(uuid,uuid)')))>0 as r3287_xat, position('retirada o en revisió' in pg_get_functiondef(to_regprocedure('public.publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamp with time zone,uuid)')))>0 as r3287_beta, position('s.moderation_state is distinct from' in pg_get_functiondef(to_regprocedure('public.revoca_publicacio_mur(uuid,uuid)')))>0 as r3287_revoca, position('coalesce((select private.es_superadmin()),false)' in pg_get_functiondef(to_regprocedure('public.resol_reclamacio(uuid,boolean)')))>0 as r3287_reclamacio;`. Les quatre columnes a `true` només diuen que el text blindat hi és; el comportament el prova la PGlite.

- `seed.sql`
  Contingut inicial del portal.


## Ordre correcte

1. Crear el projecte en Supabase.
2. Obrir el SQL Editor.
3. Executar el pla del verificador, tant en una base nova com en un node existent. Les versions històriques de deu dígits es comparen per data com `20AAMMDDhhmm00`; les de catorze conserven `AAAAMMDDhhmmss`. Els noms i els identificadors originals del llibre no canvien. No usar ordre alfabètic cru ni `supabase db push` sobre el catàleg mixt sense verificar-ne abans el pla. Conservar les restriccions de `ordre_desplegament.json` (2610312000 just després de 2610311800 i abans de 2610311900); aplicar `2611122200` abans de `20261113003000`, i tota la cadena del Mur R21 abans de publicar el client v1.2.0 build 5 (Nota d'auditoria §16). R22.1: `20261113060000` va després de `20261113003000`. R22.2 a R22.5 (`20261114000100` a `20261114000400`) van darrere de tot el catàleg de deu dígits. Les dues d'R23 porten nom de catorze dígits des de l'Onada R24 (abans `2611132330` i `2611140230`, quan cap base no les havia aplicat): `20261113233000` va entre R22.0 i R22.2, i `20261114023000`, entre R22.5 i R24. A producció les va aplicar el Mestre el 14-11-2026 (5/5 true, captura 261114_2339).
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
  coalesce(position('private.exporta_federacio_v1' in pg_get_functiondef(to_regprocedure('public.exporta_les_meues_dades()'))) > 0, false) AS te_contracte_federacio_2611011800,
  -- R22.0: disparador de ritme, cinc polítiques «sdp mitjans …», lectura privada només dels propis i sense admin_list_users() sense arguments.
  (exists (SELECT 1 FROM pg_trigger t WHERE t.tgrelid = to_regclass('public.xat_missatges') AND t.tgname = 'trg_rate_limit_xat' AND NOT t.tgisinternal)
    AND (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'storage' AND p.tablename = 'objects' AND p.policyname LIKE 'sdp mitjans%') = 5
    AND coalesce((SELECT position('es_ruta_mitjans_propia' in p.qual) > 0 FROM pg_policies p WHERE p.schemaname = 'storage' AND p.tablename = 'objects' AND p.policyname = 'mitjans_privats llegir propis o tenant'), false)
    AND to_regprocedure('public.admin_list_users()') IS NULL) AS te_reconciliacio_deriva_20261113112500;
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
  15. Per a R54 2.6, aturar totes les altes; construir/desplegar `/legal` 2.6 i verificar-ne l’HTML i l’empremta; després `2611080440`. Reobrir només després del gate `altes-politica-2-6` amb la fila vigent real, mai durant el fallback silenciós de Supabase. No aplicada ni comprovada remotament.
  16. Mur R21 (Gauntlet R22, dades-01 i honestedat-03; T2 del 13-11-2026): `2611110100` → `2611111735` → `2611112149` → `2611121430` → `2611121850` → `2611122200` → `20261113003000`, sencera i en este ordre, abans de publicar el client v1.2.0 build 5 (web, zip del connector WordPress 1.1.14, Android versionCode 5 i iOS build 5). És la porta `client-v1-2-0-build-5-mur-r21` d’`ordre_desplegament.json` (`2611122200` avorta amb `SDP-MUR-DEPENDENCY` sense la cua de purga de `2611110100`, que té condicions prèvies pròpies a la seua vinyeta); cap zip ni pujada a les botigues abans. **Aplicada sencera i en este ordre a producció el 13-11-2026 al T2** (12:20–12:27, amb el Mestre a l'editor SQL de Supabase i el SHA-256 de cada fitxer comprovat contra el commit a599251d3 abans d'executar-lo, igual al dels fitxers de Git), abans del desplegament de v1.2.0 build 5. Evidència: registre de la sessió SQL del T2, `../_investigacio_ia_de_poble/261113_0330_r21_commit5_t2_sql_i_deploy_claude/sessio_sql_t2_261113.md`, amb l'abast de `excepcio_verificador_cadena_r21.md` de la mateixa carpeta, i ESTAT del 13-11-2026 a les 21:18. La mateixa sessió hi va aplicar 2611121830, 2611121630, 20261113060000 i 20261113112500 (2611121700 no). Cap peça de la cadena no s'ha de tornar a aplicar aïllada: 2611111735 i 2611112149 redefinixen `private.copub_recurs`, que 2611121430 va reescriure després, i 2611112149 tornaria a crear la política «public read section_submissions».
  17. Onada R22 (dossier de Fable 5.2, apartat 2.0; Runbook del Mestre). A producció l'ordre no és el del pla del verificador, perquè ja té el catàleg posterior i li falten peces velles. Pas 1: còpia de seguretat amb restauració provada i baixada dels objectes de Storage (R01), abans de qualsevol SQL. Pas 2, Dashboard sense SQL: retirar `gemini-proxy` i rotar la clau (R08); apagar el proveïdor Phone i protegir el compte del Dashboard (R13); SMTP propi, «Confirm email» i «Secure email change» (R06). Pas 3: `20261114000100` (R02 i R11 en una sola transacció; porta també R03, R05 etapa A, R12, R13 i R14, que són independents de la resta). Pas 4: `2610081400` sencera (R04, sha256 `313e9959f51c48c5345205bc3620c78fe3ecc0a7422133a1d46b18f6d923ad27`). Pas 5: `2610061450` sencera, recomanada (és idèntica al cos viu quan arriba `cf-connecting-ip` o `x-real-ip`; només canvia el cas de `x-forwarded-for` tot sol, de l'element de l'esquerra, que el visitant pot falsificar, al de la dreta, que afig la passarel·la). Pas 6: `20261114000200` (R07). Pas 7: `20261114000400` (R10), només després del pas 1. Pas 8: `20261114000300` (R09) i, només després, el worker `purga-fitxers` desplegat i provat, `pg_cron` i `pg_net`, el planificador del worker amb un 200 i, al final de tot, el de `private.purga_baixes_vencudes(100)`. `2610081543` sencera NO s'aplica mai. Absents a producció i fora d'este ordre (ref_local, 13-11-2026): `2610101900` (personalització: `admin_desa_contingut`, `admin_historial_contingut` i `app_content_historial`; sense ella la personalització del poble no es pot desar), `2611110110`, `2611110455` i `2611110010`; senceres i després del pas 3 (damunt de l'estat final de Git no canvien res més i porten els seus `grant`, que després de `20261114000100` ja no venen per defecte). De `2610081401` i `2610282100` només falten els CHECK `organizations_town_name_llargaria` i `towns_comarca_llargaria`: una sentència cada un, mai el fitxer sencer (el primer avorta amb 42P16 a la vista i el segon tornaria enrere `perfil_public`). Panys: `20261114000100` reté fins al COMMIT un pany exclusiu sobre `organization_memberships`, `organizations`, `profiles`, `xat_missatges`, `section_submissions` i `notes`; amb `lock_timeout` de 5 s per sentència l'espera pot sumar desenes de segons i l'API (8 s) falla mentrestant: a una hora sense ús. Cap agent no aplica res d'açò. Proves PostgreSQL 18.6: `tests/r22-2-reconciliacio-deriva-produccio-postgres.test.mjs` a `tests/r22-5-buckets-mitjans-i-heretats-postgres.test.mjs`.
  18. Onada R32 (kits de Codex R32, integrats a l'Onada R32.2; **les tres, aplicades a producció pel Mestre el 17-11-2026 a les 01:55 CET**, amb les dues R24, segons el certificat `../_investigacio_ia_de_poble/261117_sql_produccio_r32/CERTIFICAT_5_DE_5_APLICADES_PRODUCCIO_261117_0155.md`; cada fitxer aplicat té el mateix SHA-256 que el de Git). Primer, només lectura: la sonda `snippets/r32_7_fossils_sonda.sql` (DDL íntegre, `prosrc` SHA-256, propietari, ACL, disparadors i dependents dels 7 fòssils) i `pg_get_functiondef` de `public.demana_baixa(text)` i `public.cancela_baixa()`, exportats i revisats; tres hashes del receptari R30/R31 no coincidixen amb les fixtures, i cap pin es corregix a cegues. A Producció, el 17-11-2026 a les 01:44, ho va fer una sonda conjunta de la carpeta del certificat (`01_sonda_prevol_r32_read_only.sql`, sense els dependents): 9/9 funcions presents i els 9 `source_sha256`, iguals als pins de Git. Després, si el Mestre ho decidix: `20261116040000` → `20261116170000` i `20261116040000` → `20261116170200`. `20261116170100` només en una base on calga tornar a passar el fil propi damunt de R24 (a Producció no calia, T2 del 13-11-2026), i mai `2611121630` damunt de R24. Ordre del 17-11-2026 a Producció, segons el certificat: `20261116170200`, `20261116170000`, `20261114060000`, `20261114061000` (tornada a executar) i `20261116170100`. Les marxes enrere (`snippets/r32_7_fossils_rollback.sql` i `snippets/r32_baixa_sessions_rollback.sql`) són disponibles i no s'han executat; la sonda posterior dels 7 fòssils no consta exportada. Cap agent no aplica res d'açò.
  19. Onada R32.4 (lot_01 de Gemini, completat a l'Onada v1.2.6; **NO aplicada**): `2611111735` → `20261117150000`, en qualsevol moment posterior. És additiva i idempotent: una sola fila nova al registre privat del paquet de copublicació, sense cap objecte ni permís nou. Confirmació posterior de només lectura: la consulta de la seua vinyeta (1 fila). Cap agent no aplica res d'açò.
  20. Onada R32.5 (kit de Codex R32.5, integrat a l'Onada v1.2.7; **NO aplicada**): `2611122200` → `20261117140000` i `20261116040000` → `20261117140000`, en qualsevol moment posterior i amb independència de la R32.4. Abans, el Mestre confirma amb només lectura que `public.denuncia_publicacio_mur` i `private.mur_publicacions_revocades` existixen. Després, la consulta de la seua vinyeta (`true`). La safata no té interfície encara: la decisió humana passa per les dues RPC administratives, amb AAL2. Cap agent no aplica res d'açò.
  21. Onada v1.2.8 (kits de Codex R32.7 i R32.8; **aplicades a producció el 19-11-2026 a les 18:02 CET**, dins del Super-Bundle R32.14, rebut `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`): `20261116040000` → `20261117173000` → `20261117193000`, en qualsevol moment posterior. La R32.8 s'aplica abans de servir el client que envia `p_ubicacio`; fins aleshores el client de la v1.2.8 rep el rebuig del servidor i no envia la ubicació com a camp nou.
  22. Onada v1.2.22 (kit de Codex R32.42, lots 02 i 03; **les tres, NO aplicades**): `20261117193000` → `20261122160200` i `2611122200` → `20261122160300`, en qualsevol moment posterior; `20261122160000` és independent de les altres dues. El kit demana `20261122160300` abans de servir el client que llig `mostrar_al_mur`; el de la v1.2.22 es pot servir abans de la migració perquè només la negocia amb `VITE_SDP_MUR_VISIBILITAT=1` (cap build ho fa): sense la bandera, o sense la migració, llig la RPC6 sense el flag. Després de `20261122160200`, les ubicacions guardades queden a dos decimals i la precisió anterior no es recupera. Abans de `20261122160000`, el Mestre ha de preparar la regularització dels ajuntaments que ja existixen: queden amb `claimed = false` i no signen com a ajuntament fins que una superadmin registra el domini municipal (`registra_domini_ajuntament`), la titular, amb un correu verificat d'eixe domini, la sol·licita (`sollicita_acreditacio_ajuntament`) i una superadmin diferent l'aprova (`resol_acreditacio_ajuntament`; `SDP-AJT-013` impedix l'autorevisió): és eixa aprovació la que posa `claimed = true` i la marca com a regularitzada; si s'aplica `2610061448`, l'aprovació demanarà també AAL2 (detall a la seua vinyeta). També abans de `20261122160000`, la sonda prèvia de només lectura de la seua vinyeta ha de tornar 0 files: cada fila és una reclamació genèrica pendent sobre un `city_hall`; després de la migració la via genèrica no l'aprova mai (`resol_reclamacio(…, true)` dona `SDP-AJT-020`) i, des de la v1.2.23 (M3-01), només una superadmin la pot rebutjar, amb `resol_reclamacio(<id>, false)` des d'una sessió `authenticated` (detall a la vinyeta); mentre estiga pendent, impedix a la mateixa persona sol·licitar l'acreditació d'eixe ajuntament; si en torna alguna, el Mestre la tanca com a `rebutjada` a la mateixa sessió, amb la sentència de la vinyeta, i repetix la sonda. El client v1.2.22 no té cap camí d'acreditació (les tres RPC AJT només es criden a mà) ni cap interfície muntada de reclamació genèrica. Avís per al Mestre, sense cap migració: la font «oliveres-gva-ivia» del Banc de llavors (lot 02) i les varietats `olivera-alfafarenca`, `olivera-blanqueta` i `olivera-villalonga` queden fora del registre de copublicació de `2611111735`; `private.copub_recurs` no les reconeix i no se'n mostra l'autoria editorial oficial. Cal una migració de registre, amb el seu pin POSSE nou, o acceptar el buit en esta versió; `src/data/copublicacio.migracio.test.js` les declara pendents. Les aplica l'integrador al T2 de la v1.2.23, per encàrrec del Mestre, després del commit A.
  23. Onada v1.2.23 (L4-10 i M3-01 sobre R32.42, més R32.44 i R32.46 de Codex; **les cinc, NO aplicades**): ordre a Producció `20261122160000` → `20261122160200` → `20261122160300` → `20261122230000` → `20261123010000`, en una sessió i fitxer a fitxer, cadascun amb el seu SHA-256 comprovat contra Git abans d'executar-lo. `20261122230000` depén de `20261122160000` (`pot_signar_com_organitzacio` amb `claimed`) i de `2611070600` (`private.exporta_les_meues_dades_base_r33()`, que la 130 reanomena a `…_base_abans_r3244`: si falta, avorta amb `55000` (`SDP-R3244-000`), i si qui aplica no n'és la propietària, el reanomenament falla amb `42501`; en tots dos casos no canvia res), i `20261123010000`, de `2610220240` (el cos exacte de `private.xat_neteja_adjunts(integer)`: si el de Producció no és l'esperat, la migració avorta amb `55000` sense canviar res). Abans, la sonda de la vinyeta de `20261122160000` (0 files); i abans de la `20261122230000`, `select to_regprocedure('private.exporta_les_meues_dades_base_r33()') is not null as te_base_exportacio, coalesce((select p.proowner = (select r.oid from pg_catalog.pg_roles r where r.rolname = current_user) from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.exporta_les_meues_dades_base_r33()')), false) as propietari_ok;`, que ha de tornar `true` i `true` (el preflight `SDP-R28-003` de la R28, aplicada el 15-11-2026, ja ho exigia). Després, les comprovacions de només lectura de les vinyetes de `20261122160200`, `20261122160300`, `20261122230000` i `20261123010000`; la visibilitat del Mur (`VITE_SDP_MUR_VISIBILITAT=1`) només s'encén en un build nou quan `llig_mur_public_v7` respon per PostgREST, i l'edició pròpia (`VITE_SDP_EDICIO_PROPIA_CAS=1`) i les revisions de pàgina (`VITE_SDP_REVISIONS_PAGINES=1`), quan la comprovació de la vinyeta de `20261122230000` torna `true` a les tres columnes. La `20261122230000`, com la `20261122160300`, fa saltar l'avís d'operació destructiva de l'editor SQL (detall a la seua vinyeta). Les aplica l'integrador al T2 de la v1.2.23, per encàrrec del Mestre, després del commit A.

### Taula canònica ordenada: 60 fitxers de R1 + candidates 1500, 1800, 1900 i 2000 + assalt 2611011500, 2611011510 i 2611011800 + marató 2611012257 i 2611020106 + `seed.sql` + 2 snippets (`P0-05` / `DF-06`)

Rebuts de l'«Estat declarat» (`P0-05` / `P2-10`): «bolcat del 13-11-2026» i «deriva R22» remeten al veredicte per migració de `../_investigacio_ia_de_poble/261113_1520_r22_fable_auditoria_extrema_claude/supabase_viu/ref_local/deriva.md` (bolcats de producció del 13-11-2026, de 15:24 a 15:47 CET, contra les migracions del commit `a599251d3`). «Coincidents» són objectes amb l'estat exacte que deixa la migració; «superats», amb el d'una posterior. Una fila només es declara aplicada pel bolcat si hi té algun objecte coincident. Les files posteriors a eixe bolcat citen el seu propi rebut. Una fila sense rebut continua «no acreditat»: el «70/70» de l'acta 261102_1456 cita el verificador estàtic («70 migracions en el manifest · 0 violacions»), que no es connecta a cap base. L'estat vigent és el d'esta taula: el «NO aplicada» o «no acreditat» d'una vinyeta és l'estat de quan es va escriure, i les vinyetes que el bolcat ha superat ho diuen en la seua primera línia.

| Ordre | Versió | Fitxer a `supabase/migrations/` | Estat declarat | Objectiu resumit |
| :---: | :--- | :--- | :--- | :--- |
| 01 | `2609080000` | `2609080000_initial_schema.sql` | Estat remot no acreditat sencer: parcial al bolcat del 13-11-2026 (`profiles`, `towns` i `organizations` ja existien amb una altra forma; deriva R22: 133 coincidents, 35 superats per migracions posteriors, 2 que hi falten, 15 que no coincidixen amb cap versió de Git) | initial schema |
| 02 | `2609080100` | `2609080100_xat_v2.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 31 coincidents, 16 superats per migracions posteriors) | xat v2 |
| 03 | `2609080200` | `2609080200_xat_v2_correccions.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 10 coincidents, 7 superats per migracions posteriors), després del remei `20261113112500`. T2 del 13-11-2026: parcial (sense `trg_rate_limit_xat`); no la torneu a aplicar, el remei és `20261113112500` | xat v2 correccions |
| 04 | `2609080300` | `2609080300_xat_v2_membres.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 2 coincidents, 1 superat per migracions posteriors) | xat v2 membres |
| 05 | `2609110600` | `2609110600_perfil_avatar_i_permisos.sql` | Estat remot no acreditat: el bolcat del 13-11-2026 només hi troba objectes en l'estat de migracions posteriors (deriva R22: 0 coincidents, 2 superats per migracions posteriors, 6 que no coincidixen amb cap versió de Git; la deriva la dona aplicada); comprovar abans d’aplicar | perfil avatar i permisos |
| 06 | `2609121500` | `2609121500_correccio_privacitat_perfils.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident, 2 superats per migracions posteriors) | correccio privacitat perfils |
| 07 | `2609121600` | `2609121600_admin_panel.sql` | Estat remot no acreditat sencer (lectura REST del 6-11: `admin_list_users()` existix, 401 42501; `admin_list_organizations()` donava 404 PGRST202 a les 22:08 CET i respon 401 42501 a les 23:22 i a les 23:53, sense cap migració nova al repositori); no la torneu a aplicar sencera. T2 del 13-11-2026: sense `admin_list_users()` sense arguments, que retira `20261113112500`. El bolcat del 13-11-2026 hi troba 1 objecte superat i 1 que no coincidix amb cap versió de Git (deriva R22) | admin panel |
| 08 | `2609130500` | `2609130500_bucket_mitjans.sql` | Estat remot no acreditat sencer: parcial al bolcat del 13-11-2026 (el bucket `mitjans` no té ni `file_size_limit` ni `allowed_mime_types`; les polítiques hi són, superades per R22.0) | bucket mitjans |
| 09 | `2609140000` | `2609140000_schema_notes.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 23 coincidents, 1 superat per migracions posteriors, 5 que no coincidixen amb cap versió de Git) | schema notes |
| 10 | `2609140100` | `2609140100_auditoria_rls_fixes.sql` | Estat remot no acreditat sencer: parcial al bolcat del 13-11-2026 (`authenticated` conserva REFERENCES, TRIGGER i TRUNCATE sobre `app_content`; `touch_notes_updated_at()` no és SECURITY DEFINER) | auditoria rls fixes |
| 11 | `2609150000` | `2609150000_seguretat_profunda_deepseek.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 8 coincidents, 8 superats per migracions posteriors, 1 que no coincidix amb cap versió de Git) | seguretat profunda deepseek |
| 12 | `2609160600` | `2609160600_politiques_superadmin_organitzacions.sql` | Estat remot no acreditat sencer: parcial al bolcat del 13-11-2026 (falta «profiles read own» amb `(select auth.uid())`: hi ha la de 2609150000) | politiques superadmin organitzacions |
| 13 | `2609162300` | `2609162300_correccions_mur_i_xat.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident, 1 superat per migracions posteriors) | correccions mur i xat |
| 14 | `2609191650` | `2609191650_bucket_mitjans_privats.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 3 coincidents, 1 superat per migracions posteriors) | bucket mitjans privats |
| 15 | `2609200300` | `2609200300_blindatge_storage_i_contingut.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 12 coincidents, 5 superats per migracions posteriors), després del remei `20261113112500`. T2 del 13-11-2026: parcial (sense les polítiques «sdp mitjans …»); no la torneu a aplicar, el remei és `20261113112500` | blindatge storage i contingut |
| 16 | `2609200600` | `2609200600_xat_limit_correccio.sql` | Estat remot no acreditat: el bolcat del 13-11-2026 només hi troba objectes en l'estat de migracions posteriors (deriva R22: 0 coincidents, 1 superat per migracions posteriors; la deriva la dona aplicada); comprovar abans d’aplicar | xat limit correccio |
| 17 | `2609211820` | `2609211820_fix_security_definer.sql` | Estat remot no acreditat; comprovar abans d’aplicar (sense empremta d'esquema al bolcat del 13-11-2026, deriva R22) | fix security definer |
| 18 | `2609261200` | `2609261200_publicacions_autoria.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident, 6 superats per migracions posteriors) | publicacions autoria |
| 19 | `2609261500` | `2609261500_identitat_perfil_f1.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 122 coincidents, 10 superats per migracions posteriors, 3 que no coincidixen amb cap versió de Git) | identitat perfil f1 |
| 20 | `2609262232` | `2609262232_copyright_editor.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 6 coincidents, 1 superat per migracions posteriors, 1 que no coincidix amb cap versió de Git) | copyright editor |
| 21 | `2609270200` | `2609270200_xat_f0_fonament.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 68 coincidents, 9 superats per migracions posteriors) | xat f0 fonament |
| 22 | `2609271400` | `2609271400_notes_paperera.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 8 coincidents) | notes paperera |
| 23 | `2609272100` | `2609272100_notes_origen.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 2 coincidents) | notes origen |
| 24 | `2609272200` | `2609272200_xat_entitats.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 15 coincidents, 8 superats per migracions posteriors) | xat entitats |
| 25 | `2609272201` | `2609272201_grups_mare.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident) | grups mare |
| 26 | `2609281500` | `2609281500_lema_entradilla_256.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 4 coincidents) | lema entradilla 256 |
| 27 | `2609282035` | `2609282035_perfil_emoticona.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident, 1 que no coincidix amb cap versió de Git) | perfil emoticona |
| 28 | `2609282100` | `2609282100_xat_de_pagina.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 14 coincidents, 7 superats per migracions posteriors) | xat de pagina |
| 29 | `2609291200` | `2609291200_baixa_icon_copyright.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident, 1 superat per migracions posteriors) | baixa icon copyright |
| 30 | `2609291210` | `2609291210_xat_cerca_accents.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 2 coincidents) | xat cerca accents |
| 31 | `2609291230` | `2609291230_xat_realtime_lectura.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident) | xat realtime lectura |
| 32 | `2610021520` | `2610021520_perfil_public.sql` | Estat remot no acreditat: el bolcat del 13-11-2026 només hi troba objectes en l'estat de migracions posteriors (deriva R22: 0 coincidents, 1 superat per migracions posteriors; la deriva la dona aplicada); comprovar abans d’aplicar | perfil public |
| 33 | `2610042330` | `2610042330_xat_pagina_iaia.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident, 1 superat per migracions posteriors) | xat pagina iaia |
| 34 | `2610042350` | `2610042350_convergencia_perfil_i_create_organization.sql` | Estat remot no acreditat; comprovar abans d’aplicar (sense empremta d'esquema al bolcat del 13-11-2026, deriva R22) | convergencia perfil i create organization |
| 35 | `2610061448` | `2610061448_superadmin_aal2.sql` | NO aplicada al bolcat del 13-11-2026 (deriva R22: `private.es_superadmin()` no exigix aal2) | superadmin aal2 |
| 36 | `2610061450` | `2610061450_capcalera_client_ip.sql` | NO aplicada al bolcat del 13-11-2026 (deriva R22: `private.capcalera_client(text)` és la de 2609261500, esquerra de `x-forwarded-for`); Onada R22: recomanada sencera després de `20261114000100` | capcalera client ip |
| 37 | `2610072230` | `2610072230_mur_imatges_propies.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 4 coincidents, 1 superat per migracions posteriors) | mur imatges propies |
| 38 | `2610081400` | `2610081400_grups_sense_mare.sql` | NO aplicada al bolcat del 13-11-2026 (deriva R22: `private.can_create_group` és la de 2609272201 i «members create organizations», la de 2609080000); Onada R22 (R04): sencera després de `20261114000100` | grups sense mare |
| 39 | `2610081401` | `2610081401_organitzacions_poble.sql` | Estat remot no acreditat sencer: parcial al bolcat del 13-11-2026 (columnes i vista sí; falta el CHECK `organizations_town_name_llargaria`) | organitzacions poble |
| 40 | `2610081402` | `2610081402_membres_organitzacio.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 14 coincidents, 2 superats per migracions posteriors, 1 que no coincidix amb cap versió de Git) | membres organitzacio |
| 41 | `2610081543` | `2610081543_xat_consentiment_i_metadades.sql` | NO aplicada al bolcat del 13-11-2026 (deriva R22: `membres_del_poble` i `xat_envia` són les anteriors); Onada R22 (R03): MAI sencera, la substituïx `20261114000100` | xat consentiment i metadades |
| 42 | `2610090100` | `2610090100_convergencia_xat_de_pagina.sql` | Estat remot no acreditat: sense empremta d'esquema al bolcat del 13-11-2026 (deriva R22); la vinyeta la dona aplicada pel Mestre el 261009, sense cap rebut | convergencia xat de pagina |
| 43 | `2610101900` | `2610101900_personalitzacio_superadmin.sql` | NO aplicada al bolcat del 13-11-2026 (deriva R22: 17 objectes absents; les 3 polítiques que coincidixen les torna a crear idèntiques 2611121830) | personalitzacio superadmin |
| 44 | `2610160250` | `2610160250_perfil_update_propi.sql` | Estat remot no acreditat: el bolcat del 13-11-2026 només hi troba 1 objecte que no coincidix amb cap versió de Git (la deriva R22 la dona aplicada) | perfil update propi |
| 45 | `2610181800` | `2610181800_perfil_public_per_defecte.sql` | Estat remot no acreditat: el bolcat del 13-11-2026 només hi troba 1 objecte que no coincidix amb cap versió de Git (la deriva R22 la dona aplicada) | perfil public per defecte |
| 46 | `2610181915` | `2610181915_organitzacions_correu_i_membres.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 2 coincidents, 2 superats per migracions posteriors, 1 que no coincidix amb cap versió de Git) | organitzacions correu i membres |
| 47 | `2610201500` | `2610201500_moderacio_denuncies_i_bloquejos.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 72 coincidents, 2 superats per migracions posteriors) | moderacio denuncies i bloquejos |
| 48 | `2610211715` | `2610211715_revoca_correu_organitzacions.sql` | Estat remot no acreditat; comprovar abans d’aplicar (sense empremta d'esquema al bolcat del 13-11-2026, deriva R22); el Llibre P0-01 la dona executada pel Mestre el 21-10, sense empremta al bolcat | revoca correu organitzacions |
| 49 | `2610220240` | `2610220240_xat_adjunts_i_quota.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 40 coincidents, 8 superats per migracions posteriors) | xat adjunts i quota |
| 50 | `2610241400` | `2610241400_normes_exigides_ugc.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 7 coincidents) | normes exigides ugc |
| 51 | `2610241410` | `2610241410_exporta_dades_moderacio.sql` | Estat remot no acreditat: el bolcat del 13-11-2026 només hi troba objectes en l'estat de migracions posteriors (deriva R22: 0 coincidents, 1 superat per migracions posteriors; la deriva la dona aplicada); comprovar abans d’aplicar | exporta dades moderacio |
| 52 | `2610241420` | `2610241420_revocacio_apple.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 32 coincidents) | revocacio apple |
| 53 | `2610241430` | `2610241430_seguiments.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 32 coincidents, 8 superats per migracions posteriors) | seguiments |
| 54 | `2610241440` | `2610241440_baixa_completa_ugc_i_fitxers.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 5 coincidents, 5 superats per migracions posteriors) | baixa completa ugc i fitxers |
| 55 | `2610242320` | `2610242320_correu_propietaria_nomes_titular.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 1 coincident) | correu propietaria nomes titular |
| 56 | `2610250100` | `2610250100_seguiments_des_d_entitat.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 22 coincidents) | seguiments des d entitat |
| 57 | `2610250300` | `2610250300_titular_public.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 6 coincidents) | titular public |
| 58 | `2610281730` | `2610281730_membres_concurrents_i_correu_public.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 2 coincidents, 1 superat per migracions posteriors) | membres concurrents i correu public |
| 59 | `2610282100` | `2610282100_usuari_i_poble_canonic.sql` | Estat remot no acreditat sencer: aplicada tret del CHECK `towns_comarca_llargaria` (bolcat del 13-11-2026; deriva R22: 35 coincidents, 1 superat per migracions posteriors, 1 que hi falta, 3 que no coincidixen amb cap versió de Git) | usuari i poble canonic |
| 60 | `2610290400` | `2610290400_xat_e2ee_claus_i_sobres.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 150 coincidents) | xat e2ee claus i sobres |
| 61 | `2610311500` | `2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql` | Aplicada a producció (lectura REST del 6-11: `transfereix_propietat_organitzacio(uuid, uuid)` existix, 401 42501; acta 261101_0334) | commutacio grup empresa i transferencia propietat |
| 62 | `2610311800` | `2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql` | Aplicada a producció (lectura REST del 6-11: la taula `xat_epoques` existix, 401 42501; acta 261101_0334) | e2ee fases 1b 1c rpcs i adjunts |
| 63 | `2610311900` | `2610311900_exporta_dades_filtre_servidor_rgpd.sql` | Estat remot no acreditat (l'acta 261101_0334 la dona aplicada; la lectura REST no veu el cos d'`exporta_les_meues_dades()`); ho pot acreditar el Pas 0. El bolcat del 13-11-2026 no la pot acreditar: només hi troba l'objecte en l'estat d'una migració posterior (deriva R22: 0 coincidents, 1 superat per migracions posteriors) | filtre RGPD al servidor |
| 64 | `2610312000` | `2610312000_e2ee_lot3_validadors_service_role.sql` | Aplicada a producció segons el bolcat del 13-11-2026 (deriva R22: 2 coincidents); l'acta 261101_0334 també la dona aplicada (la lectura REST no veu `private.xat_lot3_b64`) | validadors E2EE per a service_role |
| 65 | `2611011500` | `2611011500_autoria_ajuntament_mateix_poble.sql` | Aplicada a producció (lectura REST del 6-11: `pot_signar_com_organitzacio(uuid, uuid)` existix, 401 42501, i la signatura vella `(uuid)` ja no, 404 PGRST202; acta 261102_1456) | autoria d'ajuntament al seu poble (D-6) |
| 66 | `2611011510` | `2611011510_versio_minima_client.sql` | Aplicada a producció (lectura REST del 6-11: `versio_minima_client('android')` respon 200 a anon; acta 261102_1456) | versió mínima de l'app nativa (P0-23) |
| 67 | `2611011800` | `2611011800_contracte_exportacio_federacio_v1.sql` | Aplicada segons l'acta 261102_1456 (sense lectura REST: els seus objectes no són visibles per a anon); el bolcat del 13-11-2026 també la troba aplicada (deriva R22: 1 coincident, 1 superat per migracions posteriors) | contracte v1 de l'exportació de federació (P2-09) |
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
| 80 | `2611070600` | `2611070600_seed_revisions.sql` | **NO aplicada: l'aplica el Mestre**; evidència contradictòria: el bolcat del 13-11-2026 hi troba 30 objectes coincidents (deriva R22); conciliar amb el Pas 0 | P1-75: revisió vigent de llavor, CAS per peça i autoria autoritativa |
| 81 | `2611080430` | `2611080430_iaia_xat.sql` | **NO aplicada: proposta R54 en còpia**; evidència contradictòria: el bolcat del 13-11-2026 hi troba 57 objectes coincidents (deriva R22); conciliar amb el Pas 0 | Principal IAIA no interactiu i binding explícit; lease, revocació i resposta de bot posterior al commit |
| 82 | `2611080431` | `2611080431_xat_push_leases.sql` | Aplicada a producció (radiografia del Mestre del 16-11-2026 14:54: `private.xat_push_lliuraments` existix, captura 261116_1454) | Cua durable per aparell, ACK CAS, reintent, baixa amb identitat i despertador posterior al commit |
| 83 | `2611080432` | `2611080432_xat_lliurament_i_presencia.sql` | **NO aplicada: proposta R54 en còpia**; evidència contradictòria: el bolcat del 13-11-2026 hi troba 18 objectes coincidents (deriva R22); conciliar amb el Pas 0 | Entrega/lectura de persones i presència efímera; exclusió només del bot autoritatiu |
| 84 | `2611080440` | `2611080440_politica_privacitat_2_6.sql` | **NO aplicada: l’aplica el Mestre** | Text 2.6 append-only; altes aturades fins al gate HTML/hash/versió vigent |
| 85 | `2611082238` | `2611082238_admin_resum_sessions_dispositius.sql` | **NO aplicada: l'aplica el Mestre**; evidència contradictòria: el bolcat del 13-11-2026 hi troba 1 objecte coincident (deriva R22); conciliar amb el Pas 0 | R13-C7: recomptes de persones amb sessió activa per camí (24 h, 7 i 14 dies), superadmin amb aal2 |
| 86 | `2611091500` | `2611091500_sessions_i_curadoria_cultural.sql` | Estat remot no acreditat sencer: el bolcat del 13-11-2026 hi troba 56 objectes coincidents, però `private.pot_curar_cultura()` (la guarda de curadoria) i `revisa_aportacio_cultural(uuid,text,text)` no coincidixen amb cap versió de Git (deriva R22), i `private.es_superadmin()`, de què depén la guarda, no exigix aal2 (2610061448 encara no aplicada); la radiografia del Mestre del 16-11-2026 14:54 hi troba `private.pot_curar_cultura()` (captura 261116_1454): conciliar estes dues funcions abans de reaplicar-la i d'encendre `VITE_SDP_CURADORIA_CULTURAL` | Directori filtrable per persona i camí, superadmin aal2: correu emmascarat (màscara de la 77), sense identificador de sessió ni UUID de persona, només perfils amb consentiment i sense baixa, una fila d’auditoria append-only per consulta; safata cultural privada, permisos declarats, normes de convivència exigides, rol de curadoria aal2, ningú decidix una aportació pròpia, RLS; aprovació sense ingestió automàtica |
| 87 | `2611110010` | `2611110010_autoria_256_caracters.sql` | **NO aplicada: proposta R17.2**; confirmada al bolcat del 13-11-2026: els tres CHECK `*_copyright_longitud` són els de 2609262232 (deriva R22) | Autoria de fins a 256 caràcters més la marca de drets a Notes, Perfil i organitzacions |
| 88 | `2611110100` | `2611110100_cua_purga_storage_ugc.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 2, SHA-256 `fa6e25fc…` igual al de Git; registre `sessio_sql_t2_261113.md`, Nota d'auditoria §16); el worker `purga-fitxers` no estava desplegat | P0-20: registre i cua de purga d’objectes UGC amb comprovació de propietat i versió |
| 89 | `2611110110` | `2611110110_revisions_patrimoni_viu.sql` | Aplicada a producció el 16-11-2026 pel Mestre, amb el disparador `revisions_patrimoni_quota` d'R29 (`pas3_patrimoni_quota_ok = true`, captura 261116_1503) | P1-75: campanyes anuals, mesures primitives, lectura pública amb autoria interna, escriptura autoritzada i control de versió |
| 90 | `2611110455` | `2611110455_revisions_editorials_wp.sql` | Aplicada a producció el 16-11-2026 a les 15:02 pel Mestre (receptari SQL R30/R31, captura 261116_1503) | P0-111: sincronització de revisions editorials WordPress (`superadmin` + `aal2`), autoria `Associació El Rentonar` als 20 ítems del catàleg d’arbres |
| 91 | `2611111735` | `2611111735_copublicacio_registrada.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 3, SHA-256 `a8770935…` igual al de Git); la radiografia del Mestre del 16-11-2026 14:54 hi troba `private.copub_compte_actiu(uuid)` (captura 261116_1454) | R19: publicadors registrats, traspàs, reversió i historial privat amb CAS i AAL2. |
| 92 | `2611112005` | `2611112005_mur_lectura_publica_foraster.sql` | Aplicada segons l'ESTAT de l'11-11-2026 a les 21:21 (Mestre i MarIA; sense lectura REST); el bolcat del 13-11-2026 hi troba els seus 11 objectes en l'estat de migracions posteriors (deriva R22: 0 coincidents, 11 superats) | P0 Mur Foraster: lectura pública de `mur`, `mercat`, `events` i `multimedia`; `notes` privades; UUID d'autoria llegible per a `anon`; esborranys exposats segons Codex R20, correcció additiva 2611112149 |
| 93 | `2611112149` | `2611112149_mur_estat_public_i_padro.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 5, SHA-256 `12bd594e…` igual al de Git); no la torneu a aplicar aïllada: tornaria enrere `private.copub_recurs` de 2611121430 | Frontera pública coherent entre SELECT i padró; marques privades o d'esborrany dominen, assaig natiu sense omissions |
| 94 | `2611121430` | `2611121430_mur_foraster_projeccio_publica_opcio_a.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 6, SHA-256 `41a56b24…` igual al de Git); la radiografia del Mestre del 16-11-2026 14:54 hi troba `private.mur_anti_resurreccio()` amb el cos auditat (captura 261116_1454) | Opció A: projecció pública mínima, revocació CAS durable, moderació AAL2 i padró coherent; PostgreSQL 18.6 local |
| 95 | `2611121630` | `2611121630_xat_propi.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 4, SHA-256 `d714656b…` igual al de Git), abans d'R24; no la torneu a aplicar: tornaria enrere `xat_fils_meus` de 20261114061000 (conflicte amb el receptari del 16-11, vegeu la vinyeta) | Fil propi únic, RLS privada, lectura automàtica i zero auto-push |
| 96 | `2611121700` | `2611121700_purga_agents_app_content_i_hidratacio_canonica.sql` | Estat remot no acreditat; candidata R21.5. Només dades: el bolcat del 13-11-2026 no la pot acreditar (deriva R22); cal la sonda S7 | Purga per identitat i hidratació canònica, dades legítimes preservades |
| 97 | `2611121830` | `2611121830_frontera_contingut_editorial_i_notes_privades.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 1, SHA-256 `be47c0e7…` igual al de Git) | Frontera pública de nou claus i Notes privades, amb la guarda vigent de superadmin (AAL2 quan s'aplique 2610061448) |
| 98 | `2611121850` | `2611121850_mur_text_dates_i_contactes.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 7, SHA-256 `3661300e…` igual al de Git) | Dates vàlides i rangs del Mur sense regressió de redacció de contactes |
| 99 | `2611122200` | `2611122200_mur_membres_i_actes_v2.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 9, versió corregida, SHA-256 `398caea4…` igual al de Git) | Lectura anònima i de membres, actes atòmics, denúncia i bloqueig per UUID |
| 100 | `20261113003000` | `20261113003000_r21_9b_canal_beta_testers_i_sync_aparadors.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 10, SHA-256 `c102490e…` igual al de Git) | Beta canònic, PNG amb reserva, registre privat de sincronització consentida i CAS |
| 101 | `20261113060000` | `20261113060000_r22_1_hero_video_url.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 11a, SHA-256 `09969804…` igual al de Git) | `hero_video_url` amb CHECK i permisos de columna a `profiles` i `organizations`; la vista, `list_my_organizations` i `perfil_public` la tornen |
| 102 | `20261113112500` | `20261113112500_r22_0_reconciliacio_deriva_ritme_xat_i_mitjans_privats.sql` | Aplicada a producció el 13-11-2026 al T2 (pas 11b, SHA-256 `cbde9ad6…` igual al de Git), aprovada pel Mestre per a eixa sessió | Frontera de `mitjans_privats`, límit de ritme del xat i retirada d'`admin_list_users()` sense arguments |
| 103 | `20261113233000` | `20261113233000_refranyer_sonor_i_aportacions_dialectals.sql` | Aplicada a producció el 14-11-2026 pel Mestre (5/5 true, captura 261114_2339) | Refranyer sonor i aportacions dialectals amb RLS, sostres de durada/mida i consentiment CC BY-SA 4.0 explícit |
| 104 | `20261114000100` | `20261114000100_r22_2_reconciliacio_deriva_produccio.sql` | Aplicada a producció el 15-11-2026 pel Mestre (3/3 true, `pas1_r22_2_ok`, captura 261115_2311) | Desbloqueig de la propietat, `delete_user()` fora, `xat_envia` de 2610081543 amb CHECK, consentiment etapa A, funcions d'administració de Git, privilegis i autoria per disparador |
| 105 | `20261114000200` | `20261114000200_r22_3_sostres_de_volum.sql` | **NO aplicada: R22.3, l'aplica el Mestre** | Sostres de volum per compte a notes, organitzacions, xat i Mur, i `user_tags` tancada |
| 106 | `20261114000300` | `20261114000300_r22_4_purga_baixes_avis_worker.sql` | **NO aplicada: R22.4, l'aplica el Mestre** | Purga amb assaig previ de l'esborrat d'Auth i avís `SDP-BAIXA-044` |
| 107 | `20261114000400` | `20261114000400_r22_5_buckets_mitjans_i_heretats.sql` | **NO aplicada: R22.5, l'aplica el Mestre** | Límits de `mitjans`, buckets heretats tancats i invariant del bucket públic |
| 108 | `20261114023000` | `20261114023000_joc_isoglosses_consens_comarcal.sql` | Aplicada a producció el 14-11-2026 pel Mestre (5/5 true, captura 261114_2339) | Columnes territorials separades, vots de consens d'isoglosses amb RLS privada i RPC agregada sense dades personals |
| 109 | `20261114060000` | `20261114060000_r24_xat_directe_canonic_i_reconciliacio.sql` | Aplicada a producció el 17-11-2026 a les 01:55 CET pel Mestre (pas 4 del certificat 261117_0155, «Success» amb «Run without RLS», captura 261117_0152; SHA-256 `9d52d1fc…` igual al de Git); les dues taules privades que crea no porten RLS a la migració i la R29 no les va trobar: RLS pendent de lectura (vegeu la vinyeta) | Un sol directe persona↔persona per parella i poble: clau canònica, reconciliació dels duplicats i `crea_fil_directe` per clau |
| 110 | `20261114061000` | `20261114061000_r24_xat_rebuts_entrega.sql` | Aplicada a producció el 14-11-2026 pel Mestre (5/5 true, captura 261114_2339); tornada a executar sencera el 17-11-2026 a les 01:55 CET, darrere de la `20261114060000` (pas 5 del certificat 261117_0155, «Success»; SHA-256 `ce6e49dd…` igual al de Git) | Rebut d'entrega dels altres a `xat_fils_meus` (columna al final) i regla D-1 del mínim dels gestors vigents, com `xat_ritme` |
| 111 | `20261114171500` | `20261114171500_r25_2_r23_octet_length_bounds.sql` | Aplicada a producció el 14-11-2026 pel Mestre (5/5 true, captura 261114_2339) | Sostres `octet_length` a les columnes de text de les taules R23; l'únic límit nou efectiu és `explicacio_i18n` <= 4096 octets |
| 112 | `20261115030000` | `20261115030000_r28_rgpd_exportacio_i_quotes_r23.sql` | Aplicada a producció el 15-11-2026 pel Mestre (3/3 true, `pas2_r28_ok`, captura 261115_2311) | Exportació RGPD de les files R23 pròpies (`veu_del_poble`) i quotes d'escriptura per persona a aportacions i vots (60/h, 500/24 h, 2000 vives) |
| 113 | `20261115170000` | `20261115170000_r29_quotes_rls_i_consens.sql` | Aplicada a producció el 15-11-2026 pel Mestre (3/3 true, `pas3_r29_ok`, captura 261115_2311); `revisions_patrimoni_quota` el 16-11 amb la 2611110110 | RLS a les taules privades de la reconciliació del xat, normes de convivència a les taules R23, sostres per compte a aportacions culturals i revisions de patrimoni, i resum del consens només amb les preguntes del joc i l'etiqueta del mot de la clau |
| 114 | `20261115230000` | `20261115230000_r30_revisions_editorials_cas.sql` | Aplicada a producció el 16-11-2026 pel Mestre (`pas1_wp_cas_ok = true`, captura 261116_1503) | CAS de la revisió editorial de WordPress amb token opac, curadoria AAL2 que denega davant NULL i signatura antiga només de creació |
| 115 | `20261116031000` | `20261116031000_r31_push_sessio_i_revocacio.sql` | Aplicada a producció el 16-11-2026 pel Mestre (`pas2_push_sessio_ok = true`, captura 261116_1503); claus Push i aparells físics sense verificar | Registre Push vinculat a la sessió Auth, purga en logout i rebuig de JWT revocat |
| 116 | `20261116040000` | `20261116040000_r31_definer_search_path.sql` | Aplicada a producció el 16-11-2026 pel Mestre (29/29 amb `search_path` buit, captura 261116_1503); els 7 definers fòssils fora de Git, blindats el 17-11-2026 amb `20261116170000` | Path buit de 29 definers vigents, catàlegs qualificats, hashes de precondició i ACL preservades |
| 117 | `20261116170000` | `20261116170000_r32_fossils_search_path.sql` | Aplicada a producció el 17-11-2026 a les 01:55 CET pel Mestre (pas 3 del certificat 261117_0155, `COMMIT`; SHA-256 `20c5514f…` igual al de Git), després de la sonda de només lectura de les 01:44 (els 9 `source_sha256`, iguals als pins de Git); la sonda posterior dels 7 fòssils no consta exportada | Set definers heretats amb backup íntegre, pins de cos, relacions qualificades i search_path buit |
| 118 | `20261116170100` | `20261116170100_r32_xat_propi_rebase_r24.sql` | Aplicada a producció el 17-11-2026 a les 01:55 CET pel Mestre, darrere de les dues R24 (pas 6 del certificat 261117_0155, «Success. No rows returned»; SHA-256 `45f8f5d9…` igual al de Git), encara que no calia (2611121630 hi és des del T2 del 13-11-2026, abans de R24) | Rebase additiu del fil propi sense regressió de signatura, parella ni canal Beta R24 |
| 119 | `20261116170200` | `20261116170200_r32_baixa_sessions_atomiques.sql` | Aplicada a producció el 17-11-2026 a les 01:55 CET pel Mestre, la primera de les cinc (pas 2 del certificat 261117_0155, `COMMIT`; SHA-256 `dbfed00b…` igual al de Git), després d’exportar a la sonda de les 01:44 `pg_get_functiondef` de `demana_baixa(text)` i `cancela_baixa()` | Baixa i cancel·lació serialitzades, revocació estricta de sessions amb backup i rollback guardats |
| 120 | `20261117140000` | `20261117140000_r32_5_lssi_revisio_cautelar.sql` | **NO aplicada: R32.5, l'aplica el Mestre** | Safata humana LSSI (art. 16) i retirada cautelar del contingut UGC públic: quota existent, superadmin amb AAL2, auditoria privada sense grants API i cap esborrat |
| 121 | `20261117150000` | `20261117150000_r324_copublicacio_pagina_sistema_nervios.sql` | **NO aplicada: R32.4, l'aplica el Mestre** | La pàgina pública `/page/sistema-nervios` entra al registre del paquet de copublicació: una fila, additiva i idempotent |
| 122 | `20261117173000` | `20261117173000_r32_7_xat_reaccions_destacats_fixats_amagats.sql` | Aplicada a producció el 19-11-2026 a les 18:02 CET pel Mestre, dins del Super-Bundle R32.14 (una transacció, postverificació 10/10 TRUE, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`) | Reaccions, destacats, fixats i «esborra per a mi» del xat sobre missatges visibles, sense contingut ni seq nous |
| 123 | `20261117193000` | `20261117193000_r32_8_xat_quota_250mb_video_60s_i_ubicacio.sql` | Aplicada a producció el 19-11-2026 a les 18:02 CET pel Mestre, dins del Super-Bundle R32.14 (una transacció, postverificació 10/10 TRUE, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`) | Quota acumulada de 250 MB, vídeo fins a 60 s i ubicació explícita als adjunts del xat, additiva i sense canvis de RLS/ACL |
| 124 | `20261118230000` | `20261118230000_a03_xat_push_credencials_per_configuracio.sql` | Aplicada a producció el 19-11-2026 a les 18:02 CET pel Mestre, dins del Super-Bundle R32.14 (una transacció, postverificació 10/10 TRUE, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`) | Caché de credencials natives per proveïdor i configuració: rotació de `SDP_APNS_*` o `SDP_FCM_COMPTE_SERVEI` sense apagar el cron; v1 intacta |
| 125 | `20261119143000` | `20261119143000_r32_14_xat_fils_previa_sense_amagats.sql` | Aplicada a producció el 19-11-2026 a les 18:02 CET pel Mestre, dins del Super-Bundle R32.14 (una transacció, postverificació 10/10 TRUE, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`) | Vista prèvia del xat sense missatges amagats per a auth.uid(); text, data, autor i tipus coherents; sense canviar rebuts ni cursors |
| 126 | `20261121090000` | `20261121090000_r32_25_push_directes_i_bandols.sql` | NO aplicada a Producció; preparada localment, bandera municipal apagada | Sostre D-24 de directes, consentiment i Bàndols urgents per poble, revalidació i NFD Unicode 16 |
| 127 | `20261122160000` | `20261122160000_r3242_ajuntament_acreditacio_institucional.sql` | Aplicada a producció la nit del 23 al 24-11-2026 (23:58–00:01 CET) per l'integrador de la v1.2.23 (Claude Opus 5.5) al T2, amb els bytes del commit 12d34bc46 i SHA-256 comprovada a l'editor; sondes prèvies 00-02 i posteriors 10-15 en verd i PostgREST 200 (`REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`) | Ajuntament neutral sembrat per INE, sense propietària fins a l'acreditació manual de superadmin amb domini i correu verificats; només signa acreditat i al seu poble; auditoria privada |
| 128 | `20261122160200` | `20261122160200_r32_42_xat_ubicacio_dos_decimals.sql` | Aplicada a producció la nit del 23 al 24-11-2026 (23:58–00:01 CET) per l'integrador de la v1.2.23 (Claude Opus 5.5) al T2, amb els bytes del commit 12d34bc46 i SHA-256 comprovada a l'editor; sondes prèvies 00-02 i posteriors 10-15 en verd i PostgREST 200 (`REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`) | Ubicació dels adjunts del xat arrodonida a dos decimals per disparador i CHECK, també per als clients antics i la ja desada, sense marxa enrere |
| 129 | `20261122160300` | `20261122160300_r32_42_mur_visibilitat_publica.sql` | Aplicada a producció la nit del 23 al 24-11-2026 (23:58–00:01 CET) per l'integrador de la v1.2.23 (Claude Opus 5.5) al T2, amb els bytes del commit 12d34bc46 i SHA-256 comprovada a l'editor; sondes prèvies 00-02 i posteriors 10-15 en verd i PostgREST 200 (`REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`) | RPC7 opt-in `llig_mur_public_v7` (nom propi des de la v1.2.23, cap sobrecàrrega) amb el flag editorial `mostrar_al_mur`; la RPC6 no canvia i el client només la negocia amb `VITE_SDP_MUR_VISIBILITAT=1` |
| 130 | `20261122230000` | `20261122230000_r3244_edicio_propia_i_page_revisions.sql` | Aplicada a producció la nit del 23 al 24-11-2026 (23:58–00:01 CET) per l'integrador de la v1.2.23 (Claude Opus 5.5) al T2, amb els bytes del commit 12d34bc46 i SHA-256 comprovada a l'editor; sondes prèvies 00-02 i posteriors 10-15 en verd i PostgREST 200 (`REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`) | Edició pròpia amb control de versió i revisions append-only; `page_revisions_item_fk` en cascada; sostres de 8 MiB en 24 h i de 50 MiB per compte en revisions de publicacions (`SDP-PAGE-429`); `page_revisions` a l'exportació RGPD amb l'embolcall de la base privada de `2611070600`; sense nova execució C1 |
| 131 | `20261123010000` | `20261123010000_r3246_quota_owner_id.sql` | Aplicada a producció la nit del 23 al 24-11-2026 (23:58–00:01 CET) per l'integrador de la v1.2.23 (Claude Opus 5.5) al T2, amb els bytes del commit 12d34bc46 i SHA-256 comprovada a l'editor; sondes prèvies 00-02 i posteriors 10-15 en verd i PostgREST 200 (`REBUT_SUPABASE_PRODUCCIO_V1223_T2_SONDES_VERDES.json`) | Atribució de quota per owner_id canònic, owner antic o UUID-zero; purga confirmada; QA funcional PGlite, sense aplicació remota |
| 132 | `20261123180000` | `20261123180000_r3252_indexs_suport_fk_verificats.sql` | NO aplicada a Producció; proposta R32.52 esmenada per C12/R32.72 sobre HEAD131 | 88 objectius tancats: 78 canònics i 10 observats condicionals; cobertura de la projecció de 82 alertes, no 82 índexs ni DDL de producció complet; pin exacte del productor HEAD131, col·lisions i CAS |
| 133 | `20261123233000` | `20261123233000_r3264_xat_elimina_per_a_tothom_sense_caducitat.sql` | NO aplicada a Producció; Kit CAS local R32.64 | RPC autenticada sense termini, autoritat humana/org/admin de fil, tombstone i neteja d’accions/push; guardes E2EE, ACL, idempotència i QA PGlite |
| 134 | `20261124030000` | `20261124030000_v1224_integritat_xat_perfils_i_realtime.sql` | **NO aplicada: v1.2.24 (IDEA-339), l'aplica el Mestre** després de la sonda de només lectura del sublot 01c | Repara els comptes d'`auth.users` sense fila a `profiles` (fora de les baixes), esborra els fils directes sense participants ni missatges, obliga cada directe a nàixer amb un participant i n'esborra un que es queda buit (disparadors diferits, `SDP-XAT-051`), i buida de taules de `public` la publicació `supabase_realtime` (cap client actual no usa `postgres_changes`) |
| 135 | `20261124033000` | `20261124033000_r3272_profiles_sense_enumeracio_i_execute_minim.sql` | NO aplicada a Producció; proposta C12/R32.72, després de 133 | RESTRICTIVE anon sobre Storage profiles i retirada EXECUTE PUBLIC/anon de quatre helpers/triggers amb cossos fixats; conserva helper RLS authenticated, bytes, buckets i RPC públiques |
| 136 | `20261124174000` | `20261124174000_r3287_blindatge_xat_elimina_lssi_i_resol_reclamacio.sql` | NO aplicada a Producció; blindatges P0 de Gemini Neon R32.87, després de 135 | Esborrat global només amb participació vigent o autoritat vigent, prova LSSI `retirada_cautelar` intocable per l'autor i `coalesce` a `resol_reclamacio`; CAS de text, OID/ACL conservats, QA PGlite |

| Artefacte complementari | Ruta dins de `supabase/` | Rol operatiu |
| :--- | :--- | :--- |
| Llavor opcional | `seed.sql` | Contingut inicial de demostració del portal |
| Snippet manual 1 | `snippets/2610181800_alinea_perfil_javi_llinares.sql` | Alineació puntual del perfil de la persona pilot (ús manual del Mestre) |
| Snippet manual 2 | `snippets/2610181800_publica_perfil_javi_llinares.sql` | Publicació puntual del perfil de la persona pilot (ús manual del Mestre) |
| Snippet manual 3 | `snippets/2611031750_oli_de_la_torre_preus_i_taula_mobil.sql` | Correccions F1/F4 als set productes d’Oli de La Torre: preu de la taula i cel·les llargues en mòbil; preparat, aplicació remota no acreditada |
| Snippet manual 4 | `snippets/r32_7_fossils_sonda.sql` | Sonda R32 de només lectura dels 7 fòssils (DDL, `prosrc` SHA-256, ACL, propietari, disparadors i dependents); l’exporta el Mestre abans de `20261116170000` i la torna a passar després. A Producció, abans (17-11-2026, 01:44), es va exportar una sonda conjunta sense els dependents (`01_sonda_prevol_r32_read_only.sql` de la carpeta del certificat 261117_0155); la de després no consta exportada |
| Snippet manual 5 | `snippets/r32_7_fossils_rollback.sql` | Marxa enrere de `20261116170000` des del backup privat, sense DROP ni CASCADE; disponible, no executada (la còpia `rollback_04_fossils.sql` de la carpeta del certificat 261117_0155 té el mateix SHA-256, `e2a7e1ad…`) |
| Snippet manual 6 | `snippets/r32_baixa_sessions_rollback.sql` | Marxa enrere de `20261116170200` des del backup privat; disponible, no executada (la còpia `rollback_03_baixa_sessions.sql` de la carpeta del certificat 261117_0155 té el mateix SHA-256, `f84fb183…`) |
| Snippet manual 7 | `snippets/r32_10_xat_privades_rls_repara.sql` | R32.10: reparació manual idempotent de RLS i ACL de taula/columna de les dues taules internes del xat; conserva dades i accés intern del propietari; polítiques o privilegis heretats no revisats avorten. Preparat i provat localment. **Aplicat a Producció el 19-11-2026 a les 18:02 CET** pel Mestre, dins del Super-Bundle R32.14 (10/10 TRUE, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`) |
| Snippet manual 8 | `snippets/r32_10_fossils_acl_enduriment.sql` | R32.10: mínim EXECUTE dels 7 definers amb OID, propietari i DDL postimatge verificats; sense concessions noves, comprova herència efectiva i conserva backup d’ACL. Preparat i provat localment. **Aplicat a Producció el 19-11-2026 a les 18:02 CET** pel Mestre, dins del Super-Bundle R32.14 (10/10 TRUE, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`) |
| Snippet manual R32.13 | `snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql` | **Aplicat a Producció el 19-11-2026 a les 18:02 CET** pel Mestre, dins del Super-Bundle R32.14 (10/10 TRUE, `REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`); paquet manual fora del catàleg de migracions: ACK causal CRDT durable i denúncies LSSI sobre el flux existent, amb revisió humana CAS. Verificat localment amb PostgreSQL 18.6 (dues sessions READ COMMITTED) i PGlite; cap prova local acredita execució remota |

**R32.10 · integritat del pre-vol:** l’export històric `resultat_sonda_produccio_261117_0144.json` concorda amb els seus hashes recalculats en 7/9 files. Els DDL literals de `public.demana_baixa(text)` i `public.omega_invalidate_stale_translations()` no produïxen els hashes declarats. Açò no determina el DDL remot actual ni autoritza substituir pins: cal un export fresc i íntegre. La nova ACL requerix la postimatge exacta de `private.r32_fossils_backup`; un pin NULL o qualsevol deriva avorta. El paquet consolidat i la verificació booleana són a `../_investigacio_ia_de_poble/261118_r32_10_codex_deute_zero/`; no són migracions noves. Onada v1.2.13 · Els dos snippets R32.10 sí que s’han executat a Producció, dins del Super-Bundle R32.14 del 19-11-2026 (`REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`).

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
  amb les CHECK del 2610311800. Documentada a la llista; aplicada a producció
  segons el bolcat del 13-11-2026 (vegeu la taula canònica).
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

**R17.2B · P0-20.** `2611110100_cua_purga_storage_ugc.sql` afig una cua RLS
reservada al servidor. La baixa vencida encua els objectes dels tres buckets
d'usuari pel propietari acreditat de Storage i conserva la identitat de l'objecte
i la versió. El compte es manté en quarantena fins que el worker confirma
una resposta de l'API de Storage i l'absència de les metadades, i el lot de
baixes torna a processar-lo.
La cancel·lació és possible fins a l'inici d'esta fase. `estat_baixa()` retorna
l'instant d'inici al mateix usuari. En un node amb una FK antiga que impedeix
eliminar Auth, els fitxers que encara utilitza una entitat o una publicació
poden requerir una reassignació de propietat supervisada. El worker només
accepta buckets existents sense versionat. Una resposta posterior a un
timeout pot acreditar que el nom ja no hi és. La neteja diferida dels bytes
en eixe cas depén de Storage. La revalidació de referències protegix les
que són visibles en la transacció d'esborrat de Storage.

La funció actual continua consumint les mateixes tres RPC i la cua privada
del Xat. Abans de migrar, deixa acabar les invocacions anteriors del worker
i comprova que el rol de migració pot crear els triggers en `auth.users`
i `storage.objects`. Si `storage.buckets` té la columna `versioning_status`,
comprova que els tres buckets figuren com a `DISABLED`. Els registres antics de mitjans sols es traslladen si
Storage acredita l'objecte i la propietat, i el compte ja no existix. La
resta queda al registre privat per a revisió. El comptatge de la cua
nova es consulta amb un rol operador, amb les rutes fora de l'eixida.

```sql
select bucket_id, referenciat, (ultim_error is not null) as amb_error, count(*)
from public.cua_purga_storage_ugc group by 1, 2, 3;
```

Abans de migrar, comprova també amb el rol de migració que pot bloquejar
`auth.users`: la guarda de Storage hi fa un `for key share` i, sense eixe
privilegi, totes les pujades dels tres buckets fallarien. La migració s'atura
amb `SDP-PURGA-010` si el privilegi falta.

```sql
select has_table_privilege('auth.users', 'UPDATE');
```

Una fila de la cua que esgota `purga_fitxers_max_intents` o que cau en un
bucket amb versionat ja no es reclama, i la baixa no pot avançar. La baixa
ho anota a `private.baixes.ultim_error` amb `SDP-BAIXA-043` perquè l'operador
ho revise:

```sql
select user_id, ultim_error from private.baixes where ultim_error like 'SDP-BAIXA-043%';
```

Quan la baixa acaba, les files `referenciat` del compte suprimit s'esborren
de la cua. Els objectes compartits que es conserven continuen a Storage amb
l'`owner_id` del compte suprimit: si l'entitat o la publicació deixa de
citar-los més avant, no tenen cap camí automàtic de purga i cal una revisió
periòdica de l'operador.

Prova local: `SDP_PGLITE_MODULE=/ruta/local/pglite/dist/index.js node --test tests/migracio-cua-purga-storage-ugc.test.mjs`.

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
`migrations/2611020417_xat_avisos_push.sql` i `migrations/2611080431_xat_push_leases.sql` aplicades. El contracte0417 és històric; R54 exigix lease/ACK v2, sense fallbackv1. Els natius, a més, necessiten `migrations/20261118230000_a03_xat_push_credencials_per_configuracio.sql` (P1-74, A-03): sense ella, APNs i FCM responen «reintenta» i el web continua igual.

Què fa cada passada (un POST amb la capçalera `x-sdp-cron`):

1. Sense `SDP_PUSH_ACTIU=si`, només crida `xat_push_neteja` (cap servei de
   push) i respon `{ok: true, apagat: true, neteja: {…}}`; si la base falla,
   `502`.
2. `xat_push_neteja`: aparells caducats o sense renovar en 60 dies, i la cua
   de més d'una hora (el disparador ja la poda sol: com a molt 100 files per
   missatge, també amb els avisos apagats).
3. `xat_push_reclama_v2`: lliuraments per missatge/aparell, claim amb nonce i lease120s, caducitat15min i màxim8 intents. Un treballador interromput deixa el lliurament recuperable; el reintent revalida pertinença, autor i dispositiu. La purga limitada requerix activitat posterior, també amb push apagat: no és un TTL físic autònom.
4. Web Push amb VAPID (ES256, WebCrypto), sense cos: `TTL: 86400`,
   `Urgency: normal`, `Topic: sdp-xat`. APNs i FCM, si tenen secrets, amb el
   text literal en la llengua de l'aparell.
5. Només s'expulsa amb web 404 i 410, APNs 410 i FCM 404 `UNREGISTERED`
   (retirada vinculada al nonce de `xat_push_confirma_v2`, sense expulsióv1). Web 401 i 403, APNs `BadDeviceToken` o
   `DeviceTokenNotForTopic` i FCM `SENDER_ID_MISMATCH` o
   `THIRD_PARTY_AUTH_ERROR` es compten per aparell: mai expulsen ni pausen
   el proveïdor, perquè una sola persona els pot provocar (G1-B-seg-01).
   Només pausa el proveïdor la credencial pròpia (la signatura VAPID, APNs
   403, FCM 401 o 403 sense codi d'aparell). Un 429 pausa l'amfitrió web o
   el proveïdor natiu, excepte el `TooManyRequests` d'Apple (APNs i Web Push
   d'Apple: massa avisos seguits a un sol aparell), que només salta eixe
   aparell la resta de la passada.
6. Cada acceptació del proveïdor es confirma amb `xat_push_confirma_v2` i el nonce vigent; el client no pot fer ACK. Com a molt 10 lots, 45 s, 8 peticions alhora i 8 s per petició. Respon
   només recomptes: `{ok, missatges, retallats, dispositius, enviats,
   expulsats, fallits, sense_proveidor, sense_provar, lots, esgotat}`.

Panys (tot apagat per defecte): `private.ajustos` `push_xat_actiu` = `si`
(sense, la cua no creix i desar dona `SDP-PUSH-010`), `SDP_PUSH_ACTIU=si` a la
funció i la bandera del client. Són independents per a enviar. La neteja retira la cua original de més d’una hora i els lliuramentsv2 caducats amb purga limitada; requerix activitat posterior, també amb push apagat. Cap termini és una garantia de supressió física sense eixa activitat.

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

Rotació dels secrets natius sense apagar el cron (P1-74, A-03). La caché de
credencials (`private.xat_push_credencials_v2`) guarda una fila per proveïdor
i empremta: 16 caràcters hexadecimals que el worker calcula de la
configuració pública (APNs: l'equip, el kid i la pública de la `.p8`; FCM: el
correu i el projecte del compte de servei). Mentre conviuen treballadors amb
la configuració vella i amb la nova, cadascun usa la seua fila i ningú no
refà el JWT d'APNs ni el testimoni d'OAuth a cada passada. L'ordre:

1. Aplicar la migració `20261118230000` (una vegada; el worker d'abans
   continua amb les RPC v1 i la seua fila única).
2. Desplegar `notifica-xat`, `notifica-xat-desperta` i `iaia` amb el
   `natius.js` que crida les `_v2`.
3. Crear la clau APNs nova (o la clau o el compte de servei de FCM nou)
   mentre la vella continua vàlida.
4. Posar tots els secrets del canvi en una sola crida, perquè cap instància
   no en veja una barreja:
   `supabase secrets set SDP_APNS_CLAU_ID=<…> SDP_APNS_CLAU_P8=<…> --project-ref <ref>`
   (o `SDP_FCM_COMPTE_SERVEI=<…>`).
5. Tornar a desplegar les tres funcions.
6. Revocar la clau vella a Apple o a Google només després. La seua fila
   caduca sola (65 minuts com a molt) i la base no en guarda més de quatre
   de vives per proveïdor (`SDP-PUSH-014`).

Lectura per al Mestre (cap adreça):

```
select tipus, llengua, count(*) from public.xat_dispositius_push group by 1, 2;
select count(*), min(creat_al) from private.xat_push_cua;
```

Límits coneguts R54: reintents amb lease/ACK v2, sense promesa d’exactament-un. Si el proveïdor accepta i l’ACK falla, pot arribar un avís duplicat en recuperar el lease; APNs exigix HTTP/2 (cal provar-lo en sandbox, en un projecte de
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


## R54 · IAIA, ritme del xat i push durable (proposta local)

### Ordre de la proposta R54

2611080430 abans de2611080432.2611020417 abans de2611080431. El catàleg canònic i la inversió històrica1800→2000→1900 continuen manant. Preparar còpia/rollback i comprovar estat real abans de l'aplicació; estos fitxers no són evidència d'estat remot.

1. Instal·lar les tres migracions segons el pla canònic, amb els interruptors operatius apagats durant la transició.
2. Desplegar notifica-xat compatible lease-v2 i notifica-xat-desperta amb verify_jwt=true; el relay valida el JWT amb Auth i sols reclama el missatge recent del seu autor verificat. El treball s'executa dins el mateix worker via waitUntil, sense HTTP anidat entre funcions. El cron conserva la recuperació.
3. Desplegar iaia amb el seu Auth, límits de model i callback de wake de servidor. Node0 conserva el seu autenticador i rol de worker separat. No inferir res si falta configuració; el fallback documental no es presenta com un model real.
4. Publicar el client i /legal2.6 amb les descripcions tècniques de push natiu; verificar l'empremta. Els tokens no van a logs ni al consentiment persistent. Només guardar opt-in del mateix compte i mostrar permís del sistema després del gest explícit.
5. Configurar el model real i el binding real del grup Beta amb administració autenticada; comprovar amb un compte de prova autoritzat i sense suplir usuaris. Configurar VAPID/APNs/FCM, provisioning i cron en el seu entorn; cap valor secret pertany al kit. Activar push només després de validar els dos panys existents. Provar recepció en dispositius Android/iOS reals, permís denegat, canvi A→B, reinici, so, badge i baixa.

El badge natiu conserva prudentment el pendent fins baixa/logout perquè el SDK8.1.3 no oferix CAS per a un wake concurrent durant l'esborrament global. Això és una limitació oberta de producte, no una acreditació de paritat total. Provider accepted tampoc prova device received. El kit no firma apps, desplega SQL, configura comptes ni envia missatges externs.


### R54 · Desplegament IAIA propi i privacitat de la pregunta

El model gestionat és una capacitat de desplegament, no un servei que es done per operatiu. Configurar SDP_IAIA_MODEL_ENDPOINT i SDP_IAIA_MODEL només per a un model propi en infraestructura pròpia de Sóc de Poble; el token, si cal, només viu al servidor. No habilitar cap companyia d'IA externa fins que el seu nom conste a /legal i s'haja publicat l'avís nou exigit per l'apartat18. No s'acredita eixa propietat només perquè una URL passe la validació sintàctica: és un requisit de configuració i verificació del desplegament. Sense configuració/activació, conservar el fallback documental local i no presentar-lo com una inferència real.

La consulta privada requereix Auth i només envia la pregunta explícita; el fil i l'historial visible es mantenen temporalment al navegador. No es publiquen per fer una consulta privada. El servei no rep historial automàtic: context[] en consultes directes i en la SQL0430 del grup. No s'envien Mur, Notes, altres xats ni missatges anteriors d'altres membres. No s'ha habilitat cap canvi d'E2EE.

El grup públic legacy de la pàgina IAIA conserva els missatges públics i la cortesia documental local. La resposta persistent del model correspon únicament al grup autoritzat pel binding real, a una pregunta explícita ja confirmada i a un bot amb principal propi no interactiu. El registre/binding exigeixen administració autenticada AAL2 i la publicació es revalida després de la inferència. Esta descripció tècnica no modifica drets, terminis de retenció ni la llista d'encarregats de /legal.

IAIA Node0 usa el login separat `node0_iaia_authenticator` (NOINHERIT, només `node0_iaia_worker`). Abans d’activar grups, l’operador aplica `tooling/node0/privacitat-iaia-postgres-node0.sql` al catàleg complet85; la connexió privada comprova tots els GUC de registre i el rol exacte abans de vincular valors. No s’amplia el login web de dos rols. No executat remotament en esta integració.

### R15 · Sessions i curadoria cultural (2611091500, estat remot no acreditat sencer)

La 2611082238 conserva intacta la RPC agregada `admin_resum_sessions_dispositius()`. La nova `admin_llista_sessions_dispositius(p_cerca,p_cami)` agrupa les sessions amb activitat en els últims 14 dies per persona i camí estimat, i retorna com a màxim 200 files i el total de coincidències; únicament superadmin amb aal2. Filtra per nom o àlies del perfil i per canal; mai pel correu. Només hi entren perfils amb consentiment vigent i sense baixa demanada, com a `admin_llista_usuaris_registrats`. Cada fila porta el nom del perfil, el correu emmascarat amb l’expressió de la 77 (`j***@domini.cat`), el camí, el nombre de sessions i l’última activitat, amb una clau opaca que només val dins de la mateixa consulta. No retorna l’identificador de sessió, l’UUID de la persona, el correu sencer, IP, tokens ni `user_agent`. Cada consulta deixa una fila (actor, filtres, files i total) a `private.admin_lectures_sessions`, sense clau forana a cap persona, amb RLS restrictiva, cap privilegi per a cap rol client i un disparador que rebutja UPDATE, DELETE i TRUNCATE (`SDP-ADMIN-AUDIT-IMMUTABLE`). La purga als 12 mesos és una operació manual de l’operador de base.

`aportacions_culturals` té RLS activa i cap accés directe concedit a `anon` o `authenticated`: les RPC imposen l’autoria amb `auth.uid()`. Qui aporta veu les seues files; la curadoria autoritzada veu la safata. `private.curadors_culturals` només admet assignacions de l’operador de base després de verificar el compte: cap nom, correu o prop de React concedix el rol. Per revisar cal este rol amb aal2, o superadmin amb aal2, i ningú, tampoc el superadmin, pot decidir una aportació pròpia (`SDP-CULTURA-PROPIA`, 42501). La declaració de permisos és obligatòria, enviar exigix haver acceptat la versió vigent de les normes de convivència (disparador `aportacions_culturals_exigix_normes`, `SDP-MOD-428`, com a `section_submissions` i `xat_missatges`) i una aportació nova queda `pendent_revisio`.

Les RPC `estat_curadoria_cultural`, `llista_aportacions_culturals`, `envia_aportacio_cultural` i `revisa_aportacio_cultural` distingixen revisió d’ingestió: `aprovat` no publica res ni incorpora l’aportació a cap servei, i esta migració no connecta cap ingestió. El client només anuncia la capacitat `curadoriaCultural` amb la bandera de build `VITE_SDP_CURADORIA_CULTURAL=1`, que s’ha d’encendre només després d’aplicar esta migració; apagada, /page/nodrir-la-iaia ho diu, no fa cap petició i no recull res. Sense servidor, migració o permís, la interfície mostra l’estat pendent; no fabrica una safata buida ni un èxit. Esta tanda només aporta text/enllaços, sense pujada binària o d’àudio.

Cap rebut acredita que la migració s’haja executat sencera contra producció. La radiografia del Mestre del 16-11-2026 a les 14:54 (captura `261116_1454`) hi troba `private.pot_curar_cultura()`, sense comparar-ne el cos amb Git: l'estat remot no està acreditat sencer i cal conciliar-la abans de reaplicar-la. El bolcat del 13-11-2026 sí que les compara: `private.pot_curar_cultura()` i `revisa_aportacio_cultural(uuid,text,text)` no coincidixen amb cap versió de Git, i la resta, 56 objectes, sí (deriva R22; vegeu la taula canònica). La prova seca `tests/migracions-r15-prevol.test.mjs` l’executa en PostgreSQL WASM (PGlite) amb una fixture sintètica de GoTrue; no acredita Supabase. Requerix revisió i verificació SQL real pel carril integrador. Les proves de transport amb dobles del servidor no acrediten permisos desplegats, assignacions de rol ni ingestió remota.

## Vincles

- [[00_index]]


## R32.11 · CAS general aplicat a Producció, client encara sense activar

`snippets/r32_11_publicacions_cas.sql` és un paquet **manual, fora del catàleg de
124 migracions**. Segons el rebut del Mestre, l'aplica a **Producció el 19-11-2026 a
les 01:37 CET** des de l'editor SQL («Success. No rows returned», amb el preflight i el
postflight integrats): `REBUT_SQL_PRODUCCIO_R32_11_PUBLICACIONS_CAS_261119_0137.json`, a la
carpeta `_investigacio_ia_de_poble/261118_marato_matinada_deute_zero_v1_2_8/`, amb el
SHA-256 `d36dcacd…`, el mateix d'este fitxer. La capçalera del fitxer conserva «MANUAL,
NO APLICAT A PRODUCCIÓ» perquè el SHA-256 ha de ser el del rebut: l'estat és el d'esta secció. Implementa la RPC nova
`publica_section_submission_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)`.
El token nul només crea; un token llegit actualitza exactament eixa revisió.
L'opID lliga una petició immutable i permet recuperar un ACK perdut. Un replay
després d'una altra edició torna conflicte i conserva l'esborrany local.

El paquet conserva els triggers vigents i afegix una versió estrictament
monotònica, panys transaccionals, autoria derivada d'Auth i dels helpers reals,
rebuig d'actes vinculats a Notes o retirats i rebuts privats sense cos UGC. Els
rebuts s'exporten només a la persona propietària i es retiren per FK quan
s'esborra la publicació, el compte o el poble. L'embolcall d'exportació conserva
les extensions vigents de R28. El preflight i el postflight rebutgen identitats
DDL, polítiques, ACL de columna/rol custom, funcions o ordre de triggers
inesperats i fan rollback de tota la instal·lació. El cos de l'exportador base
està fixat al canònic R28, no s'accepta un helper privat homònim desconegut.
Reaplicar un exportador històric després del
paquet exigix revisar i restaurar esta extensió abans d'activar clients.

El client reutilitza `appendSectionSubmissionNetworkOnly` amb
`expectedUpdatedAt` i `operationId` explícits. La cua `versionada: true`
persistix l'operació abans d'enviar-la i conserva token, opID i esborrany davant
error, cancel·lació o canvi de sessió/backend. Si falta la RPC, no fa upsert.
Una fila que ja ha usat CAS conserva eixe requisit en disc i rebutja un
reintent legacy després de recarregar. `versionada` continua desactivat per
defecte: el rebut manual ja existix, i activar-lo en un client és una tasca posterior;
la ruta legacy continua sent compatible i no acredita CAS.

Prova local reproduïble, sense accés remot:
`SDP_PGLITE_MODULE=/ruta/pglite/dist/index.js node --test tests/r32_11_publicacions_cas.test.mjs`.
Hidrata el catàleg congelat complet i després el paquet manual, inclosa la
reaplicació idempotent. PGlite serialitza les connexions: els dos contendents
són transaccions completes amb el mateix token; no és una mesura de càrrega ni
una prova de concurrència entre processos d'un servidor desplegat. També hi
ha proves JS dedicades de client i cua `*.cas.r3211.test.js`.

El CAS general rebutja amb `drets-cas-no-disponibles` qualsevol copyright
top-level no buit entrant o ja present a la fila. Els projectors de Mur,
Mercat i Arxiu el lligen com a llicència: purgar-lo i confirmar seria perdre
atribució legal. El draft, token, opID, publicació existent i fitxer local es
conserven; falta un contracte dedicat de drets abans d'activar eixe recorregut.
No es crea cap camp alternatiu i la metadata consentida nested es manté. El
camí legacy opt-out i les aportacions sense eixa dada no es bloquegen per
esta guarda. El parser pur de tokens valida el calendari i compara amb
BigInt, inclosos els sis microsegons de l'any 9999; el client rebutja rebuts
amb creació posterior a l'edició.

La identitat d'operació es reté durant la vida del recurs/compte/poble: la
purga per FK també elimina el rebut. No és un registre global etern d'opIDs.
Un UUID de publicació retirat continua denegat pels tombstones canònics.

El corrector local 05d conserva el `search_path` del caller i qualifica el
catàleg en els blocs de comprovació i les signatures DDL, sense canviar els
tres cossos de funció. Una ombra de tipus temporal (`pg_temp.text`, `uuid`,
`jsonb`, `bytea`, `timestamptz` o `bool`) es rebutja abans de qualsevol DDL:
el nom visible no acredita l’OID del tipus. Un namespace no temporal davant
de `pg_catalog` també es rebutja. El paquet manual actual té SHA-256
`d36dcacd4b644d5ba9eeb16e0988b3af2fe26feb4568ecf7de1704c655677950`; continua
sense aplicar-se a Producció. La prova local inclou instal·lació, reaplicació
i preservació del caller davant estes ombres.

La certificació nativa local usa PostgreSQL 18.6 i dues connexions
`READ COMMITTED`, amb espera del pany acreditada en `pg_locks` i el PID
bloquejant: creació/actualització, conflicte, replay i rollback. El catàleg
PG18 representa els huit `NOT NULL` també en `pg_constraint`; es comprova
exactament una restricció validada, enforced i local per cada columna
acreditada. PG17 conserva la comprovació `attnotnull` sense eixes files
addicionals. Les altres cinc restriccions continuen fixades i no s’accepten
columnes, restriccions ni metadades inesperades. Prova:
`node --test tests/r3211-publicacions-cas-native.test.mjs`, només amb la
fixture de clúster descartable per socket Unix; no acredita Auth/JWT signat,
PostgREST ni cap desplegament remot.

## R32.13 · ACK causal CRDT i moderació diligent, paquet manual

`snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql` és un paquet **manual
i fora del catàleg de migracions**. **Llei 0 · Aplicat a Producció el 19-11-2026 a les
18:02 CET** pel Mestre, dins del Super-Bundle R32.14 (10/10 TRUE,
`REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`). Requerix el
catàleg complet de `v1.2.8`, inclòs el flux LSSI de R32.5. No substituïx cap
migració històrica ni s'executa en importar el client.

PF-03 conserva captures i DOTs en taules privades per poble i persona
autenticada. Un request ID repetit conserva els bytes i l'hora remota del
primer rebut; no renova artificialment l'antiguitat. Un DOT contradictori o
un replay amb un cos diferent es rebutgen. El client només compacta
supressions de més de 90 dies acreditades per un rebut remot de la captura
exacta; operacions locals posteriors o no confirmades es conserven. Si falta
la RPC, no hi ha ACK remot ni compactació substitutòria.

La part LSSI reutilitza `public.denuncies`, el validador de publicacions i el
hash d'IP existents. La denúncia obri una petició de revisió humana: no
determina il·legalitat ni oculta contingut automàticament. La revisió usa
versió CAS i traça privada; la retirada cautelar conserva l'original. Les
RPC i les taules tenen privilegis mínims, RLS i `search_path` buit als
cossos privilegiats; la instal·lació conserva el path del caller i rebutja
espais de noms que podrien suplantar el catàleg. La baixa del compte purga
els rebuts i les captures personals segons les FK; els rebuts anònims no
adquirixen autoria autenticada.

Prova local reproduïble:

```sh
SDP_PGLITE_MODULE=/ruta/existent/pglite/dist/index.js node --test tests/r3213-pf03-lssi-postgres.test.mjs
```

La suite prepara un clúster descartable de **PostgreSQL 18.6**, comprova dos
PIDs de backend independents en **READ COMMITTED** i observa l'espera dels
panys abans de commit o rollback. També executa el mateix paquet amb
**PGlite**, incloent-hi límits d'ACL/RLS, mutants i ombres de tipus hostils.
PGlite serialitza les seues consultes i no substituïx la prova nativa de
dues sessions. Estes proves no acrediten Auth/JWT signat, PostgREST,
desplegament ni aplicació a la base de dades remota.


## R32.14 · Paquet únic (aplicat a producció el 19-11-2026) i vista prèvia privada

`snippets/r32_14_super_bundle_produccio_pendent.sql` unifica en una transacció les tres migracions pendents `20261117173000`, `20261117193000`, `20261118230000`, els dos snippets R32.10, R32.13 i la vista prèvia R32.14. Era un paquet manual pendent; cap agent no l'ha aplicat remotament: l'aplicà el Mestre el 19-11-2026 (vegeu la nota Llei 0 d'ací baix). Preserva R32.11, ja aplicada, i requerix el catàleg previ de producció: no és un bootstrap d'un projecte Supabase buit.

La comprovació reproduïble és `node tooling/migrations/genera-super-bundle-r32_14.mjs --check`. El compilador és només de lectura: `--stdout` emet exclusivament el SQL; per regenerar el fitxer explícitament al clon, executeu `node tooling/migrations/genera-super-bundle-r32_14.mjs --stdout > supabase/snippets/r32_14_super_bundle_produccio_pendent.sql`. Les guardes obligatòries fixen estructures, funcions, ACL directes/efectives, propietat, índexs i disparadors abans i després; una deriva desconeguda avorta tot el lot. Els imports LSSI no dupliquen auditoria al repetir. La consulta `snippets/r32_14_preflight_produccio_pendent.sql` comprova prerequisits i `snippets/r32_14_postverificacio_produccio_pendent.sql` confirma el resultat, totes dues només de lectura. Verificació local: 31/31 sobre PostgreSQL 18.6 natiu i PGlite, dues aplicacions sobre bases neta/parcial i preservació de R32.11; cap prova local acredita Auth/JWT signat, PostgREST ni aplicació remota.

**Llei 0 · 19-11-2026 18:02 CET.** El Mestre va aplicar a Supabase Cloud (PostgreSQL 17.6), en una sola transacció, la variant de producció d'este paquet (`SUPER_BUNDLE_SQL_PRODUCCIO_R32_14_COPIAR_ENGANXAR.sql`, 129.350 B, al dipòsit `_investigacio_ia_de_poble/261119_marato_dinar_v1_2_11_r32_14/`). Només canvia les guardes: excloure `service_role` de la comparació d'ACL, perquè Supabase Cloud li dona privilegis per defecte sobre `public.*`. La postverificació inclosa va tornar 10/10 TRUE (`REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json`). El fitxer d'este directori no s'edita: és la font del generador i el seu `--check` el fixa. Onada v1.2.13 · Les files 122–125 de la taula canònica i les dels paquets R32.10 i R32.13 ja diuen «Aplicada a producció el 19-11-2026 a les 18:02 CET», amb el rebut citat. El test de rebuts admet este JSON de la postverificació (`RE_REBUT` de `tests/supabase-readme-rebuts.test.mjs`).

## R32.15 · Pegat P2 de `registra_denuncia_diligent`

`snippets/r32_15_patch_registra_denuncia_diligent_produccio.sql` corregix el P2 del Gauntlet v1.2.11. Abans, la RPC diligent descartava el rebut de `denuncia_publicacio_mur`. Si el disparador ja havia deduplicat una denúncia pendent de la mateixa persona, tornava `repetida:false` i el detall nou es perdia.

Ara el rebut del Mur decidix `repetida`, i el detall nou (amb el motiu) queda com a ampliació append-only a `private.r3213_lssi_audit`, sense reescriure l'original. Hi ha com a màxim cinc ampliacions distintes per denúncia i persona, i 20 rebuts per persona i denúncia, el primer inclòs (`SDP-LSSI-429` després: el camí deduplicat no passava per cap quota del disparador). La denúncia es busca pel tipus exacte de la publicació i amb `FOR SHARE`: si una decisió humana simultània la trau de «pendent», la RPC no torna un rebut d'un cas tancat. El DTO del rebut no canvia (`id`, `estat`, `versio`, `repetida`), de manera que el client v1.2.11 de producció el continua acceptant.

El paquet és transaccional i idempotent. La guarda prèvia accepta el cos R32.13 (SHA-256 `8e833390…`) o el R32.15 (`6f9974a0…`), i qualsevol altre avorta tot amb `SDP-R3215-DRIFT`. La postguarda fixa el cos, `SECURITY DEFINER`, `search_path=''` i l'ACL exacta (`anon` i `authenticated` amb EXECUTE). Exclou `service_role` de la comparació, pels privilegis per defecte de Supabase Cloud. **Aplicat i certificat a Producció (19-11-2026)**: el Mestre l'aplicà a l'editor SQL de producció després del Super-Bundle R32.14, i la verificació de les 23:11 CET torna el cos `6f9974a0f6a46d8ca8e87e7ed617dd3eb5dbf4dfe0d8a73d61f6a6f8dc178fe9`, `search_path=""` i EXECUTE només per a `anon` i `authenticated` (`SECURITY DEFINER` el fixa la postguarda del mateix pegat) (`REBUT_SUPABASE_PRODUCCIO_R32_15_PAS1_LSSI_I_CENS_DEFINERS.json`). Prova executable: `tests/r3215-lssi-repetida-postgres.test.mjs`, en PostgreSQL 18.6 natiu i PGlite. La prova reprodueix el defecte en roig sobre la preimatge, aplica el pegat dues vegades i n'avorta la deriva.

Les ampliacions encara no arriben a cap safata: `llista_denuncies_diligents` i `admin_safata_denuncies_lssi` tornen només el detall original, i ampliar-ne el DTO trencaria el client v1.2.11 (`filaDenunciaDiligent` admet sis claus exactes). Fins que el Mestre decidisca com mostrar-les (D-R32.15-2: RPC nova de lectura o taula pròpia), la persona administradora les llig a l'editor SQL amb `select a.denuncia_id, a.creat_al, a.justificacio from private.r3213_lssi_audit a where a.anterior is not distinct from a.estat and starts_with(a.justificacio, 'Ampliació del denunciant (motiu: ') order by a.creat_al;`.

## R32.15 · Diagnòstic i blindatge manual de definers heretats

`snippets/r32_15_diagnostic_definers_produccio.sql` és un únic SELECT de
lectura del catàleg. Inventaria les rutines SECURITY DEFINER no internes,
search_path, propietari, ACL directa i efectiva, definició i SHA-256, sense
executar-ne els cossos. Les funcions i els operadors de la sonda estan
qualificats amb pg_catalog: un esquema hostil del caller no pot introduir
execució per resolució d'operadors. Cal exportar i revisar eixe resultat
abans del blindatge.

**Llei 0 · Aplicat i certificat a Producció (19-11-2026).** El Mestre va executar
la sonda i després el blindatge a Supabase Cloud (PostgreSQL 17.6). La
verificació de les 23:22 CET dona les 7/7 postimatges dels definers fòssils
amb `public_exec: false` i `anon_exec: false`, i les 136/136 rutines
SECURITY DEFINER de `public` i `private` amb `search_path=""`
(`REBUT_SUPABASE_PRODUCCIO_R32_15_COMPLET_136_DE_136.json`). Els rebuts
viuen a `_investigacio_ia_de_poble/261119_marato_dinar_v1_2_11_r32_14/`.

`snippets/r32_15_blinda_definers_heretats_idempotent.sql` és un paquet manual
transaccional amb pany consultiu. Accepta només set capsules revisades de
signatura, cos i metadades, qualifica les referències i fixa search_path
buit. Revoca PUBLIC/anon i conserva els grants explícits legítims, OID,
owner, defaults i disparadors. Una rutina pendent desconeguda de
public/private, deriva d'autoritat o membresia als propietaris avorta el
conjunt; no és un parser SQL general. La sonda també mostra altres esquemes,
que no queden sanejats per este paquet.

Verificació reproduïble local: `SDP_PGLITE_MODULE=/ruta/pglite/dist/index.js
node --test tests/r3215-definers-postgres.test.mjs`, amb **67/67 PASS** sobre
**PostgreSQL 18.6 natiu** i **PGlite 0.3.16 (PostgreSQL 17.5)**. Inclou dues
sessions natives amb el pany observat, replay, ACL, rollback i mutants de
cos, tipus, membresia NOINHERIT/SET i operadors hostils. El rebut estàtic R6
queda fixat a estos bytes i a les proves obligatòries: no acredita l'estat
de Producció ni reemplaça una revisió d'autorització funcional.

Els backups R32/R32.10 anteriors es conserven. Després d'una postimatge
R32.15, els replays antics poden refusar la deriva, com correspon als seus
pins històrics. La costura del rebut repetit LSSI d'R32.13 identificada pel
Gauntlet v1.2.11 correspon al carril integrador; este blindatge de definers
no la dona per resolta ni altera el dipòsit immutable del paquet R32.14.

## R32.17 · Reserva immutable de reposició per cicle

`snippets/r32_17_reserva_inventari_cicle_idempotent.sql` és un paquet manual
fora del catàleg de migracions, **NO aplicat a Producció en aquest
lliurament**: no s'ha executat SQL remot ni hi ha un rebut propi d'aplicació.
Requerix `public.towns`, `public.town_memberships`, `auth.uid()` i
`private.is_town_member` del catàleg canònic.

La reserva conserva la clau única exacta `(tenant_id, magatzem_id,
article_id, cicle_id)` i la quantitat del primer rebut; una repetició amb
quantitat divergent es rebutja i les claus no es reciclen per caducitat.
Les guardes comproven els tipus `pg_catalog.uuid`, `text`, `int8` i
`timestamptz`, el propietari i els índexs; el CHECK dels identificadors (sense
format Unicode invisible, també els astrals, ni espais als extrems) es renova a
cada instal·lació, i una fila antiga que el viole fa fallar la transacció. La taula té RLS activada (sense FORCE, com la resta del catàleg: la RPC definer no depén de BYPASSRLS) per
pertinença al poble. L’ACL revoca PUBLIC, anon i service_role; les
concessions directes a `authenticated` són només SELECT de la taula i
EXECUTE de la RPC, sense escriptura directa.
La RPC és SECURITY DEFINER amb `search_path = ''`, dependències qualificades
i verificació de l'administració del poble amb pany fins al commit.

Verificació local: `tests/r3217-reserva-inventari-postgres.test.mjs`,
**31/31 PASS** sobre un esquema local de prova amb **PostgreSQL 18.6**
(dues sessions natives independents) i **PGlite 0.3.16 / PostgreSQL 17.5**
(sense sessions independents). Inclou COMMIT/ROLLBACK concurrent,
READ COMMITTED, avortament segur 40001 en REPEATABLE READ, ACL/RLS i
preimatges hostils. Les proves locals no acrediten Producció. La reserva
no executa compres externes ni promet una compra exactament una vegada;
`creada=false` mai autoritza repetir una compra.

Cicle de vida (pendent de decisió del Mestre abans d'aplicar-lo): la taula és
immutable i no té cap camí d'esborrat. `creada_per` conserva l'identificador
pseudònim de qui va reservar encara que deixe el poble, i la clau forana
`tenant_id` (sense `ON DELETE`) impedix donar de baixa un poble que tinga
reserves.

## R32.19 · Controls LSSI i sonda de només lectura

`snippets/r32_19_lssi_control_i_unicode.sql` és el pegat incremental
D-v1213-3, verificat localment en PostgreSQL 18.6 natiu i PGlite.
Requerix R32.13/R32.15 LSSI i la fila 120. Refusa C0 excepte TAB/LF/CR i
DEL abans de rebuts i deduplicació; protegix també ampliacions i notes de
revisió. La preguarda SHA dels tres RPC i dels helpers nous rebutja deriva,
i la reexecució preserva ACL, històric i CHECK ja validats. El trigger de
detall deixa revisar denúncies antigues sense reescriure’n el text.

Des del Gauntlet de la v1.2.15, el trigger de detall és `SECURITY DEFINER`
(`search_path=''`). `public.denuncia_contingut` és `SECURITY INVOKER`, i ni
anon, ni authenticated, ni service_role tenen EXECUTE sobre l’ajudant privat.
Amb el trigger INVOKER, totes les denúncies que no són del Mur haurien fallat
amb 42501. La prova cobrix anon i authenticated, amb detall i sense, el
control C0 (22023) i l’INSERT i l’UPDATE de service_role (26/26, natiu i
PGlite).

**NO aplicat a Producció en este lliurament.** L’aplicació correspon al
Mestre després de revisar la sonda i les preimatges. UTF8/JSON del servidor
ja refusen NUL i surrogats invàlids; U+FFFD substituït pel client és un
escalar vàlid i no permet reconstruir el text perdut.

`snippets/r32_19_sonda_readonly_files_120_121.sql` usa `BEGIN READ ONLY` i
un termini de dos segons: mostra les peces LSSI de `20261117140000` i el
registre `sistema-nervios` de `20261117150000`, sense dades personals ni
escriptures. El resultat acredita estat estructural actual; no autoria,
data d’aplicació ni ledger de migracions. Les files 120–121 del catàleg
no canvien d’estat per una prova local.

Proves: `tests/r3219-lssi-control-postgres.test.mjs` (26/26 locals),
`tests/r3219-ap-fetch-pinnat.test.mjs` i regressió AP. `ap-inbox-verifica`
rep un transport HTTPS pinnat amb Host/SNI i certificat originals, IP pública
congelada i proxy ambiental desactivat. `SDP_AP_ACTIVA` continua apagada per
defecte; no s’ha executat Deno/Edge ni desplegat federació remota.


## R32.25 · Directes limitats i Bàndols preparats, apagats

- `migrations/20261121090000_r32_25_push_directes_i_bandols.sql`
  Preparació local, **no aplicada a Producció**. D-24 limita els directes nous d’un remitent a 10 en 24 hores; el missatge continua enviant-se quan es talla el push. Bàndols només de `city_hall` del mateix poble, amb consentiment, dos en 24 hores, deu minuts de separació i silenci 22:00–08:00 Europe/Madrid. `push_poble_actiu` naix a `no`.

  Ha d’anar després de `2611080431`, `2611122200`, `20261116031000` i `20261118230000`. Worker compatible abans de migració.

  Provisió (v1.2.17 · Gauntlet R2, L4R2-01). La provisió push **no** porta esta migració: `MIGRACIONS` de `tooling/push/aprovisiona-push.mjs`, i per tant `staged/schema.sql` (el pas 1 de l’activació T-03 del Canal 1), acaba en `20261118230000`. És decisió del Mestre (informe v1.2.17): dins del pas 1, R32.25 arribaria a Producció abans del worker, i el `schema.sql` que el Mestre ja té preparat deixaria de casar (`stage_drift`). L’ordre és: primer T-03 sencer amb el worker `notifica-xat` de la v1.2.17 (porta `funcio-notifica-xat-r32-25` d’`ordre_desplegament.json`) i, després, esta migració, a part. Si mai es torna a passar `staged/schema.sql`, que reaplica `2611020417` i `2611080431`, tornen `private.xat_push_encua`, `private.xat_push_candidats_v2` i `public.xat_push_reclama_v2` sense D-24 ni Bàndols: cal tornar a aplicar `20261121090000` després (`reaplicacio` d’`ordre_desplegament.json`). Ho fixa `tests/missatgeria-r21-2-postgres.test.mjs` sobre PostgreSQL 18.6 natiu.

  Activació municipal, client/canal Android, text legal i prova física tenen lliurament propi: este kit no els acredita.
