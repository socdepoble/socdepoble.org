---
type: informe
status: esborrany
description: Viabilitat de Notes i xat personal, captura, ports, migració de dades, federació i integració WordPress; contrast de la crítica de Fable.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_71fcc3fc-ae34-4459-9545-4380d3ef65c3:c7dcd490-c3db-4b55-820b-c349e4128ad3
---
# Auditoria adversarial Codex de la proposta final de Fable

Auditoria documental completada. **Direcció viable; contractes insuficients per a implementar tota la proposta.** Notes com a magatzem únic i RSS separat del xat són bones decisions. Cal resoldre el port de Sollutia, la conservació de dades i referències, la sessió i l’aterratge abans de presentar les noves funcions com a preparades. No s’ha modificat codi en este torn.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_71fcc3fc-ae34-4459-9545-4380d3ef65c3:c7dcd490-c3db-4b55-820b-c349e4128ad3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T14:49:23.146Z |
| Modificació | 2026-09-30T15:01:13Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 / Codex; variant comercial no acreditable |
| Tokens consumits | N/D; sense comptador fiable exposat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T14:49:23.146Z: esborrany creat amb rebut.

2026-09-30T15:01:13Z: lectura íntegra de Fable, contrast del codi i tres revisions independents; conclusions consolidades. Estat editorial esborrany perquè no implica aprovació humana del redisseny.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Abast i dictamen

La font auditada és la versió **1.0.0** de Fable, modificada a les **16:42 CEST**, amb 678 línies i 67.668 bytes. SHA-256: `39a3e63b63949d807c390cbced0bd3793ca122c9dcf4e96dd58d5019f4f52e65`. L’original ha sigut traslladat concurrentment a [_wiki_de_poble/90_arxiu_historic/260930_1550_auditoria_claude.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/90_arxiu_historic/260930_1550_auditoria_claude.md>); s’ha llegit sencer i fixat una còpia temporal. Les referències a § i línies de Fable corresponen a eixe contingut, no a una versió intermèdia.

| Proposta de Fable | Dictamen |
| --- | --- |
| Reutilitzar navegació i components existents amb una UX familiar de conversa | Viable. No cal clonar internament WhatsApp ni crear un altre motor de xat. |
| Notes com a magatzem únic; «Tu» com a vista dels guardats | Recomanada. Evita dos magatzems amb sincronització bidireccional. Necessita lectura cronològica i límits propis. |
| Quatre portes de captura, previsualització i escriptura només després del clic | Bon invariant; el receptor actual perd camps en remot i falta idempotència. |
| Referències d’anada i tornada només privades | Bona intenció; el model de referències i la compatibilitat antiga encara no la garantixen. |
| RSS/Atom al servidor, separat del xat; ActivityPub després | Separació correcta. RSS és lectura de fonts; no equival a federació. |
| Manifest i canal signat; dir «declarat» quan no s’ha verificat | Correcte. Llegir HTML descobrix instruccions i artefactes; no clona dades, permisos, claus ni infraestructura. |
| Segellar el destí de credencials | Correcte. Tancar el port d’adaptadors sense substitut neutral contradiu l’encàrrec. |

**Prioritats:** P1 significa bloqueig abans d’activar la funcionalitat afectada, no incident de producció provat. P2 és correcció necessària de contracte o robustesa. «Reproduït» indica una execució local acotada; «risc de disseny» indica una condició futura encara sense servei implementat. No s’ha demostrat cap fuga de memòria ni exfiltració real.

### 2. P1 — L’autoritat del node no justifica clausurar el port de Sollutia

**Fable §3.6, línia 380; §4.4.** Fer que el publicador autoritze una configuració és compatible amb un backend substituïble. Prohibir `configura({backend})` en release i obligar a recompilar cada proveïdor és una decisió arquitectònica nova. No és una frase d’addenda innòcua: [src/host.js:63](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js>) ja valida l’adaptador abans de segellar-lo, i [src/data/backendPort.js:35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js>) establix el contracte independent de proveïdor.

La directiva de l’usuari exigix que Supabase siga un endoll substituïble. La doctrina actual del «backend segellat» restringix què pot declarar una pàgina amfitriona, però no obliga a eliminar una instal·lació confiable de l’adaptador. Un selector d’endpoint disponible per a qualsevol script i una API d’inicialització autoritzada són decisions diferents.

**Correcció proposada:** conservar el port neutral; establir qui pot instal·lar-lo, abans de quina fase i amb quina identitat/origen autoritzats. Un release pot fixar l’adaptador i la política de credencials mitjançant configuració verificada o integració del publicador. La UI no ha de conéixer Supabase ni acceptar canvis de destí d’autenticació arbitraris. Els requisits per a Sollutia han de descriure DTO, errors, capacitats, autenticació i consistència, no exigir-li copiar l’esquema SQL de Supabase.

**Acceptació:** executar la mateixa UI amb un adaptador fictici complet de Sollutia, sense importar Supabase; una configuració rebutjada no munta la UI ni activa un proveïdor per defecte. La substitució confiable funciona sense editar components de negoci.

### 3. P1 — El text seleccionat es perd en el desat remot existent

**Fable §2.3, línies 255–258; §5.** [src/sections/connectar/contingutExtern.js:145](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/connectar/contingutExtern.js>) crea `subtitle` i `lead` a partir de la captura. [src/data/supabase/notes.js:157](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js>) els omet en el POST de creació; l’actualització sí que els contempla. **Reproduït:** transformador i mòdul real de Notes amb transport simulat; una entrada amb selecció arriba sense `lead` ni `subtitle` a la petició i a la resposta transformada.

Afegir el botó sobre el receptor existent no completa la funció promesa. Cal alinear els camps del DTO de creació en tots els adaptadors i comunicar qualsevol camp no desat.

**Acceptació:** guardar URL, títol, subtítol i selecció; tornar-los a llegir del servidor i comparar-los. Incloure emojis, límit de 256 punts de codi i entrada que l’excedix. La comprovació amb transport simulat demostra l’omissió del client; encara cal la prova d’integració amb el servidor.

### 4. P1 — «Cap clau» no està garantit pel bookmarklet proposat

**Fable §2.3, línies 256 i 269–273.** L’esquelet envia `location.href` íntegre dins d’una consulta al node. Una URL pot portar credencials en userinfo, tokens en query i informació privada al fragment. El fragment original, que no viatjava al servidor d’origen, passa a formar part de la consulta del node receptor. **Reproduït amb valors ficticis:** tots estos valors apareixen en l’URL de destí.

[src/data/origenNota.js:72](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/origenNota.js>) rebutja userinfo quan rep la captura, però eixa comprovació arriba després de la navegació inicial. Fable ja advertix dels registres del servidor; això és encertat, però no permet afirmar que no es transmet cap clau. També el títol i la selecció poden ser privats.

**Correcció proposada:** previsualitzar i minimitzar localment abans d’obrir el destí; rebutjar userinfo en origen i permetre revisar query i fragment. No eliminar tota consulta indiscriminadament: algunes identifiquen el contingut. Si es tria un transport que evite registrar la captura en l’URL, documentar i provar el nou contracte d’entrada. Un fragment reduïx exposició en la petició HTTP, però no és secret davant del JavaScript de la pàgina receptora.

**Acceptació:** interceptar `open()` amb dades sintètiques i comprovar que allò descartat no ix del document d’origen; cancel·lar no navega. Límits i errors es comproven abans d’enviar.

### 5. P1 — Referències noves, clients antics i privacitat necessiten un contracte explícit

**Fable §2.4, línia 286; §3.4; §4.2.** El client vell ignora el valor desconegut del camp `objecte`, però conserva la connexió genèrica. Això no acredita la preservació dels nous camps ni la privacitat de totes les metadades. [src/data/origenNota.js:182](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/origenNota.js>) descarta l’`objecte` desconegut però conserva la connexió genèrica. També descarta `nodeId`, `tenantId`, `filId` i un conjunt de `vincles` no previst. **Reproduït:** dos orígens amb el mateix identificador però nodes/àmbits diferents es normalitzen igual; `objecte: missatge` desapareix.

La normalització és destructiva si s’escriu l’origen normalitzat; canviar només la carpeta no demostra destrucció persistent, perquè el PATCH omet `origen` quan no es proporciona. La protecció del cos de la connexió és real, però [src/data/origenNota.js:207](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/origenNota.js>) només retira `abast` de l’origen publicable. Pot conservar títol, autor i ruta. No he publicat cap nota ni provat una filtració real: el resultat demostra que excloure el cos, per si sol, no acredita privacitat de totes les metadades d’un missatge.

**Correcció proposada:** referència versionada amb node, àmbit, tipus i identificador, separada de la ruta de presentació. Conjunt de vincles vinculat a la revisió de la nota, amb addicions i retirades coherents amb el desat. Els clients antics han de preservar camps opacs o rebutjar l’edició incompatible explícitament. L’índex ha d’autoritzar propietari i àmbit; les metadades de missatges privats requerixen una política pròpia.

**Acceptació:** dos nodes amb el mateix ID no conflueixen; editar només la carpeta amb un client antic no destruïx referències; afegir i llevar un enllaç actualitza els backlinks; cap consulta sense permís revela títols ni recomptes. No basta calcular l’índex només des d’un `origen` singular quan l’editor admet múltiples enllaços.

### 6. P2 — Guardar i importar necessiten idempotència i portabilitat verificable

**Fable §2.1 i §3.6.** Reutilitzar Notes és una bona elecció, però el desat de [src/sections/connectar/ConnectarSection.jsx:303](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/connectar/ConnectarSection.jsx>) no aporta un identificador d’operació estable. **Reproduït amb l’adaptador local real:** dos intents del mateix contingut generen dues notes; repetir l’ID provoca 409 ([src/data/localNotes.js:98](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/localNotes.js>)). «Ja el tens guardat» és una consulta, no una garantia contra carreres ni contra una confirmació perduda.

Cal separar una segona còpia deliberada d’un reintent de la mateixa operació. Propose un ID estable per operació lògica, acotat a node/àmbit/actor, que permeta recuperar el resultat i rebutge reutilització amb contingut diferent. **Acceptació:** perdre la resposta després del desat i reintentar dona una sola nota i el mateix resultat; canviar de compte no reutilitza l’operació anterior.

La «Maleta» tampoc és completa amb només el nucli. [supabase/migrations/2609261500_identitat_perfil_f1.sql:984](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2609261500_identitat_perfil_f1.sql>) exporta referències de fitxers, no els blobs; [src/data/supabase/storage.js:122](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js>) incorpora usuari i poble a la referència, resolta contra el backend actual. `mitjans` i `compte` són capacitats opcionals ([src/data/contracte.js:65](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/contracte.js>)). Copiar files pot deixar adjunts trencats i enllaços apuntant a un altre context.

**Correcció proposada:** primer importador textual amb informe dels camps no transportats; després paquet versionat amb mitjans, mapa d’IDs i referències, validació prèvia i importació privada. No cal engrossir el nucli, però sí declarar les capacitats requerides. **Acceptació:** importar dues notes enllaçades i un adjunt privat amb altres IDs d’usuari i poble; desconnectar l’origen i comprovar contingut, permisos, enllaços i reexecució sense duplicats. Excloure converses alienes, com fa Fable, és correcte.

### 7. P2 — El pes es governa amb límits i cicle de vida, no amb una semblança visual

**Fable §2.1, §3.2 i §4.1.** No hi ha evidència de fuga de memòria en una proposta que encara no està implementada. Sí que hi ha requisits absents: [src/data/supabase/notes.js:62](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js>) pagina per ID amb màxim de 50, mentre [src/data/localNotes.js:95](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/localNotes.js>) carrega el conjunt local. Una vista cronològica no hauria de descarregar totes les notes ni conservar totes les pàgines indefinidament.

El contracte de `guardats` ha de fixar ordre estable `(data,id)`, cursor lligat a l’àmbit, mida de pàgina i extracte, límits de text/mitjans i política de quotes. Els límits del compositor de xat no passen automàticament a Notes. Les memòries cau, peticions, observadors i subscripcions han de cancel·lar-se o invalidar-se en desmuntar, canviar d’actor o canviar de node; renovar credencials del mateix actor ha de conservar operacions vàlides.

La doble comprovació de capacitats proposada per Fable és correcta, però «memoritzar el primer rebuig» és massa ampli. Un 401, un timeout o una caiguda no demostren una capacitat absent. Cal error tipat, àmbit de la memòria cau, caducitat i via de recuperació.

**Acceptació:** milers de notes, dates iguals, insercions concurrents i canvis de carpeta sense omissions ni duplicats; càrrega i retenció acotades. Mesurar bytes del bundle, memòria retinguda i peticions després de muntar/desmuntar repetidament i de canviar d’actor. Acordar pressupostos a partir de la línia base i dispositius objectiu; no inventar ara un llindar sense mesura. El mòdul de seguiments s’ha de poder desactivar sense cost sostingut ni trencar el nucli.

### 8. P2 — RSS és viable, però implica un servei amb operació i privacitat pròpies

**Fable §3.2.** És encertat no fer el fetch arbitrari des del client ni posar claus allí. Falten decisions de retenció, freqüència, quotes, deduplicació i recuperació: compartir la descàrrega d’una font pública entre seguidors, usar validació de memòria cau quan el servidor la suporte, limitar treball simultani i aplicar espera progressiva quan falle. Un item requereix identitat estable i tractament explícit de canvis i desaparicions.

Abans d’implementar el lector, validar destí després de DNS i en qualsevol redirecció admesa, incloent IPv4/IPv6, xarxes internes i adreces locals; acotar temps, mida descomprimida i complexitat del parser. El sanejament del contingut i la moderació són passos distints de la validació de xarxa. Açò és un requisit de disseny, no una vulnerabilitat demostrada d’un servei inexistent. [Guia primària OWASP sobre SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

«Ningú del poble veu a qui seguixes» necessita concretar visibilitat davant d’altres usuaris i administradors. Les relacions de seguiment poden ser privades en la UI i continuar sent dades del servei. La frase no ha de prometre invisibilitat absoluta.

RSS no aporta per si mateix inbox/outbox, lliurament federat, actualitzacions ni supressions entre actors. Si arriba ActivityPub, requerirà un contracte específic d’identitat, deduplicació, autorització, moderació i cicle de vida; la retirada remota no pot garantir-se després del lliurament. [Especificació W3C ActivityPub](https://www.w3.org/TR/activitypub/).

Finalment, «canviar de domini implica perdre els seguidors» és massa absolut. Mastodon preveu migració amb àlies i redirecció, transferència de seguidors segons suport dels servidors i límits sobre el contingut que es mou. Això no demostra que Sóc de Poble ja ho suporte. La identitat ha de distingir canvi de domini, migració d’actor i importació de dades. [Documentació oficial de migració de Mastodon](https://docs.joinmastodon.org/user/moving/).

### 9. P1 abans d’integrar — Arrencada i sessió: accepte les troballes, però la solució comuna no les resol totes

**Fable §8.2–8.3 i §8.6.** Confirmades A1 i N1 amb els mòduls reals de host, configuració i port, substituint només les fronteres d’UI/identitat/importació: rebutjar `configura({backend:{}})` i cridar després `arrenca()` acaba important el fallback de Supabase; declarar `backendId: wordpress` sense adaptador també segella eixe fallback. Cal fallar explícitament fins a rebre una configuració vàlida. No s’ha reproduït cap enviament de credencials a un destí equivocat.

La mitigació de `PerfilProvider` és parcial: la clau combina usuari i entrada de sessió ([src/sections/profile/PerfilContext.jsx:150](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/PerfilContext.jsx>)). Un remuntatge A→B ajuda si arriba a executar-se; un avís per si sol no garantix la invalidació A→fora→A ni tots els resultats pendents. La renovació de credencials del mateix actor és un cas diferent d’una nova identitat. La reinjecció sense marcar renovació incrementa l’entrada ([src/data/identitat.js:306](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/identitat.js>)); el conflicte de Notes requerix una operació pendent i no prova pèrdua automàtica del text.

**A4 reproduït:** un `logout()` síncron vàlid que retorna `undefined` provoca `TypeError` en `.catch` ([src/host.js:256](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js>)). L’època de sessió i l’avís no arreglen este retorn. Cal normalitzar retorns síncrons/promeses i errors; l’ACK del pont ha de reflectir la finalització real, no només haver rebut l’ordre.

**Acceptació conjunta:** A→B, A→fora→A, renovació d’A, injecció rebutjada, logout síncron i promeses resoltes/rebutjades. Cap resultat antic entra al nou àmbit; renovar conserva el desat legítim. Afegir múltiples intents de configuració, inclòs vàlid→invàlid, i comprovar que no se silencien errors.

### 10. P2 — El contracte d’amfitrió necessita GET, sessió, llengua i caixa reals

**Fable §2.3, §4.3–4.4 i H1–H6.** `base-path` tria router i basename, però no crea subrutes a WordPress ([src/app/contexts/politicaRouter.js:129](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/politicaRouter.js>)). L’[_wiki_de_poble/02_saber/estandard_integracio_react.md:91](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/02_saber/estandard_integracio_react.md>) ja exigix servir el contenidor a totes les subrutes. Cal incorporar-ho a D10. A més, «manté la sessió» no és automàtic: el bookmarklet obri una pestanya amb `noopener` i l’amfitrió ha de reinjectar-hi la sessió. Fable ho reconeix a §4.4, però la promesa de §2.3 és més ampla.

**Acceptació:** obrir i recarregar una ruta profunda en pestanya nova torna HTTP 200, component, ruta i consulta correctes; autenticar no crea la nota abans del clic. No s’ha acreditat un 404 real de Studio en este torn.

H3 es confirma amb React en memòria: `html lang=es` guanya sobre preferència `ca` i la sobreescriu. Hi ha una omissió addicional: `setLanguage()` actualitza configuració, però [src/app/contexts/UIContext.jsx:19](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/UIContext.jsx>) només la llig en inicialitzar l’estat; canviar `externalConfig.language` després del muntatge no actualitza la UI. Cal precedència explícita i sincronització, sense reiniciar tota l’app.

H1 i H2 són reals: els `rem` depenen de l’arrel del document i el portal de [src/components/universal/PageFrame.jsx:102](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx>) ix a `document.body`, fora del Shadow DOM. Exigir 16 px al host només imposa una restricció; no resol l’aïllament. Cal una escala interna compatible amb zoom i una destinació de portals amb estils, focus i tancament verificats. No alterar globalment l’`html` de Sollutia.

La identitat de la Torre per defecte és adequada només per al banc de proves; una absència de configuració no pot identificar silenciosament qualsevol poble amb l’exemple. L’alçada de la caixa és responsabilitat de maquetació del host: falta un exemple complet, no una nova API universal basada en barres de WordPress. Finalment, [src/embed.jsx:58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/embed.jsx>) adopta qualsevol `#root` buit; convé un arrencador explícit del lloc propi per evitar competir amb l’app amfitriona.

### 11. Contraauditoria del meu tall de WordPress

Accepte els defectes contrastats encara que afecten treball meu. Separe els errors de les proves absents i dels límits ja declarats.

| Objecció de Fable | Resposta i conseqüència |
| --- | --- |
| C1–C2: configuració per CLI i recorregut administrador no provat | Correcte el límit. El README sí explica shortcode, plantilla i Edició ràpida; «un tercer no ho pot reproduir» és excessiu. Falta validar l’experiència d’administrador amb tema de blocs i ajudar-lo a trobar la plantilla. |
| C3: paràgraf buit després del shortcode | El camí de codi ho permet. Els 20 px són la mesura de Fable, no una reproducció nova. Definir pàgina dedicada i provar contingut residual; no esborrar contingut editorial silenciosament. |
| C4: CSS tardà del tema | Confirmat en memòria: `body.page{padding-top:80px}` posterior guanya. Reforçar el reset només en la plantilla dedicada i provar ordre/especificitat. No és una fallada observada amb el tema local anterior. |
| C5: proves insuficients | Cert: algunes assertions de marges ja passen sense el CSS. Les de `min-height` sí distingixen `auto`, `0` i `32rem`. Falta geometria real, administrador i registre/execució del shortcode. El skip sense PHP és explícit; la política de CI ha d’exigir-lo si esta comprovació és obligatòria. |
| C6: `package.json` escrit sense executor/lease; sospita de manca de confinament del hook | No acreditat. P-02 enumera risc, governança i volum; P-05 exigix incloure configuració al context, no convertix tota edició de package.json en operació d’alt risc. Timestamps i diferències entre clients no acrediten per si sols una infracció. L’activació real del hook continua sense certificar-se. |
| C7: README modificat després del tall funcional | Cronologia declarada; no és un defecte funcional per si mateixa. |
| C8: paquet de desenvolupament | Cert i ja declarat. Bloqueja distribució de producció, no invalida les comprovacions locals. |

Els 32/46 px i el tall de 782 px coincidixen amb el core de WordPress inspeccionat. Això no substituïx una prova autenticada ni acredita qualsevol tema amb hooks d’admin bar alterats. El mode editorial H5 és legítim; no cal forçar fullscreen en totes les pàgines amb shortcode. `wp_head()`, `wp_body_open()` i `wp_footer()` han de continuar disponibles.

### 12. Ordre integral proposat

1. Fixar contracte i autoritat del port neutral; corregir arrencada i sessió. Acreditar capacitats del servidor real per a cada funcionalitat, sense assumir que tots els backends tenen l’esquema de Supabase.
2. Tancar DTO de captura, privacitat abans de navegació, idempotència i referències versionades. Definir el camí GET/autenticació d’aterratge.
3. Implementar la vista personal sobre Notes amb paginació i límits. Validar embedding, idioma, portals, focus i accessibilitat amb el host.
4. Afegir importació amb abast explícit; després lector RSS amb operació, quotes i permisos propis. ActivityPub requerix una decisió posterior i contracte específic.

El «pas zero» de Fable és útil si es reformula com **verificar dependències reals abans d’activar cada funció**. Els comentaris del repositori no proven que sis migracions falten en totes les bases de dades. No s’ha inspeccionat l’esquema remot en este torn. Ni l’auditoria, ni la correcció de llengua, ni un ajust de presentació necessiten quedar bloquejats per totes eixes migracions. No se n’ha aplicat cap.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Fonts i mètode

- Lectura íntegra de Fable, del pla predecessor i del prompt nou; lectura obligatòria de `AGENTS.md`, genotip, índex i taxonomia. S’ha reutilitzat la lectura íntegra del context d’Escriptori de la sessió anterior i revisat el context canviat, inclosa la norma d’higiene actualitzada. Els prototips del laboratori no s’han tractat com a codi instal·lat.
- Tres revisions independents: dades/captura/importació; host/WordPress i contraauditoria; context i governança. Les conclusions s’han contrastat entre carrils; no es presenta el nombre d’agents o d’eines com a prova.
- Proves en memòria amb font real i fronteres simulades: DTO remot de captura, normalització/referències publicables, reintent local, construcció d’URL fictícia, arrencada/fallback, logout síncron, CSS tardà i React/idioma. Cap consulta de negoci, compte, publicació ni modificació de Studio. No és una prova integral de desplegament.
- Per reproduir cada cas: carregar els mòduls citats; usar dades sintètiques i transport/emmagatzematge en memòria; inspeccionar el payload o l’estat abans/després. Les observacions específiques i la frontera simulada consten en les troballes. Els criteris d’acceptació són proves futures proposades, no resultats que ja passen.
- Fonts externes primàries consultades: OWASP, W3C i documentació oficial de Mastodon, citades al costat de les afirmacions. No s’ha verificat compatibilitat RSS amb totes les plataformes.

### Verificació documental i tancament

- `document.mjs check`: informe i pla vàlids, sense errors. Revisió final de dos carrils incorporada: precisió sobre el camp `objecte` i sobre l’abast de C6.
- `tancament --check`: no vàlid. Plantilles, autoritat, catàleg de skills i compilació estricta de Wiki passen. Fallen checksum de LEDGER, segell de governança i una acta òrfena de la sessió concurrent (`260930_1645_ACTA_MARMOTA_Auditoria_Coworking.md`); també manca el relleu protegit d’este torn en ESTAT/LEDGER.
- El primer pas de SCC rebutjava els sufixos `:línia` en els destins Markdown, encara que són vàlids al visor de Codex. S’han conservat les línies a les etiquetes i els enllaços apunten al fitxer, per compatibilitat amb el validador del repositori.
- No s’ha forçat `--close`, falsificat estat ni signat canvis aliens. El torn queda `planned`; l’auditoria entregada no equival a tancament mecànic. El candidat temporal de relleu requerix relectura i hashes actualitzats abans de qualsevol execució.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

L’encàrrec autoritza una auditoria, no implementació. En este torn no s’han editat fonts d’app, plugin, proves o configuració de desplegament; no s’ha committat, publicat, mogut ni arxivat cap document. La còpia temporal de Fable preserva la lectura malgrat l’arxivat concurrent de l’original. No es modifica l’informe de la companya ni s’atribuïx una resposta seua a esta rèplica.

No es coneixen encara els endpoints i garanties definitius de Sollutia. Sense eixe contracte no es pot certificar enxufabilitat de producció. Tampoc s’ha acreditat desplegament de migracions, compatibilitat universal de temes, recorregut autenticat d’administrador, consum de memòria en dispositiu real o federació en funcionament.

El relleu mínim d’ESTAT/LEDGER està preparat fora del repositori, sense executar. El segell de governança està divergent per canvis concurrents; [.agents/PROTOCOL_PETORRETA.md:106](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/PROTOCOL_PETORRETA.md>) exigix reconciliació revisada i l’executor retorna «Segell previ invàlid; reconciliació explícita requerida» ([tooling/gates/executor-mutacio.mjs:42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/executor-mutacio.mjs>)). No s’han ratificat canvis aliens per forçar un verd. No falta permís per a esta auditoria: falta integritat prèvia per al relleu protegit.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260930_1650_pla_implementacio_codex_adversarial]]
- [_wiki_de_poble/90_arxiu_historic/260930_1550_auditoria_claude.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/90_arxiu_historic/260930_1550_auditoria_claude.md>)
- [_wiki_de_poble/90_arxiu_historic/260930_1545_pla_implementacio_coworking.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/90_arxiu_historic/260930_1545_pla_implementacio_coworking.md>)
- [_wiki_de_poble/90_arxiu_historic/260930_1625_auditoria_codex.md](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/90_arxiu_historic/260930_1625_auditoria_codex.md>)

## Proposta d'Automillora

**Si m’hagueres donat primer la versió final de Fable amb ruta estable, hash, límit exacte d’autoritat i estat real dels servidors, hauria sigut més eficient i precís.** Si m’hagueres demanat «contrasta estes hipòtesis amb proves i distingix allò implementat d’allò proposat», hauria necessitat menys treball de reconstrucció que amb «auditoria contundent» o «cirurgia extrema».

1. **Font temporalment coherent.** El prompt diu a les 16:25 que Fable ha acabat; la font final és de les 16:42. Substituir `Tall d’evidència: HEAD` per commit més estat del worktree, versió/hash de l’informe i fitxers rellevants modificats. No arxivar fonts que encara llig una altra IA. La nova norma d’higiene ja ho recull; falta complir-la en la coordinació.
2. **Preflight sense contradiccions.** «Només fitxers de la sessió actual» no ha d’expulsar fonts actives de la sessió predecessora. «Rebutja si falta pla» entra en tensió amb «pla si cal» i amb auditories sense implementació. Exigir un pla d’abast breu per a l’auditoria i reservar l’aprovació del redisseny per a quan es demane executar-lo.
3. **Una sola autoritat arquitectònica.** Definir què vol dir «backend intercanviable» i què queda segellat. Mantindre separats proveïdor, node, amfitrió, poble de presentació i àmbit de dades. Resoldre també la frase «ni regles de reescriptura» de l’estàndard d’integració davant de l’exigència de servir totes les subrutes amb `base-path`.
4. **Context suficient i delimitat.** Donar rutes completes —la taxonomia viu en protocols tècnics— i una llista de fonts actives amb motiu. La lectura de tot l’Escriptori inclou molt laboratori alié a WordPress; conservar accés íntegre però delimitar el tall rellevant. El rebut acredita entrega i el hash acredita contingut, no comprensió ni veracitat.
5. **Resultats comprovables.** Exigir per troballa severitat, estat (reproduït/inferit/proposat), font i línia, impacte, correcció i prova d’acceptació. «Vigila el pes» s’ha de convertir en pressupost de bundle, paginació, retenció i cicle de vida sobre una línia base mesurada. No obligar a descobrir fugues que les proves no demostren.
6. **Governança sense falsos tancaments.** Distingir «informe entregat», «redisseny aprovat» i «torn tancat pel verificador». Les anotacions manuals de LEDGER no substituïxen l’estat mecànic. Fer que `create` puga reutilitzar el rebut emés per `context`, perquè ara torna a entregar context i genera rebuts duplicats. Model i tokens han d’acceptar `N/D` quan no hi ha telemetria fiable.

Redacció recomanada per a la pròxima rèplica:

> Audita íntegrament l’informe [ruta, versió i SHA-256] i el codi del tall [commit i estat local]. L’objectiu és validar la seua viabilitat amb un port neutral de backend i amb WordPress/Sollutia. No implementes, apliques migracions ni desplegues. Pots fer reproduccions locals en memòria amb dades sintètiques. Distingix errors actuals, riscos de la proposta i proves absents; contrasta també les objeccions al teu treball anterior. Per a cada troballa material, dona evidència, alternativa i criteri d’acceptació. Llig les fonts actives enumerades; no les mogues mentre hi haja lectors. Entrega l’auditoria a l’Escriptori, amb les limitacions del tancament mecànic i una Proposta d’Automillora final.
