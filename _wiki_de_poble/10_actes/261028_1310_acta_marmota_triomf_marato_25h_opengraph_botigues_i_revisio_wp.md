---
type: acta
status: canonic
description: Acta Marmota de coronació de la marató de 25+ hores de treball artesanal del Mestre Javi Llinares, commit canònic e4c4e076c (P1-61 Fase 1, T1-06 i P1-55), resolució de la revisió de WordPress.org amb verificació DNS TXT a SiteGround, nou paquet net a _builds_de_poble i tancament d'honor de l'eixam.
tags:
  - acta
  - marmota
  - telemetria_huma
  - opengraph
  - wordpress
  - botigues
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
| Versió del document | 1.0.0 |
| Data | 2026-10-28T13:10:00+01:00 |
| Propietari | IAIA MarIA (Secretària Tècnica & Orquestradora) |
| Aprovació humana | Dictada i aprovada pel Mestre Javi Llinares en àudios i captures |
| Model IA | Antigravity (IAIA MarIA) + Claude Opus 5.5 + GPT-6.1 Codex + Gemini 4 Argon |
| Branca | `backup-notes-publish` |
| Commit canònic | **`e4c4e076c`** (`feat(og,natiu,xat): P1-61 Fase 1 (imatge social), T1-06 i P1-55`) |

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
  - Mogut el nou paquet net de 2,8 MB (2.911.541 B) a `_builds_de_poble/wordpress/socdepoble.zip` i `261027_1157_wordpress_directori_v1.1.9.zip`.
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

### 5. 🍏 Blindatge Natiu d'Apple (`T1-06`)
- Depurades mencions a Google Play i Android en entorns d'App nativa iOS a `legalContent.js` i `pageContent.js`.

---

## 3. Bateria de Proves i Commit Canònic

- **Commit segellat:** `e4c4e076c` (34 fitxers).
- **Proves:** `test:precommit` en verd absolut (**3.318 Vitest i 262 Node tests passats, 0 fallades**).
- **Porta Olivera:** Exit 0 (Escriptori net i sincronitzat).

---

## 4. Relleu per a la Propera Sessió

1. **Desplegament a Producció (`firebase deploy`):** Compilar la SPA amb el commit `e4c4e076c` i desplegar a Firebase Hosting perquè `socdepoble.org/xat` mostre immediatament la Pàgina Viva de Comunitats.
2. **Consolidar P1-54 i Bloc 3:** Fer el commit de la neteja de botons d'accés al xat (`P1-54`) i de la Consola Termodinàmica / Maquinària un cop validats.
3. **Tràmit WordPress.org:** Comprovar la propagació del DNS TXT i respondre al correu de WordPress.org adjuntant el nou zip sanejat de `_builds_de_poble/wordpress/socdepoble.zip`.
4. **Fase 2 d'OpenGraph:** Generar els fitxers estàtics `dist/<ruta>/index.html` durant el postbuild per al crawler de WhatsApp.

---

## Vincles
- [[00_index]]
- [[261027_0805_acta_marmota_triomf_umami_gauntlet_r5_i_protocol_guarda_nocturna]]
