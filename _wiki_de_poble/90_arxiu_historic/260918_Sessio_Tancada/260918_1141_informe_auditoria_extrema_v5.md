---
type: informe
status: actiu
description: Auditoria extrema V5 amb refutacio adversarial; 71 defectes confirmats i veredicte 5/10 per a la frontera Sollutia
tags:
  - govern
  - arquitectura
  - sollutia
---

# Auditoria Extrema V5 — Informe de Claude (Opus 5 Ultracode)

## 0 · Les dues respostes que demanaves

**«Ens queda alguna via d'aigua asíncrona oculta?»** — Sí. **71 defectes confirmats**, 10 d'ells de gravetat màxima. Tres de les vuit correccions d'ahir no fan el que es creia.

**«Podem donar-li el 10/10 a la integració amb Sollutia?»** — **No. La nota honesta és 5/10.** L'esquelet de l'enxufabilitat és sòlid; la pell que toca Sollutia està foradada en tres punts visibles al primer minut d'una demostració, i les tres portes que havien de vigilar-la passen en verd.

---

## 1 · Com s'ha fet (i per què et pots fiar del número)

- **Tall congelat.** Es va copiar l'arbre sencer a un directori aïllat abans de començar. Empremta determinista `f1b276c0`, 218 fitxers a `src/`. En acabar, `diff -rq` entre el tall i l'arbre viu: **zero diferències**. Cap cita d'aquest informe apunta a codi que haja canviat mentre s'auditava.
- **Cacera.** 12 auditors per fitxers + 6 auditors per fluxos + 1 crític de completesa.
- **Refutació adversarial.** Cap troballa entra ací sense haver passat per un escèptic independent amb l'ordre explícita de **tombar-la** i la instrucció de marcar-la com a falsa en cas de dubte.
- **El filtre ha mossegat:** **27 troballes descartades**, una d'elles per citar codi que no existia. Inclosa una que jo mateix havia donat per bona.
- **118 agents completats** en 4 tandes, ~9,3 milions de tokens. (Una primera tanda va perdre 73 refutadors per límit de sessió; es van rellançar tots, cap troballa va quedar sense escèptic.)

**Fets executats, no deduïts:**

| Comprovació | Resultat |
|---|---|
| `npx vitest run` | **1 prova en roig** de 47 — `NotesDataContext.test.jsx` |
| Reproduïda en worktree net a HEAD | Sí: el roig ve del commit `67205a74`, no d'avui |
| `npx eslint src` | 0 errors, 219 avisos |

La prova roja és per una raó que importa més que la prova: el `vi.mock` no declara `getCurrentUser`, que es va afegir a `NotesDataContext.jsx:2`. El `TypeError` resultant cau dins del mateix `catch` que un error de xarxa (`NotesDataContext.jsx:38`) i es pinta com **«Error de connexió»**. Un error de programació i una caiguda de xarxa són indistingibles per a l'usuari.

---

## 2 · Les vuit correccions d'ahir, una per una

| # | Correcció declarada | Veredicte |
|---|---|---|
| 1 | IDs de Perfil (`creaOrg` torna `org.id + "-nom"`) | **Irrellevant.** El contracte d'ids està bé, però `creaOrganitzacio` no pot crear res: mai envia el `slug` que la RPC exigeix. Es corregia la porta d'una casa sense fonaments. |
| 2 | Carpetes vs etiquetes a Notes (`groupId`) | **A mitges.** La fontaneria funciona i `NotesSection` ja envia `{categories}`/`{tags}`… i `notes.js:39-40` els tira a la brossa. |
| 3 | Fantasmes de text antic | **En codi mort.** `NotesContext` importa `updateNote` de `backendPort` i no del context. Ningú de tot `src/` crida l'`updateNote` corregit. El fantasma continua viu. |
| 4 | Serialització del debounce (`noteLocks`) | **Feta i correcta.** Cap escèptic l'ha tombada. |
| 5 | Selecció post-creació (`createGenerationRef`) | **Feta**, verificada per mi a `UniversalWorkspace.jsx:267`. Però la guarda descarta el *resultat*, no la *creació*: cada premuda de més deixa una nota òrfena invisible. |
| 6 | Neteja i desmuntatge de la `saveQueue` | **Feta, i el remei és el mal.** El desmuntatge resol les promeses a `false` i **llança el desat pendent** en compte d'enviar-lo. |
| 7 | Trampa de focus en tauleta | **Incompleta.** Queden quatre trampes de focus i un botó «Replegar» visible en tauleta que no fa res. |
| 8 | Portabilitat React / Strict Mode | **Feta i sòlida.** Verificada per mi (`mountedRef` es reposa a la línia 270) i els intents de tombar la puresa de `AppGridShell` i `NotesContext` han fracassat tots. **L'única que aguanta sencera.** |

---

## 3 · Defectes confirmats (67)

### Gravetat màxima · trenquen dades o menteixen a l'usuari (10)

**`src/sections/profile/PerfilContext.jsx:183`** — creaOrganitzacio mai envia el slug: el botó NOVA ORG no pot crear res

- **Què passa:** La càrrega útil per defecte de creaOrganitzacio no porta `slug`, i el RPC create_organization exigeix p_slug (sense default) i el valida contra una regex, així que la crida sempre falla i cap organització nova arriba mai a existir.
- **Què veu la persona:** A la secció Perfil (/jo/el-meu-perfil), a la columna IDENTITATS, la persona prem el botó «NOVA ORG». El botó passa un instant a l'estat de creació i torna a «NOVA ORG». No apareix cap identitat nova a la llista, i no es mostra cap missatge d'error ni cap avís a la pantalla, perquè PerfilShell.jsx:103-105 captura l'excepció i només fa `console.error` i retorna null. Des del punt de vista de l'usuari el botó simplement
- **Reproducció:** Estat inicial: sessió iniciada, secció Perfil (/jo/el-meu-perfil), columna IDENTITATS amb «El meu compte». Acció: prémer el botó «NOVA ORG». Resultat erroni: el botó passa a «CREANT…» i torna a «NOVA ORG»; no apareix cap identitat nova a la llista IDENTITATS, no hi ha cap missatge d'error a la pantalla. `p_slug` és und

**`src/sections/notes/NotesContext.jsx:130`** — L'autoguardat esquiva updateNote de NotesDataContext i el text fantasma continua viu

- **Què passa:** saveNoteField crida la funcio updateNote importada directament de backendPort, no la de useNotesData(), aixi que payload.notes mai s'actualitza; quan despres s'esborren els overrides locals, l'editor i la llista tornen al text carregat a l'arrencada.
- **Què veu la persona:** Escrius dins d'una nota, pares de teclejar i al cap d'aproximadament 1,4 segons (800 ms de debounce de tiptap + 600 ms del debounce de saveNoteField + el PATCH) el text que acabes d'escriure desapareix tot sol davant dels teus ulls: l'editor torna a mostrar el contingut tal com estava quan es va carregar l'aplicacio, i la fitxa de la llista de notes tambe torna al text vell. Al servidor si que s'ha guardat bé, pero l
- **Reproducció:** 1) Obri una nota amb contingut '<p>Hola</p>'. 2) Escriu ' mon' i para de teclejar. 3) Als 800 ms el flush de tiptap (useUniversalRichText.js:36-48) buida pendingSaveRef i crida saveNoteField. 4) Als 600 ms mes el PATCH va be i el bloc de les linies 133-142 esborra l'override de 'content' perque coincidix amb payload. 5

**`src/data/supabase/notes.js:56`** — Cap resincronitzacio de revision despres d'un 409 o d'un temps d'espera

- **Què passa:** Quan el PATCH no casa amb la revisio (conflicte real) o quan la peticio talla per timeout amb l'escriptura ja aplicada al servidor, el client no torna a llegir la revisio ni recarrega; knownRevisions i rawNotes queden desfasats per sempre i totes les gravacions posteriors d'eixa nota fallen en bucle.
- **Què veu la persona:** A partir del primer conflicte o del primer timeout amb escriptura aplicada, l'usuari continua escrivint a la nota amb normalitat (el text apareix a la pantalla perque ve de l'esborrany local), pero cada 600 ms de pausa li salta el toast roig 'Conflicte: la nota s'ha actualitzat en un altre dispositiu.' (o 'El canvi no ha arribat al servidor. Reintenta-ho.' si va ser per timeout), una vegada darrere d'una altra mentre
- **Reproducció:** Cami A (timeout): escriu en una nota amb cobertura dolenta fins que el PATCH passe dels 12000 ms; el servidor aplica el canvi i puja revision de 3 a 4, pero el client rep TimeoutError i no actualitza knownRevisions. Cami B (conflicte): obri la mateixa nota en dos pestanyes i escriu primer a la B. En ambdos casos, a par

**`src/data/oauthRelay.js:218`** — El camí 2 d'OAuth mai s'activa: la clau de localStorage no coincideix

- **Què passa:** El vigilant de l'esdeveniment `storage` compara `e.key` amb la clau sense prefix, però qui escriu el valor fa servir `setVal`, que prefixa totes les claus amb `sdp_embed_`; per tant el codi d'autorització que l'emergent deixa a l'emmagatzematge no es replega mai.
- **Què veu la persona:** A un navegador on Google talla l'`opener` amb COOP (el cas que el comentari de les línies 215-216 declara real), la persona clica «Entrar amb Google» a l'onboarding, completa l'entrada dins l'emergent, i l'emergent es tanca sola. La finestra principal no entra mai: com que `perStorage` ix a la primera línia, el `vigilant` de la línia 233 detecta `emergent.closed` i mostra el missatge d'error «S'ha tancat la finestra 
- **Reproducció:** Estat inicial: sessió tancada, navegador on Google talla l'`opener` amb capçaleres COOP (el cas que el comentari de les línies 215-216 diu que «passa de veres; no és teòric»). Acció: a /registre, clicar «Entrar amb Google» i completar l'entrada a l'emergent. El relé torna, `gestionaTornada` no pot cridar `window.opener

**`src/components/universal/workspace/WorkspaceContext.jsx:133`** — L'enllaç profund a una nota es perd en muntar

- **Què passa:** L'efecte de reconciliació i l'efecte de `selection/sync` es declaren en el mateix component i es buiden en la mateixa tanda, tots dos tancats sobre el MATEIX objecte `state` del render; la reconciliació encara veu `activeItemId: null` i `needsInitialSelection: true` quan el sync ja ha despatxat l'ID de la URL, i tria el primer element de la llista, que és l'últim despatx que guanya.
- **Què veu la persona:** Amb les notes ja carregades (tornar a Notes des del Xat, endarrere del navegador, o clicar qualsevol enllaç intern /jo/notes?nota=X), l'editor obri la PRIMERA nota de la llista en compte de la nota X, i la fila seleccionada de la columna central és també la primera. A més, `emitSelection(..., 'reconcile')` crida handleSelectionChange amb reason 'reconcile', que fa `setParams(next, { replace: true })` (NotesSection.js
- **Reproducció:** Estat inicial: sessió oberta, Notes ja carregades (NotesDataProvider viu per damunt del Router, així que `status` ja val 'ready'). Estar a Notes amb la nota X oberta; la URL diu `/notes?nota=X` i X NO és la primera de la llista. Acció: anar al Xat i tornar a Notes (o obrir qualsevol enllaç intern `/notes?nota=X`). Resu

**`src/components/universal/AvisadorEfimer.jsx:46`** — Els avisos es munten fora del shadow root i es pinten nus

- **Què passa:** La resolució del punt de muntatge dels toasts no pot arribar mai al shadow root (és `mode: 'closed'`, on `.shadowRoot` és sempre `null` per especificació), així que cau al darrer recurs `document.body`, on no existix cap regla de `.sdp-avisador-efimer` ni cap token `--sdp-*`.
- **Què veu la persona:** Cada avis de l aplicacio (desar una nota, un missatge de xat fallit, una publicacio rebutjada) deixa de ser la pastilla flotant centrada a baix. El div s afig al final del `<body>` de la pagina amfitriona, fora de l arrel tancada, sense `position: fixed`, sense fons, sense vora, sense ombra i sense el color ni el pes tipografic del sistema: nomes una linia de text pelat amb la tipografia heretada del document. En sta
- **Reproducció:** 1) Incrusta `<soc-de-poble>` en qualsevol pàgina de Sollutia (o obri l'app standalone, on `document.querySelector('.sdp-root')` retorna el `<body class="sdp-root">` de index.html, igualment fora de l'arrel tancada). 2) Fes qualsevol acció que cride `showToast` (guardar una nota, una publicació rebutjada, un missatge de

**`src/sections/notes/NotesContext.jsx:137`** — El desat correcte torna el text d'abans: l'esborrany es lleva i rawNotes no es refresca mai

- **Què passa:** Quan el PATCH va be, l'actualitzador esborra l'override del camp precisament perque coincidix amb el payload desat. A partir d'eixe moment la nota torna a llegir-se de `rawNotes`, que cap cami no actualitza mai (saveNoteField crida `updateNote` del backendPort, NotesDataContext.updateNote no es destructura a la linia 48, i res no dispara `sdp:refresh-data` despres d'un desat). La unica copia bona queda a la base de d
- **Què veu la persona:** La persona escriu dins d'una nota, para de teclejar, i al cap d'un segon i mig llarg veu com el text que acaba d'escriure desapareix tot sol de l'editor i de la fitxa del llistat, que tornen a mostrar la versió anterior (encara que a Supabase sí que s'ha desat la bona). Sembla que el desat ha fallat. Si continua escrivint damunt d'eixe text revertit, el següent desat sobreescriu la base de dades amb la versió vella m
- **Reproducció:** Estat inicial: nota carregada de Supabase amb contingut «vell» (rawNotes.content = «vell», revision 1). Accio: escriure « nou» dins de l'editor ric i parar de teclejar. Resultat observable: als ~800 ms el hook fa flush i crida saveNoteField; als ~600 ms mes ix el PATCH, torna 200 i savedNote.revision passa a 2; tot seg

**`src/sections/detail/PageDetailSection.jsx:15`** — /page/:slug peta sempre: pageDetailLookup no existix enlloc

- **Què passa:** PageDetailSection llig `pageDetailLookup` de useCoreContent(), pero CoreContentContext no el publica ni al valor llest ni al de reserva: el camp no es crea en cap fitxer del projecte. Per tant `pageDetailLookup` es undefined i la crida `.get()` llança un TypeError al primer render, abans de l'efecte de retorn a dalt i abans de qualsevol comprovacio. La ruta /page/:slug no ha funcionat mai; el que veu l'usuari es el c
- **Què veu la persona:** Qui pitge un resultat de pàgina no mapejada (o òbriga directament /page/el-que-siga) no veu mai el contingut: la zona principal es reemplaça pel cartell d'error «Hi ha hagut un problema / Aquesta secció no ha pogut carregar-se correctament», amb el <pre> «Cannot read properties of undefined (reading 'get')» i el botó «Intentar de nou», que en tornar a provar peta igual. El títol de la pestanya tampoc s'actualitza i n
- **Reproducció:** Estat inicial: app arrancada amb qualsevol backend (llavor o remot), Core en estat 'ready' o 'loading', tant fa. Accio: obrir /page/el-que-siga (per exemple des d'un resultat del Cercador, on resolveItemPath torna `/page/<slug>` per a tot item de tipus 'page' amb slug desconegut — src/config/navigation.js:54-57). Resul

**`src/config/navigation.js:38`** — Totes les targetes obrin una ruta que no existix: getSectionItemPath torna camins d'arrel i el detall viu sota l'actor

- **Què passa:** getSectionItemPath construix `/{seccio}/{id}` a l'arrel, pero l'unica ruta que pinta ItemDetailSection es `:sectionId/:itemId` dins d'ActorRoutes, que nomes esta muntada sota /jo/* i /e/:slug/*. A l'arrel no hi ha cap ruta amb dos segments per a mur, mercat, pobles, multimedia ni events, i el comodi les engoleix totes. Cada targeta del Mur, del Mercat, de Pobles i de Multimedia, i cada resultat del Cercador, porten a
- **Què veu la persona:** Una persona és al Mur (tant a /mur com a /jo/mur), clica qualsevol publicació —la targeta sencera és un enllaç— i en lloc del detall veu una pàgina que diu «Ací no hi ha res / Error 404» amb un botó «Tornar a l'inici», amb la URL /mur/<id>. El mateix passa en clicar qualsevol producte del Mercat, qualsevol poble (a Pobles i a la taula del cens de Població), qualsevol foto de Multimèdia i qualsevol resultat del Cercad
- **Reproducció:** Estat inicial: qualsevol usuari, a /mur o a /jo/mur, amb el Mur carregat i almenys una publicacio. Accio: clicar la targeta (la capa d'enllac que cobrix tota la targeta). Resultat erroni observable: el navegador va a /mur/<id>, cap ruta de primer nivell hi casa i es pinta NotFoundPage. Identic amb /mercat/<id>, /pobles

**`src/sections/connectar/ConnectarSection.jsx:23`** — El commutador «Privada» de Connectar no arriba mai al cami de lectura: tot es publica al Mur public

- **Què passa:** Connectar presenta un commutador de privacitat amb cadenat que arranca en «Privada» per defecte i escriu `isPrivate` dins del payload. Cap consumidor el llig: ni el mapejador, ni loadAppData, ni el Mur, ni la politica RLS de lectura, que nomes tracta a banda la seccio 'notes'. Una publicacio marcada «Privada» acaba al feed public del poble, visible per a qualsevol membre del tenant.
- **Què veu la persona:** A /connectar la persona veu el bloc «Privacitat de la connexió» amb el botó «Privada» ja actiu i amb cadenat, i sota el text d'estat «Privada». Escriu títol i descripció, tria «Mur» i prem el botó de connectar. Creu que ha desat una publicació privada, però qualsevol altre membre del mateix poble que òbriga /mur la veu a la graella del feed com una publicació més, amb el seu nom, el seu poble i el text sencer. No hi 
- **Reproducció:** Estat inicial: usuari amb sessio i membre del poble, a /connectar, amb el commutador tal com arranca («Privada», cadenat actiu). Accio: triar l'area «Mur», escriure titol i descripcio i prémer «Guardar i anar a Mur». Resultat erroni observable: la publicacio queda desada a section_submissions amb payload.isPrivate = tr


### Comportament incorrecte visible (38)

**`src/css/tokens.css:20`** — `:host` perd display:block, height:100% i overflow:hidden per la capa de tokens

- **Què passa:** `tokens.css` declara `:host { all: initial }` FORA de qualsevol `@layer`, i les declaracions sense capa guanyen sempre contra qualsevol capa; per tant anul·len el `display: block; height: 100%; overflow: hidden; contain: layout style` que `base.css` posa a `:host` dins de `@layer reset`. L'únic que salva el muntatge avui és una regla del document amfitrió escrita a mà a index.html.
- **Què veu la persona:** En una pàgina amfitriona que no escriga cap CSS per a l'etiqueta (el cas documentat a src/host.js i INTEGRACIO.md), el `<soc-de-poble>` queda amb `display: inline` i `height: auto`, perquè `all: initial` sense capa mata el `display:block; height:100%` de base.css. La persona obri la pàgina de Sollutia i, en comptes de l'app omplint la ranura, veu una franja col·lapsada a l'alçada del contingut: la graella s'aixafa (e
- **Reproducció:** 1) Posa `<soc-de-poble supabase-url="..."></soc-de-poble>` dins d'una pàgina de Sollutia que no afegisca cap regla CSS pròpia per a l'etiqueta (és el cas documentat a src/host.js, on l'únic que es demana al host és cridar `configura()` i `arrenca()`). 2) El càlcul final de l'element amfitrió és `display: inline; height

**`src/sections/profile/PerfilShell.jsx:99`** — creaOrg s'empassa l'error de creació i la pantalla no diu res

- **Què passa:** creaOrg captura qualsevol error i torna null; UniversalWorkspace només actua si `created?.id != null` i no té branca else, i PerfilShell tampoc passa onCreateError, de manera que qualsevol fallada de creació és invisible per a la persona.
- **Què veu la persona:** A Perfil, la persona prem «NOVA ORG» amb la xarxa caiguda, sense sessió vàlida o amb qualsevol error del servidor (per exemple un conflicte de slug). El botó passa a l'estat «creant» i torna sol a la normalitat (setCreating(false) al finally); la llista d'IDENTITATS es queda igual, la columna de detall no canvia, no apareix cap alerta ni cap text d'error enlloc. L'única traça és un console.error que la persona no veu
- **Reproducció:** Estat inicial: Perfil obert. Acció: prémer «NOVA ORG» amb la xarxa caiguda (o amb qualsevol error del servidor, inclòs el del slug de la troballa anterior). Resultat erroni: el botó parpelleja «CREANT…» i torna a l'estat normal; cap alerta, cap text a la columna de detall, cap indicació que res haja fallat. El catch de

**`src/sections/profile/PerfilContext.jsx:57`** — «Veure la fitxa pública» porta a una ruta que no existeix

- **Què passa:** L'ajust 'fitxa' construeix la ruta amb el slug i sense el prefix d'actor (/empresa/<slug>), però les rutes empresa/:agentId i grup/:agentId viuen dins d'ActorRoutes, muntat a /jo/* i /e/:slug/*; a l'arrel no hi ha cap /empresa, així que cau al comodí NotFoundPage.
- **Què veu la persona:** Una persona que administra o pertany a una organització obre Perfil, tria l'organització a IDENTITATS i entra a l'ajust «Fitxa pública». Prem el botó «Veure la fitxa pública» i el navegador canvia la URL a /empresa/<slug> (o /grup/<slug>), però el que es pinta és la pàgina de NotFoundPage: mai no arriba a veure la fitxa pública de la seua organització. La URL queda a l'historial, així que tornar enrere és l'única eix
- **Reproducció:** Estat inicial: persona membre d'una organització (per exemple slug 'forn-del-poble'), Perfil obert, categoria de l'organització triada a IDENTITATS. La fitxa de l'ajust ja mostra com a subtítol el text «/empresa/forn-del-poble». Acció: triar l'ajust «Fitxa pública» i prémer «Veure la fitxa pública». Resultat erroni: el

**`src/sections/profile/DetallAjust.jsx:61`** — Les edicions de la capçalera del perfil es perden sense avís

- **Què passa:** desaCampClosca crida guardarCampPerfil sense await ni catch, i la capçalera editable de UniversalEditorShell es pinta per a qualsevol identitat (també quan el catàleg ha marcat els ajustos com a tancats), així que una desada rebutjada pel servidor acaba en un unhandled rejection amb el text nou encara a la pantalla.
- **Què veu la persona:** Una persona que només és membre (ni owner ni admin) d'una organització obri Perfil, tria eixa organització i clica l'ajust «Nom». Al formulari de baix llig «Només qui administra aquesta organització ho pot canviar», però el títol gran de la capçalera continua deixant-se escriure. Clica damunt, escriu «Associació Nova» i fa clic fora. El títol nou es queda pintat en pantalla, sense cap missatge d'error ni cap indicado
- **Reproducció:** Estat inicial: persona amb rol 'member' (ni owner ni admin) d'una organització; Perfil obert amb eixa organització triada. El formulari de l'ajust «Nom» ja mostra «Només qui administra aquesta organització ho pot canviar», però el títol gran de la capçalera continua sent contentEditable. Acció: clicar damunt del títol 

**`src/sections/notes/NotesContext.jsx:145`** — knownRevisions no es neteja mai despres d'un 409 ni d'una recarrega externa

- **Què passa:** knownRevisions nomes s'escriu quan el desat te exit i no s'esborra ni al catch ni quan NotesDataContext torna a carregar les notes, aixi que una revisio caducada deixa la nota bloquejada en un bucle de conflicte del qual nomes es surt recarregant la pagina sencera.
- **Què veu la persona:** Amb dues pestanyes/dispositius oberts (o amb l'amfitrió Sollutia editant), en acabant que l'altre escriptor toque la nota, l'usuari que ja l'havia desada alguna vegada en aquesta sessió veu el toast roig "Conflicte: la nota s'ha actualitzat en un altre dispositiu." cada ~1,4 s mentre escriu (800 ms de DocumentEditor + 600 ms de NotesContext), una vegada rere l'altra. El text continua visible perquè queda a localNoteO
- **Reproducció:** 1) Dispositiu A desa la nota amb exit -> knownRevisions[nota] = 4. 2) Des d'un altre dispositiu (o des de l'amfitrio Sollutia) la nota passa a revisio 5. 3) L'amfitrio dispara la recarrega externa: rawNotes ja porta revisio 5, pero knownRevisions segueix a 4. 4) A partir d'aci, cada pausa de 1,4 s mentre l'usuari escri

**`src/sections/notes/NotesContext.jsx:209`** — obriConfiguracioNotes es un console.log pero pinta un boto de configuracio real

- **Què passa:** El context exporta obriConfiguracioNotes com una funcio que nomes escriu a la consola, i NotesSection la passa com onManageCategories, cosa que fa que UniversalWorkspace renderitze una icona de rodeta 'Configurar categories' que no fa absolutament res.
- **Què veu la persona:** A la seccio Notes, a la capcalera de la columna CARPETES (i tambe quan la columna esta plegada) es veu una icona de rodeta activa, no atenuada, amb tooltip i aria-label 'Configurar categories'. En clicar-la no passa absolutament res visible: no s obri cap panell ni modal, no ix cap toast d avis, no canvia la seleccio ni la llista de carpetes. L unic efecte es una linia a la consola del navegador, que la persona no ve
- **Reproducció:** Obri la seccio Notes. A dalt de la columna CARPETES apareix la icona de rodeta amb etiqueta 'Configurar categories' (tambe quan la columna esta plegada). En clicar-la no s'obri cap panell, no ix cap avis i no canvia res a la pantalla: nomes queda una linia a la consola del navegador. El boto existix perque la comprovac

**`src/data/supabase/notes.js:39`** — createNote tira categories i tags a la brossa

- **Què passa:** El cos del POST nomes envia id, tenant_id, owner_user_id, folder_id, title i content; quan NotesSection crea una nota des d'una categoria o una etiqueta, eixos camps es perden en silenci i la nota naix fora del filtre que l'usuari estava mirant.
- **Què veu la persona:** A Notes, amb la categoria 'Receptes' seleccionada a la barra lateral, l'usuari prem 'CREAR NOTA'. La nota es crea i s'obri a l'editor, però la selecció de la barra lateral salta sola de 'Receptes' a 'Altres notes' i la llista d'items canvia sota els peus. Si torna a clicar 'Receptes', la nota acabada de crear no hi és: ha nascut sense cap categoria. El mateix passa amb les etiquetes. L'usuari ha de reobrir la nota i 
- **Reproducció:** A Notes, clica la categoria 'Receptes' (o una etiqueta) a la barra lateral i despres 'CREAR NOTA'. createNote crea la fila sense categories, torna folderId 'f-notes', toWorkspaceNote li posa categoryIds ['f-notes'] i WorkspaceContext.jsx:148-150 canvia la seleccio de la barra lateral a 'Altres notes'. Resultat visible:

**`src/data/supabase/utils.js:18`** — handleError no torna cap camp message i tots els errors ensenyen el text generic

- **Què passa:** handleError torna { error, code, details } i mai una propietat message, pero sis llocs fan handleError(error)?.message || 'text generic'; l'expressio sempre val undefined i el motiu real de l'error (sessio caducada, sense permis, xarxa) no arriba mai a l'usuari.
- **Què veu la persona:** A la llista de converses del xat, quan una crida falla l'usuari sempre llig el mateix avis fix segons la funcio que ha fallat ("Error al carregar converses", "Error al carregar missatges", "Error a l'enviar el missatge"), independentment de la causa. XatContext.jsx:178 fa setAvis(error?.message || ...) i XatSection.jsx:284 el pinta dins .xat-item-preview, aixi que el text generic arriba literalment a pantalla. Amb el
- **Reproducció:** Deixa caducar el JWT i envia un missatge al xat. handleError classifica be l'error com SESSIO_CADUCADA amb details.message 'La sessio ha caducat. Si us plau, torna a iniciar sessio.', pero xat.js:68 llig .message del primer nivell, que es undefined, i llanca 'Error a l'enviar el missatge'. Resultat visible: l'usuari ve

**`src/data/supabase/runtime.js:100`** — Les notes de llavor sempre es llisten pero no es poden guardar mai

- **Què passa:** mapContentRowsToData injecta sempre APP_SEED.notes a la llista, amb ids que no son uuid ('n1'), i updateNote les envia contra /rest/v1/notes?id=eq.n1, una columna uuid; l'usuari pot obrir-les i escriure-hi pero cap canvi no es guardara mai, i el missatge d'error l'enganya.
- **Què veu la persona:** Amb el backend remot configurat, a Notes sempre apareix la nota de benvinguda "Bloc de notes" dins la carpeta "Mur" (encara que l'usuari no tinga cap nota al servidor). L'usuari pot obrir-la i escriure-hi normalment: el text es veu a la pantalla i es guarda al rascador local (sdp_notes_drafts), però 600 ms després de cada canvi apareix el toast roig "El canvi no ha arribat al servidor. Reintenta-ho." i el canvi no es
- **Reproducció:** Entra a Notes amb el backend remot configurat i obri la nota de benvinguda 'Bloc de notes' (id 'n1'), que ix sempre a la carpeta 'Mur'. Escriu qualsevol cosa. El PATCH ix contra id=eq.n1 sobre una columna uuid: PostgREST respon 400 (invalid input syntax for type uuid) i el toast diu 'El canvi no ha arribat al servidor.

**`src/components/layout/AppGridShell.jsx:73`** — El llindar minAmple no mira si les columnes estan replegades

- **Què passa:** measure() calcula el punt de tall entre 'ample' i 'mitja' amb columnWidths.left + columnWidths.middle, pero quan l'usuari replega una columna l'amplaria real passa a ser --app-grid-col-collapsed (56px); el llindar continua demanant l'espai de les columnes desplegades i la graella de 3 columnes s'abandona amb espai de sobra.
- **Què veu la persona:** Una persona que treballa amb la finestra a mitja pantalla (per exemple 1000-1080 px, tipic en pantalla dividida) replega CATEGORIES i ELEMENTS per guanyar espai al detall. Mentre la finestra siga de 1090 px o mes, veu els dos carrils estrets de 56 px i el detall ample. En el moment que encongix la finestra per davall de 1090 px (o si simplement obri Notes/Admin ja a eixa amplaria), la graella salta a mode tauleta sen
- **Reproducció:** 1) Obri Notes (o Admin) en una finestra de 1150 px: minAmple = max(1090, 270+300+320+2) = 1090, mida = 'ample'. 2) Prem 'Replegar CATEGORIES' i 'Replegar ELEMENTS': les dues columnes queden en carrils de 56 px i el detall ocupa 1038 px. 3) Encongix la finestra fins a 1050 px. Resultat erroni: measure compara 1050 < 109

**`src/components/layout/AppGridColumn.jsx:111`** — El boto Replegar es visible en tauleta i no fa res

- **Què passa:** La utilitat d-desktop-only nomes es neutralitza a data-layout="estret", pero l'efecte de replegar nomes s'aplica a mida === 'ample'; en 'mitja' el boto es pinta, es clicable, canvia state.collapsed i no produeix cap canvi visible, i el canvi latent es materialitza mes tard quan la finestra torna a ser ampla.
- **Què veu la persona:** Amb la finestra entre 720 px i el llindar d'ample (mín. 1090 px, data-layout="mitja"), la capçalera de la columna ELEMENTS mostra el botó d'icona "Replegar ELEMENTS" (PanelLeftClose). L'usuari el prem i la pantalla no canvia gens: la columna d'ELEMENTS continua exactament igual d'ampla, no apareix cap carril replegat i no hi ha cap indicació que haja passat res; el focus es queda al mateix botó perquè focusAfterLayou
- **Reproducció:** 1) Finestra de 900 px (mida = 'mitja'). 2) A la capcalera de la columna d'ELEMENTS prem el boto 'Replegar ELEMENTS' (hi es, perque d-desktop-only nomes s'apaga en 'estret'). Resultat erroni immediat: no passa absolutament res en pantalla i el focus tampoc es mou, perque focusAfterLayout(expandBtnRef) apunta a un boto q

**`src/app/contexts/SessionContext.jsx:58`** — El temporitzador de renovació del JWT només s'arma una vegada

- **Què passa:** El setTimeout de renovació crida sincronitza(), però sincronitza() no canvia cap de les dependències de l'efecte que el va crear, així que l'efecte no es torna a executar i no es reprograma cap temporitzador nou: la cadena de renovació mor després del primer dispar.
- **Què veu la persona:** Amb la pestanya oberta i visible una hora seguida, el JWT caduca sense que res el renove. La interfície continua pintant l'usuari com si estiguera dins (l'estat React encara diu 'dins' amb l'usuari vell), però `usuariDeSessio()` ja torna null perquè rebutja el token caducat. Llavors: les accions que passen per `getCurrentUser()` abans de fer cap petició fallen en sec amb missatges d'error de sessió — per exemple, cre
- **Reproducció:** 1) Entra amb usuari i deixa la pestanya visible (mai amagada, mai offline). El JWT de Supabase dura 3600 s, així que espera = 3540000 > 600000 i el temporitzador es capa a 10 min (línia 60). 2) Al minut 10 el callback comprova caducitatJwt() <= ara+60s → fals → crida sincronitza(). setUsuari rep un objecte nou (getEfim

**`src/app/contexts/UIContext.jsx:19`** — UIProvider llig externalConfig només al muntatge: setLanguage() i setTheme() de l'element són morts

- **Què passa:** language i themePreference s'inicialitzen amb inicialitzadors mandrosos a partir d'externalConfig i cap efecte del fitxer torna a llegir externalConfig, així que els canvis de configuració de l'amfitrió posteriors al muntatge (element.setLanguage(), element.setTheme(), reassignació de element.config) no arriben mai a l'estat de React.
- **Què veu la persona:** Amfitrió que incrusta <soc-de-poble> en català i crida element.setLanguage('es'): la pantalla no canvia ni una paraula — menús, botons, títols i missatges continuen en català. No salta cap error ni cap avís a la consola, i tampoc es dispara l'esdeveniment sdp:language-changed (línia 37), així que qualsevol codi de l'amfitrió que espere eixe senyal per sincronitzar la resta de la pàgina es queda penjat: la persona veu
- **Reproducció:** Idioma: 1) L'amfitrió incrusta <soc-de-poble> sense language i l'app arranca en català. 2) L'amfitrió crida document.querySelector('soc-de-poble').setLanguage('es'). 3) _render() torna a pintar amb language='es', uiConfig passa a { ..., language: 'es' } i UIProvider es re-renderitza — però l'estat language continua sen

**`src/app/App.jsx:504`** — Un Core en error es pinta com «no hi ha agents», sense cap avís

- **Què passa:** AppRoutes extrau només agents de useCoreContent i el passa com a prop nua; quan la càrrega del Core acaba en error el valor és [] igual que quan encara carrega, i les seccions que el reben no tenen manera de distingir «ha fallat» de «està buit», així que pinten un directori buit sense cap missatge.
- **Què veu la persona:** Amb Supabase inaccessible (o sense credencials/tenantId), qui obri /jo/perfil o /connectar veu la pàgina completament muntada — capçalera, títol «Agents i persones» i subtítol «Directori de persones, grups i agents del portal.» — amb la graella `feed-grid` totalment buida: cap espinner, cap avís, cap missatge d'error i cap botó de reintentar (el `refresh` existeix al context però no arriba a la pantalla). És visualme
- **Reproducció:** 1) Talla la xarxa cap a Supabase (o fes que loadCoreContent llance) i obri /jo/perfil o /jo/gent/carla. 2) CoreContentProvider acaba amb status 'error' i el value de la línia 45 dona agents: []. 3) AppRoutes passa agents={[]} a ProfileSection (App.jsx:573-578) i a ConnectarSection (App.jsx:529, que també fa `{ agents =

**`src/data/supabase/xat.js:68`** — Tots els errors del xat i de la pujada de fitxers es converteixen en un text genèric

- **Què passa:** `handleError()` torna un objecte `{ error, code, details }` que no té mai la propietat `message`, però sis llocs fan `handleError(error)?.message || "<text genèric>"`, així que el motiu real (sessió caducada, sense permís, duplicat, xarxa) es llança sempre a la brossa i l'usuari només veu el text genèric.
- **Què veu la persona:** Amb la sessió caducada, la barra lateral del xat mostra el bloc d'avís amb el títol "No s'ha pogut carregar el xat" i, davall, exactament "Error al carregar converses" — mai "La sessió ha caducat. Si us plau, torna a iniciar sessió." La persona veu la llista de converses buida i no sap que ha de tornar a entrar; espera que el sondeig de 25 s ho arregle sol i no passa. El mateix passa amb qualsevol altre motiu (sense 
- **Reproducció:** Estat inicial: sessió oberta i xat carregat. Acció: caducar o revocar el JWT (per exemple, tancar sessió des d'una altra pestanya del mateix origen) i tornar a la llista de converses perquè el sondeig de 25 s de XatContext.jsx:170 crida `loadFils`. Resultat erroni observable: la barra lateral del xat pinta l'avís (XatS

**`src/data/supabase/auth.js:18`** — La renovació de sessió no té temps màxim i penja la petició que l'ha demanada

- **Què passa:** `renova()` fa un `fetch` pelat, sense `AbortController` ni `timeoutMs`, i `request()` l'espera dins del seu `try`; el temporitzador de 12 s de `request` avorta un controlador que eixe `fetch` no fa servir, així que si `/auth/v1/token` no contesta la promesa de `request()` no es resol ni es rebutja mai.
- **Què veu la persona:** La persona obri l'app amb la sessio ja caducada darrere d'un proxy o portal captiu que accepta la connexio i no respon. El Mur es queda amb el filador de carrega indefinidament: MurContext.jsx:10 arranca amb `status: 'loading'` i nomes canvia a 'ready' o 'error' dins del `try/catch` de la linia 21-27, que mai s'executa perque `loadMur` no torna mai. No apareix cap missatge d'error, cap boto de reintent i el temporitz
- **Reproducció:** Estat inicial: sessió oberta amb refresh token viu i JWT ja caducat (portàtil que ha dormit). Acció: obrir l'app darrere d'un portal captiu o un proxy que accepta la connexió i no contesta mai. El GET d'app_content de MurContext.jsx:22 torna 401, `request` entra a runtime.js:59 i es queda a `await refresca(config)`; al

**`src/components/universal/workspace/UniversalWorkspace.jsx:286`** — Una creació que torna null no diu res a l'usuari

- **Què passa:** `createAndSelect` només té camí d'èxit i camí d'excepció: si `onCreate` resol amb `null` o amb un objecte sense `id`, la condició de la línia 286 és falsa, no hi ha `else` ni crida a `onCreateError`, i tot el flux acaba en un no-op mut. PerfilShell empra exactament eixe contracte: captura l'excepció i torna `null`, i no passa `onCreateError`.
- **Què veu la persona:** Amb la secció Perfil oberta i la xarxa caiguda, sense sessió vàlida o sense permisos de RLS, la persona clica NOVA ORG: el botó passa un instant a l'estat "creant" i torna immediatament a NOVA ORG. No apareix cap organització nova a la columna IDENTITATS, la llista d'ajustos no canvia, el detall segueix mostrant exactament l'ajust que ja estava seleccionat i no es pinta cap missatge d'error enlloc de la pantalla. L'u
- **Reproducció:** Estat inicial: secció Perfil oberta, sense permisos per a crear organitzacions o amb la xarxa caiguda (`createOrganization` de src/data/supabase/organizations.js llança). Acció: clicar NOVA ORG. `creaOrg` engoleix l'excepció i torna `null`; `created?.id != null` és fals i no s'executa res. Resultat erroni: el botó parp

**`src/sections/notes/NotesSection.jsx:90`** — Crear des d'una etiqueta o categoria no assigna ni l'etiqueta ni la categoria

- **Què passa:** NotesSection ja distingeix carpeta/etiqueta/categoria pel groupId, però createNote només envia folder_id, title i content al servidor: les branques de categories i tags es perden i la nota naix fora de la categoria des d'on s'ha creat, cosa que fa saltar la reconciliació a una altra categoria.
- **Què veu la persona:** Amb el grup ETIQUETES (o CATEGORIES) visible a la columna esquerra, l'usuari clica l'etiqueta "hort" i després CREAR NOTA. La nota es crea sense l'etiqueta: al servidor naix amb categories=[] i tags=[] (valors per defecte de la taula) i folder_id 'f-notes'. Immediatament, la selecció de la columna esquerra salta sola de l'etiqueta "hort" a la carpeta Notes, la llista central canvia de contingut (passa a mostrar les n
- **Reproducció:** 1) Tin una nota amb l'etiqueta "hort" perquè aparega el grup ETIQUETES. 2) Clica "hort" a la columna esquerra. 3) Clica CREAR NOTA. La nota es crea amb tags = [] i folder_id 'f-notes', així que els seus categoryIds són ['f-notes'] i no inclouen 'tag_hort'. 4) L'efecte de reconciliació de WorkspaceContext canvia activeC

**`src/sections/notes/NotesContext.jsx:56`** — El desmuntatge llança el desat pendent en compte d'enviar-lo

- **Què passa:** La neteja de la saveQueue esborra el timer i resol les promeses a false però no envia mai el payload acumulat; i el flush d'eixida de l'editor (pagehide) acaba en el debounce de 600 ms de saveNoteField, que no arriba a disparar-se quan la pestanya es tanca.
- **Què veu la persona:** Escrius una frase al Bloc de Notes i tanques la pestanya (o el navegador) dins d'aproximadament 1,4 segons: el PATCH no ix mai, la sessionStorage on viu l'esborrany mor amb la pestanya i, en tornar a obrir l'app, eixa ultima frase ha desaparegut sense cap missatge ni indicador. El mateix passa amb l'ultim tros escrit si canvies d'identitat mentre el desat esta pendent: la cua es resol a false en silenci i el text que
- **Reproducció:** 1) Obri una nota i escriu una frase. 2) Dins d'aproximadament 1,4 s (800 ms del debounce de tiptap + 600 ms del de NotesContext) tanca la pestanya. El pagehide crida flush, que crida saveNoteField, que només programa un setTimeout de 600 ms; la pestanya es tanca abans i el PATCH no ix mai. La sessionStorage on viuen el

**`src/components/universal/workspace/UniversalWorkspace.jsx:352`** — El botó CREAR es desactiva a si mateix i tira el focus al body

- **Què passa:** En prémer CREAR, `setCreating(true)` posa `disabled` al botó que té el focus; el navegador el desenfoca i, fora de 'estret', ningú recupera el focus.
- **Què veu la persona:** Amb Notes obertes en finestra ampla (mida 'ample' o 'mitja') i navegant amb teclat: al prémer Enter sobre CREAR NOTA el botó passa a CREANT… i queda desactivat; com que l'element que tenia el focus queda `disabled`, el navegador el desenfoca i `document.activeElement` passa a <body>. Quan la creació acaba i el botó torna a CREAR NOTA, ningú retorna el focus: la persona que navega amb teclat (o amb lector de pantalla)
- **Reproducció:** Estat inicial: Notes obertes en finestra ampla (mida 'ample'). Acció: amb el teclat, tabula fins al botó CREAR NOTA de la columna NOTES i prem Enter. Resultat erroni: el botó canvia a CREANT… i queda `disabled`; `document.activeElement` passa a ser `<body>`. Quan la nota es crea i el botó torna a CREAR NOTA, el focus c

**`src/components/universal/UniversalToolbar.jsx:19`** — El botó «Tornar a la llista» fa inert la columna on viu ell mateix

- **Què passa:** A mòbil, el botó de tornar obre el panell 'middle', cosa que posa `inert` a la columna dreta on està el propi botó; el navegador el desenfoca i ningú reubica el focus.
- **Què veu la persona:** A un mòbil (amplada < 720px, `mida === 'estret'`), amb una nota oberta a la columna de detall, l'usuari prem la fletxa «Tornar a la llista» de la barra de l'editor. La llista apareix, però el botó que acaba de prémer queda dins d'un `<section>` amb `inert` + `aria-hidden`, i el navegador li lleva el focus sense reubicar-lo: el focus cau a `<body>`. Amb VoiceOver/TalkBack el lector emmudeix (no anuncia la llista que a
- **Reproducció:** Estat inicial: Notes en un mòbil (amplada < 720px, mida 'estret'), una nota oberta en la columna de detall, el focus damunt del botó de fletxa «Tornar a la llista» de la barra de l'editor. Acció: activar el botó (Enter, o toc amb VoiceOver). Resultat erroni: la llista de notes llisca cap a dins, `panellObert` passa a '

**`src/sections/dispositius/DevicesSection.jsx:94`** — El commutador de visibilitat de Dispositius esborra el nom que s'estava escrivint

- **Què passa:** `draftName` és estat derivat sincronitzat per un efecte que depèn de tot l'objecte `profile`: qualsevol canvi de `profile` que no siga el nom (per exemple el botó Visible/Invisible) reescriu l'esborrany del camp de text.
- **Què veu la persona:** A la secció Dispositius, si la persona escriu un nom nou al camp "Nom del dispositiu" (p. ex. "Bancal") sense prémer "Guardar" i després toca el botó "Visible (Públic)" / "Invisible (Privat)" del capçal del panell "Este dispositiu", el camp de text torna instantàniament al nom guardat anterior i el text escrit desapareix sense cap avís ni manera de recuperar-lo. El mateix passa amb qualsevol altre canvi de `profile` 
- **Reproducció:** Estat inicial: secció Dispositius, el camp "Nom del dispositiu" mostra "Ordinador de Joan". 1) L'usuari esborra i escriu "Bancal" al camp, sense prémer Guardar. 2) Prem el botó "Visible (Públic)" / "Invisible (Privat)" de dalt. 3) `setProfile(next)` crea un objecte `profile` nou → l'efecte de la línia 92 dispara → `set

**`src/PedraSecaEmbed.jsx:407`** — El component s'apropia del <head> de la pàgina amfitriona per defecte

- **Què passa:** `_recalcularConfig` posa `routerType: 'browser'` i, tot seguit, `manageDocumentHead: true` quan el host no diu res. `useSEO` només s'atura si el valor és literalment `false`, si estem en un iframe o si existix `window.__SDP_EMBEDDED__`, una variable que no s'assigna enlloc del codi i que la porta d'enxufe ni tan sols té a la llista de globals permesos.
- **Què veu la persona:** Una persona que visita la pàgina de Sollutia (o qualsevol host que incruste `<soc-de-poble>` sense iframe) veu, en el moment que el bloc de Sóc de Poble pinta una secció: la pestanya del navegador deixa de dir el títol de la pàgina del host i passa a dir «Mur | Sóc de Poble» (o «Mercat | Sóc de Poble», etc. segons navegue), i el mateix text apareix a l'històric i als marcadors que es guarde. Pel darrere, la meta desc
- **Reproducció:** 1) Sollutia posa `<soc-de-poble supabase-url="..." supabase-anon-key="..."></soc-de-poble>` dins d'una pàgina seua, sense iframe i sense passar `manageDocumentHead: false` (que no apareix en cap document d'integració). 2) L'usuari navega pel bloc de Sóc de Poble. 3) La pestanya del navegador, que deia el títol de la pà

**`src/sections/connectar/ConnectarSection.jsx:181`** — Publicar des de Connectar porta a un Mur ranci: la publicació no hi és

- **Què passa:** handleConnect escriu la publicació al servidor i tot seguit navega a /mur (o /mercat, /events, /multimedia), però MurProvider viu PER DAMUNT del Router i només carrega una volta per actorKey: navegar no el remunta ni el recarrega. El seu `refresh` existix però cap consumidor el crida (l'únic disparador real és l'esdeveniment extern 'sdp:refresh-data'). Resultat: l'escriptura ha triomfat i la pantalla on aterra l'usua
- **Què veu la persona:** A Connectar, l'usuari tria «Mur» (o Mercat/Events/Multimèdia/Notes), escriu títol i descripció i prem CONNECTAR. Els camps es buiden i l'app salta al Mur, però la llista del Mur és exactament la d'abans: la seua publicació no hi apareix per enlloc i no hi ha cap missatge de confirmació (l'únic showToast del fitxer, línia 183, és per a errors). Des del punt de vista de la persona sembla que la publicació s'ha perdut: 
- **Reproducció:** Estat inicial: sessió oberta, Mur ja carregat (status 'ready'). Acció: Connectar → tria l'àrea Mur → escriu títol i descripció → prem CONNECTAR. Resultat erroni observable: el POST a /rest/v1/section_submissions torna 201, l'app navega a /mur i la targeta acabada de crear NO apareix enlloc ni hi ha cap missatge; només 

**`src/components/universal/workspace/WorkspaceContext.jsx:150`** — Crear des d'una etiqueta fa saltar en silenci la columna esquerra a la carpeta «Altres notes»

- **Què passa:** La nota nova sempre naix amb folder_id 'f-notes' i sense cap etiqueta, per tant els seus categoryIds no contenen la categoria activa. La reconciliació de WorkspaceContext detecta eixa incoherència i, en compte de respectar la categoria que ha triat l'usuari, li reassigna la primera categoria de l'element nou. La selecció de la columna esquerra es mou sola de ETIQUETES ▸ <etiqueta> a CARPETES ▸ Altres notes i la llist
- **Què veu la persona:** L'usuari obri el calaix CARPETES, tria ETIQUETES ▸ Tutorial i prem CREAR NOTA. Quan la petició torna (fracció de segon o més amb cobertura roïna), la marca activa de la columna esquerra salta tota sola d'ETIQUETES ▸ Tutorial a CARPETES ▸ Altres notes, i la llista del mig es repobla amb les notes de la carpeta «Altres notes» en compte de les de l'etiqueta. La nota nova queda oberta però sense l'etiqueta que l'usuari c
- **Reproducció:** Estat inicial: Notes carregades, la nota de llavor n1 porta tags ['Tutorial'], per tant existix el grup ETIQUETES amb l'opció 'Tutorial'. Acció: en mida 'mitja' obri el calaix CARPETES, tria ETIQUETES ▸ Tutorial (selectCategory deixa activeCategoryId='tag_Tutorial' i selecciona n1) i prem CREAR NOTA; deixa que la petic

**`src/components/universal/workspace/UniversalWorkspace.jsx:347`** — El botó CREAR NOTA està viu mentre les notes encara carreguen, i aleshores creaNota és el tap que llança

- **Què passa:** L'acció de crear es pinta sense cap comprovació de `status`: la comprovació de status només protegix el cos de la llista (línia 402). Mentrestant NotesDataContext substituïx tota l'API per BUIT sempre que status !== 'ready', i BUIT.creaNota llança. En xarxa lenta la finestra de càrrega dura segons i el botó primari està habilitat tot eixe temps; el mateix passa cada vegada que arriba 'sdp:refresh-data' i refresh() to
- **Què veu la persona:** Amb xarxa lenta (o just després d'una recàrrega externa de dades), l'usuari veu la llista de notes dient «Carregant...» però el botó primari CREAR NOTA de la capçalera es veu actiu i clicable. Si el prem, el botó parpelleja a «CREANT…» i torna a «CREAR NOTA», apareix un avís efímer roig completament BUIT (sense cap text, perquè s'hi passa un objecte Error) i no es crea cap nota. L'usuari no rep cap explicació i norma
- **Reproducció:** Estat inicial: tauleta, xarxa lenta, entrada a la secció Notes; loadNotes encara en vol, status='loading'. Acció: la columna del mig diu «Carregant...» i la de la dreta «Carregant…», però el botó CREAR NOTA de la capçalera està habilitat; l'usuari el prem. Resultat erroni observable: onCreate crida BUIT.creaNota, que l

**`src/components/universal/richText/useUniversalRichText.js:78`** — L'HTML de TipTap i el sanejat no poden coincidir mai si la nota te una imatge: el document es reconstruix a cada cicle de desat

- **Què passa:** L'extensio Image injecta class="sdp-imatge-cos" a cada <img>, pero sanitizeHtml no te 'class' a ALLOWED_ATTR i a mes el ganxo afig referrerpolicy="no-referrer". Com que saveNoteField reescriu l'override amb el valor JA sanejat (linia 105), el prop `content` i `editor.getHTML()` divergixen per sempre en qualsevol nota amb imatge: la guarda de la linia 78 sempre es certa i, amb pendingSaveRef buidat pel flush immediata
- **Què veu la persona:** En qualsevol nota que continga una imatge (inserida amb /imatge), mentres escrius al mig d'un paragraf i pares uns 0,8 s, el cursor et desapareix del lloc on escrivies: el document sencer es reemplaça i la seleccio salta (normalment al final o al principi), aixi que les lletres seguents van a parar on no toca. La imatge tambe es torna a crear i pot parpellejar o recarregar-se. Passa a cada cicle de desat (cada pausa 
- **Reproducció:** Estat inicial: nota amb una imatge inserida amb l'ordre /imatge del menu slash. Accio: posar el cursor al mig d'un paragraf, escriure unes lletres i parar 1,5 s sense canviar de nota. Resultat observable: als ~800 ms saveNoteField reescriu l'override amb l'HTML sanejat (l'<img> perd class="sdp-imatge-cos" i guanya refe

**`src/sections/notes/NotesSection.jsx:12`** — El titol viatja com a HTML pero la fitxa de la llista el pinta com a text: «Pa & oli» es veu «Pa &amp; oli»

- **Què passa:** El titol s'escriu en un contenteditable i es captura com a innerHTML, o siga escapat (& -> &amp;, < -> &lt;) i amb etiquetes si s'hi enganxa format. Eixa cadena HTML es la que guarda la base de dades i la que toWorkspaceNote passa com a `title`, pero UniversalWorkspace la pinta com a fill de text. NotesContext ja calcula la copia en text pla (`plainTitle`, linia 89) i la llanca: nomes l'usa per a searchText. Les dues
- **Què veu la persona:** Una persona escriu «Pa & oli» al títol d'una nota. A l'editor ho veu bé (es repinta amb dangerouslySetInnerHTML), però la fitxa de la columna NOTES, just al costat, mostra literalment «Pa &amp; oli». Si enganxa un tros de títol en negreta, la fitxa mostra «<strong>Pa</strong> i oli» amb les etiquetes a la vista. La divergència és permanent: la cadena escapada queda desada a Supabase, torna igual en recarregar, i la m
- **Reproducció:** Estat inicial: nota nova oberta. Accio: escriure «Pa & oli» al camp de titol i esperar el desat. Resultat observable: l'editor mostra «Pa & oli» (el pinta amb dangerouslySetInnerHTML) pero la fitxa de la columna de NOTES mostra literalment «Pa &amp; oli»; a Supabase la columna title queda «Pa &amp; oli», i eixa mateixa

**`src/sections/notes/NotesContext.jsx:88`** — Cada pulsacio de tecla resaneja i reanalitza TOTES les notes carregades

- **Què passa:** El memo `notes` depen de `localNoteOverrides`, i desaLocal crea un objecte d'overrides nou a cada pulsacio de tecla. El memo no recalcula nomes la nota tocada: remapa totes les notes i per a cadascuna crida extractPlainText dos voltes, i extractPlainText passa el valor per DOMPurify i despres per DOMParser. Amb el sostre de 50 notes de loadNotes aixo son 100 passades de sanejat + analisi de DOM, mes 100 formatadors I
- **Què veu la persona:** Amb la llibreta plena (prop de les 50 notes que carrega loadNotes, alguna amb imatges enganxades en base64), l'usuari escriu dins d'una nota i veu que les lletres van endarrerides respecte dels dits: cada tecla dispara 100 passades de DOMPurify + DOMParser i 100 formatadors de data de manera sincrona dins del render, mes un JSON.stringify de tots els esborranys. Al movil o en portatils modestos el teclejat es torna a
- **Reproducció:** Estat inicial: usuari amb 50 notes carregades, alguna amb imatges inserides amb /imatge (data:image/webp;base64 dins del contingut). Accio: teclejar una sola lletra dins de l'editor ric. Resultat observable: desaLocal crea un objecte d'overrides nou, el memo de la linia 84 es recalcula i executa 100 crides a extractPla

**`src/sections/dispositius/devicesRuntime.js:44`** — Totes les pestanyes comparteixen el mateix id de dispositiu, aixi que Dispositius mai pot descobrir res

- **Què passa:** El perfil del dispositiu es guarda amb `getVal`/`setVal`, que son localStorage (src/config/storage.js:12 i :26), amb una clau que nomes depen del tenant: `socdepoble-device-profile-v1-<tenantId>`. localStorage es per origen, no per pestanya, o siga que TOTES les pestanyes del portal del mateix tenant llegixen el MATEIX `profile.id`. El canal de descoberta es un BroadcastChannel (devicesRuntime.js:111), que per defini
- **Què veu la persona:** Una persona obri /dispositius en dues pestanyes del mateix navegador (o en dues finestres), posa les dues en «Visible (Públic)» i prem actualitzar. Cap de les dues veu l'altra mai: la llista de dispositius a prop es queda buida indefinidament i les dues pantalles mostren el mateix «ID» abreujat al badge (`ID {profile.id.slice(0,8)}`), o siga que l'usuari veu literalment el seu propi identificador repetit i cap parell
- **Reproducció:** Estat inicial: el mateix navegador, el mateix tenant, cap simulacio activada. Accio: obri /dispositius en dues pestanyes i posa les dues en «Visible (Public)». Les dues carreguen el mateix `profile.id` de localStorage (devicesRuntime.js:44) i les dues s'uneixen a `socdepoble-device-bridge-v1::<tenantId>` (devicesRuntim

**`src/sections/notes/NotesContext.jsx:188`** — Publicar una nota al Mur no és idempotent i l'error de desat convida a duplicar-la

- **Què passa:** publishNote fa dos escriptures remotes en cadena. Si la primera (l'enviament al Mur) triomfa i la segona (marcar isPublished) falla per xarxa o temps d'espera, saveNoteField resol false: no ix el toast d'èxit i sí el seu propi toast «El canvi no ha arribat al servidor. Reintenta-ho.». L'usuari conclou que no s'ha publicat i torna a prémer. Com que appendSectionSubmissionNetworkOnly genera un UUID nou en cada intent i
- **Què veu la persona:** Una persona a /jo/notes prem «Publicar»: el post ja ha entrat al Mur, però el desat de la nota cau (xarxa o els 12000 ms de temps màxim). No veu cap missatge d'èxit, només l'error roig «El canvi no ha arribat al servidor. Reintenta-ho.», i el botó continua dient «Publicar» i clicable. Entén que no s'ha publicat i torna a prémer. Quan obri el Mur troba la mateixa nota publicada dues vegades (dues targetes idèntiques a
- **Reproducció:** Estat inicial: una nota oberta a /jo/notes amb el Mur carregat. Acció: prem Publicar; el POST a section_submissions triomfa i, just després, el PATCH a /rest/v1/notes cau per talls de xarxa o supera els 12000 ms de temps màxim. Resultat erroni observable: no hi ha cap toast d'èxit, només «El canvi no ha arribat al serv

**`src/sections/profile/DetallAjust.jsx:79`** — El commutador de visibilitat del perfil falla en silenci absolut segons l'ajust triat

- **Què passa:** commutaPublicacio (el botó de la barra superior del perfil, sempre pintat i mai desactivat) escriu l'error a l'estat `missatge`, però eixe estat només es renderitza dins de renderitzaFormulari, que no s'arriba a executar quan l'ajust seleccionat és de tipus 'accio' o està tancat: eixos dos camins tornen abans. Amb «Correu electrònic» (obert:false), «Tancar sessió» o «Fitxa pública» seleccionats, un updateProfile que 
- **Què veu la persona:** A /jo/perfil, amb l'ajust «Correu electronic» o «Tancar sessio» seleccionat (o «Fitxa publica» / «Identificador» en una organitzacio), la persona prem el boto «Publicar» de la barra superior per a fer public o privat el seu perfil. Si la sessio ha caducat (401), la xarxa cau o hi ha temps d'espera, la pantalla no canvia absolutament gens: cap text roig, cap avis efimer, cap canvi al boto (continua dient «Publicar» i 
- **Reproducció:** Estat inicial: /jo/perfil, identitat «Jo», tria l'ajust «Correu electrònic» (o «Tancar sessió»). Acció: prem el botó Publicar de la barra superior amb la sessió caducada o la xarxa caiguda. Resultat erroni observable: la petició PUT /auth/v1/user torna 401, guardarCampPerfil llança, setMissatge s'executa i la pantalla 

**`src/sections/notes/NotesEditor.jsx:18`** — Les errades de pujada d'imatge a l'editor de Notes només arriben a la consola

- **Què passa:** NotesSection renderitza NotesEditor sense passar-li onToast, així que s'aplica el valor per defecte toastPerConsola, que és un console.warn. Tota la cadena d'avisos de la closca de l'editor (useHeroImageHandler → useEditorShell.onError → UniversalEditorShell.onToast → DocumentEditor.onToast) desemboca ahí. Per tant, si uploadToStorage falla per RLS, 401, xarxa o temps d'espera, o si la imatge es queda en data URL de 
- **Què veu la persona:** A /jo/notes, amb una nota oberta, la persona prem «Inserir Capçalera» (o «Inserir Logotip»), tria una imatge de la galeria i veu el botó en estat de càrrega un instant. Si la pujada falla (sessió caducada, RLS del bucket 'mitjans', tall de xarxa) o la imatge comprimida supera els 150 KB sense servidor, el selector es tanca, el botó torna exactament a com estava i la capçalera continua buida: cap missatge d'error, cap
- **Reproducció:** Estat inicial: una nota oberta a /jo/notes. Acció: prem «Inserir Capçalera» i tria una imatge mentre el bucket 'mitjans' rebutja l'escriptura (RLS o sessió caducada). Resultat erroni observable: la imatge no s'aplica, el botó torna al seu estat inicial i la pantalla no diu absolutament res; l'únic rastre és un console.

**`src/sections/detail/ItemDetailSection.jsx:38`** — Un Mur caigut es pinta com a mercat buit i com a enllaç inexistent

- **Què passa:** MurSection sí que tracta status 'loading' i 'error', però els altres tres consumidors de useMur (ItemDetailSection, MercatSection i SearchSection) només desestructuren les llistes i mai miren status ni error. Amb el Mur en error (401, xarxa, temps d'espera dels 12 s) el context degradat torna arrays buits, i eixes pantalles menten: un enllaç compartit /mur/:id o /mercat/:id perfectament vàlid contesta «L'enllaç no ap
- **Què veu la persona:** Una persona que òbriga un enllaç compartit a una publicació o un producte existent (/mur/<id> o /mercat/<id>) directament des del navegador veu una pàgina d'error amb el títol «Element no trobat», el subtítol «L'enllaç no apunta a cap element existent», una etiqueta roja «Error» i un botó «Torna» — com si el contingut haguera sigut esborrat — quan en realitat el Mur encara està carregant o la càrrega ha fallat (401, 
- **Reproducció:** Estat inicial: sessió amb el JWT caducat i el token de refresc invàlid, o backend inabastable; loadMur llança i MurProvider queda en status 'error'. Acció: obri directament un enllaç compartit del tipus /mur/<id-existent> (sense navegar-hi des d'una targeta, o siga sense location.state.preloadedItem) i després entra a 

**`src/sections/profile/DetallAjust.jsx:53`** — L'efecte de reinici de DetallAjust no depèn del valor de l'ajust: el commutador de visibilitat de la barra i la casella del formulari es desincronitzen i «Guardar» revertix el canvi

- **Què passa:** L'únic efecte que sincronitza `valorTemp` amb l'ajust seleccionat depèn només de `[ajust?.id, identitat?.id]`, mai de `ajust?.valor`. Quan el valor de l'ajust canvia sense canviar d'ajust ni d'identitat —exactament el que fa `commutaPublicacio` de la mateixa pantalla— l'estat local es queda amb el valor vell. Com que `UniversalToolbar` ni tan sols desestructura `isPublished` (src/components/universal/UniversalToolbar
- **Què veu la persona:** A Perfil › «Estat del perfil» amb el compte privat: prems «Publicar» a la barra de dalt i el perfil passa a públic al servidor, però la casella de baix continua desmarcada i amb l'etiqueta «Privat» —és l'únic indicador visible d'eixe estat a la pantalla, perquè la barra no mostra res—. Si després prems «Guardar» (el flux natural, ja que la casella sembla no haver-se aplicat), es torna a escriure `is_public = false` i
- **Reproducció:** Estat inicial: Perfil › identitat «jo» amb `is_public = false`; a la columna d'elements se selecciona «Estat del perfil». La casella es pinta desmarcada («Privat») i `valorTemp === false`. Acció: 1) Prémer el botó «Publicar» de la barra superior (`commutaPublicacio`). Això crida `guardarCampPerfil('is_public', true, 'j

**`src/sections/notes/NotesContext.jsx:99`** — El memo `notes` depèn del mapa sencer d'esborranys: cada pulsació de tecla rederiva TOTES les notes amb DOMPurify, DOMParser i Intl

- **Què passa:** `localNoteOverrides` és un únic objecte que guarda els esborranys de TOTES les notes, i `setLocalNoteField` en torna sempre una instància nova encara que el valor siga idèntic. Com que eixe objecte és dependència del memo `notes`, tocar una tecla en UNA nota invalida la derivació de totes. El cos del memo no és barat: per cada nota crida `extractPlainText` dues vegades (i cadascuna fa `sanitizeHtml` amb DOMPurify + `
- **Què veu la persona:** Escrivint dins d'una nota (cos o capçalera), a cada tecla es tornen a derivar TOTES les notes carregades: fins a ~50 notes × 2 passades de DOMPurify + DOMParser + 2 formatadors Intl, entre 100 i 200 operacions de sanejat/parseig de DOM per pulsació, totes al fil principal i abans de pintar. La persona veu que el text apareix amb retard respecte del que teclegen, el cursor va a rebuf i en ratxes ràpides d'escriptura l
- **Reproducció:** Estat inicial: secció Notes amb el llistat carregat (loadNotes torna fins a 50 notes) i una nota oberta a l'editor. Acció: escriure text al cos de la nota. Cada `onUpdate` de tiptap crida `onChangeRef.current` (useUniversalRichText.js:58) → `handleChange` (DocumentEditor.jsx:56-59) → `desaLocal` → `setLocalNoteField`, 

**`src/data/supabase/content.js:80`** — La vista «Cronologia» de Multimedia sempre esta buida: mediaTimelineGroups no el produix ningu

- **Què passa:** loadMultimedia torna nomes { mediaItems }. Ni buildSeedAppData ni mapContentRowsToData creen mediaTimelineGroups, i cap altre backend implementa el metode. El context el llig del payload amb `|| []`, aixi que sempre es un array buit i el commutador Galeria/Cronologia pinta una pagina en blanc quan es tria Cronologia, sense cap avis ni estat buit.
- **Què veu la persona:** Amb la galeria carregada (per exemple «TOTS (12)») l'usuari prem «Cronologia» al commutador: la píndola es marca com a activa, la capçalera continua dient «TOTS (12)» i el cos de la pàgina queda completament en blanc — cap grup per mesos, cap targeta, cap imatge, cap missatge tipus «encara no hi ha res». Sembla que la pàgina s'ha trencat o que ha perdut les fotos; l'única manera de recuperar-les és tornar a prémer «G
- **Reproducció:** Estat inicial: usuari a /jo/multimedia amb la galeria carregada i imatges visibles en mode «Galeria». Accio: prémer «Cronologia» al commutador de mode de vista. Resultat erroni observable: la capcalera continua dient «TOTS (N)» amb N > 0 pero el cos queda completament buit — cap grup, cap targeta, cap estat buit — i no

**`src/sections/multimedia/MultimediaSection.jsx:12`** — Multimedia s'empassa l'error de carrega i pinta una galeria buida com si no hi haguera res

- **Què passa:** MultimediaContext calcula i exposa status i error, pero MultimediaSection nomes desestructura mediaItems i mediaTimelineGroups. Si la carrega falla (xarxa caiguda, TimeoutError als 12 s, credencials absents, 'La BD remota està buida'), mediaItems val [] i la seccio es pinta com un arxiu buit, amb «TOTS (0)», sense alerta ni boto de reintent. El Mur, que comparteix exactament el mateix patro de context, si que ho trac
- **Què veu la persona:** Amb la xarxa caiguda (o si la petició depassa el timeout de 12 s, o si falten credencials/tenantId, o si la BD està buida) l'usuari obri /jo/multimedia i veu la pàgina «Arxiu visual» renderitzada del tot i aparentment sana: el títol, el subtítol «Galeria d'imatges i cronologia visual del projecte.», la capçalera «TOTS (0) - » (amb la data buida perquè no hi ha element destacat) i el selector Galeria/Cronologia operat
- **Reproducció:** Estat inicial: usuari autenticat, sessio valida. Accio: tallar la xarxa (o deixar que la peticio depasse el timeoutMs de 12000 de src/data/supabase/runtime.js:49-52) i obrir /jo/multimedia. Resultat erroni observable: la seccio es pinta sencera amb la capcalera «TOTS (0)» i la graella buida, indistingible d'un arxiu se


### Risc latent i higiene (19)

**`src/components/layout/AppGridShell.css:107`** — En mida 'mitja' el minim de 320 px de la columna dreta no s'aplica

- **Què passa:** RIGHT_COLUMN_MIN nomes es respecta dins de resizeColumn, que nomes s'executa en 'ample'. La graella de tauleta reutilitza la mateixa variable --app-grid-col-list sense cap topall, i l'amplaria restaurada de localStorage tampoc es contrasta amb el contenidor, aixi que el detall pot quedar molt per davall de 320 px.
- **Què veu la persona:** Una persona que en escriptori haja eixamplat la llista d'ELEMENTS fins al topall (520 px, desat a sdp_embed_sdp-grid-widths) i despres òbriga la mateixa app en una tauleta o encongisca la finestra a uns 720-800 px, veu la llista mantenint els 520 px mentre el panell de detall (l'editor de notes) queda reduit a 200-280 px: una columna de text molt estreta amb la capçalera i els controls comprimits, sense cap manera de
- **Reproducció:** 1) En un escriptori de 1400 px, arrossega el separador d'ELEMENTS cap a la dreta fins que s'ature: queda en 520 px (COLUMN_LIMITS.middle.max) i es desa a sdp_embed_sdp-grid-widths. 2) Obri la mateixa app en una tauleta de 760 px d'amplaria, o encongix la finestra fins a 760 px. mida = 'mitja'. Resultat erroni: la llist

**`src/app/guards/RequireAuth.jsx:44`** — RequireAuth es queda per sempre a «Comprovant» si el backend no té la capacitat 'sessio'

- **Què passa:** RequireAuth interpreta rol===null com «encara en vol», però l'efecte que omple el rol surt immediatament quan teCapacitat('sessio') és fals, i cap altre camí escriu el rol: amb un backend injectat que complix tot el CONTRACTE_NUCLI però no les CAPACITATS, /admin i /realitat es queden en una pantalla en blanc indefinida.
- **Què veu la persona:** En un amfitrió que injecte tot CONTRACTE_NUCLI sense refrescaSessio/elMeuRol, un superadmin identificat que òbriga /admin o /realitat veu una pàgina completament en blanc dins del marc de l'aplicació, sense spinner, sense missatge d'error i sense temps d'espera (només un text per a lectors de pantalla «Comprovant la sessió…»). No canvia mai: recarregar, tornar a entrar o esperar no fa res, perquè el rol es queda a nu
- **Reproducció:** 1) Un amfitrió (Sollutia) crida window.SocDePoble.configura({ backend }) amb les 32 funcions de CONTRACTE_NUCLI però sense refrescaSessio ni elMeuRol — configuració explícitament vàlida segons src/data/contracte.js, que separa CAPACITATS del nucli. 2) Com que pendentsNucli.length === 0, arrenca() no fusiona la implemen

**`src/app/contexts/UIContext.jsx:89`** — toggleTheme queda congelat amb el systemDark del primer render

- **Què passa:** actionsValue es memoitza amb [translator, setGlobalStatus] però hi tanca toggleTheme, que captura systemDark; com que systemDark s'escriu des d'un efecte posterior al primer render i el memo no el vigila, el toggle raona amb un valor obsolet i, amb themePreference 'system', el primer clic no canvia res. A més, writeThemePreference s'executa dins de l'actualitzador d'estat, el mateix patró impur que s'ha tret d'AppGri
- **Què veu la persona:** Només quan l'amfitrió incrusta amb `themeMode: 'system'` i el sistema operatiu està en fosc (o la persona canvia el sistema a fosc amb la pàgina oberta): la interfície es veu fosca i el botó de la barra superior mostra el sol, però el primer clic damunt d'eixe sol no fa res visible — la pantalla continua fosca i la icona continua sent el sol. El segon clic ja passa correctament a clar, i a partir d'ací el botó funcio
- **Reproducció:** 1) L'amfitrió incrusta l'element amb config='{"themeMode":"system"}' (themeMode és a CLAUS_PERMESES, src/PedraSecaEmbed.jsx:156) en un dispositiu amb el sistema en fosc. 2) Primer render: systemDark=false → themeMode='light'. L'efecte de la línia 55 fa setSystemDark(true) i el segon render ja pinta fosc; el botó de la 

**`src/components/universal/workspace/UniversalWorkspace.jsx:265`** — La guàrdia de generació no pot ordenar-se contra la promesa

- **Què passa:** `createGenerationRef` només s'incrementa dins d'un `useEffect`, que Preact difereix fins després del pintat (`afterPaint`: rAF, o `setTimeout` de 35 ms quan no hi ha fotograma), mentre que la guàrdia es llig en la continuació d'un `await`, que és un microtask disparat per la resposta de xarxa; entre el clic humà i el buidatge de l'efecte hi ha una finestra sencera de fotograma en què el ref encara diu la generació an
- **Què veu la persona:** A Notes en amplada 'ample', amb la carpeta F1 activa i la nota A oberta: l'usuari clica CREAR NOTA i, mentre el botó diu CREANT…, clica la carpeta F2, que obri la nota B. Si la resposta del POST arriba dins d'aqueix mateix fotograma, la pantalla salta sola: la nota B que acabava d'obrir desapareix de l'editor i hi apareix la nota nova buida, i la llista i la carpeta ressaltada tornen soles de F2 a F1. L'usuari veu co
- **Reproducció:** Estat inicial: Notes en amplada 'ample', carpeta F1 activa, nota A oberta. Acció: clicar CREAR NOTA i, mentre el botó diu CREANT…, clicar la carpeta F2 (que obri la nota B). Si la resposta del POST arriba dins del mateix fotograma que el clic (fins a 35 ms, i sempre que la pestanya està amagada o el rAF va escanyat), l

**`src/components/universal/workspace/UniversalWorkspace.jsx:292`** — L'error de creació es perd si l'usuari ha canviat de context

- **Què passa:** La mateixa guàrdia de generació s'aplica al `catch`, de manera que quan la creació falla i mentrestant l'usuari ha tocat una altra categoria o un altre element, `onCreateError` no s'invoca mai i l'excepció ni tan sols arriba a la consola: la petició fallida desapareix en silenci.
- **Què veu la persona:** Amb el servidor caigut o la xarxa tallada: l'usuari clica CREAR NOTA, el botó es queda en CREANT…, i mentre espera clica una altra nota de la llista. Quan la petició falla, el botó torna a CREAR NOTA, no apareix cap nota nova i no ix el toast roig d'error (ni res a la consola). L'usuari no té cap indici que la creació ha fallat i torna a clicar, generant més peticions que també fallaran en silenci si repeteix el mate
- **Reproducció:** Estat inicial: Notes carregades, xarxa tallada o servidor tornant 500. Acció: clicar CREAR NOTA i, mentre diu CREANT…, clicar una altra nota de la llista (això dispara l'efecte de la línia 265 i incrementa la generació). Quan `creaNota` rebutja, el `catch` avalua `createGenerationRef.current !== currentGen`, que ara és

**`src/components/universal/workspace/UniversalWorkspace.jsx:364`** — El camp de cerca de la columna d'elements no rep mai el focus

- **Què passa:** `autoFocus` no fa res amb Preact (es pinta com a atribut `autofocus` sobre un element inserit després de la càrrega) i, en tancar la cerca, el botó «Tancar» es desmunta amb el focus a sobre.
- **Què veu la persona:** Amb teclat, a Notes: tabules fins a la lupa de la capçalera d'ELEMENTS i prems Enter. La fila de cerca apareix, però el cursor no hi entra — el focus es queda a la lupa i has de tabular (passant abans pel botó CREAR) o clicar a mà per a poder escriure. En prémer Enter damunt del botó «Tancar», tota la fila es desmunta amb el focus a dins i el focus cau a `<body>`: el següent Tab recomença des de l'inici de la pàgina 
- **Reproducció:** Estat inicial: Notes obertes, columna NOTES visible. Acció 1: amb el teclat, tabula fins a la lupa de la capçalera de NOTES i prem Enter. Resultat erroni: la fila de cerca apareix però el cursor NO entra al camp; el focus es queda a la lupa (l'atribut `autofocus` s'ignora perquè el document ja té un element enfocat i e

**`src/sections/profile/PerfilContext.jsx:187`** — L'organització acabada de crear es queda sense rol i amb tots els ajustos bloquejats

- **Què passa:** create_organization torna un jsonb construït només amb columnes de public.organizations, que no té cap columna role; PerfilContext insereix eixe objecte tal qual a organitzacions, i ajustosOrganitzacio calcula `mana` a partir de org.role, que serà undefined.
- **Què veu la persona:** Amb el slug arreglat (o amb qualsevol crida que passe slug vàlid), la persona prem «NOVA ORG», la creació va bé i la nova organització apareix a la llista d'IDENTITATS amb l'etiqueta de rol «Membre» en compte de «Propietari». La columna de detall s'obri damunt de l'ajust «Nom» i, en compte del formulari editable, mostra el text «Només qui administra aquesta organització ho pot canviar». Les files Nom, Foto / Logotip,
- **Reproducció:** Condicionat: hui no s'arriba a veure perquè la creació sempre falla (primera troballa). Amb el slug pegat, el camí és: prémer «NOVA ORG» → la creació va bé → creaOrg torna {id: '<orgId>-nom'} → requestItem el selecciona i el reconciliador mou la categoria a l'organització nova. Resultat erroni: la columna de detall s'o

**`src/sections/notes/NotesContext.jsx:208`** — informaError rep un objecte Error i el llanca dins del JSX del toast

- **Què passa:** informaError espera una cadena, pero UniversalWorkspace li passa l'objecte Error capturat; com que un Error es truthy, el fallback `msg || 'Error'` no salta i el missatge acaba com a fill JSX cru del toast, aixi que el motiu real del fracas no arriba mai a l'usuari.
- **Què veu la persona:** Amb la sessió caducada (o abans que les notes acaben de carregar), l'usuari clica CREAR NOTA. El botó passa un instant a CREANT… i torna a CREAR NOTA, no apareix cap nota nova, i al seu lloc s'obri durant 3 segons el requadre d'avís roig (`sdp-avisador-efimer sdp-avisador--error`) completament BUIT: sense cap lletra dins, perquè Preact avorta el diff de l'objecte Error i no pinta cap node de text. El motiu real —«Cal
- **Reproducció:** Amb la sessio caducada (o abans que les notes acaben de carregar), clica CREAR NOTA. createNote llanca `new Error('Cal iniciar sessio per crear una nota.')`, UniversalWorkspace el passa tal qual a informaError, i showToast el fica com a fill de <div role="alert">{missatge}</div>. L'usuari veu el requadre d'avis roig bu

**`src/data/supabase/notes.js:22`** — loadNotes talla a 50 notes sense dir-ho

- **Què passa:** La consulta de notes porta limit=50 ordenat per updated_at descendent i no hi ha paginacio ni cap indicador; a partir de la nota 51 les mes antigues desapareixen de la llista sense cap missatge.
- **Què veu la persona:** Amb més de 50 notes pròpies, en recarregar la secció Notes l'usuari veu només les 50 amb `updated_at` més recent. Les altres desapareixen de la llista de la carpeta, no surten al cercador de la secció (el text de cerca es construeix només amb les notes carregades) i no apareixen sota cap categoria ni etiqueta, perquè les llistes de CATEGORIES i ETIQUETES de NotesSection.jsx:28-38 es deriven de les mateixes notes carr
- **Reproducció:** Escriu 51 notes. En recarregar, la nota que fa mes temps que no toques ja no ix a cap carpeta ni cap cerca de la seccio Notes, i no hi ha cap boto per carregar-ne mes ni cap avis que la llista estiga tallada. L'usuari conclou que ha perdut la nota, encara que la fila continue a Supabase.

**`src/components/layout/AppGridShell.css:169`** — La zona d'agafada del separador es de 9 px

- **Què passa:** El separador te 1 px d'amplaria i el pseudoelement que l'engrandeix nomes hi afig 4 px per banda, de manera que la diana real per a punter o dit es de 9 px CSS, tot i que el gestor de pointerdown accepta explicitament pointerType 'touch'.
- **Què veu la persona:** En una pantalla ampla (>= 1090 px), quan una persona vol canviar l'amplària de la columna de CATEGORIES o d'ELEMENTS ha d'encertar una franja vertical de només 9 px CSS damunt de la junta. Amb ratolí el cursor col-resize apareix i desapareix amb un moviment mínim i sovint es fa clic dins de la llista en compte d'agafar el separador; amb el dit en una tauleta (iPad Pro en horitzontal, per exemple), tot i que el codi a
- **Reproducció:** En una tauleta tactil prou ampla per a entrar en 'ample' (per exemple un iPad Pro en horitzontal, 1366 px), intenta arrossegar amb el dit la junta entre CATEGORIES i ELEMENTS. Resultat erroni: la diana util es la franja de 9 px (1 px de l'element + 4 px a cada costat del ::before); el dit cau damunt de la llista o de l

**`src/components/layout/AppGridShell.jsx:123`** — aria-valuemax del separador no coincideix amb el topall real

- **Què passa:** Al resizer se li passa max = COLUMN_LIMITS[col].max, pero resizeColumn torna a retallar amb availableMax, que sol ser mes xicotet; el separador anuncia un recorregut que no existeix i aria-valuenow es queda per davall d'aria-valuemax sense que cap tecla puga acostar-s'hi.
- **Què veu la persona:** Una persona que navega amb lector de pantalla en una finestra d'entre ~1090 i ~1262 px tabula fins al separador d'ELEMENTS i sent «separador, de 240 a 520, valor actual 300». Prem Fi: el valor puja fins a 508 i el lector diu 508 sobre un màxim anunciat de 520. A partir d'ací prem Fi o Fletxa dreta tantes vegades com vulga i no passa absolutament res: la columna no es mou ni un píxel i el lector repeteix sempre 508, s
- **Reproducció:** 1) Finestra de 1100 px, columna esquerra en 270 px (mida = 'ample'). 2) Tabula fins al separador d'ELEMENTS: el lector de pantalla llig un recorregut de 240 a 520. 3) Prem Fi (End). gridSizeFromKey torna 520, pero resizeColumn el retalla a availableMax = 1100 - 270 - 320 - 2 = 508. Resultat erroni: la columna s'atura e

**`src/data/supabase/content.js:76`** — El Mur i Multimèdia descarreguen dues vegades el catàleg sencer

- **Què passa:** `loadMur` i `loadMultimedia` criden tots dos `loadAppData`, que llança tres peticions (app_content sencer, section_submissions i notes), i els dos proveïdors es munten sempre a l'arbre d'App.jsx encara que la persona no òbriga cap de les dues seccions.
- **Què veu la persona:** En obrir l'app a qualsevol ruta —inclosa /jo/xat, que no fa servir ni el Mur ni Multimèdia— el navegador descarrega dues vegades el catàleg complet d'`app_content` (towns, agents, feedPosts, marketItems, events, mediaItems, pages, noteFolders, notes) i dues vegades `section_submissions`, més dues de `notes` si la persona té sessió iniciada. En una connexió lenta o en dades mòbils, la persona veu les esqueletes de càr
- **Reproducció:** Estat inicial: app tancada. Acció: obrir l'app a qualsevol ruta (per exemple /jo/xat, que no fa servir ni el Mur ni Multimèdia) amb el panell de xarxa obert. Resultat erroni observable: `/rest/v1/app_content?select=key,payload,version&tenant_id=eq...` ix dues vegades, i `section_submissions` i `notes` també dues cada u

**`src/css/modules.css:195`** — L'anell de focus de les categories el retalla el contenidor amb scroll

- **Què passa:** `.sdp-workspace-category` no té regla de focus pròpia, hereta l'anell global amb `outline-offset: 2px`, i el cos de la columna té `overflow-x: hidden`, que en talla els costats.
- **Què veu la persona:** Navegant amb Tab per la columna de CARPETES (Notes), la carpeta enfocada no mostra un rectangle taronja tancat sinó només dues ratlles horitzontals (dalt i baix), perquè els trams esquerre i dret de l'anell queden fora de la caixa amb overflow-x: hidden. Sobre la carpeta activa, amb fons --sdp-accent-subtil, això fa difícil distingir d'un colp d'ull quina carpeta té el focus — mentre que a la llista de notes del cost
- **Reproducció:** Estat inicial: Notes obertes en finestra ampla, columna CARPETES visible amb diverses carpetes. Acció: navegar amb Tab fins a una carpeta de la llista. Resultat erroni: el botó ocupa el 100% de l'amplada de `.sdp-workspace-column__body`, i com que l'anell es dibuixa 2px per fora, els trams esquerre i dret queden fora d

**`src/sections/admin/AdminSection.jsx:170`** — Les pestanyes de la graella a Administració es diuen ESQUERRA i CENTRE

- **Què passa:** AdminSection munta AppGridShell sense `leftTitle`/`middleTitle`, i els valors per defecte es converteixen en el text visible i el nom accessible dels botons de panell a tauleta i mòbil; a més `rightColumn={null}` deixa la primera pantalla buida.
- **Què veu la persona:** Un superadmin que òbriga /admin en una finestra de menys de 720px veu, sota la barra superior de UniversalPage, dues pestanyes que diuen literalment «ESQUERRA» i «CENTRE», i davall una zona de contingut completament buida (la columna dreta és null i les altres dues estan desplaçades fora de pantalla amb inert). Ha d'endevinar que ha de tocar «ESQUERRA» per veure el menú d'administració o «CENTRE» per veure el tauler.
- **Reproducció:** Estat inicial: sessió de superadmin, secció Administració, finestra de mòbil (< 720px, mida 'estret'). Resultat erroni en entrar: les dues pestanyes de dalt diuen literalment «ESQUERRA» i «CENTRE» (i això mateix és el que llig el lector de pantalla), i sota no hi ha res: `panellObert` és null, així que la columna esque

**`src/config/theme.js:14`** — El tema es llig del <html> de la pàgina amfitriona, no del component

- **Què passa:** Les dues branques que pretenen llegir el tema de dins del shadow root són mortes (`.shadowRoot` és `null` amb `mode: 'closed'`, i `.sdp-root` no porta mai `data-theme` perquè l'atribut es posa a l'element amfitrió), així que la «font de veritat» acaba sent l'atribut `data-theme` del `<html>` de la pàgina del host, per damunt de la preferència guardada de l'usuari.
- **Què veu la persona:** En un bloc de Sóc de Poble incrustat en una pàgina que marca `<html data-theme="dark">` (o "light"), la persona toca el botó de sol/lluna, el bloc canvia de tema a l'instant i la preferència es guarda a `sdp-theme`; però en recarregar la pàgina el bloc torna a eixir amb el tema de la pàgina amfitriona. Repetit tantes vegades com vulga: el commutador sembla funcionar i la preferència sembla no guardar-se mai.
- **Reproducció:** 1) L'usuari tria el mode clar dins de Sóc de Poble; queda guardat a localStorage amb la clau `sdp-theme`. 2) Sollutia incrusta el bloc en una pàgina el disseny de la qual usa la mateixa convenció i marca `<html data-theme="dark">`. 3) En recarregar, `readThemePreference()` retorna 'dark' abans d'arribar mai al localSto

**`src/sections/detail/PageDetailSection.jsx:18`** — El retorn a dalt en canviar de pàgina no s'executa mai

- **Què passa:** Les dues vies per a trobar `.app-main` travessen el document, i `.app-main` viu dins del shadow root tancat: `document.querySelector` no el veu i `?.shadowRoot?.` és sempre `null`. `main` és sempre `null` i el `scrollTo` no s'executa mai, ni incrustat ni en standalone.
- **Què veu la persona:** En obrir una pàgina de detall (/page/<slug>) després d'haver desplaçat avall la vista anterior — una llista llarga del Mur o una altra pàgina de detall — el contingut nou apareix ja desplaçat, sovint a mitjan text o amb la capçalera i el títol fora de pantalla, i la persona ha de pujar a mà per començar a llegir des de dalt. El mateix passa en canviar de slug sense desmuntar el component.
- **Reproducció:** 1) Obri una pàgina de detall llarga (ruta /page/<slug>). 2) Baixa fins al final. 3) Clica un enllaç cap a una altra pàgina de detall (canvia el `slug`, el component no es desmunta). 4) La pàgina nova apareix ja desplaçada avall, a mitjan text, en compte de començar per dalt.

**`src/sections/notes/NotesDataContext.jsx:91`** — La guàrdia de generació descarta el resultat però la nota ja s'ha escrit: cada premuda deixa un fantasma invisible

- **Què passa:** creaNota escriu a Supabase i injecta la fila a l'estat ABANS que UniversalWorkspace decidisca si el resultat encara val. Quan la guàrdia de generació talla (l'usuari ha clicat una altra nota durant els 2 s), no hi ha cap compensació: la nota ja existix al servidor i a la llista en memòria. I com que naix a 'f-notes' sense etiquetes, amb una categoria d'etiqueta activa no apareix enlloc. L'usuari no veu res, ni nota n
- **Què veu la persona:** Amb una etiqueta seleccionada al panell (p. ex. «Tutorial»), l'usuari prem CREAR NOTA i, mentre la xarxa tarda, clica una altra nota de la llista. El botó torna de CREANT… a CREAR i a la pantalla no passa res: no s'obri cap nota buida ni apareix cap fila nova ni cap missatge d'error. L'usuari creu que la creació ha fallat i torna a prémer. Cada premuda ha deixat, però, una nota buida real a Supabase (sense títol, sen
- **Reproducció:** Estat inicial: mida 'mitja', categoria activa 'tag_Tutorial', dos o més notes visibles en eixa etiqueta. Acció: prem CREAR NOTA; mentre la xarxa tarda 2 s, clica una altra nota de la llista (selectItem canvia state.activeItemId, l'efecte de UniversalWorkspace.jsx:265-267 incrementa createGenerationRef). Resultat erroni

**`src/sections/notes/NotesContext.jsx:119`** — Els flushos de pagehide i de pestanya oculta no arriben mai a la xarxa: saveNoteField sempre torna a encuar 600 ms

- **Què passa:** Els dos mecanismes d'eixida d'emergencia del flux (pagehide/visibilitychange al hook de l'editor i a la closca de camps) acaben tots dos cridant saveNoteField, que no te cap cami immediat: sempre programa un setTimeout de 600 ms abans de tocar la xarxa. En pagehide la pagina es congela o es destruix abans que el temporitzador s'execute, aixi que el PATCH no ix mai. Tota la maquinaria de flush d'eixida dels dos fitxer
- **Què veu la persona:** Si l'usuari escriu a una nota i tanca la pestanya (o la finestra) durant el segon i mig seguent a l'ultima tecla, eixes ultimes paraules no arriben mai a /rest/v1/notes. En reobrir l'aplicacio la nota mostra el text anterior, sense cap avis ni indicacio que s'haja perdut res: la persona veu la seua ultima frase desapareguda i cap missatge d'error.
- **Reproducció:** Estat inicial: nota oberta amb text escrit fa menys d'1,4 s. Accio: tancar la pestanya, o al mobil passar l'aplicacio a segon pla (visibilitychange -> hidden i congelacio del proces). Resultat observable: el ganxo d'eixida crida flush -> onSave -> saveNoteField, que nomes posa el camp al payload i arma el setTimeout de

**`src/sections/xat/XatContext.jsx:205`** — Un sondeig en vol esborra el missatge acabat d'enviar o d'arribar per Realtime

- **Què passa:** La reconciliacio de `carregaMissatges` nomes protegix els missatges amb `estatEnviament !== 'enviat'`. Pero `mapejaMissatge` marca SEMPRE `estatEnviament: 'enviat'` (XatContext.jsx:135), i eixe es l'estat tant del missatge confirmat pel servidor a `sendChatMessage` (XatContext.jsx:397-402) com del missatge injectat pel callback de Realtime (XatContext.jsx:271-284). Per tant, qualsevol resposta del sondeig que el serv
- **Què veu la persona:** L'usuari escriu un missatge, el veu aparèixer a la conversa com a enviat i, una fracció de segon després, la bombolla desapareix de la pantalla sense cap avís, com si el missatge mai s'haguera enviat. Torna a aparèixer sola fins a 5 segons més tard (fins a 30 s si el tic anterior havia fallat). Si l'usuari reacciona i el torna a escriure mentrestant, el destinatari rep el missatge duplicat.
- **Reproducció:** Estat inicial: fil obert, `ticFil` corrent cada MS_FIL = 5000 ms (XatContext.jsx:315). Accio: t=0 ms el sondeig llanca `loadMissatges` i el servidor en fa la instantania a t=30 ms; t=50 ms l'usuari prem Enviar (bombolla optimista 'pendent'); t=120 ms l'INSERT torna i `sendChatMessage` substituix l'optimista pel `defini


---

## 4 · Zones que ningú havia obert

Dels 13 defectes que el crític va trobar en zones que ningú havia obert, **4 han sobreviscut** a l'escèptic i **9 han caigut**.

**N1 · [P2] `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:96`**

- CITA VERIFICADA. A `supabase/migrations/260914_0100_auditoria_rls_fixes.sql` la línia 96 és exactament `where tm.town_id = p_tenant_id` i la 97 `and pr.consentiment_rgpd_at is not null`. La funció `membres_del_poble` és efectivament `language sql stable security definer set search_path = ''` (línia 78) i el `where` complet (94-105) només filtra per: town_id, consentiment_rgpd_at not null, `tm.user_id <> auth.uid()`, `private.is_town_member(p_tenant_id)` i el text de cerca. Ma
- **Dany:** Un veí obri /jo/el-meu-perfil, veu l'ajust «Estat del perfil» amb el text literal «Tria si vols ser visible a la gent del poble o mantindre el compte privat» (src/sections/profile/PerfilContext.jsx:37-39) i el posa en privat. El valor es desa correctament a profiles.is_public = false. Però quan qualsevol altre membre del mateix poble obri el xat i busca amb 

**N4 · [P2] `src/data/supabase/xat.js:160`**

- PAS 1 — La cita és exacta. `src/data/supabase/xat.js:154-166` conté literalment `let query = supabase.rpc('membres_del_poble', { p_tenant_id: tenantId });` i, si hi ha `textSearch`, `query = query.ilike('nom', ...)`: ni `p_cerca` ni `p_limit` s'hi passen mai. A `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:69-107` la funció declara `p_cerca text default null, p_limit integer default 100`, filtra per `pr.full_name ilike '%'||btrim(p_cerca)||'%'` a les línies 100-104
- **Dany:** En un poble amb més de 100 veïns amb consentiment RGPD, el selector de «nou xat» només rep les 100 primeres persones per ordre alfabètic de `full_name`. Si busques algú de la segona meitat de l'abecedari (posem, «Vicent Ramos»), el quadre de cerca no mostra cap resultat i la pantalla diu que no hi ha ningú, tot i que la persona és membre del poble. Com que a

**N5 · [P3] `index.html:8`**

- Cites verificades al tall congelat. `index.html:8` conté literalment el `<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self'; connect-src 'self' https: wss: ws://localhost:* http://localhost:*; img-src ...; frame-src 'self' https:; object-src 'none'; base-uri 'self';">` i NO hi ha cap `frame-ancestors`. `vite.config.js:29` té l'única aparició de `frame-ancestors` de tot el repositori, d
- **Dany:** Qualsevol web de tercers pot carregar socdepoble.org dins d'un iframe invisible i superposar-hi la seua pròpia interfície. Una persona ja identificada a Sóc de Poble que visite eixa pàgina i hi faça clic (clickjacking / UI redress) pot acabar disparant accions reals del seu compte sense saber-ho: publicar o esborrar una nota, canviar dades del perfil o accep

> **Avís del relator:** l'escèptic de N5 treballava sobre el tall congelat, i **el tall no incloïa `vercel.json`**. He comprovat a l'arbre viu que `vercel.json:8` **sí que serveix `frame-ancestors` com a capçalera HTTP real en producció**, amb `socdepoble.org`, `*.sollutia.cat` i `*.sollutia.com` a la llista. El desplegament de Vercel està cobert i el dany descrit **no s'hi aplica**. El que queda viu és el build incrustat (`build:wp`) servit des d'un altre lloc, on la protecció depèn de l'amfitrió i no de nosaltres.

**N13 · [P3] `src/data/identitat.js:166`**

- La cita és exacta. A `src/data/identitat.js:166-173` hi ha `export function esborraSessio() { delEfimer(CLAU_JWT); delEfimer(CLAU_REFRESC); delEfimer(CLAU_USUARI); ... }` i `identitat()` (línia ~176-180) cau a `idConvidat()` quan `usuariDeSessio()` torna null. He obert `src/config/storage.js`: `getEfimer/setEfimer/delEfimer` són literalment `window.sessionStorage.getItem/setItem/removeItem` amb prefix `sdp_embed_`, sense cap fallback compartit, sense `BroadcastChannel` i sens
- **Dany:** En un ordinador compartit (biblioteca, ajuntament, aula), qui ha duplicat una pestanya de l'app o ha obert un enllaç en una pestanya nova des de dins i després prem «Eixir» en una d'elles, veu la interfície com a convidat i se'n va creient que ha tancat la sessió. A l'altra pestanya el JWT, el refresh-token i el blob d'usuari (amb el seu correu) continuen a 

**Tombats pel filtre:** N2, N3, N6, N7, N8, N9, N10, N11, N12.


---

## 5 · Veredicte de la frontera Sollutia: 5/10

### El que està bé de veres
La separació `contracte.js` + `backendPort.js` + `host.js` és real: cap mòdul de `src/` importa `data/supabase/` directament. El segellat en dues fases, l'allowlist d'orígens, el shadow root tancat, el `fontRefCount` amb recompte i la retirada del germà multi-instància són faena seriosa.

### El que bloqueja el 10/10

1. **El component no té caixa.** `tokens.css:20` té `:host { all: initial }` **fora de tota capa**; la regla bona (`base.css:19-29`, amb `display:block`, `height:100%`, `contain:layout style`) viu dins de `@layer reset`. Per la cascada de CSS Cascade 5 el que està fora de capa guanya sempre. L'element que Sollutia posarà a la seua pàgina acaba sent `display:inline` i col·lapsa. **Verificat per mi.**
2. **Els avisos es pinten nus dins del `<body>` de Sollutia.** `AvisadorEfimer.jsx:46` fa `sdpElement.shadowRoot`, però el root és `{mode:'closed'}` (`PedraSecaEmbed.jsx:297`), i això val **sempre `null`**. Cada toast cau a `document.body`, fora de l'arrel, sense cap CSS. **Verificat per mi.**
3. **El traspàs de sessió no funciona de fàbrica.** `injectaSessio(sessio)` crida `adoptaSessioExterna(sessio, {})`, i `identitat.js:242-247` torna `false` immediatament si no hi ha `emissorEsperat`. L'alternativa és `VITE_SOLLUTIA_ISSUER`, que **no és enlloc**: ni a `.env.example`, ni documentada. **Verificat per mi.**
4. **La injecció parcial fa un Frankenstein.** El docstring promet mode estricte; `arrenca()` fusiona amb Supabase si falta un sol mètode del nucli, sense avisar.
5. **`loadActesAgenda` és al contracte i no l'implementa ningú** dins de `src/data/supabase/`. L'única implementació és el mock. Agenda està morta amb el backend per defecte. **Verificat per mi.**
6. **El component s'apropia del `<head>` de l'amfitrió per defecte** (`manageDocumentHead` actiu si no es diu el contrari), i `useSEO.js` aplica la mateixa política pel seu compte.
7. **`tenantId` no es valida:** si és nul, `loadNotes` consulta `tenant_id=eq.null` i torna zero files **sense error**.

### Les portes són teatre
- `tractor-sollutia.mjs` → verd. La llei S2 (instància única), l'única que mirava comportament, està **retirada**.
- `tractor-adaptadors.mjs` → verd. L'únic traductor és `(payload) => payload`, una funció identitat que no pot fallar mai. **La porta és estructuralment incapaç de posar-se roja.**
- `tractor-enxufe.mjs` → la llei E1 busca imports de `supabaseBackend`, **un fitxer que ja no existeix**. Un import directe de `data/supabase/notes.js` passaria sense que ningú xistés.

### Dues coses que el certificador va dir malament
Les corregisc perquè no entren a l'acta com a certes:
- Va afirmar que `INTEGRACIO.md` mana copiar una carpeta `requirements/` inexistent. **És fals: la carpeta existeix** amb els dos fitxers citats.
- Va afirmar que `frame-ancestors` només viu al servidor de desenvolupament. **També és fals**: `vercel.json:8` el serveix com a capçalera HTTP real en producció.

El segon error és culpa meua, no seua: **el tall congelat no incloïa `vercel.json`** (ni `Dockerfile`, `docker-compose.yml`, `.env.example`, `wordpress-plugin/`, `scripts/`, `public/` ni `assets/`). Cap agent els podia vore. **Tota conclusió d'aquest informe sobre desplegament, capçaleres o empaquetat s'ha de considerar no verificada.**

La resta del seu veredicte s'aguanta, i n'he verificat personalment els punts 1, 2, 3 i 5.

---

## 6 · Honestedat sobre la cobertura

Això **no és una auditoria completa**, i seria deshonest vendre-la com a tal:

- S'han obert **~39 de 194** fitxers de codi de `src/`. El 80% dels fitxers i el 59% de les línies **no s'han mirat**.
- Sense cobrir: `RouterContext.jsx` (356 línies, i sis troballes són de ruteig), `identitat.js`, `sanitize.js`, `XatSection.jsx`, `i18n.js`, tot `components/PedraSeca/`, i les seccions agenda, control, mercat, mur, onboarding, població, pobles, realitat, cerca, text, traduccions i disseny.
- **Classes de defecte no buscades:** RLS i seguretat de base de dades a fons, injecció fora de DOMPurify, CSP i empaquetat, internacionalització, i el fet que 13 fitxers de test cobreixen 194 de codi.
- **Les 48 portes de `tooling/gates/` no s'han auditat.** Són els vigilants automàtics dels mateixos invariants que acabem de trobar trencats.

---

## 7 · Troballes descartades (27)

Es registren perquè ningú les torne a reportar:

- `src/sections/notes/NotesContext.jsx:133` — L'actualitzador d'estat dels overrides muta l'estat anterior i escriu a sessionStorage des de dins
- `src/sections/notes/NotesContext.jsx:125` — expectedRevision ?? 0 desactiva en silenci el bloqueig optimista al PATCH
- `src/components/layout/AppGridShell.jsx:141` — El calaix de categories obert en tauleta deixa navegable el que tapa
- `src/sections/dispositius/DevicesSection.jsx:177` — El temporitzador de simulació de dispositius no es cancel·la mai
- `src/sections/xat/XatContext.jsx:289` — Dues subscripcions de Realtime en vol deixen un canal orfe al xat
- `src/host.js:285` — `injectaSessio` rebutja sempre la sessió en silenci si el host no passa `emissorEsperat`
- `src/data/supabase/notes.js:55` — Una revisio 0 desactiva en silenci el bloqueig optimista
- `src/data/supabase/config.js:59` — Desar el perfil mata en silenci el canal de temps real del xat
- `src/sections/notes/NotesContext.jsx:79` — NotesContext encara escriu a sessionStorage i muta l'estat previ dins de l'actualitzador
- `src/components/layout/AppGridShell.jsx:131` — La persistència d'amplades de columna depèn que l'actualitzador s'execute de forma síncrona
- `src/components/universal/richText/useUniversalRichText.js:22` — Refs escrits durant el render a l'editor ric i a la closca de l'editor
- `INTEGRACIO.md:7` — INTEGRACIO.md descriu fitxers i una cadena de build que no existixen
- `src/sections/notes/NotesContext.jsx:18` — Cap camí de l'aplicació escriu mai tags ni categories: els grups ETIQUETES i CATEGORIES són de només lectura per sempre
- `src/components/universal/richText/useUniversalRichText.js:96` — El buidatge d'eixida de l'editor es torna a endarrerir 600 ms i mor amb la pagina
- `src/sections/notes/NotesSection.jsx:69` — handleSelectionChange tira el categoryId que emet el workspace: la posició a CARPETES/ETIQUETES no sobreviu a cap recàrrega
- `src/sections/xat/XatContext.jsx:354` — El xat no torna a subscriure's a Realtime despres d'una renovacio de JWT
- `src/data/supabase/xat.js:28` — El gestor d'errors de Realtime es registra amb l'aritat equivocada i no s'executa mai
- `src/components/universal/workspace/UniversalWorkspace.jsx:41` — El `memo()` de DetailColumn no salta mai cap repintat: `copy` es recrea a cada render i s'hi passa com a prop

---

## 8 · Registre

- **Data:** 2026-09-18
- **Auditor:** Claude Opus 5 (Ultracode), a petició del Mestre i de la IAIA MarIA
- **Tall:** HEAD `6d828e01` + arbre brut, empremta `f1b276c0`, 218 fitxers
- **Mètode:** cacera multi-lent → refutació adversarial → crític de completesa → certificació
- **Agents:** 118 completats · **Tokens:** ~9,3 M · **Codi modificat:** cap
