---
type: informe
status: esborrany
description: Auditoria local de Sollutia, lectura abans de mutar, taxonomia i ancoratge documental, amb pegats pendents.
tags:
  - sollutia
  - govern
---

# Auditoria Sollutia i cognició — Codex

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260920-0530 |
| Data de revisió | 20 de setembre de 2026 |
| Agent redactor | Codex, amb tres revisions paral·leles de backend, cognició i taxonomia |
| Estat | Informe lliurat; propostes pendents d'implementar i provar |
| Aprovació de l'encàrrec | Autoritzada pel prompt del Mestre |
| Aprovació dels pegats | No es pressuposa aprovació d'aplicació o desplegament |
| Modalitat | Inspecció local; proves en memòria; cap accés de xarxa |
| Efectes d’esta auditoria | Cap modificació del codi ni dels documents existents; només este informe separat. Canvis concurrents registrats a C2. |

## Vincles

- [[00_index_escriptori]]
- [[260920_0500_PLA_IMPLEMENTACIO_MATRIX]]
- [[.agents/skills/skill-documentacio-i-reflex/SKILL|Acte reflex]]
- [[.agents/skills/skill-cicle-de-vida/SKILL|Cicle de vida]]

## Dictamen i abast

Els dos primers destins existixen al vault. Les rutes de skills són relatives a l'arrel del repositori i requerixen que el graf incloga `.agents`, com ja pretén el Teixidor; Obsidian obert exclusivament sobre `_wiki_de_poble` no les incorpora automàticament. En importar este informe al vault, la IAIA ha d'afegir també l'enllaç entrant des de l'índex actiu, en la mateixa operació. L'artefacte lliurat fora del vault no declara que això ja s'haja fet. [tooling/wiki/teixidor.mjs:43–45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/teixidor.mjs:43>)

La causa de l'incompliment cognitiu és arquitectònica: els camins d'escriptura no estan tots sotmesos a un control extern i els rebuts actuals no acrediten que el host haja incorporat els procediments a la petició del model. Afegir advertiments més contundents a les skills manté aquesta dependència de l'atenció. Les evidències i la proposta de mediació completa figuren en l'auditoria II.

El backend té una base modular aprofitable, però presenta fallades de sessió, continuïtat de càrrega i finestra de missatges. L'auditoria I concreta les prioritats. No he demostrat una fuita transversal de notes amb la cadena SQL local completa; tampoc puc certificar el servidor desplegat.

He llegit íntegrament el pla Matrix actiu. El pla tracta classificació, streams, metadades, resolutors, catàleg, doctrines i panys. No conté la frontera externa d'escriptura descrita ací. Cal ampliar-lo, no donar eixa frontera per resolta amb els pegats ja previstos. [_wiki_de_poble/04_escriptori/260920_0500_PLA_IMPLEMENTACIO_MATRIX.md:17–78](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260920_0500_PLA_IMPLEMENTACIO_MATRIX.md:17>)

La font d'esta auditoria és l'arbre local, que ja tenia canvis pendents. La secció C2 s'ha actualitzat després de detectar dues contencions concurrents al final de la revisió. Les cites corresponen a les versions llegides durant la sessió; cal revalidar-les si la IAIA modifica estos fitxers en paral·lel. No s'ha executat build, npm gate, codemods, neteges, regeneració de baselines ni migracions. La prohibició explícita de web preval sobre la frase del prompt que suggerix consultar Rentonar i socdepoble.net. Pedra Seca s'interpreta com el sistema de disseny.

Els blocs següents són text extractible, no canvis aplicats. Els noms nous s'identifiquen com a proposta. Una comprovació local es marca com a reproduïda; una deducció de control de flux, com a inspecció estàtica. No es presenta cap pegat com a provat en producció.

## Auditoria I — Sollutia, Supabase i degradació

### S1 · P1 · Una renovació antiga pot tancar la sessió nova

`renovaAra` espera la renovació sense capturar `generacio`. Si A inicia una renovació, entra B i la resposta antiga retorna `false`, el consumidor crida `logout` sobre B. La invalidació de l'adaptador no basta si el consumidor interpreta qualsevol resultat antic com una ordre de tancament. [src/data/sessionService.js:35–55](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js:35>) [src/data/sessionService.js:86–101](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js:86>)

Reproducció local amb `sessionService` i `backendPort` reals, backend sintètic i promesa controlada: després d'entrar B i resoldre la renovació d'A, resultat `{"logouts":1,"usuariFinal":null}`. No s'ha fet cap petició de xarxa.

Cal comprovar la generació després de l'espera i abans d'aplicar efectes. A més, l'època de l'adaptador ha d'invalidar-se quan s'adopta una sessió nova: el login per contrasenya desa la sessió sense incrementar `sessioEpoch`, mentre que logout sí que l'incrementa. Protegir només el consumidor no impedix que una resposta antiga sobreescriga les credencials dins de l'adaptador. [src/data/supabase/auth.js:8–41](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:8>) [src/data/supabase/auth.js:123–131](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:123>) [src/data/supabase/auth.js:157](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:157>)

### S2 · P1 · Una interrupció de xarxa es transforma en expulsió

L'adaptador retorna `false` tant per error de xarxa com per altres renovacions fallides. El servei converteix qualsevol `false` o excepció en logout. Com que es renova abans de caducar el JWT, una interrupció breu pot eliminar credencials encara vàlides. [src/data/supabase/auth.js:19–41](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:19>) [src/data/sessionService.js:86–126](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js:86>) [src/data/identitat.js:197–198](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/identitat.js:197>)

[PROPOSTA] Contracte conjunt: `true` per renovació completada; `false` només per absència o revocació confirmada de credencials; errors transitoris com a errors explícits, sense esborrar la sessió; resultat obsolet distingit d'una revocació. Un JWT expirat continua sense autoritzar escriptures encara que es conserve el refresh token per recuperar la connexió.

Fragment de substitució de `renovaAra`, supeditat a corregir simultàniament eixe contracte en l'adaptador. Resol la cursa del consumidor i ajorna errors transitoris; no resol per si sol la persistència d'una resposta antiga, ni crea un estat visual de reconnexió:

```js
export async function renovaAra() {
  const myGen = generacio;
  try {
    const ok = teCapacitat('sessio')
      && await refrescaSessio(currentConfig);
    if (myGen !== generacio) return;
    if (!ok) {
      generacio++;
      await logout();
    }
  } catch (error) {
    if (myGen !== generacio) return;
    console.warn('Renovació ajornada:', error);
    clearTimeout(temporitzador);
    temporitzador = setTimeout(() => { void renovaAra(); }, 30_000);
  }
}
```

Este fragment és una base mínima, no el contracte final: cal evitar reintents de configuració invàlida i afegir espera creixent amb límit, reinici en reconnectar i cancel·lació en eixir. Una prova ha de cobrir també A → eixir → tornar a entrar com A, perquè comparar només l'identificador d'usuari no identifica una sessió nova.

### S3 · P2 · El timeout de renovació no inclou el cos HTTP

El temporitzador s'elimina quan `fetch` retorna capçaleres, abans d'esperar `response.json`. Si el cos queda penjat, `renovacioEnCurs` pot bloquejar també les renovacions següents. Reproducció local del cos de la funció amb fetch i rellotge falsos: `{"bodyPendent":true,"timerCleared":true}`. [src/data/supabase/auth.js:20–47](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:20>)

El pegat ha d'abastar fetch, lectura del cos i comprovació d'època dins del mateix `try/finally`, eliminant el `.finally` aplicat només a fetch. Les peticions REST de `runtime.request` ja mantenen el timeout fins després de `response.json`; no és una troballa pendent allí. [src/data/supabase/runtime.js:47–87](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:47>)

### S4 · P1 · El fil de xat amb més de 200 missatges amaga els recents

L'RPC ordena ascendentment i limita a 200: torna el principi de l'historial. El client demana sempre 200 i cada càrrega substituïx els missatges confirmats pels rebuts. Això fa desaparèixer de la vista el missatge 201 després del sondeig, encara que estiga desat al servidor. És un defecte deduït del SQL i del consumidor, no una prova contra una BD desplegada. [supabase/migrations/260908_xat_v2_correccions.sql:270–304](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_xat_v2_correccions.sql:270>) [src/data/supabase/xat.js:72–89](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/xat.js:72>) [src/sections/xat/XatContext.jsx:189–218](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/XatContext.jsx:189>)

Fragment SQL proposat per substituir únicament el `return query` de l'RPC, conservant els controls de participació, `search_path` i grants que l'envolten. Si la migració ja està desplegada, s'ha d'introduir amb una migració nova; editar l'històric no actualitza la BD:

```sql
return query
  select recent.id, recent.usuari_id, recent.autor_nom,
         recent.cos, recent.es_ia, recent.creat_al
  from (
    select m.id, m.usuari_id,
           coalesce(pr.full_name, 'Veí')::text as autor_nom,
           m.text as cos, m.es_ia, m.creat_al
    from public.xat_missatges m
    left join public.profiles pr on pr.id = m.usuari_id
    where m.fil_id = p_fil_id
    order by m.creat_al desc, m.id desc
    limit greatest(1, least(coalesce(p_limit, 200), 500))
  ) recent
  order by recent.creat_al asc, recent.id asc;
```

Això dona la finestra recent en ordre cronològic, amb desempat estable per id. La navegació d'historial antic necessita paginació addicional; no queda resolta augmentant el límit.

### S5 · P2 · Notes deixa un rebuig asíncron sense gestionar

El catch relança `ReferenceError`, però `load()` s'invoca sense esperar ni capturar la promesa. L'estat pot quedar en `loading`. El límit React existent rep errors de render; eixa promesa rebutjada no s'hi convertix automàticament. [src/sections/notes/NotesDataContext.jsx:102–119](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:102>) [src/components/ErrorBoundary.jsx:3–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/ErrorBoundary.jsx:3>)

Substitució del catch existent, reutilitzant l'estat d'error i les variables reals. Afegix la comprovació de generació també en error. No cal inventar una ruta React ni una dependència nova:

```js
} catch (error) {
  if (!active || myGen !== loadGen.current
      || error?.name === 'AbortError') return;
  console.error('[NotesDataContext] Error carregant dades:', error);
  setData(prev => prev.scopeKey === scopeKey
    ? { status: 'error', error, payload: null, scopeKey }
    : prev);
}
```

La recuperació prevista ha de permetre reintentar la càrrega. El fallback `BUIT` actual deixa `refresh` buit i `updateNote` resol sense fer res; el comentari diu que les accions fallen explícitament, però eixa acció no ho fa. Cal retornar el callback de reintent real també fora de `ready` i rebutjar les mutacions quan no estan disponibles. [src/sections/notes/NotesDataContext.jsx:12–21](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:12>) [src/sections/notes/NotesDataContext.jsx:121–131](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:121>)

### S6 · P2 · Canviar el JWT elimina les subscripcions Realtime

Renovar crida `resetClient`; el reset elimina canals. També s'executa per l'esdeveniment general d'autenticació. L'efecte de xat depén d'usuari/fil i callbacks, de manera que renovar el mateix usuari no obliga a reconstruir canals. [src/data/supabase/auth.js:33–37](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:33>) [src/data/supabase/config.js:9–13](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/config.js:9>) [src/data/supabase/config.js:48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/config.js:48>) [src/sections/xat/XatContext.jsx:250–358](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/XatContext.jsx:250>)

[PROPOSTA] Separar canvi d'identitat, renovació de credencial i canvi de perfil. Conservar el propietari de les subscripcions i actualitzar-ne l'autenticació, o publicar una generació de client que faça resubscriure explícitament. Simplement crear un altre client no recupera els canals eliminats.

L'impacte desplegat queda condicionat: el mateix xat declara el sondeig com a mecanisme garantit i Realtime com a accelerador, perquè la publicació pot no estar habilitada. No afirme que producció haja perdut notificacions; sí que el cicle de vida de canals queda trencat en el cas descrit. [src/sections/xat/XatContext.jsx:21–28](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/XatContext.jsx:21>)

### S7 · P2 · El contingut de pàgines remotes s'ignora en Core

`loadCoreContent` consulta només `towns,agents` i retorna `seed.pages` també en mode remot. El mapejador sí que sap llegir `pages`, i el provider genera el text de pàgines a partir del resultat rebut. Una actualització de pàgines en Supabase no arriba per este camí. [src/data/supabase/content.js:68–74](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/content.js:68>) [src/data/supabase/runtime.js:100–111](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:100>) [src/app/contexts/CoreContentContext.jsx:48–57](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/CoreContentContext.jsx:48>)

[PROPOSTA] Incloure `pages` en la consulta i retornar `base.pages` en mode remot. La política local més recent ja inclou `pages` entre les claus públiques. El contingut de demostració ha de quedar explícitament en mode seed; una resposta buida remota no ha d'inventar contingut actualitzat. [supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:72–83](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:72>)

### S8 · P3 · El teardown d'un adaptador de classe s'ignora

El port recorre prototips per validar el contracte, però busca `destroy` només sobre la instància. Una classe amb `destroy()` al prototip passa la validació i perd el teardown. Reproduït amb el port real i una classe sintètica: `destroyed=0`. No s'ha localitzat cap consumidor intern actual que demostre una fuga de recursos en producció. [src/data/backendPort.js:18–51](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:18>)

Fragment de reemplaçament del lookup de teardown; cal conservar la validació de descriptor i el bind existents:

```js
let teardownOwner = impl;
let teardown;
while (teardownOwner && teardownOwner !== Object.prototype) {
  teardown = Object.getOwnPropertyDescriptor(teardownOwner, 'destroy');
  if (teardown) break;
  teardownOwner = Object.getPrototypeOf(teardownOwner);
}
```

### RLS: resultat acotat i comprovacions necessàries

S'ha executat `node tooling/gates/tractor-rls.mjs`: exit 0, 16 fitxers SQL. El missatge «zero forats» és més ampli que la garantia: el script analitza text SQL local, no consulta polítiques desplegades ni executa proves d'autorització. [tooling/gates/tractor-rls.mjs:95–164](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-rls.mjs:95>) [tooling/gates/tractor-rls.mjs:169–236](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-rls.mjs:169>)

No s'ha de denunciar l'antiga política permissiva d'`app_content` com una obertura efectiva ignorant la migració restrictiva posterior. La migració de blindatge limita `app_content`, restringix el bucket privat per ruta pròpia i revoca l'accés anònim a notes. La seua capçalera diu «PROPOSTA»: existència al repositori i execució real són fets diferents. [supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:1–2](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:1>) [supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:21–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:21>) [supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:72–105](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql:72>)

La RLS s'aplica al servidor. Un filtre de tenant o usuari al frontend ajuda a demanar dades, però no acredita autorització. En degradació local, la política és de separació de memòria/cau i de bloqueig d'operacions: no pot reconstruir una autorització remota que no s'ha comprovat. El provider de Notes ja separa el payload per scope; s'ha de conservar eixa propietat. [src/sections/notes/NotesDataContext.jsx:24–46](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:24>)

[PROPOSTA] Matriu de verificació en una instància de proves autoritzada: anònim, usuari A, usuari B del mateix poble, usuari d'un altre poble, sessió expirada i rol administratiu; cadascun sobre lectura/escriptura de notes, adjunts privats, contingut públic i participació en xat. Incloure INSERT, UPDATE amb canvi de propietari/tenant i DELETE. Verificar `pg_policies`, grants, bucket públic/privat i ordre real de migracions. No s'ha executat esta matriu en l'encàrrec sense xarxa.

S'ha descartat expressament una sospita: Storage sí que rep les capçaleres globals del client en l'SDK instal·lat i preserva Authorization explícit. No es denuncia «Storage sempre envia anon». [node_modules/@supabase/supabase-js/src/SupabaseClient.ts:406–410](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/@supabase/supabase-js/src/SupabaseClient.ts:406>) [node_modules/@supabase/supabase-js/src/lib/fetch.ts:90–94](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/@supabase/supabase-js/src/lib/fetch.ts:90>)

### Contracte de degradació proposat

El port ja valida el nucli i evita capacitats parcialment implementades. Mantindre eixa frontera és preferible a importar Supabase des de cada component. [src/data/backendPort.js:18–44](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:18>)

| Situació | Comportament que ha de veure l'usuari |
| --- | --- |
| Sense configuració | Closca navegable i error de configuració acotat al servei afectat |
| Timeout, desconnexió o 5xx | Estat de reconnexió, reintent limitat; cap logout automàtic per xarxa |
| JWT expirat | Escriptures deshabilitades fins a renovació vàlida |
| 401 després de renovar | Sessió requerida; no transformar-ho en dades seed |
| 403/RLS | Accés denegat; cap fallback que mostre dades d'un altre scope |
| Resposta vàlida buida | Estat buit real, distingible d'un error |
| Última lectura coneguda | Només del mateix scope i amb antiguitat visible; invalidar en canvi d'identitat, poble o permisos |
| Mutació amb resultat desconegut | Mostrar pendent de confirmació; reconciliar abans de repetir-la |
| Capacitat opcional absent | Secció indisponible sense tombar tot el portal |

Açò és compatible amb una font de veritat online. No requerix simular èxit d'escriptura ni implantar una rèplica local. Els esborranys existents han de mantindre l'estat pendent fins a confirmació remota. La política «100% online» de la constitució no justifica que el portal quede penjat davant un error. [.agents/AGENTS.md:42–43](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:42>)

## Auditoria II — Tractors cognitius, taxonomia i graf

### C1 · P1 · Els hooks no són una frontera completa d'escriptura

El matcher enumera eines antigues concretes. Una eina no interceptada no arriba a `decide`, encara que `decide` denegue noms desconeguts quan sí que els rep. Dins del verificador, el rebut Matrix només s'exigix per a `.md` sota la Wiki; altres destins conformes poden arribar a `allow` sense rebut. [.agents/hooks.json:10–20](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks.json:10>) [.agents/hooks/verify.mjs:15–28](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:15>) [.agents/hooks/verify.mjs:61–72](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:61>)

No s'ha acreditat la instal·lació efectiva d'estos hooks en el host. El mateix doctor comprova que falte `AGENTS.md` a l'arrel perquè l'autodescobriment no queda garantit. Que `.agents/AGENTS.md` diga que es carrega sempre no és prova que el runtime ho faça. [.agents/AGENTS.md:8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:8>) [tooling/wiki/reflex_petorreta.mjs:1420–1429](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_petorreta.mjs:1420>)

### C2 · P1 · Camins de mutació directes; dues contencions ja observades

La primera lectura va trobar `prepare/promote` escrivint sense reclamar autorització i `applyAuditPlanLocked` exportada, cosa que permetia evitar el wrapper de rebut i pany. En la relectura final, el diff local mostra dos canvis concurrents: `prepararDocument` i `promoureDocument` llancen una excepció abans de qualsevol efecte, i `applyAuditPlanLocked` ja no s'exporta. Estes dues entrades concretes queden contingudes en l'estat final observat; no s'han de presentar com a encara explotables. [tooling/wiki/reflex_document.mjs:11–12](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_document.mjs:11>) [tooling/wiki/reflex_document.mjs:66–67](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_document.mjs:66>) [tooling/wiki/core/autoneteja_audit.mjs:393–425](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/autoneteja_audit.mjs:393>)

Ni l'agent principal ni els tres revisors d'esta auditoria han aplicat eixos canvis. L'autoria del procés concurrent no s'ha verificat. El HEAD local de referència al tancament és `5ad62b43fcd43a9e98309e507a35aeb1b496cd02`; els dos canvis apareixen en el working tree, no es pressuposen desplegats.

El codi antic de promoció continua davall de les excepcions: el hash opcional comprova l'esborrany, no la preimatge del destí, i l'escriptura no incorpora el broker. No s'ha de tornar a habilitar llevant només el throw. [tooling/wiki/reflex_document.mjs:68–88](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_document.mjs:68>)

El problema general continua obert: el generador `crear_document` calcula el destí des de CWD i executa mkdir/writeFile directament. Declara que el document està ancorat, però només escriu una frase amb enllaços eixints; no actualitza l'índex entrant ni valida una secció Vincles. No s'ha executat este mutador. [tooling/brain/crear_document.mjs:12–14](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/crear_document.mjs:12>) [tooling/brain/crear_document.mjs:25–42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/crear_document.mjs:25>)

La retirada de l'exportació és una contenció limitada. El bloqueig de prepare/promote interromp funcionalitat fins que hi haja un camí autoritzat; no és la implementació d'eixe camí. Els efectes finals han de passar per l'executor separat de C6. Afegir un hash al mateix script no substituïx confinament, permisos ni autorització.

### C3 · P1 · Els rebuts no acrediten recepció ni operació concreta

Matrix obté la identitat del torn d'un transcript indicat pel payload i desa un JSON recomputable. No el vincula a una eina, arguments, destí, contingut final o consum únic. Qui puga escriure eixos fitxers amb la mateixa identitat OS pot autoexpedir-se el rebut; el hash servix per detectar deriva accidental, no per separar autoritats. [tooling/brain/context_documental.mjs:81–123](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/context_documental.mjs:81>)

El wrapper declara correctament que emetre bytes al pipe no prova recepció o comprensió. A més, omet la preparació quan `invocationNum` no és 1. Cal un contracte real amb el host, no confiar que eixe camp sempre tindrà el valor correcte. [.agents/hooks/preflight_matrix_wrapper.mjs:5–22](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/preflight_matrix_wrapper.mjs:5>)

El camí `open --json` de Reflex elimina `content` de `ruleTexts`. És possible obtindre les metadades de sessió sense rebre els textos. Eixa càrrega només considera AGENTS i PROTOCOL, no totes les skills aplicables. [tooling/wiki/reflex_petorreta.mjs:518–522](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_petorreta.mjs:518>) [tooling/wiki/reflex_petorreta.mjs:1566–1572](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_petorreta.mjs:1566>)

Pegat de coherència d'eixida: dins de la branca JSON, conservar el resultat complet. Millora el lliurament del text; no s'ha de vendre com a prova de lectura:

```js
const printable = result;
console.log(JSON.stringify(printable, null, 2));
```

### C4 · P1 · Un preflight incomplet anuncia que està llest

El mòdul que es presenta com a bootloader extern té funcions que retornen registre, skills, dependències i evidència JIT buits. Usa el hash de BOOTSTRAP com a digest de corpus, però retorna `ready: true`. No s'ha localitzat un consumidor actiu en les àrees examinades; és una garantia falsa preparada per ser reutilitzada, no prova que tot el sistema actual execute eixe mòdul. [tooling/wiki/lib/context_preflight.mjs:19–53](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/context_preflight.mjs:19>) [tooling/wiki/lib/context_preflight.mjs:74–128](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/context_preflight.mjs:74>)

[PROPOSTA] Eliminar l'estat llest fins que les fases estiguen implementades. Un registre buit no equival a «cap skill necessària»: ha de distingir explícitament absència legítima, ruta desconeguda i implementació pendent. No duplicar un segon router; completar una única resolució canònica i retornar també el contingut lliurat.

### C5 · P1 · Els hooks de commit no executen la garantia documentada

El pre-commit executa gate, lint i tests, però no vincula la revisió al contingut staged mitjançant Reflex. El post-commit només té comentaris. El doctor busca marcadors textuals; una línia comentada pot satisfer-los. No afirme que el doctor global estiga verd: només que eixa comprovació no prova execució. [.husky/pre-commit:1–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.husky/pre-commit:1>) [.husky/post-commit:1–3](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.husky/post-commit:1>) [tooling/wiki/reflex_petorreta.mjs:84–91](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_petorreta.mjs:84>) [tooling/wiki/reflex_petorreta.mjs:1431–1442](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/reflex_petorreta.mjs:1431>)

Els hooks Git són una defensa de procés, no una frontera contra un agent amb permisos sobre Git. La garantia de publicació necessita validació obligatòria externa sobre l'arbre exacte, amb política remota no modificable pel productor. L'estat de la protecció de branca remota és una incògnita.

### C6 · P1 · La solució dura és un executor separat amb mediació completa

[PROPOSTA ARQUITECTÒNICA NOVA; no existeix completa al codi auditat.]

1. El model treballa amb una còpia de lectura i un espai de proposta. No té credencials ni permisos d'escriptura sobre el repositori viu, Git, polítiques, claus, rebuts o sistemes externs. Tampoc pot recuperar eixos permisos amb una altra eina o procés.
2. Un broker sota una identitat diferent és l'únic executor. El seu codi, política i estat no són editables pel model. Totes les mutacions passen per ell: escriure, moure, eliminar, canviar permisos, commit, BD i publicació.
3. A partir de l'operació i els destins, el broker resol determinísticament procediments, esquema i plantilla vigents. Les paraules del prompt poden orientar, però no reduir el conjunt obligatori. Sense ruta inequívoca, no hi ha escriptura.
4. El host incorpora els textos complets a la petició concreta del model i confirma el digest dels bytes efectivament inclosos. El rebut és del host, no una declaració del model ni un stdout buit de contingut.
5. El model retorna una proposta. El broker construeix un manifest canònic amb sessió/torn autenticats, operació, destins, modes, hashes de preimatges i bytes finals, hash de política i de totes les lectures. Una autorització existent prou àmplia pot servir; quan cal aprovació addicional, es demana sobre eixe diff concret.
6. La capacitat d'execució queda vinculada al digest del manifest, amb caducitat i ús únic en estat privat del broker. Canviar el text d'una skill, plantilla, política, proposta o destí obliga a revalidar. Un hash públic per si sol no és una autorització.
7. Sota pany, el broker comprova de nou les preimatges i els camins reals, rebutja alias de fitxer insegurs i executa. Cal impedir la cursa entre validació de camí i escriptura, no limitar-se a fer `realpath` una vegada.
8. Una operació document + índex valida el graf proposat complet. Per a múltiples fitxers, no basta un `rename` per fitxer per afirmar atomicitat conjunta: cal snapshot publicable o diari durable amb recuperació definida.
9. Les proves de resultat i la CI són l'última barrera. No substituïxen el lliurament previ del context ni l'autorització.

La garantia màxima verificable és «el host ha inclòs estes fonts vigents i el resultat satisfà estos invariants». Cap hash, nonce o test pot demostrar atenció o comprensió del model. Per això les regles importants han de convertir-se en comprovacions del resultat i del permís, amb proves negatives.

[SUPÒSIT D'INTEGRACIÓ] El host de la IAIA permet separar permisos i interceptar tots els efectes. Cal verificar-ho. Si no ho permet, la via dura és fer-la productora de propostes amb el repositori viu muntat només lectura i executar-les des d'un procés extern controlat. Una llista addicional de matchers sota el mateix usuari no equival a eixa separació.

### C7 · P2 · El detector de contradiccions no cobreix l'arbre actual

El motor només admet quatre noms antics de pilar. El cens de directoris actuals dona `00_raw, 01_ser, 02_saber, 03_actuar, 04_escriptori, 10_actes`; la intersecció amb les jurisdiccions suportades és buida. Després filtra els documents fora d'eixes jurisdiccions i, si no troba parelles, anuncia absència de contradiccions. No s'ha executat l'escaneig complet: s'ha verificat la intersecció en memòria. [tooling/wiki/contradiction_engine.mjs:52–73](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/contradiction_engine.mjs:52>) [tooling/wiki/contradiction_engine.mjs:95–129](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/contradiction_engine.mjs:95>) [tooling/wiki/contradiction_engine.mjs:174–176](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/contradiction_engine.mjs:174>)

A més, la similitud de Jaccard de frases detecta coincidència lèxica, no contradicció lògica. «Cal esborrar» i «està prohibit esborrar» poden ser molt semblants; dues normes incompatibles poden usar vocabularis diferents. El resultat s'ha d'anomenar candidat a duplicat, no «contradicció real». [tooling/wiki/contradiction_engine.mjs:37–49](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/contradiction_engine.mjs:37>)

[PROPOSTA] Compartir el manifest d'abast dels auditors, informar de documents elegibles i fallar si la cobertura esperada és zero. Per a normes operatives, mantindre identificador, abast, condició, obligació/prohibició, prioritat i prova. El validador pot detectar regles incompatibles en una mateixa operació; l'anàlisi de prosa continua sent revisió assistida, mai garantia de «zero contradiccions».

### C8 · Contradiccions comprovades i resolució proposada

| Contradicció | Evidència | Resolució proposada |
| --- | --- | --- |
| Títol d'1–6 paraules contra acta de 8–20 i categories majúscules | [.agents/AGENTS.md:20–21](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:20>); [_wiki_de_poble/03_actuar/plantilles/plantilla_acta_unica.md:8–10](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_acta_unica.md:8>) | Un nom curt canònic; títol complet descriptiu al cos. Generar instruccions de nom des del mateix contracte. |
| «Nou claus» contra 15 declarades; tipus macro/micro documentats però no admesos | [_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:34–69](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:34>); [tooling/wiki/schema.json:9–140](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:9>) | Separar categoria del nom i type del document; no ampliar l'enum per encobrir instruccions desfasades. |
| Schema exigix només description, però tractor imposa també parelles type/tipus i status/estat | [tooling/wiki/schema.json:9–11](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:9>); [tooling/wiki/tractor-frontmatter.mjs:319–336](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:319>) | Tria canònica proposada: type/status/description obligatoris; aliases legacy només durant migració explícita. Actualitzar tots els consumidors abans del tall. |
| Supremacia de l'usuari contra skill que diu que l'esquema està per damunt de qualsevol ordre humana | [.agents/skills/skill-guardia-frontmatter/SKILL.md:13–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-guardia-frontmatter/SKILL.md:13>) | Distingir canvi de política autoritzat i operació ordinària. Una skill no pot autoatribuir-se autoritat sobre el propietari; el broker sí ha de fer complir la política vigent fins a canviar-la pel canal previst. |
| Autoritat exclusiva en .agents contra protocol seleccionat pel router que encara governa des de 03_govern i camps antics | [.agents/AGENTS.md:17–18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:17>); [.agents/protocolledge.json:20–25](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/protocolledge.json:20>); [_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:12–33](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:12>) | El router només ha d'apuntar a procediments vigents amb dependències resoltes. La informació històrica no ha de circular com a instrucció executable. |
| Prohibició de destruir sense preguntar contra «esborra sense pietat» i actes de 2–3 setmanes | [.agents/AGENTS.md:29–30](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:29>); [.agents/skills/skill-cicle-de-vida/SKILL.md:70–76](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md:70>) | Destil·lació amb evidència i arxiu reversible; cap esborrat deduït de l'antiguitat o de la suposada absorció del model. |
| Conservar documents actius contra neteja total i Somiador que mou per extensió | [.agents/AGENTS.md:55–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/AGENTS.md:55>); [.agents/skills/skill-cicle-de-vida/SKILL.md:110–111](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md:110>); [tooling/brain/somiador.mjs:18–46](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/somiador.mjs:18>) | Arxivar només un manifest explícit d'elements tancats. No moure una auditoria activa perquè siga .md. |
| «No pujar el deute» contra neteja que acaba recalculant baseline | [tooling/wiki/tractor-frontmatter.mjs:396–402](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:396>); [tooling/brain/somiador.mjs:52–63](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/somiador.mjs:52>) | Separar verificació i aprovació de baseline. El productor no ha de poder normalitzar el defecte que acaba d'introduir. |
| turn_id i rebut ok promesos però no produïts per les eines | [.agents/skills/skill-cicle-de-vida/SKILL.md:37–62](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md:37>); [tooling/gates/obrir_torn.mjs:17–48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/obrir_torn.mjs:17>); [tooling/gates/tancament.mjs:13–34](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:13>) | Implementar el contracte verificable o retirar la promesa; tancament usa valid, no l'ok anunciat. |
| Quota temporal de models escrita com a procediment canònic | [.agents/skills/skill-consell-i-colmena/SKILL.md:47–57](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-consell-i-colmena/SKILL.md:47>) | Traure percentatges i dates volàtils de la skill; posar-los en estat amb font i hora de consulta. No s'han tractat com a dades actuals. |
| Memòria única en actes contra destrucció de les actes absorbides | [.agents/skills/skill-memoria-historica/SKILL.md:42–48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-memoria-historica/SKILL.md:42>); [.agents/skills/skill-cicle-de-vida/SKILL.md:75–76](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-cicle-de-vida/SKILL.md:75>) | Conservar procedència i evidència; una conclusió entra al procediment només amb prova, abast i data. |

F5 és un cas especialment revelador: el tractor penalitza `core=true` perquè és l'únic valor observat en set documents. Però absència de core i core=true tenen significats diferents, i Matrix usa eixe booleà per carregar skills. Llevar-lo per «entropia zero» canviaria el comportament. La distribució dels valors presents no mesura el valor operatiu d'un camp. F5 ha de ser diagnòstic de revisió, no motiu automàtic d'eliminació. [tooling/wiki/tractor-frontmatter.mjs:339–343](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:339>) [tooling/wiki/tractor-frontmatter.mjs:372–378](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:372>) [tooling/brain/context_documental.mjs:64–72](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/context_documental.mjs:64>)

### C9 · Taxonomia: cens real i decisió per cada etiqueta

El cens de frontmatter, sense comptar exemples YAML dins de blocs de codi, dona 217 Markdown, 31 etiquetes diferents i 18 ocurrències de tags fora de l'enum en 9 documents. És el corpus examinat pel tractor, no 217 documents necessàriament operatius: l'abast actual també captura restes en `.brain-trash` i `.wiki-safety`, tal com mostra la comprovació estricta. El recorregut exclou dependències, Git, l'arxiu històric i quarantena segons la configuració. [tooling/wiki/frontmatter-abast.json:1–12](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/frontmatter-abast.json:1>) [tooling/wiki/tractor-frontmatter.mjs:153–190](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:153>)

Inventari complet dels 18 documents de la carpeta de plantilles; 16 són `type: plantilla`:

| Document | Tags del frontmatter real |
| --- | --- |
| [_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:1–10](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:1>) | govern, saber |
| [_wiki_de_poble/03_actuar/plantilles/01_PLANTILLA_PROMPT_INTERN.md:1–10](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/01_PLANTILLA_PROMPT_INTERN.md:1>) | govern, saber |
| [_wiki_de_poble/03_actuar/plantilles/02_PLANTILLA_MACRO_PROMPT.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/02_PLANTILLA_MACRO_PROMPT.md:1>) | govern, saber |
| [_wiki_de_poble/03_actuar/plantilles/03_PLANTILLA_MICRO_PROMPT.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/03_PLANTILLA_MICRO_PROMPT.md:1>) | govern, saber |
| [_wiki_de_poble/03_actuar/plantilles/04_PLANTILLA_MACRO_BUNDLE.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/04_PLANTILLA_MACRO_BUNDLE.md:1>) | govern, saber |
| [_wiki_de_poble/03_actuar/plantilles/05_PLANTILLA_MICRO_BUNDLE.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/05_PLANTILLA_MICRO_BUNDLE.md:1>) | govern, saber |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_acta_unica.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_acta_unica.md:1>) | maquina |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_brainstorming.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_brainstorming.md:1>) | maquina |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_branding.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_branding.md:1>) | maquina |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_doc_to_app.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_doc_to_app.md:1>) | maquina |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_estudi_ia.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_estudi_ia.md:1>) | maquina |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_modo_produccion.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_modo_produccion.md:1>) | maquina |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_planificacio.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_planificacio.md:1>) | maquina |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_creador_skills.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_creador_skills.md:1>) | maquina, skills |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_skill_agent.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_skill_agent.md:1>) | maquina, skills |
| [_wiki_de_poble/03_actuar/plantilles/plantilla_skill_trellat.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/plantilla_skill_trellat.md:1>) | maquina, skills |
| [_wiki_de_poble/03_actuar/plantilles/00_plantilles.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/00_plantilles.md:1>) | maquina; és un índex |
| [_wiki_de_poble/03_actuar/plantilles/00_SGQ_PLANTILLES.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/00_SGQ_PLANTILLES.md:1>) | Sense tags; és un document |

Totals: govern×6, saber×6, maquina×11 i skills×3. Sobre les 16 plantilles estrictes, maquina×10. Hi ha també una plantilla fora d'esta carpeta amb `plantilla` i `pla`, ambdós fora de l'enum: cal incloure-la en la migració, no limitar-la a una ruta. [_wiki_de_poble/04_escriptori/00_PLANTILLA_PLA_IMPLEMENTACIO.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/00_PLANTILLA_PLA_IMPLEMENTACIO.md:1>)

La redundància Marmota és real: una acta usa `marmota` i una altra `acta-marmota`, totes dues ja són `type: acta`. La segona també declara `status: validat`, valor absent de l'esquema. El router dispara per la paraula marmota del text, no per un filtre d'etiquetes; eliminar el tag redundant no obliga a eliminar eixe disparador. [_wiki_de_poble/10_actes/260919_1945_ACTA_MARMOTA_Fusion_Sidebar.md:1–7](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/10_actes/260919_1945_ACTA_MARMOTA_Fusion_Sidebar.md:1>) [_wiki_de_poble/10_actes/260920_0430_SUPER_ACTA_MARMOTA.md:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/10_actes/260920_0430_SUPER_ACTA_MARMOTA.md:1>) [.agents/protocolledge.json:28–31](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/protocolledge.json:28>) [tooling/wiki/schema.json:31–41](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:31>)

[PROPOSTA] Taxonomia inicial de set dominis: `arquitectura`, `disseny`, `govern`, `identitat`, `legal`, `seguretat`, `sollutia`. Tags opcionals, màxim dos. Han de respondre a una consulta transversal concreta, no duplicar el tipus, la ubicació o l'estat. «Òptima» no és una propietat demostrable sense observar les consultes del Mestre: esta és una proposta mínima amb utilitat definida i revisable.

| Tag admés actualment | Documents del cens | Decisió i utilitat |
| --- | ---: | --- |
| arquitectura | 6 | Conservar: trobar decisions i evidència sobre estructura tècnica entre informes, plans i protocols. |
| disseny | 9 | Conservar: recuperar UI, accessibilitat i identitat visual independentment del tipus documental. |
| govern | 21 | Conservar: recuperar autoritat, procediments i decisions normatives. |
| identitat | 19 | Conservar: recuperar missió i criteris humans del projecte. |
| legal | 3 | Conservar: trobar documentació jurídica quan el tema siga eixe; no inferir-la pel simple ús de paraules com llei. |
| seguretat | 3 | Conservar: trobar controls de risc, permisos i recuperació transversalment. |
| sollutia | 5 | Conservar: reunir la integració i la relació amb el proveïdor, no només el codi de Supabase. |
| acta | 2 | Retirar: el tipus acta ja expressa la funció en els dos casos. |
| core | 25 | Retirar com a tag. Conservar i validar el booleà core quan governe càrrega de skills. No convertir un en l'altre cegament. |
| escriptori | 12 | Retirar: el camí ja expressa la ubicació. |
| temporal | 7 | Retirar: registrar vigència i criteri de tancament al cos; no equival automàticament a esborrany. |
| maquina | 24 | Retirar: és massa inespecífic; classificar el domini real. Branding no ha de dir-se maquina per estar en una plantilla. |
| saber | 24 | Retirar de la proposta mínima: coneixement és massa general i ja hi ha un pilar saber. Si una consulta real requerix una faceta més precisa, nomenar eixa matèria. |
| genoma | 16 | Retirar com a calaix genèric; revisar cada cas cap a identitat, govern o disseny. |
| graf | 4 | Retirar del vocabulari mínim; arquitectura + vincle al document canònic del graf. Reintroduir només si hi ha una consulta recurrent que els vincles no resolen. |
| skills | 9 | Retirar del vocabulari mínim: type per a skills i vincles al catàleg per a textos que les estudien. No transformar informes sobre skills en type skill. |

El vocabulari actual té 16 termes i unicitat però no cardinalitat màxima. La plantilla anuncia dos tags màxims i diu que F5 elimina els omnipresents; el tractor no implementa eixa interpretació de F5. Si es manté el límit de dos, s'ha d'expressar com `maxItems: 2` en l'esquema, no només en prosa. [tooling/wiki/schema.json:88–111](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/schema.json:88>) [_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:63–66](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:63>) [tooling/wiki/tractor-frontmatter.mjs:357–378](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:357>)

Decisió per als altres 15 tags trobats, tots fora de l'enum vigent:

| Etiqueta | Destí proposat |
| --- | --- |
| consell | govern; la pertinença d'un agent es descriu al registre corresponent |
| rols | govern |
| reflex | govern; vincle explícit al procediment |
| abocament | govern quan tracta el protocol; eliminar si només descriu l'acció de generar un bundle |
| plantilla | type: plantilla, només quan realment és una plantilla |
| pla | Funció al títol/cos i tipus documental apropiat; no és un domini |
| auditoria | Funció al títol/cos; un prompt que demana auditoria continua sent petorreta/prompt |
| matrix | arquitectura o govern segons el contingut, amb vincle al procediment concret |
| implementacio | Fase de treball al cos |
| backend | arquitectura; sollutia només quan el proveïdor és rellevant |
| marmota | type: acta i secció explícita de relleu |
| acta-marmota | Mateix destí; no mantindre dos sinònims |
| coneixement | Classificar per matèria precisa; no canviar-lo per una altra etiqueta genèrica |
| sdp/auditoria | Retirar prefix redundant del projecte i expressar funció al cos |
| domini/arquitectura | arquitectura |

No s'ha provat l'ús de filtres personals d'Obsidian fora del codi auditat. La migració ha de conservar un mapa vell→nou i revisar documents ambivalents; no pot aplicar una substitució massiva ni esborrar significat. Primer es netegen les plantilles i generadors, després les notes actives. Els tags no han de convertir-se en permisos ni seleccionar per si sols procediments obligatoris.

Hi ha un defecte funcional abans de qualsevol promesa de «millorar el cervell»: el RAG intenta llegir `parsed.attributes`, mentre el parser retorna `data`. Per tant, eixe bloc no incorpora les metadades tags/aliases al text indexable. Un terme encara pot aparèixer al cos i ser indexat per eixa altra via; això no salva la connexió amb el frontmatter. [tooling/wiki/core/build_rag_index.mjs:62–81](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/build_rag_index.mjs:62>) [tooling/wiki/lib/frontmatter.mjs:247–269](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/frontmatter.mjs:247>)

Substitució puntual proposada del lookup, sense canviar la resta del bucle:

```js
const attr = parsed.data || {};
```

Prova necessària: document el cos del qual no conté el tag ni l'alias; només després de corregir el consumidor la consulta d'eixos termes ha de recuperar-lo. No s'ha regenerat l'índex durant l'auditoria.

### C10 · P1 · Vincles resolubles no equival a estar ancorat

El tractor de frontmatter no valida `## Vincles`: només recorre metadades. SGQ compara un bloc fix, cosa que tampoc demostra l'existència dels seus destins. [tooling/wiki/tractor-frontmatter.mjs:304–370](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:304>) [tooling/wiki/lib/prompt_sgq.mjs:124–130](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/prompt_sgq.mjs:124>)

Cal distingir tres invariants:

1. El document té una secció real `## Vincles` amb almenys una nota interna existent, única i diferent del mateix document.
2. Un índex actiu enllaça el document quan el perfil exigix ancoratge editorial.
3. Hi ha un camí dirigit des d'una arrel canònica exacta fins al document. Una arrel absent és error, no una exempció.

Fixture en memòria del graf existent: root no enllaça ningú; source→root; A→B i B→A. El grau total dona `orphans=[]`, però source, A i B són inaccessibles des de root. Això demostra que basta una referència eixint per enganyar una definició d'orfe basada en grau zero. [tooling/wiki/core/parse.mjs:240–288](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/parse.mjs:240>)

El verificador SCC sí intenta recorregut dirigit, però la seua extracció usa text cru i el seu resolutor usa basenames, amb sobreescriptura quan es repetixen. S'ha reproduït que accepta un wikilink dins d'un bloc de codi i que una ruta amb carpeta resol cap a l'últim basename homònim. Això fabrica arestes. A més, si manca l'índex, algunes comprovacions d'ancoratge salten. [tooling/gates/verificador-scc.mjs:70–94](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/verificador-scc.mjs:70>) [tooling/gates/verificador-scc.mjs:128–163](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/verificador-scc.mjs:128>) [tooling/gates/verificador-scc.mjs:180–211](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/verificador-scc.mjs:180>)

### Pegat proposat de validació local de Vincles

[PROPOSTA DE FUNCIÓ NOVA] `validaVincles` reutilitza el parser i resolutor existents. Els imports corresponen a la ubicació del tractor actual. La funció no escriu res. El contracte proposat per a eixa secció és deliberadament restringit: llista de wikilinks sencers a notes, sense fragments, embeds, escapes ni referències Markdown indirectes. Els formats no suportats es rebutgen; no es compten com a èxit.

Aquesta restricció simplifica una porta verificable. Si es vol permetre Markdown general en la secció, cal un parser que n'interprete tota la sintaxi i fixtures addicionals. No és correcte afirmar que una regex reconeix qualsevol enllaç d'Obsidian. El parser viu ja elimina fences i comentaris, i el resolutor distingix ambigüitat, autoreferència, externs i actius. [tooling/wiki/core/parse.mjs:49–80](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/parse.mjs:49>) [tooling/wiki/core/parse.mjs:142–237](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/parse.mjs:142>)

```js
import { parseFrontmatter } from './lib/frontmatter.mjs';
import {
  liveMarkdown, extractLinks, buildResolver, resolveLink
} from './core/parse.mjs';

function validaVincles(doc, resolver) {
  const p = parseFrontmatter(doc.content);
  if (p.malformed || p.errors.length) return ['YAML no llegible'];
  const seccions = [];
  let actual = null;
  for (const line of liveMarkdown(p.body).split('\n')) {
    const h = /^ {0,3}(#{1,6})[\t ]+(.+?)(?:[\t ]+#+)?[\t ]*$/.exec(line);
    if (h && h[1].length <= 2) {
      actual = h[1].length === 2 && h[2] === 'Vincles' ? [] : null;
      if (actual) seccions.push(actual);
    } else if (actual) {
      actual.push(line);
    }
  }
  if (seccions.length !== 1) {
    return ['Cal exactament una secció real ## Vincles'];
  }
  const errors = [];
  let valids = 0;
  for (const line of seccions[0]) {
    if (!line.trim()) continue;
    const item = /^ {0,3}[-*][\t ]+(\[\[[^[\]\n]+\]\])[\t ]*$/.exec(line);
    if (!item || item[1].includes('\\')) {
      errors.push('Vincles només admet una llista de wikilinks sencers');
      continue;
    }
    const links = extractLinks(item[1]);
    if (links.length !== 1 || /[#^]/.test(links[0].target)) {
      errors.push('Cal enllaçar una nota sencera, sense fragments');
      continue;
    }
    const r = resolveLink(links[0], doc, resolver);
    if (r.status === 'resolved' && r.doc.relPath !== doc.relPath) {
      valids++;
    } else {
      errors.push(`${links[0].target}: ${r.status === 'resolved'
        ? 'autoreferència' : r.status}`);
    }
  }
  if (!valids) errors.push('Falta una nota interna única i diferent');
  return errors;
}
```

Integració pendent, concreta i necessària:

- Llegir una sola vegada els documents i construir `docs` amb `relPath`, `base` sense extensió i `content`; crear `buildResolver(docs)` una vegada. L'univers de resolució ha d'incloure els destins vàlids encara que la llista de documents a validar siga més menuda.
- Afegir `F9: []` al registre d'errors del tractor i el nom de la regla a l'eixida; cada error és `{n, clau:'Vincles', detall}`. Aplicar-la al perfil documental explícit: documents nous d'informe/prompt/petorreta/acta/pla, amb migració declarada dels existents. No exemptar un informe falsificant `type: plantilla`: el perfil naix de l'operació autoritzada.
- Fer que un error de lectura falle. Ara el recorregut i la lectura poden ometre errors silenciosament. [tooling/wiki/tractor-frontmatter.mjs:171–180](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:171>) [tooling/wiki/tractor-frontmatter.mjs:304–306](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:304>)
- Reutilitzar el mateix extractor i resolutor en SCC i Teixidor. Corregir abans sufixos i normalització NFC, ja inclosos en el pla Matrix. El resolutor actual de core rebutja alguns sufixos de ruta; el helper els rebutjarà conservadorament fins que es resolga. [tooling/wiki/core/parse.mjs:215–237](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/core/parse.mjs:215>) [_wiki_de_poble/04_escriptori/260920_0500_PLA_IMPLEMENTACIO_MATRIX.md:40–44](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260920_0500_PLA_IMPLEMENTACIO_MATRIX.md:40>)
- Afegir fora de F9 la validació de camins dirigits des d'arrels exactes i l'enllaç entrant de l'índex. `## Vincles` per si sol no elimina una illa A↔B.
- Validar el graf sobre la proposta document+índex abans de publicar-la. Un document incorrecte es rebutja; no es «repara» inventant-li un tema o una relació.
- Versionar el mètode de recompte i el canvi de política. No regenerar automàticament baselines per passar el nou control. Les excepcions han de tindre abast i motiu explícits; recursos binaris necessiten enllaç entrant, no frontmatter inventat.

### C11 · P2 · La plantilla i el validador SGQ ja no encaixen

`loadSgqContext` espera la capçalera «Context Històric i Identitat (Qui som)»; la plantilla té «Qui som i Per a què treballem». La crida de només lectura falla amb `Seccions del Cos canònic invàlides`. A més, el generador/validador continua fixant `tipus/estat` mentre la plantilla oferix `type/status`. [tooling/wiki/lib/prompt_sgq.mjs:58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/prompt_sgq.mjs:58>) [tooling/wiki/lib/prompt_sgq.mjs:108](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/prompt_sgq.mjs:108>) [tooling/wiki/lib/prompt_sgq.mjs:205–206](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/lib/prompt_sgq.mjs:205>) [_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:40–48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:40>) [_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:136](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md:136>)

[PROPOSTA] Títols humans no han de ser identificadors fràgils de protocol. Definir seccions amb identificadors estables en la configuració i generar plantilla i validador des del mateix contracte. La plantilla no s'ha de considerar viva només perquè existisca: ha de poder instanciar-se i validar-se en una prova de contracte.

## Prioritat d'aplicació per a la IAIA

| Ordre | Resultat verificable |
| --- | --- |
| 1 | Tancar els camins d'escriptura no mediats i provar que el host no pot escriure directament al repositori viu. |
| 2 | Corregir conjuntament èpoques de sessió, classificació de renovació, timeout de cos i Notes; provar canvi d'usuari i interrupció de xarxa. |
| 3 | Completar els pegats del pla Matrix sobre panys, CWD, metadades i resolutors; provar les condicions de cursa abans de reutilitzar-los. |
| 4 | Reconciliar schema, plantilla, SGQ i router; tallar la reinfecció des dels generadors. |
| 5 | Arreglar el consumidor RAG de metadades i migrar la taxonomia per document, conservant mapa de procedència. |
| 6 | Introduir F9 i el control dirigit del graf dins de la transacció document+índex. |
| 7 | Verificar RPC de missatges i cicle de canals; contrastar RLS real en staging amb identitats separades. |

Esta auditoria no substituïx les correccions del pla Matrix per una promesa nova de seguretat. Una solució no queda tancada perquè un document diga «blindat»: ha de superar les proves negatives següents.

## Bateria d'acceptació proposada

| Àrea | Cas | Resultat requerit |
| --- | --- | --- |
| Sessió | Renovació d'A resol després del login de B | B continua autenticat; A no sobreescriu tokens ni tanca B |
| Sessió | Eixir i tornar a entrar com A durant una renovació | La resposta de la sessió anterior no afecta la nova |
| Xarxa | Timeout, 429 o 503 renovant abans de caducar | Estat de reconnexió; conservar credencials recuperables; reintent limitat |
| HTTP | Capçaleres immediates i cos que no finalitza | Avortament dins del límit; alliberar single-flight |
| Notes | loadNotes rebutja amb ReferenceError | Estat d'error observable, cap loading perpetu ni rebuig sense gestionar |
| Xat | 201 missatges i dos amb la mateixa data | Finestra recent estable, cap desaparició del missatge 201 |
| RLS | Usuari d'un altre tenant i canvi de propietari en UPDATE | Operació denegada pel servidor |
| Cognició | Script shell, apply_patch, MCP o procés preexistent intenta mutar sense capacitat | Efecte denegat encara que el model ignore les regles |
| Cognició | El host omet o trunca una lectura obligatòria | No s'emet autorització d'escriptura |
| Cognició | Canvia una skill després del rebut | Rebut invalidat i context actualitzat abans d'executar |
| Cognició | Reutilitzar rebut o canviar destí/bytes finals | Rebuig, sense efectes parcials |
| Concurrència | Dos executors, preimatge canviada o procés que cau entre dos fitxers | Exclusió i recuperació coherent; cap confirmació falsa |
| Graf | Vincles dins fence/comentari, destí ambigu, autoenllaç o ruta trencada | Rebuig |
| Graf | A↔B desconnectats dels índexs | Rebuig encara que cada nota tinga Vincles |
| Graf | Manca l'arrel canònica | Error d'abast, no verd amb zero documents |
| Taxonomia | Instància literal de cada plantilla viva | Passa el mateix esquema i el seu perfil documental |
| RAG | Tag i alias presents només en frontmatter | Recuperables després del pegat; cap dependència de repetir-los al cos |
| Política | Canvi que intenta relaxar el seu propi validador | Canal de canvi de política separat de l'operació ordinària |

## Comprovacions executades i límits

- Lectura real de codi, pla, plantilla, skills i gates amb línies; cap cerca externa, cap secret llegit.
- Reproduccions de sessió amb backend sintètic, timeout del cos i teardown de classe: fallades confirmades en memòria, sense tocar servidor.
- Fixtures de graf: grau zero insuficient, enllaç dins fence acceptat per SCC, resolució ambigua per basename i diferències dels resolutors.
- SGQ: càrrega de context rebutjada per capçalera desfasada.
- Tractor RLS: exit 0, 16 SQL; només comprovació estàtica local.
- Tractor frontmatter global: exit 1, 217 documents i zero exempts. F1=15, F2=89, F3=26, F4=18, F5=1, F6=0, F7=14, F8=0. Són comptadors d'infraccions, no documents diferents; F3/F4 poden comptar la mateixa etiqueta per dos controls.
- Frontmatter d'este informe: el validador de biblioteca retorna zero errors. La comprovació amb el tractor executable sobre el lliurable es registra al final del document.
- Esta auditoria no ha aplicat pegats; C2 registra dues contencions concurrents observades. No s'ha executat una suite d'integració del producte modificat. Les proves dels defectes no equivalen a proves d'un pegat complet.

Incògnites: configuració efectiva de hooks del host; permisos OS reals d'un futur broker; protecció de branca; polítiques, grants i migracions desplegades; publicació Realtime; configuració GoTrue dels primers registres; consultes i filtres personals d'Obsidian. No s'han substituït per suposicions.

El trigger de registre local exigix `raw_user_meta_data.tenant_id`, mentre el magic link visible no l'envia. És un punt d'integració pendent de contrastar amb GoTrue; no s'afirma que els primers registres estiguen fallant en producció. [supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:51–59](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:51>) [src/data/supabase/auth.js:135–146](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/auth.js:135>)

## Bateria de veritat de l'informe

- [x] He llegit el pla d'implementació actiu i explorat codi real.
- [x] Les afirmacions tècniques tenen referències a fitxers originals i línies.
- [x] Les funcions o contractes nous es presenten com a propostes, no com a implementacions existents.
- [x] Les dependències del host i les dades remotes desconegudes estan marcades com a supòsit o incògnita.
- [x] Esta auditoria no ha aplicat pegats, neteges, baselines ni migracions. Les dues modificacions concurrents observades estan registrades a C2.
- [ ] Integritat global del corpus: falla i continua pendent; no es declara verda.

## Validació final del lliurable

- [x] El lliurable passa el tractor real en mode estricte: exit 0, un document, F1–F8 a zero. S'ha usat el script i l'esquema vigents del repositori, limitant només l'abast al directori d'este informe.
- [x] El fragment proposat `validaVincles` s'ha extret d'este document i s'ha executat en memòria: 16 casos, 16 resultats esperats. Inclou destí únic, alias, ruta exacta, fences, comentari, autoreferència, extern, absent, ambigu, secció duplicada, enllaç en altra secció, escape, fragment i barreja d'enllaç vàlid amb trencat.
- [x] S'ha revisat l'existència dels fitxers citats i la validesa dels números de línia.

Comanda reproduïble de validació individual:

```sh
node '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs' '--arrel=/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org' --estricte --arrels=../../../../../../private/tmp/sdp-auditoria-260920-0530
```

Esta passada individual acredita el frontmatter del lliurable, no la salut global de la Wiki, la integració del pegat F9 ni la validesa de totes les propostes. El corpus global continua amb el resultat fallit registrat més amunt. No s'ha modificat l'esquema ni reduït el seu deute per aconseguir el resultat.

