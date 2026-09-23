---
type: informe
status: esborrany
description: Auditoria del port, transport, sessió compartida i component Pedra Seca amb esmenes al pla T3–T5.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_82803c8e-3f6f-4e3a-98d7-e8ac97a39087:5956cf90-3b0c-4e73-9c8c-4fe8bf7aa887
---
# Auditoria d’arquitectura, Frontissa i canari Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CODEX-260923-1821 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T16:21:41Z |
| Modificació | 2026-09-23T16:26:00Z |
| Propietari | Codex |
| Aprovació humana | Auditoria autoritzada; implementació sense consens acreditat |
| Model IA | GPT-6 (variant exacta no exposada al context; no s’inventa) |
| Tokens consumits | Estimació aproximada: 30000; no és telemetria facturada |
| Ruta | auditoria |
| Rebut | sdp:torn_82803c8e-3f6f-4e3a-98d7-e8ac97a39087:5956cf90-3b0c-4e73-9c8c-4fe8bf7aa887 |
| Tall d’evidència | HEAD d2f07d65e3f088363faece4d7b920f74e517efaa; arbre de treball brut, 23-09-2026 18:21–18:26 Europe/Madrid |
| requires_human_decision | false per auditar; posada en servei subjecta al consens i al contracte real |

## Acte reflex

Llegits AGENTS.md, BOOTSTRAP, genotip, índex mestre, ESTAT, workflow, skill documental, protocol del Reflex, prompt_local íntegre i plantilla retornada per la ruta auditoria. Torn documental propi i rebut persistent. Informe privat i ancorat. Cap font de producte, migració, dada remota ni desplegament modificats.

Abast: port i contracte, host, PedraSecaEmbed, política d’orígens, identitat i servei de sessió, runtime i adaptadors Supabase, restes de Frontissa, proves i build standalone. Sóc de Poble i el Rentonar mantenen el seu model de comunitat i Supabase autoritatiu: la modularitat ha de servir eixa continuïtat, no introduir un CMS nou.

## Historial

2026-09-23: auditoria del prompt Sollutia 1815 i rèplica al pla compartit 1815. No hi havia una auditoria nova de Claude a l’escriptori en les consultes d’este torn. L’ESTAT conserva el seu resum 1810; no s’ha usat com a prova de codi actual ni s’ha recorregut l’arxiu històric.

## Troballes

**Dictamen: base modular aprofitable, però integració real i canari amb sessió encara no certificables.** El port substituïx atòmicament la implementació, rebutja getters i capacitats parcials i es bloqueja abans del muntatge. Les proves d’eixa frontera passen. El problema principal està en els contractes d’origen, transport i sessió, i en una Frontissa absent; extraure funcions no els resol.

### S1 · P1 · La Frontissa descrita per l’ADR no existix com a client

`_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md:23–35` exigix `src/data/adaptadors/sollutia/client.js`, només GET, credentials omit i recursos amb captura real, traductor i fixture. El directori només conté `recursos.js`; hi ha una fixture perfil, però no el client. Tampoc s’ha trobat el tractor-frontissa citat per l’ADR. Això impedix donar T4 per implementat. El traductor accepta camps bàsics i propaga la resta del payload; no acredita una captura real ni un contracte de xarxa.

Esmena: conservar Model B. SdP llig recursos de Sollutia; Supabase SdP continua autoritatiu. T4 no ha de crear escriptures creuades ni substituir Supabase pel backend de Sollutia. Fixar endpoint i esquema real, origen i audiència del token, límits de resposta, GET exclusiu, cancel·lació, timeout, errors i fixture de procedència comprovada. Provar absència d’escriptures i de redireccions amb credencials. El contracte extern queda pendent de verificació amb Sollutia.

### S2 · P1 · L’origen del transport REST no queda fixat al projecte autoritzat

`src/PedraSecaEmbed.jsx:197–198` accepta qualsevol subdomini HTTPS de supabase.co. `src/config/publicCredentials.js` comprova forma pública, però no pertinença del projecte. `src/data/supabase/runtime.js:46–66` resol cada config i envia el JWT global a eixe URL. La fixació de config en `supabase/config.js` només protegix el client SDK, no este transport REST.

Impacte condicionat: qui puga configurar un component o alterar la seua configuració pot dirigir peticions autenticades a un altre projecte Supabase. No cal interpretar esta comprovació sintàctica com una allowlist del backend de SdP. Una reproducció aïllada amb fetch simulat confirma l’enviament de `Bearer TOKEN_SINTETIC` a un origen alternatiu; no s’ha transmés cap token real.

Esmena: fixar l’origen exacte del transport en la configuració de confiança del host abans de la sessió, comprovar-lo en totes les peticions i rebutjar canvis incompatibles entre instàncies. Prova d’acceptació: origen alternatiu rebutjat abans de fetch tant en REST com en SDK. No basta validar que una clau diga anon.

### S3 · P1 · parentOrigins no restringix els orígens incorporats

`src/config/runtimePolicy.js:71–74` retorna true per hostname abans d’avaluar `parentOrigins`. Amb política `parentOrigins: ['https://unic.example']`, `esOrigenPermes('https://sollutia.cat:9443')` retorna true. La política explícita no pot llevar els dominis incorporats i estos accepten ports HTTPS diferents. `host.js` usa este resultat en el pont postMessage; la comprovació de source=parent és positiva, però no corregix una allowlist més ampla del que declara la configuració.

Esmena: comparar orígens exactes amb una única llista congelada. Els valors per defecte només s’apliquen quan no s’ha configurat una llista. Provar ports, dominis no admesos, source incorrecte i una llista buida.

### S4 · P1 · Fallades remotes es presenten com a contingut buit correcte

`src/data/supabase/content.js:15–24` captura qualsevol error de section_submissions i notes i retorna []. `loadMur` i `loadMultimedia` poden resoldre amb èxit malgrat 401, 403, 503, timeout o cancel·lació en eixes peticions. Reproduït amb app_content correcte i dos 503 sintètics: loadMur resol amb feedPosts/events/marketItems buits.

Esmena: propagar errors de les dades requerides i distingir explícitament contingut parcial, buit confirmat i no disponible. Conservar AbortError. Provar cada estat de transport i que la UI no anuncie absència de publicacions quan falla la xarxa.

### S5 · P2 · El límit global de 50 publicacions deixa seccions sense dades

`src/data/supabase/content.js:21` carrega 50 section_submissions de totes les seccions juntes i després filtra en memòria. Amb 50 entrades més noves de mur, una publicació multimèdia anterior queda fora de loadMultimedia. No hi ha cursor ni indicador de truncament. A més, Mur i Multimèdia fan la càrrega agregada, incloent notes privades que no retornen al consumidor d’eixa secció.

Esmena: consultes per secció i contracte paginat amb ordre estable i indicador de continuació; excloure lectures privades innecessàries. Acceptació: fixture de més de 50 entrades repartides entre seccions, amb navegació a totes i cancel·lació. La paginació de loadNotes ja existix i no s’ha de descriure com absent.

### S6 · P2 · La renovació transitòria no programa un altre intent

`src/data/sessionService.js:98–109`: si refrescaSessio llança, només s’imprimix un avís. El temporitzador ja ha disparat; no se’n programa un altre en eixa branca. Una pestanya que continua visible i online pot quedar sense renovació proactiva fins a una altra interacció/esdeveniment; el transport encara pot intentar refrescar davant un 401. Troballa de lectura del control de flux, no prova contra servidor real.

Esmena: reintent limitat i cancel·lable per generació/sessió, amb tractament separat de denegació definitiva. Provar 503 seguit d’èxit amb rellotge simulat i que logout invalide el reintent.

### S7 · P2 · Multiinstància visual amb configuració de sessió global

`SessionContext.jsx:15–20` entrega la config de cada instància a `sessionService.js:31`, que substituïx un únic currentConfig. Totes compartixen estat, rol, temporitzador i listeners. El SDK fixa origen/clau, però el servei no imposa una config coherent per document. L’última instància pot determinar on es refresca la sessió de totes. El canvi de config tampoc incrementa generacio; la guarda de resultats només canvia quan canvia l’ID de l’usuari.

Esmena conservadora: declarar i imposar una única configuració de sessió/backend compatible per document, mantenint múltiples vistes. No donar suport multibackend per accident. Acceptació: dos components compatibles conviuen; un segon incompatible falla abans de qualsevol petició, sense alterar el primer. No s’afirma un bypass de RLS per esta troballa.

### Rèplica al pla 1815 i criteris de consens

- **T1–T2:** governança assignada a l’altra auditoria. Les 25 proves Node passen ara; no repetisc com a vigent l’antic recompte de proves roges. No certifique el linter ni la cadena global.
- **T3:** backendPort té 130 línies aproximadament i ja separa contracte i implementació. Corregir «extraure sense alterar backendPort»: es pot preservar la seua API, però l’extracció requerix canviar imports. Validadors UUID i mapatges duplicats viuen sobretot en notes/content/runtime. Extraure només funcions pures amb proves de caracterització; evitar una refactorització general abans de reparar els límits observables.
- **T4:** resoldre S1–S5 amb contracte Model B, sense inferir compatibilitat del JWT Sollutia amb Supabase. Cal comprovar servidor emissor, audiència, signatura admesa, renovació, CORS i RLS amb usuaris/tenants diferents en staging.
- **T5:** després de S2–S4 i del contracte de sessió, canari en host autoritzat amb arrencada manual, dues instàncies, moviment/desconnexió/reconnexió, origen/tenant incompatibles, errors 401/403/503, caducitat i navegació. Comparar captures abans/després per mantindre la Llei del Píxel. El build no prova eixos comportaments.

El pla actual conserva frontmatter de plantilla canònica, títol i camps pendents, i no conté verificació ni riscos concrets. No l’avale com a pla executable. Esta auditoria deixa les esmenes a la pissarra documental sense atribuir consens a Claude o MarIA ni tocar el seu fitxer concurrent.

Alternatives descartades: substituir Supabase per un backend Sollutia complet (contradiu Model B); reescriure el motor de dades sencer (amplia risc sense necessitat). A sis mesos, una política única d’origen i un transport amb errors explícits són més mantenibles que excepcions repartides.

### Millora del prompt local

Omplir Tasques i criteris abans d’enviar-lo; enllaçar explícitament el pla compartit i les auditories actives; separar auditoria de desplegament; evitar afirmar «portes inviolables» com a premissa. Sincronitzar v2.3.0 del text amb v2.2.0 del router. Permetre «variant no exposada» en Model IA i separar tokens estimats dels mesurats. Les caselles de l’autor no han de convertir-se en una ordre d’arxivat per a l’auditor.

## Verificació

- `node --test tests/backend_consolidacio.test.mjs tests/sistema_nervios.test.mjs`: **25/25**.
- `npx vitest run src/data/supabase/notes.test.js`: **2/2**.
- `node tooling/gates/tractor-enxufe.mjs`: passa E1–E4; comprovació estàtica.
- `node tooling/gates/tractor-sollutia.mjs`: passa S1/S3/S4 de CSS/ordre/tokens; el nom no significa que prove API, JWT o RLS.
- `npx vite build -c vite.standalone.config.js --outDir /tmp/sdp-audit-1821-embed`: correcte, 2150 mòduls, bundle 2569,65 kB (gzip 771,24 kB). Sense lifecycle de prebuild ni escriptura de fonts.
- Reproduccions aïllades per stdout: transport amb JWT sintètic, 503 transformat en buit i parentOrigins ignorat per hostname incorporat. Per a transport/content s’han substituït dependències i fetch en memòria; són reproduccions de funció, no proves end-to-end.
- `npm run porta:orfandat`: roig, 66 enllaços reportats i 4 orfes. Alguns avisos són rutes físiques existents que la porta no resol; no equivalen a 66 fitxers absents. No s’ha reparat ni arxivat documentació aliena.
- URL canònica per al canari posterior: http://localhost:3340. No s’ha executat verificació visual ni trànsit real contra Sollutia.

### Tancament documental

`document.mjs check` retorna valid:true. `tancament.mjs --turn-id torn_82803c8e-3f6f-4e3a-98d7-e8ac97a39087 --check` retorna valid:false: falta vincular un pla vàlid i el relleu al LEDGER; fallen segell, projeccions de skills, compilació estricta de Wiki i SCC. Els tres documents 1815 apareixen sense àncora directa al seu índex. No s’ha fabricat un pla aprovat, resegellat governança aliena ni declarat el torn tancat. ESTAT actualitzat i auditoria lliurada; sanejament documental i Acta Marmota queden pendents.

## Límits

No s’ha certificat staging, RLS, configuració remota ni contracte JWT amb Sollutia. Cap secret llegit o exposat. L’arbre tenia canvis aliens previs; HEAD no representa tot el contingut auditat. No s’han desplegat canaris ni canviat fonts. Acta Marmota de sessió pendent. La implementació continua en AFK fins al consens exigit per l’usuari.

Riscos del pla futur: canviar errors pot requerir estat parcial explícit a UI; fixar orígens pot rebutjar hosts abans tolerats; separar consultes pot alterar ordre/paginació; un reintent mal invalidat pot actuar sobre una sessió posterior. Cadascun requerix la prova d’acceptació indicada abans de desplegar.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1815_pla_implementacio]]
- [[260923_1815_prompt_auditoria_sollutia_codex]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
