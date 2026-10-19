---
type: document
status: esborrany
description: Pla per a retirar 10_metriques cap a arxiu, podar el laboratori 02_investigacio_ia i dissenyar el catàleg 20_capacitats Matrix
tags:
  - implementacio
visibility: private
reflex: sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:0f35429c-ac1b-4fe8-bd66-2a1ca53d8191
---
# Pla d'Arquitectura Capacitats Matrix i Poda de 10_metriques

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:0f35429c-ac1b-4fe8-bd66-2a1ca53d8191 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T17:56:46.512Z |
| Modificació | 2026-10-18T19:58:00.000Z |
| Propietari | Maria |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity 2.0 (MarIA) |
| Tokens consumits | 16200 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-10-18T19:58:00Z:** Redacció inicial del pla a partir de les reflexions i indicacions d'àudio del Mestre Javi Llinares:
  1. Anàlisi i resolució de l'anomalia taxonòmica de `10_metriques` (col·lisió de prefix amb `10_actes`, 3 fitxers de consum de setembre ja consumits i superats per la Consola Termodinàmica). Trasllat net cap a `_arxiu_wiki_de_poble/10_metriques`.
  2. Poda de laboratori a `_wiki_de_poble/04_escriptori/02_investigacio_ia` (traslladar 35 subcarpetes d'experiments de Claude de setembre/octubre cap a `_arxiu_wiki_de_poble/02_investigacio_ia/` per mantindre el laboratori viu i lleuger).
  3. Naixement del directori **`20_capacitats`** (Catàleg Matrix d'eines externes d'IA): reservar prefixos 1-10 per al cor humà, institucional i social del poble; a partir del prefix 20 obrir la catalogació tecnològica d'IA modular (superpoders a demanda com `googleworkspace/cli`, REA, motors OSINT/dades, sense embossar el context de treball).
- **2026-10-18T20:02:00Z:** Ampliació crítica encomanada pel Mestre Javi (Àudio 20:01):
  4. **Auditoria d'Allotjament Gràfic i Enxufe WP Lleuger:** El ZIP actual de WordPress pesa 135 MB perquè arrossega tota la carpeta de fotos pesades (`DSC00410.JPG` de 6.6MB, etc.) dins de `dist/assets/uploads/`. Cal blindar la descàrrega des de Supabase Storage / CDN extern perquè el ZIP del connector quede en 2-4 MB sense trencar cap imatge.
  5. **Arquitectura de Xarxa Social Rural Tipus Obsidian (Anti-Facebook):** Blindar la integritat del graf. Una pàgina o targeta és una entitat única i canònica al Supabase de Sóc de Poble; en compartir-se o comentar-se es vincula a la mateixa instància, evitant la duplicació caòtica de Facebook.
  6. **Convocatòria a Tres Bandes:** Claude Code, Gemini i GPT Codex per al consens arquitectònic.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **Anomalia de `10_metriques`:** Creada a finals de setembre de 2026 per a un seguiment rústic de consum en CSV (`consum_ia.csv`) i dos gràfiques estàtiques (`11_grafica_consum.md`, `12_esforc_huma_sessions.md`). Actualment la telemetria real viu a `.agents/.diari_sessio.jsonl` i a la Consola Termodinàmica (`tooling/vite/consola-iaia.mjs`). A més, comparteix el prefix `10_` amb `10_actes`, creant confusió al sistema.
- **Saturació de `02_investigacio_ia`:** Conté 35 subdirectoris antics de Claude (`260924_1410_tractors_claude`, `260924_1505_tractor_plantilles_claude`, etc.) que ja van ser integrats o superats. Mantindre'ls a l'Escriptori carrega innecessàriament les cerques i auditories.
- **Nou Paradigma Matrix (`20_capacitats`):** El Mestre proposa que les eines i recursos potents que anem descobrint (com la CLI oficial de Google Workspace `gws`, el motor REA, NotebookLM, scripts d'anàlisi, etc.) no queden oblidats en missatges de xat ni embossen el cervell de les IAs amb documentació massiva. Es crea un catàleg sintètic (fitxes d'1 pàgina) dins de la Wiki (`20_capacitats/`), mentre que els codis font pesats, repositoris clonats o binaris resideixen a les carpetes satèl·lit de `Som de Poble` (`_investigacio_ia_de_poble/`, `_recursos_de_poble/`).
- **El pes del connector WP (135 MB) vs Supabase Storage:**
  L'anàlisi de `dist/assets` revela que 137 MB són arxius multimèdia en brut dins de `dist/assets/uploads/poble/` i `dist/assets/uploads/empresa/` (ex. `DSC00410.JPG` de 6.6MB, `DSC00320.JPG` de 6.1MB). Quan abans es va excloure aquest directori, les imatges es trencaven perquè el codi resolia rutes relatives locals en lloc de resoldre-les mitjançant el client de Supabase Storage. Cal auditar i implementar un resolutor universal de mitjans (`mediaResolver.js`) que carregue d'arxiu remot (CDN de Supabase Storage) amb fallback robust.
- **Xarxa Social Tipus Obsidian:**
  L'arquitectura ha de garantir que cada pàgina, botiga, associació o targeta és un node singular al graf de Supabase. Res de duplicar continguts com fa Facebook. Qualsevol interacció, compartició o comentari ocorre sobre el mateix node original.

---

### 2. Canvis Concrets per Fitxers i Carpetes

#### Fase 1: Arxivament de `_wiki_de_poble/10_metriques`
- **[Acció: MOVE]** Moure el directori `_wiki_de_poble/10_metriques/` sencer a `../_arxiu_wiki_de_poble/10_metriques/`.
- **[Acció: MODIFY] `_wiki_de_poble/00_index.md`**
  - Eliminar les línies de vincles cap a `10_metriques/11_grafica_consum.md` i `10_metriques/12_esforc_huma_sessions.md`.
  - Afegir el vincle al nou directori `20_capacitats/00_index_capacitats.md`.
- **[Acció: MODIFY] `tooling/wiki/compiler/01_build_index.mjs`**
  - Retirar `'10_metriques'` de `carpetesIncloses` i afegir `'20_capacitats'`.
- **[Acció: MODIFY] `tooling/brain/tracker_consum.mjs`**
  - Ajustar `CSV_PATH` o documentar que el consum canònic és el diari de sessió de la consola termodinàmica.
- **[Acció: BUILD]** Executar `npm run prebuild` (o `node tooling/wiki/compiler/01_build_index.mjs`) per regenerar `src/data/wikiManifest.js` net d'orfandats.

#### Fase 2: Poda de `_wiki_de_poble/04_escriptori/02_investigacio_ia`
- **[Acció: MOVE]** Traslladar les 35 subcarpetes consumides de Claude (sprints de setembre i principis d'octubre) cap a `../_arxiu_wiki_de_poble/02_investigacio_ia/`.
- **[Acció: KEEP]** Conservar a `02_investigacio_ia/` únicament els documents i informes vius de recerca recent (Kowalski Apple Design, bandomovil, destil, etc.).

#### Fase 3: Naixement de `_wiki_de_poble/20_capacitats`
- **[Acció: NEW] `_wiki_de_poble/20_capacitats/00_index_capacitats.md`**
  - Índex general del Catàleg Matrix de Recursos i Capacitats d'IA.
  - Taula de recursos disponibles, disparadors, comandes d'activació i nivell d'impacte en el poble.
- **[Acció: NEW] `_wiki_de_poble/20_capacitats/261018_recurs_google_workspace_cli.md`**
  - Fitxa tècnica sintètica de `googleworkspace/cli` (`gws` en Rust).
  - Capacitats: 40+ skills JSON per a automatitzar correus d'associacions, formularis, taules de Google Sheets per a censos agraris i documents de poble sense dependre de la web ni de pestanyes obertes.
  - Ubicació del repositori/binari pesat: `../_investigacio_ia_de_poble/googleworkspace-cli/`.
- **[Acció: NEW] `_wiki_de_poble/20_capacitats/261018_recurs_rea_reverse_engineering.md`**
  - Fitxa tècnica sintètica del motor REA (*Reverse Engineer Anything*) i les seues eines MCP.
  - Ús per a extracció de fidelitat visual i funcional de referències reals (patró WhatsApp, TPV Loiverse, etc.).
- **[Acció: NEW] `_wiki_de_poble/20_capacitats/261018_recurs_notebook_lm_memoria.md`**
  - Fitxa d'integració de Google NotebookLM com a cervell de memòria a llarg termini i assimilació d'actes per a la humanització de la IAIA MarIA.

#### Fase 4: Auditoria d'Allotjament d'Imatges, Conversió WebP i Desacoblament de l'Enxufe WP (Àudios 20:01 i 20:26)
- **[Acció: AUDIT]** Analitzar com `src/data/backendPort.js`, `PerfilModel.js` i els components resolen les imatges.
- **[Acció: TRACTOR WEBP]** Integrar al flux de migració el tractor existent `tooling/media/optimitzar_webp.mjs` (`npm run media:webp`). La conversió automàtica a `.webp` (màx. 1600px, qualitat 84, preservant EXIF) redueix un 96% del pes (ex. `DSC00410.JPG` de 6.720 KB baixa a 291 KB). Tota foto que s'incorpore a Supabase Storage o a la xarxa s'optimitza en WebP per garantir que la xarxa social cresca de forma lleugera i sense trencar-se.
- **[Acció: ARCHITECTURE]** Dissenyar l'estratègia perquè el build de WordPress (`npm run build:wp`) excloga les fotos gegants de proves locals (`public/assets/uploads/poble/` i `public/assets/uploads/empresa/`), delegant la càrrega a Supabase Storage públic, reduint el ZIP a menys de 5 MB.

#### Fase 5: Multimèdia Incrustat per Actor i «Google Fotos Rural» (Àudios 20:16 i 20:34)
- **[Acció: CENTRALITZACIÓ I INCRUSTACIÓ]** 
  - La lògica completa de l'arxiu multimèdia no només viu a `/multimedia` (SISTEMA), sinó que **s'incrusta directament a la pestanya «Multimèdia» del gestor de perfils** (`#el-meu-perfil` / `DetallMultimedia.jsx`).
  - No volem una vista amputada amb només l'avatar: l'usuari/administrador ha de tindre el seu àlbum complet de fotos disponible dins del seu espai de treball.
- **[Acció: SEPARACIÓ D'AUTORIES PER ACTOR (ROLS I ÀMBITS)]**
  - **Persona (Javi Llinares):** La pestanya Multimèdia mostra totes les fotos pujades o pertanyents a Javi Llinares.
  - **Empresa / Grup (Sóc de Poble, Rentonar):** La pestanya Multimèdia mostra totes les fotos, productes i materials gràfics de l'entitat.
  - **Agent IA (IAIA MarIA):** La pestanya Multimèdia mostra totes les il·lustracions, vinyetes i recursos visuals generats per la IAIA MarIA.
- **[Acció: VISOR I ACCIONS D'EDICIÓ]** En clicar sobre qualsevol imatge de la graella, s'obri el visor complet (`VisorDeLArxiu`) amb les seues dades EXIF, resolució i data, afegint les accions de perfil: «Posa com a avatar», «Posa com a capçalera» i «Elimina».
- **[Acció: PROTECCIÓ RELACIONAL D'ESBORRAT]** Abans d'eliminar una imatge, el sistema comprova si està en ús en alguna publicació (mur, article, fitxa de perfil, comerç).
  - Si està associada: Diàleg d'avís clar: *«Atenció: aquesta imatge està en ús a [Nom de la publicació / fitxa]. Si l'esborres, la publicació quedarà sense imatge. Vols canviar-la per una altra o conservar-la?»*.
  - Si és d'arxiu i no està en ús: Es pot esborrar amb seguretat i rapidesa.
- **[Acció: HIGIENE DE FÒSSILS DE DISSENY]** Purgar o actualitzar del cens les captures antigues que ja no corresponen a la realitat (p. ex. `2-sidebar.png` amb versió fòssil v10.38.20 i botó obsolet «+ CONNECTAR»), assegurant que al manual de disseny (`src/sections/disseny/`) figure la barra lateral viva i canònica.

#### Fase 6: Unificació Editorial del Mercat i Selector de Variants (Àudio 20:22)
- **[Acció: UNICITAT DE PRODUCTE]** Rectificació de trellat: un producte del Mercat és un únic node i una única Card canònica al graf. **NO es fa una Card per a cada variant** (color/model), ja que fragmentaria el catàleg.
- **[Acció: PURGA D'ESTILS INVENTATS]** Retirar de `detailSectionMeta.jsx` el xoriço vertical de targetes duplicades centrades (on es repetia la foto, "Edició Gris Plom", el venedor, el preu i el botó "Afegeix al cabàs" per a cada variant).
- **[Acció: MAQUETACIÓ EDITORIAL PEDRA SECA]** Aplicar la jerarquia estricta del sistema de disseny:
  1. Portada amb el **Carrusel dinàmic** complet (amb les 8 fotos reals, sense textos estàtics com «Quatre fotos»).
  2. Títol H2 canònic i **entradilla** inferior (no paràgrafs solts ni textos centrats arbitraris).
  3. Descripció del producte integrada en la graella editorial.
  4. **Selector de Variants compacte** (píndoles o botons selectors d'edició: *Gris Plom*, *Verda Pi*, etc.) que actualitza l'estat i la foto activa.
#### Fase 7: Usabilitat d'Enquadrament d'Avatar i Neteja Visual (Àudio 20:36)
- **[Acció: NETEJA DE MOGOLLÓ VISUAL]** Retirar de sota l'avatar a `PerfilEditor.jsx` la llista de botons repetitius i textos tècnics («Avatar», «Llevar l'avatar», «PNG, JPEG o WebP, fins a 10 MB»). Deixar només el cercle net de l'avatar amb la icona de càmera.
- **[Acció: INTERACCIÓ EN UN SOL CLIC]** En fer clic damunt de l'avatar (o de la capçalera), s'obri directament el quadre d'ajust i enquadrament (`DialegEnquadrament`) carregant la imatge que ja hi ha.
- **[Acció: REDIMENSIONAMENT I REENQUADRAMENT REUTILITZABLE]** L'usuari ha de poder desplaçar i fer zoom (amb lliscador o roda del ratolí) sobre la imatge existent per engrandir-la o quadrar-la (com en el cas de la IAIA MarIA per evitar que es veja el marc quadrat de la il·lustració), i desar l'enquadre sense haver de tornar a pujar el fitxer.
- **[Acció: OPCIONS INTEGRALS DINS DEL QUADRE]** Dins del propi quadre d'ajust s'agrupen: «Canviar foto» (obre l'input de fitxers), «Llevar avatar», informació de formats admesos i «Guardar enquadre».

---

### 3. Repartiment de Rols en el Trio d'IAs (MarIA + Claude + Gemini + Codex)

1. **MarIA (Antigravity):**
   - Directora Tècnica, govern del BIOS, custòdia de la Wiki i vigilància higiènica de les portes de qualitat (Olivera, Plantilla Viva, Orfandat).
2. **Claude Code (Constructor de Frontend / Executor Local):**
   - Implementació de la interfície i lògica interactiva a `src/sections/multimedia/` (`MultimediaSection.jsx`, `VisorDeLArxiu.jsx`, diàleg de confirmació/avís).
   - Neteja de captures obsoletes al cens de mitjans i actualització de l'espècimen de la barra lateral al catàleg de disseny.
   - Execució de la bateria de tests a la consola local.
3. **GPT Codex (Auditor de Backend, Supabase i Integritat de Dades):**
   - **Contracte d'ús de mitjans:** Dissenyar la funció/contracte per determinar si un mitjà està associat a taules de dades (posts, profiles, events, mercat) per alimentar l'avís de seguretat.
   - **Desacoblament del ZIP de WP:** Dissenyar la resolució d'imatges via Supabase Storage CDN per alliberar els 135 MB del paquet.
   - **Model Graf Obsidian:** Validar la unicitat de nodes a Supabase, garantint una xarxa social resilient anti-Facebook.
4. **Gemini 4 Argon High (Auditor Adversarial i Enginyeria Inversa de Capacitats):**
   - **Auditoria adversarial:** Revisar a fons el codi de Claude per detectar regressions, fuites de memòria o vulnerabilitats.
   - **Enginyeria Inversa REA:** Analitzar patrons de referència (WhatsApp, Google Photos, Google Workspace CLI) per redactar les fitxes d'1 pàgina de `20_capacitats/`.

---

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Porta Olivera:** Executar `node tooling/gates/porta-olivera.mjs` i comprovar sortida amb codi 0.
2. **Porta Orfandat:** Executar `npm run porta:orfandat` per verificar que no queda cap enllaç trencat ni orfe amb la retirada de `10_metriques`.
3. **Porta Teixit:** Executar `npm run porta:teixit` per validar la coherència del graf de la Wiki.
4. **Bateria de Tests:** Executar `npm test` per assegurar que la retirada d'aquests fitxers no afecta la suite de 687 tests de l'aplicació.
5. **Consola de Consum:** Comprovar que la Consola Termodinàmica (`tooling/vite/consola-iaia.mjs`) arrenca i llegeix correctament sense errors.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc de pèrdua de dades històriques:** **Nul**. Tota informació que s'evacua es trasllada de manera íntegra a `_arxiu_wiki_de_poble/`, respectant la Llei de la Memòria Física i la prohibició de destrucció cega.
- **Risc de trencar enllaços interns de la Wiki:** Controlat mitjançant la revisió prèvia amb `grep_search` i la validació estricta de `porta:orfandat`.
- **Risc de sobrecàrrega de context:** **Mitigat**. El disseny de `20_capacitats` es basa en fitxes sintètiques d'1 pàgina; els binaris i fitxers pesats es mantenen fora del repositori d'aplicació, a les carpetes satèl·lit germanes.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[20_capacitats/00_index_capacitats]]
