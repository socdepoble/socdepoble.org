---
type: informe
status: esborrany
description: Revisió final del Bloc A de Claude amb proves adversarials i veredicte sobre el tancament de P0 i P1.
visibility: private
reflex: "Llegides prompt_local.md, auditoria_canonica.md i protocolledge.json; torn torn_1790033676976, declaració no autenticada."
tags:
  - auditoria
  - codex
  - reflex
---
# Tancament de l’Olivera: revisió del Bloc A

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-REVISIO-260922_0136 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació / Modificació | 2026-09-22T01:36:01+02:00 |
| Propietari | Agents Locals — Codex |
| Aprovació humana | pendent; dictamen de revisió |

## Veredicte

**Millora real, però P0/P1 no estan segellats. No es pot declarar erradicat el deute cognitiu ni dedicar-se exclusivament al producte.** El graf pot avançar en paral·lel mentre es tanquen els controls pendents.

Cal corregir la premissa del relleu: Claude diu expressament a ESTAT i LEDGER que ha implementat el Bloc A i que NO ha unificat el contracte ni construït la màquina d’estats. No li atribuïsc una garantia del 100% que ell mateix exclou.

## Lectures i proves

Contrastats auditoria Codex 0056, pla Claude 0054 amb addenda, ESTAT, LEDGER, settings, porta i tests. Plantilla local rellegida abans de redactar; guia d’auditoria i router llegits en aquesta mateixa conversa. Aplicats els procediments locals de documentació i relleu ja consultats.

`node --test tests/porta-reflex.test.mjs`: **17/17 passen**, amb 11 casos de bloqueig. Ara el payload Claude Write es reconeix, el codi de bloqueig és 2, el format de configuració ha canviat a objecte per esdeveniment i hi ha symlinks de skills. No s’ha iniciat una sessió Claude per demostrar activació real dels hooks. Una data renovada manualment no prova que SessionStart s’haja disparat.

## Esquerdes confirmades

| Prioritat | Evidència | Reparació i acceptació |
| --- | --- | --- |
| P1 | `porta-reflex.mjs:109–129`: només s’exigeix que reflex tinga 20 caràcters. `reflex: aquest rebut es completament inventat` retorna 0, sense Registre ni historial. La fixture positiva de la suite usa també un torn sense autenticar. | Rebut extern vinculat a plantilla, document i torn; validar seccions obligatòries. El mateix fals ha de retornar bloqueig. |
| P1 | `porta-reflex.mjs:178`: àmbit amb `includes`. Write a `_wiki_de_poble/./04_escriptori/prova.md` amb text sense YAML retorna 0. És una ruta equivalent dins de l’espai protegit. | Normalitzar ruta respecte del cwd real, comprovar contenció i symlinks; variants equivalents han de rebre el mateix veredicte. |
| P1 | `.claude/settings.json` limita matcher a Write/Edit/NotebookEdit. Bash no es valida. Fins i tot passant manualment un payload Bash que escriu a l’Escriptori, la porta retorna 0. | Cobertura explícita d’escriptures alternatives i validació final comuna en integració; afegir Bash al matcher a soles no ho arregla. |
| P1 | `porta-reflex.mjs:96–107`: status fora d’enum (`patata`), camp addicional (`recipient: fantasma`) i claus type duplicades són acceptats: exit 0 en les tres proves. `tipusAdmesos()` retorna null davant error d’esquema i llavors omet la comprovació. | Usar parser canònic i esquema complet; fallar si no es pot carregar l’esquema. Proves de claus duplicades, enums, tipus, longituds i propietats desconegudes. |
| P1 | `tancament.mjs` sols copia turn_id al resultat; no valida torn persistent, plantilla, ESTAT ni historial. `compile-wiki-to-app.mjs:179` encara escriu amb --check. | Completar P0/P1 i separar comprovació de generació; hash del checkout invariant i rebuig explícit del torn inexistent. |
| P2 | `porta-reflex.mjs:151–170`: Edit usa replace d’una sola ocurrència, ignora replace_all; Antigravity valida un fragment o només el primer ReplacementChunk, no el document resultant. No hi ha cap cas Edit a la suite de 17. | Reconstruir exactament l’operació real, validar el resultat complet i provar reemplaçaments múltiples, ambigüitat i errors de lectura. |

Les cinc proves adversarials Write executades són: rebut inventat, status fora d’enum, propietat desconeguda, ruta equivalent i clau duplicada. Totes retornen 0. Els payloads només s’han enviat al validador: no s’han creat documents invàlids al repositori.

## Tancament comprovat i límits

S’ha executat el tancament en còpia temporal de tooling/src/.agents/Wiki, sense arxiu històric, producció humana ni .obsidian, per evitar la mutació del checkout original. Evidència: /var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-revisio-final-t93knu6q.

Resultat actual de la còpia: **exit 1**, amb `ESCRIPTORI_UNANCHORED` per `260922_0030_prompt_fortificacio_final.md`; el manifest ha canviat de hash. El resultat reprodueix el torn inventat sense verificar-lo, però NO és verd: no confondre aquesta execució amb la prova anterior de les 0056. No s’ha modificat la font per forçar cap resultat favorable. La còpia reduïda no certifica l’arbre complet ni refuta que Claude obtinguera verd en un altre instant.

## Consell final i relleu

Acceptar el Bloc A com a avanç parcial. Mantindre oberts el rebut verificable, el contracte documental complet, la cobertura d’escriptures i el tancament sense efectes laterals. Afegir els casos adversarials a la suite abans de declarar P0/P1 acabats i provar el hook en una sessió real.

La formulació honesta és: **«canal reparat parcialment; garanties encara incompletes»**. El producte pot avançar en paral·lel, però no hi ha base per deixar enrere la fontaneria.

Cap codi funcional canviat en aquesta revisió. Informe, índex, ESTAT i LEDGER són els únics lliurables persistents del torn. No es reobre la implementació sense un encàrrec d’execució.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260922_0056_auditoria_opus]]
- [[260922_0054_pla_implementacio_opus]]
