---
type: informe
status: esborrany
description: Auditoria contrastada amb agents, proves locals i rèplica a Olivera; diagnòstic de la Gàbia i pla de correcció sense canvis de producte.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_4e7c263a-f34f-4fb1-bb89-794c6d1f51b7:cb00f529-3e15-4cd4-90cc-4a4338ec0716
---
# Auditoria estructural atòmica: codi, SEO, accessibilitat i governança

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4e7c263a-f34f-4fb1-bb89-794c6d1f51b7:cb00f529-3e15-4cd4-90cc-4a4338ec0716 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T05:18:02.779Z |
| Modificació | 2026-09-24T05:36:36.223811+00:00 |
| Propietari | Codex, coordinació i tres subagents |
| Ruta | auditoria |
| Torn | torn_4e7c263a-f34f-4fb1-bb89-794c6d1f51b7 |
| Tall d’evidència | HEAD 5eee12936ace555c659e9cbf45e9cd3227a6f648 + worktree brut, inici 07:16:45 +0200 |
| requires_human_decision | true, per a política/publicació i pla; no per a entregar l’auditoria |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 (variant no exposada pel runtime); mateix motor heretat pels tres subagents |
| Tokens consumits | Mesurats reals: no disponibles. Estimats: no calculats amb un mètode fiable; no s’inventa un total ni se sumen estimacions com a telemetria. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-24T05:29:17.036906+00:00: auditoria en quatre fronts, tres subagents i coordinador; contrast amb Claude 0652/0716 i plans 0645/0720; rèplica a les distorsions del prompt0722. Sondes repetides, navegador real i informe consolidat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i criteri de severitat

**El producte compila, però no està preparat per declarar “tot verd”.** Hi ha pèrdua de dades potencial demostrada al límit del desat, rutes de pàgina desconnectades, errors d’accessibilitat reproduïts i un circuit de governança que prohibix passos que ell mateix exigix. Les 217 proves React passen alhora que quatre sondes noves demostren defectes: el verd actual té buits de cobertura.

P1 significa reparació prioritària per dades, funcionalitat principal o operació bloquejada; P2, defecte acotat que cal corregir; P3, millora menor. **No s’atribuïx cap P0 ni explotació remota no demostrada.** “Bombardejant” significa buscar contraexemples i refusar falsos verds, no inflar severitats.

| ID | Prioritat | Resultat verificat |
| --- | --- | --- |
| D01 | P1 | Draft antic enviat amb revisió remota nova: el CAS deixa de protegir-lo |
| D02 | P2 | Reintent de promoció de mitjans retorna referència privada |
| D03 | P2 | HTML de lectura conserva imatges amb esquema sdp-media sense resoldre |
| D04 | P2 | Selector de llicència produïx PATCH buit i autoria fixa en lectura |
| W01 | P1 | /page/:slug consulta un lookup que el context no exporta |
| W02 | P2 | Detall inexistent sense noindex i amb canonical propi |
| W03 | P2 | Sitemap públic inclou registre noindex i arrel que redirigix a Xat |
| W04 | P2 | HTML/OG de la SPA genèric abans de JavaScript |
| A01 | P2 | Modal d’índex amb focus operant darrere |
| A02 | P2 | Quatre camps editables principals sense nom accessible |
| A03 | P2 | Estat de l’editor: dos controls niats i sense nom |
| A04 | P2 | Errors del registre apareixen sense moure el focus ni anunci |
| A05 | P2 | Dates a 3,6969:1 per a text de 14 px |
| A06 | P3 | Ruta activa i menú no exposen l’estat correcte en ARIA |
| G01 | P1 | Hook impedix obtindre lease, provar i tancar |
| G02 | P1 | Skill nova trenca segell i inventari del catàleg |
| G03 | P1 | Porta “de verificació” pot reescriure quatre fonts versionades |
| G04 | P2 | Post-hook sorollós i instrucció de recuperació equivocada |
| G05 | P2 | Fonts de govern contradictòries i procediments inexistents |
| G06 | P2 | Versió 2.3 de plantilla contra 2.2 del contracte |
| G07 | P2 | Caselles d’entrada no acreditades; pla compartit sense rebut inicial |
| P01 | P1 | Dos plans estratègics entren sencers al paquet públic local |
| Q01 | P2 | Portes CSS confonen prohibició normativa amb token inexistent |
| Q02 | P2 | Pre-commit repetix lint i Vitest sobre el mateix arbre |

### Dades, persistència i frontera de publicació

#### D01 · P1 · Un draft vell hereta indegudament una revisió nova

**Fonts:** `src/sections/notes/GlobalSaveManager.js:153` i `src/sections/notes/NotesDataContext.jsx:65`.

El gestor conserva `_baseRevision` al draft, però `flush` envia `getBase(id).revision`. `applyDraft` mescla camps locals damunt de la nota remota sense comparar revisions. Sonda sobre el mòdul real: draft amb títol antic i base 1; nota remota amb revisió 3; edició només del subtítol. El payload porta el títol antic i el subtítol nou amb `expectedRevision=3`. El servidor que comprove CAS acceptaria eixe valor: **la comprovació de concurrència pot validar la sobreescriptura que havia d’impedir**.

No s’ha sobreescrit cap nota real. És una demostració del payload amb persistència i transport sintètics. Cal conservar la base del draft, detectar divergència en recàrrega i resoldre el conflicte explícitament. Els desats propis confirmats poden avançar la base; una lectura remota arbitrària no. Provar recàrrega després de 409, dos pestanyes, canvis en camps distints i publicació amb conflicte. `requires_human_decision: false` per al defecte; la UI concreta del conflicte es consensua en el pla.

#### D02 · P2 · Promoció no idempotent, publicació que continua

**Fonts:** `src/data/supabase/storage.js:28`, `:169`, `:177`; `src/sections/notes/NotesContext.jsx:181`, `:223`.

La pujada no usa una estratègia idempotent. Si l’objecte públic ja existix, el doble de Storage retorna 409 i `promoteToPublic` torna la referència privada original. El consumidor continua fins a publicar i anunciar èxit. La nota conserva les refs privades, perquè només persistix `isPublished` i `publishedSubmissionId`; republicar o reintentar torna a promocionar-les.

La sonda mostra primera resposta `sdp-media://mitjans/...` i segona `sdp-media://mitjans_privats/...`. Açò prova degradació de referències, **no un bypass de RLS ni publicació del fitxer privat**. Cal verificar objecte existent i identitat del contingut, fer la promoció repetible i propagar errors tipats. No usar `upsert` indiscriminat sobre un objecte alié. No confirmar publicació amb refs privades pendents. `requires_human_decision: false`.

#### D03 · P2 · L’editor resol mitjans, la lectura del Mur no

**Fonts:** `src/sections/notes/NotesContext.jsx:189`, `src/sections/detail/detailRichText.jsx:8`, `src/data/supabase/storage.js:130`.

El HTML publicat pot contindre `<img src="sdp-media://mitjans/...">`. `sanitizeHtml` el conserva, i `renderRichText` l’injecta sense passar pel resolutor que usa l’editor. La sonda JSDOM confirma el protocol `sdp-media:` del `src` resultant. La traça fins al renderer és estàtica; no s’ha publicat contingut de prova al backend.

Cal un renderer amb resolució controlada de refs, cancel·lació en canvi de sessió i estat de fallada. Persistir refs estables; evitar URLs firmades caducables dins del contingut públic. Provar cos amb dues imatges, ref pública, privada no autoritzada i esquema rebutjat. `requires_human_decision: false`.

#### D04 · P2 · Llicència visible, decisió descartada

**Fonts:** `src/components/universal/DocumentEditor.jsx:125`, `src/data/supabase/notes.js:128`, `src/sections/notes/NotesContext.jsx:205`, `src/sections/detail/ItemDetailSection.jsx:74`.

El selector envia `copyright`; el mapatge de Notes no l’inclou. La sonda sobre `updateNote` produïx exactament `PATCH {}` en triar CC0. El payload de publicació tampoc porta llicència i la lectura imposa autoria fixa IAIA/Nano Banana. Un usuari pot creure que ha desat una decisió editorial que no arriba al servidor.

Cal acordar autoria/llicència en el contracte de contingut, adaptar esquema de manera compatible i propagar-la fins a la lectura. Fins llavors, el control no ha d’afirmar persistència. Açò és una fallada funcional, no un dictamen jurídic sobre les llicències. `requires_human_decision: true` per a camps, valors i política editorial.

### SEO i rutes

#### W01 · P1 · La ruta de pàgina ha perdut el seu proveïdor

**Fonts:** `src/sections/detail/PageDetailSection.jsx:12`, `:28`; `src/app/contexts/CoreContentContext.jsx:21`; `src/config/navigation.js:61`.

`pageDetailLookup` no forma part del valor exportat pel context. El consumidor cau sempre al Map buit i redirigix al Mur. No és només una cursa de càrrega: el camp continua absent en estat ready, mentre el navegador intern encara genera `/page/<slug>`.

CUA confirma `/page/projecte` → `/mur`. Reparar el contracte productor-consumidor i distingir loading/error/absència. Provar amb una pàgina de slug conegut injectada al context, navegació directa, refresc i slug absent. `requires_human_decision: false`.

#### W02 · P2 · Els “no trobats” tenen senyals d’indexació positiva

**Fonts:** `src/sections/detail/ItemDetailSection.jsx:30`, `src/hooks/useSEO.js:13`.

El detall invàlid no passa `index:false`; el hook assumix true. CUA: `/mur/no-existeix-auditoria-260924` mostra “Element no trobat”, títol “No trobat | Sóc de Poble”, canonical a la URL inventada i cap meta robots. Cal separar càrrega, error de xarxa i absència confirmada, posar noindex al resultat absent i fer que l’amfitrió responga 404 quan dispose d’eixa informació. La inspecció local no demostra quin estat HTTP envia producció.

Google documenta el tractament dels soft 404 en SPA i les alternatives de 404 real o noindex. [Font oficial](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). `requires_human_decision: false` per al client; contracte d’amfitrió pendent.

#### W03 · P2 · Sitemap i política de rutes divergixen

**Fonts:** `public/sitemap.xml:4`, `:24`; `src/hooks/useSEO.js:6`; `tooling/gates/build-seo-manifest.mjs:33`.

El sitemap estàtic inclou `/registre`, que el client declara noindex, i l’arrel, que redirigix a `/xat`. El generador SEO escriu només l’artefacte de WordPress i no actualitza eixe sitemap. Cal una font de rutes públiques canòniques que alimente les eixides del desplegament real; comprovar el sitemap de `dist`, les rutes resolubles i l’exclusió de privades. No s’ha provat el servidor WordPress ni Sollutia. `requires_human_decision: true` per a confirmar el contenidor de producció.

#### W04 · P2 · SEO del host pendent de contracte

**Fonts:** `vercel.json:13`, `index.html:14`, `src/hooks/useSEO.js`.

La configuració SPA reescriu totes les rutes a index.html, amb root buit i metadades socials genèriques; React les concreta després. Els consumidors sense JavaScript reben la targeta genèrica. No s’afirma que Google no execute JS ni que esta siga la configuració desplegada actual.

Definir amb Sollutia la resposta inicial HTML, canonical, robots i estat HTTP per contingut públic; escollir prerender o metadades servides pel host segons eixe contracte. Evitar un segon backend de contingut incompatible amb Model B. `requires_human_decision: true`.

### Accessibilitat observada

#### A01 · P2 · Modalitat declarada sense focus modal

**Font:** `src/components/universal/PageFrame.jsx:73`.

En `/projecte`, obrir “Índex de secció” deixa el focus al botó exterior; Tab avança a “Traduir” darrere del `aside role=dialog aria-modal=true`. No hi ha focus inicial, confinament ni fons inert. Escape per si sol no completa el contracte. Reutilitzar el `Dialeg` natiu existent, retornar el focus i, quan s’escull un apartat, enfocar-ne el destí. Comprovar el portal també en Shadow DOM i respectar moviment reduït en el scroll.

El patró modal exigix focus dins del diàleg mentre està obert. [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). `requires_human_decision: false` per a la reparació funcional.

#### A02 · P2 · Camps sense nom accessible estable

**Fonts:** `src/components/universal/UniversalEditorShell.jsx:37`; `src/components/universal/richText/useUniversalRichText.js:64`.

CUA a Notes observa quatre editables sense `aria-label` ni `aria-labelledby`: títol, subtítol, entradilla i cos TipTap. Els spans amb `data-placeholder` no establixen el nom del camp. Assignar noms estables, textbox i multiline quan pertoque, sense usar el contingut escrit com a etiqueta. Provar arbre accessible buit i amb text, teclat i lector de pantalla. `requires_human_decision: false`.

#### A03 · P2 · Estat de l’editor amb interacció duplicada

**Fonts:** `src/components/universal/UniversalEditorShell.jsx:324`; `src/components/PedraSeca/molecules/Dropdown.jsx:20`.

El trigger és un botó amb icona dins d’un `div role=button tabIndex=0`; tots dos sense nom, verificat al navegador. L’estat es presenta com a menú encara que el desplegable només informa. Usar un únic botó amb nom d’estat, expanded/controls i disclosure informatiu si no oferix opcions. Verificar una sola parada de Tab i Enter/Espai. `requires_human_decision: false`.

#### A04 · P2 · Errors de registre lluny del focus

**Font:** `src/sections/onboarding/OnboardingSteps.jsx:19`.

CUA envia el formulari buit: apareixen quatre errors locals, però focus continua a “Crear el compte” i no hi ha alert/live. No s’ha creat cap compte: la validació talla abans de `onRegister`. Hi ha associacions d’errors a diversos camps, però falta conduir l’usuari al resultat de la validació. Enfocar primer error o resum amb enllaços i anunci adequat. No es declara una infracció automàtica només per no usar aria-live; el defecte és el flux observat sense focus ni avís. [W3C, identificació d’errors](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html). `requires_human_decision: false`.

#### A05 · P2 · La data ha recuperat el contrast que el comentari advertix

**Font:** `src/css/layout.css:520`, canvi alié ja present a l’inici.

Computed styles a Notes: font 14 px/700, blanc, vel negre alfa 0,15 damunt taronja RGB(255,115,0). Fons compost RGB(216,75;97,75;0); contrast **3,696912:1**, inferior a 4,5:1 per a este text. El comentari de les línies 516–517 ja explicava la correcció amb `--sdp-sobre-accent`. Les icones del mateix fons no s’han marcat com a fallada de 4,5:1: tenen un criteri diferent.

Restituir tinta semàntica amb contrast mesurat en els croms suportats; no corregir a cegues tota la paleta. [WCAG 2.2, contrast mínim](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). `requires_human_decision: false` per a demostrar el defecte; integrar qualsevol canvi visual en el pla del Mestre.

#### A06 · P3 · Estat accessible desconnectat del visual

**Fonts:** `src/app/contexts/RouterContext.jsx:160`; `src/app/App.jsx:398`.

NavLink calcula la ruta activa però només modifica CSS: l’enllaç Notes actiu no té aria-current, verificat al DOM. El botó superior fixa expanded=false independentment de l’obertura. Derivar ARIA del mateix estat, sense crear-ne una còpia. `requires_human_decision: false`.

### Governança, bloquejos i mantenibilitat

#### G01 · P1 · No es pot obtindre el permís que l’executor exigix

**Fonts:** `tooling/gates/hooks-local.mjs:79`, `tooling/gates/mutation-policy.mjs:43`, `tooling/documental/command-policy.mjs:66`.

Sonda pura sobre `checkLocal`: `git status --short` i comprovació simple de segell → code0; `reflex open`, lint, Vitest i tancament --check → code2. Les ordres s’han tractat com a dades, no s’han executat per saltar el hook. L’agent protegit pot escriure certes fonts però no comprovar-les ni obrir el circuit de lease. AGENTS §4 i workflow §3 es tornen inexecutable sota eixe host.

**Solució política:** separar lectures, diagnòstics, derivats aïllats, documentació i mutacions; mantindre permisos explícits i exigència de lease per a governança. **Solució tècnica:** registre de capacitats tipat, argv validat, abast i efectes declarats; recorregut complet preparar→hash→open→seal→executor→verificar→relleu amb proves a través del host. No `npm run *`, prefixos shell ni exempció universal d’MCP. `requires_human_decision: true` per al canvi de política.

Esta sessió Codex sí té eines amb les quals s’han executat proves. Açò acredita esta sessió; no prova l’activació del hook d’Antigravity ni que tots els clients estiguen confinats igual.

#### G02 · P1 · La skill de disciplina invalida el mateix catàleg

**Fonts:** `.agents/skills/core-taxonomia-estricta/SKILL.md`, `tooling/brain/cataleg_skills.mjs:56`, `tooling/gates/executor-mutacio.mjs:42`.

Hash actual `455a0fad85708c2fb8c5aa95ace796c77c18181a922439dd291ee76e228f8852`; guardat `88f0ec03b3910a6e95785b3a3e0e67a69170357a319a5c005474e0eec148104d`. Comparar manifests amb `calculaSegell()` confirma una única alta; els altres 21 fitxers del manifest coincidixen. La skill entrà a HEAD `5eee1293`, sense type/status/triggers_on vàlids; l’inventari aborta i deu proves Node fallen en preparar fixtures.

Refusar una mutació amb segell invàlid és legítim. El defecte és la instal·lació incompleta i l’absència de recuperació executable. Preparar un paquet revisat amb skill vàlida o fusió del contingut redundant, índexs coherents i reconciliació CAS del segell. **Resegellar sol no arregla el catàleg.** No s’ha alterat ni reconciliat el segell en esta auditoria. `requires_human_decision: true` sobre conservar o fusionar la skill.

#### G03 · P1 · Verificar pot canviar fonts versionades

**Fonts:** `tooling/gates/run-portes.mjs:40`; `tooling/gates/tractor-build-previ.mjs:100`; `tooling/scripts/build-tokens.mjs:42`.

Si falten/caduquen builds, la porta executa `npm run build`, amb prebuild i generadors. Escriu quatre fitxers seguits per Git: `src/data/wikiManifest.js`, `src/css/design-tokens.css`, `public/rag-index.json` i `public/slugIndex.json`. Per tant, la proposta d’admetre tot `npm run porta` com a simple lectura no és correcta.

Usar comprovació sense escriptura o runner temporal amb lockfile congelat; promocionar generats com una mutació explícita. En AFK s’han executat `build:web` i `build:wp` directes, que generen dist, sense executar el prebuild general. La protecció de snapshot de `git-staged` s’ha de conservar. `requires_human_decision: false` per al defecte, canvi de circuit dins del consens.

#### G04 · P2 · El missatge de recuperació no correspon al bloqueig

**Fonts:** `tooling/gates/segell-auto.mjs:14`; `tooling/gates/hooks-local.mjs:14`.

El post-hook comprova una ruptura preexistent darrere de qualsevol eina; la recuperació sempre suggerix document context/create, inclús si s’ha denegat orquestració o shell. Açò genera torns i rebuts inútils. Tipar l’error i donar una acció realment admissible; deduplicar l’avís de ruptura sense transformar el diagnòstic global en verd. El post-hook informa: no desfà una escriptura consumada. `requires_human_decision: false`.

#### G05 · P2 · La norma s’ha multiplicat sense una comprovació de coherència

**Fonts i discrepàncies contrastades:**

- `.agents/QUI_SOC.md:62` diu substituir AGENTS, mentre AGENTS §15 establix l’original únic. `CLAUDE.md` el carrega abans; `cervell.json` no.
- `sdp-workflow/SKILL.md:34` s’autoreferencia per als principis de disseny; `doc_governanca.md:14` cita la skill inexistent `socdepoble-workflow` i a :48 tres scripts absents.
- `core-automillora` reserva codi a MarIA, mentre AGENTS §15 reconeix l’abast autoritzat explícitament per l’humà. En esta sessió l’AFK és la frontera vigent.
- `prompt_local` obliga arxivar auditories anteriors; AGENTS §12 permet conservar treball actiu. L’antiguitat sola no acredita que haja acabat.
- `wiki-propagar-veritat` prescriu reemplaçament global; la llei d’abast exigix superfície concreta. El text actual de l’ADR online conté contradiccions semàntiques que no es reparen amb un altre reemplaçament global.
- La norma d’integració React encara descriu backend injectat des del host; l’ADR Model B i la implementació actual en delimiten un altre contracte.

Mantindre la Constitució, la identitat i les sis carpetes. Llevar autoritats duplicades, sincronitzar procediments amb eines reals i convertir contradiccions en decisions concretes. El mapa 8×8 pot ser una vista, no una obligació de 64 processos o una migració física. No es proposa una purga indiscriminada. `requires_human_decision: true` per a doctrina contradictòria; no per a reconéixer supremacia d’AGENTS ja establida.

#### G06 · P2 · La porta de plantilles no comprova la versió editorial

**Fonts:** `.agents/protocolledge.json:70`, `_wiki_de_poble/03_actuar/plantilles/prompt_local.md:16`, `tooling/gates/porta-plantilles.mjs:21`.

Plantilla 2.3.0, ruta 2.2.0. La porta passa 13 rutes perquè compara seccions i blocs, no eixa coincidència. El hash acredita bytes entregats, no consistència de les afirmacions dins dels bytes. Versió única estructurada i prova de divergència; el nom de la ruta d’eixida ha de ser explícit en el prompt. `requires_human_decision: false`.

#### G07 · P2 · Les caselles d’entrada no són una evidència executable

El prompt entrant marca classificació i pla, però no rebut. El diagnòstic inicial troba prompt Codex sense rebut ni àncora; el pla Opus no té rebut, té etiqueta fora d’enum i falten seccions. Orfandat inicial: cinc enllaços trencats i zero orfes; quatre són documents Fable traslladats amb àncora vella. Durant el torn apareix el pla compartit 0720, inicialment sense rebut ni àncora.

S’ha seguit auditant perquè les lectures estan autoritzades i la casella és obligació de l’autor, no veto a investigar. Les entregues Codex usen torn/rebut i ancoratge reals. El pla compartit rep una regularització documental mínima i una rèplica, sense aprovar-lo ni canviar-ne l’autor original. No s’han reparat documents aliens anteriors ni reescrit la història. Fer que les caselles siguen eixida d’una comprovació amb data i tall; no un “x” manual. `requires_human_decision: false`.

#### P01 · P1 · Una classificació absent fa pública l’estratègia

**Fonts:** `tooling/wiki/lib/publication-policy.mjs:16`; els dos fitxers `02_saber/pla_director_legal_i_subvencions.md` i `pla_director_viabilitat_economica.md`.

La política legacy accepta visibility absent i fins i tot status esborrany dins de les arrels públiques. Els dos plans estan al manifest de 68 documents, amb 8.954 i 5.442 caràcters de cos, i al chunk `WikiDePobleSection-3-74Mo1C.js` del build local. No s’inclouen ací noms, imports ni contingut sensible innecessari. Açò amplia la confirmació de Claude del manifest al paquet distribuïble; **no acredita el desplegament remot**.

Decidir explícitament visibilitat dels dos plans, regenerar i comprovar manifest/RAG/slugs/build públics. Una ruta amagada o noindex no protegix bytes presents al JavaScript descarregable. Per als documents nous, proposar publicació explícita i migració revisada dels legacy; no llevar de colp tota la Wiki pública. `requires_human_decision: true`.

#### Q01 · P2 · La porta CSS exagera el significat de la infracció

**Fonts:** `tooling/gates/tractor-tokens.mjs:130`; `src/css/components.css:1455`; `src/css/modules.css:3370`.

Tokens retorna 47 incidències; Crom, cinc. Una part és deute normatiu, però el missatge T1 diu “inexistent” per `--sdp-crom-mostra` tot i que es declara just abans al component. També hi ha variables locals de bloc declarades a :3372–3377. La política pot prohibir eixes declaracions, però no prova que el navegador no les resolga ni que el component desaparega. T3 pot denunciar la ubicació; T1 ha de distingir existència real i legalitat normativa.

La porta Crom exigix píndola on `layout.css:78` documenta una ordre humana anterior de bloc sencer. És un desacord entre contracte i intenció documentada, no permís per redissenyar. Resolver la decisió i preservar aspecte fins al pla aprovat. `requires_human_decision: true` per al disseny; fals diagnòstic tècnic corregible sense nova doctrina.

#### Q02 · P2 · Cost duplicat del pre-commit

**Fonts:** `tooling/gates/git-staged.mjs:40`, `:43`; `tooling/gates/run-portes.mjs`.

La cadena ja inclou lint i Vitest; el pre-commit els repetix després. Deduplicar només sobre el mateix arbre/snapshot. No relaxar la materialització de l’índex ni passar a comprovar una mescla de worktree i staged. Les proves de hooks negatives passen, però això no acredita que el camí complet d’un client puga acabar un torn. `requires_human_decision: false`.

### Rèplica a Claude i al pla compartit de MarIA

S’han llegit les auditories 0652 i 0716 completes, els plans 0645/0720 i el prompt d’implementació 0722. La 0716 arribà després del primer tall; el contrast final següent substituïx la nota provisional de pendent. Llegir una entrega no equival a consensuar el pla.

1. **Convergència:** ruptura de segell, catàleg incomplet, bootstrap bloquejat, proves denegades sota el hook, versions incoherents i exposició dels plans. Ara aportem execució de proves i comparació completa de manifests.
2. **No al matcher F1 original; Claude0716 també el retira:** restringir el hook a Bash/Write/Edit deixa MCP mutadors fora. Orquestrar agents pot delegar efectes; cal herència de permisos acreditada, no assumir que el nom de l’eina és innocu.
3. **F3 necessita aïllament:** porta/build escriuen fonts seguides per Git. No són un carril de lectura en el worktree.
4. **Precisió G07:** l’error de StartLine/EndLine es comprova dins de ReplacementChunks; el reemplaçament simple amb camps top-level passa la sonda. No totes les edicions per línies fallen.
5. **Runbook G01 incomplet:** `segella --json` no exporta el manifest necessari per comparar-lo; cal un diagnòstic diferencial explícit. A més, resegellar no valida el frontmatter de la skill.
6. **Husky separat:** ara core.hooksPath és `.husky/_`; això no prova l’activació quan entrà HEAD ni autoritza a acusar un bypass. No explica directament write_to_file. Antigravity encara requerix traça del seu consumidor de hooks.
7. **No inventar motor:** el pla 0720 deia “Astra Alt”, però este runtime només exposa GPT-6 sense variant. Es corregix la identificació en l’aportació; no s’inventen tokens.
8. **Model cultural preservat:** el mapa 8×8 és una proposta reconstruïda, no memòria recuperada ni agents efectivament executats. Ací han treballat tres subagents més el coordinador, que són els quatre slots disponibles.
9. **Sense consens automàtic:** la coincidència entre informes no autoritza producte; el pla necessita integrar les proves de dades, UI i host i resoldre les discrepàncies.

### Addenda contrastada amb l’entrega final de Claude 0716

La matriu anterior conté 24 troballes principals. Este contrast incorpora quatre troballes addicionals, X01–X04, i acota altres propostes: **28 troballes documentades**, sense convertir tots els avisos del peer en vulnerabilitats demostrades.

#### X01 · P2 · Un error OAuth no acreditat es presenta com a alerta pròpia

`src/data/oauthRelay.js:314` llig error_description, i `:356–358` llança el missatge abans de llegir i comprovar state (`:361–367`). `src/app/App.jsx:188–190` el passa al toast. Sonda sobre els mòduls reals: una càrrega amb etiquetes img/script produïx zero lectures de state, text escapat i zero elements img/script al DOM. `src/components/universal/AvisadorEfimer.jsx:34` usa expressió React de text.

**Suplantació de missatge, no XSS en este recorregut.** No s’ha demostrat execució, robatori de sessió ni bypass d’autenticació. Validar l’intent OAuth pendent i mostrar un missatge controlat per a errors no acreditats, mantenint compatible el relé. El prompt0722, línia70, ha convertit incorrectament la troballa de Claude en «Vulnerabilitat Crítica OAuth (XSS)»: corregir-lo abans d’usar-lo per implementar. `requires_human_decision: false` per a la correcció del defecte; producte continua AFK.

#### X02 · P2 · Els documents de Wiki compartixen canonical i títol genèric

`src/hooks/RouteSEO.jsx:4–9` no té títol específic de Wiki i `src/hooks/useSEO.js:27` deriva el canonical només de pathname. `WikiDePobleSection.jsx` no registra SEO del document seleccionat amb ?item. Sonda del gestor seoHead real en JSDOM: la ubicació ?item=02_genotip conserva títol Sóc de Poble i canonical /wikidepoble. Cal identitat URL/metadades coherent per document o una política explícita d’indexació de la secció.

És una mala senyalització de la identitat documental, **no prova que cap cercador puga trobar cap document**. No s’ha verificat indexació real ni Search Console. [Criteri oficial de canonicalització](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). En el contrast final el navegador ja no estava connectat; esta addenda es basa en font i simulació DOM, diferenciada de les comprovacions reals anteriors. `requires_human_decision: true` per a la política d’URL/publicació.

#### X03 · P2 · La Wiki presenta el dia de consulta quan falta data

`src/sections/wiki-de-poble/WikiDePobleSection.jsx:84` substituïx attributes.date absent per new Date().toISOString(), i `:100–102` el presenta com data/hora del document. Els 68 documents del manifest inspeccionat no tenen attributes.date. És una pèrdua de procedència: consultar demà pot donar una data distinta sense editar res. Usar la metadada documental correcta o absència explícita; no inventar creació/modificació a cada render. La sonda acredita el camí de fallback; no s’ha canviat el rellotge ni alterat documents. `requires_human_decision: false`.

#### X04 · P2 · El sanejador aplica nofollow també als enllaços interns editorials

`src/utils/sanitize.js:54` fixa rel="noopener noreferrer nofollow" per a qualsevol àncora amb href. Sonda amb parseMarkdown i sanitizeHtml reals sobre 00_index: 66 enllaços, 51 interns amb ?item, 66/66 nofollow. Mantindre les proteccions pertinents i separar la qualificació SEO segons confiança/destinació. Nofollow és una indicació als cercadors, no una barrera d’accés ni una prova d’invisibilitat absoluta. [Qualificació oficial d’enllaços](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links). `requires_human_decision: true` per a la política editorial d’enllaços.

### Correccions de precisió per a la pissarra i el prompt d’implementació

- **Consola:** /consola ja exigix superadmin (`App.jsx:567`). La inconsistència és el detall de Wiki consola_termodinamica (`WikiDePobleSection.jsx:72–79`), que munta el mateix panell sense guarda. El plugin `tooling/vite/consola-iaia.mjs:91–98` només aplica en desenvolupament, admet GET i rebutja IP no loopback. No s’ha acreditat consola administrativa remota oberta; mantindre P3 de Claude i verificar el host abans d’elevar-la. La línia71 del prompt0722 apunta a la ruta equivocada.
- **CSP:** frame-ancestors en meta no és suficient, però `vercel.json:8` sí que declara la directiva en capçalera. No concloure absència universal de protecció. Falta verificar capçaleres del host efectiu; permisos de localhost i fonts externes són decisions a revisar, no explotacions provades.
- **F1′:** coincidim a retirar el matcher estret de F1. Una allowlist d’Agent/Workflow no acredita per si sola herència de controls: la prova negativa d’un subagent fora de scope és criteri obligatori abans d’adoptar-la. El P0 del peer tracta una proposta insegura no aplicada; no és un P0 desplegat actual.
- **WCAG i reflow:** falta cobertura automàtica específica i cal ampliar proves manuals, però absència d’axe no equival a absència de qualsevol test DOM. Hi ha proves React. Overflow hidden i mida menuda són indicis que requerixen reproducció a viewport/zoom abans de declarar incompliment complet.
- **WordPress/SEO:** un exportador sense consumidor local no certifica per si sol l’estat de producció. Contrastar amb Sollutia/host real i prioritzar també seeds, SVG social, lastmod i la duplicació de rutes privades assenyalats per Claude.
- **Traçabilitat final:** el 2026-09-24T05:34:35Z s’han comparat hashes de l’inventari governat (871 camins actuals) contra l’obertura del torn: zero diferències en producte, tooling, tests o controls. Les diferències estan limitades als documents de l’escriptori, incloses entregues concurrents. La modificació de layout.css ja existia en obrir el torn.

### Millora concreta del prompt v2.3

Afegir: mode `audit-only` explícit; ruta exacta del lliurable; llista de pla i informes amb paths; taula d’eines disponibles i efectes; tall HEAD + estat brut + hashes de fonts examinades; severitat amb impacte/reproducció/confiança; responsables i criteris de tancament per troballa. Substituir “cadena inviolable” per garanties i límits comprovables, i “consumir tota la potència” per cobertura i contraexemples mesurables. Les caselles les ha d’omplir el validador. Mantindre Context cultural i prohibició de tocar codi fins al consens. La telemetria ha d’acceptar explícitament no disponible, sense forçar estimacions inventades.

### Arquitectura i rendiment: observacions que no són vulnerabilitats demostrades

Build web: chunk principal 665,91 kB minificat, 192,69 kB gzip; Notes 465,56/149,38; Wiki 259,69/89,98. Embed: 2.598,91 kB minificat, 781,65 kB gzip. Són mesures del build, no Core Web Vitals ni una prova de lentitud en Baseline 2022. El paquet embed mereix pressupost i perfilat en dispositiu representatiu abans de canviar arquitectura. No s’ha instal·lat cap eina ni dependència nova.

Les proves actuals d’actor canviat/logout/refresh passen; no es torna a denunciar C14 com si continuara oberta. Tampoc s’afirma XSS, bypass RLS o integració Sollutia real: les portes estàtiques passen i el catàleg Sollutia està buit.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Resultats executats

| Comprovació | Resultat i límit |
| --- | --- |
| `npm test -- --run` | 44 fitxers, **217/217** proves; 15,44 s |
| `node --test tests/*.test.mjs` | **217/227**; 10 fallades de fixture pel catàleg de skills |
| `npm run lint` | exit 0, cap error ni avís |
| `npm run build:web` | exit 0; avís de chunk >500 kB |
| `npm run build:wp` | exit 0; paquet embed generat |
| `node tooling/gates/run-portes.mjs --diagnostic` | exit 1: segell i documents; plantilles, autoritat i LEDGER verds |
| `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` | exit 0; no certifica privacitat del contingut legacy |
| `node tooling/gates/tractor-orfandat.mjs` | tall inicial: 5 enllaços trencats, 0 orfes; varia amb treball concurrent |
| `node tooling/gates/tractor-doctrina.mjs` | exit 1: 168 camins citats inexistents; no equivalen a 168 bugs de producte |
| Portes Enxufe, Adaptadors, RLS, Frontissa, Rutes Web, InnerHTML | exit 0; comprovacions locals, no integració remota |
| `design_guard.mjs` | exit 0 amb deute propi del guard, no zero global |
| `tractor-crom.mjs` | exit 1, 5 infraccions |
| `tractor-tokens.mjs` | exit 1, 47 incidències, interpretació matisada en Q01 |
| Sondes frontend en memòria | **4/4 defectes observats**, repetits pel coordinador |
| Sondes de política | lectura exacta passa; open/lint/test/tancament denegats sota `checkLocal` |
| Contrast final del peer | OAuth escapat sense img/script; 66/66 enllaços nofollow; 68/68 documents sense attributes.date; SEO simulat en JSDOM |
| Navegador CUA real | rutes, DOM, focus, error local de formulari i contrast confirmats |
| `tancament.mjs --check --turn-id …` | executat; global roig per segell/catàleg/graf i relleu de governança pendent |

Els 18 tests de hooks i 29 de frontend executats pels subagents són subconjunts de les bateries principals: **no s’han sumat per inflar el recompte**. Els builds directes no han passat pel prebuild generador de fonts. Cap test ha operat comptes reals o dades remotes. Els logs locals són `/private/tmp/sdp-audit-0717-*.log`; este informe conserva els resultats necessaris i les sondes completes.

### Validació documental i estat de tancament

Els quatre lliurables (auditoria, annex, acta i pissarra0720) passen document.mjs check amb valid:true. El pla0720 queda vinculat al torn en estat planned: no és una aprovació. La comprovació global de tancament falla pel segell, identitat de skill, absència de relleu governat ESTAT/LEDGER i graf documental preexistent/concurrent. La traça registra quatre àncores Fable obsoletes, prompts0630/0711/0722 i pla0645 no ancorats, i una referència mal formada de Claude0652. No hi ha error de canvi de codi fora d’abast. No s’han arreglat documents d’altres torns ni forçat un closed per ocultar estes incidències.

### Reproducció dels quatre defectes de Notes

Desar el bloc següent en un temporal privat i executar-lo amb `node --experimental-vm-modules CAMI`. Són assertions sobre el comportament defectuós actual: després de reparar, han de canviar per comprovar la protecció esperada. Només se substituïx transport i persistència, no la lògica objecte d’auditoria.

```javascript
// Sondes de només lectura: mòduls reals, transport/persistència sintètics, zero xarxa.
// Executar: node --experimental-vm-modules /private/tmp/sdp-audit-0717-front-probes.mjs
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org';
const fromRoot = file => pathToFileURL(`${root}/${file}`).href;
const require = createRequire(`${root}/package.json`);
const observations = [];

async function isolatedModule(file, mocks) {
  const mod = new vm.SourceTextModule(await fs.readFile(`${root}/${file}`, 'utf8'));
  await mod.link(spec => {
    assert.ok(Object.hasOwn(mocks, spec), `Unexpected dependency ${spec}`);
    return new vm.SyntheticModule(Object.keys(mocks[spec]), function () {
      for (const [key, value] of Object.entries(mocks[spec])) this.setExport(key, value);
    });
  });
  await mod.evaluate();
  return mod.namespace;
}

// A: Un draft basat en revisió 1 es reenvia sobre revisió remota 3 sense conflicte.
const { GlobalSaveManager } = await import(fromRoot('src/sections/notes/GlobalSaveManager.js'));
const db = new Map([['scope:n1', {
  title: 'Draft antic', _operationVersion: 1,
  _fieldVersions: { title: 1 }, _baseRevision: 1,
}]]);
const calls = [];
const manager = new GlobalSaveManager({ delay: 60000, persist: async (key, transform) => {
  const next = transform(structuredClone(db.get(key) || {}));
  db.set(key, structuredClone(next));
  return next;
} });
const pending = manager.enqueue('scope', 'n1', 'subtitle', 'Edició posterior',
  () => ({ revision: 3 }), async (id, payload, revision) => {
    calls.push({ id, payload, revision }); return { revision: 4 };
  }, () => {}, () => {});
await manager.flush('scope', 'n1');
await pending;
assert.equal(calls[0].revision, 3);
assert.equal(calls[0].payload.title, 'Draft antic');
observations.push({ defect: 'stale_draft_rebased_without_consent', originalBase: 1, call: calls[0] });

// B: Repetir la promoció retorna la referència privada després del 409 de Storage.
const stored = new Set();
const client = { storage: { from: bucket => ({
  download: async () => ({ data: new Blob(['synthetic image']), error: null }),
  upload: async path => {
    const key = `${bucket}/${path}`;
    if (stored.has(key)) return { error: { message: 'The resource already exists', statusCode: 409 } };
    stored.add(key); return { error: null };
  },
}) } };
const storage = await isolatedModule('src/data/supabase/storage.js', {
  './runtime.js': { getResolvedConfig: () => ({}) },
  './config.js': { getClient: async () => client },
  '../identitat.js': { usuariDeSessio: () => null },
  './utils.js': { handleError: error => error },
});
const privateRef = 'sdp-media://mitjans_privats/tenant/user/notes/image.webp';
const first = await storage.promoteToPublic(privateRef);
const retry = await storage.promoteToPublic(privateRef);
assert.equal(first, 'sdp-media://mitjans/tenant/user/notes/image.webp');
assert.equal(retry, privateRef);
observations.push({ defect: 'promotion_retry_returns_private_reference', first, retry });

// C: L'HTML sanejat de lectura manté l'esquema opac; el renderer detailRichText l'injecta tal qual.
const { JSDOM } = require('jsdom');
globalThis.window = new JSDOM('<!doctype html>', { url: 'http://localhost:3340' }).window;
const { sanitizeHtml } = await import(fromRoot('src/utils/sanitize.js'));
const html = sanitizeHtml(`<p>Cos</p><img src="${first}" alt="Prova">`);
const image = new JSDOM(html).window.document.querySelector('img');
assert.equal(new URL(image.src).protocol, 'sdp-media:');
observations.push({ defect: 'read_html_keeps_unresolved_media_scheme', html });

// D: El camp de llicència ofert per l'editor no forma part del payload de Notes.
const writes = [];
const notes = await isolatedModule('src/data/supabase/notes.js', {
  '../appSeed.js': { getDefaultUserId: () => '', NOTE_FOLDERS_SEED: [] },
  './runtime.js': {
    ErrorSupabase: Error, buildSeedAppData: () => ({}), generateUUID: () => '',
    getCurrentUser: () => ({ id: '22222222-2222-2222-2222-222222222222' }),
    getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: '11111111-1111-1111-1111-111111111111' }),
    request: async (path, _config, options) => {
      writes.push({ path, body: options.body });
      return [{ id: '33333333-3333-3333-3333-333333333333', revision: 2 }];
    },
  },
});
await notes.updateNote('33333333-3333-3333-3333-333333333333', { copyright: 'Domini Públic (CC0)' }, 1, {});
assert.deepEqual(writes[0].body, {});
observations.push({ defect: 'license_change_sends_empty_patch', write: writes[0] });

console.log(JSON.stringify({ observedDefects: observations.length, observations }, null, 2));
```

### Reproducció del bloqueig sense executar ordres adversàries

Des de l’arrel del repo, importar `checkLocal` de `tooling/gates/hooks-local.mjs` i passar `{tool_name:'Bash',tool_input:{command:'npm run lint'}}`. Retorna code2. Amb command `git status --short`, retorna code0. Repetir per open/seal/tancament. La prova executa el classificador, no la cadena shell.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Abast autoritzat: auditoria i documents. **Zero canvis de codi de producte, normes, hooks o segell**; cap commit, deploy, instal·lació ni purga.
- Tall inicial HEAD `5eee12936ace555c659e9cbf45e9cd3227a6f648`, 2026-09-24 07:16:45 +0200. Worktree brut des d’abans, especialment `src/css/layout.css`; l’informe no descriu només HEAD. Hi ha redacció concurrent de Claude i MarIA.
- No es certifica RLS desplegada, backend Sollutia, flux E2E autenticat, WordPress servit, protecció de branca, activació real d’Antigravity ni cobertura WCAG completa. No s’han llegit secrets ni contingut de l’arxiu històric.
- `localhost:3340` és accessible amb navegador. El primer curl dins del sandbox no hi arribava; no era prova que el servidor estiguera caigut. Reutilitzat el PID que ja escoltava, sense alçar altre servidor.
- Cap diagnòstic psicològic de l’usuari, mètrica de temps estalviat o consum real de tokens inventat.
- No s’actualitzen directament `.agents/ESTAT.md` i `.agents/LEDGER.md`: la política els reserva a lease/executor i el segell previ està trencat. Forçar-ne l’escriptura per tancar “verd” seria contradir l’objecte de l’auditoria. El relleu exacte queda a l’acta 0717 per promocionar-lo després de recuperar el circuit. No es declara el torn `closed`.
- Consens d’implementació pendent; l’informe i els plans són propostes revisables. Les limitacions de tancament no impedixen entregar una auditoria vàlida documentalment.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0717_pla_implementacio_fortificacio_codex]]
- [[260924_0720_pla_implementacio_olivera]]
- [[260924_0717_acta_marmota_codex]]
- [[260924_0652_auditoria_claude]]
- [[260924_0716_auditoria_claude]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
