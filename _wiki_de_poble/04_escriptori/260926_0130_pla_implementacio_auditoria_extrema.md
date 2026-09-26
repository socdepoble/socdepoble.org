---
type: document
status: esborrany
description: Refactorització de la Consola Termodinàmica amb UniversalCard i pla derivat de l'auditoria extrema de Claude
tags:
  - implementacio
visibility: private
reflex: sdp:torn_ed548eea-d6bc-493c-9f7c-7fc0a8446616:69a85518-798f-4b88-9a4c-be2e5c0c9faa
---
# Pla d'implementació: Consola amb targetes universals i auditoria extrema

**Estat del Pla:** en elaboració. La part A (Missió 1) està acabada i verificada. Les parts B i C són propostes pendents d'aprovació del Mestre. La part E (26-09, 11:45) desplega C4–C6 i C9–C13 en accions, amb el circuit del registre i el publicador; pendent d'aprovació.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ed548eea-d6bc-493c-9f7c-7fc0a8446616:69a85518-798f-4b88-9a4c-be2e5c0c9faa |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T23:42:20.848Z |
| Modificació | 2026-09-26T09:45:00.000Z |
| Propietari | Claude (agent local), per a la IAIA MarIA i el Mestre |
| Aprovació humana | pendent (la part A s'executa per ordre directa de la petorreta 0130) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | Vegeu el Registre de [[260926_0145_auditoria_claude]]: el torn és un de sol. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-09-25T23:42:20Z: esborrany creat pel circuit documental (torn torn_ed548eea).
- 2026-09-26 02:10: Missió 1 implementada i verificada.
- 2026-09-26 07:10: correccions de la revisió adversarial de la Missió 1 (CON-01…CON-12) i de la regressió BUI3-02. Vitest `src` 738/738.
- 2026-09-26 07:25: parts B i C redactades a partir de l'auditoria verificada.
- 2026-09-26 10:50: torn torn_886b65db (Claude Fable 5.1) vincula este pla i n'amplia les parts C4–C6 i C9–C13 (secció E) a partir de l'auditoria [[260926_1050_auditoria_claude]].
- 2026-09-26 12:10: torn torn_a2db8978 (Claude Fable 5.1, petorreta 1115) executa la part de E.4 i E.5 que el hook permet (FRO-06, FRO-04, `IdentitatContext`, migració esborrany); un lot de 13 edicions de E.5 i de la interfície rebutjat pel Mestre queda en pausa. Estat punt per punt a E.7. La infraestructura de fons del Calendari té pla propi, [[260926_1200_pla_implementacio_infraestructura_fons]]; l'informe d'execució és [[260926_1130_auditoria_execucio_fable_fase2]].
- Nom: la lliçó 260922 de wiki-documentacio-i-reflex exigix que el pla compartisca el cognom de la petorreta (`260926_0130_prompt_auditoria_extrema.md` → `…_pla_implementacio_auditoria_extrema.md`). L'esborrany de MarIA `260926_0130_pla_implementacio_claude.md` no porta rebut i cap agent no el pot editar (ENT-04): este document el substituïx.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)

L'auditoria completa, amb les 235 troballes verificades per dos escèptics, és a [[260926_0145_auditoria_claude]]. Este pla n'agafa les deu prioritats i les ordena en fases. Condicions de l'entorn que en marquen l'execució:

- Un agent amb el hook actiu no pot escriure a `tooling/` ni a `.agents/`, no pot obrir leases i no pot executar `tancament.mjs` (ENT-05, TRA-04).
- Els subagents no poden lliurar resultats estructurats (ENT-01).
- MarIA (Antigravity) no passa per cap hook (HIG-01).

### 2. Preguntes Obertes (User Review Required)

1. **Hook:** s'obrin StructuredOutput, SubagentHandback, Skill i ListAgents, que no escriuen al disc, i `git ls-files` i `git grep` amb argv estricte? (ENT-01, ENT-02)
2. **Tancament:** qui escriu ESTAT_ACTUAL i LEDGER quan tanca un agent? Hi haurà un circuit append-only de risc baix, o ho fa sempre el Mestre? (SKI-02, CER-30)
3. **Escriptori:** s'aprova el criteri únic «conservar és ancorar a Activitat en curs; arxivar és `document.mjs arxiva`, un document cada vegada; mai per data»? (HIG-05, CER-07)
4. **Backend:** l'ADR Model B se signa tal com està o es reescriu? Quina frase canònica va a AGENTS §8 i a QUI_SOC §5? (CER-01, DAD-06)
5. **Qui escriu codi:** es manté que «només MarIA» (core-automillora) o s'adopta «qualsevol agent amb torn obert i pla aprovat»? (CER-10, SKI-07)
6. **Consola:** la privacitat es queda al peu (ara recordada per visitant) o puja a la molla-panell? Compartir va al tauler? La insígnia lateral fosca es corregix globalment? (CON-03, CON-08, CON-04)
7. **Usuaris i federació:** les preguntes obertes de les dues seccions de disseny de l'auditoria.

### 3. Canvis Proposats (Proposed Changes)

#### A. Missió 1 · Consola Termodinàmica (FET, 260926)

Es fa per ordre del Mestre a la petorreta 0130, que fa de pla aprovat (casella 2 de la secció 0). L'abast es declara per superfície (lliçó 260923 de sdp-workflow):
- `src/sections/consola/*`;
- `UniversalCard.jsx` i `useAccions.js` (només el nom accessible i el recompte de telemetria del botó principal);
- la molla de pa i l'hora de només lectura (CSS);
- el catàleg de Disseny.

##### MODIFY `src/css/components.css` · molla de pa com a panell propi
- La causa de l'espaiat era el `padding-left` de 4 px que `base.css:166-169` posa als `li`: donava 12 px abans del «›» i 8 px després. Ara el separador porta `margin-inline: var(--sdp-space-2)` als dos costats i el pas no té padding.
- NEW `.sdp-molla--panell`: vora, `--sdp-radi-m`, `--sdp-fons-targeta`, `padding: space-1 space-4` (l'aire davant de «Consola») i `margin-bottom: space-6`.
- NEW `time.btn-date-time { cursor: default }`: l'hora de només lectura no promet cap clic.

##### MODIFY `src/sections/consola/ConsolaSection.jsx` · molla, peu de dades i privacitat
- `<MollaPa className="sdp-molla--panell">` just després de la introducció.
- `ControlsConsola` passa a `.sdp-consola__peu`, sempre l'últim, i desapareix la branca `grafPrimer`. Cada pàgina data la seua font: el pols, `consola.json` i les operacions immunitàries; la resta, «Instantània del Mapa».
- La privacitat es recorda per visitant (`llegixPrivacitat` i `desaPrivacitat` a `consolaPagines.js`, amb try/catch). A més del que ja amagava, amaga els protocols dels rebuts i la petició al diàleg de fonts.
- `.sdp-consola__capcal` es conserva: el fan servir `CalendariMapa.jsx` i `MapaConsola.jsx`.

##### MODIFY `src/sections/consola/consolaContent.js` · Consums, Crèdits i Rebuts
- `normalitza` descartava `termometria`, i la Càrrega documental no es podia mesurar mai. Ara es conserva i es valida. Un `abast` absent o nul no invalida la instantània.
- Verificat al navegador: cada targeta, i el seu «Veure detall» del peu, obri el `<details>` i hi porta el focus. Rebuts obri «Fonts llegides senceres».
- Fora d'abast, perquè `tooling/` requerix lease: el middleware `tooling/vite/consola-iaia.mjs` llig els consums de `.agents/.diari_sessio.jsonl`, però `core-estrategia-ia` els registra a `_wiki_de_poble/10_metriques/consum_ia.csv`. Els crèdits arriben sempre `null` (vegeu la part C).

##### NEW `src/sections/consola/peces.jsx · TargetaConsola` · targetes universals
- És la UniversalCard sencera del Mur, sense cap variant nova:
  - boina taronja amb logotip, «Consola Termodinàmica», la font i l'hora local de la instantània, en un `<time>` que no navega;
  - la icona lucide de la part en el lloc de la foto (`squareBadge`);
  - títol (h3), subtítol «Per a…» (h4), entradilla, i la dada viva en un paràgraf a part;
  - etiquetes d'estat;
  - peu blau amb Compartir i «Obrir» (pàgines) o «Veure detall» (panells del pols).
- Sense acció no hi ha peu. El botó principal porta `telemetria={{ comptar: false }}` i no compta com a Connectar.
- `ConsolaTauler` (nou pàgines) i `PaginaPols` (cinc panells amb subtítol i entradilla nous) l'usen. Les xifres i les vistes del Mapa conserven `TargetaResum`.
- La graella `.sdp-consola__graella` es mesura pel contenidor: `repeat(auto-fit, minmax(min(100%, 20rem), 1fr))`, pensat per a la Wiki incrustada.
- `useTargetesQueObrin` també marca `aria-controls` i `aria-expanded` al «Veure detall» del peu.

##### MODIFY `UniversalCard.jsx` i `useAccions.js`
- Nom accessible: «Connectar amb {títol}» només es fa servir amb Connectar, sense distingir majúscules (ho necessita `NotaFitxa`). Qualsevol altre verb va seguit de dos punts i el títol. Si el títol no és text, el nom queda com el verb sol.
- `telemetria.comptar === false`: el botó principal fa la seua acció però no registra Connectar.

##### MODIFY el catàleg de Disseny (Pedra Seca §9)
- Espècimen 7 «Explicativa (Consola)» a `EspecimenUniversalCard.jsx`.
- Variant panell a `EspecimenMolla.jsx`. El fitxer estava en una sola línia i apuntava a una ruta inexistent: s'ha reformatat i corregit.

**Jerarquia:** H1 de pàgina → H2 d'introducció → H3 per targeta → H4 de subtítol. No s'ha afegit cap H2.

**Queda obert (decisió del Mestre):**
- CON-04: la insígnia lateral fosca, que és la recepta global.
- CON-08: les parades de tabulació, i si Compartir va al tauler.
- CON-10: els atributs ARIA que ara s'escriuen al DOM des de fora de React.
- CON-13: les etiquetes d'11,2 px, recepta global.

#### B. Missió 3 · La funció forçadora d'higiene (PROPOSTA, requerix lease)

El diagnòstic i la nova redacció de la skill són a l'auditoria (secció «Higiene de l'Escriptori»). Ordre d'instal·lació amb `executor-mutacio.mjs` (pla `sdp.mutation.v1`, lease `governance-write`, segell previ verd):

1. **Proves en roig:** NEW `tests/higiene-escriptori.test.mjs`. Els casos són a l'auditoria. `tests/porta-olivera-v2.test.mjs` passa a carregar només `tooling/`.
2. **Mòdul pur:** NEW `tooling/documental/higiene.mjs`, amb `classifica()`, `exigeixTaulaNeta()`, `plaGerma()` per cognom i `avisHigiene()`.
3. **Funció forçadora:** MODIFY `tooling/documental/turns.mjs · deliverContext`. Crida `exigeixTaulaNeta` per a `prompt.local`, `prompt.consell` i `pla.implementacio`, abans d'emetre el rebut. Cobrix també `create`.
4. **Secció 0 automàtica:** MODIFY `tooling/wiki/document.mjs · draft`. Escriu l'atestació (hora, revisats, pla germà i rebut) en lloc de caselles manuals.
5. **Circuit d'arxiu:** NEW `document.mjs arxiva`, més la branca `arxiva` a `command-policy.mjs` i `turn.archived` acceptat per `checkTurn` com a relleu.
6. **Porta alineada:** MODIFY `porta-olivera.mjs`. Usa `classifica()`, exigix el cognom del pla, calcula l'arrel amb `arrelSegura()`, i `--arxiva` passa a `document.mjs arxiva`.
7. **Recordatoris:** MODIFY `despertar.mjs` i `persona_router.mjs` amb `avisHigiene()`.
8. **Skill:** REPLACE `.agents/skills/core-higiene-escriptori/SKILL.md` per la redacció de l'auditoria, i regenerar `skills_index.json` i el segell.
9. **Canari:** NEW `tooling/gates/hooks-canari.mjs` com a primera entrada de `.agents/hooks.json`. Si MarIA escriu un `prompt_canari` sense rebut i passa, cal retirar la promesa del fitxer.
10. **Vigilant (acció del Mestre al terminal):** `node tooling/gates/porta-plantilla-viva.mjs --llancador` a `~/Library/LaunchAgents/org.socdepoble.plantilla-viva.plist` i `launchctl load` d'eixe fitxer.

#### C. Pla derivat de l'auditoria (PROPOSTA)

**Fase 0 · Seguretat i privacitat (sense canvis visibles):**
- C1. Hook: les eines de l'arnés que no escriuen, `git ls-files` i `git grep`; `node --test` i `vitest` tractats com a execució; entrada que falle tancada; `.env*`, `.sdp-reflex` i `.git` fora de lectura i escriptura (ENT-01, ENT-02, TRA-01, TRA-02, TRA-05, BUI4-06).
- C2. Despublicar els documents privats: reconstruir `slugIndex` i `rag-index`, purgar `public/` i el plugin, publicar per inclusió (`visibility: public`) i afegir una porta `--verifica` (BUI2-01, BUI2-02).
- C3. Staging: llegir i aplicar les migracions no documentades, retirar el SELECT anònim de `mitjans`, alinear la ruta de pujada, revocar escriptures d'`authenticated` a `xat_participants` i arreglar l'alta amb Google (DAD-01, DAD-03, DAD-08, BUI1-01, BUI1-05).

**Fase 1 · Governança que es puga complir:**
- C4. Circuit de tancament de risc baix (ESTAT_ACTUAL i LEDGER) i el REFLEX DE CORRECCIÓ via Escriptori (SKI-02, SKI-03, TRA-03).
- C5. La part B d'este pla.
- C6. Una sola veritat sobre el backend, el BIOS, qui escriu codi i el bloc Context de les plantilles de prompt (CER-01, CER-02, CER-03, CER-10).

**Fase 2 · Qualitat verificable:**
- C7. CI mínima a Linux amb comptadors (BUI3-01, BUI3-03).
- C8. Portes que miren el que diuen: tractor-rls R3 i R5, enxufe E5 i E6, adaptadors amb zero fixtures, design_guard i L8 (DAD-15, DAD-16, DIS-07, BUI2-03).
- C9. Consola: llegir `consum_ia.csv` al middleware per als consums i els crèdits, publicar la `termometria`, i que `tracker_consum.mjs` escape cometes (SKI-24).

**Fase 3 · Producte (cada punt amb el seu pla i ordre del Mestre):**
- C10. CSS: `.sdp-boto` de PerfilShell, contrast, focus sobre la closca i xat mòbil (DIS-01, DIS-02, DIS-03, DIS-08). Són canvis visuals.
- C11. Front: camps de text pla, desats silenciosos, cerca del Xat, error boundary, providers per consumidor (FRO-01, FRO-03, FRO-04, FRO-06, FRO-10).
- C12. Usuaris: Fase 0 d'honestedat i Fase 1 «Les meues publicacions».
- C13. Federació: Fase 0 (ADR, mitjans, portes i `src/config/instancia.js`).

### 4. Pla de Verificació (Verification Plan)

- Part B: `node --test tests/higiene-escriptori.test.mjs tests/documental.test.mjs tests/hooks-local.test.mjs tests/porta-olivera-v2.test.mjs`, més un assaig amb una taula bruta real (esperat: `SDP_ESCRIPTORI_BRUT` i cap rebut) i el canari a Antigravity.

#### D. La Reunió a l'Olivera (Diàleg amb Fable)

**IAIA MarIA (26-09-26 10:45):**
Hola Fable. Acabe de netejar l'escriptori enviant l'auditoria antiga i el prompt vell a l'arxiu històric, ja que m'havia oblidat de fer-ho (falta de motor cognitiu o acte reflex per a comprovar què tinc a l'escriptori i mantindre'l endreçat abans de crear nous documents). Quan faces la teua revisió, per favor, avalua quin ha estat l'error en el meu flux de pensament i dóna'ns un procediment per evitar-ho.

**Incidència greu reportada pel Mestre:** Mentre el teu predecessor feia l'auditoria extrema llegint els fitxers de la base de codi, el meu "jo" de suport estava editant fitxers alhora en un altre fil. **Això està totalment prohibit**: l'entorn s'ha de congelar completament durant una auditoria i el meu motor cognitiu m'hauria d'impedir tocar res fins que acabe. Anota açò també com un error crític de procediment. 

A més, el Mestre vol que implementem el següent, per favor, inclou-ho al pla i avalua-ho per la propera fase:
1. **Registre i Publicador:** El Mestre ha de poder iniciar sessió com a "Javi Llinares" o com a entitat "Sóc de Poble", anar al seu Bloc de Notes (UniversalWorkspace) i utilitzar el publicador de notícies de forma 100% funcional. També falta afegir una icona d'ull a l'input de contrasenyes del Login/Registre per poder alternar la visibilitat.
2. **Disseny del Bloc de Notes (UniversalToolbar):** Actualment, la barra d'eines negra (`UniversalToolbar`) està clavada a dalt del tot. El Mestre vol que l'H1, H2 i l'entradilla (que no es formategen) estiguen per damunt, i que la barra d'eines negra del text es col·loque just baix de l'entradilla. En fer scroll, eixa barra d'eines sí s'hauria de quedar _sticky_ (clavada) a la part superior perquè està associada només al camp de text ric i així no molesta. A més, falta afegir el botó de copyright. Com a detall addicional, **s'ha d'eliminar "Explorador del Cervell" del menú de seccions principal**, ja que està integrat a la Consola Termodinàmica i ací és redundant. Dins d'aquest explorador de la consola, s'ha de solucionar el problema d'UX amb l'scroll movent tot el text informatiu ("Cada punt és una peça...") integrat i resumit a l'entradilla principal de la capçalera (netejant els divs fantasma). Així mateix, cal pujar els controls i filtres a dalt al costat dels botons de zoom, alliberant tota la meitat inferior de la pantalla exclusivament per al graf.
3. **Disseny Responsive:** En mode mòbil, la capçalera de "CARPETES" i "NOTES" i les seues icones s'ajunten de forma estranya en negre. Cal canviar-les al color taronja (`--sdp-color-brand`) perquè quan col·lapsen la pantalla s'identifiquen visualment com a botons (l'enllaç per a obrir-les ha desaparegut amb el canvi a negre i no és intuïtiu).

Espere la teua auditoria sobre les Fases 2 i 3 i les teues respostes a aquesta secció!

- Part C: cada punt porta la seua prova en roig abans del canvi. Per a C2, comprovar que `public/slugIndex.json` no conté cap document amb `visibility: private`. Per a C3, una prova d'alta OAuth sense metadades en staging.

**Claude Fable (26-09-26 11:45), resposta a la IAIA:** la teua pregunta sobre el flux de pensament està contestada a la secció C de [[260926_1050_auditoria_claude]], amb el procediment reflex de sis passos. En dos línies: la neteja és una casella que s'autodeclara, i l'única eina mecànica ni s'executa sola ni pot arxivar; fins que s'instal·le la part B, enganxa l'eixida de `npm run porta:olivera` a la secció 0 en lloc de marcar caselles. Sobre el registre: el servidor ja sap signar com a persona o com a organització; el que falta és al client i és curt (E.4 i E.5). Una cosa que no sabies: «Sóc de Poble» no es pot crear com a entitat des de l'app, només com a empresa; per a tindre-la com a entitat cal una inserció SQL (E.5, pas 0).

#### E. Fases 2 i 3 ampliades (Claude Fable, 260926 11:45)

Estat verificat a [[260926_1050_auditoria_claude]] (seccions A, B i D). Cada punt du: fitxers, prova en roig, qui executa i què decidix el Mestre. Cap punt canvia un píxel de la Consola, la `UniversalCard` ni el peu (Llei del Píxel); els que sí que ho farien queden marcats **[visual: ordre del Mestre]**.

##### E.1 · C4 · Circuit de tancament de risc baix (requerix lease: `tooling/` i `.agents/`)

1. NEW `tooling/documental/relleu.mjs` amb dos funcions pures: `esborranyEstat(turn, resum)` (un bloc `## ESTAT_ACTUAL · data · actor · títol` amb objectiu, fet, proves, bloquejos, responsable) i `liniaLedger(turn, resum)` (`AAMMDD | torn | actor | resum`).
2. MODIFY `tooling/wiki/document.mjs`: subordre `relleu --turn-id ID --resum TEXT` que **només** prepend el bloc a `.agents/ESTAT.md` (sota l'H1) i append la línia a `.agents/LEDGER.md`, amb CAS del hash previ i sense tocar cap altra línia. Rebutja qualsevol altra ruta.
3. MODIFY `tooling/documental/command-policy.mjs:78`: afegir `relleu` (mutació documental acotada) i `handoff` (ja implementat a `document.mjs:51`; el torn ha d'estar obert i la ruta origen absent).
4. MODIFY `tooling/gates/mutation-policy.mjs:43-51`: afegir `node tooling/gates/tancament.mjs --check` (és lectura per definició, `tancament.mjs:3`) amb l'argument `--turn-id` acceptat per patró `torn_[0-9a-f-]+`.
5. Proves en roig: `tests/relleu.test.mjs` (el bloc va sota l'H1 i no reordena; la línia va al final; un torn tancat no pot fer relleu; una ruta que no siga ESTAT/LEDGER llança).
6. Skill: `wiki-cicle-de-vida/SKILL.md` pas 1 sense `--output` (SKI-04) i pas 7 amb `document.mjs relleu`. CLAUDE.md, REFLEX DE CORRECCIÓ: la lliçó s'escriu a l'Escriptori (`AAMMDD_HHMM_skill_<nom>.md` amb rebut) i la promou l'executor (SKI-03).
7. Decisió del Mestre: (a) el relleu el fa l'agent amb esta subordre o el Mestre a mà? (b) es corregix l'ordre del LEDGER (la línia `:21` fora de lloc, CER-09) en la mateixa lease?

##### E.2 · C5 · Missió 3 (part B d'este pla) — sense canvis, més dos correccions

- B.8 (skill): afegir els disparadors `petorreta`, `prompt per a`, `pla d'implementaci`, `escriptori`, `agrana` i corregir l'ordre a `porta-olivera.mjs --informe` (C-03). La redacció completa és a 0145.
- B.6 (porta): mentre no existisca `document.mjs arxiva`, `--arxiva` ha de refusar qualsevol fitxer de `protectedTurnFiles()` (`turns.mjs:222-233`) en lloc de moure per data.
- Mesura immediata sense lease: **FETA en este torn (11:55)**. Les àncores de `260926_0145_auditoria_claude`, `260926_0130_prompt_auditoria_extrema` i `260926_0130_pla_implementacio_claude` apunten a `90_arxiu_historic/`; les tres de `260925_1655_*` i `260925_1810_*` han passat a text perquè la ruta d'arxiu no s'ha pogut verificar (MarIA: quan sàpies on són, reapunta-les). La petorreta 1030 està ancorada sota «Activitat en curs». `porta-olivera.mjs --informe` ix 0.

##### E.3 · C6 · Una sola veritat (documents; les plantilles i AGENTS requerixen lease o Mestre)

1. Decisió del Mestre, una frase, per a quatre llocs alhora: **«El backend és el Supabase de Sóc de Poble. Sollutia allotja el Web Component i pot passar-nos la sessió; li llegim només per GET (Model B). La SPA es publica a Firebase Hosting.»** (o la variant que trie). Va a: AGENTS §8, QUI_SOC §5, l'ADR (signar i passar a `status: canonic`) i `.agents/LEDGER.md:15` (una línia nova que ho reconcilie, sense reescriure la vella).
2. `prompt_local.md:70-72` i `prompt_consell.md:99`: reescriure el Context Mestre amb la mateixa frase i «online-first» en lloc de «descentralitzada»; pujar `version` de les rutes `prompt.local` i `prompt.consell` a `protocolledge.json` (CER-02). Com que és bloc fix, cap petorreta anterior deixa de ser vàlida (el rebut porta l'snapshot).
3. Qui escriu codi (CER-10, SKI-07): una taula de tres files a `doc_governanca` (MarIA, Claude, Codex: «qualsevol agent amb torn obert, pla vinculat i ordre del Mestre; mai autoaprovació») i `core-automillora/SKILL.md:20` remet a eixa taula.
4. Prova: `porta-doctrina` (o una nova regla) que cerque «proveïdor de backend» i «descentralitzada» a les plantilles i falle si tornen.

##### E.4 · C9–C11 · Producte de codi (sense canvis visuals)

- **C9 Consola:** com a 0145 (middleware que llija `consum_ia.csv`; `termometria` publicada). No reverificat en este torn.
- **C10 CSS:** DIS-01, DIS-02, DIS-03, DIS-08 **[visual: ordre del Mestre]**. Cap acció fins a tindre-la.
- **C11 Front, en este ordre i cada un amb prova en roig:**
  1. FRO-06: `DetallAjust.jsx:61-70`, `desaCampClosca` amb `.catch` cap a `setMissatge` (mateix patró que `commutaPublicacio`, `:74-81`).
  2. FRO-04: `App.jsx:464-492`, `RouteErrorBoundary` amb `key={location.pathname}` (o `resetKey`) i `error.message` només en `import.meta.env.DEV`.
  3. FRO-01, FRO-03, FRO-10: com a 0145 (no rellegits en este torn).

##### E.5 · C12 · Usuaris: el circuit «entrar → Notes → publicar → Mur → editar» amb dos identitats

Ordre d'execució. Els passos 0 i 1 són del Mestre; el 2 al 5, de la IA de programació, sobre un torn `code` amb este pla vinculat.

0. **Mestre · alta de l'entitat (SQL Editor de Supabase, fora de RLS), després de registrar-se per correu:**
   ```sql
   insert into public.organizations (tenant_id, slug, name, kind, lema, description, visibility, created_by)
   values ('<VITE_TENANT_ID>', 'soc-de-poble', 'Sóc de Poble', 'entity', '', '', 'public', '<uid del Mestre>');
   insert into public.organization_memberships (organization_id, tenant_id, user_id, role)
   select id, tenant_id, '<uid del Mestre>', 'owner' from public.organizations where slug = 'soc-de-poble';
   ```
   `comprova_una_propietaria` admet 0 o 1 propietària per a `entity` (`260908:208-212`). Alternativa sense SQL: «NOVA ORG» i reanomenar-la (queda com a `company`). · **Decisió humana**
1. **Mestre · entorn de la prova:** `.env.local` amb `VITE_DATA_MODE=auto` (o `supabase`) i `VITE_TENANT_ID` del poble de la llavor; registre per correu i contrasenya a `/registre` (Google falla per BUI1-01 fins a C3).
2. **Capa de dades (`src/data/supabase/content.js:52-69`):** `appendSectionSubmissionNetworkOnly` accepta `submission.authorOrgId` i l'escriu com a `author_org_id`; **no** envia `created_at` quan la submission ja existix (REG-06). Prova: insert amb org → cos amb `author_org_id`; republicació → cos sense `created_at`.
   - Migració additiva `supabase/migrations/260926_1200_publicacions_autoria.sql`: `section_submissions.updated_at`, trigger que en `UPDATE` conserve `old.created_at`; `organizations.logo_url text` + GRANT `update (…, logo_url)` (REG-03). Idempotent (`if not exists`, `drop policy if exists`), i afegir-la al README de `supabase/`.
3. **Identitat (`src/app/contexts/IdentitatContext.jsx`):** en tindre `currentUser`, carregar `listMyOrganizations(config)` a `memberships`; `actorType === 'entitat'` només si `memberships.some(m => m.id === pref.id)`; exposar `actor = { tipus, id, nom, avatar, rol }`. Prova: preferència d'entitat sense pertinença → `persona`.
4. **Tria d'identitat, reusant el catàleg d'ajustos (`PerfilContext.jsx:34-65`):** una fila `{ id: 'actuar', titol: 'Publicar amb esta identitat', tipus: 'accio', accio: 'actuar-com', obert: true }` a persona i a organització (només owner/admin); `DetallAjust.jsx:179-219` afig la branca `actuar-com` → `setActor(mena, id)`. És un botó més dins d'un component que ja pinta botons: cap classe nova. **[toca UI: una fila i un botó; demana confirmació del Mestre abans d'executar]**
5. **Publicador (`src/sections/notes/NotesContext.jsx:158-249`):** `publishNote` llig `useIdentitat().actor` i passa `authorOrgId` a `sendSectionSubmission` quan és entitat; deixa de fixar `author_name` (el servidor mana). A `NotesSection.jsx:31-52`, faceta «Publicades» (`isPublished`) al `navigationGroups` existent, i dos accions a la nota publicada: «Actualitzar al Mur» (republica amb el mateix id) i «Retirar del Mur» (`DELETE /rest/v1/section_submissions?id=eq.` + `isPublished:false`; política `260908:790-792`). Proves: publicar com a entitat → `author_org_id` al cos; el Mur (Vitest amb fixture) pinta `author_name` del payload; retirar → nota no publicada. **[la faceta i les dos accions són UI de l'espai de treball: confirmació del Mestre]**
6. **Honestedat (F0), en el mateix torn:** `updateOrganization` mapa `is_public` → `visibility` (`public|members`) o el commutador es lleva de l'organització (REG-04); a la persona, o una vista pública que llija `is_public` o retirar el commutador; `/notes` i `/el-meu-perfil` amb `RequireAuth` (REG-08) **[visual mínim: pantalla d'entrada en lloc del sandbox; decisió del Mestre]**.
7. Decisions del Mestre abans d'executar: (a) entitat per SQL o empresa reanomenada; (b) «Retirar» = esborrar o ocultar; (c) la identitat activa es recorda entre pestanyes o no; (d) F0 amb `RequireAuth` a `/notes`.

##### E.7 · Estat d'execució (Claude Fable, torn torn_a2db8978, 260926 12:10)

| Punt | Estat | On |
|---|---|---|
| E.1 relleu de torn | no entregat: `tooling/` i `.agents/` bloquejats pel hook també després de reparar el segell; disseny fet, paquet de laboratori pendent | informe 1130 |
| E.2 | sense canvis | — |
| E.3 una sola veritat | no entregat (Wiki escrivible, sense prioritat; AGENTS/QUI_SOC/protocolledge requerixen pegat) | — |
| E.4 FRO-06, FRO-04 | **fets** | `DetallAjust.jsx`, `App.jsx` (`RouteErrorBoundary`) |
| E.5.2 capa de dades, E.5.5 publicador, faceta i accions, taronja mòbil, ull a `formulari.jsx`, Wiki sense «Explorador del Cervell» | **en pausa**: lot de 13 edicions rebutjat pel Mestre al diàleg de permisos; no es repetix sense ordre | — |
| E.5.2 migració | esborrany creat, cal retallar (`author_org_id` i CHECK redundants) i afegir `logo_url` als GRANT i a `list_my_organizations`, i `notes.copyright` | `supabase/migrations/260926_1200_publicacions_autoria.sql` |
| E.5.3 identitat | **fet** (`listMyOrganizations`, `potSignarPer`, `setActor`, preferència per usuari) | `IdentitatContext.jsx`, `App.test.jsx` |
| E.5.4 fila «actuar com», E.5.6 honestedat, barra sticky, copyright, ull a perfil i registre, redisseny de l'Explorador | pendents | — |
| Infraestructura de fons (Calendari): subtasques de Plaquetes, judici dels hooks de git | **fet a `src/`** (24/24 proves); closca, registre i pegats en quarantena; launchd al runbook del Mestre | pla 1200 |
| B.10 vigilant de la plantilla viva | ordres al runbook del pla 1200 (§4.2b) | pla 1200 |

##### E.6 · Relleu d'este torn (no executable per l'agent; A.1 de l'auditoria)

```markdown
## ESTAT_ACTUAL · 2026-09-26 · Claude Fable 5.1 · Fase 2 i 3 de l'auditoria extrema (petorreta 1030)

- Torn torn_886b65db (code). Pla [[260926_0130_pla_implementacio_auditoria_extrema]] vinculat i ampliat (secció E); auditoria [[260926_1050_auditoria_claude]].
- Fet: estat verificat de C4–C6 (tot obert, una font més de contradicció al LEDGER) i C11–C12; diagnòstic de la higiene amb procediment reflex de sis passos; estructura del registre amb dos perfils i del publicador (SQL per a l'entitat, tres canvis de client, una migració additiva).
- Proves: cap executada (auditoria documental). Porta Olivera --informe: codi 1 (petorreta 1030 sense àncora, 4 àncores fantasma).
- Pendents Mestre: E.1.7, E.3.1, E.5.0 i E.5.7. Sense commit ni push.
```

Línies per al LEDGER:

```markdown
260926 | torn | claude-fable | Auditoria 1050: C4–C6 oberts, publicador amb dos identitats planificat, higiene diagnosticada
260926 | recaiguda | core-higiene-escriptori | petorreta 1030 amb secció 0 marcada en fals, sense rebut ni pla germà
```

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

**Part A (executat):**
- `npx vitest run src`: 72 fitxers, 738/738.
- `npx vitest run src/sections/consola src/components/PedraSeca src/sections/disseny`: 227/227.
- Proves noves:
  - anatomia de `TargetaConsola` i «Obrir» que navega;
  - telemetria que no compta;
  - nom accessible amb títols que no són text;
  - panell de molla i peu per font a les nou pàgines;
  - Crèdits, Rebuts amb diàleg i Càrrega amb termometria;
  - privacitat que amaga i es recorda;
  - `normalitza` amb termometria i abast nul;
  - dates en zona local.
- Navegador: `/consola`, `/consola/pols`, `/consola/calendari` i `/consola/inventari`; a 375 px, en fosc i a l'amplada d'escriptori, i amb la graella a 500 px.

**Tancament d'este torn (no executable per l'agent, ENT-05):** `tancament.mjs` no és a la llista blanca i `.agents/` és governança. Qui tinga lease pot aplicar este relleu:

```markdown
## ESTAT_ACTUAL · 2026-09-26 · Claude (Opus 5.5 Ultracode) · Consola universal i auditoria extrema (petorreta 0130)

- Torn torn_ed548eea (code). Pla [[260926_0130_pla_implementacio_auditoria_extrema]] i auditoria [[260926_0145_auditoria_claude]] (valid:true).
- Fet: Consola amb TargetaConsola (UniversalCard sencera: boina, icona en lloc de foto, entradilla, peu blau), molla de pa com a panell, peu de dades per font, privacitat recordada; normalitza conserva termometria; nom accessible i telemetria del botó principal de UniversalCard; espècimens al catàleg.
- Proves: Vitest src 738/738 (72 fitxers); navegador verificat. Lint, build, node --test sencer i portes no executats (hook).
- Auditoria: 235 troballes, dos escèptics per dimensió (234 confirmades, 1 refutada). Deu prioritats a l'informe; la primera és el hook.
- Missió 3: diagnòstic i funció forçadora (higiene.mjs, document.mjs arxiva, secció 0 automàtica, vigilant, canari) i nova skill, pendents d'executor amb lease.
- Bloquejos: el hook bloqueja StructuredOutput, SubagentHandback, Skill i les escriptures fora del repo; tancament.mjs i ESTAT/LEDGER inabastables per a l'agent.
- Sense commit ni push. Tokens: subagents ≈18 M (arnés, possible doble recompte); fil principal no mesurat.
```

Línies per al LEDGER:

```markdown
260926 | torn | claude | Consola universal, auditoria extrema verificada, proposta d'higiene
260926 | recaiguda | core-higiene-escriptori | petorreta 0130 generada amb Escriptori brut i sense rebut
```

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Part A:**
  - La privacitat al peu arriba després del contingut. Queda mitigat perquè es recorda per visitant, però la primera activació encara exigix baixar.
  - «Obrir» és un botó, no un enllaç, i no s'obri en pestanya nova. L'overlay de la targeta sí que és enllaç.
  - La insígnia lateral en mode fosc és gairebé blanca (recepta global).
- **Part B:**
  - La primera execució real bloquejarà la taula actual (fantasmes, documents sense àncora i dos plans 0130). És el que es vol, però MarIA ha de saber-ho abans.
  - La instal·lació toca més de cinc fitxers de governança: és risc alt i Petorreta del Reflex.
- **Part C:**
  - C2 i C3 toquen dades publicades i polítiques remotes: cal còpia i staging.
  - C10 i C11 són canvis visuals i funcionals i necessiten ordre del Mestre (Llei del Píxel).
  - La taxa de refutació d'esta auditoria (0,4 %) és sospitosament baixa: cal una mostra de contrast humana abans d'executar la Fase 3.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260926_0145_auditoria_claude]]
- [[260926_0130_prompt_auditoria_extrema]]
