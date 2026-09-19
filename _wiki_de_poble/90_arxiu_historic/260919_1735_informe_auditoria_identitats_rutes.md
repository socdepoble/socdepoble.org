---
type: informe
status: esborrany
description: Auditoria de les rutes planes, les transicions de sessió i actor, i els límits de la integració modular.
tags:
  - arquitectura
  - seguretat
---

# Auditoria d’identitats, rutes i enxufabilitat

Mestre, **mantindria les rutes planes, però no donaria per tancada la cirurgia**. La migració necessita una transició coherent de sessió, actor i dades: ara l’actor pot conservar l’usuari anterior, les Notes poden conservar dades d’un altre àmbit i una resposta asíncrona pot recuperar un rol o una sessió caducats. Les evidències i els límits de cada conclusió consten davall.

Registre: SDP-AUDITORIA-260919 · versió 1.0.0 · Codex · 26-09-19 17:35, Europe/Madrid · aprovació humana pendent · revisió pendent. Entrada: petició SDP-PROMPT-260919, versió 1.0.0. Vincle documental: [[00_INDEX_ESCRIPTORI]].

Abast: codi actual de `src/`. No he consultat fonts externes ni utilitzat navegador. No he modificat codi; l’únic lliurable escrit és este informe. «Pedra Seca» significa exclusivament Sistema de Disseny / UI Kit.

Mètode: lectura estàtica i proves aïllades en memòria amb fragments extrets del codi i dependències simulades. No són proves d’integració React/Preact, de navegador ni del servidor. No atribuesc tots els defectes a la darrera cirurgia: sense comparar versions, això seria un supòsit. P1 indica correcció prioritària; P2, defecte funcional o de modularitat que cal resoldre abans d’oferir el contracte com a estable.

## 1. Diagnòstic actual de forats i riscos

### F01 · P1 · L’actor personal no segueix els canvis de sessió

`actorId` pren `defaultActorId` només en inicialitzar l’estat. Quan canvia l’usuari, l’efecte només actualitza l’actor si troba una preferència desada; sense preferència no fa res. El reset de logout només actua si `actorType !== 'persona'`. A més, una preferència personal antiga es restaura sense comprovar que l’identificador coincidisca amb l’usuari actual. Evidència: `src/app/contexts/IdentitatContext.jsx:16-45`.

**Reproducció aïllada confirmada:** convidat → login A conserva l’actor convidat; sessió A → B → logout conserva `actorId=A`; sessió B amb preferència personal A restaura A.

L’impacte arriba a dades privades: els proveïdors es remunten amb `actorKey`, i Notes llig `getCurrentUser()` dins d’un efecte que no depén de l’usuari autenticat. Si la clau d’actor no canvia, Notes no torna a carregar ni buida el contingut. Una prova aïllada de Notes amb la mateixa clau confirma que A → B continua exposant les notes ja carregades d’A. Evidència: `src/app/App.jsx:424-440`; `src/sections/notes/NotesDataContext.jsx:21-38`; `src/sections/notes/NotesDataContext.jsx:70-85`.

**Correcció estructural proposada:** derivar l’actor personal de la sessió resolta, invalidar les preferències incompatibles i vincular les dades privades a l’usuari autenticat i a una generació de sessió. No confiar exclusivament en `actorKey` per netejar-les. És un problema local de confidencialitat encara que el servidor rebutge totes les peticions indegudes.

### F02 · P1 · Un rol antic pot acabar assignat al nou usuari

`sincronitza()` incrementa `generacio` quan canvia l’usuari, però el resultat d’`elMeuRol()` s’aplica sense comparar aquella generació, l’usuari ni la configuració de la petició. Tant l’èxit com l’error poden sobreescriure l’estat nou. Evidència: `src/data/sessionService.js:35-77`.

**Reproducció aïllada confirmada:** iniciar consulta de rol d’A; canviar a B; resoldre B com a `usuari`; resoldre després A com a `superadmin`. Resultat: `usuari.id=B`, `rol=superadmin`.

La guarda accepta el rol de l’estat actual, i `/admin/*` i `/realitat` depenen d’ella. Per tant, la barrera visual pot autoritzar el compte equivocat. Això **no demostra privilegis equivalents al servidor**. Evidència: `src/app/guards/RequireAuth.jsx:32-48`; `src/app/App.jsx:548-550`.

També hi ha una inconsistència d’estat: el servei usa `desconegut` mentre espera el rol, però la guarda només considera `null` com a pendent i pot mostrar una denegació prematura. Evidència: `src/data/sessionService.js:44-48`; `src/app/guards/RequireAuth.jsx:43-45`.

**Correcció proposada:** cada resposta ha de comprovar usuari, àmbit i generació abans d’aplicar-se; definir un únic estat explícit de permisos pendents.

### F03 · P1 · La renovació pot desfer un logout

`renova()` compara `sessioEpoch` després del `fetch`, però abans d’esperar `response.json()`. Si el logout ocorre mentre es llig el cos, després es crida `desaSessio()` sense tornar a comprovar la generació. El logout incrementa l’epoch i esborra la sessió, però no impedix eixa escriptura posterior. Evidència: `src/data/supabase/auth.js:12-40`; `src/data/supabase/auth.js:156`.

**Reproducció aïllada confirmada, amb fetch simulat:** resposta HTTP rebuda → cos pendent → logout → resolució del cos. La renovació retorna `true` i torna a desar la sessió anterior.

**Correcció proposada:** validar la generació immediatament abans de qualsevol escriptura de sessió; invalidar també les renovacions en substituir el compte. L’entrada amb contrasenya desa una sessió nova sense incrementar `sessioEpoch`, així que també necessita entrar en el mateix protocol de transició. Evidència: `src/data/supabase/auth.js:122-129`.

### F04 · P1 · Canviar de poble pot conservar les Notes del poble anterior

Notes calcula `scopeKey` amb backend, actor i tenant, però només inicialitza `data.scopeKey` en muntar. Un canvi de configuració dispara una càrrega nova i després rebutja la resposta perquè `prev.scopeKey !== scopeKey`; no establix prèviament el nou àmbit ni buida les dades. Mentrestant, el valor públic continua oferint el payload anterior. Evidència: `src/sections/notes/NotesDataContext.jsx:21-43`; `src/sections/notes/NotesDataContext.jsx:75-96`.

**Reproducció aïllada confirmada:** amb el mateix actor, passar de T1 a T2 provoca una consulta a T2 però deixa visibles les notes i el `scopeKey` de T1. El remuntatge d’App tampoc ho resol perquè la seua clau només incorpora l’actor. Evidència: `src/app/App.jsx:424-440`.

La protecció de `creaNota()` tampoc detecta una configuració posterior: `myConfig` i `config`, i `myActor` i `actorKey`, són els valors capturats per la mateixa invocació. No consulta cap referència actual ni compara el `scopeKey` vigent de l’estat. Evidència: `src/sections/notes/NotesDataContext.jsx:124-144`.

**Correcció proposada:** transició d’àmbit explícita: deixar d’exposar dades antigues, incrementar generació, cancel·lar lectures, carregar el nou àmbit i acceptar només respostes d’aquella generació. Les mutacions han d’aplicar la mateixa comprovació.

### F05 · P1 · Els desats pendents poden executar-se amb una altra sessió

El gestor global conserva cues més enllà del desmuntatge i executa el callback després de 600 ms, o després del desat anterior. La clau separa cues, però no valida qui continua autenticat quan s’executen. El transport obté el JWT global en el moment de construir la petició. Evidència: `src/sections/notes/NotesContext.jsx:57-59`; `src/sections/notes/NotesContext.jsx:151-164`; `src/sections/notes/GlobalSaveManager.js:24-77`; `src/data/supabase/runtime.js:38-62`.

**Seqüència derivada del codi:** A edita una nota; abans de consumir la cua entra B; el callback antic conserva la nota i la configuració d’A, però el transport pren el token vigent de B. **[SUPÒSIT]** Que el servidor accepte eixe canvi depén dels permisos de B i de les polítiques del backend; no ho he comprovat.

**Correcció proposada:** vincular cada operació a usuari, tenant, actor i generació. En canviar de sessió, conservar l’esborrany en el seu àmbit i suspendre o cancel·lar el desat. No reutilitzar automàticament les credencials del compte següent.

### F06 · P2 · La compatibilitat antiga encara canvia la identitat i perd informació

`LegacyRedirect` interpreta `/e/:slug/*` com una ordre de `setActor('entitat', slug)` sense validar membresia. `/jo/*` invoca `setActor('persona', null)`, que deixa un actor personal nul: el setter no aplica cap valor per defecte. La destinació només conserva el fragment de ruta i elimina la query. Evidència: `src/app/App.jsx:568-583`; `src/app/contexts/IdentitatContext.jsx:47-53`.

**Exemples:** `/jo/notes?nota=n1` es transforma en `/notes` i perd la selecció; visitar una URL antiga d’entitat canvia una preferència persistent de la pestanya. La prova aïllada del setter confirma `actorId=null` després de l’operació personal.

**Correcció proposada:** convertir la redirecció en una traducció determinista que preserve query i fragment. Si es vol recuperar l’entitat antiga, tractar-la com una petició de context pendent de resoldre i autoritzar abans de confirmar-la. La migració encara no ha separat completament URL i actor.

### F07 · P2 · L’actor d’entitat no té un contracte funcional complet

`memberships` es manté buit; restaurar una preferència només valida que el tipus siga `persona` o `entitat`; `setActor` no valida tipus, identificador ni pertinença. Evidència: `src/app/contexts/IdentitatContext.jsx:10-11`; `src/app/contexts/IdentitatContext.jsx:21-30`; `src/app/contexts/IdentitatContext.jsx:47-63`.

El context també barreja identificadors: la ruta antiga assigna un slug com a `actorId`; Core i Mur el passen com a primer argument al backend, on s’anomena `ownerUserId`. Notes usa directament l’usuari de sessió, el Xat també, i la publicació pren `submission.ownerUserId` o l’usuari per defecte. No hi ha un context d’actuació tipat i uniforme en estes operacions. Evidència: `src/app/App.jsx:574-578`; `src/app/contexts/CoreContentContext.jsx:11-26`; `src/sections/mur/MurContext.jsx:10-22`; `src/data/supabase/content.js:52-65`; `src/sections/notes/NotesDataContext.jsx:35-37`; `src/sections/xat/XatContext.jsx:145-149`.

**Conseqüència:** seleccionar una entitat no equival a actuar en nom d’ella de manera coherent en els mòduls inspeccionats. Acceptar una preferència arbitrària és un defecte de confiança del client, però no prova una suplantació acceptada pel backend.

**Correcció proposada:** distingir usuari autenticat, actor representat, tenant i propietari del recurs. Resoldre slug → identificador canònic i obtindre del servidor les representacions autoritzades. Mantindre el Xat o les Notes com a personals és una opció legítima, però ha de ser explícita en el contracte i en la interfície.

### F08 · P2 · El router en memòria continua llegint estat del navegador amfitrió

La segona instància utilitza `MemoryRouter`, però `useLocation()` llig sempre `window.history.state`. `MemoryRouter` descarta `options.state` en construir les entrades. El retorn d’autenticació també llig `window.location.search`, en lloc de la query del router actiu. Evidència: `src/PedraSecaEmbed.jsx:44-47`; `src/app/contexts/RouterContext.jsx:97-100`; `src/app/contexts/RouterContext.jsx:277-327`; `src/sections/onboarding/OnboardingSection.jsx:20-25`.

L’impacte és concret: les targetes passen `preloadedItem` en l’estat de navegació i la pantalla de detall el prioritza sense comprovar que coincidisca amb l’ID de la ruta. Una instància en memòria pot ignorar el seu objecte i llegir-ne un del navegador amfitrió. Evidència: `src/components/SectionItemCard.jsx:25-28`; `src/sections/multimedia/MultimediaSection.jsx:53-54`; `src/sections/detail/ItemDetailSection.jsx:20-26`.

**Reproducció aïllada confirmada:** navegar en memòria amb `{ state: { preloadedItem: ... } }` no conserva `state` en l’entrada.

**Correcció proposada:** contracte complet de localització — ruta, query, fragment, estat i historial — propietat de l’adaptador seleccionat. Verificar ID i àmbit de qualsevol element precarregat abans d’utilitzar-lo.

### F09 · P2 · La multiinstància no està aïllada en sessió, backend i preferències

El port té una implementació global; el servei de sessió té una sola configuració mutable i un estat compartit; cada `SessionProvider` sobreescriu aquella configuració. La preferència d’actor usa una clau única, i els tokens també usen claus globals amb un prefix fix. Evidència: `src/data/backendPort.js:5-26`; `src/data/sessionService.js:5-14`; `src/data/sessionService.js:30-32`; `src/app/contexts/SessionContext.jsx:14-20`; `src/app/contexts/IdentitatContext.jsx:24-30`; `src/data/identitat.js:60-62`; `src/config/storage.js:9`; `src/config/storage.js:60-74`.

**[SUPÒSIT]** Si totes les instàncies han de compartir sempre backend i compte, part d’este disseny pot ser deliberat. Si es volen integrar pobles, comptes o backends independents en una mateixa pàgina, el contracte actual no els aïlla: preval la configuració de sessió escrita més recentment. El fet que una instància use `MemoryRouter` només aïlla part de la navegació.

**Correcció proposada:** declarar la restricció d’una única sessió compartida o crear un entorn d’execució per instància, amb serveis, credencials, configuració i neteja propis.

### F10 · P2 · Hi ha consumidors que demanen camps eliminats del context

El context exposa `actorType`, `actorId`, `actorKey`, `memberships` i `setActor`. Dispositius demana `ownerUserId`, i l’editor de Notes demana `currentProfile`; cap dels dos forma part d’aquell valor. Evidència: `src/app/contexts/IdentitatContext.jsx:58-64`; `src/sections/dispositius/DevicesSection.jsx:28-34`; `src/sections/notes/NotesEditor.jsx:20-31`.

**Conseqüència:** Dispositius no resol l’agent per eixe identificador; les notes que no són l’exemple fix recorren al nom «Foraster» i a l’avatar per defecte. És una incompatibilitat de contracte demostrable, independent de la RLS.

**Correcció proposada:** definir quin servei proporciona l’actor, quin proporciona el perfil visual i actualitzar tots els consumidors amb comprovació de tipus o de contracte.

### F11 · P2 · Una fallada d’emmagatzematge interromp el canvi d’actor

La lectura de la preferència està protegida, però `sessionStorage.setItem()` i `removeItem()` s’executen sense captura d’errors. En el setter, l’estat React ja s’ha modificat abans d’intentar persistir. Evidència: `src/app/contexts/IdentitatContext.jsx:21-50`.

**[SUPÒSIT]** En un entorn incrustat que denegue l’emmagatzematge o amb quota esgotada, l’operació llança i deixa estat i preferència divergents. La capa existent d’emmagatzematge ja captura errors en les operacions efímeres. Evidència: `src/config/storage.js:60-74`.

**Correcció proposada:** persistència opcional darrere d’una interfície amb fallback en memòria; cap canvi d’actor ha de necessitar que el navegador permeta desar una preferència.

### F12 · P2 · Els identificadors codificats no completen el viatge d’anada i tornada

`getSectionItemPath()` codifica l’identificador, però el router entrega les captures sense descodificar-les. El detall compara després l’ID codificat amb el valor original del recurs. Evidència: `src/config/navigation.js:36-42`; `src/app/contexts/RouterContext.jsx:228-235`; `src/app/contexts/RouterContext.jsx:337-349`; `src/sections/detail/ItemDetailSection.jsx:20-26`.

**Reproducció aïllada confirmada:** `/notes/nota%20amb%20espai` retorna `itemId=nota%20amb%20espai`. **[SUPÒSIT]** El defecte afecta recursos el backend dels quals use identificadors que necessiten codificació; els UUID habituals no exposen este cas.

**Correcció proposada:** una única convenció de codificació i descodificació, amb tractament d’entrades malformades i proves de retorn sobre els identificadors que accepte el contracte.

**Límit de seguretat i incògnites.** El transport envia un JWT independent de l’actor seleccionat, i la guarda es declara expressament una barrera de client. Per això no equipare manipulació de `sessionStorage` amb autorització del servidor. Caldrà verificar fora d’este abast les polítiques efectivament desplegades de lectura, escriptura, pertinença i tenant; `src/` no acredita el seu resultat. Tampoc s’ha provat la resolució inicial de les URLs planes per part del servidor amfitrió. Evidència del client: `src/data/supabase/runtime.js:38-62`; `src/app/guards/RequireAuth.jsx:25-27`.

## 2. Reflexió arquitectònica a llarg termini

**Proposta central: conservar URLs planes i separar cinc conceptes amb límits explícits.** El port injectable, la detecció de capacitats i l’elecció de router són punts d’extensió aprofitables; la prioritat és completar els seus contractes i el seu cicle de vida. Evidència de les peces existents: `src/data/backendPort.js:8-46`; `src/data/contracte.js:37-64`; `src/PedraSecaEmbed.jsx:44-67`.

Tot el que seguix és **[PROPOSTA]**, no una descripció de funcionalitat ja implementada.

| Concepte | Pregunta que resol | Regla proposada |
| --- | --- | --- |
| Sessió | Qui s’ha autenticat? | L’adaptador d’autenticació publica un estat resolt i una generació. |
| Tenant | En quin poble o espai treballem? | L’amfitrió el configura; el servidor comprova l’accés. |
| Actor | En nom de qui actue? | Persona pròpia o entitat validada; mai un slug autoritzat per la seua presència en una URL. |
| Recurs | Quina nota, conversa o publicació consulte? | Identificador estable i àmbit explícit; consulta autoritzada per ID. |
| Navegació | Quina pantalla i selecció vull veure? | Ruta, query, fragment i historial dins de l’adaptador de navegació. |

### Una sola transició d’identitat

Proposaria este ordre: resoldre sessió → obtindre representacions autoritzades → validar preferència → publicar el context coherent → carregar dades. Durant una transició, les dades privades de l’àmbit anterior deixen de ser visibles immediatament.

Cada lectura, subscripció i mutació hauria de portar l’àmbit complet: instància/backend, tenant, usuari autenticat, actor i generació. La generació invalida respostes anteriors; el servidor continua sent qui autoritza. Els esborranys poden sobreviure a una navegació, però no han de continuar enviant-se automàticament després d’un canvi de compte.

La preferència guardada seria una pista prescindible i versionada, vinculada al seu àmbit. `sessionStorage` és una elecció raonable per recordar la selecció d’una pestanya; no hauria de ser l’autoritat d’identitat ni un requisit perquè el mòdul funcione.

### URLs simples amb recursos autosuficients

Mantindria `/mur`, `/xat` i `/notes` per a les vistes generals. Els recursos compartibles haurien de poder reconstruir-se des del seu identificador i l’àmbit necessari, encara que s’òbriguen en una pestanya nova o després d’un login.

Una URL compartida pot expressar el context necessari per trobar el recurs; això no implica que haja de canviar silenciosament l’actor amb què s’escriu. La selecció d’actor per a una mutació hauria de continuar sent explícita i validada. Quan calga canviar-la, la interfície hauria de fer visible en nom de qui s’enviarà l’operació.

Un únic registre declaratiu podria generar rutes, navegació, permisos de presentació, capacitats requerides i àlies de compatibilitat. El router propi hauria de tindre un contracte verificat d’historial, queries, fragments, estat, codificació i basename. Si es preferix substituir-lo per una implementació mantinguda, conservaria el mateix adaptador estret per als mòduls; no vincularia el domini a una biblioteca concreta.

### Un nucli xicotet i mòduls realment opcionals

Organitzaria el sistema per responsabilitats: l’amfitrió compon l’entorn d’execució; el nucli gestiona sessió, àmbit i cicle de vida; cada mòdul declara les seues capacitats; els adaptadors tradueixen les operacions al backend; Pedra Seca proporciona components visuals sense conéixer sessions ni rutes de negoci.

El contracte de dades hauria d’especificar entrades, resultats, errors, cancel·lació i garanties d’autorització. Una llista de noms de mètodes és útil per descobrir capacitats, però no basta per assegurar que dos backends es comporten igual. Per exemple, el nucli no hauria d’interpretar internament el JWT d’un proveïdor per decidir com renovar una sessió externa: eixa política pertany a l’adaptador d’autenticació.

Per a múltiples instàncies independents, cada muntatge tindria els seus serveis i la seua operació de destrucció. Si el producte preferix una sessió compartida per pàgina, faria eixa limitació explícita i rebutjaria configuracions incompatibles en arrancar.

### Portabilitat del contingut, a més de la del backend

Per acostar-se a la visió d’escriptori portable, definiria un format exportable i versionat: text Markdown quan siga adequat, metadades documentades, identificadors estables i fitxers adjunts transportables. Si una funcionalitat necessita contingut ric que Markdown no represente fidelment, conservaria també una representació estructurada oberta amb versió d’esquema.

La prova de portabilitat seria exportar, importar en un adaptador diferent i conservar contingut, referències i adjunts. Les dades derivades — cerca, miniatures, ordenació — haurien de poder reconstruir-se. Això permetria evolucionar el servidor o la UI sense convertir el proveïdor actual en propietari implícit del format documental.

### Ordre de treball i criteris d’acceptació

Primer corregiria F01–F05: transicions de sessió, permisos, renovació, dades privades i desats pendents. Després tancaria F06–F12: migració antiga, contracte d’actor, navegació incrustada i consumidors. Finalment reduiria el nucli i definiria el format portable.

L’agent implementador hauria de demostrar, com a mínim:

1. Convidat → A → logout → B, sense recarregar: cap dada privada d’A apareix per a B.
2. Respostes de rol i de renovació arribades fora d’ordre: cap resposta antiga modifica la sessió vigent.
3. T1 → T2 amb el mateix actor: desapareixen les dades de T1 abans d’exposar les de T2.
4. Desat ajornat seguit d’un canvi de compte: no s’envia amb les credencials del compte següent.
5. Preferència d’una entitat revocada o aliena: no s’accepta com a actor operatiu.
6. URL antiga amb query i fragment: migració sense pèrdua de selecció ni canvi silenciós d’autoritat.
7. Dos muntatges en memòria: estat i retorn d’autenticació independents del navegador amfitrió.
8. Identificadors codificats i emmagatzematge denegat: navegació correcta i degradació controlada.

Les proves actuals inspeccionades no acrediten estes transicions: la prova d’App només comprova que existisca el contenidor i simula `getCurrentUser` com a funció asíncrona, mentre el servei el consumix síncronament; la prova de Notes fixa l’actor i el tenant. Evidència: `src/app/App.test.jsx:23-37`; `src/data/sessionService.js:35-54`; `src/sections/notes/NotesDataContext.test.jsx:5-20`.

**Bateria de veritat:** les cites de codi corresponen a fitxers observats de `src/`; els escenaris condicionals estan marcats; les propostes no es presenten com a implementades. Les reproduccions aïllades confirmen F01, F02, F03, F04, el setter nul de F06, la pèrdua d’estat de F08 i la codificació de F12. No he executat la suite del projecte ni `tractor-frontmatter.mjs --estricte`; no certifique eixes portes ni la seguretat del backend desplegat.
