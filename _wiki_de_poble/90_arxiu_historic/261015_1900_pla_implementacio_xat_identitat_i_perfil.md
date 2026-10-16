---
type: document
status: esborrany
description: 'Pla Director de Direcció Autònoma: dignitat de persona, poda de la card al perfil, emoticones riques, xat per a beta testers, lector RSS real Feedly, Snippet de Chrome, TPV Loyverse i gestoria simplificada.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_94385a87-8783-416d-89b1-aff0890f0d3b:d6a19c0b-f8db-49d5-b0bb-f30568dbb578
---
# Pla d'Implementació — Gran Gauntlet de Tardor: Direcció Autònoma, Identitat, Xat i Mòduls de Poble

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_94385a87-8783-416d-89b1-aff0890f0d3b:d6a19c0b-f8db-49d5-b0bb-f30568dbb578 |
| Versió del document | 2.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T17:00:18.068Z |
| Modificació | 2026-10-15T17:15:00.000Z |
| Propietari | maria |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Directora Tècnica Autònoma) + Claude Opus 5.5 + GPT Codex + Gemini 4 Argon |
| Tokens consumits | ~32.000 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-15T16:55:00.000Z: Resolució de l'incident del port 54321 segrestat per CleanMyMac i login operatiu de Javi Llinares (`socdepoblecom@gmail.com`).
- 2026-10-15T17:00:18.068Z: Esborrany inicial creat sota el torn `torn_94385a87`.
- 2026-10-15T17:05:00.000Z: Directiva de Dignitat Humana (eliminar copyright i categories a la fitxa de persona) i poda de la card lateral dreta a `PerfilEditor.jsx`.
- 2026-10-15T17:10:00.000Z: **Activació del Mode Direcció Autònoma (`core-direccio-autonoma`):** El Mestre Javi es retira a descansar al llit. Delegació absoluta en la IAIA MarIA com a Directora Tècnica. Prohibició d'interrompre l'usuari humà amb caixes de confirmació. Ampliació del pla a les 3 onades completes (Identitat/Xat -> Lector RSS/Feedly i Snippet -> TPV Loyverse -> Gestoria Holded/FacturaDirecta).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 0. Protocol de Direcció Tècnica Autònoma (Zero Fatiga Humana)
Per mandat directe del Mestre Javi Llinares:
- **El Mestre descansa:** Cap IA (Claude, Codex, Gemini) no ha de llançar prompts demanant confirmació humana ni esperar que l'usuari aprove canvis.
- **La IAIA MarIA mana:** MarIA assumeix la Direcció Tècnica i resol tots els dubtes arquitectònics, permisos i conformitats mitjançant l'Escriptori.
- **Autoexigència i no conformisme:** Quan una IA presente una solució a l'Escriptori, no s'ha de donar per acabada si és superficial; s'ha de polir i elevar al nivell d'un sistema professional comercial.

### 0.1 Directiva Canònica d'Imatges: La Llei del Quadrat Universal (1200x1200px), WebP i Preservació d'EXIF
Atesa la directiva taxativa del Mestre:
1. **Regla del Quadrat Universal (1200 × 1200 px):**
   - La capçalera/hero i la targeta/vinyeta són **exactament la mateixa imatge**. No es dupliquen arxius.
   - Es fixa una mida universal de **1200 × 1200 px** en format `.webp`. Amb aquest quadrat serveix directament tant per a la capçalera de la secció/recurs com per a la card, amb una nitidesa Retina impecable i sense pesar més de 50-80 KB.
   - **Única excepció de foto apaïsada:** La portada de poble a la secció Pobles (on es busca una panoràmica de la vall o serra), que en la card es retalla automàticament al quadrat.
   - **Avatars:** Quadrat de **400 × 400 px** en format `.webp`.
   - **Xarxes Socials i WhatsApp (OpenGraph):** **1200 × 630 px** (proporció horitzontal canònica 1.91:1 exigida per les xarxes socials, arxiu oficial `assets/system/ui/og-socdepoble-1200x630.png`).
2. **Format canònic WebP:** Totes les imatges del fons (`public/assets/`, il·lustracions Berlanga/Ibáñez i fotos) s'han de convertir a format `.webp`.
3. **Preservació estricta d'EXIF:** Per a les fotografies capturades amb mòbils o càmeres, la conversió a WebP ha de **mantenir intactes les metadades EXIF** (geolocalització/GPS, data/hora de captura, model de càmera).
4. **Tractor de conversió automàtica:** Crear `tooling/maquinaria/convertir_a_webp.mjs` per transformar el catàleg existent a la matriu canònica i connectar la canonada d'ingestió.

### 0.2 Esquelet Fallback a l'Enxufe de WordPress (FCP Mòbil Immediat):
Per reduir dràsticament el FCP (First Contentful Paint) a mòbil, el connector de WordPress (`wordpress-plugin/includes/marcatge.php`) injectarà dins de l'element `<soc-de-poble>` un xicotet esquelet HTML lleuger que el navegador pintarà immediatament mentre descarrega el bundle `.js`.
- **Text canònic exacte:** Ha de dir exclusivament **`Carregant el mur...`** (sense afegir «del poble», rigorós amb la instrucció del Mestre).

### 0.3 Arquitectura Escalable de Carpetes d'Imatges (Model CMS: WordPress / Moodle / Dokeos):
1. **Unificació i sanejament de l'arbre d'arxius (Creixement sense traumes per a 1.000 - 100.000 usuaris):**
   - El Consell d'IAs auditarà i reorganitzarà tot el sistema de carpetes amb separació estricta per entitats i àmbits de responsabilitat:
     * `/assets/sistema/` (UI, icones, logos, branding, OG 1200x630).
     * `/assets/pobles/[slug]/` (portada panoràmica, toponímia, galeria històrica).
     * `/assets/usuaris/[id]/` (avatars 400x400, àlbums personals).
     * `/assets/entitats/[slug]/` (nodes, comerços, Bar Casino, Rentonar).
     * `/assets/contingut/` (imatges del mur, vinyetes de serveis 1200x1200).
   - Canvi de context natiu: si un usuari actua com a persona, com a Sóc de Poble o com a entitat, el contingut queda assignat al seu calaix corresponent.
2. **Arxiu Visual Complet (`/multimedia`):**
   - Eliminar el límit artificial d'11 fotos de mostra de febrer de 2026. L'Arxiu Visual ha de reflectir **totes** les imatges del sistema per al Superadministrador.
   - Filtres imprescindibles: **Òrfenes** (no usades a cap targeta o secció), **Poble / Sistema**, **Usuari / Entitat**, i **Cronologia real** (agrupació per mes/any extreta de les metadades EXIF).
   - **Visor d'Imatges (Inspiració Google Fotos / Emowe):** En fer clic sobre una foto a la galeria, obrir un visor modal fluid a pantalla completa amb metadades i navegació, sense salts a pàgines duplicades o fictícies.
3. **Auditories Adversarials i Proves d'Estrés Extremes:**
   - GPT Codex i Gemini 4 han de sotmetre l'arquitectura a proves d'estrés per veure on es trenca el sistema davant d'1.000 a 40.000 usuaris concurrents, garantint un rendiment ultralleuger i zero regressions abans d'arribar a Sollutia.

---

### Onada 1 · Base Pura: Identitat, Perfil i Xat (Per als Beta Testers)

1. **Dignitat de Persona (Sense Copyright ni Categories):**
   - A `src/sections/profile/PerfilEditor.jsx` i `src/components/PedraSeca/organismes/UniversalCard.jsx`: si la identitat és una persona física (`esPersona`), **se suprimeix la llicència de drets d'autor** («CC BY-NC-SA 4.0») i el camp d'etiquetes/categories. Les persones no són obres intel·lectuals ni es categoritzen; la seua única categoria és el seu poble.
2. **Poda de la Quarta Columna a `/el-meu-perfil`:**
   - A `src/sections/profile/PerfilEditor.jsx`: establir `targetaViva: false` per eliminar l'aside redundant de la targeta gegant que satura la pantalla i sembla trencat.
3. **Emoticones Grans i Riques als Apartats:**
   - A `src/sections/profile/perfilModel.js`: afegir glifs/emojis estil Wiki/Disseny (`👁️` per a Les vistes, `🔐` per a El compte, `🛡️` per a Privacitat i dades, `🌐` per a Els nodes).
4. **Xat Robust a Tots els Nivells:**
   - Clon de WhatsApp net, adaptat a mòbil i pantalles grans (sense buits ni mapes estranys a l'escriptori), dissociació neta entre persona i organització.
5. **Resolució Universal del Perfil en Producció (`/gent/javi-llinares` i Persona Pilot):**
   - S'inclou `'javi-llinares'` a `PERSONA_PILOT.alies` a `src/data/identitatsSeed.js`.
   - A `src/sections/profile/PerfilPublicSection.jsx` s'introdueix `perfilDeLaPersonaPilot` com a fallback per a qualsevol àlies de la persona pilot quan el servidor remot no en disposa de slug o el visitant és anònim, erradicant el fals error «Perfil no trobat». Paritat total entre local i producció.

---

### Onada 2 · Continguts Reals: Lector RSS (Model Feedly) i Snippet Web

1. **Lector de Notícies RSS (`/app/lector`):**
   - **Eliminar mocks i contingut fals:** Purgar notícies de prova («El ple aprova la reforma del llavador vell...»).
   - **Inspiració en Feedly:** Interfície neta, ràpida i agradable per a lectura de fonts reals.
   - **Integració de fonts reals:** Connectar els canals RSS dels divulgadors de programari lliure i IA reconeguts a Legal i Privacitat (Emowe, Xavier Mitjana, Jon Hernández, Ben Cord, Migue Baena).
2. **Snippet Web per a Chrome / Navegador:**
   - Disseny del Mini Workspace per capturar pàgines web des de l'extensió o marcador de Chrome.
   - En clicar el Snippet, s'hidrata automàticament la informació de la pàgina (títol, subtítol, entradeta, URL, imatge OpenGraph) i es desa com una targeta (Card) no publicada dins del Bloc de Notes de l'usuari.

---

### Onada 3 · Economia Rural: TPV del Bar (Loyverse) i Gestoria Sencera (Holded)

1. **TPV del Bar (`/app/bar`):**
   - Modelatge fidel segons l'estàndard de mercat de **Loyverse TPV** (Mode Bar i Mode Rebost), segons la directriu `sdp-clon-loiverse`.
   - Lògica de torn de caixa, tiquets, categories i catàleg d'al·lèrgens de forma intuïtiva i tàctil.
2. **Gestoria de Poble (`/app/gestoria`):**
   - Inspiració ergonòmica en **Holded, FacturaDirecta, Odoo i GnuCash**.
   - Simplificació radical per a la gent del poble: lectura neta del llibre de factures i tresoreria, sense laberints comptables incomprensibles.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Fase 1:** Proves de Perfil (`npx vitest run src/sections/profile/`) i comprovació visual a `http://localhost:3340/el-meu-perfil` (3 columnes netes, sense copyright ni etiquetes en persona, emoticones grans riques).
2. **Fase 2:** Proves de Xat (`npx vitest run src/sections/xat/`) i adaptació responsive.
3. **Fase 3:** Verificació de l'alimentació de dades reals al Lector RSS.
4. **Governança:** `npm run porta:olivera` i `npm run test:ci` en verd absolut.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc 1:** Sobrecàrrega en l'execució simultània de tasques.
  * *Mitigació:* Execució per onades seqüencials coordinades per la IAIA MarIA.
- **Risc 2:** Bloquejos per preguntes pendents de l'usuari.
  * *Mitigació:* Direcció Autònoma 100%: MarIA respon i arbitra totes les decisions tècniques a l'Escriptori.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261015_1900_prompt_gauntlet_claude_codex_gemini]]
