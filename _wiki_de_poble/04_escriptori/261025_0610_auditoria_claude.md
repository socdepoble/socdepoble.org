---
type: informe
status: esborrany
description: 'Auditoria adversarial multiagent de Claude: connector WordPress, botigues, ReDoS i curses, cicle i UX del xat, IAIA al xat, DAFO amb evidència i plantilles.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_08793431-2505-4da7-8248-15e373802748:0852911a-9696-4449-954b-d662ed2156e4
---
# Auditoria Claude · blindatge estructural, estrès, xat fluid, DAFO i plantilles (torn 261025_0545)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_08793431-2505-4da7-8248-15e373802748:0852911a-9696-4449-954b-d662ed2156e4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T05:17:29.955Z |
| Modificació | 2026-10-25T08:38:00.000Z |
| Propietari | claude |
| Aprovació humana | encàrrec del Mestre via prompt 261025_0545 (enganxat al xat de Claude); cap decisió nova del Mestre en este torn |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) amb subagents del mateix model |
| Tokens consumits | ~12,96 M de subagents en 5 workflows i 49 agents: auditoria 5,36 M, correccions 5,51 M, verificació 0,92 M, cicle 3 1,17 M; més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T05:17:29.955Z: esborrany creat amb el torn `torn_08793431` (claude/code, obert fins a 2026-10-25T20:54Z).
- 2026-10-25T05:20Z: **relleu 1** (canal viu de l'Olivera). Llegits AGENTS.md, genotip, índex, Llibre Mestre, pla i prompt 0545 (versió del disc, idèntica a l'enganxada), i els informes `261025_0607_auditoria_codex` i `261025_0545_auditoria_gemini`. Workflow d'auditoria de 20 agents en marxa.
- 2026-10-25T05:53Z: **relleu 2.** Sis dimensions verificades. Reserva d'edició del xat.
- 2026-10-25T05:59Z: **relleu 3.** Auditoria tancada (20/20 agents). Segona reserva d'edició i tres troballes per al carril de Codex (CUR-02/03/06).
- 2026-10-25T06:00Z: **versió 0.9.0.** Troballes completes de les quatre tasques, DAFO i Eisenhower.
- 2026-10-25T07:25Z: **relleu 4, per a Codex.** La porta Enxufe torna a codi 1 per dues importacions directes en tests nous de Codex. Resultat de la verificació final.
- 2026-10-25T07:42Z: **relleu 5 (cicle de correcció 3).** Reserva de `XatContext.jsx`, Connectar i `Conversa.jsx` per als defectes que ha trobat la verificació final. Acoblament de commit D3.
- 2026-10-25T08:20Z: **versió 1.0.0.** Balanç de correccions (MCR), verificació, diàleg creuat, registre del bucle i tancament.
- 2026-10-25T08:38Z: tancament del cicle 3 (revisió adversarial i esmena de la vista) i comprovació final a l'arbre viu.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Dictamen Salfumant

**El codi és bo; el camí a producció no està blindat; i diverses fortaleses del DAFO del prompt no resistixen l'evidència. En este torn s'han tancat al codi 48 elements, però res està desplegat ni fet commit.**

- **Mètode.**
  - **Auditoria:** deu dimensions, cadascuna amb un auditor de només lectura i un verificador adversarial independent que intentava refutar cada troballa.
  - **Correccions:** tres cicles en carrils de fitxers disjunts. Cada carril passa per implementació, una revisió adversarial amb context net i una esmena quan el revisor demostrava un defecte.
  - **Verificació final:** quatre agents: suite completa en una còpia congelada, portes, revisió creuada del diff combinat i Chrome real.
  - **On s'ha provat:** totes les PoC s'han executat fora del repositori, amb Vitest, Chrome sense capçalera per CDP, PHP real de WordPress Studio (php-wasm) i REA sobre els binaris de les botigues.
- **Xifres de l'auditoria.** 106 troballes: 102 confirmades, 3 plausibles i 1 refutada (RX-05). Els verificadors n'han afegit 24 més amb evidència. Després de verificar, les severitats queden en **0 P0, 11 P1, 45 P2 i 49 P3**.
- **Xifres de les correccions.** 48 elements corregits al codi: 42 als cicles 1 i 2 (41 fets i 1 parcial) i 6 al cicle 3. Els revisors van trobar 5 defectes reals en les mateixes correccions, i tots estan esmenats.
- **Les cinc coses que de veritat separen el 7 del 12:**
  1. **Cap porta automàtica vigila el camí a producció (DF-01, P1).** El segell de skills està trencat a HEAD. La CI no veu la branca desplegada, i el desplegament de les 05:30 va eixir d'un `dist/` local. La porta Enxufe torna a ser verda, però el hook encara no pot passar.
  2. **Els binaris de les botigues són antics (BOT-01, P1)** i no hi ha cap control de versió mínima (BOT-05).
  3. **El xat no era un WhatsApp.** Les ràfegues el congelaven i, sense cobertura, els missatges morien. **Ara està corregit al codi** (§3.2), però falta el *push* (XC-07), que és decisió del Mestre.
  4. **La llista de desplegament és errònia (DF-06):** inclou entrades fantasma i migracions sense documentar.
  5. **La «Oportunitat NLnet» està sobredimensionada (DF-05):** l'abast promés no existix i la decisió de l'ADR-2026-08 no està registrada.
- **No declare res «llest per a les botigues».** El codi local cobrix molts requisits, però l'operació no està acreditada: secrets, funcions, migracions i un binari nou.

### 1. Tasca 1 · Blindatge de l'estructura arquitectònica

#### 1.1 Connector de WordPress

Verificat amb PHP 8.3/8.4 real (php-wasm de WordPress Studio) contra l'`actualitzador.php` de HEAD i el de la 1.1.9 enviada.

| ID | Sev. | Troballa | Estat |
| --- | --- | --- | --- |
| WP-01 | P2 | **Reanomenat a mitges.** El PHP ja deia `socdepoble` i el packager encara `socdepoble-enxufe`: el PHP de HEAD rebutjava tots els paquets del packager de HEAD. | **Corregit (Claude):** el packager usa `socdepoble`, que és la decisió del Mestre del 261023. Un test lliga les dues constants i el packager no fabrica cap paquet si divergixen. El fitxer principal no s'ha reanomenat. |
| WP-M1 | P3 | L'actualitzador interceptava `plugins_api` per al slug oficial `socdepoble`. | **Corregit:** el canal propi té la seua identitat heretada `SOCDEPOBLE_ENXUFE_SLUG_CANAL='socdepoble-enxufe'`. La variant universal no intercepta res. |
| WP-M2, WP-06 | P3 | El readme deia que la carpeta era `socdepoble-enxufe` i anunciava previsualitzacions que mai s'empaqueten. | **Corregit:** el text ara és honest. |
| WP-02 | P2 | El `socdepoble.zip` enviat no es pot reconstruir des de git: ha contingut almenys cinc paquets diferents, i «1.1.9» etiqueta quatre paquets de bytes diferents. | Mestre: hash del paquet enviat i versionat estricte |
| WP-03 | P2 | Les instal·lacions del canal propi estan encallades: `/enxufe/stable.json` servix l'HTML de la SPA. Ara fallen tancades: no es desactiven, però tampoc reben actualitzacions. | Mestre: versió pont o retirada |
| WP-05 | P2 | En WordPress, el *refresh token* va al `localStorage` de l'origen amfitrió (classe D1). | Mestre |
| WP-04, 07, 08, 09 | P3 | Manifest sense canal ni caducitat; pressupost de DeepL; traduccions mortes; identitat de La Torre per defecte. | Mestre / pendent |

**Fortaleses verificades:**
- Ed25519 sobre els bytes exactes, amb la clau fixada.
- sha256 i arrel comprovats abans de desactivar res.
- Guardes PHP: capacitats, nonces, Origin exacte, cos de 32 KB i cap `unserialize`.
- Independència real de l'amfitrió: l'única importació de `data/supabase` és `src/host.js:172`.
- Bundle enviat net.
- Shadow DOM tancat.
- La revisió creuada confirma que el diff no toca cap línia de sodium ni de signatura.

#### 1.2 Botigues (App Store i Google Play)

Enginyeria inversa de l'AAB, l'APK beta i l'xcarchive reals.

| ID | Sev. | Troballa | Estat |
| --- | --- | --- | --- |
| BOT-01 | P1 | El bundle dels binaris candidats és anterior a `f54baa09c`: no porta la custòdia d'Apple, ni el text legal 2.2, ni les normes 2026-10-24. | Mestre: recompilar el build ≥2 després d'este torn |
| BOT-02 | P1 | La recuperació de contrasenya falla a iOS, i els correus no tornen a l'app (no hi ha universal links ni App Links). | Codex / Mestre (autenticació) |
| BOT-03 | P1 | El botó Arrere d'Android tanca l'app des de qualsevol pantalla. | Mestre: instal·lar `@capacitor/app` |
| BOT-04 | P1 | «Descarregar les meues dades» no feia res a l'app nativa però deia «a Baixades». | **Corregit (Claude):** panell honest amb compartir el fitxer (Web Share), copiar i un textarea. **Codex** hi ha afegit la guarda de sessió (C0545-BOT4-WEB). |
| BOT-05 | P2 | No hi ha control de versió mínima: `2610241400` trencaria les apps instal·lades. | Mestre / Codex |
| BOT-06, 07 | P2 | Res no lliga `dist-natiu` a HEAD; l'APK beta és depurable i està signat amb la clau Debug. | `scripts/` (governança) / Mestre |
| BOT-08, 09 | P3 | El token d'iOS entra a la còpia d'iCloud; la CSP de producció porta fonts `localhost`. | Mestre |
| BOT-M1 | P1 | **Imatge d'IA amb una signatura «Ibáñez» falsificada i el segell «ED. BRUGUERA»** als binaris i a la galeria. | Mestre |
| BOT-M2 | P2 | La política 2.2 descriu un flux d'IA cap a Google, Anthropic i OpenAI que no existix. | Mestre |

**Matriu resumida.**
- **OK:** target API 36, AAB no depurable, `allowBackup=false`, manifest de privacitat, textos de permisos en cinc llengües, cap excepció ATS, CSP nativa segellada a un sol origen.
- **Bloquejants:** Sign in with Apple i Google (P0-03/04) i el binari antic.
- ***Data safety*:** es recullen, vinculats a l'usuari, el correu, el nom, l'ID, fotos i vídeos, àudio, missatges i altre UGC. No es recullen analítiques, ni informes d'errors, ni ubicació, ni ID publicitari.

#### 1.3 Proves d'estrès i ReDoS

S'han fuzzat 1.864 literals de regex: 104 són superlineals i 1 és exponencial. Totes les correccions s'han validat amb diferencials contra HEAD (més de 1,1 milions d'entrades, 0 diferències).

| ID | Superfície | Abans | Després | Estat |
| --- | --- | --- | --- | --- |
| RX-01 | `noticies`, `atributsDe` (servidor) | 5-11 s a 100k | lineal | **Corregit** |
| RX-M3 | `noticies`, pròleg DOCTYPE | ~2,1 s per baixada | 0 ms a 64 KB | **Corregit** |
| RX-02 | Lector, `retalla` | 30 s per feed | 33 ms | **Corregit** |
| RX-M2 | Lector, `nsNet` | 23,6 s a 250 KB | 1-2 ms | **Corregit** |
| RX-M1 | Gestoria, `extractorIdentitat` | **exponencial**: 19-24 s | 10 ms | **Corregit** |
| RX-03 | Lector, `enLinia` | `RangeError`: es perd el feed | 29-50 ms | **Corregit** |
| RX-04 | Xat, `segmentaEnllacos` | 0,47 s per pàgina | 0,24 ms | **Corregit** |
| RX-M4 | Lector XLSX | quadràtic | lineal | **Corregit** |
| RX-06..08 | ~40 retalls finals; `parseMarkdown`; sentinella | quadràtics, amb entrada fitada o de confiança | — | Proposta: porta `eslint-plugin-regexp` al pre-commit |

#### 1.4 Curses, fuites i fallades de xarxa

| ID | Sev. | Troballa | Estat |
| --- | --- | --- | --- |
| CUR-01 | P2 | El perfil públic conservava la llista privada de la sessió anterior. | **Corregit (Claude):** clau per visor; les respostes tardanes es descarten. |
| CUR-02 | P2 | Les RPC del xat no tenien termini. | **Corregit (Codex):** termini de 30 s, reintentable. |
| CUR-03 | P2 | El realtime no es recuperava mai. | **Corregit (Codex),** passada 5. |
| CUR-06 | P3 | Dos subscriptors compartien canal. | Codex, passada 6 (en curs) |
| CUR-04, 05, 07, 08 | P2/P3 | `IdentitatContext` A→B; cos de `compte-apple`; 401 tardà; quota de `compte-apple`. | Codex / Mestre (zona d'autenticació) |

**Estrès «DDoS» honest.** No s'ha fet cap prova contra servidors reals. Els límits verificats són al servidor: 15 missatges per 5 s per usuari, 30 seguiments per hora, i límits i HMAC d'IP a `noticies`. Els 40.000 fluxos virtuals de Codex demostren netedat local, no capacitat del servidor.

### 2. Tasca 2 · DAFO amb evidència i matriu d'Eisenhower

Graus: **A** = mesurat o executat; **B** = llegit al codi o als artefactes; **C** = afirmat o inferit.

#### 2.1 DAFO

| | Afirmació honesta | Evidència | Grau |
| --- | --- | --- | --- |
| **F1** | El port neutral es complix al codi de producció, i la seua porta torna a ser verda. | Cap bypass fora de `src/host.js:172`; porta Enxufe a codi 0 després de DF-03 (Claude) i de la correcció de Codex a la passada 6. | A |
| **F2** | Les bateries són verdes i reproduïbles. | Suite completa en còpia congelada: **22.194 verds**, 4 rojos (tots previs a HEAD o de la còpia), 109 omesos, 655 s. `test:precommit`: 3.115 + 259 verds. | A |
| **F3** | Contrast construït als tokens. | 53/53 | A |
| **F4** | Enviament del xat idempotent i ordenat pel servidor. | UUID del client; `pg_advisory_xact_lock`; `seq` amb bloqueig de fila. | A |
| **F5** | Actualitzador WordPress criptogràficament sòlid. | §1.1 | A |
| **F6** | Dependències d'execució mínimes. | 14 dependències. | A |
| **F7** | Aprovació de tractors que falla tancada. | `aprovacio.js:237` | B |
| **D1** | Res no vigila el camí a producció. | Segell trencat a HEAD (commit `1c6bd64cd`), CI només en `main`/PR, desplegament local. | A |
| **D2** | La «immunitat dels segells SHA-256» és falsa. | Segell trencat; LEDGER sense clau. | A |
| **D3** | Molt de codi pendent de desplegar i una llista errònia. | 20 migracions no aplicades, 7 sense documentar, 2 entrades fantasma. | A |
| **D4** | El xat no tenia notificacions ni realtime fora del fil obert. | XC-06/07 | A |
| **D5** | Arrencada cara en tokens. | ~535 KB obligatoris (~150k tokens). | A |
| **D6** | Cap motor d'accessibilitat automàtic. | — | A |
| **D7** | La interfície està cosida a la persona i l'entitat pilot. | 28 + 32 fitxers | A |
| **D8** | La IAIA no té cap motor en remot. | IA-01 | A |
| **A1** | Rebuig de botigues per operació no acreditada. | §1.2 | A/B |
| **A2** | Distància entre l'abast d'NLnet i la realitat. | DF-05 | B |
| **A3** | Cost de tokens: D5 multiplicat per 4 IAs i 8 passades. | — | B |
| **A4** | Dependència de Supabase, Firebase (que no figura a la política: TE-07) i DeepL. | — | B |
| **A5** | Bot de WhatsApp no oficial (Baileys) al repositori. | `bot/` | B |
| **A6** | Diverses IAs en el mateix arbre. | Este torn ho mostra: tests nous que trencaven una porta just posada en verd, i acoblament de commit D3. | A |
| **O1** | La proposta NLnet 2026-08-1a6 està en revisió. | Acta 260801 | B |
| **O1b** | «Resolució al novembre.» | El 2026-11-03 és el termini de la convocatòria següent, no la resolució. | C |
| **O2** | L'exportació personal pot ser la llavor de l'«Exportació Total» per municipi. | `compte.js:94` | B |
| **O3** | L'ADR online-first permet replantejar l'abast amb honestedat. | ADR-2026-08/10 | B |
| **O4** | La Frontissa de Sollutia està llesta i inerta (GET, `credentials:omit`). | Codex | A |

**Contrast amb el prompt.**
- «22.000 tests verds»: **ara sí, mesurat a l'arbre de treball** (22.194). No era cert com a afirmació quan es va escriure: no s'havia executat a HEAD i hi havia 3 rojos.
- «Immunitat de segells»: **refutada.**
- «Port neutral»: **cert**, amb la porta en verd.
- «Pedra Seca WCAG»: el contrast sí; la conformitat no està mesurada.
- «Taules a 385 px»: **confirmat i corregit.**
- «NLnet al novembre»: **C.**

#### 2.2 Matriu d'Eisenhower

**Q1 · Important i urgent:**
1. **Camí a producció** (DF-01/02): el Mestre revisa el diff de `core-higiene-escriptori` (s'ha llevat el pas `--sec`) i torna a segellar; CI a la branca desplegada; desplegar només des d'un commit verd.
2. **Una llista de desplegament correcta generada des dels fitxers** (DF-06) i el control de versió mínima (BOT-05) **abans** de `2610241400`.
3. **Commit d'este torn**, amb XatContext i el `xat.js` de Codex junts (D3), i recompilar els binaris (BOT-01).
4. **Botigues:** BOT-02 (autenticació), BOT-03 (dependència), BOT-M1 (imatge) i retirar l'APK beta.
5. **NLnet:** registrar la decisió de l'ADR i preparar «promés contra existent» (DF-05).
6. **P0-02:** rotar el token d'n8n.

**Q2 · Important, no urgent:**
- *Push* (XC-07) i bústia en temps real `xat:u:<uid>` (XC-06).
- MVP de la IAIA sense tokens (§3.3).
- «Comptador de plaça» i traductor modular amb Apertium (TE-04/06).
- Plantilla única (§4).
- Dieta de tokens (P2-15) i fitxa visual (P2-16).
- `main`/CI amb Sollutia.
- Retirada del canal WordPress amb versió pont.
- axe automatitzat.

**Q3 · Urgent, menys important:**
- Enllaços de les dues skills que no carreguen (DF-10).
- Cens de `iaia_maria_avatar_mobil` (2 tests rojos des de `1c6bd64cd`).
- Les 28 claus `section.login.*` òrfenes.
- Contrast entre la capçalera de les taules i les files parelles (ΔE < 1,5).

**Q4 · Ni urgent ni important:** IDEA-28/29/30. Recomane retirar el bot Baileys.

### 3. Tasca 3 · El xat fluid i la IAIA

#### 3.1 El que ja era de WhatsApp (verificat)
- Bombolla optimista amb UUID i clau estable.
- Idempotència i ordre del servidor.
- Realtime només com a senyal privat.
- Aïllament en canviar de persona.
- Marques agrupades que mai retrocedixen.
- Esperes per a xarxa rural.
- Ancoratge de l'historial.
- Higiene dels adjunts (EXIF, ubicació, URL d'objecte).
- Escriure no repinta cap bombolla.

#### 3.2 El que li faltava, i l'estat després d'este torn

| Capacitat de WhatsApp | Abans | Ara (sense commit) |
| --- | --- | --- |
| Conversa viva durant una ràfega | Congelada en el seq 1 tota la ràfega (XC-01) | **Una lectura per fil amb marca de «de nou»:** el contingut entra a mesura que arriba, amb ≤10 RPC en lloc de 30 |
| Ordre FIFO dels meus enviaments | B podia passar davant d'A mentre A reintentava | **Cua per fil** |
| Sense cobertura | 4 intents en ~10 s, error i pèrdua (XC-03) | **Es queda pendent sense gastar intents i ix en tornar la xarxa amb el mateix id.** Connectar i `missatgeAlXat` conserven la resposta fitada (D2, cicle 3). Persistir la cua és decisió del Mestre. |
| Posar-se al dia | 100 missatges per comprovació (~65 s per a 350) | Fins a 5 pàgines per lectura: 351 de seguida |
| Error de xarxa discret | Una lectura fallida amagava la llista ~25 s (XC-13) | **Avís per fil, no bloquejant, segons l'operació** (lectura o marca), amb «Torna-ho a provar» que mostra quan està ocupat |
| Estat en obrir | «Cap missatge encara» mentre carregava | «Carregant la conversa…» (`role=status`, `aria-busy`); mai al costat de l'error |
| El teclat no es tanca en enviar | El focus anava a `BODY` (XU-01) | **Es queda al camp** (ratolí, Tab+Intro i toc tàctil, mesurat en Chrome) |
| Fixat a baix quan creix el contingut | Les fotos amagaven 217 px (XU-05) | **ResizeObserver, i un `scroll` que només refixa si el contingut ha crescut i `scrollTop` no ha baixat**: 0 px amagats, també amb imatges en memòria cau, i el `scroll` lent cap amunt no queda atrapat |
| Intro amb IME | L'Intro de Safari enviava; Escape cancel·lava | Guarda per `keyCode 229` i `isComposing`; l'Intro coreà i el de Gboard continuen enviant |
| Intro segons el tipus d'entrada | Depenia de l'amplada | Envia si no és pantalla tàctil i estreta; Maj+Intro, salt de línia |
| Llegit només si es veu | Es marcava sense focus; el que es pintava amagat no es marcava; els missatges molt alts mai | Visible i amb focus (o sense *blur* previ); torna a marcar en `focus`, `visibilitychange`, `pageshow` des de bfcache i la primera interacció dins de la conversa; llindars per a missatges alts |
| Marques en tancar la pestanya | Es perdien | Es buiden en `pagehide` i en amagar-se la pestanya |
| Benvinguda de la IAIA | Sense «· IA», i després de l'últim missatge | Amb «· IA» i al principi |
| Text bidireccional, comptador, regió viva | No | `dir="auto"`; avisos només als llindars; anuncis diferents per a missatges iguals |
| Notificacions amb l'app tancada | Cap (XC-07, P1) | **Pendent: Mestre** |
| Llista i altres xats en directe; ✓✓ a l'instant; editar o esborrar | Sondeig de 25 s; sincronització només d'altes | **Pendent: SQL** (Codex): XC-05/06/08 |
| Adjunts amb bombolla i progrés; 10.000 missatges; fletxes; teclat virtual | No | **Pendent:** estructural (XC-09, XU-09, XU-10, XU-02, XU-04) |

**Rendiment** (Chrome real, N=2.000): muntatge 452 ms (HEAD 485 ms), +1 missatge 13,6 ms (HEAD 14,3 ms). Sense regressió.

**Sobre STRESS-01 de Gemini:** refutat. `xat_envia` ja és idempotent per `p_id`.

#### 3.3 La IAIA com a veïna sàvia

**Estat real.** L'app no usa cap LLM. ConsultaIAIA és BM25 extractiu i local sobre 49 documents públics. En remot, el fil «IAIA MarIA» és el grup públic `/iaia`, i ningú hi respon (IA-01). El bot `bot/` usa Baileys i Gemini i no arranca a HEAD. El corpus són documents d'arquitectura (IA-04): 0 resultats per a oliva, blat, raïm, verema, DCVB o Cascant.

**Proposta d'arquitectura (resum):**
1. **Convocatòria.**
   - T0, el panell privat (ja existix).
   - T1, un fil 1:1 de tipus `iaia`, que l'SQL ja admet, amb un avís permanent que no està xifrat.
   - T2, `@IAIA` només en grups on un administrador ho haja activat.
   - **Mai:** directes entre persones, fils E2EE, escolta passiva o iniciativa pròpia.
   - Amb E2EE, el client envia la menció amb un rebut HMAC.
2. **`iaiaPort` neutral,** com `backendPort`, amb adaptadors local, funció, WordPress i doble de proves, i un kit de conformitat de 12 casos. Cap SDK d'IA al client.
3. **Funció de servidor** amb el patró de `noticies`:
   - JWT, interruptor general i pressupost.
   - Consentiment al servidor i quota atòmica.
   - **Primer, resposta extractiva**; el model només redacta sobre el que s'ha recuperat.
   - 8 s i 180 tokens de sortida.
   - Filtre posterior, moderació i publicació amb `es_ia=true` per un usuari de sistema.
   - Una funció nova és una carpeta nova: **decisió del Mestre.**
4. **Càpsules culturals.**
   - On viuen: al satèl·lit canònic **`_cultura_de_poble/`**, compilades a l'app. Cap carpeta nova al repositori.
   - Format: YAML amb lema, variants, font, llicència, revisió humana i sha256; ≤120 tokens.
   - Recuperació: BM25 i trigrames en JS pur.
5. **Defensa i lleis.**
   - El text del veí és dada, mai ordre.
   - AI Act, art. 50: etiquetatge.
   - Google Play exigix denunciar el contingut d'IA (IA-02).
   - Apple 5.1.2(i): consentiment abans de compartir dades amb una IA de tercers.
6. **Cost:** ~0,23 $ cada 1.000 interaccions amb Claude Haiku 5.5, sense *thinking*. Sostre proposat: 30 €/mes.
7. **Google Notebook,** només com a ajuda de redacció fora de línia.

**L'opció B de Gemini es desaconsella** (§6). **MVP d'un torn sense tokens:** IA-01 (ho ha de ratificar el Mestre), IA-02, IA-07 (**fet**), `iaiaPort` amb l'adaptador local i 30 càpsules.

### 4. Tasca 4 · Plantilles i automillora

#### 4.1 Diagnòstic
- `prompt.consell` és viva però inusable: el camí bundle+prompt està trencat (PL-04).
- Els encaminadors per paraula clau envien Gemini a la plantilla externa (PL-01).
- La doctrina no diu qui és «local» (PL-02).
- `document.mjs create` deixa caure en silenci les clàusules que no són `blocsFixos`, i la porta les certifica igualment (PL-03). Per això el prompt 0545 no porta el MÈTODE GAUNTLET ni l'Automillora.
- Marcar una plantilla com a *deprecated* trenca totes les rutes (PL-06).
- Hi ha fitxers amb dos rebuts de creació (PL-12).

#### 4.2 Proposta d'unificació

Una sola plantilla `prompt.md` v4 amb un paràmetre `destinatari` (`local`/`extern`) **derivat de dades**:
- El registre d'actors ja existix a `.agents/consell.json`, com indica Codex: s'hi afig `acces: [disc|bundle]`.
- `protocolledge` v5 amb variants. `prompt.local` i `prompt.consell` es conserven com a àlies per als rebuts antics.
- Nucli comú: Registre (amb el sha de HEAD), Abast per actor, Tasques (responsable, criteris i eixida), Coneguts, Bucle (amb regla de parada) i Eixida.
- Model B per referència i hash a l'AGENTS §8.
- Test `plantilla-unica.test.mjs`, amb nou comprovacions.

És zona de governança: decisió del Mestre o lease del Reflex. **Contrast:** Codex conserva les dues rutes per destinatari, que és compatible amb esta proposta; Gemini 1.1 ja no proposa purgar.

#### 4.3 Retroalimentació del prompt 0545
- «22.000 tests» no estava mesurat (ara sí: §2.1).
- «Permisos totals» i «zero preguntes» xoquen amb l'AGENTS §15 i amb els hooks `forceAsk`.
- El bucle de 4 hores no té responsable ni regla de parada en verd (IDEA-07).
- El pla diu «aprovat» però és un esborrany.
- Falten criteris d'acceptació, tall d'evidència, fitxers propietat de cada actor i una càpsula de coneguts.
- Llegir-ho tot costa ~75-90k tokens per agent; una instància de 2-3 KB faria la mateixa feina.
- **Este torn ho confirma:** dues IAs van editar el mateix fitxer i una va trencar la porta de l'altra. La plantilla ha d'exigir declarar els fitxers abans d'editar i passar `tractor-enxufe` abans de publicar un relleu.

#### 4.4 Intuïció visual amb pocs tokens

| Mecanisme | Tokens per ús | Què dona |
| --- | --- | --- |
| Fitxa visual: esquema + graella de 30×24 + violacions | ~550 mesurats a 390 px | forma i defectes, en text que es pot fer *grep* |
| Detectors d'una línia (VESSA, RETALLAT, DIANA<44, CONTRAST) | 15-25 per línia | llista accionable |
| Captura ×0,5 / ×0,3 | 342 / 123 a 1280 px | forma |
| dHash per ruta i amplada | ~10 | «ha canviat?» |
| Vista d'ocell de 12×2 | ~3k | la superfície estranya |

La verificació d'este torn ho ha demostrat: el harness CDP sense dependències ha trobat la regressió XU-05 que jsdom no veia. Proposta: un script dins de **`tooling/gates/`** (cap carpeta nova), amb una base aprovada a la Wiki.

### 5. Correccions de Claude en este torn (MCR)

Totes queden **sense commit**, a l'arbre de treball. Cada carril ha passat per implementació, revisió adversarial amb context net i, si calia, esmena.

| Carril | Elements | Estat | Revisió adversarial |
| --- | --- | --- | --- |
| Xat, dades (`XatContext.jsx`, `missatges.js`) | X3 de Codex, XC-01, XC-02, XC-13, XC-14, ordre FIFO, XC-03 (client), buidatge de marques | **FET** (8/8) | OK |
| Xat, vista (`Conversa`, `Compositor`, `Bombolla`, `FilaConversa`, `CapcaleraConversa`, `ResultatsCercaXat`) | XU-01, XU-03, XU-05, XU-06, XU-08+XC-12, missatges alts, XC-14 vista, IA-07+posició, XU-13, XU-14, XU-16, TE-03 | **FET** (12/12) | 2 defectes (Intro coreà i Gboard; *blur* durant la càrrega), **esmenats** |
| ReDoS client (Lector, xat, Gestoria, XLSX) | RX-02, RX-M2, RX-03, RX-04, RX-M1, RX-M4 | **FET** (6/6) | OK; diferencials de 60k-275k entrades |
| ReDoS servidor (`noticies`) | RX-01, RX-M3 | **FET** (2/2) | OK; 500k diferencials |
| Privacitat (perfil i exportació nativa) | CUR-01, BOT-04 | **FET** (2/2) | OK |
| Porta Enxufe (només tests) | DF-03 | **FET**: de 7 infraccions a 0 | OK |
| Taules del catàleg | P1-16 / DF-04 / C2-04 | **FET**: caixa de desplaçament amb `role=region`, nom i `tabindex` | OK; Chrome: Tab i fletxes fins a l'última columna |
| WordPress | WP-01, WP-M1, WP-M2, WP-06 | **FET** | 1 defecte (test `standalone-build` amb l'arrel fixa), **esmenat** |
| i18n de l'onboarding | TE-01, TE-08; claus òrfenes | **FET**; òrfenes **PARCIAL** (5 de 33 reutilitzades) | OK; diferencial de 32 estats en valencià idèntic |
| Cicle 3 (verificació final) | D2 (Connectar sense xarxa), XU-05 (`scroll` abans de l'observador), D4 (represa en iOS), D5 (avís per tipus i botó ocupat) | **FET** (4/4) | Context: OK (16 tests d'atac, 1.693 verds amb el CUR-06 de Codex). Vista: 1 defecte (un `scroll` lent cap amunt quedava atrapat a baix), **esmenat**: només es fixa si el contingut ha crescut i `scrollTop` no ha baixat. D4 s'ha endurit a `pageshow` restaurat de bfcache. |
| Altres | Test B18 invertit (fixava el defecte XC-13); cens de lint de la capa de dades | **FET** | — |

**Fitxers fora de carril, registrats:** `tests/fixtures/enxufe-pantalla.php` (una línia: fixava el defecte), `tests/standalone-build.test.mjs` (l'arrel ara segueix `SLUG`) i la desestructuració de `useXat()` a `XatSection.jsx`.

### 6. Diàleg creuat

- **Codex.**
  - Done per bones X1/X2 i he aplicat el seu X3.
  - Ha corregit CUR-02 (termini de 30 s), CUR-03 (recuperació del realtime) i C0545-BOT4-WEB (descàrrega amb dades d'A quan la sessió ja és B).
  - Després del meu avís (relleu 4), ha reparat els dos tests que tornaven a fer roja la porta Enxufe.
  - M'ha esmenat amb raó: el mandat prohibix carpetes noves, i ho he reubicat (§3.3, §4.4).
  - **D3, acoblament de commit:** la cua FIFO i la lectura d'una sola petició de `XatContext.jsx` necessiten el termini de 30 s de `xat.js`. Han d'anar al mateix commit.
- **Gemini.**
  - D'acord en el diagnòstic de botigues.
  - STRESS-01 queda refutat.
  - **No a l'opció B de la IAIA:** el client decidiria el text amb `es_ia=true`, i hui l'etiqueta no es pot falsificar precisament perquè tots els INSERT escriuen `false` literal.
  - Va incorporar la salvaguarda d'`active_plugins`.

### 7. Decisions pendents del Mestre (sense botons; per impacte)

1. **Commit d'este torn.** Ha d'incloure el `xat.js` de Codex (D3). Aplicar la recepta habitual: índex temporal i còpia congelada.
2. **Camí a producció.** El diff de `core-higiene-escriptori`, resegellar, CI a la branca desplegada i desplegar només des de verd (DF-01/02).
3. **Botigues.**
   - La imatge «Ibáñez / ED. BRUGUERA» (BOT-M1).
   - `@capacitor/app` per al botó Arrere (BOT-03).
   - Universal links i App Links (BOT-02).
   - Retirar l'APK beta.
   - Recompilar el build 2.
4. **NLnet.** La decisió de l'ADR-2026-08 i «promés contra existent» (DF-05).
5. **Desplegament.** Una llista única de migracions (DF-06) i el control de versió mínima (BOT-05).
6. **Xat.**
   - El proveïdor de *push* i la privacitat de la càrrega (XC-07).
   - Cua i esborranys persistents al dispositiu (XC-03b, XU-11).
   - Confirmar la regla híbrida de l'Intro (XU-03).
   - La benvinguda de la IAIA al principi (IA-07).
7. **IAIA.** On porta la fila (IA-01); el proveïdor UE; les llicències del DCVB i de Cascant; els sostres; retirar Baileys.
8. **WordPress.** Versió pont i retirada del canal propi (WP-03); hash del paquet enviat (WP-02).
9. **Plantilles.** Nom del trio local i plantilla única (§4.2).
10. **i18n.** Validar els textos RGPD traduïts (marcats per a revisió legal) i decidir les 28 claus òrfenes.

### 8. Registre del bucle (Gauntlet de 4 hores)

| Cicle | Hora local | Què |
| --- | --- | --- |
| 1 | 06:10-06:55 | Auditoria: 20 agents en 10 dimensions, amb verificador per dimensió |
| 2 | 06:54-07:50 | Correccions del xat: 2 carrils, revisió i esmena |
| 3 | 06:58-07:57 | Correccions estructurals: 7 carrils, revisió i esmena |
| 4 | 07:58-08:34 | Verificació final: suite, portes, revisió creuada i Chrome |
| 5 | 08:42-09:20 | Cicle de correcció 3 a partir de la verificació |
| Diàleg | contínua | Lectura dels informes de Codex (passades 1-6) i Gemini (v1.0-1.1); 5 relleus a l'Escriptori |

**«Cadascuna a sa casa».** Claude no ha creat cap cron, ni *schedule*, ni tasca recurrent. La vigilància de l'Escriptori ha anat per monitors de 30 minuts dins de la sessió, i l'últim s'atura en tancar este informe. No queda cap servidor ni Chrome dels agents en marxa (verificat pels agents de navegador). El *heartbeat* de huit passades és de Codex, té el límit a les 10:12 i el gestiona Codex.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat | Abast |
| --- | --- | --- |
| Vitest complet, còpia congelada de l'arbre de treball (07:59) | **22.194 verds**, 4 rojos, 109 omesos; 1.301 fitxers; 655 s | Els 4 rojos també fallen a una còpia de HEAD (`App.appsLocals` per `.env.local`, `censImatges` ×2 des de `1c6bd64cd`) o són de la còpia (`projecteIos`). Els 33 fitxers de test d'este torn passen. |
| `npm run test:node` (còpia) | 1.025 verds, 3 rojos | Els 3 necessiten un repositori git real; fallen igual a HEAD. |
| `npm run test:precommit` (arbre viu) | 163 fitxers, **3.115 + 259**, 0 rojos, 25,6 s | — |
| ESLint complet (`src tooling scripts tests`) | 2.738 fitxers, 0 avisos | — |
| `lint_xat`, suites del connector (9 fitxers, PHP real), build web de producció | 20/20; 173 + 2 *todo*; build correcte | — |
| `tractor-enxufe` | **codi 0** (era 7 infraccions a HEAD) | Després de la correcció de Codex dels seus 2 tests |
| `tractor-vocabulari`, `tractor-pedra-seca` | rojos per deute previ | Cap infracció nova respecte de HEAD |
| Revisió creuada del diff combinat | 75 claus noves completes en 5 llengües; Baseline 2022; signatura de WordPress intacta; parsers equivalents (1,1 M entrades) | Va trobar D2-D5, ja corregits al cicle 3 |
| Chrome real (CDP, xarxa externa bloquejada) | P1-16 i XU-01 resolts (ratolí, teclat i toc); XC-14 i IA-07 confirmats; XU-05 corregit al cicle 3; rendiment sense regressió | `btn-connectar` vessa 2-17 px a 375 px (previ, no és de les taules) |
| Xat després del CUR-03 de Codex | `src/sections/xat`: 94 fitxers, 1.162 verds | 08:33 |
| Cicle 3, comprovació final de Claude (09:36, arbre viu) | `test:precommit` 164 fitxers / **3.132** verds; `src/sections/xat` + `src/sections/connectar` 112 fitxers / **1.463** verds; `tractor-enxufe` codi 0; `lint_xat` 20/20; ESLint dels fitxers tocats 0; cap fitxer temporal | Inclou el CUR-06 de Codex (09:03). Chrome real del revisor: foto en memòria cau i compositor ràpid, 0 px amagats; amb l'esmena, el `scroll` lent ja no queda atrapat. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense producció.** Cap petició a socdepoble.org, Supabase ni consoles de les botigues. L'estat desplegat no està verificat.
- **Sense dispositius.** Ni iOS ni Android reals; XU-01/05/06/08 i D4 estan mesurats en Chrome d'escriptori o en jsdom.
- **Proves de càrrega:** no s'han fet contra cap servidor.
- **Fora d'abast:** SQL, RLS, autenticació i governança. Les propostes en eixes zones necessiten el Mestre o una lease.
- **Sense commits, ni migracions, ni dependències noves de Claude.** Claude no ha escrit a `.agents/` (ESTAT i LEDGER): MarIA hauria de registrar el relleu.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_0545_pla_implementacio_destil_llibre_mestre_dafo_i_xat_fluid]]
- [[261025_0545_prompt_claude_gemini_codex_destil_llibre_mestre_dafo_i_xat_fluid]]
- [[261025_0607_auditoria_codex]]
- [[261025_0545_auditoria_gemini]]
