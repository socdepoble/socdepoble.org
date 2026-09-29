---
type: document
status: esborrany
description: 'Motor Cognitiu i T6: el pla declara els seus prompts, Escriptori verificable, validació d’entrega sense estat i receptor que bloqueja, amb les decisions del Mestre del 260929.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_0530f207-9a12-4664-9be7-5ef452f66cf7:6478c73f-019a-4393-aa40-6d8fc3c7167f
---
# Pla d’Implementació — Motor Cognitiu i T6 (pla abans que prompt, Escriptori net, validació d’entrega)

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0530f207-9a12-4664-9be7-5ef452f66cf7:6478c73f-019a-4393-aa40-6d8fc3c7167f |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T19:15:46.396Z |
| Modificació | 2026-09-29T19:30:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb workflows de subagents Opus 5.5 |
| Tokens consumits | Fil principal: no mesurable des de l’agent. Subagents del disseny: vegeu el Registre de [[260929_2115_auditoria_claude]]. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-29T19:15:46.396Z: esborrany creat; contingut i verificació pendents.

2026-09-29 21:30: disseny complet a partir de l’auditoria [[260929_2115_auditoria_claude]] (investigador + dos escèptics per tasca). El Mestre ha triat en el xat: «pla primer» (no s’implementa en este torn), «el pla declara el prompt» com a regla d’aparellament i restaurar la quarantena de les 18:50. Queden obertes les decisions del punt 2.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes

- **La regla del Mestre no existix en cap codi.** «Escriptori net» i «pla abans que prompt» viuen en prosa: lliçons 260922/260923 de `wiki-documentacio-i-reflex` i caselles del Preflight de `prompt_local.md`. El prompt 1839 les marcava totes tres [x], i dos eren falses: no tenia pla ni rebut.
- **Les portes existents no comproven el que demana el Mestre.** `porta-olivera.mjs:72-74` accepta qualsevol `pla_implementacio_*` del dia: va acceptar el 1955, amb un altre cognom i creat 1 h 16 min després. `porta-olivera.mjs:109` exigix «0. Abans de generar», però la plantilla v3.1.0 diu «0. Preflight». Bloca tot prompt conforme i trenca 9 proves de laboratori. La branca sense rebut de `validateDocument` (`tooling/documental/turns.mjs:109-113`) amaga les seccions que falten.
- **Qui va escriure el 1839 no va passar per cap porta.** A les 18:39 Claude i Codex encara tenien hooks: la quarantena és de les 18:50. Antigravity no executa `.agents/hooks.json`: el binari d’Antigravity documenta un altre format (cada clau de primer nivell és el nom d’un hook, amb grups matcher + hooks), i el fitxer del repo es declara ell mateix «consumidor Antigravity no acreditat». Que l’escriptor fóra MarIA és una hipòtesi coherent, no provada.
- **El mateix forat va deixar passar el `supabase db reset` de les 13:49.** `hooks-local.mjs` el bloqueja (exit 2, reproduït en còpia), però no s’executa sota Antigravity.
- **T6 de Codex** (`260929_1154_auditoria_codex.md:152-190`): crear → completar → validar → entregar, esborranys desables però no lliurables, permís lligat al hash. El prototip «opció A» (sobre SDP-LLIURAMENT i `deliver`) passa 10/10, però els escèptics hi van reproduir set carrerons. `import` i un segon `context` renten l’ordre pla→prompt. Un handoff o un torn caducat deixen el prompt il·liurable. La línia de pre-commit fa fallar tots els commits. `--envelope` queda denegat per la mateixa command-policy. El sobre admet rutes de fora del repo. I hi ha dues definicions d’«Escriptori net» en el mateix disseny.
- **Conclusió de disseny:** una comprovació **sense estat**, que revalida els bytes actuals al receptor, dona més garantia de contingut que un hash desat i evita els carrerons. El punt mecànic ineludible per a MarIA és un hook d’Antigravity en el format que Antigravity llig, i per a Claude i Codex, el receptor.

### 2. Preguntes Obertes

Decidides pel Mestre (260929, xat): pla primer; **el pla declara els seus prompts**; restaurar la quarantena.

Pendents:
1. **Receptor davant d’un prompt que no passa:** (a) bloqueja amb exit 2 i el Mestre pot forçar-lo escrivint `SDP-FORÇA` al missatge (recomanat); o (b) avisa i continua.
2. **Escriptori net (R-A):** és una regla NOVA i més estricta que AGENTS §12, que funciona per dates i permet conservar documents. Proposta: tot fitxer del primer nivell ha de ser el pla, un prompt que el pla declara, o un document que el pla declara com a continuïtat a «Vincles». Cal aprovar-la o suavitzar-la.
3. **Lliurament lligat al hash (T6 literal):** implementar-lo més endavant, amb els sis canvis exigits pels escèptics, o quedar-se amb la revalidació sense estat (recomanat).
4. **Laboratoris sense endollar** (`02_investigacio_ia/260927_1310_reflex_maria`: porta-receptor i petorreta): instal·lar-los adaptats o retirar-los. És el tercer laboratori del mateix problema.
5. **Lease:** tot el pla toca rutes de governança (`tooling/`, `.agents/`, `.husky/`, `package.json`). El lease del Reflex va caducar el 27-09. Cal que el Mestre n’emeta un de nou abans d’implementar.

### 3. Canvis Proposats

Regles (una sola definició per a totes les portes):

- **R-B · El pla declara el prompt.** Abans del `context` d’un prompt (rutes `prompt.*`) ha d’existir un `AAMMDD_HHMM_pla_implementacio_*.md` amb rebut de la ruta `pla.implementacio`. Eixe rebut ha de ser anterior al rebut més antic del prompt en qualsevol torn, i la secció «Vincles» del pla ha de nomenar el prompt (`[[AAMMDD_HHMM_prompt_…]]`). Admet l’Olivera a dues bandes: un pla, dos prompts.
- **R-A · Escriptori net** (si el Mestre l’aprova): cada fitxer del primer nivell de `04_escriptori/` (excepte els que comencen per punt i `00_index_escriptori.md`) és el pla, un prompt declarat o un document declarat a «Vincles» del pla. `01_produccio` i `02_investigacio_ia` no s’inspeccionen. La Safata amb més de 20 elements és error. Les àncores fantasma de l’índex són avís, perquè són deute d’altri.
- **R-C · Contracte complet:** `validateDocument` sencer també sense rebut, estructura de la plantilla viva, blocs fixos intactes i cap text de plantilla sense substituir. Les caselles lliures del Preflight se substituïxen per una línia que genera la porta (claus fixes), no per regex sobre etiquetes.

Fitxers:

### [NEW] `tooling/documental/entrega.mjs`
`checkEntrega(root, fitxer)` sense estat: aplica R-A, R-B i R-C i torna `{errors, avisos}` amb l’acció de recuperació exacta. Reutilitza `validateDocument`, `inspeccionaText` de porta-plantilla-viva, els rebuts del torn i `resolveRoute`. És la base del prototip `delivery.mjs` sense `deliver`, sobre ni `turn.deliveries`.

### [MODIFY] `tooling/wiki/document.mjs` i `tooling/documental/command-policy.mjs`
`context` i `create` d’un prompt criden R-B (i R-A) abans d’emetre rebut: sense pla, no hi ha rebut fantasma. `context` refusa un prompt que ja existix, perquè no es puga rentar l’ordre. `check --file PROMPT` executa `checkEntrega`. `import` refusa les rutes `prompt.*`.

### [MODIFY] `tooling/documental/turns.mjs:109-113`
Sense rebut, el document informa també de les seccions i dels blocs fixos que falten.

### [MODIFY] `tooling/gates/porta-olivera.mjs`
Delega en `checkEntrega`. Retira `ranci()` i `plaDeHui()` com a errors, accepta qualsevol «## 0. …» i rebaixa a avís les àncores fantasma. Afig `--arxiva --nom NOM` per a documents del mateix dia i d’un altre torn, que ara no tenen cap camí sancionat, i despenja la seua àncora de l’índex.

### [NEW] `tooling/gates/porta-receptor.mjs` (des del laboratori, adaptat)
Hook `UserPromptSubmit` de Claude Code (i de Codex quan s’acredite). Detecta un prompt enganxat (frontmatter `type: prompt` o capçalera de `prompt_local`) o citat de l’Escriptori, executa `checkEntrega` sobre el fitxer i, segons la decisió 1, bloqueja amb el text de recuperació o avisa. `SDP-FORÇA` en el missatge del Mestre l’anul·la i queda anotat.

### [MODIFY] `.agents/hooks.json`
Reescrit en el format que documenta Antigravity (claus amb nom de hook, grups matcher + hooks). `PreToolUse` → `node tooling/gates/hooks-local.mjs`, que ja entén `write_to_file`, `replace_file_content` i `run_command`, i per tant bloqueja també `supabase db reset`. Cal verificar-ho a Antigravity mateix: des d’ací no es pot provar.

### [MODIFY] `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v3.2.0), `.agents/protocolledge.json`, `AGENTS.md` §6
Pas 0 dins del bloc fix «Protocol d’Interacció i Sortida»: el receptor executa `node tooling/wiki/document.mjs check --file <prompt>` abans d’actuar. El Preflight en claus fixes. AGENTS §6: «un prompt només existix si el seu pla el declara». Després cal regenerar el manifest de la Wiki: la plantilla es publica a WordPress.

### [MODIFY] skills `wiki-documentacio-i-reflex`, `core-higiene-escriptori`, `core-automillora`
Substituir «netejar a mà / deixar-lo impecable» per R-A (declarar la continuïtat al pla), i afegir el pas «check abans de lliurar». Resol la contradicció amb AGENTS §12.

### [NEW] `tests/motor-entrega.test.mjs` + `tests/fixtures/motor-entrega/`
Fixtures: còpies byte a byte del 1839 i el 1955 (han de fallar amb missatges concrets); cas vàlid; Olivera a dues bandes; `import` d’un prompt refusat; segon `context` refusat; document del mateix dia d’un altre torn amb recuperació sancionada; fitxer humà al primer nivell; àncores fantasma com a avís; receptor amb i sense `SDP-FORÇA`.

Fora d’abast en esta fase: `deliver` i hash (decisió 3), pre-commit (només quan existisca una comprovació `--staged` que isca amb 0 sense prompts preparats) i vigilant launchd (opcional, només denúncia).

Mida estimada: 1 mòdul nou (~250 línies), ~60 línies modificades en 4 fitxers de tooling, 1 receptor (~260 línies, adaptat), `.agents/hooks.json`, la plantilla v3.2.0 i 3 skills, més ~250 línies de proves.

### 4. Pla de Verificació

Vegeu la secció Verificació.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `node --test tests/motor-entrega.test.mjs tests/documental.test.mjs tests/porta-reflex.test.mjs tests/porta-receptor.test.mjs tests/petorreta-generador.test.mjs tests/plantilla-viva-installacio.test.mjs tests/hooks-local.test.mjs tests/document-command-policy.test.mjs tests/document-create-race.test.mjs tests/git-hooks.test.mjs`: tot verd. Les 4 proves de hooks-local tornen a passar amb `.claude/settings.json` i `.codex/hooks.json` restaurats.
2. Prova de fum de només lectura sobre l’Escriptori real: `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/260929_1839_prompt_claude_auditoria_visual.md` ha de fallar, com a mínim per «falta rebut», «el pla no declara el prompt» i «bloc normatiu alterat».
3. En Claude Code: enganxar el 1839 ha de bloquejar-se al receptor i passar amb `SDP-FORÇA`.
4. En Antigravity: un `write_to_file` d’un prompt sense pla declarat i un `run_command` amb `npx supabase db reset` han de quedar bloquejats. Si Antigravity no executa el hook, es documenta com a límit i el receptor queda com a únic punt mecànic.
5. `node tooling/gates/tancament.mjs --check --turn-id ID` en un torn `code`: valid.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Bloquejar el Mestre:** el receptor sempre admet `SDP-FORÇA`, i cap regla bloqueja la zona humana.
- **Falsos positius d’R-A:** documents d’altri del mateix dia. Es mitiguen amb la declaració al pla i amb `porta-olivera --arxiva --nom`. Si no s’aprova R-A, s’aplica només R-B.
- **Antigravity sense hook acreditat:** si el format documentat no s’activa, MarIA continua escrivint fora de tota porta. Només la pararan el receptor i el Mestre.
- **Amnistia del torn** (`checkTurn` només mira `changed ∪ receipts`): R-A mira tot el primer nivell i no se n’aprofita, però el deute heretat continua invisible per a `checkTurn`.
- **Governança sense lease:** instal·lar-ho sense executor trencaria el segell. Cal el lease abans de començar.
- **Contingut publicat:** la plantilla v3.2.0 arriba a WordPress via `wikiManifest.js`. Cal regenerar-lo i declarar-ho.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260929_2115_auditoria_claude]]
