---
type: document
status: esborrany
description: Proposta pendent de consens per aïllar sessions i dades, limitar càrregues i blindar el Model B sense redissenyar la UI.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c1630ab1-a567-4435-b42d-4ebc4db3a853:f256b61b-2f71-48d6-864e-99cdf99c69ed
---
# Pla d’implementació: arquitectura i enxufabilitat

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c1630ab1-a567-4435-b42d-4ebc4db3a853:f256b61b-2f71-48d6-864e-99cdf99c69ed |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T22:55:59.985Z |
| Modificació | 2026-09-23T22:55:59.985Z |
| Propietari | Codex |
| Aprovació humana | Auditoria autoritzada pel prompt; implementació pendent de consens i aprovació. |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesurats reals: no disponibles en esta sessió. Estimats: no calculats; cap xifra presentada com a telemetria real. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-23T23:04:33.983923+00:00: auditoria documental i proposta completades; cap codi de producte modificat.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

**Estat: en elaboració; implementació pendent d’aprovació del Mestre i consens de l’Olivera.** Esta proposta complementa el pla compartit [[260924_0035_pla_implementacio_disseny_claude]] i es basa en [[260924_0055_auditoria_codex]]. Cap bloc següent està aplicat a `src/`.

### Ordre de batalla

| Fase | Fitxers | Resultat exigible |
| --- | --- | --- |
| 1 · sessió/àmbit | sessionService, contexts Mur/Multimèdia/Core | zero payload d’àmbit anterior; última consulta de rol guanya |
| 2 · Frontissa | adaptadors/sollutia, runtimePolicy, host, sanejaConfig | només recursos de catàleg; origen per paper; abort/timeout/DTO |
| 3 · càrregues | supabase/content, notes, NotesDataContext | cap lectura de Notes al Mur; paginació acotada i completa verificable |
| 4 · retenció | GlobalSaveManager, host | cues drenades, promeses completades alliberades |
| 5 · prova de substitució | contracte, tests i portes | adaptador neutral supera contracte sense canviar components |

No s’han de combinar estos canvis amb el redisseny visual en un mateix pas. No cal cap dependència nova. La política de dades i les signatures del port s’introduïxen de manera compatible abans de retirar els camps antics.

### 1. Frontissa: implementació exacta proposada

Fitxer nou intern `src/data/adaptadors/sollutia/creaFrontissa.js`. És una fàbrica per a la composició **de SdP**, no una API exposada al host. La llista d’orígens i els descriptors de recursos provenen de configuració versionada SdP. El catàleg de producció queda buit fins que hi haja una captura real autoritzada i anonimitzada; no invente `/perfil` ni un endpoint del proveïdor.

```js
export class ErrorDades extends Error {
  constructor(code, status = null) {
    super(code);
    this.name = 'ErrorDades';
    this.code = code;
    this.status = status;
  }
}

export function creaFrontissa({ apiOrigin, allowedOrigins, resources, fetchImpl = fetch }) {
  const base = new URL(apiOrigin);
  if (base.protocol !== 'https:' || base.username || base.password ||
      base.pathname !== '/' || base.search || base.hash ||
      !allowedOrigins.includes(base.origin)) throw new ErrorDades('INVALID_ORIGIN');

  const catalog = Object.create(null);
  for (const [name, source] of Object.entries(resources)) {
    if (source.enabled !== true) continue;
    if (!source.captureId || typeof source.decode !== 'function' ||
        typeof source.path !== 'string' || !source.path.startsWith('/') ||
        source.path.startsWith('//') || source.path.includes('\\') ||
        !Array.isArray(source.params) ||
        !Number.isSafeInteger(source.maxBytes) || source.maxBytes <= 0 ||
        !Number.isSafeInteger(source.timeoutMs) || source.timeoutMs <= 0) {
      throw new ErrorDades('INVALID_RESOURCE');
    }
    const target = new URL(source.path, base);
    if (target.origin !== base.origin || target.username || target.password ||
        target.search || target.hash) throw new ErrorDades('INVALID_RESOURCE');
    catalog[name] = Object.freeze({
      url: target.href, decode: source.decode,
      params: Object.freeze([...source.params]),
      maxBytes: source.maxBytes, timeoutMs: source.timeoutMs
    });
  }
  Object.freeze(catalog);

  return async function llig(name, params = {}, { signal } = {}) {
    if (!Object.hasOwn(catalog, name)) throw new ErrorDades('UNKNOWN_RESOURCE');
    const resource = catalog[name];
    const url = new URL(resource.url);
    for (const [key, value] of Object.entries(params)) {
      if (!resource.params.includes(key) ||
          !['string', 'number', 'boolean'].includes(typeof value) ||
          (typeof value === 'number' && !Number.isFinite(value)) ||
          String(value).length > 512) throw new ErrorDades('INVALID_QUERY');
      url.searchParams.set(key, String(value));
    }
    if (url.href.length > 4096) throw new ErrorDades('INVALID_QUERY');
    if (signal?.aborted) throw new ErrorDades('CANCELLED');
    const controller = new AbortController();
    let expired = false;
    let reader;
    let completed = false;
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => { expired = true; controller.abort(); }, resource.timeoutMs);
    try {
      const response = await fetchImpl(url.href, {
        method: 'GET', credentials: 'omit', redirect: 'error',
        headers: { Accept: 'application/json' }, signal: controller.signal
      });
      if (!response.ok) {
        throw new ErrorDades(response.status === 401 ? 'UNAUTHENTICATED'
          : response.status === 403 ? 'FORBIDDEN' : 'UNAVAILABLE', response.status);
      }
      const type = response.headers.get('content-type') || '';
      if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i.test(type)) {
        throw new ErrorDades('INVALID_PAYLOAD');
      }
      const declared = response.headers.get('content-length');
      if (declared && Number(declared) > resource.maxBytes) throw new ErrorDades('PAYLOAD_TOO_LARGE');
      if (!response.body?.getReader) throw new ErrorDades('INVALID_PAYLOAD');
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: true });
      let bytes = 0;
      let text = '';
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > resource.maxBytes) throw new ErrorDades('PAYLOAD_TOO_LARGE');
        text += decoder.decode(part.value, { stream: true });
      }
      text += decoder.decode();
      if (controller.signal.aborted) throw new ErrorDades(expired ? 'TIMEOUT' : 'CANCELLED');
      let dto;
      try { dto = resource.decode(JSON.parse(text)); }
      catch { throw new ErrorDades('INVALID_PAYLOAD'); }
      completed = true;
      return dto;
    } catch (error) {
      if (expired) throw new ErrorDades('TIMEOUT');
      if (signal?.aborted) throw new ErrorDades('CANCELLED');
      if (error instanceof ErrorDades) throw error;
      throw new ErrorDades('UNAVAILABLE');
    } finally {
      if (!completed) {
        controller.abort();
        if (reader) await reader.cancel().catch(() => {});
      }
      reader?.releaseLock();
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }
  };
}
```

Este transport proposat **no envia tokens a Sollutia**. Si el recurs real exigix autenticació, abans cal acordar un token destinat a eixa API i el seu intercanvi/renovació; no reutilitzar cegament el JWT de dades SdP. La proposta no pot convertir un issuer en un endpoint conegut. `client.js` conservarà l’export `llig` delegant en esta fàbrica creada una sola vegada per la composició; es mantenen buides les escriptures permeses.

Traductor de perfil proposat per al contracte de mostra actual; accepta els dos noms ja presents al codi i deixa fora qualsevol camp desconegut. L’ID extern és opac: no es convertix en un `auth.uid` de SdP. La UI de perfil usa `full_name`; el binding final s’ha de fixar amb una prova de consumidor abans d’activar el recurs.

```js
export function decodePerfilV1(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('perfil');
  const id = raw.id ?? raw.uuid;
  const name = raw.display_name ?? raw.name;
  if (typeof id !== 'string' || !id.trim() || id.length > 200 ||
      typeof name !== 'string' || !name.trim() || name.length > 300 ||
      typeof raw.email !== 'string' || raw.email.length > 320) throw new TypeError('perfil');
  return Object.freeze({ id, full_name: name, email: raw.email });
}
```

### 2. Aïllament de dades amb helper React

Fitxer nou `src/app/contexts/useScopedResource.js`. Contracte de `loader`: `(actorId, { ...config, signal }) → Promise<DTO>`. No altera targetes ni CSS. `config` ha de ser un objecte estable, i `scopeKey` conté backendId, tenantId, currentUser.id, actorKey i generacio. La mateixa funció carrega payload del Mur o Multimèdia.

```js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useScopedResource(loader, actorId, scopeKey, config) {
  const token = useMemo(() => ({}), [scopeKey, config]);
  const latest = useRef(0);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ token: null, status: 'loading', payload: null, error: null });
  useEffect(() => {
    const generation = ++latest.current;
    const controller = new AbortController();
    const current = () => !controller.signal.aborted && latest.current === generation;
    setState({ token, status: 'loading', payload: null, error: null });
    void (async () => {
      try {
        const { quanLlest } = await import('../../host.js');
        await quanLlest({ signal: controller.signal });
        if (!current()) return;
        const payload = await loader(actorId, { ...config, signal: controller.signal });
        if (current()) setState({ token, status: 'ready', payload, error: null });
      } catch (error) {
        if (current()) setState({ token, status: 'error', payload: null, error });
      }
    })();
    return () => controller.abort();
  }, [token, loader, actorId, config, tick]);
  const refresh = useCallback(() => setTick(value => value + 1), []);
  return state.token === token ? { ...state, refresh }
    : { token, status: 'loading', payload: null, error: null, refresh };
}
```

Integració al cos dels providers: calcular `JSON.stringify([backendId,tenantId,currentUser?.id,actorKey,generacio])`, passar-lo al helper i usar `state.payload` en el `useMemo` que ja transforma les llistes. Mantindre `sendSectionSubmission`, `refresh` i totes les claus públiques actuals, fins i tot en error. Tant Mur com Multimèdia han de consumir `useSession()`. El helper és una proposta executable; la integració completa als providers s’ha de revisar amb els tests de F1 abans d’aplicar-la. Notes ja té el seu patró equivalent i no requerix substituir-lo ara.

### 3. Rol, política i renovació

En `sessionService.js`, afegir `let roleRequest = 0` a nivell del servei. Al principi de cada `sincronitza()`, capturar `const requestId = ++roleRequest`. En **les dos** branques de resolució del rol usar `if (myGen !== generacio || requestId !== roleRequest) return;`. En `setSessionConfig`, invalidar primer `roleRequest`, incrementar generació si canvia l’àmbit i passar a rol `desconegut` fins a resposta. La clau d’àmbit es deriva de configuració normalitzada i immutable, no del nou objecte React per referència. Capturar config per consulta i impedir que una segona instància canvie la configuració global sense error explícit.

Canvi exacte del guarda de promeses de rol, en les dos branques:

```diff
- if (myGen !== generacio) return;
+ if (myGen !== generacio || requestId !== roleRequest) return;
```

No canviar així altres funcions on `requestId` no estiga declarat. L’epoch de sessió i el requestId tenen funcions diferents: canvi d’identitat i ordre de consulta. Afegir una seqüència de configuració a `setSessionConfig` evita que un `quanLlest()` pendent antic inicie una consulta nova fora del seu torn.

En `auth.js`, al fetch de `renova`, afegir `redirect: 'error'`. Acotar el retry de renovació en errors de xarxa amb backoff, un únic timer i comprovació d’epoch. Al logout o substitució de credencials, invalidar el treball pendent. No ampliar la sessió perquè la xarxa falla; l’estat local ha de reflectir caducitat.

Política proposada: `{ dataOrigin, dataBackendId, auth: { issuer, audiences }, parentOrigins, sollutia: { apiOrigin }, relayOrigins }`, normalitzada, clonada i congelada abans de muntar. Cada paper té llista exacta pròpia; `parentOrigins` no concedeix permís per rebre JWT de dades. `sanejaConfig` pot admetre configuració visual mutable però no reemplaçar `dataOrigin`. No expose claus de servei.

### 4. Retenció: pedaç exacte del mètode write

Substitució completa de `GlobalSaveManager.write` dins de la classe, mantenint la serialització actual:

```js
write(key, transform) {
  const next = (this.writes.get(key) || Promise.resolve())
    .catch(() => {})
    .then(() => this.persist(key, transform));
  this.writes.set(key, next);
  next.finally(() => {
    if (this.writes.get(key) === next) this.writes.delete(key);
  }).catch(() => {});
  return next;
}
```

Esta correcció allibera les promeses; **no** elimina el control de revisions. `knownRevisions` requerix evacuació separada: només claus sense `queues`, `locks` ni `writes`, amb un màxim documentat de claus inactives. El desat ha de comparar sempre la revisió remota; perdre una entrada de cache no autoritza una sobreescriptura cega.

En `host.js`, substituir el retorn de `SocDePobleCua.push` després d’executar les accions:

```diff
- return Array.prototype.push.apply(window.SocDePobleCua, args);
+ return window.SocDePobleCua.length;
```

Afegir test que 1.000 ordres executades deixen la cua buida i que una sessió no queda dins de l’array. Eliminar comentaris que recomanen injectar backend; la API manté la denegació actual.

### 5. Dades i paginació: contractes i migració

Mantindre l’API actual mentre s’introduïxen estos dos mètodes al port intern i als dos adaptadors de prova:

```ts
type NotesPage = {
  notes: NoteSummary[];
  nextCursor: string | null;
  complete: boolean;
};
type NoteSummary = { id: string; title: string; revision: number; updatedAt: string };
// Les propietats restants de la targeta s’afegixen explícitament segons consumidor.
// `content` complet es carrega en resolveNote, amb el DTO Note vigent.
type LoadNotesPage = (input: {
  cursor: string | null;
  limit: number;
  signal?: AbortSignal;
}) => Promise<NotesPage>;
```

`complete` indica final confirmat del recorregut; si hi ha snapshot, el cursor hi queda vinculat. Les metadades poden créixer incrementalment en el provider i el detall es fusiona per ID/revisió. No marcar `notesComplete:true` basant-se només en `rows.length<50` si el servidor pot retallar. El transport necessita exposar metadades de paginació, o un RPC dedicat que retorne cursor/final. El nombre de files i bytes es valida al límit del port. El topall de contingut es negocia abans de fixar números de producció.

Per al Mur, usar una consulta per secció amb cursor, columnes pròpies i autorització remota; llevar `notes` i claus alienes del camí `loadMur`/`loadMultimedia`. Adaptar `loadCoreContent` perquè les pàgines editorials siguen independents de la identitat. No introduir una cache global de payload sense clau de sessió/tenant i cancel·lació.

### Decisions obertes concretes

1. Mantindre l’ADR Model B vigent (Supabase SdP autoritatiu) o acordar una nova ADR de substitució. Recomanació: mantindre B per esta fase i provar substitució amb adaptador neutral intern.
2. Origen exacte de l’API Sollutia, captura real de recursos i procedència dels tokens. No inferir-los de `issuer` ni de dominis presents en comentaris.
3. Política de persistència d’esborranys pendents en dispositius compartits. Recomanació: conservar-los amb gestió explícita; no esborrar-los automàticament en logout.

Estes decisions no impedixen corregir F1, F2, F4 i acotar càrregues després de l’aprovació del pla. No s’ha aplicat cap correcció.


<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

La Frontissa proposada supera 9 escenaris locals: traducció que descarta camps extra, URL desconeguda, paràmetre alié, cancel·lació prèvia, mutació posterior del descriptor, límit real de bytes, DTO malformat, MIME incorrecte i timeout. Els descriptors i endpoints usats són sintètics. Els blocs JS/TS parsegen; la integració React completa continua pendent.

Acceptació després d’implementar:

1. Convertir les 7 sondes forenses de l’auditoria en regressions que esperen el comportament corregit; no mantindre com a èxit reproduir la fallada.
2. Mur/Multimèdia: canvis A→B→A i tenant durant càrrega, logout i canvi d’entitat no mostren dades anteriors ni accepten respostes antigues. Unmount avorta host i transport.
3. Rol: resolucions fora d’ordre i canvi de configuració no restauren permisos antics; errors de renovació es recuperen amb retry limitat.
4. Frontissa: rutes absolutes/protocol relatives, query aliena, payload gran/lent/corromput, redirect i recurs absent fallen abans d’exposar dades. Comprovar que `llig` real crida el traductor.
5. Contracte: executar el mateix conjunt sobre Supabase i adaptador neutral; `configura({backend})` sempre rebutjat; backend congelat després d’arrencar.
6. Càrrega: Notes 0, 20, 50, 51, 1.000 i 10.000; topall de servidor inferior al demanat; insercions/eliminacions entre pàgines; no fals `complete`; zero lectures de Notes en entrar al Mur.
7. Memòria: 1.000 notes desades deixen `writes` i cua del host buits; revisions inactives acotades; esborranys pendents conservats.
8. RLS en entorn de prova: dos usuaris i dos pobles; lectura/escriptura creuada denegada. No donar-la per coberta amb `porta:rls` estàtica.
9. Verificació visual a `http://localhost:3340`: mateixes targetes i editor; estat de càrrega/error coherent. Proves existents, lint dels fitxers tocats i portes aplicables.

Les 82 proves actuals passen abans d’implementar. Hi ha deute preexistent al catàleg de skills i al graf documental; gestionar-lo separadament, sense afluixar les portes per declarar èxit.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Paginació pot afectar cerca i selecció de notes: mantindre resolució per ID i provar enllaços profunds. Canviar el scope dels esborranys requerix migració explícita i reversible, sense barrejar comptes ni perdre pendents. La neteja de revisions no pot afectar claus amb desat actiu. Tallar dominis per paper pot descobrir una dependència real no documentada: capturar contracte i errors abans d’activar trànsit.

El prompt autoritza este document, no la implementació. Les decisions d’origen, autenticació i autoritat de dades s’han d’incloure en l’aprovació del Mestre. Claude ha lliurat [[260924_0055_auditoria_claude]]; llegida i replicada en l’auditoria de Codex. Conservar el contracte de resum de Notes (subtitle, lead, data/hora, etiquetes) i workspaceKey. Consens no presumit.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0055_auditoria_codex]]
- [[260924_0035_pla_implementacio_disseny_claude]]
- [[260924_0045_prompt_arquitectura_codex]]
