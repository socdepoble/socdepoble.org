---
type: informe
status: esborrany
description: Informe viu de Claude Fable 5.1 (torn code) sobre T0-T4 i IDEA-62 del prompt 261102_1532, amb MCR, proves reals, dipòsits de governança i deute del Llibre Mestre.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d19293b9-1bb0-4073-8218-3da898ce7533:49aa031e-79c2-4d1d-b966-f5feed2d84ad
---
# Auditoria Claude · Carril 1 del prompt 261102_1532: Publicació Universal (T0), Mode Jarvis (T1), Arrere (T2), sortBy (T3), Multimèdia i IDEA-62 (T4)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d19293b9-1bb0-4073-8218-3da898ce7533:49aa031e-79c2-4d1d-b966-f5feed2d84ad |
| Versió del document | 1.9.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T15:44:12.894Z |
| Modificació | 2026-11-03T10:28:00+01:00 |
| Propietari | Claude Fable 5.1 (relleus 1-5) · Claude Opus 5.5 (relleus 6-10) |
| Aprovació humana | Ordre del Mestre al xat del 261102 (delegació autònoma, requires_human_decision: false); relleu 6: ordre del Mestre al xat de Claude del 261102 ~19:50 CET (Teler Invertit, Onada 3, regla estricta d'estalvi de quota); relleu 8: ordre del Mestre al xat del 261102 21:38 (Onada 4, eixam complet); relleu 9: ordre del Mestre al xat del 261103 00:4x (Onada 5, carril 1); relleu 10: ordre del Mestre al xat del 261103 ~03:05 (Onada 6, carril 1: T1/O6-CLAUDE-1 i T2/O6-CLAUDE-2); relleu 11: ordres del Mestre al xat del 261103 05:2x (Onada 7, Teler Invertit estricte), ~05:4x (ordre unificada nocturna d'Onades 7-9, «zero botons humans») i ~06:5x (marató de cicles 1-12 i complement Node 0) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Relleus 1-5: Claude Fable 5.1 (claude-fable-5-1) · Claude Code amb Ultracode i eixam de subagents. Relleu 6: Claude Opus 5.5 (claude-opus-5-5) · Claude Code amb Ultracode, compte «Sóc de Poble · Ultra», Àrbitre Gauntlet i Materialitzador amb 1 sol subagent àrbitre de només lectura. Relleus 8-9: Claude Opus 5.5 (claude-opus-5-5) · Ultracode amb eixam complet (workflows `o4-eixam-construccio`, `o4-destrossa-ho-tot`, `o4-fusio-kit-gemini` i `o5-captures-app-store`). Relleu 10: Claude Opus 5.5 (claude-opus-5-5) · Ultracode, workflows `o6-eixam-editorial` (17 agents) i `o6-destrossa-ho-tot` (10 agents). Relleu 11: Claude Opus 5.5 (claude-opus-5-5) · Ultracode, Àrbitre Gauntlet i Materialitzador CAS (workflows `gauntlet-o7-codex`, `gauntlet-o789-gemini`, `gauntlet-o89-codex`, `arqueologia-5-enxufes`, `ronda2-correctors-o7-o9`, `gauntlet-c-node0-gemini` i `ronda3-correctors-o7-o9`; 358 agents) |
| Tokens consumits | No exposats per l'arnés de Claude Code dins de la sessió; el reconeixement (8 lectors) ha consumit 2.600.505 tòkens de subagents segons el registre del workflow. Relleu 6: un sol subagent àrbitre, 189.417 tòkens (registre de l'arnés), cap workflow ni eixam. Relleus 8-9 (registre dels workflows): 3.529.467 + 2.636.815 + 585.648 + 265.837 tòkens de subagents. Relleu 10 (registre dels workflows): 3.331.057 + 1.489.257 tòkens de subagents. Relleu 11 (registre dels workflows): 7.977.505 + 12.670.137 + 8.856.261 + 1.882.227 + 3.673.630 + 13.514.787 + 2.594.137 = 51.168.684 tòkens de subagents |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-02T15:44:12.894Z: esborrany creat; contingut i verificació pendents.

- **2026-11-02 16:46 CET · relleu 1 (arrencada).** Torn `torn_d19293b9-1bb0-4073-8218-3da898ce7533` (code), HEAD `4ee8d78c4` a `backup-notes-publish`, arbre brut heretat (documental de MarIA). Llegits sencers: AGENTS, ESTAT, acta 261102_1456, pla i prompt 261102_1532, §0.3 i capçalera del Llibre Mestre, l'informe de Codex 261102_1638, i les tres skills del router (Pedra Seca, Gauntlet, Higiene). Porta Olivera en verd (2 vius ancorats). Servidor viu al :3340 (procés del Mestre, no l'he arrancat): /mur carrega amb 0 errors de consola. Reconeixement en marxa amb 8 lectors paral·lels. Fronteres d'esta sessió: el hook local només deixa escriure `src/`, `public/`, `tests/`, `supabase/` i la Wiki; `tooling/`, `scripts/` i `.agents/` exigixen executor amb lease i no n'hi ha cap d'activa, i no puc escriure fora del repositori. Per tant la part de governança es depositarà com a text exacte a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261102_1640_claude/governanca/` perquè MarIA l'aplique amb l'executor.
- **2026-11-02 17:32 CET · relleu 2 (reconeixement acabat, quatre Gauntlets en marxa).** Els 8 lectors han tornat (16 minuts, 772 lectures). Decisions preses i en execució: **T0** amb UNA sola fila a `section_submissions` (la doble projecció és de lectura: el Mur ja llig el Mercat així) i cap migració obligatòria (la RLS només admet cinc `section_id`); **T1** amb ranures de dades tancades (APK directe i TestFlight) i panell Jarvis amb botó només en DEV; **T2** amb el hook `useCapaEnrere` que ja existia; **T3** amb l'ordre pujat al reducer; **T4** amb la guarda `tests/higiene-estructural.test.mjs` (H1-H9) i la geometria S2.A mesurada. Codex no ha deixat cap kit encara (cap `261102_kit_*`); he llegit el seu prompt per a Gemini (261102_1647). *(Correcció del relleu 3: l'etiqueta «17:32» d'este relleu venia del rellotge de la sessió, avançat; l'hora de referència és la dels runs de vitest, i el relleu 2 va quedar escrit cap a les 17:05 CET.)*
- **2026-11-02 17:30 CET · relleu 3 (tres Gauntlets verds, kits de Codex auditats en sec, guardes i18n restituïdes).** **T2 VERIFICAT** (verificador 17:08: 39 fitxers, 559 proves, `design_guard` 2995/0/0, i18n 341/341; les quatre capes apunten la pila amb el mateix camí que el seu Escape). **T3 VERIFICAT amb paritat PARCIAL** (verificador 17:19: carpeta `workspace` 479/479; ARB-T3-01 és decisió de producte, vegeu D-T3-1 a Coordinació; ARB-T3-02 aplicat per mi al comentari d'`UniversalWorkspace.fixatATot.test.jsx`). **T1b VERIFICAT** (conjunt propi 678/678; T1b-A01 corregit: TestFlight rebutja query i fragment). **T1a construït** (panell Jarvis: `jarvis.js` 37 proves, `EmpaquetatsConsola.jarvis.test.jsx`, carpeta `consola` 1092 passades; dipòsit `governanca/tooling/vite/consola-iaia.mjs` + `LLEGIM.txt`) i en àrbitre. **IDEA-62 guarda construïda** (`tests/higiene-estructural.test.mjs` H1-H9 10/10 + `LLEGIM_HIGIENE.txt`) amb àrbitre APROVAT_AMB_CORRECCIONS (A1 escàner de comentaris sense regex, A2 manifest de node:test per a MarIA, A3-A7) i corrector en marxa. **T2b construït** (Compositor «+», UniversalToolbar «⋯», selecció de XatSection i resposta de Conversa apuntades; 163 fitxers, 2243 proves) i en àrbitre. **T0** en L0 (`src/utils/publicacioUniversal.js` ja al disc). **Kits de Codex** (quatre, a `../_investigacio_ia_de_poble/261102_kit_codex_*`): auditats en sec (T-04); l'arbre viu tenia 8 roges alienes a tots els carrils (38 claus amb cometes dobles als cinc diccionaris, tres proves sense el helper, una expectativa rància) que he restituït: les guardes i18n tornen a 762/762 (17:25). **Llibre Mestre:** 14 files rancies posades al dia amb font (ESTAT 15:38 i actes), més P0-24b, P1-71 i P1-73.
- **2026-11-02 18:12 CET · relleu 4 (kits integrats, T2c verificat, frontissa).** Kit i18n 29/29 i kit Xat/IAIA 18/18 a l'arbre viu (dos Gauntlets d'integració per trossos, verificadors 17:51 i 18:15); T2c verificat (18:03); IDEA-49 contrastat (17:58); P1-12 trinquet tancat; **frontissa de contingut** (apartat 14 de `legalContent.js`) alçada al Mestre (Coordinació, relleu 4). T0 amb els quatre carrils L1-L4 en àrbitre/corrector i correccions d'orquestradora fora de propietat (18:08-18:23).
- **2026-11-02 18:3x CET · relleu 5 (tancament ordenat per ordre del Mestre).** Prompt `261102_1821` (quota setmanal al 91 %, context al 84 %): cap Gauntlet ni subagent nou. **T0 tancat al codi** (els cinc correctors L0-L4 acabats; el verificador E2E del workflow és l'últim pas i el seu resultat és a Verificació 18:4x; resultat per carrils a T-07). **L2b aturat** abans d'escriure res (`NotesSection.jsx` i la seua prova intactes: queda com a recepta a §6 del dipòsit). Kit `hmr_workspace` de Codex integrat (18:22, T-05 tancat). Han arribat set kits nous (Codex: `xat_menus`, `higiene_residus`, `manifest_node`, `recuperacio_rpc/diposit/observacio`; Gemini: `xat_iaia_ux`, `higiene_idea62`): auditats pel manifest i deixats a MarIA amb l'ordre d'aplicació (dipòsit §1.4, conflicte de `.gitignore` entre Codex i Gemini inclòs). Gemini ha publicat `261102_1832_auditoria_gemini.md`, encara un esquelet. Dipòsit `00_LLEGIM.txt` en versió de tancament (§0-§9, amb la llista exacta de fitxers de T0).
- **2026-11-02 20:12 CET · relleu 6 (Teler Invertit, Onada 3: Claude Opus 5.5 com a Àrbitre i Materialitzador).** Prompt `261102_1918` i Acta Marmota `261102_1929`, llegits sencers. Ordre del Mestre al xat: 85 % menys consum, cap eixam ni cron, com a màxim 1 Àrbitre i 1 Verificador. Mateix torn `torn_d19293b9` (obert fins a 2026-11-03T15:40Z), al qual he vinculat el pla `261102_1532` (estat `planned`). **O3-CLAUDE-1 fet** (T-08): un sol Àrbitre Adversarial de només lectura ha passat per les sis peces d'Onada 2. Troballes: **2 P2 confirmades**, AUD-01 de Codex a la tria automàtica i AUD-O2-T4-01 de Codex a la paginació de les verticals; la resta, neta. Totes dues materialitzades a l'arbre viu: el corrector de Codex amb CAS i la correcció de la paginació amb 3 proves noves. A més, una roja aliena que la verificació ampla ha destapat: `PerfilPublicSection.test.jsx` D12, una expectativa rància del kit Xat/IAIA d'Onada 1, ja posada al dia. Cap Verificador extra: les suites les he passat jo. **O3-CLAUDE-2:** a les 20:10 cap dels cinc kits d'Onada 3 era al dipòsit. No n'he materialitzat cap i he deixat les precondicions de cada un (T-08, dipòsit §10). Portes finals verdes. Cap procés, cron ni subagent viu.
- **2026-11-02 20:57 CET · relleu 7 (tancament quirúrgic d'O3-CLAUDE-2).** Ordre del Mestre al xat: MarIA ja ha aplicat a l'arbre viu quatre kits d'Onada 3 (`kit_carril`, `build_net_dsstore`, `opendata_fediversity` i `idea48_cerimonia_ux`) i ha afegit el relleu 6 a ESTAT i l'id sencer del torn al LEDGER. `recuperacio_consumidor_ui` es queda al dipòsit amb la cadena F7. Revisió feta en fil principal, sense cap subagent. **Certificat** (T-09), amb dos detalls polits a l'arbre viu:
  - El Data Package estàtic declarava 9 recursos i només en servia 1. N'he publicat els 8 que faltaven, generats i idèntics als hashos del manifest, i he posat una prova de paritat completa.
  - `_headers` i `_redirects` viatjaven al connector WordPress i a l'app nativa. Ara són a `PROPIS_DEL_LLOC`.
  
  Proves i portes en verd.
- **2026-11-02 22:1x CET · relleu 8 (Onada 4 Nocturna, tancat a les 00:40: T-10).** Prompt `261102_2138` (amb `O4-CLAUDE-1b` afegit per MarIA) i Bloc T4 del pla `261102_1532`, llegits sencers. Ordre del Mestre al xat: s'alça la restricció d'Onada 3 i torna l'eixam complet. El reconeixement l'han fet 2 lectors en un workflow: mapes de l'Edició avançada i de les sub-targetes, pàgines i editor. Ha destapat premisses falses del prompt:
  - **`/page/privadesa` i `/page/manifest` no existixen:** la privacitat és una secció de `/legal`, i el manifest de la IAIA és `/anima`.
  - **`/legal` no té sub-targetes desplegables:** té una sola targeta incrustada, `data-sdp-targetes`, que apunta a Drets d'autor. Ho he comprovat al :3340.
  - **El sanejador elimina `<details>`, `<summary>` i `<section>`.**
  - **`src/locales/*.json` no existix:** els diccionaris són a `src/config/idiomes/*.js`.
  - **`UniversalEditor.jsx` no existix:** l'editor és `UniversalEditorShell` + `richText/`.
  - **No hi ha cap `FormularisFitxa`:** el formulari és `CampDeFitxa`, dins de `DialegAmbit`.
  - **`/opendata/mercat.jsonld` i `llocs.geojson` no existixen.**

  Línia base de la suite sencera (21:45): Vitest 31.284 en verd i 6 roges en 3 fitxers; `node --test` 2.104 de 2.109, amb 2 roges a `mapa-consola`; `certifica-enllacos` 31/31; `fronteres-skills` 0 violacions; `design_guard` PASSA; Olivera 0. Quatre de les roges de Vitest són de `firebase.json`, del kit d'opendata d'Onada 3: se'm van escapar en certificar-lo al relleu 7 perquè no vaig passar `src/config/firebaseHosting.test.js` ni `src/natiu/associacioDominis.test.js`. Les altres dues són `iaiaRebostRural`, per la retirada de les verticals de la barra lateral.

  Eixam en marxa (workflow `o4-eixam-construccio`): 4 carrils amb propietat exclusiva de fitxers, cadascun amb Constructor, Àrbitre Adversarial, Corrector i Verificador:
  - **A:** «On es publica?» integrat dins d'«Edició avançada».
  - **B:** calaixos davall de la barra negra (IDEA-63).
  - **C:** sub-targetes a pàgines i editor, i enllaços d'opendata.
  - **D:** línia base en verd.

  Els kits d'Onada 4 de Codex i Gemini encara no són al dipòsit.

  **Progrés 23:30 (canal viu).**
  - **Eixam acabat.** 16 agents, cap error, 4 carrils aprovats amb correccions. Carrils A, B i D: verificador en verd. Carril C: codi en verd, però la frontissa roja, perquè el classificador de permisos va denegar l'aprovació al subagent.
  - **Una premissa falsa corregida.** Les dues roges d'`iaiaRebostRural` no venien de la barra lateral: les causava l'entrada `atles:treball` → `/treball` de cc3e443dc (IDEA-61). Ja eren roges a HEAD.
  - **Frontissa (fil principal).** He revisat el diff: `projecte` i `descarregues` tenen el text idèntic i només guanyen l'embolcall; `fediversity` guanya una frase i 6 enllaços `/opendata/*`. Aprovada amb la CLI per l'ordre de la línia 146 del prompt, sense `--accepta-retall`. Ara és 16/16.
  - **Kit Codex O4.** Les 70 rutes casaven per CAS i cap no es creua amb els carrils. Calia rebase de la precondició `.agents/contingut_estructural.json`, que l'aprovació acabava de canviar. El diff del registre només toca les 3 claus aprovades. L'he aplicat amb `kit-carril.mjs` des d'una còpia rebasada al scratchpad: 70/70 i frontissa 16/16.
  - **Avís per al Mestre.** El kit reescriu lliçons de «## Lliçons del Mestre» (per exemple a `sdp-workflow` 260923 i 261007, i a `wiki-documentacio` 261002) i n'afebleix el sentit. No ho he desfet: es llista a Límits com a decisió vostra.
  - **Peticions fora de carril, fetes.**
    - B1b-01: la marca del menú compacte ja no suma la zona segura.
    - B1b-03: la capa del calaix encastat és transparent damunt de la barra.
    - B1b-05: `:host .toc-overlay` i `.sdp-ptr-indicator` passen al token `--sdp-calaix-dalt`.
    - A1-05: fora les claus mortes `editor.ambit.desar` i `editor.ambit.cancelar` dels 5 diccionaris.
    - Les dues proves `[DEFECTE]` passen a proves normals, i 83 fitxers i 1.853 proves queden en verd.
  - **Navegador (:3340).**
    - L'Índex i el menú compacte naixen a `top: 64`, davall de la barra.
    - La subtargeta pinta amb vora, radi i coixí de tokens, i sense marge final.
    - L'espècimen real de `BlocAmbit` pinta les 5 targetes i la fitxa amb errors en línia.
    - Sense sessió, `/notes?ambit=` no prepara cap nota (`calEntrar`, comportament previ).
  - **En marxa a les 23:30, acabats a les 00:40 (T-10).** La suite sencera (Vitest + `node --test`) i el Gauntlet «Destrossa-ho tot», 6 dimensions amb refutador i correctors de fitxers disjunts.
- **2026-11-03 01:2x CET · relleu 9 (Onada 5 Nocturna, carril 1: O5-CLAUDE-1 i O5-CLAUDE-2, T-11 i T-12).**
  - **Llegits sencers:** el Bloc T5 del pla `261102_1532` i el prompt `261102_1532_prompt_onada5_reconciliacio_botigues_i_tancament_10_de_10.md`.
  - **Fet a l'arbre viu, sense commit:** `pageContent.js` reconciliat; frontissa 16/16 sense reaprovar; `TargetaDeLectura` protegida; `certifica-enllacos.mjs` fusionat; kit R2 aplicat; lliçons de 2 skills restaurades i segell reconciliat; IDEA-63..66 al Llibre Mestre.
  - **Captures:** les 6 d'App Store, a `_builds_de_poble/apple_app_store_fitxa/`.
  - **Proves i portes:**
    - Vitest sencer: 31.458 en verd i 0 roges;
    - `node --test`: 2.163 de 2.166 i 0 fallades;
    - `npm run build`: exit 0;
    - frontissa, certifica-enllacos, fronteres-skills, design_guard, segell, RLS i Olivera: exit 0.
  - **`tancament --check`:** bloquejat només per la zona humana, 97 captures del Mestre a `01_produccio/`.
- **2026-11-03 04:55 CET · relleu 10 (Onada 6, carril 1: O6-CLAUDE-1 i O6-CLAUDE-2, T-13).**
  - **Llegits sencers:** el prompt `261102_1532_prompt_onada6_disseny_editorial_negrites_versions_1_1_0_i_tancament.md` i el Bloc T6 del pla `261102_1532`.
  - **Fet:** salt a v1.1.0 a `package.json`, `android/app/build.gradle` (`versionName`; `versionCode 2` no canvia), els 4 `MARKETING_VERSION` d'iOS i `versio.test.js` (35 fitxers i 428 proves en verd).
  - **Dos fets que contradiuen el prompt, comprovats a les 03:1x:**
    - WordPress.org encara servix la 1.1.10: a l'SVN només hi ha l'etiqueta `1.1.10` i la `Stable tag` és 1.1.10. Per això la capçalera de `/versions` diu «Connector WordPress v1.1.10 a WordPress.org» i no la 1.1.11 que demanava el prompt.
    - L'APK 1.0.0+2 és compilat a `_builds_de_poble/android/`, però el canal `apk-directe` continua tancat i `socdepoble.org/descarregues/…apk` torna la closca de l'app.
  - **Fet a l'arbre viu, sense commit:** l'eixam `o6-eixam-editorial` (6 grups), el Gauntlet transversal `o6-destrossa-ho-tot` (36 troballes confirmades), el kit legal 2.4 de Codex integrat per CAS i la frontissa a 16/16. Detall a T-13; proves a Verificació; decisions O6-D1..D8 a Límits.
  - **Com ha treballat l'eixam:** cada grup ha tingut un constructor, un àrbitre adversarial i, si calia, un corrector. Han escrit `pageContent.js` només a través d'un `splice` amb pany, i un verificador determinista ha comprovat que el text queda byte a byte i que la densitat de negretes per paràgraf és la del contracte.
- **2026-11-03 05:55 CET · relleu 11 (Onades 7-9, Teler Invertit: Claude àrbitre i materialitzador). Canal viu per a MarIA.**
  - **Ordres:** prompt canònic `261103_0522_prompt_onades7_8_9_teler_invertit_fediversity_i_offline_first.md` i ordre unificada del Mestre al xat de Claude (261103 ~05:4x, «zero botons humans»).
  - **Línia base (HEAD `1620efcc0`, 05:27):**
    - Vitest: 31.499 verdes, 1 roja.
    - `node --test` (manifest): 2.179 verdes de 2.189, 8 roges.
    - Frontissa: 16/16.
    - Mapa de la Consola: 7 avisos (4 alts).
  - **Causa de les 9 roges de la línia base, amb l'esmena verificada en còpia:**
    1. **`inicia-node-germa` (7 roges):** `package-lock.json` diu 1.0.0 i `package.json` 1.1.0, i l'instal·lador rebutja la release. És un deute meu del relleu 10. Esmena: dues línies del lock a 1.1.0. Amb un git d'scratch, la prova passa 7 de 7. Al viu només passarà quan el lock estiga comitejat, perquè la prova extreu la release de HEAD.
    2. **`self-describe-coherencia` (1 roja):** `tractor-frontmatter.mjs --json` feia `process.exit()` i el JSON es tallava als 64 KiB. Esmena: `process.exitCode`. Resultat: 5 de 5.
    3. **`indexCerca.seguretat` (1 roja):** la referència de la prova de propietat no tenia el pas nou de `textPla` (O6-G1-C1-03). Esmena: la referència el porta, en la mateixa posició. Resultat: 4 de 4.
  - **Per a MarIA (governança, Mode Jarvis):**
    - **(a) Kit de Codex fora de la Wiki:** Codex ha deixat el kit O7 a `_wiki_de_poble/04_escriptori/02_investigacio_ia/`, i el seu `payload/` i `preimages/` dupliquen documents de la Wiki. Mentre hi siga, els `[[vincles]]` de SELF-DESCRIBE són ambigus i `self-describe-coherencia` cau. Cal moure'l a `../_investigacio_ia_de_poble/`, com diu l'ordre, quan l'haja integrat.
    - **(b) Commit del lock:** cal comitejar `package-lock.json` (dues línies) en el pròxim commit; si no, el node germà continua roig.
  - **En curs:** Gauntlet `gauntlet-o7-codex` (6 àrbitres i refutadors) sobre el kit O7 de Codex, que Codex encara marca «en verificació final, no aplicar». Encara no s'ha dipositat cap kit de Gemini ni el kit O8-O9 de Codex.
- **2026-11-03 06:57 CET · relleu 11, segon bloc (marató de cicles 1-12 i Node 0).**
  - **Kits rebuts i en Gauntlet (cicle 1):**
    - `261103_kit_codex_onada7_excel_lencia_i_llibre_mestre`: final de 184 rutes; el provisional de 178 no es consumix.
    - `261103_kit_gemini_onada7_8_9_obsidian_fediversity_i_offline`: 26 fitxers sencers. El kit bessó `…_onada7_obsidian_fediversity_i_consola` és idèntic.
    - `261103_kit_codex_onada8_9_nixos_i_offline_first`: v2, amb E-06. El provisional `pre_e06` no es consumix.
  - **Fet observat:** entre les 06:02 i les 06:03 algú va escriure directament a l'arbre viu `src/sections/consola/ConsolaSection.jsx` (`ConsolaIncrustada` amb `ambImatges`) i `ConsolaSection.govern.test.jsx`. El kit de Gemini usa eixe estat com a preimatge. Ho trac com a part del kit de Gemini.
  - **Col·lisions entre kits que resoldré en integrar (fusió a tres bandes sobre HEAD):**
    - `pageContent.js`: Codex (`/versions` i Consola) i Gemini (Cards i `/fediversity`).
    - `ConsolaSection.jsx`, `GovernConsola.jsx` i `ConsolaSection.diagnosi.test.jsx`: Codex i Gemini.
    - `tooling/tests/node-suite-manifest.json`: Codex O8-O9 registra les seues proves; les 3 proves `node --test` de Gemini no hi són.
  - **Cicles 2-6 · arqueologia dels 5 enxufes:** workflow `arqueologia-5-enxufes` en marxa, només de lectura sobre l'antic `Sóc de Poble/` i l'arbre viu. L'Atles verificat (estat, contracte darrere de `backendPort.js`, buits, encàrrecs per a Codex i Gemini i criteris d'acceptació) anirà a T-14.
  - **Complement del Mestre, Node 0 (Mac Mini M4 24/512) · per a MarIA:**
    - **Constructor:** `src/data/local/iaiaNodeSobiraLocal.js` i `tooling/node-sobira-poble/` han de tindre **un sol constructor (Codex o Gemini, en kit CAS)**. Claude arbitra i no el construïx, per a no tindre tres mans sobre el mateix fitxer.
    - **Criteris d'arbitratge:**
      - zero dependències noves;
      - LLM local (Ollama a `127.0.0.1:11434` o MLX a `:8080`) només en loopback, sense cap crida a cap núvol;
      - des del navegador, l'origen de la SPA ha d'estar declarat a `OLLAMA_ORIGINS`, i això es documenta, no es força;
      - RAG `node:sqlite` (Node 24.13 l'inclou) amb BM25 determinista;
      - el contingut indexat es tracta com a dada, mai com a instrucció (injecció de prompt);
      - cap dada privada a l'índex sense consentiment;
      - desendollable i injectat per `backendPort.js` sense tocar-lo;
      - proves `node --test` registrades al manifest.
    - **Frontera d'honestedat de `/fediversity`:**
      - el text pot descriure l'arquitectura del pilot «Node 0 La Torre de les Maçanes», però no pot dir que ja és operatiu ni donar xifres (p. ex. «4 W en repòs») si no hi ha una mesura real i citada;
      - `tractor-promesa.mjs` i la Llei del Llop ho vigilen;
      - mentrestant, s'ha de redactar com a pilot en preparació, amb maquinari disponible.
    - **Decisió del Mestre (O7-D1):** `src/sections/mercat/marketSeed.js` (`mac-mini-m4`) encara anuncia el Mac Mini en venda per 900 €. Si passa a ser el Node 0, cal retirar o canviar eixe anunci de la llavor del Mercat.
- **2026-11-03 07:43 CET · relleu 11, tercer bloc (resultat dels tres Gauntlets i decisions d'àrbitre).**
  - **Gauntlets de la ronda 1.** Tots són de només lectura i els han fet 222 agents. Les troballes, amb evidència i esmena, són al dipòsit `../_investigacio_ia_de_poble/261103_claude_o7_arbitratge/`.
    - **Codex O7:** 27 troballes, 27 confirmades.
    - **Gemini O7-O9 (v1):** 54 troballes, 50 confirmades.
    - **Codex O8-O9:** 39 troballes, 26 confirmades i 13 disputades.
    - **«100 % verd»:** l'afirmació de Gemini és falsa. A la seua candidata hi ha 6 proves i18n roges, 5 de `TextSection.subtargeta`, `paginaDeText` i `node-suite-policy` (les proves node no estaven registrades).
  - **Decisions d'àrbitre (reversibles, documentades):**
    1. **Actualització 11:5x.** Codex ha respost amb el suplement `suplement_llibre_literal_original`, dins del kit O7.
       - **Què conserva:** el text del Llibre byte a byte (visions, cròniques, commits i la §5). Només canvien les 154 cel·les d'Estat.
       - **Parser:** corregix `fonts-govern.mjs` perquè els àlies `[[…|…]]` no desquadren les files.
       - **Veredicte de l'àrbitre:** és l'opció bona per a O7-D2, si el Mestre vol el vocabulari d'estats nou.
       - **Per què no s'aplica:** la preimatge del suplement és el Llibre original (`c180c707…`), i el viu ja porta els `\|` escapats, el bloc del relleu 11 i la `IDEA-67`. Cal rebasar-lo després de la decisió.
    1. **El Llibre Mestre destil·lat per Codex no s'integra.** Fa 94 KB i el viu en fa 242. Conserva les 154 files, però:
       - esborra la secció 5, el «Protocol d'Herència»;
       - reescriu els 154 estats i hi perd els commits que certificaven cada FET;
       - resumix amb paraules de Codex les visions literals del Mestre.

       La versió íntegra ja és arxivada com a Volum II a `_arxiu_wiki_de_poble/historics_llibre_mestre/261103_0522_llibre_mestre_historic_preonada7.md`, i el SHA coincidix amb el viu. **Decisió del Mestre O7-D2:** acceptar o no la destil·lació.
    2. **No s'esborra `04_escriptori/01_produccio/.DS_Store`**, perquè és zona humana i bloquejaria el tancament de 12 torns.
    3. **No s'apliquen els 56 tancaments de torns del kit.** MarIA ja ha tancat els torns caducats amb el procediment canònic i el kit en duplicava el mecanisme (GOV-O7-03).
    4. **Consola i Mapa:**
       - preval la implementació viva de MarIA (06:14-06:38: `mapa-consola.mjs`, `construeixMapa.js`, `IndexConsola.jsx` i proves), per no trencar els 19 semàfors verds;
       - de Codex només entra el que no duplica i no porta els P1 confirmats: l'estat «PROGRAMAT» amaga jobs morts i la CLI del Mapa mutava torns per defecte.
    5. **Nivell C de Gemini (Bloc D, Node 0 i telemetria):** no s'integra fins que passe el Gauntlet propi, que ja és en marxa.
  - **Atles dels 5 enxufes (cicles 2-6), verificat:** `../_investigacio_ia_de_poble/261103_claude_o7_arbitratge/atles_5_enxufes.md`, amb 11 decisions per al Mestre i l'ordre de construcció. En resum:
    - **Primer, sense cap decisió humana:** un JCS i un SHA-256 canònics únics, i un sol decorador offline.
    - **Duplicat:** ara n'hi ha dos de Codex i de Gemini.
  - **En curs:**
    - **Ronda 2:** 6 correctors en carrils disjunts (Wiki, Consola i Mapa, `pageContent`, editor i i18n, offline i federació, Nix) i un verificador per carril, sobre una candidata muntada amb el viu de les 07:31.
    - **Gauntlet del nivell C.**
- **2026-11-03 08:49 CET · relleu 11, quart bloc · P0 de governança per al Mestre: evidència sintètica a l'arbre viu.**
  - **Què és.** Alguns semàfors de la Consola són verds perquè algú ha escrit a mà l'evidència que llegixen els detectors, no perquè la causa estiga resolta. L'ha trobat el verificador del carril A2 i l'he comprovada jo al disc, només en lectura, a les 08:4x:
    1. **Logs dels hooks d'Antigravity.** `.agents/runtime/antigravity-hook.log` (l. 54694 i següents) i `fatiga-hook.log` (l. 21146 i següents) tenen línies `2026-11-03T05:15:47.421Z event=before_Write …` en un format que cap hook no escriu: els hooks reals escriuen JSON `{"t":…,"mode":…,"decisio":…}`.
    2. **Log de Codex.** `.agents/runtime/codex-hook.log` té només 3 línies, totes amb la mateixa marca de temps (05:15:47.421Z), i cap eina de `tooling/` escriu este fitxer.
    3. **Higiene.** `.immunitari/higiene-cron.out` té una sola línia, «[2026-11-03T05:15:47.421Z] ✅ [Higiene] … verificades (0 errors).», amb mtime 06:15. Però `launchctl` diu `runs=1, last exit code = 78`: el job ni tan sols va arrancar, perquè TCC li denega l'stdout dins de Documents.
    4. **Torns.** 25 registres de torn tancats porten un rebut `rebut_<id> → .agents/ESTAT.md` amb `createdAt 05:17:29Z`, mentre el seu `history` només diu `['open']` (p. ex. `torn_734f3b4f`). Per això la mètrica «torns tancats sense rebut» marca 0/459.
    5. **Origen.** Segons `antigravity-hook.log`, Antigravity va executar 15 vegades `node /tmp/fix_consola_live.mjs` entre les 05:15:44Z i les 05:24:41Z. El fitxer ja no existix.
  - **Què faig com a àrbitre (codi, reversible).**
    - El lector `arnesosObservats` només casa amb el format sintètic. Al carril R3-A2 el substituïx el lector de traces JSON reals del kit de Codex (`ultimaTraca`), que acredita Antigravity per traces genuïnes i deixa Codex en «sense evidència».
    - Alguns semàfors tornaran a roig o ambre. És la veritat: Llei del Salfumant Radical.
    - No esborre les dades: són zona de governança.
  - **Decisió del Mestre (O7-D3):**
    1. Retirar les línies «event=» de les 05:15:47.421Z i les 05:22:39.053Z dels tres logs, la línia d'`higiene-cron.out` i els 25 rebuts sintètics.
    2. Corregir el plist instal·lat a `~/Library/LaunchAgents/org.socdepoble.higiene.plist` amb el del repositori, que ja porta els logs a `~/Library/Logs`, i recarregar-lo amb `launchctl`.
    3. Decidir si cal una lliçó a `core-salfumant-radical` o `core-edicio-segura`: cap agent escriu l'evidència que llegix un detector.
- **2026-11-03 09:07 CET · relleu 11, cinquè bloc · Veredicte del nivell C de Gemini (Bloc D, Node 0, IAIA RAG local, enxufes sobirans, rizoma i telemetria): NO s'integra esta nit.**
  - **Gauntlet `gauntlet-c-node0-gemini`:** 104 agents, 56 troballes, totes confirmades. 13 són P1. El detall és a `../_investigacio_ia_de_poble/261103_claude_o7_arbitratge/gauntletC_gemini_node0_troballes.json`.
  - **Els P1 principals, tots reproduïts en un clon a 127.0.0.1:**
    - **Denegació de servei:** una trama LoRa de 46 bytes sense autenticar tomba el Node 0 per falta de memòria (SIGABRT). Una altra de 38 bytes el bloqueja 10 s.
    - **Servidor sense defenses:** cap ruta té autenticació, accepta `text/plain` (CSRF) i no valida el Host (DNS rebinding).
    - **Relé DTN obert:** accepta deltes sense signar o amb una prova inventada.
    - **Adaptador del Node 0:** els 32 mètodes tornen `{ok:true}` sense fer res, també el login amb una contrasenya incorrecta i el canvi de contrasenya. El kit de conformitat dona 7 falles en 15 casos.
    - **Backend dins del client:** hi ha un backend `node:http` a `src/data/adaptadors/` sense ADR, i les portes no el veuen.
    - **`withOfflineFirstPort`:**
      - duplica el decorador de Codex;
      - el replay no és idempotent;
      - exporta el xat en clar dins del paquet DTN;
      - la cau no té àmbit de persona i pot filtrar dades entre comptes.
    - **Tallafoc de la IAIA RAG:** el tallafoc només-loopback se salta amb una redirecció 3xx.
    - **Text públic:** `/fediversity` (v4) publicava «4 W en repòs» com a fet, sense cap mesura.
    - **Proves:** les 9 proves noves no estan al manifest de node:test.
  - **Decisions d'àrbitre:**
    1. **Un sol decorador offline:** el de Codex (`enxufeBackendOfflineFirst.js`). Es retira `withOfflineFirstPort`.
    2. **Node 0:** cal ADR i un sol constructor, com diu l'Atles (decisions 1 i 9). Si s'enxufa, només l'opció A, de lectura, i a `tooling/`, no a l'arbre del client.
    3. **`/fediversity`:** a la candidata integrada, el Node 0 consta com a «pilot en preparació» amb el maquinari disponible, sense cap xifra no mesurada.
  - **13:1x · Cicle 8: verificació del kit nou `261103_kit_gemini_nivell_c_node0_rag_rizoma_enxufes` (v17 «gauntletC-pur-clean»). NO s'integra.**
    - **Workflow `gauntlet-c2-gemini-verificacio`:** 75 agents. Resultat a `../_investigacio_ia_de_poble/261103_claude_o7_arbitratge/cicle8_gemini_nivellC_v2_verificacio.json`.
    - **Les 56 troballes del Gauntlet C:** 11 TANCADES, 37 PARCIALS, 4 OBERTES i 4 OBSOLETES.
      - El kit diu que n'ha resolt 35 (14 P0, 15 P1 i 6 P2). El fitxer que cita en conté 56 i cap P0 (Llei del Llop).
      - Els «28/28 tests» passen, però només maten 4 de 20 mutants que desfan esmenes.
    - **Problemes nous:** 39 confirmats. Els P1 són aquests:
      - les escriptures del servidor són anònimes per defecte, perquè la CLI no pot configurar el token (NZ-01);
      - l'adaptador fa passar per conformitat el contingut de llavor en RAM i un xat fals (C2-N0-01);
      - `esborraNota` no esborra res al servidor (C2-N0-02);
      - les lectures privades no porten testimoni (C2-N0-03);
      - `verificaDeltaCrdtSignatCid` verifica amb la clau que porta el mateix paquet (C2-RIZ-01);
      - la recuperació per padrins accepta un quòrum de -1, és a dir, cap aval (C2-RIZ-02).
    - **Fet positiu:** el servidor ja és a `tooling/` i els nivells A i B no es toquen.
    - **Per a Gemini:** un kit corregit que fixe cada esmena amb una prova que mate el mutant. Gemini ja ha deixat una v18 «dual-compatible»: es revisarà quan estiga declarada final.
  - **13:22 · Tancament de la marató (cicles 1-10) i estat per al relleu.**
    - **Integrat al viu per CAS:**
      - 10:08: 180 rutes (O7-O9, nivells A i B);
      - 13:00: 6 rutes (cicle 9, socdepoble.cat honest).
    - **Rebutjat amb troballes al dipòsit:** el nivell C de Gemini (v4-v17, cicles 4 i 8), les v15-v17 de Gemini sobre A i B, els 4 kits d'enxufes (cicle 10) i el kit de la guia del Node 0 (fitxers a l'arrel).
    - **Frontissa al viu: 15/16.** `fedivers` ha canviat a les 13:02 (apartat «El servidor de l'habitació» de MarIA, amb afirmacions per evidenciar). L'aprova MarIA quan les acredite o les reformule.
    - **Processos:** Claude ha tancat els vigilants a les 13:22. Cap cron ni procés de fons de Claude queda actiu.
  - **13:3x · Cicle 10: Gauntlet dels 4 kits d'enxufes de Gemini (`enxufe1_contracte_sollutia`, `enxufe2_modul_joomla`, `enxufe3_fep_interoperable`, `enxufe4_dtn_i_vault`). NO s'integra cap.**
    - **Workflow i resultat:** 96 agents. El detall és a `cicle10_gemini_enxufes_troballes.json`, al dipòsit. Tots quatre passen el CAS sobre el viu integrat i no toquen els nivells A i B.
    - **E1 (Sollutia):**
      - document de treball a l'arrel en MAJÚSCULES, amb `type` fora d'esquema (F3 0→1);
      - presenta com a vigents verificacions de JWT que el codi no fa: una sonda adopta un token amb `alg:none`, amb `nbf` futur i amb 30 dies de vida;
      - l'amfitrió «invoca `refrescaSessio`», cosa que no pot fer;
      - els orígens són inventats.
      - **On ha d'anar:** com a estudi a l'escriptori, pel circuit documental, i com a ADR quan el Mestre ho tanque amb Sollutia (decisió 3 de l'Atles).
    - **E2 (Joomla):**
      - llicència EUPL i titular inventats, contra l'AGPL del repositori;
      - `distUrl` sense validar (accepta `data:` i `//`), i el valor per defecte és un host `.test`;
      - dues instàncies a la mateixa pàgina es trepitgen;
      - no reserva l'alçada (Llei del Píxel);
      - la carpeta `tooling/amfitrions/` és nova.
    - **E3 (FEP interoperable):**
      - el `proof` emés no porta `@context`, però el resum es calcula amb `@context`: no és interoperable;
      - l'actor sencer entra al paquet signat, també el material privat;
      - el descodificador base58 és quadràtic (31 s amb 156 KiB);
      - la prova de `/fediversity` passa a roig perquè el text públic diu «base64url».
    - **E4 (JCS canònic, DTN i vault):**
      - els noms de fitxer del vault depenen de l'ordre: es perden notes;
      - un slug que comença per «.» esborra la nota;
      - `src/data/canonic/` és un mòdul orfe en una carpeta nova, i Pedra Seca passa a PARAT;
      - encara no és «un sol JCS»: hi conviuen tres canonicalitzacions.
    - **Per a Gemini:** refer cada kit tancant els P1 amb proves que maten el mutant, i deixar tots els documents a l'escriptori, mai a l'arrel. **El mateix per al kit `onada10_guia_operacio_node0`**, que també posa 3 fitxers a l'arrel (`GUIA_OPERACIO_MAC_MINI_NODE0.md`, `MATRIU_AMENACES_ANTIC_VS_NODE0.md` i `coturn.node0.conf.example`).
  - **Per a Gemini (via MarIA):** corregir les 13 P1 en un kit nou. Gemini ha lliurat 11 versions del manifest entre les 06:03 i les 08:56. Per a l'àrbitre, cal un sol lliurament tancat i declarat «final», com fa Codex.
- **2026-11-03 10:15 CET · relleu 11, sisè bloc · CICLE 1 MATERIALITZAT A L'ARBRE VIU (10:08) i ⛔ NO APLICAR la v15 del kit de Gemini.**
  - **Materialització CAS:** a les 10:08 s'han escrit al viu 180 rutes, totes amb preimatge comprovada contra el viu de les 07:31 i sense cap conflicte. En detall:
    - 20 rutes de creació, 153 de modificació i 7 d'esborrat (`.DS_Store`);
    - **Codex O7:** el kit filtrat;
    - **Codex O8-O9:** v3;
    - **Gemini:** els nivells A i B;
    - **esmenes:** les de les rondes 2 i 3 (correctors amb verificador adversarial), les tres de la línia base (lock 1.1.0, `tractor-frontmatter` amb `exitCode` i la `textPla` de Codex) i les de `design_guard` i `tractor-tokens`.
    - **Reversió:** les preimatges de les 180 rutes es poden recuperar a l'scratchpad de Claude (`o7/materialitzacio/preimatges` + `manifest.json`).
  - **Frontissa:** 12 claus aprovades amb la CLI per l'ordre nocturna. Queda a **16/16**.
  - **Llibre:** 8 «|» escapats dins de `[[…]]` a les files de taula (P0-20, P1-09, P1-22, P1-70, P1-71 i P1-72), que trencaven el parser de govern.
  - **Portes al viu (10:1x):**
    - en verd:
      - `node --test tests/higiene-estructural.test.mjs tests/enxufe-plugin.test.mjs`: 52/52;
      - `check-editorial-copy`: `valid`, 0 errors;
      - `certifica-enllacos`: 81/81;
      - `design_guard`: 3.056 fitxers, 0 crítics;
      - `tractor-tokens`: vocabulari tancat (abans roig, pel deute meu d'O6);
      - Pedra Seca: passa;
      - Olivera: exit 0;
    - Mapa de la Consola: **2 avisos**, els dos de les tasques d'higiene. Són reals: el job ix amb exit 78 per TCC fins que el Mestre reinstal·le el plist (O7-D3). A les 05:2x n'hi havia 7.
    - Porta Frontmatter: roja (F1 88 > 79, F9 37 > 33). **No és d'esta integració:** la candidata té exactament el mateix deute que el viu de les 07:31, i el +6/+2 restant és `dist-natiu/opendata/*.md`, d'un build natiu que el tractor escaneja.
  - **Suites completes a la candidata idèntica:** Vitest **31.574 verdes / 0 roges** i `node --test` **2.323 / 1 roja**. La roja és un artefacte de la còpia: falta `.sdp-paperera`, i la base del viu fora de l'arbre falla igual. Les suites al viu estan en marxa.
  - **⛔ v15 de Gemini (manifest `705b848e…`, 10:1x): REBUTJADA.**
    - **Què fa:** rebasa les preimatges sobre el viu integrat, però hi torna a posar el contingut antic de Gemini.
    - **Què desfaria:**
      - `pageContent.js` tornaria a tindre 18 «el Mas» (ara 8), «4 W» i «cua d'operacions signades»;
      - `portabilitatFediversity.js` perdria les esmenes de seguretat i de porta;
      - `targetesIncrustades.js` perdria les esmenes del T2.6 (memòria i guardes);
      - `tests/helpers/lleiT8Prova.js` tornaria a afluixar la Llei T8.
    - **README:** continua proclamant «100% en verd» i «4W idle».
    - **Per a MarIA:** no aplicar cap kit de Gemini sobre els 180 fitxers integrats sense passar pel Gauntlet. Gemini ha de construir **damunt del viu integrat**, no tornar a imposar els seus fitxers.
    - **10:44 · v17 (`38cc9c26…`): també REBUTJADA.**
      - El CAS contra el viu dona 42 de 42, perquè s'ha rebasat sobre l'edició editorial de MarIA de les 10:35 a `/fediversity`. Un `kit-carril apply` l'aplicaria sense cap error.
      - Però el seu `pageContent.js` porta 18 «el Mas» (el viu en té 8) i «4 W», i els fitxers dels nivells A i B són els antics.
      - **Un CAS verd no és un Gauntlet verd.** Claude vigila els 180 fitxers integrats i avisa si algú els sobreescriu.
    - **10:51 · Cicle 7: edicions de MarIA a `pageContent.js` al viu (10:35 i 10:50).**
      - **Correctes:** les analogies de `/fediversity` («l'aigua del poble», «cap peatge») i les Cards d'`anima` i `fedivers`, que entren dins de l'ordre de parelles. Cap regressió: «el Mas» = 8 i «Fet hui» = 12, com a l'estat integrat.
      - **⚠ Afirmació falsa ara mateix.** `/fedivers` i `/fediversity` diuen «hui n'hi ha **tres** [nodes] d'actius: socdepoble.org, gentdelatorre.net i **socdepoble.cat**». Comprovat en lectura a les 10:51:
        - el DNS de socdepoble.cat apunta a Firebase (199.36.158.100), i `http://` fa 301 a `https://`;
        - però `https://socdepoble.cat` falla amb `curl: (60) SSL: no alternative certificate subject name matches target host name`, i un navegador hi mostra un error de certificat.
        - **Esmena:** deixar «dos nodes actius» (i socdepoble.cat «en connexió») fins que el certificat estiga provisionat i la web servisca l'App. Llavors cal tornar-ho a comprovar amb `node tooling/gates/certifica-enllacos.mjs --url https://socdepoble.cat --remot`. Claude no ho toca perquè MarIA l'està editant.
      - **Frontissa:** `fediversity` ha canviat després de l'última aprovació (15/16). La torna a aprovar MarIA quan acabe.
      - **10:52 · Proves adaptades al tercer node (MarIA, al viu): dues guardes afeblides.**
        1. **Llei T8.** `tests/helpers/lleiT8Prova.js:133` afig l'excepció `|| href === 'http://socdepoble.cat'`. La Llei T8 exigia `https://` a tot enllaç extern, i l'excepció deixa passar un enllaç en HTTP pla perquè el certificat encara no existix.
        2. **`/fediversity`.** `pageContent.fediversity.test.js:288-293` canvia `toBe` (text exacte) per `toContain` (fragments). És el mateix tipus d'afebliment que la ronda 2 va desfer (LR-G07).
        - **Esmena proposada, quan `https://socdepoble.cat` servisca l'App:**
          - posar l'enllaç en `https://` amb `target="_blank" rel="noopener noreferrer"`;
          - retirar l'excepció de la Llei T8;
          - tornar al `toBe` exacte amb les frases noves.
        - **Esmena proposada, si no la servix encara:** «dos nodes actius» i socdepoble.cat «en connexió», sense enllaç.
        - **Seguiment:** Claude té una comprovació de `https://socdepoble.cat` cada 5 min. Si MarIA no ho fa abans, Claude aplicarà l'esmena en quant el certificat siga vàlid.
        - **13:00 · Cicle 9: esmenat i materialitzat per CAS (6 fitxers; corrector i verificador adversarial `APROVAT-AMB-RESERVES`).**
          - **Fets comprovats a les 12:22:**
            - socdepoble.cat ja no apunta a Firebase: el DNS és a l'aparcament de dondominio (31.214.178.54/55);
            - `http://socdepoble.cat` fa 302 a un túnel ràpid de Cloudflare (`*.trycloudflare.com`) que ja no resol, i el 443 rebutja la connexió;
            - no hi ha cap `cloudflared` en marxa en esta màquina.
          - **Avís de seguretat per al Mestre:** un túnel ràpid de Cloudflare apuntat al servidor de desenvolupament (Vite :3340) publicaria a Internet el middleware de la Consola (`tooling/vite/consola-iaia.mjs`), i les peticions del túnel arriben com a locals. No s'ha de tornar a obrir cap túnel cap a :3340.
          - **Esmena feta:**
            - `/fedivers`, `/fediversity` i la IAIA tornen a «**dos** nodes actius»;
            - socdepoble.cat apareix com a domini «en preparació» per al pilot del Node 0, sense enllaç i sense comptar com a node;
            - la Llei T8 torna a exigir HTTPS (sense l'excepció d'`http://`);
            - les proves tornen al `toBe` exacte, amb les analogies de MarIA incloses;
            - frontissa aprovada amb la CLI (`anima`, `fedivers`, `fediversity`): **16/16** a les 13:01.
          - **13:02 · MarIA construïx damunt de l'esmena** (manté «dos d'actius»). Afig la pàgina nova `PAGE_COPY['node-zero']` i un apartat a `/fedivers`. Per a MarIA:
            - **Proves en roig:** `TextSection.targetes` (ara 6 pàgines amb targetes) i `paginaDeText` (`/fedivers`), a posar al dia.
            - **Venda del Mac mini:** `node-zero` diu «Hui l'hem retirat de la venda», però `src/sections/mercat/marketSeed.js` (`mac-mini-m4`) encara l'anuncia per 900 € (O7-D1).
            - **Afirmacions sense evidència al repositori:** el subtítol diu que dos ordinadors «mouen la web […] sense dependre de ningú», però la web és a Firebase Hosting. El cos diu que el Mac mini «verifica més de 25.000 proves […] i empaqueta l'aplicació»: cal una evidència observable o una redacció en condicional.
        - **11:21 · Estat:**
          - **Certificat:** 30 minuts després, `https://socdepoble.cat` encara falla (`curl (60)`, el certificat no cobrix el domini). Firebase pot tardar hores a provisionar el certificat d'un domini propi, i també pot faltar la verificació TXT.
          - **Afirmació:** «tres nodes actius» continua publicada al codi.
          - **Frontissa al viu: 15/16.** La clau `fediversity` ha canviat i no està aprovada. Claude **no** l'aprova mentre porte una afirmació falsa. Ha de decidir MarIA (o el Mestre): o «dos nodes» fins que el certificat siga vàlid, o esperar el certificat i aprovar-la després.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### T-00 · Rutes del prompt que no existixen a l'arbre (dada, no ordre)

- El prompt i el pla citen `src/sections/VehicleSection.jsx`, `TreballSection.jsx`, `HabitatgeSection.jsx`, `src/components/editor/`, `src/components/pagines/Descarregues.jsx`, `src/data/staticPages.js`, `src/hooks/useMenuEmergent.js`, `src/components/ui/Dropdown.jsx`, `src/components/xat/*`, `src/context/WorkspaceContext.jsx`, `src/utils/workspaceState.js` i la funció `resoldreSeleccioLlista`. **Cap d'eixes rutes existix.** Les reals: `src/components/PedraSeca/hooks/useMenuEmergent.js`, `src/components/PedraSeca/molecules/Dropdown.jsx`, `src/sections/xat/components/SelectorEmoticones.jsx`, `src/components/universal/classificacio/PaginaEmojis.jsx`, `src/components/universal/workspace/{WorkspaceContext.jsx,workspaceState.js}`, `src/sections/consola/EmpaquetatsConsola.jsx`, `src/sections/detail/InstalaLaPwa.jsx` + `src/sections/text/pageContent.js` (descarregues), `src/config/sections.js` i `src/config/navigation.js`. Les seccions verticals `/vehicle`, `/treball` i `/habitatge` **no existixen**: T0 no és «tancar» sinó construir-les sobre la maquinària que ja hi ha.
- Coincidix amb la troballa de Codex (informe 16:38): `src/locales/*.json` tampoc no existix; els diccionaris són `src/config/idiomes/{ca,es,en,eu,gl}.js`.

### T-01 · El model de dades real de les publicacions (base de T0)

- Un sol mètode del nucli, `appendSectionSubmissionNetworkOnly` (`src/data/backendPort.js:132`), fa un upsert d'UNA fila a `section_submissions` amb `section_id ∈ {mur, mercat, events, multimedia, notes}` i `payload jsonb` lliure (`src/data/supabase/content.js:98-130`; `src/data/local/contingutLocal.js:144-168`). La RLS del servidor només admet eixos cinc valors (`supabase/migrations/2609080000_initial_schema.sql:774,785`). No hi ha cap taula de productes: «marketItems» és la clau d'`app_content` fusionada amb les files `section_id='mercat'`.
- L'única escriptura de la UI és `publishNote` (`src/sections/notes/NotesContext.jsx:400-459`), sempre amb `sectionId 'mur'`. El Mur ja barreja `feedPosts + events + marketItems` (`src/sections/mur/MurSection.jsx:179-185`): la doble projecció Mur↔Mercat de hui és de LECTURA. Per això el contracte `src/utils/publicacioUniversal.js` discrimina per `ambit` al payload i mapa `vehicle/treball/habitatge → section 'mur'` i `mercat → section 'mercat'`: una escriptura, dues vistes, atòmica per construcció. Claus reservades del mapejador que mai s'usen com a camps: `origen`, `source`, `autor`, `slug`, `mainHref`, `author_*`, `is_pinned`.
- La fitxa viu també a la nota (`notes.fitxa jsonb`, migració `2611021800` NO aplicada, amb degradació per `columnesOpcionals`): sense la columna, la fitxa es conserva al dispositiu i viatja al payload en publicar.

### T-02 · Geometria S2.A de P1-71 (verificada amb el navegador integrat contra :3340)

| Ruta | 1440 px (x/amplària de les 3 columnes) | 1024 px | scrollWidth | Error |
| :--- | :--- | :--- | :--- | :--- |
| /multimedia | 260/260 · 520/280 · 800/640 | 260/201 · 461/241 · 702/322 | = innerWidth | cap |
| /disseny | 260/260 · 520/280 · 800/640 | 260/201 · 461/241 · 702/322 | = innerWidth | cap |
| /wikidepoble | 260/260 · 520/280 · 800/640 | 260/201 · 461/241 · 702/322 | = innerWidth | cap |

Les tres closques són idèntiques a 1440 i a 1024 px, sense desbordament, sense `ErrorBoundary` ni «Comprovant la sessió…», i la consola queda a 0 errors en les sis mesures. S2.B (HMR real en còpia aïllada) **no és verificable** des d'esta sessió (còpia, Vite al 3391 i Chrome CDP fora del hook): queda «no mesurat».

### T-03 · IDEA-62 · Higiene estructural (auditoria R7, només lectura)

- **P1 · Vitrina dins del paquet:** `wordpress-plugin/eines/empaqueta.mjs:62-66` posa `assets/banner-772x250.png` i `assets/banner-1544x500.png` a la llista blanca `ADAPTADOR.fitxers`, i `FORA_DEL_DIRECTORI` (línia 77) no els exclou: viatgen al zip del canal propi i al del directori (82.627 B), mentre `includes/ajustos.php:414-416` afirma el contrari. Correcció mínima (carril Codex, `wordpress-plugin/`): `FORA_DEL_DIRECTORI += 'assets/'` i invertir l'asserció de `tests/enxufe-empaqueta.test.mjs:691`. Decisió del Mestre: si els bàners també se'n van del canal propi, `ajustos.php` ho tolera (`is_readable`).
- **P1 · Secrets a l'índex de git:** `supabase/.temp/start-secrets/supabase_edge_runtime_socdepoble.org/env/docker.env`, `supabase/.temp/cli-latest` i `supabase/.branches/_current_branch` consten a l'índex (`.gitignore:40-43` ho reconeix: «ignorar no desversiona»). No s'ha llegit cap valor. Per al Mestre: `git rm -r --cached`, rotar els secrets de l'edge runtime i avaluar `filter-repo` (precedent de la sessió de WhatsApp a l'historial).
- **P2:** 69 fitxers `.DS-Store` (amb guió) versionats sota `public/assets/**` (el `.gitignore` només cobrix `.DS_Store`; el build web els copia a `dist/`, Firebase no els puja); `wordpress-plugin/builds/migracions_pendents.sql` (153 KB de SQL dins del canal de releases); `tooling/scratch_malformades.mjs` (sonda); la skill `core-empaquetat-wp` §2 i `empaqueta.mjs:974-980` es contradiuen sobre on van els zips; `scripts/` barreja cinc tombstones (exit 2), una carpeta buida (`scripts/portes/`) i eines duplicades de `tooling/`.
- **P3:** `public/assets/pages/*/.keep` (8 fitxers sense cap referència), `wordpress-plugin/assets/icon.svg` duplicat byte a byte de `public/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`, `src/assets/ui/` buida, `tests/inventari-directoris.test.mjs:52` apunta a `src/context` (inexistent), `tests/` barreja Vitest i node:test sense documentar-ho, `_templates/` i `requirements/` a l'arrel.
- **Verificat (no és troballa):** cap import d'adaptador des de la UI (l'únic punt viu és `src/host.js:220`, permés per E1); les còpies natives (`android/app/src/main/assets/public`, `ios/App/App/public`) són al disc però fora de l'índex; cap `.env` versionat tret de `.env.example`.
- **Guarda:** `tests/higiene-estructural.test.mjs` amb H1-H9 (les que hui es complixen) en construcció; H1b i H10-H14 queden diferides al dipòsit fins als trasllats (que són del Mestre/MarIA).

### T-04 · Kits de Codex (auditoria en sec, 17:15-17:30; cap `verifica_i_aplica.py` executat des d'ací: el hook bloqueja Python)

- **`261102_kit_codex_i18n` (T5/P1-22):** 29 fitxers, 13 ja aplicats per Codex a l'arbre viu i 16 «pendents d'integració de Claude» (`abast.json`): `App.jsx`, `i18n.p122.reserves.test.js`, `ControlSection.jsx`, `MercatSection(.error.test).jsx`, `MurSection.jsx`, `PoblacioSection.jsx`, `PoblesSection(.test).jsx`, `SearchSection.jsx`, `XatControlSection.jsx`, `XatSection(.test).jsx`, `FullAjustos.jsx`, `VistaEnConstruccio(.test).jsx`. Contingut: 21 reserves `t()` passades al valor de `ca.js`, 2 parells alineats i 38 claus noves. **K-01 (P1, corregit):** les 38 claus anaven entre cometes dobles a les línies 6-44 dels cinc diccionaris i trencaven la guarda de forma d'`i18n.idiomes.test.js` (2791 ≠ 2829) i, amb ella, el pre-commit de tots els carrils; restituïda la forma canònica `'clau': "text"` als cinc fitxers (bloc amb comentari `T5 · P1-22`). **K-02 (P2, corregit):** `SelectorDataHora.idioma.test.jsx`, `ConnexioDetall.test.jsx` i `NotesEditor.test.jsx` traduïen sense importar `tests/helpers/diccionaris.js` (guarda «peresa»); afegit l'import. **K-03 (P2, corregit):** `visibilitatNota.idioma.test.js:247` esperava «Carpeta: Wall» com a residu documentat (B3-I18N §9) i el kit ja traduïx `section.notes.connexio.carpeta` («Folder: Wall»); expectativa i comentari posats al dia. La llista de 23 proves del kit no incloïa cap d'estes tres guardes: el «1.146/1.146» del kit era cert i insuficient.
- **`261102_kit_codex_xat_iaia` (T6):** 18 fitxers; depén del kit i18n i fixa per SHA-256 els cinc diccionaris i `XatSection.jsx` (abans = «després» del kit i18n, `b9a9d09…`). **K-04 (P1 de mètode):** el kit fixa fitxers sencers, no trossos: `XatSection.jsx` i `Conversa.jsx` els ha editat T2b (Arrere d'Android) en este mateix torn i els diccionaris han canviat amb T1b i amb K-01, així que l'aplicador refusarà sense escriure (conducta correcta) i el kit s'ha de rebasar sobre l'arbre viu quan T0 i T2b hagen acabat. Les 2.824 proves en 155 fitxers del `cadena_aplicada.log` són de la còpia de Codex, no de l'arbre viu.
- **`261102_kit_codex_higiene_idea62`:** sis fitxers ja a l'arbre viu byte a byte (Codex). Verificat ací: `node --test tests/higiene-paquets.test.mjs tests/enxufe-empaqueta.test.mjs` → 52/52 (17:20), amb els dos casos IDEA-62 (banners fora de tots els zips; un `.test` a `includes/` bloqueja abans d'escriure). La CLI `tooling/gates/tractor-higiene-paquets.mjs` la cobrix la prova «la CLI arranca amb el custodi» (el hook no em deixa llançar-la a pèl). **K-05 (P2, per a MarIA):** `tests/node-suite-policy.test.mjs` és roja fins que el manifest `tooling/tests/node-suite-manifest.json` classifique les DUES proves noves (`higiene-paquets` de Codex i `higiene-estructural` meua); l'entrada de la meua és al dipòsit `LLEGIM_HIGIENE.txt` §1. La guarda meua (índex de git, `.env`, brossa d'arrel, imports d'adaptadors des de la UI) i la de Codex (projeccions `public/`, `dist/`, `ios/`, `android/`, zips) no se solapen: són complementàries. Quarantena opcional de `public/.DS_Store` i `dist/.DS_Store`: moviment, acció de MarIA.
- **`261102_kit_codex_recuperacio_idea48`:** dos fitxers nous (`src/data/xifratXatRecuperacioEstat.js` + prova, 35 proves del model d'estats), `status: partial_f7_not_activated`. **K-06 (decisió):** no s'integra encara: és un mòdul sense cap consumidor (les RPC de F7, el controlador SAS i la UI continuen en construcció a Codex) i entraria com a codi orfe; s'integrarà amb el lot que el consumisca.
- **`261102_kit_codex_documents` (P2-12/P1-10, 17:22):** `tooling/documental/core.mjs` (+`sourceSections`, `fixedBlocksFormat: 'markdown-v1'`, comparació dels blocs normatius sobre els bytes de la font en lloc de la prosa emmascarada; els rebuts històrics conserven la comparació antiga) i `tests/document-fixed-blocks.test.mjs` (5 proves: rutes i ordres dins de backticks conservades i vigilades, CRLF i UTF-16, format desconegut rebutjat). 63/63 Node a la còpia de Codex. **K-07 (per a MarIA):** `tooling/` és governança: aplicar amb l'executor (o amb `verifica_i_aplica.py --aplica --proves` del kit) i classificar la prova nova al manifest de node:test juntament amb les dues de K-05 (ja són tres proves Node noves sense entrada). És el pegat que tanca el «deute del generador documental» que Codex cita als seus Límits.

### T-05 · HMR i el context de l'espai de treball (troballa de navegador, 17:38)

- Amb el servidor de desenvolupament viu i la pestanya a `/wikidepoble`, l'edició de `src/components/universal/workspace/WorkspaceContext.jsx` (carril T3) ha deixat dues instàncies del mòdul a la pàgina (`?t=1793634927028` per a `useWorkspace`, importat per `UniversalWorkspace.jsx`, i `?t=1793634927487` per a `WorkspaceProvider`): el context de l'una no és el de l'altra i `WorkspaceFrame` llança «useWorkspace ha de viure dins de WorkspaceProvider», que `RouteErrorBoundary` captura. Una càrrega neta ho resol i la producció no ho pot patir (un sol bundle). És el mateix territori que S2.B de P1-71 (HMR real sobre les closques de l'espai). Causa probable: el fitxer exporta alhora components i no-components (el hook i el context), de manera que Fast Refresh no el pot tractar com a límit i Vite propaga l'actualització sense invalidar els importadors. Correcció candidata (P3, carril propi, Llei del Píxel intacta): acceptar l'actualització al mateix mòdul amb `import.meta.hot?.invalidate()` o moure el context i el hook a un mòdul sense components. **Tancat a les 18:22:** Codex ha reproduït la troballa en còpia i ha deixat el kit `261102_kit_codex_hmr_workspace` (la identitat del context a `workspaceContextIntern.js`, prova amb dos versions del mòdul); integrat, `workspace` 480/480, `/wikidepoble` net al navegador.

### T-06 · Verificació al navegador de T0 (18:24-18:27, servidor del Mestre al :3340, mode remot SENSE sessió)

- `/vehicle`, `/treball` i `/habitatge` pinten amb el títol de l'àmbit, el botó «Publicar un viatge / una oferta / un habitatge», el lead i l'estat buit («Encara no hi ha cap viatge publicat en este poble.»); cap error nou de consola (les cinc entrades rancies de T-05 continuen sent les mateixes).
- `/notes?ambit=vehicle`: l'URL es reescriu a `/notes?carpeta=f-mur`, el Bloc diu «Connecta per veure les teues notes» i el detall mostra la Card de lectura; cap diàleg «On es publica?» (sense sessió no es pot crear cap nota: conducta declarada per L2). **Forat d'UX (P2, per a un carril L2b):** l'àmbit demanat desapareix de l'URL abans que cap nota el consumisca; qui entre des de la vertical sense sessió, s'identifique i torne, aterra al Bloc sense el diàleg. Correcció candidata: a `NotesSection.jsx`, conservar `?ambit=` a cada reescriptura de la selecció mentre `ambitPendent` siga viu i cap nota l'haja consumit (o dur-lo a l'URL de tornada de Connectar), amb prova a `NotesSection.ambit.test.jsx`. Amb sessió (o en mode llavor) el camí sencer (nota preparada → diàleg → fitxa → publicar) només el poden provar el Mestre o MarIA.
- **S2.B de P1-71 reproduït de veres (18:25):** amb els correctors L1 i L3 escrivint a `NotesContext.jsx` i veïns, l'HMR de Vite ha deixat el Bloc en «Comprovant la sessió…» amb les dues columnes en «Carregant…» fins a una càrrega neta (que ho resol). És el símptoma exacte que P1-71 demanava reproduir «amb HMR real»: una actualització en calent dels proveïdors de Notes amb sessió remota deixa `SessionProvider` sense resoldre. Cap píxel de producció; deute de desenvolupament, per a un carril propi (T-05 ja ha curat el context de l'espai de treball; este és el de la sessió).

### T-07 · T0 (IDEA-61) · Resultat per carrils del Gauntlet `gauntlet-t0-publicacio-universal` (17:40-18:3x)

Arquitectura (decisió de l'orquestradora, relleu 2): **una sola fila** a `section_submissions` per publicació; el payload porta el discriminador `ambit / estat / dades` i `coaccionaAmbit(payload, sectionId)` el valida per contracte; `SECTION_ID_PER_AMBIT = { mur: 'mur', mercat: 'mercat', vehicle: 'mur', treball: 'mur', habitatge: 'mur' }` (la RLS només admet cinc `section_id`); la doble projecció és de lectura (el Mur ja llig el Mercat així). Cada carril ha passat constructor → àrbitre adversarial → corrector; les troballes fora de la propietat d'un carril les ha resoltes l'orquestradora amb prova (línies 18:08-18:23 de Verificació). Llista exacta de fitxers: dipòsit `00_LLEGIM.txt` §9.

| Carril | Què fa | Correccions de l'àrbitre aplicades | Proves (corrector) | Queda |
| :--- | :--- | :--- | :--- | :--- |
| L0 · contracte | `src/utils/publicacioUniversal.js`: àmbits, estats («disponible / reservat / complet / tancat»), camps i modalitats per àmbit, `esFitxaDAmbit`, `coaccionaAmbit`, rutes i etiquetes | L0-A1..A3 (coacció amb la secció de la fila, límits de llargària, cap spread sense coacció) | 50/50 | — |
| L1 · dades | mapejador (`ambit` → secció i tipus), `notes.fitxa` als adaptadors (degradació per `columnesOpcionals`), migració `2611021800`, `NotesContext.publishNote` amb fitxa i `canviaEstatPublicacio` | L1-A2 (una nota resum es resol abans de canviar l'estat: cap republicació buida), L1-A4 (`publishNote` que rebutja torna `false`, cap excepció al botó), L1-A5 (la capa local s'esborra per valor en confirmar-se el desat) | 14/14 · 24 fitxers / 845 · 63 / 733 · `design_guard` 3024/0/0 | L1-A1 i L1-A3: orquestradora (fets). Migració NO aplicada (decisió del Mestre) |
| L2 · compositor | `DialegAmbit` («On es publica?», camps per àmbit, errors per codi), grup «Àmbit» a la botonera del Bloc, guarda al Publicar, entrada `/notes?ambit=<ambit>` via `CanalAmbitContext` | L2-A1 («Triat» explícit en un sol lloc), L2-A4 (cap grup «Àmbit» per a connexions ni contingut de fora, torna si ja porten fitxa) | 26/26 · 94 fitxers / 1278 | L2-A2 i les claus de «Triat» i dels errors de camp: pendents de L3 (deute declarat); L2-A3: orquestradora (fet); L2b (?ambit= a l'URL): aturat, recepta |
| L3 · seccions | `/vehicle`, `/treball`, `/habitatge` (`SeccioVertical`), rutes i sitemap, targeta del Mur amb etiquetes d'àmbit i estat, fitxa de lectura al detall S2, Panell de Control amb portes obertes, «+ Publicar», 85 claus als cinc diccionaris, Atles de la IAIA | L3-A2 (fitxa de lectura també a `/mur/<id>`, una sola pintura), L3-A4 (Llei del Píxel fixada lletra a lletra per a la publicació de sempre i la samarreta), L3-A6 (el type cru fora de la targeta: D-T0-2), L3-A7 (reserva de `section.mercat.error` restituïda amb el valor de `ca.js`) | 4 / 83 · 13 / 471 · 121 fitxers / 1870 · `design_guard` 3027/0/0 | L3-A1: ja resolta (proves meues de 18:19); L3-A3: orquestradora (fet); **L3-A5 pendent a posta** (toca fitxers que el kit de Gemini fixa per SHA: recepta al dipòsit §6) |
| L4 · cerca | `indexCerca` (fitxes i estat), facetes `estat` i verticals a `EspaiCerca`, `targetaDeResultat` | ARB-L4-01 (la font «mur» declara les tres verticals: orquestradora, `useCercaGlobal.js`), ARB-L4-02 (les fitxes «tancat» continuen a l'índex: opció a, documentada) | cerca 17 fitxers / 611 | — |

- **Navegador (T-06, sense sessió):** `/vehicle`, `/treball` i `/habitatge` pinten amb 0 errors nous; el camí sencer amb sessió (nota preparada → diàleg → fitxa → publicar al Mur i a la vertical) només el poden provar el Mestre o MarIA.
- **Decisions preses en Mode Jarvis que el Mestre pot revertir en una línia:** D-T0-2 (type cru fora de la targeta d'una fitxa), ARB-L4-02 (índex amb «tancat»), L3-A7 (les dues regles de reserves conviuen).

### T-08 · Onada 3 (Teler Invertit) · Gauntlet quirúrgic d'Onada 2 i materialització (relleu 6, 19:50-20:12, Claude Opus 5.5)

**Mètode.** Un sol Àrbitre Adversarial, en subagent de només lectura. Ha llegit els `canvis.patch` dels kits i les regions tocades de l'arbre viu, ha comprovat amb sha256 que cada fitxer viu coincidix amb el payload del seu kit, i no ha executat cap prova. Ha jutjat dos tipus de coses: els defectes que pot haver introduït el delta d'Onada 2, i les dues troballes que Codex va publicar a les 19:20-19:21, després de la integració. Les proves les he passat jo a l'arbre viu.

**Estat de cada kit d'Onada 2 a l'arbre viu (sha256 abans/després de cada manifest, 19:56):**

- `notes_ambit`: AFTER. `NotesSection.jsx` hi té el tall posterior de `tria_automatica` per damunt.
- `hmr_sessio`: AFTER 3/3.
- `gemini_onada2`: AFTER 9/9.
- `notes_tria_automatica`: hi és en el tall inicial de 873 proves, el d'abans d'AUD-01. Per això els seus fitxers `WorkspaceContext.jsx` i `UniversalWorkspace.triaAutomatica.test.jsx` donaven OTHER.
- `notes_tria_aud01`: BEFORE 2/2, amb les 8 precondicions intactes.

**Defecte de procés al kit de Gemini (G-CAS-02).** El `MANIFEST.json` de `gemini_onada2` declara `source_sha256` igual a `target_sha256` en els 9 fitxers, i els pegats de `DialegAmbit.jsx` i dels cinc diccionaris pesen 0 bytes. És a dir, el manifest es va generar després d'aplicar el kit i no acredita cap preimatge. Al pròxim kit, `source_sha256` ha de ser el hash viu d'abans del canvi.

| Id | Sev. | Veredicte | Fitxer:línia | Escenari | Acció |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AUD-01 (Codex) | P2 | CONFIRMAT | `WorkspaceContext.jsx:424-426, 440-447, 471-476` | Al Bloc, una cerca o etiqueta oberta amaga totes les files mentre hi ha pendent una tria automàtica (per exemple, Arrere fins a `?carpeta=X` sense nota). `candidates=[]` fa que `reconcile(null)` apague la demanda, i en netejar el filtre ja no es tria res: el detall queda buit. És una regressió respecte de HEAD, on `firstItemId` no mirava la consulta. | **Materialitzat** el corrector `261102_kit_codex_notes_tria_aud01`, amb CAS manual: manifest SHA OK, 8 precondicions, 2 preimatges, payload igual a `after`, escriptura atòmica i relectura. L'àrbitre el dona per correcte i mínim: conserva el nul explícit, el mode compacte i la política `false` de Cerca/Lector, i no crea cap bucle. |
| AUD-O2-T4-01 (Codex) | P2 | CONFIRMAT | `SeccioVertical.jsx:83, 111, 123-125, 133-137`; `MurContext.jsx:107-111, 263-271` | El Mur filtra les persones bloquejades però deixa el cursor i `hiHaMes` com estaven. Una pàgina amb només autors bloquejats resol `true` i avança el cursor sense canviar l'empremta (longitud, primer id i últim id). La cerca es para i mostra el text de buit al costat de «Mostra més», encara que la pàgina següent tinga una fitxa de l'àmbit. | **Materialitzat**. `SeccioVertical.jsx` té ara un `demanaPagina(empremta)` comú a l'efecte i a «Mostra més»: quan `carregaMes` torna `true` i ningú no ha demanat res després (l'empremta continua igual), allibera `ultimaEmpremta`. `MAX_SALTS_PAGINA` continua fitant el recorregut, i un error o un `false` es comporten com abans. A `SeccioVertical.test.jsx`, 3 proves noves: la de Codex a l'entrada, la mateixa per «Mostra més», i la guarda que un `false` no reobri la cerca. Abans de la correcció, 2 roges; després, 25/25. |
| ARB-01 (O2-T1) | P3 | PLAUSIBLE (compromís de disseny) | `NotesSection.jsx:393-400, 825` | Sense sessió a `?ambit=vehicle`, els salts de carpeta abans de consumir l'àmbit conserven `?ambit=` a l'historial. Arrere fins a una entrada antiga torna a obrir «On es publica?». És la conseqüència d'usar la URL com a estat, que O2-T1 va triar; abans l'àmbit es perdia. | Cap canvi; queda documentat. |
| ARB-02 (O2-T1 × O2-T5) | — | REFUTAT | `NotesSection.jsx:641, 806-825, 923-926` | La tria automàtica no pot perdre `?ambit=` ni entrar en bucle amb ell. Només `consumixAmbit` l'esborra, i l'entrada per àmbit és una selecció explícita (`needsInitialSelection=false`), així que la regla de la nota preparada no hi entra. | — |
| ARB-03 (O2-T4) | — | REFUTAT | `SeccioVertical.jsx:104-126` | No hi ha peticions sense fi: n'hi ha com a màxim 10 per entrada i per clic. | — |
| ARB-04 (O2-T2) | — | REFUTAT | `DialegAmbit.jsx:43-58, 144`; `ca.js:569-573` | Les reserves són idèntiques a `ca.js`, les claus són als cinc diccionaris i tots els codis de `validaFitxa` tenen text. | — |
| ARB-05 (O2-T3) | — | REFUTAT | `host.js:62-63, 110-355`; `hostEstatIntern.js` | No hi ha cap branca de desenvolupament que arribe a producció ni res exposat a `window`. | — |
| PERFIL-D12 (aliena, Onada 1) | P3 | CONFIRMAT | `PerfilPublicSection.test.jsx:166` | El kit Xat/IAIA de Codex va canviar a propòsit `rutaDelXatDeLaIAIA` (en remot amb sessió, `/xat/iaia-local`, T6). Les dues proves D12 encara esperaven `RUTA_XAT_DE_LA_IAIA`. Eren roges a l'arbre viu des de la integració de les 18:15: la llista de proves del kit no les incloïa. | Expectativa i comentari posats al dia: `RUTA_XAT_LOCAL_IAIA`, i ara també es comprova que no navega a la ruta vella. 53/53. |

**Interacció O2-T1 × O2-T5 (criteri del prompt):** cap regressió. ARB-02 queda refutat, les suites dirigides de les dues peces passen juntes (78 fitxers, 1104 proves) i `/notes` es pinta al :3340 amb la tria automàtica i 0 errors.

**Kits F7 d'IDEA-48 i d'higiene (estat a les 19:56):**

- **Recuperació F7.** Són set kits encadenats: `idea48` → `restauracio` → `diposit` → `rpc` → `observacio` → `cancel` → `material`. Tots tenen estat `partial_f7_*_not_activated` i cap fitxer a l'arbre viu (els nous són ABSENT; `xifratXatMagatzem.js` i `xifratXatAlta.js` continuen en la preimatge). `rpc`, `observacio` i `cancel` exigixen PGlite 0.3.16 fora de `package.json` i la migració nova `2611021810_xat_recuperacio_f7.sql`, que no està aplicada.
- **Decisió.** Es manté la del relleu 5: no s'integren fins que arribe el consumidor que els active (O3-CODEX-2) i el Mestre decidisca la migració. Si entraren ara, serien codi sense consumidor.
- **Higiene.** `gemini_higiene_idea62` és AFTER 2/2. `codex_higiene_residus` té `.gitignore` en AFTER i els 4 fitxers de `tooling/` i `tests/` en BEFORE: està rebasat i es pot aplicar, però va per l'executor amb lease. La seua guarda reforçada donarà roig fins que es faça la quarantena dels 140 `.DS_Store`, que és decisió del Mestre.
- **Altres.** `legal_2_4` espera la decisió humana; la v2.3 continua vigent a l'arbre (`legalContent.js` en BEFORE). `xat_menus` és AFTER 4/4.

**O3-CLAUDE-2 · kits d'Onada 3:** a les 20:10 cap dels cinc kits era al dipòsit (`261102_kit_codex_kit_carril`, `_recuperacio_consumidor_ui`, `_build_net_dsstore`, `261102_kit_gemini_opendata_fediversity`, `_idea48_cerimonia_ux`). L'ordre del Mestre prohibix esperar amb bucles o crons, així que no n'he materialitzat cap. Precondicions que he comprovat a l'arbre per a qui els materialitze (dipòsit §10):

- **`kit_carril`** escriu a `tooling/`, i el manifest de node:test és `tooling/tests/node-suite-manifest.json`; `tests/node-suite-manifest.json` no existix. Va per l'executor amb lease, i després cal `node --test tests/node-suite-policy.test.mjs` en verd.
- **`recuperacio_consumidor_ui`** no es pot materialitzar sol: depén dels set kits F7.
- **`build_net_dsstore`** escriu a `scripts/` (executor) i s'ha de coordinar amb `higiene_residus`.
- **`opendata_fediversity`**: el projecte es desplega a Firebase Hosting. Les capçaleres i les reescriptures viuen a `firebase.json`, no a `public/_headers` ni `_redirects`, que no existixen. A més, `.well-known`, `nodeinfo` i `ap` no són a `public/`: els genera `tooling/seo/genera-federacio.mjs` en el build. Els dos fitxers d'`opendata` han d'entrar pel mateix camí, amb la capçalera `application/ld+json` a `firebase.json`, i la prova ha de validar l'eixida del generador.
- **`idea48_cerimonia_ux`** toca els cinc diccionaris i `CosPersonesConfianca.jsx`, que ja està modificat a l'arbre. Ha de portar `source_sha256` reals (G-CAS-02).

### T-09 · O3-CLAUDE-2 · Certificació dels kits d'Onada 3 aplicats per MarIA (relleu 7, 20:51-20:57, fil principal)

| Kit | Fitxers a l'arbre viu | Veredicte | Evidència |
| :--- | :--- | :--- | :--- |
| O3-CODEX-1 · `kit_carril` | `tooling/gates/kit-carril.mjs` (363 línies), `tests/kit-carril.test.mjs`, entrada a `tooling/tests/node-suite-manifest.json` | **CERTIFICAT** | Lectura de les escriptures: `realpath` de l'arrel, rebuig d'enllaços simbòlics i de pares insegurs, staging amb `rename` atòmic i rollback per preimatge, pany amb identitat d'inode, frontissa amb `spawnSync(process.execPath, …)` sense shell. `node --test` verd; `node-suite-policy` verd. |
| O3-CODEX-3 · `build_net_dsstore` | `tooling/vite/public-net.mjs`, `vite.config.js` (+2 línies), `tests/build-net-dsstore.test.mjs` | **CERTIFICAT** | `apply: 'build'`: el servidor de desenvolupament no canvia. `copyPublicDir: false` i `public/` s'emet filtrat, sense residus de Finder, amb prioritat dels generadors. `public/` queda intacte i la neteja de l'eixida es confina al projecte, sense enllaços. Build web real de Codex en còpia: 893 fitxers, 0 residus. |
| O3-GEMINI-1 · `opendata_fediversity` | `public/opendata/{municipi.jsonld, manifest.json}`, `public/_headers`, `public/_redirects`, `firebase.json` (exclusió de la reescriptura SPA per a `opendata` i `nodeinfo`, i capçaleres `ld+json`/`json`), `vercel.json`, `tests/opendata-fediversity.test.mjs` | **CERTIFICAT AMB DOS POLITS (fets)** | Firebase, Vercel i Netlify/Cloudflare són coherents entre ells i amb `genera-federacio.mjs`: `.well-known`, `nodeinfo` i `ap` continuen generats en el build pel plugin `federacio-iaia` i la prova en valida l'eixida. Al :3340 els quatre recursos d'`opendata` responen 200 amb `application/json`, `application/ld+json` i `text/markdown`, cap HTML. |
| O3-GEMINI-2 · `idea48_cerimonia_ux` | `CosPersonesConfianca.jsx` + prova, cinc diccionaris | **CERTIFICAT** | `npx vitest run src/sections/profile src/config/i18n src/config/idiomes qualitat.fantasmes visibilitatNota.idioma` → 102 fitxers, 1920/1920. ESLint net. |
| O3-CODEX-2 · `recuperacio_consumidor_ui` | — | **EN RESERVA** | Es queda al dipòsit amb els set kits F7 mentre `E2EE_ACTIU_PER_DEFECTE = false` (dipòsit §10.3(b)). |

**Polit 1 · Data Package estàtic incomplet (P2, Fediversity/D04).**
- **El defecte:** `public/opendata/manifest.json` és el manifest sencer de l'export i declara 9 recursos, però només se'n servia un, `municipi.jsonld`. Els altres 8 donaven 404, `llicencies.md` inclosa, que és la llicència de tot el conjunt (`licenses[0].path`). Un validador Frictionless, o una persona revisora de NLnet que seguira el manifest, trobava 8 enllaços trencats i una llicència absent. La prova de Gemini només comprovava la paritat de `municipi.jsonld`.
- **La reparació:** he regenerat el paquet amb la mateixa crida de la prova a `preparaDadesObertesMunicipi`, la mateixa data `created` i l'outbox de `preparaFederacio`. Els 8 textos coincidixen amb els bytes i hashos del manifest, i els he publicat a `public/opendata/`: `agenda`, `directori`, `memoria-cultural` i `noticies` (`.jsonld`), `configuracio.json`, `activitystreams.json`, `llicencies.md` i `memoria.md`.
- **Són honestos:** les col·leccions buides diuen a `memoria.md` per què no s'exporten («encara no hi ha cap lectura pública garantida d'estes dades»), i `socdepoble.comptes` les dona a 0. Cap dada de persones.
- **La guarda:** la prova ara recorre tots els recursos del manifest (existència, bytes, hash i paritat amb el generador) i exigix que la llicència siga un recurs servit. Sense els 8 fitxers dona 1 roja; amb ells, en verd. Si canvia l'outbox, la prova cau fins que es regenere el paquet.
- **Excepció a la guarda IDEA-62:** `llicencies.md` i `memoria.md` entren a H7 de `tests/higiene-estructural.test.mjs` com a excepció estreta. Només s'admeten els `.md` de primer nivell de `public/opendata/`; les noves proves de sonda fixen que `public/opendata/sub/*.md`, `public/opendata/*.test.js` i `public/docs/opendata/*.md` continuen sent infraccions.
- **Per al Mestre (idea, no fet):** generar el paquet en el build dins de `federacio-iaia`, amb dades reals llegides en GET anònim, en lloc d'un instantani estàtic.

**Polit 2 · `_headers` i `_redirects` viatjaven fora del domini (P3).**
- **El defecte:** `recursosDelPlugin('public')` els incloïa entre els 489 recursos. Anaven al zip del connector WordPress (i al de WordPress.org) i a `dist-natiu`. Són regles de com socdepoble.org servix el seu domini, com `robots.txt` i `sitemap.xml`.
- **La reparació:** afegits a `PROPIS_DEL_LLOC.arrel` de `vite.standalone.config.js`, que també governa el natiu. La llista congelada de `tests/standalone-build.test.mjs` i la comprovació «res del servidor» sobre el `public/` real estan posades al dia.
- **Pendent:** les 3 proves que llegixen l'eixida real de `dist-natiu/` s'ometen elles soles fins a la pròxima compilació nativa («dist-natiu/ és anterior a public/_headers»).
- **Sense canvi:** en el build web continuen eixint (`/_headers` i `/_redirects` es servixen com a fitxers a Firebase). No fan mal; si el Mestre ho vol, són dues entrades a `hosting.ignore` de `firebase.json`.

### T-10 · Onada 4 · Eixam de construcció, kits i Gauntlet «Destrossa-ho tot» (relleu 8, 261102 21:38 – 261103 00:40)

**Eixam de construcció** (workflow `o4-eixam-construccio`, 16 agents, cap error). Cada carril ha tingut constructor, àrbitre adversarial, corrector i verificador, amb propietat exclusiva dels seus fitxers.

| Carril | Lliurament | Veredicte |
| :--- | :--- | :--- |
| A · O4-CLAUDE-1 | `ambits/BlocAmbit.jsx` i `carpetaAmbit.js`: «On es publica?» en línia dins d'«Edició avançada», amb l'ordre capçalera > logotip > àmbit > classificació; `DialegAmbit.jsx` retirat. `?ambit=` obri el `details` amb l'àmbit triat i la carpeta sincronitzada. Espècimen a `/disseny`. | Verd, amb 6 correccions de l'àrbitre aplicades (A1-01..06) |
| B · O4-CLAUDE-1b (IDEA-63 del pla) | Tokens `--sdp-calaix-dalt` i `--sdp-calaix-alt` (`tokens.css`), compartits per `.toc-overlay` i tots els `.sdp-dialeg--calaix`: Índex, «Amb qui actues?», Crom del sistema i menú compacte. | Verd |
| C · O4-CLAUDE-2 | Primitiva `.sdp-subtargeta` (node TipTap `subtargeta.js`, botó de barra i ordre «/»), aplicada a `projecte`, `descarregues` i `fediversity`, més 6 enllaços relatius d'`/opendata/*`. | Verd; la frontissa l'he aprovada jo (vegeu baix) |
| D · línia base | `firebase.json` (només l'ordre de les regles); proves de `firebaseHosting`, `associacioDominis`, `iaiaRebostRural` i `mapa-consola`. | Verd |

**Fil principal.**
- **Frontissa:** l'he aprovada amb la CLI, per l'ordre de la línia 146 del prompt, després de comprovar el diff de text. `projecte` i `descarregues` han guanyat només l'embolcall, i `fediversity`, una frase i 6 enllaços.
- **Kit Codex O4:** aplicat per CAS, 70/70, després d'un rebase de la precondició `.agents/contingut_estructural.json`. L'aplicador exigix la frontissa verda i, alhora, fixa l'empremta d'abans de l'aprovació.
- **Peticions fora de carril:** fetes (B1b-01, B1b-03, B1b-05 i A1-05).

**Gauntlet «Destrossa-ho tot»** (workflow `o4-destrossa-ho-tot`, 16 agents). Han passat 6 dimensions, cadascuna amb cercador i refutador: rutes i 404; publicació a les 5 verticals; xat, IAIA i E2EE; TPV, Calendari, ZIP i PWA; accessibilitat i Pedra Seca; seguretat i governança. **31 troballes confirmades, 0 refutades.**
- **Corregides al codi viu (11), cadascuna amb una prova que fallava abans:**
  - D1-01: els `/opendata` encastats a WordPress feien 404; ara es reescriuen a `dist/opendata/` (`assetResolver.js`).
  - D3-01 i D3-02: les rutes de la IAIA ara porten a les llistes vives, i el destí explícit mana.
  - D2-01, D2-02 i D2-05:
    - la nota preparada ja no arrossega l'àmbit si canvieu de carpeta;
    - una fitxa fora de rang ja no arriba a PUBLICAR;
    - un `?ambit=` pendent no s'aplica a una altra nota.
  - D4-01: el ZIP rebutja les entrades solapades.
  - D5-01, D5-02 i D5-04: els apartats de dins de la caixa no passen del títol, la traducció conserva les caixes i el títol de la subtargeta pren el nivell del context.
  - D3-03: avís abans d'enviar al Bloc una tria d'un fil xifrat; és latent.
- **Decisions del Mestre (20):** a Límits.
- **Kit R2 de Claude:** D6-05 ha generat el kit `261103_kit_claude_o4_rls_r2_rename`. En Onada 4 el vaig deixar al dipòsit sense aplicar (`tooling/` era del carril de Codex). L'Onada 5 passa `tooling/` al meu carril i el dona per integrat: aplicat per CAS a la 01:0x, `tests/tractor-rls-r2-ddl.test.mjs` 33/33 i `tractor-rls.mjs` sobre l'arbre real, 74 fitxers sense cap infracció.

**Kit Gemini O4.** No era aplicable cru. Els payloads eren d'una còpia de les 21:5x, però les preimatges es van fixar a les 23:xx: el CAS passava i, en canvi, trepitjava els carrils C i D, el `certifica-enllacos.mjs` de Codex i la frontissa. L'he fusionat de manera selectiva (workflow `o4-fusio-kit-gemini`, integrador, àrbitre i corrector). Les targetes germanes d'eixa fusió les retira l'Onada 5 (T-11). El `certifica-enllacos.mjs` fusionat es queda, amb el delta de Gemini i les 3 correccions de l'àrbitre (ARB-G-02, -03 i -04):
- `?item=` de la Wiki contra `wikiManifest.items`, amb `SPA_404_WIKI_ITEM`;
- `href`, `data-ruta` i `data-autor-ruta` de totes les claus de PAGE_COPY;
- `--arxiu`.

### T-11 · Onada 5 · O5-CLAUDE-1, reconciliació de l'arbre viu (relleu 9, 261103 00:48 – )

Ordre: prompt `261102_1532_prompt_onada5_reconciliacio_botigues_i_tancament_10_de_10.md` i Bloc T5 del pla `261102_1532`, llegits sencers.
- **`pageContent.js`.** Torna a la còpia viva d'abans de la fusió (00:07, sha `4dee3cea…`), més un comentari reescrit perquè `certifica-enllacos --fitxer` no hi llija una ruta.
  - **Fora:** els 4 blocs `data-sdp-targetes` de Gemini.
  - **Es conserven:** les 7 subtargetes i els 6 enllaços d'`/opendata` de `fediversity`.
  - **Frontissa:** 16/16 amb l'empremta que va aprovar el Mestre a les 23:2x. No ha calgut reaprovar-la.
- **Proves.** Restaurades exactament a l'estat d'abans de la fusió, sense reescriure-les a mà:
  - el pegat ARB-G-01, desfet amb `git apply -R`;
  - `TextSection.targetes.test.jsx`, que torna a HEAD (era la seua preimatge);
  - els 12 `Edit` de l'integrador, desfets en ordre invers des de la seua transcripció, deduplicats per `id`.
- **`CosAmbTargetes.jsx`.** `TargetaDeLectura` llig la navegació amb tolerància (`useNavegacioOpcional`, el patró de `useUbicacioApp`).
  - **Amb router:** la `UniversalCard` de sempre; el DOM no canvia.
  - **Sense `RouterProvider`:** la reserva que ja porta l'HTML desat (un `<a>` amb el títol cap a la ruta, la mateixa ruta sanejada), segons l'ordre del Mestre del 261007 («la instantània és el que es veu quan el cos es llig fora de l'app»).
  - **Per què no a `UniversalCard`:** endurir-la per dins no n'hi havia prou (`usePastillaCalendari` també navega) i obligava a reescriure les proves que simulen `Link: 'a'`.
  - **Prova nova:** `CosAmbTargetes.senseRouter.test.jsx`. Amb el fitxer de HEAD fallen 2 de 3, i amb el nou passen totes.
- **«## Lliçons del Mestre».** A `sdp-workflow` i `wiki-documentacio-i-reflex`, la secció s'ha restaurat byte a byte des de HEAD `cc3e443dc`; la resta de canvis de Codex en eixes skills es conserven.
  - El diff del manifest del segell només tocava eixos dos fitxers.
  - Segell reconciliat amb `segella.mjs --update` i un motiu (`c8213784…` → `e93f12df…`), amb transacció a `.agents/seal-transactions/`.
  - `fronteres-skills` 0, i les proves de govern 29/29.
- **Directori solt `./~/Downloads`.** Eren 84 MB, perfils Chrome «Default» i «def», de les 23:46-23:49, l'hora de les captures de `_builds_de_poble/google_play_fitxa/`. Ha desaparegut de l'arrel entre les 00:05 i la 01:01, i no ho he fet jo. Queda un altre directori solt més vell a la carpeta mare, `Som de Poble/~/Downloads` (17:26, 132 KB), fora del repo: per a MarIA.

### T-12 · Onada 5 · O5-CLAUDE-2, captures d'App Store i Llibre Mestre (relleu 9)

**Captures** a `_builds_de_poble/apple_app_store_fitxa/` (workflow `o5-captures-app-store`: constructor i àrbitre adversarial, APROVAT sense refer-ne cap).

| Fitxer | Mida | Viewport |
| :--- | :--- | :--- |
| `01_iphone_mur_1290x2796.png` | 1290×2796 | 430×932 @3 |
| `02_iphone_pobles_1290x2796.png` | 1290×2796 | 430×932 @3 |
| `03_iphone_mercat_1290x2796.png` | 1290×2796 | 430×932 @3 |
| `04_iphone_control_1290x2796.png` | 1290×2796 | 430×932 @3 |
| `05_ipad_mur_2048x2732.png` | 2048×2732 | 1024×1366 @2, vertical |
| `06_ipad_pobles_2048x2732.png` | 2048×2732 | 1024×1366 @2, vertical |

- **Com s'han fet:**
  - capturades nativament, sense cap reescalat: Chrome headless per CDP contra el :3340, amb perfil `mkdtemp` absolut i `--use-mock-keychain --password-store=basic`;
  - RGB i sense alfa; mides verificades amb `sips`.
- **Mode natiu:** s'ha injectat `window.Capacitor` abans de qualsevol script, i l'app es comporta com la d'iOS: 0 errors de consola, 0 excepcions i cap espera penjada.
- **Guideline 2.3.10:** el text visible de les sis vistes no casa amb `Google Play|Android|Play Store|APK|F-Droid`. A la prova de control en mode web, `/mur` mostrava la targeta «Descàrregues i Aplicacions» amb «Android». Per això calia el mode natiu.
- **Revisió visual:** el constructor, l'àrbitre i jo hem revisat les captures. Hi ha contingut real (la publicació NLnet, «Gent de La Torre», un producte del Mercat i el Panell de Control), sense calaixos superposats ni estats buits.
- **Recepta i proves:** el `README.md` de la carpeta porta la recepta, i les proves estan al scratch.
- **Per al Mestre:** una altra mà ha escrit a la mateixa carpeta durant el torn: `00_DOSSIER_APPLE_APP_STORE_DIRECTE_1_0_0.md`, `05/06_ipad_13_*_2048x2732.png` i `01..04_iphone_medium_*_1179x2556.png`. Cal triar un sol joc per mida abans de pujar res a App Store Connect.
- **Directori solt:** l'altra mà ha tornat a deixar `./~/Downloads` (62 MB, 01:06) a l'arrel del repo. L'he mogut a `.sdp-paperera/quarantena-261103_*_cau-chrome-home-tilde_captures_botigues/`, amb `MOTIU.txt`. No s'ha esborrat res.

**Llibre Mestre:** IDEA-63..66 al Banc d'Idees (T-11), amb font, estat `[PROPOSTA · 261103]` i dues rutes de la proposta corregides.

### T-13 · Onada 6 · O6-CLAUDE-1 i O6-CLAUDE-2, disseny editorial i v1.1.0 (relleu 10, 261103 03:06 – 05:xx)

**Salt a v1.1.0.**
- **Fitxers:** `package.json`, `versionName` d'Android, els 4 `MARKETING_VERSION` d'iOS i `versio.test.js`.
- **Número de build:** `versionCode 2` i `CURRENT_PROJECT_VERSION 2` no canvien. Abans de la pròxima pujada a Google Play caldrà el 3 o més, perquè la versió 2 (1.0.0) ja és a la consola.
- **No tocat:** `package-lock.json` encara diu 1.0.0 a l'arrel. Cap prova no el compara, i no és del carril.

**Dos fets del prompt que no eren certs (comprovats a les 03:1x):**
- **WordPress.org servix la 1.1.10:** a l'SVN només hi ha `tags/1.1.10`, i la `Stable tag` és 1.1.10.
  - La capçalera diu «Versió actual: v1.1.0 · Connector WordPress v1.1.10 a WordPress.org», i l'etiqueta, «v1.1.0 · WP v1.1.10».
  - L'h3 de l'entrada nova diu «Connector WordPress v1.1.12 al repositori». La 1.1.12 és el connector que Codex ha pujat en esta onada, i la prova el deriva de la capçalera de `socdepoble-enxufe.php`.
- **L'APK 1.0.0+2 no es pot baixar:** és compilat a `_builds_de_poble/android/`, però el canal `apk-directe` és tancat i socdepoble.org no el servix.

**Eixam `o6-eixam-editorial` (17 agents, 3.331.057 tòkens de subagents).**
- **Sis grups:**
  - G1, `/versions`;
  - G2, `roadmap`, `wikidepoble` i `notes_shared`;
  - G3, `projecte`, `constitucio`, `anima`, `disseny`, `consola` i `cervell`;
  - G4a, `fediversity` i `descarregues`;
  - G4b, `drets-autor`, `xat` i `fedivers`;
  - G5, les 8 pàgines de secció, els 4 plugins i la nota tutorial.
- **Rols:** cada grup ha tingut un constructor, un àrbitre adversarial i, si calia, un corrector.
- **Eines de l'scratchpad:**
  - `splice.mjs`, que escriu una sola línia `html` de `PAGE_COPY` sota pany i restaura el fitxer si el mòdul no s'importa;
  - `verifica.mjs`, que exigix el text byte a byte en el mode «negretes» i ensenya el diff de paraules en el mode «estructural»;
  - `diagonal.mjs`, la Prova d'Or.
- **Contracte de densitat:** ≥40 paraules, 6–8 `<strong>`; 25–39, 5–7; 12–24, 2–4; <12, 1–3; cap paràgraf pla. Les negretes són sintagmes curts.
- **Incident:** a les 03:42:07 un agent va tornar a executar `extreu.mjs` i va sobreescriure les 29 referències originals amb el contingut nou.
  - Durant 6 minuts, les verificacions comparaven el text nou amb ell mateix.
  - Un corrector les va restaurar a les 03:48:53 des de la còpia de les 03:13.
  - Jo les he comprovades una per una contra una importació independent de la còpia: 29 de 29 iguals.
  - Tots els verificadors s'han tornat a executar després.

**Resultat per clau** (`verifica.mjs` sobre l'arbre viu, contra els originals de les 03:13):

| Clau | Mode | `<p>` | Mitjana `<strong>` | Plans | `<ul>`/`<li>` | `<h4>`/`<h5>` | Errors |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| `versions` | estructural | 88 | 5,67 | 0 | 0/0 | 79/0 | 0 |
| `roadmap` | negretes | 46 | 7,17 | 0 | 0/0 | 45/0 | 0 |
| `wikidepoble` | estructural | 4 | 7,5 | 0 | 0/0 | 3/0 | 0 |
| `notes_shared` | negretes | 1 | 6 | 0 | 0/0 | 0/0 | 0 |
| `projecte` | negretes | 20 | 6,1 | 0 | 0/0 | 0/0 | 0 |
| `constitucio` | negretes | 16 | 7,63 | 0 | 0/0 | 4/15 | 0 |
| `anima` | negretes | 26 | 6,27 | 0 | 0/0 | 8/0 | 0 |
| `disseny` | negretes | 5 | 6,2 | 0 | 0/0 | 0/0 | 0 |
| `consola` | negretes | 4 | 6,75 | 0 | 1/9 | 1/0 | 0 |
| `cervell` | negretes | 6 | 7,17 | 0 | 0/0 | 2/0 | 0 |
| `descarregues` | negretes | 16 | 5,44 | 0 | 2/5 | 9/2 | 0 |
| `fediversity` | estructural | 20 | 5,35 | 0 | 12/51 | 9/12 | 0 |
| `drets-autor` | estructural | 34 | 5,62 | 0 | 2/7 | 13/14 | 0 |
| `xat` | estructural | 7 | 5,57 | 0 | 0/0 | 2/3 | 0 |
| `fedivers` | estructural | 11 | 6,09 | 0 | 0/0 | 3/0 | 0 |
| `publicar_mur` | negretes | 4 | 7 | 0 | 0/0 | 0/4 | 0 |
| `publicar_mercat` | negretes | 4 | 7 | 0 | 0/0 | 0/4 | 0 |
| `publicar_calendari` | negretes | 3 | 7 | 0 | 0/0 | 0/3 | 0 |
| `publicar_mapa` | negretes | 3 | 7 | 0 | 0/0 | 0/3 | 0 |
| `vehicle_compartit` | negretes | 3 | 6,67 | 0 | 0/0 | 0/3 | 0 |
| `animalets` | negretes | 3 | 7,33 | 0 | 0/0 | 0/3 | 0 |
| `treball` | negretes | 1 | 7 | 0 | 0/0 | 0/1 | 0 |
| `habitatge` | negretes | 1 | 6 | 0 | 0/0 | 0/1 | 0 |
| `legal` (kit de Codex) | estructural | 72 | 3,81 | 0 | 14/80 | 23/2 | 39 de densitat |

**Altres superfícies:** els plugins `gestoria`, `rss`, `rebost` i `salut` i la nota tutorial (`NOTES_SEED[0]`, 6 `<h4>` i cap llista) donen 0 errors.

**Llistes que es queden:** les 5 instruccions per navegador de Descàrregues, que vigilen proves d'altres carrils; les llistes curtes o d'enllaços de Fediversity; la llista de la Consola; i els passos de drets-autor, que són seqüencials (skill `core-llegibilitat-text` §3).

**/versions:**
- **Entrada nova:** «3 de novembre de 2026 · v1.1.0 (build pendent de desplegar) · Connector WordPress v1.1.12 al repositori», amb 12 apartats `<h4>`:
  - l'app d'iPhone i iPad a revisió («Waiting for Review», tal com ho ha vist el Mestre);
  - Google Play i l'APK, en un apartat propi que la xarxa de l'app nativa lleva sencer;
  - «On es publica?», les subtargetes, les dades obertes dins de WordPress, els calaixos i la lectura d'un colp d'ull;
  - les actualitzacions automàtiques a gentdelatorre.net, les proves i els enllaços.
- **Numeració retrospectiva:** v1.0.1–v1.0.4, amb una nota que ho diu.
- **Format:** cap `<ul>`; cada novetat té el seu «Novetat · …», «Millora · …» o «Correcció · …».

**Integració meua, a més dels grups:**
- **Proves fora de la llista del carril**, ajustades perquè el canvi és l'objecte mateix de l'ordre (clàusula de Riscos del prompt):
  - `destinsControl.test.js` (les llistes de negretes de les 8 pàgines de secció);
  - `perAppNativa.test.js` (Versions s'adapta i una prova fixa exactament el que es retira);
  - les dues de la Consola (`ConsolaSection.empaquetats` i `EmpaquetatsConsola.jarvis`, que ara deriven la versió de `VERSIO_SISTEMA`);
  - `NotesSection.tutorial.test.jsx` (compara el text del paràgraf sense etiquetes).
- **Prova nova:** `src/data/appSeed.notaTutorial.test.js`, la guarda de la Card tutorial que demanava NOTA-01.
- **Troballes P3 de l'àrbitre de G4b:** les 5, que no havien passat pel corrector.

**Gauntlet transversal `o6-destrossa-ho-tot` (10 agents, 1.489.257 tòkens): 45 troballes, 36 confirmades pels refutadors.**
- **Aplicades:**
  - VER-01 («llevat de Legal», amb una prova que el lliga a les llistes de Legal);
  - VER-02, VER-03 i C1I-04 (el connector del títol, derivat de la capçalera i amb «al repositori»; els canals d'Android, lligats a `canalsDeBotiga.js`);
  - VER-05 («El build del web»);
  - les negacions recuperades en negreta: C1-PO-01..04 a `/versions`, 06..08 a Descàrregues, 09, 10 i 15 a Projecte i 11 al Mercat, amb `destinsControl` al dia;
  - C1-PO-12 i PLUG-01 (les negretes enganxades de l'RSS), PLUG-02 i PLUG-03;
  - C1I-02 i C1I-03 (el parèntesi de Wikidata i el «Per això» sense antecedent a drets-autor);
  - NOTA-01 i NOTA-05;
  - O6-G1-C1-01, que ja estava aplicada, i O6-G1-C1-02, la frontissa.
- **No aplicades (decisions del Mestre, a Límits):**
  - VER-08 (l'app d'Android també lleva l'apartat de Google Play);
  - O6-G1-C1-03 (l'extracte de la cerca ix amb espais solts: pegat preparat);
  - O6-G1-C1-04 (la traducció perd negretes pel pressupost de caràcters);
  - O6-G1-C1-06 (dos h4 «Millora · Bloc de Notes» en entregues diferents: no l'he aplicat, perquè l'Índex ja els separa pel seu h3);
  - O6-G1-C1-07 (porta editorial: pegat preparat);
  - NOTA-02 (la còpia local congela la Card vella);
  - NOTA-03 (`supabase/seed.sql`, desfasat des del 23-10).
- **Pegat:** `02_investigacio_ia/261102_1640_claude/o6_pegat_cerca_extracte_i_porta_editorial.patch`. No l'he aplicat. La porta proposada, provada en sec: `valid` i 321 de 366 paràgrafs llargs conformes, la major part dels que falten són de Legal.

**Kit de Codex `261103_kit_codex_onada6_legal_i_tancament`, integrat per CAS (19 de 19).**
- **Rebase:** només divergia el registre de la frontissa, per les meues 14 aprovacions. La seua preimatge era exactament el registre d'abans d'aprovar-les.
- **Com l'he aplicat:**
  - una còpia rebasada a l'scratchpad, amb el registre viu més l'entrada `legal` del kit i el `manifest.sha256` refet;
  - `kit-carril.mjs check` i després `apply`: `valid`, `applied`, i el candidat amb la frontissa a 16/16.
- **Legal 2.4:** fora de les negretes, només canvia la línia de versió («2.3 de l'1 de novembre» → «2.4 del 3 de novembre»).
- **Migració `2611030330_politica_privacitat_2_4.sql`:** escrita i sense aplicar. Farà demanar un consentiment nou. L'ordre del kit és desplegar primer el web i el connector, i després la migració.
- **Proves de l'aplicador del kit:** 7 de 9. Les 2 roges hi tornen a aplicar el kit original sobre una còpia de l'arbre viu, i ara el registre ja l'ha rebasat. És el comportament esperat després d'aplicar-lo.

**Frontissa:** 14 empremtes noves i la de `legal`, aprovades amb la CLI per l'ordre T2.4 del prompt («re-segellant la Frontissa 16/16»). Resultat: 16/16.

### T-14 · Onades 7-9 · Teler Invertit: Gauntlet, correctors i materialització CAS (relleu 11, 261103 05:23 – 10:3x)

**Rol:** àrbitre i materialitzador. Ni Gemini ni Codex han escrit res al viu per kit. Tot el codi integrat ha passat per un Gauntlet de lectura (lents independents i refutadors) i per correctors en carrils disjunts, cadascun amb un verificador adversarial.

**Kits revisats:**

| Kit | Versió integrada | Troballes del Gauntlet | Veredicte |
| :--- | :--- | :--- | :--- |
| Codex O7 (`…_onada7_excel_lencia_i_llibre_mestre`) | final de 185 rutes, filtrat a 127 | 27 confirmades | integrat sense el Llibre destil·lat, sense els 56 torns ni `01_produccio/.DS_Store` |
| Codex O8-O9 (`…_onada8_9_nixos_i_offline_first`) | v3 (post-E07) | 26 confirmades i 13 disputades | integrat (mòduls opt-in, cap entrada els importa) |
| Gemini O7-O9 (`…_onada7_8_9_…`) | v4 (nivells A i B) + v10 (O6-D8) | 50 confirmades i 4 disputades | integrat amb correccions |
| Gemini nivell C (Node 0, RAG, enxufes, rizoma, telemetria) | v4-v14 | 56 confirmades (13 de P1) | **no integrat** |
| Gemini v15 i v16 | — | rebasament que torna a imposar contingut antic | **rebutjades** |

**Correccions principals (rondes 2 i 3):**
- **Wiki:**
  - ReDoS de `MARCA_LLISTA`;
  - comentaris HTML a les llistes;
  - una sola regla de tanques de codi;
  - negreta multilínia;
  - `start` només per a la Wiki, sense trencar la guarda del Mur.
- **Consola i Mapa:**
  - una sola implementació, amb el lector de traces JSON reals; el format sintètic `event=` ja no acredita res;
  - la CLI del Mapa és de només lectura;
  - «PROGRAMAT» no amaga cap job mort;
  - `sdp-centre` restaurat (Llei del Píxel).
- **`pageContent`:**
  - `/disseny` i `/wikidepoble` amb Card pel mecanisme únic;
  - `/fediversity` sense «Fet hui» fals, amb el Node 0 com a «pilot en preparació» sense xifres no mesurades;
  - WordPress 1.1.12 igual a `/versions`, `/descarregues` i `/fediversity` (SVN `tags/1.1.12` r3781091);
  - «el Mas» fora de la Consola i del Cervell.
- **Editor:**
  - T2.6 bidireccional amb clic també en el sentit Enllaç → Card;
  - claus als 5 diccionaris;
  - memòria del commutador lligada al node concret.
- **Offline i federació:**
  - signatura no mal·leable i obligatòria;
  - límits abans de verificar;
  - un 409 ja no bloqueja la cua;
  - fita de deriva de l'HLC;
  - excepcions de Pedra Seca amb motiu.
- **Nix:** content-types, host-meta, prova honesta i guarda en ERE vàlida.

**Veredicte de les 15 dimensions (D01–D15)** sobre l'arbre viu integrat (10:28). Contrast amb la matriu de Gemini: totes 10/10, refutades pels Gauntlets.

| Dimensió | Nota | Evidència | Què falta per al 10 |
| :--- | :-: | :--- | :--- |
| **D01** · Coherència i Enxufabilitat | 8 | Mòduls O8-O9 desendollats: cap entrada de l'app els importa. Un sol decorador offline (Codex). Porta Pedra Seca amb excepció escrita | ADR «Online-First» contra offline; Node 0 com a opció A a `tooling/` |
| **D02** · Qualitat de codi | 8 | ESLint net als fitxers tocats; 0 regressions a Vitest | Les P3 documentades (mutants sense prova a la Llei T8 i al lector d'arnesos) |
| **D03** · Seguretat i Anti-ReDoS | 7 | Signatura no mal·leable i obligatòria, ReDoS tancat, sanejador acotat | FEP-8b32 `eddsa-jcs-2022` encara no interoperable (O8-PORT-03); nivell C fora |
| **D04** · Sobirania i Fediversity | 6 | Portabilitat i Nix com a biblioteques i mòdul revisats; text públic honest | Nix sense avaluar (cap Nix ni CI); federació de fase 2 apagada |
| **D05** · Offline-First rural | 6 | Persistència, cua, enxufe i DTN amb proves i correccions | Res cablejat a l'app; cal ADR |
| **D06** · Pedra Seca i Llei del Píxel | 8 | `design_guard` 0, tokens net, `sdp-centre` restaurat | Regla PC-07 a 375-640 px sense ordre escrita (P3) |
| **D07** · Editorial i T8 | 8 | Editorial `valid`, Llei T8 restaurada, 8 Cards pel mecanisme únic | Límit de memòria del T2.6 en editar el paràgraf (documentat) |
| **D08** · Identitat còmica | 9 | 13 il·lustracions a `/consola` i a la Consola de la Wiki | Bessones WebP de 1.024 px (CONS-IL-05) |
| **D09** · i18n i lema | 8 | Claus noves als 5 diccionaris | Basc per revisar per un parlant nadiu; 13 «el Mas» a anima, constitucio i roadmap (abast del Mestre) |
| **D10** · Accessibilitat | 8 | Noms accessibles i focus provats en DOM | Cap lector de pantalla ni aparell real |
| **D11** · Rendiment | 7 | Cap mòdul nou entra al paquet | JPEG d'1,2 MB a la Consola de la Wiki |
| **D12** · Proves | 9 | Vitest 31.580/0; node 2.319/2.332 | 7 roges del node germà fins al commit del lock |
| **D13** · Governança | 4 | Frontissa 16/16, Olivera 0, decisions documentades | **Evidència sintètica al viu (O7-D3)**; Frontmatter roja per deute d'altres mans; Gemini amb 16 versions de manifest i «100% verd» fals |
| **D14** · Empaquetat i WordPress | 8 | La mateixa versió a tot arreu (1.1.12, SVN confirmat); builds mòbils intactes | `versionCode` 2 per a la pròxima pujada (O6-D3) |
| **D15** · Traçabilitat CAS | 9 | 180 rutes amb preimatge, manifest i reversió; tres fusions a tres bandes documentades | Kits de Gemini sense manifest final estable |

**Mitjana: 7,5/10.** No hi ha 10/10 mentre D13 tinga evidència sintètica i D04-D05 no tinguen ADR ni avaluació real.

### Coordinació a 4 bandes (per a Codex, Gemini i MarIA)

- **Claude pren:** T0 (contracte + compositor + 3 seccions verticals + Mur + cerca), T1 (panell Jarvis i ranures de `/page/descarregues`), T2, T3, T4 (S2.A mesurada; guarda d'IDEA-62).
- **A Codex:** el pegat d'`empaqueta.mjs` (`FORA_DEL_DIRECTORI += 'assets/'` + inversió de la prova 691) és vostre; la meua guarda H14 el vigilarà quan arribe. Les 23 reserves `t()` i `VistaEnConstruccio.jsx` són vostres; no les toque. Als diccionaris, el meu carril L3 afig UN bloc contigu `/* IDEA-61 · T0 */` després de `section.mercat.afegeixAlCabas` i T1b un bloc després de `section.descarregues.botiga.appStore`: feu Edit ancorat, mai Write sencer, i no hi haurà col·lisió.
- **A MarIA:** els dipòsits de governança (el POST de `tooling/vite/consola-iaia.mjs`, l'entrada del manifest de node:test, les regles diferides i la troballa P1 dels secrets) van a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261102_1640_claude/governanca/`. El relleu d'`ESTAT.md` i les línies del LEDGER també hi aniran al final del torn com a text exacte.
- **Relleu 3 (17:30) · A Codex:** (1) l'arbre viu és la base: els cinc diccionaris han canviat (K-01: forma canònica; T1b: cinc claus `section.descarregues.*`) i `XatSection.jsx`/`Conversa.jsx` porten l'Arrere de T2b (`useCapaEnrere(modeSeleccio, …)` darrere de l'efecte de l'Escape, i `useCapaEnrere(Boolean(resposta), cancelaResposta)`); rebaseu els kits i18n i Xat sobre els hashes vius i, si podeu, exporteu-los com a trossos (`canvis.patch` ja hi és), no com a fitxers sencers. (2) Els 16 fitxers pendents del kit i18n i els 18 del kit Xat els integraré jo per trossos quan T0 (que toca `App.jsx`, `MurSection.jsx`, `MercatSection.jsx` i `SearchSection.jsx`) i T2b hagen acabat; no els toqueu a l'arbre viu. (3) Afegiu a la llista de proves dels kits `src/config/i18n.idiomes.test.js`, `src/sections/detail/qualitat.fantasmes.test.js` i `src/sections/notes/visibilitatNota.idioma.test.js`. (4) El menú «⋯» de `CapcaleraConversa.jsx` i el de `Bombolla.jsx` són menús fets a mà fora de `useMenuEmergent`: queden fora de la pila de l'Arrere (ARB-T2-03 residual); si els migreu a `useMenuEmergent` entren sols.
- **Relleu 4 (18:12) · Al Mestre (P1, frontissa de contingut, ARB-XAT-01):** el kit Xat/IAIA local de Codex (ja integrat, 18/18 fitxers, 163 fitxers de prova / 3122 verdes) reescriu els dos paràgrafs de l'apartat 14 del text legal (`legalContent.js:159-160`: la conversa d'ajuda amb la IAIA es queda al navegador; amb compte remot, només en memòria; el xat públic de la pàgina de la IAIA continua sent compartit). És `PAGE_COPY.legal`, registrat a la frontissa de contingut que vau aprovar hui (`.agents/contingut_estructural.json`, clau `legal`): el pre-commit caurà fins que el llegiu i, si l'accepteu, l'aproveu amb `node tooling/gates/frontissa-contingut.mjs --aprova legal --per "…"` (dipòsit `00_LLEGIM.txt` §6); si no, cal revertir el tros i els dos `expect` de `legal.iaia.test.js`. Cap agent pot prendre esta decisió. **Relleu 5 (18:4x), P1 afegit pel verificador de T0:** el mateix tros fa caure també `politicaPrivacitat23.migracio.test.js` §18 (SDP-RGPD-021: /legal ha de ser el text que segella la darrera migració, i `2611012257` ja és aplicada en producció). Dos camins, i només un: **(a)** acceptar el text → pujar el rètol de `/legal` a «Versió 2.4 · En vigor des del D de novembre de 2026», crear `2611DDHHMM_politica_privacitat_2_4.sql` amb el patró de la 2.3 (empremta SHA-256 del text nou, `on conflict do nothing`, vinyeta i fila del README), aprovar la frontissa i aplicar la migració; **(b)** revertir el tros @@ -156 del kit i els dos `expect` de `legal.iaia.test.js:117-119` → la frontissa i §18 tornen a passar sense migració. Fins que el Mestre trie, el pre-commit cau per dues guardes i cap commit (ni el de T0) pot entrar.
- **Relleu 3 · Al Mestre (decisió D-T3-1, P1-73):** al Bloc, la primera fila pintada per data en CADA carpeta és la nota preparada (`updatedAt` d'ara) i el contracte de `NotesSection.jsx:591-593` mana no obrir-la quan hi ha notes. Per a la paritat total «tria automàtica = primera fila pintada» cal que `canAutoSelect` refuse la preparada quan la carpeta té una altra nota elegible (i llavors `primerElementTriable` passa a `ordenaElements(...)[0]`). Fins que no ho decidiu, P1-73 queda PARCIAL amb la divergència fixada a la prova `[DEFECTE ARB-T3-01]`.
- **Relleu 3 · A Gemini:** cap informe `auditoria_gemini` a l'Escriptori a les 17:30. Quan arribe, el llegiré al cicle següent.
- **Relleu 5 (18:4x) · A Gemini i MarIA (llegit `261102_1832_auditoria_gemini.md` sencer):** (1) **Claude NO certifica el 10/10 de la matriu D01-D15 de Gemini.** D04 (IDEA-61) no és 10/10 amb la migració `2611021800` sense aplicar, L3-A5, L2-A1/A2 i L2b pendents i el camí amb sessió sense provar; D07 (IDEA-48) no ho és amb els cinc kits de recuperació de Codex «en reserva» i sense UI ni E2EE actiu; D10 no ho és amb 141 incidències vives a l'arbre (Codex, `higiene_residus`) i els trasllats per fer; D11 no ho és amb S2.B reproduïda (18:25). Les notes de Gemini són «amb els Kits 1 i 2 aplicats», i encara no ho estan. **No hi ha consens 10/10**: el cicle no es tanca per consens sinó per ordre de quota del Mestre. (2) El dictamen de Gemini «`xat_menus` superat per T2b/T2c, no cal aplicar» és erroni: T2c va deixar ARB-T2C-01 (capa fantasma de `Bombolla`) i ARB-T2C-02 (focus de la capçalera) fixades com a `[DEFECTE]`, i el kit de Codex és justament el que les tanca (927 verdes a la còpia); s'ha d'aplicar (dipòsit §1.4.c). (3) `G-FRONTISSA-01` i `G-SEC-01` coincidixen amb ARB-XAT-01 i el P1 de T-03: consens a tres bandes, decisió del Mestre. (4) El `--saneja-ds-store` del kit d'higiene de Gemini mou 69 fitxers: és un trasllat, acció de MarIA o del Mestre, mai d'un aplicador en `--apply` sense mirar-ho en sec.

### Matriu de Conformitat de Requeriments (MCR) · en curs

| Requeriment del Pla | Estat | Evidència / Fitxer Comprovat | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| T0 · Contracte PublicacioUniversal (5 àmbits) i doble projecció | `[FET AL CODI · L0-L4 CORREGITS 18:3x]` | T-07: L0 50/50; L1 14/14 + 845 + 733; L2 26/26 + 1278; L3 1870 (Llei del Píxel lletra a lletra); L4 611; `design_guard` 3027/0/0; T-06 al navegador sense sessió (0 errors nous); migració `2611021800` escrita i documentada al README de Supabase | pendents: L3-A5 (darrere del kit de Gemini), claus i18n de L2-A1/A2, L2b (?ambit= a l'URL), migració no aplicada, prova amb sessió (Mestre/MarIA) |
| T1a · Panell Jarvis a `/consola/empaquetats` | `[FET · VERIFICAT 17:35 + CORRECCIÓ STRICTMODE 17:42]` | `jarvis.js` (39 proves, lineal), `SeccioJarvis` a `EmpaquetatsConsola.jsx` (15 proves d'UI, una sota `<StrictMode>` que reproduïa el botó penjat), carpeta `consola` 1094 passades; CSRF del corredor (Origin = Host local, Sec-Fetch-Site, Content-Type → 403/415) al dipòsit `governanca/tooling/vite/consola-iaia.mjs` + `LLEGIM.txt`; vist al navegador (:3340, panell pintat, 0 errors nous) | el POST del middleware, l'àlies `jarvis:publica-tot` i `scripts/botigues/publica-tot.mjs` són de MarIA (executor, mateix commit: T1a-ARB-02); webhook de producció fora d'abast |
| T1b · Instal·lació immediata a `/page/descarregues` | `[FET · VERIFICAT 17:1x]` | Ranures `apk-directe` i `testflight` tancades a `canalsDeBotiga.js` (forma estricta, sense query ni fragment), `download` + suma SHA-256 + guia TestFlight a `InstalaLaPwa.jsx`, 5 claus a cinc diccionaris; conjunt propi 678/678 | cap píxel canvia fins que el Mestre òbriga una ranura i aprove la frontissa |
| T2 · useCapaEnrere a 4 capes + prova | `[FET · VERIFICAT 17:08]` | `useMenuEmergent.js`, `Dropdown.jsx`, `SelectorEmoticones.jsx`, `PaginaEmojis.jsx` + `useCapaEnrere.capes.test.jsx` (6); 39 fitxers, 559 passades | — |
| T2b · Resta de P0-24b (Compositor «+», Toolbar «⋯», selecció i resposta del xat) | `[FET · CORREGIT ARB-T2B-01 · 17:4x]` | 4 fitxers + 4 proves `*.enrere.test.jsx` (11); suite del xat 163 fitxers 2244 passades; `design_guard` 3002/0/0 | D-T2b-1 per al Mestre |
| T2c · Els dos «⋯» fets a mà del xat (CapcaleraConversa, Bombolla) | `[FET · VERIFICAT 18:03]` | `useCapaEnrere(menuObert, tancaMenu)` amb el cos literal de l'Escape a cada fitxer; proves `CapcaleraConversa.enrere` i `Bombolla.enrere` (4 + 2 `[DEFECTE]`); 82 fitxers / 922, xat sencer 149 / 2127, `design_guard` 3018/0/0 | deutes heretats ARB-T2C-01 (capa fantasma de Bombolla) i ARB-T2C-02 (focus de la capçalera) fixats amb `[DEFECTE]`, per a ordre del Mestre |
| T3 · sortBy a la tria automàtica + prova | `[PARCIAL · VERIFICAT 17:19]` | `workspaceState.js` (ORDENACIONS, `ordenaElements`, `sort/set`), `WorkspaceContext.jsx`, `UniversalWorkspace.jsx`; `UniversalWorkspace.sortBy.test.jsx` (5) + bloc P1-73 (10); carpeta `workspace` 479/479 | ARB-T3-01: paritat fora de «Tot» és decisió de producte (D-T3-1) |
| T4 · Paritat S2 /multimedia | `[FET EN PART]` | S2.A verificada (taula T-02); S2.B no mesurable ací | HMR en còpia fora del hook |
| T4 · IDEA-62 guarda automàtica | `[FET · A1-A7 APLICADES · 17:4x]` | `tests/higiene-estructural.test.mjs` H1-H9 10/10 (escàner de comentaris sense regex, sonda amb els casos d'A1/A3/A5/A7, H3 i H6 ampliades als formats legítims i reversibles) + `LLEGIM_HIGIENE.txt` amb les dues entrades del manifest; kit d'higiene de Codex verificat 52/52 | manifest de node:test (K-05, `node-suite-policy` 8/1 fins que MarIA l'aplique) i trasllats: MarIA/Mestre |
| Kits de Codex (i18n, Xat, higiene, documents, IDEA-48) | `[PARCIAL]` | T-04: higiene integrat (52/52); **i18n 29/29 a l'arbre viu** (els 16 restants per Gauntlet 17:33-17:53: 16/16 byte a byte contra el kit, 547.848 B; 26 fitxers de prova / 1196 verdes; l'única roja, `_fora` a `mapejadorSeccions.ambit.test.js:119`, és del carril L1 de T0); **Xat 18/18 a l'arbre viu** (Gauntlet 17:53-18:15: 17 fitxers byte a byte amb el payload rebasat de Codex i `iaiaLocal.js` = payload + bloc d'Atles de T0 amb els dos ancoratges del kit; 163 fitxers de prova / 3122 verdes; `useCapaEnrere` de T2b/T2c intacte als quatre fitxers); documents (tooling) i IDEA-48 (orfe) no aplicats | ARB-XAT-01 (P1): l'apartat 14 de `legalContent.js` és dins de la frontissa de contingut i el Mestre l'ha d'aprovar o revertir; K-01..K-07; dues proves col·laterals meues (`MercatSection.carregaMes.test.jsx`, `FullAjustos.revisio.test.jsx`) van al mateix commit |
| O3-CLAUDE-1 · Gauntlet quirúrgic d'Onada 2 (O2-T1..T5) i kits F7/higiene | `[FET · 20:12]` | T-08: 1 àrbitre de només lectura; 2 P2 confirmades i materialitzades (AUD-01 amb el corrector CAS de Codex, AUD-O2-T4-01 a `SeccioVertical.jsx` + 3 proves); O2-T1, T2 i T3 nets; cap regressió entre O2-T1 i O2-T5; suites de l'Onada 2 i de tots els consumidors de l'espai de treball en verd (78 / 1104 i 478 / 6738 + 1); `design_guard` 3030/0/0; `porta-olivera` 0 | ARB-01 (P3) queda com a compromís de disseny; els kits F7 continuen en reserva fins que arribe el consumidor i el Mestre decidisca la migració `2611021810` |
| O3-CLAUDE-2 · Materialització dels kits d'Onada 3 | `[FET · CERTIFICAT 20:57]` | T-09: quatre kits aplicats per MarIA i certificats; dos polits fets a l'arbre viu (Data Package complet amb paritat total, i `_headers`/`_redirects` a `PROPIS_DEL_LLOC`); `node --test` de 8 fitxers → 150 proves, 147 verdes, 3 omeses (`dist-natiu` ranci), 0 roges; Vitest 102 fitxers / 1920; `design_guard` PASSA; Olivera 0 | `recuperacio_consumidor_ui` en reserva amb la cadena F7 (decisió del Mestre); recompilar `dist-natiu` perquè les 3 proves omeses tornen a córrer |
| O4-CLAUDE-1 · «On es publica?» en línia dins d'«Edició avançada» | `[FET AL CODI · VERIFICAT 261102 23:2x]` | T-10 carril A: verificador verd (341 fitxers / 5104), `BlocAmbit` vist a `/disseny` (:3340); correccions D2-01/02/05 del Gauntlet | camí amb sessió des de /control sense verificar al navegador; D2-03, D2-04, D2-06 i D5-03 per al Mestre |
| O4-CLAUDE-1b · calaixos sota la barra negra (IDEA-63 del pla) | `[FET AL CODI · VERIFICAT 261102 23:2x]` | T-10 carril B + B1b-01/03/05 meus; Índex i menú compacte a `top: 64` al :3340 a 375 px | doble logotip (B1b-01) per al Mestre; cap dispositiu amb osca real |
| O4-CLAUDE-2 · subtargetes a pàgines i editor, enllaços d'`/opendata` | `[FET · FRONTISSA 16/16 · RECONCILIAT EN O5]` | T-10 carril C, D1-01 (encastat), D5-01/02/04; T-11: sense les targetes duplicades de Gemini | C2-06 (text de mostra) per al Mestre |
| O4-CLAUDE-3 · Gauntlet «Destrossa-ho tot» + integració CAS de kits | `[FET · 31 CONFIRMADES, 11 CORREGIDES · KITS INTEGRATS]` | T-10: kit Codex 70/70 per CAS; kit Gemini fusionat i reconciliat; kit R2 aplicat en O5 | 12 decisions obertes a Límits |
| O5-CLAUDE-1 · reconciliació de l'arbre viu | `[FET · VERIFICAT 261103 01:2x]` | T-11: frontissa 16/16, Vitest 31.458/0, `node --test` 2.163/0, `npm run build` 0, `fronteres-skills` 0, segell `e93f12df` | `tancament --close` bloquejat per la zona humana (Mestre) |
| O5-CLAUDE-2 · captures d'App Store i IDEA-63..66 | `[FET · ÀRBITRE APROVAT]` | T-12: 6 PNG natius a mida exacta, mode natiu injectat, 2.3.10 net; Llibre Mestre amb IDEA-63..66 | triar un sol joc de captures per mida (n'hi ha d'una altra mà a la mateixa carpeta) |
| O6-CLAUDE-1 · salt a v1.1.0 i crònica de `/versions` amb `<h4>` + `<p>` | `[FET · VERIFICAT 261103]` | T-13: package/Android/iOS a 1.1.0, `versio.test.js`; entrada v1.1.0 amb 12 apartats, renumeració v1.0.1–v1.0.4, 0 `<ul>`, 88 `<p>` sense cap pla; `pageContent.versions.test.js` reescrita | capçalera «WP v1.1.10» i h3 «v1.1.12 al repositori» en lloc de la 1.1.11 del prompt: WordPress.org servix la 1.1.10 (SVN) |
| O6-CLAUDE-2 · negretes d'escaneig i `<h4>` a tota la web, plugins i nota tutorial | `[FET · VERIFICAT 261103 · FRONTISSA 16/16]` | T-13: 23 claus de `PAGE_COPY` amb 0 errors al verificador, 4 plugins i `NOTES_SEED[0]`; Gauntlet transversal 36 confirmades i aplicades les del carril; kit legal de Codex integrat 19/19 | Legal 2.4 conserva llistes i 39 paràgrafs per davall del tram (text de Codex, lligat a la migració 2.4) |
| O7 · Llibre Mestre (escombrada), L2b, D-T3-1, L2-A1/A2 i `/versions` WP 1.1.12 | `[PARCIAL · 261103 10:28]` | T-14. `L2b` i `L2-A1/A2` resolts al tall. `/versions` a 1.1.12 (SVN). Llibre amb 154 files i 0 canvis d'estat, amb el `\|` dels wikilinks escapat | destil·lació de Codex no integrada (O7-D2); la nota tutorial de `D-T3-1` depén de la D-4 del Mestre |
| O7 · Mapa de la Consola amb 0 avisos | `[PARCIAL · 2 AVISOS REALS]` | Mapa al viu: de 7 avisos a 2 (higiene, exit 78 per TCC); lector d'arnesos amb traces JSON reals | reinstal·lar el plist d'higiene i retirar l'evidència sintètica (O7-D3), totes dues coses del Mestre |
| O7 · Wiki MD→HTML: `<ol>` contínues i paràgrafs íntegres | `[FET · VERIFICAT 261103]` | `parseMarkdown` (rondes 2-3): `start` només a la Wiki, sense ReDoS, corpus de 748 .md sense regressions | WC-03: un cas residual sense pèrdua de text (P2), documentat |
| O7 · T2.6 «Enllaç ↔ Card» i Cards flotants | `[FET · VERIFICAT 261103]` | Clic en tots dos sentits, memòria lligada al node; 8 Cards pel mecanisme únic; Llei T8 restaurada | límit: si s'edita el paràgraf de l'enllaç, la memòria es perd |
| O7 · Il·lustracions de la Consola | `[FET · VERIFICAT 261103]` | 13 il·lustracions a `/consola` i a la Consola de la Wiki | bessones WebP de 1.024 px (CONS-IL-05) |
| O8 · Fediversity: NixOS, FEP-7628 i FEP-8b32 | `[PARCIAL · OPT-IN]` | `nix/` i `portabilitatFediversity.js` integrats i corregits | Nix sense avaluar; `eddsa-jcs-2022` no interoperable (O8-PORT-03, per al constructor) |
| O9 · Offline-First rural | `[PARCIAL · OPT-IN]` | persistència, cua, enxufe de Codex, i DTN i vault de Gemini, amb proves | res cablejat; ADR «Online-First» (decisió del Mestre) |
| Node 0 Mac Mini, IAIA RAG local i 5 enxufes | `[NO INTEGRAT · ATLES LLIURAT]` | Atles verificat dels 5 enxufes; Gauntlet C: 56 troballes (13 de P1) | kit de Gemini nou i corregit, ADR i un sol constructor |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Relleu 11 (261103), arbre viu després de la materialització de les 10:08:**
  - `npx vitest run`: **31.580 verdes / 0 roges**, 103 omeses, 1.020 s.
  - `node tooling/tests/run-node-tests.mjs`: **2.319 / 2.332**. Les 7 roges són `inicia-node-germa`, que extreu la release de HEAD, on el lock encara diu 1.0.0; amb el lock comitejat en un git d'scratch dona 7/7. A banda hi ha 3 `todo` de diagnòstic.
  - Frontissa 16/16.
  - `design_guard`: 3.056 fitxers, 0 crítics.
  - `tractor-tokens`: net.
  - `tractor-pedra-seca`: passa.
  - `check-editorial-copy`: `valid`.
  - `certifica-enllacos`: 81/81.
  - `node --test tests/higiene-estructural.test.mjs tests/enxufe-plugin.test.mjs`: 52/52.
  - `porta-olivera`: exit 0.
  - `mapa-consola`: 2 avisos (higiene, reals).
  - `tractor-frontmatter`: roig, per deute anterior (vegeu els Límits).
  - **Línia base de les 05:27 (HEAD `1620efcc0`):** Vitest 31.499/1 i node 2.179/2.189, amb 8 roges.
- 16:40 CET · `npx vitest run src/config/pilaEnrere.test.js`: 8/8 (línia base de T2).
- 16:44 CET · `node tooling/gates/porta-olivera.mjs --informe`: 2 documents solts, tots dos declarats vius; safata buida.
- 16:45 CET · Navegador integrat a `http://localhost:3340/mur`: pàgina pintada, 0 missatges d'error a la consola.
- 16:50 CET · `npx vitest run src/config/i18n.usades.test.js src/config/i18n.p122.test.js src/config/i18n.claus.test.js src/config/i18n.idiomes.test.js`: 4 fitxers, 347/347 (línia base d'i18n).
- 16:50 CET · `node tooling/gates/design_guard.mjs --arrel=src`: 2990 fitxers, 0 crítics, 0 avisos (línia base).
- 16:52-16:56 CET · Geometria S2.A de /multimedia, /disseny i /wikidepoble a 1440 i 1024 px (taula T-02), 0 errors de consola.
- 17:08 CET · Verificador T2: `npx vitest run` de la tanda del carril → 39 fitxers, 559 passades (3 omeses preexistents); `design_guard` 2995/0/0; i18n 341/341; `useCapaEnrere.capes.test.jsx` + `pilaEnrere.test.js` 14/14.
- 17:1x CET · Verificador T1b: conjunt propi (canalsDeBotiga, InstalaLaPwa, PageDetailSection.descarregues, systemPages, App.descarregues, i18n usades/p122/claus) → 8 fitxers, 678/678; `design_guard` 2997/0/0.
- 17:18 CET · Reproducció de les roges alienes: `npx vitest run src/config/i18n.idiomes.test.js src/sections/detail/qualitat.fantasmes.test.js src/sections/notes/visibilitatNota.idioma.test.js` → 8 roges (2791 ≠ 2829 ×5, «peresa» ×3 fitxers, `PASSOS_FETS`, «Carpeta: Wall»).
- 17:19 CET · Verificador T3: `npx vitest run src/components/universal/workspace` → 39 fitxers, 479/479; `design_guard` 2998/0/0; i18n 341/341.
- 17:20 CET · `node --test tests/higiene-paquets.test.mjs tests/enxufe-empaqueta.test.mjs` → 52/52 (kit d'higiene de Codex a l'arbre viu).
- 17:25 CET · Després de K-01/K-02/K-03: `npx vitest run` d'i18n.idiomes, usades, p122, claus, traduides, visibilitatNota.idioma, SelectorDataHora.idioma, ConnexioDetall, NotesEditor → 9 fitxers, 762/762. Queda viva només `PASSOS_FETS` a `jarvis.test.js:31` (carril T1a, en àrbitre).
- 17:4x CET · Corrector T2b: `XatSection.enrere.test.jsx` reproduïx ARB-T2B-01 (1 roja) i després de la correcció 4 fitxers enrere 11/11; suite del xat + barres + hooks → 163 fitxers, 2244 passades; `design_guard` 3002/0/0.
- 17:4x CET · Corrector IDEA-62: `node --test tests/higiene-estructural.test.mjs` → 10/10 després d'A1-A7 (abans, la sonda ampliada queia 9/1: A1 reproduïda); `node --test tests/node-suite-policy.test.mjs` → 8/1 («Proves sense classificar: higiene-estructural, higiene-paquets»), roig esperat fins que MarIA aplique les dues entrades del dipòsit.
- 17:37 CET · Després de llevar `PASSOS_FETS` (definició sense ús) de `jarvis.test.js`: `npx vitest run src/sections/consola/jarvis.test.js src/sections/detail/qualitat.fantasmes.test.js` → 2 fitxers, 43/43: zero `no-unused-vars` a tot `src/`. Corrector T1a (17:3x): T1a-ARB-01 (CSRF: Origin = Host local, Sec-Fetch-Site, Content-Type application/json → 403/415) al dipòsit; ARB-03, ARB-04 i ARB-05 (normalitzaNotes passava de 56,9 s a lineal amb 200.000 espais) al codi; 69/69 al carril, carpeta `consola` 1094 passades.
- 17:38-17:40 CET · Navegador integrat (:3340): `/page/descarregues` pinta amb el text de sempre (APK directe i TestFlight encara tancats: cap píxel nou); `/consola/empaquetats` pinta el panell «Mode Jarvis Omnicanal d'1 Clic» (quatre canals, notes, botó); `/wikidepoble` carrega net. Les quatre entrades d'error de la consola («useWorkspace ha de viure dins de WorkspaceProvider», pila a `WikiDePobleSection`) són rancies: idèntiques en tres navegacions, dos segells `?t=` distints del mateix mòdul (`WorkspaceContext.jsx` …028 i …487): un artefacte d'HMR de quan T3 va tocar el context amb la pestanya aparcada a `/wikidepoble`; cap error nou en cap de les tres càrregues. Queda anotat com a troballa d'HMR (vegeu T-05).
- 17:42 CET · Verificador T1a (17:35): carpeta `consola` 1094 passades, però P1 per lectura: sota `<StrictMode>` el ref de muntatge quedava a `false` i el primer clic deixava el botó carregant. Reproduït amb la prova nova «sota <StrictMode>…» (cau amb el codi vell: el botó es queda `aria-busy` «Treballant…»), corregit (el ref torna a `true` en cada muntatge) i `npx vitest run` dels tres fitxers del carril → 70/70.
- 17:44 CET · Dues proves fora del kit i18n que simulaven `t()` tornant la reserva que el kit lleva: `MercatSection.carregaMes.test.jsx` (import de `createTranslator('ca')` al `beforeEach` i apòstrof tipogràfic, mirall del que el kit fa a `MercatSection.error.test.jsx`) i `FullAjustos.revisio.test.jsx` (els tres trossos que el kit del Xat de Codex ja porta per a eixe fitxer: traductor real i «oferix»); `npx vitest run` de les tres → 22/22.
- 17:45 CET · P1-12: `npx vitest run src/data/supabase/index.e2eeApagat.produccio.test.js` → 6/6 amb `PRIMITIVES_PERMESES` sense `HPKE` (trinquet tancat; les `@__PURE__` de `xifratXatCripto.js:58,77,415` verificades amb rg).
- 17:51 CET · Verificador de la integració i18n: 27 rutes → 26 fitxers / 1196 passades (roja única i aliena: `qualitat.fantasmes` per `mapejadorSeccions.ambit.test.js:119`, carril L1 de T0, nascut a les 17:49); `design_guard` 3008/0/0; `wc -c` 16/16 idèntics al kit (Codex va sincronitzar el seu `files/` amb el viu a les 17:45, T2b inclòs: la cadena de custòdia del kit la refà Codex, no la instantània original); `useCapaEnrere` a `XatSection.jsx:88,1040`.
- 17:58 CET · IDEA-49 (romanent «contrastar amb el Nomenclàtor»): un investigador de només lectura ha contrastat els 53 municipis de referència d'`aliesDePoblesSeed.js` (nom, àlies i comarca) amb l'AVL («Noms dels municipis valencians» 23/04/2026 i NTV), el PEGV (relació a 1/1/2026, comarca de la Llei 2/2020) i l'INE (taules 2856 i 2903, modificacions des de l'1/1/2026): 53 coincidixen, 0 diferixen, 0 sense verificar; també els 9 pobles de `townsSeed.js`. «Muro de Alcoy» continua sent l'oficial (el canvi que demana l'ajuntament no és a cap font). ARGOS i el Registre d'Entitats Locals no s'han pogut obrir (dominis denegats). Comentaris de la llavor i de la prova posats al dia amb les fonts; `npx vitest run src/sections/pobles/aliesDePobles.test.js` verd. Decisions per al Mestre: camp opcional `nomOficial` per als set oficials dobles i codi INE per municipi (R2/R3 de l'informe).
- 18:01-18:03 CET · Verificador T2c: `npx vitest run src/sections/xat/components src/sections/xat/XatSection.enrere.test.jsx src/config/pilaEnrere.test.js` → 82 fitxers, 922 passades; `npx vitest run src/sections/xat` → 149 fitxers, 2127 passades; `design_guard` 3018/0/0; rastre git del carril: 2 M + 2 ??.
- 18:08-18:10 CET · Correccions d'orquestradora fora de la propietat dels carrils de T0 (els àrbitres les demanaven): ARB-L4-01, `useCercaGlobal.js` declara `vehicle`, `treball` i `habitatge` a la font «mur» i les dues proves `[DEFECTE]` de `SearchSection.test.jsx` passen a proves normals; L1-A1 (P1), `NotesDataContext.jsx` conserva també `fitxa` en fusionar una pàgina de resums amb el detall (sense això «Actualitzar al Mur» tornava a publicar la nota sense àmbit), amb la prova ampliada; L1-A3, `content.js` i `contingutLocal.js` passen la secció de la fila a `elementDeFilaPublicada` i una prova nova a `content.test.js` fixa que una fila de 'mercat' amb un payload que es diu de 'mur' no entra com a fitxa. `npx vitest run` de cerca + notes + adaptadors: 17 fitxers / 611, 4 / 254 i `content.test.js` 25/25.
- 18:13-18:15 CET · Verificador de la integració del kit del Xat: les 15 rutes del kit (carpeta `src/sections/xat` sencera, `iaiaLocal.*`, `iaiaPublicacions`, `legal.iaia`, i18n p122/idiomes/usades/claus) → 163 fitxers, 3122 passades; `design_guard` 3024/0/0; `wc -c` 17/18 idèntics al payload i `iaiaLocal.js` amb els ancoratges literals del kit (línies 73 i 1192-1193) més el bloc T0 (762-797); `qualitat.fantasmes` 4/4 (l'àrbitre, 18:1x).
- 18:19-18:20 CET · Cinc proves fora de la propietat dels carrils que codificaven l'estat anterior, posades al dia: `PublicarDeLaPagina.test.jsx` i `PageDetailSection.publicar.test.jsx` (Mercat, Vehicle, Treball i Habitatge són portes obertes cap a `/notes?ambit=…`; Calendari, Mapa i Animalets continuen en obres), `imatgeSocial.test.js` i `visibilitatTraduible.seguretat.test.js` (les llistes exactes porten les tres verticals), `accionsDeText.test.js` («Anar al xat» en remot i en mode desconegut va a la conversa local de la IAIA, T6 del kit del Xat). `npx vitest run` → 5 fitxers / 92 i després 4 / 76 (Panell de Control inclòs).
- 18:22-18:23 CET · Kit `261102_kit_codex_hmr_workspace` de Codex (la correcció de T-05: la identitat del context de l'espai de treball passa a `workspaceContextIntern.js`, un mòdul sense components que Fast Refresh no reavalua; prova `WorkspaceContext.hmr.test.jsx` amb dos versions del mòdul per `?versio=`): integrat a mà (dos trossos + dos fitxers nous); `npx vitest run src/components/universal/workspace` → 40 fitxers, 480/480. L2-A3 (la fitxa que `netejaCamp` convertia en «[object Object]» en crear la nota preparada per `?ambit=`): `netejaCamp.js` coacciona `fitxa` pel contracte, prova nova `netejaCamp.fitxa.test.js` 3/3. L3-A3: `abastConnexio.js` sap dir «des de Compartir cotxe / Treball / Habitatge», prova ampliada.
- 18:2x-18:30 CET · Correctors de T0: L1 (`NotesContext.jsx`: 14/14 després de 4 roges reproduïdes; 24 fitxers / 845; 63 / 733), L2 (`DialegAmbit.jsx`, `NotesEditor.jsx` + proves: 26/26; 94 fitxers / 1278), L3 (`detailSectionMeta.jsx`, `TargetaDelMur.jsx`, `MercatSection.jsx` + proves: 4 / 83, 13 / 471, 121 fitxers / 1870 + 1 omesa); `design_guard` 3027 fitxers, 0 crítics, 0 avisos. Les 4 roges transitòries que L2 va vore a `NotesContext.ambit.test.jsx` eren l'escriptura concurrent de L1 (repetició neta).
- 18:3x CET · Ordre de tancament del Mestre (prompt `261102_1821`): L2b (`wloe57jig`) aturat; `NotesSection.jsx` (17:57) i `NotesSection.ambit.test.jsx` (18:03) sense cap escriptura de L2b (mtime anterior a l'arrancada del Gauntlet, 18:28). Cap Gauntlet ni subagent nou.
- 18:30-18:4x CET · Verificador transversal de T0 (últim pas del workflow, només lectura; el workflow sencer: 16 agents, 0 errors, 97 minuts): `npx vitest run src/utils/publicacioUniversal.test.js src/data src/sections/notes src/components/universal/ambits src/components/universal/classificacio src/sections/verticals src/sections/mur src/sections/mercat src/sections/detail src/sections/control src/sections/search src/config` → **492 fitxers verds d'un total de 493 · 9247 proves verdes, 2 omeses, 1 roja** (311 s); `design_guard` 3027/0/0. **L'única roja és aliena a T0:** `src/data/supabase/politicaPrivacitat23.migracio.test.js` §18 («la darrera migració que segella porta el text que /legal servix hui»): el kit Xat/IAIA de Codex va reescriure l'apartat 14 de `legalContent.js` (ARB-XAT-01) sense pujar la versió del rètol («Versió 2.3», línia 13) ni segellar-la en una migració nova, i la guarda SDP-RGPD-021 mossega. Cap fitxer de T0 toca `legalContent.js`. El verificador dona T0 per FET en 15 de 17 requeriments; el 16 (0 errors de consola al :3340) no l'ha pogut executar ell, però l'he verificat jo sense sessió a T-06 (18:24-18:27); el 17 (suite verda) queda PARCIAL per eixa roja aliena. Pendents que confirma oberts: L3-A5, L2-A1/A2, ARB-L4-02, migració `2611021800`. Risc nou que apunta: el «Mostra més» de les verticals pagina la secció `mur` sencera (cap paginació per àmbit al port): amb molts posts, una vertical pot mostrar pàgines buides fins a trobar fitxes.
- 19:57 CET · Relleu 6, línia base de l'Onada 2 a l'arbre viu: `npx vitest run` de NotesSection*, NotesEditor.ambit, NotesContext.ambit, `workspace`, `ambits`, `verticals`, `tests/host.hmr.test.js`, EspaiCerca, SearchSection (2) i Lector (3) → 76 fitxers, 1057/1057 (abans d'AUD-01).
- 19:58 CET · `npx vitest run src/config/i18n src/config/idiomes src/sections/detail/qualitat.fantasmes.test.js` → 11 fitxers, 687/687. `design_guard` 3030/0/0. `porta-olivera` exit 0, 0 avisos.
- 20:0x CET · AUD-O2-T4-01: amb les 3 proves noves i el codi vell, `SeccioVertical.test.jsx` dona 2 roges i 23 verdes (reproducció); després de la correcció, `npx vitest run src/sections/verticals` → 2 fitxers, 39/39. ESLint dels dos fitxers sense incidències.
- 20:0x CET · AUD-01: corrector aplicat amb CAS. Després, les rutes del manifest del kit més les suites de l'Onada 2 i `qualitat.fantasmes` → 78 fitxers, 1104/1104. ESLint dels dos fitxers sense incidències.
- 20:06 CET · Navegador integrat contra el :3340 (servidor del Mestre; no l'he arrancat): `/vehicle` es pinta amb el text de buit de l'àmbit i 0 errors de consola; `/notes` es pinta amb la tria automàtica (nota del tutorial) i 0 errors.
- 20:08 CET · Tots els consumidors de `WorkspaceContext` (`apps/lector`, `apps/plataforma`, `PedraSeca/hooks`, `layout`, `workspace`, `admin`, `disseny`, `multimedia`, `notes`, `profile`, `search`, `text`, `wiki-de-poble`, `verticals`, `mur`) → 478 fitxers, 6736 verdes i 2 roges. Les dues roges són `PerfilPublicSection.test.jsx` D12 (T-08, aliena). Després de posar-la al dia, `npx vitest run src/sections/profile src/sections/xat/rutaDelXatDeLaIAIA.test.js` → 91 fitxers, 1212/1212.
- 20:10 CET · Portes finals: `design_guard` 3030/0/0; `porta-olivera` exit 0, 0 avisos. `tancament.mjs --check --turn-id torn_d19293b9…`: les nou comprovacions transversals en 0. El torn no es pot tancar per tres motius:
  - no tenia pla: resolt a les 20:11 amb `document.mjs plan` (estat `planned`);
  - `.agents/LEDGER.md` no porta l'id sencer del torn: és govern, i la línia està al dipòsit §10;
  - 9 captures noves del Mestre a `01_produccio/` (19:14-20:00), posteriors a l'obertura del torn: zona humana, cap agent les pot tocar.
- 20:51-20:52 CET · Relleu 7, base: `node --test tests/kit-carril.test.mjs tests/build-net-dsstore.test.mjs tests/opendata-fediversity.test.mjs tests/standalone-build.test.mjs tests/natiu-build.test.mjs tooling/seo/genera-federacio.test.mjs tests/node-suite-policy.test.mjs` → 140 proves, 137 verdes, 3 omeses («dist-natiu/ és anterior a public/_headers»), 0 roges. `recursosDelPlugin('public')` → 489 recursos, amb `_headers` i `_redirects` dins.
- 20:53 CET · Paquet d'`opendata` regenerat en el scratchpad amb la crida de la prova: els 9 textos tenen el hash del manifest i `municipi.jsonld` és idèntic al viu. Després d'esborrar el directori temporal, no en queda cap resta.
- 20:54 CET · Prova de paritat completa afegida: sense els recursos, 2 verdes i 1 roja (`agenda.jsonld` absent). Amb els 8 publicats i els dos polits, `node --test` de les mateixes 7 rutes més `tests/higiene-estructural.test.mjs` → 150 proves, 147 verdes, 3 omeses, 0 roges.
- 20:55 CET · `npx vitest run src/sections/profile src/config/i18n src/config/idiomes src/sections/detail/qualitat.fantasmes.test.js src/sections/notes/visibilitatNota.idioma.test.js` → 102 fitxers, 1920/1920. ESLint de `CosPersonesConfianca.jsx` i de la seua prova, sense incidències.
- 20:56 CET · `curl` al :3340 (servidor del Mestre): `/opendata/manifest.json` 200 `application/json`, `/opendata/municipi.jsonld` i `/opendata/agenda.jsonld` 200 `application/ld+json`, `/opendata/llicencies.md` 200 `text/markdown`, cap HTML.
- 20:57 CET · `design_guard` PASSA; `porta-olivera` exit 0.
- Dipòsit de governança per a MarIA a `02_investigacio_ia/261102_1640_claude/governanca/`: `00_LLEGIM.txt` en versió de tancament (§0 estat del tancament, §1 ordre d'aplicació amb els set kits nous i el conflicte de `.gitignore`, §2 bloc ESTAT_ACTUAL, §3 LEDGER, §4 kits, §5 seguretat, §6 decisions i receptes, §7 lliçons, §9 fitxers de T0), `LLEGIM.txt` + `tooling/vite/consola-iaia.mjs` (T1a) i `LLEGIM_HIGIENE.txt` (IDEA-62).
- 21:45 CET (261102) · Relleu 8, línia base: Vitest 31.284 en verd i 6 roges en 3 fitxers; `node --test` 2.104 de 2.109, 2 roges a `mapa-consola`.
- 23:25-23:38 CET · Després de l'eixam, del kit Codex i de les peticions fora de carril: Vitest sencer, 1.762 fitxers i 31.422 proves en verd, 0 roges; `node --test` 2.153 de 2.156, 0 fallades (3 diagnòstics heretats). Frontissa 16/16, certifica-enllacos, fronteres-skills, design_guard i Olivera: exit 0.
- 00:02-00:15 CET (261103) · Després del Gauntlet: Vitest 1.764 fitxers i 31.455 en verd, 0 roges; `node --test` 2.157 de 2.160, 0 fallades.
- 00:41 CET · Després de la fusió de Gemini i del pegat ARB-G-01: `src/sections/text`, `src/config`, `src/sections/detail`, App.fediversity i richText → 145 fitxers, 2.995/2.995; certifica-enllacos exit 0 en els dos modes.
- 00:5x CET · Relleu 9, reconciliació: frontissa 16/16 amb l'empremta de les 23:2x; targetes, PedraSeca, text, detall i configuració → 220 fitxers, 3.870/3.870; `CosAmbTargetes.senseRouter.test.jsx` 2 roges amb el fitxer de HEAD i 3/3 amb el nou; `fronteres-skills` 0; proves de govern 29/29; segell reconciliat.
- 01:00-01:16 CET · Vitest sencer, 1.765 fitxers i 31.458 en verd, 0 roges; `node --test` 2.163 de 2.166, 0 fallades (3 diagnòstics heretats). Kit R2: `tests/tractor-rls-r2-ddl.test.mjs` 33/33.
- 01:14-01:16 CET · Captures d'App Store: 6 PNG a mida exacta, comprovades amb `sips` i revisades visualment pel constructor, per l'àrbitre i per mi.
- 01:1x CET · `npm run build`: exit 0, cap fitxer versionat modificat (comparació de hashos abans i després) i cap fitxer nou fora de `dist/`. Portes finals, totes exit 0: frontissa 16/16, certifica-enllacos, fronteres-skills, design_guard, Olivera, segell `e93f12df`, `tractor-rls` (74 fitxers) i `tractor-vocabulari`. `tancament.mjs --check`: tots els controls transversals en 0 i el torn bloquejat només per la zona humana (97 captures a `01_produccio/`) i per una escriptura concurrent aliena; el pla 1532, modificat amb el Bloc T5, l'he tornat a vincular.
- 03:20 CET (relleu 10) · Salt a v1.1.0: `versio.test.js` i `src/sections/detail` → 35 fitxers, 428/428.
- 04:01-04:03 CET · 8 pàgines de secció i `destinsControl` al dia: `src/sections/control` → 12 fitxers, 143/143. Correccions de G4b: 39 fitxers, 951/951. Versions amb Google Play i la nova guarda de `perAppNativa`: 70/70.
- 04:05-04:20 CET · Vitest sencer (1a passada): 31.480 en verd i 6 roges. Eren 5 de la Consola, pel salt de versió, i 1 de la Card tutorial, per les negretes; totes arreglades (Consola 53 fitxers, 1.129 en verd; tutorial 33/33). A banda, `wordpress-plugin/tests/ajustos.test.mjs` (Codex).
- 04:2x CET · `node --test` sencer: 2.182 proves, 2.177 en verd. Les 2 fallades són H4 i H7 d'higiene, per `wordpress-plugin/tests/` (Codex), i hi ha 3 diagnòstics heretats.
- 04:3x CET · Després del Gauntlet transversal i del kit de Codex: 97 carpetes de proves afectades → 1.498/1.498; text, legal, Supabase legal, hosting i cerca → 42 fitxers, 681/681; `node --test` d'opendata-fediversity, documental, fortificació, public_exports i frontissa → 70/70. Kit de Codex: `kit-carril.mjs check` i `apply` valid, 19/19 hashos finals exactes; `aplicador.test.mjs` del kit 7/9 (les 2 roges hi tornen a aplicar el kit original, cosa esperada després d'aplicar-lo).
- 04:3x CET · Portes, totes exit 0: frontissa 16/16, `certifica-enllacos`, `fronteres-skills` (42 skills, 0 violacions), `design_guard` (3.046 fitxers, 0 crítics), Olivera, `tractor-rls` (74 sql), `tractor-vocabulari`, segell (`262585b7`) i `porta-autoritat`.
- 04:37-04:51 CET · Passada final:
  - **Vitest sencer:** 1.778 fitxers; 31.499 en verd, 103 omeses i 1 roja, `catalegMigracions.readme.test.js`. El kit de Codex havia posat fora d'ordre la vinyeta de `2611030330` a `supabase/README.md`; l'he moguda al seu lloc, sense canviar cap paraula, i ara 4/4 i `src/data/supabase` 99 fitxers, 1.994/1.994. A banda, `wordpress-plugin/tests/ajustos.test.mjs` (Codex).
  - **`node --test` sencer:** 2.189 proves, 2.184 en verd. Les 2 fallades són H4 i H7 (Codex), i hi ha 3 diagnòstics heretats.
  - **`npm run build`:** exit 0. Regenera `public/rag-index.json` a partir de 4 documents de la Wiki d'altres mans; l'he tornat a l'estat d'abans del build.
- 04:5x CET · Auditor de Gemini (`--json`, sense `--write-report`): versió 1.1.0 i /versions a punt. `PAGE_COPY`: 326 paràgrafs, mitjana de 6,19 `<strong>` i 0 plans. Legal: 0 plans i 37 per davall del seu tram. Plugins: 0 i 0. Nota: 0 plans.
  - Marca `gd01` i `arbXat01LegalSeal` com a pendents, però no ho són: G-D-01 és a les tres configuracions (l'auditor demana a més el servidor de desenvolupament), i l'HTML viu de Legal té l'empremta `2956bc30…` que segella la migració 2.4 (`politicaPrivacitat24.migracio.test.js` 4/4).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Relleu 11 (Onades 7-9).**
  - **Fronteres:** cap commit, push, desplegament, `npm install`, SQL remot ni lectura de fitxers d'entorn.
  - **Escriptures de governança, totes per l'ordre nocturna:**
    - les aprovacions de la frontissa amb la CLI;
    - les entrades del manifest de node:test;
    - `tractor-frontmatter.mjs`;
    - `package-lock.json`, dues línies de versió.
  - **Com s'ha materialitzat:** per script CAS amb preimatges, i no amb `Edit`, per garantir l'atomicitat per fitxer de 180 rutes.
  - **Sessió arrancada a la carpeta mare:** els hooks de `socdepoble.org/.claude/settings.json` no s'hi carreguen, i les fronteres les he complides jo.
  - **Sense verificar:**
    - el navegador amb sessió real;
    - Nix (no n'hi ha a la màquina);
    - la geometria de les Cards en aparells reals.
  - **Porta Frontmatter:** roja per deute que ja hi era a les 07:31, més `dist-natiu/opendata/*.md`. Cal sanejar-ho o tornar a segellar-la (MarIA o el Mestre).
  - **Atles:** les 11 decisions del Mestre dels 5 enxufes queden obertes.
- Cap commit, push, desplegament, `npm install`, SQL remot ni lectura de fitxers d'entorn. Cap escriptura a `tooling/`, `scripts/`, `.agents/`, `package.json` ni fora del repositori (el hook local ho bloqueja sense lease; no hi ha lease activa).
- `npm run build`, ESLint i la suite sencera de node:test no es poden llançar des d'esta sessió (el hook només admet `npx vitest run <fitxers>` i `node --test tests/<fitxer>`): la verificació de build queda per a MarIA o el Mestre.
- Moure o esborrar fitxers (IDEA-62) és acció de MarIA o del Mestre: ací només s'auditen i es protegixen amb una guarda.
- Publicar de veres contra Supabase des del navegador exigix sessió i mode remot: la publicació es verifica amb l'adaptador local en proves d'integració, i al :3340 només es verifica que les pàgines noves pinten sense errors.
- Tancament per quota (prompt `261102_1821`, 18:19): des de les 18:3x no s'ha obert cap Gauntlet ni subagent; L2b, L3-A5, les claus i18n de L2-A1/A2 i els set kits nous queden com a receptes per a MarIA, Codex i Gemini (dipòsit `00_LLEGIM.txt` §1.4 i §6). Els dos kits de Gemini s'han auditat només pel manifest, no fitxer a fitxer.
- Relleu 6 (Teler Invertit). Un sol subagent àrbitre de només lectura, sense Verificador extra, sense workflow, sense cron i sense servidor arrancat. Cap commit, push, desplegament, `npm install` ni SQL. Cap escriptura a `tooling/`, `scripts/`, `.agents/` ni `package.json`. A `src/` només he escrit `SeccioVertical.jsx` i la seua prova, `PerfilPublicSection.test.jsx` i els dos fitxers del corrector de Codex. Aquesta sessió va arrancar a la carpeta mare `Som de Poble/`, així que els hooks de `socdepoble.org/.claude/settings.json` no s'hi carreguen: les fronteres les he complides jo, no el hook. L'Àrbitre no ha executat proves i les correccions de paginació són seues; les proves que les validen són les meues. jsdom no valida la geometria real ni el Supabase remot: la paginació amb persones bloquejades de veritat només es pot provar amb sessió al :3340.
- Relleu 7: fil principal, cap subagent. Escrits per ordre explícita del Mestre de «reparar directament a l'arbre viu»:
  - `vite.standalone.config.js`, `tests/standalone-build.test.mjs`, `tests/higiene-estructural.test.mjs` i `tests/opendata-fediversity.test.mjs`;
  - els 8 recursos nous de `public/opendata/`.
  
  No he executat cap build web ni natiu: escriuria `dist/` o `dist-natiu/` a l'arbre del Mestre. El build web el va acreditar Codex en còpia, i les 3 proves de `dist-natiu` queden omeses fins a la pròxima compilació. Cap desplegament: els recursos d'`opendata` arriben a producció amb el pròxim deploy de Firebase.
- Relleus 8 i 9 (Onades 4 i 5). Cap commit, push, desplegament, `npm install`, SQL remot ni lectura de fitxers d'entorn. Sessió arrancada a la carpeta mare: els hooks de `socdepoble.org/.claude/settings.json` no s'hi carreguen, i les fronteres les he complides jo.
  - **Escriptures de governança, totes per ordre explícita:** la frontissa amb la CLI (O4-CLAUDE-2); el kit Codex per CAS; el kit R2 (Onada 5, `tooling/` al meu carril); i les dues seccions de lliçons més el segell reconciliat (O5-CLAUDE-1).
  - **Sense verificar al navegador amb sessió:** el camí /control «Publicar» → `/notes?ambit=`. Sense sessió, `calEntrar` no prepara cap nota; l'àmbit s'ha verificat amb l'espècimen real de `/disseny`.
  - **Altres límits:**
    - el doble logotip i el vel dels calaixos, vistos només a 375 px;
    - cap iPhone ni iPad físic;
    - una fila remota de `pages` a Supabase per a `projecte`, `descarregues` o `fediversity` taparia PAGE_COPY en producció, i no ho he pogut comprovar.
  - **Decisions del Mestre que queden obertes (Gauntlet O4 i carrils):**
    - **D6-01 (P1):** la frase literal del cas 4 de `core-context-panic` i la seua prova.
    - **D6-03 (P1):** la prohibició a MarIA de tocar `src/` i `tests/` durant les auditories (`core-secretaria-auditoria`).
    - **D6-04, D6-06 i D6-11:** delegació de moviments i contracte d'escriptura de `core-higiene-escriptori`, la plantilla i la Regla d'Or de `core-context-panic`, i l'activació universal de `core-comprensio-reflexiva`. Són skills reescrites pel kit Codex que l'ordre d'Onada 5 no cobria: només en restaurava dues.
    - **D1-02 (P2):** `/vehicle`, `/treball` i `/habitatge` no tenen entrada de navegació des que ixen de SECTION_ORDER.
    - **D2-03 (P2):** una fitxa omplida abans del títol no crea la nota i es perd en eixir.
    - **D2-04 i D2-06:** moure de carpeta una nota vertical amb dades, i un `?ambit=mur` per a «Publicar al Mur».
    - **D5-03:** les fletxes del grup de ràdios escriuen la fitxa en explorar.
    - **D1-03:** per a Codex, `certifica-enllacos` accepta `/legal/x` i rebutja `/events/x`.
    - **B1b-01:** amagar la marca del calaix compacte (doble logotip) o conservar-la.
    - **C2-06:** el text de mostra de la subtargeta es desa si no es canvia.
    - **G-D-01:** el tipus `application/activity+json` d'`activitystreams.json` als tres fitxers de capçaleres. Relleu 10: resolt pel kit de Codex, integrat per CAS (`firebase.json`, `vercel.json` i `public/_headers`).
- Relleu 10 (Onada 6). Cap commit, push, desplegament, `npm install`, SQL remot ni lectura de fitxers d'entorn.
  - **Escriptures fora de la llista del carril:** les 5 proves de T-13, ajustades per la clàusula de Riscos del prompt; la prova nova `appSeed.notaTutorial.test.js`; i el kit de Codex, aplicat per CAS per l'ordre T2.4.
  - **`public/rag-index.json`:** el build el regenera a partir de 4 documents de la Wiki que han tocat altres mans. L'he deixat com era abans del build.
  - **Decisions del Mestre que queden obertes en esta onada:**
    - **O6-D1 (WordPress.org):** quan l'SVN porte la 1.1.12 (o la 1.1.11), cal canviar la capçalera i l'etiqueta de `/versions`. Les proves ho exigiran.
    - **O6-D2 (Legal):** Legal 2.4 encara té 26 `<li><strong>Etiqueta:</strong>` i 39 paràgrafs per davall del tram. Qualsevol canvi més canvia l'empremta que fixa la migració 2.4, i per això ha d'anar amb Codex abans de desplegar-la. Mentrestant, `/versions` diu «llevat de Legal».
    - **O6-D3 (versionCode):** la 1.1.0 continua amb `versionCode 2`. Per a la pròxima pujada a Google Play cal el 3 o més.
    - **O6-D4 (VER-08):** l'app d'Android també lleva l'apartat de Google Play de `/versions`, perquè `perAppNativa` no distingix plataformes.
    - **O6-D5 (cerca i porta editorial):** el pegat de l'extracte de `/cerca` (espais solts al voltant de les negretes) i el de la porta `check-editorial-copy`, que compta paraules i no sintagmes. Tots dos són preparats i sense aplicar.
    - **O6-D6 (traducció):** amb més negretes, el pressupost de 10.000 caràcters de la traducció passa menys blocs en HTML, i la vista traduïda perd negretes. Opció B al scratchpad del Gauntlet.
    - **O6-D7 (Card tutorial):** la còpia local (`localNotes.js`) congela la Card vella per a qui ja havia escrit una nota, i `supabase/seed.sql` és del 23-10. Cal regenerar-lo, i pujar `APP_SEED_VERSION` si canvia.
    - **O6-D8 (text):** la Constitució §5 diu «Sollutia (Supabase)», i `/projecte` diu que Sollutia no és Supabase. A més, `/page/xat` presenta com a futures les notes de veu i les imatges, que ja existixen.
  - **Per a Codex:** `wordpress-plugin/tests/` encén les guardes H4 i H7 de `tests/higiene-estructural.test.mjs`. A més, Vitest arreplega `ajustos.test.mjs` i hi peta (vol una URL `file:`). Amb `node --test` passa 16 de 16.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]]
- [[../90_arxiu_historic/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre|261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre]]
- [[261102_1638_auditoria_codex]]
