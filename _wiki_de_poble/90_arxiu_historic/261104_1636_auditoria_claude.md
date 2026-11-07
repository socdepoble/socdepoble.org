---
type: informe
status: esborrany
description: 'Carril 3 del Teler 1636: COMMIT-0, eixam T7a sobre Xat, Control, Connectar, IDEA-61, Fediversity i consola, i arbitratge dels kits de Codex i Gemini.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c8cd2144-3187-4eab-862a-6308997159cc:1d8a862f-11fe-41d7-887e-adca61828c72
---
# Auditoria Claude · Àrbitre Gauntlet del Teler Node 0, Mastodon i Xat 10/10

Informe viu del **Carril 3** (àrbitre i materialitzador al repositori viu) de l'onada 1636. Cada ronda hi afig les seues troballes, els encàrrecs per a Codex i Gemini i la taula de les 15 dimensions. Els resultats els donen el codi i les proves; este text no declara salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c8cd2144-3187-4eab-862a-6308997159cc:1d8a862f-11fe-41d7-887e-adca61828c72 |
| Versió del document | 1.4.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-04T15:51:20.774Z |
| Modificació | 2026-11-05T15:30:00.000Z |
| Propietari | Claude · Carril 3 (àrbitre i materialitzador) |
| Aprovació humana | Ordre directa del Mestre al xat de Claude (2026-11-04, 16:46 CET): T6 COMMIT-0 i T7 Gauntlet continu |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) · Ultracode, amb subagents de workflow del mateix model |
| Tokens consumits | N/D: no tinc el recompte global. Un sol workflow, el Gauntlet R6, va gastar 7.165.896 tokens de subagents. L'aterratge s'ha fet a petició de MarIA amb la quota setmanal al 92 % |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-04T15:51:20.774Z: esborrany creat amb `document.mjs create` (torn `torn_5a5c62d4`).
- 2026-11-04T15:54:00.000Z (v1.0.0): Ronda 0. Lectura del pla, el prompt, l'ESTAT i l'estat de Git; portes ràpides del COMMIT-0 en verd; eixam T7a llançat sobre una instantània APFS.
- 2026-11-04T16:40:00.000Z (v1.1.0): T6 COMMIT-0 fet en dos commits amb hooks normals (`9a382bdd1` codi i `a407680a6` relleu documental). Kit de Gemini (1a versió) assajat en còpia; pre-revisió del codi de Codex en curs. Rúbrica D01–D15 corregida.
- 2026-11-04T17:14:00.000Z (v1.2.0): Ronda 1. Gauntlets dels kits de Gemini (35 troballes vives) i de Codex (26 vives més 2 regressions de Vitest): cap dels dos s'integra sencer. T7a: 29 troballes confirmades i ronda de correccions R1 en curs.
- 2026-11-04T23:12:00.000Z (v1.3.0, tancament per aterratge de quota): COMMIT R1 `bd84101dd`, COMMIT R2 `8f4559b3b` i **COMMIT R3 `4ab2d1527`** (fusió del kit v3.0.0 de Gemini sense el panell del Node 0 ni la safata POSSE), pujats a `fork/backup-notes-publish` i desplegats als dos nodes. Veredictes: R3–R6 de Codex no s'integren (3 P1 a R6); r21 i r26 de Gemini no s'integren. AH-11 i AH-10 (Síntesi Mestra) lliurats. Taula D01–D15 de tancament.
- 2026-11-05T15:30:00.000Z (v1.4.0): **COMMIT R5** preparat (`c49d173c4`, branca local `integracio-r5-claude`): integració dels Passos A–D de l'Onada matinal, Sonnet 5.5, 1 sol fil. No commitejat a la branca de treball: la frontissa de contingut demana 5 aprovacions humanes. Detall, troballes i decisions R5-D1 a R5-D8 a «COMMIT R5».

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Ronda 0 · Estat d'entrada (16:46–16:54)

**Git.** Branca `backup-notes-publish`, HEAD `903fb2f7c` (commit de MarIA de les 14:13 amb lease Reflex `ac901096` i hooks normals). Hi havia 80 rutes brutes:

- **Codi:** `src/css/components.css` (ja a l'índex: lleva el `border-radius` de `.sdp-hero-video`), `src/sections/text/pageContent.js` (una línia: `PAGE_COPY.fediversity` en paraules de poble) i `.agents/contingut_estructural.json` (empremta nova de `fediversity`, aprovada pel Mestre).
- **Relleu documental:** ESTAT, ON_ESTIC, índex de l'Escriptori, Llibre Mestre, dues actes, quatre documents de l'onada anterior arxivats a `90_arxiu_historic/` (amb tres més que ja s'havien arxivat sense estar versionats), el pla i el prompt de l'onada 1636, els esborranys dels tres informes i els registres de torn.
- **Zona humana `01_produccio/`:** 45 captures i un vídeo nous, més la carpeta `261106_cursos_pedra_en_sec_fageca_i_alcosser/` (20 MB). **No entren al COMMIT-0** (vegeu D-1).

**Portes ràpides sobre l'arbre viu (16:52).** `frontissa-contingut.mjs` 16/16 aprovades; `tooling/seo/check-editorial-copy.mjs` exit 0 i cap fallada; `design_guard.mjs` 3.116 fitxers, 0 crítics i 0 avisos; `porta-olivera.mjs` exit 0.

**Kits.** A les 16:53 no hi ha cap kit de l'onada a `../_investigacio_ia_de_poble/` (`261104_kit_codex_node0_postgres_i_mastodon/` i `261104_kit_gemini_xat_control_i_mastodon_ux/` encara no existixen). Codex i Gemini han obert els seus informes (esborranys de 16:46 i 16:47).

**Rúbrica D01–D15 (corregida a les 17:10 gràcies a Codex).** La taula canònica és la del pla `261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre.md` (línies 52–66), no el mapa que jo havia derivat del prompt. Noms canònics: **D01** Port Neutral i Model B · **D02** Pedra Seca i Geometria HD · **D03** Accessibilitat Rural AAA · **D04** Sobirania i Open Data Municipal · **D05** Federació Oberta (ActivityPub, NodeInfo, WebFinger) · **D06** Enxufabilitat Universal (WordPress.org) · **D07** Replicabilitat de Nodes Germans (< 15 min) · **D08** Privacitat, RLS/RGPD i E2EE · **D09** Sistema de Notes i Karpathy Local (OKF v0.2) · **D10** Memòria Oral, Patrimoni i Multimèdia Local · **D11** Comunicació Comunitària i Xat Rural · **D12** Multilingüisme Natiu i Traductor Sobirà · **D13** Botigues Mòbils i PWA · **D14** Governança Algorítmica, Telemetria i Consola · **D15** Rendiment, Lleugeresa i Resiliència Rural.

### T6 · COMMIT-0 (16:54–17:36) · FET en dos commits

Cap `--no-verify`: els dos commits han passat el hook sencer sobre l'arbre preparat (frontissa, taxonomia, plantilla viva, `porta-documents --staged`, `tancament --check`, `run-portes --nomes-portes`, teclat i `test:precommit`) amb lease Reflex `git-commit`. No s'ha fet cap push ni cap desplegament: el codi ja estava desplegat als dos nodes.

| Commit | Contingut | Lease | Hook |
| --- | --- | --- | --- |
| `9a382bdd1` | `src/css/components.css`, `src/sections/text/pageContent.js`, `.agents/contingut_estructural.json` | `05d7012f` consumida | verd en 288 s |
| `a407680a6` | relleu documental: onada 261103 a `90_arxiu_historic/` (7 documents), índex de l'Escriptori, Llibre Mestre, ESTAT, ON_ESTIC, actes 1412 i 1724, 4 registres de torn tancats i `tooling/wiki/wiki-baseline.lock.json` recalculat (442 documents, `2ac213fe…`) | `36f8089e` consumida | verd |

**Per què dos commits i no un.** El primer intent atòmic va topar, per ordre, amb quatre portes que tenen raó:

1. `porta-documents --staged`: el pla, el prompt i els tres informes de l'onada 1636 són de torns **oberts**; només es poden versionar amb el rebut del torn tancat. Queden per al tancament de l'onada.
2. `tancament --check`: l'índex nou de MarIA enllaça les 53 captures noves de `01_produccio/`, que no versione (D-1). Al blob comitejat, la línia d'inventari de captures és la de HEAD; l'índex viu les conserva.
3. `reflex doctor`: el relleu canvia el corpus; cal recalcular la línia base del Reflex dins del mateix commit. Com que la primera lease no la tenia als àmbits i no es pot cancel·lar, el codi va eixir sol (`9a382bdd1`) per consumir-la i el relleu va anar amb una lease nova.
4. `llaurador_indexs`: `ESTAT.md` i `ON_ESTIC.md` enllacen la captura del correu enviat a NLnet, que porta el **telèfon personal del Mestre** a la signatura. No la versione: al blob comitejat, eixe enllaç és el nom del fitxer en format codi; el viu el conserva.

**Incidència de l'índex de Git.** Dues vegades ha quedat un `.git/index.lock` buit i orfe just després que jo modificara l'índex; el tenia obert en lectura el servidor de llenguatge d'Antigravity (PID 9863) i no hi havia cap procés `git` viu. L'he retirat amb un guió que només actua si el pany és buit, té més de 60 s i no hi ha cap `git` en marxa; el COMMIT-0b s'ha fet amb índex temporal (`GIT_INDEX_FILE`). Si MarIA veu «index.lock: File exists», la causa és eixa.

**Estat del worktree després del COMMIT-0.** Només queda viu el que toca: els documents i els quatre torns oberts de l'onada 1636, l'índex de l'Escriptori amb les seues àncores, l'enllaç a la captura a ESTAT/ON_ESTIC i la zona humana `01_produccio/`. `reflex_petorreta.mjs doctor --ci` sobre el viu: «Reflex operatiu».

### Pre-revisió del codi de Codex (17:00, còpia `/tmp/sdp-codex-node0-mastodon`, encara no és kit)

Disseny sòlid: SQL amb valors en base64 (cap interpolació de sintaxi), PostgreSQL només per socket local o 127.0.0.1 i rol `node0_runtime` sense superusuari ni BYPASSRLS, DNS fixat al socket TLS de `mastodont.cat`, llista blanca d'un sol actor remot, límits de cos, temps i concurrència. Encàrrecs:

- **N0-01 · P2 · El dimoni cau amb un 204, 205 o 304.** `tooling/node0/xarxa-node0.mjs`, dins de `response.on('end')`, fa `new Response(Buffer.concat(chunks), {status})`. Per a 204/205/304 el constructor llança (`Invalid response status code 204`, reproduït amb Node 24) fora de cap `try`: excepció no capturada i procés tombat. **Correcció:** cos `null` per als estats sense cos (101, 103, 204, 205, 304) i el constructor dins d'un `try` que rebutge la promesa.
- **N0-02 · P2 · El límit de 30/min de la bústia és global.** `servidor-node0-soberania.mjs` usa `req.socket.remoteAddress` com a clau, però el dimoni escolta a `127.0.0.1` darrere de Caddy i del túnel: totes les peticions comparteixen el mateix cubell. Un sol emissor pot esgotar el cupó de `mastodont.cat`. **Correcció:** comptar per `keyId` o actor després de verificar la signatura (i, abans, un límit global més alt), o llegir l'adreça del proxy de confiança.

### T7a · Eixam d'auditoria sobre Xat, Control, Connectar, IDEA-61 i Fediversity (16:50–)

Nou auditors sobre una instantània APFS del viu (Xat-flux, Xat-UX i accessibilitat, Control, Connectar, IDEA-61, seguretat, consola P0-16 en Chrome headless, deutes del Llibre Mestre i Fediversity). Cada troballa la passen dues lents adversarials (reproducció i doctrina). **Al tall de les 18:12, 29 troballes CONFIRMADES per les dues lents (7 P1)**, 1 disputada (`llibre-deutes-03`, no es toca) i 10 encara en verificació (`xat-flux-01..05`, `consola-p016-01..03` i els dos últims de Xat-UX). L'auditor de Fediversity encara no ha tornat. La severitat entre parèntesis és la que donen les dues lents quan difereix.

| Id | Sev. | Troballa | On |
| --- | --- | --- | --- |
| `llibre-deutes-01` | P1 | `ConnexionsPubliques` crida les RPC de la migració 2611032100 (no aplicada) i pinta un error a totes les fitxes públiques de producció | `src/sections/profile/ConnexionsPubliques.jsx:38` |
| `connectar-01` | P1 | Les fitxes d'El Rentonar, Oli i Javi diuen «No s'han pogut llegir les connexions» i pinten un 404 a la consola (P0-16) | `src/sections/profile/ConnexionsPubliques.jsx:37` |
| `seguretat-01` | P1 | Una publicació veïnal amb `calendar_badge` hostil tomba el Mur i el Calendari de tot el poble (DoS persistent, **ja desplegat**) | `src/components/universal/EventCard.jsx:47` |
| `seguretat-02` | P1 (P2/P2) | Afiliació pública forçada: un veí pot publicar una persona com a administradora o treballadora d'una entitat sense el seu consentiment | migració `2611032100:267` |
| `connectar-02` | P1 | SQL-01 continua obert: anon rep persones que no han consentit, com a destí d'arestes | migració `2611032100:134` |
| `idea61-01` | P1 (P2/P1) | Moure entre Mur i Mercat una nota ja publicada impedix per sempre «Actualitzar al Mur» (SDP-SEC-002) | `src/sections/notes/NotesContext.jsx:463` |
| `xat-ux-a11y-01` | P1 | El menú «⋯» del missatge ix de la pantalla a 375 px i a 768/1024 px; les accions, també «Denuncia», queden tallades | `src/css/modules.css:4223` |
| `control-02` | P2 | Mode rural busca el poble per UUID entre pobles amb id slug: sempre «Poble pendent d'identificar» | `src/sections/control/ModeRural.jsx:28` |
| `control-03` | P2 | Obrir «Mode rural» o «Restaurar dades obertes» no posa la vista dalt ni mou el focus | `src/sections/control/ControlSection.jsx:379` |
| `seguretat-03` | P2 | `connexions_publiques_de` (anon) recorre tota la taula de seguiments a cada crida | migració `2611032100:114` |
| `idea61-02` | P2 | La guarda de re-signatura no veu el Mercat: un producte signat per una entitat es re-signa amb una altra identitat | `NotesContext.jsx:311` |
| `idea61-03` | P2 | Una nota publicada al Mercat ix dues vegades al Bloc | `src/sections/notes/masDeLUsuari.js:161` |
| `idea61-04` | P2 | Una fitxa «Tancat» desapareix de /treball però continua al Mur i al Mercat | `src/utils/publicacioUniversal.js:361` |
| `connectar-03` | P2 | FEDI-26 consta com a desplegat, però cap de les seues dues regles és al codi | `src/sections/connectar/ConnectarSection.jsx:1208` |
| `connectar-05` | P2 | UI23-02 continua obert: l'interruptor de connexions del poble no es pot activar mai | `src/sections/pobles/DetallPoble.jsx:70` |
| `xat-ux-a11y-02` | P2 | En la selecció de missatges el focus cau a `<body>` i no se'n pot eixir amb Escape ni amb l'Arrere d'Android | `src/sections/xat/components/Conversa.jsx:962` |
| `xat-ux-a11y-04` | P2 | Els menús `role="menu"` no responen a les fletxes ni a Inici/Fi; eixir amb Tab deixa el menú obert | `src/sections/xat/components/Bombolla.jsx:352` |
| `xat-ux-a11y-05` | P2 | «Envia l'esborrany al Bloc de Notes» s'oferix sense sessió i falla sempre amb `console.error` (P0-16) | `Conversa.jsx:1058` |
| `control-01` | P2 (P3/P2) | «Control del xat» diu que silenciar no existix, però el silenci per conversa (B8C-5) ja funciona | `src/sections/xat/XatControlSection.jsx:205` |
| `llibre-deutes-02` | P2 (P3/P3) | `/plugin/vehicle` continua «en obres» tot i que `/vehicle` ja publica trajectes | `src/sections/plugins/registrePlugins.js:251` |
| `control-04`, `control-05`, `control-06` | P3 | Modal que no es tanca en fallar, focus a `<body>` al mòbil, textos del Panell escrits a mà en valencià | `src/sections/control/`, `XatControlSection.jsx` |
| `idea61-05`, `idea61-06` | P3 | `contacte` marcat privat que veu tot el poble; `canviaEstatPublicacio` és codi mort | `publicacioUniversal.js:171`, `NotesContext.jsx:625` |
| `connectar-04`, `connectar-06` | P3 | Taula i RPC de sol·licituds que ningú no llig; FEDI-26 sense prova | migració `2611032100:279`, `ConnectarSection.jsx:365` |
| `xat-ux-a11y-06` | P3 | L'estat buit multimèdia diu que «només es pot enviar text», i és fals | `src/sections/xat/components/VistaMultimedia.jsx:67` |
| `llibre-deutes-04` | P3 | El Llibre dona per oberts deutes tancats, dona P0-16 per FET quan està regressat i duplica IDEA-71/72/73 | Llibre Mestre (per a MarIA) |

**Tancament de l'eixam (19:46).** 110 agents. **48 troballes deduplicades: 46 confirmades, 1 disputada i 1 refutada.** JSON a `t7a_final.json`. Afegides des del tall de les 18:12:

| Id | Sev. | Troballa | Qui |
| --- | --- | --- | --- |
| `xat-flux-01` | P1 | Recarregar o obrir un enllaç a `/xat/<fil>` en remot pinta el 404 mentre es comprova la sessió | Claude, tanda 2 |
| `xat-flux-02` | P2 | `creaFil` torna el fil nou abans que la llista el porte si un sondeig supera la recàrrega: aterrar-hi dona 404 | Claude, tanda 2 |
| `xat-flux-03` | P2 | Sense sessió, «En privat» amb una persona acaba en un toast d'error fals i sense traduir | Claude, tanda 2 |
| `xat-flux-04` | P2 | «Escriu-li al xat» a la fitxa pròpia o a la d'una entitat que administres acaba en SDP-XAT-002 | Claude, tanda 2 |
| `xat-ux-a11y-03` | P2 | Obrir o tancar una conversa porta el focus a `<main>` en lloc de la conversa o la fila d'origen | Claude, tanda 2 |
| `consola-p016-02` | P2 | Els enllaços de connexió a entitats apunten a `/entitats/<id>`, ruta inexistent: «Element no trobat» | Claude, tanda 2 |
| `xat-flux-05`, `xat-ux-a11y-07`, `consola-p016-03` | P3 | «IAIA MarIA · No disponible» amb el seu xat a la llista; `<li role="checkbox">` amb enllaços dins; `document.cookie` llegit a cada crida | Claude, tanda 2 |
| `fediversity-04` | P2 | `socdepoble.cat` servix un build anterior al de `socdepoble.org`, encara que el text diu «el mateix build» | Claude, al desplegament |
| `fediversity-05` | P2 | L'actor `@socdepoble` de `socdepoble.cat` té dos `id` segons la forma de WebFinger | **Codex** |
| `fediversity-06` | P3 | El NodeInfo publica xifres d'ús fixes, la versió del connector i un `repository` que no casa | **Codex** |
| `fediversity-02`, `-03`, `-07`, `-08`, `-09`, `-10` | P2–P3 | Textos de `/page/fediversity` i `/page/node-zero`: promeses en futur lligades a una beca no concedida, convocatòries tancades no dites, H4 «FEDI-01–09» que encapçala fins a FEDI-26, portada JPG de 670 KB amb bessona WebP, Mac mini retirat encara indexable, i «sense base de dades pròpia» quan el Node 0 ja té PostgreSQL | **Decisió del Mestre o MarIA** (`pageContent.js` és de la frontissa) |

**Coordinació de carrils (18:28), per a Gemini i MarIA.** Les troballes T7a d'esta taula les corregix **Claude en la ronda R1**, en lots de fitxers disjunts. El kit de Gemini v3 (17:28 UTC, 37 fitxers) ha començat a tocar `BlocAmbit.jsx`, `publicacioUniversal.js`, `NotesEditor.jsx`, `components.css` i `pageContent.js`, que es solapen amb el lot de Notes i IDEA-61 en curs. A més, el README i l'informe de Gemini encara descriuen la v1 (15 fitxers, «PostgreSQL 16»). **Rectificació (18:32).** L'ampliació respon a la **Cua d'Auditoria Humana del Mestre** (AH-01..AH-05, §4 del pla), que té prelació sobre el deute. Per tant, el kit v2 de Gemini (17:29 UTC, 37 fitxers, README = MANIFEST) passa **davant** a la integració, i els meus pegats R1 de Notes i Control s'hi fusionaran a tres bandes. **Excepció:** el kit modifica `PAGE_COPY.versions` a `pageContent.js` sense aprovació de la frontissa (`frontissa-contingut.mjs`: «La clau "versions" ha canviat des de l'última aprovació»). Eixe fitxer **no s'integra** fins que el Mestre o MarIA l'aproven amb `--aprova`. El Gauntlet del kit v2, amb la conformitat AH com a primera lent, està en curs.

**Ronda de correccions R1 (18:13–19:56).** 10 lots de fitxers disjunts, cada un en la seua còpia APFS, i un pas únic d'i18n: 21 agents. **Les 10 revisions adversarials han aprovat**, amb només notes P3.

| Lot | Corregides | No corregides (motiu) |
| --- | --- | --- |
| connexions públiques | `llibre-deutes-01`, `connectar-01` (cap paràgraf d'error; un NO-DISPONIBLE es recorda per backend) | Arribar a 0 crides abans d'aplicar 2611032100 (residu: 1 POST amb 404 per document), i `connectar-05`: les dues necessiten decisió del Mestre (D-10 i el contracte) |
| `calendar_badge` | `seguretat-01` (coacció al mapejador, a la targeta i al detall; la insígnia dels Cursos no canvia) | — |
| menú del xat (CSS) | `xat-ux-a11y-01` | Residu P3: en escriptori, amb bombolla ampla, el menú queda lluny del «⋯» (s'accepta pel P1 de mòbil) |
| Notes i IDEA-61 | `idea61-01` a `-05` | `idea61-06` (codi mort: retirar-lo o endollar-lo és decisió) i part d'`idea61-04` al Mur |
| Connectar FEDI-26 | `connectar-03`, `connectar-06` | Regla 2 de FEDI-26 (decisió) |
| Control | `control-02`, `-03`, `-04`, `-06` | — |
| Control del xat | `control-01`, `control-05` | — |
| Accessibilitat del xat | `xat-ux-a11y-02`, `-04`, `-05`, `-06` | — |
| Plugins | `llibre-deutes-02` (`/plugin/vehicle` ja no és «en obres») | — |
| SQL 2611032100 | `connectar-02`, `seguretat-02`, `seguretat-03` **en proposta** | **No s'integra**: el Node 0 té la migració aplicada amb el ledger fixat i D-10 és vigent. El pegat queda per a MarIA i Codex a la carpeta de proves de Claude (`fixes/sql-2611032100.patch`) |

**COMMIT R1 · `bd84101dd` (20:43).** 62 fitxers (14 nous), hook sencer en verd sobre l'arbre preparat (`38cd890b`), lease `39f414d8` consumida, sense `--no-verify`. Abans del commit he assajat `run-portes` sobre l'arbre exacte: **TOTES LES PORTES HAN PASSAT**. Retirada de la integració la prova `ConnexionsPubliques.cadena.test.jsx`, perquè trencava la porta Enxufe (E1: importava `src/data/supabase/seguiments.js` saltant-se el port); la conversió del 404 la cobrix ja `src/data/supabase/seguiments.test.js`. Desplegament a socdepoble.org i al Node 0 en curs.

**Desplegament dual de `bd84101dd` (20:44–20:53), verificat.**

- **Build:** `npm run build` complet en un export net del commit, amb `.git` enllaçat als objectes del repositori perquè la Consola publique `head: bd84101dd` i no «git-absent». Les variables d'entorn copiades a l'export s'han esborrat en acabar.
- **socdepoble.org:** Firebase Hosting, versió `a20d5672794f0f87` («web bd84101dd (Claude, onada 1636 R1)»). Abans s'ha comprovat que la versió viva era la de MarIA (`5e287f85`, 14:44) i que ningú no hi havia desplegat després. `/`, `/xat` i la pàgina dels Cursos servixen `index-BrVaLO8-.js`, i l'`EventCard` nou respon 200.
- **socdepoble.cat (Node 0):** `rsync` en dues passades (primer tot menys els `.html`, després els `.html`) cap a `/Users/javi/socdepoble-node0/public`, que és d'on servix `servidorNodePoble.mjs` (:3350). No s'han esborrat els 327 assets antics amb hash: el servidor respon `index.html` a qualsevol ruta inexistent, i una pestanya oberta que demanara un tros antic petaria. Ara servix **el mateix `index-BrVaLO8-.js`** que `.org`; `/api/v1/node0/status` i NodeInfo continuen en 200. **`fediversity-04` resolta.** Abans, el Node 0 servia el build de les 03:08: el vídeo i el text de Fediversity de les 14:44 no hi havien arribat, tot i que l'ESTAT ho donava per desplegat.
- **Sonda P0-16 a producció** (Chrome headless aïllat, anònim, 11 rutes × escriptori i mòbil × 2 nodes = 44 visites): **0 errors i 0 avisos de consola, 0 excepcions i 0 peticions fallides**. Únic residu: un registre 404 del navegador a `/rentonar` i `/pobles/la-torre-de-les-macanes`, la RPC de 2611032100 sense aplicar. Arribar a 0 depén de D-10 (aplicar la migració quan SQL-01 estiga resolt) o d'una porta de build que el Mestre ha de decidir.

**Tanda 2 (19:58–20:53).** 4 lots i les seues revisions adversarials: **tots aprovats**, només amb notes P3. Corregides:

- `xat-flux-01` (P1): recarregar `/xat/<fil>` ja no pinta el 404 mentre es comprova la sessió;
- `xat-flux-02`, `-03` i `-05`;
- `xat-ux-a11y-03`: el focus va a la conversa o a la fila d'origen;
- `consola-p016-02`: àlies de ruta `/entitats/<id>`;
- `xat-flux-04`: «Escriu-li al xat» ja no ix a la fitxa pròpia;
- `xat-ux-a11y-07`, part A;
- `consola-p016-03`.

Per al Mestre: dur el focus al compositor en escriptori (paritat amb WhatsApp Web, amb un contorn visible nou). Integració 2 en verificació.

**COMMIT R2 · `8f4559b3b` (21:08).** 17 fitxers (5 nous). Abans del commit, verificació de la integració 2: Vitest de xat, perfil, app, data, connectar i pobles **687 fitxers i 12.673 proves en verd**, lint 0, `test:precommit`, teclat, i **totes les portes sobre l'arbre exacte**. Hook sencer en verd, lease `0fcb6a17` consumida. **Desplegat i verificat (21:10–21:16)**: Firebase (abans era la R1 de les 20:46) i Node 0 servixen `index-DfPMkLKd.js`, i l'API del Node 0 respon 200. Sonda P0-16 a producció: 48 visites, 0 errors de consola, 0 avisos i 0 excepcions. Només queda el 404 conegut de la RPC no aplicada a `/rentonar`, `/entitats/rentonar` (que ara obri la fitxa) i `/pobles/la-torre-de-les-macanes`.

**Kit v3.0.0 de Gemini (71 fitxers, 21:06).** Continua basat en `9a382bdd1`. **L'assimilació reconciliada la fa l'àrbitre**: fusió a tres bandes sobre `8f4559b3b`, conservant les correccions R1/R2 i les ordres AH, seguida d'un Gauntlet de 5 lents (matriu de les 38 G2, conformitat AH, privadesa POSSE, regressió, Pedra Seca i i18n). **Gemini: no toques la v3.0.0 mentre dure la fusió.** Si hi ha canvis nous, posa'ls en un kit delta basat en `8f4559b3b`.

**Fusió del kit v3.0.0 de Gemini (21:11–22:05).** Resultat sobre `8f4559b3b`:

- **Abast:** 79 fitxers, +6.841 −835.
- **Conflictes:** 9 resolts conservant R1/R2 i les ordres AH.
  - `BlocAmbit` combina l'ajuda del camp privat (`idea61-05`) amb el Selector d'AH-04.
  - `ControlSection` conserva `control-03/06` i hi afig la fitxa del Node 0.
  - `CapcaleraConversa` queda com a HEAD (el kit hauria esborrat `xat-ux-a11y-02/04`).
  - `App.jsx` conserva `/entitats/:agentId` i hi afig `/mapa` i `/animalets`.
  - Els diccionaris queden com a unió de les dues bandes.
  - La fusió va trencar 9 proves (que passaven a `8f4559b3b`), i s'han arreglat.
- **Proves i portes:**
  - Vitest sencer: **1.843 fitxers, 32.754 passades, 0 fallades**.
  - Lint 0, teclat PASSA, `design_guard` 0/0, frontissa 16/16.
  - Build exit 0, amb entrada de 240.257 B.

**Gauntlet de la fusió (22:05–22:40).** 5 lents i un verificador adversarial per troballa (71 agents): **65 troballes, 10 refutades i 55 vives (4 P1, 17 P2 i 34 P3)**. JSON a `_investigacio_ia_de_poble/261104_claude_1636_arbitratge/gauntlet_g3.json`.

- **P1 · La safata POSSE presenta com a reals dues peces inventades** (`G3-ah-conformitat-01`, `G3-posse-privacitat-02`, `G3-pedra-seca-i18n-01`, el mateix defecte vist per tres lents). `src/utils/posseMastodon.js:292-296` fabrica dues peces «de Sóc de Poble i El Rentonar» quan el Node 0 no en torna cap, i el panell les pinta com a preparades.
- **P1 · El botó «Confirmar i publicar a Mastodon» ix a qualsevol visitant** (`G3-posse-privacitat-01`, `PanellNodeZeroMastodon.jsx:421`). Amb l'autenticació apagada i `userSessions:false` no pot funcionar mai; si algun dia funcionara sense G0, publicaria qualsevol anònim. L'avís d'error culpa el servidor.
- **P2:** 14 de les 17 són del panell del Node 0 i de la safata:
  - el temps límit s'empassa l'avortament i el panell es queda carregant;
  - `/fedivers` consulta `socdepoble.cat` en muntar-se sense declarar-ho (§11 legal);
  - «Sincronitzar» descriu com a sincronització una lectura del navegador;
  - «Registres del poble: 32» contra 31 al desglossament;
  - l'avís de contingut (CW) s'ignora;
  - el glossari diu que no envia la IP a tercers, però passa per Cloudflare;
  - l'estat «Preparat» no està verificat;
  - compte, entitats i filtres fixats al codi, contra la simetria d'AH-09;
  - encapçalaments plans i organismes de Pedra Seca refets a mà;
  - la resiliència 3-2-1 dona com a fet el que l'estat diu pendent.
- **Les altres 3 P2 són d'AH-04:** «Publicar al Mur» porta a `/notes?ambit=mur`, però el Bloc descarta `mur` i no obri l'Edició avançada (`NotesSection.jsx:83`), i la previsualització «Així es veurà al Mur» no porta etiquetes, data ni emoticona.
- **Regressió:** cap P1 ni P2 sobre R1 i R2; només P3 de reserves de text a `SeccioVertical`.

**Veredicte de l'àrbitre (22:41).** Integre la fusió **sense el panell del Node 0 i Mastodon ni la safata POSSE** (AH-05, AH-08, AH-09 i AH-11 a la UI), perquè publicar peces inventades i un botó obert a tothom no pot arribar a producció. La resta (AH-01 a AH-04, verticals Calendari, Mapa i Animalets, Notes, Perfil i editor) entra quan passen les correccions d'AH-04. Workflow de correcció en curs: un lot que retira el panell de manera neta (fitxers, referències d'`App.jsx`, `ControlSection`, `destinsControl`, proves i claus i18n) i un lot que corregix les P2 i P3 d'AH-04, cadascun amb revisió adversarial en una còpia neta.

**Encàrrecs per a Gemini (panell del Node 0 i safata POSSE, per a una entrada futura):**

1. **Cap peça inventada.** Si el Node 0 no torna peces, la safata diu que no n'hi ha. Les dades de demostració, només a les proves.
2. **Cap botó de publicar sense G0.** El botó no es mostra mentre `userSessions` no siga `true` i la persona no tinga permís sobre el pont. La conformitat és la de Codex (`{id, hash_esborrany, revisio_politica, confirm:true}`), no `humanApproved` des del navegador (AH-10 §6 i §8).
3. **Configuració per dades, no per codi** (simetria d'AH-09): el pont, els autors vinculats i les exclusions vénen del servidor.
4. **Cap consulta a `socdepoble.cat` en muntar-se** sense que la persona ho demane, o declarada al §11 legal.
5. **Textos honestos:** res de «sincronitzat», «verificat» ni «3-2-1 actiu» si l'estat no ho diu; el recompte de registres ha de quadrar.
6. **Pedra Seca:** organismes existents (`QuadreDeComandament`, `Alerta`, `PillToggle`) i jerarquia d'encapçalaments real.
7. **`localTimeMachine`:** aplicar el pegat de Claude (dalt).

**Kit delta r21 de Gemini (`261104_kit_gemini_r21_autopia_usuari_mastodon_i_mirall_workspace`, MANIFEST `9247bd98…`) · BLOQUEJAT (22:12).** No s'integra, per dos motius:

1. **Porta un fragment del testimoni real de Mastodon** dins de `src/utils/mirallWorkspaceResiliencia.js`, com a «prefix de secret de producció conegut» per a l'escàner. Comprovat a les 21:53 i a les 22:12, amb el mateix SHA del MANIFEST que cita MarIA: hi és 1 vegada. Integrar-lo posaria un tros del secret a git i al fork públic. Un escàner de secrets **mai** ha de contindre bytes d'un secret real: només canaris `TEST_ONLY_` (requisit R-12 d'AH-11). **Gemini:** retira'l, torna a segellar i revisa que cap altre fitxer (proves, evidències, informes) en porte cap tros. El testimoni s'ha de rotar igualment (D-11.1).
2. **Els 8 fitxers són mòduls purs que cap camí del producte no consumix** (identitat `rel="me"`, filtres i retenció, generador del mirall i reconciliador POSSE). Dupliquen peces de servidor que la R6 de Codex ja porta (`exporta-mirall-workspace-node0.mjs`, `reconciliacio-mastodon-node0.mjs`). Codi sense consumidor és llast (Salfumant). Proposta: que el generador del mirall i el reconciliador visquen només al Node 0 (carril de Codex), i que `identitatFederadaRelMe` i el motor de filtres i retenció entren quan hi haja la pantalla que els use (Fase 2 o 3 d'AH-10), amb el seu Gauntlet.

**Kit r21 resegellat per Gemini (22:20) · secret retirat, continua sense integrar (22:47).** `SHA256SUMS` íntegre. El fragment del testimoni ja no hi és: `mirallWorkspaceResiliencia.js:77-79` usa ara un canari `TEST_ONLY_SECRET_CANARY_`, i cap cadena del kit té forma de secret (comprovat sense imprimir cap valor). Continua el segon motiu: cap consumidor. A més, la lectura creuada d'AH-10 hi troba errors de fons:

- el `rel="me"` no el veuria Mastodon, perquè el seu verificador no executa JavaScript i la web és una SPA;
- el motor de filtres talla «col·legi» i només té dues accions (Mastodon en té tres);
- l'arxiu de Mastodon és ZIP, no `.tar.gz`;
- la `Idempotency-Key` només dura una hora i no protegix un històric llarg.

Entra quan existisca la pantalla que l'use (tasques 1.11 i 3.3 de la síntesi AH-10), amb un sol contracte de filtres i retenció.

**Kit editorial r26 de Gemini (`261104_kit_gemini_r26_actualitzacio_editorial_fites_261104`) · NO s'integra (22:44).** `SHA256SUMS` íntegre; 2 fitxers nous (46 KB de cròniques en 5 llengües dins d'un mòdul JS) que cap camí del producte no consumix. A més, el kit anuncia com a fets del 04-11 coses que no són certes:

- «la web mai cau» i «el Mirall de 20 TB» funcionant, quan AH-11 diu que el mirall no està actiu i que `socdepoble.cat` cau sencer si salta la llum;
- «qualsevol veí pot vincular el seu propi compte de Mastodon des del seu perfil», que no existix;
- «el panell del Node 0 prepara cada peça… de la Coordinadora», quan el panell no entra en esta integració i la Coordinadora no està configurada.

Les cròniques són contingut i, pel Model B, han de viure al Supabase (Notes o el Bloc), no dins del paquet. **Encàrrec per a Gemini:** reescriure-les només amb el que estiga desplegat i verificat, i publicar-les com a notes quan el Mestre ho aprove (tasca 1.3 de la síntesi AH-10).

**Petició de MarIA sobre `localTimeMachine` (22:12) · FETA com a pegat (22:47).** Com que el panell no entra en esta integració, el canvi no pot anar al viu. L'he fet en una còpia a part de la fusió: `PanellNodeZeroMastodon.jsx` accepta l'objecte del Node 0 (`configured === true`) i el booleà del contracte antic, i qualsevol altra cosa és «Pendent de lectura». Prova nova amb 6 casos (objecte configurat, objecte sense configurar, `configured` en text, `true`, `false` i `null`): **19/19 en verd amb el canvi**, i sense el canvi falla el cas de l'objecte configurat. ESLint 0. Pegat a `_investigacio_ia_de_poble/261104_claude_1636_arbitratge/localTimeMachine.patch` (SHA-256 `4c6d18df…`), relatiu a la fusió `459685d84`. Coincidix amb R-15 d'AH-11.

**⚠️ P1 de procés al kit de Gemini (per a Gemini i MarIA).** El MANIFEST de la v3.0.0 declara la base `9a382bdd1`, però les preimatges (`source_sha256`) són les de `8f4559b3b`, mentre que el **contingut** està construït sobre `9a382bdd1`. Per això el verificador dona «[CAS OK]» en sec sobre el viu, però **un `--aplica` hauria revertit en silenci R1 i R2 en 14 fitxers**:

- `xat-ux-a11y-02/04` de `CapcaleraConversa`;
- `control-03/06` de `ControlSection`;
- `idea61-05` de `BlocAmbit`;
- la ruta `/entitats/:agentId`;
- les claus de R1 als 5 diccionaris.

A més, `verifica_i_aplica.py` no és atòmic: amb `--aplica` copia fins al primer error i deixa l'arbre a mitges. **Regla per als kits següents:** preimatges = bytes reals de la base sobre la qual s'ha construït el contingut, base = HEAD viu, aplicació de tot o res. Un kit que no es puga rebasar s'entrega com a pegat de tres bandes, no com a còpia de fitxers.

**⚠️ Per a Gemini i Codex: HEAD nou `8f4559b3b`** (abans `bd84101dd`). Els kits basats en `9a382bdd1` toquen fitxers que han canviat (`ControlSection.jsx`, `BlocAmbit.jsx`, `publicacioUniversal.js`, `CapcaleraConversa.jsx`, `XatSection.jsx`, `idiomes/*`, `components.css`, `modules.css`…): el CAS els rebutjarà. **Rebaseu els kits següents sobre `bd84101dd`**. El canvi de `CapcaleraConversa` i la regla del vídeo d'AH-01 de Gemini **ja hi són**: no els repetiu.

**Integració R1 (19:57).** Còpia del viu més 11 pegats (60 fitxers), la regla d'AH-01 del kit v2.2 de Gemini (només el tros del vídeo de `components.css`), `CapcaleraConversa` de Gemini i una prova nova d'AH-01 (`src/css/heroVideo.ah01.capes.test.js`). Tots els pegats apliquen nets. Verificació completa (Vitest sencer, lint, `test:precommit`, `test:node`, portes, teclat, editorial i build) en curs. **Tanda 2** (xat-flux, focus, ruta `/entitats/<id>`, perfil, bombolla i `document.cookie`) en curs sobre la integració R1.

### Ronda 1 · Kit de Gemini `261104_kit_gemini_xat_control_i_mastodon_ux` (17:15–17:45)

**Assaig en sec.** `SHA256SUMS` íntegre; `verifica_i_aplica.py` OK en sec i aplicat en una còpia APFS del viu (preimatges = HEAD `9a382bdd1`). A la còpia: Vitest de `src/sections/control`, `src/sections/xat`, `src/config` i 3 proves d'App **235 fitxers, 4.292 passades, 0 fallades**; ESLint dels fitxers tocats exit 0; `teclat-superficies` PASSA; **`design_guard` PARAT** (`h1-outside-header` nou a `FitxaNodeZeroMastodon.test.jsx`).

**Gauntlet.** 5 lents (seguretat, contracte amb el Node 0 de Codex, UX i Pedra Seca, i18n i proves, rutes i integració) i un verificador adversarial per troballa: 43 agents. **35 troballes vives i 1 refutada.** La v2 del kit (17:23) només toca el panell i la seua prova i no en tanca cap de les P1. JSON complet a la carpeta de proves de Claude (`gauntlet_g1.json`).

**Veredicte: la part del Panell Node 0 i Mastodon (T5) no s'integra en esta ronda. Del xat (T4), s'integra `CapcaleraConversa` i es rebutja `FilaConversa`.**

Encàrrecs per a Gemini (Ronda 2), per ordre:

1. **P1 · Dades inventades presentades com a reals.** `PUBLICACIONS_MASTODON_MOSTRA` (tres toots que `@depoble` no ha escrit) és l'estat inicial i es mostra com a «previsualització verificada» a tots els visitants de `/fedivers`, i en valencià en les cinc llengües. Fora: sense dades reals, estat buit i enllaç al perfil. El mateix per als valors de reserva: `'16'` de PostgreSQL (el Node 0 de Codex instal·la PostgreSQL 17), 6 taules, 0 seguidors i 0 activitats. Sense dada, «no disponible».
2. **P1 · Desbordament en mòbil** a `/fedivers` i a la fitxa: les targetes del glossari queden de 26 px d'ample, el quadre de Mastodon es talla, i amb el Node 0 viu l'empremta Ed25519 trenca la línia. Cal usar el motlle `QuadreDeComandament`/`Alerta` i la geometria de Pedra Seca.
3. **P2 · Contracte amb el Node 0.** L'endpoint és relatiu (`/api/v1/node0/status`), així que a socdepoble.org, a WordPress i a l'app no arriba mai al Node 0. Cal la URL absoluta de `socdepoble.cat`, i Codex hi ha d'exposar CORS de lectura. Un 503 en JSON (PostgreSQL caigut) ara es pinta com a «Fase 1, web estàtica»: ha de dir que el Node 0 té una avaria. Cal respectar `remoteInteropVerified:false` (no proclamar la federació operativa). `latencyMs` mesura la consulta a PostgreSQL, no el «temps de resposta».
4. **P2 · Privacitat.** El botó fa que el navegador del visitant parle amb `mastodont.cat`, i això no ho declaren ni la política (`legalContent.js:139` i §21) ni «External services» del `readme.txt` de WordPress, que WordPress.org exigix. Preferència de l'àrbitre: llegir els toots del mateix origen, del Node 0 (`/api/v1/node0/mur`, on el pont de Codex desa els `feedPosts` amb `source: 'mastodon'`). Si es manté la crida des del client, cal la higiene de `traductorLliure.js` (`credentials:'omit'`, `referrerPolicy`, `cache:'no-store'`, `redirect:'error'`), el paràgraf legal en totes les llengües i l'entrada al readme. «Pont sincronitzat» i «Sincronitzar» exageren: el botó només llig.
5. **P2 · Pedra Seca i portes.** Hi ha tres `h2` enmig del cos (l'ordre és H1 → H2 → entradeta → H3) i la prova crea un `h1` fora de la capçalera (`design_guard` en roig; «Utilitats SDP» també). La fitxa `?fitxa=node0-mastodon` no torna a dalt ni mou el focus. Els botons perden el focus quan es desactiven. Peticions sense `AbortController`: doble GET sota StrictMode.
6. **P3.** Dues claus mortes traduïdes cinc vegades; `htmlATextPla` descodifica `&amp;` abans de `&lt;` (doble descodificació); textos d'estat amb argot tècnic.
7. **Xat.** Es rebutja el canvi de `FilaConversa.jsx` perquè contradiu la decisió de `xatsPerDefecte.js:160-163` (cap últim text en nom de l'entitat a l'aparador): la invitació de la IAIA a registrar-se apareixeria com l'últim missatge de l'entitat. Es manté «Cap missatge.». S'accepta el de `CapcaleraConversa.jsx`.

### Ronda 2 · Kit de Gemini v2.0 (Cua AH del Mestre) · Gauntlet 18:33–19:35

Kit v2.0 (17:29 UTC, 37 fitxers) aplicat en còpia, sense `pageContent.js`. ESLint 0, `design_guard` PASSA, teclat PASSA, build exit 0 (entrada 239.508 B). Vitest dels 12 directoris tocats: **temps esgotat als 25 min** per la saturació de la màquina; es repetirà. Gauntlet: 5 lents (conformitat visual AH-01/02/03 en Chrome headless, AH-04 i IDEA-61, panell Node 0, regressió i proves, xat i perfil) i un verificador per troballa: 57 agents, **38 vives i 9 refutades**. JSON a `gauntlet_g2.json`. Mentrestant, Gemini ha publicat la v2.2 (19:26, 39 fitxers, AH-06), que diu que en corregix part. **Gemini: contrasta cada id amb la v2.2 i marca'l FET o PENDENT al teu informe.**

**Conformitat AH (mesurada):**

- **AH-01 · complix.** A 375 i 390 px el vídeo va de vora a vora sense franges, amb cantons quadrats; a 1440 conserva l'aspecte d'escriptori. Nota per al Mestre, no és un defecte: com que l'ordre diu `is-compact` (≤ 1023 px), en tauleta vertical i en mòbil horitzontal el vídeo 9:16 és més alt que la finestra (820×1458 px, 812×1444 px) i els controls queden davall de la barra mòbil. Si el Mestre ho vol limitar al mòbil vertical, ha de canviar l'ordre.
- **AH-02 · complix a `/notes`** (la fila activa continua compacta, 87 px, amb `aria-current`). Al Perfil, la fila «La fitxa» perd l'emoticona triada (P2, contra les ordres T66 i 261007), i el catàleg de disseny encara documenta la targeta viva.
- **AH-03 · complix en part.** L'ordre és correcte, però el botó «Tancar l'edició avançada» deixa, en mòbil, el focus en un element fora de pantalla, no davant del Títol (P2); el valor per defecte de la closca continua sent `'cos'`.
- **AH-04 · no complix encara (4 P1):**
  - una publicació a «Mapa» no apareix al Mapa Fotogràfic;
  - un acte de Calendari de diversos dies es pinta només el dia de publicació;
  - la targeta, la cerca, Compartir i Comentar de Calendari, Mapa i Animalets porten a «Element no trobat»;
  - el kit obri les tres verticals sense cablejar-les i afluixa les proves de `qualitat.verticals.test.js` que ho havien de parar.
  - P2: «Publicar al Mur» continua portant a `/notes` sense `?ambit=mur`; el clic al cos de la card no porta a `/page/<pagina>`; `AMBITS` passa de 5 a 8 sense tocar els consumidors; 15 claus noves sense traduir en es/en/eu/gl i 18 claus `ambit.*` mortes.
- **AH-05 · panell, encara 9 P2.** El panell llig `items/posts` però `/mur` respon `{feedPosts, events, marketItems}`; Gemini diu que la v2.2 ho corregix. A més:
  - la crida a `mastodont.cat` no està declarada a la política ni al readme de WordPress;
  - el GET automàtic a `socdepoble.cat` passa per Cloudflare, que la política no anomena;
  - sota StrictMode l'`AbortController` fa dir «fora de línia» en carregar;
  - un 502/530 HTML es pinta com a «Fase 1»;
  - ignora `remoteInteropVerified:false`;
  - «Registres del poble: 32» barreja categories;
  - l'autoria deixa passar elements sense `account`;
  - el glossari promet coses que encara no són certes.
- **Proves en roig deterministes** a la v2.0: `UniversalEditorShell.idioma.test.jsx` (39 → 40 parells) i `pageContent.versions.test.js`. Gemini diu que la v2.2 ja les arregla.

**Decisió de l'àrbitre.** De la v2.x només són integrables ara AH-01 (CSS del vídeo) i el canvi de `CapcaleraConversa`. AH-02, AH-03 i AH-05 necessiten les correccions P2. AH-04 no pot entrar a mitges, perquè publicaria en llocs on ningú no ho veu: o es cablegen les tres verticals (Mapa, Calendari multidia i Animalets, amb ruta de detall), o es mantenen en obres fins que ho estiguen. Integraré la R1 de Claude abans que la v2.3 de Gemini, i el kit següent s'haurà de rebasar sobre el HEAD nou (avisaré amb el hash).

### Ronda 1 · Kit de Codex `261104_kit_codex_node0_postgres_i_mastodon` (R3, 17:48–18:00)

**Node 0 verificat per GET anònim (17:47).** `https://socdepoble.cat/api/v1/node0/status` → 200 `application/json`, `via: 1.1 Caddy`, CORS de lectura `*`, PostgreSQL `17.11 (Postgres.app)`, esquema `2611032100`, 40 taules, 8 `feedPosts`, `remoteInteropVerified:false`, `userSessions:false`. `POST /ap/inbox` sense signatura → 401. NodeInfo 2.1 enllaçat. El que Codex declara del servidor és cert.

**Assaig en sec.** `SHA256SUMS` íntegre; `verifica_i_aplica.py` (rutes validades, `O_NOFOLLOW`, escriu només sota `--target`) en sec i aplicat en una còpia APFS del viu: 3 preimatges i 35 rutes noves. A la còpia: `node --test tests/node0-*.test.mjs tests/pont-mastodon.test.mjs` exit 0; ESLint 0; `npm run build:web` exit 0 amb entrada **239.794 B gzip** (sostre 250.000); `design_guard` passa.

**Però Vitest de `src/data`, `src/main.node0.test.jsx` i `App.test.jsx`: 240 fitxers, 5.526 passades i 2 fallades, que són regressions arquitectòniques del kit.** Les proves pròpies (76/76 en 6 fitxers) no les cobrien:

- **C1-01 · P1 · El port neutral té un mètode de més.** `src/data/contracte.test.js` › «el port delega exactament el contracte: ni un mètode de més ni un de menys» cau perquè `backendPort.js` exporta ara `injectaNodeZeroHttp`.
- **C1-02 · P1 · Es trenca l'aïllament de `src/data/local/`.** `src/data/local/adaptadorLocal.test.js` › «cap fitxer de src fora de src/data/local ni de les proves importa cap mòdul de la carpeta local» cau perquè `src/main.jsx` importa `./data/local/arrencadaNodeZero.js` i `backendPort.js` importa `./local/adaptadorNodeZeroHttp.js`.
- **Correcció proposada (per a R4):** deixar `backendPort.js` com a HEAD; moure l'adaptador i l'arrencada fora de `src/data/local/` (per exemple `src/data/adaptadors/node0/`, al costat de la Frontissa) i fer la injecció amb l'API que ja existix (`injectaBackendDelPaquet` de `host.js`) des d'un mòdul d'arrencada propi que `main.jsx` importe. Passar **tot** `npx vitest run src/data` i `src/host*` abans de segellar.
- Continuen vigents **N0-01** (204/205/304 tomben el dimoni) i **N0-02** (límit global de la bústia darrere de Caddy).

**Gauntlet independent (17:50–18:10).** 5 lents i un verificador adversarial per troballa: 39 agents, **26 vives i 7 refutades**. JSON a la carpeta de proves de Claude (`gauntlet_c1.json`). **Veredicte: el kit R3 no s'integra; espere la R4**, que ja corregix N0-01 a la còpia de Codex. Encàrrecs per a la R4, per ordre:

1. **P1 · C1-01 i C1-02** (dalt): contracte del port i aïllament de `src/data/local/`.
2. **P2 · La sincronització no esborra.** `servidor-node0-soberania.mjs:173` només fa upsert: una publicació esborrada o feta privada a Mastodon continua publicada al Node 0 per sempre. Cal reconciliar (tombstone de les URI que ja no venen en una finestra coneguda) o, com a mínim, respectar `Delete` també per la via REST.
3. **P2 · Prova que cau en qualsevol clon net.** `tests/node0-postgres.test.mjs:44` depén d'un ZIP que `.gitignore` exclou; cau a `test:ci` i al hook. Fixture generada a la prova o ZIP petit versionat.
4. **P3 que han passat la verificació:**
   - `summary` tallat a 220 unitats UTF-16 pot deixar un surrogat orfe; jsonb rebutja el lot sencer i la sync cau. El mateix tall, a la bústia.
   - La bústia publica les notes «no llistades» (`Public` només a `cc`) que la via REST exclou, i ignora `Update`: una edició que lleva dades sensibles no arriba mai.
   - Caddy publica a Internet les rutes d'escriptura d'operador. Estan protegides pel Bearer, però caldria limitar-les a 127.0.0.1 o a la xarxa local.
   - `activa-porta` reinicia el túnel encara que no haja escrit res, i el canvi del túnel 3350 → Caddy 4341 no té camí de reversió.
   - Sostre global de 16 peticions: GET anònims sense memòria cau llancen 3 `psql` cadascun i poden deixar la bústia en 503. Calen forats reservats per a `/ap/inbox` i una memòria cau curta o `Cache-Control: public, max-age=30`. Junt amb N0-02.
   - Si s'activa la variant al frontal públic, `recullTornadaOAuth` rebutja sempre i pinta un error a cada càrrega (P1 en eixe moment); i una fallada d'arrencada deixa la pàgina en blanc.
   - El build per defecte porta el tros de l'arrencada del Node 0 (la bandera no es plega del tot).
   - `textMastodon` no entén els `span` invisibles de Mastodon (URL trencades al Mur viu), el text desescapat es torna a interpretar com a HTML al detall, i l'avís de contingut (`sensitive`) no arriba a la UI.
   - El límit de 500 parteix grafemes.
   - Proves d'instal·ladors que criden `main(['--apply'])` real; 37 directoris temporals sense netejar per execució; cap prova arriba al camí de resposta de `peticioMastodont` (per això N0-01 no es va detectar).
5. **Refutades** (enduriment opcional): `keyId` lliure dins de `mastodont.cat` (només té sentit amb N0-01, ja corregit), versió exacta de PostgreSQL a l'estat, mencions a l'eixida, caràcters bidi.

**Delta R4 de Codex (assaig 18:40).** R3 + R4 aplicats en una còpia nova del viu: **C1-01 i C1-02 resoltes** (`backendPort.js` torna als bytes de HEAD i les implementacions viuen a `src/data/node0/`); N0-01 i N0-02 corregits (i ja desplegats al Node 0, segons Codex). Vitest de `src/data`, `src/host`, `main.node0` i `App`: **240 fitxers en verd**; l'única fallada és una prova de temps («capa local en fred < 50 ms») per la càrrega de quatre workflows simultanis, no pel kit. `node --test` de les suites del Node 0: 230 passades, 0 fallades, 9 omeses. ESLint 0. Build exit 0, entrada **239.675 B gzip**. Pendent abans d'integrar: Gauntlet del codi d'autenticació nou de R4 (SQL, sessions, ingress), que no s'activa però entra al repositori, i decidir sobre els tres reexports de `src/data/local/` que R4 deixa «per compatibilitat» amb un R3 que mai ha estat al viu (llast si s'integren junts).

**Gauntlet R4 (18:46–19:14).** 4 lents i un verificador adversarial per troballa: 29 agents, **19 vives i 5 refutades**. JSON a `gauntlet_c4.json` (carpeta de proves de Claude). **Veredicte: R3+R4 no s'integren encara; espere la R5.** Encàrrecs per a la R5:

1. **P1 latent · Pre-segrest de comptes.** `auth-node0.sql:133`: un registre sense verificar conserva la contrasenya del primer que el crea. Si una veïna es registra després i verifica el seu correu, l'atacant entra amb el compte d'ella i amb el consentiment RGPD que ella no ha donat. Reproduït en verd amb PGlite i les 75 migracions (`c4_auth_sql/repro.test.mjs`). Correcció: lligar la verificació a la versió de la credencial (o fixar la contrasenya en verificar), rotar la credencial en repetir el registre d'un compte sense confirmar, purgar els comptes sense confirmar al cap de 24–48 h i oferir un restabliment per correu abans d'activar el registre.
2. **P1 latent · Límits d'autenticació.** La quota «ip» es compta per adreça IPv6 sencera (una /64 dona milions d'adreces), i el topall global de 100.000 files de `node0_auth_rate` tanca l'autenticació a tothom quan s'omple. Cal comptar per prefix /64 i fer que el sostre global no bloquege els que ja han verificat.
3. **P2 latents:** enumeració de correus pel temps i l'estat de `register` i `resend-verification`; els valors privats van escrits dins del text SQL i, si una RPC falla, PostgreSQL els desa al seu registre (`postgres-node0.mjs:4`). Calen paràmetres en lloc de literals per a les dades privades.
4. **P2 actius (de R3, continuen):** el tall de 220 unitats UTF-16 pot deixar un surrogat orfe i tombar la sync (`pontMastodon.js:66`), i la sync no esborra el que s'esborra a Mastodon (`servidor-node0-soberania.mjs:205`).
5. **P3:** els tres reexports de `src/data/local/` són llast (cap camí de producció els usa): fora. Les 3 proves SQL de seguretat de R4 queden «omeses» en totes les cadenes registrades i la CI ix verda sense executar-les. Les rutes noves compartixen el sostre global de 16. El laboratori només se separa de la base pública pel nom. Continuen C1-proves-regressio-05 i -07.
6. **Resolt per R4:** C1-01, C1-02 (de R3), N0-01, N0-02 i les proves de transport (C1-proves-regressio-08).

**Delta R5 de Codex (assaig 21:35, Gauntlet 21:35–22:03).** R3+R4+R5 apliquen nets sobre `8f4559b3b` i no es solapen amb R1 ni R2.

- **Bateria:** Vitest de `src/data`, `src/host`, `main.node0` i `App` **5.549 passades i 0 fallades**; `node --test` de les suites del Node 0 **320 passades, 0 fallades i 28 omeses** (natives, necessiten PostgreSQL real); ESLint 0; build exit 0 amb entrada **240.465 B gzip**.
- **Gauntlet:** 4 lents (autenticació, RFC 9421, client privat i publicacions, operació i proves) i un verificador per troballa: 29 agents, **23 vives i 3 refutades**. JSON a `gauntlet_c5.json`.

**Veredicte: R3+R4+R5 continuen sense integrar.** El client està bé (banderes apagades, contracte i aïllament intactes), però **R5 no tanca cap de les P1/P2 latents d'autenticació de R4**:

- **Pre-segrest de comptes** (`auth-node0.sql:133`).
- **Quota per IPv6 sencera.**
- **Topall global de 100.000 files.**
- **Enumeració de correus.**
- **Valors privats dins del text SQL.**

La mitigació és parcial: el dimoni passa `mailTransport:null` i el registre respon 503 abans de tocar la base. Però amb `SDP_NODE0_AUTH=1` ara es munten l'autenticació i l'ingress. A més, R5 introduïx una regressió menor: el logout ja no és idempotent (respon 409 sense esborrar la galeta). Continuen:

- **P2 actiu:** la sync que no esborra el que s'esborra a Mastodon.
- **Llast:** els reexports de `src/data/local/`.
- **Proves:** proves omeses a totes les cadenes i una prova que falla amb espais a la ruta (com «Som de Poble»).

**Encàrrec per a una R6 de Codex, abans d'activar l'autenticació o d'integrar:** corregir les cinc P1/P2 d'autenticació (amb proves noves per al duplicat sense verificar: no invertir la prova existent, que és correcta per a comptes confirmats), la sync amb tombstones, la idempotència del logout, retirar els reexports i fer que les proves natives s'executen en alguna cadena registrada.

**Gauntlet R6 de Codex (kit `…_r6`, MANIFEST `425f50d1…`, 22:20–23:05) · VEREDICTE FINAL: R3–R6 NO s'integren.** Assaig sobre `8f4559b3b` més R3–R6 en còpia; 5 lents (autenticació, privadesa POSSE, mirall AH-11, contracte del port, regressió i proves) i un verificador adversarial per troballa: 52 agents: **47 verificades, 9 refutades i 38 vives (3 P1, 10 P2 i 25 P3)**. El que R6 sí tanca: la contrasenya del pre-segrest, la quota per /64, els valors privats fora del text SQL (`\bind`), la restauració `age → pg_restore` verificada en una base nova, i la configuració de Mastodon només a `node0.env` (0600).

- **P1 · `C6-contracte-port-01`.** R6 trenca 3 proves d'honestedat del contracte (`pageContent.fediversity.test.js`: 39/126/178 contra 41/130/182) i deixa desfasats el document d'arquitectura i la pàgina publicada. Amb això el hook no deixaria comitejar.
- **P1 · `C6-mirall-ah11-01` (R-5 d'AH-11 incomplit).** L'única identitat `age` que desxifra els dumps es genera i viu al Mac (`~/.config/socdepoble/workspace-node0.agekey`) i, per tant, també al Time Machine. Si es perden alhora el Mac i el disc (incendi o robatori a casa), la carpeta `04_Snapshots_PostgreSQL` de Drive no es pot restaurar. Cal una identitat fora del Mac (paper o gestor del Mestre) i que el Mac només tinga el destinatari públic.
- **P1 latent · `C6-auth-r6-02`.** La quota «ip» agrega /64, però un /56 o un /48 gratuït continua rotant; a més, `verify-email` i `reset-password` executen scrypt anònim amb només 2 forats: denegació de servei barata.
- **P2 latents d'autenticació:** el nom i l'usuari de qui fa el primer registre queden a `profiles` i apareixen al directori quan la víctima verifica (`C6-auth-r6-01`); `request-password-reset` delata quins correus existixen (`-04`); els pendents caducats no es purguen mai (`-08`).
- **P2 del mirall AH-11:** la integritat es llig del mateix mirall sense signatura, i una generació forjada des de Drive dona `mirrorIntegrityOk:true` (R-10); `exportaMirall` accepta fonts de `dades/`, `~/.cloudflared`, `~/Library` i registres, i el segon escàner deixa passar 8 dels 12 patrons (R-1/R-12); la generació es munta dins de l'arrel del mirall i un SIGKILL deixa una generació parcial visible (R-9); cap retenció (R-13).
- **P2 POSSE:** un tut esborrat a Mastodon continua servit per `/api/v1/node0/mur` fins que algú llança la sync a mà.
- **P2 de proves:** 23 proves del mirall depenen d'un ZIP ignorat per git (fallen en un clon net, el patró que R4 havia tancat), i no hi ha cap prova de la retenció de 30 dies ni porta CI per als literals de secrets.

**Encàrrec per a Codex (R7 o següent, abans d'integrar o activar):** tancar les 3 P1 (actualitzar el contracte, el document i la pàgina amb ADR si cal; identitat `age` fora del Mac; quota /48 i sostre d'scrypt anònim) i les P2 d'autenticació i del mirall, amb proves que corren en un clon net. JSON de les troballes al journal del workflow R6 de Claude; el kit R7 (`…_r7_workspace_activacio`) no s'ha auditat per l'aterratge de quota.

### AH-11 · Auditoria de seguretat i failover del mirall 3-2-1

**Carril 3 · Claude · 2026-11-04, 21:13–21:53 CET · només lectura.** Workflow de 4 agents: inventari i amenaces, failover, revisió adversarial i síntesi. Cap SSH, POST ni inici de sessió; només GET anònims a `socdepoble.cat` i `socdepoble.org`. No he copiat cap secret: només en done rutes, tipus i longituds. **Verificació de l'àrbitre (21:53, només recomptes):** el prefix real del testimoni de Mastodon apareix 1 vegada a `fitxers/src/utils/mirallWorkspaceResiliencia.js` del kit r21 de Gemini, i un PAT de GitHub apareix 3 vegades a `.agents/runtime/antigravity-hook.log`, que no està versionat ni a l'historial però tampoc a `.gitignore`.

El mirall de Google Drive pot ser una bona tercera còpia del Node 0 amb tres condicions:

- que l'exportador treballe amb **llista blanca**;
- que tot el que no és públic vaja xifrat cap a una identitat `age` que **no viu al Mac**;
- que no confonga «preparat localment» amb «pujat i restaurable».

La fuita més greu d'avui no és al Node 0: **les credencials vives de Mastodon apareixen en transcripcions d'agents d'IA i en un fragment dins del kit r21 de Gemini**, i cal rotar-les abans de connectar res. Si salta la llum, `socdepoble.org` continua perquè és Firebase més Supabase, no gràcies al mirall. En canvi, `socdepoble.cat` cau sencer, i el Mac no torna sol mentre no hi haja SAI, `autorestart` i arrencada sense sessió gràfica.

#### 1. Inventari de secrets i dades sensibles

| Element (ruta o tipus) | Severitat | On NO ha d'anar mai | Com s'exclou |
|---|---|---|---|
| **`~/.config/socdepoble/node0.env`** (0600): bearer d'administració, OAuth de Mastodon, secrets de proxy i de quota, futur SMTP | Crítica | Cap carpeta del mirall, ni xifrat; xats d'IA; kits | L'exportador no l'obri. Llig només `SDP_WORKSPACE_MIRROR_DIR` i `SDP_WORKSPACE_AGE_RECIPIENT` de l'entorn. En restaurar, tot es torna a emetre |
| **Clau Ed25519 de l'actor**: la viva és `~/socdepoble-node0/dades/node0_ed25519.json` (PKCS8 en clar); l'alternativa és `~/.config/socdepoble/node0_ed25519.json` | Crítica | 01–04; qualsevol fitxer en clar | Només a 05, com a `*.age`. El restaurador comprova l'empremta `f6f561a5…1e11` i no en genera mai cap de nova |
| **`~/.cloudflared/`**: `config.yml`, `<UUID>.json` del túnel, `cert.pem` probable, còpies `.backup` | Crítica | Enlloc, tampoc a 05 | Fora de la llista blanca. En restaurar es crea un túnel nou i es revoca l'antic |
| **Identitat privada `age`** | Crítica | Al Mac, a Drive, al MacBook d'operació | En paper o clau física, en dos llocs fora de casa |
| **PGDATA** `dades/postgres17` i el sòcol `dades/run/` | Alta | Drive en calent; qualsevol còpia binària | `dades/` queda sencer fora de les fonts; només es fa `pg_dump` en flux |
| **Taules privades**: `private.xat_push_credencials`, `private.autoritzacions_apple`, `private.ajustos`, les còpies E2EE del xat, `inbox`/`followers`/`outbox`. Les taules d'autenticació R4/R5 només són al laboratori `node0_gauntlet_r4` | Alta | 01–03; qualsevol dump en clar | Un sol dump, de `socdepoble_node0` i xifrat. Abans es comprova que les tres `private.*` estan buides |
| **Sessions de Google Drive** del Mac mini: dues arrels de comptes personals | Alta | Com a destí del mirall | Validació de l'arrel institucional exacta (`socdepoble@socdepoble.org`, segons l'ordre del Mestre) |
| **Registres i rebuts**: `postgres17.stderr.log`, `~/.config/socdepoble/*.log`, Caddy, `*-receipt.json`, `.r5-lab`, `.r6-lab`, `/tmp/sdp-node0-*` | Mitjana | Mirall | Llista blanca. El codi es referencia pel SHA del commit o del kit |
| **Caddy**: `Caddyfile.node0`, autosave, API `127.0.0.1:2019` | Mitjana (Alta quan hi haja autenticació) | Mirall | Exclusió de `~/.config/socdepoble` i dels directoris de Caddy |
| **Fotos amb EXIF/GPS**; avatars i capçaleres de persones | Mitjana | 02 sense consentiment | El GPS es lleva per defecte; cap avatar de persona |
| **Fora del Node 0**: `~/.codex/…` (0644) i la transcripció de Claude d'esta sessió; kit r21 `src/utils/mirallWorkspaceResiliencia.js:77` (`KNOWN_PRODUCTION_SECRET_PREFIX`); `~/.ssh/id_ed25519_macmini`; PAT de GitHub a `.agents/runtime/antigravity-hook.log`; `DEEPL_API_KEY` a `.env` (0644); contrasenyes d'Android a `.env.botigues.local`, amb còpies a `/tmp` | Crítica | Git, el paquet públic, el Time Machine del MacBook | Rotar, purgar i `chmod 600`. L'escàner només fa servir canaris `TEST_ONLY` |

#### 2. Requisits obligatoris per a l'exportador de Codex

Els he contrastat amb el laboratori de Codex `/tmp/sdp-codex-node0-mastodon/.r6-lab/mirror/exporta-mirall-workspace-node0.mjs`, en la versió de les 20:49Z, que encara està canviant.

**El que el laboratori ja fa bé:**

- `pg_dump` passa per flux a `age` sense deixar cap byte en clar al disc.
- El destinatari es valida amb Bech32.
- Hi ha un rebut privat fora del mirall que no porta rutes.

**El que encara no complix:** R-4, R-5, R-9 i R-13.

1. **R-1 · Llista blanca i denegació per defecte.** Les fonts són tancades. Si una font cau sota `dades/`, `~/.config/socdepoble`, `~/.cloudflared`, `~/.ssh`, `~/Library` o un directori de registres, s'avorta tota l'execució.
2. **R-2 · `node0.env` no s'obri mai.** Res que es puga tornar a emetre es copia, ni xifrat: administració, OAuth, túnel, proxy, quota i SMTP.
3. **R-3 · 01–03 només des de dades públiques.**
   - Font: `visibility='public'` o GET públics.
   - Camps d'eixida tancats i noms de fitxer per `id` o slug.
   - Cada execució reflectix el que s'ha esborrat.
   - 03 copia el ZIP fixat, validat amb `llegeixZipNodeZero` i el SHA esperat.
4. **R-4 · `pg_dump` d'una sola base.**
   - `--dbname=socdepoble_node0` fixat al codi; es rebutja `node0_gauntlet_r4`. **El laboratori encara l'accepta (línia 89).**
   - Mai `pg_dumpall` ni `--globals`.
   - `peer` pel sòcol, `PGPASSFILE=/dev/null` i cap contrasenya nova.
   - Tot el que porte `private`, `auth`, xat o federació va xifrat.
5. **R-5 · Destinatari fora de línia obligatori.**
   - Sense eixe destinatari, no s'escriu cap fitxer a 04.
   - Un destinatari local només si el Mestre ho decidix, i exclòs del Time Machine. **El laboratori només accepta un `--recipient`.**
   - La prova de restauració es fa sobre el flux en clar (`tee` cap a `pg_restore --list`), així no cal cap clau local.
6. **R-6 · La clau Ed25519 només va a 05, en `*.age`.** Els manifests del mirall se signen amb una clau dedicada, mai amb la de l'actor.
7. **R-7 · Cap symlink ni hardlink.** `lstat` a cada component i `nlink===1`, amb `camiSegur` i `fitxerRegular` del kit R3. A 02 només entren fitxers amb SHA del manifest signat.
8. **R-8 · Destí validat.** Ruta absoluta sota exactament `~/Library/CloudStorage/GoogleDrive-<compte institucional fixat>/`; mai les dues arrels personals; ni pare ni fill de HOME, `dades/`, `~/.config` o `~/.cloudflared`.
9. **R-9 · Atomicitat fora de l'arbre sincronitzat.**
   - El muntatge es fa a `~/socdepoble-node0/mirall-workspace/`, en el mateix `st_dev` que el destí.
   - `fsync`, `rename` del directori sencer i, a l'últim, el punter `LATEST`.
   - Amb `EXDEV`, falla en tancat, sense copiar.
   - **Al laboratori, `generacions/`, `CURRENT.json` i el lock encara són dins del mirall.**
10. **R-10 · `SHA256SUMS` signat.**
    - L'empremta pública de la clau del mirall es guarda fora de Drive.
    - Les sumes són del text xifrat, mai del clar.
    - La integritat es llig del rebut privat, mai d'un fitxer del mirall, perquè Drive sincronitza en tots dos sentits.
11. **R-11 · EXIF/GPS netejat.** El GPS només es conserva amb un consentiment explícit registrat al manifest.
12. **R-12 · Escàner de secrets com a segona barrera.**
    - També mira dins de ZIP i gzip.
    - Patrons: `PRIVATE KEY`, el prefix DER PKCS8 Ed25519, `^(SDP_|MASTODON_|SMTP_|PG)[A-Z_]*=`, `TunnelSecret`/`AccountTag`, `AGE-SECRET-KEY-1`, `sb_secret_`, JWT `service_role` i `Bearer `.
    - Un positiu avorta la generació sencera.
    - **El codi de l'escàner no porta cap fragment de cap secret real.**
13. **R-13 · Retenció màxima de 30 dies.** Es purguen les generacions fallides i hi ha un procediment per a les versions i la paperera de Drive. **El laboratori no en té.**
14. **R-14 · Drive privat.** L'arrel no es comparteix. 04 i 05 van en un arbre a banda, restringit al Mestre, sense compartició externa.
15. **R-15 · Bloc `resilience` sense rutes.**
    - Només booleans, instants ISO, comptadors i codis d'una llista tancada.
    - Cap valor conté `/`, `@`, `Users`, `CloudStorage`, `GoogleDrive`, `Volumes` ni `age1`.
    - `mirrorIntegrityOk` vol dir «verificat localment». `uploadConfirmed` és `null` mentre no hi haja prova de la pujada.
    - Contracte versionat `sdp.node0.resilience.v1`, compartit amb Gemini. Ara el dimoni envia `localTimeMachine` com a objecte i la UI espera un booleà.
16. **R-16 · Llindar d'espai lliure.** Si no hi ha prou espai, l'exportador s'atura i publica `disk_low`.

#### 3. Proves d'acceptació que passaré al kit

- **P-1 · Grep sobre el mirall generat.** Patrons de R-12 i valors canari, també dins de ZIP i gzip: 0 coincidències. Sobre els 32 documents públics reals: 0 falsos positius (el `key=in.(…)` de `provenance.sourceUrl` és un filtre, no una clau).
- **P-2 · HOME trampa.**
  - Conté `node0.env` canari, dues claus Ed25519 canàries (a `dades/` i a `~/.config`), `<uuid>.json` i `cert.pem` canaris, registres canaris, un `.env` i un Caddyfile amb un secret canari, un symlink i un hardlink de `media/` cap a la clau, un JPEG amb GPS i un `CURRENT.json` hostil.
  - Resultat esperat:
    - cap canari a l'eixida;
    - els enllaços fan eixir amb un codi diferent de 0 i el destí queda intacte;
    - un espia de `fs.open` mostra que `node0.env` no s'obri mai.
- **P-3 · Runner injectat de `pg_dump`.**
  - L'argv és exacte i `node0_gauntlet_r4` dona error.
  - Sense `age` o sense el destinatari fora de línia, 04 queda buit.
  - El blob comença per `age-encryption.org/v1` i no conté cap canari.
- **P-4 · Restauració en una base temporal.**
  - Es desxifra amb la identitat de prova «fora de línia», sense cap identitat local.
  - `pg_restore --exit-on-error --single-transaction` i comparació de migracions, recomptes i hashes per taula.
  - Després de restaurar, 0 sessions actives i els tombstones tornats a aplicar; al final, `dropdb`.
  - Amb una clau d'empremta diferent, el restaurador avorta sense crear cap clau.
- **P-5 · Atomicitat.** Fallada injectada després de N bytes, `SIGKILL` entre fases i `EXDEV` simulat: res visible a l'arrel sincronitzada i `LATEST` no es mou.
- **P-6 · Destins erronis.** `$HOME`, `~/socdepoble-node0`, un symlink cap a Drive, l'arrel d'un altre compte, `/Volumes/…` i una ruta relativa donen tots un codi diferent de 0.
- **P-7 · Contracte del status.** La resposta viva de les 20:26:43Z, desada com a fixture, passa pel normalitzador de Gemini; amb `latestBackupFound:null` no dona «Actiu».
- **P-8 · Retenció i porta CI.** Amb el rellotge a +31 dies, la generació es purga. La porta CI no troba cap literal de 8 caràcters o més dins de patrons `KNOWN_PRODUCTION*`, ni en els kits ni en `dist`.

#### 4. Failover

**Què continua** (verificat a les 20:12Z): `socdepoble.org` (Firebase Hosting més Supabase: autenticació, xat, mur, mercat i agenda), el paquet Open Data de `.org`, el connector de `gentdelatorre.net` i `@depoble@mastodont.cat`. Cap d'estes coses continua gràcies al mirall: el mirall és un arxiu, no un origen web.

**Què cau:** tot `socdepoble.cat` (Cloudflare respon 530/1033), `/api/v1/node0/*`, WebFinger, l'actor, NodeInfo i la bústia, la safata POSSE, i el panell de Gemini, que passa a «sense resposta» i no pot inventar cap data.

**Dependències de `.org` cap a `.cat` que cal arreglar:**

- **Vídeo de pedra en sec** (`src/sections/mur/eventsSeed.js:53`): apareix al bundle desplegat i en quatre trossos del connector, i els seus 20.588.651 B només existixen al Mac. Cal una còpia verificada per SHA a Firebase Hosting o a l'Storage públic de Supabase, i dos `<source>`.
- **Enllaços «node pilot operatiu»** a `pageContent.js`, `iaiaLocal.js` i `wikiManifest.js`.
- **Build de Firebase:** una porta que impedisca compilar-lo amb `VITE_SDP_NODE0_HTTP=1`.
- **`readme.txt` del connector:** ha de declarar `socdepoble.cat` i Cloudflare.

**Frases que s'han de retirar:** del pla, «el 100 %», «reprén automàticament (KeepAlive + RunAtLoad)» i «ni es perd mai cap dada»; de la UI de Gemini, «sense caure», «es recupera sol», «còpia contínua» i «Verificat (SHA-256 OK)». Motius:

- els cinc serveis són **LaunchAgents de la sessió gràfica**, i el rebut mateix de Codex diu que no hi ha arrencada abans de l'inici de sessió;
- l'RPO és l'interval entre instantànies;
- el `pg_dump` del Node 0 no copia el Supabase.

**Quan torna la llum:**

- el dimoni ha d'esperar PostgreSQL en lloc d'eixir;
- l'outbox ha de passar a un retrocés exponencial, amb un estat `exhausted` (ara són 8 intents cada 5 minuts);
- el servidor estàtic ha de respondre **503 amb `Retry-After`** a `POST /ap/inbox`, perquè Mastodon tracta el **501 com a definitiu**.

**Recomanacions físiques:**

- **SAI** line-interactive d'ona sinusoidal, de 600 a 1.000 VA, per al Mac, l'ONT, el router i el disc de Time Machine, amb connexió USB HID i `sudo pmset -u haltlevel 20 haltremain 10`.
- **Encesa automàtica:** `sudo pmset -a autorestart 1 sleep 0 disksleep 0 standby 0`. Cal provar-la després d'un apagat fet pel SAI.
- **Arrencada sense sessió gràfica:** o la cadena passa a `/Library/LaunchDaemons` amb `UserName=javi`, o s'accepta l'inici de sessió automàtic sense FileVault (vegeu D-11.2).
- **PostgreSQL:** fixar `wal_sync_method` segons el que done `pg_test_fsync` [ESPECULATIU: cal verificar-ho al Mac mini].
- **Time Machine:** destinació xifrada. No compta com a còpia fora de casa.
- **Sincronització de Drive:** tampoc és la còpia immutable del 3-2-1, perquè el Node 0 la pot esborrar.
- **Simulacre:** desendollar el Mac 60 s i, sense tocar el teclat, cronometrar fins que `/api/v1/node0/status` torne 200. Objectiu: menys de 5 minuts.

#### 5. Decisions d'AH-11 per al Mestre

1. **D-11.1 · Rotar ara les credencials exposades:** el testimoni d'accés i el secret de client de `@depoble` a mastodont.cat, i el PAT de GitHub. **Bloquege el kit r21 de Gemini** fins que l'escàner funcione només amb canaris.
2. **D-11.2 · Arrencada desatesa.** (a) sense FileVault, amb inici de sessió automàtic i bloqueig de pantalla; (b) LaunchDaemons, que requerixen el vostre `sudo`; o (c) mantindre FileVault i desbloquejar a mà.
3. **D-11.3 · Identitat `age`.** La de recuperació, en paper o clau física, en dos llocs fora de casa. Si voleu també una de local, ha d'estar exclosa del Time Machine.
4. **D-11.4 · Drive.** Iniciar `socdepoble@socdepoble.org` al Mac mini i retirar-ne els comptes personals; 04 i 05 en un arbre a banda; una segona còpia que el Node 0 no puga esborrar.
5. **D-11.5 · `/legal`.** Una nova versió que nomene Google (Firebase i Drive) i Cloudflare com a encarregats, que reculla l'acord de tractament (CDPA) i la regió de les dades, que incloga el tractament al registre de l'art. 30 i que fixe la retenció de 30 dies.
6. **D-11.6 · Vídeo.** Triar l'origen secundari i l'ordre dels `<source>`.
7. **D-11.7 · SMTP.** Una identitat d'enviament separada del titular del Drive.
8. **D-11.8 · Accés total al disc per a Time Machine.** Concedir-lo al binari `node`, o fer la lectura amb un agent separat que escriga un rebut.
9. **D-11.9 · Dades privades de Supabase.** Queden fora d'AH-11: copiar-les requeriria un secret privilegiat al Mac.

**Límits:** sense SSH, no he vist `node0.env`, `~/.cloudflared`, FileVault, `pmset`, `wal_sync_method` ni el contingut dels registres. El comportament de Google Drive (versions, paperera, renoms de File Provider i rols de les unitats compartides) cal comprovar-lo en la documentació actual [ESPECULATIU]. El laboratori de Codex ha canviat a les 20:49Z, després de la revisió adversarial.

### AH-10 · Síntesi Mestra i Pla d'Implementació per Fases

**Carril 3 · Claude · 2026-11-04, 20:30–22:46 CET.** Comparació doctoral de Mastodon i Sóc de Poble en 10 eixos, unificada amb les propostes de Codex i de Gemini (`261104_1636_auditoria_codex.md` i `261104_1636_auditoria_gemini.md`), prioritzada per impacte i amb un pla executable. Fitxers de suport a `_investigacio_ia_de_poble/261104_claude_1636_arbitratge/`: `ah10_sintesi_mestra.md` (este text), `lectura_creuada.md` (lectura de Codex i Gemini, 14 afirmacions contrastades amb Mastodon v4.7.5) i `SHA256SUMS`.

#### 1 · Entradeta

**Versió estudiada:** Mastodon **v4.7.5**, commit `24cd1c875a1ac393e587421726394d5692ff5496` (2026-11-03), comprovat amb l'API de GitHub. Quan un investigador va llegir `main` (`ca2f092f`, 5.0.0-beta.1) i el verificador no en va confirmar la igualtat, la ruta porta «(main)».

**Mètode:** 10 investigadors de Claude, un per eix, i 10 verificadors adversarials. Ací s'apliquen totes les seues correccions i no es repetix cap afirmació refutada. Hi afegim la lectura creuada de Codex i Gemini, i la comprovació del WebFinger i del DNS de correu públics (22:13 CET).

**Idea clau:** de Mastodon cal copiar la **disciplina de servidor** (dades en columnes i taules, verificació al servidor i idempotència durable), però no els valors oberts per defecte ni els secrets en clar. La primera feina no és afegir funcions, sinó **fer veritat el que el Mas ja promet**: retirar de veres, textos honestos i una sola identitat federada.

#### 2 · Taula mestra dels 10 eixos

| Eix | Mastodon v4.7.5 | Sóc de Poble avui | Decisió | Impacte | Esforç | Fase | Codex · Gemini |
|---|---|---|---|---|---|---|---|
| 1 Perfil | 4 camps `fields`, `rel=me` comprovat al servidor, alt ≤150 | Cap camp clau-valor ni `rel=me`; alt automàtic | Adaptar | 4 | L | 2 | sí · parcial |
| 2 Privacitat i abast | 4 visibilitats per publicació, adreçament to/cc | Abast implícit per taula; retirar només amaga al dispositiu | Adaptar | 5 | L | 1→2 | sí · parcial |
| 3 Preferències | `users.settings` validat en Ruby; ALT amb avís no bloquejant | Tot a l'aparell (Model B); ALT = nom del fitxer | Adaptar (local primer) | 4 | M | 1→3 | sí · no |
| 4 Graf social | Llistes, apunts, silencis amb caducitat, bloqueig al servidor | Seguiments sense llistes; el contingut bloquejat només l'amaga el client | Millorar | 4 | L | 2→3 | sí · parcial |
| 5 Filtres | `warn`/`hide`/`blur` per context; streaming amb `\b` ASCII | Cap filtre; tres plegats d'accents divergents | Adaptar | 3 | L | 3 | sí · parcial |
| 6 Retenció | Neteja opt-in per edat; conserva les denunciades | Fitxes amb data no caduquen; esborrar no esborra | Adaptar | 4 | L | 1→2 | sí · parcial |
| 7 Compte | Sessions revocables, TOTP, `Move` + `alsoKnownAs` | Doble clau només superadmin; motor `Move` incompatible | Adaptar | 4 | L | 1→2→4 | sí · no |
| 8 Import/export i POSSE | ZIP complet, importació en dos temps, Idempotency-Key d'1 h | JSON RGPD honest; pont R5 sense ledger durable | Millorar | 4 | XL | 1→2→3 | sí · parcial |
| 9 Invitacions | Codi de ~46 bits en clar; bypass per rol | Cap invitació; entrada autoservida a qualsevol poble obert | Adaptar | 4 | L | 2 | sí · no |
| 10 Apps i ponts | Doorkeeper, testimonis en clar sense caducitat | No som proveïdor OAuth; un sol secret d'operador al Node 0 | Millorar | 3 | L (XL amb OAuth) | 1→3→4 | sí · parcial |

#### 3 · Els 10 eixos

##### Eix 1 · Perfil i identitat verificada

- **Mastodon** (`app/models/account.rb`, `app/models/account/field.rb`, `app/services/verify_link_service.rb`@v4.7.5):
  - 4 camps locals de 255 caràcters, amb els límits publicats a l'API d'instància.
  - `VerifyLinkService` llig l'HTML cru **sense JavaScript**: el GET segueix fins a 3 redireccions i el cos es talla a 1 MB.
  - La insígnia diu «Ownership of this link was checked on {date}».
  - L'editor nou (`/profile/edit`) accepta descripcions de fins a 150 caràcters.
- **Tenim:**
  - cap camp clau-valor ni cap `rel="me"` a `src/`;
  - alt automàtic (`PerfilEditor.jsx:103-104`);
  - `is_public` val true per defecte, per ordre del Mestre (`2610181800:52`);
  - `perfil_public` torna dates exactes i no mira els bloquejos (`2610282100:984-1034`);
  - el text legal vigent promet uns «membres verificats» que no existixen (`legalContent.js:147`; també la 2.4, encara no aplicada, a `2611030330:168`).
- **Proposta:**
  - **[Claude]** text alternatiu de fins a 150 caràcters per a l'avatar, la capçalera i el logotip.
  - **[Codex + Claude]** dades de la fitxa en una taula a banda; el client no pot escriure la verificació, i un compare-and-set de (id, valor) l'anul·la quan el valor canvia.
  - **[Gemini]** emetre `rel=me`, però només en HTML estàtic i anònim.
  - Límit configurable pel node: 4 dades per persona i 8 per entitat.
  - Verificador només al dimoni del Node 0, que fixa la IP al socket (una Edge Function no pot). És la recomanació; ho decidix el Mestre.
- **Correccions aplicades:**
  - l'enllaç de tornada passa per `rutaDePerfil`, perquè els grups, la IA i les fitxes fundacionals tenen rutes pròpies;
  - hi ha quatre còpies de `CAMPS_PERFIL`, i una prova en vigila la paritat;
  - la «veïna verificada» va en una migració a banda: `authenticated` té SELECT de taula a `town_memberships` (`2609080000:747`), i la guarda faria avortar tot el lot;
  - el hotlink de fotos només queda a la capçalera de la fitxa. El Mur ja és estricte al client (`TargetaDelMur.jsx:285`), i el disparador `2610072230` hi afig la guarda de servidor (estat remot no acreditat).

```sql
create table private.camps_fitxa (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references public.profiles(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  etiqueta text not null check (char_length(btrim(etiqueta)) between 1 and 60),
  valor text not null default '' check (char_length(valor) <= 255),
  visibilitat text not null default 'poble' check (visibilitat in ('publica','poble','privada')),
  verificat_at timestamptz,
  check (num_nonnulls(persona_id, org_id) = 1));
alter table private.camps_fitxa enable row level security;
revoke all on private.camps_fitxa from public, anon, authenticated, service_role;
```

- **Risc principal:** SSRF en el verificador, i la promesa legal de verificar que avui no es complix.

##### Eix 2 · Privacitat, abast i descobribilitat

- **Mastodon** (main: `app/models/concerns/status/visibility.rb`, `app/lib/activitypub/tag_manager.rb`):
  - 4 opcions per publicació, inclosa `direct`;
  - la visibilitat és immutable i l'adreçament to/cc és explícit;
  - l'acollida deixa els comptes nous descobribles i indexats: «cercadors per defecte NO» és una tria del Mas.
- **Tenim:**
  - publicar una nota crea una altra fila a `section_submissions` i marca `is_published` a la nota;
  - les fotos del Mur van al cubell públic `mitjans`, i per això el Mur no equival a `local_only`;
  - la migració 2611032100, amb el forat SQL-01, ja corre al Node 0 malgrat D-10, però no a Supabase. Hi ha un pegat (`fixes/sql-2611032100.patch`), i al Node 0 la correcció haurà d'entrar com a migració nova.
- **Proposta:**
  - **[Claude]** abast en una columna tancada, amb guarda «només reduir»; retirada real a la Fase 1.
  - **[Codex]** quatre preguntes separades a la interfície. Cap audiència es pot oferir si el servidor no la fa complir.
  - **[Gemini]** el selector federat entra només quan el servidor el faça complir.
  - **[Claude]** reserva TDM també dins del component i del connector.
- **Correccions aplicades:**
  - la retirada ha de desmarcar la nota;
  - el `Delete` federat s'encua amb un disparador, perquè PATCH i DELETE per PostgREST se salten les RPC;
  - revocar el SELECT d'anon trencaria el Mur sense sessió;
  - la columna no es diu `abast`, que ja té un altre sentit a `abastConnexio.js`;
  - FEDI-26 Regla 2 és una ordre directa del Mestre: posar les connexions privades per defecte seria revocar-la.

```sql
alter table public.section_submissions
  add column if not exists abast_publicacio text not null default 'poble'
    check (abast_publicacio in ('poble','internet_discret','internet')),
  add column if not exists retirada_al timestamptz;
-- BEFORE: només reduir; AFTER UPDATE/DELETE: encua el Delete
```

- **Risc principal:** ampliar l'abast per PostgREST, i les còpies federades que un `Delete` no recull.

##### Eix 3 · Preferències, idiomes i accessibilitat

- **Mastodon** (`app/models/user_settings.rb` i `app/models/media_attachment.rb`@v4.7.5):
  - les preferències es validen en Ruby, però la capa `web_settings` (main) no es valida;
  - `MAX_DESCRIPTION_LENGTH` és de 10.000 caràcters (1.500 fins a la 4.5);
  - l'avís d'ALT no bloqueja la publicació.
- **Tenim:**
  - tot es desa a l'aparell: Model B i, per al contrast, la decisió D6/Q1 (`theme.js:54-57`);
  - l'ALT és el nom del fitxer (`richText/extensions/index.js:377`);
  - el generador federat fixa la llengua `'ca'` (`genera-federacio.mjs:148`);
  - l'inbox mostra el text que amaga l'avís de contingut (`inboxActivityPub.js:469`).
- **Proposta:**
  - **[Claude]** Fase 1 sense servidor:
    - ALT buit en lloc del nom del fitxer;
    - camp «Descriu la foto» (fins a 1.500 caràcters, per compatibilitat amb els servidors fins a la 4.5) i un avís que no bloqueja;
    - interruptors locals per a reduir el moviment i per a lliscar.
  - **[Codex]** dues pantalles, «Aparença en este dispositiu» i «Lectura i publicació del meu compte», sense desar al servidor ni el tema ni el Bancal.
  - **[Codex]** cap «AAA» sense mesura (Gemini l'anunciava com a «AAA Rural»). El text del cos passa de 9:1, però els accents van de 7 a 8:1.
- **Correccions aplicades:**
  - de PostgreSQL 15 a 17 (el Node 0 és la 17), passar un null de JSON a booleà fa fallar la consulta;
  - `consentiments.tipus` no admet cap finalitat nova;
  - el tema per defecte és `light`, i l'atribut de l'amfitrió hi mana;
  - l'ALT del xat xifrat ha d'anar dins del cos xifrat.

```sql
create table private.preferencies_persona (   -- només si el Mestre revoca D6/Q1
  usuari_id uuid primary key references auth.users(id) on delete cascade,
  versio integer not null default 1,
  valors jsonb not null default '{}'           -- només les claus triades
    check (jsonb_typeof(valors) = 'object' and octet_length(valors::text) <= 2048));
alter table private.preferencies_persona enable row level security;
revoke all on private.preferencies_persona from public, anon, authenticated, service_role;
```

- **Risc principal:** que les preferències revelen dades de salut per inferència (art. 9), i la còpia que queda en un ordinador compartit.

##### Eix 4 · Graf social, llistes i apunts

- **Mastodon** (`app/models/list.rb`, `app/models/account_note.rb`, `app/services/block_service.rb` i `app/services/mute_service.rb`@v4.7.5):
  - com a molt 50 llistes;
  - un apunt de fins a 2.000 caràcters per parella, que no entra a l'exportació;
  - silencis amb caducitat;
  - el bloqueig trenca els seguiments i es federa.
- **Tenim:**
  - `public.seguiments` (`2610241430`) sense acceptació;
  - el contingut de qui has bloquejat només l'amaga el client (`2610201500:52-53`); al servidor, el bloqueig només actua en els seguiments, en els destinataris del push i en `titular_public`;
  - silenci només per conversa;
  - per FEDI-26, connectar amb una persona ja no crea cap nota.
- **Proposta:**
  - **[Claude]** bloqueig ferm al servidor, sense que l'altra persona se n'adone;
  - **[Claude]** silencis de persona o d'entitat amb `DURADES_SILENCI`;
  - **[Claude]** apunts privats dins de l'exportació, i colles per data, sense algoritme;
  - **[Codex]** les colles són plantilles explicades, mai llistes creades sense que el veí les trie; cal portar primer les RPC al Node 0;
  - **[Gemini]** «Conversar al Fedivers», a través de la memòria cau del Node 0.
- **Correccions aplicades:**
  - el bloqueig ha de cobrir `xat_historial`, `xat_nous`, `xat_llig_fil_de_pagina`, el SELECT de `xat_missatges` i les escriptures xifrades;
  - no ha d'amagar el que la persona bloquejada signa com a entitat (`moderacio.js:88-92`);
  - el kit de conformitat no té `duesSessions`;
  - l'avís de publicacions noves trenca `2610241430:94-97`.

```sql
create table private.silencis (
  silenciador uuid not null references auth.users(id) on delete cascade,
  persona uuid references auth.users(id) on delete cascade,
  entitat uuid references public.organizations(id) on delete cascade,
  amaga_avisos boolean not null default true, fins_al timestamptz not null,
  check (num_nonnulls(persona, entitat) = 1));
alter table private.silencis enable row level security;
revoke all on private.silencis from public, anon, authenticated, service_role;
```

- **Risc principal:** que el bloqueig es delate pels rebuts o pels codis d'error, i que revele qui opera una entitat.

##### Eix 5 · Filtres per context

- **Mastodon** (`app/models/custom_filter.rb`@v4.7.5:38, amb `warn`, `hide` i `blur`; `streaming/index.js`):
  - el servidor marca `filtered` i el client tria per context;
  - el streaming només torna a filtrar els canals públics i d'etiquetes, amb `\b` ASCII: «cafè» casa «cafèteria» (reproduït);
  - `blur` hi ix sense valor (:815);
  - no hi ha límit de filtres ni purga dels caducats.
- **Tenim:**
  - cap filtre;
  - els bloquejos els amaga el client (`MurContext.jsx:114-118`);
  - tres maneres diferents de plegar els accents.
- **Proposta:**
  - **[Claude]** «Paraules que no vull vore»: les dades al Supabase i una sola funció pura que les avalua al dispositiu. Contexts: mur, mercat, agenda, xat i fitxa.
  - **[Codex]** tres accions; caducitat amb el rellotge del servidor; el xat xifrat, només al dispositiu.
  - Els avisos oficials no s'amaguen mai del tot.
  - Plegat asimètric: si la paraula del filtre porta accent, es respecta («més» no tapa «mes»).
- **Correccions aplicades** (verificació a part de l'eix 5):
  - el proveïdor només marca; cada superfície decidix amb el seu context;
  - el text avaluat inclou `content`, netejat amb escàners lineals;
  - `isAvis` no existix;
  - el cost és O(n·p).

```sql
create table public.filtres_contingut (
  id uuid primary key default gen_random_uuid(),
  persona uuid not null references auth.users(id) on delete cascade,
  titol text not null check (char_length(btrim(titol)) between 1 and 120),
  contexts text[] not null check (contexts <@ array['mur','mercat','agenda','xat','fitxa']),
  accio text not null default 'avisa' check (accio in ('avisa','amaga','tapa')),
  caduca_al timestamptz);
alter table public.filtres_contingut enable row level security;
create policy filtres_propis on public.filtres_contingut for select to authenticated
  using (persona = (select auth.uid()));
```

- **Risc principal:** el motor R22 de Gemini talla «col·legi» i només té dues accions. Cal un sol contracte.

##### Eix 6 · Retenció i «Endreça» (oblit saludable)

- **Mastodon** (`app/models/account_statuses_cleanup_policy.rb` i `app/services/remove_status_service.rb`@v4.7.5):
  - neteja opt-in per edat, amb un pressupost de 300;
  - només esborra;
  - una publicació denunciada es conserva amagada, també quan l'esborra a mà la persona que l'ha escrita;
  - les làpides són permanents.
- **Tenim:**
  - «esborrar» només amaga la publicació al mateix aparell;
  - l'**ordre del Mestre 261103** (esborrar-la de tots els llocs) continua sense complir-se;
  - les fitxes amb data no caduquen;
  - les denúncies no en guarden còpia (`2610201500:54`).
- **Proposta:**
  - **[Claude]** retirada real a la Fase 1; `tanca_al` calculat pel servidor; tancar abans que esborrar.
  - **[Codex]** preservar amb una clau forana i l'actor que ho autoritza, i començar en mode `archive`.
  - **[Gemini]** blindar per autoria de tres entitats: es rebutja, perquè trenca la simetria.
- **Correccions aplicades:**
  - `canviaEstatPublicacio` no té cap cridador, i cal una RPC de pròrroga;
  - és un problema de transparència (art. 5.1.a), no un P0 de l'art. 17;
  - l'excepció de les fotos ha de cobrir `image_url`, `src` i `variations[]`;
  - el disparador no pot purgar l'avatar.

```sql
create table private.preservacions (
  publicacio uuid primary key references public.section_submissions(id) on delete restrict, -- la retirada l'amaga, no l'esborra
  motiu text not null check (motiu in ('denuncia_pendent','patrimoni_cedit')),
  autoritzat_per uuid references auth.users(id) on delete set null);
alter table private.preservacions enable row level security;
revoke all on private.preservacions from public, anon, authenticated, service_role;
```

- **Risc principal:** destruir l'evidència d'una denúncia.

##### Eix 7 · Seguretat del compte i portabilitat d'identitat

- **Mastodon** (`config/initializers/devise.rb`, `app/models/account_migration.rb` i `app/lib/activitypub/activity/move.rb`@v4.7.5):
  - una sessió revocada deixa de valdre a la petició següent;
  - en un `Move`, només el destí ha de tindre l'origen a `alsoKnownAs`;
  - el codi per correu respon a 90 dies d'inactivitat, no a la IP.
- **Tenim:**
  - `revoca()` no falla mai (`auth.js:1170-1185`);
  - la doble clau és només per al superadmin (`PerfilContext.jsx:216-219`);
  - `portabilitatFediversity.js:486-494` exigix una reciprocitat que Mastodon no demana;
  - hi ha textos que prometen recuperacions inexistents (`ca.js:17-22`).
- **Proposta:**
  - **[Claude]** Fase 1:
    - textos veraços;
    - tancar les altres sessions amb errors reals;
    - motor de `Move` alineat amb Mastodon.
  - **[Claude + Codex]** Fase 2:
    - llista de sessions i `sessio_viva()`;
    - push lligat a la sessió;
    - doble clau per a tothom, exigida també pel servidor.
  - **[Codex]** WebAuthn i àlies a la G5. Gemini no fa cap proposta concreta.
- **Correccions aplicades:**
  - el push, l'exportació federada i Shamir no funcionen avui;
  - obrir la doble clau no és una feina petita;
  - l'SQL depén de migracions no aplicades i s'ha de protegir amb `to_regclass`.

```sql
create table private.registre_seguretat (
  id bigint generated always as identity primary key,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  tipus text not null check (tipus in ('sessio_tancada','altres_sessions_tancades','segon_factor_exigit')),
  conserva_fins timestamptz not null default now() + interval '90 days');
alter table private.registre_seguretat enable row level security;
revoke all on private.registre_seguretat from public, anon, authenticated, service_role;
```

- **Risc principal:** falsa seguretat: el botó diu «fet» sense haver tancat res.

##### Eix 8 · Importació, exportació i POSSE

- **Mastodon** (`app/services/backup_service.rb`, `app/models/bulk_import.rb` i `app/services/post_status_service.rb`@v4.7.5):
  - arxiu en **ZIP** (el `.tar.gz` de Gemini és fals);
  - importació en dos temps;
  - la `Idempotency-Key` només dura 3.600 s;
  - 300 estats cada 3 hores.
- **Tenim:**
  - `exporta_les_meues_dades`, honesta amb el que no inclou (les redefinicions de `2610311900` i `2611011800` encara no estan aplicades);
  - Open Data sense signatura;
  - `.sdp-export.json` promés i sense codi (`pageContent.js:797`);
  - cap importador de WordPress ni de Blogger;
  - el pont R5 no desa el resultat i provoca eco al Mur.
- **Proposta:**
  - **[Codex + Claude]** ledger POSSE (§6);
  - **[Codex]** `legacy_url_map` i dates separades;
  - **[Claude]** «Endur-te-les», i una importació que crida `segueix()` fila a fila;
  - **[Gemini]** reconciliador R24.
- **Correccions aplicades:**
  - `seguits.csv` no es pot resoldre des de Mastodon, perquè WebFinger només respon per a dues identitats;
  - `app_content` no té una fila per peça;
  - les peces d'entitat de `section_submissions` també es poden sindicar;
  - l'arxiu gran es fa en streaming.

```sql
create table public.urls_antigues (
  font text not null check (font in ('wordpress','blogger')),
  lloc text not null, id_extern text not null, url_antiga text not null,
  url_canonica text not null check (url_canonica like 'https://socdepoble.org/%'),
  revisada_al timestamptz, primary key (font, lloc, id_extern));
alter table public.urls_antigues enable row level security;
create policy urls_revisades on public.urls_antigues for select to anon, authenticated
  using (revisada_al is not null);
```

- **Risc principal:** tuts duplicats, i dades de tercers dins del fitxer WXR.

##### Eix 9 · Invitacions comunitàries

- **Mastodon** (`app/models/invite.rb` i `app/models/user.rb`@v4.7.5):
  - el codi és no criptogràfic (uns 45,9 bits) i es desa en clar;
  - l'increment d'usos no té cap condició;
  - el salt de l'aprovació depén del rol de qui convida;
  - l'API funciona com un oracle de tres estats.
- **Tenim:**
  - cap invitació;
  - `completa_la_meua_alta` deixa entrar a qualsevol poble obert (el contracte «Connexió Universal»);
  - `town_memberships.role='admin'` no s'assigna mai, i FEDI-04 prohibix deduir-ne autoritat.
- **Proposta:**
  - **[Claude]** `towns.mode_entrada`; codi generat amb CSPRNG i desat amb un **HMAC de clau de servidor**; resposta uniforme;
  - **[Codex]** consumir la invitació en la mateixa transacció que la pertinença, amb un UPDATE condicional; mai rol de superadmin;
  - **[Gemini]** «un sol clic», que no salta el consentiment, ni el correu, ni la doble clau.
- **Correccions aplicades:**
  - el salt de l'aprovació, només per a qui cuida el poble;
  - les entitats passen per `desa_membre_organitzacio` (`2610311500`);
  - el codi va després del `#` de l'adreça;
  - cal actualitzar la sentinella.

```sql
create table private.invitacions (
  id uuid primary key default gen_random_uuid(),
  town_id uuid not null references public.towns(id) on delete cascade,
  creada_per uuid not null references auth.users(id) on delete cascade,
  codi_hmac text not null unique,
  max_usos integer not null check (max_usos between 1 and 100),
  usos integer not null default 0 check (usos >= 0),
  caduca_al timestamptz not null, check (usos <= max_usos));
alter table private.invitacions enable row level security;
revoke all on private.invitacions from public, anon, authenticated, service_role;
```

- **Risc principal:** canviar el mode d'entrada desvia les altes en silenci.

##### Eix 10 · Aplicacions, testimonis, push i ganxos

- **Mastodon** (main: `config/initializers/doorkeeper.rb` i `app/workers/webhooks/delivery_worker.rb`):
  - els testimonis es guarden en clar i no caduquen;
  - PKCE S256, 47 abasts i `follow` obsolet;
  - els ganxos no porten id de lliurament i usen `allow_local: true`.
- **Tenim:**
  - el Mas no és proveïdor OAuth;
  - la Frontissa només fa GET;
  - el Node 0 té un sol `SDP_NODE0_ADMIN_TOKEN`, sense abast;
  - el «webhook pendent» de `jarvis.js` és IDEA-60.
- **Proposta:**
  - **[Codex/Claude]** testimonis d'operador amb hash, abast i caducitat (Fase 1);
  - **[Claude]** claus d'entitat i ganxos amb id i marca de temps (Fase 3);
  - **[Codex]** servidor OAuth amb refresc rotatiu (Fase 4).
- **Correccions aplicades:**
  - els abasts són vocabulari nou;
  - els secrets dels ganxos es xifren en repòs;
  - les RESTRICTIVE lliguen `author_org_id` a l'entitat de la clau;
  - el pont de WordPress xoca amb la decisió A1.

```sql
create table private.node0_testimonis_operador (
  id uuid primary key default gen_random_uuid(),
  hash text not null unique check (hash ~ '^[0-9a-f]{64}$'),
  abast text not null check (abast in ('node0:mastodon:sync','node0:mastodon:preparades','node0:ap:publish')),
  caduca_al timestamptz not null, revocat_al timestamptz);
alter table private.node0_testimonis_operador enable row level security;
revoke all on private.node0_testimonis_operador from public, anon, authenticated, service_role;
```

- **Risc principal:** saltar-se l'RLS per les RPC SECURITY DEFINER. Calen una porta a `tooling/gates` i una llista blanca.

#### 4 · Pla d'implementació per fases

**Regles per a totes les fases:**
- **Les migracions només les aplica el Mestre.** D-10: la 2611032100 no s'aplica a cap servidor fins que SQL-01 i l'omissió del bloqueig estiguen corregits; al Node 0 ja hi corre, i la correcció hi entra com a migració nova.
- Cada capacitat nova entra sencera al contracte, als dos adaptadors (Supabase i local), al kit de conformitat i, quan el Node 0 estiga integrat, al seu mapa d'operacions.
- Pedra Seca §9: primer l'espècimen.
- Lliurament per kit CAS, amb les portes de Codex.

##### Fase 1 · Veritat, retirada real i fonaments (executable ja, sense aplicar cap migració)

| # | Tasca (carril) | Depén de | Criteri d'acceptació |
|---|---|---|---|
| 1.1 | Capacitat `retiradaPublicacions: ['retiraPublicacio']`. A Supabase, un DELETE amb la RLS que ja hi ha (`2609080000:790-792`) i la nota desmarcada. A l'adaptador local, `contingutLocal.js`. Només per a peces pròpies sense entitat (Claude) | Decisió 9 | Kit verd als dos adaptadors; una altra sessió ja no la veu; el diàleg compleix l'ordre 261103 i diu que les fotos del cubell `mitjans` i les còpies federades encara no s'esborren; el text «encara no es pot retirar» (`visibilitatNota.js:210, 237`) canvia |
| 1.2 | Capacitat `tancamentSessions: ['tancaLesAltresSessions']`: errors 4xx i 5xx reals, sense botó per a les sessions de l'amfitrió i rebuig si el JWT no porta `session_id`. A l'adaptador local, NO-DISPONIBLE (Claude) | Cap | Un 401 simulat ix com a error; el botó no ix amb una sessió de l'amfitrió |
| 1.3 | Textos veraços a `ca.js:17-22` i `pageContent.js:797` (MarIA, amb la frontissa); esborrany de la política 2.5; kit r26 d'AH-13 corregit (Gemini) | Aprovació de la frontissa | Cap promesa sense codi: ni «BIP-39», ni «.sdp-export.json», ni «membres verificats» |
| 1.4 | ALT sense el nom del fitxer, «Descriu la foto» i un avís que no bloqueja; interruptors locals de moviment i de lliscar (Gemini fa l'espècimen; Claude, la lògica) | DesignSection | Cap `alt` és el nom d'un fitxer (sense descripció, `alt=""`); els interruptors, per defecte, no posen cap atribut a l'arrel (Llei del Píxel) |
| 1.5 | Motor `Move` compatible amb Mastodon, amb un id únic per trasllat (Claude) | Cap | Passen dos actors sintètics; dos trasllats tenen id diferents |
| 1.6 | `robots.txt` (GPTBot com a mínim), `tdmrep.json`, `X-Robots-Tag` i la meta dins del component i del connector (Claude; MarIA amb el vigilant) | Cap | `curl -I` ho mostra; `sdp-vigilant-tellado` verd |
| 1.7 | WebFinger amb un sol `self` a `.cat` (Codex) i al generador del `.org` (Claude) | Decisió 2 | Les consultes de §7 que responen tornen el mateix `self`; el `.org` amb `?resource=` continua en 404 a Firebase (no encamina per consulta) i Mastodon hi arriba per host-meta |
| 1.8 | DKIM i DMARC amb `rua` a `.org`; MX nul, SPF `-all` i DMARC `reject` a `.cat` (el Mestre al DNS, amb la llista de MarIA) | Accés al DNS | `dig +tcp` ho mostra; un correu de prova dona `dkim=pass` i `dmarc=pass` |
| 1.9 | Node 0 LAB: testimonis d'operador amb abast; safata POSSE **només de lectura**, i el POST continua en 503 (Codex) | Ordre de desplegament del Mestre | Una crida sense abast dona 403; cap secret als registres |
| 1.10 | Migracions preparades i no aplicades: SQL-01 unificat (a Supabase, el fitxer 2611032100 corregit; al Node 0, una migració correctora nova) i `sessio_id` dins de `2611020417` (Claude i Codex) | Les aplica el Mestre | PGlite verd; registrades a `ordre_desplegament.json` |
| 1.11 | Un sol contracte de filtres i de retenció; `configuraPontMastodonUsuari` sense cap testimoni al client (Claude, com a àrbitre, amb Gemini) | Cap | El kit r21 entra amb el contracte unificat |

##### Fase 2 · Base de servidor (migracions que aplica el Mestre)

| # | Tasca (carril) | Acceptació |
|---|---|---|
| 2.1 | G0: autoritat i sessió (Codex). Sense G0, ningú no pot prémer el botó POSSE | Proves amb dos usuaris i dos pobles |
| 2.2 | Sessions, `sessio_viva()`, registre de seguretat i doble clau exigida pel servidor, també per entitat (Claude + Codex) | Una sessió `aal1` robada no pot editar l'Ajuntament; la migració també passa al Node 0 (on `auth.sessions` només té `id` i `user_id`), i una sessió de l'amfitrió, sense `session_id` ni `aal`, conserva l'exportació i la baixa |
| 2.3 | Perfil: alt, imatges pròpies, `perfil_public` amb dates arredonides i bloquejos en dos sentits, i `camps_fitxa` (Claude) | Kit i PGlite verds |
| 2.4 | Abast de la publicació, retirada federada, `private.preservacions` i retirada de peces d'entitat (Claude) | Un PATCH directe no pot ampliar l'abast; la migració és pròpia i no depén de la 2611032100 (D-10) |
| 2.5 | Bloqueig ferm, silencis i apunts; seguiments i moderació al Node 0 (Claude i Codex) | Les dues sessions reben respostes idèntiques |
| 2.6 | Invitacions i mode d'entrada, després de les decisions 5 i 6 (Claude) | La sentinella continua verda |
| 2.7 | Endreça: `tanca_al`, pròrroga i purga del xat temporal (Claude) | Proves de dates amb PGlite |
| 2.8 | POSSE G3: ledger i safata amb conformitat lligada, publicant només després de 2.1 (Codex) | Cap duplicat en reintentar |
| 2.9 | Exportació a partir de `2611011800` i política 2.5 (Claude, amb el Mestre) | Totes les taules noves surten a l'exportació |

##### Fase 3 · Capacitats de poble

1. Filtres de contingut i, si el Mestre ho decidix, preferències de la persona.
2. Llengua de cada publicació i avisos de contingut a l'inbox (Claude); mesura AAA (Gemini).
3. Importadors de WordPress i Blogger, `urls_antigues`, el reconciliador R24 i l'històric amb conformitat (Codex, Gemini i Claude).
4. Un pont per a cada persona o entitat que el vulga, amb OAuth de Mastodon (Codex).
5. Claus d'entitat, API del Poble v1 i ganxos (Claude).
6. Arxiu personal en streaming i dades obertes signades (Codex).
7. Colles privades per data (eix 4): plantilles explicades que tria el veí, i filtre del Mur per una RPC amb POST, mai amb els membres a l'URL (Claude i Codex).

##### Fase 4 · Federació plena

1. Actors per persona, només si la persona ho tria, amb una ADR.
2. `Move` dels actors de poble, amb 30 dies d'espera i `aal2`.
3. Claus de pas (passkeys) i proveïdor OAuth 2.1 (G6).
4. Interoperabilitat remota verificada: `remoteInteropVerified:true`.

#### 5 · Seguretat RLS/PostgreSQL i RGPD transversal

1. **Taules noves a `private`.** Porten RLS activa, cap política i `revoke all` als quatre rols. Només s'hi arriba per RPC SECURITY DEFINER amb `set search_path = ''` i `(select auth.uid())`.
2. **Funcions dins de polítiques.** Una funció cridada des d'una política necessita EXECUTE per a `authenticated`; sense, el Mur cau.
3. **Columnes d'autoritat.** Un REVOKE de columna no lleva el privilegi de taula que dona Supabase: les protegix un disparador.
4. **Llei A.** Coacció amb `jsonb_typeof` i claus tancades. Un null de JSON passa per `CASE` abans del cast, que falla a PostgreSQL 17.
5. **Llei B.** Cap regex sobre dades d'usuari. S'usen escàners lineals, i la mida es talla abans d'analitzar.
6. **Respostes uniformes.** «No existix» i «no és teu» han de respondre igual. El comptador d'un límit no pot dependre d'una excepció que el desfaça.
7. **Secrets.** Els codis curts es desen amb HMAC i els testimonis, només com a hash. Els secrets de signatura van xifrats en repòs.
8. **SSRF.** Només `https` pel 443, amb la IP fixada al socket, cap xarxa privada, redireccions revalidades i límits de temps i de bytes.
9. **Dependències.** Les opcionals es comproven amb `to_regclass`. L'exportació es redefinix a partir de `2611011800`.
10. **Proves de cada migració.** PGlite, `*.seguretat.test.js` i registre a `ordre_desplegament.json`.
11. **Art. 25.** Les capacitats noves naixen restrictives. Les ordres que ja ha donat el Mestre només les pot canviar ell.
12. **Art. 9.** Preferències, filtres, apunts i pertinences poden revelar dades sensibles. Ni lector humà ni telemetria.
13. **Art. 15, 17 i 20.** Cada taula nova entra a l'exportació, a la baixa i a una purga per cron.
14. **Art. 13 i 17.2.** La política 2.5 ha de dir que esborrar una còpia al Fedivers és de millor esforç.
15. **Enxufabilitat.** L'amfitrió llig els atributs de la seua arrel i no rep les nostres capçaleres: la meta va dins del component.

#### 6 · AH-09 · POSSE amb simetria universal

**Regla d'or:** Sóc de Poble és l'origen i Mastodon, una rèplica. Mai s'envia res sense revisió. **Qualsevol persona o entitat** té el mateix pont, la mateixa safata i el mateix botó, sense tocar el codi.

| Peça | Què guarda | Regla |
|---|---|---|
| `private.ponts_posse` | Propietari (persona **o** entitat), actor remot, `secret_ref` i revisió de la política | Exactament un propietari. L'actor es verifica amb `verify_credentials` |
| `private.ponts_autors` | Autors vinculats i qui els ha autoritzat | `@depoble`: Sóc de Poble i El Rentonar. La Coordinadora, quan se'n tinga la procedència i l'autorització |
| Exclusions | Tipus d'origen exclosos | Mai entren a `@depoble` `marketItems` ni la secció o l'àmbit `mercat`. Tampoc es tria per heurística |
| `private.sindicacions` | Draft, hash, aprovació, `external_status_id` i `external_url` | Una sola per (pont, origen). `Idempotency-Key` = `sdp-posse-<id>` |

```sql
create table private.sindicacions (
  id uuid primary key default gen_random_uuid(),
  pont_id uuid not null references private.ponts_posse(id) on delete cascade,
  origen_tipus text not null, origen_id text not null,
  hash_esborrany text not null, revisio_politica integer not null,
  aprovat_per uuid references auth.users(id) on delete set null, aprovat_al timestamptz,
  external_status_id text, external_url text,
  estat text not null default 'preparada' check (estat in
    ('preparada','aprovada','publicant','publicada','indeterminada','fallida','retirada')),
  unique (pont_id, origen_tipus, origen_id));
alter table private.sindicacions enable row level security;
revoke all on private.sindicacions from public, anon, authenticated, service_role;
```

- **Safata de conformitat:**
  - `GET …/preparades` mostra el draft exacte: el text, el cartell amb alt, les etiquetes i l'enllaç canònic.
  - `POST …/publish` envia `{id, hash_esborrany, revisio_politica, confirm:true}`.
  - El servidor comprova la sessió G0, el permís sobre el pont, el hash, la revisió i l'actor remot.
  - Si canvien el títol o el cartell, l'aprovació deixa de valdre (Codex).
- **Idempotència:**
  - La clau de Mastodon només dura una hora. La garantia és la fila.
  - `external_status_id` es desa en la mateixa transacció que tanca la reserva.
  - Si el resultat és ambigu, l'estat passa a `indeterminada` i es reconcilia llegint els estats paginats amb `max_id`, també els que no són públics. Mai es torna a enviar a cegues.
- **Eco i canal doble:**
  - `/mastodon/sync` salta les peces que ja són a `sindicacions`.
  - El `Create` de l'actor propi i el POST a `@depoble` han de deduplicar-se per l'URL canònica.
- **Cadència:**
  - Les peces noves ixen d'una en una des de la safata.
  - L'històric, com a molt 10 peces al dia. Mastodon en permet 300 cada 3 hores, 25 programades al dia i 30 esborrats cada 30 minuts.
  - El pont R5 força `public` i s'ha d'adaptar abans de publicar en `unlisted`.
- **URL antigues:**
  - Hi ha tres propostes equivalents: `urls_antigues` (Claude), `legacy_url_map` (Codex) i el reconciliador R24 (Gemini).
  - Les URL es normalitzen abans de comparar-les (host en minúscules, sense fragment ni `utm_*`).
  - Les redireccions 301 només es poden fer als dominis nostres. Firebase no llig `_redirects`.
  - Per a Blogger hi haurà un resolutor «On ha anat este article?».
  - Del WXR només s'importen les entrades publicades sense contrasenya. Els comentaris, els correus i les IP no entren.
- **Persones:** les peces d'una persona mai no van per defecte ni al pont d'un altre (tampoc a `@depoble`). AH-09 ja li obri el seu propi pont, i allí cada peça passa per la seua conformitat a la safata.
- **Secrets, només al servidor:**
  - El testimoni de `@depoble` és a `~/.config/socdepoble/node0.env` (0600). Cal que l'app de mastodont.cat el limite a `profile write:statuses` (proposta de l'eix 10, encara no feta).
  - Els testimonis dels altres ponts van xifrats i s'apunten per `secret_ref`. Es revoquen amb `/oauth/revoke` en desvincular-los i s'esborren amb la baixa.
  - Mai al navegador, a l'exportació, als registres ni a Drive.
- **Pedagogia:** «en 1 minut», només quan existisca el flux OAuth per a cada persona.

#### 7 · Identitat canònica `socdepoble@socdepoble.org`

**Estat observat avui a les 22:13 CET (fediversity-05):**

| Consulta | `self` que torna |
|---|---|
| `.org`, plantilla LRDD | `https://socdepoble.org/ap/actors/socdepoble.json`, estàtic i sense `publicKey` |
| `.org`, `?resource=` | 404 de Firebase; Mastodon passa a host-meta (`app/lib/webfinger.rb`@v4.7.5:77-78) |
| `.cat`, `?resource=` | `https://socdepoble.cat/ap/actors/socdepoble`, dinàmic, amb Ed25519 i inbox |
| `.cat`, plantilla LRDD | `https://socdepoble.cat/ap/actors/socdepoble.json`: un tercer `self`, encara que el document que torna declara l'id dinàmic |

**Proposta (decisió 2):**

- **Un sol id d'actor.**
  - Es recomana `https://socdepoble.cat/ap/actors/socdepoble`: és l'únic que té claus i inbox.
  - El nom públic és **`@socdepoble@socdepoble.org`**. Els dos JRD tornen eixe `subject` i el mateix `self`.
  - L'actor declara `"webfinger": "socdepoble@socdepoble.org"` (FEP-2c59).
  - Mastodon v4.7.5 llig eixe atribut (`process_account_service.rb`:134-136) i, si el `subject` remet a un altre domini, el consulta i exigix que el `self` torne al mateix id (:155-178).
  - Els dos `.json` deixen de ser actors: sense seguidors remots, ara és el moment més barat.
  - L'alternativa és posar l'id al `.org`, però caldria un allotjament dinàmic per a l'inbox.
- **`alsoKnownAs`.**
  - L'actor declara `["https://mastodont.cat/users/depoble"]`.
  - Així autoritza un futur `Move` de la rèplica cap a l'actor propi, perquè Mastodon només mira el destí.
  - No vol dir que siguen la mateixa clau, i no s'executa cap `Move`.
  - Cap àlies invers a `mastodont.cat`. Abans s'ha de fer la tasca 1.5.
- **`rel="me"`.**
  - Una pàgina **estàtica** nova del `.org` porta `<a rel="me" href="https://mastodont.cat/@depoble">`. `/projecte` no servix: avui és l'`index.html` de la SPA (reescriptura de `firebase.json`).
  - `@depoble`, que avui no té cap camp, n'afig un de «Web» cap a eixa pàgina.
  - Mai a l'`index.html` compartit.
- **Correu.**
  - Avui el `.org` té el MX a Google, un SPF `+a +mx … ~all` i un DMARC `p=none` sense `rua`, i no hi ha DKIM al selector `google`.
  - Cal un DKIM alineat (`d=socdepoble.org`) per a cada emissor, un SPF només amb els emissors reals i un DMARC que arribe a `reject`.
  - El `.cat` no té MX, ni SPF, ni DMARC: cal MX nul, `-all` i `p=reject`.
  - L'SMTP real continua pendent.
- **Mirall d'AH-11.**
  - El compte és el titular del mirall (root connectat a les 22:07 segons el pla, sense verificar).
  - `04_Snapshots_PostgreSQL` entra xifrat amb `age`, i la clau es queda fora de Drive.
  - A `05_Recepta_Restauracio_Node0` hi pot haver els JRD i les claus **públiques**, però mai cap clau privada ni `node0.env`.
  - El mirall no commuta el trànsit. Si el Mac mini cau, l'actor no respon, i el text públic ho ha de dir.
  - Correu, Drive i identitat depenen d'un sol compte: cal una clau de seguretat i codis guardats fora de línia.

#### 8 · Desacords i resolució de l'àrbitre

1. **Conformitat POSSE.** Gemini proposava `humanApproved`; Codex, una conformitat lligada al servidor. **S'adopta la de Codex.**
2. **Model POSSE.** Gemini proposava una taula plana; Codex, un model normalitzat. **S'adopta el de Codex, amb la clau de cada fila.**
3. **Ordre de fases.** Gemini posava el POSSE primer; Codex, G0 primer. **A la Fase 1, la safata només de lectura; publicar, després de G0.**
4. **`rel=me`.** Codex el volia verificar i Gemini, emetre. **Les dues coses:** la verificació al Node 0 i l'emissió en HTML estàtic.
5. **Patrimoni.** Gemini protegia per autoria; Codex, amb una clau forana. **Amb la clau forana**, per simetria.
6. **Filtres.** Gemini en donava dues accions; Codex, tres. **Tres accions, amb avaluació al dispositiu i caducitat del servidor.**
7. **Camps de la fitxa.** Codex en volia 4 i Gemini, de 4 a 8. **Els configura el node.**
8. **AAA i failover.** **No s'anuncia res que no s'haja mesurat o certificat.**
9. **Preferències al servidor** (eix 3, contra D6/Q1). **El compromís de Codex**, a l'espera del Mestre.
10. **Apps.** Codex començava per OAuth i Claude, per les claus d'entitat. **Claus i ganxos a la Fase 3; OAuth a la Fase 4.**
11. **Noms de les fases.** Les lletres de cada IA col·lidixen. **Ací només valen les Fases 1 a 4.**

#### 9 · Decisions que ha de prendre el Mestre

1. **Prelació:** G0 abans de cap publicació POSSE.
2. **Id canònic de l'actor:** el del `.cat`, amb el nom `@socdepoble@socdepoble.org` (recomanat), o un `.org` dinàmic.
3. **`alsoKnownAs` d'un sol sentit** cap a `@depoble`, i marcar `@depoble` (avui de tipus `Person`) com a bot.
4. **Valors per defecte:** `is_public`, FEDI-26 Regla 2, cercadors en NO i capacitats noves restrictives.
5. **Qui cuida el poble** i qui verifica el veïnat (FEDI-04 prohibix deduir-ho de `town_memberships`).
6. **Mode d'entrada** de La Torre i dels pobles nous.
7. **Política de privacitat 2.5** (finalitats noves; fora «membres verificats»).
8. **Capa de preferències al servidor:** mantindre D6/Q1 o revocar-la.
9. **Què es fa amb l'evidència** abans de retirar una peça denunciada.
10. **Lectura anònima i prerender** de les fitxes públiques, per a `rel=me`.
11. **On viu el registre POSSE** (Supabase o Node 0), i si les retirades van sense safata.
12. **Fonts històriques aprovades** i permisos de drets (El Rentonar, `socdepoble.net`, la Coordinadora, Pep Cascant).
13. **Alta directa a entitats** (261008) o per invitació acceptada (art. 9).
14. **Connector de WordPress:** si la decisió A1 admet un pont amb clau al servidor.
15. **Normes de convivència** per a les dades de la fitxa i els textos alternatius, que avui en queden fora a posta (`2610241400:60-64`).

#### 10 · Correccions de la revisió adversarial

**Revisió:** 2026-11-04 22:46 CET, contra els fitxers d'eix, les seues verificacions, `lectura_creuada.md`, l'arbre viu (`HEAD 8f4559b3b`), Mastodon v4.7.5 i el WebFinger, els actors i el DNS públics (`dig +tcp`, `curl`). 30 correccions; la llista sencera és a `ah10_sintesi_mestra.md` del dipòsit. Les de més pes:

- **D-10** vol dir que la 2611032100 no s'aplica a cap servidor fins que SQL-01 i l'omissió del bloqueig estiguen corregits; al Node 0 ja hi corre, i la correcció hi ha d'entrar com a migració nova.
- **`private.preservacions`** portava `on delete cascade` i hauria destruït l'evidència que ha de guardar: ara és `restrict`. `aprovat_per` de `private.sindicacions` passa a `on delete set null` (art. 17), i la taula porta RLS i `revoke`.
- **Tasca 2.2:** `sessio_viva()` fallaria al Node 0 (`auth.sessions` només té `id` i `user_id`) i les sessions de l'amfitrió perdrien l'exportació i la baixa; ara és criteri d'acceptació.
- **Tasca 2.4:** la migració d'abast és pròpia i no depén de la 2611032100.
- **Tasca 1.7:** Firebase no encamina per `?resource=`; el criteri ara és executable (Mastodon hi arriba per host-meta).
- **`/projecte`** no és estàtica (és l'`index.html` de la SPA) i no pot portar `rel="me"`.
- **Fase 3** guanya la tasca 3.7 (colles privades), i **§9** la decisió 15.

**Comprovat i correcte (sense canvis):** la taula del WebFinger, excepte la fila 4; el DNS de correu; `@depoble` de tipus `Person` i sense camps; les cites de Mastodon v4.7.5 i totes les cites del Mas que s'han mostrejat.

### COMMIT R3 · `4ab2d1527` (2026-11-05, 00:04 CET)

**Integració.** La fusió `459685d84` del kit v3.0.0 de Gemini, més tres pegats i una neteja:

- **Retirada del panell.** Fora el panell del Node 0 i Mastodon, la safata POSSE, les seues proves, les claus i18n i el bloc CSS `.sdp-node0-*` (52 línies). Fora també els 5 mòduls que s'hi quedaven orfes: `verificadorPilarsFediversity`, `sanejaTextFederat` i les seues proves. La porta Pedra Seca (LLEI_08) els havia detectats.
- **P2 d'AH-04.** 17 troballes corregides i 2 claus noves als 5 diccionaris.

En total, 85 fitxers sobre `8f4559b3b`. Per l'aterratge, els dos pegats de les correctores **no han passat la revisió adversarial en còpia neta**. Les garanties són les proves i les portes de baix.

**Verificació a la còpia.** Vitest sencer: **1.830 fitxers i 32.700 proves en verd**. Els 2 fitxers en roig són els mòduls retirats mentre corria. A més, sobre els fitxers tocats:

- ESLint 0 i teclat PASSA (9 superfícies).
- `design_guard` 3.143 fitxers, 0/0.
- Frontissa 16/16 i editorial sense errors.
- Build exit 0, amb una entrada de **240.326 B gzip** (sostre 250.000).

`run-portes --nomes-portes` passa sobre l'**arbre exacte `c0070b86…`**. És el mateix arbre que ha quedat comitejat: el valida el hook.

**Commit.** Hook sencer en verd, sense `--no-verify`, amb la lease `be024b53` consumida. El primer intent no va arribar al commit perquè el títol de la Petorreta no tenia les 8–12 paraules.

**Pujada.** `903fb2f7c..4ab2d1527` a `fork/backup-notes-publish`. Són 5 commits de Claude i cap captura de `01_produccio`.

**Desplegament (00:04–00:05 CET).**

- Firebase servia abans la R2 de les 21:10.
- Ara Firebase i el Node 0 servixen `index-yR1QQLN5.js` a `/`, `/xat`, `/control` i `/rentonar`, i l'API del Node 0 respon 200.

**Sonda P0-16 a producció.** 12 rutes per node, incloses `/mapa`, `/animalets`, `/calendari`, `/notes` i `/fedivers`: **48 visites amb 0 errors de consola de l'app, 0 avisos i 0 excepcions**. L'únic registre és el 404 que el navegador anota per la RPC `membres_i_entitats_connectades_de` a `/rentonar` i `/entitats/rentonar`. És la migració no aplicada de D-10.

**Queda fora, per a la ronda següent:**

- el panell del Node 0 i la safata POSSE (encàrrecs a Gemini, dalt);
- el pegat de `localTimeMachine`, que té sentit quan torne el panell;
- les restes que les correctores van deixar fora del seu lot:
  - `NotesEditor` escriu la fitxa crua del Mur;
  - guies de la IAIA de Mapa i Animalets;
  - `registrePlugins` continua amb «Vista geogràfica»;
  - `VERSIO_CATALEG` sense posar al dia;
  - `nav.calendari` i `nav.animalets` sense cablejar;
  - el comentari obsolet de `sanejaTextFederat`, que ja no hi és.

### COMMIT R4a · `064ec0137` (2026-11-05, 02:35 CET) · kit r31 de Gemini · Sonnet 5.5, 1 sol fil, 0 subagents

Encàrrec de l'Onada R4 (Acta Marmota `261105_0148`, Pla `AH-14` a `AH-26`, Prompt «ONADA R4»). Quota de Sóc de Poble · Ultra al 93 %: cap subagent, cap Workflow, un sol Vitest alhora.

- **Kit r31 (90 fitxers, `AH-14` + `AH-15` + `AH-16`):** `[CAS OK]` sobre `4ab2d1527` en una còpia aïllada; verificador de 3,4 KB llegit abans d'executar-lo (copia fitxers, no executa res). Escaneig dels afegits: cap secret, cap `fetch`, `eval` ni `dangerouslySetInnerHTML`; el panell del Node 0 i la safata POSSE que vaig retirar a R3 no tornen. Els correus `socdepoble@…` de les cròniques són el compte institucional.
- **Tres defectes del kit corregits per l'àrbitre:**
  1. `PerfilEditor.imatges.test.jsx:901` afirmava «cap targeta viva al document» i `AH-15` la posa dins d'Edició avançada: l'assert passa a «cap a la fila de la llista, una dins del desplegable». Era l'únic roig dels 1131 fitxers de Vitest relacionats (19 015 proves).
  2. **Porta Graella:** `AppGridColumn` guanyava `despresIcona`, `iconaSempreBoto` i `columnaActiva` i el contracte viu a `01_produccio/contracte_graella.md`, zona humana (hook `forceAsk`, AGENTS §12). No he tocat la zona ni he amagat les props darrere d'un `...resta`: he **retingut el commutador dual mòbil d'`AH-16`** (props, les dues peces de `UniversalWorkspace`, el CSS d'indicador, la fila de l'espècimen de `/disseny` i el test que només ell cobria). Es manté `collapsibleNavigation={false}` i la caixa de 48 px. Torna amb 3 files de taula si el Mestre ho autoritza.
  3. **Pedra Seca i Design Guard:** `benvingudaVerificacio.js` usava 7 tokens `--sdp-*` inexistents, i els clients de correu no entenen `var(--…)`: colors literals de la paleta (`pedra-100/300/600/800`, `primary-700`, blanc) amb `ALLOW_RAW_COLOR`.
- **Proves:** ESLint 0 avisos en 84 fitxers de `src/`; Vitest 87 fitxers / 1062 proves després de la retirada; `run-portes` sobre l'arbre exacte (`2d7e5fd1…`) en verd; `build:web` 691 001 B d'entrada (240 875 B gzip, sostre 250 000). Hook sencer en verd en 206 s, sense `--no-verify`.
- **Fora d'abast d'este commit:** `supabase/functions/ap-inbox-verifica` (`P1-23`: `503` + `Retry-After` quan la reclamació està `en_curs`) canvia a disc però no s'ha redesplegat a Supabase, i l'efecte complet demana que la RPC `ap_inbox_reclama` torne `en_curs`. Les cròniques públiques de `/versions` parlen d'un «Mirall Navegable de 20 TB»: el 20 TB no el verifique des del repo.

### COMMIT R4b · cadena de Codex R3–R9 · VERIFICADA, NO INTEGRADA

- **Per què no és `R8` sol:** `R8` i `R9` són deltes sobre una base `R3`–`R7` (149 fitxers) que el repo no té; el producte que corre al Mini no és al control de versions. Per aplicar-los cal plegar la base: 209 fitxers i +20 280 línies.
- **Verificat en còpia aïllada (`scratchpad/copia_r4b`):** pins dels cinc kits contra els del manifest d'`R8` coincidents; base plegada = 149, 0 conflictes amb `HEAD` + Gemini; `R8` (78) i `R9` (15) aplicats amb els seus verificadors CAS (un `cas_drift` per mode 0600 de `tests/enxufe-traduccio.test.mjs`); ESLint 0 avisos; `node --test` en 72 fitxers: 685 ok, 0 fallades, 69 omeses; Vitest dels 17 tests tocats: 978 ok; `build:web` 242 069 B gzip. L'adaptador HTTP del Node 0 s'activa només en compilar amb `VITE_SDP_NODE0_HTTP=1`, i cap `.env` el fixa. Escaneig de secrets sobre els payloads: només canaris sintètics als tests.
- **Bloqueig (P1 d'integració):** `R8` posa `literals-secrets-node0.mjs` al començament de `test:precommit` i `test:ci`, i la porta marca 590 `private-file-indexed` per cada fitxer versionat de `.agents/runtime/` (torns i contractes, que `wiki-cicle-de-vida` pas 9 mana versionar). Amb el kit tal com és, cap commit posterior no passaria el hook. Exemptar `turns/` i `contracts/` és afeblir una porta de seguretat: l'entorn m'ho ha denegat i no ho he reintentat. **Decisió del Mestre (05-11-2026 02:46): «Que ho faça Codex».** L'exempció la dissenya Codex al kit `R10`, que a més ha de fixar el mode 0600 de la preimatge i acreditar-ho sobre un clon de `064ec0137` (amb els torns i contractes versionats). Eina de plegat de la base: `_investigacio_ia_de_poble/261104_claude_1636_arbitratge/plega_base_codex.py`. Fins que `R10` arribe, cap commit de la cadena `R3`–`R9`.
- **Revisió pendent a fons:** els tres P1 del veredicte `R6` només els he comprovat per tests verds i per lectura de punts (repte previ a `scrypt` present; no he trobat `IPv6 /48` per grep). La custòdia `age` (`R-5`) continua oberta.

### COMMIT R5 · integració de la collita de la Marató (R8–R11, r55–r57) · PREPARADA, NO COMMITEJADA A LA BRANCA DE TREBALL

Ordre del Mestre del 05-11-2026 (Onada matinal, Passos A–D) sobre `064ec0137`. Sonnet 5.5, **1 sol fil, 0 subagents**, cap cron, el servidor Vite del 3340 intacte. Tot s'ha provat en una còpia aïllada de `HEAD` (`scratchpad/copia`); el resultat és el **commit `c49d173c4`**, arbre `d6ce567b8846`, 484 camins (+50.230 −2.017 línies), a la branca **local** `integracio-r5-claude` del repositori viu. L'arbre de treball i `backup-notes-publish` no s'han tocat; no s'ha pujat res ni s'ha desplegat res. Dipòsit amb l'aplicador, el patch de les meues correccions i la resolució per fitxer: `_investigacio_ia_de_poble/261105_claude_integracio_r8_r57/`.

**Per què no hi ha commit a la branca de treball.** El pre-commit comença per la frontissa de contingut (`frontissa-contingut.mjs`) i falla amb **5 claus sense aprovació: `drets-autor`, `fedivers`, `fediversity`, `node-zero` i `versions`**. Aprovar-les (`--aprova CLAU --per NOM`) escriu a `.agents/` i és una decisió humana. El mateix R10 de Codex, aplicat sol sobre `064ec0137`, falla igual: les aprovacions «Codex · ordre directa AH-22» ja no casen amb els bytes que va deixar. No he registrat cap aprovació en nom del Mestre.

**Què he verificat sobre l'arbre exacte del commit** (assaig dels passos del hook, un per un):

- `run-portes --nomes-portes`: totes les portes passen (calen les correccions de més avall: la primera passada en tombava set).
- `tancament --check`: exit 0. `npm run test:precommit`: porta de secrets en mode índex 4.707 fitxers i 0 troballes, Vitest 350 fitxers / 8.018 proves, Node 301/301.
- `build:web`: entrada de 245.058 B gzip (sostre 250.000) amb les variables públiques del checkout, sense secrets.
- **Suite completa (`run-node-tests --ci`, que inclou el Vitest sencer):** Vitest 1.867 fitxers i 33.060 proves, tot verd llevat d'una (un APP1/EXIF a la variant social de l'Aplec, que ja he llevat i repassat). Node: 3.135 proves, i els 3 roigs que queden són els mateixos que ja té `064ec0137` (diagnòstics `arbre real (A)` de skills, classes d'`App.jsx` i classes òrfenes). Abans de les correccions eren 18 proves roges en 10 fitxers de Vitest (`HEAD` pelat: 0) i 6 de Node.
- IDEA-90: **0 fitxers `*shield*`** (`public/assets/pobles/` no existix; a `public/assets/towns/` hi ha 22 `commons-ah27.webp`), cap `shield_url` poblat, `pobles.escutsProhibits.test.js` en verd. De l'R10 no he copiat cap fitxer d'escut.

**Troballes sobre els kits (quatre ulls).**

1. **L'ordre A–D no s'aplica tal com està escrita.** `R8`, `R9` i `R11` exigixen la base `R3`–`R7`. L'he plegada amb `plega_base_r3_r9.py` d'R10 (pins de tots els kits contra els publicats per Codex a la seua auditoria): 209 fitxers, que ja inclouen R8 i R9. R11 (23 fitxers) hi va damunt amb el seu verificador CAS.
2. **`r55` no és un kit CAS**: el seu verificador només comprova els hashos del kit i sobreescriu. `r56` s'avorta, perquè espera un `pageContent.r10.js` que només crea R10. He escrit un aplicador amb una taula per fitxer. Dels 12 camins solapats: guanya `r55` als cinc diccionaris, `pobleDeViquipedia.js` i `paginaDeText.test.js`; guanya `r56` a `BotoneraClassificacio.jsx` i `NotesEditor.jsx` (r55 hi duu la versió d'r49 anterior, i aplicar r55 després d'r56, com mana l'ordre, la desfeia); `r57` guanya `components.css` (és el d'r55 amb dues línies més).
3. **r55 i r56 desfeien feina d'R10.** `iaiaLocal.js` perdia el filtre de privacitat `senseContactes` i la cerca exacta Mur/Muro: fusió a tres bandes amb el «Muro d'Alcoi» de Gemini. `pageContent.r10.js` havia canviat `@depoble@mastodont.cat` per `@depoble (mastodont.cat)` i una prova d'R10 l'exigix. La porta de secrets d'r55 llegia tot l'índex en un sol buffer de 384 MiB: he mantingut la d'R10 (lots de 8 MiB), amb les seues proves i les 18 d'r55 passant. R10 duu quatre fitxers sense escuts que r55 omet (`.gitignore`, `tests/node0-r8-verifier-scope.test.mjs`, `tooling/node0/autoritat-preimatges-r8.mjs`, `tooling/tests/node-suite-manifest.json`): aplicats amb CAS.
4. **`064ec0137` duu 16 fitxers privats de `.agents/runtime/` indexats** (ja empentats a GitHub). Sense desindexar-los, cap commit passa la porta de secrets. Els he desindexat (`git rm --cached`, tots amb l'OID esperat) i queden al disc; la història de GitHub els conserva.
5. **Els kits no han passat les portes de disseny.** Design Guard: 37 infraccions (8 `style` en línia, 14 colors crus, 9 classes visuals, 4 lletres de menys de 16 px, 2 `h1`). Pedra Seca: 3 fulls de secció, `document.documentElement` al panell de colors i 10 mòduls orfes. Vocabulari, Tokens, Catàleg, Arrel (`guarda_nocturna.json` citat pel tooling), InnerHTML, Psicopatia (una frase «local-first» a la UI), Frontmatter, Llavor, Rutes i Reflex (línia base del corpus) en tombaven una cadascuna.
6. **Regressions reals, no només proves velles.** (a) Les fotos de la galeria de l'Aplec, embolicades en `<a target=_blank>`, ja no obrien el visor (ordre del Mestre 30-10). (b) El manifest social deia a `treball` i `habitatge` el contrari del client (la lead nova només era a l'overlay). (c) L'`og:image` de l'Aplec pesava 1,37 MB per a WhatsApp (límit 300 KB). (d) `PageFrame` arrossegava tota la `UniversalCard` a l'entrada del paquet (21 KB menys en donar-li mòdul propi a `SquareBadge`). (e) `supabase/seed.sql` no duia els 21 pobles nous. (f) El manifest del mirall tenia els hashos vells de `townsSeed.js`.
7. **Proves d'R10, r49 i r55 posades al dia segons el Pla** (el Pla ja ho diu): 3 pestanyes `Tot`/`Gent de`/`Xarxa`, pastilla de publicació i insígnia `29 GEN 2023` a l'Aplec (`calendar_badge` del seed), AH-23 (`?ambit=` ja no fa salt), 22 pobles i les noves claus d'i18n. He llevat 12 municipis de referència que ara són a la llavor, i el Comtat té 24 municipis més Benialfaquí.

**Correccions de l'àrbitre**: 62 camins, detallats al patch del dipòsit. Cap canvi de comportament fora del que expliquen els punts 3, 5 i 6.

**Decisions per al Mestre (R5).**

| Id | Decisió | Recomanació |
| --- | --- | --- |
| R5-D1 | Aprovar o no les 5 claus de la frontissa. Dues de les pàgines afirmen que «els kits R8 i R9 estan pendents d'integració», cosa que deixarà de ser certa quan el commit entre; `drets-autor` du una frase retocada per Gemini | Revisar el diff de `drets-autor` abans d'aprovar; si cal el commit ja, `--no-verify` només per ordre teua |
| R5-D2 | La skill `sdp-importacio-editorial` d'r55 canvia el segell: **exclosa** (còpia al dipòsit) | Ressegellar i integrar-la tu o MarIA |
| R5-D3 | `tractor-llavor`: he admès l'adreça exacta `depoble@mastodont.cat` com a compte institucional (les pàgines del Fedivers la citen) | Confirmar que és el compte oficial i que no cal cap altra |
| R5-D4 | Trinquet del tros d'entrada del paquet estàndard: 1.591.855 → 1.663.000 B, a posta: 67.169 B són les dades dels 22 pobles | Acceptar o ordenar un tros mandrós per a la fitxa hidratada |
| R5-D5 | **La Torre**: foto, avatar del xat, coordenades i text passen a ser els de Commons/Wikidata (22 pobles amb Commons). Les `1.jpg`/`2.jpg` pròpies ja no es veuen | Si les vols, cal llevar la Torre del `spread` de `townsSeed.js` |
| R5-D6 | Els tres panells d'Administració (importació, tesaurus, sistema) fan servir ~56 classes CSS sense definició: es veuen sense estil. He rebaixat els baselines (vocabulari 436→136) | Encàrrec a Gemini per a l'estil; deute visible |
| R5-D7 | `municipiPendent` del Mode Rural ara diu «La Torre de les Maçanes» a tot arreu | Confirmar que és el municipi per defecte volgut |
| R5-D8 | Res no està desplegat ni aplicat a Supabase: queda el seed regenerat i el SQL `node0_posse` d'R11 (instal·lació local al Mini) | Desplegar en un altre torn |

**Límits.** No he repetit els 3 P1 de R6 de Codex; no he vist res al navegador (només proves i build); la revisió visual del Manifest i de l'Aplec és la de Codex. El pre-commit sencer no s'ha executat (vegeu dalt).

### D01–D15 · Tancament de l'onada (producte viu a `4ab2d1527`)

| Dimensió | Nota | Evidència |
| --- | --- | --- |
| D01 Port Neutral i Model B | 8 | `backendPort.js` i el contracte intactes en R1, R2 i R3; el client de Codex no s'ha integrat. Resta la RPC de D-10 sense aplicar a Supabase (404) |
| D02 Pedra Seca i Geometria HD | 8 | `design_guard` 0/0, LLEI_08 neta després de retirar els orfes, BlocAmbit a 58 px. El panell que refeia els organismes a mà no ha entrat |
| D03 Accessibilitat Rural AAA | 7 | Teclat PASSA; focus del xat i enllaços de la selecció (R2). Cap mesura AAA amb tecnologia d'assistència; el focus del compositor espera decisió |
| D04 Sobirania i Open Data Municipal | 7 | Node 0 amb PostgreSQL 17.11 verificat per GET; restauració `age → pg_restore` provada per Codex. Open Data sense signatura; la identitat `age` viu al Mac |
| D05 Federació Oberta (AP, NodeInfo, WebFinger) | 6 | Bústia signada i NodeInfo 2.1 vius; tres `self` diferents al WebFinger, `?resource=` en 404 al `.org` i `remoteInteropVerified:false` |
| D06 Enxufabilitat Universal (WordPress.org) | — | Sense delta en esta onada; no avaluat |
| D07 Replicabilitat de Nodes Germans | 5 | Kits de Codex no integrats; instal·lació fresca en menys de 15 minuts no certificada; proves que depenen d'un ZIP ignorat |
| D08 Privacitat, RLS/RGPD i E2EE | 6 | El botó de publicar obert i les peces inventades no han arribat a producció. P1 latents d'autenticació a R6 (auth OFF), secrets de Mastodon i PAT de GitHub per rotar (D-2, D-11.1), «membres verificats» promesos al text legal |
| D09 Notes i Karpathy Local | 8 | 8 àmbits, Selector, «Publicar al Mur» amb Edició avançada, contracte de dates; Vitest de Notes en verd |
| D10 Memòria Oral, Patrimoni i Multimèdia | 7 | Vídeo protagonista d'AH-01; verticals Calendari, Mapa i Animalets publicades. Cap fitxa oral nova |
| D11 Comunicació Comunitària i Xat Rural | 8 | 48 troballes T7a (46 confirmades) i correccions R1 i R2 desplegades; entitats al xat; 0 errors de consola a `/xat` |
| D12 Multilingüisme i Traductor Sobirà | 8 | Paritat dels 5 diccionaris en verd i claus noves revisades; el traductor sobirà no s'ha tocat |
| D13 Botigues Mòbils i PWA | — | Sense delta en esta onada; no avaluat |
| D14 Governança, Telemetria i Consola | 9 | 3 commits de codi amb el hook sencer i sense `--no-verify`, assaig de portes sobre l'arbre exacte, informe viu i sonda P0-16 als dos nodes |
| D15 Rendiment, Lleugeresa i Resiliència | 6 | Entrada de 240.326 B gzip (sostre 250.000). `socdepoble.cat` cau sencer si salta la llum; el mirall de Drive no està verificat al núvol (`cloudUploadedVerified:false`) |

Notes de l'àrbitre sobre el producte desplegat, no sobre els kits. No coincidixen amb les autoavaluacions dels kits: Gemini posava 10/10 a D02, D12 i D14 i 9,5 a D08 amb el panell que no ha passat el Gauntlet.

### Decisions per al Mestre

- **D-2 · Secrets de Mastodon en clar al xat (20:43).** L'ordre AH-09 actualitzada arriba amb el testimoni d'accés, l'identificador i el secret de client de l'aplicació de `@depoble@mastodont.cat` escrits en clar. He comprovat que **no** són a cap fitxer de `_wiki_de_poble/04_escriptori`, `.agents`, `src` ni `tooling`; no els he copiat enlloc. Com que han passat per xats i transcripcions de tres IAs, **recomane revocar-los i generar-ne uns de nous a mastodont.cat** quan Codex haja comprovat la instal·lació. Els nous s'han de posar directament a `~/.config/socdepoble/node0.env` (0600), sense passar per cap xat. Mentre el pla o un informe continguen un secret, no es poden comitejar.
- **D-1 · Captures de `01_produccio/` fora del commit.** Diverses captures noves mostren dades personals de beta testers (`261103_2100_supabase_profiles_beta_testers_amics.png`, `261103_2352_whatsapp_alfredo_beta_tester_ull_contrasenya_i_email_benvinguda.png`, `261103_2042_video_alfredo_ull_contrasenya_registre.mp4`). La branca es puja a `fork/backup-notes-publish`. No les versione sense ordre expressa; la carpeta de cursos (20 MB) passaria del límit pràctic d'un commit.

## Onada R6 · Bloc 1 (6% Ultracode)

Compte 1 de Claude Opus 5.5 amb Ultracode i 4 subagents en paral·lel, per ordre del Mestre del 05-11-2026 a les 19:13 CET (prompt del Teler, secció «ONADA R6»). **Base:** `c49d173c4` a `backup-notes-publish` més l'arbre de treball, que ja duia 14 fitxers de `src/` bruts d'altres mans abans de començar (instantània APFS a l'scratch de la sessió, `r6_abans_src`). **Regla del 6%:** cada subagent escriu ací a cada pas. Si la quota s'acaba a mitjan vol, el Bloc 2 reprén des de l'última entrada de cada subapartat. Res commitejat ni desplegat.

### Subagent 1 · R5-D5 · La Torre de les Maçanes i logotip de 600 px

- **19:27** · **Inici.** Subagent 1 (Constructor) obri el carril R5-D5: hidratació de `townsSeed.js` (La Torre de les Maçanes) i límits de `.page-title-logo` per sota de 600px.

- **19:28** · **Diagnosi A (R5-D5).** Causa a `src/sections/pobles/townsSeed.js:181`: `MOCK_TOWNS[existent] = { ...anterior, ...poble, author: ... }` fa guanyar el `poble` de l'Aplec (que porta tot `DADES_POBLES_APLEC_VIQUIPEDIA` per l'spread de la línia 171) sobre la fitxa pròpia. La Torre perd `1.jpg`/`2.jpg` → `commons-ah27.webp`, `population` 700 → 749, `lat/lng` 38.5919/-0.4184 → 38.6067/-0.4192, i hereta crèdits de la foto de Commons («Foto: Torre (Public domain)») que ja no correspon.
- Només La Torre està alhora a `MOCK_TOWNS` (9 fitxes pròpies) i a les 22 de l'Aplec: cap altre poble perd mitjans propis per este patró.
- El criteri de «fallback» ja existix: `teImatgeReal()` a `src/sections/pobles/fitxaDelPoble.js:43` (rebutja `hero_nanobanana*`), i `fusionaAmbFitxaEditorial()` (línia 162) ja ompli només buits i fallbacks i ajusta `imatges`/`copyright`/`wikipedia_provenance.photo` segons d'on ve la foto. El llaç de la llavor no el feia servir.
- Els dos JPG existixen: `public/assets/towns/la-torre-de-les-macanes/1.jpg` (104.698 B) i `2.jpg` (335.611 B).
- El test `src/sections/pobles/townsSeed.ah27.test.js` (línia 18) exigix `MOCK_TOWNS.image_url === dada.image_url` per als 22: blinda la regressió i caldrà matisar-lo per a fitxes amb foto pròpia.

- **19:29** · **Pegat A1 aplicat** a `src/sections/pobles/townsSeed.js` (només este fitxer): nou `export function fusionaAmbAplec(anterior, poble)` + import de `fusionaAmbFitxaEditorial` des de `./fitxaDelPoble.js`; el llaç ja no fa `{ ...anterior, ...poble }`.
- Regla general (no cas especial de la Torre): de l'Aplec només entren els camps que NO són de `DADES_POBLES_APLEC_VIQUIPEDIA` i que la fitxa té buits (`source_url`, `author`, `parent_poble_*`); la Viquipèdia passa per `fusionaAmbFitxaEditorial`, que ompli buits i fotos de reserva (`teImatgeReal`, patró `hero_nanobanana`) i només posa `imatges`/`copyright`/`wikipedia_provenance.photo` de Commons si la foto final és la de Commons.
- Resultat comprovat amb `node`: la Torre torna a `1.jpg`/`2.jpg`, `700 hab`, `38.5919/-0.4184`, «Gent de la Torre», `created_at` propi; guanya `wikidata_id Q1641908`, `elevation 788`, `area 36.48`, `gentilici`, `source_url`; `imatges.hero` i `photo` queden `null` (no s'atribuïx la foto pròpia a Commons); no rep `population_year 2025` (era del cens de 749). 30 fitxes, com abans.
- Efecte col·lateral menor: la fitxa guanya `imageSrc = image_url` (el mateix que fa `usePobleHidratat` en temps d'execució).

- **19:30** · **Pegat A2 (test)** a `src/sections/pobles/townsSeed.ah27.test.js`: l'assert dels 22 (línia 18) ara accepta la foto pròpia de `FOTOS_PROPIES` (només la Torre); nou `describe('R5-D5 …')` amb 3 tests: la Torre conserva `1.jpg`/`2.jpg` (bytes JPEG reals `FF D8 FF`), `700 hab`, `38.5919/-0.4184`, autoria i data, sense crèdits de Commons ni `population_year`; només rep el que li faltava (`wikidata_id`, `elevation`, `area`, `gentilici`, `source_url`, `wikipedia_hydration`); una fitxa sintètica amb `/assets/hero_nanobanana.png` rep foto, dades i crèdits de l'Aplec (Balones).
- **Test:** `npx vitest run src/sections/pobles/townsSeed.ah27.test.js` → 1 fitxer, 8/8 passen.
- Comprovat: `1.jpg`, `2.jpg`, `1.webp`, `2.webp` no porten GPS (`mdls` → `null`).

- **19:30** · **Test (cobertura de pobles):** `npx vitest run` sobre `PoblesSection.test.jsx`, `fitxaDelPoble.test.js`, `seedSql.pobles.test.js`, `qualitat.test.js`, `DetallPoble.test.jsx`, `usePobleHidratat.test.jsx`, `PanellDeViquipedia.test.jsx`, `pobles.escutsProhibits.test.js`, `xatDelPoble.test.js`, `territori.r10.test.jsx` (tots a `src/sections/pobles/`) → 10 fitxers, 111/113; els 2 errors eren de `PoblesSection.test.jsx` i codificaven la regressió R5-D5.
- **Pegat A3 (test)** a `src/sections/pobles/PoblesSection.test.jsx`: (1) test «Onada 5 · la llavor conserva author…» exigia per a la Torre el crèdit `Text: Viquipèdia … · Foto: Torre (Public domain)` i `photo` d'`El riu251.jpg`; ara exigix `photo === null` i el mateix `© Viquipèdia / Wikimedia Commons (CC BY-SA)` que els altres 8 pobles amb foto pròpia (títol i comentari ajustats); (2) la píndola de cens `749 hab` → `700 hab`.
- **Test:** `npx vitest run src/sections/pobles/PoblesSection.test.jsx src/sections/pobles/townsSeed.ah27.test.js` → 2 fitxers, 32/32 passen.

- **19:31** · **Test (consumidors de `MOCK_TOWNS` fora del carril):** `npx vitest run` sobre 19 fitxers (`src/sections/xat/{pobleAmfitrio,XatContext.gentDelPoble,enllacos,XatSection.avatars,XatSection.caraDelPoble}.test.*`, `src/sections/xat/components/FakeChatOnboarding.{gentDelPoble,avatars}.test.jsx`, `src/sections/detail/{elementDeSeccio,ItemDetailSection.imatgesPropies}.test.*`, `src/sections/mur/articles/Aplec2023Article.test.jsx`, `src/sections/mur/mapaFotografic.test.js`, `src/sections/multimedia/suggerimentPobleLocal.test.js`, `src/sections/control/{ModeRural,FitxaOpenData}.poble.test.jsx`, `src/config/{assetResolver,metadadesSocials}.test.js`, `src/data/{iaiaLocal.atles,exportaMunicipiOpenData}.test.js`) → 19 fitxers, 508/511; 3 errors causats pel retorn de la Torre a les seues dades (fitxers FORA del meu carril, NO tocats):
- **Petició X1 (carril xat):** `src/sections/xat/pobleAmfitrio.js:55` té `POBLE_PER_DEFECTE.avatar = '/assets/towns/la-torre-de-les-macanes/commons-ah27.webp'` escrit a mà; el test `src/sections/xat/pobleAmfitrio.test.js:89-90` exigix que siga igual que `MOCK_TOWNS` (ara `2.jpg`). Cal canviar-lo a `'/assets/towns/la-torre-de-les-macanes/2.jpg'` (el bessó `2.webp` existix, línia 92 passa) i les línies 89, 102 i 104 del test. Revisar també `XatSection.actorsPermanents.test.jsx:361` i `FakeChatOnboarding.avatars.test.jsx:103`, que fixen `commons-ah27.webp` (no fallen hui perquè no llegixen la llavor).
- **Petició X2 (carril multimèdia):** `src/sections/multimedia/suggerimentPobleLocal.test.js:23` té `GPS_TORRE = { lat: 38.6066667, lng: -0.4191667 }` (coordenades de Wikidata); amb la llavor canònica (`38.5919/-0.4184`) fallen «a tocar de la Torre … menys de 0,1 km» (línia 71) i «el resultat és congelat …» (`km` 0, línia 172). Cal tornar `GPS_TORRE` a `{ lat: 38.5919, lng: -0.4184 }`.

- **19:32** · **Diagnosi B (logotip 600px).** CSS ja net: l'única excepció, `.sdp-connectar-pagina .page-title-logo { width: min(100%, 260px); }`, ja l'havia esborrada una altra mà en `src/css/modules.css` (diff brut de l'onada, comentari IDEA-93 a 8752-8753). Regles vives: `src/css/layout.css:551` (`width: 600px; max-width: 100%`), `src/css/modules.css:7359` (`width: min(100%, 600px); min-width: min(100%, 260px)`, el 260 és un sòl, no un sostre) i `modules.css:7363` (`.page-title-logo--entitat { max-height: 600px; }`). Cap altre `*.css` de `src/` limita `.page-title-logo`, `header.page-title` ni `img` de la capçalera; no hi ha cap modificador `--compacte`.
- `src/components/universal/PageFrame.jsx:1316`: els `width="300" height="78"` del logotip de Sóc de Poble són la proporció natural per a reservar lloc (anti-salt de Safari 16); el CSS mana l'ample (600px) i `height: auto`: no és un límit. No es toca (ho fixen `PageFrame.logo.test.jsx:62-91` i `PageFrame.test.jsx:35`).
- Queden 3 comentaris obsolets de «logotip compacte» FEDI-22 a `src/sections/connectar/ConnectarSection.jsx` (línies 98-100, 1138 i 1283); la classe `sdp-connectar-pagina` sí que cal (nom del contenidor `@container` de GLOBAL-04).

- **19:32** · **Pegat B1 aplicat** a `src/sections/connectar/ConnectarSection.jsx` (només comentaris, zero canvi de codi): els 3 comentaris FEDI-22 de «logotip compacte» (capçalera del fitxer ~98-100, `className="sdp-connectar-pagina"` de la vista ~1138 i de la vista d'extern ~1283) ara diuen que la classe és el contenidor amb nom de GLOBAL-04 i que el logotip manté els 600px (IDEA-93). `src/css/modules.css` i `src/components/universal/PageFrame.jsx` no es toquen (ja complixen).
- **Test:** `npx vitest run src/sections/connectar/connectar.graella.css.test.js src/components/universal/PageFrame.logo.test.jsx src/components/universal/PageFrame.avatar.test.jsx src/sections/connectar/ConnectarSection.fedi22.test.jsx src/sections/connectar/ConnectarSection.test.jsx src/sections/connectar/modeDeConnectar.test.js src/sections/text/pageContent.fediversity.test.js` → 7 fitxers, 239/239 passen. Cap test exigia la mida compacta: `connectar.graella.css.test.js:96-98` ja vigila que no hi haja `.sdp-connectar-pagina .page-title-logo` i que `.page-title-logo` siga `min(100%, 600px)`.

- **19:33** · **Test (resta del carril):** `npx vitest run` sobre 11 fitxers més de `src/sections/pobles/` (`aliesDePobles`, `nomsDelPoble`, `publicacionsDelPoble`, `PublicacionsDelPoble`, `pobleDeViquipedia`, `RestauradorOpenData`, `EntitatsDelPoble`, `PoblesSection.lleiDelPixel`, `cauDeViquipedia`, `fitxaDelPoble`, `qualitat`) → 11/11 fitxers, 200/200 passen (inclou ESLint de `qualitat.test.js`).
- **Veredicte S1.** FET: R5-D5 corregit amb regla general (`fusionaAmbAplec` en `townsSeed.js`): la Torre torna a `1.jpg`/`2.jpg`, `700 hab`, `38.5919/-0.4184`, sense crèdits falsos de Commons; un poble amb foto de reserva continua rebent l'Aplec. Logotip: cap regla ni pàgina el limita per sota de 600px; comentaris «compacte» esborrats. Fitxers tocats: `src/sections/pobles/townsSeed.js`, `src/sections/pobles/townsSeed.ah27.test.js`, `src/sections/pobles/PoblesSection.test.jsx`, `src/sections/connectar/ConnectarSection.jsx` (80+ / 21−, verificat contra `r6_abans_src`). Res commitejat.
- **NO FET (fora del carril) · Bloc 2 ha de recollir:** (1) petició X1, `src/sections/xat/pobleAmfitrio.js:55` + `pobleAmfitrio.test.js:89,102,104` → `2.jpg` (hui 1 test roig); (2) petició X2, `src/sections/multimedia/suggerimentPobleLocal.test.js:23` `GPS_TORRE` → `38.5919/-0.4184` (hui 2 tests rojos); (3) regenerar `supabase/seed.sql` amb `scripts/generate-supabase-seed.mjs` (encara porta la Torre amb `749 hab` i `commons-ah27.webp`, 2 aparicions; `seedSql.pobles.test.js` no ho veu perquè només compara `title/author/provincia/comarca/wikipedia_title`); (4) si el tenant remot o PROD ja servixen la fila `towns` amb Commons per a la Torre, cal resembrar-la després del desplegament (decisió del Mestre).
- Opcional per al Mestre: `commons-ah27.webp` de la Torre queda al disc i a `DADES_POBLES_APLEC_VIQUIPEDIA` (crèdits AH-27, `censImatges.js`), però ja no es pinta a la fitxa; si es vol com a foto de `reserva`, caldria afegir-la a `imatges.reserva` en una altra ronda.

- **19:33** · **Àrbitre · inici.** Revise el diff d'esta onada en `townsSeed.js`, `townsSeed.ah27.test.js`, `PoblesSection.test.jsx` i `ConnectarSection.jsx` contra `r6_abans_src`; comprove `fusionaAmbFitxaEditorial`, imports circulars, `.page-title-logo`, eslint i tests dirigits.

- **19:35** · **Àrbitre · revisió.** `fusionaAmbAplec` (`townsSeed.js:184`) és general: l'Aplec només ompli camps buits que no siguen de la font Viquipèdia, i `fusionaAmbFitxaEditorial` (`fitxaDelPoble.js:162`) només substituïx `image_url`/`avatar_url` si `teImatgeReal` és fals (`hero_nanobanana`). Sense import circular (`fitxaDelPoble.js` no importa `townsSeed.js`). L'única coincidència llavor/Aplec és la Torre (Penàguila, Benifallim, Sella, Orxeta, Relleu, Alcoleja, Xixona i Tibi no són a l'Aplec): cap altre poble perdia mitjans. `1.jpg` i `2.jpg` existixen (JPEG reals, el test ho comprova pels bytes). Cap canvi revertit d'altres mans.
- **Àrbitre · logotip.** Regles vives: `layout.css:551` (600px, `max-width: 100%`), `modules.css:7359` (`min(100%, 600px)` amb `min-width` de 260px, que és un mínim, no un límit) i `modules.css:7363` (`--entitat`, `max-height: 600px`). No queda cap límit per davall de 600px ni cap comentari FEDI-22 de «logotip compacte» en `ConnectarSection.jsx` o `PageFrame.jsx`. Tasca B correcta sense tocar CSS.
- **Àrbitre · proves.** `npx eslint` sobre els 4 fitxers: 0 errors. `npx vitest run src/sections/pobles/townsSeed.ah27.test.js src/sections/pobles/PoblesSection.test.jsx src/sections/pobles/fitxaDelPoble.test.js src/sections/pobles/seedSql.pobles.test.js src/sections/connectar/connectar.graella.css.test.js src/components/universal/PageFrame.logo.test.jsx src/sections/connectar/ConnectarSection.fedi22.test.jsx`: 7 fitxers, 129/129 passen. Fora del carril: `npx vitest run src/sections/xat/pobleAmfitrio.test.js src/sections/multimedia/suggerimentPobleLocal.test.js` dona 3 errors (confirmen X1/X2). Els 4 tests de xat que fixen `commons-ah27.webp` (`caraDelPoble`, `avatars`, `actorsPermanents`, `FakeChatOnboarding.avatars`) passen 95/95, però només perquè comparen amb el `POBLE_PER_DEFECTE` codificat a mà.
- **Àrbitre · per al Bloc 2.** (1) X1: `src/sections/xat/pobleAmfitrio.js:55` té `avatar` = `commons-ah27.webp`, i el xat no casa amb la llavor (`2.jpg`). Cal canviar-lo i actualitzar `pobleAmfitrio.test.js:89,102,104,110`, `XatSection.caraDelPoble.test.jsx:97`, `XatSection.avatars.test.jsx:96`, `XatSection.actorsPermanents.test.jsx:361` i `FakeChatOnboarding.avatars.test.jsx:103`. (2) X2: `GPS_TORRE` de `suggerimentPobleLocal.test.js:23` ha de passar a 38.5919/-0.4184. (3) Cal regenerar `supabase/seed.sql`, que encara porta 749 hab i `commons-ah27.webp`, i fer més estricte `seedSql.pobles.test.js` perquè compare també `image_url`, `population` i `lat`/`lng`. (4) Resembrar el tenant remot o PROD després del desplegament, si el Mestre ho decidix.
- **Àrbitre · veredicte.** Acceptat. Sense correccions al carril: el requisit R5-D5 es complix amb una regla general, els tests i l'eslint estan en verd i el logotip queda a 600px. Les 3 fallades de fora del carril (X1/X2) i el `seed.sql` desfasat queden per al Bloc 2. No hi ha res fet commit.

<!-- R6B1:S1:FI -->

### Subagent 2 · P0-25 / IDEA-96 · Edició real des de `/notes`

- **19:27** · **Inici.** Subagent 2 (Constructor, P0-25 / IDEA-96) arrenca: traçar el flux de publicació de `/notes`, retirar el peu «Ja publicat al Mur» de `NotesSection.jsx` i `PublicacioDetall.jsx`, i obrir les publicacions editables dins de `NotesEditor`.

- **19:32** · **Diagnosi.** El peu no és a `NotesSection.jsx` (la línia 257 només fa `renderDetall` → `<PublicacioDetall item={item} />`): és a `PublicacioDetall.jsx`, funció `peuDeLaPublicacio` (~l. 104-110), que posa `peuDePagina: <PublicacionsDeLActor seccio exclouId />` amb `titolDeLHistoric` («Ja publicat al Mur») a les DUES lectures (publicació i pàgina del sistema). L'editor ja no en té (Gauntlet 261016). Tot `kind === 'publicacio'` va a eixe lector de només lectura amb «Obri al Mur».
- **Flux de publicació traçat.** `NotesContext.publishNote` → `sendSectionSubmission({ id: note.publishedSubmissionId || note.id })` = upsert `section_submissions?on_conflict=id` (`data/supabase/content.js:104`) → `updateNote({ isPublished: true, publishedSubmissionId })`. `masDeLUsuari.itemsPublicatsDe` amaga la publicació virtual si l'id és a `publicadesDesDeNotes`: la peça és la nota. En seed/local `publishNote` rebutja amb `motiuModeLocal` (cap xarxa).
- **Bloqueig de dades (fora del carril).** `manifest-de-poble` (`feedSeed.js`) i `aplec-2023` (`eventsSeed.js`) no són files de `section_submissions`: en remot vénen d'`app_content.feedPosts` (`supabase/seed.sql:9`) i l'id no és UUID (`section_submissions.id uuid`). Un upsert amb eixe id falla. A més `seccioDAmbit` només escriu `mur`/`mercat`: un acte (`events`) no es pot actualitzar per `publishNote`.

- **19:32** · **Disseny (abans de codi).** (1) Fora el peu en les dues lectures de `PublicacioDetall.jsx`. (2) `PublicacioDetall` passa a commutador: Mur o agenda (no sistema) → `PublicacioEditable.jsx` (nou); Mercat, Multimèdia i pàgines del sistema → `LectorDePublicacio` (el lector de sempre, ara exportat). Els tests que ja fan `vi.mock('./PublicacioDetall.jsx')` no canvien.
- (3) `PublicacioEditable` munta `NotesEditor` (TipTap + «Edició avançada» + selector amb «Actualitzar al Mur», perquè `isPublished: true`) amb una nota sintètica (`publicacioEditable.js · notaDeLaPublicacio`): id = el del Bloc `publicacio:<seccio>:<id>`, `content = item.content` (contracte amb S3; reserva: entradilla/description en `<p>`), `publishedSubmissionId = id de la fila`. Un `NotesContext.Provider` sobreescriu `setLocalNoteField`/`saveNoteField` (esborrany en memòria: obrir no crea cap nota al servidor) i `publishNote`.
- (4) «Actualitzar al Mur»: seed/local → el `publishNote` de sempre (rebuig honest, res creat). Fila UUID del Mur → adopció: `creaNota` (UUID nou) + `updateNote({ publishedSubmissionId: idFila, isPublished: true })` + `publishNote` de sempre → upsert amb el MATEIX id (cap duplicat); la selecció passa a `?nota=<id>` i la publicació virtual s'amaga (`publicadesDesDeNotes`). Llavor (id no UUID) o acte → cap escriptura, motiu en línia.
- **Petició per al Bloc 2 (fora del meu carril).** Perquè Manifest i Aplec es reflectisquen a `/mur` i a la ruta cal un magatzem de revisions editorials (patró `data/publicacionsEsborrades.js`) llegit per `MurContext` + `ItemDetailSection`, o migrar eixa llavor a `section_submissions` amb UUID.

- **19:34** · **Pegat 1 · `src/sections/notes/PublicacioDetall.jsx`.** Fora `peuDeLaPublicacio`, els imports `PublicacionsDeLActor`, `titolDeLHistoric`, `useVeuHistoric` i les props `peuDePagina`/`etiquetaPeuDePagina` de les dues lectures (publicació i pàgina del sistema). El lector de sempre ara és `export function LectorDePublicacio`; `PublicacioDetall` és el commutador (`esPublicacioEditable(item)` → `<PublicacioEditable />`, si no → `<LectorDePublicacio />`). `NotesSection.jsx` no cal tocar-lo: `renderDetall` ja crida `PublicacioDetall`.

- **19:34** · **Pegat 2 · nou `src/sections/notes/publicacioEditable.js` (pur).** `esPublicacioEditable` (Mur o agenda, no `isSystem`), `cosDeLaPublicacio` (`content` HTML tal qual; text pla → `<p>` escapats; buit → `description`), `notaDeLaPublicacio` (id del Bloc, `isPublished: true`, `publishedSubmissionId` = id de la fila, carpeta de la secció), `esFilaActualitzable` (només `mur` amb UUID), `motiuNoActualitzable` (claus `section.notes.publicacio.noActualitzable*` amb reserva en valencià) i `campsDeLAdopcio` (camps de `createNote` + lligam per `updateNote`).

- **19:35** · **Pegat 3 · nou `src/sections/notes/PublicacioEditable.jsx`.** Munta `NotesEditor` dins d'un `NotesContext.Provider` que hereta el context del Bloc i sobreescriu `setLocalNoteField`/`saveNoteField` (esborrany en memòria, per id de publicació), `publishNote` (= «Actualitzar al Mur»), i anul·la `compartirNota`, `canviaEstatPublicacio`, `mouNota`, `esborraNota`, `potEsborrar`. Adopció idempotent (`adoptada` ref: un reintent no crea una segona nota), `bgSaveManager.setRevision` després del lligam, selecció `?nota=<id nota>` abans de `publishNote`. Cap `style={{}}`, cap color, cap `<h1>`.

- **19:37** · **Pegat 4 · tests del lector.** `PublicacioDetall.peuDePagina.test.jsx` reescrit: ara afirma que NO hi ha regió «Ja publicat al Mercat», ni `.sdp-pagina-peu`, ni Cards (Mercat, Foraster, sense actor, Multimèdia) i, per text, que el lector no munta `<PublicacionsDeLActor` ni `peuDePagina`. Els tests que proven el lector amb elements del Mur (`boina`, `capcalera`, `imatgesPropies`, `visor`, `traduccio`, `ConnexioDetall`) importen ara `LectorDePublicacio as PublicacioDetall` (mateix lector, sense canvi d'afirmacions).
- **Prova.** `npx vitest run src/sections/notes/PublicacioDetall.peuDePagina.test.jsx` → 1 fitxer, 5/5 verds.

- **19:37** · **Pegat 5 · nou `src/sections/notes/PublicacioEditable.test.jsx`.** 10 proves (editor doble, context real del Bloc simulat): peces pures (què s'edita, cos HTML/text/descripció, fila actualitzable), la publicació del Mur s'obri a l'editor sense peu ni Cards, escriure no toca el servidor, «Actualitzar al Mur» adopta i reescriu la MATEIXA fila (`creaNota` UUID → `updateNote({ publishedSubmissionId, isPublished })` → `publishNote` amb el mateix `publishedSubmissionId`, `?nota=<id>` amb `replace`), reintent sense segona nota, llavor i acte sense escriptura, seed → `publishNote` de sempre.
- **Prova.** `npx vitest run src/sections/notes/PublicacioEditable.test.jsx` → 10/10 verds.

- **19:38** · **Pegat 6 · tests.** `PublicacioDetall.sistema.test.jsx`: la prova que exigia el peu «Ja publicat al Mur» a una pàgina del sistema ara exigix que NO hi siga (cap regió, cap `.sdp-pagina-peu`, cap `.sp-card-title`). `PublicacioDetall.mercat.test.jsx` (pinta també elements del Mur) importa `LectorDePublicacio as PublicacioDetall`.
- **Prova.** `npx vitest run` sobre 14 fitxers (`PublicacioDetall.{boina,capcalera,imatgesPropies,mercat,peuDePagina,sistema,traduccio,visor}`, `ConnexioDetall`, `PublicacioEditable`, `NotesEditor.peuDePagina`, `NotesSection.peuDePagina`, `PublicacioVerticals8Ambits.integracio`, `data/supabase/barraTaronjaData.contracte`) → 14/14 fitxers, 163/163 proves verdes. `npx eslint` sobre tots els fitxers tocats → 0 missatges.

- **19:40** · **Pegat 7 · `src/sections/notes/NotesSection.jsx`.** Només dos comentaris obsolets («una publicació … es llegixen», «PublicacioDetall … en conserva el seu») posats al dia; cap canvi de codi. `npx eslint` → 0; `npx vitest run src/sections/notes/qualitat.test.js src/sections/notes/qualitat.masLector.test.js` → 13/13. Portes de text adjacents (`mur/qualitat.publicacionsActor`, `mur/qualitat.imatgesPropies`, `barres/qualitat.boinaAlPerfil`, `PedraSeca/qualitat.visor`) → verdes (49/49 amb les dos de notes). 17 fitxers `NotesSection.*`/`NotesDetail` → 276/276.

- **19:40** · **Veredicte S2.** FET: (a) fora el peu «Ja publicat al Mur» de tot `/notes` (publicació i pàgina del sistema); (b) una publicació pròpia del Mur o de l'agenda (Manifest, Aplec…) s'obri EDITABLE a `NotesEditor` (TipTap, «Edició avançada», selector «Actualitzar al Mur») amb `item.content` (contracte S3); (c) en remot, una fila del Mur amb UUID s'actualitza amb el MATEIX id (adopció idempotent, sense duplicat). Fitxers: `PublicacioDetall.jsx`, nous `PublicacioEditable.jsx`, `publicacioEditable.js`, `PublicacioEditable.test.jsx`; 9 tests del lector ajustats; comentaris de `NotesSection.jsx`. Res comitat.
- **NO FET / per al Bloc 2.** (1) Manifest (`manifest-de-poble`) i Aplec (`aplec-2023`) s'editen però NO s'envien: són llavor (`app_content`, sense UUID) i acte (`events`); cal un magatzem de revisions editorials (patró `data/publicacionsEsborrades.js`) llegit per `MurContext`, `ItemDetailSection` i la ruta dedicada, o migrar-los a `section_submissions` amb UUID; per als actes, que `publishNote`/`seccioDAmbit` puga escriure `events`. (2) L'esborrany d'una publicació viu en memòria: es perd en canviar d'element (proposta: adoptar al primer canvi o desar-lo a IndexedDB). (3) Mercat i Multimèdia continuen en lectura.
- **Límits declarats.** No verificat al navegador (`:3340`) ni contra Supabase real: les proves usen un doble de `NotesEditor`. Els tests del lector amb elements del Mur proven `LectorDePublicacio`, que el Bloc ja només usa per a Mercat, Multimèdia i sistema. Comentari obsolet a `NotesEditor.jsx:~167` sense tocar (fitxer calent).

- **19:40** · **Àrbitre · inici.** Revise el carril 2 (P0-25): diff de `NotesSection.jsx` (només comentaris) i `PublicacioDetall.jsx` (fora `peuDeLaPublicacio`/`PublicacionsDeLActor`, nou `LectorDePublicacio` + despatx a `PublicacioEditable`), fitxers nous `PublicacioEditable.jsx`, `publicacioEditable.js`, `PublicacioEditable.test.jsx` (sense seguiment). Comprove ara `publishNote` (upsert amb el mateix id), crides de `PublicacioDetall`/`LectorDePublicacio`, portes de casa, eslint i proves.

- **19:42** · **Àrbitre · comprovacions.** El peu ja no és enlloc del Bloc: `peuDeLaPublicacio`, `useVeuHistoric` i l'import de `PublicacionsDeLActor` han eixit de `PublicacioDetall.jsx`. `NotesSection.jsx` només canvia comentaris. `PublicacioEditable` passa a `NotesEditor` un `NotesContext` embolcallat: escriu en memòria, fa `publishNote` → `sendSectionSubmission({ id: publishedSubmissionId })`, que és un upsert amb la MATEIXA fila (`NotesContext.jsx:553`), i no hi ha cap duplicat. Cap `style={{}}`, cap `<h1>`, cap color cru i cap `innerHTML` nou. `npx eslint` dels 5 fitxers dona 0 missatges.
- **Àrbitre · correcció.** He actualitzat el comentari obsolet de `NotesEditor.jsx` (~l. 163), que encara deia que `PublicacioDetall` conserva el seu peu. Només canvia el comentari i el codi queda idèntic. Després he passat `npx eslint` (net) i `npx vitest run src/sections/notes/NotesEditor.peuDePagina.test.jsx src/sections/notes/qualitat.test.js` (2 fitxers, 17/17 verdes).
- **Àrbitre · defecte menor (per al Bloc 2).** En mode remot, l'adopció (`creaNota` + `updateNote`, que la lliga amb `isPublished`) s'executa ABANS de les guardes de `publishNote` (`nomesLectura`, signatura aliena, canvi de secció). Si alguna d'eixes guardes rebutja, queda una nota lligada a una fila que no s'ha enviat. El risc és baix perquè el Bloc només llista publicacions pròpies. La solució és fer les mateixes guardes abans d'adoptar, i per a això cal que `NotesContext` exposa `nomesLectura` (fitxer calent).
- **Àrbitre · defecte menor (fora del carril).** Les claus `section.notes.publicacio.noActualitzableActe` i `section.notes.publicacio.noActualitzableLlavor` no són a `src/config/idiomes/*`, i ara només es veu la reserva en valencià. El Bloc 2 les ha d'afegir als diccionaris.

- **19:42** · **Àrbitre · veredicte.** Acceptat amb correccions, amb el requisit complit A MITGES. El peu ha eixit del Bloc i les publicacions del Mur i de l'agenda (`manifest-de-poble`, `aplec-2023`) s'obrin editables a `NotesEditor`. En canvi, «Actualitzar al Mur» només reescriu una fila del Mur amb UUID. Per a la llavor editorial i per als actes, l'editor rebutja amb un motiu i no persistix res, així que el canvi NO arriba a `/mur` ni a la ruta dedicada.
- **Proves executades.** `npx vitest run` de `PublicacioEditable`, `PublicacioDetall.{peuDePagina,sistema,mercat,boina,capcalera,imatgesPropies,traduccio,visor}`, `ConnexioDetall`, `NotesEditor.peuDePagina`, `NotesSection.peuDePagina` i `qualitat{,.masLector}` (14 fitxers, 146/146 verdes). També `i18n.claus`, `PedraSeca/qualitat.nucliApps`, `DocumentEditor.peuDePagina`, `visibilitatTraduible.seguretat`, `TextSection.appNativa`, `paginaDeText`, `NotesSection.{fontPublicacio×5,mas,aliesResolt,triaAutomatica,test}` (15 fitxers, 547/547 verdes).
- **Per al Bloc 2.** (1) Un magatzem de revisions editorials (patró de `data/publicacionsEsborrades.js`) que lligen `MurContext`, `ItemDetailSection` i la ruta, o bé migrar la llavor a `section_submissions` amb UUID. (2) Un camí d'escriptura per als actes. (3) Fer les guardes abans d'adoptar. (4) Afegir les claus i18n. (5) Persistir l'esborrany (IndexedDB) perquè no es perda en canviar d'element. (6) Verificar-ho al navegador, al Vite :3340. Res no està versionat; `PublicacioEditable.jsx`, `publicacioEditable.js` i `PublicacioEditable.test.jsx` continuen sense seguiment.

<!-- R6B1:S2:FI -->

### Subagent 3 · P0-26 / IDEA-97 · Manifest i Aplec 2023 com a contingut editable

- **19:27** · **Inici.** Subagent 3 (P0-26 / IDEA-97) arranca: inventari de `ManifestDePobleArticle.jsx` i `Aplec2023Article.jsx`, descoberta de l'editor TipTap i del renderitzador públic de `content`, després migració a `item.content` HTML.

- **19:31** · **Diagnosi (ubicació real).** Els articles no són a `src/components/articles/` sinó a `src/sections/mur/articles/` (`ManifestDePobleArticle.jsx` 98 l., `Aplec2023Article.jsx` 200 l., `aplec2023Content.js` amb `APLEC_GALLERY` de 34 fotos). Es pinten per id, en JSX dur, a `src/sections/detail/detailSectionMeta.jsx:864-865` (Mur, `item.id === 'manifest-de-poble'`) i `:998-999` (Agenda, `item.id === 'aplec-2023'`), ignorant `item.content`. Les llavors: `src/sections/mur/feedSeed.js` (`MANIFEST_DE_POBLE_POST.content` = resum en text pla) i `src/sections/mur/eventsSeed.js` (`CALENDAR_EVENTS[0]`, sense `content`). No hi ha `notesSeed.js`.
- **Còpia remota.** `supabase/seed.sql` (app_content): el Manifest porta el mateix `content` de text pla i l'Aplec no en porta cap; `content.js:188` fa que en remot l'acte vinga d'app_content. Per tant la vista ha de caure en la llavor canònica quan `item.content` no és HTML.
- **Editor (TipTap 3.31).** StarterKit (h2–h6, negreta, cursiva, llistes, `hr`, cita, Link amb `class`/`target`/`rel`), `SdpImage` de bloc (src, alt, title, width, height, **sense href**), `Subtargeta` (`div.sdp-subtargeta[data-sdp-subtargeta]`). Cap node de vídeo/iframe ni `figure`.
- **Renderitzador públic.** `renderRichText` → `sanitizeHtml(resolRecursosDeHtml())` (DOMPurify): deixa `div/p/h3/h4/a/img/ul/li/hr/strong/em` amb `class`, `target`, `rel` i `data-*`; **lleva `iframe`, `figure`, `figcaption`, `details`, `summary`, `section`, `time`, `id`, `aria-*`**. El visor (`VisorDePublicacio.jsx:293`) marca les `img` de `.detail-content` que no són dins d'un enllaç ni fan <48 px.

- **19:32** · **Inventari · Manifest (WP 16893).** 7 `h3` (document obert, dos pilars, vertebrar-nos, un Aplec, adhesió, font) + 2 `h4` (Despoblament, Abandonament); 8 imatges: logotip→PDF, pàgina 1→PDF, Facebook 128 px→FB, 3 logotips clicables (`zona14.org`, `/rentonar`, `/socdepoble`), cartell A4→`/events/aplec-2023`, ponents (enllaç a la imatge); 2 botons secundaris (PDF, propostes) i 1 primari d'adhesió (`forms.gle`, `sdp-sr-only`); enllaç cap a l'Aplec en 3 llocs; avís CC BY-NC-SA.
- **Inventari · Aplec (WP 16880).** Vídeo YouTube nocookie `TlZWYbnGuCE` (iframe) + enllaç a YouTube; 25+9 fotos de `APLEC_GALLERY` sense enllaç (obrin el visor), les 9 dins de `<details>`; nota de premsa (5 paràgrafs, que també viuen duplicats a `APLEC_PRESS_PARAGRAPHS`); Telegram, Facebook, 3 logotips externs, cartell A4 per enllaç, ponents, llista de 12 ponents, foto de reunions, logotip del Manifest→`/mur/manifest-de-poble`; 9 imatges enllaçades (43 en total).
- **Disseny.** El document sencer passa a `item.content` (HTML) amb només nodes que l'editor i el sanejador comparteixen: `figure`/`figcaption`→`img`+`p`, `details`→`h4`, adhesió→`Subtargeta` (`div.sdp-subtargeta[data-sdp-subtargeta]`) amb el botó com a enllaç `a.sdp-boto` (Link de TipTap conserva `class`). El vídeo, que el sanejador no deixa (iframe), queda com a complement declaratiu `video_youtube: { id, titol }` a la llavor, pintat pel component. Els components passen a ser embolcalls prims: pinten `item.content` si és HTML i, si no (còpia remota d'app_content en text pla o sense cos), la llavor canònica; una sola còpia del text.

- **19:34** · **Pegat 1 · Manifest.** Nou `src/sections/mur/articles/cosCanonic.js`: `cosDeLArticle(item, canonic)` (pinta `item.content` si `semblaHtml`, si no la llavor) i `cosPerAPintar(html)` (el mode estricte `sanitizeHtml(..., { imatgesPropies: true })` de `cosAmbImatgesPropies` + `resolRecursosDeHtml` + els `href="/assets/…"` a la base de l'amfitrió, que `resolRecursosDeHtml` no reescriu). Nou `manifestDePobleContent.js` amb les 4 URL i `MANIFEST_DE_POBLE_HTML` (tot el text, 8 imatges, 3 botons, logotips clicables, adhesió dins d'una `Subtargeta`). `feedSeed.js`: `content: MANIFEST_DE_POBLE_HTML` (el resum pla antic es retira; la targeta ja usa `entradilla`). `ManifestDePobleArticle.jsx` passa a embolcall prim `<div class="manifest-de-poble">` sobre `renderPostContent` i reexporta les URL.

- **19:36** · **Pegat 2 · Aplec.** `aplec2023Content.js` (mòdul pur, el llig també `scripts/generate-supabase-seed.mjs`): nou `APLEC_VIDEO` (`{ id: 'TlZWYbnGuCE', titol }`) i `APLEC_2023_HTML` (25 KB, 43 imatges) construït des d'`APLEC_GALLERY` i `APLEC_PRESS_PARAGRAPHS`, que ara són l'única font de la galeria i de la nota de premsa (el JSX duia una segona còpia literal dels 5 paràgrafs). `<details>` → `div.aplec-2023__complement` + `h4`; `figure` → `div` + `p.aplec-2023__peu`. `eventsSeed.js`: `content: APLEC_2023_HTML`, `video_youtube: APLEC_VIDEO`. `Aplec2023Article.jsx`: embolcall prim `<div class="aplec-2023">` amb l'iframe nocookie (id validat amb `/^[A-Za-z0-9_-]{11}$/`, `videoDeLAplec`) i el cos per `renderRichText(cosPerAPintar(cosDeLArticle(item, APLEC_2023_HTML)))`.
- **Pegat 3 · `detailSectionMeta.jsx`.** Només 2 línies: `<ManifestDePobleArticle item={item} />` (`:865`) i `<Aplec2023Article item={item} />` (`:999`). La guarda `qualitat.imatgesPropies.test.js` (3 `cosAmbImatgesPropies(item.`) no canvia.
- **Decisió de format.** El vídeo queda damunt del cos (el títol «El 2n Aplec a À Punt NTC» passa a ser el primer bloc editable, davall del vídeo): així tot el text és editable i l'únic bloc no editable és l'iframe.

- **19:38** · **Pegat 4 · proves.** `cosPerAPintar` jutja el mode estricte sobre el valor guardat (`/assets/…`) i deixa el `src` a `renderRichText`; amb base d'amfitrió, el sanejador (`sanitize.js:150-160`, també el no estricte) bloqueja qualsevol imatge d'un origen no registrat: l'amfitrió real el registra (`PedraSecaEmbed.jsx:990`), i les proves ara també (`permetOrigenMitjans`). `ManifestDePobleArticle.test.jsx`: `rel` admet el `nofollow` del sanejador; +2 proves (llavor amb el document sencer i cap node fora del contracte; fitxa del Mur pinta `item.content` editat i cau en la llavor amb el text pla d'app_content). `Aplec2023Article.test.jsx`: galeria per `div[data-wp-media-id]` (25+9, cap `<a>`); +2 proves (llavor + `video_youtube`; fitxa de l'acte amb cos editat, sense cos, i id de vídeo injectat → canònic).
- **Prova.** `npx vitest run src/sections/mur/articles/ManifestDePobleArticle.test.jsx src/sections/mur/articles/Aplec2023Article.test.jsx` → **18/18 verdes**.

- **19:38** · **Prova de cobertura.** `npx vitest run src/sections/detail/CosAmbVisor.test.jsx src/app/enllacosInterns.test.js src/config/assetResolver.test.js src/sections/mur/qualitat.imatgesPropies.test.js src/sections/mur/eventsSeed.test.js src/sections/mur/seedSql.autoria.test.js` → **165/166**. Verds: el visor (les 34 fotos de l'Aplec marcades, en ordre), els enllaços Aplec↔Manifest pel router, la guarda del mode estricte i les llavors. **Roig (causat per este carril):** `src/config/assetResolver.test.js:524` «l’article de l’Aplec pinta les seues imatges amb la base vigent»: fixa la base sense registrar l'origen del paquet, i ara el cos passa pel sanejador.
- **Petició (fora del meu carril, 1 línia).** A `src/config/assetResolver.test.js`: importar `permetOrigenMitjans` de `../utils/sanitize.js` (línia 33) i cridar `permetOrigenMitjans(PAQUET);` just darrere de `fixaBaseRecursos(PAQUET);` dins d'eixa prova (com fa `detailSectionMeta.recursos.test.jsx:66`). És el que fa l'amfitrió real (`PedraSecaEmbed.jsx:990`).

- **19:38** · **Prova de veïnat.** `npx vitest run` sobre 16 fitxers que nomenen el Manifest o l'Aplec (`publicacionsDelPoble`, `masDeLUsuari`, `VisorDePublicacio.sencer`, `ItemDetailSection.capcalera`, `PublicacionsDeLActor`, `MurSection.agenda`, `TargetaDelMur.*` ×3, `usePublicacionsDeLActor`, `agendaMur`, `datesDeProvaMur`, `barraBlavaEstreta.capes`, `esdeveniment`, `detailSectionMeta.recursos`) → **287/287 verdes**.

- **19:39** · **Pegat 5 · prova d'editor.** Nou `src/sections/mur/articles/cosCanonic.editor.test.js`: obri els dos documents en un `Editor` de TipTap amb les mateixes extensions de `useUniversalRichText` (StarterKit h2–h6 + `SenseSubratllat` + `extensionsRiques()`) i comprova que `getHTML()` conserva tots els `h3`/`h4`, les 8 i 43 imatges, la `Subtargeta` d'adhesió, els botons `a.sdp-boto--primari/secundari`, la llista de 12 ponents i els enllaços Manifest↔Aplec. `npx vitest run src/sections/mur/articles/cosCanonic.editor.test.js` → **3/3 verdes**.
- **Límit conegut (fixat per prova).** `SdpImage` no té `href`: en desar des de l'editor, una imatge dins d'un `<a>` (els 3 logotips, el logotip→PDF, el cartell→Aplec, Telegram, Facebook…) es queda sense enllaç i passa a obrir el visor. La lectura pública de la llavor els conserva clicables. **Per al Bloc 2 (carril de l'editor, `src/components/universal/richText/extensions/index.js`):** afegir a `SdpImage` un atribut `href` (parseHTML des del pare `a`, renderHTML embolcallant amb `<a href target rel>`), i esborrar llavors el tercer test.

- **19:40** · **Verificació al Vite del Mestre (`:3340`, pane del navegador, DOM).** `/events/aplec-2023`: `.aplec-2023` amb l'iframe `youtube-nocookie.com/embed/TlZWYbnGuCE`, 43 imatges, **34 marcades pel visor** (`data-sdp-ampliable`), 0 bloquejades, primer `h3` «El 2n Aplec a À Punt NTC». `/mur/manifest-de-poble`: 8 imatges, 0 bloquejades, 6 `h3`, 4 enllaços a `/events/aplec-2023`, 3 logotips clicables (`zona14.org`, `/rentonar`, `/socdepoble`) en graella de 3 columnes a 1280 px, botons centrats (`flex`, `center`), adhesió dins de la `Subtargeta` amb vora, sense scroll horitzontal. Cap captura de píxels (el pane estava amagat; s'ha emulat 1280×900 i s'ha restaurat).

- **19:40** · **Veredicte S3 (P0-26 / IDEA-97).** **FET:** el Manifest i l'Aplec viuen sencers en `item.content` (HTML) de `feedSeed.js` i `eventsSeed.js`; les vistes `/mur/manifest-de-poble` i `/events/aplec-2023` pinten des d'eixe contingut (un sol text, cap còpia JSX); el contingut s'obri a l'editor de Notes sense perdre títols, imatges ni botons; `npx eslint` net sobre els fitxers tocats; 3+18+165+287 proves verdes menys 1 roja fora del carril. Contracte amb S2: el document és `item.content`; si S2 desa una edició amb el mateix id, la fitxa la pinta tal qual (si és HTML).
- **NO FET / per al Bloc 2.** (1) Aplicar la línia de `permetOrigenMitjans(PAQUET)` a `src/config/assetResolver.test.js:524` (roja per este canvi; el codi és correcte). (2) `href` a `SdpImage` perquè els logotips enllaçats sobrevisquen a una edició. (3) Regenerar `supabase/seed.sql` amb `scripts/generate-supabase-seed.mjs` perquè app_content porte el cos ric (mentrestant la fitxa cau en la llavor). (4) El vídeo de NTC continua sent un complement declaratiu (`video_youtube`) no editable des de `/notes`. (5) `searchText` del Mur inclou ara les etiquetes HTML del cos (com qualsevol article importat de WP): millora possible en `feedContent.js`. (6) Comentari obsolet a `src/sections/mercat/imatgesDeProducte.js:10` sobre `Aplec2023Article`.
- **Fitxers del carril.** Nous: `src/sections/mur/articles/cosCanonic.js`, `manifestDePobleContent.js`, `cosCanonic.editor.test.js`. Modificats: `ManifestDePobleArticle.jsx`, `Aplec2023Article.jsx`, `aplec2023Content.js`, els dos `.test.jsx`, `src/sections/mur/feedSeed.js`, `src/sections/mur/eventsSeed.js`, `src/sections/detail/detailSectionMeta.jsx` (2 línies, `:865` i `:999`). Cap commit.

- **19:41** · **Àrbitre · inici.** Àrbitre Gauntlet del carril 3 (P0-26 / IDEA-97) arrancat. Revisaré el diff d'esta onada en `src/sections/mur/articles/*`, `feedSeed.js`, `eventsSeed.js` i les 2 línies de `detailSectionMeta.jsx`, eslint i els tests concrets.

- **19:43** · **Àrbitre · revisió del diff.** Contingut fidel: el text, les 8 imatges del Manifest i les 43 de l'Aplec, la llista de 12 ponents, la nota de premsa, el botó d'adhesió dins la Subtargeta i l'enllaç d'anada i tornada (`/events/aplec-2023` ↔ `/mur/manifest-de-poble`) passen del JSX vell a `manifestDePobleContent.js` i `aplec2023Content.js` sense pèrdues. Una sola còpia del text: els components són embolcalls prims (`cosDeLArticle` + `cosPerAPintar` → `sanitizeHtml(..., { imatgesPropies: true })`, sense cap camí cru de `dangerouslySetInnerHTML`). En `detailSectionMeta.jsx` només canvien les 2 línies (:865, :999) i no es reverteix res d'una altra mà. Les portes de la casa estan netes (cap `style={{}}`, cap `<h1>`, cap color cru, cap «masia»). `npx eslint src/sections/mur/articles/ src/sections/mur/feedSeed.js src/sections/mur/eventsSeed.js` → net.
- **Àrbitre · proves.** `npx vitest run src/sections/mur/articles/ src/config/assetResolver.test.js src/sections/detail/detailSectionMeta.recursos.test.jsx src/sections/mur/eventsSeed.test.js src/sections/mur/qualitat.imatgesPropies.test.js` → 70/71: 7 fitxers, 1 en roig. L'única fallada és `src/config/assetResolver.test.js:523` («l'article de l'Aplec pinta les seues imatges amb la base vigent»): ix 43 `src` a `null` perquè l'origen `PAQUET` no està registrat. En producció no passa, perquè `PedraSecaEmbed.jsx:990` registra l'origen, com amb qualsevol cos importat de WP. És un ajust de la prova fora del carril: després de `fixaBaseRecursos(PAQUET);` cal `permetOrigenMitjans(PAQUET);` (import de `../utils/sanitize.js`).

- **19:43** · **Àrbitre · defecte D1 (dissenys, per al Bloc 2).** He passat una sonda per TipTap amb les extensions de `cosCanonic.editor.test.js` i l'he esborrada després. Quan es desa des de l'editor, es perden TOTS els contenidors de maquetació: `.aplec-2023__galeria` (0), `.aplec-2023__figura` (0), `.manifest-de-poble__organitzadores` (0), `.manifest-de-poble__documents` (0) i `p.sdp-paragraf-centrat` (0). Sobreviuen el text, els 43 `img` i els 9 `hr`. És a dir, la primera edició desada aplanaria les graelles de fotos i de logotips, els botons centrats i els paràgrafs centrats. El constructor només va documentar l'enllaç al voltant de la imatge. Avui no es materialitza, perquè `publicacioEditable.js` no envia la llavor (no té UUID). Però cal un node «bloc amb classe» o una graella al carril de l'editor (`src/components/universal/richText/extensions/`) abans d'obrir el desament.
- **Àrbitre · defecte D2 (per al Bloc 2).** `cosDeLaPublicacio` (`src/sections/notes/publicacioEditable.js:35`) agafa `item.content` tal qual. Si el Mur arriba de l'`app_content` remot (`supabase/seed.sql:9`, `feedPosts` amb el `content` vell en text pla), l'editor de `/notes` obri el resum curt i la vista pública pinta el canònic. Això són dues còpies divergents. Hi ha dues eixides: regenerar `supabase/seed.sql` (`scripts/generate-supabase-seed.mjs`) i la càrrega remota, o que `/notes` faça el mateix recurs al canònic que `cosDeLArticle`.
- **Àrbitre · menors.** Hi ha tres canvis menors. El vídeo ara es pinta damunt del títol «El 2n Aplec a À Punt NTC». Les 9 fotos complementàries ja no estan plegades en un `details`. Els peus de foto ara són `<p>` i no `figcaption`, i `.manifest-de-poble figcaption` / `.aplec-2023__galeria figure` de `modules.css:14430-14478` ja no apliquen: el peu perd el color suau i el marge de figura. Cal un ajust de CSS fora del carril.

- **19:43** · **Àrbitre · veredicte.** Acceptat, sense correccions meues. La migració P0-26 / IDEA-97 està completa: hi ha una sola còpia, el cos és sanejat i el contracte `item.content` (HTML que comença per `<`) es compleix amb el subagent 2. Proves: `npx vitest run src/sections/mur/articles/ src/config/assetResolver.test.js src/sections/detail/detailSectionMeta.recursos.test.jsx src/sections/mur/eventsSeed.test.js src/sections/mur/qualitat.imatgesPropies.test.js` → 70/71 (l'única fallada és `assetResolver.test.js:523`, amb la causa de la prova). Eslint net. Per al Bloc 2: (1) arreglar la prova de `assetResolver.test.js:523`; (2) D1, que l'editor conserve els contenidors amb classe i l'`href` de les imatges; (3) D2, el `seed.sql` / `app_content` vell, que fa divergir `/notes` de la vista pública; (4) el CSS de peus i figures de `modules.css`; (5) el comentari obsolet de `src/sections/mercat/imatgesDeProducte.js:10`. No s'ha fet cap commit.

<!-- R6B1:S3:FI -->

### Subagent 4 · Auditoria adversarial de `064ec0137..c49d173c4`

- **19:27** · **Triatge (abast real).** `git diff --shortstat 064ec0137..c49d173c4` = **484 fitxers** (+50 230/−2 017; 298 A, 16 D, 170 M). Sota `src/` només **193** (46 A, 147 M, 0 D; +28 420/−840). La xifra «337» no correspon a `src/`; el gruix fora és `tooling/node0` (88), `public/assets` (69), `tests/` (~25), `.agents/runtime` (16, fora del meu abast).
- **Mapa de risc (ordre d'atac).** (1) sessió/xarxa Node 0: `src/data/node0Client.js`, `src/data/node0/{clientPrivatNodeZero,sessioNodeZeroHttp,adaptadorNodeZeroHttp,arrencadaNodeZero}.js`, `src/data/local/*`, `src/data/backendPort.js`, `src/main.jsx`; (2) seguretat/HTML: `src/utils/transformadorEditorialWpBlogger.js`, `src/data/importacio/mapaEnllacosInternsWp.js`, `src/data/federacio/pontMastodon.js`, `src/utils/sanitize.js`, `src/components/PedraSeca/hooks/useTraduccioTargeta.js`; (3) eliminacions grans: `UniversalCard.jsx` (+2/−78), `EventCard.jsx` (+3/−42); (4) admin nou: `src/sections/profile/admin/*` + `PerfilShell.css`; (5) llavors: `townsSeed.js`, `poblesAplecViquipedia.js`, `feedSeed.js`, `aliesDePoblesSeed.js` (−12); (6) editor: `UniversalEditorShell.jsx`, `NotesEditor.jsx`, `BotoneraClassificacio.jsx`; (7) CSS: `modules.css`, `components.css`, `layout.css`, `tokens.css`.
- `src/data/taxonomia/tesaurusDoctoralSocDePoble.js` (+16 618) és dades: només grep, no lectura lineal.

- **19:28** · **R5-D6 · classes sense CSS (comprovat sobre l'arbre viu, tots els `src/**/*.css`).** No existeix cap classe `sdp-perfil-admin__*` (ni en JSX ni en CSS): el deute real són les **`sdp-admin-*`** + `sdp-mur-revisio-*`. Total **55 úniques sense regla**: 39 en `src/sections/profile/admin/*.jsx` + 14 en `src/sections/mur/MurSection.jsx` + 2 en `src/sections/control/ModeRural.jsx`.
- **P1 · `src/sections/profile/admin/*.jsx` vs `src/sections/profile/PerfilShell.css:523`** — desajust de noms: el CSS integrat usa noms en valencià (`__taula-wrap`, `__filtres`, `__metriques`, `__facetes`…) i el JSX usa noms en anglés (`__table-wrap`, `__filters`, `__kpis`, `__grid`…). Resultat: **25 regles `.sdp-admin-*` òrfenes** (cap JSX les usa) i 39 classes JSX nues → els tres panells admin es pinten sense maquetació. Fix Bloc 2: renomenar el JSX als noms valencians del CSS on hi haja equivalent i crear la resta en Pedra Seca (no a l'inrevés).
- **P1 · botons inexistents** — `sdp-btn`, `sdp-btn--primari`, `sdp-btn--secundari` (`PanellsAdministracioSistema.jsx:410,413,416,479`; `BancImportacioEditorial.jsx:136`) no tenen cap regla; la casa usa `sdp-boto sdp-boto--primari|--secundari` (60 regles). Igual `sdp-card`, `sdp-input`, `sdp-select`, `sdp-table`, `sdp-muted`, `sdp-divider` (`LaboratoriTaxonomiaDoctoral.jsx`): genèrics inventats sense CSS. Fix: substituir per les classes/àtoms de Pedra Seca.
- **Llista per component.** `LaboratoriTaxonomiaDoctoral.jsx` (21): `sdp-admin-taxonomia__{badges,card,card-top,controls,diagnostic,filters,grid,header,lead,pagination,section,simulador,status,table-wrap,tabs,toolbar}` + `sdp-card sdp-divider sdp-input sdp-select sdp-table`. `BancImportacioEditorial.jsx` (21): `sdp-admin-{actions-inline,dl,kpi,pagination,pill,pills,status-ok,table}`, `sdp-admin-importacio__{inspector,layout,notes}`, `sdp-admin-taxonomia__{badges,header,kpis,panel,selects,table-wrap,toolbar}` + `sdp-btn sdp-btn--secundari sdp-muted`. `PanellsAdministracioSistema.jsx` (13): subconjunt dels anteriors + `sdp-btn--primari`. `MurSection.jsx` (14): `sdp-mur-revisio-{badge,bar,toggle}`, `sdp-mur-revisio-card{,__accions,__estat,__insignies,__meta,__titol-link,__top}`, `sdp-mur-revisio-panel{,__filtres,__header,__llista}`. `ModeRural.jsx` (2): `sdp-mode-rural__punts`, `sdp-dtn-delta`.
- Script reproduïble: `python3 <scratchpad>/r6s4_classes_wt.py` (i `r6s4_orfes.py` per a les òrfenes).

- **19:29** · **Lot 1 · sessió/xarxa Node 0 (11 fitxers: `main.jsx`, `backendPort.js`, `contracte.js`, `conformitat/kit.js`, `local/adaptadorLocal.js`, `local/*NodeZero*` (3 reexportacions), `node0/*` (4), `node0Client.js`).** El transport privat (`sessioNodeZeroHttp.js`) és acurat: `redirect:'error'`, `cache:'no-store'`, abort amb neteja d'escoltadors, sense tokens a magatzem. Les 4 capacitats noves de correu són opcionals i declarades a `CAPACITATS_NO_DECLARADES` del local: coherent.
- **P2 · `src/main.jsx:39,97`** — en mode `VITE_SDP_NODE0_HTTP=1`, si `preparaArrencadaNodeZero()` o `arrenca()` fallen, `init()` rebutja abans de `createRoot` i només queda `console.error`: pantalla en blanc sense cap missatge. Fix: pintar un avís mínim («No es pot connectar amb el Node 0») al `#root` via React o una pàgina d'error estàtica.
- **P3 · `src/main.jsx:17` + `:38`** — `arrencadaNodeZero.js` s'importa estàticament (per la bandera) i dinàmicament alhora: el `import()` no crea cap tros separat (Vite ho avisa). Inofensiu; o bé llevar el dinàmic o moure la bandera a un mòdul apart.
- **P3 · `src/data/node0Client.js` (412 línies)** — cap consumidor fora de proves (codi mort publicat). A més: `:67` bucle `for…continue` que no fa res (lògica a mitges); `:173` el límit de 512 KB s'aplica després de bufferitzar tot el cos (`resposta.text()`), sense lectura per trossos; els camps URL (`image_url`, `url`, `source_url`, `hero_url`) passen sense validar l'esquema → si algú el connecta a la UI, `javascript:` entraria en `href`. Fix quan es connecte: validar `https?:` i llegir amb `getReader()` tallant als 512 KB.

- **19:31** · **Lot 2 · seguretat/HTML i targetes (9 fitxers: `transformadorEditorialWpBlogger.js`, `mapaEnllacosInternsWp.js`, `sanitize.js`, `sondaConnexions.js`, `pontMastodon.js`, `useTraduccioTargeta.js`, `UniversalCard.jsx`, `SquareBadge.jsx`, `EventCard.jsx`+`editorial.js`).** `sanitize.js` només afig `lang` (ok); `EventCard`/`UniversalCard` són trasllats fidels (`insigniaDeCalendari`→`editorial.js`, `SquareBadge`→fitxer propi; reexportats).
- **P2 · `src/sections/detail/elementDeSeccio.js:79` + `src/utils/transformadorEditorialWpBlogger.js:332-365`** — tot `/mur/<id>` que no casa cap element cau ara en un article del simulador WP (`ARTICLES_SIMULADOR_IA_425`) amb `content: ''` (cos buit), autor fix «Sóc de Poble» i poble per defecte «La Torre de les Maçanes». Escenari: URL vella o slug d'importació → pàgina «publicada» sense text en lloc del 404. Fix: retornar la previsualització només amb marca explícita (p. ex. `?revisio=wp` o rol admin) i omplir `content` amb `htmlNet` sanejat.
- **P2 · mateix fitxer, `:259,274,301,331`** — el paràmetre per defecte `storage = window.localStorage` s'avalua FORA del `try`: en Safari amb galetes blocades o iframe aïllat el getter llança `SecurityError` → `trobaElement()` peta per a qualsevol `/mur/<id>` desconegut. Fix: `const storage = llegeixStorageSegur()` dins de try/catch.
- **P2 (latent) · `transformadorEditorialWpBlogger.js:84-93`** — `transformaHtmlEditorialPedraSeca` no saneja res (conserva `<script>`, `on*=`); la llista blanca de vídeo és per subcadena (`https://atacant.example/?youtube.com` passa com a `<iframe>`), i `srcUrl` s'interpola sense escapar en `href`/`data-original-iframe` (un `"` dins d'un src entre cometes simples trenca l'atribut; `javascript:` passa a l'`<a>`). Avui `htmlNet` no es pinta enlloc; quan es connecte, cal `new URL()`+host exacte i passar per `src/utils/sanitize.js`.
- **P2 · `src/components/PedraSeca/organismes/SquareBadge.jsx:63-67`** — nou `<time onClick={navegaAlCalendari}>` sense `role`, `tabIndex` ni teclat: interacció inabastable per teclat/lector (porta de botons accessibles). Fix: embolcallar en `<button type="button">` o `Link` amb `aria-label`.
- **P3 · codi sense consumidors** — `src/components/PedraSeca/hooks/useTraduccioTargeta.js` (355 l.) i `src/data/federacio/pontMastodon.js` (195 l.) no els importa cap fitxer de producció (només proves). Decidir connectar-los o moure'ls al seu paquet.

- **19:32** · **Lot 3 · administració al perfil (7 fitxers: `PerfilShell.jsx`, `perfilModel.js`, `admin/{LaboratoriTaxonomiaDoctoral,BancImportacioEditorial,PanellsAdministracioSistema}.jsx`, `PerfilShell.css`, `tesaurusDoctoralSocDePoble.js` per grep).**
- **P1 · `src/sections/profile/PerfilShell.jsx:240` vs `admin/PanellsAdministracioSistema.jsx:180`** — es passa `grupsNavegacio={grupsNavegacio}` però el component espera `navigationGroups`: rep sempre `[]` i el panell «Ajustos de vistes i columnes» no llista cap carpeta (funció morta). Present al commit i a l'arbre viu. Fix d'una línia: `navigationGroups={grupsNavegacio}`.
- **P1 · `src/sections/profile/perfilModel.js:111-116` + `PerfilShell.jsx:228`** — el grup «🛡️ Administració del sistema» i els 6 panells (`admin-taxonomia`, `admin-importacio`, `admin-crom`…) es pinten a TOTA persona amb sessió, sense `useSuperadminEstable()` (que el mateix fitxer ja usa a `:461` per a les utilitats internes). `PanellCromIntegrat` crida `adminDesaPersonalitzacio` (el servidor ha de rebutjar, però la UI promet un poder que no hi ha). Fix: filtrar grup i ítems per `superadmin` com les `aplicacions.intern`.
- **P1 (plausible, sense build) · pes** — `src/utils/transformadorEditorialWpBlogger.js:10-13` importa `tesaurusDoctoralSocDePoble.js` (514 KB en brut) i `mapaEnllacosInternsWp.js`; com que `src/sections/detail/elementDeSeccio.js:46` l'importa i `elementDeSeccio` el compartixen Mur, Mercat, Notes, Pobles i el detall, el tesaurus entra al tros comú de quasi totes les seccions. Fix: `import()` dinàmic dins de `trobaArticleImportatComAPublicacio` o un índex lleuger slug→meta. Verificar amb `vite build` + `pesDelNucli.test.js`.
- **P3 · `PanellsAdministracioSistema.jsx:305-312`** — `fetch('/api/v1/node0/status')` sense timeout ni `AbortController` (setState després de desmuntar) i fusió cega `...json` dins de l'estat (contradiu la «coacció primitiva» de `node0Client.js`). Fix: reutilitzar `consultaEstatNode0()` de `src/data/node0Client.js` (de pas li dona consumidor).

- **19:33** · **Lot 4 · llavors i pobles (10 fitxers: `aliesDePoblesSeed.js`, `aliesDePobles.test.js`, `clauDelPoble.js`, `fitxaDelPoble.js`, `poblesAplecViquipedia.js`, `townsSeed.js`, `usePobleHidratat.js`, `censImatges.js`, `origenImatges.js`, `eventsSeed.js` per grep).** Comprovat: els 12 municipis retirats d'`aliesDePoblesSeed.js` (Balones, Benillup…) passen a la llavor AH-27 (prova ajustada 53→41, coherent). Les 22 entrades de `DADES_POBLES_APLEC_VIQUIPEDIA` porten `imatges`, `wikipedia_hydration`, `wikipedia_provenance`, `image_url`, `avatar_url` (validat amb node). Tots els `/assets/…` afegits en fitxers no de prova existixen a `public/` (0 trencats).
- **P1 (és del carril S1) · `src/sections/pobles/townsSeed.js:~181`** — la fusió `{ ...anterior, ...poble }` xafa imatges/coords pròpies de La Torre de les Maçanes; no ho dupliquem ací.
- **P2 (plausible) · `src/sections/pobles/fitxaDelPoble.js` (capçalera: «la part pura que va al tros principal»)** — ara importa estàticament `poblesAplecViquipedia.js` (1 607 línies de dades) per a `fusionaAmbFitxaEditorial`: el pes entra al tros principal. Fix: moure `fusionaAmbFitxaEditorial` a un mòdul diferit o carregar la llavor amb `import()`; validar amb `pesDelNucli.test.js` després d'un build.
- **P3 · `aliesDePobles.test.js`** — compta Benialfaquí (pedania de Famorca) dins dels 25 «municipis» d'El Comtat: la dada de comarca deixa de ser un recompte de municipis. Decidir si la pedania ha d'anar com a `parent_poble_id` fora del recompte.
- **P3 · `clauDelPoble.js` `poblesEsmentatsDeLaPublicacio`** — llig també `item.tags`/`item.labels`: una etiqueta genèrica que coincidisca amb un slug de poble («planes», «gorga», «tollos») marca la publicació com «parla del poble» a la pestanya «xarxa». Risc de falsos positius; limitar a `pobles_esmentats`/`pobles_etiquetats`.

- **19:35** · **Lot 5 · editor, Mur i detall (8 fitxers: `BotoneraClassificacio.jsx`, `NotesEditor.jsx` (+3 proves d'àmbit), `UniversalEditorShell.jsx`, `PageFrame.jsx`, `MurSection.jsx`, `detailSectionMeta.jsx`, `idiomes/*.js`).** Les 8 claus `t()` noves del diff existixen als 5 diccionaris (0 absents). La retirada del xip «Àmbit» de la botonera és intencionada (AH-24, proves reescrites).
- **P1 · `src/sections/mur/MurSection.jsx:354-361`** — el botó «🔍 Mode Revisió d'Importació (Admin)» i el panell amb «✅ Aprovar / 📝 Anotar» es pinten a TOTA persona que obri `/mur` (també convidats), sense cap comprovació de rol; i `?revisio=wordpress` l'obri directament. Escriu a `localStorage` (`desaRevisioArticleImportat`). Fix: condicionar a `useSuperadminEstable().esSuperadmin` (o moure'l només al panell admin del perfil, que ja existix: `BancImportacioEditorial`).
- **P1 · `src/components/universal/classificacio/BotoneraClassificacio.jsx` `afigCarpeta` + `src/sections/notes/NotesEditor.jsx:392-406`** — «Crear nova carpeta» en línia només viu en estat React (`carpetesExtra`, `carpetesLocals`): no es crea cap carpeta al backend, però la nota es desa amb `folderId: 'f-<slug>'`. Escenari: crear «Festes», recarregar → la carpeta desapareix i la nota apunta a una carpeta fantasma. A més `slugDeCarpeta` col·lisiona («Fèstes» i «Festes» → `f-festes`, opcions amb `valor` duplicat). Fix: crear la carpeta per l'API de carpetes abans d'assignar-la, o deshabilitar el camp fins que hi haja API.
- **P2 · `src/components/universal/PageFrame.jsx:1099,1140` (+`LogoDeCapcalera`)** — `onClick` posat sobre `<img>` (portada i logotip) sense `role="button"`, `tabIndex` ni teclat: l'edició per clic de la imatge no és accessible. Fix: embolcallar en `<button type="button" aria-label="Ajusta la capçalera|el logotip">`.
- **P3 · `src/components/universal/UniversalEditorShell.jsx` (efecte de `peticioAmbit`, branca `else`)** — força `scrollTop = 0` a cada petició sense focus: si la persona estava avall, la vista salta a dalt. Comprovar que només passa en obrir l'editor.
- **P3 (és del carril S3) · `src/sections/detail/detailSectionMeta.jsx`** — branca fixa `item.id === 'manifest-de-poble'` → `<ManifestDePobleArticle />` i `getImage` → `null`: el contingut no és editable des de `/notes`; P0-26 ho ha de desacoblar.

- **19:36** · **Lot 6 · CSS i portes de la casa (escaneig mecànic de TOTES les línies afegides en els 193 fitxers).** CSS (`modules.css`, `components.css`, `layout.css`, `tokens.css`, `PerfilShell.css`): 0 colors en brut, 0 `var(--x, fallback)`, 0 `font-size` < 14 px; tots els `var(--sdp-*)` usats existixen (296 tokens definits, 0 absents). JS/JSX no de prova: 0 `style={{}}`, 0 `<h1>` en components, 0 `console.log`, 0 `dangerouslySetInnerHTML`, 0 `catch {}` buits nous. Únics `ALLOW_RAW_COLOR`: `correuBenvinguda.js:164-171` (HTML de correu, justificat) i `PanellsAdministracioSistema.jsx:130` (valor inicial del selector de color).
- **P3 · `src/css/layout.css` (`header.page-title.has-aside--sense-logo h1`)** — `padding-right: calc(128px + var(--sdp-space-4))` sense media query: a 375 px l'H1 sense logotip queda en ~200 px d'amplada al costat del quadrat absolut de 128 px. Comprovar al mòbil; potser baixar el quadrat davall del títol per sota de 480 px.
- **P3 · codi sense consumidors (onboarding)** — `src/sections/onboarding/correuBenvinguda.js` (260 l.) i `ProvaCorreuAmbContrasenya.jsx` (formulari «només revisió», amb `<input>`/`<button>` nus fora de Pedra Seca) no els importa cap ruta. Abans de connectar-los: usar `Camp`/`CampText`/`Boto` i el `ControlContrasenya` de la casa.
- **OK · `src/components/PedraSeca/atoms/ControlContrasenya.jsx`** — el pegat iOS d'autofill força `type`/`data-visible` també en amagar; coherent.

- **19:36** · **Lot 7a · App/estat (4 fitxers: `App.jsx`, `UIContext.jsx`, `UniversalWorkspace.jsx`, `pastillaCalendari.js`).** `UIContext` afig `language` al valor memoritzat (correcte); `UniversalWorkspace` afig `amagaRodaAjustos` (net); `usePastillaCalendari` tolera estar fora del Router.
- **P1 → REGRESSIÓ CONFIRMADA de permisos · `src/app/App.jsx` (AH-29 retira `<BotoCrom />`) + `src/components/universal/PanellCrom.jsx:151`** — la roda del Crom era només de superadmin (`if (rol !== 'superadmin') return null;`). El seu substitut `PanellCromIntegrat` (`src/sections/profile/admin/PanellsAdministracioSistema.jsx:34`) només mira `teCapacitat('personalitzacio')` (capacitat del backend, no rol) i viu dins del grup admin visible a tothom (vegeu Lot 3). Qualsevol persona pot previsualitzar/aplicar el crom i prémer «Desar» → `adminDesaPersonalitzacio`. Fix Bloc 2: reutilitzar el mateix criteri `rol === 'superadmin'` (o `useSuperadminEstable`) per al grup sencer i dins del panell.

- **19:37** · **Lot 7b · perfil, identitats i dades (8 fitxers: `ConnexionsPubliques.jsx`, `sondaConnexions.js`, `usePublicacionsDeLaFitxa.js`, `identitatsSeed.js`, `iaiaLocal.js`, `appSeed.js`, `PerfilEditor.jsx`, `ModeRural.jsx`).**
- **P2 · `src/data/identitatsSeed.js:530-537` (`aliesDeLActor`, branca entitat/grup)** — ara afig `actor.username`, `actor.handle` i `actor.alies` de la fila remota SENSE passar per `fundacionalDeLaClau` (la branca persona, `:546-551`, sí que filtra). Escenari: una organització creada en remot amb `handle: 'socdepoble'` (o `alies: ['el-rentonar']`) hereta els àlies d'una entitat fundacional → les publicacions d'esta li casen com a pròpies a la fitxa i a «és meu». Fix: aplicar el mateix filtre `fundacionalDeLaClau` (excepte si `entitatSeed` ja l'acredita). A més, el comentari de `:509-511` («en remot cap persona en rep») ja no és cert.
- **P2 · `src/sections/connectar/sondaConnexions.js` (`esErrorNoDisponibleConnexions`)** — qualsevol `status === 404` compta com «esquema absent» i `recordaSiNoDisponibles` el memoritza per a tot l'àmbit durant la sessió: un sol 404 transitori (subjecte inexistent, proxy) amaga Connectar a totes les fitxes fins que es recarrega. Fix: limitar el 404 a errors PostgREST amb `code` `PGRST20x`, no a l'status nu.
- **P3 · `src/sections/profile/ConnexionsPubliques.jsx` (`esErrorSilenciosConnexionsPubliques`)** — silencia també `jwt expired`/401: una persona amb sessió caducada veu desaparéixer el bloc sense cap avís per a renovar-la.
- **P3 · `src/data/iaiaLocal.js` (`senseContactes`)** — `/@?[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gu` és quadràtica sobre tokens llargs sense `@` (base64, URL llargues); risc baix (textos de pàgina), però contradiu «zero ReDoS». Fix: tallar la longitud del token (`{1,64}`).
- **OK** — `ModeRural.jsx` (poble del perfil sanejat), `PerfilEditor.jsx` (ajust de capçalera/logotip), `appSeed.js` (text tutorial; «Este» en valencià correcte).

- **19:38** · **Lot 8 · pobles i Viquipèdia (10 fitxers: `territoriDelPoble.js`, `TerritoriDelPoble.jsx`, `PublicacionsDelPoble.jsx`, `usePublicacionsDelPoble.js`, `publicacionsDelPoble.js`, `pobleDeViquipedia.js`, `cauDeViquipedia.js`, `adaptadors/viquipedia/recursos.js`, `fitxaDelPoble.js` (CAMPS_QUE_OMPLI), `idiomes/*`).** Claus i18n noves (també les dinàmiques `section.pobles.demarcacio.*`) presents als 5 diccionaris. `poblacioDe()` canvia de forma (torna l'objecte) i l'únic consumidor (`recursos.js:161`) està adaptat. Les fotos remotes de Commons NO entren a la capçalera (`CAMPS_QUE_OMPLI` no porta `image_url`): coherent amb D-3.
- **P2 · `src/sections/pobles/territoriDelPoble.js:15`** — `params.size` (URLSearchParams.size) no existix a Safari 16 / iOS 16: torna `undefined` i `rutaTerritorial()` dona sempre `/pobles` sense `?provincia=&comarca=`. Tots els enllaços del `CamiTerritorial` i de l'arbre de comarques perden el filtre en eixos dispositius (el codi de la casa declara compatibilitat Safari 16). Fix: `const q = params.toString(); return q ? `/pobles?${q}` : '/pobles';`.
- **P3 · `src/sections/pobles/fitxaDelPoble.js` (`hidrataFitxa`, filtre d'`omplits`)** — la branca `['image_url','avatar_url'].includes(camp) ? !teImatgeReal(...)` és morta perquè `CAMPS_QUE_OMPLI` no conté eixos camps; inofensiva però confon (el comentari de capçalera diu el contrari). Llevar-la o documentar-la.
- **P3 · `src/components/PedraSeca/hooks/useTraduccioTargeta.js`** — textos d'interfície amb «Aquesta targeta…» (no valencià de la casa: «Esta targeta»). El hook no té consumidors encara.

- **19:39** · **VEREDICTE S4 · llista prioritzada consolidada (per al Bloc 2).** No he tocat `src/` (carril de només lectura). C = confirmat al codi; P = plausible, cal verificar.
- **P1-a (C)** `src/sections/profile/PerfilShell.jsx:240` → `grupsNavegacio=` ha de ser `navigationGroups=` (`admin/PanellsAdministracioSistema.jsx:180`). Una línia.
- **P1-b (C)** grup «🛡️ Administració del sistema» visible a tothom: `perfilModel.js:111-116`, `PerfilShell.jsx:228`; i el Crom perd la guarda superadmin que tenia `PanellCrom.jsx:151` (`PanellsAdministracioSistema.jsx:34`). Filtrar per `useSuperadminEstable()`.
- **P1-c (C)** `src/sections/mur/MurSection.jsx:354-361` mode «Revisió d'Importació (Admin)» obert a qualsevol visitant del Mur. Mateixa guarda.
- **P1-d (C)** carpeta creada en línia no es persistix: `BotoneraClassificacio.jsx` (`afigCarpeta`/`slugDeCarpeta`) + `NotesEditor.jsx:392-406` → nota amb `folderId` fantasma després de recarregar.
- **P1-e (C)** 55 classes sense CSS (39 admin + 14 `sdp-mur-revisio-*` + 2 ModeRural) i 25 regles `.sdp-admin-*` òrfenes per desajust anglés/valencià; `sdp-btn*` no existix (cal `sdp-boto*`). Detall al bloc R5-D6 de dalt.
- **P1-f (P)** `elementDeSeccio.js:46` → `transformadorEditorialWpBlogger.js:10-13` arrossega `tesaurusDoctoralSocDePoble.js` (514 KB) al tros comú de Mur/Mercat/Notes/Pobles. Verificar amb build.
- **P1-g (S1)** `townsSeed.js:~181` (carril S1).
- **P2 (C)** `elementDeSeccio.js:79` cau en article simulat amb `content: ''`; `transformadorEditorialWpBlogger.js:259,274,301,331` `window.localStorage` fora del `try`; `territoriDelPoble.js:15` `params.size` trenca filtres a Safari 16; `SquareBadge.jsx:63-67` i `PageFrame.jsx:1099,1140` clics sobre `<time>`/`<img>` sense teclat; `main.jsx:39,97` pantalla en blanc si falla el Node 0.
- **P2 (P)** `identitatsSeed.js:530-537` àlies d'entitat remota sense filtre fundacional; `sondaConnexions.js` un 404 amaga Connectar tota la sessió; `fitxaDelPoble.js` porta 1 607 línies de llavor al tros principal; `transformaHtmlEditorialPedraSeca` sense sanejar (latent).
- **P3** codi sense consumidors (`node0Client.js`, `pontMastodon.js`, `useTraduccioTargeta.js`, `correuBenvinguda.js`, `ProvaCorreuAmbContrasenya.jsx`); `node0Client.js:67,173`; `PanellsAdministracioSistema.jsx:305` fetch sense abort; `layout.css` H1 amb 144 px de farciment al mòbil; `clauDelPoble.js` tags com a pobles; `iaiaLocal.js` regex; `ConnexionsPubliques.jsx` silencia `jwt expired`; enllaços `http://zona14.org` (carril S3).

- **19:39** · **Cobertura S4 i relleu.** Revisió a fons de 78 dels 102 fitxers no de prova de `src/` del diff + escaneigs mecànics sobre TOTS els 193 (classes sense CSS, assets inexistents, claus i18n, tokens, portes de la casa, `masia` = 0 aparicions). Cap `npx vitest` executat: les troballes són estàtiques i el codi les demostra; cap prova global.
- **NO cobert a fons (24 fitxers, només escaneig mecànic):** `components/universal/ambits/BlocAmbit.jsx`, `config/imatgeSocial.js`, `config/politicaPrivacitat.js`, `data/wikiManifest.js`, `control/textosModeRural.js`, `disseny/cataleg/{manifest,registre}.js`, `multimedia/{censImatges,mediaContent}.js`, `mur/articles/{Aplec2023Article.jsx,ManifestDePobleArticle.jsx,aplec2023Content.js}` (carril S3), `mur/{datesDeProvaMur,eventsSeed,feedContent,feedSeed}.js` (vist en part: `MANIFEST_DE_POBLE_POST` ok), `pobles/{CreditsDeViquipedia.jsx,PanellDeViquipedia.jsx,PoblesSection.jsx,usePobleHidratat.js}`, `text/{TextSection.jsx,pageContent.js,pageContent.r10.js}`, `xat/pobleAmfitrio.js`.
- **NO cobert:** els 91 fitxers `*.test.*` del diff (cal mirar si alguna prova no afirma res o s'ha afluixat; vist només `aliesDePobles.test.js` i `NotesEditor.ambit.test.jsx`, coherents), i els 291 fitxers fora de `src/` (`tooling/node0` 88, `public/assets` 69, `tests/`, `.agents/runtime`).
- **Ordre suggerit al Bloc 2:** P1-a (1 línia) → P1-b/P1-c (una sola guarda superadmin reutilitzable) → P1-e (CSS Pedra Seca dels panells) → P1-d → verificar P1-f amb `vite build` → P2.

<!-- R6B1:S4:FI -->

### Verificació i relleu del Bloc 1

- **19:25** · Obert el bloc. Instantània de `src/` presa abans de cap edició; 4 subagents llançats en paral·lel (workflow). Fitxers bruts d'altres mans a l'inici: `modules.css`, `detailSectionMeta.jsx`, `elementDeSeccio.js`, `MurSection.jsx`, `PerfilShell.*`, `DetallEspai.jsx`, panells d'admin, `pageContent.js`, `transformadorEditorialWpBlogger.js`, `indexConsola.js`, `wikiManifest.js` i `connectar.graella.css.test.js`: no es reverteixen.

- **19:27** · Workflow `wf_f1da22c0-2f5` llançat a les 19:27: S1 (La Torre + logotip), S2 (`/notes` editable), S3 (Manifest i Aplec a `content`) amb un àrbitre-corrector darrere de cada un, i S4 (auditoria del diff R5) en paral·lel. Carrils de fitxers separats; S2 i S3 pacten que el document sencer viu en `item.content` (HTML). Nota: el diff `064ec0137..c49d173c4` toca 193 fitxers de `src/` (no 337).

- **19:47** · **Verificació del Bloc 1 (Claude, fil principal).** El workflow ha acabat amb els 7 agents fets i 0 errors. Els veredictes són S1 acceptat, S2 acceptat amb correccions (parcial) i S3 acceptat. La comparació amb la instantània `r6_abans_src` dona 31 fitxers de `src/`, tots dins dels carrils, més 8 de proves roges que he arreglat jo (punt següent). Ningú ha revertit res d'altres mans.
  - **Tres proves roges fora dels carrils, causades per la nostra onada i ja arreglades:**
    - (a) `src/sections/xat/pobleAmfitrio.js:55` tenia l'avatar de La Torre a `commons-ah27.webp`. L'he passat a `/assets/towns/la-torre-de-les-macanes/2.jpg` i he canviat les fixacions a `pobleAmfitrio.test.js`, `XatSection.{actorsPermanents,avatars,caraDelPoble}.test.jsx` i `FakeChatOnboarding.avatars.test.jsx`.
    - (b) A `src/sections/multimedia/suggerimentPobleLocal.test.js:23`, `GPS_TORRE` ara val `{ lat: 38.5919, lng: -0.4184 }`, les coordenades de la llavor.
    - (c) A `src/config/assetResolver.test.js`, la prova de l'Aplec ara crida `permetOrigenMitjans(PAQUET)` i va ABANS de les proves que fan `vi.resetModules`. Cada còpia nova de `sanitize.js` penja el seu ganxo al DOMPurify compartit amb una llista d'orígens buida, i esborrava els 43 `src`. La correcció que proposava l'àrbitre de S3 no bastava.
  - **Proves:** `npx vitest run` sobre 26 fitxers dirigits (pobles, connectar/logotip, notes, `mur/articles/`, eventsSeed, detailSectionMeta, assetResolver, xat i multimedia). Primer han eixit 380/381, i després `assetResolver.test.js` ha donat 29/29 (els 26 fitxers en verd). ESLint net en els fitxers que he tocat. No he passat la suite global, el build ni les portes.
- **Relleu per al Bloc 2 (en ordre de prioritat).**
  - **P0-25 a mitges:** el Manifest i l'Aplec ja s'obrin editables en `NotesEditor`, però «Actualitzar al Mur» rebutja els elements de la llavor, que no tenen UUID, i no desa res. Falta un camí de persistència de revisions editorials, sobre el patró de `data/publicacionsEsborrades.js`, que lligen MurContext, ItemDetailSection i la ruta; o bé migrar les files de la llavor a `section_submissions`. També falta l'escriptura d'esdeveniments. Les guardes de `publishNote` han d'anar abans d'adoptar en `PublicacioEditable`. Falten les claus i18n `section.notes.publicacio.noActualitzableActe` i `…noActualitzableLlavor`.
  - **P0-26 · D1 (bloqueja l'edició real):** el viatge d'anada i tornada per TipTap perd els contenidors de maquetació: galeries, la graella dels 3 logotips, `p.sdp-paragraf-centrat` i l'enllaç al voltant d'una imatge. Abans de deixar desar des de `/notes`, les extensions de `src/components/universal/richText/extensions/` han de conservar els `div` amb classe i el `href` de SdpImage. **D2:** `supabase/seed.sql` està desfasat: duu el Manifest en text pla i La Torre amb «749 hab» i `commons-ah27.webp`. Cal regenerar-lo amb `scripts/generate-supabase-seed.mjs`, i que `seedSql.pobles.test.js` compare també `image_url`, la població i `lat`/`lng`. CSS de `modules.css`: els peus de foto ara són `<p>` i les regles `figcaption` (≈14430-14478) ja no s'apliquen. Pendent de decidir: el vídeo ara ix damunt del títol d'À Punt i les 9 fotos complementàries ja no estan plegades.
  - **Auditoria S4, P1 confirmats:**
    - `PerfilShell.jsx:240` passa `grupsNavegacio=`, però el panell espera `navigationGroups`. Es corregix en una línia.
    - `perfilModel.js:111` mostra el grup «Administració del sistema» a tothom. Cal la porta `useSuperadminEstable()`.
    - `MurSection.jsx:354` mostra el Mode Revisió d'Importació a convidats, sense cap rol.
    - `BotoneraClassificacio`: les carpetes creades en línia es perden en recarregar i el slug col·lideix («Fèstes» i «Festes»).
    - **R5-D6:** 55 classes sense CSS. Els noms no quadren: el JSX els posa en anglés (`__table-wrap`) i el CSS en valencià (`__taula-wrap`). A més, `sdp-btn`, `sdp-card` i `sdp-input` no existixen.
    - `elementDeSeccio.js:46` probablement arrossega el tesaurus (514 KB) al chunk comú. No ho he comprovat amb build.
    Els P2 i P3, amb fitxer i línia, són al subapartat 4.
  - **No cobert:** 24 fitxers de `src/` només amb escaneig mecànic i 91 proves del diff sense auditar (llista al subapartat 4). Res commitejat ni desplegat. Les entrades de Codex R12 no s'han creuat amb estes.

<!-- R6B1:S5:FI -->

## Onada R6 · Bloc 2 (5% Ultracode)

Mateix compte de Claude Opus 5.5, amb 4 carrils, cadascun amb el seu àrbitre-corrector. Ordre del Mestre del 05-11-2026, després del Bloc 1. **Base:** l'arbre viu amb el Kit `r58` de Gemini ja aplicat per MarIA (R5-D6, P1-a, P1-c, X1/X2, SquareBadge, Safari 16, `obteStorageSegur` i les claus i18n de `/notes`). Eixa feina no es repetix. Instantània nova de `src/` i de `supabase/seed.sql` a l'scratch de la sessió (`r6b2_abans`). Cada carril escriu ací a cada pas. Res commitejat ni desplegat.

### B2-S1 · P0-25 · Revisions editorials de la llavor i dels esdeveniments

- **20:02** · **Inici.** Claude (constructor B2-S1, P0-25 segona meitat): capa de revisions editorials per a ítems de llavor (`manifest-de-poble`) i esdeveniments (`aplec-2023`) des de `/notes`; primer diagnosi i disseny, després codi.

- **20:05** · **Diagnosi.** `PublicacioEditable.jsx:62-66` rebutja tot el que no és fila del Mur amb UUID (`esFilaActualitzable`, `publicacioEditable.js:72`): Manifest (`feedSeed.js:6`, remot a `app_content.feedPosts`) i Aplec (`eventsSeed.js:27`) no es desen enlloc. `app_content` només té polítiques de lectura (`2609200300_blindatge_storage_i_contingut.sql:74-81`) i cap port hi escriu: la revisió serà **local-first**. A més, l'adopció (`PublicacioEditable.jsx:69-80`) va abans de les guardes de `publishNote` (`NotesContext.jsx:298-347`: només lectura, signatura aliena, canvi de secció). D2: `cosDeLaPublicacio` (`publicacioEditable.js:35`) no torna al canònic si el `content` remot és text pla.
- **Lectors.** `/mur/:id` i `/events/:id` passen pel comodí `:sectionId/:itemId` → `ItemDetailSection` → `buildDetailSectionMeta` amb `feedPosts`/`events` de `useMur()` → `ManifestDePobleArticle`/`Aplec2023Article` amb `cosDeLArticle(item, canonic)`: n'hi ha prou amb un `item.content` HTML revisat. `useElementDeSeccio`/`trobaElement` també lligen de `useMur()`.
- **Disseny · magatzem.** Nou `src/data/revisionsEditorials.js` (patró de `publicacionsEsborrades.js`): clau `getVal/setVal('publicacions.revisions.v1')` → `{ "<seccio>:<id>": { camps, desadaEl } }`, seccions `mur` i `events`; camps de nota validats (`title`, `subtitle`, `lead`, `content`, `heroImage`, `logoImage`, `copyright`, `icon`, `publishDate`, `tags`), cadenes amb topall, desat en `Map` (cap `__proto__`). Accés al storage en `try/catch`; oients del mòdul (mateixa pestanya) + `window` `storage` amb la clau prefixada (altres pestanyes). API: `desaRevisioEditorial` (fusiona), `revisioEditorial`, `oblidaRevisioEditorial`, `revisaElement(seccio, item)`, `revisaLlista`, `subscriu…`/`versio…`.
- **Disseny · solapament.** Cada camp de nota va a la primera clau no buida de l'element (`title|name`, `post_subtitle|subtitle`, `entradilla|lead|summary`, `image_url|image`…), la mateixa ordre que `notaDeLaPublicacio`; idempotent.
- **Disseny · lectors.** `MurContext` subscriu amb `useSyncExternalStore` i aplica `revisaLlista` a `mur` i `events`; `ItemDetailSection` revisa també `location.state.preloadedItem`; `trobaElement` revisa el `directe` (idempotent).
- **Disseny · escriptura i permís.** «Actualitzar al Mur» sobre llavor (Mur sense UUID) o acte: `nomesLectura` → `ErrorIdentitatDeLectura`; la guarda de signatura aliena de `publishNote` (nova `rebuigDePublicacio` exposada per `NotesContext`, que `publishNote` reutilitza tal qual); i, si passa, `desaRevisioEditorial` amb només els camps canviats i un toast. El permís és el que ja hi havia: el Bloc només llista publicacions pròpies + no lectura + signatura. Camí UUID: les guardes (signatura + secció) ABANS d'adoptar; la resta idèntica.

- **20:06** · **Pegat 1 · nou `src/data/revisionsEditorials.js`.** El magatzem del disseny: `Map` en memòria + `setVal('publicacions.revisions.v1')` en `try/catch`, validació de camps (només els de nota, cadenes amb topall de 4 000 caràcters i 600 000 per al `content`, `tags` de cadenes), oients del mòdul i un sol oient `storage` de `window` (s'afig amb el primer subscriptor i es lleva amb l'últim), `desaRevisioEditorial` fusiona amb l'anterior. `revisaElement` posa cada camp a la primera clau no buida de l'element; `revisaLlista` torna la MATEIXA llista si cap element té revisió, perquè `MurContext` no refaça memòries per res.

- **20:07** · **Pegat 2 · nou `src/data/revisionsEditorials.test.js`.** 7 proves: desar/fusionar/persistir amb la clau prefixada, rebuig de seccions/camps/tipus, solapament a la clau que l'element llig (`post_subtitle` al Manifest, `subtitle` a l'Aplec), `revisaLlista` idèntica sense revisions, oients de la mateixa pestanya, esdeveniment `storage` (clau pròpia sí, altra clau no, sense subscriptor ja no escolta) i storage manipulat o que peta.
- **Prova.** `npx vitest run src/data/revisionsEditorials.test.js` → 1 fitxer, 7/7 verdes (una primera passada 6/7: la prova del storage manipulat no tenia subscriptor, i sense subscriptor el mòdul no escolta `storage`; és el comportament volgut, ajustada la prova).

- **20:08** · **Pegat 3 · lectors.** `src/sections/mur/MurContext.jsx`: `useSyncExternalStore(subscriuRevisionsEditorials, versioRevisionsEditorials)` i `revisaLlista(…, 'mur'|'events')` damunt de `feedPosts` i `events` (després d'esborrades i bloquejades), amb `versioRevisions` a les dependències del `value`. `src/sections/detail/ItemDetailSection.jsx`: el `location.state.preloadedItem` (la targeta el passa tal com era) passa per `revisaElement` dins d'un `useMemo` lligat a la versió. `src/sections/detail/elementDeSeccio.js` (compartit amb el carril 4, només Edit, tres trossets: un import després d'`agendaMur.js`, la constant `SECCIO_DE_LA_LLISTA` = `{ '/mur': 'mur', '/calendari': 'events' }` i `trobaElement` revisa el `directe`); la línia de `trobaArticleImportatComAPublicacio` és del carril 4 i no l'he tocada. `revisaElement` ara conserva la identitat si l'element ja porta la revisió, perquè `trobaElement` (cridat a cada pintada) no fabrique objectes nous.

- **20:10** · **Pegat 4 · `src/sections/notes/NotesContext.jsx` (Edit, 5 trossets).** Les dues guardes de `publishNote` que miren la publicació (signatura aliena, canvi de secció) passen, amb el mateix codi i el mateix toast, a `rebuigDePublicacio(nota, { compartir, seccio })`, que torna l'`ErrorPublicacio` o `null`; `publishNote` la crida al mateix lloc (ordre idèntic: només lectura → mode local → signatura → secció) i conserva `seccioPrevista` per al `catch` de SDP-SEC-002. S'exposa al context (`nomesLectura` ja hi era). Fora `actor`/`publicacioCarregada` de les dependències de `publishNote` (eslint: ja no s'hi usen).
- **Pegat 5 · `src/sections/notes/publicacioEditable.js`.** D2: `cosDeLaPublicacio` mira un `Map` de canònics (`manifest-de-poble` → `MANIFEST_DE_POBLE_HTML`, `aplec-2023` → `APLEC_2023_HTML`) i delega en `cosDeLArticle` (la mateixa regla `semblaHtml` de la vista pública). Nous `esRevisioEditorial` (agenda, o Mur sense UUID, mai sistema), `campsDeLaRevisio(inicial, actual)` (només els camps canviats) i `avisRevisioDesada(t)` (clau `section.notes.publicacio.revisioDesada`, reserva en valencià). Capçalera posada al dia.
- **Pegat 6 · `src/sections/notes/PublicacioEditable.jsx`.** `publica`: `nomesLectura` → `ErrorIdentitatDeLectura` primer; llavor/acte → `rebuigDePublicacio(actual, { seccio: false })` → `desaRevisioEditorial` amb els camps canviats → toast `success` → `true`; seed/local amb UUID, el `publishNote` de sempre; fila UUID → `rebuigDePublicacio(actual)` ABANS de `creaNota`/`updateNote`, la resta igual. `npx eslint` dels 8 fitxers tocats → 0 problemes.

- **20:11** · **Pegat 7 · `src/sections/notes/PublicacioEditable.test.jsx`.** El doble del Bloc porta `rebuigDePublicacio`; el magatzem es reinicia a cada prova. Les dues proves «sense escriptura» (llavor i acte) passen a: Manifest desa `{ content, lead }` i el lector (`revisaElement` + `cosDeLArticle`) torna el cos revisat; Aplec desa `{ subtitle, content }` a `events:aplec-2023`; també en seed (local-first). Noves: D2 (text pla → `MANIFEST_DE_POBLE_HTML`, HTML → el seu), `esRevisioEditorial`/`campsDeLaRevisio`, cap canvi → res desat, signatura aliena → res desat, només lectura → `ErrorIdentitatDeLectura` sense revisió ni adopció, fila UUID amb rebuig → cap `creaNota`/`updateNote`/`publishNote`/`setParams` i, passada la guarda, el camí de sempre.
- **Prova.** `npx vitest run src/sections/notes/PublicacioEditable.test.jsx` → 1 fitxer, 17/17 verdes.

- **20:14** · **Pegat 8 · nou `src/sections/mur/MurContext.revisions.test.jsx`.** 3 proves amb el `MurProvider` real (port simulat com a `MurContext.bloquejos`): sense revisions, les MATEIXES files; `desaRevisioEditorial` del Manifest i de l'Aplec es veu a `feedPosts`, `sortedFeedPosts` i `events` sense recarregar (`loadMur` 1 sola volta); `trobaElement` torna el revisat per id, per slug i per l'àlies `aplec-pel-territori-2023` (i el MATEIX objecte si ja la porta; `/mercat` no es revisa); una revisió d'una altra pestanya arriba per `storage`.
- **Prova.** `npx vitest run src/sections/mur/MurContext.revisions.test.jsx` → 3/3. Regressió: `npx vitest run` de `MurContext{,.bloquejos,.senseIdentitat,.revisions}`, `elementDeSeccio{,.agenda,.logo}`, `ItemDetailSection{,.bloquejat,.redireccio}`, `NotesContext{,.ambit,.llavor,.senseIdentitat}`, `PublicacioEditable`, `revisionsEditorials`, `publicacionsEsborrades` → 17 fitxers, 191/191. Després `PublicacioDetall.*`, `NotesSection.fontPublicacio*`, `PublicacioVerticals8Ambits.integracio`, `ItemDetailSection.*`, `NotesSection`, `mur/articles/` → 29 fitxers, 398/399: l'única fallada, `ItemDetailSection.pobleIncomplet.test.jsx:87` (IndexedDB obert), és intermitent per temps (`setTimeout` de 20 ms sota càrrega): sola, 2 passades, una 2/3 i l'altra 3/3, i el camí de `pobles` no toca el magatzem (`revisaElement` amb secció no vàlida torna l'element sense llegir res). `src/config/i18n.claus.test.js` → 262/262. `npx eslint` de tots els fitxers tocats → 0.

- **20:14** · **Veredicte B2-S1 · FET (local-first).** «Actualitzar al Mur» sobre `manifest-de-poble` (Mur, sense UUID) i `aplec-2023` (agenda) desa una revisió editorial (`src/data/revisionsEditorials.js`) amb només els camps canviats; `MurContext` (llistes i targetes, i per tant el Bloc, que llig de `useMur`), `ItemDetailSection` (també el `preloadedItem`), `trobaElement` i les rutes `/mur/:slug` i `/events/:slug` (via `cosDeLArticle`, verificat) la pinten a l'instant, també des d'una altra pestanya. D2 arreglat a `cosDeLaPublicacio`. Les guardes (només lectura, signatura, secció) van abans d'adoptar o de desar. El camí UUID és el de sempre.
- **NO FET / per al bloc següent.** (1) **Camí remot:** `app_content` només té polítiques de lectura i cap port hi escriu, així que la revisió viu en el navegador que la desa i no arriba a altres dispositius ni a altres persones. Per compartir-la cal una decisió del Mestre: o una taula de revisions amb RLS (superadmin o autor) i un mètode del port, o migrar la llavor a `section_submissions` amb UUID. (2) **i18n:** la clau `section.notes.publicacio.revisioDesada` no és a `src/config/idiomes/*` (no és del meu carril) i ara es veu la reserva en valencià. Els textos `noActualitzable*` ara només ixen quan el magatzem rebutja els camps (p. ex. un cos de més de 600 000 caràcters): convé canviar-los per «no s'ha pogut desar». (3) **Carril 4:** el recurs `trobaArticleImportatComAPublicacio` de `trobaElement` no passa per la revisió, perquè eixa línia és seua. (4) No s'ha verificat al navegador (`:3340`) per la quota. (5) `ItemDetailSection.pobleIncomplet.test.jsx` és intermitent sota càrrega. No hi ha cap commit.

- **20:16** · **Àrbitre · inici.** Revise només les edicions del bloc (diff contra `r6b2_abans`): magatzem `src/data/revisionsEditorials.js`, `PublicacioEditable.jsx`, `publicacioEditable.js` (D2 amb `cosDeLArticle`), `NotesContext.jsx` (`rebuigDePublicacio`), `MurContext.jsx`, `ItemDetailSection.jsx`, `elementDeSeccio.js`. Reexecutat: `npx vitest run src/data/revisionsEditorials.test.js src/sections/notes/PublicacioEditable.test.jsx src/sections/mur/MurContext.revisions.test.jsx src/sections/detail/elementDeSeccio src/sections/detail/ItemDetailSection.test.jsx src/sections/notes/NotesContext src/sections/mur/MurContext` → 20 fitxers, 210/210; `npx eslint` dels 10 fitxers → 0 problemes.

- **20:17** · **Àrbitre · comprovacions.** Rutes dedicades: `detailSectionMeta.jsx:865,999` pinten `ManifestDePobleArticle`/`Aplec2023Article` amb l'`item` d'`ItemDetailSection`, ja revisat; `cosDeLArticle` (`cosCanonic.js:18`) prefereix el `content` HTML i `cosPerAPintar` el passa per `sanitizeHtml` (verificat). `SECCIO_DE_LA_LLISTA` d'`elementDeSeccio.js:64` no xoca amb el `Map` homònim de `detailSectionMeta.jsx:222` (mòduls distints). `rebuigDePublicacio` reprodueix literalment les dues guardes de `publishNote` (mateixa `publicacioCarregada`, també amb `compartir`); els tests idea61 de `NotesContext*` continuen verds. Cap revert d'altres mans en els 7 fitxers.
- **Àrbitre · observacions (no defectes, per al bloc següent).** (1) Per a un acte (`events`) la guarda de signatura aliena no actua mai: `publicacioCarregada` només coneix `mur`/`mercat`, i `esPublicacioEditable` no mira autoria; avui és inofensiu perquè la revisió és local (només el navegador de qui la desa), però el dia que hi haja camí remot cal una comprovació de permís real (superadmin o autor) al servidor (RLS) i al client. (2) La revisió no porta usuari: en un dispositiu compartit la veu qualsevol sessió. (3) Sense cap canvi, «Actualitzar» mostra igualment «Revisió desada». (4) Falta la clau i18n `section.notes.publicacio.revisioDesada` a `src/config/idiomes/*` (fora del carril).
- **Àrbitre · veredicte.** acceptat — sense correccions. Proves: `npx vitest run src/data/revisionsEditorials.test.js src/sections/notes/PublicacioEditable.test.jsx src/sections/mur/MurContext.revisions.test.jsx src/sections/detail/elementDeSeccio src/sections/detail/ItemDetailSection.test.jsx src/sections/notes/NotesContext src/sections/mur/MurContext` → 20 fitxers, 210/210; `npx eslint` dels 10 fitxers del carril → 0 problemes. Pendent: no provat al navegador (:3340), res commitejat, revisió només local-first (decisió del Mestre per a una taula `revisions` amb RLS o migrar la llavor a `section_submissions`).

<!-- R6B2:S1:FI -->

### B2-S2 · P0-26 D1 · Estructura i enllaços en TipTap (avís A1 de Gemini)

- **20:02** · **Inici.** Constructor del carril B2-S2 (P0-26 D1 + avís A1/A2 de Gemini): enllaços en `SdpImage`, contenidors de maquetació en llista blanca i paràgraf centrat en TipTap, amb prova de viatge d'anada i tornada sense pèrdua.

- **20:06** · **Diagnosi.** El node `SdpImage` no viu a `NotesEditor.jsx` sinó a `src/components/universal/richText/extensions/index.js:79-118`, i hi ha un sol camí d'extensions: `extensionsRiques()` (`index.js:422`) → `DocumentEditor.jsx:488` (editor de Notes i Editor Universal) damunt de l'StarterKit de `useUniversalRichText.js:175`. Cap altre constructor d'esquema (`generateJSON`/`getSchema`) al codi viu.
- **Causa 1 (logotips i cartell).** `SdpImage` només hereta `src/alt/title/width/height` + els `data-*` del registre: no té `href`, i la marca Link no es pot posar en un node de bloc (`inline: false`), així que l'`<a>` de fora cau en el primer `getHTML()`.
- **Causa 2 (contenidors).** Cap node no reconeix `div`: ProseMirror desfà el `div` i n'hissa el contingut; `Paragraph` no té atribut de classe (`p.sdp-paragraf-centrat`, `p.aplec-2023__peu` es queden nus). Les ítems de galeria són `div[data-wp-media-id]` SENSE classe (`aplec2023Content.js:307`), i `div.sdp-accions` / `div.manifest-de-poble__documents.sdp-accions` porten contingut EN LÍNIA (botons), no blocs.
- **Sanejador (`src/utils/sanitize.js:226-245`).** Conserva `div`, `class`, `href/target/rel`, `width/height` i els `data-*` (ALLOW_DATA_ATTR per defecte); força `rel="noopener noreferrer nofollow"` a tot `a[href]`; NO admet `figure/figcaption` (per això el canònic usa `div` + `p`). El guarda d'URL existent `hrefSegur` (`traduccio/blocsTraduibles.js:205`) només admet `/camí`, `#`, `?` i https: cal afegir-hi http i mailto (els logotips apunten a `http://zona14.org`).
- **Visor (A2).** `VisorDePublicacio.jsx:267,293` ja salta tota `img` dins d'un `a`: si les 34 fotos de galeria no porten `href`, continuen obrint el visor.

- **20:09** · **Pegat 1 · enllaç d'imatge.** Nou `src/components/universal/richText/extensions/enllacImatge.js`: `hrefDeImatge` (reutilitza `hrefSegur` i hi afig només `http:` i `mailto:` sense credencials), `destinacioDeImatge` (només `_blank`), `relDeImatge` (paraules conegudes; amb `_blank` sempre `noopener noreferrer`), i `atributsDEnllac()` que llig de l'`<a>` pare o de `data-sdp-href/-target/-rel`. A `index.js`, `SdpImage` hi suma `href/target/rel` (no es pinten a l'`<img>`), un `renderHTML` que embolica en `<a class="sdp-image-link">` només amb href segur, i l'ordre `enllacaImatge({ href, target, rel })` (href buit = lleva l'enllaç; href insegur = `false`, res no canvia) per a la barra quan toque.
- **Pegat 2 · contenidors.** Nou `extensions/maquetacio.js` amb tres peces en llista blanca: `ContenidorDeMaquetacio` (`div`, `block+`, classes `aplec-2023__galeria/__figura/__complement/__organitzadores`, `manifest-de-poble__organitzadores`, o ítem de galeria `div[data-wp-media-id]` amb un enter), `AccionsDeMaquetacio` (`div.sdp-accions`, `inline*`: els botons sense cap `<p>` pel mig, i `manifest-de-poble__documents` quan hi és) i `ClasseDeParagraf` (atribut global de `paragraph`: `sdp-paragraf-centrat`, `aplec-2023__peu`). Qualsevol altra classe cau; un `div` sense res de la llista es desfà com abans.
- **Pegat 3 · una sola porta.** `extensionsRiques()` hi afig `...extensionsDeMaquetacio()` SEMPRE (com la `Subtargeta`), i com que l'única via és `DocumentEditor.jsx:488`, ho reben l'editor de Notes i l'Editor Universal alhora. No he tocat `NotesEditor.jsx` (el node no hi viu).
- **Prova.** `src/sections/mur/articles/cosCanonic.editor.test.js` reescrita: comptes iguals de cada contenidor i paràgraf de la llista, les 43 imatges de l'Aplec i les 8 del Manifest amb `src/width/height/href/target` idèntics, idempotència (`getHTML` del desat = desat), el mateix després de `sanitizeHtml`, A2 (cap foto de galeria dins d'`<a>`, totes amb mida), els tres logotips (`http://zona14.org`, `/rentonar`, `/socdepoble`), cartell → `/events/aplec-2023`, logotip → `/mur/manifest-de-poble`, `noopener noreferrer` amb `_blank`, i rebuig de `javascript:`, `//host`, classes alienes i `data-wp-media-id` no numèric. La prova del límit conegut s'ha llevat.
- **Proves.** `npx vitest run src/sections/mur/articles/cosCanonic.editor.test.js` → 1 fitxer, 7/7 verdes (1,11 s).

- **20:09** · **Pegat 4 · NodeView.** `extensions/SdpImageNodeView.jsx`: amb un href segur, el contenidor porta la classe `sdp-image-link` i, davall de la foto, l'adreça en un `span.sdp-image-link__adreca` (`contentEditable={false}`, cap text a traduir: només la URL). No és un `<a>`: fer-hi clic dins de l'editor no navega. L'edició de l'enllaç NO té interfície (no hi havia cap camí barat sense claus noves d'i18n): queda l'ordre `enllacaImatge` per a cablejar-la a la barra.
- **Pegat 5 · CSS** (`src/css/modules.css`, només el bloc Aplec, ≈14430-14472). `.aplec-2023__galeria > div` rep `margin: 0; min-width: 0` (les ítems de galeria són `div`, no `figure`, i sense `min-width` una foto ampla desbordava la graella); la regla del peu cobrix ara `figcaption`, `.aplec-2023__peu`, `.aplec-2023__figura > p` i `.aplec-2023__galeria > div > p`, i l'adreça de la NodeView (`display: block; overflow-wrap: anywhere`). Només tokens `var(--sdp-*)`, cap mida de lletra.

- **20:10** · **Proves.** `npx vitest run src/components/universal/richText/extensions/ src/components/universal/DocumentEditor.imatge.test.jsx src/components/universal/DocumentEditor.exif.test.jsx src/components/universal/DocumentEditor.subtargeta.test.jsx src/components/universal/DocumentEditor.test.jsx src/sections/notes/NotesEditor.p4.test.jsx src/sections/notes/NotesEditor.ambitEnLinia.test.jsx src/sections/mur/articles/ src/utils/sanitize.geoImatge.test.js src/sections/notes/PublicacioDetall.visor.test.jsx` → 25 fitxers, 349/350. L'única roja és `extensions/targetes/qualitat.test.js` (ESLint de tot el front): `src/sections/notes/NotesEditor.jsx:803 react-hooks/exhaustive-deps` (falta `scopeKey` al `useMemo`), que ve de l'edició del carril 3 (`useCarpetesCreades(scopeKey)`, diff contra `r6b2_abans`), no d'este carril: els meus fitxers nous no donen cap missatge d'ESLint. Petició al carril 3: afegir `scopeKey` a eixes dependències o justificar-ho.

- **20:10** · **Veredicte: FET** (P0-26 D1 + A1 + A2), sense commit. Fitxers: `extensions/enllacImatge.js` (nou), `extensions/maquetacio.js` (nou), `extensions/index.js`, `extensions/SdpImageNodeView.jsx`, `src/css/modules.css` (bloc Aplec), `src/sections/mur/articles/cosCanonic.editor.test.js`. Cap canvi a `aplec2023Content.js`, `manifestDePobleContent.js` ni `NotesEditor.jsx`.
- **Per al bloc següent (no verificat amb prova, llegit al codi):** (1) la `Subtargeta` pinta només `class="sdp-subtargeta"` i perd `manifest-de-poble__adhesio` (marge i centrat de la caixa d'adhesió); cal decidir si la primitiva admet una classe extra en llista blanca (`subtargeta.js` `renderHTML`). (2) El `span.sdp-sr-only` dins del botó d'adhesió cau (cap marca `span`): el text «(s’obri en una altra pestanya)» es fa visible després d'un desat. (3) Les classes tipogràfiques `detail-content__paragraph/__titol/__llista` cauen (els elements i el text es conserven). (4) Falta la interfície per a editar l'enllaç d'una imatge: l'ordre `editor.commands.enllacaImatge({ href, target })` ja hi és; cal un botó a la barra (`tiptapToolbarAdapter.js`) amb claus i18n noves a `src/config/idiomes`.
- **Peticions:** carril 3, l'avís d'ESLint de `NotesEditor.jsx:803` (`scopeKey`). Integrador: les portes globals (`run-portes`, `test:precommit`) no les he passades (regla 2).

- **20:12** · **Àrbitre · inici.** Reviso només el diff d'este bloc (`enllacImatge.js`, `maquetacio.js` nous; `index.js`, `SdpImageNodeView.jsx`, `modules.css` 14428-14473, `cosCanonic.editor.test.js`). `NotesEditor.jsx` ja no definix cap SdpImage propi: usa `extensionsDelCos` de `index.js`, i el seu diff és només del carril 3 (carpetes). `aplec2023Content.js` i `manifestDePobleContent.js`: cap canvi d'este carril.
- **Àrbitre · primera passada.** `npx eslint` dels 5 fitxers: net. `npx vitest run cosCanonic.editor.test.js subtargeta.test.js imatgesEnganxades.test.js ordreImatge.avisos.test.js ordreImatge.exif.test.js DocumentEditor.imatge.test.jsx NotesEditor.p4.test.jsx PublicacioDetall.visor.test.jsx sanitize.geoImatge.test.js` → 9 fitxers, 105/105.

- **20:13** · **Àrbitre · intents de refutació.** Href: `hrefDeImatge` reutilitza `hrefSegur` (blocsTraduibles.js) i hi afig només `http:`/`mailto:` sense credencials; refusa `javascript:`, `//host` i `/\host`. Rel: llista blanca, i amb `_blank` sempre `noopener noreferrer`. Contenidors: cap classe fora de llista; `div[data-wp-media-id]` només amb enter. Les 34 fotos de galeria no porten `<a>` i guarden `width`/`height` (A2). El sanejador conserva `a.sdp-image-link`, `div` i `data-*`. CSS: tokens `var(--sdp-*)`, sense colors crus ni `style={{}}`. No trobe cap defecte del carril.
- **Àrbitre · prova afegida.** Faltava cobrir l'ordre `enllacaImatge`: nova prova a `cosCanonic.editor.test.js` (refusa `javascript:` i `/\dolent.example`, posa `https` + `_blank` amb rel `noopener noreferrer nofollow` i lleva la paraula desconeguda, conserva la mida, i amb href buit lleva l'enllaç). `npx vitest run src/sections/mur/articles/cosCanonic.editor.test.js` → 1 fitxer, 8/8.
- **Àrbitre · veredicte.** acceptat amb correccions (només una prova nova; cap canvi de codi). Proves: `npx eslint` dels 5 fitxers net; 9 fitxers 105/105 (llista de la primera passada) i 8/8 en `cosCanonic.editor.test.js` després de la prova nova. Per al bloc següent: (1) carril 3, `NotesEditor.jsx:803` sense `scopeKey` a les dependències (fa roig `targetes/qualitat.test.js`); (2) `subtargeta.js` perd `manifest-de-poble__adhesio` i StarterKit perd `span.sdp-sr-only` en desar (deduït del codi, sense prova); (3) cap botó de barra per a `enllacaImatge` (`tiptapToolbarAdapter.js` + claus i18n a `src/config/idiomes`); (4) les classes tipogràfiques `detail-content__*` es perden encara. No s'ha fet cap commit.

<!-- R6B2:S2:FI -->

### B2-S3 · P1-b i P1-d · Guarda de superadmin i carpetes persistents

- **20:02** · **Inici.** Constructor del carril B2-S3 (P1-b guarda de superadmin del grup d'Administració + P1-d carpetes persistents i slugs sense col·lisió); comence per la diagnosi amb grep sobre `perfilModel.js`, `PerfilShell.jsx`, `PanellsAdministracioSistema.jsx`, `BotoneraClassificacio.jsx` i `NotesEditor.jsx`.

- **20:03** · **Diagnosi P1-b.** Confirmada: `navegacioDePerfil` (`src/sections/profile/perfilModel.js:102-118`) posa sempre l'opció `administracio-sistema`; `PerfilShell.jsx:218` la crida sense cap rol i `PerfilShell.jsx:228` estén `itemsDAdministracioSistema()` (6 apartats) per a tothom; `renderDetail` (`PerfilShell.jsx:237-242`) pinta els 6 panells només per `item.data.vista`; `seleccioInicialDePerfil` (`perfilModel.js:73-79`) accepta `administracio-sistema` des de la ruta sense rol. `PanellCromIntegrat` (`PanellsAdministracioSistema.jsx:40`) només mira `teCapacitat('personalitzacio')` i `desarAlPoble` (`:81-107`) crida `adminDesaPersonalitzacio` sense cap guarda.
- **Guarda canònica.** r58 a `MurSection.jsx:153` usa `useSessioOpcional()?.rol === 'superadmin'`; el Perfil ja usa `useSuperadminEstable()` (`PerfilShell.jsx:461`, sense parpelleig en renovar el JWT). Reutilitze `useSuperadminEstable().esSuperadmin` (el mateix `sessio.esSuperadmin` que DetallCompte), coherent amb el fitxer.
- **Proves que fixaven el forat.** `PerfilShell.test.jsx:91-108`, `PerfilShell.espai.test.jsx:83`, `LaboratoriTaxonomiaDoctoral.test.jsx:47` i `UniversalWorkspace.ajustos.consumidors.test.jsx:107-111` esperen el grup sense superadmin: caldrà actualitzar-les a propòsit (hunks mínims) o quedaran roges.

- **20:04** · **Pegat P1-b.** `perfilModel.js`: `navegacioDePerfil(identitats, aplicacions, { superadmin = false })` només hi posa `administracio-sistema` amb `superadmin === true` (tancat per defecte); `seleccioInicialDePerfil(..., { superadmin })` ja no obri l'administració des de la ruta sense rol. `itemsDAdministracioSistema()` es queda com a catàleg pur.
- `PerfilShell.jsx` (sobre r58): `useSuperadminEstable()` a `PerfilManagerInner` → passa `superadmin` a la tria inicial i al model, estén els 6 apartats només si és superadmin, i `renderDetail` torna `null` per a qualsevol `admin-*` sense superadmin (defensa en profunditat si un apartat arriba per hash o selecció recuperada).
- `PanellsAdministracioSistema.jsx`: `potDesar = teCapacitat('personalitzacio') && esSuperadmin` (via `useSuperadminEstable`), i `desarAlPoble` ix sense cridar `adminDesaPersonalitzacio` si `!potDesar`. Per què: la capacitat del port no és un rol; el servidor ho torna a comprovar (`private.es_superadmin()`), però la UI no ha d'oferir ni intentar l'escriptura.

- **20:06** · **Proves P1-b.** Actualitzades a propòsit (hunks mínims, comentari «Onada R6 · Bloc 2 (P1-b)»): `PerfilShell.test.jsx` (la 1a prova ja espera `[['jo','Pep']]` i cap apartat `admin-*` sense superadmin), `PerfilShell.espai.test.jsx:83`, `LaboratoriTaxonomiaDoctoral.test.jsx:47` (`{ superadmin: true }`), `UniversalWorkspace.ajustos.consumidors.test.jsx` (mock `useSessioOpcional: () => m.sessio`, superadmin només dins la prova AH-29). Les 3 últimes són fora del meu carril estricte però fixaven el forat; si algú les reclama, que mantinga estes expectatives.
- Noves: `PerfilShell.test.jsx` «P1-b · sense superadmin…» (null / `esSuperadmin:false` / `rol:'veí'`: ni grup, ni `admin-*`, `?organitzacio=administracio-sistema` cau a `jo`, `renderDetail` torna `null` per als 6; superadmin: grup, els 6 i la ruta) i `src/sections/profile/admin/PanellCromIntegrat.superadmin.test.jsx` (sense superadmin no hi ha «Desar» ni crida; amb superadmin, una crida `clau:'estil'`).
- `npx vitest run src/sections/profile/PerfilShell.test.jsx src/sections/profile/PerfilShell.espai.test.jsx src/sections/profile/admin/LaboratoriTaxonomiaDoctoral.test.jsx src/components/universal/workspace/UniversalWorkspace.ajustos.consumidors.test.jsx` → 4 fitxers, 53/53 verdes (abans d'afegir la prova nova al model). `npx vitest run src/sections/profile/admin/PanellCromIntegrat.superadmin.test.jsx` → 1 fitxer, 2/2 verdes.

- **20:07** · **Esmena.** A l'entrada anterior, «53/53 abans d'afegir la prova nova» és inexacte: la prova P1-b nova de `PerfilShell.test.jsx` ja era dins eixa passada (53 inclou la nova).
- **Diagnosi P1-d.** `BotoneraClassificacio.jsx:153` guarda la carpeta nova en `useState` (`carpetesExtra`) i `afigCarpeta` (`:166-178`) dona `slugDeCarpeta(net)` (`:131-139`, plega accents i caixa) → `Fèstes` i `Festes` donen `f-festes`, i com la cerca d'existent compara `nom.toLowerCase()`, la segona es queda amb l'id de la primera però amb un altre nom. `NotesEditor.jsx:341` (`carpetesLocals`) i `desaCarpeta` (`:392-395`) també només en React; la nota es desa amb `folderId: 'f-<slug>'` i, en recarregar, la carpeta desapareix.
- **On viuen les carpetes.** Cap camí canònic d'escriptura: `noteFolders` ve sempre de la llavor (`src/data/supabase/notes.js:151,178` → `NOTE_FOLDERS_SEED`; `local/notesLocal.js:59` només llig), i el mateix editor ho diu (`AVIS_CARPETES`, `NotesEditor.jsx:78`: «encara no té contracte de dades amb el servidor»). L'únic magatzem persistent de carpetes és el de preferències locals `config/storage.js` (patró `workspace/carpetesVisibles.js`, `useSyncExternalStore`).
- **Decisió.** Mòdul nou al costat de la botonera, `classificacio/carpetesCreades.js`, sobre `storage.js` (com `carpetesVisibles.js`), per àmbit = `scopeKey` de Notes (backend + actor + tenant: un altre compte del mateix dispositiu no les hereta). Slug: mateix nom després de `trim`, espais plegats i minúscules (sense plegar accents) → es reutilitza; un altre nom que dona un slug ja pres → sufix `-2`, `-3`…

- **20:09** · **Pegat P1-d.** Nou `src/components/universal/classificacio/carpetesCreades.js`: `resolCarpeta(nom, existents)` (mateix nom per `clauDeNom` → `{ nova:false }` amb l'id existent; si no, `slugBaseDeCarpeta` + sufix `-2`, `-3`… fins a un id lliure), magatzem `classificacio-carpetes-creades` sobre `config/storage.js` (`{ v:1, ambits:{ <scopeKey>:[{id,nom}] } }`, normalitzat, mapes sense prototip, límits 16 àmbits × 200 carpetes, nom ≤ 80, id `^f-[a-z0-9-]+$`), `desaCarpetaCreada` idempotent i `useCarpetesCreades(ambit)` amb `useSyncExternalStore`.
- `BotoneraClassificacio.jsx`: fora `slugDeCarpeta` local i el `useState` `carpetesExtra`; ara `useCarpetesCreades(enLinia.ambitCarpetes)` i `afigCarpeta` → `resolCarpeta` + `desaCarpetaCreada` si és nova; `onCanviaCarpeta(id, nom)` com abans.
- `NotesEditor.jsx` (Edit, hunks curts fora de la zona SdpImage del carril 2): import, `carpetesLocals = useCarpetesCreades(scopeKey)` (`:342`), les extres porten `parentId: null`, `desaCarpeta` desa via `desaCarpetaCreada(scopeKey, …)` si l'id no és a `carpetes` (deps `carpetes`, `scopeKey`), i `enLinia.ambitCarpetes: scopeKey`.

- **20:10** · **Proves P1-d.** Nou `src/components/universal/classificacio/carpetesCreades.test.jsx` (4 proves): `Fèstes` → `f-festes`, `Festes` → `f-festes-2`, `  FÈSTES ` i `festes` reutilitzen, `Festes!` → `f-festes-3`, `mur` reutilitza `f-mur`; la botonera crea, persistix i, després d'una recàrrega simulada (`cleanup` + `_reiniciaCarpetesCreades`, storage intacte), el selector torna a portar les dues; un altre àmbit no les hereta i `desaCarpetaCreada` és idempotent; storage brut, ids sense `f-`, repetits i l'àmbit `__proto__` no trenquen res.
- `npx vitest run src/components/universal/classificacio/carpetesCreades.test.jsx src/components/universal/classificacio/Classificacio.test.jsx` → 2 fitxers, 30/30 verdes. `npx vitest run src/sections/notes/NotesEditor.p4.test.jsx src/sections/notes/NotesEditor.ambit.test.jsx src/sections/notes/NotesEditor.ambitEnLinia.test.jsx src/sections/notes/NotesEditor.test.jsx src/sections/notes/notaPreparada.test.jsx` → 5 fitxers, 123/123 verdes.

- **20:11** · **Retoc.** `NotesEditor.jsx`: `scopeKey` afegit a les deps del `useMemo` gran (`:803`, ESLint `exhaustive-deps` per `ambitCarpetes`). `npx eslint` dels 9 fitxers tocats → 0 errors, 0 avisos. `npx vitest run src/sections/notes/NotesEditor.p4.test.jsx src/sections/notes/NotesEditor.test.jsx` → 2 fitxers, 76/76 verdes.
- **Veredicte P1-b: FET.** Grup, 6 apartats, ruta `?organitzacio=administracio-sistema` i detall `admin-*` només amb `useSuperadminEstable().esSuperadmin`; el Crom no ofereix ni intenta desar sense superadmin. Nota: r58 a `MurSection.jsx:153` mira `rol === 'superadmin'` i el Perfil `esSuperadmin`; convé unificar-ho (proposta, no tocat).
- **Veredicte P1-d: FET al carril, amb dos pendents.** (1) Petició al carril de `NotesSection.jsx`: a `:452` (`opcionsDeCarpetes(noteFolders, t)`) cal sumar-hi `useCarpetesCreades(scopeKey)` perquè la carpeta nova isca també a la primera columna de Notes (ara ix a l'editor, la botonera i `DialegCarpeta`). (2) Bloc següent / Mestre: contracte de servidor per a carpetes (taula o fila `app_content` per actor + migració); fins llavors la persistència és per dispositiu i per `scopeKey`, no viatja entre aparells.
- **Fitxers.** Carril: `perfilModel.js`, `PerfilShell.jsx`, `PanellsAdministracioSistema.jsx`, `BotoneraClassificacio.jsx`, `NotesEditor.jsx` (5 hunks fora de 64-121), nous `classificacio/carpetesCreades.js`, `carpetesCreades.test.jsx`, `admin/PanellCromIntegrat.superadmin.test.jsx`; proves actualitzades: `PerfilShell.test.jsx`, `PerfilShell.espai.test.jsx`, `LaboratoriTaxonomiaDoctoral.test.jsx`, `UniversalWorkspace.ajustos.consumidors.test.jsx`. Res comitat, cap `git add`.

- **20:12** · **Àrbitre · inici.** Revisats amb `diff -u` contra `r6b2_abans`: `perfilModel.js`, `PerfilShell.jsx`, `PanellsAdministracioSistema.jsx`, `BotoneraClassificacio.jsx`, `NotesEditor.jsx` (només la regió de carpetes, la línia `ambitCarpetes: scopeKey` i la dependència `scopeKey`; el node SdpImage del carril 2 no s'ha tocat) i el mòdul nou `carpetesCreades.js`.
- P1-b: el grup, els 6 ítems, la selecció inicial per ruta i `renderDetail` (`admin-*`) depenen de `useSuperadminEstable().esSuperadmin`; el Crom exigix capacitat i superadmin abans de cridar `adminDesaPersonalitzacio`. No hi ha cap altre consumidor de `itemsDAdministracioSistema` ni de `PanellCromIntegrat` fora de `PerfilShell.jsx` (grep).
- P1-d: `resolCarpeta` dona ids distints a «Fèstes» i «Festes» (`f-festes`, `f-festes-2`) i reutilitza el mateix nom; `DialegCarpeta` no crea carpetes, només tria. `setVal` ja captura les excepcions de quota.
- `npx eslint` sobre els 8 fitxers font i de prova: 0 errors, 0 avisos.

- **20:13** · **Àrbitre · defecte i correcció.** `desaCarpetaCreada` (`carpetesCreades.js`) fusionava des de la memòria del mòdul: amb dos pestanyes obertes, la segona que desava sobreescrivia les carpetes de la primera i deixava notes apuntant a una carpeta fantasma, el mateix mal de P1-d. Ara torna a llegir el storage (`cache = null`) abans de fusionar.
- Prova nova a `carpetesCreades.test.jsx`: «desar no esborra les carpetes que una altra pestanya ha desat mentrestant».
- `npx vitest run src/components/universal/classificacio/carpetesCreades.test.jsx src/components/universal/classificacio/Classificacio.test.jsx src/sections/notes/NotesEditor.test.jsx src/sections/notes/NotesEditor.p4.test.jsx`: 4 fitxers, 107/107 verdes. `npx eslint` sobre els 2 fitxers: net.
- Abans de la correcció, `npx vitest run` sobre `PerfilShell.test.jsx`, `PerfilShell.espai.test.jsx`, `PanellCromIntegrat.superadmin.test.jsx`, `carpetesCreades.test.jsx`, `Classificacio.test.jsx`, `NotesEditor.test.jsx` i `NotesEditor.p4.test.jsx`: 7 fitxers, 150/150 verdes.
- **Àrbitre · veredicte.** Acceptat amb correccions. P1-b està complet. P1-d està complet en el disseny local, per dispositiu.
- El bloc següent ha d'agafar estos pendents:
  - Al carril de `NotesSection.jsx:452`, fusionar `useCarpetesCreades(scopeKey)` en la primera columna, perquè «apareixen a tot arreu» encara no es complix ací.
  - Decisió del Mestre sobre un contracte de carpetes al servidor (taula i migració), perquè una carpeta no seguix la persona a un altre dispositiu.
  - Unificar la guarda de `MurSection.jsx:153` (`rol === 'superadmin'`) amb `useSuperadminEstable`.
  - No hi ha escolta de l'esdeveniment `storage` (una pestanya no veu en viu les carpetes de l'altra fins que recarrega). És menor.
  - No s'ha verificat al navegador.

<!-- R6B2:S3:FI -->

### B2-S4 · P0-26 D2 i P1-f · `seed.sql` i tesaurus mandrós

- **20:02** · **Inici.** Constructor del carril B2-S4: D2 (regenerar `supabase/seed.sql` des del generador + ampliar `seedSql.pobles.test.js`) i P1-f (tesaurus mandrós fora del fragment comú de `elementDeSeccio.js`). Comence per llegir el generador i provar la càrrega estàtica amb un build real al scratch.

- **20:03** · **Diagnosi D2.** `supabase/seed.sql` (16:48, idèntic a la còpia d'abans del bloc) és vell respecte de les llavors: La Torre hi porta `population: '749 hab'`, `image_url`/`avatar_url` = `commons-ah27.webp`, `lat 38.6066667 / lng -0.4191667`, i la fila `feedPosts` → `manifest-de-poble` encara té `content` en text pla («El Manifest de Poble és un document obert…»).
- Les llavors vives (`src/data/appSeed.js` → `APP_CONTENT_ROWS`, `townsSeed.js` → `MOCK_TOWNS`) ja són bones: `700 hab`, `/assets/towns/la-torre-de-les-macanes/1.jpg` i `2.jpg`, `38.5919 / -0.4184`, Manifest amb HTML ric (`<h3>Un document obert dels pobles</h3>`…). Causa: ningú ha tornat a executar `scripts/generate-supabase-seed.mjs` després dels arranjaments R5-D5.
- El generador no necessita entorn (només importa `appSeed.js`); es crida amb `sh scripts/generate-supabase-seed.sh` (escriptura atòmica).

- **20:03** · **Pegat D2 · regeneració.** `sh scripts/generate-supabase-seed.sh` (sense entorn, sense tocar el generador). `git diff --stat supabase/seed.sql` → `1 file changed, 5 insertions(+), 5 deletions(-)` (cada fila d'`app_content` és una línia). La Torre ara: `700 hab`, `image_url …/1.jpg`, `avatar_url …/2.jpg`, `lat 38.5919`, `lng -0.4184`. Manifest: `content` 345 → 6647 caràcters, amb `<h3>Un document obert dels pobles`, `<h3>Dos pilars per a revitalitzar els pobles`, `<h4>Despoblament`…
- Comparació fila a fila amb la còpia d'abans (`r6b2s4_compara.mjs` al scratch): 5 de 10 claus canvien, 7 elements en total, cap alta ni baixa. `feedPosts` 1 (manifest: `content|searchText`); `towns` 1 (la Torre: `population|image_url|avatar_url|lat|lng|imatges|imageSrc|wikipedia_provenance|population_year|copyright|searchText`); `mediaItems` 1 (`town-la-torre-de-les-macanes`: `src` `commons-ah27.webp` → `1.jpg`, crèdits).
- Canvis no demanats però coherents amb les llavors vives: `events` → `aplec-2023` (`content` 9 → 25189 caràcters i `video_youtube` null → `TlZWYbnGuCE`); `pages` → `constitucio` i `wikidepoble` (`subtitle|lead|html`, p. ex. «Quines lleis no podem trencar?» → «Normes tècniques, ètiques i de governança del projecte») i `consola` (`pagines`, 6 → 6, contingut). No he retocat la sortida a mà.

- **20:04** · **Pegat D2 · prova.** `src/sections/pobles/seedSql.pobles.test.js`: importa `MOCK_TOWNS` de `./townsSeed.js` i afig dos `describe`: (1) cada poble de `MOCK_TOWNS` ha de tindre al seed.sql els mateixos `image_url`, `avatar_url`, `population`, `lat`, `lng` (llista de divergències buida) + cas fix de la Torre (`700 hab`, `1.jpg`, `2.jpg`, `38.5919`, `-0.4184`); (2) la fila `feedPosts` → `manifest-de-poble` té `content` idèntic a la llavor i conté `<h3>Un document obert dels pobles</h3>`, `<h3>Dos pilars per a revitalitzar els pobles</h3>` i `<h4>Despoblament</h4>`. Amb el seed.sql d'abans, la Torre hauria fallat en els cinc camps i el Manifest en el contingut.
- **Proves D2.** `npx vitest run src/sections/pobles/seedSql.pobles.test.js src/sections/mur/seedSql.autoria.test.js src/sections/multimedia/seedSql.multimedia.test.js` → 3 fitxers, 17/17 verdes (879 ms).

- **20:10** · **Diagnosi P1-f (build real).** `npx vite build --outDir "$S/r6b2_build_abans" --emptyOutDir`: el bundle s'escriu sencer, però el build acaba en error perquè `tooling/vite/public-net.mjs:75` (`writeBundle`) exigix que l'eixida siga dins del projecte; els fitxers ja estan escrits quan salta (no he tocat res de `dist/`). El tesaurus (`sdp_taxonomia_doctoral_admin_v1`, `comarquesDetectades`) i `sdp_revisio_editorial_wp_v1` viuen al tros `transformadorEditorialWpBlogger-C6vRsBeT.js`: 450 348 B (56 790 B gzip). Principal `index-fq8L3xEe.js`: 712 103 B (247 840 B gzip); `elementDeSeccio-8RqTksrA.js`: 33 367 B.
- **Confirmat.** El tros del tesaurus és dependència estàtica de `elementDeSeccio`, `MurSection`, `PerfilShell`, `ConnexionsPubliques`, `EntitatsDelPoble`, `Seguidors` i figura a la llista de precàrrega de 11 rutes mandroses més (`ItemDetailSection`, `NotesSection`, `XatSection`, `ConnectarSection`, `TextSection`, `PageDetailSection`, `PerfilPublicSection`, `PluginPage`, `MapaFotografic`, `PortabilitatFederada`, `FitxaVivaDeComunitat`): qualsevol d'elles baixa els 450 KB.
- **Causa (no n'hi ha una, n'hi ha quatre).** (1) `elementDeSeccio.js:46` → `transformadorEditorialWpBlogger.js:10-13` → tesaurus i `:6-9` → `mapaEnllacosInternsWp.js`; (2) `detailSectionMeta.jsx:58` importa del mateix transformador `llegeixEstatRevisioEditorial` i `desaRevisioArticleImportat` (només storage), i `elementDeSeccio.js:33` importa `detailSectionMeta.jsx`; (3) `MurSection.jsx:37-42` (`lligArticlesImportatsAmbRevisio`, `estadistiquesRevisioImportacio`); (4) `PerfilShell.jsx:30-31` importa estàticament `LaboratoriTaxonomiaDoctoral.jsx` i `BancImportacioEditorial.jsx`. Canviar només la línia 46 no trau el tros de cap ruta: (2) el torna a arrossegar.
- **Per què no basta un índex síncron.** `trobaArticleImportatComAPublicacio` construïx la publicació amb gairebé tots els camps de l'article: la projecció mínima pesa 264 685 B (30 785 B gzip). L'índex de claus (slug + id) pesa 21 143 B (7 635 B gzip), però l'article sencer s'ha de carregar amb `import()` i el ganxo ha de tornar a pintar quan arriba.

- **20:11** · **Pegat P1-f · 1 (mòdul lleuger de revisió).** Nou `src/utils/revisioEditorialWp.js` (sense cap import): `CLAU_STORAGE_REVISIO_WP`, `obteStorageSegur`, `llegeixEstatRevisioEditorial`, `desaEstatRevisioEditorial`, `desaRevisioArticleImportat`, copiats literalment del transformador (inclosa la versió `obteStorageSegur` de Gemini r58). `src/utils/transformadorEditorialWpBlogger.js` els esborra i els reexporta amb `export { … } from './revisioEditorialWp.js'`: mateixos noms, mateix comportament, cap consumidor canvia. Per què: és el que `detailSectionMeta.jsx:58` necessita, i ara el pot importar sense el tesaurus.
- **Prova.** `npx vitest run src/utils/transformadorEditorialWpBlogger.test.js` → 1 fitxer, 4/4 verdes.

- **20:13** · **Pegat P1-f · 2 (índex generat).** Nou `scripts/genera-index-articles-importats.mjs` (llig `ARTICLES_SIMULADOR_IA_425`, escriu les claus `slug` i `String(id)` ordenades) i el seu resultat `src/data/taxonomia/indexArticlesImportats.js`: `CLAUS_ARTICLES_IMPORTATS`, 850 claus (425 slugs + 425 id), 24 107 B en font. Són exactament les claus que casa `trobaArticleImportatComAPublicacio` (`slug`, `wp_id` = `id`, `id`).
- **Pegat P1-f · 3 (carregador).** Nou `src/utils/articlesImportatsMandros.js` (només importa `react` i l'índex): `esClauDArticleImportat` (síncron, amb `trim` com l'original), `carregaArticlesImportats()` (`import('./transformadorEditorialWpBlogger.js')` una sola volta, reintent si falla), `trobaArticleImportatComAPublicacio` (delega en la del transformador quan ja és carregat; `null` mentre no), `estatArticleImportat` i el ganxo `useEstatArticleImportat(itemId)` (`useSyncExternalStore` + `useEffect`: demana la càrrega i torna a pintar; `'carregant'`/`'error'`/`null`).
- **Pegat P1-f · 4 (prova).** Nou `src/utils/articlesImportatsMandros.test.js`, 6 proves: paritat índex ↔ tesaurus; cap import estàtic de tesaurus/transformador/mapa als tres mòduls lleugers; el transformador reexporta la revisió amb identitat (`toBe`); abans de carregar `null` + `'carregant'`; el ganxo passa de `'carregant'` a `null` en arribar; després de carregar, resultat `toEqual` al del transformador per a les 850 claus + espais, clau buida, `null`, `undefined` i clau inexistent, amb un storage de prova amb revisió `aprovat`.
- **Proves.** `npx vitest run src/utils/articlesImportatsMandros.test.js src/utils/transformadorEditorialWpBlogger.test.js` → 2 fitxers, 10/10 verdes.

- **20:15** · **Build després (arbre viu).** Mateixa ordre cap a `r6b2_build_despres` (mateix error de `public-net.mjs:75` després d'escriure). Res no canvia per al tesaurus: `transformadorEditorialWpBlogger-6o91H45Z.js` 450 354 B (56 787 B gzip), arrossegat pels mateixos 18 trossos, perquè la línia 46 d'`elementDeSeccio.js` i `detailSectionMeta.jsx:58` encara apunten al transformador. El principal passa a `index-I0tsVlbg.js` 715 350 B (248 872 B gzip, +3 247 B) i `NotesSection` +1 083 B: són canvis d'altres carrils, no meus (el carregador i l'índex encara no són a cap tros).
- **Build simulat (prova dels trossos que demane).** `npx vite build --config "$S/r6b2s4_vite_simulacio.mjs" --outDir "$S/r6b2_build_simulacio" --emptyOutDir`: la configuració del repo + un `transform` en memòria (no toca l'arbre) amb quatre substitucions: `elementDeSeccio.js` importa de `articlesImportatsMandros.js`, `detailSectionMeta.jsx` de `revisioEditorialWp.js`, i `PerfilShell.jsx` fa `lazy()` del Laboratori i del Banc.
- **Resultat simulat.** El tesaurus ix a un tros propi, `tesaurusDoctoralSocDePoble-DTcGM5jN.js` 395 423 B (42 072 B gzip); el transformador queda en 51 574 B; `revisioEditorialWp` té el seu tros xicotet. Deixen d'arrossegar-lo: `elementDeSeccio`, `ItemDetailSection`, `NotesSection`, `XatSection`, `ConnectarSection`, `ConnexionsPubliques`, `EntitatsDelPoble`, `Seguidors`, `TextSection`, `PageDetailSection`, `PerfilPublicSection`, `PluginPage`, `PortabilitatFederada`, `FitxaVivaDeComunitat` (14). `PerfilShell` 161 447 → 136 599 B i només el demana pels `lazy()` admin. El segueixen carregant `MurSection` (import estàtic de `MurSection.jsx:37-42`) i `MapaFotografic` (via el Mur).
- **Proves.** `npx vitest run src/utils/articlesImportatsMandros.test.js src/utils/transformadorEditorialWpBlogger.test.js src/sections/detail/elementDeSeccio.test.js src/sections/profile/admin/LaboratoriTaxonomiaDoctoral.test.jsx` → 4 fitxers, 40/40 verdes. `npx eslint` dels 7 fitxers tocats o nous → net.

- **20:15** · **Per què no he canviat la línia 46 d'`elementDeSeccio.js`.** Tota sola seria una regressió: `trobaElement` tornaria `null` mentre el transformador no arriba i, sense el ganxo, ningú no torna a pintar; una entrada en fred a `/mur/<slug-importat>` diria «No trobat». El canvi de la línia 46 ha d'anar amb dos línies de `useElementDeSeccio`, que són de B2-S1. `ItemDetailSection.jsx` no cal tocar-lo: ja espera amb `estatElement === 'carregant'` (`:146-147`) i el ganxo el torna a pintar.
- **Petició 1 (B2-S1 o integrador, `src/sections/detail/elementDeSeccio.js`, un sol tros).** Línia 46 → `import { trobaArticleImportatComAPublicacio, useEstatArticleImportat } from '../../utils/articlesImportatsMandros.js';`. Dins de `useElementDeSeccio`, després de `const item = trobaElement(section, itemId);` → `const estatImportat = useEstatArticleImportat(!item && section?.listPath === '/mur' ? itemId : null);` i `const estat = item ? 'trobat' : (estatImportat || estatSenseElement);`.
- **Petició 2 (`src/sections/detail/detailSectionMeta.jsx:58`).** `import { desaRevisioArticleImportat, llegeixEstatRevisioEditorial } from '../../utils/revisioEditorialWp.js';` (mateixes funcions, `toBe` provat).
- **Petició 3 (`src/sections/profile/PerfilShell.jsx:30-31`).** `const LaboratoriTaxonomiaDoctoral = lazy(() => import('./admin/LaboratoriTaxonomiaDoctoral.jsx'));` i igual per a `BancImportacioEditorial` (tots dos tenen `export default`), amb `<Suspense>` a `:246-247`. Així el Laboratori Doctoral carrega el tesaurus sencer només quan s'obri, sense tocar el seu codi; per això no he tocat `LaboratoriTaxonomiaDoctoral.jsx`.
- **Petició 4 (següent bloc, `src/sections/mur/MurSection.jsx:37-42` i `:157-168`).** `dadesRevisioWp` només usa el tesaurus amb `modeRevisioWp`: carregar-lo amb `carregaArticlesImportats()` dins d'un efecte, i passar `INSIGNIES_CASOS_US_IMPORTACIO` + `CASOS_US_EDITORIALS` a `revisioEditorialWp.js`. Sense açò, el Mur i `MapaFotografic` continuen baixant-lo.

- **20:15** · **Veredicte.** D2 FET: `supabase/seed.sql` regenerat amb el generador (la Torre: `700 hab`, `1.jpg`/`2.jpg`, `38.5919/-0.4184`; Manifest amb HTML ric; a més `aplec-2023`, `constitucio`, `wikidepoble` i `consola` al dia amb les llavors), i `seedSql.pobles.test.js` ampliat (17/17 verdes amb les altres dos de seed.sql). P1-f DIAGNOSTICAT I PREPARAT, NO ACABAT: el tesaurus arriba a 18 trossos; el mòdul lleuger de revisió (ja en ús pel transformador), l'índex generat i el carregador mandrós amb ganxo estan fets i provats (40/40), i el build simulat demostra que les peticions 1-3 el trauen de 14 rutes.
- **Per al bloc següent.** Aplicar les peticions 1 i 2 juntes (o 1 sola mai), després la 3, i tornar a fer el build: el tesaurus ha d'eixir a `tesaurusDoctoralSocDePoble-*.js` i desaparéixer de la llista d'`elementDeSeccio`. La petició 4 per al Mur. A més, `tooling/vite/public-net.mjs:75` fa fallar tot build amb `--outDir` fora del projecte després d'haver escrit els fitxers: no és meu, ho anote perquè les mesures al scratch no paresquen builds trencats. Res de `git add`/`commit`, ni `dist/`, ni desplegament.

- **20:17** · **Àrbitre · inici.** He revisat amb `diff -u` contra `r6b2_abans` els fitxers `transformadorEditorialWpBlogger.js`, `seedSql.pobles.test.js` i `elementDeSeccio.js`, a més del `supabase/seed.sql` pristí. També he llegit sencers els mòduls nous `revisioEditorialWp.js`, `articlesImportatsMandros.js` i `genera-index-articles-importats.mjs`, i la capçalera de `indexArticlesImportats.js`.
- `elementDeSeccio.js` té un diff d'este bloc (`revisaElement`, `SECCIO_DE_LA_LLISTA`), però és del carril 1 (P0-25), no d'este. La línia 47 encara importa `trobaArticleImportatComAPublicacio` del transformador sencer, tal com diu el constructor.

- **20:17** · **Àrbitre · D2, comprovació.** He copiat el seed a `scratchpad/r6b2s4_arbitre_seed_pre.sql` i he tornat a executar `node scripts/generate-supabase-seed.mjs`. Amb `cmp` ix IDÈNTIC, així que el `seed.sql` és la sortida exacta del generador amb les llavors vives i no s'ha editat a mà.
- Respecte del pristí canvien 5 files de `app_content`: `feedPosts`, `events`, `towns`, `mediaItems` i `pages`. Totes cauen dins de l'abast de les llavors vives que ja va informar el constructor.
- La Torre té `700 hab`, `1.jpg` (imatge), `2.jpg` (avatar) i 38.5919 / -0.4184. El Manifest porta l'HTML ric. Les proves noves comparen els 5 camps amb `MOCK_TOWNS` per a cada poble i el contingut del Manifest amb la llavor, i a més miren tres encapçalaments.
- D2 està complet. No hi he trobat cap defecte.

- **20:17** · **Àrbitre · P1-f, refutació.** Els mòduls nous són correctes però MORTS: cap consumidor de producció els importa (`grep`: `elementDeSeccio.js:47` i `detailSectionMeta.jsx` encara van al transformador). Els builds de scratch ho confirmen: a `r6b2_build_despres` el tesaurus continua en `transformadorEditorialWpBlogger-*.js`, amb 450.354 B.
- Només la simulació (`r6b2_build_simulacio`) el trau a `tesaurusDoctoralSocDePoble-*.js` (395.423 B). P1-f, per tant, NO està fet. El constructor diu «partial» i és honest.
- La guarda del constructor és encertada. Si es canviara només l'import de la línia 47, que és l'únic que deixa este carril, el detall en fred de `/mur/<slug-importat>` passaria a «No trobat». Cal també el ganxo dins `useElementDeSeccio`, i este carril no el pot tocar.
- He comprovat la petició 1: `ItemDetailSection.jsx:110` crida `trobaElement` de manera síncrona, però a la línia 146 també crida `useElementDeSeccio`. La subscripció `useSyncExternalStore` el torna a pintar i `esperant` cobreix el 'carregant'. La petició 1 és suficient i no cal tocar `ItemDetailSection`.
- He comprovat també l'equivalència de l'índex. El transformador casa la clau per `slug`, `wp_id` o `id`, i `wp_id` = `art.id` (0 divergències sobre els 425 articles). La prova compara totes les claus de l'índex amb el transformador.

- **20:17** · **Àrbitre · proves.** He executat `npx vitest run src/sections/pobles/seedSql.pobles.test.js src/sections/mur/seedSql.autoria.test.js src/sections/multimedia/seedSql.multimedia.test.js src/utils/articlesImportatsMandros.test.js src/utils/transformadorEditorialWpBlogger.test.js src/sections/detail/elementDeSeccio.test.js src/sections/profile/admin/LaboratoriTaxonomiaDoctoral.test.jsx`: 7 fitxers, 57/57 verds.
- He passat `npx eslint` pels 7 fitxers del carril i ix net. Les portes RULE 4 no s'apliquen, perquè no hi ha cap canvi d'UI.
- **Àrbitre · veredicte.** Acceptat. D2 està fet i el `seed.sql` es reprodueix bit a bit amb el generador. P1-f NO està fet: només n'he deixat la infraestructura, provada però sense consumidors.
- El bloc següent ha d'aplicar, en un sol commit, les peticions 1 (`elementDeSeccio.js`: import i ganxo), 2 (`detailSectionMeta.jsx:58`, que ha d'importar de `revisioEditorialWp.js`) i 3 (`PerfilShell.jsx:30-31`, amb `lazy` + `Suspense`). Després cal la petició 4 (`MurSection.jsx`) i un rebuild que mostre `tesaurusDoctoralSocDePoble-*.js` fora del xunk comú.
- Si el tesaurus canvia, cal tornar a executar `node scripts/genera-index-articles-importats.mjs`; la prova d'índex ho avisa. No he corregit res, perquè no hi havia cap defecte clar dins del carril.

<!-- R6B2:S4:FI -->

### Verificació i relleu del Bloc 2

- **20:00** · Obert el Bloc 2. Fitxers ja bruts d'altres mans en carrils d'este bloc: `elementDeSeccio.js`, `NotesEditor.jsx`, `PerfilShell.jsx` i `transformadorEditorialWpBlogger.js` (r58). Es construïx damunt, sense revertir.

- **20:02** · A les 20:02 he llançat el workflow `wf_0816e418-c9e`, amb els carrils B2-S1 a B2-S4 i un àrbitre-corrector darrere de cada un. Tres fitxers els tenen dos carrils alhora: `NotesEditor.jsx` (S2 el node SdpImage, S3 `desaCarpeta`), `elementDeSeccio.js` (S1 la capa de revisions, S4 només l'import del transformador) i `modules.css` (només S2, les regles dels peus de foto). En eixos fitxers, els carrils només poden editar amb l'eina Edit i trossos menuts. El build de P1-f es fa a l'scratch, mai a `dist/`.

- **20:20** · **Verificació del Bloc 2 (Claude, fil principal).** Han acabat els 8 agents i cap no ha fallat. Veredictes: S1 acceptat; S2 acceptat amb correccions (prova de `enllacaImatge`); S3 acceptat amb correccions (la carrera entre dues pestanyes de `carpetesCreades.js`); S4 acceptat, però a mitges, perquè el carril no podia tocar els consumidors.
  - **Integració que he fet jo:** els tres trossos de P1-f que demanava S4.
    - `elementDeSeccio.js` importa ara `articlesImportatsMandros.js` i usa el ganxo `useEstatArticleImportat`. Un article importat dona `'carregant'` mentre arriba el transformador, en compte de «No trobat».
    - `detailSectionMeta.jsx:58` importa de `revisioEditorialWp.js`.
    - `PerfilShell.jsx` carrega el Laboratori i el Banc amb `lazy()` i `Suspense`, declarats després dels imports.
    - A més, `NotesSection.jsx:452` posa les carpetes creades en línia a la primera columna, la petició pendent de S3.
    - L'avís d'ESLint de `NotesEditor.jsx:803` ja no hi era.
  - **Proves:** `npx vitest run` sobre 44 fitxers dirigits dels 4 carrils i de la integració: 809/809. ESLint net als fitxers que he tocat.
  - **Build a l'scratch (`r6b2_build_integrat`):** el tesaurus ja té chunk propi, `tesaurusDoctoralSocDePoble-*.js`, de 395.423 B, i el transformador baixa de 450.348 B a 54.140 B. El chunk principal només hi duu la referència al nom del fitxer. `PerfilShell` passa de 161.447 B a 136.685 B. L'eixida 1 és el cas conegut de `tooling/vite/public-net.mjs:75` quan `outDir` queda fora del projecte; els fitxers sí que s'han escrit. No he passat la suite global ni les portes.
- **Relleu per al Bloc 3 i decisions per al Mestre.**
  - **D-R6-1, revisions de la llavor:** ara només es guarden al navegador, perquè `app_content` és de només lectura per RLS. Per compartir-les cal triar entre una taula de revisions amb RLS (superadmin o autor) i un mètode del port, o migrar la llavor a `section_submissions` amb UUID. Les revisions no van lligades a cap persona: en un dispositiu compartit, les veu qualsevol sessió. Els esdeveniments no tenen guarda de signatura forastera. El camí de reserva `trobaArticleImportatComAPublicacio` no aplica la capa de revisions.
  - **D-R6-2, carpetes:** també es guarden només al dispositiu, per àmbit, perquè cap servidor escriu carpetes (`NOTE_FOLDERS_SEED`). Cal un contracte al servidor (taula i migració). La memòria no escolta l'esdeveniment `storage`, i una pestanya no veu les carpetes d'una altra fins que recarrega.
  - **D-R6-3, `supabase/seed.sql` regenerat:** a La Torre, 700 hab, `1.jpg`/`2.jpg` i `38.5919/-0.4184`; el Manifest, en HTML ric. També han canviat `events/aplec-2023`, `pages/constitucio`, `pages/wikidepoble`, `pages/consola` i el `mediaItem` de La Torre. Cap fila nova ni esborrada. El tenant remot o PROD s'ha de tornar a sembrar si el Mestre ho decidix.
  - **Pendents de codi:**
    - Falta la clau i18n `section.notes.publicacio.revisioDesada` als 5 diccionaris.
    - Falta el botó de la barra per a `enllacaImatge` (`tiptapToolbarAdapter.js` i i18n).
    - En desar, es perden `manifest-de-poble__adhesio` (Subtargeta), el `span.sdp-sr-only` del botó d'adhesió i les classes `detail-content__*`.
    - P1-f, petició 4: `MurSection.jsx:37-42` i `157-168` encara importen el transformador de manera estàtica, i el Mur i el MapaFotografic continuen baixant el tesaurus. Cal `carregaArticlesImportats()` només amb `modeRevisioWp`.
    - Cal unificar la comprovació de superadmin de `MurSection.jsx:153` (`rol === 'superadmin'`) amb `useSuperadminEstable`.
    - Si canvia el tesaurus, cal tornar a passar `node scripts/genera-index-articles-importats.mjs`.
    - `ItemDetailSection.pobleIncomplet.test.jsx` és inestable quan la màquina va carregada.
  - **Sense fer:** cap prova al navegador al port 3340, ni la suite global, ni `run-portes`. Res commitejat ni desplegat.

<!-- R6B2:S5:FI -->

## Onada R6 · Bloc 3 (4% Ultracode)

Mateix compte de Claude Opus 5.5. El Gauntlet del Bloc 3 té 4 carrils curts amb àrbitre-corrector. La verificació final (B3-6) la fa el fil principal. Partim del rebut `torn_c8cd2144` del pla (línies 468–485) i del prompt (línies 218–236), i de les decisions D-R6-1..3 de MarIA. **Base:** l'arbre viu després del Bloc 2 i el Kit `r58`, que no es repetix. Instantània nova de `src/` a l'scratch (`r6b3_abans`). **Nota:** els diccionaris són a `src/config/idiomes/{ca,es,en,eu,gl}.js`; `src/i18n/locales/` no existix. Res commitejat ni desplegat fins que el Mestre ho valide a `http://localhost:3340`.

### B3-A · D-R6-1 i D-R6-2 · revisions al camí de reserva, signatura dels esdeveniments, `seed_revisions` i escolta de `storage`

- **20:41** · **Inici.** Constructor del carril `B3-A` (D-R6-1 + D-R6-2): revisió sobre el camí de reserva de `trobaElement`, guarda de signatura forastera per a esdeveniments a `/notes`, escolta `storage` a `carpetesCreades.js` i entrada `seed_revisions` al Llibre Mestre.

- **20:43** · **Diagnosi D-R6-1 (a).** `src/sections/detail/elementDeSeccio.js:86-87` torna `trobaArticleImportatComAPublicacio(clau)` sense `revisaElement`: un article importat revisat des de `/notes` pinta l'original al detall.
- **Diagnosi D-R6-1 (b).** La guarda de signatura aliena viu a `NotesContext.jsx:293-312` (`rebuigDePublicacio`) i busca la fila amb `publicacioCarregada` (`:141`), que només coneix `mur` i `mercat`: per a un acte (`events`, p. ex. `aplec-2023`) no troba res i la guarda no corre mai. `PublicacioEditable.jsx:74-76` la crida igual per als actes.
- **Pla.** Funció pura `rebuigDeSignaturaDeLActe` a `publicacioEditable.js` (mateixa lògica `autorDe` + `pertanyALActor` + `aliesDeLActor` i el mateix motiu `motiuSignaturaAliena`), excepte superadmin; `PublicacioEditable.jsx` la passa amb l'element que ja té (`item.data.item`), sense tocar `NotesContext.jsx` (no és del carril).
- **Diagnosi D-R6-2.** `carpetesCreades.js` no escolta `storage`: una carpeta creada en una pestanya no apareix a l'altra fins recarregar.

- **20:43** · **Pegat D-R6-2.** `src/components/universal/classificacio/carpetesCreades.js`: `enCanviDeStorage` (clau `STORAGE_PREFIX + CLAU_CARPETES_CREADES` o `key` null) buida `cache` i avisa els oients; `subscriuCarpetesCreades` registra una sola escolta `storage` amb el primer oient i la lleva amb l'últim, amb guarda de `window`. Mateix patró que `revisionsEditorials.js:112-131`.

- **20:44** · **Proves D-R6-2.** `npx vitest run src/components/universal/classificacio/carpetesCreades.test.jsx` → 1 fitxer, **7/7** verdes (2 noves: el ganxo veu la carpeta d'una altra pestanya amb un `StorageEvent`; una sola escolta, clau aliena ignorada, `key` null avisa, es lleva amb l'últim oient).
- **Pegat D-R6-1 (a).** `src/sections/detail/elementDeSeccio.js:86-90`: el camí de reserva torna `revisaElement('mur', trobaArticleImportatComAPublicacio(clau))` (`revisaElement` ja tolera null). Prova nova `src/sections/detail/elementDeSeccio.revisioImportat.test.js` (fitxer propi, per no tocar la prova d'un altre carril).
- **Proves D-R6-1 (a).** `npx vitest run src/sections/detail/elementDeSeccio.revisioImportat.test.js src/sections/detail/elementDeSeccio.test.js` → 2 fitxers, **25/25** verdes.

- **20:45** · **Pegat D-R6-1 (b).** `src/sections/notes/publicacioEditable.js`: funció pura `motiuActeDAltri(item, { actor, config, esSuperadmin, t })` (només `events`; `autorDe` + `pertanyALActor` + `aliesDeLActor(actor, { dataMode: modeDeDadesResolt(config) })`; motiu `motiuSignaturaAliena`, el mateix del Mur; superadmin passa). `src/sections/notes/PublicacioEditable.jsx`: `useIdentitatOReserva()` (el mateix actor que `NotesContext`) + `useSuperadminEstable()`; la guarda va després de `rebuigDePublicacio` i abans de `desaRevisioEditorial`, amb toast `info` i `ErrorPublicacio`. `NotesContext.jsx` intacte.
- **Proves de no-regressió.** `npx vitest run src/sections/notes/PublicacioEditable.test.jsx` → **17/17** verdes abans d'afegir les proves noves.

- **20:46** · **Proves D-R6-1 (b).** `PublicacioEditable.test.jsx`: dobles `useIdentitatOReserva` i `useSuperadminEstable` + 2 proves noves (pura `motiuActeDAltri`: acte d'altri → motiu amb «El Rentonar», superadmin/propi/sense autor/Mur/sense actor → null; integració: acte `aplec-2023` amb `author_org_id: 'rentonar'` es rebutja amb toast `info` i cap revisió; com a superadmin es desa). `npx vitest run src/sections/notes/PublicacioEditable.test.jsx src/data/revisionsEditorials.test.js` → 2 fitxers, **26/26** verdes.
- **Regressió del veïnat.** `npx vitest run` sobre els 5 `NotesSection.fontPublicacio*.test.jsx`, `PublicacioVerticals8Ambits.integracio.test.jsx`, `PublicacioDetall.sistema.test.jsx` i `MurContext.revisions.test.jsx` → 8 fitxers, **158/158** verdes.

- **20:46** · **Llibre Mestre.** Fila nova **`P1-75`** a «## 🟡 3. Matriu P1» de `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (una sola inserció amb Edit, darrere de `P1-74`): taula `seed_revisions` (`id uuid`, `section`, `seed_id`, `payload jsonb` amb `content`/`title`/`summary`, `author_id`, `created_at`, `updated_at`, `unique (section, seed_id)`), RLS (lectura pública de la vigent; escriptura només superadmin o autor), mètode del port i migració del magatzem local; cita `D-R6-1` (Onada R6, 261105).
- **ESLint.** `npx eslint` sobre els 7 fitxers tocats (`elementDeSeccio.js`, `elementDeSeccio.revisioImportat.test.js`, `publicacioEditable.js`, `PublicacioEditable.jsx`, `PublicacioEditable.test.jsx`, `carpetesCreades.js`, `carpetesCreades.test.jsx`) → 0 errors, 0 avisos.
- **Prova final del carril.** `npx vitest run` sobre els 5 fitxers del carril → **58/58** verdes; el veïnat de `/notes` i `MurContext.revisions` → **158/158**.
- **Veredicte.** **Fet** (D-R6-1 i D-R6-2). `diff -u` contra `r6b3_abans`: només els meus trossos; `src/data/revisionsEditorials.js` sense canvis (no calia). Cap commit, cap desplegament.
- **Peticions a l'àrbitre.** (1) La guarda del Mur (`NotesContext.jsx:293-302`) no té l'excepció de superadmin que MarIA demana per als actes: si el Manifest l'ha de poder revisar un superadmin que no signa com l'entitat, cal tocar `NotesContext.jsx` (fora del meu carril). (2) `motiuActeDAltri` llig el nom de `author_name || seller`; un acte amb només `organizer` mostra «signant desconegut».

- **20:47** · **Àrbitre · inici.** He llegit només els diffs d'este bloc (`elementDeSeccio.js:86-89`, `publicacioEditable.js:124-135`, `PublicacioEditable.jsx:52-87`, `carpetesCreades.js:150-174`) i l'entrada `P1-75` del Llibre Mestre.
- **Àrbitre · revisió.** `revisaElement` torna `null`/element intacte si no hi ha revisió (`revisionsEditorials.js:178`): el camí de reserva no es trenca. `motiuActeDAltri` calca la guarda del Mur (`NotesContext.jsx:294-300`: sense `actor.id` no s'aplica, igual que eixa) i afig l'excepció de superadmin via `useSuperadminEstable` (falla tancat mentre el rol és pendent). L'escolta `storage` filtra per `STORAGE_PREFIX + CLAU_CARPETES_CREADES` (`sdp_embed_`, `storage.js:36`), és única i se'n va amb l'últim oient. Cap HTML nou, cap `style={{}}`, cap text de UI nou fora dels diccionaris.
- **Àrbitre · observació (fora del carril).** La guarda del Mur a `NotesContext.jsx` no té excepció de superadmin i la dels actes sí: asimetria per a decidir MarIA, no és defecte d'este carril.
- **Àrbitre · proves.** `npx vitest run carpetesCreades.test.jsx elementDeSeccio.revisioImportat.test.js elementDeSeccio.test.js PublicacioEditable.test.jsx revisionsEditorials.test.js` → 5 fitxers, `58/58` en verd; `npx eslint` dels 7 fitxers canviats → 0 errors, 0 avisos.
- **Àrbitre · veredicte.** acceptat — requisits de `D-R6-1` (revisió al camí de reserva, guarda d'actes, `P1-75` amb `seed_revisions` i RLS) i `D-R6-2` (escolta `storage`) complits; cap correcció necessària; res commitejat ni desplegat.

<!-- R6B3:S1:FI -->

### B3-B · B3-1 i B3-2 · clau `revisioDesada` i botó `enllacaImatge`

- **20:41** · **Inici.** Constructor del carril B3-B (B3-1 clau `revisioDesada` + B3-2 botó `enllacaImatge`). Comence per localitzar el text de reserva, les claus `noActualitzable*` i el patró de l'enllaç de text a `tiptapToolbarAdapter.js`.

- **20:43** · **Diagnosi.** B3-1: la reserva viu a `src/sections/notes/publicacioEditable.js:116-117` (`avisRevisioDesada`) i la clau `section.notes.publicacio.revisioDesada` no és a cap diccionari; les germanes `noActualitzable*` són a `src/config/idiomes/ca.js:3579-3580` (i `src/i18n/locales` no existix).
- B3-2: l'adaptador (`tiptapToolbarAdapter.js:10-37`) NO té cap acció d'enllaç de text ni cap ajudant de diàleg: el patró real és fila `TOOLBAR_SCHEMA` (`toolbarContract.js`) + fila `TRADUCCIO` + ranura a `UniversalToolbar.jsx:409-461` + glif a `iconesBarra.jsx`. `executa(editor, id)` no accepta cap valor.
- L'ordre `enllacaImatge` (`extensions/index.js:107`) fa `updateAttributes('image', …)`, que torna `true` sense imatge triada: cal una guarda pròpia de `NodeSelection` del node `image` (el nom de `SdpImage`, `Image.extend` sense `name`).
- Trampa: `extensions/targetes/ordresIBarra.test.js:103` fixa la llista exacta de `SCHEMA_VISIBLE`; una fila nova amb ranura l'obliga a créixer en un element (una línia, Edit mínim, ho anote com a toc fora de carpeta).
- Pla: valor opcional a `executa(editor, id, opcions)` i a `exec`, ranura `setImageLink` que demana l'adreça amb `window.prompt` (el mínim sense diàleg propi; un diàleg accessible queda com a petició) i només es pinta quan el motor l'oferix.

- **20:43** · **Pegat B3-1 (diccionaris).** `section.notes.publicacio.revisioDesada` afegida als 5 `src/config/idiomes/{ca,es,en,eu,gl}.js`, just darrere de `noActualitzableLlavor`; el `ca` és la reserva literal de `publicacioEditable.js:116`.
- Al mateix pas, darrere de `section.notes.format.enllacATargeta`, les tres claus del botó B3-2: `section.notes.format.enllacImatge` (etiqueta), `enllacImatgeDemana` (la pregunta) i `enllacImatgeRefusat` (adreça insegura). Inserció per script amb asserció d'absència prèvia i d'una sola àncora per fitxer.

- **20:44** · **Pegat B3-2a (contracte i adaptador).** `toolbarContract.js`: `FORMATS.ENLLAC_IMATGE = 'enllacImatge'` i fila `TOOLBAR_SCHEMA` a la segona fila, `commutable: true`, `ambValor: true`, ranura `isEnllacImatge`/`setImageLink`.
- `tiptapToolbarAdapter.js`: fila `enllacImatge` (actiu = la imatge triada ja té `href`) amb `ordenaEnllacImatge`, que exigix un `NodeSelection` del node `image` amb `c.command(...)` abans de `enllacaImatge`; un valor sense `href` de text (p. ex. un esdeveniment de clic) torna `false`. `executa(editor, id, valor)` i `exec(id, valor)` passen el valor només quan n'hi ha.

- **20:46** · **Pegat B3-2b (barra).** `UniversalRichTextToolbar.jsx`: una fila `ambValor` passa el valor a `exec`; la resta continua sense arguments. `iconesBarra.jsx`: glif nou `IconaEnllacImatge` (`data-icona="enllac-imatge"`, 24 px, `currentColor`).
- `UniversalToolbar.jsx`: `enllacImatge` al final d'`EINES_SECUNDARIES`, ranura `setImageLink` (només es pinta si el motor l'oferix, amb `aria-pressed` = `isEnllacImatge`) i `demanaEnllacImatge`: `window.prompt` amb `enllacImatgeDemana`, buida = lleva, refusada = `window.alert` amb `enllacImatgeRefusat`. Fitxer fora del carril estricte, tocat amb hunks Edit mínims (la ranura és el registre on es pinta l'acció).
- Toc fora de carpeta: `extensions/targetes/ordresIBarra.test.js:103` (una sola línia, `SCHEMA_VISIBLE` creix amb `'enllacImatge'`). Prova nova: `src/components/universal/richText/tiptapToolbarAdapter.enllacImatge.test.jsx`.
- **Prova.** `npx vitest run src/components/universal/richText/tiptapToolbarAdapter.enllacImatge.test.jsx` → 4/4 verdes (contracte; només amb imatge triada; posa, refusa `javascript:` i el clic, lleva; barra de veres amb `prompt` simulat).

- **20:46** · **Proves.** `npx vitest run src/config/i18n.claus.test.js …/targetes/ordresIBarra.test.js …/UniversalToolbar.segonaFila.test.jsx src/sections/mur/articles/cosCanonic.editor.test.js src/sections/notes/llavorNota.tiptap.test.jsx` → 5 fitxers, 313/313 verdes (paritat de claus inclosa). Veïnes de la barra (`DocumentEditor.{imatge,edicioAvancada,test,subtargeta,targetes}`, `UniversalToolbar.encapcalaments`, `subtargeta`, `qualitat`) → 8 fitxers, 129/129 verdes.
- `npx eslint` dels 12 fitxers tocats (5 diccionaris, adaptador, contracte, barra muda, glifs, `UniversalToolbar.jsx`, la prova nova i `ordresIBarra.test.js`) → 0 avisos. Cap `style={{}}`, cap color cru, cap `innerHTML =` nou.
- **Veredicte.** B3-1 i B3-2 fets, sense commit. Pendents per a l'àrbitre: (1) el diàleg és `window.prompt` (no hi havia cap patró d'enllaç de text a imitar); un diàleg accessible propi i l'adreça actual preomplida (l'estat neutre només porta booleans) queden com a petició; (2) dos tocs fora del carril estricte, `UniversalToolbar.jsx` i `ordresIBarra.test.js:103`, tots dos amb hunks mínims; (3) cal mirar-ho a mà a `http://localhost:3340` (Notes → triar una imatge → «⋯» → «Enllaç de la imatge»).

- **20:47** · **Àrbitre · inici.** Revise només els diffs d'este bloc (`tiptapToolbarAdapter.js`, `toolbarContract.js`, `UniversalRichTextToolbar.jsx`, `UniversalToolbar.jsx`, `iconesBarra.jsx`, els 5 `src/config/idiomes/*.js`) contra `r6b3_abans`.
- **Àrbitre · B3-1.** `section.notes.publicacio.revisioDesada` és als 5 diccionaris i el `ca` és bit a bit la reserva de `publicacioEditable.js:119` (únic consumidor, `avisRevisioDesada`). Correcte.
- **Àrbitre · B3-2 seguretat.** L'ordre `enllacaImatge` (`extensions/index.js:107`) passa per `hrefDeImatge` i torna false si no és segur; l'adaptador hi afig la guarda de `NodeSelection` sobre `image` (sense, `updateAttributes` tornaria true) i refusa valors sense `href` de text (un clic). El test prova `javascript:alert(1)` → false. No trobe cap camí d'HTML cru ni de permisos.
- **Àrbitre · crides.** `executa(editor, id, valor)` i `exec(id, valor)` són compatibles cap arrere (sense `valor` es crida igual que abans); només la fila `ambValor` passa argument. Portes: cap `style={{}}`, cap color cru, cap `innerHTML` nou, etiquetes per i18n amb `BlocIcon` accessible.
- **Àrbitre · proves.** `npx vitest run tiptapToolbarAdapter.enllacImatge.test.jsx i18n.claus.test.js ordresIBarra.test.js UniversalToolbar.segonaFila.test.jsx DocumentEditor.imatge.test.jsx` → 5 fitxers, 294/294 en verd; `npx eslint` dels 11 fitxers tocats → eixida 0.
- **Àrbitre · veredicte.** acceptat — cap defecte clar que corregir. Pendents (no defectes): `window.prompt` no ve emplenat amb l'`href` actual i no és un diàleg propi de la casa; les dues toques fora del carril (`UniversalToolbar.jsx`, `ordresIBarra.test.js:103`) són mínimes i coherents. Sense commit ni desplegament: el Mestre ho ha de validar a `http://localhost:3340`.

<!-- R6B3:S2:FI -->

### B3-C · B3-3 · fidelitat completa en desar

- **20:42** · **Inici.** Constructor del carril B3-C (B3-3, fidelitat completa en desar). Abast: `src/components/universal/richText/extensions/**` i `src/sections/mur/articles/cosCanonic.editor.test.js`. No toque `tiptapToolbarAdapter.js` (carril B3-B) ni `src/sections/notes/**`.

- **20:43** · **Diagnosi.** Tres pèrdues en desar el cos canònic. (1) `extensions/subtargeta.js:317-319`: `renderHTML()` escriu només `class="sdp-subtargeta"`, i la caixa d'adhesió de `manifestDePobleContent.js:51` perd `manifest-de-poble__adhesio`. (2) Cap marca de l'editor no llig `<span>`, i el `span.sdp-sr-only` del botó (`manifestDePobleContent.js:54`) es desfà: «(s’obri en una altra pestanya)» queda com a text visible dins de l'enllaç. (3) `maquetacio.js:104-110` (`ClasseDeParagraf`) només cobrix `paragraph`. Per això es perden `detail-content__titol` (h3) i `detail-content__llista` (ul) de `aplec2023Content.js:309` i `:352`. `detail-content__paragraph` (`:310`) tampoc no passa, perquè no és a `CLASSES_DE_PARAGRAF`.
- **Sanejador.** `utils/sanitize.js:228-237` ja admet `span` i `class`, i cap ganxo no toca les classes. No cal cap canvi.
- **Risc previst.** Si el títol i el paràgraf compartixen l'atribut global `classe`, `splitBlock` de TipTap (`keepOnSplit`) passaria la classe del títol al paràgraf nou. Per això cada tipus tindrà un atribut amb nom propi.

- **20:44** · **Pegat 1 · `extensions/maquetacio.js`.** `detail-content__paragraph` entra a `CLASSES_DE_PARAGRAF`. Hi ha llistes noves `CLASSES_DE_TITOL` (`detail-content__titol`) i `CLASSES_DE_LLISTA` (`detail-content__llista`). L'extensió nova `ClassesTipografiques` les aplica amb atributs globals de nom propi: `classeDeTitol` a `heading` i `classeDeLlista` a `bulletList` i `orderedList`. `atributDeClasse(permeses, nom)` rep ara el nom de l'atribut.
- **Pegat 1 (seguix).** La marca nova `NomesPerALectors` (`sdpNomesLector`, `inclusive: false`) llig només `span.sdp-sr-only` i torna a escriure exactament eixe span. Les dues peces van a `extensionsDeMaquetacio()`. No cal tocar `index.js`.
- **Pegat 2 · `extensions/subtargeta.js`.** L'atribut `classe` (`rendered: false`) admet UNA classe de `CLASSES_DE_SUBTARGETA` (`manifest-de-poble__adhesio`). `renderHTML({ node })` l'escriu darrere de `sdp-subtargeta`, i després ve la marca `data-sdp-subtargeta`. És el mateix ordre que deixa DOMPurify. Una subtargeta nova (`inserirSubtargeta`) continua sense classe extra.

- **20:44** · **Pegat 3 · `src/sections/mur/articles/cosCanonic.editor.test.js`.** El viatge d'anada i tornada compta ara també el quadre `div.sdp-subtargeta.manifest-de-poble__adhesio`, `a.sdp-boto > span.sdp-sr-only`, `h3.detail-content__titol` i `ul.detail-content__llista`. Compara també cada classe `detail-content__*` per etiqueta (desat i sanejat contra la font). Hi ha una prova nova per al quadre i el botó: la classe idèntica, el text del span i el `textContent` del botó igual al de la font. La prova de la llista blanca afig una subtargeta, un títol, una llista i spans amb classes `dolent`.
- **Prova.** `npx vitest run src/sections/mur/articles/cosCanonic.editor.test.js` → 1 fitxer, 9/9 en verd.

- **20:45** · **Proves.** `npx vitest run src/components/universal/richText/extensions/ src/components/universal/richText/useUniversalRichText.llavorDesada.test.jsx src/components/universal/richText/useUniversalRichText.senseSubratllat.test.jsx src/components/universal/DocumentEditor.imatge.test.jsx src/components/universal/DocumentEditor.edicioAvancada.test.jsx src/sections/mur/articles/cosCanonic.editor.test.js` → 19 fitxers: 259 proves en verd i 1 en roig.
- **El roig no és d'este carril.** `extensions/targetes/ordresIBarra.test.js` («la barra pinta els encapçalaments…») rep 12 ítems on n'esperava 11. És el botó `enllacaImatge` que el carril B3-B ha afegit a `tiptapToolbarAdapter.js` (canvi de les 20:44:50). Li toca a eixe carril o a l'àrbitre actualitzar l'expectativa de la barra.
- **Repetició.** `cosCanonic.editor.test.js` i `subtargeta.test.js` → 2 fitxers, 40/40 en verd. `npx eslint` dels tres fitxers tocats → 0 avisos.
- **Sondeig descartat.** He provat `sanitizeHtml(desat) === desat` per als dos canònics, i no es complix. El sanejador hi afig `rel="… nofollow"` a cada enllaç i `referrerpolicy="no-referrer"` a cada imatge. És enduriment previ i no és cap pèrdua, però he tret l'asserció. El `div` de la subtargeta i el `span.sdp-sr-only` sí que ixen idèntics byte a byte.

- **20:45** · **Veredicte: FET (B3-3).** Després del viatge per TipTap i pel sanejador ja no es perd res d'això: la classe `manifest-de-poble__adhesio`, el `span.sdp-sr-only` dins del botó d'adhesió i les classes `detail-content__titol`/`__paragraph`/`__llista`. Tot passa per llista blanca. Res commitejat.
- **Peticions fora del carril.** (1) A l'àrbitre o a B3-B: actualitzar l'expectativa de `ordresIBarra.test.js` amb el botó nou. (2) Al Mestre (decisió de CSS, `src/css/modules.css`): dins de `.ProseMirror` el text `.sdp-sr-only` és invisible, com a la lectura. Si cal que l'autor el veja en editar, falta una regla pròpia de l'editor. No l'he tocada.
- **Següent.** B3-6 (fil principal): portes, build a l'scratch i validació a `http://localhost:3340` obrint el Manifest i l'Aplec a `/notes` i desant-los.

- **20:46** · **Àrbitre · inici.** He llegit els diffs d'este bloc de `maquetacio.js`, `subtargeta.js` i `cosCanonic.editor.test.js` contra `r6b3_abans`. Les tres peces van per llista blanca: `CLASSES_DE_SUBTARGETA` (una sola classe, `manifest-de-poble__adhesio`), la marca `NomesPerALectors` (només un `span.sdp-sr-only`, que es torna a escriure amb una classe fixa) i `ClassesTipografiques` (`classeDeTitol` i `classeDeLlista` per separat, de manera que el Retorn no passa la classe del títol al paràgraf nou).
- **Àrbitre · comprovacions.** Al cos canònic només hi ha `h3.detail-content__titol`, `p.detail-content__paragraph` i `ul.detail-content__llista` (Aplec) i un `span.sdp-sr-only` (Manifest). Totes estes classes estan cobertes. El sanejador admet `span` i `class`. No entra cap `href` ni cap HTML nou. La prova d'hostils confirma que les classes `dolent` cauen. No he trobat cap defecte.
- **Àrbitre · veredicte.** Acceptat. `npx vitest run src/sections/mur/articles/cosCanonic.editor.test.js src/components/universal/richText/extensions/ src/components/universal/DocumentEditor.imatge.test.jsx src/components/universal/DocumentEditor.edicioAvancada.test.jsx` dona 17 fitxers i 249/249 en verd. `ordresIBarra.test.js` també passa ara, perquè el carril B3-B ja ha posat al dia la seua expectativa. `npx eslint` sobre els 3 fitxers ix amb codi 0. Queda pendent la decisió del Mestre sobre el CSS de `.sdp-sr-only` dins de `.ProseMirror`, que és fora del carril, i el B3-6.

<!-- R6B3:S3:FI -->

### B3-D · B3-4 i B3-5 · tesaurus fora del Mur i superadmin unificat

- **20:41** · **Inici.** Constructor del carril B3-D (B3-4 tesaurus fora del Mur + B3-5 superadmin unificat). Abast: `src/sections/mur/MurSection.jsx`, les seues proves, `src/utils/revisioEditorialWp.js`, `src/utils/articlesImportatsMandros.js`, `src/utils/transformadorEditorialWpBlogger.js` (només moure constants i reexportar) i `MapaFotografic` si importa el transformador.

- **20:42** · **Diagnosi.** `src/sections/mur/MurSection.jsx:37-42` importa estàticament `CASOS_US_EDITORIALS`, `lligArticlesImportatsAmbRevisio`, `desaRevisioArticleImportat` i `estadistiquesRevisioImportacio` de `transformadorEditorialWpBlogger.js`, que a `:10-13` importa `ARTICLES_SIMULADOR_IA_425`/`PAGINES_WP_18` del tesaurus: el Mur arrossega el chunk sencer. `INSIGNIES_CASOS_US_IMPORTACIO` (`:25-62`) i `CASOS_US_EDITORIALS` (`:310-319`) són constants pures sense tesaurus.
- `MurSection.jsx:157-168` calcula `dadesRevisioWp` amb `useMemo` síncron; cal passar-lo a un efecte amb `carregaArticlesImportats()` (`src/utils/articlesImportatsMandros.js:46`), estat de càrrega i cancel·lació.
- `MapaFotografic.jsx:38-55` NO importa ni el transformador ni el tesaurus (grep a `src/sections` i `src/components`): rep el tesaurus només pel chunk compartit amb el Mur; no cal tocar-lo.
- `MurSection.jsx:153` usa `useSessioOpcional()?.rol === 'superadmin'`; el Perfil (`src/sections/profile/PerfilShell.jsx:471`) usa `useSuperadminEstable()` de `src/hooks/useSuperadminEstable.js`, que torna `{ esSuperadmin, rolPendent }`.
- Prova afectada: `src/sections/mur/MurSection.revisioWp.test.jsx` (síncrona, caldrà `findByTestId`).

- **20:43** · **Pegat 1 (constants).** `INSIGNIES_CASOS_US_IMPORTACIO` i `CASOS_US_EDITORIALS` mogudes bit a bit (verificat amb `assert` abans d'esborrar) a `src/utils/revisioEditorialWp.js` (final del fitxer; el mòdul continua sense cap `import`). `src/utils/transformadorEditorialWpBlogger.js` ara importa `INSIGNIES_CASOS_US_IMPORTACIO` d'allí per a ús intern i reexporta les dues amb el mateix nom al bloc `export { … } from './revisioEditorialWp.js'`: `BancImportacioEditorial.jsx`, `LaboratoriTaxonomiaDoctoral.jsx` i les proves no canvien.

- **20:44** · **Pegat 2 (`MurSection.jsx`).** B3-4: fora l'import estàtic del transformador; ara `CASOS_US_EDITORIALS` i `desaRevisioArticleImportat` venen de `revisioEditorialWp.js` i el transformador arriba per `carregaArticlesImportats()` dins d'un `useEffect` que només corre amb `modeRevisioWp`, amb bandera `viu` (cancel·lació en desmuntar) i estats `transformadorWp`/`errorRevisioWp`. `dadesRevisioWp` crida `transformadorWp.lligArticlesImportatsAmbRevisio()` i `.estadistiquesRevisioImportacio()`: idèntic un cop carregat. Mentre carrega, `<Carregant>` amb `loading.content`; si falla, `<Alerta to="error">` amb `error.xarxa` (claus ja presents als 5 diccionaris); tornar a activar el mode reintenta.
- B3-5: `useSessioOpcional()?.rol === 'superadmin'` → `const { esSuperadmin: esSuperadminMur } = useSuperadminEstable()` (com `PerfilShell.jsx:471`); l'import de `useSessioOpcional` desapareix del Mur.

- **20:45** · **Pegat 3 (proves).** `MurSection.revisioWp.test.jsx`: la prova AH-28 ara és `async`, comprova primer «Carregant contingut...» i espera el panell amb `findByTestId`; mock de `SessionContext.jsx` amb `importOriginal` + `useSessioOpcional: () => mocks.sessio`; dues proves noves B3-5 (convidat i no superadmin sense barra; superadmin amb barra, res carregat fins que activa el mode, i 425 articles després). `MurSection.carregaMes.test.jsx` i `MurSection.error.test.jsx`: el mock de `SessionContext.jsx` no tenia `useSessioOpcional` i 17 proves ja petaven ABANS del Bloc 3 (`No "useSessioOpcional" export is defined on the mock`); afegit `useSessioOpcional: () => null`.
- **Proves.** Línia base abans del pegat: `npx vitest run` de revisioWp + carregaMes + error → 1 passa, 17 fallen (deute heretat). Després: els mateixos 3 fitxers → 20/20. Ampli: `npx vitest run src/sections/mur/MurSection` + `WikiDePobleSection.{seo,sessio}`, `elementDeSeccio.revisioImportat`, `PerfilShell.espai`, `transformadorEditorialWpBlogger`, `articlesImportatsMandros`, `useSuperadminEstable` → 20 fitxers, 128/128.

- **20:45** · **ESLint.** `npx eslint` de `MurSection.jsx`, `MurSection.{revisioWp,carregaMes,error}.test.jsx`, `revisioEditorialWp.js` i `transformadorEditorialWpBlogger.js` → 0 errors, 0 avisos.
- **Abast estàtic.** Script `r6b3_d_abast.py` (scratchpad) que recorre els `import`/`export … from` estàtics (sense `import()` ni `lazyRoute`): des de `MurSection.jsx` 235 mòduls i cap és `transformadorEditorialWpBlogger.js` ni `tesaurusDoctoralSocDePoble.js`; des de `MapaFotografic.jsx` 167 mòduls, tampoc. Sobre la còpia d'abans, el mateix script trobava `tesaurusDoctoralSocDePoble.js <- transformadorEditorialWpBlogger.js <- MurSection.jsx`.
- **Veredicte.** B3-4 i B3-5 fets, sense commit. `MapaFotografic.jsx` i `articlesImportatsMandros.js` no s'han tocat (no calia). Següent: el fil principal confirma amb el build a l'scratch que el chunk del Mur ja no demana `tesaurusDoctoralSocDePoble-*.js`, i el Mestre ho valida a `http://localhost:3340/mur?revisio=wordpress` (primer «Carregant contingut...», després el panell).

- **20:46** · **Àrbitre · inici.** Revisats els diffs de `MurSection.jsx`, `revisioEditorialWp.js` i `transformadorEditorialWpBlogger.js`. Constants mogudes i reexportades (únic altre consumidor: `BancImportacioEditorial.jsx`, via reexport). `revisioEditorialWp.js` no té cap `import`; el Mur ja no importa el transformador; `useSuperadminEstable()` torna `{ esSuperadmin, rolPendent }`. Efecte amb cancel·lació i estats de càrrega/error amb claus existents.

- **20:46** · **Àrbitre · proves.** `npx vitest run` de `MurSection.revisioWp`, `.carregaMes`, `.error`, `articlesImportatsMandros` i `transformadorEditorialWpBlogger`: 5 fitxers, 30/30 en verd. `npx eslint` dels 6 fitxers tocats: 0 errors i 0 avisos. Al `MurSection.jsx` no hi ha cap `style={{}}` ni cap `<h1>`.
- **Àrbitre · observació menor (sense correcció).** Si `carregaArticlesImportats()` falla, l'`Alerta` no porta botó per a tornar-ho a provar. Per a tornar a carregar cal eixir del mode i tornar-hi a entrar, perquè l'efecte depén de `modeRevisioWp`. És un comportament acceptable per a un panell només de superadmin.
- **Àrbitre · veredicte.** Acceptat. B3-4: el Mur no té cap import estàtic del transformador ni del tesaurus. Queda pendent que el fil principal ho confirme amb el build a l'scratch i que passe `run-portes --nomes-portes`. B3-5: el Mur fa servir `useSuperadminEstable`, i els convidats i els no superadmins es queden sense barra. No s'ha fet commit.

<!-- R6B3:S4:FI -->

### B3-6 · Verificació, portes i build

- **20:41** · A les 20:41 he llançat el workflow `wf_2a44dd9f-0d8` amb els carrils B3-A a B3-D i un àrbitre-corrector per a cada un. **D-R6-3** queda acceptada tal com la decidix MarIA: el `supabase/seed.sql` és la eixida exacta del generador del Bloc 2 i no es torna a sembrar el tenant remot ni PROD. La verificació B3-6 (vitest dirigit, ESLint, `run-portes --nomes-portes` i build a l'scratch) la faré jo quan acaben.

- **20:50** · **B3-6 · Verificació (Claude, fil principal).** Han acabat els 8 agents i cap no ha fallat. Els 4 àrbitres han acceptat sense correccions.
  - **Canvis del Bloc 3:** 28 fitxers de `src/` respecte de `r6b3_abans`, més l'entrada **P1-75** (`seed_revisions` amb RLS) del Llibre Mestre.
  - **Dos toquis fora de carril, mínims i documentats:** `UniversalToolbar.jsx`, perquè és el registre de les ranures de la barra, i `ordresIBarra.test.js:103`, perquè la llista visible guanya `enllacImatge`.
  - **ESLint:** net als 23 fitxers JS i JSX tocats.
  - **Vitest dirigit:** 90 fitxers. Primer han passat 1.369 de 1.370.
    - L'única prova roja era `assetResolver.test.js`, la de l'Aplec. **Una altra mà l'havia tornat a posar darrere dels `vi.resetModules`** (probablement el CAS de r58, fet sobre una còpia anterior), i s'havia perdut la correcció del Bloc 1.
    - L'he tornada a moure davant, amb una nota que diu que no es moga, i ara dona 29/29.
  - **Build a l'scratch (`r6b3_build`):** ix amb 1, que és el cas conegut de `public-net.mjs:75`.
    - `MurSection-*.js` (13.717 B) i `MapaFotografic-*.js` (52.918 B) ja no fan cap referència al transformador ni al tesaurus.
    - El tesaurus (395.423 B) només l'importen de manera estàtica `LaboratoriTaxonomiaDoctoral-*.js` i el transformador.
    - El transformador només l'importa de manera estàtica `BancImportacioEditorial-*.js`; `PerfilShell` i `articlesImportatsMandros` el carreguen de manera dinàmica.
  - **`run-portes --nomes-portes`:**
    - Passen 5 portes: Plantilles, Autoritat, Segell de skills, Fronteres de skills i LEDGER.
    - **Atura a la porta Contracte documental:** `261104_1636_auditoria_claude.md` i `261104_1636_auditoria_gemini.md` tenen el «Torn caducat» (el reflex d'este informe és `torn_5a5c62d4`).
    - El rebut fresc `torn_c8cd2144` és de l'actor `maria`, i no he religat l'informe a un torn d'una altra IA. **Les portes posteriors no s'han executat.**
    - Per desbloquejar-ho, MarIA o el Mestre han d'obrir un torn de Claude (o fer-ne l'`own` amb el seu) per als dos informes, i tornar a passar `node tooling/gates/run-portes.mjs --nomes-portes`.
- **Pendent i decisions.**
  - **(1)** La guarda de signatura del Mur (`NotesContext.jsx:293-302`, `rebuigDePublicacio`) no deixa passar el superadmin, i la nova dels esdeveniments sí. Cal decidir si s'alineen.
  - **(2)** El botó «Enllaç de la imatge» demana l'adreça amb `window.prompt`, sense omplir l'actual. Falta un diàleg accessible de la casa.
  - **(3)** El text `.sdp-sr-only` queda ocult també dins de l'editor (`.ProseMirror`). El Mestre decidix si l'autor l'ha de veure.
  - **(4)** El panell de Revisió WP no té botó de reintentar si falla la càrrega del transformador.
  - **(5)** Els textos del panell de revisió continuen en català sense i18n, tal com eren abans.
  - **(6)** Validació del Mestre a `http://localhost:3340`: `/notes`, desar el Manifest i l'Aplec, enllaçar una imatge, i `/mur?revisio=wordpress`.
  - Res commitejat ni desplegat. No s'ha tornat a sembrar res (D-R6-3).

<!-- R6B3:S5:FI -->

## Onada R6 · Bloc 4 (Ultracode)

Mateix compte de Claude Opus 5.5. MarIA ja ha renovat el rebut d'este informe sota el torn viu `torn_c8cd2144` i ha llevat la cadena prohibida pel Tractor Psicopatia dels comentaris del Bloc 3. **Carrils:** B4-S1 (backend R12 de Codex), B4-S2 (les 4 decisions del Bloc 3 i les troballes del Node 0), B4-S3 (peces exclusives de R12), cadascun amb el seu àrbitre-corrector, i B4-S4 (verificació, al fil principal). **Mètode R12:** el kit es va tallar a les 19:06 UTC i el viu ha canviat després; per això no es fa `apply` del CAS. Es fa una reconciliació semàntica fitxer a fitxer (preimatge del kit com a base, viu, payload), sense perdre res dels Blocs 1–3 ni de `r58`. Instantània nova de `src/` i `tests/` (`r6b4_abans`). Res commitejat, ni desplegat, ni cap migració aplicada.

### B4-S1 · Backend i port de R12 (migració 76, `edicioEditorial`, `note_folders`)

- **21:29** · **Inici.** Carril B4-S1 (backend i port de R12): migració 76 `2611051930_edicio_publicacions_editorials.sql`, `contracte.js`, `backendPort.js`, `supabase/editorialPublicada.js`, `editorialPublicada.js`, `carpetesNotes.js`, `conformitat/kit.js` i connexió a `revisionsEditorials.js` + `carpetesCreades.js`. Reconciliació semàntica amb `git merge-file` contra preimatges; cap `apply` del kit, cap migració aplicada.

- **21:37** · **Diagnosi.** Els 15 fitxers viu del carril eren idèntics a les preimatges (abans = viu): `git merge-file` sense cap conflicte, resultat = payload. `revisionsEditorials.js` és «viu_nomes» al kit (Codex no el toca: el seu editor és `EditorDePublicacio.jsx`, fora del carril). Les crides de carpetes (`NotesEditor.jsx:400`, `BotoneraClassificacio.jsx:166`) són síncrones i assignen l'slug abans de cap persistència; el servidor dona `f-<uuid>`.
- **Acoblament trobat.** `pageContent.fediversity.test.js:665-694` exigix que el recompte de `CAPACITATS` (41→43) aparega a `pageContent.js`, al document `api_port_neutral_i_allotjament_model_b.md` i a `wikiManifest.js`, i el text de la pàgina `fediversity` està segellat a `.agents/contingut_estructural.json` (porta `frontissa-contingut`). El payload porta el resegellat; jo no toque `.agents/`.
- **Pegat 1 (fusió neta).** Escrits: `contracte.js`, `backendPort.js`, `conformitat/kit.js` + `kit.test.js`, `supabase/index.js`, `supabase/notes.js` (`creaCarpetaNotes` + lectura paginada de `note_folders`), `supabase/conformitat.test.js`, `local/notesLocal.js`, `local/contingutLocal.js`, `localNotes.js` + test, `local/adaptadorLocal*.test.js`. Nous: `carpetesNotes.js`, `editorialPublicada.js`, `supabase/editorialPublicada.js`, els dos `.r6.test.js` i la migració 76 (cap altra migració amb `2611051930`; 75 vives). Zero «local-first».
- **Pegat 2 (mínim).** `supabase/content.js`: només el marcatge `_editorialVersio` de les llistes de secció (cal per a la RPC amb CAS). **Omés:** la fusió de pàgines de `loadCoreContent` (`'pages'` a `CLAUS_CORE` + `fusionaPaginesEditorials`), que només servix a l'editor de pàgines de Codex, no integrat.

- **21:44** · **Regressions de Codex trobades i corregides.** El kit només va passar 145 suites; sobre el viu ixen 13 roigs: (a) `loadNotes` ara també demana `/rest/v1/note_folders` i consumia les respostes encadenades de `notes.test.js`, `notes.icon/logoDark/publishDate.test.js` → el mock de `runtime.js` encamina `note_folders` a `[]` (els recomptes de crides no canvien); (b) `notes.paginacioLocal.test.js:66` lectures ≤2 → ≤3 (la de carpetes, compartida igual); (c) `conformitat.equivalencia.test.js` (Supabase seed ≠ local) → `contingutLocal.js` només marca `_editorialVersio` amb política `administracioLocal` injectada (`versioVisible`); (d) `adaptadorLocal.multipoble.test.js` fusionat (43 capacitats, 184 casos). També: `supabase/notes.js` ja no carrega dues voltes el magatzem local en el detall.
- **Migració 76 i catàleg.** `supabase/README.md`: bullet i fila `| 76 | 2611051930 |`, «NO aplicada: l'aplica el Mestre». Cap migració aplicada enlloc.
- **Node 0 (servidor, B4-S3 me'l deixa).** La migració 76 mou les guardes `schema_migrations<>75` de `tooling/node0`: fusió neta (viu = preimatge) de `backend-node0.mjs` (acció `adminActualitzaPublicacioEditorial`, només amb `editorialReady`), `servidor-node0-soberania.mjs` (`SDP_NODE0_EDITORIAL=1` + RPC present), `hidrata`, `privacitat…sql`, `descriu-esquema`, `verifica-restauracio`, `posse-ledger.sql`, `instal-la-posse`, `restaura-node0-bundle` + manifest, i 6 `tests/node0-*.test.mjs` (75→76). `tests/administracio-multipoble-postgres.test.mjs:193-195` 75→76 (només viu).
- **Recomptes de text.** `pageContent.js`, `api_port_neutral_i_allotjament_model_b.md` i `wikiManifest.js` (1 línia) amb 43 capacitats / 132 mètodes / 184 casos, fusió neta. **Petició a S4/MarIA/Mestre:** la porta `frontissa-contingut` ix roja per «fediversity»; el resegellat ja és al payload de Codex (`.agents/contingut_estructural.json`, sha `5fe43947…`, 52.989, idèntic al que calcule ara). `.agents/` no és meu.
- **Proves.** `npx vitest run src/data/supabase/` → 106 fitxers, 2.240/2.240. `src/data/local/ + conformitat + editorialPublicada.r6 + localNotes + contracte + pageContent.fediversity/versions` → 125 fitxers, 3.251 (l'únic roig era el catàleg, ja verd). `node --test tests/migracio-verificador.test.mjs` 27/27. PGlite 0.3.16 (`SDP_PGLITE_MODULE=~/.npm/_npx/7750544ccf494d8b/…/pglite/dist/index.js`): `carpetes-notes-r12` 5/5; `node0-r12-editorial` 7/8.
- **P1 per al Mestre (no l'arregle).** El roig de `node0-r12-editorial` és real: el backfill de la migració 76 escriu l'HTML de l'Aplec (i del Manifest) de l'Editorial de Codex (amb `data-sdp-youtube`), i el viu `aplec2023Content.js` en té un altre (no hi ha `aplec2023Editorial.js` al viu). Si s'aplica la 76 abans d'integrar eixe mòdul, el servidor guardarà un Aplec `html-r6` que preval sobre la llavor viva. He canviat només l'import de la prova a `aplec2023Content.js` perquè ho detecte en lloc de petar en carregar.

- **21:48** · **P0 de Codex corregit.** `supabase/notes.js · carpetesPrivades` només tolerava la taula absent per `error.code` (`42P01`/`PGRST205`), però `ErrorSupabase` no porta `code` (`runtime.js:12-16`): sense la migració 76, **cada `loadNotes` remot petaria i el Bloc de Notes no carregaria**. Ara accepta també `status 404` i el codi dins del missatge; la lectura porta `signal`. `supabase/editorialPublicada.js`: el 404 de `rpc()` (esquema absent) ara és `no-disponible`, no `editorial-error`.
- **Pegat 3 · `revisionsEditorials.js`.** `desaRevisioEditorial` (síncron) no canvia. Nou `desaRevisioEditorialAmbServidor(seccio, element, camps, { esSuperadmin, config, signal })`: desa SEMPRE primer al navegador; després, només amb `config.dataMode` remot, `teCapacitat('edicioEditorial')`, superadmin i `element._editorialVersio`, crida `adminActualitzaPublicacioEditorial` (import dinàmic del port) amb la revisió sencera en camps blancs (`lead→entradilla`, `heroImage→image_url`…), una escriptura en vol per element i la versió confirmada per a la següent. Amb èxit, l'entrada guarda `servidor:{versio}` i `revisaElement` deixa manar la fila quan el lector porta eixa versió. Tot rebuig = `desti:'navegador'` + `motiu`; `rebutjadaPelServidor()` per a la UI.
- **Proves.** Nou `src/data/revisionsEditorials.servidor.r6.test.js` (8: sense RPC → navegador; seed/local; sense superadmin/versió/fila; RPC → port amb payload i versió exactes; versió confirmada; rebuigs; resposta invàlida) i `src/data/supabase/notes.carpetes.r6.test.js` (5: llista, 404 sense migració, 500 no dissimulat, RPC `crea_carpeta_notes`, nom invàlid). `npx vitest run` dels dos + `revisionsEditorials.test.js` + `supabase/editorialPublicada.r6.test.js`: 24/24.

- **21:55** · **Pegat 4 · `carpetesCreades.js`.** Nou `creaCarpetaCreada(ambit, nom, { existents, config })`: el mateix nom reutilitza la carpeta (cap xarxa); en remot amb `teCapacitat('carpetesNotes')` crea pel port (`creaCarpetaNotes` → `note_folders`), pren l'id `f-<uuid>` del servidor i el guarda també al magatzem per àmbit (es veu de seguida i a les altres pestanyes per `storage`); sense la capacitat, en seed/local o amb 404 (sense migració 76), el camí de sempre (slug + navegador); un altre error es propaga sense carpeta a mitges. `desaCarpetaCreada` síncron no canvia.
- **Pegat 5 · connexió a la UI (fitxer compartit, 3 hunks Edit).** `PublicacioEditable.jsx`: la revisió passa per `desaRevisioEditorialAmbServidor(seccio, publicacio, camps, { esSuperadmin, config: base?.config })`; l'avís diu on ha quedat (`avisDeLaRevisioEditorial`). Claus noves als 5 diccionaris: `section.notes.publicacio.revisioDesadaServidor` i `…revisioNomesNavegador`; sense servidor es manté l'avís de sempre («desada en este navegador»).
- **Proves.** `carpetesCreades.servidor.r6.test.js` (5) + `carpetesCreades.test.jsx` + `Classificacio.test.jsx`: 38/38. `PublicacioEditable.test.jsx`, `MurContext.revisions`, `elementDeSeccio.revisioImportat`, revisions i 25 suites de Notes: 30 fitxers, 407/407. Regressió ampla (`contracteAmfitrio.paritat`, `App.appsLocals/ordreProveidors`, `host.xifratApagat`, `iaiaLocal`, `backendPort*`, `src/sections/{notes,text,mur,detail}/`, `classificacio/`): 228 fitxers, 2.882/2.883. L'únic roig, `ItemDetailSection.pobleIncomplet` («fetch» cridat), no és d'este carril: amb `revisionsEditorials.js` de abans també falla (bisecat); l'informe ja el dona per inestable (línia 1747). PGlite, 21 proves `node --test` de Node 0: 327/331; els 4 roigs no són de la 76 (`node0-auth-proof`: esbuild no resol `ProvaCorreuAmbContrasenya.jsx` amb `%20`; `node0-r5-publicacions:46`: autor `Veí/na`). `npx eslint` dels 52 fitxers tocats: 0 problemes. `grep "local-first"`: buit.

- **21:55** · **Veredicte: FET (amb peticions).** Port i servidor de R12 integrats sense `apply` ni còpia crua: migració 76 afegida (no aplicada), contracte 43/132/184, Supabase + local + Node 0, revisions i carpetes connectades al port amb el navegador com a reserva (ordre del Mestre).
- **Peticions.** (1) Carril de Notes/Classificació: `NotesEditor.jsx:400` (`desaCarpeta`) i `BotoneraClassificacio.jsx:166` (`afigCarpeta`) han de cridar `await creaCarpetaCreada(scopeKey, nom, { existents: carpetes, config })` i assignar `folderId` només amb el resultat (avís si rebutja); fins llavors la creació en línia continua al navegador. `AVIS_CARPETES` (`NotesEditor.jsx:79`) diu que no hi ha contracte: ja n'hi ha. (2) S4/MarIA/Mestre: resegellar «fediversity» a `.agents/contingut_estructural.json` amb l'entrada del payload (sha `5fe43947…`). (3) Mestre: decidir l'HTML del backfill de la 76 (Aplec/Manifest de Codex ≠ llavor viva) abans d'aplicar-la. (4) Ordre de desplegament: el client tolera la 76 absent (carpetes de sèrie + navegador; revisió al navegador amb `no-disponible`), però cada `loadNotes` remot farà un 404 a `note_folders` fins que s'aplique.
- **Omés.** `loadCoreContent` + fusió de pàgines (`content.js`); UI de Codex (`EditorDePublicacio`, `NotesContext.creaCarpeta`, `onCreaCarpeta`); prova de UI del camí servidor a `PublicacioEditable.test.jsx` (fitxer del carril 2). `tests/node0-r12-editorial.test.mjs` integrat amb l'import canviat a `aplec2023Content.js` (7/8, el roig és el P1).

- **21:56** · **Àrbitre · inici.** Revise els diffs del Bloc 4 contra `r6b4_abans`, la migració 76, el cablatge de `revisionsEditorials.js` i `carpetesCreades.js`, i torne a executar els tests.

- **21:58** · **Àrbitre · defecte 1 (P1, corregit).** `src/data/revisionsEditorials.js` (~291): en acabar una escriptura amb èxit es marcava `servidor: { versio }` sobre l'entrada ACTUAL, encara que una desada posterior (en cua o d'una altra pestanya) l'haguera substituïda. Si eixa segona la rebutjava el servidor (`conflicte-versio`), el lector amb `_editorialVersio` ≥ versió marcada amagava la revisió que només era al navegador, malgrat l'avís «queda desada només en este navegador».
- **Àrbitre · defecte 2 (P2, corregit).** La RPC no sap esborrar: `publishDate: null` es descartava i, amb èxit, la marca de servidor feia desaparéixer l'esborrat. Ara només es marca si `actual.camps === enviada` i cap camp enviat és `null`; si no, la còpia del navegador continua manant.
- **Àrbitre · proves.** Dos casos nous a `revisionsEditorials.servidor.r6.test.js` (desada en cua rebutjada, data esborrada). `npx vitest run` revisions + `classificacio/` + editorialPublicada r6 ×2 + `notes.carpetes.r6` + `contracte.test` + `conformitat/` + `PublicacioEditable.test.jsx` → 16 fitxers, 336/336.

- **22:00** · **Àrbitre · comprovacions.** Migració 76: timestamp únic; RPC `security definer`, `search_path=''`, `private.es_superadmin()` exigix aal2, `revoke` a `public,anon`; `note_folders` amb RLS només de lectura del propietari membre i escriptura sols per `crea_carpeta_notes`. Client: només superadmin estable crida la RPC; sense capacitat/seed/local queda al navegador. `revisaElement`, D-R6-1/D-R6-2 i el `storage` de carpetes conservats respecte de `r6b4_abans`. Cap `local-first` (també als fitxers nous); `npx eslint` dels 16 fitxers del carril → 0 problemes.
- **Àrbitre · proves 2.** backendPort ×3 + contracte ×3 + `src/data/local/` + `supabase/notes*` + `supabase/content*` + `conformitat.test` + `localNotes.test` + `MurContext.revisions` + `NotesEditor*` + `pageContent*` → 48 fitxers, 1507/1507. `SDP_PGLITE_MODULE=<pglite 0.3.16> node --test tests/carpetes-notes-r12.test.mjs tests/node0-r12-editorial.test.mjs tests/migracio-verificador.test.mjs` → 39/41; les 2 són el mateix cas (backfill de l'Aplec ≠ `aplec2023Content.js` viu), el P1 ja declarat.
- **Àrbitre · veredicte.** acceptat amb correccions — 2 defectes corregits a `revisionsEditorials.js` (+2 proves). Queden: P1 backfill Aplec de la migració 76 (no aplicar-la fins reconciliar l'HTML amb el viu); `creaCarpetaCreada` encara no la crida cap UI (carril Notes/Classificació: `NotesEditor.jsx` `desaCarpeta`, `BotoneraClassificacio.jsx` `afigCarpeta`); resegellat `fediversity` per al Mestre; un error no-404 de `note_folders` fa fallar `loadNotes` remot (fail-closed volgut, a vigilar).

<!-- R6B4:S1:FI -->

### B4-S2 · Decisions del Bloc 3 i troballes del Node 0

- **21:29** · **Inici.** Carril B4-S2 (Claude, constructor). Faig les 4 decisions de MarIA sobre el Bloc 3: (1) una sola guarda pura de signatura aliena per al Mur i l'Agenda, amb el superadmin estable que pot revisar; (2) un diàleg accessible per a «Enllaç de la imatge» en lloc de `window.prompt`/`window.alert`; (3) `.ProseMirror .sdp-sr-only` visible per a l'autor i «Reintentar» a la Revisió WP del Mur; (4) enduriment de `cosPerAPintar` i d'`articlesImportatsMandros.js`. Per als fitxers del carril que són al kit R12 faig una reconciliació semàntica amb `git merge-file` (preimatge, viu, payload). No faig cap `apply` ni cap còpia en cru. Res commitejat.

- **21:36** · **Pegat D-B4-1 · guarda única de signatura aliena.** Nou `src/sections/notes/signaturaDAltri.js`, amb la funció pura `motiuSignaturaDAltri(publicacio, { actor, config, esSuperadmin, t })`. Fa servir `autorDe`, `pertanyALActor`, `aliesDeLActor` amb el mode resolt, i el nom de qui signa ix de `author_name`, `seller` o `organizer`, sempre que siga text. Així queda resolta la petició (2) de l'àrbitre del Bloc 3. Els llocs que la criden són tres. `NotesContext.jsx:291-310`: `rebuigDePublicacio` admet ara `esSuperadmin` i es lleven 4 imports que no feien res. `publicacioEditable.js:123-133`: `motiuActeDAltri` passa a `motiuPublicacioDAltri`, que val per al Mur i per a l'agenda. `PublicacioEditable.jsx:79-93`: el camí de revisió passa `esSuperadmin` a les dues guardes.
- **Decisió de seguretat (cal que la mire MarIA).** El superadmin pot fer una REVISIÓ editorial d'una peça d'altri, perquè la revisió només desa els camps canviats i conserva l'autoria. Una fila UUID va per `publishNote`, i eixe upsert signa amb l'actor actiu (`NotesContext.jsx:336-341`). Per això `publishNote` no passa mai `esSuperadmin`: si el passara, el superadmin re-signaria la peça d'altri. Si el superadmin ha de revisar files UUID d'altri, cal un camí de servidor que conserve l'autoria. La RPC `edicioEditorial` de R12 només cobrix `app_content`.
- **Proves.** `PublicacioEditable.test.jsx`: una prova pura que combina Mur i agenda amb superadmin i ordinari, i comprova també `organizer`, valors que no són text i un `esSuperadmin` que no és booleà. Dues proves d'integració: el Manifest signat pel Rentonar, que l'ordinari no pot desar i el superadmin sí, i una fila UUID d'altri, que ni el superadmin pot adoptar. `NotesContext.test.jsx`: la revisió del superadmin passa per `rebuigDePublicacio`, però `publishNote` la rebutja igualment. `npx vitest run` sobre `PublicacioEditable`, `NotesContext`, `NotesContext.ambit` i `NotesContext.llavor`: 4 fitxers, **64/64**. ESLint dels 6 fitxers: net.

- **21:42** · **Pegat D-B4-2 · diàleg «Enllaç de la imatge».** Nou `src/components/universal/DialegEnllacImatge.jsx`, fet amb el `Dialeg` de Pedra Seca (`<dialog>` natiu) i `Camp`/`CampText`. Té nom accessible, el focus queda tancat dins amb `showModal`, Escape (`cancel`) el tanca i el focus torna al botó. El camp arriba ple amb l'`href` actual. L'adreça es valida en línia amb `hrefDeImatge`, la mateixa guarda que usa `enllacaImatge`, i l'error es mostra dins del diàleg (`aria-invalid`). Si es buida el camp, l'enllaç es lleva.
- `tiptapToolbarAdapter.js`: la fila `enllacImatge` té ara `llig`, i `executa(editor, id, { llig })` torna `{ href, target }` sense cap ordre, focus ni transacció. Així la barra pot continuar muda i no necessita veure l'editor. `UniversalToolbar.jsx`: fora `window.prompt` i `window.alert`; queden `obreEnllacImatge`, `desaEnllacImatge` i `tancaEnllacImatge`, i el botó porta `aria-haspopup="dialog"`. El diàleg es torna a muntar a cada obertura (amb `key`) i es queda muntat quan es tanca, perquè el focus puga tornar. Claus noves als 5 diccionaris: `enllacImatgeCamp`, `enllacImatgeAjuda`, `enllacImatgeNoAplicat` i `enllacImatgeDesa`. També `section.mur.revisioWp.reintenta`, per a D-B4-3. Es lleva `enllacImatgeDemana`, que ja no s'usa.
- **Proves.** He reescrit `tiptapToolbarAdapter.enllacImatge.test.jsx` amb un TipTap de veres i testing-library. Comprova: `{ llig }` sense transacció; obrir el diàleg sense cap `prompt` ni `alert`; el camp ple; desar, que tanca i torna el focus; buidar, que lleva l'enllaç; 3 adreces insegures, que es rebutgen dins del diàleg obert; i Escape, que tanca, i en tornar a obrir el camp torna a estar ple. `npx vitest run src/components/universal/UniversalToolbar src/components/universal/richText/ DocumentEditor.edicioAvancada Dialeg.test`: 28 fitxers, **346/346**. ESLint dels 4 fitxers: net. Límit: jsdom no té `showModal`, i per això el tancament del focus dins del diàleg no queda provat ací; és el del `<dialog>` natiu.

- **21:48** · **Pegat D-B4-3 · CSS de l'editor i «Reintentar».** `src/css/modules.css`: nova regla `.ProseMirror .sdp-sr-only` dins de l'`@layer components` del bloc de la Subtargeta (≈:11203). Porta `position: static`, `width/height: auto`, `clip: auto`, `clip-path: none`, `white-space: normal`, cursiva i un subratllat de punts amb el color del text, i cap color ni mida de lletra nous. La regla pública (`base.css:310`, capa `legacy`) no canvia, i la capa `components` hi guanya només dins de l'editor (`index.css:45`). `src/sections/mur/MurSection.jsx`: nou `intentRevisioWp` a les dependències de l'efecte de càrrega, i l'`Alerta` d'error porta ara a `accions` un `Boto` «Reintentar» amb la clau `section.mur.revisioWp.reintenta`, que és als 5 diccionaris.
- **Pegat D-B4-4 · Gauntlet del Node 0.** `cosCanonic.js`: `cosPerAPintar` passa per `textDelCos` abans de cap `replace`. Una cadena entra tal qual i un número finit es passa a xifres. Qualsevol altre valor dona `''`, i això inclou `null`, `undefined`, `NaN`, objectes, llistes, funcions, `Symbol` i `BigInt`. Abans un objecte eixia com a `[object Object]`.
- `articlesImportatsMandros.js`: cada intent porta un número (`intents`), i només l'últim escriu l'estat. Un reintent que arriba després d'una fallada torna a `'carregant'` i avisa. Un `import()` que peta de manera síncrona es converteix en una promesa rebutjada. Nou `_reiniciaArticlesImportatsPerAProves(importador)`, amb el mateix patró que `_reiniciaRevisionsEditorialsPerAProves`. `useEstatArticleImportat` demana la càrrega per CLAU normalitzada (`[clau]`) i no per estat. Així, si es passa de A a B ràpidament, no es fa cap import doble ni es perd la subscripció. Si la clau és la mateixa i està en error, no torna a provar sola; amb una clau nova, ho prova una volta.
- **Proves.** Noves: `articlesImportatsMandros.reintent.test.js` (7), `cosCanonic.test.js` (5) i `src/css/editorSrOnly.capes.test.js` (3). A `MurSection.revisioWp.test.jsx` n'he afegit 2: la càrrega falla, «Reintentar» fa el segon `import()` de veres i arriba el panell amb 425 articles; i la clau i18n. Totes passen: `npx vitest run` sobre els 5 fitxers del carregador i de `cosCanonic` (també `cosCanonic.editor` i `elementDeSeccio.revisioImportat`) dona **30/30**; `MurSection.revisioWp`, `.error` i `.publicacio` donen **21/21**; `src/config/i18n.{claus,idiomes,usades,traduides,comu}.test.js` donen **302/302**. ESLint dels 12 fitxers: net.
- **Límit.** Hi ha navegadors que guarden en el mapa de mòduls un `import()` fallit de la mateixa URL. En eixe cas, el reintent pot tornar a fallar sense tornar a baixar el fitxer. No ho he pogut provar ací: jsdom no té mapa de mòduls. Per a un fragment de Vite amb hash, un paràmetre per a trencar la memòria cau trencaria la divisió del paquet, i per això no l'he posat.

- **21:49** · **Kit R12 · reconciliació dels fitxers del carril.** He fet una prova de `git merge-file -p` amb tres entrades: el viu, la preimatge i el payload. Les eixides són a `scratchpad/r6b4_merge/s2/`. No he escrit res al viu, per estes raons. (a) `NotesContext.jsx`: la fusió ix neta i afig `creaCarpeta`, però l'única que la crida és la `NotesEditor.jsx` de Codex, que és fora del carril. Ara seria codi mort. El port `creaCarpetaNotes` ja hi és (B4-S1). (b) `publicacioEditable.js`, `PublicacioEditable.jsx` i la seua prova: la preimatge és la del Bloc 1. Codex reemplaça tot el disseny dels Blocs 2–3 (`revisionsEditorials` i la guarda) per una reexportació de `notesSeed.js`, `EditorDePublicacio`, esborranys en IndexedDB i la RPC `edicioEditorial`. El conflicte és d'arquitectura, no de text, i no es pot fusionar sense perdre els Blocs 2–3.
- (c) `MurSection.jsx` i la seua prova: hi ha 2 conflictes amb B3-4 i B3-5. Codex fa que el Mode Revisió siga només per a superadmin, també amb `?revisio=wordpress`. El meu carril aquí només cobrix el reintent, i la prova viva AH-28 espera el panell per a un convidat. (d) Diccionaris: Codex esborra `noActualitzableActe/Llavor`, que el viu encara usa (`motiuNoActualitzable`). He conservat el viu. Les claus `r6.editorial.*` i `errorCrearCarpeta` van amb `EditorDePublicacio` i `BotoneraClassificacio`, que no s'han integrat, i per això no les he afegides. (e) `modules.css` de Codex (592 línies): fora del carril. Només hi ha la meua regla.
- **Peticions.** A MarIA o al Mestre: triar entre la revisió editorial dels Blocs 2–3 i l'«Edició avançada» de R12, i decidir si el Mode Revisió WP queda només per a superadmin. A qui integre `NotesEditor.jsx` de R12: `creaCarpeta` (eixida neta a `r6b4_merge/s2/sections_notes_NotesContext.jsx`) i la clau `errorCrearCarpeta`.

- **21:51** · **Verificació final.** `npx vitest run` sobre `PublicacioEditable`, `NotesContext*`, `PublicacioDetall*`, `revisionsEditorials`, `UniversalToolbar*`, `richText/` (inclou `ordresIBarra`), `Dialeg`, `editorSrOnly.capes`, `MurSection*`, `mur/articles/`, `articlesImportatsMandros*`, `elementDeSeccio*`, `i18n.claus`, `i18n.idiomes` i `i18n.usades`: **74 fitxers, 993/993** en verd. Ja hi entren els canvis concurrents de B4-S1 a `revisionsEditorials.js` i a les claus `revisioDesadaServidor` i `revisioNomesNavegador`, i el de B4-S3 a `editor.video.titolPerDefecte` (són a `eu.js` i no els he tocat). `npx eslint` dels 22 fitxers: codi 0. `grep "local-first"`: 0 aparicions. Tampoc hi ha cap `style={{}}`, `<h1>` ni `innerHTML =` nous.
- **Veredicte: FET** (D-B4-1 a D-B4-4). Fitxers nous: `src/sections/notes/signaturaDAltri.js`, `src/components/universal/DialegEnllacImatge.jsx` i 3 proves. No he aplicat res del kit R12 en este carril (vegeu la reconciliació). Res commitejat ni desplegat, i cap migració. **Per al següent:** MarIA ha de decidir (1) la revisió del superadmin sobre files UUID d'altri, que necessita un camí de servidor que conserve l'autoria; (2) entre els Blocs 2–3 i l'«Edició avançada» de R12; (3) si la Revisió WP queda només per a superadmin. A més, cal provar en un navegador real el diàleg (focus atrapat amb `showModal`) i el reintent d'un `import()` fallit.

- **21:51** · **Àrbitre · inici.** Revise els diffs del constructor contra `r6b4_abans` (guarda de signatura, `DialegEnllacImatge`, `.ProseMirror .sdp-sr-only`, «Reintentar», `cosPerAPintar`, `articlesImportatsMandros`), seguretat i portes de la casa.

- **21:53** · **Àrbitre · revisió.** Diffs contra `r6b4_abans`: cap comportament dels Blocs 1–3 perdut. `signaturaDAltri.js` és pura, `esSuperadmin === true` estricte; l'única crida de `publishNote` (`NotesContext.jsx:366`) no el passa, i la revisió (`PublicacioEditable.jsx`) sí, amb `useSuperadminEstable`. `motiuActeDAltri` ja no té cap crida viva. Els canvis de `desaRevisioEditorialAmbServidor` són de B4-S1 i es conserven.
- **Àrbitre · diàleg i CSS.** `DialegEnllacImatge` fa servir el `Dialeg` de Pedra Seca (portal, `showModal`, `cancel`, el focus torna al botó), arriba ple per `{ llig }` (a `executa` no corre cap ordre ni cap transacció), i la guarda és `hrefDeImatge`, la mateixa de l'ordre (que torna a validar). `javascript:` i les credencials es refusen dins del diàleg. La regla `.ProseMirror .sdp-sr-only` és a `@layer components`, que guanya `legacy` (`base.css:310`), i el token `--sdp-focus-separacio` existix. Les claus noves, incloent `common.cancela`, són als 5 diccionaris, i `enllacImatgeDemana` ja no hi és.
- **Àrbitre · Mur i carregador.** «Reintentar»: `intentRevisioWp` torna a córrer l'efecte, que posa l'error a false. El carregador deixa la promesa fallida i marca els intents vells. `cosPerAPintar` no fa cap replace sobre un valor que no siga text. No he trobat cap defecte clar en el carril: no hi he fet cap correcció.
- **Àrbitre · proves.** `npx eslint` sobre els 22 fitxers: exit 0. Cap `local-first`, `style={{`, `<h1` ni `innerHTML =`. `npx vitest run` de PublicacioEditable, NotesContext(+ambit, llavor), enllacImatge, UniversalToolbar*, Dialeg, editorSrOnly.capes, articlesImportatsMandros*, mur/articles/, elementDeSeccio*, MurSection*, i18n.claus/usades/idiomes: 42 fitxers, 631/631 passen.
- **Àrbitre · veredicte.** acceptat — sense correccions. Queden obertes les decisions que ja va declarar el constructor: les files UUID d'altri, que el superadmin encara no pot revisar (cal un camí de servidor que conserve l'autoria); el kit R12, que no s'ha aplicat (és un conflicte d'arquitectura); i, sense provar en un navegador, el *focus trap* del `<dialog>` natiu i el reintent d'un `import()` fallit.

<!-- R6B4:S2:FI -->

### B4-S3 · Peces exclusives de R12 (VideoEditorial, sondaConnexions, Node 0)

- **21:29** · **Inici.** Carril B4-S3 (peces exclusives de R12: `VideoEditorial`, `sondaConnexions`, Node 0). Comprovació CAS fitxer a fitxer: `richText/extensions/index.js`, `Aplec2023Article.jsx`, `sondaConnexions.js/.test.js`, `node0/adaptadorNodeZeroHttp.js`, `node0Client.js/.test.js` i `utils/sanitize.js` vius són idèntics a la preimatge de Codex i a la còpia pre-Bloc-4 (cap altra mà els ha tocat després del tall de les 19:06). `VideoEditorial.jsx`, `VideoEditorialNodeView.jsx`, `node0Client.r6.test.js` i `richText/extensions/editorial.js` són nous (absents al viu). Pas següent: llegir el delta preimatge→payload de cada peça i les seues dependències fora del carril.

- **21:34** · **Diagnosi.** (1) **Vídeo.** El `index.js` del payload no és un afegit: lleva `enllacImatge.js` i `maquetacio.js` (P0-26 D1, viu) i els substituïx per `editorial.js`, que torna a definir figura, `details`, `section`, `div` i `time` per damunt de `maquetacio.js`. No el prenc. Del payload només entra el node `videoEditorial` (marcador inert `div[data-sdp-youtube]` amb un id d'11 caràcters, i un enllaç de reserva). `Aplec2023Article.jsx` del payload és una reescriptura que perd `videoDeLAplec`, `cosDeLArticle` i `cosPerAPintar` (Bloc 3) i depén de `htmlEditorial.jsx`/`aplec2023Editorial.js` (fora del carril). No la prenc: només canvie l'iframe en línia per `<VideoEditorial>`. El sanejador viu ja deixa passar `data-*` (DOMPurify `ALLOW_DATA_ATTR` per defecte) i prohibix `iframe`. No cal tocar-lo.
- (2) **Sonda.** `sondaConnexions.js:39-42` (viu) tracta qualsevol `status 404` i tres missatges com a «esquema absent», i ho recorda per a tot l'àmbit. La versió de Codex ho arregla: només `NO-DISPONIBLE`, `PGRST202` i `PGRST205`. També lleva `42883`/`42P01`, perquè són SQLSTATE del cos de l'RPC, i `normesExigides` reutilitza `42P01` com a error de negoci. `ConnexionsPubliques.degradacio.test.jsx:39-40` afirma l'antic comportament, i el payload el corregix.
- (3) **Node 0.** Payload `node0Client.js`: lectura per trossos amb `getReader()` tallant als 512 KB, Content-Type obligatori, contracte del mirall. No arregla `:66-68` (bucle `for…continue` que no fa res) ni l'esquema dels camps URL (`image_url`, `avatar_url`, `hero_url`, `url`, `source_url`, `canonicalUrl`, `uri`). Els faig jo. `adaptadorNodeZeroHttp.js` només afig camps primitius editorials a la projecció (`html`, `hero_image`, `_editorialVersio`…), igual que el que ja passa per Supabase.

- **21:35** · **Pegat 1 · sonda i Node 0 (merge de 3 vies).** `git merge-file` (viu, preimatge, payload) en 6 fitxers, amb 0 conflictes. El resultat és byte a byte el payload, perquè el viu era la preimatge. L'he escrit amb guarda (`cmp` viu = preimatge just abans de copiar): `sondaConnexions.js`, `sondaConnexions.test.js`, `node0/adaptadorNodeZeroHttp.js`, `node0Client.js`, `node0Client.test.js`, i també `profile/ConnexionsPubliques.degradacio.test.jsx`. Este últim és fora del carril, però està acoblat: les seues línies 39-40 afirmaven que un 404 nu és «esquema absent» i haurien quedat roges. Cap altra mà l'havia tocat (viu = abans = preimatge). Nou: `node0Client.r6.test.js` (payload).
- **Pegat 2 · `node0Client.js` (meu, damunt de Codex).** He llevat el bucle `for…continue` buit de `sanejaPublicacioNode0`. Nou `urlSegura` per als 7 camps d'URL: només http(s) absolut sense credencials, o un camí relatiu a l'arrel que no siga `//`. Rebutja la barra inversa i els caràcters de control. He afegit 3 proves a `node0Client.r6.test.js` (`javascript:` amb espai, tabulador o majúscules, `data:`, `//`, `/\`, `user:pass@`, `mailto:`, `ftp:`, relatiu nu).
- **Proves.** `npx vitest run src/data/node0Client.test.js src/data/node0Client.r6.test.js src/sections/connectar/sondaConnexions.test.js src/sections/profile/ConnexionsPubliques.degradacio.test.jsx`: **4 fitxers, 31/31 verdes**. `node --test tests/node0-client-publicacions.test.mjs tests/node0-client-core.test.mjs tests/node0-http-adapter.test.mjs`: **38/38**. `npx vitest run src/data/local/adaptadorNodeZeroHttp.host.test.js`: **1/1**.
- **Omés.** `tests/node0-r12-editorial.test.mjs` del payload: depén de `tooling/node0/backend-node0.mjs`, de la migració 76 i d'`aplec2023Editorial.js`, i cap no és d'este carril. Els camps editorials de la projecció de l'adaptador ja hi són, i el seu servidor és de B4-S1/tooling.

- **21:38** · **Pegat 3 · vídeo editorial (integració mínima i segura).** Nous: `components/universal/VideoEditorial.jsx` (l'únic iframe; id `^[A-Za-z0-9_-]{11}$`, origen fix `youtube-nocookie.com`, títol d'una línia retallat a 200, reserva per i18n `editor.video.titolPerDefecte`), `richText/extensions/VideoEditorialNodeView.jsx` (com el payload) i `richText/extensions/videoEditorial.js`. Este últim té només el node `videoEditorial` del `editorial.js` de Codex, amb `priority: 110`, l'id validat en llegir i en desar, i un enllaç de reserva sense iframe. `index.js`: 2 trossos (import i `VideoEditorialNode` a `extensionsRiques`, darrere de `extensionsDeMaquetacio()`), i es conserven `enllacImatge.js` i `maquetacio.js`. `Aplec2023Article.jsx`: l'iframe en línia passa a `<VideoEditorial id title>`; `videoDeLAplec`, `cosDeLArticle` i `cosPerAPintar` queden intactes. Claus noves als 5 diccionaris, darrere d'`editor.imatge.exif.titol`, per no xocar amb el carril 2, que afig claus al final.
- **Omés del payload (fora del carril o regressiu).** `editorial.js` sencer (duplicaria `maquetacio.js`), el `index.js` del payload (llevaria P0-26 D1), `Aplec2023Article.jsx`/`aplec2023Editorial.js`, `detail/htmlEditorial.jsx` i el seu ganxo a `detailRichText.jsx`, i l'ampliació de tags de `sanitize.js` (`figure`, `details`, `section`, `time`, `id`, `aria-*`). Conseqüència: en lectura, un marcador `data-sdp-youtube` dins d'un cos es veu com l'enllaç de reserva, no com un iframe. Si es vol l'iframe també en lectura, cal un carril que porte `htmlEditorial.jsx` i que passe per `sanitizeHtml` + `resolRecursosDeHtml`.

- **21:41** · **Proves del vídeo.** Nou `src/components/universal/VideoEditorial.test.jsx`, amb 10 proves: l'iframe només surt de `youtube-nocookie` amb un id vàlid; 9 ids hostils no pinten res; el títol ve del diccionari; la vista del node; el viatge editor → `sanitizeHtml` → editor és idèntic, sense iframe (el sanejador hi afig `nofollow`); un marcador hostil o un iframe enganxat cauen; un JSON amb un id dolent no desa cap marcador; i el vídeo es conserva dins d'`aplec-2023__complement`. `npx vitest run` sobre el carril sencer (`VideoEditorial.test.jsx`, `richText/extensions/`, `Aplec2023Article.test.jsx`, `cosCanonic.editor.test.js`, `tiptapToolbarAdapter.enllacImatge.test.jsx`, les proves de Node 0 i de la sonda, i `adaptadorNodeZeroHttp.host.test.js`): **23 fitxers, 291/292**. L'única roja és `tiptapToolbarAdapter.enllacImatge.test.jsx:97` (espera `window.prompt`). La causa és `tiptapToolbarAdapter.js`, modificat a les 21:39 per B4-S2 (decisió 2, el diàleg accessible): a les 21:39:02 passava, i no és d'este carril. `i18n.claus/idiomes/traduides/usades` i `DocumentEditor.{subtargeta,exif,targetes}`: **7 fitxers, 312/312**.
- **Portes.** `npx eslint` sobre els 18 fitxers tocats: net. `grep -n "local-first"` sobre els mateixos: buit. Cap `style={{}}`, `<h1>`, color cru ni `innerHTML =`.
- **Veredicte: FET**, amb dos límits declarats. (a) En lectura, el marcador de vídeo dins d'un cos es veu com un enllaç, perquè `htmlEditorial.jsx` i el seu ganxo a `detailRichText.jsx` no han entrat. L'Aplec continua pintant el seu iframe des de `video_youtube`, ara a través de `VideoEditorial`. (b) He tocat `profile/ConnexionsPubliques.degradacio.test.jsx` (és fora del carril, però està acoblat a la sonda). **Peticions:** a B4-S2, actualitzar `tiptapToolbarAdapter.enllacImatge.test.jsx` al diàleg nou; a B4-S4, repetir el lot de proves d'esta entrada amb l'arbre quiet.

- **21:41** · **Àrbitre · inici.** Revise diffs contra `r6b4_abans` dels fitxers del carril B4-S3 (VideoEditorial, sondaConnexions, Node 0), seguretat i portes de casa.

- **21:43** · **Àrbitre · revisió.** Vídeo: `VideoEditorial.jsx` valida l'id (`^[A-Za-z0-9_-]{11}$`) i fixa l'origen `youtube-nocookie`; `videoEditorial.js` desa un `div[data-sdp-youtube]` inert amb enllaç de reserva construït de l'id validat; `sanitize.js` continua prohibint `iframe` i deixa passar `data-*` (DOMPurify `ALLOW_DATA_ATTR`), el viatge d'anada i tornada el cobrix `VideoEditorial.test.jsx:79`. `Aplec2023Article.jsx` conserva `videoDeLAplec`, `cosDeLArticle` i `cosPerAPintar` de Bloc 3. Ací no he trobat cap defecte.
- **Àrbitre · revisió Node 0.** El bucle buit ja no hi és. El límit de 512 KB es compta per trossos del flux (`getReader`), sense `text()` abans. `urlSegura` cobrix els 7 camps d'URL de `CAMPS_TEXT_PUBLICACIO` (https/http sense credencials, o camí `/` sense `//` ni `\`). El nou camp `html` de l'adaptador acaba igualment al sanejador en pintar-se. Correcte.
- **Àrbitre · defecte (fora del carril).** `src/data/supabase/seguiments.js:236` (`errorConnexionsRpc`) encara convertix qualsevol `status === 404` nu en `NO-DISPONIBLE`. Per tant, al camí Supabase, un 404 d'una passarel·la continua desactivant la capacitat per a tot l'àmbit, encara que la sonda ja no compte el 404 nu. Petició al propietari de `seguiments.js`: que mire `cosDePostgrest(error).code` ∈ {PGRST202, PGRST205} en lloc del 404 nu. No ho he tocat.
- **Àrbitre · proves.** `npx vitest run` (node0Client, node0Client.r6, sondaConnexions, ConnexionsPubliques.degradacio, VideoEditorial, adaptadorNodeZeroHttp.host, articles de mur): 8 fitxers, 60/60. `node --test` (3 fitxers de node0): 38/38. `npx vitest run richText/extensions/ + i18n.claus`: 15 fitxers, 489/489. `npx eslint` sobre els 12 fitxers del carril: net. `grep local-first|masia`: cap. La clau `editor.video.titolPerDefecte` és als 5 diccionaris.
- **Àrbitre · veredicte.** Acceptat. No he fet cap correcció dins del carril. Queda pendent el 404 nu de `seguiments.js:236` (fora del carril), i també els elements omesos que declara el constructor (`editorial.js`, `htmlEditorial.jsx`, permisos de `sanitize.js`, `tests/node0-r12-editorial.test.mjs`).

<!-- R6B4:S3:FI -->

### B4-S4 · Verificació, portes i build

- **21:29** · A les 21:29 he llançat el workflow `wf_532bb3dd-b5a` amb B4-S1 a B4-S3 i un àrbitre per a cada carril. Abans he comprovat que `src/` no conté ara la cadena prohibida (0 aparicions) i que el rebut de l'informe ja és `torn_c8cd2144`. Els fitxers del kit R12 que entren a este bloc: amb preimatge, `contracte.js`, `backendPort.js`, `conformitat/kit.js`, `sondaConnexions.js`, `node0/adaptadorNodeZeroHttp.js` i `node0Client.js`; nous, la migració 76, `editorialPublicada` (client i Supabase), `carpetesNotes.js`, `VideoEditorial.jsx` i `VideoEditorialNodeView.jsx`.

- **22:04** · **B4-S4 · Verificació, primera part (Claude, fil principal).** Han acabat els 6 agents i cap no ha fallat. Veredictes: S1 acceptat amb correccions, S2 acceptat i S3 acceptat.
  - **Correccions de l'àrbitre de S1, al fitxer `revisionsEditorials.js`:**
    - Una revisió posterior que el servidor rebutjava quedava amagada. Ara la còpia del navegador manté la prioritat.
    - Una data buidada tornava a eixir després de recarregar. Ara no es marca com a servida.
  - **Fora de carril, S1 ha portat de R12 tres grups de fitxers:**
    - **10 fitxers de `tooling/node0/`:** els he comprovat i en tots `HEAD` és igual a la preimatge del kit i el viu és igual al payload. És una substitució neta: no es perd cap canvi d'una altra mà.
    - **9 proves de `tests/`.**
    - **El recompte del contracte a `pageContent.js` (pàgina `fediversity`) i a `wikiManifest.js`:** ara diuen 43 capacitats, 132 mètodes i 184 casos, perquè hi ha dues capacitats noves, `carpetesNotes` i `edicioEditorial`.
  - **Prova roja nova, ja corregida:** el mock d'`UIContext` d'`assetResolver.test.js` no exportava `useUIActionsOpcional`, que ara usa `VideoEditorial`. Ara dona 29/29.
  - **Proves:** `npx vitest run` sobre 84 fitxers (els 46 de proves que ha tocat el bloc i les suites veïnes). Primer han passat 1.344 de 1.345, i amb la correcció passen tots.
  - **ESLint:** net en tots els fitxers JS i JSX de `src/` que s'han tocat.
  - **Cadenes prohibides:** la cadena que bloqueja Psicopatia no apareix en cap fitxer tocat. La paraula «masia» sí que apareix: **`src/sections/plugins/presentacioPlugins.js:162` («casa o la masia on vivia»)**, una edició d'una altra mà de les 21:44, fora dels nostres carrils. No l'he tocada, però trenca la regla del Mestre: MarIA l'ha de canviar. Les aparicions d'`es.js` i `gl.js` són «demasiado», no la paraula.
  - **`run-portes --nomes-portes`:** passen 32 portes, entre elles Contracte documental (amb el rebut renovat), Psicopatia, Build, Rutes, Adaptadors i Frontera Auth.
    - **Atura a la porta Reflex** per tres motius:
      - (a) `manifestDePobleContent.js`, nou del Bloc 1, encara no està versionat.
      - (b) La línia base del graf o corpus no coincidix (cal recalcular `wiki-baseline.lock.json`).
      - (c) Hi ha dues actes del 261105 sense versionar, d'altres mans.
    - Cap dels tres es pot resoldre sense commit i sense tocar una línia base, que és cosa del Mestre o de MarIA. Per això llance el cens (`--cens`) de les portes que no muten res, per vore la resta.

- **22:07** · **B4-S4 · Verificació, segona part, i veredicte.**
  - **Build a l'scratch (`r6b4_build`):** `MurSection-*.js` (13.859 B) i `MapaFotografic-*.js` (52.918 B) no fan cap referència al tesaurus ni al transformador. El tesaurus continua al seu chunk de 395.423 B. L'eixida 1 és la de sempre de `public-net.mjs:75`.
  - **Cens sencer de les portes que no muten res (`--cens`).** He arreglat les tres fallades que eren nostres:
    - (a) **Porta Nomenclatura:** el fitxer de bloqueig `…auditoria_claude.md.r6.lock`, que creava el meu script d'escriptura, era a `04_escriptori/`. L'he esborrat i el bloqueig ara viu a l'scratch.
    - (b) **Porta RLS:** a la migració 76, `crea_carpeta_notes` duia `search_path=''` sense espais, i el tractor no ho reconeixia. Ara diu `set search_path = ''`, que és el mateix.
    - (c) **Porta Llavor:** el telèfon del restaurant de l'Aplec 2023 (Balcó de Travadell) estava a `aplec2023Content.js`, a l'emplenament de la migració 76 i a `seed.sql`. L'he llevat, he canviat la prova d'`Aplec2023Article` i he regenerat `seed.sql` amb el generador. Ara l'Aplec no porta el número, i el recompte de la pàgina `fediversity` s'ha posat al dia.
    - Les tres portes ara passen. La reexecució de les proves de `mur/articles`, `seedSql` i conformitat dona 7 fitxers i 423/423.
  - **Fallades que queden, totes fora del nostre abast:**
    - **Porta Reflex:** cal commit i recalcular la línia base, cosa del Mestre o de MarIA.
    - **Llaurador:** 14 enllaços penjats i la imatge `01_produccio/261105_2204_…jpg`, d'una altra mà, que no està lligada enlloc.
    - **Frontmatter F3:** l'acta `10_actes/261105_1846_…` porta `status: vigent`, d'una altra mà.
    - **Frontmatter F9:** ha passat de 33 a 34, i no és cap dels documents que hem tocat nosaltres.
    - **Frontissa:** cal tornar a segellar `fediversity` a `.agents/contingut_estructural.json`. El payload del kit ja duu la clau.
- **Relleu i decisions per al Mestre i MarIA.**
  - **(1) No s'ha d'aplicar la migració 76** fins que el seu emplenament de l'Aplec quadre amb l'`aplec2023Content.js` viu. `tests/node0-r12-editorial.test.mjs` encara mostra la diferència sota PGlite.
  - **(2)** Els fitxers de R12 que reescriuen el disseny editorial dels Blocs 2 i 3 no s'han aplicat: `publicacioEditable` (EditorDePublicacio, esborranys en IndexedDB, RPC directa), l'`editorial.js` del payload i les permissions de `sanitize.js` per a `figure`, `details` i `section`. Cal triar entre «Edició avançada» de R12 i el disseny dels Blocs 2 i 3. La fusió de `creaCarpeta` per a `NotesContext` està preparada a `r6b4_merge/s2`.
  - **(3) D-B4-1 queda a mitges:** el superadmin pot revisar peces del Mur que són de la llavor i peces de l'Agenda, però no una fila del Mur amb UUID d'una altra persona. L'upsert la tornaria a signar en nom seu. Cal un camí al servidor que conserve l'autoria.
  - **(4)** La UI de carpetes encara no espera `creaCarpetaCreada` (`NotesEditor.jsx:400`, `BotoneraClassificacio.jsx:166`), i el text `AVIS_CARPETES` ha quedat vell.
  - **(5)** `seguiments.js:236` encara tracta qualsevol 404 com a NO-DISPONIBLE. La sonda de connexions ja no ho fa.
  - **(6)** `presentacioPlugins.js:162` porta la paraula «masia» (escrita per una altra mà).
  - **(7)** A comprovar al navegador: la trampa de focus del `<dialog>` i si «Reintentar» torna a baixar un mòdul que ha fallat.
  - **Res commitejat, ni desplegat, ni cap migració aplicada.** Falta la validació del Mestre a `http://localhost:3340`.

<!-- R6B4:S4:FI -->

## Onada R6 · Bloc 5 (1 sol fil, COMMIT R6)

Un sol fil i cap subagent, amb el 3% final de quota. Segons l'ordre del Mestre, la migració 76 ja està sincronitzada amb `APLEC_2023_HTML` i `MANIFEST_DE_POBLE_HTML`, i ja està aplicada al Supabase remot i al PostgreSQL 17 del Node 0. No ho he verificat jo.

- **23:19** · **Codi del Bloc 5.**
  - (1) **Carpetes:**
    - `NotesEditor.jsx` (`desaCarpeta`, ara amb `assignaCarpeta`) i `BotoneraClassificacio.jsx` (`afigCarpeta`) criden `await creaCarpetaCreada(àmbit, nom, { existents, config })`. La nota pren l'identificador que torna la creació: el del servidor si té `carpetesNotes`, o el del navegador si no. Així ja no apunta mai a un identificador fantasma.
    - Si la Botonera ja ha creat la carpeta, l'editor no la torna a crear.
    - Si la creació falla, l'editor mostra un toast d'error i la Botonera un error al camp. La clau nova és `section.notes.carpetes.errorCrear` als 5 diccionaris.
    - He actualitzat `AVIS_CARPETES` i `section.notes.editor.avisCarpetes` als 5 diccionaris.
    - Les dues proves de la Botonera ara esperen la creació asíncrona.
  - (2) **`seguiments.js:236` (`errorConnexionsRpc`):** només dona `NO-DISPONIBLE` si el codi de PostgREST és `PGRST202` o `PGRST205` (`CODIS_ESQUEMA_ABSENT`). Un 404 sense eixe codi ara és `DESCONEGUT`.
  - (3) La paraula «masia» de `presentacioPlugins.js` ja l'havia llevada una altra mà.
  - **ESLint** net. **Vitest dirigit:** classificació, NotesEditor, seguiments, Seguidors, ConnexionsPubliques, sondaConnexions, Connectar, i18n i catàleg, 62 fitxers. Després d'adaptar les dues proves asíncrones de carpetes, la classificació torna a passar sencera (7 fitxers, 81/81).

- **23:23** · **COMMIT R6: intent bloquejat pel hook i aturat (sense `--no-verify` i sense push).**
  - **Lease:** `59308ea9` de MarIA, segellat a les 22:32 CET expressament per al «COMMIT R6 amb Blocs 1-4, Arbre Genealògic i Dossier FEDiversity». Té 328 camins i caduca a les 02:32 CET.
  - L'índex preparat per MarIA coincidix exactament amb l'arbre pendent del lease (`git write-tree` = `8299148decef911bd9e7bb445a8bf9f95a1c9f18`). He intentat `git commit` amb este índex, sense els canvis del Bloc 5, perquè `seguiments.js`, `Classificacio.test.jsx` i la línia base queden fora dels camins del lease.
  - **Han passat:** `frontissa-contingut` (20/20), `porta-taxonomia` i `porta-plantilla-viva`.
  - **El hook ha parat** a `git-staged.mjs` → `run-portes --nomes-portes`, a la porta **Cens**. L'error és «C2 · Cens incomplet»: **`.agents/ESTAT.md` parla del Consell però només n'anomena 3 de 12**. Falten Z.ai, Deepseek, Dola, Kimi, Perplexity, Mistral Vibe, Grok, Copilot i ChatGPT Codex.
  - `.agents/` és de MarIA i no l'he tocat. **Per desbloquejar-ho:** MarIA ha d'arreglar `ESTAT.md` (anomenar els 12 o no parlar del Consell), tornar-lo a preparar a l'índex i repetir el commit amb el lease encara viu.
  - **`tancament.mjs --check`:** `valid: true`, amb les 8 comprovacions en eixida 0.
  - **Línia base:** `reflex_petorreta.mjs baseline` només **imprimix** el resum i no escriu el lock. El fitxer `wiki-baseline.lock.json` s'escriu redirigint eixa eixida, i s'ha de fer sobre l'arbre final just abans del commit. Ara `doctor` encara dona «baseline divergent» i dues actes del 261105 sense versionar. A més, el lock queda fora dels camins de `59308ea9`.
- **Pendent per al relleu:**
  - (1) MarIA arregla `ESTAT.md` i repetix el commit.
  - (2) Els canvis del Bloc 5 (carpetes asíncrones, `seguiments.js`, les dues proves i els textos de les 5 llengües) queden **sense commitejar** i van en un commit propi. Cal un lease nou, que no es pot obrir fins que caduque `59308ea9` o es consumisca amb el commit R6.
  - (3) La línia base, recalculada sobre l'arbre final.
  - (4) `git push fork backup-notes-publish` només després del commit.
  - No he verificat que la migració 76 estiga aplicada al Supabase remot ni al Node 0: ho diu l'ordre del Mestre.

- **23:31** · **Segon intent del COMMIT R6 (23:30): bloquejat a la porta Doctrina.**
  - MarIA ha arreglat `.agents/ESTAT.md` i el Cens ja passa. L'índex ha canviat a `10ea9fd3…`, i entre l'arbre segellat i l'actual només canvia `ESTAT.md`.
  - **Bloqueig nou:** la porta Doctrina falla perquè **`.agents/ESTAT.md:25` cita `DocumentPropertiesDrawer.jsx`, que no existix**.
- **Cens sencer de portes sobre el viu (`--cens`), per a predir la resta de bloquejos.**
  - (1) **Doctrina:** l'error de dalt.
  - (2) **Reflex:** «baseline divergent» en el lock `wiki-baseline.lock.json`. **El lock queda fora dels 328 camins del lease `59308ea9`**, així que no pot entrar en este commit. Si el hook també ho veu sobre HEAD més l'índex, caldrà un lease nou que l'incloga, i no se'n pot obrir cap fins que caduque eixe (02:32 CET).
  - (3) **Frontmatter F3:** l'acta `10_actes/261105_1846_…` porta `status: vigent`. Com que no està versionada, no afecta l'arbre del hook.
- No he tocat res de `.agents/`. No hi ha commit ni push.

- **23:47** · **Tercer i quart intent del COMMIT R6 (23:45–23:50): bloquejats a `porta-documents --staged`.**
  - MarIA ha arreglat la línia 25 i Doctrina ja passa. A l'índex també ha afegit el lock de la línia base, les dues actes del 261105, el pla, el prompt, l'índex de l'Escriptori i el Llibre Mestre.
  - **Primer error:** el fitxer del torn `torn_c8cd2144` no era a l'índex. Era dins dels camins del lease, i el `.gitignore` deixa versionar els torns. L'he afegit a l'índex per a provar-ho, sense tocar-ne el contingut.
  - **Segon error:** «Cal versionar el rebut del torn tancat amb el document», per al **pla** i el **prompt** de 261104_1636. El torn `torn_c8cd2144` (de MarIA) encara no està tancat. Tancar-lo és cosa seua.
  - He tret de l'índex el fitxer del torn que hi havia afegit jo. L'índex queda com el va deixar MarIA (`c5bf1ce1…`).
  - **Per desbloquejar-ho:** MarIA tanca `torn_c8cd2144`, prepara a l'índex el fitxer del torn amb el seu rebut, i aleshores es repetix el commit. Res commitejat ni pujat.

- **00:12** · **Cinqué intent del COMMIT R6 (00:10): bloquejat a `tancament --check` → `scc`.**
  - MarIA ha tancat el torn i ha preparat a l'índex el fitxer del torn, el pla, el prompt, l'índex de l'Escriptori i el Llibre Mestre (índex `facddd74…`). Ja passen `porta-documents` i la resta de comprovacions de `tancament`, fins a `wiki`.
  - **Falla `scc`** amb 121 enllaços inexistents (`LINK_INVALID`), tots de `_wiki_de_poble/04_escriptori/00_index_escriptori.md`. Són captures de `01_produccio/` (per exemple `261103_1531_teler_4_bandes_…jpg`, `261103_2202_perfil_javi_mercat_mac_mini_orfe.png`) que no estan versionades, i per això no existixen a l'arbre que el hook munta amb HEAD i l'índex.
  - **Per desbloquejar-ho, ho decidix MarIA o el Mestre:** (a) llevar eixos enllaços de la versió de `00_index_escriptori.md` que va a l'índex, o (b) versionar les captures. Per a la (b), compte amb D-1: hi ha captures amb dades personals, i un commit no pot passar de 13 MB.
  - No he tocat res. Res commitejat ni pujat.

- **00:22** · **Sisé intent del COMMIT R6 (00:20). Per ordre del Mestre («Llevar els enllaços»), he tocat només la versió de l'índex.**
  - De `00_index_escriptori.md` he llevat 118 enllaços a captures de `01_produccio/patrimoni_oral_mestre` que no estan versionades, i les 3 entrades `[[261104_1636_auditoria_*]]` d'informes que tampoc ho estan. El fitxer del disc no ha canviat (blob `4171ec1f`, índex `07d30157…`).
  - **Ara passen** `tancament --check` (`scc` inclòs), Reflex i totes les portes fins a **Llaurador Índexs**, que falla per 4 enllaços penjats. Ho he comprovat sobre l'arbre que muntaria el commit, a l'scratch:
    - `.agents/ESTAT.md:16-18` enllacen els tres informes `261104_1636_auditoria_{claude,gemini,codex}.md`, que no estan versionats.
    - `.agents/ON_ESTIC.md:43` enllaça la captura `01_produccio/261104_1615_correu_enviat_nlnet_…jpg`, que tampoc està versionada i porta un correu personal.
  - Són fitxers de `.agents/` (de MarIA) i no els he tocat. Cal la decisió del Mestre o de MarIA.

- **00:29** · **Seté intent del COMMIT R6 (00:25). Per ordre del Mestre, he desenllaçat els enllaços de `.agents/` només a la versió de l'índex.**
  - A `.agents/ESTAT.md` he convertit en text 15 enllaços als tres informes `261104_1636_auditoria_*`, que no estan versionats (Llaurador els comptava com 3 perquè són tres destins). A `.agents/ON_ESTIC.md:43`, 1 enllaç a la captura del correu a NLnet. Els fitxers del disc no han canviat (índex `7d07ee09…`).
  - **Ja passen totes les portes del hook.** Ara falla `test:precommit`, amb 3 proves. **Les tres són en fitxers fora dels 328 camins del lease `59308ea9`**, així que no poden entrar en este commit:
    - (1) `src/data/localXat.silenci.test.js:140` encara espera 41 capacitats, i R12 en té 43. **Arreglat a l'arbre de treball** (43), sense preparar-ho a l'índex.
    - (2) `src/sections/multimedia/censImatges.test.js`: a `censImatges.js` li faltava l'entrada de `/assets/ui/plugins/genealogia_vinyeta.webp`, de l'Arbre Genealògic. **Afegida a l'arbre de treball**, sense preparar-ho a l'índex.
    - (3) `src/sections/detail/ItemDetailSection.pobleIncomplet.test.jsx` (AH-27): la llavor de La Torre obri l'IndexedDB `sdp-viquipedia`. **Causa:** des de R5-D5, La Torre manté els seus «700 hab», però ja no rep `population_year` (abans arribava amb els «749 hab, 2025» de l'Aplec). Sense eixe camp, `fitxaCompleta` dona fals i el ganxo va a la cau. **Decisió per al Mestre:** posar l'any de la xifra de 700 a la llavor, si se sap; o deixar que l'Aplec omplga `population_year` només quan també porta la població; o acceptar la hidratació i canviar la prova.
  - **Estat:** res commitejat ni pujat. A l'índex hi ha el conjunt de MarIA més els meus desenllaços (aprovats pel Mestre). El COMMIT R6 necessita un lease nou que incloga estos 3 fitxers, el Bloc 5 i la línia base. No es pot obrir fins que caduque `59308ea9` (02:32 CET) o MarIA ho resolga.

- **00:43** · **Huité intent del COMMIT R6 (00:40), amb el lease de MarIA ampliat a 355 camins.**
  - He aplicat «Que l'ompla l'Aplec». `fusionaAmbAplec` marca `poblacio_propia: true` quan la població és la de la llavor i l'Aplec en porta una altra amb el seu any. Amb eixa marca, `campsQueFalten` no exigix `population_year`. Ara `pobleIncomplet` passa, i la carpeta de pobles també: 25 fitxers, 357/357. `seed.sql` s'ha regenerat (la fila de La Torre porta el camp).
  - He preparat a l'índex 17 fitxers, tots dins del lease. Els desenllaços de l'índex (`00_index_escriptori.md`, `ESTAT.md` i `ON_ESTIC.md`) no s'han tocat. Índex: `31af4a3c…`.
  - **El hook ha passat totes les portes, i a `test:precommit` només n'ha fallat una:** `src/data/supabase/connexionsPubliques.test.js` («404 és capacitat absent»). Esta prova fixa justament el comportament que el Mestre ha manat canviar a `seguiments.js`. **El fitxer queda fora dels 355 camins.**
  - **L'he adaptada a l'arbre de treball, sense preparar-la:** un 404 nu dona `DESCONEGUT`, i PGRST205/PGRST202 donen `NO-DISPONIBLE`. Passa 34/34 amb `seguiments.test.js`.
  - **Opcions per a tancar-ho:**
    - (a) MarIA afig `src/data/supabase/connexionsPubliques.test.js` al lease, i es fa el commit amb tot.
    - (b) Traure `seguiments.js` de l'índex, fer el COMMIT R6 sense eixe canvi i deixar-lo per al commit següent.
  - El lease caduca a les 02:32 CET.

- **00:54** · **COMMIT R6 SEGELLAT I PUJAT (00:52).** MarIA va afegir `connexionsPubliques.test.js` al lease `59308ea9`, que ara té 358 camins. El vaig preparar a l'índex (`f5ff59a4…`) i `git commit` va passar el hook sencer, sense `--no-verify`.
  - **Commit:** `d79a0b530` sobre `backup-notes-publish`: 211 fitxers, +14.075/−1.266, arbre `f5ff59a460fa2b2f98eea5e95356981d705a3583`.
  - **Push:** `git push fork backup-notes-publish`, de `064ec0137` a `d79a0b530`. La branca local queda igualada amb `fork/backup-notes-publish`.
  - **Queden fora del commit, a l'arbre de treball:** les versions del disc de `00_index_escriptori.md`, `.agents/ESTAT.md` i `.agents/ON_ESTIC.md`, que són les enllaçades (el commit porta les desenllaçades); els tres informes `261104_1636_auditoria_*` sense versionar; i les captures de `01_produccio/`.
  - No he desplegat res.

<!-- R6B5:S1:FI -->

## Onada R7 · Auditoria Adversarial Nocturna i Guia d'Integració

Ordre del Mestre del 261106 (guàrdia nocturna, zero botons). Arrancada a les 01:19 CET amb un 94% de la quota setmanal gastat (reset a les 11:00). Base: `backup-notes-publish` = `d79a0b530` (COMMIT R6). A l'arrancada, `src/` estava net: només hi havia canvis en `_wiki_de_poble/` i `.agents/`. Claude fa d'auditora i no toca `src/`. Els pegats proposats van a `_investigacio_ia_de_poble/261106_claude_r7_gauntlet/`. Cada troballa s'escriu ací en el moment amb un script amb `fcntl.flock`, abans de l'àncora del seu subapartat.

### R7G-0 · Desplegament de d79a0b530 i sonda P0-16

**Decisió: no s'ha desplegat.** El `package.json` no té cap ordre de desplegament d'un sol pas. Per fer-ho de manera segura caldria: (1) compilar `d79a0b530` en una còpia neta, fora d'un arbre amb 145 entrades brutes, amb un `node_modules` d'enllaços per paquet; (2) publicar a `socdepoble.org` i a `socdepoble.cat` per la recepta REST de Firebase; i (3) provar la consola en producció amb Chrome sense interfície (P0-16 = «Consola 100% neta en producció»). Tot això passa del 1% de quota que posava l'ordre, i la producció quedaria sense vigilància amb el Mestre dormint. A més, la migració 76 encara no s'ha d'aplicar, i el poble de La Torre no té `population_year` (decisió del Mestre pendent). Queda per a les 11:00, si el Mestre ho confirma.

<!-- R7G:S0:FI -->

### R7G-1 · IDEA-102 / P0-27 (SquareBadge davall de l'entradilla i xips d'events)

- `01:26` · **R7G-1-01 · P2 · CONFIRMAT · Línies del pla desfasades i fitxer CSS equivocat.** Evidència: el `badge-row` d'events és `src/sections/detail/detailSectionMeta.jsx:990` (dins `buildEventsDetailSectionMeta`, l. 976), tal com diu el pla; els de 767 (Notes), 857 (Mur), 870 (`detail-tags`) i 949 (Multimèdia) són d'altres seccions i NO s'han de tocar. El posicionament absolut no és a `modules.css` sinó a `src/css/layout.css:554-575` (`header.page-title.has-aside > .sp-card-calendar-badge`). Risc: qui seguisca el pla al peu de la lletra buscarà en el fitxer erroni. Proposta: citar `layout.css`; el pegat `p0-27_squarebadge.diff` ho fa.
- **R7G-1-02 · P1 · CONFIRMAT · El color del quadrat de preu es perd en moure'l fora de la capçalera.** Evidència: `src/css/components.css:1735-1737` pinta el preu amb `.page-title.has-price > .sp-card-calendar-badge`; el `SquareBadge` de preu no porta `data-tipus` (`SquareBadge.jsx:96`). Fora de `header.page-title` el selector deixa d'aplicar-se i el preu torna al color de calendari. Proposta: modificador `.sdp-pagina-insignia--preu` a la fila (pegat, `components.css`) i prova de regressió.

- `01:26` · **R7G-1-03 · P1 · CONFIRMAT · Dins l'article, el quadrat queda amagat i llegit per la traducció.** Evidència: `PageFrame.jsx:1234` (`<article ... hidden={traduida ? true : undefined}>`); la capçalera és fora de `containerRef` precisament perquè l'Índex i el traductor no la llegisquen (`PageFrame.jsx:722-737`). Risc: amb una traducció activa el dia/preu desapareix, i el text del quadrat (mes en majúscules) podria arribar al traductor. Proposta (al pegat): fila amb `translate="no"` (`blocsTraduibles.js:69` ho respecta) i duplicada al començament de l'article traduït. No provat visualment ni amb traducció real.
- **R7G-1-04 · P1 · CONFIRMAT · La prova `detailSectionMeta.events.test.jsx` afirma les píndoles que s'eliminen.** Evidència: l. 22 (`.badge-row .pill`) i els 4 `toEqual([...])`; el fitxer de provació de `seguretat-01` també cobreix `date_label` hostil. Risc: llevar el `badge-row` sense reescriure-la trenca 4 proves, i es perdria la protecció «Objects are not valid as a React child». Proposta: pegat conserva el cas hostil (continua sense tombar) i afirma `.badge-row` absent.
- **R7G-1-05 · P1 · CONFIRMAT · `elementDeSeccio.agenda.test.jsx` afirma el quadrat dins de `header.page-title` amb `has-aside--sense-logo`.** Evidència: l. 93-109 originals. Proposta: reescrita al pegat (quadrat a `article.content-wrapper > .sdp-pagina-insignia`, després de `.lead`, o primer fill sense entradilla; capçalera sense `has-aside`); 63 proves en verd en còpia congelada.

- `01:26` · **R7G-1-06 · P2 · CONFIRMAT · Restes de capçalera si es mou el quadrat.** Evidència: `hasHeader` incloïa `activeBadge` (`PageFrame.jsx:1051`) i `layout.css:560-575` fixava `min-height: calc(128px + ...)` i `padding-right` + `text-align:left` de l'H1 per a `has-aside--sense-logo`. Risc: una pàgina amb només quadrat pintaria una capçalera buida; la resta deixaria un buit de 128 px i un H1 alineat a l'esquerra sense motiu. Proposta: llevat al pegat (classes `has-price`, `has-calendar-badge`, `has-aside*` fora; únic ús de `.page-title.has-price` era el selector corregit a R7G-1-02).
- **R7G-1-07 · P2 · CONFIRMAT · Info que només sortia a les píndoles d'events.** Evidència: `item.type_label`/`type`, `item.file` i `date_label` només es pintaven al `badge-row` (`detailSectionMeta.jsx:991-994`; cap altre ús a `src` fora de `mapejadorSeccions.js:522`). L'autor ja és a la barra taronja i el dia al quadrat; un acte sense data (`insigniaDeCalendari` torna `null` si no hi ha `esdeveniment`, `editorial.js:431,444`) quedaria sense cap data visible. Els `date_label` multidia (Cursos de pedra) continuen al text de l'acte (seed). Efecte positiu: desapareix la píndola crua `event` (reserva en anglés, sense i18n). Decisió del Mestre pendent: si es vol conservar `file` o el `type_label`.
- **R7G-1-08 · P3 · CONFIRMAT · Baseline roig no relacionat.** Evidència: `npx vitest run src/components/universal/EventCard.test.jsx` falla a l'arbre viu (HEAD d79a0b530 amb canvis d'altres mans) a «Llei del Píxel · la insígnia dels Cursos de pedra en sec» (l'`innerHTML` del `<time>` no coincidix); no el toca el pegat. 
- **R7G-1-09 · P3 · PLAUSIBLE · Ordre de lectura i foco.** El quadrat de calendari és `<time role="button" tabIndex=0>` (`SquareBadge.jsx:60-67`): davall de l'entradilla entra a la tabulació abans del cos (abans, a la capçalera). Raonable, però no s'ha provat amb lector de pantalla. En la variant sense entradilla amb només `subtitol`, el quadrat queda després de l'`<h2>`, no «al començament del cos» com diu la spec; ambigüitat a decidir.

`01:26` · **Veredicte del carril 1:** El pla d'IDEA-102 és viable però incomplet: el `badge-row` d'events és realment a `detailSectionMeta.jsx:990`, però el CSS és a `layout.css` (no `modules.css`), el color del preu depén del selector `.page-title.has-price` i el quadrat dins de l'article queda amagat/llegit amb la traducció. El pegat `_investigacio_ia_de_poble/261106_claude_r7_gauntlet/p0-27_squarebadge.diff` (codi, CSS i 2 proves reescrites + 1 nova) passa `git apply --check`, i en còpia congelada 63 proves rellevants van en verd; la única roja prèvia (`EventCard.test.jsx`) ja ho era. No provat al navegador (mòbil, tema fosc, traducció real).

- `01:27` · **Contraauditoria del carril 1:** R7G-1-02 SOSTINGUDA (`components.css:1735-1737` només tinya el color d'acció per `.page-title.has-price` o `data-tipus="price"`, i el `<div>` de preu de `SquareBadge.jsx` no posa `data-tipus`; en traure'l de la capçalera el quadrat de preu del detall de producte torna al color de calendari; el pegat el cobrix amb `--preu`) · R7G-1-03 SOSTINGUDA (`PageFrame.jsx:1234` posa `hidden` a l'article quan hi ha traducció, i la capçalera viu fora de `containerRef`; un quadrat dins l'article desapareix amb la traducció; lectura del traductor plausible, no provada amb traducció real, com diu el pegat) · R7G-1-04 REBAIXADA a P2 (`detailSectionMeta.events.test.jsx:21-57` afirma píndoles que la IDEA-102 elimina per ordre: és l'actualització esperada del test, no un defecte; només cal conservar la guarda hostil `seguretat-01`, que el pegat manté; `textDeLaPindola` només s'usa a les píndoles eliminades, `detailSectionMeta.jsx:974-992`) · R7G-1-05 REBAIXADA a P2 (el test AH-20 de `elementDeSeccio.agenda.test.jsx:70-107` cau per construcció en moure el quadrat; correcció prevista, i el pegat la reescriu amb prova de preu; no executada).

<!-- R7G:S1:FI -->

### R7G-2 · IDEA-105 / P0-28 (scroll de «Drets d'autor» a «El compte»)

- `01:23` · **R7G-2-01 · P0 · CONFIRMAT · El diagnòstic de P0-28 és CERT a Chromium; la sospita adversarial queda refutada.** Evidència: experiment `l2_p028/exp.mjs` (Chrome headless aïllat + CDP `Input.dispatchMouseEvent mouseWheel` ×5 de 100px damunt de `.sdp-drets`), rèplica estàtica de la cadena `contained > content-wrapper > .perfil-compte > section.perfil-compte__bloc > .perfil-detall > .sdp-drets`, viewer de 600px. Sense arreglo, amb `.sdp-drets` NO desbordant (`clientHeight === scrollHeight`, 261/261 i 1561/1561): `contained.scrollTop` = **0** (pàgina gelada). Amb `.perfil-compte .sdp-drets { flex: none; overflow: visible; overscroll-behavior: auto }`: `contained.scrollTop` = **500** en els dos casos. Així doncs, `overscroll-behavior: contain` en un scroll container que no desborda SÍ talla l'encadenament a Chromium. Risc: el pla acert; l'única reserva és que l'experiment és una rèplica CSS, no l'app real. Proposta: aplicar `p0-28_drets_scroll.diff`.
- **R7G-2-02 · P2 · CONFIRMAT · Cal tot l'arreglo, no només `overscroll-behavior: auto`.** Evidència: mateix experiment, variants C i D. Només `overscroll-behavior: auto` (C) desbloqueja la roda, però el peu `.sdp-drets__peu` (sticky) segueix lligat al `.sdp-drets` (que continua sent scroll container sense scroll propi) i NO s'enganxa: amb cos de 1500px el peu queda a y=1357 amb viewer de 600. Només `flex: none; overflow: visible` (D) també desbloqueja i enganxa el peu (y=600). Amb l'arreglo complet (B) el peu queda a y=600 després d'haver baixat 500px (sticky OK respecte al scroll de la pàgina). Risc: un «arreglo mínim» deixaria «Desar autoria» fora de la vista. Proposta: no simplificar la regla; la prova de regressió (3 afirmacions) fixa les tres declaracions i el peu sticky.

- `01:23` · **R7G-2-03 · P2 · PLAUSIBLE · Peu sticky en compacte: reserva de la barra mòbil duplicada.** Evidència: `src/css/modules.css:7493` (`:where(.sdp-root.is-compact) .sdp-drets__peu { padding-block-end: calc(… + var(--sdp-alt-nav-mobil) …) }`) i `src/css/layout.css:1186-1197` (el `--contained` en compacte ja acaba damunt de la barra, o hi reserva `padding-bottom` amb «totes»). Amb l'arreglo el peu s'enganxa al scroll de la PÀGINA, que ja reserva la barra, i el farciment propi del peu podria afegir una franja buida extra davall dels botons. No verificat (no s'ha muntat el compacte a l'experiment). Proposta: comprovar visualment en compacte amb `data-sdp-barres="dalt"` i «totes»; si hi ha franja, neutralitzar el farciment amb `.perfil-compte .sdp-drets__peu`. No bloqueja el pegat.
- **R7G-2-04 · P3 · CONFIRMAT · Abast sense regressió i cobertura.** Evidència: `grep` de `<CopyrightPage` → només `DetallAjust.jsx:511` (dins de `DetallCompte.jsx:156` `.perfil-compte`), `DocumentEditor.jsx:1065` (columna de l'editor T39, fora de `.perfil-compte`) i `EspecimenDretsAutor.jsx:90` (catàleg de disseny); `.perfil-compte` existix de veritat (`DetallCompte.jsx:156`, `PerfilShell.css:167`). L'abast `.perfil-compte .sdp-drets` (0,2,0) guanya la base (0,1,0) a la mateixa capa `components`. Cap prova existent cobreix el scroll de `.sdp-drets` (`barresScroll.capes.test.js:265` només comprova el peu). Pegat: `_investigacio_ia_de_poble/261106_claude_r7_gauntlet/p0-28_drets_scroll.diff` (modules.css + `src/css/dretsDinsCompte.capes.test.js`), `git apply --check` OK; la prova nova passa 3/3 en una còpia i falla 3/3 sobre el modules.css sense arreglo. No s'ha executat sobre l'arbre viu. Reserva: Firefox/Safari no s'han provat (PLAUSIBLE que se'n comporten igual; l'arreglo és inofensiu allí).

`01:23` · **Veredicte del carril 2:** IDEA-105 / P0-28 aguanta. L'experiment decisiu (Chrome headless, roda real per CDP) confirma que `overscroll-behavior: contain` bloqueja l'encadenament encara que `.sdp-drets` no desborde, així que el diagnòstic del pla és correcte i la sospita queda refutada. L'arreglo complet (`flex: none; overflow: visible; overscroll-behavior: auto`) desbloqueja el scroll i manté el peu sticky; la versió parcial (només overscroll) deixaria el peu sense enganxar. Pegat validat amb `git apply --check` (`p0-28_drets_scroll.diff`) i prova nova 3/3 en còpia; pendent només la comprovació visual en compacte (R7G-2-03) i navegadors no-Chromium.

- `01:24` · **Contraauditoria del carril 2:** R7G-2-01 SOSTINGUDA (P0 mantingut: `p0-28_drets_scroll.diff` passa `git apply --check`; l'experiment `l2_p028/exp.mjs` és reproduïble i els `resultat*.json` mostren `scrollTop` 0 sense l'arreglo i 500 amb ell, amb `dCH===dSH`, és a dir sense desbordament propi; la base `.sdp-drets` (`modules.css`, bloc T39) té `overflow-y:auto` + `overscroll-behavior:contain` i `DetallCompte.jsx:156` hi posa `.perfil-compte` d'avantpassat; la regla nova va després, a la mateixa capa `components`, i l'editor T39 no es toca). Matisos que NO la rebaixen: és una rèplica CSS en Chrome headless, no l'app real; Safari i Firefox no s'han provat; el peu sticky passa a enganxar-se al scroll de la pàgina (esperat, el test del pegat ho cobrix).

<!-- R7G:S2:FI -->

### R7G-3 · IDEA-103 (Usuaris registrats a l'Administració del sistema)

- `01:23` · **R7G-3-01 · P1 · CONFIRMAT · L'especificació d'IDEA-103 cita un esquema que no existeix.** Evidència: `profiles` no té `town_id` ni correu: té `town_uuid`, `primary_town`, `town_name`, `secondary_towns`, `provinces`, `comarcas` (`supabase/migrations/2610282100_usuari_i_poble_canonic.sql:375-379`, trigger `trg_profiles_usuari_i_poble` `:904`); la taula és `organization_memberships`, no `organization_members` (`2609080000_initial_schema.sql:101`), i el rol només admet `owner|admin|member` (`:105`): el rol «editor» no existix. Risc: qui implemente seguint el Llibre Mestre (`03_llibre_mestre…md:382`) escriurà SQL que falla o inventarà una columna. Proposta: corregir el text del pla abans que Gemini/Codex hi construïsquen; «editor» o es descarta o requerix migració pròpia.
- **R7G-3-02 · P1 · CONFIRMAT · Les carpetes «Amics, Poble, Associació, Treball» del Veïnat connectat no tenen model de dades.** Evidència: cerca al repo i a `supabase/migrations` sense cap coincidència; el «Veïnat connectat» actual és `public.seguiments` (`2610241430_seguiments.sql:157`) més la visibilitat privada/pública de `private.connexions_vincles` (`2611032100_connexions_publiques_i_membres.sql:26`), sense cap camp de carpeta. Risc: la acció (a) de l'espec. no es pot implementar sense inventar una taula nova i una decisió de producte. Proposta: tractar-ho com a decisió del Mestre; fins aleshores, oferir només «seguir/connectar» amb el model existent.
- **R7G-3-03 · P0 · CONFIRMAT · Un superadmin NO pot assignar membres a organitzacions amb el que hi ha: l'1 clic de (b) fallaria.** Evidència: l'única política de `organization_memberships` és de lectura pròpia (`2609080000_initial_schema.sql:837-838`); `desa_membre_organitzacio` exigix `private.can_manage_organization` (`2610311500_…sql:271+`, `:~300 SDP-ORGMEM-002`), i eixa funció només mira membres `owner|admin` (`2609080000:385-398`), sense branca `es_superadmin`. A més: nomenar/degradar admin només ho fa la propietària (`SDP-ORGMEM-006`) i la persona ha de ser del `tenant_id` de l'organització (`SDP-ORGMEM-003`). Risc: o el panell no funciona, o algú eixamplarà `can_manage_organization` a tot superadmin, i això donaria permís d'escriptura a TOTES les organitzacions per tots els camins que la criden. Proposta: una RPC pròpia `admin_assigna_membre`, amb `es_superadmin()` (aal2) i sense tocar `can_manage_organization`; rol admin només per invitació acceptada.

- `01:23` · **R7G-3-04 · P0 · CONFIRMAT · Consentiment: connectar o fer membre «en nom d'altri» no té cap camí acceptat al servidor.** Evidència: `public.segueix` actua sempre sobre `auth.uid()` i exigix un poble compartit (`2610241430_seguiments.sql:294-330`, `private.poble_compartit :214`); no hi ha taula d'invitacions persona-rebuda: `private.connexions_sollicituds` només modela la sol·licitud de la persona cap a l'entitat, amb `estat='pendent'` únic (`2611032100…sql:46-52`). La ruta correcta de pertinença és el consentiment de la persona (`solicita_unir_se_a_entitat :279`). Risc: una pertinença o vincle bidireccional imposat vulnera l'expectativa RGPD de les persones i el model «ningú no ho pot triar per tu» (`ca.js:2041-2042`). Proposta: taula `private.admin_invitacions` (organització o persona, rol, estat pendent→acceptada/rebutjada, caducitat 14 dies); el panell només crea invitacions; la persona accepta des de les seues Notificacions. Mínim defensable: només l'alta (pertinença a «Sóc de Poble») en nom propi del Mestre i amb registre.
- **R7G-3-05 · P1 · CONFIRMAT · La llista necessita una RPC nova; l'`admin_list_users` actual no serveix i exposa el correu.** Evidència: `profiles` només es llig la fila pròpia (`2609150000_seguretat_profunda_deepseek.sql:106-108`; guarda `SDP-USER-022` a `2610282100:333-342`); `admin_list_users` torna `id, email, created_at, last_sign_in_at` sense nom/@usuari/poble, sostre 500 amb `offset` (`2609150000:110-133`). `IndicadorsAdmin.jsx:57` descarta expressament el correu («ni el correu, ni l'identificador, ni el nom»). Risc: pintar el correu de tota la base a la pantalla d'un administrador és el dret d'accés més ample del Mas; `offset` sobre `created_at desc` salta o repeteix files mentre arriben altes. Proposta: RPC `admin_usuaris_registrats(p_cursor_creat, p_cursor_id, p_limit<=50)` SECURITY DEFINER, `search_path=''`, `es_superadmin()` primer, columnes mínimes (id, nom, username, avatar, poble, creat, estat de consentiment/baixa), correu emmascarat per defecte (`j***@dom.org`) i revelació amb un clic registrada.
- **R7G-3-06 · P1 · CONFIRMAT · «Temps real» a `profiles` no és viable ni convenient.** Evidència: l'única publicació `supabase_realtime` del repo és per a `xat_missatges` (`2609080200_xat_v2_correccions.sql:353-371`); amb RLS de fila pròpia, una subscripció d'un superadmin a `profiles` només rebria la seua fila. Risc: afegir `profiles` a la publicació per fer-ho funcionar emetria canvis de totes les persones a tots els clients subscrits si una política s'eixampla algun dia. Proposta: «en viu» = botó d'actualitzar + refresc en tornar al panell (visibilitychange) i un recompte barat via RPC; mai realtime directe a `profiles`.

- `01:23` · **R7G-3-07 · P1 · CONFIRMAT · Canviar el poble d'una altra persona trenca la integritat d'identitat.** Evidència: el poble viu en 6 columnes derivades (`private.poble_derivat`, `2610282100:606-644`) i en `town_memberships`; seguiments exigixen poble compartit (`poble_compartit`), pertinences d'organització exigixen `town_memberships` al `tenant_id` (`SDP-ORGMEM-003`) i els directes del xat són per `tenant_id` (`2610081543…sql:86-100`). Un `UPDATE` només a `profiles` deixaria `town_memberships` i el trigger inconsistents; a més la RLS d'UPDATE és només la fila pròpia (`2610160250_perfil_update_propi.sql:127-131`). Risc: persones que perden el xat, seguiments i entitats sense avís. Proposta: no oferir canvi lliure; (c) = «afegir a un poble» per RPC que escriga `town_memberships` + `secondary_towns` coherents, notifique la persona i registre; el canvi del poble principal el fa la persona.
- **R7G-3-08 · P1 · CONFIRMAT · No hi ha cap registre d'auditoria de les accions d'administració.** Evidència: cap taula `*audit*|*registre_admin*` a `supabase/migrations` per a accions de superadmin; `desa_membre_organitzacio` tampoc deixa rastre. Risc: una pertinença o vincle imposat no es pot reconstruir ni defensar davant una persona o l'AEPD. Proposta: `private.admin_accions` append-only (qui, quan, acció, objectiu, abans/després, hash del correu si se'n va revelar), escrit per les mateixes RPC dins de la transacció, sense DELETE per a cap rol.
- **R7G-3-09 · P1 · CONFIRMAT · El llistat ha de respectar baixa i consentiment.** Evidència: `profiles.baixa_demanada_at` (`2609261500_identitat_perfil_f1.sql:61,86-89`) i `consentiment_rgpd_at` (`2609080000:66`); `membres_del_poble` ja filtra per ambdós (`2610081543…:93-96`), `poble_compartit` descarta les baixes i `crea_fil_directe` rebutja sense consentiment (SDP-XAT-016). Risc: botons actius sobre una persona que ha demanat la baixa, o xat directe que el servidor refusa. Proposta: mostrar-les amb insígnia «Baixa demanada» / «Sense consentiment» i accions desactivades, i que cada RPC ho torne a comprovar.

- `01:23` · **R7G-3-10 · P2 · CONFIRMAT · La porta de superadmin del client és només de pintura; el servidor sí que la fa complir, amb aal2.** Evidència: `useSuperadminEstable.js` (capçalera: «Només afecta el que es MOSTRA»), `PerfilShell.jsx:245-246` no pinta `admin-*` sense superadmin; al servidor, `private.es_superadmin()` exigix rol + `aal='aal2'` (`2610061448_superadmin_aal2.sql:2-10`) i `admin_list_users` etc. la criden primer. Risc: un superadmin amb aal1 veu el panell i rep 42501; sense gestionar-ho, es mostra un error cru. Proposta: reutilitzar `esRebuigDeSegonFactor`/`TEXT_CAL_SEGON_FACTOR` (`IndicadorsAdmin.jsx:34`) i que cada RPC nova el torne igual; cap decisió d'autorització al client.
- **R7G-3-11 · P2 · CONFIRMAT · Afegir un 7é apartat trenca un test existent, i els títols de l'administració no passen per i18n.** Evidència: `PerfilShell.test.jsx:133-136` exigix exactament 6 panells `admin-`; `itemsDAdministracioSistema` (`perfilModel.js:339+`) té títols en català cablejats, no claus de `src/config/idiomes/`. Risc: CI vermella; panell nou sense traducció en els altres idiomes. Proposta: el pegat d'implementació ha de pujar el test a 7 i posar les claus (títol, subtítol, etiquetes, avisos) a `ca.js` i als idiomes germans amb el test de paritat; el nou ítem, vista `admin-usuaris`, a `PerfilShell.jsx:247-252`.
- **R7G-3-12 · P2 · PLAUSIBLE · Separació de tenants del remot.** Evidència: el codi ho confirma (organització i persona han de compartir `tenant_id`, `SDP-ORGMEM-003`); que al remot les persones són a La Torre i les organitzacions al poble de la llavor ve de les meues notes de sessions anteriors, no l'he comprovat contra la base real esta nit. Risc: si és així, l'assignació de les 4 entitats fallaria totes amb SDP-ORGMEM-003. Proposta: abans de construir, una consulta de lectura al remot (`select o.name,o.tenant_id from organizations …`) i decidir si l'RPC admin escriu també `town_memberships` o si es reubiquen les entitats.
- **R7G-3-13 · P2 · CONFIRMAT (criteris) · Accessibilitat i «1 clic».** Proposta: `<table>` amb `caption`, `th scope`, botons amb nom accessible complet («Convidar Maria a El Rentonar»), avatar amb `alt=""`, regió `aria-live="polite"` per al resultat de cada acció, focus tornat a la fila després d'un diàleg de confirmació, ordre de tabulació per fila, objectius ≥44px a 375px. «1 clic» s'ha de llegir com «1 clic i confirmació» per a qualsevol acció que toque una altra persona (R7G-3-04).
- **R7G-3-14 · P3 · PLAUSIBLE · «Veure la fitxa /perfil/:id» pot no existir per a perfils privats.** `profiles.is_public` per defecte `false` (`2609110600_perfil_avatar_i_permisos.sql:12`) i la lectura és fila pròpia; no he comprovat què pinta `PerfilPublicSection` per a un id privat. Proposta: provar-ho abans; si cal, que la fila indique «fitxa privada» i desactive l'enllaç.

`01:24` · **Veredicte del carril 3:** IDEA-103 tal com està escrita **no és implementable ni segura**. Referencia columnes i taules inexistents (`town_id`, `organization_members`, rol «editor», carpetes del Veïnat), i el seu nucli, l'1 clic per a pertinences i vincles en nom d'altri, xoca amb tres fets verificats: el superadmin no té camí d'escriptura a `organization_memberships` (R7G-3-03), cap vincle ni pertinença no té consentiment de la persona (R7G-3-04) i no hi ha registre d'auditoria (R7G-3-08). La llista sí que és viable amb una RPC nova paginada per cursor, correu emmascarat i filtre de baixa i consentiment; el «temps real» s'ha de substituir per refresc. Disseny mínim: `_investigacio_ia_de_poble/261106_claude_r7_gauntlet/idea-103_disseny.md`. No he executat cap prova ni consultat el remot (R7G-3-12 queda PLAUSIBLE).

- `01:25` · **Contraauditoria del carril 3:** R7G-3-01 REBAIXADA a P2 (el pla escriu `organization_members` i el rol `editor`, inexistents: `organization_memberships` amb `owner|admin|member` a 2609080000:101-105; però és un lapse de redacció, el pla no cita `profiles.town_id` ni correu, i els rols `treballador|usuari|administrador` de 2611032100:42-45 i 273 ja cobrixen l'intent) · R7G-3-02 REBAIXADA a P2 (cap model de carpetes Amics/Poble/Associació/Treball: només `connexions_preferencies`/`connexions_vincles` amb visibilitat privada|publica, 2611032100:14-33; és decisió de producte, no defecte; `Amics` només apareix a `personesConfianca`, concepte distint) · R7G-3-03 REBAIXADA a P1 (verificat: `desa_membre_organitzacio` exigix `can_manage_organization` i, per a admin, ser owner, 2610311500:271-340; superadmin no hi entra; però falla segur, és un bloqueig de viabilitat i no un forat; la política de lectura 2609080000:837 també deixa passar qui administra, no només la fila pròpia) · R7G-3-04 REBAIXADA a P1 (verificat: `segueix` actua sobre `auth.uid()` i `poble_compartit`, 2610241430:294-330, i `connexions_sollicituds` és persona→entitat, 2611032100:46-52; el risc només naix si s'implementa «Connectar» literalment en nom d'altri: risc de disseny, cap codi actual el permet) · R7G-3-05 SOSTINGUDA (P1: `profiles` només fila pròpia, 2609150000:106-107; `admin_list_users` torna `u.email` amb límit 500, :110-133; cal RPC nova; no he verificat què fa `IndicadorsAdmin.jsx` amb el correu) · R7G-3-06 REBAIXADA a P2 (verificat que només `xat_missatges` és a `supabase_realtime`, 2609080200:353-371; l'efecte és funcional, no hi arribaria res, sense risc de seguretat) · R7G-3-07 SOSTINGUDA (P1: UPDATE de `profiles` només propi, 2610160250:127-131; el poble canònic es deriva per trigger a 2610282100; no he reexecutat el trigger, la dependència de seguiments/xat del tenant és per lectura) · R7G-3-08 SOSTINGUDA (P1: cap taula d'auditoria d'accions d'administració a `supabase/migrations`; la cerca de `create table` amb audit/admin_acc/accions no dóna res; només hi ha `2609140100_auditoria_rls_fixes.sql`, que no és un registre) · R7G-3-09 REBAIXADA a P2 (verificat `baixa_demanada_at` filtrat a 2610081543:96 i política `profiles sense baixa`, 2609261500:32-35, que amaga les baixes fins i tot de lectura; és un requisit per a la RPC futura, sense defecte actual). Cap refutada; cap P0 sosté la severitat.

<!-- R7G:S3:FI -->

### R7G-4 · IDEA-104 A (Nix, RPC multipoble, API del Node 0 i assaig 3-2-1)

- `01:22` · **R7G-4-01 · P0 · CONFIRMAT · Nix no es pot declarar «verificat» en este Mac.** Evidència: `command -v nix` no torna res; no existix cap `flake.lock` (`ls flake.lock nix/flake.lock` falla); `nix/README.md` («Límit de verificació») diu que `nix eval`, `nix build`, la VM NixOS i el `flake.lock` «continuen pendents»; `pageContent.fediversity.test.js:447` fixa «sense verificar amb Nix». Risc: evidència sintètica (un `flake.lock` o hash inventat, o una prova que només parseja text i es presenta com a avaluació). Proposta: classe **NECESSITA-MAQUINARI** (nix real a Linux/Mac mini). Criteri: la pàgina només perd «sense verificar» si hi ha eixida literal de `nix flake check` + `nix build --rebuild` amb `flake.lock` versionat; si no, es manté.
- **R7G-4-02 · P1 · CONFIRMAT · El pla nomena dos fitxers que no existixen.** Evidència: pla línia 545 cita `nix/containers.nix` i `tooling/nixos/verifica-flake-reproduible.mjs`; `ls nix` = `README.md flake.nix module.nix prepare-public.mjs`; `tooling/nixos/` no existix. El verificador real és `tooling/seo/comprova-reproductibilitat.mjs` (analitza `flake.nix` entre marques `sdp:font-inici/fi` i fa dos builds Vite: és **estàtic + build**, no avaluació Nix). Risc: un obrer crea un `verifica-flake-reproduible.mjs` que només reempaqueta eixe parseig i la pàgina diu «verificat». Proposta: el criteri ha d'exigir que l'script torne error si `nix` no és al PATH (sense mode «ok» simulat) i que el seu nom/eixida diga «estàtic» quan no hi ha Nix.
- **R7G-4-03 · P0 · CONFIRMAT · Ni Mastodon bidireccional ni 3-2-1 estan tancats, i l'estat viu ho desmenteix.** Evidència (GET `https://socdepoble.cat/api/v1/node0/status`, 200, PostgreSQL `17.11`, schema `2611032100`): `activitypub.remoteInteropVerified:false`, `followers:0`, `received:0`, `mastodon.automaticSync:false`; `resilience.localTimeMachine.latestBackupFound:null`, `lastMirrorSnapshotAt:null`, `mirrorIntegrityOk:false`; `capabilities.userSessions/adminPublish/actorBinding:false`. Risc: declarar «100 %» contradiu l'API pròpia de producció. Proposta: **NECESSITA-MAQUINARI-O-HUMÀ** (compte Mastodon extern real que seguisca i reba; token; Mac mini). Criteri: només es tanca si el `status` viu torna `remoteInteropVerified:true` i `followers>=1` amb prova de signatura rfc9421 d'un actor remot.

- `01:22` · **R7G-4-04 · P1 · CONFIRMAT · «RPC multipoble de restauració + SPA↔API Node 0» xoca amb el disseny de seguretat.** Evidència: `src/data/node0/adaptadorNodeZeroHttp.js:3-5` («auth/escriptura/xat rebutgen»), `:140` `operacions:{lecturaPublica:true,escriptura:false,autenticacio:false,xat:false}`, tot el `CONTRACTE_NUCLI` queda en `absent` → `sense-capacitat`, i només fa `method:'GET'`; `importaMunicipiOpenData.js:7-8` diu que Supabase **no restaura** (només l'adaptador local). No hi ha cap RPC `importa_municipi*` a `supabase/migrations`. Risc: afegir restauració d'escriptura per HTTP sense sessions d'usuari (`userSessions:false`) obri un forat d'escriptura anònima/superadmin. Proposta: **AFIRMACIÓ-INFLADA** per a l'RPC d'escriptura; el que sí és **TANCABLE** és la lectura (ja funciona) i un assaig local amb PGlite. Criteri: cap POST/PUT sense sessió aal2 verificada; el test de l'adaptador ha de continuar exigint `escriptura:false` fins que hi haja sessions.
- **R7G-4-05 · P1 · CONFIRMAT · L'assaig 3-2-1 no es pot fer des d'ací i el script existent no és 3-2-1.** Evidència: `tooling/node0/verifica-restauracio-node0.mjs:1` («Disposable same-host restore proof; never a production restoration command»), `:11-14` camins fixos `/Users/javi/...` i l'eina `age`; mateix amfitrió = 1 còpia, no 3 còpies/2 suports/1 fora de casa. Risc: presentar la restauració al mateix Mac mini com a «3-2-1». Proposta: **NECESSITA-MAQUINARI**. Criteri: evidència amb ≥2 suports distints + 1 còpia externa, restauració en base neta amb recompte de taules igual a `status.taules` (41) i hash de verificació; `latestBackupFound` ha de deixar de ser `null`.

- `01:22` · **R7G-4-06 · P1 · CONFIRMAT · Llista exacta d'elements pendents de `/page/fediversity` (`src/sections/text/pageContent.js:783`) i classificació.** (1) RPC `2611031700_administracio_multipoble.sql` no aplicades a producció, dues vegades en la pàgina → **NECESSITA-HUMÀ** (credencials/deploy). (2) Pilot independent del Node 0 amb BD pròpia + càrrega + consum elèctric + mida BD → **NECESSITA-MAQUINARI** (mesurador d'endoll). (3) Lliurament remot del trasllat federat (FEDI-01 Move) → **NECESSITA-HUMÀ** (servidor remot). (4) WCAG 2.2 AAA sobre tota la funcionalitat → **AFIRMACIÓ-INFLADA** si es vol tancar en una nit; només parcial. (5) Paquet `flake.nix` «en curs, sense verificar» + desplegament NixOS independent → **NECESSITA-MAQUINARI**. (6) Xifratge dels xats reals i recuperació (F2a/F7; «xifratge global desactivat») → **TANCABLE-AQUESTA-NIT només el codi i les proves**; activar-lo és decisió de producte. (7) Seguiment complet amb Mastodon/inbox remot → **NECESSITA-HUMÀ**. (8) Fitxa oral amb revisió humana i restauració Supabase → **NECESSITA-HUMÀ**. Cap element és tancable al 100 % sense humà o maquinari; «zero pendent» és **AFIRMACIÓ-INFLADA** per construcció. La pàgina és honesta i els tests (`pageContent.fediversity.test.js:438-499,719-730`) la ancoren: esborrar «Pendent» obligaria a trencar-los.
- **R7G-4-07 · P2 · PLAUSIBLE · Risc de deriva de versió del Node 0.** Evidència: l'API viva diu `schemaVersion 2611032100`, i l'última migració al repo és `2611051930_edicio_publicacions_editorials.sql`; no he verificat si eixa migració pertany al esquema Node 0 (`tooling/node0/schema-node0.sql`) o només a Supabase. Proposta: abans d'afirmar «API pròpia al dia», comparar `schemaVersion` amb la darrera migració aplicable. Disponibilitat verificada només amb GET: `socdepoble.cat/` 200, `/api/v1/node0/status` 200, `socdepoble.org/` 200.

`01:22` · **Veredicte del carril 4:** el 100 % de `/page/fediversity` **no és assolible esta nit** sense humà o maquinari: no hi ha Nix, ni `flake.lock`, ni Mastodon remot (interop `false`, 0 seguidors), ni còpia de seguretat registrada (`latestBackupFound:null`), i els dos fitxers que el pla demana crear (`nix/containers.nix`, `tooling/nixos/verifica-flake-reproduible.mjs`) no existixen. **Criteris d'acceptació per a Gemini i Codex:** (a) cap canvi de text que lleve «Pendent» o «sense verificar amb Nix» sense eixida literal de `nix flake check`/`nix build` al repositori; (b) el verificador nou falla si `nix` falta (cap «ok» simulat); (c) l'adaptador Node 0 manté `escriptura:false` i només GET; (d) `pageContent.fediversity.test.js` continua en verd i s'hi afegix un test que lliga cada afirmació «verificat» a una evidència; (e) tancar només el codi de F2a/F7 amb proves, sense activar el xifratge global; (f) tota la resta, marcada com a NECESSITA-MAQUINARI-O-HUMÀ al Llibre Mestre. No he escrit cap pegat; no he executat proves (només lectura i GET).

- `01:23` · **Contraauditoria del carril 4:** R7G-4-01 REBAIXADA a P1 (fets certs: `nix` absent, cap `flake.lock`, `nix/README.md:12` i `pageContent.fediversity.test.js:447` conserven «sense verificar»; però no hi ha cap afirmació falsa vigent, és una barrera contra una afirmació futura) · R7G-4-02 SOSTINGUDA (`nix/containers.nix` i `tooling/nixos/` no existixen; el pla els nomena; verificador real = `tooling/seo/comprova-reproductibilitat.mjs`) · R7G-4-03 SOSTINGUDA (`/api/v1/node0/status` consultat ara: `remoteInteropVerified:false`, followers 0, received 0, `automaticSync:false`, `latestBackupFound:null`, `mirrorIntegrityOk:false`, `userSessions/adminPublish/actorBinding:false`; requerix maquinari o humà) · R7G-4-04 REBAIXADA a P2 (l'adaptador fixa `escriptura:false` a `src/data/node0/adaptadorNodeZeroHttp.js:140` per disseny, no xoca; `importaMunicipiOpenData.js:8-9` (no 7-8) diu que Supabase no restaura; cap `importa_municipi*` a `supabase/migrations`; el risc real és només de redacció «afirmació inflada») · R7G-4-05 REBAIXADA a P2 (`verifica-restauracio-node0.mjs:1-2` es declara prova «disposable same-host», camins `/Users/javi` a la línia 11; no pretén ser 3-2-1, el risc és només que s'invoque com a tal) · R7G-4-06 REBAIXADA a P2/PLAUSIBLE (verificats els tests `:447`, `:726-730`; no he enumerat jo els vuit pendents un per un, i «zero pendent» ja no s'hi afirma).

<!-- R7G:S4:FI -->

### R7G-5 · IDEA-104 B (E2EE F2a i F7, Mètode Karpathy i IAs del sistema)

- `01:24` · **R7G-5-01 · P0 · CONFIRMAT · L'E2EE dels xats reals NO està connectat: és una biblioteca darrere d'una constant de compilació apagada, sense opt-in per persona.** Evidència: `src/config/xifratXat.js:20` `E2EE_ACTIU_PER_DEFECTE = false` (const de build, no preferència d'usuari); `src/host.js:86` `if (!E2EE_ACTIU_PER_DEFECTE) return impl;`; `src/xat/*` i `Conversa.jsx` (≈25 llocs) estan tancats amb eixa mateixa constant. `grep` de `xifratXatAlta` i `xifratXatRecuperacio` en codi no-prova: cap importador (només comentaris a `personesConfianca.js:6`, `xifratXatFormats.js:649`). Vol dir que la cerimònia F2a (`creaAlta`, `restauraAmbFrase`) i el Shamir F7 (`reparteix`, `recuperaRk`) NO tenen cap camí cap a la UI real dels fils. `BlocPersonesConfianca.jsx:26` demana `teCapacitat('recuperacioSocial')`, «avui sempre fals». Les proves passen (vegeu R7G-5-04) perquè proven la biblioteca, no el producte. Risc: IDEA-104 punt 2 («100% completat i demostrat») és impossible d'afirmar amb veracitat; si algú cavalca la constant a `true` sense F2a/F7 cablejats, s'activa un xifratge sense alta ni recuperació. Proposta: l'acceptació ha de ser «connectat + opt-in + prova E2E amb IndexedDB real»; fins aleshores, la pàgina ha de continuar dient «preparat, apagat» (ja ho diu a `pageContent.js:154`).
- **R7G-5-02 · P0 · CONFIRMAT · `src/data/karpathyWikiCompiler.js` NO existix, i el pla demana «executar» un mètode que el propi codi i la pàgina declaren inexistent.** Evidència: `find`/`grep -ril karpathy` a `src/`: únics fitxers `src/sections/notes/memoriaOral.js:16-40`, `pageContent.js:654,713`, i proves. `memoriaOral.js:38-40`: «este mòdul no és eixe mètode, en fa només la part determinista» (sense xarxa, tòkens ni model). `pageContent.fediversity.test.js:502-507` exigix `Mètode Karpathy[^:]*: no existix` i `:814` «Mètode Karpathy amb models de llenguatge… no existix». El pla (línia 548) i el Llibre Mestre citen el fitxer com si fóra a `src/data/`. No hi ha compilador de «Cròniques» ni de «Tesaurus SKOS» en cap fitxer amb eixe nom (`grep -rn "skos" src` per a verificar, vegeu R7G-5-09). Risc: crear el fitxer per fer quadrar la frase i canviar la pàgina a «implementat» és una afirmació falsa (AI slop) i trencaria `pageContent.fediversity.test.js:502`. Proposta: o es construeix de veres el compilador (vegeu criteris d'acceptació R7G-5-11) o es retira «karpathyWikiCompiler.js» del pla/Llibre Mestre.

- `01:25` · **R7G-5-03 · P1 · CONFIRMAT · El kit F7 `261102_kit_codex_recuperacio_consumidor_ui` NO està integrat i no s'aplicaria net sobre HEAD `d79a0b530`.** Evidència: comprovació SHA-256 del `manifest.json` contra l'arbre viu: els 4 fitxers destí no existixen (`src/data/recuperacio/` absent, `xifratXatRecuperacioMagatzem.js` i `…MaterialMagatzem.js` absents); **19 de les 46 precondicions divergixen** (p. ex. `src/data/xifratXatMagatzem.js`, `backendPort.js`, `identitat.js`, `sanitize.js`, `pageContent.js`, `legalContent.js`) i 4 prerequisits no existixen (`supabase/xatRecuperacioLectura.js`, `xifratXatRecuperacioEstat.js`, `…Lectura.js`, `…Material.js`). Els 8 kits `261102_kit_codex_recuperacio_*` són al dipòsit però cap és al codi. El `LLEGEIX_ME.md` del kit mateix diu «no activa E2EE ni recuperacioSocial… deixa el muntatge visual a Gemini/Claude». Risc: `kit-carril.mjs apply` fallaria per CAS, o pitjor, algú relaxaria les precondicions. Proposta: no aplicar; demanar a Codex un kit re-basat sobre `d79a0b530` (cadena completa idea48→restauracio→diposit→rpc→observacio→cancel→material→consumidor) i exigir `check` net abans de qualsevol `apply`.
- **R7G-5-04 · P2 · CONFIRMAT · Estat de partida de les proves E2EE (executades).** `vitest run src/data/xifratXat src/data/xatMultimediaXifrat src/host.xifratApagat src/sections/xat --reporter=dot` → **190 fitxers, 2909 proves passen, 1 skip, 0 fallades** (104 s). Subconjunt F2a+F7 (`xifratXatAlta.seguretat`, `xifratXatRecuperacio.seguretat`, `…propietats.seguretat`) → 3 fitxers, 110 passen, 1 skip, 0,9 s. Matís honest: els mòduls F2a/F7 només es proven aïllats amb IndexedDB doble i `cripto` injectada; cap prova munta `creaAlta`/`reparteix` dins `Conversa.jsx` perquè no hi estan connectats (R7G-5-01). Proposta: l'acceptació no pot ser «les proves passen», sinó una prova d'integració que arranque el decorador `ambXifratXat` amb la bandera encesa en un test i envie un missatge real xifrat entre dos usuaris.
- **R7G-5-05 · P1 · CONFIRMAT · La pàgina afirma «zero fugida de dades» i «sobirania i privacitat» per a la traducció, però el transport real envia el text i l'IP del visitant a Apertium.** Evidència: `src/sections/text/pageContent.r10.js` (clau `aiInSystemTitle`: «traducció lliure integrada al navegador (zero tòkens i zero fugida de dades)»; `aiInSystem`: «Apertium… per garantir sobirania i privacitat») contra `src/data/traductorLliure.js:7-10`: «el navegador del visitant envia cada text al servei públic d'Apertium… que veu l'adreça IP del visitant». A més `src/data/traductor.js:3-6` admet que l'amfitrió WP pot usar **DeepL** amb clau. El text traduït és contingut públic de la pàgina (no dades d'usuari), però l'IP i el fet de llegir sí que ixen. Risc: afirmació de privacitat falsa en la pàgina de la candidatura NLnet. Proposta: reescriure a «el text públic de la pàgina s'envia al servei públic d'Apertium (o a DeepL si l'amfitrió ho configura); veu la teua IP; /traduccions ho detalla».

- `01:25` · **R7G-5-06 · P1 · CONFIRMAT · «Activació opt-in» no és el model dissenyat, i el servidor no té el commutador.** Evidència: `disseny_final_e2ee.md` (carpeta `261028_2330_p112_e2ee_claude`) §1 punt 6, DM-1: «esperar, mai en clar»; la fase F2b és una **cohort pilot** gestionada pel Mestre (`private.xat_cohort_e2ee`) i F2c una **activació general** (`private.xat_e2ee_general()` a cert) (línies 702-711). `grep` de `e2ee_general|e2ee_permes|e2ee_obligatori|cohort` a `supabase/migrations/*.sql`: **cap coincidència**; les úniques migracions E2EE són `2610290400_xat_e2ee_claus_i_sobres.sql` i `2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql`. Tampoc existix la taula `xat_cercles_recuperacio` del F7 en cap migració. Risc: IDEA-104 punt 2 demana «opt-in verificada», però el disseny aprovat pel Mestre és activació per cohort/general amb abast a **tota** conversa privada; un opt-in per persona fragmentaria els fils (un dels dos participants sense clau ⇒ safata local «esperant que X active»). Proposta: decidir i escriure ABANS de codificar: (a) cohort pilot gestionada pel Mestre (disseny) o (b) opt-in per persona amb fil xifrat només si **tots** els participants hi són; l'acceptació ha de dir quina.

- `01:25` · **R7G-5-06b · RECTIFICACIÓ de R7G-5-06 (error meu, verificat després) · P1 · CONFIRMAT.** Les afirmacions «cap coincidència» de R7G-5-06 i «tampoc existix `xat_cercles_recuperacio`» són FALSES: `supabase/migrations/2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql:131` crea `private.xat_cohort_e2ee`, `:427-433` defineix `private.xat_e2ee_permes(fil)` (permès si `configuracio.general` o **tots** els participants vigents són a la cohort) i `:238` rebutja amb `SDP-XAT-039`; les taules de recuperació (`xat_cercles_recuperacio`, `xat_peticions_recuperacio`) són a `2610290400_xat_e2ee_claus_i_sobres.sql`/`2610311800`. El que SÍ es manté: el commutador és **administratiu** (cohort i `general` els gestiona el Mestre amb SQL; `REVOKE ALL … FROM authenticated` a `:150`), no una preferència de la persona, i `xat_e2ee_general()` com a funció no existix (és la columna `general`). No he verificat si eixes migracions són aplicades a producció (memòria del torn: cadena pendent; **PLAUSIBLE** que no). Proposta d'acceptació: «opt-in» = que el Mestre afegisca la persona a la cohort pilot (disseny F2b) i la UI mostre l'estat; si es vol opt-in per persona cal una RPC `security definer` nova amb prova RLS.

- `01:27` · **R7G-5-07 · P1 · CONFIRMAT · El text de la UI de recuperació social (5 idiomes) contradiu el codi.** Evidència: `src/config/idiomes/{ca,es,en,eu,gl}.js:19` clau `perfil.confianca.targeta.subtitol`: «…si no tens les **12 paraules**… **una d'elles** pot ajudar-te a recuperar la clau amb un sol codi que dura **15 minuts**». Codi: la frase són **6 paraules** (`xifratXatAlta.js:3`, `:149`; el disseny §frase.explica diu «sis paraules»), `LLINDAR = 3` (`xifratXatRecuperacio.js:66`) i `MIN_AMICS = 3`, o siga calen **tres** amics, no «una d'elles», i amb 3 amics són els tres (3 de 3: si un falla, no hi ha recuperació); el codi SAS és per amic i de 6 xifres (`XIFRES_CODI`), amb caducitat de fins a 2 h (`MAX_CADUCITAT_MS = 7200000`). Risc: la persona creurà que un sol amic la salva; quan canvie de mòbil perdrà els xats. Hui queda tapat per la bandera apagada, però el text ja és als 5 diccionaris (paritat 3435/3435 claus). Proposta: reescriure als 5 idiomes («6 paraules», «tres de les teues persones de confiança», avís explícit que amb exactament 3, les 3 calen) i afegir prova que compare el número de paraules i `LLINDAR` amb el text.
- **R7G-5-08 · P1 · CONFIRMAT · Atribució a Karpathy: cap enllaç a font primària en el repo ni en la pàgina.** Evidència: `memoriaOral.js:16-17` cita «gist “LLM Wiki”, 2026-04-04» sense URL; `pageContent.js` (subtargeta 3 i «Pendent») no enllaça res; `grep gist.github.com/karpathy` a `src/` = 0. Verificació externa meua: una cerca web (només resums de tercers, no el gist mateix) situa el gist a `gist.github.com/karpathy/442a6bf555914893e9891c11519de94f`, publicat el 4-4-2026, amb capes font crua / wiki / esquema i `index.md` + `log.md`: l'atribució NO és inventada, però **no he pogut verificar el text original**. A més, el que es pren és «l'esquema», no el mètode (el gist pressuposa un LLM que manté la wiki; el repo ho fa determinista). Proposta: afegir l'URL del gist (SHA/data de lectura, com ja fa el mòdul amb OKF `SPEC.md`) al comentari i a la pàgina, i dir «inspirat en», no «Mètode Karpathy».
- **R7G-5-09 · P1 · CONFIRMAT · «Compilació de Cròniques i Tesaurus SKOS» no és un compilador: són dades estàtiques.** Evidència: `src/data/taxonomia/tesaurusDoctoralSocDePoble.js:6,1921+` conté camps `skosNotation` en un objecte JS escrit a mà (cap serialització SKOS/RDF `skos:Concept`, `skos:broader`); `grep -rn "skos:" src` no mostra cap exportador. Cap mòdul llig Cròniques i en genera `index.md`/`log.md`: `memoriaOral.js` (`indexOkf()`, `entradaLog()`) opera sobre UN relat de Memòria Oral. Risc: dir «Karpathy compila Cròniques i Tesaurus SKOS» seria fals. Proposta: separar tres tasques amb acceptació pròpia (vegeu R7G-5-11).
- **R7G-5-10 · P2 · CONFIRMAT · La secció d'IAs de `/page/fediversity` (5 idiomes, `pageContent.r10.js`) barreja fets verificables amb afirmacions operatives no verificables des del repo.** (a) **Verificat:** BM25 al navegador sense API externa (`iaiaLocal.js`: cap `fetch`); `grep` d'endpoints d'IA externa (openai, anthropic, generativelanguage, mistral, openrouter…) a `src/` només troba text de pàgines, privacitat i despeses, cap crida; memòria oral determinista (`memoriaOral.js`). (b) **No verificable:** Ollama a `127.0.0.1:11434` amb Qwen 2.5 Coder 14B, Qwen 3 8B i Gemma al Node 0: `curl` local a :11434 no respon (este Mac no és el Node 0) i cap fitxer del repo en fa ús (només el text); SuperWhisper/Whisper-Large-v3-Turbo/Parakeet, idem; «més de 33.000 proves» i «35 portes»: recompte estàtic meu de `it(`/`test(` en `*.test.*` = **27.081 en 2.154 fitxers** (no inclou `.each`; no he executat tota la bateria), `tooling/gates` té 72 fitxers però no he contrastat el «35». (c) **Contradicció amb el comportament real:** R7G-5-05 (Apertium veu l'IP; DeepL possible). (d) «cap IA publica sola / no AI deploys on its own» és una afirmació de procés; la memòria del torn registra que Gemini va desplegar un build des d'un arbre brut (261023): **PLAUSIBLE** que l'afirmació siga massa absoluta. (e) Per a les 4 llengües no catalanes, `aplicaDossierR10` substituïx el dossier llarg per un resum d'estat (`pageContent.r10.js:253`, només `ca` conserva el detall): la pàgina «en 5 llengües» és un resum, no el contingut complet. Paritat dels diccionaris d'UI (`src/config/idiomes`): **3435 claus idèntiques als 5, 0 faltes**; però la pàgina no s'hi emmagatzema. Proposta: marcar (b) com «operatiu, no auditat per codi», substituir xifres per les que emeta un script, i dir en cada llengua si el dossier complet només és en valencià.
- **R7G-5-11 · P1 · CONFIRMAT · Criteris d'acceptació verificables (lliurament).**
  **E2EE (IDEA-104 p.2), tots amb prova automàtica o evidència:** (E1) Decisió escrita: cohort pilot (disseny F2b) vs opt-in per persona (R7G-5-06b). (E2) Prova d'integració que muntatge `Conversa` amb `E2EE_ACTIU_PER_DEFECTE` simulat a `true` (el producte continua en `false` fins a la decisió del Mestre) i que dos usuaris amb IndexedDB (fake-indexeddb) s'envien un missatge i `servidor.xifrat_ct` no conté el text; el `text` del servidor és nul (disseny línia 336). (E3) `creaAlta` és cridada des d'una pantalla real i desa la clau com `extractable:false` (`xifratXatMagatzem.js:264`); prova que una clau extraïble es rebutja (`CLAU_EXTRAIBLE`). (E4) La frase de 6 paraules es mostra una sola vegada, es confirma (3 paraules de verificació) i `restauraAmbFrase` en un magatzem buit recupera la identitat. (E5) Shamir: ≥1 prova de punta a punta amb 3 amics reals en 3 magatzems distints, `recuperaRk` correcta, i amb 2 amics **falla**; cap fragment ni RK en `localStorage`/`sessionStorage`/logs. (E6) Text de UI = codi (R7G-5-07), prova de paritat en 5 idiomes. (E7) Missatges antics en clar: la divisòria «Des d'ací, xifrat d'extrem a extrem» apareix i l'avís diu que l'historial anterior continua al servidor + 30 dies fins que s'esborre (A3 del disseny). (E8) Multidispositiu: un segon aparell només entra per frase o per 3 amics; no hi ha sincronització de claus entre aparells; ho diu la UI. (E9) Evidència que NO és prova real: mai afirmar «demostrat» sense un aparell/navegador real (la pròpia documentació admet que `fake-indexeddb` no certifica persistència física).
  **Karpathy (IDEA-104 p.4):** (K1) Decidir el nom: o es crea `src/data/karpathyWikiCompiler.js` de veres, o s'elimina del pla. (K2) Si es crea: funció pura `compilaWiki(fonts) → {pagines, index.md, log.md}` determinista (mateixa entrada ⇒ mateixa eixida, `ara` injectat), sense xarxa, que NO modifica les fonts, amb prova de «font crua intacta» i prova d'idempotència. (K3) Cròniques: només si llegix un format real (indicar quin fitxer/taula); (K4) SKOS: serialització amb `skos:Concept`/`prefLabel`/`broader` validada contra un parser Turtle o JSON-LD real. (K5) La pàgina diu «inspirat en el gist de Karpathy (URL)» i la prova `pageContent.fediversity.test.js:502-507,814` s'actualitza **amb el codi**, no abans. (K6) Les 5 llengües: ca/es/en/eu/gl per a la nova secció, amb la mateixa estructura (prova de paritat com a `pageContent.r10.test.js`).
- **R7G-5-12 · P2 · PLAUSIBLE · Revisió criptogràfica d'alt nivell (llegida, no auditoria de primitives).** (1) **Claus:** IndexedDB `sdp_xat_claus_v1`, CryptoKey no extraïbles; a Chromium/Gecko els bytes queden en clar al disc i un XSS les pot usar com a oracle (límit admès a `xifratXatMagatzem.js:89-92` i disseny §2.3). (2) **Distribució Shamir:** secret = `RK` (no la privada), 33 B per fragment, GF(2⁸) 0x11B, avals HPKE a la clau DH de cada amic, emmagatzemats al servidor; custodis = els amics. **Amenaça no coberta:** 3 amics que col·ludixen + la còpia xifrada del servidor llegeixen tota la història; el SAS i el codi de tornada protegeixen contra el *servidor* impersonant, no contra els amics. (3) **Disponibilitat:** amb n=3 és 3 de 3; el sostre d'alliberaments és 8 (`MAX_ALLIBERAMENTS_VALIDS`). (4) **Metadades que veu el servidor:** participants, temps, mida farcida (Padmé), nombre/mida d'adjunts, fil, època, ordre, qui demana recuperació i quan (disseny §2.4/«Bytes dels adjunts»). (5) **Cap secret cap avant** dins d'una època (disseny línia 135). (6) **Frase 66 bits + PBKDF2-600.000:** he refet el càlcul d'ordre de magnitud (≈10⁴ intents/s/GPU ⇒ ~10⁷-10⁸ anys): coherent amb el disseny, però PBKDF2 no és memòria-dura; depèn que la còpia xifrada no siga mai exposada. (7) **Lliurament de codi:** qui desplega a Firebase pot servir un client que llija el clar (fora d'abast declarat); la pàgina ha de dir-ho. Marcat PLAUSIBLE perquè no he revisat les primitives línia per línia; les proves de vectors (`xifratXatCripto.vectors.json`) passen.

`01:27` · **Veredicte del carril 5:** IDEA-104 punts 2 i 4 **NO es poden donar per «100 % completats i demostrats» ara mateix.** L'E2EE és una biblioteca sòlida i ben provada (190 fitxers, 2909 proves verdes) però **desconnectada**: `E2EE_ACTIU_PER_DEFECTE=false`, F2a (`xifratXatAlta`) i F7 (`xifratXatRecuperacio`) no tenen cap importador en codi de producció, el kit de consumidor F7 no s'aplica sobre `d79a0b530` (19 de 46 precondicions divergixen) i el «opt-in» demanat no és el model dissenyat (cohort administrativa). El text de UI de recuperació diu «12 paraules» i «una d'elles», i el codi exigix 6 paraules i 3 amics. Quant a Karpathy, `karpathyWikiCompiler.js` **no existix**, `memoriaOral.js` és un estructurador determinista d'un sol relat que declara no ser el mètode, no hi ha compilador de Cròniques ni exportador SKOS, i la pàgina i la seua prova diuen explícitament «no existix»; l'atribució és real però sense enllaç. Recomanació: no canviar la pàgina a «fet» fins que s'acompleixin E1-E9 i K1-K6 (R7G-5-11), i corregir ja R7G-5-05 i R7G-5-07, que són afirmacions falses d'ara mateix. Limitació: no he executat la bateria sencera ni auditat primitives línia per línia.

- `01:28` · **Contraauditoria del carril 5:** R7G-5-01 REBAIXADA a P1 (fets certs: `config/xifratXat.js:20` fals, `host.js:86` curtcircuita, cap importador no-test d'`xifratXatAlta`/`xifratXatRecuperacio`; però l'apagat és una decisió de disseny amb data de topall, no un defecte: el problema és només l'afirmació «100 % demostrat» del pla) · R7G-5-02 REBAIXADA a P1 (el fitxer no existix i `memoriaOral.js:16-40` i `pageContent.fediversity.test.js:507,814` ho declaren honestament; és objectiu del pla sense complir, no inconsistència del codi) · R7G-5-03 SOSTINGUDA (`git apply --check` del `canvis.patch` del kit `261102_kit_codex_recuperacio_consumidor_ui` falla: `xifratXatRecuperacioMagatzem.js` i `xifratXatRecuperacioMaterialMagatzem.js` no existixen) · R7G-5-05 SOSTINGUDA (títol `pageContent.r10.js:87` «zero fugida de dades» vs `traductorLliure.js:7-8`: el text ix cap a Apertium, que veu l'IP) · R7G-5-06 REBAIXADA a P2 (l'autora mateixa en va rectificar mitja a R7G-5-06b; la migració 2610311800 ja té `xat_cohort_e2ee`; és divergència de model per decidir, no defecte) · R7G-5-07 SOSTINGUDA (`perfil.confianca.targeta.subtitol` línia 19 als 5 idiomes diu «12 paraules» i «una d'elles»; `xifratXatAlta.js:3` és frase de 6 paraules i `xifratXatRecuperacio.js:66` `LLINDAR = 3`) · R7G-5-08 REBAIXADA a P2 (atribució amb títol i data sense URL: falta de citació, no risc; no verificat el gist en xarxa) · R7G-5-09 SOSTINGUDA com a P1 (no he trobat cap compilador; el tesaurus són dades escrites a mà, verificat només per la lectura d'àncores, no per execució) · R7G-5-11 SOSTINGUDA (criteris E1-E9 i K1-K6 presents a l'informe, línies 2264-2265; són proposta, no troballa). Cap refutada del tot; el que sobreviu intacte és el desfasament entre text d'UI, privacitat de la traducció i el kit F7.

<!-- R7G:S5:FI -->

### R7G-6 · IDEA-106 i IDEA-107 (corpus cultural, base dialectal i joc del micro)

- `01:22` · **R7G-6-01 · P0 · CONFIRMAT · El tractor «mou i allibera espai» destruiria l'única còpia.** Evidència: Llibre Mestre IDEA-106 (línia 385, «el mou al Mac mini M4, verifica el SHA-256 i allibera l'espai del MacBook»). `_cultura_de_poble/` és fora del git (`git ls-files | grep ^_cultura` = 0) i el *Tresor* és el únic PDF (9,58 MB, 1086 pàgs. per `mdls`). Risc: pèrdua irreversible si el SHA es compara amb una còpia corrupta o el disc del destí falla; el «3-2-1» declarat no s'implementa en cap tractor (`tooling/cultura/` no existix). Proposta: copiar, no moure; SHA a l'origen i relectura al destí; 2a còpia independent; **esborrar només per decisió humana**, mai automàtic (esquema a `idea-106-107_esquema_i_riscos.md` §3).
- **R7G-6-02 · P1 · PLAUSIBLE · Llicències no verificades: accés obert ≠ dret a redistribuir, ingerir amb IA ni pujar a NotebookLM.** Evidència: l'ODT només enllaça portals de Cervantes Virtual/IAC/AVL; el *Tresor* ve d'un portal de biblioteca digital. DCVB (IEC/Moll) i DNV (AVL) **no hi són**. No he pogut verificar cap llicència; cal comprovar condicions d'ús de cada font. Risc: la pujada a Google Drive/NotebookLM és una transferència a un tercer, i la publicació de lemes/fraseologia a la plataforma és redistribució. Proposta: camps `llicencia_estat`/`us_permes` per font i per fila, per defecte «estudi privat»; res públic fins a verificació amb evidència.
- **R7G-6-03 · P1 · CONFIRMAT · Cap migració ni esquema existix; l'IDEA-104/106/107 parlen de taules «planificades» com si foren estat.** Evidència: `grep` de `corpus_dialectal_valencia`/`biblioteca_cultural_poble` només troba Llibre Mestre, LEDGER i acta; cap `.sql` a `supabase/migrations` ni `tooling/node0`. Risc: marcar-ho com a fet. Proposta: esbós a l'esquema §2 amb font/citació/llicència per fila; marcar l'IDEA com a «disseny».
- **R7G-6-04 · P1 · CONFIRMAT · Joc del micro: veu de tercer no registrat, risc RGPD art. 9 i perfilat.** Evidència: IDEA-107 (línia 386) «passa-li el micro a un amic… li endevine el poble… entrenar i afinar els pesos quan l'amic confirma». Risc: la veu usada per identificar és potencialment biomètrica; inferir origen és perfilat; l'autoaprenentatge reutilitza la dada; menors; estereotip. La pàgina pública ja afirma Whisper local només per a dictat (`src/sections/text/pageContent.r10.js:91`), no per a tercers. Proposta: consentiment explícit del convidat, Whisper local, res guardat per defecte, majors d'edat, **segon consentiment separat** per a l'entrenament i només amb trets agregats.
- **R7G-6-05 · P2 · PLAUSIBLE · «Endevinar el poble en 20 s» no és realista.** Evidència: afirmació de l'IDEA-107, sense mesura ni corpus d'avaluació. Risc: promesa falsa i errors visibles. Proposta: predir bloc dialectal/comarca amb probabilitat («aposte per…, 41 %») i un qüestionari lèxic de 3 paraules com a mètode principal; avaluar abans d'anunciar.
- **R7G-6-06 · P2 · CONFIRMAT · Dependències inventades o inexistents.** Evidència: `tooling/cultura/` i `biblioteca_gil_albert_canelobre/` no existixen; «600 fonts» de NotebookLM i «sincronització automàtica Drive» sense cap script; DCVB absent. Risc: el pla es presenta com a ordre en curs. Proposta: llistar-ho com a pendent; no declarar «demostrat».
- **R7G-6-07 · P2 · PLAUSIBLE · Ingesta OCR/estructurada de 1086 pàgines sense control de qualitat.** Evidència: el PDF és d'«PDFCreator 0.9.9» (no he obert el contingut). Risc: lemes i variants amb OCR dolent contaminen les IAs. Proposta: `ocr_confianca`, `revisat` i `atestacio` ('atestat' vs 'inferit') a l'esquema.

`01:22` · **Veredicte del carril 6:** IDEA-106 i IDEA-107 són només disseny, sense cap tractor, taula ni dada ingerida. Els riscos reals són l'esborrat automàtic de l'única còpia (P0), les llicències no verificades i la pujada a Google, i la veu d'un convidat sense consentiment. Són viables si es copia sense esborrar, es marca la llicència per fila i el joc prediu només bloc/comarca amb consentiment. Esquema i riscos: `_investigacio_ia_de_poble/261106_claude_r7_gauntlet/idea-106-107_esquema_i_riscos.md`. Cap pegat; res provat executant codi.

- `01:22` · **Contraauditoria del carril 6:** R7G-6-01 REBAIXADA a P2 (no és P0: el mateix IDEA-106, línia 385, ja exigix verificar el SHA-256 abans d'alliberar espai i declara resguard 3-2-1 amb Mac mini + PostgreSQL + Google Drive/NotebookLM; `tooling/cultura` no existix, per tant no hi ha cap tractor que puga destruir res; resta el risc de disseny, ja que «mou» i «allibera» no exigix còpia independent ni relectura, i la verificació SHA pot comparar només origen i destí) · R7G-6-02 SOSTINGUDA com a P1 PLAUSIBLE (l'ODT només enllaça Cervantes Virtual, IAC i AVL, sense DCVB ni cap llicència; IDEA-106 sincronitza amb Drive i NotebookLM, és a dir, a tercers, sense comprovar drets; no refutable, però és disseny no implementat, i el perill és real només en executar-lo) · R7G-6-03 REBAIXADA a P2 (fet CONFIRMAT: cap .sql ni codi defineix `corpus_dialectal_valencia` ni `biblioteca_cultural_poble`, només Llibre Mestre, LEDGER, acta i este informe; però IDEA-107 és «PLANIFICAT» i no afirma que existisquen, de manera que és una etiqueta de disseny, no una afirmació falsa) · R7G-6-04 REBAIXADA a P2 (CONFIRMAT que IDEA-107, línia 386, planeja entrenar amb la confirmació de l'amic convidat i que el pla no preveu consentiment; però l'art. 9 RGPD no s'aplica de plano: inferir comarca per l'accent no és categoria especial ni identificació biomètrica; es manté com a obligació de consentiment i informació (art. 6, 7 i 13), veu de tercer, majors d'edat i res guardat per defecte. L'afirmació sobre `pageContent.r10.js:91` és fluixa: el text sobre SuperWhisper és a les línies ~88-90 i parla del dictat propi, no del joc)

<!-- R7G:S6:FI -->

### R7G-9 · IDEA-100 / P2-06 (Arbre genealògic i malnoms, /app/genealogia)

- `01:27` · **R7G-9-01 · P1 · CONFIRMAT · El «Arbre Genealògic» del COMMIT R6 és només una targeta: no hi ha cap espai `/app/genealogia`, ni mòdul, ni migració, ni codi GEDCOM.** Evidència: `src/sections/plugins/registrePlugins.js:343-355` (`obrir: null`), `src/sections/profile/aplicacions.js:97-104` (`estat: 'pendent'`), cap directori `src/apps/genealogia` (només hi ha `bar, comu, gestoria, lector, nevera, plataforma, salut`), cap migració que nomene genealogia a `supabase/migrations`, cap dependència de SQLite/GEDCOM/PDF a `package.json`. El que sí que hi ha: vinyeta, text didàctic (`presentacioPlugins.js:156-169`) i un trinquet de pes apujat «per l'Arbre Genealògic» (`pesDelNucli.test.js:58-62`). Risc: tot el Carril 9 és construcció des de zero; i el que es diu en públic va per davant del codi (vegeu R7G-9-02). Proposta: Gemini no ha de «completar» res: ha de crear l'App sencera amb el contracte de la plataforma (manifest `sdp.app.v1` com `src/apps/lector/manifest.js`, `carrega` darrere d'un literal `VITE_SDP_APP_GENEALOGIA`, `actiuPerDefecte: false`, `entorn: 'desenvolupament'`).

- `01:27` · **R7G-9-02 · P1 · CONFIRMAT · Afirmacions públiques sense codi darrere (evidència inventada de funcionalitat), a una pàgina de candidatura.** Evidència: `src/sections/text/pageContent.r10.js:122` (i les versions en/eu/gl: `:149`, `:176`, `:203`) diu que les persones majors dicten històries cap a l'Arbre Genealògic amb transcripció local amb SuperWhisper/Whisper Large-v3-Turbo/Parakeet; `grep` de `Whisper|SpeechRecognition` a `src/` fora d'aquest text i de proves: 0 resultats. SuperWhisper és una aplicació de Mac, no una capacitat del navegador ni de l'app mòbil (PLAUSIBLE: cal comprovar-ho si algú vol vendre-ho com a producte). Risc: pàgina `/page/fediversity` de la candidatura NLnet descriu com a existent el que no existix. Proposta: o s'esmena el text («previst, no construït») o el kit de Gemini el fa cert i demostrable. Si la veu va per Web Speech API del navegador, l'àudio pot anar als servidors del fabricant del navegador (PLAUSIBLE, cal provar-ho a Chrome i Safari) i xoca amb «no s'envia enlloc» (`presentacioPlugins.js:168`).

- `01:27` · **R7G-9-03 · P1 · CONFIRMAT · La CSP actual impedix instanciar WebAssembly: SQLite WASM no arrancarà.** Evidència: `firebase.json:39` té `script-src 'self'` i cap `'wasm-unsafe-eval'` (grep a `firebase.json`, `index.html`, `src`, `tooling`, `public`: 0 resultats); cap fitxer `.wasm` ni `WebAssembly` a `src/` ni `public/` (només una prova, `src/data/identitatDual.guarda.test.js`). Per la CSP3, compilar WASM sense `'wasm-unsafe-eval'` o `'unsafe-eval'` falla (sé la regla de l'especificació; no ho he vist al navegador: PLAUSIBLE en l'efecte, CONFIRMAT en la configuració). Risc: l'app es veu bé en proves de Vitest i es trenca en producció; i afegir `'unsafe-eval'` seria un retrocés de seguretat. Proposta: afegir només `'wasm-unsafe-eval'` a `script-src` (no `'unsafe-eval'`), amb prova de capçaleres a `tests/` i passada pel guardià `sdp-vigilant-tellado`; o, millor, no usar WASM (R7G-9-05).

- `01:27` · **R7G-9-04 · P1 · CONFIRMAT · No hi ha COOP/COEP, i posar-los trencaria els iframes externs.** Evidència: cap `Cross-Origin-Opener-Policy`/`Embedder-Policy` a `firebase.json` (grep a `firebase.json`, `index.html`, `vite.config.js`, `public`, `src`, `tooling`: 0); `firebase.json:39` té `frame-src 'self' https:` i `img-src ... https:`; hi ha `<iframe>` o incrustacions a `src/sections/mur/MurSection.jsx`, `src/sections/multimedia/DetallArxiuLocal.jsx` i `src/sections/disseny/cataleg/detalls/EspecimenMediaExterna.jsx`. El VFS `opfs` de SQLite necessita `SharedArrayBuffer`, i això exigix aïllament d'origen creuat (COOP `same-origin` + COEP `require-corp`); amb COEP, els iframes i les imatges d'altres orígens (À Punt, YouTube, mitjans externs) només carreguen si porten CORP/CORS: es trencarien. Això ho conec del disseny de SQLite i de la plataforma web (PLAUSIBLE per als proveïdors concrets: cal provar-ho amb À Punt i YouTube). Risc: arreglar l'arbre trenca el Mur, /multimedia i les notícies; i la capçalera `**` de Firebase s'aplica a tot el lloc. Proposta: PROHIBIR COOP/COEP globals. Si es vol SQLite, el VFS `opfs-sahpool`, que no necessita `SharedArrayBuffer`; i sense OPFS, el magatzem actual (R7G-9-05).

- `01:27` · **R7G-9-05 · P1 · CONFIRMAT · La plataforma ja té magatzem local amb llista blanca, bloqueig d'escriptora i `persist()`: el «SQLite WASM en un Worker» el duplica i en perd les garanties.** Evidència: `src/utils/magatzemLocal.js:1-30` (IndexedDB, llista blanca per store, Web Locks, BroadcastChannel, `persistent:false` declarat), `:480` (`storage.persist()`), `src/apps/salut/magatzem.js:1-20` (patró d'ús, «és l'ÚNIC fitxer de Salut que en parla») i `src/apps/salut/privacitat.test.js` (vigila fronteres i xarxa). Risc: un segon motor d'emmagatzematge sense llista blanca ni bloqueig d'escriptora, més ~1 MB de WASM; el trinquet del paquet d'entrada ja es va apujar «a posta» (`src/apps/plataforma/pesDelNucli.test.js:58-62`, `SOSTRE_DEL_TROS_D_ENTRADA = 1690000`). Proposta: IDB amb `creaMagatzemIdb` (un arbre són centenars de persones, no milions de files); si Gemini defén SQLite, que ho justifique amb una consulta que IDB no puga fer, que el WASM siga un tros mandrós fora de l'entrada, que NO s'apuje el trinquet i que mesure el pes del tros (kB gzip) a l'informe.

- `01:27` · **R7G-9-06 · P1 · CONFIRMAT · El contracte de dades personals de la plataforma no té categoria per a dades de tercers: `genealogia` declararia `false`.** Evidència: `src/apps/plataforma/manifestApp.js:59` (`DADES_PERSONALS = [false, 'salut', 'financeres']`, validat a `:287`) i `src/apps/plataforma/registreApps.js:43` (`DADES_RESERVADES = { gestoria, salut }`); `interruptors.js:80` aplica la guarda de «document propi» segons eixe valor. Un arbre guarda noms, filiacions, dates, causes de mort i parròquies de persones que no són l'usuari, algunes vives i menors. Risc: la plataforma l'etiquetaria com a app sense dades personals i no hi aplicaria cap guarda. Proposta: afegir `'familia'` (nom a decidir) a `DADES_PERSONALS` i `DADES_RESERVADES.genealogia`, amb prova a `manifestApp.test.js`/`registreApps.test.js`, i un `privacitat.test.js` clonat del de Salut (cap xarxa, cap telemetria, cap model d'IA, frontera d'importacions, build de producció sense el literal).

- `01:27` · **R7G-9-07 · P1 · CONFIRMAT · L'entrevista amb la IAIA xoca amb la promesa de privacitat, i el text ja contradiu l'especificació.** Evidència: `presentacioPlugins.js:168` («Tot es guarda en este dispositiu i no s'envia enlloc»); `presentacioPlugins.js:160` diu «tres o quatre preguntes cada vegada», però IDEA-100 mana 1 sola pregunta per torn (Llibre Mestre, línia 379). Si la IAIA és un model remot (no s'ha vist cap crida a model al codi d'esta funció: PLAUSIBLE que ho siga), cada resposta envia noms de familiars a un tercer. Risc: encarregat del tractament no declarat; text fals. Proposta: decidir i documentar una de dues vies: (a) entrevista determinista de guió tancat al client (com `src/sections/notes/memoriaOral.js`, que declara «sense model de llenguatge»), o (b) model remot, amb avís explícit abans de la primera pregunta, sense identificadors dels vius, i canvi del text de `:168`. Corregir `:160` a «una pregunta cada vegada».

- `01:27` · **R7G-9-08 · P1 · PLAUSIBLE · RGPD/LOPDGDD: l'exempció domèstica només cobreix l'ús local; compartir branques i l'arbre comunitari la trenquen.** Evidència: no hi ha codi, és un risc de disseny: el pla (línia 523) parla de «connectar amb l'arbre comunitari quan el veí ho autoritze». L'autoritza el veí, no els familiars vius que hi apareixen (ni els menors: LOPDGDD art. 7 fixa els 14 anys per al consentiment; cal verificar-ho). Hi ha categories especials (art. 9 RGPD): els registres parroquials revelen religió, les causes de mort la salut, i el tema «Guerra i postguerra» de `memoriaOral.js:248` l'afiliació política. Proposta (criteri d'acceptació, vegeu la llista final): cada persona porta `viu | difunt | desconegut`; per defecte és «viu» si no hi ha data de defunció i va nàixer fa menys de 100 anys; els vius i els menors no entren mai a cap branca compartida ni a cap exportació sense la marca explícita de qui la desa; cap dada d'un viu surt del dispositiu per defecte; revisió jurídica abans de l'obertura (el Mestre l'ha de decidir).

- `01:27` · **R7G-9-09 · P1 · PLAUSIBLE · Compartició entre veïns: no hi ha model de dades, control d'accés ni revocació; i el creuament de branques revela parentius que ningú no ha autoritzat.** Evidència: cap migració ni política RLS per a genealogia (`supabase/migrations`, 0 resultats). Dos veïns que comparteixen branques deixen veure el graf unit: fills no reconeguts, adopcions, filiacions ocultes o la causa d'una mort de tercers. Proposta: una taula de concessions per persona (no per arbre) amb propietari, destinatari, abast (`lectura`), data i `revocada_a`; RLS que comprova la concessió; revocar elimina la còpia remota en cascada (no n'hi ha cap còpia fora del propietari, el destinatari només llig); unir arbres és una proposta que cada part ha d'acceptar, mai automàtica; `LOPDGDD` art. 3 (difunts): canal perquè un hereu o familiar sol·licite rectificar o retirar una fitxa (PLAUSIBLE: cal verificar-ho amb text legal). La migració va a l'ordre del Mestre, no s'aplica.

- `01:27` · **R7G-9-10 · P2 · PLAUSIBLE · Malnoms: poden ser insults hereditaris; la moderació existix però no està connectada.** Evidència: hi ha infraestructura de moderació (`supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql`); `memoriaOral.js:213-221` tracta els malnoms com a tema, no com a dades. Els motes sovint remeten a defectes físics, filiació («el fill de...») o ofenses. Risc: un malnom publicat a l'arbre comunitari identifica una família sencera. Proposta: el malnom viu al magatzem local sense moderació; només en passar a compartit/públic passa per la mateixa denúncia i bloqueig que la resta, amb el camp «ús: afectuós / pejoratiu / no sé» i sense publicar mai el dels vius sense la seua aprovació.

- `01:27` · **R7G-9-11 · P1 · CONFIRMAT · Les esqueles no existixen al repositori: l'origen de les dades no està definit.** Evidència: `grep -ril "esquela\|necrol"` a `src`, `supabase/migrations` i `tooling`: 0 resultats; només el pla/Llibre Mestre les anomenen. Si venen de webs de tanatoris o de premsa (PLAUSIBLE, no especificat), són anuncis pagats per les famílies, amb dret d'autor o de base de dades del mitjà, condicions d'ús que sovint prohibixen l'extracció automàtica, i **nomenen familiars vius** («els seus fills..., la seua neta...»): dades de tercers vius afegides sense consentiment. Proposta: cap scraping; entrada manual per la persona (enganxar el text o l'enllaç), extracció local de noms, i cada nom extret de l'esquela entra com a «proposta» no confirmada (mai com a vincle). Si el Mestre vol una font automàtica, que primer es documenten les condicions d'ús de cada web.

- `01:27` · **R7G-9-12 · P2 · PLAUSIBLE · Fonts externes (PARES, registres civils i parroquials, censos, FamilySearch): condicions d'ús, accés restringit i risc d'extracció.** Evidència: no hi ha codi; no he pogut llegir les condicions d'ús de cap d'elles (sense xarxa permesa a este carril), per això va com a PLAUSIBLE: cal comprovar-ho a cada font abans que Gemini escriga res. Els registres civils tenen terminis d'accés restringit per a persones vives o mortes fa poc, i els arxius eclesiàstics tenen les seues pròpies normes de reproducció. Proposta: només enllaços de cita (URL + signatura + data de consulta) i transcripció manual per l'usuari; cap crawler, cap API sense revisar les condicions; cada cita porta `font`, `data_de_consulta` i `qualitat` (original / derivada / testimoni oral).

- `01:28` · **R7G-9-13 · P1 · CONFIRMAT · Detector de contradiccions: no hi ha codi, i la formulació «validador de dates pare/fill» té forats; he escrit un oracle de referència amb 12 casos.** Evidència: matriu executada i verificada (12/12) a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261106_claude_r7_gauntlet/l9_matriu_contradiccions.mjs` (la primera versió va fallar en el cas d'intervals solapats: un detector ingenu hauria cridat «revisar» on res no es pot afirmar). Forats que ha de cobrir el kit: **(a)** dates desconegudes: SENSE VEREDICTE, mai 0 ni contradicció; **(b)** dates aproximades (`ABT`, `BEF`, `AFT`, `BET..AND`) com a INTERVALS: només «contradicció» si és impossible per a tot l'interval; **(c)** adopció, acolliment i família reconstituïda: els marges biològics no s'apliquen a les arestes no biològiques; **(d)** parelles del mateix sexe: no deduir el rol del sexe (usar «progenitor»), de manera que cap validador no suposa pare+mare; **(e)** fill pòstum: marge d'uns 300 dies després de la mort del pare (PLAUSIBLE, cal verificar el Codi Civil), mai després de la mort de la mare; **(f)** distingir CONTRADICCIÓ (impossible: progenitor nascut després del fill, mare morta abans del naixement, mare <12) de «revisar» (improbable: mare <15 o >55, pare >80). Els marges 12/15/55/60/80 són una proposta meua, no una dada demogràfica verificada: han d'anar a una constant documentada i editable.

- `01:28` · **R7G-9-14 · P1 · PLAUSIBLE · Regla anti-al·lucinació: cal fer-la complir al codi, no al text.** Evidència: només hi ha documentació (`presentacioPlugins.js:163-164`, pla línia 522); el precedent del repositori que sí que ho fa és `src/sections/notes/memoriaOral.js` (vocabulari tancat, extracció determinista, resum amb frases del mateix relat, la fitxa naix com a `draft` i només una persona la promou amb `marcaRevisioHumana()`). Proposta de mecanismes verificables: **(1)** un vincle (progenitor→fill, parella) només es crea amb `origen` = `torn` (id del torn + citació literal que és una subcadena de la resposta de la persona) o `acceptat_per_persona`; **(2)** les coincidències de cognom, esqueles, fotos i fonts externes només produïxen «propostes», sense aresta; **(3)** l'estat de certesa el calcula el codi, no el model: CONFIRMAT exigix cita de font o dita directa; APROXIMAT exigix un identificador de regla de derivació i es mostra com a interval; FALTA CONFIRMAR no té valor; CONTRADICCIÓ ve del validador; **(4)** si hi ha model, la seua sortida passa per un esquema tancat i es rebutja qualsevol nom, data o poble que no aparega en el text de l'usuari; **(5)** prova adversària: transcripció amb dos «Ferrer» no emparentats i una esquela amb el mateix cognom ⇒ zero arestes noves.

- `01:28` · **R7G-9-15 · P2 · PLAUSIBLE · Fidelitat GEDCOM 7.0: el model de 4 estats no cap al format, i l'exportació ha d'estar pensada per no perdre ni filtrar.** Evidència: no hi ha codi; això és el que sé del format i NO he pogut contrastar amb el text de l'especificació (sense xarxa): GEDCOM 7.0 és només UTF-8; no té `CONC` (línies llargues amb `CONT`); les dates admeten `ABT`, `BEF`, `AFT`, `BET..AND`; hi ha `NICK` i `PEDI` (adoptiu, acolliment); `RESN` per a privacitat; els rols dels cònjuges no impliquen sexe; les etiquetes pròpies han de declarar-se a la capçalera (`SCHMA`). Les quatre certeses no tenen etiqueta nativa (la més pròxima, `QUAY` de les cites, va de 0 a 3): han d'anar en extensions declarades o es perden en un viatge d'anada i tornada. El «malnom de la casa» és de la família o del lloc, no un `NICK` personal. Proposta: **(1)** exportació per defecte amb els vius i menors ocults o amb `RESN PRIVACY` i sense dades; **(2)** viatge ida i tornada en una prova amb les mostres oficials de la distribució 7.0 (a obtindre; no verificat) i amb un arbre propi amb caràcters `ç l·l à ò ñ ŀ` i emojis; **(3)** una còpia de seguretat pròpia en JSON amb estats i proveniència, perquè el GEDCOM no basta; **(4)** el PDF sense biblioteca nova (full d'estil d'impressió) mentre `package.json` no tinga cap dependència de PDF; `tooling/pdf/render_pdf.sh` és d'ús de desenvolupament, no del client.

- `01:28` · **R7G-9-16 · P2 · PLAUSIBLE · Accessibilitat de l'arbre visual: la graella G1→G4 amb línies no és navegable ni llegible per a un lector de pantalla.** Evidència: no hi ha codi; el pla (línia 522) només defineix l'aspecte. Proposta de criteris: patró ARIA `tree` (`role="tree"`, `treeitem`, `aria-level`, `aria-expanded`, `aria-setsize/posinset`) amb fletxes, Inici/Fi, Intro; una vista alternativa en llista indentada («Besavis → Iaios → ...») com a vista per defecte per a lector de pantalla; el parentiu es diu en text («fill de», «germana de»), no per línies; les 4 certeses amb text i icona, no només color; objectius tàctils i el límit de 58 px de la porta `tooling/gates/01_porta_pedra_seca_58px.mjs` i `prefers-reduced-motion`. Avís de model: G1→G4 fixa quatre generacions i barreja «germans/fills» a G4; no cobrix col·laterals, ni parentius que es repetixen (cosins casats), ni més de 4 generacions: necessita una vista ancorada en una persona, no una graella fixa.

- `01:28` · **R7G-9-17 · P2 · CONFIRMAT · i18n: no hi ha cap clau de genealogia als 5 diccionaris, i el text del plugin està escrit només en català.** Evidència: `grep -c genealog src/config/idiomes/{ca,es,en,eu,gl}.js` = 0 a tots cinc; `src/sections/plugins/presentacioPlugins.js:156-169` és text català cablejat. Els parentius no són traducció literal (PLAUSIBLE, convé revisió nativa): en èuscar els germans tenen noms diferents segons el sexe de qui parla, i «iaio/avi/abuelo/aitona/avó» varien; «malnom» ≠ «apodo» ≠ «alcume» ≠ «ezizena». Proposta: tots els literals a `src/config/idiomes/` en `ca, es, en, eu, gl`, el vocabulari de parentiu com a taula de dades amb la regla de gènere, dates formatades amb `Intl`, i prova de paritat de claus (la plataforma ja en té per a altres àmbits).

- `01:28` · **R7G-9-18 · P2 · PLAUSIBLE · Pèrdua de dades: la memòria d'una família no pot dependre d'una base de dades que el navegador pot esborrar.** Evidència: `src/utils/magatzemLocal.js:9-14` (sense IndexedDB treballa en memòria i només ho diu amb `persistent:false`) i `:480` (`persist()` existix). Safari/iOS pot expulsar emmagatzematge de pàgines poc visitades (PLAUSIBLE, cal provar-ho). Proposta: demanar `persist()` en el primer desat, avisar visiblement si és `false`, recordatori de còpia de seguretat JSON (R7G-9-15) i fitxer descarregable abans de «Esborra-ho tot».

- `01:28` · **R7G-9-19 · P3 · CONFIRMAT · Pes i vocabulari.** Evidència: `public/assets/ui/plugins/genealogia_vinyeta.webp` = 1.028.400 B contra `salut_vinyeta.webp` = 102.906 B i `rebost_vinyeta.webp` = 110.090 B (10 vegades més pesada que les germanes; compte amb el límit de pes per comissió). Al pla, les línies 521 i 522 usen la paraula vetada pel Mestre (el femení de «mas»); el text del codi que ho comenta, `aplicacions.js:99` i `registrePlugins.js`, diu «masos», que és correcte. Proposta: reexportar la vinyeta a ≤ 150 kB i corregir el pla a «masos»/«el Mas».

- `01:28` · **Correccions a les meues entrades anteriors (R7G-9-17 i R7G-9-19).** No he trobat cap prova de paritat de claus entre els 5 diccionaris `src/config/idiomes/` (no l'he buscada a fons: PLAUSIBLE): el kit l'ha de portar si no n'hi ha. I el «masos» és a `src/sections/profile/aplicacions.js:100`, no al `:99`.

`01:28` · **Criteris d'acceptació verificables per al kit de Gemini (IDEA-100 / P2-06):**

1. **Contracte de plataforma:** `src/apps/genealogia/manifest.js` `sdp.app.v1`, `carrega` darrere del literal `VITE_SDP_APP_GENEALOGIA`, `actiuPerDefecte: false`, `entorn: 'desenvolupament'`; `DADES_PERSONALS` amb una categoria nova i `DADES_RESERVADES.genealogia`; proves de manifest i de registre en verd (R7G-9-01, -06).
2. **Frontera de privacitat:** `privacitat.test.js` clonat del de Salut: cap xarxa, cap telemetria, cap model d'IA remot, ningú de fora importa l'app, i el build de producció sense el literal no la porta (R7G-9-06, -07).
3. **Sense canvis de capçaleres perilloses:** `firebase.json` no guanya `Cross-Origin-Embedder-Policy` ni `Cross-Origin-Opener-Policy` ni `'unsafe-eval'`; si hi ha WASM, només `'wasm-unsafe-eval'` i prova de capçaleres. Els iframes del Mur i /multimedia continuen carregant (R7G-9-03, -04).
4. **Magatzem:** `creaMagatzemIdb` amb llista blanca, o SQLite amb `opfs-sahpool` com a tros mandrós amb justificació escrita; `SOSTRE_DEL_TROS_D_ENTRADA` no s'apuja; es mesura el pes gzip del tros nou; `persist()` i avís de `persistent:false` (R7G-9-05, -18).
5. **Vius, menors i difunts:** cada persona té `viu|difunt|desconegut`; sense data de defunció i nascuda fa menys de 100 anys és «viu»; vius i menors fora de qualsevol exportació, branca compartida o text enviat fora, per defecte; prova que demostra la redacció (R7G-9-08, -15).
6. **Compartició:** si es toca el servidor, una migració NO aplicada, amb concessions per persona, RLS, revocació, i aprovació de les dues parts per unir arbres; el Mestre la decidix (R7G-9-09).
7. **Entrevista:** exactament una pregunta per torn (prova que compta els signes d'interrogació/peticions per torn); text de `presentacioPlugins.js:160` corregit; si la IAIA és remota, avís previ i text de `:168` corregit (R7G-9-07).
8. **Anti-al·lucinació per codi:** arestes només amb `origen` (cita literal que és subcadena de la resposta, o acceptació humana); coincidències de cognom, esqueles i fonts externes = propostes sense aresta; l'estat de certesa el calcula el codi; prova adversària amb dos cognoms iguals no emparentats ⇒ zero arestes noves (R7G-9-14).
9. **Detector:** passa els 12 casos de `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261106_claude_r7_gauntlet/l9_matriu_contradiccions.mjs` convertits a Vitest, més: dates desconegudes ⇒ cap veredicte, aproximades com a intervals, adopció/acolliment sense marge biològic, progenitors del mateix sexe, fill pòstum, constants dels marges documentades (R7G-9-13).
10. **Fonts:** cap scraping ni crawler; esqueles i fonts externes entren per enganxada manual o enllaç amb `font`, `data_de_consulta` i `qualitat`; els noms de familiars vius d'una esquela entren com a proposta no confirmada (R7G-9-11, -12).
11. **GEDCOM 7.0:** exportació UTF-8 sense `CONC`, extensions declarades a `SCHMA`, `PEDI` per a adopcions, `RESN` per a vius; viatge ida i tornada sense pèrdua amb caràcters `ç l·l à ò ñ`; còpia JSON pròpia amb estats i proveniència; PDF per full d'impressió, sense dependència nova (R7G-9-15).
12. **Accessibilitat:** patró ARIA `tree` i vista en llista indentada, navegació només amb teclat, certeses amb text i icona, `prefers-reduced-motion`, objectius ≥ 58 px, i vista ancorada en una persona (no graella fixa G1→G4) (R7G-9-16).
13. **i18n:** zero literals cablejats; claus a `ca, es, en, eu, gl`; vocabulari de parentiu com a dades; revisió nativa marcada com a pendent (R7G-9-17).
14. **Malnoms:** passen per la moderació existent només en compartir; camp d'ús (afectuós/pejoratiu/no sé) (R7G-9-10).
15. **Honestedat pública:** `pageContent.r10.js:122` i versions, o es fan certs (veu local demostrable) o s'esmenen a «previst»; vinyeta ≤ 150 kB; ni la paraula vetada al nou text (R7G-9-02, -19).

`01:28` · **Veredicte del carril 9:** el que hi ha de l'«Arbre Genealògic» al COMMIT R6 és una targeta amb vinyeta i text; l'espai `/app/genealogia`, el magatzem, el detector, l'entrevista i el GEDCOM no existixen i s'han de construir sencers (R7G-9-01), i hi ha text públic que ja descriu com a real una veu local que no té codi (R7G-9-02). Els bloquejadors tècnics són la CSP, que no deixa instanciar WASM, i el risc de resoldre-ho amb COOP/COEP, que trencaria els iframes del lloc (R7G-9-03, -04); el camí barat és el magatzem IDB que ja té la plataforma, no un segon motor (R7G-9-05). Els bloquejadors de fons són el contracte de dades personals sense categoria per a tercers (R7G-9-06), la promesa de «no s'envia enlloc» incompatible amb una IAIA remota (R7G-9-07), els vius, menors i difunts (R7G-9-08), la compartició entre veïns sense model d'accés (R7G-9-09) i les esqueles, que ni tenen origen definit ni condicions d'ús revisades (R7G-9-11). No donaria llum verda a la integració si el kit de Gemini no passa els 15 criteris; els punts 1, 2, 3, 5 i 8 són innegociables. Limitacions d'esta auditoria: només lectura, sense xarxa, sense navegador; l'efecte de la CSP, les condicions d'ús externes, el text de GEDCOM 7.0 i els articles legals citats són PLAUSIBLES fins que algú els contraste. El kit de Gemini encara no existia a `/tmp/sdp_r7_gemini_genealogia/` quan he mirat.

- `01:30` · **Contraauditoria del carril 9:** R7G-9-01 SOSTINGUDA (`registrePlugins.js:348` té `obrir: null`, `aplicacions.js:100` `estat: 'pendent'`, `src/apps` només té bar, comu, gestoria, lector, nevera, plataforma i salut; cap migració de genealogia ni dependència GEDCOM/SQLite a `package.json`; el text públic `presentacioPlugins.js:168` promet GEDCOM sense codi) · R7G-9-02 SOSTINGUDA (`pageContent.r10.js:121-122` i equivalents `:148-149`, `:175-176`, `:202-203` descriuen SuperWhisper/Whisper/Parakeet locals; a `src/` no hi ha cap codi de veu; el risc de la Web Speech API segueix PLAUSIBLE) · R7G-9-03 REBAIXADA a P2 (el fet és cert: `firebase.json:39` té `script-src 'self'` sense `'wasm-unsafe-eval'` i no hi ha cap WASM; però és una precondició d'un disseny proposat, no un defecte viu; l'efecte en runtime és CSP3 i no l'he vist al navegador, PLAUSIBLE) · R7G-9-04 REBAIXADA a P2 (l'absència de COOP/COEP és certa i `frame-src 'self' https:` a `firebase.json:39` + iframes a `MurSection.jsx:77` i altres fan que posar-los globalment seria arriscat, però no és cap defecte; que `opfs-sahpool` no requerisca `SharedArrayBuffer` és de memòria i cal comprovar-ho a la documentació de SQLite WASM) · R7G-9-05 REBAIXADA a P2 (`magatzemLocal.js:1-30` i `salut/magatzem.js:19,81` ho confirmen i el trinquet `pesDelNucli.test.js:58-62` és 1.690.000 B, però «duplica i en perd les garanties» és criteri de disseny sobre codi inexistent; cal que el kit mesure el pes gzip) · R7G-9-06 SOSTINGUDA (`manifestApp.js:59` i `:287` només admeten false|salut|financeres; `registreApps.js:43` `DADES_RESERVADES` només gestoria i salut; `interruptors.js:80-81` aplica la guarda segons eixe valor) · R7G-9-07 SOSTINGUDA (`presentacioPlugins.js:160` diu «tres o quatre preguntes» i `:168` «no s'envia enlloc», mentre el pla (línia 528, entrevista) mana una sola pregunta per torn amb SuperWhisper local; el cas del model remot continua PLAUSIBLE) · R7G-9-08 SOSTINGUDA com a PLAUSIBLE, severitat P1 mantinguda per ser requisit legal de disseny (no hi ha codi; `memoriaOral.js:248` té el tema «guerra»; l'edat de 14 anys i els articles RGPD/LOPDGDD queden per verificar amb revisió jurídica) · R7G-9-09 SOSTINGUDA com a PLAUSIBLE (cap migració ni RLS de genealogia; el pla preveu connectar amb l'arbre comunitari sense model d'accés) · R7G-9-11 SOSTINGUDA (`grep` de esquela|necrol a `src`, `supabase/migrations` i `tooling`: 0 resultats; l'origen de dades és PLAUSIBLE) · R7G-9-13 SOSTINGUDA (reexecutat ara: `l9_matriu_contradiccions.mjs` imprimeix «tots ok (12 casos)»; els marges 12/15/55/60/80 i ~300 dies són proposta, no norma) · R7G-9-14 SOSTINGUDA com a PLAUSIBLE (la regla només viu com a text a `presentacioPlugins.js:163-164`; `memoriaOral.js:28,50` és el precedent de promoció humana amb `marcaRevisioHumana()`). **Nota afegida:** el pla (línia 521) usa la paraula vetada pel Mestre en el títol de la peça 1; cal esmenar-ho abans que Gemini la propague al codi.

<!-- R7G:S9:FI -->

### R7G-10 · IDEA-101 (Nomenclàtor dels ~8.132 municipis i «Poble en Germinació»)

- `01:28` · **R7G-10-01 · P0 · CONFIRMAT · El poble d'una persona és un NOM de text, no un codi: amb 8.000 municipis els homònims col·lapsen en silenci cap a la fila més antiga.** Evidència: `src/sections/onboarding/IdentitatAlPoble.jsx:55-57` (`pobleAmbPrincipal` desa `'A · B'` a `town_name`), `src/sections/pobles/nomsDelPoble.js:77-90` (separador ` · `), `supabase/migrations/2610282100_usuari_i_poble_canonic.sql:626-631` (`lower(t.name) = lower(l.nom)` i desempat per `created_at`) i `:159-163` (la pròpia migració declara «No desfà els homònims: town_name és un nom»). Risc: dos veïns de «Castejón» (o de qualsevol nom repetit a províncies diferents; cal comptar-los al fitxer de l'INE) acaben al mateix `town_uuid`, amb la comarca i la província del primer; privacitat i moderació per poble queden barrejades. Proposta: la clau és el **codi INE de 5 dígits** (text, amb zeros a l'esquerra); afegir `ine_code` a `towns` i a `profiles`, derivar `town_name` d'ell, i que el desempat per nom deixe de valdre per a pobles nous. Criteri: dos municipis homònims de províncies diferents es poden triar i queden separats.

- `01:28` · **R7G-10-02 · P0 · CONFIRMAT · No existix cap camí de servidor per a crear un poble, i cada fila de `towns` és un TENANT: «activar automàticament» una pàgina crea un tenant i una porta de registre.** Evidència: només hi ha `create policy "public read towns" ... for select` (`supabase/migrations/2609080000_initial_schema.sql:749-750`); l'únic `insert into public.towns` és la llavor (`supabase/seed.sql:4`); `2610282100...sql:159` diu «No crea files a public.towns»; `tenant_id uuid references public.towns(id)` a `app_content`, `town_memberships` i altres taules (`2609080000...sql:24,35,47,75`); i `is_open` és el que deixa registrar-se al poble (`:248-251`, `SDP-REG-003`), amb `default true`. Risc: una RPC ingènua que inserte `towns` obri un poble per a altes de qualsevol, sense escut, sense admin i sense moderació. Proposta: una **taula de referència separada** (`municipis_ine`, només lectura, 8.000 files) i `towns` només en activar; la fila nova naix amb `is_open=false` i un `estat` (`germinacio`) fins que hi haja un primer veí verificat; la creació és una funció `SECURITY DEFINER` amb `set search_path = ''`, amb límit de freqüència per persona i per dia (patró de `private.trigger_rate_limit_xat`, `2609080200_xat_v2_correccions.sql:387-416`), mai un `insert` des del client.

- `01:28` · **R7G-10-03 · P1 · CONFIRMAT · El «22/560» no es pot reproduir des de l'arbre: ni la xifra 560 ni el fitxer que la sustentaria hi són.** Evidència: `grep` de `commons_photo_url` i `commons_locator_map_url` només troba l'acta `_wiki_de_poble/10_actes/261105_1846_acta_marmota_...md:51`; `src/data/poblesPhotos.json` no existix a HEAD `d79a0b530`; `MOCK_TOWNS` té 9 pobles (`src/sections/pobles/townsSeed.js:5`) i `poblesAplecViquipedia.js` 22 entrades. Risc: el flux «si ja està actiu (22/560), es vincula» no té denominador verificable; la comunitat valenciana té 542 municipis segons l'INE (PLAUSIBLE: cal comprovar-ho al fitxer oficial), no 560, i 560 podria comptar pedanies. Proposta: el kit ha d'aportar un test que compte les files actives de `towns` i els codis INE coberts, i la UI no ha de mostrar mai una xifra sense font.

- `01:28` · **R7G-10-04 · P1 · PLAUSIBLE · Llicència i xifres de la font: res no està verificat al repositori, i el pla dona per fet «INE/IGN», «8.132», «11 dígits» i «comarca» com si totes foren dades d'una sola font.** Evidència: no hi ha cap fitxer, script ni README de nomenclàtor al'arbre (`find` de `*municipi*`/`*nomenclator*` només torna `public/opendata/municipi.jsonld`, 550 bytes, amb un sol municipi); el pla (`línies 525-531`) i el Llibre Mestre (`IDEA-101`) afirmen les xifres sense font. Cal comprovar, abans de commitejar cap dada: (a) la condició de reutilització i atribució de l'INE (avís legal del web de l'INE) i la llicència de la distribució de l'IGN/CNIG del NGMEP (Centro de Descargas); no s'ha de copiar cap llicència de memòria al fitxer de dades; (b) la xifra de municipis del fitxer descarregat i la data de referència (la xifra canvia amb fusions i segregacions; 8.132 no es pot donar per bona sense el fitxer); (c) quin és el codi de 11 dígits i a què apunta (entitat singular o nucli/disseminat; l'INE el compon de províncies, municipi, entitat col·lectiva, singular i nucli); (d) el nombre d'entitats i nuclis, que són desenes de milers, no 8.132. Proposta: el kit ha de portar `FONT.md` amb URL, data de descàrrega, SHA-256 del fitxer original, condició de reutilització copiada literalment de la font i recompte per província; sense això, no es commiteja.

- `01:28` · **R7G-10-05 · P1 · PLAUSIBLE · La «comarca» no existix a l'INE ni al nomenclàtor de l'IGN per a tot l'Estat: el filtre Província → Comarca → Poble tindria buits o s'ompliria amb dades inventades.** Evidència: l'única comarca que el codi sap és la de la llavor (`townsSeed.js:11-14`, camp `comarca`) o la que torna Wikidata P131 (`src/data/adaptadors/viquipedia/README.md`, pas 6, «barreja»). Les comarques oficials les defineix cada comunitat (i algunes no en tenen d'oficials); cal comprovar quines columnes porta realment el fitxer descarregat. Risc: omplir la comarca amb Wikidata o amb un model genera divisions falses. Proposta: el camp `comarca` és **opcional i amb procedència** (`comarca_font`); el filtre es degrada a Província → Poble quan una comunitat no en porta, i la UI no mostra mai un pas buit. Criteri: cap municipi té comarca sense `comarca_font`.

- `01:28` · **R7G-10-06 · P1 · CONFIRMAT · Al·lucinació de topònims: el pla demana noms oficials «en va/es/eu/gl» per a cada municipi, però només n'hi ha un o dos d'oficials, i el codi ja té una regla contrària.** Evidència: `aliesDePoblesSeed.js` (capçalera) estableix «no s'inventa cap poble» i que els àlies bilingües són dades de llavor per fitxa; `pobleDeViquipedia.js:1-40` (README, pas 3) només dona per bo el que casa amb l'etiqueta de Wikidata. Risc: un traductor automàtic generaria «Ourense» en valencià, «San Sebastián» en gallec o una forma basca per a un poble de Jaén; això és un topònim fals a la fitxa pública. Proposta: format de dades amb `nom_oficial` (text tal com el dona la font) i `noms_cooficials` **només** si la font els porta, cadascun amb `llengua` i `font`; la cerca pot usar **sinònims** (Xixona/Jijona, Alacant/Alicante) com a `variants` marcades `{ oficial: false }`, però la UI no els presenta mai com a nom oficial. Criteri: un test que falla si un topònim té una llengua sense `font`.

- `01:28` · **R7G-10-07 · P1 · CONFIRMAT · L'slug es fa només del nom, i `towns.slug` és únic: un homònim fa fallar l'alta o, pitjor, redirigix cap a l'altre poble.** Evidència: `src/sections/pobles/nomsDelPoble.js:62-75` (`slugDelPoble(nom)` sense província ni codi), `supabase/migrations/2609080000_initial_schema.sql:9` (`slug text not null unique`), i `/pobles/:slug` com a clau de ruta. Risc: dos municipis amb el mateix nom col·lideixen; el segon no es crea o s'ajunta al primer. A més, la font pot donar el nom amb l'article al final (`Coruña, A`, `Palmas de Gran Canaria, Las`) o amb barra (`Alacant/Alicante`, `Donostia/San Sebastián`); PLAUSIBLE, cal comprovar-ho al fitxer; si és així, `slugDelPoble` i `nomDeLaGent` (que contrau l'article inicial) donarien `coruna-a` i «Gent de Coruña, A». Proposta: una funció pura `normalitzaNomOficial` (article al davant, partició de la barra en `nom` + `variants`) abans de qualsevol slug o «Gent de…»; slug = nom net, i en col·lisió, `nom-<província>` i, si encara col·lideix, `nom-<codi INE>`; l'slug ja publicat no canvia mai. Criteri: un test amb tots els homònims del fitxer real sense cap col·lisió.

- `01:28` · **R7G-10-08 · P2 · CONFIRMAT · El pla parla de «va», però el selector d'idiomes del producte és `ca`: les dades i les claus han de seguir el mateix codi.** Evidència: `src/config/idiomes/` conté `ca.js`, `es.js`, `eu.js`, `gl.js`, `en.js` (cap `va`); `src/config/i18n.idiomes.test.js:62` exigix paritat de claus entre els cinc i `i18n.diferit.test.js:42` fixa `IDIOMES_DIFERITS` com tots menys `ca`. Risc: un camp `noms.va` que ningú no llig, o una clau `section.onboarding.selectorPoble.*` afegida a quatre fitxers i no al cinqué, que trenca la porta de paritat. Proposta: els topònims usen els codis BCP-47 reals de la font (`ca` per al valencià i el català, `es`, `eu`, `gl`); les claus noves van als cinc fitxers en el mateix commit; el valencià és el valor de reserva de `t('clau', 'Text')`.

- `01:28` · **R7G-10-09 · P1 · PLAUSIBLE · Mida de l'índex al client: només els municipis caben en un chunk mandrós; les entitats, no.** Evidència: no hi ha dades al repositori per mesurar; el precedent és el chunk de pobles hidratats de 67 KB diferit com a `R5-D4` (`pla, línia 511`) i `poblesAplecViquipedia.js` (67.440 bytes). Estimació a verificar amb el fitxer real: 8.000 municipis × (nom, codi, província, coordenades) són unes centenes de KB de JSON sense comprimir i desenes de KB amb gzip/brotli; les entitats i nuclis (desenes de milers) són megabytes. Proposta: (1) índex de municipis **a part** i carregat amb `import()` només en obrir el selector, mai al tros d'entrada ni al Service Worker de precàrrega; pressupost de ≤ 250 KB sense comprimir i ≤ 80 KB brotli, mesurat en un test; (2) les entitats, per **fragments per província** (52 fitxers, càrrega només quan es tria la província) o consultes al servidor; (3) format columnar (arrays paral·lels i taula de províncies) i no un objecte per municipi; (4) versió i SHA-256 de l'índex dins del fitxer, per a la caducitat de la cau.

- `01:29` · **R7G-10-10 · P2 · CONFIRMAT · Rendiment de la cerca difusa: no cal cap biblioteca per a 8.000 municipis; per a 60.000 entitats, sí un índex i fora del fil principal.** Evidència (experiment `scratchpad/r7g/l10_nomenclator/bench.mjs`, dades sintètiques, Node a l'ordinador de l'Auditora): per consulta, prefix/subcadena sobre cadenes ja normalitzades 0,26 ms (8.132) i 1,08 ms (60.000); Levenshtein ingenu amb distància ≤ 2 sobre la primera paraula 4,2 ms i 28,4 ms. Els mòbils econòmics són uns quants cops més lents; la xifra no és de dispositiu. Proposta: normalitzar **una vegada** en construir l'índex (NFD sense diacrítics, minúscules, apòstrof tipogràfic = recte com a `nomsDelPoble.js:36`, `l·l`/`ŀl`/`l.l` = `ll`, article inicial i final fora, `-` i `/` com a espai); ordenar prefix > paraula > subcadena > difusa només si no n'hi ha prou; límit de 50 resultats pintats (no 8.000 `<li>`); debounce de 80-120 ms només per a les entitats. Criteri: test de rendiment amb 8.132 files sintètiques ≤ 16 ms per consulta al CI i la cerca «Xixona» i «Jijona» tornen el mateix codi.

- `01:29` · **R7G-10-11 · P1 · CONFIRMAT · Ja hi ha un Combobox ARIA 1.2 al repositori, però amb dos trets que NO s'han de copiar al selector de pobles.** Evidència: `src/components/PedraSeca/organismes/AfegitRapid.jsx:108-112` (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`), `:129-132` (`listbox`/`option`/`aria-selected`) i `:149` (`role="status"` amb el recompte). Trets perillosos: (a) l'opció `crea` (`:132`, «Afig «text» com a article nou») transposada als pobles deixaria crear un poble a partir de text lliure; (b) els textos són literals en valencià dins del component (`TEXTOS_AFEGIT`, `:23-27`), no claus de `t()`, i no passarien la paritat dels cinc idiomes. Per a mòbil: `onMouseDown` amb `preventDefault` (`:130`) i `onBlur={tanca}` s'han de provar amb tacte (iOS Safari i Android Chrome), i la llista no pot quedar amagada darrere del teclat virtual (`visualViewport`). Proposta: `SelectorPobleEstat.jsx` reutilitza la mecànica d'AfegitRapid (o la hi extrau), amb: etiqueta visible, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, fletxes, Inici/Fi, Escape (tanca i, tancat, no buida), Intro només sobre una opció activa, `aria-live` polit amb «N resultats», cada opció amb nom + província (desambigua homònims en lectura de pantalla: «Castejón, Navarra»), `min-height` tàctil de 44 px, sense `autoFocus`, i **cap opció de crear**. El filtre Província → Comarca → Poble s'implementa amb tres `Selector` natius encadenats (no tres combobox), perquè al mòbil el natiu és accessible per defecte.

- `01:29` · **R7G-10-12 · P0 · CONFIRMAT · Vector d'abús: pàgines públiques `/pobles/:slug` creades a partir d'una tria d'un usuari, sense límit, sense `noindex` i amb dades que arribarien a superfícies externes.** Evidència: cap RPC de creació existix (R7G-10-02); `src/hooks/seoHead.js:148` només posa `noindex, nofollow` si `data.index` és fals i `ItemDetailSection.jsx:216` el calcula per bloqueig/inexistència, no per estat «en germinació»; `public/opendata/municipi.jsonld` i els actors ActivityPub `ap/actors/<slug>.json` ja s'emeten per poble. Risc: (a) 8.000 pàgines públiques buides; un escombrador de la catàleg podria crear-les totes en una hora; (b) vandalisme: qui «activa» un poble n'és el primer veí i, en l'esquema actual, el primer a dir-hi alguna cosa; (c) contingut nou a la federació (Mastodon) per a pobles sense cap veí. Proposta: el servidor crea la fila només des de la taula de referència (cap nom lliure), amb `estat='germinacio'`, `index=false` fins a N veïns verificats (N decidit pel Mestre; no el fixe), límit per persona (p. ex. 3 activacions/dia, a decidir) i per IP/dispositiu, registre d'auditoria, actor ActivityPub **no emès** en germinació, i cap contingut generat per IA a la fitxa (les dades són les de la font, amb procedència). Criteri: un test que, per a un poble en germinació, comprova `robots=noindex,nofollow`, absència a `municipi.jsonld` i a la federació, i `429` a la quarta activació.

- `01:29` · **R7G-10-13 · P1 · CONFIRMAT · `/registre` envia el poble com a metadada de text abans que la persona existisca; si la creació s'hi lliga, qualsevol visitant anònim pot disparar-la.** Evidència: `src/sections/onboarding/CampsDIdentitatALAlta.jsx:33-48` (el `<select>` del registre, valor = nom), `supabase/migrations/2610282100_usuari_i_poble_canonic.sql:799-803` (el disparador d'alta llig `raw_user_meta_data ->> 'town_name'` amb `left(...,120)`), i `:878-882` (`poble_derivat` en canviar `town_name`). Risc: una alta amb un `town_name` arbitrari (la metadada la controla el client, no el selector) no és validada contra cap llista; hui és inofensiu perquè no es crea res, però amb activació automàtica seria creació sense autenticar. Proposta: al registre només es **desa el codi INE** triat (validat al servidor contra la taula de referència; un codi inexistent = error `SDP-…` de validació); la creació/activació és un pas apart, autenticat i amb correu verificat, mai dins del disparador d'alta. Criteri: un test SQL (PGlite) amb un `town_name` i un `ine_code` falsos no crea cap fila.

- `01:29` · **R7G-10-14 · P1 · PLAUSIBLE · RGPD/LOPDGDD: triar un nucli de pocs habitants revela la persona; el «primer veí pioner» i l'avís a l'administració són tractaments nous.** Evidència: el pla (`línia 531`) parla de «Primer Veí Pioner», d'un avís a l'administració i d'una invitació; `PerfilEditor.jsx:872` ja alimenta el selector amb `towns.title` i `ajudaUsuari` diu que la fitxa és pública només si el perfil ho és (`IdentitatAlPoble.jsx:32`). Risc: en una entitat singular de poques desenes de persones, «únic veí registrat» + nom és identificatiu; un correu a «l'administració» del municipi amb el nom o el correu del veí és una comunicació de dades a un tercer sense base legal. Cal comprovar (jurídic, no d'esta Auditora): base legal i registre d'activitats. Proposta: la pàgina en germinació mostra «hi ha veïns» o el recompte només a partir d'un llindar (decisió del Mestre) i mai el nom del primer veí sense consentiment explícit; l'avís a l'administració porta zero dades personals (només «hi ha interés al poble X»); la invitació és un enllaç que genera la persona i envia ella; granularitat per defecte: **municipi**, i entitat singular només com a opció avançada.

- `01:29` · **R7G-10-15 · P2 · CONFIRMAT · Un poble nou dispararia l'algoritme de la Viquipèdia des del client: cinc peticions per poble i una API externa amb regles d'etiqueta.** Evidència: `src/data/adaptadors/viquipedia/README.md` («Una proposta normal fa cinc peticions: cerca, element, article, etiquetes i fitxers»; en sèrie, 250 ms de respir, `maxlag=5`, `Api-User-Agent`), `pobleDeViquipedia.js` (fase 3b/3c «pendents» al mateix README). Risc: 100 altes en una hora = 500 peticions des de navegadors diferents amb el mateix `Api-User-Agent`, i el resultat (text i fotos CC BY-SA, no escut per `IDEA-90`) apareix a una pàgina pública sense revisió. Proposta: l'activació NO crida Wikimedia; la fitxa nasqué de la taula de referència (nom, província, coordenades, població si la font la porta). El text i les fotos de la Viquipèdia s'hi afegeixen després, amb l'ordre ja existent «Porta-ho de la Viquipèdia» i la seua moderació. El codi INE és la clau per a casar amb l'element de Wikidata (P772), no el nom.

- `01:29` · **R7G-10-16 · P2 · CONFIRMAT · Separació de tenants i claus d'idioma: la creació de pobles toca el remot i els cinc diccionaris alhora.** Evidència: `towns` és el tenant (R7G-10-02); `supabase/seed.sql:4` sembra `seed-town`; la porta de paritat és `src/config/i18n.idiomes.test.js:62-85` (totes les claus del valencià a les altres quatre, mateixos marcadors `{…}`); `IdentitatAlPoble.jsx:23-40` ja té el patró `p(nom, reserva)` amb 17 claus `section.onboarding.identitatPoble.*` a cada fitxer i `login.registre.*` amb 26. Risc: afegir claus nous a `ca.js` i oblidar `eu.js`/`gl.js` trenca la porta; una migració que sembre `towns` per als 8.000 municipis al remot ompliria el catàleg públic (`select using (true)`) amb 8.000 tenants. Proposta: espai de noms `section.onboarding.selectorPoble.*` (etiqueta, ajuda, «N resultats», «Sense resultats», «Província», «Comarca», «Poble», «En germinació», errors) als cinc fitxers; **cap sembra massiva de `towns`**; la taula `municipis_ine` és a part, amb RLS de lectura i sense escriptura per a `anon`/`authenticated`; migració numerada després de l'última aplicable i anotada a `supabase/ordre_desplegament.json`; mai aplicada des d'este carril.

- `01:30` · **Criteris d'acceptació del kit de Gemini (IDEA-101), verificables:**
  1. **Font:** `FONT.md` amb URL, data, SHA-256, condició de reutilització copiada de la font i recompte per província; sense això, cap dada no es commiteja (R7G-10-04).
  2. **Clau:** `ine_code` de 5 caràcters (text) a `municipis_ine`, `towns` i `profiles`; el selector desa el codi, no el nom; dos homònims de províncies diferents queden separats (R7G-10-01, -07).
  3. **Servidor:** taula de referència sense escriptura per a `anon`/`authenticated`; l'activació és una funció `SECURITY DEFINER` amb `search_path = ''`, amb límit de freqüència (`429` a l'excés), fila nova `is_open=false` i `estat='germinacio'`; **cap** `insert` des del client i cap sembra massiva de `towns` (R7G-10-02, -12, -16).
  4. **Registre:** un `ine_code` o `town_name` inexistent no crea res; la creació no es fa dins del disparador d'alta (R7G-10-13). Test SQL amb PGlite.
  5. **Abús:** pàgina en germinació amb `robots=noindex,nofollow`, fora de `municipi.jsonld`, de la federació i del mapa del lloc (R7G-10-12).
  6. **Topònims:** cap nom en una llengua sense `font`; els sinònims (Xixona/Jijona, Alacant/Alicante, Donostia/San Sebastián) són `variants` de cerca i no s'etiqueten com a oficials; codis `ca/es/eu/gl` (R7G-10-06, -08).
  7. **Normalització:** `normalitzaNomOficial` (article al davant, barra partida) amb test sobre tot el fitxer real; cap col·lisió d'slug (R7G-10-07).
  8. **Comarca:** opcional amb `comarca_font`; el filtre es degrada a Província → Poble (R7G-10-05).
  9. **Mida i rendiment:** índex de municipis en un chunk `import()` només en obrir el selector, ≤ 250 KB cru i ≤ 80 KB brotli (mesurats en un test); entitats per fragments de província o servidor; ≤ 16 ms per consulta amb 8.132 files; màxim 50 `<li>` (R7G-10-09, -10).
  10. **Accessibilitat:** `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`, teclat complet (fletxes, Inici, Fi, Escape, Intro), `role="status"` amb el recompte, opcions amb nom + província, objectius tàctils de 44 px, prova a 375 px i amb teclat virtual; **sense opció «crea»** (R7G-10-11).
  11. **i18n:** claus `section.onboarding.selectorPoble.*` als cinc fitxers de `src/config/idiomes/`; passa `i18n.idiomes.test.js` (R7G-10-16).
  12. **Wikimedia:** l'activació no fa cap petició externa; Viquipèdia només amb «Porta-ho de la Viquipèdia» (R7G-10-15).
  13. **RGPD:** cap nom ni correu de veí a la pàgina en germinació ni a l'avís a l'administració; granularitat per defecte = municipi (R7G-10-14).
  14. **Honestedat de xifres:** la UI no mostra cap «N/560» ni «8.132» sense font; un test compta les files reals (R7G-10-03).
  15. **Dades sense mida sorpresa:** cap fitxer de dades > 1 MB comprimit en un sol commit (límit per commit ≈ 13 MB del hook); les entitats fora del paquet inicial.

`01:30` · **Veredicte del carril 10:** IDEA-101 **no és implementable tal com està escrita** i el kit de Gemini no s'ha d'integrar sense canviar el model: el pla tracta el poble com un nom i la creació com un `insert` de pàgina, i el codi fa tot el contrari de bo per a això (identitat per nom amb homònims irresolts, `towns` = tenant amb registre obert per defecte, cap camí de servidor, cap dada ni font al repositori). Les dues peces fàcils (Combobox ARIA, cerca difusa sobre 8.000 files) són viables i barates (0,26 ms per consulta en l'experiment, R7G-10-10), i ja hi ha un patró ARIA a `AfegitRapid.jsx`; les difícils són la **clau INE**, la **separació entre taula de referència i tenant**, la **llicència/xifres de la font** (res verificat; la comarca ni tan sols existix com a dada estatal) i el **límit d'abús** (pàgines buides, `noindex`, federació, RGPD de nuclis menuts). Dos P0 (R7G-10-01, -02) més el P0 d'abús (R7G-10-12) bloquegen el COMMIT R7 d'esta peça; les quinze condicions de dalt són la porta mínima. Esbós de format: `_investigacio_ia_de_poble/261106_claude_r7_gauntlet/idea-101_format_nomenclator.md`. Cap dada ni migració s'ha creat o aplicat des d'este carril.

- `01:32` · **Contraauditoria del carril 10:** R7G-10-01 REBAIXADA a P1 (el col·lapse d'homònims és real al codi, `supabase/migrations/2610282100_usuari_i_poble_canonic.sql:626-631` tria per `lower(name)` i desempata per `created_at`, i la mateixa migració ho admet a `:159-163`, però ara només hi ha una fila per nom a la llavor; el P0 només escau si el nomenclàtor carrega homònims reals, i `town_uuid` ja el mitiga per a qui el té) · R7G-10-02 SOSTINGUDA (només hi ha `for select` a `2609080000_initial_schema.sql:749-750`, `towns` té RLS i cap política d'inserció, l'únic `insert into public.towns` és la llavor `supabase/seed.sql:4`, `is_open` val `true` per defecte a `:11` i l'alta el comprova a `:248`; el pla, línia 531, mana crear la pàgina automàticament) · R7G-10-12 REBAIXADA a P1 (CONFIRMAT només la part d'indexació: `src/sections/detail/ItemDetailSection.jsx:216` marca `index` per a qualsevol ítem trobat i `src/hooks/seoHead.js:148` només posa `noindex` si `index` és fals; la part de jsonld i federació és PLAUSIBLE, perquè `public/opendata/municipi.jsonld` és un fitxer estàtic d'un sol municipi i no es genera des de `towns`) · R7G-10-03 SOSTINGUDA (`commons_photo_url` no apareix a `src`, `src/data/poblesPhotos.json` no existix, `MOCK_TOWNS` és a `townsSeed.js:5` i `poblesAplecViquipedia.js` té 22 entrades; el «560/560» només consta a l'acta `261105_1846_acta_marmota…md:41`) · R7G-10-04 SOSTINGUDA (PLAUSIBLE: el repositori no porta cap fitxer de nomenclàtor ni FONT.md; la xifra 8.132 només apareix en un prompt arxivat, sense font) · R7G-10-05 SOSTINGUDA (PLAUSIBLE: `townsSeed.js:11-14` duu comarca només per als pobles de la llavor; que no existisca com a dada estatal uniforme cal verificar-ho a la font oficial) · R7G-10-06 REBAIXADA de CONFIRMAT a PLAUSIBLE, severitat P1 mantinguda (la capçalera d'`aliesDePoblesSeed.js` prohibix inventar pobles, però no hi ha cap topònim inventat demostrat al codi; és un risc prospectiu del Kit de Gemini, que cal comprovar contra la font) · R7G-10-07 SOSTINGUDA (`nomsDelPoble.js:62-75` fa el slug només del nom i `towns.slug` és únic a `2609080000_initial_schema.sql:9`; que la font porte l'article al final és PLAUSIBLE, i `pobleDeViquipedia.js:97-102` només treu l'article del davant) · R7G-10-09 SOSTINGUDA (PLAUSIBLE: el precedent és real, R5-D4 a l'informe `:1235` xifra 67.169 B per als 22 pobles, però no hi ha dades per a mesurar 8.132) · R7G-10-11 SOSTINGUDA (`AfegitRapid.jsx:108-112` dona el combobox ARIA, `:129-132` i `:23-27` tenen l'opció «crea» i `TEXTOS_AFEGIT` són literals en valencià sense `t()`, `:149` també) · R7G-10-13 SOSTINGUDA (`CampsDIdentitatALAlta.jsx:33-48` envia `poble` com a text, i `2610282100…sql:799-803` el llig de la metadada de l'alta, que controla el client, amb `left(…,120)`; el disparador de perfil és a `:878-882`; una creació lligada ahí s'executaria abans de verificar cap correu) · R7G-10-14 SOSTINGUDA (PLAUSIBLE: és una valoració jurídica sense fonts al repositori; el pla línia 531 introduïx el «Primer Veí Pioner», i la cita `IdentitatAlPoble.jsx:32` no la he pogut vincular a cap risc de dades personals).

<!-- R7G:S10:FI -->

### R7G-7 · Kits r59+ (Gemini), R13+ (Codex) i informe del Mac mini

A les 01:22: Codex treballa a `/tmp/sdp_r7_codex_fediversity/`. També hi ha `/tmp/sdp_r7_bootstrap.mjs`. L'informe `_investigacio_ia_de_poble/261106_auditoria_extrema_nocturna_mac_mini_sobirana.md` encara no existix. Ordre ampliada del Mestre (01:20): el Gauntlet cobrix IDEA-100…107. La Fase 2 a les 11:00 consistix a auditar els kits en una còpia aïllada, integrar-los amb lease Reflex, passar totes les portes (`run-portes.mjs`, `test:precommit`, `build:web`, `certifica-enllacos.mjs`), fer el COMMIT R7 amb la disciplina de l'índex i deixar llista la producció.

A les 01:19 no n'hi ha cap. Els últims dipòsits a `_investigacio_ia_de_poble/` són `261105_kit_codex_r12_…` i `261105_kit_gemini_r58_…`. Gemini treballa a `/tmp/sdp_r7_gemini_genealogia/` (IDEA-100 i IDEA-101).

`01:41` · **01:39 · Codex ha depositat 5 kits** (`sdp.kit-carril.v1`): R13 `fediversity_nix_e2ee_multipoble_i_usuaris` (49 fitxers), R14 `corpus_dialectal` (4), R15 `auditoria_ingesta_i_deute_historic` (3), R16 `cerca_recompte_accessible` (9) i R17 `fediversity_contracte_vigent` (7). **El CAS de Claude contra l'arbre viu (01:45) ix net:** R13, R16 i R17 tenen totes les preimatges iguals; R14 s'encadena sobre R13 (`tooling/tests/node-suite-manifest.json`) i R15 sobre R14 (els 3 fitxers de `tooling/cultura` i la prova); la integritat de payload contra `target_sha256` és 100%, i cap kit trenca una precondició. **Solapaments que cal arbitrar:** R13 toca `src/css/modules.css` i porta `tests/copyright-scroll-cascade.test.mjs` (el mateix objectiu que `p0-28_drets_scroll.diff`), i R17 toca `pageContent.r10.js` (el text NLnet de R7G-9-02). Hi ha una còpia aïllada amb els 5 kits superposats a `scratchpad/r7g/copia_kits` d'esta sessió.

#### R7G-7.1 · Kit R13 · Nix, Node 0, multipoble i restauració

<!-- R7G:K1:FI -->

#### R7G-7.2 · Kit R13 · Activació de l'E2EE (F2a)

<!-- R7G:K2:FI -->

#### R7G-7.3 · Kit R13 · Administració d'usuaris i organitzacions

<!-- R7G:K3:FI -->

#### R7G-7.4 · Kit R13 · Karpathy i scroll de copyright

<!-- R7G:K4:FI -->

#### R7G-7.5 · Kits R14 i R15 · Corpus dialectal

<!-- R7G:K5:FI -->

#### R7G-7.6 · Kits R16 i R17 · Cerca accessible i contracte de Fediversity

<!-- R7G:K6:FI -->

<!-- R7G:S7:FI -->

### R7G-8 · Relleu per a les 11:00

`01:21` · **Relleu provisional (s'escriu abans que acabe el workflow, per si s'acaba la quota):** el Gauntlet corre en el workflow `wf_097f09d0-051`: 6 carrils en Sonnet (auditar → contraauditar les P0/P1). Si a les 11:00 no hi ha el veredicte de cada carril (paràgraf «**Veredicte del carril N:**» davall del seu subapartat), cal reprendre'l amb `Workflow({scriptPath: "/Users/javillinares/.claude/projects/-Users-javillinares-Documents-Antigravity-Som-de-Poble/25410edd-65c0-454d-b959-802b3e134b4f/workflows/scripts/gauntlet-r7-nocturn-wf_097f09d0-051.js", resumeFromRunId: "wf_097f09d0-051"})`: els carrils acabats tornen de la memòria cau. L'script d'inserció (`ins.py`) és a l'scratch d'esta sessió, i en una sessió nova cal tornar a crear-lo (vegeu la recepta de R6: `fcntl.flock`, bloqueig fora de `04_escriptori`). Els pegats i els dissenys són a `_investigacio_ia_de_poble/261106_claude_r7_gauntlet/`. **Ordre de les 11:00:** (1) llegir R7G-1…6 i les contraauditories; (2) mirar si han aparegut kits r59+ i R13+ i auditar-los contra estes troballes; (3) decidir amb el Mestre el desplegament de `d79a0b530` i la sonda P0-16 (R7G-0).

`01:24` · **Ampliació (ordre de les 01:20):** hi ha un segon workflow, `wf_4aed91a5-c60`, per a IDEA-100 i IDEA-101 (subapartats R7G-9 i R7G-10). La seua represa és amb `Workflow({scriptPath: "/Users/javillinares/.claude/projects/-Users-javillinares-Documents-Antigravity-Som-de-Poble/25410edd-65c0-454d-b959-802b3e134b4f/workflows/scripts/gauntlet-r7-idea100-101-wf_4aed91a5-c60.js", resumeFromRunId: "wf_4aed91a5-c60"})`. **La Fase 2 està programada:** una tasca d'un sol tret (`80438137`) farà tornar esta sessió el 261106 a les **11:07** amb l'ordre de la Fase 2: reprendre des d'ací, auditar els kits r59+, R13+ i el Mac mini en una còpia aïllada, integrar amb lease Reflex, passar les portes, fer el COMMIT R7 i deixar llista la producció. La tasca **només viu dins d'esta sessió de l'app**: si l'app es tanca, cal tornar a llançar la Fase 2 a mà.

`01:29` · **Guia d'integració per a les 11:00 (síntesi d'àrbitre, workflow `wf_097f09d0-051` tancat a les 01:29, 12 agents, 0 errors).** Els pegats s'han comprovat amb `git apply --check` sobre l'arbre viu (HEAD `d79a0b530`) a les 01:29. Per ordre:

1. **P0-28 / IDEA-105 → aplicar primer.** El diagnòstic del pla és **cert** a Chromium: la sospita adversarial ha quedat refutada amb un experiment en Chrome sense interfície (R7G-2-01, sostinguda). Pegat: `p0-28_drets_scroll.diff` (`modules.css` +13, i una prova nova `src/css/dretsDinsCompte.capes.test.js`, 3/3 en verd i en roig sense l'arreglo). Cal **tot** l'arreglo, perquè la versió parcial deixa el peu sticky solt. Falta: la comprovació visual en mode compacte (R7G-2-03) i Firefox/Safari.
2. **P0-27 / IDEA-102 → aplicar després de P0-28.** Pegat: `p0-27_squarebadge.diff` (6 fitxers; 63 proves en verd en una còpia congelada). El CSS flotant era a `layout.css`, no a `modules.css`. El pegat ja resol dues P1 sostingudes: el color del preu (R7G-1-02) i el quadrat amagat quan la pàgina està traduïda (R7G-1-03). **Decisió del Mestre (R7G-1-07):** conservar o no `file` i `type_label` d'events, que només eixien a les píndoles. `EventCard.test.jsx` ja falla a l'arbre viu i el pegat no el toca (R7G-1-08).
3. **IDEA-103 → NO implementar tal com està escrita.** Cita un esquema que no existix (`town_id`, `organization_members`, el rol `editor`, carpetes del Veïnat), el superadmin no pot escriure pertinences, i fer connexions o pertinences en nom d'altri no té consentiment ni registre (R7G-3-05, 3-07 i 3-08, sostingudes). El disseny segur és a `idea-103_disseny.md`: una RPC paginada per cursor, el correu emmascarat, un filtre de baixa i consentiment, invitacions amb acceptació i un registre d'auditoria. **Cal decisió del Mestre** sobre el model de consentiment abans que cap kit ho toque.
4. **IDEA-104 → el «100% demostrat» no es pot donar esta nit sense maquinari ni humà.** Nix: no hi ha `nix` ni `flake.lock` en este Mac, i dos dels fitxers que nomena el pla no existixen (R7G-4-02, sostinguda). L'estat viu del Node 0 desmentix Mastodon bidireccional i el 3-2-1 (R7G-4-03, sostinguda). L'E2EE és una biblioteca sòlida (2.909 proves en verd), però està **desconnectada de la UI** (bandera apagada, F2a i F7 sense importador), i el kit F7 no s'aplica net sobre HEAD (R7G-5-03). `karpathyWikiCompiler.js` **no existix**, i les Cròniques i el SKOS són dades estàtiques (R7G-5-09). **Errors vius que cal arreglar:** el text de recuperació en 5 idiomes diu «12 paraules» però el codi en vol 6 i 3 amics (R7G-5-07), i la promesa de «zero fugida de dades» queda contradita per la traducció amb Apertium/DeepL (R7G-5-05). **Qualsevol kit r59+ o R13+ que marque Nix, Mastodon, 3-2-1, E2EE o Karpathy com a «verificat» s'ha de rebutjar** si no complix els criteris E1-E9 i K1-K6 (R7G-5-11) i els de R7G-4.
5. **IDEA-106 i IDEA-107 → només disseny.** No hi ha `tooling/cultura` ni les taules. **Prohibit** el tractor que «mou i allibera espai» sense una còpia verificada i una decisió humana, perquè `_cultura_de_poble` és fora del git i és l'única còpia (R7G-6-01). Les llicències no estan verificades (R7G-6-02, sostinguda). El joc del micro necessita el consentiment del convidat (R7G-6-04). L'esquema i els riscos són a `idea-106-107_esquema_i_riscos.md`.
6. **Kits nocturns:** a les 01:29 encara no n'hi ha cap de nou. Codex treballa a `/tmp/sdp_r7_codex_fediversity/` i Gemini a `/tmp/sdp_r7_gemini_fediversity/`. L'informe del Mac mini no existix. Cada kit s'ha d'auditar contra R7G-1…10 abans d'integrar-lo.

`01:32` · **Guia d'integració · ampliació (workflow `wf_4aed91a5-c60` tancat a les 01:32, 4 agents, 0 errors):**

7. **IDEA-100 / P2-06 (genealogia) → el kit de Gemini s'ha de mesurar contra els 15 criteris de R7G-9.** L'«Arbre Genealògic» del COMMIT R6 és **només una targeta**: `obrir: null` i `estat: 'pendent'` (R7G-9-01, sostinguda). Hi ha bloquejos sostinguts que s'han de resoldre abans de qualsevol integració:
   - el contracte de dades personals no té categoria per a dades de tercers (R7G-9-06);
   - l'entrevista amb la IAIA xoca amb la promesa «no s'envia enlloc», i el text diu «tres o quatre preguntes» quan l'especificació en mana una (R7G-9-07);
   - les dades de vius i menors i la compartició entre veïns no tenen RLS ni revocació (R7G-9-08 i 9-09);
   - les esqueles no tenen origen (R7G-9-11);
   - la regla anti-al·lucinació només és text (R7G-9-14).

   **Rebutjar** COOP/COEP globals (trencarien els iframes d'À Punt i YouTube) i qualsevol `'unsafe-eval'`. Si cal WASM, només `'wasm-unsafe-eval'`. Millor encara, usar `creaMagatzemIdb` (R7G-9-03 a 9-05). Hi ha un **error viu** que no depén del kit: el text NLnet de `pageContent.r10.js:122` (i les seues 3 traduccions) descriu una veu local que no té codi (R7G-9-02). L'oracle del detector de contradiccions és `l9_matriu_contradiccions.mjs` (12/12).

8. **IDEA-101 (nomenclàtor) → NO implementable tal com està escrita.** Cada fila de `towns` és un tenant amb registre obert, i no hi ha cap camí de servidor per a crear pobles (R7G-10-02, P0 sostinguda). El poble de la persona és text, i els homònims col·lapsen (R7G-10-01). `/registre` envia el poble abans que la persona existisca (R7G-10-13). La comarca no és una dada estatal (R7G-10-05). L'slug col·lidix entre homònims (R7G-10-07). La llicència i les xifres no estan verificades (R7G-10-04). El «22/560» no es pot reproduir (R7G-10-03). **Cap kit pot crear pàgines `/pobles/:slug` des del client.** El disseny segur passa per: el codi INE com a identitat, una funció de servidor amb límit de freqüència i `noindex`, i només noms oficials i cooficials de la font. El format és a `idea-101_format_nomenclator.md`. Es pot reutilitzar el Combobox ARIA que ja existix (R7G-10-11).

**Decisions del Mestre pendents en R7 (recull):**
- D-R7-1: `file` i `type_label` d'events (R7G-1-07).
- D-R7-2: el model de consentiment d'IDEA-103.
- D-R7-3: esmenar o no les afirmacions públiques de `/page/fediversity` i NLnet (R7G-5-05, 5-07, 9-02).
- D-R7-4: la revisió jurídica de la genealogia i del joc del micro.
- D-R7-5: la font i la llicència del nomenclàtor.
- D-R7-6: el desplegament de `d79a0b530` (R7G-0).

`01:43` · **Kits de Codex (01:41):** el Gauntlet dels kits R13-R17 corre en el workflow `wf_dc294655-07e` (carrils K1-K6 + contraauditoria), amb les àncores `R7G:K1:FI`…`R7G:K6:FI` dins de R7G-7. Per reprendre'l: `Workflow({scriptPath: "/Users/javillinares/.claude/projects/-Users-javillinares-Documents-Antigravity-Som-de-Poble/25410edd-65c0-454d-b959-802b3e134b4f/workflows/scripts/gauntlet-kits-codex-r13-r17-wf_dc294655-07e.js", resumeFromRunId: "wf_dc294655-07e"})`. **A la Fase 2:** integrar els kits NOMÉS segons el «Veredicte d'àrbitre K1…K6», i aplicar-los en l'ordre de la cadena (R13 → R14 → R15; R16 i R17 van a part). Abans de qualsevol `apply`, cal tornar a comprovar el CAS, perquè l'arbre viu pot haver canviat des de les 01:45.

<!-- R7G:S8:FI -->

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Commits de l'onada, tots amb el hook sencer i sense `--no-verify`:** `9a382bdd1` i `a407680a6` (COMMIT-0), `bd84101dd` (R1), `8f4559b3b` (R2) i **`4ab2d1527` (R3, arbre `c0070b868fa7ea63539686ee7b03e94893135eca`, lease `be024b53-ab5b-4e7f-9920-afe4d06e61d6`)**. Pujats a `fork/backup-notes-publish` (`903fb2f7c..4ab2d1527`).
- **COMMIT R3:**
  - Vitest sencer: 1.830 fitxers i 32.700 proves en verd. Els 2 fitxers en roig són els mòduls retirats durant l'execució.
  - ESLint 0, teclat PASSA, `design_guard` 0/0, frontissa 16/16, editorial sense errors i build exit 0 (240.326 B gzip).
  - `run-portes --nomes-portes` passa sobre l'arbre exacte.
- **Desplegament R3:** `index-yR1QQLN5.js` a `socdepoble.org` i `socdepoble.cat`; API del Node 0 en 200. Sonda P0-16: 48 visites, 0 errors de l'app, 0 avisos i 0 excepcions; només el 404 conegut de la RPC de D-10.
- **Veredicte final R6 de Codex:** no s'integra. 52 agents, 47 verificades, 9 refutades i 38 vives (3 P1, 10 P2 i 25 P3). Detall a «Troballes».

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Les troballes de l'eixam T7a es fan sobre una instantània APFS de les 16:48; el viu es pot moure mentre treballen.
- No inicie sessió a cap servei ni escric al Supabase remot: la prova E2E és anònima.
- **Aterratge per quota (23:00 CET).** A petició de MarIA he aturat el vigilant de kits i no he obert cap Gauntlet nou. **Queden sense auditar, com a relleu:** el kit R7 de Codex (`…_r7_workspace_activacio`, encara sense segellar), els kits r9 i `xat_control_i_mastodon_ux` de Gemini (posteriors al Gauntlet de la v3) i l'informe de Codex v3.4. Els pegats de les correctores de R3 no han passat la revisió adversarial en còpia neta (vegeu COMMIT R3).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261104_1636_pla_implementacio_teler_node0_postgres_mastodon_xat_i_fediversity]]
- [[261104_1636_prompt_teler_node0_postgres_mastodon_xat_i_fediversity]]
- [[03_llibre_mestre_tasques_i_idees]]
