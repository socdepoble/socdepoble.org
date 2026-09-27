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

`membres_del_poble(p_tenant_id, p_cerca, p_limit)` és l'única funció del
projecte que ensenya dades d'una altra persona. Convé tindre-ho escrit:

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
expressa. I les polítiques sobre `realtime.messages` que autoritzen el canal
privat (vegeu «Realtime»).

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
previs. La confirmació per correu i OAuth depenen de la configuració del node.

Prova local explícita: `node tests/integration/local-auth-chat.mjs`, amb Vite
en 3340, API Supabase en 54321 i Docker local. Rebutja qualsevol endpoint
extern. Crea dos comptes temporals, verifica login, directori, entitat,
enviament/reintent/recepció i retira només els UUID creats per la prova.
Les credencials no s’imprimixen ni es desen. La fixture SQL
`tests/fixtures/xat-entitats/regression.sql` comprova aïllament, RLS,
revocacions i autoria dins d’una transacció que acaba en rollback.

## Realtime

Les taules del xat **no** estan a la publicació `supabase_realtime`, a propòsit.
Mentre no hi estiguen, qualsevol subscripció per `postgres_changes` es connecta,
no dóna cap error i no rep res mai: el pitjor mode de fallada possible.

Des de `260927_0200`, el disparador `xat_missatges_avisa` emet un avís pel canal
privat `xat:f:<fil_id>` amb `realtime.send` (només `{ filId, seq }`: el client
demana les dades amb `xat_nous`). L'enviament està embolicat en
`exception when others`: si la funció no existix o el canal no té política,
l'avís es perd en silenci i el missatge es guarda igual. Perquè el client puga
subscriure's al canal privat falten les polítiques sobre `realtime.messages`
(ARQ-D02 de l'especificació); no són al repositori perquè la porta
`tractor-rls.mjs` (R1) acusaria de taula fantasma qualsevol política fora dels
esquemes `public` i `storage`. Fins que entren, el frontend continua amb el
sondeig adaptatiu (`XatContext.jsx`). Comprova al panell que Realtime RLS està
actiu abans d'afegir-les, o els avisos es difondran a qui no toca.

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
