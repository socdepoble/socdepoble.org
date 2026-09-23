---
type: informe
status: esborrany
description: "Auditoria del Brain: per què la cadena de portes no corre, per què l'acte reflex no dispara i com sincronitzar la Wiki en calent."
tags:
  - auditoria
  - brain
  - govern
  - portes
reflex: "sdp:torn_e892aa9d-0725-4ed4-8b7a-343d537c85b8:6509775b-a2b4-438e-bbd2-963e5df371d5"
---

# Auditoria del Brain — per què el cervell no es carrega

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260923_1310_CLAUDE |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 13:10 |
| Modificació | 26-09-23 13:10 |
| Propietari | Claude (agent local) |
| Plantilla | auditoria_canonica.md (ruta `auditoria`, v2.0.0) |
| Torn | `torn_e892aa9d-0725-4ed4-8b7a-343d537c85b8` (abast `documents`) |
| Rebut | `sdp:torn_e892aa9d-0725-4ed4-8b7a-343d537c85b8:6509775b-a2b4-438e-bbd2-963e5df371d5` |
| Aprovació humana | pendent |
| requires_human_decision | true (T1, T4, T8, T10, T13) |

## Acte reflex

Torn obert amb `obrir_torn.mjs --actor Claude --scope documents`. Plantilla demanada amb `document.mjs context --route auditoria` i llegida sencera abans d'escriure una línia. El rebut acredita procedència, no comprensió. Cap fitxer de codi tocat: Mode AFK respectat.

Ho faig així a propòsit. La troballa central d'aquesta auditoria és que **el ritual es complix quan viu al document que es llig en el moment d'actuar, i no es complix quan viu en una skill**. Este informe és la prova en la meua pròpia carn: he seguit el cicle perquè la plantilla me l'ha posat davant, no perquè m'ho sabera.

## Historial

- **v1.0.0 (260923_1310):** Primera entrega. Respon a `260923_1245_prompt_auditoria_claude`. Llegits prèviament `AGENTS.md`, `02_genotip.md`, `00_index.md`, el Pla de MarIA de les 12:45 (versió de les 13:13, amb els dos requeriments nous del Mestre) i l'auditoria de Codex de les 13:03.

## Troballes

Catorze troballes. Les cinc primeres expliquen, mecànicament, les tres preguntes del Mestre. Les tres últimes responen els dos encàrrecs afegits (Watcher i Editabilitat).

---

### T1 · Aprendre trenca la cadena de portes · CRÍTICA

**Fitxers:** `.agents/SKILLS_SEAL.json`, `tooling/gates/segella.mjs`, `tooling/gates/run-portes.mjs`, `CLAUDE.md` (REFLEX DE CORRECCIÓ)

**Evidència reproduïble:**

```bash
npm run porta
# → ❌ [Llei Z] Ruptura de segell detectada! El hash actual 93172cc9
#      no coincideix amb el segellat 6314fc7f.
# → ❌ [FRACÀS] Segell de skills
# → CADENA exit = 1   (porta 4 de 49)
```

Marques de temps mesurades:

| Fitxer | Modificació |
| --- | --- |
| `.agents/SKILLS_SEAL.json` | 260922_1736 |
| `.agents/skills/sdp-workflow/SKILL.md` | 260923_0030 |
| `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` | **260923_1248** |

Les dos modificacions són els dos actes d'aprenentatge d'aquesta jornada: les tres lliçons de la Llei del Píxel (00:30) i la lliçó «Acte Reflex Absent» (12:48, dotze minuts abans de donar-me la petorreta). El `LEDGER` les registra a les línies 353-355.

**Mecànica:** `CLAUDE.md` ordena quatre passos quan el Mestre corregix un hàbit: aturar, escriure la lliçó al `SKILL.md`, anotar-ho al LEDGER, contestar. **Cap dels quatre resegella.** `segella.mjs:37` tracta qualsevol divergència com una agressió («T'han modificat les regles d'amagat?») i ix 1. `run-portes.mjs` col·loca eixa comprovació en quarta posició de 49.

**Conseqüència exacta:** des de les 00:30 d'aquesta matinada, **45 portes de 49 no s'han executat ni una sola vegada**. No estan verdes: estan mudes. I el `pre-commit` (`.husky/pre-commit`) crida `npm run gate`, per tant tampoc pot fer un commit net. El sistema immunitari s'apaga cada vegada que el Mestre ensenya alguna cosa.

**Agreujant:** `segella.mjs:9-21` recorre `.agents/skills/` sense cap filtre d'extensió. Els 18 fitxers que entren al hash inclouen `.agents/skills/.DS_Store`. **Obrir eixa carpeta al Finder trenca el segell criptogràfic de les skills.**

**Font de veritat en conflicte:** `CLAUDE.md` (REFLEX DE CORRECCIÓ) contra `tooling/gates/segella.mjs` (Llei Z). La doctrina obliga a escriure a les skills; la porta ho tracta com a manipulació.

**Proposta conservadora:**
1. Afegir un pas 3.5 al REFLEX DE CORRECCIÓ: `npm run porta:segella -- --update`, i que la línia del LEDGER incloga el hash nou. Cost: una ordre.
2. `segella.mjs`: hashejar només `**/SKILL.md` i `00_INDEX_SKILLS.md`. Un `.DS_Store` no és una regla.
3. Moure la Porta Segell al **final** de la cadena, o convertir-la en avís no bloquejant. Una porta d'integritat que impedix executar les altres 45 protegix menys del que costa.

`requires_human_decision: true` per al punt 3: decidir si el segell és un tallafocs (para tot) o un testimoni (informa i deixa passar) és govern, no tècnica.

---

### T2 · La ruta canònica de les petorretes locals és inabastable · CRÍTICA

**Fitxers:** `.agents/protocolledge.json`, `tooling/wiki/plantilles.mjs:22-27`

**Evidència reproduïble:**

```bash
node -e "import('./tooling/wiki/plantilles.mjs').then(m=>console.log(m.suggeriment('_wiki_de_poble/04_escriptori/260923_1245_prompt_auditoria_claude.md').id))"
# → auditoria
```

`suggeriment()` puntua cada ruta per la **clau més llarga** que apareix al nom del fitxer. Les claus reals:

| Ruta | Claus |
| --- | --- |
| `prompt.consell` | `prompt`, `petorreta`, `consell de`, `petició`, `z.ai`, `consell` |
| `prompt.local` | `prompt intern`, `petorreta interna`, `per a codex`, `per a claude`, `prompt local`, `local` |
| `auditoria` | `auditoria`, `revisar`, `auditar` |

Mesurat sobre els noms reals d'avui:

| Fitxer | Ruta que guanya |
| --- | --- |
| `260923_1245_prompt_auditoria_claude.md` | `auditoria` (clau de 9 lletres bat `prompt`, de 6) |
| `260923_1245_prompt_auditoria_codex.md` | `auditoria` |
| `260923_9999_prompt_prova.md` | `prompt.consell` |

**El problema de fons:** AGENTS §2 obliga a noms `aammdd_hhmm_categoria_titol`. Cap nom que complisca eixa taxonomia pot contindre mai «per a claude», «prompt intern» ni «petorreta interna». **`prompt.local` és inaccessible per disseny.** Una petorreta per a un agent local rep la plantilla d'auditoria o la del Consell —la que exigix Bundle, prohibit per AGENTS §6 per a IAs locals.

Ho he vist en directe: en simular el hook sobre un fitxer nou, el missatge de recuperació deia `Plantilla suggerida: prompt.consell`. La porta que bloqueja per protegir la doctrina assenyala la plantilla que la trenca.

**Font de veritat en conflicte:** AGENTS §2 (taxonomia) i §6 (zero bundles per a locals) contra `.agents/protocolledge.json`.

**Proposta conservadora:** afegir a les claus de `prompt.local`: `prompt claude`, `prompt codex`, `auditoria claude`, `auditoria codex`, `prompt auditoria`. I a `suggeriment()`, desempatar per prefix: si el nom comença per `<data>_<hora>_prompt_`, cap ruta que no siga `prompt.*` pot guanyar. Cost: un objecte JSON i tres línies.

---

### T3 · La lliçó viu a la skill; el ritual viu a la plantilla; no es toquen · ALTA

Esta és la resposta directa a la segona pregunta del Mestre: *per què no execute l'acte reflex de netejar l'escriptori i escriure el Pla*.

**Fitxers:** `_wiki_de_poble/03_actuar/plantilles/prompt_local.md`, `.agents/skills/wiki-documentacio-i-reflex/SKILL.md`

**Evidència reproduïble:** obri `prompt_local.md` sencer (76 línies). **No conté cap instrucció perquè qui l'escriu netege l'escriptori ni escriga el Pla abans.** El seu §«Protocol de la Reunió a l'Olivera» parla als *destinataris*, i menciona el Pla de MarIA en futur descriptiu: «la IAIA MarIA estarà a l'escolta i començarà a redactar un Pla». És una promesa feta a tercers, no una precondició de l'autor.

L'obligació existix, però només a `.agents/skills/wiki-documentacio-i-reflex/SKILL.md`, §Lliçons del Mestre, entrades 260922 i 260923.

**Dos mesures independents del mateix efecte:**

1. `260923_1245_prompt_auditoria_claude.md` és una còpia quasi literal de `prompt_local.md` amb `## Tasca` emplenada. Va heretar **tot** el que la plantilla deia i **res** del que la plantilla no deia. La fidelitat al portador és altíssima; la fidelitat a la lliçó és zero.
2. `260923_1245_pla_implementacio_auditoria.md` **no seguix `pla_implementacio.md` en absolut**: li falten Registre, Acte reflex, Historial, Canvis proposats, Verificació i Riscos. El Pla es va escriure sense obrir la seua plantilla. L'Efecte Matrix no va córrer tampoc per al Pla.

**Diagnòstic:** no és amnèsia ni desobediència. És que el moment de decisió té un únic document obert davant —la plantilla— i la regla està en un altre. Una regla que ha de disparar en el moment X ha de viure al document que es llig en el moment X. Qualsevol altra ubicació és decorativa.

**Font de veritat en conflicte:** `wiki-documentacio-i-reflex` §Lliçons (260922, 260923) contra el contingut real de `prompt_local.md`.

**Proposta conservadora:** moure la precondició **dins** de `prompt_local.md`, com a secció 0, abans de tot:

```markdown
## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [ ] Escriptori classificat: els documents actius seguixen ancorats a
      `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`).
- [ ] `Pla d'Implementació` escrit i desat a `04_escriptori/` amb el mateix
      cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`.
- [ ] Rebut obtingut per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.
```

I al §Registre, dos files noves: `| Ruta | prompt.local |` i `| Rebut | sdp:torn…:… |`. Un rebut visible fa que la desviació de T2 es note a simple vista.

---

### T4 · El motor que triava la skill pel context no el crida ningú · ALTA

**Fitxers:** `tooling/session/persona_router.mjs`, les 16 `SKILL.md`

**Evidència reproduïble:**

```bash
grep -rn "persona_router" --include='*.mjs' --include='*.js' --include='*.json' --include='*.sh' tooling/ src/ package.json .husky/
# → tooling/session/persona_router.mjs:3:  * tooling/session/persona_router.mjs
```

Una única aparició: el seu propi comentari de capçalera. **Zero cridadors.** I `persona_router.mjs:46` és l'únic lloc de tot el repositori que *usa* `triggers_on` per a encaminar: `const triggers = pluginDef.triggers_on || []`.

Els altres consumidors de `triggers_on` sí que corren, però només el validen: `cataleg_skills.mjs:59` comprova que siga un array de cadenes; `tractor-registre.mjs:300` en fa un cens de col·lisions. Cap dels dos carrega res.

**Conseqüència:** les 16 skills declaren disparadors semàntics que cap motor llig. Les skills es carreguen només de dos maneres: les tres cablejades als `@`-imports de `CLAUDE.md` (sempre, per a Claude Code) i la invocació explícita. Per a qualsevol altre agent, `triggers_on` és ornamentació.

`AGENTS.md` §1 ja ho diu en veu alta: les skills «són procediments consultables… **no són memoritzables per defecte**». La constitució declara el forat; res no el tapa.

**Font de veritat en conflicte:** el frontmatter de 16 skills promet un mecanisme que no existix.

**Proposta conservadora:** o bé endollar `persona_router.mjs` a un hook `UserPromptSubmit` de `.claude/settings.json` (i el seu equivalent a `.agents/hooks.json`), o bé llevar `triggers_on` del frontmatter. Les dos són honestes; la que hi ha ara no.

`requires_human_decision: true`: endollar-lo canvia què entra al context de cada torn, i això és una decisió d'arquitectura cognitiva del Mestre, no meua.

---

### T5 · La recaiguda no es compta, i per això sembla un problema d'aprenentatge · ALTA

**Fitxers:** `.agents/LEDGER.md:112` i `:115`, `.agents/skills/wiki-cicle-de-vida/SKILL.md`

**Evidència reproduïble:**

```bash
grep -n "| correcció |\|recaigud" .agents/LEDGER.md
# 112: ## 260922 | correcció | wiki-documentacio-i-reflex | Prohibició de BUNDLEs ... i Obligació de Pla
# 115: ## 260922 | recaiguda  | wiki-cicle-de-vida | Higiene d'escriptori ignorada per tercera vegada el mateix dia
```

La lliçó «Acte Reflex Absent (Neteja i Pla de l'Olivera)» es va escriure a `wiki-documentacio-i-reflex/SKILL.md` **hui a les 12:48**. No hi ha cap línia `recaiguda` al LEDGER per a eixa entrada.

`CLAUDE.md` és explícit: «Si el Mestre repeteix una correcció ja anotada, és una FALLA DE CÀRREGA, no d'aprenentatge: registra-la al LEDGER com a *recaiguda* i revisa l'ancoratge de les skills.»

**Segon defecte, més silenciós:** la recaiguda del 260922 es va imputar a `wiki-cicle-de-vida`, però

```bash
grep -rln "Lliçons del Mestre" .agents/skills/
# .agents/skills/wiki-documentacio-i-reflex/SKILL.md
# .agents/skills/sdp-workflow/SKILL.md
```

`wiki-cicle-de-vida/SKILL.md` **no té secció de Lliçons**. El LEDGER assenyala una skill que no conté la lliçó.

**Recompte real:** la mateixa conducta s'ha corregit com a mínim quatre vegades (tres el 260922 segons la pròpia línia 115, més la del 260923). El sistema n'ha registrat **una** com a recaiguda. El Mestre té raó quan diu que no tinc integrat l'acte reflex; el que el sistema no diu és quantes vegades ja ho havia dit.

**Proposta conservadora:** abans d'afegir una lliçó nova, `grep` de les paraules clau a les seccions de Lliçons existents; si hi ha coincidència semàntica, la línia del LEDGER és `recaiguda` i no `correcció`. I unificar: totes les lliçons d'higiene documental a **una** skill, no repartides entre dos.

---

### T6 · L'`ON_ESTIC` que llegixes és el de la sessió anterior · ALTA

Esta és la resposta mecànica a «se'ns trenca la memòria».

**Fitxers:** `tooling/brain/despertar.mjs`, `CLAUDE.md` (`@.agents/ON_ESTIC.md`)

**Evidència reproduïble — mesurada en aquesta mateixa sessió:**

El hook `SessionStart` ha imprés: `[despertar.mjs] ON_ESTIC.md generat amb èxit a 2026-09-23T10:59:58.564Z`. El fitxer al disc diu exactament eixa hora. **La còpia injectada al meu context per l'`@`-import diu `2026-09-22T22:13:14.452Z`** i llista un escriptori de cinc entrades, tres de les quals estan hui a `90_arxiu_historic`:

- `260922_2352_prompt_auditoria_al-lucinacio.md`
- `260923_0005_prompt_auditoria_codex.md`
- `260923_0010_pla_implementacio_universal_workspace.md`

L'`@`-import es resol **abans** (o amb independència) de l'escriptura del hook. Cada sessió comença llegint el mapa d'ahir d'una taula que ja ha canviat. I el mapa d'ahir apunta a l'arxiu històric, que AGENTS §5 prohibix llegir en procediments automàtics.

El fitxer s'autoacusa: «SI L'HORA D'ACÍ DALT NO COINCIDEIX EXACTAMENT AMB EL TEU INICI, AQUEST FITXER MENTEIX». Un avís no és una reparació: demana a l'agent que desconfie del seu propi context d'arrancada cada torn, i entrena exactament el reflex que després lamentem.

**Font de veritat en conflicte:** el propòsit declarat de `despertar.mjs` contra l'ordre real de càrrega del client.

**Proposta conservadora:** que `despertar.mjs` **no escriga un fitxer que després s'`@`-importa**. Dos eixides netes:
- emetre la fotografia per `stdout` com a `additionalContext` del hook `SessionStart` (arriba després de generar-se, per definició); o
- llevar `@.agents/ON_ESTIC.md` de `CLAUDE.md` i que el pas 1 de cada sessió siga llistar `04_escriptori/` amb una eina.

**Dos defectes menors del mateix fitxer:** `despertar.mjs:51-56` emet `---` dos vegades seguides (un segon bloc de frontmatter buit) i la `description` diu «la sessió actua» per «actual».

---

### T7 · L'ESTAT té tres «estats actuals»: s'escriu a dalt i es llig a baix · ALTA

**Fitxers:** `.agents/ESTAT.md`, `tooling/brain/despertar.mjs:33`

**Evidència reproduïble:**

```bash
grep -n "ESTAT_ACTUAL" .agents/ESTAT.md
#   9: ## ESTAT_ACTUAL · 260923_1303 · Codex · Auditoria Sollutia i Notes (AFK)
#  18: ## ESTAT_ACTUAL · 260923_0016 · Claude Opus 5 · Auditoria de l'al·lucinació visual
# 437: <!-- SDP:ESTAT_ACTUAL -->
# 445: <!-- /SDP:ESTAT_ACTUAL -->
```

Hi ha **tres** marcadors amb el mateix nom i dos convencions incompatibles:

- **Dalt del fitxer, capçaleres Markdown `## ESTAT_ACTUAL · …`.** Ací sí que s'escriu, i al dia: Codex n'ha posada una fa deu minuts (13:03) i jo mateix una altra a les 00:16. El fitxer creix pel principi.
- **A baix, el bloc delimitat `<!-- SDP:ESTAT_ACTUAL -->` (línies 437-445).** És **l'únic** que `despertar.mjs:33` extrau amb la seua expressió regular, i per tant l'únic que arriba al context de cap agent. Encara conté el text de les 22:25 del 260922 i ordena «Següent acció: … Claude aporta la seua revisió», tasca superada dos vegades des d'aleshores.

**Diagnòstic, i és diferent del que semblava:** ningú és negligent. Els agents **sí que escriuen** l'estat, i el mateix dia. El que passa és que **el canal on s'escriu i el canal que es llig són dos llocs distints del mateix fitxer**, i res no els connecta. La convenció humana (créixer pel principi) i la convenció màquina (un bloc fix al final) conviuen sense saber l'una de l'altra.

Comptabilitat de la memòria de mitjà termini:
- **9 línies** injectades, **14 hores obsoletes**;
- **453 línies** d'ESTAT, incloent-hi les dos entrades fresques d'avui, que no s'injecten mai;
- **55 KB** de LEDGER que tampoc s'injecten en cap moment.

`tancament.mjs` sí que exigix el relleu a l'ESTAT via `checkTurn` —i ho detecta: «`.agents/ESTAT.md`: falta el relleu d'aquest torn»—, però viu darrere de T1 i `--close` necessita un `--turn-id` que la majoria de torns no passen.

**Proposta conservadora, en dos línies i sense migrar res:**
1. Que `despertar.mjs` prenga la **primera** capçalera `## ESTAT_ACTUAL · …` del fitxer quan n'hi haja, i el bloc delimitat només com a reserva. És on la gent ja escriu.
2. Que falle sorollosament (eixida ≠ 0, missatge visible) si la data d'eixa capçalera és anterior al fitxer més recent de `04_escriptori/` o `10_actes/`. Un estat ranci ha de ser un error, no un paràgraf tranquil.

---

### T8 · Es va buidar la carpeta que la constitució prohibix buidar · MITJANA-ALTA

**Fitxers:** `_wiki_de_poble/04_escriptori/02_investigacio_ia/`, `00_index_escriptori.md`

**Evidència reproduïble:**

```bash
ls _wiki_de_poble/04_escriptori/02_investigacio_ia/   # 1 fitxer
find _wiki_de_poble/90_arxiu_historic/260922_jornada_nit -type f | wc -l   # 10
```

`00_index_escriptori.md` encara llista una vintena de documents sota l'epígraf `02_investigacio_ia`; `find` els localitza a `90_arxiu_historic/260922_jornada_nit/` i a `90_arxiu_historic/`.

AGENTS §12 és taxatiu: `02_investigacio_ia` «no s'ha de buidar ni esborrar mai en processos de neteja automàtica. Actua com un laboratori permanent». La neteja va caure justament damunt de la carpeta protegida, i l'índex no es va tocar.

**Proposta conservadora:** no toque res. Restituir els documents al laboratori o corregir l'índex i deixar-los arxivats són dos decisions diferents, i totes dos són del Mestre.

`requires_human_decision: true`.

---

### T9 · La Porta d'Orfandat menteix, i per això s'ignora · MITJANA

**Fitxer:** `tooling/gates/tractor-orfandat.mjs`

**Evidència reproduïble:**

```bash
node tooling/gates/tractor-orfandat.mjs
# → 💥 ATURADA CRÍTICA: 41 enllaços trencats i 3 orfes
```

N'he comprovat cinc. **Els cinc destins existixen:**

| Enllaç declarat trencat | Estat real |
| --- | --- |
| `.agents/BOOTSTRAP.md` | EXISTEIX |
| `.agents/rules/00_BIOS_COGNITIU.md` | EXISTEIX |
| `.agents/BASELINE.md` | EXISTEIX |
| `.agents/skills/sdp-workflow/SKILL.md` | EXISTEIX |
| `../10_actes/260922_2200_acta_marmota` | EXISTEIX |

Són els quatre enllaços del §13 d'`AGENTS.md` —els que la pròpia doctrina obliga a posar per evitar l'orfandat— i una àncora relativa de l'índex d'escriptori. El tractor no resol rutes relatives ni `../`.

Pitjor: del mateix `260922_2200_acta_marmota.md` afirma **dos coses contradictòries alhora** —que és un destí inexistent i que és un orfe sense enllaços entrants— mentre `00_index_escriptori.md` l'enllaça.

**Efecte conductual, que és el que importa ací:** una porta amb fals positius coneguts ensenya que les portes menten. Entrena la desobediència millor que no tindre porta. Els 16 enllaços trencats reals de `00_index_escriptori.md` (T8) queden sepultats sota el soroll.

**Font de veritat en conflicte:** `auditoria_canonica.md` §Graf ja ordena distingir «enllaç no resolt, destí ambigu, buit físic, mirror, vendor i arxiu». El tractor no ho fa.

**Proposta conservadora:** resoldre `../` i les rutes des de l'arrel abans de declarar ruptura, i separar la classe `NO_RESOLT_PEL_RESOLUTOR` de `ABSENT_AL_DISC`.

---

### T10 · Tota la maquinària de leases està parada des del 25 d'agost · MITJANA

**Fitxers:** `.sdp-reflex/`, `tooling/wiki/reflex_petorreta.mjs:802-832`

**Evidència reproduïble:**

```bash
ls -la .sdp-reflex/receipts .sdp-reflex/ledger   # buits, mtime 25 ago 00:19
ls -lt .sdp-reflex/sessions | head              # 18 fitxers, tots mtime 22 set 03:28
```

Directoris buits des de l'agost. Les 18 sessions tenen una marca de temps idèntica: és una restauració, no ús.

**I no poden usar-se.** `validatePetorreta()` exigix el nom `^(\d{6}_\d{4})_PROMPT_(.+)\.md$` —**`PROMPT` en majúscules**— amb un títol de 8 a 12 paraules, seccions `context`, `tasques`, `riscos` i `criteris d'acceptació`, i 800 caràcters editorials mínim. AGENTS §2 obliga a minúscules. **Cap petorreta constitucionalment ben anomenada pot passar mai el `seal`.**

La petorreta d'avui fallaria per quatre motius alhora: minúscules, dos paraules de títol en compte de 8-12, secció `Tasca` en compte de `Tasques`, i cap secció `Riscos`.

La `Porta Reflex` de la cadena executa `doctor --ci`, que és una autoexploració de la integritat del propi Reflex, **no** una validació de les petorretes de l'escriptori. Ara mateix ix 1: baseline divergent i 40 fitxers del corpus estable sense versionar.

**Proposta conservadora:** decidir si la maquinària viu o mor. Si viu: alinear `validatePetorreta` amb AGENTS §2 (minúscules) i posar les quatre seccions obligatòries **a les plantilles**, perquè s'hereten soles. Si mor: dir-ho a `AGENTS.md` i deixar de hashejar un cadàver de 1.592 línies.

`requires_human_decision: true`.

---

### T11 · Els documents d'avui existixen sense rebut, i el hook sí que funciona · MITJANA

**Fitxers:** `.claude/settings.json`, `.agents/hooks.json`, `tooling/gates/porta-reflex.mjs`

**Evidència reproduïble:**

```bash
node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/260923_1245_prompt_auditoria_claude.md
# → {"valid": false, "errors": ["reflex: cal un rebut persistent emés per document.mjs context"]}   exit 1
```

Igual per al Pla i per la petorreta de Codex. I el hook **no està trencat**; l'he simulat amb un payload del dialecte Claude:

```
[PORTA-REFLEX] BLOQUEIG
reflex: cal un rebut persistent emés per document.mjs context
→ exit 2
```

Hauria aturat l'escriptura. Per tant els tres fitxers van arribar al disc per una via que el `matcher` no cobrix: `.claude/settings.json` només vigila `Write|Edit|NotebookEdit` i `.agents/hooks.json` només `write_to_file|replace_file_content|multi_replace_file_content`. **Una redirecció de shell escriu sense passar per cap porta.**

**Proposta conservadora:** afegir l'eina de shell al `matcher`, o una escombrada al `pre-commit` que rebutge qualsevol `.md` sota `_wiki_de_poble/` sense rebut. El `pre-commit` ja ho faria —si arribara més enllà de la porta 4 (T1).

---

### T12 · El vocabulari tancat existix i no arriba a executar-se · MITJANA

**Evidència reproduïble:**

```bash
node tooling/wiki/tractor-frontmatter.mjs | grep -A3 "F4 · VOCABULARI"
# ❌ F4 · VOCABULARI — tag fora del vocabulari tancat — 7 màx 2
#    260923_1235_auditoria_tractors_visuals.md  → #al·lucinacio
#    260923_1245_pla_implementacio_auditoria.md → #olivera
```

Ni `al·lucinacio` ni `olivera` estan als 40 termes de `schema.json`. La porta els caça perfectament. És la porta **43** d'una cadena que mor a la **4**. No és un problema de disseny: és T1 una altra vegada, vist des d'un altre teixit.

---

### T13 · Watcher: el Brain no arriba al frontend en calent · ENCÀRREC DEL MESTRE

**Fitxers:** `tooling/wiki/compile-wiki-to-app.mjs`, `src/data/wikiManifest.js`, `vite.config.js`, `package.json`

**Diagnòstic mesurat:**

| Canal | Eixida | Es refresca en dev? |
| --- | --- | --- |
| `compile-wiki-to-app.mjs` | `src/data/wikiManifest.js` (257 KB) | **No.** Només a `prebuild`. |
| `core/build_rag_index.mjs` | `public/rag-index.json` | No es regenera, però `public/` **sí que se servix del disc**. |
| `core/build_slug_index.mjs` | `public/slugIndex.json` | Igual. |

`package.json`: `dev` és `vite --host 0.0.0.0 --port 3340 --strictPort`, sec. El compilador només viu a `prebuild`. Per tant, en desenvolupament, `wikiManifest.js` és un artefacte congelat: editar un Markdown de la Wiki no té **cap** efecte fins que es fa un build. Els consumidors són `src/sections/wiki-de-poble/WikiDePobleSection.jsx` i `src/components/universal/graph/BrainGraph.jsx`.

**Dos obstacles concrets abans d'escriure res:**

1. `compile-wiki-to-app.mjs` **no exporta cap funció**. És un script que treballa en el cos del mòdul i acaba amb `fs.writeFileSync(OUT_FILE, …)` a la línia 216, amb la configuració llegida de `process.argv` (`:158`, `:191`). Un plugin de Vite no el pot importar sense provocar l'escriptura. Cal, o bé extraure `export function compila({ root, check })`, o bé engegar-lo com a procés fill. **Recomane extraure la funció**: el procés fill costa ~300 ms per pulsació de tecla.
2. L'àmbit s'ha d'heretar, mai ampliar. `walk()` (`:20-41`) només entra a `01_ser`, `02_saber` i `03_actuar` (`PUBLIC_WIKI_DIRS`), i de `90_arxiu_historic` en pren **només noms, mai contingut** (`noms()`, `:43`). Un watcher que vigile `_wiki_de_poble/**` sencer filtraria l'arxiu històric i l'escriptori cap a l'aplicació i violaria AGENTS §5. **El watcher ha de vigilar exactament les tres carpetes públiques, ni una més.**

**Disseny proposat — `tooling/vite/wiki-watcher.mjs`:**

```js
// Plugin de dev. No s'activa mai en build: el build ja té `prebuild`.
import path from 'node:path';
import { compila } from '../wiki/compile-wiki-to-app.mjs'; // ← cal extraure-la (obstacle 1)

const PUBLIQUES = ['01_ser', '02_saber', '03_actuar'];
const MANIFEST = 'src/data/wikiManifest.js';

export default function wikiWatcher({ arrel = process.cwd(), retard = 120 } = {}) {
  let temporitzador = null;
  return {
    name: 'sdp-wiki-watcher',
    apply: 'serve',                    // mai en build
    configureServer(server) {
      const dins = (f) => {
        const rel = path.relative(arrel, f).split(path.sep).join('/');
        return rel.startsWith('_wiki_de_poble/')
          && PUBLIQUES.some(d => rel.startsWith(`_wiki_de_poble/${d}/`))
          && (rel.endsWith('.md') || rel.endsWith('.json'));
      };

      const recompila = () => {
        clearTimeout(temporitzador);
        temporitzador = setTimeout(async () => {
          try {
            // compila() ha d'escriure NOMÉS si el contingut canvia:
            // un writeFileSync incondicional toca l'mtime i encadena
            // recàrregues buides.
            const canviat = await compila({ root: arrel });
            if (!canviat) return;
            const mod = server.moduleGraph.getModuleById(path.join(arrel, MANIFEST));
            if (mod) server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload', path: '*' });
            server.config.logger.info('[wiki] manifest recompilat');
          } catch (e) {
            // Frontmatter trencat no pot tombar el servidor: overlay i avant.
            server.ws.send({ type: 'error', err: { message: `[wiki] ${e.message}`, stack: '' } });
          }
        }, retard);
      };

      for (const d of PUBLIQUES) server.watcher.add(path.join(arrel, '_wiki_de_poble', d));
      server.watcher.on('add', f => dins(f) && recompila());
      server.watcher.on('change', f => dins(f) && recompila());
      server.watcher.on('unlink', f => dins(f) && recompila());
    }
  };
}
```

I a `vite.config.js`, dins de `plugins`, després de `consolaIaia()`:

```js
import wikiWatcher from './tooling/vite/wiki-watcher.mjs';
// …
plugins: [react(), consolaIaia(), wikiWatcher(), { name: 'sdp-port-canonic', … }]
```

**Set decisions de disseny, i per què:**

1. **`apply: 'serve'`.** El build ja té `prebuild`. Un plugin que recompile durant el build duplicaria faena i podria competir amb `prebuild`.
2. **Escriptura condicional.** `compila()` ha de comparar el contingut generat amb el del disc i tornar `false` si són idèntics. Sense això, cada desat innocu torna a tocar `wikiManifest.js`, Vite el reinvalida i el navegador parpelleja sense motiu. És la diferència entre un watcher i un bucle.
3. **`full-reload`, no HMR fi.** `wikiManifest.js` és un `export const` de 257 KB consumit per dos components. Un HMR granular exigiria convertir-lo en un store reactiu; això és el projecte de T14, no el d'ara. Per a dev, la recàrrega completa costa menys que la complexitat.
4. **Retard de 120 ms.** Guardar des d'Obsidian dispara diversos esdeveniments (fitxer temporal + renom). Sense `debounce` es recompilen 257 KB tres vegades per desat.
5. **Àmbit idèntic al compilador.** No es vigila `04_escriptori` ni `90_arxiu_historic`. Este document que estàs llegint **no ha d'aparéixer** a l'aplicació.
6. **Els errors no maten el servidor.** Un frontmatter a mig escriure és l'estat normal mentre s'escriu. Overlay i continuar.
7. **`rag-index.json` i `slugIndex.json` queden fora, a propòsit.** Viuen a `public/`, que Vite servix del disc: es refresquen amb un `F5` en quant es regeneren. Si el Mestre vol que el graf i la cerca també siguen instantanis, la crida a `build_rag_index` i `build_slug_index` va al mateix `recompila()` —però són bastant més cares i convé mesurar-ho abans. Ho deixe declarat i no ho afegisc.

**Verificació proposada:** engegar `npm run dev`, editar una capçalera de `_wiki_de_poble/01_ser/01_identitat.md`, i comprovar a `http://localhost:3340` que el canvi es veu sense build; després editar `_wiki_de_poble/04_escriptori/` i comprovar que **no** passa res.

---

### T14 · Editabilitat: no hi ha on escriure, i topa de front amb el Watcher · ENCÀRREC DEL MESTRE

**Fitxers:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx`, `src/data/wikiManifest.js`, `src/components/universal/UniversalEditorShell.jsx`, `src/data/backendPort.js`

**Diagnòstic:** `WikiDePobleSection.jsx` importa `wikiManifest` i el renderitza amb `sanitizeHtml` dins d'una `UniversalPage`. **No hi ha editor, ni `onSaveField`, ni port de persistència.** No és que l'edició estiga desactivada: és que no hi ha cap lloc on escriure. `wikiManifest` és una constant d'un mòdul ES empaquetat al bundle. El mateix val per a `DesignSection.jsx`.

La maquinària d'edició ja existix i funciona a Notes: `UniversalEditorShell` exposa `onSaveField(field, value, id)` (`:52-57`, `:138`), i `NotesContext` la connecta a `NotesDataContext` → `backendPort` (`promoteToPublic`, `teCapacitat`). Eixe és el camí. Falta endollar-hi la Wiki.

**La tensió que cal nomenar abans de tocar res:**

El Watcher empeny **disc → aplicació**. L'editabilitat empeny **aplicació → magatzem**. Són el mateix contingut viatjant en direccions oposades. Si les dos coses s'implementen sense decidir qui mana, **la primera recompilació del watcher s'emporta l'edició de l'usuari**, i serà un error intermitent, difícil de reproduir i fàcil d'atribuir a qualsevol altra cosa.

No ho puc decidir jo. Les tres eixides coherents:

| Model | Font de veritat | Què fa el Watcher | Cost |
| --- | --- | --- | --- |
| **A · Disseminació** | El disc en dev, el magatzem en producció | Només viu en dev; producció mai importa | Barat. L'usuari no pot editar la Wiki en dev, i en producció les seues edicions no tornen mai al repositori. |
| **B · Llavor** | El magatzem, sempre | Importació explícita i manual (`npm run wiki:sembra`), mai automàtica | L'edició de l'usuari és sagrada. El Mestre perd el flux «edite el `.md` i ho veig». |
| **C · Dos espais** | Els `.md` són «Documentació» (només lectura); la Wiki editable és un espai nou del magatzem | Watcher sobre l'espai de lectura, editor sobre l'altre | El més net i el més car: dos seccions, dos models. |

**La meua recomanació, i el meu raonament:** **C**, amb **A** com a pas intermedi immediat.

El Watcher de T13 és barat, no toca dades i resol hui una fricció real del Mestre. L'editabilitat és una migració de model de dades que travessa `backendPort` (i, per tant, l'enxufabilitat de Sollutia i el `tenant_id`, que és justament el que Codex acaba de trobar trencat a Notes a les 13:03). Fer-les alhora és lligar una millora de 80 línies a una migració que encara no té el port sanejat.

**Proposta conservadora, per fases:**

1. **Ara:** Watcher de T13, model A, només dev. Zero risc de pèrdua de dades perquè encara no hi ha dades d'usuari a la Wiki.
2. **Quan Codex haja sanejat el contracte de Notes** (les seues fases 1-3): afegir un `wikiPort` germà de `notesPort` sobre `backendPort`, amb les mateixes garanties de `tenant_id` i revisió que ell demana. Sense el contracte reparat, endollar-hi la Wiki propaga el mateix bug a una superfície nova.
3. **Després:** `WikiDePobleSection` passa a llegir del port amb `wikiManifest` com a *fallback* de només lectura, i munta `UniversalEditorShell` amb `onSaveField`. L'editor TipTap ja hi és; el que falta és a on desar.
4. **En eixe moment, i no abans,** el Watcher queda restringit a l'espai de documentació (model C) i deixa de poder tocar res que un usuari haja escrit.

`requires_human_decision: true` per a triar entre A, B i C. Qualsevol de les tres és defensable; el que no és defensable és implementar-les totes dos sense triar.

---

## Verificació

Ordres executades per a esta auditoria. Totes són de lectura; cap modifica l'arbre.

```bash
npm run porta                                            # exit 1 — mor a la porta 4/49 (T1)
node tooling/wiki/reflex_petorreta.mjs doctor --ci        # exit 1 — baseline divergent (T10)
node tooling/gates/verificador-scc.mjs .                  # exit 1 — ORPHAN_OPERATIVE acta 00:35
node tooling/gates/tractor-orfandat.mjs                   # exit 1 — 41 trencats, 3 orfes (T9)
node tooling/wiki/tractor-frontmatter.mjs                 # F4: 7 tags fora del vocabulari (T12)
node tooling/wiki/document.mjs check --file <els 3 documents d'avui>   # valid:false, sense rebut (T11)
grep -rn "persona_router" --include='*.mjs' tooling/ src/  # 1 coincidència: el seu propi comentari (T4)
node tooling/gates/tancament.mjs --check --turn-id torn_e892aa9d-…   # exit 1
```

**Aquest document sí que valida:** `document.mjs check --file 260923_1310_auditoria_claude.md` → `{"valid": true, "errors": []}`, exit 0. És l'únic dels quatre documents de l'escriptori d'avui que en té, i l'única diferència de procediment és haver demanat el rebut abans d'escriure.

**El `tancament --check` del meu torn ix 1** i llista amb precisió per què cap torn pot arribar a `closed` hui, ni el meu:

| Comprovació | Estat | Causa |
| --- | --- | --- |
| `plantilles` | 0 | — |
| `autoritat` | 0 | — |
| `skills` | 0 | — |
| `ledger` | 1 | `LEDGER.md` no conté cap signatura |
| `segell` | 1 | Ruptura de segell (T1) |
| `wiki` | 1 | 46 enllaços trencats a `00_index`, plantilles i `memoria_aprenentatges` |
| `scc` | 1 | `260923_0035_acta_marmota.md` orfe |

Més els requisits propis del torn. **Dels propis n'he complit els dos que em pertoquen:** relleu escrit a `.agents/ESTAT.md` (com a capçalera `## ESTAT_ACTUAL · 260923_1310`, seguint la convenció que el fitxer usa de veres, T7) i al `.agents/LEDGER.md`, que deixe **expressament sense signar** pel mateix criteri dels torns de les 22:46 i les 00:16. Queda «pla no vinculat»: la ruta `auditoria` no en genera cap, i el Pla de MarIA no té rebut, per tant `document.mjs plan` no el pot acceptar. És un buit del cicle, no una omissió.

**Cap de les set causes de la taula és atribuïble a este torn**; totes precedixen la seua obertura. Les deixe mesurades i no reparades: tocar-les entra en fitxers d'altres torns i la `Frontera d'efectes` de la plantilla d'auditoria ho prohibix sense ordre. En particular no toque `00_index_escriptori.md` més enllà d'ancorar-hi este document, ni l'acta orfe de les 00:35.

Comprovacions puntuals: marques de temps de `SKILLS_SEAL.json` contra les dos `SKILL.md` modificades (T1); existència física dels cinc destins que la Porta d'Orfandat declara trencats (T9); enum de `schema.json` contra els tags de l'escriptori (T12); simulació del payload del hook `PreToolUse` contra `porta-reflex.mjs`, que ix 2 i bloqueja (T11); i `suggeriment()` sobre els quatre noms reals de l'escriptori (T2).

**Cap porta declarada verda.** Quatre en roig comprovat; 45 sense notícies, que no és el mateix que aprovades.

## Límits

- **No he executat la cadena més enllà de la porta 4.** L'estat de les portes 5 a 49 és **desconegut**, no verd. Qualsevol afirmació de salut global seria inventada.
- **No he pogut observar el carregador d'Antigravity des de dins.** El que afirme sobre què té MarIA al context (T4) és inferència a partir d'`AGENTS.md` §1, de l'absència de qualsevol fitxer de configuració d'Antigravity al repositori, i dels zero cridadors de `persona_router.mjs`. No és una observació directa d'un prompt.
- **He comprovat 5 dels 41 enllaços trencats** de T9, no els 41. Els cinc són falsos positius; la taxa real no la sé.
- **T6 està mesurat en aquesta sessió**, no en una mostra. `despertar.mjs` no té cap guarda d'ordre, però no puc demostrar que passe el 100% de les vegades.
- **T13 i T14 són disseny, no implementació.** El codi del plugin és una proposta i no s'ha executat: `compila()` encara no existix com a funció exportada. Mode AFK respectat, cap línia de `src/` ni de `tooling/` modificada.
- **Audite una conducta que compartisc.** Els mateixos priors, el mateix biaix. La manera de comprovar-ho no és creure-se-m'ho: és executar les set ordres de la taula de Verificació.

### Reunió a l'Olivera

**Sobre el Pla de MarIA (`260923_1245_pla_implementacio_auditoria`).** El diagnòstic del §1 —«els mecanismes de protecció no s'estan activant»— és correcte i li falta la mesura: no s'activen perquè la cadena mor a la porta 4 des de les 00:30 d'aquesta matinada, i el que la mata és, literalment, haver escrit una lliçó a una skill (T1). Dos esmenes concretes al Pla:

1. **El Pla no seguix la seua pròpia plantilla** (T3, segona mesura). Li falten Registre, Acte reflex, Historial, Canvis proposats, Verificació i Riscos. Demane que es regenere amb `document.mjs context --route pla.implementacio`: és la demostració més barata possible que l'Efecte Matrix funciona quan es crida.
2. **El `tag` `olivera` no existix** al vocabulari tancat de `schema.json` (T12). `tractor-frontmatter` ja el caça; simplement no arriba a córrer.

**Sobre el nom del Pla.** La lliçó del 260922 exigix que el Pla compartisca el cognom exacte de la petorreta que l'origina. Hui hi ha **dos** petorretes (`…_auditoria_claude` i `…_auditoria_codex`) i **un** Pla. La lliçó és insatisfactible tal com està escrita. **El nom del Pla és correcte i la lliçó és el que cal esmenar**: quan una reunió té diversos destinataris, el cognom és el de la sessió i el porten els tres fitxers. No hi veig cap defecte a corregir al Pla.

**Sobre l'auditoria de Codex (`260923_1303_auditoria_codex`).** Arriba primer i va per un altre eix —el contracte de Notes, `tenant_id`, idempotència de publicació—, i el seu dictamen de no donar llum verda al flux de Notes em sembla ben fonamentat. **Enllaça directament amb el meu T14:** l'editabilitat de la Wiki s'ha de construir damunt del mateix port que ell acaba de declarar trencat. Si s'endolla la Wiki abans de reparar el contracte, es propaga el mateix defecte a una superfície nova i amb més contingut. Per això la fase 2 de la meua proposta espera explícitament les seues fases 1-3. No és cortesia: és ordre de dependència.

**Sobre `prompt_local.md`** (millora demanada al §4 del prompt). Sis esmenes, per ordre de valor:

1. **§0 «Abans de generar (per a l'autor)»** amb les tres caselles de T3. És l'esmena que resol la incidència que el Mestre denuncia.
2. **`| Ruta |` i `| Rebut |`** a la taula de Registre. Fa visible a simple vista la desviació de T2.
3. **Camp «Tall d'evidència»** (HEAD de git + hora), ja demanat a les 22:46 del 260922 segons el LEDGER i encara absent. Sense tall, dos auditories concurrents citen arbres diferents i sembla que es contradiuen.
4. **Reanomenar `Tasca` → `Tasques` i afegir `Riscos`**, perquè una petorreta generada puga passar `validatePetorreta` si es reviu la maquinària de leases (T10).
5. **`requires_human_decision` com a camp del Registre**, no com a literal enganxat dins dels criteris d'acceptació.
6. **Regla de cognom per a reunions amb diversos destinataris** (vegeu més amunt).

**Una observació que no és una troballa.** El Mestre pregunta per què els agents actuen com a «Stochastic Parrots». Pel que he pogut mesurar, el problema no és que els agents ignoren la doctrina: és que la complixen **amb massa fidelitat, i al document equivocat**. La petorreta d'avui reproduïx `prompt_local.md` quasi paraula per paraula. El Pla no reproduïx `pla_implementacio.md` perquè ningú l'ha obert. Un lloro que repetix no és el problema; el problema és **quin paper li poses davant**. Tota esta auditoria cap en eixa frase, i T1 explica per què les portes que ho haurien d'haver detectat fa hores que no diuen res.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1245_prompt_auditoria_claude]]
- [[260923_1245_pla_implementacio_auditoria]]
- [[260923_1303_auditoria_codex]]
- [[260923_1235_auditoria_tractors_visuals]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
