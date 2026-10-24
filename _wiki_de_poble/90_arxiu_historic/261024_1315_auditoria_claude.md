---
type: informe
status: esborrany
description: 'Informe de Claude (pica-codi) del torn 261024_1315: T1-T8 i directives del Mestre implementades sense commit, correccions de les auditories creuades i verificació amb la suite sencera'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ce4819fc-9d76-4e19-9bf7-de52b9d56002:4f94159a-c943-4890-8bad-98a2a175af3f
---
# Auditoria Claude · Fortificació P0, lightbox, lector RSS, connectar i exportació de dades

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ce4819fc-9d76-4e19-9bf7-de52b9d56002:4f94159a-c943-4890-8bad-98a2a175af3f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T11:20:01.912Z |
| Modificació | 2026-10-24T15:30:00.000Z |
| Propietari | claude |
| Aprovació humana | Mestre Javi Llinares: pla aprovat (àudio 13:08) i directives en xat de 261024 (decisions canòniques, fonts §23, 15:05); el resultat d'este informe està pendent de la seua revisió |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`): orquestrador i 36 subagents en 7 workflows (escorcoll, implementació, seguiment i revisió, correccions, Lector, correccions finals) |
| Tokens consumits | ≈ 12,3 M (≈ 11,7 M dels subagents segons els comptadors dels workflows + ≈ 0,6 M estimats del fil principal) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-24T11:20:01.912Z: esborrany creat; contingut i verificació pendents.
2026-10-24T11:50:00.000Z: EN CURS. Claude implementa T1–T7 al codi viu. Reserva d'edició fins al relleu final (Codex i Gemini: llegiu, no editeu): `src/natiu/entradaSocial.js`, `src/config/entradaNativa.js`, `src/sections/onboarding/fluxEntradaNativa.js`, `src/data/supabase/{auth,compte,organizations,moderacio}.js`, `src/data/{contracte,backendPort,localPerfils}.js`, `src/sections/text/legalContent.js`, `src/app/contexts/ModeracioContext.jsx`, `src/components/universal/DialegsModeracio.jsx`, `src/components/PedraSeca/organismes/{textosModeracio.js,VisorImatges.jsx}`, `src/config/idiomes/*.js`, `src/sections/profile/{DetallPrivacitat,GestioMembres}.jsx`, `src/sections/detail/{VisorDePublicacio,detailSectionMeta,ItemDetailSection}.jsx`, `src/sections/connectar/**`, `src/apps/lector/**`, `src/apps/plataforma/**`, `src/css/{components,modules}.css`, `supabase/README.md`, `supabase/migrations/26102414*`, `supabase/functions/**` (nou), `src/data/adaptadors/noticies/**` (nou). Línia base Vitest en còpia congelada de HEAD a4e562bc8: 21.161 proves, 2 fallides heretades (laboratori-telefonades, MercatSection.autoria), 106 omeses.
2026-10-24T11:56:00.000Z: Rebudes les decisions del Mestre de 261024 (via MarIA): «Connectar / Seguir» amb constància a l'altra part, «Formar part de l'entitat» per petició estructurada al xat privat de l'entitat, `.bar-black` a 64 px. Nou implementadors en marxa (T1 Apple, T2 legal+C-02, T3 CSP, T4 visor, T5 lector, T6a /connectar, T6b seguiments, T7 exportació, T8 baixa completa P0-20). Migracions noves reservades: `2610241400_normes_exigides_ugc`, `2610241410_exporta_dades_moderacio`, `2610241420_revocacio_apple`, `2610241430_seguiments`, `2610241440_baixa_completa_ugc_i_fitxers` (totes NO aplicades). P1-10: les dues precondicions heretades ja passen sense relaxar cap asserció (`tests/laboratori-telefonades-261006.test.js` compara el SHA sencer; `MercatSection.autoria.test.jsx` deriva explícitament la fila crua sense `author_avatar` i prova a part la del seed): 38/38. Divergència declarada: no s'activa la llavor del Lector com a reserva (G-03 / Llibre P1-07) perquè ho prohibix la Purga de Mocks del Mestre (261016) i ho fixen les proves de qualitat; el Lector tindrà fonts reals pel servei del poble i una reserva que convida a la comunitat.
2026-10-24T12:00:00.000Z: Directiva del Mestre per a T5: les fonts de sistema inicials del Lector són exactament els referents de la §23 del text legal. Verificades amb curl (UA honest): Emowe `https://emowe.com/rss.xml` (el `/feed/` de la directiva fa 404; és el feed que anuncia la web), AyudaWP `https://ayudawp.com/feed/`, Xavier Mitjana `https://iaenaccion.com/feed/`, Jon Hernández `https://www.jonhernandez.education/feed/`, Migue Baena `https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A` («Migue Baena IA»), Ben Cord `https://www.youtube.com/feeds/videos.xml?channel_id=UCpq8lHHliCS3oBt-gfL0bKQ` («Benjamín Cordero»); tots 200. S'aplica al catàleg en una passada de seguiment de T5, amb fonts personals llegides pel servei del poble amb guardes anti-SSRF.
2026-10-24T12:45:00.000Z: Els nou implementadors han acabat amb les proves dirigides en verd. Ara corren T5b (catàleg dels referents i fonts personals), una passada d'integració i cinc revisors adversarials de només lectura (R1 baixa i Apple, R2 SQL i privadesa, R3 textos legals, R4 UI i accessibilitat, R5 Lector i SSRF). Verificat en viu a `localhost:3340/events/aplec-2023`: les dues fotos del cos porten `data-sdp-ampliable`, `role=button` i nom accessible «Vore a pantalla completa: …»; el clic obri el visor fosc a «2 / 2» amb ✕ (`lucide-x`), Escape el tanca i torna el focus a la foto, i un clic real al fons fosc també el tanca; la portada porta `fetchpriority="high"`. `/connectar` des de `/empresa/socdepoble` mostra els camins «Formar part» i «Al teu MAS» (com a pilot propietària no s'oferix seguir la pròpia entitat) i el nou encapçalament.
2026-10-24T13:20:00.000Z: Llegides les segones passades de Codex (D-01..D-08) i Gemini (G2-01..G2-06) i la directiva del Mestre de les 15:05. La revisió adversarial pròpia (R1-R4) ha aportat 31 troballes amb evidència. Integració feta (reobertura de normes davant SDP-MOD-428 al xat i a les notes, xat públic de la IAIA amb porta, VERSIO_CATALEG, censos, avís d'admins en seguir una entitat, frase del worker al README). En marxa set correctors fora del Lector: carrera d'Apple (D-01/G2-04), buidatge per fila (R1-01), títols al xat després de la purga (D-02/G2-05), cap de purga sense taps (R1-04), normes en editar (D-07.2/G2-06), seguiments amb baixa tova i avís un sol cop (D-07.1/R2-04/R4-01), bloqueig a l'ombra (R2-01), exportació sense oracle de denunciants (R2-02), textos honestos d'Apple i de baixa (R3-01..R3-04), versió legal 2.2 (D-05/G2-05.2), fora el jargó «MAS» de `/connectar` (G2-02), doble clic del visor (R4-02). Els canvis de les 14:53-14:54 a `manifest.js` («Lector de notícies»), `src/apps/plataforma/apps.css` (`#0F672F`) i `ConnectarSection.jsx:608` no els ha fet cap agent de Claude. Es revisen igual a la suite final.
2026-10-24T13:30:00.000Z: Correccions fora del Lector fetes (set correctors, proves dirigides en verd, mutacions comprovades a C1 i C7): D-01/G2-04 (sessió capturada, testimoni explícit i guarda abans de qualsevol efecte a les sis funcions de `compte.js`), R1-01 (buidatge per fila i secret de client per fila), R1-03, D-02/G2-05.1 (títols «Publicació esborrada» als fils de pàgina), R1-04, D-07.2/G2-06.2/R2-03 (normes també en editar contingut), R2-07, D-07.1/G2-06.1/R2-04/R4-01 (baixa tova `deixat_al`, `primer`, cap per hora real), R2-01 (bloqueig a l'ombra), R2-02/R3-07 (només un recompte de denúncies amb mesura), R3-01..R3-14, D-05/G2-05.2 (rètol «Versió 2.2 · En vigor des del 24 d'octubre de 2026»), G2-02.2 (fora «MAS» de `/connectar`), R4-02..R4-06. En marxa: redisseny del Lector (patró Bloc de notes, sense `/app/lector/fonts`, alta de fonts personals, vídeo amb façana de consentiment, intermediari d'imatges) i blindatge del servei (D-06, D-08, G2-03, R5-01..R5-10).
2026-10-24T15:05:00.000Z: Lector redissenyat i servei blindat; revisor R6 (13 troballes) i passada final de correccions (L-01..L-13). Tall congelat de l'arbre a les 17:02 CEST (`git write-tree` 8877ee50): lint 0, `test:node` 0 fallades, Vitest complet amb 3 fallades noves, corregides (vegeu Verificació).
2026-10-24T15:30:00.000Z: Informe complet. Torn en estat `planned` amb el pla vinculat. Res commitejat, desplegat ni aplicat.
2026-10-24T16:05:00.000Z: Per decisió del Mestre en xat («Aprove el text legal 2.2 … i fes el commit amb NO_VERIFY=1»), s'ha registrat l'aprovació de la clau `legal` (`frontissa-contingut.mjs --aprova legal --per «Mestre Javi Llinares»`: sha `ce4298a9…`, 44.011 caràcters; porta 14/14) i s'ha fet el commit **`f54baa09c`** sobre `a4e562bc8` a `backup-notes-publish`, sense push. Índex temporal i llista explícita de 178 camins de codi més `.agents/contingut_estructural.json`; arbre `7c0eaa1a` = arbre assajat `b5629e01` + l'aprovació. Assaig previ de l'arbre exacte en un repositori fora de l'arbre: Vitest 21.756/21.862 (0 fallades), lint 0, taxonomia, plantilla viva i documents en verd. `--no-verify` perquè el hook no pot passar per causes anteriors al lot (sense lease Reflex, `tancament --check` amb 1.284 incidències globals, LEDGER trencat a `run-portes`, Vitest de 564 s contra el tall de 120 s per pas). Fora del commit, per al commit documental: la Wiki (este informe, Llibre Mestre, índex, informes de Codex i Gemini, trasllats d'arxiu) i la resta de `.agents/`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum

Claude ha picat el codi de T1–T8 i de les tres directives del Mestre rebudes durant el torn (decisions canòniques de `/connectar`, fonts §23 del Lector i la de les 15:05). Ha corregit totes les troballes de les segones passades de Codex (D-01..D-08) i Gemini (G2-01..G2-06), i les de la seua pròpia revisió adversarial (R1..R6, 66 troballes amb evidència). **Res no està commitejat, desplegat ni aplicat**: HEAD continua sent `a4e562bc8`. Cinc migracions noves queden «NO aplicades» i tres funcions del servidor, sense desplegar. L'ordre obligat és a P0-21 del Llibre Mestre.

Fitxer o abast: 116 fitxers modificats i 43 rutes noves fora de la Wiki (`git status`, 17:06). Font de veritat: el pla `261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md` i les directives del Mestre en xat.

### Rutes del prompt que no existien

`esborra_propi_compte()` no existix: la baixa és `demana_baixa` → quarantena de 30 dies → `private.purga_una_baixa`. `ImageLightboxModal` és l'organisme existent `VisorImatges`. `src/context/ModeracioContext.jsx` és a `src/app/contexts/`, `DetallPrivacitat.jsx` a `src/sections/profile/` i `detailSectionMeta.jsx` a `src/sections/detail/`. `src/llavors/emojis_catalog.js` és `src/sections/disseny/cataleg/dades/emojisUnicode18.js`. La migració «2610201400» de P0-05 no existix. `requires_human_decision: false`.

### T1 · P0-04 · Revocació de Sign in with Apple

- **Custòdia.** iOS reenvia l'`authorizationCode` d'Apple (`src/natiu/entradaSocial.js` → `entradaNativa.js` → `fluxEntradaNativa.js` → `src/data/supabase/auth.js`). Després de desar la sessió, el client l'envia sense esperar resposta a la funció `compte-apple` (`custodia`). La funció l'intercanvia a Apple, lliga `iss`/`aud`/`sub` a la identitat d'Apple de la sessió (A/B) i desa el *refresh token* xifrat amb AES-256-GCM, amb l'usuari com a dada associada. Ni el codi ni el testimoni passen per GoTrue, els registres o cap resposta.
- **Revocació en dos moments.** El client revoca just abans de `rpc('demana_baixa')` amb la sessió capturada en el moment de la sol·licitud (D-01/G2-04: guarda abans de qualsevol efecte; el JWT capturat va explícit; regressió A→B en verd, que falla contra el mòdul anterior). A més, un buidatge horari `buida` amb `x-sdp-cron` revoca el que quede. La porta de la purga (T8, `SDP-BAIXA-030`) espera fins a 7 dies (`dies_espera_revocacio_apple`); passats, purga i deixa constància pseudònima (`purgat_sense_revocar`).
- **SQL.** `supabase/migrations/2610241420_revocacio_apple.sql` (NO aplicada) crea `private.autoritzacions_apple` i `private.revocacions_apple`, i quatre RPC només per a `service_role` amb guarda interna (`SDP-APPLE-000..002`). R1-01: una fila dolenta ja no atura el lot, i el secret de client se signa amb el `client_id` de cada fila. R1-03: `sense_testimoni` només amb una baixa existent i un per persona cada 24 h.
- **Fitxers de la funció:** `supabase/functions/_shared/apple.js`, `supabase/functions/compte-apple/{gestor.js,index.ts}` i les seues proves. Zero secrets a `src/`, amb una prova guarda que ho escaneja.

### T2 · P0-18 · Text legal P3 i porta de normes (C-02)

- P3 (`b5b539…`) aplicat a `src/sections/text/legalContent.js` amb correccions:
  - abast territorial en la motivació;
  - **mesures proporcionades** (avís, suspensió temporal o expulsió segons la gravetat; retirada sempre), alineades amb la §3, els 5 diccionaris i `textosModeracio.js`; `VERSIO_NORMES_CONVIVENCIA` = 2026-10-24;
  - denúncies descrites com a pseudonimització, no com a anonimització;
  - revocació d'Apple condicional, amb la via manual i els 7 dies d'espera;
  - seguiments, custòdia d'Apple, bloqueig «a l'ombra» i límits automàtics complets.
- Rètol: **«Versió 2.2 · En vigor des del 24 d'octubre de 2026»** (ordre del Mestre, 15:05; D-05/G2-05.2). `date` no canvia, perquè és la data de publicació de la pàgina que fixa `editorial.test.js`.
- Es mantenen: una sola `data-sdp-ancora`, el NIF dues vegades, E6 només amb el correu i cap paràgraf de l'art. 19. No s'executen G-05, G-07 ni G-08.
- **C-02, al client.** `ModeracioContext.jsx` només dona les normes per acceptades si el servidor ho confirma (`{versio, servidor:true}`). Si en remot el servidor diu `NO_DISPONIBLE`, rebutja i el diàleg queda obert. Davant `SDP-MOD-428` es reobri la porta un sol cop i es reintenta al xat (text i adjunts), a les notes i a «Compartir al Mur». El xat públic `/iaia` també passa per la porta.
- **C-02, al servidor.** `supabase/migrations/2610241400_normes_exigides_ugc.sql` (NO aplicada) afig triggers sobre `section_submissions` (inserció i edició de contingut per l'API directa, D-07.2) i sobre `xat_missatges` (`SDP-MOD-428`). Si falta 2610201500, la migració avorta amb `SDP-MOD-901`.
- Correu de contacte en una sola font: `src/config/contacte.js`. Proves noves `legal.dsa.test.js` i `contacte.test.js`.

### T3 · P0-19 · CSP de mitjans

`src/sections/xat/components/AdjuntXat.porta.test.js` ja fixa:

- `firebase.json`: `media-src` i regla `**`;
- `firebase.json` igual que `vercel.json`;
- cap capçalera no estreny la meta;
- la capçalera de desenvolupament només porta `frame-ancestors`.

Prova de mutació: la CSP antiga de producció posa 3 proves en roig. A les 13:56 CEST, `https://socdepoble.org/xat` encara no porta `media-src`: cal el desplegament del Mestre.

### T4 · P1-06 · Visor de les fotos del cos

- **`CosAmbVisor`** (`src/sections/detail/VisorDePublicacio.jsx`) marca les fotos pròpies del cos i obri el `VisorImatges` existent en galeria. Usa el mateix tros mandrós que la portada. Exclou targetes incrustades, enllaços, imatges bloquejades o `sdp-media:`, imatges amagades i icones.
- **✕ global** (lucide `X`). El clic net al fons fosc tanca després de la finestra de doble clic (R4-02), així que el doble clic continua ampliant.
- **Portada amb `fetchpriority="high"`** (G2-02). No portava `loading="lazy"`: G-02.3 era inexacte.
- **Verificat en viu** a `/events/aplec-2023`: galeria «2 / 2», ✕, Escape amb retorn del focus i clic al fons.
- La meitat d'emojis de P1-06 queda com a informe: `GraellaEmojis` mostra i després refusa; no hi ha detecció de glifs per canvas.

### T5 · P1-07 · Lector (directives §23 i 15:05)

- **Fonts de sistema = els 6 referents de la §23**, verificats amb GET:
  - Emowe `https://emowe.com/rss.xml`: el `/feed/` de la directiva fa 404;
  - AyudaWP `https://ayudawp.com/feed/`;
  - IA en Acción `https://iaenaccion.com/feed/`;
  - Jon Hernández `https://www.jonhernandez.education/feed/atom/`: el seu `/feed/` respon 304 sense cos a tot GET per una errada de memòria cau de l'origen (HEAD diu 200);
  - els canals de YouTube de Migue Baena i Ben Cord.

  Carpetes «Coneixement obert» i «Vídeos per a aprendre». Les 10 fonts territorials verificades queden documentades com a candidates no actives.
- **Interfície.** `UniversalWorkspace` pur de 3 columnes amb la fila del Bloc de notes (`vistes/FilaNoticia.jsx`: miniatura, títol, «font · data», entradeta). Fonts a l'arbre: clic a una carpeta per al flux combinat, clic a una font per a filtrar. El diàleg «Gestiona les fonts» porta interruptors i l'alta de fonts personals (D-06). `/app/lector/fonts` redirigix a `/app/lector/noticies` (G2-01). No hi queda cap `.sp-card`.
- **Vídeo.** Façana que no demana res a YouTube abans del clic. Després, `youtube-nocookie.com` en un `iframe` amb `sandbox`. Accepta també els *Shorts*: 12 dels 15 vídeos de Migue Baena.
- **Servei (Model B).** L'app continua sense xarxa ni URL. El servei l'injecta la plataforma (`useServeiNoticies`, nucli 1.3.0), i el client i el contracte són a `src/data/adaptadors/noticies/`. La funció de referència és `supabase/functions/noticies/`:
  - llista blanca d'id i URL;
  - límits de 6 s i 2 MiB;
  - UTF-8 amb BOM prioritari;
  - un intermediari d'imatges que només servix imatges dels hosts del catàleg i dels seus CDN aprovats;
  - límits per connexió amb HMAC i IPv6 per /64 o /48.
- **Fonts personals** llegides pel servidor només amb `SDP_NOTICIES_PERSONALS=1`. Sense resolutor DNS fallen tancades (D-08). Els hosts d'imatge externs depenen d'un altre interruptor (R6 L-12). Mentrestant, les fonts personals queden desades al dispositiu.
- **Sense la funció desplegada** (G2-03): una sola petició fallida per sessió, i l'estat de reserva convida a passar pel Mur, l'Agenda, el Mercat i els Pobles.
- `src/apps/plataforma/apps.css`: el `#0F672F` cru d'una altra mà passa a ser un token aplicat només al Lector (R5-09).

### T6 · IDEA-14 · `/connectar`

Tres camins, cadascun amb el seu botó:

- **«Entre persones».** «Seguir» i «Escriure-li», amb noms de font de confiança: un element resolt o `loadPerfilPublic`, mai l'URL. En una primera relació, un missatge al xat directe fa d'avís (`primer`). Per a una entitat, s'avisa abans del clic que qui l'administra veurà el nom.
- **«Formar part».** Diàleg de confirmació amb el text exacte de la sol·licitud i un afegit opcional. S'envia al xat privat de l'entitat (diàleg humà abans d'acceptar). Abans d'obrir el fil, porta de normes (R4-04).
- **«A les teues notes».** Fora el jargó «MAS» (G2-02).

Backend nou `seguiments`: contracte, port, adaptador Supabase, servidor local en memòria i kit de conformitat. La migració `supabase/migrations/2610241430_seguiments.sql` (NO aplicada) fa:

- baixa tova (`deixat_al`) i cap horari real (D-07.1/R2-04);
- bloqueig «a l'ombra» (R2-01);
- poble compartit per a persones.

La constància per a qui és seguit és «Gent que et seguix» a la fitxa pròpia i «Qui seguix {nom}» a `GestioMembres`. El text de la reclamació d'administració ja no usa el verb «connectar». `.bar-black` es queda a 64 px.

### T7 · P2-08 · «Descarregar les meues dades»

`supabase/migrations/2610241410_exporta_dades_moderacio.sql` (NO aplicada) és una còpia literal de F1 amb afegits.

Afegeix:

- denúncies fetes, amb l'empremta IP només com a sí/no;
- bloquejos fets i normes acceptades;
- missatges amb `metadades`: un àudio sense peu conserva la referència (C-04);
- adjunts amb bucket i objecte;
- configuració de converses, seguiments vius i la data de custòdia d'Apple;
- una llista `no_inclou` que explica què s'omet i per què.

De les denúncies rebudes, només exporta el **recompte de les que han acabat en mesura** (R2-02: res de recomptes vius per tipus que delaten qui denuncia). La pantalla `DetallPrivacitat.jsx` diu exactament què hi ha a l'arxiu, i el text de baixa és honest: no hi diu «s'anonimitza», hi ha la via manual d'Apple i els 7 dies.

### T8 · P0-20 · Baixa completa (C-06)

`supabase/migrations/2610241440_baixa_completa_ugc_i_fitxers.sql` (NO aplicada) redefinix `purga_una_baixa` com a còpia literal amb pocs canvis, provats per una prova estàtica:

- porta d'Apple;
- **s'esborren** les publicacions personals, no es dissocien;
- el contingut d'entitat queda a l'entitat;
- els títols dels fils de pàgina passen a «Publicació esborrada» (D-02/G2-05.1);
- `purga_baixes_vencudes` sense taps (R1-04);
- RPC de cua per al worker.

El worker és `supabase/functions/purga-fitxers/`: secret en temps constant, lots, `DELETE` a Storage, reintents amb espera exponencial i res de noms d'objecte als registres.

### P1-10 · Les dues precondicions heretades

- `tests/laboratori-telefonades-261006.test.js` compara el SHA sencer.
- `MercatSection.autoria.test.jsx` deriva explícitament la fila crua sense `author_avatar` (el cas protegit) i prova a part la del seed, amb el bessó WebP.

Cap asserció relaxada.

### Divergències declarades

1. **No s'activa la llavor del Lector com a reserva** (G-03 / Llibre P1-07): la Purga de Mocks del Mestre (261016) ho prohibix i les proves de qualitat ho fixen literalment.
2. **G2-05.1:** la recepta de Gemini usava columnes que no existixen (`context_id`, `submission_id`). S'ha fet amb les reals (`subjecte_tipus/subjecte_id`).
3. **G-01.5 (`closedby="any"`):** no s'ha posat, perquè `Dialeg.jsx` no el passa i en un diàleg de pantalla completa no hi ha fons on clicar. S'ha fet el tancament pel fons dins del visor.
4. **Canvis d'una altra mà durant el torn:** `manifest.js` («Lector de notícies»), `apps.css` (`#0F672F`) i `ConnectarSection.jsx:608`, entre les 14:53 i les 14:55. No els ha fet cap agent de Claude. S'han integrat; el color ara és un token.
5. **Torn obert per error:** `node tooling/gates/obrir_torn.mjs --help` no mostra l'ajuda, obri un torn. Així va nàixer `torn_5a795c4e` (actor `agent-local`), que Codex i MarIA van atribuir a Gemini. És de Claude i no té cap rebut.

### Decisions pendents del Mestre (`requires_human_decision: true`)

1. **Commit** d'este lot (rama `backup-notes-publish`; índex temporal i llista explícita; `--no-verify` només per decisió teua) i **ordre de desplegament** de P0-21.
2. **Apple:** clau `.p8`, secrets, desplegament de `compte-apple`, proveïdor Apple a Supabase, crons i retenció de `private.revocacions_apple`.
3. **Legal:**
   - fila 2.2 a `politiques_privacitat` i avís dins l'app abans de l'efecte: la §18 ho promet i ara no es complix;
   - segon canal de l'art. 12.1 de la DSA;
   - operació real de la revisió en 24 h;
   - entrega pel relay d'Apple;
   - mesures proporcionades: confirmar-les o tornar a l'expulsió uniforme.
4. **Lector:**
   - aprovar els 5 hosts de feed i els CDN de miniatures (`i.ytimg.com`…);
   - el canvi de Jon Hernández a `/feed/atom/`;
   - desplegar `noticies`;
   - aïllament de xarxa de sortida abans d'encendre fonts personals i imatges externes;
   - activar el Lector en producció (manifest `desenvolupament`);
   - política de contingut complet o resum.
5. **Seguiments:** quotes (60/h, 1.000) i semàntica del bloqueig a l'ombra.
6. **Exportació:** fins on s'exporten les denúncies rebudes; el significat de `revisada` i `retirada`.
7. **Baixa:** custòdia legal dels fils de pàgina d'una publicació esborrada; el contingut d'un grup que desapareix amb la persona.
8. **UI:**
   - els botons de reclamació d'administració passen de primari a secundari, per a mantindre un sol primari a la vista;
   - «Vore» o «Veure» a la clau del visor;
   - «MAS» a les Notes (P2-11).

### Retroalimentació de la plantilla del prompt

- Comprovar les rutes i els noms de funcions abans de convocar: n'hi havia set d'erronis.
- Assignar explícitament T5–T7 al pica-codi.
- Fixar el hash i la llista de les «215 proves».
- Diferenciar les directives noves del Mestre amb hora i un fitxer propi a l'Escriptori: la «directiva de les 14:40» no va arribar al pica-codi.
- Exigir verificació de feeds amb GET i no amb HEAD.
- Declarar a la convocatòria qui pot editar codi, perquè no hi haja canvis anònims en fitxers reservats.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Les proves completes s'han fet en còpies congelades fora del repositori, amb un `git init` i `alternates` cap al repositori perquè passen les proves que llegixen l'historial. El mètode: `git write-tree` amb un índex temporal (sense tocar l'índex real) → `git archive` → `public` enllaçat → `node_modules` amb enllaços per paquet.

| Comprovació | Abast | Resultat |
| --- | --- | --- |
| Vitest complet, línia base | HEAD `a4e562bc8`, 13:20 | 21.161 proves: 21.053 passen, **2 fallen** (heretades), 106 omeses; 903 s |
| Vitest complet, 1r tall | arbre `8877ee50`, 17:02 | 21.862 proves: 21.753 passen, **3 fallen** (`qualitat.nucliApps`, `presentacioPlugins`, una prova de temps de `imatgesDelFeed`), 106 omeses |
| Correcció de les 3 | 4 fitxers | Lector sense `UniversalCard` fixat a posta, presentació RSS amb «Gestiona les fonts», marge de 10 s (lineal contra quadràtic): 7 fitxers, **291/291** |
| **Vitest complet, arbre final** | arbre `f2ff4c75` (= viu, llevat d'una línia en blanc al final de `privacitat.test.jsx`), 17:13 | **21.862 proves: 21.756 passen, 0 fallen, 106 omeses**; 1.265 fitxers en verd i 9 omesos; eixida 0; 538 s |
| `npm run lint` (`eslint src tooling scripts tests --max-warnings=0`) | 1r tall | eixida 0, cap error ni avís |
| `npm run test:node` | 1r tall | 1.031 proves: 1.022 passen, 0 fallen, 5 omeses, 4 TODO. A la base: 1.023 passen i 3 TODO. El TODO nou és el diagnòstic de `lint-sessio` «147 fitxers de l'abast tocats i fora de la llista del torn», que reflectix la mida del lot; no és una fallada |
| `node tooling/gates/tractor-rls.mjs` | arbre viu | «Zero fantasmes i zero forats (sobre 57 fitxers sql)» |
| `node tooling/gates/porta-olivera.mjs --informe` | Escriptori | eixida 0; només els avisos CONV-07 heretats de sediment de l'índex |
| `git diff --check` | arbre viu | eixida 0 |
| `node tooling/wiki/document.mjs check` | este informe | `valid: true`, 0 errors |
| `node tooling/gates/tancament.mjs --check --turn-id torn_ce4819fc…` | torn | eixida 1, `planned`, 1.284 incidències globals heretades (LEDGER, Wiki, SCC; Codex en comptava 1.283); cap afecta este informe; no es declara tancat |
| Proves de mutació | C1 (Apple), C7 (visor), T3 (CSP) | Les proves noves fallen contra el codi anterior: 10/10 de la carrera D-01, 6/6 del buidatge per fila, 3 de CSP contra la capçalera de producció, 4+1+2+2+1 del visor |
| En viu, `localhost:3340` | Chromium del panell | Visor del cos (galeria, ✕, Escape, clic al fons, retorn del focus), `/connectar` (0 «MAS», tres camins), Lector (redirecció de `/fonts`, arbre amb 6 fonts, diàleg «Gestiona les fonts», reserva sense funció desplegada, barra `rgb(15,103,47)`), `/legal` (rètol 2.2, una àncora, sense «anonimitz») |
| Feeds del catàleg | GET amb l'UA honest, 16:25 | Emowe, AyudaWP, IA en Acción i els dos de YouTube responen 200; Jon Hernández `/feed/` respon 304 amb 0 bytes, i `/feed/atom/` respon 200 |
| Producció | `curl -sI https://socdepoble.org/xat`, 13:56 | Sense `media-src`: P0-19 continua pendent de desplegament |

Logs a l'escriptori temporal de la sessió: `baseline-vitest.json`, `final-vitest.json`, `final2-vitest.json`, `final-lint.log`, `final-node.log`, `base-node.log`, `olivera.log`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense servidors reals.** No hi ha PostgreSQL local ni Docker: les cinc migracions només s'han verificat amb proves estàtiques i `tractor-rls`, mai executades. Les tres funcions s'han provat a Node amb `fetch` simulat, sense runtime Deno ni Supabase desplegat. No s'ha parlat amb Apple, Storage ni cap servei remot. Les úniques crides de xarxa han sigut lectures GET o HEAD dels feeds del catàleg i de la capçalera pública amb `curl`.
- **Commit fet, sense push:** `f54baa09c`, per decisió del Mestre (vegeu Historial). **No s'ha fet:** push, desplegament, aplicació de migracions ni canvis a `.env*`, `tooling/`, `scripts/`, `.agents/`, `package.json`, `ios/`, `android/` ni `wordpress-plugin/`. `.agents/ESTAT.md` i el LEDGER no els ha escrit Claude: requerixen l'executor amb lease. El relleu va en este informe i al Llibre Mestre.
- **En viu només a localhost:3340** (Chromium del panell, mode seed): visor del cos, `/connectar` des de `/empresa/socdepoble`, Lector (redirecció, arbre, «Gestiona les fonts», estat de reserva) i text legal. No s'ha provat:
  - el camí persona-persona en viu (el padró llavor només té la pilot);
  - Safari o iOS;
  - el reproductor de vídeo amb feeds reals (la funció `noticies` no està desplegada);
  - l'amplada estreta i l'encastament WordPress.
- **Cal reconstruir els paquets natius.** `src/natiu/entradaSocial.js` ha canviat, així que `dist-natiu` i l'arxiu iOS s'han de tornar a construir perquè l'app envie el codi d'Apple.
- **Arbre compartit.** Durant el torn una altra mà va editar fitxers reservats (Divergència 4). Les proves completes s'han fet sobre un tall congelat; abans d'un commit cal tornar a comparar l'arbre amb el tall (`git write-tree`).
- **Crons i processos («Cadascuna a sa casa»).** Claude no ha creat cap cron ni tasca programada. Els 7 workflows han acabat i les ordres en segon pla també. El servidor de :3340 no l'ha arrencat Claude i continua sent dels altres. Les còpies congelades viuen al directori temporal de la sessió, fora del repositori.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio]]
- [[261024_1315_prompt_claude_gemini_codex_fortificacio_i_auditoria_adversarial_trio]]
- [[261024_1315_auditoria_codex]]
- [[261024_1315_auditoria_gemini]]
