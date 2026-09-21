---
type: document
status: esborrany
description: Informe de l'auditoria extrema del Brain per part de Codex.
---
# Auditoria del Brain — Dictamen del Consell

**Nota operativa: 4/10.**

El Brain conserva una identitat potent i criteris d’enginyeria valuosos, però **la reestructuració encara no funciona com un sistema coherent**. S’han canviat noms, plantilles i esquema sense completar la migració dels seus consumidors. Diverses portes fallen abans d’arribar a comprovar el contingut; altres accepten coses que una altra porta rebutja.

La prioritat és aconseguir que **una tasca puga començar, trobar el context correcte, generar un document vàlid i acabar sense perdre informació**.

## 1. Abast i honestedat de l’auditoria

He treballat exclusivament amb els fitxers locals de `socdepoble.org`, sobre el commit `d79bd0f9` i els canvis sense confirmar que ja hi havia. No he utilitzat la web ni he generat un bundle redundant.

La comprovació estructural ha recorregut:

- **101 documents Markdown de la wiki**, excloent directoris ocults i `90_*`.
- **16 skills i el seu índex**.
- Els mecanismes principals de catàleg, context, frontmatter, SGQ, Reflex, Despertar, Somiador, RAG i tancament.
- L’informe anterior de Claude, consultat expressament per contrastar-lo.

He combinat lectura detallada dels documents nuclears amb inventari i comprovacions del conjunt. **No equival a una revisió semàntica íntegra de cada document històric ni a una auditoria completa del frontend.**

Les proves amb moviments i sobreescriptures s’han executat en directoris temporals amb dades fictícies. No he activat el Somiador sobre l’escriptori real.

## 2. Resultats reproduïbles

| Comprovació | Resultat |
|---|---|
| Catàleg de skills | Rebutja les identitats després dels renoms |
| Matrix | No pot preparar el context perquè falla el catàleg |
| Frontmatter | El hash de l’esquema no coincideix amb el pany |
| Coherència d’esquemes | Exigeix un fitxer d’esquema que ja no existeix |
| Context SGQ | La plantilla actual no conté el «Cos canònic» esperat |
| Reflex | `type` és insuficient; `tipus` és rebutjat pel validador |
| Llaurador | 59 nodes inabastables, 62 enllaços ambigus i 136 penjats |
| Tests Python del Brain | No arranquen: falta `brain_audit.py` |
| Tancament | Falla per divergència del catàleg |
| Obertura de torn | Declara el Mas net, tot i els bloquejos anteriors |

Les xifres del Llaurador corresponen al seu univers de **145 nodes**, que inclou altres formats i `.agents`; no s’han de confondre amb els 118 Markdown de l’inventari.

# 3. Troballes prioritàries

## P1 · Despertar pot retirar el treball pendent i perdre una versió arxivada

[Despertar](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/brain/despertar.mjs:43) executa Somiador **abans** de construir `ON_ESTIC.md`.

[Somiador](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/tooling/brain/somiador.mjs:49):

- Mou els fitxers solts sense comprovar si estan pendents o tancats.
- No exigeix una destil·lació prèvia.
- Utilitza `renameSync` sense comprovar una col·lisió al destí.
- Agrupa l’arxiu per dia, sense distingir cada execució.
- Captura l’error del Llaurador i continua fins al missatge de finalització.

**Prova aïllada confirmada:**

```text
Nota marcada com a activa: moguda.
Còpia anterior amb el mateix nom: sobreescrita.
Nota pendent en ON_ESTIC: absent.
Llaurador: fallada.
Despertar: exit 0.
```

Això vulnera el propòsit de l’arrencada: **el context es genera després d’haver retirat allò que calia recordar**.

**Correcció proposada:**

1. Despertar només observa i genera context.
2. Somiador prepara un pla sense aplicar-lo.
3. Només són arxivables episodis explícitament tancats.
4. Cap sobreescriptura: col·lisió significa aturada.
5. Cada moviment conserva origen, destí i hash.
6. Una fallada retorna codi no-zero.
7. L’arxivament comprova que decisions i pendents continuen accessibles.

La destil·lació pendent ha de constar com a pendent. El comentari «confiem que l’agent ho ha fet» no és una precondició executable.

## P1 · El canvi de noms ha trencat la identitat de 14 de les 16 skills

Les carpetes s’han reanomenat, però el camp `name` conserva l’identificador anterior.

El catàleg exigeix que coincidisquen. Per això fallen també Matrix i Tancament.
Hi ha una segona contradicció: el prompt anuncia `<familia>_<funcio>`, però les carpetes utilitzen guions i el validador **rebutja els guions baixos**.

**Correcció:** decidir un contracte únic i migrar conjuntament carpeta, `name`, manifest, índex, referències, segells i consumidors.
La família pot ser `core`, `wiki` o `sdp`; l’identificador no hauria de canviar cada vegada que es reorganitza una categoria. Separar **identitat estable** i **classificació** evitaria futures migracions innecessàries.

## P1 · El Reflex exigeix un document impossible de validar

En Reflex, el document ha de declarar `tipus: petorreta`.
Però l’esquema actual admet `type` i rebutja `tipus`.

**Correcció:** una única representació canònica. Si cal compatibilitat amb formats antics, un adaptador explícit els transforma abans de validar; els documents nous no han de satisfer dos contractes incompatibles.

## P1 · L’enumeració tancada d’etiquetes encara no governa tot el sistema

L’inventari ha detectat:
- **29 usos d’etiquetes fora del domini**, distribuïts en **25 documents**.
- Entre elles: `skills`, `graf`, `rols`, `reflex`, `abocament` i `sollutia`.
- Els dos prompts nous incorporen `reflex`, propietat absent de l’esquema.
- El mateix generador del catàleg continua produint l’etiqueta prohibida `skills`.

A més:
- `tractor-frontmatter` s’atura pel hash desactualitzat.
- `validateCanonical()` rebutja `tags`, encara que l’esquema les admet.
- `validarFrontmatter()` accepta una etiqueta fictícia `NO_EXISTEIX`.

Per tant, **haver escrit un `enum` no significa haver-lo imposat**.

**Correcció:** tots els consumidors han de validar el mateix contracte. Recalcular el segell només després de revisar i migrar el corpus; resegellar directament amagaria part del problema.

## P1 · Les plantilles simplificades són incompatibles amb el generador

SGQ exigeix `## Cos canònic` i una seqüència exacta de seccions.
La plantilla `prompt_consell.md` ja no presenta aquesta estructura.

Altres divergències:
- `## Vincles (Ancoratge de Seguretat)` no coincideix amb el `## Vincles` exacte del tractor.
- La plantilla de skills anuncia 220 caràcters de descripció; l’esquema en permet 140.
- Les plantilles de prompt contenen dos blocs YAML consecutius sense delimitar clarament el document model.

**Correcció:** cada plantilla ha de disposar d’una instància mínima vàlida comprovada automàticament. Simplificar una plantilla implica modificar i provar el generador i els validadors corresponents.

## P1 · El RAG públic no separa coneixement publicable i context intern

El constructor RAG:
- Recorre l’arrel del projecte.
- Inclou expressament `.agents`.
- No filtra documents per `status`.
- Escriu el resultat a `public/rag-index.json`.

La prova amb un document fictici `.agents/PRIVATE.md`, marcat `arxivat`, confirma que entra en l’índex.

**Correcció:**
- Corpus públic explícit i separat del corpus intern dels agents.
- Exclusió per defecte d’actes, context de sessió, esborranys i registres interns.

## P2 · La simplificació dels noms ha degradat el graf

Ara existeixen, entre altres, l’índex general `00_index.md` i el de plantilles amb el mateix nom.
El resolutor reporta ambigüitats per `[[00_index]]`; també queden enllaços als mirrors retirats i a les plantilles anteriors.

**Un nom curt no és necessàriament un nom millor.** Dins d’un vault amb resolució per nom base, pot llevar informació indispensable.

## P2 · La constitució es contradiu amb les skills

Hi ha conflictes que no es resolen llegint més: (Arxivament destructiu vs protecció, context acotat vs complet, etc.). La skill de guàrdia situa l’esquema per damunt de l’usuari.

**Correcció:** una autoritat per assumpte. Les skills consulten les normes; no les reescriuen.

## P2 · La fusió de skills està bloquejada per un número màgic

El catàleg exigeix **exactament 16 skills**. Això impedeix tant una fusió legítima com una nova habilitat ben justificada.

**Correcció:** validar identitats, contractes i dependències. El nombre de skills és un resultat de l’inventari, no una llei de qualitat.

## P2 · Les garanties d’obertura i de proves estan desconnectades

`obrir_torn.mjs --json` no retorna el JSON ni el `turn_id` que anuncia la skill.
La suite Python no pot importar `brain_audit.py`, perquè falta.

**Correcció:**
- «No hi ha bloqueig registrat» i «salut verificada» han de ser estats diferents.
- L’obertura ha de donar un identificador real i un diagnòstic estructurat.

# 4. Què conservar, fusionar i retirar

**Fusionar no és concatenar documents.** Les skills actuals ja contenen «Secció Original» i regles incompatibles heretades. Això redueix fitxers, però no redueix contradiccions.

La unitat de consolidació ha de ser una responsabilitat amb entrades, eixides i criteris comprovables.

... [S'ometen algunes seccions secundàries de l'informe per longitud, però els P1 estan detallats adalt] ...

# 9. Justificació de la nota

| Dimensió | Valoració qualitativa |
|---|---:|
| Propòsit i identitat | 8/10 |
| Coherència normativa | 3/10 |
| Funcionament del circuit documental | 3/10 |
| Preservació de memòria | 3/10 |
| Mantenibilitat i verificació | 4/10 |

El **4/10 global és un judici professional**, no una telemetria ni una mitjana científica.

Hi ha fonaments aprofitables: Markdown, Git, hashes, procediments de restauració, separació entre visió i implementació en diversos documents, i una missió humana clara. Però hui el mantenidor encara ha de compensar contradiccions que el sistema hauria de resoldre mecànicament.

**El regal per al poble serà un Brain que necessite menys vigilància, preserve millor el treball i diga la veritat quan falla.**
