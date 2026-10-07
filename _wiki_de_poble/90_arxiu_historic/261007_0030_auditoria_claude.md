---
type: informe
status: esborrany
description: 'Relleu de la marató 261007: Gestoria offline, Xat, botons Comentar, Connectar i Traduir, barres d''autor, rojos, commit del TPV i causes dels dos bloquejos de MarIA, amb proves.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1d994685-c022-4574-8350-2232ee166bac:549e0f6d-971f-41fe-acdc-c080b3bf16da
---
# Auditoria Claude: Gestoria offline, reparacions i incidències de MarIA

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1d994685-c022-4574-8350-2232ee166bac:549e0f6d-971f-41fe-acdc-c080b3bf16da |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T22:31:01.269Z |
| Modificació | 2026-10-07T09:00:00.000Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | No mesurat: el client no l'exposa i no s'inventa cap xifra |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-06T22:31:01.269Z: esborrany creat; contingut i verificació pendents.
2026-10-07T01:35 (local): relleu intermedi. Fets verificats de la primera meitat de la marató; sis fronts en curs.
2026-10-07T02:45 (local): represa. Els blindatges ja estan restaurats (l'interruptor s'ha retirat). Hi entren la lliçó F8 i les directives noves F9 (Comentaris = Xat i Drets d'autor). Encara és un relleu intermedi: els sis fronts no s'han acabat de revisar.
2026-10-07T11:00 (local): relleu final de la marató. Hi ha les tres onades, la integració, l'escàner F10, la revisió final F13 i el §0.7, amb la suite verda. També les ordres de commit (F14), el relleu d'ESTAT i del LEDGER (F15) i les decisions per al Mestre (F12). L'OK d'empaquetat per a MarIA és al pla [[261007_0012_pla_implementacio_claude]].

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### F1 · El commit òmnibus de MarIA, partit per fronts

A les 00:32:55, el commit `dfe8ef7a` («chore: Secure 1.0.5 release and offline TPV capabilities before Claude handoff») ho va ficar tot junt: 423 fitxers, 509 239 insercions. Hi havia el TPV, `auth.js`, l'onboarding, `IdentitatContext`, les migracions 2610061448/1450, la governança, 64 MB de `_multimedia_de_poble/`, el connector Vigilante, recursos de tercers de `01_produccio/` (PDF, EPS, `.doc` i un fitxer de bloqueig `¡alergenos.af~lock~`) i el mateix esborrany d'este informe. Era justament la barreja que el commit atòmic del TPV havia d'evitar.

Per ordre del Mestre s'ha partit en deu commits (`48a44432` … `26d0be9c`) amb `git reset --soft`. L'òmnibus original es conserva a la branca `rescat/omnibus-dfe8ef7a`.

- **Verificació:** `git diff --name-status rescat/omnibus-dfe8ef7a HEAD` només mostra les exclusions decidides: 110 fitxers de multimèdia, 61 de `01_produccio`, el torn de Claude i este esborrany.
- **Multimèdia:** fora de git i a `.gitignore` per ordre del Mestre (`26d0be9c`). Mentre existisca la branca de rescat, les imatges continuen a la història; quan s'esborre, desapareixen.
- **`01_produccio`:** queda al disc sense versionar, com abans de l'òmnibus. És zona humana, i decidir-ne la versió és cosa del Mestre.

Tots els commits porten `--no-verify` per autorització expressa del Mestre (261007). El pre-commit exigix un rebut Reflex de `git-commit` (`.sdp-reflex/active.json`) i la cadena sencera de portes, el linter i la suite. Les tres portes de contingut (Frontissa, Taxonomia i Plantilla viva) sí que passaven.

### F2 · Incidència 1 de MarIA: no neteja l'Escriptori com a reflex

**Causa refutada.** L'acta `261007_0025_acta_marmota.md:46` diu que «el hook impedia arxivar». És fals. A les 00:10:44 MarIA va executar `porta-olivera.mjs --arxiva --nom …` i el hook ho va acceptar (`antigravity-hook.log:11540`). El deny de 16 s després (`:11542`) va caure sobre una altra cosa: l'edició del prompt 261006_2358, perquè `plaDeHui` mira la data local i a les 00:00 el pla de la vespra deixa de comptar (`porta-olivera.mjs:118-121, 202-204, 398-400`). És un defecte de mitjanit real però puntual: en tot el log n'hi ha un sol cas.

**Causa real, en tres capes:**
- **Disparador absent.** La porta ix verda per construcció. `document.mjs create` declara viu cada document nou (`draft-write.mjs:68-79`), la declaració no caduca, `olivera:arxiva` respon «Res a arxivar» i el PreInvocation només injecta si la taula és bruta, o un sol briefing per conversa i jornada (`antigravity-hook.mjs:446-452`). Res no salta quan MarIA convoca un prompt (`antigravity-hook.mjs:289`).
- **La regla carregada fa falsa la condició.** `AGENTS.md:19` mana actuar «quan l'Escriptori està brut, o el Mestre t'ho diu». Amb la porta verda, només queda la segona branca, que és exactament la conducta observada.
- **Fatiga.** El 261006 a les 23:58, MarIA va crear el prompt sense observar la taula, cosa que la mateixa conversa sí que havia fet abans (transcripció:2038, «before creating the prompt»). Eixa pèrdua coincidix amb el resum automàtic CHECKPOINT 39, que arriba 9 s abans (transcripció:2743-2744). El resum queda truncat per mida, i l'omplin les pujades del Mestre.

### F3 · Incidència 2 de MarIA: la fatiga no avisa

`tooling/gates/fatiga-hook.mjs` i `tooling/brain/termometre_context.mjs` existixen (versionats a `b22b168b`), però el hook no està registrat: `.agents/hooks.json` només té `sdp-olivera`. No hi ha `fatiga-hook.log`, i la transcripció té 0 «FATIGA». El paquet 261002 ja no s'aplica (`tests/fatiga-261002.test.mjs:401` i `:606` fallen). A més, el cas 4 de `core-context-panic` depén de la intuïció i mesura l'Escriptori, no la conversa. La conversa 62fa5929 portava ≥2993 passos i 198 pujades: si el hook estiguera registrat, MarIA hauria rebut N3 a cada torn des del 261006 a les 22:09Z (és un contrafactual, no un fet observat). La conversa es va tancar a les 01:40 per «fatiga d'artefactes (+250)», segons l'acta `261007_0140`.

### F4 · L'interruptor i el pas lliure, retirats; la cadena de seguretat torna a estar sencera

- **00:31-02:45 · Interruptor.** MarIA va crear `.agents/runtime/antigravity-hook.off` a les 00:31 (`antigravity-hook.log:11609`, amb force_ask aprovat pel Mestre). A les 00:35 va afegir a `tooling/gates/hooks-local.mjs:76` la lectura d'eixe interruptor. A la represa de les 02:45 ja no hi era.
- **02:41-~05:00 · Pas lliure.** Per ordre del Mestre, `hooks-local.mjs:76` va tornar amb un `return` incondicional («Interruptor de pas lliure»). Amb eixe pas, Claude va anotar les lliçons 261007 i la segona onada va aplicar la governança de MarIA. Mentre va durar, [DEFECTE D9], 10 proves de `hooks-local.test.mjs` i 9 de `security-chain.test.mjs` estaven roges.
- **Ara.** El pas lliure ja no hi és: `hooks-local.mjs` és el del commit. `node --test tests/hooks-local.test.mjs tests/security-chain.test.mjs tests/porta-olivera-diagnosi.test.mjs` dona 52 de 52 (D9 verd). Conseqüència: Claude no pot fer commits ni escriure a `.agents/` ni a `tooling/` (vegeu Límits).

### F5 · Correccions a l'acta 261007_0025 de MarIA

- **Línia 46:** la causalitat està invertida (vegeu F2).
- **Línia 43:** diu que el paquet respecta el límit de 10 MB de WordPress, però l'eixida real del build (transcripció:2731) fa 132 544 933 B i «no es pot enviar tal com està».
- **El pla 261007_0012_pla_implementacio_claude.md** és un esquelet amb totes les seccions «[pendent]». Es va crear 34 s després del deny només per satisfer `plaDeHui`, i no comparteix cognom amb el prompt (lliçó 260922).

### F6 · Fet i verificat en esta marató (primera meitat)

| Commit | Què | Verificació |
| --- | --- | --- |
| `50c18954` | T5 · Barra lateral: CONTROL fix a dalt; visibles Xat, Mur, Mercat, Pobles i Notes; desplegable «Sistema» (Versions i Legal darrere de Full de ruta, en blanc); sense peu fix | Navegador a 1280 i en el rail plegat; App, rocaIGuardes i config 600/600; lint_logica_usuari 17/17 |
| `d542b45e` | allLoaders: escalfament del graf compartit | 87/87 |
| `ed761b5a` | Xat a pantalla completa en mòbil, clon de WhatsApp (ModeImmersiuContext); la fitxa de comunitat també; la llista a tota amplada en estret | Navegador a 375 (llista → fitxa → conversa → tornada), a 800 (sense canvis) i a /mur; 2603/2605; context 4/4 |
| `df74d230` | Rojos heretats: auth (revocació abans del primer await, més proves de «others»), TextSection, reixeta d'emojis amb token, ArbreUniversal, hex en un comentari | 700/700 |

**Maquinària sense endollar trobada:** la regla P6 «llista a tota la pantalla al Xat en estret» (`AppGridShell.css:176`) no casava mai, perquè demanava `.app-grid-shell.sdp-xat` i la classe `sdp-xat` és de `.app-grid-page`. Al mòbil, la llista era un calaix del 85 % damunt d'un vel. Corregit a `ed761b5a`.

### F7 · Traduir no pot funcionar a socdepoble.org només amb el front

El botó de la pàgina només obri el menú de llengües si existix `externalConfig.traductorUrl`, i eixa URL només arriba des del connector de WordPress amb `DEEPL_API_KEY` (`marcatge.php:247-250`). El client només accepta un servei del mateix origen. Al lloc propi cal un servei de traducció del mateix origen, amb la clau al servidor, i una ADR (Model B). A WordPress n'hi ha prou de definir `DEEPL_API_KEY`. Les targetes porten a `/traduccions`, que diu «En obres».

### F8 · Dues correccions de conducta del Mestre, ja anotades

El Mestre va corregir dues conductes, no dos errors de codi:
- **L'ordre explícita s'aplica sencera.** Jo havia anunciat que el copyright només enllaçaria a la pàgina de drets quan citara CC BY-NC-SA. L'ordre era que l'enllaç hi vaja **sempre**, també amb «© Pepet».
- **Abans de crear res, la maquinària que ja existix.** Per a la pàgina de drets jo havia començat un mode informatiu de `CopyrightPage`. L'ordre era una pàgina de sistema feta només amb `SYSTEM_PAGES` + `PAGE_COPY` + `UniversalPage`, i la incrustació a «Legal» amb `data-sdp-targetes`. El mode informatiu es va revertir.

Totes dues estan anotades (amb el pas lliure, abans que es retirara), amb el segell reconciliat (transacció 453840bf):
- `.agents/skills/sdp-workflow/SKILL.md`, lliçó 261007 «L'ordre explícita s'aplica sencera».
- `.agents/skills/sdp-universal-page/SKILL.md`, lliçó 261007 «Una pàgina de contingut naix de la maquinària existent».
- `.agents/LEDGER.md`, dues línies `261007 | correcció | …`.

### F9 · Directives noves de la represa (a la cua, darrere dels sis fronts)

- **Comentaris = Xat** (prompt `261007_0146_prompt_claude_represa.md`). En clicar «Comentar» es tria entre dues opcions:
  - **privat:** el missatge directe exclusiu amb Sóc de Poble;
  - **públic:** un xat públic que naix amb el títol de la targeta, com «General» o «Beta testers».

  El canal públic ja existix per als subjectes tipats (publicació, producte, esdeveniment, multimèdia, entitat, grup i poble) i per a les pàgines de `PAGINES_AMB_XAT` (`contracte.js:211-281`). Falta la tria, que es farà com el menú de llengües de Traduir. El xat de Sóc de Poble es resoldrà una sola vegada per a tota l'app, no una per targeta.
- **Drets d'autor** (prompt del Mestre i correcció F8). El copyright de totes les targetes i pàgines és sempre un enllaç blau, amb el subratllat només al hover, cap a la pàgina de sistema «Drets d'autor» (`/page/drets-autor`): una entrada de `SYSTEM_PAGES` i de `PAGE_COPY` que pinta la `UniversalPage` de sempre, amb data 2026-01-30 i l'etiqueta «Sistema». La seua targeta s'incrusta a «Legal i privacitat», apartat 4, a la dreta. Fet a la segona onada (vegeu la taula de fronts).

### F10 · Escàner de salut cognitiva (ordre del Mestre, 261007)

Tres mirades de només lectura (Wiki, disseny i tractors), cada una amb cacera i refutació adversarial en dues fases i agents separats. Han sobreviscut 33 de 36 troballes: 10 de 12 de la Wiki, 11 de 12 de disseny i 12 de 12 de tractors. Cap és d'alta severitat: 20 mitjanes i 13 baixes. Totes porten cites literals fitxer:línia; ací van les essencials.

**Mitjanes**
- **W1 · Estat offline** (obsolet): la Wiki dona per retirats el service worker i la persistència local, i el codi els registra i els usa (`00_arquitectura_tecnica_unificada.md:49,51` contra `src/main.jsx:11`). La llista de propagació de l'ADR-2026-10 (`:109-111`) deixa fora set pàgines i `.agents/BIOS.md:20`, i el §3 que cita (`:82`) és en un document arxivat. Proposta: signar l'ADR, una sola frase canònica a 00_arquitectura §2 i completar la llista. Matís: l'ADR és esborrany; el defecte és la llista incompleta.
- **W2 · Acte Reflex** (contradicció): `02_genotip.md:16` l'exigix per a «qualsevol efecte lateral»; `PROTOCOL_PETORRETA.md:14,96` i `porta-reflex.mjs:25,50` només per a governança i alt risc. Proposta: reescriure la llei amb les tres vies reals.
- **W3 · Cinc portes d'arrencada** (duplicitat): AGENTS, QUI_SOC, BOOTSTRAP, BIOS.md i 00_BIOS_COGNITIU es desdiuen (`AGENTS.md:83-84`, `cervell.json:3-11`, `QUI_SOC.md:8` contra `BOOTSTRAP.md:10`). Proposta: una sola porta (AGENTS §15) i redireccions; arxivar BOOTSTRAP trencaria `tooling/lib/arrel.mjs:78`.
- **W4 · «Connectar» com a botó únic** (contradicció): `connexio_radical.md:14,17` contra la ranura `accio` viva (`systemPages.js:22`, `UniversalCard.jsx`). Decidix el Mestre: «Connectar per defecte» amb excepcions tancades.
- **W10 · Registre de llavors del full de ruta buit** (obsolet): 37 llavors de /roadmap hi apunten (`00_full_de_ruta.md:16-33`, `pageContent.roadmap.test.js:54`); la prova només mira l'H1.
- **W11 · «Net» té tres definicions i la Safata dos llindars** (contradicció): `AGENTS.md:18` contra `:69`; `porta-olivera.mjs:385` (0) contra `verificador-scc.mjs:11` (20); `prompt_local.md:27`.
- **M2-01 · Dos TPV per al mateix Bar** (duplicitat): `EspecimenUniversalTPV.jsx:402` contra `EspecimenEsqueletBar.jsx:163`; `rutesBar.js:52,56-57`. El Mestre tria una peça; la graella de l'esquelet és GraellaArticles, ja «obsolet» (`registre.js:202`).
- **M2-02 · La §C de sdp-universal-page descriu una barra taronja que ja no existix** (obsolet): `SKILL.md:56,58,60` contra `BarraTaronja.jsx:8,88-91`.
- **M2-03 · Les skills apunten a DesignSection.jsx i a una prop inexistent (`renderEditor`)** (obsolet): `sdp-universal-page/SKILL.md:21,112`; la prop real és `renderDetail` (`UniversalWorkspace.jsx:28`).
- **M2-04 · L'espècimen «Contracte vigent» és un fòssil** (obsolet): `EspecimenContracte.jsx:33,46,50` contra `graella.js:26` i `devicesRuntime.test.js:3`. Proposta: retirar-lo o reduir-lo a enllaços.
- **M2-05 · sdp-universal-page §A: Comentar i l'equivalència barra/peu** (obsolet): `SKILL.md:33,41` encara diu missatge directe; el codi és el menú privat/públic (`BarraBlava.jsx`). Agreujant: `manifest.js:449` diu que la targeta no importa les barres i ja ho fa.
- **M2-06 · 44 px contra 48 px** (contradicció): `sdp-pedra-seca/SKILL.md:69`, `Avatar.jsx:4-5` i tres pàgines diuen 44; `tokens.css:248,251` fa 48. Proposta: nomenar el token, sense xifra.
- **M2-07 · Xifres de color, radi i ombra de sdp-universal-page §D contra Pedra Seca** (contradicció): `SKILL.md:64` contra `tokens.css:54,180`; Pedra Seca §1 (`:28`) recomana un primitiu que §2 (`:32`) veta.
- **M3-01 · El pre-commit executa les mateixes portes dues i tres vegades** (duplicitat): `git-staged.mjs:40,43-44`, `run-portes.mjs:38,90`, `tancament.mjs:15-18,27`.
- **M3-02 · Tractors desendollats o destructius** (obsolet): `neteja-enllacos-trencats.mjs:70-75` esborra línies sense `--sec`; tres porters de portes comproven el mateix; C1 no reconeix `esMain`. Matís: `pre-commit.mjs` sí que té invocacions i és seed crític.
- **M3-03 · VerificadorSCC repetix quatre controls amb criteris diferents** (duplicitat): `verificador-scc.mjs:11,208,252` contra `porta-olivera.mjs:124-134,384-385`, `design_guard.mjs:214` i `tractor-inline-styles.mjs:16`.
- **M3-05 · Dues fonts úniques de rutes** (contradicció): `tractor-rutes.mjs:43` i `tooling/lib/arrel.mjs`; `project_paths.mjs:65,67` exporta rutes sense consumidors.
- **M3-06 · Dues CI amb la cadena sencera, una amb Node 20 fora d'engines** (duplicitat): `.github/workflows/sdp_lock_ci.yml:18,22` contra `package.json:135`; lint doble a `wiki-integrity.yml:58,61`.
- **M3-08 · Tres documents reclamen ser l'arrencada; BIOS.md prescriu codi desendollat** (contradicció): `QUI_SOC.md:8`, `BOOTSTRAP.md:10`, `BIOS.md:11,20`.
- **M3-09 · El BIOS promet un tancament que `tancament.mjs` sense banderes no fa** (contradicció): `AGENTS.md:37`, `package.json:22`, `tancament.mjs:3,42-58`; cal `--close --turn-id ID`.

**Baixes**
- **W5** 44 px a tres pàgines de la Wiki (`01_trellat.md:18-19`).
- **W6** Sis plantilles copien un bloc de logos que `doc_logos_oficials.md:16,22` prohibix.
- **W7** `auditoria_canonica` és alhora guia publicada i plantilla de ruta (`protocolledge.json:113`).
- **W9** «petorreta» vàlida a `taxonomia.json:27` i prohibida a la skill (`:43,45`).
- **M2-08** La variant `panoramica` del Lector ja no la usa ningú (`manifest.js:358`, `AppLector.test.jsx:170`).
- **M2-10** `estandard_ui_universal.md:20` no és a la llista de propagació de l'ADR-2026-10.
- **M2-11** `identitat_visual.md:70` copia Pedra Seca §10 i ja diu una altra cosa (`SKILL.md:84`).
- **M2-12** La ruta de cada peça del catàleg viu en tres llocs i dotze còpies apunten a fitxers que no existixen (`EspecimenBuit.jsx:8` contra `registre.js:50-53`).
- **M3-04** Quatre portes del graf amb àncores i toleràncies incompatibles (`llaurador_indexs.mjs:57-60` contra `verificador-scc.mjs:154-156`).
- **M3-07** AGENTS §16 posa 01_produccio com a destí i §12 la prohibix (`AGENTS.md:89` contra `:67`).
- **M3-10** La skill de documents contradiu `taxonomia.json` i té tres regles per al nom del pla.
- **M3-11** Els punters a la llei de disseny i a l'Acte Reflex van a sdp-workflow, que no els conté (`AGENTS.md:76`, `BOOTSTRAP.md:21`).
- **M3-12** R5 i R6 de `tractor-registre.mjs` ixen verd sense comprovar res (`:231,376`).

**Tombades pel refutador:** W8, W12 i M2-09.

**Menors verificades fora del límit** (Wiki, sense refutació): (a) `memoria_aprenentatges.md:30,34` cita ManagerItemCard i UniversalManager, que no existixen; (b) l'arxiu «completament pla» contra `--sessio`; (c) la Wiki diu sis carpetes i al disc n'hi ha huit; (d) `sync_sollutia_skills.mjs:15` apunta a una carpeta inexistent; (e) `doc_taula_mestra.md` és només una consulta Dataview publicada; (f) `core_registre_automillora.md` arxivat amb una fila del 261004; (g) el «Volum II» del protocol Llàtzer està arxivat; (h) l'ADR-2026-08 diu esborrany i «Acceptada»; (i) `05_actors_i_salut.md:82` dona la frontissa per «N/A» i ja existix; (j) `.immunitari/config.json:22-23` apunta a un memorial inexistent.

**Cobertura:** cap porta s'ha executat (el hook ho bloqueja); el que diu del comportament en execució és lectura de codi. No s'ha llegit 90_arxiu_historic, 01_produccio ni 02_investigacio_ia.

### F11 · Fet esta nit i sense commit (onades 1-3 i integració)

Cada front ha passat implementació, revisió adversarial i correcció. Ja estan commitejats la Gestoria (`2564c19f`), la closca offline del worker (`1519a9df`) i la barra d'autor (`67fe5f08`). La resta és al disc:

- **El Xat.**
  - La pàgina `/page/xat` és `SYSTEM_PAGES` + `PAGE_COPY`.
  - A la targeta i a la pàgina hi ha el botó gran «Anar al xat» (ranura `accio`, `PortaDePagina`). La resta de la targeta obri la pàgina.
  - La columna dreta de /xat és configurable (`paginaDestacada.js`): per defecte El Xat, i l'Ànima es conserva.
  - Portada: `xat_portada.jpg`.
- **Samarreta.**
  - La foto de la xica és la principal, amb un carrusel de 8 fotos (`CarruselImatges`, patró Carousel de l'APG).
  - La pista porta rol i nom, i el CSS és al final de `components.css` (s'ha resolt la V3).
- **Drets d'autor.**
  - La pàgina és de sistema i no porta cap component nou. Data 2026-01-30, etiqueta «Sistema».
  - El copyright de totes les targetes i pàgines és sempre un enllaç blau a `/page/drets-autor`. Només se subratlla en hover, ocupa una sola línia amb punts suspensius i té una àrea tàctil de 54 px.
  - La targeta és incrustada a «Legal» §4, a la dreta.
- **Llicència per defecte CC BY-NC-SA 4.0** (MarIA): `COPYRIGHT_SDP`, l'herència i `CopyrightPage`.
- **Comentaris = Xat.**
  - Menú de dues vies, «En privat» (Sóc de Poble) i «En públic» (el xat de l'element, o desactivat amb la raó), a totes les barres i targetes, també al Panell.
  - Hi ha una peça de Pedra Seca (`Comentar.jsx`) i un sol comportament de menú emergent per a Traduir i Comentar (`useMenuEmergent`).
  - El xat de Sóc de Poble es resol una sola vegada, de manera mandrosa (`ProveidorXatSocDePoble`). Quan es fan dos clics, només navega l'últim.
  - L'enllaç de llavor té una sola font, i l'espècimen és al catàleg.
- **Targetes incrustades sincronitzades.**
  - Són la miniatura de la UniversalPage de l'original (`SincronitzacioTargetes.jsx`, `targetaDeLaPagina.js`), en lectura i a l'editor.
  - La instantània queda com a reserva.
  - Es munta a TextSection, al Bloc de Notes, a ItemDetailSection i a PerfilPublicSection, i no a App.jsx (paquet inicial).
- **Emojis XL.**
  - A la segona columna, les fitxes porten l'emoji a 11/16 del quadrat; a l'arbre i als rails, l'emoji fa 20 px.
  - La targeta viva porta una insígnia de 88 px quan no hi ha imatge.
  - Els 86 espècimens del catàleg i els documents de la Wiki tenen emoji propi.
  - **Les carpetes de la Wiki** (pla §0.7) tenen emoji propi, i la portada té 📖. A l'arbre fan 20 px i a la llista són XL. En obrir la portada, la imatge de capçalera no canvia.
  - Les carpetes de sistema del Bloc de Notes continuen amb Lucide (Llei de la Roda Dentada).
- **Roda dentada.**
  - Té «Amplada de les columnes» (amb «Restablir l'amplada de les columnes») i «Carpetes a la vista».
  - Amagar una carpeta no l'esborra. La preferència es desa per espai i ho fan tots els UniversalWorkspace.
- **Assignar emojis.**
  - Hi ha un botó per emoji i una pantalla completa de destins. L'assignació a les notes és real.
  - La Wiki, el Disseny i les pàgines del codi són inertes i ho diuen.
- **Catàleg.** EspecimenUniversalCard i EspecimenControlsBarra estan al dia, i el registre porta Comentar i PortaDePagina.
- **Governança de MarIA.**
  - Aplicats: P1, P2 amb R1, P4 (fatiga registrada), P5, P6 i P7. Segell 061adbd4.
  - P3 (AGENTS.md) queda com a pegat per al Mestre.

### F13 · Revisió final integrada (quatre mirades, refutació i correcció)

Quatre caceres de només lectura sobre l'arbre sense commit (integració, Pedra Seca, ordres del Mestre i paquet de WordPress), un refutador per mirada i un sol corrector. Han eixit 48 troballes: n'han sobreviscut 31 (7 importants, 23 menors i 1 trivial) i se n'han tombat 17.

| Mirada | Troballes | Sobreviuen | Tombades |
|---|---|---|---|
| Integració | 12 | 6 | 6 |
| Pedra Seca | 15 | 12 | 3 |
| Ordres | 13 | 10 | 3 |
| Paquet | 8 | 3 | 5 |

**Corregides (les importants):**
- **I1, M3-01 i M3-02 (drets).**
  - El Mercat pintava a mà «© Sóc de Poble…»; el Mur i el detall pinten CC BY-NC-SA. Ara el Mercat passa per `targetaDeProducte.js` amb `item.copyright || COPYRIGHT_SDP`, i EventCard importa la constant.
  - Una prova nova comprova que les tres superfícies diuen el mateix.
  - Queda pendent la reserva per al contingut sense drets (F12).
- **I2 (foto principal).** Hi ha una sola regla, `imatgesDeProducte.js`, per a la targeta del Mercat, la del Mur i la pàgina del producte. En remot, el Mur ja no pinta el logotip.
- **M4-01 (xat privat).** Un `null` del port en el primer «En privat» deixava la via morta tota la sessió. Ara el proveïdor torna a demanar passada l'espera de la boina (`navigation.js`).

**Corregides (menors):**
- **Traduccions:**
  - el diàleg de la roda, traduït sencer (claus noves i `textosEstat` de l'Interruptor);
  - el carrusel passa per i18n.
- **Duplicitats:**
  - un sol `useTraductorOpcional`;
  - UniversalCard usa `useUbicacioApp`.
- **Correccions de comportament:**
  - `$&` als noms de carpeta;
  - el títol plegable sense grup;
  - la vora dels h3 del diàleg;
  - els avisos honestos d'Assignar per a emojis desconeguts i mentre carrega;
  - una guarda Unicode única per a Safari 16.
- **Assignacions fora de la ruta:**
  - `role="img"` al quadrat amb nom;
  - el Comentar públic del document destacat de /xat llig la seua pàgina, no /xat.
- **Catàleg:**
  - la Samarreta de l'espècimen ix de `MARKET_ITEMS`;
  - la Llei de la Roda Dentada, a l'espècimen d'UniversalWorkspace;
  - comentaris rancis.

**No corregides:** M2-05, M3-03, M3-06 i M4-04 demanen una decisió del Mestre (F12). M4-02 és el procés de release, fora de `src/`.

**Proves del corrector:** quatre tandes de `src`, 530 fitxers i 7.760 proves verdes, 3 omeses i cap roja. Claude hi ha afegit els fitxers nous del corrector a les llistes d'ESLint (`workspace/qualitat`, `qualitat.comentar` i `qualitat.carrusel`): 41 de 41 verdes, zero missatges.

### F14 · Ordres de commit (les executa el Mestre)

**Per què quatre commits i no un per front.** Els fronts de la nit compartixen fitxers:
- `components.css` i `modules.css` porten blocs de fins a cinc fronts;
- també es compartixen `UniversalCard.jsx`, `i18n.js`, `TextSection.jsx`, `PageFrame.jsx`, `systemPages.js` i `pageContent.js`.

Partir-los per front demanaria `git add -p` a mà sobre trossos entrellaçats, i el risc no compensa. Per això van quatre commits coherents: la governança i la llicència (fitxers disjunts), el producte (un sol commit, amb el detall per front al cos) i els documents.

**Abans de començar:**
- `node tooling/gates/frontissa-contingut.mjs` ha d'eixir amb 0.
- Si el pre-commit demana el rebut Reflex, el Mestre decidix si fa servir `--no-verify`, com esta nit.
- Mai entren a cap commit:
  - `_wiki_de_poble/04_escriptori/01_produccio/` (zona humana);
  - `.immunitari/` (eixida del cron), que decidix el Mestre.

**1 · Governança de MarIA**

```bash
git add tooling/gates/antigravity-hook.mjs tooling/gates/porta-olivera.mjs tooling/brain/termometre_context.mjs tests/antigravity-hook.test.mjs tests/fatiga-261002.test.mjs tests/porta-olivera-v3.test.mjs .agents/hooks.json .agents/cron/registre_tasques.json .agents/skills/core-context-panic/SKILL.md .agents/skills/sdp-workflow/SKILL.md .agents/skills/sdp-universal-page/SKILL.md .agents/SKILLS_SEAL.json .agents/seal-transactions/453840bf-e49b-455e-800c-b2bc5813be08.json .agents/seal-transactions/b0328702-790d-4253-9f6b-cbd1e24411e8.json .agents/seal-transactions/b74157fd-460c-489e-9609-2be787b3c21d.json .agents/LEDGER.md
```

```bash
git commit -m "feat(governanca): convocatoria per argv (R1), fatiga registrada (P4, P5) i llicons 261007" -m "P1, P2 amb R1, P4, P5, P6 i P7 de la governanca de MarIA; segell 061adbd4 amb reconciliacio explicita; llicons del Mestre 261007 a sdp-workflow i sdp-universal-page. P3 (AGENTS.md) queda com a pegat per al Mestre." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**2 · Llicència per defecte CC BY-NC-SA 4.0 (MarIA)**

```bash
git add src/components/universal/editorial.js src/components/universal/editorial.test.js src/components/universal/drets/herencia.js src/components/universal/drets/CopyrightPage.jsx src/components/PedraSeca/organismes/formulari.jsx src/components/universal/EventCard.jsx src/components/universal/PageFrame.apps.test.jsx
```

```bash
git commit -m "feat(drets): la llicencia per defecte passa a CC BY-NC-SA 4.0" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**3 · Producte: tots els fronts de la nit**

```bash
git add src public/assets/nano_cards/drets_autor_comic.jpg public/assets/uploads/brain/xat_portada.jpg .agents/contingut_estructural.json
```

```bash
git commit -m "feat: El Xat, Samarreta, Drets d'autor, Comentaris = Xat, targetes sincronitzades, emojis XL, roda dentada i assignar emojis" -m "El Xat: pagina de sistema, boto Anar al xat a la targeta i a la pagina, pagina destacada de /xat. Samarreta: la xica com a portada i carrusel de 8 fotos. Drets d'autor: pagina de sistema, copyright sempre enllac en una linia, targeta a Legal 4. Comentar: menu En privat / En public a totes les barres i targetes, un sol menu emergent. Targetes incrustades sincronitzades amb l'original. Emojis XL a les llistes; 86 especimens, els documents i les carpetes de la Wiki amb emoji propi. Roda dentada: amplada i carpetes a la vista. Assignar emojis des del cataleg. Detall i proves a 261007_0030_auditoria_claude." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**4 · Documents de la jornada**

```bash
git add _wiki_de_poble/04_escriptori/00_index_escriptori.md _wiki_de_poble/04_escriptori/261006_2200_contingut_el_xat.md _wiki_de_poble/04_escriptori/261007_0012_pla_implementacio_claude.md _wiki_de_poble/04_escriptori/261007_0030_auditoria_claude.md _wiki_de_poble/04_escriptori/261007_0146_prompt_claude_represa.md _wiki_de_poble/04_escriptori/261007_0230_prompt_copyright.md _wiki_de_poble/04_escriptori/261007_0504_prompt_claude_estat.md _wiki_de_poble/10_actes/261007_0140_ACTA_MARMOTA_fatiga_artefactes.md .agents/runtime/turns .agents/ON_ESTIC.md
```

```bash
git commit -m "docs(escriptori): pla, auditoria i prompts de la marato 261007" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**Després:** `git status --short` només ha de mostrar `.immunitari/` i `01_produccio/`.

### F15 · Relleu per a ESTAT i LEDGER (per pegar)

Claude no pot escriure a `.agents/` amb el hook actiu. Cal que MarIA o el Mestre ho peguen.

- A `.agents/ESTAT.md`, com a primer bloc:

```markdown
## ESTAT_ACTUAL · 2026-10-07 11:00 · Claude · Marató 261007 tancada

Relleu [[261007_0030_auditoria_claude]].

**Objectiu:** deixar la marató del 261007 al disc, verificada i a punt per a l'empaquetat de WordPress.

**Fet (sense commit):**
- El Xat: la pàgina i la targeta, amb «Anar al xat».
- Samarreta: la xica com a portada i un carrusel de 8 fotos.
- Drets d'autor: la pàgina de sistema, el copyright sempre enllaç i en una línia, i la targeta a Legal §4.
- Comentaris = Xat: el menú «En privat» / «En públic» a totes les barres i targetes.
- Targetes incrustades sincronitzades amb l'original.
- Emojis XL a les llistes, al catàleg i a la Wiki, amb les carpetes de la Wiki incloses.
- Roda dentada: l'amplada i les carpetes a la vista.
- Assignar emojis des del catàleg.
- Governança de MarIA: P1, P2 amb R1, P4, P5, P6 i P7.
- Escàner de salut cognitiva: 33 troballes.

**Proves:** vitest de `src` en dues tandes, i `node --test` del connector i de la cadena de seguretat: 395 de 400, cap roja.

**Bloquejos:** els commits els fa el Mestre (F14); P3 queda per aplicar; les decisions són a F12.

**Següent:**
- El Mestre: els quatre commits de F14 i les decisions de F12.
- MarIA: el ZIP de WordPress.
- Claude, a la propera sessió: Compartir amb la Web Share API i Traduir amb la clau (pla, §0).
```

- A `.agents/LEDGER.md`:

```markdown
261007 | relleu | claude | marato 261007 tancada: tres onades, integracio i revisio final; suite verda; 4 commits pendents del Mestre
```

### F12 · Decisions i preguntes per al Mestre

**Comentar**
- En el perfil d'una persona o de la IAIA, «En privat» porta ara al xat amb Sóc de Poble. Abans era el missatge directe amb la persona, que continua amb «Escriu-li al xat». Es manté així?
- Les notícies de fora del Lector oferixen «En privat» amb Sóc de Poble. D'acord?
- Les pàgines de sistema sense xat públic (/page/xat, /page/drets-autor, /calendari, /control…) necessiten una migració nova de `private.xat_subjecte` i la seua entrada a `PAGINES_AMB_XAT`.
- Cal aprovar els textos del menú i que algú revise l'eu i el gl.
- La doctrina de `sdp-universal-page/SKILL.md:33` encara diu «missatge directe a l'autor». Cal reescriure-la (governança).

**Drets d'autor**
- Les tres aprovacions de la frontissa (xat, legal i drets-autor) porten «Javi (delegat a Claude, 261007)». Cal ratificar-les o repetir-les amb `--per Javi`.
- Coherència legal: la pàgina diu que el codi és AGPL-3.0 i, alhora, que Pedra Seca té «protecció pròpia» (Legal §4). L'AGPL no admet restriccions sobre el codi llicenciat.
- Les atribucions de tercers («© Viquipèdia… (CC BY-SA)») també porten ara a la pàgina de drets de Sóc de Poble.
- A l'editor (DocumentEditor i TargetaViva), l'enllaç dels drets navega fora de l'editor.
- `legalContent.js:75` publica el NIF i el domicili, i les línies 28-29 diuen «[DADES PROTEGIDES]».
- A 600 px d'amplada, el text del costat de la targeta flotant de Legal queda en una columna estreta. Ara la targeta porta el còmic i és més alta. Cal decidir un tall sota el qual no flote (afecta també les notes).

**Samarreta i carrusel**
- Al comptador, `left: 50%` en lloc d'`inset-inline-start`. És el mateix píxel d'esquerra a dreta, i ho exigix la prova d'abast.
- La regla «la primera foto, mai el logotip»: s'estén a la resta de productes i llistes?
- `supabase/seed.sql`: hi falta la foto 05 i la 08 apunta a un fitxer que no existix.
- La foto 08 és un retrat del Mestre dins d'un carrusel públic.
- Queden quatre fulls de Pedra Seca amb V3 (alergens, tpv, pecesApps i catalegColleccio).

**Emojis XL**
- El rail plegat de la segona columna porta l'emoji menut (20 px), no XL.
- Sense imatge, l'emoji ix alhora a la caputxa i al quadrat XL.
- Cal aprovar els 86 emojis del catàleg i els de la Wiki. Els dubtosos: 💂 Sentinelles, 🛸 Antigravity, 🀄 Rajola, 🍽️ Menú, 📣 Toast, 🐚 Closca i 🏛️.
- També cal aprovar els emojis de les carpetes de la Wiki (§0.7):
  - SER 🌱, SABER 🦉, ACTUAR 🔨;
  - Consola 🌡️, Architecture 📐, Còdex humà 💓, Obsidian 💎, Protocols 🔬, Plantilles 📋;
  - Maquinària 🎛️, portada 📖.
  - Per canviar-ne algun, es toca només `iconesWiki.js`, amb les seues proves.
- **§0.7, «a l'interior del document, els emojis SÍ seran XL» (R1).** Fet com ho llig la classe de l'ordre: el quadrat XL de les targetes dins d'un document. Obrir un document de la Wiki no pinta cap emoji. Hi ha dues opcions:
  - **(a)** la cel·la de la barra taronja: fa 28 px i el contracte vol el camp cru;
  - **(b)** un emoji XL nou a la capçalera: és un redisseny i demana pla.
- La fitxa de la portada, a la llista, ara mostra 📖 i no la miniatura (R2). Es manté?
- Les icones de Lucide de l'arbre fan 24 px per la CSS, encara que el JSX en demana 18.
- L'XL també a l'aside de l'editor i al xip «Vista targeta»? I a la targeta del Mur?

**Roda dentada**
- Amagar la carpeta activa pot canviar el document obert. Es conserva?
- L'abast de «primer nivell»: inclou les categories i les etiquetes de Notes i els grups del Perfil?
- S'han de poder amagar totes les carpetes?
- Unificar «Amplada» (roda) amb «Amplària» (Xat). El Snippet compartix l'espai del Bloc.

**Assignar emojis**
- Canal d'escriptura per a les pàgines del codi. Opció A: un camp `icon` al `pageCopy` de Supabase amb RLS d'administració i una ADR. Opció B: un tractor local aprovat a la Wiki que escriga el fitxer i en deixe un commit.
- Les carpetes que crea la persona poden portar emoji? Caldria un camp `icon` al contracte de carpetes.
- Els noms dels emojis són CLDR en anglés. «Assignar» o «Afegir»?
- 16 emojis d'Unicode 17 i 18 no es poden assignar.

**De la revisió final (F13)**
- **Reserva dels drets per al contingut sense drets.** Opció A: CC BY-NC-SA, que és retroactiva i ja la pinten el Mur, el Mercat, l'acte i el detall. Opció B: «© Sóc de Poble», que no és retroactiva i la pinten l'editor, el lector del MAS i la benvinguda. Després, una sola constant per a tots.
- **Un producte sense foto pròpia** encara pinta el logotip a la targeta, i la seua pàgina no té portada. Es queda així?
- **La roda dentada** té «Per defecte» i «Restablir l'amplada de les columnes», que fan el mateix. Quin es queda?
- **©️, ↔️ i ↕️** ixen monocroms a Chrome 100 a la fitxa XL. Glifs nous o el token `--sdp-font-emoji`? Totes dues opcions canvien l'aparença.
- **CosDeLaPagina amb targetes:** ha de passar a un mòdul lazy? /xat carrega la sincronització a través de TextSection. Fer-lo lazy afegiria un parpelleig a /legal.
- **Release:** construir sempre des d'un checkout net i etiquetat. `empaqueta.mjs` podria rebutjar un arbre brut.

**Governança i Wiki**
- P3: aplicar el pegat d'AGENTS.md §0.1 (el text és a la segona onada).
- Decidir R2 (el deny es pot satisfer sense decidir els «declarats vius») i R5 (un sol disseny de convocatòria).
- Fatiga sense fase 0: afegir `.agents/runtime/fatiga-hook.off` i `.fase0` al `.gitignore`.
- Les 33 troballes de l'escàner (F10).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Suite final sobre l'arbre sencer** (11:00, després de la revisió final i abans del §0.7):
- `npx vitest run` de `src`, en dues tandes que cobrixen totes les carpetes: 802 fitxers, 13.523 proves verdes, 8 omeses i **cap roja**.
  - Tanda 1 (components, text, detail, notes, disseny, control, wiki, mur, profile, xat, calendari i mercat): 386 fitxers i 4.883 proves verdes.
  - Tanda 2 (app, apps, config, css, data, hooks, natiu, pwa, utils, pages, la resta de seccions i les entrades de l'embed): 415 fitxers i 8.640 proves verdes.
- `node --test` del connector de WordPress (enxufe-*, dist-secrets, public_exports, conformitat-amfitrio, lint_enxufe), dels linters (xat, lògica d'usuari, sessió), de la frontissa i de la cadena de seguretat (hooks-local, security-chain, porta-olivera-diagnosi, antigravity-hook, fatiga i Olivera v3): 400 proves, 395 verdes, **0 roges**, 1 omesa i 4 «todo» de diagnòstic d'abans.
- ESLint, per les proves `qualitat*` de cada front: zero missatges als fitxers nous.
- **Després del §0.7** (carpetes de la Wiki, i correccions R3, R4 i R5 de Claude): `npx vitest run src/sections/wiki-de-poble src/sections/disseny/cataleg src/components/universal/workspace` dona 59 fitxers i 719 proves en verd.
  - Els consumidors veïns que va passar el revisor (Gestoria, Sentinelles i barra taronja) donen 84 fitxers i 2.180 proves en verd.
  - Els `node --test` de lint (torn, sessió i enxufe) no tenen cap fallada.
  - `VERSIO_CATALEG` continua al dia: cap fitxer de la seua llista ha canviat després de les 09:37:33.

**Navegador** (pestanyes pròpies, càrrega neta, consola sense errors):
- **Mur:** el copyright d'una línia i l'enllaç a Drets.
- **Legal:** la targeta de Drets d'autor sincronitzada (còmic, avatar, poble, rellotge i «Sistema»), amb el text envoltant-la.
- **Comentar:** el menú a la barra (300 px, focus, Escape amb tornada) i a una targeta en mòbil (375 px, sense retall).
- **Catàleg:** emojis XL a la llista i menuts a l'arbre.
- **Roda dentada:** amaga i torna a mostrar una carpeta de veres, i desa la preferència per espai.
- **Pantalla Assignar:** l'avís honest i l'Escape.
- **Bloc de Notes:** fitxes amb l'emoji XL.
- **Wiki (§0.7)**, mesurat al DOM: l'arbre té els emojis de les carpetes a 20 px, cap XL, i el Còdex humà amb 💓. La llista té les fitxes a 66 px. La portada oberta conserva la imatge de capçalera. Consola sense errors.
- **Carrusel i El Xat**, com a la segona onada.

Verificat a la primera meitat de la nit, amb ordres reproduïbles:
- **Partició de l'òmnibus:** `git diff --name-status rescat/omnibus-dfe8ef7a HEAD` només mostra les exclusions decidides (F1).
- **T5, Xat immersiu i rojos:** les suites de la taula F6, executades amb `npx vitest run <rutes>` abans de cada commit. Per al Xat, comprovació al navegador amb mesura del DOM a 375, 800 i 1280 px: `data-sdp-immersiu`, visibilitat de `header.bar-black` i `nav.mobile-nav`, i `--sdp-alt-nav-mobil` a 0.
- **Diagnòstic de MarIA:** nou troballes amb refutació adversarial independent. T2 i T4, refutades parcialment, ja estan corregides en F2.

No verificat:
- **Navegadors:** cap Safari 16 ni Firefox 100 reals, només Chrome del panell.
- **Mode remot:** cap prova contra el Supabase de veres; tot és en llavor.
- **Portes:** cap porta de `tooling/gates` executada per Claude (el hook ho bloqueja), llevat de les que són proves.
- **Build:** cap build ni ZIP.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Commits.** Amb els blindatges restaurats, Claude no pot fer `git add` ni `git commit`. Els commits són a F14 com a ordres exactes, i els executa el Mestre.
- **Governança.** Claude no pot escriure `.agents/ESTAT.md`, `.agents/LEDGER.md` ni cap fitxer de `.agents/` o `tooling/` sense una lease d'executor, i la CLI de lease no passa el hook. El relleu d'ESTAT i la línia del LEDGER són a F15 com a text per pegar. Tampoc no pot executar `tancament.mjs`.
- **Treball concurrent.** MarIA ha canviat la llicència per defecte (CC BY-NC-SA 4.0) i la pàgina de Drets mentre treballaven els agents. Els seus canvis s'han de commitejar en un front propi, i cal contrastar-los amb els fitxers que han tocat els sis fronts.
- **Mesures.** No s'ha mesurat cap consum de tokens ni cap temps humà.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
