---
type: document
status: canonic
description: LLIBRE MESTRE PERMANENT DE TASQUES, DEUTES TÈCNICS I BANC D'IDEES DEL MESTRE (Zero Oblit)
tags:
  - govern
  - arquitectura
  - full_de_ruta
  - backlog
  - llibre_mestre
---

# 📖 03 · LLIBRE MESTRE DE TASQUES, DEUTES TÈCNICS I BANC D'IDEES DEL MESTRE

> **Llei Suprema del Zero Oblit:** Aquest document és **permanent i resident a l'Escriptori**. Mai s'arxiva a `90_arxiu_historic/`. És el far i l'àncora que custodia totes les idees del Mestre Javi Llinares, els deutes tècnics heretats de sessions passades i el full de ruta del Mas.
> Quan una IA (Claude, Codex, Gemini o MarIA) arrenca un torn de treball, **ha de consultar aquest Llibre Mestre** per a alinear el seu Pla d'Implementació i buscar sinergies proactives.

---

## 💡 1. Banc d'Idees i Visions del Mestre Javi Llinares

Aquest és el dipòsit sagrat de les idees transmeses pel Mestre a través dels seus àudios i reflexions. Cap idea es perd, cap s'esborra:

| ID Idea | Títol de la Idea | Estat | Descripció i Visió del Mestre |
| :--- | :--- | :--- | :--- |
| **`IDEA-01`** | **Línia Mòbil Vodafone per a la IAIA MarIA** | `[EN CARTERA]` | Contractar una línia SIM pròpia de Vodafone amb número mòbil dedicat per a la IAIA MarIA. Permetrà rebre trucades de veu GSM i missatges de WhatsApp de la gent gran del poble que no usa aplicacions modernes, humanitzant l'atenció comunitària. |
| **`IDEA-02`** | **Llei de la Compressió Única (Bruguera vs Foto)** | `[EN CARTERA]` | Evitar l'infern de 8 miniatures de WordPress. Emmagatzemar un sol actiu mestre en WebP (màxim 1200 px, ~80-120 KB) i una miniatura de 128 px per a avatars. El còmic Bruguera/Berlanga tolera compressions netes sense artefactes; el client escala al vol per GPU. |
| **`IDEA-03`** | **Arxiu de Patrimoni Oral del Mestre** | `[ACTIU]` | Custodiar a `01_produccio/patrimoni_oral_mestre/` les gravacions orals, relats tradicionals i veus del poble per a alimentar el banc de memòria de la IAIA MarIA. |
| **`IDEA-04`** | **Botó PWA Desktop Apple HIG** | `[FET · 4d67f7ab]` | `BotoInstalaApp` a la barra superior amb estil píndola subtil de 32 px, tipografia 0.8125rem i respiració de 20-30 px per a instal·lar l'aplicació nativa en Mac, Windows i Linux. |
| **`IDEA-05`** | **Reforma Didàctica del Selector de Realitat** | `[FET · 32eabf12]` | 4 nivells amb textos humans i didàctics (zero mencions a «la barra negra»), amb acordió d'acompanyants integrat directament sota la targeta de Nivell 2 (`Interactiva`). |
| **`IDEA-06`** | **Planter Rural Canònic de 5 Assistents** | `[FET · 32eabf12]` | Consolidació de la família electrònica rural: 1) IAIA MarIA, 2) Nano Banana («L'Artiste»), 3) Marc (El Gall), 4) El Pregoner, 5) L'Acompanyant de Paraula. Purgats els personatges heretats. |
| **`IDEA-07`** | **Kill Switch Immediat d'IAs («Tots a Dormir»)** | `[FET · e39246c5]` | Quan l'auditoria adversarial emet dictamen final favorable (100% verd), és obligatori matar immediatament tots els crons i timers (`guarda-nocturna.mjs`). Mai més una IA en bucle 10 hores. |
| **`IDEA-08`** | **Finestreta Única Rural contra la Burocràcia** | `[BACKLOG]` | Assistent de tramitació agrària i municipal per a omplir formularis de subvencions, tràmits del banc de terres o ajudes de la PAC sense patir la burocràcia digital. |
| **`IDEA-09`** | **Puresa de la Wiki i Extracció de Binaris a `_builds_de_poble/`** | `[FET · 261021]` | Alliberada la Wiki del binari pesat de 51,4 MB. Creat el directori satèl·lit extern `_builds_de_poble/` al costat del projecte amb subcarpetes `android/` i `wordpress/`. `01_produccio/` queda preservat exclusivament per a recursos i treballs manuals del Mestre. |
| **`IDEA-10`** | **WordPress és un Build: Puresa de `socdepoble.org`** | `[ACTIU · 261021]` | WordPress no és un sistema a banda ni pot llastrar el repositori principal amb 810 MB. El repositori `socdepoble.org` és l'aplicació web pura / Web Component. WordPress és únicament un build (un connector wrapper). Els binaris ZIP viuen fora a `_builds_de_poble/wordpress/`, i el connector PHP es manté ultralleuger (<700 KB) o s'externalitza a directori satèl·lit. |
| **`IDEA-11`** | **Llei del Salfumant Radical: Auditoria Fitxer per Fitxer** | `[ACTIU · 261021]` | Mandat exprés del Mestre per a Claude i Codex: auditar al màxim CADA fitxer que existeix al sistema. Cada arxiu ha de tindre una justificació irrebatible per a existir; si no saben justificar-lo, han de preguntar al Mestre, i si no cal, s'ha d'eliminar immediatament. |
| **`IDEA-12`** | **Sentinella i Cron Permanent contra la Brossa i el Pes** | `[ACTIU · 261021]` | Automatitzar una guarda/cron que vigile permanentment que el sistema mai més es torne a embrutar per coses que no han d'estar al seu lloc ni carregant pes innecessari (cap zip, cap binari >1 MB solt, cap duplicat). |
| **`IDEA-13`** | **Assimilació de Tractors d'AyudaWP / Fernando Tellado** | `[ACTIU · 261021]` | Estudi continuat de l'ecosistema de Fernando Tellado (AyudaWP). No limitar-se al connector de WordPress: analitzar i adaptar els seus plugins gratuïts (com el 'Vigilante' de seguretat, neteja de base de dades, optimització) convertint-los en tractors cognitius i habilitats natives per al sistema Sóc de Poble. |

---

## 🔴 2. Matriu P0 · Bloquejants de Botigues i Producció Pública

> **Criteri P0:** Cap paquet mòbil (`.ipa`, `.aab`, `.apk` final) ni cap llançament a `socdepoble.org` o `gentdelatorre.com` pot publicar-se sense resoldre aquests punts.

| ID | Àmbit | Estat | Descripció del Deute Bloquejant | Fitxers Afectats |
| :--- | :--- | :---: | :--- | :--- |
| **`P0-01`** | **Seguretat RLS / SQL** | `[PENDENT]` | **Fuga de `contact_email` d'organitzacions a anònims:** Revocar `select (contact_email)` per a `anon` a la taula `public.organizations` i limitar-lo a administradors de l'entitat via vista segura o RPC. | `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql:22` |
| **`P0-02`** | **Seguretat / Secrets** | `[PENDENT]` | **Revocació de token històric n8n:** Rotar al servidor d'n8n el token exposat en un commit antic a l'historial de git (`ed6077ff`). | Panell n8n / Historial Git |
| **`P0-03`** | **Apple / Google OAuth Natiu** | `[PENDENT]` | **Credencials reals d'OAuth a iOS/Android:** Substituir `com.googleusercontent.apps.pendent` a `Info.plist:46`, omplir variables OAuth a `.env.natiu.local`, registrar SHA-1 d'Android a Google Cloud Console i activar *Sign in with Apple* al portal d'Apple Developer. | `ios/App/App/Info.plist`, `.env.natiu.local`, Apple Portal |
| **`P0-04`** | **App Store 5.1.1(v)** | `[PENDENT]` | **Revocació del token d'Apple en esborrar compte:** Implementar Edge Function o webhook que cride a `https://appleid.apple.com/auth/revoke` amb JWT signat amb clau `.p8` quan un usuari esborra el seu compte. | Supabase Edge Functions / `esborra_propi_compte()` |
| **`P0-05`** | **Migracions Producció** | `[PENDENT]` | **Aplicar migracions de Fase D i E a Supabase Prod:** Executar a producció l'esborrat de compte (`2610201400`), moderació UGC (`2610201500`) i `elements_comu` amb CAS atòmic. | Supabase Dashboard Producció |
| **`P0-06`** | **Google Play / App Store** | `[PENDENT]` | **Desplegar URL legal d'esborrat a `socdepoble.org`:** Desplegar l'arbre actual a Firebase Hosting (`soc-de-poble`) perquè els revisors de les botigues vegen en viu la política de privacitat i la via d'esborrat de compte. | Firebase Hosting (`soc-de-poble`) |
| **`P0-07`** | **Identitat Visual Botigues** | `[PARCIAL]` | **Icones i Splash Screens de Capacitor:** Android resolt anit amb icona adaptativa verd Pedra Seca (`#0f672f`); pendent verificar i generar el paquet d'icones oficials per a iOS (`ios/App/App/Assets.xcassets/`). | `ios/App/App/Assets.xcassets/` |
| **`P0-08`** | **Textos Legals** | `[PENDENT]` | **Sanejament a `legalContent.js`:** Corregir contradicció del NIF protegit i canviar les 11 ocurrències del barbarisme *«conta»* per **«compte»**. | `src/sections/text/legalContent.js:90-108` |
| **`P0-09`** | **Pàgina «Qui som»** | `[PENDENT]` | **Eliminar `<iframe src="/iaia-maria">` recursiu i enllaç mort `/skills`:** Retirar l'iframe incrustat a `pageContent.js:115` que duplica l'app dins d'ella mateixa. | `src/sections/text/pageContent.js:115, 134` |
| **`P0-10`** | **Diccionaris Multiidioma** | `[FET · 32eabf12]` | Traduccions completes de moderació, eliminació de compte i accés a `es.js`, `en.js`, `eu.js` i `gl.js`. | `src/config/idiomes/gl.js` |
| **`P0-11`** | **Lèxic d'Arrencada** | `[FET · 32eabf12]` | Substituïdes totes les ocurrències d'«ítems» per «elements» a `src/config/idiomes/ca.js`. | `src/config/idiomes/ca.js` |
| **`P0-12`** | **Evacuació Històrica (139 MB)** | `[PENDENT]` | Moure el sediment de sessions passades fora del repositori actiu cap a la carpeta externa d'arxiu històric. | `_wiki_de_poble/90_arxiu_historic/` |
| **`P0-13`** | **WordPress.org / Fernando Tellado** | `[PENDENT]` | **Estudi Continuat d'AyudaWP i Checklist Fernando Tellado:** 1) Estudiar `article-ayudawp.md` i `checklist-limpieza-wp-ayudawp.*` per a netejar `wordpress-plugin/` per a WordPress.org. 2) Investigar l'ecosistema de plugins i documentació d'AyudaWP (com el plugin 'Vigilante') per a adaptar les seues defenses a tractors cognitius permanents del Mas. | `01_produccio/article-ayudawp.md`, `wordpress-plugin/`, `.agents/skills/` |
| **`P0-14`** | **Auditoria Forense Radical Fitxer per Fitxer (Claude & Codex)** | `[PENDENT]` | **Examen implacable de l'arbre sencer:** Claude i Codex han d'auditar fitxer per fitxer tot el repositori (`socdepoble.org`), justificant documentalment la necessitat de cadascun. Si un fitxer no té justificació d'existir o és brossa residual, consultar al Mestre o eliminar-lo/arxivar-lo immediatament. Zero complaença. | Tot el repositori `socdepoble.org` |
| **`P0-15`** | **Sentinella Permanent Antibrutícia i Pes Màxim (Cron/Gate)** | `[FET · 261021]` | **Protecció mecànica contra el retorn de la brossa:** Actualitzat `cron_higiene.mjs` amb deductor d'anomalies de patró de zips, purgat de 763 MB de zips vells cap a `.sdp-paperera-builds/`, i alarma de pes automàtica si `builds/` supera els 25 MB. | `tooling/higiene/cron_higiene.mjs` |
| **`P0-16`** | **Consola 100% Neta en Producció (Zero Errors i Zero Avisos)** | `[FET · 261021]` | **Exigència d'Artesania Radical del Mestre:** Zero errors i zero avisos a DevTools. 1) `src/data/supabase/xat.js`: blindat `loadFils()` per a anònims sense sessió (serveix directament `ambXatsPerDefecte([])`, anul·lant el 401 de `xat_fils_meus`, test unitari afegit). 2) `wordpress-plugin/templates/pantalla-completa.php` i `marcatge.php`: neteja quirúrgica per buffer i `wp_resource_hints` dels preloads de fonts gstatic (Roboto/Open Sans) del tema pare. | `src/data/supabase/xat.js`, `wordpress-plugin/` |

---

## 🟡 3. Matriu P1 · Millores d'Estabilitat, Usabilitat i Poliment

| ID | Àmbit | Estat | Descripció de la Millora | Fitxers Afectats |
| :--- | :--- | :---: | :--- | :--- |
| **`P1-01`** | **Fase E · El Comú** | `[PARCIAL]` | **Culminar `UniversalListCard`, `BottomSheet` i Menjar i Beure (Bars / TPV / Rebost):** Tancar rajoles reactives Bring! (98×116 px), selector de modificadors de comanda i comparador rural de preus amb cost de benzina. | `src/components/universal/UniversalListCard.jsx`, `src/apps/bar/` |
| **`P1-02`** | **Editor de Notes (`useUniversalRichText`)** | `[FET · 32eabf12]` | Protegides les notes guardades que coincideixen amb la llavor verge per evitar que es buiden en tornar a fer focus. | `src/components/universal/richText/useUniversalRichText.js` |
| **`P1-03`** | **Enllaços Compartits des de l'App** | `[FET · 32eabf12]` | Forçat l'origen públic `https://socdepoble.org` via `origenPublic.js` en compartir per WhatsApp des de Capacitor natiu. | `src/config/origenPublic.js` |
| **`P1-04`** | **Seguretat Sessió Android** | `[FET · 4d67f7ab]` | `android:allowBackup="false"`, `fullBackupContent="false"` i regles d'extracció XML per a protegir tokens de sessió al WebView. | `android/app/src/main/AndroidManifest.xml` |
| **`P1-05`** | **Pes del Bundle Natiu** | `[FET · 32eabf12]` | Substituïts fons JPG feixucs (`xat-bg-map-v2.jpg` de 1 MB i `bloc_notes_vintage.jpg`) per versions WebP, estalviant ~3,3 MB. | `src/css/tokens.css`, `vite.natiu.config.js` |
| **`P1-06`** | **Visor d'Imatges en Articles i Emojis** | `[PENDENT]` | Activar el visor modal a pantalla completa (`ImageLightboxModal`) en fer clic a imatges incrustades dins del cos d'articles, i filtrar emojis Unicode 18 en motors antics. | `src/sections/universal/detailSectionMeta.jsx`, `src/llavors/emojis_catalog.js` |
| **`P1-07`** | **Lector RSS en Viu i Mètriques** | `[PENDENT]` | Connectar fonts RSS reals al Lector (`/app/lector`) i connectar les mètriques de salut d'artefactes a la Consola Termodinàmica. | `src/apps/lector/`, `tooling/govern/termometre_context.mjs` |
| **`P1-08`** | **Portes de Govern Natiu** | `[PENDENT]` | Afegir `src/natiu/entrada.jsx` a `tractor-pedra-seca.mjs` i sentinella contra `facebook-ios-sdk` a `preflight.mjs`. | `tooling/gates/tractor-pedra-seca.mjs`, `tooling/natiu/preflight.mjs` |

---

## 🟢 4. Matriu P2 · Full de Ruta Estratègic (2026 T4 – 2027)

| ID | Àmbit | Estat | Descripció de l'Evolució |
| :--- | :--- | :---: | :--- |
| **`P2-01`** | **Les 4 Portes del Panell de Control** | `[BACKLOG]` | Desplegar els adaptadors complets per a les targetes actualment «en obres»: `Vehicle Compartit` (`/app/cotxe`), `Animalets` (`/app/animals`), `Treball / Oficis` (`/app/treball`) i `Habitatge / Banc de Terres` (`/app/habitatge`). |
| **`P2-02`** | **Obsidian REA a l'Escriptori** | `[BACKLOG]` | Portar a producció `useTreeDragReorder.js` (arrossegament d'arbres amb zones 5%/90%/5% i auto-expansió a 750ms) i `WorkspaceSettingsPanel.jsx` (panell d'ajustos a pantalla completa). |
| **`P2-03`** | **Xat Fase F1 i WebRTC** | `[BACKLOG]` | Adjunts multimèdia al xat, cerca textual dins del cos històric de missatges i telefonades de veu/vídeo WebRTC. |
| **`P2-04`** | **Mapa Fotogràfic EXIF** | `[BACKLOG]` | Vista cartogràfica amb agrupament dinàmic (*clustering*) per zoom i línia de temps lateral alimentada per coordenades GPS EXIF. |
| **`P2-05`** | **Partida Doble GnuCash per a la Gestoria** | `[BACKLOG]` | Llibre major de partida doble estricta en enters racionals per a la comptabilitat comunitària i agrària. |
| **`P2-06`** | **Arbre Genealògic d'IA (2027-H2)** | `[BACKLOG]` | Arquitectura hexagonal amb 6 ports (GEDCOM 7.0, SQLite WASM Worker) i mode d'entrevista oral guiada per la IAIA MarIA per preservar els llinatges i malnoms rurals. |
| **`P2-07`** | **Sobirania Local i Fedivers** | `[BACKLOG]` | Connectivitat ActivityPub amb el Fedivers i execució d'inferència local al Mas (servidor físic amb Qwen/Ollama). |

---

## 🔒 5. Protocol d'Herència i Protecció del Llibre Mestre

1. **Inviolabilitat:** Aquest fitxer està protegit per la Porta Olivera i pel protocol de tancament. Està terminantment prohibit buidar-lo, ignorar-lo o traslladar-lo a l'arxiu històric.
2. **Acte Reflex de Captura:** Quan el Mestre Javi esmenta una idea, necessitat o bug per àudio o text, la IA orquestradora l'ha d'afegir immediatament a la Secció corresponent d'aquest Llibre Mestre.
3. **Alimentació de Prompts:** Quan es genera el prompt d'un nou torn per a Claude o Codex, s'extrau del Llibre Mestre tant el bloc de tasques actives com el context de tasques satèl·lits de l'àrea afectada.
4. **Certificació d'Assoliment:** Una tasca només passa a `[FET]` quan s'indica el hash del commit i la verificació de tests que l'avalen.
