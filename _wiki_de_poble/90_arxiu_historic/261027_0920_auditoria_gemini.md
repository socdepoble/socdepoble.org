---
type: informe
status: esborrany
description: 'Auditoria i solucions de Guarda Nocturna per a P1-54, P1-55, Consola, Maquinària pública, T1-06 i bucle autònom.'
tags:
  - auditoria
  - arquitectura
  - govern
visibility: private
reflex: sdp:torn_8160d52d-62fe-4689-a0bf-14051394195f:9f7597e6-53d1-445b-816e-254d1d2cf9e3
---
# Informe de Guarda Nocturna Gemini: Deute Tècnic, Comunitats, Maquinària i Bucle Autònom

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8160d52d-62fe-4689-a0bf-14051394195f:9f7597e6-53d1-445b-816e-254d1d2cf9e3 |
| Versió del document | 1.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T08:19:54.376Z |
| Modificació | 2026-10-27T11:59:30.000Z |
| Propietari | gemini-4-argon |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (IAIA MarIA) |
| Tokens consumits | 98400 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-27T08:19:54.376Z`: Esborrany creat i vinculat al pla `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` dins del torn `torn_8160d52d-62fe-4689-a0bf-14051394195f`.
- `2026-10-27T08:25:00.000Z`: Emés i ancorat el rebut canònic pendent per a `_wiki_de_poble/04_escriptori/261027_0730_reforma_editorial_gemini.md` (`sdp:torn_8160d52d-62fe-4689-a0bf-14051394195f:48db07a8-1f19-4e92-bafc-34cdca02c1e8`), resolent l'avís `escriptori-sense-rebut` del Mapa de la Consola.
- `2026-10-27T08:27:00.000Z`: Completada la dissecció forense dels 5 blocs del mandat (`P1-54`, `P1-55`, Consola i Maquinària pública, `T1-06` Apple 2.3.10 i Bucle Autònom) amb solucions exactes per a la implementació de Claude i el contrast de Codex.
- `2026-10-27T09:58:00.000Z`: Incorporat el Dictamen de Rèplica (v1.1.0, Secció 6) contrastant l'informe d'implementació de Claude (`261027_0925_auditoria_claude.md`) i l'auditoria preventiva dels canvis de WordPress.org (`empaqueta.mjs`, `includes/idioma.php`, `includes/marcatge.php` i regressions a `tests/enxufe-*.test.mjs`).
- `2026-10-27T11:02:00.000Z`: Incorporat el Consens d'Eixam i Blindatge OpenGraph per a WhatsApp i Xarxes (v1.2.0, Secció 7, Fita `P1-61`): diagnosi de les 3 causes encadenades de `/mercat/samarreta-socdepoble`, Regla Invariant de la Primera Imatge (`primeraImatgeSocial`), arquitectura dual de servidor sense latència per als humans (Prerender Estàtic a `dist/` + Edge Worker O(1) + correcció del bug d'hidratació `baseline` a `seoHead.js`), diàleg creuat amb Codex (`GN-R01..08`) i pla d'execució lligat per a Claude.
- `2026-10-27T11:59:30.000Z`: Incorporat el Dictamen de Revisió Creuada i Salfumant Radical (v1.3.0, Secció 8) sobre el pla d'OpenGraph de Codex (`261027_1154`), la rèplica `CL-11`/`CL-12`/`CL-13` de Claude (`261027_0925`), el Llibre Mestre (`P1-61`, `P1-64`), la destinació satèl·lit `_builds_de_poble/wordpress/` (`core-empaquetat-wp` i ruptura del segell `SKILLS_SEAL.json`) i la pàgina viva `P1-55` (`FitxaVivaDeComunitat.jsx`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Bloc 1 · Desempapussament d'Accés al Xat (Fita `P1-54`)

- **Fitxer o àmbit afectat:** `src/sections/xat/XatSection.jsx` (línies `1267-1271`, `1407`, `1509`, `1544` i `1732-1751`), `src/sections/xat/XatSection.avatars.test.jsx` (`388-500`) i `src/sections/xat/XatSection.acces.capes.test.js`. *(Nota d'higiene documental: el component `AccesAlXat` està definit en línia dins de `src/sections/xat/XatSection.jsx:1732`, no existeix un fitxer separat `src/sections/xat/AccesAlXat.jsx`).*
- **Evidència reproduïble:**
  1. En `src/sections/xat/XatSection.jsx:1267`, la condició actual és `const peuDAcces = senseSessio && !activeThread ? (<div className="sdp-xat-llista__peu"><AccesAlXat t={t} navigate={navigate} /></div>) : null;`. Quan l'usuari navega a una comunitat (`?comunitat=fake-sdp` o `?comunitat=fake-poble`) sense fil actiu (`activeThread === null`), `peuDAcces` continua renderitzant els 3 botons al peu de la columna esquerra.
  2. En `src/sections/xat/XatSection.jsx:1407`, `VistaDeLaClosca` (la vista `?vista=comunitats`) rep `peu={peuDAcces}`.
  3. En `src/sections/xat/XatSection.jsx:1509`, qualsevol altra vista del rail (`?vista=arxiu`, `?vista= Destacats`, etc.) renderitza `{vistaNode && vistaActiva !== 'comunitats' ? peuDAcces : null}`.
  4. En `src/sections/xat/XatSection.jsx:1544`, el component `<Conversa>` rep `peu={senseSessio ? <AccesAlXat t={t} navigate={navigate} /> : null}`, la qual cosa injecta els 3 botons al peu de tota conversa oberta quan no hi ha sessió.
- **Severitat justificada:** Alta (deute d'experiència d'usuari prioritzat pel Mestre com a `P1-54`; satura l'espai vertical i empapussa l'usuari dins de comunitats i fils).
- **Font de veritat amb què entra en conflicte:** Pla canònic `_wiki_de_poble/04_escriptori/261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 1) i Llibre Mestre (`P1-54`).
- **Proposta conservadora (per a l'execució de Claude a `src/`):**
  1. Definir l'estat d'aterratge pur a `src/sections/xat/XatSection.jsx:1266`:
     ```js
     const esAterratgeXat = !threadId && !activeThread && !comunitatId && !vista && !amb && !sobre && !connectionContext;
     const peuDAcces = senseSessio && esAterratgeXat ? (
       <div className="sdp-xat-llista__peu">
         <AccesAlXat t={t} navigate={navigate} />
       </div>
     ) : null;
     ```
  2. Passar `peu={null}` a `<VistaDeLaClosca>` (`XatSection.jsx:1407`), eliminar `{vistaNode && vistaActiva !== 'comunitats' ? peuDAcces : null}` (`XatSection.jsx:1509`) i passar `peu={null}` a `<Conversa>` (`XatSection.jsx:1544`).
  3. Actualitzar les proves a `src/sections/xat/XatSection.avatars.test.jsx:388-500` i `src/sections/xat/XatSection.acces.capes.test.js` per verificar que els 3 botons apareixen exclusivament a `/xat` (aterratge genèric) i desapareixen a `/xat?comunitat=fake-sdp`, `/xat?comunitat=fake-poble`, `/xat?vista=comunitats` i `/xat/fil-iaia`.
- **`requires_human_decision`:** `false` (mandat explícit aprovat pel Mestre).

---

### 2. Bloc 2 · Pàgina Viva de Comunitat al Panell Principal (Fita `P1-55`)

- **Fitxer o àmbit afectat:** `src/sections/xat/XatSection.jsx` (línies `552-554`, `1537`, `1540-1591`).
- **Evidència reproduïble:**
  1. En `src/sections/xat/XatSection.jsx:552-554`, quan l'URL porta `?comunitat=fake-sdp` o `?comunitat=fake-poble`, `comunitatOberta` es resol mitjançant `resolComunitat(comunitats, comunitatId)`. L'objecte `comunitatOberta.fil.subjecte` conté `{ tipus: 'entitat' | 'poble', id, nom, ruta }` (per a `fake-sdp`: `{ tipus: 'entitat', id: 'socdepoble', ruta: '/projecte' }`; per a `fake-poble`: `{ tipus: 'poble', id: 'la-torre-de-les-macanes', ruta: '/pobles/la-torre-de-les-macanes' }`).
  2. No obstant això, en `src/sections/xat/XatSection.jsx:1537`, `<EntradaDelPoble>` només s'activa quan `aLaLlista={!threadId && pathname === '/xat' && !params.toString()}` (quan no hi ha cap paràmetre a l'URL).
  3. Quan hi ha `?comunitat=fake-sdp` o `?comunitat=fake-poble` i encara no s'ha triat cap canal (`!activeThread`), `rightColumn` (`XatSection.jsx:1589`) cau al cas per defecte `<ColumnaDretaBuida t={t} seo={seoXat} />`, que renderitza `DocumentDestacatDiferit` (la targeta estàtica genèrica d'«El Xat»).
- **Severitat justificada:** Alta (`P1-55`; trenca la continuïtat espacial quan l'usuari fa clic en una comunitat i espera veure la fitxa viva del poble o entitat al panell dret).
- **Font de veritat amb què entra en conflicte:** Pla canònic `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 2) i Llibre Mestre (`P1-55`).
- **Proposta conservadora:**
  1. Crear un component lleuger `PaginaVivaComunitat` (o delegar en `FitxaPublica` amb `chrome="context"`, que ja s'importa a `XatSection.jsx:19`) quan `!activeThread && comunitatOberta`:
     - Si `comunitatOberta.fil?.subjecte?.tipus === 'poble'`, buscar el municipi a `towns` per `slug` o `id` (`la-torre-de-les-macanes`) i mostrar la seua fitxa viva de poble (imatge panoràmica, comarca, població, descripció de Viquipèdia i avisos de la comunitat) o `FitxaPublica` contextual, mantenint `<SeoDelXat seo={seoXat} />` perquè el títol del document navegador continue sent el del Xat.
     - Si `comunitatOberta.fil?.subjecte?.tipus === 'entitat'` (com `socdepoble`), renderitzar `<FitxaPublica tipus="entitat" id={subjecte.id} chrome="context" />` (o la pàgina `projecte` en mode lectura contextual) precedida de `<SeoDelXat seo={seoXat} />`.
  2. Mantindre `<ColumnaDretaBuida t={t} seo={seoXat} />` únicament quan no hi ha ni `activeThread` ni `comunitatOberta`.
- **`requires_human_decision`:** `false`.

---

### 3. Bloc 3 · Sanejament de la Consola Termodinàmica i Maquinària Pública

#### 3.1. Targetes de Govern a la Consola incrustada (`ConsolaSection.jsx`)
- **Fitxer o àmbit afectat:** `src/sections/consola/ConsolaSection.jsx` (línies `57-63` i `238-247`).
- **Evidència reproduïble:** `ConsolaIncrustada` (`ConsolaSection.jsx:238-247`), usada a `/wikidepoble?item=consola_termodinamica`, només munta `<ConsolaTauler consola={consola} mapa={mapa} />` i omet `useGovern()`, `<AlertaVigilancia />`, `<SeccioGovern govern={govern} ara={ara} />` i `<h2>{TITOL_SALA_MAQUINES}</h2>`.
- **Severitat justificada:** Mitjana (divergència funcional entre `/consola` i la vista incrustada a la Wiki).
- **Font de veritat amb què entra en conflicte:** Pla canònic `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 3.1).
- **Proposta conservadora:**
  En `ConsolaIncrustada` (`src/sections/consola/ConsolaSection.jsx:238-247`), afegir `const govern = useGovern({ actiu: import.meta.env.DEV === true });` i `const ara = Date.now();`, i renderitzar `<AlertaVigilancia consola={consola} mapa={mapa} />`, `<SeccioGovern govern={govern} ara={ara} />`, `<h2 className="sdp-consola__seccio-titol">{TITOL_SALA_MAQUINES}</h2>` i `<ConsolaTauler consola={consola} mapa={mapa} alertaFora ara={ara} />`. Actualitzar el comentari de les línies `57-63` i les proves de `ConsolaSection.test.jsx` / `WikiDePobleSection.consolaDiferida.test.jsx`.
- **`requires_human_decision`:** `false`.

#### 3.2. Calendari de processos i tasques mortes (`registre_tasques.json` / `org.socdepoble.higiene.plist`)
- **Fitxer o àmbit afectat:** `.agents/cron/registre_tasques.json`, `scripts/immunitari/org.socdepoble.higiene.plist`, `.immunitari/higiene-cron.out` i `src/sections/consola/mapa/construeixMapa.js` (`534-552`).
- **Evidència reproduïble:** L'execució de `node tooling/brain/mapa-consola.mjs` emet 2 avisos de severitat `alta` (`codi: "tasca-morta"`):
  - `tasca:higiene-basica`: `llançador instal·lat · darrera activitat 2026-10-14T02:51:20.337Z`.
  - `tasca:higiene-diaria`: `llançador instal·lat · darrera activitat 2026-10-14T02:51:20.337Z`.
  La causa exacta és que `construeixMapa.js:548-551` comprova l'`mtime` de `.immunitari/higiene-cron.out` i exigeix que `ara - mtime <= interval * 2` (48 hores). Com que `scripts/immunitari/org.socdepoble.higiene.plist` té `<key>RunAtLoad</key><false/>` i `StartCalendarInterval` a les `05:30`, quan el Mac està en repòs a les `05:30` `launchd` no l'executa en despertar si no té `RunAtLoad` o execució de represa.
- **Severitat justificada:** Alta (degrada la mètrica `vigilants-vius` a `1/3` i genera 2 alertes roges al Mapa de la Consola).
- **Font de veritat amb què entra en conflicte:** Pla canònic `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 3.2).
- **Proposta conservadora:**
  1. Canviar `<key>RunAtLoad</key><false/>` a `<key>RunAtLoad</key><true/>` en `scripts/immunitari/org.socdepoble.higiene.plist` (i sincronitzar `~/Library/LaunchAgents/org.socdepoble.higiene.plist`).
  2. Executar `node tooling/higiene/cron_higiene.mjs >> .immunitari/higiene-cron.out 2>> .immunitari/higiene-cron.err` perquè `.immunitari/higiene-cron.out` actualitze el seu `mtime` amb una execució real i `vigilants-vius` passe immediatament a `3/3 (100%)`.
- **`requires_human_decision`:** `false`.

#### 3.3. Podada de la skill `sdp-vigilant-tellado`
- **Fitxer o àmbit afectat:** `.agents/skills/sdp-vigilant-tellado/SKILL.md` i `.agents/skills_manifest.sha256`.
- **Evidència reproduïble:** `node tooling/brain/mapa-consola.mjs` reporta l'avís `node: "skill:sdp-vigilant-tellado"`, `codi: "pes"`, `evidencia: "3263 paraules · ~4242 tokens"`. En `src/sections/consola/mapa/construeixMapa.js:33-34`, els llindars màxims són `MAX_PARAULES = 3000` i `MAX_TOKENS = 4000` (on `tokens = Math.round(paraules * 1.3)`). Per tant, qualsevol nombre de paraules `<= 3000` produeix `<= 3900` tokens i satisfà ambdós llindars.
- **Severitat justificada:** Baixa (avís groc d'higiene al Mapa de la Consola).
- **Font de veritat amb què entra en conflicte:** Pla canònic `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 3.3).
- **Proposta conservadora:**
  Condensar ~320 paraules a `.agents/skills/sdp-vigilant-tellado/SKILL.md` (deixant-la al voltant de `2.920` paraules / `~3.796` tokens) eliminant repeticions retòriques a les seccions 2, 4 i 9 i conservant íntegres totes les taules, regles de seguretat, arquitectura de 3 capes i exemples d'auditoria. Tot seguit, executar `node tooling/gates/segella.mjs` per regenerar l'empremta a `.agents/skills_manifest.sha256`.
- **`requires_human_decision`:** `false`.

#### 3.4. Transparència pública de Tractors, Sentinelles i BIOS en producció (`!DEV`)
- **Fitxer o àmbit afectat:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx` (`65-128`), `src/sections/tractors/PanellTractors.jsx` (`404-410`, `436-439`), `src/sections/tractors/PanellSentinelles.jsx` (`266-275`), `src/sections/wiki-de-poble/WikiDePobleSection.produccio.test.jsx` i `src/sections/wiki-de-poble/WikiDePobleSection.einesLocals.test.jsx`.
- **Evidència reproduïble:**
  1. En `src/sections/wiki-de-poble/WikiDePobleSection.jsx:83-85`, `modulsLocalsActius(env)` retorna `{ categories: [], items: [] }` quan `env?.DEV !== true`.
  2. En `src/sections/wiki-de-poble/WikiDePobleSection.jsx:122-128`, `EINES_LOCALS` val `null` quan `!import.meta.env.DEV`, impedint que un visitant en producció puga consultar la documentació i les fitxes de `tractors_aprovacio`, `sentinelles_panell` i `agents_panell`.
- **Severitat justificada:** Mitjana (oculta l'enginyeria pública de la Maquinària en producció).
- **Font de veritat amb què entra en conflicte:** Pla canònic `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 3.4: «Fer accessible la documentació pública de Tractors, Sentinelles i BIOS en producció (`!DEV`), garantint la primacia del coneixement obert i desactivant els botons d'acció mecànica si no estem en desenvolupament»).
- **Proposta conservadora:**
  1. En `src/sections/wiki-de-poble/WikiDePobleSection.jsx`, fer que `modulsLocalsActius()` retorne sempre `MODULS_LOCALS_DEV` (o reanomenar la constant interna mantenint l'exportació `modulsLocalsActius` per compatibilitat) i que `EINES_LOCALS` carregue sempre amb `lazy()` `PanellTractors.jsx`, `PanellSentinelles.jsx` i `PanellAgents.jsx`.
  2. En `src/sections/tractors/PanellTractors.jsx` (`:404-410`, `:436-439`), afegir una prop `esDev = import.meta.env?.DEV === true` i desactivar (`disabled={!esDev}`) els botons d'acció mecànica (`Aprova esta versió`, `Revoca`, `Exporta el registre`, `Oblida...`), mostrant una nota informativa de lectura pública quan `!esDev`.
  3. En `src/sections/tractors/PanellSentinelles.jsx` (`:266-275`), quan `!esDev`, ocultar o desactivar el selector de fitxers `<CampText tipus="file" ... />` d'execució sobre la carpeta de la Gestoria, deixant visible la fitxa tècnica de cada sentinella.
  4. `PanellAgents.jsx` ja és 100% consultiu (només mostra la graella de les 4 capes de la BIOS i el diàleg de detall amb fitxa i JSON), per la qual cosa funciona en producció sense mutacions.
  5. Actualitzar `src/sections/wiki-de-poble/WikiDePobleSection.produccio.test.jsx` i `WikiDePobleSection.einesLocals.test.jsx` per reflectir el nou contracte de transparència pública.
- **`requires_human_decision`:** `false`.

---

### 4. Bloc 4 · Neteja Apple Guideline 2.3.10 (Troballa `T1-06`)

- **Fitxer o àmbit afectat:** `src/sections/text/legalContent.js` (`línia 180`), `src/sections/text/pageContent.js` (`línia 162`, clau `roadmap`) i `src/sections/text/TextSection.jsx`.
- **Evidència reproduïble:**
  1. En `src/sections/text/legalContent.js:180`, l'apartat 10 («Com esborrar el teu compte i les teues dades») conté literalment:
     `<p>Pots esborrar el teu compte de <strong>Sóc de Poble</strong> (el web socdepoble.org i l'aplicació Sóc de Poble per a Android i iPhone) quan vulgues i sense cap cost. Hi ha dos camins:</p>`
  2. En `src/sections/text/pageContent.js:162` (`PAGE_COPY.roadmap.html`), dins del tercer bloc HTML comentat (`<!-- <div> ... PWA Instal·lable Clean ... </div> -->`), apareix la frase:
     `Sóc de Poble no es descarrega de l'App Store d'Apple ni de Google Play, evitant els seus percentatges abusius i censures.`
  3. **Alerta crítica per a la implementació de Claude:**
     - **Restricció 1 (`pageContent.roadmap.test.js`):** La prova `src/sections/text/pageContent.roadmap.test.js:51,93` verifica explícitament `const COMENTADES = 4;` (`expect(comentades).toHaveLength(COMENTADES)`). Si s'esborra el comentari HTML de `PWA Instal·lable Clean`, el test fallarà amb `3 !== 4`.
     - **Restricció 2 (`frontissa-contingut.mjs`):** La clau `roadmap` de `PAGE_COPY` està protegida per empremta SHA-256 i longitud d'HTML a `.agents/contingut_estructural.json`. Qualsevol canvi de caràcters dins de `PAGE_COPY.roadmap` a `src/sections/text/pageContent.js` fa fallar `node tooling/gates/frontissa-contingut.mjs` si no s'aprova l'empremta.
- **Severitat justificada:** Alta (risc de rebuig en la revisió d'Apple App Store segons la Guideline 2.3.10 per mencions a plataformes competidores o crítiques a l'App Store dins del bundle).
- **Font de veritat amb què entra en conflicte:** Pla canònic `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 4) i Llibre Mestre (`T1-06`).
- **Proposta conservadora:**
  1. En `src/sections/text/legalContent.js:180` (que no està blocat per `.agents/contingut_estructural.json`), substituir `(el web socdepoble.org i l'aplicació Sóc de Poble per a Android i iPhone)` per `(el web socdepoble.org i l'aplicació mòbil de Sóc de Poble)`. Això és net tant en web com en app nativa i elimina la menció innecessària a Android en l'avís legal.
  2. Per a `PAGE_COPY.roadmap.html` (`src/sections/text/pageContent.js:162`):
     - **Via A (sense tocar `.agents/contingut_estructural.json`):** `TextSection.jsx` ja passa l'HTML per `sanitizeHtml(resolRecursosDeHtml(page.html))` (`DOMPurify`), que elimina tots els comentaris HTML del DOM renderitzat; i si es vol sanitització addicional en runtime quan `esAppNativa()` és cert, `TextSection.jsx` pot aplicar una funció pura `netejaMencionsPlataformaNativa(html)` quan `esAppNativa()` retorna `true`.
     - **Via B (netejant el literal a `pageContent.js:162`):** Substituir dins del comentari de `PWA Instal·lable Clean` la frase per `Sóc de Poble s'instal·la com a aplicació web des del navegador cap a la pantalla d'inici, sense intermediaris comercials.` (mantenint l'etiqueta `<a href="/wikidepoble?item=00_full_de_ruta">` perquè `COMENTADES = 4` continue en verd) i actualitzar l'empremta de `roadmap` amb `node tooling/gates/frontissa-contingut.mjs --aprova roadmap --per Mestre` si el Mestre ho autoritza.
- **`requires_human_decision`:** `true` (únicament per decidir si s'actualitza l'empremta de `roadmap` a `.agents/contingut_estructural.json` amb `--aprova roadmap`, o si es manté la neteja en `legalContent.js` + filtre natiu a `TextSection.jsx`).

---

### 5. Bloc 5 · Recerca de Comunicació, Bucle Autònom i Millora de `prompt_local.md`

- **Fitxer o àmbit afectat:** `tooling/documental/turns.mjs`, `_wiki_de_poble/04_escriptori/`, `.agents/ESTAT.md` i `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v3.10.0).
- **Evidència reproduïble:**
  Durant aquesta sessió de Guarda Nocturna han operat simultàniament tres processos d'agents sobre el mateix arbre físic:
  - `torn_f19d6d9c-2c50-48fb-a1f6-b55958347b9f` (`actor: "claude"`, `scope: "code"`)
  - `torn_bbd0c797-e682-45b7-a5b7-1078fa6a1b83` (`actor: "agent-local"` / Codex, `scope: "documents"`)
  - `torn_8160d52d-62fe-4689-a0bf-14051394195f` (`actor: "gemini-4-argon"`, `scope: "documents"`)
   A més, `node tooling/brain/mapa-consola.mjs` detecta actualment un avís de severitat mitjana: `document:.agents/runtime/turns` (`codi: "torns-caducats"`, `18 torns caducats sense tancar`).
- **Severitat justificada:** Mitjana (risc de condicions de carrera en editar fitxers compartits com `00_index_escriptori.md`, `03_llibre_mestre_tasques_i_idees.md` o `.agents/ESTAT.md`, i soroll al Mapa per torns caducats).
- **Font de veritat amb què entra en conflicte:** Pla canònic `261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Bloc 5 i §6.4).
- **Proposta conservadora (Protocol de Colmena Autònoma a Tres Bandes):**
  1. **Partició estricta d'abast (`scope`) per torn:**
     - En un torn triple simultani, només **un agent** obri torn amb `--scope code` (Claude, encarregat de mutar `src/` i executar proves amb escriptura).
     - Els altres dos agents (Codex i Gemini) obrin torn amb `--scope documents` i operen en lectura quirúrgica o sobre un `git worktree` efímer i desenganxat (`git worktree add --detach /private/tmp/sdp-guarda-codex HEAD`) per a executar suites pesades sense bloquejar l'índex de Git ni interferir amb els canvis en curs a `src/`.
  2. **Escriptura atòmica `compare-and-swap` (CAS) per a índexs i Llibre Mestre:**
     - Quan un agent actualitza un fitxer compartit (`00_index_escriptori.md`, `03_llibre_mestre_tasques_i_idees.md` o `.agents/ESTAT.md`), llig primer el contingut i en calcula el `sha256` previ.
     - Construeix el nou contingut de manera additiva (inserint només la seua fila o subsecció sense esborrar les línies afegides fa segons per un altre agent), verifica que el `sha256` en disc no ha canviat just abans d'escriure a un fitxer temporal `.tmp.<pid>` i executa `fs.renameSync` (atòmic en POSIX/APFS).
  3. **Recol·lecció d'escombraries de torns caducats (`turns.mjs gc`):**
     - Incorporar a `tooling/higiene/cron_higiene.mjs` (o en `tooling/documental/turns.mjs`) una subcomanda `gc` que arxive o tanque com a `expired` els fitxers de `.agents/runtime/turns/*.json` amb `expiresAt < ara`, eliminant l'avís `torns-caducats` (18 torns) del Mapa de la Consola.
  4. **Feedback tècnic sobre la plantilla `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` (v3.10.0):**
     - **Correcció de ruta:** A la secció `Context Tècnic i Arquitectònic` (`prompt.local.s3`), la plantilla cita `taxonomia_documental.md` a l'arrel, però la ruta canònica real és `_wiki_de_poble/02_saber/taxonomia_documental.md`.
     - **Verificació prèvia de rutes d'objectiu:** Quan el prompt cite un component (com `AccesAlXat.jsx`), convé validar amb `ls` o `grep` si és un fitxer independent o un subcomponent en línia (`XatSection.jsx:1732`) per estalviar lectures fallides als tres agents.
     - **Taula d'assignació de rols al prompt conjunt:** Quan un mateix prompt s'entrega a Claude, Codex i Gemini alhora, afegir una taula breu a `prompt.local.s_instruccio` amb la columna `Agent | Rol en aquest torn | Fitxers d'eixida` evita qualsevol trepitjada de fitxers a `src/`.
- **`requires_human_decision`:** `false`.

---

### 6. Dictamen de Rèplica sobre la Implementació de Claude (`261027_0925`) i Auditoria Preventiva de WordPress.org

#### 6.1. Certificació de `P1-54` (`CL-01`) i `P1-55` (`CL-02`) sobre l'arbre viu
- **Fitxer o àmbit afectat:** `src/sections/xat/XatSection.jsx` (línies `49-53`, `1279-1286`, `1522`, `1553`, `1600-1611`) i `src/sections/xat/components/FitxaVivaDeComunitat.jsx` (`1-71`).
- **Evidència reproduïble:**
  1. **`P1-54` (`[CONFORME]`):** En `src/sections/xat/XatSection.jsx:1280`, `const esAterratge = !threadId && !comunitatId && !vista && !amb && !sobre;` i la supressió de `peu` a `<Conversa>` i `<VistaDeLaClosca>` deixen `AccesAlXat` exclusivament a l'aterratge genèric `/xat`. Validem expressament l'exclusió de `!connectionContext` que justifica Claude: tancar el diàleg «Nova conversa» conserva `?context=` a l'URL mentre l'usuari continua a la portada genèrica sense fil ni comunitat.
  2. **`P1-55` (`[CONFORME]`):** `FitxaVivaDeComunitat.jsx` es carrega en diferit (`lazy()`), resol el subjecte via `usePerfilPublic(idSubjecte)` (`PerfilPublicSection.jsx`) amb replegament síncron sobre `fitxaDelSubjecte(subjecte)` (`xatDelPoble.js`), i delega en `FitxaPublica` (`chrome="context"`, `ambXat={false}`) per a organitzacions i en `VistaDelPoble` (`layout="page"`, `senseXat`, `onComment={false}`) embolicada dins de `.sdp-xat-buit` (`overflow-y: auto`) per a pobles. Es preserva l'ordre d'avaluació `conversa -> error de reobertura -> comunitat -> aterratge` i la sobirania de `<SeoDelXat seo={seoXat} />`.
- **Severitat justificada:** Informativa (auditoria de conformitat en verd sobre el codi ja implementat).
- **Font de veritat amb què entra en conflicte:** Cap; compleix íntegrament `_wiki_de_poble/04_escriptori/261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md` (§Blocs 1 i 2).
- **Proposta conservadora:** Mantindre la implementació tal com ha quedat a `src/sections/xat/XatSection.jsx` i `src/sections/xat/components/FitxaVivaDeComunitat.jsx`.
- **`requires_human_decision`:** `false`.

#### 6.2. Validació de la Diagnosi TCC (`CL-06`) i de la Poda de Tellado (`CL-07`)
- **Fitxer o àmbit afectat:** `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/mestre_higiene.sh`, `mestre_skill.sh`, `scripts/immunitari/org.socdepoble.higiene.plist` i `.agents/skills/sdp-vigilant-tellado/SKILL.md`.
- **Evidència reproduïble:**
  1. **`CL-06` (`[CONFORME — Esmena acceptada]`):** L'evidència del log unificat (`2026-10-27 05:30:05.847746+0100 kernel: Sandbox: xpcproxy(37705) System Policy: deny(1) file-write-create .../socdepoble.org/.immunitari/higiene-cron.out` -> `posix_spawn: error 1: Operation not permitted`) demostra que la causa arrel era el bloqueig TCC de macOS sobre `~/Documents` quan `launchd` obri `StandardOutPath` abans d'`execve`, i no l'absència de `RunAtLoad`. Acceptem l'esmena: redirigir `StandardOutPath` i `StandardErrorPath` a `~/Library/Logs/socdepoble-higiene.out` i `.err` (`mestre_higiene.sh`) resol el problema d'arrel.
  2. **Observació preventiva addicional sobre `org.socdepoble.plaquetes`:** Com que `.immunitari/cron.out` només funciona ara mateix gràcies a l'atribut estès `com.apple.macl`, qualsevol recreació neta del fitxer o de la carpeta `.immunitari/` sense eixe xattr faria caure també `org.socdepoble.plaquetes` en `EX_CONFIG (78)`. Recomanem al Mestre migrar en una onada futura els logs de `plaquetes` a `~/Library/Logs/` amb el mateix patró.
  3. **`CL-07` (`[CONFORME]`):** La poda de Claude a `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/SKILL.sdp-vigilant-tellado.podat.md` deixa el document en **2.913 paraules (`~3.787` tokens)**, amb un marge segur de 87 paraules sota el llindar de `3.000`, preservant el frontmatter byte a byte i les 33 regles (`VIG-01..06`, `VA1..9`, `VB1..12`, `VC1..6`). Avalem aplicar `mestre_skill.sh` per damunt de l'Annex B de Codex (`2.991` paraules, marge de 9 paraules).
- **Severitat justificada:** Informativa (dictamen de consens tècnic entre agents).
- **Font de veritat amb què entra en conflicte:** Cap.
- **Proposta conservadora:** Executar els dos scripts preparats per Claude (`mestre_higiene.sh` i `mestre_skill.sh`).
- **`requires_human_decision`:** `true` (execució pel Mestre fora de la caixa d'arena de `.agents/` i `~/Library/LaunchAgents/`).

#### 6.3. Dictamen sobre els 4 Valors per Defecte de Comunitats (`CL-03`)
- **Fitxer o àmbit afectat:** `src/sections/xat/components/FitxaVivaDeComunitat.jsx` i `src/sections/xat/XatSection.jsx`.
- **Evidència reproduïble:**
  Revisats els 4 punts de disseny oberts a `CL-03` de `261027_0925_auditoria_claude.md`, emetem el dictamen següent:
  - **`(a)` Botons de xat ocults dins de la fitxa viva (`ambXat={false}`, `senseXat`, `onComment={false}`):** **`[CONFORME]`**. L'usuari ja es troba dins de `/xat?comunitat=...` amb els canals desplegats a l'esquerra; qualsevol botó «Xat» o «Comentar» dins de la fitxa dreta seria circular.
  - **`(b)` Replegament a `ColumnaDretaBuida` si la comunitat no es pot resoldre (entitat privada, timeout de 3 s o subjecte no previst):** **`[CONFORME]`**. Mai s'ha de mostrar un perfil sintètic fals quan la resolució pública falla o expira.
  - **`(c)` Fitxa viva visible en tauleta (`mitjà`) i escriptori (`ample`):** **`[CONFORME]`**. Tots dos punts de ruptura mostren les dues columnes simultàniament.
  - **`(d)` Targetes `El Xat · Anar al xat` i `Descàrregues` al fil de publicacions de la fitxa incrustada:** **`[CONFORME amb la recomanació de Claude]`**. Mantindre inicialment el mateix fil de publicacions que `/pobles/:slug` i `/entitat/:id` evita acoblar `PublicacionsDeLaFitxa.jsx` i `PublicacionsDelPoble.jsx` al contenidor. Si el Mestre decideix filtrar-ho, s'ha d'excloure **només** la targeta `'xat'` (`Anar al xat`) quan `chrome === 'context'`, conservant `'descarregues'` (que ja s'oculta automàticament en app nativa via `esAppNativa()`).
- **Severitat justificada:** Baixa (decisions de refinament de producte amb valors per defecte sans).
- **Font de veritat amb què entra en conflicte:** Cap.
- **Proposta conservadora:** Conservar els 4 valors per defecte actuals implementats per Claude.
- **`requires_human_decision`:** `true` (només si el Mestre vol alterar algun dels 4 comportaments per defecte).

#### 6.4. Auditoria Preventiva dels Canvis de WordPress.org (`empaqueta.mjs`, `includes/idioma.php` i `tests/enxufe-*.test.mjs`)
- **Fitxer o àmbit afectat:** `wordpress-plugin/eines/empaqueta.mjs` (`695-700`), `wordpress-plugin/includes/idioma.php` (`1-114`), `wordpress-plugin/includes/marcatge.php` (`443-446`), `tests/enxufe-plugin.test.mjs`, `tests/enxufe-pantalla.test.mjs` i `tests/enxufe-empaqueta.test.mjs`. *(Cap fitxer de `wordpress-plugin/` ni de `tests/` ha estat tocat per Gemini).*
- **Evidència reproduïble:**
  1. **Integritat en runtime a WordPress 6.5 / 6.6+ via `translate.wordpress.org` (`[CONFIRMAT]`):**
     - Des de WordPress 4.6+, les traduccions dels plugins allotjats al directori oficial es descarreguen a `WP_LANG_DIR/plugins/socdepoble-{locale}.mo` i `.l10n.php` (WP 6.5+) i es carreguen automàticament *Just-In-Time* (`_load_textdomain_just_in_time`) en la primera crida a `__()`, `_e()`, `esc_html__()`, etc., sense necessitat de cridar `load_plugin_textdomain()`.
     - **Preservació de la variant `ca_valencia`:** En `wordpress-plugin/includes/idioma.php:94-114`, la funció `socdepoble_enxufe_fitxer_ca( $fitxer, $domini )` està connectada als filtres `load_textdomain_mofile` i `load_script_translation_file` (prioritat 10, 2 arguments). Quan WordPress resol el paquet de `translate.wordpress.org` a `WP_LANG_DIR/plugins/socdepoble-ca_valencia.mo` (o `.json`), `socdepoble_enxufe_fitxer_ca` comprova `! file_exists( $fitxer )` i substituïx `socdepoble-ca_valencia` per `socdepoble-ca` dins del mateix `dirname( $fitxer )` (`WP_LANG_DIR/plugins/`), on en WordPress 6.5+ `WP_Translation_Controller` carrega automàticament el germà `socdepoble-ca.l10n.php` si existeix abans del `.mo`. Per tant, **retirar `load_plugin_textdomain()` i excloure `languages/` del zip de directori manté intacte el suport de `ca` i `ca_valencia` a WP 6.5/6.6+ via `translate.wordpress.org`**.
     - **Nota sobre `wp_set_script_translations` (`wordpress-plugin/includes/marcatge.php:445`):** Actualment passa un 3r argument `plugin_dir_path( SOCDEPOBLE_ENXUFE_FITXER ) . 'languages'`. Al nucli de WordPress (`load_script_textdomain`), `WP_LANG_DIR . '/plugins'` es consulta sempre **abans** que el 3r paràmetre `$path`, de manera que en WordPress.org continuarà trobant els `.json` de `translate.wordpress.org` encara que `languages/` no estiga al zip del directori. Tanmateix, si es vol evitar passar una ruta inexistent en el paquet del directori (o si es retira el 3r paràmetre quan el directori no existeix), cal vigilar la línia `334` de `tests/enxufe-plugin.test.mjs`.
  2. **Mapa exacte d'assercions a `tests/enxufe-*.test.mjs` que Claude ha d'actualitzar per evitar regressions:**
     - **`tests/enxufe-plugin.test.mjs`:**
       * **Línies `359-360`, `390` i `545` (CRÍTICA):** La taula `FUNCIONS_WP` conté `is_textdomain_loaded: '3.0'` (`:359`) i `load_plugin_textdomain: '1.5'` (`:360`), i `GANXOS_WP` conté `plugin_locale: '3.0'` (`:390`). La línia `545` executa `assert.deepEqual(TAULA_WP.filter((api) => !usades.has(api)), [], 'entrades de la taula que el plugin ja no crida');`. Si s'elimina `load_plugin_textdomain()` (o la funció `socdepoble_enxufe_carrega_traduccions`) d'`includes/idioma.php` sense retirar de `FUNCIONS_WP`/`GANXOS_WP` les API que ja no s'usen, **la línia `545` fallarà immediatament**.
       * **Línies `571-575`:** La prova `'WP 6.5+: idioma.php no registra res fora de la reserva 5.8–6.4'` verifica amb `idioma.replace(...)` el bloc exacte `if ( class_exists( 'WP_Translation_Controller' ) ) { return; }` seguit de `socdepoble_enxufe_carrega_traduccions` i `add_action( 'init'...)`. Si `includes/idioma.php` es redueix només a `socdepoble_enxufe_fitxer_ca` (o es modifica l'estructura de la reserva), cal ajustar aquesta prova.
       * **Línia `687`:** `assert.match(llig('includes/idioma.php'), /^add_action\( 'init', 'socdepoble_enxufe_carrega_traduccions', 1 \);$/m);` fallarà si es retira el ganxo `init` de `socdepoble_enxufe_carrega_traduccions`.
       * **Línia `259`:** `assert.equal(capcalera(principal, 'Domain Path'), '/languages');` — si la capçalera `Domain Path` es retira de `socdepoble-enxufe.php` (o de `variantDirectori` a `empaqueta.mjs`), cal ajustar aquesta línia (i `tests/enxufe-empaqueta.test.mjs:313`).
     - **`tests/enxufe-pantalla.test.mjs`:**
       * **Línia `230`:** El control negatiu del test d'`ABSPATH` injecta `function socdepoble_enxufe_carrega_traduccions() {}` per provocar `Cannot redeclare`. Si `socdepoble_enxufe_carrega_traduccions` desapareix d'`includes/idioma.php`, la línia `230` s'ha de canviar a `function socdepoble_enxufe_fitxer_ca() {}`.
       * **Línies `348-368` (especialment línia `361`):** El test `'idioma (5.8–6.4): sense WP_Translation_Controller, carrega el .mo de ca quan el lloc és ca_valencia'` comprova `assert.deepEqual(resultat.textdomains, [['socdepoble', 'socdepoble/languages']], 'primer, load_plugin_textdomain de sempre');`. S'ha d'actualitzar en retirar `load_plugin_textdomain()`.
     - **`tests/enxufe-empaqueta.test.mjs`:**
       * **Línies `297`, `777-778` i `799-800`:** Aquestes tres proves comproven que la diferència de fitxers entre el zip del canal propi (`_wordpress_enxufe_`) i el zip del directori (`_wordpress_directori_`) és exclusivament `socdepoble/includes/actualitzador.php`. Si `entradesDirectori` (`wordpress-plugin/eines/empaqueta.mjs:695-700`) exclou `languages/` només al zip del directori (mantenint `languages/` al zip del canal propi per a la distribució autònoma fora de WordPress.org), cal actualitzar les línies `297`, `778` i `800` perquè esperen `actualitzador.php` + les entrades `socdepoble/languages/*`.
- **Severitat justificada:** Alta (prevenció de regressions en la bateria de conformitat del plugin abans del reenviament a WordPress.org).
- **Font de veritat amb què entra en conflicte:** Requisits del directori oficial de plugins de WordPress.org (revisió `'pended'` rebuda el `2026-10-27`).
- **Proposta conservadora:** Que Claude aplique en el seu torn d'escriptura la retirada de `load_plugin_textdomain()` a `wordpress-plugin/includes/idioma.php` i l'exclusió de `languages/` al zip de directori a `wordpress-plugin/eines/empaqueta.mjs`, sincronitzant alhora les assercions enumerades de `tests/enxufe-plugin.test.mjs`, `tests/enxufe-pantalla.test.mjs` i `tests/enxufe-empaqueta.test.mjs`.
- **`requires_human_decision`:** `false` (encàrrec ja autoritzat pel Mestre a Claude).

---

### 7. Consens d'Eixam: Blindatge OpenGraph per a WhatsApp i Xarxes (Fita `P1-61`) i Diàleg Creuat

#### 7.1. Diagnosi de les 3 Causes Encadenades de `/mercat/samarreta-socdepoble` i la Regla Invariant d'Imatge (`primeraImatgeSocial`)
- **Fitxer o àmbit afectat:** `index.html` (`29`), `firebase.json` (`10-14`), `vercel.json` (`69-74`), `tooling/gates/build-seo-manifest.mjs` (`158`), `wordpress-plugin/dist/seo-routes.json` (`278-281`), `_wiki_de_poble/04_escriptori/261027_0730_solucio_opengraph_i_copy_codex.md` (`build-social-manifest.mjs:811-875`), `src/sections/mercat/marketSeed.js` (`35-81`), `src/sections/mercat/imatgesDeProducte.js` (`39-57`), `src/sections/detail/detailSectionMeta.jsx` (`682-799`), `src/sections/detail/detailHelpers.jsx` (`14-30`), `src/sections/text/TextSection.jsx` (`80-86`) i `src/sections/wiki-de-poble/WikiDePobleSection.jsx` (`710-716`).
- **Evidència reproduïble:**
  1. **Causa 1 — Reescriptura estàtica cap a `/index.html` (`firebase.json:10-14`, `vercel.json:69-74`):** Quan el bot de WhatsApp (`WhatsApp/2.x`) demana `GET https://socdepoble.org/mercat/samarreta-socdepoble`, el servidor d'allotjament retorna el fitxer estàtic `/index.html`, on la línia `29` fixa `og:image = https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png`. Com que WhatsApp no executa JavaScript ni hidrata React (`useSEO`), llig únicament el mapa verd genèric.
  2. **Causa 2 — Omissió de l'array `images[]` al generador actual del manifest (`tooling/gates/build-seo-manifest.mjs:158`):** La línia `158` fa literalment `imatge: item.image_url || item.avatar_url || null`. En `src/sections/mercat/marketSeed.js:35-81`, la fitxa de `samarreta-socdepoble` no té `image_url`, sinó `images: ['/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png', ...]` (7 fotos) i `avatar_url: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png'`. En ignorar `item.images[0]`, `wordpress-plugin/dist/seo-routes.json:280` va gravar l'avatar quadrat verd (`logo-socdepoble-cuadrat-verd-256x256.png`) en lloc de la foto de la xica amb la samarreta (`01-chica-jersey.png`).
  3. **Causa 3 — Exclusió de les fitxes de `SEEDS` en el prototip de Codex (`build-social-manifest.mjs:838-848` a `261027_0730_solucio_opengraph_i_copy_codex.md`):** El constructor de Codex comentava `// mai detalls legacy de llavor` i només incloïa detalls si se li passava un `--snapshot` extern. Per tant, sense snapshot extern, les rutes canòniques vives `/mercat/samarreta-socdepoble`, `/mercat/mac-mini-m4`, `/pobles/la-torre-de-les-macanes` i `/events/aplec-2023` no entraven a `social-manifest.json` i queien en el fallback `generic` (`noindex, nofollow` + mapa verd).
  4. **auditoria de la Regla Invariant del Mestre («Primera imatge de la galeria o del cos») a totes les seccions:**
     - **Mercat (`/mercat/:id`):** En el client (`detailSectionMeta.jsx:755`), `buildMercatDetailSectionMeta.getImage` ja usa `primeraImatgeDeProducte(item) || item.avatar_url || null` (`imatgesDeProducte.js:52`), que llig `llistaImatgesDeProducte(item)[0]`. Cal portar exactament la mateixa prioritat al manifest de servidor/build (`item.images?.[0] || item.image_url || item.image || srcDeLaPrimeraImg(item.description || item.content) || item.avatar_url`) i, si no hi ha imatge a la galeria però n'hi ha una al cos HTML (`description` / `content`), extraure-la abans de caure a l'`avatar_url` o al logo de reserva.
     - **Mur (`/mur/:id`) i Esdeveniments (`/events/:id`):** En `src/sections/detail/detailSectionMeta.jsx:703` (`buildMurDetailSectionMeta.getImage`) i `:768` (`buildEventsDetailSectionMeta.getImage`), cal resoldre `item.images?.[0] || item.imageSrc || getFirstImage(item.image_url || item.image) || srcDeLaPrimeraImg(item.content || item.description) || null`. *(Alerta tècnica important: per al cos HTML s'ha d'usar `srcDeLaPrimeraImg(html)` de `src/sections/detail/detailHelpers.jsx:14-30` i **mai** `getFirstImage(html)`, perquè `getFirstImage` retorna el text pla sencer com a URL quan no troba cap `<img`!).*
     - **Pobles (`/pobles/:id`):** En `detailSectionMeta.jsx:781` i al manifest de servidor, resoldre `item.image_url || item.images?.[0] || srcDeLaPrimeraImg(item.description || item.content) || item.shield_url || null` (per a La Torre de les Maçanes: `/assets/uploads/poble/la-torre-de-les-macanes/portada/hero_panoramic_rural_view_1774720664221.png`).
     - **Pàgines editorials i de sistema (`PAGE_COPY` / `src/sections/text/TextSection.jsx:82`):** Actualment `TextSection.jsx:82` passa sempre `image: resolveAsset('/assets/system/ui/og-socdepoble-1200x630.png')` fixat en dur, ignorant si la pàgina té `page.image` o una primera `<img src="...">` dins de `page.html`. Tant `TextSection.jsx` com `build-social-manifest.mjs` han de resoldre `page.image || SOCIAL_IMAGES[key] || srcDeLaPrimeraImg(page.html) || BASE_IMAGE`.
     - **Articles de la Wiki (`/wikidepoble?item=...`):** En `WikiDePobleSection.jsx:714` i `build-social-manifest.mjs:870`, resoldre `SOCIAL_IMAGES[id] || attrs.image || primeraImatgeMarkdownOHtml(body) || BASE_IMAGE` (on `primeraImatgeMarkdownOHtml` extrau tant `<img src="([^"]+)">` com `![alt]((/assets/[^)\s]+))`).
     - **Notes:** Les notes privades de l'usuari (`/notes/:id`) es mantenen estrictament `noindex, nofollow` al servidor per sobirania de dades (mai exposades als bots), però al client (`buildNotesDetailSectionMeta:682`) `getImage` pot resoldre `item.header_image || item.image_url || item.images?.[0] || srcDeLaPrimeraImg(item.body || item.content) || null`; i tota nota publicada cap al Mur, Mercat o Esdeveniments ja viatja com a recurs públic amb la seua primera imatge de galeria o de cos.
  5. **Restricció física dels crawlers de WhatsApp (Dimensions `og:image:width`/`height` i pes `< 600 KB`):**
     - **Manca de `width`, `height` i `type` en `build-social-manifest.mjs:811-815`:** El prototip de Codex només emet `width: 1200, height: 630, type: 'image/png'` quan la imatge és `BASE_IMAGE`. Quan la imatge és una ruta com `/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png`, `normalizeImage()` omet `width`, `height` i `type`. En WhatsApp i Meta, si el `<head>` no inclou `og:image:width` i `og:image:height`, el crawler no renderitza la miniatura en la **primera** compartició d'un enllaç nou. Llegint les capçaleres binàries PNG/JPEG/WebP a `public/assets/...` durant `build-social-manifest.mjs`, totes les imatges locals eixiran amb `width`, `height` i `type` exactes (p. ex. `1024x1024`, `image/png`).
     - **Pes físic en disc de les imatges de llavor:** Hem verificat en disc (`public/assets/uploads/...`) que `01-chica-jersey.png` pesa **764 KB** (`1024x1024`, amb germà `.webp` de `110 KB`) i `hero_panoramic_rural_view_1774720664221.png` pesa **1,0 MB** (`1024x1024`, amb germà `.webp` de `250 KB`). Els crawlers mòbils de WhatsApp solen descartar o tallar per timeout imatges OpenGraph que superen els **300–600 KB**. Recomanem comprimir sense pèrdua visual apreciable els PNG d'`og:image` que superen 500 KB (o generar en build una variant `.jpg` d'`og:image` `<= 300 KB` per a les rutes amb PNG pesat) i abaixar el llindar d'alerta de `build-social-manifest.mjs` de `32 MiB` a un avís preventiu a partir de `600 KB`.
- **Severitat justificada:** Crítica (`P1-61`; bloqueja la difusió real de productes, pobles i publicacions de Sóc de Poble per WhatsApp i Telegram).
- **Font de veritat amb què entra en conflicte:** Mandat del Mestre (`P1-61`) i Llei de la Primera Imatge Social.
- **Proposta conservadora (Helper canònic compartit `primeraImatgeSocial`):**
  Unificar en un únic mòdul pur reutilitzable tant pel client (`src/hooks/socialImage.js` o `src/sections/detail/detailHelpers.jsx`) com pel generador de build (`tooling/seo/build-social-manifest.mjs`) la funció `primeraImatgeSocial(recurs, opcions)`:
  ```js
  // Ordre invariant per a qualsevol recurs públic (Mercat, Mur, Pobles, Events, Wiki, Pàgines):
  // 1) Galeria explícita: recurs.images[0] (o llistaImatgesDeProducte(recurs)[0])
  // 2) Imatge de capçalera / portada: recurs.imageSrc || recurs.image_url || recurs.header_image || recurs.image
  // 3) Primera imatge incrustada al cos (HTML <img src="..."> o Markdown ![alt](url)):
  //    srcDeLaPrimeraImg(recurs.content || recurs.description || recurs.html || recurs.body)
  // 4) Emblema o avatar de l'entitat/poble només quan el recurs no té cap foto de contingut:
  //    recurs.shield_url || recurs.avatar_url
  // 5) Reserva global (BASE_IMAGE): /assets/system/ui/og-socdepoble-1200x630.png
  ```
- **`requires_human_decision`:** `false` (regla invariant ordenada pel Mestre).

#### 7.2. Arquitectura Dual de Servidor i Hidratació SPA sense Penalització per als Humans
- **Fitxer o àmbit afectat:** `_wiki_de_poble/04_escriptori/261027_0730_solucio_opengraph_i_copy_codex.md` (§3 i §4: `social-edge.mjs`, `prepare-social-shell.mjs`, `build-social-manifest.mjs`, `social-worker.mjs`), `firebase.json`, `vercel.json`, `src/hooks/seoHead.js` (`19-88`) i `src/hooks/useSEO.js` (`27-35`).
- **Evidència reproduïble:**
  1. **Com evitar qualsevol penalització d'hidratació o latència per als usuaris humans (Arquitectura Dual Prerender Estàtic + Edge O(1)):**
     - **Pilar 1 — Prerender Estàtic de rutes de camí a `dist/<ruta>/index.html` durant el `npm run build`:**
       Actualment `socdepoble.org` es desplega en Firebase Hosting (`firebase.json:10-14`: `"rewrites": [{ "source": "**", "destination": "/index.html" }]`) i Vercel (`vercel.json`). En tots dos hostings (i també a Cloudflare Pages/Workers Assets i SiteGround/Apache), **els fitxers físics que existeixen dins de `dist/` tenen prioritat absoluta i se serveixen des de la CDN en 0 ms abans d'avaluar la reescriptura cap a `/index.html`**.
       Si en el pas `postbuild` (després de `prepare-social-shell.mjs` i `build-social-manifest.mjs`) un script lleuger `tooling/seo/prerender-social-routes.mjs` recorre totes les entrades `public` sense query string de `social-manifest.json` (com `/mercat/samarreta-socdepoble`, `/mercat/mac-mini-m4`, `/pobles/la-torre-de-les-macanes`, `/events/aplec-2023`, `/projecte`, `/el-xat`, `/mercat`, `/mur`, `/pobles`, etc.) i escriu `dist/<ruta>/index.html` combinant `social-shell.json` + `renderSocialHead(entry, origin)`:
       * **Funciona immediatament en el Firebase Hosting actual** sense necessitat d'esperar l'alta d'un Cloudflare Worker ni pagar invocacions de Cloud Functions.
       * **Latència 0 ms per a humans i bots:** L'HTML servit per la CDN conté exactament el mateix `<div id="root"></div>` i els mateixos scripts Vite amb hash que `/index.html`, però amb el bloc `<!-- SDP:SEO:START -->...<!-- SDP:SEO:END -->` ja particularitzat per a eixa ruta.
     - **Pilar 2 — Injecció Edge (`social-edge.mjs`) per a rutes amb query (`?item=...`) i publicacions vives de Supabase (`section_submissions`):**
       Les rutes que depenen de query string (`/wikidepoble?item=el-xat`, `/cerca?q=...`) o els nous ítems publicats en calent a Supabase entre compilacions necessiten el handler `social-edge.mjs` (desplegable com a Cloudflare Worker o Firebase Hosting Rewrite Function).
       Revisat el `social-edge.mjs` de Codex (`261027_0730_solucio_opengraph_i_copy_codex.md:507-568`), identifiquem **dues optimitzacions clau de rendiment i memòria cau** perquè l'Edge siga O(1) (< 0,1 ms de CPU) i no penalitze mai un humà:
       * **Eliminació del doble `fetchOrigin` + `sha256` en cada petició GET (`social-edge.mjs:520-528`):** En el codi de Codex, cada petició GET que entra al Worker fa un `await fetchOrigin(request)` cap a `/index.html`, llig tot el cos en memòria i calcula `sha256(originHtml)` amb `crypto.subtle.digest` abans d'utilitzar `shell.template`. Quan el Worker es desplega juntament amb el seu `social-shell.json` (mateix build), el `shell.template` ja està verificat i en memòria. Servir directament `shell.template[0] + renderSocialHead(metadata, origin) + shell.template[1]` estalvia un subrequest de xarxa i un hash criptogràfic en cada visita humana, i només cal recórrer a `fetchOrigin` si no es disposa de `shell.template`.
       * **Política de `Cache-Control` diferenciada a l'Edge (`social-edge.mjs:555-558`):** El prototip de Codex força `headers.set('cache-control', 'no-store')` en totes les respostes transformades. Per a rutes `generic` o privades (`/notes`, `/perfil`, `/xat`), `private, no-store` és correcte i obligatori. Però per a rutes `public` (`/mercat/samarreta-socdepoble`, `/wikidepoble?item=...`), substituir `no-store` per `public, max-age=0, s-maxage=60, stale-while-revalidate=300` permet que l'Edge/CDN absorbeixi ràfegues virals de WhatsApp i Telegram sense recalcular res durant 60 segons, mentre el navegador humà sempre revalida amb `max-age=0`.
  2. **Pilar 3 — Bug Crític d'Hidratació SPA a `src/hooks/seoHead.js:19-88` i `src/hooks/useSEO.js:34` quan s'entra per una ruta prerenderitzada o injectada a l'Edge:**
     - **Evidència exacta del defecte:** En `src/hooks/seoHead.js:82`, la primera vegada que es munta qualsevol vista React s'executa `baseline ||= capture()`. Si l'usuari humà obri l'aplicació directament des d'un enllaç de WhatsApp com `https://socdepoble.org/mercat/samarreta-socdepoble` (que gràcies al Prerender o a l'Edge ja porta al `<head>` inicial `og:image = .../01-chica-jersey.png` i `og:title = Samarreta Sóc de Poble...`), **`baseline` captura la samarreta com si fora l'estat base global de tota l'aplicació!**
     - Quan l'usuari navega tot seguit dins de la SPA cap a `/xat` o `/mur` (rutes que usen la imatge base per defecte, on `useSEO.js:34` retorna `{ url: base, base: true }`), `seoHead.js` crida `restore()` —que restaura la `baseline` contaminada amb la samarreta— i a la línia `60` executa:
       ```js
       if (!(baseUrl && image && (image.base || image.url === baseUrl))) {
         // No entra ací quan image.base === true!
       }
       ```
       Com que `seoHead.js:60` se salta l'escriptura d'`og:image` assumint que `restore()` ja ha posat el mapa verd d'`index.html`, **la foto de la samarreta (`01-chica-jersey.png`) es queda encallada en el DOM durant tota la sessió de navegació SPA**.
     - **Solució quirúrgica per a Claude (`src/hooks/useSEO.js` i `src/hooks/seoHead.js`):**
       1. En `src/hooks/useSEO.js:34`, quan es retorna la imatge base (`!raw || url === base`), retornar sempre el descriptor complet amb dimensions i alt canònics:
          ```js
          const BASE_IMAGE_ALT = 'Logotip de Sóc de Poble, Portal de Pobles Connectats, sobre el mapa verd';
          if (!raw) return { url: base, base: true, type: 'image/png', width: '1200', height: '630', alt: BASE_IMAGE_ALT };
          ```
       2. En `src/hooks/seoHead.js:58-70`, eliminar la condició d'omissió `if (!(baseUrl && image && (image.base || image.url === baseUrl)))` i escriure sempre de manera explícita `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`, `twitter:image` i `twitter:image:alt` quan `image?.url` estiga definit. Així el client és 100% idempotent tant si l'HTML inicial venia de `/index.html` com si venia d'una ruta injectada per l'Edge o prerenderitzada.
- **Severitat justificada:** Alta (evita que la injecció OpenGraph de servidor contamine la navegació SPA posterior i permet desplegament immediat en Firebase Hosting).
- **Font de veritat amb què entra en conflicte:** `src/hooks/seoHead.js:60` vs contracte d'injecció de servidor `261027_0730_solucio_opengraph_i_copy_codex.md`.
- **Proposta conservadora:** Adoptar l'Arquitectura Dual (Prerender Estàtic a `dist/<ruta>/index.html` + Edge `social-edge.mjs` per a `?item=` i snapshots dinàmics) juntament amb la correcció del `baseline` a `seoHead.js` i `useSEO.js`.
- **`requires_human_decision`:** `false`.

#### 7.3. Diàleg Creuat amb Codex (`GN-R01..08`) i Consens Tècnic de les Tres IAs
- **Fitxer o àmbit afectat:** `_wiki_de_poble/04_escriptori/261027_0917_auditoria_codex.md` (`GN-R01` a `GN-R08`) i `_wiki_de_poble/04_escriptori/261027_0925_auditoria_claude.md`.
- **Evidència reproduïble:**
  Després de llegir creuadament l'actualització v2.1.0 de Codex (`261027_0917_auditoria_codex.md`) i l'informe de Claude (`261027_0925_auditoria_claude.md`), fixem la nostra posició de consens punt per punt:
  1. **Sobre `GN-R01` de Codex (Recuperació d'`ErrorBoundary` al canvi de comunitat en `P1-55`):**
     - **Posició de Gemini: `[D'ACORD AMB CODEX]`**. En `src/sections/xat/XatSection.jsx:1897`, `<BarreraDelDocumentDestacat fallback={null}>` envolta `<FitxaVivaDeComunitat comunitat={comunitat} />` sense `key`. Com que `BarreraDelDocumentDestacat` és un component de classe React amb `state = { error: false }` i sense `componentDidUpdate`, si la càrrega d'una comunitat llança una excepció i l'usuari selecciona després una altra comunitat sana, `this.state.error` roman `true` i el panell dret queda buit fins a recarregar la pàgina.
     - **Acció per a Claude:** Afegir `key={comunitat.fil.id}` a `<BarreraDelDocumentDestacat key={comunitat.fil.id} fallback={null}>` en `src/sections/xat/XatSection.jsx:1897` (canvi d'1 línia, 0 risc).
  2. **Sobre `GN-R05` i `GN-R08` de Codex (Matisos de WordPress.org sobre `load_script_textdomain` i `ca_valencia` amb `WP_Translation_Controller`):**
     - **Posició de Gemini: `[ESMENA DE CODEX ACCEPTADA]`**. Codex té raó en dos detalls fins del nucli de WordPress 6.5+:
       * En `load_script_textdomain()`, WordPress comprova primer el 3r paràmetre `$path` si se li passa, i només consulta `WP_LANG_DIR . '/plugins'` quan `$path` és buit o no conté el fitxer. Com que al zip de directori ja no hi haurà carpeta `languages/`, deixar d'enviar el 3r paràmetre a `wp_set_script_translations( $manec, 'socdepoble' )` en `wordpress-plugin/includes/marcatge.php:443-446` (o passar-lo només si `is_dir(...)` existeix al canal propi) és més net i evita un `file_exists` inútil.
       * En WordPress 6.5+, `WP_Translation_Controller` i `WP_Textdomain_Registry::get_path_from_lang_dir()` cachegen els fitxers disponibles a `WP_LANG_DIR/plugins/`. Si un lloc està configurat en `ca_valencia` però `translate.wordpress.org` només ha instal·lat el paquet `socdepoble-ca.l10n.php` / `socdepoble-ca.mo` (sense cap fitxer `socdepoble-ca_valencia.*`), `_load_textdomain_just_in_time()` pot retornar `false` abans d'invocar el filtre `load_textdomain_mofile` si el registre no veu cap fitxer per a `ca_valencia` ni té `ca` com a fallback.
       * **Solució mínima per a Claude a `wordpress-plugin/includes/idioma.php` (100% compatible amb el revisor de WordPress.org perquè no crida `load_plugin_textdomain()`):** Mantindre `socdepoble_enxufe_fitxer_ca` als filtres `load_textdomain_mofile` i `load_script_translation_file`, i afegir un filtre lleuger a `lang_dir_for_domain` (o a `determine_locale` / `plugin_locale`) que, quan `$domain === 'socdepoble'` i el locale siga `ca_valencia` però no existisca `WP_LANG_DIR . '/plugins/socdepoble-ca_valencia.mo'` ni `.l10n.php`, apunte o replique la resolució cap a `ca`.
  3. **Sobre `GN-R06` i Annex D de Codex (Escriptura concorrent i bloqueig cooperatiu):**
     - **Posició de Gemini: `[D'ACORD AMB CODEX]`**. L'experiment sintètic de l'Annex D de Codex demostra que un CAS de lectura + `renameSync` sense lock d'exclusió mútua encara té una finestra microscòpica entre el check i el `renameSync`. Per tant, el protocol canònic per a fitxers compartits (`00_index_escriptori.md`, `03_llibre_mestre_tasques_i_idees.md`, `.agents/ESTAT.md`) i per a `mutateTurn` ha de combinar **lock de fitxer (`fs.openSync(lockPath, 'wx')`) + verificació de `sha256` dins del lock + `fs.renameSync` atòmic**.

#### 7.4. Pla d'Implementació Lligat i Consensuat perquè Claude l'Execute a Codi Font (`P1-61` + Tancament)
Deixem la llista d'execució ordenada i llista per a Claude:

1. **Microajust `P1-55` (`src/sections/xat/XatSection.jsx:1897`):**
   - Afegir `key={comunitat.fil.id}` a `<BarreraDelDocumentDestacat key={comunitat.fil.id} fallback={null}>`.
2. **Helper canònic de Primera Imatge (`src/sections/detail/detailHelpers.jsx` / `src/hooks/socialImage.js`):**
   - Implementar `primeraImatgeSocial(item)` que resolga en ordre estricte:
     1) Primera imatge de galeria (`llistaImatgesDeProducte(item)[0]` / `item.images?.[0]`),
     2) Imatge de capçalera (`item.imageSrc || item.image_url || item.header_image || item.image`),
     3) Primera imatge del cos HTML o Markdown (`srcDeLaPrimeraImg(item.content || item.description || item.html || item.body)`),
     4) Emblema o avatar (`item.shield_url || item.avatar_url`),
     5) Reserva global (`/assets/system/ui/og-socdepoble-1200x630.png`).
   - Connectar-lo a `detailSectionMeta.jsx` (`buildMercatDetailSectionMeta`, `buildMurDetailSectionMeta`, `buildEventsDetailSectionMeta`, `buildPoblesDetailSectionMeta`, `buildNotesDetailSectionMeta`), a `src/sections/text/TextSection.jsx:82` i a `src/sections/wiki-de-poble/WikiDePobleSection.jsx:714`.
3. **Sanejament d'hidratació SPA (`src/hooks/useSEO.js` i `src/hooks/seoHead.js`):**
   - En `useSEO.js:34`, retornar el descriptor complet de la imatge base (`url`, `base: true`, `type: 'image/png'`, `width: '1200'`, `height: '630'`, `alt`).
   - En `seoHead.js:60`, escriure sempre les etiquetes `og:image*` i `twitter:image*` en cada `apply()`, eliminant l'omissió quan `image.base === true` perquè entrar des d'una URL amb OpenGraph prerenderitzat no contamine la `baseline` en navegar cap a altres seccions.
4. **Pipeline de Build i Manifest OpenGraph (`tooling/gates/build-seo-manifest.mjs` + `tooling/seo/`):**
   - En `tooling/gates/build-seo-manifest.mjs:158` i en el nou `tooling/seo/build-social-manifest.mjs` (basat en `261027_0730_solucio_opengraph_i_copy_codex.md` §4.3), **incloure totes les fitxes públiques de `SEEDS` (`marketSeed`, `pobles`, `events`, `mur`)** aplicant `primeraImatgeSocial(item)` i extraient les dimensions reals (`width`, `height`, `type`) de la capçalera del fitxer a `public/assets/...`.
   - Comprimir o generar derivada social `< 500 KB` per a les imatges de llavor que superen els 600 KB (`01-chica-jersey.png` de 764 KB i `hero_panoramic_rural_view_1774720664221.png` d'1,0 MB) perquè WhatsApp mòbil les mostre al 100% en el primer enviament.
   - Afegir el pas de prerender estàtic (`tooling/seo/prerender-social-routes.mjs`) que emet `dist/<ruta>/index.html` per a totes les rutes públiques de camí (fent que `/mercat/samarreta-socdepoble` funcione immediatament a Firebase Hosting amb 0 ms de latència), i deixar `tooling/seo/social-edge.mjs` optimitzat (render des de `shell.template` en memòria i `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300` per a rutes `public`) per a rutes amb query (`?item=...`) i snapshots dinàmics de Supabase.
5. **Proves de regressió (`P1-61`):**
   - Afegir test que verifique que `GET /mercat/samarreta-socdepoble` (tant al manifest com a l'HTML prerenderitzat/Edge) emet `og:image = https://socdepoble.org/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png` amb `og:image:width`, `og:image:height` i `og:image:type`, i que navegar al client de `/mercat/samarreta-socdepoble` cap a `/xat` restaura `og-socdepoble-1200x630.png`.

---

### 8. Dictamen de Revisió Creuada i Salfumant Radical (OpenGraph `P1-61`, WordPress/Builds i Pàgina Viva `P1-55`)

#### 8.1. Auditoria del Pla d'OpenGraph `P1-61` (Codex `261027_1154` vs Claude `CL-12` vs Llibre Mestre)
- **Fitxer o àmbit afectat:** `_wiki_de_poble/04_escriptori/261027_1154_pla_implementacio_opengraph_primera_imatge.md` (`§2–§10`), `_wiki_de_poble/04_escriptori/261027_0925_auditoria_claude.md` (`CL-12:299-352`), `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (`P1-61:306-311`), `firebase.json`, `src/hooks/useSEO.js` i `src/hooks/seoHead.js`.
- **Evidència reproduïble i escletxes caçades amb Salfumant Radical:**
  1. **Escletxa 1 — Omissió de la Prioritat 0 (`item.og_image || item.featured_image` · Selector d'Autor de Fase 2) al contracte de Codex (`261027_1154:78-83`) i `CL-12` de Claude:**
     - El Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md:310-311`) ordena expressament: *«Quan un veí o entitat cree o edite un element amb diverses fotos, la interfície d'edició oferirà un selector per a triar quina de les imatges vol destacar per a xarxes. Ara mateix no cal implementar aquest selector visual, però el model de dades i la resolució d'imatge han de prioritzar `item.og_image || item.featured_image` per davant de la primera de la galeria quan aquest camp estiga present.»*
     - Tant la Regla 1 de Codex (`261027_1154:78`: *«1. Galeria editorial en l'ordre desat: primera foto»*) com el resum `CL-12` de Claude ometen aquest esglaó 0.
     - **Esmena obligatòria al selector pur `src/config/imatgeSocial.js`:** L'ordre de precedència per a qualsevol recurs públic ha de ser:
       * **Prioritat 0 (Selector d'Autor explícit):** `item.og_image || item.featured_image` (quan estiga definit i no siga buit).
       * **Prioritat 1 (Galeria editorial):** primera foto de la galeria (`llistaImatgesDeProducte(item)[0]` / `item.images?.[0]`).
       * **Prioritat 2 (Portada editorial real):** `item.imageSrc || item.image_url || item.header_image || item.image` (excloent reserves UI de `resolveTownImageUrl` i avatars de venedor, com apunten encertadament Codex i Claude).
       * **Prioritat 3 (Cos documental):** primera imatge real del cos HTML o Markdown (`srcDeLaPrimeraImg`, amb parser pur sense dependre de `DOMPurify` de navegador).
       * **Prioritat 4 (Reserva per absència total d'imatges, `state: 'absent'`):** `/assets/system/ui/og-socdepoble-1200x630.png` (amb l'única excepció de les fitxes de perfil públic sense hero ni foto de cos, on la seua pròpia imatge d'identitat/avatar és el subjecte de la pàgina). Acceptem l'esmena de Codex i Claude (`CL-12.3`) de no interposar emblemes o avatars d'autor davant de la reserva global en publicacions de Mur, Mercat o Agenda.
  2. **Escletxa 2 — Contradicció de la Reserva Global (`OG-1`) en el pla de Codex (`261027_1154:81`) vs el Llibre Mestre (`:308`) i els requisits de Meta:**
     - En la línia `81` de `261027_1154_pla_implementacio_opengraph_primera_imatge.md`, Codex afirma que quan `state: 'absent'`, la reserva ha de ser `public/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png` (`256×256 px`).
     - Això entra en contradicció directa amb el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md:308`: *«Si no hi ha cap imatge: serveix el logotip/mapa verd de Sóc de Poble (`og-socdepoble-1200x630.png`)»*) i amb l'especificació tècnica de Meta/WhatsApp (que exigeix un mínim de `300×200 px` i `1200×630 px` per a targeta gran; una imatge de `256×256 px` es degrada a miniatura o s'ignora).
     - **Dictamen sobre `OG-1` (`CL-12:342`):** **Avalem rotundament l'opció recomanada per Claude (`og-socdepoble-1200x630.png`, `1200×630 px`).**
  3. **Escletxa 3 — Prerender Estàtic (`Fase 1`) vs Edge (`Fase 2`), el fals `.png` de la samarreta i el perill ocult de `firebase.social.json` (`CL-12:328`):**
     - **Acord amb la divisió en Fase 1 (Estàtica des d'`app_content`) i Fase 2 (Cloud Run per a `section_submissions`):** Claude i Codex han demostrat empíricament que a producció la samarreta (`samarreta-socdepoble`) viu a la taula pública `app_content` (`marketItems`, llegible per GET anònim amb les seues 7 fotos) i que `01-chica-jersey.png` conté en realitat **bytes JPEG (`1024×1024`, `782.271 B`) amb extensió `.png`**. Generar en build una derivada social JPEG real (`1200×630`, `<= 300 KB`, sense EXIF, amb la foto sencera sobre fons difuminat de la mateixa foto segons `OG-4`) elimina alhora la discrepància MIME (`.png` vs bytes JPEG), el sobrepès de 782 KB i el risc d'EXIF.
     - **Per què descartar `dist/<ruta>/index.html` amb el `firebase.json` actual:** Amb `"cleanUrls": false` (el valor per defecte de Firebase Hosting), un directori `dist/mercat/samarreta-socdepoble/index.html` provoca que Firebase responga a `GET /mercat/samarreta-socdepoble` amb un `301 Moved Permanently` cap a `/mercat/samarreta-socdepoble/`.
     - **Risc operatiu caçat a la proposta `firebase.social.json` de Claude (`CL-12:328`):** Claude proposa escriure fitxers plans a `dist/` i generar les rewrites en un fitxer `firebase.social.json` ignorat per git que es desplega amb `firebase deploy --config firebase.social.json`. **Alerta de Salfumant:** si en qualsevol desplegament futur s'executa `firebase deploy` (sense `--config firebase.social.json`), Firebase Hosting llegirà el `firebase.json` estàndard i **esborrarà totes les rewrites d'OpenGraph en producció**.
     - **Solució blindada:**
       * Si s'usen fitxers plans amb `rewrites` en `firebase.social.json`, afegir a `firebase.json` un ganxo `"predeploy"` que avorte si s'invoca sense el config social (o definir l'script canònic `"deploy:hosting": "firebase deploy --only hosting --config firebase.social.json"`).
       * Alternativament, activant `"cleanUrls": true` i `"trailingSlash": false` en `firebase.json` (2 línies fixes que no canvien mai en git), qualsevol fitxer `dist/mercat/samarreta-socdepoble.html` se serveix directament en `GET /mercat/samarreta-socdepoble` amb **`HTTP 200 OK` i 0 redirects**, sense necessitat de mantindre cap llista de rewrites per producte!
  4. **Confirmació de la solució al Bug del Baseline (`useSEO.js` i `seoHead.js`):**
     - Els tres informes coincideixen al 100% i Codex ho ha reproduït amb un probe real (`/private/tmp/sdp-og-spa-baseline-probe.mjs`): quan l'HTML inicial porta un `<head>` particularitzat (`data-sdp-ssr`), `seoHead.js` no pot construir `baseline` amb `capture()` del DOM del producte, sinó des de les constants canòniques del shell base; `useSEO.js:34` ha de retornar sempre el descriptor complet de la imatge base; `seoHead.js:60` ha d'escriure sempre totes les propietats d'imatge i `og:type`; i el bloc JSON-LD ha de portar `data-sdp-seo` perquè es netege en canviar de ruta.
  5. **Alerta urgent de privacitat `OG-7` (`CL-12:348`):**
     - Donem prioritat immediata a l'avís de Claude sobre `08-javi-llinares-perfil-1024px.jpg` i la seua bessona `.webp` (que contenen 6 etiquetes GPS a l'EXIF en producció): cal reencodar ambdós fitxers sense metadades EXIF a `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/`.
- **Severitat justificada:** Alta (assegura que el pla `P1-61` complisca íntegrament el Llibre Mestre i no patisca regressions de deploy ni de reserva visual).
- **Font de veritat amb què entra en conflicte:** `261027_1154_pla_implementacio_opengraph_primera_imatge.md` (`:78-83`) vs `03_llibre_mestre_tasques_i_idees.md` (`:306-311`).
- **Proposta conservadora:** Incorporar la Prioritat 0 (`item.og_image || item.featured_image`), fixar `og-socdepoble-1200x630.png` com a reserva global (`OG-1`), purgar l'EXIF de `08-javi-llinares-perfil` (`OG-7`) i protegir el desplegament de Firebase Hosting amb `"cleanUrls": true` o ganxo `predeploy`.
- **`requires_human_decision`:** `true` (confirmació pel Mestre de les decisions `OG-1` a `OG-9`).

---

#### 8.2. Auditoria de WordPress.org (`idioma-local.php`), Destinació Satèl·lit (`_builds_de_poble/wordpress/`) i Ruptura del Segell `SKILLS_SEAL.json`
- **Fitxer o àmbit afectat:** `wordpress-plugin/includes/idioma.php` (`1-59`), `wordpress-plugin/includes/idioma-local.php` (`1-87`), `wordpress-plugin/socdepoble-enxufe.php` (`137-144`), `wordpress-plugin/eines/empaqueta.mjs` (`762-803`, `957-972`, `1041-1066`), `.agents/skills/core-empaquetat-wp/SKILL.md` (`34-55`), `.agents/SKILLS_SEAL.json`, `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/mestre_skill.sh` (`41-42`) i `../_builds_de_poble/wordpress/`.
- **Evidència reproduïble:**
  1. **Separació `idioma.php` vs `idioma-local.php` (`[CONFORME]`):**
     - En `wordpress-plugin/socdepoble-enxufe.php:142-144`, `idioma-local.php` es carrega amb `if ( is_readable( __DIR__ . '/includes/idioma-local.php' ) )` i conté `load_plugin_textdomain()` + la reserva `.l10n.php` per a WP 5.8–6.4 del canal propi.
     - En `wordpress-plugin/eines/empaqueta.mjs`, `FORA_DEL_DIRECTORI` exclou `includes/actualitzador.php`, `includes/idioma-local.php` i `languages/`, i `variantDirectori()` retira `Domain Path` i `Update URI` i omet el 3r argument de `wp_set_script_translations`. El resultat és `0 errors` en Plugin Check 2.1.0 i `132/132` proves d'enxufe en verd.
  2. **ESCLETZA CRÍTICA 1 (`[BLOQUEJANT DE GOVERN]`): Ruptura del Segell de Skills (`SKILLS_SEAL.json`) i desincronització de `mestre_skill.sh` després d'editar `core-empaquetat-wp/SKILL.md`:**
     - Hem executat `node tooling/gates/segella.mjs` sobre l'arbre viu i **falla amb Exit 1**:
       `❌ [Llei Z] Ruptura de segell detectada! El hash actual 4ee3e545 no coincideix amb el segellat c7eca829.`
     - **Causa exacta:** L'actualització de `.agents/skills/core-empaquetat-wp/SKILL.md` per consagrar la destinació `../_builds_de_poble/wordpress/` ha canviat l'empremta global de les 43 skills de `c7eca82970cdaf797afdb9bb8ce412a88fdca0d06aa850259b504c083b5d717c` a `4ee3e545aa642611c06754edccf3b5c7ba5349efe042b4b27ae7d991f8366448`, però encara no s'ha actualitzat `.agents/SKILLS_SEAL.json`.
     - **Efecte col·lateral sobre `mestre_skill.sh` (`CL-07`):** El guió `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/mestre_skill.sh:41-42,72,87,90` exigeix que abans d'aplicar la poda de `sdp-vigilant-tellado` el segell siga `c7eca829...` i que després siga `6b2ed100...`. Amb `core-empaquetat-wp/SKILL.md` modificada, **`mestre_skill.sh` avortarà a les línies 72 i 87**!
     - **Solució calculada al mil·límetre per al Mestre:** Hem calculat en memòria el hash combinat exacte (amb la nova `core-empaquetat-wp/SKILL.md` + la `sdp-vigilant-tellado/SKILL.md` podada de Claude):
       * Hash actual (només amb `core-empaquetat-wp` actualitzada): `4ee3e545aa642611c06754edccf3b5c7ba5349efe042b4b27ae7d991f8366448`.
       * Hash combinat (`core-empaquetat-wp` actualitzada + `sdp-vigilant-tellado` podada de 2.913 paraules): **`d657327168075ea58e2f76d4f06cf882bed10dc2579d3069aeaa2ea516eb709f`**.
       * Per tant, el Mestre pot copiar la skill podada i resegellar les dues alhora amb una sola comanda:
         ```bash
         cp "../_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/sdp-vigilant-tellado/SKILL.md" ".agents/skills/sdp-vigilant-tellado/SKILL.md" && \
         node tooling/gates/segella.mjs --update \
           --expected-hash=d657327168075ea58e2f76d4f06cf882bed10dc2579d3069aeaa2ea516eb709f \
           --expected-previous=c7eca82970cdaf797afdb9bb8ce412a88fdca0d06aa850259b504c083b5d717c \
           --reason="Actualització de core-empaquetat-wp (_builds_de_poble) i poda de sdp-vigilant-tellado (2913 paraules)"
         ```
  3. **ESCLETZA CRÍTICA 2: Contradicció entre el codi d'`empaqueta.mjs` i la nova regla de `core-empaquetat-wp/SKILL.md`:**
     - Tot i que s'han evacuat manualment els `.zip` de `wordpress-plugin/builds/` cap a `../_builds_de_poble/wordpress/` (hem verificat que `find wordpress-plugin -name "*.zip"` retorna **0 fitxers**), el codi font de `wordpress-plugin/eines/empaqueta.mjs` encara contradiu `core-empaquetat-wp/SKILL.md` (§2, línies `34-45`):
       * `empaquetaDirectori()` (`empaqueta.mjs:785,800-803`, `--directori`) continua escrivint per codi a `wordpress-plugin/builds/directori/socdepoble.zip`.
       * `empaqueta()` (`empaqueta.mjs:762-774`) continua escrivint els 3 `.zip` dins de `wordpress-plugin/builds/`, i `comprovaDestinacio()` (`empaqueta.mjs:957-963`) fins i tot llança `Error('La carpeta d’eixida ha d’estar dins de wordpress-plugin/builds/.')` si es passa `--sortida ../_builds_de_poble/wordpress`! Només l'opció `--lleuger` (`:1043`) escriu hui a `../_builds_de_poble/wordpress/`.
       * Addicionalment, a `wordpress-plugin/builds/` encara hi roman el fitxer `migracions_pendents.sql` (`150 KB`, del 8 d'octubre), quan `core-empaquetat-wp/SKILL.md:44` estipula que a `wordpress-plugin/builds/` només hi poden residir els manifests JSON (`stable.json`, `<versio>.json`) i les signatures `.sig` (més el subdirectori intermedi de compilació `builds/directori/dist/`).
     - **Acció per a Claude:** Ajustar `empaqueta()` i `empaquetaDirectori()` en `wordpress-plugin/eines/empaqueta.mjs` (i les proves de `tests/enxufe-empaqueta.test.mjs`) perquè tots els `.zip` s'escriguen sempre a `../_builds_de_poble/wordpress/` (deixant a `wordpress-plugin/builds/` exclusivament els JSON i `.sig` del canal).
  4. **Certificació física dels ZIPs a `_builds_de_poble/wordpress/` (Aclariment de l'avís `CL-11:292` de Claude):**
     - L'avís que Claude va deixar a `261027_0925_auditoria_claude.md:292` i al Llibre Mestre (`:60`) dient *«Pujar `wordpress-plugin/builds/directori/socdepoble.zip`, no el de `_builds_de_poble/wordpress/socdepoble.zip`, que és l'antic»* **ja ha quedat superat per l'evacuació de les 12:21**.
     - Hem comprovat amb `shasum -a 256` que tant `../_builds_de_poble/wordpress/socdepoble.zip` com `../_builds_de_poble/wordpress/261027_1157_wordpress_directori_v1.1.9.zip` tenen exactament l'empremta `05a21a5bf80113dd28d5077dfa2e5414f5c4394c4f6fd840469cc174d4fb1f51` (`2.911.541 B`, 40 entrades) del paquet nou net de Plugin Check. **El Mestre ha de pujar `../_builds_de_poble/wordpress/socdepoble.zip`.**
- **Severitat justificada:** Alta (el segell `SKILLS_SEAL.json` trencat bloqueja `segella.mjs` i `tancament.mjs`, i `empaqueta.mjs` tornaria a crear ZIPs dins del repo en la pròxima execució).
- **Font de veritat amb què entra en conflicte:** `.agents/skills/core-empaquetat-wp/SKILL.md` (`§2`) i `.agents/SKILLS_SEAL.json`.
- **Proposta conservadora:** Executar el resegellat combinat (`d6573271...`) i alinear `empaqueta.mjs` perquè diposite tots els `.zip` a `../_builds_de_poble/wordpress/`.
- **`requires_human_decision`:** `true` (resegellat pel Mestre al seu terminal).

---

#### 8.3. Auditoria de la Pàgina Viva de Comunitat al Xat (`P1-55` · `FitxaVivaDeComunitat.jsx` i `XatSection.jsx`)
- **Fitxer o àmbit afectat:** `src/sections/xat/components/FitxaVivaDeComunitat.jsx` (`1-71`), `src/sections/xat/XatSection.jsx` (`1600-1614`, `1837-1907`), `src/sections/profile/PerfilPublicSection.jsx` (`236-250`, `539-760`), `src/sections/detail/ItemDetailSection.jsx` (`179-290`) i `src/apps/plataforma/lazyRoute.js` (`1-18`).
- **Evidència reproduïble:**
  1. **Resolució de `VistaDelPoble` i `FitxaPublica`, scroll i gestió d'errors (`[CONFORME]`):**
     - Quan l'usuari entra a `/xat?comunitat=<id>` sense conversa activa (`!threadId`), `XatSection.jsx:1600-1611` munta `<ColumnaDretaDeLaComunitat comunitat={comunitatOberta} t={t} seo={seoXat} />`.
     - En mòbil (`mida === 'estret'`), retorna `<AvisSenseConversa t={t} />` sense descarregar el chunk de `FitxaVivaDeComunitat.jsx`.
     - Mentre la llista de comunitats encara s'està resolent en un enllaç fred amb sessió (`!comunitat && status !== 'ready'`), pinta `<div className="sdp-xat-buit" aria-busy="true" />`, evitant qualsevol parpelleig del document destacat genèric.
     - Per a una entitat (`subjecte.tipus === 'entitat'`), `PaginaDeLEntitat` carrega el perfil amb `usePerfilPublic(clau)`, comprova `esOrganitzacio(perfil)` (`tipus === 'entitat' || tipus === 'grup'`, impedint que un àlies de persona o d'IA es pinte com a comunitat) i renderitza `<FitxaPublica perfil={perfil} chrome="context" ambXat={false} />` (que té `layout="contained"` i scroll propi).
     - Per a un poble (`subjecte.tipus === 'poble'`), `PaginaDelPoble` resol el municipi amb `fitxaDelSubjecte(subjecte, towns)` i renderitza `<VistaDelPoble pobleId={...} chrome="context" contenidor="sdp-xat-buit" carregant={<Espera />} senseFitxa={senseFitxa} />`, que embolica `PaginaDelDetall` (`layout="page"`, `senseXat`) dins de `.sdp-xat-buit` (`overflow-y: auto`), garantint un scroll vertical fluid de tota la pàgina del poble.
     - La barrera `<BarreraDelDocumentDestacat key={String(comunitat.fil.id)} fallback={senseFitxa}>` (`XatSection.jsx:1901`, `CL-13` / `GN-R01`) ja porta la `key` de la comunitat al pare, de manera que qualsevol error de càrrega en una comunitat es neteja en seleccionar-ne una altra.
  2. **Escletxa fina detectada per a una onada futura (`lazyRoute.js:14-17`):**
     - En `src/sections/xat/XatSection.jsx:1888`, `FitxaVivaDeComunitatDiferida` s'instancia una sola vegada a nivell de mòdul amb `lazyRoute(() => import('./components/FitxaVivaDeComunitat.jsx'))`. Com que `React.lazy()` memoritza internament la promesa retornada per la primera invocació, si eixa primera descàrrega del chunk `./components/FitxaVivaDeComunitat.jsx` falla per una micro-caiguda de xarxa rural, `React.lazy` deixa l'estat en `Rejected` durant tota la vida de la pestanya, encara que `BarreraDelDocumentDestacat` es remunte amb una `key` nova.
     - **Millora lleugera recomanada a `src/apps/plataforma/lazyRoute.js`:** Permetre que `lazyRoute(importa)` netege la promesa rebutjada i reintente `importa()` en la següent muntada si el chunk va fallar per xarxa.
- **Severitat justificada:** Baixa (la implementació de `P1-55` és sòlida, fidel i resilient; la millora de reintent a `lazyRoute.js` és un refinament per a connexions rurals intermitents).
- **Font de veritat amb què entra en conflicte:** Cap.
- **Proposta conservadora:** Donar per certificada la implementació de `P1-55` a l'arbre viu, pendent únicament de la confirmació del Mestre sobre el punt `CL-03.d` (filtrar o conservar la targeta «El Xat · Anar al xat» a l'aparador inferior de la fitxa incrustada).
- **`requires_human_decision`:** `false` (excepte `CL-03.d`).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions executades per Gemini (`gemini-4-argon`) sobre l'arbre del repositori `socdepoble.org`:

1. `node tooling/gates/porta-olivera.mjs` -> **Exit 0** (`[porta-olivera] OK — escriptori net`).
2. `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261027_0730_reforma_editorial_gemini.md` -> **Exit 0** (`valid: true, errors: []` després d'emetre i ancorar el rebut `sdp:torn_8160d52d-62fe-4689-a0bf-14051394195f:48db07a8-1f19-4e92-bafc-34cdca02c1e8`).
3. `node tooling/brain/mapa-consola.mjs` -> Verificat que l'avís `escriptori-sense-rebut` sobre `261027_0730_reforma_editorial_gemini.md` ha desaparegut.
4. Lectura i contrast directe de `261027_1154_pla_implementacio_opengraph_primera_imatge.md` (v1.0.1), `261027_0925_auditoria_claude.md` (v1.1.0, `CL-01..13`), `261027_0917_auditoria_codex.md` (v2.1.0), `03_llibre_mestre_tasques_i_idees.md` (`P1-61`, `P1-64`), `src/sections/xat/XatSection.jsx`, `src/sections/xat/components/FitxaVivaDeComunitat.jsx`, `src/sections/profile/PerfilPublicSection.jsx`, `src/sections/detail/ItemDetailSection.jsx`, `src/apps/plataforma/lazyRoute.js`, `wordpress-plugin/eines/empaqueta.mjs`, `wordpress-plugin/includes/idioma.php`, `wordpress-plugin/includes/idioma-local.php`, `wordpress-plugin/socdepoble-enxufe.php` i `.agents/skills/core-empaquetat-wp/SKILL.md`.
5. Verificació física amb `shasum -a 256` i `find` dels paquets a `../_builds_de_poble/wordpress/` (`socdepoble.zip` i `261027_1157_wordpress_directori_v1.1.9.zip` = `05a21a5bf80113dd28d5077dfa2e5414f5c4394c4f6fd840469cc174d4fb1f51`; `0` fitxers `.zip` dins de `socdepoble.org/wordpress-plugin/`).
6. Execució de `node tooling/gates/segella.mjs` -> **Exit 1** (detectada la ruptura del segell per l'edició de `.agents/skills/core-empaquetat-wp/SKILL.md`: hash viu `4ee3e545...` vs segellat `c7eca829...`; calculat en memòria el nou segell combinat amb la poda de Tellado: `d657327168075ea58e2f76d4f06cf882bed10dc2579d3069aeaa2ea516eb709f`).
7. `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261027_0920_auditoria_gemini.md` i `node tooling/gates/verificador-scc.mjs` -> **Exit 0** (`valid: true, errors: []`, v1.3.0).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per respectar l'acord de no-col·lisió amb el torn actiu de Claude (`torn_f19d6d9c-2c50-48fb-a1f6-b55958347b9f`, `scope: "code"`) i l'ordre expressa del Mestre, Gemini no ha modificat cap fitxer sota `src/`, `wordpress-plugin/`, `tests/`, `tooling/` ni `.agents/skills/`.
- La resolució de TCC per a `org.socdepoble.higiene` (`mestre_higiene.sh`), el resegellat combinat de skills (`core-empaquetat-wp` + `sdp-vigilant-tellado` -> `d6573271...`) i l'alineació d'`empaqueta.mjs` i `P1-61` queden documentats amb les comandes exactes a la Secció 8.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles]]
- [[261027_0730_reforma_editorial_gemini]]
- [[261027_0730_solucio_opengraph_i_copy_codex]]
- [[261027_0917_auditoria_codex]]
- [[261027_0925_auditoria_claude]]
- [[261027_1154_pla_implementacio_opengraph_primera_imatge]]
