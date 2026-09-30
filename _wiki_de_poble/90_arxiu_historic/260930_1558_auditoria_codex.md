---
type: informe
status: esborrany
description: Diagnòstic i correcció del host WordPress, auditoria estructural dels ports i revisió adversarial de la proposta de Fable.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_68d3778e-c4dc-4621-92e9-e4b28f21a287:fefcb7a9-2a4e-47db-9942-afe3ef950dfc
---
# Auditoria Codex WordPress i enxufabilitat

El banc de proves WordPress ja mostra la SPA sense capçalera, peu ni títol del tema. El connector està corregit i verificat localment. L'auditoria del nucli, en canvi, identifica defectes reals que impedixen afirmar que qualsevol backend es pot connectar amb garanties. Este informe separa les correccions executades de les propostes que requerixen una iteració pròpia.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_68d3778e-c4dc-4621-92e9-e4b28f21a287:fefcb7a9-2a4e-47db-9942-afe3ef950dfc |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T13:52:01.773Z |
| Modificació | 2026-09-30T14:15:45Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 / Codex; variant Astra Ultra no acreditable des d'esta sessió |
| Tokens consumits | N/D; l'entorn no exposa una mesura fiable del consum total |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T13:52:01.773Z: esborrany creat; contingut i verificació pendents.

2026-09-30: lectures normatives, tres revisions paral·leles, pla WP estabilitzat, correcció local i comprovacions del connector. Les hores de la pissarra són Europe/Madrid; les marques ISO del registre són UTC. El nom de l'informe fixa l'hora prevista de redacció (15:58); el rebut conserva la creació mecànica anterior (15:52).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resultat executat i abast

L'entrada tècnica és `wordpress-plugin/socdepoble-enxufe.php`. És un adaptador d'allotjament de la SPA, no un backend WordPress de dades de negoci. S'han llegit AGENTS, Genotip, índex mestre, taxonomia, arrencada, estat vigent, workflow i procediment documental; el context de l'Escriptori s'ha repartit entre lectors i s'ha rellegit la pissarra després de les iteracions.

Canvis de font del torn:

| Fitxer | Canvi |
| --- | --- |
| `wordpress-plugin/templates/pantalla-completa.php` | `min-height:0`, marges i padding nuls, selectors limitats al cos de pantalla completa; conserva els tres hooks de WordPress. |
| `wordpress-plugin/readme.txt` | Explica que la plantilla és necessària per llevar el tema, com triar-la per Edició ràpida amb temes de blocs i com migrar el shortcode antic. |
| `tests/enxufe-pantalla.test.mjs` | Quatre regressions executables amb PHP real; CSS computat amb jsdom. |
| `tests/fixtures/enxufe-pantalla.php` | Executa el plugin i plantilla reals amb dobles de les fronteres WordPress. |
| `package.json` | Incorpora les regressions al corredor habitual `test:node`. |

Canvis exclusivament locals de Studio: servidor iniciat, pàgina 7 corregida i plantilla assignada, plantilla/readme/build copiats al plugin ja instal·lat. No s'ha canviat el tema, altres pàgines, comptes ni endpoints externs. Còpia reversible de la pàgina i fitxers substituïts a `/private/tmp/sdp-codex-wp-260930/`; és temporal, no un backup durable. El build és desenvolupament/seed i no és un paquet publicable.

### C1 · P1 funcional · El banc de proves encara usava un shortcode retirat — corregit

**Evidència:** Studio tenia actiu `wordpress-plugin/socdepoble-enxufe.php`, però «Pedra Seca Demo», ID 7, contenia `[soc_de_poble base_path="/disseny"]` i `_wp_page_template` buit. El navegador mostrava literalment el shortcode, el títol i les peces del tema Twenty Twenty-Five. El plugin actual registra `socdepoble_app` a `includes/marcatge.php`.

**Correcció:** contingut nou `[socdepoble_app ruta_inicial="/disseny"]` i plantilla `socdepoble-enxufe-pantalla-completa`. La ruta inicial continua sent `/disseny`. S'ha conservat el contingut anterior; no s'ha afegit un àlies obsolet ni forçat fullscreen en totes les pàgines. `requires_human_decision: false`, cobert per T1.

**Resultat:** [demostració local](http://localhost:8881/pedra-seca-demo/), un component i un bundle, sense peces del tema. [La pàgina ordinària](http://localhost:8881/sample-page/) conserva capçalera, títol i peu.

**Operació per a l'administrador:** Pàgines → Edició ràpida → Plantilla → «Sóc de Poble · full screen» → Actualitza. Comprovat que el WordPress real de Studio amb Twenty Twenty-Five retorna i renderitza l'opció en `wp_get_theme()->get_page_templates(null, 'page')` i `page_template_dropdown('', 'page')`. El core `class-wp-posts-list-table.php:1983–1999` oferix eixe selector també amb temes de blocs. La pàgina 7 s'ha actualitzat per CLI; no s'ha certificat el selector lateral del Site Editor en navegador.

### C2 · P2 · El mínim de 32rem impedia ocupar una finestra curta — corregit

`wordpress-plugin/includes/marcatge.php:176` dona a les insercions editorials `min-height:32rem`; abans, la plantilla completa només canviava `height`. En una finestra de 390px o amb zoom, el mínim de 512px podia guanyar a l'alçada disponible. L'override ara és exclusiu de `.socdepoble-enxufe-pantalla .socdepoble-enxufe`. La plantilla continua restant 32px/46px quan hi ha barra d'administració; no l'amaga.

La prova real ha mesurat `innerHeight=325`, caixa=325 i document=325, i també `innerHeight=750`, caixa=750 i document=750. Són píxels CSS reals del navegador amb el zoom vigent, no les dimensions nominals demanades al visor. La prova jsdom comprova que fora de la plantilla el mínim continua sent 32rem. `requires_human_decision: false`.

### A1 · P1 · Una configuració explícita rebutjada pot acabar seleccionant Supabase — pendent

`src/host.js:146–158` captura l'error de la cua `SocDePobleCua` i només el registra. `arrencaAuto()` continua; `host.js:98–100` importa Supabase si el port continua buit. S'ha executat el font íntegre de host.js amb el port real i un import de transport simulat: configuració externa incompleta → `queueErrors=1`, `fallbackImports=1`, fase `segellat`.

**Impacte:** un amfitrió que haja demanat un backend propi pot acabar amb un altre proveïdor. La prova demostra la selecció incorrecta; no s'ha enviat trànsit a cap backend real. Contradiu la Llei de l'Enxufabilitat i el comportament tancat en cas d'error.

**Correcció proposada:** registrar l'error de configuració explícita, suspendre l'arrencada automàtica i exigir una configuració vàlida abans de continuar. El backend per defecte només és legítim quan ningú n'ha sol·licitat un altre. Provar també recuperació després de configurar bé i cua amb més d'una entrada. `requires_human_decision: false` per al defecte; execució fora del tall WP acordat.

### A2 · P1 · La guarda d'entrada no seguix els adaptadors de sessió opaca — pendent

`src/data/organizations.js:11–12` llig l'usuari del port però captura la sessió d'`identitat.js`. Després de l'operació, `organizations.js:43–44` torna a comprovar una guarda que només coneix `generacioEntrada` i `CLAU_USUARI` (`identitat.js:288–295`). Amb un adaptador extern, A→B pot no modificar eixe magatzem.

**Reproducció amb mòduls reals:** operació d'alta pendent per A; el port i el servei neutral ja veuen B; es completa l'operació d'A. Resultat acceptat: `organization-created-for-A`. No acredita una vulneració d'autorització al servidor; acredita que el client accepta un resultat d'una altra sessió.

**Correcció proposada:** l'epoch d'entrada i la captura han de pertànyer al servei neutral de sessió, amb identitat estable de backend/tenant/sessió. Revisar també NotesDataContext, PerfilContext i useAdministrarOrganitzacio. Matriu mínima: A→B, A→fora→A, renovació d'A i canvi de backend amb el mateix id d'usuari. Evitar el pedaç de comparar només l'id al final, que no detecta eixir i tornar a entrar. `requires_human_decision: false` per la guarda; cal acordar el contracte de sessió amb l'adaptador real.

### A3 · P2 · Renovar la sessió de l'amfitrió avorta un desat legítim — pendent

`identitat.js:551` reinjecta la sessió sense distingir la renovació del mateix subjecte. `identitat.js:324` incrementa l'entrada; `src/sections/notes/NotesDataContext.jsx:170–176` ja documenta que pot remuntar l'editor. La prova `NotesDataContext.amfitrio.test.jsx:102–114` passa perquè espera `AbortError` encara que l'adaptador simulat confirme el desat; no s'ha executat cap PATCH real en esta reproducció.

**Correcció proposada:** incorporar semàntica explícita de renovació amb backend, emissor, subjecte i sessió estable; invalidar en reentrada, però no en rotació legítima del token. Transformar la prova actual en una regressió del comportament desitjat. Una prova verda que fixa el defecte no és una garantia del flux. `requires_human_decision: false`.

### A4 · P2 · Logout vàlid pel port pot fallar i l'iframe pot confirmar abans d'hora — pendent

El contracte executable de `backendPort.js:30–36` accepta qualsevol funció `logout`; `host.js:256` imposa `.catch()` al retorn. Un logout síncron vàlid que retorna `null` provoca `TypeError`. El pont iframe crida `expulsaSessio()` i confirma immediatament sense esperar el backend.

**Correcció proposada:** normalitzar el resultat síncron/asíncron amb promesa, esperar la finalització abans de l'ACK i tornar error controlat si el backend rebutja l'eixida. Provar retorn buit, promesa resolta/rebutjada i excepció síncrona. No s'ha demostrat que el Supabase actual tinga logout síncron; el defecte és de substituïbilitat. `requires_human_decision: false`.

### A5 · P1 de preparació · Encara no hi ha un endoll de dades operatiu de Sollutia — pendent d'endpoints

`src/data/adaptadors/sollutia/client.js:4` té `apiOrigin:null`, orígens i recursos buits. `llig()` rebutja tot recurs desconegut, correctament. No hi ha captures productives suficients ni adaptador complet connectat. El marcatge WordPress només transmet presentació i recursos; no transmet usuari, nonce, credencials ni URL de backend.

L'ADR `02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md:10` encara definix Model B com Supabase únic i Sollutia de lectura; arriba a prohibir substituir-lo al port. L'ordre humana actual demana backend intercanviable. Esta ordre governa el torn, però la contradicció documental i les portes que comproven «Sollutia només lectura» han de reconciliar-se abans d'un lliurament de dades real. No s'ha relaxat cap porta per fer-la passar.

**Proposta integral:** inventari de capacitats i contracte neutral, fixtures de peticions/respostes reals de Sollutia, identitat i errors de sessió neutrals, prova del mateix escenari amb dos adaptadors, i una composició explícita del host. El nucli exigix 32 funcions, incloses Google/magic-link/xat; no convé omplir-les amb funcions fictícies per aparentar compatibilitat. Fer opcionals només les capacitats que la UI puga ometre de veritat. `requires_human_decision: true` per a les capacitats de negoci i endpoints que haurà de proporcionar Sollutia; no bloqueja l'allotjament WordPress resolt en este torn.

### Auditoria adversarial de Fable

**Tall revisat:** carril de Fable fins a l'entrada de les 16:06 i informe v0.1.0, publicat a les 16:10, llegits íntegrament per l'orquestrador i un revisor independent. L'informe conté l'anatomia de WhatsApp (apartat 1.1); les decisions finals de disseny, Fedivers i autoreproducció encara no estan publicades. Esta crítica cobrix les propostes presents, no certifica contingut futur.

La biblioteca derivada, guardar com enviar-se a un mateix i els ports opcionals són direccions compatibles amb la modularitat. La separació entre viewport del host i visor de la SPA també és correcta, conservant la barra d'administració. Les captures de WhatsApp no revoquen les ordres vigents sobre filtres, Novetats ni botons flotants; Fable identifica correctament estos conflictes.

Una lectura independent de les 22 captures completes confirma els patrons principals de §1.1. Cal, però, separar variants: Android té quatre destins inferiors, mentre macOS presenta barra lateral persistent, llista i visor, amb accions a capçalera. «A la resta, una lupa» generalitza massa (Comunitats no en mostra en estes captures), i les files de Trucades tenen accions diferents. Les imatges soles no proven el nombre de membres, els permisos per respondre ni que tota l'organització siga automàtica; això és inferència o coneixement addicional que s'ha d'etiquetar. Cap d'estos matisos invalida els patrons proposats ni les objeccions de contracte.

| Proposta publicada | Objecció i condició d'acceptació |
| --- | --- |
| Fil `personal` com a bloc privat | El tipus SQL existix, però `creaFilDirecte(jo)` és rebutjat per la RPC (`supabase/migrations/2609272200_xat_entitats.sql:177`) i la llavor (`src/data/localXat.js:444`). Cal una operació opcional idempotent, amb unicitat per node/poble/persona i permisos imposats al servidor. Dos intents concurrents han d'obrir el mateix fil; un altre compte no el pot consultar. |
| «Guardar és enviar-s'ho» i biblioteca automàtica | `ConnectarSection.jsx:607` ja crea una Nota; `XatSection.jsx:546` convertix un retall de xat en una altra Nota. Cal decidir si la biblioteca mostra referències, còpies explícites o objectes canònics. Missatge i Nota han de conservar identitat i procedència; editar o eliminar-ne un no ha d'alterar l'altre implícitament. Una interfície única no justifica dos magatzems divergents. |
| URL canònica per al bookmarklet i les invitacions | Correcte, però incomplet sense contracte d'aterratge. `politicaRouter.js:129` selecciona memòria i `RouterContext.jsx:333` inicialitza des de `rutaInicial`, no de la consulta de la pàgina WordPress. Afegir-hi `?url=…` no obri `/connectar`. Cal provar nova pestanya en standalone i embed, preservant node i poble; sense receptor compatible, no s'ha de generar un enllaç aparentment funcional. |
| Capacitats noves opcionals | `backendPort.js:35` comprova funcions presents, no suport real del servidor. Definir DTO, errors de manca de suport i temporals, i degradació de la UI. Matriu de sessió A→B, A→fora→A i renovació d'A, amb adaptador JWT i opac. No traslladar simplement `sessionService.generacio`: també varia amb el JWT (`sessionService.js:108`). A2/A3 requerixen un concepte neutral d'entrada estable. |
| Índex invers de connexions | El servidor ha de calcular-lo i filtrar-lo segons els permisos del document origen. Cal definir com es revoca una connexió en esborrar, deixar de compartir o perdre accés; un recompte o títol d'una nota privada també pot revelar-ne l'existència. Guardar i publicar han de continuar sent accions separades. |

Dues precisions s'han comunicat al carril: `contingutExtern.js` és pur i crea metadades i cita, sense capturar el cos de l'article; `PedraSecaEmbed.jsx` accepta `config.language` i `setLanguage()`, però no hi ha un atribut d'idioma en `ATRIBUTS/observedAttributes`. Emetre'l des del plugin requeriria ampliar el contracte i provar-lo, no només afegir marcatge.

Per al disseny de Fedivers i autoreproducció encara pendent, deixe dos criteris previs, sense atribuir-li una implementació: identitat, claus i lliurament entre servidors pertanyen al node; la SPA no ha de contindre les claus privades del servidor. Clonar HTML/assets pot reproduir el client, però no clona automàticament dades, permisos, credencials ni identitats. Cal un manifest de capacitats i un procés explícit de configuració/migració. Fable encerta a demanar reconciliar l'ADR abans de convertir la visió en comportament.

**Veredicte:** direcció compatible, amb els contractes anteriors encara per concretar. T3 s'ha executat sobre el carril i document disponibles. L'arquitectura completa i l'auditoria recíproca de Fable continuen en elaboració i no s'han donat per aprovades.

### Retroalimentació de prompt_local

1. Omplir Preflight abans del lliurament: versió i slug del plugin actiu, URL i pàgina de Studio, estat de plantilla i shortcode, ports disponibles i canvis concurrents. Hauria fet visible el problema de migració immediatament.
2. Separar amfitrió SPA, API de dades i sessió; «el backend WordPress funciona» no acredita cap dels altres dos canals.
3. Corregir la contradicció de «Model B» entre la plantilla i l'ADR; enllaçar un únic contracte vigent i declarar els endpoints absents com a absents.
4. Substituir «cada fragment» i «cirurgia extrema» per superfícies, defectes reproduïbles i criteris d'eixida. Intensitat verbal no és cobertura ni autorització d'una purga.
5. Fer servir un manifest explícit del context viu. «Qualsevol document d'Escriptori» incorpora laboratoris antics i còpies de normes; cal definir què és referència històrica i què és autoritat.
6. Definir tall estable, propietari per fitxer i resposta de cada carril. La periodicitat de cinc minuts és útil, però no substituïx este protocol de concurrència.
7. No exigir un nom comercial de model ni una xifra de tokens que l'entorn no expose. Declarar N/D és més exacte que inventar-los.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat i límit |
| --- | --- |
| Node plugin/empaquetador/standalone/tractor | 44/44 passen. |
| Corredor habitual `npm run test:node` | 136 casos: 134 passen, 2 TODO de diagnòstic, 0 fallades i 0 skips. Els TODO indiquen llista de fitxers d'un torn antic incompleta i set classes heretades d'App.jsx sense regla en src/css; no s'han silenciat. |
| PHP runtime plantilla + CSS computat | 4/4 passen, PHP Studio 8.3.33, cap skip. Dobles de les fronteres WP; no simulen el motor de permisos. |
| Sintaxi PHP | 11 PHP del plugin passen; fixture nova també. |
| Lint | Fitxers JS de plugin/packaging i prova nova sense missatges. |
| Build WP | Correcte: 188 actius, bundle 3.164.699 bytes, versió 1.0.0-dev, mode seed, node local de desenvolupament. |
| Portes enxufe, adaptadors, Sollutia, frontera auth | Passen; comproven estructura i fixtures de contracte, però no cobrixen els escenaris A1–A4. La primera invocació d'auth usà una ruta inexistent; repetida amb la ruta canònica `tooling/wiki/tractor-frontera-auth.mjs`, passa. |
| Regressions de sessió/host existents | 4 fitxers, 18 proves passen; una fixa el defecte A3. |
| Navegador Studio | SPA visible, un bundle, zero capçalera/peu del tema; viewport curt i ample sense scroll de document; Sample Page manté el tema. |
| Vite | Procés existent reutilitzat, HTTP 200 a localhost:3340. |
| Tancament documental | Document vàlid. `tancament --check`: `valid:false`, torn `planned`, únic error «Zona humana modificada: …/01_produccio/260930_1558_auditoria_codex_wordpress.jpg». Les huit comprovacions (plantilles, autoritat, ledger, segell, skills, wiki, documental-tests i scc) passen. No s'ha reiniciat l'inventari ni alterat l'original. |

![WordPress local amb la SPA sense el tema](01_produccio/260930_1558_auditoria_codex_wordpress.jpg)

Comanda de regressió del connector:

```sh
node --test tests/enxufe-plugin.test.mjs tests/enxufe-pantalla.test.mjs tests/enxufe-empaqueta.test.mjs tests/standalone-build.test.mjs tests/tractor-enxufe.test.mjs
```

La conservació de `wp_head`, `wp_body_open` i `wp_footer` seguix la separació entre hooks i peces visuals del tema descrita a [WordPress: Plugin API Hooks](https://developer.wordpress.org/themes/advanced-topics/plugin-api-hooks/). La selecció per pàgina seguix el mecanisme de [Page Templates](https://developer.wordpress.org/themes/classic-themes/templates/page-template-files/).

### Reproducció aïllada d'A2, sense xarxa ni credencials

Des de l'arrel del repositori; només memòria. Resultat observat: `currentActor` i `sessionServiceActor` són `cms-B`, però el resultat acceptat és `organization-created-for-A`.

```sh
node --input-type=module <<'NODE'
import { JSDOM } from 'jsdom';
const dom = new JSDOM('', { url: 'https://cms.example.test/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.CustomEvent = dom.window.CustomEvent;
const { CONTRACTE_NUCLI } = await import('./src/data/contracte.js');
const { setBackendImplementation } = await import('./src/data/backendPort.js');
const { creaOrganitzacio } = await import('./src/data/organizations.js');
const { sincronitza, getSessionState } = await import('./src/data/sessionService.js');
let currentUser = { id: 'cms-A' };
let complete;
const adapter = Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, () => null]));
adapter.getCurrentUser = () => currentUser;
adapter.createOrganization = () => new Promise(resolve => { complete = resolve; });
setBackendImplementation(adapter);
sincronitza();
const pending = creaOrganitzacio({ name: 'Entitat A', slug: 'entitat-a', kind: 'company' });
currentUser = { id: 'cms-B' };
window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: currentUser } }));
complete({ id: 'organization-created-for-A' });
try {
  const result = await pending;
  console.log(JSON.stringify({ currentActor: currentUser.id,
    sessionServiceActor: getSessionState().usuari.id,
    wronglyAcceptedPreviousActorResult: result.id }));
} catch (error) { console.log(JSON.stringify({ rejected: error.name })); }
dom.window.close();
NODE
```

### Reproducció aïllada d'A1 i A4

Executa el font íntegre de host.js, backendPort, contracte, backendConfig i runtimePolicy. Simula Custom Element/React, identitat, sanejador i el mòdul de transport importat: acredita la selecció del fallback i l'error de logout, no una connexió real a Supabase.

```sh
node --experimental-vm-modules --input-type=module <<'NODE'
import vm from 'node:vm';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('', { url: 'https://cms.example.test/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const contract = await import('./src/data/contracte.js');
const dependencies = {
  './data/backendPort.js': await import('./src/data/backendPort.js'),
  './PedraSecaEmbed.jsx': { defineCustomElement() {} },
  './data/contracte.js': contract,
  './data/identitat.js': { adoptaSessioExterna() { return true; },
    esborraSessio() {}, configuraBackendSessio() {} },
  './config/backendConfig.js': await import('./src/config/backendConfig.js'),
  './config/runtimePolicy.js': await import('./src/config/runtimePolicy.js'),
  './utils/sanitize.js': { sanitizeHtml: value => value }
};
let queueErrors = 0;
let fallbackImports = 0;
const context = vm.createContext({ window: dom.window, document: dom.window.document,
  console: { error() { queueErrors++; }, warn() {} },
  setTimeout, CustomEvent: dom.window.CustomEvent, DOMException });
const moduleFor = exports => new vm.SyntheticModule(Object.keys(exports), function () {
  for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
}, { context });
const host = new vm.SourceTextModule(fs.readFileSync('./src/host.js', 'utf8'), {
  context,
  importModuleDynamically: async specifier => {
    if (specifier !== './data/supabase/index.js') throw new Error(specifier);
    fallbackImports++;
    const fallback = moduleFor(Object.fromEntries(contract.CONTRACTE_NUCLI.map(key => [key, () => null])));
    await fallback.link(() => {});
    await fallback.evaluate();
    return fallback;
  }
});
await host.link(specifier => moduleFor(dependencies[specifier]));
await host.evaluate();
dom.window.SocDePobleCua = [['configura', { backend: {},
  config: { backendId: 'wordpress', backendUrl: 'https://cms.example.test/api' } }]];
host.namespace.exposaGlobal();
host.namespace.arrencaAuto();
await new Promise(resolve => setTimeout(resolve, 25));
console.log(JSON.stringify({ queueErrors, fallbackImports, phase: host.namespace.estat().fase }));
try { host.namespace.expulsaSessio(); console.log('sync_logout:accepted'); }
catch (error) { console.log(JSON.stringify({ syncLogoutError: error.name, message: error.message })); }
dom.window.close();
NODE
```

Eixida observada: `{"queueErrors":1,"fallbackImports":1,"phase":"segellat"}` i `TypeError: Cannot read properties of null (reading 'catch')`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No és una prova exhaustiva de cada fitxer del sistema. S'han inspeccionat el connector complet, pipeline d'empaquetat, arrencada del host, contractes, sessió i consumidors rellevants; Fable treballa en proposta documental de UX i arquitectura. No s'han tocat fonts `src/`, secrets, RLS, dades externes, autenticació real de Sollutia ni producció.

La lectura delegada del context ha cobert 38 md/txt íntegres, inclosos documents vius de primer nivell, quatre documents de producció i recerca. Sis còpies antigues de normes/skills s'han exclòs seguint AGENTS; els binaris i el codi experimental no s'han convertit en autoritat. Les captures WhatsApp internes no han entrat al paquet ni a l'informe. Els documents nous del primer nivell es rellegeixen abans del lliurament.

La geometria anònima s'ha verificat en navegador. La barra d'administració s'ha revisat en CSS i hooks, però no s'ha acreditat una sessió administrativa real al navegador. No s'han certificat tots els temes ni plugins de WordPress. Un plugin alié pot inserir contingut als hooks conservats; llevar-lo globalment trencaria el contracte.

El revisor independent no ha trobat defectes nous al tall WP. La fixture comprova l'ús de les cues i de `the_content()`, però representa la deduplicació d'actius amb un doble i no prova els permisos de WordPress. La prova visual real complementa eixa cobertura.

El build usa seed i backend local; la disponibilitat d'eixa API no és requisit de la prova visual i no s'ha declarat producció preparada. No s'ha emés cap release, commit ni push.

El relleu ESTAT/LEDGER s'ha aplicat per lease, comparació prèvia de contingut i executor mecànic; última transacció `84e50a61-e0b9-4534-af86-9a867ae055dc`, lease consumida. Un LF que vam afegir darrere del checksum en el primer relleu era acceptat per un verificador i rebutjat per l'altre: corregit eliminant només eixe byte en una transacció pròpia, sense alterar el cos ni el checksum. Ambdós verificadors passen. No s'atribuïx eixe error a concurrència.

La captura sí que fou moguda i ancorada per una intervenció concurrent: el fitxer creat al primer nivell apareix ara a `01_produccio/`. El vigilant v1 del torn no oferix una via d'atribució externa sense reconstruir l'inventari; no s'ha falsejat eixa línia de base. L'informe i el codi queden lliurats, però el torn no es declara tancat formalment. El `git diff --check` dels nostres fitxers de codi és net; la comprovació global posterior assenyala una línia buida afegida al final de l'índex compartit, fora del tall del connector.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260930_1545_pla_implementacio_coworking]]
- [[260930_1545_prompt_codex]]
- [[260930_1550_auditoria_claude]]
- [Evidència visual WordPress](01_produccio/260930_1558_auditoria_codex_wordpress.jpg)
