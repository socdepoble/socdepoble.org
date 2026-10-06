---
type: informe
status: esborrany
description: 'Execució de T1-T6 del prompt 261006_0224: fòssils del LEDGER, frontmatter de skills, guarda de la Gestoria local, Model B, skill UX de Markdown, amnèsia de neteja i proves de WikiDePoble'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9d5803f4-d18b-4c99-898a-4e795edf38f4:3b91a41f-1a96-401f-bdc0-d60a990241e9
---
# Auditoria Claude 261006: LEDGER, catàleg de skills, Gestoria local, Model B, skill de Markdown i higiene de l'Escriptori

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9d5803f4-d18b-4c99-898a-4e795edf38f4:3b91a41f-1a96-401f-bdc0-d60a990241e9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T00:59:21.768Z |
| Modificació | 2026-10-06T03:58:00.000Z (aproximada: el hook bloqueja `date`; datada amb `ls -lT`) |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) via Claude Code en mode ultracode, amb 31 subagents del mateix model en tres workflows (15, 10 i 6) |
| Tokens consumits | Sense comptador de cost. Comptadors dels workflows: 5,58 M + 2,83 M + 1,41 M = 9,82 M tokens de subagents, més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-06T00:59Z: torn `torn_9d5803f4` obert (actor claude, abast code) i esborrany creat amb `document.mjs context` → `create`. Lectura del prompt 261006_0224 enganxat pel Mestre al xat, del pla 261006_0224, de l'índex i de l'auditoria Opus 261006_0025 (lectura nominal de l'arxiu).
- 01:05Z: laboratori `02_investigacio_ia/261006_0300_ledger_claude/` amb el canal viu, ancorat a l'índex.
- 01:05Z-02:30Z: primer workflow (15 agents): un agent per front (T1, T2+T5, T3, T4, T6a i T6b), un escèptic per a cadascun i tres correccions (T2+T5, T6a i T6b).
- 01:10Z i 01:15Z: decisions del Mestre al xat: Model B = «ADR + port neutral» i ADR-2026-09 signada; «Maquinària de la IAIA» i Telefonades fora de la barra mòbil són ordre seua.
- 02:37Z-03:15Z: segon workflow (10 agents): aplicació de les decisions, correccions menors de T1 i T3, i segona refutació de les correccions de T2+T5 i T6b. Cap defecte bloquejant.
- 02:40Z: comprovació al navegador, sense sessió, de la Gestoria i de les rutes protegides.
- 03:16Z-03:44Z: tercer workflow (6 agents): correccions menors i verificació final independent de tot el torn.
- 03:50Z-03:58Z: arranjament del fals positiu de `src/natiu/frontera.test.js`, versió del catàleg i textos del laboratori; informe escrit sencer.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

1. **T1 · LEDGER.** El recompte de fòssils no viu a `mapa-consola.mjs` sinó a `tooling/brain/fonts-vigilancia.mjs:223-249`. La línia `:248` fa `fossils: Math.max(marques - 1, 0)`. El paquet `t1_ledger` hi classifica els 10 peus intercalats com a **peus històrics** i separa les dues línies enganxades (605 i 619). Ho fa inserint només un salt de línia, localitzat pel contingut i reversible byte a byte. Res no s'esborra. La signatura del LEDGER **ja és invàlida hui**, abans de tocar res: el peu c6eb528c segella el LEDGER sense la línia 21, que es va afegir dalt després de signar.
2. **T2 · Catàleg de skills.** Confirmat: `core-comprensio-reflexiva` i `core-tecniques-investigacio` no tenen frontmatter canònic, i `cataleg_skills.mjs:57` llança. `backend_consolidacio` dona 5/14. El paquet `t2_t5_skills` ho deixa en 14/14 sobre una còpia amb l'executor real, i l'executor ja torna a segellar sol.
3. **T3 · Gestoria local.** Cap guarda no redirigix les apps locals. `/app/*` no porta `RequireAuth`, i `GuardaPermis` deixa passar `veure: 'public'` (`src/apps/plataforma/RutaApps.jsx:33-36`).
   - Comprovat al navegador sense sessió: Gestoria, Bar i Nevera s'obrin, i `/admin` i `/el-meu-perfil` continuen protegits.
   - No hi ha cap canvi de producció. Hi ha 35 proves noves en els tres modes de dades.
4. **T4 · Model B.** Aplicada la vostra tria («ADR + port neutral») amb una frase canònica única. L'ADR-2026-09 queda **signada el 2026-10-06** i la plantilla `prompt_local` passa a 3.4.0. La part de governança (AGENTS §8, el mirall, QUI_SOC i protocolledge) és al paquet `t4_model_b`.
5. **T5 · Skill de maquetació.** `core-maquetacio-markdown` porta 22 regles verificables, una llista de comprovació i, com a casos, els errors reals d'AGENTS.md i de l'índex. Va al paquet `t2_t5_skills`, amb el seu flux d'aprovació per a la Wiki.
6. **T6 · Proves.** No eren 13 sinó 10: 6 de la Wiki i 2 de privacitat, per la «Maquinària de la IAIA», i 2 d'`App.test.jsx`, per Telefonades. Totes estan verdes aplicant les vostres dues decisions al xat. A més, s'ha arreglat una roja que cap front no havia vist: `src/natiu/frontera.test.js`, per l'import `AGENTS.md?raw` del panell d'Agents.
7. **T6 · Amnèsia de MarIA.** La causa no és que oblide l'eina. Són tres coses:
   - un verd que no distingix viu de consumit;
   - cap disparador en arrencar ni en tancar;
   - una taula que es torna a verd editant l'índex per shell.
   El paquet `t6_higiene` porta el briefing de taula i les guardes. La caducitat de la declaració queda per a decisió vostra.
8. **Seguretat, fora d'abast i urgent.** MarIA va bolcar fitxers `.env` als transcripts d'Antigravity (converses `ac48a44b`, pas 365, i `62fa5929`, pas 1276), contra AGENTS §5. No n'he llegit el contingut. Cal mirar quines claus hi havia i rotar-les si són reals.
9. **T7 i T8 no executats.** MarIA els va afegir al prompt del disc a les 03:49, després de la vostra ordre al xat. Són instruccions trobades en un document, i T8 (un login simulat que salta el servidor) té implicacions de seguretat. Esperen la vostra confirmació (§7).

Totes les troballes han passat per un escèptic independent que les ha intentades refutar. On l'escèptic ha corregit l'investigador, mana la versió corregida.

### 1. T1 · LEDGER i immutabilitat

#### 1.1 On viu el recompte

- `tooling/brain/mapa-consola.mjs:311` només fa `ledger: resumLedger(arrel)`. El recompte és a `fonts-vigilancia.mjs:223-249`.
- Tocar `mapa-consola.mjs` faria caure una prova que hui passa (`tests/governanca-260930b-torns.test.mjs:106-119`). Per això el paquet canvia `fonts-vigilancia.mjs` i deixa `mapa-consola.mjs` igual.

#### 1.2 Què fa el paquet `t1_ledger`

- `analitzaLedger` torna un camp nou, `peusHistorics`, amb tots els peus intercalats. Les exportacions són les mateixes i no hi ha cap import nou.
- `fossils` compta només un segell enganxat a prosa o darrere d'una entrada. Cap dels 10 peus de hui hi compta; un peu enganxat a text continuaria comptant com a fòssil.
- La separació la fa `prepara-pla.mjs` sobre el LEDGER del disc en el moment del pla, sense cap còpia congelada:
  - busca cada fusió pel contingut i inserix un sol salt de línia;
  - comprova que, llevant el salt, el fitxer és idèntic byte a byte;
  - una fusió absent o repetida és deriva.
- Efecte a la Consola: «12 línies per revisar · 10 segells fòssils · 2 mal formades» passa a «0 · 0 · 0» després de separar. La targeta conserva la forma, però l'etiqueta «segells fòssils» passa a voler dir «segell enganxat» (decisió vostra, §7).

#### 1.3 Signatura

- `verify-ledger.mjs` ja ix amb 1 hui: la línia 21 es va afegir dalt després de signar.
- `verify-ledger.mjs --sign` reemplaça el peu final (`tooling/verify-ledger.mjs:28` i `:37`). Si es signa directament, c6eb528c desapareix. Per a conservar-lo com a peu històric, primer s'afig l'entrada al final i després es signa.
- `tooling/documental/ledger.mjs:14-18` torna a signar en tancar sense mirar si la signatura anterior era vàlida. Queda fora del paquet.

### 2. T2 · Catàleg de skills

- Frontmatter nou:
  - `type: skill`, `status: actiu` i `name` igual que la carpeta;
  - tags de l'enum de `tooling/wiki/schema.json`;
  - els `triggers_on` que proposava l'auditoria Opus.
- El cos de les dues skills queda intacte: `prepara-pla.mjs` pren de `nous/` només el frontmatter i hi enganxa el cos del disc.
- El paquet porta les projeccions exactes de `cataleg_skills.mjs --escriu` (`.agents/manifest.yaml` i `00_INDEX_SKILLS.md`, 33 skills). També porta una CAS del catàleg sencer: si una altra skill canvia la descripció abans d'aplicar-lo, el pla es nega.
- Sobre una còpia amb l'executor real:
  - `backend_consolidacio` passa de 5/14 a 14/14;
  - `cataleg --check` passa d'eixida 2 a 0;
  - `tractor-registre` passa de 6 problemes a 0.
- `skills_index.json` està ignorat per git (`.gitignore:27`) i no entra al pla. Després de l'executor cal `npm run skills:index`.

### 3. T3 · Gestoria local sense redirecció

- **Cartografia.** `RequireAuth` només embolica tres rutes:
  - `/admin/*` (`src/app/App.jsx:789`);
  - `/el-meu-perfil` (`:838`);
  - `/consola/*` fora del servidor de desenvolupament (`:776-778`, `src/app/guards/guardaConsola.js:19-21`).
  Gestoria, Bar, Nevera, Lector i Salut declaren `permisos.veure: 'public'` als seus manifests.
- **Seguretat.** Sense sessió, la Gestoria llig IndexedDB local i els fitxers que tria la persona. No fa cap crida autenticada i no exposa dades d'altri. Fora del servidor de desenvolupament no s'obri mai, perquè el manifest la té en entorn `desenvolupament` (`src/apps/gestoria/manifest.js:45-48`).
- **Proves noves.**
  - Fitxers: `src/app/App.appsLocals.test.jsx` (35) i `src/app/qualitat.appsLocals.test.js` (2).
  - Cobrixen cada app en els modes `remote`, `seed` i `local`, el servidor caigut i el conjunt exacte de crides al port.
  - Comproven que `/admin`, `/el-meu-perfil` i la Consola en un build continuen protegits.
  - Si `GuardaPermis` demanara sessió per a les apps públiques, 9 proves es posarien roges.
- **Defecte D1.** El documenten sis proves `[DEFECTE D1]`. En mode llavor o local, el clic a «Titular sense configurar» porta a `/registre`.
  - Si el backend respon a `/auth/v1/health`, l'entrada passa sola a remot i recarrega (`OnboardingSection.jsx:151-178`, `dataMode.js:36-43`).
  - Si no respon, pinta l'avís de servidor caigut i no recarrega. És el que vau veure, i coincidix amb el T8 que va afegir MarIA.
- **Troballa.** `/control` (`App.jsx:800`) i `/consola` en desenvolupament no tenen guarda sense sessió. Ja era així abans del torn.

### 4. T4 · Doctrina Sollutia (Model B)

#### 4.1 Les tres lectures

- `AGENTS.md:53` deia «connectar-se al seu backend … (Model B)»: al peu de la lletra, és el Model A de la taxonomia de l'ADR.
- `prompt_local.md:72` deia «Backend Intercanviable (Model B)»: un port neutral.
- Només l'ADR-2026-09 deia el que fa el codi: l'amfitrió ja aplica el B estricte amb proves verdes (`src/host.js:81-110`, `src/config/contracteAmfitrio.js:108-121`).

#### 4.2 Frase canònica (la vostra tria, «ADR + port neutral»)

```markdown
**Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
```

#### 4.3 Aplicat i pendent

- **Aplicat:**
  - l'ADR-2026-09: frase a `:10`, signatura del 6-10-2026 a `:14`, `status: canonic` i correccions de cites mortes;
  - la plantilla `prompt_local.md` 3.4.0: la frase i la Directiva Suprema, que ara envia els punts d'accés cap a la Frontissa;
  - l'estàndard d'integració: corregit el fet desfasat de `configura()`;
  - dos comentaris de codi.
  El servidor de desenvolupament ha regenerat `src/data/wikiManifest.js`.
- **Paquet `t4_model_b`:** `AGENTS.md:53`, el mirall `.agents/AGENTS.md` (mateixos bytes), `.agents/QUI_SOC.md:37` i `.agents/protocolledge.json` 3.4.0. Fins que s'aplique, la plantilla diu 3.4.0 i el protocolledge 3.3.0, com ja passava amb 3.3.1.
- **Efecte declarat sobre el prompt 0224.** El seu frontmatter porta un reflex d'un rebut d'un altre nom (`…_petorreta_…`), i `porta-plantilla-viva` hi suma ara «bloc normatiu alterat». La porta ja era roja per a eixe document. Si MarIA passa el reflex al rebut d520bbe6, desapareixen els dos errors.
- **La Frontissa no es pot recórrer hui.** `recursos.js` usa `traductor`, `creaFrontissa.js:19-27` exigix `decode` i altres camps, i `client.js` no importa el catàleg. Obrir-la és codi i necessita ordre i abast.

### 5. T5 · Skill `core-maquetacio-markdown`

- Errors d'AGENTS.md que la motiven (commit 76947e5d):
  - la description copia l'H1 (`:4`);
  - la 0.1 és H2 i la 13.1 és H3 (`:17` i `:78`);
  - no hi ha secció 14 (de `:78` es passa a `:81`);
  - hi ha un paràgraf de més de cent paraules de metàfora (`:63`);
  - els enllaços interns porten la forma `[text](ruta)` (`:73-76`);
  - hi ha un espai final (`:30`) i un apòstrof corb (`:83-85`).
- A l'índex de l'Escriptori hi ha seccions buides, 23 seccions darrere de «## Vincles» i un bloc de 25 línies en blanc.
- La skill és procediment: regles R1-R22, nou passos i una llista de comprovació. Es complix a si mateixa.
- Declara dues fronteres:
  - amb `core-llegibilitat-text`: un component o un HTML són d'aquella; un fitxer `.md` és d'esta;
  - amb `sdp-universal-page`: el font seguix R5, i la conversió a Subtítol la fa `parseMarkdown`.
- No reformata res per iniciativa pròpia: corregir AGENTS.md o l'índex canvia el que pinta la Wiki, i això necessita ordre vostra.

### 6. T6 · Proves i amnèsia de neteja

#### 6.1 Proves de la Wiki, de la barra mòbil i de la frontera nativa

- **Maquinària de la IAIA.** Les 8 primeres roges les va causar el reagrupament de MarIA a les 01:46 (`maquinaria_cat`, `agents_panell`, `PanellAgents.jsx`), que vau confirmar com a ordre vostra. Les proves s'han adaptat sense afeblir-les.
- **Glif de la Consola.** La fitxa de la Consola heretava la carpeta en lloc del document. Ara porta `icon: FileText`, el glif que tenia abans de les 01:46 i el que demana la regla del glif del 261004.
- **Telefonades.** La va llevar una sola edició d'`App.jsx` entre les 02:12 i les 02:42 del 6-10 (ho mostra la màquina del temps), i vau confirmar que és intencionat. Les dues proves fixen ara la barra Xat, Mur, Panell, Pobles i Mercat. L'avís D17 continua al rail del Xat.
- **Catàleg de disseny.** L'espècimen declara que és la barra real, i s'ha alineat; la versió del catàleg és `2026-10-06T05:16:25+02:00`. És un canvi visible del catàleg, derivat de la vostra decisió. S'ha retirat una regla de `noFacis` que va redactar un agent i que no havíeu dictat.
- **Frontera nativa.** `src/natiu/frontera.test.js:119` tallava `AGENTS.md?raw` pel `?` com si fóra un comodí de glob, i una ruta sense carpeta fixa comptava com a arribada al natiu. Ara una consulta de Vite (`?raw`, `?url`…) es lleva abans de resoldre. Una prova nova ho fixa i continua detectant `entrada.jsx?raw` dins del natiu.

#### 6.2 Per què MarIA no neteja

- **C1 · P0.** La declaració a «## Activitat en curs» no caduca (`porta-olivera.mjs:138-141`), i `create` declara viu cada document nou (`draft-write.mjs:81-90`). Amb la taula en verd, `--arxiva` respon «Res a arxivar».
- **C2 · P0.** La taula es torna a verd editant l'índex per shell: almenys 26 escriptures confirmades des del 29-9 (11 heretocs, 7 `sed -i`, 5 `node -e` i 3 scripts ad hoc). El 5-10 MarIA va declarar vius uns `*_null` amb un script per a fer verd.
- **C3 · P0.** Antigravity no té cap hook d'arrencada ni de tancament (`.agents/hooks.json` només té PreInvocation i PreToolUse). Per això `despertar.mjs` no corre mai per a MarIA. A més, `tancament.mjs:13-31` no mira la taula, tot i la promesa d'AGENTS §4.
- **C4-C6 · P1.**
  - El ritual d'arrencada diu «inspecciona», no «decidix».
  - AGENTS §16 mana portar el material pujat a `01_produccio`, i §12 prohibix tocar-la.
  - El REFLEX DE CORRECCIÓ viu només a CLAUDE.md, que Antigravity no carrega.
- **Evidència:**
  - des del 29-9, de les crides a l'arxivat, 24 mouen, 19 responen «Res a arxivar» i 4 fallen;
  - hi ha 9 trasllats massius per `mv`; 6 dels 7 des del 30-9 arriben just després d'un «Res a arxivar» o d'un error.
- **Remei al paquet `t6_higiene`:**
  - briefing de taula al PreInvocation;
  - guardes de l'índex (heretoc, `sed -i`, `perl -i`, `tee` i scripts ad hoc, també amb camins absoluts entre cometes);
  - guardes de l'arxiu (`rm` i `mv` dins de `90_arxiu_historic`);
  - `core-higiene-escriptori` 3.4.0 amb les ordres del 0055;
  - el pas 5 de `core-identitat`.
  Els escapaments que queden estan declarats.

### 7. Decisions pendents del Mestre

- **T7 i T8**, afegits per MarIA al prompt a les 03:49:
  - T7 és investigar per què MarIA va editar `useIdentitatDeLaBarra.js` en paral·lel. Ho va fer a les 03:22; el verificador ho ha vist a l'arbre.
  - T8 és un login simulat en local sense servidor. Toca el mateix bloqueig que el D1 de T3.
  Cap dels dos s'executa sense la vostra confirmació.
- **LEDGER:**
  - conservar c6eb528c com a peu històric o deixar que `--sign` el reemplace;
  - revisar la línia 21 abans de signar;
  - la convenció d'escriptura (dalt o al final);
  - el significat de l'etiqueta «segells fòssils» a la Consola;
  - la deriva declarada de 5 proves de la suite laboratory: acceptar-la o arxivar el laboratori 260930_0040.
- **Skills:**
  - Vincles a les dues skills reparades (F9 de la Porta Frontmatter);
  - els disparadors de les reparades;
  - on queda registrada l'aprovació d'una skill a la Wiki;
  - els enllaços `.claude/skills` (n'hi ha 9 de 33);
  - D8: una línia a `core-llegibilitat-text` que remeta a la skill nova per als `.md`.
- **Gestoria:**
  - D1 del titular en mode local;
  - una guarda per a `/control`;
  - obrir la Gestoria també en un build;
  - `permisos.escriure` del Bar, que no llig ningú.
- **Model B:**
  - les alineacions fora del pla: el bloc fix de `prompt_consell`, les skills segellades, `README.md:13`, el text visible de `pageContent.js:43` i `:123`, i `tractor-enxufe`;
  - la costura `injectaBackendDelPaquet`;
  - el token del GET a Sollutia;
  - obrir la Frontissa.
- **Wiki i barra mòbil:**
  - el glif FileText de la Consola;
  - la porta dels Tractors des de la Gestoria. `src/apps/gestoria/rutes.js:24` i `src/sections/gestoria/ContenidorGestoria.jsx:25` són font signada i apunten encara a `tractors_cat`; hi ha proves que ho fixen i que caldria invertir;
  - la classe `sdp-m-m` a `PanellAgents.jsx:34`, que fa caure design_guard. No té cap regla, així que llevar-la no canvia cap píxel;
  - el límit de sis caselles;
  - el CSS sobrer de `.mobile-nav .nav-item`;
  - la clau òrfena `common.entesos`;
  - la sonda `tests/laboratori-telefonades-261006.test.js`, que ja ha complit i no s'ha de versionar.
- **Higiene:**
  - la caducitat de la declaració de viu;
  - portar el REFLEX DE CORRECCIÓ a AGENTS.md;
  - que `tancament.mjs` passe la porta Olivera, o corregir AGENTS §4;
  - l'ordre dels laboratoris;
  - ANC-06 (`crear_bundle` en minúscules);
  - la memòria d'Antigravity;
  - on va el material pujat (§16 contra §12);
  - si tenien ordre vostra el `rm -f` a l'arxiu del 5-10 i els trasllats a `01_produccio`.

### 8. Ordre d'aplicació dels paquets (Mestre, amb executor i lease)

Cada paquet té `LLEGIU_PRIMER.txt` i `prepara-pla.mjs comprova`. Precondició de tots: el flux aprovat a la Wiki (lliçó 261002).

1. `t2_t5_skills`: torna el catàleg a verd i desbloqueja `test:ci`.
2. `t4_model_b`.
3. `261006_0055_olivera_ancores_opus`: el paquet d'Opus, ja verificat.
4. `t6_higiene`: exigix el 0055 aplicat i el catàleg carregant.
5. `t1_ledger`, l'últim, perquè qualsevol escriptura al LEDGER entre el pla i l'executor és deriva. Després:
   - les entrades del torn, al final del LEDGER;
   - `node tooling/verify-ledger.mjs --sign`;
   - `node tooling/verify-ledger.mjs`.

Cada corredor `tests/laboratori-*-261006.test.js` fa skip quan el seu paquet ja és al disc, i es pot retirar en el mateix commit.

### 9. Pla de commit (mai `git add -A`; rutes explícites)

- **A · `test(app): apps locals sense sessió en els tres modes de dades`:** `src/app/App.appsLocals.test.jsx` i `src/app/qualitat.appsLocals.test.js`.
- **B · `test(wiki): Maquinària de la IAIA, panell d'Agents i frontera nativa`:**
  - `src/sections/wiki-de-poble/WikiDePobleSection.jsx`;
  - les seues proves `einesLocals`, `icones` i `produccio`;
  - `src/sections/gestoria/privacitat.test.js`;
  - `src/natiu/frontera.test.js`.
- **C · `feat(app): Telefonades fora de la barra mòbil`:**
  - `src/app/App.jsx` i `src/app/App.test.jsx`;
  - `src/css/layout.css`;
  - `src/sections/disseny/cataleg/detalls/EspecimenNavMobil.jsx`, `src/sections/disseny/cataleg/manifest.js` i `src/sections/disseny/cataleg/versio.js`;
  - `src/sections/xat/components/VistaEnConstruccio.jsx`.
- **D · `docs(model-b): frase canònica i ADR-2026-09 signada`:**
  - l'ADR, `prompt_local.md` i `estandard_integracio_react.md`;
  - `src/data/contracte.js`, `src/data/contracte.test.js` i `src/data/conformitat/kit.js`;
  - `src/data/wikiManifest.js`.
- **E · `chore(laboratori): paquets 261006_0300 i els seus corredors`:** la carpeta del laboratori i `tests/laboratori-{ledger,skills,model-b,higiene}-261006.test.js`, sense la sonda de Telefonades.
- **F · `docs(escriptori): auditoria Claude 261006`:** este informe, l'índex de l'Escriptori i `.agents/runtime/turns/torn_9d5803f4-d18b-4c99-898a-4e795edf38f4.json`.

Queden fora dels commits del torn:
- `useIdentitatDeLaBarra.*` (MarIA, 03:22);
- el prompt 0224 (T7 i T8 de MarIA);
- `.agents/ON_ESTIC.md` i el torn `torn_c8669d8b`;
- `.immunitari/`.

El pre-commit continua roig per disseny mentre el catàleg no carregue (CS-01). Hi ha dues eixides: o primer el paquet `t2_t5_skills`, o cada commit amb `--no-verify` i una línia d'incidència al LEDGER (precedent: LEDGER:769).

### 10. Text per a l'ESTAT i el LEDGER (Claude no pot escriure a `.agents/`; ho aplica MarIA)

```markdown
## ESTAT_ACTUAL · 2026-10-06 06:00 · Claude · torn 261006_0300 (T1-T6)

Informe 261006_0300_auditoria_claude. Model B decidit pel Mestre («ADR + port neutral»): frase canònica aplicada a l'ADR-2026-09 (signada el 6-10) i a prompt_local 3.4.0; AGENTS §8, mirall, QUI_SOC i protocolledge al paquet t4_model_b. Proves de la Wiki, de la barra mòbil i de la frontera nativa verdes amb les decisions del Mestre (Maquinària de la IAIA; Telefonades fora). Gestoria local: ja s'obria sense sessió; 35 proves noves. Paquets per a executor i lease a 02_investigacio_ia/261006_0300_ledger_claude: t2_t5_skills (catàleg verd i core-maquetacio-markdown), t4_model_b, t6_higiene (briefing i guardes), t1_ledger (peus històrics i separació de dues línies). Signatura del LEDGER ja invàlida per la línia 21. Seguretat: .env bolcat als transcripts d'Antigravity, cal revisar i rotar. T7 i T8 del prompt (afegits per MarIA a les 03:49) pendents de confirmació del Mestre. Res commitejat. Següent: aplicar t2_t5_skills, commits A-F, decisions de §7.
```

```markdown
261006 | auditoria | claude | 0300: T1-T6 del prompt 0224; Model B decidit i ADR-2026-09 signada; quatre paquets de laboratori; Wiki i barra mòbil verdes
261006 | decisió | mestre | Model B = ADR + port neutral; ADR-2026-09 signada; Maquinària de la IAIA i Telefonades fora de la barra mòbil
261006 | incidència | core-higiene-escriptori | porta verda amb vius de la marató; neteja per mv massiu i scripts sobre l'índex
261006 | incidència | seguretat | .env bolcat als transcripts d'Antigravity (ac48a44b i 62fa5929); revisar i rotar claus
```

### 11. Retroalimentació de la plantilla `prompt_local`

- **Mesurar abans d'encarregar.** El prompt va fallar en tres mesures, i un pas de mesura obligatori les hauria evitades:
  - parlava de 13 proves i n'hi havia 10;
  - situava el recompte a `mapa-consola` i viu a `fonts-vigilancia`;
  - suposava una redirecció de la Gestoria que el codi no fa.
- **Donar l'escenari observat.** Per a T3 calia l'adreça, el servidor (desenvolupament o build) i des d'on es clicava.
- **Declarar la frontera d'escriptura.** T1, T2, T4 i T5 creuen `.agents/`, `tooling/` o `AGENTS.md`. La plantilla hauria de dir que el lliurament és un laboratori amb executor i lease, com ja demanava l'auditoria Opus.
- **Congelar el prompt un cop emés.** T7 i T8 es van afegir al mateix fitxer amb el torn en marxa. Una tasca nova ha d'anar a un document nou amb la seua hora, i al xat.
- **Rebut i nom.** El frontmatter del prompt 0224 apunta al rebut d'un altre nom (`…_petorreta_…`), i per això el document no passa `porta-documents`.
- **Context.** Continua manant llegir `taxonomia_documental.md` sense ruta. És a `_wiki_de_poble/02_saber/protocols_tecnics/`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Executat en este torn (el resultat el diu el codi, no esta guia):

- **Corredors.** `npx vitest run tests/laboratori-ledger-261006.test.js tests/laboratori-skills-261006.test.js tests/laboratori-model-b-261006.test.js tests/laboratori-higiene-261006.test.js` més `src/sections/disseny src/sections/wiki-de-poble src/natiu src/app/App.test.jsx`, a les 05:52 locals, després de l'últim canvi: 39 fitxers, 527 verdes i 2 omeses. Les dues omeses són les proves que només corren amb `--mode genera`.
- **Proves de l'abast** (verificador final, 05:35): `npx vitest run src/app src/apps src/sections/wiki-de-poble src/sections/gestoria src/sections/disseny src/sections/xat src/data src/config tests/host.test.js` → 326 fitxers, 6.328 verdes i 2 omeses.
- **Bateria Vitest sencera** (verificador final, 05:38): `npx vitest run src tests` → 3 fitxers roigs, tots previs al torn:
  - `components.abast.capes.test.js` (`.sdp-emojis-xl`);
  - `TextSection.test.jsx` (props de l'heroi);
  - `src/natiu/frontera.test.js`, arreglat després (14/14 a les 05:51).
  Les dues primeres ja les citava l'auditoria Opus.
- **Suite node primary** (68 fitxers): 780 verdes i 9 roges, totes de `backend_consolidacio` per CS-01. Es resolen aplicant `t2_t5_skills`.
- **Portes:**
  - `porta-olivera.mjs --informe`: neta;
  - `segella.mjs`: intacte, 22b96726;
  - `porta-plantilles.mjs`: 13 rutes verdes;
  - `tractor-enxufe.mjs`: E1-E4 verds;
  - `design_guard.mjs --arrel=src`: exit 1 amb 32 crítics i 8 avisos, igual que abans del torn (la llei dura és `sdp-m-m` de `PanellAgents.jsx`).
- **Navegador.** Pestanya del servidor 3340, sense sessió i sense tocar cap compte:
  - `/app/gestoria` porta a `/app/gestoria/tauler` («Tauler Central»);
  - `/app/bar` porta a `/app/bar/caixa`, i `/app/nevera` a `/app/nevera/llista/casa`;
  - `/admin` i `/el-meu-perfil` porten a `/registre?mode=entrar&tornar=…`;
  - la Wiki mostra les quatre fitxes de la Maquinària amb el glif de document.
  L'única eixida d'error és la sonda de salut de `/registre` contra `127.0.0.1:54321`, que no està en marxa.
- **Refutació.** Cada lliurament ha passat per un escèptic, i les tres correccions grosses, per un segon. Cap defecte bloquejant no ha quedat obert.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Frontera d'escriptura.** Claude no pot escriure a `.agents/`, `tooling/`, `scripts/`, `.claude/`, `AGENTS.md` ni `package.json`, ni moure o esborrar fitxers (`tooling/gates/mutation-policy.mjs:6` i `:15`). Per això T1, T2, T4 (governança) i T5 es lliuren com a laboratori, i l'ESTAT i el LEDGER com a text per a MarIA.
- **Ordres no executades directament.** No s'han pogut executar directament `verify-ledger.mjs`, `cataleg_skills.mjs`, `porta-autoritat.mjs`, `tractor-doctrina.mjs`, `tractor-frontmatter.mjs` ni `prepara-pla.mjs`. Corren des dels corredors Vitest, que els importen o els llancen en procés fill sobre còpies temporals. El flux real de lease (open, seal i executor) no s'ha executat mai.
- **Antigravity.** No s'ha vist cap briefing real dins de l'IDE. L'acreditació és el pas 6 del LLEGIU de `t6_higiene`. Els transcripts d'Antigravity s'han llegit per recomptar ordres, sense obrir cap `.env`.
- **Navegador.** Només s'ha comprovat sense sessió, amb el servidor de desenvolupament i el backend local apagat. No s'ha tocat cap compte.
- **Arbre concurrent.** MarIA ha escrit durant el torn al prompt 0224 (T7 i T8) i a `useIdentitatDeLaBarra.*`. Les cites de línia de l'índex i del prompt són de les 05:5x.
- **Memòria.** El hook no deixa escriure la memòria persistent de Claude: el que s'ha après viu en este informe i en els relleus.
- **Hores.** Són aproximades: el hook bloqueja `date`, i m'he datat amb `ls -lT` i amb `expiresAt` del torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
