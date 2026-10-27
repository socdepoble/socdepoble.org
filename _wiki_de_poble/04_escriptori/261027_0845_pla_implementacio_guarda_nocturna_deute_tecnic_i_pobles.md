---
type: document
status: esborrany
description: Pla de treball autònom per a la neteja del deute tècnic del Llibre Mestre, navegació viva de comunitats i coordinació d'equip
tags:
  - implementacio
visibility: private
reflex: sdp:torn_5922ffdf-6dd5-47d5-9b9d-d37527d1b22d:29b9c6ab-8893-43d9-ab2b-09368e297e3d
---
# Pla de Guarda Nocturna: Sanejament de Deute Tècnic, Comunitats i Col·laboració Autònoma

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5922ffdf-6dd5-47d5-9b9d-d37527d1b22d:29b9c6ab-8893-43d9-ab2b-09368e297e3d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T07:44:59.378Z |
| Modificació | 2026-10-27T07:46:00.000Z |
| Propietari | MarIA |
| Aprovació humana | aprovat (Mestre Javi, àudios 08:24, 08:40, 08:44) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) |
| Tokens consumits | 12.500 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- `2026-10-27T07:44:59.378Z`: Esborrany creat amb rebut canònic del torn.
- `2026-10-27T07:46:00.000Z`: Especificació canònica de les fites de sanejament de deute tècnic, navegació viva de comunitats i col·laboració autònoma acordades amb el Mestre Javi.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Fita P1-54: Botons d'accés només a l'aterratge del xat (Desempapussament)
- **Diagnòstic:** A `src/sections/xat/XatSection.jsx` i `src/sections/xat/AccesAlXat.jsx`, el bloc de tres botons (`[ Descarrega l'App ]`, `[ Connectar-se ]`, `[ Registrar-se ]`) apareix repetit al peu de la llista de canals d'una comunitat (`?comunitat=fake-sdp`, `?comunitat=fake-poble`) i en converses obertes, saturant visualment la interfície («empapussant» l'usuari).
- **Objectiu:** Aquests tres botons han d'aparèixer **exclusivament** a la pantalla d'aterratge / benvinguda genèrica del xat (`/xat` sense comunitat ni conversa seleccionada).
- **Acció:**
  - Condicionar la renderització d'`AccesAlXat` o el bloc inferior a: `!comunitatActiva && !conversaActiva`.
  - Quan l'usuari estiga dins de qualsevol comunitat o xat, el peu de la llista no mostrarà la targeta d'accés redundant.

### 2. Fita P1-55: Pàgina viva de comunitat/poble al panell de lectura
- **Diagnòstic:** Quan l'usuari selecciona una comunitat a la barra lateral (com `Sóc de Poble` o `Gent de la Torre`), el panell principal dret continua mostrant la targeta genèrica de benvinguda del xat («El Xat / Parla amb la teua gent»), ignorant la identitat de la comunitat triada.
- **Objectiu:** En fer clic o navegar a una comunitat (`?comunitat=...`), el panell de contingut principal ha de renderitzar la **Pàgina Viva** d'eixa comunitat (perfil, descripció, poble associat, informació institucional o de veïnatge), en compte de la landing asèptica del xat.
- **Acció:**
  - Connectar la resolució de la comunitat activa amb el component de detall / UniversalPage de comunitat.
  - Assegurar que la targeta genèrica només es mostre quan no hi ha cap context de comunitat ni canal actiu.

### 3. Fita P1-60 / P1-63 / Consola: Sanejament de la Consola Termodinàmica i Maquinària
- **Consola embeguda (`ConsolaSection.jsx:57-63`):** Eliminar el filtre divergent que amaga les 4 targetes de Govern del Mestre quan la Consola està embeguda a `/wikidepoble`.
- **Calendari de tasques (`registre_tasques.json`):** Netejar l'estat de les tasques marcades com a mortes per suspensió del sistema (`higiene-basica`, `higiene-diaria`).
- **Mida de skill:** Podar o fragmentar `.agents/skills/sdp-vigilant-tellado/SKILL.md` per retornar el semàfor al verd.
- **Documentació pública de Maquinària (`WikiDePobleSection.jsx:65-85`):** Permetre que Tractors, Sentinelles i BIOS es visualitzen a producció (`!DEV`), garantint transparència radical i desactivant els botons d'acció mecànica.

### 4. Apple Guideline 2.3.10 (Troballa T1-06)
- **Diagnòstic:** Les pàgines `Full de ruta` i `Avís legal` contenen mencions textuals a Android i Google Play que poden disparar el rebuig d'Apple Review dins de l'app nativa d'iOS.
- **Acció:** Aplicar el filtre de canal/plataforma (`esAppNativa()`) per suprimir o adaptar eixos paràgrafs quan s'executa a l'aplicació nativa.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Verificació de components i rutes:**
   - Prova unitària per comprovar que `AccesAlXat` no es renderitza si hi ha `comunitatActiva`.
   - Prova de navegació de `comunitat=fake-sdp` i `comunitat=fake-poble` verificant que es carrega la informació de la comunitat i no la benvinguda genèrica.
2. **Suite de seguretat i regressió:**
   - `npm run test:precommit` (zero fallades).
   - `node tooling/gates/porta-olivera.mjs` (exit 0).
   - `node tooling/gates/verificador-scc.mjs` (exit 0).
   - Proves en còpies congelades per a contrast adversarial abans de tocar la branca principal.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc de col·lisió concurrent:** Claude, Codex i Gemini operant en paral·lel. **Mitigació:** Ús obligatori de còpies congelades (`/private/tmp/...`), edició atòmica amb compare-and-swap i zero commits concurrents. Només Claude/MarIA consoliden després del dictamen d'auditoria.
- **Risc de regressió visual a mòbil:** Modificar l'aterratge podria afectar el comportament responsive a 375×812. **Mitigació:** Proves visuals amb viewport mòbil i verificació que el botó de descàrrega continua accessible a la portada.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261027_0845_prompt_guarda_nocturna_claude_codex_gemini]]
