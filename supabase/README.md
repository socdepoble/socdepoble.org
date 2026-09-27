---
type: document
status: canonic
description: "Documentació canònica de Sóc de Poble."
---
# Supabase

## Fitxers

- `migrations/260908_0000_initial_schema.sql`
  Taules base, funcions de `private`, triggers d'alta i polítiques RLS.

- `migrations/260908_xat_v2.sql`
  Les quatre taules del Xat v2 (`xat_fils`, `xat_participants`, `xat_missatges`,
  `xat_lectures`), el trigger de `actualitzat_al` i les polítiques RLS.

- `migrations/260908_xat_v2_correccions.sql`
  Pegat correctiu del Xat v2. **Tampoc és opcional.** Vegeu «Per què cal el
  pegat» més avall.

- `migrations/260908_xat_v2_membres.sql`
  L'RPC `membres_del_poble()`. Sense ell no hi ha manera d'obtindre l'uuid de
  ningú i el botó «Nova conversa» és impossible. Porta una decisió de
  governança dins: vegeu «El directori del poble».

- `migrations/260911_0600_perfil_avatar_i_permisos.sql`
  Permisos DML i definició RLS bàsica per a perfils.
  
- `migrations/260912_1500_correccio_privacitat_perfils.sql`
  Correcció estricta RLS per a perfils i organitzacions.

- `migrations/260912_admin_panel.sql`
  Funcions RPC per a l'admin panel.
  
- `migrations/260913_0500_bucket_mitjans.sql`
  Creació del bucket `mitjans` per a àudios i avatars.

- `migrations/260914_0000_schema_notes.sql`
  La taula `notes` i les seues quatre polítiques. **No és opcional**: sense ella
  el Bloc de Notes torna 404 i el «Retall» del Xat no es pot guardar.

- `migrations/260914_0100_auditoria_rls_fixes.sql`
  Paquet global d'auditoria (Deepseek, Perplexity, Dola, Claude). 
  Resol spoofing de tenant al registre, SSRF i accessos anon RLS.

- `migrations/260915_0000_seguretat_profunda_deepseek.sql`
  La taula `consentiments`, l'RPC `registra_consentiment()`, l'alta amb
  `tenant_id` obligatori i la paginació d'`admin_list_users`.

- `migrations/260916_0600_politiques_superadmin_organitzacions.sql`
  Lectura pública d'`app_content` i del directori d'organitzacions per a
  convidats, i `create_organization` sense l'upsert que fallava sempre.

- `migrations/260916_2300_correccions_mur_i_xat.sql`
  El trigger d'autor neteja `id`, `created_at` i `author` del payload (C1), i
  només qui ha creat un fil hi pot afegir persones (C2).

- `migrations/260919_1650_bucket_mitjans_privats.sql`
  El bucket privat `mitjans_privats` per als adjunts de les notes.

- `migrations/260920_0300_blindatge_storage_i_contingut.sql`
  Rutes pròpies a Storage, polítiques restrictives de frontera i llista
  explícita de claus públiques d'`app_content`.

- `migrations/260920_0600_xat_limit_correccio.sql`
  `xat_missatges_del_fil()` torna els 50 missatges més recents.

- `migrations/260921_1820_fix_security_definer.sql`
  Força `security_invoker` a la vista `organization_directory`.

- `migrations/260926_1200_publicacions_autoria.sql`
  Autoria dual de les publicacions (persona o entitat), `updated_at` i
  `organizations.logo_url`.

- `migrations/260926_1500_identitat_perfil_f1.sql`
  Fase 1: fitxa editable de persona i d'organització (`lema`,
  `presentacio_html`, `hero_url`), consentiment versionat i demostrable, alta
  que no cau mai, exportació de dades, baixa amb quarantena i purga. Vegeu
  «Baixa, purga i consentiment».

- `migrations/260927_0200_xat_f0_fonament.sql`
  Xat F0 (Fonament): número d'ordre `seq` per conversa i marques per
  participant (`llegit_fins_seq`, `rebut_fins_seq`), cap escriptura directa a
  `xat_missatges` (tot per RPC), visibilitat per finestra de `seq`, i les RPC
  `xat_envia` (idempotent per `id`), `xat_historial`, `xat_nous`, `xat_marca` i
  `xat_fils_meus` v2. Vegeu «Xat F0: seq, marques i RPC».

- `seed.sql`
  Contingut inicial del portal.

## Ordre correcte

1. Crear el projecte en Supabase.
2. Obrir el SQL Editor.
3. Executar els fitxers SQL del directori `migrations/` en ordre alfabètic.
4. Executar `seed.sql`.
5. Configurar el `.env` local amb `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`.

Els fitxers de `migrations/` són idempotents o utilitzen `IF NOT EXISTS`: es poden tornar a executar.

## Per què cal el pegat

`260908_xat_v2.sql` crea les taules bé, però el xat no arriba a funcionar. Tres
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

`260926_1500_identitat_perfil_f1.sql` deixa tres peces que no es completen
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

`260927_0200_xat_f0_fonament.sql` és additiva i idempotent, però el client i
l'esquema van junts: l'adaptador nou crida `xat_envia`, `xat_historial`,
`xat_nous`, `xat_marca` i la v2 de `xat_fils_meus`. Contra una base amb
l'esquema anterior el xat remot falla fins que s'aplique; i un client antic que
inserisca directament a `xat_missatges` deixa de poder-ho fer després
d'aplicar-la (és intencionat).

**Ordre d'aplicació.** Després de `260926_1500_identitat_perfil_f1.sql` (usa
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
  no les usa. Es mantenen perquè `seed.sql` encara les omple i perquè
  `loadAppData()` (mètode del contracte, ja sense cridadors dins de `src/`) llança
  si `chat_threads` està buida. No les esborres sense tocar eixos dos punts.
- El frontend admet `VITE_DATA_MODE=auto|supabase|hybrid|seed|local`.
- Regenerar el SQL de dades seed és una mutació governada i requerix el segell
  criptogràfic de `canonada.mjs`.

## Vincles

- [[00_index]]
