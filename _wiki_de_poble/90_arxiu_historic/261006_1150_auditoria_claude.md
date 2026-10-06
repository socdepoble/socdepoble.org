---
type: informe
status: esborrany
description: Extrapolació dels 77 passos de neteja de WordPress d'AyudaWP i dels mecanismes de Vigilante a Supabase, React i les portes, amb refutació adversarial
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ea2e07b8-7e27-4ad5-8bd1-13748bcb2768:3343396d-af31-49f0-afc3-7b5c591e568a
---
# Auditoria Claude: la checklist de Tellado i Vigilante traduïts a Sóc de Poble

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ea2e07b8-7e27-4ad5-8bd1-13748bcb2768:3343396d-af31-49f0-afc3-7b5c591e568a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T11:39:12.888Z |
| Modificació | 2026-10-06T12:30:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), coordinador i subagents |
| Tokens consumits | ≈ 48,2 M als subagents (26,1 + 2,0 + 17,6 + 2,5), sense comptar el coordinador |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-06T11:39:12.888Z: esborrany creat; contingut i verificació pendents.

- 2026-10-06T09:50Z: torn `torn_ea2e07b8-7e27-4ad5-8bd1-13748bcb2768` obert (actor claude, abast documents) i plantilla `auditoria` entregada per `document.mjs context`.
- 2026-10-06T09:55Z: lectura sencera del CSV de `01_produccio/` i de l'article d'AyudaWP. L'article s'ha llegit amb el navegador integrat perquè el hook del repo bloqueja WebFetch.
- 2026-10-06T10:05Z: primer workflow (204 agents): 7 cartògrafs, 9 lents, 181 refutacions, un crític i 6 forats.
- 2026-10-06T10:40Z: el Mestre hi afig el codi font de Vigilante (`02_investigacio_ia/vigilante/`). Segon workflow en paral·lel: lectura del PHP per mòduls, traducció, refutació i verificació de plataforma.
- 2026-10-06T11:30Z: digestió de les 180 troballes amb els seus veredictes (13 agents). Correcció del coordinador: `perfil_psiquiatric.md` és el perfil de la IA, no una dada de salut.
- 2026-10-06T11:39Z: document creat pel circuit (`document.mjs create`) i redacció de la Part A.
- 2026-10-06T12:15Z: digestió de Vigilante (15 agents) i redacció de les seccions C, D, Verificació i Límits.
- Les hores, excepte les de creació, són aproximades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum per al Mestre

Hem llegit sencers la checklist de Fernando Tellado (77 comprovacions en 8 fases, més les fulles «Antes de empezar», «Diagnóstico», «Comprobaciones online», «Reputación y retiradas», «Patrones de código» i «No volver a pasar») i l'article que l'acompanya. Després els hem passat pel sistema real de Sóc de Poble: el repositori, la web pública (només GET) i el codi font de Vigilante. De les 180 troballes que han passat per un escèptic, 166 s'han corregit, 14 s'han confirmat i 1 ha caigut. La que va caure era la més alarmant, una suposada bretxa de dades de salut: `_wiki_de_poble/02_saber/perfil_psiquiatric.md` descriu la «salut cognitiva» de la IAIA MarIA i no parla de cap persona.

La conclusió en una frase: **Sóc de Poble té la millor maquinària de seguiment que hem vist per a la feina de les IAs, i cap per a un incident de seguretat.** Els torns, l'ESTAT, el LEDGER i les portes fan exactament el que Tellado demana a la seua fulla (estat per pas, data, nota, ordre), però només s'apliquen a documents i agents. Un incident real com el bolcat del `.env` del 2026-10-06 és una línia solta del LEDGER, sense responsable, sense revisita i sense tancament.

Decisions que són del Mestre i no poden esperar. Cap no requerix codi:

1. Rotar la clau de DeepL bolcada als transcripts d'Antigravity i tancar `.agents/LEDGER.md:837` amb data.
2. Dir on viu producció. El sistema viu diu Firebase Hosting, amb un build del 2026-06-11 que el repo no pot regenerar; el repo diu `vercel.json`. Mentre no se sàpia, cap control del repo (CSP, robots, retirades) arriba a la web pública.
3. Passar, només en lectura, un inventari del catàleg del Supabase de producció: taules amb RLS, polítiques, funcions, edge functions, `cron.job`, buckets i publicació de Realtime. És el projecte heretat, i conté objectes que cap migració no crea.
4. Provar si el bucket `mitjans` es pot llistar anònimament i mirar quina versió de les polítiques de `mitjans_privats` és la viva.
5. Activar el 2FA a tots els comptes de proveïdor i revisar quines sessions de CLI de producció (firebase-tools, gcloud, supabase) viuen al Mac on treballen els agents.
6. Decidir si el connector de WordPress ha de continuar publicant documents interns de la Wiki (`rag-index.json`, `slugIndex.json`, `wikiManifest`).

### A. La filosofia de seguretat darrere dels 77 passos

Tellado no ensenya a netejar. Diu que això ja està escrit en mil llocs; el que ensenya és a no equivocar-se d'ordre. Hem destil·lat dotze principis, que valen igual per a un WordPress que per a una SPA amb Supabase:

1. **Els errors greus són d'ordre, no de coneixement.** Els quatre errors de l'article (demanar la revisió amb la web bruta, demanar eixir de llistes negres amb l'spam encara eixint, tancar el mateix dia, deixar-se el 503) els comet qui ja sap què fer. L'ordre l'ha de forçar el procediment, no la memòria.
2. **Netejar no és arreglar.** Sense el vector d'entrada, la neteja dura dies. Si no es troba, es treballa com si la porta continuara oberta (fila 17).
3. **Primer la xarxa, després el risc.** Cap pas de la fase 3 sense la còpia completa de la fase 1. La còpia de l'estat infectat no s'esborra mai: és l'única prova.
4. **El risc va escrit a cada pas:** segur, amb compte, pot trencar la web. Mirar no és esborrar.
5. **Es reinstal·la des de l'origen, no des del disc.** El que hi ha instal·lat no és de fiar; la font canònica sí. Tot el que sobra respecte de l'original és sospitós.
6. **La persistència s'amaga en el que es carrega sol i no ix a cap llista:** mu-plugins, drop-ins, cron, transients i `.htaccess` en carpetes on ningú no mira.
7. **Una coincidència és un candidat, no un culpable.** Els patrons són indicis: s'obri el fitxer i es compara amb l'original abans de sentenciar.
8. **La mateixa vara abans i després.** Sense foto inicial no es demostra res. El que continua en roig s'arregla o s'explica.
9. **El temps és part de la prova.** Cal esperar 72 hores i tornar a mirar: una web neta dimarts i reinfectada dijous no estava neta.
10. **Estar net i semblar-ho són dues feines.** Els custodis són aliens (Google, antivirus, llistes de correu, proveïdors), tenen terminis propis i es gasten els intents.
11. **El rellotge legal corre des que te n'assabentes.** Hi ha 72 hores per a valorar una bretxa. Es notifique o no, la valoració s'escriu.
12. **Cal saber quan s'ha de parar la llista.** Hi ha tres disparadors per a demanar ajuda: dades de pagament, compte suspés i segona reinfecció.

Hi ha dos principis d'enginyeria de l'eina que l'article explica de passada i que, per a nosaltres, són els més valuosos:

- **La fulla és un seguiment d'estat entre dies, no una guia.** Cada comprovació té estat (pendent, en marxa, fet, no aplica), data i nota, i la portada compta l'avanç per fases.
- **Tot ix d'un catàleg únic.** La fulla, els enllaços dels escàners i els comptadors es generen d'un sol catàleg de comprovacions: afegir-ne una costa cinc minuts i cap còpia no divergix. La columna «Aplica si» filtra el que no és el teu cas.

#### A.1 El mirall: on ja ho practiquem i on no

| Principi de Tellado | Què en tenim | Què hi falta |
| --- | --- | --- |
| Seguiment d'estat entre dies | Torns amb màquina d'estats, ESTAT, LEDGER, actes i ON_ESTIC (`tooling/documental/turns.mjs`) | `.agents/protocolledge.json` no té cap ruta d'incident; `LEDGER.md:837` és una línia sense estat, responsable ni tancament (AX-F01) |
| Ordre forçat pel procediment | `checkTaula` mecanitza recaigudes documentals; la cadena de portes té ordre | Res no impedix netejar abans de copiar o reclamar abans de les 72 hores (AX-F02) |
| Risc per pas | Classificació lectura/mutació dels hooks | No hi ha cap nivell «pot trencar»; el procediment del SQL Editor no exigix còpia prèvia (AX-F03) |
| Aplica si | Encaminament documental i classificació de proves | No hi ha catàleg de seguretat amb aplicabilitat (AX-F04) |
| Catàleg únic | `tooling/gates/run-portes.mjs` exporta `passos` | Els `porta:*` de `package.json` ja han divergit (llaurador, teixit) i `tancament.mjs` té una llista pròpia (AX-F08) |
| Mateixa vara | Línies base internes (`porta:baseline`, `wiki-baseline.lock.json`) | No hi ha cap foto de la superfície pública ni cap eina que mire l'exterior (AX-F09, F6-01) |
| 72 hores i tornar a mirar | La «recaiguda» de `CLAUDE.md`, per a conducta | `sealTurn` verifica i tanca en la mateixa crida; cap incident no té revisita programada (AX-F06, F6-05) |
| Netejar no és arreglar | — | Els episodis de secrets exposats es tanquen pel símptoma i mai com a classe; `docker.env` continua a l'índex de git (AX-F05) |
| Disparadors d'ajuda | — | No hi ha cap llindar escrit (AX-F07) |

**Proposta central.** Reaprofitar la nostra maquinària en lloc d'inventar-ne una altra. Es tracta d'un catàleg únic de seguretat (`tooling/seguretat/cataleg.json`, amb id, fila de Tellado d'origen, risc, aplica_si, ordre, mètode i prerequisit) del qual es generen dues coses:

- **Una ruta documental nova, `incident.seguretat`, a `protocolledge.json`.** Té una fila per comprovació i dependències d'ordre que valida `document.mjs check`: no es pot marcar una neteja sense una còpia datada, ni una reclamació sense la revisita de 72 hores. També porta la fase 0 obligatòria (dades personals i valoració RGPD), fins i tot quan conclou que no n'hi ha.
- **Les sondes de la foto externa** (vegeu la secció D).

És un tractor nou: cal que el Mestre l'aprove des de la Wiki abans que siga efectiu (lliçó 261002).

### B. El que el sistema viu diu de Sóc de Poble

L'ordre és per gravetat després de la refutació. Les referències són les que els escèptics han trobat certes. Les marcades «extern» provenen de la sonda des de fora del 2026-10-06 (navegador integrat, només GET). El repo no les pot confirmar, perquè producció no ix del repo.

#### B.1 Gravetat alta

1. **Producció no ix del repo.**
   - Extern: socdepoble.org el servix Firebase Hosting (TXT `hosting-site=soc-de-poble`, registre A 199.36.158.100, capçalera `vary: x-fh-requested-host`), amb un build del 2026-06-11 (`/version.json` i `last-modified`) que l'arbre actual no pot regenerar.
   - Al repo no hi ha cap `firebase.json`. La CSP de `vercel.json:8` i la meta d'`index.html:17` no arriben a producció. L'única capçalera de seguretat que se servix és HSTS, sense `includeSubDomains`.
   - El repo es contradiu: `.agents/LEDGER.md:15` diu Firebase, `.agents/ESTAT.md:903` ho manté com a P0 obert, i hi ha un `vercel.json`.
   - En termes de Tellado, no hi ha cap «original net» amb què comparar (files 22 i 24) ni cap lloc on aplicar l'enduriment. Decisió del Mestre.
2. **El Supabase de producció és el projecte heretat, i ningú no n'ha fet inventari.**
   - La referència del projecte que porta el bundle antic coincidix amb la de `wordpress-plugin/dist/sdp-release.json:29`.
   - `supabase/migrations/2610042350_convergencia_perfil_i_create_organization.sql:18-25` admet que la base va nàixer d'un esquema anterior, i que a producció hi ha una sobrecàrrega de `create_organization` sense font. `2609261500_identitat_perfil_f1.sql:995-1001` reconeix taules vives fora del repo (realms, user_realms, connections, posts).
   - `2609080000_initial_schema.sql:62` fa `create table if not exists public.profiles`. Si la taula antiga ja hi era, s'hi poden sumar polítiques antigues amb un altre nom (supabase-heretat/FX-05).
   - Les taules que llegia el codi de juliol poden viure sense RLS (FX-02). Cal confirmar-ho amb una prova de lectura anònima.
   - `tooling/gates/tractor-rls.mjs` només llig els `.sql` locals: ix verd sense mirar cap base.
3. **No hi ha cap còpia de la base ni de Storage, ni cap restauració provada.** F5-15, confirmada: no hi ha cap procediment de bolcat, xifrat, còpia fora del lloc ni simulacre, i `src/sections/text/legalContent.js:100` promet rotar les còpies cada 30 dies. Les úniques còpies cablejades (la Time Machine de git i `.snapshots/`) són del repo, i estan al mateix disc.
4. **Storage: el bucket públic es pot llistar, i els adjunts privats poden ser veïnals.**
   - `2609130500_bucket_mitjans.sql:17-18` concedix SELECT a anon sobre tot el bucket `mitjans` (ho he comprovat). Amb la clau publicable es poden enumerar pobles, uid i carpetes.
   - `2609140100` ho va voler llevar, però esborra una política que no existix (storage-FX-02, confirmada).
   - Sense el blindatge `2609200300`, la capçalera del qual diu «PROPOSTA … en staging», qualsevol membre del poble pot llegir i firmar els adjunts privats del poble (storage-FX-03, confirmada).
   - L'alta als pobles oberts és d'autoservei per disseny (D11b: `completa_la_meua_alta`, `2609261500:855-893`, també comprovat) i `is_open` val cert per defecte. A la pràctica, «membre del poble» vol dir «qualsevol compte».
5. **Qui té la clau de tot no té segon factor.** `private.es_superadmin()` (`2609080000:279-288`, comprovat) només mira el rol, sense `aal2`. D'eixa funció depenen `admin_list_users`, que llig els correus de tot `auth.users`, i `resol_reclamacio` (F5-08, AX-M01).
6. **Un secret bolcat continua obert, i la porta per on va eixir també.**
   - LEDGER:837: un `cat .env .env.local` d'un agent va abocar `DEEPL_API_KEY` (pla gratuït, sufix `:fx`) als transcripts d'Antigravity. No hi ha cap rotació registrada.
   - Cap hook (ni el d'Antigravity, ni el de Claude, ni el de Codex) no denega la lectura de `.env*`, `.sdp-reflex/`, `.iaia_auth/` o `supabase/.temp/` (F2-03, confirmada).
   - `supabase/.temp/docker.env` és a l'índex de git, amb `SERVICE_ROLE_KEY` i `JWT_SECRET` de l'stack local (AX-D11, AX-M03). Són valors per defecte de la CLI, però és la mateixa classe de defecte.
7. **Els agents són administradors, i un d'ells permet per defecte.**
   - El hook d'Antigravity acaba `preShell` amb `return ALLOW` (`tooling/gates/antigravity-hook.mjs:330`, comprovat). Ordres com `firebase`, `gcloud`, `supabase` o `git push` passen sense cap pregunta, i la traça no guarda l'ordre (plans-control/FX-02).
   - El hook de Claude és el millor control, perquè denega per defecte. Tot i això, el cartògraf hi documenta tres escapatòries que porten a execució arbitrària (F5-10):
     - escriure a `tests/` o a `vite*.config.js` i llançar `npx vitest run` o `preview_start`;
     - escriure a `.git/config` (`core.fsmonitor`) i llançar `git status`;
     - usar `Read`, que no té límit de ruta, amb el navegador com a canal d'eixida.
   - La lease del Reflex és un HMAC amb una clau que pot llegir qualsevol procés del mateix usuari.
8. **No hi ha protocol d'incidents, però el text legal en promet.**
   - No hi ha plantilla de valoració de bretxa (F0-02, confirmada), canal d'avís a les persones (F0-03), registre amb revisita (F6-05) ni tancament verificable (F7-11, confirmada).
   - `legalContent.js:154-156` promet notificar l'AEPD en 72 hores i avisar els afectats.
   - `legalContent.js:101` promet conservar els registres 12 mesos, i cap configuració no ho sosté (F2-08).
9. **El que s'anomena vigilància no vigila fitxers.**
   - `.immunitari/` amb Plaquetes és un diagnosticador del graf de la Wiki. El llança launchd cada hora i ningú no l'aprova: hi ha 439 receptes acumulades i l'última aprovació és del 2026-08-03.
   - La Salut del connector diu «consistent» amb un `file_exists`, sense calcular cap hash (`wordpress-plugin/includes/salut.php:93-97`).
   - L'SRI està apagat per defecte (AX-M10, F5-14).
10. **Els plans de control de producció viuen al mateix Mac que els agents.** De moment és de gravetat mitjana, fins que es confirme.
    - El crític va veure, sense llegir-ne el contingut, que `~/.config/configstore/firebase-tools.json` té el mtime del mateix minut que el darrer desplegament, i que hi ha credencials de `gcloud`.
    - Sumat al punt 7, qualsevol agent amb shell podria publicar JS a l'origen socdepoble.org, fins i tot un `sw.js` que persistix als navegadors dels visitants.
    - Ho ha de comprovar el Mestre: `firebase login:list`, `gcloud auth list` i `supabase projects list`.

#### B.2 Gravetat mitjana

- **La purga RGPD és incompleta.**
  - La cua `private.purga_storage_pendent` no té consumidor: no existix `supabase/functions`.
  - La purga de baixes depén de `pg_cron`, que només es programa si ja era actiu quan es va aplicar la migració.
  - La UI ja oferix la baixa amb data (storage-FX-05, supabase-heretat/FX-04).
- **El bot de WhatsApp és una via d'entrada.**
  - `bot/cervell.mjs:169-185` interpola el RAG i la memòria dins de `systemInstruction`.
  - `bot/cervell_bridge.mjs:36-38` li diu que faça el que li demane la imatge.
  - La mèdia va a Gemini sense cap base declarada, i `hashJid` no porta sal.
  - La memòria episòdica es reinjecta durant 90 dies, i la sessió està al disc, a `.iaia_auth/`, en mode 0644.
  - Avui no arrenca des del repo (FX-01 a FX-08 del bot).
- **La Wiki es publica sense llista de sensibles.**
  - `tooling/wiki/lib/publication-policy.mjs:10` declara `02_saber` públic.
  - `tooling/brain/crear_bundle.mjs:223` sí que exclou `perfil_psiquiatric`, `soci_sollutia` i `doc_logos_oficials`, però el connector publica tots tres (fuita-FX-02).
  - No és una bretxa de dades personals: són dues fronteres que no compartixen la mateixa llista.
- **El correu del domini es pot suplantar** (extern). DMARC està en `p=none`, l'SPF acaba en `~all` i inclou la IP de SiteGround, i no hi ha registre CAA. Els correus d'alta i de recuperació de Supabase es poden falsificar sense que els rebutgen (AX-D13).
- **Sessions.**
  - Rotar la clau publicable no revoca les sessions: ho fa la clau de signatura.
  - El JWT d'accés viu fins a `exp`, tant per a REST com per a Realtime.
  - `tancaRealtime()` s'executa després de `resetClient()` i no actua mai (FX-01 i FX-05 de Realtime).
- **La cadena de portes està muda.**
  - El segell de skills és divergent: el hash actual és `cfeca2b2` i el segellat, `fb119df6`. La causa és una edició de `core-edicio-segura/SKILL.md` feta des d'Antigravity, fora de l'executor.
  - Per això la cadena s'atura al pas 3, i `segell-auto` alarma a cada eina, cosa que provoca fatiga d'alarmes.
  - `tractor-innerhtml` i la Porta Frontera Auth ixen verd sense comprovar res (AX-P07, AX-P08).
- **El servidor de desenvolupament** escolta a la xarxa local (`host: 0.0.0.0`) amb una llista negra que deixa fora `supabase/.temp`, `var/`, `bot/var/` i `scratch/` (AX-D11).

#### B.3 El que està bé

Cal dir-ho amb la mateixa precisió:

- Les funcions SECURITY DEFINER vigents fixen `search_path = ''`. L'única excepció, `pot_signar_com_organitzacio`, qualifica tots els noms.
- El xat només escriu per RPC.
- `validatePublicCredentials` rebutja qualsevol JWT que no siga anon i també les claus `sb_secret_`.
- El bundle publicat no conté cap secret de servidor ni sourcemaps (extern: s'han analitzat 125 JS, 10,1 MB).
- Tots els sinks d'HTML de `src/` passen per DOMPurify, i els receptors de `postMessage` validen l'origen i la font.
- El PHP del connector és net segons la fulla «Patrones de código»: la guarda ABSPATH està imposada per una prova, no hi ha eval ni base64_decode, i hi ha nonces i comprovacions de capacitat.
- La restricció «Sollutia només GET» la imposa el codi (`creaFrontissa.js:60-63`), no només la doctrina.
- El canal d'actualitzacions Ed25519 del connector està ben dissenyat i falla en tancat. Només li falta la clau.

#### B.4 La literalitat evitada

També és una lliçó saber què no aplica, i per què:

- **Canvi de prefix de taules (fila 42).** PostgREST exposa les taules pel nom, i la frontera és la RLS. L'equivalent real és el SQL dinàmic dins de les funcions SECURITY DEFINER.
- **Nucli de WordPress (files 22, 23 i 26).** No en tenim; aplica als amfitrions.
- **FTP i SSH.** El front és estàtic i el Supabase, gestionat.
- **Passarel·la de pagament (fila 75).** No n'hi ha. Gestoria i Bar tracten dades financeres en local i només en DEV; la fila es reobrirà si arriben a producció.
- **Versió del servidor.** No tenim servidor propi.

En canvi, **el connector `wordpress-plugin/` és PHP dins de WordPress**, i ací la checklist s'aplica literalment (F0-19, F3-11, F4-11, F5-09).

### C. Vigilante: els coms tècnics i com es traduïxen

Vigilante 3.0.4 (Fernando Tellado, AyudaWP) és a `_wiki_de_poble/04_escriptori/02_investigacio_ia/vigilante/` i té uns 3,5 MB de PHP.

- **Com l'hem llegit.** Catorze lectors han llegit sencers els fitxers de cada mòdul, i cada lectura ha passat per un traductor i un escèptic que ha comprovat tant el PHP com el repo de Sóc de Poble.
- **Plataforma.** Les 514 afirmacions sobre capacitats de Supabase i Vercel s'han verificat a la documentació oficial (recompte a Verificació).
- **Llicència.** Vigilante és GPL v2 o posterior i Sóc de Poble és AGPL-3.0 o posterior. Amb la clàusula «o posterior», Vigilante es pot prendre com a GPLv3, que és compatible amb l'AGPL-3.0. Per tant, podem traduir-ne els mecanismes i fins i tot portar-ne codi, amb atribució i conservant-ne la llicència. En este informe, els mecanismes es descriuen amb paraules nostres.

**La lliçó de fons.** No es tracta de portar un tallafocs PHP a Supabase. Vigilante ha de fer-ho tot dins de WordPress perquè WordPress no té capes; Sóc de Poble sí que en té, i cada mecanisme de Vigilante té el seu lloc natiu en una d'elles:

| Mòdul de Vigilante | Capa nativa a Sóc de Poble |
| --- | --- |
| Tallafocs i limitador | Triggers `BEFORE INSERT` amb `pg_advisory_xact_lock` (el patró de `trg_rate_limit_xat`), límits d'Auth de GoTrue; `db_pre_request` de PostgREST només si hi ha un cas d'ús |
| Mode sota atac | Una data de caducitat a `private.ajustos` i guardes que la consulten; el hook «Before User Created»; l'Attack Mode de la vora del hosting |
| 2FA | MFA TOTP natiu de GoTrue i la reclamació `aal` del JWT, avaluada a la RLS |
| Login i força bruta | Límits d'Auth per IP, CAPTCHA natiu, revocació de sessions |
| Usuaris i rols | `user_platform_roles` i triggers d'auditoria sobre les concessions |
| Escàner de fitxers i autointegritat | Portes de tooling, segells, manifests de release i `salut.php` |
| Registre d'auditoria | Logs de GoTrue i de Postgres, i una taula privada d'esdeveniments propis |
| Capçaleres | La configuració del hosting que servix de veres (avui, Firebase sense configuració versionada) |
| Analitzador | La «foto externa» (secció D) |

Avís transversal: diverses traduccions donen per fet que la vora és Vercel, perquè `vercel.json` és l'única configuració versionada. Mentre el Mestre no decidisca on viu producció (Resum, punt 2), totes les propostes sobre la vora (capçaleres, Attack Mode) són condicionals.

#### C.1 Tallafocs (`class-firewall.php`, `class-ip-utils.php`, `class-rest-api-security.php`, `class-comment-security.php`)

Com ho fa Vigilante:

- **On s'executa.** És un WAF d'aplicació a `init:2`, tardà: el codi d'altres connectors i el PHP cridat directament queden fora (`vigilante.php:176`, `class-firewall.php:79-85`).
- **Què inspecciona.** El camí i la consulta de la URL, amb una sola passada de `rawurldecode` («cru + decodificat»). Les regles són de signatura (SQLi, XSS, RFI/LFI, travessia) i guanya la primera coincidència. Una consulta com `union+select` passa per la URL, perquè `rawurldecode` no convertix el `+` en espai. No inspecciona ni el cos JSON ni les galetes.
- **La IP real.** Per defecte usa `REMOTE_ADDR`. Una capçalera només val si el parell TCP és un proxy de confiança, i `X-Forwarded-For` es llig per la dreta (`class-ip-utils.php:646-809`).
- **El limitador.** Un transient en finestra fixa de 60 s: amb més de 120 peticions bloqueja 300 s, i en mode progressiu fa `base·2^(n-1)` fins a 86.400 s. No és atòmic i compta per IP, de manera que un poble darrere d'un CGNAT compartix el comptador.
- **La lliçó del honeypot mort.** La interfície desa `honeypot_comments`, però el codi llig `honeypot_enabled`: el control no ha funcionat mai (`class-comment-security.php:86-110`, `class-admin.php:6069`). És el patró «maquinària sense endollar» que també patim nosaltres.

Traducció a Sóc de Poble:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-FW-01 | Limitador genèric `private.trg_limita_frequencia()`: trigger `BEFORE INSERT`, SECURITY DEFINER amb `search_path = ''`, `pg_advisory_xact_lock` per àmbit i autor i finestra lliscant sobre les files acceptades, com `trg_rate_limit_xat` (`2609080200_xat_v2_correccions.sql:387-416`). Per a `notes`, `section_submissions` i `organizations`, respon amb SQLSTATE `PT429`, que dona un 429. A `storage.objects` no s'hi poden posar triggers: allí valen els límits del bucket | parcial | alta |
| V-FW-04 | La injecció SQL: PostgREST ja parametritza; l'única via és un `EXECUTE` dins de plpgsql. Llei R10 a `tractor-rls`: tot `EXECUTE` amb `format()` i `%I` o `%L`, o amb `USING` | parcial | mitjana |
| V-FW-03 | La seguretat REST per prefixos equival a GRANT més RLS. Falta revocar `EXECUTE` a `public` i a `anon` de tota funció de `public`, perquè `pg_default_acl` el concedix a anon en els projectes existents | parcial | mitjana |
| V-FW-02 | La IP real: `private.capcalera_client('ip')` pren l'entrada esquerra de XFF, que és justament la forma que Vigilante va corregir. Cal una sonda empírica en staging, llegir només la capçalera que reescriu la passarel·la i no fer servir mai la IP com a clau d'un límit | parcial | mitjana |
| V-FW-06 | `db_pre_request` existix, però en un GET la transacció és READ ONLY i no cobrix ni Auth, ni Storage ni Realtime: no s'ha de configurar sense un cas d'ús | absent | baixa |
| V-FW-14 | El honeypot: l'única escriptura anònima és GoTrue. Té límits per IP configurables (30 cada 5 minuts per a l'alta, la recuperació i l'OTP), CAPTCHA natiu i el hook «Before User Created» | parcial | baixa |
| V-FW-15 | La lliçó del honeypot mort: una porta que compara les claus que llig el codi amb les desades i documentades (claus de `private.ajustos`, constants de `wp-config.php`, opcions d'Ajustos). Ja n'hi ha un precedent: S4 de `tractor-sollutia` | parcial | baixa |

Per al connector de WordPress (literal): el comptador de `/socdepoble/v1/traduir` compta per `REMOTE_ADDR` dins d'un pany atòmic, i això és correcte per defecte. Resoldre la IP darrere d'un proxy declarat a `wp-config.php` és una decisió del Mestre, perquè `readme.txt:69` ho delega a `mod_remoteip` (V-FW-05). També proposem una prova de Salut del lloc amb un POST `{}` a `/traduir`: si respon amb un codi d'un tallafocs aliè, l'amfitrió ens està bloquejant (V-FW-16).

No traduïble: la capa `.htaccess`, les signatures sobre la URL (PostgREST parametritza, i en text valencià donarien falsos positius), els filtres d'user agent, el filtre de mètodes, XML-RPC i els comentaris.

#### C.2 Mode sota atac (`class-under-attack.php`)

Com ho fa Vigilante:

- **Cicle de vida.** S'activa amb un botó i dura 4 hores fixes. La caducitat és «mandrosa»: s'aplica en la primera petició que arriba després de vençuda.
- **Configuració.** Enduriment per capes, amb una instantània de la configuració anterior que es restaura en eixir.
- **El repte.** Un repte JavaScript de prova de treball de 16 bits (uns 65.536 hash), que un bot resol en mil·lisegons; el mateix codi ho admet. El token és un HMAC reutilitzable durant 15 minuts des de la mateixa IP, i la galeta és determinista per IP.
- **Tancaments.** 30 peticions per minut, REST anònima en 503 i només els mètodes GET, POST i HEAD (`class-under-attack.php:1093-1155`, `:1339-1382`).

Traducció a Sóc de Poble:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-ATAC-01 | La clau `mode_atac_fins` a `private.ajustos` i `private.mode_atac_actiu()`, STABLE: la caducitat és exacta, sense cron ni carreres. Les RPC d'activació i desactivació van protegides per `es_superadmin()` | parcial | mitjana |
| V-ATAC-02 | Res no reescriu cap configuració: cada guarda consulta `mode_atac_actiu()` i ajusta el seu llindar | absent | baixa |
| V-ATAC-07 | Límits per `auth.uid()` en triggers, mai per IP (pel CGNAT), amb el llindar reduït en mode atac. El 429 es llança amb `RAISE 'PGRST'`, però `Retry-After` només es pot llegir des d'un altre origen si s'exposa: millor posar l'espera al cos JSON | parcial | alta |
| V-ATAC-08 | Tancar les altes amb el hook «Before User Created» (BETA, Free i Pro, límit de 2 s), que s'obri sol quan caduca el mode. L'interruptor `disable_signup` del tauler no caduca mai | absent | mitjana |
| V-ATAC-09 | Durant el mode, rebutjar les escriptures dels comptes més nous que un llindar. Sense estat «pendent», perquè amagaria publicacions (Llei del Píxel) | absent | mitjana |
| V-ATAC-05 | Una prova de treball no filtra res davant d'una SPA que ja necessita JavaScript. L'equivalent és el CAPTCHA natiu (Turnstile o hCaptcha), però avui l'alta, l'entrada i la recuperació no envien `captcha_token`: activar-lo abans deixaria fora tothom. A més, cal obrir la CSP al proveïdor | absent | baixa |
| V-ATAC-14 | L'Attack Mode a la vora (a Vercel és gratuït a tots els plans). Depén d'on viu producció i no protegix Supabase | absent | baixa |
| V-ATAC-16 | Un llibre d'actuació «Mode d'atac» a `supabase/README.md`, amb les palanques i la seua reversió. La meitat són interruptors del tauler que no caduquen sols | absent | mitjana |

La lectura anònima no s'ha de tancar: alimenta les pàgines públiques de tots els amfitrions (V-ATAC-10).

#### C.3 Doble factor (`class-two-factor-totp.php`, `class-two-factor-email.php`, `trait-two-factor-session.php`)

Com ho fa Vigilante:

- **TOTP propi.** És RFC 6238 (HMAC-SHA1, finestra de ±1 pas, `hash_equals`). Per a evitar la reutilització guarda l'últim codi durant 60 s, però el codi val 90 s: queden uns 30 s de reutilització.
- **Secret.** El xifra amb AES-256-CBC i una clau derivada d'`AUTH_KEY`, sense MAC: rotar `AUTH_KEY` destruïx tots els secrets.
- **Codis de recuperació.** Deu codis d'uns 39,6 bits, resumits amb `wp_hash_password`; l'ús únic no és atòmic.
- **2FA per correu.** Sis dígits, 10 minuts i 3 intents; el reenviament reinicia el comptador.
- **Obligatorietat i confiança.** És obligatori per rols, amb 3 dies de gràcia, i té dispositius de confiança de 30 dies.
- **La feblesa central.** Qualsevol camí que cride `wp_set_auth_cookie` fora d'`authenticate` es salta el segon factor.

Traducció a Sóc de Poble: **no s'ha de reimplementar res.** GoTrue porta un TOTP natiu, gratuït i actiu per defecte als projectes allotjats (30 s, una finestra, SHA1 i 6 dígits fixos). El segon factor viatja al JWT com a `aal2`, i la RLS el pot avaluar.

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-2FA-01 | Redefinir `private.es_superadmin()` perquè, a més del rol, exigisca `coalesce(auth.jwt()->>'aal','aal1') = 'aal2'`. Amb una sola funció, el segon factor queda imposat alhora a la RLS, a les RPC i a Storage, sense reescriure cap política. La UI ha de mostrar el pas: avui `RequireAuth` deixaria passar un aal1, i les RPC tornarien 42501 | absent | alta |
| V-2FA-02 | Els passos challenge i verify per l'API REST des d'`auth.js`, perquè `client.auth` està bloquejat a propòsit (`config.js:5-8`). Cal una capacitat opcional `segonFactor` al contracte i renovar la sessió | absent | alta |
| V-2FA-08 | L'alta a `el-meu-perfil`: el QR que torna l'API REST és SVG cru i cal construir-ne el `data:`; el secret es queda només en memòria. És una pantalla nova: Llei del Píxel i pla aprovat | absent | alta |
| V-2FA-19 | Afegir `insufficient_aal`, `mfa_verification_failed`, `mfa_challenge_expired`, `mfa_factor_not_found` i `mfa_ip_address_mismatch` a `CODI_ENTRADA`, mapejats per `error.code` | absent | alta |
| V-2FA-12 | Un trigger sobre `user_platform_roles` que impedix concedir `superadmin` sense un factor verificat. Tanca la confiança en el primer ús | absent | mitjana |
| V-2FA-05 | GoTrue no impedix reutilitzar un codi amb un repte nou dins de ±30 s (verificat al codi font). Cal acceptar el risc per escrit o posar-hi una Edge Function | absent | baixa |
| V-2FA-09 | Supabase no documenta codis de recuperació per a usuaris finals. L'alternativa és un segon TOTP de reserva (es poden tindre fins a 10 factors) | absent | mitjana |
| V-2FA-10 | El 2FA per correu no és un factor independent, perquè el correu ja recupera la contrasenya. No s'ha de traduir | absent | baixa |
| V-2FA-13 | Els dispositius de confiança són la sessió aal2 i la seua revocació. Proposem l'acció «Tanca la sessió als altres dispositius» (`scope: others`), que l'adaptador ja permet | parcial | mitjana |
| V-2FA-17 | `auth.audit_log_entries` només s'omple si l'interruptor del tauler està actiu. Les plantilles de correu «Verification method added/removed» s'han d'activar | absent | mitjana |

Correcció de plataforma important: el Custom Access Token Hook **sí** que pot reescriure l'`aal` del token. És superfície crítica: el GRANT ha de ser només per a `supabase_auth_admin`, i cap amfitrió no ha de tindre accés als hooks ni a les claus de signatura.

Per al connector: un administrador de WordPress pot substituir el bundle (l'`integrity` està desactivat per defecte) i robar els tokens dels veïns. Per això cal recomanar el 2FA de l'amfitrió per a `administrator` i `editor`, al readme i en una prova informativa de Salut del lloc.

#### C.4 Inici de sessió i força bruta (`class-login-security.php`)

Com ho fa Vigilante:

- **El comptador.** Hi ha un comptador per IP a la taula `vigilante_login_attempts`, enganxat a `authenticate:30`, després del hash. Amb 5 fallades en 60 minuts bloqueja 1.800 s, de manera progressiva i fins a 24 hores.
- **Els rebutjos controlats.** Set codis (2FA, bloqueig, restabliment forçat…) no compten com a força bruta.
- **Errors genèrics.** Els missatges d'error són genèrics, perquè no delaten l'existència d'un compte (lliçó S10). La URL de login oculta és ocultació: tot POST a `wp-login.php` passa igualment.
- **Febleses** (`class-login-security.php:1043-1146`, `:1235-1259`):
  - el comptador només és per IP, de manera que una botnet o un /64 d'IPv6 queden lliures;
  - lectura i escriptura no són atòmiques;
  - l'èxit reinicia el comptador de tota la IP: qui té un compte propi fa quatre errors contra una víctima, entra amb el seu compte i torna a començar.

Traducció a Sóc de Poble:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-LOGIN-01 | El limitador natiu de GoTrue per IP. L'entrada amb contrasenya compartix el comptador del refresc (150 cada 5 minuts per defecte) i l'alta va pel seu (30 cada 5 minuts). El client ja traduïx el 429. El Mestre ha de llegir els valors al panell i fixar-los tenint en compte el CGNAT i la wifi municipal | parcial | alta |
| V-LOGIN-02 | El comptador per compte, que Vigilante no té, és el hook «Password Verification Attempt». **Només existix als plans Teams i Enterprise.** En Free i Pro no hi ha cap protecció nativa per compte. Primer cal comprovar el pla | absent | alta |
| V-LOGIN-12 | La política de contrasenyes de GoTrue s'aplica a l'alta i a `PUT /user` (també a la recuperació, que és justament el forat de Vigilante) i torna `weak_password`. Cal fixar un mínim de 10 o més al panell (avui el client diu 10 en tres llocs diferents) i, en Pro, la protecció contra contrasenyes filtrades (HIBP, un tercer) | parcial | alta |
| V-LOGIN-13 | Revocació de sessions. **Defecte real al nostre codi:** `logout({scope:'others'})` passa per `tanca()`, que esborra la sessió local (`src/data/supabase/auth.js:856`) abans de revocar (`:863`). Amb `others`, la persona ix també d'aquest navegador i la seua sessió de servidor queda viva i òrfena. És latent, perquè avui només es crida amb `global` (`compte.js:88`); ho he comprovat al codi. Cal corregir-ho abans d'oferir «Tanca les altres sessions» i afegir `les_meues_sessions` i `revoca_sessio` | parcial | mitjana |
| V-LOGIN-08 | Enumeració. La frase genèrica ja hi és. L'oracle viu és l'alta: cal activar «Confirm email» i també «Confirm phone» perquè `/signup` ofusque un correu existent. El temps de resposta no és constant: un compte inexistent respon sense calcular cap hash | parcial | mitjana |
| V-LOGIN-07 | La IP: `private.capcalera_client` es fia de `cf-connecting-ip` i de la primera entrada de XFF, sense comprovar res. Cal una prova empírica i refer-la (vegeu V-FW-02) | parcial | mitjana |
| V-LOGIN-14 | Llei a `tractor-rls`: tota funció de hook només dona `EXECUTE` a `supabase_auth_admin`. A més, cal corregir R6 perquè exigisca `search_path = ''`: avui només busca la subcadena | absent | mitjana |
| V-LOGIN-15 | Un contracte d'Auth al repo i un script de només lectura contra `GET /v1/projects/{ref}/config/auth`, amb el token de gestió en una variable d'entorn del Mestre, mai al CI. Avui la configuració d'Auth només viu al tauler | absent | mitjana |
| V-LOGIN-11 | CAPTCHA: desactivat a propòsit, per sobirania. Cal deixar escrit qui el pot activar durant un atac | absent | baixa |

No traduïble: la URL de login oculta (és una SPA amb l'API d'Auth pública), les llistes blanques d'IP (el hook no rep la IP) i l'avís d'intents restants, que és un antipatró perquè revela el llindar.

#### C.5 Usuaris i rols (`class-user-security.php`)

Com ho fa Vigilante:

- **Detector d'escalada.** Detecta administradors nous i escalades amb els hooks `user_register` i `set_user_role` (`class-user-security.php:797-936`).
- **Contradicció de gravetat.** La configuració promet gravetat «critical», però registra els esdeveniments com a «warning», de manera que l'alerta d'auditoria no salta mai.
- **Alertes que l'atacant pot desviar.** Un administrador compromés redirigix les alertes canviant `admin_email`.
- **Restabliment forçat.** El fa sense canviar el hash antic.
- **Opcions mortes.** L'aprovació manual de registres té una opció de rebuig automàtic que cap codi no consumix, i la verificació del correu tracta l'absència de fila com si el compte estiguera verificat.
- **La gran feblesa.** Només reacciona a hooks: una inserció directa a la base no dispara res, i no hi ha cap línia base.

Traducció a Sóc de Poble. Ací la base de dades guanya a PHP, perquè un trigger ho veu tot:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-USR-01 | Un trigger `AFTER INSERT/UPDATE/DELETE` sobre `user_platform_roles` i sobre `organization_memberships` quan intervenen owner o admin. Escriu a `private.registre_seguretat`, que és només d'afegir i immutable. Veu les RPC, PostgREST, el SQL Editor i service_role, és a dir, justament la via de l'INSERT directe amb què es crea el superadmin. Cal cobrir també `TRUNCATE` | absent | alta |
| V-USR-02 | Allò que Vigilante no té: una línia base de privilegis aprovada i `private.reconcilia_privilegis()` amb pg_cron, que alerta de privilegis fora de la línia base, superadmins inactius i triggers d'auditoria desactivats (`tgenabled = 'D'`) | absent | alta |
| V-USR-03 | Canal d'avís. Els esdeveniments crítics van a una cua, i una Database Webhook o un cron la passa a una Edge Function que envia el correu. Els destinataris viuen en un secret de la funció, fora de l'abast del superadmin de l'app: és la lliçó d'`admin_email` | absent | alta |
| V-USR-04 | Política de contrasenyes a GoTrue i declarada a `config.toml`. Les tres còpies del 10 s'unifiquen a `src/data/limitsText.js` sense cap canvi visual | parcial | alta |
| V-USR-05 | Restabliment forçat. Una marca a `private.restabliments_forcats`, escrita abans de res. `es_superadmin` i `is_town_member` la consulten a cada petició, de manera que també talla el JWT ja emés. Un trigger sobre `encrypted_password` la neteja | parcial | mitjana |
| V-USR-06 | Un trigger sobre `auth.users` per a cada canvi de correu o de contrasenya, i l'avís a l'adreça antiga amb les notificacions natives («Secure email change» està actiu per defecte). Cal un SMTP propi: l'integrat només envia dos correus per hora | absent | mitjana |
| V-USR-08 | Aprovació manual d'altes. `towns.requereix_aprovacio` (fals per defecte) i `private.altes_pendents`: la pertinença no naix fins que s'aprova. És la resposta a l'autoservei de B.1-4, per als pobles que la vulguen | absent | mitjana |
| V-USR-09 | Verificació del correu: «Confirm email» natiu, declarat a `config.toml` i comprovat per una porta que llig `mailer_autoconfirm` de `GET /auth/v1/settings` | parcial | mitjana |
| V-USR-11 | Llei a `tractor-rls`: tota taula de privilegi porta el trigger d'auditoria i no concedix cap escriptura a anon ni a authenticated | parcial | mitjana |
| V-USR-15 | Caducitat de contrasenyes: no s'ha d'implementar. El NIST la desaconsella i GoTrue ja rebutja una contrasenya nova igual a l'actual | no aplica | — |

No traduïble: la llista de noms d'usuari insegurs (entrem amb el correu), el bloqueig de `?author=N`, la retirada de `/wp/v2/users` i les marques multisite.

#### C.6 Escàner de fitxers (`class-file-integrity.php`, `scan-patterns.json`, `class-plugin-status.php`)

Com ho fa Vigilante:

- **Pressupost.** Una sola petició PHP amb un pressupost de 60 s, en un ordre fix: autoverificació, uploads (fins al 40 % del temps), nucli, arrel, crítics, wp-content, plugins i temes. Si s'esgota, marca l'escaneig com a incomplet i diu què no ha revisat. No té cursor: cada escaneig torna a començar, i en un lloc gran la cua no es revisa mai (`class-file-integrity.php:2038-2284`).
- **Comparació.** Compara el nucli, els plugins i els temes amb els checksums oficials de wordpress.org. Accepta md5, de manera que la força real del control és la d'md5.
- **Ubicació abans que signatura.** Un PHP a uploads, a l'arrel o afegit al nucli ja és sospitós; la signatura només n'afina el motiu. On el codi és esperable, el mode estricte només marca combinacions (un `eval` amb descodificador, un executor a menys de 80 caràcters d'una superglobal…). Les 22 signatures estàndard viuen en un JSON en base64, perquè l'antimalware de l'allotjament no marque l'escàner. Si el JSON falta, la detecció torna «net» en silenci.
- **Estat tri.** Una cerca fallida (regex esgotada, fitxer de més de 8 MiB) es marca «no cercat»; no es dona mai per neta.
- **Línia base i aprovació.** Només `wp-config.php` i `.htaccess` tenen línia base, i aquesta és de confiança en el primer ús. «Beneir» un canvi rellig el disc en el moment del clic, no el diff que s'ha revisat. La llista d'ignorats compara només el camí: un fitxer ignorat que després es reescriu amb malware queda silenciat per sempre.
- **Plugins.** Detecta els plugins tancats o retirats del repositori amb una màquina d'estats (open, closed, removed) i un historial. No hi ha quarantena.

Traducció a Sóc de Poble. No tenim un servidor amb fitxers escrivibles: els nostres «fitxers crítics» són el catàleg de Postgres, la configuració de la vora i els artefactes publicats.

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-FI-08 / V-IM-13 | El catàleg viu de Postgres és el nostre wp-config: `private.empremta_esquema()` (SECURITY DEFINER, `EXECUTE` només per a postgres) emet un JSON canònic de `pg_policies`, funcions SECURITY DEFINER (hash del cos), grants, triggers, `relrowsecurity`, `storage.buckets` i `cron.job`, amb el seu SHA-256. El Mestre l'executa i el desa a `supabase/esquema_viu.json`; el diff de git fa de revisió, mai amb confiança en el primer ús. És la resposta mecànica a B.1-2 | absent | alta |
| V-FI-09 | Per a no arrossegar secrets a eixa instantània: els cossos de les funcions només en hash, les polítiques en clar (són codi d'autorització), i un control de sortida per valors. Els secrets de les funcions, a Vault | parcial | mitjana |
| V-FI-10 | Beneir l'esquema amb el contracte CAS que ja usa `segella.mjs`: `private.aprova_esquema()` només inserix si el hash actual és el revisat i l'últim és l'anterior. Cal revocar `EXECUTE` a `public`, no només a `anon` | parcial | mitjana |
| V-IM-03 | Política restrictiva d'INSERT a `storage.objects`: nom de fitxer UUID amb una extensió de la llista blanca del bucket, sense dobles extensions ni fitxers ocults | parcial | alta |
| V-IM-11 | El llistat de directoris és la política SELECT: cal esborrar «mitjans llegir» i conservar-ne només una de limitada al propietari, perquè `remove()` continue funcionant. `getPublicUrl` continua servint les imatges, perquè `/object/public/` no consulta polítiques. És la correcció de B.1-4 (cal l'ordre del Mestre, perquè contradiu `2609200300:38`) | absent | alta |
| V-IM-04 | Bytes màgics: al client, reutilitzar `formatImatge()` (`netejaMetadades.js:91-99`), que ja existix, afegint-hi AVIF i `%PDF-`. Al servidor, un escaneig que compare la capçalera amb `metadata.mimetype`. `allowed_mime_types` només valida el Content-Type que declara el client | parcial | mitjana |
| V-IM-09 | La quarantena que Vigilante no té: un bucket privat `quarantena`, una taula immutable `private.quarantena_storage`, i objectes que es mouen amb `move()` de l'API, mai amb un DELETE SQL | absent | mitjana |
| V-IM-05 / V-IM-06 | Estat tri a les portes: `tractor-rls` ha de comptar les sentències que ha vist però no ha pogut analitzar. Les exempcions, ancorades al hash de la sentència, no al nom del fitxer: avui `2609110600` està exempt sencer de R3 | parcial | mitjana |
| V-IM-07 | `tractor-capcaleres.mjs`: llig la CSP per directives i falla per efecte (`'unsafe-inline'`, `localhost` en producció, falta d'`object-src 'none'`). Ha de comparar les dues CSP divergents | parcial | mitjana |
| V-IM-08 | `private.html_actiu(text)` com a CHECK `NOT VALID` a `presentacio_html`, en lloc de l'agulla única `<script`; per a les notes, només un informe. Dins de WordPress mana la CSP de l'amfitrió, i per això la defensa del servidor hi pesa més | parcial | mitjana |
| V-IM-15 / V-FI-05 | `tractor-publicacio.mjs`: falla si `dist/` porta ocults o extensions de còpia o de secret (`.sql`, `.bak`, `.env`, `.map`…). Ja passa: el `dist/` local porta `.htaccess` i `.DS_Store` copiats de `public/` | parcial | mitjana |
| V-FI-13 | Els plugins tancats equivalen a les dependències npm obsoletes, amb avisos o despublicades: `npm audit --json` i `npm view …deprecated` en un workflow setmanal, amb historial en un JSON versionat, perquè «despublicat» només es pot deduir amb historial | absent | mitjana |
| V-FI-02 / V-AUTO-14 | El vigilant de crons: `private.estat_tasques()` contrasta les tasques esperades amb `cron.job` i `cron.job_run_details`. Desactivar pg_cron esborra tots els treballs, i ningú no ho veuria | parcial | mitjana |
| V-IM-12 / V-FI-12 | Deduplicació per clau `sha256(tipus\|fitxer\|hash)`: Plaquetes deixaria d'escriure una recepta idèntica cada hora (ja n'hi ha unes 441) i començaria a escriure `journal.ndjson`, que és el que llig la Consola | parcial | mitjana |

Per al connector de WordPress (literal), vegeu C.7: integritat en repòs contra l'inventari signat, una prova asíncrona de Salut amb tres estats, i reverificació després d'`upgrader_process_complete`.

#### C.7 Autointegritat (`class-self-integrity.php`, `bin/verify-manifest.php`, `MANIFEST.sha256`)

És el mòdul que més ens ensenya, perquè resol el mateix problema que els nostres segells. Com ho fa Vigilante:

- **Tres àncores en tres dominis.** A1 són les sumes SHA-256 que publica WordPress.org per a la versió. A2 és el `MANIFEST.sha256` del disc, en format coreutils. A3 és el SHA-256 del manifest, desat a la base de dades. L'estat «ok» exigix les tres, i el manifest local no actua mai sol (`class-self-integrity.php:741-850`).
- **Matriu anti-TOFU.** Un fingerprint nou amb la mateixa versió és crític, llevat que A1 el confirme en les dues direccions. Una versió nova només es torna a ancorar si ve de l'upgrader o si A1 la confirma. Un manifest ancorat que desapareix és crític.
- **Arbre.** Hash per fitxer amb `realpath`. Els enllaços, les eixides de la carpeta i els executables modificats o sobrants són crítics, i qualsevol extensió del nom compta com a executable.
- **Interruptor delatat.** No hi ha cap opció d'apagada a la base: l'única via és un filtre, i el codi identifica per Reflection quin fitxer l'ha declarat i el delata. Té canari de hooks a `PHP_INT_MAX`, caducitat de 72 hores i un watchdog dels seus crons.
- **Feblesa reconeguda.** El verificador viu dins de la carpeta que verifica (SECURITY.md:84): qui escriu fitxers i base de dades pot forjar A3.

Comparació amb Sóc de Poble:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-AUTO-04 | **El segell de skills no té anti-TOFU.** Sense `SKILLS_SEAL.json`, `--update` fa un bootstrap sense comprovar cap rebut previ, tot i que hi ha 99 rebuts a `seal-transactions/`. El rebut vigent `d007031d` no és a l'índex de git: en un clon, la traça dona «ruptura». Proposta: un estat «absent amb història» (crític), i que el bootstrap exigisca l'`afterSeal` de l'últim rebut acceptat | parcial | alta |
| V-AUTO-21 / V-IM-14 | El segell diu «ruptura» però no diu quin fitxer ha canviat (`segella.mjs:72-82`). En una ruptura, cal llistar els fitxers afegits, absents i modificats contra el manifest desat. Hauria estalviat la fatiga d'alarmes de B.2 | parcial | mitjana |
| V-AUTO-16 | El segell exclou per extensió tot el que no és `.md`: un `.mjs` dins de `.agents/skills/` quedaria fora, contra la regla de Vigilante que un executable no s'exclou mai. A més, `sdp-clon-loiverse/SKILL.md` és al disc però no al manifest | parcial | baixa |
| V-AUTO-11 | El canari de hooks és parcial: una prova comprova `PreToolUse → hooks-local.mjs`, però cap no comprova `PostToolUse → segell-auto.mjs`. `.claude/` és a `.gitignore`, i el doctor exigix el `settings.json` versionat. Cal afegir `REQUIRED_AGENT_HOOKS` al doctor | parcial | alta |
| V-FI-15 | Pas zero, sense exclusions: `porta-maquinaria.mjs` compara el SHA-256 de `.claude/settings.json`, `.husky/`, `tooling/gates/`, `tooling/lib/`, `vercel.json` i les `vite*.config.js` amb HEAD, i distingix les diferències cobertes per una lease vigent. Fa visible, no bloqueja | parcial | mitjana |
| V-AUTO-01 / V-AUTO-02 | Connector: el canal Ed25519 existix i falla en tancat, però la clau pública és buida, no hi ha cap `.sig` i `1.0.4.json` apunta a `localhost:8881`. Cal que el Mestre genere la clau fora del repo, signar cada `sdp-release.json` i inventariar també l'adaptador PHP | parcial | alta |
| V-AUTO-05 / V-AUTO-06 / V-FI-16 | Connector: no hi ha integritat en repòs. Proposta: `includes/autointegritat.php` contra l'inventari signat, amb `realpath` i SHA-256 cru; `.php` i `.js` modificats o sobrants són crítics; diari, i després de cada actualització (`upgrader_process_complete`, amb `shutdown` a prioritat 50) | absent | alta |
| V-AUTO-10 | L'SRI com a àncora d'un tercer: acordar amb Sollutia que la seua etiqueta `<script>` porte `integrity` i `crossorigin` presos del `sdp-release.json` signat | parcial | alta |
| V-AUTO-03 / V-AUTO-12 | Connector: dos interruptors silenciosos. Sense manifest, l'alerta crítica de backend de desenvolupament baixa a «recommended»; i esborrar `actualitzador.php` apaga el canal i també el seu avís. Tots dos han de ser crítics | parcial | mitjana |
| V-AUTO-09 | Comparació des de fora: un job programat que baixa cada fitxer de l'inventari publicat i en compara el SHA-256 del cos, no el codi d'estat (la reescriptura SPA respon 200 a tot) | absent | baixa |
| V-AUTO-22 | La imatge Docker del bot instal·la sense lockfile i amb pnpm sense fixar: cada build pot executar codi diferent. Generar el lockfile és una instal·lació, i requerix l'aprovació del Mestre | absent | mitjana |

#### C.8 Registre d'auditoria (`class-activity-log.php`, `class-audit-alerts.php`, `class-database.php`)

Com ho fa Vigilante:

- **Una porta única amb quatre comportes.** Tots els mòduls registren per `log()`, que té quatre comportes: interruptor del mòdul, bandera per tipus, divisió del login i exclusions d'usuari i d'IP. Silenciar la captura silencia també les alertes, i apagar el mòdul no queda registrat (`class-activity-log.php:155-284`).
- **Captura.** Ho captura per hooks. Un administrador nou o una escalada es registren com a «warning», de manera que, amb el llindar «critical» de fàbrica, no alerten mai.
- **Esquema i retenció.** Una taula amb 15 columnes, sense cap columna d'integritat. Escriu en hora local i purga en UTC. Es purga per edat (30 dies) i per volum (10.000 files, sense mirar la gravetat). `max_entries = 0` buida el registre, el TRUNCATE per AJAX no deixa rastre i, en desinstal·lar, fa DROP TABLE.
- **Alertes.** Immediates per gravetat, amb una clau antiduplicació que no inclou ni la IP ni l'actor, de manera que atacs diferents es fonen en un sol avís. Per llindar, amb una finestra que no és lliscant.

**La conclusió: Vigilante no protegix el registre contra un administrador compromés.** Postgres sí que ho pot fer:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-REG-01 | `private.registra_auditoria(...)`, VOLATILE, SECURITY DEFINER, `REVOKE EXECUTE` a `public`, `anon` i `authenticated`: és l'única porta d'escriptura. L'actor el fixa la funció, no el qui la crida. No té cap comporta configurable: l'auditat no pot cegar el seu auditor. Les accions privilegiades fallen en tancat i les informatives, en obert | parcial | alta |
| V-REG-02 | `private.registre_auditoria`: `seq` sense forats, `created_at` amb `clock_timestamp()`, actor sense FK, `ip_hash`, dades `jsonb` fitades, `prev_hash` i `hash` (CHECK de 64 hex). Cap nom ni correu en clar; si cal, `hash_subjecte` | absent | alta |
| V-REG-10 | Immutabilitat: `REVOKE ALL`, també a service_role; triggers `BEFORE UPDATE OR DELETE` i `BEFORE TRUNCATE` (com `consentiments_immutables`), i una cadena `sha256` calculada en un trigger `BEFORE INSERT` sobre una fila de cap. Com que postgres pot desactivar triggers, l'àncora ha de ser fora de la base | parcial | alta |
| V-REG-04 | Triggers sobre `user_platform_roles` i `organization_memberships`: gravetat crítica per a un superadmin o un owner nou, cosa que Vigilante no aconseguix. Coincidix amb V-USR-01 | absent | alta |
| V-REG-03 | Les RPC privilegiades (`resol_reclamacio`, `admin_list_users`, `demana_baixa`, `cancela_baixa`, purgues) criden el registre. `cancela_baixa` esborra avui sense deixar rastre (`2609261500:1268`). Cada migració deixa una línia «sistema/migracio» | absent | mitjana |
| V-REG-05 | Ingesta d'`auth.audit_log_entries` amb pg_cron i un cursor. Cal activar abans «Write audit logs to the database» i comprovar si els intents fallits hi apareixen | absent | mitjana |
| V-REG-06 | Trigger sobre `private.ajustos`, `politiques_privacitat` i `towns.is_open`. Els secrets com el pebre RGPD només es registren com a «rotats». L'actor de l'editor SQL sempre serà `postgres`, no la persona | absent | mitjana |
| V-REG-09 | Purga per gravetat i mai per volum. Abans de purgar, una fila «auditoria/purga» amb el rang i el hash de l'última fila purgada | parcial | mitjana |
| V-REG-12 / V-REG-13 | Alertes: un trigger per a les crítiques amb `realtime.send` a un canal privat de superadmin (cal la política SELECT corresponent), i llindars amb finestra real sota pany consultiu | absent | mitjana |
| V-REG-15 | Batec: pg_cron inserix cada hora «sistema/batec» amb el cap de la cadena, i una comprovació externa alerta si falta o si `seq` retrocedix | absent | baixa |

**El mateix defecte el té el nostre LEDGER (V-REG-16).** `withSignedLedger` torna a signar sense condicions, i `tancament --close` el crida abans de verificar. Una edició al mig del LEDGER queda segellada sense cap pas explícit (`tooling/documental/ledger.mjs:14-18`, `tooling/gates/tancament.mjs:58`). La immutabilitat que proclama QUI_SOC §3 és doctrina, no mecànica. Proposta: `porta-ledger-creix.mjs` exigix que el cos del LEDGER de l'arbre de treball comence exactament pel de HEAD. Coincidix amb el mapa d'integritat, que va veure 11 segells intercalats i línies històriques reescrites.

Per al connector: un bus `do_action('socdepoble_enxufe_esdeveniment', …)` als punts de seguretat que avui es perden (signatura del canal fallida, paquet amb un SHA-256 que no quadra, pressupost de DeepL exhaurit), més un anell dels últims 20 esdeveniments visible a Salut. Si l'amfitrió té Vigilante, s'hi pot fer un pont opcional amb el tipus «security».

#### C.9 Capçaleres i servidor (`class-security-headers.php`, `class-https-enforcer.php`, `class-htaccess-*.php`)

Com ho fa Vigilante:

- **On posa les capçaleres.** No les envia en temps d'execució: les escriu al `.htaccess` dins de `IfModule mod_headers`. A Nginx no n'arriba cap, i sense `mod_headers` falla en silenci (`class-security-headers.php:340-552`).
- **La CSP de fàbrica.** És de compatibilitat: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:` no frena cap XSS. Si la CSP és restrictiva, l'exclou de `wp-admin` amb `SetEnvIf`.
- **Sanejament i escriptura.** Saneja en el moment de generar el bloc, no de desar-lo, i això protegix qualsevol via d'entrada. Escriu el `.htaccess` amb pany, còpia, relectura i restauració, però sense escriptura atòmica.
- **Dues lliçons involuntàries:**
  - el `FilesMatch` no cobrix `.env` ni `.git`, i l'escàner de fitxers se'ls salta perquè creu que el tallafocs ja els protegix;
  - la sonda de l'analitzador dona un fitxer per exposat si respon amb qualsevol 2xx, de manera que darrere d'una reescriptura SPA tot són falsos positius. És el nostre soft 404 (B.1-1).

Traducció a Sóc de Poble. Tot depén de la decisió del punt 2 del Resum (Firebase o Vercel). Producció servix HSTS amb `max-age` d'un any (Firebase) i cap altra capçalera.

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-CAP-02 | Un mòdul pur de política `src/config/politicaCsp.js` i una prova que exigix que les CSP de `vercel.json:8`, `index.html:17` i la del build natiu coincidisquen directiva a directiva. Avui divergixen (`data:`, `127.0.0.1`, `sdp-media:`, `localhost`) i no hi ha cap control entre `vercel.json` i `index.html` | parcial | alta |
| V-CAP-01 | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` i `Permissions-Policy`, sense apagar mai `web-share`, `clipboard-write`, `accelerometer` ni `gyroscope`, perquè l'app les delega (`EspecimenMediaExterna.jsx:17`). Van a la configuració del hosting que servix de veres | parcial | alta |
| V-CAP-03 | En lloc d'obrir la política, adaptar el codi: tres pujades fan `fetch(dataUrl)` (`useHeroImageHandler.js:7`, `DetallAjust.jsx:14`, `richText/extensions/index.js:76`), que una CSP sense `data:` a `connect-src` bloqueja. Cal descodificar en local amb el `deBase64` que ja existix, o amb `canvas.toBlob` | absent | alta |
| V-CAP-15 | Una sonda posterior al desplegament amb el `fetch` natiu de Node 22. Un 200 `text/html` amb el cos de l'index vol dir «absent»; un 200 amb un altre tipus és una fallada. És la lliçó del soft 404 | absent | alta |
| V-CAP-04 | Llevar `localhost` de la CSP de producció (`vercel.json:8`). Després, i amb decisió del Mestre, substituir `https: wss:` per l'inventari real d'orígens, primer en Report-Only. Com que el refresh token viu a `localStorage`, la CSP val encara més | parcial | mitjana |
| V-CAP-06 | `public/auth/callback.html` porta un script en línia que la CSP global trencaria. Cal retirar-lo, perquè ja és fora del flux, o traure l'script a un fitxer extern, com fa `calendari-google.html` | parcial | mitjana |
| V-CAP-13 | Una prova posterior al build que recórrega `dist/` amb una llista negra d'extensions i una llista blanca d'ocults (ja n'hi ha `.DS_Store`) | parcial | mitjana |
| V-CAP-11 | Les Redirect URLs de GoTrue fan el paper d'`allowed_redirect_hosts`. Cal versionar-les per amfitrió i camí, sense comodins. Ull: GoTrue accepta qualsevol camí del host de la Site URL sense mirar la llista | parcial | mitjana |
| V-CAP-18 | Per al connector: un contracte amb la CSP que necessita el component i una prova de Salut asíncrona que el contrasta amb el que l'amfitrió envia de veres | absent | mitjana |
| V-CAP-14 | Llei a `tractor-rls`: cap `allowed_mime_types` amb `image/svg+xml` ni `text/html`. Storage servix els SVG tal qual, i un SVG amb script seria actiu al domini del projecte. Els 25.242.880 bytes del bucket privat no són 25 MiB | existeix | baixa |

No traduïble: tot el que escriu el `.htaccess` en calent (el gestor transaccional, la resincronització, la recuperació). Nosaltres tenim git i desplegaments atòmics, i cap configuració no s'escriu en execució.

#### C.10 Enduriment, còpies i configuració (`class-wpconfig-security.php`, `class-database-prefix.php`, `class-*-backup.php`, `class-settings.php`)

Com ho fa Vigilante:

- **Constants de `wp-config.php`.** Escriu un bloc de constants, i abans comenta les nou que gestiona. Quatre només les torna a emetre si l'opció és certa, que de fàbrica no ho és: és un afebliment silenciós, perquè la pantalla mostra l'opció i no la constant viva (`class-wpconfig-security.php:472-647`).
- **Salvaguardes.** Prou bones (mida mínima, marcadors obligatoris, rebuig si el fitxer resultant fa menys del 50 % de l'original), però l'escriptura no és atòmica.
- **Canvi de prefix.** És una seqüència no atòmica i sense pany, que només afig obscuritat.
- **Còpies.** Un ZIP de `wp-config` en clar i un dump SQL en memòria, sense xifrat, sense rotació i sense cap restauració provada.
- **Desinstal·lació.** Una llista de noms mantinguda a mà, que ja ha derivat.

Traducció a Sóc de Poble:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-END-10 | **Còpies.** El pla gratuït de Supabase no té cap còpia gestionada (les diàries són de Pro, i PITR les substituïx). Proposta: `tooling/ops/copia-bd.mjs` amb `supabase db dump` en tres peces (rols, esquema i dades), xifrat amb clau pública, rotació, manifest SHA-256 i restauració mensual en local. Storage va a banda. És la resposta a B.1-3 | absent | alta |
| V-END-03 | L'equivalent de `DISALLOW_FILE_MODS`: `ALTER DEFAULT PRIVILEGES … REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated` i la forma global per a `PUBLIC`, de manera que cada RPC exposada necessite un GRANT explícit i revisable. Avui `private.is_town_member` concedix EXECUTE a `public` i a `anon` (`2609080000:446-447`). **Atenció:** segons la documentació, a partir del 2026-10-30 els projectes existents deixen de concedir aquests privilegis automàticament; qualsevol migració posterior haurà de declarar els seus GRANT | parcial | alta |
| V-END-09 | El pebre RGPD viu en text pla a `private.ajustos`, i `hash_subjecte` fa `coalesce(pebre, '')` (`2609261500:536`): **sense pebre, falla en obert.** Cal moure'l a Vault, fallar en tancat i versionar les empremtes (`v1:`) | parcial | alta |
| V-END-01 | La configuració d'Auth (longitud mínima, confirmació de correu, MFA, límits) declarada a `supabase/config.toml`, més `porta-auth-config.mjs`, que llig la configuració viva per l'API de gestió i comprova la monotonia: el valor viu ha de ser igual o més estricte que el declarat | absent | alta |
| V-END-02 | Monotonia a `tractor-rls`: cap migració pot retirar una protecció (`DISABLE` o `NO FORCE RLS`, `DROP POLICY` sense substitut, un REVOKE que oblide `anon`, un GRANT a `anon` sense política). És la lliçó de l'afebliment silenciós de Vigilante | parcial | alta |
| V-END-06 | Un inventari declaratiu del que Sóc de Poble crea al Supabase, més `porta-inventari-bd.mjs` amb un rol de només lectura contra el catàleg viu. Coincidix amb V-FI-08 | absent | alta |
| V-END-04 | Errors sense filtracions: cap sourcemap (prova), cap `error.message` cru a la UI, i cap UUID intern dins del `MESSAGE` de `SDP-LOCK` (`2609080000:210-216`), perquè PostgREST el reenvia sencer al navegador | parcial | mitjana |
| V-END-08 | Els Security Advisors de Supabase (lints 0001-0030) i `supabase db lint`, llegits periòdicament per l'API de gestió i desats com a evidència, sense cap correcció automàtica | parcial | mitjana |
| V-END-15 | Refinar la regla L9 de `tractor-consell-core.mjs`, que ja recorre `dist/`: descodificar cada JWT i fallar només si `role ≠ anon`; fallar sempre amb `sb_secret_` | parcial | mitjana |
| V-END-17 | Per al connector: proves de Salut quan l'amfitrió està endurit (REST `authenticated_only` que torna 401 a `/traduir`, `DISALLOW_FILE_MODS`, una CSP sense `wss:`) | absent | mitjana |
| V-END-05 | `executor-mutacio.mjs` és atòmic, però accepta qualsevol contingut, fins i tot buit. Cal afegir-hi una validació de forma per tipus de fitxer, a l'estil de `check_before_write` | parcial | baixa |

No traduïble, i és la literalitat que demanava evitar el prompt: el canvi de prefix (PostgREST publica els noms a l'OpenAPI i la frontera és la RLS), les constants de `wp-config.php` i les còpies ZIP de fitxers de servidor amb secrets.

#### C.11 Analitzador de seguretat (`class-security-analyzer.php`, `security-analyzer/*`)

Com ho fa Vigilante:

- **Dues fases.** Una fase ràpida, de lectures locals, i una de lenta, amb loopback HTTP, TLS i DNS. Set categories en ordre fix, i cada resultat té cinc estats: pass, warn, fail, info i skip.
- **Nota.** Puntua sobre 118 punts i dona una nota de l'A a l'E. Si l'autointegritat falla, la nota queda limitada a E (29).
- **Defectes de mesura** (`class-security-analyzer.php:224-308`, `class-sa-helpers.php:120-344`):
  - els skip conserven el seu màxim al denominador, de manera que una caiguda de xarxa resta fins a 18 punts i pot disparar una falsa regressió per correu;
  - un `.env` exposat pesa menys que un tema desactualitzat;
  - les sondes són loopback, i el servidor que es mira a si mateix no veu el que veu el visitant;
  - qualsevol 2xx compta com a exposat.
- **Configuració, no mesura.** Les comprovacions d'accés només llegixen la configuració.

Traducció a Sóc de Poble. És la **foto externa** que la Part A demana, i ara n'hi ha un disseny concret:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-ANA-01 | `tooling/seguretat/analitzador.mjs --fase dins\|fora\|tot`, només amb Node 22 natiu i sense `npm install`. «Dins» és l'anàlisi estàtica de migracions, CSP, `dist/` i lockfile, que s'executa abans del linter, perquè avui una fallada al pas 3 impedix arribar a L9 (pas 27) i a RLS (pas 55). «Fora» són HTTP i TLS reals des d'un runner programat, no loopback | parcial | alta |
| V-ANA-10 | La frontera anònima: amb la clau anon, un `GET /rest/v1/<taula>?select=*&limit=1` per a cada taula de `public` ha de tornar denegat o `[]`, excepte les públiques declarades; les RPC revocades, denegades; llistar `mitjans_privats` sense sessió, buit. Només es registren el codi i el nombre de files, mai el contingut. **És la prova que necessita B.1-2** | parcial | alta |
| V-ANA-12 | `private.es_superadmin_fort()` amb `aal2` i un comptador de superadmins i moderadors sense factor verificat, sense identitats. Coincidix amb V-2FA-01 | absent | alta |
| V-ANA-14 | Integrar el Security Advisor (lints 0011, 0013, 0028, 0029), o una `private.diagnosi_seguretat()` per a service_role que només torne enters | parcial | alta |
| V-ANA-09 | Capçaleres i diagnosi «configurat però no aplicat»: la sonda contrasta la configuració del repo amb la resposta real. Avui ja sabem que no s'hi aplica res (B.1-1) | parcial | alta |
| V-ANA-07 | `sondes.mjs`: `fetch` amb `redirect: 'manual'`, TLS amb `rejectUnauthorized: true`, i `esExposat()` per signatura de contingut, mai per 2xx. Cal provar-les contra un servidor local amb una reescriptura SPA que respon 200 a tot, per a demostrar zero falsos positius | parcial | mitjana |
| V-ANA-11 | Sonda de fitxers sensibles per signatura (`[core]`, `ref: refs/`, `CLAU=valor`). **Avís si mai es desplega a Vercel:** `vercel.json` no fixa `"outputDirectory": "dist"`, i amb el preset «Other» podria servir l'arrel del repo, on hi ha `.env`, `.git` i `.wwebjs_auth` | parcial | mitjana |
| V-ANA-15 | Fi de vida: Node 20 és EOL des del 2026-04-30, i encara el fan servir `sdp_lock_ci.yml` i el `Dockerfile`. El connector declara PHP 7.4 com a requisit mínim, una versió que és EOL des del 2022 | absent | mitjana |
| V-ANA-05 | Un workflow setmanal amb `permissions: contents: read`. Una regressió (10 punts o FAIL nous) només compta sobre les comprovacions avaluades les dues vegades: un skip no és mai una regressió. Avisa amb una issue, perquè el correu de GitHub només el rep qui ha creat el cron | absent | mitjana |
| V-ANA-03 | La puntuació, sobre el màxim avaluat i amb la cobertura a banda; amb menys del 80 % de cobertura, l'informe és «incomplet». Si falla la integritat del desplegament, l'informe és «no fiable», amb el seu topall | absent | baixa |

No traduïble: amagar rutes i versions de WordPress (Sóc de Poble és AGPL i publica la seua versió a propòsit a `sdp-release.json`), els permisos de fitxer, i les llistes negres per IP d'una IP compartida de CDN.

#### C.12 Punts d'entrada d'administració (`admin/class-admin-ajax.php`, `class-admin-recovery-ajax.php`)

Com ho fa Vigilante:

- **Superfície.** Unes 60 accions `wp_ajax_`, totes sense variant `nopriv`. `wp_ajax_` només garantix que hi ha sessió, no que siga un administrador: la defensa real és el nonce i la capacitat dins de cada manipulador.
- **Nonce.** Un sol nonce per a uns 57 manipuladors, fins i tot el canvi de prefix i la còpia de la base.
- **Autorització en tres capes.** Global (`manage_options`), per destinatari (`edit_user`, també dins dels bucles massius) i de xarxa.
- **Sanejament.** Cada paràmetre se saneja per separat.
- **Accions perilloses.** Les destructives i massives no tenen límit de freqüència ni reautenticació. Reconfigurar el TOTP no demana ni codi ni contrasenya: qui robe una sessió pot enrolar un factor seu i guanyar persistència (`admin/class-admin-ajax.php:612-647`).
- **Herència.** La configuració bloquejada és una convenció que cada escriptor nou ha de recordar.

Traducció a Sóc de Poble. Molta cosa ja està resolta pel disseny: el JWT va a la capçalera i no hi ha CSRF; GRANT per columna; CAS als segells.

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-AJAX-09 | **Accions destructives sense reautenticació.** La superadmin entra amb un sol factor i veu el correu de tots els comptes, i `updateUserPassword` canvia la contrasenya només amb la sessió. Fase 1: decidir si s'activa «Secure password change» (ve desactivat). Fase 2: `aal2` a `es_superadmin()` (V-2FA-01) | absent | alta |
| V-AJAX-01 | La sobrecàrrega SQL és el parany «classe contra trait»: `admin_list_users()` i `admin_list_users(integer, integer)` conviuen, i la vella està revocada, però no esborrada. Cal esborrar-la i afegir una regla contra els noms amb dues signatures. R8 s'ha d'aplicar a tota funció SECURITY DEFINER de `public` | parcial | mitjana |
| V-AJAX-08 | `private.limita_ritme(clau, max, finestra)`, que llança `PT429`, cridada a `exporta_les_meues_dades`, `demana_baixa`, `cancela_baixa`, `resol_reclamacio` i `admin_list_users`, sempre per `auth.uid()` i mai per IP | parcial | mitjana |
| V-AJAX-14 | `private.registre_admin`, immutable (amb el disparador calcat de `consentiments_immutables`), i una regla de `tractor-rls`: tota funció que crida `es_superadmin()` i escriu alguna cosa també anota a `registre_admin`. Coincidix amb V-REG-01 | parcial | mitjana |
| V-AJAX-06 | R5 de `tractor-rls` no veu el GRANT múltiple d'`app_content` (`2609140100:48`) ni el dinàmic amb `execute format` (`2610042350:86`). Proposta: corregir R5 i revocar l'escriptura d'`app_content` a `authenticated` | parcial | mitjana |
| V-AJAX-03 | Falta la capa d'administrador de poble: `town_memberships.role` és text sense CHECK, només s'hi escriu `member` i `moderador` no es fa servir. L'autorització ha de continuar consultant la taula, no un claim del JWT | parcial | mitjana |
| V-AJAX-07 | Codis d'error: el límit del xat usa l'errcode `42900`, que no és estàndard i ix com a 400; ha de ser `PT429`, que dona un 429 real | parcial | baixa |
| V-AJAX-13 | La recuperació d'accés ja no té porta del darrere: el rol de superadmin només s'escriu fora de banda. Falta un procediment a la Wiki per a restaurar una superadmin des del SQL Editor, i decidir si n'hi ha d'haver un mínim de dues | existeix | baixa |
| V-AJAX-16 | Per al connector: `socdepoble_enxufe_oblida_tenant_heretat` penja d'`admin_init` i fa un `update_option` fins i tot en un `admin-ajax.php` anònim. Avui és benigne, però cal retornar si no hi ha `manage_options` | parcial | baixa |

#### C.13 Doctrina i història (`SECURITY.md`, `readme.txt`, `changelog.txt`, `vigilante.php`)

El changelog és una escola, i tres de les seues lliçons ens toquen de prop:

- **La IP del client és la zona amb més correccions de seguretat.** Vigilante llegia l'entrada esquerra de XFF fins a la 2.11.8, no comprovava el parell TCP fins a la 2.11.9, i el mode sota atac es creia el `CF-Connecting-IP` de qualsevol. **El nostre `private.capcalera_client` fa avui el que Vigilante va corregir a la 2.11.8:** pren la primera entrada de `x-forwarded-for`, la que escriu el visitant (`2609261500:517`, V-DOC-02, prioritat alta). Per ara només alimenta l'`ip_hash` dels consentiments, però cal una prova empírica abans de construir-hi res.
- **«Camp absent vol dir desmarcat» va causar tres regressions greus.** La nostra versió és `hash_subjecte`, que amb un pebre absent fa servir una cadena buida (V-DOC-13 i V-DOC-14).
- **La documentació contradiu el codi en tres llocs.** El readme diu que el tallafocs va abans de la memòria cau, que el 2FA ve actiu per defecte, i que el preset Màxim posa la CSP en report-only; cap de les tres coses no és certa. A més, SECURITY.md:34 contradiu el que el codi fa amb la llista d'ignorats. És el nostre patró de doctrina sense mecànica (B.2, V-REG-16).

Altres traduccions de la doctrina:

| ID | Mecanisme natiu | Estat | Prioritat |
| --- | --- | --- | --- |
| V-DOC-08 | Verificar l'estat real, no el declarat: `supabase/snippets/conformitat_cataleg.sql`, de només lectura, amb taules sense RLS, SECURITY DEFINER sense `search_path`, funcions executables per anon, vistes sense `security_invoker`, tasques absents de `cron.job` i `schema_migrations` comparat amb els fitxers. El Mestre l'executa després de cada aplicació i ho anota al LEDGER | parcial | alta |
| V-DOC-05 | El vigilant de crons: `private.tasques_esperades` i `private.vigila_tasques()`. La purga RGPD de baixes només es programa si pg_cron ja era actiu, i si no, deixa un `raise notice` que es perd | absent | alta |
| V-DOC-10 | Una alerta deduplicada per conjunt: `segell-auto` repetix «segell divergent» després de cada eina, sense recordar que ja ho ha dit, i ensenya els agents a ignorar-lo. Proposta: una empremta de la divergència desada a `.agents/runtime/`, el missatge complet només quan és nova i una línia curta quan es repetix. `tancament --check` continua fallant mentre dure | absent | mitjana |
| V-DOC-12 | L'àncora externa del LEDGER: `verify-ledger.mjs --base <ref>` exigix que la versió nova comence per la de git. El hash del LEDGER s'ha de dir «empremta», no «signatura» | parcial | mitjana |
| V-DOC-11 | Canari dels hooks: un batec mínim de `hooks-local` i `segell-auto` a `.agents/runtime/`. Un torn amb canvis d'agent però sense batec de PreToolUse és «sense vigilància acreditada», i `despertar` avisa si hi ha `disableAllHooks` | parcial | baixa |
| V-DOC-16 | Política de divulgació: `SECURITY.md` a l'arrel i `public/.well-known/security.txt` (RFC 9116). No n'hi ha cap dels dos | absent | baixa |
| V-DOC-17 | L'ordre de capes ja és bo: el service worker servix les navegacions de la xarxa, només guarda `/assets/<nom>-<hash>` i exclou `/rest/`, `/auth/` i companyia. Cal incloure `sw.js` a la verificació externa | existeix | baixa |

#### C.14 El que diu la documentació de la plataforma

De les 514 afirmacions sobre Supabase i Vercel, 388 són certes, 109 parcials, 5 falses i 12 no verificables. Les cinc falses, ja corregides a les taules:

- GoTrue no rebutja un codi TOTP ja acceptat si arriba amb un repte nou (verificat a `internal/api/mfa.go`).
- Sí que hi ha vies per a emetre un JWT `aal2` fora del flux MFA: el Custom Access Token Hook, el secret JWT llegat o una clau importada.
- El Custom Access Token Hook sí que pot canviar l'`aal` del token.
- GoTrue no iguala el temps de resposta entre un compte inexistent i una contrasenya errònia (`token.go:110`).
- Sí que hi ha codis de recuperació MFA, però són experimentals.

Els matisos que condicionen el disseny:

| Tema | Matís |
| --- | --- |
| **Pla del projecte** | Hi ha moltes peces que només existixen en un pla de pagament: còpies gestionades (Pro), PITR (Pro amb compute Small), HIBP (Pro), controls de sessió (Pro) i els hooks de verificació de contrasenya i de MFA (Team o Enterprise). **Cal saber en quin pla és el projecte de Sóc de Poble** |
| **Privilegis per defecte** | El 2026-10-30 (d'ací a 24 dies) els projectes existents deixen de concedir automàticament privilegis a `anon`, `authenticated` i `service_role` sobre taules i funcions noves de `public`. Les migracions hauran de declarar els seus GRANT, o es rebrà 42501 |
| **Còpies** | El pla Free no en té cap de gestionada. Les físiques no es poden descarregar i no inclouen Storage. Esborrar el projecte esborra les còpies |
| **Registres** | Retenció d'1 dia en Free, 7 en Pro, 28 en Team. `auth.audit_log_entries` és opcional. pgaudit escriu als logs, no a cap taula |
| **Data API i Storage** | Cap limitador natiu. `db_pre_request` només cobrix PostgREST, i en GET és READ ONLY. `PT429` dona un 429 |
| **IP del client** | La recepta oficial de Supabase pren la primera entrada de XFF, que és falsificable. Cal una prova empírica |
| **Correu d'Auth** | L'SMTP integrat envia dos correus per hora per projecte i només als membres de l'organització: en producció cal un SMTP propi |
| **Storage** | `allowed_mime_types` valida el tipus declarat, no els bytes. Un SVG se servix tal qual. Els triggers sobre `storage.objects` no estan admesos |
| **Vault** | La clau arrel es pot recuperar amb qualsevol PAT del projecte. Els secrets s'han de crear des del panell, mai des d'una migració |
| **Claus d'API** | Les claus llegades `anon` i `service_role` perden el suport a finals de 2026; les noves són `sb_publishable_` i `sb_secret_` |
| **Edge Functions** | 2 s de CPU. `verify_jwt` accepta també les claus publicable i secreta, i no mira `aal`: l'autorització s'ha de fer dins de la funció |
| **Baseline 2022** | Permissions-Policy només fa efecte a Chrome. Safari 16.0 no envia `Sec-Fetch-*`. Cal mantindre `report-uri` al costat de `report-to` |

### D. Full de ruta proposat

L'ordre seguix la lliçó de Tellado: primer saber què hi ha i tindre una xarxa, després tancar portes i, al final, vigilar. Cap pas no canvia l'aparença. Les migracions es lliuren com a «PROPOSTA, NO aplicada», i les aplica el Mestre.

#### D.1 Ara: decisions del Mestre, sense codi

1. **Rotar** la clau de DeepL i tancar `LEDGER.md:837` amb data i responsable. És el primer cas real del protocol d'incidents.
2. **Fixar l'allotjament de producció** (Firebase o Vercel) i versionar-ne la configuració. Si és Firebase, un `firebase.json` amb capçaleres; si és Vercel, `"outputDirectory": "dist"` i capçaleres. És el que desbloqueja C.9, C.11 i la foto externa.
3. **Dir en quin pla és el projecte Supabase.** Condiciona les còpies, els hooks, HIBP, els controls de sessió i la retenció de registres.
4. **Passar tres consultes de només lectura a producció**, que prepararan Claude o Codex:
   - l'inventari del catàleg viu (V-FI-08, V-DOC-08, supabase-heretat/FX-01);
   - la frontera anònima amb la clau publicable (V-ANA-10, FX-02);
   - el llistat anònim de `mitjans` i les polítiques vives de `mitjans_privats` (storage-FX-01 i FX-03).
5. **Activar el 2FA** a Supabase, GitHub (els dos remots), Google, el registrador i el DNS, el hosting i els WordPress amfitrions.
6. **Revisar el Mac:** `firebase login:list`, `gcloud auth list`, `supabase projects list` i el Keychain. Mai consoles de producció obertes al navegador que piloten els agents (plans-control/FX-06).
7. **Abans del 2026-10-30:** comprovar que les migracions pendents porten els seus GRANT explícits (C.14).
8. **Decidir què publica el connector** de la Wiki (fuita-FX-02).

#### D.2 Curt termini: codi, amb pla aprovat i lease

**Agents (C.7 i B.1-7):**

- `SECRET_PATHS` a `mutation-policy.mjs` i a `antigravity-hook.mjs`, per a denegar la lectura de `.env*`, `.sdp-reflex/`, `.iaia_auth/` i `supabase/.temp/` (F2-03).
- `forceAsk` a Antigravity per a firebase, gcloud, supabase, vercel, gh i `git push` (plans-control/FX-02).
- Tancar les tres escapatòries del hook de Claude (F5-10).
- Afegir un batec als hooks (V-DOC-11).

**Xarxa:** `tooling/ops/copia-bd.mjs` i un simulacre de restauració (V-END-10, F5-15).

**Migracions proposades:**

- el SELECT de Storage limitat al propietari (V-IM-11) i les polítiques d'INSERT (V-IM-03);
- `ALTER DEFAULT PRIVILEGES` (V-END-03);
- el pebre a Vault i en fallada tancada (V-END-09);
- el registre d'auditoria immutable i els triggers de privilegis (V-REG-01/02/10, V-USR-01);
- el limitador genèric amb `PT429` (V-FW-01);
- esborrar la sobrecàrrega antiga d'`admin_list_users` (V-AJAX-01);
- refer `capcalera_client` (V-DOC-02).

**Portes:**

- `tractor-rls`:
  - R6 ha d'exigir `search_path = ''`;
  - R6, R7 i R8 han d'analitzar la sentència sencera amb `sentencies()`;
  - lleis noves: R10 per als `EXECUTE` sense `format()`, la monotonia, els hooks d'Auth i els drops fantasma;
  - exempcions ancorades al hash de la sentència i un estat tri.
- `segella.mjs`: diagnòstic per fitxer i anti-TOFU (V-AUTO-04/21).
- `segell-auto`: alertes deduplicades (V-DOC-10).
- `porta-ledger-creix` (V-REG-16, V-DOC-12).
- Coherència de les CSP (V-CAP-02).
- `dist/` sense ocults ni extensions de secret (V-IM-15).

**Foto externa:** `tooling/seguretat/analitzador.mjs` amb les fases «dins» i «fora», sondes per signatura i un workflow setmanal (V-ANA-01/05/07/10/11, F1-05, F6-01).

**Seguiment:** el catàleg únic de seguretat i la ruta `incident.seguretat`, amb dependències d'ordre i revisita de 72 hores (A.1, AX-F01/F08, F6-05). És un tractor nou: cal l'aprovació a la Wiki.

**Defectes de codi petits:**

- `logout({scope:'others'})` (V-LOGIN-13);
- l'ordre de `tancaRealtime()` (FX-05/realtime);
- els `fetch(dataUrl)` (V-CAP-03);
- `cancela_baixa` sense rastre (V-REG-03).

#### D.3 Mitjà termini

- **MFA:** les pantalles d'alta i de verificació (Llei del Píxel i pla aprovat). Després, `aal2` a `es_superadmin()` i el trigger de concessió (V-2FA-01/02/03/08/12).
- **Configuració d'Auth com a codi:** `config.toml` i `porta-auth-config.mjs` (V-END-01, V-LOGIN-15).
- **Connector:**
  - la clau Ed25519 i les releases signades;
  - autointegritat en repòs i proves de Salut;
  - l'SRI acordat amb Sollutia (V-AUTO-01/05/10, V-FI-16);
  - el bus d'esdeveniments (V-REG-18);
  - la secció «Security and incidents» al readme (F0-19).
- **Bot:**
  - lockfile i una baileys estable;
  - separar instruccions de dades a `cervell.mjs`;
  - sal a `hashJid`;
  - decidir on s'executa (FX-02, FX-05 i FX-07 del bot).
- **Domini:** DMARC amb `rua=` i després `quarantine`; CAA; `security.txt` i `SECURITY.md` (AX-D13, V-DOC-16).
- **Fi de vida:** Node 22 a `sdp_lock_ci.yml` i al `Dockerfile`; decidir la versió mínima de PHP del connector (V-ANA-15).

### E. Retroalimentació a les plantilles

La plantilla `prompt_local` (v3.4.0) es pot optimitzar en huit punts:

1. **Fonts web.** La instrucció manava llegir una URL, però el hook del repo bloqueja WebFetch i WebSearch («eina opaca»). L'article s'ha pogut llegir amb el navegador integrat, que el hook sí que deixa passar. La plantilla hauria de dir quin canal s'ha d'usar, o adjuntar el text.
2. **Rutes completes.** «`taxonomia_documental.md`» va sense ruta, i en aquesta sessió no hi ha Glob. La ruta és `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md`.
3. **Context desfasat.** El bloc fix parla de l'àlies preact/compat, però `package.json` no conté preact (ho ha detectat el crític). Cal corregir-ho a la plantilla, no a cada prompt.
4. **Abast extern.** El prompt no diu si es pot sondejar producció. Aquesta auditoria ho ha fet amb GET de lectura des del navegador integrat. Proposem un camp «Abast extern permès» (cap / lectura GET / prohibit).
5. **Preflight sense evidència.** Les caselles [x] no porten l'eixida de la porta Olivera. Proposem enganxar-hi el codi d'eixida i l'hora.
6. **Directiva suprema condicional.** La Llei de l'Enxufabilitat empeny cap a la Frontissa de Sollutia, que avui és inert. En una auditoria de seguretat convé que la directiva diga «si escau».
7. **Ruta d'auditoria de seguretat.** La plantilla `auditoria_canonica.md` està pensada per a auditar la Wiki (graf, portes documentals) i el seu paràgraf consultiu s'hereta dins de l'informe. El seu «Contracte d'informe» és excel·lent (evidència, gravetat justificada, proposta conservadora, decisió humana) i l'hem seguit. Proposem una ruta `auditoria.seguretat` amb eixe contracte i les seccions «Superfícies», «Troballes», «Decisions del Mestre» i «Literalitat evitada».
8. **Fatiga d'alarmes.** Durant tot el torn, `segell-auto` ha llançat un error bloquejant després de cada eina, per una divergència preexistent del segell de skills. Una alarma que sona sempre deixa de ser una alarma (B.2). No l'hem tocada.

### Annex: traçabilitat fila a fila

Estat i gravetat són els finals, després de la refutació. Abreviatures: AE = «Antes de empezar»; D# = «Diagnóstico»; P# = «Patrones de código»; M# = «No volver a pasar». Les evidències completes són als resultats dels workflows (vegeu Verificació).

#### Fase 0 · Abans de tocar res

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F0-01 | 1; AE dades | Registre de tractaments: Supabase, localStorage de l'amfitrió, bot, encarregats reals | parcial | alta | `02_saber/inventari_dades_personals.md`, un magatzem per fila |
| F0-02 | 2 | Plantilla de valoració de bretxa amb T0 i decisió raonada | absent | alta | Plantilla i ruta noves; registre de bretxes d'afegir només |
| F0-03 | 3 | Canal d'avís per col·lectiu (usuaris, pobles, bot, amfitrions) | absent | mitjana | Secció «Avís a les persones», amb models en dues llengües |
| F0-04 | 4; AE horari | Palanques de contenció graduals | absent | mitjana | Taula de palanques: efecte, abast, qui, tornada |
| F0-05 | AE hosting | Panells de producció i titulars | parcial | mitjana | Fixar l'amfitrió; inventari d'accessos privat |
| F0-06 | AE FTP, SSH | — | no aplica | — | Recordar-ho als operadors de WordPress |
| F0-07 | AE base de dades | Joc SQL T0 de només lectura | parcial | mitjana | Partir de `2610042350:52-64` i ampliar-lo |
| F0-08 | AE DNS, registrador | Dominis i subdominis de confiança (`auth.`, `*.`) | absent | alta | Registrador, bloqueig de transferència, 2FA, exportació de la zona |
| F0-09 | AE GSC, Bing | Propietats verificades | absent | baixa | Comprovar-les i anotar-les |
| F0-10 | AE correu | Workspace i SMTP d'Auth | parcial | baixa | Contrastar `legalContent.js:112` amb l'SMTP real |
| F0-11 | AE CDN | Caches: vora, `sw.js`, amfitrions | parcial | baixa | Purga per cache; `no-cache` per a `index.html` i `sw.js` |
| F0-12 | AE pagaments | — | no aplica | — | Reobrir-la si Bar o Gestoria arriben a producció |
| F0-13 | AE còpies | Còpies de BD, Storage, artefacte i repo | parcial | alta | Taula «Còpies» amb la data de l'última restauració |
| F0-14 | AE administrador propi | Superadmins, membres de Supabase, GitHub, les IAs | parcial | mitjana | Consulta de rols al T0; les IAs com a identitats |
| F0-15 | AE què i des de quan | Registre d'entrada d'incidents; `security.txt` | parcial | mitjana | T0 amb hora i font de l'avís |
| F0-16 | AE què s'ha tocat | Reconstruir què han executat les IAs | parcial | mitjana | Traça redactada de `run_command`; aturar els agents mentre hi haja un incident obert |
| F0-17 | AE equips | El Mac és l'equip de confiança i el més exposat | absent | alta | Inventari d'equips; rotar des d'un equip sense agents; denegar `.env*` |
| F0-18 | AE altres webs | Un sol projecte Supabase per a tots els amfitrions | parcial | mitjana | Registre manual d'amfitrions |
| F0-19 | 1, 2 | Connector: la fase 0 la fa l'operador de WordPress | absent | mitjana | Secció «Security and incidents» al readme; revocació de tokens |

#### Fase 1 · Contindre i guardar proves

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F1-05 | 5 | Foto externa datada de cada superfície | absent | mitjana | `foto-externa.mjs` de lectura, amb `--compara` |
| F1-06 | 6 | Captures datades, també des d'un telèfon real | absent | baixa | Llista fixa i sha256 al manifest d'evidències |
| F1-07 | 7 | Còpia íntegra i xifrada de l'estat compromés, per plans | parcial | mitjana | Protocol i skill d'incidents; excepció de retenció legal |
| F1-08 | 8 | Inventari únic de punts de recuperació | parcial | alta | `inventari_copies.md` i una eina de lectura |
| F1-09 | 9 | Decisió de restaurar o netejar, amb dates i pèrdues | parcial | mitjana | Reconciliar les dues `desenterrar.mjs`; plantilla d'incident |
| F1-10 | 10 | Cinc palanques d'aturada amb la tornada verificada | parcial | mitjana | «Aturada segura» per pla; desregistre del `sw.js` |
| F1-11 | 11 | Propietats i comptes compartits | absent | mitjana | Taula a l'inventari; `VEINS.md` amb les 12 carpetes |
| F1-12 | 12 | Canals d'eixida: correu d'Auth, bot, domini | parcial | mitjana | Secció «Eixida»; `rua=` al DMARC |
| F1-13 | 13 | Registres de proveïdors que caduquen | absent | alta | Taula de proveïdors; exportar ja els registres d'Auth i d'API |
| F1-14 | 14 | Tallar sessions en quatre plans | parcial | alta | «Tallar accessos»; rotar `secret.key`; desvincular WhatsApp |
| F1-15 | 15 | Configuració que només viu a producció | parcial | baixa | `configuracio_fora_del_repo.md`, amb noms i mai valors |

#### Fase 2 · Esbrinar què ha passat

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F2-01 | 16 | Refutar entre l'anàlisi i la sentència | parcial | baixa | Pas de refutació a `core-tecniques-investigacio` |
| F2-02 | 16, 22 | Capturar l'objecte estrany abans d'esborrar-lo | parcial | baixa | `pg_get_functiondef` abans d'aplicar `2610042350` |
| F2-03 | 17 | El vector del bolcat de `.env` continua obert | absent | alta | `SECRET_PATHS` a `mutation-policy.mjs` i a `antigravity-hook.mjs`; rotar DeepL |
| F2-04 | 17 | La via `force_ask` d'Antigravity escriu governança fora de l'executor | absent | mitjana | Plantilla d'incident; denegar-ho o resegellar en el mateix torn |
| F2-05 | 18 | Datar el primer canvi | parcial | mitjana | `segella.mjs` llista els fitxers afegits, modificats i eliminats |
| F2-06 | 18 | Historial de canvis de privilegis | parcial | baixa | `private.registre_privilegis` amb trigger (proposta) |
| F2-07 | 19 | Mapa de l'abast per superfícies | absent | mitjana | `mapa_abast_incidents.md` |
| F2-08 | 20 | Registres de Supabase i de l'allotjament | absent | mitjana | `registres_produccio.md`; per als 12 mesos, drenar els registres o corregir el text |
| F2-09 | 20 | Traça dels agents | parcial | mitjana | `conversationId` i ordre redactada; `claude-hook.log` |
| F2-10 | 21 | Patrons de Tellado sobre el PHP del connector | parcial | baixa | `tests/enxufe-patrons.test.mjs`; escaneig a `empaqueta.mjs` |
| F2-11 | 21 | Catàleg de patrons per a JS, SQL i persistència | parcial | mitjana | `escorcoll-patrons.mjs`; que R6 exigisca `search_path = ''` |
| F2-12 | 22 | El connector instal·lat contra el seu zip | parcial | baixa | Hash a `salut.php`; lockfile al manifest |
| F2-13 | 22 | L'esquema de producció contra les migracions | parcial | alta | Exportar l'esquema viu i fer-ne el diff amb una base local |
| F2-14 | 22 | `node_modules` contra el lockfile | parcial | baixa | sha256 del lockfile al manifest de release |
| F2-15 | 22 | Nucli de WordPress | no aplica | — | Recomanar `wp core verify-checksums` als amfitrions |

#### Fase 3 · Netejar els fitxers

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F3-01 | 23 | `npm ci` des del lockfile; el bot i Docker no en tenen | parcial | mitjana | Lockfile del bot, pnpm fixat, Node 22 a la CI |
| F3-02 | 24 | Redesplegar des d'un build net de la CI | parcial | mitjana | Document de desplegament; signar el canal |
| F3-03 | 25 | Retirar el que no té mantenidor | parcial | mitjana | Registre de peces retirades; quarantena amb ordre del Mestre |
| F3-04 | 26 | Objectes de producció que cap migració no definix | parcial | alta | `deriva-esquema`, de només lectura |
| F3-05 | 27 | Anotar el que es retira, amb ruta, empremta i motiu | parcial | mitjana | Registre de retirades; sha256 a `MANIFEST.json` |
| F3-06 | 28 | Pujades només de tipus inerts | parcial | baixa | `tractor-pujades.mjs`; prova dels tipus MIME |
| F3-07 | 29 | Inventari de la configuració oculta | parcial | mitjana | Inventari amb hash; porta que avise d'ocults nous |
| F3-08 | 30 | Carregadors invisibles: Vite, scripts, hooks, `sw.js` | parcial | mitjana | `.agents/carregadors.json` i una porta |
| F3-09 | 31, 47 | Els secrets contra una mostra neta | parcial | mitjana | Rotar DeepL; `tractor-env.mjs` per noms; `config.toml` |
| F3-10 | 32 | Persistència de launchd i dels hooks | parcial | baixa | Comparar els plists amb la font declarada |
| F3-11 | 23-31 | El connector en un WordPress infectat | parcial | baixa | Secció «WordPress infectat» al readme |

#### Fase 4 · Netejar la base de dades

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F4-01 | 33 | Còpia de treball abans de tocar la BD | absent | alta | Pas 0 al README de Supabase |
| F4-02 | 34 | Contingut injectat en camps rics | parcial | baixa | Inventari de només lectura i revisió per id |
| F4-03 | 35 | Configuració persistent i Auth (Redirect URLs com a `siteurl`) | parcial | mitjana | Línia base canònica de les Redirect URLs |
| F4-04 | 36 | Cron, disparadors, webhooks, edge functions | parcial | mitjana | Inventari de només lectura; declarar els treballs de `pg_cron` |
| F4-05 | 37 | Privilegis i camins cap al privilegi | parcial | mitjana | Inventari de rols; llista esperada de superadmins |
| F4-06 | 38 | Entitats públiques amb enllaços | parcial | mitjana | Consulta de les organitzacions públiques; decidir si cal revisió prèvia |
| F4-07 | 39 | Spam sense moderació | absent | mitjana | No aplicar `2609282100` sense les RPC de moderació |
| F4-08 | 40 | Caches que reinjecten (`sw.js`, IndexedDB, transients) | parcial | baixa | Promoure `FASE0_PWA.txt` a protocol; `sw.js` de retirada preparat |
| F4-09 | 41 | Taules òrfenes heretades | parcial | mitjana | Inventari amb `relrowsecurity` i grants |
| F4-10 | 42 | Canvi de prefix | no aplica | — | Regla de `tractor-rls` per als `execute` amb concatenació |
| F4-11 | 35-42 | El connector dins de la BD de WordPress | existeix | baixa | Pas d'incident al readme; buidar la memòria cau d'objectes |

#### Fase 5 · Tancar la porta

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F5-01 | 43 | Revocació massiva de sessions i rotació de la clau JWT | parcial | mitjana | Runbook; claus asimètriques |
| F5-02 | 43 | Les salts de WordPress no tanquen les sessions de Sóc de Poble | absent | baixa | Secció al readme del connector |
| F5-03 | 44 | Inventari de comptes privilegiats | absent | mitjana | Inventari sense valors |
| F5-04 | 45 | Rotar la contrasenya de `postgres` | absent | mitjana | Afegir-la al runbook; revisar abans qui en depén |
| F5-05 | 46 | Canals de publicació | absent | mitjana | Inventari amb titular i 2FA; custòdia de la clau Ed25519 |
| F5-06 | 47 | La clau de DeepL bolcada | parcial | mitjana | Rotar-la i tancar `LEDGER.md:837` |
| F5-07 | 47 | Inventari de secrets | parcial | alta | `inventari_secrets.md`; porta sobre l'índex de git |
| F5-08 | 48 | MFA TOTP i `aal2` a `es_superadmin` | absent | alta | Ara, 2FA als proveïdors; `aal2` quan existisca la pantalla d'alta |
| F5-09 | 49 | `DISALLOW_FILE_EDIT` als amfitrions | absent | baixa | Nota «Hardening» al readme |
| F5-10 | 49, 50 | Què pot modificar un agent compromés | parcial | alta | Tancar les escapatòries; llista de denegació; llista blanca a Antigravity |
| F5-11 | 50 | Permisos mínims | parcial | baixa | `chmod 600` a `.env`; revocar l'escriptura d'`app_content` |
| F5-12 | 51 | Tot al dia | parcial | mitjana | Node 22; dependabot o auditoria; canal signat |
| F5-13 | 52 | Components sense manteniment | parcial | mitjana | Una baileys estable; retirar whatsapp-web.js |
| F5-14 | 53 | Vigilant de canvis i de vulnerabilitats | parcial | alta | Hash a `salut.php`; comparador de bundles servits; hash de `pg_policies` |
| F5-15 | 54 | Restauració provada | absent | alta | Simulacre trimestral |
| F5-16 | 55 | Revocar els accessos sobrers | absent | baixa | Revisió trimestral; `v2.sollutia.com` i `localhost` a la CSP |

#### Fase 6 · Comprovar que està neta

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F6-01 | 56 | Foto externa repetible | absent | mitjana | `foto_externa.md` amb una llista tancada |
| F6-02 | 56, 57 | Instrument sencer, no fins a la primera roja | parcial | mitjana | Mode d'informe complet de `run-portes.mjs` |
| F6-03 | 57 | Segona passada de patrons | parcial | baixa | Prova de la fulla 6 sobre els PHP |
| F6-04 | 58 | Captures d'abans i després (Llei del Píxel) | parcial | baixa | Vistes de referència fixes |
| F6-05 | 59 | Revisita de 72 hores | absent | alta | Camp de revisita a la plantilla; que `despertar.mjs` les mostre |
| F6-06 | 60 | Retirar els interruptors i les restes | parcial | baixa | Comprovació post-desplegament; avís dels `.off` |
| F6-07 | 61 | Restaurar el codi propi i verificar-lo | parcial | mitjana | `codi_propi_a_restaurar.md` |

#### Fase 7 · Recuperar la reputació

| ID | Files | Equivalent a Sóc de Poble | Estat | Gravetat | Proposta |
| --- | --- | --- | --- | --- | --- |
| F7-01 | 62 | Revisió de tercers només amb la neteja verificada | parcial | baixa | Fixar l'amfitrió; protocol de reputació |
| F7-02 | 64 | Bing Webmaster Tools | absent | baixa | Preguntar primer si ja n'hi ha propietat |
| F7-03 | 65-70, 77 | Escàners amb la mateixa vara | absent | mitjana | `foto-externa.mjs` |
| F7-04 | 71 | Retirada motor a motor | parcial | baixa | Annex de canals adaptat de la fulla 5 |
| F7-05 | 72 | Cap reclamació amb l'emissor actiu | parcial | baixa | Inventari d'emissors |
| F7-06 | 73 | 404 i 410 reals | absent | mitjana | Quan hi haja desplegament versionat: 404 real i 410 per a les retirades |
| F7-07 | 73, 76 | Publicar no és arxivar | absent | mitjana | Llista de sensibles; corregir `readme.txt:31` |
| F7-08 | 74 | Proveïdors i tiquet concret | absent | baixa | Inventari de proveïdors; clàusula d'incidents amb Sollutia |
| F7-09 | 75 | Passarel·la de pagament | no aplica | — | — |
| F7-10 | 74, 75 | Avís escrit als amfitrions | parcial | mitjana | `security.txt`; registre d'amfitrions; `stable.json` signat |
| F7-11 | 63 | Tancament datat i comunicat | absent | mitjana | Registre d'incident, aplicat de seguida a `LEDGER.md:837` |

#### Fulles annexes

| ID | Origen | Estat | Gravetat | Nota |
| --- | --- | --- | --- | --- |
| AX-D01 | D1-3 cloaking | parcial | baixa | El codi no bifurca per user-agent; falta la sonda des de fora |
| AX-D02 | D4 redireccions | parcial | baixa | El relé retirat `public/auth/callback.html` redirigix a hosts de Sollutia |
| AX-D03 | D5 codi codificat | parcial | baixa | La CSP pròpia bloqueja `eval`; als amfitrions no hi és |
| AX-D04 | D6 scripts de tercers | parcial | baixa | El repo és net; producció (extern) servix pàgines heretades amb `unpkg.com/lucide@latest` |
| AX-D05 | D7, P20 iframes | parcial | baixa | El mapa del Mur no té `sandbox`; `frame-src` admet qualsevol https |
| AX-D06 | D8-9 spam injectat | parcial | baixa | Lectura limitada a membres; `/cerca` és noindex |
| AX-D07 | D10-11 sitemap, títol | parcial | baixa | `build-seo-manifest.mjs` llig en silenci un fitxer que no existix |
| AX-D08 | D12 fitxers solts | parcial | baixa | `sp-identity-components.js` és JS mort amb dades d'una persona real |
| AX-D09 | D13 pujades | existeix | baixa | Ho contradiu storage-FX-01: el bucket públic es pot llistar |
| AX-D10 | D14 reinstal·lar | existeix | baixa | No hi ha cap escriptor de `user_platform_roles`; vegeu F4-05 per a la pertinença |
| AX-D11 | D15-18 fitxers exposats | parcial | mitjana | Dev server a `0.0.0.0` sense `supabase/.temp`, `var/` ni `scratch/` a la llista negra |
| AX-D12 | D19 clons | absent | mitjana | No hi ha inventari de superfícies; el build de juny és en línia |
| AX-D13 | D20-22 MX, SPF, DMARC | absent | mitjana | Extern: `p=none`; cap declaració al repo |
| AX-D14 | D23 crt.sh | absent | baixa | Hi ha un comodí `*.socdepoble.org`; `frame-ancestors` amb comodins |
| AX-D15 | D24 capçaleres | parcial | mitjana | Dues CSP divergents al repo; cap a producció |
| AX-D16 | D25 certificat | absent | baixa | No hi ha comprovació d'emissor ni de caducitat |
| AX-D17 | D26 versió | no aplica | — | No hi ha servidor propi |
| AX-D18 | D27 llistes negres | parcial | baixa | El canal amb reputació és el número de WhatsApp |
| AX-P01 | P1-6, 18 eval | parcial | baixa | Cap `eval` en producció; vetar-lo per prova i amb ESLint |
| AX-P02 | P7-9 shell | existeix | baixa | L'endpoint `/traduir` valida amb llista blanca |
| AX-P03 | P10 shells | parcial | baixa | Inventari del directori instal·lat contra `sdp-inventari.json` |
| AX-P04 | P11-13 ofuscació | parcial | baixa | Unificar les tres còpies del veto d'invisibles i aplicar-lo a les skills |
| AX-P05 | P14-15 sortides | parcial | baixa | Cens de `fetch` al nucli, com fa `fronteres.test.js` |
| AX-P06 | P16-17 crear admins | parcial | baixa | Cens de sentències privilegiades; decidir la confiança en els JWT de Sollutia |
| AX-P07 | P20, innerHTML | parcial | baixa | `tractor-innerhtml` és roja latent i no mira `public/` |
| AX-P08 | postMessage `*` | existeix | baixa | La Porta Frontera Auth ix amb 0 sense comprovar res |
| AX-P09 | SECURITY DEFINER | parcial | baixa | R6 no mira el valor; `pot_signar_com_organitzacio` usa `public` |
| AX-P10 | service_role | existeix | baixa | `validatePublicCredentials` i la LLEI 9 |
| AX-P11 | excepcions | parcial | baixa | Un registre d'excepcions amb motiu, empremta i aprovador |
| AX-M01 | M1 doble factor | absent | alta | Igual que F5-08 |
| AX-M02 | M2 accessos | parcial | mitjana | Rols definits; falten titulars i revisió |
| AX-M03 | M3 contrasenyes | parcial | mitjana | `docker.env` indexat; una contrasenya local en una acta |
| AX-M04 | M4 actualitzacions | parcial | alta | Bot sense lockfile, Docker sobre Node 20, cap auditoria |
| AX-M05 | M5 còpies 3-2-1 | parcial | alta | Igual que F5-15 |
| AX-M06 | M6 nulled | parcial | mitjana | Criteris de seguretat per a importar skills; canal Ed25519 sense clau |
| AX-M07 | M7 equips nets | parcial | alta | Igual que F0-17 i F2-03 |
| AX-M08 | M8 aïllament | parcial | mitjana | El Web Component compartix context amb l'amfitrió |
| AX-M09 | M9 tallafocs | parcial | baixa | Límits d'Auth sense versionar; límit propi al xat |
| AX-M10 | M10 vigilància | parcial | alta | Igual que F5-14 |
| AX-F01 | seguiment | parcial | mitjana | Ruta `incident.seguretat` |
| AX-F02 | ordre | parcial | mitjana | Dependències d'ordre a la plantilla |
| AX-F03 | risc per pas | parcial | baixa | Etiqueta de risc per migració; còpia prèvia al README |
| AX-F04 | aplica si | parcial | baixa | Camp `aplica_si` al catàleg |
| AX-F05 | netejar no és arreglar | parcial | alta | Camps obligatoris «porta d'entrada» i «classe» |
| AX-F06 | 72 hores | parcial | mitjana | Plaquetes comparat amb el tancament; `revisarAt` |
| AX-F07 | disparadors | parcial | mitjana | Escriure els tres disparadors a la Wiki |
| AX-F08 | catàleg únic | parcial | baixa | `tooling/seguretat/cataleg.json` |
| AX-F09 | mateixa vara | absent | baixa | Foto externa a l'inici i al final de cada incident |

#### Forats que va assenyalar el crític

| ID | Àrea | Estat | Gravetat | Nota |
| --- | --- | --- | --- | --- |
| supabase-heretat/FX-01 | Inventari del catàleg viu | absent | alta | La producció és el projecte heretat |
| supabase-heretat/FX-02 | Taules antigues sense RLS | absent | alta | Condicionada a una prova de lectura anònima: si torna 401/403, baixa |
| supabase-heretat/FX-03 | Edge functions i RPC sense font | absent | alta | Inventariar-les al panell; `backup-sobirania` és còpia única o canal d'exfiltració |
| supabase-heretat/FX-04 | Exportació i purga incompletes | parcial | mitjana | Taules antigues fora de l'exportació; la cua de Storage no té consumidor |
| supabase-heretat/FX-05 | Polítiques antigues amb un altre nom | parcial | alta | `create table if not exists` amb polítiques que se sumen |
| plans-control/FX-01 | Sessions de CLI al Mac | absent | mitjana | Ho ha de comprovar el Mestre |
| plans-control/FX-02 | Antigravity deixa passar les CLI de desplegament | parcial | alta | `forceAsk` per a firebase, gcloud, supabase, vercel, gh, `git push` |
| plans-control/FX-03 | Amfitrió de producció no documentat | parcial | mitjana | Runbook de desplegament |
| plans-control/FX-04 | `.agents/rules/firebase_hosting.md` silencia l'error del desplegament | parcial | baixa | Cap desplegament sense ordre del Mestre en el torn |
| plans-control/FX-05 | Token de la CLI de Supabase | parcial | baixa | Traces només locals |
| plans-control/FX-06 | Consoles obertes al navegador dels agents | absent | mitjana | Un perfil de navegador separat per a les consoles |
| fuita-FX-01 | `perfil_psiquiatric` com a dada de l'art. 9 | refutat | cap | És el perfil de la IA |
| fuita-FX-02 | Fronteres sense llista de sensibles compartida | parcial | mitjana | Una llista `SENSIBLES` única |
| fuita-FX-03 | Còpies distribuïdes dels índexs | absent | baixa | Taula de còpies; versió nova només amb FX-02 decidit |
| fuita-FX-04 | Archive.org i Common Crawl | absent | baixa | Consultar el CDX i datar-ho |
| fuita-FX-05 | El bot llig la Wiki sense frontera | absent | baixa | Latent; `readPublicWikiFile` si es reactiva |
| storage-FX-01 | Llistat anònim de `mitjans` | absent | alta | SELECT només per a `authenticated` i a la ruta pròpia |
| storage-FX-02 | Un drop d'una política inexistent | absent | mitjana | Nota al README; regla de `tractor-rls` per als drops fantasma |
| storage-FX-03 | Adjunts privats veïnals | parcial | alta | Comprovar `pg_policies`; aplicar el blindatge després de FX-08 |
| storage-FX-04 | Publicar és irreversible | absent | mitjana | Mètode d'esborrat al port |
| storage-FX-05 | Promesa d'esborrat sense executor | parcial | mitjana | Crear la peça amb service_role o matisar el text |
| storage-FX-06 | Quatre definicions de propietat | parcial | baixa | Una funció única de propietat |
| storage-FX-07 | Porta que llig text, no frontera | absent | mitjana | Fixture de frontera contra un motor real |
| storage-FX-08 | El blindatge amagaria publicacions antigues | absent | mitjana | Censar abans `sdp-media://mitjans_privats/` |
| FX-01/bot | Frontera de publicació a `cervell.mjs` | absent | baixa | `readPublicWikiFile` |
| FX-02/bot | Injecció via `systemInstruction` | absent | mitjana | Separar instruccions de dades |
| FX-03/bot | Memòria que reinjecta | absent | baixa | Validar-la amb esquema; «IAIA, oblida'm» |
| FX-04/bot | Llista d'accés amb `@lid` | parcial | baixa | Prova de `#directIsAllowed` |
| FX-05/bot | Mèdia a Gemini sense base | absent | mitjana | Sal a `hashJid`; fitxa de tractament |
| FX-06/bot | Dades al disc sense caducitat real | parcial | mitjana | Endollar `programaPurgaPeriodica` |
| FX-07/bot | On s'executa el bot | absent | mitjana | Revisar els dispositius enllaçats; ADR d'aturada |
| FX-08/bot | Cap prova ni lint cobrix `bot/` | absent | baixa | Prova estàtica del contracte de l'índex |
| FX-01/realtime | Credencials amb vides diferents | parcial | mitjana | Secció «Tallar sessions»; reduir `exp` |
| FX-02/realtime | Canals que recorden l'autorització | parcial | baixa | Cas de prova en tornar-se a unir |
| FX-03/realtime | Foto de Realtime al sistema viu | absent | mitjana | `realtime_estat.sql` |
| FX-04/realtime | Disparadors que poden traure dades | parcial | baixa | Llista blanca de `realtime.send` i `net.http_*` |
| FX-05/realtime | `tancaRealtime()` no actua mai | parcial | baixa | Capturar el client anterior abans de `resetClient()` |
| FX-06/realtime | Interruptor de Realtime | parcial | baixa | Línies de contenció i de tornada al README |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Mètode.** La caça i la refutació han anat en dues fases separades (vegeu la memòria del projecte sobre refutació adversarial).

| Workflow | Agents | Tokens dels subagents | Què ha fet |
| --- | --- | --- | --- |
| Extrapolació de la checklist | 204 | 26,1 M | 7 cartògrafs (un de des de fora), 9 lents, 181 refutacions, un crític de completesa i 6 forats |
| Digestió de l'extrapolació | 13 | 2,0 M | Fusió de cada troballa amb el seu veredicte |
| Vigilante | 77 | 17,6 M | 14 lectors del PHP sencer, 14 traductors, 14 escèptics i 35 lots de verificació de plataforma |
| Digestió de Vigilante | 15 | 2,5 M | Fusió per mòdul i recompte de plataforma |

**Resultat de la refutació:**

- Extrapolació: 181 veredictes, dels quals 166 han corregit la troballa, 14 l'han confirmada i 1 l'ha refutada.
- Vigilante: les lectures del PHP s'han trobat quasi totes certes, amb matisos documentats a cada mòdul.
- Plataforma: de les 514 afirmacions, 388 són certes, 109 parcials, 5 falses i 12 no verificables.

**Comprovacions fetes pel coordinador,** llegint el fitxer:

- `_wiki_de_poble/02_saber/perfil_psiquiatric.md:1-30`: descriu la IA, no cap persona. Retira la suposada bretxa de l'art. 9.
- `supabase/migrations/2609130500_bucket_mitjans.sql:16-18`: SELECT per a anon sobre tot el bucket.
- `supabase/migrations/2609261500_identitat_perfil_f1.sql:855-893`: alta d'autoservei a qualsevol poble obert.
- `supabase/migrations/2609080000_initial_schema.sql:279-288`: `es_superadmin()` sense `aal`.
- `tooling/gates/antigravity-hook.mjs:330`: `return ALLOW` al final de `preShell`.
- `src/data/supabase/auth.js:848-866`: `tanca()` esborra la sessió local abans de revocar, i `tancaRealtime()` va després de `resetClient()`.

**Fonts llegides senceres:**

- el CSV de `01_produccio/`;
- l'article d'AyudaWP, amb el navegador integrat;
- el prompt i el pla del disc;
- `AGENTS.md`, `02_genotip.md`, `00_index.md` i `taxonomia_documental.md`;
- la plantilla d'auditoria, amb el seu rebut.

**Sonda externa.** Feta el 2026-10-06 només amb GET, des d'una pestanya pròpia del navegador integrat, contra `socdepoble.org`, `dns.google` i `crt.sh`. No s'ha omplit cap formulari ni s'ha iniciat cap sessió.

**Efectes.** No s'ha modificat cap fitxer fora d'este document: ni codi, ni migracions, ni governança.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Producció.** No hem tocat la base de producció. Tot el que es diu del Supabase viu és inferència del repo (migracions que ho admeten) o de la sonda externa; ho confirmaran les consultes de D.1-4.
- **Allotjament.** Que producció siga Firebase ho diuen la sonda externa (TXT `hosting-site`, registre A, capçalera `x-fh-requested-host`) i el mtime de `firebase-tools.json`. Els escèptics, que només tenien el repo, no ho podien verificar, i per això van rebaixar diverses troballes a «no verificable». No hem pogut provar `www.socdepoble.org`.
- **Pla.** Moltes conclusions de plataforma depenen del pla de Supabase, que no coneixem (C.14).
- **Eines.** El hook del repo bloqueja WebFetch i WebSearch: la documentació oficial i l'article s'han llegit amb el navegador integrat, i alguns comportaments de GoTrue s'han verificat al codi font de GitHub, no a la documentació. En esta sessió no hi havia Glob; els agents han treballat amb Read i grep.
- **Res executat.** No s'ha executat cap PHP de Vigilante, cap prova ni cap flux contra producció. Les afirmacions sobre el comportament en execució són lectura de codi.
- **Equip local.** El crític va mirar noms, modes i dates de fitxers de `~/.config` sense llegir-ne el contingut. El classificador va denegar llistar `~/.supabase/traces`, i no s'hi ha insistit.
- **Abast de la revisió.** El coordinador no ha revisat a mà les 180 troballes de l'extrapolació ni les 242 traduccions de Vigilante. S'han fusionat amb els seus veredictes per agents de digestió, i n'he comprovat personalment sis (Verificació). La memòria del projecte recorda que prop d'un 27 % de les troballes d'agents són falses; per això cada troballa porta el veredicte del seu escèptic.
- **Evidència volàtil.** Els resultats complets en JSON (uns 5 MB) són al directori temporal de la sessió, fora del repo, i es perdran. Si el Mestre els vol conservar, moure'ls al laboratori és acció de MarIA o del Mestre.
- **Governança no actualitzada.** No he actualitzat ni `.agents/ESTAT.md` ni el LEDGER: `.agents/` és una ruta de governança que requerix executor i lease. Tampoc no he tocat el segell divergent.
- **Llicència.** Vigilante és GPL v2 o posterior, i els mecanismes s'han descrit amb paraules pròpies. Portar-ne codi és possible amb atribució (C, introducció).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
