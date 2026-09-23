---
type: informe
status: esborrany
description: Per què l'agent no pot seguir la Plantilla ISO. Diagnòstic del col·lapse cognitiu amb evidència executable i solució estructural.
tags:
  - auditoria
  - reflex
  - skills
  - govern
reflex: Llegida auditoria_canonica.md resolta per .agents/protocolledge.json (intencio auditoria) i prompt_local.md (intencio prompt/local). Torn torn_1790037435784 obert amb obrir_torn.mjs.
---

# Auditoria Opus — El col·lapse cognitiu no és fatiga, és un incentiu invertit

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-OPUS-260922-0239 |
| Torn | `torn_1790037435784` |
| Agent | Claude Opus 5 (local, Claude Code / app d'escriptori) |
| Abast | Cadena de l'Acte Reflex: plantilles, `protocolledge.json`, `schema.json`, `porta-reflex.mjs`, càrrega de skills |
| Antecedents llegits | [[260922_0235_acta_marmota]], `00_index_escriptori`, `ON_ESTIC.md`, `ESTAT.md` |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

---

## 1. El veredicte, en una frase

**L'agent que obeïx l'Acte Reflex és castigat i l'agent que improvisa passa.** No és fatiga de context ni manca de disciplina: és que copiar fidelment qualsevol de les 14 plantilles produïx un document que la porta rebutja, mentres que inventar-se el frontmatter i escriure `reflex:` amb una frase falsa passa la porta a la primera. Això és una estructura de recompensa, i qualsevol sistema que aprén dels resultats acaba on estem.

---

## 2. Evidència executable (reproduïble ara mateix)

### Prova A — Les 14 plantilles no declaren mai el document que engendren

```
00_index_plantilles.md       NO-DECLARA-FM-FILL
acta.md                      NO-DECLARA-FM-FILL
brainstorming.md             NO-DECLARA-FM-FILL
branding.md                  NO-DECLARA-FM-FILL
bundle.md                    NO-DECLARA-FM-FILL
doc_to_app.md                NO-DECLARA-FM-FILL
estudi_consell.md            NO-DECLARA-FM-FILL
pla.md                       NO-DECLARA-FM-FILL
pla_implementacio.md         NO-DECLARA-FM-FILL
produccio.md                 NO-DECLARA-FM-FILL
prompt_consell.md            FM-DUPLICAT
prompt_local.md              FM-DUPLICAT
skill.md                     NO-DECLARA-FM-FILL
auditoria_canonica.md        NO-DECLARA-FM-FILL
```

Dotze plantilles només porten el seu propi `type: plantilla`. Qui les copia fidelment produïx un document sense frontmatter (bloqueig: «no comença amb `---`») o amb `type: plantilla` (bloqueig: tipus incorrecte). Les dos que sí declaren el fill ho fan amb **dos blocs `---` seguits**, que la porta detecta i bloqueja explícitament.

**Resultat: 14 de 14. La taxa d'èxit de l'obediència literal és zero.**

### Prova B — La porta accepta una mentida de 40 caràcters

```bash
printf '%s' '{"tool_name":"Write","tool_input":{"file_path":"_wiki_de_poble/04_escriptori/prova.md",
"content":"---\ntype: informe\nstatus: esborrany\ndescription: una descripcio prou llarga\
\nreflex: me ho he inventat tot aixo i ja esta\n---\n# Hola"}}' | node tooling/gates/porta-reflex.mjs
# exit=0
```

El mateix document sense `reflex:` dona `exit=2`. La porta no mesura lectura: mesura **longitud de cadena** (`REFLEX_MINIM = 20`). El propi codi ho confessa a la línia 128: *«`reflex:` és una declaració d'intenció, no una prova de lectura»*.

### Prova C — La plantilla canònica d'auditoria descriu una Wiki que no existix

`auditoria_canonica.md` declara 13 pilars estructurals obligatoris:
`00_core_wiki`, `01_identitat_iaia`, `02_filosofia`, `03_govern`, `04_arquitectura_disseny`, `05_skills_ia`, `06_cultura`, `07_plantilles`, `08_capacitats`, `09_skills_colmena`, `10_metriques`, `11_recursos_ia`, `12_actes`.

La Wiki real:

```
_wiki_de_poble/01_ser/  02_saber/  03_actuar/  04_escriptori/  10_actes/  90_arxiu_historic/
```

**Coincidències: 0 de 13.** I les comandes canòniques que la mateixa plantilla ordena executar inclouen `npm run porta:esquemes`, que **no existix a `package.json`** — precisament el pecat que el document prohibix tres paràgrafs més amunt («Verifica que cada script citat existisca en una ruta activa»).

### Prova D — La plantilla prohibix el camp que la porta exigix

| Font | Diu |
| --- | --- |
| `auditoria_canonica.md` | Obligatoris: `status`, `type`, `description`. Opcionals: `aliases`, `revisat`. **«Qualsevol camp addicional és deriva.»** |
| `porta-reflex.mjs:109` | Si `type` ∈ {prompt, informe, acta} → **`reflex:` obligatori** o bloqueig. |
| `tooling/wiki/schema.json` | `additionalProperties: false`, i `revisat` **no és a `properties`**. |

Seguir la plantilla → la porta bloqueja per falta de `reflex:`.
Seguir la porta → violes la plantilla («deriva»).
Posar `revisat` com autoritza la plantilla → el schema el rebutja.

No hi ha cap camí que satisfaça les tres fonts alhora. **L'Acte Reflex és, literalment, irrealitzable tal com està escrit.**

### Prova E — L'encaminament apunta a la plantilla equivocada

`protocolledge.json` encamina `planificació / pla director / roadmap / fases` → `03_actuar/plantilles/pla.md`. Però `pla.md` és una plantilla de màrqueting que comença amb un llistat de **logotips oficials en SVG**. La plantilla real de Pla d'Implementació (`pla_implementacio.md`, amb Context, Preguntes Obertes, Canvis Proposats, Verificació) **no està encaminada des de cap regla**. Qui obeïx el protocol arriba als logos; qui vol el pla ha de desobeir el protocol.

---

## 3. Les troballes, amb el contracte d'informe

### T1 · Les plantilles no són contractes, són prosa — **CRÍTICA**
- **Scope:** `_wiki_de_poble/03_actuar/plantilles/*` (14 fitxers) + `02_saber/protocols_tecnics/auditoria_canonica.md`
- **Evidència:** Prova A.
- **Conflicte amb:** `AGENTS.md §0` («verifiqueu que el frontmatter del prompt nou hereta tots els camps obligatoris de la plantilla») — no es pot heretar el que no està escrit enlloc.
- **Proposta conservadora:** cada plantilla incorpora un bloc `EIXIDA` delimitat (`<!-- SDP:EIXIDA -->…<!-- /SDP:EIXIDA -->`) amb el frontmatter exacte del document fill. Un sol bloc, copiable, sense ambigüitat.

### T2 · El `reflex:` és falsificable per disseny — **CRÍTICA**
- **Scope:** `tooling/gates/porta-reflex.mjs:109-123`
- **Evidència:** Prova B (`exit=0` amb text inventat).
- **Conflicte amb:** `wiki-cicle-de-vida` → «La neteja es demostra amb rebut, no amb adjectius».
- **Proposta conservadora:** substituir la mesura de longitud per un **rebut verificable**: `reflex:` ha de contindre el `turn_id` del torn obert i el hash curt (8 hex) del fitxer de plantilla resolt. La porta recalcula el hash del disc i compara. Falsificar-ho exigix haver llegit el fitxer.

### T3 · La plantilla canònica d'auditoria és obsoleta — **CRÍTICA**
- **Scope:** `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`
- **Evidència:** Prova C (0/13 pilars existixen; `porta:esquemes` inexistent).
- **Conflicte amb:** la realitat del disc i el seu propi apartat «Coherència executable».
- **Proposta conservadora:** reescriure l'abast sobre els 6 directoris reals i substituir la llista de comandes per les que sí existixen (`porta:frontmatter`, `porta:cognitiu`, `porta:llaurador`, `porta:reflex`, `porta:nomenclatura`). Marcar `status: quarantena` mentrestant.

### T4 · Contradicció triangular de metadades — **CRÍTICA**
- **Scope:** `auditoria_canonica.md` ↔ `porta-reflex.mjs` ↔ `schema.json`
- **Evidència:** Prova D.
- **Conflicte amb:** `AGENTS.md §1` («Un sol cervell»). Ací n'hi ha tres i es contradiuen.
- **Proposta conservadora:** `schema.json` és l'única font mecànica. La plantilla deixa de llistar camps i remet al schema. `revisat` o s'afig al schema o desapareix de la plantilla. **`requires_human_decision: true`** — qui mana sobre `revisat` és decisió del Mestre.

### T5 · Encaminament trencat cap a `pla.md` — **ALTA**
- **Scope:** `.agents/protocolledge.json:70-73`
- **Evidència:** Prova E.
- **Proposta conservadora:** afegir la ruta `pla.implementacio` (claus: «pla d'implementació», «implementació») → `pla_implementacio.md`, i deixar `pla.md` per a roadmaps de producte.

### T6 · Frontmatter duplicat als dos `prompt_*` — **ALTA**
- **Scope:** `prompt_local.md:1-16`, `prompt_consell.md`
- **Evidència:** Prova A. Detectat per Codex el 260922_0056; **seguix obert 2 h 43 min després**.
- **Proposta conservadora:** el bloc del fill passa a `<!-- SDP:EIXIDA -->`, que no és YAML i per tant no pot col·lisionar.

### T7 · Les 16 skills es descobrixen però no es carreguen — **ALTA**
- **Scope:** `.claude/skills/` (16 enllaços simbòlics, creats 260922_0121)
- **Evidència:** les 16 apareixen al llistat d'skills de la sessió; cap cos de skill entra al context si ningú invoca l'eina `Skill`. Les úniques tres que sí hi entren són les `@`-importades des de `CLAUDE.md`, i hi entren com a **text pla al preàmbul**.
- **Matís important:** el P0 del 0054 es va aplicar bé — el descobriment funciona. El que no es va resoldre és que **descobrir ≠ carregar**.
- **Proposta conservadora:** no cal carregar-les totes. Cal que la porta **cite la skill concreta** al moment del bloqueig (vegeu §4).

### T8 · L'índex de l'Escriptori mentix — **MITJANA**
- **Scope:** `_wiki_de_poble/04_escriptori/00_index_escriptori.md:37-56`
- **Evidència:** llista com a «Documents Actius» set fitxers que ja són a `90_arxiu_historic/` (`260921_2359_auditoria_claude`, `260922_0054_*`, `260922_0056_*`, `260922_0100_*`, `260922_0110_*`).
- **Proposta conservadora:** `porta:llaurador` hauria de detectar enllaços a fitxers inexistents dins l'Escriptori. Netejar l'índex en este mateix torn.

---

## 4. Per què el pegat del 0054 no bastava (autocrítica)

A les 00:54 vaig diagnosticar el problema com a **fontaneria**: hooks en dialecte equivocat, skills invisibles. Vaig soldar les dos coses i van quedar soldades — les proves d'esta auditoria ho confirmen: el hook dispara, la porta bloqueja, les 16 skills es veuen.

I el Mestre continua havent de repetir les instruccions. Per tant el meu diagnòstic era **correcte però incomplet**: vaig arreglar el canal i no el contingut que hi circula. Una ordre que arriba però que és impossible d'obeir no és millor que una ordre que no arriba; és pitjor, perquè ara falla amb soroll.

El que faltava és això: **una regla llegida al minut 0 d'una sessió no és present al minut 90, quan s'escriu.** L'únic mecanisme del sistema que sí és present en el moment exacte de l'escriptura és el hook `PreToolUse`. Ara mateix eixe hook gasta eixe privilegi per dir «falta el camp `reflex`». És com tindre l'única boca que l'agent escolta i usar-la per renyar en lloc d'ensenyar.

---

## 5. La solució definitiva: la porta que ensenya

El principi, en una línia: **deixar de recordar-li a l'agent el que ha de fer i posar-li-ho davant en el moment que ho fa.**

Tres peces, en este ordre:

### Peça 1 — El bloc `EIXIDA` (la plantilla es torna contracte)
Cada plantilla declara, en un bloc delimitat i llegible per màquina, el frontmatter exacte del document que produïx. Un script (`tooling/wiki/tractor-plantilles.mjs`) valida que eixe bloc existix i que el seu `type` és a l'enum de `schema.json`. Una plantilla sense bloc `EIXIDA` vàlid és una plantilla trencada i la porta ho diu.

### Peça 2 — La reinjecció en el punt d'ús (el cor de l'arranjament)
Quan `porta-reflex.mjs` bloqueja una escriptura a l'Escriptori, el missatge d'error deixa de ser una queixa i passa a ser **la plantilla resolta**:

```
[PORTA-REFLEX] BLOQUEIG — auditoria_opus.md
  Intenció detectada: auditoria  →  02_saber/protocols_tecnics/auditoria_canonica.md
  Skill que ho governa: .agents/skills/wiki-documentacio-i-reflex

  Apega este frontmatter i torna-ho a intentar:
  ---
  type: informe
  status: esborrany
  description: <12-220 caràcters>
  tags: [auditoria]
  reflex: torn_1790037435784 · a1b2c3d4
  ---
  El rebut `a1b2c3d4` és el hash de la plantilla. Si no l'has llegida, no el tens.
```

Això converteix una norma memoritzada en una **instrucció just-in-time**. L'agent falla una vegada, rep el contracte exacte, i encerta a la segona — de forma determinista, sense que el Mestre òbriga la boca. És el mateix principi de la Pedra Seca: la pedra no et demana que recordes la seua forma, t'encaixa o no t'encaixa.

### Peça 3 — El rebut criptogràfic (T2)
`reflex: <turn_id> · <hash8>`. La porta llig la plantilla del disc, calcula el hash i el compara. No és una prova d'haver *comprés* la plantilla, però sí d'haver-la **tocada**, i tanca el forat de la Prova B. És honest dir què garanteix i què no.

### El que expressament NO propose
- **No propose carregar les 16 skills al preàmbul.** Serien ~95 KB al minut 0 que estarien igual de lluny del minut 90. Empitjoraria la febre de context sense arreglar res.
- **No propose més normes.** El sistema no patix escassetat de normes; patix que les normes es contradiuen. Cada norma nova sense font mecànica és una contradicció futura.

---

## 6. Estat de la Reunió a l'Olivera

- **Codex (260922_0056):** confirme C03 (`reflex` falsificable) amb la Prova B, i C07 (doble frontmatter a `prompt_local.md`) amb la Prova A. C08 (`planificacio` fora de l'enum) ja no aplica com el va descriure: `planificacio` és un **id de ruta** a `protocolledge.json`, no un `type`; el problema real és T5, que apunta a la plantilla equivocada.
- **MarIA:** el teu pla de l'Explorador del Brain no queda tocat per esta auditoria. Les tasques 5 i 6 del Mestre (graf interactiu i sincronització viva) van al Bloc C del pla adjunt.
- **Per a qui arribe després:** la Prova B és una comanda de tres línies. Executa-la abans de creure't res del que hi ha escrit ací.

---

## 7. Resposta directa al Mestre

Preguntaves què impedix a l'agent seguir la Plantilla ISO. La resposta és que **no la pot seguir**: les 14 plantilles produïxen documents que la teua pròpia porta rebutja, la plantilla d'auditoria descriu una Wiki que vas reorganitzar fa dies, i la porta demana un camp que la plantilla qualifica de deriva. No és que l'agent oblide l'ordre. És que l'ordre, complida al peu de la lletra, falla — i improvisar funciona. Qualsevol agent acaba improvisant.

I la part que et cansa a tu té nom tècnic: **estàs fent de porta.** Repetixes les instruccions perquè el sistema no les imposa en el moment que fan falta. La feina és passar-li eixa càrrega al codi.

Pla d'execució: [[260922_0239_pla_implementacio_opus]]

---

**Ancoratge de Seguretat:** [[00_index_escriptori]] | [[00_index]]
