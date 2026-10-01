---
type: informe
status: esborrany
description: "Auditoria del 400, tenant runtime i ampliació T4: rutes SPA/WordPress, enllaços profunds i SEO per a l’enxufabilitat amb Sollutia."
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0324e036-3684-48ed-99fb-11e762202973:4f5c80de-5ab1-4400-aa30-3a09c7d9049e
---
# Auditoria Codex: seguretat, tenant i enxufabilitat WordPress/Sollutia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0324e036-3684-48ed-99fb-11e762202973:4f5c80de-5ab1-4400-aa30-3a09c7d9049e |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T19:07:11.356Z |
| Modificació | 2026-10-01T19:31:31Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, família GPT-6; variant no acreditada |
| Tokens consumits | N/D: comptador fiable no disponible |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-01: auditoria autoritzada expressament al xat després d'incorporar el Pla d'Implementació als prompts. Lectura dels dos prompts, del pla independent i de l'índex actiu complets. Comprovacions locals i remotes de només lectura, aproximadament entre les 21:00 i les 21:15, Europe/Madrid. Informe creat pel circuit documental. Cap canvi al codi de l'aplicació, al plugin ni a la base de dades.

2026-10-01, ampliació 1.1.0: llegits sencers l'índex i el prompt Codex actualitzat, inclòs T4 i l'objectiu 3 del Pla incrustat; rellegits també els altres documents actius de primer nivell. El document independent del Pla continua amb camps pendents i el prompt de Claude conserva dos objectius. L'abast executable d'esta ampliació és l'auditoria i el disseny de rutes: l'aplicació del consens i el desplegament continuen assignats a MarIA. S'amplia este mateix informe i torn documental, sense generar-ne còpies ni modificar codi crític.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**El 400 reproduït en producció és un desajust d'esquema: falta `public.section_submissions.updated_at`. El paquet publicat sí que porta el tenant indicat.** Canviar `configAmfitrio.js` per a exportar-lo no corregiria este 400. La cadena literal `"undefined"` és una altra entrada defectuosa que el codi actual deixa passar; s'ha reproduït amb transport simulat, però no s'ha observat com a tenant del paquet publicat.

L'enxufabilitat està preparada en forma de port i API d'arrencada, però **el marcatge WP actual depén del tenant de compilació** i la Frontissa de Sollutia no té cap recurs real habilitat. No es pot certificar ni connexió real amb Sollutia ni paritat total amb Vite.

Instantània local: `HEAD 120bc1328e14c1648c6a981ff80e52006968ef5e`. En començar no hi havia canvis a `src/`, `wordpress-plugin/`, `tests/`, `tooling/` ni als manifests npm. Durant el tancament ha aparegut una edició aliena de `wordpress-plugin/readme.txt` i un altre pla del Calendari; s'han llegit i conservat. Ja hi havia moviments documentals i canvis de governança d'altres carrils. Cap canvi de codi és d'este torn de Codex.

### C1 · P1 · El frontend publicat requerix una columna que el servidor no té

**Evidència directa.** [gentdelatorre.net](https://gentdelatorre.net/) servix el bundle `1.0.1`, generat a `2026-10-01T18:01:56.269Z`. El [manifest públic](https://gentdelatorre.net/wp-content/plugins/socdepoble-enxufe/dist/sdp-release.json) declara el node `https://adjlvwtxhpclgmnsvwpm.supabase.co`, mode `remote` i tenant `11111111-2222-3333-4444-555555555555`. L'arxiu remot descarregat i `wordpress-plugin/dist/soc-de-poble.standalone.js` són idèntics: 3.407.219 bytes, SHA-256 `9531c556696dba8774fe4de2ded427d52db494ee7eeb2737e6927a2c3ae1be46`. L'URL de l'HTML incorpora el mateix prefix d'empremta. També s'ha comprovat l'UUID dins de la configuració executable del bundle, no només dins de textos documentals que viatgen en ell.

Cinc GET al node públic, amb la seua clau `anon` pública i `limit=0`, sense recuperar files ni fer cap escriptura:

| Recurs i selecció | Filtre tenant | HTTP | Resultat |
| --- | --- | --- | --- |
| `app_content?select=key,version` | UUID indicat | 200 | Consulta acceptada, zero files per `limit=0` |
| `section_submissions?select=id` | UUID indicat | 200 | Consulta acceptada |
| `section_submissions?select=id,payload,title,created_at,updated_at,owner_user_id,author_org_id&section_id=eq.mur&order=created_at.desc,id.desc` | UUID indicat | 400 | `42703`, columna `section_submissions.updated_at` inexistent |
| `section_submissions?select=id,updated_at` | UUID indicat | 400 | Mateix `42703` |
| `section_submissions?select=id,author_org_id` | UUID indicat | 200 | La columna d'autoria sí que es resol |

En tots els casos el paràmetre és `tenant_id=eq.11111111-2222-3333-4444-555555555555`. La resposta de l'error conté `message: "column section_submissions.updated_at does not exist"`, `details: null` i el suggeriment de `created_at`. Estos 200 validen la forma de la consulta i l'esquema seleccionat; **no proven l'existència del poble ni el contingut de les seues files**.

**Línies afectades:** `src/data/supabase/content.js:104–137`, particularment la selecció de `updated_at` a la línia 122. `loadMur()` demana Mur, esdeveniments i mercat dins d'un `Promise.all`; `loadMultimedia()` compartix el carregador. La migració `supabase/migrations/2609261200_publicacions_autoria.sql:23–24` crea la columna i les línies 28–43 creen el trigger que actualitza la data d'edició. La definició del trigger evoluciona també a `2609261500_identitat_perfil_f1.sql:336`; s'ha de respectar l'ordre complet de migracions.

**Impacte:** les seccions que seleccionen explícitament la columna fallen encara que l'arrencada i el contingut bàsic funcionen. La captura del navegador mostra el Xat i l'indicador «Connectat al node de La Torre»; eixe indicador no acredita totes les consultes.

**Proposta:** MarIA ha de contrastar l'historial de migracions real amb el repositori, les dependències i la definició final del trigger; provar el conjunt additiu en canari i desplegar l'esquema compatible abans del frontend que el requerix. No s'ha d'executar a cegues una migració antiga sencera: la presència d'`author_org_id` i l'absència d'`updated_at` demostren un esquema parcialment compatible, no quin procés va deixar-lo així. No eliminar el filtre del tenant, desactivar RLS ni degradar a dades de demostració. `requires_human_decision: false` per a la diagnosi; l'aplicació i el desplegament corresponen al pas de MarIA del pla autoritzat.

### C2 · P2 · La validació accepta `"undefined"`, `"null"` i un slug com a tenant

**Línies:** `src/config/backendConfig.js:5–14` normalitza àlies sense validar el tipus/UUID; `src/PedraSecaEmbed.jsx:201–230,318–388` permet `tenantId` sense sanejador tipat; `src/data/supabase/runtime.js:34–44` només convertix valors falsos a `null`; `content.js:19,68,98,110` comprova presència, no forma.

**Reproducció aïllada:** amb URL sintètica, clau pública sintètica i `fetch` simulat, `loadMur('audit-user', { ...configRemota, tenantId: 'undefined' })` emet quatre GET amb `tenant_id=eq.undefined`. Amb `'null'` o `'la-torre-de-les-macanes'` també emet quatre GET invàlids. Amb `undefined`, `null` o `''` reals rebutja abans de `fetch`. Són huit proves de caracterització, totes verificades; el seu verd confirma el comportament observat, inclòs el defecte, no l'aprovació de seguretat.

**Conclusió causal:** el codi vigent pot generar el símptoma comunicat si alguna capa aporta el text `"undefined"`. L'absència simple del camp no basta per explicar-lo. No hi ha evidència d'eixa entrada en l'HTML públic inspeccionat; podria correspondre a un altre estat de pàgina, una sobreescriptura o un paquet anterior, però són hipòtesis. Cal conservar, si reapareix, l'URL completa fallida, el cos JSON d'error i l'empremta del bundle, sense cap capçalera d'autenticació.

**Proposta:** validador canònic d'abast al límit de l'adaptador Supabase, amb error estable abans de qualsevol GET/POST/RPC dependent del poble. Admetre només text UUID hexadecimal `8-4-4-4-12`, normalitzat; no exigir UUID v4 perquè el tenant indicat té una altra forma. Aplicar-lo també a l'entrada runtime i PHP si s'obri eixe canal. Un valor explícitament invàlid ha de produir error, no recórrer silenciosament al tenant del paquet. Mantindre `poble` com a slug visual independent. Les API neutres poden conservar identificadors d'altres adaptadors; la forma UUID pertany al contracte Supabase. `requires_human_decision: false`.

### C3 · P1 respecte al requisit del torn · WP no transmet un tenant dinàmic, encara que el nucli admet configuració runtime

**El panell no és la font d'eixe UUID.** `wordpress-plugin/includes/ajustos.php:151–170`, concretament la línia 166, pinta «Village data scope» des de `$manifest['node']['tenant']`. És diagnosi del paquet. Les opcions editables només són `nomPoble` i `poble` (`ajustos.php:27–40,66–90`). Rectifique així la sospita inicial que el panell descriguera una configuració editable perduda en trànsit.

**Traça del flux actual:**

| Etapa | Implementació i línies | Què passa amb el tenant |
| --- | --- | --- |
| Compilació | `vite.standalone.config.js:199–232,303–329` | Llig `VITE_TENANT_ID`, escriu metadades de release i valida la forma per a una release |
| Panell WP | `includes/manifest.php:25–42,76–92`; `includes/ajustos.php:151–170` | Llig i mostra el manifest; no configura el navegador |
| HTML WP | `includes/marcatge.php:96–124,134–143,188–198,236–261` | Global només de presentació; no emet `tenant-id` ni `configura()` |
| Global públic | `src/config/configAmfitrio.js:22,109–121` | Descarta `tenantId` expressament |
| Element | `src/PedraSecaEmbed.jsx:263–315,318–388,575–584` | Pren el tenant del paquet, llevat d'una capa explícita superior |
| Arrencada runtime | `src/host.js:63–76`; `src/config/backendConfig.js:5–14` | `configura({config:{tenantId}})` o `tenant_id` sí que es normalitzen |
| Consultes | `src/data/supabase/runtime.js:34–44,60–81`; `content.js:104–123` | Usa la configuració resolta; connexió directa a Supabase |

El global observat és `{nomPoble:'La Torre', poble:'latorre'}`; l'element declara `poble="la-torre-de-les-macanes"`, que té precedència. Cap dels dos és l'UUID de dades. Eixa diferència de slugs no prova cap canvi de tenant.

**Abast de l'acoblament:** les variables `VITE_*` es substituïxen durant la compilació; el WordPress desplegat no llig el `.env` del desenvolupador. El paquet, però, conserva eixos valors compilats. Això és coherent amb el contracte antic «backend segellat», però no satisfà el nou requisit d'injectar el tenant des de l'amfitrió. [Documentació de Vite](https://vite.dev/guide/env-and-mode).

**Solució proposada dins de l'ordre actual:** reutilitzar l'API d'arrencada existent, mantenint separades presentació i configuració d'execució. WordPress ha de tindre una opció de tenant validada i emetre, abans del bundle, una única declaració global d'arrencada; la cua existent `SocDePobleCua` ja permet entregar `['configura', {config:{tenantId: UUID}}]` (`host.js:146–175,278–280`). La funció PHP ha de serialitzar-la amb `wp_json_encode` i `JSON_HEX_*`, amb l'opció gestionada per `manage_options` i Settings API. No concatenar literals ni permetre endpoints/credencials arbitraris des de shortcodes o blocs d'editors. Si es preferix ampliar `SocDePobleConfig`, cal versionar el contracte i fer que l'entrada runtime passe pel mateix validador; canviar només l'exportació de `configAmfitrio.js` és insuficient.

**Precaució d'ordre comprovada al codi:** `embed.jsx:56–61` exposa l'API/cua abans de programar l'arrencada. En canvi, `main.jsx:15–37` fixa primer la configuració de Vite i després exposa la cua. El patró anterior no és encara uniforme en les dues entrades. Cal un resolutor compartit i una sola crida a `configura()` abans de `arrenca()`, amb precedència explícita, estat d'error visible i sense captura de l'error seguida d'arrencada amb un altre tenant. Vite ha de participar en el mateix contracte runtime; el `.env` pot quedar com a valor de desenvolupament quan no hi ha declaració explícita.

També cal que el perfil de paquet portable no exigisca `VITE_TENANT_ID` de compilació: ara la porta de release i l'empaquetador l'exigixen. Distingir de forma explícita «tenant segellat» i «tenant runtime obligatori», amb validació abans de trànsit en el segon perfil. El manifest i la diagnosi han d'indicar la font i el valor efectiu, no presentar un valor de compilació com a configuració activa. `requires_human_decision: false` per a preparar la proposta: el torn ja ordena la injecció dinàmica. L'elecció fina de format es consolida amb MarIA abans de modificar codi crític.

### C4 · P1 d'integració · Sollutia té una frontera preparada, però cap connexió de dades activa

`src/data/adaptadors/sollutia/client.js:4–15` té `apiOrigin:null`, `allowedOrigins:[]`, `resources:{}` i falla amb `UNKNOWN_RESOURCE`. `recursos.js` definix un traductor de perfil, però no està cablejat al catàleg actiu. La cerca d'importacions en `src/` no mostra consumidors de `client.js` fora d'eixa mateixa frontera. `creaFrontissa.js` imposa HTTPS, origen exacte, GET, `credentials:'omit'`, `redirect:'error'`, límits de mida/temps i descodificació del DTO; les proves i el tractor corresponents passen.

La documentació vigent `ADR-2026-09-SOLLUTIA-MODEL-B.md` diu «Supabase de SdP autoritatiu i Sollutia només per GET» i prohibix substituir el port. El codi `host.js:63–74` sí que admet un adaptador complet, validat i segellat per `backendPort.js:18–55`. El prompt del torn descriu alhora un backend intercanviable. Cal actualitzar els contractes perquè expliquen amb precisió quina via s'usa; la prioritat de l'ordre humana actual és la injecció runtime i la modularitat, sense convertir això en una migració de backend implícita.

**Proposta:** conservar el port neutral; quan Sollutia entregue un recurs, afegir captura real, fixture, descodificador, origen exacte, autenticació pròpia d'eixe servei i proves de contracte. No reenviar automàticament el JWT de Supabase a Sollutia. Si es vol reemplaçar tot el backend, fer un adaptador complet del contracte, no canviar `supabaseUrl` per qualsevol API REST: `runtime.js:80`, `content.js:120–123` i `publicCredentials.js:9–10` pressuposen PostgREST/Supabase. `requires_human_decision: true` només per a substituir la font de veritat o ampliar a escriptures creuades, cosa no concretada en el pla.

### C5 · P1 preventiu · La release verifica bytes i configuració, però no compatibilitat amb l'esquema remot

`vite.standalone.config.js:222–232` comprova versió, origen públic, mode i tenant. `wordpress-plugin/eines/empaqueta.mjs:324–367` comprova les metadades, inventari i hashes. Estes comprovacions són útils i passen, però no acrediten que el backend tinga `updated_at`. El paquet real amb empremta coherent i consulta 400 n'és la reproducció.

**Proposta:** registrar la versió mínima d'esquema/capacitats en la release i exigir un preflight de contracte contra canari i node de destí abans del desplegament. Per a este incident: repetir exactament la selecció de C1, provar el trigger d'edició en canari i les RLS amb dos tenants i dos usuaris. Instal·lar els fitxers com un paquet coherent i purgar la memòria cau de pàgina/CDN després; conservar l'artefacte anterior per a tornar arrere. Una empremta igual no substituïx una prova d'esquema ni una comparació visual. `requires_human_decision: false`.

### C6 · P2 de verificació · Una prova del README ja falla en el punt de partida

`tests/enxufe-pantalla.test.mjs:262` espera `<code>&lt;soc-de-poble&gt;</code>` en la descripció del plugin, però la prova real no ho troba amb el README actual. Resultat de la bateria PHP/pantalla/traducció/escaneig sintètic de secrets: **55/56**. No s'ha modificat cap d'eixos fitxers. Cal alinear el fixture/assert amb el contracte documental esperat, sense relaxar la prova d'escapament HTML. No és la causa del 400. `requires_human_decision: false`.

### C7 · P1 respecte a T4 · El router ja suporta History API, però WP no li delega una base ni resol les subrutes

**Evidència de codi:** `src/app/contexts/politicaRouter.js:129–136` tria memòria si no hi ha `routerType: 'browser'` o base vàlida. `src/PedraSecaEmbed.jsx:83,103–107` fixa esta decisió al muntatge. `wordpress-plugin/includes/marcatge.php:236–261,305–350` no emet ni accepta una base de navegació al shortcode/bloc. La cerca en tots els PHP actuals del plugin no troba `add_rewrite_rule`, `query_vars` ni `redirect_canonical`. La plantilla a pantalla completa (`marcatge.php:487–508`) només actua després que WP haja resolt una pàgina: no és un fallback d'enrutament.

**Comprovació pública nova, 01-10 a les 21:25–21:27 Europe/Madrid:**

| GET anònim | HTTP final | HTML observat |
| --- | --- | --- |
| `https://gentdelatorre.net/` | 200 | Element `soc-de-poble` amb `plugin-url`, `fonts-href` i `poble`; sense base. Canonical de la portada. |
| `https://gentdelatorre.net/enxufe/` | 404 | `Page not found`, `noindex, follow`, sense element SPA. |
| `https://gentdelatorre.net/enxufe/mercat` | 404 | Mateixa classe de resposta 404, sense element SPA. |

Per tant, `/enxufe` és el muntatge desitjat en el nou requisit, no un muntatge públic existent acreditat. No s'ha inspeccionat l'administració per determinar l'ID o l'estat de publicació de la pàgina. Les respostes acrediten els URLs consultats, no la configuració privada de WP.

El mecanisme compartit ja existeix: `RouterContext.jsx:44–66` llig el camí i `popstate`; `68–94` navega amb `pushState`/`replaceState` i una base; `167–195` genera els `href` dels `Link`; `329–330` exposa `BrowserRouter`. No cal un segon router de WP ni sincronitzar dos historials. `ruta-inicial` només inicia el router de memòria; no resol la recàrrega de subrutes ni substituïx la base. Les proves `PedraSecaEmbed.router.test.jsx:144–175` ja distingixen el comportament amb base i sense.

**Impacte:** el clic pot mostrar Mercat mantenint la URL de la pàgina amfitriona; afegir només `base-path` faria visibles les rutes però la recàrrega continuaria fallant sense suport del servidor. **Proposta:** mode de pàgina SPA explícit, resolució WP sota el seu prefix i configuració del router abans del primer muntatge, segons el contracte de davall. `requires_human_decision: false`: T4 ja autoritza dissenyar este mode; MarIA haurà de concretar l'ID real de la pàgina abans de desplegar-lo.

### C8 · P1 respecte al SEO de T4 · El contracte de metadades no està connectat al plugin actual

`src/hooks/useSEO.js:22–30` només modifica el document amb `manageDocumentHead === true` i anteposa `VITE_CANONICAL_URL` a l'origen real. Activar este flag en WP sense revisar el canònic pot fer que un paquet compilat per a un altre domini anuncie eixe altre domini. Esta possibilitat és una deducció del codi, no un valor de producció observat. `seoHead.js:48–55` aplica robots/canonical; la propietat no entra per `SocDePobleConfig`, però sí per les capes explícites de configuració de l'element. El canonical inicial de WP i el de React han de representar la mateixa ruta.

Hi ha, a més, deute concret en l'eina SEO: `tooling/gates/build-seo-manifest.mjs:97–102` intenta llegir `wordpress-plugin/inc/sdp-seo.php`, que no existeix en el plugin actual. El fitxer `wordpress-plugin/dist/seo-routes.json` tampoc existeix en este checkout; `node tooling/gates/build-seo-manifest.mjs --verifica` ix amb 1. El missatge de l'eina atribuïx els 404 a `sdp_resolve_request()`, però eixe consumidor tampoc és part del plugin actual: no s'ha de presentar el missatge com la causa demostrada del 404 de C7. Generar només el JSON no instal·laria cap rewrite ni cap consumidor PHP.

El productor encara pren detalls de seeds (`:120–125,214–224`) i manté àlies antics (`:106–115`). No és un inventari fiable de les publicacions reals de cada tenant. La política pública del productor (`tooling/wiki/lib/publication-policy.mjs:80–84`) i la del client (`useSEO.js:6–10`) són llistes diferents. Cal un descriptor compartit que separe ruta reconeguda, existència del recurs, accés i indexació, amb versió comprovada pel build. El sitemap d'un amfitrió no ha de publicar dades locals de demostració o d'un altre poble.

**Proposta:** unificar metadades i política de rutes; adaptar el generador al plugin actual i afegir-hi consumidor explícit. Un origen canònic runtime validat pot formar part del contracte neutral; en mode WP el valor per defecte ha de ser l'origen públic configurat de l'amfitrió, amb la base una sola vegada. No s'ha de derivar del tenant ni d'un paràmetre lliure de la petició. `requires_human_decision: false` per a la proposta; no es declara SEO complet ni indexació real comprovada.

### Contracte proposat de rutes WP/Sollutia i seqüència T4

1. **Registrar el muntatge.** Afegir als ajustos administratius una pàgina SPA seleccionada per ID, publicada i amb el shortcode/bloc; derivar-ne el permalink. El perfil proposat usa `/enxufe`, amb una sola instància que controla l'historial. El shortcode inserit en un article ordinari manté el mode incrustat. No inferir la base a partir de la URL visitada: a `/enxufe/mercat` la base és `/enxufe`, no tot el camí. Per a instal·lacions WP en subdirectori, separar la base pública del router de la ruta relativa a `home_url()` que usa el motor de rewrite. No habilitar un comodí global a `/`.

2. **Resoldre les peticions en WP.** Un nou mòdul `wordpress-plugin/includes/rutes.php`, carregat des de l'entrada del plugin, registra a `init` regles ancorades al prefix declarat i les variables de consulta internes. Esquema conceptual: `^enxufe/(RUTA_ADMESA)/?$` → `index.php?page_id=ID_CONFIGURAT&sdp_spa_route=$matches[1]`. La ruta admesa ix d'un descriptor versionat, no d'una expressió que capture tot el lloc. L'ID és un enter de configuració, mai text de la URL. Cal validar el camí real, la regla que l'ha resolt i la pàgina escollida; una query string que invente `sdp_spa_route` no atorga propietat del document. La base mateixa es resol per la pàgina WP normal. [API oficial de rewrite](https://developer.wordpress.org/reference/functions/add_rewrite_rule/).

3. **Normalitzar sense segrestar WordPress.** Regenerar les regles després de registrar-les, quan canvien la configuració, el permalink/estat de la pàgina o la versió del contracte; retirar-les i regenerar-les en desactivar. Mai fer un flush per petició. Respectar admin, REST, recursos estàtics i pàgines alienes. Les rutes desconegudes han de conservar un 404 real; un backend temporalment indisponible no demostra que un recurs haja desaparegut. [Cost i ús de `flush_rewrite_rules`](https://developer.wordpress.org/reference/functions/flush_rewrite_rules/).

4. **Evitar redireccions que perden la subruta.** Només per a una petició identificada i validada com a SPA, impedir que WP la redirigisca al permalink de la pàgina contenidora. Definir una política única de barra final i una sola redirecció de normalització quan calga, preservant els paràmetres funcionals admesos. Fora del muntatge, el filtre retorna intacta la decisió de WP. No desactivar `redirect_canonical` globalment. [Filtre oficial](https://developer.wordpress.org/reference/hooks/redirect_canonical/).

5. **Injectar una única configuració abans del boot.** Reutilitzar C3 i la cua `SocDePobleCua`: una acció `configura` amb `config: { tenantId: UUID_VALIDAT, basename: '/enxufe', routerType: 'browser', manageDocumentHead: true }`, només en la pàgina propietària. És el payload proposat, no una ordre de consola a executar després del muntatge. PHP l'ha de serialitzar amb `wp_json_encode` i els flags d'escapat ja presents. No enviar sessions o secrets en este payload. `basename` separa l'enrutament de `plugin-url`/`fonts-href`; no canviar la ubicació dels recursos a `/enxufe/assets`. Alternativament, el contracte actual permet `base-path`, però també participa en la resolució de recursos (`assetResolver.js:106–125`): cal mantindre explícit `plugin-url` i provar-ho. Ni `poble` ni la ruta seleccionen l'UUID de dades.

6. **Deixar que el router siga l'únic propietari de la navegació.** En entrar a `/enxufe/mercat?filtre=x`, `BrowserRouter` llig `/mercat` i la consulta. Els `Link` i `navigate('/mur')` generen `/enxufe/mur`; `popstate` recupera la vista en arrere/avant. No afegir listeners paral·lels que repliquen `pushState`. La configuració ha d'arribar abans de muntar, perquè la tria del router es fixa amb `useState`. Un canvi de base en una sessió viva requerix un remuntatge explícit i proves de sessió.

7. **Cobrir els enllaços natius i les barres finals.** Els `Link` del router ja prefixen el `href`, però el contingut HTML pot portar `<a href="/mercat">`. `src/app/enllacosInterns.js:77–95` corregix la destinació del clic ordinari, i exclou expressament Ctrl/Cmd, botó central, `target` i `download`. Això no reescriu l'atribut per a «copiar enllaç» o «obrir en pestanya nova»: cal resoldre els `href` interns al render amb un helper compartit que pose la base una vegada. No prefixar assets, URL externes o àncores pures. A més, `RouterContext.jsx:254` casa les rutes exactes i no admet automàticament `/mercat/`; definir la mateixa normalització en PHP i JS per evitar 404 d'interfície després d'un HTTP 200. Són riscos de paritat deduïts del codi, pendents de la prova integrada proposada.

8. **Un sol contracte de metadades.** WP emet en l'HTML inicial títol, descripció, canonical i robots de la subruta; React els actualitza després d'una navegació, amb els mateixos valors i criteris. El filtre `get_canonical_url` permet adaptar el canonical del core per a la pàgina seleccionada; cal coordinar el proveïdor SEO que hi haja instal·lat perquè no n'emeta un segon. [API oficial de canonical](https://developer.wordpress.org/reference/hooks/get_canonical_url/). Les rutes privades reconegudes poden carregar la closca amb `noindex`, conservant autenticació i autorització de dades; `noindex` no és un control d'accés. Query strings de seguiment no són canòniques; paràmetres que identifiquen contingut, com `?item=...`, necessiten una política explícita perquè no es col·lapsen totes les fitxes en una URL de llista. Mai posar credencials o retorns OAuth al canonical o al sitemap.

9. **Verificar rastreig i recursos publicats.** History API i enllaços `href` reals faciliten el rastreig, però no certifiquen indexació. Cal contingut públic renderitzable, estats HTTP coherents i un únic canonical; per a bots sense JavaScript, metadades inicials i, si l'objectiu ho requerix, prerender públic generat pel mateix frontend. Google documenta suport per a web components: el Shadow DOM tancat no basta per declarar una pàgina invisible; cal inspeccionar l'HTML renderitzat amb les eines de Google. [Guia oficial de JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). El servidor de metadades només pot usar recursos explícitament públics del tenant, amb origen API fixat i timeout; la URL de petició no pot ordenar fetchs arbitraris. No reutilitzar els seeds com a catàleg de producció.

10. **Mantindre el connector intercanviable.** La UI només coneix base, política de head i adaptador de dades. WP aporta resolució de servidor i marcatge; Sollutia ha de servir la mateixa closca sota el prefix acordat, mantindre els estats HTTP i injectar el mateix contracte. El backend de continguts i la ruta del navegador són decisions separades. Actualitzar la documentació activa de l'enxufe que encara prohibix rewrites per a explicar els dos modes: incrustació en memòria i pàgina SPA amb prefix cedit. La petició T4 autoritza esta evolució; no cal canviar globalment el comportament de totes les incrustacions.

Alternatives descartades: activar `routerType: 'browser'` globalment sense base, perquè podria ocupar les rutes de WP; o usar `#/mercat`, perquè no satisfà el requisit d'URL `/enxufe/mercat` i no és l'estratègia de rastreig proposada. Mantindre només memòria continua sent adequat per a un widget, però no resol T4.

### Matriu d'acceptació de T4 per a MarIA

| Escenari | Resultat exigible abans d'alliberar |
| --- | --- |
| GET `/enxufe/mercat`, amb JS desactivat | 200, closca de la pàgina correcta, canonical de Mercat i política d'indexació coherent. |
| Carregar eixa URL i clicar Mur | Vista correcta, `/enxufe/mur`, cap recàrrega completa i tenant invariant. |
| Recarregar, arrere/avant i pestanya nova | Mateixa ruta i consulta; `href` correcte tant en components React com en HTML de contingut. |
| `/enxufe/mercat/` i base amb barra final | Normalització consistent, sense bucle de redireccions ni 404 del router. |
| Ruta desconeguda o recurs públic confirmat absent | 404 real; incidència temporal d'API diferenciada; cap salt silenciós a Xat. |
| `/wp-admin`, `/wp-json`, fitxers i pàgines fora de base | Respostes pròpies de WP, sense captura de l'SPA. |
| Ruta privada, cerca o retorn d'autenticació | Sense indexació o filtració de dades/sessió; retorn dins de la base quan corresponga. |
| Dos amfitrions/tenants amb el mateix bundle | Configuració injectada efectiva abans de tota consulta; cap consulta amb `undefined`; cap tenant derivat del slug. |
| Dos elements en una pàgina i WP en subdirectori | Un sol propietari d'historial; la resta en memòria; base i recursos sense prefix doble. |
| Cache, tema clàssic/de blocs i mòbil/escriptori | Canonical/robots per ruta, assets correctes i comprovació visual amb el mateix estat de Vite. |
| Desactivar o canviar la pàgina del muntatge | Rewrites retirats/actualitzats i pàgines alienes intactes. |

Aplicació proposada en passos verificables: C1/C2 → boot runtime C3 → pàgina i rewrites C7 → navegació/enllaços → head/manifest C8 → canari de la matriu → paquet coherent C5. El canvi de servidor i la configuració de navegador s'han de desplegar coordinats: activar només una meitat deixa URL trencades. Estes són proves d'acceptació pendents, no resultats ja obtinguts.

### Fronteres de seguretat comprovades i garanties que no es poden atribuir

- L'HTML d'identitat usa `wp_json_encode` amb `JSON_HEX_*` (`marcatge.php:139–143`); els atributs passen per `esc_attr`/`esc_url` i el bloc té una allowlist de `wp_kses` (`305–321`). El marcatge revisat no publica cap clau de servei.
- Ajustos: `manage_options`, `settings_fields` i sanejament estricte de camps (`ajustos.php:27–57,122–129,177–203`). Actualitzador: verificació Ed25519 (`actualitzador.php:226–230`), descàrrega segura i comprovacions de paquet; acció administrativa amb capacitat i nonce (`844–847`). S'ha inspeccionat el codi i les proves locals, no la configuració privada del WP de producció.
- Les credencials públiques rebutgen una clau JWT de rol diferent d'`anon` (`publicCredentials.js:11–19`). La clau DeepL queda en el servidor (`traduccio.php:13–19`). No s'han llegit ni imprés secrets de `.env` ni tokens d'usuari.
- **No hi ha un proxy WP per a les consultes de contingut analitzades.** El navegador va directament a Supabase (`runtime.js:80`). El servei WP de traducció és una altra frontera; no aïlla els tenants de PostgREST.
- El tenant és un selector públic, no una credencial. Ni `Object.freeze`, ni el global, ni un Shadow DOM tancat impedixen que codi que ja s'executa en la pàgina actue amb els permisos d'eixa pàgina. La protecció de files ha de viure en permisos/RLS del servidor. [Documentació oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
- Hi ha RLS versionades per membres del poble i autoria a `2609080000_initial_schema.sql:725,763–792`, i una frontera explícita de contingut editorial a `2609200300_blindatge_storage_i_contingut.sql:72–83`. No s'ha comprovat que totes estes migracions estiguen aplicades en producció, ni executat una matriu d'autorització remota. No s'ha demostrat cap fuita entre tenants; un 400 no la prova.

### Seqüència concreta per a MarIA i criteris de paritat

1. **Restablir compatibilitat d'esquema (C1).** Inventari real de migracions, canari, columna/trigger en la versió final i repetició de la consulta amb UUID vàlid. Èxit: 200 i cap `42703`; la data de creació es conserva quan s'edita.
2. **Tancar entrades invàlides (C2).** Validador d'abast i error neutral. Èxit: zero peticions per absència, text `undefined`, text `null`, slug, objecte o UUID malformat; cap canvi silenciós de poble. La mostra UUID del torn ha de passar.
3. **Unificar boot i tenant runtime (C3).** Opció administrativa validada, emissió JSON segura abans del bundle, resolutor compartit Vite/element i una sola configuració/segellat. Actualitzar les proves que hui exigixen excloure tot tenant de WP (`tests/enxufe-plugin.test.mjs:177–203`), el contracte de marcatge i el perfil de release. Èxit: el mateix artefacte servix dos amfitrions amb tenant diferent sense recompilar; el tenant efectiu està disponible abans de la primera consulta.
4. **No prometre múltiples tenants simultanis dins del mateix document.** `sessionService.js:58–67` rebutja instàncies amb configuracions de sessió diferents. Mantindre eixe bloqueig o dissenyar aïllament per instància en un pla específic. També provar canvi d'abast sense reutilitzar sessió/cau/cues del tenant anterior.
5. **Aplicar T4 i validar paritat sobre el mateix node i dades de canari.** Seguir el contracte C7/C8 i la matriu anterior: WP ha de delegar el prefix abans del muntatge i resoldre les subrutes al servidor. Vite i WP amb mode remot i tenant igual: Mur, Calendari, Mercat, Notes, Xat, login/renovació/eixida, permisos, publicació i lectura. Les mutacions es proven només en canari. Comparar amplàries i alçades iguals, temes, fonts, modals, scroll, rutes i recursos sota subdirectori. El mode incrustat continua en memòria; el nou mode de pàgina SPA usa navegador, com `main.jsx:22`, amb la base pública acordada.
6. **Alliberar paquet coherent (C5).** Esquema mínim compatible, escaneig de secrets de l'artefacte final, inventari/hashes, canari WP, prova visual i procediment de retorn. Cap desplegament d'este torn.
7. **Connectar Sollutia (C4).** Només després de rebre contractes/fixtures/endpoints reals. El verd del tractor és una comprovació de la frontera tancada, no una acreditació de trànsit real.

Alternatives descartades: afegir l'UUID a qualsevol lloc del global sense traçar el boot (no corregix l'esquema ni la precedència), i forçar un UUID compartit o eliminar el filtre per a evitar el 400 (selecció de dades incorrecta). La solució proposada concentra la validació i la resolució en punts compartits, amb contractes que es poden mantenir sense conéixer WordPress.

### Coordinació i retroalimentació de la plantilla

S'han llegit íntegrament els documents actius de primer nivell: `261001_2003_prompt_codex.md`, `261001_2003_prompt_claude.md`, `261001_2050_pla_implementacio.md` i `00_index_escriptori.md`. En la comprovació final ha aparegut `261001_2110_pla_calendari_vistes.md`, també llegit sencer: és un esborrany amb seccions pendents, sense cap proposta tècnica que canvie esta diagnosi. El pla incrustat defineix bé els carrils; el document independent encara conté `[pendent]` en canvis, verificació i riscos. S'ha vinculat al torn com a referència, sense considerar eixos camps resolts. No hi havia encara una auditoria nova de Claude a contrastar. Este informe és l'aportació de Codex al consens, no una aprovació atribuïda a Claude. Els laboratoris i materials humans inventariats en l'índex no s'han tractat com a instruccions actives ni alterat.

Millores proposades de `prompt_local`: validar mecànicament la presència i contingut del pla incrustat; distingir clarament «auditoria/proposta» d'«implementació/desplegament»; demanar URL i cos JSON exactes de l'error, versió i hash de l'artefacte; separar valor del manifest i configuració runtime; declarar un manifest de context actiu que excloga laboratoris històrics i dades personals irrellevants; i actualitzar la definició de Model B perquè no contradiga l'ADR ni el contracte executable. No s'ha editat la plantilla.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `node --test tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs tests/standalone-build.test.mjs` | 47/47 |
| Vitest: `configAmfitrio`, `PedraSecaEmbed.config`, `supabase/runtime`, `tests/host` | 192/192 |
| Vitest: `creaFrontissa` i `PedraSecaEmbed.router` | 46/46, dos fitxers trobats; el filtre addicional `publicCredentials.test.js` no corresponia a cap fitxer |
| Proves adversarials temporals de C2 | 8/8, caracterització del defecte i dels bloquejos existents |
| Node: `enxufe-pantalla`, `enxufe-traduccio`, `dist-secrets` | 55/56; fallada C6, sense skips |
| `tractor-frontissa`, `tractor-enxufe`, `tractor-sollutia` | Passen |
| HTML, manifest i bundle públics per HTTPS | HTTP 200; hash del bundle local/remot igual |
| Cinc GET de compatibilitat amb `limit=0` | Tres 200; dos 400 per `updated_at` absent |
| Navegador, primera càrrega anònima | Xat visible i indicador de connexió; sense errors en els logs capturats |
| Repetició dirigida de la prova README després de l'edició concurrent | Continua fallant la mateixa asserció de la línia 262 |
| Ampliació T4: Vitest en set fitxers de router, enllaços i SEO | 318/318; comprova el nucli existent, no les rewrites proposades |
| Ampliació T4: GET públic de portada, `/enxufe/` i `/enxufe/mercat` | 200, 404 i 404 respectivament; cap mutació de WP |
| `node tooling/gates/build-seo-manifest.mjs --verifica` | Exit 1: falta `wordpress-plugin/dist/seo-routes.json`; el consumidor PHP citat per l'eina també és absent |
| `document.mjs check` i porta Olivera | Document vàlid, zero errors documentals; Olivera passa |

Les proves de caracterització s'han escrit només a `/private/tmp/sdp-audit-tenant.test.js`, amb configuració temporal de Vitest. El primer intent no executà proves per la forma d'importar l'API de mocks; corregit activant els globals del corredor, huit proves executades. No hi ha tests nous persistents al repositori ni instal·lació de dependències. No s'ha recompilat el bundle: s'ha inspeccionat el mateix artefacte que servix producció.

L'evidència temporal de diagnosi queda en `/private/tmp/sdp-audit-api-results.json`, `/private/tmp/sdp-audit-api-columns.json` i logs `sdp-audit-*.log`. Les dades determinants, hashes, consultes i resultats estan transcrits ací perquè l'informe siga autosuficient. Les còpies temporals de l'HTML/bundle són recursos públics, no contenen cap sessió privada obtinguda del navegador.

Ampliació T4: executats `src/app/contexts/politicaRouter.test.js`, `src/app/contexts/RouterContext.embed.test.jsx`, `src/PedraSecaEmbed.router.test.jsx`, `src/hooks/useSEO.test.jsx`, `src/hooks/seoHead.test.js`, `src/app/enllacosInterns.test.js` i `src/components/PedraSeca/hooks/useAccions.test.jsx`. Resultat a `/private/tmp/sdp-audit-routes-tests.log`. Les respostes HTTP i capçaleres públiques estan a `/private/tmp/sdp-audit-routes-{root,base,mercat}.{html,headers}`. El primer intent amb urllib fallà per manca de certificat emissor al magatzem local de Python; es repetí amb curl i la validació TLS del sistema, sense desactivar-la. No s'han instal·lat dependències ni creat proves persistents per a esta ampliació.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s'ha entrat a l'administrador WP ni al gestor de migracions de producció. No s'han llegit dades de persones o d'altres tenants. Els GET amb `limit=0` detecten compatibilitat d'esquema, però no substituïxen una bateria RLS amb usuaris i dades controlades. No s'ha observat en viu `tenant_id=eq.undefined`; es conserva com a incidència comunicada i com a defecte reproduïble amb la cadena literal, sense atribuir-li falsament el 400 confirmat.

L'automatització del navegador no ha pogut clicar els controls dins del Shadow DOM tancat. S'ha verificat visualment l'arrencada, i la consulta de la secció s'ha contrastat directament per HTTP. No s'ha fet una comparació visual completa Vite/WP ni s'ha certificat el 100% de paritat. C7/C8 són una proposta de disseny contrastada amb codi, proves del nucli i GET públics: no s'han creat la pàgina `/enxufe`, les rewrites o els nous filtres SEO, ni s'ha certificat el seu funcionament integrat o la indexació en cercadors.

Tancament mecànic: les comprovacions detecten segell divergent (`b94b8941…` respecte de `82aaab07…`), identitat no activa/divergent de `core-empaquetat-wp` i incidències SCC. `P-14` de `.agents/PROTOCOL_PETORRETA.md` exigix que l'executor de governança partisca d'un segell vàlid; `tooling/gates/executor-mutacio.mjs:42` el comprova abans de mutar. Per això no s'ha actualitzat directament `.agents/ESTAT.md` ni `.agents/LEDGER.md`, ni s'ha reconstruït el segell per ocultar la divergència. El relleu complet i la proposta per a MarIA queden en este informe. `document.mjs check` valida l'informe i Olivera passa; el torn continua `planned`, sense tancament global acreditat.

En l'ampliació, el tancament també marca «Canvis de codi fora de l'abast documental». El checkout compartit continua portant l'edició aliena de `wordpress-plugin/readme.txt` descrita en C6; Codex no l'ha modificada ni revertida. No s'atribuïx salut global a partir de les proves locals. L'evidència actualitzada del tancament és `/private/tmp/sdp-audit-routes-closure.json`.

Relleu per a incorporar a ESTAT quan MarIA reconcilie la governança: torn `torn_0324e036-3684-48ed-99fb-11e762202973`; auditoria WP/Sollutia v1.1.0 lliurada; 400 confirmat per `updated_at` absent, tenant correcte en release 1.0.1; defecte de cadenes de tenant invàlides reproduït; pla de correcció C1–C5 i ampliació T4/C7–C8 preparats; router compartit verificat, però `/enxufe/` i `/enxufe/mercat` retornen 404 i falta connectar el contracte SEO al plugin actual; cap canvi de Codex al codi ni a producció; resta aplicar el consens, verificar RLS/paritat i tancar el torn. L'Acta Marmota de final de jornada queda a càrrec de l'orquestració.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261001_2003_prompt_codex]]
- [[261001_2003_prompt_claude]]
- [[261001_2050_pla_implementacio]]
- [[261001_2110_pla_calendari_vistes]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
