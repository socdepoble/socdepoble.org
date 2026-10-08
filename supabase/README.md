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
  (2609272200) i `private.purga_una_baixa` (2609261500). **No està aplicada,
  com tampoc F0 (2609270200) ni `xat_entitats` (2609272200), de les quals
  depén: va després de les dos i de 2609282035.** Sense moderació: vegeu «Xat
  de pàgina i comunitats».

- `migrations/2610042330_xat_pagina_iaia.sql`
  Correcció posterior al xat de pàgina: `/iaia` és la clau i ruta canòniques;
  l'entrada antiga exacta `/ia` resol al mateix fil. Reanomena les metadades
  del subjecte preservant id, missatges, seq, participants i permisos. Un
  CHECK impedeix recrear la clau antiga. Si un poble ja té les dos files,
  `SDP-XAT-014` avorta tota la transacció; no fusiona ni esborra històries.
  **NO aplicada. Va després de 2609282100 i les seues dependències**, abans
  de publicar un client amb la nova ruta; conserva la condició de moderació.

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
  pot esborrar d'`auth.users`; si no, cada intent hi deixarà l'error.
- `private.purga_una_baixa()` torna a llegir i bloqueja la fila de
  `private.baixes` abans d'esborrar res (i torna `false` si ja no hi és o no
  ha vençut): una cancel·lació confirmada mentre la purga corre no acaba
  esborrant el compte. Només es compten les purgades de veres.

**Els fitxers de Storage no s'esborren des de SQL.** La purga només posa a
la cua `private.purga_storage_pendent` els fitxers de la carpeta de la
persona, i marca `referenciat = true` els que encara usa una entitat (logotip,
capçalera o una imatge del cos de la fitxa) o una publicació. Es compara amb
`<bucket>/<nom>`: la còpia pública d'un adjunt té el mateix nom que l'original
privat, i l'original no queda referenciat per ella. Falta la peça que buida la cua: una funció amb
`service_role` que esborre per l'API de Storage les files amb
`referenciat = false` i `feta_al is null`, i en marque `feta_al`. Fins que
existisca, els fitxers de qui se'n va es queden al bucket.

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
- El frontend admet `VITE_DATA_MODE=auto|supabase|hybrid|seed|local`.
- Regenerar el SQL de dades seed és una mutació governada i requerix el segell
  criptogràfic de `canonada.mjs`.

## Vincles

- [[00_index]]
