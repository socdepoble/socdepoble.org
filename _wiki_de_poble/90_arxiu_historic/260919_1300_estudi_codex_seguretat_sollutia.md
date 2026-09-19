---
type: informe
status: esborrany
description: Auditoria independent de seguretat, integracio Sollutia, resiliencia, SEO, accessibilitat i codi inert.
tags:
  - sollutia
---
# Estudi d’IA: Codex — Auditoria extrema de Sóc de Poble

## 1. Verbatim (La Petorreta Original)

### Dictamen i registre

**NO-GO per a certificar ara una integració estable amb Sollutia.** Hi ha errors reproduïts que afecten el traspàs de sessió, la renovació, l’eixida, els avisos, l’aïllament de l’amfitrió i la integritat de les notes. Que el codi compile i les proves existents passen no acredita estos comportaments.

L’informe recull **31 troballes: 13 P1, 15 P2 i 3 P3**. No declare cap P0 ni cap intrusió, exfiltració real o salt de RLS demostrat. Algunes P1 són vulnerabilitats de configuració o depenen que la integració use la funcionalitat afectada; la condició figura en cada cas. La correcció d’estos errors encara està pendent: esta sessió és d’auditoria.

| Camp | Valor |
| --- | --- |
| Encàrrec | SDP-PROMPT-260919 · Petorreta — Seguretat i Tractors |
| Data | 19 de setembre de 2026; lliurament previst dilluns 21 |
| Autor | Codex; auditoria independent local |
| Tall | HEAD `ff312dc9ec09cb8c144648da298c627bac4829d4` + arbre de treball existent |
| Repositori | `socdepoble.org`, dins del projecte Som de Poble |
| Abast funcional | Frontera web, host/port, autenticació, contexts, notes, xat, publicació, perfils, rutes, SEO, accessibilitat i tractors |
| Modificacions funcionals | Cap: no s’han canviat fonts de l’aplicació, CSS, migracions ni dependències |
| Aprovació humana | Pendent de valoració; l’informe no autoritza desplegaments |
| Evidència temporal | `/private/tmp/sdp-audit-260919-gyzijo2a` |

S’ha llegit el context operatiu: constitució, Bootstrap, Baseline, Acte Reflex, auditoria canònica, plantilla del Consell, plantilla d’estudi, estat de sessions, document de Sollutia i acta Marmota del bloc de notes. S’han conservat els canvis previs, incloses les edicions de `PageFrame.jsx`, CSS i disseny, els moviments documentals i l’informe de Claude aparegut durant la sessió. Les cites corresponen al codi de treball, no únicament a HEAD.

**Llegenda de proves.** **R** = reproduït amb el mòdul real i dependències simulades, o compilació controlada. **C** = deducció concreta del codi i del contracte; no executada contra Supabase real. **E** = requereix validació en l’entorn final. Els diagnòstics són proves que confirmen el defecte actual: que passen significa que el defecte s’ha reproduït.

**Severitat.** P1: corregir abans d’usar en la integració el flux afectat, per risc de sessió, bloqueig, pèrdua de treball o frontera incorrecta. P2: funcionalitat degradada, indexació, accessibilitat o control de qualitat insuficient. P3: comportament inert o de manteniment sense bloqueig general.

### Resultats executats i límits

| Comprovació | Resultat | Lectura correcta |
| --- | --- | --- |
| Suite existent: `vitest run` | 12 fitxers, **47 proves passen** | No cobreix els errors reproduïts ací |
| Diagnòstics temporals | 8 fitxers, **15 proves passen** | Confirmen 15 escenaris defectuosos; no són correccions |
| ESLint de src/tooling/scripts/tests | **0 errors, 321 avisos** | Hi ha soroll i regles de hooks inactives |
| Build web Vite | Passa | Compilació sense connexió real |
| Build standalone IIFE | Passa | 1.787,72 kB; gzip 521,68 kB en el tall sense configuració |
| Build standalone amb `.env.production` sintètic | Passa | Confirma inclusió d’issuer i absència de bloqueig de la clau de prova amb rol privilegiat |
| Enxufe, adaptadors, frontera Sollutia | Passen | Analitzen patrons i una fixture; no són una prova d’integració |
| InnerHTML i importacions | Passen | Cap incidència detectada per estes portes |
| RLS | Roig: 2 avisos | Els dos avisos identificats no proven vulnerabilitat en l’estat final de les migracions |
| Persistència | Roig: 3 incidències | Accessos directes a sessionStorage en `detailRegistry.jsx` |
| Rutes web | Verd amb 6 avisos | Falta el manifest SEO i part de la verificació no s’executa |
| Reflex `doctor --ci` | Roig | Deute i canvis durables previs sense consolidar |
| Tancament SCC en còpia temporal | Roig abans de l’informe: 14 orfes | Comparació final registrada al final d’este estudi |

Els builds i els diagnòstics s’han executat en una còpia temporal amb les dependències ja instal·lades. La referència a `node_modules` és compartida; no s’han instal·lat paquets ni modificat el lockfile. No s’ha generat cap bundle de context per al Consell. El paquet compilat és només una comprovació tècnica i no s’ha publicat.

**No s’ha fet:** desplegament, login real, migració SQL, lectura de secrets, escaneig actiu del servei de Sollutia, prova de càrrega, execució del pipeline en Node 20 ni auditoria visual completa en navegadors reals. Els tests de DOM utilitzen Preact i jsdom; no substituïxen VoiceOver, Safari o una prova real del component incrustat. La revisió SQL és estàtica i no acredita quines migracions estan aplicades al servidor. No s’ha fet una anàlisi completa de vulnerabilitats de dependències amb una base d’avisos actualitzada.

### Mapa de troballes

| ID | Prioritat | Evidència | Problema |
| --- | --- | --- | --- |
| F01 | P1 | R + contracte oficial | Sessió Supabase vàlida rebutjada pel contracte d’injecció |
| F02 | P1 | R, impacte condicional | La barrera de `service_role` no inspecciona `.env.production` |
| F03 | P1 | R | Renovació preventiva que deixa de programar-se |
| F04 | P1 | R | Una renovació pendent restaura una sessió expulsada |
| F05 | P1 | R | El timeout no cobreix l’espera de renovació |
| F06 | P1 | R + C | El component administra el head i la navegació de l’amfitrió per defecte |
| F07 | P1 | R | Avisos en light DOM sense slot: no es mostren en l’embed |
| F08 | P2 | R | Índex fora del Shadow DOM i ocult a accessibilitat |
| F09 | P1 | R + C | Storage denegat pot impedir importar tota l’aplicació |
| F10 | P1 | R, backend custom | Port parcial completat silenciosament amb Supabase |
| F11 | P2 | R | El prototip base sobreescriu la implementació derivada |
| F12 | P1 | R | Desament confirmat que no lleva els overrides locals |
| F13 | P1 | R | Revisió antiga encalla les notes després d’un 409 |
| F14 | P1 | R | Notes barrejades entre pobles del mateix usuari |
| F15 | P1 | C | Eixir o recarregar pot deixar canvis sense sincronitzar |
| F16 | P2 | C | Publicació duplicable i Mur sense actualització immediata |
| F17 | P2 | C | Crear organització envia un payload incomplet |
| F18 | P2 | C | Xat limitat als primers 200 missatges |
| F19 | P2 | C | La navegació pública conduïx a rutes noindex |
| F20 | P2 | R + C | Canonical, robots i descripció desfasats |
| F21 | P2 | C + E | SEO i previsualització social dependents del client |
| F22 | P2 | C | Rutes generades que no existixen i estat de MemoryRouter incorrecte |
| F23 | P2 | C | Elements antics desapareixen dels detalls per límits sense paginació |
| F24 | P2 | C + E | El Mur públic i la lectura SQL tenen contractes diferents |
| F25 | P2 | C | Tractors verds sense comprovar comportaments crítics |
| F26 | P2 | C + E | Node 20 del CI fora del contracte de dependències instal·lades |
| F27 | P2 | C | Guia d’instal·lació desfasada per a l’entrega |
| F28 | P2 | R | Reflex crea un tercer fitxer que impedix el seu propi segellat |
| F29 | P3 | C | Gestió de carpetes de Notes només escriu a consola |
| F30 | P3 | C | Notes espera una identitat que el context no publica |
| F31 | P3 | C | Destrucció del backend exposada però inabastable |

### Seguretat, sessió i frontera Sollutia

#### F01 · P1 · El traspàs de sessió no concorda amb els JWT habituals de Supabase

**Evidència:** [src/data/identitat.js:242](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/identitat.js:242>), [src/data/identitat.js:269](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/identitat.js:269>), [src/host.js:285](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js:285>) i [src/host.js:362](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js:362>).

`injectaSessio(sessio)` passa opcions buides a una funció que exigix `emissorEsperat`: amb un únic argument torna `false`. A més, encara que es passe l’issuer correcte, la validació d’`aud` només accepta `socdepoble.org` o l’issuer. La documentació de Supabase especifica `authenticated` per a tokens d’usuari i permet `string[]`. [Referència oficial de JWT de Supabase](https://supabase.com/docs/guides/auth/jwt-fields).

**Reproducció:** mateix `sub` UUID, `iss` correcte i expiració futura; `aud: authenticated` és rebutjat, mentre `aud: socdepoble.org` és acceptat. No s’han usat tokens reals.

**Impacte:** si Sollutia entrega una sessió Supabase estàndard, l’entrada es rebutja abans de consultar el servidor. El pont d’iframe sí que té fallback a `VITE_SOLLUTIA_ISSUER`; la crida JS directa no l’aplica.

**Proposta:** fixar el contracte de sessió amb issuer i audiències admeses del projecte, distingint crida JS i iframe. Afegir fixtures representatives de la sessió acordada, amb casos de rebuig. No relaxar-ho a acceptar qualsevol issuer. La verificació criptogràfica i RLS continuen corresponent al servidor; no he demostrat cap accés a dades per falsificar un JWT al client.

#### F02 · P1 · La barrera contra una clau privilegiada queda fora de la càrrega real d’env

**Evidència:** [vite.config.js:9](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vite.config.js:9>) i [vite.standalone.config.js:9](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vite.standalone.config.js:9>).

Els dos fitxers inspeccionen `process.env.VITE_SUPABASE_ANON_KEY` en carregar la configuració. No carreguen l’entorn de Vite amb `loadEnv` abans de validar-lo. En una còpia sense secrets he escrit una `.env.production` amb un JWT deliberadament fals, signatura invàlida i `role: service_role`. El build standalone acaba bé i incorpora el valor de prova al JavaScript final.

**Impacte condicional, greu:** una errada humana que pose una clau privilegiada real en eixe fitxer pot acabar publicada. No afirme que la configuració real continga una clau així ni que s’haja filtrat res.

**Proposta:** validar la configuració efectiva del mode de compilació, els formats de claus admesos i els atributs de configuració equivalents. La prova d’acceptació ha de rebutjar el sentinel privilegiat sense necessitar una credencial real. Verificar també l’artefacte final abans de distribuir-lo.

#### F03 · P1 · La renovació preventiva deixa de programar-se als deu minuts

**Evidència:** [src/app/contexts/SessionContext.jsx:45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/SessionContext.jsx:45>).

El timer es limita a 600.000 ms. Si el token encara no està prop de caducar, crida `sincronitza()`. Però l’efecte depén de l’estat, de l’ID d’usuari i de callbacks estables; no de l’expiració ni d’un cicle de renovació. La sincronització del mateix usuari no el rearma.

**Reproducció:** sessió amb trenta minuts de vida, configuració estable i rellotge simulat; avançar trenta-un minuts no provoca cap crida a `refrescaSessio`. Un render alié o tornar d’una pestanya amagada pot emmascarar el defecte.

**Impacte:** sessió aparentment oberta amb token caducat. El reintent de REST pot rescatar algunes operacions, però les crides SDK del xat no passen per eixe mateix circuit.

**Proposta:** programador explícit lligat al token/expiració o a una generació, amb rearmament després de cada comprovació i renovació. Provar més d’una expiració seguida amb el mateix usuari.

#### F04 · P1 · Una renovació pendent pot desfer un logout

**Evidència:** [src/data/supabase/auth.js:11](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:11>), [src/data/supabase/auth.js:29](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:29>) i [src/data/supabase/auth.js:149](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:149>); [src/host.js:290](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js:290>).

`renovacioEnCurs` és global. Ni `logout` ni `expulsaSessio` invaliden la generació de la petició pendent. Una resposta correcta posterior torna a executar `desaSessio()` i emet `sdp:auth-change` amb usuari.

**Reproducció:** iniciar renovació, esborrar la sessió i resoldre després la resposta; l’usuari reapareix. És una cursa real de cicle de vida, no una teoria sobre la signatura JWT.

**Proposta:** incrementar una generació de sessió en eixida, injecció i canvi d’identitat, cancel·lar la renovació quan siga possible i descartar respostes de generacions anteriors abans de guardar-les. L’eixida ordenada per Sollutia ha de guanyar sempre.

#### F05 · P1 · Els dotze segons de timeout no limiten la renovació

**Evidència:** [src/data/supabase/runtime.js:43](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:43>) i [src/data/supabase/auth.js:18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:18>).

Després d’un 401, `request()` espera `await refresca(config)`. El timer només avorta el seu fetch, ja resolt. La renovació utilitza un altre fetch sense `signal` ni deadline. Si es queda pendent, la petició original tampoc conclou.

**Reproducció:** resposta 401 i renovació que no resol; amb timeout de 100 ms, deu segons simulats després la promesa continua pendent. Quan es deixa acabar la renovació, finalment apareix `TimeoutError`.

**Impacte:** càrregues i cues de desament poden quedar esperant indefinidament. Un error de xarxa en `renovaAra()` també es transforma directament en logout, sense distingir indisponibilitat transitòria de credencial invàlida.

**Proposta:** deadline total i cancel·lació compartida per consulta, renovació i reintent; error recuperable per xarxa. Cobrir també els accessos via SDK que no travessen `runtime.request`.

#### F06 · P1 · El component pot reescriure el head i la ruta de Sollutia

**Evidència:** [src/PedraSecaEmbed.jsx:403](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:403>), [src/hooks/useSEO.js:11](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/hooks/useSEO.js:11>) i [src/hooks/useSEO.js:41](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/hooks/useSEO.js:41>).

Un element sense opcions usa router de navegador i activa `manageDocumentHead`. El hook modifica títol, meta, Open Graph, canonical, robots i JSON-LD en el document global. No restaura els valors de l’amfitrió en desmuntar-se. El Shadow DOM no aïlla estes API globals. La selecció automàtica d’un router de memòria per a una segona instància tampoc li retira explícitament la gestió del head.

**Reproducció:** document amb títol de l’amfitrió; muntar el hook amb la configuració per defecte l’altera; desmuntar-lo conserva títol i descripció del component.

**Proposta:** contracte d’embed explícit: router de memòria i `manageDocumentHead: false` per defecte. El lloc web propi pot optar a gestionar-los. Si cal compartir el head, establir propietat dels nodes i restauració. Prova d’acceptació sobre una pàgina de Sollutia amb metadades i navegació pròpies abans i després de muntar, navegar i desmuntar.

#### F07 · P1 · Els avisos no arriben al lloc on es pinta el component

**Evidència:** [src/components/universal/AvisadorEfimer.jsx:44](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/AvisadorEfimer.jsx:44>) i [src/PedraSecaEmbed.jsx:286](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:286>).

`showToast()` tria el primer `<soc-de-poble>` del document i li afig un fill al light DOM. L’aplicació està en un shadow root tancat i no exposa cap slot per a eixe fill. El node d’alerta existix, però queda fora de l’arbre compost visible. Amb diverses instàncies, el singleton també tria sempre la primera.

**Reproducció:** host amb shadow root tancat i sense slot; l’alerta queda en el light DOM i no en l’arrel visual. És la mateixa estructura que munta el component real.

**Impacte:** errors de xarxa, conflictes, confirmacions i problemes en publicar poden no arribar a l’usuari. Agreuja F05 i F12–F17.

**Proposta:** passar el contenidor de notificacions de la instància o usar un provider dins de l’arbre del component. Verificar confirmació i error amb lector de pantalla i amb dues instàncies.

#### F08 · P2 · El calaix de continguts trenca l’aïllament i l’accessibilitat

**Evidència:** [src/components/universal/PageFrame.jsx:74](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:74>).

`createPortal(..., document.body)` lleva el calaix del Shadow DOM que conté els seus estils. El pare té `aria-hidden="true"`, que amaga també els botons i l’índex als lectors de pantalla. No hi ha semàntica de diàleg, gestió de focus ni escolta d’Escape en este component.

**Reproducció:** renderitzar-lo dins d’un shadow root: el calaix apareix en `document.body`, el shadow root no el conté i l’ancestre continua amb `aria-hidden=true`.

**Proposta:** portal al contenidor de la instància o reutilització del diàleg accessible existent, amb focus d’entrada/tornada, Escape i semàntica adequada. No estendre esta acusació a tots els diàlegs: el component `Dialeg` ja implementa comportaments correctes.

#### F09 · P1 · Una política de storage pot fer fallar el mòdul abans de renderitzar

**Evidència:** [src/config/storage.js:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/storage.js:1>), [src/config/storage.js:68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/storage.js:68>) i [src/data/identitat.js:132](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/identitat.js:132>).

`typeof window.localStorage` i `typeof window.sessionStorage` invoquen els getters fora d’un `try`. Si el navegador denega l’accés, l’excepció ocorre en importar el mòdul, abans que la UI puga donar un error controlat. Els setters, a més, silencien les fallades i `desaSessio` pot retornar èxit sense haver persistit totes les peces.

**Reproducció:** getter de `localStorage` que llança `SecurityError`; la importació de `storage.js` rebutja. Cal reproduir-ho amb la política exacta de l’iframe o navegador final: no dic que tot iframe denegue storage.

**Proposta:** detecció dins d’un bloc segur, política explícita per a memòria temporal o error d’autenticació comprensible, i confirmació real del desament de sessió. Provar també quota plena i sessió parcial.

#### F10 · P1 · Un backend parcial no es rebutja: es mescla amb Supabase

**Evidència:** [src/host.js:170](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js:170>) i [src/data/backendPort.js:8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:8>).

`configura()` informa de mètodes pendents, però `arrenca()` carrega l’adaptador Supabase per a completar el nucli i després segella. Això permet una implementació híbrida accidental: identitat d’un origen i notes o publicacions d’un altre adaptador.

**Reproducció:** injectar només `getCurrentUser`, arrancar i comprovar que el port conserva eixe mètode mentre adquirix `createNote` de Supabase.

**Impacte condicional:** afecta un backend custom o una injecció incompleta. No és un defecte per a qui haja triat expressament Supabase com a implementació sencera; el problema és que el fallback no és una elecció explícita.

**Proposta:** rebutjar contractes incomplets abans de pintar i reservar el fallback per a un mode declarat. Capacitats i DTO han de pertànyer al mateix contracte d’identitat i tenant.

#### F11 · P2 · El port invertix la precedència d’herència

**Evidència:** [src/data/backendPort.js:15](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:15>).

La còpia recorre la instància i després els prototips. Cada coincidència sobreescriu la prèvia: un mètode de la classe base substituïx l’override de la derivada.

**Reproducció:** `Derived.getCurrentUser()` torna DERIVED, però després d’injectar la instància el port torna BASE.

**Proposta:** conservar la primera resolució efectiva de cada mètode, respectant la semàntica de JavaScript. Provar instància plana, classe, herència i vinculació de `this`.

### Estabilitat, integritat de notes i ús quotidià

#### F12 · P1 · El callback de neteja d’overrides té la signatura equivocada

**Evidència:** [src/sections/notes/NotesContext.jsx:114](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:114>) i [src/sections/notes/GlobalSaveManager.js:53](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:53>).

El gestor espera un setter funcional `setLocalNoteOverrides(prev => next)`, però rep `setLocalNoteField(id, field, value)`. El callback es tracta com si fóra un ID amb camp i valor absents; la neteja queda sense efecte.

**Reproducció:** modificar i desar contingut, rebre revisió confirmada i èxit; l’esborrany persistit encara conté el valor local. No he observat cap clau amb el text de la funció: el comportament comprovat és una operació nul·la.

**Impacte:** l’override continua guanyant a dades noves del servidor i fa que l’usuari veja una versió antiga encara que hi haja sincronització. La connexió de `updateNoteContext` sí que està arreglada; este és un error diferent al final del desament.

**Proposta:** callback explícit de confirmació de camps, que retire només els valors confirmats i preserve edicions més noves. Comprovar servidor, estat visible i storage després del mateix desament.

#### F13 · P1 · El 409 no pot recuperar una revisió ja emmagatzemada

**Evidència:** [src/sections/notes/GlobalSaveManager.js:11](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:11>), [src/sections/notes/GlobalSaveManager.js:67](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:67>) i [src/sections/notes/NotesDataContext.jsx:98](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:98>).

`knownRevisions` sempre té prioritat sobre la revisió de la nota recarregada. En un conflicte es fa refetch, però no s’invalida ni reconcilia l’entrada del mapa.

**Reproducció:** mapa amb revisió 2, servidor/base recarregada en 3; dos intents consecutius continuen enviant 2 i fallen amb 409.

**Proposta:** reconciliació explícita amb revisió remota i gestió dels camps en conflicte. No sobreescriure a cegues per obtindre un èxit aparent. Mostrar una acció efectiva de reintentar o resoldre.

#### F14 · P1 · Canviar de poble pot conservar notes i respostes del poble anterior

**Evidència:** [src/sections/notes/NotesDataContext.jsx:38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:38>) i [src/sections/notes/NotesDataContext.jsx:120](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:120>); límit del diagnòstic en [src/app/App.jsx:426](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:426>).

En recarregar, totes les notes prèvies absents de la resposta es conserven com a `localOnly`, sense demostrar que siguen creacions recents del mateix tenant. En `creaNota`, `myConfig` i `config` es comparen dins del mateix tancament capturat; el control no consulta la configuració actual. Les respostes de `updateNote` tampoc porten una generació de tenant.

**Reproduccions:** tenant A → tenant B amb mateix actor: es veuen B i A. Iniciar creació en A, passar a B i resoldre la creació: la nota tardana d’A s’incorpora a l’estat de B.

**Precisió essencial:** App remunta els providers amb `actorKey` quan canvia d’usuari. Per això no declare provada una fuga entre usuaris en el flux complet. El cas reproduït és canvi de tenant amb el mateix actor; és contaminació de l’estat del client, no prova que SQL concedisca drets nous.

**Proposta:** àmbit de dades definit per usuari + tenant + backend, generació vigent consultable després de cada `await` i neteja/swap atòmic en canviar d’àmbit. Retindre només creacions confirmades encara pendents d’aparéixer, amb justificació i caducitat, no tota fila absent.

#### F15 · P1 · El flush d’eixida encara passa per un debounce i els esborranys no es reencuen

**Evidència:** [src/components/universal/richText/useUniversalRichText.js:89](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:89>), [src/sections/notes/GlobalSaveManager.js:35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:35>) i [src/sections/notes/NotesContext.jsx:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:1>).

`pagehide` i el desmuntatge fan `flush`, però el desament acabat d’encuar espera altres 600 ms. Tancar o recarregar la pàgina no garantix que el timer ni la petició s’executen. En obrir, es restaura l’override de sessionStorage, però no s’ha trobat un recorregut que reencue eixos camps per sincronitzar-los.

**Impacte:** el text pot continuar visible com a esborrany durant la vida de la pestanya sense haver arribat al servidor. Tancar-la elimina la reserva efímera. Un canvi de ruta dins de la mateixa pàgina no és equivalent a tancar el document: el gestor global pot continuar en el primer cas.

**Proposta:** estats clars de pendent/desat/error, flush real de la cua abans d’eixir quan siga possible, i recuperació explícita d’esborranys amb reintent i detecció de conflictes. Acordar si el producte promet conservar esborranys entre pestanyes/sessions. Prova obligatòria amb recàrrega immediata, xarxa desconnectada i reobertura.

#### F16 · P2 · Publicar pot duplicar contingut i no actualitza el Mur carregat

**Evidència:** [src/sections/notes/NotesContext.jsx:128](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:128>) i [src/sections/mur/MurContext.jsx:49](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/mur/MurContext.jsx:49>).

Cada publicació inserix una submissió i després marca la nota com a publicada. No hi ha una clau idempotent vinculada a la nota ni un ID de publicació guardat per a actualitzacions posteriors. Si la segona escriptura falla, la publicació ja existix. Repetir l’acció pot crear-ne una altra. El context del Mur només envia la petició: no incorpora el registre ni recarrega el contingut.

**Proposta:** contracte idempotent de publicar/actualitzar, estat ocupat i resultat parcial visible. Incorporar la fila autoritativa retornada pel servidor o fer refresh després de l’èxit. Provar doble clic i fallada entre les dues escriptures.

#### F17 · P2 · El botó de crear organització omet nom i tipus

**Evidència:** [src/sections/profile/PerfilShell.jsx:100](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/PerfilShell.jsx:100>), [src/sections/profile/PerfilContext.jsx:182](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/PerfilContext.jsx:182>) i [src/data/supabase/organizations.js:12](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/organizations.js:12>).

La UI passa `{slug}`. El context calcula un nom per defecte però, com que `dades` és un objecte truthy, construïx `{...dades, slug}` i omet `name` i `kind`. La petició RPC rep `p_name` i `p_kind` com a undefined, que no s’inclouen en el JSON. La signatura SQL els exigix.

**Proposta:** construir sempre un payload complet validat. Provar el botó real fins al cos RPC. La deficiència antiga «falta slug» està superada; el defecte vigent són els altres dos camps.

#### F18 · P2 · El xat deixa de mostrar els missatges nous després dels primers 200

**Evidència:** [supabase/migrations/260908_xat_v2_correccions.sql:270](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_xat_v2_correccions.sql:270>), [src/data/supabase/xat.js:72](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/xat.js:72>) i [src/sections/xat/XatContext.jsx:199](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/XatContext.jsx:199>).

La consulta ordena cronològicament ascendent abans de limitar, i el client demana 200. El sondeig substituïx els confirmats pel resultat; només preserva els pendents. A partir del missatge 201, un missatge confirmat pot desaparéixer del client en el següent refresc encara que continue al servidor.

**Proposta:** consultar la finestra més recent i invertir-la per pintar, amb cursor per carregar historial. Provar un fil amb més de 200 registres i enviament + sondeig + realtime. És deducció del SQL i del client; no s’han creat 201 missatges al servidor real.

### SEO, rutes i contingut públic

#### F19 · P2 · La porta d’entrada i els enllaços públics conduïxen a l’espai noindex

**Evidència:** [src/app/App.jsx:508](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:508>), [src/config/navigation.js:34](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/navigation.js:34>) i [src/hooks/useSEO.js:53](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/hooks/useSEO.js:53>).

La portada redirigix a `/jo/xat`. Les targetes públiques usen generadors que, fora d’un context reconegut, prefixen `/jo`. El hook marca `/jo` i `/e/` com a privats amb `noindex, nofollow`. Existixen llistats públics `/mur`, `/mercat` i `/pobles`, però els detalls generats viatgen a l’espai exclòs dels cercadors.

**Impacte:** la política SEO no concorda amb una web de contingut públic que es vulga descobrir i compartir. No s’ha consultat Search Console ni es quantifica una pèrdua d’indexació real.

**Proposta:** mapa explícit de rutes públiques i privades, amb detalls públics i canonical únic on corresponga. No llevar `noindex` de tot `/jo`: podria exposar metadades que es volen privades. La portada ha d’apuntar a la vista pública acordada.

#### F20 · P2 · El head pot quedar amb metadades de la ruta anterior

**Evidència:** [src/hooks/useSEO.js:47](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/hooks/useSEO.js:47>), [src/hooks/useSEO.js:53](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/hooks/useSEO.js:53>) i [src/hooks/useSEO.js:103](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/hooks/useSEO.js:103>).

El hook llig `window.location.pathname`, però no el declara com a dependència. Navegar entre rutes amb les mateixes props no recalcula canonical ni robots. Si no es dona descripció, es conserva l’última que hi havia, no necessàriament la inicial. Les seccions sense crida pròpia hereten el head anterior. El prefix privat també ignora un basename com `/portal/jo/...`.

**Reproducció:** `/mur` → `/jo/mur`, rerender amb títol i descripció iguals: canonical encara `/mur` i cap meta robots nou. Desmuntar també deixa les metadades posades.

**Proposta:** coordinació SEO al nivell de ruta i configuració del router, amb una única font per pàgina, política de fallback determinista i propietat del head. Provar navegació pública/privada, tornar arrere, subdirectori i dues instàncies.

#### F21 · P2 · L’HTML inicial no representa els detalls ni garanteix les targetes socials

**Evidència:** [index.html:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/index.html:1>), [vercel.json:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/vercel.json:1>), [public/sitemap.xml:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/public/sitemap.xml:1>) i [src/sections/detail/ItemDetailSection.jsx:32](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/detail/ItemDetailSection.jsx:32>).

El document inicial és genèric i les metadades específiques es creen després d’executar JavaScript. Els consumidors que no l’executen reben la targeta genèrica. No s’ha trobat prerender/SSR de les fitxes públiques. El sitemap és una llista curta de rutes generals, sense contingut individual, i el manifest `wordpress-plugin/dist/seo-routes.json` falta en el tall revisat.

El fallback del servidor retorna l’aplicació per a rutes desconegudes; que el component mostre «No trobat» no significa una resposta HTTP 404. El NotFound general sí que demana `noindex`; no afirme que tots els errors estiguen indexats.

**Proposta:** per a la part pública, acordar HTML de metadades al servidor o prerender, sitemap derivat del contingut publicable, URL canònica de producció i resposta adequada per a contingut inexistent. Comprovar HTML inicial i previsualització real d’un enllaç, no només el DOM després de navegar.

#### F22 · P2 · Generadors de ruta i router no compartixen tot el contracte

**Evidència:** [src/config/navigation.js:60](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/navigation.js:60>), [src/components/universal/UniversalPage.jsx:20](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalPage.jsx:20>), [src/sections/detail/ItemDetailSection.jsx:47](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/detail/ItemDetailSection.jsx:47>) i [src/app/contexts/RouterContext.jsx:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/RouterContext.jsx:1>).

Es generen `/gent/:id`, `/empresa/:id`, `/ajuntament/:id` i `/grup/:id`, mentre les famílies equivalents estan dins de `/jo` o `/e/:slug`. «Comentar» té un fallback `/xat` que no és la ruta global declarada. A més, els generadors consulten el pathname global i `useLocation` obté l’estat de `window.history`, cosa que no representa l’estat propi del router de memòria.

**Impacte:** targetes i botons poden dur a «No trobat», o perdre `preloadedItem`/context en embed. El problema no és que totes les rutes fallen, sinó estos camins concrets.

**Proposta:** un sol constructor de rutes alimentat pel router actual, amb proves de resolució per a cada tipus de targeta i mode d’embed. Cobrir basename, historial i enllaç directe.

#### F23 · P2 · L’existència d’un element depén d’estar dins de la pàgina carregada

**Evidència:** [src/data/supabase/notes.js:21](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js:21>) i [src/sections/detail/ItemDetailSection.jsx:23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/detail/ItemDetailSection.jsx:23>).

Notes/submissions es carreguen amb límit 50. El detall busca `preloadedItem` o la col·lecció de memòria; no consulta l’element per ID si no hi és. Un enllaç a un element més antic pot semblar inexistent després de recarregar, encara que la fila continue en la base de dades.

**Proposta:** paginació/cursor en llistats i lectura per ID per als detalls, amb estats separats de carregant, prohibit i inexistent. Provar el registre 51 i un enllaç compartit obert en una sessió nova.

#### F24 · P2 · Cal decidir què significa «Mur públic» en les polítiques reals

**Evidència:** [supabase/migrations/260908_0000_initial_schema.sql:764](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:764>) i [src/data/supabase/content.js:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/content.js:1>).

La política de lectura de `section_submissions` exigix pertinença al poble. Per tant, que el frontend tinga una ruta `/mur` oberta no implica que un visitant anònim puga llegir les publicacions noves. El contingut de llavor o d’`app_content` pot donar una aparença pública que no reproduïx les publicacions reals.

**Impacte condicional:** és un defecte si es vol un Mur públic indexable. Si el Mur és deliberadament només per a membres, cal ajustar la comunicació i el SEO. No és motiu per substituir la política per `using(true)`.

**Proposta:** definir visibilitat explícita per publicació i provar lectura anònima/membre/no membre en l’entorn de Sollutia, sense obrir notes privades ni contingut d’altres tenants.

### Tractors, entrega i documentació

#### F25 · P2 · El verd dels tractors no certifica la connexió

**Evidència:** [tooling/gates/tractor-enxufe.mjs:33](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-enxufe.mjs:33>), [tooling/gates/tractor-adaptadors.mjs:43](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-adaptadors.mjs:43>), [src/data/adaptadors/sollutia/recursos.js:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/adaptadors/sollutia/recursos.js:1>) i [eslint.config.js:10](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/eslint.config.js:10>).

E1 d’Enxufe busca `supabase/supabaseBackend`, però l’adaptador actual està organitzat d’una altra manera. El tractor d’adaptadors només executa el traductor i comprova que no llance; el traductor de perfil únicament rebutja valors falsy i retorna el payload amb `_sollutia`. Una forma errònia truthy pot passar. Només hi ha una fixture. No valida resultats, drets ni operacions.

ESLint registra `react-hooks` però no habilita `rules-of-hooks` ni `exhaustive-deps`. Rutes web acaba en verd encara que no dispose del manifest per executar part dels controls. RLS escaneja migracions històriques i acusa una política substituïda posteriorment.

**Proposta:** mantindre les comprovacions estàtiques útils, però incorporar contractes de dades reals, negatives i un smoke de component final. Per a RLS, provar el resultat d’aplicar la seqüència completa en una BD de prova. Fer explícit «control no executat» en lloc de deixar-lo confondre amb una validació superada.

#### F26 · P2 · El CI usa Node 20 i algunes dependències exigixen més

**Evidència:** [.github/workflows/sdp_lock_ci.yml:17](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.github/workflows/sdp_lock_ci.yml:17>) i [package-lock.json:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/package-lock.json:1>).

La instal·lació local revisada usa Node 24.13.0; el workflow usa Node 20. `@supabase/supabase-js` 2.112.4 declara Node >=22; `@babel/parser` 8.0.4 declara ^22.18 o >=24.11. No s’ha executat el job en Node 20 i, per tant, no afirme un crash concret del CI. Sí que és una combinació fora del contracte declarat i una diferència material respecte de les proves locals.

**Proposta:** alinear una versió suportada entre desenvolupament i CI, o seleccionar versions compatibles de forma deliberada. Executar `npm ci` i les portes en eixa versió abans de donar per reproduïble l’entrega.

#### F27 · P2 · El procediment d’instal·lació descriu un sistema que ja no existix

**Evidència:** [README.md:39](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/README.md:39>), [README.md:114](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/README.md:114>), [supabase/README.md:130](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/README.md:130>) i [src/data/supabase/runtime.js:25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:25>).

README encara ordena executar `supabase/schema.sql` i `supabase/schema_notes.sql`, rutes que ja no són els fitxers vigents. Documenta `auto` i fallback híbrid; el runtime només reconeix `remote`, `seed` i `local`, i normalitza la resta a `remote`. També descriu formats de llibreria diferents de l’IIFE que s’ha compilat.

**Impacte:** un tècnic que seguisca la guia el dilluns pot muntar un esquema incomplet o esperar una degradació local que no succeirà.

**Proposta:** guia única d’entrega amb artefacte exacte, configuració requerida, tenant, ordre real de migracions, sessió, callbacks, rutes i smoke test. No prometre idempotència general sense executar dues vegades la seqüència en una BD descartable.

#### F28 · P2 · `open` de Reflex crea el fitxer extra que `seal` prohibix

**Evidència:** [tooling/wiki/reflex_petorreta.mjs:680](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_petorreta.mjs:680>) i [tooling/wiki/reflex_petorreta.mjs:733](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_petorreta.mjs:733>).

`reserveBootstrap()` reserva el directori i hi copia `00_PLANTILLA_PROMPT_CONSELL.md`. El protocol demana crear prompt i manifest. `assertBootstrapPair()` exigix exactament dos fitxers i rebutja la plantilla injectada com a tercer.

**Reproducció real durant esta auditoria:** `open` correcte, creació del prompt i manifest, `seal` rebutjat pel tercer fitxer. La còpia automàtica era idèntica a la plantilla canònica. S’ha preservat en el directori temporal i, mantenint prompt i manifest, el segellat ha passat. No s’han canviat les regles ni el codi del tractor.

**Proposta:** reconciliar bootstrap i comprovador amb un contracte únic i afegir una prova d’`open → seal` tal com l’ha d’executar un agent. Este és un problema del procés d’entrega, no una vulnerabilitat de la web.

### Codi inert i accions enganyoses

#### F29 · P3 · Gestionar carpetes no fa cap gestió

**Evidència:** [src/sections/notes/NotesContext.jsx:171](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:171>) i [src/sections/notes/NotesSection.jsx:108](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:108>).

`obriConfiguracioNotes` només fa `console.log`, però arriba al workspace com una acció visible. Una persona clica una funció aparentment disponible i no obté resultat.

**Proposta:** implementar l’acció o mostrar clarament l’estat de disponibilitat acordat. La prova ha de comprovar un canvi observable en clicar, no l’existència del callback.

#### F30 · P3 · L’autor de Notes depén d’una propietat absent

**Evidència:** [src/sections/notes/NotesEditor.jsx:22](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesEditor.jsx:22>) i [src/app/contexts/IdentitatContext.jsx:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/IdentitatContext.jsx:1>).

NotesEditor demana `currentProfile`, però IdentitatContext publica actor, claus i pertinença, no eixa propietat. La branca de notes personals queda en «Foraster» i avatar de reserva. La ruta de reserva `/assets/system/ui/default-avatar.jpg` no existix en el public revisat.

**Proposta:** obtindre l’autor des del context/DTO vigent i usar un asset de reserva real. No confondre l’autor visual amb els permisos de la fila, que són una altra frontera.

#### F31 · P3 · `destroy` del backend no pot arribar a la implementació

**Evidència:** [src/data/backendPort.js:18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:18>), [src/data/backendPort.js:38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:38>) i [src/data/contracte.js:1](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/contracte.js:1>).

La còpia només conserva mètodes del contracte. `destroy` no hi figura; el wrapper que intenta executar `currentImpl.destroy()` queda sense un camí normal d’injecció. És una promesa de neteja sense implementació abastable.

**Proposta:** definir un cicle de vida real i comprovar subscripcions/timers en desmuntar, o retirar la superfície inert. No he atribuït una fuga concreta de memòria a este wrapper sense mesurar-la.

### Riscos pendents d’entorn i decisions que Sollutia ha de tancar

Estos punts **no s’afegeixen com a defectes demostrats al recompte**. Són condicions que impedixen prometre una connexió reeixida sense una prova real.

1. **Google/PKCE i estat de retorn.** [src/data/oauthRelay.js:146](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/oauthRelay.js:146>) envia un `state` a `/authorize`, però no l’inclou en el `redirect_to`; el receptor l’exigix en el missatge de tornada ([src/data/oauthRelay.js:206](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/oauthRelay.js:206>)), i el relé només retransmet el `state` que trobe en la query ([public/auth/callback.html:140](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/public/auth/callback.html:140>)). La implementació oficial actual de Supabase controla el seu propi state i elimina el que intenta sobreescriure’l. És una incompatibilitat probable del contracte: cal verificar la versió desplegada, el callback real i els camins popup/COOP/redirecció. No llevar la comprovació CSRF com a pegat. [Codi oficial de Supabase Auth](https://raw.githubusercontent.com/supabase/auth/master/internal/api/external.go), [flux PKCE documentat](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
2. **Orígens de configuració.** [src/PedraSecaEmbed.jsx:165](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:165>) accepta URLs HTTPS de qualsevol subdomini de `supabase.co` per a camps sensibles. Si un editor del CMS pot canviar eixos atributs sense ser de confiança, pot redirigir peticions cap a un projecte seu. Cal fixar orígens/projecte i decidir qui controla atributs, credencials públiques i issuer. No he demostrat que un usuari sense permisos puga modificar-los.
3. **Shadow DOM no és una frontera contra scripts de l’amfitrió.** La sessió en sessionStorage té menys duració que en localStorage, però altres scripts del mateix origen continuen podent accedir-hi. Si l’amfitrió no és de confiança per a tokens, cal separar l’origen amb iframe i un pont limitat. No vendre `closed` com a aïllament criptogràfic.
4. **Una identitat i un backend per document.** [src/data/supabase/config.js:26](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/config.js:26>) rebutja URL de backend diferent després d’establir el singleton. Identitat, renovació i cua de notes també són globals. Acordar esta limitació o canviar l’abast dels serveis; dues instàncies no equivalen a dos espais de sessió independents.
5. **Base de dades final.** Comprovar que el projecte, tenant, membres, RPC, grants, Storage i Realtime són els de la configuració final. Executar tests de lectura/escriptura entre membre, no membre i segon tenant. No s’ha consultat el catàleg del servidor.
6. **Alta i consentiment.** `registraConsentiment` existix en [src/data/supabase/auth.js:112](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:112>) però la cerca no troba cap consumidor de UI. Cal provar el recorregut complet d’alta amb Google i password, consentiment registrat i aparició al poble. Açò és una comprovació funcional pendent, no un dictamen legal.
7. **Servei auxiliar del bot.** `bot/api_plugin.mjs` escolta localment; abans d’exposar-lo amb proxy cal revisar autenticació, CORS, límits de cos/peticions i separació de converses. No s’ha acreditat que estiga publicat i no es declara un endpoint explotable en producció.
8. **Prestacions i navegadors.** El standalone carrega aproximadament 522 kB gzip de JavaScript. Cal mesurar arrancada, edició i recuperació de xarxa en el dispositiu i navegador de la demostració. És una mida comprovada, no una puntuació de rendiment inventada.

### Errors antics que no s’han de reobrir sense evidència

- **Reset CSS:** el reset problemàtic ja no està en `tokens.css` fora de capa; `:host { all: initial }` continua en una capa de reset de `base.css`. No he reproduït el col·lapse antic de la caixa. Això no resol F07/F08, que són problemes de lloc de muntatge.
- **Notes → dades:** `NotesContext` ja passa `updateNoteContext` del provider correcte; categories i tags ja estan en el mapper/payload del backend. No són les incidències antigues; F12/F13/F14 descriuen altres mecanismes.
- **Timeout del cos:** `runtime.request` ara espera `response.json()` dins del `try`; el timer ja cobreix la descàrrega del cos. F05 és l’espera de renovació, que usa un altre fetch.
- **RLS dels avisos del tractor:** `private.ajustos` està en esquema privat i la política històrica oberta de `profiles` és substituïda per una migració posterior. No convertir dos matches textuals en dues fugues actives. La validació del servidor real encara està pendent.
- **Issuer del standalone:** el build amb `.env.production` sintètic conté `https://audit-issuer.invalid/auth/v1`. Queda refutada l’afirmació absoluta que la variable no pot entrar mai al paquet. Un build fet sense valor no demostra eixa impossibilitat. La crida JS sense opcions i el xoc d’audiència de F01 sí que continuen oberts.
- **React i `inert`:** el producte resol React a Preact; una prova només amb ReactDOM 18 no certifica què emet l’artefacte real. No s’ha reutilitzat eixa acusació com a troballa confirmada.
- **JWT al client:** descodificar claims sense verificar la signatura no és, per si sol, un salt de RLS. No he comprovat que un token invàlid puga accedir a dades del servidor.
- **XSS genèric:** hi ha sanejament central i la porta d’innerHTML passa. No s’ha demostrat un payload XSS executable; això tampoc equival a una auditoria exhaustiva de tots els vectors.

### Ordre d’actuació i acceptació per al dilluns 21

No propose una reescriptura ni obrir permisos per a fer passar la demostració. La seqüència recomanada és:

| Ordre | Responsable funcional | Treball | Criteri verificable |
| --- | --- | --- | --- |
| 1 | Frontend + Sollutia | Fixar artefacte, origin, backend, tenant i contracte JWT | Sessió de prova acordada entra; issuer/aud erronis es rebutgen; una única configuració efectiva |
| 2 | Frontend | F03–F05: renovació, eixida i deadline | Dues renovacions consecutives; logout durant refresh no ressuscita; xarxa penjada acaba en error recuperable |
| 3 | Frontend/integració | F06–F11: embed i notificacions | Head/URL de l’amfitrió segons contracte; avisos visibles; índex accessible; error de storage controlat; backend incomplet rebutjat |
| 4 | Notes | F12–F15 | Desat confirmat sense override vell; recuperació del 409; canvi de tenant sense barreja; recàrrega sense pèrdua silenciosa |
| 5 | Dades/producte | F16–F18, F23–F24 | Publicar una vegada i veure el Mur; crear organització; missatge 201 visible; element 51 accessible; lectura pública acordada |
| 6 | Web pública | F19–F22 | Matriu de rutes, robots i canonical; HTML inicial i targeta social d’un detall públic |
| 7 | Entrega | F02, F25–F28 | Artefacte sense secrets; CI en runtime suportat; manual executable; proves crítiques afegides; cap «verd» per una comprovació omesa |

**Smoke conjunt mínim:** obrir la pàgina real de Sollutia, arrancar el component amb el paquet final, injectar sessió, carregar dades del tenant, crear i modificar una nota, forçar conflicte, publicar, enviar/rebre un missatge, renovar, eixir i desmuntar. Repetir una part amb xarxa desconnectada i amb compte sense permisos. L’artefacte assajat ha de ser exactament el que s’entrega.

Una demo amb abast reduït és possible si se’n delimiten les funcionalitats i es verifiquen els seus riscos. No seria honest presentar-la com a garantia del sistema complet. No hi ha una estimació d’hores perquè encara falta conéixer el contracte i l’estat real del backend de Sollutia.

### Traçabilitat i reproducció

Els fitxers de prova diagnòstica estan només en la còpia temporal. La configuració de Vite usa l’àlies real de Preact, de manera que els casos de context no s’han executat amb un React diferent del producte.

| Fitxer temporal | Casos comprovats |
| --- | --- |
| `src/audit-identity.test.js` | JWT amb audiència estàndard rebutjat; sessió restaurada després d’esborrar-la durant refresh |
| `src/audit-session.test.jsx` | Temporitzador que no es rearma amb el mateix usuari |
| `src/audit-deadline.test.js` | Renovació pendent fora del deadline |
| `src/audit-host.test.jsx` | Precedència invertida del prototip; fallback de backend parcial |
| `src/audit-notes-context.test.jsx` | Override després del desat; revisió vella repetida després del 409 |
| `src/audit-notes-data.test.jsx` | Barreja de tenants; creació tardana del tenant anterior |
| `src/audit-seo.test.jsx` | Canonical/robots sense canvi de ruta; head no restaurat |
| `src/audit-boundaries.test.jsx` | Toast fora del shadow; índex global i aria-hidden; importació amb storage denegat |

Des de la còpia temporal: `./node_modules/.bin/vitest run src/audit-*.test.* --reporter=dot`. El build amb env usa exclusivament un sentinel fals amb signatura invàlida; no és una credencial utilitzable. No s’ha de promoure la còpia temporal ni el seu `.env.production` a un entorn de desplegament.

Evidències: [suite existent](/private/tmp/sdp-audit-260919-gyzijo2a/audit-vitest.log), [diagnòstics](/private/tmp/sdp-audit-260919-gyzijo2a/audit-diagnostics.log), [lint](/private/tmp/sdp-audit-260919-gyzijo2a/audit-eslint.log), [build web](/private/tmp/sdp-audit-260919-gyzijo2a/audit-build-web.log), [build standalone](/private/tmp/sdp-audit-260919-gyzijo2a/audit-build-embed.log), [build amb env sintètic](/private/tmp/sdp-audit-260919-gyzijo2a/audit-build-env-fixture.log), [tractors](/private/tmp/sdp-audit-260919-gyzijo2a/audit-gates.json), [empremtes del tall](/private/tmp/sdp-audit-260919-gyzijo2a/audit-manifest.json) i [reverificació de fonts](/private/tmp/sdp-audit-260919-gyzijo2a/audit-source-recheck.json). El directori temporal és evidència de treball local, no un arxiu permanent garantit.

## 2. Avaluació DAFO

- **Fortaleses:** arquitectura amb port de backend, capes de sanejament, polítiques SQL i control de concurrència ja presents; builds reproduïbles localment; casos adversos reproduïts amb codi real; distinció entre errors corregits i regressions vigents.
- **Debilitats:** manca una prova completa contra Sollutia, el baseline de proves és curt per al nombre de fluxos i les portes no modelen tota la semàntica. No hi ha certificació visual, de càrrega ni d’accessibilitat integral.
- **Amenaces:** reparar la sessió relaxant issuer/aud, obrir RLS per a resoldre el Mur, eliminar overrides sense preservar edicions noves o confondre un build verd amb una entrega validada. Qualsevol d’estes dreceres pot agreujar el problema.
- **Oportunitats:** convertir els diagnòstics temporals en regressions de producte quan es corregisquen, fixar un contracte de tenant/sessió únic i recuperar el valor dels tractors com a evidència concreta de comportament.

## 3. Matriu d’Urgència i Importància

- **Urgent i important:** acord de sessió amb Sollutia; les P1 del flux que s’entrega; prova conjunta amb l’artefacte final; política de claus i dades.
- **Important però no urgent:** paginació completa, cicle de vida per instància, prerender de contingut públic i reducció del soroll dels controls. Si la web pública forma part de l’entrega, el SEO passa al grup anterior.
- **Urgent però no important:** resums i empaquetament de documentació per a la reunió. Només després de tindre resultats verificables.
- **No urgent i no important:** neteges cosmètiques massives, canvis de noms o reescriptures generals sense relació amb els errors demostrats.

### Tancament documental

Codi funcional preservat. S’ha mantingut el contingut previ de l’índex i d’ESTAT. El tancament s’executa sobre una materialització temporal del corpus operatiu perquè `tancament.mjs` sincronitza skills i escriu mirrors; executar-lo sobre l’arbre compartit faria canvis fora de l’abast de l’auditoria. No es relaxa cap regla ni es presenta el deute previ com a resolt.

**Resultat final:** SCC manté exactament els mateixos **14 documents orfes** abans i després d’afegir l’informe; el document nou és accessible des de l’índex. Frontmatter estricte conserva el mateix recompte global d’incidències; no hi ha cap incidència individual atribuïda al nou informe. La comprovació de 286 empremtes de fonts, SQL i tooling no troba cap canvi respecte del tall auditat. La sessió mecànica Reflex és `8ecb2d76-e401-4289-aff1-f2078f186b08`.

Evidència de tancament: [abans](/private/tmp/sdp-audit-260919-gyzijo2a/audit-tancament-before.json), [després](/private/tmp/sdp-audit-260919-gyzijo2a/audit-tancament-after.json), [frontmatter](/private/tmp/sdp-audit-260919-gyzijo2a/audit-frontmatter.json) i [comprovacions addicionals](/private/tmp/sdp-audit-260919-gyzijo2a/audit-additional-checks.json).

**Ancoratge de Seguretat:** [[00_index_escriptori]]
