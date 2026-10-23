---
type: document
status: esborrany
description: Pla d'implementació per a la conversió a WebP, blindatge de pujades al client, activació del fallback de bessones a main.jsx i desplegament
tags:
  - implementacio
visibility: private
reflex: sdp:torn_651710eb-f443-4aeb-a934-562596927f81:5fecb1b1-02eb-4a76-9483-51e345aa5987
---
# Transició Integral a WebP i Xarxa de Salvavides de Bessones

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_651710eb-f443-4aeb-a934-562596927f81:5fecb1b1-02eb-4a76-9483-51e345aa5987 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T14:45:47.075Z |
| Modificació | 2026-10-22T14:45:47.075Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-22T14:45:47.075Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **404 a Producció (`socdepoble.org`):** El codi desplegat a Firebase demana `.webp` per la política de bessones, però els fitxers `.webp` generats a la Fase 2 local no s'havien desplegat encara a Firebase Hosting (`curl -I https://socdepoble.org/assets/fotos/javi-llinares-perfil-1200px.webp` torna 404, mentre que `.jpg` torna 200).
- **Directriu del Mestre (Àudio 261022_1637):** «Ara que tenim poques imatges és el moment de fer-ho bé: canviar tots els enllaços a webp, assegurar-se que estan a disc, i que qualsevol imatge que entre al sistema desaparega com a jpeg i es convertisca en webp. El fallback és un salvavides invisible per si de cas».
- **Estat de Supabase `app_content`:** UPDATE executat amb èxit pel Mestre (`version = 250035` a `agents`, `events`, `marketItems`, `notes`, `pages`, `towns` amb rutes `.webp`). Resta pendent només la clau fòssil `noteNotes`.
- **Estat de Taules Remotes:**
  - `public.bloquejos`: Taula viva de moderació i seguretat (migració `2610201500`). Està buida perquè cap usuari ha bloquejat a ningú encara. **Canònica i intocable**.
  - `public.consentiments`: Taula viva RGPD. El camp `text_sha256` és NULL en v1 perquè la política era un URL sense text inline; el CHECK constraint ho permet expressament. **Canònica i intocable**.
  - `public.conversations` i `public.messages`: Taules fòssils en anglès d'un prototip antic. El xat autèntic viu a `xat_fils` i `xat_missatges`. **Candidates a purga (DROP TABLE)** junt amb `duels_nodes` i `user_realms`.

### 2. Canvis Concrets de Codi

#### Tasca 1: Conversió d'imatges locals a WebP
- Executar el tractor de mitjans existent:
  `node tooling/media/optimitzar_webp.mjs converteix public/assets/img/*.jpg public/assets/fotos/*.png public/assets/towns/*/*.jpg --aplica`
- Assegurar que cada recurs d'imatge a `public/` té la seua bessona `.webp` física al costat de l'original.

#### Tasca 2: Blindatge del canal d'entrada a `src/utils/pujadaImatge.js`
- Modificar o assegurar que la funció de pujada comprimeix i converteix directament a `image/webp` (Canvas `toBlob('image/webp', 0.82)`) abans d'enviar el fitxer a Supabase Storage (`storage.from('media').upload(...)`).
- Normalitzar l'extensió del fitxer de sortida a `.webp`. Cap nou fitxer JPEG ni PNG podrà entrar a Supabase Storage.

#### Tasca 3: Activació del Fallback de Bessones a `src/main.jsx`
- Importar `instalaFallbackDeBessones` des de `src/config/fallbackBessones.js`.
- Cridar `instalaFallbackDeBessones(document.body)` a l'inici de l'aplicació autònoma.
- Així, si una imatge no es troba en `.webp`, el navegador fa un intent automàtic amb la seua bessona (`.jpg` o `.png`) i emet un avís a la consola (`console.warn`) per alertar de la falta, evitant errors visuals d'imatge trencada.

#### Tasca 4: Neteja d'`app_content` i Purga de Fòssils a Supabase
- Executar SQL a Supabase per eliminar la clau morta `noteNotes`:
  `DELETE FROM public.app_content WHERE key = 'noteNotes';`
- Executar el DROP de les taules fòssils restants:
  `DROP TABLE IF EXISTS public.conversations, public.messages, public.duels_nodes, public.user_realms CASCADE;`

#### Tasca 5: Compilació i Desplegament a Firebase Hosting
- Executar `npm run build:web` per regenerar la distribució `dist/` amb tots els fitxers `.webp` generats.
- Executar `npx firebase-tools deploy --only hosting --project soc-de-poble` per sincronitzar el servidor de producció.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Verificació de fitxers físics:**
   - Comprovar que `public/assets/fotos/javi-llinares-perfil-1200px.webp` i la resta d'actius existeixen a disc.
2. **Verificació de proves unitàries:**
   - Executar `npm test -- src/utils/pujadaImatge.test.js` o la suite de mitjans.
3. **Verificació de lint i portes:**
   - `npm run porta:olivera` per comprovar que l'escriptori roman impecable.
4. **Verificació a Producció (cURL):**
   - `curl -I https://socdepoble.org/assets/fotos/javi-llinares-perfil-1200px.webp` ha de tornar **HTTP 200 OK** (i no 404).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Sobreescriptura d'imatges:** El tractor `optimitzar_webp.mjs` no toca mai els originals; escriu el `.webp` al costat sense esborrar el `.jpg` o `.png` original.
- **Ruptura de contracte de Supabase Storage:** El canvi de tipus MIME a `image/webp` és suportat de manera estàndard per tots els navegadors moderns i per les polítiques de Storage de Supabase.
- **Cache de Firebase Hosting:** Pot trigar uns minuts a invalidar-se després del desplegament. Es comprovarà amb paràmetre de control de memòria cau si cal.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
