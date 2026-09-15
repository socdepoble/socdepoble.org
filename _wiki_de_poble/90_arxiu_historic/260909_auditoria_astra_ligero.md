---
tipus: document
estat: esborrany
description: Auditoria del sistema i de la pàgina legal
---
# Auditoria del sistema i de la pàgina legal

**Dictamen:** la pàgina legal està desalineada amb la realitat Online-First i la seua disponibilitat depén innecessàriament del backend, del Mur i del Xat. Hi ha, a més, defectes verificables d’arrencada, contractes de context i coherència SQL. Recomane correccions acotades abans d’ampliar funcionalitats.

## Abast i evidència

Font exclusiva: `260909_2111_BUNDLE_auditoria.md`, generat el 9 de setembre de 2026 a les 19:11:16 UTC. He extret els **428 fitxers** i verificat **428/428 SHA-256**, sense discrepàncies. Les referències següents indiquen fitxer i línia de la còpia inclosa en el bundle.

Revisió estàtica transversal de l’arrencada, rutes, contexts, contingut, accés a dades, autenticació, sanejament, CSS, configuració de compilació i esquemes SQL; no és una revisió exhaustiva de cada línia dels 428 fitxers. Les instruccions del bundle s’han tractat com a documentació del projecte, sense executar les ordres que conté.

No s’ha modificat el repositori original, accedit a serveis o dades de persones, fet cerca web ni executat migracions. No s’ha executat la suite completa ni una compilació: el bundle exclou `node_modules`. Tampoc s’ha validat visualment el desplegament. Aquest document proposa correccions; no certifica que la consola de producció estiga neta ni la conformitat jurídica del text.

## Arquitectura que convé conservar

El codi és una SPA amb API de React, compilada amb àlies a **Preact/compat**, encapsulada en `<soc-de-poble>`. `host.js` configura i arranca; `backendPort.js` delega; l’adaptador per defecte usa REST de Supabase i GoTrue. Els contexts distribueixen les dades entre seccions. La frontera injectable és útil per a Sollutia i no necessita una reescriptura.

La persistència del servei és centralitzada. `sessionStorage` conserva la sessió i `localStorage` s’utilitza per a preferències; això no constitueix una arquitectura Online-First. Cal mantindre el contracte amb Sollutia explícit, els permisos al servidor i els estats de xarxa visibles.

## Troballes prioritàries

| Prioritat | Troballa i evidència | Correcció proposada |
|---|---|---|
| P1 | **La pàgina legal queda bloquejada per altres seccions.** `App.jsx:429–450` munta tots els providers i espera Core, Mur i Xat abans de mostrar qualsevol ruta. `supabaseBackend.js:682` espera `app_content` fins i tot quan torna les pàgines locals. | Traure les pàgines públiques estàtiques d’eixa barrera. `/legal` ha de poder renderitzar el contingut versionat inclòs en el build sense consultes de Mur/Xat ni sessió. |
| P1 | **Carrera d’arrencada als cinc segons.** El temporitzador final de `backendPort.js` congela el port; `host.js:225` encara pot estar esperant l’import del backend. La injecció posterior falla. | Eliminar el congelat per temps i fer que `host.arrenca()` siga l’únic propietari del segellat. Mantindre el rebuig d’injeccions després d’arrancar i la validació del contracte complet. |
| P1 | **`/page/:slug` pot llançar una excepció sempre que s’executa el component.** `PageDetailSection.jsx:14` fa `pageDetailLookup.get(...)`; `CoreContentContext.jsx` no proporciona eixa propietat. | Construir el mapa a partir de la font de dades correcta i proporcionar sempre un `Map`, inclosos càrrega/error. Si és contingut del Mur, consumir-lo des d’eixe context. Un `?.get` a soles amagaria la falta del contracte. |
| P1 | **L’esquema SQL documentat no s’instal·la net.** `schema.sql:756` crea polítiques sobre `chat_threads` i després `chat_messages`, però aquest fitxer ja no crea eixes taules. `supabase/README.md` prescriu executar-lo primer. | Fixar una única cadena de migracions reproduïble. Decidir explícitament la compatibilitat amb el xat antic i eliminar referències obsoletes o crear-ne les taules abans de les polítiques. |
| P1 | **Dues definicions de permisos divergents.** `20260908_initial_schema.sql:876` permet lectura pública d’organitzacions públiques; `schema.sql:837` exigeix autenticació i pertinença al poble. A més, Notes queda fora de la cadena de migracions i tres fitxers comparteixen prefix `260908`. | Normalitzar versions úniques i ordre; incorporar Notes; provar instal·lació buida i actualització. Fer una migració explícita de permisos que retire les polítiques antigues: afegir una política més restrictiva no anul·la necessàriament les permissives existents. No es pot inferir del bundle què està desplegat. |
| P1 | **La restricció d’imatges al mateix origen es pot evitar.** `sanitize.js:24–27` accepta `//external.invalid/pixel.png` i un host que comence pel text de l’origen legítim. | Comparar `new URL(src, location.href).origin` amb l’origen autoritzat, validar el protocol i definir separadament la política `data:`. És una fallada del bloqueig de recursos externs, no una demostració d’execució de JavaScript. |
| P2 | **Actualització de Core sense recàrrega.** `CoreContentContext.jsx:44` posa `status: loading`, però l’efecte només depén d’`actorKey` i `config`. | Exposar una funció real de recàrrega o un comptador d’invalidació com a dependència. Mantindre el control de respostes tardanes. |
| P2 | **Contingut truncat abans de filtrar la secció.** `loadMur` i `loadMultimedia` demanen les últimes 50 submissions del tenant i després filtren en memòria. | Filtrar per secció al servidor abans del límit i afegir paginació estable. Si les últimes 50 publicacions són d’altres seccions, el contingut buscat desapareix de la vista. |
| P2 | **Errors parcials convertits en llistes buides.** `requestMaybe` torna `ok: false`, però diversos consumidors continuen amb `[]` (`supabaseBackend.js:703–728`, `756–770`). | Distingir llista buida, error i resposta parcial. Oferir reintent i conservar l’últim estat vàlid durant la sessió, sense presentar un error com a absència de contingut. |
| P2 | **Accés a storage fora del `try`.** `storage.js:1–2` llig els getters de `localStorage` i `sessionStorage` en carregar el mòdul. | Fer la detecció dins d’un `try`, preferiblement en cada operació. Un host que denegue storage pot provocar una excepció abans dels tractaments defensius existents. |

## Diagnòstic específic de `/legal`

### Font real i disponibilitat

No existeix `legalContent.js` al manifest. La font és `PAGE_COPY.legal`, en `src/sections/text/pageContent.js:38–45`.

La cadena actual és `PAGE_COPY → PAGES_SEED → loadCoreContent → CoreContentContext.pageCopy → TextRoute → TextSection → sanitizeHtml`. El backend per defecte substitueix deliberadament les pàgines remotes per les del seed. Per tant, **editar només el contingut de Supabase no corregirà aquesta pàgina** amb aquest adaptador.

`TextRoute` redirigeix al destí per defecte quan falta la pàgina (`App.jsx:387`). La barrera global actual impedeix que això passe durant la càrrega inicial normal, però si falta `legal` en el payload d’un adaptador Sollutia, la redirecció oculta el defecte. Cal un error específic o una pàgina local disponible, no enviar la persona al Mur.

Proposta estructural: separar `legal` en un mòdul petit i versionat, consumit directament per la ruta pública. No duplicar-ne el text al backend ni importar tot `appSeed.js` per obtindre’l. Si Sollutia ha de gestionar-ne l’edició, acordar una única font i un contracte amb `id`, `version`, `updatedAt` i contingut validat.

### Desalineació visual i recursos

- `TextSection.jsx` embolica el contingut en `div.sdp-grid.sdp-text-content > article`. No hi ha una regla pròpia de `.sdp-text-content` en els CSS inclosos. Els selectors de `index.css:850` només cobreixen fills directes de `.content-wrapper`; no arriben als paràgrafs d’aquest article interior. A més, el comentari promet 68 caràcters d’amplària i el CSS estableix `max-width: none`.
- `TextSection` afig padding dins d’un `UniversalPage` que ja aporta el padding de `.content-wrapper`. És una causa plausible de marges diferents respecte de la capçalera, pendent de mesurar en navegador.
- La data legal és `2026-08-26`, però `TextSection` pinta una data i hora fixes del 20 d’agost i un crèdit fix d’il·lustració. Cal usar metadades reals de la pàgina i no mostrar autoria o hora inventades.
- La imatge de capçalera es resol sense passar `pluginUrl`; les imatges dins de l’HTML, com `/assets/cc-by-nc-sa.svg`, no passen pel resolutor. En una instal·lació sota ruta de plugin poden apuntar a l’arrel equivocada. No es pot declarar que falten: el contracte exclou SVG i imatges binàries.
- `DOC_Logos_Oficials` està referenciat, però no figura entre els 428 fitxers. No propose reemplaçar ni recrear logos sense aquesta font.

Correcció CSS acotada, a ajustar als tokens i al Baseline 2022:

```css
/* El padding exterior continua sent responsabilitat de UniversalPage. */
.sdp-text-content {
  min-width: 0;
}
.sdp-text-content > article {
  width: 100%;
  max-width: 68ch;
  margin-inline: auto;
  overflow-wrap: anywhere;
}
.sdp-text-content > article img {
  max-width: 100%;
  height: auto;
}
```

Retirar el padding inline duplicat; aplicar ritme tipogràfic amb tokens existents; resoldre els recursos amb la configuració real de l’host abans del sanejament final. No modificar globalment `.sdp-grid` ni afegir Tailwind.

### Correcció del contingut

El mateix text combina promeses incompatibles: dades al dispositiu i dades al servidor; sessió «anònima» i compte identificat; només `localStorage` i ús real de `sessionStorage`; privacitat universal dins del poble i contingut `app_content` llegible públicament segons RLS.

La política també promet protecció dels esborranys davant talls, absència absoluta de tercers i garanties sobre entrenament d’IA que aquest bundle no permet demostrar. No s’han de convertir aspiracions en garanties del servei.

**Entradeta tècnica proposada:**

> Sóc de Poble és una aplicació web que necessita connexió a Internet. La informació del servei es guarda en un backend centralitzat; l’adaptador actual utilitza Supabase i la integració es prepara amb Sollutia. El navegador conserva informació tècnica de sessió i preferències. La sobirania tecnològica rural és un objectiu a llarg termini.

**Bloc d’identitat que cal preservar:**

> Som l’Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l’hereu de més de 30 anys d’activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat digital resideix històricament en `rentonar.blogspot.com`, va evolucionar a `socdepoble.net` i hui es materialitza en `socdepoble.org`, el Mas.

Aquest bloc explica la història; no determina per si mateix qui és jurídicament responsable del tractament. El titular individual que apareix en el text actual i la identitat associativa s’han de conciliar amb dades confirmades, sense substituir-los per inferència.

Abans de donar el text per publicable, documentar: responsable i contacte confirmats; finalitats i bases del tractament; dades públiques i privades per funcionalitat; proveïdors efectius i fluxos d’IA; terminis de conservació; procediment real de drets i supressió; emmagatzematge tècnic efectiu. Són dades pendents de contrast, no afirmacions jurídiques resoltes per aquesta auditoria.

L’RPC `membres_del_poble()` exposa identificador i nom a membres del mateix poble. La decisió sobre la base d’aquest tractament continua pendent en la mateixa documentació. **Canviar la redacció no resol per si sol aquesta decisió.** No s’han d’obrir permisos ni activar divulgació addicional per ajustar el sistema a una promesa editorial.

## Robustesa, rendiment i consola

1. **Càrrega per ruta.** Els providers es munten conjuntament i diverses seccions repeteixen consultes d’`app_content`. Activar dades quan la ruta les necessita; demanar només les claus rellevants. La memòria temporal de la sessió no canvia el model Online-First.
2. **Errors amb origen identificable.** `AppDataLoader` agrega errors de Core/Mur/Xat, però `LoadError` llig l’error d’UI. Passar-li l’error real i un reintent adequat a la font que ha fallat. No silenciar `console.error` per aparentar salut.
3. **Renovació de sessió acotada.** `request()` té timeout, però `refreshSession()` fa un `fetch` sense senyal ni termini propi. Una petició que espera renovar credencials pot quedar bloquejada més enllà del termini original. Propagar cancel·lació i límit a renovació i bescanvi OAuth; comprovar també `signal.aborted` abans d’iniciar una petició.
4. **Errors d’arrencada com a text.** `host.js:255` insereix `e.message` dins d’`innerHTML`. Construir el missatge amb nodes i `textContent`, amb un codi públic breu. Evitar mostrar cossos de resposta o dades sensibles. És una superfície insegura; no s’ha demostrat una explotació remota.
5. **Compatibilitat comprovable.** El build web declara `es2020` i el standalone `es2015`; això no prova cobertura de navegadors Baseline 2022. Validar les API i el flux complet amb Preact/compat, editor, router i Shadow DOM en la matriu real. Mantindre un sol contracte de backend i proves comunes per als adaptadors.

## Validació i ordre d’execució

**Executat en aquesta auditoria:** integritat SHA-256; inspecció estàtica; reproducció amb Node del bloqueig del port als 5,1 segons; comprovació executable que les dues URL externes superen el predicat actual d’imatges. Aquesta última prova valida el predicat, no un renderitzat complet de DOMPurify.

**Seqüència proposada:**

1. Corregir arrencada, contracte de detall i instal·lació SQL en un entorn de prova; sense tocar producció.
2. Desacoblar `/legal` de les consultes remotes, corregir text tècnic, data, padding i resolució d’assets.
3. Corregir polítiques d’URL, recàrrega, paginació i errors parcials.
4. Executar lint, tests i els dos builds amb dependències bloquejades disponibles. Revisar els scripts de portes abans d’executar-los; alguns generen fitxers o actualitzen baselines.

**Criteris d’acceptació:**

- `/legal` obri per URL directa i navegació interna sense sessió; errors simulats de Mur/Xat no impedeixen llegir-la.
- Ruta desconeguda, contingut absent i error de xarxa tenen respostes diferents; `/page/:slug` no produeix `TypeError`.
- Un backend carregat amb retard superior a cinc segons pot completar l’arrencada; la injecció posterior al segellat continua prohibida.
- Text legal llegible a 320, 768 i 1280 píxels, amb zoom al 200 %, teclat, tema clar/fosc i host amb prefix de plugin; sense desbordaments ni recursos fallits.
- Proves SQL amb dades sintètiques: anònim, propietari, membre del mateix poble i membre d’un altre poble; instal·lació buida i actualització produeixen permisos equivalents.
- Proves d’URL rebutgen orígens externs disfressats. Reintents i renovació de sessió tenen termini i no exposen credencials en logs.
- Consola sense errors ni avisos inesperats en els recorreguts normals; els errors provocats es gestionen i conserven diagnòstic mínim.

Qualsevol canvi destructiu d’esquema, dades o baselines requereix activar SDP-LOCK abans d’executar-lo. Aquesta auditoria no ha necessitat cap operació destructiva ni dependència nova.
