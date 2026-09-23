---
type: informe
status: esborrany
description: Entrega de codi de fortificació amb proves adversarials, reconciliació explícita i tancament honest.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c0f15618-7657-4973-ab6f-d9429123ca2f:7c5b0e50-97de-43bc-8aee-5e740c8b8459
---
# Fortificació C1–C9: implementació i límits verificats

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c0f15618-7657-4973-ab6f-d9429123ca2f:7c5b0e50-97de-43bc-8aee-5e740c8b8459 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T18:41:11.279Z |
| Modificació | 2026-09-23T18:41:11.279Z |
| Propietari | Codex |
| Aprovació humana | Execució C1–C9 autoritzada explícitament pel Mestre |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesura real no disponible; estimació no calculada |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23T18:41:11.279Z: implementació local autoritzada i verificació amb fixtures privades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

| Fissura | Implementació i resultat |
| --- | --- |
| C1 | Post-hook ja no resegella. Executor comprova lease, claim, hashes previs i conjunt exacte de canvis. |
| C2 | Lock, CAS, registre amb prepared/verified/accepted, evidència durable versionable abans del segell, pending bloquejant davant errors. Cap rollback cec. |
| C3 | Permisos abans del filtre documental; zona humana no Markdown i hardlinks protegits; governança directa, shell i MCP desconeguts denegats. Executor explícit per a altes i substitucions. |
| C4 | Configuracions unificades, postverificació Codex/Claude i errors de Claude. Activació real de clients, timeout i confinament OS NO acreditats; Antigravity només té configuració declarativa. |
| C5 | Cinc hooks executables: pre valida lease/arbre, post consumix, merge/applypatch encadenen. Doctor ignora comentaris. |
| C6 | init i prepare usen Husky amb .husky/_. Git materialitza l’índex, valida allí i torna a comprovar tree/HEAD; detecta canvis de fonts durant comprovacions. Protecció remota de branca NO comprovada. |
| C7 | Resolutor compartit SCC/orfandat: Markdown relatiu a origen, wikilinks per ruta o nom únic; errors davant absència, ambigüitat o eixida. HTML/binari humà entra en inventari sense llegir contingut. |
| C8 | Guardes esMain en SCC, tancament, Reflex, document i portes documentals/autoritat/plantilles/catàleg de la cadena; resultat SCC estructurat i I/O explícita. No s’ha propagat a tots els scripts legacy fora d’este abast. |
| C9 | .codex entra en inventari; hooks de hosts, segell i executors entren en cens crític. |

Reconciliació del segell autoritzada: revisat íntegrament diff de skills contra 0ffda7a7 (dues skills noves i ampliació Matrix, més edició concurrent de core-automillora). Hash anterior 6e2883329444b55734638d2f2aef68c09684a980a6f425afdfb479f196d5aa23; hash revisat 2a37538fbad7a557f62e4c403e9a08c02261cb973557aca12ee2263e62a35288. La regla de core-automillora que reserva edicions a MarIA no preval sobre l’ordre directa del Mestre. No s’ha atribuït autoria d’eixos canvis a Codex ni acreditat el seu origen retrospectivament.

Detectada i corregida una edició concurrent de hooks-local que tornava a permetre qualsevol MCP desconegut. Les dues proves adversarials van detectar el canvi. Cap canvi de producte, zona humana ni documents aliens corregit per esta entrega.

Ús de governança: P-14 de `.agents/PROTOCOL_PETORRETA.md` descriu pla, lease i executor. Les shell opaques queden denegades; cal un host amb confinament extern per a shell general. No s’ha inventat un sandbox a partir d’una regex.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Base inicial: 73/73. Bateria ampliada: 109/109 (36 addicionals), totes en temporals privats; sense injectar brossa al repositori compartit.
- Lease i claim reals: executor CLI accepta operació amb pla vinculat, completa claim i rebutja replay.
- Git real en fixtures: commit sense lease denegat; índex divergent materialitzat amb bytes staged; consum amb tree i pare verificats, replay denegat; merge/applypatch propaguen fallada; doctor rebutja comentaris inerts.
- No s’ha demostrat un commit complet verd amb totes les portes del repositori real: el deute global continua bloquejant-lo. No s’ha creat cap commit de l’arbre compartit ni enviat res al remot.
- Tancament executat: valid=false, state=planned. Passen plantilles, autoritat, LEDGER, segell i bateria documental. Fallen catàleg de skills, Wiki estricta i SCC. SCC: {"SCC_SYMLINK":1,"LINK_INVALID":101,"ESCRIPTORI_UNANCHORED":9,"ORPHAN_OPERATIVE":6}. No s’ha marcat closed.
- ESLint dels fitxers revisats: cap error ni avís. git diff --check: correcte.
- El snapshot Git inclou tots els fitxers preparats, també rebuts runtime i rutes fora del cens de torn; un canvi de contingut, mode o índex durant validació falla.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

No es declara protecció integral B4–B6: falta provar activació efectiva/timeout de cada client, confinar processos fora dels hooks i verificar proteccions remotes de CI. Claus, codi i evidència locals són modificables amb els mateixos permisos: el checksum no és una autoritat independent.

SCC estricte destapa deute preexistent; no s’han reparat massívament enllaços ni arxivat documents aliens. El nou executor admet altes i substitucions, no baixes/renames. La recuperació de pending exigix revisió explícita; no s’ha afegit cap desbloqueig automàtic.

Les edicions de codi d’este torn són directes i autoritzades per l’usuari; les proves de claims pertanyen a fixtures i no es presenten com una lease retrospectiva d’estes edicions. El canvi de polítiques necessita revisió independent abans de considerar-lo una frontera de seguretat externa.

Acta Marmota global de jornada pendent; esta entrega i ESTAT conserven el relleu tècnic.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
