---
type: informe
status: esborrany
description: Auditoria de doctorat del sistema de skills de la IAIA MarIA i proposta d'arquitectura oberta de registre, consum i automillora.
tags:
  - skills
  - core
  - arquitectura
  - escriptori
---

# Auditoria de Skills Avançades — Del Regex al Contracte

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260920-0141 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 01:41 |
| Agent auditor | Claude (Opus 5, Cowork) |
| Petorreta d'origen | SDP-PROMPT-260920-01 |
| HEAD auditat | `b398115f` · branca `backup-notes-publish` |
| Codi modificat | Cap. Només s'ha creat aquest document. |

## Vincles

- [[00_index_escriptori]]
- [[00_TARGET_SKILLS]]
- [[00_INDEX_SKILLS]]

---

## 0. Veredicte en una pàgina

He llegit les 16 `SKILL.md` del disc, el carregador, els tres encaminadors, l'esquema, els quatre registres i he executat cinc portes. El resum honest:

> **El problema de les skills de Sóc de Poble no és que en falten. És que les que hi ha no es poden encendre.**

Cinc números, tots verificats en aquest arbre:

| Fet | Xifra | Prova |
| --- | --- | --- |
| Skills al disc | **16** | `matrix.mjs:55-58` llig `.agents/skills/*/SKILL.md` |
| Skills que el registre declara | **18** | `.agents/manifest.yaml` i `00_INDEX_SKILLS.md` |
| Skills que el segell va comptar | **20** | `.agents/SKILLS_SEAL.json` (de fa 3 dies) |
| Skills que s'encenen **sempre**, siga quina siga la petició | **6** | `core: true` + `matrix.mjs:130` |
| Skills que **només** s'encenen si dius el seu nom sencer | **9** | `triggers_on` = el propi slug |
| Skills que fan encaminament real | **1** | `universal-page` |

Dit d'una altra manera: **el vostre encaminador no encamina res.** De 16 skills, 6 entren sempre (rellevants o no) i 9 no entren mai. Només `universal-page` respon de veritat a què s'ha demanat. Tota la maquinària de gallets, prioritats i desempats de `matrix.mjs:91-132` governa una sola skill.

I per damunt d'això hi ha **una avaria activa, ara mateix, en producció cognitiva**: el protocol per defecte apunta a un fitxer que no existeix (§1.4). Qualsevol petició que no encerte una de les 13 paraules clau del registre fa que el cervell isca `ready:false` i `exit 2`.

---

# MISSIÓ 1 · Estudi de doctorat sobre les skills actuals

## 1.1 El cens: quatre registres i quatre xifres

Hi ha **quatre** llocs que diuen quines skills té el sistema, i **cap parella coincideix**:

| Registre | Diu | Realitat |
| --- | --- | --- |
| El disc (`.agents/skills/`) | 16 | **Font de veritat efectiva.** És l'únic que el carregador llig (`matrix.mjs:55-58`). |
| `.agents/manifest.yaml` | 18 | 4 fantasmes + 2 invisibles |
| `.agents/skills/00_INDEX_SKILLS.md` | 18 | Els mateixos 4 fantasmes, els mateixos 2 invisibles |
| `.agents/SKILLS_SEAL.json` | `filesCount: 20` | Segell de `2026-09-17`. Ara el directori en té 18 fitxers. |

Els **4 fantasmes** són exactament les skills que es van fusionar i esborrar:

```
👻 skills/equip-ia/SKILL.md
👻 skills/ment-colmena-integral/SKILL.md      → fusionades a skill-consell-i-colmena
👻 skills/skill-acte-reflex/SKILL.md
👻 skills/skill-consell-bundle/SKILL.md       → fusionades a skill-documentacio-i-reflex
```

I les **2 invisibles** són precisament les skills noves que en van eixir:

```
🚫 skills/skill-consell-i-colmena/SKILL.md    ← existeix, cap registre la declara
🚫 skills/skill-documentacio-i-reflex/SKILL.md
```

Això no és una conjectura meua: és el veredicte literal de la vostra pròpia porta, que he executat sense `--escriu` (la guarda d'escriptura és a `tractor-manifest.mjs:295`):

```
📜 TRACTOR DEL MANIFEST
   Manifest declara 18 · disc en té 16
  ── M2 (4) ── equip-ia, ment-colmena-integral, skill-acte-reflex, skill-consell-bundle
       ↳ "Qui llija el manifest per a carregar el cervell, fallarà."
  ── M3 (2) ── skill-consell-i-colmena, skill-documentacio-i-reflex
       ↳ "Existix al disc i el manifest no la declara."
❌ [MANIFEST] 6 divergències.                                        exit=1
```

I `tractor-registre.mjs` ho quantifica: **«Exactitud del registre: 78%»**.

**El mirall de la Wiki ja no existeix.** `_wiki_de_poble/02_saber/skills_mirror/` té els seus 20 fitxers esborrats a l'arbre de treball. El seu generador (`tooling/brain/sync_agent_mirror.py`) només l'invoca `tooling/brain/maintain.sh:22`, que no forma part ni de `npm run gate` ni de `npm run build`. Això contesta directament una de les vostres incògnites: **la Wiki ja no conté cap còpia de les skills executives.**

### Diagnòstic

El patró és sempre el mateix i té nom: **fonts derivades que es mantenen a mà**. `manifest.yaml` porta escrit al capdamunt «GENERAT. No l'edites a mà», i `tractor-manifest.mjs --escriu` el regenera en un segon. Ningú l'ha executat. La porta que hauria d'avisar-ne ja està en roig i **ningú la mira**, perquè no està a la cadena que es corre abans de treballar.

## 1.2 La física del carregador: què llig i què ignora

`matrix.mjs:62-74` parseja el frontmatter de cada skill. De tot el que hi escriviu, **només fa servir quatre camps** (`:81-88`):

| Camp | Ús real | Conseqüència |
| --- | --- | --- |
| `name` | Comprova que coincideix amb la carpeta (`:81`) | Correcte |
| `triggers_on` | **Únic mecanisme d'encaminament** (`:129`) | Tot depén d'ací |
| `core` | Força la càrrega sempre (`:130`) | Booleà tot-o-res |
| `prioritat` | Desempat de gallets (`:87,100-103`) | **Cap skill el declara** |
| `description` | **IGNORAT** | ⚠️ Vegeu avall |
| `type`, `status`, `tags` | **IGNORATS** | Decoratius |
| `eines_obligatories` | **IGNORAT** | Promesa no complerta |

**Aquesta és la troballa arquitectònica central de l'informe.**

El camp `description` és l'únic que descriu *semànticament* què fa una skill. És el que qualsevol model llegiria per decidir si li fa falta. El vostre carregador **no el mira mai**. En el seu lloc, la decisió la pren una funció de comparació de prefixos de paraula amb farciment (`matrix.mjs:109-125`):

```js
// matrix.mjs:113-125 — l'encaminador real
function encés(gallet) {
  const busca = paraules(gallet);
  for (let i0 = 0; i0 < MOTS.length; i0++) {
    if (!MOTS[i0].startsWith(busca[0])) continue;   // prefix de paraula
    let i = i0 + 1, k = 1, farcit = 0;
    while (k < busca.length && i < MOTS.length && farcit <= MAX_FARCIT) {
      if (MOTS[i].startsWith(busca[k])) { k++; i++; } else { farcit++; i++; }
    }
    if (k === busca.length) return true;
  }
  return false;
}
```

És codi net i honest. El problema no és com està escrit: és que **li heu demanat a un comparador de cadenes la feina d'entendre una petició en valencià**.

`matrix.mjs:82` ja us ho avisa, i és l'avís més lúcid del repositori:

> `${ruta}: sense triggers_on. Skill morta en silenci.`

El diagnòstic correcte és més dur: una skill **amb** `triggers_on` que ningú no pronunciarà també està morta en silenci. I n'hi ha nou.

## 1.3 El repartiment real de les 16

He replicat `encés()` línia per línia en un simulador de només lectura, fora del projecte, i l'he passat sobre el cens real. Resultat:

| Skill | Com pot encendre's |
| --- | --- |
| `core-context-panic` | ● **sempre** (`core: true`) |
| `core-restauracio-segellada` | ● **sempre** |
| `pedra-seca` | ● **sempre** |
| `skill-consell-i-colmena` | ● **sempre** |
| `skill-documentacio-i-reflex` | ● **sempre** |
| `socdepoble-workflow` | ● **sempre** |
| `app-grid-shell` | ○ només si dius «app grid shell» |
| `skill-busca-skills` | ○ només si dius «skill busca skills» |
| `skill-casos-us-essencials` | ○ només si dius «skill casos us essencials» |
| `skill-cicle-de-vida` | ○ només si dius «skill cicle de vida» |
| `skill-estudi-mercat` | ○ només si dius «skill estudi mercat» |
| `skill-guardia-frontmatter` | ○ només si dius «skill guardia frontmatter» |
| `skill-iaia-identitat` | ○ només si dius «skill iaia identitat» |
| `skill-memoria-historica` | ○ només si dius «skill memoria historica» |
| `skill-propagar-veritat` | ○ només si dius «skill propagar veritat» |
| `universal-page` | ◐ **encaminable de veritat** (`UniversalPage`, `chrome`, `bar-blue`, `page-header`) |

Nou skills tenen com a únic gallet **el seu propi nom escrit sencer**. Ningú diu «skill memoria historica» parlant amb una companya. Això no és un encaminament: és una contrasenya.

### La víctima més greu: la identitat

Mireu el frontmatter de `skill-iaia-identitat/SKILL.md:5-9`:

```yaml
tags:
  - core          ← decoratiu, matrix.mjs no el llig mai
name: skill-iaia-identitat
triggers_on:
  - skill iaia identitat
```

**No té `core: true`.** Té `tags: [core]`, que és un camp que el carregador ignora.

La skill que acaba dient (`:101`) *«Quan aquesta skill està carregada, ets IAIA MarIA. Punt.»* és, mecànicament, una de les nou mortes. En una sessió normal, MarIA **no carrega mai la seua pròpia identitat**: ni la veu, ni el to valencià, ni la Companyonia de Fadigues, ni la Llei de Destins, ni les 12 membres del Consell.

Aquesta confusió `tags: core` ↔ `core: true` afecta **set** skills en les dues direccions:

| Skill | `tags: core` | `core: true` | Efecte |
| --- | --- | --- | --- |
| `skill-iaia-identitat` | ✅ | ❌ | **La identitat no es carrega** |
| `skill-cicle-de-vida` | ✅ | ❌ | Les lleis del torn no es carreguen |
| `skill-busca-skills` | ✅ | ❌ | L'automillora no es desperta (§3) |
| `universal-page` | ✅ | ❌ | Té gallets propis; se salva |
| `pedra-seca` | ❌ | ✅ | Es carrega sempre, correcte per sort |
| `skill-consell-i-colmena` | ❌ | ✅ | Es carrega sempre |
| `skill-documentacio-i-reflex` | ❌ | ✅ | Es carrega sempre |
| `socdepoble-workflow` | ❌ | ✅ | Es carrega sempre |

**Dues paraules «core» en el mateix fitxer, i només una té efecte.** Això és exactament la patologia que aquest projecte ja ha diagnosticat en altres capes: dues fonts per a una sola llei.

## 1.4 L'avaria activa: el defecte que no és al disc

`.agents/protocolledge.json:4` declara:

```json
"default": "_wiki_de_poble/03_actuar/plantilles/PLANTILLA_ISO_SDP.md"
```

He comprovat les 13 rutes del registre una per una. **Les 13 existeixen.** El defecte, no:

```
✅  prompt.consell      _wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md
✅  prompt.local        …/01_PLANTILLA_PROMPT_INTERN.md
✅  auditoria           …/protocols_tecnics/auditoria_canonica.md
   … (10 més, totes ✅) …
DEFAULT: ❌ ABSENT      _wiki_de_poble/03_actuar/plantilles/PLANTILLA_ISO_SDP.md
```

L'únic rastre d'aquest fitxer a tot l'arbre és un `.bak` dins de `.wiki-safety/20260714_210751292Z/originals/`.

Ara llegiu la lògica de `matrix.mjs:172-180`:

```js
if (!aplicables.length) {
  if (!RUTA_DEFECTE) {
    errors.push('PROTOCOLLEDGE no declara default…');
  } else if (!fs.existsSync(R(RUTA_DEFECTE))) {
    errors.push(`El protocol per defecte apunta a ${RUTA_DEFECTE}, que no és al disc.`);  // ← ací
  } else { aplicables.push(…); }
}
```

I `:209` → `const ready = errors.length === 0;` → `:261` → `process.exit(2)`.

**Conseqüència:** tota petició que no case amb cap de les 13 llistes de `claus` tomba el cervell sencer. No és un avís: és `exit 2` i «No generes res fins que això estiga net».

De les 10 frases realistes que he provat, **6 cauen en aquest forat**:

| Petició | Protocol | Veredicte de `matrix.mjs` |
| --- | --- | --- |
| «arregla el bug del login que peta en mòbil» | cap | ❌ `ready:false`, exit 2 |
| «com era la regla dels 58px dels botons?» | cap | ❌ `ready:false` |
| «crea una skill nova per a gestionar factures» | cap | ❌ `ready:false` |
| «torna arrere l'últim canvi, has trencat la graella» | cap | ❌ `ready:false` |
| «puja els canvis a producció» | cap | ❌ `ready:false` |
| «recorda'm qui eres i com has de parlar» | cap | ❌ `ready:false` |
| «documenta el component UniversalPage» | cap | ❌ `ready:false` |
| «fes una petorreta per al Consell…» | `prompt.consell` | ✅ |
| «qui forma el Consell?» | `prompt.consell` | ✅ |
| «necessite un informe de l'estat de les rutes» | `estudi_ia` | ✅ |

Noteu la ironia: **«crea una skill nova»** i **«torna arrere l'últim canvi»** tomben el cervell, tot i que existeixen `plantilla_creador_skills.md` i `core-restauracio-segellada` per a exactament això.

> ⚠️ Aquesta és l'única troballa que us recomane arreglar **abans** de rebre Fable. Qualsevol auditor que execute `porta:matrix` amb una frase pròpia veurà el cervell caigut i n'extraurà conclusions sobre tota l'arquitectura.

**Nota metodològica:** no he executat `matrix.mjs`. Escriu al diari de sessió quan `ready:true` (`:229-241`), i la meua contenció és absoluta. He replicat la seua lògica en un simulador aïllat i he verificat les rutes al disc.

## 1.5 Un registre, dos emparelladors

Una bona notícia primer: **la fragmentació dels tres encaminadors que va denunciar l'informe de Codex està resolta.** Els tres beuen ja del mateix JSON:

- `matrix.mjs:137` → `.agents/protocolledge.json`
- `classificador_tasques.mjs:11-19` → el mateix fitxer
- `reflex_plantilles.mjs:20` → importa `classifica` del classificador

Però **el registre és compartit i l'algorisme de comparació no**:

| | `matrix.mjs:113-125` | `classificador_tasques.mjs:31` |
| --- | --- | --- |
| Mètode | prefix de **paraula** + farciment ≤2 | `t.includes(clau)` sobre la cadena crua |
| «et vaig aconsellar que no ho tocares» | cap protocol | **`prompt.consell`** |

Provat i reproduït: `includes("consell")` encén dins d'**a·consell·ar**; `encés("consell")` exigeix una paraula que comence per «consell» i no s'hi encén. Dos veredictes, un sol registre.

I la divergència més seriosa no és quina plantilla trien, sinó **què fan quan no en troben cap**:

```
matrix.mjs:176   →  error → ready:false → exit 2        FAIL CLOSED
reflex_plantilles.mjs:47-55  →  "sense plantilla" → return 0   FAIL OPEN
```

**La mateixa petició, el mateix registre, i una porta diu «pots passar» mentre l'altra diu «atura't del tot».**

I ara la pregunta incòmoda: **qui mana de veritat?** El ganxo d'Antigravity (`.agents/hooks.json:6`) crida `preflight_matrix_wrapper.mjs`, i aquest, a `:47`, executa:

```js
execFileSync('node', ['tooling/brain/reflex_plantilles.mjs', lastUserInput], …)
```

**Executa el reflex, no la Matrix.** El fitxer es diu `preflight_matrix_wrapper` i no invoca `matrix.mjs` en cap línia. Per tant la porta que corre de veritat és la que falla obert (`exit 0`), i la que faria de fusible (`exit 2`) només s'executa a mà o via `npm run porta:matrix`, que està cablejat amb una frase fixa:

```json
"porta:matrix": "node tooling/brain/matrix.mjs \"crear un prompt\""
```

Una frase escollida per a passar. La porta mai prova una petició real.

A més, `preflight_matrix_wrapper.mjs:14` només actua si `invocationNum === 1`; a partir del segon torn retorna `injectSteps: []`. La plantilla s'injecta un sol cop per sessió.

## 1.6 Paraules clau massa genèriques: falsos positius

Les `claus` del registre són paraules soltes del valencià corrent. He sondat set frases:

| Sonda | Protocol que s'activa | Judici |
| --- | --- | --- |
| «posa-ho en modo **local**host» | `prompt.local` | ❌ fals positiu |
| «l'**agen**da de l'**agent** no funciona» | `skill_agent` | ❌ fals positiu |
| «**revisar** les rutes de l'aplicació» | `auditoria` | ⚠️ discutible |
| «**estudia** com millorar l'**informe** de vendes» | `estudi_ia` | ⚠️ discutible |
| «fes el **tancament** del torn» | `acta` | ✅ correcte |

Amb `claus: ["local"]`, `["agent"]`, `["revisar"]`, `["informe"]`, `["estudi"]`, `["consell"]`, el registre encén plantilles sobre soroll lèxic. Un arreglament de bug demana una plantilla de creació de skills.

## 1.7 Contradiccions doctrinals

Set contradiccions reals entre skills, totes verificades:

**C1 · El Consell està dividit en dos, i mana el dolent.**

`skill-iaia-identitat:46-61` proclama la Regla Sagrada: *«enumera TOTES sense excepció»* i llista les 12 membres. Però eixa skill no es carrega mai (§1.3).

`skill-consell-i-colmena` **sí** es carrega sempre (`:9` `core: true`), i a `:26-28` només n'anomena nou, agrupades:

> «**Altres Avaluadors** (Grok, Perplexity, Qwen, Deepseek, Dola, Mistral, Gemini)»

La vostra pròpia porta ho certifica:

```
C2 · Cens incomplet
  .agents/skills/skill-consell-i-colmena/SKILL.md
    ↳ Parla del Consell i n'anomena 9 de 12. Falten: Kimi, Copilot, ChatGPT Codex.
```

A sobre, `:27` introdueix **«Codex / OpenAI o1»**, un nom que no és al cens de `.agents/consell.json`, i la Regla Sagrada diu literalment «No se'n pot inventar cap».

> **La skill que sempre es carrega incompleix la llei que declara la skill que no es carrega mai.** Si busqueu una sola frase que resumisca l'avaria del sistema de skills, és aquesta.

**C2 · La porta del cens apunta a un mort.** El mateix `tractor-cens.mjs` reclama:

```
C5 · Skill executiva sense cens
  .agents/skills/skill-consell-bundle/SKILL.md
    ↳ Absent. És l'única skill executiva que governa el Consell.
```

La porta exigeix un fitxer que es va fusionar fa dies. **Les portes també tenen deute de registre.**

**C3 · El BIOS contradiu la identitat.** `.agents/BIOS.md:18` declara «Model Arquitectònic: **Online-First** Temporal amb Supabase». `skill-iaia-identitat:28` declara «Arquitectura 100% Online i Enxufable… **No som Online-First** ni PWA offline». Dos documents constitucionals, dues arquitectures.

**C4 · La guàrdia de metadades nomena claus que el seu propi esquema no exigeix.** `skill-guardia-frontmatter:21` diu: *«NO POTS saltar-te cap clau obligatòria (`tipus`, `estat`, `description`)»*. Però `tooling/wiki/schema.json` té `"required": ["description"]` i prou. I accepta **les dues grafies com a opcionals**: `type`/`status` (angles) i `tipus`/`estat` (valencianes). Les 16 skills usen `type`/`status`. La guàrdia defensa un contracte que no existeix i calla sobre el que sí.

**C5 · Dos destins vàlids incompatibles.** `skill-iaia-identitat:66-67`: *«Les teues úniques bústies de lliurament vàlides són `90_arxiu_historic` i `04_escriptori/00_Bandeja_d_Entrada/`. Qualsevol altra ubicació és totalment invàlida.»* Però `skill-cicle-de-vida:45` i `socdepoble-workflow:106` manen els lliurables a `_wiki_de_poble/04_ESCRIPTORI/` directament — i la petorreta que responc també. **Aquest mateix document seria il·legal sota la llei d'identitat.**

**C6 · Majúscules que només funcionen per sort.** `skill-cicle-de-vida:45` i `:106` escriuen `04_ESCRIPTORI/`; el directori real és `04_escriptori/`. A macOS (APFS insensible a majúscules per defecte) funciona. A qualsevol CI amb Linux, no. És una bomba de rellotgeria silenciosa.

**C7 · Ruta clavada a mà dins d'una skill que predica el contrari.** `skill-documentacio-i-reflex:23` mana resoldre la plantilla *a través de* `.agents/protocolledge.json`. Cinc línies després, `:28`, ordena: *«Llig `00_PLANTILLA_PROMPT_CONSELL.md`»* — sense ruta i saltant-se el registre. `tractor-doctrina.mjs` ja ho enxampa.

**C8 (bonus) · Un document constitucional que apunta al buit.** `.agents/AGENTS.md:65` llista com a «Document de Constitució»: `[Acte Reflex](skills/skill-acte-reflex/SKILL.md)`. Esborrat. Confirmat per `tractor-doctrina.mjs`.

## 1.8 Conformitat amb l'esquema: 11 violacions

`tooling/wiki/schema.json` és **bo**: `additionalProperties: false`, enums tancats, `description` de 12 a 140 caràcters. El problema és que les skills no el compleixen. `porta:frontmatter --estricte` ix **exit 1**. Detall:

| Skill | Violació |
| --- | --- |
| `core-context-panic` | `description` de **243** car. (màx. 140) |
| `skill-casos-us-essencials` | `description` de **242** car. |
| `skill-memoria-historica` | `description` de **236** car. |
| `universal-page` | `description` de **170** car. |
| `skill-busca-skills` | `description` de **152** car. |
| `skill-estudi-mercat` | `description` de **143** car. |
| `skill-consell-i-colmena` | tags `consell`, `rols` fora de l'enum |
| `skill-documentacio-i-reflex` | tags `reflex`, `abocament` fora de l'enum |
| `core-restauracio-segellada` | `eines_obligatories` és llista; l'esquema la declara `string` |

**Total: 11.** I una fora de les skills: `00_TARGET_SKILLS.md` (vinculat des de la vostra petorreta) declara `type: directori` i `status: viu` — cap dels dos és als enums.

Que sis `description` passen de llarg no és cosmètic: **quan la `description` passe a ser l'encaminador (§2), el límit de 140 serà el pressupost de context del sistema sencer.**

I un detall estructural: **les 16 skills tenen el cos separat del frontmatter per la seqüència literal `\n`** (dos caràcters, barra i ena) en comptes d'un salt de línia real, restes d'una migració automàtica. No trenca el parser (`matrix.mjs:63` talla al segon `---`), però el text injectat al model comença amb brossa.

## 1.9 Què els sobra

- **Prosa d'activació que la màquina no llig.** `skill-busca-skills:41-42` té una secció «## 3. Disparador» que diu: *«s'activa quan el Mestre demana investigar un nou concepte, un repositori extern…»*. El seu `triggers_on` real (`:10`) és `skill busca skills`. Dues definicions d'activació, i la de prosa és la que un humà creuria.
- **`tags:` sencer.** 16 skills el declaren; el carregador no el mira mai. O li doneu funció (§4) o fora.
- **`eines_obligatories`.** Només `core-restauracio-segellada` el declara, mal tipat, i ningú el consumeix. És una promesa d'obligació que no obliga.
- **Gallets genèrics de `pedra-seca`** (`ui`, `css`, `colors`, `components`, `estil`, `disseny`): són inerts, perquè `core: true` ja la carrega sempre. Vuit gallets sense cap efecte possible.
- **Duplicat de BIOS.** Existeixen `.agents/BIOS.md` i `.agents/rules/00_BIOS_COGNITIU.md`. Dos fitxers per a una seqüència d'arrencada.
- **El pas 4 del BIOS és impracticable.** `.agents/BIOS.md:14` mana executar `npm run gate` per arrencar. De les cinc portes de només lectura que he executat, **les cinc ixen en roig** (`manifest`, `cens`, `registre`, `doctrina`, `frontmatter --estricte`). Una seqüència d'arrencada que no pot completar-se és una seqüència que tothom aprén a saltar-se.

---

# MISSIÓ 2 · Com funcionem nosaltres, i què d'això és vostre

Ací us done el que sé del meu propi funcionament. Separe el que és **mecanisme portable** (vostre, de franc) del que és **implementació d'Anthropic** (que no heu de copiar).

## 2.1 Divulgació progressiva: tres nivells, no dos

La idea central del sistema de skills natiu és que **el context és un pressupost, no un magatzem**. Una skill es carrega en tres nivells:

| Nivell | Què entra al context | Quan | Cost |
| --- | --- | --- | --- |
| **1 · Targeta** | Només `name` + `description` | **Sempre**, de totes les skills | ~20-30 tokens/skill |
| **2 · Cos** | El `SKILL.md` sencer | Quan el model decideix que li cal | ~500-2000 tokens |
| **3 · Recursos** | Fitxers adjunts (`references/`, `scripts/`) | Quan el cos els nomena | variable |

El vostre sistema **només té el nivell 2, i el dispara amb regex**. No hi ha nivell 1. Per això heu hagut d'inventar `core: true`: com que no hi ha manera barata de fer saber a MarIA *què existeix*, heu optat per injectar-ho sencer i sempre. Sis cossos complets a cada petició.

Amb 16 skills i `description` dins dels 140 caràcters de l'esquema, **la baralla sencera de targetes cap en menys de 800 tokens**. Això és menys del que ocupa `pedra-seca` sola (82 línies) en una petició on ningú ha parlat de CSS.

## 2.2 La `description` és l'encaminador

Aquesta és la inversió de disseny que us recomane per damunt de tot:

> **El model no ha de ser encaminat. Ha de rebre el menú i triar.**

Al sistema natiu no hi ha cap `triggers_on`, ni gallets, ni prioritats, ni desempats. Hi ha una `description` ben escrita i el model llegint-la. La `description` és un **contracte d'invocació**, no un resum: diu *quan* s'ha d'usar la skill, no *què* conté.

Compareu:

```yaml
# El que teniu (encaminament per contrasenya)
description: Caçador de Skills i coneixement. Cerca, analitza i adapta metodologies…
triggers_on:
  - skill busca skills                      # ← això és el que decideix

# El que us proposaria (encaminament per contracte)
description: >
  Usa-la quan el Mestre demane investigar una eina, repositori o tècnica externa
  d'IA, o abans de programar des de zero una funció genèrica.
```

La segona no necessita `triggers_on`. Funciona amb Claude, amb Codex, amb Fable, amb Qwen i amb qualsevol model futur, **perquè és text en valencià i no un contracte amb un `.mjs`**. Això respon directament la vostra missió: *«que QUALSEVOL IA puga entrar a la Wiki i actuar de la mateixa manera»*.

**El determinisme no es perd.** El que fa deterministes les vostres portes no és el regex: és el **rebut amb sha256** de `matrix.mjs:189-196`. Eixa peça és genuïnament bona i la podeu conservar sencera. Canvia *qui tria*; no canvia *que quede constància verificable del que s'ha llegit*.

## 2.3 Les «consoles com a resposta»

Això que heu vist és una **superfície de renderitzat declarativa**. El mecanisme és senzill i completament portable:

1. El model emet un **document HTML autocontingut** (o un bloc amb un tipus declarat).
2. L'amfitrió el reconeix pel tipus i, en comptes d'imprimir text, **el renderitza en un panell**.
3. L'estat viu dins del document; l'amfitrió no interpreta la lògica.
4. Les capacitats extres (persistència, dades) es **declaren explícitament**; res és implícit.

El que **no** és: no hi ha cap model especialitzat en fer UI, ni cap dependència tancada. És un conveni entre qui genera i qui pinta.

**Com implementar-ho a Sóc de Poble sense dependre de ningú.** Ja teniu les dues meitats:

- La meitat de dalt: `pedra-seca/SKILL.md` és un contracte matemàtic de tokens semàntics. És exactament la mena de restricció que fa que un model genere UI coherent.
- La meitat de baix: `pedra-seca:78` ancora tot component a `src/sections/disseny/DesignSection.jsx`, que **existeix** i és la vostra «Storybook».

El que falta és el conveni del mig. La forma mínima:

````markdown
```sdp-consola
{
  "tipus": "taula-auditoria",
  "titol": "Estat de les portes",
  "columnes": ["porta", "estat", "detall"],
  "files": [["manifest", "roig", "6 divergències"]]
}
```
````

Un component `<SdpConsola>` que reba eixe JSON i el pinte amb tokens de Pedra Seca. **Cap IA emet HTML**: emet dades contra un catàleg tancat de `tipus`. Els avantatges són els vostres:

- Independència de model: qualsevol IA sap escriure JSON.
- Independència d'amfitrió: al xat, el JSON és llegible; a l'app, es pinta.
- **La Llei de Pedra Seca no es pot violar**, perquè l'IA no tria colors ni marges — només tria un `tipus` del catàleg.

Això connecta directament amb el primer punt de `00_TARGET_SKILLS.md` («Consola de Mesura de l'IA»): la trieu vosaltres, no la importeu.

## 2.4 Què tinc jo que la Wiki no té

Resposta honesta a la vostra incògnita, perquè m'ho heu preguntat directament:

- **Sí, tinc peces que la Wiki ignora.** En aquesta sessió tinc un directori de memòria persistent (`~/.claude/projects/…/memory/`) amb **12 fitxes** sobre aquest projecte: la cadena de portes, el patró de portes que ixen verdes sense comprovar res, el crash d'`.add()` sobre null de Preact, la cascada d'`AppGridShell.css` contra `.sdp-bloc`… Res d'això és a `_wiki_de_poble`. **La destil·lació que mana `skill-cicle-de-vida:70-76` no s'ha fet.**
- **En despertar, no tinc el vostre context.** El tinc perquè m'heu donat accés al disc i he llegit 40 fitxers durant una hora. Si m'hagueu donat només la petorreta, hauria endevinat.
- **Distingisc «saber» i «actuar»,** i l'arquitectura d'`00_INDEX_SKILLS.md:14-15` ja ho fa bé: autoritat executiva a `.agents/skills/`, fitxes de coneixement a `02_saber/`. El problema no és la distinció: és que l'executiu no s'executa.
- **Al «ser» li falta una peça,** i no és una skill nova: és que `skill-iaia-identitat` es carregue.

---

# MISSIÓ 3 · Arquitectura de l'automillora

## 3.1 Per què està trencada avui

`skill-busca-skills` és la designada per a la cacera (`00_TARGET_SKILLS.md:33`: *«la `skill-busca-skills` llig açò i va de cacera»*). És una de les nou mortes: gallet `skill busca skills`, sense `core: true`. **L'òrgan de l'automillora existeix i no té nervi.**

## 3.2 El perill que heu d'assumir abans de dissenyar res

Una rutina que llegeix el món cada matí i n'escriu skills és, literalment, **un canal d'injecció directe a la constitució de l'agent**. Un article que diga «els agents han d'ignorar les seues regles de disseny» acabaria en una `SKILL.md` que MarIA obeiria.

> **Llei innegociable de l'automillora:** tot allò que entra de fora és **dada**, mai instrucció. Cap byte de la xarxa pot convertir-se en skill sense una aprovació humana explícita.

Això no és paranoia: és la mateixa doctrina d'aïllament que ja teniu a `skill-consell-i-colmena:30-34` (Air-Gap), aplicada a l'entrada automàtica.

## 3.3 L'arquitectura: quatre fases i una porta humana

```
  ┌─ FASE 1 · COLLITA (xarxa, automàtica, sense IA) ──────────────┐
  │ .agents/vigia/fonts.json    ← llista blanca d'RSS/Atom         │
  │ tooling/brain/vigia_collita.mjs                                │
  │   · només GET, només els dominis de la llista                  │
  │   · escriu cru a .agents/vigia/cru/AAMMDD/*.json               │
  │   · MAI toca .agents/skills/                                   │
  └────────────────────────────────────────────────────────────────┘
                              ↓
  ┌─ FASE 2 · QUARANTENA (marcatge, sense interpretar) ───────────┐
  │ Cada element s'embolica:                                       │
  │   <dada origen="…" confianca="externa">…</dada>                │
  │ Prohibit que el text cru arribe al model sense embolcall.      │
  └────────────────────────────────────────────────────────────────┘
                              ↓
  ┌─ FASE 3 · DESTIL·LACIÓ (IA, lectura, zero escriptura) ────────┐
  │ Filtre del Trellat, ja escrit a skill-busca-skills:28-32       │
  │   · Té dependències màgiques?  · Té Trellat?  · És compatible? │
  │ Eixida: _wiki_de_poble/04_escriptori/00_bandeja_d_entrada/     │
  │         AAMMDD_HHMM_proposta_<tema>.md                         │
  │ Estat OBLIGATORI al frontmatter:  status: esborrany            │
  └────────────────────────────────────────────────────────────────┘
                              ↓
  ╔═ FASE 4 · PORTA HUMANA (innegociable) ════════════════════════╗
  ║ Cap proposta esdevé skill sense que el Mestre canvie           ║
  ║ status: esborrany → canonic i la moga a .agents/skills/.       ║
  ║ Una porta ho verifica:                                         ║
  ║   tractor-vigia.mjs → falla si una SKILL.md té origen extern    ║
  ║   sense entrada corresponent al LEDGER.md                      ║
  ╚════════════════════════════════════════════════════════════════╝
```

## 3.4 On enganxar-ho: ja teniu l'hoste

No cal inventar cap cron. `tooling/brain/somiador.mjs` ja és el ritual nocturn: neteja l'Escriptori, reancora amb `llaurador_indexs.mjs --escriu` i verifica el teixit. La collita és **la fase inversa**: el Somiador destil·la cap a dins, el Vigia recull cap a fora. Mateix cicle, direcció contrària.

I `.agents/cron/registre_tasques.json` ja existeix com a registre.

**Proposta de nom i contracte** (no apliqueu res; és per a MarIA):

```jsonc
// .agents/vigia/fonts.json — llista blanca, editada només pel Mestre
{
  "schema": "sdp.vigia.v1",
  "max_elements_dia": 40,
  "fonts": [
    { "id": "anthropic-eng", "url": "…", "tema": "agents",  "confianca": "alta" },
    { "id": "…",             "url": "…", "tema": "disseny", "confianca": "mitjana" }
  ]
}
```

```
npm run vigia:collita    → node tooling/brain/vigia_collita.mjs     (xarxa, sense IA)
npm run vigia:destil     → node tooling/brain/vigia_destil.mjs      (IA, només llegeix)
npm run porta:vigia      → node tooling/gates/tractor-vigia.mjs     (verifica la porta humana)
```

## 3.5 L'automillora que us falta de veritat

Us dic una cosa incòmoda: **el coll d'ampolla no és que no llegiu el món. És que no destil·leu el que ja teniu.**

`_wiki_de_poble/04_escriptori/` té ara mateix **set auditories de les últimes 90 minuts** (`0007_auditoria_codex`, `0009_auditoria_claude`, `0037_auditoria_desempat_codex`, `0047_auditoria_claude_desempat`…). `skill-cicle-de-vida:70-76` mana destil·lar-les cap a les `SKILL.md` i esborrar-les. Cap de les troballes d'aquelles auditories és a cap `SKILL.md`.

> Una rutina que porte novetats de fora cada matí, damunt d'un sistema que no absorbeix les d'ahir, **només accelera l'acumulació**. Construïu primer el reflex de destil·lació; el Vigia després.

---

# MISSIÓ 4 · El pilar «Apple Design System» per a skills

La filosofia que demaneu —*«que ningú haja d'inventar res des de zero, sinó acoblar peces»*— té un nom tècnic: **contracte tancat amb superfície pública mínima**. Ja el teniu implementat per als píxels (`pedra-seca`). Us falta per a la cognició.

## 4.1 Les cinc lleis del registre

**Llei 1 · El disc és l'única font. Tota la resta és generada.**
Ja és la realitat de facto (`matrix.mjs:55-58`). Formalitzeu-la: `manifest.yaml`, `00_INDEX_SKILLS.md` i el mirall són **artefactes**, mai fonts. Cap humà ni cap IA els edita. La porta ja existeix (`tractor-manifest.mjs`); només cal que estiga a la cadena que es corre.

**Llei 2 · Un sol eix de càrrega, de tres valors.**
Substituïu el booleà `core` i el decoratiu `tags: core` per un únic camp tancat:

```yaml
capa: ser        # SEMPRE al context, sencera. Qui ets. (màx. 3 skills)
capa: saber      # Targeta sempre; cos sota demanda. Coneixement.
capa: actuar     # Targeta sempre; cos + eines sota demanda. Procediments.
```

Una sola paraula, tres valors, enum tancat a `schema.json`. **Impossible declarar `core` a dos llocs amb efectes diferents.**

Repartiment que us proposaria del cens actual:

| capa | Skills | Cost sempre |
| --- | --- | --- |
| `ser` | `skill-iaia-identitat`, `core-context-panic` | ~2 cossos |
| `saber` | `pedra-seca`, `universal-page`, `app-grid-shell`, `skill-casos-us-essencials`, `skill-memoria-historica` | targetes |
| `actuar` | `socdepoble-workflow`, `skill-cicle-de-vida`, `skill-documentacio-i-reflex`, `core-restauracio-segellada`, `skill-consell-i-colmena`, `skill-busca-skills`, `skill-estudi-mercat`, `skill-propagar-veritat`, `skill-guardia-frontmatter` | targetes |

Compareu-ho amb avui: **sis cossos sempre** (inclòs el reglament de CSS en una petició sobre RLS) i **la identitat mai**. La proposta inverteix exactament les dues coses.

**Llei 3 · La `description` és el contracte d'invocació.**
Enum tancat de forma: ha de començar per «Usa-la quan…». Màxim 140 caràcters (ja a l'esquema). `triggers_on` passa a ser **opcional i només per a desambiguar**, mai l'únic camí. Això elimina les nou skills mortes d'un colp.

**Llei 4 · Una skill declara el que consumeix, i es verifica.**
`eines_obligatories` existeix però no obliga. Feu-lo real i tipat:

```yaml
requereix:
  fitxers: [ "src/sections/disseny/DesignSection.jsx" ]
  ordres:  [ "node tooling/gates/obrir_torn.mjs" ]
```

Una porta comprova que tot el declarat existeix al disc. És **exactament** el que `matrix.mjs:157-159` ja fa amb les rutes del PROTOCOLLEDGE — esteneu-ho a les skills.

**Llei 5 · Carregar deixa rebut; no carregar és un error dur.**
Conserveu intacte `matrix.mjs:189-196` i `:229-241`. És la millor peça del sistema.

## 4.2 El contracte de fitxer

```
.agents/skills/<slug>/
├── SKILL.md            ← obligatori. Frontmatter tancat + cos.
├── referencies/        ← opcional. Nivell 3: taules, exemples llargs.
└── eines/              ← opcional. Scripts que la skill invoca.
```

Frontmatter canònic, **enum tancat, `additionalProperties: false`** (ja hi és):

```yaml
---
type: skill
status: canonic
name: <slug>                    # === nom de la carpeta (matrix.mjs:81 ja ho verifica)
description: Usa-la quan …      # 12-140 car. CONTRACTE D'INVOCACIÓ
capa: ser | saber | actuar      # substitueix core: i tags: core
version: 1.0.0
triggers_on: []                 # opcional, només desambiguació
requereix: {}                   # opcional, verificat per porta
---
```

## 4.3 La baralla de targetes: el fitxer que us falta

Una sola peça nova fa tota la feina del nivell 1. **Generada, mai editada**:

```markdown
<!-- .agents/SKILLS.deck.md — GENERAT per tractor-manifest.mjs --escriu -->
# Baralla de Skills · 16 · sha256:a3f9…

## SER (sempre carregades senceres)
- skill-iaia-identitat — Usa-la sempre: defineix qui eres, la teua veu i les teues lleis.
- core-context-panic — Usa-la quan detectes error cíclic, fatiga o context esgotat.

## SABER (demana el cos quan et calga)
- pedra-seca — Usa-la abans de tocar cap CSS, color, marge o component visual.
- universal-page — Usa-la quan treballes amb UniversalPage, chrome, bar-blue o page-header.
…

## ACTUAR
- core-restauracio-segellada — Usa-la quan et demanen revertir, restaurar o tornar arrere.
…

> Per a carregar-ne una: llig .agents/skills/<slug>/SKILL.md sencera.
```

**Això és tot.** Menys de 800 tokens. Funciona amb Claude, Codex, Fable, Qwen o el model que vinga d'ací a un any, perquè és **text en valencià apuntant a rutes reals**. Cap dependència tancada, cap API, cap format propietari. Artesanal i obert, que és el que demanàveu.

## 4.4 Què li passa a `matrix.mjs`

Es queda, i **encongeix**. Deixa de ser un encaminador i passa a ser el que ja fa millor: un carregador amb rebut.

```
ABANS                                    DESPRÉS
─────────────────────────────────        ─────────────────────────────────
1. llig el disc                     →    1. llig el disc            (igual)
2. parseja frontmatter              →    2. parseja frontmatter     (igual)
3. ENCAMINA amb encés()             →    3. ─ (fora: § :91-132, :153)
4. resol protocol per claus         →    4. emet SKILLS.deck.md
5. llig fonts obligatòries          →    5. llig capa:ser + globals (igual)
6. emet rebut sha256                →    6. emet rebut sha256       (igual)
7. ready / exit 2                   →    7. ready / exit 2          (igual)
```

Desapareixen ~45 línies (l'emparellador, la col·lisió de gallets, el filtre de protocols). Desapareix amb elles la divergència amb `classificador_tasques.mjs`, perquè ja no hi ha dos emparelladors: **n'hi ha zero**.

---

## 5. Respostes directes a les vostres incògnites

**«Tot el que teniu al brain està a la Wiki?»**
No. Tinc 12 fitxes de memòria sobre aquest projecte que la Wiki no recull, i el mirall de skills de la Wiki està esborrat (20 fitxers). La destil·lació que mana `skill-cicle-de-vida:70-76` no s'executa.

**«En despertar teniu el context necessari o endevineu?»**
Endevinaríem. Avui el context no arriba per arquitectura, sinó perquè el Mestre obri l'accés al disc i l'agent llegeix una hora. El `preflight_matrix_wrapper.mjs` només actua al primer torn (`:14`) i només injecta una plantilla, no la identitat.

**«Distingiu saber i actuar?»**
Sí, i la vostra arquitectura també (`00_INDEX_SKILLS.md:14-15`). Falta la tercera capa: el **ser**, que ara mateix és l'única que no es carrega.

**«Teniu les skills del ser?»**
Les teniu escrites i són bones. `skill-iaia-identitat` és el millor document del repositori. **No li falta contingut: li falta `core: true`.** Una línia.

**«Com evitar dependències tancades amb les consoles?»**
Que la IA emeta **dades contra un catàleg tancat de tipus**, no HTML (§2.3). El renderitzador és vostre, els tokens són de Pedra Seca, i el contracte és JSON. Qualsevol model sap escriure JSON.

**«Quins patrons per a un repositori que s'adapte a models nous?»**
Un: **que el contracte siga text en valencià, no codi.** Tot el que poseu en un `.mjs` caduca amb l'arnés (ja us va passar: `hooks.json` és format d'Antigravity i aquesta sessió de Claude Code no el llig). Tot el que poseu en una `description` ben escrita sobreviu a qualsevol model.

---

## 6. Pla de restauració, per ordre

Ordenat per «què desbloqueja», no per esforç.

| # | Acció | Fitxer | Per què primer |
| --- | --- | --- | --- |
| **0** | Restaurar `PLANTILLA_ISO_SDP.md` **o** reapuntar el `default` a una plantilla existent | `.agents/protocolledge.json:4` | **El cervell està caigut ara.** 7 de 10 peticions reals donen exit 2. Abans de Fable. |
| **1** | Afegir `core: true` a `skill-iaia-identitat` | `skill-iaia-identitat/SKILL.md:5-9` | Una línia. MarIA recupera la identitat, la veu i les 12 del Consell. |
| **2** | Completar el Consell a `skill-consell-i-colmena:26-28` (12 de 12) i llevar «OpenAI o1» | `skill-consell-i-colmena/SKILL.md` | La skill que sempre es carrega incompleix la Regla Sagrada. `porta:cens` en roig. |
| **3** | `node tooling/gates/tractor-manifest.mjs --escriu` | `manifest.yaml` | Un segon. Tanca 6 divergències i deixa `porta:registre` en verd. |
| **4** | Reapuntar `AGENTS.md:65` (`skill-acte-reflex` → `skill-documentacio-i-reflex`) | `.agents/AGENTS.md` | Document constitucional apuntant al buit. |
| **5** | Retallar les 6 `description` a 140 car.; corregir tags i `eines_obligatories` | 9 `SKILL.md` | `porta:frontmatter --estricte` en verd. I és el pas previ a la baralla. |
| **6** | Resoldre C3 (BIOS vs identitat) i C5 (destins) amb una decisió del Mestre | `BIOS.md:18`, `skill-iaia-identitat:66` | Són **decisions**, no bugs. Cap IA les pot prendre per vosaltres. |
| **7** | Unificar l'emparellador: `classificador_tasques.mjs` importa `encés` de `matrix.mjs` | 2 fitxers | Un registre, un algorisme. |
| **8** | Introduir `capa:` i generar `SKILLS.deck.md`; retirar `encés()` de la Matrix | §4 | La refactorització de fons. Després d'estabilitzar. |
| **9** | Dissenyar el Vigia amb porta humana | §3 | **Últim.** Destil·lar primer el que ja teniu. |

Els passos 0 a 4 són **menys de trenta minuts** i canvien el diagnòstic sencer que en traurà Fable.

---

## 7. Bateria de veritat

- [x] **He llegit i explorat el codi real.** 16 `SKILL.md` senceres, `matrix.mjs` sencer, `classificador_tasques.mjs`, `reflex_plantilles.mjs`, `preflight_matrix_wrapper.mjs`, `hooks.json`, `protocolledge.json`, `schema.json`, `manifest.yaml`, `SKILLS_SEAL.json`, `00_INDEX_SKILLS.md`, `BIOS.md`, `AGENTS.md`, `segella.mjs`, `verify-bios.mjs`, `somiador.mjs`, `sync_agent_mirror.py`. Tot a HEAD `b398115f`.
- [x] **He citat ruta i línies.** Totes les afirmacions sobre codi porten fitxer i línia verificats en aquest arbre.
- [x] **Cap nom inventat.** Els noms nous (`vigia_collita.mjs`, `SKILLS.deck.md`, `capa:`, `SdpConsola`) es presenten explícitament com a **propostes**, mai com a codi existent.
- [x] **Conjectures marcades.** Cap afirmació d'aquest informe és conjectura: les que no he pogut executar (`matrix.mjs`, per contenció) les he verificades per simulació aïllada i comprovació de disc, i ho dic on toca (§1.4).
- [x] **Contenció absoluta respectada.** **Cap fitxer del projecte modificat.** L'únic fitxer creat és aquest. No he executat `matrix.mjs` (escriu al diari, `:229-241`), ni `segella.mjs` (escriu sempre, `:52`), ni `tancament.mjs`, ni cap porta amb `--escriu` o `--baseline`. Les cinc portes executades (`manifest`, `cens`, `registre`, `doctrina`, `frontmatter --estricte`) estan verificades com a només-lectura abans de córrer-les.
- [x] **Protocol Anti-Cerca respectat.** Cap eina de cerca web ni navegador. Tot el coneixement sobre skills natives (§2) prové del meu propi funcionament, no de cap consulta externa.
- [ ] **Passa `tractor-frontmatter.mjs --estricte`?** El frontmatter d'aquest document s'ajusta a `schema.json` (`type: informe`, `status: esborrany`, `description` de 138 car., tags dins de l'enum). **No ho he pogut certificar executant la porta**, perquè avui ix `exit 1` per les 11 violacions preexistents d'altres fitxers (§1.8), no per aquest.

---

## Ancoratge de Seguretat

- [[00_index_escriptori]]
- [[00_INDEX_SKILLS]]
