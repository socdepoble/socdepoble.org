---
type: informe
status: esborrany
description: Auditoria del worktree de Fase 1 amb proves locals, reproduccions de sessió, revisió SQL i matriu UI; execució autoritzada, correccions locals i límits remots acreditats.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1a43a34c-9f10-4d1d-8beb-10fc33f6759a:1da883fd-41c1-411d-aa16-e852be2eff04
---
# Auditoria extrema de Fase 1, UI i enxufabilitat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1a43a34c-9f10-4d1d-8beb-10fc33f6759a:1da883fd-41c1-411d-aa16-e852be2eff04 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T19:37:50.080Z |
| Modificació | 2026-09-26T21:09:15.261872+00:00 |
| Propietari | Codex |
| Aprovació humana | execució autoritzada explícitament al xat; acceptació final del resultat pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 (Codex); variant exacta no exposada per l'entorn |
| Tokens consumits | Entrada: no disponible; eixida: no disponible; total: no mesurat. No s'inventen xifres. |
| Ruta | auditoria |
| Tall d'evidència | HEAD 51c75c2a42e7bc6900cf8f5fa8db080398ea37f7 i worktree existent el 2026-09-26, 21:30–23:09 Europe/Madrid |
| Complexitat i fricció | Alta: Fase 1 sense commit, 1477 línies de migració SQL, 997 proves, documents extensos i directives concurrents. Sense delegació. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-26T19:37:50.080Z: esborrany creat pel circuit documental. Primera auditoria sense alterar fonts de producte.

2026-09-26: el Mestre ordena llegir les directives afegides per MarIA i implementar la correcció de fuga de tokens, arrencada pública i persistència local. Esta ordre posterior autoritza l'execució del pla; no es repetix una aprovació ja rebuda. Els resultats finals s'afegiran a este mateix document.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Diagnòstic inicial i abast

La Fase 1 aporta guards de sessió, capacitats opcionals de compte/consentiment, HTML sanejat i una separació visual del Perfil aprofitables. No acredita encara un frontend intercanviable ni un Bloc de Notes autònom. El prompt parla d'offline-first, mentre el Genotip i l'ADR anterior establixen online-first: les directives humanes noves autoritzen ara l'adaptador local. La llavor llegible no equival a persistència offline.

S'han llegit AGENTS, Genotip, índex, taxonomia, plantilla local íntegra, workflow, protocol documental, pla de les 19:50 i relleu d'Opus. S'han inspeccionat sessió, arrencada, port, Notes, Perfil, editor, SQL i configuració de build. No s'ha llegit automàticament l'arxiu històric ni cap secret. No s'ha certificat producció ni una instància PostgreSQL.

### A01 · P1 · Credencials sense àmbit de backend — reproduïda

`src/data/identitat.js` desa `{v:1,rt,sub,t}` sota una única clau; no vincula la sessió a servidor ni tenant. `supabase/auth.js:25–36` agafa eixe registre i l'envia al servidor de la configuració de la crida. `supabase/runtime.js:44–72` fa el mateix amb el JWT. La comprovació de configuracions simultànies de `sessionService` no resol la recàrrega ni el canvi seqüencial d'amfitrió.

Reproducció local amb jsdom, UUID fictici i fetch simulat: política amb emissor A, sessió desada A, `refreshSession(configB)` envia `FAKE_RT_A` a B; `request('/rest/v1/profiles',configB)` envia el JWT A a B. Zero peticions externes. Cal clau derivada de l'àmbit canònic, validació de destí abans de cada transport i invalidació de les operacions pendents en canviar-lo. No basta afegir un prefix al localStorage.

### A02 · P2 · Arrencada pública tancada a altres adaptadors

`src/host.js:configura` rebutja qualsevol `backend`; `arrenca` importa Supabase si el port és buit. El contracte neutral existeix, però el consumidor de WordPress no té una via pública admesa per instal·lar-lo. A més, `SessionProvider` normalitza només camps Supabase i `PerfilContext` importa guards de la identitat concreta.

Solució: configuració explícita d'amfitrió abans del muntatge, àlies `backend_url`/`tenant_id`, implementació validada completa i segellada. URLs procedents d'atributs editables de CMS no poden ampliar silenciosament la confiança. Mantindre DTO i capacitats; cap servei privilegiat ni service_role al navegador. Un adaptador HTTP genèric sense API documentada no seria una integració real amb Sollutia o WordPress.

### A03 · P2 · Mode local sense desat autònom — reproduïda

`src/data/supabase/notes.js:createNote/updateNote` exigix credencials i servidor també amb `dataMode: 'seed'/'local'`. La prova local confirma el rebuig sense fer xarxa. El sandbox de Notes és estat de React; no acredita supervivència a recàrrega.

Solució autoritzada: repositori IndexedDB, dades separades per backend/tenant/actor, revisions per evitar sobreescriptures i errors de quota visibles. La publicació remota no ha de mostrar èxit si només s'ha desat un esborrany local. La sincronització federada necessita encara un contracte propi; no s'inventa una cua que publique dades privades automàticament.

### A04 · P1 · Exportació SQL sobre esquemes desconeguts

`260926_1500_identitat_perfil_f1.sql:998–1025` recorre `realms`, `user_realms`, `connections`, `posts`, tria qualsevol columna UUID que coincidisca amb l'usuari i exporta la fila sencera amb `to_jsonb(t)`. La funció és `security definer`. Una coincidència en `moderator_id` o `recipient_id` no acredita dret a exportar totes les columnes, possibles dades de tercers incloses. La incidència és demostrable pel codi; l'existència i explotabilitat de cada esquema viu no s'han verificat.

Solució preparada: exportadors explícits per taula amb columnes autoritzades, propietari verificat i versió d'esquema. Ometre taules desconegudes amb un avís d'exportació parcial. PostgreSQL explica que propietaris i rols BYPASSRLS poden eludir les polítiques: https://www.postgresql.org/docs/18/ddl-rowsecurity.html.

### A05 · P1 · La purga de fitxers no està implementada

La migració només ompli `private.purga_storage_pendent` (línies 1389–1403), i `supabase/README.md:174–183` declara explícitament que falta el consumidor. Sense pg_cron actiu, tampoc programa la purga de comptes. La UI promet que tot s'esborra al cap de 30 dies. A més, Supabase documenta que un usuari propietari d'objectes Storage pot impedir l'esborrat d'Auth: cal comprovar la compatibilitat amb l'esquema viu abans d'activar-ho. Font: https://supabase.com/docs/guides/auth/managing-user-data.

Solució preparada: tasca de servidor idempotent que retire o transferisca objectes per l'API de Storage, tracte referències i errors, i només després complete la baixa. Cal monitoratge del cron i prova real amb un usuari que tinga adjunts. No s'executa cap purga en esta auditoria.

### A06 · P2 · Baixa i revocació no equivalen a invalidació immediata del JWT

`demana_baixa` elimina `auth.sessions`, però l'única nova política restrictiva de baixa actua sobre UPDATE de `profiles`. Les altres escriptures i RPC requereixen revisar la quarantena explícitament. Un JWT existent pot continuar sent vàlid fins a caducar, segons Supabase: https://supabase.com/docs/reference/javascript/auth-signout.

Solució preparada: definir les operacions admeses durant la baixa (exportar/cancel·lar, per exemple) i aplicar-ho al servidor; provar amb el token antic. `requires_human_decision: true` per a la política d'activitat durant quarantena. No es presenta com a exploit remot executat.

### A07 · P2 · Padró i versió de consentiment discrepen

`estat_consentiment` detecta la versió vigent, però `membres_del_poble` només mira `consentiment_rgpd_at is not null` (SQL:1304). Publicar una política nova deixa el timestamp anterior vigent. Mentrestant, `DetallPrivacitat.jsx` afirma que sense acceptar la versió vigent no apareixes al padró. La promesa i la consulta no coincidixen.

Solució preparada: consulta compartida que comprove l'última acció i versió quan eixa siga la política acordada. Consentiment per al padró separat de l'avís legal general; el tractament jurídic concret queda a decisió humana.

### A08 · P2 · El flux Google no demana automàticament la nova acceptació

El trigger deixa el consentiment Google pendent correctament; l'únic consumidor UI de `estatConsentiment` està a «Privacitat i dades». L'entrada Google i `RequireAuth` no conduïxen a eixe pas. Una persona pot no descobrir mai que falta completar-lo.

Solució preparada: pas explícit després de l'alta amb text i versió retornats pel servidor, sense casella premarcada ni acceptació automàtica. L'accés a exportació i baixa ha de continuar disponible.

### A09 · P2 · Terminis i exportació prometen més que el contracte

`DetallPrivacitat.jsx` fixa `DIES_GRACIA = 30`, mentre SQL admet configuració d'1 a 365 dies; també diu «totes les dades» malgrat publicacions conservades, evidències bloquejades i Storage pendent. L'exportació retorna l'inventari dels fitxers, no els seus bytes, i agrega el compte sencer en un sol JSON sense paginació.

Solució preparada: terminis i exclusions procedents del backend, estat de tasca consultable, manifest de fitxers i descàrrega autoritzada. Per a comptes grans, exportació asíncrona amb límit i caducitat del resultat.

### A10 · P2 · Ajustos UI encara pendents — mesures de navegador

Comprovació a `http://localhost:3340/notes?nota=n1`, sense publicar ni editar dades. S'ha tingut en compte el zoom existent: amplàries CSS mesurades amb `innerWidth`, no deduïdes de la captura.

| Petició | Evidència abans del canvi | Implementació prevista |
|---|---|---|
| Principal màxim 260 px | A 1024 CSS, 247,94 px: el topall ja funciona | Conservar topall i alineació |
| Secundària base 260 px | `DEFAULT_COLUMN_WIDTHS.left = 236`; preferència existent observada de 270 | Defecte 260; conservar redimensionament i preferències vàlides |
| Rail principal | En plegar: `display:none`, amplària zero | Rail amb noms accessibles i toggle al CONTROL |
| Logo estable | X obert 27,99; tancat 40; salt d'uns 12 px | Mateix ancoratge i dimensions |
| Estils comuns | Gap principal 10 px; secundària 8; cos secundari observat 18 px | Tokens compartits per lletra, icona, gap i padding |
| Eines mòbils | A 375 CSS: barra 168,8 px; tornar/eines/publicar en tres files | Botó Aa amb desplegable i Publicar en una fila |
| Metadades menudes | Botons actuals d'uns 44 px d'altura | Aparença compacta igual a les etiquetes |
| Copyright editable | NotesEditor fixa la cadena; llicencia no s'injecta | Selector i text de fins a 256 caràcters |
| Copyright persistent | DTO Notes no té copyright i Perfil el calcula del nom | Contracte, desat local/remot i truncament visual, sense truncar les dades |
| Isolation de Notes | Regla del Perfil acotada al seu shell | Mantindre eixe límit i comprovar ambdues vistes |

El mapa i el xat WhatsApp continuen al pla original com a F3/F4. La federació real necessita l'esquema viu que el mateix pla declara absent del repositori. No es deduïx que un canvi de colors o d'arrencada implemente ActivityPub o federació.

### A11 · P2 · Proves verdes parcials i portes amb cobertura limitada

La suite completa és de **997 proves: 983 passen i 14 fallen**, en 95 fitxers (93 verds i 2 rojos). Són 7 fallades de Consola i 7 de Wiki. Les 484 del relleu són un recompte parcial, no un total. No s'atribuïx l'autoria de les fallades a Opus: ja existien en començar este torn.

Les proves de migració són asserts sobre cadenes SQL, com declara la seua primera línia. Les portes d'enxufe, adaptadors, frontera i RLS passen malgrat A01–A09. Cal afegir proves de comportament i staging SQL, sense relaxar les proves per fer-les verdes.

### A12 · P2 · Higiene i tancament documental no acreditats

`porta:orfandat` inicial: 7 enllaços trencats i 1 acta òrfena. El pla continua amb metadades de Fable i l'acta d'Opus amb model/tokens pendents. No hi ha una enumeració de nou decisions. El segell de skills ja està divergent: d19baa93… → 69beea9e…; la diferència del manifest és `.agents/skills/core-context-panic/SKILL.md`.

No es pot certificar una cadena verda a partir de caselles marcades al prompt. Es repararan les àncores verificables sense llegir ni moure història; les metadades de consum alié no s'inventen. El segell requerix reconciliació explícita del canvi preexistent abans de mutacions protegides de governança.

### Decisions: límit de la font i recomanacions

L'apartat Pendents d'Opus diu «9 Decisions» però només dona exemples. La taula següent és una **proposta de nou punts de decisió**, no una reconstrucció falsa de la llista absent.

| Punt | Recomanació | Estat |
|---|---|---|
| C1 Notes privades en la baixa | Exportació abans de purga; purga definitiva només després del termini anunciat | SQL ja esborra les notes; validar política |
| C2 Google | Acceptació explícita després de tornar, sense inferir-la del login | Flux pendent |
| C3 Padró | Visibilitat opt-in separada; harmonitzar versió, retirada i RLS | Decisió humana |
| C4 Política i evidència | Text immutable, hash i versió; no donar v1 sense text per certificada | Contingut legal pendent |
| C5 Botó Tot | Llevar només filtres dins de l'àmbit actual; conservar backend, poble i actor | Criteri funcional recomanat |
| C6 Quarantena | Retornar termini real del servidor i detallar què es conserva | 30 dies és configuració, no conclusió legal |
| C7 Evidència bloquejada | Parametritzar conservació segons finalitat i obligacions validades | 3 anys del SQL no es certifiquen jurídicament |
| C8 Organitzacions compartides | Traspàs explícit i avisat; conservar publicacions i signatura | Provar grup amb 1 i amb 2 membres |
| C9 Federació | Versionar esquema i contractes; exportar només dades autoritzades | No crear taules desconegudes a cegues |

### Millores del prompt local proposades

Separar clarament mode auditoria AFK i mode execució autoritzada; dir qui ha de donar consens i on queda registrat. Llistar identificadors i text de les nou decisions. Fixar HEAD i hash del worktree, recompte total de proves i fallades conegudes. Distingir seed, offline local i sincronització. Permetre `no disponible` per a telemetria no exposada: exigir xifres reals no autoritza fabricar-les. La menció «certificació ISO» de la plantilla no és evidència d'una certificació externa.

No s'ha generat una petorreta nova ni reescrit la plantilla: s'ha llegit íntegra i es proposen millores ací.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Línia base executada

| Comprovació | Resultat |
|---|---|
| `npx vitest run` | 983 passen; 14 fallen; 997 total |
| `node --test tests/migracio-identitat-f1.test.mjs tests/backend_consolidacio.test.mjs tests/sistema_nervios.test.mjs` | 51/51 |
| `npm run lint` | Passa |
| `npm run build:web` | Passa; entrada 674 kB, avís de chunks grans |
| `npm run build:wp` | Passa; IIFE 2807,56 kB / 845,95 kB gzip |
| Enxufe / Adaptadors / Frontera / RLS estàtic | Passen |
| `npm run porta:orfandat` inicial | 7 trencats / 1 orfe |
| Segell de skills inicial | Divergent, canvi preexistent |
| Reproduccions temporals | 3 confirmades; fetch simulat, sense xarxa externa |
| Navegador | 1024 i 375 CSS; comprovacions descrites a A10 |

Logs locals: `/tmp/sdp-codex-vitest-baseline.log`, `/tmp/sdp-codex-node.log`, `/tmp/sdp-codex-lint.log`, `/tmp/sdp-codex-build-web.log`, `/tmp/sdp-codex-build-wp.log`. Reproducció executable inicial: `/tmp/sdp-codex-reproduccions.mjs`. Són temporals; el diagnòstic durable està en este document.

### Execució i verificació final · 26-09-2026, 22:46 Europe/Madrid

**Executat després de l'ordre expressa del Mestre.** A01, A02 i A03 tenen correcció i regressions; A10 té els ajustos visuals i editorials verificats. A04–A09 continuen com a riscos de backend amb proposta concreta: esta entrega no certifica la purga ni el compliment legal. A11 queda mesurat amb comparació de la línia base. A12 té els enllaços reparats i el segell reconciliat explícitament; el resultat global del tancament es registra davall.

**Credencials i arrencada pública.** `backendConfig.js` normalitza `backend_url`/`backendUrl`/`supabaseUrl` i `tenant_id`/`tenantId`. L'àmbit inclou identificador d'adaptador, endpoint complet, tenant i mode. Els tokens efímers i la sessió persistent porten eixe àmbit; els llegats sense àmbit es rebutgen quan s'activa la configuració. Un canvi esborra la identitat anterior, exigix un altre handshake i invalida respostes tardanes. REST, renovació, logout remot, SDK i bescanvi PKCE comproven el destí. La clau física persistent continua sent única: guarda un únic compte actiu amb metadada d'àmbit, no un magatzem de múltiples comptes. Canviar de node no recupera automàticament la sessió anterior.

`host.configura()` accepta un adaptador complet abans d'arrencar; valida el nucli abans de congelar la política. `arrenca()` només carrega Supabase quan no hi ha adaptador injectat. El Provider rep la configuració normalitzada; no s'ha obert indiscriminadament la llista d'orígens per atributs HTML. El pont iframe manté origen exacte i comprovació de finestra pare. `adoptaSessioExterna` és una capacitat opcional de l'adaptador, de manera que un WordPress pot tractar una sessió opaca sense imposar-li un JWT Supabase.

Exemple d'integració programàtica, abans del muntatge:

```js
configura({
  backend: adaptadorWordPress, // implementa CONTRACTE_NUCLI
  backend_url: 'https://poble.example/wp-json/sdp',
  tenant_id: 'el-poble',
  config: { backendId: 'wordpress', dataMode: 'remote' },
});
await arrenca();
```

**Notes autònomes.** `localNotes.js` implementa lectura, alta i modificació en IndexedDB. La revisió es compara dins de la mateixa transacció d'escriptura; un conflicte dona 409, una nota absent 404 i un error de quota no es presenta com un desat correcte. Les notes estan separades per backend/tenant/usuari. El mode llavor conserva les llavors i desa les diferències; `local` comença buit. El llenç inicial usa `GlobalSaveManager`, recupera el contingut i conserva els canvis escrits durant la càrrega. Les imatges locals es comprimeixen al dispositiu. Publicar en seed/local informa que la nota està desada al dispositiu i requerix connectar un backend: no simula una publicació remota.

**Interfície.** Principal amb màxim 260 px i rail plegable de 56 px, toggle al costat de CONTROL; secundària amb base 260 px i redimensionament fins a 420 px. Textos amb ellipsis, icones de 24 px, gap de 13 px, lletra d'1 rem i padding coherent. En plegar, les icones continuen accessibles i el logo de l'escriptori conserva la posició. Menú Aa amb Escape, focus de retorn i detecció de clic exterior compatible amb ShadowRoot tancat; Aa/Publicar en una fila en la prova mòbil. Metadades compactes i autoria truncada a una sola línia. Navegació superior i peu en taronja; aclariment de «SENSE CONSUMIDOR» abans de les targetes d'ActorsMapa.

La relectura del pla viu a les 22:34 incorporava ampliacions: el botó ara diu «Elegir drets d'autor», el diàleg està centrat, oferix les sis llicències CC i CC0, amb icona. El text personalitzat requerix acceptació explícita de CC0 i persistix la marca ` · CC0 1.0`; el màxim total és 256 caràcters (246 de text + 10 de marca). Els drets previs es mantenen si no es confirma una tria nova. No s'aplica CC0 silenciosament a contingut existent: [CC0 descriu una dedicació expressa i els seus límits](https://creativecommons.org/publicdomain/zero/1.0/), i [Creative Commons descriu les sis llicències](https://creativecommons.org/cc-licenses/). Esta és una correcció necessària de la frase del pla que equiparava automàticament text lliure amb domini públic.

**A4 i portada.** `DocumentPrintPreview` treballa amb el DTO del document, independent del backend. Genera HTML sanejat, portada formal opcional, CSS A4 amb marges, protecció de files/figures i vídues/òrfenes; previsualitza en iframe restringit i usa el motor d'impressió/PDF local del navegador. No carrega biblioteques ni envia el document a un conversor extern. No és un motor de composició de llibres complet: elements més alts que una pàgina, fonts i imatges remotes indisponibles requerixen revisar la previsualització final. ePub/Amazon i les fases F2–F4 del pla històric continuen fora d'esta implementació; F2 depén de l'esquema viu i d'un contracte de servidor verificat.

**Migració preparada.** `supabase/migrations/260926_2232_copyright_editor.sql` afig copyright en notes, profiles i organizations, límit 256, grants de columna i projecció de directori/RPC d'entitats, conservant RLS i SECURITY INVOKER. No està aplicada ni provada contra PostgreSQL: s'ha d'aplicar després de Fase 1 abans d'usar este client contra el backend remot. El mode seed/local funciona sense migració.

| Verificació | Resultat final mesurat |
| --- | --- |
| Vitest complet, estat compartit final | 1.011 proves: 1.001 correctes, 10 fallades (7 Consola, 3 Wiki); 101 fitxers, 99 correctes. La passada anterior als canvis concurrents tenia 997 correctes i les 14 fallades inicials |
| Proves afegides | 14 respecte de les 997 inicials: sessió entre backends/tenants i resposta tardana, PKCE, SDK parcial, adaptador públic, persistència/revisions/quota local, Aa en shadow tancat, copyright/consentiment i sanejament A4 |
| Reubicació final de prova | 4/4 d'aïllament després de moure-la a la frontera Supabase; canvis CSS finals recompilats en web i WordPress |
| Node, migració F1/backend/sistema nerviós | 51/51; les proves de SQL continuen sent estàtiques |
| ESLint | Correcte, zero avisos |
| Build web | Correcte; principal 679,58 kB / gzip 196,33; Notes 497,93 / 161,50 |
| Build WordPress | Correcte; IIFE 2.827,89 kB / gzip 852,12; el monòlit continua sent deute de rendiment |
| Enxufe, adaptadors, frontera Sollutia, RLS | Correctes; són portes de codi, no una connexió real amb servidors externs |
| Orfandat | 0 enllaços trencats, 0 orfes (inicialment 7 i 1) |
| Segell | Diferència prèvia de core-context-panic llegida i reconciliada amb els dos hashes exactes; no s'han alterat regles |
| Navegador local | Notes en seed: desat de copyright, recàrrega i restauració del text original; rail obert/plegat; Aa/Publicar mòbil, Aa desplegable; vista A4 i portada |

Logs finals temporals: `/tmp/sdp-vitest-current.log`, `/tmp/sdp-node-delivery.log`, `/tmp/sdp-lint-current.log`, `/tmp/sdp-web-current.log`, `/tmp/sdp-wp-current.log`, `/tmp/sdp-gate-enxufe-final.log`. Captures: `/tmp/sdp-codex-mobile.png`, `/tmp/sdp-codex-desktop.png`, `/tmp/sdp-codex-rail.png` i `/tmp/sdp-codex-rights.png`. El viewport temporal s’ha restaurat. Una recàrrega completa recuperà el context després del HMR de mòduls durant el desenvolupament; la prova d'arrencada es va fer des de recàrrega neta.

**Deute que queda explícit.** L'adaptador local reescriu un registre per àmbit; per a volums grans convé indexar per nota i paginar en IndexedDB. No hi ha sincronització multi-dispositiu ni resolució automàtica de conflictes amb un servidor. L'adaptador extern real de Sollutia/WordPress ha d'implementar el contracte i demostrar les seues regles d'autorització: esta entrega obri i prova el punt d'injecció, no inventa el seu protocol. Revisar A04–A09 amb esquema viu i staging abans d'activar exportació/purga. Els avisos de mida de bundle continuen presents. No s'ha fet commit, push ni desplegament.

**Telemetria final.** Model IA: GPT-6 (Codex), variant comercial no exposada. Tokens d'entrada: no disponibles. Tokens d'eixida: no disponibles. Total no mesurat. Complexitat alta; fricció principal: canvis previs sense commit, ampliació concurrent del pla, portes de governança, mock de visibilitat en shadow tancat i arnesos Node que eliminaven imports. No hi ha percentatge mesurat d'embossament de context. Les xifres de proves/build anteriors són mesures reals; els tokens no s'han estimat.


**Tall compartit final i atribució (23:09).** Mentre es tancava el torn, han canviat la Wiki, el parser Markdown i dues expectatives de la seua prova. El build fallava per una importació nova de `COPYRIGHT_SDP` des de `pageContent.js`, que no l'exporta. Codex ha corregit exclusivament eixa importació cap a `components/universal/editorial.js`, preservant la resta del canvi concurrent. Els dos builds tornen a passar. La passada completa actual acaba en 1.001/1.011; no s'atribuïx a Codex tota la reducció de 14 a 10 fallades. La prova concurrent de píndoles ara admet `saber`, `wiki` i `Wiki` duplicades i elimina «En curs», malgrat conservar el nom «sense duplicats»: cal revisar eixa regressió del contracte de la prova; Codex no n'ha rebaixat les expectatives.

**Nota Lighthouse del pla viu.** MarIA comunica Accessibilitat/Bones Pràctiques/SEO de 100 i una execució de menys de cinc segons en incògnit. No s'ha aportat ací l'informe JSON, la mètrica LCP ni una comparació controlada: la duració de l'auditoria no és el LCP, i la causalitat atribuïda a IndexedDB/extensions continua sent una hipòtesi. Codex no ha repetit Lighthouse ni ha buidat les dades locals. El cost d'IndexedDB per àmbit i el pes de bundles queden explícits com a deute, no com a rendiment certificat.

**Regularització documental.** Plan i prompt ancorats; acta concurrent 2225 incorporada amb rebut real, original immutable SHA-256 `8f13ffcaee2bba5b25ef58aaf3fa1dfd73eaa9381c81618e10b3acac90027ed4`. ESTAT i relleu LEDGER escrits mitjançant executor CAS. El LEDGER conserva el cos anterior i registra el checksum previ divergent; el checksum nou acredita els bytes actuals, sense autenticar retrospectivament el passat. Comprovació formal prèvia de tancament: `valid: true`, sense errors; passen plantilles, autoritat, ledger, segell, skills, wiki, proves documentals i SCC. Log `/tmp/sdp-tancament-ready.log`. El segellat final del torn s'executa després d'esta anotació i deixa l'estat persistent en el circuit documental.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Sense PostgreSQL local disponible ni instància staging verificada; les propietats SQL indicades són revisió estàtica i riscos concrets, no una certificació d'explotabilitat o correcció remota. Sense contracte HTTP viu de WordPress/Sollutia no es pot certificar eixa integració. No s'han executat baixes, purgues, registres, publicacions ni desplegaments reals.

La telemetria d'entrada/eixida i la variant comercial exacta del model no estan exposades a l'agent. Es registra el que consta (GPT-6) i la indisponibilitat; cap estimació s'usa com a dada de facturació. La càrrega de context és qualitativament alta; no hi ha percentatge mesurat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260926_1950_pla_implementacio]]
- [[260926_1732_execucio_opus]]
