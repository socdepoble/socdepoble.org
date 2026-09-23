---
type: document
status: esborrany
description: Execució autoritzada de la fortificació dels hooks, segell, SCC i cadena Git.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c0f15618-7657-4973-ab6f-d9429123ca2f:4dd211da-f915-47a2-93e0-4026ac288d40
---
# Fortificació local C1–C9

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c0f15618-7657-4973-ab6f-d9429123ca2f:4dd211da-f915-47a2-93e0-4026ac288d40 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T18:26:16.631Z |
| Modificació | 2026-09-23T18:26:16.631Z |
| Propietari | Codex |
| Aprovació humana | Ordre explícita del Mestre: executar C1–C9 |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesura real no disponible; estimació no calculada |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-23T18:26:16.631Z: pla concretat a partir de l’auditoria 1943 i del pla compartit 2005, amb execució autoritzada.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Abast: tooling/gates (hooks-local, segell-auto, segella, SCC, tancament, porta-reflex i nou executor), tooling/documental/turns, tooling/wiki/reflex_petorreta, configuracions dels tres hosts, hooks Husky i proves aïllades. Cap canvi de producte ni zona humana.

C1–C2: eliminar confiança en una ruta declarada; preparar operació amb lease, manifest previ vàlid i conjunt exacte de rutes; registre durable abans de publicar; bloqueig davant errors, replay i concurrència.
C3–C4: permisos abans del filtre documental, eines opaques denegades; lectures explícites i executor controlat. Configuració no equival a activació: s'informarà de les proves locals i dels límits del client.
C5–C6: hooks Git executables, lease de commit i consum; Husky únic amb .husky/_, materialització de l'índex i comprovació posterior del tree.
C7–C8: resolució per ruta i noms únics, inventari de tots els elements humans, errors I/O explícits i guardes CLI canòniques.
C9: cens de configuracions i segell en inventari i contracte crític.

Descartat: denylist de redireccions shell, perquè no conté intèrprets; resegellat global en PostToolUse, perquè accepta canvis aliens. Nucli compartit amb adaptadors menuts per mantenibilitat.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Executar les 73 proves de base i regressions noves en temporals privats: fals origen, registre fallit, replay, rutes falses, homònims, HTML humà, shell opaca, hooks inerts i symlinks. Tancament real sense ocultar deute preexistent.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Concurrència amb altres agents; callbacks del client absents o amb timeout; polítiques i claus sota els mateixos permisos. Els hooks locals no substituïxen confinament del sistema operatiu ni protecció remota de branca. Les discrepàncies bloquegen, mai es reparen a cegues.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
