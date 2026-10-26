---
type: informe
status: esborrany
description: 'Dissecció del commit 20d11564e: xat, concurrència, Storage, WordPress, Android, Model B i regressions amb proves reproduïbles.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_27504268-afde-4351-bdf6-4ec30edf4574:aabe9005-1c8b-46f3-89ad-72d4d3974d4c
---
# Gauntlet adversarial del commit 20d11564e

**Dictamen: no es certifica el 10/10.** Precommit3.410 verd; una regressió nova de consentiment reproduïda, compromís XHR i límits de cancel·lació Storage confirmats, i deutes preexistents separats. Cap canvi de producte aplicat.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_27504268-afde-4351-bdf6-4ec30edf4574:aabe9005-1c8b-46f3-89ad-72d4d3974d4c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T20:33:05.586Z |
| Modificació | 2026-10-25T21:49:45+01:00 |
| Propietari | Codex |
| Aprovació humana | auditoria encarregada pel Mestre; correccions no aplicades |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex · GPT-6 |
| Tokens consumits | mètrica de plataforma no disponible |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T21:45:33+01:00: auditoria sobre commit20d11564e; tres carrils independents, experiments diferencials i suite completa. Informe viu per a MarIA/Claude/Gemini/Mestre; no s'arxiva fins consum verificat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**NO a la certificació 10/10 ni al vistiplau de pujada amb les reserves actuals.** El precommit requerit passa: **3.151 Vitest + 259 Node = 3.410**, en **25,22 s de paret**. El commit aporta millores verificades, però introduïx una regressió de consentiment A→B→A que les proves noves no cobrixen; conserva deutes i compromisos de transport que no permeten les garanties absolutes del resum.

El cens real és **52 fitxers, +2.175/−131**, sobre `20d11564eb3865291d7c4d5ad03ad6a227dbb49e`, branca `backup-notes-publish`. Les xifres +2.109/−1.625 del prompt no corresponen al diff de Git. Els 52 fitxers vius coincidixen byte a byte amb el commit al tall verificat. No s'ha canviat producte per fer passar les proves.

### Matriu de conformitat de requeriments (MCR)

| Requeriment | Estat | Evidència | Què impedix tancar-lo |
|---|---|---|---|
| Cens i revisió del commit | [FET] | git show --stat/--numstat; 52 hashes iguals al commit; tres carrils independents i contrast del coordinador | Cens del prompt rectificat. |
| Reproductor: velocitat, una veu activa, temps i neteja | [PARCIAL] | 28 proves originals; 117 gravació/controls; stress de 1.000 posicions i 100 muntatges | C2120-04, carrera de signatura preexistent; WebKit/dispositiu físic no provats. |
| P1-15: àmbit i respostes tardanes | [PARCIAL] | Hooks separen backend/persona; controls A→B verds; PoC diferencial A→B→A | C2120-01 és nova; operacions per organització no serialitzades ni reconciliades. |
| Storage: termini i alliberament | [PARCIAL] | Temporitzadors es netegen; download/list reben signal; SDK real instrumentat | No és un límit universal de 45 s; upload/sign/remove poden continuar després del termini (C2120-03). |
| WordPress 5.8–6.0 | [PARCIAL] | render_callback compartit, sanejament i 46 proves de perímetre | Header continua 6.5, variant/paquet antic sense certificar i fallback de locale congelat (C2120-05). |
| Back Android | [PARCIAL] | Callback amb LifecycleOwner, delegació desactivant-lo i router popstate inspeccionats | Cap bucle demostrat; falta emulador/aparell, modals, teclat, reinici i gest predictiu. |
| Model B i SPA modular | [FET] per al diff estàtic | Enxufe, Frontissa, Sollutia, adaptadors i RLS: codi 0 | No acredita endpoints Sollutia operatius ni RLS remota/concurrent. |
| Precommit 3.410 | [FET] | 165 fitxers Vitest/3.151 proves +259 Node, cap fallada | El recompte no equival a la suite sencera. |
| Suite sencera / màxima regressió | [PARCIAL] | 22.333 passen, 3 fallen, 100 omeses; Node 1.038/1.045 passen, 4 omeses, 3 TODO | Tres fallades globals preexistents; una depén de l'entorn. |
| audit:seguretat i vigilant | [NO FET] | Les dos comandes requerides retornen Missing script | No existixen a package.json; no es poden presentar com a portes passades. |
| Informe/Llibre/relleu i desconvocatòria | [FET auditoria / PARCIAL govern] | Informe validat, Llibre/ESTAT/LEDGER actualitzats; cap procés propi pendent | Tancament --check exit1/planned, 1.393 incidències heretades; no es força el segell. |

### C2120-01 · P2 · Nova regressió: tornar A→B→A deixa el consentiment contrari al servidor

**Fitxer:** `src/sections/profile/GestioMembres.jsx:80-84,102-112,121-125`. La guarda nova evita que una resposta d'A escriga sobre B. Però canviar d'entitat puja `triaVigent`, lleva `desant` i buida `pendent`, mentre `marcaTitularPublic(A, ...)` continua sense senyal de cancel·lació. En tornar A, es fa una lectura abans d'acabar l'escriptura antiga; quan esta confirma, `!vigent()` la descarta i no hi ha una altra lectura.

**PoC React/jsdom diferencial, amb promeses diferides:**

1. A té consentiment false; es demana true i la promesa queda pendent.
2. Es visita B i es torna A; la lectura encara retorna false.
3. El servidor simulat confirma true per a A.
4. **Esperat:** casella A reconciliada amb true, o ocupació fins resoldre l'operació.
5. **Actual:** servidor true, casella false, sense aria-busy i sense nova lectura. Invertint alta/revocació també falla.

La mateixa seqüència sobre la font de `20d11564e^` deixa la casella concordant. És una regressió del nou comptador/reset, no una atribució per intuïció. El coordinador ha reexecutat una prova amb l'assert del contracte correcte: **roja, expected true to be false** en el cas de revocació. Log `/tmp/sdp2120-tria-root-red.log`.

**Cas reforçat:** després del retorn, es permet una altra alta i una revocació confirmada. Si l'alta primera s'executa tard, el servidor simulat queda true mentre la pantalla conserva false i «Ja no et mostrem com a titular». Açò modela una ordenació possible d'operacions sense versió; no és una prova de PostgreSQL/producció ni una fuga remota observada. L'impacte verificat és una falsa representació del consentiment i més d'una escriptura en vol per organització.

**Integració inspeccionada:** la clau del Perfil inclou persona/sessió/backend, però no l'organització activa; `DetallCompte.jsx:153-154` i `DetallAjust.jsx:459` reutilitzen GestioMembres. `marcaTitularPublic` no refresca organitzacions després del RPC. No hi ha un remuntatge o refresc implícit que resolga el cas.

**Correcció mínima proposada:** conservar i serialitzar les operacions pendents per backend/persona/organització, permetent treballar amb B sense perdre l'operació d'A; reconciliar A amb una lectura després de completar-la. Si s'admeten intencions successives, assegurar l'ordre i l'última intenció amb el contracte corresponent. No llevar la guarda nova i reintroduir la contaminació A→B.

**Controls:** resolució/rebuig tardà d'A no modifica B; hooks de titular/fitxa separen backend/persona; el Perfil es remunta quan canvia l'actor de sessió. Reutilitzar el DTO d'A en tornar A és un tema de frescor preexistent: no s'ha elevat a fuga entre persones.

`requires_human_decision: false` per reparar la cursa sense canviar la semàntica del consentiment. Font de veritat: P1-15 i contracte de consentiment, no el text del resum del commit. Evidència: `/tmp/sdp2120-concurrency-adversarial.log`, harness `/tmp/sdp2120-concurrency-harness/` i els quatre casos diferencials commit/pare en els dos sentits.

### C2120-02 · P2 · Regressió de transport coneguda: el progrés XHR deixa eixir el cos en una redirecció

**Fitxers:** `src/data/supabase/xatMultimedia.js:38-63,81-89`, `ControlsAdjunt.jsx` i `XatContext.jsx` en passar `onProgres`. Quan hi ha callback de progrés, s'usa XMLHttpRequest. La ruta anterior usava fetch amb redirect:error. Comparar `responseURL` en onload detecta la redirecció després d'haver-la seguida.

**Prova executable de transport:** dos servidors HTTP efímers diferents, només a 127.0.0.1, amb cos `SYNTHETIC_PRIVATE_AUDIO_2120`; el primer respon 307 i el segon captura el POST. XMLHttpRequest de jsdom segueix la redirecció; el segon rep tot el cos i responseURL és la segona adreça. La comprovació de l'app rebutjaria la resposta quan el cos ja ha eixit. Script `/tmp/sdp2120-xhr-redirect.mjs`, resultat `/tmp/sdp2120-xhr-redirect.log`. Cap adjunt real, credencial ni servei extern. Els dos servidors es tanquen en finally.

**Límit i precedència:** és nou respecte del pare, però Claude ja el reconeix al comentari i a l'informe 1705. Requerix que l'endpoint/proxy de Storage redirigisca; no s'ha demostrat que el node real ho faça ni una exfiltració en producció. El node original ja rep el cos: no s'ha presentat açò com un bypass d'un servidor compromés. Sí és una pèrdua de la garantia anterior de no reenviament a un altre destí.

**Proposta conservadora:** mantindre redirect:error amb progrés indeterminat mentre no s'acredite un camí de pujada sense redirecció, o fer explícita i revisar la política de transport. No convertir la comprovació posterior en una garantia de confidencialitat prèvia. El percentatge no hauria de seleccionar silenciosament una garantia de xarxa inferior.

`requires_human_decision: true` per acceptar este compromís de transport; si no s'accepta, conservar la garantia anterior. La seua documentació no equival a acceptació humana acreditada en este torn.

### C2120-03 · P2 · Storage limita l'espera de la vista, però no totes les peticions amb efectes

**Fitxers:** `src/data/supabase/storage.js:43-54,239-242,272-275,328-342,387-400,641-645`; SDK instal·lat `@supabase/storage-js 2.112.4`.

`ambTermini` neteja el timer i consumeix un resultat tardà amb Promise.race. download/list reben el senyal. upload, createSignedUrl i remove no el reben per la seua API: avortar el controlador no cancel·la eixes peticions. Açò ja està explicat per Claude; el resum «controladors alliberats» no ha de convertir-ho en «operacions cancel·lades».

**Prova nova amb el SDK instal·lat, no una promesa d'upload inventada:** s'executa el storage.js real transformat a CJS, injectant el client real StorageClient i un fetch sintètic que manté les respostes pendents. Després de cinc pujades/terminis:

| Mesura | Resultat |
|---|---:|
| Wrappers acabats amb TimeoutError traduït | 5 |
| Temporitzadors actius del wrapper | 0 |
| Peticions SDK encara pendents | 5 |
| Peticions amb AbortSignal | 0 |
| Rutes distintes que poden completar-se tard en el servidor simulat | 5 |
| Wrappers que reben després el resultat d'èxit | 0 |

Script `/tmp/sdp2120-storage-sdk.cjs`, log `/tmp/sdp2120-storage-sdk.log`. Les respostes es resolen en acabar: no queda cap procés ni petició real. El recompte acredita concurrència pendent i rutes deslligades; **no és una mesura de heap ni una prova de fuita de memòria irrecuperable**. En un servidor real, una pujada tardana pot deixar un objecte que la vista considera fallit; cal cancel·lació i/o reconciliació, no sols deixar d'esperar.

**El límit no és 45 s fixos:** les operacions curtes tenen 12 s; la pujada és `30.000 + ceil(bytes/50.000)×1.000` ms. 3 MB →90 s; 20 MB →430 s; la baixada pren el màxim privat de 25 MiB →555 s. Són terminis finits i proporcionals, no el sostre universal del prompt.

**Proposta:** transport cancel·lable per operació dins de l'adaptador, sense sobreescriure un senyal global compartit entre crides; fita d'operacions en vol i idempotència/reconciliació d'efectes tardans. Distingir timeout d'inabastable quan el servidor pot haver executat l'operació. Mantindre el port neutral.

`requires_human_decision: true` només per confirmar el pressupost de temps/semàntica d'estat; la reparació d'alliberament i reconciliació és tècnica. No s'ha aplicat cap canvi.

### C2120-04 · P2 · Àudio: un error de signatura antic cancel·la l'intent nou (preexistent)

**Fitxer:** `src/sections/xat/components/AdjuntXat.jsx:133-150`.

Prémer A → pausa → reprendre abans de rebre la primera signatura crea dos càrregues independents. Si falla la primera, el catch antic posa `volSonar.current=false`; quan resol la segona, el then la descarta i src queda null. També passa amb A→B→A. L'adaptador real només cacheja signatures resoltes, no deduplica promeses pendents: l'escenari de dos peticions és possible.

**Reproducció:** dos tests de contracte rojos a `/tmp/sdp2120-audio-url-current.log`. Substituint la font en memòria pel pare, mateixa fallada a `/tmp/sdp2120-audio-prior-proof.log`: **no és una regressió introduïda per 20d11564e**. Un control amb generació per càrrega aplicada només al transform temporal fa passar els dos casos, conservant els originals: `/tmp/sdp2120-audio-url-epoch-positive.log`. Cap font del repositori editada.

**Correcció proposada:** generació per càrrega invalidada en cancel·lar/desmuntar i comprovada en then/catch/finally; propagar AbortSignal quan el contracte ho admeta. No basta una bandera de viu compartida per intents diferents.

**Allò que sí funciona:** 1×/1,5×/2× compartit, exclusió en el camí normal A→B, represa per persona i alliberament d'element en desmuntar. Les posicions estan acotades a **300** i els oients de velocitat es desubscriuen. Prova independent en memòria: 1.000 posicions retenen 300; 100 muntatges/desmuntatges retornen a zero oients, cap veu activa. `/tmp/sdp2120-memory.log`.

El literal `sdp-xat-reprodueix-veu` **no existix al src del commit**. La coordinació és el singleton de mòdul veus, no un listener DOM d'eixe nom. No s'ha inventat una fuita del listener que el prompt suposa.

**Candidat descartat com a troballa certificada:** un play tardà modelat pot reprendre propietat de la veu, però el contracte també admet play extern al botó. Sense navegador natiu, no s'ha elevat a regressió ni proposat una guarda estricta que trencaria eixe contracte. Safari/iOS, falta de metadades i gestos ràpids han de provar-se en dispositiu. `requires_human_decision: false` per la cursa confirmada de signatures.

### C2120-05 · P2 abans de baixar a WP5.8; P3 amb la capçalera actual · La reserva d'idioma queda congelada

**Fitxer:** `wordpress-plugin/includes/idioma.php:28-77`. Abans de WP6.5, sense catàleg extern carregat, l'array de missatges es captura a init en una closure. Un switch_to_locale posterior no el modifica, com reconeix el mateix comentari del codi.

**PoC amb classe oficial WP_Locale_Switcher de 5.8, motor de hooks i fronteres simulades:** ca→en_US retorna true i determine_locale=en_US, però «Village name» continua «Nom del poble». En_US→ca també retorna true i el text continua en anglés. Script `/tmp/sdp2120-perimeter-locale-poc.php`; logs `/tmp/sdp2120-perimeter-locale-ca.log` i `…-en.log`. [Contracte WordPress](https://developer.wordpress.org/reference/functions/switch_to_locale/).

**Proposta mínima:** filtre registrat una sola vegada que resolga/cachege el catàleg per locale actual, o invalidació a change_locale, també si l'arrencada no tenia catàleg. El sòl actual 6.5 evita exposar este camí com una release 5.8; és una reserva contra la futura promesa, no una incidència demostrada de la versió vigent.

**Render i seguretat:** callback compartit amb render.php, atributs escalares sanejats, escapament i ruta limitada; cap injecció nova demostrada. [El registre oficial de WP5.8 admet el callback](https://github.com/WordPress/wordpress-develop/blob/5.8/src/wp-includes/blocks.php). Les fixtures fan part de les API de mentides, inclòs KSES pass-through: 46 proves verdes no certifiquen una instal·lació WP5.8/PHP7.4/multisite real. La variant externa de React i la capçalera 6.5 encara s'han de resoldre en el paquet; «PHP i JS 100% compatibles» seria excessiu.

`requires_human_decision: false` per corregir locale; true per triar/publicar variant i sòl definitiu. No s'ha baixat la capçalera.

### Deute de proves confirmat, separat de les regressions

La suite sencera del checkout dóna **3 errors**, no els 2 de la còpia de Claude:

- Dos `censImatges`, sobre fitxers no modificats pel commit i ja declarats al seu informe.
- `App.appsLocals.test.jsx:233`: la fixture només substituïx backendPort, però el servei de notícies també usa la configuració de compilació. En el checkout amb endpoint, el fetch simulat rep GET /noticies/fonts i contradiu «cap xarxa».

**Diferencial del tercer error:** amb el mateix vite.config, entorn i un worker, falla tant en actual com amb els src canviats substituïts en memòria pels del pare. Amb `VITE_SUPABASE_URL=''`, passen tots dos. Cap HTTP real ni lectura de secrets. És una fixture preexistent no hermètica, no una regressió atribuïda a este commit. Logs `/tmp/sdp2120-appslector-parent-{current,retest,noendpoint,current-noendpoint}.log` i `…-loaded.log`.

La cadena Node completa de la configuració per defecte retorna codi0: 1.045 proves, 1.038 passen, 4 omeses i 3 TODO. Els TODO porten assercions de diagnòstic fallides sobre classes/tokens heretats; no s'han presentat com reparacions ni com 1.045 assercions verdes. La llista de scripts de package.json confirma que **audit:seguretat i vigilant no estan implementats** amb eixos noms. Les portes existents s'han executat, sense inventar cap substitut equivalent.

### Perímetre, Notes i Model B: resultats favorables amb límits

- **Android:** el callback es registra amb LifecycleOwner; desactiva la seua pròpia captura en delegar al sistema, i el router escolta popstate. Cap bucle infinit ni fuga de callback demostrats. [Patró oficial Android](https://developer.android.com/guide/navigation/navigation-custom-back). No s'ha compilat un binari ni provat un mòbil/emulador; Back ràpid, diàleg/teclat i gest predictiu continuen com a verificació nativa, no resultats inventats.
- **Vite:** cacheDir per arrel i detecció de symlinks comprovats per les proves. En el diff Git s'afig dedupe/include/cacheDir; els àlies absoluts de React no eren al pare. La seua retirada descriu l'arbre intermedi, no una eliminació versionada. El relat causal del crash és una inferència forense; esta auditoria no ha reproduït el crash original.
- **ErrorBoundary, Core/Mur i mergeById:** milloren el tractament de llistes/objectes i amaguen el text cru fora de DEV. No s'ha convertit una guarda d'array/objecte en certificació de qualsevol DTO hostil possible.
- **Model B:** backendPort, Frontissa i PedraSecaEmbed no canvien; UI continua per ports. onProgres és opcional i se separa abans de RPC. Enxufe, Frontissa, Sollutia, adaptadors i RLS estàtica passen. Cap dependència nova, SDK privatiu a la UI o POST a la Frontissa demostrat al diff.

### Contrast de l'informe Gemini 2120 (llegit íntegre)

Convergència: recompte 3.410, temporitzadors netejats, senyals download/list, risc XHR, callback WordPress i separació Model B. Les conclusions següents necessiten correcció abans de consolidar-les:

| Afirmació Gemini | Contrast de Codex |
|---|---|
| P1-15 és «10/10 absolut» i elimina tota escriptura fantasma | Refutat per C2120-01: guarda correcta A→B, però regressió A→B→A amb consentiment desfasat. |
| G2120-02: posicions sense límit/LRU | Refutat: MAXIM_POSICIONS=300 i poda a recordaPosicio, confirmades amb 1.000 entrades. La velocitat és preferència global i les posicions van per persona; retenció no equival a fuga entre persones. |
| El cleanup del reproductor avorta controlRef | No hi ha controlRef en la font inspeccionada. Pausa i buida src, però les promeses antigues de signatura continuen; C2120-04 les reproduïx. |
| G2120-01: gravar amb un àudio actiu produïx acoblament acústic | El camí de gravació no pausa el reproductor, però l'efecte acústic no s'ha mesurat i depén de navegador/hardware/echo cancellation. Tractar-ho com prova UX pendent, no com captura acústica observada. |
| G2120-05: WebKit restablix playbackRate a1 | Falta evidència en WebKit/iPhone. És un cas per validar, no una regressió nativa certificada per jsdom. |
| Plugin PHP/JS100% WP5.8 | No hi ha activació real en eixa versió; header6.5, runtime del paquet i C2120-05 impedixen la certificació absoluta. |
| Set P2/P3 totes demostrades | Separar prova executada, inspecció estàtica, risc condicional i hipòtesi de dispositiu. El nombre d'etiquetes no substituïx esta distinció. |

No s'ha modificat l'informe de Gemini. Les reserves s'anoten al Llibre i al nostre informe per a la consolidació de MarIA.

### Cobertura de lectura i retroalimentació al prompt

El diff dels 52 fitxers s'ha repartit per superfície: veu/gravadora i les seues proves; Connectar/Perfil/proveïdors/mapeig; WordPress/Android/Vite; Storage i transport multimèdia pel coordinador. Revisors independents, amb context net per carril. S'han contrastat pla/prompt1645, informes1701/1705/Gemini1645 i nou Gemini2120, índex i Llibre. No s'ha llegit arxiu fred ni secrets per a buscar més volum.

Millores concretes del prompt: generar cens des de Git; distingir precommit i suite sencera; substituir comandes inexistents per scripts reals sense dir que són equivalents; citar la coordinació veus existent en lloc d'un esdeveniment absent; concretar terminis adaptatius en lloc de «45s»; exigir seqüències A→B→A i resultat servidor/UI; exigir prova real abans de dir Android/WP antic/Safari100%. Lligar un pla vigent propi de l'onada abans d'obrir-ne el prompt, i conservar informes pendents de lectura amb consumidor explícit.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Execució | Resultat i log |
|---|---|
| npm run test:precommit | 3.151 Vitest/165 fitxers +259 Node; cap fail/skip/TODO. Vitest23,24s, paret25,22s. /tmp/sdp2120-precommit.log |
| npm run test:unit | 1.310 fitxers:1.299 passen/2fallen/9omesos;22.436 proves:22.333passen/3fallen/100omeses.629,61s paret. /tmp/sdp2120-vitest-full.log |
| npm run test:node | Codi0;1.045 proves,1.038passen,4omeses,3TODO;50,51s paret. /tmp/sdp2120-node-primary.log |
| npm run lint | Codi0; cap error/avís. /tmp/sdp2120-lint.log |
| Perímetre WP/Vite | 46/46; PHP8.4.25/fixtures, no WP antic complet. /tmp/sdp2120-perimeter-tests.log |
| Concurrència/hooks/adjunt | 68 proves del harness amb controls i asserts del comportament observat. /tmp/sdp2120-concurrency-adversarial.log |
| Contracte correcte Tria | 1roig,34altres no executats; expectedfalse/actualtrue. /tmp/sdp2120-tria-root-red.log |
| Àudio originals | 28reproductor +117gravació/controls verds; se solapen amb suiteglobal. Logs /tmp/sdp2120-audio-existing.log i /tmp/sdp2120-audio-record-controls.log. |
| Cursa signatures | 2rojos; pare també afectat; control temporal amb epoch verd. Logs /tmp/sdp2120-audio-url-current.log, /tmp/sdp2120-audio-prior-proof.log i /tmp/sdp2120-audio-url-epoch-positive.log. |
| Memòria i subscripcions | 1test verd:1.000posicions→300,100muntatges→0oients. /tmp/sdp2120-memory.log |
| SDKStorage/XHR | Experiments sintètics C2120-02/03; /tmp/sdp2120-storage-sdk.log i /tmp/sdp2120-xhr-redirect.log. |
| Portes | Enxufe/Frontissa/Sollutia/adaptadors/RLS/Autoritat0; Olivera0 amb avisos de sediment. |
| Scripts inexistents | audit:seguretat i vigilant:exit1 Missing script. /tmp/sdp2120-audit-seguretat.log i /tmp/sdp2120-vigilant.log. |
| Font exacta | /tmp/sdp2120-reviewed-manifest.json:52/52 iguals al commit. |

**Tancament documental final:** `node tooling/gates/tancament.mjs --check --turn-id torn_27504268-afde-4351-bdf6-4ec30edf4574` acaba amb **exit1, valid:false, state:planned i 1.393 incidències**. Passen Olivera, plantilles, Autoritat, LEDGER i skills; fallen segell, Wiki i SCC. El Llibre permanent conserva el rebut absent i tres tags fora de l'enum; el segell actual6faf0aa1 no coincidix amb4a1546c3. Mateix recompte i famílies de deute que al tall anterior1701, sense fabricar un verd. Cap error atribuït a l'informe2120 nou. Log `/tmp/sdp2120-tancament.json`. Llibre, ESTAT i relleu LEDGER d'este torn escrits; checksum LEDGER previ i posterior vàlids, cos anterior preservat. L'auditoria està emesa; el govern global no queda certificat ni el torn declarat tancat mecànicament.

No se sumen bateries solapades ni es compten com reparacions les proves verdes que demostren defectes. Els intents inicials d'harness rebutjats pel sandbox/configuració es separen dels resultats executats; no són fallades del producte. El test HTTP s'ha executat amb permisos per a dos ports locals efímers, sense eixida a internet.

**Lectures completes de context:** Llibre184línies/133.432B, índex1.059línies/66.906B, pla1645, prompt1645, Codex1701, Gemini1645 i Claude1705 llegits íntegres pel carril documental, a més del prompt2120 i Gemini2120 pel coordinador. Llibre al tall de lectura: SHA06d2a9b3011d43e123fbb3727eac8481829b9e6751ec34d1b5a12705191b767e. Normes requerides i plantilla canònica llegides; cap arxiu fred ni secret carregat.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s'ha fet cap commit/push, publicació, instal·lació, nova dependència, migració, canvi d'autenticació/skills/autoritat, arxivament ni mutació de producte. Les úniques escriptures permanents del torn són informe, Llibre, ancoratge, relleus ESTAT/LEDGER i registres documentals. Les proves noves són temporals; les seqüències reproduïbles queden explicades ací.

No s'han certificat iPhone/Android reals, emulador, WordPress5.8/PHP7.4/multisite complet ni PostgreSQL concurrent. No s'ha inferit una fuga de heap de la retenció temporal d'una petició; no s'ha inferit seguretat de producció d'un RLS estàtic.

No s'ha creat cap cron, watcher o daemon. La guàrdia històrica estava inactiva/finalitzada. Els servidors HTTP s'han tancat en finally; els subagents confirmen fi i els processos de proves han acabat. Els serveis compartits aliens queden preservats. El tancament global es registra sense relaxar portes.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_2120_prompt_codex_gemini_gauntlet_loop_audit_commit_20d11564e]]
- [[261025_2120_auditoria_gemini]]
- [[261025_1705_auditoria_claude]]
- [[261025_1701_auditoria_codex]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
