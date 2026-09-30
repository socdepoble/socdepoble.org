---
type: informe
status: esborrany
description: Revisió adversarial de les llesques Explorador, Calendari i tooling nou, verificació visual a 1440 i 375, desglossament de targetes, recerca del traductor, dades del Mur i deute de portes.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_2c40cd77-c695-4fc5-998e-a41afd6c6724:d223a108-5bca-4df7-8a4f-2599415055f1
---
# Auditoria de Claude: revisió adversarial, targetes del tauler, traductor i dades del Mur

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2c40cd77-c695-4fc5-998e-a41afd6c6724:d223a108-5bca-4df7-8a4f-2599415055f1 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T02:02:29.086Z |
| Modificació | 2026-09-30T03:58:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb tres workflows de subagents Opus 5.5 |
| Tokens consumits | Fil principal: no mesurable des de l'agent. Subagents: 3.383.230 (comprensió, 15 agents) + 577.473 (T6, 3 agents) + 4.821.862 (implementació, 18 agents) = 8.782.565. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T02:02:29.086Z: esborrany creat; contingut i verificació pendents.

- 03:54 torn `torn_2c40cd77` (code) sobre el prompt [[260930_0320_prompt_claude]] i el pla de MarIA [[260930_0320_pla_implementacio_maria]]. L'Acta 0310 que ho arrencava ja és fora de l'Escriptori.
- 04:00-04:30 workflow de comprensió (15 agents):
  - cinc caçadors i cinc refutadors per a T1;
  - disseny de T3;
  - recerca de T4, web pel navegador integrat perquè WebSearch està bloquejat pel hook, i codi;
  - diagnosi de T5.
  - A mà, en paral·lel, la verificació visual de T2 a 1440 i 375 px.
- 04:05 addenda de MarIA [[260930_0405_missatge_per_a_claude]]: T6, avís de l'Índex i notes de WordPress. 04:10-04:30 workflow de T6 amb el codi font de WordPress 6.5 i trunk.
- 04:40 pla [[260930_0320_pla_implementacio_claude]], vinculat al torn. Workflow d'implementació: set llesques amb fitxers disjunts, cadascuna amb un revisor adversarial i un corrector si calia (18 agents).
- 04:40 incidència de l'Escriptori, prompt [[260930_0440_prompt_claude]]. La resposta és la secció 9 d'este informe, sense cap fitxer nou.
- 05:45-05:58 verificació final (proves i navegador), àncores dels dos laboratoris de governança i este informe. Llegits també [[260930_0450_prompt_claude]] i [[260930_0530_acta_marmota]], escrits per MarIA mentre durava el torn.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum executiu

- **T1 · Revisió adversarial.**
  - Cinc grups, 45 troballes.
  - Els refutadors en tomben 7: calendari-6, model-11 i tooling-mapa-3, -4 i -8.
  - L'única alta confirmada és de governança: el hook d'Antigravity respon `allow` a tot el que no jutja, i per a l'IDE això vol dir autoaprovar-ho. La traça ho mostra en viu: el 30-09 a les 02:37Z, una edició de MarIA a `.agents/skills/wiki-documentacio-i-reflex/SKILL.md` va rebre `allow` i va trencar el segell de les skills.
  - A src, totes les confirmades són latents amb les dades d'avui, excepte calendari-1. Queden corregides, amb proves.
- **T2 · Verificació visual.** Feta abans i després de la implementació, a 1440 i 375 px, sense cap desbordament horitzontal.
- **T3 · Targetes.** Cada targeta mostra ara, a la coberta, els estats de dins de la seua pàgina, el més greu primer. Es pinten com a llista d'insígnies, no com a capçaleres. L'Índex queda idèntic: 20 entrades de nivell 5 i cap de nivell 6. La signatura de «Canvis nous» no canvia ni un caràcter.
- **T4 · Traductor.** Decisió: el giny de Google queda descartat.
  - Google el retira l'1-10-2026.
  - Reescriu el DOM i trenca React.
  - La CSP i la porta E4 el bloquegen.
  - Es proposa traduir textos amb una capacitat opcional del contracte i un adaptador autoallotjat, Apertium o Softcatalà, que coneixen el valencià. No s'implementa sense la teua aprovació (D4).
- **T5 · Dades del Mur.** Corregit:
  - ja no s'inventa el dia de l'acte;
  - les dates es llegixen en hora local;
  - el filtre `?date=` i l'ordre del Mur fan servir el mateix model que el calendari.

  L'Aplec de la llavor es veu exactament igual.
- **T5 · Portes.**
  - Frontmatter: F3 passa de 36 a 6 (el sostre) i F4 de 25 a 4.
  - El que falta és governança o toca el manifest, i queda al paquet del laboratori o a les teues ordres.
  - Els 101 torns caducats no els compta cap porta. El remei, sense falsejar cap tancament, és l'estat `retired`, que queda preparat al laboratori.
- **T6 · WordPress.**
  - La columna buida de Studio ve de la còpia instal·lada: és la 0.1.0, amb `Update URI: false`.
  - Al repo, hi ha un ganxo d'activació que invalida la memòria cau d'actualitzacions, i una nota a la cel·la quan el canal no pot portar res.
- **Incidència de l'Escriptori (prompt 0440).**
  - La porta Olivera donava verd sobre un Escriptori que s'acumulava.
  - Els trasllats no registraven el relleu del torn.
  - Claude no pot arxivar. L'índex s'ha ordenat i el remei estructural queda al laboratori.

### 1. T1 · Revisió adversarial (pipeline caçador → refutador independent)

Una troballa és vàlida si la tomba el codi o una prova, no l'opinió. En cas de dubte, el refutador marcava REFUTAT. «Corregit» vol dir que hi ha codi i una prova nova que abans eixia roja.

**Explorador** (DetallPeca, grafMapa, construeixMapa):

| Id | Sev. | Veredicte | Estat |
| --- | --- | --- | --- |
| explorador-1: una ordre npm no declarada diu que package.json no és al disc | baixa | CONFIRMAT | corregit (l'absència només compta per al fitxer propi) |
| explorador-2: document de contracte absent amb «Cap avís» i botó que no obri res | baixa | CONFIRMAT | corregit (avís nou `fitxer-absent` al node de destí; script de tasques comprovat) |
| explorador-3: `rutaEditable` accepta `file://` | baixa | CONFIRMAT | corregit (rebutja qualsevol esquema o unitat) |
| explorador-4: hooks de git sense extensió no s'obrin a l'editor | baixa | CONFIRMAT | **D2, decisió del Mestre** (canvi visible) |
| explorador-5: Script i Document amb el mateix color en tema clar | baixa | CONFIRMAT | **D3, decisió del Mestre** (canvi visible) |
| explorador-6: el mode privacitat mostra la ruta sencera si dos noms es repetixen | baixa | PLAUSIBLE | corregit (ordinal en mode privacitat) |

**Calendari i Agenda:**

| Id | Sev. | Veredicte | Estat |
| --- | --- | --- | --- |
| calendari-1: el mes no seguix `?date=` amb l'Agenda oberta | mitjana | CONFIRMAT | corregit (derivat en el render) |
| calendari-2: filtre `?date=` i calendari amb criteris diferents | baixa | PLAUSIBLE | corregit (D5, `acteOcorreElDia`) |
| calendari-3: mes d'obertura només pel dia d'inici | baixa | PLAUSIBLE | corregit (primera ocurrència ≥ hui, 24 mesos) |
| calendari-4: promesa «N'hi ha en altres mesos» amb actes que no es poden pintar | baixa | PLAUSIBLE | corregit (tres branques) |
| calendari-5: `?date=0026-…` pinta «maig de 1926» | baixa | CONFIRMAT | corregit (any ≥ 1000) |
| calendari-6: avís de mes buit | — | REFUTAT | cap |
| calendari-7: les proves de canvi d'hora no fixen TZ | baixa | CONFIRMAT | corregit (`vite.config.js`: TZ Europe/Madrid només amb VITEST) |

**Model d'esdeveniment** (`esdeveniment.js`, `ics.js`). Cap té consumidor a la interfície: `aIcs` i `aGoogleCalendar` només els usen les proves.

| Id | Sev. rev. | Veredicte | Estat |
| --- | --- | --- | --- |
| model-1: injecció de components ICS per la recurrència | mitjana | CONFIRMAT | corregit (llista blanca de línies) |
| model-2: RRULE amb desfasament exportat en UTC | mitjana | CONFIRMAT | corregit (DTSTART;TZID amb l'hora de paret) |
| model-3: anys fora de quatre xifres fan petar `aIcs` | baixa | CONFIRMAT | corregit (1000-9998; any farcit) |
| model-4: `aGoogleCalendar` sense prefix `RRULE:` | baixa | CONFIRMAT | corregit (forma canònica al model) |
| model-5: DTEND = DTSTART; fins en una altra zona | baixa | CONFIRMAT | corregit (sense DTEND; comparació per zona) |
| model-6: UNTIL incoherent amb DTSTART | baixa | CONFIRMAT | corregit (FALLA, no es pinta) |
| model-7: UNTIL mal avaluat el dia del canvi d'hora | baixa | CONFIRMAT | corregit |
| model-8: desfasaments impossibles | baixa | CONFIRMAT | corregit |
| model-9: caràcters de control en TEXT i en l'enllaç | baixa | CONFIRMAT | corregit |
| model-10: zona en minúscules sense VTIMEZONE | baixa | PLAUSIBLE | corregit (zona canònica) |
| model-11: UID duplicats | — | REFUTAT | cap |
| model-12: `/\host` a l'enllaç | baixa | CONFIRMAT | corregit |

**Tooling · portes** (`antigravity-hook.mjs`, `porta-olivera.mjs`). Tot és governança i va al paquet del laboratori:

| Id | Sev. rev. | Veredicte | Estat |
| --- | --- | --- | --- |
| tooling-portes-1: `allow` = autoaprovació; l'interruptor autoaprova tot | **alta** | CONFIRMAT | laboratori (`ask` excepte les tres lectures) |
| tooling-portes-2: autoprotecció que distingix caixa sobre APFS | mitjana | CONFIRMAT | laboratori |
| tooling-portes-3: la categoria `missatge` entra sense porta (cas real, 02:05Z) | mitjana | CONFIRMAT | laboratori |
| tooling-portes-4: `cp`, `rm`, `>|` i `01_produccio` per shell → `allow` | mitjana | CONFIRMAT | laboratori |
| tooling-portes-5: `04_Escriptori` amb una altra caixa se salta les portes | baixa | CONFIRMAT | laboratori |
| tooling-portes-6 a 12: arrel sense marcador, noms fora de taxonomia, despenjat per línia, TRANSITORIES, capçalera, àncores amb camí, codi mort | baixa | CONFIRMAT o PLAUSIBLE | laboratori; -9 i les segones meitats de -10 i -12 són decisió del Mestre |

**Tooling · Mapa** (`fonts-vigilancia.mjs`, `mapa-consola.mjs`, generador de lease):

| Id | Veredicte | Estat |
| --- | --- | --- |
| tooling-mapa-1: les proves de laboratori queden roges per sempre després d'aplicar el pegat | CONFIRMAT | corregit (skip «ja aplicat»). També a `governanca-260930-maria.test.mjs`, que era fora de la llesca: 9 roges falses → 15 skip |
| tooling-mapa-2: tres asserts que no proven el que diuen | CONFIRMAT | inabastables des que salten |
| tooling-mapa-5: un torn il·legible desapareix del recompte | PLAUSIBLE | pendent (governança) |
| tooling-mapa-6: àncora del Mapa distinta de la de la porta | PLAUSIBLE | pendent (governança) |
| tooling-mapa-7: `git status` sense `--no-optional-locks` a la closca | PLAUSIBLE | laboratori |
| tooling-mapa-3, -4 i -8 | REFUTAT | cap |

### 2. T2 · Verificació visual (1440 i 375 px, servidor fresc al 3340)

**Abans (04:00-04:05):**
- **Consola:** sense desbordament. L'Índex obri amb nivells h2 a h5; les mètriques h5 hi entren.
- **Explorador:**
  - 1440: graf (683 px) i detall (384 px) costat per costat.
  - 375: filtres, graf i detall, apilats.
- **Agenda del Mur:**
  - S'obri a gener del 2023, el mes de l'únic acte.
  - 1440: la píndola és al 29 i la targeta fa 954 px d'alt. Un artefacte de captura semblava retallar-la, però l'`getBoundingClientRect` diu que no.
  - 375: la píndola es fa un punt de 8×8.
- **Calendari de la Consola:**
  - 1440: 210 píndoles de 130-131 px.
  - 375: punts. La taula de processos es desplaça en horitzontal dins del seu marc (`overflow-x: auto`); no és cap retall.

**Després (05:48-05:52):**
- **Tauler, 1440 i 375:** cap desbordament. L'Índex fa 2/14/14/20/0 entrades de nivell 2 a 6, idèntic a abans.
- **Aplec:** idèntic, a 375 i a 1440. Pastilla «10:00 29/01/23», insígnia 29 / GENER / 2023. El clic porta a `/mur?date=2023-01-29`: el calendari marca el dia 29 i la targeta es queda.

### 3. T3 · Targetes del tauler

**Implementat:**
- `estatsPagina()` viu al costat de `mesuresPagina()`. La funció que el Mestre nomenava no s'ha tocat perquè el seu array és la signatura de «Canvis nous» (`consolaPagines.test.js:136-141`).
- Els estats es calculen amb les mateixes funcions pures que les pàgines, que ara són una sola font de veritat: `inventariMapa.js` nou, `esSenseLector`, `pecesAgents`, `recomptePer`.
- L'etiqueta de nivell es deriva del desglossament.
- Es pinta com a `ul.sdp-consola__estats` d'`Insignia`, sense capçaleres: l'avís de l'Índex queda resolt.
- 337 proves a `src/sections/consola`. Les guardes de la Llei del Píxel mostren que les pàgines no canvien. Les proves literals de la signatura no s'han editat.

**Amb les dades d'ara:**

| Targeta | Estats a la coberta | Etiqueta |
| --- | --- | --- |
| Pols | «Últim rebut fa 10 dies» | Important (D1) |
| Explorador | — | — |
| Fluxos | «2 llocs amb faena i cap lector» | Important |
| Calendari | — | — |
| Inventari | «1 skill amb semàfor ambre» | Important |
| Entrades | «20 skills opaques» | Important |
| Agents | «Fluxos de treball: falta», «Tauler: sense lector» | — |
| Actors | «10 candats per acreditar», «2 llocs sense lector» | — |
| Avisos i salut | «2 avisos mitjans», «2 mètriques sense mesura (N/A)» | Important |

**D1 · per què el pols diu «Últim rebut fa 10 dies».** No és una fallada de telemetria, és una font obsoleta:
- La Consola compta els `matrix.rebut` de `.agents/.diari_sessio.jsonl` (`tooling/vite/consola-iaia.mjs:46-49`).
- L'últim és del 2026-09-19T23:03:39Z. En total n'hi ha 38 i el primer és del 10-09.
- Des que el flux documental passa per `document.mjs context`, els rebuts viuen dins de cada torn (`.agents/runtime/turns/*.json`) i Matrix ja no n'escriu.

Remei proposat: que `recullConsola` compte també els rebuts dels torns, que `fonts-vigilancia.mjs` ja resumix. Com que és tooling, necessita lease. És la pista per a la tasca 3 de l'Acta 0530.

**Pendents de decisió:**
- l'espècimen de `.sdp-consola__estats` al catàleg de Disseny (Pedra Seca §9);
- la incoherència de «declarat-sense-llancador», que dins de la pàgina és neutre i a la coberta, avís;
- els textos nous viuen a `consolaPagines.js` i no a `PAGE_COPY`.

L'Acta 0530 diu que «les mètriques es queden ocultes si no fas clic». En la verificació en viu, les mètriques h5 i les insígnies es veuen a la coberta sense cap clic, a 1440 i a 375. Si el Mestre ho va vore en una captura, convé saber de quina vista era.

### 4. T4 · Traductor: decisió

**Fets, amb la font entre claudàtors:**
- **La retirada.** Google retira el giny web l'1-10-2026 [L: WP Hive 18-09-2026; GTranslate 06-09-2026, part interessada; fragment del blog oficial de Search Central, que no he pogut carregar sencer].
- **El DOM.** Reescriu els nodes de text en `<font>`, i React deixa el text congelat o peta amb `removeChild` [L: Martijn Hols 2024; facebook/react#11538].
- **El nostre codi:**
  - la CSP `script-src 'self'` (`index.html:8`, `vercel.json:8`), la porta E4 (cap `window.X`) i el shadow root tancat de l'embed el bloquegen;
  - el codi no té cap motor de traducció (`TranslationsSection.jsx:42-54`);
  - hi ha dos valors per defecte del clic «Traduir»: `useAccions.js:216` i `UniversalPage.jsx:41`, amb un `item_id` que ningú no llig.
- **Català a les APIs natives.**
  - La Translator API de Chrome (138+, només escriptori) no inclou `ca`, `eu` ni `gl`.
  - Firefox Translations té `ca↔en`, però no té API per a les pàgines.
  - Apple no té català.
- **Opcions sobiranes.**
  - Apertium APy: GPL, amb modes `cat_valencia`.
  - Softcatalà NMT: MIT, i implementa l'API web d'Apertium.
  - Bergamot: uns 24 MB per direcció i sense variant valenciana.

**Proposta (D4):**
- Capacitat opcional `traduccio` al contracte, amb `tradueixTextos(textos, a)` i un DTO de text, mai HTML.
- Un domini pur `traduccio.js` i un hook `useTraduccio` per targeta.
- Adaptador per defecte: API web d'Apertium autoallotjada, que cobrix APy i Softcatalà.
- Millora progressiva amb la Translator API on hi haja parell.
- Sense la capacitat, el clic fa el que fa ara.
- Mitigació del risc heretat (qualsevol usuari que traduïsca la pàgina amb el navegador): error boundaries per secció, text condicional dins de `<span>`, i `translate="no"` només a les xifres exactes.

**Decisió del Mestre:** el contracte (afecta Sollutia) i el canvi visual de les targetes.

### 5. T5 · Dades del Mur

**Implementat:**
- `mapejadorSeccions.js` ja no inventa el `date` a partir de `created_at`, que a més anava en UTC.
- `EventCard.jsx` llig el model en hora local amb els lectors d'`editorial.js`:
  - sense acte vàlid, no hi ha insígnia;
  - una hora que el model no llig es conserva tal com l'escriu l'autor.
- `MurSection.jsx`: el filtre `?date=` usa el model (`acteOcorreElDia`, que també troba el dia de la pastilla), i l'ordre usa l'instant que pinta la pastilla.
- Comentari del contracte `loadMur().events[]` a `contracte.js`, sense tocar cap export.
- Proves en tres fusos: Madrid, Los Angeles i Kiritimati, amb una guarda que falla si el fus no s'aplica.

**Canvis visibles, que queden per ratificar:**
- un acte de tot el dia deixa de mostrar «01:00» o «02:00»;
- fora d'Europa, el dia deixa de recular;
- un acte sense dia real perd la insígnia de calendari.

Amb les dades d'avui només hi ha l'Aplec, i és idèntic.

**Pendents:**
- `detailSectionMeta.jsx:171` pinta `item.date` cru.
- La barra taronja del detall no usa el model.
- Les files de `section_submissions` que ja porten un dia inventat necessiten una consulta al servidor: les que tenen `payload->>'date'` igual al dia UTC de `created_at`.

### 6. T5 · Deute de portes

**Porta Frontmatter.** Hi ha dos camins de caiguda.

Camí 1 · Zero tolerància sobre els fitxers modificats (`tractor-frontmatter.mjs:448-533`):
- `.agents/ON_ESTIC.md` el reescriu el hook de sessió sense `## Vincles`. El remei és de governança (`despertar.mjs`) i està al paquet del laboratori.
- L'índex de l'Escriptori ja està corregit.
- `tests/frontmatter-sessio.test.mjs` donava un verd fals perquè el seu cens amagava `.agents/` i l'Escriptori. Ara vigila els mateixos fitxers que el tractor, amb una prova de paritat. Queda roig honest per ON_ESTIC.

Camí 2 · Sostre (deute abans → després de la llesca L6):

| Llei | Abans | Després | Sostre |
| --- | --- | --- | --- |
| F1 | 116 | 109 | 165 |
| F2 | 45 | 43 | 190 |
| F3 | 36 | 6 | 6 |
| F4 | 25 | 4 | 2 |
| F5 | 2 | 2 | 1 |
| F9 | 119 | 97 | 208 |

- Les 18 actes de `10_actes/` queden amb deute zero. No alimenten cap artefacte: `publication-policy.mjs` exclou `10_actes`.
- F4 i F5 continuen per damunt del sostre per tres fitxers:
  - `01_ser/04_taula_potencia_models.md` alimenta `src/data/wikiManifest.js`, i el compilador no el puc executar: ordre per al Mestre.
  - `docs/auditories/260915_0436_AUDITORIA_purga_vigencia.md` i 001 NEXUS són governança o immutables: paquet del laboratori.

**Torns caducats.** Cap porta els compta. Ho fa la mètrica del Mapa `torns-caducats-oberts` (`construeixMapa.js:616-634`): 116 registres, dels quals 5 closed i 101 caducats sense tancar.
- **Per què no es tanquen:**
  - `readTurn` rebutja un torn caducat (`turns.mjs:44`);
  - `checkTurn` exigix el pla i els rebuts presents, i els trasllats sense handoff els trenquen;
  - la zona humana no té canal de consentiment.
- **Remei preparat al laboratori:** l'estat terminal `retired` (retirat no vol dir tancat) i la CLI `retira_torns.mjs`, amb `--sec` per defecte i `--escriu --nota`.
- **Pas de src posterior:** `caducat` exclou `retired` i s'afig una mètrica nova. És una fila h5 més a la Consola, i necessita la teua ordre.

### 7. T6 · Actualitzacions automàtiques de WordPress

**Causa (evidència del codi de WordPress 6.5 i trunk, i de Studio local, WP 7.1.2):**
- **A Studio no corre el plugin del repo.** La còpia instal·lada és `socdepoble-wordpress-plugin/socdepoble-enxufe.php`, versió 0.1.0, amb `Update URI: false` i sense `includes/`. El nucli crida `update_plugins_false`, el plugin no entra ni a `response` ni a `no_update`, i la cel·la ix buida (`class-wp-plugins-list-table.php:1397-1421`).
- **Al repo hi havia una finestra latent.** Quan s'instal·la el plugin, la comprovació es fa amb el plugin encara inactiu. `activate_plugin()` no toca el transient, i el commutador no apareix fins que caduca la memòria cau: 1 h a Extensions, 12 h a la resta de l'administració.

**Implementat** a `wordpress-plugin/includes/actualitzador.php`:
- `register_activation_hook`, que invalida el transient (`delete_site_transient`, mai `set_site_transient`);
- filtre `plugin_auto_update_setting_html`, que afig una nota amb enllaç als Ajustos quan la prova del canal no és `good`. Reutilitza etiquetes ja traduïdes;
- docblock actualitzat.

A `readme.txt`, el paràgraf del canal continua en una sola línia i la variant del directori el lleva sencer.

**Garanties:** intactes (signatura Ed25519, paquet simbòlic, mida i sha256, arrel del zip, cap `autoupdate`). `enxufe-plugin` fa 13/13 i `enxufe-empaqueta`, 13/13. No hi ha PHP local: la prova en viu és teua.

**Notes d'ús de WordPress (punt 3 de l'addenda):**
- **Com mostrar l'App.** L'App es mostra amb el shortcode `[socdepoble_app]` (`wordpress-plugin/includes/marcatge.php:351`). Admet els atributs opcionals `nom_poble`, `poble` i `ruta_inicial` (`readme.txt:17-20`, `:52`).
- **Alternatives.** El bloc natiu «Sóc de Poble» (`marcatge.php:352`) o la plantilla de pantalla completa.
- **El bundle.** Cal compilar-lo abans amb `npm run build:wp` (`package.json:72`), que genera `dist/soc-de-poble.standalone.js` i `dist/sdp-release.json`.
- **Sense bundle,** el shortcode mostra un avís (`marcatge.php:281`) i la Salut marca un error crític.
- **Estat d'ara.** `wordpress-plugin/dist/` no té `sdp-release.json`: cal recompilar.
- **Studio.** Cal substituir la còpia 0.1.0 per una còpia real a `wp-content/plugins/socdepoble-enxufe/`, sense enllaç simbòlic.

### 8. Laboratori de governança (D6)

`02_investigacio_ia/260930_0400_governanca_claude/` té els fitxers complets a `nous/`, `prepara-pla.mjs` i un `LLEGIU_PRIMER.txt` amb les ordres.

**Què genera `prepara-pla.mjs`:**
- el pla `sdp.mutation.v1`;
- la Petorreta i el manifest;
- el sha de cada original;
- i es nega a fer-lo si algun fitxer ha canviat o si el paquet ja està aplicat, perquè reconeix la transacció acceptada.

**Contingut:**
- **Hook d'Antigravity:**
  - `ask` en lloc d'`allow`, excepte les tres lectures;
  - caixa, shell, categories, `nomReal`;
  - traça amb els secrets emmascarats.
- **Porta Olivera:**
  - Escriptori absent → 1;
  - noms fora de taxonomia;
  - reapuntat per token;
  - capçalera tolerant;
  - àncores planes.
- **`hooks-local.mjs`:** fora la línia 113.
- **Torns:** `retired` i `retira_torns.mjs`.
- **Fitxers de governança:**
  - `despertar.mjs` amb `## Vincles`;
  - normes de `.agents/rules`;
  - immutables de 001 NEXUS;
  - `--no-optional-locks`;
  - la skill `core-higiene-escriptori` amb la lliçó de recaiguda.

**Proves:** dos corredors, 21/21. Proven els fitxers nous en una còpia de `tooling/`: 86 proves de portes i 67 de torns, amb set mutants que cauen. Els consumidors reals fan 93/93 sense tocar-los.

**Decisions del Mestre** (`notes/portes.txt §4`):
- `force_ask`, perquè `ask` respecta l'«Always Allow» de l'IDE;
- `allow` de lectures sense mirar el camí (`.env`);
- TRANSITORIES derivades de `taxonomia.json`;
- `--arxiva` en simulació per defecte;
- afegir `turns-retirats` a `test:node` (toca `package.json`).

### 9. Incidència de l'Escriptori (resposta al prompt 0440)

**Diagnosi (evidència a `notes/escriptori.txt`):**
1. **La declaració de viu no té amo ni caducitat.** Qualsevol document davall d'una capçalera «## Activitat en curs…» es conserva per sempre (`porta-olivera.mjs:67`). L'índex en tenia dues d'idèntiques i cinc d'històriques. La porta eixia amb 0 amb 7 documents solts.
2. **Arxivar no fa el relleu del torn.** `--arxiva` mou i despenja l'àncora, però del handoff només n'imprimix el consell (`:375`). L'índex té 11 seccions «Relleu arxivat a mà». Per això tanquen 5 torns de 116.
3. **Claude no té la capacitat.** El hook només em deixa `--informe` i `document.mjs` context/create/plan/check/own (`mutation-policy.mjs:134-160`, `command-policy.mjs:78`). Cada neteja depén de MarIA o del Mestre, i per això costa un prompt més cada vegada.
4. **Algunes categories no tenen eixida.** `missatge` no es pot arxivar per nom, i va entrar sense cap porta.
5. **El hook d'Antigravity autoaprova.** L'edició de MarIA a la skill de les 02:37Z va trencar el segell. El Mestre el va reconciliar a les 04:42 (transacció `c0ef7f38`), i a les 05:50 `segella.mjs` torna a donar 42aa39a9 intacte.
6. **Recaiguda pròpia.** El router va nomenar `core-higiene-escriptori` en el missatge de les 04:05 i Claude no la va obrir.

**Fet en el torn, sense moure cap fitxer:**
- una sola «## Activitat en curs», amb el torn i el motiu de cada document;
- les cinc històriques passen a «Activitat tancada»;
- el `## Vincles` de l'índex queda net (F9);
- àncores als dos laboratoris de governança, que no en tenien cap (porta SCC).

La porta ix amb 0.

**Correcció estructural proposada (P1-P7, al laboratori):**
- `--arxiva` fa el handoff ell mateix;
- declaració amb torn que caduca;
- una sola secció viva;
- capacitat mínima per als agents locals, amb canvi de l'AGENTS §0.1 (**D7**);
- `tancament --check` exigix el relleu;
- `create` es nega si la porta no ix amb 0;
- TRANSITORIES del catàleg.

**Reflex de correcció:** la lliçó 260930 i la línia de recaiguda per al LEDGER són al laboratori. El hook no em deixa escriure a `.agents/`.

### 10. Decisions per al Mestre

- **D1** · El pols hereta «Important» amb rebuts de més de 7 dies. Implementat, es pot revertir.
- **D2 i D3** · Botó d'editor per als hooks de git, i colors de Script i Document. No fets.
- **D4** · Traductor: capacitat de contracte i adaptador Apertium/Softcatalà. No fet.
- **D5** · Filtre `?date=` unificat amb el model. Implementat, idèntic amb les dades d'avui.
- **D6** · Paquet de governança. Preparat, pendent de lease.
- **D7** · Capacitat d'arxivar i fer handoff per als agents locals, sobre documents del seu propi torn. És canvi de BIOS.
- **Ratificar els canvis visibles de T5** (§5) i la nota de la cel·la de WordPress (§7).
- **Retroalimentació de la plantilla `prompt_local`:**
  1. Arriben a l'agent seccions `[pendent]` (Preflight, Riscos); la Plantilla viva hauria de refusar-les.
  2. Les addendes arriben com a `missatge`, una categoria fora del catàleg: cal una ruta d'addenda o una versió nova del prompt, amb Historial.
  3. Falta una secció «Capacitats de l'entorn» (shell confinada, WebSearch bloquejat, navegador integrat, portes que no es poden executar).
  4. La ruta `auditoria` lliura la guia de l'auditoria canònica de la Wiki, no una plantilla d'informe de codi. Per això este informe hereta el paràgraf «Esta guia és consultiva…».
  5. «Arregla la porta Frontmatter per a les carpetes i torns caducats» barreja una porta i una mètrica del Mapa: convé nomenar la font.

### 11. Relleu per a tancar el torn (el Mestre o MarIA: `.agents/` és governança)

**Bloc per a `.agents/ESTAT.md`, a dalt de tot:**

```markdown
## ESTAT_ACTUAL · 2026-09-30 05:58 · Claude (Opus 5.5) · T1-T6: tauler, Mur, WordPress, revisió adversarial i incidència de l'Escriptori

- **Torn:** `torn_2c40cd77-c695-4fc5-998e-a41afd6c6724` (code, caduca 2026-10-01T01:54Z). Pla [[260930_0320_pla_implementacio_claude]]; informe [[260930_0400_auditoria_claude]].
- **Fet a src i proves:** T3 desglossament de targetes (`estatsPagina`, llista d'insígnies, Índex intacte); T5 Mur (sense dia inventat, hora local, filtre i ordre pel model); T1 correccions confirmades d'Explorador, Calendari i model; T6 actualitzador de WordPress (ganxo d'activació i nota a la cel·la); frontmatter de 18 actes; guardes «ja aplicat» dels corredors de laboratori. Vitest `src`: 3432 verdes, 2 roges alienes a `XatSection.test.jsx`.
- **Laboratori:** `02_investigacio_ia/260930_0400_governanca_claude` amb el hook `ask`, Olivera, torns retirats i la lliçó de recaiguda (LLEGIU_PRIMER.txt).
- **Pendent:** D1-D7; lease del paquet; `04_taula_potencia_models` i manifest; ON_ESTIC; rebuts del pols des dels torns; Studio amb còpia real del plugin; auditoria de Codex (Acta 0530); prompt 0450 (tractor cognitiu).
- **Responsables:** Mestre (lease, decisions, Studio, tancament, commit); MarIA (arxivat amb relleu); Codex (auditoria adversària); Claude (codi).
```

**Línies per al LEDGER** (amb l'eina de signatura, mai a mà):

```markdown
260930 | torn | torn_2c40cd77 | T1-T6 implementat; paquet de governança 260930b al laboratori
260930 | recaiguda | core-higiene-escriptori | documents solts i trasllats sense relleu; skill del router no oberta
```

**Ordres, des de l'arrel:**
1. `node tooling/gates/segella.mjs` (esperat: intacte).
2. Els passos del `LLEGIU_PRIMER.txt` del laboratori per a la lease, si la vols aplicar.
3. `node tooling/gates/tancament.mjs --check --turn-id torn_2c40cd77-c695-4fc5-998e-a41afd6c6724` i, si dona `valid`, `--close`.
4. En tancar, arxivar amb el seu relleu:
   - el prompt 0320, l'addenda 0405, els dos plans 0320, este informe i el prompt 0440;
   - l'addenda va amb `mv`, perquè `missatge` no és transitòria (`notes/escriptori.txt §4`).
5. Commit revisat, amb `.agents/runtime/turns/torn_2c40cd77-…json`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Proves executades per l'orquestrador (05:47-05:52):**
- `npx vitest run src`: 234 fitxers, 3432 verdes i 2 roges. Les dues són a `src/sections/xat/XatSection.test.jsx`: un mock sense l'export `XatContext` a `FakeChatOnboarding.jsx:92`, i un botó `app-grid-header-btn` que no troba.
  - Cap llesca toca `src/sections/xat`: `git status` no hi mostra cap canvi.
  - No he pogut executar-ho contra HEAD, perquè el hook no deixa ni `git stash` ni `checkout`.
- `node --test` (11 fitxers): enxufe-plugin, enxufe-empaqueta, governanca-260930b-portes i -torns, governanca-260930-mapa i -lease, mapa-consola, fonts-vigilancia, antigravity-hook, porta-olivera-v3 i tractor-enxufe. Resultat: 99 verdes, 0 roges i 9 skip «ja aplicat».
- `node --test tests/governanca-260930-maria.test.mjs`: 0 roges i 15 skip. Abans eren 9 roges falses.
- `node tooling/gates/segella.mjs`: intacte (42aa39a9).
- `node tooling/gates/porta-olivera.mjs --informe`: exit 0, 8 documents solts, tots declarats vius amb el torn i el motiu.
- `node tooling/wiki/document.mjs check` del pla: vàlid, i vinculat al torn amb `document.mjs plan`.

**Per llesca, segons els revisors adversarials:**
- L1: 337 a la Consola, 573 amb els consumidors.
- L2: OK, sense correcció.
- L3: 437.
- L4: 1357, més 444 dels consumidors.
- L5: OK.
- L6: OK.
- L7: 21/21.

Tots els defectes demostrats pels revisors estan corregits i tenen proves que abans eixien roges.

**Navegador:** cobert a la secció 2, amb les mesures de `getBoundingClientRect` i `getComputedStyle`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**No he pogut executar** (el hook ho impedix):
- `tractor-frontmatter.mjs` directament: s'ha executat a través de `tests/frontmatter-sessio.test.mjs`;
- `verificador-scc.mjs`;
- `tancament.mjs`;
- `compile-wiki-to-app.mjs`;
- ESLint sobre tota la llesca: només hi han passat els fitxers que cobrix `lint_logica_usuari` i `lint_enxufe`;
- `tests/lint-sessio.test.mjs`, trencat per un camí de la seua llista que ja no existix (`barraTaronjaData.contracte.test.jsx`).

**Sense verificació real:**
- No hi ha PHP a la màquina: el plugin només té proves estàtiques, i la prova a Studio és del Mestre.
- La traducció de Google es retira l'1-10-2026, segons fonts secundàries. La nota oficial només l'he vista en un fragment de cercador.

**No escrit, perquè és governança:**
- ESTAT, LEDGER, skills i les notes de memòria de l'agent: el hook bloqueja `.agents/` i qualsevol ruta fora del repo.
- El relleu d'estes peces queda a la secció 11 i al laboratori.

**Arbre compartit.** MarIA i el Mestre han escrit durant el torn: índex, pla de MarIA, prompts 0440 i 0450, acta 0530, reconciliació del segell i `tooling/higiene/tractor_cognitiu.mjs`. No he revisat este últim: és la tasca del prompt 0450.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
