---
type: informe
status: esborrany
description: 'Informe de Claude de la Fase C: Capacitor 8.5.3, política de mitjans al build natiu, scripts de botigues, isSafeUrl, UX de la cerca i pes del Core, amb evidència de build i proves.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3daa5af4-d897-4563-8b40-cd636bc7ff2d:7e8726e9-7736-4dbc-89ff-faccd197d76f
---
# Auditoria de Claude · Fase C: closca Capacitor 8, mitjans natius, botigues, cerca i pes del Core

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3daa5af4-d897-4563-8b40-cd636bc7ff2d:7e8726e9-7736-4dbc-89ff-faccd197d76f |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T19:55:10.944Z |
| Modificació | 2026-10-19T22:23:08Z |
| Propietari | claude |
| Aprovació humana | pendent: l'encàrrec el va aprovar el Mestre per àudio (19/10/2026 21:13); els canvis són a l'arbre de treball, sense commit |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Code (Opus 5.5), amb 4 workflows i 35 subagents |
| Tokens consumits | ≈ 8,4 M dels subagents, més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T19:55:10.944Z: esborrany creat (torn `torn_3daa5af4`, ruta `auditoria`).
- 2026-10-19T19:58:00Z: relleu de progrés. Capacitor 8.5.3 instal·lat, `capacitor.config.json`, `.gitignore` i exclusions de l'arrel.
- 2026-10-19T21:50:00Z: informe complet. Implementació de les tasques 1-5 i 9, anàlisis de les tasques 5-8, validació en còpies (build natiu, Android, iOS i pes del Core), consens amb l'informe de Gemini, i pla vinculat al torn amb `document.mjs plan`.
- 2026-10-19T22:23:08Z: pegats d'higiene revisats. Un verificador adversarial hi va trobar una regressió en l'adopció per rebut; s'ha llevat, s'ha tornat a verificar i s'han substituït els pegats del laboratori (§7).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

- **La closca de Capacitor 8 està posada i el paquet natiu ja no porta els originals pesants.** `@capacitor/core`, `android`, `ios` i `cli` fixats a **8.5.3 exacta** (l'última estable de la 8.5), `capacitor.config.json` a l'arrel i el build natiu amb la política de mitjans `autonom`: **167.506.364 B → 49.017.956 B (−70,7 %)**, mesurat amb el script real `npm run build:natiu` sobre l'arbre final.
- **El codi no és el que pesa.** Tot el JS i el CSS del paquet natiu fan uns 5,0 MB crus (1,6 MB amb gzip); la resta eren fotos. Però l'arrencada carrega més del que caldria: §6 diu quant, per què i com baixar-ho.
- **Fet a l'arbre (sense commit):** scripts de botigues, `isSafeUrl` per a iOS, cerca amb el camp davall de l'H1 i vista de targetes, i botó «Veure fitxa pública». En revisar han eixit cinc correccions més: `sanitize.js` per a les imatges pròpies a iOS, `runtimePolicy.js`, `-packageAuthorizationProvider netrc` a `puja-ios.mjs`, les claus d'i18n a cinc llengües i dues proves que fixaven el comportament antic.
- **Validat en còpies fora del repo:** l'APK de debug d'Android es compila; l'app iOS es compila i arranca al simulador. El Vitest complet dona 19.843 proves, amb 1 fallada que és d'un altre agent.
- **El que és vostre de decidir** està reunit a §11. Les dues coses més urgents no són de la Fase C: un testimoni `mcp_token` versionat a git dins d'un `.webloc` del laboratori (cal revocar-lo) i una migració que obri `contact_email` de les organitzacions al rol anònim (no s'ha d'aplicar així).

### 1. Closca Capacitor 8 (tasques 1 i 3)

**Dependències [VERIFICAT].** Al registre npm la branca 8 té `latest: 8.5.3`; `@capacitor/android` i `@capacitor/ios` 8.5.3 demanen `@capacitor/core ^8.5.0`, i `@capacitor/cli` 8.5.3 demana Node ≥ 22 (aquesta màquina té Node 24.13.0). L'encàrrec deia `^8.5.0` però també «versió fixada 8.5.x»; el laboratori (FASES_1_I_2.txt §1) demana versió exacta per a tots els `@capacitor/*`. He fixat **8.5.3 exacta**: casa amb les dues coses i evita que el JS i els projectes natius es desquadren.

- El lock s'ha resolt primer en una còpia fora del repo. Després, `npm install --no-audit --no-fund --ignore-scripts` a l'arbre viu.
- Resultat contra l'HEAD [VERIFICAT]: 85 entrades noves, cap d'esborrada i cap versió canviada. 16 entrades tenen metadades retocades:
  - l'arrel, on el lock fixava `dompurify` a `3.4.14` mentre `package.json` diu `^3.4.14`;
  - 13 marques `peer` (react, react-dom, vite, eslint…);
  - 3 marques `optional` de `@floating-ui/*`.
- npm també ha reorganitzat `node_modules` (526 paquets afegits, 410 llevats). He comprovat que cap import del repo no s'ha quedat sense paquet; `sharp`, que el tractor WebP prova d'importar, no s'havia instal·lat mai.
- La BIOS (QUI_SOC §5) prohibix `npm install` sense aprovació. L'ordre ve del vostre encàrrec (tasca 3, «corre `npm install --no-audit`»); ho deixe escrit perquè conste.

**Scripts nous a `package.json`** (els de FASES_1_I_2.txt §1 i nous/botigues/LLEGIU.txt §6): `build:natiu`, `cap:sync`, `cap:android`, `cap:ios`, `botigues:preflight`, `botigues:ios`, `botigues:android`. `npm run porta:arrel` (A2, scripts vius) els accepta.

**`capacitor.config.json`** és còpia exacta del laboratori: `appId org.socdepoble.app`, `appName Sóc de Poble`, `webDir dist-natiu`, `androidScheme https`, `iosScheme capacitor`, `hostname localhost`, `minWebViewVersion 100`, `allowMixedContent false`, `CapacitorHttp` i `CapacitorCookies` apagats [VERIFICAT amb el `node -e` del pla]. Contrastat amb `node_modules/@capacitor/cli/dist/declarations.d.ts` 8.5.3: tots els valors són els de per defecte menys `minWebViewVersion` (60 per defecte). Sense `server.errorPath`, un WebView antic només deixa un error a Logcat i l'app es carrega igual (`Bridge.java:305-312`): vegeu §4.

**`.gitignore` i arrel.** Les línies de FASE_PRELEASE_FETA.txt §6 (eixides natives i fitxers de claus: `/dist-natiu/`, `android/app/build/`, `ios/App/App/public/`, `*.p8`, `*.jks`…). `tooling/lib/arrel.mjs`: `dist-natiu`, `android` i `ios` a `EXCLOSOS` (opció a de FASES_1_I_2.txt §6), amb el comentari que cap carpeta del codi no es dirà `android` ni `ios`.

**El que no he fet a l'arbre, a posta:** `npx cap add android` i `npx cap add ios`. El laboratori els assigna al Mestre (equip de signatura, Bundle ID a App Store Connect). Els he provat en còpies (§9).

**Risc de `@capacitor/assets` (Riscos §3).** No s'ha generat cap icona: el laboratori (FASES_1_I_2.txt, «Res de @capacitor/assets») ho fa amb Xcode, Android Studio, `sips` i `qlmanage`. Si algun dia s'usa `@capacitor/assets`, sempre amb `--ios --android` i `--assetPath` fora de `public/`, com diu l'encàrrec.

### 2. Política de mitjans al build natiu (tasca 2)

`vite.natiu.config.js` aplica ara la política `autonom` (D3) pels dos camins que fa servir el paquet autònom, i calen tots dos o les imatges es trenquen dins de l'app:

1. `recursosPublicsDelPlugin({ politica })`: els originals amb bessona no s'emeten.
2. `define['import.meta.env.SDP_POLITICA_DE_MITJANS']`: `resolveAsset` demana la bessona `.webp` en lloc de l'original.

La política la calcula una peça pura nova, `politicaDeMitjansNativa`: sempre local (`origen: null`, `externs: []`), perquè la CSP nativa no deixa demanar mitjans fora de l'app.

**Desviació de l'encàrrec, justificada.** L'encàrrec deia importar `politicaDeMitjans` i `separaRecursos` de `src/config/politicaDeMitjans.js`. `politicaDeMitjans` viu de veres a `vite.standalone.config.js:163`, i `separaRecursos` ja l'aplica `recursosPublicsDelPlugin`: importar-lo de nou duplicaria codi.

**Dos originals continuen dins, a posta.** Una auditoria de tots els llocs on l'app nomena les 127 imatges substituïdes n'ha trobat exactament dues que es demanen en literal, sense passar pel resolutor:

| Original | On es cita | Per què es trencaria |
| --- | --- | --- |
| `assets/system/ui/xat-bg-map-v2.jpg` (1.206.537 B) | `src/css/tokens.css:531`, `url(...)` del fons del Xat | `PedraSecaEmbed.jsx:970-974` només el reescriu dins de `<soc-de-poble>` amb una base; l'app nativa no munta l'element |
| `assets/notes/bloc_notes_vintage.jpg` (764.194 B) | `EspecimenEnquadrament.jsx:193`, `setFont(MOSTRA)` | el diàleg el descarrega amb `fetch()` sense resoldre'l |

Viatgen dins (llista `ORIGINALS_CITATS_SENSE_RESOLUTOR`, amb prova que falla si la cita desapareix o si un `url()` nou de `src/**/*.css` cita un original amb bessona). Les dues correccions de fons són a §11: amb elles la llista queda buida i el paquet baixa uns 1,97 MB més.

**Mesura real.** L'«abans» és el build amb la configuració de l'HEAD. L'«ara» és `npm run build:natiu` sobre l'arbre final; el primer build del front, abans dels canvis d'UX, en feia 49.016.577.

| Mesura | Abans (HEAD) | Ara | Canvi |
| --- | ---: | ---: | ---: |
| Bytes totals de `dist-natiu/` | 167.506.364 | 49.017.956 | −70,74 % |
| `du -sk` | 165.028 KB | 49.056 KB | −70,27 % |
| Fitxers | 659 | 532 | −127 |
| JS + CSS crus | 4.962.177 B | 4.984.541 B | +22.364 B (la política segellada i els canvis d'UX) |
| JS + CSS amb gzip -9 | 1.619.047 B | 1.622.818 B | +3.771 B |
| Originals amb bessona dins | 129 (120.481.503 B) | 2 (1.970.731 B) | −127 |

Els «169 MB → 48 MB» de l'encàrrec eren una estimació que barrejava unitats: 169 és el `du` en MB decimals de l'abans; l'ara fa 47,9 MiB (50,2 MB decimals). El criteri d'acceptació del pla (< 60 MB) es complix. La comprovació d'enllaços i el contingut real del paquet són a §9.

### 3. Scripts de botigues (tasca 4)

Desplegats `scripts/botigues/{entorn,preflight,puja-ios,puja-android}.mjs` i `tests/botigues.test.mjs` (10 proves), registrada a `tooling/tests/node-suite-manifest.json` (suite primària). Els fitxers del laboratori eren idèntics al commit `f23dcf2b`. En contrastar-los amb les eines d'avui han eixit tres defectes reals, ja corregits:

1. **altool 27.0.5 (Xcode 27.1) ja no té `--file` ni `--type`.** El pla del laboratori hauria parat amb l'eixida 6. Ara: `--validate-app <ipa>`, `--upload-app -f <ipa>`, autenticació amb `--api-key`/`--api-issuer` i la clau per ruta amb `--p8-file-path` [VERIFICAT contra `xcrun altool --help`; la primera pujada real continua sense provar].
2. **JDK.** Capacitor 8.5.3 compila Android amb Java 21, i el `java` del PATH d'aquesta màquina és el 17. `entorn.mjs` busca un JDK de 21 a 24 (JAVA_HOME, el JBR 21.0.8 d'Android Studio, `java_home -v 21`, que no es creu sense comprovar-lo perquè tornava el 17 amb èxit) i el passa només al procés de Gradle. El sostre 24 és el de Gradle 8.14.3.
3. **La màscara de secrets** no cobria les rutes amb `~` ni les relatives, ni l'ID dins d'`AuthKey_<ID>`: un revisor ho va reproduir i ara hi ha prova.
4. **SwiftPM i el clauer.** La validació d'iOS (§9) va veure la resolució de paquets penjada 10 min esperant el clauer de macOS. L'ordre d'arxivar porta ara `-packageAuthorizationProvider netrc`, que ja és a la llista d'opcions que el script comprova abans de res: les 14 són a l'`xcodebuild -help` d'Xcode 27.1 [VERIFICAT].

Proves en sec sobre l'arbre real: `preflight`, `puja-ios` i `puja-android` ixen amb **3** (no hi ha `.env.botigues.local`), que és el codi documentat. Cap execució amb `--compila` ni `--confirma`. Els rebuts només s'imprimixen (cap carpeta creada).

**Avís de govern:** `scripts/` i `package.json` són `SECURITY_PATH` (`tooling/gates/mutation-policy.mjs:6`); el commit necessita la via amb lease o la vostra decisió (§11).

### 4. Sentinella de seguretat (tasca 5, `core-seguretat-audit`)

**La CSP nativa complix l'ordre [VERIFICAT, `cspNativa`, `vite.natiu.config.js`].** `default-src 'self' data: blob:`, `script-src 'self'` (sense `unsafe-eval` ni `unsafe-inline`), `connect-src 'self' data: <Supabase> wss://<Supabase>`, `worker-src 'none'`, `object-src 'none'`, `base-uri 'self'`.

- «Només Supabase i localhost»: dins de l'app, `'self'` **és** localhost (`capacitor://localhost` a iOS, `https://localhost` a Android). Un `localhost` literal no hi ha d'anar: obriria els servidors de desenvolupament, i `VETATS_A_L_EIXIDA` ho prohibix a posta. L'única excepció és `data:`, que tres pujades necessiten per a fer `fetch(dataUrl)`.
- `worker-src 'none'` no trenca res: `src/` no crea cap Worker, i l'entrada nativa no registra el service worker.
- Cap `eval` ni `new Function` als bundles.
- Supabase respon al preflight amb `Access-Control-Allow-Origin: *` per als dos orígens de l'app (REST, Auth, Storage, Functions; Realtime accepta l'upgrade) [VERIFICAT per un agent amb curl, sense imprimir l'URL].

**Claus de servei: cap [VERIFICAT].** `magatzemLocal.js` és un embolcall d'IndexedDB amb llista blanca, sense xarxa i sense cap token; la configuració del poble és un UUID públic. Cap `service_role`, `sb_secret_` ni JWT que no siga `anon` a `src/` ni als bundles. El build natiu crida `validatePublicCredentials` i no hereta cap `VITE_*` de `.env` ni de `.env.local`.

**Correccions aplicades en este torn:**

| Fitxer | Què | Per què |
| --- | --- | --- |
| `src/components/universal/UniversalUtils.js` | `isSafeUrl` admet `capacitor:` només si la pàgina hi corre i l'adreça és del mateix host, sense credencials; es compara protocol i host, no l'origen | A iOS tot camí propi es resolia a `capacitor:` i es rebutjava: imatges i enllaços propis perduts. La web i Android no canvien |
| `src/utils/sanitize.js` | `esFontImatgeSegura` accepta el camí propi amb la mateixa regla que `esFontImatgePropia` | A iOS, Notes, Perfil i el sanejador perdien la imatge pròpia en desar (pèrdua de dades). A una pàgina `http(s)` ja passava |
| `src/config/runtimePolicy.js` | els ports de desenvolupament com a pares de `postMessage` només amb `http://localhost` | L'app nativa també viu a `localhost`, però no és cap entorn de desenvolupament |
| `BarraTaronja.test.jsx`, `UniversalCard.vinyeta.test.jsx` | proves que fixaven el comportament antic d'`isSafeUrl` | Sense això quedaven dues proves en roig |

Totes tenen prova; les mutacions de la regla fan fallar almenys una prova.

**Troballes obertes** (amb les correccions del contrast adversarial):

- **F1 · Refresh token en clar al `localStorage` del WebView [VERIFICAT].** L'entrada nativa usa `persistencia: 'local'` (`src/natiu/entrada.jsx:56-60`, `src/data/identitat.js:253`), i la plantilla Android de Capacitor 8.5.3 porta `allowBackup="true"`. El pla §4 ho prohibix. El contrast ho matisa: a Android 9+ la còpia al núvol va xifrada i el token rota, però a iOS el `localStorage` de WKWebView també entra a les còpies d'iCloud i del Finder. Proposta: just després de `cap add android`, `allowBackup="false"` i `dataExtractionRules` sense `app_webview`; de fons, un adaptador natiu mínim (Keychain/Keystore) darrere del port. Decisió vostra (§11).
- **F2 · Tornades d'autenticació en natiu.** `oauthRelay.js` i `auth.js` les construïxen des de `window.location`: a Android serien `https://localhost/...` i a iOS fallen. No s'ha d'afegir cap `localhost` ni esquema propi a les Redirect URLs de Supabase. Proposta: en natiu, amagar Google i els enllaços de correu fins que hi haja App Links i Universal Links sobre `https://socdepoble.org` (que alhora evita l'exigència de «Sign in with Apple», guia 4.8, que Gemini assenyala).
- **F3 · La `connect-src` estricta deixa sense servei** l'adaptador de la Viquipèdia, el reenquadrament d'avatars OAuth i la lectura EXIF per Range d'altres orígens. Google Calendar ja queda apagat per l'entorn natiu. Decisió per funció: amagar-la en natiu o afegir orígens concrets amb prova. Mai `https:` genèric.
- **F4 · Permisos.** La plantilla Android només porta `INTERNET` i cap funció actual necessita res més. A iOS els `<input type=file>` amb `image/*`, `video/*` i `audio/*` demanaran `NSCameraUsageDescription` i `NSMicrophoneUsageDescription` (o restringir `accept` en natiu). Cap `NSAllowsArbitraryLoads`.
- **F5 · CSP més fina (baixa).** `img-src https:` i `frame-src https:` són amples i falta `form-action 'self'`. Els iframes reals són OpenStreetMap i, al catàleg de Disseny, YouTube sense galetes: la llista concreta ha d'incloure'ls tots dos.
- **F6 · `server.errorPath`** per a WebViews antics (sense ell, `minWebViewVersion` no fa res visible).
- **F7 · Llista blanca de `VITE_*` en natiu** i un escàner de secrets després de `build:natiu`: hui una `VITE_*` nova declarada a `.env.natiu.local` entraria al binari sense filtre.
- **F8 · `/_capacitor_file_/` (baixa).** Són rutes del mateix origen que servixen fitxers del sandbox, i `isSafeUrl` les admet igual que ja les admetia a Android. No s'han vetat a `isSafeUrl` (hui cap codi en fa ús i ho trencaria per a una futura càmera); la proposta és vetar-les al sanejador de contingut d'usuari i al disparador del servidor.
- **Enllaços de compartir en natiu (mitjana).** `UniversalPage.jsx:195-196`, `useAccions.js:156`, `PerfilPublicSection.jsx:146` i `useSEO.js:56` compartirien `capacitor://localhost/...`: en natiu han de fer servir l'origen públic canònic.

**Troballes laterals greus, fora de la Fase C [VERIFICAT]:**

- `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql:22` fa `grant select (contact_email, public_email) on table public.organizations to anon, authenticated`: el correu de contacte de les organitzacions es pot llegir sense sessió, marque o no `public_email`. No és al `supabase/README.md`. No s'ha d'aplicar tal com està.
- El fitxer `02_investigacio_ia/Bóveda Comunidad — Revolutia IA.webloc` porta un paràmetre `mcp_token=` en clar i és a git des del commit `ed6077ff` (Gemini T6.1). No n'he imprimit el valor. Netejar el fitxer no l'esborra de l'historial: cal revocar el testimoni a Revolutia IA.

### 5. REA i bones pràctiques mòbils (tasca 6)

**Per a què s'ha fet servir REA:**
- Sobre el paquet autònom ja construït: el tros d'entrada fa 1.331.317 B crus, i el 30,2 % és el CSS incrustat com a cadena JS i el 17,6 % els diccionaris de les cinc llengües. El contrast ha precisat que eixe CSS entra per `src/PedraSecaEmbed.jsx:108` (`?inline`, per al Shadow DOM de `<soc-de-poble>`), no per l'entrada nativa.
- Una captura en temps d'execució de «/» a 390×844 sense backend: 59 scripts, 2.042.031 B crus.
- Sobre l'app de referència que la Wiki declara model, Obsidian.app: IndexedDB només com a memòria cau reconstruïble, cap SQLite, i18n per llengua, CSS en fitxer a part.
- Sobre l'app iOS compilada en este torn i, si arriba, l'APK: vegeu §9.

**Recomanacions, per valor i esforç** (fonts: capacitorjs.com, developer.apple.com, developer.android.com, webkit.org, web.dev):

1. **Cap codi descarregat dins de l'app (ADR curta).** Els plugins rurals viatgen dins del binari com a trossos locals amb `import()`; a la v1, actualitzacions només per botiga. És una lectura prudent: la guia 4.7 d'Apple sí que admet mini-apps HTML5 descarregades amb condicions, però el pont de Capacitor exposa API natives a tot el JS del WebView.
2. **Emmagatzematge en tres capes, sense SQLite a la v1.** Supabase és la veritat, IndexedDB el magatzem de treball, i un mirall durador amb `@capacitor/filesystem` (`Directory.LibraryNoCloud`) per a les dades locals crítiques: el M1 del laboratori. Eixe M1 només cobrix les apps que fan servir `creaMagatzemIdb` (Salut, Bar, Nevera, Lector); la facturació i l'autodesament necessiten una decisió a banda. SQLite-WASM a més no pot córrer amb la CSP actual (`script-src 'self'` sense `wasm-unsafe-eval`).
3. **Memòria: WebP redueix el disc, no la RAM.** A l'arrencada es descodifiquen imatges de 1024 i 1200 px per a pintar-les menudes. Variants de mida (256, 512, 1024) triades pel resolutor, i `loading="lazy"` i `decoding="async"` fora del primer plec.
4. **Fixar `IPHONEOS_DEPLOYMENT_TARGET` a 16.0** en fer `cap add ios` (Capacitor 8 baixa fins a iOS 15; la Baseline de Sóc de Poble és iOS 16).
5. `persist()` probablement no es concedix dins de WKWebView [NO VERIFICAT en dispositiu], i per això el mirall durador és la garantia real.

### 6. El pes del Core i els Plugins (tasca 7, la pregunta del Mestre)

> «¿Sóc de Poble se puede reducir más todavía? […] el core no llega a 10 ni mucho menos, ¿no?»

**Resposta curta: sí, però el que queda per guanyar és l'arrencada, no la descàrrega.** El Core no arriba ni de lluny a 10 MB. El nucli que arrenca ja pesa **menys de 300 KB comprimit en brotli** (285.264 B) i 363.860 B en gzip. Sense comprimir fa 1,34 MB, i dins del mòbil és el que compta: els fitxers són locals, i el que costa és analitzar el JS. Amb palanques segures baixa a uns 0,95 MB crus. Baixar de 0,5 MB crus demanaria canviar React o reescriure la closca.

Tot ho he mesurat amb un build natiu amb estadístiques per mòdul (2.798 mòduls, 293 trossos), 9 experiments en còpies i 24 parells de captures per a la Llei del Píxel [VERIFICAT].

**Les hipòtesis de la tasca 7, una per una:**

| Hipòtesi de l'encàrrec | Mesura real |
| --- | --- |
| Codi JS/CSS minificat ~3 MB | 4.962.177 B (Abans) i 4.984.541 B (Ara) |
| ~800 KB en gzip/brotli | 1.619.047 B gzip -9; 1.383.927 B brotli 11 |
| «Els 180 MB restants» eren multimèdia | El paquet feia 167.506.364 B: 96,1 % imatges (160.988.909 B), 1,49 MB de dades i cap vídeo ni àudio |

**Taula 1 · Paquet natiu sencer (bytes):**

| | Abans (sense política) | Ara (Fase C) | Futur (etapa 1 mesurada) |
| --- | ---: | ---: | ---: |
| Paquet total | 167.506.364 | 49.017.956 | 47.574.127 |
| Codi (cru / gzip / brotli) | 4.962.177 / 1.619.047 / 1.383.927 | 4.984.541 / 1.622.818 / 1.386.778 | 4.973.213 / 1.622.465 / 1.406.289 |
| Imatges | 160.988.909 | 42.478.137 | 42.478.137 |
| Pes del codi sobre el total | 2,96 % | 10,17 % | 10,45 % |

**Taula 2 · L'arrencada (el «Core»: el que s'executa abans del primer pintat):**

| | Ara | Etapa 1 (mesurada, píxel 24/24) | + Etapa 2 (estimada) | + Etapa 3 (cota) |
| --- | ---: | ---: | ---: | ---: |
| Total cru | 1.341.375 | 1.146.866 | 952.083 | 847.247 |
| Total gzip -9 | 363.860 | 312.769 | 287.751 | 251.562 |
| Total brotli 11 | 285.264 | 259.453 | 240.642 | 211.226 |

**De què està fet el nucli d'ara:** un sol tros d'entrada, sense imports estàtics. Supabase, Tiptap, ProseMirror i el manifest de la Wiki ja carreguen sota demanda.

| Peça | Bytes | Pes a l'arrencada |
| --- | ---: | ---: |
| CSS sencer com a cadena JS (`index.css?inline`) | 403.260 | 17,7 % |
| `i18n.js` amb les cinc llengües | 266.503 | |
| Llavors i dades de `src/data` | 250.980 | |
| `react-dom` | 134.830 | |
| DOMPurify | 129.029 | |

El CSS hi entra per dos camins, `src/natiu/entrada.jsx:22` i `src/PedraSecaEmbed.jsx:108`, i `host.js:178` registra `<soc-de-poble>` també al natiu.

**Pla per etapes, cada palanca amb el que lleva de veres:**

- **Etapa 0, feta:** la política de mitjans al natiu, −118.488.408 B (−70,7 %).
- **Etapa 1, barata, sense ADR, píxel idèntic comprovat:**
  - **L1 · Diccionaris per llengua.** El català, a l'arrencada; la resta, sota demanda. Arrencada −187.436 B crus (−25.789 brotli). Unes 40 línies.
  - **L2 · CSS com a full `.css`** en l'app i el web; WordPress i Sollutia conserven `?inline`. El JS per analitzar baixa de 1,34 a 0,94 MB, amb un net de bytes de ≈0. Contradiu la Lliçó 7 de la Wiki («només `index.css?inline`»): necessita la vostra decisió.
  - **L4 · `/xat` en mòbil sense la pàgina destacada.** La primera pantalla del mòbil baixa −222.741 B crus.
  - **L5 · Política segellada com a constant pròpia,** i no dins d'`import.meta.env`, que la duplica. −13.983 B.
  - **L10 · Fora del paquet natiu `rag-index.json` i `slugIndex.json`,** que l'app no llig: −1.432.575 B.
- **Etapa 2, ADR-2026-12 fase 2, amb captures de la Llei del Píxel:**
  - **L3 · CSS per secció:** −194.783 B crus a l'arrencada (estimat).
- **Etapa 3, ADR nova, risc alt:**
  - **L6 · Proveïdors sota demanda:** cota de −91 a −105 KB. Cal conservar la vida de l'estat i l'autodesament.
  - **L7 · Llavors fora de l'arrencada.**
- **No recomanades:**
  - **L8 · DOMPurify sota demanda:** −30 KB de risc de seguretat.
  - **L9 · Preact:** l'única via cap a «< 500 KB crus», però amb una dependència nova i un risc alt per a Tiptap i React 18.

**Plugins.** L'ADR-2026-12 ja els fa sota demanda (Bar, Salut, Nevera, Lector i Gestoria no entren al tros d'entrada). Però el carregador només admet el mateix origen, i dins de l'app eixe origen és el paquet mateix. Per tant, **els plugins alleugereixen l'arrencada i permeten activar mòduls; no reduïxen la descàrrega de la botiga.** Les palanques que reduïxen la descàrrega són de mitjans:
- L10;
- traure les targetes OpenGraph, 1,33 MB que l'app no fa servir;
- les dues correccions de §2, 1,97 MB;
- revisar quins `uploads/` han de viatjar, 25,5 MB.

**Gemini, bloc 5, contrastat:**
- Les mides dels trossos quadren.
- Els comprimits no: diu ~310 KB d'entrada i ~850 KB en total; la mesura és 362 KB i 1,63 MB.
- La palanca 1 (~580 KB) té una cota real de 91–105 KB; la 2 (~240 KB), de 80 KB.
- `INTERRUPTORS_MODULS` i `FILTRES_PLATAFORMA` no existixen a l'arbre.
- `marketContent` fa 1.560 B, no 64 KB.

### 7. Higiene de l'Escriptori: Sublimació de Torn i Taula Neta (tasca 8)

**Per què la porta Olivera dona 0 amb documents consumits del mateix dia [VERIFICAT]:**

1. `ranci()` només marca documents de jornades anteriors (`tooling/gates/porta-olivera.mjs:218-221`).
2. `document.mjs create` declara viu a «Activitat en curs» cada document que naix (`tooling/documental/draft-write.mjs:73-84`).
3. El rebut del torn sosté el document 24 h (`porta-olivera.mjs:576-582`, `tooling/documental/turns.mjs:79`).
4. En fase «avis» les troballes de la convocatòria v4 són avisos (`porta-olivera.mjs:740`).

La porta jutja per jornada; no té cap concepte de fase.

**Tractor cognitiu proposat (dos pegats).** Claude no escriu `.agents/` ni mou documents de l'Escriptori: els aplica MarIA o el Mestre. Han passat tres rondes: un escèptic va trobar defectes reals al primer pegat; una correcció els va resoldre; un verificador adversarial hi va trobar encara una regressió, que he corregit jo i he tornat a verificar.

- `PEGAT_FASE_C_PORTA_OLIVERA_TAULA_NETA.patch` (sha256 `06d5eebb…`). Afig a `porta-olivera.mjs` dos modes de només lectura.
  - `--taula-neta`: la taula de la fase en curs. La fase és el segell `aammdd_hhmm` del Pla més recent i dura fins al Pla següent. Hi pertanyen:
    - **la trinitat:** el Pla, els prompts i els bundles amb el segell de la fase;
    - **les rèpliques:** qualsevol document nascut amb un segell igual o posterior al del Pla. Hi pertanyen per construcció, i així un informe en curs no s'arxiva per error;
    - **els adoptats:** un document anterior només hi entra si la seua secció «## Vincles» cita el Pla, un prompt o un bundle de la trinitat. Una menció al cos o un comentari no adopten ningú, i cap rebut tampoc: el pla d'un torn es pot tornar a vincular a un pla més nou, i faria passar el pla vell i els seus informes (la regressió que va trobar el verificador). El rebut, validat contra el registre del torn, només serveix per a avisar si el torn encara és obert.
  - `--taula-neta --convoca`: la regla del Mestre per a convocar, «només els 3 documents vius de la fase en curs (Pla + Prompts)». Només admet la trinitat.
  - Per a cada document de fora, totes dues imprimixen l'ordre exacta `--arxiva --nom … --sessio …` i l'avís d'Acte Reflex si el seu torn encara és obert.
  - Afig les dues ordres a la llista de lectures de `mutation-policy.mjs`, perquè Claude i Codex les puguen passar.
  - Verificació:
    - 14 proves noves, i 12 fallen amb el codi del primer pegat;
    - les 54 fixtures del verificador adversarial passen totes menys una, la que esperava l'adopció per rebut, ara llevada a posta;
    - en els 36 fitxers de proves relacionats, les fallades són les mateixes que a la base (artefactes de la còpia, cap regressió);
    - ESLint net;
    - aplicats sobre una còpia neta, els pegats reproduïxen byte a byte la còpia de treball;
    - sobre la taula d'ara, `--taula-neta` ix amb 0 amb els 5 documents, i `--convoca` ix amb 1 i assenyala els dos informes, perquè són rèpliques i no trinitat.
- `PEGAT_FASE_C_SKILL_CORE_HIGIENE_ESCRIPTORI.patch` (sha256 `31616f55…`). La skill passa a la v5.0.0 amb:
  - la **Definició de Taula Neta per a agents nous**, que descriu exactament el que fa el codi i complementa la definició única d'AGENTS §0.1;
  - el **Protocol de Sublimació de Torn:** llegir sencera la fase prèvia, portar-ne les conclusions al Pla nou amb la font, arxivar el consumit amb `--arxiva --nom` i verificar amb `--taula-neta --convoca` abans de convocar;
  - el **Canal viu dins de la fase:** un sol document per agent, reescrit a cada relleu;
  - una secció **Entrada en vigor**.

**Abans d'aplicar-los, tres condicions:**
1. Decidir la frase d'AGENTS §0.1. La proposta és afegir, al final de la definició: «Abans de convocar agents nous, la taula és a més neta de fase: `node tooling/gates/porta-olivera.mjs --taula-neta --convoca` ix amb 0».
2. El document d'aprovació a la Wiki que exigix la lliçó 261002. No l'he creat: esta secció en pot ser la base. Fins llavors, la skill deixa els modes nous com a lectura.
3. Resegellar en aplicar la skill: `segella.mjs` ix amb 1 amb la skill nova, com cal esperar.

`git apply --check` passa sobre l'arbre d'ara. Ordre d'aplicació des de l'arrel:

```bash
git apply _wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/PEGAT_FASE_C_PORTA_OLIVERA_TAULA_NETA.patch
node --test tests/porta-olivera-taula-neta.test.mjs
git apply _wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/PEGAT_FASE_C_SKILL_CORE_HIGIENE_ESCRIPTORI.patch
npm run skills:index
npm run porta:segella:update
```

Després, la línia de LEDGER `261019 | correcció | core-higiene-escriptori | sublimació de torn i taula neta de fase abans de convocar`.

**Troballa lateral:** en el mode normal de la porta, `estatTorn()` i `vidaDe()` accepten qualsevol `reflex: sdp:torn_X:Y` d'un torn obert, sense comprovar que el rebut Y existisca ni que nomene el document. Un rebut inventat fa que un document consumit quede «🌿 viu». El mode nou ja valida; per al normal cal un pegat a part.

Altres observacions:
- La secció «Activitat en curs» de l'índex porta 19 àncores fora de la taula (10 cap a `90_arxiu_historic/`), que conviden a llegir l'arxiu.
- Ningú no fa servir `document.mjs plan`: els quatre torns de la Fase C tenen `plan: null`.
- Este informe naixia sense Vincles al Pla ni al prompt, i per això `--taula-neta` el marcava fora de fase. Esta versió ja els porta.

### 8. Cerca, perfil públic, targetes i fitxes úniques (tasca 9)

**Cercador elevat.** El formulari de cerca va ara pel buit `accioPrincipal` que `PageFrame` ja pinta just davall de l'H1, sense tocar cap CSS ni cap marc compartit. Mesurat a 375×812: el camp passa de 560-615 px a 406-461 px, per damunt de la barra inferior (742 px), i ja no cal fer scroll. Ho he comprovat també al navegador. El logotip del títol es queda (Llei del Píxel). Contrapartida: dins de la targeta del títol, a 375 px el camp fa 279 px d'ample en lloc de 343, i el text d'exemple es talla.

**Enllaços de persones.** Cap resultat de la cerca porta a `/el-meu-perfil`:
- Les tres identitats fundacionals porten a la seua adreça neta: `/javillinares`, `/socdepoble`, `/rentonar`.
- La resta, a `/gent/:id` o `/empresa/:id`.
- La persona pròpia només porta enllaç en remot quan la sessió té la capacitat `directori`, perquè sense ella `/gent/<id>` diria «Perfil no trobat».

També estava trencada la fusió `fusionaPerClau`, que sobreescrivia l'adreça pública del padró amb la de l'editor (Gemini T7.2): s'arregla en l'origen.

**Llistat o targetes.** Hi ha un selector «Llista / Targetes» als resultats de Persones, Entitats, Pobles i Mercat, amb el patró de la casa `?vista=graella` (`apps/comu/esquelet/vistes.js`). La llista continua sent la vista per defecte. Les targetes són `UniversalCard` dins de `GraellaTargetes`, amb les mateixes dades i el mateix enllaç que la fila; «Tot» continua en llista. Comprovat al navegador amb el Mercat.

**Fitxes úniques.** A l'índex de cerca, una sola entrada per identitat canònica, amb proves que reproduïxen el duplicat. Al graf de dades, en llavor i en local cada fundacional té una sola fitxa. En remot no: la persona pilot té la fitxa del paquet (`0001`, `/javillinares`) i la fila del servidor (`/gent/<uuid>`), perquè `IDS_REMOTS_FUNDACIONALS` és buit (`src/data/identitatsSeed.js:234-238`, decisió D-UUID-REMOT pendent). Hi ha a més 8 persones inventades al catàleg d'agents. És decisió vostra (§11).

**«Veure fitxa pública».** Botó a `/el-meu-perfil`:
- On: a `PerfilShell`, a la fila 1 de la columna dreta de cada apartat d'una persona, organització o agent. A `PerfilEditor` no, perquè les seues proves es pinten sense router.
- Com: un `Link` del router amb la ruta canònica (`rutaCanonicaDePerfil`, si no `rutaDeFitxaPublica`), icona `Eye` i el text via `t('section.perfil.fitxaPublica', 'Veure fitxa pública')`.
- Fitxa privada: el botó es mostra inert i, en tocar-lo, un avís explica el motiu.
- Mesura: la franja fa 58 px amb el to de les capçaleres PERFIL i APARTATS (comprovat a 1400, 1024, 375 i 320 px).
- **Llei del Píxel:** la franja nova baixa la barra blava de cada apartat a la fila 2. És conseqüència directa de l'ordre, però canvia l'aparença de sis apartats: necessita el vostre vistiplau visual.

**i18n.** He afegit les claus noves (`section.search.vista`, `vistaLlista`, `vistaTargetes` i `section.perfil.fitxaPublica`) a les cinc llengües de `src/config/i18n.js`.

### 9. Validació de la closca (en còpies fora del repo)

**Build natiu complet [VERIFICAT].** `npm run build:natiu`, el script real, ix amb 0 en uns 6 s (Vite 7.3.6, 2.798 mòduls). Els fitxers generats (`rag-index.json`, `slugIndex.json`, `design-tokens.css`) són idèntics als de l'arbre.

- **Mida:** `dist-natiu/` fa 49.017.956 B en 532 fitxers.
- **Política:** cap dels 127 originals substituïts hi viatja, i les 127 bessones hi són, idèntiques a les de `public/`.
- **Enllaços:** la comprovació d'enllaços a mitjans troba 352 cites de 197 camins, també els camins construïts amb plantilla del cens i de `LEGACY_MEDIA`, i **cap imatge local trencada**.
- **`index.html`:** una sola meta CSP, igual a `cspNativa`, cap `localhost`, cap `sw.js`, manifest ni `auth/`.
- **Secrets:** 0 en 317 fitxers. Els objectes `import.meta.env` segellats només porten `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, la política i les claus de Vite.
- **Proves:** amb `dist-natiu/` present, `tests/natiu-build.test.mjs` fa 20 de 20 (1 omesa: el paquet de WordPress no era a la còpia).
- **Mode de dades:** dins de l'app no es pot fer anar el mode llavor. `src/natiu/entrada.jsx` fixa `dataMode: 'remote'` i una prova ho exigix; sense backend, Pobles i Mercat ixen buits.

**Android [VERIFICAT].**
- **Projecte:** `cap add android` i `cap sync android` acaben bé. minSdk 24, compileSdk 36, targetSdk 36, Gradle 8.14.3, AGP 8.13.0, Java 21.
- **Compilació:** `./gradlew assembleDebug` amb el JBR 21.0.8 d'Android Studio acaba bé en 2 min 5 s. Ha baixat 74 artefactes de Google Maven i Maven Central (+130 MB a la memòria cau de Gradle).
- **APK:** 48.471.642 B; dins, `assets/public` porta els 49.017.956 B de `dist-natiu/`.
- **Manifest fusionat:** només `INTERNET` (més el permís de signatura intern d'AndroidX). Sense `usesCleartextTraffic` (amb targetSdk 36 el text en clar ja està prohibit) i amb `allowBackup="true"` de la plantilla. Amb `allowBackup="false"` també compila (F1).
- **El FileProvider** de la plantilla comparteix `external-path "."` i `cache-path "."` sense que cap plugin el faça servir: cal reduir-lo.
- **Execució: bloquejada.** La imatge de sistema de l'AVD `Medium_Phone_API_36.1` està incompleta (35 MB, sense `system.img`) i l'emulador ix amb «No initial system image». Caldria baixar `arm64-v8a-36.1_r04.zip` (1.958.370.801 B) des d'Android Studio > SDK Manager: no ho he fet sense el vostre permís. Tampoc hi ha cap mòbil connectat. Per tant **no hi ha proves de fum en temps d'execució**: ni captures, ni comptatge d'imatges per ruta, ni consola, ni violacions de CSP.
- **Telemetria:** la CLI de Capacitor té `telemetry: true` en esta màquina (`~/Library/Preferences/capacitor/sysconfig.json`). Les ordres d'este torn han anat sense terminal i amb `CI=1`, i no han enviat res. Si no voleu enviar res a Ionic: `npx cap telemetry off`.
- **Lliçó de procediment:** una còpia que enllaça `node_modules/@capacitor` al repo fa que Gradle escriga `build/` dins del `node_modules` viu. L'agent ho ha evitat copiant `@capacitor` de veres. El repo viu està intacte.

**iOS [VERIFICAT].**
- **Projecte:** `cap add ios` genera un projecte Swift Package Manager (sense CocoaPods) amb una sola dependència, `capacitor-swift-pm` 8.5.3 exacta. `cap doctor` diu «iOS looking great».
- **Valors de la plantilla:**
  - `IPHONEOS_DEPLOYMENT_TARGET = 15.0`, per davall de la Baseline iOS 16;
  - `UIRequiredDeviceCapabilities = armv7`;
  - la icona i el splash de Capacitor;
  - `CFBundleDevelopmentRegion = en`;
  - cap `NS*UsageDescription` i ATS complet.
- **Compilació:** `xcodebuild … -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build` acaba amb **BUILD SUCCEEDED** en 7,7 s, sense cap avís de compilador. `App.app` fa 54.288.204 B, dels quals `public/` és el 90,3 %.
- **REA:** `inspect_plist` i `inspect_macho` confirmen l'Info.plist i l'enllaçat: Capacitor i Cordova, arm64 i x86_64, mínim 15.0, SDK 27.1.
- **Clauer:** el primer intent de resoldre els paquets es va quedar 10 min esperant el clauer de macOS (una credencial de `github.com`). Amb `-packageAuthorizationProvider netrc` es resol en 18 s, anònim. **He afegit eixa opció a `scripts/botigues/puja-ios.mjs`** (amb prova), perquè el script de la botiga no es penge. Si entre les 23:08 i les 23:19 us va eixir un diàleg del clauer per a `github.com`, venia d'açò.
- **Execució al simulador.** A la màquina hi ha un runtime iOS 27.1 (7,3 GB) que a les 21:55 no hi era. Cap agent d'esta sessió no ha executat `xcodebuild -downloadPlatform` (comprovat als registres). La meua primera ordre `xcrun simctl` de les 21:47 va imprimir «Install Started… Install Succeeded», i la imatge es va completar a les 22:22. És possible que aquella consulta engegara una baixada automàtica d'Xcode [NO VERIFICAT]. Amb eixe runtime, l'agent ha executat l'app real:
  - pinta el Xat a `capacitor://localhost`, amb l'avís esperat «CoreContent degradat» per falta de backend real;
  - una sonda dins de WKWebView confirma que `location.origin` val `capacitor://localhost` (no `null`), i que `delMateixOrigen` de `carregaModul.js` funciona;
  - les rutes sense extensió tornen `index.html`, i SRI i `type=module` funcionen amb la CSP real.
- **Dues coses per a recordar:**
  - una ruta amb un punt a l'últim tram (`/perfil/joan.garcia`) falla a iOS i a Android: les rutes de l'app no han de portar punts;
  - a la captura, la píndola de la barra d'estat tapa la icona dreta de la capçalera, cosa que caldrà mirar amb `contentInset: never` i les zones segures en un iPhone real [NO VERIFICAT en dispositiu].
- **Pendent abans de botiga:** posar `NSCameraUsageDescription` (hi ha 5 `<input type=file accept=image/*>`) i corregir els valors de plantilla de dalt. Només hi ha captures de la pantalla del Xat: no s'ha fet cap cens d'imatges per ruta en execució.

### 10. Consens tècnic amb l'informe de Gemini

He llegit sencer [[261019_2145_auditoria_gemini_botigues_i_alletjament_core]] i he contrastat cada afirmació que toca el codi.

**Coincidim, i ja està fet:**
- un sol binari multipoble, contra la guia 4.3;
- la política de mitjans no estava connectada al build natiu (T2.1);
- `isSafeUrl` rebutjava tots els camins propis a iOS (T3.1);
- l'enllaç de la persona a `/el-meu-perfil` i la fusió que el propagava (T7.2);
- el cercador sota l'H1 (T7.1), el botó de fitxa pública (T7.3) i la vista de targetes (T7.4).

**Corregit amb evidència:**
- T3.1 cita una implementació d'`isSafeUrl` que no és la del repo. L'`esAvatarSegur` que diu que falla a `fitxaDePerfil.js:46` no existix allí: viu a `UniversalUtils.js:147`, crida `isSafeAsset` i ja queda cobert.
- T3.2 (`runtimePolicy.js`, severitat alta): l'heurística només afig els ports locals als pares admesos de `postMessage`, i la CSP nativa ja bloqueja marcs `http:`. És baixa. L'he corregida igualment, amb prova.
- T5.1 mesura un `dist/` web antic (entrada de 1.300 KB). Les xifres del build natiu d'ara són a §6.
- T2.1 dona 48 MB; la mesura real és 49,0 MB. T5.3 promet «menys de 8 MB» amb una CDN: és una estimació sense mesura.
- T5.3, palanca 1: diu que els Providers d'`App.jsx` arrosseguen les llavors. El contrast per mòdul és a §6.
- La taula comparativa amb Nextdoor, Telegram i BandoMovil (bloc 4) no porta evidència REA; la comparació real amb Obsidian.app és a §5.
- «0 % risc d'evicció» amb el M1: el M1 encara no existix.
- T1.1 parlava de dependències `^8.5.0`: s'han fixat exactes a 8.5.3.

**Confirmat i elevat:** el `mcp_token` del `.webloc` (T6.1) és a més a l'historial de git (§4).

**D'acord, però fora del codi d'esta fase:** moderació de contingut d'usuari amb «Denuncia» i «Bloqueja» (Apple 1.2), «Sign in with Apple» si s'oferix Google a iOS (4.8) i l'URL web d'esborrat de compte per a Google Play. Van a §11.

### 11. Decisions que són vostres

**Urgents, fora de la Fase C:**
1. Revocar el `mcp_token` de Revolutia IA que és a l'historial de git (`.webloc` del laboratori).
2. No aplicar `supabase/migrations/2610181915_…` tal com està: obri `contact_email` a `anon`. També fa fallar `tests/migracio-membres-organitzacio.test.mjs`.

**Per a tancar la Fase C:**

3. **Via del commit.** `package.json`, el lock, `scripts/botigues/` i `tooling/` són camins de govern. Es pot fer amb l'executor amb lease, o bé l'autoritzeu vosaltres al xat. El hook de pre-commit no passarà: a l'arbre hi ha una prova roja que és d'un altre agent (`indexConsola.test.js`, per `mercat_nano_card.jpg` esborrat), i `design_guard` i `pedra-seca` ja fallaven a l'HEAD.
4. Acceptar la versió **8.5.3 exacta** en lloc de `^8.5.0`.
5. **Llei del Píxel:**
   - el camp de cerca dins de la targeta del títol (279 px a 375, abans 343);
   - la franja nova de 58 px als sis apartats del Perfil;
   - retirar o connectar l'acció pendent «Fitxa pública» de `PerfilContext.jsx:282`.
6. **CSP nativa:**
   - acceptar que prohibix tot `localhost` de desenvolupament (dins de l'app, `'self'` ja és localhost);
   - decidir, funció per funció, Viquipèdia, EXIF i reenquadrament d'avatars;
   - `server.errorPath`;
   - llista blanca de `VITE_*`.
7. **Sessió en natiu (F1):**
   - `persistencia: 'pestanya'` o un magatzem natiu (Keychain/Keystore);
   - `allowBackup="false"` en fer `cap add android`.
8. **Autenticació en natiu (F2):** amagar Google i els enllaços de correu fins que hi haja App Links i Universal Links. Té relació amb Sign in with Apple.
9. **`cap add android` i `cap add ios` al repo.** Qui els fa i amb quin equip de signatura, amb:
   - `IPHONEOS_DEPLOYMENT_TARGET = 16.0`;
   - `NSCameraUsageDescription` en valencià;
   - arm64;
   - icones pròpies;
   - un FileProvider reduït.
10. Si es baixa la imatge de sistema Android 36.1 (1,96 GB) o es connecta un mòbil per a les proves de fum. Si el runtime iOS 27.1 (7,3 GB) es queda.
11. **Pes, etapa 1:**
    - L1, L4, L5 i L10, sense ADR;
    - L2, contra la Lliçó 7;
    - les dues correccions que trauen els 2 originals del paquet;
    - traure les targetes OpenGraph del natiu.
12. **Higiene:** aplicar els dos pegats (§7) i decidir la frase d'AGENTS §0.1 («definició única»). Abans, segons la lliçó 261002, cal el document d'aprovació a la Wiki.
13. **D-UUID-REMOT:**
    - declarar els UUID de producció a `IDS_REMOTS_FUNDACIONALS`;
    - què es fa amb les 8 persones inventades del catàleg;
    - quina és la ruta canònica de l'entitat pilot (`/socdepoble` o `/empresa/socdepoble`).
14. **Bloquejadors de botiga que cap tasca no cobrix:**
    - moderació de contingut d'usuari amb «Denuncia» i «Bloqueja» (Apple 1.2);
    - Sign in with Apple si s'oferix Google (4.8);
    - URL web d'esborrat de compte (Google Play);
    - funcions natives contra la guia 4.2 (mirall durador M1, notificacions).
15. `npx cap telemetry off`, si no voleu enviar mètriques a Ionic.
16. **Evacuació del laboratori `261003_1330`.** Si s'evacua ara, `tests/botigues.test.mjs` es posa en roig, perquè `entorn.mjs` en cita la plantilla d'entorn i la carpeta de rebuts: cal moure'ls junts.

### 12. Retroalimentació de la plantilla `prompt_local`

- El Preflight marca `[x]` coses que eren estimacions: «169 → 48 MB» i «porta-olivera torna 0 = net». Un `[x]` hauria de portar l'ordre i l'eixida que el proven, o anar com a hipòtesi.
- La ruta d'importació de `politicaDeMitjans` era inexacta. Les rutes de fitxer d'un encàrrec s'haurien de comprovar amb `ls` o `grep` en redactar-lo.
- «Informe de progrés cada 10-15 minuts» xoca amb la Taula Neta: cada relleu és un document nou. Millor un sol document per agent i fase, reescrit a cada relleu, amb Vincles al Pla i al prompt des del naixement. Els textos de reemplaçament de les línies 27, 28, 31 i 123-125 de la plantilla són al pegat de la skill (§7).
- «connect-src només a Supabase i localhost» és ambigu: en natiu, `localhost` és `'self'`. Convé escriure la regla en termes d'origen de l'app.
- La plantilla d'auditoria (`auditoria_canonica.md`) hauria de portar de sèrie els Vincles al Pla i al prompt que respon.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres s'han executat a `socdepoble.org` o en còpies fora del repo. Els builds no s'han fet mai dins del repo: no hi ha `dist-natiu/`, `android/` ni `ios/` a l'arbre.

| Comprovació | Ordre | Resultat |
| --- | --- | --- |
| Versions al registre | `npm view @capacitor/core dist-tags`; `npm view @capacitor/{android,ios,cli}@8.5.3 …` | `latest 8.5.3`; peers i Node casen |
| Config de Capacitor | `node -e` del pla §Verificació | `appId org.socdepoble.app`, `webDir dist-natiu`; paràmetres crítics OK |
| Lock contra HEAD | diff de `packages` | 85 noves, 0 esborrades, 0 versions canviades, 16 amb metadades |
| ESLint, fitxers de la sessió | `npx eslint <35 fitxers> --max-warnings=0` | 0 errors, 0 avisos |
| Proves Node de la Fase C | `node --test tests/natiu-build.test.mjs tests/botigues.test.mjs tests/standalone-build.test.mjs …` | 107 en verd, 0 fallades, 2 omeses (sense `dist-natiu/` al repo) |
| Suite Node primària | `node tooling/tests/run-node-tests.mjs` | 1.007 proves: 999 en verd, 2 fallades anteriors i alienes (`backend_consolidacio`: `CODI_SEGON_FACTOR`; `migracio-membres-organitzacio`: la migració 2610181915), 2 omeses |
| Vitest complet | `npx vitest run --maxWorkers=4` | 19.843 proves: 19.753 en verd, 1 fallada d'un altre agent (`indexConsola.test.js`, `mercat_nano_card.jpg` esborrat a les 21:02), 89 omeses |
| Vitest dels fitxers de la sessió | 21 fitxers | 335/335 |
| Porta d'arrel | `npm run porta:arrel` | 0 (A1-A5 en verd) |
| Porta Olivera | `node tooling/gates/porta-olivera.mjs` | 0, amb 3 avisos CONV-07 de sediment de l'índex |
| Pedra Seca | `npm run porta:pedra-seca` | 1, idèntic a l'HEAD; LLEI_07 (paritat i18n) 0 de 0 |
| Design Guard | `node tooling/gates/design_guard.mjs --arrel=src` | 1, idèntic a l'HEAD; cap troballa en fitxers de la sessió |
| Build natiu real | `npm run build:natiu` (còpia, backend sintètic) | exit 0; 49.017.956 B; 0 imatges trencades; 0 secrets |
| Proves amb l'eixida real | `node --test tests/natiu-build.test.mjs` (còpia amb `dist-natiu/`) | 20 en verd, 1 omesa |
| Android | `cap add/sync android`; `./gradlew assembleDebug` (JBR 21) | APK de 48.471.642 B; emulador sense imatge de sistema |
| iOS | `cap add/sync ios`; `cap doctor`; `xcodebuild … iphonesimulator build` | BUILD SUCCEEDED; l'app arranca al simulador iOS 27.1 |
| Visual | navegador integrat, `/cerca` a 375×812 abans i després; selector de targetes | camp de cerca de 587 px a 433 px; vista `?vista=graella` correcta |

**Com s'ha treballat.** Quatre workflows amb 35 subagents:
- implementació de cinc fronts, cadascun amb dos revisors adversarials i una ronda de correcció;
- quatre anàlisis de només lectura, cadascuna amb un escèptic;
- validació (build, Android, iOS, pes del Core, verificació consolidada i un crític de completesa);
- una correcció verificada dels pegats d'higiene.

Cap troballa d'este informe no ve d'un sol agent sense contrast.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap commit.** Els canvis són a l'arbre de treball, junt amb els d'altres agents. `package.json`, el lock, `scripts/botigues/` i `tooling/` són camins de govern: el commit necessita la vostra decisió (§11.3).
- **Proves en execució incompletes:**
  - a Android no s'ha pogut arrencar l'emulador;
  - a iOS només s'ha vist la pantalla del Xat, sense backend real i sense cens d'imatges per ruta;
  - no s'ha provat res en cap dispositiu físic;
  - `isSafeUrl` no s'ha cridat dins de WKWebView: la sonda en va comprovar l'origen;
  - dins de l'app no es pot fer anar el mode llavor, i Pobles i Mercat necessiten el backend.
- **Botigues:** cap `--compila`, cap `--confirma`, cap pujada. La sintaxi d'altool i de `--p8-file-path` s'ha comprovat només contra l'ajuda de l'eina. El sostre `JDK_MAXIM = 24` ve de la matriu publicada de Gradle.
- **Pes del Core:** L3, L6 i L7 són estimacions o cotes; L1 i L2 no s'han provat dins de WordPress ni de Sollutia.
- **Govern documental.** Claude no escriu `.agents/` (ESTAT, LEDGER, skills) ni mou documents de l'Escriptori: els pegats de la porta i de la skill, la línia de LEDGER i el tancament amb `tancament.mjs` els ha de fer MarIA o el Mestre.
- **Canal viu:** hi ha hagut un sol relleu (21:58) i este informe és el mateix document reescrit, no un relleu cada 10-15 minuts. És la resolució que proposa §7.
- **«Cadascuna a sa casa»:** cap cron creat. El servidor `adb` que vaig engegar en mirar els dispositius ja està tancat; no queda cap emulador, Gradle, simulador ni procés de validació. Queda la memòria cau de SwiftPM (9,1 MB) i de Gradle. El servidor de desenvolupament del port 3340 no és meu i no l'he tocat.
- He llegit sencers el pla, els dos prompts de la fase i l'informe de Gemini; no he llegit res de `90_arxiu_historic/`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261019_2115_pla_implementacio_capacitor_mobil]]
- [[261019_2115_prompt_claude_capacitor_mobil]]
- [[261019_2115_prompt_gemini_auditoria_botigues_mobil]]
- [[261019_2145_auditoria_gemini_botigues_i_alletjament_core]]
