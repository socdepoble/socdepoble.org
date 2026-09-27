---
type: informe
status: esborrany
description: Execució i verificació local del hook de lectura, capçaleres de panell i fluxos de login i creació d’empreses i grups.
tags: [auditoria, govern]
reflex: sdp:torn_12049509-c4ff-451a-af3c-d759d1fe3b77:ce03ca33-aa76-4b1d-a828-5b276a3df81c
---
# Auditoria Codex: Segell, panells i identitat

T1–T4 implementades sobre el treball local existent. El client conserva el port de backend intercanviable. El segell es comprova verd; lint, builds web/WordPress i portes Model B passen. La bateria global conserva 10 fallades a Wiki/Consola i la cadena general es para en una incompatibilitat prèvia de la plantilla v3. No es declara el repositori completament verd ni l’autenticació remota acreditada.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-2026-09-27-CODEX |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; localhost:3340 |
| Creació | 2026-09-27 16:57 |
| Modificació | 2026-09-27 16:57 |
| Propietari | Codex |
| Aprovació humana | Instrucció explícita T1–T4 en este xat |
| Model IA | GPT-6 / Codex; variant concreta no verificable en l’arnés |
| Tokens consumits | Mesura no disponible per al fil ni subagents; no estimada ni inventada |
| Tall d’evidència | HEAD 76a36437 i arbre local, incloent treball previ sense commit |
| requires_human_decision | false |

## Acte reflex

Lectura íntegra d’AGENTS.md, Genotip, índex mestre, taxonomia, workflow, protocol Petorreta i plantilla prompt_local.md. Context actiu de primer nivell llegit complet: índex d’escriptori, prompt i pla de les 16:50. Les carpetes de producció humana i investigació s’han inventariat sense modificar-les; no s’ha llegit l’arxiu històric. Plantilla d’auditoria entregada pel circuit documental amb rebut persistent. El pla original s’ha preservat i ampliat amb metadades, consens i verificació; el seu `check` és vàlid. La vinculació mecànica del pla falla pel contracte global de la plantilla v3, detallat més avall.

Tres subagents han inspeccionat T1, T2 i T4 abans d’editar. El consens ha fixat superfícies i garanties; l’orquestrador ha tractat T3, integració, navegador i informe. Revisió creuada addicional de T1 i auth. No hi ha commit, push, desplegament, migració aplicada ni alta d’entitats reals.

## Historial

- 2026-09-27: inspecció i proves de partida, acord tècnic, execució acotada, revisió creuada, validació local i entrega.

## Troballes

### T1 · Lectures legítimes i segell

**Corregit.** `tooling/gates/mutation-policy.mjs` inclou `SubagentHandback`, `StructuredOutput`, `Skill` i `ListSkills` com a operacions explícites sense mutació. Carregar una skill no evita el hook de les eines que esta use després.

La shell permet comandes simples `ls`, `grep`, `rg`, `cat`, `head`, `tail`, `wc` i `pwd` mitjançant tokenització literal i opcions conegudes. Es mantenen les restriccions de metadades i directori de treball a l’arrel: per llegir una subcarpeta s’indica com a argument. Shell composta, pipes, redireccions, substitucions, wrappers, executables arbitraris i preprocessadors de ripgrep continuen denegats. Si hi ha RIPGREP_CONFIG_PATH, cal `rg --no-config` per evitar que una configuració heretada llance processos. Les claus heretades del prototip d’objecte tampoc són comandes vàlides.

`tooling/gates/segell-auto.mjs` omet la comprovació repetida només després de lectures pures i declara explícitament «segell no comprovat». Una escriptura, shell opaca o script continua comprovant el segell. No es resegella automàticament per silenciar errors.

El desajust previ del segell provenia d’una skill ja incorporada a HEAD, `core-telemetria-huma`. S’ha revisat íntegrament i reconciliat amb hashes anterior/actual, sense pending incomplet, abans de la mutació. Els canvis crítics s’han aplicat amb lease, executor CAS, claim verificat i consum.

### T2 · Capçaleres completes

**Corregit.** `AppGridColumn` incorpora una opció explícita que genera un sol botó natiu amb icona, títol i control de replegar, sense botons imbricats. Inclou nom accessible, estat i focus. S’activa a Configuració del Xat, Disseny/Components i Wiki/Documents; en UniversalWorkspace és només d’escriptori. Notes i Carpetes mantenen el valor per defecte i el comportament anterior.

Fitxers principals: `src/components/layout/AppGridColumn.jsx`, `AppGridShell.css`, `src/components/universal/workspace/UniversalWorkspace.jsx`, `DesignSection.jsx`, `WikiDePobleSection.jsx` i `src/sections/xat/components/ClosCaXat.jsx`. No s’han fet canvis nous en el mòdul Notes ni en els CSS globals premodificats.

### T3 · Login i registre

**Estabilitzat.** El flux existent `/registre` alterna Entrar/Crear compte i usa SessionContext → backendPort → adaptador. El login per contrasenya rebutja una resposta sense token o usuari abans de persistir sessió. La UI descarta resultats d’intents antics o després de desmuntar; evita enviaments duplicats, congela el canvi de mode durant enviament i associa errors de contrasenya amb el camp. Els errors es netegen en canviar de mode i el registre conserva la confirmació per correu.

El registre i la restauració de sessió ja existien: no s’han duplicat ni substituït. RequireAuth continua esperant la comprovació de sessió i conserva `tornar` per a la ruta protegida. Els components no importen el client Supabase ni construïxen peticions HTTP.

Fitxers: `src/data/supabase/auth.js`, `src/sections/onboarding/OnboardingSection.jsx`, `OnboardingSteps.jsx`, `src/components/PedraSeca/molecules/PillToggle.jsx` i proves.

### T4 · Empreses i grups

**Estabilitzat.** Entrada existent: **El meu perfil → NOVA ORG**. El diàleg crea una Empresa; en administrar-ne una, permet crear un Grup vinculat. Esta relació forma part del contracte SQL vigent i es mostra al formulari. No s’ha canviat l’esquema.

`src/data/organizations.js` és el servei neutral del domini: valida usuari, tipus, nom, identificador i empresa mare administrada; delega exclusivament en backendPort i comprova la sessió després de l’espera. Rebutja respostes sense id o amb tipus, slug, mare o rol contradictoris; conserva respostes parcials compatibles i el nom actual del servidor en reintents. La comprovació de tenant viu exclusivament en l’adaptador, on es coneix el tenant realment enviat després de normalitzar la configuració.

PerfilContext actualitza la llista per id, sense duplicar entitats retornades per la RPC idempotent i sense substituir un rol admin ja conegut per owner. PerfilShell espera que la nova identitat arribe al model abans de seleccionar la seua fitxa. El modal impedeix dobles enviaments, edició i tancament mentre desa; conserva dades si falla. Canvis d’usuari o tenant invaliden el resultat antic.

Fitxers: `src/data/organizations.js`, `src/data/supabase/organizations.js`, `src/sections/profile/PerfilContext.jsx`, `DialegNovaOrganitzacio.jsx`, `src/components/PedraSeca/organismes/formulari.jsx` i proves.

### Deute observat i optimització de prompt_local

1. **P1 operatiu, previ:** `prompt_local.md` v3 canvia els títols fixos mentre `.agents/protocolledge.json` encara exigix `Context`. `npm run porta`, `document.mjs plan` i una prova documental fallen amb `Bloc fix absent: prompt.local: Context`. Reparació suggerida: alinear plantilla, versió, blocs/seccions del contracte i fixtures en una mateixa revisió explícita. No relaxar el validador.
2. **P2 documental, previ:** el prompt de les 16:50 presenta un comentari `SDP:EIXIDA` en lloc de frontmatter real i diu rebut pendent malgrat marcar el preflight com complet. Cal generar metadades i rebut real amb el circuit, mai marcar-los abans de verificar-los. L’autorització d’esta sessió prové del missatge humà, no d’eixa casella.
3. **P2 verificació:** Wiki té tres fallades de dates/etiquetes reproduïdes abans de T2; Consola presenta set fallades de targetes, fonts/etiquetes i peu de privacitat. Els fitxers de Consola no s’han modificat. No s’ha ajustat cap expectativa ni baseline per amagar-les.
4. **Millora de plantilla:** usar dates internes AAAA-MM-DD; fixar rutes completes (taxonomia viu a protocols_tecnics); distingir prototip, validació local i verificació de backend; mantindre documents actius ancorats sense exigir buidatge indiscriminat; indicar metrologia desconeguda com a desconeguda. La còpia literal de la plantilla ha de comprovar-se contra un contracte sincronitzat.
5. **P2 text existent d’onboarding:** «totalment segur» i «RGPD Llei 05» són afirmacions absolutes/imprecises presents abans del torn. Requerixen revisió editorial; esta execució no acredita conformitat legal.

## Verificació

| Comprovació | Resultat |
| --- | --- |
| Auth abans de canvis | 68/68 |
| Auth + accés + PillToggle després | 84/84 |
| Panells Xat + UniversalWorkspace | 44/44 |
| Entitats, modal, context, shell i adaptador, després de revisió | 98/98 |
| Vitest global abans de l’últim reforç de resposta d’entitats | 1.146 passen, 10 fallen; 105/107 fitxers passen |
| ESLint global | Passa |
| Builds web i WordPress | Passen; avís de grandària de bundle web |
| Enxufe, adaptadors, frontera i RLS estàtica | Passen |
| Pla documental: check | valid:true |
| Cadena general `npm run porta` | Falla en contracte de plantilles, abans de la resta |

Les proves focalitzades se superposen amb la bateria global i no se sumen com si foren proves independents. Després de l’últim reforç s’han repetit les suites d’entitats pertinents. Hook i cadena de seguretat: 44/44 proves finals, incloent 8 casos nous. Segell final verd `afe40038`, sense pending ni lease activa. La selecció ampliada de 50 proves havia donat 49/50 per la fallada documental prèvia del contracte de plantilla.

Navegador a localhost:3340, escriptori de 1.440×900: clic al text de Disseny (subagent), Components, Wiki i Configuració del Xat replega el panell. Wiki/Components retornen focus a Expandir. Accés: canvi de mode i errors locals de camps buits comprovats amb ratolí i teclat; proves automatitzades cobreixen login per port, èxit/error, confirmació i retorn protegit. No s’ha usat cap contrasenya real ni fet una alta externa.

## Límits

- Cap sessió autenticada real disponible en la verificació: OAuth, lliurament de correu i persistència remota d’empreses/grups no s’acrediten amb proves locals.
- RLS verificada estàticament; no s’ha executat PostgreSQL ni migracions remotes.
- Les lectures són obertes per formes explícites i pures; la shell arbitrària continua tancada.
- L’arbre inicial contenia nombrosos canvis de Notes, Xat, i18n, contractes i documents. S’han conservat i no s’atribuïxen a este torn. Cap neteja destructiva ni arxivament automàtic.
- Cal l’Acta Marmota al final de la jornada, d’acord amb AGENTS.md. No s’ha creat fora de l’Escriptori en este torn.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260927_1650_pla_implementacio_codex]]
- [[260927_1650_prompt_codex]]


## Evidència de governança i tancament

Transaccions de l’executor, preservades al repositori:

- `.agents/seal-transactions/883d34f3-570e-43ba-9a2f-011903ad2ce4.json`: reconciliació explícita del segell previ.
- `.agents/seal-transactions/b3143487-e8af-4afa-8d99-9af4a89386b1.json`: implementació T1.
- `.agents/seal-transactions/15f015fe-a087-4f9e-9677-6d4ba52dc6e7.json`: guarda de claus heretades i regressions.
- `.agents/seal-transactions/615fbd4e-be64-450b-87b0-255a30e710cc.json`: actualització d’ESTAT, historial anterior preservat exactament.

El bloc inicial d’ESTAT queda actualitzat amb resultats i limitacions. El tancament es comprova amb el torn explícit; el resultat es registra a continuació.


Primer tancament: `valid:false`, estat `context_loaded`. Passen autoritat, checksum del LEDGER, segell i compilació estricta de Wiki. Fallen plantilla, catàleg de skills (projeccions `.agents/manifest.yaml` i `.agents/skills/00_INDEX_SKILLS.md` divergents), tests documentals derivats i SCC (onze àncores de laboratori i tres orfes operatius previs). El torn no pot registrar el pla mentre el contracte de plantilla siga invàlid; no es declara `closed`. El relleu al LEDGER queda incorporat pel circuit d’executor, amb el cos anterior preservat i checksum vàlid.

El rebut inicial havia reservat el nom de les 17:00 sense crear el fitxer. Es registra la redestinació a les 16:57 amb `document.mjs handoff`; no s’ha eliminat cap document. `git diff --check` global detecta un espai final previ en la plantilla prompt_local.md; els canvis d’esta execució passen la comprovació acotada.

Última verificació després del reforç de respostes d’entitats: ESLint global i builds web/WordPress passen novament; Enxufe i segell passen; diff --check acotat als canvis passa.

Relleu final de govern: `.agents/seal-transactions/410749a4-3878-4a13-a8e9-57059f5ef1d8.json`, lease consumida, actualitza LEDGER i registra en ESTAT el tancament fallit amb causes. `verify-ledger` i segell verds.

Comprovació després del relleu: desapareixen els errors de LEDGER i del nom reservat. Persistixen exclusivament les incidències de contracte/planificació, catàleg, proves documentals i àncores descrites. Una passada coincidí amb l’edició d’esta addenda; es repetix el tancament amb tots els fitxers en repòs per obtindre el tall final.
