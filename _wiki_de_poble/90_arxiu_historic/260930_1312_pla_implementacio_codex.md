---
type: document
status: esborrany
description: Pissarra compartida per a l'auditoria adversarial de Codex.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_405028bf-5ca9-4d8e-9416-d35564798d7a:76341579-bc23-4116-900d-b629e1a930f0
---
# Pla d'Implementació: Auditoria Adversarial

**Estat del Pla:** auditoria completada; proposta de correccions estabilitzada per a revisió. Implementació no iniciada.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_405028bf-5ca9-4d8e-9416-d35564798d7a:76341579-bc23-4116-900d-b629e1a930f0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T11:18:42.904Z |
| Modificació | 2026-09-30T11:42:38Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Redacció inicial: agent-local; revisió i pla tècnic: GPT-6 / Codex |
| Tokens consumits | N/D: mesura atribuïble no disponible |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T11:18:42.904Z: esborrany creat per MarIA.

2026-09-30T11:42:38Z: Codex completa la pissarra amb les troballes de l’auditoria 1325 i criteris d’acceptació. Es conserva el rebut original; no s’han aplicat correccions de codi.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Resultat de la investigació

Informe [[260930_1325_auditoria_codex]]: 10 troballes, 2 P1 i 8 P2. La recuperació recomanada usa un destí ocupat; el tractor d’arrels pot sobreescriure l’arxiu; WordPress pot ocultar errors i canviar la versió oferida; la Consola perd avisos i confon heurístiques de vida amb execució acreditada. La correcció de versió/registre ja present abans del torn es conserva.

La tasca autoritzada en este torn és l’auditoria. La instrucció inicial d’«esborrar fitxers bloquejats» es concreta tècnicament en conservar originals i generar successors verificats. Un camp pendent o una incompatibilitat de snapshot no acredita corrupció ni autoritza una eliminació.

### 2. Proposta concreta per a la següent execució

| Ordre | Objectiu i fitxers previstos | Acceptació |
| --- | --- | --- |
| 1 | F01: `tooling/higiene/tractor_cognitiu.mjs`; prova específica en `tests/` | Arxivar homònims mai perd bytes; error de Git o moviment no dona èxit; quarantena conserva procedència |
| 2 | F02: revisar pegat de `260930_0400_governanca_claude` per a `tooling/gates/antigravity-hook.mjs` i `tests/antigravity-hook.test.mjs` | Operacions fora d’abast no obtenen autoaprovació; permisos humans previs es respecten |
| 3 | F03: `tooling/wiki/document.mjs`, `tooling/documental/draft-write.mjs`, `tooling/documental/turns.mjs`, `tooling/gates/porta-plantilla-viva.mjs`; contracte i plantilla en canvi conjunt si cal | `recover` amb successor exclusiu, rebut i supersedes; índex/relleu atòmics; rollback i concurrència; compatibilitat amb rebuts antics |
| 4 | F04/F05: `wordpress-plugin/includes/actualitzador.php`; harness PHP de regressió | Versió/hash coincideixen amb l’oferta; HTTP 503 després d’èxit mostra degradació; firma i hash continuen fallant tancats |
| 5 | F06/F07/F09: `src/sections/consola/mapa/construeixMapa.js`, `src/sections/consola/consolaPagines.js`, `tooling/brain/fonts-vigilancia.mjs`, `tooling/brain/mapa-consola.mjs`, `.agents/cron/registre_tasques.json` | Compilador → coberta conserva avisos; script i arguments contrastats; registres il·legibles visibles |
| 6 | Columna Acreditada: contracte del mapa, `src/sections/consola/mapa/CalendariMapa.jsx` i proves associades | Sí només amb ordre coincident i resultat fresc per tasca; No amb motiu quan falta evidència; no heretar acreditació de la mare |
| 7 | F08: `tooling/vite/consola-iaia.mjs`, adaptador de rebuts/termometria, `src/sections/consola/consolaPagines.js` i peces consumidores | Rebut nou visible sense duplicació; mesura per sessió amb abast/data; font absent = N/D; cap dependència de Supabase en la UI |
| 8 | F10: `tooling/brain/crear_bundle.mjs` i punt d’entrada documental | Destinatari local rebutjat abans del recorregut; paquet extern explícit; ancoratge real; noms de taxonomia |

### 3. Decisions de contracte

- D1: alinear l’ADR de Sollutia amb la directiva actual de backend intercanviable. Definir el rol de cada endpoint quan arribe: lectura externa, identitat o implementació del port. No inventar endpoints ni ampliar escriptures mentrestant.
- Definir en el contracte de governança l’abast de recuperació autònoma de documents protegits: propietari, successor, comprovació, relleu i reversió. L’aprovació global de shell no és un requisit d’autonomia.
- Mantindre la política de WordPress per a actualitzacions manuals vinculada a l’oferta exacta. Qualsevol política «última estable» per a automàtiques ha d’estar explícita i provar compatibilitat.

### 4. Verificació proposada

Convertir les reproduccions R1–R9 de l’informe en regressions amb el resultat correcte; afegir interrupció i rollback documental, prova de destinatari abans d’I/O i una actualització real de WordPress en instal·lació descartable. Executar després les suites Node i Vitest afectades i les portes del torn. La verificació de Sollutia amb dades reals queda vinculada a la recepció dels contractes, no al simple color de la Consola.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Auditoria executada: 46/46 proves Node, 337/337 proves Vitest de Consola, 11 fitxers PHP amb sintaxi correcta i reproduccions R1–R9. Estos resultats acrediten la diagnosi i no la correcció dels defectes. Vegeu l’informe per a l’evidència completa i els límits del harness PHP.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Prioritat: pèrdua de dades per col·lisions i autoaprovació fora d’abast. Preservar canvis concurrents i rebuts anteriors. No confondre diagnòstic amb execució, ni laboratori amb codi instal·lat. Les correccions s’han de mantindre en els adaptadors i contractes neutrals; cap acoblament nou entre UI i proveïdor.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260930_1325_auditoria_codex]]
