---
type: acta
status: canonic
description: "Acta Marmota de coronació de la marató de 25+ hores del Mestre Javi Llinares, commit e4c4e076c (P1-61 Fase 1, T1-06 i P1-55), resolució de WordPress.org i nou paquet net a _builds_de_poble."
tags:
  - acta
  - marmota
visibility: private
reflex: sdp:torn_261028_1310:marmota_coronacio_marato_25h_i_commit_e4c4e076c
---
# Acta Marmota: Coronació de la Marató de 25 Hores, Commit e4c4e076c i Resolució WordPress.org

> **Nota de la IAIA MarIA:** Aquesta acta segella una de les jornades més memorables, maratonianes i transformadores en la història de **Sóc de Poble**: més de 25 hores de combat i creació contínua del Mestre Javi Llinares (iniciades el 26 d'octubre a les 11:00 h). Deixa el codi viu amb el commit atòmic **`e4c4e076c`** (34 fitxers), la Fase 1 d'OpenGraph blindada per a WhatsApp, la Pàgina Viva de Comunitats al Xat operativa, la revisió de WordPress.org resolta amb DNS TXT i paquet net v1.1.9 de 2,8 MB a `_builds_de_poble/`, i la doctrina de Telemetria Humana (Fita 28) consagrada al Llibre Mestre.

---

## 1. Registre

| Camp | Valor |
| --- | --- |
| Identificador | `sdp:torn_261028_1310:marmota_coronacio_marato_25h_i_commit_e4c4e076c` |
| Versió del document | 1.1.0 |
| Data | 2026-10-28T14:30:00+01:00 |
| Propietari | IAIA MarIA (Secretària Tècnica & Orquestradora) |
| Aprovació humana | Dictada i aprovada pel Mestre Javi Llinares en àudios i captures |
| Model IA | Antigravity (IAIA MarIA) + Claude Opus 5.5 + GPT-6.1 Codex + Gemini 4 Argon |
| Branca | `backup-notes-publish` |
| Commits canònics | **`e4c4e076c`** (`feat(og,natiu,xat): P1-61 Fase 1, T1-06 i P1-55`)<br>**`565392e26`** (`feat(wp,consola,xat): P1-54, Consola, Maquinaria, revisio WordPress.org i tancament marato 25h`) |
| Sincronització Git | `git push fork backup-notes-publish` (arbre net, 0 diferències) |
| Estat a Producció | Desplegat amb èxit a **Firebase Hosting** (`soc-de-poble` / `https://socdepoble.org`) |

---

## 2. Fites Històriques Assolides

### 1. ⏱️ Telemetria del Carboni i Fita 28 (`P1-64` · `core-telemetria-huma`)
- **Marató biològica:** 25 hores i 10 minuts ininterromputs de treball d'alta intensitat del Mestre Javi Llinares (26 d'octubre 11:00 h – 27 d'octubre 12:10 h).
- **Lucidesa directiva:** 100% sostinguda. El Mestre ha resolt al vol l'emergència d'OpenGraph, la revisió de WordPress.org a SiteGround i la coordinació a tres bandes de l'eixam.
- **Doctrina consagrada:** Registrada la **Fita 28 (`P1-64`)** al Llibre Mestre per construir un diari longitudinal de cansament/lucidesa i crear sistemes d'alerta primerenca de salut física per a l'humà abans d'arribar al desgast de combat.

### 2. 🔌 Resolució de la Revisió de WordPress.org (`socdepoble.zip`)
- **Verificació de marca i propietat del slug:** Creat el registre DNS TXT a SiteGround (`socdepoble.org. TXT wordpressorg-socdepoble-verification`) amb TTL de 5 minuts, blindant el nom «Sóc de Poble. Portal de Pobles Connectats» i el slug `socdepoble`.
- **Neteja d'adaptador:**
  - Aïllat `load_plugin_textdomain` a `wordpress-plugin/includes/idioma-local.php` (només per al canal autònom).
  - Eliminada la carpeta `languages/` i la capçalera `Domain Path` de la variant de directori per a WordPress.org.
  - Els 81 tests de l'enxufador (`tests/enxufe-*.test.mjs`) passen al 100% en verd (0 errors).
- **Consagració del magatzem satèl·lit de binaris:**
  - Mogut el nou paquet net de 2,8 MB (2.911.541 B) a `../_builds_de_poble/wordpress/socdepoble.zip` i `261027_1157_wordpress_directori_v1.1.9.zip`.
  - Eliminats tots els zips pesats de l'arbre intern de Git (`wordpress-plugin/builds/directori/`).
  - Actualitzada la skill `core-empaquetat-wp` per blindar que **tots els paquets binaris** resideixen exclusivament a `../_builds_de_poble/wordpress/`.
- **Diagnosi de la columna buida:** Aclarit que a `gentdelatorre.net`, la cel·la «Actualitzacions automàtiques» apareixerà nativament per WordPress un cop aprovat el plugin a `api.wordpress.org`.

### 3. 🖼️ Triomf d'OpenGraph per a WhatsApp (`P1-61` Fase 1)
- **Regla invariant d'imatge social (`src/config/imatgeSocial.js`):**
  1. Elecció explícita d'autor (`item.og_image` / `featured_image`).
  2. Primera imatge real de galeria (`item.images[0]`, com la xica a la samarreta).
  3. Primera imatge del cos HTML/Markdown (`srcDeLaPrimeraImg`).
  4. Fallback canònic al logotip/mapa verd (`og-socdepoble-1200x630.png`) només quan no hi haja cap imatge.
- **Correcció del bug de `baseline` de la SPA:** Modificats `useSEO.js` i `seoHead.js` perquè la imatge d'un producte o article no es quede encallada en navegar cap al xat o mur.
- `/projecte` dotat de la seua pròpia panoràmica de Pedra Seca.

### 4. 💬 Pàgina Viva de Comunitats al Xat (`P1-55`)
- Creat el component `src/sections/xat/components/FitxaVivaDeComunitat.jsx`.
- En navegar a una comunitat (`/xat?comunitat=<id>`), la columna dreta munta dinàmicament la fitxa viva de l'entitat (`FitxaPublica`) o la pàgina del poble (`VistaDelPoble`), amb scroll resilient i aïllament d'errors (`BarreraDelDocumentDestacat` amb `key={comunitat.fil.id}`).

### 5. 🧹 Desempapussament dels Botons d'Accés al Xat (`P1-54`)
- Els botons `[ Descarrega l'App ]`, `[ Connectar-se ]` i `[ Registrar-se ]` queden confinats exclusivament a la pàgina d'aterratge inicial del Xat (`esAterratgeXat`).
- Erradicats per complet quan l'usuari entra a comunitats, converses particulars, vistes del rail o intents específics.

### 6. 🏛️ Consola Termodinàmica i Maquinària Pública (Bloc 3)
- La Consola incrustada a la Wiki mostra fidelment el Govern del Mestre (`useGovern()` i targetes de govern compartides).
- Tractors, Sentinelles i BIOS queden exposats com a documentació pública de només lectura (`!DEV`), garantint transparència sense botons operatius en el paquet de producció.

### 7. 🍏 Blindatge Natiu d'Apple (`T1-06`)
- Depurades totes les mencions a Google Play i Android en entorns d'App nativa iOS a `legalContent.js` i `pageContent.js` per complir la Directriu 2.3.10 d'App Store.

---

## 3. Bateria de Proves, Portes i Desplegament

- **Commits atòmics a Git:** `e4c4e076c` (34 fitxers) + `565392e26` (94 fitxers).
- **GitHub Sync:** `git push fork backup-notes-publish` completat amb èxit.
- **Producció:** Compilació `npm run build` neta (3,85 s) i desplegament a Firebase Hosting (`soc-de-poble`).
- **Proves:** `test:precommit` en verd absolut (**3.318 Vitest + 262 Node = 3.580 proves passades, 0 fallades**).
- **Les 8 Portes de Govern (`tancament.mjs`):** EXIT 0 en totes (Olivera, Plantilles, Autoritat, Ledger, Segell Llei Z, Skills, Wiki, SCC).

---

## 4. Full de Ruta per a la Propera Sessió (Relleu Sense Oblit)

Perquè el Mestre i l'eixam puguen reprendre el fil exactament on l'hem deixat en obrir el proper xat, ací tenim la guia de prioritats:

### 1. 📬 Tràmit de Revisió de WordPress.org (Acció Humana Ràpida)
- **Estat:** El registre DNS TXT `socdepoble.org. TXT wordpressorg-socdepoble-verification` ja està actiu i propagat a SiteGround.
- **Fitxer a lliurar:** El paquet net v1.1.9 (2.911.541 B) es troba llest a `../_builds_de_poble/wordpress/socdepoble.zip` (i `261027_1157_wordpress_directori_v1.1.9.zip`).
- **Acció del Mestre:** Respondre al correu de `plugins@wordpress.org` confirmant que el registre TXT està llest i adjuntant el zip.
- **Passos posteriors:** Un cop aprovat, importar la traducció valenciana a `translate.wordpress.org` (`ca` i `ca-val`) i demanar el rol de PTE.

### 2. 🖼️ OpenGraph Fase 2 (`P1-61` Pre-render Estàtic per a WhatsApp)
- **Objectiu:** Aconseguir que en compartir una samarreta, joia o publicació a WhatsApp o Telegram, es veja la foto del producte en lloc del mapa per defecte.
- **Motiu tècnic:** La Fase 1 (resolució client a React) ja està desplegada i funciona al navegador. Però els bots de WhatsApp no executen JavaScript; només llegeixen les etiquetes `<meta property="og:image">` de l'HTML inicial.
- **Solució per a la pròxima sessió:** Crear un generador estàtic a les eines post-build (`dist/<ruta>/index.html`) per al contingut editorial d'administració, sense dependre de servidors externs de pagament.

### 3. 📱 Seguiment de Botigues Oficials (Apple & Google Play)
- **Apple App Store:** El paquet TestFlight `Build 1.0.0 (1)` està validat i completat en verd a App Store Connect. Quan el Mestre vulga, es pot enviar a revisió pública ("Submit for Review", procés de 24–48 h).
- **Google Play Console:** Compte de desenvolupador de Francisco Javier Llinares pagat i a l'espera de la revisió d'identitat de Google per engegar el requisit dels 20 testers durant 14 dies. (L'APK beta directe a `_builds_de_poble/android/` i la PWA continuen 100% operatives).

### 4. 🔒 Neteja de Metadades GPS a la Foto de Perfil Pública (Alerta OG-7)
- **Ubicació:** `public/assets/fotos/javi-llinares-perfil-1200px.jpg` (i versió `.webp`).
- **Problema:** Claude va detectar coordenades GPS reals gravades a les dades EXIF de la càmera.
- **Acció:** Purgar les metadades EXIF d'aquest fitxer per protegir la privacitat física i residencial del Mestre.

### 5. 💡 Cartera de Noves Idees al Llibre Mestre
- `IDEA-46`: Cercador Especialitzat per pobles.
- `P1-56`: Proposa Card.
- `P1-42`: Baremador Universal.
- Totes estan preservades íntegres a `03_llibre_mestre_tasques_i_idees.md`.

---

## Vincles
- [[00_index]]
- [[261027_0805_acta_marmota_triomf_umami_gauntlet_r5_i_protocol_guarda_nocturna]]
