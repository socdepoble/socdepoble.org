---
type: informe
status: esborrany
description: Auditoria dels sis encàrrecs del prompt 260925_1250 (targeta de nota buida, proves, Escriptori, identitat Sollutia, editor i tractor cognitiu) amb evidència reproduïda i verificació adversarial.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_2cf22fbf-f5d5-49ab-9b57-de86c0c7ed1f:3d27e9a2-b71e-41fb-9c6f-829d996043ae
---
# Auditoria de Claude sobre el prompt 1250 de MarIA

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2cf22fbf-f5d5-49ab-9b57-de86c0c7ed1f:3d27e9a2-b71e-41fb-9c6f-829d996043ae |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T11:16:04.823Z |
| Modificació | 2026-09-25T12:25:20Z |
| Propietari | Claude (torn torn_2cf22fbf, actor claude-opus-5.5) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), mode Ultracode |
| Tokens consumits | Mesurats en subagents: 5.662.028 (workflow 1: 2.599.842; workflow 2: 3.062.186). Context principal: no mesurat, el client no l'exposa |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-25T11:15:48Z: torn propi obert (`obrir_torn.mjs --actor claude-opus-5.5 --scope documents`). No s'ha reutilitzat el torn de Codex.
- 2026-09-25T11:16:04Z: esborrany creat amb `document.mjs context` → `create`. `create` l'ha ancorat a l'índex.
- 11:16–11:45Z: primera tanda de 7 investigadors. Han acabat tots, però el hook bloqueja l'eina `StructuredOutput` i cap no ha pogut lliurar el resultat (troballa H1). He recuperat els informes de les transcripcions.
- 11:48–12:24Z: segona tanda, amb 7 verificadors adversarials (un per dimensió), el crític de completesa i 3 agents per als buits detectats.
- 12:25Z: bolcat de les troballes verificades en este document. Cap línia de codi tocada (mode AFK del Protocol de l'Olivera).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

- **Criteris del prompt.** Per als criteris 1 i 2 (cap `<br>` solt; `TEXTOS_LLAVOR` sencer) hi ha causa arrel confirmada i correcció concreta i mínima, verificada al navegador. Els criteris 3 i 4 tenen les correccions dissenyades, però no es poden demostrar des d'este entorn: el hook no deixa executar `tancament.mjs`, `porta:scc`, `porta:orfandat`, `lint` ni `npm run porta`.
- **Proves.** Hi ha tres proves roges, no dues. La tercera és `UniversalWorkspace.test.jsx:142`. Les tres correccions cauen a `tests/` o en proves de `src/`, sense lease i sense tocar cap píxel.
- **Editor, defecte P1 nou.** Mentre s'escriu al títol, al subtítol o a l'entradilla, el cursor torna a l'inici a cada tecla i el text queda al revés. Ho he reproduït amb tecles reals: H, o, l, a donen «aloH». Cal arreglar-ho abans dels punts 1 i 5.
- **Punt 6. La diagnosi de MarIA no és correcta.** El Protocol de l'Olivera del prompt és idèntic a la plantilla, llevat d'una inserció. El que sí va alterar és el **Context**: va llevar `AGENTS.md` i el genotip i va afegir una ruta que no existix. La causa principal no és una skill desactualitzada. És que **cap porta actua quan MarIA escriu des d'Antigravity**, i que la plantilla i la porta Olivera li ensenyen `context` com a ordre de generació en lloc de `create`.
- **Punt 4.** El Mestre no pot entrar perquè no hi ha cap Supabase en marxa (`localhost:54321` refusa la connexió), no per culpa del codi client. A més, el `VITE_TENANT_ID` configurat no és el poble de la llavor, i l'entrada amb Google té tres bloquejos independents.
- **Punt 2.** Són quatre causes sumades:
  - 3 àncores fantasma per un moviment manual;
  - 53 fitxers del laboratori sense àncora;
  - 27 errors documentals;
  - el torn de Codex reutilitzat per MarIA, que caduca hui a les 17:54:56Z (19:54 CEST).

### 1. Punt 1 · Targeta UniversalCard de la nota buida

**A1 · La targeta rep HTML cru i decidix si està buit sobre la cadena crua — CONFIRMAT, P1**

- **Evidència:**
  - `src/sections/notes/NotaFitxa.jsx:68-69` fa `subtitle={item.data?.subtitle || TEXTOS_LLAVOR.subtitol}` i `body={item.data?.lead || TEXTOS_LLAVOR.entradilla}`.
  - `subtitle` i `lead` són HTML que ix del contenteditable (`NotesContext.jsx:12`, `CAMPS_HTML`).
  - `UniversalCard.jsx:156-158` els pinta com a text escapat dins d'`<h4>` i de `<p>`, de manera que un `<br>` es veu literal.
  - El títol no té el problema: `NotesSection.jsx:41` el passa per `extractPlainText`.
- **Com ho he reproduït:**
  - En estat net, n1 i n2 ja pinten `h3` / `h4` / `p` amb 0 `<br>`.
  - El defecte apareix amb els valors que genera l'editor real. Quan es buida el camp queda `"<br>"`; en prémer Retorn s'afig `"\n\n"`. Un contingut d'espais o de `\n\n` fa altura 0 però conserva els marges: eixos són els «salts de línia» que es veuen.
  - Al navegador, `extractPlainText` retorna `""` per a `"<br>"`, `"\n\n"`, `" "`, `"&nbsp;"`, `"<p><br></p>"` i `"<div><br></div>"`.
- **Correcció (lliure, `src/`):** a `NotaFitxa.jsx`, importar `extractPlainText` de `../../utils/contentAdapter.js` i passar a les línies 68-69 `extractPlainText(item.data?.subtitle, Infinity) || TEXTOS_LLAVOR.subtitol`, i l'equivalent amb `lead` per a l'entradilla. S'ha d'usar `item.data.subtitle`, **mai** `item.subtitle`: eixe camp és la data (`NotesSection.jsx:42`, A7).
- **Llei del Píxel:** verificat al navegador que `extractPlainText(n1.subtitle) === n1.subtitle` i que `extractPlainText(n1.lead) === n1.lead`. n1 i la n2 neta queden idèntiques.

**A2 · `EditableField` torna a pintar el camp a cada tecla i el text s'escriu al revés — CONFIRMAT, P1**

- **Evidència:**
  - `UniversalEditorShell.jsx:45` envia l'`innerHTML` a cada `input`, i `:48` torna a aplicar `dangerouslySetInnerHTML`.
  - El valor torna per `DocumentEditor.jsx:104-106` → `NotesContext.jsx:146-155` → `DocumentEditor.jsx:220-222`.
  - Amb un arnés sobre el mòdul real i tecles reals: `["H","oH","loH","aloH"]`. Amb ref + layoutEffect: `["H","Ho","Hol","Hola"]`.
  - Afecta els tres camps (`:182-209`), també el títol.
- **Correcció (lliure):** no reescriure el DOM mentre el camp té el focus.
  - Els hooks han d'anar abans del `return null` de la línia 39.
  - **Parany (N1):** `tooling/gates/tractor-innerhtml.mjs:18,54` només accepta la forma literal `el.innerHTML = sanitizeHtml(html || '')`. Una variable intermèdia, o una comparació escrita amb `=`, posa la porta en roig.
  - Alternativa que passa la porta sense assignar a mà: un estat «mostrat» que només seguix `html` quan el camp no té el focus, i en perdre'l.
- **Verificació:** al navegador, les tecles H, o, l, a han de donar «Hola». Cal una prova amb `rerender` i el camp enfocat.

**A3 · Un camp buidat es desa com a `<br>`, `\n\n` o un espai i sobreviu a la recàrrega — CONFIRMAT, P2**

- **Evidència:** `sanitize.js:75` permet `br`; `GlobalSaveManager.js:123-136` el desa; `NotesDataContext.jsx:65-79` el torna a aplicar.
- **Correcció (lliure):** a `UniversalEditorShell.jsx:45-46`, calcular primer `const net = sanitizeHtml(el.innerHTML); const valor = (extractPlainText(net, Infinity) || /<img\b/i.test(net)) ? net : '';`.
- **Efecte visible:** canvia el comportament del placeholder a l'editor. Entra en l'abast del punt 1, però el Mestre ho ha de saber.

**A4 / B3 · Prova roja a HEAD — CONFIRMAT**

- `npx vitest run .` → `Tests 1 failed | 358 passed (359)`, `Expected "El teu estudi d'escriptura privat" · Received "Entradilla: El text que poses ací…"`.
- La fixture de `UniversalWorkspace.test.jsx:43-51` no porta `data`, i `NotaFitxa.jsx:69` llig `data.lead`.
- **Correcció:**
  - Afegir `data: { lead: … }` a la fixture.
  - Afegir un cas **sense** `data` que espere `TEXTOS_LLAVOR.entradilla`. És literalment el criteri 2 i ha de ser obligatori.
  - Fixar `expect(isViva).toBe(true)` en lloc de l'`if/else` de `:138-148`, que accepta dues maneres de pintar (N3).

**A5 · Falten proves — CONFIRMAT, P2.** No existix `UniversalEditorShell.test.jsx`, i `NotaFitxa.test.jsx:49-59` només prova `data: {}`. Les proves s'han d'escriure primer i han d'eixir roges abans de la correcció.

**Menors:**
- A6 · la fila del llistat tria el camp sobre la cadena crua (`NotesSection.jsx:43`), P3.
- A9 · el subtítol de la targeta sempre és un `<h4>` (`UniversalCard.jsx:156`); no s'ha de tocar sense ordre, perquè afecta totes les targetes.
- N2 · cada tecla persistix un esborrany, a més del desat amb retard (`NotesContext.jsx:143-145`); amb A2 actiu, cada estat intermedi al revés arriba a IndexedDB.
- N4 · el Mur probablement pinta com a text l'HTML publicat (`MurSection.jsx:180-181`). És inferència: no s'ha llegit l'adaptador de `loadMur`.

### 2. Punt 3 · Proves

| Conjunt | Resultat a HEAD 18acb41b |
| --- | --- |
| Vitest (`npx vitest run .`) | 358/359 |
| Node, 22 fitxers coneguts de `tests/` | 220 passades, 2 fallades, 2 omeses (les omeses són esperades) |
| Grup de 7 fitxers de `tancament.mjs:21` | 108/109 |
| `tooling/**/*.test.mjs` | no executables (hook) |

**B1 · A `backend_consolidacio` «transport» li falta `CLAU_USUARI` — CONFIRMAT, P1**

- **Evidència:** `src/data/supabase/runtime.js:4` l'importa i `:49` l'usa dins d'`actorDesat()`, que s'executa a `:54`. `isolated()` esborra els imports (`tests/backend_consolidacio.test.mjs:165`) i n'injecta 9 a mà (`:174-175`). `CLAU_USUARI` és l'únic dels 10 que no hi és.
- **Correcció (lliure):**
  - `:175`: afegir `CLAU_USUARI: 'socdepoble-user'`, que és el valor real (`identitat.js:63`).
  - `:177`: `assert.rejects(…, /Format de clau pública no admés/)`. Hui passa per error: el `rejects` sense patró accepta el `ReferenceError`.
  - No s'ha de tocar `runtime.js`.

**B2 · A la fixture de `git-hooks` li falten els fitxers que llig la frontissa — CONFIRMAT, P1**

- **Evidència:**
  - `tests/git-hooks.test.mjs:14` només copia `tooling`, `.husky` i quatre fitxers de govern.
  - `.husky/pre-commit:6` executa primer `frontissa-contingut.mjs`, que importa `pageContent.js` i `systemPages.js` i llig `sections.js` (`:69-71`).
  - La frontissa falla tancada (exit 2), i és correcte que siga així.
  - La diagnosi del pla de MarIA («ruta absoluta als assets de la Wiki») no és la causa.
- **Correcció (lliure):** dins de `setup()`, abans de `git add .` (`:27`):
  - escriure un Mas sintètic com el de `tests/frontissa-contingut.test.mjs:18-21`: `pageContent.js` amb `PAGE_COPY={projecte:{title:'P',html:'<p>p</p>'}}` sense importar `legalContent.js`, `systemPages.js` amb `SYSTEM_PAGES=[{key:'projecte'}]` i `COVER_PAGE_KEYS={}`, i `sections.js` amb `SECTIONS=[]`;
  - executar `frontissa-contingut.mjs --inicia --per Fixture`.
  - No s'ha de copiar el `src/` real, perquè lligaria la prova al contingut viu. No s'ha de tocar ni la frontissa ni `.husky`.
- **Endurir `:46` (B4).** Hui la regex `/REFLEX|active|ENOENT|lease/` dona **verd fals** si falta `sections.js`, perquè l'eixida conté «ENOENT». Cal exigir `✅ [Frontissa]`, `✅ [Taxonomia]` i `reflex_petorreta\.mjs verify --operation=git-commit --staged:[\s\S]*\[REFLEX\]`.
  - **No** s'ha d'afegir el `doesNotMatch /\[Frontissa\]/` que proposava l'investigador: quan les portes passen imprimixen `✅ [Frontissa]` i la prova donaria un roig fals.
  - `pre-merge-commit` i `pre-applypatch` necessiten la mateixa asserció. `post-applypatch` va per un altre camí (`consume-commit`).

**B-N1 · `node --test` amb diversos fitxers ignora en silenci els que no existixen — CONFIRMAT, P2 latent.** Si es reanomena un fitxer de `package.json:78,87,89` o de `wiki-integrity.yml:40`, la llista continua eixint verda. Correcció, amb lease: una prova que comprove que cada fitxer llistat existix.

**B5 / B7 · Proves fora de la cadena — PARCIAL, P2.**
- `frontissa-contingut.test.mjs` i `porta-taxonomia.test.mjs` (9/9) no les executa cap cadena ni la CI.
- La frontissa comprova el disc, no l'índex (`git-staged.mjs:40` no la inclou).
- Correcció amb lease.
- B9, P3: `frontissa-contingut.test.mjs:13` deixa directoris temporals.

### 3. Punt 2 · Tancament i orfandat de l'Escriptori

**C1 · Tres àncores fantasma — CONFIRMAT, P1**

- **Evidència:**
  - `00_index_escriptori.md:155,157,159` apunten a `260924_1953_auditoria_codex`, `260924_1910_prompt_codex` i `260924_1910_pla_implementacio_codex`.
  - `git status`: els tres fitxers apareixen esborrats i hi ha una carpeta nova sense seguiment, `90_arxiu_historic/260924_Tanda_Codex_Vesprada/`.
  - `npm run porta:olivera` → exit 1, «Àncores a documents que ja no són a l'Escriptori: 3».
  - L'SCC ho compta com a 6 `LINK_INVALID`, perquè resol cada enllaç dues vegades (`verificador-scc.mjs:110,145`).
  - El moviment es va fer a mà: `--arxiva` hauria despenjat les àncores i hauria deixat els fitxers a l'arrel de l'arxiu, no en una subcarpeta.
- **Correcció (lliure):** substituir les línies 155-159 per una secció «Relleu arxivat a mà (260924, torn de Codex, vesprada)» amb àncores `[[../90_arxiu_historic/260924_Tanda_Codex_Vesprada/<nom>]]`, seguint el patró de les línies 72-78.
  - **Els noms de l'arxiu no s'han verificat**, perquè AGENTS §5 prohibix llegir la carpeta.
  - `porta:olivera` no comprova les àncores que porten `/` (`:87`). La prova vàlida és `porta:scc` o `porta:orfandat`, i les ha d'executar el Mestre.

**C2 · 53 `ESCRIPTORI_UNANCHORED`, tots dins de `02_investigacio_ia` — CONFIRMAT, P1**

- **Repartiment:** 34 del laboratori (carpetes 1410, 1505, 1700 i 1815), 18 de `001 NEXUS/` i 1 zip.
- **Causa:** l'SCC exigix una àncora per fitxer a `00_index_escriptori.md` (`verificador-scc.mjs:103-128,246-257`). Les carpetes del laboratori estan escrites entre accents greus (`:121-124`), i `document-links.mjs:7` els esborra abans de buscar enllaços.
- **Conseqüència:** `02_investigacio_ia` està versionat (inferència forta), així que el tancament de l'arbre preparat també bloqueja els commits.
- **Decisió del Mestre:** afegir 53 àncores fitxer a fitxer (lliure, però l'índex creix), o que l'SCC accepte una àncora de carpeta per al laboratori (lease).

**C3 · MarIA ha emés els seus rebuts dins del torn de Codex — CONFIRMAT, P1**

- **Evidència:** `torn_168ee747….json:4` té `"actor": "codex"` i `:10` `expiresAt 2026-09-25T17:54:56.065Z`. Els rebuts dels documents 1250 són de les 10:52:53Z (`:1017-1036`).
- **Conseqüència:** a partir de les 17:54:56Z, `turns.mjs:44` retornarà «Torn caducat» com a únic error per als dos documents.
- **Correcció:** que MarIA òbriga el seu torn i torne a emetre els documents complets i vàlids d'una sola vegada. Una edició puntual del camp `reflex` no passa el Reflex, que valida el contingut sencer. Vegeu la contradicció 7.

**C4 · El torn `torn_168ee747` ja no es pot tancar — PARCIAL, P2**

- El pla vinculat (1910) ja no hi és, i tres rebuts apunten a fitxers esborrats sense relleu.
- Un `handoff` tampoc el salvaria:
  - el hook de Claude no l'autoritza (`command-policy.mjs:78-79`);
  - després del relleu, `anchored()` exigiria àncores sense ruta que l'SCC rebutja (C5).
- **Recomanació:** deixar-lo caducar i anotar-ho a l'ESTAT i al LEDGER com a «caducat sense tancar».

**C5 · Quatre criteris d'enllaç incompatibles — CONFIRMAT, P1**

- `anchored()` (`core.mjs:150-154`, `turns.mjs:170`) exigix àncores sense ruta després d'un relleu.
- L'SCC (`document-links.mjs:20`) i l'Olivera (`porta-olivera.mjs:87`) les rebutgen.
- El compilador de la Wiki les accepta (`fortificacio.test.mjs:206-215`).
- **Correcció amb lease:** un sol resolutor (`resolveDocumentLink`) per a totes les portes, abans de qualsevol arxivament.

**C-N1 / F2-N1 · Col·lisió estructural — CONFIRMAT, P1**

- La porta Olivera considera ranci tot prompt, auditoria o pla amb data anterior a hui (`porta-olivera.mjs:40,67-69`) i bloqueja les petorretes mentre n'hi haja (`:95-98`).
- Un torn viu 24 hores (`turns.mjs:78`).
- `--arxiva` mou els fitxers sense `handoffDocument` i sense consultar `protectedTurnFiles` (`turns.mjs:222-233`, que ja existix però no la crida ningú).
- `handoff` no és al circuit del hook.
- **Resultat:** cap agent té un camí executable per arxivar un document d'un torn obert i deixar el torn tancable. És la causa comuna de C1, C3 i C4.
- **Contradicció amb la doctrina:** `core-higiene-escriptori` diu que «la data per si sola no autoritza moure contingut», i AGENTS §12 diu que no s'ha de buidar l'Escriptori a cegues.

**C6 · 14 `ORPHAN_OPERATIVE` — PARCIAL, P2.** 13 són els `.md` de `001 NEXUS/`, i es resolen amb C2. El 14è és fora de la Wiki: el candidat més probable és `var/`, que l'SCC no exclou (`verificador-scc.mjs:29`). No està verificat.

**C7 · `porta:documents` ix roja amb 27 errors — CONFIRMAT.** 18 són del pla 1250, 4 del prompt 1250 i 5 d'esta auditoria mentre era esborrany; esta última part queda resolta amb este lliurament. La casella del prompt «els enllaços resolen (`npm run porta:orfandat`)» està marcada, però és falsa.

**Estat enfront de l'ESTAT:**
- L'«orfandat 0/0» d'`ESTAT.md:12` era cert abans del moviment manual. Ara la previsió és 3 enllaços trencats.
- El «checksum del LEDGER invàlid» descriu l'estat anterior a la renovació que va fer Codex. `LEDGER.md:545` porta el HASH nou, però no l'he pogut verificar.

### 4. Punt 4 · Identitat i autenticació amb Sollutia/Supabase

**D1 · No hi ha cap backend Supabase en marxa ni reproduïble — CONFIRMAT, P0**

- **Evidència:**
  - `GET http://localhost:54321/auth/v1/health` → `net::ERR_CONNECTION_REFUSED`.
  - L'app corre amb `VITE_DATA_MODE: "seed"`.
  - No existix `supabase/config.toml`.
  - `supabase/seed.sql:25-27` ja conté el poble per defecte: només cal aplicar-lo.
  - L'entrada amb contrasenya no depén del mode de dades: `request()` només exigix URL i clau (`runtime.js:56-57`).
- **Migracions:** 17 fitxers amb només 10 prefixos distints (5 prefixos repetits, 11 fitxers). Amb el SQL Editor en ordre alfabètic (`README.md:49-57`) no importa. Si s'adopta la CLI, cal normalitzar els noms a 14 dígits.
  - Amb eixa normalització, l'exempció per nom de `tooling/gates/tractor-rls.mjs:170` deixa de casar i la porta RLS es posa roja. Corregir-la requerix lease.

**D-N1 · El poble de `.env.local` no és el poble de la llavor — CONFIRMAT, P1**

- Comprovat al navegador, sense mostrar el valor: `igualAlSeed: false`.
- Cap SQL del repositori crea eixe poble.
- El trigger vigent (`260915_0000:42-90`) exigix `tenant_id` i `is_open`:
  - **Alta per correu:** salta amb SDP-REG-003 (inferència).
  - **Usuari nou de Google:** no porta `tenant_id` i salta amb SDP-REG-001 (fet de codi).
- **Correcció d'una troballa anterior:** la «regressió d'`is_open`» (D7) és **falsa**. `260915` torna a posar la comprovació.

**D2 · L'entrada amb Google no pot acabar: tres bloquejos independents — CONFIRMAT**

1. El client posa un `state` propi a `/authorize` (`oauthRelay.js:182-190`) i exigix rebre'l de tornada (`:246-249`, `:361-368`).
   - El client oficial `@supabase/auth-js` 2.112.4 no envia mai `state` (`GoTrueClient.js:4787-4808`).
   - Això sí que ho confirma: el bescanvi PKCE (`/token?grant_type=pkce`, `:1621-1626`) coincidix amb `oauthRelay.js:53-54`. L'avís «A VERIFICAR» ja es pot tancar.
2. La llista blanca de redireccions es compara incloent la query (`GoTrueClient.js:4813-4815`), i `redirect_to` porta `?sdp_origin=…&sdp_path=…`. Cal registrar-la amb comodí.
3. L'alta de Google no porta `tenant_id` (D-N1).

- **Correcció (lliure):**
  - Llevar `state` de `/authorize`. És obligatori.
  - Després, triar entre confiar només en PKCE (com supabase-js) o portar un nonce dins de `redirect_to`.
  - La prova `oauthRelay.test.js:10` es fabrica `?code=code&state=state`: cal que torne només `?code=`.

**D3 · Emmagatzematge i CSP — PARCIAL, P2**

- El JWT i el refresh token es guarden a `sessionStorage` (`identitat.js:135-142`).
- `connect-src` admet qualsevol origen HTTPS (`index.html:8`, `vercel.json:8`). El comentari «connect-src acotat» (`index.html:7`) és fals.
- `service_role` sí que està bloquejada (`publicCredentials.js:19`).
- En mode incrustat sense iframe s'aplica la CSP de la pàgina amfitriona: iframe o no iframe és decisió del Mestre.
- N2: la CSP bloqueja `127.0.0.1:54321`, que és l'URL que imprimix la CLI. Cal usar `localhost`.

**D4 · La sessió externa de Sollutia no es pot validar ni renovar — CONFIRMAT, P1 abans d'integrar Sollutia**

- L'emissor efectiu és `https://auth.socdepoble.org` (`main.jsx:18-19`), i `VITE_SOLLUTIA_ISSUER` s'ignora en eixe camí.
- La renovació va sempre al GoTrue de SdP (`auth.js:13-37`).
- La doctrina es contradiu: `host.js:5` («Supabase SdP continua autoritatiu») contra `identitat.js:216` («Qui decidix si el token val és Sollutia, sempre»).

**Menors:**
- D5, P2: quatre llistes d'orígens que no coincidixen. Incrustat a `v2.sollutia.com`, el relé rebutja l'origen (`callback.html:132-139`).
- D6, P3: si el JWT ha caducat en arrencar, `RequireAuth` redirigix abans de la recuperació.
- D8, P2: no hi ha cap camí per fer superadmin el Mestre (els inserts estan comentats). Les dues sobrecàrregues d'`admin_list_users` conviuen: cal un `drop` en una migració nova.
- D9, P3: R5 de `tractor-rls.mjs:198` no reconeix `grant` amb diversos privilegis. Provat amb la regex literal: dona `null` per a `260914_0100:48`.

**Proposta d'arquitectura per fases (auditoria; cap canvi aplicat):**

1. **Infraestructura (tasca humana):**
   - `supabase start` o un projecte allotjat a la UE;
   - `VITE_TENANT_ID` igual al poble de la llavor, o crear el poble en una migració;
   - usar `localhost`;
   - aplicar les migracions i la llavor;
   - donar el rol de superadmin per SQL manual.
   - **Acceptació:** `/auth/v1/health` torna 200; alta → `town_memberships` omplit → entrada → `/admin`.
2. **Llesca «identitat» (`src/data/`, lliure):**
   - una sola font d'emissor i audiència (`runtimePolicy.js` + `main.jsx`);
   - renovació que depenga de l'emissor;
   - recuperació en arrencar quan hi ha refresh token;
   - no enviar JWT caducats;
   - proves per a `adoptaSessioExterna`, `runtimePolicy` i `RequireAuth`, que ara no en tenen cap.
3. **OAuth:** els tres bloquejos de D2, el relé desplegat al mateix origen que `RELAY_PER_DEFECTE` i un camí per assignar poble als usuaris de Google (decisió del Mestre).
4. **Enduriment:** CSP acotada, un sol mòdul d'orígens amb una prova que el compare amb `callback.html`, consentiment versionat al servidor, `confirmationEmail`, recuperació de contrasenya i porta RLS corregida (lease).
5. **Fora d'abast però lligat:** entrar com a usuari no fa que es publique amb eixa identitat. `NotesContext.jsx:214-215` fixa `author_name` a «Sóc de Poble».

- Tot respecta l'endoll del Model B i el Baseline 2022, sense cap dependència nova.

### 5. Punt 5 · Editor universal

**E1 · La barra grisa ocupa la fila que pertany a la barra blava — CONFIRMAT, P1**

- **Evidència:**
  - `DocumentEditor.jsx:195-213` construïx `.sdp-editor-meta` i `:219` l'enganxa (`topBar={<>{topBar}{metaBar}</>}`).
  - Mesurat a 1024×768: les eines són a `@122`, la barra grisa a `@180` amb 58px, i el document a `@238`.
  - La fila `@180` és la que la skill `sdp-app-grid-shell` §2 reserva a la barra blava, que també fa 58px.
  - Va nàixer amb el pla 1710 («rebut fals i fora de plantilla», `ESTAT.md:28`).
  - Referència que ja funciona bé: el Perfil (`DetallAjust.jsx:313-321`) passa només `UniversalToolbar`.
- **Correcció (lliure):**
  - Eliminar `DocumentEditor.jsx:193-213` i deixar `topBar={topBar}`.
  - Llevar `metaActions` i `CAP_META` quan ja no s'usen.
  - La CSS morta és només `.sdp-editor-meta*` (`modules.css:3512-3548,3554-3561`). Les regles de `.sdp-copyright-selector` s'han de conservar i adaptar al bloc blanc.

**E2 · La llicència no té contracte de dades — CONFIRMAT, P1**

- `notes.js:13-17,20,114-116,128-132` no la llig ni l'escriu, i `publishNote` no l'envia.
- El Mur la té fixa al codi (`MurSection.jsx:190`).
- **E-N1 (inferència forta):** canviar-la en mode connectat envia un PATCH amb cos `{}`, i probablement dona un conflicte fals (409 i toast).
- Mentre no hi haja una columna acordada amb Sollutia, el selector és decoració. Recomanació: amagar-lo o deixar-lo en només lectura fins a la fase de dades.

**E5 · Les etiquetes antigues de n1 desapareixen en el primer desat del diàleg — CONFIRMAT, P2**

- `appSeed.js:70` té `labels` i no té `categories`.
- El diàleg parteix de `categories || []` (`NotesEditor.jsx:226`).
- Afecta també el sandbox del Foraster.
- Cal sembrar el diàleg des del mateix model que pinta les píndoles abans d'afegir el «+».

**Menors:**
- E3, P2: el valor per defecte «© Sóc de Poble» contradiu l'avís legal («el contingut que publiques continua sent teu», `legalContent.js:54`).
- E4, P2: al selector apareix una opció duplicada.
- E6, P3: la diana de la píndola interactiva fa 24px i depén de `:has()`, fora del Baseline.
- E7, P2: el `Camp` de Pedra Seca no pot anar dins de `<p class="page-title-copyright">`. Cal una prop opcional a `PageFrame` que deixe el DOM idèntic quan no s'usa.
- E8, P3: si es lleva la barra i es deixa `metaActions`, `NotesEditor.test.jsx:37-42` queda verda sobre una interfície morta.
- E9, P3: l'editor no té cap prova pròpia.
- N2, P3: dependència circular `DocumentEditor` → `NotesSection` → `NotesDetail` → `NotesEditor` → `DocumentEditor`.

**Disseny proposat:**
- La barra blava passa a la fila 2, just davall de les eines, com al Perfil.
- Categories i etiquetes queden davall del títol, com ja fa `PageFrame.jsx:299-327`, amb un «+» que tinga un modificador propi: diana de 44px, sense `:has()`, provat primer a `DesignSection`.
- La llicència va al peu del bloc blanc, en lloc del «©», amb codis estables en un fitxer nou (`src/components/universal/llicencies.js`) i l'etiqueta separada del valor.
- Cap píxel ha de canviar a Mur, Perfil ni Pàgines.

### 6. Punt 6 · El tractor cognitiu de MarIA

**Per què li ha passat.** Fets, en ordre:

1. **`document.mjs check` rebutja els dos documents.**
   - Prompt, 4 errors: «Secció absent o pendent: Riscos», «Bloc normatiu alterat: Context», «Bloc normatiu alterat: Protocol de la Reunió a l'Olivera», «Registre: falta Tokens consumits».
   - Pla, 18 errors: `type: pla` fora de l'enum i cap secció de `pla_implementacio.md`.
2. **La diagnosi pròpia no és correcta.** El Protocol del prompt és idèntic a la plantilla, llevat de la inserció «(`260925_1250_pla_implementacio_claude.md`)» al punt 3. En canvi:
   - el **Context** perd `AGENTS.md` i `02_genotip.md`, guanya «exclusivament si no els tens frescos» i cita `_wiki_de_poble/04_arquitectura_disseny/arquitectura_cognitiva.md`, que **no existix**;
   - «Riscos» es reanomena;
   - desapareixen l'ADVERTÈNCIA D'INVIOLABILITAT i la «Instrucció Obligatòria»;
   - la taula del Registre perd la capçalera i el delimitador, i per això no es renderitza;
   - «Model IA» diu el destinatari («Claude»), no el motor de qui escriu.
3. **No ve de `create`.** No porta cap marcador `SDP:SECTION` i té `visibility: public`, quan `create` escriu `private` (`document.mjs:14,23`). Està escrit a mà, amb un rebut de `context` demanat sobre el torn d'un altre actor.

**Cadena causal** (el que canvia el resultat, per ordre de pes):

1. **Cap porta actua quan MarIA escriu (P0).**
   - `.agents/hooks.json:2` declara el consumidor Antigravity «no acreditat. Cap garantia d'activació».
   - `porta-plantilla-viva.mjs:7-8` diu que Antigravity no executa els hooks de Claude Code.
   - `.agents/runtime/plantilla-viva.log` no existix: el vigilant no ha escrit mai.
   - Si el hook de Claude haguera jutjat l'escriptura, `hooks-local.mjs:107-110` l'hauria rebutjada.
   - A més, per al dialecte d'Antigravity les portes retornen el codi 1, no el 2 (`porta-olivera.mjs:147,167`).
   - Les úniques portes que la veuen són les del pre-commit, i el receptor llig el prompt del disc abans de cap commit.
2. **La plantilla i la porta ensenyen `context` com si fóra l'ordre de generar (P1).**
   - `prompt_local.md:26-27` diu «generat per `document.mjs context`», i `porta-olivera.mjs:101` diu «Genera'l abans: … context». Cap dels dos nomena `create`.
   - `wiki-cicle-de-vida` ordena `create`, però la skill de MarIA el descriu com a opcional (`wiki-documentacio-i-reflex:34`).
   - La REGLA 0 (`AGENTS.md:12-13`) mana heretar el frontmatter de la plantilla, que és `type: plantilla`. El frontmatter de l'eixida viu dins del comentari `SDP:EIXIDA`.
   - D'ací probablement ve `type: pla`: `pla_implementacio.md:7` porta l'etiqueta `pla`.
3. **L'ADVERTÈNCIA demana copiar «tot», cosa impossible, i no hi ha lloc per a la ruta del pla (P1).**
   - La maquinària només protegix 2 blocs (`protocolledge.json:83-86`, `core.mjs:123-127`), però la plantilla exigix una «còpia literal i íntegra … de tot el document», i les caselles, el Registre i la Instrucció del torn s'han d'editar per força.
   - La skill mana «llistar la ruta dels documents» al prompt (`:68`) i no diu on. El punt 3 del bloc fix nomena el Pla sense deixar-hi lloc. Per això la ruta acaba inserida dins del bloc.
4. **El torn no està lligat a l'actor (P1).** `deliverContext` no compara actors (`turns.mjs:86-100`). La skill no nomena `obrir_torn`, i l'ESTAT publica l'identificador del torn de Codex com si fóra vigent.
5. **Arxivar per data trenca torns (P1).** La porta Olivera obliga a buidar la taula dels documents d'ahir. Com que `handoff` no és al circuit, MarIA mou els fitxers a mà i el torn de Codex queda mort (C-N1).
6. **És, com a mínim, la quarta recaiguda:** acta `260923_2020`, prompt 1745 i pla 1710, prompt 1910 refet per Codex, i ara 1250. Segons el REFLEX DE CORRECCIÓ de `CLAUDE.md`, és una **fallada de càrrega i de mecanisme, no d'aprenentatge**. Afegir més lliçons en prosa no ho resol: l'ADVERTÈNCIA ja existia i es va eliminar sense cap efecte.

**Les tres hipòtesis del Mestre, per separat:**

- **Desactualitzades: sí.**
  - `wiki-cicle-de-vida:13` usa `--output`, però `command-policy.mjs:71` només admet `--actor` i `--scope`.
  - `:18` mana `handoff`, que queda fora del circuit.
  - `:20` mana `tancament.mjs`, que el hook no deixa executar.
  - `prompt_local.md:25` mana `porta:orfandat`, que tampoc s'executa.
  - `prompt_local` es declara 2.3.0 i el contracte diu 2.2.0 (`protocolledge.json:70`).
  - El Registre té 14 files a la plantilla, 9 al contracte i 10 a `draft()`.
  - `core-consell-i-colmena:29` imprimix «[object Object]».
  - Nota: les restriccions són del hook de Claude. MarIA, sense hook, sí que pot executar eixes ordres. Això explica per què Claude no pot tancar torns, però no explica la fallada de MarIA.
- **Mal enllaçades: sí.**
  - Sis skills no tenen symlink a `.claude/skills/`: `core-taxonomia-estricta`, `core-higiene-escriptori`, `core-edicio-segura`, `core-automillora`, `sdp-universal-editor` i `core-estrategia-ia`.
  - Els censos no quadren: 22 a `00_INDEX_SKILLS.md`, 17 a `skills_index.json` i 16 carregades.
  - `.agents/rules/00_BIOS_COGNITIU.md` no llista cap skill obligatòria, i per això R5 i R6 de `tractor-registre.mjs` no s'executen mai.
  - `sdp-workflow:30` s'autoreferencia i `:21` envia a `90_arxiu_historic`.
  - `wiki-propagar-veritat` està corrompuda: té un `\n` literal, un `sed` que no canvia res i prescriu un `find … sed -i` massiu, contra la llei de l'abast per superfície.
  - `build_skills_index.mjs --check` no pot fallar mai (`:65`).
- **Deute tècnic: sí.**
  - Filosofia dins de la skill (`wiki-documentacio-i-reflex:20-25`), contra AGENTS §1.
  - Lliçons en prosa negativa i en majúscules (`:80`, `:85`).
  - Numeració trencada: «1, 2, 5» i dos punts 4.
  - Les quatre lliçons anunciades a `wiki-cicle-de-vida` s'han perdut (`LEDGER.md:120`).
  - Contradiccions entre skills: MACRO per a les IAs locals contra «únicament prompt»; «deduir l'estat mental» contra «el substitut es demana».
  - Refutat: la suposada contradicció entre el genotip (manifest) i «no mutilar les fonts triades» no és tal. Diuen el mateix.
- **Veredicte:** les tres hipòtesis són certes, però cap és la causa principal. Encara que les skills foren perfectes, sense un mecanisme al punt d'escriptura MarIA continuaria depenent de la memòria. I la memòria és justament el que falla.

**Proposta arquitectònica per al cervell de MarIA:**

1. **«La plantilla escriu, l'agent omple».** Una ordre documental, ampliant `create` o una de nova com `document.mjs compon`, rep només el contingut de les seccions editables (un fitxer d'entrada per seccions), munta el document a partir de la plantilla i del rebut, el valida i l'escriu. MarIA no escriu mai el document sencer. Si el Mestre ho preferix, la creació es delega en un agent que tinga hook actiu.
2. **Porta al receptor, sense bloquejar.** A `SessionStart` (`despertar.mjs` o `context-local.mjs`) i a `PreToolUse Read` (`hooks-local.mjs:82`), injectar els errors d'`inspeccionaText` quan un agent llig un prompt o un pla invàlid, junt amb el bloc literal de la plantilla. Així Claude i Codex no consumixen un prompt mutilat encara que Antigravity no tinga hooks.
3. **Torn lligat a l'actor.** `--actor` obligatori a `context` i a `create`, comparat amb `turn.actor`. La skill comença per `obrir_torn --actor maria --scope documents`.
4. **Una sola seqüència literal**, idèntica a AGENTS §0, QUI_SOC §4, la skill, `core-taxonomia-estricta` i `PROTOCOL_PETORRETA` P-13: `obrir_torn` → `context` → `create` → omplir només les seccions `[pendent]` → `check` fins a `valid:true`. La REGLA 0 ha de dir «hereta el bloc `SDP:EIXIDA`», no el frontmatter de la plantilla.
5. **Skills = procediments verificables.** Cada pas ha de ser una ordre amb l'indicació de qui la pot executar (hook de Claude, Codex, MarIA, el Mestre). La filosofia se'n va a la Wiki. Les lliçons es convertixen en proves o portes, amb una taula «garantia → prova». Un sol generador de censos, amb un mode que falle.
6. **Arxivar per estat del torn, no per data.** `--arxiva` ha de respectar `protectedTurnFiles` i registrar el relleu. Un sol resolutor d'enllaços (C5).
7. **Acreditar Antigravity.** Capturar un payload real d'una escriptura de MarIA (hi ha tres formats esperats i cap de verificat: `hooks-local.mjs:121`, `.agents/hooks/verify.mjs:16-18`, `preflight_matrix_wrapper.mjs:6`) i fer una escriptura invàlida de prova.

Governança: els punts 1-7 toquen `tooling/`, `.agents/` i `AGENTS.md`, i requerixen `executor-mutacio.mjs` amb lease i l'aprovació del Mestre.

### 7. Troballa transversal · El hook bloqueja eines que no escriuen

**H1 · `StructuredOutput` bloquejada — CONFIRMAT, P2**
- `hooks-local.mjs:84-90` només deixa passar una llista tancada d'eines. `StructuredOutput`, `WebFetch`, `WebSearch` i `mark_chapter` hi cauen com a «Eina opaca».
- Conseqüència: tot workflow amb esquema falla. La primera tanda d'esta auditoria (2,6 M de tokens) no va poder lliurar res i els informes es van haver de recuperar de les transcripcions.
- Correcció amb lease: afegir `StructuredOutput` a la llista (no escriu al disc).

**H2 · Les verificacions de només lectura que demanen les skills no són a la llista del hook — CONFIRMAT, P2**
- `tancament.mjs --check`, `porta:scc`, `porta:orfandat`, `verify-ledger.mjs`, `porta-autoritat.mjs`, `cataleg_skills --check`, `compile-wiki-to-app --check --strict`, `npm run lint`, `npm run porta` i `git ls-files`.
- Cap agent amb hook pot demostrar els criteris 3 i 4.
- Correcció amb lease: afegir-les a `READ_NODE_COMMANDS` (`mutation-policy.mjs:43-51`), amb les formes exactes.

### 8. Esmenes al Pla d'Implementació de MarIA (Protocol de l'Olivera §3)

- **El pla és invàlid** (18 errors) i no es pot vincular amb `plan` (`turns.mjs:135`, `command-policy.mjs:104`). S'ha de regenerar amb `create` en un torn propi de MarIA.
- **Fase 1:** el problema no és un `<br>` dins de `TEXTOS_LLAVOR`. És que el buit s'avalua sobre HTML cru (A1). A més, cal A2 abans: amb el text escrivint-se al revés no es pot provar el punt 1 a mà.
- **Fase 2:** «fixar o arxivar» no s'ha de fer amb `--arxiva`, perquè trenca torns. Cal reapuntar les àncores (C1) i decidir sobre les 53 del laboratori (C2).
- **Fase 3:** la causa de `git-hooks` és la fixture sense les entrades de la frontissa, no una «ruta absoluta als assets de la Wiki». Hi ha una tercera prova roja (B3).
- **Fase 4:** el bloqueig és d'infraestructura i de configuració (D1, D-N1), no de codi.
- **Fase 5:** «part superior absoluta» contradiu la skill `sdp-app-grid-shell` §2. Recomane la fila 2, com al Perfil. El «+» que desapareix en publicar ja és el comportament natural (`NotesContext.jsx:173` recalcula les etiquetes). La llicència necessita contracte de dades (E2).
- **Alternativa 2 del pla:** l'ordre neteja → autenticació és correcte, però el motiu real no és el segell (`porta:segella` està verda). Són les portes documentals i l'SCC.

### 9. Millores a `prompt_local.md` (Protocol de l'Olivera §4)

1. Reescriure l'ADVERTÈNCIA: «Són còpia literal i íntegra el Context i el Protocol de la Reunió a l'Olivera; la resta de seccions s'omplen». Hui demana l'impossible, i això fa que tot semble negociable.
2. A les caselles del §0 (`:26-27`), dir «`context` + `create`», no «generat per `context`».
3. Dins d'«Instrucció del torn», una subsecció `### Documents de la taula` per al pla, les auditories prèvies i les lectures addicionals comprovades amb Read. El punt 3 del Protocol pot dir «(la ruta és a Instrucció del torn)». Només `###`: un `##` nou posaria roja `porta:plantilles` sense tocar `protocolledge.json`.
4. Alinear la versió (2.3.0 o 2.2.0) i les files del Registre entre la plantilla, `protocolledge.json` i `draft()`.
5. Conservar la secció 0: llevar-la trencaria `porta-olivera.mjs:109-111`.
6. A `pla_implementacio.md:20`, el nom prescrit ha de ser `aammdd_hhmm_pla_implementacio_<cognom>.md`. Amb el nom actual, les portes classifiquen el pla com una altra ruta.

### 10. Ordre d'execució recomanat

1. **Fase 0, el Mestre:**
   - executar les verificacions de H2 per fixar la línia base;
   - decidir sobre el torn de Codex (deixar-lo caducar), sobre els documents 1250, sobre les àncores de C1 i C2 i sobre `var/`;
   - decidir la lectura de «barra blava adalt de tot» i la llista de llicències.
2. **Fase 1, `tests/`:** B1 amb el seu matcher → B2 amb l'asserció endurida → B9.
3. **Fase 2, punt 1:** A5 en roig → A1 → B3/A4/N3 en el mateix canvi → A6 → A2 i A3 (amb la forma literal de N1) → un sol desat per canvi (A-N2 = E-N1).
4. **Fase 3, Escriptori:** C1 → C2 → C6 → C3. Després, el Mestre executa `tancament --check`, i es fa un commit amb lease Reflex estagiant junts l'índex, els esborrats i la carpeta de l'arxiu.
5. **Fase 4, punt 5 (redisseny aprovat):** E1 → E8 → E7/E6 → E5 → E4 → E9. E2 espera la fase 5; mentrestant, el selector de llicència s'amaga.
6. **Fase 5, punt 4:** primer la infraestructura humana → D2 → D6 → D8 → la convenció de migracions i `tractor-rls` (lease).
7. **Fase 6, governança amb lease:**
   - resolutor d'enllaços → `--arxiva` per estat del torn → actor lligat al torn → `handoff` al circuit → `plaDeHui` que valide el pla → `porta:plantilles` reforçada → llistes de proves;
   - porta al receptor (§6.2), H1 i H2;
   - skills i plantilles.

### 11. Decisions del Mestre

1. Quina és «la nota d'exemple», n1 o n2? En estat net, totes dues ja complixen el criteri.
2. S'arregla A2 (el text al revés) abans del punt 5? Recomanació: sí.
3. Torn `torn_168ee747`: el deixem caducar? Els documents 1250 es regeneren en un torn propi de MarIA (amb `create` cal un HHMM nou) o s'arxiven?
4. Les 3 àncores: es reapunten a l'arxiu o s'esborren? Els 53 fitxers del laboratori: 53 àncores o àncora de carpeta a l'SCC (lease)?
5. Arxivament: per data, com fa la porta Olivera, o per estat del torn i decisió humana, com diuen AGENTS §12 i `core-higiene-escriptori`?
6. `handoff`: s'afig al circuit del hook, o es reserva al Mestre?
7. Editor:
   - barra blava a la fila 2?
   - selector al peu del bloc blanc?
   - quina llista de llicències, i quina per defecte?
   - un «+» o dos?
   - es migra la llavor n1 (canvia el color de dues píndoles)?
   - què es fa amb les accions de superadmin?
8. Columna de llicència a Supabase amb Sollutia (AGENTS §8)?
9. Identitat:
   - qui emet el token, GoTrue de SdP o Sollutia amb Third-Party Auth?
   - Supabase local o allotjat a la UE?
   - quin `VITE_TENANT_ID` és el canònic?
   - Google amb PKCE sol o amb nonce a `redirect_to`?
   - iframe o element al DOM de l'amfitrió?
   - text i versió del consentiment RGPD?
   - qui és superadmin?
10. S'accepta la porta al receptor (§6.2) com a via principal, en lloc de perseguir l'activació dels hooks d'Antigravity? Pots capturar un payload real d'Antigravity?
11. Afegim `StructuredOutput` i les verificacions de només lectura de H2 a la llista del hook?

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Mètode.** Hi ha dues fases separades, cacera i refutació:
- 7 investigadors, un per dimensió: A targeta, B proves, C Escriptori, D identitat, E editor, F1 maquinària documental i F2 skills;
- 7 verificadors adversarials, que van rellegir les línies citades, van tornar a executar les ordres i van intentar refutar cada troballa;
- 1 crític de completesa;
- 3 agents per als buits: el tancament, la suite de proves i les migracions amb GoTrue.

Cap agent ha escrit al disc. Per al navegador han fet servir pestanyes pròpies en segon pla; la pestanya del Mestre no s'ha tocat i IndexedDB tenia 0 esborranys abans i després.

**Resultat de la refutació.** Cap troballa central ha caigut. Sí que s'han corregit o refutat afirmacions concretes:
- La «regressió d'`is_open`» (D7) és falsa: `260915` torna a posar la comprovació.
- El desajust de signatura d'`admin_list_users` (D8) és parcial: les dues sobrecàrregues conviuen.
- El `doesNotMatch` de B4 donaria roigs falsos.
- Copiar el `pageContent.js` real a la fixture (C9) queda superat pel Mas sintètic (B2).
- Una fila de contradicció d'F2-A9 era falsa.
- La inserció del Protocol (F1-A3) no és una «contradicció mecànica», sinó la falta d'un lloc designat.
- Un investigador va citar l'execució d'una prova que no existix (`tests/porta-plantilla-viva.test.mjs`). El verificador ho va detectar.

**Ordres executades i eixides:**

| Ordre | Resultat |
| --- | --- |
| `node --test tests/backend_consolidacio.test.mjs` | 13/14, `ReferenceError: CLAU_USUARI is not defined` (`:179`) |
| `node --test tests/git-hooks.test.mjs` | 7/8, `[Frontissa] Cannot find module …/src/sections/text/pageContent.js` |
| `npx vitest run .` | 1 fallada, 358 passades (359) |
| `node --test` sobre 22 fitxers de `tests/` | 220 passades / 2 fallades / 2 omeses |
| `node tooling/wiki/document.mjs check --file …1250_prompt_claude.md` | `valid:false`, 4 errors |
| `node tooling/wiki/document.mjs check --file …1250_pla_implementacio_claude.md` | `valid:false`, 18 errors |
| `npm run porta:documents` | exit 1, 27 errors en 4 documents (abans d'este lliurament) |
| `npm run porta:olivera` | exit 1, 3 àncores fantasma; accepta el pla 1250 només pel nom |
| `npm run porta:plantilles` | verda, 13 rutes (compara només capçaleres i blocs fixos) |
| `npm run porta:segella` | verda, `a3953a1b` |
| `npm run porta:rls` | verda, 18 fitxers SQL (R5 cega als `grant` de diversos privilegis) |
| `npm run porta:enxufe` | roja, 13 infraccions E4 en fitxers de prova |
| `npm run porta:design-guard` | passa, 41 crítics i 5 avisos (trinquet) |
| Navegador: `GET localhost:54321/auth/v1/health` | `ERR_CONNECTION_REFUSED` |

**Com es verifica cada correcció.** Cada troballa porta el seu pas de verificació. Resum:
- `node --test` fitxer a fitxer i `npx vitest run .` en verd;
- al navegador, les tecles H, o, l, a han de donar «Hola», i l'`outerHTML` de n1 no ha de canviar;
- `porta:innerhtml`, `porta:scc`, `porta:orfandat` i `tancament --check` els ha d'executar el Mestre (H2);
- `document.mjs check` ha de donar `valid:true` per als documents regenerats.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Eines.** No hi ha Glob ni Grep. La Bash està confinada a lectures auditades. El mapa de fitxers s'ha tret de la llista de mòduls que el servidor Vite ha carregat i seguint imports. Pot haver-hi fitxers de `tests/` i de `tooling/` que no s'han vist: 22 fitxers de proves és una cota inferior.
- **No executat:**
  - `tancament.mjs`, `porta:scc`, `porta:orfandat`, `porta:innerhtml`, `verify-ledger`, `lint`, `npm run porta`, `node --test tooling/…` i `git show` o el diff de commits: el hook ho bloqueja;
  - WebFetch, per consultar la font de GoTrue i de la CLI de Supabase: bloquejat.
  - El comportament de GoTrue al servidor i la col·lisió de versions de la CLI són coneixement del model i estan marcats com a tal.
- **No llegit:** el contingut de `90_arxiu_historic/` (AGENTS §5). Els noms reapuntats de C1 no estan verificats. Tampoc s'han llegit `.env` ni cap secret: les variables `VITE_*` s'han comparat al navegador exposant només booleans.
- **No provat en real:** res de l'app s'ha escrit. A2 i A3 s'han reproduït en un arnés amb el mòdul real i tecles reals. E-N1 (PATCH buit) és inferència del codi i del comportament de PostgREST.
- **Temps.** El torn de Codex caduca a les 17:54:56Z. A partir d'eixa hora, els errors dels documents 1250 canviaran a «Torn caducat». Demà, la porta Olivera tornarà a eixir roja pels documents 260925.
- **Arbre concurrent:** les línies citades són les d'esta sessió.
- **Tancament del torn.** No he pogut actualitzar `.agents/ESTAT.md` ni `.agents/LEDGER.md` (governança, cal lease) ni executar `tancament.mjs` (hook). Este torn queda obert fins que el Mestre o un agent amb permís faça el relleu. L'Acta Marmota del 24 a la vesprada continua pendent.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260925_1250_prompt_claude]]
- [[260925_1250_pla_implementacio_claude]]
