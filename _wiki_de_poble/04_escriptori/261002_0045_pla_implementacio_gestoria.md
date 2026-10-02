---
type: document
status: esborrany
description: Pla d'implementació del panell de la Gestoria amb SEO.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:b9eb13ce-bf52-47ef-aa64-77766f1186dd
---
# Pla Implementació Gestoria Small Businesses

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:b9eb13ce-bf52-47ef-aa64-77766f1186dd |
| Versió del document | 1.5.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T22:45:26.765Z |
| Modificació | 2026-10-02T03:43:49.143Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini Pro |
| Tokens consumits | ~5500 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-01T22:45:26.765Z: esborrany creat; contingut i verificació pendents.
2026-10-01T22:45:30.000Z: document emplenat per MarIA (Gemini Pro) amb l'estratègia dels 15 empleats IA de gestoria, la cascada visual (SKILL_VISUAL_LEARNING) i l'enfortiment del SEO.
2026-10-02T00:08:00.000Z: Claude afig el §5 (conclusions sobre els quatre plugins de 261002_0150), per ordre de MarIA al bucle; cap altra secció modificada.
2026-10-02: Codex contrasta fonts primàries i afig el §6: compatibilitat real amb Codex, matisos al §5, pilot natiu de skills/graf i enllaç al disseny genealògic. Les ampliacions són propostes auditades; no acrediten aprovació d'un tractor nou.
2026-10-02T01:28Z: Codex concreta la correcció de nomenclatura i destinació del paquet al §8; provada en còpia temporal, pendent de lease nova.
2026-10-02T03:05:33.955Z: Codex aplica el §8 i actualitza el relleu amb lease nova; 38/38 proves sobre el checkout reparat, sense paquets publicats.
<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
Hem ingerit dos informes estratègics destil·lats per Google Notebook LM i peticions de l'usuari:
1. **Aprenentatge Visual i Cascada Nemònica:** Una guia per a construir aplicacions web interactives HTML/JS autònomes que permeten aprendre conceptes complexos mitjançant codi fonètic i un algoritme de repàs espaiat (estil Anki). S'ha d'encapsular com a skill mestra (`SKILL_VISUAL_LEARNING_ANTIGRAVITY`).
2. **15 Empleats de IA (Small Businesses):** L'adaptació de l'ecosistema del paquet *Cowork* cap a Antigravity amb Gemini Pro, orquestrant 15 eines a través d'esquemes JSON (Tool Schemas) i el protocol de Workspace local. Els 5 dominis a atacar són: Comptabilitat, Màrqueting, Vendes, Atenció al Client i Operacions.
3. **Peticions addicionals:** Millorar massivament el SEO (OpenGraph i Meta Tags) per a `gentdelatorre.net` i `socdepoble.org` per a previsualitzacions excel·lents a WhatsApp.

### 2. Preguntes Obertes (User Review Required)
- **A Claude i Codex (Auditores locals):** Com integrem la interfície d'aprenentatge del Quiz (la cascada visual HTML/JS) dins l'estructura de la Gestoria, perquè servisca per formar els usuaris en la pròpia gestoria? Caldrà encastar-la en un Iframe?
- Com dissenyarem el flux *Human-In-The-Loop (HITL)* perquè les interfícies de l'Editor Universal aproven les decisions dels 15 empleats digitals de manera orgànica abans d'executar-les?

### 3. Canvis Proposats (Proposed Changes)

#### [Acció: NEW] `.antigravity/workspace_rules.json`
Establiment del protocol del workspace local. 
```json
{
  "workspace_context": {
    "company_name": "Sóc de Poble",
    "architecture": "15 Digital Employees Suite",
    "primary_agent": "Business_Operations_Orchestrator"
  },
  "enabled_domains": [
    "email_communication",
    "sales_commercial",
    "customer_support",
    "internal_operations",
    "marketing_promotion"
  ],
  "execution_mode": "Autonomous_with_HITL_validation",
  "system_instruction": "Actua com l'Agent Coordinador Principal de Sóc de Poble. El teu objectiu és interpretar les sol·licituds operatives i executar dinàmicament les 15 habilitats digitals mitjançant crides a funcions."
}
```

#### [Acció: NEW] `.agents/skills/core-visual-learning/SKILL.md`
Declaració de l'habilitat `SKILL_VISUAL_LEARNING_ANTIGRAVITY` que orquestrarà el funcionament i generació de codi font de les aplicacions formatives per al producte (fases 1 a 5 segons el document de mapes visuals).

#### [Acció: NEW] `.agents/tools/small_businesses_tools.json`
Catàleg local amb el llistat estandarditzat dels 15 endpoints JSON Tool Schemas, desglossats pels 5 dominis corporatius (ex. `execute_sales_workflow`, `execute_operations_workflow`, etc.) perquè el motor orquestrador els consumisca.

#### [Acció: MODIFY] Interfície Front-end de la Gestoria (Pendent d'assignar fitxer)
Modificació de les vistes principals de gestió corporativa per injectar-hi el *Human-in-the-Loop Validation Protocol*. Tot esborrany d'email, pressupost o balanç financer es renderitzarà ací i no es tramitarà fins que el *Mestre* ho aprove.

#### [Acció: MODIFY] Optimització SEO (OpenGraph i Meta Tags)
Implementar les metaetiquetes estructurades de SEO i OpenGraph per garantir que en compartir l'URL per WhatsApp, Telegram o xarxes socials, la previsualització ("social card") de **gentdelatorre.net** i **socdepoble.org** es veja completa, professional i esplendorosa. Això requerirà revisar tant les plantilles de WordPress com el SEO intern de l'SPA.

### 4. Correccions prèvies a l'activació (Defectes Trobats)
En la revisió de Codex s'han superat 166 proves de SEO, navegació i panell, però s'han detectat dos defectes que s'han de solucionar de forma bloquejant abans d'activar el mòdul de Gestoria:
1. **Privacitat de Gestoria:** La futura ruta de Gestoria s'està considerant indexable per defecte. Cal afegir-hi el corresponent `noindex` o barrera d'autenticació SEO perquè els robots no la pugen rastrejar, ja que és un mòdul privat.
2. **Herència d'imatge:** Una imatge específica de pàgina està heretant incorrectament les dimensions i el text alternatiu (`alt`) del logotip de l'aplicació. Cal corregir aquesta superposició.

### 5. Conclusions de Claude sobre la recerca de plugins (261002_0150)

**Fonts.** Els quatre projectes s'han identificat el 02/10/2026 amb fonts primàries:
- els repositoris de GitHub i PyPI;
- l'estudi independent de JetBrains del 28/07/2026;
- els termes legals de Claude Code.

Detall i enllaços a l'auditoria [[261002_0120_auditoria_claude]]. El document de recerca venia d'un vídeo, i en dos casos el vídeo descrivia malament el mecanisme.

**Veredicte general:** no s'instal·la cap dels quatre com a connector. Tots afigen hooks o processos de tercers que competirien amb `hooks-local.mjs` i amb la doctrina de `CLAUDE.md`. Sí que se n'adopten tres idees en forma nativa, amb Pedra Seca.

| Eina | Què és de veres | Decisió | Què n'adoptem |
| --- | --- | --- | --- |
| **Ponytail** (`DietrichGebert/ponytail`, MIT) | Reglament de «mínim codi» injectat a cada torn amb 3 hooks (SessionStart, SubagentStart, UserPromptSubmit). No evita rellegir fitxers. L'autor anuncia −22 % de tokens; JetBrains mesura −10,3 % de cost (p=0,004) i −15 % de codi, sense pèrdua de qualitat. | No instal·lar: duplica doctrina i afig soroll de context a cada torn. | La seua escala de 7 passos com a secció curta de `sdp-workflow`: YAGNI → reutilitzar → biblioteca estàndard → API nativa → dependència ja instal·lada → una línia → el mínim. És la nostra llei de «sense ciment industrial». Requerix lease. |
| **OmniRoute** (`diegosouzapw/OmniRoute`, MIT) | Proxy local que canvia el model que hi ha darrere de Claude Code (`ANTHROPIC_BASE_URL`), amb fallback entre 359 proveïdors. Inclou una CA per a interceptar TLS, grups de claus compartides i «TLS stealth». | **Rebutjat.** El codi i les dades viatgen al proveïdor que el router tria en cada moment, cosa incompatible amb la sobirania i amb la frontera de dades de la Gestoria. Enrutar crèdits de subscripció de Claude xoca amb els termes d'Anthropic. | Res. Els límits horaris es gestionen amb el triatge de `core-estrategia-ia`. |
| **Graphify** (`Graphify-Labs/graphify`, Apache-2.0, PyPI `graphifyy`) | Graf de codi amb tree-sitter local, més un pas semàntic que envia els documents a un LLM extern. Consulta per MCP. Un hook PreToolUse empeny a consultar el graf abans de llegir. Actualització incremental amb memòria cau SHA-256. Els `[[wikilinks]]` es convertixen en arestes `references`. | No instal·lar: dependència de Python, LLM extern i risc de «fuita del cervell» per les exportacions. | Ampliar el nostre Mapa `sdp.mapa.v1`, que ja té nodes, arestes i tres nivells de confiança, amb: (a) mòduls de `src/` i arestes `importa` (amb `acorn` o `@babel/parser`, que ja són al repo); (b) `[[wikilinks]]` com a arestes; (c) memòria cau per SHA-256; (d) un «Informe del Mapa» privat (nodes centrals, orfes, connexions inesperades, preguntes suggerides) que MarIA llija a l'arrencada; (e) una ordre de consulta `veïns`/`camí` admesa a `READ_NODE_COMMANDS`. Mai ha d'incloure `_gestoria_de_poble` ni l'Escriptori. Requerix lease (`tooling/`). |
| **Agent Skills** (`addyosmani/agent-skills`, MIT, 25 skills) | Skills amb frontmatter mínim (`name` + `description` amb «Use when…», sense resumir el procés) i seccions Overview, When to Use, Process, Common Rationalizations, Red Flags i Verification. Divulgació progressiva: menys de 500 línies i referències d'un sol nivell. | No copiar en bloc: duplicaria doctrina en una altra llengua, i les skills fetes contra les fallades d'un model poden empitjorar-ne un de més fort. | A cada `SKILL.md`: (a) una descripció «Usa-la quan…» que no resumisca el procés; (b) seccions noves «## Verificació» (ordre i resultat esperat) i «## Senyals d'alarma», com a complement de «Lliçons del Mestre»; (c) límit de 500 línies. A més, portar al valencià, com a concepte, `interview-me` (servix per al motor d'entrevista de l'Arbre Genealògic) i `doubt-driven-development` (refutació adversarial). Requerix lease. |

**Per a fer més intel·ligent MarIA:** el router cognitiu (`UserPromptSubmit`) pot ordenar les skills combinant la seua descripció amb les arestes del Mapa. Així carrega primer les que toquen els fitxers del torn.

**Per a Codex** (pregunta 1 de MarIA), recomanació de Claude: Ponytail, només com a idea; OmniRoute, no, ni tan sols per al seu propi consum, mentre compartim repositori amb dades de Gestoria.

### 6. Contrast de Codex: aplicabilitat, mesura i adaptació nativa

**Acord amb Claude:** no instal·lar els quatre paquets en este bucle; aprofitar conceptes comprovables dins dels ports i la governança existents. El document original no aporta URL ni versió: els projectes del §5 són candidats identificats pel nom i funció, no una identificació demostrada del vídeo. La cerca al catàleg de plugins de Codex no ha retornat estos quatre noms exactes; això no prova que no puguen instal·lar-se per altres vies. No s'ha executat cap instal·lador.

| Eina | Què pot fer Codex ara | Opció futura i criteri d'acceptació |
| --- | --- | --- |
| Ponytail | Aplicar canvis mínims, reutilització i verificació proporcionada sense carregar hooks addicionals. No és una memòria cau de lectures. | El repositori inclou plugin específic de Codex, amb dos hooks Node en eixe camí; els tres hooks del §5 corresponen a Claude. Un pilot optatiu requeriria revisar el codi i comparar qualitat/cost. Els percentatges del benchmark de l'autor no són estalvis mesurats ací. [Font](https://github.com/DietrichGebert/ponytail). |
| OmniRoute | No canvia el model ni l'encaminament d'este xat ja iniciat. La configuració local de Codex consultada no té proveïdors personalitzats. | Es podria avaluar en un CLI separat amb dades sintètiques, proveïdors expressament autoritzats i pressupost limitat. El projecte anuncia suport de Responses, però cal provar-lo; no és una reserva il·limitada de crèdits ni «300 proveïdors gratuïts». El nombre de proveïdors i de models gratuïts són magnituds diferents. [Font](https://github.com/diegosouzapw/OmniRoute). |
| Graphify | Usar el Mapa i el resolutor de la Wiki; afegir una proposta de memòria cau i procedència, sense enviar el repositori a un LLM. | Adoptar arestes deterministes i inferides separades, consultes acotades i invalidació per hash. La part AST local i la part semàntica amb model tenen tractaments de dades diferents. [Font](https://github.com/Graphify-Labs/graphify). |
| Agent Skills | Mantindre càrrega selectiva de la skill necessària, instruccions breus, referències explícites i evidència de verificació. | Revisar una skill cada vegada. El catàleg actual té 24 skills de cicle i una metaskill, 25 en total. Les referències compartides han de resoldre també quan una skill s'instal·la aïllada. [Font](https://github.com/addyosmani/agent-skills). |

**Matís al rebuig d'OmniRoute.** Compartisc no usar-lo amb la Gestoria ni amb este repositori privat. La impossibilitat d'aplicar-lo a este torn i el risc d'un fallback no autoritzat no demostren que tot proxy futur siga incompatible amb la sobirania. Un encaminador tancat a proveïdors aprovats pot ser un adaptador substituïble; no s'ha aprovat ni construït ací. Tampoc trasllade automàticament a Codex les conclusions del §5 sobre subscripcions de Claude.

Per a Codex, exposar només Chat Completions no basta: el gateway ha d'admetre el contracte Responses. Un pilot haurà de conservar streaming, crides i resultats d'eines, continuacions, cancel·lació i errors; un 429 no pot repetir una acció amb efectes ni canviar de proveïdor silenciosament. [Documentació oficial de gateways](https://learn.chatgpt.com/docs/enterprise/gateway-compatibility#requests-and-endpoints).

**Adaptació nativa per a MarIA — proposta concreta:**

1. Estendre `sdp.mapa.v1` i el resolutor existent, sense un segon cervell paral·lel. Cada aresta tindrà tipus, fitxer/línia o secció d'origen, hash de font, versió d'extractor i estat `extreta/inferida/revisada`. Una inferència caducada no es presenta com a fet. La font canònica continua sent el fitxer.
2. Pilot amb un conjunt explícit de codi i documents canònics. Excloure dades personals, secrets, `_gestoria_de_poble`, captures, Escriptori i arxiu històric del graf persistent. El context actiu autoritzat es continua llegint directament. No executar una indexació indiscriminada de l'arrel.
3. Derivar imports i wikilinks determinísticament; cachejar per contingut, eliminar nodes de fitxers retirats i invalidar les arestes afectades quan canvie el parser. La selecció de skills usa el graf com a ajuda, sense convertir veïnatge o centralitat en autoritat.
4. Fitxa de cada skill: quan s'aplica i quan no, entrades necessàries, passos, eixida esperada, proves i límits. Referències locals carregades quan toquen. El límit de 500 línies del §5 és una guia editorial, no un motiu per tallar contractes obligatoris. Els manifests aprovats i el seu executor continuen decidint permisos. [Guia oficial de skills](https://developers.openai.com/plugins/build/skills).
5. Exposar consultes de veïns, dependències i camí amb límit de resultats, procedència i estat de frescor. Un informe privat assenyala orfes o discrepàncies, però no autoritza reescriptures automàtiques. Qualsevol canvi en `tooling/` o `.agents/` passa pel circuit protegit vigent.

**Mesura abans d'afirmar estalvi:** pilot A/B de 10–20 tasques representatives i sintètiques, amb el mateix model, fixtures i criteris de qualitat. Mesurar tokens d'entrada/eixida/cache quan hi haja telemetria, temps, cost inclòs el d'indexar i mantindre el graf, lectures repetides, defectes i compliment de portes. Sense telemetria, bytes o crides són aproximacions i no es presenten com a tokens. No s'estalvien les lectures íntegres exigides ni proves de seguretat necessàries. Les xifres del vídeo i les del §5 no s'adopten com a pressupost garantit.

**Respostes consolidades del pla original:** Quiz com a component React natiu amb scheduler pur i estat propi; no cal iframe. Les quinze capacitats referencien manifests de tractors existents, acord ratificat per MarIA a l'auditoria 0155. L'aprovació de la versió del flux, la de l'operació concreta i l'enviament extern continuen separades. `noindex` no substituïx autorització ni exclusió de dades del bundle. El catàleg complet de quinze continua requerint concreció; no s'inventa el contingut dels informes NotebookLM no entregats.

**Ampliació Arbre Genealògic:** arquitectura teòrica en [[261002_0205_pla_implementacio_arbre_genealogic]], amb CSV/SQLite local, entrevista d'una pregunta, investigador amb cites i revisió, i UI del Calendari/Pedra Seca. Reutilitza patrons de skills i graf, mantenint el contingut familiar fora del Mapa documental. No s'activa cap tractor genealògic.

### 7. Variant del directori WordPress (Codex, ratificada per MarIA 0225)

El bundle autònom actual inclou React. La variant del directori usarà els handles `react`, `react-dom` i `react-jsx-runtime` del nucli, amb WordPress mínim 6.6 per al runtime JSX. La font oficial confirma el contracte `ReactJSXRuntime` des de 6.6: [JSX en WordPress 6.6](https://make.wordpress.org/core/2024/06/06/jsx-in-wordpress-6-6/).

- `vite.standalone.config.js` i `package.json`: variant explícita `SDP_VARIANT=wordpress`, externals de React i eixida separada `wordpress-plugin/builds/directori/dist`; `build:wp` conserva l'artefacte autònom. El manifest declara l'entorn d'execució i dependències.
- `wordpress-plugin/eines/empaqueta.mjs`: exigir els dos builds, inventaris íntegres, mateixa versió/node/contracte i entorns diferents; el ZIP del directori rep només el build WordPress i requisit mínim coherent. Mai reutilitzar el bundle autònom si falta la variant.
- `wordpress-plugin/includes/manifest.php` i `marcatge.php`: validar la declaració de runtime i registrar els handles del nucli només per a la variant WordPress; les dependències no provenen d'una llista arbitrària. El marcatge copiable advertix quan cal la distribució autònoma per a Sollutia.
- `wordpress-plugin/readme.txt`: documentar compilació i compatibilitat de les dues distribucions.
- `tests/enxufe-empaqueta.test.mjs` i `tests/enxufe-runtime.test.mjs`: fixtures diferents per variant, refús d'artefactes intercanviats/incomplets i comprovació de registre PHP i externals. Builds reals dels dos camins, sense desplegament ni publicació.

El canvi es materialitza amb lease i executor de mutació. S'ha revisat el diff exacte de la skill documental del commit `623a2af55` i reconciliat el segell pel P-14: les dues directrius noves són les del prompt vigent del Mestre; cap altra skill ha canviat. Esta reconciliació no activa cap tractor sobre dades personals.

Estat local: doble runtime aplicat amb executor, 69 proves del connector verdes i dues compilacions completes correctes. La prova JSX comprova globals externs i hooks; no substituïx WordPress complet ni Plugin Check. Seguiment exacte a l’auditoria Codex 0148.

Tancament de S5 dins del mateix carril: afegir `gestoria` i `tractors` a `tooling/wiki/lib/publication-policy.mjs`; ampliar `tests/public_exports.test.mjs` amb rutes i verificació del manifest generat. Registrar les noves proves de runtime i publicació a `test:node`, i deixar el relleu de Codex a ESTAT/LEDGER mitjançant lease. Cap activació de dades ni desplegament.

### 8. Higiene de l’empaquetat (Codex, aplicat a les 05:03)

Correcció ordinària dins del carril WordPress autoritzat, **aplicada i comprovada** al repositori. L’empaquetador anterior usava `release/` i noms sense data, en desacord amb `.agents/skills/core-empaquetat-wp/SKILL.md`. S’adopta la destinació explícita `wordpress-plugin/builds/` del §2 de la skill; les referències heretades a `01_produccio/builds/` dels §3–4 no es fan servir ni s’edita la skill en esta reparació.

- Noms: `socdepoble-enxufe-vVERSIO-AAMMDD_HHMM.zip` i `socdepoble-spa-vVERSIO-AAMMDD_HHMM.zip`. La marca es deriva de `generat` del build autònom en `Europe/Madrid`, de manera que repetir l’empaquetat no la canvie. Es comproven canvi d’any i data invàlida.
- Les dues variants WordPress conserven el nom canònic. El canal propi va a l’arrel de l’eixida; el del directori, a `directori/`. El canal signat declara el nom i `cami` de la variant del directori, amb empremta pròpia. Els ZIP mantenen l’arrel interna `socdepoble-enxufe/`; les URLs del canal propi i la SPA apunten als noms exactes nous.
- Eixida per defecte dins de `builds/`; `--sortida` permet només eixa carpeta o una subcarpeta. Es comproven totes les destinacions abans d’escriure, inclosos enllaços simbòlics preexistents, per evitar eixides o escriptures parcials en els casos provats. No és una garantia contra un altre procés que canvie el sistema de fitxers durant l’escriptura.
- PHP deixa d’inventar un nom antic del ZIP quan remet a l’autònom; el readme i l’ajuda expliquen el patró nou. No s’altera cap contracte de UI, backend ni aprovació.

Fitxers reservats: `wordpress-plugin/eines/empaqueta.mjs`, `wordpress-plugin/includes/marcatge.php`, `wordpress-plugin/readme.txt`, `tests/enxufe-empaqueta.test.mjs` i `tests/enxufe-runtime.test.mjs`. Proposta exacta amb hashes previs i continguts: `/tmp/sdp-package-0325/proposed-files.json`; diff: `proposal.diff`; reproductor: `reproduce.mjs` dins del mateix directori. La còpia temporal passa **38/38** proves, sense omissions, i es neteja després. Els cinc fitxers productius tenen ara els hashes posteriors de la proposta. El reproductor de còpia temporal exigix els hashes previs i queda com a evidència històrica; després d’aplicar, s’usa la bateria del checkout indicada a l’auditoria.

Aplicat després de caducar el bloqueig, amb lease nova `43cc9095-1cea-4ff7-a24d-eba7aa16a474`, transacció `575a9956-a2c8-4c6a-9977-cc115b531ff2` i set targets exactes (cinc fitxers WordPress/tests i ESTAT/LEDGER). Hashes posteriors i checksum del registre verificats; lease consumida. La bateria d’empaquetament/runtime/plugin sobre el checkout reparat passa **38/38**, zero omissions. Evidències a `/tmp/sdp-package-relay-0503/`; cap ZIP real de distribució generat ni publicat. Continua pendent la validació completa de distribució, detallada a l’auditoria viva.

### 9. Readme del directori en anglés (Codex, aplicat)

Plugin Check 2.1.0, executat sobre la variant del directori en WordPress sintètic, detecta `readme_description_non_official_language`. La [instrucció oficial del 28-07-2025](https://make.wordpress.org/plugins/2025/07/28/requiring-the-readme-to-be-written-in-english/) demana el readme en anglés per a la revisió i com a llengua base de traducció. La UI valenciana de l’app i del connector no canvia.

- Traduir `wordpress-plugin/readme.txt` a anglés, incloent instal·lació, serveis externs, límits i retenció de DeepL, privacitat, compilació, preguntes i historial. Conservar identificadors, límits numèrics, URLs i les dues variants. Distingir el full de ruta del Fedivers i els adaptadors futurs de funcionalitats ja operatives; la Wiki pública és només la part autoritzada per la política de publicació.
- Adaptar `variantDirectoriReadme` en `wordpress-plugin/eines/empaqueta.mjs` perquè retire tant el paràgraf antic en valencià com l’anglés del canal propi, amb exactament una coincidència. El paquet del directori ha de continuar sense declarar el canal privat.
- En `tests/enxufe-empaqueta.test.mjs`, comprovar eixe tall en les dues llengües i conservar la metainformació i els avisos de serveis externs. Adaptar també les assercions de llengua de `tests/enxufe-plugin.test.mjs`. Repetir la bateria d’empaquetament i la comprovació `plugin_readme` sobre una còpia temporal actualitzada.

Abast: quatre fitxers del carril Codex, sense canvis de seguretat ni del comportament de traducció. Aplicació amb lease i executor, junt amb el relleu ESTAT/LEDGER, sis targets en total. Els 13 avisos de PHP/SQL queden per revisió separada; no es modifica el comptador atòmic per fer callar un analitzador. Les peticions HTTP de Plugin Check han estat bloquejades al fixture: eixes comprovacions externes no s’acrediten com a completes. No es publica cap paquet ni es contacta WordPress amb dades del lloc.

Aplicat amb lease `7ce1a1f6-2827-4803-8dbb-5bea9218da40`, sis targets verificats i rebut consumit. Les 38 proves del checkout passen; el readme transformat passa `plugin_readme` amb zero errors i avisos en el fixture. Evidències: `/tmp/sdp-readme-0515/`.

### 10. Contrast posterior al lliurament de Claude v1.4 (Codex)

Claude tanca el seu carril al §7 de l’auditoria 0120 v1.4. Codex reserva quatre reparacions delimitades, després de llegir-la sencera; no s’executa cap tractor ni es requerix una decisió tècnica del Mestre.

- `src/sections/gestoria/nucli/receptes.js` i la seua prova: quan els imports triats no porten moneda explícita, una menció a euros al peu no pot esborrar el senyal `Currency: USD`. Conservar la moneda estrangera i la confiança baixa; els imports explícits en euros mantenen precedència. Afegir casos sintètics amb peu de pagament i tipus de canvi, demostrats rojos abans de corregir.
- `src/sections/tractors/clausura.test.js`: substituir l’expressió regular pel parser AST `@babel/parser`, ja declarat al projecte. Llegir imports estàtics, reexportacions i dinàmics literals, inclosos comentaris i plantilles sense interpolació; rebutjar imports calculats que no es poden censar. No executar exemples ni imports de prova. La garantia es delimita als imports ESM recorreguts, no a tota execució possible de JavaScript.
- `src/sections/gestoria/fitxes/gestoria_correus.md`: alinear «Què llig» i «Què no fa» amb el pas 3: el fitxer complet passa per memòria, inclosos cossos i adjunts; només s’extrauen i conserven les capçaleres pertinents, sense analitzar ni mostrar el cos com a contingut.

Quatre fonts/tests, aplicació amb lease i hashes previs; canviar recepta o fitxa invalida l’empremta antiga per disseny. Proves del parser, model, pipeline i porta afectats, més regressions del lector. No es donen les empremtes curtes de l’auditoria de Claude com a vigents després de modificar les fonts. La còpia vella de l’autenticador continua com a pendent explícit, sense esborrar-la ací.

Aplicat a les 05:28 amb lease `449101de-5fa0-46a3-93ad-604a98e1ecb6`, transacció `59b0a38d-c33b-4475-8eb8-9bb035eddc2c`; quatre hashes verificats i rebut consumit. Sis regressions noves roges abans del canvi, 85/85 en còpia després, i 316/316 en les huit suites afectades del checkout, incloent qualitat i privacitat. Evidències: `/tmp/sdp-gestoria-0530/`. Empremtes recalculades en lectura: factures `206E-31C6`, correus `D317-FC47`; cap registre d’aprovació creat.

### 11. Adreça del client i avisos de Plugin Check (Codex)

Reserva de tres fitxers del carril WordPress: `wordpress-plugin/includes/traduccio.php`, `tests/fixtures/enxufe-traduccio.php` i `tests/enxufe-traduccio.test.mjs`. Validar `REMOTE_ADDR` com a cadena IPv4/IPv6 amb `filter_var(..., FILTER_VALIDATE_IP)` després de `wp_unslash`; els valors absents, invàlids o no escalars comparteixen el comptador `unknown`. No es llig `X-Forwarded-For`, no es guarda la IP en clar i el HMAC conserva el format. La validació de PHP admet IPv4/IPv6: [referència de filtres](https://www.php.net/manual/en/filter.constants.validation.php).

Afegir proves sintètiques de clients vàlids separats, clients invàlids compartint límit, valors no escalars sense avisos PHP i cap reinici per capçaleres. Contrast roig/verd abans d’aplicar, suite completa del traductor i comprovació PHP delimitada de Plugin Check sobre fixture sense xarxa. Canvi de seguretat amb lease i executor, més el relleu ESTAT/LEDGER en la mateixa operació (cinc targets).

Els avisos de SQL directe es revisen preservant compare-and-swap, inserció única i eliminació condicionada de locks. No se substituïx la lectura coherent per `get_option` només per llevar avisos. La crida de traducció local es manté fins a comprovar què passa amb els fitxers valencians inclosos en WordPress 6.6 i 7.1.2; no es trenca el paquet propi per una recomanació genèrica del directori.

Aplicat amb lease `1a73125d-8184-4d45-824d-6bcfe66c949b`, transacció `7e2a1ab0-934a-4df2-a94c-872c7fd8b38b`: cinc targets exactes, hashes i checksum comprovats, rebut consumit. La suite ampliada passa de **34/36 a 36/36** en el contrast i passa **36/36** al checkout. Les dues comprovacions estàtiques pertinents de Plugin Check donen zero errors i onze avisos (abans tretze). La càrrega local es conserva: una arrencada normal amb connector actiu i locale `ca` falla en carregar el fitxer inclòs si es lleva el ganxo en WordPress 6.6; en 7.1.2 ambdós modes funcionen. Evidències i reproductors a `/tmp/sdp-wp-ip-0540/`; no hi ha acceptació al directori ni desplegament.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Validar que el fitxer `.antigravity/workspace_rules.json` siga detectat per l'orquestrador.
2. Comprovar la propagació i lectura correcta del `small_businesses_tools.json` dins del context d'execució.
3. Llançar un component Visual Learning a prova d'aïllament (sandbox) per verificar la lògica de reintents d'Anki.
4. Passar el Linter/Test automàtic en Vite de l'app de Gestoria amb el panell HITL afegit.
5. Comprovar les metaetiquetes OpenGraph renderitzades (p. ex. via un linter SEO o curl) per assegurar la previsualització de WhatsApp per a gentdelatorre.net i socdepoble.org.
<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Disrupció de Routing SPA:** Si l'app autònoma HTML/JS dels Mapes Visuals entra en conflicte amb l'enrutador React, caldrà aïllar-la amb micro-frontends o *iframes*.
- **Desbordament de Tool Calling:** Mantenir els 15 esquemes JSON contínuament a la finestra de context podria desbordar o confondre Claude/Codex. Haurem de segmentar les eines en rutes més aïllades.
<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
