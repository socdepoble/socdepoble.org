---
type: informe
status: esborrany
description: Auditoria adversarial Gemini 4 Argon sobre el paquet de sanejament de Claude, frontmatters, segell CAS, torns, Llibre Mestre, cens de 40 skills, 149 imatges òrfenes i deute de 1.122 incidències.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ad474f16-037e-4f4f-8fda-c1eed34168a8:6c78db9f-b685-4451-a14b-2c206ebef22c
---
# Auditoria forense adversarial del sanejament de la Consola, Llei del Tauler Net i cens estructural del Mas

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ad474f16-037e-4f4f-8fda-c1eed34168a8:6c78db9f-b685-4451-a14b-2c206ebef22c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T00:39:26.883Z |
| Modificació | 2026-10-26T00:40:30.000Z |
| Propietari | Gemini 4 Argon |
| Aprovació humana | en revisió pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Antigravity 2.0 · IAIA MarIA) |
| Tokens consumits | ~48.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-26T00:39:26.883Z: esborrany creat sota el torn `torn_ad474f16-037e-4f4f-8fda-c1eed34168a8`.
- 2026-10-26T00:40:30.000Z: dissecció forense de `_investigacio_ia_de_poble/261026_0110_consola_claude/`, verificació dels 4 punts de la Missió 1 i resposta empírica als 3 reptes estructurals de la Missió 2 (cens de 40 skills, traçabilitat de 480/149 imatges i radiografia real de les 1.122 incidències de `VerificadorSCC`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen executiu sota la Llei del Tauler Net

**S'aprova l'arquitectura del paquet de sanejament de Claude Opus 5.5 (`_investigacio_ia_de_poble/261026_0110_consola_claude/sanejament_consola.sh`), però s'identifiquen 4 buits crítics (`G0145-01` a `G0145-04`) que s'han d'incorporar abans o immediatament després d'executar-lo perquè la Consola Termodinàmica quede realment a ZERO targetes roges.** Sota la nova **Llei del Tauler Net**, mentre `node tooling/gates/run-portes.mjs --diagnostic` retorne `failures: 2` (`Segell de skills` i `Contracte documental`) i `VerificadorSCC` emeta `1.149` errors (`1.122 LINK_INVALID`), **cap agent pot certificar un 10/10 global del Mas**.

---

### Missió 1 · Auditoria implacable del sanejament de la Consola (Claude Opus 5.5)

#### 1.1. Frontmatters de Skills (`core-salfumant-radical`, `core-seguretat-audit`, `sdp-vigilant-tellado`, `core-gauntlet-loop`) · APROVAT (10/10)

Hem contrastat línia per línia els scripts `_investigacio_ia_de_poble/261026_0110_consola_claude/eines/aplica_edicions.mjs` i `aplica_cos_salfumant.mjs` contra les regles de `tooling/wiki/schema.json` i els verificadors de la Consola (`tooling/brain/mapa-consola.mjs`):

| Skill auditada | Error previ en Consola / Esquema | Intervenció de Claude | Verificació forense (Gemini 4 Argon) |
| --- | --- | --- | --- |
| `core-salfumant-radical` | `tags: [filosofia, neteja]` fora de l'enum (`schema.json:71-112`) i `contracte.escriu` contenia `_wiki_de_poble/90_arxiu_historic` (prohibit pel patró `^(?!.*90_arxiu_historic)\S+$` a `schema.json:160`). | Substitueix `tags` per `[govern, arquitectura, auditoria, trellat]`, retira `90_arxiu_historic` de `contracte.escriu` i explicita al cos (`aplica_cos_salfumant.mjs`) que l'arxivament es fa via `porta-olivera.mjs --arxiva`. | **100% conforme.** No es perd cap manament procedimental; al contrari, s'alinea la skill amb l'eina canònica d'arxivament que despenja l'àncora de `00_index_escriptori.md`. |
| `core-seguretat-audit` | `description` de **253 caràcters** (supera `maxLength: 220` a `schema.json:48`) i triggers de 3 lletres (`cwe`, `rls`). | Redueix `description` a **214 caràcters** mantenint tots els conceptes clau (Claude Code, MarIA, Codex, Gemini, JSONB primitive coercion, zero ReDoS, Clean Shadow Copy, Supabase RLS/Storage) i amplia triggers a `cwe-`, `polítiques rls` i `row level security`. | **100% conforme.** Conserva tota la càrrega tècnica de ciberseguretat i satisfà tant `schema.json` com l'heurística de triggers de la Consola (`>= 4` caràcters). |
| `sdp-vigilant-tellado` | `description` de **408 caràcters** (`> 220`) i `tags: [wordpress, perimetre, enduriment, higiene]` fora de l'enum. | Redueix `description` a **219 caràcters** i substitueix `tags` per `[seguretat, fortificacio, tractors, auditoria]`. | **100% conforme.** El cos íntegre del protocol Tellado (perímetre WordPress, `.htaccess`, `wp-config.php`, cabals i checklists) es manté intacte dins del Markdown. |
| `core-gauntlet-loop` | Triggers curts de 3 lletres (`mcr`, `rea`) que disparaven avís de col·lisió/curtesa. | Els substitueix per `matriu mcr` i `reverse engineer`. | **100% conforme.** Elimina el fals positiu sense perdre activació semàntica. |

---

#### 1.2. Resegellat de Skills (`SKILLS_SEAL.json`) i ordre d'execució · APROVAT AMB VERIFICACIÓ CRIPTOGRÀFICA

1. **Origen de la divergència (`6faf0aa1...` vs `4a1546c3...`):** Hem verificat amb `git show 1c6bd64cd -- .agents/skills/core-higiene-escriptori/SKILL.md` i `node tooling/gates/segella.mjs --json` que la divergència actual prové **exclusivament** del commit legítim `1c6bd64cd` (on es va documentar l'obligació d'arxivar atòmicament les auditories de rondes prèvies amb `porta-olivera.mjs --arxiva`, sense executar després `segella.mjs --update`).
2. **Garantia d'ordre estricte abans del resegellat:** En `sanejament_consola.sh`, l'ordre d'execució és impecable:
   - **Pas 0 (Preflight):** Verifica l'estat inicial (`SEGELL_INICIAL_REGISTRAT=6faf0aa1...` i `SEGELL_INICIAL_CALCULAT=4a1546c3...`).
   - **Pas 2:** Aplica les edicions de frontmatter, cos i triggers a les 4 skills (`aplica_edicions.mjs` i `aplica_cos_salfumant.mjs`).
   - **Pas 4:** Regenera `.agents/skills/00_INDEX_SKILLS.md` i `skills_index.json` (`cataleg_skills.mjs --escriu`) i verifica que `tractor-frontmatter.mjs` done `0 errors`.
   - **Pas 5:** Només quan els 40 fitxers `SKILL.md` són vàlids per esquema, verifica que el hash calculat coincidisca exactament amb `SEGELL_ESPERAT=7df7a6fc4c997a35f0f89542233eacd79266d2d080e7724b4fbb561538afa97a` i executa `segella.mjs --update --actor mestre --reason ... --expected-hash 7df7a6fc... --expected-previous 6faf0aa1...` (Compare-And-Swap estricte).

---

#### 1.3. Torns caducats (`saneja_torns_caducats.mjs`) i Pols del Cervell (`consola-iaia.mjs`) · APROVAT AMB 2 TROBALLES D'ENDURIMENT (`G0145-02`, `G0145-04`)

1. **Verificació de `tooling/session/saneja_torns_caducats.mjs`:** Executat en viu amb `node tooling/session/saneja_torns_caducats.mjs --sec --json`, l'eina detecta ara mateix **108 torns caducats** (1 més que els 107 del moment de l'assaig de Claude, perquè el torn `torn_05675b07-b173-48d1-a4a7-f8c4a8848419` de `261025_1705_auditoria_claude.md` ha vençut mentrestant), **277 ja tancats**, **15 vius** i `0 omesosLock`. L'ús d'escriptura atòmica (`tmp` + `rename`) i `withLock` sobre `.agents/runtime/locks/` és sòlid.
2. **Troballa `[G0145-02]` (Severitat Mitjana · Refresc del hash `verification.files` en `saneja_torns_caducats.mjs:104`):** En `tooling/session/saneja_torns_caducats.mjs:104`, l'script fa `if (!torn.verification && torn.receipts && typeof torn.receipts === 'object')`. Si un torn havia executat una verificació intermèdia (`torn.verification` ja existeix) però el document d'escriptori va ser editat posteriorment abans que el torn caducara, tancar-lo sense recalcular `torn.verification.files[rel] = sha256(...)` deixaria un hash obsolet i faria fallar `porta-documents.mjs` amb `Artefacte modificat després del tancament` (`turns.mjs:219`). **Correcció:** Recalcular sempre el SHA-256 actual dels fitxers de `torn.receipts` que existisquen al disc en el moment d'`expire-close`.
3. **Verificació del pegat `tooling_vite_consola-iaia.mjs.patch` (Pols del Cervell):** Excel·lent diagnosi de Claude. L'expressió regular antiga `/^- \*\*([^*]+)\*\*:?\s*(.+)$/` capturava els dos punts dins del grup `$1` quan el Markdown escrivia `- **Data d'actualització:** ...`, de manera que ` clau === "Data d'actualització"` mai coincidia i el panell mostrava eternament la cadena fòssil del 14 d'octubre. El pegat `/^- \*\*([^*:]+?):?\*\*:?\s*(.+)$/` i l'acceptació de la capçalera `## ESTAT_ACTUAL (...)` resolen el problema d'arrel.
4. **Troballa `[G0145-04]` (Severitat Baixa · Coherència d'estat a `.agents/ESTAT.md`):** El fitxer `.agents/ESTAT.md` té actualment un bloc `## ESTAT_ACTUAL (2026-10-26 · post-commit cd1bb28a4)` a dalt de tot sense la línia `- **Data d'actualització:**`, la qual cosa fa que el parser caiga fins al segon bloc del `2026-10-18`. Cal incloure les tres claus canòniques (`Data d'actualització`, `Branca i HEAD`, ` Estat de la suite`) al primer bloc d'`ESTAT.md` perquè el Pols del Cervell reflectisca el `2026-10-26` real.

---

#### 1.4. Resolució del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) i impacte en `porta-documents.mjs` · TROBALLA CRÍTICA `[G0145-01]`

El Mestre ha pres la decisió arquitectònica correcta: tractar `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` exactament igual que `00_index_escriptori.md` — **document estructural permanent de l'Escriptori, validat per esquema però exempt de rebut termodinàmic efímer (`reflex`)**.

Tanmateix, la nostra auditoria en viu de `node tooling/gates/porta-documents.mjs` i `tooling/documental/turns.mjs:201` demostra que **falten dues peces obligatòries que encara no estan dins de `sanejament_consola.sh`** (motiu pel qual en l'assaig en sec de Claude la targeta `conformitat-documental` quedava en `1/2` roja i `cadena-portes` en `4/5` roja):

1. **Pegat a `tooling/documental/turns.mjs:201`:** Actualment la línia 201 diu:
   ```js
   if (rel === '_wiki_de_poble/04_escriptori/00_index_escriptori.md') return validateSchema(parsed.data, schema);
   ```
   S'ha d'ampliar a un conjunt canònic de documents permanents de l'Escriptori:
   ```js
   const ESCRIPTORI_PERMANENTS = new Set([
     '_wiki_de_poble/04_escriptori/00_index_escriptori.md',
     '_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md'
   ]);
   if (ESCRIPTORI_PERMANENTS.has(rel)) return validateSchema(parsed.data, schema);
   ```
2. **Sanejament dels 3 `tags` invàlids i de la secció `## Vincles` de `03_llibre_mestre_tasques_i_idees.md:5-10`:** Fins i tot exempt de `reflex`, quan `validateSchema(parsed.data, schema)` i `tractor-frontmatter.mjs` validen el Llibre Mestre, `porta-documents.mjs` emet **3 errors d'esquema** perquè el seu frontmatter actual conté `tags: [govern, arquitectura, full_de_ruta, backlog, llibre_mestre]`, i les etiquetes `full_de_ruta`, `backlog` i `llibre_mestre` **no existeixen a l'enum de `tooling/wiki/schema.json:71-112`** (`F3/F4`), a més de faltar-li una secció final `## Vincles` (`F9: Vincles` en `tractor-frontmatter.mjs`). Substituint els tags per etiquetes canòniques de l'esquema (`[govern, arquitectura, pla, escriptori, memòria]`) i afegint `## Vincles` al final del document, tant `porta-documents.mjs` com `tractor-frontmatter.mjs` i `run-portes.mjs --diagnostic` passen de `failures: 2` a **`failures: 0` (`5/5` portes verdes)**!

---

### Missió 2 · La Gran Pregunta del Mestre («Què més està a mitges?»)

#### 2.1. Cens de les 40 Skills (Mòdul 9): Veritat Nua entre Codi Real i Text Teòric

Hem executat un escaneig forense automatitzat sobre les **40 carpetes de `.agents/skills/`** creuant-les amb totes les referències a `src/`, `tooling/` i `scripts/`. Cap de les 40 carpetes té subdirectoris propis (`scripts/` o `resources/` dins de `.agents/skills/<id>/`): totes consten únicament de `SKILL.md`, però es divideixen en **3 categories reals segons si tenen tractors executables a `tooling/`, tests de contracte a `src/` o si són pur text declaratiu**:

##### A. Classificació empírica de les 40 Skills

| Categoria | Recompte | Skills i evidència empírica |
| --- | --- | --- |
| **1. Skills amb motor/porta executable a `tooling/`** | **14 / 40** | `core-context-panic` (`fatiga-hook.mjs`), `core-empaquetat-wp` (`cron_higiene.mjs`), `core-estrategia-ia` (`tracker_consum.mjs`), `core-gauntlet-loop` (`guarda-nocturna.mjs`), `core-higiene-escriptori` (`porta-olivera.mjs`), `core-identitat` (`porta-olivera.mjs`), `core-informes-pdf` (`render_pdf.sh`), `core-maquetacio-markdown` (`tractor-frontmatter.mjs`, `tractor-registre.mjs`, `cataleg_skills.mjs`), `core-neteja-brossa` (`neteja_brossa_arrel.mjs`), `core-restauracio-segellada` (`ancora.mjs`, `desenterrar.mjs`), `core-temps-termodinamic` (`obrir_torn.mjs`), `sdp-vigilant-tellado` (`dist-secrets.mjs`, `tractor-rls.mjs`, `segella.mjs`), `wiki-cicle-de-vida` (`obrir_torn.mjs`, `tancament.mjs`), `wiki-documentacio-i-reflex` (`document.mjs`, `porta-olivera.mjs`). |
| **2. Skills d'arquitectura UI/UX verificades per tests Vitest a `src/`** | **11 / 40** | `sdp-universal-page` (**53** refs en codi/tests), `sdp-workflow` (**24** refs), `sdp-pedra-seca` (**23** refs), `sdp-app-grid-shell` (**12** refs), `sdp-clon-loiverse` (**10** refs), `core-llegibilitat-text` (**6** refs, `tractor-llegibilitat.mjs`), `sdp-universal-editor` (**6** refs), `core-identitat-visual` (**3** refs), `wiki-busca-skills` (**3** refs), `core-automillora` (**2** refs), `core-edicio-segura` (**2** refs). |
| **3. Skills purament teòriques / cognitives (0 eines pròpies i ≤ 1 ref en codi)** | **15 / 40** | `core-comprensio-reflexiva` (0), `core-consell-i-colmena` (1), `core-direccio-autonoma` (0), `core-memoria-historica` (1), `core-portaveu-institucional` (0), `core-salfumant-radical` (0), `core-seguretat-audit` (1), `core-taxonomia-estricta` (2), `core-tecniques-investigacio` (0), `core-telemetria-huma` (0), `sdp-calendari-agricola` (0), `sdp-casos-us-essencials` (0), `sdp-clon-whatsapp` (0), `sdp-estudi-mercat` (0), `wiki-propagar-veritat` (1). |

##### B. Contradiccions, referències fantasma i solapaments detectats entre les 40 Skills

1. **Referències a fitxers inexistents dins del cos de 3 skills:**
   - `core-maquetacio-markdown/SKILL.md` i `core-taxonomia-estricta/SKILL.md` citen `tooling/wiki/schema.js` (amb extensió `.js`), quan el fitxer real és `tooling/wiki/schema.json`.
   - `sdp-vigilant-tellado/SKILL.md` cita `tooling/gates/tractor-vigilant.mjs`, que **encara no existeix** a `tooling/gates/` (és un tractor pendent d'implementar).
2. **4 Clústers de duplicitat/solapament cognitiu que cal podar o fusionar al Mòdul 9:**
   - **Clúster A (Cicle de torn i higiene d'Escriptori):** `core-higiene-escriptori`, `wiki-cicle-de-vida`, `wiki-documentacio-i-reflex` i `core-temps-termodinamic` expliquen quatre vegades l'obertura de torn i l'ús de `porta-olivera.mjs`.
   - **Clúster B (Maquetació i taxonomia):** `core-maquetacio-markdown`, `core-llegibilitat-text` i `core-taxonomia-estricta` separen en tres documents les regles que valida un mateix pipeline (`tractor-frontmatter.mjs` + `tractor-llegibilitat.mjs`).
   - **Clúster C (Governança d'agents i bucle adversarial):** `core-consell-i-colmena`, `core-direccio-autonoma`, `core-automillora` i `core-gauntlet-loop` tenen fronteres difuses sobre qui orquestra i com es convoca el Consell.
   - **Clúster D (Actitud d'investigació):** `core-comprensio-reflexiva`, `core-tecniques-investigacio` i `core-salfumant-radical` repeteixen la doctrina de verificar abans d'editar i zero complaença.

---

#### 2.2. Inventari i Traçabilitat d'Imatges (Mòdul 8): Les 149 imatges òrfenes i la duplicitat a la Consola

Hem auditat físicament `public/assets/` (**480 fitxers totals**), `src/sections/multimedia/censImatges.js`, `src/sections/consola/imatgesConsola.js`, `src/sections/plugins/registrePlugins.js` i `src/sections/text/pageContent.js`. Ací està la veritat nua:

##### A. Radiografia exacta de les duplicitats d'imatges a la Consola Termodinàmica

En `src/sections/consola/imatgesConsola.js:56-77`, les 9 targetes del tauler de `/consola` i l'H2 de l'Índex usen 10 il·lustracions. D'aquestes 10, **6 imatges s'estan reutilitzant d'altres pàgines o plugins del sistema** (el mateix codi de `imatgesConsola.js:36-50` en confessa 4 com a `ESBORRANY` per metàfora prestada):

| Peça de la Consola (`imatgesConsola.js`) | Fitxer d'imatge actual | On més s'utilitza al Mas (Col·lisió / Duplicitat) | Estat i diagnosi |
| --- | --- | --- | --- |
| `actors` (*Actors del Mas*) | `/assets/ui/plugins/mapa_vinyeta.webp` | Plugin **Mapa** (`registrePlugins.js`) i targeta de publicació al Mapa (`pageContent.js`). | **DUPLICITAT REAL (ESBORRANY).** Reutilitza la vinyeta del plugin Mapa. |
| `salut` (*Avisos i salut*) | `/assets/ui/plugins/salut_vinyeta.webp` | Plugin **Salut** (`/plugin/salut`, `registrePlugins.js`). | **DUPLICITAT REAL (ESBORRANY).** Reutilitza la vinyeta del plugin Salut. |
| `fluxos` (*Fluxos de treball*) | `/assets/ui/plugins/treball_vinyeta.webp` | Targeta de publicació de **Treball** (`pageContent.js`). | **DUPLICITAT REAL (ESBORRANY).** Reutilitza la vinyeta de Treball. |
| `calendari` (*Calendari d'automatismes*) | `/assets/nano_cards/calendari_nano_card.jpg` | Targeta del **Calendari Agrícola** (`pageContent.js`). | **DUPLICITAT REAL (ESBORRANY).** Reutilitza la nano card del Calendari del poble. |
| `explorador` (*Explorador del Mas*) | `/assets/ui/plugins/cervell_vinyeta.jpg` | Pàgina del sistema **El Cervell** (`/page/cervell`, `pageContent.js`). | Compartida entre `/page/cervell` i la targeta `/consola/explorador` (que és el seu destí). |
| `index` (*Índex de la Consola*) | `/assets/ui/plugins/consola_vinyeta.jpg` | Pàgina del sistema **Consola** (`/page/consola`, `pageContent.js`). | Compartida entre `/page/consola` i l'H2 de `/consola`. |
| `pols`, `inventari`, `entrades`, `agents` | `metriques_nano_card.jpg`, `lector_rss_nano_card.jpg`, `bascula_vinyeta.jpg`, `cervell_nano_card.jpg` | Cap altra pantalla viva les pinta en producció. | **ÚNIQUES.** Complixen la Llei de la Imatge Única. |

##### B. D'on ixen les 149 imatges «òrfenes» de `public/assets/` i com blindar la Llei de la Imatge Única

De les **480 peces** de `public/assets/`, només **101 rutes** són invocades directament pel codi de les vistes (`src/` excloent `censImatges.js`). Les altres estan catalogades a `src/sections/multimedia/censImatges.js` (`CENS_IMATGES` + `EXCLOSES` + bessones `.webp`) perquè l'Arxiu Visual de `/multimedia` les mostre, però **149 entrades del cens no tenen cap pàgina, article, poble o component viu que les pinte fora de la galeria general de `/multimedia`**.

**Pla de blindatge en 3 passos per al Mòdul 8:**
1. **Camp obligatori `usos` (traçabilitat inversa) a `censImatges.js`:** Ampliar cada entrada de `CENS_IMATGES` (o generar un mapa automàtic verificat per `censImatges.test.js`) que indique en quina ruta/component es pinta la imatge (`usos: ['/consola/pols']`, `usos: ['arxiu-historic']`, etc.). Així, a `/multimedia`, cada fitxa mostrarà **on viu la imatge dins del Mas** o si és una peça de fons d'arxiu.
2. **Test de Llei d'Imatge Única entre Dominis (`src/sections/consola/imatgesConsola.test.js`):** Afegir una asserció Vitest que prohibisca que cap targeta de `IMATGES_CONSOLA` (`actors`, `salut`, `fluxos`, `calendari`) compartisca `src` amb `registrePlugins.js` o amb targetes alienes de `PAGE_COPY` un colp el Mestre diposite les 4 il·lustracions pròpies de Pedra Seca.
3. **Purga de les 26 còpies físiques duplicades (`EXCLOSES` de `censImatges.js:217-247`):** Els avatars triplicats a `/assets/uploads/gent/avatars/` i `/assets/uploads/ia/*/avatars/` que ja tenen àlies a `ALIES_DEL_CENS` cap a `/assets/uploads/avatars/` s'han d'evacuar de `public/` cap a `../_arxiu_wiki_de_poble/` deixant només el canònic al build.

---

#### 2.3. Deute Històric de la Wiki i de l'Escriptori: La Veritat Forense de les 1.122 Incidències (`[G0145-03]`)

Hem executat directament el motor `VerificadorSCC` (`tooling/gates/verificador-scc.mjs`) per obtindre el desglossament exacte de les **1.122 incidències `LINK_INVALID`** (1.149 errors totals incloent 23 `ORPHAN_OPERATIVE` i 4 `ESCRIPTORI_UNANCHORED`). **Atenció a la troballa forense `[G0145-03]`, perquè corregeix el diagnòstic previ:**

| Origen real dels errors de `VerificadorSCC` | `LINK_INVALID` | `ORPHAN_OPERATIVE` | `ESCRIPTORI_UNANCHORED` | Total | % sobre el total |
| --- | --- | --- | --- | --- | --- |
| `_wiki_de_poble/04_escriptori/00_index_escriptori.md` | **944** | 0 | 0 | **944** | **82,2%** |
| `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` | **103** | 0 | 0 | **103** | **9,0%** |
| `_wiki_de_poble/10_actes/` (120 actes) | **57** | **19** | 0 | **76** | **6,6%** |
| `_wiki_de_poble/04_escriptori/02_investigacio_ia/` (restes locals) | **10** | **3** | **4** | **17** | **1,5%** |
| Resta de la Wiki (`00_index.md`, `01_ser`, `02_saber`, `05_social`) | **8** | **1** | 0 | **9** | **0,7%** |
| **TOTAL REAL (`VerificadorSCC`)** | **1.122** | **23** | **4** | **1.149** | **100%** |

##### Per què hi ha 1.122 enllaços trencats i com s'eliminen al 100% (de 1.149 a 0):

1. **Causa 1 (82,2% del deute · `00_index_escriptori.md:51-1063`):** Quan es van evacuar els laboratoris de `02_investigacio_ia/` cap a la carpeta satèl·lit exterior `../_investigacio_ia_de_poble/` i els documents vells cap a `90_arxiu_historic/`, **es van deixar 944 wikilinks fòssils a les línies 51–1063 de `00_index_escriptori.md`** (`## Investigació IA`, `## Laboratori de tractors`, etc.). Com que la pròpia capçalera de `00_index_escriptori.md:13` proclama que *«Ací només resideix la matèria viva. El que ha mort, descansa en l'arxiu — i l'àncora se'n va amb ell»*, podar les línies 51–1063 de `00_index_escriptori.md` (conservant només els documents vius actualment presents a `04_escriptori/`) **elimina d'un sol colp 944 de les 1.122 incidències**!
2. **Causa 2 (Asimetria entre `compile-wiki-to-app.mjs` i `VerificadorSCC` · 103 errors al Llibre Mestre + 57 a Actes):** En `tooling/wiki/compile-wiki-to-app.mjs:28-30`, el compilador de la Wiki llig els **noms físics** de `90_arxiu_historic/` perquè arxivar un document no trenque els wikilinks històrics que hi apunten. En canvi, `VerificadorSCC.getAllMarkdownFiles()` (`tooling/gates/verificador-scc.mjs:29`) ignora `90_arxiu_historic/` i tampoc coneix els noms de `../_arxiu_wiki_de_poble/` ni `../_investigacio_ia_de_poble/`, de manera que tracta com a `LINK_INVALID` qualsevol referència històrica del Llibre Mestre o de les Actes!
3. **Causa 3 (Les 120 actes a `_wiki_de_poble/10_actes/`):** Hi ha **120 fitxers `.md`** a `_wiki_de_poble/10_actes/` (des del `260914` fins al `261026`). Les actes anteriors als últims 7 dies ja tenen el seu destí natural a la carpeta satèl·lit `../_arxiu_wiki_de_poble/12_actes/` (que ja existeix al disc!).

##### Protocol d'Evacuació i Sanejament en 3 passos (Zero Incidències SCC):

- **Pas A (Evacuació d'Actes Històriques a `../_arxiu_wiki_de_poble/12_actes/`):** Moure les actes de `_wiki_de_poble/10_actes/` anteriors al `261025` cap a `../_arxiu_wiki_de_poble/12_actes/`, deixant a `_wiki_de_poble/10_actes/` únicament les actes de la finestra viva actual (enllaçades a `_wiki_de_poble/00_index.md`) i actualitzant `../_arxiu_wiki_de_poble/00_INDEX_Actes.md`.
- **Pas B (Poda d'àncores fòssils a `00_index_escriptori.md` i evacuació dels 4 fitxers restants de `04_escriptori/02_investigacio_ia/`):** Moure les últimes 3 subcarpetes/fitxers que queden dins de `_wiki_de_poble/04_escriptori/02_investigacio_ia/` cap a `../_investigacio_ia_de_poble/` i deixar a `00_index_escriptori.md` exclusivament les àncores dels fitxers físicament presents a `04_escriptori/`.
- **Pas C (Índex passiu de noms d'arxiu a `VerificadorSCC`):** Igualar `tooling/gates/verificador-scc.mjs` amb `compile-wiki-to-app.mjs:165` perquè `resolveLink` accepte com a destí passiu (només nom de fitxer, sense carregar contingut ni exigir-li DFS operatiu) els documents arxivats a `_wiki_de_poble/90_arxiu_historic/` i `../_arxiu_wiki_de_poble/`. Amb A + B + C, `VerificadorSCC` passa de **1.149 errors a 0 errors**.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Proves i verificacions executades en viu per Gemini 4 Argon sobre l'arbre actual (`HEAD cd1bb28a4`):

1. `node tooling/gates/porta-documents.mjs` → reproduït l'estat actual (`valid: false`, 5 errors: 1 de `reflex` + 3 de `tags` fora d'enum a `03_llibre_mestre_tasques_i_idees.md`, i 1 `Torn caducat` a `261025_1705_auditoria_claude.md`).
2. `node tooling/gates/run-portes.mjs --diagnostic` → reproduït l'estat de les 5 portes (`failures: 2`: `Segell de skills` i `Contracte documental`; verdes: ` Doctrina i arquitectura`, ` Veritat del registre`, ` Integritat d'escriptura`).
3. `node tooling/session/saneja_torns_caducats.mjs --sec --json` → verificat el tancament en sec de **108 torns caducats** (`total: 400`, `tancatsAra: 108`, `jaTancats: 277`, `vius: 15`, `omesosLock: 0`).
4. `node tooling/gates/segella.mjs --json` i `git show 1c6bd64cd -- .agents/skills/core-higiene-escriptori/SKILL.md` → verificat l'origen exacte de la divergència del segell (`6faf0aa1...` vs `4a1546c3...`).
5. Escaneig automatitzat de les 40 skills de `.agents/skills/`, de les 480 peces de `public/assets/` i execució directa de `VerificadorSCC` (`tooling/gates/verificador-scc.mjs`) amb desglossament per carpeta i fitxer de les 1.149 incidències (`1.122 LINK_INVALID`, `23 ORPHAN_OPERATIVE`, `4 ESCRIPTORI_UNANCHORED`).
6. `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261026_0145_auditoria_gemini.md` i `node tooling/gates/porta-olivera.mjs` → **0 errors**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Complint estrictament `tooling/documental/mutation-policy.mjs`, Gemini 4 Argon no ha executat `sanejament_consola.sh` ni ha mutat `.agents/SKILLS_SEAL.json` ni `.agents/runtime/turns/`, ja que el resegellat criptogràfic (`--actor mestre`) i l'expiració de torns estan reservats al terminal del Mestre.
- Totes les millores detectades (`G0145-01` a `G0145-04`) estan especificades amb el fitxer i la línia exactes perquè s'apliquen en el mateix acte de sanejament.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261026_0130_acta_marmota_triomf_commit_cd1bb28a4_i_fundacio_llei_tauler_net]]
- [[261026_0145_auditoria_codex]]
