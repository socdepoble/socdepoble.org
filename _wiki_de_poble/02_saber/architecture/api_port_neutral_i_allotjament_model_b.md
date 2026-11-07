---
type: document
status: esborrany
description: Inventari verificable del port i requisits d'allotjament Model B
---
# API del port neutral i allotjament Model B

**Contrast inicial:** arbre de l'assalt 261101_1246, 2026-11-01. **Recompte actualitzat**
des de `src/data/contracte.js` i `src/data/conformitat/kit.js` el 2026-11-07 (R33: revisions de llavor i exportació pròpia; recompte executable vigent).
**Esborrany. Inventari de codi**; **no acredita cap nou desplegament** ni l'aprovació d'una ADR.
Les **signatures i DTO** són a `src/data/contracte.js` i a les **implementacions**;
la **llista següent** enumera noms.

## 32 operacions obligatòries del Nucli (`CONTRACTE_NUCLI`)

Font: `src/data/contracte.js`. Una implementació vàlida les oferix totes:

- `loadCoreContent`
- `loadMur`
- `loadMultimedia`
- `loadNotes`
- `appendChatMessages`
- `appendSectionSubmissionNetworkOnly`
- `updateNote`
- `loginWithMagicLink`
- `registerWithPassword`
- `loginWithPassword`
- `loginWithGoogle`
- `listMyOrganizations`
- `createOrganization`
- `updateOrganization`
- `updateProfile`
- `updateUserPassword`
- `getProfile`
- `recullTornadaOAuth`
- `logout`
- `getCurrentUser`
- `getBackendConfigurat`
- `getRuntimeDataMode`
- `getDefaultUserId`
- `createNote`
- `loadFils`
- `loadMissatges`
- `enviaMissatge`
- `marcaLlegit`
- `creaFilDirecte`
- `carregaMembres`
- `subscribeToXat`
- `unsubscribeFromXat`

## 46 capacitats atòmiques opcionals (`CAPACITATS`)

**106 mètodes addicionals**; **138 mètodes** en `CONTRACTE_BACKEND`. **Recompte obtingut**
amb `Object.keys(CAPACITATS).length`, `CONTRACTE_NUCLI.length` i
`CONTRACTE_BACKEND.length` del **mòdul executable**, no per recompte manual. Una capacitat
està disponible només si el port disposa de **tots els seus mètodes**. **No hi ha**
un camp `capacitats` **obligatori** a l'adaptador ni `capacitatsDisponibles()`. Les 46 són **grups declarats al contracte**, no 46 serveis implementats o desplegats per cada adaptador.

| Capacitat | Mètodes literals |
| --- | --- |
| `carpetesNotes` | `creaCarpetaNotes` |
| `edicioEditorial` | `adminActualitzaPublicacioEditorial` |
| `revisionsLlavor` | `loadSeedRevisions`, `desaRevisioSeed` |
| `sessioExterna` | `adoptaSessioExterna` |
| `paginacioNotes` | `loadNotesPage` |
| `paginacioSeccions` | `loadSeccioPage` |
| `admin` | `adminListUsers`, `adminListOrganizations` |
| `administracioUsuaris` | `adminLlistaUsuarisRegistrats`, `adminAssignaMembreOrganitzacio`, `adminConnectaUsuari` |
| `importacioPaquetMunicipal` | `importaMunicipiOpenData` |
| `verificacioCorreu` | `confirmaCorreu`, `reenviaVerificacioCorreu` |
| `recuperacioCorreu` | `demanaRestablimentCorreu`, `restablixContrasenyaAmbCorreu` |
| `sessio` | `refrescaSessio`, `elMeuRol` |
| `mitjans` | `uploadToStorage`, `getPublicUrl`, `resolveAsset`, `promoteToPublic` |
| `mitjansPropis` | `llistaElsMeusMitjans`, `esborraElMeuMitja` |
| `xatMultimedia` | `quotaXat`, `publicaAdjuntXat`, `urlAdjuntXat`, `descartaAdjuntXat` |
| `clausXat` | `publicaIdentitatXat`, `laMevaIdentitatXat`, `desaFraseXat`, `clausDeXat`, `desaLlibretaXat`, `laMevaLlibretaXat`, `estatXifratXat`, `epoquesDelFilXat`, `sobresMeusXat`, `obriEpocaXat`, `enviaXifratXat`, `reembolcallaXat`, `demanaXifratXat` |
| `xatMultimediaXifrat` | `publicaAdjuntXifratXat`, `bytesAdjuntXat` |
| `agenda` | `loadActesAgenda` |
| `compte` | `exportaLesMeuesDades`, `estatBaixa`, `demanaBaixa`, `cancelaBaixa` |
| `consentiment` | `estatConsentiment`, `registraConsentiment`, `revocaConsentiment` |
| `cicleNotes` | `mouNota`, `esborraNota` |
| `directori` | `loadPerfilPublic` |
| `directoriEntitats` | `listPublicOrganizations` |
| `agents` | `listMyAgents`, `updateAgent` |
| `reclamacions` | `reclamaOrganitzacio`, `lesMevesReclamacions` |
| `contacteOrganitzacio` | `llegeixContacteOrganitzacio`, `desaContacteOrganitzacio` |
| `xatDePagina` | `obriFilDePagina` |
| `salut` | `comprovaServidor` |
| `versioClient` | `versioMinimaClient` |
| `recuperacioContrasenya` | `demanaRecuperacioContrasenya`, `definixContrasenyaNova` |
| `entradaAmbToken` | `entraAmbTokenDeProveidor` |
| `membresOrganitzacio` | `llistaMembresOrganitzacio`, `desaMembreOrganitzacio`, `llevaMembreOrganitzacio` |
| `transferenciaPropietat` | `transfereixPropietatOrganitzacio` |
| `segonFactor` | `llistaFactors`, `inscriuFactor`, `reptaFactor`, `verificaFactor`, `retiraFactor` |
| `personalitzacio` | `adminDesaPersonalitzacio`, `adminHistorialPersonalitzacio` |
| `administracioMultipoble` | `adminLlistaPobles`, `adminLligPersonalitzacio` |
| `moderacio` | `denunciaContingut`, `llistaBloquejos`, `bloquejaAutor`, `desbloquejaAutor` |
| `normesConvivencia` | `estatNormes`, `acceptaNormes` |
| `seguiments` | `segueix`, `deixaDeSeguir`, `estatSeguiment`, `elsMeusSeguiments`, `quiEmSegueix` |
| `connexionsPubliques` | `preferenciesConnexions`, `desaVisibilitatConnexions`, `connexionsPubliquesDe`, `membresIEntitatsConnectadesDe`, `inclouPersonaEnEntitat`, `solicitaUnirSeAEntitat` |
| `titularPublic` | `loadTitularPublic` |
| `consentimentTitular` | `estatTitularPublic`, `marcaTitularPublic` |
| `dadesObertes` | `llegixDadesObertes` |
| `restauracioDadesObertes` | `restauraDadesObertes` |
| `avisosPush` | `desaDispositiuAvisos`, `retiraDispositiuAvisos` |
| `silenciXat` | `silenciaFil` |

## Validació i conformitat

`src/data/backendPort.js` exporta `validaBackendImplementation`,
`setBackendImplementation`, `getBackendImplementation` i `teCapacitat`.
La validació prepara els mètodes i només després substituïx el port, rebutja
getters i capacitats parcials. No és una prova funcional d'un servidor remot.

`src/data/conformitat/kit.js` **exporta** `CASOS`, `contextDeConformitat`,
`executaCas` i `metodesSenseCas`. **Els casos tornen** `ok`, `falla` o `omés`.
El tall FEDI-17 del 03-11-2026 té **172 casos sobre els 120 mètodes** i
`metodesSenseCas()` torna una llista buida. Els 99 casos originals es conserven;
les cinc passades han registrat una unió de **120 invocacions reals**. **Les omissions**
per capacitat, dades o autorització continuen separades dels casos superats.
Les proves són `src/data/conformitat/kit.test.js` i `qualitat.test.js`, amb corredors
locals i de Supabase seed/remot amb doble de transport explícit. Les sondes i
els mutants independents detecten crides absents, DTO incorrectes i operacions
inoperants. No hi ha les API `verificaContracteBackend` o `executaKitDeConformitat`.
Esta cobertura contractual local **no acredita 120 èxits de servidor remot**,
ni totes les branques possibles de cada mètode.

### Recompte local vigent (R33) i verificació per correu (R6)

El recompte actual és de **190 casos sobre 138 mètodes** i `metodesSenseCas()` buit. Les dues **capacitats opcionals** `verificacioCorreu` i `recuperacioCorreu` afigen **quatre mètodes** i **quatre casos de rebuig** d’entrada malformada al **tall històric** de **178 casos**. Els dos grups `administracioUsuaris` i `importacioPaquetMunicipal` afigen quatre mètodes i quatre casos de rebuig al tall R6 de 184 casos sobre 132 mètodes. Un cas catalogat és cobertura del nom i del seu escenari; **no acredita un èxit funcional ni un servei de correu desplegat**. Els resultats `ok`, `falla` i `omés` continuen separats.

L’adaptador local oferix **43 dels 46 grups declarats**. `CAPACITATS_NO_DECLARADES` conté exactament `importacioPaquetMunicipal`, `verificacioCorreu` i `recuperacioCorreu`; els **cinc casos** d’estos grups (un d’importació i quatre de correu) s’ometen per **capacitat absent**. Les omissions per dades o autorització dels altres casos continuen sent **explícites**. Les **138 declaracions** del port **no són 138 operacions verificades en un servidor remot**.

### Carpetes privades del Bloc de Notes (R12)

La capacitat opcional `carpetesNotes` oferix `creaCarpetaNotes({ nom }, config)`: desa la carpeta privada abans de poder assignar-li notes i retorna `{ id, nom, parentId }`. El servidor deduïx propietari de `auth.uid()` i valida pertinença al tenant; `loadNotes` carrega els noms reals de `note_folders` filtrats pel mateix propietari. La migració76 instal·la RLS i la RPC; el Node0 actual deixa esta capacitat absent. El nou cas neutral comprova el rebuig d'un nom buit abans de qualsevol escriptura; les proves funcionals de la migració acrediten permisos i persistència en un PostgreSQL descartable, sense afirmar aplicació remota.

### Edició editorial de documents publicats (R12)

`adminActualitzaPublicacioEditorial({ seccio, id, canvis, versio }, config)` modifica un element existent de `app_content`: `mur` → `feedPosts`, `events`, `mercat` → `marketItems` o `pagines` → `pages`. Retorna `{ item, versio }`; `_editorialClau` i `_editorialVersio` provenen del backend. La versió de tota la col·lecció es compara sota bloqueig de fila; un desament antic falla amb `conflicte-versio`. La llista blanca admet text, imatges i classificació editorial; l'autoria, el tenant, les rutes i els pobles originals es conserven. Les metadades del payload d'una publicació veïnal no poden fabricar esta font.

La migració **2611051930**, número **76** del catàleg candidat, requerix **superadmin amb AAL2** abans de consultar les dades. El local requerix una política `administracioLocal` injectada explícitament; cap rol declarat pel client la substituïx. La composició Node0 només anuncia la capacitat amb `SDP_NODE0_EDITORIAL=1` i la RPC instal·lada; les sessions Node0 actuals amb **AAL1** continuen denegades i no s'eleven. S'han provat permisos, CAS i preservació en PostgreSQL descartable; això **no acredita desplegament ni una sessió AAL2 de producció**.

Les pàgines de sistema continuen llegint la llavor vigent fins al primer desament explícit amb `editorial_format: html-r6`, conservant els textos d'IDEA-92. Després preval la pàgina desada, inclòs un cos buit. Un canvi del text invalida traduccions estàtiques antigues. El backfill de Manifest/Aplec només substituïx el resum o l'absència coneguts de R5 i conserva edicions divergents.

### Revisions de llavor i exportació pròpia (R33)

La **capacitat opcional** `revisionsLlavor` afig `loadSeedRevisions({ seccio, ids }, config)` i `desaRevisioSeed({ seccio, id, camps, versio, fontVersio }, config)`. La consulta retorna **només revisions públiques vigents**. El CAS comprova la **revisió de la peça** i la **versió llegida de la font** d’`app_content`; **un canvi de font invalida** l’overlay anterior. La migració80 valida **autoria de servidor o superadmin amb AAL2**, sense DML directe del client. Local i Supabase tenen implementació i proves; el receptor privat Node0 **no anuncia el transport nou**.

La RPC única `exporta_les_meues_dades()` incorpora les **aportacions pròpies** sense copiar el cos de l’exportador canònic. `author_payload` separa els **camps aportats per qui edita** del cos públic fusionat amb edicions anteriors. L’exportació **exclou dades d’altres autors** i actors nuls, i la **resposta pendent es bloqueja** després d’un canvi de compte. Un servidor antic marca el recurs no disponible; **no equival a una exportació completa**. La migració del storage antic és **explícita, amb selecció i doble versió**; no buida ni publica automàticament revisions sense atribució. SQL80 està preparat i provat localment, **sense aplicació remota acreditada**.

### Connexions i pertinença (FEDI-23)

El tall FEDI-23 de la **capacitat opcional** `connexionsPubliques` ampliava el contracte a **126 mètodes**, amb **178 casos** al kit i `metodesSenseCas()` buit. Els 172 casos previs es conserven en ordre; els **sis casos nous** comproven rebuig estructural abans d’efectes. Els camins positius, la privacitat, els permisos i les carreres es proven separadament amb els **adaptadors reals** locals, els wrappers remots i PostgreSQL. Esta combinació **no acredita** 126 èxits en un servidor remot.

La preferència `visibilitatConnexions` és **privada per defecte**. El perfil pot habilitar la **lectura pública** i ocultar vincles individuals. Una **excepció privada** a qualsevol extrem domina; els **perfils privats**, els bloquejos i el representant bloquejat d’una entitat no es projecten. La **consulta pública** és la mateixa per a visitants i propietàries. Les preferències amb vincles editables són una **lectura autoritzada** separada, també a empresa, entitat i poble. El poble es resol explícitament per **id o slug**, sense reservar al tenant actiu.

`inclouPersonaEnEntitat({orgId,personaId,rol})` requerix **autoritat de l’entitat**; només qui ja podia **nomenar administradores** pot assignar `administrador`. `treballador` i `usuari` són **papers funcionals** separats dels permisos de propietat. `solicitaUnirSeAEntitat({orgId,rol})` només registra una **petició pendent**: no crea pertinença ni concedix cap permís. Les comprovacions de servidor usen la **identitat autenticada** i els rols persistits. La **política injectada** del magatzem local només és autoritat local.

La Frontissa Sollutia conserva el seu límit GET i el mateix port neutral. La migració de connexions es prepara i assaja localment; la seua disponibilitat remota s’ha de comprovar separadament.
### Administració multipoble (FEDI-04)

La capacitat nova és **opcional** i separada del **llistat públic de pobles**.
`adminLlistaPobles(config)` crida `admin_llista_pobles` i torna només
**`[{ id, slug, nom }]`** de `public.towns`. `adminLligPersonalitzacio(config)`
exigix el **`tenantId` explícit** i crida `admin_llegix_personalitzacio` per a
eixe tenant: torna `taxonomia` i `estil`, amb payload i versió o null. **Les dues
RPC** requerixen `private.es_superadmin()`, que exigix rol **superadmin** i JWT
**`aal2`**; ser administrador a `town_memberships` no hi atorga accés.

Les **facetes existents del Tauler** fan lectures, desats i historial amb la
**config del poble triat**. **No canvien la sessió**, el tenant global ni el contingut
global. La selecció torna a validar-se quan canvia la sessió i les **lectures
velles** **s'avorten i s'ignoren**. La **previsualització de l'estil** es limita a la
faceta. Les mutacions reutilitzen `adminDesaPersonalitzacio` i
`adminHistorialPersonalitzacio`, amb la **mateixa autoritat de servidor**.

**Límit de desplegament:** `2611031700_administracio_multipoble.sql` és additiva
i la seua aplicació remota **no queda acreditada** per les proves locals.
L'adaptador remot oferix el contracte al codi; la disponibilitat efectiva del
servidor es comprova separadament. Els errors **no es convertixen en llistes
buides** ni en pobles de mostra. `tests/administracio-multipoble-postgres.test.mjs`
ha aplicat **74 migracions reals** a PostgreSQL17.5 WASM (PGlite0.3.16), en l'ordre
canònic de desplegament: **40/40 proves** i mutants d'autoritat/historial refutats,
més un mutant independent de filtre tenant. Auth/Storage/Realtime tenen
infraestructura de fixture; no és un desplegament ni una prova de GoTrue o PostgREST.
El registre de dependències és `supabase/migrations/README.md` i el catàleg
complet, `supabase/README.md`; l'**ordre executable** és `supabase/ordre_desplegament.json`.

Els dos mètodes tenen **quatre casos** al kit neutral: dos comproven el **rebuig**
`abast-invalid` d'un tenant malformat **abans del transport**, i dos validen la
forma de les **lectures autoritzades**. Els positius **s'ometen per defecte**:
requerixen `adminMultipobleAutoritzat: true` i, per a la lectura, un
`tenantAdministrat` explícit al context de prova. Eixa opció del corredor
**no atorga permisos** al servidor. Les proves passen també amb l'adaptador remot
real i un **doble de RPC**; **no acrediten una sessió privilegiada en PostgreSQL**.

L'adaptador local oferix **43 dels 46 grups declarats**; `CAPACITATS_NO_DECLARADES`
conté `importacioPaquetMunicipal`, `verificacioCorreu` i `recuperacioCorreu`. `versioMinimaClient` torna honestament `null`, sense transport.
L'administració multipoble està **denegada per defecte**: requerix el catàleg i
la política `administracioLocal` injectats en construir la instància. La política
només autoritza amb `true`, i **no deriva permisos** de rols o MFA del client.
Lectura, escriptura i historial administratius usen el **tenant explícit**; dades,
versions i historial se separen per tenant i clau. La lectura general continua
en el poble propi. Les entrades i l'actor es capturen abans d'esperar, i canvis
de sessió, avortament o destrucció **impedixen mutacions no iniciades**.
Esta autoritat és **només del magatzem local**: no concedix permisos a Supabase
ni protegix davant scripts amb accés al mateix origen. El contracte de composició
i els límits figuren a `src/data/local/README.md`.

## Frontissa de lectura i sessió

`src/data/adaptadors/sollutia/client.js`: `CONFIGURACIO` té `apiOrigin: null`,
`allowedOrigins: []` i `resources: {}`. `ESCRIPTURES_PERMESES` és buit.
`llig` no té recursos activats sense una captura versionada.

`src/data/adaptadors/sollutia/creaFrontissa.js` **exporta** `creaFrontissa` i
`ErrorDades`. **Valida HTTPS**, **origen admés**, **rutes, paràmetres i captures**;
usa GET, credentials omit, redirect error i Accept application/json.
Cada recurs aporta `timeoutMs`, `maxBytes` i `decode`, que **valida el DTO**.
Els **codis literals** inclouen `INVALID_ORIGIN`, `INVALID_RESOURCE`,
`UNKNOWN_RESOURCE`, `INVALID_QUERY`, `CANCELLED`, `TIMEOUT`,
`PAYLOAD_TOO_LARGE`, `INVALID_PAYLOAD`, `UNAUTHENTICATED`, `FORBIDDEN`
i `UNAVAILABLE`. No són codis FRONTISSA_*.

La sessió externa és una capacitat separada; el seu issuer no és un origen
de dades. Les dades del poble continuen darrere del port de Sóc de Poble.

## Allotjament verificable

- WordPress: `wordpress-plugin/socdepoble-enxufe.php` carrega
  `dist/soc-de-poble.standalone.js` i `dist/sdp-release.json` relatius al plugin.
  El codi curt `[socdepoble_app]` (`includes/marcatge.php`) i el bloc `socdepoble/app`
  (`includes/bloc/block.json`) allotgen el component.
  L'aprovació de l'slug `socdepoble` ja consta en Ronda 1; no prova una versió
  publicada ni un nou desplegament d'este lot.
- Web estàtica: `firebase.json` servix `dist` i declara Content-Security-Policy,
  X-Content-Type-Options, Referrer-Policy i Permissions-Policy. No declara
  HSTS ni X-Frame-Options; la política de marcs és dins de CSP. Les projeccions
  de federació i el seu desplegament són una verificació separada.
- Node municipal: `flake.nix` i `tooling/instalador/flake.nix` són peces diferents.
  `tooling/instalador/inicia-node-germa.mjs` prepara fitxers locals. Les proves
  Node no substituïxen executar Nix ni acrediten infraestructura desplegada.

Cal configurar **domini HTTPS**, **origen del backend**, **clau pública del navegador**
i **municipi** abans de construir/servir la web. **Cap clau service_role o secret**
entra al frontend. No es fixen costos, RAM, proveïdors alternatius ni recursos
mínims **sense mesurar-los**. Qualsevol canvi de backend requerix adaptador,
conformitat, **cobertura declarada** i la decisió documentada del projecte.

## Vincles

- [[00_index]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
