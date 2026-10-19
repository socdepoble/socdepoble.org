---
type: document
status: esborrany
description: Pla d'implementació per a l'optimització d'imatges a WebP, reducció del paquet de WordPress i preservació d'arxiu visual
tags:
  - implementacio
visibility: private
reflex: sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:174278e9-d930-4349-9152-11828ff11380
---
# Alliberament del paquet multimèdia i conversió a WebP

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0e4ba9fa-308c-4741-b17d-703712ab7b9e:174278e9-d930-4349-9152-11828ff11380 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T14:25:00+02:00 |
| Modificació | 2026-10-19T14:27:00+02:00 |
| Propietari | IAIA MarIA (Antigravity) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA / Gemini 3.8 Flash) |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-19T14:25:00+02:00: Creació de l'esborrany canònic del pla per indicació expressa del Mestre a la represa de la vesprada.
- 2026-10-19T14:27:00+02:00: Formalització de l'anàlisi de pes, diagnosi del cens de 135 MB d'imatges a `public/assets/`, estratègia de conversió a WebP i alliberament de l'estructura del paquet de WordPress.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **Pes de `public/`:** El cens executat amb `tooling/media/optimitzar_webp.mjs cens` revela que `public/` conté **219 imatges** amb un volum total de **134.9 MB**.
- **Concentració en actius pesants:** Hi ha **125 imatges candidates** a WebP (PNG/JPEG > 300 KB o > 1600 px) que acumulen **122.8 MB** (el 91% del total). Exemples crítics:
  - `DSC00410.JPG` (6.6 MB, 3648×2736 px).
  - `DSC00320.JPG` (6.1 MB, 3648×2736 px).
  - `0-container.png` (3.2 MB, 1920×1080 px).
  - `P_20161028_150735.jpg` (2.0 MB) i `3-content.png` (2.0 MB).
- **Impacte en rendiment real (Lighthouse gentdelatorre.net):**
  - **FCP = 0.8 s** (l'esquelet React/CSS arrenca a l'instant, confirmant la lleugeresa de l'arquitectura de client).
  - **LCP = 9.9 s** (bloquejat per la descàrrega i descompressió al navegador de fotografies històriques massives).
- **Impacte en distribució de WordPress:**
  - El límit oficial per a pujar connectors al directori de WordPress.org (`wordpress-plugin/eines/empaqueta.mjs` · `LIMIT_DIRECTORI`) és de **10 MB**.
  - El paquet `wordpress_enxufe_v1.1.7.zip` actual pesa ~135 MB perquè Vite copia indiscriminadament `public/assets/uploads/` dins de `dist/`.
- **Eines disponibles al Mas:**
  - Disposem del tractor canònic `tooling/media/optimitzar_webp.mjs` amb dos codificadors operatius: `maquinaria` (Python 3 + Pillow, conserva metadades EXIF com GPS i data) i `chrome` (Google Chrome headless per a PNGs amb transparència).

### 2. Directrius del Mestre i Decisions Arquitectòniques
1. **Dimensions i integritat:** Tal com ha ordenat el Mestre, **no es retallen les imatges**; es manté la relació d'aspecte original intacta, limitant el costat llarg a un màxim de 1600 px (sense ampliar mai cap imatge) i aplicant compressió WebP d'alta fidelitat (qualitat 80-84).
2. **Alliberament del paquet multimèdia (Estructura vs Contingut):**
   - **Estructura i interfície:** Tots els elements de la UI (vinyetes, logotips, icones, esquelet) romanen a `public/assets/` convertits a WebP (~2-3 MB en total).
   - **Contingut pesant d'arxiu i comunitat (`assets/uploads/`):**
     * En producció/distribució WordPress, el contingut pesant se servix directament des de Supabase Storage o CDN extern de Sóc de Poble (Llei de l'Enxufabilitat §8).
     * S'actualitza `vite.standalone.config.js` i `wordpress-plugin/eines/empaqueta.mjs` perquè la variant de distribució del directori no embosse el ZIP amb 130 MB de fotos locals, complint el `LIMIT_DIRECTORI = 10 * 1024 * 1024`.

### 3. Canvis Proposats (Proposed Changes)

#### [Acció: EXECUTE] `tooling/media/optimitzar_webp.mjs`
- Executar la conversió sistemàtica de totes les imatges candidates de `public/assets/` a `.webp` mantenint la proporció original, costat llarg màxim de 1600 px, i qualitat 84 (amb `maquinaria` per a JPEG preservant EXIF, i `chrome` per a PNG).

#### [Acció: MODIFY] `src/sections/multimedia/censImatges.js` i `censImatges.test.js`
- Adaptar el cens i les proves unitàries per reconèixer tant els originals com les seues versions bessones `.webp`, evitant que la presència de fitxers `.webp` novament generats faça fallar la suite de Vitest.

#### [Acció: MODIFY] `src/sections/multimedia/DetailMultimedia.jsx` i components de renderitzat
- Assegurar que els components prioritzen la càrrega de la versió `.webp` existent amb fallback automàtic a la versió original JPG/PNG.

#### [Acció: MODIFY] `vite.standalone.config.js` i `wordpress-plugin/eines/empaqueta.mjs`
- Excloure de la compilació del connector de WordPress (`build:wp:directori`) les carpetes pesades de contingut d'arxiu que ja estiguen a Supabase Storage, garantint que el ZIP resultant ocupe menys de 10 MB (`LIMIT_DIRECTORI`).

#### [Acció: MODIFY] `src/components/universal/richText/` i `UniversalToolbar.jsx` (Editor TipTap / Google Docs Style)
- Reordenar la jerarquia d'encapçalaments: situar `Heading3` (H3) com a primera opció a la barra per davant d'`Heading2` (H2).
- Afegir suport i botó per a llistes numerades (`ListOrdered` de Lucide / `toggleOrderedList`).
- Convertir l'àrea d'edició en un autèntic llenç continu (`.sdp-editor-full-canvas`) amb `min-height: 480px`, `padding-bottom: 25vh`, `cursor: text` i gest de focus automàtic `editor.commands.focus('end')` en fer clic a qualsevol punt del full blanc, permetent redactar amb llibertat sense sentir-se engabiat en una línia.

#### [Acció: MODIFY] `src/sections/notes/` i `src/sections/profile/` (Selector d'Emojis en Pàgina de Workspace)
- Suprimir la finestra flotant / modal (`Dialeg`) per al selector d'emojis.
- Implementar la vista d'emojis com una pàgina/subvista dedicada dins de la columna de treball del Workspace (`PaginaEmojis`), tant per a Notes com per al Perfil d'usuari, amb botó gran i clar de tornada («Tornar»).
- Ajustar la mida i proporció dels botons a la graella perquè l'emoticona en siga la protagonista visual neta.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Simulació prèvia (Dry run):**
   ```bash
   node tooling/media/optimitzar_webp.mjs converteix public/assets --max 1600 --qualitat 84
   ```
2. **Aplicació controlada:**
   ```bash
   node tooling/media/optimitzar_webp.mjs converteix public/assets --max 1600 --qualitat 84 --aplica
   ```
3. **Verificació de la suite de proves:**
   ```bash
   npx vitest run src/sections/multimedia/censImatges.test.js
   npm test
   ```
4. **Verificació de l'empaquetat:**
   ```bash
   npm run build:wp
   npm run build:wp:directori
   ```
5. **Auditoria de linting i portes:**
   ```bash
   npm run lint
   npm run porta:olivera
   ```

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Trencament de tests del Visor (`censImatges.test.js`):** El test exigeix que cada imatge ràster siga a `CENS_IMATGES` o `EXCLOSES`. Cal actualitzar el test i el cens per a les noves extensions WebP.
2. **Regressió en URLs estàtiques:** Fitxers que referencien literalment `.jpg` o `.png` necessiten o bé mantenir l'arxiu original durant la transició, o utilitzar la resolució d'origen d'imatge.
3. **Transparències i canals alfa:** Els PNG han de passar per `chrome` i no per scripts bàsics de Python per evitar fons negres en pèrdua d'alfa.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261019_1345_acta_marmota_relleu_migdia_seguretat_i_wp]]

