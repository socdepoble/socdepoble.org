---
type: document
status: esborrany
description: Pla de Testing i QA
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c143d861-11d0-475c-96d8-8f7e2de61005:9723e404-d928-447a-b914-3836c0f6cfce
---
# Pla Implementacio QA Claude

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c143d861-11d0-475c-96d8-8f7e2de61005:9723e404-d928-447a-b914-3836c0f6cfce |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T15:52:02.169Z |
| Modificació | 2026-09-27T15:52:02.169Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Fable 5.1 |
| Tokens consumits | ~15000 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-27T15:52:02.169Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Objectius
Aquest pla defineix els criteris de Qualitat (QA) i Tancament de Sessió després del treball de Codex. L'objectiu és assegurar que el codi generat no té regressions a la UI i que l'entorn de desenvolupament queda llest per a ser integrat al repositori principal.

### Sincronització Documental i Commit
- Alinear els blocs de la plantilla V3 (`prompt_local.md`) amb les exigències del linter `protocolledge.json` per tal d'evitar el bloqueig al `pre-commit`.
- Tancar el torn amb un `git commit` global de tots els canvis de la jornada.

### Estudi d'Auto-replicació (Visió de Futur)
- Avaluar què falta en l'arquitectura actual perquè una IA externa que aterre a la nostra web puga comprendre, clonar i auto-replicar el sistema. Caldrà identificar quines parts del "cervell" amagat (Wiki, `.agents`) haurien d'estar exposades i com fer que el sistema siga 100% modular i auto-aprenent per a altres IAs.

### Tasques per a Claude
- [ ] **T1:** Inicialitzar i validar el funcionament del contenidor local de Supabase.
- [ ] **T2:** Inspeccionar manualment al navegador les vistes de Login, Registre i "Nova Org".
- [ ] **T3:** Resoldre la discrepància entre `prompt_local.md` i `protocolledge.json`.
- [ ] **T4:** Executar el git commit final amb un missatge descriptiu de la jornada.
- [ ] **T5:** Elaborar un informe estratègic sobre què cal per fer el sistema auto-replicable per una IA externa.

### Notes i Avisos de Seguretat (Per a Claude)
> **De la IAIA MarIA:**
> 1. **L'error del commit JA ESTÀ RESOLT:** He ajustat personalment el `.agents/protocolledge.json` a la versió 3.1.0 i he fet el `git add`. El teu pròxim `git commit` ja no donarà l'error de la secció `Context` (Tasca T3 completada per avançat).
> 2. **Evita la Bash per a llegir:** La `mutation-policy.mjs` bloqueja les comandes compostes i alguns binaris des de la shell per seguretat. Usa les teues eines natives (`read_file`, `Glob`, `view_file`) que estan a la llista de `knownRead` per explorar l'arquitectura.
> 3. Els fitxers de polítiques que busques estan a `tooling/gates/mutation-policy.mjs`, `tooling/gates/porta-plantilla-viva.mjs` i `tooling/gates/executor-mutacio.mjs`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

### Verificació de l'Autenticació (Supabase)
- S'ha de comprovar que el servidor local de Supabase (`localhost:54321`) s'arranca correctament.
- Cal verificar des del navegador que el flux de login i registre creat a `/registre` reacciona correctament a les respostes del backend, emet errors llegibles si fallen les credencials, i redirigeix l'usuari correctament quan l'autenticació té èxit.

### Verificació de Formularis (Nova Org)
- S'ha de comprovar el funcionament del component "Nova Org".
- Cal validar que permet crear una Empresa i, posteriorment, crear un Grup vinculat a aquesta empresa, verificant que la interfície manté la cohesió de la línia de disseny "Pedra Seca".

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Res destacable en la fase de verificació local.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
