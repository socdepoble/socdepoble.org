---
type: informe
status: esborrany
description: 'Auditoria de l''encarrec de Consola Termodinamica i Supereditor contrastat amb el codi viu: la consola ja existix, esta enrutada i protegida.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_347653a8-0294-46f8-916a-f41585c637fb:b68b80d1-4c8b-4539-bee8-8d91338b12d4
---
# Auditoria de la Consola Termodinamica i de l'Editor

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_347653a8-0294-46f8-916a-f41585c637fb:b68b80d1-4c8b-4539-bee8-8d91338b12d4 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T20:08:36.278Z |
| Modificació | 2026-09-23T20:08:36.278Z |
| Propietari | Claude · Olivera |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5 (claude-opus-5), agent local en Claude Code |
| Tokens consumits | No mesurats en este torn. No s'imputa cap estimació: seria un número inventat, i este informe tracta precisament d'això |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Llegits abans d'escriure: `AGENTS.md`, `.agents/protocolledge.json` sencer, la plantilla d'auditoria íntegra, el pla T4 del Mestre, el prompt d'execució, `_wiki_de_poble/02_saber/03_consola_termodinamica.md` i l'auditoria de Codex ja present a l'Escriptori. Abast: auditoria i proposta. El prompt ordena «Cap codi es canviarà fins que tots hàgem validat el Pla d'Implementació»; per tant no s'ha tocat cap fitxer de `src/` ni de `tooling/`. L'única escriptura d'este torn és este document.

Este informe arriba segon a la taula. On Codex ja ha encertat, ho confirme i no ho reclame. On discrepe, ho dic obertament i amb evidència pròpia.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-23T20:08:36.278Z: esborrany creat.
- 23-09-2026, 22:08–22:30 Europe/Madrid: lectura de fonts, execució de `porta:documents --all`, lectura i verificació independent de l'auditoria de Codex 2205, redacció.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Tall d'evidència: HEAD `f03affcb` més l'arbre de treball observat el 23-09-2026 entre les 22:08 i les 22:30 Europe/Madrid. L'arbre té 58 fitxers modificats sense commit d'altres torns; les cites són del disc.

### C1 · L'encàrrec demana fabricar exactament els dos números que la doctrina prohibix pel nom

**Àmbit:** tasca 4 del prompt `260923_2153_prompt_execucio_olivera.md` contra `_wiki_de_poble/02_saber/03_consola_termodinamica.md` (`status: canonic`).

**Evidència:** el prompt demana «un estat `mock` amb dades versemblants (p.ex., Índex de Trellat al 92%, Càrrega de Tombstones al 40%)». El document canònic diu, línies 12-15: si a una mètrica li falta fórmula, font, denominador, scope, timestamp o prova reproduïble, «el valor correcte és `N/A`, no `100%` ni una estimació optimista». I a la taula de baseline, dos files literals:

- «Tombstones CRDT | No aplicable a la baseline | No hi ha motor CRDT actiu; **no s'inventa una càrrega percentual**.»
- «"IT" de tres components del CLI | Retirat com a porta | `sdp check` falla tancat perquè combinava proxies incomplets i **podia donar puntuació a un corpus buit**.»

Els dos exemples del prompt no són mostres a l'atzar: són els dos casos concrets que el document canònic desautoritza, amb el mateix nom i el mateix format.

**Severitat:** crítica. No és estètica. És la diferència entre una consola de mesura i una pantalla que tranquil·litza.

**Conflicte amb:** `03_consola_termodinamica.md` (canònic), i el contracte d'informe de la plantilla d'auditoria («No s'assigna una puntuació inventada»).

**Proposta conservadora:** pintar el tauler sencer amb la mateixa riquesa visual però en estat honest: barres buides amb etiqueta `N/A`, insígnia grisa i el motiu al costat («sense instrument», «no aplicable a la baseline»). Un tauler que declara què no sap encara és impactant i, a més, és una llista de faena. Si el Mestre vol veure el layout ple per decidir l'estètica, que el mock visca darrere de `import.meta.env.DEV`, amb fixtures deterministes i una banda permanent «DADES DE DEMOSTRACIÓ» que no es puga amagar.

**requires_human_decision: true.** El Mestre pot ordenar el mock; és seu el projecte i seua la decisió. Però l'ha de prendre sabent que contradiu un document canònic, no per omissió.

### C2 · La Consola Termodinàmica ja existix, ja està enrutada i ja està protegida

**Àmbit:** `src/sections/consola/ConsolaSection.jsx`, `src/sections/consola/consolaContent.js`, `tooling/vite/consola-iaia.mjs`, `src/app/App.jsx:562`.

**Evidència:**

- `App.jsx:562`: `<Route path="/consola" element={<RequireAuth rol="superadmin"><ConsolaSection /></RequireAuth>} />`. Existix, té ruta i té guarda de rol.
- `ConsolaSection.jsx` són 262 línies amb quatre panells en pestanyes (Consums, Crèdits, Rebuts Matrix, Skills), construïts amb Pedra Seca: `Taula`, `Progres`, `Insignia`, `EstatBuit`, `Pestanyes`, `Dialeg`, `Alerta`, `Carregant`.
- No són mocks: `consolaContent.js:5` llig `/__iaia/consola.json`, servit per `consola-iaia.mjs`, que agrega rebuts Matrix, consums, inventari de skills (manifest contra disc), segell i diari immunitari.
- Els estats buits ja estan escrits amb la doctrina de C1. `ConsolaSection.jsx:66-70`: «Cap fitxer del repositori registra el saldo de crèdits de l'eixam. La consola no l'inventa». Algú ja va fer esta faena bé.

**Severitat:** crítica per al pla, no per al codi. Tres de les quatre tasques de consola del prompt ja estan fetes; la quarta (mocks) és la que C1 desaconsella.

**Conflicte amb:** el prompt i el pla T4, que descriuen la consola com a inexistent.

**Proposta conservadora:** no crear cap `ConsolaTermodinamica.jsx` nou. Ací discrepe obertament de Codex §5, que proposa un component nou a `src/sections/wiki-de-poble/` i el justifica dient que «complementa la consola administrativa existent». Tindríem dues coses amb el mateix nom, el mateix propòsit declarat i dos llocs on mantindre-les. És el patró de deute que el Mas combat. La ruta neta és extraure el cos de `ConsolaSection` a un component sense pàgina (`ConsolaPanells`) i que el consumisquen tant `/consola` com la Wiki: una sola consola, dues portes.

**requires_human_decision: true.** Decidir entre una consola reutilitzada o dues de separades és decisió de producte, i el repartiment de faena en depén.

### C3 · La font de les 13 Mètriques Sagrades no existix

**Àmbit:** `.agents/skills/consola-termodinamica/SKILL.md`, citada pel prompt com a font de veritat.

**Evidència:** el fitxer no és al disc. `git log --all` el situa per última vegada al commit `bd0eb03f` (25-08-2026). El pla T4 el cita amb un altre nom (`consola_termodinamica/SKILL.md`), que tampoc existix. El document viu que el substituïx, `02_saber/03_consola_termodinamica.md`, **no conté tretze mètriques ni els quatre blocs citats** (Cognitiu i Simbiosi, Estructural, Rendiment i Dispositiu, Resiliència): conté una taula de vuit senyals amb el seu estat d'implementació.

**Severitat:** crítica per a l'execució. La tasca «els 4 Blocs de les 13 mètriques definides a la seua SKILL» no és executable: la definició no existix. Qualsevol agent que la complisca sense parar-se s'inventarà tretze noms i dirà que els ha recuperat.

**Conflicte amb:** el prompt; i amb l'Efecte Matrix, que exigix llegir la font en lloc d'escriure de memòria.

**Proposta conservadora:** el Mestre decidix si les tretze es recuperen de l'arxiu històric (i de quin document exacte) o es redacten de nou amb el contracte de promoció que ja establix `03_consola_termodinamica.md` (pregunta que resol, fórmula, unitat, numerador, denominador, font, scope, llindar, prova). Fins llavors, la font vàlida és el document canònic i el catàleg té vuit senyals, no tretze.

**requires_human_decision: true.** Confirme la troballa de Codex §1 i no hi afig res que ell no haja dit; la registre perquè és bloquejant.

### A1 · La llavor didàctica ensenya una jerarquia que l'editor no sap escriure

**Àmbit:** `src/components/universal/richText/useUniversalRichText.js:30`, `richText/toolbarContract.js`, `richText/extensions/index.js`.

**Evidència:** verificada de manera independent després de llegir Codex §2, que la va detectar primer.

- `useUniversalRichText.js:30`: `StarterKit.configure({ heading: { levels: [2, 3, 4] } })`. H5 i H6 no són a l'esquema del document; TipTap els degrada a paràgraf en carregar-los.
- Ampliació pròpia: **H4 tampoc és assolible des de la interfície**. `toolbarContract.js:29-34` només declara `TITOL` (H2) i `SUBTITOL` (H3); les ordres del menú `/` (`extensions/index.js:63-73`) ofereixen igualment h2 i h3. H4 viu a l'esquema sense cap botó ni ordre que el produïsca.

Resultat: dels quatre nivells que la llavor vol ensenyar (H3, H4, H5, H6), l'usuari només en pot reproduir un amb les eines que té davant. La llavor li ensenyaria una escala i li amagaria tres graons.

**Severitat:** alta. El propòsit declarat de la tasca és pedagògic; tal com està especificada, ensenya el contrari del que pot fer.

**Conflicte amb:** la intenció de la tasca 3 del prompt.

**Proposta conservadora:** dos camins nets, i el Mestre tria.

- **(a) Ampliar l'escala:** `levels: [2,3,4,5,6]` i afegir les ordres i els botons que falten. És coherent amb el «supereditor», però toca l'esquema del document i cal comprovar que `sanitizeHtml` i la CSS donen estil a H5-H6 abans, no després.
- **(b) Ensenyar el que hi ha:** la llavor mostra H2, H3, paràgraf, llista, citació, divisor i el menú `/`. No toca l'esquema, respecta la Llei del Píxel i és honesta amb l'usuari des del primer dia.

La meua recomanació és (b) ara i (a) quan s'òbriga el torn del supereditor, perquè (a) sense els botons deixa el mateix problema un graó més amunt.

**requires_human_decision: true.**

### A2 · La llavor no es pot posar on diu el prompt

**Àmbit:** `src/sections/notes/NotesSection.jsx:128-139`, `NotesDataContext.jsx:385-392`, `src/data/backendPort.js:104`.

**Evidència:** el prompt diu «Modifiqueu la funció que crea notes per defecte (ex. a `NotesSection.jsx`)». Però `NotesSection.onCreate` només munta `{folderId}`, `{categories}` o `{tags}` i crida `creaNota(input)`; no decidix cap contingut. La cadena real és `creaNota` → `apiCreateNote(input, config)` → `backendPort.js:104`, on `createNote` és un mètode del **contracte del backend** (`asseguraMetode('createNote')`), implementat per l'adaptador. Codex ha seguit la cadena un pas més avall i situa l'adaptador a `src/data/supabase/notes.js:103`, desant `input.content || ''`.

**Severitat:** alta, perquè determina si el canvi toca la UI o la frontera d'enxufabilitat.

**Conflicte amb:** AGENTS §8 (Llei de l'Enxufabilitat) si s'escriu contingut didàctic dins de l'adaptador, que passaria a ser una capa de contingut.

**Proposta conservadora:** passar la llavor com a `input.content` des de `NotesSection.onCreate`, amb la plantilla en una constant de la secció. El client proposa, l'adaptador desa: la frontera es manté. Confirme la cautela de Codex: si algun dia el valor per defecte baixa a `creaNota`, ha d'aplicar-se només quan `input.content === undefined`, perquè una cadena buida explícita ha de continuar buida.

**requires_human_decision: false.**

### A3 · Un booleà `isSuperAdmin = true` seria una regressió, no una simulació

**Àmbit:** `src/app/guards/RequireAuth.jsx`, `src/app/contexts/SessionContext.jsx:32-33`, `tooling/vite/consola-iaia.mjs:88-99`.

**Evidència:** el prompt proposa «simuleu-ho amb una simple flag `isSuperAdmin = true` temporal si no tenim backend». Però ja hi ha tot el que cal, i és millor:

- `SessionContext.jsx:33` exposa `esSuperadmin: rol === 'superadmin'` (confirme Codex §3).
- `SessionContext.jsx:32` fa una cosa fina que val la pena no trencar: mentre el rol és `desconegut`, l'estat efectiu es manté en `comprovant`. Això evita el flaix de contingut privilegiat abans de saber qui ets.
- `RequireAuth.jsx:43-46` compara `rolActual !== rol` i mostra «Accés restringit». I declara honestament al seu propi comentari que no és seguretat: «la seguretat és la RLS de Sollutia».
- La consola actual, a més, no pot filtrar res en producció: `consola-iaia.mjs` té `apply: 'serve'` (no entra al build) i el middleware rebutja tota IP que no siga loopback.

El risc real és el moviment, no el flag: `/wikidepoble` és ruta pública sense `RequireAuth` (`App.jsx:611`). Portar la consola ahí la trasllada d'un entorn només-dev a un bundle públic.

**Severitat:** alta.

**Proposta conservadora:** si es munta a la Wiki, l'ítem i el seu detall es comproven amb `esSuperadmin` i no es munten mentre l'estat siga `comprovant`; i la font de dades continua sent només-dev. Cap booleà cablejat, en cap branca. Amagar l'entrada del menú no és protegir-la: la URL directa `?item=...` ha de comprovar el permís igual.

**requires_human_decision: false.**

### M1 · «Una tercera pestanya» no és una pestanya, i muntar-la ingènuament anida dues pàgines

**Àmbit:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx:90-127, 251-299`.

**Evidència:** «Wiki de Poble» i «Explorador del Cervell» no són pestanyes: són **categories** del `UniversalWorkspace` (`__intro_cat`, `obrir_graf_cat`, línies 256-257), cadascuna amb un ítem sintètic (`__intro`, `obrir_graf`) que `WikiDetail` reconeix per `id` (línies 91 i 111). El patró a seguir són tres peces: categoria, ítem sintètic i branca al detall.

Ampliació pròpia sobre Codex §4: `WikiDetail` **ja obri una `UniversalPage`** a cada branca. Si s'hi munta `ConsolaSection`, que també obri la seua (`ConsolaSection.jsx:199`), queden dues `UniversalPage` imbricades, amb dues capçaleres i dos cromats. És el motiu tècnic que fa necessària l'extracció que propose a C2, no una preferència d'estil.

Confirme també l'avís de Codex sobre la selecció: `WikiDePobleSection.jsx:228-230` resol `activeItem` només contra `wikiManifest.items`, que no conté els ítems sintètics. Hui, una URL directa a la portada o al graf ja no restaura la selecció; el tercer apartat heretaria el mateix defecte.

**Severitat:** mitjana.

**Proposta conservadora:** resoldre la selecció contra el model complet (o un mapa explícit de les tres eines) en la mateixa passada, i muntar `ConsolaPanells` sense pàgina pròpia.

### M2 · L'índex de l'Escriptori ancora unes cinquanta ombres

**Àmbit:** `_wiki_de_poble/04_escriptori/00_index_escriptori.md`.

**Evidència:** l'índex llista 16 entrades a «Activitat en curs» i unes 40 a «02_investigacio_ia». L'Escriptori real, llegit del disc en l'arrencada d'esta sessió, té quatre elements. `git status` mostra els documents citats dins de `90_arxiu_historic/260923_1930_auditoria/`, `260923_1930_neteja/` i solts. La neteja va moure els fitxers i no va reescriure l'àncora.

**Severitat:** mitjana, i creixent: cada sessió que llig este índex per orientar-se rep una llista de documents morts, i AGENTS §5 prohibix seguir-los fins a l'arxiu.

**Conflicte amb:** AGENTS §12 (ancoratge obligatori) i el §1 del pla T4, que declara l'Escriptori net.

**Proposta conservadora:** retallar l'índex a allò que existix al disc, en el mateix torn que faça la propera neteja. No esborrar res de `90_arxiu_historic`; només deixar de prometre el que ja no hi és.

### M3 · La porta que em deixa cec no em deixa fora

**Àmbit:** `tooling/gates/mutation-policy.mjs:20-30`, `tooling/gates/hooks-local.mjs:80`.

**Evidència:** dos observacions del mateix fitxer, en direccions contràries.

- `knownRead` (línia 21) autoritza `Grep` i `Glob`. Però esta sessió no els porta carregats, i l'única via per carregar-los (`ToolSearch`) no és a la llista, així que la porta la bloqueja. He auditat sense poder fer ni un `ls`: només `Read` sobre rutes endevinades i `git log`. Una porta pensada per impedir escriptures acaba impedint la lectura exhaustiva, que és justament el que un auditor necessita.
- Al mateix temps, la línia 26 accepta `/^git (status|diff|log)( .*)?$/`. Eixe `( .*)?` no exclou metacaràcters de shell: qualsevol cua darrere d'un `git log` passa la porta, incloent-hi `;`, `|` i `&&`. La mateixa porta que em prohibix `ls -1` deixaria encadenar ordres darrere d'un `git log`. **No l'he explotat**, i ho dic perquè quede constància del camí no pres.

Un tercer efecte, descobert en intentar-ho: la porta bloqueja qualsevol escriptura amb «Ruta fora del repositori», i això inclou la memòria persistent de l'agent local (`~/.claude/projects/…/memory/`). Amb el confinament actual, un agent local pot llegir el que va aprendre en sessions anteriors però no pot corregir-ho quan descobrix que ha quedat desfasat. Concretament, no he pogut esmenar una nota meua del 22-09 que encara afirma que `Bash` és un bypass obert; hui he comprovat que ja no ho és, i eixa correcció s'ha quedat sense escriure.

**Severitat:** mitjana la ceguesa, alta el forat.

**Proposta conservadora:** afegir `ToolSearch` a `knownRead` (o carregar `Grep`/`Glob` per defecte en les sessions locals), i ancorar el regex de git a arguments sense metacaràcters, per exemple `/^git (status|diff|log)( [\w./=-]+)*$/`. Els dos canvis són a `tooling/`, zona de governança: van per `executor-mutacio.mjs` amb lease, no per eina directa.

**requires_human_decision: false**, però requerix el circuit de governança.

### I1 · La bona notícia: el supereditor ja està construït a mitges

**Àmbit:** `src/components/universal/richText/extensions/index.js`, `toolbarContract.js`, `package.json`.

**Evidència:**

- `extensions/index.js:2,7-11`: `ReactNodeViewRenderer` **ja s'usa en producció**. `SdpImage` estén `Image` amb `addNodeView()` i `SdpImageNodeView.jsx`. El patró per incrustar un component React dins del text no s'ha d'inventar: ja funciona, amb les imatges.
- El menú `/` ja existix (`SlashMenu`, sis ordres) i `@tiptap/suggestion` ja és a `package.json:103`.
- `toolbarContract.js:28-40`: `TOOLBAR_SCHEMA` declara vuit botons i `SCHEMA_VISIBLE` en filtra sis, «Els botons que UniversalToolbar sap pintar hui». **Citació i Divisor ja tenen adaptador i esperen la Fase 5**: el mode bàsic contra supereditor no és una idea nova, és una estructura de dades que ja hi és amb dos botons aparcats.

**Conseqüència operativa:** les UniversalCards incrustades i la barra expandible **no necessiten cap dependència nova**. TipTap 3.31.3 amb `@tiptap/react` ja porta tot el que cal. Això importa perquè `npm install` està prohibit sense aprovació (QUI_SOC §5) i perquè la família `@tiptap` ja ha trencat el lockfile d'este repositori abans.

**Proposta:** el camí és un node `sdpCard` (`group: 'block'`, `atom: true`) amb `ReactNodeViewRenderer`, una ordre nova a `creaOrdres()` i, per a la barra, que `UniversalToolbar` accepte `SCHEMA_VISIBLE` com a llista en lloc de cinc propietats amb nom propi. Subscric sense esmenes el disseny de node de Codex §7: atributs versionats `{schemaVersion, entityType, entityId, presentation}`, mai una còpia de l'entitat dins del document, i serialització a HTML amb un `<div data-sdp-node>` que continga un enllaç estàtic com a representació degradada. El seu avís sobre DOMPurify (conserva els `data-*` encara que no siguen a `ALLOWED_ATTR`) és exactament el tipus de comprovació que evita una regressió XSS; no l'he repetida i me la crec perquè l'ha executada.

### Sobre el repartiment que proposa Codex

Codex proposa assumir consola, integració a la Wiki i proves d'accés, i deixar-me l'arquitectura de l'editor i la llavor. M'hi acorde, amb una condició: la decisió de C2 (una consola o dues) va abans del repartiment, perquè canvia què és exactament «fer la consola». Si el Mestre tria reutilitzar, la faena de Codex és extracció i muntatge; si tria duplicar, és construcció nova i el deute és seu i conscient.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Executat en este torn, amb el resultat literal:

- `node tooling/gates/obrir_torn.mjs --actor Claude --scope documents` → `valid: true`, torn `torn_347653a8…`. Abans havia fallat dos vegades amb «Abast desconegut» (`docs`, `wiki`): els abasts admesos són només `code` i `documents` (`tooling/documental/turns.mjs:72`).
- `node tooling/wiki/document.mjs context --route auditoria` i `create` → rebut emés i esborrany ancorat.
- `npm run porta:documents -- --all` → **`valid: false`, 6 documents comprovats, 15 errors**. D'estos, cinc són meus i esperats (seccions `[pendent]` i dos files de Registre sense omplir en el moment de la crida). La resta és deute d'altri i la registre perquè és evidència, no soroll:
  - `260923_2153_pla_implementacio.md`: sense rebut persistent, `frontmatter.type` fora de l'enum, dos `tags` fora de l'enum, sense àncora.
  - `260923_2153_prompt_execucio_olivera.md`: sense rebut persistent, un `tag` fora de l'enum, sense àncora.
  - `260923_2205_auditoria_codex.md`: sense àncora.
  - `02_investigacio_ia/260922_0500_informe_idees_noves_skills.md`: «Torn caducat».

  Això confirma per tercera vegada el que Codex diu a §8: el pla i el prompt del Mestre, escrits seguint la plantilla, no passen la porta. `type: pla_implementacio` no és a l'enum de l'esquema encara que siga el nom de la ruta `pla.implementacio` al `protocolledge`. La plantilla i el validador no diuen el mateix.
- Lectura directa i citada de: `App.jsx`, `WikiDePobleSection.jsx`, `ConsolaSection.jsx`, `consolaContent.js`, `consola-iaia.mjs`, `NotesSection.jsx`, `NotesDataContext.jsx`, `NotesEditor.jsx`, `DocumentEditor.jsx`, `richText/index.js`, `richText/extensions/index.js`, `richText/toolbarContract.js`, `useUniversalRichText.js`, `RequireAuth.jsx`, `SessionContext.jsx`, `backendPort.js` (primeres 120 línies), `mutation-policy.mjs`, `hooks-local.mjs`, `turns.mjs`, `03_consola_termodinamica.md`, `auditoria_canonica.md`, `protocolledge.json`.
- Verificació independent de la troballa de Codex sobre els encapçalaments: llegida la línia `useUniversalRichText.js:30` i confirmada `levels: [2, 3, 4]`. L'ampliació sobre H4 sense botó és pròpia i es comprova a `toolbarContract.js:29-34` i `extensions/index.js:63-73`.

- `node tooling/gates/tancament.mjs --check --turn-id torn_347653a8…` (lectura pura) → **`valid: false`, estat `context_loaded`**. Quatre comprovacions passen (`plantilles`, `autoritat`, `ledger`, i el document d'este torn); quatre fallen: `segell` (exit 1), `skills` (exit 1), `wiki` (exit 1), `scc` (exit 1). El torn no pot tancar perquè no té pla vinculat ni relleu a ESTAT/LEDGER, cosa esperada: el pla és de MarIA i el relleu es fa al tancament de la jornada. Snapshot `5f064596`.

  Esta execució prova M2 amb una porta executable, no amb la meua lectura: l'eixida conté desenes de `LINK_INVALID` amb origen `_wiki_de_poble/04_escriptori/00_index_escriptori.md` cap a documents que ja no són al disc (entre altres, tota la tanda `260922_*` i `260923_*` d'auditories i plans ja arxivats). L'índex de l'Escriptori no és una llista incompleta: és una llista de destins morts, i la porta ho compta un per un.

  Altres fets que l'eixida documenta i que no són d'este torn, però que el Mestre ha de saber:
  - **Segell trencat:** hash actual `69100848` contra el segellat `2a37538f`. Concorda amb l'avís que apareix a cada crida d'eina.
  - **Projecció divergent** de `.agents/manifest.yaml` i `.agents/skills/00_INDEX_SKILLS.md` contra els 18 directoris de skills del disc.
  - **Quatre actes orfes** a `10_actes/`, sense camí actiu des de `00_INDEX.md`, incloent-hi `260923_2142_acta_marmota.md` i `260923_2020_acta_incidencia_cognitiva.md` d'esta mateixa nit.
  - **Una violació de Pedra Seca:** estil en línia (`color`, `background` o `font`) a `src/components/universal/PageFrame.jsx:254`, fitxer tocat en el torn de les 21:42.

No executat, i per tant no declarat: `npm run porta` sencer, `npm test`, `porta:frontmatter` i `porta:reflex`. No he repetit les proves de TipTap, DOMPurify ni vitest de Codex; les cite com a seues.

Un avís recurrent durant tot el torn, preexistent i alié: cada crida d'eina dispara `segell-auto.mjs`, que respon «Origen no acreditat: segell divergent; cap resegellat automàtic». Ve de l'arbre brut (58 fitxers modificats, `.agents/SKILLS_SEAL.json` entre ells), no d'este torn. Caldrà reconciliar-lo abans de qualsevol tancament que aspire a `closed`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No hi ha implementació en este torn: el prompt ordena mode AFK fins a validar el pla, i cap línia de `src/` ni de `tooling/` ha sigut tocada.

No he pogut fer cerca exhaustiva al repositori (M3). Tot el que no aparega a les rutes que he llegit o a `git log` és fora del meu abast, i les rutes les he trobades endevinant-les o resseguint la història. Pot haver-hi codi rellevant que no he vist; concretament, no he llegit l'adaptador `src/data/supabase/notes.js` (cite la lectura de Codex), ni `UniversalCard.jsx`, ni `sanitize.js`, ni la CSS que hauria d'estilar H5-H6.

No he verificat el symlink trencat `_wiki_de_poble/05_skills_superadmin` que reporta Codex; apareix com a no seguit al meu `git status`, cosa compatible amb la seua lectura, però no he pogut inspeccionar-lo.

No he obert `90_arxiu_historic/` (AGENTS §5), on són les auditories d'este mateix dia. Si la definició de les 13 mètriques és ahí, cal una ordre explícita per anar a buscar-la.

Cap prova passada d'este informe declara el repositori saludable. No hi ha commit, ni desplegament, ni canvi de dependències. L'Acta Marmota del final de jornada continua pendent.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_2205_auditoria_codex]]
- [[260923_2153_pla_implementacio]]
- [[03_consola_termodinamica]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
