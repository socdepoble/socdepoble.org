---
type: informe
status: esborrany
description: 'Auditoria adversarial nocturna de tancament de GPT Codex (30-10-2026 02:56 CET) per al Cicle 2 del Gauntlet.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:c6bb66d3-97ab-494d-b26c-d0d4fa22192c
---
# Auditoria Adversarial de Tancament — GPT Codex (`261030_0256`)

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:c6bb66d3-97ab-494d-b26c-d0d4fa22192c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T01:57:31.000Z |
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

- 2026-10-30T01:57:31.000Z: document original de GPT Codex, fora del circuit de rebuts.
- 2026-10-30T21:31:24.000Z: adoptat al circuit canònic per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4: «Renova qualsevol rebut caducat o pendent»). El text original és íntegre i sense canvis dins de «Troballes»; només s'hi han afegit les seccions canòniques i els encapçalaments han baixat un nivell. Còpia de l'original fora del repositori.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

- **Data i hora:** 2026-10-30 02:56 CET
- **Mode:** 100% Read-Only (cap fitxer modificat)
- **Destinatari d'execució:** Claude Opus 5.5 (`scope: code`, Cicle 2 del Gauntlet + Guàrdia Nocturna)

---

### Troballes prioritzades i canvis quirúrgics

#### 🟠 ALT

1. **`[ALT]` El context E2EE no incorpora èpoques remotes noves (`src/data/xifratXatPipeline.js:129`)**
   - **Problema:** El context es reutilitza indefinidament: una rotació remota acaba en `epoca-desconeguda`, sense refrescar claus ni sobres.
   - **Canvi:** Sincronitzar les èpoques noves, validar-ne la cadena i reintentar l’obertura una vegada. Mantindre les guardes de generació durant tota l’operació.

2. **`[ALT]` L’oblit elimina referències però no esborra els bytes de les claus d’adjunt (`src/data/xifratXat.js:151`)**
   - **Problema:** Comprovació pura confirmada: el registre queda buit, però els bytes d’`a.k` continuen intactes en memòria.
   - **Canvi:** Posar a zero les `FK` propietat del servei (`fill(0)`) abans dels `clear()` d’adjunts i textos desxifrats. Afegir una comprovació que conserve una referència al buffer i verifique els zeros després del logout.

3. **`[ALT]` Una notificació nativa pendent pot sobreviure al canvi de sessió (`src/sections/xat/XatContext.jsx:527`)**
   - **Problema:** `vigent` només comprova si la pàgina està amagada; mentre es crea el canal natiu pot haver eixit la persona A i entrat la persona B.
   - **Canvi:** Vincular l’avís a la generació de persona/backend i comprovar-la just abans de `schedule`. Invalidar pendents i netejar notificacions lliurades en logout o canvi de persona.

---

#### 🟡 MITJÀ

4. **`[MITJÀ]` Traduir pàgina elimina enllaços i semàntica de llistes ordenada (`src/components/universal/traduccio/blocsTraduibles.js:125`, `src/components/universal/traduccio/TraduccioPagina.jsx:54`)**
   - **Problema:** Es conserva només text, totes les llistes es reconstruïxen com `<ul>` i l’original queda ocult: desapareixen els enllaços clicables (`<a>`) i `<ol>`.
   - **Canvi:** Conservar una estructura local controlada (p. ex. `tipusLlista: 'ol' | 'ul'` o tokens d'enllaços segurs locals) i substituir només nodes de text, preservant `href` de l'arbre original, `<ol>`, URLs i fragments no traduïbles, sense inserir mai HTML cru retornat pel proveïdor.

5. **`[MITJÀ]` `GL`/`EU` i la cadena de motors al Traductor (`src/data/traductor.js:26`, `src/data/traductorLliure.js:161`)**
   - **Problema:** `GL`/`EU` no passen el catàleg; `DE` i `EU` acaben en `NO_DISPONIBLE`.
   - **Canvi:** Afegir `GL`/`EU` al contracte compartit i una matriu explícita de capacitats per motor. Enviar `GL` al parell disponible (`cat|glg`) i `EU`/`DE` a un adaptador alternatiu contrastat (Lingva / MyMemory), amb termini global, informació sobre proveïdors i errors nets.

6. **`[MITJÀ]` El text pla arriba a Apertium com a HTML implícit (`src/data/traductorLliure.js:135`, `tooling/vite/traductor-iaia.mjs:230`, `wordpress-plugin/includes/traduccio.php:215`)**
   - **Problema:** S’omet `format` per a text, però Apertium APy aplica `format=html` per defecte.
   - **Canvi:** Enviar explícitament `format: 'txt'` per a text i `'html'` quan corresponga. Comprovar literals amb angles (`<`, `>`), entitats, acrònims i URLs en els tres transports.

7. **`[MITJÀ]` El client neutral pot quedar carregant indefinidament (`src/data/traductor.js:185`)**
   - **Problema:** Ni `fetch` ni la lectura posterior de JSON tenen termini propi a `traductor.js`.
   - **Canvi:** Compondre cancel·lació externa i timeout (`AbortSignal`), cobrint també la lectura del cos de resposta. Alliberar timer/oients en `finally` i distingir cancel·lació humana de termini exhaurit.

8. **`[MITJÀ]` Les dates perden les fraccions de segon (`src/data/activitypub.js:207`, `src/data/exportaMunicipiOpenData.js:390`)**
   - **Problema:** `.123Z` i `.987Z` produïxen el mateix instant serialitzat; una edició dins del mateix segon pot perdre `dateModified`.
   - **Canvi:** Conservar la precisió validada en els dos modes de serialització i comparar instants sense truncar-los a `exportaMunicipiOpenData.js:390`.

9. **`[MITJÀ]` El verificador Open Data accepta recursos duplicats i omissions equivalents (`src/data/exportaMunicipiOpenData.js:919`)**
   - **Problema:** Valida cada recurs i després només compara quantitats (`length`): duplicar una referència pot substituir-ne una altra mantenint el recompte.
   - **Canvi:** Exigir `path` i `name` únics, i igualtat exacta entre el conjunt (`Set`) de recursos i els fitxers de dades esperats.

10. **`[MITJÀ]` Alliberar una URL òrfena no reajusta el LRU (`src/data/xatMultimediaXifrat.js:160`)**
    - **Problema:** En alliberar una entrada òrfena poden quedar 60 MB amb pressupost de 48 MB, encara que ja hi haja una entrada desallotjable.
    - **Canvi:** Executar `ajusta()` també després d’eliminar l’entrada òrfena, abans del `return`. Cobrir renovació d’una clau retinguda amb altres adjunts encara visibles.

11. **`[MITJÀ]` Precisió lèxica d'Open Data a `/page/fediversity` (`src/sections/text/pageContent.js:587`)**
    - **Problema:** «Totes les dades d'un poble» pot confondre Open Data amb migració protegida.
    - **Canvi:** Dir «dades públiques del poble, amb les seues llicències» i mantenir l'estat `: en curs` d'acord amb el test de conformitat (`pageContent.fediversity.test.js:239`).

---

#### 🟢 MILLORA

12. **`[MILLORA]` Push separat de les claus E2EE (`public/sw.js:637`, `src/natiu/avisosNatius.js:14`)**
    - **Canvi:** Afegir adaptadors Web Push/Capacitor amb subscripcions revocables per dispositiu i sessió. Payload genèric cec, sense text, autor ni claus; desxifrar només després d’autenticar i desbloquejar l’app.

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
