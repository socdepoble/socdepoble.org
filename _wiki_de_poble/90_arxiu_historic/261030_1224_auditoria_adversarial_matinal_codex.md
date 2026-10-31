---
type: informe
status: esborrany
description: 'Auditoria adversarial matinal de GPT Codex (30-10-2026 12:24 CET) sobre la guàrdia nocturna de Claude Opus 5.5.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:a3bf4c99-1e27-4f5d-98b2-ab205d40605f
---
# Auditoria Adversarial Matinal — GPT Codex (`261030_1224`)

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:a3bf4c99-1e27-4f5d-98b2-ab205d40605f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T11:25:08.000Z |
| Modificació | 2026-10-30T21:31:24.000Z |
| Propietari | GPT Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex (variant no declarada al document original) |
| Tokens consumits | No declarat al document original |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-30T11:25:08.000Z: document original de GPT Codex, fora del circuit de rebuts.
- 2026-10-30T21:31:24.000Z: adoptat al circuit canònic per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4: «Renova qualsevol rebut caducat o pendent»). El text original és íntegre i sense canvis dins de «Troballes»; només s'hi han afegit les seccions canòniques i els encapçalaments han baixat un nivell. Còpia de l'original fora del repositori.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

- **Data i hora:** 2026-10-30 12:24 CET
- **Mode:** 100% Read-Only (cap fitxer modificat)
- **Abast:** Guàrdia Nocturna de Claude Opus 5.5 (`261030_informe_matinal_opus.md`, Cicles 2 i 3 del Gauntlet)
- **Resultat global:** **0 CRÍTICS**, **1 ALT**, **8 MITJÀ**, **1 MILLORA**.

---

### Troballes prioritzades i canvis quirúrgics

1. **`[ALT-C1]` La Consola permet traduir dades locals cap a proveïdors externs (`src/sections/consola/govern/GovernConsola.jsx:756`)**
   - **Problema:** La matriu importada mostra requeriments i fonts —també evidències amb privacitat apagada— dins d’una `UniversalPage` amb Traduir habilitat. Contradiu «el fitxer no es puja enlloc».
   - **Canvi:** Posar `traduccio={false}` en les superfícies de Consola amb dades locals (`GovernConsola.jsx` i resta de vistes de Consola amb dades locals). Cobrir la ruta real amb una prova que impedisca qualsevol petició de traducció.

2. **`[MITJÀ-C2]` Una lectura pendent pot desfer l’oblit de Viquipèdia (`src/sections/pobles/cauDeViquipedia.js:185`)**
   - **Problema:** Després d’`oblida()` o `desa()`, una lectura antiga d'IndexedDB pot acabar i sobreescriure la RAM a la línia 191.
   - **Canvi:** Afegir una generació per clau, incrementada en desar/oblidar, i descartar resultats antics. Invalidar també les lectures pendents en l’oblit global.

3. **`[MITJÀ-C3]` El panell anuncia oblit sense confirmar l’esborrat persistent (`src/sections/pobles/PanellDeViquipedia.jsx:186`)**
   - **Problema:** No espera l’operació (`await cau.oblida()`); la cau silencia errors d’IndexedDB i es mostra igualment l’èxit. Les dades poden reaparéixer després de recarregar.
   - **Canvi:** Retornar confirmació/error des de `cau.oblida()`, esperar-la i mostrar oblit pendent amb reintent si falla, mantenint la RAM invalidada.

4. **`[MITJÀ-C4]` Els marcadors traduïts poden perdre enllaços o duplicar codi (`src/components/universal/traduccio/blocsTraduibles.js:328`)**
   - **Problema:** Un marcador absent o amb cometes simples (`data-sdp='0'`) perd l’`href`; un `<code>` retornat amb contingut produïx `LICENSELICENSE`.
   - **Canvi:** Acceptar cometes simples o dobles en `data-sdp`, validar totes les marques esperades i recuperar l’original davant pèrdues, duplicats o alteracions. Inserir el codi original una sola vegada, descartant el contingut retornat d’eixa etiqueta.

5. **`[MITJÀ-C5]` Es perden separadors `<br>` i jerarquia de llistes (`src/components/universal/traduccio/blocsTraduibles.js:152`)**
   - **Problema:** `Bon<br>dia` es convertix en `Bondia`; una llista imbricada s’aplana dins del text exterior.
   - **Canvi:** Representar explícitament salts `<br>` (com a espai o salt) i llistes descendents. Si un bloc encara no es pot reconstruir fidelment, conservar-lo en l’original.

6. **`[MITJÀ-C6]` L’interruptor push pot declarar una baixa falsa (`src/pwa/avisosPush.js:356`)**
   - **Problema:** Si fallen tant `unsubscribe()` com `retira()`, `sincronitzaAvisosPush()` retorna `inactiu` en lloc d'`ERROR_PUSH.SUBSCRIPCIO`.
   - **Canvi:** Comprovar el resultat de `desfesIRetira()` i retornar `ERROR_PUSH.SUBSCRIPCIO`, com fa `desactivaAvisosPush()`.

7. **`[MITJÀ-C7]` La memòria de subscripcions push no distingix persones (`src/pwa/avisosPush.js:276`)**
   - **Problema:** Després de desar l’endpoint per a A, una sincronització de B en la mateixa càrrega omet el segon `desa()` i declara `actiu`.
   - **Canvi:** Delimitar `DESATS_D_ESTA_CARREGA` per identitat/àmbit de sessió, invalidar-lo en logout i protegir els desats pendents amb una generació.

8. **`[MITJÀ-C8]` Cancel·lar després de llegir l’adjunt deixa el buffer clar sense netejar (`src/data/xifratXatPipeline.js:394`)**
   - **Problema:** `exigix()` queda fora del `try/finally`: si falla després d’`arrayBuffer()`, no arriba a `bytes.fill(0)`.
   - **Canvi:** Moure `exigix()` dins del mateix `try` que garantix `bytes.fill(0)` al `finally`. Afegir el cas de canvi d’àmbit mentre la lectura del fitxer està pendent.

9. **`[MITJÀ-C9]` «Del poble» i les recents esquiven el filtre d’emojis pintables (`src/sections/xat/components/SelectorEmoticones.jsx:182`)**
   - **Problema:** El catàleg general passa per `emojisPintables`, però les llistes «Del poble» (`EMOJIS_RURALS`) i «Recents» arriben directament al render.
   - **Canvi:** Aplicar `emojisPintables` també a «Del poble» i «Recents», ometre seccions buides i cobrir un emoji rural rebutjat en la pestanya inicial.

10. **`[MILLORA-C10]` Revocació en l'adaptador natiu Push (`src/natiu/avisosPushNatius.js:118`)**
    - **Canvi:** Afegir `desactiva({ retira })` que cride `removeAllDeliveredNotifications()`, `unregister()` i `retira()`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

El document original no porta una secció de verificació separada; les comprovacions que cita són dins de «Troballes». L'adopció no n'hi afig cap.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Adopció estructural: no valida, corregix ni reescriu cap afirmació del document original.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index_escriptori]]
- [[261030_1533_informe_matinal_opus]]
