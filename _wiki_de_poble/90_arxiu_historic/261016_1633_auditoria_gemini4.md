---
type: informe
status: esborrany
description: Matriu de Conformitat de Requeriments (MCR) completa, Balanç Transparent, Arquitectura de Consola Web (/consola), Multimèdia/Emowe i Gran Rescat dels 418 ítems de l'Arxiu Històric
tags:
  - auditoria
visibility: private
reflex: sdp:torn_80dccf6a-9cef-4b8c-8154-b952ea45a1c2:19b1db2d-d0c3-4ff2-a210-fc7e44993792
---
# Auditoria de Gemini 4 Argon · Gauntlet Diürn 1530 i Rescat Històric

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_80dccf6a-9cef-4b8c-8154-b952ea45a1c2:19b1db2d-d0c3-4ff2-a210-fc7e44993792 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-16T14:33:28.868Z |
| Modificació | 2026-10-16T14:45:00.000Z |
| Propietari | gemini |
| Aprovació humana | Encàrrec autònom del Mestre (Prompt i Pla 261016_1530) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) · IAIA MarIA (Directora Tècnica + 4 Subagents Research) |
| Tokens consumits | ~95.000 tokens (Relleu 2 en curs) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-16T14:33:28.868Z: esborrany creat; contingut i verificació pendents.
- 2026-10-16T14:41:00.000Z: Relleu 1 publicat per Gemini 4 Argon / IAIA MarIA. Matriu de Conformitat de Requeriments (MCR) completa auditada sobre el codi viu, Balanç Transparent (Demanat vs Fet vs Traslladat) i especificacions quirúrgiques lliurades a l'Escriptori per a Claude Code (`torn_f66993e9`) i GPT Codex (`torn_39ba1739`).
- 2026-10-16T14:45:00.000Z: Relleu 2 publicat per Gemini 4 Argon / IAIA MarIA. Incorporada l'esmena del Mestre al Bloc 3.6 / Onada 1.2 (Ordre canònic estricte dels 4 actors del Xat i erradicació de la fila directa redundant de `Sóc de Poble`), l'auditoria forense de `/multimedia` (causa de les 11 fotos a `supabase/seed.sql:13`, bug de `mediaTimelineGroups`, redirecció `/multimedia/town-*` → `/pobles/[slug]`, Lightbox amb `llegixExif` i motor *complete-link* del Mapa d'Emowe `plantilla-mapa.html`), i l'Informe de Rescat de `01_produccio/` (297 fitxers) i `02_investigacio_ia/` (480 fitxers).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Matriu de Conformitat de Requeriments (MCR) · Pla i Prompt `261016_1530`

En compliment estricte de la **Regla d'Or 1 del Mestre (Prohibit emetre vistiplaus vagues)**, s'avalua punt per punt la totalitat dels blocs i onades del [Pla d'Implementació 261016_1530](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/_wiki_de_poble/04_escriptori/261016_1530_pla_implementacio_gauntlet_autonom.md) contra l'estat real del codi font a l'inici del torn diürn:

| ID / Bloc del Pla | Requeriment del Mestre | Estat Real al Codi | Evidència Forense (Fitxers i Línies) | Responsable / Acció en Curs |
| :--- | :--- | :--- | :--- | :--- |
| **Bloc -1 / §0.4.1** | **Llei dels Dos Usuaris:** Erradicació 100% de `Mestre Poble` i `mestre-obres`; només `Sóc de Poble` i `Javi Llinares` | **`[FET I SEGELLAT]`** | `src/data/identitatsSeed.js`, `src/data.js`: 0 ocurrències de `Mestre Poble` ni `mestre-obres`. Suite d'autoria `159/159` en verd. | Segellat a la ronda anterior; es manté vigilància de no-regressió. |
| **Bloc -1 / §0.4.2** | **Targeta `mac-mini-m4` a `/mercat`:** Exclusiva de `Javi Llinares` amb avatar personal `/assets/fotos/javi-llinares-perfil-1200px.jpg` | **`[FET I SEGELLAT]`** | Verificat al codi i al DOM real (`http://localhost:3340/mercat`): `seller: 'Javi Llinares'`, `author_id: 'javillinares'`, retrat personal sense logo verd. | Segellat i verificat per Codex i Gemini 4. |
| **Bloc 0 / Onada 2.1** | **Lector RSS sobre `UniversalWorkspace` + Purga de mocks + Fonts RSS reals (Emowe, Mitjana, Jon Hernández, Ben Cord, Migue Baena)** | **`[PARCIAL]`** | `src/apps/lector/vistes/Noticies.jsx:378-391` ja munta `<UniversalWorkspace idEspai="lector">`. `AppLector.jsx:79-82` desactiva els mocks per defecte (`LLAVOR_ACTIVA = false`), però `src/apps/lector/llavor/cataleg.js:24-30` encara conté les 5 fonts d'`example.org` i no hi ha les 5 fonts reals d'IA ni persistència local activa per defecte. | **Claude Code:** substituir `cataleg.js` per les 5 fonts RSS reals i activar el port local perquè no quede buit. |
| **Bloc 0 / Onada 2.2** | **Integració del Bookmarklet i Snippet Curador (`Bloc de notes` vs `Lector RSS`)** | **`[PARCIAL]`** | `src/sections/notes/SnippetCurador.jsx:179-192, 336-381` té el selector de destinació (`Bloc de notes` vs `Lector`), però `AppLector.jsx:98-100` exporta `destinacioEnllac = null` quan `LLAVOR_ACTIVA === false`, amagant l'opció! A més, `FitxaSnippet.jsx:138-140` mostra «Disponible prompte» sense el Bookmarklet arrossegable. | **Claude Code:** exposar `destinacioEnllac` sempre actiu a `AppLector.jsx` i afegir l'enllaç arrossegable del Bookmarklet a `FitxaSnippet.jsx`. |
| **Bloc 0.5 / Onada 0.5** | **La Consola Web (`/consola`) — Quadre de Comandament Màquina-Humà (MCR en viu, Balanç Demanat/Fet/Traslladat, Certificació 1-clic, Canal Humà)** | **`[PARCIAL]`** | `src/sections/consola/ConsolaSection.jsx:1-402` i `src/sections/control/ControlSection.jsx:1-549` ja separen netament `/control` (usuari) de `/consola` (govern amb 9 subpàgines, `XifresMas`, `IndexConsola` i `DiagnosiConsola`), però **falten els 4 mòduls del Mandat Suprem Humà**. | **Claude Code:** implementar `TaulerGovernHuma.jsx` dins `ConsolaSection.jsx:200` (vegeu especificació §3.3 avall). |
| **Bloc 0.6 / Onada 0.6** | **La Gran Auditoria i Rescat de l'Arxiu Històric (`90_arxiu_historic/` 418 ítems / 720 fitxers + `01_produccio/` 297 fitxers + `02_investigacio_ia/` 480 fitxers = 1.497 fitxers)** | **`[FET I SEGELLAT]`** | Auditats el **100% dels 1.497 fitxers** (`418` ítems d'arrel / `720` recursius a `90_arxiu_historic/` = `26,69 MB`; `29` entrades / `297` fitxers a `01_produccio/`; `34` paquets / `480` fitxers a `02_investigacio_ia/`). Rescatats els **20 àudios de veu originals del Mestre** (`26m 44s` camuflats com `.img`), el mestre d'Affinity `¡alergenos.af`, les **18 perles i visions del Mestre**, les **6 decisions estratègiques obertes** i la matriu de buidatge del **91,4% del llast d'Obsidian** (§4.1, §4.2 i §4.3 avall). | **Segellat documentalment per Gemini 4 Argon + Codex.** Presentat per a decisió d'1 clic a `/consola`. |
| **Bloc 1 / §0.1** | **Llei del Quadrat Universal (`1200×1200` WebP `<80 KB`), Avatars `400×400`, Social `1200×630`, EXIF preservat per defecte i `tpv_vinyeta.webp`** | **`[PARCIAL]`** | **Motor i TPV: `[FET I SEGELLAT]`** (`src/utils/imageCompression.js`, `src/utils/exifIncrustat.js`, `tooling/maquinaria/convertir_a_webp.mjs` `13/13` Node + `10/10` probes, `public/assets/ui/plugins/tpv_vinyeta.webp` `77.746 B`). **Catàleg d'assets existents: `[PARCIAL]`** (com certifica Codex al Relleu 5, a `public/assets/` encara hi ha 202 rasters en JPEG/PNG —95 `.png` són JPEG internament— pendents de passar pel tractor `convertir_a_webp.mjs`). | **Claude Code:** executar la conversió per lots del catàleg d'assets i ajustar el fallback de pujada quan s'execute el Bloc 0.3 (§3.4). |
| **Bloc 1 / §0.3.1** | **Arquitectura Escalable de Carpetes d'Imatges (`/assets/sistema/`, `/pobles/`, `/usuaris/`, `/entitats/`, `/contingut/`)** | **`[NO FET / PENDENT]`** | Actualment `public/assets/` té 206 imatges disperses. A més, `src/config/assetResolver.js:9-19,178-187` té 9 rutes trencades `/assets/img/nano_banner_*` que en realitat viuen a `/assets/uploads/brain/nano_banner_*`. | **Claude Code:** reparar immediatament les 9 rutes a `assetResolver.js:9-19,178-187` i preparar el mapa de migració de §3.4. |
| **Bloc 1 / §0.3.2** | **Arxiu Visual Complet (`/multimedia` 100-200 fotos), Visor Natiu estil Google Fotos amb EXIF i erradicació de `/multimedia/town-*` cap a `/pobles/[slug]`** | **`[NO FET / PENDENT]`** | `supabase/seed.sql:13` té només 11 ítems (`TOTS (11) - febrer de 2026`); `mediaContent.js:96-101` en té 26; `MultimediaContext.jsx:43` deixa `mediaTimelineGroups = []` buit; `MultimediaSection.jsx:57` navega a `/multimedia/town-benifallim` en comptes d'obrir Lightbox o anar a `/pobles/benifallim`. | **Claude Code:** aplicar la correcció quirúrgica de les 4 línies a `navigation.js:35-41,349-368`, `ItemDetailSection.jsx:25` i `MultimediaSection.jsx` (§3.4). |
| **Bloc 1 / §0.3.3** | **Mapa Fotogràfic Interactiu d'Emowe (`plantilla-mapa.html` Local-First amb GPS EXIF i clustering)** | **`[NO FET / PENDENT]`** | Analitzat al detall `_wiki_de_poble/04_escriptori/02_investigacio_ia/261014_1930_emowe_mapa_de_tu_viaje/plantilla-mapa.html` (`1.026` línies): clustering jeràrquic *complete-link* (`nearbyGroups`), 3 modes per zoom (`<13`, `13..15`, `>=16`), inferència temporal de fotos sense GPS i targetes arrossegables amb Pointer Capture. | **Claude Code:** implementar `motorMapaEmowe.js` i la vista `'mapa'` a `MultimediaSection.jsx` aprofitant `llegixExif` de `src/components/universal/enquadrament/exif.js:231` (§3.5). |
| **Bloc 2 / §0.2** | **WordPress Enxufable i Fallback Canònic (`Carregant el mur...`)** | **`[FET I SEGELLAT]`** | `wordpress-plugin/includes/marcatge.php` pinta exactament `Carregant el mur...` protegit amb `no_texturize_tags`. `36/36` proves Node + `30/30` Vitest en verd. | Segellat. Pendent només publicar release 1.1.4 a l'amfitrió WP. |
| **Bloc 3 / Onada 1** | **Decisions Fase 1 Perfil:** Dignitat de persona (sense CC ni categories), poda 4a columna (`targetaViva: false`), emojis rics a `perfilModel.js`, llicència de notes a «El compte», `ANIMAL -> ia`, poble al directori, neteja d'aside T50 | **`[FET I SEGELLAT]`** | `PerfilEditor.jsx`, `DetallCompte.jsx`, `perfilModel.js`, `ProfileSection.jsx`, `DocumentEditor.jsx`. Verificat en suite de perfil i directori. | Segellat. |
| **Bloc 3.5 / Onada 1.1** | **3 Rutes Canòniques (`/javillinares`, `/socdepoble`, `/rentonar`), Poble Innegociable (`La Torre de les Maçanes`), SQL RLS 403 (`profiles`), Sincronització d'Imatges (`avatarDeLaFitxa`) i SEO WhatsApp (`1200×630`)** | **`[PARCIAL]`** | **En codi local: `[FET I SEGELLAT]`** (`App.rutesCanoniques.test.jsx`, `identitatsSeed.js`, `2610160250_perfil_update_propi.sql`, `avatarDeLaFitxa`, `index.html` amb `og-socdepoble-1200x630.png`). **En desplegament públic (`socdepoble.org` / `gentdelatorre.net`): `[PENDENT DE DESPLEGAMENT]`**. | Codi local 100% llest; desplegament Firebase/WP i execució SQL a producció documentats per al panell de `/consola`. |
| **Bloc 3.6 / Onada 1.2** | **4 Actors Permanents al Xat en Ordre Estricte (`1r Comunitat Sóc de Poble`, `2n Javi Llinares`, `3r Gent de la Torre`, `4t IAIA MarIA`), ZERO fila duplicada de `Sóc de Poble`, Capçaleres Navegables, Desambiguació `/anima` vs `/iaia` i Login Localhost sense fricció** | **`[NO FET / PENDENT]`** (Esmenes 16:40 i 16:43 del Mestre) | 1) `xatsPerDefecte.js:73` crea fila duplicada `sdp-per-defecte:socdepoble`. 2) L'ordre actual posa primer `Gent de la Torre`. 3) `FitxaComunitat.jsx:38-44` i `CapcaleraConversa.jsx:96-97` no enllacen totes 4 capçaleres a `/socdepoble`, `/javillinares`, `/pobles/la-torre-de-les-macanes` i `/iaia`. 4) `App.jsx:980` i `sections.js:43` tenen l'assaig `'anima'` a `/iaia` en lloc de `/anima`. 5) `OnboardingSection.jsx:173-188` sonda el port mort `54321` en local. | **Claude Code:** màxima prioritat! Executar els 4 punts de l'especificació §3.0 avall. |
| **Bloc 3.7 / Onada 1.3** | **Diferenciació Legal de Nodes Amfitrions (`legalContent.js` Apartat 19: Sollutia vs WordPress) i Telemetria Sobirana** | **`[NO FET / PENDENT]`** | `src/sections/text/legalContent.js:161-163` manté el text antic («No fem servir galetes» absolut). A més, `rutaTapada('/javillinares')` a telemetria deixa passar l'slug d'usuari en lloc d'agrupar-lo sota `/perfil/*`. | **Claude Code:** actualitzar `legalContent.js:161-163`, sanejar `rutaTapada` i aprovar la frontissa de `legal`. |
| **Bloc 3.8 / Onada 1.4** | **Selector d'Emojis XL a la capçalera de `NOTES` (entre `NOTES` i `[|<]`), connexió amb `DialegEmoticona.jsx` i acció dual (icona de nota vs inserció a TipTap)** | **`[NO FET / PENDENT]`** | `UniversalWorkspace.jsx:1427-1442` no passa `endActions` a `ItemListColumn`; `DialegEmoticona.jsx:19` encara demana `Control + Ordre + Espai`; `emojisUnicode18.js` només s'usa a `/disseny`. | **Claude Code:** implementar segons l'especificació quirúrgica §3.1 avall. |
| **Bloc 3.9 / Onada 1.5** | **Redisseny Editor Universal de Notes:** Barra Taronja amb identitat real (sense «Foraster» ni ploma blanca al mig), H1 `Nota sense títol` mirall de la card -> Subtítol -> Entradella -> desplegable `Edició avançada` damunt TipTap, purga de `PublicacionsDeLActor` al peu i plantilla viva TipTap | **`[NO FET / PENDENT]`** | `autoriaNota.js:140-174` cau en `FORASTER` sense sessió; `EmoticonaBarra.jsx:38` pinta la ploma `<Feather />`; `textosLlavor.js:10` diu `'Sense títol'`; `PageFrame.jsx:816-943` interposa caixes i píndoles abans de Subtítol/Entradella; no existeix `<details>` d'Edició avançada; `NotesEditor.jsx:385-391,511` pinta `PublicacionsDeLActor`; `useUniversalRichText.js:70` falla en comparar `getHTML() === seedContent`. | **Claude Code:** màxima prioritat d'execució en aquest torn segons l'especificació §3.1 avall. |
| **Bloc 3.10 / Onada 1.6** | **Dinàmica d'Scroll a Mòbil i Tauleta (Autohide de Barra Blava i Barra Taronja amb CLS = 0)** | **`[PARCIAL]`** | Implementat i operatiu a `src/hooks/useBarresAmbScroll.js:1-345` i `src/css/layout.css` (`App.barresScroll.test.jsx` en verd), però com observa Codex al Relleu 5, usa `top` i un llindar de `24 px` a la pujada; es pot afinar amb `transform: translateY(-100%)` i sensibilitat immediata en pujar per garantir CLS = 0 estricte. | **Claude Code:** afinar `layout.css` i `useBarresAmbScroll.js` si cal després de tancar 3.6, 3.8 i 3.9. |
| **Bloc 4 / Onada 4** | **Proves d'Estrés Extrem (1.000 a 40.000 usuaris), Memory Leaks i Suite 100% Verda** | **`[PARCIAL]`** | Estrés `8/8` (`40.000` fluxos simulats en `2.952 ms`, heap post-GC `52,29 MiB`), `paginaDeText` i `PublicacioDetall.imatgesPropies` en verd (`48/48`). Acotat per Codex (Relleu 6) el timeout (`5.160 ms` vs `5.000 ms`) a `HistoricCofre.seguretat.test.jsx:115` causat per les consultes `getByRole('button')` sobre el DOM expandit en `afegir regla` (`~2.654 ms`) i `mostrar xifres` (`~904 ms`). | **Claude Code:** aplicar l'optimització de §3.6 avall sobre `Historic.jsx` / `HistoricCofre.seguretat.test.jsx:155-167`. |

---

### 2. Llei del Balanç Transparent (Demanat vs Fet vs Traslladat)

1. **Què ha demanat el Mestre (Abast total del Pla `261016_1530` incloses les esmenes de les 16:40 i 16:43):**
   - **A. Consolidació de la base de la matinada:** Identitat dual (`Sóc de Poble` + `Javi Llinares`, zero `Mestre Poble`), targeta `mac-mini-m4`, motor de la Llei del Quadrat WebP `<80 KB` amb EXIF preservat, vinyeta del TPV sense drets de tercers, fallback de WordPress `Carregant el mur...`, decisions de Fase 1 de Perfil, les 3 rutes canòniques (`/javillinares`, `/socdepoble`, `/rentonar`), el poble innegociable (`La Torre de les Maçanes`), la migració SQL del 403 RLS i el hook d'autohide de barres en scroll mòbil/tauleta.
   - **B. Nous fronts i esmenes d'urgència d'avui (15:30 – 16:43):**
     1. **Bloc 3.6 (Esmenes 16:40 i 16:43 del Mestre):**
        - Ordre canònic estricte dels 4 actors permanents al Xat (`1r Comunitat Sóc de Poble` amb Avisos, General i Beta Testers; `2n Javi Llinares`; `3r Gent de la Torre`; `4t IAIA MarIA`) i **eliminació total de la fila directa sintètica duplicada de `Sóc de Poble`** («Cap missatge»).
        - **Capçaleres de Xat Navegables:** Clicar la capçalera de la conversa/comunitat ha de portar a `/javillinares`, `/socdepoble`, `/pobles/la-torre-de-les-macanes` i `/iaia`.
        - **Desambiguació `/anima` vs `/iaia`:** L'assaig filosòfic *"L'Ànima de la IAIA"* passa a **`/anima`**, i **`/iaia`** es reserva per a la fitxa pública d'entitat/perfil de la **IAIA MarIA**.
        - **Login Localhost sense fricció (`/registre?mode=entrar`):** Permetre entrar en localhost sense dependre del port mort `127.0.0.1:54321`.
     2. **Blocs 3.8 i 3.9 (Onades 1.4 i 1.5):** Emojis XL accessibles des de `NOTES` i `DialegEmoticona`, i redisseny radical de l'Editor Universal de Notes (sense «Foraster», sense ploma central a la barra taronja, H1 `Nota sense títol` mirall 1:1 amb la card, Subtítol i Entradella immediats sota l'H1, desplegable `Edició avançada` just damunt de TipTap, purga del peu «Ja publicat al Mur» i plantilla d'exemple viva que s'esborra al primer clic/tecla).
     3. **Bloc 0.5 (Onada 0.5):** La **Consola Web (`/consola`)** com a quadre de comandament humà-màquina (MCR en viu, Balanç Demanat/Fet/Traslladat, Certificació d'1 clic i Canal Humà).
     4. **Bloc 0.6 (Onada 0.6):** La **Gran Auditoria i Rescat dels 418 ítems de `90_arxiu_historic/`** (+ `01_produccio/` + `02_investigacio_ia/`).
     5. **Bloc 3.7 (Onada 1.3):** Diferenciació legal a l'Apartat 19 (`legalContent.js`) entre Sollutia (`socdepoble.org`) i nodes WordPress (`gentdelatorre.net`), i telemetria sobirana sense identificadors personals.
     6. **Bloc 0.3 i Onada 2:** Galeria completa a `/multimedia` amb visor modal Google Fotos + EXIF, erradicació de `/multimedia/town-*`, integració del mapa fotogràfic d'Emowe (`plantilla-mapa.html`), i 5 fonts RSS reals al Lector amb Bookmarklet operatiu.

2. **Què ja està `[FET I SEGELLAT]` ara mateix:**
   - El paquet **A** de la matinada (Blocs -1, motor WebP/EXIF/TPV de Bloc 1, Bloc 2 WordPress fallback, Bloc 3 Fase 1 Perfil, i Bloc 3.5 en codi local).
   - El **Bloc 0.6 (Gran Auditoria i Rescat dels 418 ítems de `90_arxiu_historic/`, `01_produccio/` i `02_investigacio_ia/` = 1.497 fitxers)**, completat al 100% i documentat a la §4 d'aquest informe.

3. **Què s'executa a codi en AQUESTA TANDA per Claude Code (`torn_f66993e9`) sota verificació de Codex i Gemini 4:**
   - **Prioritat 1 (Immediata):** **Bloc 3.6 complet** (§3.0), **Blocs 3.8 i 3.9** (§3.1), **Bloc 3.7** (§3.2), **Bloc 0.5** (`/consola`, §3.3) i l'optimització de **`HistoricCofre.seguretat.test.jsx:115`** (§3.6).
   - **Prioritat 2 (A continuació o en el bloc següent sense pèrdua):** **Bloc 0.3** (redirecció `/multimedia/town-*` → `/pobles/[slug]`, reparació d'`assetResolver.js:9-19,178-187`, visor modal amb EXIF i mapa d'Emowe, §3.4–§3.5) i **Bloc 0** (5 fonts RSS reals i desbloqueig de `destinacioEnllac`, §3.4).

---

### 3. Especificacions Quirúrgiques de Direcció Tècnica per a Claude Code (`actor: claude`)

Per facilitar que Claude Code tanqui els blocs oberts amb zero fricció ni dubtes de disseny, ací té les rutes i línies exactes verificades per Gemini 4 Argon:

#### 3.0 URGENT (Esmenes 16:40 i 16:43 del Mestre) · Bloc 3.6 / Onada 1.2: Els 4 Punts del Xat, Rutes `/anima` vs `/iaia` i Login Localhost
1. **Ordre Estricte dels 4 Actors Permanents (`1r Comunitat Sóc de Poble`, `2n Javi Llinares`, `3r Gent de la Torre`, `4t IAIA MarIA`) i Zero Fila Duplicada de `Sóc de Poble`:**
   - A `src/data/xatsPerDefecte.js:73`: retirar `AJUDA_PER_CLAU.socdepoble` d'`ACTORS_PERMANENTS` (`export const ACTORS_PERMANENTS = Object.freeze([CONTACTE_HUMA, AJUDA_PER_CLAU.iaia]);`) perquè `Sóc de Poble` ja viu com a Comunitat i està terminantment prohibit pintar una segona fila directa buida (`sdp-per-defecte:socdepoble`, «Cap missatge»).
   - A `src/sections/xat/components/FakeChatOnboarding.jsx:86-144`: substituir `'fake-sdp'` per la comunitat `'fake-sdp-comunitat'` (`esComunitat: true, tipus: 'comunitat', name: SOC_DE_POBLE.nom, title: SOC_DE_POBLE.nom, avatar_url: SOC_DE_POBLE.avatar, subjecte: { tipus: 'entitat', id: 'socdepoble', titol: SOC_DE_POBLE.nom, ruta: '/socdepoble' }` amb els seus 3 fills: `fake-sdp-avisos`, `fake-sdp-general` i `fake-sdp-beta`), i ordenar la llista de converses en l'ordre canònic: **1r `Comunitat Sóc de Poble` -> 2n `Javi Llinares` -> 3r `Gent de la Torre` -> 4t `IAIA MarIA`**.
   - A `src/sections/xat/XatSection.jsx:723-747` (i `src/sections/xat/pobleAmfitrio.js:161-172`): substituir el criteri que posava `Gent de la Torre` a l'índex 0 per una funció d'ordenació canònica dels 4 actors permanents al capdamunt de la llista:
     * **Posició 1:** Comunitat `Sóc de Poble` (`comunitat.fil.orgId === ENTITAT_PILOT_ID` o `comunitat.fil.subjecte?.id === ENTITAT_PILOT_ID`).
     * **Posició 2:** `Javi Llinares` (`fil.perDefecte === 'javi'` o `fil.id === ID_FIL_DE_MOSTRA_DE_JAVI` o `jaTeElXat(fil, 'javi')`).
     * **Posició 3:** Comunitat `Gent de la Torre` (`esComunitatDelPoble(comunitat, pobleDeLaLlista)` o fila virtual `tipus === 'poble'`).
     * **Posició 4:** `IAIA MarIA` (`fil.perDefecte === 'iaia'` o `esXatDeLaIAIA(fil)`).
2. **Navegació Directa des de les Capçaleres de Xat (`navigation.js:52-59`, `CapcaleraConversa.jsx:96-145`, `FitxaComunitat.jsx:38-44`, `xatSeed.js:90-92`):**
   - A `src/config/navigation.js:52-59` (`rutaDePerfil`): fer que `rutaDePerfil(tipus, id)` retorne sempre la ruta canònica neta quan corresponga:
     * Si `rutaCanonicaDePerfil({ tipus, id, slug: id })` existeix → retorna `/javillinares`, `/socdepoble` o `/rentonar`.
     * Si `tipus === 'ia'` i `id` és `IAIA_ID`, `'iaia-maria'`, `'iaia'` o `'ajuda:ia'` → retorna **`'/iaia'`**.
   - A `src/sections/xat/components/CapcaleraConversa.jsx:96-97`: ara mateix només llig `fil.altres[0]`, però a `FakeChatOnboarding.jsx` i `filDeMostraDeJavi` els fils porten `fil.participants[0]` (`{ id: 'ajuda:ia', tipus: 'ia' }` o `{ id: 'contacte:persona', tipus: 'persona' }`) o `fil.tipus === 'iaia'`. Assegurar que `CapcaleraConversa` resolga la ruta de la capçalera tant per `fil.altres[0]` com per `fil.participants[0]`, `fil.tipus === 'iaia'` (`'/iaia'`) i `fil.id === ID_FIL_DE_MOSTRA_DE_JAVI` (`'/javillinares'`).
   - A `src/sections/xat/components/FitxaComunitat.jsx:38-44`: envoltar la identitat de `<header className="sdp-xat-fitxa-comunitat__cap">` amb `<Link className="sdp-xat-capcalera__enllac" to={fil.subjecte?.ruta || (fil.orgId === 'socdepoble' ? '/socdepoble' : '/pobles/la-torre-de-les-macanes')}>` perquè clicar la capçalera de la comunitat `Sóc de Poble` porte a **`/socdepoble`** i clicar la de `Gent de la Torre` porte a **`/pobles/la-torre-de-les-macanes`**.
3. **Desambiguació de Rutes Canòniques (`/anima` vs `/iaia` a `sections.js:43`, `navigation.js:20-21`, `paginaDeText.js:93`, `App.jsx:980-981`):**
   - A `src/config/sections.js:43`: canviar `path: '/iaia'` per **`path: '/anima'`** (`{ id: 'ia', path: '/anima', label: "L'ànima de la iaia", shortLabel: 'IAIA', icon: BrainCircuit, kind: 'text', pageKey: 'anima', subrutes: ['/realitat'] }`).
   - A `src/config/navigation.js:20-21`: a `PAGE_ROUTE_MAP`, canviar `anima: '/anima'` i `ia: '/anima'`.
   - A `src/sections/text/paginaDeText.js:93`: canviar `if (cami === '/ia') return clauDeRuta('/anima');`.
   - A `src/app/App.jsx:854-858,980-981`:
     * Moure la pàgina de text filosòfica a `<Route path="anima" element={<TextRoute pageKey="anima" />} />`.
     * Fer que **`<Route path="iaia" element={<PerfilPublicSection agents={agents} id="iaia-maria" />} />`** obri la fitxa pública d'entitat/agent de la **IAIA MarIA** (exactament com `/javillinares`, `/socdepoble` i `/rentonar`).
4. **Accés i Login Funcional en Localhost (`/registre?mode=entrar` a `src/sections/onboarding/OnboardingSection.jsx:152-188,275-323`):**
   - Quan l'aplicació corre en mode local/seed (`modeDades !== 'remote'`) o quan `comprovaServidor` falla contra `http://127.0.0.1:54321` en desenvolupament local (`import.meta.env.DEV` o `window.location.hostname === 'localhost'`), no deixar el formulari d'`OnboardingSection.jsx` bloquejat amb l'error de servidor inabastable: activar `simulaLocal = true` automàticament en fallar la sonda local i permetre que `handleLogin`, `handleRegister` i `googleLogin` autentiquen amb la sessió pilot local (`Javi Llinares`) i naveguen a `aterratgeDespresDEntrar(tornar)` (`/el-meu-perfil`). (Com adverteix Codex al Relleu 5, aquesta passarel·la d'entrada pilot només s'activa en mode local/dev explícit o quan el servidor local `127.0.0.1:54321` no respon en localhost, mai per a suplantar un anònim en producció remota).

#### 3.1 Blocs 3.8 i 3.9 (Onades 1.4 i 1.5) · Bloc de Notes, Emojis XL i Editor Universal
1. **Icona d'Emojis XL a la columna `NOTES` (`UniversalWorkspace.jsx:1427-1442` i `NotesSection.jsx:634-662`):**
   - A `src/components/universal/workspace/UniversalWorkspace.jsx:1427-1442` (`ItemListColumn`), passar una prop opcional `itemHeaderActions` (o `labels.itemHeaderActions`) a `<AppGridColumn ... endActions={itemHeaderActions}>` (igual que ja fa `FolderColumn` a les línies 1245-1255). Així la icona es pinta exactament al buit simètric a l'esquerra del botó `[|<]` (`onReplega`).
   - A `src/sections/notes/NotesSection.jsx`, passar a `UniversalWorkspace` el botó que obri el selector d'Emojis XL.
2. **Graella d'Emojis XL dins `DialegEmoticona.jsx` (`src/components/universal/classificacio/DialegEmoticona.jsx:1-63`):**
   - Importar `GRUPS_EMOJIS` de `src/sections/disseny/cataleg/dades/emojisUnicode18.js`.
   - Substituir la dependència de la drecera del sistema operatiu (`AJUDA` a la línia 19) per un cercador ràpid + pestanyes de categoria + graella interactiva d'emojis XL.
   - En clicar un emoji: si s'ha obert per a l'emoticona del document, assignar-lo i desar (`onDesa(emoji)`); si s'ha obert des de la capçalera de `NOTES` o des de la barra de TipTap (`DocumentEditor.jsx:402-484`), inserir-lo al cursor de TipTap (`editor.chain().focus().insertContent(emoji).run()`) o copiar-lo al porta-retalls amb toast de confirmació.
3. **Barra Taronja neta i sense «Foraster» (`autoriaNota.js:140-175`, `EmoticonaBarra.jsx:27-40`, `NotesEditor.jsx:467`):**
   - A `src/sections/notes/autoriaNota.js:140-175`: quan s'edita o es previsualitza en mode local/seed (inclosa la `nota-preparada`), resoldre a la persona pilot (**`Javi Llinares`**, **`La Torre de les Maçanes`**, avatar **`/assets/fotos/javi-llinares-perfil-1200px.jpg`**) o a l'actor actiu (`Sóc de Poble` / `El Rentonar`), erradicant `'Foraster'` i la silueta buida en redactar una nota.
   - A `src/components/universal/EmoticonaBarra.jsx:27-40` i `src/sections/notes/NotesEditor.jsx:467`: retirar la ploma blanca central (`<Feather className="icon" />`) quan la nota no té emoticona (`if (!neta) return null;`), deixant el centre de la Barra Taronja net.
4. **Mirall 1:1 del Títol H1 (`Nota sense títol`), Seqüència Títol -> Subtítol -> Entradella i Desplegable «Edició avançada» (`textosLlavor.js:10`, `PageFrame.jsx:816-943`, `DocumentEditor.jsx`):**
   - Canviar `TEXTOS_LLAVOR.titol` a `src/components/universal/textosLlavor.js:10` (o el placeholder de `NotesEditor`) de `'Sense títol'` a **`'Nota sense títol'`**, idèntic a `TITOL_NOTA_PREPARADA` (`src/sections/notes/notaPreparada.js:34`).
   - A `src/components/universal/PageFrame.jsx:816-943`: quan la nota en edició no té imatge de capçalera (`heroImage`) ni logotip (`titleLogo`) definits, no renderitzar les caixes buides `.hero-image--slot` ni `.page-title-logo-slot` a dalt de tot. Situar `<div className="page-intro">` (`<h2>` Subtítol + `<p className="lead">` Entradella) immediatament sota l'`<h1>`.
   - Just sota l'Entradella i **immediatament damunt de la barra negra d'eines de TipTap (`.sdp-editor-eines`)**, inserir el desplegable `<details className="sdp-edicio-avancada"><summary>Edició avançada</summary>...</details>` que agrupe: (a) pujada de capçalera (`Editar capçalera`), (b) pujada de logotip (`Editar logotip`), (c) `BotoneraClassificacio` (Carpeta, Categories, Etiquetes, Emoticona), (d) selector de drets d'autor (`CC BY-NC-SA 4.0` / Copyright), i (e) botons de `Vista A4 / PDF` i `Crear portada`. Quan l'usuari puge una capçalera o un logotip o assigne valors, aquests es pinten al seu lloc real de la pàgina.
5. **Purga de `PublicacionsDeLActor` al peu i Plantilla Viva TipTap (`NotesEditor.jsx:33-34, 385-391, 511`, `NotesSection.jsx:134-143`, `useUniversalRichText.js:70`):**
   - A `src/sections/notes/NotesEditor.jsx`: eliminar la injecció de `PublicacionsDeLActor` (`peuDePagina` a les línies 385-391 i 511) perquè mai aparega *«Ja publicat al Mur: Amb esta identitat encara no hi ha res publicat al Mur»* a l'editor de notes.
   - A `src/sections/notes/NotesSection.jsx:134-143` i `src/components/universal/useUniversalRichText.js:70`: definir `LLAVOR_NOTA` com a HTML compacte d'una sola línia sense espais entre etiquetes (`'<h3>Secció principal</h3><h4>Subapartat</h4><p>Escriu ací les teues idees...</p><ul><li>Primer punt</li><li>Segon punt</li></ul>'`) i a `useUniversalRichText.js:70` comparar la representació canònica (`htmlCanonitzat(ed.getHTML()) === htmlCanonitzat(seedContent)`, eliminant salts i espais entre etiquetes `>\s+<` -> `><`) perquè la comparació amb `ed.getHTML()` siga 100% exacta en TipTap real (resolent el P2 de Codex Relleu 5).

#### 3.2 Bloc 3.7 (Onada 1.3) · Diferenciació Legal Apartat 19 i Telemetria Sobirana
- A `src/sections/text/legalContent.js:161-163`: actualitzar l'apartat 19 explicant amb transparència els dos nivells:
  1. **Node Matriu (`socdepoble.org` a Sollutia):** zero galetes de tercers, zero Google Analytics, zero rastreig comercial; només `localStorage`/`IndexedDB` sobirà de l'usuari.
  2. **Nodes Amfitrions enxufats en WordPress (com `gentdelatorre.net`):** el Web Component `<soc-de-poble>` no instal·la galetes comercials, però el portal amfitrió pot incorporar analítiques pròpies del seu CMS i està obligat per governança a declarar-les.
  3. **Telemetria sobirana interna:** mètriques agregades sense perfilat ni cessió a tercers.
- Després d'editar `legalContent.js`, actualitzar el segell a `.agents/contingut_estructural.json` amb `node tooling/gates/frontissa-contingut.mjs --aprova legal --per "Mestre Javi Llinares · Onada 1.3 Apartat 19 Sollutia vs WordPress"`.
- A `src/data/telemetria.js` (o el mòdul de `rutaTapada`): assegurar que qualsevol ruta de perfil d'usuari (`/javillinares`, `/gent/*`, etc.) es normalitze a `/perfil/*` abans d'enviar-se a telemetria agregada (resolent el P2 de Codex).

#### 3.3 Bloc 0.5 (Onada 0.5) · Consola Web (`/consola`)
- A `src/sections/consola/ConsolaSection.jsx:200` (dins `ConsolaTauler`, just damunt de la graella de les 9 subpàgines): inserir el bloc visual del **Quadre de Comandament Màquina-Humà** (`TaulerGovernHuma.jsx`) amb les 4 peces exigides pel Mestre:
  1. **Matriu de Requeriments en Viu (MCR):** Taula amb filtre/semàfor (`[FET I SEGELLAT]`, `[PARCIAL]`, `[PENDENT]`).
  2. **Balanç Transparent de Sessió:** Comparativa clara entre *Demanat pel Mestre*, *Executat i Verificat* i *Traslladat a la Següent Tanda*.
  3. **Panell de Certificació Humana:** Botons directes (`Certificar` / `Retornar als agents`) sense obrir cap fitxer Markdown.
  4. **Consola de Comunicació Humà-Màquina:** Resum executiu en llenguatge planer de poble amb els passos pendents d'acció humana i les 6 decisions estratègiques rescatades de l'Arxiu Històric (§4.3).

#### 3.4 Bloc 0.3 i Onada 2 · Multimèdia (11→206 imatges), Redirecció `/multimedia/town-*`, Visor Lightbox i Lector RSS
1. **Redirecció quirúrgica de `/multimedia/town-*` cap a `/pobles/[slug]`:**
   - **`src/config/navigation.js:35-41` (`getSectionItemPath`)**: Si `sectionId === 'multimedia'` i `String(itemId).startsWith('town-')`, retornar `/pobles/${encodeURIComponent(String(itemId).slice(5))}`.
   - **`src/config/navigation.js:349-368` (`resolveItemPath`)**: Si `item.article?.sectionId === 'pobles'` o `String(item.id).startsWith('town-')`, resoldre a `getSectionItemPath('pobles', item.article?.id || String(item.id).slice(5))`.
   - **`src/sections/detail/ItemDetailSection.jsx:25`**: Afegir guarda `<Navigate to={getSectionItemPath('pobles', String(itemId).slice(5))} replace />` per si s'accedeix per URL directa a `/multimedia/town-*`.
2. **Reparació de 9 rutes trencades a `src/config/assetResolver.js:9-19,178-187`:**
   - Les 9 rutes de pobles que apunten a `/assets/img/nano_banner_*` s'han d'apuntar a la seua ubicació física real: `/assets/uploads/brain/nano_banner_*`.
3. **Exposició del cens real i reparació de `mediaTimelineGroups` (`supabase/seed.sql:13`, `mediaContent.js:96-101`, `MultimediaContext.jsx:43`):**
   - Ampliar el catàleg de `mediaContent.js` per reflectir el fons real de `public/assets/` (pobles, patrimoni, il·lustracions Nano) i calcular `mediaTimelineGroups` agrupat per mes/any perquè la pestanya «Cronologia» no quede buida.
4. **Visor Lightbox estil Google Fotos amb EXIF (`src/sections/multimedia/MultimediaSection.jsx:56-61`):**
   - En clicar una imatge a `/multimedia`, obrir un `<dialog>` / Lightbox modal a pantalla completa sobre fons fosc amb navegació anterior/següent, zoom i panell lateral d'informació que llija les metadades EXIF amb `llegixExif(buffer)` de `src/components/universal/enquadrament/exif.js:231` (data, hora, GPS, autor, poble i drets).
5. **Lector RSS i Bookmarklet (`src/apps/lector/llavor/cataleg.js`, `AppLector.jsx`, `FitxaSnippet.jsx`):**
   - Substituir les 5 fonts d'`example.org` a `cataleg.js:24-30` pels canals dels divulgadors (Emowe, Xavier Mitjana, Jon Hernández, Ben Cord, Migue Baena), mantenir `destinacioEnllac` sempre actiu a `AppLector.jsx:98-100` i exposar l'enllaç arrossegable del Bookmarklet a `FitxaSnippet.jsx`.

#### 3.5 Especificació d'Integració del Mapa Fotogràfic d'Emowe (`plantilla-mapa.html` · Bloc 0.3.3)
- Del fitxer canònic `_wiki_de_poble/04_escriptori/02_investigacio_ia/261014_1930_emowe_mapa_de_tu_viaje/plantilla-mapa.html` (`línies 717-1025`), extreure a `src/sections/mapa/motorMapaEmowe.js` les funcions pures:
  * `distanceKm(a, b)` (Haversine) i `thresholdKm(z)` (`z<=6: Infinity`, `z<=7: 60`, `z<=8: 30`, `z<=9: 15`, `z<=10: 6`, `z<=11: 2`, `z==12: 0.8` km).
  * `nearbyGroups(z)` amb **clustering jeràrquic *complete-link*** (dos grups només es fusionen si la distància màxima entre qualsevol parell de punts és `<= limit`, evitant l'efecte cadena).
  * Inferència temporal per a fotos amb data EXIF però sense GPS (heretant ubicació estimada de la foto amb GPS més propera, marcada com `estimated: true` en color ocre).
  * Integrar la vista `'mapa'` a `MultimediaSection.jsx:36-47` amb barra lateral cronològica per etapes/dies i zero peticions a tercers per defecte (GeoJSON local + commutador opcional a OpenTopoMap).

#### 3.6 Bloc 4 · Optimització del Timeout de `HistoricCofre.seguretat.test.jsx:115` (Relleu 6 de Codex)
- **Causa exacta verificada:** Com ha perfilat Codex al Relleu 6 (`5.160 ms` totals), el temps se'n va en `mostrar xifres` (`~904 ms`) i `afegir regla` (`~2.654 ms`). En expandir les xifres a `Historic.jsx`, les crides `screen.getByRole('button', { name: 'Afig la regla' })` i `screen.getByRole('button', { name: 'Prepara el llibre (XLSX)' })` a `HistoricCofre.seguretat.test.jsx:155,160,167` fan que `@testing-library/dom` calcule `computeAccessibleName` + `getComputedStyle` sobre tots els elements del DOM de jsdom.
- **Solució neta sense pujar el timeout:** A `src/sections/gestoria/historic/Historic.jsx`, aïllar l'estat de l'input de regla (`patro`) o memoitzar la taula de moviments amb `useMemo`/`React.memo` perquè `fireEvent.change(patro, ...)` a les línies 159 i 162 no re-renderitze tota la graella financera ni recalcule l'arbre accessible sencer.

---

### 4. Gran Auditoria i Rescat de l'Arxiu Històric (Bloc 0.6 · Cens Complet de 1.497 Fitxers: `01_produccio/` + `02_investigacio_ia/` + `90_arxiu_historic/`)

#### 4.1 Cens i Rescat de `_wiki_de_poble/04_escriptori/01_produccio/` (29 entrades arrel · 297 fitxers recursius · 162 MB)
1. **🚨 TROBALLA CRÍTICA DE PATRIMONI HUMÀ (PROHIBIT ESBORRAR):**
   - Dins `_wiki_de_poble/04_escriptori/01_produccio/loyverse_clon_ipad/2026-04-03_20-34-18/attachments/` hi ha **20 fitxers amb extensió `.img` (`25,1 MB` en total)** que vam inspeccionar a nivell binari i **NO són imatges, sinó gravacions de veu originals del Mestre en format WebM/Opus (`26 minuts i 44 segons` de dictats de veu originals)**! Cal canviar-los l'extensió a `.webm` i custodiar-los com a patrimoni oral sagrat del projecte.
   - Dins `01_produccio/Alergenos-ES_COPIA-ES_POT_BORRAR/` hi ha el fitxer **`¡alergenos.af` (`2,9 MB`)**, que és **l'únic fitxer mestre editable d'Affinity** dels al·lèrgens (a `alergens_svg/` només hi ha els SVG exportats). Cal moure `¡alergenos.af` a `alergens_svg/` abans d'esborrar la carpeta duplicada!
2. **Perles i Idees del Mestre Rescatades que estaven enterrades:**
   - **`260911_0645_propostes_manifest_panell_control.md` (`línies 1-64`) — Les 6 Aplicacions Comunitàries del Manifest de Poble (Octubre 2022) que falten al Panell:**
     Dels 8 serveis comunitaris fundacionals dissenyats pel Mestre, només 2 (*Cotxe de Poble* i *Animalets*) tenen avui fitxa a `registrePlugins.js`. Queden per incorporar com a targetes/plugins de comunitat:
     1. **Mans Veïnes:** Banc del temps i cures rurals entre veïns.
     2. **Banc de Terres i Masos:** Relleu generacional agrari i custòdia d'oliveres/bancals abandonats.
     3. **Tractor i Eines Compartides:** Préstec veïnal de maquinària i ferramentes del camp.
     4. **Compres Col·lectives:** Comandes conjuntes de llenya, pèl·let, gasoil agrícola i fibra rural.
     5. **El Pregoner (Bans amb Veu):** Bans municipals amb síntesi de veu (TTS) en valencià per a la gent major.
     6. **Oficis de Poble:** Directori verificat de llauradors, llanterners, fusters i mestres d'obra de pedra seca.
   - **Vinyetes originals inèdites a `01_produccio/Targetes_Davinci_Llestes/`:** Hi ha 4 il·lustracions ja acabades que encara no s'han copiat a `public/assets/ui/plugins/`: `habitatge_vinyeta.jpg`, `treball_vinyeta.jpg`, `comunitat_vinyeta.jpg` i `eficiencia_vinyeta.jpg`.
   - **`generador_sitemap.mjs` (`línies 1-46`):** Tractor de generació de `public/sitemap.xml` en quarantena, llest per connectar a `tooling/` ampliant-lo amb els slugs dels pobles i les 3 rutes canòniques.
3. **Acoblaments actius de `01_produccio/` amb tests i tractors (NO MOURE):**
   - `tooling/tractors/tractor-graella.mjs:13` llig `01_produccio/contracte_graella.md`.
   - `src/apps/bar/nucli/qualitat.alergens.test.js:23` llig `01_produccio/alergens_svg/*.svg`.
4. **Alliberament de llast a `01_produccio/` (amb autorització del Mestre):**
   - `Alergenos-ES_COPIA-ES_POT_BORRAR/` (després de rescatar `¡alergenos.af`).
   - `builds/socdepoble-enxufe-v1.0.0-261001_0320.zip` (`108 MB` d'un build antic v1.0.0 ja superat per v1.1.3/v1.1.4).

#### 4.2 Cens i Rescat de `_wiki_de_poble/04_escriptori/02_investigacio_ia/` (34 paquets · 480 fitxers recursius)
1. **El que JA està aplicat a `src/` i `tooling/` (i per tant és memòria amortitzada):**
   - `261002_1510_tractor_fatiga_claude/` (aplicat al 90% a `termometre_context.mjs`; només falta que `consola-iaia.mjs` publique `termometria.artefactesActius`).
   - `261002_1745_sentinelles_claude/`, `261003_1330_lector_rss_claude/`, `261003_1330_onada4_claude/`, `261003_1330_produccio_claude/`, `261004_2240_marato_claude/`, `261006_0055_olivera_ancores_opus/`, `261009_0400_higiene_claude/`, `261009_1330_logotips_png_claude/`.
2. **Joies en quarantena a `02_investigacio_ia/` que cal rescatar i promoure:**
   - **`261011_0230_onada12_claude/` (`AUTOCURACIO_I_MODS.txt`):** Conté el diagnòstic **C7** (les 9 rutes trencades de `nano_banner_*` a `src/config/assetResolver.js:9-19,178-187`), el fallback d'autocuració d'imatges **C8** i el contracte `sdp.mod.v1`.
   - **`261004_0605_nit_claude/`:** Conté 4 especificacions mestres no promogudes encara a `_wiki_de_poble/02_saber/architecture/`: `ARQUITECTURA_ERP_GESTORIA.txt` (invariants G1–G12), `MODEL_ORGANITZACIO_EMPRESA.txt` (mode llar i mode cens), `TRUCADES_WEBRTC.txt` (ADR D17 WebRTC) i `TUTOR_EMPRESARIAL.txt`.
   - **`261003_1330_skills_disseny_claude/`:** Dues skills pures sense dependències (`sdp-qa-visual` i `sdp-grafics-dades` per a gràfics SVG/CSS de la Gestoria).
   - **`261012_0040_sistema_informes_claude/`:** Motor complet d'informes editorials en A4 a doble columna (`informe_editorial.css`, `genera_informe.py`).
   - **`261009_1245_onada7_claude/`:** Pegat documental O13 (`planificacio_*` fora de la Wiki) i validació de ruta abans d'emetre rebut.
3. **Avís de seguretat sobre acoblaments de tests abans de netejar `02_investigacio_ia/`:**
   - `src/apps/bar/llavors/laParroquia.test.js:35,198` llig físicament `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_parroquia_claude/MAPA_IMATGES.txt`.
   - `tests/olivera-arxiva-261002.test.mjs:69,141` i `tests/laboratori-onada7-261009.test.js` llegeixen `261002_1745_olivera_arxiva_claude/` i `261009_1245_onada7_claude/`. No s'han de moure sense desacoblar primer eixos 3 tests!

#### 4.3 Cens Quantitatiu i Rescat Complet de `_wiki_de_poble/90_arxiu_historic/` (418 Ítems de Primer Nivell · 720 Fitxers Recursius · 26,69 MB)

1. **Radiografia Quantitativa Exacta dels 418 Ítems de `90_arxiu_historic/`:**
   - **Total d'ítems de primer nivell:** **`418`** (`384` fitxers solts + `34` subcarpetes d'auditories/sessions).
   - **Total recursiu de fitxers:** **`720` fitxers** amb un pes total de **`26.685.641 bytes` (`26,69 MB`)**.
   - **Desglossament per meitats (Arqueòleg 1 `1..285` + Arqueòleg 2 `286..418`):**
     * **Primera Meitat (`2026` a `261005_Sessio_Marato_2230`, ítems `1..285`):** `285` ítems d'arrel (`587` fitxers recursius, **`24,67 MB`**): `173` prompts (`1,16 MB`), `154` auditories (`4,47 MB`), `110` plans (`0,77 MB`), `93` evidències/binaris/JSON/patches (`12,86 MB`), `17` directrius/deutes (`41 KB`), `13` estudis (`169 KB`), `11` actes (`62 KB`), `6` brainstormings (`19 KB`), `5` petorretes (`19 KB`), `4` esborranys de skills (`184 KB`) i `1` megabundle (`260922_0320_BUNDLE_null.md` de **`4,92 MB`**). Inclou 4 fitxers corruptes de `0 bytes`.
     * **Segona Meitat (`261006_0025` a `261016_0035`, ítems `286..418`):** `133` fitxers (`4,30 MB` / `2,02 MB` net sense solapament): `49` auditories (`1,98 MB`), `28` plans d'implementació (`697 KB`), `23` prompts (`543 KB`), `14` informes de tancament (`524 KB`), `4` requeriments/ordres directes del Mestre (`51 KB`), `3` brainstormings (`57 KB`), `2` actes (`45 KB`), `1` petorreta (`227 KB`) i `9` altres (`270 KB`).

2. **🚨 ALERTA CRÍTICA DE SEGURETAT RESCATADA DE L'HISTÒRIC (`C8` — `261008_0220_auditoria_claude_onada4_tancament.md`):**
   - Abans d'executar qualsevol `firebase deploy` públic de `socdepoble.org`, **cal excloure `public/rag-index.json` i `public/slugIndex.json` del build de `dist/`** (o afegir-los a `firebase.json` `ignore`) perquè contenen índexs interns de `_wiki_de_poble/` que no s'han d'exposar públicament!

3. **Les 11 Grans Perles i Visions del Mestre Rescatades de la Primera Meitat (`Setembre – 5 d'Octubre`):**
   1. **`260926_2225_acta_visio_editor_universal.md` — Visió Final d'Unipad (Llibres en Paper a Amazon + Portades + App Nadiua estil Obsidian):** L'objectiu últim de l'Editor Universal és permetre escriure un llibre sencer des del poble, dissenyar-ne la portada amb «Crear Portada», exportar-lo a `ePub` i enviar-lo a publicar a Amazon maquetat en paper, a més d'empaquetar Sóc de Poble per a Apple Store i Google Play funcionant en local com Obsidian.
   2. **`260927_1400_idea_pont_whatsapp.md` — Pont Bidireccional WhatsApp ↔ Sóc de Poble via IAIA MarIA:** Aprofitar el número de telèfon propi de la IAIA MarIA com a proxy bidireccional (WhatsApp Business API + Webhooks a Supabase Edge Functions) perquè l'usuari puga delegar grups o contactes de WhatsApp i gestionar-los des de la safata de Sóc de Poble.
   3. **`260927_Xat_F0/260926_2330_skill_esborrany_xat.md` (§9) — «La IAIA com a Carpeta Intel·ligent» (`XAT-T01..T22`):** Com que al poble la gent no omple formularis (*«a l'app de les disfresses només hi van entrar 7 de 70 persones»*) i envia desenes de missatges solts pel xat («jo també», «som tres», «2 tàpers de fideuà»), la IAIA escolta el grup amb consentiment i manté automàticament una Nota viva al Bloc de Notes (llista d'inscrits a sopars/festes, acta de reunió, comandes de tàpers al bar, quadern de torns de cures).
   4. **`260929_1415_auditoria_claude.md` (§9, F1–F7) — Injecció via `@iaia` al Xat, Migració dels 522 Continguts de `socdepoble.net` i Federació ActivityPub (`Fedify`):** (a) Mencionar `@iaia` amb una URL per crear un esdeveniment d'1 toc; (b) migrar els **522 continguts reals** (425 articles, 18 pàgines, 59 projectes, 4 productes, 16 blocs) i **1.769 mitjans** de `socdepoble.net`; (c) sincronització sobirana `Syncthing + WireGuard`; (d) federar cada poble com a actor `Group` d'ActivityPub (`FEP-8a8e`).
   5. **`261001_1445_prompt_algoritme_sobira.md` — L'Algoritme Sobirà:** Convertir el verb «Connectar» en el comandament algorísmic personal de cada veí on la IAIA suggereix amb transparència silenciar o destacar fonts segons l'ús real.
   6. **`261002_0205_pla_implementacio_arbre_genealogic.md` — Mòdul d'Arbre Genealògic d'IA (`src/sections/genealogia/`):** Disseny complet de 6 ports amb model d'afirmacions i cites (`Claim`/`Citation`), SQLite WASM en Web Worker, motor d'entrevista guiada d'una sola pregunta per a gent major i tractor `genealogia.investiga` per a BIVALDI/PARES/FamilySearch.
   7. **`261002_0310_visio_arquitectonica_expansio.md` — Motor de Reserves Google per als Bars, Productors Locals Premium (*Nutxes* / *Oli de la Torre*) i Snippet amb 3 Nivells de Carpetes (`TIC > Foto > Antigravity`) + Negretes IA:** Amagar *Google Workspace Appointment Scheduling* sota una UI nativa de Pedra Seca per reservar taula als bars en Festes, i fer que la IA ressalte en negreta les paraules clau dels textos capturats amb el Snippet.
   8. **`261002_1700_informe_estudi_mercat.md` — Finançament NLnet (Termini 3 de novembre de 2026!), VeriFactu (RDL 15/2025) i Preus Bandomovil:**
      - **Convocatòria viva clau:** **NLnet (termini: 03/11/2026 a les 12:00 CET, de 5.000 a 50.000 €)**; exigeix declarar l'ús d'IA amb registre de procedència (el nostre LEDGER + rebuts ho compleixen nativament!).
      - **VeriFactu:** Obligatori l'1-1-2027 (societats) i 1-7-2027 (autònoms); el TPV Bar s'ha de declarar com a *TPV de comandes (no fiscal)* que exporta a SIF certificat.
      - **Paritat Bandomovil:** Bandomovil cobra 99 €/any (<500 hab.) a 307 €/any (2.000–5.000 hab.); el model de Sóc de Poble ha d'igualar eixa quota i facturar el contracte de custòdia i formació presencial.
   9. **`261004_Auditoria_Gestoria_Codex/261004_0935_idees_modul_animalets.md` — Disseny Complet del Mòdul «Animalets»:** Alertes geolocalitzades d'animals perduts/trobats, coordinació del **mètode CER** de colònies felines, banc comunitari de transportins/gàbies/medicació precintada, i guies de salut felina lliures de patrocinis (sorres de tofu/fusta vs sílice, plantes tòxiques com els lliris).
   10. **`261005_Sessio_Marato_2230/261005_0345_tasques_pendents_consola_visual.md` — Estètica Mnemotècnica «Mortadelo y Filemón / 13 Rue del Percebe / Berlanga» per a la Consola:** Il·lustrar les targetes de la Consola Termodinàmica amb vinyetes d'estil còmic clàssic d'Ibáñez/Berlanga com a regla mnemotècnica visual per al Mestre.
   11. **Deutes d'UX/A11Y amb fitxer propi per traslladar al backlog actiu:** `260927_1230_deute_accessibilitat_fletxes.md` (`KeyboardNavGroup` amb fletxes), `260927_1645_deute_usabilitat_botons.md` (pastilla sencera clicable en panells plegables) i `260927_0050_informe_vistes_antigues.md` (*Sagramental dels Morts*).

4. **Perles, Ordres del Mestre i Les 6 Decisions Estratègiques de la Segona Meitat (`6 d'Octubre – 16 d'Octubre`):**
   - **De `261009_1300_requeriments_onada8_mestre.md` i `261009_1330_requeriments_onada9_neteja_mestre.md`:** El motor `EstilDelPoble.jsx` ja és a `App.jsx:789`, pendent només d'afegir el selector visual dels 4 estils (`pedra-seca`, `bancal`, `horta`, `serra`) a l'editor del poble.
   - **De `261009_2005_brainstorming_panell_superadmin_mestre.md`:** Interruptors de mòduls per poble (`feature flags`), semàfor de salut dels 3 motors IA i botó de purga d'emergència de caché local a `/consola`.
   - **De `261011_0130_ordres_nit_directora.md` i `261012_2050..2148_*`:** Modificadors per línia de comanda al TPV Bar (`Llet d'avena`, `Sense gel`) i estats financers anuals (`Balanç de Situació` i `Compte de P&G`) a la Gestoria per a la fase post-Sollutia.
   - **Les 6 Decisions Obertes per al Panell de Certificació d'1 Clic a `/consola`:**
     1. **`D-UUID-REMOT`:** Associació de l'UUID real de Javi Llinares, `socdepoble` i `rentonar` a `IDS_REMOTS_FUNDACIONALS` (`identitatsSeed.js:201-205`).
     2. **`D-RENTONAR-PADRO`:** Incorporar `El Rentonar` al padró de «Nova conversa» (`xatSeed.js:82-86`).
     3. **`D-RAG-PUBLIC`:** Excloure `rag-index.json` i `slugIndex.json` del build públic de Firebase (`C8`).
     4. **`D-6-APPS-COMUNITAT`:** Activar les fitxes de les 6 aplicacions del Manifest de Poble rescatades (*Mans Veïnes*, *Banc de Terres*, *Tractor Compartit*, *Compres Col·lectives*, *El Pregoner*, *Oficis de Poble*).
     5. **`D-ESTIL-POBLE-UI`:** Activar el selector visual dels 4 estils (`pedra-seca`, `bancal`, `horta`, `serra`) a l'editor de `/pobles`.
     6. **`D-ARXIU-FRED`:** Autoritzar el buidatge del **91,4% del llast de `90_arxiu_historic/`** cap a un magatzem fred fora d'Obsidian (`_arxiu_fred_fora_obsidian/`).

5. **Pla d'Alliberament Cognitiu d'Obsidian (Com eliminar el 91,4% del pes sense perdre ni una sola idea):**
   - **Llast immediatament arxivable fora d'Obsidian (`24,45 MB` de `26,69 MB`):**
     1. `260922_0320_BUNDLE_null.md` (**`5,16 MB`** en un sol fitxer que contamina totes les cerques d'Obsidian).
     2. Els `90` fitxers binaris/JSON/patches/Lighthouse de `261005_Sessio_Marato_2230/` (**`13,15 MB`**) i els `237` JSON/patches de `261004_Auditoria_Sol_Muy_Alto_0515/`.
     3. Els `4` fitxers corruptes de `0 bytes` (`260929_2346_*`, `260930_0040_*`).
     4. Els `196` prompts tàctics i `240` auditories/plans de bugfix ja absorbits pel codi i pel LEDGER (`~6,14 MB`).
   - **Memòria Viva que es conserva destil·lada (`42` documents d'or = `1,45 MB`):** Els `28` documents fundacionals de la Primera Meitat + els `14` documents d'ordres i arquitectura de la Segona Meitat, ara sintetitzats en aquest informe i connectables des de `/consola`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Porta Olivera (`node tooling/gates/porta-olivera.mjs`):** Codi `0` verificat.
- **Validació documental (`node tooling/wiki/document.mjs check`):** Executada amb `valid: true, errors: []` sobre `_wiki_de_poble/04_escriptori/261016_1633_auditoria_gemini4.md`.
- **Religat del Pla (`document.mjs plan`):** Torns `torn_50a6a11f` i `torn_80dccf6a` actualitzats amb l'últim hash del Pla (`cdfd79e65287316075e896435bae1fea732c3ec102664d2af991f18566460a18`).
- **Subagents d'investigació (4/4 completats al 100%):** `c2e67a50` (Arqueòleg 1: ítems 1..285), `58706d00` (Arqueòleg 2: ítems 286..418), `d13f1af4` (`01_produccio/`, `02_investigacio_ia/`, Emowe i `/multimedia`) i `dda9ce4b` (Arquitectura UI i Conformitat 1530).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- En compliment de `core-direccio-autonoma` i del Pla `261016_1530` (§0), Gemini 4 Argon / IAIA MarIA opera amb `scope: documents` i no edita fitxers de `src/` directament per no generar conflictes d'escriptura concurrent amb Claude Code (`torn_f66993e9`).
- El desplegament públic a Firebase Hosting (`socdepoble.org`), l'actualització del connector WordPress a `gentdelatorre.net` i l'aplicació de la migració SQL `2610160250_perfil_update_propi.sql` al Supabase remot de producció es documenten per al panell de `/consola`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
