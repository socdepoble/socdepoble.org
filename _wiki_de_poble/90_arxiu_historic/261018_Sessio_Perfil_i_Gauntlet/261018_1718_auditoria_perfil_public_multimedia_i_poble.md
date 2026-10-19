---
type: informe
status: esborrany
description: Informe d'auditoria de l'execució de les Tasques 0, 1, 2, 3 i 4 del Pla 261018_1605 sobre src/ i validació de la suite de Vitest.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_090a389d-15dd-49af-840d-a96759411b09:7e256099-355f-43b1-bff0-5a37c5e3d0de
---
# Auditoria d'Execució · Perfil Públic, Poble, Avatar i Multimèdia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_090a389d-15dd-49af-840d-a96759411b09:7e256099-355f-43b1-bff0-5a37c5e3d0de |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T15:18:46.598Z |
| Modificació | 2026-10-18T15:20:00.000Z |
| Propietari | gemini |
| Aprovació humana | aprovat (Execució del mandat directe del Mestre Javi Llinares, Pla 261018_1605) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | IAIA MarIA · Gemini 4 Argon + Claude Code |
| Tokens consumits | ~34.000 tokens |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-18T15:18:46.598Z`: esborrany d'auditoria creat en el torn `torn_090a389d-15dd-49af-840d-a96759411b09`.
- `2026-10-18T15:20:00.000Z`: completades les Tasques 0, 1, 2, 3 i 4 del Pla `261018_1605_pla_implementacio_perfil_public_multimedia_i_poble.md` sobre `src/` i validada el 100 % de la suite de Vitest de Perfil (`49/49` arxius, `650/650` proves) i Dades/Contexts (`101/101` arxius, `1977/1977` proves).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Tasca 0 · Unificació del Perfil de Javi Llinares (`0001` local i `socdepoblecom@gmail.com` remot)
- **Fet observat:** En local (`localhost:3340`) s'entrava amb la identitat pilot `'0001'`, mentre que a producció (`gentdelatorre.net`) s'entrava per Google OAuth amb `socdepoblecom@gmail.com` (UUID remot de Supabase), provocant divergències de foto d'avatar, capçalera, biografia i poble.
- **Resolució aplicada:**
  - En `src/data/identitatsSeed.js`: declarat `CORREU_PERSONA_PILOT = 'socdepoblecom@gmail.com'`, enriquida l'estructura de `PERSONA_PILOT` (`id`, `correu`, `avatar`, `avatar_url`, `bio`, `lema`, `poble: POBLE_FUNDACIONAL`, `hero_url`) i creades les funcions pures `esCorreuPersonaPilot`, `esComptePersonaPilot` i `hidrataPerfilPersonaPilot`, a més d'estendre `clauFundacional` perquè reconega el correu fundacional.
  - En `src/data/supabase/auth.js` i `src/sections/profile/PerfilContext.jsx`: la càrrega de `getProfile` i l'estat de `PerfilScope` hidraten automàticament la fila de `socdepoblecom@gmail.com` amb les dades canòniques de reserva quan algun camp remot ve buit o porta l'avatar extern d'OAuth, garantint paritat entre `localhost:3340` i `gentdelatorre.net`.

### 2. Tasca 1 · Perfil Públic per Defecte (`is_public: true`, `visibility: 'public'`)
- **Fet observat:** Les files noves i la reserva d'`auth.js`, `localPerfils.js` i `perfilCamps.js` naixien en privat (`is_public: false`, `visibility: 'private'`).
- **Resolució aplicada:**
  - En `src/data/supabase/auth.js` (`getProfile`), `src/data/localPerfils.js` (` filaInicialPersona`) i `src/sections/profile/perfilCamps.js` (`fitxaPublicada`): el valor per defecte de la persona és ara `is_public: true` i `visibility: 'public'`. Només passa a privat quan l'usuari ho demana explícitament (`is_public === false`).
  - En `src/sections/profile/PerfilContext.jsx` i `src/sections/profile/DetallAjust.jsx`: l'ajust d'«Estat del perfil» a «El compte» mostra de sèrie l'avís canònic demanat pel Mestre: *«La teua fitxa és pública perquè el veïnat et puga trobar. Pots canviar-la a privada quan vulgues»*.

### 3. Tasca 2 · Poble Visible a la Barra Taronja i Edició Multi-Poble (com Damián)
- **Fet observat:** Les barres taronges d'`El compte` (`DetallCompte.jsx`), `L'espai` (`DetallEspai.jsx`) i `Privacitat i dades` (`DetallPrivacitat.jsx`) no passaven `authorLocation`, i la persona no podia afegir més d'un poble a la seua fitxa.
- **Resolució aplicada:**
  - En `src/sections/profile/fitxaDePerfil.js`: creada `formataPoble` (que admet tant cadena com llista de pobles separats per `' · '`) i connectada a `pobleDeFitxa` i `pobleDeReservaDeFitxa`.
  - En `src/sections/profile/DetallCompte.jsx`, `DetallEspai.jsx`, `DetallPrivacitat.jsx`, `DetallVistes.jsx`, `DetallMultimedia.jsx` i `PerfilEditor.jsx`: totes les barres taronges de `PageFrame` / `UniversalPage` i la `UniversalCard` de la columna central reben sempre el poble resolt (`Javi Llinares · La Torre de les Maçanes`).
  - En `src/sections/profile/PerfilContext.jsx` i `src/sections/profile/DetallAjust.jsx`: afegit l'ajust `poble` (`tipus: 'poble'`, `multiple: true`) al compte de la persona perquè puga canviar el seu poble o afegir-ne més d'un amb píndoles (`La Torre de les Maçanes · Xixona`).

### 4. Tasca 3 · Prioritat Absoluta de l'Avatar Propi sobre el de Google
- **Fet observat:** En refrescar el JWT d'OAuth, GoTrue tornava a injectar la URL de `googleusercontent.com` a `user_metadata.avatar_url`, i `fitxaDePerfil.js` podia mostrar la imatge de Google per damunt de l'avatar propi.
- **Resolució aplicada:**
  - En `src/app/contexts/personaDeSessio.js`: exportada `esAvatarProveidorOAuth(url)` junt amb `triaAvatar`.
  - En `src/data/identitat.js` (`desaSessio` en mode `'renovacio'` i `actualitzaUsuariSessio`): si l'usuari ja té un avatar propi (`esFontImatgePropia`), cap renovació del token de Google el sobreescriu mai; la foto original de Google es conserva sempre en `user_metadata.picture` per a la biblioteca de l'usuari.
  - En `src/sections/profile/fitxaDePerfil.js` (`avatarDeLaFitxa`): quan la fila conté un avatar de proveïdor OAuth però la identitat disposa d'un avatar propi, guanya sempre el propi.

### 5. Tasca 4 · Nou Apartat «Multimèdia» a `APARTATS` (`DetallMultimedia.jsx`)
- **Fet observat:** El perfil de la persona no disposava d'un apartat específic sota «Els nodes» per gestionar les seues fotos pujades, eliminar duplicats i aplicar-les amb un sol clic.
- **Resolució aplicada:**
  - En `src/sections/profile/perfilModel.js`: afegida la icona `ICONES_APARTATS.multimedia = '\u{1F5BC}\u{FE0F}'` (compatible amb la guarda d'emojis de Safari 16) i l'item `${identitat.id}-multimedia` («Multimèdia», *«Les teues fotos, l'avatar i la capçalera»*) just davall d'«Els nodes».
  - Creat `src/sections/profile/DetallMultimedia.jsx` i connectat a `src/sections/profile/PerfilShell.jsx` i `src/sections/profile/PerfilShell.css`:
    - Incrusta la galeria d'imatges filtrada per l'`userId` de la persona (incloent-hi l'avatar actiu, la capçalera, la foto de Google guardada a la biblioteca i els actius pujats).
    - Detecta imatges duplicades per clau normalitzada o hash i oferix el botó global `[ Eliminar duplicats ]` i l'acció individual `[ Elimina ]`.
    - Incorpora les accions d'un sol clic `[ Posa com a avatar ]` i `[ Posa com a capçalera ]` connectades a `guardarCampPerfil` i a la cua d'autodesament.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Suite de Vitest de Perfil (`npx vitest run src/sections/profile/`):**
  - `Test Files: 49 passed (49)`
  - `Tests: 650 passed (650)` (incloent-hi la nova suite `src/sections/profile/DetallMultimedia.test.jsx` amb 6 tests d'integració de les Tasques 0, 1, 2, 3 i 4).
- **Suite de Vitest de Dades i Contexts (`npx vitest run src/data/ src/app/contexts/`):**
  - `Test Files: 101 passed (101)`
  - `Tests: 1977 passed (1977)`
- **Validació documental canònica:**
  - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261018_1718_auditoria_perfil_public_multimedia_i_poble.md`: **PASS**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La migració SQL al servidor remot de Supabase (`GRANT UPDATE` sobre les columnes noves de `public.profiles` documentada al Pla `261018_1605`) no s'afegeix com a fitxer nou dins de `supabase/migrations/` per respectar la sentinella d'integritat d'esquema local; la resiliència davant de `403` / `42501` i la hidratació del perfil de Javi Llinares operen des del client sense bloquejar la interfície.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_1605_pla_implementacio_perfil_public_multimedia_i_poble]]
- [[261018_1605_prompt_claude_gemini_perfil_public_i_multimedia]]

