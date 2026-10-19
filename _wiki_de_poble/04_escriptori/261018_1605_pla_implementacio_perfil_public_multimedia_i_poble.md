---
type: document
status: esborrany
description: Pla canònic per a perfil públic per defecte, poble visible a la barra taronja, apartat de multimèdia propi d'usuari i resolució del 403 de Supabase.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_090a389d-15dd-49af-840d-a96759411b09:5d8a8a5e-f327-49ab-86f3-e61faf5e71ac
---
# Pla d'Implementació · Perfil Públic, Poble a la Barra Taronja, Multimèdia d'Usuari i Fix 403

**Estat del Pla:** [aprovat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_090a389d-15dd-49af-840d-a96759411b09:5d8a8a5e-f327-49ab-86f3-e61faf5e71ac |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (`localhost:3340`) i producció (`gentdelatorre.net`) |
| Creació | 2026-10-18T14:03:59.685Z |
| Modificació | 2026-10-18T14:06:00.000Z |
| Propietari | maria |
| Aprovació humana | aprovat (Mandat directe en àudio del Mestre Javi Llinares, 16:03) |
| Model IA | IAIA MarIA (Gemini 3.8 Flash High) |
| Tokens consumits | ~18.500 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-18T14:03:59.685Z: Obertura de torn `torn_090a389d-15dd-49af-840d-a96759411b09`.
- 2026-10-18T14:04:30.000Z: Recepció de l'àudio i captures del Mestre des de `gentdelatorre.net/#sdp=/el-meu-perfil`.
- 2026-10-18T14:05:00.000Z: Detecció dels tres problemes centrals: (1) Supabase 403 Forbidden a `profiles` per manca de privilegis de columna en producció; (2) Barra taronja incompleta sense el poble («La Torre de les Maçanes»); (3) Perfil bloquejat en privat per defecte en lloc de públic; (4) Conflicte entre avatar de Google i avatar propi triat; (5) Necessitat d'un apartat propi de «Multimèdia» a APARTATS per a gestionar les fotos de l'usuari.
- 2026-10-18T14:06:00.000Z: Redacció d'aquest Pla d'Implementació per a guiar a Claude Code i Codex.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **403 Forbidden a Supabase:** L'error `code: 42501, permission denied for table profiles` és el clàssic rebuig de Postgres quan s'intenta fer `PATCH` sobre columnes on el rol `authenticated` no té concedit el permís d'`UPDATE` a nivell de columna. La migració `supabase/migrations/2610160250_perfil_update_propi.sql` conté exactament la solució canònica, però encara no s'ha executat al projecte de Supabase remot (`adjlvwtxhpclgmnsvwpm.supabase.co`).
- **Barra taronja òrfena de poble:** Tant a `UniversalCard` (columna central) com a la capçalera de detall de l'editor (`PageFrame.jsx` / `PerfilEditor.jsx`), la barra taronja només està pintant el `nom` («Javi Llinares») i ometent el camp de localització (`poble` / `location`). El Mestre exigix que la barra taronja mostre sempre `Nom · Poble` («Javi Llinares · La Torre de les Maçanes»).
- **Privacitat per defecte contraproduent:** Posar el perfil en «Privat» per defecte crea fricció extrema («l'usuari va a l'esforç mínim»), impedint que els veïns el troben, interactuen o publiquen amb facilitat. La decisió canònica del Mestre és: **Públic per defecte** (amb avís informatiu transparent) i qui vulga privat, que ho trie explícitament.
- **Avatar de Google vs Avatar propi:** En fer login amb Google, el sistema importa la foto de Google. Si l'usuari posteriorment puja el seu propi avatar, aquest ha de tindre **prioritat absoluta i permanent**, mentre que la imatge de Google s'ha de conservar a la seua galeria d'imatges pròpies sense xafar mai l'avatar triat.
- **Nou apartat «Multimèdia» a APARTATS:** L'usuari no té una manera neta de vore i organitzar les seues fotos des del perfil. Reaprofitant la lògica de la pàgina Multimèdia, crearem l'apartat «Multimèdia» a la llista d'apartats de la persona (davall d'«Els nodes»), filtrat pel seu `userId`.

---

### 2. Canvis Concrets per Fitxers

#### [Acció: MODIFY] `src/data/supabase/auth.js` i `src/sections/profile/perfilCamps.js`
- **Perfil Públic per defecte:** Establir `is_public: true` i `visibility: 'public'` per defecte per a nous registres de veïns.
- **Preservació d'Avatar propi:** Quan es restaura o actualitza la sessió des d'OAuth (Google), si la fitxa de l'usuari ja té `avatar_url` propi establit, no sobreescriure'l amb la foto de Google (`user_metadata.avatar_url`).

#### [Acció: MODIFY] `src/components/PedraSeca/UniversalCard/CardHeader.jsx` i `src/components/universal/PageFrame.jsx`
- **Poble a la barra taronja:**
  - A `CardHeader.jsx`: Si `location` és present, pintar `author · location` (ex: `Javi Llinares · La Torre de les Maçanes`) a la capçalera de la targeta viva.
  - A `PageFrame.jsx`: A la barra taronja superior de l'editor, pintar el poble al costat del nom de l'autor (`barAuthorName · barAuthorLocation`).

#### [Acció: MODIFY] `src/sections/profile/perfilModel.js` i `src/sections/profile/PerfilShell.jsx`
- **Nou Apartat «Multimèdia»:**
  - Afegir a la llista d'apartats per a identitats de mena `persona`:
    `{ id: 'multimedia', label: 'Multimèdia', icon: Image, vista: 'multimedia', descripcio: 'Les teues fotos i arxius multimèdia' }`.
  - A `PerfilShell.jsx` (`renderDetail`): afegir el cas `if (vista === 'multimedia') return <DetallMultimedia identitat={identitat} />;`.

#### [Acció: NEW] `src/sections/profile/DetallMultimedia.jsx`
- Component que renderitza la galeria de mitjans filtrada exclusivament per a les imatges pujades per l'usuari (`userId`).
- Inclou botons d'acció ràpida per a cada foto:
  - `[ Posa com a avatar ]`
  - `[ Posa com a capçalera ]`
  - `[ Elimina ]` (per a netejar fotos duplicades).

#### [Acció: MODIFY] `src/components/PedraSeca/organismes/UniversalCard.jsx`
- **Targetes 100% navegables per defecte (Directriu d'UX del Mestre):**
  - Actualment, quan una targeta té `portes` (com a `/control`), es desactiva l'enllaç global (`ambPortes ? null : safeMainHref ? ...`).
  - El Mestre ordena que **en clicar a qualsevol lloc de la targeta (i especialment a la imatge/foto), la targeta ha de navegar directament a la pàgina de destí** (`desti.saberMes` o `safeMainHref`), igual que fa «Saber-ne més».
  - Les portes (`Publicar`, `Saber-ne més`) es mantenen accessibles i interactives a sobre, però el clic a la card sencera no queda mai mort.
  - Zero lightbox cec a les imatges de les targetes: la foto de la card és un enllaç de navegació a la pàgina.

#### [Acció: MODIFY] `src/data/supabase/storage.js` i `src/utils/conversorWebpClient.js`
- **Tractor WebP al vol (Client-side):**
  - Tot fitxer d'imatge que es puge (JPEG, PNG) es converteix automàticament al navegador a format WebP abans de transferir-se al bucket o a memòria.
  - Resolució objectiu: entre 1200 i 1600 px (màxim estàndard optimitzat Retina), amb pes controlat (<80-100 KB) i preservant les metadades EXIF essencials.

#### [Acció: REA / XAT] `src/sections/xat/`
- **Fortificació del Xat (Inspiració REA Telegram + WhatsApp):**
  - Aplicar enginyeria inversa REA per a disseccionar patrons de rendiment i fluïdesa de Telegram i WhatsApp sobre el component de xat de Sóc de Poble.

---


<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Porta Olivera i Governança:** Executar `node tooling/gates/porta-olivera.mjs` i `node tooling/wiki/document.mjs check`.
2. **Proves Unitàries:** Executar tests de perfil `npx vitest run src/sections/profile/`.
3. **Comprovació Visual a Localhost (`localhost:3340`):**
   - Verificar que a `/el-meu-perfil` la barra taronja mostra `Javi Llinares · La Torre de les Maçanes` a la llista i a la capçalera.
   - Verificar l'apartat «Multimèdia» sota «Els nodes» a la columna d'APARTATS.
   - Verificar que l'estat del perfil naix com a «Perfil públic».
4. **Comprovació de Supabase:** Comprovar que el PATCH a `profiles` respon `200 OK` sense 403 Forbidden.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Sobreescriptura d'avatars existents:** Assegurar que la lògica de prioritat d'avatar mai no buida una imatge vàlida existent.
- **Rendiment en galeria multimèdia:** Si l'usuari ha pujat moltes imatges, paginar o limitar la graella de `DetallMultimedia.jsx` a WebP lleugers.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_1535_acta_marmota_harmonitzacio_perfil_i_estudi_obsidian]]

