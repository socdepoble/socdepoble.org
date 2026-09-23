---
type: acta
status: esborrany
description: Carregador íntegre de context i adaptadors Reflex per a Codex i Claude, amb proves i límits operatius.
tags:
  - acta
visibility: private
reflex: sdp:torn_9643f855-f618-401b-b56f-f1f48766e254:91862501-705a-4e1e-b966-fe778fdb9942
---
# Implementació dels hooks locals i relleu Marmota

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9643f855-f618-401b-b56f-f1f48766e254:91862501-705a-4e1e-b966-fe778fdb9942 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T14:17:07.554Z |
| Modificació | 2026-09-23T14:17:07.554Z |
| Propietari | Codex |
| Aprovació humana | sí; SDP-PROMPT-LOCAL-260923 |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 124345961b466375ee5bea239fbc303ae054820bbfb8105fa24f37a6c4a55d76. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-09-23T14:17:07.554Z: esborrany creat amb rebut; completat després de les proves locals.

<!-- SDP:SECTION acta.s4 -->
## Resultats

Implementació autoritzada del pla de l’Olivera, limitada als hooks i al missatge de recuperació. No s’han tocat components visuals ni el treball de neteja assignat a Claude.

### Fitxers i comportament

- `tooling/brain/context-local.mjs`: llig del disc AGENTS.md, Bootstrap, Genotip i índex mestre, i entrega el contingut íntegre en `hookSpecificOutput.additionalContext`. Fonts explícites, sense recorregut d’arxius històrics ni secrets. Rebutja fonts buides, absents, externes per symlink i context superior a 128 KiB; mai retalla silenciosament.
- `.claude/settings.json`: afegix el carregador i la comprovació comuna abans d’eines. Conserva despertar, persona_router, Reflex, Olivera i segell-auto. Resol les ordres existents des de CLAUDE_PROJECT_DIR.
- `.codex/hooks.json`: adaptador natiu SessionStart/PreToolUse. Usa arrel Git, funcions síncrones i additionalContextLimit=0 exclusivament per al carregador limitat a 128 KiB. També conserva la fotografia viva via despertar.
- `tooling/gates/hooks-local.mjs`: comprova disponibilitat del context abans de cada eina local; traduïx Add/Update d’apply_patch al contracte existent, comprova tots els documents protegits i aplica Reflex i Olivera. Rebutja pegats ambigus, fitxers repetits, moviments/esborrats documentals i producció humana. Per a Claude, Olivera rep també el resultat reconstruït d’Edit.
- `tooling/gates/porta-reflex.mjs`: recuperació explícita amb `document.mjs context ...`, lectura íntegra, DESPRÉS `document.mjs create ...`. Aclarix que create només crea fitxers nous; no ha de sobreescriure documents existents.
- `tests/hooks-local.test.mjs`: proves del carregador, adaptadors configurats, fonts defectuoses, pegats i bloqueig real amb exit 2.

### Evidència reproduïble

`node --test tests/hooks-local.test.mjs`: 10/10. Executa les ordres reals dels dos JSON des de tooling/; compara la totalitat de cada font amb additionalContext; dispara PreToolUse i demostra lectura permesa i document sense rebut bloquejat. No cal intervenció humana per disparar estos hooks de prova.

Regressions documentals, Reflex i fortificació: 63/63 en la bateria conjunta anterior, més les proves noves. ESLint sobre els quatre fitxers JavaScript tocats: 0 errors i 0 avisos. `git diff --check`: correcte.

Tancament de projecte executat: plantilles, autoritat, ledger, segell i documental-tests en verd; skills, wiki i SCC en roig per incidències prèvies (core-automillora no activa, enllaços i orfes). El pla compartit canvià concurrentment per afegir tasques visuals diferides: rellegit i revinculat, sense ampliar l’abast d’esta implementació. L’acta és l’únic document propi del torn.

### Límits verificats i activació

La prova acredita l’eixida del hook, no una conversa nova amb el model ni comprensió semàntica. La sessió actual ja havia començat abans d’instal·lar-los. Cal iniciar el projecte a socdepoble.org (o un subdirectori), amb el projecte i les definicions de hooks confiats. Codex exigix revisió de confiança amb `/hooks`; no s’ha falsificat ni eludit eixa decisió. Una sessió oberta des de la carpeta pare Som de Poble no descobrix automàticament la configuració del repositori fill.

Els hooks no són una barrera universal: shell arbitrari, eines opaques/MCP i eines allotjades no queden validats documentalment de manera completa. Bash conserva la comprovació heurística d’Olivera; tancament/portes finals continuen sent necessaris. No s’ha inventat una lease ni un validador general de shell. Les limitacions de match del pegat fallen tancades i demanen context únic.

Fonts oficials consultades: [OpenAI Hooks](https://learn.chatgpt.com/docs/hooks) i [Claude Code Hooks](https://code.claude.com/docs/en/hooks). OpenAI documenta descobriment a .codex/hooks.json, confiança, dialecte tool_input.command, bloqueig amb exit 2 i límit d’additionalContext.

### Relleu Marmota

L’autorització humana del torn ha permés avançar sense repetir aprovacions. Alternatives descartades: n8n i còpies persistents de les regles; el carregador compartit llig sempre les fonts canòniques. Riscos assajats: absència de font, truncament i divergència de dialectes. Hora real de finalització documental: 2026-09-23T14:22:35.027973+00:00. El nom 260923_1630 es conserva per ordre expressa; no s’usa per fingir l’hora d’execució.

<!-- SDP:SECTION acta.s5 -->
## Pendents

Revisar i confiar les definicions de Codex amb `/hooks` abans de la primera sessió real que les use. Consolidar amb MarIA els problemes previs de skills, enllaços i orfes; el tancament global no es declara verd. La purga ESLint i la quarantena de context_preflight corresponen a Claude. Esta acta servix de relleu Marmota d’esta implementació, amb la ruta exacta demanada pel Mestre.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
