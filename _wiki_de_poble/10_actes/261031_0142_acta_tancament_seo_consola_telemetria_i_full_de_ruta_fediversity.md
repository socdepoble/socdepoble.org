---
type: acta
status: esborrany
description: Acta de tancament de la marató del 30-31 d'octubre i full de ruta de dissabte per al deploy, TestFlight/Play i els 5 fronts NGI Fediversity.
tags:
  - acta
visibility: private
reflex: sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:dab49fbb-7182-4dce-b6db-c2abdf4153ff
---
# Acta Marmota 261031: Tancament SEO, Consola Pública, Telemetria i Full de Ruta Dissabte Fediversity

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:dab49fbb-7182-4dce-b6db-c2abdf4153ff |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-31T00:43:49.142Z |
| Modificació | 2026-10-31T00:43:49.142Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-10-31 01:44 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Gemini 4 Argon (High) — Antigravity |
| Tokens consumits | 218000 |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-10-31T00:43:49.142Z: esborrany creat; contingut i verificació pendents.
2026-10-31T00:44:15.000Z: acta Marmota completada per al tancament de la marató nocturna del 30-31 d'octubre i per a la represa de dissabte 31-10 després de l'actualització i reinici del Mac.
2026-10-31T12:35:00.000Z: actualitzada amb el desplegament en viu a producció (`socdepoble.org`), la neteja d'Escriptori, l'aprovació oficial a WordPress.org, el diagnòstic del requeriment Kit Digital (`KD/0001622982` · `socdepoble.net`) per a Sollutia i l'estratègia en 2 rondes de cap de setmana abans d'escriure a Michiel Leenaars (NLnet).
2026-10-31T14:23:38.000Z: font arxivada, citada en text perquè Vincles només admet notes vives (F9): `_wiki_de_poble/90_arxiu_historic/261030_2208_prompt_claude_tancament_seo_consola_publica_i_telemetria_didactica.md`. La va reapuntar a l'arxiu MarIA en la neteja de l'Escriptori del 31-10 (04:08); l'ha moguda de Vincles Claude Code (ordre del Mestre 261031, Ronda 1).

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Resum de la Jornada Maratoniana (29-31 d'Octubre de 2026)
- **Nom Termodinàmic del Xat d'Antigravity (Estàndard uniforme `AAMMDD_HHMM · Tema Principal...`):**
  `261031_1330 · Deploy Producció, WordPress.org, Kit Digital Sollutia i Estratègia NLnet`
- **Tancament de la Ronda `261030_2208` (Claude Opus 5.5, workflows `f5`–`f10`) i Desplegament en Viu a `socdepoble.org`:**
  1. **T1 + T2.1 — Cobertura 100% d'`og:image` i Prerenderitzat Social de les 34 rutes públiques (`f5`):**
     - Incorporades les 18 rutes que faltaven (`8 /plugin/*` + `10 /page/*`) i la portada de `/wikidepoble` a `src/seo/routeMeta.js` i `tooling/vite/prerender-rutes-socials.mjs`.
     - Comprimides les imatges pesades i verificat el límit estricte `<= 300 KB` en totes les portades socials per a WhatsApp, Telegram i Signal.
     - Alliberades `/disseny` i `/consola` com a rutes públiques i indexables (`noindex: false`, incloses a `sitemap.xml`).
  2. **T2.2 — Consola Pública (`/consola/*`), Carpeta Maquinària i Instantània Estàtica Sanejada (`f6` + `f9`):**
     - Retirat el bloqueig de `RequireAuth rol="superadmin"` sobre `/consola/*` a `src/App.jsx` i exposada la carpeta `08_maquinaria` a `src/data/wikiPublicIndex.json` amb filtres d'exclusió de secrets (`SEC-PUB-02`).
     - Creat `tooling/vite/instantania-consola.mjs` (amb el seu test `tooling/vite/instantania-consola.test.mjs`) perquè el build emeta `dist/__iaia/{consola,mapa,govern,empaquetats}.json` amb una instantània real i 100% sanejada (emmascarant rutes `/Users/...`, correus, telèfons, NIFs i secrets; sanejada també la fila `P1-68` del Llibre Mestre).
     - Actualitzades les pàgines `/page/fediversity`, `/page/consola` i `/page/cervell` (`src/sections/text/pageContent.js`).
  3. **T3.1–T3.3 — Tauler Públic d'Umami a `/legal`, Nou Organisme `QuadreDeComandament.jsx`, Llei de Llistes i Rànquing Net (`f7` + `f8` + `f10`):**
     - Eliminat l'`<iframe>` d'Umami Cloud que redirigia al login amb error `403` de Google OAuth; ara `src/sections/text/TaulerTelemetria.jsx` consumeix directament l'API JSON de l'enllaç compartit d'Umami Cloud v3 (`VITE_UMAMI_SHARE_URL=https://cloud.umami.is/analytics/eu/share/lQNmqOm9PM8XD3eF`).
     - Creat l'organisme reutilitzable de Pedra Seca `src/components/PedraSeca/organismes/QuadreDeComandament.jsx`, el seu full d'estils `src/css/taulers.css` i el seu espècimen al Catàleg de Disseny `src/sections/disseny/cataleg/detalls/EspecimenQuadreDeComandament.jsx`.
     - **Llei Tipogràfica de Llistes (`f10`):** `--sdp-li-gap` passa de `8px` a `4px` en `src/css/tokens.css`, i eliminat el prefix repetit `"Visita a: "` a «Les seccions més visitades».
  4. **Desplegament en Viu i Neteja de l'Escriptori (`04:14 CET`):**
     - Arxivats els 19 documents consumits de `261029_*` i `261030_*` cap a `_wiki_de_poble/90_arxiu_historic/` amb `porta-olivera.mjs --arxiva` i `document.mjs handoff`. Portes `porta:olivera`, `porta:orfandat`, `verificador-scc` i `porta-plantilla-viva` en verd (`0` errors).
     - Compilat i desplegat `dist/` a Firebase Hosting (`https://socdepoble.org`, `1.047` fitxers publicats). Verificats amb `HTTP/2 200` `/page/fediversity`, `/consola`, `/__iaia/consola.json` i `/.well-known/webfinger/la-torre-de-les-macanes.json`.

### 2. Aprovació Oficial del Plugin a WordPress.org (`https://wordpress.org/plugins/socdepoble`)
- **Fita Històrica (30/10/2026 17:01 CET):** L'equip del WordPress Plugin Directory ha aprovat definitivament **«Sóc de Poble. Portal de Pobles Connectats»** mantenint el nom original i el slug oficial `socdepoble`.
  - **SVN URL:** `https://plugins.svn.wordpress.org/socdepoble` (`Revision 3776702`, amb `assets/`, `tags/`, `trunk/`).
  - **Public URL:** `https://wordpress.org/plugins/socdepoble` (usuari SVN: `socdepoble`).
- **Aclariment sobre el correu previ d'`AUTOPREREVIEW` (`26Oct26`):** El correu automàtic de fa 3 dies (que demanava verificar el domini `socdepoble.org` i retirar `languages/socdepoble-ca.l10n.php` i `load_plugin_textdomain`) ja va quedar resolt el `261027` mitjançant el registre DNS TXT i la constant `FORA_DEL_DIRECTORI` a `wordpress-plugin/eines/empaqueta.mjs`.
- **Regla d'Or per al primer `svn commit`:** A `trunk/` i `tags/1.1.10/` de l'SVN de WordPress.org s'ha de pujar **exclusivament el contingut extret de la variant `--directori`** (`wordpress-plugin/builds/directori/socdepoble.zip`), mai la carpeta `wordpress-plugin/` crua, perquè no entre cap fitxer de `languages/` ni `load_plugin_textdomain()`.

### 3. Requeriment Oficial de Kit Digital (`KD/0001622982` · `socdepoble.net`) i Diagnosi per a Sollutia
- **Documents arxivats a `_gestoria_de_poble/03_Burocracia/Kit_Digital/261030_1157_Requeriment_Aclaracions_KD_0001622982/`:**
  - `SignReport - doc_39751488.pdf` (Notificació, 30/10/2026 11:57) i `SignReport - doc_39720287.pdf` (Requeriment d'aclariments/documentació complementària de Red.es).
- **Estat de l'expedient `KD/0001622982` (Bo `2025/C022/04597139`, Solució `WP`, `2.000 €`):**
  - Els punts del primer requeriment del 20/07/2026 (`9.1.4.4` zoom i `9.4.1.2` àrees tàctils) i tota la part legal/LSSI **ja estan superats**.
  - **SOLLUTIA, S.L.** disposa de **15 dies hàbils** (fins al ~20 de novembre de 2026) per corregir **3 punts d'accessibilitat WCAG 2.1 AA a `https://socdepoble.net`** i pujar l'informe d'accessibilitat actualitzat a `https://portal.gestion.sedepkd.red.gob.es/portal/kitdigital` (*Tramitación de Acuerdos → Ampliación de documentación*):
    1. **`9.2.4.1 Evitar bloques` (Landmark `<main>`):** A la portada i pàgines normals ja hi ha `<div id="main-content" role="main" tabindex="-1">`, però a les pàgines de WooCommerce (`/botiga/` i fitxes de producte `/product/...`) `#main-content` ix sense `role="main"`.
    2. **`9.1.3.1 Información y relaciones` (`<label>` visible en desplegables `<select>`):** El desplegable d'Arxiu del peu (`#archives-dropdown-4`) té el `<label>` ocult amb `.screen-reader-text`, i el selector d'ordenació de `/botiga/` (`select.orderby`) no té `<label for>` visible.
    3. **`9.1.3.1 Información y relaciones` (Ordre seqüencial `H1-H2-H3`):** A les fitxes de producte les pestanyes del tema *Extra* pinten `<h3>Descripció</h3>` abans de `<h2>Descripció</h2>` (salt `H1 -> H3`), i a `/de-poble/` hi ha un salt d'`<h2>` a `<h4>`.
- **Comunicació amb Francis de Sollutia:** Preparat el missatge de WhatsApp terrenal i clar (sense argot d'IA, tancant les peticions d'allotjament/Supabase de setembre i octubre perquè ja ho tenim desplegat en producció i aprovat per WordPress.org, i passant-li mastegats els 3 punts de `socdepoble.net` perquè puguen presentar l'esmena i cobrar el bo). **Encara no s'ha enviat per decisió del Mestre fins a acabar les rondes del cap de setmana.**

### 4. Comunicació d'NLnet (`2026-08-1a6`) i Estratègia de Contraatac del Cap de Setmana
- **Correu rebut el 31/10/2026 a les 12:27 CET de Michiel Leenaars (Strategy Director, NLnet):** Informa que la sol·licitud d'agost (`2026-08-1a6` a *NGI Fediversity Fund*) no va entrar en la primera selecció (quan van revisar l'URL fa setmanes encara no estava desplegat el nou frontend ni aprovat el plugin a WordPress.org), però convida a escriure'ls si hi ha dubtes i conserva el projecte al radar de la xarxa NGI.
- **Decisió Estratègica del Mestre Javi:**
  - **No enviar cap correu encara a ningú.**
  - Treballar a fons tot el cap de setmana en **dues rondes consecutives**:
    1. **Ronda 1 (Dissabte):** Polir al màxim el producte, tancar les 4 portes post-commit, fer els commits de Git, **publicar en viu el plugin a l'SVN de WordPress.org (`https://wordpress.org/plugins/socdepoble`)** i actualitzar les apps d'**Apple TestFlight i Google Play Beta Testers**.
    2. **Ronda 2 (Dissabte nit / Diumenge):** Executar els **5 fronts d'alt impacte de Fediversity (`F1–F5`)** i desplegar-los a `https://socdepoble.org/page/fediversity`.
  - **Diumenge de matinada:** Enviar un correu executiu d'alt impacte a **Michiel Leenaars (`2026-08-1a6@nlnet.nl`)** exposant tot el que s'ha assolit i desplegat en aquest últim mes i mig (`wordpress.org/plugins/socdepoble` publicat i actiu, `/page/fediversity` amb Open Data i ActivityPub verificables en viu, apps a TestFlight i Google Play, i full de ruta del plugin/enxufe per a entorns Linux i servidors comunitaris).

### 5. Estat Real Verificat de les Botigues Mòbils (TestFlight i Google Play Beta)
- **Apple App Store (TestFlight):** El Mestre ja té l'app pujada a App Store Connect i instal·lada al seu iPad via TestFlight; les actualitzacions es pugen via UI d'Xcode (`Product → Archive → Distribute App`).
- **Google Play Store (Pista de Beta Testers):** El Mestre ja disposa de l'enllaç de descàrrega de Google Play per a testers (actualment amb 4 testers actius); les actualitzacions es pugen via Android Studio (`Build → Generate Signed App Bundle`).
- Executat `node scripts/botigues/preflight.mjs --plataforma totes --signa`: entorn local verificat.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Punt Exacte del Cursor (Full de Ruta per al Nou Xat de Dissabte 31-10)
1. **Ronda 1 (Prioritat Immediata al Nou Xat) — Portes Post-Commit, Git, Publicació SVN a WordPress.org i Botigues Mòbils:**
   - Llançar a Claude Opus 5.5 la **Fase 0** del prompt `_wiki_de_poble/04_escriptori/261031_0136_prompt_dissabte_fediversity_deploy_i_botigues.md`:
     * Tancar les 4 portes pendents del cens (`Reflex`, `Nomenclatura N1`, `Pedra Seca`, `Tokens`) i executar els 3 commits partits de Git (`<= 13 MB`) + `git push`.
     * Compilar la variant `--directori` (`v1.1.10`) i fer el primer `svn commit` oficial a `https://plugins.svn.wordpress.org/socdepoble` (`trunk/`, `tags/1.1.10/`, `assets/`) perquè la pàgina `https://wordpress.org/plugins/socdepoble` quede activa amb descàrrega immediata.
     * Actualitzar `/page/descarregues` i `/page/fediversity` amb l'aprovació oficial de WordPress.org, i pujar les noves builds (`1.0.0 (2)`) a **Apple TestFlight** i **Google Play Beta Testers**.
2. **Ronda 2 (Segona Ronda d'Auditoria del Cap de Setmana) — Els 5 Fronts de Sobirania Digital i Fediversity (`F1–F5`):**
   - Executar la **Fase 1** del prompt `_wiki_de_poble/04_escriptori/261031_0136_prompt_dissabte_fediversity_deploy_i_botigues.md`:
     * **F1 (Partida 3):** Botó real «Descarregar paquet Open Data del poble» en cada fitxa `/pobles/<slug>` connectat a `exportaMunicipiOpenData(slug)`.
     * **F2 (Partida 3):** ActivityPub estàtic (`/ap/outbox/<slug>.json` i `/ap/objectes/<slug>/<id>.json`) alimentat amb les publicacions reals de cada municipi, més `/.well-known/nodeinfo`, `/nodeinfo/2.1.json` i identificador federat visible a `/pobles/<slug>`.
     * **F3 (Partida 4):** Instal·lador reproduïble `tooling/instalador/inicia-node-germa.mjs` (amb `flake.nix` i tests) perquè `/page/fediversity` deixe de dir «L'instal·lador: no existix».
     * **F4 (Partida 1):** Documentació pública del Port Neutral (`CONTRACTE_NUCLI`), kit de conformitat i requisits d'allotjament Model B enllaçada des de `/page/fediversity`.
     * **F5 (Partida 2):** Extensió d'`IDEA-58` (`navegacioTeclat.js`: fletxes `Up/Down/Home/End`) a `Pobles`, `Mur`, `Multimèdia`, `Notes` i `Consola`.
   - Fer `npm run build` i desplegar de nou a `https://socdepoble.org`.
3. ** Comunicacions Externes (Diumenge de Matinada / Dilluns, quan Ronda 1 i Ronda 2 estiguen en viu):**
   - **A Michiel Leenaars (`NLnet`, `2026-08-1a6@nlnet.nl`):** Enviar el correu amb totes les evidències en viu (`wordpress.org/plugins/socdepoble`, `socdepoble.org/page/fediversity`, TestFlight/Google Play i el pla del plugin per a Linux/servidors locals).
   - **A Francis de Sollutia (WhatsApp + PDFs `doc_39720287.pdf` i `doc_39751488.pdf`):** Enviar el missatge amb els 3 punts d'accessibilitat WCAG 2.1 AA de `socdepoble.net` per a presentar l'ampliació del Kit Digital (`KD/0001622982`) abans dels 15 dies hàbils.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261031_0136_pla_implementacio_assalt_fediversity_deploy_i_botigues]]
- [[261031_0136_prompt_dissabte_fediversity_deploy_i_botigues]]
