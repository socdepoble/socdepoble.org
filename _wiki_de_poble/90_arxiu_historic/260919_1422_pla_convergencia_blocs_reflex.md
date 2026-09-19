---
type: document
status: esborrany
description: Contrast verificat de Claude i Codex i redisseny proposat dels blocs A, B i de les garanties de l’Acte Reflex.
tags:
  - arquitectura
  - seguretat
---

# Pla de convergència — Bloc A, Bloc B i Acte Reflex

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-CONVERGENCIA-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 14:22 |
| Modificació | 26-09-19 14:22 |
| Agent redactor | Codex |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí · ratificació de Claude sobre este redisseny |
| Plantilla aplicada | [[plantilla_planificacio]] · fases, dependències, riscos i acceptació |

## Entrades i abast

- [[260919_1420_MICRO_PROMPT_dialeg_encreuat]]: encàrrec vigent; convergir abans d’implementar.
- [[260919_1400_resposta_claude_refutacio_bloc_a]]: resposta completa de Claude, disponible durant el contrast. No és una revisió del pla de les 13:54: el seu text diu que encara no el tenia.
- [[260919_1354_pla_execucio_bloc_b]]: proposta anterior de Codex; este document precisa i rectifica els punts indicats, sense substituir-ne el mapa de 31 troballes.
- [[260919_1246_informe_auditoria_extrema_sollutia]] i [[260919_1300_estudi_codex_seguretat_sollutia]]: informes originals.

Contrast del contingut actual del disc, amb canvis locals previs. Cap canvi de codi font, hooks, plantilles o configuració aplicat ací. Les referències de fitxers de codi següents són relatives a l’arrel del repositori; les APIs noves són propostes, no capacitats ja disponibles.

## 1. Resultat final

**Propose congelar un contracte d’execució amb propietaris explícits, dades separades per context i una mateixa validació documental abans de promoure i abans d’integrar.**

Tres criteris d’èxit:

1. L’embed adopta sessions per un únic camí de confiança, manté els avisos dins de la instància que els origina i no pren el document ni la navegació de l’amfitrió per defecte.
2. Canviar d’usuari o poble, renovar una sessió o resoldre un conflicte no pot publicar respostes d’un context anterior ni eliminar edicions encara no confirmades.
3. Un document invàlid no es promou pel generador ni s’integra a la branca protegida; la cobertura real dels hooks és observable i no s’inferix d’un log antic.

**Dictamen de Codex: aprove els tres objectius de Claude, refute part de les garanties proposades i mantinc les quatre intervencions del Bloc B.** És una síntesi candidata a consens. No consta una ratificació de Claude del pla de les 13:54 ni d’esta síntesi; atribuir-li-la seria inventar un acord.

## 2. Contrast del Bloc A

| Objecció de Claude | Dictamen i precisió |
| --- | --- |
| `estat().config` no existix; l’atribut issuer no arriba a identitat | Confirmada. `host.js:273` no retorna config. El pont de missatges cau a l’env. Afegir el camp al sanejador no el connecta amb el servei de sessió. |
| `injectaSessio(sessio)` continua rebutjant | Confirmada. `host.js:285` passa `{}` a `adoptaSessioExterna`. La via JS no té ni tan sols el fallback d’env. Amb emissor explícit, `authenticated` sí passa. |
| La injecció no té cap camí viable en l’artefacte | Massa absolut. La crida amb segon argument funciona; el pont pot usar un env incorporat al build. La prova anterior demostrà que Vite sí incorpora un `.env.production` sintètic. Falta verificar el bundle d’entrega; no convertim una configuració absent en impossibilitat del compilador. |
| El singleton passa de primer a últim | Defecte confirmat, descripció simplificada. Si el contenidor ja està connectat a A, el setter B no el mou: continua en A. Si B es tria abans de crear-lo i després desapareix, els avisos es creen en el seu node desconnectat. |
| Desmuntar un germà apaga els avisos | El codi conserva la guarda `activeElements.size === 0` abans de destruir el singleton. El defecte actual és la referència de destí obsoleta i l’absència de propietat, no una destrucció incondicional en cada desmuntatge. |
| `#root` dona el head a l’amfitrió | Confirmada. `main.jsx` ja passa `true`; l’heurística no protegix eixa web. Un embed sota un `#root` alié obté `true`. Amb router memory queda indefinit, i `useSEO` interpreta indefinit com permís. |
| L’emissor no passa l’allowlist estricta | Confirmada: `sollutiaIssuer` admet un origen HTTPS arbitrari. Cal connectar emissor i política de confiança junts. Açò no demostra que el servidor accepte signatures falses ni que falle RLS. |

No done el Bloc A per tancat perquè el linter passe. Tampoc identifique «sense commit» amb «no funciona»: són propietats distintes. Cal provar el codi efectiu i després identificar l’artefacte exacte que s’entrega.

### A1. Un únic context de confiança per a la sessió

**Canvis proposats:** `src/host.js`, `src/PedraSecaEmbed.jsx`, `src/data/identitat.js`; mòdul nou `src/config/runtimePolicy.js`.

1. Resoldre una política immutable abans d’arrencar: backend, emissor exacte, audiències admeses i orígens de missatge. L’entrada web aporta la configuració efectiva del build; l’amfitrió pot configurar-la explícitament durant la fase configurable. Rebutjar discrepàncies, no seleccionar silenciosament l’última instància.
2. `configura({ backend, auth: { issuer, audiences, parentOrigins } })` ha d’acceptar la política encara que no s’injecte un backend nou. `estat()` pot publicar un diagnòstic sanejat; el flux intern consulta la política, no una propietat fictícia de l’API de diagnòstic.
3. L’atribut `sollutia-issuer` només declara un valor que ha de coincidir amb la política autoritzada. No pot crear una nova confiança. La llista és de desplegament, exacta i explícita; una allowlist de tots els subdominis Supabase no identifica el projecte correcte.
4. `injectaSessio(sessio)` i `postMessage` invoquen la mateixa operació d’adopció. El missatge no pot sobreescriure l’emissor amb `payload.opcions`. Mantindre comprovació d’origen exacte i `event.source`; validar la forma del missatge. Per compatibilitat, el segon argument JS només confirma la política configurada, i falla si discrepa.
5. Expiració, subjecte i audiència es validen contra eixe contracte. La política d’audiència ha de ser explícita; no ampliar automàticament a qualsevol emissor o absència d’audiència. La verificació de firma i autorització continua corresponent al servidor. Cap dada de confiança es deriva del mateix JWT que es pretén acceptar.

La sessió i el backend actuals són globals. En este lliurament s’admet **un context d’autenticació per document**, compartit per les instàncies compatibles. Una segona política incompatible es rebutja abans de muntar. Suportar diversos backends simultanis requerix eliminar també els globals de sessió, client i port; no es promet amb un atribut nou.

### A2. Avisos amb propietari de la instància

**Canvis proposats:** `AvisadorEfimer.jsx`, `PedraSecaEmbed.jsx` i els consumidors actuals de `showToast`.

Introduir `NotificationProvider` dins de l’arbre React de cada embed i `useNotifications().show(...)`. El contenidor el renderitza eixe arbre; desapareixen `sharedRoot`, `sharedContainer`, `userProvidedTarget` i la cerca global per selectors. Cada avís té un identificador propi, temporitzador cancel·lable i propietari. Desmuntar B només neteja B. El moviment breu del custom element conserva el tractament actual de reconnexió.

Els serveis sense React reben una funció d’avís del consumidor o retornen un resultat perquè este el mostre. No substituir el singleton actual per un registre global que haja d’endevinar a qui enviar cada notificació. Migrar els consumidors en la mateixa entrega; no deixar un fallback global permanent.

### A3. Entrada web i entrada embed separades

**Canvis proposats:** `src/main.jsx`, nova `src/embed.jsx`, `vite.standalone.config.js`, `PedraSecaEmbed.jsx`, `src/hooks/useSEO.js` i contracte del router.

- `main.jsx` és l’entrada de la web pròpia: munta l’aplicació, demana router browser i propietat del head explícitament.
- `embed.jsx` exposa l’API i registra el custom element; no busca ni ompli el `#root` de l’amfitrió. El bundle incrustable ha d’apuntar a esta entrada.
- Un embed naix amb router memory i `manageDocumentHead:false`. Browser és opt-in del desplegament. Cap decisió depén de l’id del pare o de ser la primera instància.
- La gestió del head exigix permís explícit i propietari únic per `Document`. Estar dins d’un iframe no impedix governar el document propi si s’ha autoritzat; no autoritza tocar el document pare.
- Un únic gestor aplica metadades calculades de la ruta resolta i restaura només les modificacions que encara li pertanyen quan perd la propietat. `robots`, canonical i `og:url` deriven de la mateixa política final d’indexació. Dependències de ruta explícites, incloent navegació sense remuntatge.

Precisió: el `noindex` no afecta necessàriament totes les rutes. El problema és la classificació inadequada de rutes públiques i la inconsistència de les metadades. El permís del head bloqueja la integració; corregir després la semàntica SEO no autoritza a deixar l’amfitrió exposat mentrestant.

## 3. Bloc B: mantindre el pla, precisar-ne els límits

Les quatre unitats del pla anterior cobrixen set P1 relacionats. No reclassifique les 31 troballes ni done les altres per resoltes.

| Unitat | Disseny que mantinc | Precisió que incorporarem a l’execució |
| --- | --- | --- |
| B1 · F02 · claus públiques | Validar la configuració efectiva després de `loadEnv`, en tots dos builds, amb un validador compartit. Rebutjar `service_role` i `sb_secret_`; admetre només els formats públics del contracte. | Reutilitzar la validació a la configuració runtime, sense registrar valors secrets. Proves amb claus sintètiques; cap inspecció d’env privat. |
| B2 · F03–F05 · sessió | Servei de sessió amb generació, un refresc compartit i deadline estable. Logout invalida la generació abans de cancel·lar peticions. | Un propietari fora dels components de ruta. Un provider per embed no ha de crear diversos renovadors del mateix estat global. Canvi d’emissor, backend o actor invalida també les respostes anteriors. |
| B3 · F14 · Notes per poble | Clau composta backend + actor + tenant, derivada d’identificadors canònics; consultes, subscripcions, overrides i conflictes vinculats al mateix scope. | Un canvi de poble buida la projecció visible i invalida resultats tardans, però no elimina esborranys pendents. El tenant procedix del context autoritzat; filtrar al client no substituïx RLS. |
| B4 · F12–F13 · desaments i conflictes | Confirmació per versió/camp; netejar només les edicions que el servidor ha confirmat. CAS amb revisió remota i conflicte explícit. | Capturar scope i seqüència en enviar. Una resposta vella no pot confirmar una edició nova. El conflicte conserva base, local i remot; resoldre vol dir recalcular i intentar CAS contra la revisió remota actual. |

Els fitxers i les APIs detallats del pla de les 13:54 continuen sent la guia d’implementació. Cal provar el contracte CAS real del backend: si no existix, el frontend no el pot simular amb un `updated_at` local. Un patch buit o un payload parcial no és confirmació del document sencer.

**Rectificació del meu pla:** el mecanisme de sessió d’A1 i el cicle de B2 formen un contracte comú, encara que es lliuren en passos revisables. B3 i B4 han de compartir identificadors de scope i generació. No crear quatre sistemes independents d’invalidació ni un marc genèric que barrege Notes, DOM i plantilles.

F15, la durabilitat dels esborranys, seguix pendent de política de producte. Proposta conservadora: conservar pendents per scope, marcar «sense confirmar» i oferir recuperació/exportació; no esborrar-los en canviar de poble. Cal decidir retenció i comportament en tancar sessió abans de prometre recuperació després d’un reinici. F09 — emmagatzematge — i F10 — backend substituït — continuen sent bloquejos quan el desplegament usa eixos fluxos.

## 4. Acte Reflex: tres capes i un contracte comú

### 4.1. Què aprove i què refute de Claude

**Aprove:** comprovar primer la cobertura real de l’arnés, lligar cada rebut a l’artefacte i posar una barrera independent de l’editor. **Rectifique la meua prioritat anterior:** la prova de l’arnés ha de precedir qualsevol afirmació que les regles s’executen automàticament.

**Refute «el disseny ja està fet; només falta endollar-lo».** A més d’activació, hi ha incompatibilitats demostrades:

- `PreInvocation` té un nivell `hooks` addicional; el contracte oficial el definix com una llista directa de handlers. El wrapper només admet `invocationNum === 1`; el contracte documenta inici en 0. Cal provar la versió instal·lada, no assumir que l’esquema local ja és compatible.
- El wrapper executa `reflex_plantilles.mjs`, que injecta text però emet `{estat, ts, plantilla, sha256}`. `verify.mjs` busca `{tipus:'matrix.rebut', t, peticio_sha256, fonts}`. Un productor i un consumidor diferents no constituïxen una porta funcional.
- `matrix.mjs` llig les fonts en Node, però la seua eixida mostra rutes i hashes, no el text complet. Això acredita lectura del procés, no recepció del contingut pel model.
- `verify.mjs` accepta un rebut recent d’una altra petició amb `fonts:[]`; no valida el contingut documental. La branca de shell permet determinats scripts abans de comprovar el rebut. En conseqüència, l’existència de documents posteriors a l’últim log no prova per si sola que el hook mai s’executara.

Fonts de contractes: [Antigravity Hooks](https://antigravity.google/docs/hooks?tab=ide) i [Cursor Hooks](https://cursor.com/docs/hooks). Cursor usa el seu propi fitxer i payload; el JSON d’Antigravity no li servix automàticament. La càrrega efectiva de cap editor no queda demostrada per llegir estos fitxers ni per executar l’script a mà.

### 4.2. Capa 1 — Senyal de vida correlacionat amb una operació

Una marca més recent que el commit és insuficient: els commits no delimiten sessions, un hook equivocat pot deixar marca i una marca d’ahir no prova cobertura hui.

`doctor` ha de distingir **desconegut / operatiu / degradat** per adaptador i versió. El perfil operatiu requerix un repte aleatori nou, workspace resolt, sessió, hash del contracte i identificador de l’operació. Una prova innòcua, iniciada per l’arnés real sobre una destinació de prova, ha de demostrar tant el bloqueig d’una escriptura invàlida com el pas de la vàlida. Fer-ho en un workspace temporal, sense tocar documents humans.

Cada operació protegida requerix el seu control; el batec és diagnòstic, no un permís de 30 minuts. Canviar perfil, contracte o sessió invalida el diagnòstic anterior. Si el hook no s’executa, no pot bloquejar-se a si mateix: el supervisor o l’eina de promoció han de detectar la falta de cobertura i evitar declarar el perfil operatiu. Les lectures poden continuar.

Adaptadors prims per Antigravity, Cursor i Claude Code, cadascun amb fixtures del seu payload real. La skill explica quan i com usar-los; no és una barrera d’escriptura. No prometre un hook en un arnés que no el suporta.

### 4.3. Capa 2 — Preparar → validar → promoure, amb rebut per document

Un motor compartit resol tipus de document → plantilla → esquema → destinació. Els scripts existents deleguen en este motor; no afegir un tercer classificador. Un desconegut no cau silenciosament en una plantilla qualsevol.

1. **Preparar:** retornar al context el text complet de la plantilla i les regles aplicables, més un esborrany fora de la Wiki operativa. Fitxar versions i empremtes. La preparació és repetible i no promou documents incomplets.
2. **Validar:** parsejar el frontmatter amb l’esquema vigent; comprovar estructura real del Markdown, marcadors pendents, ruta, nomenclatura, vincles i integritat dels camps requerits. No usar una cerca de cadenes com a parser.
3. **Promoure:** tornar a llegir els bytes, comprovar preimatge i concessió local d’un sol ús, escriure atòmicament el fitxer i el seu registre de procedència mitjançant un journal recuperable. No afirmar que diversos `rename` constituïxen una transacció atòmica de diversos fitxers.

Separar dos objectes:

| Objecte | Contingut i límit |
| --- | --- |
| Concessió local efímera | Identificador aleatori, sessió, operació, ruta exacta, preimatge, hashes de plantilla/esquema i del contingut final; consum únic. Pot tindre caducitat i autenticació local. No es distribuïx cap secret a Git o CI. |
| Procedència durable | Entrada versionada per artefacte amb ruta, versió de contracte, hashes de plantilla/esquema, petició i contingut final. La CI pot recalcular-la sense la sessió local. És traçabilitat; no una prova criptogràfica de comprensió ni de qui executà el generador. |

La procedència durable pot viure en un manifest del compilador, ordenat per ruta, amb format propi; l’empremta és dels bytes del document i queda fora d’ell, evitant autoreferències. Índex i document es preparen junts; el canvi complet es comprova de nou abans d’integrar. No afegir `nonce` al frontmatter actual: l’esquema canònic prohibix claus desconegudes. El registre del cos pot apuntar a la procedència sense duplicar l’autoritat.

**Refutació concreta del nonce de Claude:** `sha256(plantilla) + sha256(petició)` és una empremta determinista, no un nonce fresc; no lliga ruta ni contingut, és reutilitzable i es pot calcular sense comprendre cap text. Copiar-lo no demostra haver rebut la plantilla. Mantinc la vinculació proposada per Claude, però amb els camps anteriors i validació del resultat. La confiança del manifest no es confon amb una signatura: un agent amb els mateixos permisos pot reconstruir-lo; la barrera efectiva continua sent el validador independent.

Tot document nou o modificat dins de l’abast protegit necessita validació i procedència vigent, també si l’autor és humà. «Incondicional» no significa aplicar una petorreta a tots els `.md`: skills, índexs i documents generats tenen contractes específics. Una migració dels antics pot establir un baseline explícit i congelat, sense exceptuar els nous o els editats. La caducitat local no invalida la història del repositori.

### 4.4. Capa 3 — Git local i CI obligatòria

El pre-commit ha de validar **l’arbre que s’ha preparat per al commit**, incloent afegits, modificacions i renoms; el fitxer correcte al working tree no compensa un blob invàlid a l’índex. Materialitzar-lo en temporal permet reutilitzar el mateix motor sense manipular els canvis humans.

El pre-commit es pot ometre amb `--no-verify`; per això no és l’última frontera garantida. Cal una comprovació requerida en la branca protegida que valide el commit candidat complet. [Documentació de Git](https://git-scm.com/docs/githooks). Si es permet saltar la protecció remota, la garantia queda limitada a qui la respecta.

Consolidar `.husky/pre-commit` i `.githooks/pre-commit` amb un únic entrypoint i verificar el `core.hooksPath` efectiu. Reparar `.github/workflows/wiki-integrity.yml`: crida `gateall`, que no existix en `package.json`, i usa `pnpm` després d’instal·lar amb npm. El workflow `sdp_lock_ci.yml` sí usa `npm ci` i `npm run gate`, però la presència del workflow no prova que siga un check requerit. Validar amb versions del motor aprovades; una proposta que modifica el validador no s’ha de poder eximir a si mateixa.

«Només el generador pot crear documents» és exigible dins d’un canal d’escriptura controlat. Amb shell i permisos arbitraris sobre els mateixos fitxers, un hook no ho pot garantir. Per a impedir també qualsevol fitxer invàlid local cal restringir escriptures a un servei autoritzat; açò té cost operatiu. El contracte mínim proposat garantix promoció validada i integració remota validada, i declara separadament la cobertura local de cada arnés.

## 5. Fases, dependències i criteris per a congelar

| Seqüència | Lliurable revisable | Acceptació | Estimació orientativa |
| --- | --- | --- | --- |
| Preparació 0 | Matriu de decisions d’este document ratificada; tall de codi i diagnòstics identificats | Claude avalua A1–A3, B1–B4 i R1–R3; diferenciar objeccions resoltes i decisions de producte | Mitja jornada de revisió |
| Producció 1 | A1 + B1, política única de configuració i sessió | JS i missatge arriben al mateix servei; emissor absent/discordant i clau privilegiada rebutjats; dues instàncies incompatibles no munten | 1–2 jornades |
| Producció 2 | A2 + A3, propietat de DOM i navegació | Dues instàncies en els dos ordres de muntatge/desmuntatge; cap avís desconnectat; embed no modifica head/history; web pròpia manté SEO | 1–2 jornades |
| Producció 3 | B2, generacions i renovació | Refresh concurrent únic; logout durant refresh no ressuscita; expiració/deadline no es prolonguen per rerender | 1 jornada |
| Producció 4 | B3 + B4, scope i confirmació | Canvi de poble/actor amb peticions pendents; dues edicions amb respostes invertides; conflicte amb nova revisió remota; cap pèrdua de pendents | 2–3 jornades |
| Producció R1 | Prova d’activació per arnés | Bloqueig real observat i correlacionat; sense hook, diagnòstic degradat | Mitja–1 jornada |
| Producció R2 | Motor únic, concessió i procedència | Canvi de plantilla, ruta o contingut invalida la promoció; reús rebutjat; caiguda a mitjan promoció recuperable | 1–2 jornades |
| Producció R3 | Gate de l’índex + CI requerida | Invalidesa al staged, bypass local i canvi del validador no arriben a la branca protegida sense la comprovació exigida | 1 jornada |
| Revisió QA | Proves d’acceptació en navegador i backend de proves | Iframe, shadow root tancat, custom element, JWT i CAS amb el contracte real de Sollutia | Segons disponibilitat d’integració |
| Publicació | Artefacte identificat i acta de verificació | Només després de les acceptacions anteriors i de l’autorització de desplegament corresponent | Fora d’esta tasca |

Estimacions de planificació, no compromisos de calendari. El treball R1–R3 pot avançar independentment dels blocs de producte després de ratificar el contracte. No es necessita introduir un nou framework ni paquets per fer esta arquitectura.

Proves adverses mínimes del tractor: hook desactivat; payload desconegut; primera invocació; reboot de sessió; rebut d’una altra tasca; canvi de ruta; canvi de bytes després de validar; plantilla canviada; escriptura per shell; document modificat sense rebut; rename; staged diferent del working tree; hook local omés; CI sense secrets locals; caiguda entre escriptura del document i manifest. Han de tindre resultat previst i error comprensible, no només un log.

## 6. Riscos i alternatives

1. **Confiança del CMS mal delimitada.** Si un editor pot executar JavaScript arbitrari en el mateix origen, una allowlist de l’atribut no crea aïllament. Política fixada pel desplegament, servidor amb firma/RLS i, si cal una frontera real d’execució, iframe d’origen separat.
2. **Pèrdua d’esborranys en invalidar context.** Separar la projecció activa de la recuperació pendent; no purgar dades per facilitar el canvi de scope. F15 s’ha de resoldre explícitament abans de prometre persistència.
3. **Porta amb aparença de garantia.** Proves negatives reals i CI independent. Si l’arnés no permet interceptar una via, declarar eixa cobertura absent i aplicar la barrera de promoció/integració, sense un verd fictici.

Alternatives descartades: afegir només un fallback d’env deixa dos camins de sessió i confiança mutable; conservar el singleton amb un `querySelector` nou manté dependència de l’ordre del DOM; afegir una altra skill obligatòria sense validador repetix el defecte; un nonce copiat sense vincular bytes certifica una etiqueta, no la conformitat del document.

Punt més feble: el contracte d’integració real de Sollutia i la cobertura dels arnesos encara necessiten proves d’extrem a extrem. Este pla no els pot donar per verificats amb simulacions locals.

## 7. Evidència d’esta revisió

Executades **11 proves de contrast en 4 fitxers** sobre una còpia del codi actual: dos casos de sessió JS, tres de configuració, tres de permisos SEO i tres d’avisos. Totes passen com a diagnòstics: comproven els defectes actuals i dos controls positius. No són proves que el redisseny estiga implementat. JWT sintètic; DOM jsdom; no s’ha contactat amb Sollutia.

Evidència temporal: `/private/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-convergencia-260919-gqmssoh4`. També s’han repetit les sis comprovacions mecàniques del tractor sobre esta còpia: cinc diagnòstics de defecte i un control positiu del validador. No s’ha executat un hook real des de Cursor/Antigravity ni verificat la protecció de branca remota.

Lliurament documental: este pla, ancoratge a l’índex, ESTAT i entrada afegida al LEDGER. Frontmatter estricte: 16 documents, sense infraccions. Tancament en còpia: 16 → 14 orfes previs, cap nou; ancorades la resposta de Claude i la petorreta. La cadena `npm run porta` passa fins a Manifest, incloent lint i build, i es deté en Doctrina perquè la còpia exclou deliberadament l’env privat que cita un ESTAT anterior. No es certifica verd global. Les 415 empremtes prèvies de `src` i `tooling` s’han comparat sense canvis. Cap correcció funcional, commit o desplegament efectuat per Codex en este contrast.

**Ancoratge de Seguretat:** [[00_index_escriptori]]
