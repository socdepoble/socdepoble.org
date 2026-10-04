---
type: informe
status: esborrany
description: 'Informe de Claude Opus de l''Onada 3: llavors reals, Model B absolut, Lector RSS, incidències de producció, mestre-detall mòbil, PWA i laboratoris de skills i anticipació'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_dba36e21-76fb-4102-b18c-450a601d6787:eb31101e-6c01-4a4b-a9f3-0196bd6296c1
---
# Onada 3: disseny, La Parròquia, Mercadona, Salut, enxufe i tractor d'anticipació

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dba36e21-76fb-4102-b18c-450a601d6787:eb31101e-6c01-4a4b-a9f3-0196bd6296c1 |
| Versió del document | 1.0.1 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T11:30:56.462Z |
| Modificació | 2026-10-03T17:30:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestració multiagent: 14 workflows i 117 agents |
| Tokens consumits | uns 36 M en subagents (xifres dels workflows); l'orquestrador a banda |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-03T11:30:56.462Z: esborrany creat; contingut i verificació pendents.
2026-10-03T12:05:00.000Z: v0.2.0, pla d'execució escrit abans de picar codi (sdp-workflow §1), després de la fase d'exploració.
2026-10-03 (vesprada): el Mestre i MarIA hi afigen la secció «Auditoria Visual (Mestre) - Producció», que es conserva íntegra.
2026-10-03T17:20:00.000Z: v1.0.0, resultats de totes les tasques, verificació final, pendents, bloc d'ESTAT i línies de LEDGER per a MarIA.
2026-10-03T17:30:00.000Z: v1.0.1, resposta a l'auditoria de Codex (261003_1903): F1 i F2 acceptades, decisions 13 i 14.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Pla d'execució (escrit abans de picar codi, sdp-workflow §1)

Exploració: sis agents de lectura (T1–T6) han cartografiat el codi i les dades reals. Decisions de l'orquestrador, reversibles i pendents de confirmació del Mestre:

- **Fonament comú** (`src/utils/fulls/`): lector XLSX pur (`llegixLlibre`), motor DEFLATE pur copiat de la Gestoria com a deute declarat (la Gestoria no es toca: els seus tractors estan signats per empremta) i lector CSV (`llegixCsv`). El fan servir T2, T3 i T5.
- **T2 La Parròquia**: importador Loyverse genèric i pur, còpia del CSV al repo amb prova de fidelitat contra l'original, llavor «La Parròquia · Menjar i Beure» carregable des d'Ajustos › Carta amb el torn tancat. La llavor d'exemple i la primera càrrega no canvien. 12 categories pel prefix, IVA corregit en 4 productes, variant per defecte la més barata, modificadors sense importar (l'exportació no porta les opcions). Fotos: mapa d'imatges per al Mestre i resolutor enxufable; cap binari copiat.
- **T3 Nevera**: 592 productes de Mercadona a l'autocompletat, en castellà comercial, amb marca i envàs com a secundari. Preu desat i no mostrat, cap imatge de tercers ni la ruta personal del CSV. La graella només mostra els productes en ús, que és el que demana la Llei del Píxel. L'encapsulament del Calendari queda pendent de decisió del Mestre.
- **T4 Enxufe**: regla transversal de fronteres per a totes les apps; la resta és informe amb decisions (A1 WordPress, Model B al nucli, àmbit de les bases locals).
- **T5 Salut**: importador pur de la graella horària del diari miccional i de l'exportació pròpia, amb vista prèvia i confirmació humana i només en mode «afegir». Fixture sintètica: el fitxer real és una plantilla buida.
- **T1 i T6**: laboratoris `.txt` a `02_investigacio_ia/`, perquè Claude no pot escriure a `.agents/` ni a `tooling/`. T6 porta el nucli executable `anticipacio.mjs` amb proves.

### Auditoria Visual (Mestre) - Producció
Durant la comprovació de la release a producció (`gentdelatorre.net`), el Mestre ha detectat els següents aspectes que cal corregir/millorar:
- **Incidència al Xat**: No es mostren les imatges dels avatares a la llista de converses (ni els de grups com 'La Torre', ni personals com 'IAIA MarIA' o 'Sóc de Poble'). Actualment el sistema fa "fallback" a les inicials (LT, IM, SD) amb fons de color. Cal arreglar la ruta o resolució de les imatges reals.
- **Incidència d'Imatges (Rutes 404 a producció)**: Dins de l'UniversalPage (per exemple, a la secció "El projecte"), les imatges del cos de l'article no es carreguen, mentre que la de la capçalera sí. A la consola s'observen errors 404 (`que-es-socdepoble-1.jpg`, etc.). És un problema de resolució de rutes en l'empaquetat: la ruta relativa no es resol correctament cap al directori del plugin de WordPress (`wp-content/plugins/socdepoble-enxufe/dist/...`). L'agent ha de revisar com el *bundler* gestiona les rutes dels *assets* dins del contingut ric.
- **Dèficit UI al Calendari**: La vista mensual actual és massa bàsica. S'ha d'evolucionar per a que siga un clon visual i d'experiència (UX) de **Google Calendar**. Les captures de referència es troben a la carpeta `_wiki_de_poble/04_escriptori/01_produccio/google_calendar_clon_pantalla`. Cal refer eixa vista aplicant l'estil Pedra Seca.
- **Ajustos al mòdul Dispositius (Foraster)**:
  - En mode foraster (usuari no registrat), el nom suggerit per defecte no ha de ser "Ordinador de Javi", sinó un nom genèric com "Ordinador de l'usuari", "Mòbil de l'usuari" o "Dispositiu de prova".
  - El text d'estat buit ("Encara no hi ha altres instàncies visibles.") s'ha d'alinear al centre.
  - El disseny general d'aquesta pestanya ha quedat "antic" respecte a l'arquitectura actual. Caldrà fer un redisseny visual en el futur, però de moment l'agent ha de garantir i comprovar que les connexions WebRTC subjacents siguen 100% funcionals.
- **Regressió UX al mòdul Notes Personals**:
  - **Barra lateral esquerra**: Cal afegir un botó clar de "Crear nota". A més, el flux ideal és que sempre hi haja una nota preparada per defecte ("Nota sense títol") per a convidar a escriure. El missatge de "Connecta per veure les teues notes" s'ha de revisar si l'usuari ja està logat.
  - **Panell lateral dret (Vista prèvia de la targeta)**: **S'ha d'eliminar completament.** Ocupa massa espai (trenca el disseny en pantalles tipus MacBook Air) i és inoperatiu. L'editor central ja mostra com queda el contingut.
  - Els nous botons d'etiquetes i categories de l'editor li agraden molt al Mestre, s'han de mantenir i refinar.
- **ERROR CRÍTIC - Redirecció d'autenticació (Violació del Model B)**:
  - En fer clic a "Entrar amb Google" des de l'amfitrió `gentdelatorre.net`, l'usuari és redirigit per error cap a `socdepoble.org/registre`.
  - Com assenyala el Mestre, el flux d'autenticació està buscant una dependència de producció ('hardcoded' a `socdepoble.org`, on resideix una versió antiga de fa 3 mesos de l'SPA).
  - Aquesta dependència és inacceptable i trenca la independència del plugin (Model B). Després de logar-se a Google, l'usuari ha de tornar exactament a la mateixa pàgina de l'amfitrió actual (`gentdelatorre.net`) des d'on va iniciar el procés. L'agent ha de revisar el codi d'autenticació per a llegir el domini actiu de manera dinàmica i eliminar qualsevol referència fixa a `socdepoble.org`.
- **Manca de flux de recuperació de contrasenyes**: 
  - A la pantalla d'accés per correu, no hi ha cap botó o enllaç per a "Has oblidat la contrasenya?". Si un usuari la perd (com acaba de passar-li al Mestre), es queda totalment bloquejat.
  - L'agent ha d'implementar de forma prioritària el flux de restabliment (enviament de correu per part de Supabase i pantalla per a definir la nova) i afegir l'enllaç a la interfície actual.
- **Regressió UX en mòbil (Mòduls amb Editor Universal)**:
  - En mòduls com "Disseny" o "Notes Personals", el panell secundari (carpetes/llista) desapareix ocult en la vista mòbil i l'usuari entra directament a l'editor sense saber que hi ha navegació interna.
  - **Solució requerida**: L'agent ha d'implementar el patró *Master-Detail* (com WhatsApp). En mòbil, la primera vista en entrar al mòdul ha de ser el panell de navegació (carpetes). En seleccionar un ítem, es passa a la vista de l'editor, i la fletxa `<-` de la capçalera blava ha de permetre tornar arrere a les carpetes. Alternativament, habilitar un botó a la capçalera (menú hamburguesa o icona de carpetes) que desplegue el panell per damunt com un calaix (*drawer*). No s'han de mantindre dos panells esquerres alhora en mòbil per no malbaratar espai valuós.
- **Adaptació del Snippet (Curador) per al Lector RSS**:
  - Amb la introducció del Lector RSS, quan l'usuari afig una nova font o enllaç mitjançant el component Snippet, necessita saber la finalitat d'aquest enllaç.
  - **Solució requerida**: S'ha d'ampliar el formulari del Snippet perquè permeta a l'usuari triar la destinació/ús de la font introduïda: com a anotació/marcador per al "Bloc de notes", o com a nova font/feed per al "Lector RSS".
- **Pàgina de presentació per al Snippet a Control > Utilitats**:
  - Cal un lloc on l'usuari puga entendre què és el Snippet i instal·lar-lo.
  - **Solució requerida**: L'agent ha de crear una pàgina informativa per al "Snippet" dins de la llista d'Utilitats/Connectors del panell de Control. Aquesta pàgina explicarà què és i oferirà un botó cridaner per a descarregar l'extensió o instal·lar-la directament a Chrome.

### Resultats (estat final, 2026-10-03 19:20)

Tot el codi d'avui és a l'arbre SENSE COMMIT (uns 200 fitxers). Cada tasca ha passat per implementació, dos revisors adversarials i correcció. Les notes de disseny són a `02_investigacio_ia/261003_1330_produccio_claude/` (P1, P2, P4, P5, P6, R, MD, SN, CU, AV).

| Tasca | Estat | Què ha quedat | Proves finals |
| --- | --- | --- | --- |
| F · Fonament de fulls | fet | `llegixLlibre` (XLSX), `llegixCsv`, DEFLATE pur (deute declarat: còpia de la Gestoria) | fulls 127/127 |
| T1 · Skills de disseny | laboratori | `sdp-grafics-dades`, `sdp-qa-visual`, plecs de policia i document de disseny; recerca web no verificada (hook) | rutes i disparadors comprovats |
| T2 · La Parròquia | fet en codi | importador Loyverse genèric; carta real 327 productes, 564 variants, 12 categories; Ajustos › Carta; variant més barata d'un toc (confirmat) | Bar 217/217 |
| T3 · Nevera + Mercadona | fet | 592 productes a l'autocompletat, sense imatges de tercers ni rutes personals | Nevera 149/149 |
| N · Temporada (decisió 1) | fet | pestanya «Temporada»: llista per estat del mes + «De temporada a <mes>», filtre i mes a la URL, separable | 258/258 |
| S · Temporalitat agrícola | fet | `src/utils/temporada/`, 56 productes, calendari orientatiu NO VERIFICAT | 72/72 |
| T4 · Fronteres | fet | regla transversal per a totes les apps | 56/56 |
| T5 · Salut | fet | importació del diari miccional i de l'exportació pròpia, amb confirmació humana | 254/254 |
| T6 · Tractor d'anticipació | laboratori | diagnosi de la recaiguda, nucli `anticipacio.mjs.txt`, skill `core-anticipacio`, INTEGRACIO | 41/41 |
| A1 · Model B absolut (decisió 4) | fet en codi | WordPress sense Tenant ID; tenant, backend i serveis propis només de la capa del paquet | 560/560, conformitat 16/16 |
| G · Indicadors admin (Graphfy) | fet en codi | bloc «Indicadors» amb grups petits protegits | 67/67 |
| RSS · Lector 1.0 | tancat | estructura Feedly, estil Pedra Seca, targetes 16:9 (excepció autoritzada), mòbil amb carpetes primer | 177 + 724 |
| P1 · OAuth (crític) | fet en codi | Google i l'alta per correu tornen a la pàgina de l'amfitrió; cap domini al flux; PWA instal·lada sense finestra emergent | 164/164 |
| P2 · Imatges 404 | parcial | causa: les 4 infografies no són a `public/`; cal `git mv` humà | roja per disseny fins al moviment |
| AV · Avatars del Xat | fet en codi | producció serveix el bundle 1.0.1; cares al rail i Preferits; `CaraXat` sense referències crues | xat verd |
| P4 · Notes | fet | fora el panell dret, «Crear nota», «Nota sense títol» que no es desa buida | 334/334 |
| P5 · Dispositius | parcial | nom genèric i estat buit fets; NO hi ha WebRTC (només entre pestanyes) | 40/40 |
| P6 · Calendari | parcial | `/calendari` obri la vista Mes estil Google; la pestanya del Mur continua bàsica | 537/537 |
| R + R2 · Recuperació | fet en codi | enllaç, missatge genèric, verificació en prémer «Desa» (Safe Links), «coincidixen» | 2391/2393 (2 alienes) |
| MD · Mestre-detall mòbil | fet | Notes, Disseny, Wiki, Perfil i Admin s'obrin per la navegació en estret | 1647/1650 (3 heretades, ja verdes) |
| SN · Destí del Snippet | fet | «Bloc de notes» o «Lector de notícies» (font personal «pendent del connector») | 993/993 |
| CU · Fitxa del Snippet | fet | `/control?fitxa=snippet`, botó desactivat honest fins a `snippetChromeUrl` | 102 |
| FIX · Integració | fet | `.sdp-boto` del Perfil encapsulat (58 px recuperats), clau `snippetChromeUrl`, bookmarklet sense domini, proves de tenant amb UUID | 1818 |
| PWA · Fase 0 | fet en codi | manifest, `sw.js` prudent, registre només a l'entrada pròpia | 50/50 |
| PLA · Capacitor F1–F2 | laboratori | `261003_1330_empaquetat_mobil_claude/` (compte de Play: organització) | — |
| Onada 4 | laboratori | `261003_1330_onada4_claude/`: ADR multimèdia (font única, GPS opcional en columnes), retallador, esmena de l'ADR-2026-08 | — |

### Decisions del Mestre aplicades hui

Graphfy = dashboards i UI de dades; variant més barata d'un toc; A1 retirat i SPA cega a l'amfitrió; temporada creuada amb la llista; Lector amb estructura de Feedly i estil Pedra Seca, 16:9 només al Lector, sense barra inferior, carpetes primer en mòbil; `.sdp-boto` encapsulat; Safe Links («Desa»), «coincidixen» i missatge genèric; Apple i Google Play com a organització; una sola app; Capacitor aprovat; PWA implementada pels agents; retallador a l'Onada 4 (criteri de l'orquestrador acceptat); directriu de font única i metadades en columnes.

### Pendents de MarIA (governança i lease)

1. **Bloquejant de qualsevol commit**: reescriure `tooling/wiki/tractor-frontera-auth.mjs` (exigix el relé que P1 ha retirat) segons `P1.txt` §7.1. Mai `--no-verify`.
2. Registrar al LEDGER les línies d'este informe i pegar el bloc d'ESTAT; tancar amb `node tooling/gates/tancament.mjs --check --turn-id torn_dba36e21-76fb-4102-b18c-450a601d6787`.
3. Refer el pla buit `261003_1250_pla_implementacio_maria.md` (cinc `[pendent]` i sufix d'actor) o arxivar-lo; ancorar els laboratoris `261003_1330_*` i declarar a «Activitat en curs» el que continua viu.
4. Commits per lots: fulls amb T2 i T3; `pageContent.paquet.test.js` amb el `git mv` de les infografies; `legalContent.js` corregit en el mateix lot que P5; el Lector segons decidisca el Mestre.
5. Bundle i ZIP del connector (core-empaquetat-wp): versió 1.0.2 per confirmar, Changelog de la 1.0.1, readme sense el relé.
6. Leases de laboratoris: skills de T1 i lliçó de `sdp-pedra-seca` (`261003_1330_llicons_claude.txt`); tractor d'anticipació T6 en l'ordre D4; `prepara-pla.mjs` de Capacitor.
7. Wiki amb wiki-propagar-veritat: `estandard_integracio_react.md` (Model B absolut i tornada d'OAuth), ADR Sollutia, ADR multimèdia i esmena de l'ADR-2026-08 (esborranys a `261003_1330_onada4_claude/`); secció «Mòbil: mestre-detall» a `sdp-app-grid-shell`.
8. Executar les portes que la shell de Claude no permet: tractor-pedra-seca, tractor-persistencia, tractor-adaptadors, tractor-cataleg, tractor-frontissa, tractor-frontera-auth (després del punt 1) i porta-olivera.

### Accions humanes i externes

1. `git mv` de les quatre infografies `assets/img/que-es-socdepoble-{1..4}.jpg` a `public/assets/img/`, en el mateix commit que `src/sections/text/pageContent.paquet.test.js`.
2. Supabase: Redirect URLs per amfitrió (gentdelatorre.net, socdepoble.org, Sollutia, localhost per a proves); plantilla «Reset password» amb `{{ .RedirectTo }}#token_hash={{ .TokenHash }}&type=recovery` en valencià; SMTP propi; Site URL al final, apuntant a `/registre?mode=entrar` d'una app amb el codi nou (mai a l'arrel ni a l'SPA vella).
3. Desplegament: reinstal·lar el connector amb el ZIP nou i publicar socdepoble.org; comprovar /xat (cares), /projecte (infografies), «Entrar amb Google» i Notes.
4. Icones PWA de 192, 512 i maskable (cal triar brúixola o mapa) i verificació de `FASE0_PWA.txt` §6 en dispositius amb https.
5. Fotos de La Parròquia segons `MAPA_IMATGES.txt` (199 de 327) convertides a webp 1:1.
6. Neteja de la història de git abans de cap push (git filter-repo): el CSV de Mercadona (porta rutes del disc personal), l'XLSX de salut i la sessió de WhatsApp coneguda.
7. Vercel: `vercel.json:8` no porta `data:` a `connect-src`; comprovar les pujades d'imatges al web.

### Decisions obertes del Mestre

1. **Botons revelats** per l'encapsulament de `.sdp-boto`: a /registre («Entrar al compte», «Entrar amb Google», «Torna-ho a provar») i a /control («Missatges per a dubtes», «Eixir del poble») ara es veu la varietat que declara el JSX (secundari). Vols «Entrar al compte» com a primari?
2. **Calendari**: la vista «massa bàsica» era /calendari (fet) o la pestanya del Mur?
3. **Dispositius**: ADR de transport entre aparells (WebRTC, Supabase Realtime) o només entre pestanyes; corregir els textos que prometen transport entre aparells.
4. **La Parròquia**: preus del CSV o del Loyverse viu (4 divergències); opcions dels 13 grups de modificadors; on viuen les fotos; marca.
5. **Nevera**: els 592 productes com a catàleg públic o importació només local.
6. **Recuperació**: arreglar també en codi la pèrdua del token quan l'enllaç aterra a «/».
7. **Snippet**: publicació de l'extensió (Chrome Web Store o .zip); bookmarklet visible a la fitxa.
8. **Indicadors**: llindar de 5 amb barres veïnes protegides o arrodonir a múltiples de 5; RPC `admin_indicadors`.
9. **Enxufe**: àmbit de les bases locals de les apps (poble, persona o dispositiu); signatura de l'ADR de Sollutia.
10. **Skills i anticipació**: enllaç de Pace i finestra de recerca web (T1 D2–D3); D1–D5 de T6.
11. **Mòbil**: Q1–Q8 de `MD.txt` §6 (enllaç directe a l'editor, Arrere del sistema, tornada al Tauler d'Admin en ample).
12. **Barra mòbil**: «Telefonades» (2 proves roges des d'ahir).
13. **OAuth fora de la PWA (F1 de Codex)**: redirecció completa a tot arreu (recomanat) o emergent sense prendre `closed` com a cancel·lació, amb botó «Cancel·la».
14. **Full de ruta (F2 de Codex)**: destí intern de les 39 llavors de `pageContent.js:126`.

### Reunió davall l'Olivera: resposta a l'auditoria de Codex

Llegit sencer [[261003_1903_auditoria_codex]] (i el seu prompt [[261003_1900_prompt_codex_auditoria]]). Codex va llegir esta auditoria quan encara era la v0.2; els resultats són els d'esta v1.0. Coincidim amb les dues troballes:

- **F1 · P1 · Vigilant de l'emergent d'OAuth i COOP** (`src/data/oauthRelay.js:385–390`). D'acord: amb COOP, `closed === true` no prova que la persona haja cancel·lat, i el codi avorta l'entrada i esborra el verificador PKCE. Ve d'abans de l'onada, però és l'àrea que P1 ha tocat hui i contradiu el retorn fiable que es demanava. La PWA instal·lada ja no passa per este camí (redirecció completa). Proposta de l'orquestrador: **fer la redirecció completa també fora de la PWA** (el camí ja existix i està provat; tornada a la mateixa pàgina de l'amfitrió amb `urlDeTornada`), i retirar la finestra emergent. Alternativa: mantindre l'emergent sense prendre `closed` com a cancel·lació, amb el termini de 180 s i un botó «Cancel·la», que és un canvi visible. És codi crític: segons el protocol de l'Olivera, no es toca fins que el Mestre tria l'opció; s'implementa amb la prova que Codex descriu (`closed` passa a `true`, almenys un tic i després el codi).
- **F2 · P2 · 39 enllaços del full de ruta fixats a socdepoble.org** (`src/sections/text/pageContent.js:126`). D'acord: deute heretat que trenca la portabilitat. Cal que el Mestre decidisca el destí de cada llavor sense equivalent intern; les que hagen de ser externes, declarades com a tals.
- **Governança**: Codex observa que `tancament.mjs --check` del seu torn ix amb 584 errors (signatura del LEDGER i SCC). El tancament del torn de Claude està en la mateixa situació i l'ha de fer MarIA (punt 2 dels pendents de MarIA).

### Directriu per a l'Onada 4

Font única: retall, zoom i enquadrament al client amb canvas; un sol fitxer a Supabase; compartir crea referències, mai còpies; EXIF destruït per defecte; opció «Vull geolocalitzar aquesta imatge» que llig el GPS de l'original abans del canvas; coordenades, autoria, data i llicència com a columnes. Esborranys a `02_investigacio_ia/261003_1330_onada4_claude/` (ADR_MULTIMEDIA_FONT_UNICA, RETALLADOR, ADR_PWA_ESMENA). Primera tasca: endollar `DialegEnquadrament` (1:1, ja existent) a l'avatar del Perfil i estrenar-lo amb la Pastaora per a la IAIA MarIA.

### Bloc d'ESTAT proposat (per a `.agents/ESTAT.md`, l'enganxa MarIA)

```markdown
## ESTAT_ACTUAL · 2026-10-03 · Claude (Opus 5.5) · Onada 3 completa, sense commit
- Torn torn_dba36e21; auditoria [[261003_1330_auditoria_claude]] v1.0.0; acta [[261003_1920_acta_marmota]].
- Fet a l'arbre (uns 200 fitxers): fulls XLSX/CSV, La Parròquia (Loyverse), Nevera + Mercadona + Temporada, importació de Salut, A1 Model B absolut, indicadors d'admin, Lector RSS 1.0, P1 OAuth, P2/AV avatars, P4 Notes, P5 Dispositius (parcial), P6 Calendari, recuperació de contrasenya amb Safe Links, mestre-detall mòbil, Snippet → Lector, fitxa del Snippet, PWA Fase 0. Laboratoris: skills de disseny, anticipació, empaquetat mòbil, Onada 4.
- Proves: suite ampla 9460/9464 (3 roges conegudes: 2 Telefonades, 1 infografies fins al git mv); node 8 bateries verdes; tractor-enxufe E1–E4; design_guard 27 crítics preexistents.
- Bloqueig: la Porta Frontera Auth exigix el relé retirat; cap commit fins a la lease de MarIA. Producció continua en 1.0.1.
- Següent: lease de la porta → commits per lots → bundle i ZIP → Supabase → desplegament. Onada 4: retallador, ADR multimèdia, Capacitor F1–F2.
```

### Línies proposades per al LEDGER

```text
261003 | recaiguda | core-higiene-escriptori | torn preparat amb quatre vius d'ahir sense caducitat; sisena en dotze dies
261003 | incidència | wiki-cicle-de-vida | b22b168b9 confirmat amb --no-verify després d'un pre-commit fallit
261003 | incidència | sdp-workflow | lab 261002_1510 aplicat amb cp -R sense lease: fatiga mig instal·lada
261003 | correcció | sdp-pedra-seca | clon: estructura UX externa, estil exclusivament Pedra Seca
261003 | torn | onada-3 | torn_dba36e21: T1–T6, A1, G, S, N, Lector, P1–P6, R, R2, CU, MD, SN, PWA; sense commit
261003 | proves | integració | suite ampla 9460/9464; 3 roges conegudes; portes node verdes
261003 | bloqueig | tractor-frontera-auth | la porta exigix el relé que P1 retira: cap commit fins a la lease
261003 | incidència | recuperacio | R2 interromput per límit de sessió; revisat i corregit a la integració
261003 | decisió | model-b | A1: tenant, backend i serveis propis només del paquet; WordPress sense Tenant ID
261003 | decisió | multimedia | Onada 4: font única, retall al client, GPS opcional com a columnes
261003 | troballa | dispositius | sense WebRTC: només BroadcastChannel entre pestanyes
261003 | pendent | desplegament | producció en 1.0.1.f094730c2c44, sense cap correcció d'avui
```

### Retroalimentació sobre la plantilla `prompt_local`

La secció 0 del prompt d'avui substituïa les caselles de la plantilla per «el prompt està validat», i la porta Olivera ho dona per bo perquè només busca caselles sense marcar. A més, `document.mjs` reemplaça l'«Acte reflex» pel rebut, i la clàusula d'automillora de la plantilla no arriba mai a qui rep el prompt. Proposta (laboratori T6): que la secció 0 la genere la màquina amb l'informe de misèries i una casella per avís, i que la porta exigisca la marca i el digest del rebut.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Suite ampla** (`npx vitest run src --silent`, integració final): 561 fitxers, 9460 de 9464 proves verdes, 1 omesa. Roges: `App.test.jsx:459` i `:492` («Telefonades», preexistents) i `pageContent.paquet.test.js:49` (roja per disseny fins al `git mv` de les infografies).
- **Node**: conformitat-amfitrio 16/16, enxufe-plugin 17/17, enxufe-empaqueta 19/19, standalone-build 18/18, salut-diari-miccional-estructura 8/8, anticipacio-261003 41/41, porta-olivera-v3 11/11, backend_consolidacio 14/14.
- **Portes**: tractor-enxufe E1–E4 en verd; tractor-rls sense forats en 33 fitxers SQL; design_guard 27 crítics (ix amb 1 per `Dialeg.test.jsx` i `DocumentPrintPreview.jsx`, preexistents). `tests/lint_logica_usuari.test.mjs` ix roja per deute heretat que ara aflora perquè hem tocat `modules.css` (`--sdp-radi-base` a `.sdp-consola__ajust`, línia 5782, i classes òrfenes de PageFrame): no es corregix per la Llei del Píxel.
- **Navegador** (servidor de desenvolupament, pestanya de fons): carta de La Parròquia carregada (327, 564, 12, amb 18 avisos); importació de Salut; Lector en escriptori i a 375 px; Notes a 375 px amb les carpetes primer; pestanya Temporada a l'octubre; avatars del Xat locals. Els agents van verificar també el botó gran a 58 px, les targetes 16:9, Disseny en mòbil i la destinació del Snippet.
- **No verificat**: res a producció (cal desplegar); PWA en dispositius; OAuth i recuperació contra un Supabase real (el local no responia); transport entre aparells (no existix).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

La shell confinada no permet executar `tancament.mjs`, `eslint` directe, `git log` per ruta, builds ni la recerca web: les afirmacions sobre eines externes i polítiques de botigues queden marcades com a no verificades. Claude no pot escriure a `.agents/`, `tooling/` ni `.claude/`: les skills, el tractor i el pla de Capacitor viuen com a laboratori fins que MarIA o el Mestre els instal·len amb lease. Claude no pot moure ni copiar binaris: les infografies, les icones PWA i les fotos de La Parròquia requerixen una persona. Un agent (R2) es va aturar pel límit de sessió; la integració final el va revisar i corregir. El LEDGER i l'ESTAT els ha d'actualitzar MarIA amb el text d'este informe.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
