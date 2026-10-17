---
type: informe
status: esborrany
description: Matriu de conformitat del pla 261016_1530 contra el codi real, amb el que Claude ha implementat, verificat i traslladat
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f66993e9-4431-40bc-89aa-6bb3b670161d:db1fb2f5-ac86-40a5-b8d0-93f06bae9bf8
---
# Auditoria de Claude · Gauntlet diürn 1530

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f66993e9-4431-40bc-89aa-6bb3b670161d:db1fb2f5-ac86-40a5-b8d0-93f06bae9bf8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-16T14:31:19.912Z |
| Modificació | 2026-10-16T22:45:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code) · orquestrador i quatre workflows de subagents Claude |
| Tokens consumits | No mesurats amb precisió. Ordre de magnitud: ~85 M en subagents (dos workflows tallats pel límit d'ús i represos) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-16T14:31:19.912Z: esborrany creat; contingut i verificació pendents.

2026-10-16 16:31–17:30 (Europe/Madrid): MCR dels 15 blocs del pla (30 agents: un auditor i un refutador per bloc), lectura creuada de Codex (1632, 1639, 1645) i Gemini (1633), estudi de Feedly al navegador i dues correccions directes (I34, F28).

2026-10-16 17:30–21:20: implementació en sis carrils amb fitxers disjunts. El límit d'ús va tallar 6 passos i 13 revisions. 21:20–23:30: represa (24 agents, cap error), revisió adversarial i correcció dels sis carrils. 23:30 en avant: col·lisions entre carrils resoltes, verificació al navegador i suite sencera.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Resum per al Mestre (en dos minuts)

- **El xat ja ix com vas manar.** Dalt de tot, i en este ordre: **Comunitat Sóc de Poble** (Avisos, General, Beta Testers), **Javi Llinares**, **Gent de la Torre** i **IAIA MarIA**. La fila buida i repetida de «Sóc de Poble» ja no hi és. Punxar la capçalera porta a `/javillinares`, `/socdepoble`, `/pobles/la-torre-de-les-macanes` i `/iaia`.
- **`/anima` és el manifest i `/iaia` és la fitxa de la IAIA.** El menú Sistema, el cercador, el sitemap i el SEO ja apunten bé.
- **El Bloc de notes s'ha netejat.** La barra taronja ja no diu «Foraster» ni porta la ploma del mig. El títol diu «Nota sense títol», igual que la targeta. Davall venen el Subtítol i l'Entradilla, i després un desplegable **«Edició avançada»** amb capçalera, logotip, carpetes, categories, etiquetes, **Emojis XL**, drets i Vista A4/PDF. El peu «Ja publicat al Mur» ha desaparegut. La plantilla d'exemple (H3, H4 i llistes) ara sí que s'esvaeix al primer clic.
- **Emojis XL a mà.** Hi ha una icona a la capçalera de NOTES, al costat del `[|<]`. A la ranura d'emoticona, un clic assigna l'emoji; dins del text, l'inserix on tens el cursor (o el copia, amb avís).
- **L'Arxiu visual ja no són 11 fotos.** En local en mostra 151. Clicar una foto obri un visor fosc com el de Google Fotos (anterior, següent, zoom i panell amb data, GPS, càmera, autor, poble, drets i on s'ha publicat). Hi ha un apartat «IAIA» per a les imatges d'IA. `/multimedia/town-benifallim` porta a `/pobles/benifallim`.
- **La Consola té el «Govern del Mestre».** Són quatre pàgines (Requeriments, Balanç, Certificació i Comunicació) amb botons per a validar, certificar o retornar cada tasca. **Avís honest:** encara no pot llegir sola la matriu de l'Escriptori, perquè el canal viu a `tooling/` i el hook no em deixa tocar-lo. Mentrestant, el botó «Obri una matriu (mcr.json)» la carrega des del teu ordinador. MarIA té el pegat exacte per a endollar-ho.
- **Privacitat.** La telemetria i l'esdeveniment `sdp-navega` cap als amfitrions ja no deixen escapar `/javillinares`: ara diuen `/perfil/*`. L'apartat 19 del text legal explica la diferència entre el nucli i els portals amfitrions. **Aprovar-lo és cosa teua** (frontissa de contingut).
- **El que t'espera a tu** és a la secció 6 d'este informe: deu decisions, cadascuna d'una línia.

### 2. Balanç transparent (Llei del Balanç)

**Demanat (prompt i pla 261016_1530, amb l'addenda de les 16:40 i 16:43):** els Blocs −1, 0, 0.5, 0.6, 1, 2, 3, 3.5, 3.6 (ampliat amb F57–F66), 3.7, 3.8, 3.9, 3.10 i 4, i les Onades 0.1–0.3, 1–1.6, 2, 3 i 4. També la Regla d'Or de la MCR, el balanç i el trasllat.

**Fet per Claude en esta tanda (codi, proves i navegador):** el Bloc 3.6 sencer en local (F21, F57, F59–F66 i F22), els Blocs 3.8 i 3.9 sencers (F29–F47), la Multimèdia (M03–M07, I35 i l'apartat IAIA), la Consola de govern (I09–I12, amb el canal de servidor pendent), el Bloc −1 (resolutor d'avatar i guarda anti-regressió), el Perfil i el Cercador (poble a les entitats, avatar de l'H1, aside intern), el Lector (dreceres de Feedly i bookmarklet OG), l'apartat 19, l'autoamagat en tauleta i caixa baixa, la caixa de WordPress, la IAIA local en llavor, defectes del TPV i el llibre de factures, i proves lentes i de fuites. També F28 (telemetria i amfitrió) i I34 (reserves d'imatges de pobles).

**Traslladat al pla següent (cap ítem s'esborra):** totes les files PARCIAL o PENDENT de la MCR de baix. Per IDs: F01, F15, F16, F17, F18, F20, F24, F25, F58, I01, I04, I05, I06, I13–I16, I18, I20, I23–I28, I30, I32, I33, M01, M02, M08–M11, G04, G05, G08, G12 i G14. A més, l'esborrat d'administrador a Multimèdia, el text de la diferència entre Control i Consola, els pegats de `tooling/` i `.agents/` (secció 5) i el rescat semàntic de l'arxiu (secció 7).

### 3. Matriu de Conformitat de Requeriments (MCR)

Vocabulari literal del pla: **[FET I SEGELLAT]** vol dir codi, prova i, quan es pot veure, navegador en local, després de revisió adversarial. **[PARCIAL]** i **[PENDENT DE SEGÜENT TANDA]** passen al pla següent. «Local» no vol dir desplegat. Els IDs són els del relleu de Codex [[261016_1639_pla_implementacio_relleu_codex_gauntlet]].

| ID | Requeriment | Estat | Evidència i límit |
| --- | --- | --- | --- |
| F01 | Erradicar «Mestre Poble» i «mestre-obres» | [PARCIAL] | Zero al codi. La guarda `src/data/identitatDual.guarda.test.js` recorre src, supabase, public, tests i wordpress-plugin. La BD remota no s'ha pogut consultar: la consulta de lectura proposada és a la secció 6. |
| F02 | Mac Mini signat per Javi amb la seua foto | [FET I SEGELLAT] | Hi ha un resolutor únic de l'avatar i el nom de qui signa: la foto canònica SEMPRE, també al Mur, als actes, al detall, a la barra taronja i a les targetes incrustades. Inclou la fila crua de `seed.sql` sense `author_avatar`. Mercat verificat al navegador. |
| F03 | El Mac Mini és l'única publicació de Javi | [FET I SEGELLAT] | La guarda (b) ho fixa sobre les llavors i `seed.sql`. Les dades remotes no s'han verificat (F01). |
| F04–F06, F09, F11–F14, F19, F22, F36, F37, F52–F55, G09, G10, I02, I03, I08, I17, I19, I21, I22, I29, I31, I36 | Segellats per Codex al tall 1632 | [FET I SEGELLAT] | No s'hi ha fet cap regressió. F19 s'ha reforçat: l'avatar de damunt de l'H1 de PerfilEditor beu ara d'`avatarDeLaFitxa`, la mateixa font que la targeta i la barra. |
| F07, F08 | Xat net tipus WhatsApp; persona i organització dissociades | [FET I SEGELLAT] | 4 actors en ordre, sense duplicat, amb capçaleres enllaçades. Verificat al navegador en remot local. |
| F10 | Llicència de les notes a El compte | [FET I SEGELLAT] | Preexistent; la MCR ho ha reverificat al codi i a les proves. |
| F15 | Un perfil real per identitat en remot | [PARCIAL] | Calen els UUID de producció a `IDS_REMOTS_FUNDACIONALS` (decisió 1). |
| F16 | Entitats fundacionals sempre amb poble | [PARCIAL] | La reserva `POBLE_FUNDACIONAL` ja s'aplica al Cercador, a l'editor i a «Les vistes». En remot depén dels UUID (F15) i d'una migració de `membres_del_poble` (decisió 2). |
| F17 | Poble obligatori en crear una entitat | [PARCIAL] | Validació de client preexistent; la prova de servidor està pendent. |
| F18 | SQL de l'UPDATE propi de `profiles` (403) | [PARCIAL] | La migració `2610160250` és correcta, però no està aplicada a producció (decisió 3). |
| F20 | OpenGraph per a WhatsApp | [PARCIAL] | `index.html` és correcte. Producció servix HTML a l'URL del PNG (Codex) i el PNG fa 530 KB. La taula SEO de WordPress necessita `tooling/` (secció 5). |
| F21, F57, F59 | 4 actors en ordre estricte i sense la fila directa sintètica de Sóc de Poble | [FET I SEGELLAT] | `src/sections/xat/actorsDelXat.js`. Prova de la llista REAL de llavor i de la mostra sense sessió. Navegador: Comunitat → Javi → Gent de la Torre → IAIA. |
| F58 | Comunitat amb Avisos, General i Beta Testers | [PARCIAL] | Llavor i mostra correctes. En remot, el servidor només crea Avisos i General (decisió 4). |
| F60, F61, F62, F63 | Capçaleres → /javillinares, /socdepoble, /pobles/…, /iaia | [FET I SEGELLAT] | `CapcaleraConversa.jsx` i `FitxaComunitat.jsx`. Navegador: Javi → `/javillinares`. |
| F64, F65 | `/anima` és el manifest i `/iaia` la fitxa de la IAIA | [FET I SEGELLAT] | Rutes, menú, cercador, sitemap i SEO. Els enllaços desats amb `/iaia` dins de connexions es reconduïxen a `/anima` (`rutaVigentDePagina`). Els cossos HTML ja publicats amb `/iaia` necessiten una migració de dades (decisió 5). |
| F66 | Entrada pilot local sense backend | [FET I SEGELLAT] | Només en DEV i en mode seed o local, cap HTTP al 54321. En remot, cap identitat de pilot (proves negatives i de contrast). Avís: el `.env.local` d'ara és remot, i per vore el botó cal posar-lo en seed o local. |
| F22 | Missatge automàtic literal de Javi | [FET I SEGELLAT] | Es conserva amb les cometes «». Pregunta oberta a la decisió 6. |
| F23 | La IAIA s'obri en seed i local | [FET I SEGELLAT] | Preexistent. A més, `/xat/sdp-per-defecte:<clau>` ja no fa 404. |
| F24 | Supabase local equivalent a producció | [PARCIAL] | No s'ha verificat el `127.0.0.1:54321` real. `.env.example` ja no proposa un `default-tenant` que trencava l'arrencada. |
| F25 | Intel·ligència local de la IAIA | [PARCIAL] | Primer pas fet: en seed i local, la IAIA respon amb els 3 documents més pròxims de la Wiki pública (`src/data/iaiaLocal.js`, JS pur, a demanda). DCVB, botànica i redacció són decisió 7. |
| F26, F27 | Apartat 19: nucli enfront d'amfitrions; obligació de declarar | [FET I SEGELLAT] | Text veraç a `legalContent.js` (versió 2.1). Cal aprovar-ne l'empremta (decisió 8). |
| F28 | Mètriques sobiranes sense dades personals | [PARCIAL] | La fuita `/javillinares` està tapada a `telemetria.js` i `contracteAmfitrio.js · tapaRuta`, amb proves de paritat. El magatzem agregat propi és la decisió 9. |
| F29–F34 | Emojis XL al Bloc | [FET I SEGELLAT] | `GraellaEmojis.jsx` (les dades arriben a demanda, sense trencar la regla de capes), `accionsLlista`, `registraInsercio` i l'ordre «/» Emoji. Desviació justificada: Dialeg en lloc d'`usePantallaCompleta`, perquè `renderActions` no passa event ni id. |
| F35, F38–F47 | Editor Universal redissenyat | [FET I SEGELLAT] | Via pilot només en seed o local, o per àlies declarat (mai a un anònim remot). «Edició avançada» és opt-in. La plantilla s'esvaeix comparant el document normalitzat, també abans d'una ordre de la barra o d'un emoji. La plantilla verge no es publica mai. Navegador verificat. |
| F48–F51 | Autoamagat en mòbil, tauleta i caixa baixa; CLS | [FET I SEGELLAT] | `data-sdp-tactil` i `data-sdp-curta` (≤760), amb guarda entre columnes. CLS mesurat al navegador: 0. Llindars de 24 px i 760 px: decisió 10. |
| F56, I33 | Sessions llargues i zero fuites | [PARCIAL] | Prova nova de desconnexió del ResizeObserver d'AppGridShell, i límits explícits a les proves lentes. No és cap garantia universal. |
| I01 | Estudi de Feedly amb REA | [PARCIAL] | REA està bloquejat pel hook local (`mcp__rea__*` no és a la llista blanca) i necessita un Chrome amb CDP. L'estudi s'ha fet amb el navegador integrat: dreceres J/K/N/P/O/M/X/S/V, Maj+A i Maj+J/K, ja implementades a `src/apps/lector/vistes/dreceres.js`. |
| I04, G08 | Fonts RSS reals | [PENDENT DE SEGÜENT TANDA] | Catàleg verificat ara al navegador (secció 4). Falta el proxy de servidor del Model B (decisió 9). |
| I05, I06, I07 | Bookmarklet: tria, article al Lector, OG | [PARCIAL] | Títol i subtítol des d'OpenGraph, tallats per punts de codi. La imatge OG, el botó visible i desar l'article al Lector són decisions del Mestre (doctrina de privacitat i contracte de la plataforma). |
| I09, I10, I11, I12 | Consola de govern: matriu, balanç, certificació i comunicació | [PARCIAL] | Les quatre pàgines funcionen al navegador amb el `mcr.json` de Codex carregat per fitxer (prova feta). El vocabulari és literal i una matriu obsoleta mai es pinta de verd. La certificació és local i només afig, amb exportació JSONL. Falta el canal `/__iaia/govern.json` (pegat a `tooling/`, secció 5). WebAuthn no s'ha integrat (justificat). |
| I13–I16, I18, I20 | Llei del Quadrat WebP universal i migració | [PARCIAL] | No es pot executar cap conversor ni script (hook). El pressupost de la vinyeta es compara ara amb `PRESSUPOST_PUJADA` (80.000 B). |
| I23 | FCP sense salts | [PARCIAL] | La caixa de WordPress ja no sobreïx (`min(32rem,100dvh)`). FCP no mesurat. Cal una nova versió del connector. |
| I24–I28 | TPV i Gestoria | [PARCIAL] | Corregida la divisió del compte que perdia la tornada al TPV. Llibre de factures net (base, IVA, filtres i totals) i exportació CSV. Al·lèrgens, Mode Rebost i tresoreria (fonts de tractor): decisions del Mestre. |
| I30, G14 | Connexió efectiva amb Sollutia | [PENDENT DE SEGÜENT TANDA] | Calen els endpoints de Sollutia. |
| I32 | 40.000 usuaris reals | [PENDENT DE SEGÜENT TANDA] | Cal una càrrega real autoritzada. |
| I34 | Reserves d'imatges de pobles | [FET I SEGELLAT] | Les 9 reserves apunten a `/assets/uploads/brain/`. Una prova de frescor comprova el disc i la signatura (algunes `.png` són JPEG per dins). |
| I35 | Cronologia de Multimèdia | [FET I SEGELLAT] | `src/sections/multimedia/cronologia.js` calcula els grups (abans arribaven buits). |
| M01 | Arbre d'assets per entitats | [PENDENT DE SEGÜENT TANDA] | Per ordre del pla, no s'ha mogut cap fitxer. La proposta amb taula d'àlies és a la MCR. |
| M02 | Calaix per actor a Storage | [PARCIAL] | La RLS de Storage exigix `<tenant>/<uid>/…`; un calaix per entitat necessita migració. |
| M03 | Cens real d'imatges | [FET I SEGELLAT] | `censImatges.js`: 151 imatges en local, deduplicades i amb exclusions motivades. La fila remota `mediaItems` és rància fins que es desplegue. |
| M04, M05, M06, M07 | Visor tipus Google Fotos i redirecció de town-* | [FET I SEGELLAT] | `VisorImatges.jsx` sobre Dialeg, `?foto=` amb Arrere, zoom, panell EXIF (càmera inclosa) i GPS amagat per a persones. Navegador verificat. |
| M08–M11 | Mapa fotogràfic d'Emowe | [PENDENT DE SEGÜENT TANDA] | Introduïx Leaflet vendoritzat i tessel·les de tercers, i el motor d'Emowe no porta llicència (decisió 9). |
| G04, G05 | Rescat de l'arxiu històric | [PARCIAL] | Vegeu la secció 7. |
| G11 | Suite completa verda | [FET I SEGELLAT] | Vitest sencer: 19.005 passades, 0 fallades (exit 0); Node, 97/97 en els fitxers del connector i el xat. La CI de GitHub no s'ha executat (no hi ha cap commit). |
| G12 | ESTAT, Acta i tancament | [PENDENT DE SEGÜENT TANDA] | Bloquejat per la governança (secció 5). |

### 4. Catàleg real de fonts RSS (verificat al navegador, 16/10/2026)

| Font | Feed | Prova |
| --- | --- | --- |
| Emowe (blog) | `https://emowe.com/rss.xml` | 200, 170 entrades, l'última el 14/10/2026 |
| Emowe (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCWNdNma5sbMELOhpu6qD8Sg` | 200, 15 entrades |
| Xavier Mitjana (web) | `https://iaenaccion.com/feed/` | 200, WordPress |
| Xavier Mitjana (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCp2Zmdh40GJJJ2T5vWsMZDA` | 200, 15 entrades |
| Jon Hernández (web) | `https://www.jonhernandez.education/feed/` | declarat a la web (també `/rss.xml`, 50 entrades) |
| Jon Hernández (YouTube @la_inteligencia_artificial) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCl5-lvQyfILb-l2abPk4Ntg` | 200, 15 entrades |
| Ben Cord (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCpq8lHHliCS3oBt-gfL0bKQ` | 200, 15 entrades |
| Migue Baena (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A` | 200, 15 entrades |

No poden viure a `src/apps/lector` (`frontera.test.js` prohibix URL http(s) a l'app). Han d'arribar per un proxy de l'amfitrió (WordPress) o de Supabase, segons el Model B.

### 5. Bloquejos de governança (per què no tot és «fet»)

1. **Segell de skills trencat.** `node tooling/gates/segella.mjs` diu `cc202331 ≠ 5e7339db`. El commit `df963ca3` va afegir skills sense resegellar. Mentre el segell estiga trencat, `executor-mutacio.mjs` no accepta cap escriptura de governança.
2. **Zones protegides pel hook local** (`.agents/`, `tooling/`, `scripts/`, `package.json`). Per això no he pogut escriure ESTAT ni LEDGER, executar `tancament.mjs`, convertir imatges a WebP, regenerar `seed.sql` ni el manifest SEO, ni tocar les skills. Pegats exactes a les eixides dels workflows, i en resum:
   - `tooling/brain/fonts-govern.mjs` (nou) i la ruta `GET /__iaia/govern.json` a `tooling/vite/consola-iaia.mjs`: canal de la Consola de govern.
   - `tooling/wiki/gen_targeta_universal.mjs:11`: ruta canònica de la foto de Javi.
   - `tooling/gates/tractor-llavor.mjs`: contradiu el mandat («Javi Llinares» al Mac Mini). Mentre faça exit 1, talla `npm run porta` a la línia 80.
   - `tooling/gates/build-seo-manifest.mjs`: files SEO de `/javillinares`, `/socdepoble` i `/rentonar` per a WordPress.
   - `tooling/wiki/core/edge_rag.mjs`: `search()` no accepta l'índex JSON publicat.
   - Skills `sdp-universal-editor` (§1, §2 i §4) i `sdp-universal-page` §2: textos al dia amb el codi nou.
3. **REA**: `mcp__rea__*` és una «eina opaca» per al hook i, a més, necessita un Chrome amb CDP en local.

### 6. Decisions que només pot prendre el Mestre (una línia cadascuna)

1. Declarar els UUID de producció de Javi, Sóc de Poble i Rentonar a `IDS_REMOTS_FUNDACIONALS` (perfil únic, poble i fusió al cercador en remot).
2. Migració perquè `membres_del_poble` torne el poble de les organitzacions.
3. Aplicar `supabase/migrations/2610160250_perfil_update_propi.sql` a producció (403 de `profiles`).
4. Crear el canal «Beta Testers» a la comunitat de Sóc de Poble en remot (el servidor només en crea dos).
5. Migrar els enllaços `/iaia` ja desats dins de publicacions i notes connectades cap a `/anima`.
6. El missatge automàtic de Javi: amb les cometes «» o sense.
7. IAIA cultural: el DCVB per enllaç, el corpus etnobotànic i l'ajuda de redacció (drets, fonts i sobirania).
8. Aprovar l'apartat 19 (`node tooling/gates/frontissa-contingut.mjs --aprova legal --per NOM`) i decidir si la versió 2.1 obliga a tornar a donar el consentiment.
9. Infraestructura: on viu el proxy RSS; comptador agregat propi o Umami propi; Leaflet i tessel·les per al mapa d'Emowe; desplegar la fila `mediaItems` i socdepoble.org; publicar el connector 1.1.4.
10. Llindars de l'autoamagat: els 24 px per a tornar les barres i el tall de 760 px de «caixa baixa».

### 7. Rescat de l'arxiu històric (Bloc 0.6)

S'han llegit íntegrament 1.036 fitxers de text de `90_arxiu_historic/`, `01_produccio/` i `02_investigacio_ia/`, en 97 lots, i s'han extret les perles, la feina declarada i les decisions. El contrast amb el codi viu el va tallar el límit d'ús, juntament amb un error del guió de síntesi, ja corregit. El workflow s'ha représ reutilitzant les 97 lectures, i l'Informe de Rescat naixerà com a document propi en acabar. No s'ha mogut ni esborrat cap original. Gemini (1633) i Codex (1632) ja hi han aportat: cal no comptar dues vegades les mateixes perles, i el registre únic és tasca de Gemini.

### 8. Consens de l'Olivera (lectura creuada)

- **Codex té raó** en F47 (la plantilla no s'esvaïa: comparació d'HTML), en F28 (fuita de `/javillinares`), en I34 (reserves amb un prefix inexistent; no són `nano_banner_*`) i en F66 (el botó «Forçar entrada local» no injectava cap sessió). Tot està corregit.
- **Gemini** proposava una regex de blancs per a F47; Codex la va refutar, i jo també: s'ha comparat el document normalitzat de ProseMirror. Gemini donava el Bloc 0.6 per segellat al 100%; Codex i jo el deixem en PARCIAL, perquè censar no és llegir semànticament.
- **La meua MCR** (30 agents) va trobar defectes que cap dels dos no tenia. La prova del port del Workspace era inestable sota càrrega. La Consola de govern importava del carril dels Tractors i trencava la frontera de privacitat de la Gestoria (resolt amb un `canonic.js` propi i una prova de paritat). L'editor del Bloc té les barres `static` dins de `.sdp-bloc`.

### 9. Retroalimentació de la plantilla prompt_local

- Cal separar «llegir» de «fer» per ID. Els IDs estables del relleu de Codex (F/I/M/G) han fet possible la MCR creuada, i convé que la plantilla els exigisca des del primer pla.
- Cal declarar a la plantilla els permisos reals del hook (què pot escriure cada agent local). Sense això, el pla demana tasques impossibles de fer, com convertir imatges, segellar o escriure l'ESTAT.
- El prompt demanava «deixar informe cada 10–15 minuts» amb un cron de MarIA. Amb workflows de fons, el relleu útil és per bloc tancat, no per rellotge.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves focals de cada carril**, executades pels implementadors i, de nou, pels correctors. Notes: 706/706. Components universals i CSS: 2.215/2.215. Perfil i Disseny: 996/996. App: 2.787 (2 omeses). Gestoria: 3.285/3.286 abans de resoldre la col·lisió del carril F (ara verda). Xat, Multimèdia, Consola, Lector i Text en verd segons els informes.
- **Proves meues**: `assetResolver` 18/18; telemetria i consumidors 87/87; govern i privacitat de la Gestoria 146/146; contracte, paritat, telemetria i Text 252/252.
- **Navegador integrat (localhost:3340, mode remot local)**: ordre i capçaleres del xat; `/anima` i `/iaia`; redirecció de `/multimedia/town-benifallim`; Arxiu de 151 imatges i visor amb panell; editor amb «Nota sense títol», Subtítol, Entradilla, «Edició avançada», icona Emojis, sense «Foraster» ni peu; Consola de govern amb una matriu carregada per fitxer.
- **Suite sencera** `npx vitest run src tests` (inici 23:34:28, 529 s, després de totes les correccions): **1.103 fitxers passats i 6 omesos; 19.005 proves passades, 0 fallades i 89 omeses; exit 0.** El tall de Codex (1632) tenia 18.385 passades i 1 fallada (HistoricCofre per temps).
- **Proves Node** `node --test` d'enxufe-plugin, enxufe-pantalla, conformitat-amfitrio i migracio-xat-de-pagina: **97/97**, amb el PHP real i el wptexturize de WordPress Studio.
- **Validació documental**: `document.mjs check` sobre este informe, `valid: true`. Porta Olivera `--informe`: sense errors (només els avisos CONV-07 de sediment de l'índex, que ja hi eren).
- **Porta Olivera i tancament**: no executables per este agent (vegeu Límits).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No he pogut escriure `.agents/ESTAT.md` ni `.agents/LEDGER.md`, ni executar `tancament.mjs` ni `porta-olivera.mjs` amb opcions: el hook local ho reserva a l'executor amb lease, i el segell està trencat. **Cap tancament declarat.**
- Res no està desplegat ni aplicat a producció. Cap commit. «Fet i segellat» vol dir en local.
- No he verificat Safari 16 ni iOS reals, ni l'encastament real a gentdelatorre.net.
- Durant el torn, Codex i Gemini editaven l'Escriptori i Antigravity el `.env.local`: és un arbre concurrent, i les evidències són d'este tall.
- Cap cron ni tasca programada creada per Claude. Els workflows de fons s'acaben amb el torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261016_1530_pla_implementacio_gauntlet_autonom]]
- [[261016_1639_pla_implementacio_relleu_codex_gauntlet]]
- [[261016_1632_auditoria_codex]]
- [[261016_1633_auditoria_gemini4]]
