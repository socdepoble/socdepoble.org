---
type: informe
status: esborrany
description: Auditoria d'UX rural comparada dels 4 actors rurals (Gent de la Torre), dictamen arquitectònic sobre formats d'imatge i targetes quadrades (IDEA-20) i revisió creuada de P1-11
tags:
  - auditoria
visibility: private
reflex: sdp:torn_00ed98d6-10f9-4dcc-8f6f-62e6a39d8e84:5267f294-139f-43a2-a945-6fe2fe5f3210
---
# Auditoria Gemini 4 Argon · Lògica dels 4 Actors Rurals, Dilema Ràtio Targeta vs Portada (IDEA-20) i Disseny Interior Pedra Seca (P1-11)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_00ed98d6-10f9-4dcc-8f6f-62e6a39d8e84:5267f294-139f-43a2-a945-6fe2fe5f3210 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T21:02:43.522Z |
| Modificació | 2026-10-24T23:05:00.000Z |
| Propietari | Gemini 4 Argon (IAIA MarIA) |
| Aprovació humana | Direcció Autònoma autoritzada pel Mestre Javi Llinares (2026-10-24, àudios 22:29, 22:47, 00:33–00:55) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Directora de Disseny Pedra Seca i Auditoria d'UX Rural Comparada) |
| Tokens consumits | N/A (execució nativa local a disc) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

Lectura íntegra verificada abans d'emetre aquest dictamen sobre el commit `d7aa77350` (branca `backup-notes-publish`):
- **BIOS i Govern:** `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, `.agents/ESTAT.md`, `_wiki_de_poble/04_escriptori/00_index_escriptori.md`, `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`, [[261024_2230_pla_implementacio_logica_actors_i_disseny_interior_pedra_seca]], [[261024_2230_prompt_claude_gemini_codex_logica_actors_i_disseny_interior_pedra_seca]], i l'informe homòleg d'aquest mateix torn [[261024_2254_auditoria_codex]].
- **Skills executades:** `.agents/skills/sdp-pedra-seca/SKILL.md`, `.agents/skills/sdp-estudi-mercat/SKILL.md` i `.agents/skills/sdp-casos-us-essencials/SKILL.md`.
- **Codi font inspeccionat:** `src/sections/detail/detailSectionMeta.jsx`, `src/sections/profile/PerfilPublicSection.jsx`, `src/sections/connectar/BlocRelacio.jsx`, `src/sections/profile/Seguidors.jsx`, `src/sections/profile/DetallCompte.jsx`, `src/sections/profile/perfilModel.js`, `src/sections/profile/GestioMembres.jsx`, `src/sections/profile/ProfileSection.jsx`, `src/sections/profile/useImatgeDeFitxa.jsx`, `src/components/universal/enquadrament/enquadrament.js`, `src/components/universal/enquadrament/useEnquadramentImatge.jsx`, `src/components/universal/enquadrament/DialegEnquadrament.jsx`, `src/components/universal/UniversalEditorShell.jsx`, `src/components/universal/PageFrame.jsx`, `src/components/PedraSeca/organismes/UniversalCard.jsx`, `src/components/PedraSeca/organismes/UniversalCard.quadrat.capes.test.js`, `src/sections/mur/PublicacionsDeLActor.jsx`, `src/sections/mur/usePublicacionsDeLActor.js`, `src/sections/pobles/PublicacionsDelPoble.jsx`, `src/sections/pobles/usePublicacionsDelPoble.js`, `src/sections/notes/masDeLUsuari.js`, `src/data/organizations.js`, `src/data/supabase/organizations.js`, `src/utils/pujadaImatge.js`, `src/hooks/useHeroImageHandler.js`, `src/css/layout.css`, `src/css/components.css`, `src/css/kowalskiMurConsola.capes.test.js` i `src/css/imatgesASang.capes.test.js`.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-24T21:02:43.522Z`: Esborrany creat amb `document.mjs context` -> `create --anchor` dins del torn `torn_00ed98d6-10f9-4dcc-8f6f-62e6a39d8e84`.
- `2026-10-24T21:05:00.000Z`: Completada l'auditoria pre-implementació de la lògica dels 4 Actors Rurals (`P1-11`), el dictamen de disseny i arquitectura sobre el dilema Ràtio de Targeta vs Portada (`IDEA-20`, àudio 22:47) i la revisió creuada amb [[261024_2254_auditoria_codex]].
- `2026-10-24T22:52:00.000Z`: **Gauntlet Loop Adversarial Post-Commit sobre `47eb2fa00` (arbre `b957185c`, 70 fitxers):** Verificació empírica en viu al navegador (`http://localhost:3340`) de la finestra de retallada amb les 9 proporcions (`1:1`, `original`, `4:3`, `3:2`, `16:9`, `21:9`, `4:5`, `3:4`, `9:16`), l'exportació real pel canvas (`1200×515 px` en `21:9` i `675×1200 px` en `9:16`), la guarda d'alçada vertical (`max-height: min(75vh, 720px)`), l'harmonia `1:1` de `UniversalCard`, la 2a pestanya «Empreses i entitats» a `/pobles/la-torre-de-les-macanes`, l'aparador al peu (`section.sdp-pagina-peu` fora d'`<article>`) a `/empresa/socdepoble` i `/gent/javi-llinares`, la vista «Membres i connexions» a `/el-meu-perfil` i el vocabulari pur de `/connectar`.
- `2026-10-24T23:05:00.000Z`: **Dictamen sobre les Directives `IDEA-21` (Fi del doble scroll i diàlegs adaptatius) i `IDEA-22` (Reforma de `/connectar` i Contracte de `seguiments` amb Actor d'Origen):** Verificació empírica al navegador de l'erradicació del doble scroll a `<Dialeg>`, `SelectorVisibilitat` (`zeroScroll: true`) i les 9 pastilles compactes a `DialegEnquadrament` (`fieldsetRect: 104 px` d'alt vs `867 px` anteriors), i auditoria arquitectònica d'`IDEA-22` (polimorfisme simètric d'origen i destí en `seguiments`, erradicació de `'sense-xat'` a `BlocFormarPart.jsx` i purga de `BlocAdministrarOrganitzacio` de `/connectar`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte Executiu del Gauntlet Loop Post-Commit (`47eb2fa00` / arbre `b957185c`)

**DICTAMEN FINAL DE GEMINI 4 ARGON: CONFORMITAT FUNCIONAL I VISUAL APROVADA (`[FET · 47eb2fa00]`) AMB 2 OBSERVACIONS DE POLIMENT UX NO BLOQUEJANTS (`G2315-01` i `G2315-02`).**

Després d'auditar els 70 fitxers del commit `47eb2fa00` ([[261024_2315_implementacio_claude]]) i d'executar la inspecció empírica en viu amb Chrome DevTools sobre `http://localhost:3340`:
1. **Finestra de Retallada amb 9 Proporcions (`IDEA-20`):** Verificada en viu tant a Notes (`/notes`, `UniversalEditorShell.jsx`) com al retallador senzill del Perfil (`Retalla la capçalera`, `senzill: true`, `DialegEnquadrament.jsx:718-720`). Les 9 proporcions (`1:1`, `original`, `4:3`, `3:2`, `16:9`, `21:9`, `4:5`, `3:4`, `9:16`) estan actives, redimensionen el `<canvas>` del visor en temps real (`960×960` en `1:1`, `960×411` en `21:9`, `540×960` en `9:16`) i exporten fitxers reals amb `costatLlarg = 1200` (`1200×515 px` en `21:9` i `675×1200 px` en `9:16`). Re-enquadrar una imatge ja desada s'obri encertadament en `'original'` per no tallar una panoràmica prèvia.
2. **Guarda d'Alçada Vertical i Harmonia `1:1` de `UniversalCard`:** Verificat al DOM viu que `.hero-image--vertical img` (`layout.css:454-461`) i `.hero-image .sdp-visor__obridor--vertical > img` (`components.css:3364-3369`) computen `max-height: min(75vh, 720px)` (`675px` en un viewport de `900px` d'alt) amb `margin-inline: auto`, mentre que totes les `.sp-card-media-container` de la graella mantenen `500×500 px`, `aspect-ratio: 1 / 1` i `object-fit: cover`.
3. **2a Pestanya «Empreses i entitats» a la Fitxa de Poble (`/pobles/la-torre-de-les-macanes`):** Verificat en viu que `h1` és `"Gent de La Torre"`, `.badge-row`/`.pill` retorna `0` elements, i en clicar la 2a pestanya `"Empreses i entitats"` (`height: 48px`) es carrega amb èxit la targeta de **«La Figuera · Natural art 🌸 Made in La Terreta · Empresa · Anar al xat · CONNECTAR»**, amb filtre remot `town_name=eq.` abans del límit i defensa en profunditat al client (`G2230-01` / `C11-01` resolt).
4. **Aparador al Peu de la Fitxa Pública (`PerfilPublicSection.jsx` + `PublicacionsDeLaFitxa.jsx`):** Verificat en viu a `/empresa/socdepoble` (`h2: "El que publica Sóc de Poble"`) i `/gent/javi-llinares` (`h2: "El que publica Javi Llinares"`) que l'aparador viu a `section.sdp-pagina-peu` **fora de `<article>`** (`peuInsideArticle: false`, evitant contaminar l'Índex i el Traductor), amb les 3 pestanyes `Mur`, `Mercat` i `Agenda` (`height: 48px`) i obertura automàtica en la primera pestanya amb contingut (a `/gent/javi-llinares` s'obri directament `Mercat` mostrant `"Mac Mini Apple M4, 24/512GB"`).
5. **Vista «Membres i connexions» (`T5B-03`) i Puresa Lèxica de `/connectar` (`G2230-03`) i `C11-02`:** Verificat en viu a `/el-meu-perfil?organitzacio=socdepoble` que la vista `"Membres i connexions"` mostra una sola llista (`["Membres", "Veïnat connectat amb Sóc de Poble", "Llevar un membre"]`, zero duplicació), que `/gent/javi-llinares` mostra `"Veïnat connectat amb tu"`, que `/connectar` té `0` ocurrències de `seguir`/`seguidors`, i que la migració `2610242320_correu_propietaria_nomes_titular.sql:83` restringix `auth.users.email` a `and m.user_id = v_uid`.
6. **Consola 100% Neta:** Zero errors i zero avisos a Chrome DevTools (`list_console_messages`) durant tot el recorregut.

---

### Bloc D · Troballes del Gauntlet Post-Commit en Navegador Real (`http://localhost:3340`)

#### `G2315-01` · P3 / Poliment d'Usabilitat · Repetició 8 vegades del subtítol d'ajuda dins de les 9 caselles de «Forma» (`fieldset` de 867–1.098 px d'alçada)
- **Fitxers afectats:** `src/components/universal/enquadrament/useEnquadramentImatge.jsx:108-111`, `src/components/universal/UniversalEditorShell.jsx:213-216`, `src/components/universal/enquadrament/DialegEnquadrament.jsx:718-720`.
- **Evidència empírica al navegador (`http://localhost:3340`):**
  - En obrir el diàleg d'enquadrament a `/notes` (`dialogRect: 896×768 px`) i al retallador senzill de capçalera (`Retalla la capçalera`, `dialogRect: 448×768 px`), cada una de les 8 opcions no quadrades (`original`, `4:3`, `3:2`, `16:9`, `21:9`, `4:5`, `3:4`, `9:16`) porta injectada la mateixa cadena `ajuda` (`"A la fitxa es veu sencera, amb esta forma; a les targetes es retalla en quadrat."` al Perfil, i `"La pàgina l’ensenya sencera; la miniatura del llistat i la targeta del Mur la retallen en quadrat."` a Notes).
  - Com que cada `.sdp-casella` renderitza el seu `<span className="sdp-casella__ajuda">`, cada casella fa **90–91 px d'alt** (`133 px` la primera en Notes) i el `<fieldset>` «Forma» arriba a **867 px d'alçada** al Perfil i **1.098 px d'alçada** a Notes (més alt que el propi modal de `768 px`), obligant a fer un scroll vertical llarg dins del diàleg per arribar a `4:5`, `3:4` i `9:16`.
- **Proposta conservadora per a un proper poliment (`requires_human_decision: false`):**
  - Deixar `ajuda` únicament a la fila `'1:1'` i a `'original'` (tal com fa `FORMATS` a `enquadrament.js:34-51`), o bé mostrar un únic `<p className="sdp-camp__ajuda">` dinàmic sota el `<GrupOpcions llegenda="Forma">` amb l'ajuda de la forma activa (`AJUDA_CAPCALERA_QUADRADA` si `estat.format === '1:1'`, o `AJUDA_CAPCALERA_LLIURE` per a la resta). Això reduirà l'alçada del bloc «Forma» de `867–1.098 px` a `~420 px` sense perdre cap informació accessible.

#### `G2315-02` · P3 / Poliment CWV · Detecció `heroVertical` en `onLoad` sense dimensions predeclarades (Coincidència amb `L-6` de Claude)
- **Fitxers afectats:** `src/components/universal/PageFrame.jsx:872-875`, `src/sections/detail/VisorDePublicacio.jsx:227-237`.
- **Evidència:** Tant `PageFrame` com `VisorDePublicacio` activen la classe `.hero-image--vertical` / `.sdp-visor__obridor--vertical` en disparar-se `onLoad` (`naturalHeight > naturalWidth`). Quan una portada és vertical (`4:5`, `3:4`, `9:16`) i no té `heroWidth`/`heroHeight` declarats, canvia d'`width: 100%` a `width: auto; max-height: min(75vh, 720px)` un cop descarregada la imatge.
- **Proposta conservadora:** Registrar com a millora evolutiva (`L-6`) passar `width` i `height` de l'actiu o mantindre-ho com a optimització no bloquejant (les portades quadrades i apaïsades no pateixen cap canvi de classe en `onLoad`).

#### `G2315-03` · P3 / Higiene · 2 fitxers d'imatge sense seguiment a `public/assets/fotos/` que fan fallar `censImatges.test.js` (Coincidència amb `L-1` de Claude)
- **Fitxers afectats:** `public/assets/fotos/iaia_maria_avatar_mobil.png` i `public/assets/fotos/iaia_maria_avatar_mobil.webp` (untracked a `git status`).
- **Evidència:** Tots dos fitxers estan sense seguiment a l'arbre de treball d'una sessió prèvia i no figuren a `censImatges.json`, provocant les 2 fallades de `censImatges.test.js` fora de `test:precommit`.
- **Proposta conservadora (`requires_human_decision: true`):** El Mestre ha de decidir si s'evacuen fora de `public/assets/fotos/` (cap a `_multimedia_de_poble/`) o si s'incorporen al cens oficial d'imatges.

---

### Bloc A · Auditoria dels 4 Actors Rurals vs Estudi de Mercat Comparat (`.agents/skills/sdp-estudi-mercat/SKILL.md` & `sdp-casos-us-essencials/SKILL.md`)

#### A.1. Matriu d'Identitat, Diferenciació Funcional i Doctrina del Connectar

| Actor Rural | Model de Dades & Rutes | Diferenciació Visual i Funcional (Pedra Seca) | Antídot contra els Fracassos del Mercat (`Puebloo`, `Puebli`, `Bandomovil`) | Estat al Codi (`d7aa77350`) i Acció `P1-11` |
| :--- | :--- | :--- | :--- | :--- |
| **1. Veí / Veïna** *(Persona)* | `profiles` · Fitxa pública `/gent/:id` · Espai privat `/notes` i `/el-meu-perfil` | **Refugi Privat + Relació Simètrica:** El seu centre d'operacions és el Bloc de Notes privat (`/notes`, zero sigla «MAS» visible) des d'on redacta i publica al Mur, Mercat o Agenda. Les seues connexions s'administren centralitzadament a `/connectar` (`tipus='persona'`), amb notificació al xat la 1a vegada i botó directe «Escriure-li». | Evita la «xarxa social buida» de **Puebloo** (tancada a finals de 2023): l'usuari entra a l'app encara que ningú més publique gràcies al seu Bloc de Notes personal, la Llista de la Compra i el Lector RSS. | **Consolidat al nucli; pendent `P1-11.2` i `P1-11.3`:** Muntar `<VistaPublicacionsDeLActor>` a `PerfilPublicSection.jsx` i purgar el lèxic «Seguir» a `BlocRelacio.jsx` i `Seguidors.jsx`. |
| **2. Comerç / Empresa / Ofici** *(Economia KM 0)* | `organizations` (`kind = 'company' \| 'entity'`) · Fitxa `/empresa/:id` o `/entitat/:id` | **Aparador KM 0 + Tracte Directe + TPV:** No és un mur d'estats; és una botiga viva amb aparador de productes del Mercat, contacte directe (correu/telèfon/xat d'entitat) i passarel·la cap al TPV Loyverse Pedra Seca i al servei solidari *Menjar a Casa* (catering social per a gent gran). | Supera el directori estàtic i mort de les webs municipals: un comerç pot pujar una foto panoràmica de les seues joies (`IDEA-20`), vendre sense comissions abusives i connectar amb el veïnat que s'hi vincula a `/connectar`. | **Pendent `P1-11.2`, `C11-05` i `IDEA-20`:** Activar l'aparador viu a `PerfilPublicSection.jsx:671-720`, desbloquejar les proporcions de portada per a l'aparador (`useEnquadramentImatge.jsx`) i harmonitzar el contacte públic (`C11-05`). |
| **3. Col·lectiu / Grup / Associació** *(Comunitat)* | `organizations` (`kind = 'group'`) · Fitxa `/grup/:id` | **Pertinença («Formar part») + Xat amb Reducció de Soroll:** A `/connectar` oferix el bloc específic «Formar part» (sol·licitud estructurada amb confirmació que arriba al xat privat dels gestors) i la seua fitxa mostra l'activitat col·lectiva i els actes de l'Agenda. Al xat de grup, la captura d'acords amb «Enviar a Notes» evita l'infern de 200 missatges de WhatsApp. | Resol la saturació dels grups de WhatsApp veïnals i la rigidesa dels taulers unidireccionals: separa la conversa efímera dels acords i actes publicats. | **Consolidat a `/connectar`; pendent `P1-11.2` i `P1-13`:** Muntar `<VistaPublicacionsDeLActor>` a la fitxa pública i blindar la concurrència d'alta de membres (`C11-03`). |
| **4. Pàgina de Poble («Gent de [Poble]»)** *(Àgora Cívica)* | Registre canònic de pobles (`pobles.js`) · Fitxa `/pobles/:id` (ex. *Gent de la Torre*) | **Zero Institucionalitat de Partida (`Bottom-Up`):** Construïda des de baix pels mateixos veïns, comerços i associacions («Gent de la Torre»), sense esperar llicències ni permisos burocràtics d'ajuntaments. Agrega automàticament les publicacions del poble (Pestanya 1) i el teixit viu d'empreses, oficis i col·lectius locals (Pestanya 2). | Evita el **parany B2G de Puebli i Bandomovil**: mentre Bandomovil és un altaveu unidireccional de bans municipals i Puebli depén de contractes d'ajuntament, *Gent de la Torre* batega per si mateixa des del primer veí o artesana que s'hi connecta. | **Pendent `P1-11.1` (`G2230-01`):** Eliminar píndoles HTML duplicades `.badge-row`/`.pill` a `detailSectionMeta.jsx:621-624` i activar la 2a pestanya «Empreses i entitats del poble» amb filtratge real per poble. |

---

#### A.2. Troballes Tècniques de Disseny Interior i Contractes (`P1-11`)

##### `G2230-01` · P2 / Mitjana · `PestanyesDelPoble` i absència de filtratge per poble a `listPublicOrganizations` (Coincidència amb Codex `C11-01`)
- **Fitxers afectats:** `src/sections/detail/detailSectionMeta.jsx:529-630`, `src/data/supabase/organizations.js:206-227`, `src/data/localPerfils.js:326-337`.
- **Evidència:**
  1. A `detailSectionMeta.jsx:621-624`, la fitxa de poble encara injecta `<div class="badge-row"><span class="pill">Comarca: ...</span></div>` en HTML cru quan la mateixa dada ja es pinta a la taula `.fitxa-poble__dades`, i `PestanyesDelPoble` (`:540-565`) té una única pestanya (`publicacions`).
  2. Tant `src/data/supabase/organizations.js:206-227` com `src/data/localPerfils.js:326-337` ignoren qualsevol paràmetre `poble` o `town_name` i retornen les primeres 500 organitzacions globals ordenades alfabèticament.
- **Font de veritat en conflicte:** Pla `261024_2230` (Tasca 1.1) i Llibre Mestre `P1-11` (`T5B-01`).
- **Proposta conservadora d'implementació:**
  1. Afegir suport explícit de filtratge per poble a `listPublicOrganizations({ consulta, poble, limit, signal })` tant a `src/data/supabase/organizations.js` (consultant `town_name` abans del `limit` quan la columna estiga disponible, amb fallback normalitzat per `clauDelPoble` si `columnesDirectoriAbsents.has('town_name')`) com a `src/data/localPerfils.js`.
  2. Dins de `PestanyesDelPoble` (`detailSectionMeta.jsx`), comparar `clauDelPoble(org.town_name)` amb el conjunt `clausDeLaFitxaDelPoble(item)` (definida a `src/sections/pobles/publicacionsDelPoble.js:18-32`) per resoldre variants de nom i bilingüisme (ex. *La Torre de les Maçanes* / *Torremanzanas*).
  3. Renderitzar cada entitat amb `<UniversalCard variant="compacta" ... />` navegant a `camiFitxaPublica({ tipus: org.kind === 'company' ? 'empresa' : 'grup', id: org.slug || org.id })`.
- **`requires_human_decision`:** `false`.

##### `G2230-02` · P2 / Mitjana · Incompatibilitat directa del DTO d'`itemsPublicatsDe` amb `<VistaPublicacionsDeLActor>` a `PerfilPublicSection.jsx` (Coincidència amb Codex `C11-04`)
- **Fitxers afectats:** `src/sections/profile/PerfilPublicSection.jsx:671-720`, `src/sections/notes/masDeLUsuari.js:152-165`, `src/sections/mur/PublicacionsDeLActor.jsx:57-59`, `src/sections/mur/usePublicacionsDeLActor.js:129-144`.
- **Evidència:** `itemsPublicatsDe(notes, { ids, noms })` retorna embolcalls de nota virtual (`{ id: 'publicacio:mur:...', title, content, data: { seccio, item, ruta } }`), mentre que `<VistaPublicacionsDeLActor>` itera `entrades` desestructurant `{ id, item, esdeveniment }` i passa `item` directament a `<TargetaDelMur>`. Si es passa el resultat cru d'`itemsPublicatsDe` a `<VistaPublicacionsDeLActor>`, `item` és `undefined` i la vista trenca.
- **Font de veritat en conflicte:** Pla `261024_2230` (Tasca 1.2) i Llibre Mestre `P1-11` (`T5B-02`).
- **Proposta conservadora d'implementació:** Reutilitzar i exportar la funció pura de transformació `publicacionsDeLaSeccio(publicacions, seccio)` de `src/sections/mur/usePublicacionsDeLActor.js:129-144` (que desempaqueta `pub.data.item`, calcula `esdeveniment = item.type === 'event' ? acteAEsdeveniment(item) : null` i ordena per `perMomentDescendent`), invocant-la amb la identitat de l'actor **visitat** (`ids: [fitxa.id, fitxa.slug]`, `noms: [fitxa.nom, fitxa.handle]`) i les tres pestanyes canòniques (`mur`, `mercat`, `agenda`). Zero botons solts de seguir a la fitxa.
- **`requires_human_decision`:** `false`.

##### `G2230-03` · P2 / Mitjana · Unificació Lèxica de «Connectar» i Paritat amb `i18n.claus.test.js`
- **Fitxers afectats:** `src/sections/connectar/BlocRelacio.jsx:45,80-85,100-139`, `src/sections/profile/Seguidors.jsx:125,154`, `src/components/universal/SnippetCurador.jsx:112`, `src/config/idiomes/ca.js` (i `es.js`, `en.js`, `eu.js`, `gl.js`).
- **Evidència:** Els rètols interns de `/connectar` i `Seguidors.jsx` encara mostren «Seguir {nom}», «Deixar de seguir», «Gent que et seguix» i «Qui seguix {nom}». A més, la porta `src/config/i18n.claus.test.js` valida que el segon argument (fallback) de cada crida `tr('clau', 'fallback')` coincidisca exactament caràcter per caràcter amb el valor de `src/config/idiomes/ca.js`.
- **Font de veritat en conflicte:** Directiva del Mestre (Àudios 18:21 i 22:29), `IDEA-14`, `P1-11` (`G1945-04`).
- **Proposta conservadora d'implementació:** Actualitzar en bloc les claus `perfil.seguiments.*` i `connectar.*` tant als components (`BlocRelacio.jsx`, `Seguidors.jsx`, `SnippetCurador.jsx`) com als 5 diccionaris d'idioma (`ca.js`, `es.js`, `en.js`, `eu.js`, `gl.js`) cap al vocabulari de Pedra Seca: «Connectar amb {nom}», «Connectat», «Desconnectar», «Veïnat connectat» i «Connexions de {nom}».
- **`requires_human_decision`:** `false`.

##### `G2230-04` · P3 / Baixa · Precisió Quirúrgica en `DetallCompte.jsx` i `GestioMembres.jsx` (`T5B-03`)
- **Fitxers afectats:** `src/sections/profile/DetallCompte.jsx:1-150`, `src/sections/profile/GestioMembres.jsx:305-320`, `src/sections/profile/perfilModel.js:211-250`.
- **Evidència:** `DetallCompte.jsx` té 150 línies i delega les vistes d'ajustos a `DetallAjust.jsx`. Així mateix, `<GestioMembres>` (`src/sections/profile/GestioMembres.jsx:313`) ja munta internament `<QuiSegueixOrganitzacio orgId={orgId} nom={nomOrg} />`. Si en separar la vista `membres` a `perfilModel.js` es munten `<GestioMembres>` i `<QuiSegueixOrganitzacio>` com a germans, es duplicarà el bloc «Connexions de l'entitat».
- **Proposta conservadora d'implementació:** Quan es munte la vista dedicada `membres` per a organitzacions, renderitzar `<GestioMembres>` (que ja inclou `<QuiSegueixOrganitzacio>` al peu) sense duplicar el component germà.
- **`requires_human_decision`:** `false`.

---

### Bloc B · Dictamen Arquitectònic i de Disseny Pedra Seca: El Dilema Ràtio de Targeta vs Portada (`IDEA-20`, Àudio 22:47)

#### B.1. Diagnòstic del Problema Real (El Cas de l'Artesana de Joies)

L'experiència real de la primera usuària (una artesana de joies que ha volgut pujar una fotografia panoràmica de les seues peces i s'ha vist forçada a retallar-la en un quadrat `1:1`) ha posat al descobert una restricció artificial en tres punts exactes del codi d'enquadrament de capçaleres (`heroImage` / `hero_url`):
1. **`src/components/universal/enquadrament/useEnquadramentImatge.jsx:80-106` (`FORMES.capcalera`):** Defineix `PROPORCIO_CAPCALERA = Object.freeze([Object.freeze({ valor: '1:1', ratio: 1 })])` i força `exacta: Object.freeze({ amplada: MIDA_CAPCALERA, alcada: MIDA_CAPCALERA })` (`1200×1200`).
2. **`src/components/universal/enquadrament/useEnquadramentImatge.jsx:139` (`configDeForma`):** Estableix `senzill: forma === 'avatar' || forma === 'logo' || forma === 'capcalera'`. En tindre `senzill: true`, `DialegEnquadrament.jsx:644` (`{!senzill ? (<div className="enquadrament__opcions">...`) **oculta per complet el selector `<GrupOpcions llegenda="Forma">`** a l'usuari.
3. **`src/components/universal/UniversalEditorShell.jsx:203-210` (`CAPCALERA`):** Duplica la mateixa restricció per a la portada d'articles i productes creats des de l'Editor Universal (`FORMATS_CAPCALERA = ['1:1']` i `exacta: { amplada: 1200, alcada: 1200 }`).

Per contra, el motor matemàtic subjacent (`src/components/universal/enquadrament/enquadrament.js:97-158` i `src/utils/pujadaImatge.js:204-244`) i el contenidor de pàgina (`src/components/universal/PageFrame.jsx:1015-1019` + `src/css/layout.css:435-446`, `.hero-image img { width: 100%; height: auto; }`) **ja estan dissenyats per acceptar qualsevol ràtio d'aspecte** sense necessitat d'afegir cap columna SQL nova (el retall i la proporció queden codificats als propis píxels del fitxer WebP sota la doctrina `T46` i `IDEA-02`).

#### B.2. Avaluació Comparada de les 3 Opcions Arquitectòniques per a `UniversalCard` vs `PageFrame`

| Criteri d'Enginyeria i Pedra Seca | Opció A: Targeta d'Alçada Variable al Mur/Mercat (`aspect-ratio` dinàmic a `.sp-card-media-container`) | Opció B: Targeta 1:1 amb `object-fit: contain` (Bandes de Fons en Totes les Targetes) | Opció C (RECOMANADA · «Doble Escala Harmònica»): Portada Lliure a la Fitxa + Finestra Matemàtica `1:1` (`cover` centrat) a la Graella `UniversalCard` |
| :--- | :--- | :--- | :--- |
| **1. Harmonia de la Graella (`.sdp-card-grid`)** | **Trencada (Efecte Dent Serrada):** En una fila de 2 o 3 columnes, una foto vertical `9:16` (560 px d'alt) al costat d'una panoràmica `21:9` (135 px d'alt) desalinea les boines taronges (`58px`), els títols i els peus blaus, o deixa un buit blanc de 425 px dins de la targeta panoràmica. | **Geometria externa uniforme, però interior fragmentat:** Una foto `21:9` dins d'un quadrat `1:1` deixa un **57% de la caixa d'imatge buida** (dues faixes mortes a dalt i a baix); una `4:5` deixa faixes laterals. Es perd la força d'«imatge a sang» de Pedra Seca. | **100% Intacta:** Totes les targetes d'una fila tenen exactament la mateixa caixa `1:1`, boines taronges i peus blaus alineats al mil·límetre i imatge a sang sense vores ni faixes mortes. |
| **2. Estabilitat Visual (`CLS` / Core Web Vitals)** | **Alt risc de `CLS > 0.25`:** Com que `image_url` / `hero_url` no desa `width`/`height` en una columna SQL separada, el navegador desconeix la proporció abans de descarregar el WebP i la graella fa salts bruscos en carregar. | **`CLS = 0`** (la caixa reserva `aspect-ratio: 1 / 1` abans de carregar la imatge). | **`CLS = 0` a la graella:** La caixa `.sp-card-media-container` reserva `aspect-ratio: 1 / 1` des del primer frame CSS. |
| **3. Expressivitat de l'Aparador de l'Artesana (`PageFrame` i `VisorImatges`)** | Completa a la fitxa i a la targeta, a costa de destruir la graella. | Completa a la fitxa, però encongida com un segell dins de la targeta (les joies d'una panoràmica `21:9` es veuen un 57% més menudes a la graella). | **100% Completa a la Fitxa Pública (`/empresa/:id`, detall de producte/post) i al Lightbox (`VisorImatges`):** Quan el veí obri la fitxa de l'artesana o toca la imatge, la portada llueix en tot el seu esplendor (`21:9`, `16:9`, `4:3`, `4:5`, `original`). |
| **4. Compatibilitat amb Portes i Tests de Capes CSS** | **Trenca 2 suites canòniques:** `kowalskiMurConsola.capes.test.js:348-349` i `imatgesASang.capes.test.js:79`. | **Trenca 2 suites canòniques:** `kowalskiMurConsola.capes.test.js:349` (`toMatch(/object-fit:\s*cover/)`) i `imatgesASang.capes.test.js:80` (contracte d'imatge a sang). | **100% Compatible:** Totes les proves de capes CSS de `UniversalCard` i d'imatges a sang passen en verd sense relaxar cap regla. |

#### B.3. Veredicte sobre el Consens amb Codex (`261024_2254_auditoria_codex` §Targeta i portada)

En el seu informe (`261024_2254_auditoria_codex.md:120-124`), Codex descarta encertadament la targeta d'alçada variable a la graella i proposa comparar `contain` sobre token de fons vs `cover`, deixant la decisió final a Gemini i MarIA. Després de contrastar les mètriques de superfície útil i les portes CSS:
- Aplicar `object-fit: contain` de forma indiscriminada a `.sp-card-media-container` reduiria l'escala visual d'una imatge panoràmica `21:9` a només el **42,8% de l'altura del quadrat** (fent que les joies es vegen minúscules des del mòbil) i trencaria el contracte d'«imatge a sang» (`imatgesASang.capes.test.js:79-80`) que connecta sense costures la boina taronja superior (`58px`) amb la fotografia.
- **Solució Canònica de Pedra Seca («Doble Escala Harmònica»):**
  1. **Desbloqueig de les 9 proporcions al retallador de capçalera (`enquadrament.js`, `useEnquadramentImatge.jsx` i `UniversalEditorShell.jsx`):**
     - Oferir el catàleg complet de 9 proporcions demanat pel Mestre: `original`, `21:9` (`21/9`), `16:9` (`16/9`), `3:2` (`3/2`), `4:3` (`4/3`), `1:1` (`1`), `3:4` (`3/4`), `4:5` (`4/5`) i `9:16` (`9/16`).
     - A `useEnquadramentImatge.jsx:139`, canviar `senzill` perquè siga `forma === 'avatar' || forma === 'logo'` (excloent `'capcalera'`), de manera que `DialegEnquadrament.jsx` mostre la barra de selecció `<GrupOpcions llegenda="Forma">` quan es puja una portada de fitxa, d'empresa o de publicació.
     - Eliminar `exacta: { amplada: 1200, alcada: 1200 }` de `FORMES.capcalera.sortida` (`useEnquadramentImatge.jsx:100`) i de `CAPCALERA.sortida` (`UniversalEditorShell.jsx:206`), i ajustar `midaSortida` a `enquadrament.js:145-158` perquè limite el **costat més llarg** a `1200px` (`maxAmplada: 1200, maxAlcada: 1200`), evitant que un format vertical `9:16` genere un canvas de `1200×2133` abans de comprimir.
  2. **Renderitzat Fidel a `PageFrame.jsx` (`.hero-image`):**
     - A `src/css/layout.css:435-446`, `.hero-image img` ja té `width: 100%; height: auto; display: block;`. Per evitar que una imatge vertical (`3:4`, `4:5`, `9:16`) ocupe més d'una pantalla sencera en monitors d'escriptori, afegir `max-height: min(75vh, 720px); object-fit: contain; background-color: var(--sdp-fons-targeta);` a `.hero-image img`. Així les portades panoràmiques (`21:9`, `16:9`, `4:3`) i quadrades (`1:1`) omplin el 100% d'amplada a sang, i les verticals es mostren senceres sense desbordar el viewport.
  3. **Finestra Matemàtica `1:1` Centrada a `UniversalCard`:**
     - Mantindre `aspect-ratio: 1 / 1` i `object-fit: cover` a `.sp-card-media-container` (`src/css/components.css:1209-1223`), assegurant `object-position: center` (actualment a `src/css/components.css:1044` hi ha una regla antiga `.sp-card-image { object-position: top; }` que tallava la part inferior en lloc de centrar l'objecte).
     - Actualitzar el text d'ajuda del diàleg d'enquadrament (`enquadrament.js` / `DialegEnquadrament.jsx`) perquè informe amb total transparència: *«A la teua fitxa i en obrir la foto es veurà amb la forma triada; a les targetes del mur se'n mostra el centre en quadrat.»*

---

### Bloc C · Verificació d'Accessibilitat, Tokens de Pedra Seca i Revisió Creuada amb Codex

#### C.1. Auditoria de Tokens Semàntics i Accessibilitat (`WCAG 2.1 AA` / `sdp-pedra-seca`)

| Aspecte Audit | Fitxer / Selector | Estat | Evidència Tècnica |
| :--- | :--- | :---: | :--- |
| **Crom del Lector (`#0F672F`)** | `src/css/tokens.css` (`--sdp-crom-barra-lector`) | **CONFORME** | `#0F672F` amb text `#FFFFFF` (ràtio de contrast `7.14:1 > 7:1` AAA). |
| **Tokens d'Acció i Accent** | `--sdp-accio`, `--sdp-accent`, `--sdp-fons-targeta` | **CONFORME** | Cap color hexadecimal hardcodejat als components auditats (`BlocRelacio.jsx`, `Seguidors.jsx`, `PublicacionsDeLActor.jsx`, `DialegEnquadrament.jsx`). |
| **Àrees Tàctils (`>= 44×44 px`)** | `DialegEnquadrament.jsx`, `BlocRelacio.jsx`, `Pestanyes.jsx` | **RECOMANACIÓ DE DISSENY** | Quan s'habiliten les 9 píndoles de proporció a `<GrupOpcions llegenda="Forma">` (`DialegEnquadrament.jsx:646-652`), en pantalles mòbils (`320px–390px`) s'han de disposar en `flex-wrap: wrap` o graella fluida amb `min-height: 44px` i `padding: 0 12px` per garantir el dit rural sense scroll horitzontal amagat. |
| **Navegació per Teclat i ARIA** | `Pestanyes.jsx`, `DialegEnquadrament.jsx`, `BlocRelacio.jsx` | **CONFORME** | `role="tablist"` / `role="tab"` / `aria-selected` en `Pestanyes.jsx`; `aria-pressed` als botons de proporció de `DialegEnquadrament.jsx:62`; `aria-busy` i avisos `role="status"` a `BlocRelacio.jsx`. |

#### C.2. Revisió Creuada amb els Informes de Codex (`261024_2254_auditoria_codex.md` & `261025_0031_auditoria_codex.md`), Claude (`261024_2315_implementacio_claude.md`) i Matriu MCR Post-Commit (`47eb2fa00`)

Hem llegit i contrastat íntegrament els informes [[261024_2254_auditoria_codex]], [[261024_2315_implementacio_claude]], [[261025_0031_auditoria_codex]] i el nou pla [[261025_0045_pla_implementacio_disseny_usabilitat_dialegs]]:
- **Validació al navegador de les correccions de `47eb2fa00`:** Totes les implementacions de Claude (`C11-01`/`G2230-01`, `C11-02`, `C11-04`/`G2230-02`, `G2230-03`, `T5B-03`/`G2230-04` i `IDEA-20`) han estat verificades empíricament en viu a `http://localhost:3340` amb **zero errors de consola**.
- **Convergència 100% en Usabilitat de Diàlegs i Selector Compacte (`G2315-01` + Pla `261025_0045`):** Les nostres mesures empíriques al navegador (`fieldsetRect: 368×867 px` al retallador senzill de `448×768 px` i `fieldsetRect: 320×1.098 px` al retallador de Notes de `896×768 px`, juntament amb l'absència d'`overflow: hidden` a `.sdp-dialeg`) corroboren amb exactitud matemàtica la directiva del Mestre als àudios 00:33–00:36 i el pla [[261025_0045_pla_implementacio_disseny_usabilitat_dialegs]] (eliminar el doble scroll de `<Dialeg>` i substituir les 9 caselles verticals de `90 px` per un selector compacte de pastilles amb una sola línia d'ajuda dinàmica).
- **Convergència amb `G-P11-01` de Codex (`261025_0031_auditoria_codex.md`):** Confirmem a `src/data/supabase/organizations.js:166,228,240-242` que `columnesDirectoriAbsents` és un `Set` d'abast de mòdul compartit entre amfitrions; indexar-lo per la URL resolta del backend (`getResolvedConfig(config).url`) tal com recull la Tasca 4 de [[261025_0045_prompt_claude_usabilitat_i_disseny_dialegs_sense_doble_scroll]] tanca definitivament la reserva de canvi d'host.

| ID Requisit | Descripció del Requisit (Prompt `261024_2230` & Gauntlet `47eb2fa00`) | Estat Post-Commit (`47eb2fa00` / `b957185c`) | Evidència al Navegador (`http://localhost:3340`) i Proves |
| :--- | :--- | :---: | :--- |
| **`MCR-T1.1`** | Fitxa de poble sense píndoles `.badge-row` duplicades i amb 2a pestanya «Empreses i Entitats» filtrada per poble | **CONFORME EN NAVEGADOR (RESERVA `G-P11-01` AL PORT)** | Verificat a `/pobles/la-torre-de-les-macanes`: `badgeRows: 0`, 2a pestanya «Empreses i entitats» (`height: 48px`) mostra **La Figuera**; `G-P11-01` (aïllament per host de `columnesDirectoriAbsents`) incorporat al pla `261025_0045`. |
| **`MCR-T1.2`** | Aparador públic `<VistaPublicacionsDeLActor>` a `PerfilPublicSection.jsx` sense botons solts de seguir | **CONFORME (`[FET · 47eb2fa00]`)** | Verificat a `/empresa/socdepoble` i `/gent/javi-llinares`: `section.sdp-pagina-peu` fora d'`<article>`, 3 pestanyes (`Mur`, `Mercat`, `Agenda`, `height: 48px`), obertura automàtica en `Mercat` quan és la 1a amb ítems (`Mac Mini Apple M4`). |
| **`MCR-T1.3`** | Puresa lèxica del «Connectar» a `BlocRelacio.jsx`, `Seguidors.jsx` i 5 diccionaris i18n | **CONFORME (`[FET · 47eb2fa00]`)** | Verificat a `/gent/javi-llinares` («Veïnat connectat amb tu»), `/el-meu-perfil?organitzacio=socdepoble` («Veïnat connectat amb Sóc de Poble») i `/connectar` (`hasSeguirWord: false`). |
| **`MCR-T1.4`** | Desbloqueig multiformat de capçalera (`original`, `21:9`, `16:9`, `3:2`, `4:3`, `1:1`, `3:4`, `4:5`, `9:16`) | **CONFORME EN MOTOR (`[FET · 47eb2fa00]`) · POLIMENT UX `G2315-01` A `261025_0045`** | Verificades al navegador les 9 proporcions actives i l'exportació real (`1200×515 px` en `21:9`, `675×1200 px` en `9:16`). El `fieldset` vertical de `867–1.098 px` (`G2315-01`) passa a pastilles compactes sense doble scroll al pla `261025_0045`. |
| **`MCR-T2.1`** | Vista «Membres i connexions» (`T5B-03`) i `C11-02` (`contacte_organitzacio` només per a la titular) | **CONFORME EN CODI I UI (`[FET · 47eb2fa00]`)** | Verificat a `/el-meu-perfil?organitzacio=socdepoble` (una sola llista de connexions, sense duplicar `QuiSegueixOrganitzacio`) i a `2610242320_correu_propietaria_nomes_titular.sql:83` (`m.user_id = v_uid`, pendent d'aplicar a Supabase Prod pel Mestre). |
| **`MCR-T2.2`** | Guarda d'alçada vertical (`max-height: min(75vh, 720px)`) i harmonia `1:1` de `UniversalCard` | **CONFORME (`[FET · 47eb2fa00]`)** | Verificat al DOM viu: `.hero-image--vertical img` i `.sdp-visor__obridor--vertical > img` computen `maxHeight: "675px"` (`75vh` sobre `900px`) i `.sp-card-media-container` manté `500×500 px` (`aspect-ratio: 1 / 1`, `object-fit: cover`). |
| **`MCR-T2.3`** | Suite `npm run test:precommit` (< 30 s) i Consola de Chrome 100% neta | **CONFORME (`[FET · 47eb2fa00]`)** | `npm run test:precommit` verd (152 fitxers / 2.959 proves Vitest + 259 proves Node, 0 fallades) i 0 errors/avisos a Chrome DevTools (`list_console_messages`). |

#### C.3. Dictamen sobre les Directives `IDEA-21` (Fi del Doble Scroll i Diàlegs Adaptatius) i `IDEA-22` (Reforma de `/connectar` i Contracte de `seguiments` amb Actor d'Origen)

##### 1. Verificació en Viu i Dictamen sobre `IDEA-21` («El disseny és com el soroll per a allò usable»)

Hem auditat al codi i verificat en viu a `http://localhost:3340` els canvis d'`IDEA-21` implementats a l'arbre de treball (`src/css/components.css`, `src/css/modules.css`, `src/components/PedraSeca/organismes/Dialeg.jsx`, `src/components/universal/SelectorVisibilitat.jsx`, `src/components/universal/enquadrament/DialegEnquadrament.jsx`, `src/css/dialegUnScroll.capes.test.js`):
1. **Erradicació del doble scroll en `<Dialeg>` (`[FET EN ARBRE DE TREBALL]`):**
   - Verificat al DOM viu: `getComputedStyle(dialog).overflow === "hidden"`, `.sdp-dialeg[open]:not(.sdp-dialeg--sense-marc)` és `display: flex; flex-direction: column`, `.sdp-dialeg__marc` i `.sdp-dialeg__cos` tenen `flex: 1 1 auto; min-height: 0`, i l'únic contenidor amb `overflow-y: auto` és `.sdp-dialeg__cos`. Blindat amb `src/css/dialegUnScroll.capes.test.js`.
2. **Finestres adaptatives (`SelectorVisibilitat`, `[FET EN ARBRE DE TREBALL]`):**
   - A `/disseny?categoria=superposicions&item=superposicions-visibilitat`, obrir «Publicada al Mur: canviar» renderitza `<dialog class="sdp-dialeg sdp-dialeg--g sdp-dialeg--barra sdp-selector-visibilitat">` amb `rect: 640×709 px`, `cosScrollHeight: 498 px` i `cosClientHeight: 498 px` (**`zeroScroll: true`**). Si el viewport és més baix i el contingut desborda (`scrollHeight > clientHeight`), `Dialeg.jsx:83-88` activa `.sdp-dialeg--barra-amunt` (`margin-top: var(--sdp-space-4); max-height: calc(100vh - var(--sdp-space-8))`) aprofitant tota l'alçada vertical de la pantalla.
3. **Selector compacte de 9 proporcions a `DialegEnquadrament.jsx` (`[FET EN MODE SENZILL · 2 POLIMENTS G21-01/02]`):**
   - Al mode senzill (`senzill: true`, `DialegEnquadrament.jsx:741-762`), la llista vertical de `867 px` ha estat substituïda per `<fieldset className="sdp-enquadrament__formats" role="radiogroup">` amb 9 pastilles `.sdp-enquadrament__format-pindola` de **`height: 48 px`** (diana tàctil WCAG 2.5.5 intacta: `1:1`, `Original`, `4:3`, `3:2`, `16:9`, `21:9`, `4:5` a la 1a fila i `3:4`, `9:16` a la 2a fila), reduint el `<fieldset>` de **`867 px` a `104 px` d'alt** i mostrant una sola línia de didàctica dinàmica `aria-live="polite"` (`.sdp-enquadrament__didactica`), amb el `<canvas>` (`352×352 px`) sempre a la vista.
   - **Troballa `G21-01` (P2 · `52 px` d'scroll intern residual al mode senzill amb 9 formes):** A `1440×1157 px`, `DialegEnquadrament` (`sdp-dialeg--m`) té `rect.height = 768 px` (`48rem`), on `cosClientHeight = 583 px` i `cosScrollHeight = 635 px` (`52 px` d'scroll intern perquè el `<canvas>` de `352 px` + zoom + 2 files de pastilles de `104 px` + didàctica + botó «Canviar foto» sumen `635 px`). **Solució:** Ajustar `.sdp-enquadrament--formes .sdp-enquadrament__visor` a `max-height: min(35dvh, 18.5rem)` (o `.sdp-enquadrament__dialeg--senzill` a `max-height: min(92dvh, 52rem)`) perquè `cosScrollHeight <= cosClientHeight` (**Zero Scroll** en escriptori).
   - **Troballa `G21-02` (P2 · Unificar el selector compacte també al mode T46 de Notes):** A `DialegEnquadrament.jsx:846` (branca `senzill === false`, usada per `UniversalEditorShell.jsx` a `/notes`), encara es renderitza `<GrupOpcions llegenda="Forma" opcions={formats} ... />` de `1.098 px` d'alt. Substituir aquesta línia pel mateix selector compacte `.sdp-enquadrament__formats` + `.sdp-enquadrament__didactica` elimina l'scroll quilomètric també a l'editor de Notes.
4. **Resolució de `G-P11-01` (`src/data/supabase/organizations.js:174-188`):**
   - Verificat que `columnesDirectoriAbsents` és ara un `Map` indexat per `getResolvedConfig(config).supabaseUrl` amb caducitat `MEMORIA_COLUMNES_MS = 5 * 60 * 1000`, aïllant l'esquema per amfitrió.

---

##### 2. Auditoria de Coherència i Arquitectura de la Directiva `IDEA-22` (Reforma de `/connectar` i Contracte de `seguiments` amb Actor d'Origen)

Hem auditat de dalt a baix `src/sections/connectar/ConnectarSection.jsx`, `src/sections/connectar/BlocRelacio.jsx`, `src/sections/connectar/useSeguiment.js`, `src/sections/connectar/organitzacio/BlocFormarPart.jsx`, `src/sections/connectar/organitzacio/estatFormarPart.js`, `src/sections/connectar/organitzacio/BlocAdministrarOrganitzacio.jsx`, `src/data/contracte.js`, `src/data/localSeguiments.js`, `src/data/supabase/seguiments.js` i `supabase/migrations/2610241430_seguiments.sql`:

1. **`G22-01` (P1 · Coherència entre Multirepresentació B2B a la UI i el Contracte de Backend de `seguiments` amb Actor d'Origen):**
   - **Diagnosi de l'asimetria actual:**
     - **A la UI (`ConnectarSection.jsx:390-392, 614-617` i `useSeguiment.js:118-119`):** La vista afirma explícitament `«Es connecta a ${persona}.»` i `«Actues com a ${actor.nom}, però les connexions són personals.»`, i `useSeguiment` construeix la clau d'estat únicament amb `currentUser.id` (`[usuariId, tipus, id].join('\u0000')`).
     - **Al Contracte i SQL (`contracte.js:743`, `localSeguiments.js:69-142`, `supabase/seguiments.js:102-158` i `2610241430_seguiments.sql:157-186`):** La taula `public.seguiments` i les RPC (`segueix(p_tipus, p_id)`, `deixa_de_seguir`, `estat_seguiment`, `els_meus_seguiments`, `qui_em_segueix`) modelen un **destí polimòrfic** (`seguit_tipus in ('persona', 'entitat')`), però un **origen monomòrfic** (`seguidor uuid not null references auth.users(id)` amb índex únic `(seguidor, seguit_entitat)`).
     - **Conseqüència si només es canvia la UI sense estendre el contracte:** Si un usuari que administra dues organitzacions (`Sóc de Poble` i `Rentonar`) canvia el selector visual «Connectar com a» a `/connectar`, el port continuaria desant una única fila lligada al seu `auth.uid()` personal, impedint que **La Figuera ↔ Sóc de Poble** i **La Figuera ↔ Javi Llinares** coexisteixin, i fent que a «Veïnat connectat amb La Figuera» (`qui_em_segueix`) aparega sempre el nom de la persona (`p.full_name`) i mai el de l'empresa o grup que s'hi ha connectat!
   - **Arquitectura Canònica del Polimorfisme Simètric (Origen ↔ Destí):**
     - **Capa UI (`ConnectarSection.jsx`, `BlocRelacio.jsx`, `useSeguiment.js`):**
       1. Eliminar les línies `ConnectarSection.jsx:614-617` (`Es connecta a...` / `Actues com a ..., però les connexions són personals`).
       2. Quan l'usuari autenticat té més d'una identitat a `useIdentitat().identitats` (`[Persona, ...Organitzacions on és owner/admin]`), mostrar un selector d'un sol toc (`<fieldset role="radiogroup">` amb pastilles `.sdp-connectar__pindola`) etiquetat **«Connectar com a»**, inicialitzat amb l'`actor` actiu d'`IdentitatContext`, però amb estat local `actorConnexio` dins de `ConnectarSection` perquè commutar de barret a `/connectar` no altere la sessió global de l'aplicació.
       3. Recalcular `idsDeQuiConnecta` per a `contacteDe` segons l'`actorConnexio` seleccionat: quan es connecta com a entitat `A`, només s'exclou d'autoseguiment la mateixa entitat `A` (permetent connectar `A ↔ B`), i quan es connecta com a persona, només s'exclou la pròpia persona.
       4. Passar `comOrgId = actorConnexio?.tipus === 'entitat' ? actorConnexio.id : null` (i `comNom = actorConnexio?.nom`) a `<BlocRelacio>` i `useSeguiment`, de manera que la clau reactiva siga `[usuariId, comOrgId || 'persona', tipus, id].join('\u0000')` i l'avís al xat identifique qui es connecta (*«Connexió nova: {comNom} s'ha connectat amb tu a Sóc de Poble.»*).
     - **Capa Port i Adaptadors (`src/data/contracte.js`, `src/data/supabase/seguiments.js`, `src/data/localSeguiments.js`):**
       1. Ampliar de forma retrocompatible l'entrada de `segueix`, `deixaDeSeguir`, `estatSeguiment` i `elsMeusSeguiments` amb l'opció opcional `comOrgId` (`seguitDelContracte(dades)` valida `comOrgId` amb `RE_ID_SEGUIT` si ve present).
       2. A `localSeguiments.js`, indexar el mapa `files` per actor d'origen (`const clauActor = comOrgId ? \`entitat:\${idOrgCanonic}\` : \`persona:\${qui}\``), verificant que `fitxaDEntitat(comOrgId, usuari)?.propietari` siga cert (si no, llançar `SDP-SEG-005`), i guardant a la fila `{ seguidorTipus: comOrgId ? 'entitat' : 'persona', seguidorId: comOrgId || qui, nomSeguidor }` perquè `quiEmSegueix` retorne tant veïns com entitats connectades.
     - **Capa SQL (`supabase/migrations/2610241430_seguiments.sql`, pendent d'aplicar a prod):**
       1. Afegir `seguidor_entitat uuid references public.organizations (id) on delete cascade` a `public.seguiments`.
       2. Quan `p_com_org_id is not null`, exigir `coalesce(private.can_manage_organization(p_com_org_id), false)` (si no, `SDP-SEG-005`) i impedir autoseguiment d'entitat (`p_tipus = 'entitat' and p_id = p_com_org_id` → `SDP-SEG-003`).
       3. Ajustar els índexs únics parcials perquè incloguen `coalesce(seguidor_entitat, '00000000-0000-0000-0000-000000000000'::uuid)` i actualitzar `qui_em_segueix` perquè retorne `coalesce(s.seguidor_entitat, s.seguidor) as id, coalesce(o_seg.name, p.full_name) as nom, s.creat_al`.
       4. **Invariància anti-abús:** Mantenir `private.seguiments_altes` i el pany `pg_advisory_xact_lock` ancorats a `v_jo` (`auth.uid()`), de manera que la quota de **30 altes/hora** siga per compte humà i no es puga multiplicar creant múltiples entitats.

2. **`G22-02` (P1 · Erradicació del bloqueig `'sense-xat'` a `BlocFormarPart.jsx` i Accés Directe al Xat de l'Entitat):**
   - **Causa arrel al codi:** A `ConnectarSection.jsx:231-236, 295`, `IDS_DE_LA_LLAVOR` conté totes les entitats de `ENTITATS_SEED` (`'socdepoble'` i `'rentonar'`). Mentre que `'socdepoble'` porta `projecte: true` i entra a la branca de les línies `290-294` (resolent pel xat de Sóc de Poble), `'rentonar'` no porta `projecte: true` i cau a la línia `295`: `if (dataMode === 'remote' && esIdDeLaLlavor({ id })) return null;`. Això fa que `contacteOrg` siga `null`, que `estatDeFormarPart` (`estatFormarPart.js:27`) retorne `'sense-xat'`, i que `BlocFormarPart.jsx:144-149` pinte el missatge bloquejant: *«Des d’ací encara no es pot arribar al xat d’esta entitat: parla directament amb qui l’administra.»* sense cap botó!
   - **Solució quirúrgica:**
     1. Tota entitat o grup resolt a `fitxaOrg` té un canal de xat vàlid: si no té `interlocutor` directe privat en remot (p. ex. entitat fundacional del Mestre com `rentonar`), s'encamina pel canal d'administració (`useXatSocDePoble`) o pel xat de comunitat de la fitxa (`rutaXatDePagina(objecteDePerfil(fitxaOrg.perfil))` → `/xat?sobre=entitat:<id>&titol=<nom>&ruta=<ruta>`).
     2. Eliminar l'estat mort `'sense-xat'` i el text `section.connectar.formarPart.senseXat` de `BlocFormarPart.jsx:144-149` i `estatFormarPart.js:19,27`: sempre hi ha d'haver botó net per obrir el xat amb qui l'administra o el canal de l'entitat.

3. **`G22-03` (P1 · Purga de `<BlocAdministrarOrganitzacio>` de `/connectar`):**
   - **Evidència al codi:** `ConnectarSection.jsx:93, 654` importa i munta `<BlocAdministrarOrganitzacio orgId={orgId} config={config} />` dins del camí `Formar part`, incrustant la reclamació i administració d'organitzacions (`TargetaAdministrar` / `useAdministrarOrganitzacio.js`) al bell mig de la pàgina de connectar.
   - **Solució quirúrgica:** Retirar l'import i el muntatge de `<BlocAdministrarOrganitzacio>` de `ConnectarSection.jsx:93, 654` (i les seues proves mock a `ConnectarSection.test.jsx:46-47` i `ConnectarSection.relacions.test.jsx:48-49`). Tota l'administració d'organitzacions i gestió de membres interns viu exclusivament al Workspace intern (`/el-meu-perfil?organitzacio=<slug>` → pestanya «Membres i connexions» de `DetallCompte.jsx` / `GestioMembres.jsx`).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes i proves en viu executades des de `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`:
1. **Inspecció empírica en viu a `http://localhost:3340` (Chrome DevTools MCP):**
   - `/pobles/la-torre-de-les-macanes`: `h1 = "Gent de La Torre"`, `.badge-row, .pill = 0`, 2 pestanyes (`"Gent de La Torre"` i `"Empreses i entitats"`, `48 px` d'alt); la 2a pestanya renderitza la targeta de **La Figuera** amb `Anar al xat` i `CONNECTAR`.
   - `/empresa/socdepoble` i `/gent/javi-llinares`: `section.sdp-pagina-peu` fora d'`<article>` (`peuInsideArticle: false`), `h2 = "El que publica ..."`, 3 pestanyes (`Mur`, `Mercat`, `Agenda`), targetes de la graella a `500×500 px` (`aspectRatio: "1 / 1"`, `objectFit: "cover"`).
   - `/notes` i `/disseny?categoria=superposicions&item=superposicions-enquadrament`: verificades les 9 proporcions (`1:1`, `original`, `4:3`, `3:2`, `16:9`, `21:9`, `4:5`, `3:4`, `9:16`), redimensionament en viu del `<canvas>` (`960×960` -> `960×411` en `21:9` -> `540×960` en `9:16`), exportació real (`1200×515 px` en `21:9`, `675×1200 px` en `9:16`), i verificació en viu de la nova barra de 9 pastilles compactes d'`IDEA-21` (`fieldsetRect: 511×104 px`, pastilles de `48 px` d'alt i didàctica dinàmica `aria-live="polite"`).
   - `/disseny?categoria=superposicions&item=superposicions-visibilitat`: verificat `SelectorVisibilitat` amb `overflow: "hidden"`, `rect: 640×709 px`, `cosScrollHeight: 498 px`, `cosClientHeight: 498 px` (**`zeroScroll: true`**).
   - Guarda vertical CSS: `.hero-image--vertical img` i `.hero-image .sdp-visor__obridor--vertical > img` computen `maxHeight: "675px"` (`min(75vh, 720px)` en finestra de `900 px` d'alt).
   - `/el-meu-perfil?organitzacio=socdepoble` i `/connectar`: vista `"Membres i connexions"` amb una sola instància de `"Veïnat connectat amb Sóc de Poble"`, i `0` ocurrències de `seguir`/`seguidors` a `/connectar`.
   - `list_console_messages`: **0 errors i 0 avisos** en totes les rutes.
2. `npm run test:precommit` -> **Codi 0** (152 fitxers / 2.959 proves Vitest + 259 proves Node, 0 fallades).
3. `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261024_2230_auditoria_gemini.md` -> **Codi 0** (`valid: true, errors: []`).
4. `node tooling/gates/porta-olivera.mjs` -> **Codi 0**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La migració `supabase/migrations/2610242320_correu_propietaria_nomes_titular.sql` (`C11-02`) està verificada al codi i a les proves estàtiques, però **pendent d'aplicar pel Mestre** a la consola de Supabase Producció.
- Per a completar l'execució d'`IDEA-21` i `IDEA-22` al pla [[261025_0045_pla_implementacio_disseny_usabilitat_dialegs]]:
  1. Unificar les pastilles compactes `.sdp-enquadrament__formats` també a la branca T46 de Notes (`DialegEnquadrament.jsx:846`, `G21-02`) i ajustar `max-height` del visor en `.sdp-enquadrament--formes` per eliminar els `52 px` d'scroll residual (`G21-01`).
  2. Estendre el contracte de `seguiments` (`contracte.js`, `localSeguiments.js`, `supabase/seguiments.js` i `2610241430_seguiments.sql`) amb `comOrgId` / `seguidor_entitat` perquè la multirepresentació d'actors B2B a `/connectar` (`G22-01`) persisteixi realment l'entitat d'origen, eliminar l'estat `'sense-xat'` de `BlocFormarPart.jsx` (`G22-02`) i retirar `<BlocAdministrarOrganitzacio>` de `ConnectarSection.jsx` (`G22-03`).
- **Higiene de processos (Zero processos zombi):** No queda cap cron, timer ni tasca en segon pla activa (`manage_task list` buit).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_2230_pla_implementacio_logica_actors_i_disseny_interior_pedra_seca]]
- [[261024_2230_prompt_claude_gemini_codex_logica_actors_i_disseny_interior_pedra_seca]]
- [[261024_2254_auditoria_codex]]
- [[261024_2315_implementacio_claude]]
- [[261025_0031_auditoria_codex]]
- [[261025_0045_pla_implementacio_disseny_usabilitat_dialegs]]
- [[261025_0045_prompt_claude_usabilitat_i_disseny_dialegs_sense_doble_scroll]]
