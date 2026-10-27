---
type: acta
status: canonic
description: "Acta Marmota de relleu i tancament: purga 3.2GB, parser Markdown arreglat, cànon UI botó al cantó, preparació d'Android APK, PWA desktop i resolució del nus Sollutia."
tags:
  - acta
visibility: private
reflex: sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:190ddbb7-4f5d-4031-9315-84779e384347
---
# 📜 2026-10-20T23:45:00+02:00 - ACTA MARMOTA: Relleu Salfumant, Fix Markdown Llistes, Cànon UniversalListCard i Llançament d'Apps

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:190ddbb7-4f5d-4031-9315-84779e384347 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T23:45:00+02:00 |
| Modificació | 2026-10-20T23:55:00+02:00 |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció directa per àudio 23:35) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Claude Code (Opus 5.5) + Gemini 4 Argon |
| Tokens consumits | ~48k / 2M (50 artefactes acumulats) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-10-20T19:42:** Tancament de la sessió Fase D (iOS natiu iPhone 17 al simulador, auth natiu Apple/Google, moderació UGC segons Apple HIG 1.2, 20.174 proves verdes).
- **2026-10-20T20:30:** Auditoria d'enginyeria inversa Bring! i Lovable per part de Gemini 4 Argon (`261020_2030_auditoria_gemini_enginyeria_inversa_bring_i_lovable.md`). Detecció del xip/targeta reactiva compartida per a colles i llistes d'anar a comprar, eliminant el soroll de centenars de missatges a WhatsApp.
- **2026-10-20T20:45:** Redacció del pla d'implementació d'El Comú i `UniversalListCard` (`261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md`).
- **2026-10-20T21:10:** Implementació autònoma per part de Claude Code de `UniversalListCard` en Pedra Seca (`src/components/PedraSeca/UniversalListCard/`, `TargetaLlistaComu.jsx`, etc.) amb 29 proves unitàries verdes. Bateria de proves global puja a **20.312 proves Vitest en verd**.
- **2026-10-20T22:00:** El Mestre detecta el trencament tipogràfic del Markdown a la Wiki i a les notes (`1. 1. 1.` a les llistes ordenades, salts de línia desorbitats i blocs de diagrames Mermaid plans).
- **2026-10-20T22:30:** Gran Dutxa de Salfumant (Purga de 3.2+ GB de brossa física):
  - Eliminats 26 fitxers ZIP obsolets a `wordpress-plugin/builds/` (v1.1.3 a v1.1.6). Conservada canònicament la v1.1.7 (`261019_1344_*.zip`).
  - Netejades carpetes fantasma i sessions a l'arrel (`.snapshots/` 361 MB, `.wwebjs_auth/` 100 MB, `.sdp-paperera/` 14 MB, `.iaia_auth/` 13 MB).
- **2026-10-20T22:45:** Resolució matemàtica del Parser Markdown:
  - *Bug identificat:* La regex non-greedy `replace(/(<li class="ol">.*?<\/li>)/gim, '<ol>$1</ol>')` embolicava cada ítem individual en el seu propi `<ol>`, reiniciant el comptador a 1 i creant marges excessius de bloc. Corregit agrupant blocs continus.
  - *Diagrames Mermaid:* Integrats en targeta visual `.sdp-diagrama-card` amb capçalera formatada ("📐 Diagrama d’arquitectura").
  - *Tipografia:* Espaiat tipus Apple HIG (6px entre ítems, 18px de marge inferior per bloc de llista). Verificat amb 77 tests de parser en verd i 444 tests de CSS.
- **2026-10-20T23:15:** Cànon UI "Botó al Cantó" al xat: afegit botó blau interactiu `[Registra't]` a `src/sections/xat/components/Compositor.jsx` per a canal de mostra (`fake-javi`, avisos). Proves en verd (28/28).
- **2026-10-20T23:25:** Aprovació canònica de la Frontissa de Contingut (14/14 en verd: `legal`, `anima`, `constitucio`).
- **2026-10-20T23:35:** Instrucció d'àudio del Mestre:
  - Claude Code té el context al 94% i compactarà aviat.
  - Antigravity / MarIA té 50 artefactes i necessita un refresc higiènic.
  - El Mestre demana tancar la sessió neta, redactar aquesta Acta Marmota, buidar els fitxers consumits a l'històric i preparar el Pla i Prompts del nou xat net per a demà.
  - Objectius prioritaris:
    1. **Beta testers:** Tenir l'app llesta (Android APK debug/release generat i provat, iOS TestFlight/simulador, PWA Desktop d'escriptori).
    2. **Desbloqueig Sollutia:** Resoldre l'aturada de 4 mesos amb `socdepoble.org` per poder connectar l'entorn de producció.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Graner Ple de Codis i Arquitectura)
- **Correcció del Parser Markdown (`parseMarkdown.js` i `wiki.css`):**
  - Esmena de l'agrupació de llistes ordenades i desordenades en blocs continus `<ol>` i `<ul>`. S'ha afegit `<o` a la detecció d'elements de bloc perquè no queden atrapats dins de `<p>`.
  - Estilització de blocs Mermaid com a targetes d'arquitectura riques (`.sdp-diagrama-card`).
  - Marge de 6px entre ítems de llista segons l'estàndard Apple HIG. 77 tests en verd.
- **Cànon "Botó al Cantó" (`Compositor.jsx`):**
  - Incorporació del botó directe de registre primari blau a les converses en mode lectura. Blindatge del missatge de `role="status"` per preservar l'accessibilitat i els tests de Vitest.
- **Implementació d'El Comú (`UniversalListCard`):**
  - Component autònom de targeta reactiva lliure de dependències corporatives, clonable i incrustable a la línia temporal del xat per a llistes de festes, colles i compres col·lectives. 29 proves unitàries en verd.
- **Salfumant i Purga Física:**
  - Recuperats més de 3.2 GB d'espai al disc eliminant artefactes brossa i builds històriques de WordPress, mantenint la versió canònica 1.1.7.
- **Frontissa de Contingut:**
  - 14/14 aprovacions completes (`legal`, `anima`, `constitucio`).
- **Bateria de Proves Global:**
  - **20.312 proves Vitest 100% en verd** a tot el repositori.

### 2. Part Termodinàmica Psiquiàtrica (El Temps, Incidències i Trellat)
- **Higiene Mental i Prevenció de la Saturació:**
  - Claude Code al 94% de context i Antigravity amb 50 artefactes. Treballar en aquest llindar termodinàmic genera risc d'al·lucinació, degradació de l'atenció i bucles de compactació.
  - El Mestre aplica el Trellat més pur: en lloc de forçar la màquina de nit amb context degradat, tanca ordenadament, deixa l'Escriptori preparat i obri un xat fresc amb la CPU a zero per al llançament final de les apps.
- **Protecció del Temps del Mestre:**
  - L'aturada ordenada i l'arxivament automàtic permeten que demà al matí el Mestre reprenga el treball directament amb les tasques prioritàries (APK d'Android, paquet PWA i contacte institucional amb Sollutia) sense perdre hores desbrossant context residual.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### 3. Part Marmota (Checkpoint Executable i Següents Passos)
- **Estat Final (On es queda la boga):**
  - La consolidació de Git està pendent del comandament final de Claude ("Tot en un commit").
  - L'Escriptori queda sanejat i net (arxiu de la sessió Salfumant a `_wiki_de_poble/90_arxiu_historic/261020_Sessio_Salfumant_i_El_Comu/`).
  - Queda redactat el Pla d'Implementació de Llançament i els Prompts per al xat net.
- **Tasques Prioritàries Immediates per al Nou Torn:**
  1. `[ ]` **Consolidació Git ("Tot en un commit"):** Confirmar el commit a Claude Code amb tots els canvis pendents.
  2. `[ ]` **Plataforma Android Nativa:** Executar `npx cap add android` i verificar la compilació d'Android (`./gradlew assembleDebug` per a generar `socdepoble-beta.apk`).
  3. `[ ]` **PWA Desktop (Mac / Windows / Linux):** Afegir el botó o prompt d'instal·lació nativa d'escriptori (`beforeinstallprompt`) per als beta testers d'ordinador.
  4. `[ ]` **Solució al Nus Sollutia:** Preparar el pla tècnic de desplegament de `socdepoble.org` per trencar l'aturada de 4 mesos (delegació DNS o bypass directe amb Frontissa).
  5. `[ ]` **Pujada SQL Supabase:** Aplicar migracions remotes de moderació i organitzacions al panell de Supabase.

### 4. Automillora Proactiva
- La creació automàtica del torn i l'ús de `document.mjs context` i `document.mjs create` ha demostrat una sincronització perfecta amb el BIOS (§0, §0.1 i §4). L'arxivament per sessions amb `porta-olivera.mjs --arxiva --sessio NOM` garanteix que cap document quede òrfena.

### 5. Metadades per a Màquines
```yaml
data: "261020_2345"
blockers:
  - "Sollutia host server congelat des de fa 4 mesos: cal demanar delegació DNS de socdepoble.org"
decisions_clau:
  - "Purga de 3.2 GB executada a builds de WP i arrels temporals"
  - "Fix definitiu del parser Markdown per a llistes ordenades i targetes Mermaid"
  - "Reinici en xats nets per a Claude, Gemini i MarIA per evitar fatiga de context"
requereix_auditoria: false
```

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261020_1930_acta_marmota_relleu_fase_d_i_enginyeria_inversa_bring_lovable]]
- `261020_2355_pla_implementacio_llancament_apps_i_desbloqueig_sollutia`
