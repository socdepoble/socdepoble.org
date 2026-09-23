---
type: informe
status: esborrany
description: Auditoria de la Wiki integrada, el sistema atòmic i la connexió executable dels protocols dels agents.
tags:
  - auditoria
  - arquitectura
  - codex
---
# Auditoria de la Wiki integrada i del control operatiu

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CODEX-260921-2354 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; arbre de treball amb modificacions prèvies |
| Creació | 2026-09-21T23:54:03+02:00 |
| Modificació | 2026-09-21T23:54:03+02:00 |
| Propietari | Agents Locals — Codex |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

El nom usa `auditoria` tal com exigeix el Mestre; el frontmatter usa `type: informe`, admés per `tooling/wiki/schema.json` (l'enum no admet `type: auditoria`). S'han llegit íntegrament `prompt_local.md`, el router `protocolledge.json`, el protocol `auditoria_canonica.md` i les skills de workflow, cicle de vida, documentació/reflex, UniversalPage i cerca de skills abans de redactar.

## Dictamen

**No: la Wiki i Disseny integrats no permeten, per si sols, el control total de l'aplicació.** Permeten consultar coneixement i exemples. Encara falta un contracte verificable entre aquest coneixement, les eines disponibles a l'agent, el codi executor i el cicle de vida. Un navegador amb documentació no adquireix permisos de disc, desplegament o base de dades per llegir-la. L'objectiu viable és autonomia operativa delimitada i comprovable.

La sospita del Mestre és parcialment correcta: **les skills sí que estan dins del manifest web**; els motors `.mjs` i la seua invocació no hi estan connectats com a capacitats executables. A més, hi ha enllaços que fallen, regles contradictòries i portes que no comproven allò que els manuals prometen.

## 1. Abast i Reunió a l'Olivera

S'han inspeccionat les rutes de l'app, compiladors Wiki/app i Wiki/context, manifest generat complet mitjançant comprovacions mecàniques, renderitzador Wiki, Disseny, UniversalPage, PageFrame, ContentProvider, accions d'UniversalCard, protocols i scripts d'obertura, Reflex, tancament i Somiador. No s'ha fet una lectura semàntica exhaustiva de cada document de la Wiki, ni una prova visual en navegador, ni una auditoria de permisos del backend desplegat. Les conclusions de control total no pressuposen aquesta cobertura.

A l'escriptori, en començar, només hi havia el prompt `260921_2250_prompt_wiki_integrada.md`, l'índex i les carpetes de suport. **No hi havia cap auditoria anterior ni Pla d'Implementació d'aquest cicle** per contrastar. L'ESTAT conté conclusions antigues de Claude; són antecedents, no evidència actual. Les afirmacions d'aquest document s'han contrastat amb el codi viu. No s'han recuperat automàticament còpies antigues del cervell per convertir-les en autoritat.

## 2. Troballes reproduïbles

P1 significa bloquejador de l'autonomia o risc funcional rellevant; P2, incoherència amb impacte limitat. Les rutes són relatives a `socdepoble.org/`. La font normativa principal és AGENTS.md, subordinada a la petició actual.

| ID | Severitat i evidència | Conflicte i proposta |
| --- | --- | --- |
| A1 | **P1.** `tooling/wiki/compile-wiki-to-app.mjs` només incorpora `.md`; cada item té id, title, subtitle, categoryId, tags, attributes i content. No conserva sourcePath, hash, entrypoint ni contracte executable. | La promesa de cervell executable no es compleix. Afegir un registre de capacitats i procedència; separar lectura i execució. |
| A2 | **P1.** El manifest inicial conté **128 documents i 16 skills**, però **130 ocurrències d'enllaços `?item=` sense ID exacte** i un ID duplicat: `00_index_identitat`. `processWikiLinks` conserva directoris al target i elimina fragments; els IDs són basenames. El detall selecciona amb `.find(i => i.id === activeItemId)`. | El graf no és navegable amb garanties. IDs estables, resolució relativa al fitxer d'origen, àlies verificats i fragments preservats. Les 130 són ocurrències, no 130 documents diferents. |
| A3 | **P1.** `.agents/hooks.json` declara eines `write_to_file`, `replace_file_content`, `multi_replace_file_content`; no descriu totes les vies d'escriptura d'aquesta sessió. `porta-reflex.mjs` retorna 0 amb JSON malformat i amb `type: auditoria`; només busca la cadena `reflex:` per a prompt/informe/acta. | Declarar un hook no prova que el host l'execute. Cal adaptar-lo al host real i validar payload, ruta, plantilla i rebut. Una cadena escrita per l'agent no prova lectura ni comprensió. |
| A4 | **P1.** `node tooling/gates/obrir_torn.mjs --json` retorna 0 però imprimeix text humà, sense JSON ni turn_id. El script no implementa el recompte de 150 artefactes que li atribueix la skill. `tancament.mjs` només interpreta `--json`, no `--turn-id`; retorna `valid`, mentre la skill espera `ok`. | Contractes incompatibles amb `wiki-cicle-de-vida`. Unificar o versionar esquema d'obertura/tancament i validar identitat real del torn. |
| A5 | **P1.** `wiki-cicle-de-vida/SKILL.md` ordena al §4.5 esborrar soroll i buidar l'escriptori; altres apartats permeten conservar revisions. AGENTS.md §§5 i 12 prohibeix l'esborrat destructiu sense permís i protegeix treball viu. `somiador.mjs` mou tots els fitxers elegibles per nom/mida, sense consultar revisió pendent. | El protocol pot fer desaparèixer el material de l'Olivera. Una política única amb estats i retenció. Aquesta auditoria es conserva expressament a l'escriptori. |
| A6 | **P2.** `UniversalPage.jsx` i `PedraSeca/organismes/UniversalCard.jsx` comparteixen `ActionControl`, però defineixen separadament els handlers i la visibilitat de Connectar/Comentar. `ContentProvider` existeix; UniversalPage calcula onConnect des de props, no des de config. | L'àtom visual ja existeix; falta unificar la semàntica. Extreure política i accions de contingut comunes. |
| A7 | **P2.** `WikiDePobleSection.jsx` inventa `new Date()` si falta data documental i imprimeix sempre el domini `_wiki_de_poble`, també per documents de `.agents`. `DesignSection.jsx` fixa `2026-09-19T12:00:00Z` i `onConnect={false}`. | La metadata no reflecteix necessàriament la font. Normalitzar dades reals i mostrar absència explícita, sense simular data de publicació. |
| A8 | **P1.** `WikiDePobleSection.jsx` usa un parser de regex i `dangerouslySetInnerHTML` sense sanitització local. El compilador recorre també `.agents` i no filtra `visibility: private`; inclou GENOMA, ESTAT i LEDGER si compleixen els filtres actuals. | La publicació necessita frontera explícita. Parser estructurat segur, política d'URLs i llista permesa de documents públics. No s'ha demostrat una explotació ni una filtració concreta de secrets en producció. |
| A9 | **P2.** L'Explorador del Cervell és contingut provisional amb enllaç `#`; el detall busca l'item a `wikiManifest.items`, però `obrir_graf` només s'afegeix al model del workspace. | Ni tan sols té resolució completa com a document seleccionable. Implementar un graf sobre IDs validats, separat de la capacitat d'executar. |
| A10 | **P1.** `verificador-scc.mjs` usa rutes amb majúscules antigues; si no llig índex/inbox, omet la comprovació. Recorre Markdown, exclou directoris ocults i no valida obligacions d'ESTAT ni artefactes per turn_id. | El verd SCC no demostra cicle de vida complet. Errors de lectura han de fallar; normalitzar rutes i validar l'inventari real del torn, incloent fitxers no Markdown. |

Altres divergències: `auditoria_canonica.md` continua enumerant pilars antics i diu que tags són deriva, mentre l'esquema vigent els admet. `prompt_local.md` conté el frontmatter de la plantilla i un segon bloc de mostra: el compilador només separa el primer; no és un motor d'execució de plantilles. `package.json` no incorpora `compile-wiki-to-app` al build; ara l'invoca el tancament, abans de saber si aquest passarà. Això permet snapshots desactualitzats si es construeix sense tancar.

## 3. Sistema atòmic proposat

**Composició de components + context acotat al contingut + política d'accions compartida.** La propagació visual prové de reutilitzar un component únic; el context evita repetir dades comunes. Eliminar totes les props no és l'objectiu: un article encara necessita identitat i dades.

1. Mantindre els àtoms existents `ActionControl`, `IconButton`, `DateTimeControl` i tokens de Pedra Seca.
2. Crear `ContentActions` i `ConnectAction` compartits per la barra de pàgina i el peu de targeta. Una variant de disposició pot adaptar-los a cada superfície sense duplicar la semàntica.
3. Convertir el context actual en un `ContentScope` amb model normalitzat: id estable, tipus, autoria, publishedAt/updatedAt, idioma i estat. El workspace o carregador de ruta el proporciona una vegada; les pàgines no fabriquen botons ni dates.
4. Resoldre `useContentActions()` amb tipus de contingut, sessió i capacitats del backend. La política central determina visibilitat/estat/acció. `design-specimen` pot no admetre connexió; no cal repetir `onConnect={false}` en cada pàgina.
5. Mantindre PageFrame presentacional i la integració amb router/backend en adaptadors. El botó d'acció no ha de conèixer Supabase. La comprovació al client mai substitueix l'autorització del servidor.
6. Disseny ha de renderitzar els components reals com a catàleg; la skill no ha d'ensenyar a copiar JSX de DesignSection com a font de veritat.

Exemple d'API proposada, encara no implementada:

```jsx
<ContentScope value={documentModel}>
  <UniversalPage><ArticleBody /></UniversalPage>
</ContentScope>
```

El provider ha de quedar dins de cada item/editor, no en un singleton mutable compartit entre totes les targetes. Això evita que la selecció d'una nota canvie l'autoria o els handlers d'una altra. La data es formata des d'un instant ISO una vegada; si no existeix, no s'inventa.

Acceptació: canviar ConnectAction una vegada actualitza pàgina, targeta, Wiki i Disseny; els estats autenticat/foraster es resolen igual; dues targetes no comparteixen dades accidentalment; canviar de document no deixa handlers antics; teclat i mòbil continuen funcionant. Una prova d'importacions impedeix noves còpies d'aquestes accions fora del mòdul.

[React documenta Context](https://react.dev/learn/passing-data-deeply-with-context) com a mecanisme per compartir dades entre descendents sense passar-les per cada nivell. L'arquitectura concreta anterior és una proposta per aquest repositori.

## 4. Connectar coneixement, skill i codi

Propose un **registre tipat de capacitats**, amb una sola font editable i vistes generades per web, CLI i agent. No publicar tots els `.mjs` indiscriminadament ni executar ordres copiades d'un article.

Cada capacitat necessita: `id`, `sourcePath`, `sourceHash`, `documentationIds`, `skillPath`, `entrypoint`, esquema d'arguments, lectures requerides, efectes, permisos, verificació i versió. Un exemple conceptual: `session.close` apunta a `tooling/gates/tancament.mjs`; avui no hauria d'anunciar suport de turn_id fins que el script realment el valide.

El graf usa arestes tipades: document **descriu** capacitat; skill **requereix** plantilla; capacitat **executa** script; prova **verifica** capacitat; document **pertany a** categoria i **té etiqueta**. Les rutes relatives són metadades resolubles; els IDs no depenen del basename. CI rebutja destins inexistents, IDs duplicats i hashes caducats.

La web ofereix «Veure procediment», «Veure font» i estat de disponibilitat. L'agent consulta el mateix registre i obté l'eina autoritzada. L'execució passa per un servei local o backend amb llista d'operacions permeses, arguments validats i rebuts. Mai `eval`, shell arbitrari ni permisos derivats de text Wiki. Si el host admet MCP, pot exposar aquestes operacions amb contractes d'entrada/sortida; si no, una CLI estructurada és suficient. La [documentació de tools MCP](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) descriu aquesta superfície d'eines; no aporta automàticament els permisos ni la lògica pròpia del projecte.

## 5. Cas d'ús: la fallada cognitiva en viu

**Fet aportat pel Mestre:** l'agent anterior admet haver redactat sense llegir les skills i haver omés la higiene. No disposem del transcript complet ni dels rebuts d'aquella sessió: no es pot demostrar què hi havia al seu context ni atribuir-ho exclusivament a la migració.

**Mecanisme compatible amb el codi observat:** document visible → cap càrrega garantida al context actiu → cap resolució obligatòria de skill/plantilla → escriptura possible per una eina no interceptada → cap validació fiable de lectura → resposta final sense tancament verificat.

`compile-wiki-to-system-prompt.mjs` genera `.agents/GENOMA.md` i acaba dient que s'injecte com a System Prompt. Escriure el fitxer no fa aquesta injecció. `preflight_matrix_wrapper.mjs` sí que té una peça útil: prepara context i emet `injectSteps`, però requereix payload del host. El seu propi comentari distingeix emissió de recepció/comprensió. Cal conservar aquest rigor: no s'ha provat que el host de la sessió anterior l'invocara.

La solució del «cerebel» és un adaptador d'arrancada per cada host real: identifica repositori i tasca, resol plantilla/skills, lliura context amb versions, registra emissió i espera l'acusament que el host puga demostrar. Abans d'una mutació comprova identitat del torn, recursos vigents i capacitats. Un hash acredita bytes/versió, **no comprensió mental**; la comprensió es contrasta amb resultats i comprovacions semàntiques.

En aquesta sessió s'han obert explícitament els documents requerits. No s'inventa un turn_id que el script no ha emés. Tampoc s'ha afegit un `reflex:` fictici per convertir una cadena en suposada prova de lectura.

## 6. Tractor de cicle de vida

Consolidar els tractors existents en una màquina d'estats persistent:

`obert → context_preparat → treballant → revisio → tancat`

`bloquejat` registra un impediment sense fer passar el torn per tancat. El registre inclou identificador, host, inici/final, fonts i hashes, fitxers atribuïbles al torn, resultats de portes i documents pendents d'altra IA. No atribuir a aquest torn tot el diff Git preexistent.

- **Obertura:** JSON validat, turn_id real i inventari inicial. Cap error de lectura es converteix en absència de problemes.
- **Creació:** classificar l'artefacte i ancorar-lo amb una operació transaccional o recuperable. El registre d'artefactes és la font del cicle; l'índex és una vista humana.
- **Revisió:** cada artefacte rep disposició explícita: conservar pendent, integrar, arxivar reversible o temporal resolt. La decisió protegeix plans i auditories de l'Olivera.
- **Tancament:** exigeix ESTAT actualitzat, ancoratges resolts, temporals propis resolts i comprovacions necessàries. El resultat du `valid`, `turn_id`, motius i evidències. L'arnés impedeix marcar feina completada sense rebut; un hook només de Git no impedeix respostes finals prematures.
- **Neteja:** mode de previsualització, moviments sense sobreescriptura i diari recuperable. Producció humana exclosa de mutacions. Errors deixen estat recuperable; no s'anuncia neteja completa després d'un catch ignorat.

No existeix una garantia universal de compliment per agents que conserven escriptura directa fora del mediador. Per acostar-se al «sempre», les vies reals de mutació i finalització han de passar pel control del host; les instruccions soles no basten.

**Higiene observada avui:** inbox sense fitxers de treball (només `.DS_Store`); prompt viu pendent i aquesta auditoria destinats a l'Olivera. No hi ha motiu per esborrar-los. L'índex no ancora els documents de producció i SCC ho denuncia com a orfandat; s'ha preservat aquesta zona humana. No s'ha executat el Somiador, perquè mou documents pendents sense distingir-los i no és necessari per lliurar aquesta auditoria.

## 7. Verificació i ordre d'implementació

Proves executades sobre el working tree:

- `cataleg_skills.mjs --check`: **ok true**, 16 skills coherents. Això refuta que el catàleg actual estiga completament absent.
- `obrir_torn.mjs --json`: exit 0, cap turn_id ni JSON, tal com s'ha descrit.
- Tres probes de `porta-reflex.mjs` per stdin, sense crear fitxers: JSON malformat → 0; document amb `type: auditoria` sense reflex → 0; `type: prompt` sense reflex → 1. La segona no és un document conforme a l'esquema: demostra que aquesta porta, per si sola, no el valida.
- Comprovació íntegra d'IDs/enllaços del manifest: 128 documents, 16 skills, 1 ID duplicat, 130 ocurrències no resoltes abans d'afegir aquesta auditoria.
- `tancament.mjs --json`: **valid false**, 16 ORPHAN_OPERATIVE previs. Inclou AGENTS.md, CLAUDE.md, INTEGRACIO.md, VEINS.md, índexs/documents Wiki, sis documents de producció, l'acta 1002 i una auditoria de docs. No equival a 16 errors de seguretat ni implica que tots siguen orfes en qualsevol altre resolutor.

El tancament regenera `src/data/wikiManifest.js` com a efecte propi. No s'han modificat manualment components, skills ni scripts. No s'ha executat el build ni es declara validada la UI en navegador.

Ordre proposat: **(1)** corregir contractes i contradiccions de govern; **(2)** adaptar entrada/escriptura/tancament al host real; **(3)** IDs, procedència i registre de capacitats; **(4)** parser/publicació segura i build sincronitzat; **(5)** unificar accions UI; **(6)** graf interactiu sobre el registre ja fiable.

Decisions pendents, `requires_human_decision: true`: quines capacitats poden mutar o desplegar; quina part de `.agents` pot ser pública; política definitiva d'inbox (zero o tolerància 20); criteri de retenció de revisions. La resta de propostes pot convertir-se en un pla concret sense repetir aquest debat.

Dos camins descartats: carregar permanentment tot GENOMA en cada petició (no resol contradiccions ni permisos) i afegir només enllaços al codi dins del Markdown (no resol execució ni garanties). Tres riscos a provar en implementar: context caducat entre lectura i escriptura; contaminació entre continguts UI; arxivament d'un document encara pendent d'un altre agent.

## 8. Relleu

Benefici tècnic: separació demostrada entre publicació, descobriment i execució. Benefici de context: un pla que reutilitza components i tractors existents. Benefici per al Mestre: causes concretes i verificables en lloc d'atribuir els errors a una suposada falta de memòria personal de la IA; no s'infereix cap estat de salut o emocional.

Aquesta auditoria queda pendent de lectura de Claude/MarIA. Per a l'Acta Marmota posterior cal traspassar les decisions i el tancament roig, no una afirmació de sistema net.

**Ancoratge de Seguretat:** [[00_index_escriptori]] | [[00_index]]
