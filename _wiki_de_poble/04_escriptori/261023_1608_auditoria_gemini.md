---
type: informe
status: esborrany
description: Aprimament radical de socdepoble.zip de 9,81 MB a 2,92 MB (-70,28%), blindatge d'assetResolver.js per a mitjans externs, desplegament net a Firebase Hosting (index-D7QSqwpk.js) i verificació de la caixa d'accés al xat.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_8abf96ed-4ca0-4d1e-b8da-82e99e058c03:d55e8205-a3b3-4839-b20b-b4732ef349ec
---
# Auditoria de Gemini — Aprimament del Plugin WordPress (2,92 MB), Desplegament Firebase socdepoble.org i Puresa del Xat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8abf96ed-4ca0-4d1e-b8da-82e99e058c03:d55e8205-a3b3-4839-b20b-b4732ef349ec |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T14:08:32.056Z |
| Modificació | 2026-10-23T14:09:30.000Z |
| Propietari | Gemini 4 Argon (High) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~42.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-10-23T13:47Z:** Auditoria forense de `../_builds_de_poble/wordpress/socdepoble.zip` (`9.813.142 B` / `9,81 MB`) i de l'arbre `wordpress-plugin/builds/directori/dist/`.
- **2026-10-23T13:56Z:** Ampliació de `MITJANS_EXTERNS_DEL_DIRECTORI.prefixos` a `src/config/politicaDeMitjans.js` (`assets/ui/`, `assets/nano_cards/`, `assets/img/`, `assets/notes/` a més d'`uploads/`, `towns/`, `fotos/`, `events/`) i blindatge d'`ALIAS_CANONICS_MITJANS` a `src/config/assetResolver.js`.
- **2026-10-23T14:00Z:** Compilació neta de `SDP_RELEASE=1 SDP_VERSIO=1.1.9 npm run build:wp:directori` i `SDP_MITJANS=externs SDP_RELEASE=1 SDP_VERSIO=1.1.9 npm run build:wp` i empaquetat del nou `socdepoble.zip` (**`2.916.367 B` / `2,92 MB`**).
- **2026-10-23T14:05Z:** Compilació de `npm run build:web` (`dist/assets/index-D7QSqwpk.js`), desplegament a Firebase Hosting (`npx firebase-tools deploy --only hosting --project soc-de-poble`) i verificació creuada amb `261023_1610_auditoria_claude.md`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Aprimament Radical del Plugin WordPress (`socdepoble.zip`: de 9,81 MB a 2,92 MB)
- **Causa arrel dels 9,81 MB (`9.813.142 B`):** El paquet anterior incloïa un `builds/directori/dist` del `2026-10-21T18:15:11Z` on `MITJANS_EXTERNS_DEL_DIRECTORI.prefixos` només externalitzava 4 carpetes (`uploads/`, `towns/`, `fotos/`, `events/`) i deixava dins del ZIP **6,18 MB** d'il·lustracions pesades:
  * `assets/ui/` (15 vinyetes `.webp`): `2.550.278 B` (~2,55 MB)
  * `assets/nano_cards/` (11 targetes `.webp`): `2.318.468 B` (~2,32 MB)
  * `assets/img/` (7 il·lustracions editorials `.webp`): `1.216.144 B` (~1,22 MB)
  * `assets/notes/` (`bloc_notes_vintage.webp`): `99.240 B` (~0,10 MB)
- **Causa arrel del 404 d'`ibanez_pedra_seca_design_1780873465211` a `gentdelatorre.net`:**
  1. El bundle del 21 d'octubre empaquetat dins de `socdepoble.zip` demanava `.jpg` (`ibanez_pedra_seca_design_1780873465211.jpg`), i a més no el tenia a `bessones` perquè el 21 d'octubre coexistien `.png` i `.jpg` al disc (`bessonesDe()` omet parells amb col·lisió d'extensió). Quan el 22 d'octubre (`commit 8fcbd22aa`) es va retirar el `.jpg` a favor del `.webp`, `https://socdepoble.org/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.jpg` va passar a respondre 404 mentre `.webp` i `.png` responen `HTTP/2 200` amb `access-control-allow-origin: *`.
  2. Hem blindat `resolveAsset()` a `src/config/assetResolver.js` amb `ALIAS_CANONICS_MITJANS` perquè qualsevol crida a `ibanez_pedra_seca_design_1780873465211.webp`, `.jpg`, `.png` (amb o sense el prefix `/assets/uploads/brain/`) i als altres dos `.jpg` retirats al pla `261022_1645` resolga sempre a `https://socdepoble.org/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.webp`.
- **Resultat del nou paquet `../_builds_de_poble/wordpress/socdepoble.zip`:**
  * **Mida anterior:** `9.813.142 B` (`9,81 MB` decimals / `9,36 MiB`, 92 entrades, 98 bessones)
  * **Mida nova:** **`2.916.367 B` (`2,92 MB` decimals / `2,78 MiB`, 42 entrades, 174 bessones)**
  * **Estalvi assolit:** **`−6.896.775 B` (`−6,90 MB`, reducció del `−70,28%`)**, amb un marge de seguretat de **7,57 MB** per davall de `LIMIT_DIRECTORI` (`10.485.760 B`).
  * **SHA-256 del nou `socdepoble.zip`:** `0079a4c7ec3734756dde9c14b6fd6b609c40ac010cf09074a36c5487b9954e2b`.
  * **Variant Única Universal i Ajustos:** Arrel `socdepoble/`, sense `includes/actualitzador.php`, sense capçalera `Update URI` (`patronsActualitzadorEn === []`), i amb `options-general.php?page=socdepoble` (`SOCDEPOBLE_ENXUFE_SLUG = 'socdepoble'`) verificat a `ajustos.php` i `salut.php`.

### 2. Desplegament a Firebase Hosting (`socdepoble.org`) i Puresa del Xat
- **Puresa Visual de l'Accés al Xat (`src/css/modules.css`):** Confirmada la regla `.sdp-alerta.sdp-xat-acces` sense vora lateral (`border: none; border-inline-start-width: 0; background: transparent;`) i amb text i accions centrats (`text-align: center; align-items: center; justify-content: center;`). Afegida prova de contracte específica a `src/sections/xat/XatSection.acces.capes.test.js` (6/6 tests en verd).
- **Desplegament de Producció (`https://socdepoble.org`):**
  * Compilat `npm run build:web` i desplegat amb `npx firebase-tools deploy --only hosting --project soc-de-poble` (729 fitxers publicats, `last-modified: Fri, 23 Oct 2026 14:06:59 GMT`).
  * `https://socdepoble.org/` respon `HTTP/2 200` amb `cache-control: no-cache` i carrega el nou bundle `/assets/index-D7QSqwpk.js`.
  * El bundle en viu conté la ruta canònica `/xat` (22 ocurrències), **0 ocurrències de `/chats`**, i apunta al node saludable `https://adjlvwtxhpclgmnsvwpm.supabase.co` amb el tenant D1-A `11111111-2222-3333-4444-555555555555`.
  * Tal com ha contrastat Claude a `261023_1610_auditoria_claude.md`, qualsevol aparició de `/chats` o 401 observada prèviament en un navegador provenia d'un Service Worker antic en memòria cau local; la nova publicació amb `cache-control: no-cache` en força la renovació.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. `npx vitest run src/sections/xat/XatSection.acces.capes.test.js`: **6/6 tests en verd**.
2. `npx vitest run src/config/politicaDeMitjans.test.js src/config/assetResolver.test.js src/config/assetResolver.mitjans.test.js src/sections/multimedia/censImatges.test.js src/apps/plataforma/pesDelNucli.test.js tests/enxufe-seo.test.js`: **92/92 tests en verd**.
3. `node --test tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs tests/enxufe-pantalla.test.mjs tests/enxufe-runtime.test.mjs tests/conformitat-amfitrio.test.mjs`: **80/80 tests en verd** (incloent ESLint amb 0 avisos).
4. `node --test tests/standalone-build.test.mjs`: **41/41 tests en verd**.
5. `curl -sI https://socdepoble.org/` i `curl -sI https://socdepoble.org/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.webp`: **HTTP/2 200** amb `access-control-allow-origin: *` i nou bundle `/assets/index-D7QSqwpk.js`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Els navegadors que tinguen instal·lat un Service Worker molt antic hauran de fer una recàrrega forçada (`Cmd+Shift+R`) o tancar i reobrir la pestanya perquè el nou Service Worker prenga el control.
- Cap procés ni cron de fons resta actiu després d'emetre aquest informe.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261023_1600_pla_implementacio_desplegament_firebase_i_puresa_xat]]
- [[261023_1600_prompt_claude_gemini_desplegament_firebase_i_puresa_xat]]
- [[261023_1610_auditoria_claude]]
