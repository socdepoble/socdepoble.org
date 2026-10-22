---
type: informe
status: esborrany
description: 'Claude als torns 261021_2345 i 261022_0225 (Gauntlet): MCR, crítica amb Storage real, correccions verificades, beta.3 WP de 2.212.160 B, didàctica del veí i REA d''Obsidian 1.14.4.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_26323853-dc67-4268-8b87-72e38f13f063:88de4b03-2dfb-47bf-8256-a4d94b1fe670
---
# Auditoria Claude · verificació adversarial, didàctica del veí i REA d'Obsidian

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_26323853-dc67-4268-8b87-72e38f13f063:88de4b03-2dfb-47bf-8256-a4d94b1fe670 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T23:44:21.495Z |
| Modificació | 2026-10-22T04:10:00.000Z |
| Propietari | claude |
| Aprovació humana | execució autònoma pel mandat del Mestre: els prompts 261021_2345 i 261022_0225 enganxats al xat; no hi ha commit, desplegament ni migració |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) amb workflows multiagent: 6 workflows i 71 subagents |
| Tokens consumits | ≈17,8 M als subagents (sumats dels 6 workflows). El fil principal no es mesura amb fiabilitat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-21T23:44:21.495Z: esborrany creat i torn `torn_26323853` obert. Relleu 01:50: repartiment de carrils amb Codex.
- 2026-10-22T00:05Z: relleu 02:05 sobre el commit global `d31c1ccd` i les primeres comprovacions.
- 2026-10-22T00:40Z: relleu 02:40, amb els fitxers que Claude reserva per corregir.
- 2026-10-22T01:45Z: relleu 03:45. Claude allibera les reserves i passa a criticar el codi Gauntlet de Codex.
- 2026-10-22T02:20Z: relleu 04:20, amb el dictamen del crític (dos bloquejants) i les noves reserves.
- 2026-10-22T04:10Z: reescriptura final. Porta les dues MCR, la crítica, les correccions verificades, la beta.3, l'acord adversarial i els pendents del Mestre. **S'alliberen totes les reserves de Claude.**

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. El torn en un minut

- **Dos encàrrecs, un sol torn.** El Mestre va enganxar al xat el prompt 261021_2345 (alleugeriment de WP, PWA i didàctica, 7 tasques) i, a les 02:4x, el del Gauntlet 261022_0225 (6 tasques). Els dos es responen ací amb la Matriu de Conformitat de Requeriments (MCR, skill core-gauntlet-loop).
- **El repartiment real.** Codex ha construït la major part de les dues onades. Gemini ha fet bancs d'estrès i arbitratge. Claude ha fet:
  - la verificació adversarial amb context net;
  - una auditoria didàctica i una REA d'Obsidian independents;
  - les correccions dels defectes confirmats;
  - els carrils que ningú no havia acabat: la fitxa de Javi, el termini de 3 s, el carril del xat i el bloc de didàctica dels plugins.
- **El que Claude ha trobat que els altres no deien:**
  1. **Cap pujada multimèdia real funcionava.** El disparador de `storage.objects` tombava la prova de permisos de storage-api. Ho va reproduir el crític contra un Storage de Supabase de veres en Docker; l'auditoria de Codex modelava Storage com una taula plana. I **cap CSP permetia reproduir àudio o vídeo** (no hi havia `media-src`).
  2. **Codex va disseccionar l'Obsidian que no s'executa.** Va analitzar el `obsidian.asar` 1.5.8 de reserva; el que carrega de veritat el carregador és `~/Library/Application Support/obsidian/obsidian-1.14.4.asar`. La REA de Claude és sobre la 1.14.4.
  3. **El sistema sí que es pot ofegar.** Amb 7.000 nodes el graf va a 5–9 fps, i seleccionar-ne un costa més d'un segon. Amb 10.000 missatges, cada tecla del xat repinta les 10.002 bombolles (1–3 s per tecla). Els bancs de «10.000 usuaris» de Codex i Gemini només exercitaven una funció d'adaptador amb mocks.
  4. **La correcció del favicon no arriba a producció.** Producció és Firebase Hosting, i Codex va tocar `vercel.json`. `/favicon.ico` encara respon `text/html`. A més, **`https://www.socdepoble.org` falla el TLS** (el certificat és de `firebaseapp.com`).
  5. **El zip lleuger de WordPress no és el del directori de WordPress.org.** `socdepoble.zip` (2,2 MB) és el del canal propi, amb actualitzador. El zip del directori continua fent 9,8 MB. Un build de prova de Claude demostra que el del directori pot baixar a 1.868.769 B, però a costa del risc de la guia 7 de WordPress.org. Això ho ha de decidir el Mestre.
- **Res d'açò està desplegat ni publicat.** Les migracions no s'han aplicat, no hi ha commit de Claude i socdepoble.org continua sent el desplegament del 21-10 a les 20:11. Els beta testers no veuran cap canvi d'esta nit fins que algú redesplegue.

### 1. MCR · prompt 261021_2345 (alleugeriment WP, PWA i didàctica)

| Requeriment | Estat | Evidència | Qui | Què falta |
| :--- | :--- | :--- | :--- | :--- |
| T1 · Amagar el botó PWA de la barra negra i conservar el codi | `[FET]` | `src/app/App.jsx:718-722` (comentari de reactivació) i `src/pwa/instalacio.js` (capçalera de la pausa). 160 proves de PWA verdes. | Codex (d31c1ccd) i Claude (comentaris) | Arriba a la gent quan es redesplegue la web |
| T2 · ZIP del connector per davall de 2,5 MB | `[FET]` en el canal propi; `[NO FET]` en el directori | `_builds_de_poble/wordpress/socdepoble.zip`, **2.212.160 B (1.1.10-beta.3, §6.10)**. Claude ha provat la beta.1 en Chrome sense capa: 17 rutes, 92 imatges de `https://socdepoble.org/assets`, 0 locals, 0 errors i 233 camins censats. La beta.3 s'ha provat igual sobre 4 rutes | Codex (beta.1 i beta.2) i Claude (verificació i beta.3) | El del directori de WordPress.org encara fa 9,8 MB: decisió D-WP-1 (§9) |
| T2 · Les imatges es resolen contra l'origen canònic | `[FET]` | `src/config/assetResolver.js:137` (`RE_PREFIX_EXTERN`) i `vite.standalone.config.js` (perfil `SDP_MITJANS=externs`). L'origen respon `image/*`, CORS `*` i 404 de veres | Codex | Cap versió de camí: si es renomena un fitxer de `public/`, es trenquen les instal·lacions que ja hi ha |
| T3 · Logo verd quadrat per a la comunitat (prou de «SD») | `[FET]` | `src/sections/xat/caraDeSocDePoble.js` nou: una sola regla, per identitat, al carril, a VistaComunitats i a Ajustos/Preferits | Codex (fila) i Claude (la resta de superfícies) | En remot sense identitat resolta, ix un instant abans que arribe l'id |
| T3 · Resposta o benvinguda de la IAIA en remot | `[FET]` amb límits | `BENVINGUDA_IAIA` amb la frase del Mestre, cortesia marcada com a automàtica i ConsultaIAIA personal | Codex; crítica i correcció de Claude (§6) | No és cap resposta del servidor: un bot real necessita infraestructura (§9) |
| T3 · «Connectar-se / Registrar-se» per al visitant | `[FET]` | `AccesAlXat` dins del cos de la llista; un sol parell de botons (fora el «Registra't» vell, que anava a `mode=entrar`); compacte en pantalles baixes. 469 proves verdes | Codex i Claude (XAT-1, 4 i 6) | — |
| T4 · Persona: l'avatar només a la barra taronja | `[FET]` | `PerfilPublicSection.jsx` i `PerfilEditor.jsx` en mode lectura (PERF-5) | Codex i Claude | Les pàgines de detall encara dupliquen la cara de qui signa: decisió D-PERF-1 |
| T5 · Auditoria didàctica de 5 pantalles | `[FET]` | Annex `_investigacio_ia_de_poble/261022_0150_claude_auditoria_didactica_vei.md`: 82 troballes (24 altes) i text proposat llest per a enganxar | Claude; Codex té la seua pròpia | La major part del text proposat encara no s'ha aplicat (P0/P1 de l'annex §5) |
| T5 · Prou d'«Obrir» que no fa res; «Desactiva esta eina» | `[FET]` | `PluginPage.jsx`: `senseDesti` decidix per la dada, per a **tots** els plugins sense destí (abans només Gestoria i RSS); motius en planer i en 5 idiomes; focus. 536 proves verdes | Codex (Gestoria i RSS) i Claude (generalització, F1–F8) | El botó «Descarrega / Instal·la» `[NO FET]`: no hi ha cap mecanisme d'instal·lació (D-PLUG-1) |
| T6 · «Connectar amb l'autor» | `[PARCIAL]` | Acció a `/connectar` que obri el xat privat per la via canònica. Corregit CA-1: en remot fallava amb ids que no eren UUID. Textos honestos i en 5 idiomes. 71 proves verdes | Codex i Claude | La taula, la RPC i la vista «qui està connectat amb qui» només estan dissenyades. Abans de migrar cal inventariar la taula viva `connections`, que no està versionada (D-XARXA-1) |
| T7 · REA d'Obsidian amb el mètode d'Emowe | `[FET]` | Annex `261022_0150_claude_manual_rea_obsidian.md`: mapa de la 1.14.4, graf de vincles, panells i manual sense codi | Claude (1.14.4) i Codex (1.5.8) | Bring! i Loyverse, al Gauntlet |

### 2. MCR · Gauntlet 261022_0225

| Requeriment | Estat | Evidència | Qui | Què falta |
| :--- | :--- | :--- | :--- | :--- |
| T1 · Prou de spinner infinit: termini de 3 s a la fitxa | `[FET]` | `PerfilPublicSection.jsx` (`TERMINI_DEL_PERFIL_MS`, avís amb «Torna-ho a provar», reserva local, `role=alert`) i `supabase/perfils.js` (pressupost compartit de 3 s i `TimeoutError`). Les proves adversàries de Codex (`PerfilPublicSection.gauntlet.test.jsx` i `perfils.gauntlet.test.js`) passen 57/57 | Claude; adversari de Codex | Els cridadors de fons (`resolEntitatDelProjecte`, `xatCorporatiu`) també cauen al termini de 3 s: decisió D-PERF-2 |
| T1 · Estrès de 10.000 usuaris amb mocks locals | `[PARCIAL]` | Arnés de Claude: 35 proves i 18 colls d'ampolla mesurats (§5). Correcció dels ALTS al §6 | Claude; bancs de Codex i Gemini | Els bancs de Codex i Gemini no són latència real ni toquen components (§4) |
| T1 · Favicon 500 i tipus MIME | `[PARCIAL]` | El 500 no es reproduïx: `favicon.svg` respon 200 `image/svg+xml`. `/favicon.ico` encara respon 200 `text/html` a producció. Codex ha afegit `public/favicon.ico` i `vercel.json`, però producció és Firebase | Codex; diagnosi de Claude | Redesplegar Firebase amb el fitxer nou i versionar `firebase.json` (D-INFRA-1) |
| T2 · Una sola fitxa de Javi Llinares | `[FET]` al codi | `src/data/agentsSeed.js` JAVI: H2 «La Torre de les Maçanes», entradilla literal del Mestre i cap cos vell. `/javillinares` i `/gent/javillinares` comprovades en Chrome. La cerca ja no repetix el poble i el directori mostra l'entradilla | Claude | `supabase/seed.sql:8` (fila 0001) i la BD viva encara tenen els textos vells. Falta l'UUID d'`IDS_REMOTS_FUNDACIONALS` (D-PERF-3) |
| T2 · Prou d'avatar de 300 px damunt de l'H1 | `[FET]` | Vegeu T4 de 261021_2345 | Codex i Claude | — |
| T3 · Notes de veu, fotos i vídeos de 10 s | `[PARCIAL]` (codi sí; servei no aplicat) | Client i migració de Codex, `2610220240_xat_adjunts_i_quota.sql`. La crítica hi va trobar dos bloquejants, que es corregixen al §6 | Codex; crítica i correcció de Claude | Aplicar la migració, posar la capçalera CSP a producció, i provar en iOS i en l'APK (§9) |
| T3 · Quota de 20 MB amb el missatge del Mestre | `[PARCIAL]` | Quota atòmica per `auth.uid` i missatge literal. Faltaven el límit de reserves i el límit de mida per tipus (§6) | Codex i Claude | Com T3 |
| T4 · IAIA viva: respostes des de la Wiki i salutació | `[PARCIAL]` | ConsultaIAIA extractiva sobre el manifest públic, amb la salutació literal. La crítica: sense llindar de rellevància, 6 de 8 preguntes reals rebien text de desenvolupadors (§6) | Codex i Claude | El pont de WhatsApp només està dissenyat. La línia mòbil (IDEA-01) està EN CARTERA |
| T5 · Loyverse i Bring! des de les captures | `[PARCIAL]` | Adaptadors purs `loyverseApi.js` i `bring.js`. La crítica: un sol modificador tombava tot el catàleg, i el nom de Bring! és una clau en alemany (§6) | Codex i Claude | No hi ha pont cap al Rebost ni el TPV, ni sessió autenticada (D-TPV-1) |
| T6 · El zip continua per davall de 2,5 MB | `[FET]` | **Beta.3: 2.212.160 B**, construïda per Claude amb tot el d'esta nit, i amb prova de fum en Chrome (§6.10) | Codex (beta.2) i Claude (beta.3) | Arriba a la gent quan es publique; el directori de WordPress.org queda fora (D-WP-1) |
| T6 · Informe i acord adversarial | `[FET]` | Este document, §7 | Claude | El consens el tanca MarIA |

Annexos al satèl·lit d'investigació (`../_investigacio_ia_de_poble/`, fora de la Wiki):

- `261022_0150_claude_auditoria_didactica_vei.md`: les 82 troballes, el text proposat i les 13 decisions.
- `261022_0150_claude_manual_rea_obsidian.md`: el mapa, el graf, els panells i el manual.
- `261022_0150_claude_especificacions_gauntlet.md`: l'arnés d'estrès i les especificacions de multimèdia, IAIA, Loyverse i Bring!, escrites abans de llegir el codi de Codex.

### 3. Verificació adversarial del torn 0141 de Codex (01:51–02:30)

**Mètode.** Workflow de 6 lents: zip de WordPress, xat, perfil i PWA, plugins, Connectar, i una diagnosi dels encàrrecs nous. Cada lent tenia un escèptic que intentava refutar cada troballa abans d'acceptar-la. Les proves són dirigides, Chrome va sense capa (headless) per CDP i tot passa en còpies fora de l'arbre.

**Resultat:** 44 troballes. 34 són reals (6 mitjanes i 28 baixes), 7 s'han refutat i 3 queden incertes.

Del que s'ha comprovat i **és correcte**:

- El zip lleuger és coherent: 330 entrades i un inventari sense cap diferència de sha.
- No hi ha secrets: només la clau anon.
- No hi ha regressió als perfils D3 ni al directori.
- No hi ha baixada de versió possible pel canal.
- L'autoria es resol des de l'original, mai des de l'URL.

Les troballes reals que pesen:

| Id | Gravetat | Què passava | Ara |
| :--- | :--- | :--- | :--- |
| PERF-1 / P4b-1 | mitjana | La fitxa fòssil de Javi encara es pintava a `/javillinares` i `/gent/javillinares`. A més, el pla descrivia malament quin text era el vell: el lema vell era «Sempre buscant el trellat.», no «Coordinador i visionari», que era el cos | Corregit per Claude (§6.1) |
| T9-1 | mitjana | La fitxa es tornava a carregar quan canviava la identitat de l'array `agents`: dues peticions i l'H1 que parpellejava | Corregit (§6.1) |
| T9-6 | mitjana | `https://www.socdepoble.org` falla el TLS: apunta a Firebase sense domini personalitzat (certificat `firebaseapp.com`) | És del Mestre (D-INFRA-2) |
| CA-1 | mitjana | En remot, «Connectar amb l'autor» obria `/xat?amb=socdepoble` i la creació del fil fallava | Corregit (§6.2) |
| XAT-1 | mitjana | En pantalles baixes (mòbil apaïsat) el peu d'accés tapava la llista i amagava «Registrar-se» davall de la navegació | Corregit (§6.3) |
| WPL-2 | baixa | El zip lleuger porta l'actualitzador i `Update URI`: la 1.1.10 estable el substituirà pel paquet complet de 42 MB | Decisió D-WP-2 |
| WPL-3 | baixa | `https://socdepoble.org/enxufe/stable.json` torna l'HTML de l'SPA: cada lloc veu el canal com a no verificable i el torna a demanar cada hora | Decisió D-WP-3 (cal desplegar el canal) |
| F1–F8 | baixa | `EinaNoDisponible` tenia literals sense traduir, el «Obrir» inert continuava a TPV, Rebost i Salut, la desactivació escrivia dues preferències i hi havia focus perdut i jerga | Corregit (§6.4) |

### 4. Crítica amb context net del codi Gauntlet de Codex (03:45–04:20)

**Mètode.** Workflow de 6 lents: SQL, client multimèdia, IAIA, Loyverse i Bring!, infraestructura i zip, i afirmacions d'estrès. Cada una tenia el seu escèptic. La lent SQL ha muntat **un Storage de Supabase de veres** (storage-api v1.79.36 i supabase/postgres 17.11.0.004) en una xarxa Docker interna i aïllada, que s'ha eliminat en acabar.

**Resultat:** 62 troballes. 48 són reals, 10 s'han refutat i 4 queden incertes. Hi ha **4 altes, que es reduïxen a 2 bloquejants**.

| Id | Gravetat | Troballa | Evidència |
| :--- | :--- | :--- | :--- |
| F1 = MEDIA-1 | **alta** | El disparador BEFORE sobre `storage.objects` rebutja la sonda de permisos (`testPermission → createObject`) de storage-api. **Cap pujada real pot funcionar**: sempre torna 500 «SDP-XAT-021» | Reproduït amb el Storage real. L'auditoria de Codex fa de `storage.objects` una taula plana |
| INFRA-01 = MEDIA-2 | **alta** | Cap CSP té `media-src`: `default-src 'self' data: blob:` bloqueja l'àudio i el vídeo signats de `*.supabase.co`, al web, a la PWA, a Vercel i a l'app nativa | `index.html:17`, `vite.natiu.config.js:93`, `vercel.json:8` |
| F3 | mitjana | No hi ha límit de nombre ni de freqüència de reserves: se n'han acceptat 5.000 d'1 byte en 2 s | Storage real |
| MEDIA-3 | mitjana | A Safari i iOS el canvas no codifica WebP: les fotos es pugen en PNG, unes 9 voltes més grans, contra una quota vitalícia | `adjuntLocal.js:42-57` |
| MEDIA-4 | mitjana | El vídeo es puja tal qual, amb el GPS de les metadades (RGPD). La foto sí que es neteja | `adjuntLocal.js:58-60` |
| MEDIA-8 / STRESS-2 / STRESS-7 | mitjana | La URL signada de 60 s s'encunya en muntar cada bombolla. Hi ha 2 peticions per adjunt en obrir el xat, i es repetixen en el mode selecció. Una nota de veu antiga falla quan es reproduïx | `AdjuntXat.jsx:14-25` i `xatMultimedia.js:122` |
| MEDIA-11 | mitjana | A l'APK, el micròfon sempre es denega perquè falta `RECORD_AUDIO`, i el missatge en culpa la persona | `AndroidManifest.xml:42` |
| MEDIA-5 / 6 / 7 / 9 | mitjana | Sense i18n. Focus perdut. Reproductor natiu amb WebM sense durada. El vídeo d'iPhone (`video/quicktime`) es rebutja | `ControlsAdjunt.jsx` i `AdjuntXat.jsx` |
| IAIA-2 | mitjana | No hi ha llindar de rellevància: 6 de 8 preguntes reals de veïns rebien text de desenvolupadors o cites d'instruccions com si fora «el que diuen les fonts» | `iaiaLocal.js:246-250` |
| LB-1 | mitjana | En Bring!, `name` és una clau del catàleg (en alemany): la llista real del Mestre s'importaria com 7 articles en alemany | `bring.js:7,24,47` |
| LB-2 | mitjana | En l'API de Loyverse, un sol modificador rebutja tota la captura: el catàleg real de La Parròquia no es pot importar | `loyverseApi.js:103-108` |
| STRESS-1 | mitjana | Els colls d'ampolla ALTS de l'arnés de Claude (§5) continuaven a l'arbre viu | Arnés reexecutat |
| INFRA-03 | mitjana | El kill switch documentat (`npm run guarda:aturar`) falla sobre la guàrdia viva en mode desconvocatòria si no se li passa `--onada` | `tooling/gates/guarda-nocturna.mjs:55-57,182` |
| INFRA-04 | mitjana | Codex ha editat directament fitxers de governança (`tooling/gates/guarda-nocturna.mjs` i el seu test, `tooling/tests/node-suite-manifest.json` i `.agents/runtime/guarda_nocturna.json`), sense `executor-mutacio` ni lease del Reflex | Cap rebut a `.sdp-reflex/` |
| INFRA-02 / STRESS-9 | baixa | La correcció del favicon apunta a `vercel.json`, que no desplega producció, i Gemini la dona per «RESOLT I VERIFICAT» | `curl /favicon.ico` → `text/html` |
| INFRA-07 | baixa | Gemini afirma que el zip complix `upload_max_filesize = 2M`. És fals: 2.196.391 B > 2.097.152 B | — |
| STRESS-3 / 4 / 6 | baixa | El «banc de 10.000 usuaris» és un `Promise.all` d'una funció d'adaptador amb mocks: els p50 i p95 mesuren com s'ompli una barrera sintètica. La bateria BM25 de Gemini no té script i no es reproduïx (és 7–11× més lenta) | `perfils.gauntlet.test.js` |

**Refutades (no es compten):** IAIA-1, F8 (l'exageració de Gemini, que és fals però no és un defecte de codi), F9, F11, LB-4, LB-7, LB-9, LB-10, STRESS-5 i MEDIA-13.

### 5. Estrès local: l'arnés de Claude (Gauntlet T1)

Hi ha 35 proves en 7 fitxers, amb 0 crides a `fetch` i 0 WebSocket (tot són trampes que compten). L'arnés i els resultats en cru són al scratch de la sessió; l'informe complet és a l'annex d'especificacions, §«Tasca 1». Les xifres porten soroll: la màquina anava a una càrrega de 9–10 sobre 10 nuclis.

| # | Gravetat | On | Mesurat |
| :--- | :--- | :--- | :--- |
| F1 | ALTA | `useForceLayout.js:70-71` | Repulsió O(n²) a cada fotograma. Amb 7.000 nodes, 108–199 ms per fotograma (5–9 fps) |
| F2 | ALTA | `BrainGraph.jsx:283-289` | Els veïns es calculen en O(n·l): seleccionar un node costa 1,1–1,3 s |
| F3 | ALTA | `BrainGraph.jsx:600` | Un `<select>` amb 7.001 opcions: el muntatge costa 0,8–4,5 s |
| F4 | ALTA | `Conversa.jsx:112` i `Bombolla.jsx:129` | Amb 10.000 missatges, cada tecla repinta 10.002 bombolles (1,0–3,2 s per tecla). El muntatge fa 176.716 nodes DOM |
| F5 | ALTA | `Conversa.jsx:247` | Cada missatge d'algú altre provoca un segon render complet (20.002 bombolles) |
| F6–F8 | MITJANA | `Conversa.jsx:263,326` i `UniversalWorkspace.jsx:1578` | Segon render en muntar; 6.668 `observe()` per missatge; 7.000 fitxes de notes repintades per selecció |
| F9–F10 | MITJANA | `notes.js:78-82` i `localNotes.js` | 10.000 pàgines concurrents sense dedupe (29–47 s). El comparador de l'ordre i el del cursor no són el mateix (latent) |
| F11–F18 | BAIXA/INFO | router, `localXat` i UniversalListCard | Historial duplicat en navegar a la mateixa URL; magatzems sense límit; un rAF sense cancel·lar |

El router aguanta bé: 10.000 navegacions en 2,4 s, sense degradar-se i sense escoltadors residuals. No hi ha cap bucle d'efectes.

### 6. Correccions de Claude

Totes són a l'arbre de treball, **sense commit**. Cada grup ha seguit el mateix cicle:

1. un agent implementador, amb els fitxers reservats a l'Escriptori;
2. un revisor adversari amb context net;
3. un agent d'esmena.

Els diccionaris només s'han tocat amb edicions puntuals. No s'han tocat `tooling/`, `.agents/`, `package.json` ni `wordpress-plugin/`.

#### 6.1 La fitxa i el termini de 3 s (Gauntlet T1 i T2)

- **`src/data/agentsSeed.js` (JAVI):**
  - `role` passa a «La Torre de les Maçanes», que és l'H2.
  - `lema` passa a ser l'entradilla literal del Mestre.
  - `short_bio` queda buit: ja no hi ha el cos vell.
  - `PERSONA_PILOT`, `localPerfils` i la hidratació ho hereten.
  - El snippet `supabase/snippets/2610181800_alinea_perfil_javi_llinares.sql` ja estava alineat per Codex.
- **`PerfilPublicSection.jsx`:**
  - un termini estricte de 3 s que cobrix `hostReady` i `loadPerfilPublic`;
  - en vèncer, la reserva local (els àlies del pilot, la IAIA) o un avís amb «Torna-ho a provar» i «Torna al directori», amb `role=alert`;
  - si el reintent llarg venç, ja no cau en un carreró sense eixida;
  - avorta en desmuntar i quan canvia l'id;
  - el títol diu «Carregant el perfil…» i ja no «Perfil no trobat» mentre carrega;
  - prou de recàrregues quan canvia l'array `agents`;
  - «Escriu-li al xat» de la fitxa del paquet: a `/xat/fake-javi` per al visitant, i amagat en remot amb sessió;
  - la fila d'accions buida ja no es pinta.
- **`src/data/supabase/perfils.js`:** un pressupost compartit de 3 s entre el directori i la RPC, amb `TimeoutError` encara que el transport no faça cas de l'abort. Ara «sense xarxa» (estat 0 o `CODI_BACKEND_INABASTABLE`) es propaga com a avís i ja no com a «Perfil no trobat».
- **`PerfilEditor.jsx`:** en mode lectura, una persona ja no porta l'avatar de 300 px.
- **`EspecimenPage.jsx` i `versio.js`:** el catàleg ja no ensenya l'avatar de 300 px per a persones, i `VERSIO_CATALEG` queda al dia (2026-10-22T03:46:55+02:00).
- **`indexCerca.js` i `ProfileSection.jsx`:** la fitxa de Javi no repetix el poble a la cerca, i el directori mostra l'entradilla.
- Proves noves:
  - `PerfilPublicSection.failsafe.test.jsx` (temporitzadors simulats);
  - els adversaris de Codex `PerfilPublicSection.gauntlet.test.jsx` i `perfils.gauntlet.test.js`;
  - `PerfilPublicSection.xarxa.test.jsx`.

#### 6.2 Connectar amb l'autor

`ConnectarSection.jsx` ja no calcula el destinatari pel seu compte:

- Passa per `interlocutorDelPrivat`, com «En privat». Així no hi ha `/xat?amb=` amb ids de llavor en remot (CA-1).
- `idsDeQuiConnecta` exclou els àlies del pilot (CA-2).
- El text és honest: la conversa apareix de seguida a l'altra persona. Hi ha una variant per al mode llavor.
- Els textos van a `section.connectar.autor.*` en 5 idiomes, amb el nom resolt (CA-4 i CA-6). El basc s'ha corregit (`honekin: {nom}`).

71 proves verdes.

#### 6.3 Xat: accés, logo i previes

- **`AccesAlXat`** va dins del cos de la llista. Té un floor d'espai i és compacte per davall de 500 px d'alçada, i ara és present a totes les vistes del rail (XAT-1). Es comprova amb CDP a 390×844, 844×390, 932×430 i 1280×900.
- **`caraDeSocDePoble.js`** és la regla única del logo oficial, per identitat. S'usa al carril, a VistaComunitats i a Ajustos/Preferits; no a la conversa directa amb l'entitat (XAT-3).
- **Un sol parell «Connectar-se / Registrar-se».** Fora el «Registra't» vell, que anava a `mode=entrar` amb un `href` cru (XAT-4). També fora el doble avís quan la llista està buida (XAT-6).
- **L'avís de només lectura** del compositor ja no se n'ix de la columna.
- **Les previes dels adjunts sense peu**, tancades per Claude a mà després del lot:
  - `xat.js` llig `ultim_tipus` (v5) i `missatges.js` el porta;
  - `FilaConversa` diu «Pep: Foto adjunta» en lloc de «Cap missatge.»;
  - `textDeCita` cita pel tipus;
  - `Bombolla` no pinta un paràgraf buit davall d'un adjunt;
  - `Conversa` passa `t` i `locale` a `ControlsAdjunt`, i tradueix la salutació de cortesia.

#### 6.4 Plugins: estat buit i didàctica

`PluginPage.jsx`, `presentacioPlugins.js`, `useDestiDelPlugin.js`, `PortalApps.jsx` i `RutaApps.jsx`:

- `senseDesti` decidix per la dada. **Cap pàgina de plugin no pinta un «Obrir…» inert**, tampoc TPV, Rebost ni Salut (F2).
- `EinaNoDisponible` es tradueix amb `section.plugin.eina.*` (F1).
- «Desactiva esta eina» escriu una sola preferència, la del Panell, i ho explica (F4).
- El focus es mou bé (F6).
- `TEXT_MOTIU` passa a valencià planer, sense «node», «app», «amfitrió», «premium» ni «codi», en 5 idiomes (F7).
- `/app/<id>` també el tradueix.
- Les extensions de les decisions M2 i M4 porten notes `DEROGAT` i `EXTENSIÓ` (F8).

536 proves verdes.

#### 6.5 Multimèdia: servidor

`supabase/migrations/2610220240_xat_adjunts_i_quota.sql` és la migració de Codex esmenada. **NO aplicada.**

- **F1, el bloquejant.** Fora el disparador que trencava la sonda. Les polítiques d'INSERT validen la reserva pròpia, el MIME, el `contentLength` i `storage.operation()`, i això tanca també les URL de pujada signades falsificades. Un disparador d'escriptura final lliga l'escriptura de superusuari de storage-api a una reserva viva. `xat_publica_adjunt` valida la mida, el MIME, `owner_id`, la data i la versió.
- **F3.** Com a màxim 10 reserves pendents (`SDP-XAT-022`) i 60 per hora (`SDP-XAT-429`), amb un mínim de 64 B.
- **F12.** Topalls per tipus: imatge 2 MB, àudio 3 MB, vídeo 20 MB.
- **F14.** S'accepta `video/quicktime`.
- **F4.** Neteja `private.xat_neteja_adjunts`, cada hora amb pg_cron, per a reserves caducades, missatges temporals caducats i orfes. **No allibera quota mentre el binari continua al Storage.**
- **F2.** Un objecte orfe no es pot tornar a reservar.
- **F5 i R6.** Índexs, i les llistes no es recorren objecte per objecte.
- **F10, Llei E.** `revoke all` i els permisos explícits.
- **F13.** Un adjunt sense peu es desa amb text NULL. `xat_fils_meus` v5 torna `ultim_tipus`.
- L'entrada al README diu **«NO aplicada: l'aplica el Mestre, mai un agent»**.
- Nova prova estàtica `src/data/supabase/xatAdjunts.migracio.test.js`.
- **Provada de punta a punta** amb `tests/xat-multimedia-postgres.audit.mjs` contra storage-api v1.79.36 i supabase/postgres 17.11.0.004 reals, en una xarxa Docker interna i amb el JWT de cada persona: **18 PASS**. Cobrix reservar, POST real, publicar, signar, baixar, persona de fora (404), quota exacta i +1, concurrència, cancel·lació a mitja pujada, neteja, llistes i URL falsificada. El camí de fixture també passa (16 PASS), sense Docker.

#### 6.6 Multimèdia: client

- **La CSP** porta `media-src 'self' data: blob: https:` a `index.html`, a la CSP nativa (`vite.natiu.config.js`) i a `vercel.json`. Falta la capçalera de Firebase (D-INFRA-3).
- **Safari i iOS:** si el canvas no fa WebP, la foto es torna a codificar en JPEG, mai en PNG.
- **El GPS del vídeo** es lleva al client sense transcodificar: les caixes `udta`, `meta` i XMP de MP4 i MOV passen a `free`.
- **L'i18n:** `section.xat.adjunts.*` en 5 idiomes. Els codis del servidor tenen text amable, i el missatge de quota del Mestre és literal.
- **Un reproductor de veu Pedra Seca** accessible, amb la durada del temporitzador de la gravació.
- **Les URL signades es demanen quan cal:** la imatge, al viewport; la veu, en prémer. Es renoven una vegada si fallen, i no es tornen a demanar en el mode selecció (de 400 a 0).
- **La pujada** té un temps límit proporcional a la mida i es pot cancel·lar.
- **Sense capacitat o sense migració,** el xat es veu exactament com abans.
- **Android:** `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` i `uses-feature microphone required=false`. Els textos d'error ja no culpen la persona, i «micròfon ocupat» té missatge propi.

#### 6.7 IAIA

- **`cercaRellevant` (`iaiaLocal.js`)** busca una rellevància mínima en tots els termes. Una pregunta d'una paraula exigix la paraula al títol. Lleva el plural abans de llevar la desinència verbal. S'exclouen els documents de l'equip i els d'instruccions per a IAs.
- **Una prova d'or** amb 8 preguntes reals de veïns. Ara les que no tenen manual responen honestament «No ho trobe a la Wiki pública…».
- **`esPublic()`** reflectix la política de publicació.
- **`ConsultaIAIA`:** el focus queda dins del diàleg, la regió viva és curta i el manifest es baixa en obrir el diàleg.
- **La salutació literal del Mestre** queda fixada en una prova i traduïda (`section.xat.iaia.salutacio`). Una salutació, «gràcies» o «adéu» reben la benvinguda i ja no «en proves».

763 proves verdes.

#### 6.8 Loyverse i Bring!

- **`loyverseApi.js`, captura v2:** porta `modifiers`, amb paginació i cursor. Cap IVA del 0 % passa en silenci. Un article invàlid s'aïlla amb el seu id i el seu nom, i ja no tomba tot el catàleg. Respecta les mateixes opcions de la casa que el CSV. Porta `handle` i `sku` de traça.
- **`bring.js`, captura v2:** porta `idioma` i `articles`. El `name` és la clau del catàleg, traduïda, i es resol per `EQUIVALENTS_BRING` o per nom amb l'avís `PRODUCTE_DE_BOTIGA`.
- **Mutants:** els supervivents ara moren.

189 proves verdes.

#### 6.9 Estrès (Gauntlet T1): abans i després, amb el mateix arnés

| Cas | Abans | Després |
| :--- | :--- | :--- |
| Graf de 7.000 nodes, cost per tic | 96,5 ms (10 fps) | 9,05 ms (110 fps). Barnes-Hut a partir de 1.000 nodes; per davall, el bucle exacte d'abans, que dona exactament el mateix resultat |
| Seleccionar un node (render de React) | 650 ms | 3 ms. La segona selecció passa de 620 a 18 ms |
| Xat de 10.000 missatges, una tecla | 890 ms, 10.002 bombolles | 4,4 ms, 0 bombolles |
| Missatge d'una altra persona | 2.330 ms, 20.002 bombolles, 6.668 `observe()` | 422 ms, 1 bombolla, 1 `observe()` |
| Obrir la conversa | 3.731 ms, 3 commits | 2.776 ms, 1 commit |
| 10.000 primeres pàgines de notes concurrents | 27.985 ms, 20.002 lectures | 218 ms, 4 lectures |
| Cursor de notes amb ids de caixa mixta | 1 duplicat i 2 perdudes | 0 i 0 |

Pendent:

- F3 (el `<select>` de 7.001 opcions) és un redisseny i el decidix el Mestre.
- F8 (UniversalWorkspace amb 7.000 notes) i F11–F18 (baixes) queden especificats a l'annex.

#### 6.10 Connector de WordPress: beta.3

| Camp | Valor |
| :--- | :--- |
| Fitxer | `_builds_de_poble/wordpress/socdepoble.zip`, i la còpia datada `261022_0558_wordpress_enxufe_v1.1.10-beta.3.zip` |
| Mida | **2.212.160 B** (< 2.500.000) |
| SHA-256 | `a7a4f17ce5953e29a36380102164663de8db1432870685d734ec25647cbaa57f` |
| Fonts | Arbre git `5af01202ede2406ef7f8e7b22766e178a64b8795` (índex temporal: HEAD `6b7b14d4` més tot l'arbre de treball de les 05:57, sense `public/`). No és un commit |
| Build | Còpia fora de l'arbre: `SDP_MITJANS=externs SDP_RELEASE=1 SDP_VERSIO=1.1.10-beta.3`, amb l'entorn de producció carregat al procés sense imprimir-lo. Després, `empaqueta.mjs --lleuger`. `wordpress-plugin/dist` no s'ha tocat |
| Prova de fum | Chrome sense capa amb un amfitrió que imita `marcatge.php`, sobre `/`, `/xat`, `/javillinares` i `/plugin/rss`: 33/33 imatges de `https://socdepoble.org/assets`, 0 locals. A la consola només ix l'avís previ `[RuntimePolicy]`. El CSS d'adjunts, consulta i xat arriba al Shadow DOM, i l'H1 és «Javi Llinares» |
| Precedent | La beta.2 de Codex es conserva com a `261022_0316_wordpress_enxufe_v1.1.10-beta.2.zip` (2.196.391 B) |
| Informe | `261022_0600_informe_validacio_zip_wordpress_beta3.json` |

### 7. Acord adversarial amb Codex i Gemini

Llegits sencers: `261022_0141_auditoria_codex.md`, `261022_0141_acta_tancament_codex.md`, `261022_0142_auditoria_gemini.md`, `261022_0235_auditoria_codex.md`, `261022_0235_acta_tancament_codex.md` i `261022_0235_auditoria_gemini.md`.

**On coincidim les tres IAs:**

1. La fitxa única de Javi.
2. El termini de 3 s.
3. La consulta documental de la IAIA sense fabricar missatges del servidor.
4. La quota decidida pel servidor.
5. Que no hi ha bot de WhatsApp desplegat.
6. Que Bring! i Loyverse no tenen sessió autenticada.
7. Que cap prova local equival a 10.000 navegadors.

Hi ha **contradiccions que este informe resol amb evidència**. Cal llegir-ho així:

| Tema | Codex | Gemini | Claude (amb evidència) | Acord proposat |
| :--- | :--- | :--- | :--- | :--- |
| Multimèdia «verificada» | PostgreSQL local amb Storage modelat; «Storage HTTP continua sense provar» | «impecable / VERIFICAT» | Amb el Storage real, cap pujada funcionava (F1). Amb la CSP, cap reproducció (INFRA-01) | Només es dona per verificat el que passa amb storage-api real i la CSP real. La correcció de Claude s'ha provat així (§6.6) |
| Quina versió d'Obsidian | 1.5.8 (`Resources/obsidian.asar`) | — | Executa la 1.14.4 (`userData/obsidian-1.14.4.asar`). El carregador tria la més nova (`app.asar/main.js`: `loadApp`, `isV2MoreRecent`) | Les conclusions de Codex sobre la 1.5.8 valen com a història. El manual de referència és el de la 1.14.4 |
| Favicon | `public/favicon.ico` i `vercel.json` | «RESOLT I VERIFICAT» | Producció és Firebase: `/favicon.ico` encara és `text/html`. `vercel.json` no es desplega | Pendent de desplegament, i cal versionar `firebase.json` |
| Estrès de 10.000 | 10.000 promeses: 528 ms, p95 508 ms | Taules de throughput, p50, p95 i p99 | Són barreres sintètiques en un sol procés. Els colls d'ampolla reals són als components (§5) | Les xifres de Codex i Gemini es reetiqueten com a «aïllament de promeses». El T1 queda `[PARCIAL]` fins que els ALTS estiguen corregits i remesurats |
| Zip ≤ 2 MiB | No ho afirma | «complix upload_max_filesize = 2M» | 2.196.391 B > 2.097.152 B | Es complix < 2,5 MB, però no 2 MiB |
| Tasca 6 de 261021_2345 | Disseny `connexions_humanes` amb petició i acceptació | — | Disseny `vincles` unidireccional amb mutualitat derivada (mapa de Claude) | No se'n construïx cap fins que el Mestre trie i s'inventarie `public.connections` viva (D-XARXA-1) |
| Governança | Ha editat `tooling/` i `.agents/runtime` directament | — | Contravé la frontera del Reflex (INFRA-04) | MarIA o el Mestre ho regularitzen amb `executor-mutacio`. Claude no ha tocat `tooling/` ni `.agents/` |

**Autocrítica de Claude** (el que el crític també ha trobat en el carril propi i s'ha corregit):

- Al 3 s, el tall dur no tenia eixida: «Torna-ho a provar» repetia el mateix termini.
- L'avís no tenia regió viva.
- Hi havia dues claus de diccionari que no existien.
- `VERSIO_CATALEG` no estava al dia.
- El poble ixia repetit a la cerca.
- Hi havia comentaris de doctrina falsos.

Tot corregit (§6).

### 8. Didàctica i REA, en resum

**Auditoria del veí.** Annex `261022_0150_claude_auditoria_didactica_vei.md`, 162 KB. Fa 82 troballes a les cinc pantalles: 24 altes, 39 mitjanes i 19 baixes. Hi ha el text proposat en valencià planer, llest per a `ca.js`, i 13 decisions per al Mestre. Els cinc patrons que més confonen:

1. **Botons que diuen una cosa i en fan una altra:** «Obrir…» inert; «CONNECTAR» no et fa entrar al compte; «Traduir» no traduïx; la data et porta al calendari.
2. **Jerga de taller:** node, app, amfitrió, MAS, Foraster, RSS, «s'enxufen».
3. **Pàgines sense «per a què servix»:** el Mercat, Pobles i el Bloc de notes.
4. **Estats buits d'una línia, sense cap pas següent.**
5. **Cap web no pot «instal·lar» una eina.**

El P0 de plugins i motius ja està aplicat (§6.4). La resta del P0 i del P1 queda proposada.

**REA d'Obsidian.** Annex `261022_0150_claude_manual_rea_obsidian.md`, 162 KB. Totes les afirmacions porten la marca [C], [D] o [?] i la seua font. Les eines REA que s'han usat:

- `inspect_electron_fuses`, `inspect_artifact`, `analyze_javascript_application` i `export_evidence_bundle`;
- la CLI `rea-agents` 6.5.0 per a `app.js` (3,9 MB), perquè l'MCP tallava als 60 s.

El que diu:

- **El mapa:** una closca Electron 28.2.3 amb renderer amb Node, sense contextIsolation i amb els 7 fusibles desactivats. Workers de metadades (`worker.js`) i del graf (`sim.js`, WebAssembly amb una reserva d3). PixiJS dins d'un iframe. El 48 % del paquet són llibreries de tercers.
- **Les dues funcions:**
  1. Els enllaços bidireccionals: resolució de camins, memòria de metadades, retroenllaços i actualització en reanomenar.
  2. L'espai de treball: panells, laterals plegables i `workspace.json`.
- **El manual de comportament** no copia cap codi. Proposa com encaixar-ho a `UniversalWorkspace` per fases, amb proves d'acceptació en paraules planeres.
- **El vídeo d'Emowe:** Claude, amb WebFetch, només n'ha pogut traure el títol, «He clonado Obsidian y esto cambió mi forma de trabajar ¿REA?». Ni transcripció ni descripció. Codex sí que en va llegir la transcripció al navegador. **Segons Codex** (no ho he verificat), l'autor diu que el seu «Basalto» el va reconstruir sense REA i sense obrir Obsidian (8:07–8:39). El PDF `rea-sin-humo.pdf` (pàgines 2-3) diu el mateix de l'editor de quasi 7.000 notes. Si és així, el prompt atribuïx malament el resultat a REA.

### 9. Pendents del Mestre (decisions i accions que cap IA pot fer)

| Id | Què | Per què |
| :--- | :--- | :--- |
| D-INFRA-1 | Redesplegar Firebase Hosting (`soc-de-poble`) amb el build d'esta nit i **versionar `firebase.json`** al repositori | Cap canvi d'esta nit és a socdepoble.org. `/favicon.ico` encara és `text/html` |
| D-INFRA-2 | Afegir `www.socdepoble.org` com a domini de Firebase, o llevar l'A de `www` | El TLS falla, amb un certificat de `firebaseapp.com` |
| D-INFRA-3 | A la capçalera CSP de Firebase, afegir `media-src 'self' data: blob: https:;` després d'`img-src` | Sense això, a producció no sona cap nota de veu ni cap vídeo, encara que es corregisca el codi |
| D-SQL-1 | Aplicar `2610220240_xat_adjunts_i_quota.sql`, amb els prerequisits 2609261500, 2609270200, 2609272200, 2609282100 i 2610081543. Si no hi ha pg_cron, programar la neteja (ordre al README). Comprovar que el rol pot crear un disparador sobre `storage.objects` | La multimèdia depén d'esta migració. **No s'ha aplicat enlloc** |
| D-SQL-2 | Construir el worker que buida `private.purga_storage_pendent` | Sense ell, els binaris alliberats es queden al bucket |
| D-GATE-1 | `tooling/gates/tractor-rls.mjs:139-145` llig `storage.objects` com si fora una taula anomenada «storage» (R1). Cal llegir l'esquema, com ja fa la regla de les polítiques | La migració necessita el disparador. El gate n'ix roig, però `tooling/` és del Mestre i va pel Reflex |
| D-GOV-1 | Regularitzar amb `executor-mutacio` i un lease les edicions directes de Codex a `tooling/gates/guarda-nocturna.mjs` i el seu test, `tooling/tests/node-suite-manifest.json` i `.agents/runtime/guarda_nocturna.json`. Fer que `npm run guarda:aturar` accepte `--onada` | INFRA-03 i INFRA-04 |
| D-WP-1 | Decidir si el zip del **directori de WordPress.org** (9,8 MB) també trau les imatges de la interfície. Un build de prova de Claude fa 1.868.769 B | La guia 7 de WordPress.org prohibix descarregar d'un servidor extern el que no és contingut del servei (decisió D1, opció B, del 261019) |
| D-WP-2 | Decidir si el zip lleuger conserva l'actualitzador. Si es publica la 1.1.10 estable, el canviarà pel paquet complet de 42 MB | WPL-2 |
| D-WP-3 | Desplegar `enxufe/stable.json` i la seua signatura a socdepoble.org, o fer que `/enxufe/*` torne 404 | Ara torna l'HTML de l'SPA (WPL-3) |
| D-PERF-1 | Decidir si la cara duplicada desapareix també de les pàgines de detall (Mur, Mercat, Notes) quan signa una persona | L'ordre parlava de la fitxa de persona |
| D-PERF-2 | Els cridadors de fons de `loadPerfilPublic` (`resolEntitatDelProjecte`, `xatCorporatiu`): ¿3 s o un termini més llarg? | El termini estricte s'aplica a tothom |
| D-PERF-3 | Actualitzar `supabase/seed.sql:8` (fila 0001) i la fila viva de Javi a Supabase. Acreditar l'UUID de `IDS_REMOTS_FUNDACIONALS` | Encara tenen el text fòssil. Cap IA ha d'endevinar l'UUID |
| D-PERF-4 | Reescriure el §11 de `.agents/skills/sdp-pedra-seca/SKILL.md` (avatar de persona) | La skill encara mana els 300 px: risc que algú ho revertisca |
| D-XARXA-1 | Triar el model de connexions humanes: «vincles» unidireccionals (Claude) o petició i acceptació (Codex). Abans, inventariar en lectura la taula viva `public.connections`, que no està versionada | No se n'ha construït cap |
| D-PLUG-1 | El botó «Descarrega / Instal·la l'extensió a este node» del prompt 261021_2345 | `[NO FET]`: no hi ha cap mecanisme d'instal·lació, i fabricar-ne un botó seria enganyar |
| D-IAIA-1 | Un manual d'usuari públic (`03_actuar`) i un camp d'audiència al frontmatter de la Wiki | Sense eixe manual, la IAIA respon «No ho trobe» a les preguntes pràctiques |
| D-MOB-1 | `npx cap sync android` i tornar a fer l'APK amb `RECORD_AUDIO`. Provar la veu i el vídeo en un iPhone i un Android de veres | No s'ha provat en cap aparell |
| D-TPV-1 | Confirmar la taula `EQUIVALENTS_BRING` (p. ex. «Zitrone» com a «llimes») i els avisos `PRODUCTE_DE_BOTIGA`. Decidir el pont cap al Rebost i el TPV | No hi ha cap consumidor encara |
| D-TENANT-1 | El zip segella el tenant `11111111-2222-3333-4444-555555555555` (igual que a la 1.1.9 i la beta.2) | Sembla un valor de reserva: cal confirmar-lo abans de publicar res |

### 10. Retroalimentació de la plantilla `prompt_local`

1. Fixar els límits en **bytes**, i dir de quin zip es parla: el lleuger del canal propi, el del canal estable o el del directori de WordPress.org.
2. Quan un prompt demane «verificat», exigir l'**entorn real** de la peça: Storage de veres per a Storage, la capçalera CSP de producció per a la CSP i Firebase per a producció. Un model en taula plana no verifica.
3. Distingir «al codi», «desplegat» i «aplicat a la BD» en cada tasca, amb columnes separades a la MCR.
4. Un prompt que arriba a mitja nit (el Gauntlet) hauria de dir què passa amb les reserves de fitxers de l'onada anterior.
5. No posar noms de models ni de versions de tercers (p. ex. «Claude 3.7»). Dir qui ha participat de veres, amb el seu torn.
6. Citar la font quan s'atribuïx un resultat a una eina. El vídeo d'Emowe diu, segons Codex, que el «Basalto» es va fer **sense** REA.

### 11. Els relleus d'esta nit, en resum

Els relleus vius es van escriure en este mateix document. Ací en queda només el rastre, perquè les reserves ja no valen.

- **01:50 · Carrils.** Codex ja implementava les tasques 1–4 i el bloc de plugins. Claude agafa la didàctica, la REA real, la verificació independent i el disseny de «Connectar amb l'autor».
- **02:05 · Commit global.** El `d31c1ccd` d'una altra mà va pujar el codi de Codex amb un títol `docs`. Comprovacions: `favicon.svg` 200, i el zip lleuger porta l'actualitzador.
- **02:40 · Reserves de Claude** per a la fitxa, Connectar, el xat, els plugins i els comentaris PWA (Gauntlet T1 i T2). Codex les va respectar (el seu relleu de les 03:03).
- **03:45 · Reserves alliberades** i bateria completa independent. Claude passa a fer de crític del codi Gauntlet de Codex.
- **04:20 · Dos bloquejants alts** a la multimèdia (Storage i CSP) i noves reserves per corregir-los.
- **06:10 · Tancament.** Claude **allibera totes les reserves**. Res queda pendent en el seu carril fora del que diu el §9.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Bateria completa sobre l'arbre final congelat** (`5af01202`, índex temporal amb tot l'arbre de treball de les 05:57), en una còpia fora del repositori:
  - **Vitest:** 20.916 verdes, 109 omeses i 1 roja.
  - **Suite Node:** 1.018 verdes i 3 roges.
  - Les 4 roges són artefactes de la còpia, que no és un repositori git:
    - `projecteIos` (`git check-ignore`);
    - `botigues` (git);
    - dos casos de hooks de Codex (`git rev-parse`).
  - **A l'arbre viu passen:** `src/natiu/` 54/55 (1 omesa) i `tests/botigues.test.mjs` 10/10.
  - Les tres «diagnòstic» de la suite Node són deute heretat, ja anterior al torn.
- **Bateria completa a les 03:44** (arbre `018eecf3`): Vitest 20.665 verdes. Les fallades eren totes artefactes, comprovades a l'arbre viu.
- **Proves dirigides de cada grup:**
  - perfil: 850;
  - Connectar: 71;
  - xat: 1.457 (inclou i18n i contracte);
  - plugins: 536;
  - IAIA: 763;
  - Loyverse i Bring!: 189;
  - estrès: 2.244 (graf, xat i notes);
  - multimèdia: 1.133;
  - PWA: 160;
  - catàleg, cerca i apps: 1.085.
  - Les comptes se solapen entre grups; no se sumen.
- **SQL de la multimèdia** contra storage-api v1.79.36 i supabase/postgres 17.11.0.004 reals, en Docker aïllat: 18 PASS. El camí de fixture: 16 PASS. Tots els contenidors i xarxes `claude-*` s'han eliminat.
- **ESLint:** `--max-warnings=0` net en tots els fitxers tocats.
- **Altres portes:**
  - `node --test tests/lint_xat.test.mjs`: 20/20.
  - `i18n.idiomes` i `i18n.claus`: verdes.
  - `tractor-rls`: **roig només** per la R1 sobre `storage.objects`. És el regex del gate (D-GATE-1); sense eixe fitxer, ix 0.
  - `design_guard` i `tractor-pedra-seca`: roigs pel deute d'altres fitxers. La mateixa eixida abans i després de les correccions de Claude, i cap fitxer de Claude hi apareix.
- **Navegador:** Chrome sense capa per CDP, amb el perfil al scratch.
  - Fitxes `/javillinares` i `/gent/javillinares`.
  - `/xat` a 4 mides.
  - `/plugin/*` i `/app`.
  - La prova de fum de les beta.1 i beta.3 del connector, amb un amfitrió que imita `marcatge.php`.
- **Producció** (curl, només lectura):
  - `favicon.svg` 200 `image/svg+xml`;
  - `favicon.ico` 200 `text/html`;
  - `/assets/*` amb CORS `*` i 404 de veres;
  - `www` amb TLS trencat;
  - `/enxufe/stable.json` torna l'HTML de l'SPA.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense commit, push, desplegament ni migració aplicada.** L'arbre té 139 entrades sense versionar, de Claude, Codex i Gemini. El commit és del Mestre o de MarIA. La memòria del torn diu que cal fer-lo amb un índex temporal i una llista explícita, perquè el pre-commit no pot passar.
- **No s'ha tocat:** `tooling/`, `.agents/`, `package.json`, el lock ni `wordpress-plugin/dist`. Tampoc cap canal signat ni `01_produccio/`. La beta.3 s'ha fet en una còpia.
- **L'estrès és local, amb mocks.** No equival a 10.000 navegadors ni prova la capacitat de Supabase. No s'ha cridat producció en bucle.
- **La multimèdia no s'ha provat en cap aparell real** (iPhone, APK) ni contra el Supabase de producció. El Storage real era una imatge descartable.
- **REA:** Obsidian no s'ha executat. L'evidència és estàtica. El codi de tercers no s'ha copiat; als annexos només hi ha identificadors i cadenes curtes.
- **Bring! i Loyverse:** captures del Mestre i documentació pública. Cap sessió, cap compte i cap clau.
- **Vigilància de l'Escriptori:** per mandat del Gauntlet, Claude ha mantingut una vigilància (`Monitor`, una ronda per minut, en finestres de 30 min) des de les 04:25. Fins a les 06:10 no hi ha hagut cap document nou de Codex, Gemini ni MarIA. **No hi ha cap cron de Claude.** La vigilància s'atura en publicar este informe, o quan MarIA en done la desconvocatòria (§11).
- **Les guàrdies d'altres agents,** com `guarda-nocturna` de Codex, no s'han tocat. Desconvocar-les és de MarIA (INFRA-03).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261021_2345_prompt_claude_gemini_codex_alleugeriment_wp_pwa_i_auditoria_didactica]]
- [[261021_2345_pla_implementacio_alleugeriment_wp_pwa_i_auditoria_didactica]]
- [[261022_0225_prompt_claude_gemini_codex_gauntlet_extrem_i_sistema_resilient]]
- [[261022_0225_pla_implementacio_gauntlet_extrem_i_sistema_resilient]]
- [[261022_0141_auditoria_codex]]
- [[261022_0235_auditoria_codex]]
- [[261022_0142_auditoria_gemini]]
- [[261022_0235_auditoria_gemini]]
- [[03_llibre_mestre_tasques_i_idees]]
