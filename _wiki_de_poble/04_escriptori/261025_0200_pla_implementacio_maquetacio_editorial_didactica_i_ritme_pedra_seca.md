---
type: document
status: esborrany
description: Pla d'implementacio per a la reforma de maquetacio editorial didactica, ritme vertical Apple HIG i anatomia universal de pagina (IDEA-26 i IDEA-27)
tags:
  - implementacio
visibility: private
reflex: sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:1a147f96-b305-46c8-b472-889be79a1be8
---
# Pla d'implementació · maquetació editorial didàctica, ritme vertical Apple HIG i anatomia universal de pàgina (IDEA-26 i IDEA-27)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:1a147f96-b305-46c8-b472-889be79a1be8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T23:59:04.451Z |
| Modificació | 2026-10-25T00:02:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~12.000 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-24T23:59:04.451Z: esborrany creat arran dels àudios del Mestre Javi (01:47 i 01:54) sobre les fallades de maquetació editorial i espaiat a Sentinelles i Catàleg de Disseny.
- 2026-10-25T00:02:00.000Z: definició completa dels canvis estructurals i tipogràfics basats en Apple HIG, anatomia universal de pàgina i sublimació de codi.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)

1. **Evidència 1 · Espaiat Anorreat al Catàleg (`IDEA-26`):**
   - A `http://localhost:3340/disseny?categoria=superposicions&item=superposicions-visibilitat`, sota el títol `h4` («Fitxa privada d'una persona»), el botó de canvi està literalment enganxat al text de l'encapçalament (`margin-bottom` de 8px apenes visible, sense respiració matemàtica).
   - A més, les caixes de prova no centren ni alineen harmònicament els botons de mostra.
2. **Evidència 2 · Codi nu i lleig (`IDEA-26`):**
   - Els fitxers i rutes com `src/components/universal/SelectorVisibilitat.jsx` es mostren com a text monoespai pla (`<code>` nu sense format ni fons), generant una sensació d'esborrany tècnic poc cuidat.
3. **Evidència 3 · Desordre Estructural i Mides Estranyes a Sentinelles (`IDEA-27`):**
   - A `http://localhost:3340/wikidepoble?categoria=maquinaria_cat&item=sentinelles_panell`:
     - **Entradilla extraviada:** La capçalera té `H1` («Sentinelles») i `H2` («Els set sentinelles d'autonomia: aprova'ls i mira què observen»), però l'entradilla introductòria s'havia deixat caure a baix de tot, davall de l'H3 «Porta d'aprovació de tractors».
     - **Trencament de la causalitat:** Sota l'H3 venia immediatament el botó «Aprovar tots els pendents (DEV)» i, DESPRÉS del botó, el paràgraf explicatiu «Cap tractor pendent. Aprovació tècnica...».
     - **Mides inventades:** El paràgraf explicatiu feia servir la classe `.sdp-tractors-panell__motiu` amb `font-size: var(--sdp-text-small)` i color gris apagat, en comptes de ser un text de paràgraf de cos estàndard i llegible.

### 2. Doctrina Canònica de Maquetació Editorial Didàctica

Seguint el mandat del Mestre: **«Si nosaltres mateixos no maquitem bé el que creem, com esperem que la gent ho faça?»**:
- **Ordre Universal de Continguts:**
  1. `H1` (Títol de la Pàgina)
  2. `H2` (Subtítol / declaració d'intencions)
  3. `Entradilla (lead)`: Format tipogràfic destacat (`font-size: 1.15rem`, `line-height: 1.6`, lleugerament atenuat o emfasitzat), centrat o alineat elegantment sota l'H2. Mai pot anar perdut al mig del cos ni sota un H3.
  4. `H3` (Títol de Secció)
  5. `Paràgraf de cos estàndard`: Tipografia de cos (`var(--sdp-text-cos)`, `1rem`), amb espaiat vertical respirable (`12px`-`16px` sota encapçalaments).
  6. `Acció / Botons`: Situats lògicament **després** del text explicatiu que justifica l'acció.
  7. `Elements de Dades / Formularis / Graelles`.

### 3. Canvis Concrets per Fitxer

#### A. Tokens i Tipografia (`src/css/tokens.css` i `src/css/base.css` / `components.css`)
- **Espaiats Matemàtics (Apple HIG):**
  - Ajustar `--sdp-mb-h4` de 8px a 14px per garantir que cap control quede enganxat a l'encapçalament.
  - Assegurar espaiat superior entre blocs de secció de 24px a 32px.
- **Sublimació Visual de Codi i Rutes:**
  - Estilitzar `code:not(pre code)` i `.sdp-especimen__fitxer`:
    - `background: var(--sdp-fons-subtil);`
    - `border: 1px solid var(--sdp-vora);`
    - `border-radius: var(--sdp-radi-xs);`
    - `padding: 0.15rem 0.45rem;`
    - `font-size: 0.88em;`
    - `font-family: var(--sdp-font-mono);`
    - `color: var(--sdp-text-titol);`

#### B. Pàgina de Sentinelles i Tractors (`src/sections/tractors/PanellTractors.jsx`, `PanellSentinelles.jsx`, `WikiDePobleSection.jsx`)
- A `WikiDePobleSection.jsx`:
  - Passar l'argument `lead` a `einaLocal('sentinelles_panell', ...)` amb l'entradilla: «Els components comuns de l'app (botons, diàlegs, navegació) no hi entren. Si en canvia una línia, torna a «pendent».». D'aquesta manera `UniversalPage` la renderitza automàticament sota l'H2.
- A `PanellTractors.jsx`:
  - Eliminar el paràgraf duplicat de l'entradilla que estava sota l'H3.
  - Reordenar la secció DEV:
    1. `<h3>Porta d'aprovació de tractors</h3>`
    2. Paràgraf de text de cos normal (eliminar classe `sdp-tractors-panell__motiu` petita i usar estil de paràgraf de cos estàndard): «Cap tractor pendent. Aprovació tècnica del servidor de desenvolupament: no substituïx la lectura de la fitxa ni la revisió reflexiva. La primera aprovació després d’un canvi a la porta mateixa es fa d’una en una.»
    3. Bloc d'accions amb el botó: `<div className="sdp-tractors-panell__accions"><Boto>Aprovar tots els pendents (DEV)</Boto></div>`.
- A `src/css/modules.css`:
  - Netejar les classes afectades de `.sdp-tractors-panell` per assegurar que la tipografia no s'encongeix a `text-small` de manera artificial.

#### C. Catàleg de Disseny (`src/sections/disseny/`)
- A `Especimen.jsx` i caixes de mostra:
  - Aplicar classe o contenidor amb centrat o alineació harmònica per als botons de prova.
  - Assegurar que la separació entre l'H4 del bloc de prova i els controls interactius siga d'un mínim de 14px-16px.

#### D. Connectar: Dualitat Entitat / Persona Propietària (`src/sections/connectar/`)
- Completar la tasca pendent d'`IDEA-22`:
  - Si l'entitat de destí té una persona propietària amb perfil públic, oferir a la targeta de relació l'opció de connectar tant amb l'empresa com amb la persona creadora/titular.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Precommit Mecànic:**
   - Executar `npm run test:precommit` (259 proves de Node + més de 2.980 de Vitest) per certificar 0 regressions.
   - Executar `npm run lint` per mantenir 0 errors i 0 avisos d'ESLint.
2. **Auditoria Visual en Viu amb Gemini 4 Argon (`localhost:3340`):**
   - Inspeccionar `/wikidepoble?categoria=maquinaria_cat&item=sentinelles_panell`: verificar que l'entradilla està centrada sota l'H2, que l'H3 té paràgraf de mida estàndard i que el botó va a continuació del text.
   - Inspeccionar `/disseny?categoria=superposicions&item=superposicions-visibilitat`: verificar la respiració matemàtica entre l'H4 i el botó (`margin-bottom >= 14px`), i la pastilla elegant de la ruta de fitxer.
   - Inspeccionar `/connectar`: verificar la dualitat d'identitats de destí.
3. **Auditoria Forense amb Codex Sol Ultra:**
   - Verificació del diff de codi, integritat de contractes i comprovació d'absència de regressions SQL o de permisos.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Risc de Regressió en Proves Existents de PanellTractors:**
   - Si les proves d'integració comproven l'ordre exacte dels nodes del DOM a `PanellTractors.test.jsx`, reordenar el botó i el text podria alterar selectors per posició.
   - *Mitigació:* Usar `getByRole('button', { name: ... })` i `getByText(...)` canònics de Testing Library, que són independents de l'ordre dels nodes.
2. **Risc d'Afectar Altres Usos de `<code>`:**
   - Estilitzar globalment `code` podria afectar blocs de codi amb `<pre><code>`.
   - *Mitigació:* L'estil s'aplica exclusivament a `code:not(pre code)` o a través de classes de Pedra Seca ben acotades (`.sdp-code-pill`, `.sdp-especimen__fitxer`).

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
