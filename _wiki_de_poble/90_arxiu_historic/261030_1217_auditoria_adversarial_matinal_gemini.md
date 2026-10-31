---
type: informe
status: esborrany
description: 'Auditoria adversarial matinal de Gemini CLI (30-10-2026 12:17 CET) sobre la guàrdia nocturna de Claude Opus 5.5.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:481e4a31-1770-4227-8950-5cba5d0a9b4c
---
# Auditoria Adversarial Matinal — Gemini CLI (`261030_1217`)

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:481e4a31-1770-4227-8950-5cba5d0a9b4c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T11:18:20.000Z |
| Modificació | 2026-10-30T21:31:24.000Z |
| Propietari | Gemini CLI |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini (variant no declarada al document original) |
| Tokens consumits | No declarat al document original |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-30T11:18:20.000Z: document original de Gemini CLI, fora del circuit de rebuts.
- 2026-10-30T21:31:24.000Z: adoptat al circuit canònic per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4: «Renova qualsevol rebut caducat o pendent»). El text original és íntegre i sense canvis dins de «Troballes»; només s'hi han afegit les seccions canòniques i els encapçalaments han baixat un nivell. Còpia de l'original fora del repositori.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

- **Data i hora:** 2026-10-30 12:17 CET
- **Mode:** 100% Read-Only (0 fitxers modificats)
- **Abast:** Guàrdia Nocturna de Claude Opus 5.5 (`261030_informe_matinal_opus.md`, Cicles 2 i 3 del Gauntlet)
- **Resultat global:** **0 CRÍTICS**, **2 ALT**, **4 MITJÀ**, **2 MILLORA**.

---

### Troballes prioritzades i canvis quirúrgics

#### 🟠 `[ALT-01]` Bloc 2 · Fuita d'identitat Push entre sessions en la mateixa pestanya (`DESATS_D_ESTA_CARREGA`) i absència de `desactiva` en l'adaptador natiu Capacitor (`D-09`)
- **Fitxers:** `src/pwa/avisosPush.js:91,271-278,338-361,367-384`, `src/natiu/avisosPushNatius.js:118-155`
- **Problema:**
  1. `DESATS_D_ESTA_CARREGA` s'indexa només per `forma.endpoint` (sense `ambit`) i `buidaAvisosPushEnEixir` no el neteja. Si A tanca sessió i entra B en la mateixa pestanya SPA, `sincronitzaAvisosPush` omet `desa(forma)` per a B.
  2. `creaAvisosPushNatius` no exposa `desactiva({ retira })` (`removeAllDeliveredNotifications()` + `unregister()`).
- **Canvi quirúrgic:**
  ```js
  // 1) A src/pwa/avisosPush.js (línia 275 i 369): indexa `desats` per `${ambit ?? ''}::${forma.endpoint}` i buida'l en eixir:
  const clauDesat = `${ambit ?? ''}::${forma.endpoint}`;
  if (!forca && desats && desats.has(clauDesat)) return forma;
  // ... després d'await desa(forma): if (desats) desats.add(clauDesat);
  // I dins de buidaAvisosPushEnEixir (línia 369): DESATS_D_ESTA_CARREGA.clear();

  // 2) A src/natiu/avisosPushNatius.js (línia 152): afig `desactiva` a l'objecte retornat per `creaAvisosPushNatius`:
  async desactiva({ retira } = {}) {
    await push?.removeAllDeliveredNotifications?.();
    await push?.unregister?.();
    if (typeof retira === 'function') await retira();
    return { estat: 'desactivat' };
  }
  ```

---

#### 🟠 `[ALT-02]` Bloc 4 · Enverinament de la memòria cau de sessió (`sessio.cau`) quan MyMemory retorna entitats HTML en `matches[].segment` (apòstrofs valencians `'`)
- **Fitxers:** `src/data/traductorLliure.js:285-292,317-327,406-412`, `src/components/PedraSeca/hooks/useTraduccioPagina.js:244-251`
- **Problema:**
  1. `llegixMyMemory` compara `entrada.segment.trim() === tros.trim()`, però MyMemory codifica entitats HTML dins de `matches[].segment` (p. ex. `'L&#39;Alcoià'` o `'&amp;'`). Qualsevol frase en valencià amb apòstrof `'` falla la comparació i torna `null` (`delMotor ?? text`, deixant-la sense traduir).
  2. Quan `tradueixTros` cau al mateix `text` original, `treballador` fa igualment `desaCau(clau(text), traduit)`, segellant el text sense traduir en cau per a tota la sessió.
- **Canvi quirúrgic:**
  ```js
  // A src/data/traductorLliure.js (línia 288-291): descodifica entitats en comparar `segment`:
  typeof entrada.segment === 'string' &&
  desfesEntitats(entrada.segment, tros).trim() === tros.trim() &&
  typeof entrada.translation === 'string' &&
  // I a la línia 411, no deses en cau quan el motor ha caigut al text d'origen:
  if (traduit !== text) desaCau(clau(text), traduit);
  ```

---

#### 🟡 `[MITJÀ-01]` Bloc 1 · El filtre de píndoles (`No llegits`, `Preferits`, `Grups`) s'ignora en escriure a la cerca i queda atrapat en canviar de vista del rail
- **Fitxer:** `src/sections/xat/XatSection.jsx:889-894,1056-1066,1358-1361,1420-1437`
- **Canvi quirúrgic:**
  ```js
  // 1) A src/sections/xat/XatSection.jsx (línia 893): passa `filsFiltrats` a `cercaXat`:
  () => cercaXat({ fils: filsFiltrats, missatges: messages, consulta: searchTerm, filtre: filtreCerca }),
  [filsFiltrats, messages, searchTerm, filtreCerca]
  // 2) A src/sections/xat/XatSection.jsx (línia 1061): reinicia `filtre` en canviar de vista del rail:
  setCercaOberta(false);
  setFiltre('tot');
  ```

---

#### 🟡 `[MITJÀ-02]` Bloc 3 · `cauDeViquipedia.js` no valida la llista blanca d'orígens en `imatge.llicenciaUrl`
- **Fitxer:** `src/sections/pobles/cauDeViquipedia.js:73-82`
- **Canvi quirúrgic:**
  ```js
  // A src/sections/pobles/cauDeViquipedia.js (línia 18 i 78):
  const ORIGENS_LLICENCIA = Object.freeze(['creativecommons.org', 'www.creativecommons.org', 'commons.wikimedia.org', 'www.gnu.org', 'opensource.org', 'www.opensource.org']);
  // ... i a validaImatge (línia 78):
  llicenciaUrl: url(valor.llicenciaUrl, ORIGENS_LLICENCIA, `${que}.llicenciaUrl`),
  ```

---

#### 🟡 `[MITJÀ-03]` Bloc 4 · `pecesDeHtml` pot duplicar text traduït dins d'etiquetes `<code>` i `RE_NOMS` es menja el separador entre dos noms propis consecutius
- **Fitxers:** `src/components/universal/traduccio/blocsTraduibles.js:311-335`, `src/data/traductor.js:336-337`
- **Canvi quirúrgic:**
  ```js
  // 1) A src/components/universal/traduccio/blocsTraduibles.js (línies 311 i 333):
  const dinsCodi = () => pila.some((e) => e.marca?.etiqueta === 'code');
  const afig = (text) => { if (text && !dinsCodi()) peces.push({ text, marques: actives() }); };
  // I a la línia 333: if (valida?.etiqueta === 'code') peces.push({ text: codi.get(valida) || '', marques: actives() });

  // 2) A src/data/traductor.js (línies 336-337 i 347): usa lookbehind negatiu `(?<![\p{L}\p{N}])`:
  const RE_NOMS = new RegExp(`(?<![\\p{L}\\p{N}])(${PATRO_NOMS})(?![\\p{L}\\p{N}])`, 'gu');
  ```

---

#### 🟡 `[MITJÀ-04]` Bloc 5 · Asimetria de normalització de `town_name` en `recullDadesPubliquesDelMunicipi` i neteja de `FK` (`k.fill(0)`) en `xifratXatPipeline.js`
- **Fitxers:** `src/data/exportaMunicipiOpenData.js:413,1141`, `src/data/xifratXatPipeline.js:285-304`
- **Canvi quirúrgic:**
  ```js
  // 1) A src/data/exportaMunicipiOpenData.js (línia 1141):
  return perId || normalitzaSlugMunicipi(textLinia(fila.town_name)) === slug;

  // 2) A src/data/xifratXatPipeline.js (línies 287-304): embolcalla l'emmagatzematge d'`obert` en try/catch:
  try { exigix(); /* ... línies 293-303 ... */ }
  catch (err) { obert.contingut?.a?.k?.fill?.(0); throw err; }
  ```

---

#### 🟢 `[MILLORA-01]` Bloc 6 · `plega()` en `vcardOrganitzacio.js` pot partir una seqüència d'escapament (`\n`, `\,`, `\;`) just a la frontera de 75 octets
- **Fitxer:** `src/sections/profile/vcardOrganitzacio.js:48-76`
- **Canvi quirúrgic:**
  ```js
  if (actual.endsWith('\\') && !actual.endsWith('\\\\')) {
    trossos.push(actual.slice(0, -1));
    actual = ` \\${ caracter }`;
    octetsActuals = 2 + mida;
    continue;
  }
  ```

---

#### 🟢 `[MILLORA-02]` Bloc 6 · Drecera per a emojis d'un sol punt de codi abans de `measureText` en `emojiPintable.js`
- **Fitxer:** `src/utils/emojiPintable.js:43`
- **Canvi quirúrgic:**
  ```js
  if (!glif.includes('\u200D') && [...glif.replace(/\uFE0F/g, '')].length <= 1) return true;
  ```

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
