---
type: informe
status: esborrany
description: Auditoria adversarial de Gestoria, identitat, Consola, composabilitat i destil·lació del laboratori amb evidència reproduïble.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0878d73e-9950-4602-a4d9-1ed6c37bd38d:c039c936-921c-44ed-a504-fc936539d17b
---
# Auditoria Codex · Gestoria JARVIS i composabilitat atòmica

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0878d73e-9950-4602-a4d9-1ed6c37bd38d:c039c936-921c-44ed-a504-fc936539d17b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T13:10:19.447Z |
| Modificació | 2026-10-13T13:37:20+00:00 |
| Propietari | agent-local |
| Aprovació humana | Encàrrec explícit rebut; auditoria del tall lliurada; implementació pendent de reauditar |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (identificador exacte no exposat) |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-13T13:10:19.447Z: esborrany creat amb plantilla viva.
2026-10-13T13:12:00Z: relleu inicial de rutes, boina i Consola.
2026-10-13T13:18:00Z: sis defectes financers reproduïts i proves de regressió registrades.
2026-10-13T13:36:00Z: llegit íntegre el relleu 3 de Claude, que incorpora els sis defectes a Front I; conformitat funcional encara pendent.
2026-10-13T13:32:00Z: consolidació de revisió atòmica, prova visual i destil·lació; rellegits pla i prompts ampliats amb Front H i el relleu 2 de Claude. Reproduccions conservades dins de l’informe; tancament mecànic executat i no conforme per catàleg/SCC i relleu LEDGER del torn.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen del tall auditat

**No hi ha conformitat JARVIS encara.** Hi ha sis defectes matemàtics/de conciliació reproduïts i una carrera de cobrament TPV reproduïda. Els fronts nous d'Escàner i Cabina no estaven implementats en el tall; tampoc la hidratació de perfil, el rellotge permanent ni la jerarquia taronja. Açò és una auditoria del codi disponible, no una atribució de culpes a Claude ni una certificació d'una entrega futura.

HEAD inicial: `99aab3f7b2756d301a59dd991a8216c080cf89ac`. L'arbre és compartit, amb nombrosos canvis previs en staging. Els motors financers de GES-A1…A6 no tenen diferències contra este HEAD. Els relleus de Claude de 15:15 i 15:25 encara declaren «cap canvi de codi» i confirmen les rutes inexistents. El segon afegix la fitxa legal privada i informa d'una fallada de HistoricCofre en la seua suite; no es confon amb les suites verdes executades ací. Les empremtes del tall es consignen al final.

**Contrast final amb Claude (relleu 3 llegit a les 15:36 CEST):** l'informe company accepta GES-A1…A6 i els incorpora a un Front I abans de Cabina; ATOM-A1…A5 queden com a feina posterior, no com a resolts. Proposa `getProfile` pel port, rellotge comú, token de crom vàlid, dades de boina filtrades i fitxa legal al cofre. Hi ha consens de direcció; encara declara cap canvi de codi. La suite global que comunica (989 fitxers, 16.509 proves; 16.500 verdes, 8 omeses i 1 timeout previ) és evidència aportada per Claude, no una execució pròpia. Cal distingir-la de les tres bateries executades en esta auditoria. Queden exigits: continuïtat RAM entre totes les subrutes, prova de trànsit de RAW, àmbit multiactor i acceptació dels sis repros; muntar Escàner dins de Shell no resol per si sol els desmuntatges de Facturació/Històric/Aprendre.

**Prioritat:** arreglar identitat bancària, fusió i deduplicació abans d'alimentar una Cabina més vistosa; arreglar retencions, obligacions separades i conciliació abans de presentar estimacions com completes. Mantindre els nuclis i ports existents: no cal refer el sistema.

P1 indica risc concret de dades financeres incorrectes o pèrdua de comandes; P2, error funcional o requisit pendent. No s'ha observat cap fuita remota de finances. `requires_human_decision: false` per als defectes reproduïts: les correccions preserven la intenció. Les decisions arquitectòniques futures s'indiquen expressament.

### 1. Defectes financers reproduïts

Tots els imports d'esta taula són **cèntims**. Les entrades són sintètiques i no provenen dels documents privats del Mestre.

| ID | Prioritat i localització | Entrada i resultat real | Causa arrel; acceptació de la correcció |
|---|---|---|---|
| GES-A1 | P1 · `src/sections/gestoria/tauler/nucli/resumTauler.js:190` | Una còpia CSV dóna eixides 1.000; dues còpies del mateix fitxer donen 2.000 i dos moviments, sense avís. | `flatMap` concatena files sense identitat de font. Identificar fitxer i compte; mateixa importació ha de ser idempotent. No deduplicar només per import/data: dos càrrecs reals iguals s'han de conservar. |
| GES-A2 | P1 · `resumTauler.js:172`, `tauler/nucli/tractorTauler.js:167`, `nucli/c43.js:175` | Dos comptes Norma 43 de la mateixa entitat, oficines i números diferents però sufix 4321: caixa 20.000 i un compte, en lloc de 30.000 i dos. La caixa queda marcada completa. | La reducció de privacitat i la clau entitat+sufix destrueixen identitat. Derivar un identificador opac local de la identitat completa abans de reduir-la; sufix només de presentació. Prova executada passant pel parser i reductor reals. |
| GES-A3 | P1 · `resumTauler.js:99` | Extracte de febrer més acumulat gener–març: desapareix el moviment de gener, encara que el rang anunciat siga gener–març. | La fusió descarta tot moviment anterior al final d'un tram ja vist. Unir intervals realment coberts amb procedència i deduplicació; resultat invariant a l'ordre i a afegir un extracte acumulat. |
| GES-A4 | P1 · `src/sections/gestoria/impostos/nucli/impostos.js:187` | Factura +10.000/retenció 1.500, abonament íntegre −10.000/retenció 1.500, altra factura +10.000 sense retenció: retencions 3.000, 130=0; esperat retenció neta 0, 130=2.000 en este supòsit. | `Math.abs` ignora el signe de l'abonament que el model intern aplica segons la base (`nucli/model.js:88`). Factura i anul·lació íntegra han de ser neutrals. No és una proposta de fórmula fiscal universal; és una contradicció interna demostrada. |
| GES-A5 | P1 · `impostos.js:218`; significat visible `tauler/nucli/targetesTauler.js:138` | 303=−50.000 i 130=30.000 produeixen «a pagar» −20.000. | La suma compensa impostos diferents. Separar pagaments exigibles, IVA a compensar i devolucions eventuals. En el supòsit trimestral ordinari: 30.000 a pagar i 50.000 de crèdit IVA, sense donar-lo per cobrat. |
| GES-A6 | P2 · `src/sections/gestoria/nucli/concilia.js:375` | Càrrec EUR de 0,01 € amb referència INV-0001 i factura de 100 USD, o EUR amb total desconegut: R1/alta, diferencia=null i factura retirada de pendents. | La condició booleana confon null amb zero. Coincidència exacta requerix `diferencia === 0`; import desconegut o moneda incompatible requerixen incidència/revisió. |

El model 130 requerix dades acumulades de l'any i retencions suportades; el 303 negatiu no és caixa disponible ni una compensació automàtica d'IRPF. Fonts oficials consultades: [AEAT, instruccions 130](https://sede.agenciatributaria.gob.es/Sede/ca_es/impuestos-tasas/impuesto-sobre-renta-personas-fisicas/modelo-130-irpf______esionales-estimacion-directa-fraccionado_/instrucciones.html) i [AEAT, instruccions 303 de 2026](https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/iva/modelo-303-iva-autoliquidacion_/instrucciones-2026.html). Esta auditoria no certifica totes les caselles, règims ni excepcions fiscals.

### 2. Estat dels cinc fronts JARVIS i la Consola

| Front | Evidència del tall | Resultat i correcció conservadora |
|---|---|---|
| Avatar barra negra | `src/app/contexts/IdentitatContext.jsx:41–47,74–92,115–118` només resol metadata/camps de l'usuari; l'efecte consulta organitzacions, no el perfil. | P2 pendent. Hidratar `public.profiles` mitjançant l'operació existent del port neutral, amb prioritat de perfil, estats d'error i invalidació per compte/generació. No importar Supabase directament al context ni fixar Javi en codi. El botó presentacional ja accepta l'avatar. |
| Titular a totes les pàgines | `src/apps/gestoria/AppGestoria.jsx:100–133`: la closca rep mòdul i entrada, sense titular; Facturació/Aprendre tenen `PaginaApp` independent. `src/apps/plataforma/fontSessio.js:46` només exposa marca d'entitat. | P2 pendent. Una DTO mínima d'identitat pel pont de plataforma ha d'arribar a totes les pàgines, inclòs Històric. El nom visual de l'operador no pot alterar el propietari o NIF fiscal. |
| Rellotge permanent | `ShellGestoria.jsx:256,331–335`: la pastilla ve de `tauler.llegit` i desapareix si no hi ha lectura. No hi ha temporitzador viu. | P2 pendent. Component de rellotge comú amb actualització independent de dades, neteja del temporitzador i resincronització en tornar al primer pla. L'hora d'última importació és una altra dada. |
| Menú taronja | `src/apps/plataforma/apps.css:27–31` usa `--sdp-crom-text-suau`; `layout.css:267` conserva el color de les entrades. Navegador: els tres grups són rgba(255,255,255,0.78), pes 600. | P2 pendent. El token literal `--sdp-primary` del prompt **no està definit**; la paleta és `--sdp-primary-*` i hi ha tokens semàntics. Resoldre el token de crom adequat o un àlies deliberat amb contrast, no enganxar una variable inexistent. |
| Escàner RAW | `ShellGestoria.jsx:99` encara `enObres:true`; no existix `escaner/PanellEscaner.jsx`. El selector recursiu i fallback ja viuen a `font/fontNavegador.js`/`useGestoria.js`. | No lliurat en este tall. Reutilitzar el selector. Falta orquestració d'ingesta, classificació, deduplicació i publicació del resultat al Tauler. No confondre trobar fitxers amb extreure factures fiables, especialment PDF escanejat. |
| Cabina | `Tauler.jsx:76–77`: només Targetes/Vista comprimida; no existix `CabinaAvio.jsx`. | No lliurada. No es poden certificar ràtios nous inexistents. Abans: dades completes, període, moneda i procedència; caixa desconeguda no és zero, divisió per zero no és cobertura infinita i flux bancari no és benefici comptable. |
| Continuïtat entre mòduls | `AppGestoria.jsx:100–127` retorna arbres diferents per Facturació, Històric i Aprendre, desmuntant ShellGestoria. | P2 respecte al nou pla: l'estat RAM de la closca es perd. Mantindre un proveïdor de sessió de Gestoria per àmbit damunt de les subrutes; netejar-lo en canvi de propietari/eixida, no en navegar entre pantalles. |
| Consola: imatges | Fitxer real `src/sections/consola/ConsolaSection.jsx`, no el nom del prompt. A :192 les cards no reben `imatge`; `peces.jsx` admet eixa prop. | P2 pendent. Nou cards del tauler mostraven logos/icones. Les tres il·lustracions observades són a l'índex inferior: no acrediten el requisit de capçaleres rurals. Reutilitzar assets i resolutor existents. |
| Consola: índex/diagnòstic | `ConsolaSection.jsx:352–353` munta `IndexConsola`; navegador el confirma. No hi ha `<pre>` ni bloc de diagnòstic complet en el tauler. | Índex present i navegable; diagnòstic demanat pendent. Derivar-lo de les mateixes fonts que les cards i aplicar privacitat també a text/còpia. |

**Prova visual local:** IAB, 1280×720, `/consola`, Tauler, Facturació i Escàner; Escàner també a 390×844, sense desbordament horitzontal. Tauler/Escàner: boina «Titular sense configurar» i zero elements `time`; Facturació: «Sóc de Poble · La Torre de les Maçanes», sense rellotge. La sessió d'este navegador era convidada; no demostra l'estat de la sessió humana en un altre navegador i no s'han introduït credencials. El viewport s'ha restaurat.

A la Consola no s'han capturat errors ni warnings JS durant l'observació, i cap imatge carregada estava trencada. Els tests de `useFontDev` comproven estabilitat del carregador, abort i absència de recàrregues per canvi de funció. Açò no és un perfil de rendiment ni acredita absència de tots els renders innecessaris. El rellotge nou no ha de provocar una recàrrega o recalcular tot el graf cada segon.

### 2.1 Ampliació rebuda: Front H, identitat legal privada

El pla i els dos prompts al disc s'han ampliat durant l'auditoria; lectura íntegra repetida. El relleu 2 de Claude (15:25) tria extractor al navegador, proposta revisable i cofre local amb confirmació, sense transcriure números reals ni posar-los a `public.profiles`. És una decisió declarada, encara no una implementació verificada.

**ID-H1 · P1 de disseny, destinacions incompatibles al pla.** `public.profiles` no significa «públic per a qualsevol»: les migracions antigues de lectura oberta queden revocades a `2609121500_correccio_privacitat_perfils.sql:12–17`; `2609160600_politiques_superadmin_organitzacions.sql:76–79` restringix SELECT a l'usuari autenticat propietari. La RPC `2610021520_perfil_public.sql:42–90` projecta camps socials explícits, exigix sessió i no retorna identificadors legals. No s'ha inspeccionat SQL desplegat, ni observat exposició remota de dades legals.

Tanmateix, `src/data/supabase/auth.js:167` fa GET remot de la fila de perfil, i `:264–286` filtra camps i fa PATCH al backend. `CAMPS_PERFIL`/`CAMPS_METADATA` a `:205` exclouen DNI/NAF/cadastre; alguns camps socials també es copien a GoTrue. **Ampliar este circuit amb dades legals vulneraria el requisit local encara que la RLS les fera privades.** Cal llevar l'alternativa ambigua «public.profiles / magatzem privat» del Front H. Per a l'avatar, sí que és apropiat el `getProfile` ja exposat pel port neutral (`backendPort.js:93`).

**ID-H2 · P2, fitxa i tràmit encara pendents.** `src/sections/gestoria/identitat/nucli/titular.js:13,28` exclou números legals. `document.js:2,59–66` modela metadades de documents, no els seus bytes o identificadors. `guardes.js:63,106–108` rebutja DNI/NIE/afiliació/IBAN amb `IDENTIFICADOR_PERSONAL`: no relaxar esta protecció general per facilitar un nou formulari. Cal un model privat separat. No s'ha trobat extractor legal ni Finestreta implementats; Burocràcia continua `enObres:true` a `ShellGestoria.jsx:88`. La categoria documental `signatura-electronica` no és un motor per signar tràmits.

**Base local reutilitzable, sense certificació criptogràfica nova:** `cofre/cofre.js:105–169` comprova context segur, bloqueig i invalidació de sessió; `cofre/nucli/cripto.js:30` implementa PBKDF2 SHA-256 amb 600.000 iteracions, AES-KW i AES-GCM. A `:360–374` usa IV aleatori i AAD de col·lecció/id. `cofre/magatzemCofre.js:28` persistix a IndexedDB `sdp-gestoria-cofre`: contingut xifrat, col·lecció i ID en clar. No posar identificadors personals en eixes claus. La integració actual és Històric (`Historic.jsx:55,76,564`); no acredita la nova fitxa multiactor. El xifrat en repòs tampoc aïlla dades desxifrades de scripts del mateix origen mentre el cofre està obert.

Acceptació H: col·lecció privada amb titular opac; cada camp amb font, versió i estat confirmat/desconegut; extracció amb confiança i revisió humana; absència d'un camp no es completa per conjectura. Guardar només després d'una acció explícita; purgar contingut desxifrat en bloqueig/canvi d'actor/eixida; cap dada legal en perfil social, metadata/JWT, logs, errors o cues. Avatar i portada només canvien per acció humana.

Preparar proposta, omplir, signar i presentar són operacions separades. Cal verificar organisme, destinació i camps concrets abans de lliurar dades a un formulari extern; eixa entrega autoritzada ja és transmissió i no es pot descriure com «cap byte a la xarxa». Cap firma o presentació automàtica es deriva de tindre una fitxa local. En este torn no s'ha signat ni enviat cap tràmit.

### 3. Composabilitat: què hi ha i què falta

**ATOM-A1 · P1, cobrament amb revisió caducada.** `src/apps/bar/magatzem.js:189–200` llig la revisió, escriu tiquet i esborra comanda en operacions separades. Dues instàncies sense Web Locks: A llig rev1, B desa rev2, A cobra rev1 i esborra rev2. Reproduït pel subagent i pel revisor principal amb el fals IndexedDB del repo: `{revInicial:1, revNovaB:2, revTiquetDesat:1, comandaFinal:null}`. La injecció d'intercalat és determinista, no una prova en navegador real. Cal una única transacció multistore amb comprovació de revisió + tiquet + eliminació i futur outbox. Una cua per instància no resol concurrència entre pestanyes.

**ATOM-A2 · Separació multiactor pendent.** Bar usa BD fixa `sdp-bar` (`src/apps/bar/magatzem.js:32`); Nevera `sdp-nevera` i registre únic (`src/apps/nevera/magatzem.js:18`); perfil fiscal `sdp-gestoria-perfil` amb claus tipus|versió (`src/sections/gestoria/facturacio/magatzemPerfil.js:47`). `facturar/useFacturacio.js:111,154` crea recursos una vegada i llig el llibre complet. La cadena fiscal per NIF no aïlla actors: `registre/portIndexedDB.js:141` permet llegir tots els emissors. Canviar la marca visual no canvia estos magatzems. És una bretxa respecte al requisit de navegar persona/SL/Rentonar sense barrejar dades, no una fuita remota demostrada.

**ATOM-A3 · Consum teòric no és moviment d'estoc.** `src/apps/bar/nucli/consum.js:75` usa la carta actual: el mateix tiquet pot consumir 2 ous abans i 8 després d'editar l'escandall. El codi ho declara com a consum teòric. Cal congelar recepta/variants/substitucions abans d'usar-lo com baixa d'inventari. Nevera (`nucli/nevera.js:9`) té estats hi-ha/se-n-acaba/acabat i quantitat lliure; encara no és llibre de lots i moviments. Una collita, una compra i una donació no són el mateix fet econòmic.

**ATOM-A4 · Frontissa tancada, no connectada.** `src/data/adaptadors/sollutia/client.js:4–14`: origen null, allowlist buida i recursos buits; `llig()` retorna UNKNOWN_RESOURCE. La implementació de transport fixa GET, credencials omeses, sense redireccions i amb límits. Les portes passen i reconeixen un contracte capturat, però no hi ha recurs activat ni prova contra endpoint real. Cal captura real autoritzada, traductor, fixture i prova de conformitat per recurs; no s'ha de vendre el verd estructural com integració en producció.

**ATOM-A5 · Contractes proposats, no implementats.** No hi ha `sdp.atomic.*` ni outbox funcional a `src/`/`supabase/`. La porta `tractor-atomic` comprova `useAccions`, no atomicitat de dades. La RLS existent d'organitzacions/publicacions és una base: no hi ha migracions d'ERP/estoc que acrediten esta composició. No s'ha consultat la RLS desplegada.

### 4. Contractes atòmics proposats

Proposta de disseny per a la següent revisió del pla; **no implementada ni activada**. `requires_human_decision: true` per adoptar persistència compartida financera, servei federat o política de publicació autònoma. La tasca actual només dissenya estes opcions.

#### 4.1 Fronteres de dades i identitat

1. **RAW de Gestoria:** bytes, handles i resultats d'anàlisi només RAM, fora de logs, telemetria, outbox, IndexedDB i Supabase. Canviar de vista conserva la RAM del mateix àmbit; canviar de propietari/tancar sessió l'invalida. Qualsevol promoció a registre persistent requerix una acció explícita i revisada, local en l'abast actual.
2. **Registres privats locals:** TPV, inventari i llibre fiscal que s'hagen decidit persistir, amb ports i propietari explícits. Cap sincronització de finances per defecte. Esta excepció local ha de quedar documentada respecte de l'arquitectura online autoritativa.
3. **Dades compartides del poble:** Supabase de Sóc de Poble, darrere de `backendPort.js` i RLS. Sollutia és amfitrió i font GET de la Frontissa; no és el backend del Mas.

Un Web Component aporta encapsulació de UI, no una frontera de seguretat contra scripts del mateix amfitrió. Si el requisit de zero eixida inclou un host no fiable, cal acordar un origen aïllat/client local o iframe amb política restrictiva i missatges mínims; no atribuir a Shadow DOM una garantia que no té. La prova d'egress de l'app pròpia no certifica un host maliciós.

Context mínim validat al límit de cada operació:

```js
{
  tenantId,           // poble, no empresa
  principalId,        // humà, derivat de sessió; mai un rol acceptat del client
  actor: { type: 'person|organization', id },
  owner: { type: 'person|organization', id },
  scopeGeneration,    // evita respostes d'un àmbit abandonat
  authorityRef       // rastre d'auditoria; no és prova de permís
}
```

Javi pot operar per Sóc de Poble SL o Rentonar. La boina pot identificar l'operador i la representació; l'emissor fiscal es valida per separat. Cap NIF fix derivat d'un correu o nom. Claus, consultes, memòria i cues han d'incloure propietari i àmbit. Un servidor futur torna a comprovar permisos amb identitat autenticada, no `user_metadata`: [Supabase, RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

#### 4.2 Port mínim i invariants

```js
atomic.describeCapabilities()
atomic.query({ type, scope, input, signal })
atomic.command({ type, commandId, scope,
                 expectedRevision, input, signal })
atomic.subscribe({ types, scope, afterCursor, onEvent })
```

Operacions registrades i versionades, sense SQL, taules, funcions ni URLs arbitràries. Apps consumidores no importen magatzems privats d'altres apps. Capacitats declaren versió i persistència memory/local/shared; una absència torna UNAVAILABLE. Errors comuns: VALIDATION, FORBIDDEN, CONFLICT, IDEMPOTENCY_CONFLICT, UNAVAILABLE i CANCELLED. En v1, `commandId` és també la clau d'idempotència; no hi ha una segona clau independent. Cancel·lar després del commit no desfà un fet. La consulta registrada `sdp.atomic.command.result.get.v1`, amb el mateix àmbit i commandId, recupera `pending/committed/rejected/unknown`: un timeout no acredita rebuig. `subscribe()` retorna `unsubscribe`; el canvi d'àmbit la crida i invalida callbacks pendents. El cursor pertany a font, consumidor i àmbit.

| Contracte v1 | Propietari, dades i invariant |
|---|---|
| `sdp.atomic.sale.commit.v1` → `sale.committed.v1` | TPV: línies congelades, totals, pagaments, torn i revisió; tiquet comercial no equival automàticament a factura fiscal. |
| `sdp.atomic.inventory.receive.v1` → `inventory.received.v1` | Rebost: producte, lot, ubicació, quantitat, unitat, procedència i motiu collita/compra/donació. |
| `sdp.atomic.inventory.consume.v1` → `inventory.consumed.v1` | Rebost: moviment vinculat al fet de preparació/venda i recepta congelada; un efecte per origen. |
| `sdp.atomic.billing.prepare.v1` | Gestoria: proposta revisable des d'una venda, sense assignar número ni emetre. |
| `sdp.atomic.billing.issue.v1` → `billing.issued.v1` | Gestoria: emissor, sèrie, número i encadenament del port fiscal; origen únic i permisos vigents. |
| `sdp.atomic.cash.shift.close.v1` → `cash.shift.closed.v1` | TPV: arqueig i resum immutable de torn; conciliació fiscal separada. |
| `sdp.atomic.communication.prepare.v1` | Comunicació: projecció amb camps explícitament publicables, audiència i actor; sense RAW, clients ni imports privats. |
| `sdp.atomic.communication.publish.v1` → `communication.published.v1` | Comunicació: publicació explícita o regla prèviament aprovada; mai efecte implícit de collir/cobrar/facturar. |

Els noms d'esdeveniment de la taula mantenen el prefix complet `sdp.atomic.`. Diners: enters en unitat menor amb moneda i comprovació de límits segurs també en multiplicacions. Quantitats: enter+unitat+escala, per exemple 1.250 g; conversions explícites i sense floats arbitraris. Separar occurredAt UTC, businessDate i zona horària; data de cobrament no substituïx data fiscal. Producte necessita ID estable, unitat, al·lèrgens/canal quan pertoque; identitat local del producte no és una descripció textual.

Es pot reutilitzar l'embolcall [CloudEvents 1.0.2](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md), sense introduir un bus remot:

```json
{
  "specversion": "1.0",
  "id": "event-uuid",
  "source": "urn:sdp:local:bar:workspace-uuid",
  "type": "sdp.atomic.sale.committed.v1",
  "time": "2026-10-13T13:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "scope": {"tenantId": "town-uuid",
              "owner": {"type": "organization", "id": "org-uuid"}},
    "saleId": "sale-uuid", "revision": 3,
    "currency": "EUR", "grossMinor": 1210,
    "sourceCommandId": "command-uuid"
  }
}
```

L'àmbit d'este event és una projecció mínima; no substituïx el context d'autorització de l'operació. La clau de deduplicació d'event és source+id; el format no aporta permisos, persistència o secret. No exposar este event financer a un bus global ni a l'amfitrió. El consumidor obté només la projecció que la seua capacitat permet.

#### 4.3 Atomicitat local i recuperació entre mòduls

Cada comandament desa el resultat per `(scope, operació, commandId)` i hash canònic d'entrada. Mateixa clau/entrada: mateix resultat; entrada diferent: conflicte. Canvi del domini + resultat + outbox en una transacció local; consumidor: inbox+efecte en una transacció seua. [IndexedDB](https://www.w3.org/TR/IndexedDB/#transactions) permet transaccions sobre stores d'una mateixa base; no sobre les bases independents de tots els plugins.

Entre mòduls: entrega repetible, deduplicació i estats visibles pendent/aplicat/error. No es promet «exactament una vegada» distribuït. Venda cobrada i factura fallida: venda conserva el seu fet, factura queda pendent; reintent no cobra ni emet dos vegades. Una devolució no torna automàticament menjar cuinat al rebost. Una rectificació fiscal no es resol esborrant el registre original.

Fluxos mínims: collita → entrada de lot; preparació → consum de recepta; venda → proposta de factura; emissió → llibre; anunci → projecció pública aprovada. Calendari agrícola només referencia tasques/collites: una cita futura no dona existències ni ingressos per produïts.

Per a Fedivers, l'adaptador ha de traduir publicacions públiques a un actor federat; [ActivityPub](https://www.w3.org/TR/activitypub/) distingix capa client-servidor i federació servidor-servidor; permet implementar-ne només una. La federació prevista necessita la segona, que la SPA i GET de Sollutia no resolen per si soles. La infraestructura es triaria sota govern de Sóc de Poble, separada del backend host.

### 5. Destil·lació del laboratori i estudi de mercat

Inventari: **36 carpetes i 22 fitxers visibles**, més `.DS_Store`; **58 elements visibles, no 58 carpetes**. Recursivament 477 fitxers, 178 directoris i 14.257.230 bytes. Vigilante ocupa 8.454.993 bytes, 5.318.291 en quatre `wf_*.json`. El problema principal és classificació i coneixement sense provar, no volum de disc. Inventari complet no equival a lectura o auditoria de tots els fitxers.

En la taula, LAB és `_wiki_de_poble/04_escriptori/02_investigacio_ia/`. Són decisions proposades; no s'ha mogut res.

| Ruta dins de LAB | Decisió | Valor a conservar / condició abans d'arxivar |
|---|---|---|
| `261002_1730_eines_disseny_ia.md`, `261004_0045_skills_kowalski_impeccable.md`, `261011_0246_teoria_kowalski_apple_design.md` | Condensar | Feedback, accessibilitat, gestos interrompibles i proves visuals, adaptats a Pedra Seca. Noms genèrics sense URL no són candidats d'instal·lació. |
| `261010_2200_tractor_ortografia_valenciana.md` | Condensar | Regles locals de text exacte i humor; comprovar si la skill viva ja les incorpora. |
| `260922_0500_informe_idees_noves_skills.md`, `261002_0150_investigacio_plugins_claude.md` | Condensar/corregir | Un problema i una prova per eina; eliminar promeses absolutes d'estalvi o autonomia il·limitada. |
| `261004_0045_mcp_prompts_chat.md` | Fitxa de referència | MCP existent; prompt extern és contingut a avaluar, no autoritat automàtica. |
| `261002_1650_carboni_silici_fluxos.md`, `261002_1655_tractor_fluxos.md`, dos `.webloc` Academy | Condensar; arxiu posterior dels duplicats | Fricció → experiment limitat → resultat → adopció/rebuig. Els bookmarks dupliquen les URL de la nota. |
| `261012_1815_skills_antislop_thermos.md` | Experimental | «Codi genèric» no és una regla executable. Mesurar falsos positius abans d'una porta bloquejant. |
| `261012_1825_workflow_rss_skills.md` | Experimental ajornat | Fonts, cadència, pressupost, deduplicació i responsable; cap notícia activa edicions/desplegaments automàtics. |
| `261003_1330_lector_rss_claude/DISSENY.txt` | Condensar contracte | `creaFontNoticies(adaptador)`, DTO i llavors DEV són útils; port viu `src/apps/lector/fontNoticies.js`. Corregir «backend (Sollutia)» del §3. |
| `261002_1745_sentinelles_claude/` | Conservar fins reconciliació | Sis entrades manuals i dos hooks; no huit dimonis. Codi a `src/sections/tractors/sentinelles/`, però skill destí absent. |
| `261012_1715_gnucash_arrel.md`, `261012_1915_arquitectura_visual_erp.md` | Condensar domini | Partida doble, llibres per actor, stock i procedència. Banc no determina per si sol factura o deducció. |
| `261012_1322_relat_historic_xylella.md` | Conservar lliçó; arxivar relleu després | Convertir l'error de correspondència DNI/nom en prova sintètica; no replicar dades familiars. |
| `261002_1705_sobirania_tecnologica_qwen.md` | Conclusions no validades | Falta benchmark amb checkpoint, quantització, context, maquinari i corpus. No justifica compra, ADR o equivalència cloud. |
| `261011_0310_auditoria_mercat_puebli_bandomovil.md` | Reescriure | Les generalitzacions sobre competidors són contradites per fonts públiques; vegeu baix. |
| `001 NEXUS/` | Referència experimental | Útil separar declarat/inferit/suposat; l'exploració també pot eixir del repo i inspeccionar programacions globals. No s'han executat instal·ladors. |
| `mapa-visual-agentes.zip` | Candidat ferm d'arxiu | 18 fitxers idèntics per SHA-256 als 18 de `001 NEXUS/`; cap contingut únic al ZIP. |
| `vigilante/` | Condensar patrons | WordPress PHP, no dependència SPA: caducitat d'evidència, cobertura parcial i alertes deduplicades. No traslladar crons/reinstal·lació automàtica. |
| `261012_0040_sistema_informes_claude/` | Experimental | README diu generador no executat i Google Fonts externa. Cal generar, renderitzar, escapar contingut i provar sense xarxa abans de dir «autònom local». |
| Laboratoris de governança/snapshots | Arxiu condicionat | Migrar primer cobertura de tests que importa LAB, verificar dependents i conservar decisió/hashes. |
| Relleus, arqueologia, logotips i onades restants | Conservar fins tancar traçabilitat | Sense lectura íntegra de tot el codi i relleus, no hi ha base per declarar-los brossa en bloc. |

**No arxivar tractors a cegues.** Encara hi ha imports/prioritat de snapshots a `tests/tractor-sinapsis.test.mjs:9`, `tests/porta-olivera-v2.test.mjs:15`, `tests/petorreta-generador.test.mjs:21` i `tests/lint-torn-261002.test.mjs:20`. `tooling/tests/node-suite-manifest.json` separa laboratory i CI; el verd CI no certifica estos experiments.

Comparacions confirmades: hooks/fatiga de 261002_1510, dos tests d'Olivera 261006_0055, tres skills de Consola 261009_0400, fase Olivera/cron d'Higiene 261009_0400 coincideixen amb destins vius. En Ledger 261006_0300 set fitxers coincideixen i nou difereixen. Els paquets 260930_0040/0400 han divergit: una antiga nota d'«idèntic al disc» no prova adopció completa actual. Seqüència d'arxiu: cobertura útil al producte → cap import de LAB → manifest/hashes i decisió → arxiu reversible amb àncores actualitzades per l'orquestradora.

#### Fonts externes destil·lades, verificades el 2026-10-13

| Font primària | Decisió tècnica per a Sóc de Poble |
|---|---|
| [Impeccable](https://github.com/pbakaus/impeccable), [Kowalski](https://github.com/emilkowalski/skills), [comparació visual Playwright](https://playwright.dev/docs/test-snapshots) | Separar mesures deterministes de crítica LLM; provar noms llargs, buits i gestos. No importar un gust visual incompatible amb Pedra Seca. |
| [Ponytail](https://github.com/DietrichGebert/ponytail), [Agent Skills](https://github.com/addyosmani/agent-skills) | Adoptar passos i criteris de sortida quan resolguen fricció real; benchmarks d'un altre model/corpus no prometen estalvi local. |
| [Graphify](https://github.com/Graphify-Labs/graphify), [OmniRoute](https://github.com/devolkus/omniroute) | Graf AST local pot ser útil; documents/imatges poden eixir al model configurat. Encaminament/fallback és infraestructura separada, amb pressupost i política de dades. |
| [prompts.chat](https://github.com/f/prompts.chat), [Thermos](https://github.com/cursor/plugins/blob/main/thermos/README.md) | Una fitxa de procedència, no còpia de catàlegs. Thermos proposa dues revisions i síntesi; tres lents SDP serien adaptació pròpia. |
| [GnuCash](https://www.gnucash.org/docs/v5/C/gnucash-guide/basics-accounting1.html), [Paperasse](https://github.com/romainsimon/paperasse), [Grocy](https://github.com/grocy/grocy) | Extreure invariants comptables, fonts traçables i model d'inventari; fiscalitat francesa i backend autoallotjat no passen automàticament al Mas. |
| [Qwen](https://github.com/QwenLM/Qwen3.8) | Cal model i protocol concret de prova. La disponibilitat d'un repositori no valida rendiment o equivalència afirmats a la nota local. |

**Rectificació de mercat necessària:** la nota de Puebli el reduïx a bàndols/notícies/incidències i afirma que sense pagament/registre no es veu interior. [Puebli mostra públicament](https://www.puebli.es/descubre-la-app) mercat, habitatge, feina, esdeveniments i cotxe compartit; els [termes](https://www.puebli.es/terms-of-service) contemplen visitants d'informació pública. [Bandomovil](https://www.bandomovil.com/) presenta participació, propostes i consultes. Estes fonts inval·lidaven la generalització, però no acrediten tota l'experiència privada, preus o prestacions internes. Puebloo no s'ha verificat prou. Conservar els requisits propis de SDP sense inventar mancances alienes.

**Destí canònic proposat:** una referència única a `02_saber` amb fitxa problema/font/commit/llicència/dades/xarxa/prova/resultat/decisió/responsable. Reutilitzar la skill viva per a procediments adoptats; laboratori per a hipòtesis encara no provades; arxiu per a snapshots consumits. No crear una skill per cada notícia. En este torn, el destil·lat queda dins d'este informe, com demana l'eixida exclusiva a l'Escriptori.

### 6. Criteris de tancament i ordre de treball

| Bloc | Prova necessària per donar-lo per acceptat |
|---|---|
| Motors financers | GES-A1…A6 passen amb asserts del resultat desitjat, més casos d'operacions legítimes repetides, solapaments i divises desconegudes. |
| Perfil | Metadata sense avatar + profiles amb avatar: mostra perfil; canvi de compte amb resposta tardana no repinta l'usuari anterior; error no inventa identitat. |
| Boina | Rutes Tauler/Bancs/Impostos/Full/Facturació/Històric/Aprendre/Escàner i detall: operador correcte i rellotge visible sense dades, carregant, error i tractor pendent; proves de canvi de minut, dia i retorn de pestanya. Mòbil i escriptori. |
| RAW | Carpeta sintètica amb duplicats binaris, extractes solapats, dos comptes amb sufix igual, anys/trimestres, fitxers corruptes i PDF sense text. Cancel·lació i límits de mida/quantitat. Classificació dubtosa queda pendent, no factura inventada. |
| Privacitat RAW | Marcador sintètic absent de peticions URL/headers/body, fetch/XHR/beacon/WS, storage, logs, cues i exports no triats; lectures autoritzades del compte no han de transportar RAW. L'ull només amaga visualment, no és aïllament. |
| Cabina | Recalcular resultats contra fixtures independents; IVA crèdit separat de pagaments; dades absents/incompletes, imports fora de rang i divisor zero; període/data de tall visibles. Terminis amb font AEAT versionada, no només dia fix. |
| Consola | Assets rurals realment a les cards, índex i diagnòstic des de mateixes dades; privacitat aplicada al text; zero errors capturats i perfil React abans/després del rellotge. |
| Fitxa legal H | Model privat separat de profiles/metadata, extracció sintètica amb procedència i confirmació, claus opaques, purga i permisos per actor; preparar/omplir/signar/presentar amb contractes distints. |
| Multiactor | Persona/SL/Rentonar i dos pobles: memòria, claus, caches i cues separades; revocació i resposta tardana; cap confiança en rol del client. |
| Transaccions | Carrera TPV rebutjada amb CONFLICTE i rev2 conservada; tall abans/després commit/ack no duplica cobrament/factura/stock. |
| Sollutia | Captura real autoritzada per recurs + traductor + fixture + conformitat; errors 401/403, cancel·lació, esquema, mida, origen, zero escriptures. Verd de port no substituïx prova de l'endpoint. |
| Laboratori | Cap import viu trencat, adopció demostrada, manifest i àncora conservats abans d'arxivar. |

Ordre proposat: (1) identitat/ingesta i sis defectes; (2) context multiactor i transacció TPV; (3) boina/menús i continuïtat RAM; (4) Cabina i Consola sobre dades verificades; (5) prova d'un flux atòmic local mínim; (6) arxiu selectiu quan els dependents estiguen resolts. No s'ha executat cap canvi de codi crític.

### 7. Millores concretes de la plantilla

- Rutes exactes reals: ConsolaSection, fontNavegador, useGestoria i motors; distingir fitxer existent de fitxer que s'ha de crear.
- Substituir qualificatius «perfecció», «hiperprofessional» o «instantani sense problema» per invariants i proves de fallada com les anteriors. La pressió retòrica no és evidència.
- No prescriure `--sdp-primary` inexistent ni presentar `dataHoraDeBarra` (format de dates) com a rellotge viu.
- Corregir la compatibilitat del selector: no assumir Safari modern. Feature detection, context segur, gest humà i fallback; [documentació de Chrome](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) i [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) indiquen suport limitat.
- Unificar estat d'aprovació: el pla diu aprovat al cos i pendent al registre. L'encàrrec humà ja autoritza esta auditoria; la contradicció documental no obliga a demanar la mateixa aprovació.
- Front H: corregir la disjunció «public.profiles / magatzem privat»; són xarxa i persistència local diferents. Separar emplenament local de transmissió, signatura i presentació autoritzades.
- Precisar dades: lectura financera efímera, llibre local persistent i dades compartides Supabase són àmbits diferents; «tot en memòria» i «tot autoritatiu al backend» sense abast són incompatibles.
- El número 8.158 no és invariant de qualitat; registrar comanda, fitxers, recompte observat, failures/skips i empremtes. Separar regressió verda de casos que reprodueixen defectes.
- Corregir 58 carpetes → 58 elements visibles, i arxivar per adopció/dependents, no per edat ni quota de neteja.
- Historial dels prompts afirma clàusula 5 de desconvocatòria, però el protocol visible acaba al punt 4. Declarar inici/fi, responsable i ID del monitor, sense prometre que s'ha creat o parat un cron que no s'ha operat. En esta sessió no s'ha creat cap monitor nou.
- Context actiu: llista explícita de documents de primer nivell i manifest de laboratori; lectures totals acreditades i pendents declarades. Cap hash acredita comprensió.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Execucions i resultat observat

| Comprovació | Resultat i abast |
|---|---|
| Vitest UI | **41 fitxers / 773 proves passen**, 150,94 s. Identitat presentacional, Consola, AppGestoria i BarraApp. |
| Vitest nuclis de Gestoria | **6 fitxers / 176 proves passen**, 9,8 s. Conciliació, tractor, banc, font de navegador, impostos i resum. Execució delegada amb configuració aïllada. |
| Vitest ports i composició | **5 fitxers / 51 proves passen**, 3,04 s. Bar, consum, Nevera, Frontissa i registre IndexedDB. Execució delegada. |
| Reproduccions GES-A1…A6 | **6 fallen contra l'expectativa correcta; 6/6 reprodueixen el defecte**. Executades pel revisor de Gestoria i repetides pel principal. Exit 1 intencional de l'assert funcional, no error del runner. |
| Reproducció ATOM-A1 | Intercalat sintètic: rev1 cobrada, rev2 eliminada. Repetida pel principal. No forma part de les 51 proves existents. |
| Portes de contractes | `tractor-frontissa.mjs`, `tractor-adaptadors.mjs`, `tractor-atomic.mjs`: exit 0. L'última només valida l'ús de `useAccions`. |
| Navegador | Observacions descrites al §2. Cap error/warning capturat de Consola; sense perfil React ni prova amb la sessió autenticada de Javi. |
| Circuit documental | Plantilla viva entregada, informe creat i ancorat, pla vinculat. La verificació final es registra davall. |

Les proves verdes mostren que la cobertura existent no detecta els sis casos financers ni la carrera. No equivalen a una suite global, ni a conformitat fiscal o de privacitat.

Comanda UI realment executada:

```sh
node_modules/.bin/vitest run src/app/contexts/IdentitatContext.test.jsx src/components/universal/identitat src/sections/consola src/apps/gestoria/AppGestoria.test.jsx src/apps/plataforma/BarraApp.test.jsx --maxWorkers=2 --reporter=dot
```

El primer filtre, `src/app/contexts/IdentitatContext.test.jsx`, **no té fitxer corresponent**. Vitest executà els altres filtres: no s'ha d'interpretar el verd com a prova de la hidratació del context. El log temporal és `/tmp/sdp-codex-jarvis-ui-tests.log`; el resultat queda preservat ací.

Comanda de ports i composició:

```sh
./node_modules/.bin/vitest run src/apps/bar/magatzem.test.js src/apps/bar/nucli/consum.test.js src/apps/nevera/magatzem.test.js src/data/adaptadors/sollutia/creaFrontissa.test.js src/sections/gestoria/facturacio/registre/portIndexedDB.test.js --reporter=dot
```

Comanda de nuclis de Gestoria:

```sh
node --input-type=module <<'JS'
import { startVitest } from 'vitest/node';
const ctx = await startVitest('test', [
  'src/sections/gestoria/nucli/concilia.test.js',
  'src/sections/gestoria/nucli/tractor.test.js',
  'src/sections/gestoria/nucli/movimentsBanc.test.js',
  'src/sections/gestoria/font/fontNavegador.test.js',
  'src/sections/gestoria/impostos/nucli/impostos.test.js',
  'src/sections/gestoria/tauler/nucli/resumTauler.test.js'
], {
  config: false, watch: false, maxWorkers: 1,
  cache: false, environment: 'node'
}, { configFile: false, envFile: false });
await ctx.close();
JS
```

### Reproducció financera conservada

Guardar el bloc següent en un fitxer temporal `.mjs` i executar-lo amb `node fitxer.mjs /ruta/al/repositori`. Només usa dades sintètiques. Exit 1 mentre existisca algun defecte; exit 0 quan els resultats siguen els esperats. El script s'ha executat sense modificar els motors.

```js
/**
 * Reproduccions adversarials de només lectura. Dades exclusivament sintètiques.
 * Executa: node /tmp/sdp-codex-jarvis-repros.mjs [arrel-del-repositori]
 * Exit 1: almenys un criteri funcional falla; exit 0: tots passen.
 * No llig .env, documents financers ni configuracions. No escriu cap fitxer.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.argv[2] ?? '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org';
const moduleAt = (relative) => import(pathToFileURL(path.join(root, relative)).href);
const { comptesDe, resumTauler } = await moduleAt('src/sections/gestoria/tauler/nucli/resumTauler.js');
const { estimaIrpf130, resumHisenda } = await moduleAt('src/sections/gestoria/impostos/nucli/impostos.js');
const { concilia } = await moduleAt('src/sections/gestoria/nucli/concilia.js');
const { llegeixC43 } = await moduleAt('src/sections/gestoria/nucli/c43.js');
const { reduixC43 } = await moduleAt('src/sections/gestoria/tauler/nucli/tractorTauler.js');
const d = (month, day) => ({ a: 2026, m: month, d: day });
const results = [];
function check(id, title, actual, expected, baselineActual) {
  // L'assert funcional sempre compara amb el resultat desitjat, no amb el defecte.
  // baselineActual documenta el resultat observat en HEAD 99aab3f7b2756d301a59dd991a8216c080cf89ac.
  let baselineReproduced;
  try { assert.deepEqual(actual, baselineActual); baselineReproduced = true; }
  catch { baselineReproduced = false; }
  try {
    assert.deepEqual(actual, expected);
    results.push({ id, title, status: 'PASS', baselineReproduced, actual, expected });
  } catch (error) {
    results.push({ id, title, status: 'FAIL', baselineReproduced, actual, expected, assertion: error.message });
  }
}

// GES-A1: dues còpies del mateix CSV no poden duplicar els fluxos.
{
  const csv = { lectura: { moviments: [
    { dataOperacio: d(1, 1), centims: -1000, saldo: 9000 },
    { dataOperacio: d(2, 1), centims: -1000, saldo: 8000 },
  ] } };
  const single = resumTauler({ comptes: comptesDe({ csv: [csv] }).comptes });
  const duplicated = resumTauler({ comptes: comptesDe({ csv: [csv, structuredClone(csv)] }).comptes });
  const project = (r) => ({ accounts: r.caixa.comptes, outflow: r.finances.banc.eixides, movements: r.finances.banc.moviments });
  check('GES-A1', 'CSV idempotent', project(duplicated), project(single), { accounts: 1, outflow: 2000, movements: 2 });
}

// Norma 43 sintètica vàlida, seguint les posicions del parser i les proves existents.
const digits = (n, width) => String(n).padStart(width, '0');
const field = (s, width) => String(s).padEnd(width, ' ').slice(0, width);
function syntheticN43(branch, account, balance) {
  const bank = '9999';
  const header = `11${bank}${branch}${account}2601012601312${digits(balance, 14)}9783${field('TITULAR SINTETIC', 26)}${field('', 3)}`;
  const footer = `33${bank}${branch}${account}${digits(0, 5)}${digits(0, 14)}${digits(0, 5)}${digits(0, 14)}2${digits(balance, 14)}978${field('', 4)}`;
  const end = `88${'9'.repeat(18)}${digits(2, 6)}${field('', 54)}`;
  return `${header}\r\n${footer}\r\n${end}\r\n`;
}

// GES-A2: comptes diferents amb el mateix sufix han de conservar-se separats.
// Passa pel parser real i la reducció de privacitat real, no només pel model final.
{
  const first = reduixC43(llegeixC43(syntheticN43('0001', '0000004321', 10000)));
  const second = reduixC43(llegeixC43(syntheticN43('0002', '0000014321', 20000)));
  const merged = comptesDe({ extractes: [{ lectura: first }, { lectura: second }] });
  const summary = resumTauler({ comptes: merged.comptes });
  check('GES-A2', 'Identitat bancària sense col·lisions',
    { accounts: merged.comptes.length, cash: summary.caixa.saldo },
    { accounts: 2, cash: 30000 },
    { accounts: 1, cash: 20000 });
}

// GES-A3: un extracte acumulat que inclou un interval anterior no perd gener.
{
  const statement = (start, end, movements) => ({ lectura: { comptes: [{
    capcalera: { entitat: '9999', compte4: '4321', divisa: 'EUR', dataInicial: start, dataFinal: end, saldoInicial: 100000 },
    moviments: movements.map(([month, day, cents]) => ({ dataOperacio: d(month, day), centims: cents })),
    peu: { saldoFinal: 94000 },
  }] } });
  const merged = comptesDe({ extractes: [
    statement(d(2, 1), d(2, 28), [[2, 5, -1000]]),
    statement(d(1, 1), d(3, 31), [[1, 5, -2000], [2, 5, -1000], [3, 5, -3000]]),
  ] });
  const actual = merged.comptes[0].moviments.map((m) => [m.dataOperacio.m, m.centims]).sort((a, b) => a[0] - b[0]);
  check('GES-A3', 'Unió íntegra d’intervals solapats', actual,
    [[1, -2000], [2, -1000], [3, -3000]], [[2, -1000], [3, -3000]]);
}

// GES-A4: afegir factura + abonament íntegre no modifica ni retenció neta ni 130.
// El model llegat representa retencions com a magnitud positiva; la base indica l’abonament.
{
  const invoice = (base, withholding = 0) => ({
    tipus: 'ingres', data: d(1, 5), subtotal: base, iva: 0,
    total: base - (base < 0 ? -withholding : withholding), retencio: withholding, estat: 'completa',
  });
  const run = (factures) => estimaIrpf130({ factures, any: 2026, t: 1 });
  const neutral = run([invoice(10000)]);
  const reversed = run([invoice(10000, 1500), invoice(-10000, 1500), invoice(10000)]);
  const project = (r) => ({ income: r.rendiment, withheld: r.retencions, payment: r.resultat });
  check('GES-A4', 'Neutralitat de factura i abonament íntegre', project(reversed), project(neutral),
    { income: 10000, withheld: 3000, payment: 0 });
}

// GES-A5: l’import a pagar no resta automàticament un saldo d’IVA a compensar.
// Supòsit: contribuent trimestral ordinari; el crèdit IVA no és devolució cobrada.
// UI: targetesTauler.js presenta hisenda.total com «El que caldria pagar este trimestre».
{
  const r = resumHisenda({
    iva: { resultat: -50000, completa: true, falten: [] },
    irpf: { resultat: 30000, completa: true, falten: [] },
  });
  check('GES-A5', 'Separació de pagament IRPF i crèdit IVA', r.total, 30000, -20000);
}

// GES-A6: «desconegut» no és «diferència zero». Prova amb USD i amb total null.
{
  const cases = [['USD', 10000], ['EUR', null]];
  const actual = cases.map(([currency, total]) => {
    const r = concilia({
      moviments: [{ dataOperacio: d(1, 5), centims: -1, ref1: 'INV-0001' }],
      factures: [{ id: 'synthetic-invoice', tipus: 'despesa', num: 'INV-0001', moneda: currency, total, data: d(1, 5) }],
    });
    return { currency, highConfidenceMatchesWithUnknownDifference: r.parelles.filter((p) => p.confianca === 'alta' && p.diferencia === null).length };
  });
  check('GES-A6', 'Cap coincidència exacta amb import desconegut', actual,
    [{ currency: 'USD', highConfidenceMatchesWithUnknownDifference: 0 }, { currency: 'EUR', highConfidenceMatchesWithUnknownDifference: 0 }],
    [{ currency: 'USD', highConfidenceMatchesWithUnknownDifference: 1 }, { currency: 'EUR', highConfidenceMatchesWithUnknownDifference: 1 }]);
}

for (const result of results) console.log(JSON.stringify(result, null, 2));
const failed = results.filter((r) => r.status === 'FAIL').length;
console.log(`RESULTAT: ${results.length - failed} passen; ${failed} fallen; ${results.filter((r) => r.baselineReproduced).length}/${results.length} reproduïxen el baseline observat.`);
process.exitCode = failed ? 1 : 0;
```

### Reproducció de concurrència TPV conservada

Des de l'arrel del repositori, executar el bloc amb `node --input-type=module`. El fals IndexedDB no persistix dades personals; l'intercalat simula una altra instància que canvia la comanda entre la lectura i el cobrament.

```js
import { creaMagatzemBar } from './src/apps/bar/magatzem.js';
import { creaIdbFals } from './src/utils/__fixtures__/navegadorFals.js';
import { afegeixPagament, tanca } from './src/apps/bar/nucli/cobrament.js';
import { afegeixProducte, creaComanda, totals } from './src/apps/bar/nucli/comanda.js';
import { llavorCarta } from './src/apps/bar/nucli/llavor.js';
const ara = '2026-10-13T13:00:00.000Z';
const idb = creaIdbFals().idb;
const a = creaMagatzemBar({ idb, navegador: {}, Canal: null });
const b = creaMagatzemBar({ idb, navegador: {}, Canal: null });
let c = creaComanda({ id: 'c-test', tornId: 't-test', origen: { tipus: 'barra' }, ara });
c = afegeixProducte(c, {
  producte: llavorCarta().productes.find(p => p.id === 'entrepa-truita'),
  ivaPerDefecte: 10
}, { ara, idLinia: 'l-test' });
c = await a.desaComanda(c);
const tiquet = tanca(afegeixPagament(c, {
  metode: 'efectiu', importCents: totals(c).pendentCents
}, { id: 'p-test', ara }), { numero: 1, ara });
const obte = a.base.obte.bind(a.base);
let revNovaB;
a.base.obte = async (store, key) => {
  const antic = await obte(store, key);
  if (store === 'comandes' && key === 'c-test') {
    revNovaB = (await b.desaComanda({ ...antic, atesPer: 'ALTRE-CAMBRER' })).rev;
  }
  return antic;
};
await a.tancaComanda(tiquet);
console.log({
  revInicial: c.rev, revNovaB,
  revTiquetDesat: (await b.base.obte('tiquets', 'c-test')).rev,
  comandaFinal: await b.base.obte('comandes', 'c-test') ?? null
});
a.base.tanca(); b.base.tanca();
```

Resultat observat: `{ revInicial: 1, revNovaB: 2, revTiquetDesat: 1, comandaFinal: null }`. Acceptació de la correcció: rebutjar el cobrament caducat i conservar la revisió 2; el script actual llavors ha de tractar el conflicte esperat.

### Empremtes i concurrència

Recomparació el 2026-10-13 a les 15:28 CEST: les nou fonts UI del tall inicial mantenen el mateix SHA-256. Els sis motors/ports següents també coincidixen byte a byte amb HEAD `99aab3f7b2756d301a59dd991a8216c080cf89ac`. No atribuïm els defectes preexistents a Claude.

| Fitxer | SHA-256 |
|---|---|
| `src/app/contexts/IdentitatContext.jsx` | `3addf53acbc7d2a7f5d6d5a3b37c344cbdb46522bba9f4deffb22fd352e446cc` |
| `src/apps/gestoria/AppGestoria.jsx` | `caa15c677b54b8fc31c6355074dd2ad788698b28aa89f44d2cd5f8c5adb5c478` |
| `src/sections/gestoria/tauler/ShellGestoria.jsx` | `5fe8457455c058c50e74b721c79bd144d769d770d43eb0ee1d937f1cf0ce6b51` |
| `src/sections/gestoria/tauler/Tauler.jsx` | `be8cdbd02d745fb438e0b87cf07b6dcac9bd134fd287b026d266b596fa9517dd` |
| `src/sections/gestoria/tauler/nucli/targetesTauler.js` | `7850dc52cf3d5d008d81ee864e10bb38d6bde47c8e0f9987cc3a439bae06f4e5` |
| `src/sections/consola/ConsolaSection.jsx` | `6bfebfd520f186a2c69b2a11f7c763322c5e71ff7d15309c27b3896ebc89d43d` |
| `src/sections/consola/peces.jsx` | `d51d52e7a03ddfa7609dad4425c31e61c6bb27b0a4f9f8aed36984f0ec1d99a6` |
| `src/apps/plataforma/apps.css` | `6466336eebfc3ba1e0a84734dd2b023d83ee8d87caac8542545e601963950bc0` |
| `src/css/tokens.css` | `6d6008792c4ae9733b502477f94259bc586903e37b9a0c7db87168acaf2cf466` |
| `src/sections/gestoria/tauler/nucli/resumTauler.js` | `d1db3096f4a248ebebdb9af9e409224bce5126ee7993ad3503f0f4f3994fd794` |
| `src/sections/gestoria/tauler/nucli/tractorTauler.js` | `e694b6ff9efd3e6d68503cb66a4a20d57cab170a7ccab86b07eb731f4e7c13fb` |
| `src/sections/gestoria/nucli/c43.js` | `716da3683622ae623a2e3de86640afe4ca6a114614015d7d9f053b35b17322ce` |
| `src/sections/gestoria/impostos/nucli/impostos.js` | `271f27c7d772bc0e4724665a70f8a20e2554b42e221865099ac7ecbd8238f9ef` |
| `src/sections/gestoria/nucli/concilia.js` | `8224fbd7594e23d6ac2d04654ab19e395063b71abcb9849b68f6663b9dd5a328` |
| `src/apps/bar/magatzem.js` | `b2874c1b35d3fe33d5dce31173fd28e93f5d6ffb5655396973af2a010b4144a6` |

### Tancament documental

`node tooling/wiki/document.mjs check --turn-id torn_0878d73e-9950-4602-a4d9-1ed6c37bd38d --file _wiki_de_poble/04_escriptori/261013_1510_auditoria_codex.md`: **valid:true**, zero errors. Àncora al primer índex present.

`node tooling/gates/tancament.mjs --check --turn-id torn_0878d73e-9950-4602-a4d9-1ed6c37bd38d`: **exit 1, valid:false, state:planned**. Comprovació de només lectura, sense segellar o tancar el torn.

| Porta | Resultat |
|---|---|
| Olivera, plantilles, autoritat, signatura LEDGER, segell, compilació Wiki | Exit 0 cadascuna |
| Catàleg skills | Exit 2: `triggers_on` invàlid a `.agents/skills/core-direccio-autonoma/SKILL.md` |
| SCC | Exit 1: 408 incidències ESCRIPTORI_UNANCHORED, 5 LINK_INVALID i 23 ORPHAN_OPERATIVE |
| Torn propi | Falta el relleu del torn a `.agents/LEDGER.md`; ESTAT sí que té el relleu documental |

La signatura actual del LEDGER passa; això no substituïx l'entrada de relleu que la porta reclama per a este torn. No s'ha afegit una entrada a un registre signat ni modificat el circuit de governança per forçar el verd. SCC assenyala sobretot fitxers dins de producció/laboratori, a més d'enllaços trencats i orfes previs; no assenyala este informe. L'índex conserva l'enllaç inexistent `02_investigacio_ia/261010_1805_arqueologia_claude.md`. La remediació és reconciliar regles d'ancoratge i àmbits protegits, reparar el catàleg i fer el relleu signat pel circuit corresponent; no moure centenars de fitxers a cegues.

Evidència temporal: `/tmp/sdp-codex-jarvis-closure.json`; hash del snapshot que retorna la porta: `a5b29206b355545da70526925847829e5a378412972caf2fc9af328e9dfa9ee4`. Els diagnòstics resumits queden conservats ací. Durant el torn s'ha observat una modificació del manifest generat `src/data/wikiManifest.js`; no s'ha desfet ni atribuït a una IA concreta. Les fonts funcionals auditades mantenen les empremtes indicades.



<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Este informe certifica les observacions i reproduccions descrites del tall disponible. Claude continua treballant: els canvis posteriors requerixen nou diff i proves dirigides; l'absència actual d'Escàner/Cabina no és una regressió atribuïda a una entrega futura.
- Context llegit íntegre: AGENTS, genotip, índex Wiki, taxonomia, Bootstrap i skills del circuit; documents de primer nivell de l'Escriptori (índex, pla, dos prompts, auditoria Claude), rellegits quan han canviat. Les carpetes de producció/laboratori s'han tractat com a subàmbits, no com a milers de línies incorporades cegament al context.
- Laboratori: inventari complet i lectura de notes arrel, RSS, sentinelles, README/SECURITY de Vigilante i READMEs seleccionats. No s'ha auditat tot el codi dels 477 fitxers, els 52 PHP ni els quatre workflows JSON. No s'ha llegit l'arxiu històric ni executat instal·ladors de tercers. La taula conserva allò que no té evidència suficient per arxivar.
- No s'han llegit documents personals de `_gestoria_de_poble/`, ni traslladat dades financeres a serveis remots. Les reproduccions només utilitzen fixtures sintètiques. La protecció completa contra eixida de RAW continua pendent de la implementació i de proves de trànsit/storage de l'Escàner.
- Front H: lectura estàtica de model, port, migracions i cofre; cap prova d'extracció real, revisió criptogràfica integral ni repetició de la fallada HistoricCofre comunicada per Claude. La bateria UI pròpia no incloïa eixe fitxer.
- No s'ha consultat el desplegament Supabase ni un endpoint real de Sollutia; les conclusions sobre permisos provenen de codi i migracions locals. No s'ha fet certificació Veri*Factu ni de tot el càlcul fiscal. No s'han enviat formularis oficials, signatures, publicacions ni missatges a tercers.
- Canvis propis: informe, àncora documental automàtica, registre del torn/pla i relleu d'ESTAT. Cap codi funcional, fitxer privat, skill, política, signatura, commit, desplegament o arxiu massiu modificat. Els processos de proves poden crear cache temporal; això no és una entrega funcional.
- No s'ha activat un bucle de vigilància futur ni s'ha aturat el monitor de MarIA. Esta entrega és el relleu auditat del tall actual; no promet seguiment després de finalitzar la conversa.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
