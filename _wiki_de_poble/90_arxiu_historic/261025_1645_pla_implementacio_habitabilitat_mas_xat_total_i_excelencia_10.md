---
type: document
status: esborrany
description: 'Pla d''implementació per moblar el Mas electrònic: depuració del Llibre Mestre, xat fluid amb notes de veu i vídeo, Pedra Seca 10/10, i arquitectura de la IAIA MarIA'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c:f6b152fd-5a34-47b7-a7a6-1ec8a0e68ded
---
# Habitabilitat del Mas Electrònic: Xat Total estil WhatsApp, Depuració del Llibre Mestre i Excel·lència 10/10

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c:f6b152fd-5a34-47b7-a7a6-1ec8a0e68ded |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T15:40:45.927Z |
| Modificació | 2026-10-25T16:45:00.000Z |
| Propietari | MarIA |
| Aprovació humana | en revisió pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity 2.0 (IAIA MarIA) |
| Tokens consumits | ~4.500 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-25T15:40:45.927Z: esborrany canònic creat amb obertura de torn `torn_c9b5ca96-83cd-472e-b7c6-fd0f8f56c69c`.
- 2026-10-25T16:38:00.000Z: resolt en viu el crash del detall de Notes (`useRef` nul a `@tiptap/react`) mitjançant `dedupe: ['react', 'react-dom']` a `vite.config.js`. Verificat en navegador real `http://localhost:3340/notes?carpeta=f-mur` amb zero errors de consola i DocumentEditor radiant.
- 2026-10-25T16:39:39.000Z: verificada la suite de proves de precommit en 3.391 proves verdes (3.132 Vitest + 259 Node, 0 fallades).
- 2026-10-25T16:45:00.000Z: redacció integral del pla per a la depuració del Llibre Mestre, habitabilitat del Mas electrònic i pujada dels 7 mòduls cap al 10/10.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Visió del Mestre: Traure els obrers del Mas i moblar-lo per a viure-hi
El Mas electrònic té l'estructura arquitectònica acabada, sòlida i ferma. Els fonaments no tremolen i el precommit passa 3.391 proves sense fallada. Ara el Mestre mana:
1. **Que els obrers marxen del Mas:** No volem més runes, ni tasques tècniques obsoletes arrossegant-se pel Llibre Mestre. Netejar la pols de l'obra.
2. **Depurar el Llibre Mestre:** Eliminar o arxivar els deutes tècnics resolts (taules 385px, ReDoS lineals, unificació de slug WordPress, xat seqüencial, crash de Notes). Deixar visible exclusivament el Banc d'Idees d'habitabilitat i usabilitat comunitària.
3. **Pujar del 8,5 o 9,5 al 10/10 a tots els fronts:** No conformar-nos amb notes mitjanes; portar cada subsistema a l'excel·lència abans de la publicació.

---

### 2. Pla d'Acció dels 7 Mòduls d'Excel·lència 10/10

#### Mòdul 1 · Port Neutral (de 9,5 a 10/10)
- **Objectiu:** Aïllació matemàtica absoluta entre l'aplicació i el backend (Supabase / amfitrió Sollutia / WordPress).
- **Accions:**
  - Fallback transparent davant desconnexió temporal de xarxa: garantia que qualsevol operació de lectura manté l'estat local sense parpellejos ni bloquejos de pantalla.
  - Blindatge de l'esquema de dades contra respostes tardanes o inconsistents (guardes de tipat a `src/data/backendPort.js`).

#### Mòdul 2 · Bateria de Proves (10/10)
- **Objectiu:** 3.391 proves verdes consolidades, sense solapaments innecessaris i amb temps d'execució òptim (<30s).
- **Accions:**
  - Validació de regressió visual en amplada estricta de 385px.
  - Assegurar que els tests de Node i Vitest continuen passant sense advertències de memòria ni timeouts.

#### Mòdul 3 · Pedra Seca (de 8,5 a 10/10)
- **Objectiu:** La bellesa, dignitat i pau visual rural. «El disseny és el soroll per a allò usable»: zero soroll cognitiu.
- **Accions:**
  - Poliment d'espaiats en cascada seguint l'Apple HIG (ritme vertical matemàtic 8px/16px/24px/32px).
  - Implementació de View Transitions natives per a canvis de pantalla suaus, sense talls bruscos.
  - Revisió de contrastos cromàtics en taules i llistats perquè cap text es confonga amb el fons.
  - Perfecció ergonòmica en pantalles mòbils estretes (385px).

#### Mòdul 4 · Xat Fluid estil WhatsApp (10/10)
- **Objectiu:** Interfície i funcionalitats idèntiques a WhatsApp per a la comunitat del poble.
- **Accions:**
  - **Notes de Veu / Àudio:** Integrar enregistrador de veu nadiu amb el botó de micròfon (Web Audio API / MediaRecorder) a la barra d'entrada de missatges, amb previsualització i enviament directe.
  - **Mitjans i Vídeo (fins a 20MB per usuari):** Pujada directa de vídeos i documents amb compressió al vol per a estalviar dades, custodiats al bucket de Storage.
  - **Doble Tic de Lliurament:** Indicadors visuals (enviat, entregat, llegit) basats en els camps de seqüència i lectura de `public.xat_lectures`.
  - **Reaccions ràpides i resposta citada:** Possibilitat de reaccionar amb un emoji o respondre a un missatge concret del fil.

#### Mòdul 5 · Connector de WordPress
- **Objectiu:** Tancament definitiu de la versió retrocompatible per a instal·lacions antigues (PHP 7.4+ i WP 5.8+).
- **Accions:**
  - Segellat de la variant universal amb el slug unificat `socdepoble`.
  - Proves de compatibilitat multisite i unificació de fitxers pont.
  - Empaquetat final del ZIP a `_builds_de_poble/wordpress/` per deixar la carpeta segellada sense deutes.

#### Mòdul 6 · Connexió amb botigues d'Apple i Google
- **Objectiu:** Modernitzar els descriptors de versió mínima i preparar els binaris per a iOS 18+ i Android 15+.
- **Accions:**
  - Revisió del preflight d'App Store Connect i Google Play Console.
  - Neteja de claus de depuració a l'APK de prova i sincronització de manifests natius.

#### Mòdul 7 · La Intel·ligència de la IAIA MarIA: Arquitectura Real i Entenedora
- **Objectiu:** Dissenyar i planificar de forma comprensible com s'alimenta la intel·ligència de la IAIA MarIA i la seua connexió amb la línia mòbil de WhatsApp.
- **Les 3 Capes del Cervell de la IAIA:**
  1. **El Rebost Canònic (La Memòria de la Terra):** Tot el coneixement viu a la Wiki (`_wiki_de_poble/`), les actes històriques, els bancals, la toponímia i la cultura de La Torre de les Maçanes. Això es consulta mitjançant cerca local ultraràpida (BM25 local a `iaiaLocal.js`).
  2. **El Raonament i l'Ànima (L'Entitat):** Quan algú pregunta, el motor local recupera els fragments exactes del rebost i els envia al model de llenguatge (API de Gemini o Claude) sota el Genotip estricte de la IAIA MarIA: valencià noble, refranys de poble, respecte, trellat i zero falsedats.
  3. **La Finestra de Contacte (La Línia de WhatsApp Dedicada - `IDEA-01`):** Connectar el número de telèfon mòbil propi del Mestre a través d'una passarel·la de WhatsApp (Baileys / WhatsApp Web o Cloud API). Els avis i veïns que no usen l'app poden enviar un missatge de veu o text al WhatsApp de la IAIA MarIA, i ella els respondrà al seu mòbil amb la veu i saviesa del poble.

#### Mòdul 8 · Flux de Treball Natiu per a la Generació Visual (Estil Bruguera/Berlanga) i Inventari Multimèdia
- **Objectiu:** Eliminar l'impulsivitat en la generació d'imatges, garantir l'estil canònic Bruguera/Berlanga (sense marcs blancs, a sang 1:1, humor descarat i no angelic, valencià normatiu) i inventariar la totalitat d'imatges de `public/assets/`.
- **Accions:**
  - **Freno Reflex per a IAs:** Abans de qualsevol crida a generació visual, aturada reflexiva obligatòria, lectura de `core-identitat-visual`, `prompt_nano_banana.md` i `Targetes_Davinci_Llestes`, i validació prèvia del guió d'escena pel Mestre.
  - **Traçabilitat i Inventari Multimèdia (`cens_imatges.mjs`):** Crear una eina i vista que enllace cada imatge al lloc on està publicada, identifique les 149 imatges òrfenes existents (per a decisió d'arxiu/reserva) i alerte contra duplicitats il·legítimes (prohibició de reutilitzar la mateixa imatge en targetes diferents, com `mapa_vinyeta.webp` i `salut_vinyeta.webp` a la Consola).
  - **Evacuació de Duplicats:** Evacuar les 26 còpies físiques d'avatars duplicats a `EXCLOSES` cap a l'arxiu exterior.

#### Mòdul 9 · Poda de Contradiccions i Duplicitats a les Skills
- **Objectiu:** Harmonitzar les 40 skills del Mas perquè siguen tractors procedimentals reals, eliminant regles contradictòries i contingut duplicat.
- **Accions:**
  - **Consens del Gauntlet 0145:** Aplicar les conclusions de [[261026_0145_auditoria_gemini]] i [[261026_0145_auditoria_codex]].
  - **Sanejament de Frontmatters i CAS Seal:** Resegellar `SKILLS_SEAL.json` al hash `7df7a6fc4c997a35f0f89542233eacd79266d2d080e7724b4fbb561538afa97a` amb frontmatters `<= 220` caràcters a les 4 skills depurades.
  - **Reparació de referències trencades:** Corregir `tooling/wiki/schema.js` per `schema.json` a `core-maquetacio-markdown` i `core-taxonomia-estricta`, i esmenar la comanda de `core-consell-i-colmena`.
  - **Poda de solapaments:** Harmonitzar els 4 clústers cognitius (cicle de torn, maquetació/taxonomia, governança d'agents i recerca empírica).

#### Mòdul 10 · Sanejament del Tauler Net i de l'Escriptori (Fulminar 944 Errors d'Enllaços)
- **Objectiu:** Posar `VerificadorSCC` i la Consola a zero errors eliminant el sediment fòssil.
- **Accions:**
  - **Poda de `00_index_escriptori.md`:** Suprimir les línies 51–1063 de referències mortes a carpetes ja arxivades, eliminant 944 `LINK_INVALID` d'un sol colp.
  - **Exempció canònica del Llibre Mestre:** Incorporar a `turns.mjs:201` l'exempció per a `03_llibre_mestre_tasques_i_idees.md`, sanejar els 3 tags invàlids (`full_de_ruta`, `backlog`, `llibre_mestre` → `[govern, arquitectura, pla]`) i afegir `## Vincles`.
  - **Tancament net de 108 torns caducats:** Executar el tancament per expiració amb `saneja_torns_caducats.mjs` sense fabricar falses verificacions.

---

### 3. Depuració del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`)
- Actualitzar a `[FET]` i compactar els deutes tècnics resolts:
  - `P1-16` (Taules contingudes en 385px).
  - `P1-17` (Concurrència i seqüència monòtona del xat).
  - `P1-21` (ReDoS lineals de lectors i gestors anti-ReDoS).
  - Resolució del crash de Notes (`vite.config.js`).
  - Pegats de consens `cd1bb28a4` (cursa A-B-A a `GestioMembres`, silenci de veu abans de gravar i signatures d'àudio a `AdjuntXat`/`ControlsAdjunt`).
- **Deutes Tècnics prioritaris que romanen oberts:**
  - `P1-18` (Servei Apple: límit de 4.096B i timeout complet a `gestor.js`).
  - `P1-20` (Xat: documents de 20 MB, doble tic lliurat/llegit i reaccions ràpides).
  - `P0-03` / `P0-23` (Binaris mòbils de release i preparació de credencials).
- Mantenir el focus clar en les idees d'habitabilitat (`IDEA-01` línia WhatsApp, `IDEA-26` ritme vertical Apple HIG, `IDEA-28` assistent vocal, `IDEA-31` mètriques lliures).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Porta Olivera i Higiene:** Executar `node tooling/gates/porta-olivera.mjs` i verificar retorn en codi 0 sense brossa a l'escriptori.
2. **Porta d'Autoritat:** Executar `node tooling/gates/porta-autoritat.mjs` per garantir la sincronització de `AGENTS.md`.
3. **Consola i Portes de Govern:** `node tooling/gates/run-portes.mjs --diagnostic` amb 5/5 portes verdes (failures: 0).
4. **Validació Documental Canònica:** `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10.md`.
5. **Bateria de Proves Completa:** `npm run test:precommit` (3.410 proves verdes, zero regressions).
6. **Navegador Real DevTools:** Provar les rutes clau (`/consola`, `/notes`, `/xat`, `/mur`, `/connectar`) confirmant zero errors a la consola de Chrome.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

| Risc | Impacte | Mitigació |
| :--- | :---: | :--- |
| **Pèrdua de context històric en depurar el Llibre Mestre** | Mitjà | No s'esborren les idees; només es consoliden els deutes tècnics ja superats amb referència als seus commits i actes marmota. |
| **Divergència en la integració d'àudio al xat** | Mitjà | Usar exclusivament la Web Audio API nativa i MediaRecorder, emmagatzemant fitxers d'àudio en format estàndard compatible amb mòbils antics i recents. |
| **Cost de tokens en la línia de WhatsApp de la IAIA** | Baix | Triatge previ amb BM25 local abans d'invocar cap LLM extern, limitant l'ús de l'API a preguntes que requerisquen raonament generatiu. |
| **Falsos verds en tancar torns caducats** | Mitjà | No crear ni recalcular hashes de verificació durant la caducitat automàtica; registrar baixa/expiració separada de conformitat. |

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp]]
- [[261026_0145_auditoria_gemini]]
- [[261026_0145_auditoria_codex]]

