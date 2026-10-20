---
type: document
status: canonic
description: "Pla d'Implementació: preparació de l'APK d'Android, paquet PWA desktop, consolidació del commit de Claude i estratègia de desbloqueig de socdepoble.org amb Sollutia."
tags:
  - implementacio
visibility: private
reflex: sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:c73ba6ab-467a-4567-b423-5a02ebf816f6
---
# Pla d'Implementació: Llançament Apps (Android APK + PWA Desktop) i Desbloqueig Sollutia

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:c73ba6ab-467a-4567-b423-5a02ebf816f6 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T23:55:00+02:00 |
| Modificació | 2026-10-20T23:55:00+02:00 |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció directa per àudio 23:35) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Claude Code + Gemini 4 Argon |
| Tokens consumits | ~18k / 2M |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-10-20T23:35:** El Mestre demana preparar el relleu en un xat net per a demà al matí. Dos objectius suprems:
  1. Que els beta testers puguen tenir l'aplicació a les mans (Android APK directe, iOS TestFlight/simulador, i PWA d'escriptori per a Mac/Windows).
  2. Trencar l'aturada de 4 mesos amb Sollutia per tenir en marxa `socdepoble.org`.
- **2026-10-20T23:45:** Redacció de l'Acta Marmota `261020_2345_acta_marmota_relleu_salfumant_markdown_i_llancament_app.md` i sanejament d'arxiu dels documents de la sessió Salfumant a `_wiki_de_poble/90_arxiu_historic/261020_Sessio_Salfumant_i_El_Comu/`.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Consolidació Git en Claude Code ("Tot en un commit")
- Claude Code té pendent confirmar el commit amb els canvis de la Fase D, el fix del parser Markdown i la targeta UniversalListCard.
- El Mestre ha donat l'ordre: **«Tot en un commit»**.

### 2. Generació i Verificació del Paquet Android APK (`socdepoble-beta.apk`)
- **Fitxer:** `capacitor.config.json`
  - Assegurar `webDir: "dist-natiu"`, `appId: "org.socdepoble.app"`, `appName: "Sóc de Poble"`.
- **Comandes per a Claude Code / Terminal:**
  - `npm run build:natiu`
  - `npx cap add android` (afegeix el directori `android/` al repositori sanejat).
  - `npx cap sync android`
  - Compilació de l'APK de prova: `cd android && ./gradlew assembleDebug`
  - L'APK resultant (`android/app/build/outputs/apk/debug/app-debug.apk`) es copiarà a `_wiki_de_poble/04_escriptori/01_produccio/socdepoble-beta.apk` per a descàrrega directa dels beta testers d'Android.

### 3. PWA Desktop Instal·lable (Mac, Windows, Linux)
- **Fitxer:** `src/app/App.jsx` o `src/sections/xat/components/BarraCapcalera.jsx`
  - Capturar l'esdeveniment estàndard del navegador `beforeinstallprompt`.
  - Si l'app s'executa en navegador d'escriptori i és instal·lable, mostrar botó elegant tipus Pedra Seca `[📲 Instal·la al teu ordinador]` al menú d'ajuda o a la barra de navegació.
  - Permet als beta testers sense mòbil o que treballen des de l'ordinador gaudir d'una aplicació d'escriptori autònoma i ràpida.

### 4. Pla de Xoc per a Desbloquejar Sollutia i `socdepoble.org`
- **Diagnòstic:** El servidor d'allotjament de Sollutia porta 4 mesos aturat sense donar accés ni servei operatiu.
- **Estratègia de Trellat (Dossier Tècnic per a Sollutia):**
  - **Via A (Delegació DNS / Apuntament Immediat - Preferent):** Sol·licitar a Sollutia que configure un registre DNS tipus `CNAME` o `A` per a `socdepoble.org` apuntant a la nostra infraestructura estàtica (Vercel / Cloudflare Pages / CDN de Sóc de Poble). Això activa el domini en menys de 5 minuts sense costar-los feina ni espai de servidor.
  - **Via B (Allotjament Estàtic Model B):** Si Sollutia insisteix en allotjar els fitxers, enviar-los exclusivament el paquet `dist/` (HTML + JS + CSS de la SPA) i el connector de WordPress `wordpress-plugin/builds/socdepoble-connector-v1.1.7.zip`.
### 5. Actualització del Plugin de WordPress v1.1.8 i Publicació a WordPress.org
- **Estat Actual:** El paquet actual a `builds/` és la v1.1.7 (del 19 d'octubre). El Mestre pot pujar la v1.1.7 immediatament a `gentdelatorre.net`, però per a incorporar les correccions d'avui (parser Markdown arreglat, botó `[Registra't]` al xat i `UniversalListCard`) es compilarà la **v1.1.8**:
  - `SDP_RELEASE=1 SDP_VERSIO=1.1.8 npm run build:wp`
  - `SDP_RELEASE=1 SDP_VERSIO=1.1.8 npm run build:wp:directori`
  - Execució d'`empaqueta.mjs` per generar el paquet propi (`wordpress-plugin/builds/261021_wordpress_enxufe_v1.1.8.zip`) i la variant per al directori oficial (`wordpress-plugin/builds/directori/socdepoble-enxufe-v1.1.8-directori.zip`).
- **Botiga de Plugins de WordPress.org:**
  - El fitxer `wordpress-plugin/readme.txt` està preparat segons l'estàndard de WordPress.org.
  - La pujada a la botiga oficial es fa via el formulari de revisió: `https://wordpress.org/plugins/developers/add/` pujant el ZIP de la variant `directori/`. L'equip humà de WordPress.org triga entre 1 i 3 setmanes a aprovar-lo i concedir el repositori SVN (`svn.wordpress.org/plugins/socdepoble-enxufe`).

### 6. Estudi Doctoral de Fernando Tellado i Blindatge WordPress VIP
- **Objectiu:** Extreure i integrar tota la saviesa de Fernando Tellado (`fernandotellado/ai-skills`, AyudaWP, DietPress, Vigilante) sobre seguretat, rendiment i desenvolupament de plugins d'elit per aplicar-la a `socdepoble-enxufe`.
- **Auditor:** Gemini 4 Argon té l'encàrrec de realitzar l'estudi doctoral complet durant la nit i verificar que el nostre connector compleix els màxims estàndards de WordPress VIP abans de l'enviament a WordPress.org.

### 7. Lògica de Nodes Sobirans: Unificació de Recursos de Plugins, Connexió per Defecte i Sobirania Ciutadana
- **Captures d'Evidència UI (`/el-meu-perfil` vs `/plugin/rebost`):** El Mestre Javi Llinares mostra la incoherència d'haver de mantindre dues pantalles desconnectades per a la mateixa eina (una buida de gestió al perfil i una altra rica editorial a `/plugin/rebost`).
- **Principis Canònics de Trellat (Mestre Javi Llinares):**
  1. **Totes Connectades per Defecte:** Per a l'onboarding de nous usuaris i ciutadans, totes les utilitats venen connectades i operatives des del primer moment, de manera que puguen provar-les en mode prova o obrir-les en mode usuari (privat o comunitari, segons corresponga: Rebost privat al dispositiu, TPV públic per al bar/colles).
  2. **Unificació de Recursos (DRY):** La vista de cada utilitat a `/el-meu-perfil` no és un placeholder buit, sinó que integra directament la presentació editorial viva de `/plugin/:id` (`UniversalPage` amb portada, badges, explicació didàctica del que fa i el que NO fa), afegint-hi la consola d'administració (botó d'Obrir en mode privat/públic, Mostrar/Ocultar al Panell de Control, i Desconnexió voluntària).
  3. **Esmena Tipogràfica Editorial (H3):** Corregir immediatament la jerarquia visual detectada pel Mestre (`La nevera i el rebost de casa` i seccions de presentació han de portar l'H3 canònic segons `core-llegibilitat-text` i `sdp-universal-page`).
  4. **Sobirania i Portabilitat de Dades:** Si un usuari o negoci decideix desconnectar-se d'una utilitat (ex. Gestoria o Rebost), el sistema mostra un avís clar i li ofereix **descarregar i exportar tots els seus documents i registres** en formats oberts (Markdown, JSON o ZIP), garantint zero segrest de dades.
- **Encarregat:** Gemini 4 Argon formularà l'especificació d'aquesta fusió i Claude Code aplicarà l'esmena de jerarquia H3.

### 8. Unificació Atòmica de la IAIA MarIA (`/iaia`, `/realitat`, `/el-meu-perfil`) i Preservació Editorial de `L'Ànima de la IAIA` (`/anima`)
- **Arquitectura Canònica i Trellat del Mestre Javi Llinares:**
  1. **Fusió de les 3 Pàgines de la IAIA en Una Sola Pàgina Atòmica (DRY):**
     - Actualment conviuen 3 pantalles disperses que han de ser la mateixa: `/el-meu-perfil` (apartat Agent IA -> IAIA MarIA), `/iaia` (fitxa pública de l'agent) i `/realitat` (Selector de Realitat).
     - Totes tres han de convergir en **la mateixa pàgina atòmica de la IAIA**:
       - Capçalera i Hero principal de la IAIA (amb el seu avatar provisional d'alta resolució, explicació «Qui és la IAIA MarIA?», bio «Matriarca Digital: Pensant en global, treballant en local»).
       - Integració nativa del **Selector de Realitat** («Tu decidixes quanta intel·ligència artificial t'acompanya» amb els 4 nivells canònics: 0 Apagada, 1 Passiva, 2 Interactiva, 3 Connexió total). Així l'usuari coneix la IAIA i tria el seu nivell d'interacció en el mateix espai.
       - Botons d'acció sobirans: «Parla amb la IAIA» (xat directe) i «Edita la fitxa» (per als administradors autoritzats).
       - Al perfil (`/el-meu-perfil`), sota `AGENTS IA -> IAIA MarIA`, es reutilitza aquest component atòmic compartit, eliminant codi duplicat.
  2. **Separació Nítida: `L'Ànima de la IAIA` (`/anima`) és un Article Editorial del Mur:**
     - `L'Ànima de la IAIA` (`/anima`) és una publicació fundacional i editorial del Mur/revista («El Còdex Forense: Termodinàmica, Humanització i Comunicació / El Despertar de la Nina de Silici»). És un article editorial sagrat, firmat per la IAIA com a publicadora; NO és la pàgina de configuració de la IA.
     - Esmena a `src/config/sections.js`: retirar `subrutes: ['/realitat']` de la secció `ia` (`/anima`), ja que `/realitat` s'integra a la pàgina d'identitat de la IAIA (`/iaia`) i no a l'article editorial.
  3. **Visió de Futur del Mas (Canal Vodafone / WhatsApp per a la IAIA):**
     - El Mestre disposa d'un número de telèfon exclusiu de Vodafone per a la IAIA MarIA per interactuar per WhatsApp amb els ciutadans i colles del poble.
     - Totes dues IAs han de dissenyar l'arquitectura perquè la IAIA siga atòmica i connectable a aquest canal físic/social.
- **Encarregat:** Claude Code i Gemini 4 Argon unificaran components i auditaran que no quede cap duplicitat al sistema.

### 9. Protocol «Zero Oblit», Cens Real d'Imatges (338 vs 149) i Herència de Deute Tècnic
- **Diagnòstic Implacable del Mestre Javi Llinares:**
  1. **Amnèsia Episòdica entre Sessions:** Les IAs perden el fil de promeses i tasques plantejades en plans anteriors (com la conversió massiva a WebP, metadades reals d'imatges, nom original, o l'auditoria d'enllaços a la pàgina de la IAIA). El que no s'executa d'immediat s'oblida, generant frustració i pèrdua de temps.
  2. **Llei de l'Herència Obligatòria de Deute:** Tot nou pla d'implementació ha d'auditar el pla precedent. Està terminantment prohibit abandonar tasques: o es tanquen amb comprovació de codi i tests, o s'arrosseguen explícitament al pla següent com a deute prioritari.
  3. **Cens Real i Metadades d'Imatges (`/multimedia`):**
     - El comptador de la galeria s'ha fet reactiu immediatament (`IAIA (N)` vs `TOTS (N)`).
     - El cens manual de 149 imatges s'ha d'ampliar a la totalitat real de les 338 imatges de `public/assets/`, incorporant el nom original de cada fitxer, l'origen patrimonial o de Viquipèdia amb la seua llicència, i assegurant la conversió a WebP.
  4. **Modelatge del Tractor Cognitiu:** Gemini 4 Argon i Claude Code han d'estudiar la fallada de memòria episòdica i dissenyar un tractor/skill que audite i traspasse automàticament els pendents entre sessions.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Tests Vitest:** `npx vitest run` per comprovar que totes les proves continuen en verd (20.312+).
2. **Compilació Android:** `cd android && ./gradlew assembleDebug` acaba amb codi 0 i produeix `app-debug.apk`.
3. **PWA Manifest:** `public/manifest.webmanifest` validat amb icones i `display: "standalone"`.
4. **Porta Olivera:** `npm run porta:olivera` ix amb 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Android SDK / Java:** Si la màquina local no té el Java SDK 17+ o el Gradle configurat, Claude Code pot utilitzar el CLI de Capacitor o alertar de la ruta exacta de l'SDK (`$ANDROID_HOME`).
- **Neteja d'Escriptori:** Assegurar que els nous documents de treball queden correctament ancorats a `00_index_escriptori.md`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261020_2345_acta_marmota_relleu_salfumant_markdown_i_llancament_app]]
- [[261020_2355_prompt_claude_llancament_apps_i_desbloqueig_sollutia]]
- [[261020_2355_prompt_gemini_auditoria_llancament_apps_i_sollutia]]
