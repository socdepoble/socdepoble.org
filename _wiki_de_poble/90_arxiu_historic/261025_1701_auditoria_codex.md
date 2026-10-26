---
type: informe
status: esborrany
description: Auditoria adversarial del port, xat, WordPress, botigues, IAIA i cicle documental amb proves locals i fonts oficials.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_05675b07-b173-48d1-a4a7-f8c4a8848419:30dd4e48-c394-443e-91d1-e40d15998838
---
# Gauntlet del Mas electrònic: habitabilitat i proves verificables

**Dictamen: conformitat parcial; el 10/10 global encara no està acreditat.** La suite ràpida de 3.391 proves passa de nou. El Mas electrònic té peces que el pla proposa construir però ja existixen (veu i View Transitions), i deutes vius que no es poden esborrar (Apple, WordPress antic, bot i operació remota). Esta auditoria concreta els criteris de tancament; no activa tractors ni modifica producte.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_05675b07-b173-48d1-a4a7-f8c4a8848419:30dd4e48-c394-443e-91d1-e40d15998838 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T16:01:12.180Z |
| Modificació | 2026-10-25T17:13:18+01:00 |
| Propietari | Codex |
| Aprovació humana | auditoria encarregada pel Mestre; propostes pendents de consolidació |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex · GPT-6 |
| Tokens consumits | no disponibles en la mètrica de la sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T16:01:12.180Z: document creat pel circuit canònic; revisió sobre HEAD `b842160ac` amb canvis locals previs, inclosa la correcció de Notes.
- 2026-10-25: tres revisions independents de només lectura (port/xat/IAIA, WordPress/Pedra Seca i higiene), contrast de PoC pel coordinador i inspecció dels artefactes locals. Cap equip fictici de models: són subagents de Codex.
- Informe viu per a MarIA, Claude, Gemini i el Mestre. Es conservarà fins que les conclusions queden llegides i destil·lades; no s'arxiva per la simple existència d'un commit.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Resultat dels set mòduls

| Mòdul | Evidència actual | Criteri concret per tancar-lo |
|---|---|---|
| Port neutral i Frontissa | Contracte/capacitats validats, portes Enxufe i Frontissa verdes; recursos Sollutia encara buits deliberadament. Transport Supabase sense sostre general de bytes. | Pressupost per operació, cancel·lació i validació de DTO als adaptadors; captura real + traductor + fixture per cada GET de Sollutia. Proves de resposta truncada, tardana, enorme, offline i canvi d'actor/host. |
| Proves | 3.132 Vitest + 259 Node passen; Vitest 22,24 s i Node 1,30 s en esta execució. La suite d'higiene separada té una fallada i casos omesos. | Manifest de suites/fitxers, execució completa adequada a l'onada, cap fallada amagada per TODO/skip i mesures de paret repetibles en entorn definit. |
| Pedra Seca | P1-16 del catàleg corregit en DOM/CSS/proves; escala d'espaiat i View Transitions ja existents. Falta accessibilitat del scroll en Markdown general. | Reutilitzar tokens i primitives; geometria real de columna a 385 px també dins de viewport ample, teclat, zoom, contrast calculat i Safari/Chrome. |
| Xat | Veu, vídeo curt, quota, lectura i resposta citada existents. Documents, estat entregat i reaccions no completats; E2EE continua pendent. | Contractes opcionals + SQL/RLS + UI, quota concurrent i recàrrega entre dos usuaris/dispositius reals; desplegament acreditat. |
| WordPress | Identitat principal `socdepoble` coherent; ZIP disponible WP 6.6, no WP 5.8. PHP declarat 7.4 però proves executades en 8.4.25. | Variant autònoma i bloc compatible, pont d'actualització antic i matriu real PHP 7.4/WP 5.8 + actual + multisite. |
| Apple/Google | iOS arxivat SDK 27.1/mínim 16; APK target 36/mínim 24. SDK modern no equival a bundle vigent ni publicació resolta. | Rebuild des del commit triat, build/versionCode superior, control de versió mínim funcional, autenticació real, release signada i proves en dispositiu. |
| IAIA MarIA | SPA BM25 extractiva i bot Node/LLM/WhatsApp són dues cadenes separades. Arrencada per defecte del bot i contracte RAG trencats al checkout. | Rutes vigents, roundtrip builder→JSON→cerca validat, corpus cultural autoritzat, límits de memòria/cost i transport operatiu verificat. |

Les notes 8,5/9,5/10 són objectius del Mestre. No s'inventa una puntuació substitutiva sense mesures. «Mai caurà» es transforma en criteris de resiliència reproduïbles.

### C1645-01 · P1 · La depuració proposada esborraria un deute Apple encara viu

**Scope:** prompt 1645, pla 1645 i Llibre Mestre, files P1-18/P1-21. El prompt i el pla identifiquen `P1-18` com ReDoS resolt. El Llibre identifica correctament ReDoS com `P1-21`; `P1-18` és WM1/WM2 del servei Apple i continua pendent.

**Evidència:** `supabase/functions/compte-apple/gestor.js:261-263` llig tot `req.text()` abans de limitar-ne la longitud; `:73-76` lleva el temporitzador quan arriba el resultat de fetch, abans de `resposta.json()` a `:90` o de les lectures següents del cos. La inspecció actual confirma el defecte descrit al Llibre; no s'ha efectuat cap DoS remot. S'ha de conservar P1-18 i provar bytes realment llegits/cancel·lats i un cos que no acaba després de rebre capçaleres.

**Proposta conservadora:** corregir els IDs del pla abans d'executar-ne la depuració. Compactar els fets en un registre curt amb commit/prova/font, mantenint P0/P1/P2 oberts i les 31 idees. No es pot certificar «només idees vives» quan encara hi ha deutes actius. `requires_human_decision: false` per a corregir la referència; qualsevol canvi de la peça d'autenticació seguirà el seu circuit.

### C1645-02 · P2 · Olivera detecta vida, però l'arxivament no aprofita el diagnòstic

**Scope:** `tooling/gates/porta-olivera.mjs:218-221,555-615,702-741,1002-1007` i `.agents/olivera-fase.json`.

`ranci()` usa data anterior a hui i exclou els declarats vius. Però `vidaDe()`/`vidaTaula()` JA detecten hui torns tancats/caducats i consumidors sense vida. El problema precís és que `arxivables()` sense noms torna al criteri de data, i la fase `avis` deixa CONV-03 com advertiment amb codi 0.

**PoC del motor instal·lat, sense tocar l'Escriptori:** document sintètic de hui, ancorat amb rebut de torn tancat → `ranci=0`, `arxivables=0`; `checkEscriptori` en avis retorna vàlid amb CONV-03; en bloqueig retorna invàlid. Fixture només a /tmp i retirada. La taula real ja tenia els cinc documents anteriors arxivats abans d'esta auditoria. El verd observat hui conserva legítimament el pla/prompt vigents i el Llibre amb retenció; no demostra la neteja automàtica històrica.

**Millora mínima proposada:** reutilitzar el motor de vida per exposar candidats amb `{document, hash, motiu, consumidor, provaDeConsum}`. Separar «sense vida acreditada» de «consumit acreditat». La substitució ha de ser explícita (pla nou que absorbix els pendents); el consum ha d'enllaçar destil·lació/commit i la versió del document. Abans del trasllat, sota pany, recomprovar hash, consumidors i destí; usar el mateix moviment/àncores/handoff recuperable que ja existix. Si canvia el hash o reapareix un consumidor, avortar i regenerar la proposta.

**No són reparacions:** canviar `<` per `<=`, arxivar qualsevol fitxer commitejat o considerar que tancar el torn implica haver-lo llegit. Un informe commitejat pot continuar pendent de Claude/Gemini/Mestre. La caducitat és senyal de triatge, no prova de consum.

La skill v4 ja explica el criteri de vida; el buit és mecànic. Cal canviar `core-higiene-escriptori/SKILL.md:83-86` perquè admeta qualsevol document vigent amb consumidor justificat, incloses auditories, i condicionar l'arxivament post-commit de `:111` a la resolució d'eixos consumidors. La llista fixa llibre+pla+prompts contradiu la revisió asíncrona d'este mateix prompt.

**Proves d'acceptació:** hui+torn tancat, hui+substitució explícita, retenció del Mestre, consumidor actiu, cicle de dos documents sense arrel, informe encara pendent de lectura, hash canviat entre proposta i aplicació, reintent després de fallada/lock/handoff i preservació d'01_produccio/02_investigacio_ia. Els casos de vida han d'executar el motor instal·lat: el corredor de laboratori actual omet les 42 proves. `requires_human_decision: true` per activar un nou tractor o passar a bloqueig; no s'ha activat res.

### C1645-03 · P1 · La cadena RAG del bot no funciona amb les rutes i l'índex actuals

**Scope:** `bot/arrels.mjs:47-50`, `bot/cervell.mjs:81-99,158`, `tooling/wiki/core/edge_rag.mjs:108-126` i builder públic.

Les quatre rutes per defecte de genotip, persona, perfil i índex no existixen al checkout actual. El builder escriu `public/rag-index.json`, mentre el bot espera `bot/rag_index.json`. A més, `JSON.parse` retorna arrays/objectes i `edge_rag.search` espera Set/Map.

**Reproducció independent del coordinador, sense xarxa ni bot en marxa:**

```js
search(JSON.parse(readFileSync('public/rag-index.json', 'utf8')), 'poble', 3)
// TypeError: stopwords.has is not a function
```

`existsSync` de les quatre rutes retorna false. La cerca es fa abans del try de generació de Gemini, i la fallada no entra en eixe missatge de recuperació. Açò demostra el bloqueig per defecte del checkout, no l'estat d'un servidor extern amb altres fitxers/variables.

**Reparació mínima:** identificar la persona vigent sense crear carpetes noves, configurar rutes presents i un contracte versionat d'índex amb hidratació validada compartida. Prova builder→serialització→lector→cerca i prova d'arrencada amb corpus mínim, sense credencials ni enviaments. No confondre BM25 de la SPA amb el TF-IDF/cosinus del bot. `requires_human_decision: false` per a reparar contractes; true per triar identitat/corpus i posar la línia en servei.

### C1645-04 · P2 · L'historial d'una conversa del bot creix sense límit

`bot/cervell.mjs:166,251` afig pregunta/resposta a `session.history`; `slice(-8)` només retalla el prompt. El límit de 300 sessions no limita una única sessió llarga. Podar en emmagatzemar per nombre de missatges i bytes/caràcters, i verificar milers de torns amb mida estable. No s'ha executat una càrrega contra el servei. `requires_human_decision: false` per establir una fita tècnica conservadora explícita.

### C1645-05 · P2 · El pla del xat necessita un inventari real abans de construir

| Funció | Estat inspeccionat | Treball que falta |
|---|---|---|
| Veu | MediaRecorder a `adjuntLocal.js:186-237`, controls i previsualització a `ControlsAdjunt.jsx`/`Conversa.jsx`; 64 kbit/s, 5 minuts i 3 MB. | Reutilitzar-lo al costat del text; revisar permisos, stop/cancel, tracks, MIME Safari/Chrome i interrupcions. |
| Vídeo | `xatMultimedia.js:6-19`: 20.000.000 bytes, 10 segons. Neteja de metadades; no transcodificació general. | Fer explícita la durada triada; no prometre compressió automàtica universal amb MediaRecorder. Provar codecs reals i conservar alternativa de reducció/selecció. |
| Quota | 20 MB decimals acumulats per persona, autoritat al servidor, reserva/publicació/cancel·lació existents. | Documents han de consumir la mateixa quota; reservar amb atomicitat, netejar abandonats i provar concurrència real. No reinterpretar-ho com 20 MB nous per cada missatge. |
| Documents | MIME/PDF no admés per `MIME_XAT` ni `preparaAdjunt`. | Contracte, MIME/bytes reals, Storage privat, nom sanejat, descàrrega i RPC/RLS; no ampliar només accept del selector. No recomprimir documents arbitràriament. |
| Enviat/llegit | Confirmació pròpia i lectura dels altres; resposta citada existent. | «Entregat» requerix rebut dels altres, contracte i RPC nous; no es pot inferir d'un fetch propi. |
| Reaccions | Sense contracte/persistència/UI operativa observats al tall. | Upsert idempotent per missatge/persona, permisos del participant, realtime, retirada i unicitat. |
| Privacitat | E2EE pendent; la UI ho explica. | Conservar P1-12/IDEA-19; la paritat total amb WhatsApp no està certificada. |

El SQL vigent treballa amb `public.xat_participants`: RPC v5 de `2610220240_xat_adjunts_i_quota.sql:438-464` exposa rebut propi i mínim de lectura dels altres. `public.xat_lectures` al pla és una referència antiga. Separar «enviat al servidor», «rebut per almenys un dispositiu destinatari» i «llegit» amb semàntica explícita de grups/multidispositiu, abans de pintar dos tics.

**Proves necessàries:** dos usuaris i dos dispositius, enviament simultani, offline/reconnexió, abort a cada fase d'adjunt, límit exacte i +1 byte, sessió A→B, reserva duplicada, purga, resposta citada esborrada i revocació de participant. Les proves locals verdes no acrediten RPC/RLS desplegades. `requires_human_decision: true` per semàntica de rebut de grup, durada màxima del vídeo i política futura d'E2EE; la quota de 20 MB ja està definida.

### C1645-06 · P2 · El connector disponible no complix WordPress 5.8

**Fonts locals:** `wordpress-plugin/socdepoble-enxufe.php:8`, `readme.txt:4`, `includes/bloc/block.json`, `includes/marcatge.php:410` i `eines/empaqueta.mjs:318`. Les fonts exigixen WP 6.5; el runtime WordPress del ZIP exigix 6.6. `apiVersion:3` i `render` arriben després de WP 5.8, i el registre inspeccionat no aporta callback alternatiu. [WordPress: metadades de blocs](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/).

**Artefacte verificat:** `_builds_de_poble/wordpress/socdepoble.zip`, SHA-256 `0079a4c7ec3734756dde9c14b6fd6b609c40ac010cf09074a36c5487b9954e2b`, versió 1.1.9, generat 2026-10-23T14:00:09.300Z, arrel socdepoble/, mínim WP 6.6/PHP 7.4, runtime React extern de WordPress i sense actualitzador privat. No és el paquet WP 5.8 demanat.

**Proposta:** mantindre la variant del directori i preparar la compatibilitat dins de les carpetes existents amb runtime autònom, API de bloc compatible i `render_callback` compartit, més shortcode de reserva. Provar instal·lació/actualització des de la carpeta antiga, doble còpia, multisite, activació i desinstal·lació amb dades preservades. Rebaixar només capçaleres seria un fals suport. Cap dependència o variant s'ha instal·lat en este torn.

El slug principal ja és `socdepoble`. `SOCDEPOBLE_ENXUFE_SLUG_CANAL='socdepoble-enxufe'` aïlla el canal privat i evita suplantar WordPress.org; no és ferralla a eliminar cegament. Les 104 proves passen amb PHP 8.4.25 i fixtures, sense WordPress 5.8 real: no certifiquen PHP 7.4. `requires_human_decision: false` per preparar compatibilitat requerida; qualsevol nou canal publicat necessitarà una release concreta revisada.

### C1645-07 · P2 · Pedra Seca: conservar allò existent i tancar el scroll Markdown

View Transitions ja funcionen a `src/app/App.jsx:683-693,1126-1133` amb feature detection i `prefers-reduced-motion`; `modules.css:1928-1946` usa fosa de 200 ms. Tokens a `tokens.css:357-359`: 4/8/12/16/20/24/32 px. No cal una segona escala ni una altra capa d'animacions.

P1-16 del catàleg es confirma al DOM/CSS i a les proves. **Deute diferent:** `src/sections/wiki-de-poble/parseMarkdown.js:162-169` genera `.sdp-taula-prosa` sense tabIndex/role/nom, mentre `components.css:54` l'usa com contenidor amb overflow. PoC amb parser real i JSDOM: tabIndex −1, role null, aria-label null. El scroll amb teclat no és automàtic a tots els navegadors; [MDN documenta tabindex i nom de regió](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow#accessibility).

Proposta concreta: embolcall focusable amb nom contextual derivat de caption/encapçalament, conservant table i sanejament natius; comprovar focus visible, navegació de lector de pantalla i teclat en Safari. Mantindre 24 px entre taules/seccions i mesurar els tokens existents. Les afirmacions fotomètriques antigues no s'han reexecutat: falta càlcul sobre colors computats i geometria renderitzada. No es declara contrast 10/10 ni absència de desbordament universal a partir de JSDOM. `requires_human_decision: false` per accessibilitat; canvis visuals de disseny es concreten al pla de Claude.

### C1645-08 · P1 per a release pública · SDK modern i contingut de binari són comprovacions diferents

Al 2026-10-25, Apple exigix Xcode 26+ i SDK iOS 26+ des del 2026-04-28; Google exigix target Android 16/API 36 per noves apps i actualitzacions des del 2026-08-31. Les referències iOS 18/Android 15 del prompt estan desfasades com a requisit de publicació. Açò no obliga a pujar el sistema mínim dels veïns. [Apple](https://developer.apple.com/news/upcoming-requirements/?id=04282026a), [Google Play](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-en).

| Artefacte observat | Dades extretes | Límit del dictamen |
|---|---|---|
| `_builds_de_poble/ios/261024_socdepoble_1.0.0+1.xcarchive/Products/Applications/App.app/Info.plist` | 1.0.0(1), org.socdepoble.app, SDK iphoneos27.1, Xcode 2710, mínim 16.0; esquema Google encara `com.googleusercontent.apps.pendent`. | Complix la versió declarada del SDK; OAuth operatiu i aprovació remota no acreditats. |
| `_builds_de_poble/android/socdepoble-beta.apk` | aapt2: compile/target 36, mínim 24, 1.0.0(1), application-debuggable. SHA `3e6e6b2a4d698eed3d2d106b2f4d8d9bbd43c91c792e1a4d24b2fd9c6c03c72c`. | Beta depurable, no candidata de release pública. |
| `_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab` | SHA `8abbb21faaecce07bf6cc92a83b8e431560055e1f90a7fddf86ba5d8ccccedf2`; index empaquetat apunta a `/assets/index-BZGLZYBH.js`. | Target del projecte és 36; no s'inferix target/signatura de l'AAB només d'això. |

REA `inspect_plist`: evidència `ev_717936ea568ee7697553be1c319bc63e8de55dde149ee951874481c22b4afeca`, SHA del plist `723d9d8a2f248a08c01fb617a75c21525391307215a7a972abc9d86a3e685553`. Lectura estàtica, sense llançar l'app. La sessió REA s'ha tancat.

L'index HTML d'iOS i de l'AAB és idèntic: SHA `1e933ac07fe64dcab148f83f699c7745f8edcc54d8aae63e150870e2c03dbd61`; l'AAB coincidix amb dist-natiu actual. Això confirma que comparteixen el mateix build empaquetat, no que continga els canvis web del commit `b842160ac`. Falta manifest font-commit→assets→binari i control de versió mínima. P0-03/P0-23/P0-24 continuen vius. No s'ha compilat, signat ni pujat res, ni llegit claus privades.

**Ruta mínima:** validar el commit final → build natiu nou amb build ≥2 → cap sync → comparar tots els assets → prova d'autenticació/baixa/exportació/Arrere en aparell → preflight de release i signatura → pistes internes. `preflight.mjs:108-116` compara index.html, però no acredita tots els assets ni vigència respecte del codi: ampliar el manifest de release. `requires_human_decision: false` per preparar la candidata; publicació externa i credencials queden al circuit corresponent.

### C1645-09 · P2 · El transport Supabase no fita els bytes de resposta

`src/data/supabase/runtime.js:91-95` fa text/json complets sense sostre de bytes; el temporitzador de 12 s sí cobrix el cos, però no evita una resposta enorme rebuda dins del termini. La Frontissa, en canvi, comprova grandària declarada/real, UTF-8, MIME i termini (`creaFrontissa.js:60-105`). És una bretxa d'enduriment inspeccionada, no una pantalla caiguda reproduïda.

Posar pressupostos per operació i lectura per stream al transport/adaptador; conservar exportacions grans amb pressupost explícit i sense regla global que les trenque. DTO invalidat a l'adaptador i errors neutrals al port. La desconnexió ha de mantindre les dades ja visibles dins de l'àmbit de la sessió, esborrany i reintent honest; no activar llavor de demostració ni una segona font de veritat offline. Sollutia continua només GET i sense endpoints inventats. `requires_human_decision: false` per enduriment compatible.

### 2. Intel·ligència de la IAIA explicada al Mestre

La IAIA actual té **dos circuits**. Dins de l'app, BM25 busca fragments de la Wiki pública compilada i compon una resposta extractiva amb fonts: no hi ha un LLM raonant en eixe pas. Al bot Node hi ha Baileys, Google GenAI, cerca TF-IDF/cosinus i memòria episòdica; esta segona cadena té els bloquejos d'arrencada i de contracte anteriors. No s'ha acreditat que estiga en servei amb el número dedicat.

Les tres capes proposades són una direcció coherent si es descriuen com a pla: **rebost cultural verificat → resposta extractiva o LLM amb fragments i identitat → canal app/WhatsApp**. El número de telèfon és la porta d'entrada, no la font d'intel·ligència. El model genera la redacció; les fonts del rebost fonamenten els fets. Si no hi ha font suficient, la resposta ha de dir-ho i oferir derivació humana. No s'inclou indiscriminadament l'arxiu històric en RAG: cal corpus seleccionat, drets i permisos.

Reutilitzar ports i límits existents; LLM servidor, cap clau al bundle, corpus per visibilitat, límits per usuari/conversa/bytes i indicació clara de resposta assistida. Decidir Baileys/Cloud API, configuració del model i memòria/consentiment abans d'operar. No s'ha contractat cap línia, servici ni enviat cap missatge.

### 3. Ordre d'execució per traure els obrers del Mas

1. **Correcció del mapa:** IDs P1-18/P1-21, inventari real de veu/animacions, `xat_participants` i SDK; compactar fets amb traçabilitat i preservar pendents.
2. **Higiene verificable:** candidats de vida reutilitzant Olivera, proves instal·lades actives i consumidors abans d'arxivar; sense nou daemon ni cron.
3. **Habitabilitat immediata:** focus de taules Markdown, veu visible al compositor i validació visual de Notes/taules en navegador real.
4. **Xat complet per increments:** documents privats/quota → entrega → reaccions, cadascun amb contracte local/remot, migració/RLS i dos usuaris reals. E2EE queda com a treball explícit separat, no perdut.
5. **Bot entenedor i executable:** rutes/RAG/historial → corpus cultural → prova local amb proveïdor fingit → operació del canal triat.
6. **Distribució:** WP 5.8/PHP7.4 amb matriu real i pont antic; binaris nous amb procedència i versió superior, després de reconciliar el govern de publicació.

### 4. Millores al prompt i contrast amb les companyes

- Afegir estat «existent / parcial / proposat / desplegat» a cada petició. El prompt actual reconvoca construcció de veu i View Transitions ja fetes i usa una taula de lectures antiga.
- Usar ID canònic de deute, commit/hash, prova executada i capa acreditada (font, binari, runtime o producció). No descriure el precommit com tota la bateria.
- Expressar 20 MB com 20.000.000 bytes acumulats per persona, amb durada de vídeo separada; definir entrega i reaccions abans de dibuixar-les.
- Afegir l'escriptori/índex com a inventari explícit i mantenir lectura íntegra dels documents seleccionats; no convertir un índex de mil línies en una ordre de rellegir tota la memòria freda. La reducció de l'índex ha de preservar ancoratges de les zones protegides.
- Permetre auditories vives fins consum verificat, amb dependències/hash. «Commit» és evidència de versió, no prova que ningú més necessite llegir l'informe.
- Corregir data/hora dels documents 1645: el camp Modificació `16:45Z` no és `16:45 Europe/Madrid` el 2026-10-25 (UTC+1). No s'han modificat rebuts aliens.
- Lectura creuada final: Gemini 1645 ja conté conclusions; Claude 1705 continua amb contingut i verificació sense completar al tall. La taula següent reemplaça la lectura inicial de la plantilla Gemini. No es declara consens de tres informes acabats.

### 5. Contrast adversarial del nou informe Gemini 1645

Llegit íntegre (primera versió completa de 23.556 bytes i addició posterior de vincles; SHA al darrer tall `fe30cb327cecacaf7b4ccc97ca2804e819a82f3fe9d55f811d5a2e3a07e01326`). Claude 1705, SHA `e976af3e7aa5895c44e47e365d70de964018606d90079e9db45002ef75fe5f25`, continua sent un esquelet de 1.795 bytes. Les discrepàncies següents són d'evidència o d'execució, no de preferència estilística.

| Punt de Gemini | Contrast amb codi/artefactes i acció necessària |
|---|---|
| Olivera: falta olivera-fase.json i cal invalidar informes per timestamp | El fitxer existeix i fixa avis explícitament. No aplicar CONV-09 per hora: una onada posterior no acredita consum ni anul·la consumidor/retenció. No unir tots els !valid directament a arxivament; usar candidats de consum verificat de C1645-02. |
| Tancament proposat tooling/govern/tancament.mjs --id | La comanda disponible és `node tooling/gates/tancament.mjs --turn-id ID --close`; només tanca si les comprovacions són vàlides. No forçar-la ni resegellar deute alié per fabricar verd. |
| Cache offline de Frontissa amb clau recurs+hashParams | La proposta manca origen/captureId/tenant/actor/versió. El recurs perfil pot portar email; persistir-lo pot travessar àmbits i no pot revalidar permisos offline. Primer classificació públic/privat, claus completes, invalidació logout i zero fallback en 401/403. Preferir l'estat bo en memòria i avís; no localStorage síncron de més de 10 KB ni llavor substitutiva. És risc d'una proposta, no fuga actual demostrada. |
| Compressió de vídeo ja existent i entrega quan hi ha connexió Realtime | La preparació només neteja metadades del vídeo. Canal connectat no prova recepció del dispositiu; cal ack persistent dels altres. La taula vigent és xat_participants, no xat_lectures. |
| WP autònom pot declarar 5.8 amb total seguretat | El runtime autònom resol una dependència, però no apiVersion3/render. Cal callback/API compatible i prova real abans de rebaixar la capçalera. El fitxer principal empaquetat continua sent socdepoble-enxufe.php; no atribuir-li encara socdepoble.php. |
| Compilar amb iOS18 SDK i target35 | Requisits vigents més alts, comprovats en fonts oficials a C1645-08. El projecte ja target36 i l'arxiu iOS SDK27.1; no retrocedir-los. |
| IAIA Edge Function iaia, webhook oficial, TTS i corpus cultural en servei | supabase/functions/iaia/ no existeix al tall; el bot real és Baileys+GenAI separat. Menys de 20 ms, funcionament sense internet, corpus complet i compliment legal 100% no estan acreditats per eixa inspecció. Presentar les capes com a pla i reparar C1645-03/04. |
| Depuració completa certificada | Les cel·les històriques llargues i els deutes vius continuen presents; s'ha actualitzat el resum. Cal mesurar i compactar amb traçabilitat, sense declarar que només queden 31 idees. |

Convergim en l'àudio existent, límit de vídeo de 10 segons, documents/reaccions pendents, WM1/WM2, canvi d'àmbit P1-15 i la desconnexió entre vidaTaula i arxivables. Discrepem de l'activació automàtica per data i de les garanties de producte no reproduïdes. S'han registrat les reserves al Llibre per impedir que una proposta siga confosa amb un fet.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat observat |
|---|---|
| `npm run test:precommit` | Codi 0; 164 fitxers Vitest, 3.132 proves, 22,24 s; Node 259/259, 1,30 s, cap fail/skip/TODO. Log `/tmp/sdp-gauntlet-codex-precommit.log`. |
| Port/xat/IAIA/Frontissa | 11 fitxers, 287 proves úniques verdes (138 dades/conformitat + 149 UI). Portes Enxufe i Frontissa 0. |
| WordPress | 104/104 Node, 1,066 s; PHP 8.4.25 real amb fixtures, cap WordPress 5.8 instal·lat. |
| CSS/seguretat/ReDoS | 9 fitxers, 127/127, 3,06 s. |
| Taules/parser | 92/92, 3,00 s; PoC del focus del wrapper executada amb parser real/JSDOM. |
| Higiene instal·lada | Node Olivera v3 + arxiva: 37 passen, 1 falla (O13, laboratori Onada7 absent), 29 omeses. Laboratori de vida: 42 omeses. Estes proves NO formen part del verd 3.391. |
| REA/artefactes | Plist iOS analitzat amb evidència; aapt2 sobre APK i lectura ZIP de l'AAB. Sense executar apps. |
| Govern/documentació | Informe valid:true/errors:[]; Olivera i Autoritat 0. Primer tancament check: codi1, 1.401 incidències; fallaven segell, Wiki i SCC, a més de planificació/relleu propis que es completen abans del tall final. Log /tmp/sdp-gauntlet-codex-tancament.json. Resultat final registrat davall. |

### Tall final de verificació i relleu

- `document.mjs check` de l'informe: **valid:true, errors:[]**. `git diff --check`: 0. Olivera/Plantilles/Autoritat/LEDGER/Skills: 0.
- Últim `tancament.mjs --check --turn-id torn_05675b07-b173-48d1-a4a7-f8c4a8848419`: **codi 1, estat planned, 1.393 incidències**, amb Segell/Wiki/SCC en roig. Log `/tmp/sdp-gauntlet-codex-tancament-final.json`; snapshot del tall `50a146dab9defbd5289db959c5384bbbe4edf336059d47b72aef47271ce2c4d8`.
- El Llibre permanent té metadades heretades incompatibles amb la validació documental (falta rebut i tres tags fora d'enum). El segell executiu continua `6faf0aa1` contra `4a1546c3`; Wiki/SCC reporten enllaços/àncores/orfes pendents. No s'ha canviat la maquinària, els enums o els segells per ocultar-ho. Pla vinculat, propietat dels documents explicitada i relleus propis completats.
- El checksum del LEDGER era vàlid abans del relleu propi i continua vàlid després d'afegir-lo sota pany/CAS. No és una reconciliació del segell executiu divergent. ESTAT i Llibre recullen el resultat; l'auditoria queda disponible per a la consolidació i l'Acta Marmota següent.
- Comparació de hashes amb l'inventari inicial del torn: **cap delta en src/tooling/scripts/tests/supabase/wordpress-plugin ni configuració de producte** al tall final. El verd ràpid es conserva sobre les mateixes fonts. No s'ha executat `--close` amb comprovacions fallides ni es declara el torn segellat.
- Tres subagents finalitzats (un retorn final de servei va donar capacitat exhaurida després d'entregar totes les troballes, sense treball pendent); sessions de proves acabades, REA tancat, cap programa recurrent propi creat ni pendent.

**No sumar bateries solapades:** diverses proves dirigides ja entren al precommit. El total certificat d'esta comanda és 3.391, no la suma de tots els experiments. Els glob include de Vitest seleccionen fitxers, no multipliquen un fitxer per cada patró coincident. No s'ha fet una deduplicació semàntica exhaustiva de totes les assercions ni una execució global completa.

**Lectures:** normes requerides, pla i prompt vigents, índex de l'Escriptori, Llibre Mestre i Acta Marmota 1600; les revisions repartides han llegit els documents vius complets. Les fonts de codi citades s'han inspeccionat pel revisor corresponent, i el coordinador ha reproduït el bloqueig RAG i la inspecció dels binaris. No s'ha usat l'arxiu fred com a RAG ni llegit secrets.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

L'auditoria no desplega SQL, no canvia autenticació/autoritat/skills, no arxiva documents ni executa bot o canals externs. S'han actualitzat únicament l'informe, el Llibre Mestre, l'ancoratge canònic i els relleus d'ESTAT/LEDGER, a més dels registres del torn. El treball local preexistent i les edicions concurrents de les companyes es preserven.

No hi ha nova certificació de fotometria ni sessió real Safari/Android/iOS, PostgreSQL concurrent, compatibilitat real WP5.8/PHP7.4, endpoints de Sollutia o operació remota del bot. Les afirmacions d'execució d'altres torns continuen sent evidència històrica, no proves reexecutades ací.

Cap cron, schedule, watcher o servei persistent propi s'ha creat. Els tres subagents han acabat les proves i la sessió REA està tancada. No s'han cancel·lat programes permanents aliens ni el servidor de desenvolupament compartit.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1645_prompt_claude_gemini_codex_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1645_auditoria_gemini]]
- [[261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp]]
