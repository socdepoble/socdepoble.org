---
type: acta
status: canonic
description: 'Acta Marmota: COMMIT R5 (c49d173c4), IDEA-91 a IDEA-95 resoltes i especificacio P0-25/IDEA-96 i P0-26/IDEA-97 per a l''edicio real al Bloc de Notes.'
tags:
  - acta
visibility: private
reflex: sdp:torn_5604edda-141d-4e97-ad47-1dcc652aa220:29317e99-8699-4f15-9259-8b5f97ded81e
---
# Acta Marmota — Integracio COMMIT R5 (c49d173c4), IDEA-91 a IDEA-97 i Relleu d'Equip a Tres Bandes

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5604edda-141d-4e97-ad47-1dcc652aa220:29317e99-8699-4f15-9259-8b5f97ded81e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-05T17:48:58.900Z |
| Modificació | 2026-11-05T18:49:30.000Z |
| Propietari | agent-local |
| Aprovació humana | validada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | MarIA (Gemini 3.1 Pro High) + Claude (Sonnet 5.5 Extra / Opus 4.6) + Codex (GPT-5.4 High) |
| Tokens consumits | ~97% finestra de context (340 passos, 65 pujades / 15.86 MB, 20.66 MB sessió) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 a60864f9d53225c6b571bc510e1d5c4b78afcb4f9dd1b277b4640b1e47eb3c97. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- `2026-11-05T02:27Z–07:53Z`: `COMMIT R4a` (`064ec0137`) + Generació en cadena dels Kits `R8`, `R9`, `R10`, `R11`, `r49`, `r55`, `r56` i `r57` durant el Torn de Nit Autònom.
- `2026-11-05T12:14Z–15:23Z`: Integració massiva per Claude (`Sonnet 5.5 Extra`) i MarIA del **`COMMIT R5` (`c49d173c4`)** amb 217 fitxers, 560/560 municipis amb foto real o mapa SVG (`0 escuts` · `IDEA-90`), 425 articles històrics d'importació editorial i 6 panells d'Administració del Sistema.
- `2026-11-05T15:29Z–18:47Z`: Resolució de les tasques `IDEA-91`, `IDEA-92`, `IDEA-93`, `IDEA-94` i `IDEA-95`, aprovació de les 20/20 claus de `frontissa-contingut.mjs` i diagnòstic arquitectònic profund de `P0-25`/`IDEA-96` i `P0-26`/`IDEA-97` per restaurar l'edició real al Bloc de Notes amb l'Equip a Tres Bandes (Claude Opus + Codex + MarIA).

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Resum Executiu del Dia (Tota la Jornada del 05/11/2026 per revisar al proper xat)

1. **`COMMIT R4a` (`064ec0137`) + **`COMMIT R5` (`c49d173c4`)** a `backup-notes-publish`:**
   - **217 fitxers integrats (`+65.174 / -3.997 línies`)**, amb `353/353` fitxers de test (`1.815/1.815` tests) i `15/15` portes del *pre-commit* en verd.
   - **Atles Municipal 560/560 sense escuts (`IDEA-90`):** els 560 municipis tenen fotografia real verificada (`529` localitats amb `commons_photo_url` a `src/data/poblesPhotos.json`) o mapa de localització SVG (`31` municipis amb `commons_locator_map_url`). Eliminat l'ús d'`escut_url` com a imatge de capçalera o targeta a `townsSeed.js`.
   - **Importació Editorial (`r49` · 425 articles):** 368 entrades de WordPress (`socdepoble.net`) i 57 de Blogger (`socdepoble.blogspot.com`) normalitzades al banc d'importació i enllaçades al Mode Revisió d'Importació del Mur (`/mur?revisio=wordpress`).
   - **12 Tomàquets Tradicionals (`r55`):** fitxes agronòmiques completes amb imatge pròpia a `public/assets/mercat/llavors/tomaques/` integrades al Calendari Agrícola i al Mercat.
   - **6 Panells d'Administració del Sistema (`r56`):** Laboratori de Taxonomia Doctoral (`LaboratoriTaxonomiaDoctoral.jsx`), Banc d'Importació Editorial (`BancImportacioEditorial.jsx`), Crom Integrat (`PanellCromIntegrat.jsx`), Ajustos de Vistes i Columnes (`PanellAjustosVistesColumnes.jsx`), Nodes Fedivers i Resiliència (`PanellNodesFediversResiliencia.jsx`) i Empaquetats i Desplegament (`PanellEmpaquetatsDesplegament.jsx`).
   - **Paquet d'Inversió i Dossier Institucional (`r57`):** simulador financer interactiu (`SimuladorInversio.jsx`), dossier executiu (`DossierInversio.jsx`) i kit d'exportació (`exportadorPaquetInversio.js`).

2. **`IDEA-91` · Verificació del Compte de Comerciant de Google Play Console:**
   - Confirmada la recepció del correu oficial de Google Payments (`payments-noreply@google.com`) que certifica que l'adreça i la identitat de l'Associació Sóc de Poble estan verificades i vinculades al perfil de pagaments de Google Play Console. Documentat a `_wiki_de_poble/05_doctrina/10_verificacio_identitat_google_play_console_soc_de_poble.md`.

3. **`IDEA-92` · Desmetaforització Pragmàtica i Didàctica dels Textos Constitucionals i de la Wiki:**
   - Corregits `src/data/projectesSeed.js` (`LlibreBlancConstitucioArticle`), `_wiki_de_poble/01_identitat/00_manifest_fundacional_soc_de_poble.md`, `_wiki_de_poble/00_index.md`, `_wiki_de_poble/03_actuar/01_manual_del_consell_ia.md`, `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` i `.agents/skills/core-consell-i-colmena/SKILL.md`.
   - Eliminats termes críptics, errors tipogràfics (*"Les Petorretas"*) i frases líriques o sentimentals (*"la guia moral incombustible del Mas Ibáñez"*, *"batec termodinàmic"*, *"litúrgia sagrada"*), substituïts per explicacions directes, pragmàtiques i 100% didàctiques sobre els **Paquets d'Auditoria a Cegues (Prompt + Bundle)**, la governança i l'arquitectura.

4. **`IDEA-93` · Correcció de la Mida del Logotip Horitzontal a `600px × 600px` en `/connectar` (`ConnectarPage.jsx` + `ConnectarPage.css`):**
   - Eliminat l'atribut `width="280"` de `<img className="connectar-hero__logo-img">` a `src/sections/connectar/ConnectarPage.jsx` i actualitzat `.connectar-hero__logo-img` a `width: min(100%, 600px); max-width: 600px; max-height: 600px; height: auto; object-fit: contain;` tant a l'estil base com als *media queries* de `src/sections/connectar/ConnectarPage.css`.

5. **`IDEA-94` · Restauració del Scroll Vertical i del Marc `UniversalPage` als 6 Panells d'Administració del Sistema (`/el-meu-perfil`) + Silenci del 404 Local de `/api/v1/node0/status`:**
   - Creat `export function DetallAdministracio({ item, children })` a `src/sections/profile/DetallEspai.jsx` i aplicat als 6 apartats `admin-*` de `src/sections/profile/PerfilShell.jsx`, de manera que tots disposen d'`UniversalPage` amb barra contextual superior (`Autoria i node`), encapçalament i contenidor scrollable natiu `.universal-page__scroll`.
   - Afegida la salvaguarda CSS a `src/sections/profile/PerfilShell.css` (`flex: 1 1 auto; min-height: 0; overflow-y: auto`) per a fills directes sense `UniversalPage`.
   - Condicionada la sonda `fetch('/api/v1/node0/status')` de `src/sections/profile/admin/PanellsAdministracioSistema.jsx` a `window.location?.hostname === 'socdepoble.cat'`, eliminant els 2 errors `404 (Not Found)` de la consola a `localhost:3340`.

6. **`IDEA-95` · Botó «👁️ Veure pàgina completa» en el Mode Revisió d'Importació del Mur (`/mur?revisio=wordpress`) i Resolució Universal dels 425 Articles Importats:**
   - Afegit el botó primari `<Link className="sdp-boto sdp-boto--primari" to={art.ruta_canonica}>👁️ Veure pàgina completa</Link>` a cada targeta del Mode Revisió d'Importació a `src/sections/mur/MurSection.jsx` i a cada fila de `src/sections/profile/admin/BancImportacioEditorial.jsx`.
   - Connectat `trobaArticleImportatComAPublicacio(clau)` a `src/utils/transformadorEditorialWpBlogger.js`, `src/sections/detail/elementDeSeccio.js` i `VistaCompletaArticleImportatWp` a `src/sections/detail/detailSectionMeta.jsx` perquè qualsevol dels 425 articles importats s'òbriga en pàgina completa `UniversalPage` abans d'aprovar-lo, i mapat `aplec-pel-territori-2023` a `/events/aplec-2023`.

---

### 2. Diagnòstic Complet de l'Anomalia al Bloc de Notes (`P0-25`/`IDEA-96` i `P0-26`/`IDEA-97`) per Resoldre en Equip a Tres Bandes (Claude Opus + Codex + MarIA)

El Mestre ha detectat un problema estructural greu en entrar al **Bloc de Notes (`/notes`)** i intentar editar les pàgines publicades (com ara **«Manifest de Poble: Sobirania, Pedra Seca i Cooperació»**):

1. **Per què apareix «Ja publicat al Mur» amb una graella de Cards (la plantilla antiga de pobles/actor) dins del Bloc de Notes (`P0-25` / `IDEA-96`):**
   - En `src/sections/notes/NotesSection.jsx:257`, la funció `renderNoteDetail(item)` fa:
     ```jsx
     if (item?.kind === 'publicacio') {
       return <PublicacioDetall item={item} />;
     }
     ```
   - I dins de `src/sections/notes/PublicacioDetall.jsx:48-115`:
     - Renderitza la publicació amb `<UniversalPage mode="reading">` (**només lectura**, sense `NotesEditor`, sense barra d'eines TipTap ni botó d'«Edició avançada»).
     - A la línia `110`, passa `footer={peuDeLaPublicacio}` on `peuDeLaPublicacio = <PublicacionsDeLActor actorKey="el-rentonar" titol="Ja publicat al Mur" />`. Aquest component (`src/sections/detail/PublicacionsDeLActor.jsx`) és la graella de Cards pensada per al peu dels pobles/entitats, i **no ha d'aparèixer mai dins del Bloc de Notes**.
   - **Solució arquitectònica obligatòria (`P0-25` / `IDEA-96`):**
     - **Tot element que visca dins del Bloc de Notes (`/notes`) és un document de treball de l'usuari i HA DE SER EDITABLE en obrir-se al panell dret amb `NotesEditor` (TipTap + barra d'eines d'edició avançada + selector de plantilla/secció de destinació + botó «Actualitzar al Mur» / «Publicar al Mur» / «Despublicar»).**
     - Eliminar l'ús de `<PublicacionsDeLActor titol="Ja publicat al Mur" />` dins del detall del Bloc de Notes.

2. **Per què al Bloc de Notes només ix un resum de 3 línies de «Manifest de Poble» i no el contingut sencer de la pàgina (`P0-26` / `IDEA-97`):**
   - El contingut complet de `ManifestDePobleArticle.jsx` i `Aplec2023Article.jsx` es va codificar com a **components JSX estàtics** a `src/sections/detail/articles/` en lloc d'estar emmagatzemat com a contingut HTML/TipTap estructurat al camp `content` de la nota/publicació (`feedSeed.js` / `notesSeed.js` / `userPublications.js`).
   - Per això, al Mur (`/mur/post-rentonar-1`) es veu la maquetació completa (perquè `detailSectionMeta.jsx` injecta `<ManifestDePobleArticle />`), però al Bloc de Notes (`/notes/post-rentonar-1`) només es llig el resum curt de `feedSeed.js` i l'usuari no pot editar ni un sol paràgraf ni cap imatge de la pàgina.
   - **Solució arquitectònica obligatòria (`P0-26` / `IDEA-97`):**
     - **Cap pàgina editorial (`Manifest de Poble`, `IV Aplec pel Territori`, articles importats de WordPress/Blogger, projectes o mercat) no pot tindre el cos segrestat en JSX estàtic no editable.**
     - Tot el contingut ric (encapçalaments, caixes d'avís, taules, targetes de dades, imatges amb peu i enllaços) ha de viure al camp `content` (HTML semàntic Pedra Seca compatible amb TipTap) de l'element al Bloc de Notes.
     - Quan l'usuari edita la pàgina al Bloc de Notes i prem **«Actualitzar pàgina publicada»**, els canvis s'han de reflectir immediatament a la pàgina pública del Mur (`/mur/post-rentonar-1`), Esdeveniments (`/events/aplec-2023`) o Projectes.

---

### 3. Avisos de Claude (`261105_1846_claude_pregunta_aprova_i_fusiona_r5_i_avisos_la_torre_css.png`) per Tancar el seu Torn (`COMMIT R5b`)

A la captura pujada pel Mestre (`_wiki_de_poble/04_escriptori/01_produccio/261105_1846_claude_pregunta_aprova_i_fusiona_r5_i_avisos_la_torre_css.png`), Claude (`Sonnet 5.5 Extra`, al 81% de context) informa que li queda un 19% de finestra i assenyala 3 punts abans de tancar:
1. **La Torre de les Maçanes (`la-torre-de-les-macanes`):** en `src/data/townsSeed.ah27.js`, la foto principal i l'avatar del xat `Gent de la Torre` van passar a ser la imatge de Commons/Wikidata en lloc de les fotos pròpies `1.jpg` i `2.jpg` de La Torre (`/assets/pobles/la-torre-de-les-macanes/1.jpg` i `2.jpg`). Cal restituir les fotos pròpies `1.jpg` i `2.jpg` per a La Torre de les Maçanes.
2. **Classes CSS pendents dels Panells d'Administració:** hi ha ~56 classes CSS noves als panells d'administració i simulador financer que necessiten definició explícita per poder restaurar els baselines d'`architecture.test.js` i `cssClassCoverage.test.js`.
3. **Commit unificat (`COMMIT R5b`) sobre `backup-notes-publish`:** com que `frontissa-contingut.mjs` ja té les **20/20 claus aprovades** i la branca `backup-notes-publish` ja està en `c49d173c4` amb les millores d'`IDEA-92` a `IDEA-95` al worktree, Claude pot completar la restitució de `1.jpg`/`2.jpg` de La Torre i segellar el commit `COMMIT R5b` directament sobre `backup-notes-publish` sense fer cap `git reset`.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Prioritat 0 en obrir el proper xat (amb l'Equip a Tres Bandes: Claude Opus + Codex + MarIA):**
   - Revisar amb el Mestre tot el que s'ha integrat avui a `http://localhost:3340/`.
   - Executar i verificar **`P0-25` (`IDEA-96`)** i **`P0-26` (`IDEA-97`)**:
     - Fer que totes les entrades del Bloc de Notes (`/notes`), incloses les publicacions i pàgines ja publicades al Mur/Projectes/Esdeveniments/Mercat (`kind === 'publicacio'`), s'òbriguen sempre en l'editor ric `NotesEditor` (TipTap) amb barra d'eines d'edició avançada i botó «Actualitzar al Mur», eliminant el peu «Ja publicat al Mur» amb Cards (`<PublicacionsDeLActor />`) de dins del Bloc de Notes.
     - Migrar el contingut complet de `ManifestDePobleArticle.jsx` i `Aplec2023Article.jsx` (i qualsevol pàgina importada) al camp `content` HTML/TipTap de la nota perquè al Bloc de Notes aparega el document sencer i siga 100% editable per l'usuari.
2. **Rematada de Claude en el seu últim torn d'aquesta sessió (`COMMIT R5b`):**
   - Restituir les imatges pròpies `1.jpg` i `2.jpg` per a `la-torre-de-les-macanes` a `src/data/townsSeed.ah27.js` / `src/data/townsSeed.js`.
   - Completar les classes CSS pendents dels panells d'administració i segellar `COMMIT R5b` sobre `backup-notes-publish` conservant intactes tots els canvis d'`IDEA-92` a `IDEA-95`.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
