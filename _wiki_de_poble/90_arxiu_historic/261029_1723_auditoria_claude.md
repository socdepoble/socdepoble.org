---
type: informe
status: esborrany
description: 'Informe de Claude Opus 5.5 Ultracode sobre l''Onada 261029_1605: Blocs A, B, C i deutes, amb proves, portes i cicles de Gauntlet.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:32317bfa-85dd-441f-920b-9b9a825de31e
---
# Auditoria Claude de l'Onada 261029_1605: Àlbum i Gestor d'Arxius Locals, Negreta al Xat i deute E2EE/PWA

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:32317bfa-85dd-441f-920b-9b9a825de31e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T16:23:05.709Z |
| Modificació | 2026-10-29T16:23:05.709Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 · Ultracode (claude-opus-5-5) |
| Tokens consumits | En curs (eixams de subagents; xifra final al tancament) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-29T16:23:05.709Z: esborrany creat; contingut i verificació pendents.
- 2026-10-29T16:30:00Z: **relleu de progrés (canal viu, lliçó 261003)**. Reconeixement acabat; construcció en marxa. Aquest document es reescriu sencer al tancament.
- 2026-10-29T17:50:00Z: **relleu de progrés**. Carrils AM, B, C1a, C1b, C2 i D acabats en verd (proves, ESLint, `design_guard` 0 crítics, Persistència 0); AU (interfície del Bloc A) i l'integrador encara corren. Rebuda l'ampliació de MarIA (Blocs E, F i G, 18:38): reconeixement de només lectura en marxa. Els cicles de Gauntlet es faran sobre A–G junts quan E, F i G estiguen construïts.
- 2026-10-29T18:30:00Z: **relleu de progrés**. A, B, C i deutes integrats sense cap trencada entre carrils: suite sencera 24.971 passen / 0 fallen / 103 omeses (HEAD: 24.494 / 0 / 103), `npm run test:precommit` exit 0 (34 s), `npx eslint src tooling scripts tests --max-warnings=0` exit 0, `design_guard` 0 crítics, Persistència 8 → 0 a `src/`. Llegides les auditories de Gemini (1858) i Codex (1859): les seues troballes (QA-A01..A05, B01..B03, C01..C02, OBS-F1, F2, G1) entren com a llavors fixes del Gauntlet. IDEA-57 (matriu D01–D15) rebuda: reconeixement dels deutes de codi en marxa.
- 2026-10-29T19:05:00Z: **relleu de progrés**. Reconeixement d'E, F i G acabat amb crític de completesa (5 fitxers compartits ordenats per àncores; 12 preguntes amb decisió segura). Construcció en sis carrils paral·lels: E (workspace de 3 columnes + QA-A01b i A04), motor (QA-A02, A03, A05), C-fix (QA-A01a amfitrió, C01 retenció de `blob:`, C02 Storage bloquejat), xat-text (QA-B01..B03 i després F.2 IAIA), F.1 (quatre actors) i G (HMR + versió clicable a la Consola). **Pregunta oberta per al Mestre:** l'UUID remot del seu compte; sense ell, en remot el clic a Javi obri la conversa de servei tècnic de només lectura (mai s'identifica Javi pel slug, per evitar suplantacions).
- 2026-10-29T20:15:00Z: **relleu de progrés**. Deutes d'IDEA-57, primera tanda (verificador adversarial: tots correctes): P1-24 bot (índex hidratat, Wiki sense camí doblat, frontera pública per a cada document, historial fitat, `sessions` exportat; 13 proves, 11 mutants caçats; el bot encara no arrenca per dependències, persona i Docker), P1-26 (`App.appsLocals` hermètica en qualsevol ordre), P1-27 (`signal` real a 5 crides de Storage), InnerHTML (les 8 de proves: verd canviant l'API de les proves, sense millora de seguretat; el remei de fons és la porta, carril de Codex) i Catàleg (fals positiu). P1-22, P1-16 i P1-26 («censImatges») ja estaven fets en codi: el Llibre Mestre va endarrerit.
- 2026-10-29T21:20:00Z: **relleu de progrés**. E, F i G construïts i integrats: suite sencera 25.195 passen / 0 fallen / 103 omeses, `test:precommit` exit 0, ESLint exit 0, `design_guard` 0 crítics, InnerHTML verd; consola a 0 errors i 0 avisos a `/multimedia` (14 arxius trampa oberts, només ids opacs a la URL), `/xat` (4 actors amb foto, cap «GD», la IAIA respon a l'instant) i `/versions`. Llavors de Gemini/Codex: totes corregides amb prova de regressió, excepte QA-A03 a mitges a l'editor (entra al cicle 1). **Gauntlet cicle 1 en marxa** (7 lents, refutació adversarial, correctors per àrea, porta).
- 2026-10-29T23:05:00Z: **relleu de progrés**. Gauntlet cicle 1 tancat: 65 troballes brutes, 58 úniques, 36 confirmades per refutadors i corregides (48 correccions amb prova, incloent-hi els lots de deute d'IDEA-57: claus en ús, noms accessibles, taula de /poblacio, quadre ISO, classes mortes i P1-71 complet amb els `createContext` en mòduls estables), 11 per a decisió del Mestre i 11 refutades. La porta del cicle 1 s'ha fusionat amb la del cicle 2 per l'arribada de noves ordres. QA-R2-02 (ESLint de tot `bot/`) fet: exit 0, bot 13/13. QA-R2-01 i QA-R2-10 ja estaven resolts al codi viu (verificat). **En marxa:** constructors d'IDEA-58 (fletxes a les columnes i graelles), IDEA-31 (Traductor Sobirà amb Apertium sense clau, `/__iaia/traduir`, `traductor-url` sempre, /traduccions) i llavors R2 de Codex (03, 04, 05, 06, 09); i l'estudi NLnet NGI Fediversity (2026-08-1a6) en un flux de només lectura. **Fet mesurat:** `apertium.org/apy/translate` torna 500 hui; `beta.apertium.org` (mateix projecte) tradueix bé; Apertium no té català→alemany.
- 2026-10-29T23:50:00Z: **relleu de progrés**. **IDEA-58 fet**: fletxes, Home i End a les columnes 1 i 2 de `UniversalWorkspace` (val per a /multimedia, /wikidepoble, /disseny, /notes, /lector), Escape i ← de tornada a la llista, i graelles 2D per geometria (`.photo-grid` i `ul.sdp-arxiu-local__graella`; el `.sdp-arxiu-local__album` del Llibre Mestre no existix); 53 proves noves, 16 mutants morts, consola a 0 i DOM de l'arbre idèntic (Llei del Píxel). Nota: el criteri 2.1.1 de WCAG és de nivell A (l'AAA és el 2.1.3). **Llavors R2 de Codex fetes**: QA-R2-03 (època en tria, reconnecta, vincula i desat), QA-R2-04 (`OBLIT_CARPETES_PENDENT` i cap autoobertura fins a confirmar la neteja), QA-R2-05 (reserva pública de Sóc de Poble cap a /socdepoble sense slug privilegiat), QA-R2-06 (paritat de barres lineal; 50.000 barres < 50 ms) i QA-R2-09 (/versions diu que l'E2EE està preparat darrere d'una bandera apagada); verificat per mi: 135/135. **Ordres noves del Mestre en marxa**: pàgina /fediversity amb targeta del Mur i dues imatges; P1-23 (ActivityPub estàtic a `/ap/`, exportació Open Data per municipi, `flake.nix`); traductor directe del navegador a socdepoble.org amb `beta.apertium.org` primer (decisió del Mestre). **Recerca NLnet**: la crida Fediversity es va tancar l'1-8-2026 (avaluació de 3 a 5 mesos); el 3-11-2026 és el termini d'altres crides; la política d'IA d'NLnet v1.1 exigix registrar model, prompts i eixida si s'usa IA per respondre l'avaluació.
- 2026-10-30T02:40:00Z: **relleu de progrés (guàrdia nocturna, ordre `261030_0252`)**. P1-23 reconciliat i tancat dins del que es pot comprovar en esta màquina: proves de les quatre peces en verd, ESLint net, build reproduïble byte a byte amb el mateix `SOURCE_DATE_EPOCH` (també sense xarxa); `flake.nix` continua sense verificar amb Nix; 16 decisions per al Mestre (WebFinger a Firebase, pobles federats sense adhesió, llicències de l'Open Data, entre altres). Transacció de govern aplicada amb l'executor i el segell verificat (`segella.mjs --check`): tres lliçons 261030 a `sdp-universal-page` (zero taules de prosa, hipervincles vius, H3 just després de l'entradilla), la de l'idioma a `core-identitat`, la del punt gamberro a `core-calibratge-visual-nano` i tres línies al LEDGER. Les eines `seal-skills.mjs`, `check-governance.mjs` i `verify-ledger-integrity.mjs` que nomena l'ordre no existixen al repositori: s'han usat `executor-mutacio.mjs` i `segella.mjs --check`. Llegides les auditories de tancament de Gemini (`0255`) i Codex (`0256`); en marxa el cicle 2 del Gauntlet amb vuit àrees (traductor al navegador i al servidor, pàgines, E2EE, xat, teclat, federació i vocabulari). Decisió del traductor: GL per Apertium (només la beta, l'extrem principal no té el parell), EU i DE per MyMemory al navegador amb salvaguardes; Lingva descartat (rascla Google Translate i la instància oficial torna el català sense traduir).
- 2026-10-30T05:30:00Z: **relleu de progrés**. Cicle 2 tancat: 8 àrees construïdes (G1–G10 i C1–C11 verificats al codi i aplicats o refutats amb evidència), 45 troballes brutes, 29 úniques, 19 confirmades i corregides, 8 marcades per al Mestre, 2 refutades. Suite sencera 25.728 passen / 0 fallen / 103 omeses (+176), `test:precommit` exit 0, `test:node` 1.591 / 0, ESLint exit 0, `design_guard` 0 crítics, build web exit 0, segell verd. Encara roig: `tractor-vocabulari` (13 entrades de llei dura), `tractor-psicopatia` (5 contradiccions en documents de la Wiki, d'una altra mà), la frontissa (6 empremtes per aprovar) i 2 errors de consola pel 503 del basc al servidor de dev. Rebuda l'Ordre 0 del Mestre (03:49): barra de píndoles del xat només amb la lupa i lletra de la llista a 20/18 px. En marxa la Fase 3 amb el cicle 3: Ordre 0, Web Push cec (inert), Viquipèdia (clic per a carregar), P1 executables, destins del traductor declarats per l'amfitrió (cap petició que fallarà), Traduir apagat en contingut no públic, vocabulari i residus.
- 2026-10-30T08:30:00Z: **relleu de tancament de la guàrdia nocturna**. Fase 3 i cicle 3 tancats: 23 troballes úniques, 16 confirmades i corregides (cap P0/P1), 2 per al Mestre, 5 refutades. Suite sencera 26.018 / 0 / 103, `test:precommit` i `test:node` exit 0, ESLint exit 0, `design_guard` 0 crítics, build web exit 0, segell verd, consola a 0 errors en 62 escenaris. Aprovades les cinc empremtes autoritzades pel Mestre (`fediversity`, `fedivers`, `consola`, `cervell`, `legal`); `drets-autor` i `versions` queden per al Mestre. El pressupost setmanal ha arribat al 94 %: no s'ha fet el cicle 4, ni la mesura nova de la matriu D01–D15, ni l'actualització del Llibre Mestre, ni la reescriptura d'este document. Tot està resumit, amb les decisions pendents, a [[261030_1533_informe_matinal_opus]].
- 2026-10-30T14:32:00Z: **relleu de progrés (cicle 4, corrector de l'àrea vocab)**. Set dels huit CSS de secció són ara blocs de `src/css/modules.css`; `MapaFotografic.css` queda per risc estructural (el Leaflet adoptat sense capa guanyaria qualsevol regla en capa) i la línia base l'alinea l'orquestrador amb l'executor. Llei del Píxel: estil computat idèntic, amb 0 diferències a l'intercanvi del constructor (209 captures vàlides) i 0 en les 72.074 comparacions del crític. No es pot dir «0 píxels»: a l'intercanvi, 32 captures canvien pel rellotge de la Gestoria (13:39 → 13:40) i per soroll de rasteritzat (±1–6, a les icones del rail i a la il·lustració del xat), i la línia d'«ara» del calendari canvia de DOM amb l'hora; en viu, 74 de 203 per JSX d'altres mans. L'script que donava «0 píxels» només mirava el canal alfa (`getbbox()` de Pillow). El quadern /disseny ja no anomena `pecesApps.css` ni `catalegColleccio.css`, i una guarda a `allLoaders.test.jsx` ho fixa per a tots els espècimens i les fitxes del manifest.
- 2026-10-30T15:50:00Z: **relleu de progrés (cicle 4 tancat)**. 9 àrees construïdes (vocabulari, WebFinger, Llibre, push, traductor, xat, Viquipèdia, E2EE i dades, Consola); 38 troballes brutes, 30 úniques, 17 confirmades i corregides, 5 per al Mestre i 8 refutades. Suite sencera 26.211 / 0 / 103 (+193), `test:precommit`, `test:node` i ESLint amb exit 0, `design_guard` 0 crítics, psicopatia verda, build web amb `host-meta` i els JRD de WebFinger, consola a 0 errors en 111 escenaris. Encara roig: el vocabulari (només `MapaFotografic.css`, que s'alinea a la línia base per risc estructural, tal com permet l'ordre), la frontissa (la clau `fediversity`, canviada pel text de WebFinger) i la signatura del LEDGER, que vaig deixar trencada en la transacció de les 03:29 (s'hi van escriure tres línies conservant el hash vell); les tres es resolen en la transacció de tancament. Fora de la llista del Mestre, el cens de `run-portes` dona 15 portes roges més, que l'informe final separarà. Matriu D01–D15: 6,7 de mitjana (línia base 6,2). L'ordre d'usabilitat de les icones de columna també està feta i verificada. En marxa: la reparació didàctica de `/consola`; després, les decisions A1–A4 del workspace i les tasques B1–B4.
- 2026-10-30T16:20:00Z: **relleu de progrés**. Reparació de `/consola` acabada: títols de targeta sense lletres òrfenes (6 → 0; a la Consola incrustada de la Wiki, 13 → 0), graella amb el mínim canònic de 360 px, files amb alçades i peus alineats (34 files desquadrades → 0), resum de problemes net a la coberta, miniatura de l'Índex fora i Índex didàctic (13 H3 i 114 H4, cadascun amb què és, què diuen ara les dades i què queda) en columna de lectura; 11 troballes del verificador, 10 corregides. Els colors segueixen la intenció del Mestre (H3 blau marí, H4 terracota) amb els tokens canònics (`--sdp-accio-text` i `--sdp-accent-titol`), perquè `--sdp-color-primary` no existix. Per al Mestre: el `anywhere` de la previsualització de Connectar, el quadrat de preu de l'espècimen UniversalCard de `/disseny` a 375 px i un títol de targeta que accepte `<wbr>` per als identificadors llargs. En marxa alhora: f4a (decisions A1–A4 del workspace i residus del cicle 4) i f4b (B1–B4: il·lustracions del Govern, `/__iaia/govern.json`, copiar l'enllaç al visor i vinyetes a sang).
- 2026-10-30T17:55:00Z: **relleu de progrés (ordre del Bloc de Notes)**. A `/notes` CARPETES arrenca oberta com a la resta d'espais: fora `COLUMNES_INICIALS` de `NotesSection.jsx`. A més, l'UniversalWorkspace arrenca amb la navegació plegada en rail quan la finestra fa de 721 a 1023 px (`navegacioPlegadaEnArrencar` i `navegacioPlegadaDeLaFinestra` a `layout/graella.js`, amb els talls `estret` i `compacte` que ja hi eren), i amb les tres columnes obertes des de 1024. És només l'estat de muntada: un `columnesInicials` explícit i el mode compacte manen. Mesurat en viu: `/notes` a 1440 i 1024 oberta, a 1023, 900 i 721 en rail, a 720 vista mòbil (comença per les carpetes); `/disseny`, `/wikidepoble`, `/multimedia` i `/app/lector`, en rail a 900 i obertes a 1440; cap desbordament. Proves noves a `graella.test.js` i `UniversalWorkspace.columnes.test.jsx`; ajustades les de `/notes` (URL, R8.9, capçalera a 820) i la roda dentada (ara a 900). Layout, workspace i notes: 1.387 verdes. Una de `NotesSection.lector.test.jsx` cau, però no depén d'esta ordre (entra en mode Desa i jsdom fa 1024): es revisa quan acabe f4a, que toca les columnes. Les 7 roges de Multimèdia són del B3 de f4b, encara en marxa. El contracte de graella no canvia (cap prop d'`AppGridShell` ni d'`AppGridColumn`).
- 2026-10-30T19:55:00Z: **relleu de tancament del lot 261030** (ordre del Mestre al xat, ~19:15).
  - **Frontissa:** `fediversity` aprovada amb l'autorització del Mestre (empremta bc82b845…, 13.239 caràcters d'HTML): 16/16.
  - **Prova del Lector** (`NotesSection.lector.test.jsx`, l'antiga 294): no era cap regressió. La prova consultava l'arbre de CARPETES abans que AppLector acabara de llegir el seu magatzem («Obrint el lector…»), i també queia a HEAD amb la màquina carregada. El remei només toca la prova, que ara espera l'arbre, i n'afig una de regressió amb el disc lent. Resultat: 19/19, i 3 de 3 verificadors sense refutació. El comentari de `maxWorkers` de `vite.config.js` ja no la cita com a fallada per contenció.
  - **f4a (A1–A4, C i D):** 22 troballes úniques. Se n'han corregit 14, 6 són per al Mestre i 2 eren falses. Porta d'àrea verda, amb 15.782 proves.
  - **f4b (B1–B4):** 21 troballes úniques. Se n'han corregit 15, 3 són per al Mestre i 3 eren falses. Porta d'àrea verda, amb 6.867 proves.
  - **Llibre Mestre:** quatre SHA corregits, d'abans d'un rebase. Cada parell té el mateix patch-id i un diff buit: `32eabf12` → `49546fe51`, `4d67f7ab` → `5d9fc2bf0`, `218433ff` → `61ffecad5` i `cefc12ab` → `beae8686a`. El Govern viu passa de 18 a 26 files segellades, de 86.
  - **Transacció de governança** (Reflex `85f7528c`, executor i rebut consumit): línia base del vocabulari amb `MapaFotografic.css`, lliçó de `sdp-app-grid-shell`, ESTAT del tancament i LEDGER signat de nou. Segell de les skills: `2310ca7a`.
  - **Porta final** (seqüencial, de 20:36 a 20:52):
    - **La llista del Mestre, tota en verd:**
      - vocabulari, psicopatia, frontissa (16/16), `segella --check` i `verify-ledger`;
      - Vitest sencer: 26.427 passades, 0 caigudes i 103 omeses, en 1.523 fitxers;
      - `test:node`: 1.635 passades i 0 caigudes;
      - `test:precommit`: 5.263 + 270 passades i 0 caigudes;
      - ESLint de `src tooling scripts tests bot`: 0 errors i 0 avisos;
      - `vite build`, en un directori de proves.
    - **També verdes:** `design_guard` (0 crítics, 12 avisos), graella, persistència, estils en línia, innerHTML i la consola (0 errors als escenaris c2, mm4 i teclat).
    - **Roges, totes per documents de l'Escriptori, cap per codi:**
      - **Olivera i SCC:** l'informe matinal ara es diu `261030_1533_informe_matinal_opus.md`. L'índex hi té sis àncores amb el nom antic, i el fitxer nou no hi està ancorat. Ho repara MarIA o el Mestre amb `porta-olivera.mjs --repara`.
      - **«Contracte documental» de `run-portes`:** set documents tenen el torn caducat (entre ells esta auditoria) i sis no tenen rebut del Reflex. Para el cens a la primera porta.
  - **Per al Mestre:**
    - **De f4a (6):** la roda retallada de 721 a 830 px, la documentació dels talls, el mot vetat al nom d'un fitxer, la franja tàctil del separador, la icona de la columna 2 sota el separador i el separador del Xat.
    - **De f4b (3):** la caducitat de 24 hores de la matriu del Govern, el retall de la Gestoria i la fila de l'enllaç fora de l'Arxiu.
    - **D'abans:** el `anywhere` de Connectar, el quadrat de preu a 375 px, el `<wbr>` als títols i el 404 de la funció Edge `noticies`.
  - **Res commitejat ni desplegat.** Els dos intents de la transacció que el Reflex va rebutjar (el nom de la petorreta era massa curt) han deixat dues sessions obertes, que caducaran soles.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Estat del torn (relleu de progrés, 17:30 CET)

- **Torn:** `torn_438fe070-961a-4576-bb08-f597a4daf763` (actor `claude`, abast `code`). A les 16:32 vaig obrir per error un torn `agent-local` (`torn_c532eed6-…`) en cridar `obrir_torn.mjs --help`, que no té ajuda i obri un torn; el fitxer no versionat continua a `.agents/runtime/turns/` perquè `.agents/` no és del meu carril. MarIA pot tancar-lo o arxivar-lo.
- **Base:** `3c4709af9` i, des de les 16:36, `d6ab025f4` (docs del Mestre: operacions físiques d'A.3 i fototeca mixta, ja incorporades a l'encàrrec).
- **Fet:** reconeixement amb set exploradors de només lectura i un crític de completesa. Les especificacions i les decisions són a l'scratchpad de la sessió.
- **En marxa:** construcció en cinc carrils paral·lels sense fitxers en comú (A motor → A interfície, B, C.1 dades → C.1 interfície, C.2, deutes) i un integrador final. Després: cicles de Gauntlet adversarial i escombrat de la consola a `http://localhost:3340`.
- **Arbre:** cap commit meu. Carrils de fitxers declarats a l'encàrrec dels constructors; `.immunitari/cron.out` és d'una altra mà.

### Correccions de fets del pla i del prompt

- `src/context/SessionContext.jsx` i `src/context/XatContext.jsx` no existixen: són `src/app/contexts/SessionContext.jsx` i `src/sections/xat/XatContext.jsx`.
- **R-02 ja està aplicat a `3c4709af9`**: els 83 PNG de `public/assets/` amb bessona `.webp` són de paleta (mode `P`, `quantize(256, FASTOCTREE)`), pesen 27,88 MB (19,04 MB de blobs únics: hi ha 31 duplicats exactes d'avatars). La xifra de 106 MB del prompt és d'abans d'eixe commit. Tornar a recodificar afegiria 16-23 MB de blobs nous a la història. Decisió: **no es toca**. Dany visual mesurat de la paleta actual respecte dels JPEG que servia la web: PSNR global 32,8 dB, bandes lleus en degradats (cels de les panoràmiques). L'alternativa sense bandes (paleta amb difusió, 33,7 MB / 22,9 MB únics) queda per a decisió del Mestre.
- `host.js` sí que pot nomenar `indexedDB` (ja ho fa); la regla de `qualitat.amfitrio` veta el text `localStorage|sessionStorage` en els fitxers d'amfitrió, i `tractor-persistencia` el veta fora de `src/config/storage.js` a tot `src/`.
- La CSP de `index.html:17` no admet `blob:` a `frame-src`: un `<iframe src=blob:>` per al PDF trencaria el criteri de zero errors de consola.

### Decisions per defecte (a ratificar pel Mestre)

1. **PDF:** s'obri en una pestanya nova amb un enllaç `blob:`; no es toca la CSP. Per al visor integrat caldria afegir `blob:` a `frame-src`.
2. **Eliminar:** definitiu (l'API no envia a la Paperera de macOS), només fitxers o carpetes buides, sempre darrere d'un diàleg destructiu que ho diu.
3. **Moure i reanomenar:** còpia per trossos, verificació de mida i SHA-256 al destí, recomprovació de l'origen i només llavors `removeEntry`; mai sobreescriuen.
4. **«Desar .webp i moure l'original»:** destí `originals_raster_public/` + la ruta de l'original sense la primera subcarpeta.
5. **Negreta:** comportament literal del prompt (embolica la selecció amb `*…*`; sense selecció, `**` amb el cursor al mig). La barra flotant i l'embolcall automàtic de paraula queden com a idea pendent.
6. **LRU dels `blob:` del xat:** segons el disseny E2EE §4.7, 48 MB al mòbil i 100 MB a l'escriptori (el prompt deia «48 objectiu, 100 màxim»).
7. **Ordinador compartit:** en tancar sessió s'obliden les carpetes locals recordades.
8. **Fitxers `.html`, `.css`, `.js` i `.svg` locals:** mai es renderitzen com a pàgina (un `blob:` d'HTML o SVG executa codi a l'embed de WordPress, que no té CSP); l'SVG només com a imatge `data:`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Línia base (HEAD `3c4709af9`, 16:32)

- `node tooling/gates/design_guard.mjs --arrel=src`: 0 crítics, 12 avisos.
- Subconjunt del criteri 1 i veïns (multimèdia, xat, privacitat de la Gestoria, `projecteIos`, xifrat del xat, sessió, `qualitat.amfitrio`, actius públics): 149 fitxers, 2.143 proves en verd, 3 omeses.
- `npx eslint src tooling scripts tests --max-warnings=0`: exit 0.
- Suite sencera (mesurada per un explorador): 24.494 passen, 0 fallen, 103 omeses.
- Consola del navegador a `http://localhost:3340/multimedia` (també la pestanya «Carpeta local») i `/xat`: cap error ni avís.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Relleu de progrés: la construcció i el Gauntlet encara no han acabat.
- Les operacions físiques sobre el disc no es poden exercitar en Chrome headless (el selector natiu no s'automatitza i el camí de Safari/Firefox és de només lectura): es proven amb dobles i es declararà.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
