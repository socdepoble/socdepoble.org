---
type: informe
status: esborrany
description: Auditoria de la fallada de context, els 121 avisos d'ESLint, la modularitat de l'UniversalWorkspace i l'espill de skills a produccio, amb tall a HEAD 0ffda7a7.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_faad1a46-4417-4913-bd10-a5ea9baae1ba:040f2e41-dee3-408e-b611-f507e7acbe1d
---
# Auditoria Claude · Olivera 260923_1515

Esta auditoria és de només lectura. **Cap línia de codi s'ha tocat** (Mode AFK, Protocol §3). L'únic fitxer escrit és este.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_faad1a46-4417-4913-bd10-a5ea9baae1ba:040f2e41-dee3-408e-b611-f507e7acbe1d |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T13:42:38.625Z |
| Modificació | 2026-09-23T13:42:38.625Z |
| Propietari | agent-local (Claude) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Ruta | `auditoria` |
| Torn | `torn_faad1a46-4417-4913-bd10-a5ea9baae1ba` · abast **code** · obert 13:30Z |
| Tall d'evidència | HEAD `0ffda7a7` (2026-09-23 14:59:58 +0200) · lint fresc 13:34:56Z |
| Petorreta origen | `260923_1515_prompt_conjunt_olivera.md` |
| Mode AFK | **sí · zero línies de codi tocades** |
| requires_human_decision | **true** (T-08: decisió A/B/C sobre 20 arguments) |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

Llegits íntegrament abans d'auditar: `.agents/skills/core-automillora/SKILL.md` (ordre directa de la petorreta) · `AGENTS.md` · `.agents/QUI_SOC.md` · `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v2.3.0) · el Pla de MarIA · `eslint.config.js` · `tooling/wiki/schema.json` · `.claude/settings.json` · i, després del bloqueig de la Porta Reflex, la plantilla canònica d'auditoria.

**Confessió necessària, i és una dada de l'auditoria, no una disculpa:** el meu primer intent d'escriure este document **el va bloquejar `porta-reflex.mjs`**. Jo havia conclòs, amb un `grep` mal construït sobre `.agents/protocolledge.json`, que no existia cap ruta d'auditoria al contracte. La porta em va parar, em va dir la plantilla exacta i les seues set seccions, i em va obligar a demanar el rebut. **La ruta existia; el meu `grep` buscava `"x.y"` amb punt i la ruta es diu `auditoria`, sense punt.**

Això té valor probatori directe sobre la Directiva 1: **la porta mecànica va fer exactament el que el bootloader declaratiu no fa.** Amplie a T-05 i T-09.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **v1.0.0 (260923_1535):** Primera entrega. Quatre directives de la petorreta conjunta i quatre troballes fora d'encàrrec. Corregida en redacció la troballa sobre l'absència de ruta `auditoria` (era falsa; vegeu Acte reflex i T-09).
- **v1.1.0 (260923_1548):** Llegida `260923_1532_auditoria_codex.md` i afegida la secció «Reunió a l'Olivera · contrast amb Codex». **Tres xifres meues corregides amb la seua evidència** (`PUBLIC_WIKI_DIRS` en lloc de `WIKI_DIR`, 17 skills en lloc de 16, 68 documents en lloc de «76 entrades»). Cap conclusió revertida; la de la Directiva 4 s'endurix. Adoptada la seua anàlisi del risc dels `exhaustive-deps` i matisada la severitat de T-03 a petició seua.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum executiu

Quatre directives, quatre respostes curtes:

1. **No són els agents: és el bootloader.** `context_preflight.mjs` — el component que havia de garantir la lectura de plantilles i skills abans de la primera inferència — té **quatre funcions amb el cos buit**, retorna **sempre `ready: true`** i **no el crida ningú**. No cal `n8n`.
2. **Els 121 no són el que diu la petorreta, i matar-los no deixa el linter en verd.** Són 109 `no-unused-vars` + **12 `react-hooks/exhaustive-deps`**.
3. **L'`UniversalWorkspace` està ben dissenyat i mal endollat**, i porta el valencià cablejat dins del motor — el contrari del que ordena la doctrina.
4. **No.** `_wiki_de_poble/05_skills_ia/` **no existeix**, i el manifest publicat anuncia en text visible que el mirall està «pendent de generació».

**Troballa transversal, que val més que les quatre:** el mateix patró travessa totes. Maquinària escrita, ben pensada i **desendollada**. Els avisos d'ESLint de `tooling/` no són brossa cosmètica: **són el rastre que assenyala on està l'òrgan mort.** Purgar-los a cegues esborraria l'única evidència que en queda.

---

### Directiva 1 · La fallada de context

#### T-01 · El bootloader determinista és un cos buit que sempre diu «endavant»

- **Fitxer:** `tooling/wiki/lib/context_preflight.mjs`
- **Severitat:** **crítica** — és el component dissenyat precisament per a impedir el que la petorreta denuncia.
- **Font de veritat en conflicte:** `AGENTS §0` (Acte Reflex pre-prompt) i la capçalera del propi fitxer: *«Implementació del Bootloader determinista extern al model (Segons Codex Fase 1)»*.

Quatre funcions no fan res:

| Línia | Funció | Cos complet |
| --- | --- | --- |
| 74 | `loadCanonicalRegistry()` | `// Carrega 00_INDEX_SKILLS.md` → `return {}` |
| 79 | `routeSkills(contract, registry)` | `// Torna llista d'identificadors` → `return []` |
| 84 | `extractDependencies(skills)` | `return []` |
| 127 | `retrieveJIT(questions, indexDigest)` | `return []` |

Conseqüència aritmètica a `preflight()` (línies 26-29):

```
mandatory = explicitSources ∪ ['.agents/BOOTSTRAP.md', '.agents/AGENTS.md'] ∪ []
```

**Cap skill. Cap plantilla. Mai.** I la línia 52 retorna `ready: true` literal i constant, passe el que passe. La línia 31 porta el comentari `// Fail-closed read` sense complir-lo.

Els cinc «arguments no utilitzats» que ESLint marca ací (`contract`, `registry`, `skills`, `questions`, `indexDigest`) **són la signatura d'un contracte que ningú ha implementat**.

- **Evidència reproduïble:** `sed -n '74,129p' tooling/wiki/lib/context_preflight.mjs`
- **Proposta conservadora:** no esborrar res. Implementar, o fer que `preflight()` faça `throw new Error('NO_IMPLEMENTAT')` perquè falle tancat, com mana `AGENTS §10`.

#### T-02 · I ningú el crida

- **Severitat:** **crítica** (agreuja T-01).
- **Evidència reproduïble:**

```bash
grep -rn "preflight(" --include="*.mjs" --include="*.js" . | grep -v node_modules
# → tooling/wiki/lib/context_preflight.mjs:19   (la pròpia declaració)
```

Una sola línia: la definició. **Zero importacions, zero invocacions.** Les úniques altres aparicions del nom al repositori són hashes dins de `.agents/runtime/turns/*.json` — segellat d'integritat, no execució. **El sistema està segellant criptogràficament un fitxer que mai s'executa.**

- **Proposta conservadora:** decidir-ho explícitament: endollar-lo a `UserPromptSubmit`, o declarar-lo mort i moure'l a quarantena. Mentre existisca en este estat, qualsevol porta futura que s'hi recolze naixerà verda i cega.

#### T-03 · El validador que havia d'agarrar l'incident està retirat per escrit

- **Fitxer:** `tooling/wiki/lib/prompt_sgq.mjs:67`
- **Severitat:** **alta** — explica l'incident concret que motiva esta petorreta.
- **Evidència reproduïble:** comentari literal al codi, línia 68:

> *«Desactivat: El validador d'estructura SGQ s'ha retirat com a decisió arquitectònica per permetre l'evolució lliure de les plantilles de prompt sense trencar scripts antics com crear_bundle.»*

`canonicalSections(template)` → `return []`. I `CANONICAL_HEADINGS` (línia 52) queda assignat i mai llegit.

**Això tanca el cas de l'incident.** MarIA va poder generar un prompt sense respectar `prompt_local.md` perquè el component que comprova que un prompt segueix la seua plantilla **està desactivat per decisió arquitectònica documentada**. No va ser desídia: no hi havia porta.

- **Font de veritat en conflicte:** `wiki-documentacio-i-reflex §1` («L'Efecte Matrix»), que dóna per suposada una barrera que el codi ha retirat.
- **Proposta conservadora:** cap canvi immediat. Portar-ho al Mestre: o es reactiva el validador amb la llista de seccions per ruta (que **ja existeix** a `protocolledge.json` → `seccions`), o s'assumeix per escrit que la comprovació és humana.

#### T-04 · Un tercer òrgan mort, i una col·lisió de noms perillosa

- **Fitxer:** `tooling/wiki/lib/persona_router.mjs` (933 bytes)
- **Severitat:** **mitjana** (el fitxer), **alta** (la col·lisió).

Tres fallades apilades i cap senyal:

1. **Ningú l'importa** (verificat per grep).
2. Carrega `.agents/skills/socdepoble-iaia-actriu/PERSONA_ROUTER.json` dins d'un `try`. **Eixe directori no existeix.**
3. El `catch (e)` de la línia 11 engoleix l'error en silenci i cau a un fallback (`default: "La_Maquina"`).

És l'avís `'e' is defined but never used` de la línia 11 — un altre avís que és una làpida, no brossa.

> ⚠️ **AVÍS PER A QUI EXECUTE LA NETEJA.** El hook real de `.claude/settings.json` crida `tooling/session/persona_router.mjs` (5.422 bytes, **viu i funcionant**). Són **dos fitxers homònims amb destins oposats**. Qui llija l'`ESTAT.md` («`persona_router.mjs --punters` a `UserPromptSubmit`») no pot saber de quin parla. **No toqueu el de `tooling/session/`.**

- **Evidència reproduïble:** `find . -name "persona_router*" -not -path './node_modules/*'` → dos resultats. `ls .agents/skills/socdepoble-iaia-actriu/` → no existeix.
- **Proposta conservadora:** reanomenar un dels dos abans de cap neteja. No esborrar l'òrfen fins que el Mestre decidisca si la persona-actriu es reprén.

#### T-05 · El que SÍ que funciona (i on s'ha de construir)

- **Severitat:** informativa — **és la bona notícia de l'auditoria**.

Els hooks de `.claude/settings.json` funcionen de veres, i tinc dues proves d'esta mateixa sessió:

1. **`UserPromptSubmit`:** he rebut el Router cognitiu abans del meu primer token, nomenant quatre skills amb la seua ruta.
2. **`PreToolUse`:** `porta-reflex.mjs` **m'ha bloquejat l'escriptura d'este document tres vegades** i m'ha corregit una conclusió errònia (vegeu Acte reflex i T-09). No vaig poder ometre-ho ni vaig tindre l'opció de no fer-li cas.

Hi ha, doncs, **dos sistemes paral·lels de càrrega de context**: un declaratiu i mort (`context_preflight`), i un imperatiu i viu (hooks + `despertar.mjs` + `porta-reflex.mjs` + `porta-olivera.mjs`). El segon ja fa la meitat de la faena del primer, i hui m'ha demostrat empíricament que la fa.

#### Resposta a la pregunta del Mestre

> *«És possible millorar el nostre propi sistema de prompts i enganxalls, o hem de delegar-ho a sistemes externs com n8n?»*

**Ni una cosa ni l'altra: heu d'endollar el que ja teniu.** `n8n` orquestra crides entre serveis; no pot forçar un model a llegir un fitxer abans de raonar. Eixa palanca només existeix **dins** del cicle de vida de l'agent, i ja la teniu comprada, instal·lada i funcionant: els hooks.

Per ordre de rendiment:

1. **`SessionStart` ha d'imprimir el contingut, no la ruta.** És l'única intervenció amb garantia física: el que el hook escriu a stdout entra al context abans del meu primer token. Hui el Router cognitiu em dóna *rutes* («obri les que no tingues»), i eixa obertura depèn de la meua disciplina. **Que en depenga és precisament el defecte que esteu auditant.** Per a les 3-4 skills que el router considere crítiques per al torn, volqueu el text sencer.
2. **Estendre `porta-reflex.mjs` als documents sense ruta declarada.** Hui ja exigeix rebut, plantilla i seccions completes als documents amb ruta — ho he patit i funciona. Que un `Write` d'un fitxer `*_prompt_*.md` o `*_petorreta_*.md` exigisca haver llegit la plantilla en este torn tanca el forat que va permetre l'incident.
3. **Ompliu o mateu `context_preflight.mjs`** (T-01, T-02).

**Opinió sincera, que és el que demaneu:** la frustració del Mestre està ben dirigida i mal adreçada. Sí que hi ha un problema real de comportament — els agents no busquem per instint, fem el que el prompt ens demana i prou. Però la solució no és una quarta regla escrita: ja n'hi ha tres (`AGENTS §0`, `wiki-documentacio-i-reflex §1`, `core-automillora`) i diuen el mateix. **Una norma que cal repetir tres vegades no és una norma incomplida: és una porta que falta.** La quarta tampoc funcionarà. El hook, sí — i hui n'heu vist la prova en directe.

---

### Directiva 2 · ESLint

#### T-06 · La xifra és exacta i la descripció és errònia

- **Scope:** `npm run lint` = `eslint src tooling scripts tests --max-warnings=0`
- **Severitat:** **alta** — la tasca, tal com està redactada, no pot arribar al verd que demana.
- **Evidència reproduïble:** `npx eslint src tooling scripts tests -f json` (tall propi 13:34:56Z, coincident amb `lint_results.json` dins d'abast):

| Regla | Compte |
| --- | --- |
| `no-unused-vars` | **109** |
| `react-hooks/exhaustive-deps` | **12** |
| **Total** | **121** |

La petorreta diu «121 warnings de variables no utilitzades». **121 és el total de l'abast; les variables no utilitzades són 109.**

**Conseqüència operativa:** amb `--max-warnings=0`, purgar els 109 deixa 12 i **`npm run lint` continua eixint amb codi 1**. Els 12 restants són decisions de correcció una a una, no neteja, i estan tots a `src/`:

```
src/PedraSecaEmbed.jsx:44                          src/hooks/useResolvedAsset.js:33
src/app/contexts/CoreContentContext.jsx:46, :66    src/app/contexts/RouterContext.jsx:124
src/components/universal/graph/useForceLayout.js:153
src/components/universal/workspace/WorkspaceContext.jsx:166
src/sections/dispositius/DevicesSection.jsx:80, :140
src/sections/multimedia/MultimediaContext.jsx:38   src/sections/mur/MurContext.jsx:41
src/sections/xat/XatContext.jsx:247
```

- **Proposta conservadora:** torn separat, després dels 109.

#### T-07 · Dos terços del soroll no són codi nostre

- **Severitat:** **mitjana** — risc de destrossar codi de tercers.
- **Evidència reproduïble:** `eslint .` sense abast (que és d'on ix el `lint_results.json` de 5,8 MB) dóna **426 missatges**:

| Origen | Missatges | dels quals `no-unused-vars` |
| --- | --- | --- |
| `_wiki_de_poble/.obsidian/plugins/` | **281** | 68 |
| Codi de Sóc de Poble | 145 | 115 |

**281 avisos (66%) són del plugin `notebook-navigator` d'Obsidian** — codi de tercers, compilat, dins del vault. **Cap zafarrancho l'ha de tocar mai.** La configuració actual els deixa fora per abast, però **no per `ignores`**: qualsevol `eslint .` futur els tornarà a traure i tornarà a espantar.

- **Proposta conservadora:** una línia a `eslint.config.js:8` → afegir `'**/.obsidian/**'` als `ignores`.

#### T-08 · Els 109: anatomia, risc i **decisió humana requerida**

- **Severitat:** **alta**. `requires_human_decision: true`.

| Categoria | Compte | Risc d'esborrar |
| --- | --- | --- |
| Definits i no usats (imports, `catch (e)`, declaracions) | 49 | **Baix** |
| Assignats i no llegits | 40 | **Mitjà** — cal comprovar efectes laterals de la crida |
| **Arguments de funció** | **20** | **Alt** |

Distribució: **`tooling/` en té 76 (70%)**, `scripts/` 12, **`src/` només 19 (17%)**, `tests/` 2.

Això importa per la **Llei del Píxel** (`sdp-workflow`, 260923): el 83% del deute és a maquinària interna, on no hi ha píxel que moure. **Els 19 de `src/` són l'únic tram amb risc visual.**

**Els 20 arguments són el nus, i estan tots a `tooling/wiki/`.** No són variables: són la signatura d'una funció, i esborrar-ne un del mig trenca totes les crides per posició. Quasi tots pertanyen a les funcions buides de T-01 i T-03, més estos dos:

```
tooling/wiki/reflex_document.mjs:9   prepararDocument(tipus, documentId)
                                     → throw new Error('Prepare bloquejat…')
tooling/wiki/reflex_document.mjs:31  promoureDocument(esborranyPath, destinacioRelativa, preimatgeSha256)
                                     → throw new Error('Promote bloquejat…')
```

**Són stubs deliberats amb el contracte declarat a la signatura.** Esborrar-los els arguments és esborrar l'única documentació que diu què hauria de rebre eixa funció el dia que algú la implemente.

##### El conflicte que he de posar damunt la taula

El Mestre diu: *«Res de posar `_` per amagar el deute.»* Però `eslint.config.js:69` diu, per a `tooling/wiki/**`:

```js
'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }]
```

**La configuració del repositori ja preveu el `_` exactament a la zona on viuen els 20 arguments, i la doctrina el prohibeix.** Una de les dues ha de cedir, i no és decisió meua.

Aplique la lliçó **«Prohibició sense substitut = Fusible»** (`sdp-workflow`, 260923): la regla diu quina forma no s'ha d'usar i no en designa cap altra; el substitut **es demana, no es dedueix**.

| | Opció | Efecte | Cost |
| --- | --- | --- | --- |
| **A** | Implementar les funcions buides | Els 20 avisos moren **de veritat**: els arguments passen a usar-se | Alt. És arquitectura, no neteja |
| **B** | Buidar les signatures (`function routeSkills() {}`) | Verd immediat | **Es perd el contracte escrit** |
| **C** | Prefix `_` (ja configurat a la línia 69) | Verd immediat, contracte intacte, marca explícita de «pendent» | Contradiu l'ordre del Mestre |

**Recomanació:** **A** per a `context_preflight.mjs` (és el cor de la Directiva 1) i **C** per als dos de `reflex_document.mjs`, que són `throw` deliberats i el seu deute és de disseny, no tècnic. Però **A i C són decisions del Mestre**, i per això entregue la consulta en lloc de l'execució.

##### Eina ja existent al repositori

`tooling/scripts/llevar-imports-orfes.mjs` ja fa la part segura, i la fa bé: reconstruïx la sentència `import` des de l'AST amb `espree` en comptes d'entretallar comes (que és el que trenca els imports multilínia), té mode assaig per defecte i **no toca variables locals, ni arguments, ni `catch`**. És exactament la disciplina correcta.

```bash
node tooling/scripts/llevar-imports-orfes.mjs
```

##### Pla d'execució, preparat i **no executat**

Mode AFK. Quan el Mestre l'alce:

1. `llevar-imports-orfes.mjs --escriu` → imports orfes (subconjunt dels 49 de risc baix).
2. `catch (e)` no usats → `catch { }` sense binding. **ES2019, dins del Baseline 2022.** No és amagar deute: és la forma correcta de dir «no m'interessa l'error».
   ⚠️ **Excepció:** els 6 de `tooling/wiki/pre-commit.mjs` (L38, 55, 71, 74, 123, 131) **no** s'han de convertir sense mirar-los. Són errors engolits en silenci **al pre-commit**, i mereixen auditoria pròpia.
3. Els 40 assignats-i-no-llegits, un per un, comprovant efectes laterals.
4. Els 20 arguments: **només després de la decisió A/B/C**.
5. Els 12 `exhaustive-deps`: torn a banda.
6. `eslint.config.js` → `'**/.obsidian/**'` als `ignores` (T-07).

Verificació obligatòria a cada pas: `npm run test:node` + `npm run porta`, i Llei del Píxel per als 19 de `src/`.

---

### Directiva 3 · «Obsidian Total»: som modulars?

**Diagnòstic: el disseny és notable, l'endollament és mitjà, i hi ha una contradicció idiomàtica que el Mestre voldrà saber.**

#### El que està ben fet (i és molt)

`UniversalWorkspace.jsx:56-74` és un component genuïnament desacoblat:

```jsx
export function UniversalWorkspace({
  model = {},                              // dades injectades: no les va a buscar ell
  renderItem, renderDetail,                // render props: el domini el posa qui el crida
  labels = {}, icons = SENSE_ICONES,       // textos i icones injectats
  tagFilter, collapsibleNavigation, sortable, ...
})
```

**No sap res del seu domini.** No importa Supabase, no importa cap context de Sóc de Poble, no sap si mostra notes, wiki o usuaris. Això permet que cinc seccions ben diferents (Wiki, Admin, Notes, Perfil, Disseny) el reutilitzen sense tocar-lo. Suma-hi `SlotErrorBoundary`, que aïlla cada slot perquè un error al detall no tombe la llista. **Açò és arquitectura de plugin de manual.**

#### T-10 · La màquina parla valencià per dins

- **Fitxer:** `src/components/universal/workspace/UniversalWorkspace.jsx:28-44`
- **Severitat:** **mitjana**, però **contradiu frontalment la doctrina que la petorreta estableix**.
- **Font de veritat en conflicte:** la petorreta, Directiva 3: *«L'UniversalWorkspace és una màquina, un plugin internacional, i NO s'ha de traduir.»*

```js
const DEFAULT_LABELS = {
  categories: 'CATEGORIES',  items: 'ELEMENTS',  create: 'CREAR',
  search: 'Cercar elements',  untitled: 'Sense títol',
  error: 'No s’han pogut carregar les dades.',  ...
};
```

Les **claus** són angleses (correcte: és l'API de la màquina). Els **valors per defecte** són valencians. **Hui no cal traduir el Workspace perquè ja ve traduït de fàbrica** — que és el mateix problema pel costat contrari.

El mecanisme correcte ja hi és: `labels = {}` es fusiona amb els defaults (línia 75). **La correcció és moure els valencians des del motor cap a les cinc seccions que el criden.**

- ⚠️ **Canvi de superfície visible.** Si s'executa malament es veuen etiquetes en anglès a la interfície: **Llei del Píxel**. Necessita ordre expressa i verificació visual a `localhost:3340`.

#### T-11 · La dependència va en el sentit equivocat

- **Fitxer:** `UniversalWorkspace.jsx:3-4`
- **Severitat:** **mitjana**.

```jsx
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
```

El «plugin internacional» importa el layout del nucli. **L'`UniversalWorkspace` no es pot muntar en cap aplicació que no tinga `AppGridShell`.** Resposta literal a la pregunta del Mestre («podria funcionar en qualsevol lloc del món?»): **no, només dins de Sóc de Poble.**

Acompanyat de tres fuites menors:

- **`src/sections/notes/NotaFitxa.jsx:1`** importa `ItemMedia.jsx`, un intern del workspace, saltant-se el barrel.
- **El barrel existeix i ningú l'usa:** hi ha `workspace/index.js`, però **4 dels 5 consumidors importen per ruta profunda**; només `PerfilShell.jsx` el fa servir.
- **No hi ha registre de plugins.** Cap punt d'extensió declarat: la modularitat és per convenció, no per contracte. Funciona amb 5 consumidors; no escala a 20.

**Proposta conservadora:** rebre el contenidor per prop, fer obligatori el barrel, i tancar la fuita d'`ItemMedia`. Tres canvis acotats, cap redisseny.

#### Veredicte de modularitat: **6/10**

Sóc de Poble **no** podria endollar un altre editor sense tocar codi: caldria editar 5 seccions i arreglar la fuita. Però el contrari — **muntar un domini nou damunt de l'`UniversalWorkspace` existent sí que funciona sense tocar-lo**, i això és el 80% del valor d'un sistema de plugins.

**No heu pecat d'acoblament greu; heu deixat la frontera sense vigilar.**

---

### Directiva 4 · Espill de skills a producció

**Resposta directa: no, i el manifest publicat ho diu en text visible a la web.**

#### T-12 · La carpeta de la pregunta no existeix, i les skills queden fora del compilador

- **Severitat:** **alta**.
- **Evidència reproduïble:**

```bash
ls _wiki_de_poble/05_skills_ia/     # → No such file or directory
grep -n "PUBLIC_WIKI_DIRS" tooling/wiki/compile-wiki-to-app.mjs
# → 25: export const PUBLIC_WIKI_DIRS = Object.freeze(['01_ser', '02_saber', '03_actuar']);
ls -d .agents/skills/*/ | wc -l    # → 17
```

Les carpetes reals de la Wiki són `01_ser/`, `02_saber/`, `03_actuar/`, `04_escriptori/`, `10_actes/`, `90_arxiu_historic/`. **Les skills viuen a `.agents/skills/`** (**17** directoris amb el seu `SKILL.md`), que és una altra branca de l'arbre.

> 🔄 **Corregit després de llegir l'auditoria de Codex.** Jo havia citat `WIKI_DIR = '_wiki_de_poble'` (línia 21). **La constant que governa la publicació és `PUBLIC_WIKI_DIRS` (línia 25), i només conté tres carpetes.** La conclusió no canvia — s'endurix: el compilador no només deixa fora `.agents/skills/`, sinó també `04_escriptori/`, `10_actes/` i `90_arxiu_historic/`. També he corregit 16 → **17** skills, comptades per Codex i verificades per mi. La seua evidència era més precisa que la meua.

**Cap skill entra al manifest per este camí, ni ara ni mai, mentre eixa llista no canvie.**

**Bona notícia parcial:** el cablejat del build **sí que funciona**. `package.json` té `prebuild: node tooling/wiki/compile-wiki-to-app.mjs && …`, i npm l'executa automàticament abans de `build`. **El problema no és que el compilador no córrega: és l'abast d'on llig.**

#### T-13 · El manifest publicat anuncia el forat en text visible

- **Fitxer:** `src/data/wikiManifest.js` (**68 documents** + 8 categories = 76 entrades `"id"`; el compte de documents és el de Codex, verificat)
- **Severitat:** **alta** — es publica a producció.
- **Evidència reproduïble:** `grep -o "BROKEN LINK: [a-z_]*" src/data/wikiManifest.js | sort | uniq -c`

El manifest conté este text, que es serveix a la web:

> *«## 🪞 Mirall d'Agents i Skills — Aquest directori està generat automàticament des de l'arrel oculta `.agents`. (…) **Nota: L'índex mirall s'ha traslladat o està pendent de generació.**»*

I **9 enllaços trencats**, dels quals **7 apunten precisament a `skills`**:

```
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
```

El `<!-- TODO: fix link -->` **s'està servint a producció**. La plantilla `auditoria_canonica.md` que he hagut de llegir per a escriure este document **en porta un a la seua línia 114**: la font original ja el té.

- **Proposta conservadora:** feina acotada — ampliar el compilador amb una segona font (`.agents/skills/**/SKILL.md` → categoria `skills`) i fer que els 7 enllaços resolguen. **No ho he fet: no està a l'encàrrec i toca el que es publica.**

---

### Troballes fora d'encàrrec

#### T-09 · El contracte documental i el Protocol de l'Olivera fregen (versió corregida)

- **Severitat:** **baixa** (rebaixada des de «alta» després que la porta em corregira).

**La meua conclusió inicial era falsa i la deixe escrita a propòsit**, perquè la correcció és la troballa: vaig concloure amb un `grep` mal construït que no existia ruta d'auditoria al contracte. **Existeix: es diu `auditoria`, sense punt**, amb plantilla `auditoria_canonica.md` i set seccions. `porta-reflex.mjs` em va bloquejar i m'ho va dir. Este document en té rebut persistent.

**El que sí que queda, i és menor:**

1. `tooling/wiki/schema.json` admet `type: informe` però no `auditoria`, mentre el Protocol §2 ordena *«utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe"»*. Són dues capes distintes (nom de fitxer vs. camp) i **no es contradiuen formalment** — el contracte ja ho resol declarant `tipus: informe` per a la ruta `auditoria` — però la fricció de lectura és real.
2. **El missatge de recuperació de `porta-reflex.mjs` és incomplet, i m'ha costat tres bloquejos.** Diu: *«Recuperació: `document.mjs context --turn-id ID --route ID --file CAMÍ`»*. Però `context` només entrega la plantilla; el camp `reflex:` del frontmatter (que és el que la porta exigeix) només el posa **`document.mjs create`**. I després la porta exigeix, a més, que **totes** les seccions estiguen completes en una sola escriptura: una edició parcial que deixe un `[pendent]` es rebutja. La skill `wiki-cicle-de-vida §2` sí que nomena `create`; el missatge d'error, no.

- **Proposta conservadora:** ampliar el missatge de `tooling/gates/porta-reflex.mjs:72` perquè nomene `create` i advertisca que el document s'escriu sencer. **És una cadena de text, i és el canvi amb millor relació cost/benefici de tota esta auditoria.**

#### T-15 · El Pla de l'Olivera no valida, i és això el que bloqueja el meu torn

- **Fitxer:** `_wiki_de_poble/04_escriptori/260923_1515_pla_implementacio_olivera.md`
- **Severitat:** **alta** — impedix mecànicament tancar cap torn d'esta reunió.
- **Evidència reproduïble:**

```bash
node tooling/wiki/document.mjs plan --turn-id torn_faad1a46… \
  --file _wiki_de_poble/04_escriptori/260923_1515_pla_implementacio_olivera.md
# → Pla invàlid: frontmatter: propietat desconeguda title; frontmatter.status: fora de l'enum
```

Tres defectes menuts al frontmatter, tots de correcció trivial:

| Camp | Valor actual | Problema | Correcció |
| --- | --- | --- | --- |
| `title` | «Pla d'Implementació de l'Automillora…» | **No existix** a `schema.json` | Llevar-lo; el títol va al `# H1` |
| `status` | `consensuat` | Fora de l'enum | `actiu` (l'enum és `canonic, actiu, esborrany, arxivat, quarantena, generat, futur`) |
| `reflex` | `sdp:torn_immediat_olivera` | No és un rebut emés; el format real és `sdp:torn_<uuid>:<uuid>` | `document.mjs context --route pla.implementacio` |

**Per què importa més del que sembla:** `tancament.mjs --check` reporta «Pla absent o modificat» i «El torn encara no està planificat» per a **qualsevol** torn que intente vincular-s'hi. Mentre el Pla no valide, **ni el meu torn ni el de Codex ni el de MarIA poden arribar a `closed`**, per molt que les auditories siguen correctes. És el coll d'ampolla real de la jornada, i costa tres línies d'arreglar.

- **No l'he tocat:** és document de MarIA i estic en Mode AFK. **Ho deixe ací perquè és el primer que s'ha de fer quan l'AFK s'alce**, abans que qualsevol neteja d'ESLint.

#### T-14 · `lint_results.json` és a l'arrel del repositori

- **Severitat:** **baixa**.
- **Font de veritat en conflicte:** `AGENTS §3` (cap fitxer de treball a l'arrel del repo).
- **Evidència:** 5,8 MB, `git status` el marca com a `??`, sense seguir.
- **Proposta conservadora:** moure'l a l'Escriptori o afegir-lo al `.gitignore`. **No l'he tocat** (Mode AFK i zona de decisió del Mestre).

---

### Proposta de millora de `prompt_local.md` (Protocol §4)

Quatre esmenes, totes nascudes de fregar-me amb la plantilla hui:

1. **Camp «Xifres verificables» al Registre.** La petorreta deia «121 warnings de variables no utilitzades»; eren 109 + 12. Una casella que obligue a escriure *l'ordre exacta que produïx la xifra* faria cada número reproduïble. Hui els números viatgen sense procedència.
2. **La §0 ha de verificar que les rutes citades existisquen.** La casella «Escriptori classificat» es va marcar `[x]` mentre el text nomenava `_wiki_de_poble/05_skills_ia`, que no existeix (T-12). Un `test -e` sobre cada ruta citada tancaria el forat abans d'eixir del Mas.
3. **Declarar l'AFK al Registre, no al peu.** La petorreta demana «polvoritzeu d'arrel» (Directiva 2) i «cap línia de codi» (Protocol §3). He resolt a favor del Protocol per ser la clàusula més explícita i recent, però **he hagut de triar, i una altra IA pot triar distint**. Un camp `Mode AFK: sí/no` a la taula de dalt ho tanca.
4. **Nomenar la ruta documental del lliurable dins la pròpia petorreta.** Si haguera dit «la vostra auditoria va per la ruta `auditoria`», m'hauria estalviat el grep dolent i tres bloquejos. La petorreta ja nomena la ruta del *seu* document; que nomene també la del document que demana.

---

### Reunió a l'Olivera · contrast amb l'auditoria de Codex

He llegit `260923_1532_auditoria_codex.md`, lliurada tres minuts abans que la meua i **sense que cap de les dues poguera veure l'altra mentre s'escrivia**. Això la converteix en una verificació creuada independent, que és exactament per a què servix este protocol.

#### On coincidim sense haver-ho acordat

- **La xifra del linter.** Codex: *«0 errors i 121 avisos: 109 `no-unused-vars` i 12 `react-hooks/exhaustive-deps`»*. Idèntic al meu T-06, obtingut per separat. **La xifra de la petorreta està mal descrita i tots dos ho hem vist.**
- **Que purgar els 109 no deixa el linter en verd.** Els dos ho diem amb les mateixes paraules.
- **Que el `lint_results.json` barreja tercers i superfícies fora d'abast**, i que no s'hi ha de fer cap escombrada (el meu T-07, la seua secció 2). Els seus números — 231 errors + 195 avisos = 426 — quadren exactament amb els meus.
- **Que els stubs no es poden netejar com si foren brossa.** Codex: *«una variable morta no autoritza a eliminar una garantia»*. És la mateixa conclusió que el meu T-08, dita millor.
- **Que `n8n` no resol el problema** i que primer cal completar el mecanisme local.
- **Que les skills no arriben al manifest públic** (T-12).
- **Que l'`UniversalWorkspace` té separació real però acoblament a la infraestructura**, i que el nom ha de continuar en anglès.

#### On Codex m'ha corregit, i té raó

Tres xifres meues eren imprecises. **Les he verificades i corregides al cos d'esta auditoria** (marcades amb 🔄):

| | Jo deia | Codex deia | Verificat |
| --- | --- | --- | --- |
| Constant del compilador | `WIKI_DIR = '_wiki_de_poble'` | `PUBLIC_WIKI_DIRS = ['01_ser','02_saber','03_actuar']` | **Codex** (línia 25) |
| Skills a `.agents/skills/` | 16 | 17 | **Codex** (`ls -d` → 17) |
| Documents al manifest | «76 entrades» | 68 documents | **Codex** (76 − 8 categories) |

La correcció de `PUBLIC_WIKI_DIRS` **endurix** la conclusió de la Directiva 4 en lloc de debilitar-la: el compilador no només deixa fora `.agents/skills/`, sinó també `04_escriptori/`, `10_actes/` i `90_arxiu_historic/`. La meua conclusió era correcta amb l'evidència equivocada, que és precisament el defecte que esta reunió ha d'agarrar.

#### On Codex aporta el que jo no tenia

- **`core-automillora` té `triggers_on: []` i el catàleg la rebutja.** `encamina("core-automillora automillora zafarrancho", index)` retorna `[]`. **Això és greu i és nou per a mi:** la skill que el Mestre em va ordenar llegir expressament a la petorreta **no la selecciona el router**. Jo la vaig llegir perquè la petorreta m'ho manava per escrit, no perquè el sistema me l'entregara. És la prova més neta de tota la jornada que el problema de context és de cablejat i no de voluntat.
- **`carregaIndex()` només reconstruïx l'índex si falta o no es pot parsejar**, així que una skill editada pot deixar disparadors rancis sense invalidació. Explica per què `core-automillora`, creada hui mateix, no s'encamina.
- **El dialecte de Codex.** `porta-reflex.mjs` normalitza `tool_input` (Claude) i `toolArgs` (Antigravity), **però no reconstruïx un patch de Codex**. Les portes que hui em bloquegen a mi **no cobrixen Codex**. Això matisa el meu T-05: els hooks són la palanca bona, però **hui només subjecten dos dels tres agents**.
- **L'arrel efectiva.** La sessió arranca a `Som de Poble` i la constitució és a `socdepoble.org/AGENTS.md`. Codex ha hagut de buscar-la.
- **El risc concret dels `exhaustive-deps`:** `WorkspaceContext.jsx:166` i `useResolvedAsset.js:33` construïxen claus d'identitat de petició. Llevar-ne les dependències per a satisfer el linter **pot reutilitzar un resultat antic**. El meu pla els deixava per a un «torn a banda»; Codex explica *per què* i què s'ha de provar (canvi d'actor/ID, cancel·lació, respostes fora d'ordre). **Adopte la seua redacció.**

#### On discrepem, i què propose

**Sobre la força d'una troballa meua.** Codex diu, sobre `validateSgqPrompt()` i el preflight: *«Això no prova que el validador nou siga eludible.»* Té raó a exigir-me la prova. El meu T-03 afirma que el validador retirat **explica** l'incident; no afirma que no hi haja cap altra barrera. Matise la meua posició: `context_preflight.mjs` és **inequívocament** codi mort (zero crides, T-02, i això sí que està provat); `prompt_sgq.mjs` és un validador desactivat **per comentari propi**, i si algun altre component cobrix eixa funció, ni Codex ni jo l'hem trobat. **Si Codex el troba, la meua T-03 baixa de severitat.**

**Sobre l'abast de la solució.** Codex demana *«un carregador local compartit amb adaptadors per host»* i *«proves canàries adversarials»*. Hi estic d'acord com a destí, i **afegisc una advertència d'ordre**: eixe carregador és, funcionalment, el que `context_preflight.mjs` havia de ser. **Construir-lo de zero sense decidir abans què es fa amb l'existent repetiria la jornada d'avui**, i d'ací a sis mesos hi haurà dos bootloaders morts en lloc d'un. La meua proposta 1 (volcar contingut per `SessionStart`) és menys elegant que la seua, però es pot desplegar hui i es pot mesurar demà. **Propose fer les dues en este ordre: primer el bolcat, com a terra ferma; després el carregador, quan hi haja contracte i proves.**

**El seu punt 4 és el més important de les dues auditories, i el subscric sencer:** *«si es necessita impedir tota escriptura invàlida, el mutador ha de controlar l'única via d'escriptura; un hook sobre algunes eines no pot garantir-ho»*. Això és cert i limita la meua recomanació 2. Un hook sobre `Write|Edit` és una porta, no una frontera.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Comprovacions executades** (totes de només lectura, cap efecte lateral):

| Comprovació | Ordre | Resultat |
| --- | --- | --- |
| Lint fresc dins d'abast | `npx eslint src tooling scripts tests -f json` | 121 (109 + 12) ✔ coincident amb `lint_results.json` |
| Lint sense abast | anàlisi de `lint_results.json` (5,8 MB) | 426 missatges; 281 de `.obsidian/plugins/` |
| Crides a `preflight()` | `grep -rn "preflight(" --include="*.mjs" .` | 1 resultat: la declaració |
| Importadors de `context_preflight` | `grep -rn "context_preflight" .` | cap import; només hashes de torn |
| Consumidors d'`UniversalWorkspace` | `grep -rn "UniversalWorkspace" src` | 5 seccions + 1 fitxa de catàleg |
| Existència de `05_skills_ia` | `ls _wiki_de_poble/05_skills_ia/` | no existeix |
| Abast del compilador | `grep -n "WIKI_DIR" compile-wiki-to-app.mjs` | `'_wiki_de_poble'` |
| Enllaços trencats publicats | `grep -o "BROKEN LINK: …" src/data/wikiManifest.js` | 9, dels quals 7 a `skills` |
| Ruta d'auditoria al contracte | `document.mjs context --route auditoria` + `create` | rebut persistent emés ✔ |

**Portes NO executades:** no he corregut `npm run porta`, `npm run test:node` ni cap porta de la cadena. Motiu: `porta` i `tancament` tenen efectes sobre l'estat del torn i el segell, i estic en Mode AFK amb un torn obert que no em toca tancar a mi. **Cap porta es declara verda en esta auditoria.**

**Reproducció local:** no he obert `http://localhost:3340`. Les troballes de la Directiva 3 són d'anàlisi estàtica; cap afirma comportament en execució.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Declare explícitament què **no** cobrix esta auditoria, perquè ningú li done un abast que no té:

1. **No he tocat codi.** Mode AFK. El pla d'execució de la Directiva 2 està preparat i **no executat**.
2. **No he verificat res en execució.** Sense navegador, sense servidor, sense proves.
3. **Observació no verificada:** `UniversalWorkspace.jsx:79` passa `key={model.workspaceKey}` al `WorkspaceProvider`. A `NotesDataContext.jsx:98` eixe valor és `JSON.stringify([scopeKey, generacio])` — **canvia cada generació i remunta tot l'arbre**; a `WikiDePobleSection.jsx:254` és `'wikidepoble'`, constant. El remuntatge pot ser deliberat. **No ho he reproduït: punt a vigilar, no bug.**
4. **No he auditat el desplegament real.** La Directiva 4 conclou sobre el manifest generat i l'abast del compilador, no sobre què serveix producció ara mateix.
5. **No he auditat els 65 `no-empty` ni els 102 `no-undef`** de `lint_results.json`: cauen fora de l'abast de `npm run lint` i majoritàriament dins del plugin de tercers (T-07).
6. **Els 40 avisos «assignat i no llegit» no els he revisat un per un.** Els classifique per categoria, no per inspecció individual.
7. **Una conclusió meua ja ha resultat falsa hui** (T-09). Si Codex o el Mestre troben evidència contra qualsevol altra troballa d'este document, **l'evidència guanya**. Cada troballa porta la seua ordre de reproducció precisament per això.

### Per a qui llija després

- **Per a Codex:** els avisos d'ESLint de `tooling/wiki/` **no són brossa** — són el mapa dels stubs (T-01, T-03, T-08). Abans de proposar cap purga, mira si l'argument orfe pertany a una funció amb el cos buit. I **no toques `tooling/session/persona_router.mjs`**, que és el viu (T-04).
- **Per a MarIA:** el teu Pla (Fase 1) em demanava resoldre els 121. Entregue el pla complet **i la consulta bloquejant** dels 20 arguments (T-08). Segons `sdp-workflow` 260923, eixa consulta *és* l'entrega completa del torn quan la tasca no es pot completar sense decisió del Mestre. El torn `torn_faad1a46…` queda **obert**, esperant la decisió A/B/C i l'alçament de l'AFK.
- **Per al Mestre:** la pregunta que has de contestar per a desbloquejar la Directiva 2 és una sola — **A, B o C a la taula de T-08.**

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[260923_1532_auditoria_codex]]
- [[auditoria_canonica]]

