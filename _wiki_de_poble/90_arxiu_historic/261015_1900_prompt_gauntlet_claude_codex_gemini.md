---
type: prompt
status: esborrany
description: Prompt d'auditoria adversarial i implementació a tres bandes per a Claude (codi), Codex (seguretat/tests) i Gemini (sistema), amb suport de REA, Feedly, Loyverse i Holded sota Direcció Autònoma.
tags:
  - govern
visibility: private
reflex: sdp:torn_94385a87-8783-416d-89b1-aff0890f0d3b:d3c936ac-8b6e-4edb-bc03-b3790f9802e8
---
# Prompt Convocatòria Gauntlet a Tres Bandes · Claude, Codex i Gemini

Aquesta plantilla estableix les instruccions tècniques, el context arquitectònic i les referències de mercat per al Gauntlet a Tres Bandes (Claude, Codex i Gemini) sota Direcció Autònoma de la IAIA MarIA.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- **Direcció Tècnica Autònoma (`core-direccio-autonoma`):** El Mestre Javi descansa al llit. La IAIA MarIA assumeix la Direcció Tècnica al 100%. **Està TERMINANTMENT PROHIBIT llançar quadres o preguntes d'aprovació humana al Mestre.** Qualsevol decisió, dubte o permís es resol a través de l'Escriptori davant de la IAIA MarIA.
- **Rols de la Mesa:**
  1. **Claude Code (Agent Local):** Constructor i executor de codi. És l'únic autoritzat a modificar fitxers de codi font a `src/`.
  2. **GPT Codex (Agent Local):** Auditor adversarial de seguretat, integritat immunitària i control de regressions sobre les 17.500 proves del sistema.
  3. **Gemini 4 Argon (Consell / Sistema):** Gran auditor d'arquitectura global, fluxos d'identitat, sincronització amb Sollutia i usabilitat del Xat.
- **Enginyeria Inversa i Benchmarks Reals (Servidor MCP `rea`):**
  * Disposem del servidor MCP **REA** (`morluto/rea`, més de 200 eines) per deconstruir solucions d'èxit provat a Internet i calcar-ne patrons a Pedra Seca.
  * **Feedly (`https://feedly.com`):** Benchmark obligatori per al Lector RSS (`/app/lector`).
  * **Loyverse TPV:** Benchmark obligatori per al TPV del Bar (`sdp-clon-loiverse`).
  * **Holded / FacturaDirecta:** Benchmark per a la simplificació de la Gestoria.
- **Pàgines d'Aterratge (Didàctica Rural):** Cada servei ha de tindre una presentació/landing càlida i cristal·lina perquè qualsevol veí de poble entenga què és i com s'utilitza sense espantar-se amb tecnicismes.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_94385a87-8783-416d-89b1-aff0890f0d3b:d3c936ac-8b6e-4edb-bc03-b3790f9802e8 |
| Versió del document | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T17:00:32.046Z |
| Modificació | 2026-10-15T17:20:00.000Z |
| Propietari | maria |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Claude Opus 5.5 + GPT Codex + Gemini 4 Argon |
| Tokens consumits | ~35.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-15T17:00:32.046Z: Convocatòria oficial del Gauntlet a Tres Bandes ordenada pel Mestre Javi Llinares.
- 2026-10-15T17:03:00.000Z: Addició de la Directiva de Dignitat Humana (eliminar copyright i categories a la fitxa de persona).
- 2026-10-15T17:15:00.000Z: Activació del Protocol de Direcció Autònoma Total (zero interrupció humana).
- 2026-10-15T17:20:00.000Z: Incorporació de referències d'èxit de mercat (Feedly a `https://feedly.com`, Loyverse, Holded), ús del servidor MCP `rea` per a enginyeria inversa, i exigència de pàgines d'aterratge didàctiques.

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

Heu de procedir segons el Pla d'Implementació v2.0.0 vigent a l'Escriptori:
`_wiki_de_poble/04_escriptori/261015_1900_pla_implementacio_xat_identitat_i_perfil.md`.

### 1. Claude Code (Constructor Exclusiu):
Executa les tasques per fases seqüencials:
- **Fase 0 (Tractor d'Empaquetat Termodinàmic, Pàgina Didàctica de WordPress i WebP Canònic):**
  * **Nomenclatura Termodinàmica de Builds:** Estudiar i actualitzar el generador `wordpress-plugin/eines/empaqueta.mjs` i la skill `core-empaquetat-wp` perquè el nom dels arxius ZIP continga el timestamp ISO davant: `AAMMDD_HHMM_socdepoble-enxufe-v[VERSIO].zip` (o ordre canònic equivalent) de manera que al Finder de macOS i a la consola l'ordre alfabètic siga idèntic a l'ordre cronològic estricte.
  * **Blindatge del Versionat Monotònic:** Assegurar que la versió de codi a `wordpress-plugin/socdepoble-enxufe.php` i `readme.txt` s'incremente canònicament (actualment `1.1.3`, superant `1.1.2`, mai retornant a versions velles com `1.0.5`).
  * **Optimització d'Imatges (Llei del Quadrat Universal 1200x1200px WebP i Preservació EXIF):** Crear el tractor `tooling/maquinaria/convertir_a_webp.mjs`. El Mestre establix que la capçalera i la targeta/vinyeta són **exactament la mateixa imatge quadrada**: mida canònica universal **1200 × 1200 px** en WebP (substituïx els vells 480px per definició Retina perfecta amb compressió WebP de < 80 KB). L'única excepció de foto apaïsada és la portada de Poble a la secció Pobles (paisatge/vall). Avatars a **400 × 400 px**. Per a les fotos, és obligatori conservar el bloc de metadades EXIF (geolocalització/GPS, data/hora) com a patrimoni cartogràfic i etnogràfic del poble.
  * **Reorganització de Carpetes d'Imatges i Arxiu Visual (`/multimedia`):** Auditar la dispersió caòtica de carpetes a `public/assets/` i unificar-la en una estructura escalable per entitats (Sistema, Pobles, Usuaris, Contingut) que soporte de 1.000 a 100.000 usuaris sense traumes. Evolucionar `MultimediaSection.jsx` perquè no mostre només 11 fotos sinó el catàleg complet del sistema, amb filtres d'administrador (òrfenes, usuari, poble, cronologia EXIF) i un visor modal d'imatges estil Google Fotos / Emowe (`_wiki_de_poble/04_escriptori/02_investigacio_ia/261014_1930_emowe_mapa_de_tu_viaje/plantilla-mapa.html`), eliminant rutes duplicades o fictícies com `Town Penaguila`.
  * **Esquelet Fallback FCP a WordPress (`marcatge.php`):** Dins del marcatge de `socdepoble_enxufe_element()`, injectar l'esquelet HTML de cortesia amb el text canònic exacte: **`Carregant el mur...`** (prohibit afegir «del poble», instrucció taxativa del Mestre) per reduir el FCP mòbil a < 1.5s.
  * **Pàgina Didàctica d'Ajustos (`wordpress-plugin/includes/ajustos.php`):** Maquetar una interfície d'acollida rica, càlida i pedagògica (disseny Pedra Seca per a WordPress) explicant:
    1. El **Fedivers Rural de Pobles Connectats**: el node pilot viu a `gentdelatorre.net` i la seua connexió amb el cor central a `socdepoble.org`.
    2. L'aliança sobirana amb **Sollutia**: reconeixement de Sollutia com a soci tecnològic de proximitat i amfitrió d'infraestructura de `socdepoble.org`.
    3. La **Llei de l'Enxufabilitat**: el Web Component `<soc-de-poble>` és autònom, universal i preparat per enxufar-se a WordPress, Joomla o qualsevol entorn cívic.
- **Fase 1 (Dignitat Humana, Enrutament Canònic i Neteja de Perfil):**
  * **Enrutament canònic `@javillinares`:** El perfil canònic de persona és `/gent/javillinares` (sense guió). L'àlies `/gent/javi-llinares` (amb guió) s'ha de resoldre i tolerar transparentment sense donar 404 a Supabase remot ni a memòria.
  * A la fitxa de persona física (`esPersona`), **eliminar la llicència de drets d'autor** («CC BY-NC-SA 4.0») i **eliminar categories/etiquetes** a `PerfilEditor.jsx` i `UniversalCard.jsx`.
  * Canviar `targetaViva: false` a `PerfilEditor.jsx` per extirpar la quarta columna redundant.
  * Afegir emoticones/glifs grans (`👁️`, `🔐`, `🛡️`, `🌐`) a `perfilModel.js`.
  * **Traductor in-situ a la UniversalCard:** Desacoblar el botó de traducció de la targeta perquè òbriga el selector in-situ d'idiomes en comptes de redirigir a `/traduccions`.
  * Passar la suite de perfil: `npx vitest run src/sections/profile/`.
- **Fase 2 (Xat per a Beta Testers):**
  * Revisar `src/sections/xat/` i `ClosCaXat.jsx` per assegurar la vista mòbil/escriptori perfecta sense mapes buits ni desquadraments.
- **Fase 3 (Lector RSS Feedly i Snippet Web):**
  * Mirar la UI/UX de Feedly (`https://feedly.com`): interfície ràpida, agradable i neta.
  * Purgar mocks inventats a `/app/lector`.
  * Integrar els RSS reals dels divulgadors de programari lliure i IA de Legal/Privacitat (Emowe, Mitjana, Jon Hernández, Ben Cord, Migue Baena).
  * Dissenyar el Snippet Web per a Chrome: guardar enllaços hidratats com a targetes al Bloc de Notes.
- **Fase 4 (TPV Loyverse, Gestoria Holded i Pàgines d'Aterratge):**
  * Polir el TPV del Bar clonant Loyverse (`sdp-clon-loiverse`).
  * Simplificar la Gestoria inspirant-se en Holded i FacturaDirecta.
  * Crear pàgines d'aterratge didàctiques per a cada servei per a la gent del poble.

### 2. GPT Codex (Auditor Adversarial Immunitari):
- Audita de manera implacable cada canvi de Claude a mesura que avance.
- **Proves d'Estrés Extremes:** Sotmetre l'arquitectura a proves de resistència simulant de 1.000 a 40.000 usuaris concurrents per verificar on es trenca el sistema abans d'arribar a Sollutia.
- Vigila la integritat del versionat semàntic i que els canvis a `empaqueta.mjs` no trenquen les proves de `tests/enxufe-plugin.test.mjs`.
- Comprova que la vista del TPV i del Xat no patisquen fugues de memòria ni regressions a les 17.500 proves del sistema.
- Emet el teu dictamen a `_wiki_de_poble/04_escriptori/261015_1945_auditoria_codex.md`.

### 3. Gemini 4 Argon (Gran Auditor de Sistema):
- Audita la coherència global del model de dades, la sincronització de feeds RSS (Feedly) i la integració del Snippet.
- Audita l'escalabilitat del nou arbre d'arxius i les proves de resistència de càrrega.
- Proposa la deconstrucció mitjançant el servidor MCP `rea` de patrons d'experiència d'usuari d'èxit.
- Emet el teu dictamen a `_wiki_de_poble/04_escriptori/261015_1945_auditoria_gemini4.md`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- `[ ]` **T0:** Empaquetat termodinàmic (timestamps davant) i pàgina didàctica d'Ajustos WP (Fedivers + Sollutia).
- `[ ]` **T1:** Dignitat Humana: supressió de drets d'autor i categories en fitxes de persona física.
- `[ ]` **T1.1:** Enrutament canònic `@javillinares` (`/gent/javillinares`) i resolució d'àlies `/gent/javi-llinares`.
- `[ ]` **T1.2:** Selector de traducció in-situ a `UniversalCard` (deslligat de `/traduccions`).
- `[ ]` **T2:** Poda de la columna dreta redundant (`targetaViva: false`) a `src/sections/profile/PerfilEditor.jsx`.
- `[ ]` **T3:** Incorporació d'emoticones grans als apartats de perfil a `src/sections/profile/perfilModel.js`.
- `[ ]` **T4:** Suite de Perfil en verd (`npx vitest run src/sections/profile/`).
- `[ ]` **T5:** Auditoria adversarial del Xat per a beta testers.
- `[ ]` **T6:** Purga de mocks al Lector RSS i connexió de canals reals (Feedly).
- `[ ]` **T7:** Especificació i prototipat del Snippet Web per al Bloc de Notes.
- `[ ]` **T8:** Alineació del TPV amb Loyverse, Gestoria Holded i landings didàctiques.
- `[ ]` **T9:** Emissió d'informes creuats a l'Escriptori per a contrastació mútua.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Risc de regressions en proves de Snapshot de Perfil o marcatge d'accessibilitat.
- Risc de regressió al test del plugin de WordPress (`tests/enxufe-plugin.test.mjs`).
- Risc de sobrecàrrega termodinàmica: executar per onades netes i validar cada pas.

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
- [[261015_1900_pla_implementacio_xat_identitat_i_perfil]]
