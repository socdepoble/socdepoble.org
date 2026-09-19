---
type: document
status: esborrany
description: Pla executable del Bloc B amb quatre intervencions P1, proves d’acceptació i arquitectura del tractor de plantilles.
tags:
  - arquitectura
  - seguretat
---

# Pla d’execució del Bloc B i Acte Reflex

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-BLOCB-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 13:54 |
| Modificació | 26-09-19 13:54 |
| Agent redactor | Codex |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí · contrast de Claude i IAIA |
| Tall revisat | HEAD `22d041e4ae3d68cc60d3235992e3744e8451e015` més l’arbre de treball copiat a les 13:52 |
| Abast d’esta entrega | Auditoria i disseny; cap correcció funcional aplicada |

## Vincles i entrades

- [[00_index_escriptori]]
- [[260919_1326_PROMPT_auditoria_bloc_b]]
- [[260919_1300_estudi_codex_seguretat_sollutia]]
- [[260919_1246_informe_auditoria_extrema_sollutia]]
- [[00_PLANTILLA_PROMPT_CONSELL]]
- [[plantilla_planificacio]]

Les rutes següents són relatives a `socdepoble.org`. Les cites `ruta:línia` descriuen el tall revisat. Els noms etiquetats **nou proposat** són contractes d’implementació, no fitxers existents. Claude i Codex poden llegir el repositori: no cal cap bundle de context.

## Resultat final i criteris d’èxit

Construir quatre correccions estructurals que impedisquen publicar claus privilegiades, ressuscitar sessions tancades, barrejar notes de pobles diferents i perdre el control dels desaments concurrents.

1. Cada correcció té una prova que falla abans del canvi i passa després, executada amb el mòdul real i fixtures sense secrets.
2. Notes, sessió i configuració tenen propietari i cicle de vida explícits; cap resposta tardana pot escriure en un àmbit nou.
3. El lliurament identifica quins errors tanca, quins continuen oberts i quines comprovacions depenen de Sollutia. Compilar i passar el linter no equival a validar la integració.

**Selecció:** quatre problemes arquitectònics, agrupant **set P1** de l’informe: B1/F02; B2/F03–F05; B3/F14; B4/F12–F13. L’agrupació evita corregir per separat peces que compartixen estat. F15 és una dependència de producte del desament i es tracta explícitament, sense donar-la per tancada.

| Ordre | Intervenció | Impacte que evita | Dependència |
| --- | --- | --- | --- |
| B1 | Configuració pública validada abans de compilar | Credencial privilegiada incorporada al JavaScript | Independent |
| B2 | Cicle de vida únic de sessió | Logout desfet, sessió caducada i esperes indefinides | Completar F01 del Bloc A |
| B3 | Àmbit de Notes per backend, actor i poble | Contaminació d’estat i respostes tardanes d’un altre poble | Identitat estable de B2 |
| B4 | Desament serialitzat amb confirmació i conflicte explícits | Overrides permanents i bucle de revisions antigues | B3 |

No trie SEO com una P1 de Codex: F19–F24 són **P2 en l’informe de 31 troballes**. Claude usa una escala diferent en el seu informe. S’han de conservar les dos atribucions, sense mesclar recomptes.

## Condició prèvia: el Bloc A encara no es pot donar per tancat íntegrament

Els canvis existixen, però el recorregut complet necessita correccions o proves addicionals:

| Flux | Estat observat ara | Acció abans de congelar A |
| --- | --- | --- |
| Audiència JWT | `authenticated` en forma de cadena ja s’accepta amb issuer; prova executada | Cobrir també l’array acordat d’audiències i els rebutjos; no relaxar l’issuer |
| Injecció JS directa | `src/host.js:285` continua delegant opcions buides; `src/data/identitat.js:242` les rebutja | Resoldre la configuració efectiva també en la crida directa |
| Issuer de l’atribut al pont | `src/host.js:364` llig `estat().config?.sollutiaIssuer`, però `estat()` a la línia 273 no retorna `config` | Consultar un accessor intern de configuració; no exposar tota la configuració en un objecte de diagnòstic |
| Head i navegació | `src/PedraSecaEmbed.jsx:406` encara tria navegador per defecte; `src/hooks/useSEO.js:16` interpreta `undefined` com a permís | Mode explícit d’embed amb memòria i head desactivat; standalone opta als dos. El nom `root` del pare no acredita propietat del document |
| Avisador | `src/PedraSecaEmbed.jsx:327` passa el punt real; millora correcta per a una instància | Provar muntatge, desmuntatge i dos components: `AvisadorEfimer.jsx:29` manté target i root globals |

La prova de l’issuer absent s’ha executat sobre `adoptaSessioExterna`; la conclusió sobre la crida JS pública combina eixa prova amb la delegació directa de `host.js`. No es presenta com un login real. La correcció del contenidor d’avisos i del head s’ha inspeccionat estàticament; no s’ha repetit una auditoria visual completa del Bloc A.

## B1 · F02: validar la configuració que realment arriba al client

**Evidència actual:** `vite.config.js:9` i `vite.standalone.config.js:9` només inspeccionen `process.env`. La reproducció de build de l’informe anterior usava un JWT fals en `.env.production`; les dos configuracions actuals conserven el mateix defecte.

**Invariant:** qualsevol clau configurada per al client ha de pertànyer als formats públics admesos, tant si prové del mode de Vite com de l’amfitrió. Esta barrera evita errors de distribució; l’autorització de dades continua en RLS.

| Fitxer | Modificació exacta proposada |
| --- | --- |
| `src/config/publicCredentials.js` · **nou proposat** | Exportar `assertPublicSupabaseKey(value, { source })`, funció pura usable en Node i navegador, sense globals DOM ni dependències noves |
| `vite.config.js` | Importar `loadEnv`; substituir l’objecte de `defineConfig` per callback amb `mode`; validar abans de retornar la configuració |
| `vite.standalone.config.js` | Mateix callback i mateixa funció; retirar el detector duplicat de les línies 9–18 |
| `src/PedraSecaEmbed.jsx` i `src/host.js` | Validar configuració per atribut i JS abans d’acceptar-la/arrancar. No convertir un error de clau en fallback silenciós |
| `src/data/supabase/runtime.js` i `src/data/supabase/config.js` | Assegurar que la configuració efectiva dels camins REST i SDK passa pel mateix contracte abans de la primera petició |
| `tooling/gates/tractor-public-config.mjs` · **nou proposat** | Prova de compilació en directori temporal amb entorn sintètic, per als dos targets; comprovació d’artefactes sense mostrar valors de claus |

Esquelet de la modificació en **les dos** configuracions; `__dirname` ja està definit en elles:

```js
export default defineConfig(({ mode }) => {
  const envDir = __dirname;
  const env = loadEnv(mode, envDir, 'VITE_');
  assertPublicSupabaseKey(env.VITE_SUPABASE_ANON_KEY, {
    source: 'VITE_SUPABASE_ANON_KEY',
  });
  return { envDir, /* conservar plugins, àlies i opcions actuals */ };
});
```

El codi és una especificació d’edició, no un patch complet aplicat. `loadEnv` ha de compartir mode i directori amb el build; no bolcar el seu objecte sencer a `define` ni carregar secrets sense prefix. Vite documenta esta API i la càrrega per mode. [API oficial de Vite](https://vite.dev/guide/api-javascript#loadenv).

Contracte del validador: admetre clau pública `sb_publishable_…` no buida o JWT legacy ben format amb `role === 'anon'`; rebutjar `sb_secret_…`, `service_role`, qualsevol altre rol i cadenes malformades. Un valor absent pot compilar una llibreria configurada en runtime; el mode remot ha d’exigir la parella URL/clau abans d’usar-la. El parser de JWT no acredita la signatura. El servidor valida la credencial. [Formats i privilegis de les claus Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

**Proves d’acceptació:** `.env`, `.env.local`, `.env.production`, `.env.production.local`, mode personalitzat i precedència de l’entorn del procés; sentinels privilegiats rebutjats en web i IIFE; claus públiques acceptades; absència de clau per a configuració diferida; atribut/JS privilegiat rebutjat abans de fetch. Escanejar els artefactes generats, incloent mapes de fonts si n’hi ha, i provar que el sentinel prohibit no es distribueix. No imprimir-lo en logs d’error.

## B2 · F03–F05: una sessió amb generació, renovació i termini

**Evidència actual:** `src/data/supabase/auth.js:8–39` deduplica globalment sense invalidació; logout a la línia 149 espera Realtime abans d’esborrar; `src/host.js:290` elimina storage però no invalida renovacions. `SessionContext.jsx:45–63` no rearma el timer del mateix usuari. `runtime.js:64–65` espera una renovació sense senyal i reinicia el pressupost amb una crida recursiva.

**Invariant:** una resposta només pot guardar sessió si pertany a la generació d’identitat vigent i al backend que la va originar. Logout/injecció nova guanyen sobre qualsevol resposta antiga, incloses les respostes d’error.

| Fitxer | Modificació exacta proposada |
| --- | --- |
| `src/data/sessionLifecycle.js` · **nou proposat** | Propietari únic de `generation`, backend actiu i operació de renovació; API `capture()`, `isCurrent(ticket)`, `invalidate(reason)` i subscripció a canvis |
| `src/data/identitat.js` | Separar reemplaçament d’identitat i renovació condicional; `commitRefresh(ticket, session)` retorna resultat només després de comprovar generació i persistència |
| `src/data/supabase/auth.js` | Substituir `renovacioEnCurs` per una entrada lligada a backend+generació; invalidar i netejar estat immediatament en logout, abans del primer `await`; el tancament de Realtime queda com a neteja posterior |
| `src/host.js`, `src/data/oauthRelay.js` | Fer passar expulsió, injecció i retorn OAuth pel mateix cicle; un resultat d’entrada tardà tampoc pot sobreescriure una identitat nova |
| `src/app/contexts/SessionContext.jsx` | Programador que rearma explícitament després de cada comprovació i cada canvi d’expiració; distingir error transitori d’autenticació invalidada |
| `src/data/supabase/runtime.js` | Un únic deadline per petició, espera de renovació, reintent i lectura del cos; un sol reintent 401; neteja de timers i listeners en `finally` |
| `src/data/supabase/config.js`, `src/data/supabase/realtime.js`, `src/data/supabase/xat.js` | Aplicar l’expiració/generació també al client SDK i canals; no assumir que passen per `request()` |

La sessió continua sent única per document en este Bloc B: `src/data/supabase/config.js:26–34` ja rebutja backends simultanis diferents. No convertir esta correcció en una promesa de multiidentitat independent per component.

Algorisme de renovació:

```text
ticket := { backendId, generation } capturat abans de la petició
entry := renovació compartida només entre peticions d’eixe ticket
resposta := fetch de renovació amb AbortController i termini propi finit
si ticket ja no és vigent: retornar stale, sense guardar ni expulsar ningú
si credencial revocada: invalidar només la generació que encara és vigent
si error temporal: conservar la identitat; marcar sessió degradada i reintentar amb límit
si resposta vàlida i persistida: publicar token+expiració i notificar
finally: netejar l’entrada només si continua sent esta mateixa entry
```

**Cancel·lació compartida:** cancel·lar una petició consumidora no ha de cancel·lar la renovació que encara necessita una altra. Cada consumidor deixa d’esperar al seu deadline; l’operació compartida té controller/termini propis i s’avorta en invalidar la generació. Cap token caducat es presenta com a permís per a una mutació. No usar un `false` indistint per a xarxa, revocació i resultat obsolet.

**Proves d’acceptació:** refresh pendent → logout → resposta 200; mateixa seqüència amb 400/401 antic i sessió nova; injecció B mentre A renova; 401 concurrent amb un consumidor avortat; refresh que mai resol; temps total limitat sense reiniciar-lo en reintentar; dos cicles d’expiració del mateix usuari; despertar de pestanya; xarxa perduda i recuperada; el xat SDK rep el token renovat. Cap prova necessita tokens reals.

## B3 · F14: l’àmbit de Notes és part de la identitat de les dades

**Evidència actual:** `NotesDataContext.jsx:38–57` conserva qualsevol fila absent com a `localOnly`; a la línia 127 compara captures del mateix render. `NotesContext.jsx:59–76` usa la clau global `sdp_notes_drafts`; `GlobalSaveManager.js:5–7` indexa cues, panys i revisions només per ID de nota.

**Invariant:** `scope = backendId + actorKey + tenantId`; mai s’ha de mesclar estat entre scopes. BackendId és un identificador estable i no secret, derivat de l’adaptador/projecte, no de l’adreça en memòria de l’objecte `config` ni del JWT.

| Fitxer | Modificació exacta proposada |
| --- | --- |
| `src/sections/notes/notesScope.js` · **nou proposat** | Construcció canònica de scope i claus, sense concatenacions amb separadors ambigus ni credencials |
| `src/app/App.jsx` · al voltant dels providers de la línia 426 | Donar al límit de Notes una `key` derivada del scope; un canvi de poble amb el mateix actor també crea estat nou |
| `src/sections/notes/NotesDataContext.jsx` | Estat sempre etiquetat amb scope; càrrega, creació i actualització capturen generació i la comproven després de cada `await`; retorn `stale` identificable quan deixa de ser vigent |
| `src/sections/notes/GlobalSaveManager.js` | Substituir singleton universal per gestor propietat del límit de Notes i del seu scope; tancar l’àmbit en logout/canvi de poble |
| `src/sections/notes/NotesContext.jsx` | Cache i esborranys per scope; no carregar automàticament esborranys legacy sense procedència demostrable |

Un remuntatge per si sol no buida el singleton ni protegix el storage. Calen les tres peces: límit visual, propietat del gestor i namespace de persistència. Una petició ja enviada pot haver-se confirmat en A; avortar el client no desfà el servidor. El resultat mai entra en B, i l’estat desconegut d’A es reconcilia en tornar-hi.

Retirar la fusió general de `localOnly`. Conservar creacions només amb registre explícit `{id, scope, confirmedAt, observedInList}`. Si deixen d’aparéixer, revalidar-les per ID amb límit temporal; no inferir eliminació a partir d’un llistat limitat a 50. Una vegada observades, deixen de ser pendents. Els esborranys preexistents sense scope es conserven per recuperació controlada; no s’adjudiquen a l’usuari actual ni s’esborren.

**Proves d’acceptació:** A→B i B→A amb mateix actor; canvi de backend/actor; resposta de load/create/update d’A després del canvi; promesa guardada per un consumidor antic; ID de nota coincident en dos scopes; esborranys legacy; remuntatge sense canvi de scope; dues instàncies dins de la limitació d’un backend/sessió per document. Comprovar estat visible, cues i persistència, no sols el nombre de renders.

## B4 · F12–F13: transacció de desament i resolució de conflictes

**Evidència actual:** `NotesContext.jsx:117–124` passa `setLocalNoteField`, mentre `GlobalSaveManager.js:53` espera un setter funcional. A `GlobalSaveManager.js:11` la revisió en memòria guanya sempre; un 409 només mostra un avís. El refetch de `NotesDataContext.jsx:98` no sincronitza eixe mapa.

**Invariant:** el servidor és la base autoritativa; un esborrany guarda canvis locals amb seqüència, mai una segona revisió autoritativa. Una confirmació retira només l’edició exacta enviada. Un conflicte preserva el text i para el desament d’eixa nota fins a reconciliar-lo.

| Fitxer | Modificació exacta proposada |
| --- | --- |
| `src/sections/notes/GlobalSaveManager.js` | Gestor per scope amb entrada per nota `{base, draft, inFlight, queued, conflict}`; un únic propietari de la revisió. Llevar `knownRevisions` com a font independent i eliminar setters React/storage de la seua API |
| `src/sections/notes/NotesContext.jsx` | Subscriure’s al gestor i projectar base+draft; totes les edicions passen per `editField`; retirar `revision` dels overrides |
| `src/sections/notes/NotesDataContext.jsx` | Publicar la fila confirmada al gestor/estat amb comprovació de scope; cap refetch desacoblat que pretenga resoldre un conflicte |
| `src/data/supabase/notes.js` | En cas de PATCH sense files, llegir la fila accessible actual, no només `id`, i adjuntar-la a l’error de conflicte; mantindre tenant i RLS. Si no és accessible: conservar el draft i informar sense inventar existència |
| `src/sections/notes/NotesEditor.jsx` | Mostrar pendent/desant/desat/error/conflicte a partir de l’estat real; resolució accessible amb els components existents de Pedra Seca |
| `src/components/universal/richText/useUniversalRichText.js` | Connectar `flush` amb el buidatge real del gestor; evitar dos debounces consecutius en eixir |

API proposada del gestor, a implementar i validar amb els consumidors:

```text
editField(noteId, field, rawValue) -> editSequence
save(noteId) -> saved | conflict | error | stale
acknowledge({ scope, noteId, mutationId, savedNote, sentFieldSequences })
resolveConflict(noteId, choices, remoteRevision) -> resultat de nou CAS
flush(noteId?) -> Promise<resultats>     // també espera el que ja està en vol
dispose(reason)                        // invalida treball, conserva pendents segons política
```

**Confirmació segura:** normalitzar el valor en entrar al gestor, capturar seqüència per camp i snapshot enviat. En rebre la fila, actualitzar la base autoritativa i llevar únicament camps amb la mateixa seqüència. La comparació de valors, tota sola, no cobrix A→B→A mentre hi ha una petició en vol. L’esborrany que queda i el seu estat persistent han de concordar; un error de persistència es fa visible.

**Conflicte:** conservar base enviada, draft actual i fila remota. Camps on remot==base poden conservar la proposta local sense xoc; on local==base, usar remot; on local==remot, convergència. Si els dos han canviat un camp de manera diferent, demanar una elecció sobre eixe camp. Tractar HTML com un camp indivisible en esta primera versió; no fer merges textuals que trenquen el document. No unir arrays amb una regla inventada.

En resoldre, enviar un PATCH condicionat a la revisió remota mostrada. Si arriba un altre 409, tornar a conflicte amb la nova fila, sense bucles ni sobreescriptura automàtica. Una fallada de xarxa després d’un possible commit exigeix reconciliar abans de reenviar. La resta de notes pot continuar desant-se.

**Proves d’acceptació:** confirmació lleva l’override en UI i storage; edició posterior a la petició es conserva; sanitització que canvia el text; A→B→A local; diversos camps i cues; dues escriptures serialitzades; 409 amb camps disjunts; mateix camp HTML; segon conflicte després d’elecció; timeout amb commit remot; pèrdua de permís; cancel·lació per canvi de scope. «Torna a provar» ha de fer una acció efectiva i mai tornar a enviar indefinidament la revisió 2 quan el servidor és en 3.

### F15: límit del desament en tancar la pestanya

`pagehide` no pot garantir una transacció remota completada. B4 pot llevar el debounce del `flush`, esperar desaments en navegació controlada i recuperar/reencuar drafts identificats després d’una recàrrega. Això no garantix conservar-los després de tancar la pestanya si continuen en `sessionStorage`.

**Decisió de producte pendent:** persistència de recuperació entre sessions sí/no i política de privacitat/retenció. Si es vol conservar-la, especificar un magatzem asíncron de drafts per scope, sense tokens, amb versió de format, recuperació visible i neteja segura. Seria un diari de recuperació, no un backend offline. La regla local contra escriptures síncrones de més de 10 KB impedix usar `localStorage` com a substitució massiva. No tanque F15 fins a provar tancament, reobertura, xarxa absent i storage denegat amb el contracte acordat.

## Destil·lació de les 31 troballes

Esta taula assigna una destinació; **cap fila marcada B implica que ja estiga corregida**.

| ID | Prioritat original | Destí i condició de tancament |
| --- | --- | --- |
| F01 | P1 | Completar A: issuer efectiu en JS/atribut/pont i fixtures JWT |
| F02 | P1 | B1: config efectiva i artefacte |
| F03 | P1 | B2: renovacions consecutives |
| F04 | P1 | B2: invalidació guanya respostes tardanes |
| F05 | P1 | B2: deadline total i errors recuperables |
| F06 | P1 | Completar A: memòria/head per defecte d’embed i prova host |
| F07 | P1 | Revalidar A: target visible, lifecycle i instàncies |
| F08 | P2 | Lot UI: portal de `PageFrame` dins de l’àmbit, focus, Escape i semàntica |
| F09 | P1 | Següent correcció obligatòria: storage getter protegit, quota i sessió parcial; no donar suport d’iframe per validat abans |
| F10 | P1 | Següent correcció de port: backend custom complet o rebuig explícit; bloqueja entrega amb port custom |
| F11 | P2 | Amb F10: respectar override de classe derivada |
| F12 | P1 | B4: confirmació exacta dels camps |
| F13 | P1 | B4: CAS i reconciliació de conflictes |
| F14 | P1 | B3: scope i generacions de Notes |
| F15 | P1 | Dependència B4 amb decisió de retenció; pendent fins a provar recuperació |
| F16 | P2 | Publicació idempotent amb clau estable i resultat parcial; refresh del Mur |
| F17 | P2 | Payload d’organització complet, validat des del botó fins a RPC |
| F18 | P2 | Xat: finestra recent i cursor d’historial; prova amb més de 200 missatges |
| F19 | P2 | Lot SEO: rutes públiques que no passen per `/jo` |
| F20 | P2 | Lot SEO: metadata derivada del router i política explícita de head |
| F21 | P2 | HTML inicial/prerender públic, sitemap i HTTP 404; verificar en allotjament final |
| F22 | P2 | Constructor únic de rutes i estat del router de memòria |
| F23 | P2 | Detall per ID i paginació; no dependre del primer lot de 50 |
| F24 | P2 | Visibilitat pública acordada i prova RLS en entorn; no obrir polítiques a cegues |
| F25 | P2 | Proves de contracte negatives i controls no executats explícits |
| F26 | P2 | Alinear Node del CI amb engines del lockfile, després provar `npm ci` |
| F27 | P2 | Guia real d’artefacte, migracions, configuració i smoke |
| F28 | P2 | Tractor: `open → seal` amb contracte únic de bootstrap |
| F29 | P3 | Acció real de carpetes o estat de disponibilitat acordat |
| F30 | P3 | Autor de Notes des del context vigent i asset real |
| F31 | P3 | Lifecycle/destroy del port executable, amb prova de neteja |

F09 es deixa fora de les quatre intervencions per mantindre-les revisables, no perquè siga innocu. F10 és condicional al port custom. Les dos són condicions d’entrega dels fluxos afectats. B no equival a un GO global.

### Lot SEO posterior, amb disseny concret

Modificar `src/config/navigation.js`, `src/app/contexts/RouterContext.jsx`, `src/hooks/useSEO.js` i el muntatge de rutes en `src/app/App.jsx` perquè compartisquen descriptors de ruta amb visibilitat, URL canònica i metadades. El pathname prové del router actiu, resolt amb basename, i no de `window.location` dins de cada component. Un únic coordinador gestiona el head del standalone amb defaults deterministes. L’embed publica descriptors cap a l’amfitrió només si el contracte ho demana. Mantindre `/jo` privat; no suprimir globalment `noindex`. La visibilitat pública de F24 precedix qualsevol indexació de publicacions.

## Meta-auditoria: per què l’Acte Reflex actual no obliga de veritat

Hi ha infraestructura útil. El defecte principal és que els seus contractes no coincidixen. Afegir una altra skill amb «SEMPRE» no resol estes desconnexions.

| Troballa | Evidència local | Conseqüència |
| --- | --- | --- |
| Dues cadenes de rebuts incompatibles | `tooling/brain/reflex_plantilles.mjs:74` escriu `estat/ts/sha256`; `.agents/hooks/verify.mjs:70` busca `tipus: matrix.rebut`, `t`, `peticio_sha256` i `fonts` | El preflight pot imprimir la plantilla i la porta continuar denegant; reproduït |
| Primera invocació saltada | `.agents/hooks/preflight_matrix_wrapper.mjs:14` exigix `invocationNum === 1` | Amb `0` retorna `injectSteps: []`; reproduït amb payload sintètic |
| Rebut global reutilitzable | `.agents/hooks/verify.mjs:247` accepta l’últim rebut recent, sense vincular torn, destí, hash vigent o contingut resultant | Un rebut alié amb zero fonts autoritza un Markdown sense frontmatter; reproduït |
| Shell fora del control documental | `.agents/hooks/verify.mjs:109` retorna allow per prefix abans del control de document | `node tooling/brain/crear_document.mjs …` queda permés sense la mateixa validació; reproduït sense executar l’escriptura |
| Contracte postgeneració vell | `tooling/brain/verifica_plantilla.mjs:18` només coneix plantilla ISO antiga i acta; llegix `.agents/reflex` | Rebutja la plantilla vigent per falta de contracte; reproduït |
| Fonts normatives discrepants | `tooling/wiki/schema.json:9`, `entropia_zero_router.mjs:73`, skill guardia i guia d’auditoria | JSON Schema només declara `description` obligatòria, però el validador executiu exigix tipus/estat. No són equivalents |
| Regles de contingut sense un únic vocabulari | `00_PLANTILLA_PROMPT_CONSELL.md:36` diu nou claus i enumera tipus macro/micro absents de l’enum actual | Una lectura literal pot produir un document que la màquina rebutja |
| Bootstrap contradictori | `tooling/wiki/reflex_petorreta.mjs:690` copia plantilla; línia 744 exigix només dos fitxers | F28 continua present en el codi |
| Càrrega de bytes confundida amb context | `tooling/brain/matrix.mjs:204` llig fonts i emet hashes; no emet els seus textos sencers | «ready» acredita lectura del procés, no que el model haja rebut/entés cada font |

**Precisió verificada:** el validador executiu sí que rebutja un document sense tipus/estat. Una hipòtesi inicial basada només en `schema.required` ha quedat refutada pel diagnòstic. El problema és la divergència entre contractes, no un buit universal del validador.

La configuració actual de `PreInvocation` també usa un nivell `hooks` anidat. La documentació d’Antigravity mostra una llista directa de handlers per a este esdeveniment i enumera la primera invocació com a 0. Cal ajustar l’adaptador i comprovar-lo en la versió instal·lada; no s’ha demostrat en viu si eixa versió tolera la forma antiga. [Contracte oficial dels hooks d’Antigravity](https://antigravity.google/docs/hooks?tab=ide).

## Tractor proposat: preparar, validar i promoure

**Garantia realista:** podem obligar el camí controlat a carregar una plantilla vigent i impedir que accepte un fitxer invàlid. No podem provar «comprensió» del model amb un hash ni impedir tots els bypassos si l’agent conserva escriptura directa sobre el mateix disc i sobre les seues regles.

```text
petició + tipus d’artefacte + destí
    → prepare: resol contracte, emet plantilla sencera i rebut de tasca
    → generació en espai temporal de la tasca
    → validate: YAML, estructura, semàntica bàsica, noms, vincles i hashes
    → promote: comprova preimatge i escriu de manera atòmica
    → postvalidació i ancoratge
    → CI obligatori valida els bytes que s’integraran
```

### Una única font executable

Crear **`tooling/brain/templateContracts.json` (nou proposat)** com a registre de tipus d’artefacte → plantilla, versió, estructura de seccions i perfil de validació. Referenciar `tooling/wiki/schema.json` per al YAML; no duplicar-ne les propietats al registre. El router d’intencions ajuda a triar, però `artifactType` i el destí resolt governen la validació. Les paraules d’un prompt no són una frontera d’autorització.

Per a documents nous, adoptar `type`, `status`, `description`. Definir una migració separada per al llegat `tipus/estat`: acceptació compatible només quan no hi haja contradiccions, amb diagnòstic explícit. No reescriure tota la Wiki com a efecte lateral d’una tasca nova. Mantindre el límit de tags i els enums exactes en el perfil executable, i generar/contrastar les instruccions de plantilla contra ell.

**Modificar, no acumular:** convertir `classificador_tasques.mjs` en lector del registre; fer que `matrix.mjs` i `reflex_plantilles.mjs` usen una mateixa funció de preparació; actualitzar `verifica_plantilla.mjs` amb el mateix contracte; `crear_document.mjs` esdevé l’escriptor validat i deixa d’inserir un esquelet genèric amb placeholders. Es poden mantindre entrades CLI compatibles mentre els seus consumidors migren, però no dos motors de decisió.

### Rebut vinculat i verificació del resultat

Rebut proposat: `schemaVersion`, `repositoryId`, `sessionId`, `taskId`, `artifactType`, `targetPath`, `templatePath`, `templateSha256`, `contractSha256`, `schemaSha256`, `preimageSha256`, `issuedAt`, `expiresAt` i identificador d’ús únic. No afegir eixos camps al frontmatter documental; són metadades del procés.

La plantilla sencera ha d’arribar a la resposta d’eina/context, junt amb el rebut. Si és massa gran o l’eina la trunca, carregar-la per fragments verificables abans de generar. Un canvi de plantilla, schema o destí invalida la preparació; un canvi concurrent del fitxer de destí fa fallar la promoció. Lligar rebut i validació al hash del contingut final, i consumir-lo només després de verificar l’efecte.

La validació analitza el frontmatter i l’estructura Markdown, ignorant exemples dins de blocs de codi: no buscar cadenes amb `includes`. Detecta placeholders, estats contradictoris, entrades que s’autociten i vincles exigits. Tipus desconegut, plantilla absent/deprecated, error de parseig o lectura són resultats fallits explícits. Les correccions mecàniques poden proposar-se en temporal; cap formatador canvia silenciosament la intenció.

Per a l’ancoratge, validar document i índex abans d’escriure, registrar preimatges i recuperar una promoció interrompuda. Un `rename` és atòmic per fitxer, no per a la parella document+índex. No prometre una transacció multiarxiu sense diari i recuperació comprovada.

Reutilitzar les primitives de scope, preimatge i consum de `reflex_petorreta.mjs` quan corresponga. Corregir F28 llevant la còpia automàtica de plantilla del bootstrap: la plantilla canònica es llig i es referencia pel hash, mentre el directori conserva exactament prompt+manifest. No relaxar `assertBootstrapPair` a «qualsevol fitxer extra».

### Adaptadors per editor, amb proves de contracte

| Entorn | Integració proposada |
| --- | --- |
| Antigravity | Ajustar `.agents/hooks.json` i `preflight_matrix_wrapper.mjs`: handlers directes en `PreInvocation`, detecció de tasca/torn nou i recepció completa de plantilla. `PreToolUse` usa el validador comú; `PostToolUse` comprova el resultat |
| Cursor | **`.cursor/hooks.json` nou proposat**, perquè no existix en este repositori. Adaptador propi per a `sessionStart`/`preToolUse`/`afterFileEdit` segons la versió instal·lada; JSON d’entrada/eixida diferent del d’Antigravity |
| Codex i agents sense hook verificat | `AGENTS.md` encamina a una única skill i a la CLI de preparació/escriptura. La selecció implícita de skills és ajuda de descobriment, no una barrera de fitxers |
| Qualsevol editor/terminal | CI valida el resultat amb el mateix motor; protecció de branca i check requerit perquè el bypass local no permeta integrar fitxers invàlids |

Cursor documenta `preToolUse` per a qualsevol eina i eixida `permission`; els codis d’error genèrics poden deixar continuar l’acció. Cal retornar denegació explícita i provar errors, timeouts i JSON malformat. `afterFileEdit` detecta després d’escriure: no substituïx una barrera prèvia. [Hooks oficials de Cursor](https://cursor.com/docs/hooks).

OpenAI documenta la invocació implícita de skills com una política configurable. La nostra inferència arquitectònica és que esta política no acredita l’execució d’un validador abans de cada escriptura. [OpenAI Docs: metadades i invocació de skills](https://learn.chatgpt.com/docs/build-skills#optional-metadata).

**Skill proposada:** actualitzar `.agents/skills/skill-acte-reflex/SKILL.md` perquè faça únicament l’encaminament: identificar artefacte, cridar prepare, llegir l’eixida, generar temporal, validar i promoure. Llevar contradiccions i duplicacions amb `skill-guardia-frontmatter`; aquesta passa a referenciar el contracte executable. No crear un tercer cervell ni una nova skill universal sobre qualsevol conversa. No declarar que una skill preval sobre les instruccions explícites de l’usuari o sobre els permisos de l’entorn.

**Límit d’imposició local:** la llista blanca actual de shell no és suficient. Els hooks han de cobrir les eines d’edició reals i els consumidors CLI. Si es vol impedir físicament tota escriptura documental directa, cal donar a l’agent accés d’escriptura només a staging i reservar la promoció a un escriptor amb permisos separats. Si l’editor no permet eixa separació, la garantia és detecció i bloqueig d’integració per CI; no «cap fitxer invàlid pot tocar el disc». Tampoc hi ha prova que la protecció de branca estiga activada: s’ha de verificar en integrar el tractor.

### Proves que han de congelar el tractor

1. Peticions equivalents en valencià/castellà, sense la paraula literal «prompt», trien el tipus correcte o requerixen una classificació explícita.
2. Primera invocació, torn nou, represa i compactació: la tasca continua vinculada a la plantilla vigent; no es reutilitza el rebut d’una altra.
3. Cap rebut, caducat, replay, destí canviat, hash modificat, zero fonts o preimatge concurrent: no es promou res.
4. Plantilla vigent vàlida passa; legacy contradictòria, claus extra, YAML malformat, placeholder i headings només dins d’un exemple fallen.
5. Creació per eina, reemplaçament parcial, shell i CLI comuna: mateixa política. On no hi haja hook, CI detecta la mateixa infracció.
6. Dos agents preparen documents simultanis: rebuts i temporals separats; índex modificat concurrentment provoca rebase controlat.
7. `open → seal → claim → validació → escriptura → complete → consume` funciona sense llevar fitxers manualment ni falsejar rebuts.
8. El validador falla → la sessió informa error; no retorna «zero incidències». CI comprova un arbre net/final, no barrejat amb canvis locals.

## Seqüència de treball i revisió de Claude

Estimacions d’esforç, no terminis compromesos; inclouen implementació i proves locals, exclouen esperes de Sollutia:

| Fase | Lliurable | Estimació |
| --- | --- | --- |
| Preparació | Fixar tall; reproduccions; acord de sessió/issuer i política de drafts | 0,5–1 jornada |
| Producció B1 | Validador compartit i dos builds negatius | 0,5–1 jornada |
| Producció B2 | Generació, renovació, deadline i SDK | 1–2 jornades |
| Producció B3 | Scope únic, canvi atòmic i estat tardà | 1–1,5 jornades |
| Producció B4 | Confirmació per seqüència i resolució CAS | 1,5–3 jornades |
| Tractor documental | Motor comú, migració de consumidors i adaptadors provats | 1,5–3 jornades separades del codi de producte |
| QA | Regressió i smoke en amfitrió acordat | 0,5–1 jornada després de cada conjunt integrable |
| Publicació | Guia/artefacte amb hash i comprovacions d’entorn | Només després del criteri d’entrega |

**Ordre recomanat:** completar el contracte d’A; B1 → B2 → B3 → B4. La reparació del tractor té lliurable propi. No condicionar un fix de sessió a una migració documental massiva.

Claude ha de refutar o confirmar per intervenció: API proposada, tots els consumidors reals, prova negativa, risc de migració i compatibilitat amb el backend. Resultat esperat: «acceptat per implementar», «canvi requerit» o «incògnita d’entorn», amb `ruta:línia`. **Congelar un disseny no certifica una implementació.** El codi només es congela després de les regressions i de la prova del flux afectat.

La revisió ha de comprovar particularment: cancel·lació compartida de B2, gestor per scope de B3 que no reté callbacks desmuntats, tractament de seqüències/camps de B4 i impossibilitat del tractor de confondre un rebut amb comprensió. No hi ha revisió de Claude executada per este document ni missatge enviat a tercers.

## Riscos i alternatives examinades

| Risc | Resposta prevista |
| --- | --- |
| Sollutia entrega una forma de sessió o capacitat diferent | Fixture acordada i adaptador explícit; no inventar compatibilitat ni relaxar RLS |
| Notes legacy sense scope o base per a un merge | Conservar-les amb procedència desconeguda i recuperar-les de manera explícita; no esborrar ni publicar automàticament |
| Hooks no suportats/desactivats en una versió concreta | Prova d’adaptador en l’editor i detecció CI; anunciar la garantia limitada fins que la barrera real estiga activa |

Alternatives descartades: canviar només el callback de F12 deixa F13/F14 i les carreres de confirmació; invalidar només `knownRevisions` i reintentar pot sobreescriure treball alié; multiplicar regles en prompts manté l’oblit probabilístic; exigir un hash en el text sense validar el resultat només prova que s’ha copiat una cadena. Tampoc es justifica afegir un framework d’estat nou o migrar de backend per a resoldre estos defectes.

Manteniment a sis mesos: contractes petits prop del seu domini, funcions pures per a claus/scope/reconciliació, una font de revisió per nota i proves de transicions observables. UI de conflictes amb el catàleg i tokens de Pedra Seca, sense nous patrons visuals ad hoc.

## Evidència d’esta sessió i límits

- Relectura de l’informe complet per seccions, codi dels quatre blocs i cadena local d’Acte Reflex.
- En una còpia temporal del codi actual, **9 proves en 5 fitxers passen**: confirmen set escenaris defectuosos de notes/sessió/deadline i dos controls del Bloc A: l’audiència `authenticated` admesa amb issuer i l’issuer absent rebutjat. Són diagnòstics: passar no significa que els errors s’hagen corregit.
- **6 comprovacions mecàniques** del tractor amb dades sintètiques: cinc confirmen les desconnexions descrites i una confirma que el validador executiu sí que rebutja tipus/estat absents.
- Evidència temporal: `/private/tmp/sdp-bloc-b-260919-ww6aziwc`; fixtures i resultats són locals, sense secrets ni contacte amb Sollutia.
- No s’ha repetit el build sintètic de F02 ni la suite completa, ni s’han fet login real, desplegament, migracions o certificació RLS. L’anàlisi de F02 combina la reproducció prèvia amb el mateix detector actual.
- Frontmatter de l’escriptori amb el pla: validació estricta superada. També es comproven explícitament `type`, `status`, `description`, nom i ancoratge del nou document.
- Tancament executat en còpia temporal, incloent els 122 Markdown del graf operatiu que recorre el verificador i els mirrors sincronitzats: **15 orfes abans, 14 després; cap nou orfe**. L’ancoratge de la petorreta d’entrada resol una incidència prèvia. Els 14 restants no s’han alterat ni silenciat. La primera còpia parcial excloïa documents de producció i donava 10→9; eixe recompte queda substituït pel complet 15→14.
- `npm run porta` en còpia temporal: Psicopatia, 58px, importacions i linter passen; lint amb 0 errors i 319 avisos. La cadena s’atura al build perquè la còpia de proves no inclou `public/auth/callback.html`. És una comprovació incompleta de l’entorn temporal, no una regressió atribuïda al projecte ni una cadena global superada.
- 367 empremtes de fonts de `src/` i `tooling/` sense canvis respecte del tall. Les úniques edicions autoritatives d’esta entrega són el pla, l’índex, ESTAT i una entrada afegida al LEDGER. No s’han fet commits ni publicacions.

**Ancoratge de Seguretat:** [[00_index_escriptori]]
