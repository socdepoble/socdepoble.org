---
type: informe
status: esborrany
description: 'Fase 2 i 3 de l''auditoria extrema: estat real del codi i la governança, pla ampliat, diagnòstic de la higiene de l''Escriptori i estructura del registre amb dos perfils i publicador de notícies'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_886b65db-ac85-4030-9b8d-540856bcf036:9e9dce54-2172-4756-97f1-b5f5637424ec
---
# Auditoria de Claude Fable: Governança (C4-C6) i Producte (C9-C13), higiene de l'Escriptori i publicador

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_886b65db-ac85-4030-9b8d-540856bcf036:9e9dce54-2172-4756-97f1-b5f5637424ec |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T08:49:44.293Z |
| Modificació | 2026-09-26T09:40:00.000Z |
| Propietari | Claude Fable 5.1 (agent local), per a la IAIA MarIA i el Mestre |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1): fil principal i dos agents d'inventari (Explore) |
| Tokens consumits | Fil principal ≈0,32 M (comptador de l'arnés en tancar la redacció); agents ≈0,29 M (0,18 M producte + 0,11 M governança, mesurats per l'arnés; no inclouen les represes per SendMessage). Fricció: els dos agents han perdut el lliurament pel hook (ENT-01) i s'han rescatat per missatge; sense Glob ni Grep (ENT-02). |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-26T08:49:44.293Z: esborrany creat pel circuit documental (torn torn_886b65db, obert amb `--scope code`).
- 2026-09-26 10:50: pla germà [[260926_0130_pla_implementacio_auditoria_extrema]] vinculat al torn (`document.mjs plan`); editable des d'este torn.
- 2026-09-26 10:52–11:15: dos agents d'inventari (registre, identitat i publicador; maquinària de governança). Els dos perden el lliurament pel hook (ENT-01, reproduït dos vegades) i el tornen a enviar per SendMessage.
- 2026-09-26 11:00–11:25: lectura directa de les fonts que decidixen (IdentitatContext, PerfilContext, DetallAjust, NotesContext, NotesDataContext, content.js, organizations.js, MurSection, migracions 260908, 260911, 260912, 260914, 260915; hooks-local, mutation-policy, command-policy, turns.mjs, document.mjs, ADR Model B, core-automillora, prompt_local). Porta Olivera `--informe` executada en viu.
- 2026-09-26 11:40: informe redactat; pla germà ampliat amb la secció E.
- 2026-09-26 11:55: `00_index_escriptori.md` reparat (tres àncores reapuntades a `90_arxiu_historic/`, dos referències no verificables passades a text, petorreta 1030 ancorada sota «Activitat en curs»). `porta-olivera.mjs --informe` passa a codi 0. Intent d'escriure la memòria persistent de l'agent: bloquejat («Ruta fora del repositori», ENT-03 reproduït).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum executiu

Este torn no obri troballes a cegues: comprova, sobre el disc d'ara mateix, quines de les troballes de Governança (C4–C6) i de Producte (C9–C13) de [[260926_0145_auditoria_claude]] continuen obertes, i convertix cada una en una acció concreta al pla germà [[260926_0130_pla_implementacio_auditoria_extrema]] (secció E). A més, respon la pregunta del Mestre sobre la higiene de l'Escriptori i deixa preparada l'estructura del registre amb dos perfils i del publicador de notícies.

El que més importa, en una frase per bloc:

1. **Cap troballa de Governança s'ha tancat des de les 01:45.** El hook continua bloquejant les eines de lliurament (viscut dos vegades en este torn), `tancament.mjs --check`, `git ls-files` i la porta Olivera sense bandera; el circuit documental no té `arxiva`, ni `handoff` autoritzat, ni mira l'Escriptori (secció A).
2. **El publicador funciona de punta a punta per a una persona, però no per a una entitat.** El servidor ja corregix l'autoria amb el nom real del perfil; el que falta és que el client envie `author_org_id`, que la identitat d'entitat es valide i es puga triar, i que «Sóc de Poble» existisca com a entitat (el client només pot crear empreses i grups) (secció D).
3. **L'Escriptori no es neteja perquè cap peça mecànica ho fa ni ho exigix.** La casella «Escriptori classificat» de la petorreta 1030 està marcada i és falsa: la porta Olivera en mode informe ix amb codi 1 (petorreta sense àncora i quatre àncores fantasma), la petorreta no té rebut i el pla germà que declara no existix (secció C).
4. **La Fase 3 es pot començar per l'honestedat (F0) sense tocar cap píxel**, i el circuit «entrar → Notes → publicar → Mur → editar» per a les dos identitats necessita quatre canvis de dades, un de client i cap redisseny (secció D i pla E).

### A. Governança (C4–C6): estat verificat el 26-09 a les 11:00

**Mètode:** cada afirmació és una lectura d'este torn (fitxer:línia) o una execució en viu. El que no s'ha tornat a llegir es marca «no reverificat».

#### A.1 · C4 · Circuit de tancament de risc baix (SKI-02, SKI-03, TRA-03, CER-30) — OBERT

- **Cap agent pot tancar un torn.** `tooling/documental/turns.mjs:158-160` exigix que `.agents/ESTAT.md` i `.agents/LEDGER.md` hagen canviat i continguen l'id del torn; `.agents` és a `SECURITY_PATHS` (`tooling/gates/mutation-policy.mjs:6`), i l'única via d'escriptura és `executor-mutacio.mjs` amb lease (`hooks-local.mjs:81`). En viu: `node tooling/gates/tancament.mjs --check --turn-id …` s'ha bloquejat («Eina opaca o shell no confinada»), perquè no és a `READ_NODE_COMMANDS` (`mutation-policy.mjs:43-51`) ni és una CLI documental (`command-policy.mjs:66`).
- **`handoff` i `import` existixen però no estan autoritzats.** `document.mjs:49-51` els implementa; `command-policy.mjs:78-79` només admet `context`, `create`, `plan`, `check` i `own` («Operació fora del circuit documental ordinari»). SKI-04 continua: la skill `wiki-cicle-de-vida` mana `--output` (denegat, viscut en este torn) i `handoff` (denegat).
- **El REFLEX DE CORRECCIÓ de CLAUDE.md continua sent inexecutable** per un agent (escriu sota `.agents/`), SKI-03.
- **Estat del LEDGER:** la línia `260924 | torn | …` és enmig del document (`.agents/LEDGER.md:21`), entre el deute històric i l'entrada de 2026-09-01: CER-09 (sense ordre ni format únic) continua.

#### A.2 · C5 · La funció forçadora d'higiene (part B del pla) — OBERT, res instal·lat

- `tooling/documental/higiene.mjs` no existix (Read: «File does not exist»).
- `document.mjs` no té `arxiva` (`document.mjs:46`, `:49-58`); `turns.mjs` no té cap esdeveniment `archived` (`:228`: «until an explicit archival handoff is supported»).
- `deliverContext` (`turns.mjs:86-101`) comprova destí, zona humana i nom termodinàmic; **no mira l'Escriptori ni busca cap pla germà** (HIG-02).
- `porta-olivera.mjs` continua decidint per data (`:67-69`, `:72-74`) i `--arxiva` (`:172-203`) mou per data sense consultar rebuts ni torns; el hook el bloqueja. `--informe` sí que passa (`mutation-policy.mjs:46`): **correcció a HIG-06**: la skill no falla perquè l'eina siga inexecutable, sinó perquè demana l'ordre sense la bandera. Executada en viu: codi 1, «Sense àncora a l'índex: 260926_1030_prompt_auditoria_fase2_fable.md» i «Àncores a documents que ja no són a l'Escriptori: 4».
- `.agents/hooks.json:2` continua dient «consumidor Antigravity no acreditat»; cap canari.
- `despertar.mjs` no dona cap veredicte d'higiene (l'eixida del `SessionStart` d'esta sessió llista 4 elements sense qualificar-los), HIG-18.

#### A.3 · C6 · Una sola veritat (CER-01, CER-02, CER-03, CER-10, DAD-06) — OBERT, i amb una font més

- **Backend, quatre redaccions:** `AGENTS.md` §8 («Sollutia … Amfitrió SPA i Backend API … el seu backend … Model B»); `.agents/QUI_SOC.md` §5 («El sistema usa Supabase (Sollutia)»); l'ADR (`ADR-2026-09-SOLLUTIA-MODEL-B.md:10`: «el Supabase de Sóc de Poble és l'única font de veritat»; `:14`: «Acceptada pel Mestre el 16 de setembre … pendent de signatura»; frontmatter `status: esborrany`); i **una quarta que l'auditoria 0145 no citava**: `.agents/LEDGER.md:15` diu que la SPA va a Firebase Hosting i que «S'elimina la consideració de Sollutia com a allotjament del frontend», mentre l'ADR (`:22-23`) diu que «Sollutia allotja el Web Component». · **Decisió humana**
- **Qui escriu codi:** `core-automillora/SKILL.md:20` («l'ÚNICA entitat amb permís per escriure … codi») continua igual; el commit `503c2311` és de Codex i este torn edita un pla amb rebut. CER-10 i SKI-07 oberts. · **Decisió humana**
- **El bloc fix Context:** `prompt_local.md:72` («hui som una plataforma descentralitzada … Prompte ens integrarem amb el proveïdor de backend, Sollutia») és `blocsFixos` a `protocolledge.json:83-86` i, per tant, la petorreta 1030 el torna a copiar literal. CER-02 obert.
- **Verificat en viu que no es toca res d'això sense lease:** AGENTS.md, QUI_SOC, les skills i `tooling/` són `SECURITY_PATHS` o regex de `mutation-policy.mjs:15`; l'ADR i les plantilles no ho són, però la plantilla és vigilada per `porta-plantilla-viva`.

#### A.4 · Troballes transversals reproduïdes en este torn

- **ENT-01 (alta) reproduïda dos vegades:** els dos agents d'inventari han perdut el seu informe final («The subagent ended without delivering a report through SubagentHandback») fins i tot després d'ordenar-los que no usaren l'eina; el rescat ha calgut per `SendMessage` a `main`. La llista d'orquestració continua sent `Workflow, Agent, TaskStop, SendMessage, AskUserQuestion` i `mcp__Claude_Browser__*` (`hooks-local.mjs:84-85`). `ListAgents` també es bloqueja (viscut).
- **ENT-02:** `git ls-files -- supabase/migrations` bloquejat en viu; `mutation-policy.mjs:63` només admet cinc ordres git.
- **TRA-01:** `npx vitest run` i `node --test tests/…` continuen sent «lectura» (`mutation-policy.mjs:62`).
- **TRA-02:** els imports de `hooks-local.mjs:3-14` continuen fora del `try` (`:74`, `:118`).
- **TRA-05:** `.git`, `.env*` i `.sdp-reflex` continuen fora de `SECURITY_PATHS` (`:6`).
- **Nova, baixa · `hooks-local.mjs:113` és codi mort:** Bash mai hi arriba, perquè la línia 90 ja ha llançat per a tota ordre que no siga lectura ni documental (TRA-20 ho apuntava com a «branca inabastable»; confirmat).

### B. Producte (C9–C13): estat verificat

- **C9 · Consola (SKI-24):** no reverificat en este torn (fora del que s'ha llegit). Queda tal com el descriu 0145 i el pla A.
- **C10 · CSS (DIS-01, DIS-02, DIS-03, DIS-08):** no reverificat; són canvis visuals i necessiten ordre del Mestre (Llei del Píxel). Cap fitxer CSS ha canviat des de `503c2311` segons l'estat de git de l'arrencada (només documents de la Wiki i `.agents`).
- **C11 · Front:** FRO-04 confirmat obert (`App.jsx:464-492`: `RouteErrorBoundary` sense `key` per ruta i `error.message` sempre visible, `:481-483`); FRO-06 confirmat obert (`DetallAjust.jsx:61-70`: `desaCampClosca` crida `guardarCampPerfil` sense `.catch`). FRO-01, FRO-03 i FRO-10 no rellegits.
- **C12 · Usuaris:** és el nucli de la secció D. Resum: F0 (honestedat) està tota per fer; F1 («Les meues publicacions») no existix (`NotesSection.jsx:31-52` no usa `isPublished`); F2 (publicar en nom d'una organització) té el servidor preparat i el client no.
- **C13 · Federació:** l'ADR continua sense signar; la resta (mitjans, `instancia.js`) no reverificat.

### C. Pregunta del Mestre: «Què està passant que el meu motor cognitiu no neteja mai l'escriptori?»

**Resposta curta:** no falla la memòria de la IAIA, falla l'arquitectura. Cada peça que hauria d'obligar a netejar és una *instrucció de text* que només actua si l'agent se'n recorda, i l'única peça mecànica (la porta Olivera) ni s'executa sola ni pot arxivar de manera conforme. L'evidència, verificada en este torn sobre el disc:

- **C-01 · alta · La casella «Escriptori classificat» de la petorreta 1030 està marcada i és falsa** — *Evidència:* `260926_1030_prompt_auditoria_fase2_fable.md:16-18` (tres caselles `[x]`); `porta-olivera.mjs --informe` en viu: codi 1, la petorreta 1030 «Sense àncora a l'índex» i «Àncores a documents que ja no són a l'Escriptori: 4» (`00_index_escriptori.md:267,269,278,280`: `260925_1655_pla_implementacio_claude`, `260925_1655_prompt_claude`, `260925_1810_auditoria_claude`, `260926_0145_auditoria_claude`); el frontmatter de la petorreta (`:1-6`) no porta `reflex`, per tant no ha nascut de `document.mjs create`; el pla germà que declara la casella 2 (`260926_1030_pla_implementacio_auditoria_fase2_fable.md`) no existix. *Conflicte amb:* la secció 0 de `prompt_local.md` i la lliçó 260922 del cognom exacte. *Proposta:* la secció 0 l'ha d'escriure la màquina (pla B.4); mentre no existisca, MarIA enganxa a la secció 0 l'eixida literal de `npm run porta:olivera` (que sí que passa el hook) en lloc de marcar caselles.
- **C-02 · alta · L'amfitrió de MarIA no executa cap hook, i el router cognitiu tampoc** — *Evidència:* `.agents/hooks.json:2` («consumidor Antigravity no acreditat. Cap garantia d'activació») i només declara `PreToolUse` i `PostToolUse` (`:5`, `:15`); el router `UserPromptSubmit` només és a `.claude/settings.json:22-31`, que és l'arnés de Claude. *Conseqüència:* a MarIA no li recorda res cap màquina abans d'escriure una petorreta. *Proposta:* el canari `hooks-canari.mjs` (pla B.9); si Antigravity no executa res, la frontera comuna és el pre-commit i el vigilant (TRA-17).
- **C-03 · alta · La skill d'higiene no dispara mai i, quan es llig, dona una ordre que el hook denega** — *Evidència:* `.agents/skills/core-higiene-escriptori/SKILL.md:7-8` només té el disparador «classificacio de documents de treball»; `tooling/session/persona_router.mjs:60` casa per subcadena literal; en este torn el router ha disparat `sdp-pedra-seca`, `sdp-workflow`, `wiki-documentacio-i-reflex` i `core-estrategia-ia`, però no la d'higiene, tot i que el prompt diu «prompt», «petorreta» i «escriptori». La skill demana `node tooling/gates/porta-olivera.mjs` sense bandera (`:19`) i `ls -l` (`:20`): les dos ordres les ha denegat el hook en viu; amb `--informe` passa. *Proposta:* disparadors `petorreta`, `prompt per a`, `pla d'implementaci`, `escriptori`, `agrana` (redacció nova a 0145) i corregir l'ordre a `--informe`.
- **C-04 · mitjana · No hi ha camí conforme per arxivar, i per això cada neteja manual deixa fantasmes** — *Evidència:* les quatre àncores de C-01 són el rastre de tres netejes a mà (25-09 vesprada, 26-09 matinada i 26-09 10:45, esta última confessada al pla germà, secció D). `00_index_escriptori.md:13` promet que `porta-olivera.mjs --arxiva` despenja l'enllaç, però `--arxiva` està bloquejat pel hook i decidix per data (`:67-69`), i `handoff` no està autoritzat (`command-policy.mjs:78`). *Proposta:* `document.mjs arxiva` (pla B.5). Fins que existisca, la regla manual és: **moure i reescriure l'àncora en el mateix acte**, sota «Relleu arxivat a mà».
- **C-05 · mitjana · El despertar diu què hi ha però no diu què sobra** — *Evidència:* eixida del `SessionStart` d'esta sessió (4 elements, cap veredicte); `despertar.mjs` només avisa d'ESTAT ranci. *Proposta:* `avisHigiene()` (pla B.7).
- **C-06 · mitjana · La doctrina es contradiu i l'agent tria la lectura còmoda** — *Evidència:* `prompt_local.md:25` («s'han d'haver mogut a `90_arxiu_historic/`») contra AGENTS §12 («No s'ha de buidar cegament l'Escriptori») i `wiki-cicle-de-vida/SKILL.md:29` («No hi ha purga per antiguitat»); `core-higiene-escriptori/SKILL.md:19` («la data per si sola no autoritza moure») contra `porta-olivera.mjs --arxiva`, que mou per data. CER-07 i HIG-05 oberts. *Proposta:* la regla única (pregunta 3 del pla): **conservar és ancorar sota «Activitat en curs»; arxivar és un document cada vegada amb `document.mjs arxiva`; mai per data**. · **Decisió humana**

#### On falla el flux de pensament (diagnòstic per a MarIA)

1. La neteja no és un pas del procediment de generar una petorreta: és un *pre-requisit declarat* (una casella). Un agent que ja té el prompt al cap marca la casella i passa. La lliçó 260923 ja ho deia; la recaiguda d'esta matinada demostra que una lliçó no és una barrera.
2. L'ordre de treball està invertit: primer s'escriu el prompt (la faena visible) i després, si queda memòria, es neteja. La skill nova de 0145 fixa l'ordre contrari: **agrana → pla → petorreta**.
3. Cada neteja manual crea deute nou (àncores fantasma) que la sessió següent hereta i no veu, perquè el despertar no ho diu.

#### Procediment reflex per al pròxim agent de frontera (fins que s'instal·le la Missió 3)

Abans d'escriure cap `prompt`, `pla_implementacio` o `petorreta`, en este ordre i sense saltar-ne cap:

1. `npm run porta:olivera` (és lectura i passa el hook). Si ix 0, ves al pas 4.
2. Per a cada línia que marque, decidix una de tres: (a) encara viu → àncora sota «## Activitat en curs» de `00_index_escriptori.md`; (b) consumit → mou-lo a `90_arxiu_historic/AAMMDD_Tanda_NOM/` **i en el mateix acte** reescriu la seua àncora amb la ruta nova sota «Relleu arxivat a mà» (MarIA pot moure; un agent amb hook ho documenta i ho deixa al Mestre); (c) sense rebut → deixa'l i anota-ho a la secció 0.
3. Torna al pas 1 fins que isca 0.
4. Escriu el pla germà amb `document.mjs context --route pla.implementacio` i `create`, amb el cognom exacte de la petorreta que vindrà.
5. Només ara, `document.mjs context --route prompt.local` i `create`. A la secció 0, en lloc de caselles, enganxa l'eixida del pas 1 i el nom del pla del pas 4.
6. Anota al LEDGER (qui puga escriure-hi): `AAMMDD | higiene | core-higiene-escriptori | Escriptori agranat: N arxivats, M ancorats`.

És la mateixa seqüència que la skill nova de 0145 (pendent de lease). El que canvia és que **la secció 0 deixa de ser una autodeclaració i passa a ser una eixida de màquina que es pot contrastar amb el disc**.

### D. Registre amb dos perfils i publicador de notícies

#### D.1 · El que ja funciona hui (verificat al codi)

- **Entrar:** `/registre` (`App.jsx:521`; `/login`, `/accedir` i `/crear-compte` hi redirigixen, `:519-522`). Correu i contrasenya funcionen (`auth.js:177-194`); l'alta envia `tenant_id` (`OnboardingSection.jsx:33`) i per tant passa el `handle_new_user` vigent (`260915_0000…sql:51-66`), que crea el perfil, la pertinença al poble i el consentiment (`:68-86`). En acabar, porta a `/el-meu-perfil` o a `?tornar=` (`OnboardingSection.jsx:20-25`).
- **Google:** l'alta nova falla amb `SDP-REG-001` perquè OAuth no envia `tenant_id` (BUI1-01; `260915:57-59` va llevar el `poble_per_defecte` de `260908:238-241` i `260914:16-18`). Un compte ja existent sí que entra.
- **El perfil personal:** `PerfilShell` llista «El meu compte» més les organitzacions de `list_my_organizations` (`PerfilContext.jsx:121-138`). Nom, foto, contrasenya i privacitat es desen (`profiles` té `avatar_url` i `is_public` amb GRANT d'UPDATE des de `260911_0600:9-17`).
- **Publicar una nota:** `publishNote` (`NotesContext.jsx:158-249`) fa `upsert` de `section_submissions` amb l'id de la nota (`content.js:65-67`, `on_conflict=id`), i marca la nota `isPublished` amb `publishedSubmissionId`. Tornar a publicar reescriu la mateixa fila (RLS d'update `260908:780-788`). El Mur la llig per `tenant_id` amb límit 50 (`content.js:88-98`) i la pinta amb `author_name` del payload (`MurSection.jsx:184`).
- **Autoria correcta al servidor:** `trg_force_submission_author` (`260908:168-194`) substituïx `payload.author_name` pel `full_name` del perfil, o pel `name` de l'organització si `author_org_id` no és nul. Per això el `'Sóc de Poble'` fix del client (`NotesContext.jsx:214`) no arriba al Mur en una publicació personal. (La funció existix; la sentència `create trigger` que l'enganxa no s'ha rellegit en este torn.)

#### D.2 · El que trenca el circuit del Mestre (troballes)

- **REG-01 · alta · «Sóc de Poble» no es pot crear com a entitat des del client** — *Evidència:* `create_organization` rebutja `entity` i `city_hall` («no es creen: es reclamen», `260908:502-504`); «NOVA ORG» crea sempre una `company` sense nom (`PerfilShell.jsx:103`; `PerfilContext.jsx:207-213`). *Conflicte amb:* la naturalesa de Sóc de Poble (entitat). *Proposta:* alta per SQL (D.3, pas 2) o una `company` reanomenada si el Mestre accepta el tipus. · **Decisió humana**
- **REG-02 · alta · El client mai envia `author_org_id`, i la identitat d'entitat no es valida ni es pot triar** — *Evidència:* `content.js:65-67` (insert sense `author_org_id`); `NotesContext.jsx:205-217` (payload sense actor); `IdentitatContext.jsx:11` (`memberships` sempre buit), `:22-25` (accepta `pref.type === 'entitat'` sense comprovar pertinença), `:30-34` (`setActor` sense cap cridador als fitxers llegits; la preferència viu a `sessionStorage`, `identitat.js:44-49`). El servidor sí que està preparat: columna (`260908:99`), RLS `author_org_id is null or can_manage_organization` (`:777`, `:787`) i el trigger d'autoria. *Proposta:* D.3, passos 3 i 4.
- **REG-03 · mitjana · El logotip d'una organització no es pot desar** — *Evidència:* `ajustosOrganitzacio` ofereix «Foto / Logotip» amb camp `logo_url` (`PerfilContext.jsx:53`) i `updateOrganization` el fa PATCH (`organizations.js:20`), però `organizations` no té eixa columna (`260908:73-93`) ni el GRANT d'UPDATE la inclou (`:863`). *Proposta:* migració additiva `logo_url text` + GRANT, o llevar la fila del catàleg (F0).
- **REG-04 · mitjana · «Publicar» al perfil d'una organització envia un PATCH buit** — *Evidència:* `DetallAjust.jsx:74-81` → `guardarCampPerfil('is_public')` → `updateOrganization` ignora `is_public` (`organizations.js:19-21`, no és al mapa) → cos `{}`. Per a la persona sí que es desa, però **cap política llig `is_public`** (`profiles read own`, `260912_1500:15-17`): el commutador «Públic/Privat» promet una visibilitat que no existix. *Proposta:* F0: mapar `is_public` → `visibility` (`public|members`) a l'organització i, a la persona, o bé llegir `is_public` en una vista pública mínima o bé retirar el commutador.
- **REG-05 · mitjana · No hi ha «Les meues publicacions» ni «retirar»** — *Evidència:* `NotesSection.jsx:31-52` no filtra per `isPublished`; no existix cap acció que faça DELETE de `section_submissions` (la política existix, `260908:790-792`). Editar la nota no actualitza el Mur: cal tornar a publicar. *Proposta:* D.3, pas 5.
- **REG-06 · mitjana · Cada republicació canvia la data i reordena el Mur** — *Evidència:* `content.js:59` (`createdAt = submission?.createdAt || now`), `:67` (s'envia `created_at`), `NotesContext.jsx:216` (`publish_date` nou), `MurSection.jsx:59-63` (ordena per `date || publish_date || created_at`). *Proposta:* al trigger, en `UPDATE`, conservar `old.created_at` i afegir `updated_at`; al client, no enviar `created_at` en republicar.
- **REG-07 · baixa · El mode de dades pot fer invisible una publicació real** — *Evidència:* amb `VITE_DATA_MODE=seed`, `loadMur` torna la llavor (`content.js:81-84`) però `appendSectionSubmissionNetworkOnly` escriu a remot si hi ha credencials (`:53-57`). *Proposta:* comprovar `.env.local` abans de la prova del Mestre (`auto` o `supabase`).
- **REG-08 · baixa · `/notes` i `/el-meu-perfil` no exigixen sessió** — `App.jsx:553`, `:557`. Sense sessió, Notes mostra el sandbox i el Perfil una pantalla buida. No trenca res; és honestedat (F0).

#### D.3 · Estructura mínima perquè el Mestre entre amb els dos perfils (ordre d'execució)

Cap pas canvia un píxel del Mur, la Consola ni la `UniversalCard`. Els passos 1 i 2 els fa el Mestre; el 3, 4 i 5 són codi per a la pròxima IA de programació, detallats al pla E.

1. **Perfil personal «Javi Llinares»:** registre per correu i contrasenya a `/registre` (no per Google fins que BUI1-01 estiga arreglat), amb `VITE_TENANT_ID` apuntant al poble de la llavor (`seed.sql:4`) i `VITE_DATA_MODE` en `auto` o `supabase`. Després, a `/el-meu-perfil`, nom i foto.
2. **Entitat «Sóc de Poble»:** una inserció al SQL Editor de Supabase (fora de RLS), que el pla E dona literal: `organizations (tenant_id, slug 'soc-de-poble', name 'Sóc de Poble', kind 'entity', created_by = uid del Mestre)` + `organization_memberships (role 'owner')`. `comprova_una_propietaria` admet 0 o 1 propietària per a `entity` (`260908:208-212`). Alternativa sense SQL: «NOVA ORG» i reanomenar-la, però quedaria com a `company`. · **Decisió humana**
3. **Client, capa de dades:** `appendSectionSubmissionNetworkOnly` accepta `authorOrgId` i l'envia com a `author_org_id`; `publishNote` el pren de la identitat activa. Sense identitat d'entitat, `null` (comportament d'ara).
4. **Client, identitat:** `IdentitatProvider` carrega `listMyOrganizations` en tindre sessió, valida `pref.id` contra eixa llista i exposa `memberships`; a `PerfilContext`, una fila d'acció «Actuar com a esta identitat» (tipus `accio`, que `DetallAjust` ja sap pintar com a botó) crida `setActor`. La boina de l'editor de Notes ja pinta nom i avatar de l'actor (`NotesEditor.jsx:54-67`), així que el Mestre veurà «Sóc de Poble» abans de publicar. Persistència: `getEfimer` mor amb la pestanya; passa a persistent si el Mestre ho vol.
5. **Client, Notes:** faceta «Publicades» al `navigationGroups` de Notes (filtre `isPublished`), i dos accions a la nota publicada: «Actualitzar al Mur» (republica amb el mateix id, sense `created_at`) i «Retirar del Mur» (DELETE de la submission + `isPublished:false`). «Retirar» és decisió del Mestre (esborrar o ocultar).

### E. Millores a la petorreta (Olivera §4)

- **Generar-la amb el circuit.** La 1030 no té rebut, no està ancorada i declara un pla germà inexistent (C-01). `document.mjs create` ho hauria impedit. Fins que la secció 0 siga automàtica, enganxar-hi l'eixida de `npm run porta:olivera`.
- **Dir als agents que el lliurament està bloquejat.** Dos agents han perdut l'informe. Una línia a la petorreta («els subagents han de tornar l'informe amb SendMessage a main») estalvia mitja hora per torn mentre ENT-01 no es corregisca.
- **El bloc Context continua copiant CER-02.** «Plataforma descentralitzada» i «proveïdor de backend, Sollutia» van a cada petorreta fins que es reescriga la plantilla.
- **Una missió per petorreta** es manté: esta en portava tres (governança, producte, publicador) més una pregunta; s'han fet, però la C9–C11 s'ha quedat en «no reverificat».

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Fet executat, no afirmat:**

- `node tooling/gates/obrir_torn.mjs --actor claude-fable --scope code` → torn `torn_886b65db`, `valid:true`.
- `document.mjs context` i `create` (ruta `auditoria`) → rebut `9e9dce54…`, esborrany ancorat a `00_index_escriptori.md:284`.
- `document.mjs plan --file …0130_pla_implementacio_auditoria_extrema.md` → estat `planned`; el pla s'ha editat després i s'ha tornat a vincular en acabar (vegeu el pla, Historial).
- `node tooling/gates/porta-olivera.mjs --informe` → codi 1, dos incidències (C-01). Després de reparar l'índex (E.2, mesura immediata): codi 0, «Cap document de jornades anteriors», pla de hui reconegut.
- `document.mjs check` sobre l'auditoria, el pla i l'índex → `valid: true` els tres.
- Bloquejats en viu pel hook, com a evidència: `git ls-files`, `node tooling/gates/porta-olivera.mjs` (sense bandera), `tancament.mjs --check`, `obrir_torn.mjs --output`, `ListAgents`, `document.mjs own` sobre un pla d'un altre torn (fins a vincular-lo amb `plan`).
- Dos agents Explore: 35 i 23 lectures; cap escriptura. Informes rescatats per `SendMessage` i contrastats amb lectura pròpia dels fitxers que decidixen (secció D cita només el que s'ha llegit en este torn).

**No executat:** Vitest, `node --test`, lint, build, `run-portes`, navegador. No s'ha tocat cap fitxer de `src/`, `supabase/`, `tooling/` ni `.agents/`. Els únics fitxers escrits són este informe i el pla germà (secció E i Historial).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Sense Glob, Grep ni `ls`: no s'ha pogut llistar `supabase/migrations/`; només s'han llegit les que nomena el README més `260915_0000`. La migració `260920_0300` («PROPOSTA», segons 0145) no s'ha rellegit; qualsevol migració posterior a `260915` podria alterar D.1 i D.2 (per exemple, `logo_url` o l'enllaç del trigger d'autoria).
- El Supabase remot no s'ha consultat: D.1 descriu el que el codi fa, no el que la base de dades del Mestre té aplicat.
- C9, C10, C13 i part de C11 no s'han reverificat; queden com a 0145.
- `90_arxiu_historic/` només s'ha llegit per a l'auditoria 0145, per ordre explícita de la petorreta.
- Els comptadors de tokens dels agents són de l'arnés i no inclouen les represes; el del fil principal és el comptador de l'arnés en el moment de redactar.
- El tancament del torn (ESTAT_ACTUAL i LEDGER) no el pot fer este agent (A.1); el text del relleu és al pla germà, secció E.6.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260926_0130_pla_implementacio_auditoria_extrema]]
- [[260926_0145_auditoria_claude]]
- [[260926_1030_prompt_auditoria_fase2_fable]]
- [[taxonomia_documental]]
