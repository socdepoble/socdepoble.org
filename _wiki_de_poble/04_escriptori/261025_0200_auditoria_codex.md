---
type: informe
status: esborrany
description: Segona passada adversarial de la reforma editorial, titular pública, contractes i contenció accessible de taules
tags:
  - auditoria
visibility: private
reflex: sdp:torn_68333fac-debb-4924-9a1d-e3edd6e89d0b:c08a6db8-25fd-40a5-9a1d-26ad2a6214a4
---
# Auditoria Codex · segona passada de la reforma editorial, titular pública i taules

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_68333fac-debb-4924-9a1d-e3edd6e89d0b:c08a6db8-25fd-40a5-9a1d-26ad2a6214a4 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T01:28:04.090Z |
| Modificació | 2026-10-25T04:04:00+00:00 |
| Propietari | codex |
| Aprovació humana | Auditoria autoritzada per la convocatòria directa del Mestre; cap commit ni migració autoritzats per este informe |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (model exacte no exposat pel runtime) |
| Tokens consumits | No disponibles amb precisió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

La plantilla viva s’ha tornat a consultar en esta passada (`document.mjs context`, mateix torn i ruta). Es conserva el rebut original del document; actualitzar-lo no crea un informe paral·lel.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T01:28:04Z: naixement pel circuit documental.
- 2026-10-25T01:37:55Z: primera passada sobre `1c110f954`, abans de la reforma. Quota/cache favorables; C0200-01..06 i 2.999 Vitest + 259 Node, 60,675s.
- 2026-10-25: segona passada encomanada directament pel Mestre, amb el codi de Claude disponible. Lectura íntegra del pla, implementació completada, auditories prèvies i Llibre Mestre (inclosa IDEA-28); contrast de codi, proves independents i Chromium en viu. Els resultats d’esta versió substituïxen les afirmacions antigues de reforma absent.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dictamen: conformitat parcial; resten tres P2 abans del commit final: C2-01, C2-02 i C2-04.** La migració nova supera la matriu SQL independent i el precommit passa amb el recompte demanat. Les correccions anteriors C0200-01, C0200-02, C0200-05 i C0200-06 estan al codi. Continuen la reutilització de la titular entre servidors/sessions, la casella de consentiment que hereta l’operació d’una altra entitat i les taules de contingut sense contenció en columna estreta d’escriptori. **C2-03 s’ha corregit en codi durant esta passada; falta repetir-ne la mesura de teclat en viu.**

### Instantània i abast

HEAD continua en `1c110f954f6e9191ff04ffeaa8e32a0821149267`, arbre `bf1751a4db34e599fa3909df87f611cab275581f`. La reforma encara és al working tree: **60 fitxers de producte modificats/nous** al tall de 04:01:40Z. No s’ha creat commit ni aplicat cap migració.

Manifest inicial de 58 fitxers `…_manifest_abans.json`; manifest de tancament de 60 fitxers `/tmp/261025_0200_codex_segona_manifest_tancament.json`, SHA-256 dels bytes `0c4da5aadf493af3e04a43f63a7f45a1e730bd07465ef3867456e7c02a61afea`. Entre l’inici de les proves i el tall han canviat els cinc idiomes, `components.css`, `sdp.css`, `Especimen.jsx`, `EspecimenContracte.jsx`, `versio.js`, `GestioMembres.jsx` i la seua prova, i `parseMarkdown.js`. S’han rellegit i s’han executat bateries addicionals sobre les superfícies afectades. SQL, port i hook de titular no han canviat en este interval. **No s’afirma una execució sobre arbre congelat ni exclusivitat de CPU del workspace compartit.**

Fonts contrastades: implementació de Claude SHA-256 `77dafeef58205304dd09d23ac39238c5dd77b49a3d32a0aeb57bf8390ddcebd9`, segona passada de Gemini v2.1.0 `ae3e97e257eb7b5d885af74d9d0d31cdb1d1741961541816054271258b0f4d18`, pla `0e970373518f775a3b7268cd1eb9bc8c036a69b50add81942ef78c1765c6966d`. També s’han llegit íntegres el prompt viu de segona passada, els informes previs i el Llibre Mestre. La primera versió pròpia llegida tenia SHA-256 `ad06522ac9d3e31eeb79674e701e4ac008f839545ac9776e7add7e25cd7544b9`.

S’han usat tres subagents de Codex només per a revisió i reproduccions. No són els agents externs Claude/Gemini. Codex no ha canviat codi de producte en cap de les dos passades.

### C2-01 · P2 · La titular conserva dades d’un altre servidor o d’una altra sessió

**Font:** `src/sections/connectar/useTitularDeConnexio.js:40–63`; consumidor `ConnectarSection.jsx:448–455` i crida al hook.

El resultat i l’efecte tenen només `orgId` com a clau. `configRef` guarda la configuració nova però no provoca una lectura; `teSessio` només és un booleà. Si canvia el servidor o la persona mantenint el mateix orgId, no es recalculen les condicions de privacitat/bloquejos. La ruta i els providers es reutilitzen; no hi ha un remuntatge que ho resolga.

**Reproducció executada amb React i jsdom reals:**

1. A retorna `{id:'owner-a', nom:'Pepa A'}`; es canvia a B, on el port retornaria null: queda Pepa A i B no rep cap crida.
2. U passa a V, que no ha de vore la titular, amb `teSessio=true`: es conserva el resultat d’U.
3. La petició d’A queda pendent, es canvia a B i després respon A: `AAborted=false` i la titular d’A entra en la vista de B.

**Impacte:** es pot mostrar la vinculació persona/entitat a una sessió per a la qual el servidor l’hauria ocultada. No és un bypass SQL; el client reutilitza una autorització anterior. **Esmena:** clau d’orgId + backendScope + usuari/generació de sessió, invalidació síncrona del resultat i cancel·lació/descart de tota resposta anterior. Cobrir els tres casos i la tornada a una clau anterior. `requires_human_decision: false`.

Evidència: [runner](/tmp/261025_0200_titular_scope_runner.mjs), [log](/tmp/261025_0200_titular_scope_poc.log). El runner llig el hook actual, substituïx el port i executa React/jsdom; no és un assaig de servidor.

### C2-02 · P2 · Una resposta de consentiment d’A falseja la casella de B

**Font:** `src/sections/profile/GestioMembres.jsx:92–130` (`TriaTitular.canvia` i valor controlat); el consumidor de GestioMembres es reutilitza sense key d’organització.

L’escriptura captura l’orgId d’A, però en resoldre només comprova `viu.current` (muntatge). Si s’ha canviat a B, `setEstat(previ => …)` modifica l’estat de B amb el valor d’A i hi posa la confirmació d’A.

**Variant material reproduïda:** A=true; es demana A=false i la resposta queda pendent; s’obri B, que és true; arriba A=false. La casella de **B queda desmarcada**, encara que **B continua true al servidor**. El registre d’escriptures és únicament `[[A,false]]`, i el missatge diu «Ja no et mostrem com a titular de Forn A». També es confirma la variant inversa A=true → B=false, amb falsa aparença d’activació de B.

L’esmena posterior que conserva el focus afegix `pendent` i `checked={desant && pendent !== null ? pendent : estat.valor}`. S’ha tornat a executar la PoC sobre eixe codi: **B ja mostra la tria pendent d’A abans que responga A**, i després queda amb el valor incorrecte. En la revocació, B es veu false mentre el servidor continua true; en activació ocorre l’invers. La millora del focus no resol la identitat de l’operació.

**Impacte:** l’usuari pot creure que B ja no el mostra quan la vinculació continua pública. **Esmena:** identificar org, usuari i generació de l’operació, i comprovar-los abans de tocar valor, missatge o estat `desant`. Invalidar operacions en canviar d’org/sessió i provar els dos sentits amb promises diferides. `requires_human_decision: false`.

Evidència: [runner](/tmp/261025_0200_titular_consent_runner.mjs), [log](/tmp/261025_0200_titular_consent_poc.log). El port és un doble i no s’ha modificat cap consentiment real.

### C2-03 · Corregit en codi durant la passada · Desplaçador mòbil del contracte

**Fonts:** regla base `src/css/sdp.css:55–64`, esmena `src/css/components.css:534–541`, `src/sections/disseny/cataleg/Especimen.jsx`. Les mesures següents són anteriors a l’esmena.

A ≤40rem la regla base posa `table { display:block; overflow-x:auto }`. `.sdp-taula` ho desfà, però el nou embolcall `.sdp-especimen__contracte` no usa eixa correcció. El resultat té dos contenidors d’overflow declarats i només la taula interior té contingut desbordat en mòbil.

**Mesura pròpia en Chromium, `fonaments-publicacions-actor`:**

| Viewport | Embolcall client/scroll | Taula client/scroll | Pàgina client/scroll |
|---|---|---|---|
| 1280×800 | 470 / 648px | taula de layout normal | 1280 / 1280px |
| 375×812 | 272 / 272px | 272 / 648px, `display:block`, `overflow:auto` | 375 / 375px |
| 385×812 | 282 / 282px | 282 / 648px | 385 / 385px |

Els sis noms de la primera columna són sencers (`white-space:nowrap`, un sol rectangle), així que eixe requeriment sí passa. Però en enfocar la regió `Contracte` i prémer ArrowRight a 385px, tant wrapper com table continuen amb `scrollLeft=0`: l’element que rep el focus no és el que té recorregut. No es complix l’scroll exclusiu de `.sdp-especimen__contracte` requerit per la convocatòria.

**Estat final de codi:** `components.css:540` ja restaura `display:table; overflow:visible` a la taula de `.sdp-especimen__contracte`, i el `nowrap` queda acotat al contracte. L’embolcall té nom derivat dels títols i tabIndex. Es dona per corregida la causa inspeccionada, sense atribuir-se l’edició. La reconnexió a Chrome ha fallat dos vegades: **no es certifica encara la geometria ni ArrowRight després de l’esmena**. C2-04 continua independentment.

### C2-04 · P2 · Les taules nues desborden columnes estretes d’escriptori i perden jerarquia visual

**Fonts actuals:** quatre `<table>` a `EspecimenGestor.jsx:35,44,53,62`; `EspecimenUniversalWorkspace.jsx:47`, `EspecimenInventariGlobal.jsx:27` i `WikiDePobleSection.jsx:332`. Cap d’estes rep l’embolcall `Taula`. `src/css/sdp.css:55–64` posa scroll a taules nues només quan el **viewport** és ≤40rem; una finestra de 1280px amb una columna de 353–385px queda fora de la guarda. `width:100%` no anul·la l’amplada mínima intrínseca del contingut i `.sdp-especimen__viu` deixa overflow visible.

**Mesures independents de Gemini v2.1.0 a 1280×800**, contrastades amb la causa al codi; no són mesures pròpies de Codex:

| Taula | Columna útil | Amplada de taula | Excés |
|---|---|---|---|
| Gestor: Plegat / Mides / Amplades | 353px | 364 / 432 / 371px | 11 / 79 / 18px |
| Gestor: Colors | 353px | 327px | cap; separació a l’anterior de 0px |
| UniversalWorkspace: variants | 353px | 370px | 17px |
| Inventari global | 355px | 1093px | 738px |
| Espècimen canònic Taula | embolcall 305px | 408px | contingut dins de l’embolcall; pare 353/353px |

**Dictamen arquitectònic:** reutilitzar el component existent `src/components/PedraSeca/organismes/Taula.jsx`, que ja aporta taula nativa, regió amb nom i focus de teclat. Substituir cada taula de contingut per `<Taula titol="...">` conservant `<caption>`, `<thead>` i `<tbody>`. Un únic embolcall ha de desplaçar a qualsevol amplada, sense duplicar scroll en la taula interior. No cal una API ni un component nous.

Base exacta proposada per als embolcalls compartits, amb la taula interior en layout natiu:

```css
:where(.sdp-taula, .sdp-especimen__contracte, .sdp-taula-prosa) {
  min-inline-size: 0;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  margin-block-end: var(--sdp-space-6);
}
:where(.sdp-taula, .sdp-especimen__contracte, .sdp-taula-prosa) > table {
  display: table;
  overflow: visible;
}
```

La regla resilient global `:where(table)` pot quedar com a xarxa per a contingut heretat, però **no substituïx** nom i accés per teclat ni convé estendre-la mecànicament a factures d’impressió. La solució preferida és migrar les taules de contingut al component canònic i comprovar la impressió per separat.

**Markdown:** l’esmena `parseMarkdown.js:169` ja embolica les taules en `.sdp-taula-prosa`, amb scroll contingut a qualsevol amplada; l’informe de Gemini encara la descriu dins del grup sense contenció. Eixa part s’ha corregit en codi. El wrapper generat encara no té rol, nom ni tabIndex; `sanitizer.js` tampoc permet actualment eixos atributs. Cal resoldre el nom i el focus en el renderitzat de confiança o amb una admissió específica validada, sense obrir genèricament el sanititzador.

**Contrast i ritme:** els tokens actuals donen capçalera clara `#f3f0ec` i zebra `#efece7`; el quocient de luminància entre eixes superfícies és aproximadament **1,04:1**. El text fosc de capçalera sí té contrast alt; el problema és la poca separació entre nivells i les quatre taules seguides sense aire. No s’adopta l’afirmació de ΔE/visibilitat humana de Gemini, que no aporta el càlcul perceptiu.

Proposta concreta amb tokens semàntics existents: capçalera `background:var(--sdp-fons-invers); color:var(--sdp-text-invers)`, pes 700 i vora inferior de 2px `--sdp-vora-forta`; cos `--sdp-fons-targeta`/`--sdp-text-cos`, zebra `--sdp-fons-subtil`, vores `--sdp-vora`; caption amb pes 700, `--sdp-text-titol` i padding de 12px; 24px entre embolcalls. El parell de capçalera calcula aproximadament **19,42:1 en clar i 18,01:1 en fosc** a partir dels tokens actuals. Són càlculs estàtics d’una proposta, no una paleta aplicada ni certificada en viu. Usar el selector real `[data-theme="dark"]`; els valors literals i `[data-tema="nit"]` de la prescripció de Gemini no coincidixen amb este repositori.

**Acceptació:** 1280×800 amb columna de 385px i mòbil 375×812; cap excés fora de cada caixa, `scrollWidth > clientWidth` únicament en l’embolcall quan cal, focus i ArrowRight funcionals, noms de props sencers, caption i capçalera distingibles en clar/fosc, separació de 24px entre taules. `requires_human_decision: false` per a la contenció; la paleta proposada queda per a revisió visual. Codex no ha aplicat el pegat.


### Migració 2610250300: resultat favorable, amb límits explícits

SQL SHA-256 `b35c02430263cecacb6d2728d62cbda992ef714c3798aba525ba9f764e6cd71e`.

| Condició | Evidència |
|---|---|
| Sessió i pertinença owner | `titular_public:199–214`; sense sessió torna zero files; admins no poden marcar |
| Opt-in explícit | `titular_public` fals per defecte; marca només la fila owner de qui crida, línies 135–149 |
| Perfil públic i sense baixa | `coalesce(p.is_public,false)` i `p.baixa_demanada_at is null`, 215–216 |
| Entitat pública | `o.visibility='public'`, 211 |
| Cap bloqueig entre persones | dos sentits, 225–232 |
| Projecció mínima | només `id, full_name, avatar_url`, 233–236; sense correus, rols ni identificadors de tercers |

El UUID retornat és el de la persona que ha consentit mostrar-se amb perfil públic; sense les condicions no es retorna cap UUID privat. Totes les RPC són `SECURITY DEFINER`, `search_path=''` i executables només per `authenticated`; es revoca l’escriptura directa de membres des dels clients. El trigger desactiva la tria en deixar de ser owner i no la ressuscita en recuperar el rol.

**20 comprovacions independents passen en PGlite / PostgreSQL 17.5**, amb migració exacta, rols authenticated/anon i RLS d’un esquema mínim. Inclou opt-in, privacitat/null, baixa, entitat privada, owner/admin, revocació, permisos directes, idempotència i bloquejos bidireccionals. S’ha provat crear i llevar `bloquejos` després d’haver cachejat el camí: cap error **42P01**. Els IF niats eviten planificar l’EXISTS quan la taula no existix.

[Script SQL reproduïble](/tmp/261025_0200_codex_sql_titular_probe.mjs). No és l’execució de tot l’historial de migracions, ni de dues sessions concurrents, ni una base de dades del projecte. Les lectures STABLE usen la instantània de la crida; no s’afirma visibilitat immediata d’una revocació encara no confirmada en una altra transacció. La via antiga `owner_user_id` de publicacions queda fora d’esta migració: el resultat favorable no acredita privacitat global de tota l’app.

### Port, kit i troballes anteriors

- **C0200-01 corregit:** el cas quiEmSegueix rebutja tipus absent, `ia` i null, i accepta persona/entitat. PoC pròpia reexecutada i proves verdes. La correcció és del codi lliurat per Claude; Codex no va modificar el kit en la primera passada, encara que l’informe antic de Gemini li atribuïsca eixa edició.
- **C0200-02 corregit:** botó amb el nom personal i avís previ en remot quan el barret és d’entitat; llavor sense afirmació falsa d’enviament a tercers.
- **C0200-06 corregit:** `identitatPropiaDe` i `actorsPerAlDesti` permeten A→B i entitat→administradora, preservant els vetos d’autoconnexió i de xat propi. Matriu U/A/B coberta en la bateria dirigida.
- **C0200-05 corregit en codi:** H4 a 16px, reixeta de 4px, radi-s existent i color/mida ben separats. El pla antic encara descriu 14px/radi-xs: no s’ha reinterpretat això com una regressió de la implementació aprovada.
- `titularPublic` i `consentimentTitular` són capacitats opcionals, fora del nucli i de directori. La implementació parcial és rebutjada; el port manté config com a últim argument i projecció canònica. Kit local/remot i proves de declaració passen.
- Paritat local de privacitat limitada expressament: només coneix els bloquejos de qui mira. No equival a provar els bloquejos inversos d’una altra sessió local.
- **C0200-03/04 continuen pendents de governança:** categoria implementacio no declarada al catàleg i ordre d’higiene incompatible amb consumidors pendents. No són defectes nous de la reforma i no s’han canviat portes.

### Comprovacions visuals i diàleg creuat

- `<pre>` real d’UniversalWorkspace a **`fonaments-contracte`**: ample/scroll 418/572px a 1280×800, 220/572px a 375×812; `overflow-x:auto` i pàgina sense desbordament. També 230/572px a 385×812.
- La ruta `estructura-universalworkspace` del prompt existix però té **zero `<pre>`**. S’ha visitat també la ruta correcta; zero blocs no s’ha comptat com una prova satisfeta.
- `estructura-arbre`: caixa viva amb `1px solid rgb(220,215,205)` i fons `rgb(255,255,255)` (`--sdp-fons-targeta`); el filet dashed ha desaparegut.
- Entrada de llavor via `/registre`, «Entra com a Javi Llinares», i Connectar de Rentonar: el camí directe oferix només el barret «Sóc de Poble (empresa)», sense xat amb un mateix. No s’ha premut Connectar ni cap casella de consentiment.
- No apareix titular en eixa llavor: no hi ha titular declarada. Per tant, **no es certifica visualment un destí dual amb opt-in actiu en viu**; s’han validat dades/SQL i el component amb fixtures, sense convertir una persona real de la llavor en exemple públic.
- L’informe de Claude es contrasta amb estes proves: es confirmen les esmenes anteriors i R-1 (IF niat), però no el tancament total davant C2-01/02/04.
- La segona passada de Gemini v2.1.0 s’ha llegit íntegra, incloses les mesures de Gestor/Inventari, focus de la casella i els tres poliments P3. Hi ha consens sobre la causa de les taules i les guardes de sessió. Es concreta la severitat de taules en **P2**: defecte real de contingut tallat, sense prova d’una interrupció global que exigisca P1.
- El «resolt» de C2-03 en Gemini era una prescripció; ara sí consta l’esmena al codi. El wrapper Markdown també ha canviat després del seu diagnòstic. No s’hereten automàticament les seues conclusions sobre un arbre posterior.
- Gemini documenta marcar i desmarcar l’opt-in en llavor, conservant el focus. Això no equival a visualitzar en viu un segon destí d’una altra persona: l’única titular provada és la mateixa sessió i el veto d’autoconnexió l’oculta. Les fixtures cobreixen eixa altra branca.
- El paràgraf de titular fora de BlocRelacio (G0200-R2-02) és un poliment editorial coherent amb H3 → text; la separació de 32/40px entre espècimens i la decoració de píndola partida (G0200-R2-03/04) queden com a P3. No es confonen amb els tres P2 oberts.

### Automillora i IDEA-28

Es manté la proposta de cicle documental per documentId+hash+estat+consumidors, consolidació prèvia i arxiu post-commit recuperable; els tres informes convergixen en esta necessitat. Un wikilink al Llibre, tot sol, no prova que s’hagen destil·lat conclusions ni consumit l’informe.

El naixement ha de registrar identitat, hash, torn i consumidors previstos en una mateixa transacció amb l’índex. Cada avaluació referencia el hash llegit; una edició posterior invalida només les aprovacions d’eixe hash. La consolidació grava conclusions al Llibre i un rebut de consum de cada rol; sols després del commit corresponent una cua persistent pot arxivar. L’arxivament prepara un manifest origen/destí+hash+commit, pren un pany curt, mou i actualitza índex/relleu, verifica i confirma. Un diari permet reprendre o revertir una interrupció; una clau d’idempotència evita dobles moviments. La regex de categories ha de derivar del mateix catàleg que la taxonomia, i «Activitat en curs» ha de ser una projecció de l’estat, no una segona font de vida. El tractor s’executaria en els esdeveniments crear/avaluar/commit/reprendre, amb un informe només quan cal acció humana; no requerix recordatoris manuals ni un cron per document. Esta passada proposa el disseny, no activa cap procés.

Per a la pròxima passada convé incloure canvis d’àmbit amb resposta tardana (host/sessió/org), desplaçament per teclat i taules en **columna estreta amb viewport ample**. La geometria ha d’acreditar quin element desplaça, no sols que la pàgina no desborda. Un inventari automatitzat de taules de contingut amb criteri d’embolcall evitaria repetir la diferència entre l’espècimen canònic i les taules nues; s’han d’excloure i provar les d’impressió.

Millora del prompt: fixar commit + hash del diff o manifest de producte per a cada evidència; corregir `fonaments-contracte` per al `<pre>` i l’àlies de Shell; distingir mesures de viewport i de columna; exigir `focus → ArrowRight → scrollLeft` i un compte alié opt-in per a la branca de segon destí. La lectura i el consens han de registrar versió/hash de cada informe. La referència a «bloquejos concurrents» no hauria de barrejar la taula de bloquejos personals amb `pg_locks`: el 42P01 reproduït ací és la relació `bloquejos` absent.

IDEA-28 és context de futur: l’assistent vocal crearà esborrany editorial i Card abans de la confirmació de publicació. Esta auditoria no n’implementa veu, inferència ni publicació automàtica. El triatge H1/H2/lead selecciona fonts; no substituïx la lectura completa de les seleccionades.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Execució pròpia | Resultat |
|---|---|
| `npm run test:precommit` | **Codi 0: 156 fitxers, 3.046 Vitest + 259 Node, 0 fallades; 37,061s de paret** (Vitest 34,10s) |
| Vitest dirigit UI/editorial/CSS | **Codi 0: 72 fitxers / 1.108 proves; 64,622s de paret** |
| Vitest addicional Markdown/disseny/CSS després de les esmenes | **Codi 0: 56 fitxers / 886 proves; 74,056s de paret** |
| GestioMembres després de la tria optimista | Codi 0: 26 proves |
| Integritat de claus dels cinc idiomes | Codi 0: 246 proves |
| `npm run lint`, també al tall final | Codi 0; zero errors/avisos |
| PGlite, migració exacta i esquema mínim | 20 comprovacions PASS |
| PoC React/jsdom, hook de titular | Reproduïx C2-01: host, sessió i resposta tardana |
| PoC React/jsdom, consentiment | Reproduïx C2-02 en activació i revocació |
| Chromium en viu | Reproduïx C2-03 abans de l’esmena; pre contingut, noms sencers i vora sòlida confirmats; segona connexió interrompuda |
| `git diff --check` | Codi 0 |

Les 1.108 dirigides inclouen PanellTractors, PanellSentinelles, WikiDePobleSection, ConnectarSection/relacions, GestioMembres, disseny, composició i CSS. Solapen amb altres proves: no se sumen com si foren úniques. No s’ha repetit la suite global de 22.019 declarada per Claude ni s’han certificat les seues fallades preexistents sobre HEAD congelat. La mesura pròpia de precommit continua per damunt dels 30s antics, encara que esta convocatòria demana essencialment el recompte net.

Logs i manifestos: `/tmp/261025_0200_codex_segona_precommit.log`, `…_dirigides.log`, `…_taules_delta.log`, `…_consent_delta.log`, `…_i18n_delta.log`, `…_lint_final.log`, `…_manifest_abans.json`, `…_manifest_tancament.json`. Les PoC que passen reproduïxen defectes; no acrediten que estiguen corregits. Les bateries se solapen i no se sumen com a proves úniques.

**Portes finals pròpies:** `document.mjs check` → `valid:true, errors:[]`; taxonomia del nom, Olivera i `git diff --check` → codi 0. Olivera conserva sis documents vius i assenyala l’índex de 1.044 línies/12 seccions buides.

**Tancament global de només lectura:** `tancament.mjs --check --turn-id torn_68333fac-debb-4924-9a1d-e3edd6e89d0b` → **codi 1, estat planned, 1.350 registres**. Passen Olivera, plantilles, autoritat i skills; fallen LEDGER, segell, Wiki i SCC. Entre les causes: falta el relleu d’este torn al LEDGER ja amb signatura trencada, segell discordant, metadades heretades del Llibre Mestre, canvis compartits de codi fora de l’abast documental i deute d’enllaços/àncores. No s’han resegellat ni relaxat portes. La fi d’esta auditoria no equival a tancament global ni a permís de commit. Evidència: `/tmp/261025_0200_codex_segona_tancament.json`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Cap canvi de producte, commit, push, desplegament ni migració aplicada per Codex. Les escriptures són informe propi, Llibre Mestre, ESTAT i metadades del circuit documental. Els canvis compartits de Claude/MarIA/Gemini es preserven.

PGlite és PostgreSQL embegut amb esquema mínim: sense historial complet ni concurrència real de dues connexions. Chromium és el navegador comprovat, sense Safari/iOS real ni segon destí alié amb opt-in actiu certificat per Codex. La primera pestanya pròpia s’ha tancat amb viewport restaurat. La segona, oberta per a Gestor, ha esgotat dos intents de 30s i el runtime s’ha reiniciat: no s’han pogut completar mesures pròpies de Gestor ni confirmar el reset/tancament manual d’eixa pestanya temporal. No s’ha deixat cap procés de navegador llançat des de terminal. El servidor compartit :3340 queda engegat.

Cap cron ni schedule nou; els subagents i les bateries pròpies han acabat. La consolidació/Acta Marmota conjunta correspon a MarIA i ha d’incorporar els tres P2 abans del commit final.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_0200_pla_implementacio_maquetacio_editorial_didactica_i_ritme_pedra_seca]]
- [[261025_0200_implementacio_claude]]
- [[261025_0200_auditoria_gemini]]
- [[261025_0200_prompt_codex_gemini_gauntlet_loop_segona_passada]]
