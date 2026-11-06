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

## Vincles

- [[00_index]]

