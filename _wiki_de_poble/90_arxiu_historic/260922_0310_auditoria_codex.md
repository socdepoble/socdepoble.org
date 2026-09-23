---
type: informe
status: esborrany
description: 'Contracte documental i torns persistents: integració, proves i límits del tancament global.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_afa18e33-6945-4b77-b28b-0f4b51e82b76:3bc9de82-441c-449e-9713-5b547b0e7307
---
# Integració del Bloc A amb P0 i P1

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_afa18e33-6945-4b77-b28b-0f4b51e82b76:3bc9de82-441c-449e-9713-5b547b0e7307 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T01:10:48.515Z |
| Modificació | 2026-09-22T01:10:48.515Z |
| Propietari | codex |
| Aprovació humana | P0/P1 aprovats explícitament en conversa; informe pendent de revisió |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 b2f519c4eb08bd94fea8fb554476b04d931ce54131b021efc16217caaa4881f7. El rebut acredita entrega, no comprensió.

## Historial

2026-09-22: revisats els documents 0239 de Claude i integrat el Bloc A amb el contracte P0 i els torns P1. Informe generat amb rebut real i ancoratge automàtic. El pla 0240 queda vinculat pel seu hash; l’aprovació posterior en conversa substitueix la menció històrica de pendent en aquell document.

## Troballes

### Integració implementada

- Conservats els hooks natius i els symlinks de skills de Claude. La porta que ensenya continua proposant plantilla, ruta i seccions, però l’autorització documental exigeix un rebut real.
- Contracte compartit en `tooling/documental/core.mjs`: YAML estricte, esquema complet, propietats desconegudes i duplicades rebutjades, 13 rutes explícites, tipus de sortida i seccions obligatòries. Sense ruta per defecte ni enums paral·lels.
- `tooling/documental/turns.mjs`: registres independents per UUID, caducitat, bloqueig per torn i escriptura atòmica. El rebut vincula document, ruta, versió i hash de plantilla. El pla queda fixat per hash. El cicle és opened → context_loaded → planned → verified → closed; consultar no verifica ni tanca.
- La porta reconstrueix el document final dels edits, inclosos tots els chunks compatibles, i valida rutes canòniques i symlinks. Les variants no reconstruïbles fallen amb diagnòstic.
- `porta-documents.mjs` comprova contingut real, índex de Git o diferència de CI. Precommit i CI exigeixen que el registre tancat viatge amb els documents. L’escriptura per shell queda sotmesa a aquesta comprovació final.
- `tancament.mjs --check` és de lectura; `--verify` i `--close` són explícits. El tancament executa catàleg, compilador estricte, SCC i proves documentals quan l’abast és codi; contrasta la instantània comprovada abans del segell.
- El compilador deixa d’escriure el manifest en `--check`, falla davant enllaços trencats i exclou els registres runtime del manifest públic. No s’ha implementat encara la separació completa public/private de P2.
- Skills de documentació, workflow i cicle actualitzades de manera puntual; catàleg i segell locals coherents. Plantilles de Claude amb SDP:EIXIDA conservades, exemples YAML corregits i remissió al contracte executable.

### Observacions sobre el treball de Claude

La reparació del canal de hooks i la separació entre metadades de plantilla i de document eren necessàries. Un hash curt escrit en frontmatter, però, no prova que s’haja entregat context: substituït per identificador exacte registrat. El fitxer antic `.agents/TORN_ACTIU.json` es conserva com a llegat i no governa el nou cicle. No s’han inventat rebuts retroactius per fer passar les auditories antigues.

### Operació

Executa `node tooling/gates/obrir_torn.mjs --json --actor codex --scope code`; conserva el turn_id retornat. Usa `node tooling/wiki/document.mjs context --turn-id ID --route auditoria --file CAMÍ` per rebre la plantilla sencera; `create` amb title/description genera i ancora un esborrany. Completa totes les seccions i vincula el pla amb `document.mjs plan`. Actualitza ESTAT/LEDGER amb el turn_id. Comprova amb `tancament.mjs --check --turn-id ID`; només després d’un resultat vàlid demana `--close --turn-id ID`. Versiona els registres tancats amb els documents, mai locks ni temporals.

## Verificació

| Comprovació | Resultat |
| --- | --- |
| `node --test tests/documental.test.mjs tests/porta-reflex.test.mjs` | 45/45 passen; inclou les 13 rutes, rebut fals, canvis de plantilla, cicle persistent, concurrència per lock, edits, shell i staging |
| ESLint dels mòduls i proves tocats | 0 errors i 0 avisos |
| Catàleg i segell de skills locals | Passen |
| Torn real: checkTurn i --check --turn-id | checkTurn vàlid; tancament exit 1 per Wiki/SCC, estat planned; manifest i registre del torn comprovats sense modificació |
| Lint del repositori | 1 error preexistent de clau notes duplicada a pageContent.js:111 i 375 avisos |
| `npm run porta` | Falla al primer pas documental: documents anteriors sense rebut persistent i tags no admesos |
| `tancament.mjs --check` global | Falla: deute documental, enllaços trencats, document nanochat sense àncora i dos fitxers JSX amb estils rebutjats per SCC |
| Test antic `tests/verificador-scc.test.mjs` | Falla perquè exigeix SCC verd sobre l’arbre real; el seu fitxer temporal ha sigut retirat |

Els casos adversarials parteixen de documents vàlids amb torn real de fixture. Es comprova que el compilador no modifica el manifest amb --check i que un torn inventat no es pot verificar. Els tests de lifecycle usen fixtures; no equivalen a una nova sessió real de Claude. El validador genèric de skill-creator rebutja les extensions de metadades locals; s’ha mantingut el contracte local i comprovat amb el catàleg del projecte.

## Límits

No hi ha certificat verd global ni desplegament. El torn actual queda planned mentre fallen les comprovacions de l’entorn. La seua instantània inicial es va crear durant la integració, després de bona part del codi: no certifica retroactivament totes les edicions anteriors.

Bloquejos observats: sis documents previs de l’Escriptori necessiten migració documental; el cas nanochat manca d’àncora i usa tres tags no admesos; el compilador detecta enllaços a contingut arxivat o inexistent; SCC rebutja estils a AppGridColumn.jsx i BrainGraph.jsx. Aquests fitxers i els canvis d’interfície concurrents no s’han reescrit per forçar un verd.

L’activació automàtica dels hooks requereix comprovar una sessió nova de Claude; ací s’han provat adaptadors i CLI. Un rebut acredita l’entrega de plantilla, no comprensió ni una signatura humana. Els registres locals no són una frontera criptogràfica davant qui pot alterar codi i registres. No s’ha executat una CI remota ni una prova gràfica de la interfície.

P2 i següents —compilació pública completa, sanejament global de lint, migració històrica, graf i sincronització— continuen fora de l’execució P0/P1 aprovada. L’acta Marmota de final de jornada no es presumeix tancada per aquest informe.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260922_0239_auditoria_opus]]
- [[260922_0239_pla_implementacio_opus]]
- [[260922_0240_pla_implementacio_codex]]
