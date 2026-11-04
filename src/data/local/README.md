---
type: document
status: esborrany
description: "Persistència rural, cua d'operacions encadenada amb SHA-256 i enxufe offline opcional: injecció explícita, àmbit, desconnexió, contractes, límits i privacitat."
---
# Persistència rural i enxufe offline opcional

Estos tres mòduls es carreguen per injecció explícita. Importar-los no canvia `backendPort`, no activa cap mode de dades i no programa sincronitzacions. El port existent continua sent el punt d'accés de l'aplicació; el consumidor decidix quan l'embolcalla i quan torna al port original.

## Àmbit, construcció i desconnexió

Tots els components compartixen exactament `abast = { persona, tenant, endpoint, mode }`. Són quatre cadenes no buides: `endpoint` admet HTTP(S) sense credencials, consulta ni fragment, o els sentinels explícits `local` i `seed`. No es deduïxen permisos a partir d'este objecte. L'ID de persona ha de ser estable i aportat pel consumidor, sense tokens ni contrasenyes.

```js
import { creaPersistenciaLocalRural } from './persistenciaLocalRural.js';
import { creaCuaOperacionsOffline } from './cuaOperacionsOffline.js';
import { creaEnxufeBackendOfflineFirst } from './enxufeBackendOfflineFirst.js';

// portOriginal, abastActual i nodeId són dependències del consumidor.
const abast = Object.freeze({ ...abastActual });
let actiu = true;
const persistencia = creaPersistenciaLocalRural({ abast });
const cua = creaCuaOperacionsOffline({
  abast, nodeId, isScopeActive: () => actiu
});
const enxufe = creaEnxufeBackendOfflineFirst({
  port: portOriginal, persistencia, cua, obteAbast: () => abastActual
});
const backend = enxufe.backend; // el consumidor injecta este port

function desconnecta() {
  actiu = false;
  enxufe.destroy();
  cua.close();
  persistencia.tanca();
  return portOriginal;
}
```

En canviar persona, tenant, endpoint o mode, desconnecteu primer i construïu un conjunt nou. `nodeId` identifica l'escriptor i la seua cua: cal conservar-lo per a recuperar eixa cua després d'un reinici. Dues instàncies que compartixen cua han d'usar el mateix àmbit, `nodeId` i magatzem. Cues de `nodeId` diferents no tenen un ordre global compartit.

El motor per defecte és IndexedDB, amb base `sdp-rural-v1` i object store `estat`. Si falta IndexedDB, falla explícitament. Per a Node o proves, injecteu `motor: 'memoria', memoria: unMapCompartit` i `crypto: webcrypto` de `node:crypto` en persistència i cua. La memòria no sobreviu al procés. `indexedDB`, `crypto`, `ara` i els ports també són injectables; no hi ha dependència d'un servidor concret.

`enxufe.destroy()` retira el listener `online` i avorta les esperes pròpies; no tanca les dependències injectades ni destruïx el port original. `enxufe.backend.destroy()` sí que delega després al `destroy` original, si existix. `cua.close()` tanca el magatzem només quan l'ha creat ella; un `store` injectat el tanca qui en té la propietat. Tancar no purga dades ni intencions persistides. La retenció o eliminació de l'antic àmbit és una decisió del consumidor.

## `persistenciaLocalRural.js`

`creaPersistenciaLocalRural(opcions)` exposa un objecte immutable amb `abast` i estes operacions asíncrones:

| API | Contracte |
| --- | --- |
| `llegix(col, { signal }?)` | Torna una còpia de la llista, inicialment buida. |
| `desa(col, registres, { signal }?)` | Substituïx una col·lecció i torna la llista confirmada. |
| `actualitza(col, transforma, { signal }?)` | Executa una transformació **síncrona** dins del read/modify/write atòmic; ha de tornar una llista. |
| `exportaInstantaniaLocal({ signal }?)` | Torna `{ schema, abast, createdAt, collections, sha256 }`. |
| `restauraInstantaniaLocal(objecteOJson, { signal }?)` | Valida abans d'escriure; torna `{ revision, registres, integritat, autenticitat }`. |
| `tanca()` / `close()` | Tanca connexions i cancel·la operacions pendents. |

Les col·leccions tancades són `bans`, `notes`, `directory`, `calendar` i `catalog`, exportades en `COLLECCIONS_RURALS`. Cada registre és un objecte JSON pla amb `id` textual no buit, de màxim 512 caràcters i únic dins de la col·lecció. `desa` no fa una fusió de registres. `actualitza` evita que dues connexions sobreescriguen una actualització concurrent; no admet una promesa dins de la transacció.

L'esquema d'instantània és `sdp.instantania-local-rural.v1`. Una restauració exigix el mateix àmbit i SHA-256 correcte; si el destí canvia mentre es calcula el hash, rebutja amb `SDP-RURAL-CONFLICTE`. La instantània conté les cinc col·leccions, inclosa qualsevol cau que hi haja desat l'enxufe; no inclou la cua d'operacions ni cap sessió d'autenticació. També s'exporten els delegadors `exportaInstantaniaLocal(persistencia, config)` i `restauraInstantaniaLocal(persistencia, snapshot, config)`.

La capa baixa `creaMagatzemAtomicRural(opcions)` exposa `{ abast, read, compareAndSwap, close }`. `read(clau, { signal }?)` torna un estat copiat o `null`. `compareAndSwap(clau, revisioEsperada, estatNou, { signal }?)` torna un booleà: absència equival a revisió 0 i el nou estat ha de portar `revision === revisioEsperada + 1`. La clau té entre 1 i 512 caràcters. En IndexedDB, lectura i escriptura succeïxen dins d'una única transacció; la promesa confirma en `oncomplete`, no en l'èxit anticipat de `put`. El hash es calcula fora de la transacció. `copiaJsonRural` i `normalitzaAbastRural` són els validadors compartits.

## `cuaOperacionsOffline.js`

`creaCuaOperacionsOffline({ abast, nodeId, ...opcions })` exposa `abast`, `enqueueOfflineMutation`, `peekOfflineQueue`, `drainOfflineQueue`, `verifyOfflineQueueChain`, `resume`, `resolveBlockedHead` i `close`. També s'exporten les quatre primeres operacions com a funcions amb la cua en el primer argument; `verifyOfflineQueueChain` accepta una cua creada pel mòdul o un estat JSON copiat. Un `store` injectat ha d'implementar el CAS anterior i exposar un `abast` coincident, encara que estiga buit. `isScopeActive(abast)` ha de tornar `true` mentre eixa identitat continua activa.

```js
const op = await cua.enqueueOfflineMutation({
  resource: 'notes', recordId: 'nota-1', action: 'update',
  changes: { title: 'Text pendent' }, baseVersion: 3
});
const estat = await cua.peekOfflineQueue();
const pendents = estat.entries; // no és un array en el nivell superior
```

`enqueueOfflineMutation(input, { signal }?)` admet `action: 'create' | 'update' | 'delete'`; una eliminació porta `changes: {}`. Els camps obligatoris són `resource`, `recordId`, `action` i `changes`; els opcionals són `baseVersion`, `causalContext` i `observedHlc`. Rebutja camps d'autoritat o extensions desconegudes en este nivell. Retorna l'operació completa amb `opId`, seqüència, àmbit, context/vector causal, HLC, rellotges dels camps textuals, `prevHash` i `hash`. `causalContext` és el vector observat del mateix registre: la cua hi afig només el seu punt propi anterior i no hi barreja vectors observats en altres registres. Un `observedHlc` més de `maxDriftMs` (per defecte 5 min) per davant del rellotge físic, o amb un comptador per damunt de 2^32-1, es rebutja amb `OFFLINE_CLOCK_DRIFT`. Una cancel·lació o un temps esgotat només garantixen «no escrit» si arriben abans del commit: un CAS confirmat torna l'operació, i un canvi d'àmbit posterior al commit rebutja amb `OFFLINE_SCOPE_INACTIVE` i `committed: true`. No captura una RPC ordinària que haja fallat per a convertir-la després en una nova intenció.

`peekOfflineQueue({ signal }?)` retorna `{ schema, revision, abast, nodeId, clock, context, nextSeq, ack, entries, inflight, blocked, resolved? }`. L'esquema és `sdp.cua-offline.v1`; `ack` conserva `{ seq, hash }` del cap confirmat. Retirar entrades amb ACK no reinicia la seqüència ni trenca l'àncora de la cadena. La verificació torna `{ valid: true, anchoredAt, pending, tailHash, authenticated: false }` o `{ valid: false, code: 'OFFLINE_INTEGRITY' }`.

El port de replay és separat del backend ordinari i ha d'oferir este contracte:

```js
const replayPort = {
  capacitats: { idempotenciaOffline: true },
  applyOfflineMutation: aplicaIdempotentAlServidor // dependència del consumidor
};
const resultat = await cua.drainOfflineQueue(replayPort, {
  maxOperations: 100, signal
});
```

El fragment descriu la forma del port; el mòdul no proporciona eixa implementació remota. La funció rep `(op, { idempotencyKey, scope, signal })` i ha d'autoritzar l'àmbit i deduplicar l'operació atòmicament amb la mutació remota. `idempotencyKey` és l'`opId` original i `scope` és l'àmbit complet. Només s'accepta l'ACK exacte `{ opId: op.opId, committed: true }`, sense altres camps. L'avanç de l'ACK local i la retirada del cap es confirmen junts per CAS. Una resposta perduda o una lease caducada pot provocar un altre enviament del mateix `opId`: la idempotència remota és obligatòria i no es promet execució «exactly once».

`drainOfflineQueue` té exclusió local i una lease durable per CAS entre instàncies de la mateixa cua. Retorna `{ status, acknowledged, reason? }`; els estats són `drained`, `pending`, `busy`, `blocked`, `retryable`, `cancelled` i `lease-lost`. Errors 401/403 o d'autenticació bloquegen; 400/404/422 o de validació també bloquegen; un 409 o `CONFLICT` bloqueja amb `reason: 'conflict'`; ACK incorrecte o error desconegut bloqueja per revisió. Errors explícits de xarxa, `TypeError` del transport i 408/425/429/500/502/503/504 conserven la intenció per a un nou intent explícit; per això una clau d'idempotència encara en procés ha de respondre 425/503, mai 409. `resume()` lleva el bloqueig sense alterar l'operació: cal resoldre abans la causa. No descarta silenciosament el cap ni reordena la cua.

`resolveBlockedHead({ opId, outcome: 'superseded' | 'discarded' }, { signal }?)` és l'única via, explícita i auditada, per a retirar un cap bloquejat (per exemple, un 409 que retindria la resta de la cua per sempre). Avança l'àncora `ack` amb el `seq` i el `hash` del cap, de manera que la cadena continua vàlida, i ho apunta a `resolved` (com a màxim 64 entrades) amb el tipus, el codi, el resultat i l'hora. `resolved` NO vol dir confirmat pel servidor. Torna l'operació retirada: el consumidor l'ha de reconciliar amb `reconciliaConflicteOffline`, persistir-ne la còpia de conflicte i, si cal, encuar la substituta amb `causalContext` i `observedHlc` del registre remot. Un `opId` que no és el cap bloquejat rebutja amb `OFFLINE_NOT_BLOCKED`.

### HLC i reconciliació de text

`seguentRellotgeHLC(local, observat, tempsFisic, nodeId, { maxDriftMs }?)` i `comparaRellotgesHLC(a, b)` són purs. El rellotge `{ wallTime, counter, nodeId }` continua avançant quan el rellotge físic retrocedix; `nodeId` desfà empats de forma determinista. La fita `MAX_DERIVA_HLC_MS` impedix que un rellotge remot verinós avance el rellotge durable sense límit.

`reconciliaConflicteOffline(localOp, remoteRecord)` exigix el mateix `resource` i `recordId`. El remot porta `values` i `hlc`, i pot portar `version`, `fieldClocks`, `deleted` i `abast`; l'operació local porta `action`, `changes` i `hlc`, amb metadades causals opcionals. Torna `{ record, concurrent, needsReview, causalRelation, conflictCopy }`. La dominància causal preval sobre l'ordre de rellotge; les versions incomparables permeten declarar concurrència i triar text amb LWW per camp. Es conserva el text perdedor o la intenció d'eliminació en `conflictCopy`.

Un HLC a soles no demostra concurrència. Sense vectors suficients es marca `needsReview: true`, `concurrent: false` i, si hi ha pèrdua, `reason: 'causality-unavailable'`. Una mateixa versió causal amb continguts o eliminacions contradictoris falla explícitament. Esta reconciliació només fusiona canvis textuals; no resol comptadors, permisos, adjunts ni totes les operacions d'un CRDT. És una funció pura: el consumidor ha de persistir i presentar la còpia de conflicte. L'enxufe no invoca esta reconciliació ni implementa una interfície de revisió automàtica.

## `enxufeBackendOfflineFirst.js`

`creaEnxufeBackendOfflineFirst({ port, persistencia, cua, obteAbast, ...opcions })`, també exportat com `enxufeBackendOfflineFirst`, retorna `{ backend, abast, drena, destroy }`. El backend conserva els mètodes presents del contracte, els seus receptors `this` i els tipus síncrons dels mètodes delegats. No afegix implementacions absents al port original.

Per defecte, `loadNotes` usa `notes`, `loadMur` usa `bans` i `loadCoreContent` usa `directory`. Les lectures guarden la **resposta completa**, incloses carpetes o metadades. La clau SHA-256 incorpora tots els arguments selectors; només el `signal` de l'objecte de configuració del segon argument queda fora de la clau. Llista, detall, cursors, filtres i arguments absents no s'intercanvien. Es pot injectar `lectures: { metode: { colleccio, clau(args), projecta? } }` només per a estos tres mètodes, dins de les cinc col·leccions. El constructor rebutja descriptors d'autenticació, xat, permisos, mutacions i `NetworkOnly` abans de cridar el port o els selectors. Ampliar esta llista de lectures requerix una revisió explícita del contracte de privacitat.

`estaConnectat()` usa per defecte `navigator.onLine !== false`: és un indici, no una prova de connexió. Si la lectura no pot contactar amb el port, `esErrorTransportOffline(error)` només autoritza reserva amb els codis neutrals `backend-inabastable`, `servidor-inabastable` o `offline`, sense estat HTTP positiu i sense `AbortError`. Un `TypeError` genèric, un 401/403, una validació, un conflicte o un esquema absent es propaguen. Sense cau hi ha `SDP-OFFLINE-SENSE-CAU`, mai una llista buida fabricada. Una fallada de quota en guardar una resposta remota no repetix la petició: notifica `onError({ code, method })` sense payload privat.

`escriptures` és buit per defecte. Els noms admesos són `createNote`, `updateNote`, `mouNota` i `esborraNota`; cada descriptor porta `{ resource, prepara(args), resultat(receipt) }` i requerix `replayPort` idempotent. `prepara` retorna l'input d'intenció anterior; `resultat` adapta `{ op, queued, committed, status }` al resultat que espera el consumidor. Estos mètodes desaran primer la intenció i usaran el replay també quan hi haja connexió. Una intenció ja durable no es dona mai per fallida: si el drenatge o la consulta posterior s'esgoten o es cancel·len, torna `{ queued: true, status: 'retryable' | 'cancelled' }`. Només llança `SDP-OFFLINE-REBUTJADA` la intenció que el servidor ha rebutjat; una intenció que queda darrere d'un cap bloquejat torna `{ queued: true, committed: false, status: 'blocked-behind' }` i s'aplicarà quan es resolga el cap. Sense descriptor, les mutacions de Notes continuen amb la RPC original una sola vegada i sense temps límit propi de l'enxufe (el del port): un temps esgotat no pot amagar un commit. Quan confirma, s'invalida la cau de Notes. Autenticació, xat, permisos i mètodes `NetworkOnly` es deleguen sense encuar-los.

El projector exportat `projectaNotesOffline(entrada, op, context?)` aplica les intencions pendents en ordre sobre les lectures de Notes. No inserix una creació dins d'un altre detall ni d'una pàgina filtrada o incompleta. Un cap bloquejat i les entrades posteriors deixen de projectar-se. Les confirmacions de replay actualitzen la projecció en cau i un rellotge durable invalida lectures anteriors d'altres connexions. Si una mutació avança la cau mentre hi ha una lectura en curs, es rebutja amb `SDP-OFFLINE-LECTURA-ANTIGA` i el consumidor pot repetir-la.

`drena({ signal }?)` retorna el resultat de la cua, o `pending` amb `reason: 'offline' | 'no-replay-port'`. L'esdeveniment `online` provoca un únic intent amb el mateix mecanisme; `eventTarget: null` permet desactivar eixe listener. No hi ha polling ni reintents periòdics. Els canvis d'àmbit i `destroy()` impedixen lliurar respostes tardanes de les operacions embolcallades. Els mètodes delegats continuen sota el control d'identitat i autorització del port original.

## Límits, privacitat i abast de verificació

| Recurs | Valor per defecte i límit |
| --- | --- |
| Estat rural / instantània | `limitBytes`: 4 MiB; configurable entre 512 B i 32 MiB. |
| Registres rurals totals | `limitRegistres`: 5.000; màxim 10.000, incloses files de cau i rellotge. |
| JSON compartit | Profunditat 24, 50.000 nodes, màxim 10.000 elements per array. |
| Cua | 1.000 operacions i 4 MiB; només es poden reduir estos sostres. |
| Operació | 128 KiB; fins a 128 camps de canvi; vectors fins a 64 nodes. |
| Cau del port | `maxCacheEntries`: 64 respostes per col·lecció; configurable entre 1 i 512. |
| Esperes | Persistència 10 s; enxufe i replay 15 s; configurables entre 1 ms i 60 s. La RPC directa de Notes no en té cap de l'enxufe. |
| Lease de replay | 30 s; configurable entre 1 ms i 60 s. |
| Deriva HLC observada | `maxDriftMs`: 5 min; configurable entre 0 i 24 h. |

Els límits s'apliquen als sobres complets: prop del sostre, afegir metadades o exportar una instantània pot superar la quota. La quota real del navegador pot ser menor; IndexedDB pot ser denegat, buidat o expulsat. No es demana persistència il·limitada i no hi ha recuperació màgica de dades expulsades. Els errors de quota, bloqueig, cancel·lació i timeout són explícits; els temporitzadors són acotats i es retiren en acabar. Cancel·lar l'espera d'un hash no cancel·la el càlcul WebCrypto ja iniciat.

Només s'admet JSON pla i finit: es rebutgen getters, `toJSON`, cicles, prototips especials, símbols, arrays amb buits, `undefined`, funcions, `BigInt` i dates. Les claus reservades i els noms habituals de secrets es rebutgen. Este filtre no detecta un secret amagat dins d'un camp textual innocent: el consumidor continua sent responsable del contingut que decidix persistir. No s'accepten fitxers, rutes de sistema ni symlinks com a entrada d'estes APIs de navegador.

L'aïllament per àmbit separa namespaces, però no xifra dades ni protegeix davant JavaScript amb accés al mateix origen. La cadena SHA-256 és un encadenament sense clau, no una signatura: la cua és **encadenada**, no signada. Detecta l'alteració, el reordenament o l'eliminació incoherent d'entrades respecte de l'àncora `ack` desada, però no autentica l'autor. `ack`, `nextSeq`, `clock`, `context`, `inflight`, `blocked` i `resolved` no entren en cap hash. Qui puga escriure el magatzem pot, sense calcular cap hash nou, retirar el cap avançant `ack`, truncar o buidar la cua recalculant les metadades derivables, o recular `ack` i reinjectar una operació ja confirmada; en tots tres casos `verifyOfflineQueueChain` torna `valid: true`. Tampoc no detecta una reescriptura completa amb hashos nous. Detectar-ho requerix un checkpoint extern de confiança, com ara l'últim `ack` confirmat pel servidor; davant la reinjecció, la defensa és la idempotència remota per `opId`. Els logs de notificació de l'enxufe només porten codi i mètode. No es restauren sessions ni s'atorga autoritat de servidor des d'una instantània o operació local.

Les proves dirigides són `tests/persistencia-local-rural.test.mjs`, `tests/cua-operacions-offline.test.mjs` i `tests/enxufe-backend-offline-first.test.mjs` <!-- tractor-psicopatia: allow ZOMBIE-OFFLINE-FIRST -- nom literal del fitxer de test -->. Cobrixen transaccions, CAS, reinici, àmbits, JSON hostil, quotes, ACK, idempotència, causalitat i respostes tardanes. La comprovació en Chrome amb IndexedDB nativa cobrix reobertura, concurrència, instantànies alterades, identitat, reinici de cua i reconnexió. El transport d'estes proves és simulat: no certifica un backend real amb deduplicació remota, autorització, migracions o conflictes distribuïts. La integració amb eixe servei i la política de retenció/revisió continuen sent responsabilitat del consumidor.

## Adaptador local: 39 capacitats i administració multipoble

`creaAdaptadorLocal` implementa les 39 capacitats completes del contracte. `versioMinimaClient` torna sempre `null`, incloses iOS i Android: este procés local no publica cap mínim de botiga ni usa un servidor encara que la config de crida ho demane.

L'administració multipoble està denegada per defecte (`no-disponible`). L'amfitrió pot injectar una autoritat **exclusivament local** en construir l'adaptador. És una dependència de composició, mai un rol de la sessió o una bandera enviada en una crida. No concedix permisos sobre un servidor ni protegix davant scripts amb accés al mateix procés/origen.

```js
const backend = creaAdaptadorLocal({
  mode: 'local', tenantId: tenantInicial,
  administracioLocal: {
    pobles: catalogLocalAutoritzat, // [{ id: UUID, slug, nom }]
    autoritza: async ({ personaId, operacio, tenantId }) =>
      politicaDelProces.autoritza(personaId, operacio, tenantId)
  }
});
const pobles = await backend.adminLlistaPobles();
// tenantTriatExplicitament és la tria de la persona, aportada pel consumidor.
const config = { tenantId: tenantTriatExplicitament };
const actual = await backend.adminLligPersonalitzacio(config);
await backend.adminDesaPersonalitzacio({
  clau: 'taxonomia', payload: { categories: [] },
  versio: actual.taxonomia?.versio ?? 0
}, config);
const historial = await backend.adminHistorialPersonalitzacio('taxonomia', config);
```

El catàleg es valida, copia i congela a la construcció (màxim 1.000 pobles; UUID i slug únics, nom de fins a 200 caràcters). No prové de `dades.towns`, del directori públic ni d'una restauració. La política rep un objecte congelat només amb `personaId`, `operacio` (nom del mètode) i `tenantId`; en llistar, `tenantId` és `null` i l'autorització correspon al catàleg injectat sencer. Només el booleà `true` autoritza. Pot esperar i revocar mitjançant la seua pròpia dependència; els errors es propaguen. Sense sessió hi ha `sense-sessio`; un resultat diferent de `true`, un tenant alié al catàleg o un intent de desar en un altre tenant sense esta autoritat dona `sense-permis`. Cap `role`, `aal`, metadada o `personalitzacioOberta` substituïx esta política.

`adminLligPersonalitzacio` exigix tenant explícit. Amb autoritat multipoble activa, també l'exigixen escriptura i historial: `tenantId` o `tenant_id` UUID, normalitzat a minúscules. Si hi són els dos han de coincidir. Absència, null, valor malformat o contradicció rebutgen amb `abast-invalid`; mai reserven al tenant inicial. `adminLlistaPobles` permet absència de selector, però rebutja un selector malformat. Les crides no alteren configuració, sessió ni poble global. `loadCoreContent` sempre llig la personalització del tenant inicial. Sense autoritat multipoble, el ganxo antic `personalitzacioOberta` només pot operar sobre eixe tenant.

El magatzem de personalitzacions és per tenant i clau (`taxonomia`/`estil`); versions i historial no es barregen. `versio: null` o `0` només servix abans de la primera versió, i una versió obsoleta dona `conflicte-versio`. El payload ha de ser JSON finit i pla, sense getters, prototips especials, cicles, valors indefinits ni claus de prototip, fins a 65.536 bytes comptant espais estructurals JSONB; profunditat màxima 32 i 10.000 nodes. Les entrades es copien síncronament abans de la microtasca i abans de consultar la política; només el senyal d'avortament es conserva viu. Ha de ser un `AbortSignal` genuí: es valida i es llig amb l'intrínsec per a no executar getters d'una entrada malformada. Un canvi de sessió (també en el mateix tic), la destrucció o un avortament durant l'autorització impedeixen lliurar dades o iniciar la mutació. Les eixides són còpies. El magatzem és només memòria i es buida amb `destroy()`.

Les proves són `adaptadorLocal.multipoble.test.js`, la conformitat completa amb els 178 casos del kit i les regressions existents d'adaptador, àmbit, host, publicació i transferència. El transport es veta en proves: esta cobertura local no certifica permisos remots, MFA ni Supabase.

## Vincles

- [[00_index]]
