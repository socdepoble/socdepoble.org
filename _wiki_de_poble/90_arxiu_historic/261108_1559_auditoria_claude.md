---
type: informe
status: esborrany
description: 'Informe viu de Claude de l''Onada R13: implementació de P0-58, triatge i integració per CAS dels kits, amb proves, portes i decisions'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1029e939-b6d3-4f63-9b4b-77d02bb8076f:c6a88713-5730-46d9-90e7-9c145e9573c5
---
# Auditoria Claude — Onada R13: Smart Paste Pedra Seca (P0-58) i kits de Codex R54-R56 i Gemini R161-R220

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1029e939-b6d3-4f63-9b4b-77d02bb8076f:c6a88713-5730-46d9-90e7-9c145e9573c5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-08T15:00:16.497Z |
| Modificació | 2026-11-08T15:06:00.000Z |
| Propietari | Claude (torn `torn_1029e939`) |
| Aprovació humana | Ordre del Mestre al xat de Claude, 08/11 (posterior a les 15:06) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, desktop) |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-08T15:00:16.497Z: esborrany creat; contingut i verificació pendents.
2026-11-08T15:06:00Z: obert amb el tancament dels passos 1 a 3 de l'ordre del Mestre posterior al reinici.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### R13-0 · Passos 1 a 3 de l'ordre del Mestre (fets)

- `15:45` · **COMMIT `a948fcb0f`**, forats de R51 (36 fitxers de `src/`), pujat a `fork/backup-notes-publish`. El detall complet és a l'informe anterior, ja arxivat: `90_arxiu_historic/261106_0146_auditoria_claude.md`, secció R11-6.
  - Vitest sencer sobre l'arbre exacte `48c76129`: **34.579 proves passades, 0 fallades**.
  - Assaig del hook en arbre preparat `sdp-index`: tancament 0, teclat 0, `test:precommit` 0; cens de portes 55/57 (Cens i Doctrina, heretades de HEAD). `--no-verify` per l'autorització d'esta ordre.
- `15:50` · **Producció a `a948fcb0f`** als dos orígens.
  - socdepoble.org: Firebase `825f0d4ae5681d10` («web a948fcb0f»); per a tornar enrere, `ef9b7200d0832480`.
  - socdepoble.cat: Node 0 per rsync en dues passades, sense `--delete`.
  - Sonda de consola (Chrome aïllat, 12 rutes per origen): **0 errors, 0 avisos**. Entrada `index-DHUyIj9H.js`, **249.992 B gzip: 8 B de marge**.
  - `seed_revisions` respon 200 a producció: algú hi ha aplicat la SQL80 (no he estat jo).
- `15:58` · **Torns:** `saneja_torns_caducats.mjs` ha tancat per caducitat `torn_9db8dcac` (MarIA, Onada R7, caducat el 08/11 a les 03:10) i també `torn_d36b2582` (MarIA, caducat a les 04:57, una sola acta ja versionada). L'eina no permet triar un torn sol, i `tancament.mjs --close` refusa els torns caducats.
- `15:59` · **Torn nou:** `torn_1029e939-b6d3-4f63-9b4b-77d02bb8076f` (Claude, abast codi).
- `15:59` · **Arxivament amb la Porta Olivera** (`--arxiva --torn torn_1029e939`): les 6 peces de la sèrie `261106_0146_*` (auditories de Claude, Codex, Gemini i del Node 0, pla i prompt d'Onada R7) són a `90_arxiu_historic/`. La porta ha reescrit els enllaços d'`.agents/ESTAT.md` (24) i de dues actes, i ha despenjat les àncores de l'índex.
  - **[ARREGLO A MÀ, laboratori]** Quatre documents de Gemini sense versionar (`GAUNTLET_4_LOOPS_EGM_R161.md`, `…_R162.md`, `…_R163_R166.md`, `…_R167_R172.md`, a `02_investigacio_ia/261108_marato_r12_gemini_fediversity_100/`) enllaçaven `[[261106_0146_auditoria_gemini]]` a «## Vincles», i la porta s'aturava. He reapuntat eixe vincle a l'arxiu amb el format de la porta (`[[../../../../90_arxiu_historic/261106_0146_auditoria_gemini|261106_0146_auditoria_gemini]]`). No he tocat cap altra línia. Còpia d'abans a l'scratch de Claude.
  - **Avís per a Codex:** el pla del seu torn obert `torn_524e53a0` era el pla d'Onada R7, ara arxivat; per tancar el torn haurà de vincular un pla nou.
- `16:01` · **[INCIDÈNCIA] Conflicte d'editor:** dos minuts després de l'arxivament, un editor amb la pestanya antiga oberta va tornar a crear `04_escriptori/261106_0146_auditoria_claude.md` **buit** (0 B). La còpia bona (960.274 B, amb els apunts d'avui) és a `90_arxiu_historic/`. He traslladat el fitxer buit a `.sdp-paperera/quarantena-261108_1601_auditoria_claude_buida_recreada_per_editor/` (no s'ha esborrat res). **Cal tancar eixa pestanya a Antigravity** o tornarà a aparéixer.
- `16:02` · **Portes del pas 3 a l'arbre viu:** `porta-olivera.mjs` 0, `tractor-cens.mjs` 0, `tractor-doctrina.mjs` 0. Els canvis del pas 3 (trasllats, enllaços reescrits, registres de torn) **no estan versionats**: `.agents/ESTAT.md` i `.agents/LEDGER.md` porten també canvis de MarIA sense versionar.

### R13-P060 · P0-60 / IDEA-191 · La targeta de WhatsApp del Pou de Neu (ordre urgent de les 17:09)

- **Causa (comprovada):** el `dist` de producció no tenia `mur/noves-tecnologies-aplicades-a-la-cultura-rural/index.html` (només `mur/node-zero-mac-mini-m4`, de la projecció remota) ni les pàgines de patrimoni; la il·lustració és una WebP de 460 KB sense variant social. Producció servia l'OG genèric.
- **Arreglament** (còpia aïllada `p060` sobre `a948fcb0f`):
  - 5 variants JPEG 1200×630 de patrimoni amb el generador del repositori (`generaVariantSocial1200x630`, posicioY 0,15, revisades a ull) i una variant «contenida» del logotip circular del Manifest de Poble (amb `sips` i `senseApp1`).
  - `VARIANTS_SOCIALS` (és a l'entrada del paquet): les 55 parelles seguien la mateixa convenció; ara s'escriuen només els originals i la variant es deriva. Mapa idèntic, i **l'entrada baixa 189 B** (llavor 249.610 → 249.421 B) amb les 6 noves dins.
  - `metadadesSocials.js`: regla de detall del Mur idèntica a la del client (títol; entradilla/lead/subtítol; alt = títol, com `heroAlt`), amb prova de paritat. **No he fet servir `image_alt`**, com suggeria l'ordre: el client posa el títol, i el principi del mòdul és que el head servit i el de l'app diguen el mateix.
  - `build-social-manifest.mjs`: llavors del Mur (article + `MOCK_FEED`, `og:type article`); les pàgines que `pageContent.js` afig per `Object.assign` (banc de llavors, rutes, arbres), que el lector d'AST no veia; les 4 pàgines de patrimoni a `PAGINES_INFORMATIVES` (i fora d'`EXCLOSES_DE_PAGE`, el motiu del qual, «sense portada pròpia», ja no era cert); àlies `/page/anatomia-rural`.
- **Verificació:** proves de node de `tooling/seo` 129/129; Vitest de les seccions afectades 4.982/0; `natiu-build` 28/28; ESLint 0; portes de contingut 0. Vitest sencer: 34.590 passades i 7 fallades en 2 fitxers (`App.appsLocals`, `NotesContext.ambit`) que **passen aïllades** (54/54): esperes asíncrones esgotades amb la màquina carregada (assaig del hook i agents alhora). L'assaig del hook: cens 55/57 (heretades) i `test:precommit` amb 3 fallades de temps (sostre de 50 ms) que també passen aïllades.
- `18:16` · **COMMIT `bcb067a27`** (11 fitxers, `--no-verify` pel cas autoritzat: la Porta Cens cau pel torn antic) i **producció** a les 18:17: Firebase `385cdbb114f09aa1` («web bcb067a27»; per a tornar enrere, `825f0d4ae5681d10`), Node 0 per rsync. Entrada de producció **249.828 B** (172 B de marge).
- **Comprovació en viu:** `curl -s https://socdepoble.org/mur/noves-tecnologies-aplicades-a-la-cultura-rural | grep og:` torna el títol de l'article i `og:image`/`twitter:image` = `…/anatomia-rural-pou-neu-ibanez-social-1200x630.jpg`. `/page/anatomia-rural` servix el mateix head.
- **[INCIDÈNCIA] socdepoble.cat:** el Node 0 servix el head correcte (Caddy local 200, el JPEG 200 `image/jpeg`) i el túnel de Cloudflare diu `ready` amb 4 connexions, però **ni el Mac ni el Mac mini arriben a l'edge de Cloudflare** de `socdepoble.cat` (`188.114.96.5/97.5`, cap connexió en 15–20 s), mentre que `.org` (Firebase) respon. La causa no està comprovada; diumenge de vesprada encaixa amb el bloqueig d'IP de Cloudflare que fan alguns operadors durant els partits de LaLiga. Cal mirar-ho des d'una altra xarxa.

### R13-MIT · P0-61 / IDEA-192 · Les 4 skills core amb el Mètode MIT

- **Kit de MarIA** (`_investigacio_ia_de_poble/261108_metode_mit_notebooklm_brain_wiki_i_taxonomia/KIT_SKILLS_CORE_METODE_MIT/`): contingut net (només afig el Mètode MIT). Assajat en còpia de HEAD: Fronteres 0, però **queien la Porta Registre** (R3: el disparador «metode mit» compartit per 4 skills sense `prioritat:`) i **la Porta Frontmatter** (F4: etiqueta `metode-mit` fora del vocabulari tancat; F7: dues descripcions de més de 220 caràcters).
- **Arreglos de l'àrbitre:** fora l'etiqueta `metode-mit`; descripcions de `core-automillora` (201) i `core-tecniques-investigacio` (205) escurçades; el disparador «metode mit» només a `core-comprensio-reflexiva` (el procediment canònic). `00_INDEX_SKILLS.md` regenerat amb `cataleg_skills.mjs --escriu`.
- `18:36` · **Escrit per l’executor** amb la lease de govern `4bf2b574` (Petorreta `261108_1836_PROMPT_quatre_skills_core_del_metode_mit_amb_executor_i_segell.md`, `Plan-SHA256 db2b9a23…`), transacció `09089083`. **Segell nou `faeed50e`**, que verifica; `cataleg_skills.mjs --check` 0; `fronteres-skills.mjs` 0 violacions. Sense commit (la lease caduca a les 20:46).

### R13-1 · P0-58 / IDEA-189 · Smart Paste Pedra Seca a /notes

- **Disseny** (mapa de només lectura, `wf_2ccb3628-14c`): dues portes úniques que ja existien i el motor ja aprovat de «🎴 Proposa Card» (`proposaCard.js`, Mestre 261028) per a l'autodistribució. Cap dependència nova (no hi ha cap biblioteca de Markdown): un convertidor propi i segur. Cap canvi de CSS ni de `sanitize.js`. Decisions de l'àrbitre a `_investigacio_ia_de_poble/261108_claude_r13_smart_paste_i_kits/triatge_kits/p058_decisions.md`.
- **Implementació** (`wf_28099902-799`, còpia aïllada, 7 agents):
  - **Camps plans:** `enganxatCamps.js` + `EditableField` (`onPaste`/`onDrop`). Títol, subtítol i entradilla reben text pla d'una línia, sense `<code>` ni estils, i s'inserix al cursor amb el desfer natiu. Tanca, de pas, una porta lateral: una foto `data:image` amb GPS enganxada al títol entrava sense netejar l'EXIF.
  - **Autodistribució:** només en enganxar sobre l'H1 d'una nota buida (`DocumentEditor.repartixEnganxat`). Títol, subtítol, entradilla i cos amb el motor de «Proposa Card», i Cmd/Ctrl+Z al cos ho torna.
  - **Cos:** `netejaHtmlPerAlCos` = `netejaFormatEnganxat(senseRegistreDeFoto(netejaHtmlEnganxat(html)))`. Converteix `<code>https://…</code>` en enllaç, `h1` en `h2` i lleva els atributs dels `<a>`, però conserva els estils perquè les negretes de Google Docs no es perden. `EnganxatDeText` (`clipboardTextParser`) passa el Markdown a HTML semàntic, i Maj+enganxar continua sent literal. Mòdul `markdownEnganxat.js`: escapa abans de construir, regex lineals, sense lookbehind, mai `<img>`, enllaços validats amb `hrefDeImatge`.
- **Verificació adversarial** (seguretat, contractes, navegador): 17 troballes, 3 de P0–P2 (fixture a `src/` que trencava la Pedra Seca, llistes Markdown falses i cos no buit), totes arreglades i verificades amb contraprova. `src/components/universal` 3.116/3.116, `src/sections/notes` 1.246/1.246, `src/sections/profile` 1.303/1.303; ESLint, innerHTML i Design Guard en 0. Cap mòdul nou a l'entrada (diferència de soroll de hash: ±3 B).
- **P3 oberts:** la bandera d'arrossegament si no arriba `dragend`; l'ordre de la neteja de l'EXIF davant d'mXSS; enllaços amb credencials (ja a HEAD); la llista numerada de TipTap.
- **Preguntes per al Mestre:** `*x*` de WhatsApp és cursiva (com ara); les notes ja desades amb HTML brut no es netegen; cap avís en repartir. El paràgraf «Enganxat net» de la skill `sdp-universal-editor` el faria MarIA o l'executor.
- **Fixtures sintètiques:** els porta-retalls de ChatGPT, WhatsApp, Google Docs i Word són escrits a mà, i van etiquetats així (`tests/helpers/portaretalls.js`). No s'ha provat al navegador real amb porta-retalls capturats.

### R13-P059 · P0-59 / IDEA-190 · Kit R13 de Gemini (auditoria `wf_63317855-f88`)

- **Afirmacions falses del kit:** «100 % verd», «tractor-pedra-seca OK» i «35 fitxers». Amb el kit aplicat cauen proves i les portes Pedra Seca, Vocabulari i Tokens. Cita fitxers que no lliura (`UniversalCard.jsx`, `BancLlavorsValencianesView.jsx`, `paginesAmbTargeta.js`).
- **Calendaris (45):** **fidels a la font**. L'auditor va trobar el PDF oficial (`_cultura_de_poble/intercanvi_de_llavors_i_varietats_tradicionals/03_Cataleg_Valencia_Varietats_Tradicionals_Interes_Agrari.pdf`), en va extraure els cercles dels vectors amb PyMuPDF i casen 45/45 amb el kit; 13 més, revisats a ull. Etiquetes segons la llegenda de cada fitxa: «Sembra» o «Sembra directa» (11), «Trasplantament», «Recol·lecció» i «Maduració llavors». P3: la p20 compta dos mitjos mesos com a sencers.
- **Nutrició: rebutjada tal com venia.** 6 de 15 perfils no eren cap registre de l'USDA, BEDCA no apareix enlloc i l'assignació per trossos del nom donava disbarats (el «Cacau del collaret», un cacauet, rebia el perfil de col i perdia l'al·lergen). **Entra només** amb 6 perfils literals de l'USDA SR Legacy, per espècie exacta i amb l'aliment i l'FDC visibles (albergínia 169228, tomaca 170457, síndria 167765, ceba 170000, encisam 169249, pastanaga 170393), més l'avís «no són de la font del catàleg». 45 de 125 entrades en tenen. **Pregunta:** la «Carabassa d'encarabassat» de l'AVL és *Citrullus lanatus* i rep el perfil de la síndria.
- **Entra (bloc 1):** `BancLlavorsSection` desplega la fitxa a la pàgina, sense finestra ni scroll intern; el focus va al títol i en tancar torna al botó. Barra dels 12 mesos que cap sencera a 390 px. CSS a `modules.css`. 15 claus en les 5 llengües.
- **No entra (bloc 1):** `GraellaLoyverseBring` i `FitxaDidacticaItemTerra` (components òrfens que dupliquen `GraellaArticles`/`SeccionsCategoria`) i `itemCatalegUniversal.js` (un segon model d'ítem). **Preguntes:** les rajoles de P0-59 es fan amb `GraellaArticles` o amb `UniversalCard variant="rajola"`? S'amplia `producteUniversal.js` per al model únic?
- **Entra (bloc 2, part A):** l'alineació «Centre» de la targeta incrustada, més la clau i18n que faltava.
- **No entra (bloc 2, part B):** el selector de destins no es munta enlloc i cap pàgina destí llig `destins_publicacio`, així que una publicació «només a /page/…» desapareixeria del Mur sense eixir enlloc. **Decisions D-B2-1…6** a `scratchpad/r13_informes/bloc2.json`, que es copiaran al dipòsit.
- **Bloc 3:** es queda la implementació de P0-58 de l'àrbitre.
- **Bloc 4:** descartat. Revertiria P0-60, i el seu `imatgeSocial.js` engreixa l'entrada 319 B. Només entra l'ampliació de `prerender-social.test.mjs`.

### R13-P062 · P0-62 / IDEA-193 · L'App Store, oberta

- **Fet comprovat per Claude** (API d'Apple, 19:05): `trackId 6826441844`, «Sóc de Poble» 1.0, `org.socdepoble.app`, publicada el 06-11-2026 (17:31:42Z), iOS/iPadOS 16+, 130 dispositius. La fitxa respon 200.
- **Fet** (`wf_e04cb335-bc8`, còpia aïllada, verificador adversari, un P2 arreglat):
  - canal `app-store` obert (passa `FORMES`, i les guardes d'adreces de proves es mantenen);
  - `PAGE_COPY.descarregues` sense cap frase de botiga tancada ni de proves;
  - fita a `/versions` en 5 llengües;
  - panell «📲 Botigues» amb l'App Store publicada.
  - 225 + 5.055 + 1.406 proves verdes, SEO 18/18, Frontissa 25/25 a la còpia. L'App Store només s'afirma per a iPhone i iPad.
- **En curs:** el seguiment del xat (botó centrat de l'App Store, els 3 passos de Google Play, el panell i els comptadors de dispositius).

### R13-P063 · P0-63 / IDEA-194 · Contrasenya des de /control i recuperació amb sessió

- **Causa de l'àudio (reproduïda en proves):**
  - (a) Des de l'App, la tornada de l'enllaç era `capacitor://localhost` a iOS (`urlDeTornada` la rebutja i **no s'enviava cap correu**) i `https://localhost/registre…` a Android (no és a les Redirect URLs i GoTrue cau a la Site URL).
  - (b) L'enllaç que cau a «/» passa pel `<Navigate to=/xat replace>` del primer pintat **abans** que `recullTornadaOAuth` llija el fragment. El token es perdia i la persona acabava al Xat amb la seua sessió.
- **Arreglament:**
  - dins de l'App nativa, la tornada és `https://socdepoble.org/registre?sdp_auth=recuperacio`;
  - `recuperacioPendent.js` guarda en memòria, d'un sol ús i abans del primer pintat, l'adreça d'arribada si porta `type=recovery`, i `recullTornadaOAuth` la llig si la barra ja no la porta. R2 es manté: cap verificació en arribar i el token no va a cap emmagatzematge.
  - `/control` té el botó «🔑 Compte i contrasenya» cap a `/el-meu-perfil?vista=compte` (paràmetre nou i mínim al Perfil); sense sessió, passa per l'entrada i hi aterra.
- **Verificació adversarial amb lent de seguretat:** APTE AMB ARREGLOS, cap P0–P2. 4 P3, entre els quals: en mòbil, el botó porta a «El compte» només la primera vegada per pestanya.
- **Pressupost:** +79 B a l'entrada (la captura ha d'estar abans del primer pintat).
- **Fora d'abast** (Llibre :467): l'OTP de 6 dígits, els enllaços universals i l'activació d'Apple/Google natius.

### R13-KITS2 · Kits nous de Gemini (botigues i testers) i del Segon Brain (auditoria `wf_69e6ca07-b39`)

- **Kit `261108_kit_r13_botigues_centrades_i_acces_testers` · REBUTJAT sencer.** L'arbre integrat ja cobria P0-62 i P0-63, i millor.
  - El kit crea un segon model de canals (`CANALS_OFICIALS_BOTIGA`) i deixa l'App Store tancada al model de veres. El seu informe ho admet: «en comptes de modificar CANALS_DE_BOTIGA trencant el sentinella».
  - Afirmacions falses: «239/239 verds» (en cauen 2) i «tokens purs» (3 tokens inexistents; Tokens i Pedra Seca, rojos).
  - **Nomena Android i Google Play dins de l'app d'iOS** (regla 2.3.10 d'Apple, risc de rebuig): cau `ConsolaSection.publica.test.jsx:98`.
  - Enllaça `?apartat=compte`, que ningú no llig; el botó diu «✅ copiat» encara que no hi haja porta-retalls; suma 444 B a l'entrada.
- **Kit `261108_kit_r13_segon_brain_categories_i_etiquetes` (P0-61) · INTEGRAT amb 6 arreglos.**
  - Xifres reproduïbles (6/49, 425, 380/45, Rutes 98, Activitats 80/78) i cap escriptura sobre la taxonomia canònica.
  - Arreglos: la navegació a `/consola/taxonomia` no tornava a dalt; una prova feia caure Tokens; el graf diferit arrossegava tot el tros de la Consola; faltaven el head, la molla de pa i `lang`; i hi havia textos al JSX i faltava el teclat de la graella.
  - Entrada −16 B; 7.914 proves; SEO 34/34; teclat del graf 22/22.
  - **Preguntes:** traduir els ~100 textos del Brain (l'entrada no té marge); una il·lustració per al prerender de `/consola/taxonomia`; el recompte canònic d'Activitats (80 o 78); el literal «Transparència iGestió Pública».
- **Vitest sencer de l'arbre integrat** (abans del Brain i de la 7a card): 34.893 passades i 1 fallada real. `qualitat.fantasmes.test.js` detectava un `'<p></p>'` literal a `DocumentEditor.jsx`, que dins d'un `if (cos)` era codi mort; llevat, sense cap canvi de comportament.
- **Safata d'Entrada:** `llibre-Que dinem.pdf` → `Som de Poble/_menjar_i_beure_de_poble/llibre-Que-dinem-pep-cascant-comtat.pdf`, segons la darrera ordre del Mestre (la primera deia `_cultura_de_poble/menjar_i_beure_de_poble/`, i el vaig tornar a moure). Olivera 0.
- **En curs:** la 7a card «👥 Usuaris, Dispositius i Botigues (Google i Apple)» (`wf_450352f8-168`). La RPC `admin_resum_sessions_dispositius` no existia: va com a migració NO aplicada (decisió del Mestre).

### R13-NODE0 · Gauntlet 4x4 de la Quadrilla sobre la taxonomia (P0-61)

- **Informe:** `_investigacio_ia_de_poble/261108_metode_mit_notebooklm_brain_wiki_i_taxonomia/AUDITORIA_NODE0_GAUNTLET_4X4_TAXONOMIA_MIT.md`, amb totes les dades i respostes a `AUDITORIA_NODE0_GAUNTLET_4X4_dades/`.
- **Dades deterministes** (codi, no model): 425 articles, 44 etiquetes en ús, 45 articles sense etiqueta, 66 etiquetes SKOS buides (61 no canòniques), 5 subsumpcions. La matriu 44×44 és en CSV.
- **La Quadrilla:** 11 de 13 crides; 2 van esgotar el termini de 30 minuts. Proposa fusionar etiquetes d'identitat (Font Roja, El Planet, El Camí) per co-ocurrència, escurçaments en castellà («Recursos Locales») i xifres inventades (DeepSeek: 42 articles on n'hi ha 96).
- **Correcció de l'àrbitre:** cap fusió; una relació `broader` (Arbres Monumentals → Patrimoni); una faceta tema/entitat/lloc; conservar els `nomCurt` vigents. Res aplicat al codi.

### R13-2 · Kits de Codex R54, R55 i R56

`16:05` · **Triatge de només lectura** (workflow `wf_2ccb3628-14c`: 3 agents de Codex, 3 de Gemini i el mapa de P0-58; cap escriptura als kits ni a l'arbre viu; `kit-carril check` contra l'arbre exacte de HEAD). Resultats complets a `_investigacio_ia_de_poble/261108_claude_r13_smart_paste_i_kits/triatge_kits/`.

- **Ordre real dels kits:** R53 ⊂ R54 ⊂ R55 ⊂ R56. Cap està rebasat sobre `006b487d5` (R53 amb els arreglos de l'àrbitre) ni sobre `a948fcb0f`.
- **R54 (xat, IAIA i push) · NO a soles.** R55 ja el conté sencer (`applySealedR54.mjs`). La seua meitat R53 tornaria a posar el GPS a 6 fotos i el mot vetat a 7 fitxers de `src/`.
- **R55 (consola, barra i botigues; CAS atòmic R53+R54+R55 sobre `b41640cbb`, segellat i verificat: `shasum -c` 3.299/3.299) · INTEGRABLE AMB ARREGLOS, però BLOCAT per decisions del Mestre.**
  - `kit-carril check` s'atura a la primera divergència (`pou-neu-rentonar-carrasca-entorn-2023.jpg`). Comparació completa: 173 de 199 operacions tenen la preimatge exacta sobre HEAD; les 23 de R53 s'han de descartar (11 ja hi són, 12 empitjorarien HEAD: GPS, Design Guard, comentaris d'àlies); 3 fitxers xoquen (fusió neta a `components.css` i `PaginesEspaiMultimedia.jsx`; `censImatges.js` a mà, perquè la fusió textual duplica les 9 entrades).
  - **Necessita l'aprovació del Mestre:** (1) dependència nova `@capacitor/push-notifications` 8.1.3 (`package.json`; **no està instal·lada** i la casa prohibix `npm install` sense aprovació); (2) el registre Frontissa de la pàgina legal passa a «aprovat per Codex» amb la política 2.6; (3) canvis natius (`aps-environment`, gradle, pbxproj); (4) 4 migracions noves (2611080430, 0431, 0432, 0440), que entrarien al repositori sense aplicar-se.
  - **Pressupost d'entrada:** l'estimació en mode llavor és 249.987–250.022 B, i el build de producció en suma uns 380. **No hi cap** amb el sostre de 250.000 B (ara queden 8 B en producció).
  - **CSS de secció** `botiguesSistema.css`: vetat; R56 ja en té la correcció (passar les 3 regles a `modules.css`).
- **R56 (Fediversity i liquidació de deute) · ESPERA.** No està segellat: Codex va parar a les 13:17 (CHECKPOINT: «composed cohort pending», bateria composta tallada als 900 s, build i navegador finals sense fer). Està fet sobre `b41640cbb` + R53/R54/R55. L'ordre parla de «kits segellats».
- **R54 «UI, traducció, data i memòria d'scroll»:** només és un pla (sense codi), sobre `71e75c518`.
- **Fitxers sense versionar `src/hooks/useMemoriaScrollDeRuta.js` i `.test.jsx`** (07/11 16:43–16:51): no són de cap kit de Codex (R56 els observa com a «WIP alié» i fa el seu propi `useScrollDeNavegacio.js`). No els he tocat.

### R13-3 · Kits de Gemini R161–R220

Mateix triatge. **Cap kit està segellat ni porta manifest CAS**: són fitxers solts. Dossier final de Gemini: «zero crides a run_command», així que cap prova declarada s'havia executat.

- **r161 (patrimoni, text alternatiu) · INTEGRABLE AMB ARREGLOS, BLOCAT per la Frontissa.** L'únic aprofitable són 12 línies `imageAlt` localitzades (es, en, eu, gl) de les pàgines Banc de llavors, Rutes de poble i Arbres monumentals: avui l'alt en eixes llengües hereta el valencià. El reemplaçament sencer que proposava el kit esborrava el comentari P0-45 de HEAD i la seua «prova roja» ja era verda des de `7b2a4860f`. **Fet en còpia:** només les 12 línies + una prova nova (`pageContent.patrimoniR9.imageAlt.test.js`); 43 fitxers, 807 proves passades; ESLint 0. **`frontissa-contingut` avisa que canvien 3 claus aprovades pel Mestre** (`banc-de-llavors`, `rutes-de-poble`, `arbres-monumentals`): cal la seua aprovació. Pegat: `_investigacio_ia_de_poble/261108_claude_r13_smart_paste_i_kits/r161_textos_alternatius/`.
- **r162 · REBUTJAT:** superat per `7b2a4860f`.
- **r163–r166 · REBUTJAT:** fet sobre `95e803bf5`, **reverteix R51** (torna a posar `modificat` a `editorial.js`) i **P1-71**; «8 verticals a Supabase» sense codi ni esquema.
- **r167–r172 · REBUTJAT:** la «porta» no mesura res i dona falsos positius; l'«auditoria R53» cita fitxers i fotos que no existixen.
- **r173–r176 · REBUTJAT:** no connecta la IAIA amb el xat (P0-56 queda obert); identifica el grup pel nom (contra la doctrina «per id»); fixa una URL de proves de Play que `canalsDeBotiga.test.js` obliga a rebutjar.
- **r177–r180 · REBUTJAT:** codi mort (`rebutPelsAltresFinsSeq` no existix), classe orfe, clau i18n inexistent; Codex R54/R55 fa la peça amb contracte real.
- **r181–r184 · REBUTJAT:** viola la decisió D-B8C-12 («mai registra cap testimoni sense gest») i trenca `avisosPushNatius.test.js:553`.
- **r185–r188 i r189–r191 · REBUTJATS:** inventen una data «fundacional» (`2026-02-19T11:30`) i una hora per a les dates sense hora; import trencat cap a la carpeta d'un altre kit; esborren documentació d'ordres del Mestre.
- **r192–r194 · REBUTJAT:** fabrica l'estat de la flota i de les botigues (versions de models, «12 unitats actives», `versionCode 9`); Codex R55 fa la mateixa vista amb dades d'origen explícit.
- **r195–r202 · REBUTJAT:** proves tautològiques amb «100 %» escrit a mà per a NLnet i dades falses (`versionCode 9`, `targetSdk 35` contra 2 i 36 reals).
- **r203–r206 · REBUTJAT:** duplica el nucli del Bar i la Nevera amb identificadors d'al·lèrgens incompatibles.
- **r207–r209 · REBUTJAT:** fitxes agronòmiques inventades; «125 varietats» quan n'hi ha 4.
- **r210–r212 · REBUTJAT:** remesa SEPA amb un IBAN de forma real com a creditor per defecte i sense mandats.
- **r213–r215 · REBUTJAT:** mot vetat en noms de funció, camí `/Users/javi` i dades d'emergència inventades amb coordenades reals.
- **r216–r220 · NOMÉS DOCUMENTS:** estudi de xarxes cíviques (P0-55) i dossier. No s'han de promoure al dossier NLnet sense corregir rutes inexistents, la llicència i el mot vetat.
- **CSS solt `sdp_r12_fediversity_i_admin_components.css` · REBUTJAT:** 51 classes òrfenes per a components que no existixen.

### R13-R14 · Encàrrec d'integració mestra (relleu de les 23:30)

- **Punt 1 · `_cultura_de_poble/` (fet).** Entre les 21:38 i les 22:44 la carpeta va desaparéixer del MacBook; a les 22:58 una altra mà la va refer amb `menjar_i_beure_de_poble/` (1.449 fitxers, 1,2 GB: PDF de 7.560.366 B, 149 WebP, La Parròquia i la llista de la compra), `musica_i_festa/` (5 subcarpetes buides) i `patrimoni_i_llengua/` (2 buides), i l'enllaç `_menjar_i_beure_de_poble`. Mirall al Node 0 amb `rsync -av --ignore-existing` (sense `--delete`, en sec primer): 1.449/1.449 fitxers a `/Users/javi/Documents/Antigravity/_cultura_de_poble/`, que conserva les seues 7 subcarpetes del 6 de novembre; enllaç `_menjar_i_beure_de_poble` creat també al Node 0. Al MacBook falten les subcarpetes antigues (Trilogia, herbari, llavors, rutes, etnografia, biblioteca NotebookLM): és la recuperació de Codex; no he mogut ni esborrat res.
- **Punt 2 · kits R13 que cita l'ordre: no existixen.** Ni `261108_kit_codex_r13_segon_brain_i_auditoria_botigues` ni `261108_kit_r13_botigues_vitals_i_auditoria`. Els reals són els de R13-KITS2 (botigues de Gemini rebutjat; Segon Brain integrat). La 7a card s'adapta a l'especificació nova (id `administracio-usuaris-i-dispositius`).
- **Punt 3 · triatge del kit R14 de Gemini** (`wf_78cf9737-ff9`, 5 lents de només lectura; informes a la carpeta de proves de la sessió, `r14_triatge/`). El kit de Codex només porta inventaris JSON.
  - **Veritat:** els 149 títols de l'índex, amb la pàgina; ingredients literals en 145/149 i preparació en 139/149; les 149 WebP idèntiques a les de `_cultura_de_poble`; 47 vídeos diferents, tots al PDF i amb resposta d'oEmbed del canal «Sangonereta Gastronomia».
  - **Inventat o fals:** matriu d'al·lèrgens amb falsos negatius perillosos (cacaus «cap dels 14», clòtxines sense mol·luscs, gambes sense crustacis); escandall, PVP i preus «KM 0 de la Cooperativa La Torre» fets amb fórmula (×0,88); 156 receptes on n'hi ha 149 (la cloenda convertida en recepta amb «Salut!» com a pas); variants NanoBanana fictícies; sinònims fora del llibre («pebrassos» per esclata-sangs); Pep Cascant com a autor o revisor, quan el PDF no el nomena mai; el mot vetat 157 vegades; vincles a 10/11 llavors i 15/15 plantes que no existixen.
  - **Codi:** App.jsx plega les rutes en `.map()` (Porta Rutes Web en roig, 5 W1); SquareBadge afig +392 B a l'entrada (R13+kit: 250.287 B, porta en roig); el formulari de «Nodrir la IAIA» només desa al `localStorage` però diu «registrada per a ingesta al Node 0», i la safata d'aprovació és pública i sense rol; Mercadona duplica `productes.js` de HEAD (592 productes; el kit compta una nota com a producte); La Parròquia només es descriu amb constants.
- **Ordre nocturna (23:35, 8 % de quota) · COMMIT R13 `c074d6abf` pujat a `fork/backup-notes-publish`** (114 fitxers, arbre `95fffd24`, `--no-verify` pel Cens heretat). Inclou P0-58, P0-59, P0-61 (Segon Brain), P0-62, P0-63 i la 7a card. Aturats els dos workflows de fons (7a card encallada esperant la Vitest i receptari R14). La 7a card passa a l'id `administracio-usuaris-i-dispositius` amb el subtítol nou; **la vista interna es queda `admin-usuaris-i-dispositius`**, perquè la porta de superadmin de `PerfilShell.jsx` filtra pel prefix `admin-` (el test focal ho va caçar: amb l'id nou, el panell s'obria sense superadmin). Proves: focals 70/70, `src/sections/profile` verd, ESLint 0, Rutes 0, Frontissa 25/25 (registre escrit per l'executor, lease `857d4086`), entrada de producció **249.897 B**. La taula filtrable per usuari de l'especificació nova no hi és: el panell porta els recomptes per canal i depén de la migració `2611082238` (no aplicada).
- **R13 EN VIU (23:47).** Build net des de `git archive` (entrada `index-DGW6GKKY.js`, 249.897 B). socdepoble.org: Firebase `9efa84a7ebe40a5f` (tornar enrere: `385cdbb114f09aa1`). socdepoble.cat: Node 0 amb `rsync` en dues passades sense `--delete`; el Node 0 servix la mateixa entrada. `curl -I https://socdepoble.org` → HTTP/2 200. Sonda de consola (Chrome aïllat) a `/`, `/page/descarregues`, `/page/banc-de-llavors`, `/consola/taxonomia`, `/control`, `/notes` i `/versions`: 0 errors, 0 avisos, 0 peticions fallides. Relleu escrit a `.agents/ESTAT.md` per l'executor (23:50).
- **Kit R14 de Codex (Pas 5.1):** el que hi ha al disc és un motor CAS (`engine/`), un verificador amb 40 proves (35 passen; 5 refusos amb enllaços simbòlics i durs encara no implementats) i dos pegats de guarda perquè els aplicadors de Gemini no reescriguen `App.jsx`, `PageDetailSection.jsx` ni `ItemDetailSection.jsx`. No porta receptes, Mercadona ni La Parròquia, contra el que diu el Pla («249.550 B», que és la xifra de R13 sola amb credencials sintètiques).
- **COMMIT R14 `ec865dcfd` (02:15) pujat** (182 camins, arbre `3e9dc672`, `--no-verify` pel Cens heretat). Fet a la còpia `r14b` (= `c074d6abf`) pel workflow `wf_72a64789-365` (dades, interfície, 3 verificadors adversaris i 1 ronda d'arreglos):
  - **Dades:** `src/data/patrimoni/queDinem.js`, generat per `tooling/patrimoni/genera-que-dinem.mjs` (s'atura si una sola línia no és al PDF): 149 receptes, 1.151/1.151 línies literals, 4 preparacions buides del kit omplides, capçaleres de bloc, 47 vídeos impresos al llibre, 148 làmines (sense p163); crèdits de l'Associació; ISBN imprés literal i marcat com a no vàlid.
  - **Interfície:** `/page/receptes` i `/receptes/:slug` diferits, quadrats-botó amb `aria-pressed`, vídeo com a hero, avís d'al·lèrgens no revisats, 5 llengües, manifest social, cens d'imatges i mitjans a `assets/uploads/patrimoni/que-dinem/` (fora del zip del directori WP.org).
  - **Verificació:** Vitest de `src` 33.863/0, pre-commit 8.611/0, seo 129/129, Design Guard 0 crítics, Pedra Seca, Rutes, Persistència, Frontissa 26/26 (clau «receptes» escrita per l'executor a nom de l'ordre del Mestre, revocable), entrada 249.912 B.
  - **Obert per al Mestre:** el PDF sencer porta la foto de grup (p. 163) i els agraïments (p. 7); l'app nativa creixeria 9,7 MB fins que es decidisca la política de mitjans; 6 P3 (alt de #79 i #115, «cada recepta amb làmina» quan en són 148/149, quadrats de 96 px en es/gl, dos botons «Vídeo», nota de #14); el trinquet de l'autònom ja era roig a HEAD i R14 hi suma 3.730 B.
  - **R14 EN VIU (02:10).** socdepoble.org: Firebase `d2b5b255cd509d17` (tornar enrere: `9efa84a7ebe40a5f`); socdepoble.cat: Node 0 amb la mateixa entrada `index-CNoANKiJ.js`. `curl -I` 200; el PDF respon 200 amb 7.560.366 B; sonda de consola a `/`, `/page/receptes`, `/receptes/olleta-murera`, `/receptes/blat-picat`, una recepta inexistent i `/versions`: 0 errors. Captura en mòbil de `/receptes/olleta-murera`: títol, «Recepta 80 de «Què dinem?», pàgina 90», vídeo que només es carrega si el veí ho demana, els 6 quadrats-botó i els ingredients literals.
  - **`/versions` (punt 4):** crònica de les 5 llengües preparada i no aplicada (els tests fixen la posició de cada entrada); pegat i passos a `_investigacio_ia_de_poble/261109_salvaguarda_nocturna_claude/versions_r13_r14_pendent.patch`.
  - **Decisió de l'àrbitre:** integrar el receptari honest (149 receptes, text literal, làmines menys la foto de grup p163, 47 vídeos, PDF descarregable i crèdits de l'Associació, amb un avís d'al·lèrgens no revisats) i construir-lo amb els patrons canònics a la còpia `r14rec` (workflow `wf_44518698-996`, amb verificació adversària). Fora d'esta onada, amb pregunta al Mestre: Nodrir la IAIA i la safata de curadoria (backend i rol), escandalls i al·lèrgens de La Parròquia (fonts reals: fitxa del Cafè de la Plaça i llistat de preus), comparador Mercadona.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `a948fcb0f`: Vitest 34.579/0, build, assaig del hook i sonda de producció (R13-0).
- Final del pas 3: `porta-olivera.mjs`, `tractor-cens.mjs` i `tractor-doctrina.mjs` (resultat a R13-0 quan es tanque).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La sonda de producció mira consola, xarxa i que la ruta pinte; no prova sessions d'usuari, permisos ni el service worker antic de juny dels navegadors que ja el tenien.
- El tancament per caducitat no acredita els fitxers del torn antic: els documents arxivats no tenen verificació de tancament.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261108_1559_pla_implementacio_onada_r13_smart_paste_i_kits_codex_gemini]]
- [[03_llibre_mestre_tasques_i_idees]]
