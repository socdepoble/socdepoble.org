---
type: informe
status: esborrany
description: Implementació i auditoria de BarraTaronja multi-entitat registrada, PanellTraspasPublicacioInline, 5 llengües de Disseny/Versions/Node0, curació fotobotànica multimodal i Kit CAS R19.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_69e1cfcf-87f0-483b-8e6c-57871a685233:c7e1edc9-6c66-46b9-80bf-43f275d6ded4
---
# Auditoria Gemini Carbon de l’Onada R19 · Barra Taronja composta, editorial 5 llengües i botànica multimodal

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_69e1cfcf-87f0-483b-8e6c-57871a685233:c7e1edc9-6c66-46b9-80bf-43f275d6ded4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T18:55:54.026Z |
| Modificació | 2026-11-11T18:57:30.000Z |
| Propietari | Gemini 4 Carbon (High) |
| Aprovació humana | Encàrrec autònom R19 del Mestre i Pla d’Implementació v1.1.0 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) · Carril 3 d’Onada R19 + revisor pedant `egm-codebase-details` + Node 0 (`gemma3:12b`) |
| Tokens consumits | El torn d’execució no exposa un comptador extern verificable |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T18:55:54.026Z · Esborrany creat pel circuit documental canònic (`torn_69e1cfcf-87f0-483b-8e6c-57871a685233`).
- 2026-11-11T18:57:30.000Z · Completats la Matriu de Conformitat de Requeriments (MCR), els tres Gauntlet Loops (UI Pedra Seca, botànica multimodal i matriu CDP 126/126), les 15 dimensions `D01`–`D15` i la verificació en doble ordre del Kit CAS `261111_kit_carbon_r19_barra_taronja_composta_i_editorial`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

El Carril 3 (`Gemini 4 Carbon`) ha operat exclusivament sobre el clon efímer `/private/tmp/sdp_carbon_r19` sense mutar cap fitxer de `src/`, `public/`, `tooling/` ni `.git/` a `socdepoble.org/`. Tot el treball de codi s’entrega segellat al Kit CAS `../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/` (`37` fitxers gestionats sota `src/`, `99` artefactes regulars inventariats a `SHA256SUMS`) i verificat tant sobre l’estat viu actual de `socdepoble.org/` (`HEAD c07f78b83` més les esmenes en viu de Claude de les `19:08` i `19:38 CET`) com sobre l’estat post-Codex mitjançant `alternate_transitions`.

### Matriu de Conformitat de Requeriments (MCR)

| Requeriment | Estat | Evidència mesurada i abast |
| --- | --- | --- |
| `T1` · UI Pedra Seca de `BarraTaronja` multi-entitat registrada i `AvatarCompostPublicadors` (`0 px` radi) | `[FET]` al clon i Kit CAS | Mosaic quadrangular determinista per a `2` (`50/50` vertical), `3` (`1` meitat esquerra + `2` apilats a la dreta) i `4+` (`2×2` amb indicador `+N`), `border-radius: 0`, separadors nets amb tokens públics `--sdp-*`, enllaços individuals per entitat i resolució opaca `sdp-media://` per cel·la. `BarraTaronja.copublicacioR19.test.jsx` (`6/6`). |
| `T1` · Guarda d’acreditació al padró, fallback a `Sóc de Poble` i marcador exacte `?registre=persona\|organitzacio` (`P0-CONTRACTE-06`) | `[FET]` al clon i Kit CAS | `publicadorsBarraTaronja.js` rebutja qualsevol cadena lliure o DTO arbitrari no acreditat (p. ex. `'Pedro Ferrer Rodriguez'` sense compte verificat), retorna `[PUBLICADOR_PER_DEFECTE]` quan cap actor supera la guarda i exigeix/conserva exclusivament el marcador exacte `?registre=persona` o `?registre=organitzacio` tant en mode compost com en navegació d’actor únic (`MemoryRouter` + `Link`). |
| `T2` · `PanellTraspasPublicacioInline` d’1 clic integrat en flux de lectura i espècimen a `/disseny` | `[FET]` al clon i Kit CAS | Zero modals flotants, botons centrats `>= 48 px` (`--sdp-touch`), zero `<dl>` de dues columnes, connexió real a `lligPublicadorsRegistrats`, `traspassaPublicacio` i `reverteixTraspasPublicacio`, `operacioId` UUID preservat en reintents de traspàs i de reversió, bloqueig d’acció durant càrrega de nou recurs (`P1-CARBON-03`), avís AAL2 i aïllament total de `modeEspecimen`. Connectat a `PageDetailSection`, `TextSection`, `ReceptesWorkspaceSection`, `ReceptaDetailSection`, `NaturaPatrimoniWorkspaceSection` i `/disseny?categoria=formularis&item=formularis-traspas-copublicacio`. `PanellTraspasPublicacioInline.test.jsx` (`9/9`) i `PageDetailSection.copublicacio.test.jsx` (`8/8`). |
| `T3` · Coherència editorial pentalingüe (`/versions`, `/page/node-zero`, `/page/fediversity`, `/disseny`) i paritat i18n | `[FET]` al clon i Kit CAS | `FITA_R19` encapçala `/versions` en `ca, es, en, eu, gl`; `DesignSection.jsx` passa per `localitzaPagina` i incorpora el 7è apartat de co-publicació en les 5 llengües; `aiNode0` documenta les 8 escoles locals del Node 0 i `Z-Image-Turbo-mflux-4bit` preservant l’enllaç de Claude a `/plugin/genealogia` i l’oracle executable `INVENTARI_CONTRACTE`; claus `pagina.barra.copublicadors` i `pagina.barra.avatarCompost` als 5 diccionaris. `i18n.p122.test.js` (`377/377`), `i18n.usades.test.js` (`6/6`), `pageContent.fediversity.test.js` (`42/42`), `pageContent.r10.test.js` (`28/28`), `pageContent.versions.test.js` (`71/71`). |
| `T4` · Auditoria multimodal creuada `Carbon + Node 0 (gemma3:12b)` i reemplaçaments òptics de Commons | `[PARCIAL]` amb contenció i evidència | Inspecció multimodal `77/77` a `CURACIO_MULTIMODAL_CARBON_R19.json` (`72` postimatges base + `5` reemplaçaments òptics). Caçats falsos positius crítics (`atles-14-all-v3-llavor`, `herbari-113-timo-v2-macro`, `cv-04-alberginia-blanca-v2-flor-fruit`, `herbari-102-romer-v1-habit`). Lliurats 5 reemplaçaments òptics de Wikimedia Commons amb TASL complet (`CC-BY-3.0-US` preservada) i `rangEvidencia` honest. D’acord amb Claude i Codex, `0` injeccions cegues del Node 0 (`aprovatPerInjeccio: false`) i quarantena de les 67 recreacions sintètiques; la cobertura òptica de cultivar/accés per a totes les varietats locals resta oberta a les 4 revisions. |
| `Loop 3` · Auditoria visual Chromium CDP `375 / 768 / 1440 px` (`light / dark`) i pressupost de paquet Web + WP | `[FET]` | `126/126` comprovacions passades (`21` rutes incloent Panell de Control i les 7 eines locals: Genealogia, Gestoria, Bar, Nevera, Salut, Lector i Avisador) amb `overflowFailures === 0`, `runtimeErrorChecks === 0` i `brokenAssetChecks === 0`. `build:web` en `218.181 B` gzip-9 (`<= 250.000 B`) i `build:wp` (`soc-de-poble`: `659.59 kB` / `216.81 kB` gzip), amb `laminesBotaniquesNode0` diferit (`3.89 kB` gzip). |
| Lliurament de Kit CAS reversible, vot al Tauler i informe canònic amb MCR + `D01`–`D15` | `[FET]` | Kit `261111_kit_carbon_r19_barra_taronja_composta_i_editorial` verificat amb `SHA256SUMS` (`772ab2ee…`), `MANIFEST.json` (`e04e77da…`), assaig `--aplica` + `--rollback --aplica` en tots dos ordres i vot `[ACORD UNÀNIME R19 · Gemini 4 Carbon]` registrat al Tauler. |

### Mètode MIT, Gauntlet i Google EGM

1. **Acumulació multidireccional.** Abans d’editar una sola línia, s’han contrastat el Pla v1.1.0, el prompt de Carril 3, el `DOSSIER_NODE0_PREMASTEGAT_R19.md`, el `TAULER_CONVERSA_I_CONSENS_R19.md`, l’estat viu dels adaptadors de `copublicacio` i les preimatges en moviment de Claude i Codex.
2. **Cinc nuclis estructurals.** (a) Acreditació d’identitat al padró vs crèdit bibliogràfic d’obra (`copyright`); (b) geometria Pedra Seca quadrangular sense radis espúries ni hexadecimals; (c) concurrència i idempotència (`operacioId`, descart de lectures obsoletes i marcador `?registre=`); (d) separació d’un sol punt d’entrada diferit per al catàleg fotobotànic; (e) composició CAS commutativa entre els Kits de Codex i Carbon.
3. **Filtre Feynman.** Una entitat només pot aparéixer com a co-publicadora a la Barra Taronja si té un compte registrat verificat al padró; l’autoria històrica d’un llibre («Fins rebentar com Sangonereta», «El Rentonar», CEIP Cristòfol Colom) roman intacta als crèdits editorials fins que l’entitat tinga compte i s’execute un traspàs registrat i reversible.
4. **Test socràtic i Gauntlet adversarial.** S’han sotmés els components i les imatges a quatre rondes d’atac: (i) injecció d’strings solts, rutes amb paràmetres no acreditats (`?registre=inventat`) i marcadors contradictoris; (ii) canvi ràpid de recurs i tancament de sessió AAL2 a mitjan lectura a `PanellTraspasPublicacioInline`; (iii) auditoria independent amb el subagent pedant `egm-codebase-details` (`db17fa9d-6a72-4fd5-b049-c9d9f23272e4`), que va destapar la manca de les 2 claus i18n als 5 diccionaris, la resolució `sdp-media://` a `AvatarCompostPublicadors` i la desconnexió de `ReceptaDetailSection` / `NaturaPatrimoniWorkspaceSection`; (iv) contrast multimodal `Gemini 4 Carbon + gemma3:12b` sobre cada WebP botànic i inspecció visual de les captures de `375 px` (on es va corregir el tall del subtítol CamelCase a `manifest.js`).
5. **Consolidació en Kit CAS commutatiu.** Totes les troballes reals s’han corregit al clon, revalidat amb ESLint, Vitest, Design Guard, Tractor Pedra Seca i Chromium CDP, i empaquetat amb `alternate_transitions` perquè l’aplicació siga atòmica tant abans com després de Codex.

### Dimensions D01–D15

| Codi | Dimensió | Nota | Evidència verificada i límit |
| --- | --- | --- | --- |
| `D01` | Enxufabilitat i Port Neutral (Model B) | `9/10` | `BarraTaronja`, `publicadorsBarraTaronja` i `PanellTraspasPublicacioInline` operen exclusivament a través de `backendPort.js` (`lligPublicadorsRegistrats`, `traspassaPublicacio`, `reverteixTraspasPublicacio`) i `useUIStateOpcional()`, preservant `backendScope` en multi-instància i WordPress. |
| `D02` | Seguretat, RLS, Auth AAL2 i Sanejament | `9/10` | Guarda inviolable d’actors acreditats (`UUID` + `/perfil/<uuid>` amb acceptació exclusiva de `?registre=persona\|organitzacio`), bloqueig en AAL1, descart d’operacions en tancar sessió i `referrerPolicy="no-referrer"` a cada cel·la d’avatar. |
| `D03` | Disseny Pedra Seca i Coherència Geomètrica | `9/10` | `Design Guard` (`3.788` fitxers, `0` crítics, `0` avisos) i `Tractor Pedra Seca` (`0` infraccions en lleis dures, `0` hex/rgb/oklch, `0` estils en línia). Mosaic quadrangular amb `border-radius: 0` i botons centrats `>= 48 px`. |
| `D04` | Accessibilitat WCAG 2.2 AAA i Ergonomia Rural | `8.5/10` | Regions `aria-label` localitzades, grup `role="group"` per a co-publicadors, objectius tàctils `--sdp-touch`, atributs `lang="ca"` en contingut fix d’espècimen/admin i `0 px` de desbordament en `375 / 768 / 1440 px` (`light / dark`). Pendent validació amb lector de pantalla físic iOS/Android. |
| `D05` | Rendiment i Pressupost del Nucli Verge | `9/10` | `build:web` en `218.181 B` gzip-9 (`31.819 B` de marge sota el sostre de `250.000 B`) i `build:wp` en `216.81 kB` gzip per a `soc-de-poble`, mantenint `laminesBotaniquesNode0` en chunk diferit (`3.89 kB` gzip). |
| `D06` | Local-First, Resiliència Offline i Privadesa | `8.5/10` | Sense capacitat `copublicacio` o en `versio === 0`, totes les portades i fitxes conserven síncronament la reserva editorial sense errors de consola ni peticions fallides; `modeEspecimen` opera 100% en memòria. |
| `D07` | Paritat Pentalingüe i Qualitat Editorial | `9.5/10` | `FITA_R19`, `TRADUCCIONS_DISSENY`, `aiNode0` i les claus `pagina.barra.*` completes en `ca, es, en, eu, gl`. `i18n.p122.test.js` (`377/377`), `i18n.usades.test.js` (`6/6`) i `147/147` proves editorials de `pageContent` superades. |
| `D08` | Custòdia Patrimonial i Ètica d’Autoria | `8/10` | Separació estricta entre publicador registrat i crèdit bibliogràfic d’obra; caça multimodal d’impostors òptics i 5 reemplaçaments de Commons amb TASL íntegre i `rangEvidencia` honest. Resta completar fotos acreditades al nivell d’accés local per a totes les varietats del Banc. |
| `D09` | SEO Semàntic, Social Cards i Federació POSSE | `8/10` | Preservació de `useSEO` en `DesignSection` pentalingüe (`DesignSection.seo.test.jsx` verd) i `pageContent.fediversity.test.js` (`42/42` rutes i enllaços verificats). L’activació en viu d’ActivityPub queda fora d’R19. |
| `D10` | Dades Obertes i Portabilitat Municipal | `8.5/10` | Esquema `MANIFEST.json` (`sdp.r19.cas.v1`) i manifests fotobotànics JSON amb llicència, URL d’origen, autor i SHA-256 reproduïbles sense dependència opaca. |
| `D11` | Qualitat de Proves i Verificació Mecànica | `9/10` | `100%` verd en totes les bateries dels 37 fitxers tocats (`BarraTaronja.copublicacioR19` `6/6`, `PanellTraspasPublicacioInline` `9/9`, `PageDetailSection.copublicacio` `8/8`, `TextSection.*` `123/123`, `i18n` `383/383`, `pageContent.*` `141/141`, `ReceptaDetailSection.motor` `6/6`), `eslint --max-warnings=0` i `126/126` comprovacions CDP. |
| `D12` | Compatibilitat Multi-Dispositiu i WebKit Rural | `8/10` | Verificació real en Chromium headless (`375 / 768 / 1440 px` × `light / dark`) i preservació de `rutaDAutorSegura` per a `capacitor://localhost` amb query acreditada `?registre=`. Resta prova física en dispositiu iOS/WebKit. |
| `D13` | Governança Documental i Higiene d’Escriptori | `9/10` | Torn documental obert amb `obrir_torn.mjs`, esquelet generat amb `document.mjs create`, àncora viva a `00_index_escriptori.md`, zero brossa a l’arrel i `porta-olivera.mjs` en verd (`exit 0`). |
| `D14` | Gratuïtat Radical i Claredat del Sistema de Plugins | `9/10` | Preservada l’eliminació del motiu de pagament (`P0-113`), l’avís honest «En proves · Beta oberta» per a les 7 eines locals (inclòs l’Arbre Genealògic) i la verificació visual CDP sense regressions en totes elles. |
| `D15` | Sostenibilitat Estratègica i Orquestració Colmena | `9/10` | Treball coordinat sense col·lisions amb Claude, Codex i `gemma3:12b` (Node 0), reconciliació immediata dels pegats de context i de l’oracle `INVENTARI_CONTRACTE` de Claude, i Kit CAS commutatiu. |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Integritat i assaig del Kit CAS (`sdp.r19.cas.v1`).**
  - Directori: `../_investigacio_ia_de_poble/261111_kit_carbon_r19_barra_taronja_composta_i_editorial/`
  - `MANIFEST.json` SHA-256: `e04e77da8a8e9a98596a0c7f3be6fd898fb8d28b6181365500b9f1fcf3897f0d`
  - `SHA256SUMS` SHA-256: `772ab2eefe452bdafb66d8ec4d1086372ffecd47806f0fc1ec616e613cb54f42`
  - Comprovació `shasum -a 256 -c SHA256SUMS`: `99/99 OK`.
  - Simulació sols lectura contra `socdepoble.org/`: `{"already_applied": false, "direction": "apply", "files": 37, "ok": true, "write": false}`.
  - Assaig d’aplicació, idempotència i reversió en `/private/tmp/sdp_carbon_r19_cas_test` superat amb `0 B` de diferència tant sobre l’estat pre-Codex com sobre l’estat post-Codex (`alternate_transitions`).
- **Portes estàtiques, proves unitàries/integració i builds.**
  - `eslint --max-warnings=0` sobre els 36 fitxers JS/JSX del Kit: `0 errors, 0 warnings`.
  - `Tractor Pedra Seca` i `Design Guard`: `PASSA` (`0` crítics, `0` avisos, `LLEI_07_PARITAT_I18N: 0`).
  - Suites Vitest verificades al clon: `405/405` (`i18n.p122`, `i18n.usades`, `PanellTraspasPublicacioInline`, `PageDetailSection.copublicacio`, `BarraTaronja.copublicacioR19`), `147/147` (`pageContent.fediversity`, `pageContent.r10`, `pageContent.versions`, `BarraTaronja.copublicacioR19` amb `P0-CONTRACTE-06`), `123/123` (`TextSection.*.test.jsx`) i `6/6` (`ReceptaDetailSection.motor.test.jsx`).
  - Builds: `npm run build:web` (`218.181 B` gzip-9) i `npm run build:wp` (`soc-de-poble`: `659.59 kB` / `216.81 kB` gzip) superats amb `exit 0`.
- **Auditoria visual CDP i curació multimodal.**
  - `../_investigacio_ia_de_poble/261111_1720_mesa_consens_migdiada_r19/AUDITORIA_VISUAL_CDP_126_CARBON_R19.json`: `126/126` comprovacions verdes (`overflowFailures: 0`, `runtimeErrorChecks: 0`, `brokenAssetChecks: 0`, `emptyRenderChecks: 0`).
  - `../_investigacio_ia_de_poble/261111_1720_mesa_consens_migdiada_r19/CURACIO_MULTIMODAL_CARBON_R19.json` i `reemplacaments_optics_carbon_r19/manifest_reemplacaments_optics_carbon_r19.json`: `77/77` postimatges inspeccionades en tàndem `Gemini 4 Carbon + Node 0 (gemma3:12b)` amb empremtes SHA-256 i llicències completes.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Aïllament d’execució respectat.** Cap fitxer de `src/`, `public/`, `tooling/` ni `.git/` de `socdepoble.org/` ha estat modificat; l’aplicació efectiva queda en mans del Mestre o de l’orquestradora mitjançant `verifica_i_aplica.py --aplica`.
- **Frontera botànica i procedència varietal.** Els 5 reemplaçaments òptics de Wikimedia Commons inclosos a `evidencia/reemplacaments_optics_carbon_r19/` s’entreguen desacoplats de `public/` perquè s’integren exclusivament en les ranures que completen les 4 revisions del protocol del Tauler; en concret, les imatges de `cv-04-alberginia-blanca` acrediten la morfologia d’espècie de fruit blanc però no l’accés etnobotànic específic de Torreblanca. Cap eixida textual del Node 0 (`v2.3`, amb `aprovatPerInjeccio: false`) s’ha injectat al codi font.
- **Abast de dispositius físics.** La matriu visual de `126` estats s’ha executat sobre Chromium headless via CDP; la comprovació tàctil amb lector de pantalla natiu VoiceOver/TalkBack en maquinari físic queda fora d’este torn autònom.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni|261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[../90_arxiu_historic/261111_1720_prompt_gemini_carbon_onada_r19_commit_r18_copublicacio_i_patrimoni|261111_1720_prompt_gemini_carbon_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[../90_arxiu_historic/261111_1741_auditoria_claude|261111_1741_auditoria_claude]]
- [[../90_arxiu_historic/261111_1822_auditoria_codex|261111_1822_auditoria_codex]]
- [[03_llibre_mestre_tasques_i_idees]]
