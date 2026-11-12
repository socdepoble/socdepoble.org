---
type: informe
status: esborrany
description: Verifica la cua de baixa i purga de fitxers, les revisions de patrimoni viu i l’actualització editorial del Kit R17.2B.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_25a1d89e-c506-4c06-9d6b-ac8bb2e2711d:578db941-627b-42c8-ab80-58170066a048
---
# Auditoria Gauntlet del Kit R17.2B

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_25a1d89e-c506-4c06-9d6b-ac8bb2e2711d:578db941-627b-42c8-ab80-58170066a048 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T00:06:12.593Z |
| Modificació | 2026-11-11T00:25:00Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6.1 Sol Ultra · Codex |
| Tokens consumits | Sense comptador per torn disponible |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T00:06:12.593Z · Esborrany creat amb el rebut del circuit documental.
- 2026-11-11T00:25:00Z · Implementació i verificació al clon aïllat. L’informe queda pendent de revisió humana.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

El clon `/tmp/sdp_codex_r17_2b` va partir de l’HEAD net `0027b698d3c25041def6cad2c527d2addc22b8ff`. El dossier del Node 0 va orientar la lectura del codi. Els fragments truncats i els esborranys de SQL es van contrastar amb el catàleg executable. El darrer informe de Claude confirma que el pressupost WordPress i els canvis d’Android i Notes corresponen al Carril 1.

### Matriu de conformitat de requeriments

| Requeriment | Estat | Evidència i límit |
| --- | --- | --- |
| T1 · P0-20 · Cua i purga UGC | `[FET]` | `2611110100_cua_purga_storage_ugc.sql` i `src/data/supabase/compte.js`. En baixa programada, la confirmació del worker precedix l’esborrat d’Auth. PostgreSQL WASM i el worker real amb transport sintètic. L’aplicació de la migració i la comprovació física dels binaris queden per a l’entorn de destí. |
| T2 · P1-75 · Revisions de patrimoni viu | `[FET]` | `2611110110_revisions_patrimoni_viu.sql` i `revisionsPatrimoni`. Una campanya per poble, peça i any. Autor privat, permisos municipals i edició amb identificador i versió. L’adaptador local usa memòria. L’activació remota requerix la migració. |
| T3 · P0-98 i P0-99 · Dispositius i Fediversity | `[FET]` | Cinc llengües i dues rutes comprovades al navegador. L’avís TLS depén de la negociació del navegador. La resposta del 9 de novembre confirma l’abast dels fons. Les quatre empremtes de Frontissa queden pendents d’aprovació. |
| T4 · CAS, vocabulari i exclusivitat | `[FET]` | Pegat de 40 camins i manifest SHA-256. Aplicació comprovada en índex net i comprovació de només lectura a l’arbre viu. Cap coincidència amb fitxers de producte que l’arbre viu tenia modificats en el moment de la prova. Zero infraccions de vocabulari noves. |
| P0-24b · Capa Enrere | `[FET · VERIFICACIÓ]` | El Llibre Mestre registra la implementació anterior i el pla no prescriu un canvi nou. Les 47 proves de les nou suites focals passen en l’HEAD de partida. |

### Revisió adversarial

- La purga espera la confirmació del worker també si les metadades ja han desaparegut. Revalida identitat, versió i referències visibles a l’esborrat. Rebutja buckets amb versionat habilitat i deixa la baixa pendent si una FK històrica exigix reassignar fitxers compartits. La publicació d’una referència en una transacció editorial independent pot arribar després de la comprovació. [API de Storage](https://supabase.com/docs/guides/storage/management/delete-objects) · [Codi de l’esborrat de Storage](https://github.com/supabase/storage/blob/master/src/storage/object.ts)
- Les revisions validen claus i valors al port i a PostgreSQL. L’identificador de fila impedix que una edició obsoleta recaiga en una campanya recreada. Els permisos de lectura exclouen el UUID de l’autor. L’inventari executable declara 52 capacitats, 151 mètodes i 213 casos.
- Els textos de compatibilitat expliquen l’anunci de Supabase a partir del 10 de novembre com a molt prompte. La data o versió del sistema operatiu per si sola no confirma una incompatibilitat. L’editorial de NLnet es basa en la resposta final del 9 de novembre i descriu l’abast públic de la convocatòria en termes d’allotjament i portabilitat. [Avís TLS de Supabase](https://supabase.com/docs/guides/security/tls#removal-of-cbc-mode-ciphers) · [Convocatòria de NLnet](https://nlnet.nl/fediversity/)

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `npm run lint` i `git diff --check` en verd. Vitest focal amb **1.958/1.958** en 30 fitxers. **63/63** proves Node/PostgreSQL WASM i **66/66** proves estàtiques de contingut, SEO i portes.
- `npm run build` amb dades de llavor. Entrada web **243.443 B gzip -9** amb sostre **249.912 B**. Arrencada estàtica **473.209 B gzip -9**. L’entrada de partida mesurava **243.323 B gzip -9** amb la mateixa configuració de llavor.
- `tractor-rls`, `tractor-enxufe`, `tractor-persistencia` i `tractor-vocabulari` passen. El verificador local reconeix **88 migracions**, amb **0 errors** i els **15 avisos previs**. Les proves de catàleg comparen l’inventari i l’ordre, amb el mateix comportament per a futures migracions.
- El navegador local va mostrar l’avís a `/dispositius` i la resolució de NLnet a `/page/fediversity`. Es va usar el port **3341** perquè el **3340** estava ocupat pel repositori viu. El servidor de prova es va aturar.
- REA va analitzar tres mòduls del build final, amb zero errors de parseig i cobertura acotada a eixos fitxers. Evidència `ev_977b296d4266417fc74a4d4237b8f0ac10415c29a0d6f1c04da42cae94f7c91c`.
- Frontissa va identificar `dispositius`, `fediversity`, `fedivers` i `node-zero`. Les ordres d’aprovació i els passos per a integrar els dos kits R17.2 són al kit.
- La fusió temporal amb el primer R17.2 va requerir conciliar quatre fitxers de documentació i proves. El catàleg combinat de **89 migracions** ha passat **63/63** proves Node/PostgreSQL WASM.
- El comprovador de l’auditoria, Olivera i la signatura del Llibre d’Obra passen. La porta global de tancament detecta canvis concurrents de codi i incidències SCC prèvies a l’Escriptori. El rebut documental manté l’estat `planned`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Kit dipositat a `../_investigacio_ia_de_poble/261111_kit_codex_r17_2b_ugc_revisions_i_fediversity/`. El paquet conté la font de la Wiki. El build regenera els índexs en la branca d’integració.
- Les proves de purga usen el catàleg i l’entrada real del worker amb una rèplica sintètica de l’API de Storage. Al destí queda comprovar els permisos dels triggers, els buckets sense versionat, els dos treballs programats i l’esborrat de bytes amb un compte de prova. Les migracions i el desplegament queden pendents.
- El control específic de WordPress conserva un error heretat del Carril 1. L’entrada mesura **1.743.779 B** davant d’un sostre de **1.690.000 B**. L’HEAD de partida mesura **1.743.436 B** i falla la mateixa prova. La passada Vitest de R17.2B és focal, com prescriu el pla.
- El prompt menciona `task-208`. La sessió no ha pogut identificar una automatització activa amb eixe identificador. El torn no ha creat cap programació recurrent.
- Per al pròxim prompt, convé declarar un port alternatiu, l’identificador de client del cron i si els kits publicats han de passar en seqüència sobre un mateix arbre. El dossier hauria de marcar explícitament els fragments tallats.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261111_0042_prompt_codex_r17_2b_deute_tecnic_ugc_revisions_i_vocabulari]]
- [[261111_0042_pla_implementacio_r17_2b_deute_tecnic_i_node0]]
- [[261111_0032_auditoria_claude]]
- [[261111_0012_auditoria_codex]]
- [[03_llibre_mestre_tasques_i_idees]]
