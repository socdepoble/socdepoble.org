---
tipus: informe
estat: esborrany
description: Auditoria global de Sollutia, SEO, accessibilitat i separació estructural del frontend actual
tags:
  - arquitectura
  - sollutia
---

# Informe d’auditoria global — Estructura, A11y i Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-01 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 01:28 CEST |
| Agent auditor | Codex |
| Petorreta d’origen | [[260918_0114_PROMPT_Auditoria_Sollutia_Estructura]] |
| Aprovació humana | pendent · 2026-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Veredicte executiu

| Eix | Veredicte | Resum |
| --- | --- | --- |
| Integració Sollutia | **APTE AMB CONDICIONS** | El port injectable, el contracte i el segellat són reals i eviten que React importe Supabase directament. Falta, però, evidència d’un adaptador real de Sollutia: l’únic adaptador Sollutia vigent dins del perímetre és un `passthrough`. |
| SEO | **NO APTE per a donar-lo per resolt** | La infraestructura de metadades existeix, però queda desactivada per defecte també en l’arrencada standalone. A més, la cobertura és incompleta i els `hreflang` no estan connectats amb la font real de l’idioma. |
| Accessibilitat | **BASE SÒLIDA, COMPLIMENT NO DEMOSTRAT** | Hi ha focus de ruta, landmarks, mides tàctils, reducció de moviment i tokens de contrast bons. Persistixen barreres de teclat, landmarks duplicats, controls sense nom robust i un contrast de focus insuficient. |
| Separació UI / negoci | **PARCIALMENT ROBUSTA** | La frontera amb el backend està ben definida, però `App.jsx` encara executa persistència i identitat, i la capa `data` depén de dades situades dins de `sections`. |

**Conclusió:** l’arquitectura ja té una frontissa útil per a Sollutia, però encara no es pot afirmar que la integració real, el SEO per ruta ni l’accessibilitat de nivell “El Trellat” estiguen tancats. No s’ha trobat cap P0 que inutilitze tot el sistema; sí que hi ha diversos P1 que bloquegen una declaració de preparació completa.

## Perímetre, integritat i proves

### Control del manifest

El `manifest.json` disponible declara 217 fitxers i porta data de 2026-09-15. La verificació SHA-256 contra el disc actual dona:

| Estat | Fitxers |
| --- | ---: |
| Hash coincident | 78 |
| Hash divergent | 82 |
| Ruta declarada però absent | 57 |

Esta deriva afecta fitxers centrals de la missió, entre ells `src/host.js`, `src/app/App.jsx`, `src/hooks/useSEO.js`, `src/data/backendPort.js` i diversos mòduls Supabase. Per tant:

- les cites d’este informe es limiten a rutes declarades pel manifest;
- el contingut auditat és el codi local actual;
- els hashes del manifest vell no poden certificar eixe contingut;
- les absències o el desenvolupament real de l’API de Sollutia es mantenen com a incògnita i no s’omplin amb conjectures.

### Evidència d’execució

| Comprovació | Resultat |
| --- | --- |
| Porta d’enxufabilitat | PASSA: E1–E4 |
| Porta de frontera Sollutia | PASSA: S1, S3 i S4 |
| Porta SEO | PASSA: manifest SEO al dia, 31 rutes i 24 indexables |
| Suite Vitest | PASSA: 10 fitxers, 44 proves |
| Auditor automàtic A11y | No disponible: la sentinella local està retirada i no hi ha Axe/Pa11y/Lighthouse fixat |
| Render local `/jo/xat` | Sense errors de consola; visualment funcional |
| `<head>` en `/jo/xat` | Títol base “Sóc de Poble”, cap canonical i cap `hreflang`; les metadades específiques de Xat no s’apliquen |

Les portes verdes són evidència útil, però no cobrixen els defectes de SEO dinàmic, navegació per teclat ni contrast de focus descrits a continuació.

## Troballes prioritzades

### P1 · SEO-01 — Els hooks SEO queden inerts en l’arrencada standalone

`useSEO` abandona l’efecte quan `manageDocumentHead === false` (`src/hooks/useSEO.js:11-18`). El Custom Element assigna precisament `false` quan la propietat no s’ha declarat (`src/PedraSecaEmbed.jsx:387-398`), i l’arrencada standalone crea la configuració sense `manageDocumentHead` (`src/main.jsx:42-48`).

**Impacte:** títol, descripció per ruta, canonical, Open Graph, Twitter, `hreflang`, robots i JSON-LD no canvien entre vistes en el desplegament standalone observat. La porta SEO valida un manifest, però no valida que els efectes de React governen realment el `<head>`.

**Criteri de tancament:** separar explícitament els defaults `standalone=true` i `embed=false`, o generar metadades estàtiques per ruta sense dependre només d’un efecte client.

### P1 · SEO-02 — Els `hreflang` anuncien URLs que no governen l’idioma

El hook crea alternatives `ca`, `es`, `en`, `eu` i `gl` afegint `?lang=` a la canonical (`src/hooks/useSEO.js:75-96`). En canvi, `UIProvider` determina la llengua per `externalConfig.language`, `document.documentElement.lang` o l’emmagatzematge local; no consulta `window.location.search` (`src/app/contexts/UIContext.jsx:17-28`).

**Impacte:** un robot pot seguir `?lang=es` i rebre la mateixa llengua base. Açò converteix el `hreflang` en una promesa falsa i pot provocar agrupació o indexació lingüística incorrecta.

**Criteri de tancament:** fer que `?lang=` siga font canònica d’idioma, o retirar els alternates fins que existisquen URLs traduïdes reals.

### P1 · SEO-03 — Cobertura parcial i risc de metadades heretades

Les rutes globals inclouen cerca, registre, control, traduccions i administració (`src/app/App.jsx:517-550`). `SearchSection` crea la vista però no invoca `useSEO` (`src/sections/search/SearchSection.jsx:1-16`, `src/sections/search/SearchSection.jsx:51-60`), i la pantalla d’entrada tampoc (`src/sections/onboarding/OnboardingSection.jsx:1-26`).

**Impacte:** si la gestió del `<head>` s’activa, entrar en una vista sense hook pot conservar el títol i les metadades de la ruta anterior. Amb la configuració actual, totes conserven directament les metadades base.

**Criteri de tancament:** contracte SEO obligatori per cada ruta indexable/no-indexable i prova de navegació A→B que verifique neteja i substitució.

### P1 · A11Y-01 — Converses existents no operables amb teclat

La llista de membres nous usa `role="button"`, `tabIndex={0}` i gestió d’Enter/Espai (`src/sections/xat/XatSection.jsx:249-260`). La llista de converses existents, en canvi, usa un `div` amb `onClick` sense rol, focus ni teclat (`src/sections/xat/XatSection.jsx:296-312`).

**Impacte:** una persona que navega amb teclat no pot obrir converses ja existents.

**Criteri de tancament:** control natiu `<button>` o patró equivalent complet, amb focus visible i estat actual anunciat.

### P1 · A11Y-02 — L’anell de focus falla contrast sobre blau

La barra blava usa `--sdp-accio` com a fons (`src/css/layout.css:183-187`) i el peu blau de targeta també (`src/css/components.css:935-943`). El focus d’estes superfícies es força a `--sdp-accent-text` (`src/css/base.css:219-227`). En clar, això és `#ad4c03` sobre `#016ebf`; en fosc, `#ff955b` sobre `#016ebf` (`src/css/tokens.css:117-133`, `src/css/tokens.css:326-341`).

| Parell mesurat | Contrast | Resultat |
| --- | ---: | --- |
| Focus clar `#ad4c03` / blau `#016ebf` | 1,05:1 | **FALLA** 3:1 |
| Focus fosc `#ff955b` / blau `#016ebf` | 2,44:1 | **FALLA** 3:1 |

**Impacte:** el control pot tindre focus tècnic però l’indicador visual desapareix pràcticament sobre la superfície blava.

**Criteri de tancament:** token de focus específic per a blau amb contrast mínim 3:1 contra el fons i contra l’estat adjacent.

### P1 · A11Y-03 — Tipografia mòbil per davall del sòl declarat

El sistema declara `0.875rem` com a “14px · sòl absolut” (`src/css/tokens.css:193-203`), però les etiquetes de navegació mòbil baixen a `0.7rem` i, a ≤720 px, a `0.65rem` (`src/css/layout.css:381-406`, `src/css/layout.css:461-475`).

**Impacte:** text d’aproximadament 10,4 px en el principal mecanisme de navegació mòbil, especialment advers per a baixa visió i gent major.

**Criteri de tancament:** cap etiqueta operativa per davall del sòl canònic o justificació/prova d’usuari explícita que revise eixe sòl.

### P2 · A11Y-04 — Landmarks `main` duplicats

La closca ja declara el landmark principal (`src/app/App.jsx:295-314`), però Xat insereix un segon `<main>` dins del primer (`src/sections/xat/XatSection.jsx:319-341`).

**Impacte:** jerarquia de landmarks ambigua per a lectors de pantalla.

**Criteri de tancament:** l’interior del Xat ha de ser `section`, `article` o un contenidor amb nom adequat, no un segon `main` niat.

### P2 · A11Y-05 — Composer del Xat amb noms accessibles febles

El camp depén només del `placeholder`, el botó d’adjuntar sí té `aria-label`, però el botó d’enviar només conté una icona (`src/sections/xat/XatSection.jsx:527-541`).

**Impacte:** nom accessible inconsistent o buit segons navegador/lector; el placeholder desapareix visualment en escriure.

**Criteri de tancament:** etiqueta real o `aria-label` per al camp i nom explícit per al botó d’enviar; icones decoratives fora de l’arbre accessible.

### P2 · A11Y-06 — L’estat de càrrega principal no està connectat

`AppShell` intenta llegir `status` des d’UI (`src/app/App.jsx:66-68`) i el posa a `aria-busy` (`src/app/App.jsx:295-301`), però el valor del context UI no exposa cap `status` (`src/app/contexts/UIContext.jsx:75-83`). A més, el fallback és un spinner sense `role="status"` ni text accessible (`src/app/App.jsx:58-63`).

**Impacte:** la càrrega visual no s’anuncia de manera fiable.

### P2 · A11Y-07 — La navegació activa no exposa `aria-current`

`NavLink` calcula `isActive` i aplica una classe CSS, però no afegeix `aria-current="page"` (`src/app/contexts/RouterContext.jsx:153-166`).

**Impacte:** l’estat actual és visual, no semàntic.

### P1 · SOL-01 — La forma de l’API real de Sollutia continua sense demostrar

El backend per defecte reexporta una implementació Supabase completa (`src/data/supabase/index.js:8-23`). L’únic adaptador explícit de Sollutia present en el codi actual és un registre de `perfil` que retorna el `payload` sense traducció (`src/data/adaptadors/sollutia/recursos.js:1-7`).

**Impacte:** la frontissa existeix, però no hi ha evidència dins del perímetre d’una correspondència real entre endpoints, DTO, errors, paginació, realtime i autenticació de Sollutia.

**Criteri de tancament:** adaptador real o simulador contractual signat per Sollutia, més proves de contracte sobre els mètodes del nucli.

### P2 · SOL-02 — Backend global per document

El port conserva una única implementació en variables de mòdul i la congela globalment (`src/data/backendPort.js:5-6`, `src/data/backendPort.js:29-36`). El client Supabase també és singleton i rebutja explícitament dos orígens de backend diferents en el mateix document (`src/data/supabase/config.js:15-35`).

**Impacte:** múltiples instàncies visuals poden coexistir, però no poden tindre implementacions de backend independents dins del mateix document. [SUPÒSIT] Açò només és bloquejant si Sollutia necessita widgets multi-tenant o backends diferents en una mateixa pàgina.

### P2 · SOL-03 — Contracte nominal, sense validació de retorns

El contracte enumera mètodes i capacitats (`src/data/contracte.js:2-61`), i la injecció només valida que els membres siguen funcions (`src/host.js:123-145`). No valida versió, esquemes de paràmetres, DTO de retorn ni taxonomia d’errors.

**Impacte:** un backend pot passar la porta d’arrencada i fallar després per forma de dades incompatible.

### P2 · ARQ-01 — La UI encara toca identitat i persistència directament

`App.jsx` importa el port per a OAuth, però també importa directament identitat i emmagatzematge (`src/app/App.jsx:8-12`) i executa neteja de claus i migració de convidat dins de la closca visual (`src/app/App.jsx:96-118`).

**Impacte:** la separació UI/negoci és millor que abans, però no és pura; la closca coneix detalls de sessió i persistència.

### P2 · ARQ-02 — Dependència inversa de `data` cap a `sections`

`src/data/sectionContent.js` importa les llavors i còpies des de set carpetes de secció (`src/data/sectionContent.js:1-8`) i les reexporta com a catàleg de dades (`src/data/sectionContent.js:10-28`).

**Impacte:** la capa que hauria de ser independent de la UI depén de l’organització de funcionalitats/presentació. Canviar una secció pot trencar la llavor del backend.

## Fortaleses verificades

### Enxufabilitat i autenticació

- El port centralitza l’accés i converteix cada operació en una delegació explícita que falla si no està implementada (`src/data/backendPort.js:44-55`, `src/data/backendPort.js:58-110`).
- L’arrencada rebutja una injecció parcial i només cau a Supabase quan no s’ha injectat res (`src/host.js:154-175`).
- La superfície global és immutable i exposa configuració, arrencada, sessió i estat (`src/host.js:289-304`).
- La sessió externa exigeix emissor, caducitat, `sub` UUID i audiència compatible abans de pintar l’usuari (`src/data/identitat.js:242-294`).
- El client conserva la sessió completa en `sessionStorage` i falla tancat sense JWT (`src/data/identitat.js:110-135`, `src/config/storage.js:44-75`).
- Els contexts de dades consumixen el port, no Supabase: sessió (`src/app/contexts/SessionContext.jsx:2-4`) i contingut (`src/app/contexts/CoreContentContext.jsx:1-4`).

### SEO

- El hook sap gestionar títol, descripció, OG/Twitter, robots, canonical, alternates i JSON-LD (`src/hooks/useSEO.js:27-57`, `src/hooks/useSEO.js:59-125`).
- Les principals vistes públiques —Mur, Mercat, Pobles i detall— ja invoquen el hook (`src/sections/mur/MurSection.jsx:22-30`, `src/sections/mercat/MercatSection.jsx:12-19`, `src/sections/pobles/PoblesSection.jsx:9-16`, `src/sections/detail/ItemDetailSection.jsx:28-36`).
- La pàgina 404 declara `noindex` (`src/pages/NotFoundPage.jsx:7-14`).

### Accessibilitat

- El focus torna programàticament al `main` en canviar de ruta (`src/app/App.jsx:89-94`).
- La closca usa `nav`, `header` i `main`, noms de navegació, botons natius i icones decoratives (`src/app/App.jsx:237-301`, `src/app/App.jsx:335-383`).
- El patró de pàgina crea un únic `h1` visible quan hi ha títol (`src/components/universal/PageFrame.jsx:233-250`).
- El sistema declara controls de 44 px, tipografia editorial gran i focus visible (`src/css/tokens.css:171-177`, `src/css/tokens.css:189-206`, `src/css/base.css:207-231`).
- La reducció de moviment està aplicada globalment (`src/css/base.css:366-375`).
- Els parells principals mesurats passen: títol clar 19,42:1, cos clar 11,20:1, text suau clar 7,28:1, blanc/blau 5,27:1 i negre/taronja 7,12:1 (`src/css/tokens.css:41-80`, `src/css/tokens.css:104-139`).

## Matriu DAFO — Integració Sollutia

| Fortaleses | Debilitats |
| --- | --- |
| Port únic, contracte explícit i bloqueig després d’arrencar (`src/data/backendPort.js:5-36`). | No hi ha adaptador real verificable; el recurs Sollutia actual és `passthrough` (`src/data/adaptadors/sollutia/recursos.js:1-7`). |
| Injecció parcial rebutjada i fallback híbrid prohibit (`src/host.js:154-171`). | Contracte només nominal, sense DTO, versió ni validació de retorn (`src/data/contracte.js:2-61`). |
| Sessió externa amb comprovacions d’emissor, caducitat, subjecte i audiència (`src/data/identitat.js:242-294`). | Singleton de backend per document (`src/data/backendPort.js:5-6`, `src/data/supabase/config.js:15-35`). |
| Shadow DOM i configuració sanejada per a l’element (`src/PedraSecaEmbed.jsx:154-201`, `src/PedraSecaEmbed.jsx:284-307`). | La UI encara coneix identitat i claus de persistència (`src/app/App.jsx:8-12`, `src/app/App.jsx:96-118`). |

| Oportunitats | Amenaces |
| --- | --- |
| Convertir `CONTRACTE_BACKEND` en contracte versionat i executable. | Deriva del manifest: una auditoria o integració pot validar codi que ja no és el vigent. |
| Afegir proves de contracte compartides que Sollutia execute contra la seua implementació. | Un adaptador amb mètodes correctes però DTO incorrectes passa l’arrencada i falla en ús. |
| Moure identitat/persistència fora d’`AppShell` i injectar serveis per instància. | [SUPÒSIT] Una pàgina amb dos backends o orígens distints col·lisionarà amb els singletons actuals. |
| Formalitzar capacitats opcionals (`sessio`, `mitjans`, `agenda`) com a negociació documentada (`src/data/contracte.js:37-56`). | Allowlists i emissors no sincronitzats amb dominis reals de Sollutia poden rebutjar entorns legítims. |

## Matriu DAFO — SEO

| Fortaleses | Debilitats |
| --- | --- |
| Hook central per a totes les etiquetes rellevants (`src/hooks/useSEO.js:27-125`). | Gestió del head desactivada per defecte també en standalone (`src/PedraSecaEmbed.jsx:387-398`). |
| Canonical sense query i 404 amb `noindex` (`src/hooks/useSEO.js:53-73`, `src/pages/NotFoundPage.jsx:10-14`). | `hreflang` desconnectat de la selecció real de llengua (`src/hooks/useSEO.js:75-96`, `src/app/contexts/UIContext.jsx:17-28`). |
| Vistes públiques principals ja tenen títol i descripció. | Rutes globals sense contracte SEO, amb risc de metadades heretades (`src/app/App.jsx:517-550`). |
| El component pot cedir el `<head>` a Sollutia amb `manageDocumentHead`. | JSON-LD és una capacitat opcional del hook, però les crides principals auditades no li passen dades estructurades. |

| Oportunitats | Amenaces |
| --- | --- |
| Generar head estàtic/prerenderitzat des del manifest SEO i usar el hook només com a millora client. | Bots que no executen el Custom Element veuran només metadades base. |
| Unificar ruta, idioma, canonical i sitemap en una sola font de veritat. | Canonicals i alternates falsos poden consolidar URLs o idiomes equivocats. |
| Prova automàtica ruta per ruta sobre el DOM final. | Una navegació cap a una vista sense hook pot mantindre la metadata de la vista anterior. |
| Distingir clarament mode standalone i mode embed en la configuració. | Sollutia i el component poden competir pel `<head>` si no hi ha un únic propietari declarat. |

## Matriu DAFO — Accessibilitat

| Fortaleses | Debilitats |
| --- | --- |
| Landmarks base, focus al `main` i noms en la navegació (`src/app/App.jsx:89-94`, `src/app/App.jsx:237-314`). | Converses existents només amb clic (`src/sections/xat/XatSection.jsx:296-312`). |
| Controls tàctils de 44 px i escala editorial gran (`src/css/tokens.css:171-177`, `src/css/tokens.css:193-206`). | Etiquetes mòbils de 0.65rem, contra el sòl de 0.875rem (`src/css/layout.css:461-475`). |
| Tokens principals amb contrast AA/AAA i mode fosc específic (`src/css/tokens.css:104-139`, `src/css/tokens.css:304-346`). | Focus sobre blau per davall de 3:1 (`src/css/base.css:219-227`). |
| `prefers-reduced-motion` global (`src/css/base.css:366-375`). | `main` niat, `aria-current` absent i càrrega no anunciada (`src/sections/xat/XatSection.jsx:319-341`, `src/app/contexts/RouterContext.jsx:153-166`, `src/app/App.jsx:58-68`). |

| Oportunitats | Amenaces |
| --- | --- |
| Fixar Axe o equivalent i executar-lo sobre cada ruta i tema. | Les portes actuals poden quedar verdes mentre persisteixen fallades de focus i teclat. |
| Afegir proves de teclat per Xat, menús, diàlegs i navegació. | El Shadow DOM tancat dificulta algunes eines d’inspecció i pot amagar regressions de composició. |
| Verificar contrast de tots els estats, no sols dels tokens de text. | L’envelliment visual i l’ús exterior fan més greu qualsevol text menut o focus feble. |
| Fer del catàleg Pedra Seca una suite de conformitat, no només documentació. | Components legacy i canònics poden divergir semànticament encara que compartisquen CSS. |

## Pla de correcció recomanat

### Bloc 1 · Abans d’integrar Sollutia real

1. Regenerar i segellar un manifest del codi actual.
2. Obtenir de Sollutia un contracte d’API real: autenticació, errors, DTO, paginació, realtime, storage i multi-tenant.
3. Implementar o incorporar l’adaptador real i executar la mateixa suite contractual contra Supabase i Sollutia.
4. Decidir explícitament si “una implementació per document” és una restricció acceptada.

### Bloc 2 · Abans de declarar SEO preparat

1. Activar la gestió del `<head>` en standalone sense activar-la automàticament en embed.
2. Cobrir totes les rutes amb una declaració SEO o `noindex` explícita.
3. Connectar `?lang=` amb l’estat lingüístic o retirar `hreflang` temporalment.
4. Provar títol, descripció, canonical, robots, OG i alternates després de navegar entre rutes.
5. Determinar si les rutes públiques necessiten prerender/SSR per a robots sense JavaScript.

### Bloc 3 · Abans de declarar compliment A11y

1. Reparar el focus sobre blau i tornar a mesurar tots els estats.
2. Fer operables amb teclat les converses i donar nom al composer.
3. Eliminar el `main` niat, afegir `aria-current` i connectar `aria-busy` a l’estat real.
4. Elevar les etiquetes mòbils al sòl tipogràfic canònic.
5. Fixar una dependència d’auditoria A11y i guardar resultats reproduïbles per ruta, tema i amplària.

## Incògnites

- **API Sollutia:** quin contracte real, versió i entorn de prova ofereix? No hi ha prou evidència al perímetre actual.
- **Mocks:** fins a quin punt reproduïxen errors, permisos, paginació, realtime i DTO de Sollutia? No demostrable amb el manifest vigent.
- **Render SEO:** producció usa SPA pura, prerender, SSR o injecció de head per Sollutia? [SUPÒSIT] El risc de rastreig canvia substancialment segons esta resposta.
- **Multiinstància:** Sollutia necessita dos tenants o backends diferents en el mateix document?
- **Objectiu normatiu A11y:** WCAG 2.2 AA, AAA parcial o un perfil intern superior d’“El Trellat”?
- **Shadow DOM:** quina combinació real de lector de pantalla i navegador s’ha de certificar?

## Bateria de veritat

- [x] Cap línia de codi modificada, afegida o esborrada.
- [x] L’únic fitxer creat és este informe Markdown.
- [x] Les afirmacions de codi citen rutes declarades al manifest en format `ruta:linies`.
- [x] Cap funció o variable s’ha inventat.
- [x] Les conjectures estan marcades `[SUPÒSIT]` o mogudes a Incògnites.
- [x] Les portes i proves s’han executat sense generadors ni mutacions.
- [x] El desfasament del manifest s’ha declarat com a limitació probatòria.

