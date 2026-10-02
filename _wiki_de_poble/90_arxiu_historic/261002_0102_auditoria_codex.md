---
type: informe
status: esborrany
description: Auditoria de la integració modular de Gestoria, Quiz, aprovacions humanes i metadades socials dels dos dominis.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_fdf225c6-3ec9-46aa-9564-b96a4b52fddf:acc1e802-bbb1-4bb9-8f68-c30863f5a6ec
---
# Auditoria Codex: Gestoria, aprovacions i SEO social

Auditoria del pla de Gestoria del 2 d’octubre de 2026. El disseny modular és viable, però la integració dels tractors encara no existix i les targetes socials de producció tenen defectes reproduïts. Es lliuren les decisions d’arquitectura, els contractes proposats, les correccions prioritzades i una millora local limitada de metadades. Cap tractor nou queda activat ni s’ha fet cap desplegament.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fdf225c6-3ec9-46aa-9564-b96a4b52fddf:acc1e802-bbb1-4bb9-8f68-c30863f5a6ec |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T23:02:24.070Z |
| Modificació | 2026-10-01T23:15:05.366015Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (GPT-6) |
| Tokens consumits | No mesurables amb la telemetria disponible en este torn |
| Tall d’evidència | Proves sobre codi a HEAD 623a2af55; pla revinculat a 1f79cb739; observació final de concurrència a 2aac7f978; 2026-10-02, Europe/Madrid |
| Abast | Auditoria de Gestoria, Quiz, HITL i SEO; metadades estàtiques de index.html |
| requires_human_decision | true: ratificar el catàleg provisional i l’activació dels tractors a la Wiki |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-01T23:02:24.070Z: esborrany creat; contingut i verificació pendents.

2026-10-02, hora local: llegits íntegrament el pla i els dos prompts d’Activitat en curs, les normes obligatòries i les skills de procediment. Contrastats el codi vigent, les respostes HTTP públiques i les fonts tècniques primàries. No s’han obert els documents arxivats del cicle anterior ni factures o correus personals.

El circuit documental ha entregat la plantilla viva i creat este informe. Pla vinculat al torn `torn_fdf225c6-3ec9-46aa-9564-b96a4b52fddf`. L’àncora generada inicialment al final de l’índex s’ha situat dins d’Activitat en curs; cap fitxer de l’Escriptori s’ha traslladat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Veredicte i estat real

**T1 queda resolta com a disseny concret:** Quiz en React amb estat propi i el router existent; HTML extern només dins d’un iframe aïllat quan siga necessari. **T2 acredita defectes en producció i entrega la correcció per fases:** reforç local menor aplicat, publicació i resolució de metadades per URL encara necessàries. **T3 és este informe**, privat, creat amb rebut i ancorat a l’Escriptori.

El pla diu «aprovat» però el registre diu «Aprovació humana: pendent» i el frontmatter continua com a esborrany. L’ordre d’este xat autoritza l’auditoria i la millora SEO sol·licitada; eixa contradicció no permet donar per activats els quinze tractors. El prompt de Claude conté, a més, un requisit material que falta al pla comú: les factures i dades personals de Gestoria han de romandre locals. S’incorpora eixa frontera al disseny proposat, sense obrir la carpeta personal.

Al tall inspeccionat:

- `src/sections/control/ControlSection.jsx:101` presenta Gestoria com a «EN OBRES», sense acció. No hi ha una ruta de Gestoria registrada a `src/app/App.jsx` ni un mòdul implementat en `src/sections`.
- No existixen `.antigravity/workspace_rules.json`, `.agents/tools/small_businesses_tools.json` ni `.agents/skills/core-visual-learning/SKILL.md`. No s’ha trobat un consumidor d’eixos contractes en les superfícies inspeccionades. Crear un JSON no el convertix en una eina executable.
- `package.json` no inclou `react-router`. El sistema usa `src/app/contexts/RouterContext.jsx`, amb `BrowserRouter`, `MemoryRouter` i política de base pròpia.
- La Wiki mostra documents sanejats dins de `UniversalWorkspace`; no té un circuit d’aprovació de tractors. La Consola local només accepta GET des de loopback (`tooling/vite/consola-iaia.mjs:117`). No és un executor autoritzat.
- `backendPort.js` valida el nucli i les capacitats completes abans de substituir l’adaptador. És una base útil per a Sollutia; no s’ha d’introduir Supabase dins dels components de Gestoria.

### 2. Troballes prioritzades

P1 indica un bloqueig funcional o una condició necessària abans d’activar/publicar; P2 indica coherència o deute important. No equivalen a una explotació demostrada.

| ID | Prioritat i superfície | Evidència reproduïda i conseqüència | Correcció conservadora / decisió humana |
|---|---|---|---|
| S1 | P1 · `https://socdepoble.org/` i `/mur` | HTTP 200, però l’HTML inicial no conté `description`, OpenGraph ni Twitter Card. La portada i `/mur` tenen el mateix SHA-256. El codi local i el desplegat no coincidixen. | Publicar un paquet verificat i servir metadades inicials per a les URL públiques. No és suficient canviar React. `requires_human_decision: false` per al diagnòstic; publicació fora d’este torn. |
| S2 | P1 · URL de la imatge OG | GET i HEAD de `/assets/system/ui/og-socdepoble-1200x630.png` retornen `200 text/html`, 7009 bytes. El GET és exactament l’HTML de portada. | Publicar el PNG real i fer que un actiu absent siga 404, no el fallback de l’SPA. Comprovar MIME i signatura, no sols 200. `requires_human_decision: false`. |
| S3 | P1 · `https://gentdelatorre.net/` | Yoast emet títol, URL, tipus, lloc i locale, però cap `og:image`, `og:description`, `description` o `twitter:image`. TelegramBot rep el mateix dèficit. | Configurar imatge i descripció de la portada en el propietari actual del head, Yoast. Evitar una segona emissió des del plugin React. `requires_human_decision: true` per a ratificar la creativitat de Gent de la Torre. |
| S4 | P1 · `build-seo-manifest.mjs` | Encara referencia `wordpress-plugin/inc/sdp-seo.php`, que no existix; el plugin carregat és `socdepoble-enxufe.php` amb `includes/`. `--verifica` falla perquè falta `wordpress-plugin/dist/seo-routes.json`. | Redefinir el consumidor real del manifest i els adaptadors de head. L’error del script que anuncia 404 a totes les rutes descriu l’antic consumidor i no prova eixe comportament en l’Enxufe actual. `requires_human_decision: false`. |
| S5 | P1 abans d’activar · polítiques d’indexació | `publicSeoRoute('gestoria/factures')`, `admin`, `consola`, `utilitats` i `control-xat` tornen `true`. El hook exclou les quatre darreres però tampoc Gestoria. `public/sitemap.xml` inclou `/registre` malgrat el noindex del client. | Política compartida, preferiblement llista explícita de rutes públiques, aplicada a HTML/headers, generador i client. Gestoria fora de sitemap, RAG i OG de dades. Noindex no substituïx autenticació. No s’ha demostrat una filtració de factures. `requires_human_decision: false`. |
| S6 | P2 · `seoHead.js:8–12,39–53` | En registrar una imatge JPG específica de producte es conserven `og:image:width=1200`, `height=630` i l’alt del logotip inicial. La reproducció amb JSDOM ho confirma. | Tractar imatge, alt, dimensions i MIME com un conjunt; conservar el conjunt base només quan la imatge siga la base, o eliminar dimensions desconegudes. Incloure restauració al desmuntatge. `requires_human_decision: false`. |
| G1 | P1 abans d’activar · pla §3 | Cinc dominis al relat inclouen Comptabilitat; `enabled_domains` l’omet i introduïx email com a domini. No hi ha quinze declaracions reals, executors ni permisos. | Ratificar una taxonomia i un registre únic d’eines; email com a canal transversal. El catàleg del §4 és una proposta, no una reconstrucció dels informes NotebookLM absents d’Activitat en curs. `requires_human_decision: true`. |
| G2 | P1 abans d’activar · Wiki/HITL | Un text «aprovat», un rebut documental o un booleà al navegador no són autorització d’execució. No hi ha endpoint d’aprovació ni registre durable d’execucions per a estes eines. | Implementar doble aprovació: versió del tractor i operació concreta, validada per l’executor, amb caducitat i revocació. `requires_human_decision: false` per al requisit; aprovació real obligatòria en activar. |
| G3 | P1 abans d’activar · dades locals | El pla suggereix Gemini i un orquestrador general; el prompt actiu de Claude prohibix pujar dades de facturació al núvol. Una crida al model també és una eixida de dades. | Port local separat, OCR/càlcul local o model local; cap contingut personal al prompt remot, telemetria, Wiki pública o adaptador Supabase. `requires_human_decision: false`: el disseny ha de respectar la prohibició. |
| G4 | P2 · governança | Segell de skills invàlid abans de qualsevol canvi propi a skills: hash actual `37230667…`, registrat `7d5aa68f…`. | Reconciliació revisada per l’orquestradora; no resegellar automàticament per fer passar l’auditoria. Afecta el relleu a ESTAT/LEDGER i el tancament formal. `requires_human_decision: false` per al diagnòstic. |

### 3. Decisió de Quiz i cascada visual

**Opció principal:** una secció React carregada sota demanda, amb motor de repàs pur i contingut declaratiu versionat. Proposta de peces futures: `GestoriaSection`, `LearningPanel`, `reviewScheduler`, `learningPort` i adaptador local. Són noms de disseny, encara no fitxers creats.

El motor rep dades i un rellotge injectat, i retorna el següent repàs; no toca DOM, xarxa ni rellotge global. El registre de cada targeta inclou `deckId`, `cardId`, `contentVersion`, `dueAt`, `lastReviewedAt`, `interval`, `repetitions` i `lapses`. El progrés pertany al workspace i a la persona, amb hora UTC i presentació en Europe/Madrid. Cal provar el canvi d’hora, el canvi de versió del contingut i respostes repetides.

Per a la primera versió recomane un repàs Leitner senzill, explicat a l’usuari, amb intervals configurats i proves deterministes; no anomenar-lo «Anki» si no s’ha implementat el seu algoritme. FSRS es pot valorar després amb dades de retenció. No es prescriu cap dependència nova.

La cascada proposada és: **concepte → imatge/mnemotècnia → record sense pista → explicació de la resposta → repàs programat**. El codi fonètic es desa amb idioma i versió, i la persona pot corregir les associacions. Estes cinc fases són una proposta d’integració: el document original dels mapes no està adjunt al context actiu i no n’atribuïsc detalls inventats. El Quiz usa exemples ficticis; aprovar una resposta d’aprenentatge mai aprova una factura ni un tractor.

**Navegació:** usar `useNavigate` i el router de l’app, sense segon `BrowserRouter`, `window.location` o `history.pushState` dins del Quiz. En WordPress, conservar `MemoryRouter` i `rutaInicial` del contracte de l’amfitrió. No afegir una ruta privada a `SECTIONS` sense corregir abans S5. La URL de treball no ha de portar NIF, noms de clients ni identificadors de fitxers personals.

**Quan convé un iframe:** només per conservar un HTML/JS autònom que encara no s’ha portat a components. Ha d’estar en un origen aïllat i sense dades personals, amb `sandbox="allow-scripts"`, `title`, `referrerPolicy="no-referrer"` i una CSP restrictiva per al document fill. No autoritzar formularis, finestres emergents, navegació superior ni xarxa per defecte. Un sandbox no bloqueja per si sol tota comunicació de xarxa. MDN advertix de la combinació `allow-scripts` + `allow-same-origin` amb contingut del mateix origen. [Documentació d’iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).

Si cal comunicació, usar un `MessageChannel` creat pel pare i vinculat a eixa instància, amb missatges versionats i límits. Validar `event.source` i esquema; amb origen opac, `origin === 'null'` no identifica de manera única el fill. Només passar inici de lliçó i resultat pedagògic, mai autoritzacions, tokens, factures o accés a eines. Tancar ports, listeners i temporitzadors al desmuntatge.

**UI/UX:** «Aprendre» dins de Gestoria, una pregunta cada vegada, text alternatiu de les imatges, focus restaurat, funcionament complet amb teclat, botons amb text, moviment reduït i feedback que no depenga només del color. El progrés és opcional i local. Per a mantindre-ho d’ací a sis mesos, contingut, algoritme i vista han de tindre versions i contractes separats.

Alternatives descartades: injectar scripts en l’HTML sanejat de la Wiki, perquè trenca la frontera d’execució; crear un microfrontend amb router i dependències duplicats, perquè no aporta valor al primer Quiz.

### 4. Quinze empleats: catàleg proposat i contracte tècnic

No equivalen a quinze processos autònoms ni a quinze URLs públiques. Són quinze capacitats agrupades en cinc dominis. Un únic registre versionat descriu les eines; l’orquestrador només rep les del domini, rol i workspace autoritzats. Cada executor té una correspondència explícita amb un `toolId`; mai es deduïx una ordre de shell del nom o del text generat.

| Domini | Capacitat proposada | Entrades mínimes | Resultat abans d’aprovar |
|---|---|---|---|
| Comptabilitat | `extreu_factures` | referències locals, esquema d’extracció | camps, confiança i font per cel·la |
| Comptabilitat | `detecta_factures_absents` | període, inventari, referències de correu autoritzades | candidats i cobertura de la revisió |
| Comptabilitat | `proposa_resum_trimestral` | workspace, any, trimestre | esborrany d’ingressos/despeses i incidències |
| Màrqueting | `proposa_calendari_editorial` | període, canals, objectius públics | calendari sense publicar |
| Màrqueting | `redacta_publicacio` | brief, canal, llengua | text i mitjans proposats |
| Màrqueting | `resumeix_campanya` | fonts i mètriques autoritzades | informe amb procedència |
| Vendes | `classifica_oportunitats` | referències de contactes i criteris | priorització explicada |
| Vendes | `proposa_pressupost` | línies, imports, moneda, destinatari | pressupost revisable |
| Vendes | `redacta_seguiment` | oportunitat, canal, llengua | esborrany del missatge |
| Atenció al client | `classifica_consulta` | consulta, categories | categoria i confiança |
| Atenció al client | `proposa_resposta` | consulta, fonts de coneixement | resposta amb fonts |
| Atenció al client | `proposa_escalat` | consulta, equip, motiu | tasca pendent de validació |
| Operacions | `proposa_tasques` | objectiu i recursos | tasques amb responsables suggerits |
| Operacions | `proposa_agenda` | disponibilitat, zona horària | proposta sense invitacions |
| Operacions | `revisa_inventari_documental` | col·lecció autoritzada | duplicats i absències; cap esborrat |

Esta divisió restaura Comptabilitat i tracta email com un canal. El Mestre i MarIA han de ratificar si correspon als quinze empleats dels informes originals. No cal executar-los tots per començar: primer extracció, detecció d’absències i resum trimestral amb dades fictícies.

Contracte intern representatiu; no és encara un arxiu instal·lat ni el format directe d’un proveïdor:

```json
{
  "schemaVersion": "sdp.tool.v1",
  "id": "proposa_resum_trimestral",
  "version": "1.0.0",
  "domain": "comptabilitat",
  "description": "Prepara un resum trimestral local amb incidències revisables.",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["workspaceId", "any", "trimestre"],
    "properties": {
      "workspaceId": { "type": "string", "minLength": 1, "maxLength": 80 },
      "any": { "type": "integer", "minimum": 2000, "maximum": 2100 },
      "trimestre": { "type": "integer", "enum": [1, 2, 3, 4] }
    }
  },
  "outputSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["proposalId", "revision", "issuesCount", "coverage"],
    "properties": {
      "proposalId": { "type": "string", "minLength": 1 },
      "revision": { "type": "integer", "minimum": 1 },
      "issuesCount": { "type": "integer", "minimum": 0 },
      "coverage": { "type": "string", "enum": ["partial", "complete_for_selected_sources"] }
    }
  },
  "policy": {
    "executionTarget": "local",
    "dataClass": "personal",
    "network": "denied",
    "effects": ["proposal.create"],
    "requiresWorkflowApproval": true,
    "requiresActionApproval": true
  }
}
```

El validador comprova entrada i eixida en l’executor. Els camps `policy` no són permisos que el model puga modificar. `workspaceId` és opac i queda contrastat amb la sessió autenticada; no accepta una ruta del disc enviada pel model. Els límits de temps, passos, cost i volum es configuren per eina; una capacitat absent produïx un error tipat, mai un fallback silenciós a Supabase.

Un adaptador del model convertix `inputSchema` al subconjunt admés pel proveïdor, sense moure el registre d’autoritat. La documentació de Gemini separa les declaracions i arguments de funció de la lògica que executa l’aplicació; això encaixa amb conservar les validacions fora del model. [Function calling de Gemini](https://ai.google.dev/gemini-api/docs/function-calling).

**Enxufabilitat:** `GestoriaUI → gestoriaPort → executor local`. Per als dominis que puguen usar serveis remots autoritzats, un adaptador distint implementarà el contracte de Sollutia. La UI rep DTO neutres i errors com `CAPABILITY_UNAVAILABLE`, `APPROVAL_REQUIRED`, `STALE_PROPOSAL` o `RESULT_UNKNOWN`. La disponibilitat de Sollutia es negocia per capacitats i versió; encara no hi ha endpoints lliurats en este context i no se’n poden certificar URL, autenticació, límits ni semàntica.

La reutilització del patró `backendPort` no implica posar factures al backend públic. Per a Gestoria personal, la frontera local és un requisit del producte. Ni un iframe ni un Shadow DOM fan segur compartir l’origen i els processos de la web pública amb dades fiscals.

### 5. HITL: de la Wiki a l’executor

Hi ha dos actes diferents que la UI ha d’explicar clarament:

1. **Aprovar el tractor:** llegir finalitat, versió, passos, carpetes/dades accessibles, xarxa, efectes, límits i desconnexió. Aprovar eixa versió concreta del flux, el codi i els esquemes. Una actualització que canvia permisos o efectes invalida l’aprovació anterior.
2. **Aprovar l’operació:** revisar el resultat exacte abans d’exportar, enviar, publicar o modificar dades. Aprovar el contingut, destinataris, adjunts, imports i destinació reals de la proposta.

Flux del tractor: `esborrany → pendent → aprovat → revocat/caducat`; qualsevol canvi material torna a `pendent`. Flux de l’operació: `proposta → en revisió → aprovada → executant → completada`, amb `rebutjada`, `fallida` i `resultat desconegut` com a estats explícits. Una resposta de xarxa perduda no autoritza un segon enviament.

**Interfície proposada:** categoria «Tractors» dins de la Wiki privada/local, amb llista d’estats i detall llegible. El document Markdown és documentació sanejada; el component React d’aprovació és una peça separada que usa un port amb autoritat. Reutilitzar la composició de `UniversalWorkspace` i components universals, sense enganxar scripts al Markdown ni convertir el document públic en un magatzem de permisos.

Cada fitxa mostra què llegirà, què escriurà, què eixirà de l’ordinador, la versió revisada i les incidències. Accions: «Aprovar esta versió», «Rebutjar» i «Revocar». En les propostes: «Editar», «Aprovar i executar» i «Rebutjar». L’edició crea una revisió nova i deixa sense efecte l’aprovació anterior. Un clic doble queda protegit tant a la UI com a l’executor. Sense connexió al registre d’autoritat, no es mostra una aprovació fictícia.

L’executor, no el navegador, autentica la persona i comprova rol, workspace, hash del flux, versió, hash de la proposta, fonts seleccionades, efectes, caducitat i revocació immediatament abans de consumir l’aprovació. L’autorització d’un sol ús i la reserva de l’execució s’han de fer atòmicament. L’idempotency key identifica la mateixa operació en reintents; les fallades amb resultat incert es concilien abans de repetir.

El registre conserva qui ha aprovat, quan, quina revisió i què s’ha executat. Per a Gestoria, queda en l’espai local amb retenció explícita; la telemetria pública només pot contindre mètriques agregades sense documents ni identificadors personals. Els rebuts documentals existents continuen acreditant entrega, no permís d’acció.

El pont local de producció necessita autenticació, vinculació al workspace, comprovació d’origen/Host, protecció CSRF i abast de carpetes. Estar en `localhost` no és suficient. No s’ha d’usar el servidor Vite o el seu GET de Consola com a executor definitiu.

### 6. Frontera de dades i full de Gestoria

Este apartat resol la intersecció amb el prompt actiu de Claude; no afirma haver generat el full ni processat cap factura.

- Selecció humana de carpeta o fitxers, referències confinades i lectura mínima. No importar `_gestoria_de_poble` des de Vite, afegir-la a `public`, copiar-la al repositori ni enviar-la al model remot. Un selector explícit és una opció inicial; no s’ha de suposar suport universal d’accés permanent al sistema de fitxers del navegador.
- Els components compartits poden reutilitzar-se, però el procés local de Gestoria no ha de carregar analítica o serveis de la web pública. En desconnectar: tancar subscripcions i handles, buidar memòria i revocar accés. «Sense rastre» no pot significar esborrar originals, exports o rebuts sense ordre; la retenció s’explica a la UI.
- La conciliació és un informe de cobertura: període, carpetes, bústies i fonts realment consultades. Un proveïdor habitual absent és un indici; no prova que falte una factura. Sense accés al correu, mostrar «correu no revisat», mai «complet».
- El full conserva exactament `Data, Núm, Client/Proveïdor, NIF - CIF, Descripció, Subtotal, IVA, Total`, separant ingressos i despeses. Imports com a decimal exacte o cèntims; mantindre identificadors com a text. La definició d’IVA com a import i el tractament de múltiples tipus, retencions o rectificatives necessiten el model de la gestoria; no inventar càlculs per completar huit columnes.
- Incidències i proves de procedència van en un annex local, sense afegir columnes al model exigit. Evitar fórmules actives injectades en cel·les de text. Exportar és una acció concreta revisable; enviar el full és una autorització distinta.

### 7. SEO: solució per domini i URL

**Millora local feta:** a `index.html` s’ha alineat `description` amb la descripció social existent i afegit `og:site_name` i `og:locale=ca_ES`. Es conserva la imatge existent de 1200×630, inspeccionada visualment. No s’han canviat rutes, adaptadors, publicació, WordPress ni el head de l’amfitrió. No s’ha afegit un canonical global de portada a totes les rutes: `vercel.json` té un fallback general a `index.html` i això faria col·lapsar la identitat de les URL.

**Pas prioritari per a socdepoble.org:** el lloc desplegat és diferent del build local. La mateixa URL d’imatge retorna HTML de la portada. Cal publicar els actius correctes i servir un head inicial per URL, ja siga prerenderitzat per a pàgines estàtiques o generat per l’amfitrió per a contingut públic dinàmic. La SPA pot continuar sent client pur; este adaptador d’HTML és responsabilitat d’allotjament i pot existir a Sollutia, WordPress o un host estàtic. No necessita afegir lògica de negoci del proveïdor a React.

Per a pàgines de contingut, proposar un DTO públic `PublicPageMetadata` amb URL canònica absoluta, títol, descripció, tipus OG, locale i un objecte d’imatge amb URL, alt, dimensions i MIME verificats. El servidor resol primer si el contingut és públic i existent; un element privat o absent no produïx metadades personals i un inexistent torna 404. Els bots i els usuaris reben la mateixa representació inicial; no cal cloaking per user-agent.

El conjunt base d’OpenGraph requerix `og:title`, `og:type`, `og:image` i `og:url`; la URL representa la identitat canònica. Descripció, nom del lloc, locale i propietats d’imatge completen la targeta. Les propietats estructurades corresponen a la imatge que les precedix. [Especificació Open Graph](https://ogp.me/).

**Pas prioritari per a gentdelatorre.net:** el head actual ja pertany a Yoast. Configurar la portada i conservar un únic emissor. La seua API permet adaptar OpenGraph sense duplicar etiquetes des de l’Enxufe. [API OpenGraph de Yoast](https://developer.yoast.com/features/opengraph/api/).

Proposta editorial per revisar: títol «Gent de la Torre · Sóc de Poble»; descripció «La comunitat de la Torre de les Maçanes: notícies, agenda i vida del poble, connectada amb Sóc de Poble.»; canonical i `og:url` de la portada de Gent de la Torre. La creativitat ha d’identificar Gent de la Torre amb Sóc de Poble com a xarxa; no he fabricat ni publicat una marca nova. Es recomana PNG/JPEG de 1200×630 com a format de treball i comprovació real del retall en cada client, sense prometre una mida de targeta obligatòria.

**Enllaços interns de WordPress:** `/mur` retorna 404 al domini Gent de la Torre en este tall. El mode en memòria de l’app no crea pàgines HTTP automàticament. Abans d’oferir URL compartibles de contingut intern, acordar rutes de l’amfitrió o pàgines públiques de compartició que resolguen al mateix contingut i a la mateixa URL canònica. No declarar totes les URL internes com a existents perquè React les navegue en memòria.

**Sitemap:** el local inclou `/registre`; el de producció de socdepoble.org inclou `/login`, `/register` i rutes antigues com `/market` i `/map`. Eixa divergència reforça S1. Cal regenerar-lo a partir del contracte de rutes públiques real, amb `lastmod` de canvi de contingut, no la data de cada build. El sitemap de Gent de la Torre és un índex de Yoast amb tres sitemaps; no s’ha auditat cadascun dels seus articles.

**Tres vies de fallada a protegir:** una imatge absent que rep fallback HTML; metadades duplicades o d’un altre domini; una ruta privada afegida al catàleg que es publica per defecte. Afegir-les a la verificació de release és més útil que un validador que sols busque l’existència d’`og:image`.

### 8. Ordre d’execució recomanat i criteris d’acceptació

| Fase | Acció i responsable proposat | Evidència per donar-la per acabada |
|---|---|---|
| A | MarIA consolida el pla i el catàleg amb esta auditoria i la de Claude quan estiga activa | Un estat d’aprovació coherent; quinze eines definides; dades locals i publicables separades explícitament |
| B | Responsable dels dominis resol S1–S3 i sitemap | GET de portada i imatge amb MIME correcte; un sol conjunt de metadades; prova de preview real |
| C | Implementació compartida de política de publicació i contracte SEO | Privades i absents denegades; canonical per URL; proves del fallback d’actius i de canvi d’imatge |
| D | Claude implementa registre local/HITL i primeres tres eines de Comptabilitat | Cap execució abans de l’aprovació al frontend; versió revocada/caducada denegada també per crida directa |
| E | Integració del Quiz | Navegació amb base i memòria, desmuntatge net, focus/teclat, rellotge i canvi de contingut verificats |
| F | Canari amb dades fictícies i adaptador Sollutia quan arribe | Mateixos contractes amb backend absent i present; zero eixida de dades personals; desconnexió i reintents segurs |

Les proves d’HITL han d’incloure: botó sense backend, canvi del destinatari després d’aprovar, dues pestanyes executant la mateixa proposta, revocació abans del consum, timeout amb resultat desconegut, intent de llegir fora de carpeta i instruccions malicioses dins d’un correu. Estes últimes són dades no fiables; no poden canviar permisos ni les eines disponibles.

Per SEO cal comprovar l’HTML cru sense JavaScript amb navegador normal, WhatsApp i TelegramBot, imatge final accessible sense cookies, type correcte, redireccions, una ruta pública de detall, una privada i una inexistent. La prova de client de missatgeria continua necessària: `curl` amb user-agent és una aproximació, no el crawler real ni la seua memòria cau. Telegram exposa un mecanisme específic de previsualització d’URL; esta auditoria no l’ha executat amb una sessió d’usuari. [API de previews de Telegram](https://core.telegram.org/method/messages.getWebPagePreview).

### 9. Consens i Proposta d’Automillora

Al tall de redacció, Activitat en curs conté el pla i els dos prompts de les 00:45, més esta auditoria. S’ha llegit complet el prompt de Claude per incorporar la prohibició de dades al núvol i el seu carril d’implementació. No hi ha encara un informe actiu de Claude que acredite consens, i no se n’atribuïx aprovació. Les decisions noves i la implantació crítica queden preparades perquè MarIA les consolide.

Durant la comprovació de tancament s’ha detectat una actualització concurrent del pla, incorporada al commit `1f79cb739`: afegix els dos defectes S5 i S6 a «Correccions prèvies a l’activació». S’ha rellegit el pla complet i tornat a vincular-ne el hash `b1840bcf84ec0fed1a566d56605d8c0ab5f348bbe0d44a35c8e33b975566c7e2`. El codi comprovat no ha canviat. Hi ha adopció documental d’estes dues troballes, però no encara consens complet ni reparació acreditada. Precise la frase «noindex o barrera d’autenticació SEO» del pla: **noindex regula indexació; autenticació i autorització regulen accés. Calen controls d’accés reals i exclusió de dades privades de les representacions públiques**, no alternatives entre si.

Millores concretes per a `prompt_local` i el pla:

1. Substituir «qualsevol altre document present» per «els documents enumerats a Activitat en curs, més les fonts canòniques obligatòries». La redacció actual contradiu l’ordre de no consumir arxiu i pot arrossegar el laboratori permanent.
2. Afegir un manifest explícit de les fonts originals dels quinze empleats i de l’aprenentatge visual. Un resum de NotebookLM no fixa noms, permisos ni esquemes.
3. Separar en la petició «auditar», «preparar pegat local», «activar tractor» i «publicar». Indicar responsable dels fitxers compartits i el lloc on es ratifica el consens; evitar que Claude i Codex modifiquen SEO alhora.
4. Unificar l’estat d’aprovació del pla amb el registre; distingir aprovació documental de la futura aprovació operativa del tractor.
5. Incloure la restricció de dades locals al pla comú i als dos prompts. És una condició arquitectònica, no un detall del carril de Claude.
6. Substituir «SEO perfecte» i «sense el més mínim problema» per la matriu de proves HTTP, fitxers, canari i previews. La cache d’un tercer no es pot garantir des del repositori.
7. No donar per existent React Router ni l’antic `inc/sdp-seo.php`. El prompt ha de demanar verificar router, consumidor del manifest i qui governa el head de cada domini.
8. Fer que el generador documental ancore directament els informes nous a Activitat en curs; actualment els afegix al final. L’agent ha hagut de corregir l’àncora d’este informe.

Si haguera rebut primer els quinze contractes originals, la frontera local al pla comú i una matriu «domini → desplegament → propietari del head», l’anàlisi hauria pogut concentrar-se en contractes concrets i no en reconstruir eixes dependències.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Resultats executats

| Comprovació | Resultat |
|---|---|
| Porta Olivera inicial | Exit 0: tres documents actius, safata buida; cap arxivat necessari |
| Existència dels tres nous fitxers del pla | Tots tres absents al tall de lectura |
| `npx vitest run` de SEO, política de router, embed i Control | 5 fitxers, 166 proves, totes passen |
| `npm run build:web` | Exit 0; 2380 mòduls; avisos de chunks grans i imports estàtics/dinàmics |
| HTML compilat | Una etiqueta per a cada camp comprovat: títol OG, descripció, lloc, locale, imatge i dimensions |
| Imatge compilada i local | PNG real, 1200×630; inspecció visual completada |
| Reproducció adversarial d’imatge dinàmica | Falla de coherència confirmada: JPG específic amb dimensions i alt del logotip |
| Reproducció de política pública | Gestoria, admin, consola, utilitats i control-xat admeses pel generador; notes i registre denegades |
| `build-seo-manifest.mjs --verifica` | Exit 1: falta el manifest. El consumidor PHP referenciat tampoc existix |
| HTTP públic sense credencials | S1–S3 confirmades; `/mur` de Gent de la Torre torna 404 |
| `segella.mjs` | Exit 1: ruptura preexistent de segell de skills |

Comanda reproduïble de les proves dirigides:

```sh
npx vitest run src/hooks/seoHead.test.js src/hooks/useSEO.test.jsx src/app/contexts/politicaRouter.test.js src/app/contexts/RouterContext.embed.test.jsx src/sections/control/ControlSection.test.jsx
```

Empremtes de l’evidència HTTP recollida:

- Portada de socdepoble.org, `/mur` amb user-agent WhatsApp i GET de la suposada imatge: `6cadbaa5c08a572e35f07e2d29e8f2a1d6cf1d0b4b8c6a698fa518a76a479918`.
- Portada de Gent de la Torre amb TelegramBot: `73af9f0202f114911d5d5a3b3e7c1b749c77bd8870acad23bb4d67f957ea8da4`.

Les respostes HTTP temporals estan en `/tmp/sdp-seo-*`; este informe conserva les conclusions, MIME, mides i hashes per no dependre de la seua retenció. No contenen factures ni sessions autenticades. No s’han afegit dependències, accedit a correus, enviat missatges, fet commits o publicat builds.

### Tancament documental

`document.mjs check`: `valid: true`, zero errors. Porta Olivera final: exit 0, quatre documents vius declarats i safata buida. `git diff --check`: exit 0. L’informe es lliura sense donar per verd tot el repositori.

Primera passada de `tancament.mjs --check --turn-id torn_fdf225c6-3ec9-46aa-9564-b96a4b52fddf`: `valid: false`, estat `planned`, 134 incidències. Plantilles, autoritat, signatura del ledger, catàleg de skills i compilador Wiki passen; segell i SCC fallen. El detall és: canvi concurrent del pla (1, resolt rellegint-lo i vinculant-lo de nou), relleus propis d’ESTAT/LEDGER absents (2), segell trencat (1), àncores absents en zones persistents de l’Escriptori (121), enllaços invàlids (8) i orfe operatiu (1). No s’han netejat ni consumit les carpetes protegides per convertir eixe resultat en verd.

Segona passada, amb el pla ja revinculat: `valid: false`, estat `planned`, 134 incidències; desapareix l’error del pla. Persistixen les dues anotacions de relleu, el segell i les 130 incidències SCC; s’afig «Canvis de codi fora de l’abast documental» per un canvi detectat en `src/data/wikiManifest.js`, que no he editat. L’observació final veu també HEAD `2aac7f978`, amb una actualització del full de ruta. No es revertix treball concurrent i els resultats de proves es mantenen vinculats al tall inspeccionat, sense certificar eixe manifest posterior. El torn no s’ha forçat a `closed`.

El relleu formal a `.agents/ESTAT.md` i `.agents/LEDGER.md` està condicionat pel segell trencat: la lectura d’`executor-mutacio.mjs` confirma que rebutja qualsevol mutació amb «Segell previ invàlid; reconciliació explícita requerida» abans de reclamar autorització. No s’ha invocat per forçar una operació que ja sabem que denegaria. No es relaxa esta comprovació ni es reconcilia una superfície aliena dins d’una auditoria SEO.

Text de relleu preparat per a l’orquestradora: «2026-10-02 · Codex · torn_fdf225c6-3ec9-46aa-9564-b96a4b52fddf. Auditoria 261002_0102_auditoria_codex: disseny de Quiz/HITL i quinze capacitats proposades; tres metadades locals millorades; producció amb OG absent/incomplet i imatge que retorna HTML; 166/166 proves i build web correctes. Activació dels tractors, dades reals, publicació i consens encara no acreditats. Reconciliar segell abans de registrar el relleu protegit i tancar formalment.»

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s’ha auditat el contingut privat de `_gestoria_de_poble`, el correu ni els originals dels dos informes NotebookLM, que no estan en la llista activa. La matriu de quinze capacitats és una proposta explícita. No hi ha proves d’extrem a extrem amb els endpoints de Sollutia perquè no s’han proporcionat.

La millora d’`index.html` és local i limitada; **les targetes socials en producció continuen pendents de correcció i publicació**. No s’ha simulat una certificació de WhatsApp/Telegram amb simples user-agents. No s’ha modificat el WordPress públic ni se’n disposa ací d’una prova d’administració autenticada.

La skill vigent [wiki-documentacio-i-reflex](../../.agents/skills/wiki-documentacio-i-reflex/SKILL.md) exigix que l’usuari puga «APROVAR explícitament aquest flux des de la interfície de la pàgina web [...] abans que el tractor siga efectiu o executi res». Per això les propostes d’este informe no activen cap automatisme. La restricció de codi crític fins a estabilitzar el pla també ve del prompt humà d’este torn; el canvi estàtic menor no altera eixos circuits.

El protocol de governança [PROTOCOL_PETORRETA](../../.agents/PROTOCOL_PETORRETA.md), P-14, requerix reconciliació revisada d’un segell previ trencat. Esta limitació impedix acreditar un tancament formal verd i deixa el relleu protegit preparat en este informe. No és una falta d’autorització de l’usuari per a l’auditoria ni una petició de repetir-la.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261002_0045_pla_implementacio_gestoria]]
- [[261002_0045_prompt_codex]]
- [[261002_0045_prompt_claude]]
- [Metadades locals](../../index.html)
- [Gestió del head](../../src/hooks/seoHead.js)
- [Port de dades](../../src/data/backendPort.js)
- [Router de l’app](../../src/app/contexts/RouterContext.jsx)
