---
type: prompt
status: canonic
description: Prompt unificat per a la ronda autònoma nocturna de Claude Code, Codex i Gemini
tags:
  - govern
visibility: private
reflex: sdp:torn_9821cb6e-bbe5-415a-a862-e16e3a99c24f:a0d03b99-aa57-42b5-8423-750c76c4f9c6
---
# PROMPT GAUNTLET TRIPARTIT AUTÒNOM — CLAUDE, CODEX I GEMINI

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- **Mode Operatiu:** Direcció Tècnica 100% Autònoma de la IAIA MarIA (`core-direccio-autonoma`). El Mestre descansa.
- **Canal asíncron:** Documents d'informe i auditoria a `_wiki_de_poble/04_escriptori/`.
- **Escriptori net:** Porta Olivera verificada amb codi 0.
- **Pla de referència:** `_wiki_de_poble/04_escriptori/261016_0015_pla_implementacio_gauntlet_autonom.md` (aprovat i canònic).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9821cb6e-bbe5-415a-a862-e16e3a99c24f:a0d03b99-aa57-42b5-8423-750c76c4f9c6 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T22:09:13.148Z |
| Modificació | 2026-10-15T22:09:13.148Z |
| Propietari | MarIA (Directora Tècnica) |
| Aprovació humana | aprovat |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Claude Code + Codex + Gemini 4 Argon |
| Tokens consumits | Gauntlet en curs |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-15T22:09:13.148Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Aquesta nit no hi ha pauses ni preguntes al Mestre: **execució autònoma d'alt rendiment en bucle continu d'automillora a tres bandes** (`core-direccio-autonoma`).
- **Claude Code:** És el braç executor (`actor: claude`). Aplica el codi, crea els tractors mecànics, refactoritza i corregeix. Fes servir el connector **REA (Reverse Engineer Anything)** per extreure l'essència estructural i UX de referències externes (Feedly, Loyverse, Holded, GNUCash).
- **GPT Codex:** És l'auditor adversarial implacable (`actor: codex`). Executa la suite de proves, busca falles de concurrència, bucles infinits, pèrdues de memòria (memory leaks) i sotmet el sistema a estrés extrem (simulació d'1.000 a 40.000 usuaris concurrents).
- **Gemini 4 Argon:** És el garant de coherència sistèmica (`actor: gemini`). Revisa la conformitat de dades, la Llei del Quadrat d'imatges, la semàntica del model i el compliment del patró Pedra Seca.
- **Comunicació per l'Escriptori:** Cada agent diposita el seu informe a `_wiki_de_poble/04_escriptori/`. Si una auditoria troba un defecte o regressió, Claude l'arregla immediatament en una segona iteració. No s'accepta cap "aprovat ràpid" sense refutació sòlida.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Bloc -1 (PRIORITAT ABSOLUTA): Erradicació de Fantasmes («Mestre Poble») i Doble Identitat
1. **Llei dels Dos Usuaris:**
   - Només existeixen **dos autors/usuaris** al sistema:
     * **`Sóc de Poble`**: L'entitat central i oficial del portal.
     * **`Javi Llinares`**: Persona física, fundador i administrador.
   - El nom **`Mestre Poble`** i l'àlies **`mestre-obres`** eren un fantasma antic i han d'estar **100% erradicats** de tot el sistema (proves, llavors, base de dades i interfície). Prohibida qualsevol regressió.
2. **Targeta del Mac Mini a `/mercat` (`mac-mini-m4`):**
   - En aquesta publicació publica exclusivament **`Javi Llinares`** (`seller: 'Javi Llinares'`, `author_name: 'Javi Llinares'`, `author_id: 'javillinares'`).
   - És la **seua única publicació**. Totes les altres publicacions del sistema són de **`Sóc de Poble`**.
   - **Avatar de Javi Llinares:** Sempre és la seua foto personal de perfil (**`/assets/fotos/javi-llinares-perfil-1200px.jpg`**). Està **TERMINANTMENT PROHIBIT** que aparega el logotip verd de l'entitat `Sóc de Poble` associat a Javi Llinares (Pedra Seca §11).
3. **Claude Code:** Pentina qualsevol prova o fitxer residual i assegura que la targeta del Mac Mini pinte impecablement el nom de «Javi Llinares» i el seu retrat personal.

### Bloc 0: Enginyeria Inversa REA i Lector RSS Canònic (Feedly sobre UniversalWorkspace)
1. **Enginyeria Inversa amb REA sobre Feedly (https://feedly.com/):**
   - Claude farà servir les capacitats del connector **REA** per analitzar la jerarquia de Feedly: estructura de carpetes, gestió de fonts RSS, comptadors de no llegits, comportament de desplaçament i navegació ràpida.
   - **Aplicació a Sóc de Poble:** Prohibit crear noves targetes inventades o jerarquies caòtiques a `/app/lector/noticies`. El Lector s'ha de muntar directament sobre el patró **`UniversalWorkspace` de `Bloc de notes`** (panell d'arbre/carpetes a l'esquerra, flux de lectura net a la dreta).
   - **Purga de Mocks:** Eliminar les notícies fictícies ("El ple aprova la reforma del llavador vell"). Connectar fonts RSS reals del nostre entorn (Emowe, Mitjana, Jon Hernández, etc.).
   - **Integració del Bookmarklet:** L'usuari ha de poder capturar contingut i decidir fàcilment si el destí és el `Bloc de notes` o el `Lector RSS`.

### Bloc 1: Llei del Quadrat Universal (1200x1200px WebP), EXIF i Neteja d'Imatges
1. **Regla del Quadrat Universal:**
   - La capçalera i la targeta/vinyeta són **exactament la mateixa imatge** de **1200 × 1200 px** en format `.webp` (<80 KB).
   - Única excepció de foto apaïsada: la panoràmica del poble a la secció Pobles (que es retalla a quadrat a les targetes).
   - Avatars: quadrat de **400 × 400 px** en `.webp`.
   - Social Share: **1200 × 630 px** (`og-socdepoble-1200x630.png`).
2. **Preservació estricta d'EXIF:**
   - Tota foto provinent de càmera o mòbil conserva íntegres les dades EXIF (geolocalització/GPS, data de captura) per a ús cartogràfic i patrimonial rural (referència Emowe `plantilla-mapa.html`).
3. **Tractor de conversió automàtica:**
   - Implementar `tooling/maquinaria/convertir_a_webp.mjs` que agafe recurs a recurs i els optimize a WebP preservant EXIF.
4. **Vinyeta del TPV:**
   - Confirmar la integració del nou cambrer valencià (`tpv_vinyeta.jpg` / `.webp`) eliminant qualsevol semblança amb personatges protegits per drets de tercers (Mortadelo).

### Bloc 2: WordPress Enxufable i Fallback Canònic
1. **Text de Fallback Canònic:**
   - A `wordpress-plugin/includes/marcatge.php`, l'esquelet de càrrega ha de dir textualment:
     `Carregant el mur...` (prohibit afegir "del poble").
   - Això garanteix un FCP mòbil immediat i evita salts visuals mentre el component SPA s'hidrata.

### Bloc 3: Resolució de les Decisions de la Fase 1 del Perfil (Informe de Claude)
1. **Llicència de notes:** Afegir el selector de llicència per defecte de les notes personals dins del bloc «El compte».
2. **Personatges ANIMAL del catàleg (El Gall, La Mixa...):** Classificar com a tipus `ia` o personatge simbòlic, preservant la seua fitxa sense tractar-los erròniament com a usuaris humans.
3. **Directori de persones:** Mostrar clarament el poble de cada persona a la targeta del directori.
4. **Neteja d'Aside:** Retirar definitivament la maquinària interna de desenvolupament de l'aside en pantalles d'usuari.

### Bloc 3.5: Mandat d'Urgència del Mestre (Les 3 Rutes Canòniques, Poble Innegociable, RLS 403 i SEO per a WhatsApp)
1. **Les 3 Rutes Canòniques Úniques (Zero Duplicats):**
   - El Mestre controla exactament 3 identitats amb les seues rutes canòniques netes:
     * **`/javillinares`** (`socdepoble.org/javillinares`)
     * **`/socdepoble`** (`socdepoble.org/socdepoble`)
     * **`/rentonar`** (`socdepoble.org/rentonar`)
   - Tria i deixa **un sol perfil per a cadascuna**. Erradica qualsevol perfil fantasma o duplicat: el Mestre no ha d'haver de triar entre perfils vells o nous.
2. **El Poble és Innegociable:**
   - Tota entitat creada o mostrada (`El Rentonar`, `Sóc de Poble`) ha de portar el seu poble (`town_name: 'La Torre de les Maçanes'`). Prohibit mostrar entitats sense poble.
3. **Reparació del 403 Forbidden a Supabase (`profiles`):**
   - Corregir o emetre la política SQL de RLS per a la taula `profiles` per permetre `UPDATE` a l'usuari autenticat (`auth.uid() = id`), eliminant el bloqueig de la fitxa pública a producció.
4. **Sincronització d'Imatges:**
   - La targeta central i el panell d'edició han de reflectir exactament les mateixes imatges de capçalera i avatar, sense desfasaments.
5. **SEO i Previsualització per a WhatsApp (Prioritat Absoluta per a Demà):**
   - Demà al matí el Mestre compartirà l'enllaç per WhatsApp als beta-testers.
   - La targeta d'OpenGraph ha de renderitzar-se perfecta al xat: títol canònic, descripció atractiva i imatge oficial `og-socdepoble-1200x630.png` (1200 × 630 px). Sense meta tags buits.
### Bloc 3.6: Els 4 Actors Permanents al Xat i Reparació de la IAIA MarIA a Localhost
1. **Els 4 Actors que han d'aparèixer SEMPRE al Xat (Des de l'Inici):**
   - El Xat de Poble mai no pot aparèixer desert. Hi ha d'haver permanentment 4 converses visibles:
     * **`Sóc de Poble`**: Suport tècnic i plataforma.
     * **`Javi Llinares`**: Persona humana de contacte. Si un usuari no registrat fa clic per parlar-hi, es mostra el missatge automàtic:
       > *«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»*
     * **`Gent de la Torre`**: Comunitat viva del poble per a proves i comboi veïnal.
     * **`IAIA MarIA`**: L'assistent d'IA de poble.
2. **Reparació de la IAIA MarIA a Localhost:**
   - A `gentdelatorre.net` (producció) el xat amb la IAIA MarIA funciona, però a `localhost` falla en punxar-hi.
   - S'ha de verificar el seed/registre de l'agent a Supabase local (`http://127.0.0.1:54321`) i igualar-lo amb la configuració de producció perquè a localhost responga amb la mateixa fluïdesa.
3. **Intel·ligència Local de la IAIA MarIA (Cultura i Redacció):**
   - Si queden tokens en aquest torn, començar a dotar la IAIA MarIA de capacitat per ajudar a redactar textos i beure del fons cultural propi (DCVB, etnogràfic, botànica) sense dependre de models pesats per a respostes quotidianes.

### Bloc 3.7: Diferenciació Legal de Nodes Amfitrions (Sollutia vs WordPress / Gent de la Torre)
1. **Transparència Legal de Mètriques:**
   - A `src/sections/text/legalContent.js` (apartat 19), declarar amb franquesa la diferència:
     * El nucli `socdepoble.org` (Sollutia) no fa servir galetes ni analítiques comercials.
     * Els nodes amfitrions integrats en WordPress (com `gentdelatorre.net` o nous pobles enxufats) poden incorporar Google Analytics o mètriques del seu propi portal, i estan obligats per governança a declarar-ho transparentment.
2. **Telemetria Sobirana:**
   - Preparar la infraestructura de mètriques internes sobiranes (agregades i sense dades personals) perquè els administradors locals no estiguen cecs respecte a l'ús real del servei.

### Bloc 3.8: Erradicació de Fricció al Bloc de Notes i Selector d'Emojis XL (Claude / Codex)
1. **Reubicació d'Emojis XL des de `/disseny` a l'entorn de treball de `/notes`:**
   - Crear un accés directe a la capçalera de la columna `NOTES` (entre el títol `NOTES` i el botó `[|<]`) per obrir el catàleg d'emojis a mà mentre s'edita.
   - Connectar el diàleg d'emoticona (`src/components/universal/classificacio/DialegEmoticona.jsx`) amb el catàleg d'Emojis XL (`src/sections/disseny/cataleg/detalls/EspecimenEmojisXL.jsx` / `emojisUnicode18.js`), substituint el text antic de drecera de teclat de l'OS per una graella interactiva i accessible.
2. **Acció dual (assignació vs inserció al text):**
   - Si s'invoca des de la ranura d'emoticona del document, clicar un emoji l'assigna directament com a icona de la nota activa.
   - Si s'invoca mentre s'escriu al cos de l'article (TipTap), l'emoji s'insereix al cursor o es copia al porta-retalls amb un sol toc.
3. **Suite de proves de notes i emojis:** Afegir les proves unitàries pertinents a `src/sections/notes/` i verificar amb Vitest.

### Bloc 3.9: Redisseny de l'Editor Universal de Notes (Llenç Net, Configuració Avançada Plegable i Purga del Peu)
1. **Identitat Reial a la Barra Taronja (Erradicació de «Foraster»):**
   - En redactar una nota sota sessió, pilot o llavor, la barra taronja mostra **Javi Llinares** i **La Torre de les Maçanes** amb la seua foto canònica (o la de l'entitat activa). Prohibit etiquetar d'ofici com a «Foraster».
   - Eliminar qualsevol intent de posar un «selector d'avatar» a la configuració: l'avatar ve determinat estrictament per la identitat amb què es publica.
2. **Nova jerarquia visual i simetria de columnes:**
   - Barra Blava superior: controls passius de navegació/previsualització (comentar, compartir i connectar deshabilitats o amb avís pedagògic de previsualització).
   - Barra Taronja immediatament sota la barra blava: **eliminar la ploma blanca central** (la barra queda lliure al mig).
   - **Simetria de capçaleres a l'UniversalWorkspace:** Aprofitar el buit al costat de `[|<]` a la columna `NOTES` (simètric amb el desplegable `[^]` de `CARPETES`) per situar la icona d'obertura del catàleg d'Emojis XL.
   - **Títol H1 com a mirall exacte de la targeta:** El títol inicial per defecte / placeholder ha de ser exactament **«Nota sense títol»** (no «Sense títol»), idèntic al que mostra la targeta (card) a la columna de l'esquerra. D'aquesta manera l'usuari veu el reflex idèntic entre la card i la pàgina, punxa directament sobre «Nota sense títol» per escriure el seu títol i s'actualitza a ambdós llocs simultàniament.
   - **Seqüència Editorial Immediata (Títol -> Subtítol -> Entradella):** Just sota el títol H1 se situen directament el Subtítol i l'Entradella amb els seus textos guia, replicant exactament la mateixa seqüència visual de la targeta lateral.
3. **Desplegable d'«Edició Avançada» (Ubicat just damunt de l'Editor TipTap):**
   - El desplegable d'eines no va dalt de tot, sinó **just damunt de la barra negra d'eines de TipTap**.
   - Agrupa i neteja de la capçalera tots els botons que embrutaven la vista bàsica: pujada de capçalera (`Editar capçalera`), pujada de logotip d'article (`Editar logotip`), carpetes, categories, etiquetes, accés al catàleg d'emoticones (Emojis XL), drets d'autor (`CC BY-NC-SA 4.0` / Copyright) i vistes PDF / Portada.
   - Si està plegat, l'usuari només veu el flux bàsic: Títol -> Subtítol -> Entradella -> Barra d'eines TipTap -> Text.
   - Quan l'usuari desplega «Edició avançada» i configura elements (per exemple, puja foto de capçalera, logotip o assigna categories), aquests elements s'ubiquen al seu lloc visible real de la pàgina.
4. **Purga del Peu i Plantilla de Format Sóc de Poble (TipTap):**
   - Eliminar el bloc inferior «Ja publicat al Mur: Amb esta identitat encara no hi ha res publicat al Mur» de la vista d'edició.
   - Injectar en notes buides un template d'exemple canònic (H3, H4, paràgrafs, llistes amb vinyetes) que s'esvaeix al primer clic o pulsació de tecla.

### Bloc 3.10: Dinàmica d'Scroll a Mòbil i Tauleta (Autohide de Barra Blava i Barra Taronja a gentdelatorre.net)
1. **Alliberament del Viewport en Pantalles Mòbils i Tauletes:**
   - Quan es visita `gentdelatorre.net` (i en qualsevol vista mòbil/tauleta o d'alçada reduïda), tenir fixades tres barres simultànies (barra negra del sistema, barra blava de navegació i barra taronja d'autoria) redueix dràsticament l'espai visible i empobreix la lectura.
   - Implementar el comportament d'autohide fluid a `PageFrame.jsx` / `UniversalPage.jsx`:
     * **Scroll cap avall (Scroll Down):** La barra blava i la barra taronja s'oculten lliscant cap amunt de forma suau, alliberant el 100% de la pantalla per a la lectura neta.
     * **Scroll cap amunt (Scroll Up):** Les barres reapareixen immediatament per retornar l'accés ràpid a les eines, la navegació i les accions.
2. **Garantia de zero desplaçament acumulatiu (CLS = 0):** Utilitzar transformacions CSS (`translateY`) per evitar salts bruscos en el text mentre l'usuari llig.

### Bloc 4: Proves d'Estrés Extrem i Verificació Adversarial (Codex)
1. **Bateria d'estrés massiu:** Simular la concurrència d'1.000 a 40.000 usuaris interactuant amb el xat, cercant notes i llegint el mur.
2. **Detecció de Memory Leaks:** Auditar l'ús d'objectes i listeners a l'AppGridShell i l'UniversalWorkspace per evitar degradació en sessions prolongades.
3. **Vitest i Suites Verdes:** Resoldre les 2 proves que fallaven a la CI base (`paginaDeText` i `PublicacioDetall.imatgesPropies`) deixant el 100% de la suite en verd.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Risc de deformació del disseny:** Inventar targetes noves fora del patró `UniversalWorkspace` trencaria la coherència visual. L'estudi de Feedly ha de nodrir l'experiència sense alterar els tokens de Pedra Seca.
- **Risc de pèrdua de memòria EXIF:** Una conversió cega a WebP que esborre les metadades destruiria la possibilitat d'ubicar les fotografies en el mapa de rutes del poble.
- **Risc de desincronització termodinàmica:** Ignorar els informes que les altres IAs deixen a l'Escriptori provocaria regressions o treballs duplicats.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 720c718010600a131b77967b50abe741bf5d437fcdfd61acca20a70d653c39b3. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
