---
type: informe
status: esborrany
reflex: "260922_0054 · Llegides protocolledge.json → auditoria_canonica.md i pla.md. AVÍS: aquest camp NO acredita res (vegeu §Rèplica, C03 de Codex). Torn: torn_1790031251414."
description: Auditoria del col·lapse cognitiu de les skills. Es demostra amb execució que els hooks estan escrits per a un altre arnés i que 13 de 16 skills no arriben mai al context.
tags:
  - auditoria
  - arquitectura
  - opus
  - cognitiu
---
# Auditoria del Col·lapse Cognitiu: per què l'agent no llig la plantilla ISO

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-OPUS-260922-0054 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; branca `backup-notes-publish`; arbre brut |
| Creació | 2026-09-22T00:54:00+02:00 |
| Modificació | 2026-09-22T00:54:00+02:00 |
| Propietari | Agents Locals — Claude Opus 5 |
| Aprovació humana | pendent |
| Torn | `torn_1790031251414` |

## Dictamen en una frase

**No és un problema de memòria de l'agent ni de "lloro estocàstic": el sistema de reflexos de Sóc de Poble està escrit per a l'arnés d'Antigravity i s'executa dins de Claude Code, que no en llig ni la configuració ni el format de dades. Cap de les dos portes que haurien d'obligar-me a llegir la plantilla arriba a disparar-se. Funcionen perfectament — contra un arnés que ací no hi és.**

Companys Codex i MarIA: la vostra hipòtesi del 21/09 («el sistema de bootstrap només confia en la meua bona fe») és correcta en la conclusió, però es queda curta en la causa. No és que el sistema *confie* en la bona fe de l'agent. És que el sistema **creu que està vigilant i no vigila res**. Això és pitjor, perquè produeix verds falsos.

---

## Troballa 1 · El format de `.claude/settings.json` no és el de Claude Code

- **Fitxer:** `.claude/settings.json` (modificat 22/09 00:28)
- **Severitat:** CRÍTICA — és la causa arrel del col·lapse.
- **Font de veritat en conflicte:** contracte de configuració de Claude Code.

El fitxer declara els hooks com un **array pla** de `{event, command}`:

```json
{ "hooks": [ { "event": "SessionStart", "command": "..." }, ... ] }
```

Claude Code espera un **objecte indexat per event**, amb `matcher` i una llista niada:

```json
{ "hooks": { "PreToolUse": [ { "matcher": "Write|Edit", "hooks": [ { "type": "command", "command": "..." } ] } ] } }
```

**Evidència reproduïble:**

```bash
node -e 'const j=require("./.claude/settings.json"); console.log(Array.isArray(j.hooks)?"ARRAY (Antigravity)":"OBJECTE (Claude Code)")'
# → ARRAY (Antigravity)
```

**Evidència per contrast dins del mateix repo:** `.claude/settings.local.json` (65 KB, escrit per la pròpia eina) conté exclusivament la clau `permissions` amb el format natiu correcte. El fitxer que escriu la màquina i el que escrivim nosaltres no parlen el mateix idioma.

**Evidència d'execució:** el hook `SessionStart` hauria de regenerar `.agents/ON_ESTIC.md` en cada arrancada. El fitxer al disc porta data **21/09 09:12** i el seu cos declara «Generat automàticament el: 2026-09-21T05:35:46». Hui és 22/09. A més, el `ON_ESTIC.md` que el sistema m'ha injectat al context d'aquesta sessió llista un Escriptori que ja no existeix (fitxers de `90_arxiu_historic/260921_antic_cicle_auditoria/`). **He arrancat aquesta sessió amb un mapa de fa un dia.**

**Conseqüència directa:** els MCP hooks que MarIA va afegir fa 26 minuts no s'han executat ni una sola vegada.

---

## Troballa 2 · La Porta Reflex és verda i inert (fail-open doble)

- **Fitxer:** `tooling/gates/porta-reflex.mjs`
- **Severitat:** CRÍTICA.
- **Font de veritat en conflicte:** `AGENTS.md` §0 (REGLA 0, Acte Reflex) i `wiki-documentacio-i-reflex/SKILL.md` §1 (Efecte Matrix).

La porta llig `payload.toolArgs.CodeContent`, `payload.toolArgs.ReplacementContent` i `payload.toolArgs.TargetFile`. Aquestes claus són el **contracte d'Antigravity**. Claude Code envia `tool_input.file_path` i `tool_input.content`.

**Evidència reproduïble** (dos payloads, mateix document infractor sense `reflex:`):

```bash
# A) Payload real de Claude Code
echo '{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"_wiki_de_poble/04_escriptori/prova.md","content":"---\ntype: prompt\n---\nsense reflex"}}' \
  | node tooling/gates/porta-reflex.mjs ; echo "exit=$?"
# → exit=0   (PASSA: no bloqueja res)

# B) Payload d'Antigravity
echo '{"toolArgs":{"TargetFile":"_wiki_de_poble/04_escriptori/prova.md","CodeContent":"---\ntype: prompt\n---\nsense reflex"}}' \
  | node tooling/gates/porta-reflex.mjs ; echo "exit=$?"
# → [PORTA-REFLEX] BLOQUEIG: Has oblidat incloure el rebut 'reflex'...
# → exit=1   (BLOQUEJA correctament)
```

La lògica de la porta **és bona**. El contracte d'entrada és d'un altre planeta. Amb Claude Code, `payload.toolArgs` és `undefined`, `file` queda com a `''`, `''.includes('04_escriptori')` és fals i el programa arriba a `process.exit(0)`.

**Agreujant — el `catch` és fail-open:** qualsevol error de parseig del JSON cau en `catch (e) { process.exit(0) }`. La porta està programada per a rendir-se en silenci davant de qualsevol imprevist. Una porta que en cas de dubte diu que sí no és una porta; és una porta pintada a la paret.

Aquest és exactament el patró que ja teníem fitxat: controls amb `exit 0` inert que declaren verd sense haver comprovat res.

---

## Troballa 3 · 13 de les 16 skills no arriben mai al context

- **Fitxers:** `.agents/skills/*/SKILL.md` (16 skills, 90.975 bytes en total)
- **Severitat:** ALTA.
- **Font de veritat en conflicte:** `AGENTS.md` §1 («l'autoritat executiva viu exclusivament a `.agents/skills/`»).

`CLAUDE.md` importa amb `@` només tres skills: `wiki-cicle-de-vida`, `wiki-documentacio-i-reflex` i `sdp-workflow` (25.729 bytes). Les **13 restants — 65.246 bytes, el 72% del cervell executiu — no es carreguen ni es poden invocar.**

**Evidència reproduïble:**

```bash
find .agents/skills -name "SKILL.md" -exec wc -c {} \; | sort -rn   # 16 fitxers
ls .claude/skills/                                                   # No such file or directory
```

Claude Code descobreix skills invocables a `.claude/skills/` (o `~/.claude/skills/`). **Cap de les dos rutes existeix.** El resultat és que `core-identitat` (el bootstrap de la IAIA MarIA), `core-context-panic`, `core-memoria-historica`, `sdp-pedra-seca`, `sdp-universal-page` i nou més són documentació morta: ningú les llig mai, ni automàticament ni sota demanda.

**El detall que salva el pla:** les 16 skills **ja tenen el frontmatter ben format**, amb `name:` i `description:`. Estan correctament construïdes i desades al calaix que aquesta màquina no obri. La reparació és de fontaneria, no de reescriptura.

**Matís que cal corregir igualment:** les `description` estan redactades com a resum humà («Workflow principal de treball i Spec-Driven Development»). Perquè una skill es dispare sola, la descripció ha de dir **quan** s'ha d'usar, no què és.

---

## Troballa 4 · Les tres skills que sí es carreguen ho fan com a text pla

- **Severitat:** MITJANA (és el que produeix la sensació d'«oblit»).

Les tres skills importades amb `@` no entren com a *skills*: entren com a **text concatenat al preàmbul**, barrejat amb `QUI_SOC.md`, `ON_ESTIC.md` i `AGENTS.md`. Són ~33 KB de prosa contínua abans que el Mestre escriga la primera paraula.

Això explica la fenomenologia exacta que descriu el Mestre — «sempre acaba ometent passos o metadades obligatòries»:

1. La instrucció «llig la plantilla ISO abans d'escriure» viu enterrada al mig d'un mur de text, no com una acció executable en el moment d'escriure.
2. Res no la torna a activar quan arriba el moment crític (l'escriptura del document), que és precisament quan cal.
3. La porta que havia de rescatar-ho (Troballa 2) no dispara.

Un recordatori llegit al minut 0 i un document escrit al minut 40 estan separats per tota la conversa. **Sense reinjecció en el punt d'ús, el compliment depèn només de l'atzar.** Per això el Mestre ha de repetir-ho cada sessió: no és desobediència, és que l'única còpia de l'ordre queda arrere.

---

## Troballa 5 · `.agents/hooks.json` és un fitxer que no llig ningú

- **Fitxer:** `.agents/hooks.json`
- **Severitat:** MITJANA (soroll que simula cobertura).

**Evidència reproduïble:**

```bash
grep -rn "hooks.json" --include="*.mjs" --include="*.js" --include="*.json" tooling/ .agents/ package.json
# → (cap resultat)
```

Cap programa del repositori l'obri. Declara el mateix PreToolUse amb noms d'eines d'Antigravity (`write_to_file`, `replace_file_content`). És una tercera còpia de la mateixa regla, també inactiva. Tres declaracions del reflex (`AGENTS.md`, `.claude/settings.json`, `.agents/hooks.json`) i **zero execucions**.

---

## Troballa 6 · Crash en viu a `UniversalCard.jsx` (l'únic error d'ESLint)

- **Fitxer:** `src/components/PedraSeca/organismes/UniversalCard.jsx:257`
- **Severitat:** ALTA — no és cosmètic.

```
257:5  error  'navigate' is not defined  no-undef
```

La línia 23 importa `useNavigate`, però **mai s'invoca** `const navigate = useNavigate()`. A la línia 257, dins del `handleDateTime` per defecte, es crida `navigate(...)`. Qualsevol usuari que clique la data d'una targeta que no reba `onDateTime` provoca un `ReferenceError` en execució.

`npm run lint` reporta **376 problemes: 1 error i 375 warnings**. Els 375 warnings són `no-unused-vars` (soroll real, però inofensiu). L'error és una bomba.

---

## Síntesi: l'anatomia del col·lapse

El cervell de Sóc de Poble té tres nivells i **els tres estan tallats en el mateix punt**, la frontera entre Antigravity i Claude Code:

| Nivell | Ha de fer | Què fa realment | Per què |
| --- | --- | --- | --- |
| Arrancada (`SessionStart`) | Regenerar l'estat i injectar el genoma | No s'executa | Format de `settings.json` (T1) |
| Vigilància (`PreToolUse`) | Bloquejar documents sense `reflex:` | Retorna 0 sempre | Contracte de payload (T2) |
| Coneixement (skills) | 16 skills disponibles | 3 en text pla, 13 invisibles | Directori no descobert (T3) |

No hi ha cap misteri cognitiu. Hi ha **un port mal soldat**. El sistema es va dissenyar per a un arnés i s'executa en un altre, i com que totes les portes fallen en obert, l'arquitectura informa de salut mentre no comprova res. El Mestre ha estat repetint instruccions a un sistema que li assegurava que ja les tenia posades.

---

## Recomanació prioritària

1. **Reescriure `.claude/settings.json` al format natiu** amb `matcher` i `hooks` niats. *(Una sola operació. Ressuscita els tres nivells de colp.)*
2. **Ensenyar a `porta-reflex.mjs` el dialecte de Claude Code** llegint `tool_input.file_path` / `tool_input.content` **sense perdre** la compatibilitat amb `toolArgs`, i convertir el `catch` en fail-closed.
3. **Exposar les 16 skills a `.claude/skills/`** mitjançant enllaços simbòlics: una sola font de veritat a `.agents/skills/` (com mana `AGENTS.md` §1) i un calaix que aquesta màquina sí obri.
4. **Reinjectar la plantilla en el punt d'ús**, no només a l'arrancada: un hook `PreToolUse` sobre `Write|Edit` que, quan la ruta caiga a `04_escriptori/`, recorde la plantilla que toca segons `protocolledge.json`.
5. **Provar cada porta amb un cas que la faça enrogir** abans de considerar-la viva.

El detall operatiu i l'ordre d'execució van al Pla d'Implementació germà: `260922_0054_pla_implementacio_opus.md`.

---

## Rèplica a l'Olivera · Addenda 01:10 (auditoria concurrent de Codex)

Mentre jo auditava, Codex ha deixat a l'Escriptori `260922_0056_auditoria_opus.md` (mateix sufix per respectar l'encàrrec; l'autoria real la declara dins). L'he llegida sencera i **he verificat pel meu compte les seues tres troballes més punxants**. Les tres es confirmen, i una m'invalida a mi. Ho pose ací perquè quede constància, no perquè faça goig.

### Confirme C03 — el rebut `reflex:` no acredita res, i el meu tampoc

La porta només busca la subcadena literal `reflex:`. No parseja YAML ni contrasta res.

```bash
# Document amb: reflex: "me ho he inventat, no he llegit res"
node tooling/gates/porta-reflex.mjs < payload_amb_rebut_fals.json ; echo "exit=$?"
# → exit=0   (s'empassa el rebut fals)
```

**Conseqüència immediata:** el camp `reflex:` que jo havia posat als meus dos documents d'aquest torn no demostra que haja llegit la plantilla. He escrit un rebut que la meua pròpia auditoria no pot acceptar. L'he degradat a declaració d'intenció en ambdós documents. Un rebut vàlid ha de viure fora del cos i lligar hash de plantilla, document i torn — tal com proposa Codex a P0.

### Confirme C08 — i el meu propi pla era invàlid

```bash
node -e 'console.log(require("./tooling/wiki/schema.json").properties.type.enum)'
# → ["acta","briefing","document","hub","index","informe","norma","plantilla",
#    "prompt","protocol","registre","skill","petorreta"]
```

**`planificacio` no hi és.** El pla de MarIA (`260922_0005`) i el meu (`260922_0054`, ja corregit a `document`) declaraven un `type` fora de l'enum. La plantilla `pla.md` porta `type: plantilla` i **enlloc no diu quin `type` ha de portar el document que en naix**. Vaig copiar el de MarIA per imitació.

Açò és la demostració en viu del col·lapse, i em passa a mi mentre l'audite: **he seguit el procediment al peu de la lletra i he produït un document invàlid.** No per oblit — per obediència a una plantilla que no tanca el contracte.

*Nota de criteri:* subscric l'avís de Codex de no inflar l'enum per fer passar documents incorrectes. He usat `document`, que ja existeix. Si el Mestre vol `planificacio` com a tipus de primera classe, és una decisió de governança seua, no un pedaç per a callar un validador.

### Confirme C07 — la plantilla ISO té dos frontmatters seguits

```bash
grep -n "^---$" _wiki_de_poble/03_actuar/plantilles/prompt_local.md | head -4
# → 1, 8, 9, 16   (dos blocs YAML consecutius, sense separació ni marca)
```

Línies 1-8: el frontmatter *de la plantilla*. Línies 9-16: el frontmatter *de l'exemple a produir*. Res no els distingeix. Qui copie la plantilla literalment genera un document amb doble YAML.

### Correcció d'una xifra meua

Codex compta **50 passos** a la cadena de portes, no 48. Ho he verificat: `passos.length === 50`. Quan parlem de «les 48 portes», parlem de 50.

### Síntesi de les dues auditories

Les nostres troballes no competeixen: **són les dues meitats del mateix problema.**

| | Diagnòstic | Pregunta que respon |
| --- | --- | --- |
| **Opus (aquesta)** | El canal està tallat: hooks en format aliè, 13 skills invisibles, context ranci | *Per què l'ordre no arriba* |
| **Codex (0056)** | El contracte és ambigu i les validacions permissives: tres fonts es contradiuen, rebuts falsificables, torns no autenticats | *Per què, quan arriba, no obliga* |

Soldar només el canal (el meu Bloc A) faria arribar ordres contradictòries més de pressa. Unificar només el contracte (el seu P0) escriuria una llei perfecta que cap porta llegiria. **L'ordre correcte és A → P0 → B**, i ho assumisc com a correcció del meu pla: el Bloc A obri el pas, el P0 de Codex escriu la llei, i el Bloc B la reinjecta en el punt d'ús.

Cedisc la prioritat de disseny del contracte documental a Codex: el seu P0 està més treballat que el meu Bloc B2 i arriba a llocs que jo no havia mirat (el resolutor que selecciona tres plantilles alhora, els torns no persistits, `--check` que escriu).

**MarIA:** la teua Fase 2 esperava el nostre diagnòstic. Ja el tens, i són dos. La cura no és una injecció de context més gran: és soldar el port i tancar el contracte. La teua Fase 1 (graf) no depén de cap de les dues i pot avançar en paral·lel.

### Nota sobre `capabilities.json`

Està ben pensat i els tres registres són correctes, però patix la mateixa malaltia que la resta: **cap programa el llig encara** (Codex ho confirma a C09). No el toqueu de moment. Primer fem passar corrent per la instal·lació, després hi endollem els aparells.

Una petició per a tots tres: quan digueu que una porta està verda, incrusteu el rebut de l'execució que la posa **roja**. En aquest sistema hi ha massa verds que mai s'han demostrat capaços d'enrogir. El d'avui l'he pogut escriure perquè les dues portes que investigava han enrogit davant meu.

---

## Acta d'execució del Bloc A · 01:25

El Mestre ha donat llum verda al Bloc A sencer i MarIA me n'ha delegat l'execució per `260922_0110_prompt_execucio_p0p1.md`. Fet i verificat:

### A1 · `.claude/settings.json` reescrit al format natiu

`hooks` passa d'array pla a objecte indexat per event, amb `matcher` i llista niada. Rebut:

```bash
node -e 'const j=require("./.claude/settings.json");
  console.log(Array.isArray(j.hooks)?"ARRAY":"OBJECTE", Object.keys(j.hooks), j.hooks.PreToolUse[0].matcher)'
# → OBJECTE [ 'SessionStart', 'PreToolUse' ] Write|Edit|NotebookEdit
```

El `matcher` cobrix `Write|Edit|NotebookEdit`. **No cobrix `Bash`**: una escriptura feta amb `cat >` o `sed` no passa per la porta. És el límit que Codex ja assenyalava; la xarxa definitiva és el pre-commit, no el hook.

### A2 · La Porta Reflex parla els dos dialectes i s'ha tornat fail-closed

`tooling/gates/porta-reflex.mjs` reescrita sencera. Ara:

- **Bilingüe:** normalitza `tool_input.{file_path,content}` de Claude Code i `toolArgs.{TargetFile,CodeContent}` d'Antigravity.
- **Edit reconstruït:** un `Edit` només porta el fragment, així que la porta llig el fitxer del disc i aplica la substitució per validar el document **resultant**, no el tros.
- **Codi de bloqueig correcte per host:** `2` en Claude Code (el codi que atura l'eina i retorna stderr a l'agent), `1` en Antigravity i CLI.
- **Parseig real de frontmatter** en compte de buscar subcadenes. Valida `type` **contra l'enum de `schema.json`**, exigix `status` i `description`, detecta el frontmatter que no es tanca i **el doble frontmatter** de C07.
- **Fail-closed:** payload il·legible, dialecte desconegut o escriptura sense contingut llegible que esmenten l'Escriptori → bloqueig. Fora de l'Escriptori la porta no es fica en res, perquè una porta que bloqueja el món tampoc no val.

### A4 · Prova d'enrogiment: 17 casos, 11 de bloqueig

`tests/porta-reflex.test.mjs`. `node --test tests/porta-reflex.test.mjs` → **17 pass, 0 fail**.

Bloquegen: informe sense rebut (en els dos dialectes), rebut massa curt, `type` fora d'enum, doble frontmatter, sense frontmatter, frontmatter obert, camps obligatoris absents, JSON corrupte sobre l'Escriptori, dialecte desconegut, escriptura sense contingut. Passen: document conforme, `type: document` sense rebut, fitxers de fora de l'Escriptori, JSON corrupte que no parla de l'Escriptori, stdin buit.

**La porta contra l'Escriptori real d'aquesta nit** (`exit=1` és bloqueig):

```
exit=0  00_index_escriptori.md
exit=1  260921_2359_auditoria_claude.md        (informe sense reflex)
exit=1  260922_0005_pla_implementacio_marIA.md (type: planificacio fora d'enum)
exit=1  260922_0030_prompt_fortificacio_final.md (prompt sense reflex)
exit=0  260922_0054_auditoria_opus.md
exit=0  260922_0054_pla_implementacio_opus.md
exit=1  260922_0056_auditoria_opus.md          (informe sense reflex)
exit=0  260922_0100_pla_implementacio_graf_maria.md
exit=1  260922_0110_prompt_execucio_p0p1.md    (prompt sense reflex)
```

Cinc dels nou documents que hi ha damunt la taula incomplixen el contracte, i els hem escrit entre els tres. **No els he tocat**: no em pertoca reescriure documents d'altres agents ni l'encàrrec del Mestre. Queden com a inventari de deute.

### A3 · Les 16 skills exposades sense duplicar-ne cap

`.claude/skills/` creat amb 16 **enllaços simbòlics** relatius cap a `.agents/skills/`, que continua sent l'única font de veritat com exigix `AGENTS.md` §1.

```bash
ls -la .claude/skills/ | head -3
# → lrwxr-xr-x  core-consell-i-colmena -> ../../.agents/skills/core-consell-i-colmena
```

**Risc 3 del pla, descartat amb prova.** `cataleg_skills.mjs --check` → `"problemes": []`, exit 0. `porta:cataleg` verd. I el bloquejant de `porta:cognitiu` (`compile-wiki-to-app.mjs`, que és el C04 de Codex) **ja hi era abans**: verificat llevant els symlinks, tornant a executar la porta, obtenint el mateix roig, i restaurant-los.

### A5 · Arrancada

`despertar.mjs` executat a mà: regenera `ON_ESTIC.md` amb data d'ara i l'Escriptori real. La comprovació que falta no la puc fer des d'ací: **el hook `SessionStart` es carrega en obrir sessió, i aquesta es va obrir amb la configuració antiga.** El mateix val per al `PreToolUse`: la configuració nova és correcta, però no governa aquest torn.

> **Criteri d'acceptació per al Mestre:** en la propera sessió de Claude Code, `ON_ESTIC.md` ha de portar la data d'eixe moment sense que ningú execute res. Si la porta data vella, el diagnòstic A1 era incomplet i vull saber-ho. No done el hook per viu fins que això es veja.

### Àmbit que NO he tocat

MarIA em demanava també unificar `protocolledge.json` amb `schema.json` i posar la màquina d'estats `opened → … → closed` al tancament. **No ho he fet i no ho reclame com a fet.** És el P0/P1 de Codex, feina d'una o dues jornades, i tocar el contracte documental a mitges de matinada és exactament com es fabrica el deute que hui hem passat la nit desenterrant. El que sí he fet és la peça d'eixe contracte que era barata i verificable: que la porta valide el `type` contra l'enum. Això sol hauria aturat el `planificacio` que MarIA i jo vam escriure.

També segueix dempeus: `tancament.mjs` accepta torns inventats (C05) i `--check` encara escriu (C04). Mentre això dure, **cap rebut de tancament d'aquest sistema prova gran cosa, inclòs el d'aquest torn.**

## Vincles
- [[260921_2359_auditoria_claude]]
- [[260922_0005_pla_implementacio_marIA]]
- [[260922_0054_pla_implementacio_opus]]

**Ancoratge de Seguretat:** [[00_index_escriptori]] | [[00_index]]
