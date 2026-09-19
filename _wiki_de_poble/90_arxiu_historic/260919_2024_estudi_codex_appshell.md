---
type: informe
status: esborrany
description: Auditoria local d'AppShell, contextos, Pobles, Notes i Disseny amb defectes, proves i límits de diagnòstic
tags:
  - arquitectura
  - disseny
---

# Auditoria Codex — AppShell i contextos

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-ESTUDI-260919-2024 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 20:24 · Europe/Madrid |
| Modificació | 26-09-19 20:24 · Europe/Madrid |
| Agent redactor | Codex |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Tall | HEAD 214f5c7c65bdc011c2d7e2f93f73d50438f9fa21 + canvis locals preexistents |

## Vincles i entrades

- [[00_index_escriptori]]
- [[260919_1955_PROMPT_Auditoria_AppShell]]
- [[260919_1945_ACTA_MARMOTA_Fusion_Sidebar]]
- Encàrrec adjunt `Texto pegado.txt`, SDP-PROMPT-260919.
- Fonts locals de `socdepoble.org`; les cites `ruta:L–L` corresponen a l'arbre de treball, no exclusivament a HEAD.
- Evidència local: `/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-appshell-audit-260919-a6q6sb06/`. `manifest.json` conté 235 empremtes; `snapshot/` conserva còpies exactes dels fitxers auditats. La carpeta temporal no és un lliurable permanent.

Auditoria sense web, navegador, consultes al backend, instal·lacions ni modificacions de codi. «Pedra Seca» significa exclusivament el sistema de disseny. Les indicacions de correcció són criteris per a IAIA MarIA, no canvis aplicats.

## Veredicte i gravetat

**13 defectes confirmats en el codi o en proves locals i un incident P1 amb mecanisme identificat però desencadenant real pendent.** No hi ha evidència per a afirmar una «fuita letal» de memòria, atribuir totes les pantalles buides a una sola causa o garantir compatibilitat immutable durant 40–50 anys.

P1 significa bloqueig d'un flux principal en les condicions descrites; P2 significa degradació funcional, d'accessibilitat o de capacitat per a detectar regressions. No s'ha demostrat cap P0. Les proves amb jsdom comproven comportament de components i estat; no mesuren Flexbox, píxels, focus natiu de Safari ni accessibilitat amb lector de pantalla.

## F01 · P1 · Incident `.add()` pendent de reproducció completa: subscripció a un proveïdor destruït

**Evidència.** El fitxer actual `src/app/contexts/CoreContentContext.jsx` acaba en la línia 81; el hook és a **79–80**, no a 149. Executa `useContext(CoreContentContext)`. Vite redirigix React a Preact (`vite.config.js:32–40`); la instal·lació local és Preact 10.29.8 (`node_modules/preact/package.json:1–4`). En Preact, `useContext` crida `provider.sub(currentComponent)` (`node_modules/preact/hooks/src/index.js:364–381`). El proveïdor inicialitza `subs` amb un `Set`, assigna `null` en desmuntar-se i posteriorment `sub` fa `subs.add(c)` sense guarda (`node_modules/preact/src/create-context.js:8–38`).

**Prova i límit.** Muntar un proveïdor Preact, conservar-ne la referència, desmuntar-lo i invocar la seua subscripció reproduïx exactament `Cannot read properties of null (reading 'add')`. És una reproducció del mecanisme intern, no de la navegació de l'usuari. En tres escenaris reduïts amb CoreContent, el router real i una càrrega diferida —resolució normal, canvi de clau pendent i eixida de ruta pendent— no s'ha reproduït el mateix `.add()`. No queda identificat quin consumidor recupera una referència destruïda en la sessió original.

`useRecarregaExterna` usa `addEventListener` i elimina el mateix callback (`src/app/contexts/useRecarregaExterna.jsx:7–19`). Amb el proveïdor real i dependències de dades simulades, dotze recàrregues deixen **un** oient actiu i el desmuntatge en deixa **zero**. Això refuta atribuir-li una acumulació d'oients en eixe escenari; no equival a un perfil de memòria de tota l'aplicació.

**Correcció exigible.** Capturar la traça completa, el mòdul servit i el seu mapa de fonts; reproduir la seqüència amb les mateixes versions i imports. Revisar especialment identitat de proveïdors i suspensions: Core es remunta per `actorKey` (`src/app/App.jsx:465–481`), les rutes es carreguen diferidament (`src/app/App.jsx:17–37,539–543`) i Preact conserva/restaura arbres suspesos (`node_modules/preact/compat/src/suspense.js:118–188,200–227`). **[SUPÒSIT]** HMR, una versió servida diferent o una interacció de suspensió poden explicar la discrepància de línies; cap d'aquestes causes està demostrada.

Afegir un valor per defecte després de `useContext` no intercepta una excepció llançada dins de la subscripció; el fallback actual també oculta una absència de proveïdor fent-la semblar una càrrega eterna (`src/app/contexts/CoreContentContext.jsx:79–80`). Cal una comprovació explícita del contracte de context en desenvolupament. No es proposa silenciar `subs.add`, editar dependències ni canviar de runtime sense reproducció.

## F02 · P1 · El `Dialeg` obri un menú que el CSS continua amagant

**Evidència.** En mode compacte, AppShell munta un `nav.app-sidebar` sense `sidebar-open` dins de `Dialeg` (`src/app/App.jsx:323–334`). A amplades de viewport de fins a 1100 px, eixe selector rep `position: fixed`, `transform: translateX(-102%)` i `visibility: hidden`; només `.sidebar-open` ho desfà (`src/css/layout.css:321–340`). Els estils del diàleg afecten el contenidor i el seu cos, però no restablixen aquestes propietats del `nav` (`src/css/components.css:170–204`).

**Impacte.** El fet d'obrir el modal no fa visible el seu fill amagat. És un conflicte estàtic confirmat del tall auditat; l'afirmació de l'encàrrec que mòbil funciona no queda acreditada amb aquestes regles.

**Correcció exigible.** Un únic propietari de l'obertura: el diàleg gestiona la modalitat i el menú interior té flux i visibilitat normals. Retirar o acotar les regles de l'antic calaix. Acceptació: obrir, navegar, tancar i tornar a obrir a 360, 768 i 1100 px; el menú ha de ser visible i operable amb teclat.

## F03 · P1 · AppShell mesura i modifica el `body` de l'amfitrió

**Evidència.** L'amplada inicial és `window.innerWidth`, l'observador mira `document.body` i el mode deriva d'eixa mesura (`src/app/App.jsx:68–83`). El botó d'escriptori posa `sidebar-closed` en `document.body` sense neteja de l'efecte (`src/app/App.jsx:92–98`). El CSS que torna a mostrar el botó d'obertura espera la classe en `:host` o en `.sdp-root` (`src/css/layout.css:188–190,564–588`). La versió incrustada crea una `.sdp-root` dins del shadow root (`src/PedraSecaEmbed.jsx:300–326`).

**Impacte.** Un component de 600 px dins d'una pàgina de 1400 px pot seleccionar el mode d'escriptori. En la incrustació, tancar el `nav` amb l'estil inline d'AppShell (`src/app/App.jsx:336`) no activa necessàriament el selector que ha de mostrar el botó per a recuperar-lo: la classe queda fora del shadow root. Diverses instàncies compartixen i sobreescriuen eixe estat global. En la web principal sí que el `body` té `.sdp-root` (`index.html:63–64`); no s'ha d'extrapolar eixe cas a la incrustació.

**Correcció exigible.** Mesura, mode i estat visual han de pertànyer a l'arrel de cada instància. El CSS ha de consumir el mateix mode que calcula el component, sense una segona decisió independent basada en el viewport. Acceptació: dos components d'amplades diferents en el mateix document i tancament/reobertura independent.

## F04 · P1 · Una arrencada fallida deixa `quanLlest()` pendent

**Evidència.** La promesa compartida només conserva un `resolve` (`src/host.js:88–92`). L'èxit la resol, però el `catch` restaura parcialment l'estat i rellança sense rebutjar-la (`src/host.js:194–215`). Core espera eixa promesa abans de carregar dades (`src/app/contexts/CoreContentContext.jsx:24–37`). L'entrada web inicia `arrenca()` sense esperar-la ni gestionar el rebuig abans de pintar (`src/main.jsx:19–33`).

**Prova.** Executant les declaracions originals d'estat i d'arrencada amb una fallada simulada en `defineCustomElement`, `arrenca()` rebutja i `quanLlest()` continua pendent. La lectura confirma que no té camí de rebuig; no és només un llindar temporal de la prova.

**Impacte.** Sense un reintent reeixit, les vistes poden quedar en càrrega indefinida i els seus `catch` no reben l'error d'arrencada. Un `AbortController` per al fetch no cancel·la aquesta espera anterior.

**Correcció exigible.** Un contracte d'arrencada que resolga o rebutge cada intent, i política explícita de reintent. Els consumidors han de distingir espera, error i cancel·lació, i comprovar que continuen actius abans d'iniciar treball després de l'espera. Acceptació: arrencada reeixida, fallida, reintent i desmuntatge mentre està pendent.

## F05 · P1 · Notes consulta el port abans de la barrera d'arrencada

**Evidència.** `getCurrentUser()` s'executa abans d'esperar `quanLlest()` (`src/sections/notes/NotesDataContext.jsx:37–41`). El port llança síncronament quan falta el mètode (`src/data/backendPort.js:51–55,87`). L'efecte transforma l'excepció en estat d'error; els seus disparadors no inclouen l'estat de preparació del host (`src/sections/notes/NotesDataContext.jsx:66–79`).

**Prova.** Amb el port inicialment no preparat, Notes queda en `error`, amb zero crides a `loadNotes`. Resoldre posteriorment la promesa de preparació no ho recupera si no canvia cap altra dependència.

**Correcció exigible.** Esperar l'arrencada abans de qualsevol lectura del port i llegir la identitat després d'eixa espera. No confiar que un canvi de sessió accidental repetisca l'efecte. Acceptació: retardar la instal·lació del backend i comprovar una càrrega correcta sense navegar ni recarregar manualment.

## F06 · P1 · Canviar de tenant deixa Notes carregant indefinidament

**Evidència.** `data.scopeKey` només s'inicialitza amb el primer scope (`src/sections/notes/NotesDataContext.jsx:23–28`). En canviar `scopeKey`, l'efecte nou no posa l'estat en el scope nou i descarta la resposta si `prev.scopeKey !== scopeKey` (`src/sections/notes/NotesDataContext.jsx:32–47`). El valor públic continua en `loading` mentre les claus diferixen (`src/sections/notes/NotesDataContext.jsx:79–84`). La clau de muntatge de Notes depén de l'actor, no del tenant (`src/app/App.jsx:465–473`).

**Prova.** Mateix actor: tenant A → `ready`, una petició; tenant B → segona petició resolta però estat públic `loading`, sense `scopeKey` exposat. No és una fallada de connexió.

**Correcció exigible.** Adoptar el nou scope al començar cada generació de càrrega, o remuntar per una identitat completa del domini. Les respostes i mutacions han de contrastar-se amb el scope vigent, no amb variables capturades del mateix render. Acceptació: A→B→A i respostes fora d'ordre sense bloqueig ni dades creuades.

## F07 · P1 · No està implementat l'ordre temporal de Pobles ni la seua invalidació

**Evidència.** `sortedTowns` deriva de `byId` (`src/app/contexts/CoreContentContext.jsx:53–55`), que només elimina duplicats i conserva l'ordre d'entrada (`src/config/contentHelpers.js:19–26`). El carregador consulta les claus `towns` i `agents`, sense calcular activitat del Mur (`src/data/supabase/content.js:68–74`). La vista mostra la llista tal com arriba (`src/sections/pobles/PoblesSection.jsx:38–40`); el requisit d'ordenació només figura com a comentari (`18–27`).

A més, publicar delega la petició i retorna sense actualitzar ni invalidar els contextos (`src/sections/mur/MurContext.jsx:54–56`). La publicació de Notes tampoc emet la recàrrega de Pobles (`src/sections/notes/NotesContext.jsx:201–224`), i Connectar navega al destí després d'escriure (`src/sections/connectar/ConnectarSection.jsx:170–182`).

**Prova.** `byId` conserva un poble amb data antiga davant d'un poble amb data recent. No s'ha consultat la base de dades: que La Torre siga l'únic poble amb dades reals és una dada de l'encàrrec, no una verificació de l'auditoria.

**Correcció exigible.** Definir una projecció d'activitat per identificador estable de poble, amb màxima data de publicació vàlida i desempat determinista. Actualitzar o invalidar eixa projecció després d'una publicació confirmada i reconciliar canvis externs. Si és global entre pobles, especificar també l'abast: la consulta actual està filtrada per un sol `tenant_id` (`src/data/supabase/content.js:73`). Acceptació: una publicació nova mou el poble correcte al primer lloc, també després de tornar a la vista.

## F08 · P2 · Pobles transforma errors i càrregues en «Cap poble trobat»

**Evidència.** Core exposa arrays buits sempre que no està preparat (`src/app/contexts/CoreContentContext.jsx:48–49`), però Pobles només consumix `sortedTowns` i tracta `length === 0` com a absència de resultats (`src/sections/pobles/PoblesSection.jsx:9–11,82–85`). Una resposta remota buida també acaba en arrays buits (`src/data/supabase/content.js:73–74`; `src/data/supabase/runtime.js:96–107`).

**Impacte.** L'usuari no pot distingir càrrega, credencials/configuració absents, fallada de xarxa, catàleg sense dades o absència real de pobles. El missatge de pantalla no demostra que el catàleg estiga buit.

**Correcció exigible.** Representar explícitament els estats del recurs, amb reintent i error comprensible. Decidir el contracte de resposta buida sense inventar pobles ni substituir silenciosament dades remotes per llavor. Acceptació: càrrega lenta, error i resposta buida tenen representacions diferents.

## F09 · P2 · OAuth ja rebutja com a promesa, però pot consumir l'únic intent abans d'hora

**Evidència.** El wrapper `async` evita l'excepció síncrona anterior (`src/data/backendPort.js:80–85`), però AppShell marca `tornadaFeta.current = true` abans de cridar-lo i no espera `quanLlest` (`src/app/App.jsx:131–138`). L'entrada pinta sense esperar `arrenca()` (`src/main.jsx:19–33`).

**Impacte.** Si el port encara no està disponible, l'error es mostra i l'efecte no torna a intentar gestionar la tornada quan el backend estiga preparat. La conversió a promesa resol el tipus d'excepció, no l'ordre d'inicialització.

**Prova i correcció exigible.** La crida sense backend retorna un rebuig capturable, sense llançament síncron. Per a completar la correcció, esperar el port i distingir intent iniciat de tornada resolta. Acceptació: backend retardat i tornada OAuth pendent, amb una sola resolució reeixida.

## F10 · P2 · El carregador de Disseny depén d'un marcador de storage no protegit

**Evidència.** `ambReintent` llig i interpreta `sessionStorage` abans del `try`; després també escriu el marcador dins del `catch` (`src/sections/disseny/cataleg/detailRegistry.jsx:3–19`). El catàleg carrega el detall mitjançant aquests loaders (`src/sections/disseny/DesignSection.jsx:10–26`).

**Prova.** Un marcador `sdp-chunk-refreshed` amb JSON invàlid causa `SyntaxError` amb **zero** invocacions a l'importador. Un error d'accés al storage també escapa de la lectura anterior al `try`.

**Correcció exigible.** El mecanisme de reintent no pot impedir la càrrega pel seu propi estat auxiliar. Lectura defensiva i un reintent explícit per recurs; no usar una recàrrega completa com a substitut universal del diagnòstic. Acceptació: storage denegat, marcador invàlid i importació rebutjada mostren una recuperació controlada.

## F11 · P2 · L'error d'una ruta es conserva en navegar a una altra

**Evidència.** `RouteErrorBoundary` embolcalla totes les rutes, conserva `hasError` i només el restablix en prémer el seu botó (`src/app/App.jsx:497–531`). No rep cap identitat de ruta per reiniciar-se. A més, els proveïdors de dades estan per damunt d'aquest límit (`src/app/App.jsx:469–499`); un error de render en un proveïdor pot arribar al límit global (`src/PedraSecaEmbed.jsx:57–68`; `src/components/ErrorBoundary.jsx:8–24`).

**Impacte.** Canviar de secció no garantix abandonar la pantalla d'error. Les excepcions asíncrones s'han de conduir a l'estat del domini: Notes rellança `ReferenceError` dins d'una funció asíncrona invocada sense gestionar la promesa (`src/sections/notes/NotesDataContext.jsx:66–74`).

**Correcció exigible.** Reinici del límit per identitat de ruta i contenció dels errors de cada recurs. Els errors inesperats han de conservar diagnòstic sense deixar promeses rebutjades fora de control. Acceptació: una ruta que falla no impedix entrar en una altra sana.

## F12 · P2 · No hi ha degradació completa per a navegadors sense les primitives requerides

**Evidència.** AppShell instancia `ResizeObserver` sense detecció (`src/app/App.jsx:73–81`); l'espai de Notes/Disseny fa el mateix (`src/components/layout/AppGridShell.jsx:71–100`). La base de layout està dins de `@layer` (`src/css/base.css:7–53`; `src/css/layout.css:6–40`), i el calaix declara `100dvh` sense alçada alternativa immediata (`src/css/components.css:198–204`). Si falta `showModal`, Dialeg només posa l'atribut `open` (`src/components/PedraSeca/organismes/Dialeg.jsx:31–42`); eixe camí no implementa confinament de focus ni bloqueig del fons.

**Impacte i límit.** L'absència de `ResizeObserver` provoca una excepció. Un motor que no entén les capes no aplica les regles contingudes. El fallback del diàleg no equival a modalitat accessible. No s'han provat versions d'iOS ni es fixa ací una taula de compatibilitat no consultada.

**Correcció exigible.** Declarar una base de navegadors verificable i un comportament de reserva usable, amb proves sobre els dispositius acceptats. La incògnita de l'scroll en iOS antic no es resol deduint-la de l'eliminació d'una classe. No hi ha base per a certificar «qualsevol dispositiu» o 50 anys de funcionament sense manteniment.

## F13 · P2 · El menú recrea el subarbre i comunica un estat accessible incorrecte

**Evidència.** `SidebarContent` es declara dins d'AppShell i es renderitza com a component (`src/app/App.jsx:267–317,331–337`), de manera que cada render del pare crea un tipus de component nou. El botó de TopBar declara `aria-expanded="false"` de forma fixa (`src/app/App.jsx:367–384`).

**Impacte.** Els canvis d'estat o mida del pare poden remuntar els nodes del menú, perdent focus o posició de desplaçament. Les tecnologies d'assistència reben «tancat» encara que el menú estiga obert.

**Correcció exigible.** Identitat estable del component i estat real compartit amb el botó accessible. Revisar també la restauració del focus quan canvia el mode amb el diàleg obert, ja que l'efecte de Dialeg només la fa en la transició `obert=false` (`src/components/PedraSeca/organismes/Dialeg.jsx:31–42`). Acceptació: canviar mida i navegar amb teclat conserva un focus previsible.

## F14 · P2 · Les proves actuals no acrediten els fluxos afectats

**Evidència.** La prova d'App només comprova que existisca el contenidor; usa un `getCurrentUser` asíncron, mentre el port real de Supabase és síncron, i no espera dades de les tres vistes (`src/app/App.test.jsx:23–37`; `src/data/supabase/runtime.js:36`). La prova de Notes munta el seu proveïdor sense `SessionProvider` (`src/sections/notes/NotesDataContext.test.jsx:5–13`), encara que ara crida `useSession()` i aquest hook llança fora del proveïdor (`src/sections/notes/NotesDataContext.jsx:23–25`; `src/app/contexts/SessionContext.jsx:41–44`).

La prova de Disseny importa tots els mòduls abans de renderitzar-los directament; no exercita el `Suspense` dels loaders ni les transicions de ruta (`src/sections/disseny/cataleg/detalls/allLoaders.test.jsx:14–29`).

**Correcció exigible.** Ajustar els contractes dels dobles de prova i verificar sortides observables: contingut carregat, menú visible, errors controlats, recuperació, canvi de tenant i navegació durant imports pendents. Una asserció sobre l'existència del contenidor pot passar amb un fallback d'error. No es declara una suite verda: aquesta auditoria ha executat diagnòstics locals acotats, no tota la bateria del projecte.

## Incògnites que impedixen tancar els incidents originals

1. **Sidebar a pantalla completa.** No es confirma que falte Flexbox en el tall actual: `.sdp-root`, `#root` i `:host` declaren `display:flex` (`src/css/base.css:41–49`); el `nav` té base fixa i el `main` és flexible (`src/css/layout.css:15–18,43–48`). AppShell retorna un fragment (`src/app/App.jsx:319–363`). AppGridShell té el seu posicionament dins del contingut, no constituïx el pare directe del `nav` global (`src/components/layout/AppGridShell.css:5–30`; `src/app/App.jsx:341–359`). **[SUPÒSIT]** Estils efectivament servits diferents, una capa no suportada o un altre amfitrió podrien explicar el símptoma. Calen les dimensions i els estils computats de l'execució que falla; no s'ha obert cap navegador per respectar l'encàrrec.
2. **Traça completa del `.add()`.** La línia 149 no correspon al fitxer actual. Falta identificar el proveïdor destruït i la seqüència que el reutilitza. No s'ha demostrat corrupció d'un `Set` de l'aplicació ni fuita acumulativa de memòria.
3. **Dades remotes.** Sense consultar el servidor no es poden certificar credencials, resposta de `app_content`, permisos, nombre de pobles ni ordre real de la llavor desplegada.
4. **Garantia temporal.** La durabilitat exigix contractes documentats, dades portables i comprovacions de regressió sobre versions concretes. Una arquitectura immutable a 50 anys és una garantia que aquesta evidència no permet donar.

## Evidència i comprovacions documentals

- `context-diagnostics.json`: reproducció del mecanisme Preact i de Notes abans de backend. Les mesures intermèdies de càrrega de la primera prova es van substituir per les estabilitzades següents.
- `context-settled.json`: Notes A preparat/B bloquejat; 13 càrregues de Core per càrrega inicial + 12 recàrregues; un oient actiu i zero després de desmuntar; escenaris reduïts de càrrega diferida sense reproduir el `.add()`.
- `boot-diagnostics.json`: barrera d'arrencada pendent després d'error i rebuig asíncron correcte del wrapper OAuth.
- `design-diagnostics.json`: marcador invàlid impedix invocar l'importador.
- `app-offline.json`: **exclòs com a prova de defectes del producte**. L'arnés integral va produir un error de runtime diferent (`undefined.context`) i no equival al pipeline Vite. No s'ha continuat iterant sobre eixe arnés.
- El tancament s'executa en còpia temporal perquè sincronitza i reescriu els espills de skills (`tooling/gates/tancament.mjs:17–21`; `tooling/wiki/sincronitzar_skills.mjs:25–41`). El graf inicial tenia un orfe: la petorreta 1955 d'aquest mateix encàrrec.

## Bateria de veritat

- [x] Codi local explorat; cap font externa ni navegador.
- [x] Afirmacions sobre implementació amb rutes i línies del tall auditat.
- [x] Cap fitxer, funció o variable inventat presentat com a existent.
- [x] Hipòtesis marcades i causes no demostrades consignades a Incògnites.
- [x] Cap línia de codi de l'aplicació modificada, afegida ni esborrada.
- [x] Frontmatter estricte del document validat: 1 document, F1–F8 = 0, eixida 0.
- [x] Tancament documental en còpia: eixida 0, graf sense orfes després d’ancorar l’informe i la petorreta. Les 235 empremtes de fonts coincidixen amb el tall conservat.

Validació individual: `node tooling/wiki/tractor-frontmatter.mjs --estricte --arrel=<copia_documental> --arrels=docs --json`. Només s’ha certificat el frontmatter d’aquest informe, no el corpus complet. Tancament: `node tooling/gates/tancament.mjs --json`, executat en `gate-copy/`; estat documental actualitzat a `.agents/ESTAT.md`.
