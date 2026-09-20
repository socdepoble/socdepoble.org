---
type: informe
status: esborrany
description: Auditoria de disseny i diagnòstic cognitiu de MarIA - constitució duplicada, REGLA 0 sense càrrega i àlies en col·lisió
tags:
  - arquitectura
  - disseny
  - govern
  - skills
---

# Informe Claude — Auditoria de Disseny i Diagnòstic Cognitiu

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260919-CLAUDE |
| Versió | 1.0.0 |
| Respon a | SDP-PROMPT-260919-COG |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 21:00 |
| Agent redactor | Claude (Consell de la Petorreta) |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[skill-acte-reflex]]
- [[pedra-seca]]

---

## Síntesi en cinc línies

1. **MarIA no inventa «MACRO_PROMPT»: eixe fitxer existeix i està marcat `canonic`.** Tres plantilles canòniques comparteixen els mateixos dos àlies. No és fabricació, és recuperació correcta sobre un corpus ambigu (§2.4).
2. **La REGLA 0 és l'única llei que el motor no carrega mai.** No està marcada `core: true` i el seu únic disparador és «skill acte reflex», que ningú escriu (§2.1).
3. **El «cron» que demaneu ja el teniu construït i ben pensat** (`.agents/hooks.json`). La pregunta no és com dissenyar-lo sinó si es dispara (§3.1–3.2).
4. **Hi ha dues constitucions i la que carrega l'IDE és la vella**, sense la llei de l'Acta Marmota (§2.2).
5. **El 76% del deute de frontmatter que mesuren les portes són còpies fantasma** creades per l'eina que el repara (§1.7).

Al front de codi, el defecte real és un: **en mode fosc, l'app web pinta el logotip negre sobre fons fosc** (§1.1).

---

## 0. Mètode i contracte de realitat

**Tall d'auditoria:** `HEAD 214f5c7c` + arbre de treball a 2026-09-19T19:00Z. Vaig congelar una còpia de `src/`, `.agents/` i `tooling/` fora del repositori i he reverificat cada cita contra l'arbre viu en acabar. Cap cita d'este informe prové de la còpia: totes s'han tornat a llegir del disc real.

**Contenció respectada.** No he escrit ni una línia fora d'este fitxer. Concretament, **no he executat `tooling/brain/matrix.mjs`** tot i que hauria estat la demostració més vistosa del diagnòstic: fa `appendFileSync` sobre un diari (`tooling/brain/matrix.mjs:252-253`) i això és escriure a disc. Tot el que afirme sobre eixe motor ve de lectura estàtica. Tampoc he executat `design_guard.mjs` (té 2 escriptures) ni cap porta amb `--baseline`.

**Prohibició de cerca respectada.** Cap eina web. Tot ix del repositori.

**Dues fases.** He separat la cacera de la refutació. La secció 4 llista el que vaig creure trobar i **no** era cert. Si no llegiu res més, llegiu eixa secció: és la que us diu quant valen les altres.

**Conflicte de nomenclatura detectat i no resolt en silenci.** `plantilla_estudi_ia.md:8` ordena que el fitxer en disc es diga `YYMMDD_HHMM_estudi_[nom_ia].md`. El vostre prompt demana `260919_2100_informe_claude.md`. He obeït la vostra ordre directa i ho deixe ací marcat en lloc de triar i callar. Açò no és una anècdota: és exactament la classe d'ambigüitat que la secció 3 diagnostica.

---

## 1. Missió 1 — Front arquitectònic (disseny i UI/UX)

### 1.1 Bug real: el mode fosc no canvia el logotip a l'app web

**Severitat: alta (defecte visible de marca).**

Tot el repositori escriu i llig l'atribut `data-theme`. `src/app/App.jsx:230` el posa sobre l'amfitrió del Shadow DOM i `src/app/App.jsx:232` sobre `document.documentElement`. El CSS el llig consistentment així a `src/css/tokens.css:300`, `src/css/components.css:627`, `src/css/modules.css:1135` i `src/components/layout/AppGridShell.css:173`.

**Exactament dues línies del repositori es desvien:** `src/css/layout.css:506` i `src/css/layout.css:507` consulten `:root[data-sdp-theme="dark"]`. Cap fitxer del projecte escriu mai `data-sdp-theme`: les úniques dos apparicions d'eixa cadena en tot el codi són eixes dues línies de CSS.

Conseqüència concreta. A `src/components/universal/PageFrame.jsx:257-258` conviuen els dos logotips, un amb `.light-only` i l'altre amb `.dark-only`. Les regles per defecte són `.light-only { display: block !important }` i `.dark-only { display: none !important }` (`src/css/layout.css:504-505`). En la compilació web normal (sense Shadow DOM), en mode fosc:

- la meitat `:host([data-theme="dark"])` de la regla **sí** funciona i salva l'embed de WordPress;
- la meitat `:root[data-sdp-theme="dark"]` **mai** casa;
- per tant el logotip **negre** es queda pintat sobre fons fosc i el blanc no apareix mai.

El defecte és invisible a l'embed i visible a l'aplicació insígnia. Cap porta el pot detectar, perquè totes dues línies contenen literalment la cadena `[data-theme="dark"]` en la seua segona meitat.

### 1.2 La cascada per capes es pot invertir, i el fitxer que ho promet no ho pot garantir

**Severitat: mitjana (fragilitat latent, no trencada hui).**

`src/css/index.css` és, de llarg, la millor peça d'enginyeria que he llegit al repositori. Documenta un error real de cascada, l'arregla declarant `@layer reset, sdp, legacy, components, utilities` abans dels `@import`, i té l'honestedat d'escriure la frase que resumeix tot este informe (`src/css/index.css:22-23`): *«Cap porta ho detectava: les portes compten cadenes de text, no resolen la cascada.»*

Ara bé, `src/css/utilities.css:3` declara el seu contracte: *«Ultima capa: guanyen sense !important»*. Eixe contracte no el garanteix l'arquitectura, sinó la sort. En les declaracions `!important` l'ordre de capes **s'inverteix** (CSS Cascade 5): una capa primerenca guanya. I la capa `legacy` en té 18: 14 a `src/css/layout.css` i 4 a `src/css/base.css`. Set d'elles són sobre `display` (`src/css/layout.css:492,504,505,506,507,578,586`).

Hui no trenca res perquè `utilities.css` no declara cap utilitat genèrica de `display` que xoque per nom. És a dir: la invariant es compleix per higiene de noms, no pel mecanisme de capes que el fitxer invoca. El dia que algú afija una utilitat `.sdp-ocult { display: none }` — la cosa més natural del món en eixe fitxer — perdrà silenciosament contra `legacy` en qualsevol element amb `.light-only`.

### 1.3 El pipeline de tokens és un decorat

**Severitat: mitjana (deute estructural).**

`src/config/design-tokens.json` es declara a si mateix `"font_unica_de_veritat": true` i `"status": "TANCAT"`. Genera `src/css/design-tokens.css`, que conté **3 tokens**. Els tokens reals del sistema — 203 — viuen escrits a mà a `src/css/tokens.css`.

A més, la regla que el propi JSON escriu (`src/config/design-tokens.json:7`) diu que «les rampes i els semàntics viuen a `src/css/index.css`». No hi viuen: `index.css` proclama de si mateix que no conté cap regla, i és cert. Viuen a `tokens.css`.

O siga: hi ha un pas de compilació (`npm run build:tokens`) que dona l'aparença d'un sistema de disseny sistematitzat i transporta el 1,5% dels tokens, mentre la font de veritat declarada apunta a un fitxer equivocat.

Detall relacionat: el tacte està duplicat. `--sdp-touch: 44px` (`src/css/tokens.css:171`, a mà) i `--sdp-touch-min: 44px` (`src/css/design-tokens.css:10`, generat). La llei Pedra Seca §6 nomena `--sdp-touch`; la capçalera doctrinal de `src/css/components.css:8` nomena `--sdp-touch-min`. `src/sections/profile/PerfilShell.css` usa els dos: `-min` a la línia 30, el pla a les línies 87 i 106.

### 1.4 Un estat, tres mecanismes

**Severitat: baixa (redundància, no error).**

`isDesktopSidebarClosed` s'expressa tres vegades:

1. `src/app/App.jsx:328` — com a `className` sobre `.sdp-root`. Correcte.
2. `src/app/App.jsx:151-158` — un `useEffect` que fa `classList.add/remove('sidebar-closed')` sobre el **mateix** node. Redundant amb el punt 1.
3. `src/app/App.jsx:350` — `style={{ display: ... }}` en línia sobre el `<nav>`, que duplica el que ja fa `src/css/layout.css:576-578`.

No trenca res: els tres deriven del mateix estat i coincideixen sempre. Però el punt 2 és mutació imperativa del DOM dins de React sobre un atribut que React reescriu sencer, i el punt 3 incompleix Pedra Seca §7 sense necessitat.

### 1.5 Incompliments de Pedra Seca, mesurats

He mesurat cada llei contra el CSS real. El resultat **no** és un desastre, i convé dir-ho:

| Llei | Estat | Mesura |
| --- | --- | --- |
| §2 Color (gens de hex directe) | **Molt bo** | 3 hex i 2 `rgba()` fora de `tokens.css`, i tots 5 són *fallbacks* dins de `var()` |
| §5 Ombres | Fluix | 23 `box-shadow` de 60 sense el token `--sdp-ombra` |
| §5 Radis | Fluix | 40 `border-radius` sense token `--sdp-radi` |
| §7 Sense estils en línia | Incomplit | 16 `style={{` en JSX |

Dos matisos importants sobre eixa taula:

**Els 5 literals de color són tots *fallbacks*, i un és incoherent.** A `src/css/modules.css:813` i `:815` el mateix token `--sdp-error` porta dos vermells de reserva diferents (`#b91c1c` i `#ef4444`). El token sí que existeix (`src/css/tokens.css:132`), així que és codi mort — però codi mort que, si mai s'activara, pintaria el text i la vora de colors distints.

**Dels 40 radis, 16 són `border-radius: 50%`** — cercles d'avatar. La llei §5, tal com està escrita, no preveu el cas del cercle i per tant prohibeix una primitiva legítima. Això no és deute del codi: és un defecte de la llei. I té cost real, perquè una llei que prohibeix l'evident convida a ignorar-la sencera, inclosos els `26px`, `22px` i `14px` que sí que són arbitraris.

**`src/sections/detail/detailSectionMeta.jsx:120` conté `style={{ marginTop: 18 }}`** — literalment l'exemple que Pedra Seca §7 posa com a prohibit, i amb un valor que a més incompleix §3 (no és múltiple de 4).

### 1.6 Dos defectes menors però reals

- `src/sections/pobles/PoblesSection.jsx:57` pinta l'estat d'error amb `color: 'var(--red-600)'`. Eixe token **no està definit enlloc** i no porta *fallback*: la declaració es descarta i el missatge d'error es queda del color heretat. L'estat d'error no es distingeix visualment.
- `src/app/App.jsx:472` fa `useMemo(() => config, [JSON.stringify(config)])`. Serialitza en cada render i, com que `JSON.stringify` descarta funcions i `undefined`, dues configuracions diferents poden produir la mateixa clau i congelar el memo.

### 1.7 El deute de frontmatter és un eco: el 76% del que es mesura són còpies fantasma

**Severitat: alta (corromp la mètrica de la qual depenen les portes).**

Açò ho vaig trobar per accident, executant la porta de frontmatter per validar este mateix informe. A l'arrel del repositori hi ha ara mateix **tres directoris ocults** amb còpies senceres de la wiki:

| Directori | Fitxers `.md` | Data |
| --- | --- | --- |
| `.frontmatter-copia-1789520829642` | 94 | 16 set |
| `.frontmatter-copia-1789533325921` | 79 | 16 set |
| `.frontmatter-copia-1789817477299` | 216 | 19 set |

**389 fitxers `.md` copiats, contra 122 de wiki real.** I `tooling/wiki/frontmatter-abast.json` exclou `node_modules`, `dist`, `.sdp-paperera`, `.quarantena-*` i `90_historic`, però **no exclou `.frontmatter-copia-*`**. La porta els escaneja tots.

O siga: el 76% dels documents que es mesuren per calcular el deute de frontmatter són ressons d'ells mateixos. Les xifres que hui bloquegen la porta amb `--estricte` (F1 42, F2 97, F3 25, F4 17, F7 65) estan dominades per còpies de còpies.

La cadena completa, i és un cercle tancat:

1. `tooling/wiki/codemod_frontmatter.mjs:204-212` crea la còpia de seguretat a l'arrel abans de reescriure res. Fins ací, prudent i correcte.
2. La línia 214 avisa l'humà: *«Comprova i esborra-la. Afig-la al .gitignore si no ho està.»* No hi ha cap neteja automàtica.
3. **Però ja està al `.gitignore:21`.** Per tant `git status` no la mostra mai — he comprovat que dona 0 entrades — i l'humà no la veu i no l'esborra. El mecanisme que havia d'ordenar és exactament el que la fa invisible.
4. La porta sí que la veu, perquè el seu abast és un fitxer distint del `.gitignore`.
5. El deute mesurat puja, la porta falla, i el seu missatge d'error recomana: *«Arregla-ho: node tooling/wiki/codemod_frontmatter.mjs --escriu»*.
6. Executar-ho crea una quarta còpia.

**L'eina de reparació fabrica la malaltia que tracta**, i ho fa en un punt cec construït pel `.gitignore`. Tres dies de còpies acumulades en són la prova.

Açò contradiu a més `AGENTS.md:24` (§3), que prohibeix deixar cap fitxer temporal a l'arrel del repositori.

No les he esborrades: la Frontera de Confiança de `skill-acte-reflex:130-131` prohibeix la destrucció cega, i verificar què conté cada còpia abans d'esborrar-la és feina del Mestre, no meua.

---

## 2. Missió 2 — Per què MarIA perd el context

He buscat la causa en tres capes: què se li carrega sempre, què decideix carregar-li el motor, i què troba quan busca. Les tres tenen un defecte mesurable, i cap és culpa del model.

### 2.1 La llei que ha de sonar sempre és l'única que no es carrega mai

Este és el nucli, i és mecànic.

`tooling/brain/matrix.mjs:130` decideix què entra al context amb una sola condició: `if (s.core || gallets.length)`. Una skill es carrega si està marcada `core: true`, **o** si algun dels seus disparadors casa amb les paraules de l'usuari.

Ara mireu qui té disparadors de veritat:

| Skill | `core` | Disparadors |
| --- | --- | --- |
| `core-restauracio-segellada` | true | 18 (restaura, backup, rollback, git reset…) |
| `pedra-seca` | true | 8 (disseny, css, ui, colors…) |
| `core-context-panic` | true | 5 (panic, error, people-pleasing…) |
| `socdepoble-workflow` | true | 4 |
| `universal-page` | true | 4 |
| **`skill-acte-reflex`** | **absent** | **1: «skill acte reflex»** |
| …i 11 skills més | absent | 1, sempre el seu propi nom |

**12 de les 18 skills tenen un únic disparador que és el seu propi nom en text pla.** Ningú escriu mai «skill acte reflex» ni «skill consell bundle» en una conversa. Eixos disparadors són farciment autogenerat, no disseny.

I la que ho pateix és precisament `skill-acte-reflex`: la **REGLA 0** que `.agents/AGENTS.md:10-15` qualifica de *«No negociable»* i d'*«infracció de BIOS»* si s'omet. No està marcada `core`. El seu únic disparador és impronunciable. **El motor no la carregarà pràcticament mai.**

El detall que converteix açò en diagnòstic i no en sospita: el Mestre va nomenar al prompt dues skills com a fallides, `skill-acte-reflex` i `skill-consell-bundle`. **Són exactament dues de les dotze amb disparador-fantasma.** La queixa subjectiva encaixa punt per punt amb el defecte mesurable.

Compareu ara el pressupost. Sempre carregat: **4.470 paraules**, de les quals **2.014 són `universal-page`** — una especificació de `bar-blue` i `page-header` que viatja en cada petició, també quan es redacta una acta. Mai carregat: les 1.894 paraules de REGLA 0.

> MarIA porta sempre damunt el manual de la barra blava, i mai el manual de com pensar.

L'autor del motor ja intuïa el problema: `tooling/brain/matrix.mjs:82` avisa *«sense triggers_on. Skill morta en silenci»*. Però la comprovació només detecta l'**absència** de `triggers_on`. Un disparador present però inútil passa el control amb tota naturalitat. És una porta que verifica presència, no funció.

### 2.2 Hi ha dues constitucions, i la que es carrega és la vella

`.agents/AGENTS.md:18` (§1, «UN SOL CERVELL») prohibeix expressament *«crear o llegir còpies de regles»*. N'hi ha dues, i divergeixen en tres punts:

| | `AGENTS.md` (arrel) | `.agents/AGENTS.md` |
| --- | --- | --- |
| Frontmatter | `tipus:` / `estat:` | `type:` / `status:` |
| Línia 65 | `skills/reflexio-previa/SKILL.md` — **no existeix** | `skills/skill-acte-reflex/SKILL.md` — correcte |
| §14 Acta Marmota | **absent** | present (línies 67-68) |
| Últim canvi | 2026-09-18 (`5341002d`) | 2026-09-19 (`0df9c6c7`) |

La d'arrel és la desactualitzada, i **és la que els entorns d'agents carreguen per convenció** (no hi ha `.cursor/rules` ni `CLAUDE.md` al repositori que redirigisquen a l'altra). És a dir: la llei §14 que ordena llegir l'Acta Marmota en començar la jornada **no arriba** a l'agent que ha d'obeir-la. La queixa «oblida regles establertes» és literal: eixa regla no se li ha donat mai.

Segon vector, latent: `tooling/wiki/compile-wiki-to-system-prompt.mjs:38` construeix el prompt de sistema concatenant **les dues** constitucions. El comentari de la línia 41 diu «Deduplicació per si de cas», però la línia 42 fa `new Set(allFiles)` sobre **rutes**, no sobre contingut: dues rutes distintes amb text quasi idèntic passen totes dues. El resultat seria un prompt amb la constitució duplicada i contradictòria. [SUPÒSIT] Este vector sembla inactiu: `.agents/GENOMA.md` no existeix al disc, així que o no s'ha executat mai o se'n va esborrar l'eixida.

Mesura del pressupost permanent: 3.806 paraules de regles sempre actives, de les quals **2.084 (el 55%) són la mateixa constitució dues vegades**. Instruccions duplicades però divergents són pitjors que qualsevol de les dues còpies per separat, perquè obliguen a reconciliar-les.

### 2.3 El camí de fallada apunta a dos fitxers que no existeixen

`skill-acte-reflex/SKILL.md:29-34` defineix quatre passos. Els passos 1-3 funcionen: he comprovat **les 16 files** de la taula PROTOCOLLEDGE i **totes 16 apunten a fitxers que existeixen**. La taula està sencera i cal reconéixer-ho.

El que està trencat és el **PAS 4**, el de quan no hi ha coincidència (`skill-acte-reflex/SKILL.md:32`): *«Continua amb `core-higiene-reflexa` o la plantilla `PLANTILLA_ISO_SDP.md`»*. Cap de les dues existeix. Ni `.agents/skills/core-higiene-reflexa/`, ni cap fitxer anomenat `PLANTILLA_ISO_SDP.md`.

Açò importa més que si fallara una fila de la taula, perquè el PAS 4 és exactament el camí de l'encàrrec nou, ambigu, no catalogat — el moment en què més falta fa una instrucció. I el que hi troba és el buit. Quan el protocol de «no inventes» acaba en no-res, l'única eixida que queda és inventar.

### 2.4 MarIA no inventa «MACRO_PROMPT». El fitxer existeix

Este és el punt que us demane que llegiu dues vegades, perquè capgira la premissa del prompt.

El diagnòstic del prompt diu: *«Oblida com nomenar els fitxers (ex: inventant "MACRO_PROMPT" quan només cal "PROMPT")»*.

A `_wiki_de_poble/02_saber/07_plantilles/` hi ha, ara mateix:

- `00_PLANTILLA_PROMPT_CONSELL.md` — `status: canonic`
- `02_PLANTILLA_MACRO_PROMPT.md` — **`status: canonic`**
- `03_PLANTILLA_MICRO_PROMPT.md` — **`status: canonic`**
- `04_PLANTILLA_MACRO_BUNDLE.md` — **`status: canonic`**
- `05_PLANTILLA_MICRO_BUNDLE.md` — **`status: canonic`**

No estan deprecades. No són esborranys. Són **canòniques**, a la carpeta canònica.

I encara hi ha més. He passat un detector de col·lisions d'àlies per tota la wiki. En tot el corpus només n'hi ha **dues**, i les dues són ací:

| Àlies | Documents que se'l disputen |
| --- | --- |
| `plantilla petorreta` | `00_PLANTILLA_PROMPT_CONSELL.md`, `02_PLANTILLA_MACRO_PROMPT.md`, `03_PLANTILLA_MICRO_PROMPT.md` |
| `petorreta consell` | els mateixos tres |

**Tres plantilles canòniques comparteixen exactament els mateixos dos àlies.**

Ara poseu-vos al lloc de MarIA. `skill-acte-reflex/SKILL.md:88` (l'Efecte Matrix) li ordena: *«Cerca immediatament a la Wiki… termes relacionats amb el document sol·licitat»*. Ella obeeix, busca «plantilla petorreta», i rep **tres candidats igual de canònics amb àlies idèntics**. Si la petició portava la paraula «macro», «gran» o «global», `02_PLANTILLA_MACRO_PROMPT.md` és a més el millor encaix lèxic — i la seua pròpia `description` diu *«per a auditories arquitectòniques globals del Consell»*, que és precisament el que se li demanava.

**No hi ha cap instint de fabricació ací. Hi ha recuperació correcta sobre un corpus ambigu.** Ella tria bé segons la informació que té; la informació és la que està mal. Cap porta ho detecta perquè `tooling/wiki/schema.json` valida `aliases` amb `uniqueItems: true`, que comprova la unicitat *dins* d'una llista, mai *entre* documents.

Açò reenquadra la Missió 2 sencera: el problema no és amnèsia. **És ambigüitat.** Un model no pot recordar una norma que el corpus contradiu cinc vegades amb segell de canònic.

### 2.5 Dos encaminadors que no diuen el mateix

Al camí del reflex hi ha dues taules de decisió independents:

- la taula PROTOCOLLEDGE de `skill-acte-reflex/SKILL.md:38-56`, que llig `matrix.mjs`;
- la `TAULA` de `tooling/brain/classificador_tasques.mjs:4-16`, que llig `reflex_plantilles.mjs`, que és el que el hook injecta de veritat.

Divergeixen, i es pot comprovar amb **esta mateixa tasca**. El Mestre ha demanat una *auditoria*:

- PROTOCOLLEDGE (`skill-acte-reflex/SKILL.md:42`): `auditoria, revisar, auditar` → `auditoria_canonica.md`.
- `classificador_tasques.mjs`: **no té cap clau `auditoria`**. La petició cauria en `'informe'` o `'estudi'` → `plantilla_estudi_ia.md`.

Dos camins legítims, dues plantilles distintes, cap regla de desempat. I a la taula PROTOCOLLEDGE la petició d'hui encaixa alhora a la fila d'`auditoria` i a la d'`informe`, sense precedència declarada. Afegiu-hi que el classificador puntua per `t.includes(clau)` ponderat per longitud (`classificador_tasques.mjs:19-32`), amb claus tan poc específiques com `'agent'` (5 lletres) o `'trellat'` — paraules que apareixen en quasi tota conversa d'este projecte.

L'auditoria arxivada de fa dos dies (`_wiki_de_poble/90_arxiu_historic/260917_0302_estudi_claude.md:73`) ja va reportar «tres encaminadors que no diuen el mateix». Segueixen sense unificar. **Fins i tot les auditories s'obliden**, i això també forma part del diagnòstic.

---

## 3. Missió 3 — El «cron» o «foli»

### 3.1 Ja el teniu construït, i està ben pensat

Abans de dissenyar res nou: **el cron invisible que proposeu ja existeix al repositori i l'arquitectura és correcta.**

`.agents/hooks.json` declara un hook `preflight-matrix` sobre `PreInvocation` que executa `.agents/hooks/preflight_matrix_wrapper.mjs`. Eixe embolcall:

1. s'executa **només en la primera invocació del torn** (`invocationNum !== 1` → ix sense fer res). Això és, literalment, «una vegada per cada missatge de l'usuari»: el cron;
2. extrau l'últim `USER_INPUT` del transcript;
3. passa un **termòmetre de context** (`tooling/brain/termometre_context.mjs`) que bloqueja per damunt de 150 artefactes;
4. executa `tooling/brain/reflex_plantilles.mjs` amb el text real de l'usuari i **injecta l'eixida com a `ephemeralMessage`** al context de l'agent.

I la capçalera de `tooling/brain/reflex_plantilles.mjs:2-4` enuncia el principi millor del que jo l'enunciaria:

> *«garanteix que cap tasca comence sense que la seua plantilla ISO estiga JA dins del context de l'agent. El model no decideix llegir-la: es desperta amb ella davant.»*

Això és exactament el foli. No cal inventar-lo. **Cal esbrinar per què no es nota.**

### 3.2 La pregunta que heu de respondre abans de tocar res

[SUPÒSIT — i és la incògnita més important de tot l'informe]

L'esquema de `.agents/hooks.json` (`PreInvocation`, `PreToolUse`, `injectSteps`, `ephemeralMessage`, `invocationNum`, `transcriptPath`) és el d'Antigravity. **No puc verificar des del repositori si Antigravity llig els hooks des de `.agents/hooks.json`**, perquè això depén de configuració de l'IDE que viu fora del projecte, i tinc la cerca web prohibida.

Si eixe hook **no s'està disparant**, tot el diagnòstic de la secció 2.1 és acadèmic: el foli està escrit, és bo, i no arriba. Explicaria per si sol el 100% del símptoma.

**Comproveu-ho abans que res.** La prova és barata: afegiu temporalment una marca visible a l'eixida de `reflex_plantilles.mjs` i mireu si apareix al començament d'un torn nou. Si no apareix, la reparació no és cognitiva sinó de fontaneria, i tota la resta d'esta secció pot esperar.

Un segon punt a revisar en el mateix fitxer: quan salta la febre del termòmetre, `preflight_matrix_wrapper.mjs` imprimeix els `injectSteps` i **tot seguit** fa `process.exit(1)`. [SUPÒSIT] Segons com l'amfitrió tracte un hook que ix amb codi no-zero, és probable que descarte l'`stdout` — i aleshores l'avís de febre, que és tot el sentit del mecanisme, no es lliura mai. Un *fail-closed* que es menja el seu propi missatge falla tancat i **mut**.

### 3.3 El foli: tres canvis de frontmatter abans que cap fitxer nou

Si el hook sí que dispara, la reparació és desproporcionadament barata. Per ordre de palanca:

**1r — Marcar REGLA 0 com a `core` i donar-li disparadors de persona.** És un canvi de frontmatter a `skill-acte-reflex/SKILL.md`. Amb `core: true`, `matrix.mjs:130` la carrega sempre, sense dependre de cap gallet. És el canvi amb més efecte de tot l'informe i no toca ni una línia de lògica. Els 12 disparadors-fantasma de la resta de skills volen el mateix tracte: paraules que una persona diria de veritat, com ja tenen `pedra-seca` o `core-restauracio-segellada`.

**2n — Fer lloc.** El pressupost permanent no és infinit i ara està mal repartit: `universal-page` ocupa 2.014 paraules sempre, també quan es redacta una acta. Si REGLA 0 ha de ser sempre present, `universal-page` hauria de deixar de ser-ho i passar a gallets (ja en té 4 de bons). L'intercanvi és quasi net en paraules i canvia radicalment què es recorda.

**3r — Una sola constitució.** Mentre n'hi haja dues, qualsevol regla nova té una probabilitat del 50% d'escriure's a la còpia que no es carrega. Que la d'arrel siga l'única real i que l'altra desaparega, o al revés; però una. Això allibera de colp el 55% del pressupost permanent.

**4t — Desfer l'empat dels àlies.** Els dos àlies compartits de la secció 2.4 són, segons la meua mesura, els únics dos de tot el corpus. Deixar-los en un sol document tanca la porta per on entra la «invenció» de noms.

**5é — Tancar el PAS 4.** Que apunte a alguna cosa que existisca. Mentre acabe en dos fitxers fantasma, el protocol anti-invenció obliga a inventar precisament quan més perill hi ha.

### 3.4 Què **no** faria

No afegiria un document nou de regles. El sistema ja té sis fitxers de llei sempre actius (`AGENTS.md`, `.agents/AGENTS.md`, `BOOTSTRAP.md`, `PROTOCOL_PETORRETA.md`, `BIOS.md`, `00_BIOS_COGNITIU.md`), més `ESTAT.md` amb 2.826 paraules. El problema no és que falte un foli: és que n'hi ha set i es contradiuen.

I un avís sobre el patró. `.agents/rules/00_BIOS_COGNITIU.md:9` diu de si mateix: *«Aquest document compleix amb l'exigència R5 del `tractor-registre.mjs`»*. És un fitxer escrit per satisfer un verificador, no per ser llegit — i se li nota, perquè té el títol H1 duplicat a les línies 6 i 7. Un foli nou escrit per callar una porta seria el vuité document que ningú llig. La llei ha d'anar on el motor la carrega (`core: true`), no on una porta la compta.

---

## 4. Refutacions — el que vaig creure trobar i **no** era cert

Ho pose complet i en el mateix informe, perquè una auditoria sense esta secció no es pot calibrar.

| Hipòtesi que vaig perseguir | Veredicte | Per què |
| --- | --- | --- |
| `layout.css:598-600` té una clau de més; el CSS es trenca | **REFUTAT** | Vaig comptar les claus de tots 11 fitxers CSS amb un parser que ignora comentaris i cadenes. Quadren tots. `layout.css` obri `@layer legacy {` a la línia 6 i el tanca al final. Només és format confús |
| El token `--sdp-touch` no existeix i les àrees tàctils fallen | **REFUTAT** | Està definit a `src/css/tokens.css:171`. La primera mesura la vaig fer amb un filtre mal escrit. Només queda la duplicació amb `--sdp-touch-min`, que és deute, no bug |
| Els breakpoints de JS i CSS no casen | **REFUTAT** | `App.jsx:142` usa `<= 1100` i el CSS té `max-width: 1100px` i `min-width: 1101px`. Casen exactament. Hi ha, això sí, tres breakpoints de tauleta quasi iguals (720px ×5, 768px, 800px): falta d'escala, no incoherència |
| La taula PROTOCOLLEDGE apunta a fitxers morts | **REFUTAT** | Les 16 files apunten a fitxers existents. El que està trencat és el PAS 4, no la taula |
| Alguna plantilla del classificador falta i mata el torn amb *fail-closed* | **REFUTAT** | Les 12 plantilles enrutables existeixen. El risc és latent, no actiu |
| Les regles `!important` de `legacy` trenquen `utilities` hui | **REFUTAT parcialment** | El mecanisme d'inversió és real, però ara mateix cap selector xoca. És fragilitat, no defecte. Ho he baixat de severitat en conseqüència |
| `AGENTS.md` va canviar durant l'auditoria (edició concurrent) | **FALS POSITIU MEU** | El meu `rsync` no havia copiat l'arrel. No hi va haver cap edició concurrent |

Set hipòtesis caigudes. Les que queden a les seccions 1, 2 i 3 han passat esta mateixa criba.

---

## 5. Incògnites

1. **El hook dispara?** (§3.2). No verificable des del repositori. És la primera cosa a comprovar i condiciona tota la resta.
2. **`process.exit(1)` es menja l'avís de febre?** (§3.2). Depén de l'amfitrió.
3. **`matrix.mjs` s'executa alguna vegada de veritat?** L'única invocació al repositori és `porta:matrix` (`package.json:55`), amb la frase fixa `"crear un prompt"` — és una prova de fum, no un camí d'execució. El hook crida `reflex_plantilles.mjs`, no `matrix.mjs`. [SUPÒSIT] És possible que el motor de gallets que he analitzat a §2.1 no estiga al camí real, i que el que decidisca siga només `classificador_tasques.mjs`. Si és així, §2.1 descriu una màquina apagada i §2.5 puja a defecte principal. No ho he pogut determinar sense executar res.
4. **`brain_policy.json` contra `schema.json`.** El primer exigeix frontmatter `estat`/`tipus` (`tooling/brain/brain_policy.json:58-62`); el segon accepta `type`/`status` **i** `tipus`/`estat` com a claus vàlides alhora. Per això les dues constitucions poden divergir en vocabulari sense que cap porta es queixe. No he auditat quin dels dos valida en quin moment.

---

## 6. Bateria de veritat

- [x] He citat només rutes reals, en format `ruta:linies`, reverificades contra l'arbre viu després del tall.
- [x] Cap nom de fitxer, funció o variable inventat. Els que dic que no existeixen, he comprovat que no existeixen.
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites.
- [x] No he modificat cap fitxer del sistema. Ni codi, ni skills, ni portes. Només he creat este informe.
- [x] No he executat cap script que escriga a disc, i dic explícitament quins he evitat i per què.
- [x] Cap bloc de codi aplicable. Tota l'explicació és teòrica, sense parells ruta+bloc que cap IDE puga interpretar com a *patch*.
- [x] Secció de refutacions inclosa amb set hipòtesis caigudes.
- [x] Este document passa `tooling/wiki/tractor-frontmatter.mjs --estricte`: executat amb `--mostra=400`, no apareix en cap de les vuit lleis. El deute que la porta reporta és previ i, en tres quartes parts, l'eco descrit a §1.7.

---

**Ancoratge de Seguretat:** [[00_INDEX_ESCRIPTORI]]
