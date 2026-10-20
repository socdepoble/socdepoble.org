---
type: informe
status: esborrany
description: 'Informe de Claude de la Fase D: Apple i Google natius, moderacio UGC, URL d''esborrat, projecte iOS i alletjament etapa 1, amb proves i decisions.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ae1a7ff6-2572-431c-a352-e3ed470f30ef:fc2a1110-07ce-4760-b261-575f42a08e5f
---
# Fase D Claude: auth mobil, moderacio UGC i alletjament etapa 1

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ae1a7ff6-2572-431c-a352-e3ed470f30ef:fc2a1110-07ce-4760-b261-575f42a08e5f |
| Versió del document | 1.0.0 (informe final del torn) |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T13:17:01.072Z |
| Modificació | 2026-10-20T17:25:00.000Z |
| Propietari | claude |
| Aprovació humana | Mestre Javi Llinares: quatre decisions al xat (261020 15:15) i l'encàrrec de prioritat 0 de la barra negra (261020 15:35) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, app d'escriptori), amb fluxos de subagents |
| Tokens consumits | Uns 12,1 M en 48 subagents: mapa 2,4 M, disseny 3,4 M, implementació 2,3 M, revisió adversa 3,3 M i esmenes 0,7 M. A part, el fil principal. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-20T13:17:01.072Z: esborrany creat sota el torn `torn_ae1a7ff6-2572-431c-a352-e3ed470f30ef` (actor claude, abast code), vinculat al pla `261020_1300_pla_implementacio_botigues_i_auth_mobil.md`.
- 2026-10-20T13:20:00.000Z: relleu de progrés 1. Mapa del codi fet amb 8 lectors, quatre decisions del Mestre al xat, disseny contrastat en marxa.
- 2026-10-20T14:05:00.000Z: relleu de progrés 2. Connector instal·lat, `ios/` creat i prioritat 0 de la barra negra verificada al simulador.
- 2026-10-20T17:25:00.000Z: informe final. Les cinc àrees estan implementades: auth, moderació, la resta (L10, L4, URL d'esborrat i iOS) i L1. Hi ha passat una revisió adversa amb 24 agents, se n'han aplicat les esmenes i s'ha verificat al simulador, al navegador, amb Vitest, amb la suite Node i amb les portes.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

- **Fet i verificat.**
  - **Barra negra (prioritat 0).** Queda davall de la Dynamic Island, també al calaix lateral, i ja no s'amaga en mode immersiu.
  - **Sign in with Apple** a l'iPhone 17. Sense signar, falla amb un avís sobri i no peta.
  - **Google natiu.** Està preparat i provat amb un client fictici: obri el full de Google, i en cancel·lar no mostra cap avís.
  - **Moderació.** Els menús «Denuncia / Bloqueja» van a les targetes, al detall, als perfils i als missatges del xat. Hi ha el diàleg de denúncia, el bloqueig instantani i les normes de convivència abans de publicar.
  - **Migració** de `public.denuncies` i `public.bloquejos`, amb els `GRANT` del mandat.
  - **iOS:** `Info.plist`, permisos, privacitat i nom de l'app.
  - **Ancoratge** `/legal#esborra-compte`.
  - **L1:** −215,7 KB crus a l'arrencada.
  - **L10:** −1,43 MB al paquet natiu.
  - **L4:** el xat a la pantalla estreta ja no munta la pàgina destacada.
- **Proves.**
  - **Vitest complet:** 20.178 en verd i 0 fallades.
  - **Suite Node:** 1.010 de 1.018 en verd. Les 2 fallades són anteriors i alienes.
  - **Portes:** els codis d'eixida són idèntics als de la base. Només hi ha dues identitats noves: LLEI_08, que es resol amb un pegat de `tooling/` que no tinc autoritzat (§9).
- **Cap commit.** Tot és a l'arbre de treball compartit, sobre l'HEAD `6d50d01d`.
- **El que és vostre** és a §10. Les quatre peces més urgents per a enviar a botiga:
  1. els client ID reals de Google i la configuració de Supabase;
  2. l'equip de signatura i la capacitat de Sign in with Apple;
  3. la revocació del testimoni d'Apple quan s'esborra el compte;
  4. aplicar la migració.

### 1. Decisions del Mestre al xat (261020 15:15)

1. **Connector natiu:** `@capgo/capacitor-social-login` a la versió exacta 8.5.12, de fa 20 dies. A iOS, Google va amb `forcePrompt` perquè el nonce no es perda.
2. **Via de govern:** escriptura directa autoritzada, només per a esta tanda, de `package.json`, `package-lock.json` i les dues portes de `tooling/` que llegeixen els diccionaris. Motiu: l'executor està bloquejat perquè el segell de skills està trencat per l'edició de la Llei E.
3. **`npx cap add ios`** a l'arbre viu.
4. **Sign in with Apple només a iOS.** Android porta Google natiu i correu.

**Per què es canvia el connector.** Els dos que nomenava el prompt no funcionen amb Capacitor 8.5.3:
- `@codetrix-studio/capacitor-google-auth` accepta `@capacitor/core ^6` i no porta `Package.swift`. El seu README el dona per arxivat.
- `@capacitor-community/apple-sign-in` és de Capacitor 7 i només fa Apple.

### 2. Prioritat 0: barra negra i safe-area a iOS (encàrrec del Mestre de 15:35) [FET I VERIFICAT]

- **Barra negra (`src/css/layout.css`, `header.bar-black`).**
  - Porta `box-sizing: border-box`, `padding-top: env(safe-area-inset-top, 0px)` i alçada i alçada mínima `calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))`.
  - Les tres regles que la tornaven a `padding: 0 …` (compacte, i les dues de ≤480px) ara conserven el coixí de dalt.
  - Ha eixit de la regla del mode immersiu: ja no s'amaga mai.
- **Calaix lateral (`.brand`).** Tenia el mateix defecte i porta la mateixa regla, amb `!important` com el `padding-left` de la mateixa regla, perquè `.sdp-unstyled-btn` el posava a zero.
- **Indicador de «lliscar per recarregar».** Naix davall de la barra.
- **Fora de l'app nativa, res no canvia:** `env()` hi val 0.
- **Prova esmenada.** `ModeImmersiuContext.test.jsx` prohibix ara que el mode immersiu torne a nomenar la barra negra.
- **Fora d'esta tanda.** Una altra mà ha canviat a la mateixa fulla el `padding` del `.mobile-logo-wrapper` i ha posat un `max-height: 26px` literal. No és meu i no l'he tocat.

### 3. Tasca 1: Sign in with Apple i Google natius [FET; botiga pendent de configuració]

**Arquitectura: pont de testimoni OIDC, respectant el Model B.**
- `src/config/entradaNativa.js` és un registre pur, sense imports. El munta només `src/natiu/entrada.jsx`, abans d'`arrenca()`.
- `src/natiu/entradaSocial.js` és l'únic fitxer que nomena el connector, i només per un `import()` dinàmic. `@capacitor/core` no s'importa mai.
- La web i el connector de WordPress no porten ni una línia de capgo: ho comproven la prova de frontera i les sondes de build.
- **Port.** Capacitat opcional nova, `entradaAmbToken` → `entraAmbTokenDeProveidor(proveidor, { testimoni, nonce, testimoniAcces, nom }, config)`. A Supabase és `POST /auth/v1/token?grant_type=id_token`, que és exactament el que fa `signInWithIdToken`, i segueix la coreografia de `loginWithPassword`.
- **Nonce.** 32 bytes aleatoris. El proveïdor rep el SHA-256 en hexadecimal i GoTrue rep el valor cru. Si `crypto.subtle` falla, hi ha una implementació pura de SHA-256 (FIPS 180-4) provada amb els vectors del NIST.
- **Nom d'Apple.** Apple el dona només el primer cop. Es desa només si el perfil encara té el nom de reserva `Veí/na`, i es neteja de caràcters de control i de bidi.
- **Cancel·lació** (`USER_CANCELLED`, 1001): cap avís.
  - «Cancel·la l'entrada» allibera el bloqueig.
  - Un toc repetit sobre el mateix proveïdor s'afegix a l'entrada en curs.
  - L'altre proveïdor mostra «Ja hi ha una entrada oberta al telèfon».
- **Plataforma.** Es registra sempre a iOS i a Android, encara que no hi haja cap proveïdor, perquè el Google web, que no pot funcionar dins del WebView, no aparega mai a l'app.
- **Interfície (`OnboardingSection.jsx`, `EntradaNativa.jsx`).**
  - A iOS: «Continua amb Apple» negre i primer, «Continua amb Google» clar amb la G, l'avís de condicions i el divisor «O amb el teu correu electrònic». La web queda idèntica.
  - Sense etiquetes ni entradeta a la capçalera nativa, perquè Apple es veja sense desplaçar (HIG).
  - Els logotips són provisionals (§10).
- **Configuració.**
  - `capacitor.config.json` porta google i apple; facebook i twitter queden fora.
  - Client ID: `VITE_NATIU_GOOGLE_WEB_CLIENT_ID` i `VITE_NATIU_GOOGLE_IOS_CLIENT_ID`, que van a `.env.natiu.local`.
  - `vite.natiu.config.js` valida la forma dels ID i refusa un ID iOS si l'`Info.plist` no registra el seu esquema invertit, perquè sense ell GoogleSignIn faria petar l'app.
- **Verificat al simulador (iPhone 17).**
  - Apple sense signar: `AKAuthenticationError -7026`, que es converteix en `ASAuthorizationError 1000` i un avís sobri. És l'esperat sense l'equip de signatura.
  - Build de demostració amb client fictici, en una còpia fora del repo: els dos botons, el diàleg del sistema i la cancel·lació sense avís.
  - El diàleg deia «App» i ara diu «Sóc de Poble», perquè `CFBundleName` era el de la plantilla.

### 4. Tasca 2: moderació UGC (App Store 1.2 i Google Play) [FET; migració no aplicada]

- **Port.** Capacitats opcionals de moderació (denunciar, bloquejar, desbloquejar, llistar i normes) amb validació al contracte. Supabase envia les denúncies anònimes amb `return=minimal`. En mode de llavor o local, un magatzem en memòria.
- **Interfície.**
  - El menú ⋮ (`useMenuEmergent`) és opcional a `UniversalCard`, així que les instantànies no canvien. Va al Mur, al Mercat, a l'Agenda, al detall públic, als perfils, a cada missatge i a la capçalera de la conversa.
  - Diàleg de denúncia amb motius (contingut ofensiu, spam o frau, desinformació, un altre) i detall opcional.
  - Bloqueig amb confirmació. Llista de bloquejos per a desbloquejar a Privacitat i al Control del xat.
  - Modal de normes de convivència abans de la primera publicació i del primer missatge.
  - Exclosos: el propi contingut, les pàgines del sistema, l'entitat pilot i la IAIA. Un convidat pot denunciar, però no pot bloquejar.
- **Ocultació.** Es fa al centre: al `MurContext` i al xat. Els missatges bloquejats queden plegats i no compten als no llegits; les llistes en brut i les marques de lectura no es toquen.
- **Migració `supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql`** (NO aplicada; l'aplica el Mestre).
  - Porta els `GRANT` del mandat del 30 d'octubre literals, a més de RLS, i passa `tractor-rls`.
  - Les denúncies només les veu qui les fa i el superadmin. Els bloquejos, només qui bloqueja.
  - Un disparador força l'autor i l'estat. Límits per compte i per IP; IPv6 agrupat per /64.
  - Sostre global de 300 denúncies anònimes per hora. És fruit de la revisió adversa, i el grant anònim es manté perquè és del mandat.
  - Les normes només s'accepten per a versions reals i no futures, amb un màxim de 20 per persona.
- **Verificat al navegador** (mode de llavor, 375px): el menú, el diàleg, la confirmació, el bloqueig instantani i el menú del missatge.
- **Defecte vell trobat i esmenat.** El menú del missatge s'obria cap a la vora i eixia de la pantalla, de 280 a 504 px en 375. Ara s'obri cap a la bombolla, i ho fixa `src/css/xatMenuEstret.capes.test.js`.

### 5. Tasca 3: iOS i URL pública d'esborrat [FET]

- **`ios/App/App/Info.plist`.**
  - Regió `ca` i cinc llengües. `arm64`. Sense xifrat propi.
  - `CFBundleName` «Sóc de Poble». iPhone només en vertical; l'iPad manté les quatre orientacions.
  - Esquema de Google provisional: `com.googleusercontent.apps.pendent`.
- **Permisos en valencià:**
  - `NSCameraUsageDescription` i `NSPhotoLibraryUsageDescription` amb el text exacte del prompt;
  - també `NSMicrophoneUsageDescription`, perquè l'editor accepta vídeo;
  - i `NSPhotoLibraryAddUsageDescription`.
- **Fitxers nous:** `InfoPlist.strings` en ca, es, en, eu i gl; `App.entitlements` amb Sign in with Apple; i `PrivacyInfo.xcprivacy` amb 7 tipus de dades i UserDefaults (CA92.1).
- **Projecte.** Al `pbxproj`, iOS 16.0 i `CODE_SIGN_ENTITLEMENTS`.
- **Què es versionaria.** El projecte, les fonts, `Package.resolved` i els recursos. `public/` (56 MB) i `capacitor.config.json` queden ignorats.
- **`/legal#esborra-compte`.**
  - Bloc nou «Com esborrar la teua conta» a §16 de `legalContent.js`, amb dos afegits quirúrgics que respecten la línia de Fernando Tellado d'una altra mà.
  - `PageFrame` hi baixa també amb el fragment de l'URL; `?seccio=` continua manant.
  - El sanejador no deixa passar `id`: l'àncora va per `data-sdp-ancora`, per no obrir la porta a sobreescriure elements del DOM per `id`.
  - §10 diu ara la veritat sobre els missatges del xat (decisió D-1 = A: el text seguix el codi).

### 6. Tasca 4: alletjament del nucli, etapa 1 [FET]

- **L1, diccionaris sota demanda.**
  - Viuen a `src/config/idiomes/{ca,es,en,eu,gl}.js`. El valencià és síncron; les altres quatre llengües es carreguen amb `import()` literal.
  - `UIContext` distingix la llengua demanada de la llengua del text: pinta en valencià fins que arriba el diccionari, sense buits ni claus crues.
  - Les primeres pintades de `main.jsx` i del natiu esperen fins a 300 ms el diccionari desat. Un `import()` fallit no queda en memòria cau.
  - **Entrada natiu:** de 1.362.201 a 1.200.253 B crus (gzip de 372.536 a 329.953 B).
  - **Trossos d'idioma:** de 52 a 55 KB crus, o de 12 a 13 KB en brotli, cadascun.
  - **Portes adaptades amb autorització:** LLEI_07 de pedra-seca i L6 de consell, en doble lectura. La seua eixida és idèntica a la base.
  - **Pendent:** abaixar `SOSTRE_DEL_TROS_D_ENTRADA` quan es refaça `build:wp`.
- **L10.** `rag-index.json` i `slugIndex.json` ja no entren a `dist-natiu`: −1.432.575 B. El connector de WordPress els continua portant.
- **L4.**
  - El xat a ≤720px, inclosa la primera pintada sense mesurar, ja no munta la pàgina destacada.
  - `PAGE_COPY` es carrega en diferit.
  - El document diferit són 19 trossos: 225.949 B crus en total i uns 72 KB nets a l'arrencada.
  - El tall real és 720 px, no 768.

### 7. Revisió adversa: 5 enfocaments, 24 agents, verificació independent

**Enfocaments:** seguretat, correcció, botigues i a11y, integritat de proves, i projecte natiu.

**Resultat:** 15 troballes confirmades (2 majors) i 4 refutades. Les 15 estan esmenades amb proves, tret de dues que són de `tooling/` i `scripts/` (§9).

**Les dues majors:**
- No hi havia sostre global per a les denúncies anònimes.
- Una build d'Android sense client ID mostrava el Google web dins de l'app.

**Tres més les he trobades jo al simulador i al navegador:**
- el botó d'Apple quedava davall del plec;
- el diàleg de Google deia «App»;
- el menú del missatge eixia de la pantalla.

**Una esmena meua l'ha caçada una guarda.** Llevar el logotip (`senseLogo`) per a pujar el botó d'Apple trencava `PageFrame.logo.test.jsx`, que reserva eixa via a una ordre vostra. He tornat el logotip; en un iPhone 17, Apple es continua veient sense desplaçar. En un iPhone SE caldria la vostra ordre (§10).

### 8. Contrast amb Gemini 4 Argon (taula redona)

- **Hem coincidit en:**
  - REST `grant_type=id_token` en lloc de supabase-js;
  - un registre pur per a l'adaptador natiu i una capacitat opcional;
  - el nonce cru per a GoTrue i el hash per al proveïdor;
  - el nom d'Apple només el primer cop;
  - `return=minimal` per a les denúncies anònimes;
  - `PAGE_COPY` com a causa del pes del xat;
  - un paràmetre d'exclusió per a L10.
- **He esmenat amb evidència:**
  - `slugIndex.json` fa 12.704 B, no 242 kB, i `seo-routes.json` no és a `public/`.
  - La migració de Gemini donava `select, update, delete` a `authenticated` sense límit d'abús. La final el té: limitació, disparador i sostre.
  - La seua opció 1 per a Google, el navegador del sistema, no és `signInWithIdToken` i demana enllaços de tornada que la producció no servix. El Mestre ha triat la nativa.
  - Persistir la sessió amb `@capacitor/preferences` no forma part d'esta fase (F1, §10).
- **Fora del meu encàrrec:** l'estudi de Fernando Tellado i la transformació editorial a `<h5>` (Tasca 6 de Gemini).

### 9. Govern

- **Escriptures directes autoritzades** (decisió 2):
  - `package.json` i `package-lock.json`. Només s'hi afig `@capgo/capacitor-social-login` 8.5.12, amb la integritat del registre; cap altre paquet canvia.
  - `tooling/brain/tractor-pedra-seca.mjs`, només LLEI_07.
  - `tooling/scripts/tractor-consell-core.mjs`, només L6.
- **Els hooks del repo no estaven carregats** en esta sessió: la política me l'he aplicada jo mateix. No he tocat `.agents/`, `scripts/`, `.husky/` ni `.claude/`.
- **Pegats proposats, que no he aplicat per falta d'autorització:**
  1. `tooling/brain/tractor-pedra-seca.mjs:36`: `const ENTRADES = ['src/main.jsx', 'src/wp-standalone.js', 'tooling/brain/mapa-consola.mjs', 'src/natiu/entrada.jsx'];`. Lleva les dues òrfenes falses, `entradaSocial.js` i `resum.js`, i també `entrada.jsx`, que ja era òrfena.
  2. `scripts/botigues/preflight.mjs`: fallar si `node_modules/@capgo/capacitor-social-login/Package.swift` porta `facebook-ios-sdk` actiu (`npm ci` el restaura).
  3. `scripts/botigues/puja-ios.mjs`: afegir `-onlyUsePackageVersionsFromResolvedFile` a l'arxivat i a `OPCIONS_XCODEBUILD`.
- **La porta psicopatia baixa de 18 a 14** contradiccions: les 4 de la Fase D són fora.
- **Cap commit.** El hook no pot passar (memòria: lease, HEAD roig, sostre de 120 s). La via la decidiu vosaltres (§10).

### 10. Decisions i passos que són vostres

1. **Google.**
   - Creeu els clients web, iOS i Android (amb el SHA-1 de debug, de pujada i de Play App Signing).
   - Poseu els ID a `.env.natiu.local` i l'esquema invertit iOS a l'`Info.plist`, en lloc de `pendent`.
   - Supabase, proveïdor Google: client ID web,iOS,Android, el web primer, i «skip nonce check» desactivat.
2. **Apple.**
   - Capacitat Sign in with Apple a l'App ID `org.socdepoble.app`, i `DEVELOPMENT_TEAM` a Xcode.
   - Supabase, proveïdor Apple: client ID `org.socdepoble.app`. Per a l'entrada només nativa no cal secret.
   - Dominis de correu al relé privat d'Apple, amb SPF.
3. **Revocació del testimoni d'Apple** quan s'esborra un compte: una Edge Function amb `/auth/token` i `/auth/revoke`. Recomane no enviar a l'App Store sense ella (guia 5.1.1(v)), si no és que n'accepteu el risc.
4. **Logotips oficials** d'Apple (Apple Design Resources) i de Google (paquet de marca), que substituïsquen els provisionals de `LogotipsDeMarca.jsx`.
5. **Textos a validar:**
   - l'avís legal davall dels botons: «En continuar, acceptes les condicions d'ús i la política de privacitat de Sóc de Poble.»;
   - les traduccions a èuscar i gallec, per una persona nativa;
   - el termini «en menys de 24 hores».
6. **iPhone SE.** Per a vore Apple sense desplaçar en pantalles xicotetes cal llevar el logotip de la capçalera nativa (`senseLogo`). La guarda diu que només per ordre vostra.
7. **Aplicar la migració 2610201500.** Abans, decidiu si manteniu les denúncies anònimes, que són del mandat i ara porten sostre, o les lleveu.
8. **Moderació en marxa.**
   - Qui revisa i en quant de temps.
   - Avís d'una denúncia nova (per exemple, un webhook que envie un correu).
   - Filtre abans de publicar (guia 1.2).
   - Bloquejos i normes també al servidor.
   - Normes a l'alta.
   - Denúncies i bloquejos a l'exportació del RGPD.
9. **Legal.**
   - Aprovar l'empremta de `legal` i `constitucio` (`frontissa-contingut`) i, si cal, pujar-ne la versió.
   - Buidar `private.purga_storage_pendent` (D-7): el text diu que les fotos s'esborren.
   - Desplegar producció, que és un Firebase de juny, perquè `https://socdepoble.org/legal#esborra-compte` funcione al formulari de Play.
10. **Pegats de govern** de §9, i abaixar `SOSTRE_DEL_TROS_D_ENTRADA` després de `build:wp`.
11. **Commit de la Fase D.** Són uns 116 fitxers modificats, 54 de nous i el projecte `ios/`. Diteu-me la via.
12. **Abans de botiga, encara:**
    - la icona i el splash propis, que ara són els de Capacitor;
    - iPad sí o no, perquè amb iPad cal fer captures d'iPad;
    - la persistència de la sessió nativa (F1 de la Fase C).

### 11. Relleu per a MarIA (ESTAT i LEDGER)

Claude no pot escriure `.agents/`. Proposta de línia per al LEDGER: `261020 | torn | claude | Fase D: auth nativa, moderació, iOS, L1/L10/L4 i barra negra`. A ESTAT: el torn `torn_ae1a7ff6-2572-431c-a352-e3ed470f30ef` ha deixat la Fase D implementada i verificada a l'arbre, sense commit; les decisions pendents són a §10 d'este informe.

### 12. Retroalimentació de la plantilla `prompt_local`

- **Rutes inexistents.** El prompt nomenava fitxers que no existeixen o no són el que diu:
  - `EntradaDelPoble.jsx` com a pantalla d'entrada;
  - `XatDeLaComunitat.jsx`;
  - `src/sections/legal/`;
  - llengües francés i alemany;
  - un `Info.plist` sense `ios/`.

  La mateixa lliçó de la Fase C: cada ruta d'un encàrrec s'hauria de comprovar amb `ls` o `grep` en redactar-lo.
- **Connectors.** Es nomenaven paquets concrets sense comprovar la compatibilitat. Millor «X o un equivalent compatible amb Capacitor 8 i SPM, comprovat amb `npm view … peerDependencies`».
- **Preflight.** Marcava «working tree clean» i «simulador iniciat», i cap de les dues coses era certa en arrencar. Cada `[x]` hauria de portar l'ordre i l'eixida que el proven.
- **Mandat i estil de la casa.** Els `GRANT` del mandat xocaven amb l'estil de la casa, on les escriptures van per RPC. La plantilla podria dir «reconcilia el mandat amb l'estil de la casa; no en tries un».
- **Informe de progrés.** Un sol document per torn, reescrit a cada relleu, ha funcionat bé. Convindria que la plantilla ho diguera així.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Ordre | Resultat |
| --- | --- | --- |
| Vitest complet, 1a passada (abans de la revisió) | `npx vitest run` | 1.187 fitxers; 20.150 proves en verd; 100 omeses; 0 fallades |
| Vitest complet, 2a passada (després de les esmenes) | `npx vitest run` | 20.174 en verd i 1 fallada (la guarda de `senseLogo`), ja esmenada; vegeu la 3a |
| Vitest complet, 3a passada (estat final, 19:17) | `npx vitest run` | 1.189 fitxers; 20.178 proves en verd; 100 omeses; 0 fallades (base del prompt: 19.735) |
| Suite Node primària | `node tooling/tests/run-node-tests.mjs` | 1.018 proves: 1.010 en verd, 2 fallades anteriors i alienes (`migracio-membres-organitzacio` per la 2610181915; `backend_consolidacio` per `CODI_SEGON_FACTOR`), 2 omeses, 4 diagnòstics |
| Portes de disseny i govern (18) | `portes.sh` contra la base de les 16:16 | Codis d'eixida idèntics. Identitats noves: 2 de LLEI_08 (pegat a §9). `div-soup` del catàleg d'11 a 13 (avís). `tractor-rls` en verd (50 SQL). |
| Projecte iOS | `plutil -lint`, `xcodebuild -list`, `xcodebuild … iphonesimulator build` | Totes les llistes, OK. BUILD SUCCEEDED. L'app instal·lada mostra els 4 permisos, `ca`, `arm64`, `CFBundleName` «Sóc de Poble», 5 `.lproj` i `PrivacyInfo`. |
| Simulador iPhone 17 (iOS 27.0) | instal·lació i navegació | Barra negra i calaix davall de la Dynamic Island. Apple visible sense desplaçar. Apple sense signar: error 1000 amb avís sobri. Build de demostració: Google amb diàleg «Sóc de Poble» i cancel·lació sense avís. |
| Navegador a 375px, mode de llavor | servidor de desenvolupament existent (:3340) | Menú de la targeta, denúncia, confirmació, bloqueig instantani i menú del missatge dins de la pantalla |
| Paquet natiu | `build-natiu.sh` i `du` | 47 MB, sense `rag-index.json` ni `slugIndex.json`; trossos `es`, `en`, `eu` i `gl` a part |
| Lock | diff de `packages` | Només s'afig `@capgo/capacitor-social-login` 8.5.12; cap paquet canvia de versió |

**Captures d'evidència:** `_multimedia_de_poble/captures_treball/261020_fase_d_01…13_*` (13 fitxers). Les que diuen `DEMO` venen d'una build de demostració, amb client ID fictici i fora del repo: Google no funcionarà de veritat fins que es configure (§10).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Botiga.** Sign in with Apple i Google no s'han pogut completar de cap a cap: falten l'equip de signatura, la capacitat i els client ID reals. Està provat el camí fins al full del sistema, i la gestió dels errors i de la cancel·lació.
- **Migració.** L'SQL no s'ha executat enlloc: en esta màquina no hi ha Postgres. La comprova la prova estàtica, i `tractor-rls`.
- **Android.** No s'ha provat: no hi ha `android/` i la imatge de l'emulador està trencada.
- **Moderació en el natiu.** Les captures del menú són del navegador en mode de llavor, perquè el Supabase remot no té cap publicació de veí visible per a un convidat.
- **Normes de botiga.** Les afirmacions venen de les pàgines oficials consultades avui (guies d'App Review del 16-10-2026, HIG, marca de Google, Play). No substituïxen la revisió humana.
- **Arbre compartit.** Altres mans han tocat l'arbre durant el torn: `legalContent.js`, `pageContent.js` i `layout.css` (`.mobile-logo-wrapper`). Les seues línies són intactes.
- **Processos.** No he creat cap cron ni cap tasca programada. Del meu torn no queda cap procés de fons viu: el servidor de llavor que vaig provar d'engegar al 3341 no va arrancar, i el del 3340 no és meu. El simulador queda engegat amb la build de la Fase D.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261020_1300_pla_implementacio_botigues_i_auth_mobil]]
- [[261020_1300_prompt_claude_botigues_i_auth_mobil]]
- [[261020_1400_auditoria_gemini_fase_d_i_estudi_tellado]]
