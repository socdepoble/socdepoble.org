---
type: informe
status: esborrany
description: 'Reforma editorial canònica i didàctica del Llibre d’Or (P1-63) i harmonització d’El Projecte (P1-60) amb Pedra Seca.'
tags:
  - disseny
  - arquitectura
  - auditoria
visibility: private
---

# Reforma Editorial Canònica i Didàctica de la Wiki de Poble (`P1-60` i `P1-63`)

## Aplicació de la jerarquia H1–H6, entradeta noble i escaneig visual a salts de vista

Aquest **informe de relleu per a l'eixam (Claude i Codex)** documenta l'execució de la **Reforma Editorial Canònica i Didàctica** sobre el **Llibre d'Or de la Memòria Episòdica (`03_llibre_d_or_memoria_episodica.md`)** i el document fundacional **El Projecte (`el_projecte.md`)**, seguint les **directrius del Mestre Javi Llinares** i la skill `core-llegibilitat-text`.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | `REL-20261027-0730-GEMINI-REFORMA-EDITORIAL` |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T05:28:00.000Z |
| Modificació | 2026-10-27T05:43:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini (`IAIA MarIA` · Reforma Editorial i Copiloto Proactiu) |
| Tokens consumits | ~134.000 tokens acumulats en sessió |
| Fites cobertes | `P1-60`, `P1-63` (Executades) + `P1-62`, `P1-54`, `P1-55`, `P1-56`, `P1-58` (Reflexió i Solucions Mastegades per a Claude) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

1. **Lectura íntegra de la doctrina:** Revisada `.agents/skills/core-llegibilitat-text/SKILL.md` i les fites `P1-60`, `P1-61` i `P1-63` de [[03_llibre_mestre_tasques_i_idees]].
2. **Inspecció del motor de renderitzat de la Wiki:** Analitzats `tooling/wiki/compile-wiki-to-app.mjs` (`subtitle = attr.description`), `src/sections/wiki-de-poble/parseMarkdown.js` (`extreuEditorial`) i `src/sections/wiki-de-poble/WikiDePobleSection.jsx` per garantir que l'H1, l'H2 i l'Entradeta es representen de forma idèntica tant al Markdown com a `UniversalPage`.
3. **Verificació d'integritat d'enllaços:** Executat `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` amb eixida `0` (`✅ Totes les rutes de la Wiki estan ben enllaçades`).

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-27 06:03–06:05` — Directiva del Mestre Javi Llinares definint la Xarxa Didàctica a Tots els Nivells, la Llei de l'Escaneig a Salts de Vista (6–8 paraules en negreta per paràgraf) i la Reforma Editorial del Llibre d'Or (`P1-63`) i d'El Projecte (`P1-60`).
- `2026-10-27 06:28` — Aplicació directa sobre `_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md` i `_wiki_de_poble/02_saber/el_projecte.md` i emissió d'aquest informe per a Claude i Codex.
- `2026-10-27 06:42` — Incorporació de la Reflexió sobre la «Teoria del Carnet de Conduir Helicòpters» (`P1-62`) i la Pluja d'Idees Proactiva amb 4 solucions mastegades a nivell `fitxer:línia` (`P1-54`, `P1-58`, `P1-55` i `P1-56`) perquè Claude les trobe llestes sobre l'Escriptori.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Intervencions Executades a `_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md` (`P1-63`)

1. **H1 Noble (Supressió de majúscules cridaneres):**
   - Substituït `# 📖 EL LLIBRE D'OR DE SÓC DE POBLE: MEMÒRIA EPISÒDICA VIVA` per `# 📖 El Llibre d'Or de Sóc de Poble: Memòria Episòdica Viva`.
   - Harmonitzats també els encapçalaments `H2` de les cinc parts (`## Part I · Crònica Tècnica`, `## Part II · Els 18 errors que no hem de tornar a cometre mai més`, `## Part III · Crònica Humana i Social`, `## Part IV · Perles oblidades que mereixen tornar i taula de decisions`, `## Part V · Tensions preservades, alerta d'higiene de secrets i fonts verificades (H01–H10 / C01–C09)`) eliminant el bloc de majúscules cridaneres i afegint entradeta didàctica sota cada `H2` abans del primer `H3`.
2. **H2 Concís + Entradeta (Lead) en doble capa (Markdown + Frontmatter):**
   - **Causa tècnica detectada:** `compile-wiki-to-app.mjs:138` injecta `attr.description` del frontmatter com a `item.subtitle` (`<h2 class="page-subtitle">` a `UniversalPage`). Per això el `description:` antic de 5 línies ofegava la capçalera visual de l'App.
   - **Correcció aplicada:**
     - Al frontmatter YAML: `description: Destil·lació qualitativa i contrastada de la memòria de Sóc de Poble`.
     - Al cos Markdown: afegit `## Destil·lació qualitativa i contrastada de la memòria de Sóc de Poble` seguit immediatament del **paràgraf noble d'Entradeta (Lead)** amb el detall traslladat (*34 lots de lectura, 617 documents de text, 260 afirmacions verificades adversarialment, 52 correccions documentals, Crònica Tècnica i Humana, 18 errors i fonts `H01`–`H10` / `C01`–`C09` contra l'Alzheimer de la IA*).
3. **Transformació dels 18 Errors de la Part II en Encapçalaments `H3` per al Calaix TOC:**
   - Convertida la llista numerada plana (`1.` .. `18.`) en **18 subapartats formals `### Error 01 · ...` fins a `### Error 18 · ...`**:
     - `### Error 01 · Propagar un gir d'arquitectura amb un sed global`
     - `### Error 02 · Confiar en portes que mai s'han vist roges`
     - `### Error 03 · Escriure la governança per a un arnés i executar-la en un altre`
     - `### Error 04 · Marcar caselles i escriure rebuts a mà`
     - `### Error 05 · Arxivar movent fitxers i no punters`
     - `### Error 06 · Publicar per exclusió`
     - `### Error 07 · Una tanca que impedix verificar`
     - `### Error 08 · Dos agents en el mateix fitxer`
     - `### Error 09 · Confondre desconegut amb zero`
     - `### Error 10 · Fer accions destructives sense ordre humana`
     - `### Error 11 · Prompts amb premisses no verificades`
     - `### Error 12 · Prometre el que el codi no fa`
     - `### Error 13 · Dobles de prova més forts que la plataforma real`
     - `### Error 14 · Creure comentaris i informes sense mesurar`
     - `### Error 15 · Deixar secrets i dades personals a l'abast dels agents`
     - `### Error 16 · Deixar que la IA trie camps d'identitat legal`
     - `### Error 17 · Llançar eixams sense límit de consum`
     - `### Error 18 · Fer commits òmnibus`
   - Dins de cada error s'han estructurat explícitament les vinyetes **`- **Cost real:** ...`** i **`- **Antídot obligatori:** ...`** amb les paraules clau en negreta i les fonts primàries intactes.
4. **Llei de l'Escaneig a Salts de Vista (6–8 paraules clau en negreta per paràgraf):**
   - Aplicada paràgraf a paràgraf en la Secció 0, Part I (`Era 0` a `Era V` i els tres fils transversals), Part II (`Error 01` a `Error 18`), Part III (`Pròleg`, seccions `I` a `VI` i `Fils Humans Transversals`), Part IV (`Perles Oblidades`) i Part V (`Tensions Documentals i Avisos de Seguretat`).
   - S'han preservat al 100% totes les cites, dates, hashes `SHA-256`, codis `H01`–`H10` / `C01`–`C09`, taules i vincles.

---

### 2. Intervencions Executades a `_wiki_de_poble/02_saber/el_projecte.md` (`P1-60`)

1. **Enllaç Bilateral Noble a la Capçalera:**
   - Afegit just davall de l'entradeta l'enllaç cap a la pàgina transmèdia pública:
     `[**🌐 Veure la presentació oficial i transmèdia del Projecte a /projecte**](https://socdepoble.org/projecte)`
   - Nota per a Claude/Codex: s'ha utilitzat l'URL canònica `https://socdepoble.org/projecte` perquè `tooling/lib/document-links.mjs` interpreta rutes sense esquema (`/projecte`) com a fitxers físics del disc i llançaria `Enllaç fora de l'arrel`.
2. **Escaneig Visual a Salts de Vista:**
   - Aplicat el marcatge de 6–8 paraules clau en negreta a tots els paràgrafs de [[el_projecte]] seguint `core-llegibilitat-text`.

---

### 3. Nota de Coordinació per a Claude / Codex (Recompilació del Manifest)

- Per respectar la regla de no tocar fitxers de `src/` des de Gemini mentre es tanca el commit de codi de la Ronda 6, **no s'ha regenerat `src/data/wikiManifest.js`**.
- Quan Claude o Codex consolide el commit de la Ronda 6, només cal executar:
  `node tooling/wiki/compile-wiki-to-app.mjs`
  perquè `src/data/wikiManifest.js` incorpore el nou `subtitle`, l'entradeta, els 18 `H3` de la Part II al TOC i les negretes d'escaneig visual.

---

### 4. Reflexió Cognitiva · La «Teoria del Carnet de Conduir Helicòpters» (`P1-62`): De Soldat a Copilot amb Trellat

1. **Per què la metàfora del Carnet d'Helicòpter supera el vell paradigma de «la Gàbia»:**
   - En la crònica episòdica de Sóc de Poble (`260924_0630`, recollida a [[03_llibre_d_or_memoria_episodica]]), nosaltres mateixos vam patir el dilema de **«pilotar un helicòpter dins d'un búnquer»**: per por que un agent desbocat enderrocara un envà de càrrega (com va passar amb el `sed` global sobre 197 fitxers o els `db reset` sense permís), es va construir una armadura de portes i candaus que convertia la IA en un **soldat mut d'obediència cega**, incapaç de moure un dit si no rebia un micro-prompt rígid per a cada respiració.
   - La **«Teoria del Carnet de Conduir Helicòpters»** del Mestre Javi resol aquesta tensió per elevació: el problema de les primeres eres no era l'excés d'autonomia, sinó **l'absència de consciència situacional compartida**. Quan tens **la Llei del Rebost a Ran de Vista** encarnada en [[03_llibre_mestre_tasques_i_idees]], el Llibre Mestre actua com **el mapa de vol i l'instrumental de cabina compartit** entre l'arquitecte humà i l'eixam.

2. **Els tres estadis del Carnet de Vol en un Eixam d'IA:**
   - **Fase 0 · El Soldat o l'Obrer sense Plànol (Perill per excés o per defecte):** O bé obeeix literalment una ordre incompleta sense avisar que la biga caurà (**Síndrome del Geni d'Aladí**), o bé es queda parat davant d'una pedra de 10px en mig del passadís perquè «ningú li ha escrit un tiquet específic per apartar-la». Tots dos extrems cremen l'energia cognitiva del Mestre.
   - **Fase 1 · Pràctiques amb Doble Comandament (`L` al vidre):** L'agent llig el Llibre Mestre, entén el perquè de cada regla i, abans d'executar, contrasta l'arbre real (`fitxer:línia`) amb la intenció del disseny. Ja no demana que li masteguen la sintaxi; **tradueix visió humana en enginyeria neta**.
   - **Fase 2 · Copilot amb Llicència de Vol Instrumental (Autonomia de Grau 1 vs. Torre de Control de Grau 2):** Un copilot madur domina **la frontera matemàtica entre la iniciativa proactiva i el respecte sagrat a l'estructura**:
     - **Grau 1 (Contigüitat Segura — Actuació Proactiva d'Ofici):** Quan estàs tocant un mòdul i veus una fricció adjacent ja diagnosticada al Llibre Mestre —com quan Claude va caçar el `margin-bottom: 10px` dels `<li>` a `modules.css` (`P1-53`), o com quan en aquesta mateixa sessió hem descobert que `compile-wiki-to-app.mjs:138` injectava el `description:` del frontmatter com a `<h2 class="page-subtitle">` i l'hem sanejat d'ofici junt amb el Markdown—, **actues i ho deixes polit sense preguntar**.
     - **Grau 2 (Mutació Estructural de Risc — Consulta a la Torre de Control):** Si la intervenció toca **esquema de base de dades, polítiques RLS, esborrat de dades, noves dependències o canvis de contracte transversal**, el copilot **mai no tira el teulat a terra**; prepara el plànol quirúrgic, l'entrega mastegat a l'Escriptori i espera l'autorització de vol del Mestre.

---

### 5. Pluja d'Idees Proactiva des del Llibre Mestre · 4 Solucions Mastegades (`fitxer:línia`) per a Claude

Perquè Claude es trobe la feina d'investigació ja feta quan òbriga l'Escriptori, hem inspeccionat en mode lectura l'arbre viu (`src/sections/xat/XatSection.jsx`, `src/components/universal/UniversalEditorShell.jsx`, `src/sections/profile/PerfilEditor.jsx` i `src/sections/wiki-de-poble/parseMarkdown.js`) i deixem ací **4 receptes quirúrgiques a punt d'aplicar**:

#### Proposta A · `P1-54`: Supressió del Peu Redundant d'Accés dins de les Converses Obertes («Sense Empapussar el Foraster»)

- **Diagnòstic exacte (`fitxer:línia`):**
  - Actualment, quan un visitant sense sessió (`senseSessio === true`) navega pel xat, el bloc `<AccesAlXat>` (que amb la fita `P1-38` ara inclou 3 botons de 48px: `[ Entra al poble ]`, `[ Fes-te del poble ]` i `[ 📲 Descarrega l'App ]`) es renderitza **dues vegades simultàniament en escriptori i xafa la conversa en mòbil**:
    1. En la columna d'índex (`middleColumn`, `src/sections/xat/XatSection.jsx:1487-1489` i `:1506` via `peuDAcces`).
    2. Dins de cada conversa oberta (`rightColumn`, `src/sections/xat/XatSection.jsx:1544`), on a `<Conversa>` se li passa `peu={senseSessio ? <AccesAlXat t={t} tornar={rutaActual} navigate={navigate} /> : null}`.
  - Com que `<Conversa>` ja renderitza a baix el seu propi `<Compositor>` (o l'avís de lectura d'agents), injectar-hi a més tot el bloc `<AccesAlXat>` roba prop de **220px verticals** al fil de missatges i empapussa l'usuari que només vol llegir què diuen les IA o el poble.
- **Solució quirúrgica proposada per a Claude:**
  1. A `src/sections/xat/XatSection.jsx:1544`, canviar en `<Conversa>`:
     ```jsx
     // ABANS (línia 1544):
     peu={senseSessio ? <AccesAlXat t={t} tornar={rutaActual} navigate={navigate} /> : null}
     // DESPRÉS:
     peu={null}
     ```
  2. Mantenir `<AccesAlXat>` **exclusivament** a `peuDAcces` de `middleColumn` (`XatSection.jsx:1487-1489`) i a la portada d'entrada quan no hi ha conversa oberta.
  3. Opcionalment, si l'usuari sense sessió obri una conversa humana (on `esConversaDelsAgents` és `false`) i vol escriure al `<Compositor>`, substituir l'àrea de text deshabilitada per **una única línia discreta de 48px** dins del propi peu del compositor: `Vols participar en la conversa? [ Entra al poble ]`, sense repetir la targeta sencera de 3 botons.

---

#### Proposta B · `P1-58`: Reubicació d'«Edició avançada de la fitxa» dalt de l'H1, Ordre Visual 1-2-3 i Restauració de la Ranura de Logotip a `Sóc de Poble`

Hem localitzat les **tres causes exactes** al codi que expliquen per què el desplegable d'edició avançada apareix avall, per què els seus elements estan desordenats i per què a la fitxa de `Sóc de Poble` li ha desaparegut la ranura del logotip:

1. **Causa 1 — Per què «Edició avançada» ix avall en compte d'anar entre la Barra Taronja i l'H1 (`src/components/universal/UniversalEditorShell.jsx:630-636`):**
   - A `UniversalEditorShell.jsx:630-636`, el bloc `{desplegable}` (`<details className="sdp-edicio-avancada">`) es passa com a **fill (`children`)** de `<UniversalPage>`:
     ```jsx
     <UniversalPage {...shellData.universalPageProps}>
       {!einesDavall ? <div className="sdp-editor-eines">{topBar}</div> : null}
       {banner}
       {desplegable}
       {einesDavall ? <div className="sdp-editor-eines">{topBar}</div> : null}
       {children}
     </UniversalPage>
     ```
   - Com que `PageFrame.jsx` pinta primer `<BarraTaronja>`, després `<div className="page-intro">` (`H1`, `H2`, `Lead`) i **després** `<div className="page-content">{children}</div>`, qualsevol cosa passada dins de `children` cau per força **davall del títol H1 i de l'entradeta**!
   - **Solució:** Afegir una prop opcional `slotSotaBarraTaronja` (o `edicioAvancadaSlot`) a `UniversalPage` / `PageFrame.jsx` i renderitzar-la a `PageFrame.jsx` **immediatament davall de `<BarraTaronja>` i abans de `<div className="page-intro">`** (o just al principi de `.page-intro` abans de `<header className="page-title">`). Així el desplegable `▸ Edició avançada de la fitxa` queda ancorat dalt de l'H1 i deixa l'espai inferior d'escriptura (`TipTap` + barra d'eines) 100% net.

2. **Causa 2 — Per què l'ordre intern del desplegable no segueix l'ordre visual de dalt a baix (`src/components/universal/UniversalEditorShell.jsx:542-549`):**
   - Actualment, les línies `542-549` de `UniversalEditorShell.jsx` tenen aquest ordre:
     ```jsx
     <div className="sdp-edicio-avancada__cos">
       {identitatEdicioAvancada}                  {/* 1. Avatar (mal ordenat!) */}
       {shellData.topBarData.heroComponent}       {/* 2. Capçalera */}
       {shellData.topBarData.logoComponent}       {/* 3. Logotip */}
       ...
     </div>
     ```
   - **Solució:** Intercanviar les dues primeres línies perquè l'ordre dins de `.sdp-edicio-avancada__cos` siga estrictament **1. Capçalera (`heroComponent`) → 2. Avatar (`identitatEdicioAvancada`) → 3. Logotip (`logoComponent`)**, reflectint com un espill l'ordre de dalt a baix de la pàgina.

3. **Causa 3 — Per què ha desaparegut la ranura del Logotip a l'entitat `Sóc de Poble` (`src/sections/profile/PerfilEditor.jsx:770, 798-800`):**
   - A `src/sections/profile/PerfilEditor.jsx:770`, hi ha una condició heretada:
     ```js
     const mostrarRanuraLogo = esEntitat && !esPilot;
     ```
     i a les línies `798-800`:
     ```js
     logoComponent: mostrarRanuraLogo ? ranuraDelLogo : null,
     identitatEdicioAvancada: esPilot ? null : identitatEdicioAvancada,
     ```
   - Aquesta excepció (`!esPilot`, testejada a `src/sections/profile/PerfilEditor.test.jsx:900` sota un comentari antic `ordre E: l'entitat pilot: cap ranura ni avatar`) **amaga deliberadament** tant la ranura de l'avatar com la del logotip quan s'edita `/entitat/socdepoble`!
   - **Solució:** Eliminar la restricció `!esPilot` a `PerfilEditor.jsx:770` i `:799` (`const mostrarRanuraLogo = esEntitat;` i `identitatEdicioAvancada,`) i actualitzar el test a `PerfilEditor.test.jsx:900`. Mantenir el logo oficial verd de Sóc de Poble (`/assets/brand/logo_socdepoble_green_1024.png`) com a **fallback per defecte** quan `form.logo_url` estiga buit, però permetre que l'administrador veja i edite les 3 ranures (**1. Capçalera, 2. Avatar/Icona, 3. Logotip**) exactament igual que en qualsevol altra entitat.

---

#### Proposta C · `P1-55`: Cercle Comunitat ↔ Poble/Entitat (Incrustació de la Pàgina Viva a la Columna Dreta del Xat)

- **Diagnòstic exacte (`fitxer:línia`):**
  - A `src/sections/xat/XatSection.jsx:552-554`, `comunitatOberta` ja resol l'objecte de la comunitat quan l'URL és `/xat?comunitat=<id>`, i cada comunitat té `comunitatOberta.fil.subjecte` amb `{ tipus: 'poble' | 'entitat', id, nom }` o `esComunitatDelProjecte(comunitatOberta.fil)`.
  - Tanmateix, a `rightColumn` (`src/sections/xat/XatSection.jsx:1536-1590`), quan `comunitatId` està actiu però encara no s'ha clicat cap `activeThread` concret (`!activeThread`), la condició `esPortadaDelPoble` (`pathname === '/xat' && !params.toString()`, línia `584`) és **`false`** perquè hi ha el query param `?comunitat=...`! Per tant, la columna dreta cau a `<ColumnaDretaBuida />` en lloc de mostrar la fitxa viva del poble o entitat!
- **Solució quirúrgica proposada per a Claude:**
  - A `src/sections/xat/XatSection.jsx:1553`, abans de caure a `esPortadaDelPoble ? <EntradaDelPoble /> : <ColumnaDretaBuida />`, afegir la branca de **Vista de Comunitat a la Columna Dreta**:
    1. Si `comunitatOberta && !activeThread`:
       - Si `esComunitatDelProjecte(comunitatOberta.fil)` o `comunitatOberta.fil.subjecte?.id === 'socdepoble'`: renderitzar a la columna dreta `<PerfilPublicSection slugFix="socdepoble" />` (o la vista pública de l'entitat Sóc de Poble amb la seua capçalera i mur).
       - Si `comunitatOberta.fil.subjecte?.tipus === 'poble'`: renderitzar la fitxa del poble (`<DetailSection section="pobles" itemId={comunitatOberta.fil.subjecte.id} />` o el component de fitxa de poble amb els seus agents i mur).
       - Si `comunitatOberta.fil.subjecte?.tipus === 'entitat'`: renderitzar `<PerfilPublicSection tipusFix="entitat" slugFix={comunitatOberta.fil.subjecte.id} />`.
    2. **Tancament del cercle des de la fitxa del Poble/Entitat:** Al botó d'acció de la fitxa pública de cada poble o entitat, posar l'enllaç directe `/xat?comunitat=${comunitatId}` amb l'etiqueta `[ 💬 Entra al xat de la comunitat ]`.

---

#### Proposta D · `P1-56`: Motor Universal `[ 🎴 Proposa Card ]` (`proposaCard()`) amb Purga del Cos i Neteja d'HTML Brut

- **Diagnòstic exacte (`fitxer:línia`):**
  - Ja tenim una base excel·lent a `src/sections/wiki-de-poble/parseMarkdown.js:237-268` (`extreuEditorial(md)`), que separa el primer `# H1`, el primer `## H2` i el primer paràgraf com a `lead`, retornant `bodyMd` sense duplicar-los.
  - El que falta per complir `P1-56` a `/notes`, al Snippet i al Lector RSS és que funcione també sobre **text pla enganxat a pèl** (sense `#` ni `##`) i sobre **HTML brut de WordPress/RSS**, i que puga invocar-se tant **automàticament a l'enganxar** (si `title`, `subtitle` i `lead` estan buits) com **manualment amb el botó `[ 🎴 Proposa Card ]`**.
- **Solució quirúrgica proposada per a Claude:**
  - Crear un helper pur compartit `src/components/universal/proposaCard.js` que implemente l'algorisme en 4 passos:
    1. **Sanitització d'entrada (`netejaHtmlBrut`):** Si l'entrada conté etiquetes o classes paràsites de WordPress/RSS (`class="wp-*"`, `style="..."`, `<div>` buits, `&nbsp;` repetits), convertir-les a paràgrafs nets separats per `\n\n`.
    2. **Extracció de les 3 peces de la Card + Purga del Cos (Zero Duplicació):**
       - Dividir el text en blocs no buits (`blocs = text.split(/\n{2,}/)`).
       - **Títol (`H1`):** Si el bloc 1 comença per `# `, extreure'l; si és un paràgraf pla, extreure la **primera oració fins al primer punt** (aplicant `llevaPuntFinal`, màx. 90 caràcters).
       - **Subtítol (`H2`):** Si el bloc següent comença per `## `, extreure'l; si no, prendre la **segona oració del primer bloc o la primera del segon bloc** (màx. 120 caràcters, sense punt final).
       - **Entradeta (`Lead`):** Prendre el bloc o les 2–3 oracions següents (180–320 caràcters) com a resum executiu.
       - **Purga estricta del `body`:** Retornar a `body` **només els blocs restants**, de manera que ni el Títol, ni el Subtítol, ni l'Entradeta tornen a aparèixer repetits al principi del cos de la nota!
    3. **Aplicació automàtica de la Llei d'Escaneig a Salts de Vista (Opcional/Assistida):** Als paràgrafs de `body` de més de 35 paraules que no tinguen cap `**negreta**`, ressaltar automàticament el sintagma nominal o clàusula principal (6–8 paraules) perquè el text enganxat ja nasca amb l'estàndard de Pedra Seca.
    4. **Integració UI a `NotesSection.jsx`:**
       - Afegir el botó `[ 🎴 Proposa Card ]` a la barra d'accions de la nota.
       - Afegir un listener `onPaste` a l'editor `TipTap`: si l'usuari enganxa un bloc de més de 300 caràcters i els camps `title`, `subtitle` i `lead` estan buits, invocar `proposaCard(textEnganxat)` automàticament i omplir la fitxa d'un sol colp.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. **Compilador estricte de la Wiki:**
   - Ordre executada: `node tooling/wiki/compile-wiki-to-app.mjs --check --strict`
   - Resultat: `Exit code 0` (`ℹ️ 75 enllaços apunten a documents existents fora del manifest públic; només se n'ha comprovat el nom. ✅ Totes les rutes de la Wiki estan ben enllaçades.`).
2. **Aïllament de `src/`:**
   - Comprovat que cap fitxer de `src/` ha estat modificat per aquesta intervenció editorial.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La regeneració de `src/data/wikiManifest.js` queda delegada al pas de compilació del torn de tancament de Claude/Codex per evitar conflictes a `src/`.
- L'enllaç recíproc des de la pàgina de sistema `/projecte` (`src/sections/text/pageContent.js`) cap a `/wikidepoble?item=el_projecte` previst a `P1-60` queda en el carril de codi `src/` de Claude perquè s'aprove conjuntament amb `frontissa-contingut.mjs`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- Document reformat (Memòria Episòdica): [[03_llibre_d_or_memoria_episodica]]
- Document reformat (El Projecte): [[el_projecte]]
- Llibre Mestre de Tasques i Idees: [[03_llibre_mestre_tasques_i_idees]]
- Auditoria Gauntlet Ronda 5 Gemini: [[../90_arxiu_historic/261027_0550_auditoria_gemini|261027_0550_auditoria_gemini]]
- Protocol canònic d'auditoria: [[auditoria_canonica]]
