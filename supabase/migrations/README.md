---
type: document
status: canonic
description: Índex de dependències i comprovacions locals de les migracions, amb mínim privilegi i estat remot separat.
---
# Migracions SQL

El catàleg complet i les notes d'aplicació viuen a [supabase/README.md](../README.md). Els fitxers d'esta carpeta són candidats de codi: la seua presència i les proves locals no acrediten aplicació al servidor remot. No executeu el directori a cegues per ordre alfabètic.

## Registre FEDI-16 i dependències

| Migració | Canvi i dependències | Privilegis i verificació |
| --- | --- | --- |
| [2610061448_superadmin_aal2.sql](2610061448_superadmin_aal2.sql) | `private.es_superadmin()` requerix rol de plataforma `superadmin` i claim de servidor `aal2`; depén del catàleg d'autoritat anterior. | Cap rol de l'UI, `user_metadata` ni pertinença municipal substituïxen esta comprovació. |
| [2610101900_personalitzacio_superadmin.sql](2610101900_personalitzacio_superadmin.sql) | Lectura pública explícita de `taxonomia`/`estil`; historial i RPC d'escriptura amb versió optimista. Requerix `app_content`, `towns` i la funció d'autoritat amb `aal2`. | Historial amb RLS, sense escriptura directa; RPC `SECURITY DEFINER`, `search_path` buit, execució retirada a PUBLIC/anon i concedida a authenticated. La funció torna a comprovar autoritat. |
| [2611031500_notes_logo_mode_nit.sql](2611031500_notes_logo_mode_nit.sql) | Afig `logo_image_dark` i amplia el netejador d'imatges. Depén de `2609140000_schema_notes.sql` i `2610072230_mur_imatges_propies.sql`. | No amplia RLS ni autoria; el netejador privat continua sense EXECUTE per PUBLIC/anon/authenticated. Preparada, aplicació remota no acreditada per este registre. |
| [2611031700_administracio_multipoble.sql](2611031700_administracio_multipoble.sql) | `admin_llista_pobles()` i `admin_llegix_personalitzacio(uuid)`; requerix `towns`, `app_content`, `2610061448` i `2610101900`. | Només authenticated pot executar; l'RPC exigix superadmin+aal2 i llig únicament taxonomia/estil del tenant explícit. Cap concessió a anon o service_role. Preparada, aplicació remota no acreditada per este registre. |

L'adaptador local té una política d'administració injectada pel consumidor de la instància. És autoritat del magatzem local, mai una sessió MFA remota ni una concessió de permisos a Supabase. Els dos límits es proven separadament.

## Ordre i reaplicacions

[ordre_desplegament.json](../ordre_desplegament.json) és el registre executable de restriccions. Entre altres, **2610311800 → 2610312000 → 2610311900**: la 2000 va immediatament després de la 1800. Les finestres de publicació del client, les Edge Functions i les reaplicacions es consulten allí i al catàleg complet; no són una ordre d'execució remota des d'este document.

```sh
node scripts/supabase/verifica-migracions.mjs
```

## Assaig PostgreSQL i atac creuat

[administracio-multipoble-postgres.test.mjs](../../tests/administracio-multipoble-postgres.test.mjs) aplica el catàleg real fins a 2611031700 a PGlite i comprova les funcions, ACL, RLS i intents d'accés entre dos pobles. Usa un mòdul local existent, indicat explícitament; no instal·la paquets ni contacta un servidor.

```sh
SDP_PGLITE_MODULE=/ruta/local/pglite/dist/index.js node --test tests/administracio-multipoble-postgres.test.mjs
```

Sense eixa variable o amb un mòdul absent, el resultat és una omissió explícita: **cap migració SQL validada**. Auth/Storage/Realtime són infraestructura de fixture; `private.es_superadmin`, les taules de producte, les polítiques i les RPC provenen de les migracions reals. Les concessions ambientals de Supabase, GoTrue, PostgREST, el desplegament i les connexions simultànies d'un servidor complet necessiten verificació pròpia. Cap èxit de PGlite substituïx eixa verificació.

## FEDI23 · Registre de connexions consentides

[2611032100_connexions_publiques_i_membres.sql](2611032100_connexions_publiques_i_membres.sql): després del catàleg vigent fins a 2611031700; dependències de seguiments d'entitat 2610250100, membres concurrents 2610281730 i poble canònic 2610282100. Quatre taules privades amb RLS i sense grants als rols client ni service_role; sis RPC amb ACL mínimes. Les lectures públiques exigixen opt-in global, excepcions de vincle i perfils públics; rols funcionals no concedixen administració.

El catàleg i l'ordre detallats continuen a [../README.md](../README.md) i [../ordre_desplegament.json](../ordre_desplegament.json), sense aplicar alfabèticament el directori. La nova suite [connexions-publiques-postgres.test.mjs](../../tests/connexions-publiques-postgres.test.mjs) executa tot el catàleg real en PGlite amb el mòdul local explícit. Aplicació remota no acreditada.

## R20b · Propostes d'administració i restauració municipal

Les dos SQL són propostes de laboratori independents sobre el catàleg de 76. La integració R7 activa conserva les 76 i n'exclou ambdues; este kit no les desplega. Aplicades juntes, el catàleg proposat té 78 migracions.

`2611052345_admin_usuaris_i_organitzacions.sql` permet llegir perfils amb consentiment vigent del poble seleccionat, amb correu emmascarat i cursor amb 50 files com a màxim. Crear una invitació requerix superadmin amb `aal2`, consentiment i pertinença al poble, i ser ja owner/admin de l'organització. La invitació no crea cap pertinença: només la destinatària autenticada pot acceptar o rebutjar-la, i l'acceptació revalida l'autoritat i el consentiment. Només admet `member`; no permet autoassignar-se, imposar membres, nomenar administradores ni retirar membres. Els canvis de rol continuen en les RPC canòniques, inclosa la protecció `SDP-ORGMEM-006`. L'auditoria privada és transaccional i no admet UPDATE/DELETE. Les invitacions s'esborren en cascada amb el compte i amb l'entitat, de manera que la purga de baixes no queda bloquejada (G2-03). Seguir una persona actua només com l'actor real, sense crear relació recíproca. L'adaptador local declara la capacitat, però valida l'entrada i rebutja sempre amb `no-disponible` (arbitratge G2). Les notificacions i la interfície d'acceptació no estan connectades en este kit.

`2611060010_restauracio_municipal_opendata.sql` separa les dades públiques importades dels perfils, Notes i pertinences del servidor. El paquet ZIP 1.2.0 es revalida al servidor amb SHA-256 i regeneració canònica; la RPC comprova el tenant, els camps públics, els identificadors globals i els conflictes. La importació fa upsert: no esborra registres absents del paquet. `tests/restauracio-independent-r20b.test.mjs` verifica la 78 sola sobre les 76; `tests/admin-invitacions-r20b.test.mjs` verifica la 77 sola sobre les 76 i la regressió K3-02 dels xats privats. Usen el catàleg i el llibre de migracions reals de PostgreSQL 17 (WASM), sense substituir les guardes. `tests/node0-r13-municipal.test.mjs` conserva les proves integrades de les 78, inclosa la denegació de metadades OKF privades niades i el rollback. `tooling/node0/verifica-restauracio-municipal-321.mjs` restaura tres còpies locals en tres bases netes i declara explícitament que dos mitjans físics i una còpia externa no estan acreditats. No és una prova de desplegament natiu ni de MFA del Node0.

## R20 · Porta nativa de co-publicació i Mur

`2611111735_copublicacio_registrada.sql` i `2611112005_mur_lectura_publica_foraster.sql` són les dependències de `2611112149_mur_estat_public_i_padro.sql`. La correcció és additiva: un únic predicat de metadades governa la lectura pública i la resolució del recurs de l'RPC. Les marques privades, d'esborrany o contradictòries dominen en `attributes`/`payload`, amb límit de 64 capes. Les notes privades reals es mantenen reservades al propietari membre.

```sh
npm ci
npm run test:sql
```

Este assaig usa PostgreSQL natiu amb un clúster efímer i dos clients simultanis, sense omissió silenciosa. Preferix `initdb`/`postgres` locals o `SDP_POSTGRES_BIN`; el devDependency fixat `embedded-postgres` aporta els binaris de reserva. Socket Unix curt i dades es retiren en acabar. Provat en macOS arm64, amb AAL2 literal, anti-autoaprovació, RLS, concurrència, rollback i reaplicació DDL. Claims i serveis Auth són fixtures: no és una prova de JWT, TOTP, GoTrue, PostgREST ni desplegament. La 2005 consta aplicada segons l'encàrrec del Mestre; la 1735 i la 2149 continuen pendents d'aplicació remota en este registre.

## R21.4 · Fil propi privat

`2611121630_xat_propi.sql` és una proposta additiva sobre el xat vigent (forma de retorn E2EE de `2610311800` i cadena de push `2611020417` → `2611080431`; assajada amb `2611080432`). No requerix la migració IAIA `2611080430`. La creació de `crea_fil_directe(tenant, auth.uid())` queda serialitzada i identificada per propietari i poble, amb un únic participant i comprovacions diferides d'integritat. No amplia les concessions del client ni altera les branques de consentiment dels directes entre dos persones i les entitats.

El fil propi retorna la mateixa forma de `xat_fils_meus`, amb `participants=1` i la identitat pròpia en `altres`. El disparador dels missatges propis avança rebut/lectura i lleva la marca manual de no llegit. Les baixes pendents i la pèrdua de pertinença impedixen l'accés. La igualtat entre creador i propietari es comprova al final de la transacció perquè la purga física existent puga completar `SET NULL` i `CASCADE` sense deixar orfes. El planificador pot reclamar una fila de cua del missatge propi, però no troba cap destinatari ni crea cap lliurament: no hi ha auto-push.

```sh
node --test tests/xat-propi-r21-4-postgres.test.mjs
```

La suite usa PostgreSQL 18.6 real, dos connexions amb espera observada del pany, idempotència, RLS/ACL, titularitat, lectura automàtica, zero destinataris amb tres dispositius propis, regressió del directe normal i baixa física amb missatges. No certifica la UI, el camí d'adjunts/xifrat propi, cap desplegament ni recepció física.

## R21.5 · Reparació del catàleg sense esborrar persones ni entitats reals

`2611121700_purga_agents_app_content_i_hidratacio_canonica.sql` només modifica les files existents de `public.app_content` amb `key='agents'`; depén de la taula de `2609080000_initial_schema.sql`, sense cap funció de xat o IAIA. Hidrata les tres identitats canòniques del catàleg amb el payload públic de `src/data/catalegAgents.js` i la data tècnica estable `2026-09-08T00:00:00.000Z`, documentada prèviament per la identitat IAIA en `identitatsSeed.js`. Esta data no és una data de naixement, d'incorporació legal ni d'alta d'un compte remot real.

La purga usa els dotze identificadors de ficció de `ae9a9bdb5^:src/data/agentsSeed.js` i els tipus `AI`/`ANIMAL`, llevat de les identitats canòniques. Els UUID es comparen sense distingir majúscules i llevant els espais dels extrems; els identificadors no UUID es comparen exactament. El tipus es compara amb els espais de `String.trim` i majúscules. Mai classifica una persona pel nom, pel primer nom o per `personaKey`. Cada fila addicional legítima conserva exactament el JSONB, l'ordre i fins i tot els identificadors duplicats; els camps desconeguts i els tipus desconeguts, inclòs `SYSTEM`, no es purguen per si sols. Només es col·lapsen els duplicats de les tres identitats canòniques. Les altres claus i els tenants sense fila `agents` no es modifiquen.

La migració bloqueja breument les escriptures d'`app_content`, amb `lock_timeout=5s` i `statement_timeout=120s`, i valida tot el lot abans de tocar cap poble. Requerix arrays d'objectes, `id`/`name`/`type` de text o null quan existisquen, com a màxim 4.096 elements i 2 MiB en la representació JSONB. Una forma o mida no admesa aborta tota la transacció amb `SDP-AGENTS-001` i només el recompte de files; no trunca ni esborra dades malformades. Un array buit vàlid rep les tres identitats canòniques. Cal revisar i corregir les files bloquejants abans de repetir-la. El filtre del client és una salvaguarda de visualització i no repara per si sol la base de dades.

La versió i `updated_at` només canvien quan canvia el payload, sense desbordar l'enter de versió. La reaplicació és un no-op. No incorpora RPC, grants ni canvis de RLS.

```sh
node --test tests/agents-app-content-r21-5-postgres.test.mjs
```

La prova aplica la taula real a PostgreSQL 18.6, conserva les polítiques i ACL, contrasta diversos tenants, UUID en majúscules i tipus amb espais Unicode, preservació exacta de persones/entitats extra, duplicats, metadades, idempotència i rollback íntegre davant de dades malformades o grans. Les proves locals no acrediten l'aplicació de cap de les dos migracions al servidor remot.


## R21.6 · Frontera editorial i Notes privades

[2611121830_frontera_contingut_editorial_i_notes_privades.sql](2611121830_frontera_contingut_editorial_i_notes_privades.sql) requerix les taules reals `app_content` i `notes` (`2609080000` i `2609140000`), `private.is_town_member(uuid)` i **la funció real `private.es_superadmin()` de `2610061448_superadmin_aal2.sql`**. No se substituïx esta autoritat amb una funció de fixture, un rol de la UI o una pertinença municipal. Reafirma les tres polítiques canòniques de `2610101900_personalitzacio_superadmin.sql`, inclòs el cas d'un servidor que s'haguera quedat en la frontera anterior de set claus.

La lectura pública d'`app_content` queda acotada a les nou claus ja previstes pel contracte canònic: `towns`, `pages`, `feedPosts`, `marketItems`, `events`, `mediaItems`, `onboarding`, `taxonomia` i `estil`. `agents`, `notes`, `noteFolders` i les claus desconegudes queden fora d'esta lectura; l'accés administratiu requerix el superadmin real amb `aal2`. Només es reemplacen les tres polítiques anteriors amb nom conegut i les guardes pròpies R21.6. Les polítiques restrictives afegides impedixen que una concessió o política permissiva antiga amb `USING(true)` reòbriga la frontera. En `public.notes` es revoca tot privilegi de PUBLIC/anon i es reforça la lectura authenticated amb propietari **i** pertinença vigent al poble, preservant les concessions i operacions authenticated existents. No es reescriu cap payload, versió ni data d'alta/modificació.

**Ordre d'integració:** comprovar les dependències i aplicar la cadena canònica, incloses `2610061448` i `2610101900`; després aplicar **2611121830**. Les R21.4/R21.5 en són independents, però han de conservar el seu ordre i comprovacions propis. La correcció de dates del netejador del Mur (kit R21.6) i la projecció pública de l'Opció A (kit R21.1) no entren en este commit: depenen del kit R21.1, vetat pel Gauntlet fins al seu v2. La 1830 és transaccional i idempotent, amb `lock_timeout=5s` i `statement_timeout=60s`, i notifica la recàrrega d'esquema de PostgREST.

```sh
node --test tests/contingut-frontera-r21-6-postgres.test.mjs
```

Les proves sobre PostgreSQL **18.6 real** de `contingut-frontera-r21-6-postgres.test.mjs` usen les migracions de negoci reals i comproven la frontera antiga de set claus, AAL1/AAL2, propietat, pèrdua de pertinença, polítiques permissives obsoletes, reaplicació sense canvi de dades i el guió d'introspecció `tooling/auditoria/audita-servidor-lectura.sql` dins d'una transacció READ ONLY. Auth i serveis de plataforma són infraestructura de fixture. No acrediten JWT/TOTP real, PostgREST remot ni desplegament: **l'aplicació remota continua sense acreditar** fins a contrastar l'estat del servidor amb lectura autoritzada.

## Vincles

- [[00_index]]
