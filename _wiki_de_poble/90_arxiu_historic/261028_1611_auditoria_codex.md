---
type: informe
status: esborrany
description: 'Revisió de QA de cd3b5b56c i addenda GM2-09 d’arquitectura E2EE: contractes SQL, claus, recuperació, concurrència i cicle de sessió.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_35e0f345-7551-4fe0-9922-970c51102f48:15260164-5b33-441d-a7b7-b81626242e4a
---

# Informe tècnic de QA de cd3b5b56c i del Bloc H

**Actualització v2.1.0:** afegida la revisió d’arquitectura E2EE de GM2-09 a Troballes. La revisió A–H de v2.0.0 conserva el tall de les 20:46; esta addenda no reaudita els canvis posteriors del Bloc H.

**Dictamen de QA: conformitat parcial; acceptació global pendent.** El commit incorpora el prerender estàtic, la purga de les 10 imatges d'identitat, la recuperació de la vista de comunitat i el mapa fotogràfic. Queden confirmades una omissió del prerender per a publicacions remotes, un error del centre cartogràfic a l'antimeridià i la manca de cancel·lació d'una lectura de compartició. P1-66, P1-67, P1-68 i P1-69 encara no tenen implementació nova en el tall revisat. El resultat complet de proves i les limitacions figuren en Verificació.

Base revisada: **`cd3b5b56cb7711deb57ff054e1c63ceaf92dee62`**, branca `backup-notes-publish`, 223 fitxers canviats respecte del pare, +16.906/−769 línies. L'abast d'escriptura viva és exclusivament este informe; no s'ha corregit codi, aplicat SQL, generat cap build viu ni modificat el Git del repositori viu.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_35e0f345-7551-4fe0-9922-970c51102f48:15260164-5b33-441d-a7b7-b81626242e4a |
| Versió del document | 2.1.0 |
| Entorn | entorn-dev-local; proves en còpia temporal aïllada |
| Creació | 2026-10-28T15:12:12.897Z |
| Modificació | 2026-10-28T20:35:36.066234+00:00 |
| Propietari | codex |
| Aprovació humana | Encàrrec explícit de revisió de QA en només lectura i actualització d'este informe, 2026-10-28 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 Codex i tres subagents amb el model heretat |
| Tokens consumits | Comptador exacte no disponible; no s'estima |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla canònica viva i ruta `auditoria` de `.agents/protocolledge.json` llegides abans d'actualitzar el document. SHA-256 de la plantilla: `855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf`. Es conserva el rebut existent del mateix informe. No s'ha obert un torn viu nou ni reescrit cap registre administratiu, d'acord amb l'encàrrec de només lectura i la frontera d'escriptura exclusiva de l'informe.

Llegits el prompt 1526 complet, el pla 1526 complet, l'informe Claude 1620 complet i el relleu Claude 2020 complet; contrastats AGENTS, Genotip, índex, taxonomia i les fitxes rellevants del Llibre Mestre. Aplicats els procediments locals `sdp-workflow`, `wiki-documentacio-i-reflex` i `core-seguretat-audit` en el seu vessant de revisió de contractes, privacitat i proves unitàries. Esta ronda revisa el codi font; no incorpora noves anàlisis de binaris d'aplicacions de tercers ni una nova investigació web d'Emowe.

La revisió s'ha repartit entre OpenGraph/WordPress/serveis, mapa/GPS/recuperació i compartició/Bloc H. El coordinador ha contrastat les troballes i els resultats. La còpia de proves conté 5.666 fitxers seguits per Git, amb SHA-256 de cada font; dependències existents en lectura i memòria cau Vite pròpia de l'arrel temporal. S'han exclòs `.env` i `.env.*` de la còpia inicial; les fixtures explícites `.env.example` i `.claude/settings.json` s'han incorporat després de detectar la seua absència.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- Versions 1.0–1.2: revisió anterior sobre `3dbdecb16`, amb captures limitades de pegats en curs. Aquell dictamen descrivia una implementació anterior a `cd3b5b56c`.
- Versió 2.0.0, 2026-10-28: reauditoria de QA del commit final A–G i de l'estat observable de P1-66–69. Se substituïx el diagnòstic vigent anterior; no es mantenen com a defectes actuals el GPS ja purgat, l'absència total de prerender o l'absència del mapa.
- El relleu Claude 2020 comunica reconeixement del Bloc H i deixa Verificació pendent; no és evidència d'implementació ni de proves del Bloc H.

- Versió 2.1.0, 2026-10-28: revisió de GM2-09 contra els quatre mòduls de xat, SQL i cicle de claus; només s’edita este informe.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

La severitat P1 indica una funció principal incompleta; P2, un defecte funcional delimitat. «Pendent» indica treball encara no implementat o una garantia no acreditada. No equival automàticament a una regressió introduïda pel commit.

### QA-01 · P1 · El prerender no incorpora les publicacions remotes · P1-61

**Fonts:** `tooling/seo/prerender-social.mjs:165` i `:276`; `tooling/seo/build-social-manifest.mjs:307–327`; `firebase.json:12–18`.

El constructor de manifest admet `publicSnapshot`, però el prerender el torna a construir sense passar-li esta projecció i la seua CLI no admet `--snapshot`. La cadena `build:social` genera pàgines, Wiki i llavors del repositori; no integra les publicacions públiques noves del backend.

**Prova funcional sintètica:** el manifest base té 111 rutes i cap detall `/mur/*`; afegir una publicació pública sintètica a `buildSocialManifest` en produïx 112. Passar la mateixa projecció com a propietat addicional, no admesa per la signatura del prerender, continua donant 111 rutes i 8 àlies, sense HTML del detall nou. Firebase té un retorn general a `/index.html`, sense handler social desplegat en esta configuració. Per tant no es pot donar per coberta la primera imatge i el títol de qualsevol publicació remota per a rastrejadors sense JavaScript.

**Correcció proposada:** connectar una projecció pública explícita, obtinguda pel contracte neutral, al prerender, o integrar el handler corresponent al desplegament. Afegir una prova de regressió amb una publicació que no siga una llavor. Cal triar també com s'actualitza o retira l'HTML quan canvia la publicació; `requires_human_decision: true` per a l'estratègia de publicació, no per a continuar esta revisió.

Evidència: `/tmp/sdp-seo-qa-functional.mjs` i `/tmp/sdp-seo-qa-functional.json`. És una omissió funcional comprovada; no invalida els 111 HTML estàtics que sí es generen.

### QA-02 · P2 · Centre de grup incorrecte a l'antimeridià · P1-64

**Font:** `src/sections/mur/mapaFotografic.js:334–345`.

`centreDelGrup` usa mitjana aritmètica de longituds. Dos punts sintètics a 5° de latitud i ±179,8° de longitud estan separats uns 44 km, però el centre calculat és a longitud 0°, uns 18.903 km lluny del grup. El comentari exclou el Pacífic per limitar-se a Europa; el requeriment i el component declaren Poble/Món.

**Prova unitària de regressió nova:** quatre casos passen i el cas de centre proper als punts falla. **Correcció proposada:** centre esfèric o mitjana circular de longituds, amb un criteri per als casos antipodals i una prova unitària d'antimeridià. `requires_human_decision: false` per a corregir este incompliment de l'abast mundial.

Evidència: `/tmp/sdp-qa-map-gps-261028/map-gps-regression.test.mjs` i el seu log. Esta fallada nova de QA es compta separada de les suites existents.

### QA-03 · P2 · La lectura antiga pot bloquejar la cua de compartició · C28-02 / P1-31

**Font:** `src/natiu/compartirNatiu.js:45`, `:89–93` i `:128–135`.

La comprovació d'època evita lliurar un lot antic després de cada espera, però `llegix(url)` no rep `AbortSignal` i la cua serial espera que resolga. En una prova unitària amb promesa controlada: entra una foto, canvia la sessió, arriba un lot nou només de text i este queda pendent fins que acaba la lectura anterior. Quan es resol, el lot vell es descarta, se n'allibera la còpia i es lliura el nou.

**Conclusió:** l'aïllament en esta seqüència està verificat; la cancel·lació i la continuïtat de la cua encara no. No s'ha reproduït una fuga entre persones en esta ronda. **Correcció proposada:** cancel·lar la lectura en canviar l'àmbit, propagar el senyal a `fetch` i al consum del cos i garantir que la cua pot continuar encara que el lector antic no coopere. Provar el canvi de persona i de backend, mantenint la transició inicial sense sessió → sessió. `requires_human_decision: false`.

Evidència: `/tmp/sdp-share-qa-261028/share-regression.test.mjs`, una prova de caracterització aprovada; passar esta prova significa haver reproduït el residual, no haver-lo corregit.

### QA-04 · P2 · Android conserva consultes al proveïdor fora del termini · C28-07 / P1-33

**Font:** `android/app/src/main/java/org/socdepoble/app/CompartirNatiuPlugin.java:341`, `:394` i `:505`.

`resolver.getType(uri)` es crida fora d'`ambTermini`; la consulta del nom visible també es fa després de cancel·lar el termini de còpia. El pressupost de 60 MiB, `Locale.ROOT`, l'època persistent i `shutdownNow()` sí són al codi. L'afirmació «cap lectura sense termini» de Claude 1620 s'ha d'acotar: no inclou totes les crides al proveïdor de contingut.

**Correcció proposada:** incloure identificació MIME i nom dins del pressupost temporal complet, amb una prova del proveïdor que no respon. `requires_human_decision: false` per al contracte; no s'ha executat Android en dispositiu ni una prova de Binder real. Residual ja reconegut en l'informe d'implementació.

### Garanties verificades i límits dels Blocs A–G

| Bloc / requeriment | Resultat de QA sobre el tall |
| --- | --- |
| A · OG-7, 10 imatges personals | Lector de producció: GPS absent en 10/10. Payload JPEG i chunks de píxels WebP idèntics als del commit pare en 10/10: purga sense recodificar. Guarda del repositori amb llista blanca explícita de 8 fotos patrimonials. No s'han exposat coordenades personals. |
| A/G · Pujada d'identitat i publicacions | Rols d'identitat amb purga obligatòria i avís condicionat a presència de GPS; Hero/cos amb consentiment, precisió i sanejadors. Les proves unitàries no acrediten neteja de còpies ja pujades a Storage, CDN o builds antics. |
| A · OpenGraph estàtic, client i Wiki | Manifest/prerender de 111 rutes i 8 àlies; ruta `/wikidepoble/<id>`, estat SEO amb `item` i marca SSR presents. Les proves HTTP existents usen `createSocialHandler` d'Edge: no certifiquen Firebase Hosting ni el desplegament. QA-01 delimita la cobertura de publicacions remotes. |
| B · P1-60 / P1-63 | Verificador editorial `valid:true`, `errors:[]`: projecte 20/20, disseny 5/5, anima 26/26, descarregues 11/11; total 62/62 en l'abast dels quatre textos. No extrapolar-ho a tot PAGE_COPY. |
| C · P1-55 / P1-58 | `lazyRouteRenovable` i boundary per comunitat, amb rebuig real del carregador a les proves; slot `despresAutoria` i ordre Capçalera → Avatar → Logotip. No s'ha certificat visualment l'encaix a totes les amplàries. |
| C · P1-57 | Logotip del pilot encara amagat per decisió consignada de Claude 1620. No es reobri com a regressió; l'enquadrament no destructiu complet necessita el seu contracte i migració. |
| D · P1-31–34 | Època, descart tardà i reserva recuperable presents; QA-03 i QA-04 encara obertes. iOS rebutja fileURL, però no té paritat de `tallaSessio` persistent amb Android; reinici/canvi de persona en dispositiu pendent de provar. |
| E · P1-35–37 / P1-16 | Versió i segell de build, filtres del xat, tokens de botó i contrast de taules amb proves; verificació renderitzada de tipografia i geometria pendent. Els 16 px i l'eix wdth de P1-67 encara no estan implementats. |
| F · P1-07 / P1-18 | Guarda DNS i escàner de notícies preservats. Apple incorpora lector de 4.096 bytes d'entrada i 256 KiB per resposta Supabase, amb termini durant el cos. Purga-fitxers manté el termini, però `r.json()` continua sense lector fitat per bytes: no atribuir-li eixa garantia. |
| F · P1-13 | Migració amb pany transaccional, UPSERT guardat i columna pública condicionada a opt-in. Proves de contracte SQL estàtiques; no s'han executat dues sessions PostgreSQL ni aplicat la migració. La carrera de revocació del rol de qui crida ja es declara residual al SQL. |
| F · WordPress / P1-09 / P1-22 | Cap PDO/mysqli observat. Hi ha SQL preparat via API oficial `$wpdb` preexistent, a `includes/traduccio.php` i `uninstall.php`. Idioma amb hooks i escapament WP. Regressions dirigides 83/83; no és una certificació d'una instal·lació WordPress completa ni de la versió PHP de producció. |
| G · P1-64 mapa | Leaflet 1.9.4 sota demanda, fons de tessel·les desactivat inicialment i retorn amb consentiment al mapa anterior. El nucli ja limita matriu i agrega punts: mesura sintètica 400/1.000/1.500 punts, 8/25/49 ms, sense extrapolar a navegador. QA-02 oberta. |

### Bloc H · P1-66, P1-67, P1-68 i P1-69

**Estat: pendents d'implementació en el tall revisat.** El relleu de Claude 2020 és coherent amb el codi: reconeixement i preparació fora de l'arbre. La suite actual pot passar preservant el comportament anterior; això no valida l'acceptació de funcionalitats encara absents.

| Punt | Evidència de l'estat actual | Proves d'acceptació necessàries quan aterre |
| --- | --- | --- |
| P1-66 · Compositor | `ControlsAdjunt.jsx:321,350–351` conserva quota permanent i dos botons; `Compositor.jsx:514–520` conserva Send. | Una barra, menú d'adjunts, retorn de focus, Escape, navegació amb teclat i Mic/Send segons text/adjunt; gravació, cancel·lació i reserva de compartició sense pèrdua en StrictMode. |
| P1-67 · Tipografia | `modules.css:3469`, herència de font; `public/fonts/noto-sans.css:19–33`, fonts sense el nou wdth; fitxer variable i OFL requerits absents. | Càrrega local sense errors, font amb eix wdth, mida computada 16 px i amplada 87,5% en navegació i xat; comprovació visual a mòbil i escriptori. Les proves de text CSS no ho certifiquen soles. |
| P1-68 · Username i poble | `auth.js:259` exclou username; `perfils.js:100` retorna slug null; `onboardingModel.js` sense proposaUsername; encara no hi ha la nova migració descrita al relleu. | Proves unitàries per a accents, ASCII, edició i noms buits; unicitat real amb dues sessions simultànies i sufixos; backfill genèric/idempotent; alta correu/OAuth i actualització amb poble i membres coherents en una transacció. Cap nom real incrustat al SQL de backfill. |
| P1-69 · PWA | La prova `PageDetailSection.descarregues.test.jsx:45–52` encara exigix cap botó. Ja hi ha servei reutilitzable a `src/pwa/instalacio.js` i captura primerenca a main; la política actual exclou mòbils (`:67–69`) i no oferix guia Safari (`:51–53`). | Reutilitzar el servei existent, actualitzar el contracte anterior i provar prompt d'un sol ús, acceptat/cancel·lat, appinstalled, standalone, guia sense prompt, exclusió nativa/iframe i slots sense URL de botiga encara inexistent. |

La proposta de `username` al client no garanteix unicitat; l'ha de decidir la base de dades. No s'han llegit taules de producció ni inferit l'estat actual de persones reals de les captures. El nou prompt ja autoritza P1-69 en el seu abast; la discrepància amb el missatge anterior de Claude és de coordinació, no una prova d'implementació.

### I+D d'Emowe i retroalimentació del mandat

Es mantenen com a propostes, sense atribuir-les a canvis ja implantats: targeta d'execució amb actor, skill/version/hash, propietari i evidència; confiança separada entre declarat, inferit i verificat; vigilància de progrés i últim èxit; pany amb propietari/generació i exclusió atòmica; exportació realment sanejada i lectura limitada a rutes declarades. Per al mapa, separar origen i inferència i agrupar sobre coordenades segons precisió consentida abans del clustering. No copiar el motor cúbic literal ni considerar una ocultació CSS una anonimització.

La investigació externa i els referents d'Emowe de la versió anterior no s'han reexecutat en esta ronda. No s'ha instal·lat cap agent, paquet, cron ni servei nou. L'acceptació de C1/M1/M2 del Bloc H continua pendent.

Cal corregir el mandat per a futures rondes: `publication-policy.mjs` viu a `tooling/wiki/lib/`, no a `tooling/seo/`; WordPress es prova amb `node --test`, no amb Vitest; evitar donar per fetes les funcionalitats de H o equiparar la suite curta amb tota la regressió. Cal conservar les decisions humanes documentades que superen el pla inicial (P1-57, versió 1.0.0 i fila de filtres), i resoldre la reutilització de P1-64 al Llibre Mestre.

### Addenda v2.1.0 · Revisió de QA d'arquitectura de GM2-09 · P1-12 / IDEA-19

**Dictamen: disseny preliminar no conforme com a especificació preparada per a implementar.** El xifratge al client és coherent amb l'objectiu de privacitat, però falten contractes SQL i de transport compatibles, autenticació de claus, gestió atòmica d'èpoques i un cicle de recuperació i recursos complet. Les troballes afecten la proposta documental; no descriuen una implementació E2EE desplegada ni vulnerabilitats reproduïdes en producció.

**Abast i procedència:** llegides íntegrament les línies 229–455 de `261028_1614_auditoria_gemini.md`, SHA-256 `7e21a726e98c1a858b39d839cd8fd722997d879fc455e524ba1caed21797ce81`. HEAD: `cd3b5b56cb7711deb57ff054e1c63ceaf92dee62`. Els quatre mòduls sol·licitats continuen sense diferències respecte del commit en el tall revisat. Els canvis concurrents de Claude del Bloc H queden fora d'esta addenda. La migració `2610290000_xat_e2ee_claus_i_sobres.sql` i el motor `crypto/e2eeXat.js` proposats encara no existixen.

**Discrepància documental essencial:** GM2-09 encara descriu ECDH entre identitats persistents (`:271–282,372`) i recuperació amb **PIN de sis dígits o quatre paraules** (`:441–442`). Ni la pública efímera ni la frase de sis paraules estan especificades com demana l'encàrrec. La columna `emissor_pub_jwk` no acredita, per si mateixa, generació efímera.

#### QA-E01 · P1 · Contracte SQL i recorregut de dades incompatibles

Les migracions citades a GM2-09 `:236` no existixen. Les fonts principals reals són `2609270200_xat_f0_fonament.sql`, `2609272200_xat_entitats.sql`, `2609282100_xat_de_pagina.sql`, `2610081543_xat_consentiment_i_metadades.sql` i `2610220240_xat_adjunts_i_quota.sql`.

- `src/data/supabase/xat.js:538–544` transmet `p_metadades`, però la definició vigent de `xat_envia` (`2610081543…:247–249`) inserix deliberadament **`{}`**. El sobre E2EE no sobreviuria sense modificar expressament la RPC. El límit SQL vigent és `char_length(text) <= 4096` (`2609270200…:162`; RPC `2610081543…:216`); el client compta unitats UTF-16 amb `.length` (`xat.js:297`). La sentinella curta hi cap, però no resol la persistència del ciphertext.
- `xat_fils.ultim_text`, que GM2-09 `:357` vol actualitzar, no és una columna persistent declarada en estes migracions: és un retorn calculat de `xat_fils_meus` (`2610220240…:457–460,493–498`). Cal retornar el sobre del mateix últim missatge visible per receptor, respectant entrada, buidatge i caducitat. Un resum global no pot substituir eixa finestra de visibilitat.
- Els mapejadors `xat.js:231–268` i `src/sections/xat/missatges.js:70–127` no preserven estat E2EE, versió ni resum xifrat. `missatges.js:131–151` també descarta `xifratVerificat`. Cal ampliar explícitament el contracte neutral, els dos nivells de mapeig i la paritat local; la UI rep `fil.subjecte`, no necessàriament `subjecte_tipus`.
- Les taules/RPC noves necessiten ACL explícites amb `GRANT/REVOKE`, autenticació, tenant, rol i pertinença vigent. Una fila històrica de participant no acredita membre actiu. S'ha de conservar el patró del projecte `SECURITY DEFINER SET search_path = ''` amb noms qualificats. El CHECK JWK ha d'exigir camps, rebutjar resultat NULL i validar la pública P-256; `emissor_pub_jwk` també ha d'excloure el component privat `d`. La longitud de `x`/`y` no valida un punt de corba. PostgreSQL accepta un CHECK que resulte NULL. [Documentació PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS).

**Acceptació:** migració completa amb permisos i retorns compatibles, i prova del recorregut enviament → confirmació → historial → incremental → resum, preservant sobre i autoria canònica. Açò és inspecció de migracions locals; no s'ha consultat l'esquema de producció.

#### QA-E02 · P1 · Adjunts xifrats i pressupostos de longitud incomplets

`publicaAdjuntXat` (`src/data/supabase/xatMultimedia.js:129–161`) reserva, puja i publica amb **`xat_publica_adjunt(p_id,p_text,p_resposta_a)`**, sense argument d'envelope. La RPC (`2610220240…:399–403`) crida `xat_envia` amb metadades buides i després les reconstruïx. El retorn també es comprova contra el tipus original (`xatMultimedia.js:158`). Modificar només `xat_envia`, el bucket i la reserva no integra E2EE.

`application/octet-stream` és rebutjat pel client (`src/data/xatMultimedia.js:72–76`), pel sostre per MIME, pels CHECK de taula i per la classificació final (`2610220240…:83–89,104,110–113,400`). `xat_reserva_adjunt(:262)` no té `p_xifrat`. La quota actual és **20.000.000 bytes**, amb màxims d'imatge de 2.000.000 i veu de 3.000.000, no els 5 MB de GM2-09. Els **16 bytes del tag GCM** compten en els bytes físics: un fitxer ja al màxim el sobrepassaria. Cal conservar quota, límits de durada, confirmació de Storage, idempotència i descart amb un contracte específic de ciphertext. PDFs serien una capacitat nova. `preparaAdjunt` prepara fotos/vídeos i `gravaVeu` prepara veu (`adjuntLocal.js:141–166,190–244`); els vídeos no es recodifiquen i l'eliminació d'ubicació conserva un indicador de resultat.

**El límit de 16.384 bytes proposat no cobrix tot text admés.** La prova unitària de caracterització amb `{v:1,text:'界'.repeat(4096)}` dona **12.305 bytes UTF-8**, **16.428 bytes de ciphertext amb tag en Base64** i **16.483 bytes de sobre mínim amb IV**, abans de GPS o adjunts. `jsonb::text` pot afegir més espais. Tampoc s'ha localitzat en les migracions un CHECK vigent de mida de metadades que simplement es puga «ampliar»: el nou límit s'ha de definir expressament.

**Acceptació:** pressupost del JSON privat i sobre complet en bytes, validació abans de reservar/publicar i proves de frontera amb ASCII, accents, CJK, emojis i tag. El servidor valida esquema públic i ciphertext; el client valida també el contingut desxifrat. No es proposa eliminar els límits.

#### QA-E03 · P1 · Pública efímera, autenticació i garanties criptogràfiques sense contracte complet

El document actual usa la privada persistent de l'emissor. **Si l'arquitectura triada és ECIES amb ECDH P-256 efímer**, cal especificar un parell efímer nou per sobre destinat a embolcallar `CK_fil`, guardar només la pública efímera a `emissor_pub_jwk` i retirar les referències a la privada efímera després de derivar/embolcallar. Cal un perfil versionat amb serialització, validació de punts, HKDF-SHA256 amb context que vincule claus i identitats, AES-GCM-256, IV de 96 bits únic per clau i tag de 128 bits. No és l'únic protocol possible ni una certificació automàtica de seguretat.

La pública efímera no autentica la identitat del remitent. Falta la vinculació verificable de claus a compte/dispositiu, l'empremta contrastada i una política davant de canvis de clau. L'AAD amb UUID vincula el ciphertext al context, però no establix eixa confiança. Compartir `CK_fil` tampoc prova autoria individual entre membres del grup: un tag correcte acredita possessió de la clau compartida. L'AAD impedeix trasplantar el ciphertext a un ID/context diferent; repetir el mateix sobre i ID requerix deduplicació i control de frescor separats. No es declara una duplicació reproduïda al codi actual.

Una efímera de l'emissor i la rotació de CK **no acrediten secret dels missatges anteriors davant compromís posterior de la privada persistent del receptor**, ni recuperació després de compromís. [RFC 9180, §9](https://www.rfc-editor.org/rfc/rfc9180.html#section-9) separa estes garanties d'autenticació i protecció contra repeticions. [MLS, RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html#section-3) és una referència de protocol de grup amb èpoques autenticades; no es declara implementat ni es prescriu una dependència nova.

**Acceptació:** revisió criptogràfica independent i vectors coneguts del protocol complet, amb confiança inicial, canvi de clau, autoria, nonces, repeticions i degradació. No etiquetar la combinació de primitives com a forward secrecy o post-compromise security provades.

#### QA-E04 · P1 · Recuperació amb sis paraules; PIN curt descartat per al backup remot

El backup, salt i IV es desen al servidor de la proposta. Un PIN curt no és acceptable per a protegir eixa còpia: la comprovació de candidats pot fer-se fora de l'aplicació. **PBKDF2 encarix cada comprovació, però no afegix entropia.** Es descarta el PIN de sis dígits com a secret de recuperació del backup remot.

| Secret generat uniformement i de manera independent | Entropia |
| --- | --- |
| Sis dígits decimals | Uns 19,93 bits |
| Quatre paraules de 2.048 entrades | 44 bits |
| **Sis paraules de 2.048 entrades** | **66 bits** |

Les sis paraules s'han de generar amb aleatorietat criptogràfica i selecció sense biaix; una frase triada per una persona no garantix 66 bits. Cal versionar diccionari, normalització, format del backup, KDF, hash, salt, iteracions i IV, i vincular el backup autenticat a compte i identificador de clau. PBKDF2-HMAC-SHA256 amb **600.000 iteracions** és un punt de partida a mesurar al mòbil objectiu, amb límits de paràmetres acceptats. La recomanació d'[OWASP sobre PBKDF2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) tracta cost de protecció de contrasenyes; no certifica l'entropia de la frase. HKDF no substituïx una KDF de contrasenya. [RFC 5869, §4](https://www.rfc-editor.org/rfc/rfc5869.html#section-4).

**Fortalesa:** 66 bits millora substancialment el PIN i les quatre paraules, però no equival a 128/256 bits del secret de recuperació. Si el model exigix més entropia, cal més paraules o un diccionari major. Un desbloqueig local amb PIN, si es vol, és un mecanisme diferent i no pot tornar a derivar el backup remot d'eixe PIN.

#### QA-E05 · P1 · Inicialització, rotació i membres necessiten acord atòmic d'època

El pany de GM2-09 `:355` serialitza crides, però **`ON CONFLICT DO NOTHING` + `GREATEST` no garantixen que els clients hagen acordat la mateixa CK**. Dues inicialitzacions de la mateixa versió amb claus diferents podrien aparentar èxit conservant els sobres de la primera. Una rotació parcial tampoc ha de publicar una versió activa.

El contracte necessita versió esperada, avanç exacte, idempotència vinculada a una proposta, conjunt complet de destinataris vigents i versions de les seues claus, autorització de l'operació i un ordre de panys compartit amb els canvis de membres. Època i sobres es confirmen en una transacció; qui perd la concurrència rep resultat autoritatiu o conflicte i descarta la CK candidata. `xat_envia` i `xat_publica_adjunt` comproven l'època activa **en la mateixa transacció d'enviament**, no sols l'existència de `{v,kv,iv,ct}`.

En expulsar un membre, cal impedir enviaments amb la versió antiga durant la preparació de la nova. En incorporar-ne un, donar-li la CK actual permet desxifrar qualsevol contingut d'eixa època que obtinga: excloure versions anteriors no limita l'historial de la mateixa època. Si no l'ha de rebre, cal una CK nova. `e2ee_actiu=false` per defecte tampoc pot autoritzar missatges nous en clar en fils on E2EE és obligatori: l'aprovisionament necessita estat pendent i rebuig d'enviament. L'historial previ en clar no autoritza degradació silenciosa dels nous missatges.

**Acceptació:** dues sessions reals en una base de prova per a inicialització/rotació simultànies, incorporació/expulsió, enviament amb estat antic i resposta perduda. Les proves unitàries de primitives no acrediten concurrència SQL.

#### QA-E06 · P1 · Dispositius, regeneració i baixa sense identitat de clau versionada

La proposta té una fila per compte amb upsert de la identitat (`:291–300,353`) i sobres amb clau `(fil_id,usuari_id,clau_versio)` (`:329`), sense identificador/versionat de clau destinatària ni dispositiu.

- **Restaurar la mateixa privada** conserva la identitat i pot permetre obrir sobres antics. IndexedDB buit o frase incorrecta no han de provocar regeneració automàtica.
- **Regenerar una privada diferent** canvia la identitat; els sobres antics no s'obrin amb ella. Calen identificadors de clau, notificació/verificació i política d'historial. `ON CONFLICT DO NOTHING` impediria reembolcallar per a la nova clau amb la mateixa clau primària.
- Si tots els dispositius compartixen la mateixa privada restaurada, l'esquema no permet revocar-ne només un. Cal triar i provar el model d'identitat compartida o claus/sobres per dispositiu.
- `emissor_id REFERENCES auth.users ON DELETE CASCADE` (`:324`) elimina també els sobres que eixa persona va crear per als altres destinataris. Pot fer perdre'n la recuperació quan no quede una CK local, encara que el text ja desxifrat continue visible. Cal definir retenció i referències sense una pèrdua accidental de claus alienes.

La identitat publicada per compte no és la memòria cau per actor: canviar d'actor ha de purgar la vista sense substituir silenciosament la clau pública única. **`requires_human_decision: true`** per a les polítiques d'historial i revocació multidispositiu encara no definides; no és una petició de permís per acabar esta revisió.

#### QA-E07 · P1 · Frontera correcta d'`ambitEstable`, però neteja asíncrona encara no definida

La separació vigent és adequada: `ambitEstable` conté backend, persona i actor; `scopeKey` afegix generació JWT (`XatContext.jsx:605–630`). Renovar JWT conserva dades i canvia operacions; canviar d'àmbit purga l'estat (`:895–950`) i oculta la vista anterior (`:1957–1960`). Hui no hi ha Map de CryptoKey ni Set d'ObjectURL desxifrats en els quatre mòduls: GM2-09 descriu treball futur.

Cada espera nova de desxifratge/importació/IndexedDB necessita captura i **revalidació d'àmbit i generació abans de publicar** text, clau o URL. `crypto.subtle` no seguix els AbortController de transport. Buidar un Set al logout no impedix que una promesa antiga cree després una URL i la reinserisca: els resultats tardans es descarten i les URLs ja creades es revoquen immediatament.

El contracte real és `urlAdjuntXat(id, config, {renova}) → Promise<string>` (`xatMultimedia.js:185–212`); el consumidor és `AdjuntXat.jsx:401–413`, no un `BombollaAdjunt.jsx` existent. Cal decidir al port neutral qui obté bytes, desxifra i és propietari de cada `blob:`. La neteja de `useFontVisible` avorta transport (`AdjuntXat.jsx:311–319`), correcta per a signatures actuals però insuficient per als futurs ObjectURL. Cal disposició en substitució, error, desmuntatge, canvi d'àmbit i expulsió, amb memòria limitada durant sessions llargues.

`extractable:false` limita exportació, però no impedix a codi compromés usar una clau accessible o observar text desxifrat. Retirar referències no revoca CryptoKey ja compartits; la plataforma no garantix zeroització ni absència de persistència a disc. Cal corregir la promesa absoluta de GM2-09 `:424`. [Web Crypto, consideracions de seguretat](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/#security-developers). Persistència voluntària a IndexedDB, bloqueig local i purga de memòria cau són garanties diferents.

**Acceptació:** operació pendent → canvi de persona/actor/backend → resolució tardana sense reinserció de text, clau o URL; renovació JWT conserva recursos acceptats; StrictMode, substitució i error no deixen URLs pròpies vives. Una fallada d'autenticació criptogràfica s'ha de mostrar sense tractar-la com a text vàlid ni marcar silenciosament el missatge com a llegit.

#### Verificació executada i condicions de conformitat

**Quatre proves unitàries pures de caracterització amb Node, 4/4 aprovades**, sense xarxa ni fitxers nous: rebuig del MIME xifrat; pèrdua dels camps E2EE als mapejadors; sobre Unicode de 16.483 bytes; quota i entropia condicionada de recuperació. Confirmen incompatibilitats, no validen una implementació E2EE. No s'han executat migracions, concurrència PostgreSQL, recuperació real ni proves d'extrem a extrem. La bateria de v2.0.0 conserva el seu tall; no s'atribuïx a esta addenda. Per l'última instrucció del Mestre, després de consolidar estes conclusions només s'escriu l'informe i es valida documentalment.

| Àrea | Evidència necessària abans d'acceptació |
| --- | --- |
| Primitives i sobres | Vectors coneguts, embolcallat efímer, importació de claus i rebuig per context/versió incorrectes; roundtrip propi insuficient. |
| SQL i adjunts | ACL/RLS per rol i membre vigent, límits del sobre i bytes GCM, reserva/publicació/lectura i idempotència. |
| Èpoques | Dues sessions, membres complets, enviament durant rotació, incorporació sense historial i expulsió amb emissor desactualitzat. |
| Recuperació | Sis paraules generades uniformement; frase errònia, cancel·lació, backup antic, IndexedDB absent, restauració i regeneració explícita. |
| Recursos | Cap reinserció tardana; ObjectURL alliberades; memòria limitada; renovació JWT i StrictMode. |
| Producte | Resum abans d'obrir el fil, cerca local, historial previ, adjunts i avisos sense text privat al servidor; indicador E2EE només quan corresponga. |

Fonts primàries consultades en esta ronda; conclusions d'encaix amb el repositori pròpies. P-256, HKDF i AES-GCM són compatibles amb Web Crypto, però les garanties del protocol necessiten revisió independent. Cal limitar el model a clients autèntics i dispositius íntegres, amb metadades de transport encara visibles; no prometre anonimat, eliminació de còpies històriques o immunitat davant codi client compromés.

Empremtes SHA-256 dels quatre mòduls revisats:

| Font | SHA-256 |
| --- | --- |
| `src/data/supabase/xat.js` | `3c9a993f8b8bf66044bf99fc9637d1cf5975f1d2ea1a158d7058909c093e8c4e` |
| `src/data/supabase/xatMultimedia.js` | `8bfb169bc4ae1ff141cf762fd49e7b53fa8eb394dd982769338caf5d89b11057` |
| `src/sections/xat/adjuntLocal.js` | `e17b2d55c959e38233c2ab8f490e2ea488c45af2c9c8a5c940fbaf5d51e44dd0` |
| `src/sections/xat/XatContext.jsx` | `493b9e6191bd8310ddaf90fa5777337a694f4aa9dd6a48fa64f093a462c28c49` |

Només es modifica este informe. No s'ha reescrit GM2-09 ni cap font, prova, eina, migració o registre administratiu. La validació final es fa amb `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261028_1611_auditoria_codex.md`; el seu resultat s'entrega amb el resum del torn.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat executat i interpretació |
| --- | --- |
| `npx --no-install vitest run` | Exit 1, **1.350 fitxers aprovats, 7 fallits i 9 omesos**; **23.228 casos aprovats, 8 fallits i 109 omesos**, 580,75 s. Les fallades inicials eren resolució de React des de la memòria cau temporal i accés al CSS extern de Leaflet; algunes suites no arribaven a recollir casos. `vitest-full.log`. |
| Repetició de les 7 suites afectades, sense canviar fonts ni assercions | Amb `vitest.qa.config.mjs` temporal que permet llegir les dependències enllaçades, i `NODE_PATH` per al CommonJS de la memòria cau: **6 fitxers aprovats, 1 fallit; 213 casos aprovats, 1 fallit i 1 omés**, 10,25 s. Mapa, mòduls, Workspace i manifest passen. Resta `laParroquia.test.js:198`: falta `261003_1330_parroquia_claude/MAPA_IMATGES.txt`. El fitxer de prova no canvia en cd3b5b56c; és el deute ja comunicat per Claude. No es declara una nova passada completa verda. `vitest-affected-final.log`. |
| Suite Node primària: `node tooling/tests/run-node-tests.mjs` | Invoca **`node --test --test-concurrency=2`** sobre 87 fitxers del manifest. Passada final exit 1: **1.140 aprovats, 1 fallit, 5 omesos i 3 TODO**, 52,26 s. Falla `tests/botigues.test.mjs:250`: la plantilla d'entorn del laboratori nomenada pel preflight és absent. Els tres TODO són diagnòstics declarats, no tres fallades addicionals. `node-primary-final.log`. |
| Preparació i primera passada Node | Primer intent: 1.134 aprovats, 5 fallits, 6 omesos i 4 TODO. Dos errors provenien de `.claude/settings.json` absent, un de `.env.example` exclòs de la còpia i un d'EPERM per escoltar a loopback. Fixtures restaurades només a la còpia; HTTP local repetit amb autorització de l'entorn, 1/1 aprovat. No s'han alterat tests per ocultar errors. `node-primary.log`, `node-fixture-recheck.log`, `node-env-fixture-recheck.log`, `node-social-http.log`. |
| `/usr/bin/time -p npm run test:precommit` | **Exit 0**: 181 fitxers Vitest, **3.508 aprovats i 2 omesos**; **262/262 Node**. Temps real **29,82 s**, dins de <30 s en esta mesura; no és una garantia de temps en altres càrregues. `precommit.log`. |
| `npx --no-install eslint src tooling scripts tests --max-warnings=0` | Exit 0, cap missatge d'error ni avís. `eslint.log`. |
| `node --test tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs tests/enxufe-pantalla.test.mjs` | **83/83 aprovats**, sense omissions, 3,11 s; inclou comprovacions PHP. Se solapa amb la suite Node primària. `node-wordpress.log`. |
| `node tooling/seo/check-editorial-copy.mjs` | Exit 0, `valid:true`, `errors:[]`, **62/62** dins dels quatre textos demanats. `editorial-final.log`. |
| Prerender/manifest sintètic addicional | Assertions de caracterització aprovades: 111 rutes base, 112 amb snapshot al constructor, 111 al prerender i absència de l'HTML nou; reproduïx QA-01, sense corregir-lo. `/tmp/sdp-seo-qa-functional.mjs`. |
| Proves unitàries addicionals de GPS/mapa | **4 aprovades i 1 fallida**, exit 1; la fallada és QA-02. Les aprovades comproven les 10 imatges, complete-link i comparabilitat temporal. `node --test /tmp/sdp-qa-map-gps-261028/map-gps-regression.test.mjs`. |
| Prova unitària addicional de compartició | **1/1 de caracterització aprovada**: reproduïx QA-03 i comprova el descart/alliberament del lot vell. `node --test /tmp/sdp-share-qa-261028/share-regression.test.mjs`. |
| Olivera i validació documental | Olivera exit 0. `document.mjs check` de l'informe abans de l'actualització: `valid:true`, `errors:[]`; la versió final també retorna `valid:true`, `errors:[]` després d'escriure-la. |
| `tancament.mjs --check --turn-id torn_35e0f345-7551-4fe0-9922-970c51102f48` | Exit 1, estat `planned`: el pla vinculat és anterior al pla ara modificat, hi ha canvis de codi posteriors a l'obertura del torn documental i falten relleus d'ESTAT/LEDGER d'eixe torn. Les huit comprovacions d'entorn ixen a 0. És una incidència de tancament documental, separada del resultat de QA del codi. `/tmp/sdp-qa-tancament.log`. |

Comandes de reproducció de la repetició afectada, des de l'arrel de la còpia temporal:

```sh
NODE_PATH="$PWD/node_modules" npx --no-install vitest run -c ../vitest.qa.config.mjs src/sections/mur/MapaFotografic.test.jsx src/apps/plataforma/modulDeBuild.test.jsx tests/gauntlet-codex-workspace-port.test.jsx src/apps/plataforma/manifestApp.test.js src/apps/bar/vistes/vestits.test.js src/apps/nevera/vistes/vestits.test.js src/apps/bar/llavors/laParroquia.test.js
node tooling/tests/run-node-tests.mjs
/usr/bin/time -p npm run test:precommit
```

El manifest Node té 113 fitxers classificats: 87 primaris, 16 de laboratori i 10 de sessió. En esta ronda s'ha executat la selecció primària completa; no es presenten les altres dos com a executades. Els ajustos de configuració de proves només viuen al directori temporal i no relaxen les assercions ni els sanejadors de producció.

Les bateries se solapen i no se sumen per presentar un total de proves úniques. Una prova de caracterització que confirma deute no és una prova d'acceptació aprovada. Les omissions, TODO i suites que no arriben a recollir casos s'indiquen expressament.

Còpia principal i evidències: `/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-qa-cd3b5b56c-p884jgc6/`. Inclou `source-sha256.json`, `documents-sha256.json`, `snapshot.json`, logs i còpia de l'informe anterior. Els directoris temporals són efímers; este document conserva el dictamen, ubicacions, resultats i comandes.

Empremtes del mandat llegit: prompt `99daa5c08621cd0e03eb565dd36025ce78a62d4ba8b2ec74c7f6e680346788e5`; pla `0e89ef82238fed78f58dcfe30c9257b4e086615d1279787a3cd303a9ac638d5d`; Claude 1620 `404558fabf4b81583baa3619123435df740a5143ca7c05568b213da277e1c2eb`; Claude 2020 `e9b6d18338196a37de9c32d4b2bda882aa84e0c035c8873cfb9ed7cd80fb3224`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Esta revisió acredita el tall i les proves descrites, sense certificar producció. No s'han desplegat Firebase/Edge/WordPress, aplicat migracions, reescrit historial, escanejat Storage amb credencials ni provat dispositius Android/iOS. No s'ha executat un rastrejador real de WhatsApp ni l'emulador de Firebase. Les garanties de RLS, concurrència SQL, persistència nativa i representació visual requerixen els entorns corresponents.

Les comprovacions d'APIs WordPress i de contractes SQL són inspecció estàtica quan no s'indica una prova executada. Absència de PDO/mysqli no certifica immunitat davant d'una vulnerabilitat del runtime PHP. Esta ronda no avalua ni certifica l'alerta externa citada al pla; manté l'abast explícit de QA sobre el connector.

Comprovació d'estabilitat a les **20:46 del 2026-10-28 (Europe/Madrid)**: HEAD continua a cd3b5b56c i els hashes de totes les fonts de codi capturades coincidixen amb el viu. Només han variat el log de cron i l'índex de l'Escriptori, per activitat concurrent aliena a esta revisió. La traça és `live-recheck.json`. El Bloc H continua sense canvis de codi en eixe tall; una implementació posterior requerix revisar els seus hashes i repetir les proves afectades.

L'única escriptura viva pròpia és este informe. ESTAT, LEDGER, índex, rebuts, skills i segells es deixen intactes d'acord amb la frontera explícita de la tasca; la incidència de tancament queda documentada per a l'orquestradora. No s'ha arxivat cap document ni modificat cap procés alié. No queda cap servidor, cron, watcher o prova pròpia en execució.

El resultat lliurat és una revisió de QA completada amb conformitat parcial, defectes reproduïbles i treball H pendent. L'acceptació del conjunt requerix corregir o resoldre els punts oberts i executar les proves d'acceptació corresponents; el precommit aprovat no substituïx eixa acceptació.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261028_1526_prompt_deute_tecnic_opengraph_edicio_i_xat]]
- [[261028_1526_pla_implementacio_deute_tecnic_opengraph_edicio_i_xat]]
- [[261028_1620_auditoria_claude]]
- [[261028_2020_auditoria_claude]]
- [[261028_1614_auditoria_gemini]]
- [[261027_0730_reforma_editorial_gemini]]
- [[261027_0730_solucio_opengraph_i_copy_codex]]

<!-- SDP:SECTION auditoria.s8 -->
## Certificació Final Bloc H (e36606db2) + Disseny E2EE (IDEA-48) i Butlletí de Qualificacions

**Data: 2026-10-29, Europe/Madrid. Dictamen final de QA: conformitat parcial; acceptació global pendent. Nota global: 7,2 / 10.** El Bloc H incorpora les funcionalitats anunciades i corregix el centre del mapa i la cancel·lació de compartició. Queden un defecte d’integració JS↔SQL reproduït, una entrega OpenGraph remota encara incompleta i dos punts majors de disseny de recuperació social. La regressió completa conserva fallades heretades. Este tall substituïx les valoracions d’estat actual de les seccions anteriors, que es conserven com a historial; P1-66–69 ja tenen implementació en este commit.

### Tall revisat, procediment i frontera d’escriptura

HEAD verificat: **`e36606db2b7698225b8f9912b823af28a61c2da4`**, branca `backup-notes-publish`; diferència sobre `cd3b5b56c`: **99 fitxers, +8.779/−438 línies**. S’han llegit el relleu final de Claude, el disseny E2EE complet i les decisions del Mestre, inclosa la ronda 3. Les decisions vinculants prevalen sobre els apartats encara titulats «obertes» del disseny. No es tornen a sotmetre a decisió k=3, recuperació immediata, sis paraules, identitat única per persona, reembolcallat explícit d’entitats o revisió externa abans de F2c.

Aplicats `sdp-workflow` i `core-gauntlet-loop` en mode de revisió: contrast del codi, revisió independent per tres subagents, proves unitàries, regressió completa, comprovacions de contracte i mutació funcional en directoris temporals. No s’ha fet una reproducció d’atacs. L’única escriptura pròpia dins del repositori viu és esta addenda a l’informe.

La còpia temporal conté **5.692 fitxers seguits**, capturats a les **00:26:50 del 29 d’octubre**. S’han exclòs secrets `.env`; s’han conservat les fixtures públiques necessàries. Les dependències instal·lades s’han reutilitzat amb memòria cau de proves temporal. El viu ja tenia una regeneració concurrent de [wikiManifest.js](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/wikiManifest.js>): només en la còpia s’ha substituït pel blob de HEAD per provar el codi del commit. No s’ha revertit res al viu. La configuració temporal de Vitest amplia exclusivament la lectura de les dependències enllaçades; cap asserció de les suites permanents s’ha canviat.

Evidències de la ronda: [directori temporal](/private/tmp/sdp-qa-final-e366-k86jd1uc), [captura](/private/tmp/sdp-qa-final-e366-k86jd1uc/snapshot.json), [hashes del viu inicial](/private/tmp/sdp-qa-final-e366-k86jd1uc/source-live-sha256.json) i [hashes de la còpia provada](/private/tmp/sdp-qa-final-e366-k86jd1uc/source-tested-sha256.json). Els temporals són efímers: els resultats i les condicions d’acceptació queden consignats ací.

Correcció de premisses del mandat: el compositor viu a [sections/xat/components/Compositor.jsx](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/components/Compositor.jsx>); la font implementada és **Noto Sans variable**, amb amplada 87,5%, i la migració és [2610282100_usuari_i_poble_canonic.sql](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2610282100_usuari_i_poble_canonic.sql>). No s’avaluen com si els noms alternatius del missatge foren fitxers existents.

### Matriu de Conformitat de Requeriments (MCR)

`[FET]` acredita el requisit delimitat i l’evidència indicada; les proves DOM no acrediten per si soles geometria ni comportament natiu. `[PARCIAL]` identifica una correcció amb validació incompleta o un requisit amb defectes oberts.

| Requeriment | Estat | Evidència contrastada | Límit o treball que queda |
| --- | --- | --- | --- |
| P1-66: barra única, adjunts, focus de retorn i doble toc | `[FET]` en codi i proves unitàries | [Compositor](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/components/Compositor.jsx:373>): selecció dins del gest, retorn de focus; guarda de 600 ms a :530. [Conversa](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/components/Conversa.jsx:692>): buida el text abans de l’espera. | L’estalvi exacte de 151–187 px i el selector de fitxers de Safari/iOS continuen com a evidència de l’autor; no s’han repetit en dispositiu. |
| P1-67: font local, preload i pestanyes al 87,5% | `[FET]` | [index.html](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/index.html:22>), tokens i font de 59.936 B amb eix `wdth` i OFL. DOM real de Notes a 393 px: Noto Sans, `font-stretch:87.5%`. | La font és Noto Sans; no Asap. La llegibilitat requerix també proves amb persones i ampliació. |
| P1-68 R1: bloc d’identitat dins del scroll | `[FET]` estructuralment | [PerfilEditor](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/PerfilEditor.jsx:764>), :1051, i prova permanent de `peuDePagina`. | No s’ha repetit el perfil autenticat real a 375 px. |
| P1-68 S-01 i absència de bucle en la baixa | `[FET]` per inspecció de la correcció | [SQL](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2610282100_usuari_i_poble_canonic.sql:791>): camí automàtic limitat al comodí i fora de la baixa; :857 aplica fila pròpia, bloqueig i 10 intents/hora; :496 limita la cerca a 100 candidats. | Les proves permanents de migració són estàtiques. Falta PostgreSQL amb dues sessions i autoritzacions reals. |
| P1-68: paritat, estat visible, poble canònic i RLS | `[PARCIAL]` | Regles client/SQL detallades, RPC d’username i ACL privades. Prova independent amb PerfilProvider real i backend simulat: el nom tardà deixa desfasat l’username. | QA-H01; QA-H02 condicional. La migració permet `town_uuid=NULL` si falta la fila i no modifica `town_memberships`: no acredita cinc camps sempre no nuls. |
| P1-69: PWA a Descàrregues, WebView i guia iOS | `[FET]` en codi i proves; instal·lació real pendent | [canalsDeBotiga](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/canalsDeBotiga.js>) i [InstalaLaPwa](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/detail/InstalaLaPwa.jsx>). Contemplen `; wv)`, reutilització del prompt i guia Safari. | No s’ha instal·lat cap PWA ni acceptat permisos; falta comprovar navegadors i aparells reals. |
| IDEA-40: verd canònic i semàfor explícit | `[FET]` per al token i el contracte visual | [tokens.css](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:110>), [UniversalCard](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/organismes/UniversalCard.jsx:289>): `data-semafor` validat, sense `:has()`, amb alternatives textuals. | No equival a conformitat WCAG AAA; vegeu QA-H03. |
| IDEA-41 i R2: Proposa Card i memoització independent | `[FET]` en codi i proves DOM | [DocumentEditor](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:656>): normalització memoitzada per cos; [UniversalToolbar](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:202>): acció dins d’Aa en mode compacte. | La prova amb cos de 300.000 caràcters detecta reprocessament en canviar el títol. Falta perfil de rendiment i geometria autenticada a 360–393 px. |
| P1-64 / Emowe M2: preagrupament exacte i centre | `[FET]` per als casos provats | [MapaFotografic](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/mur/MapaFotografic.jsx:280>): duplicats abans de la matriu; :338 mitjana circular. Oracle independent: 8 conjunts de 20 punts i 10 llindars. | Es conserva el cas de distància zero i el fallback declarat de conjunts grans. L’oracle no és una prova formal per a totes les entrades. |
| QA-01: projecció remota cap al prerender | `[PARCIAL]` | El prerender ja rep `publicSnapshot` i `--snapshot`; SEO 58/58. | La comanda de release no aporta la projecció i no queda acreditada la primera imatge remota; QA-H04. |
| QA-02, QA-03 i QA-04 de v2.0 | `[FET]` en les correccions delimitades | Centre circular; lectura amb carrera de cancel·lació i senyal; Android amb `Future.get` de 5 s, `CancellationSignal` i tancament de l’executor. | Tres mutants de compartició detectats. Android queda contrastat estàticament, sense un proveïdor Binder real. |
| P1-12: disseny final respecte de QA-E01..07 | `[PARCIAL]` | Protocol, formats, bytes, RPC, concurrència, dispositius i recuperació especificats amb molta més precisió. | Disseny sense implementació certificada, vectors independents i proves d’integració pendents; QA-E07 conserva una incoherència d’àmbit. |
| IDEA-48: cercle obert k=3 immediat | `[PARCIAL]` en disseny | Repartix `RK`, requerix amics verificats, confirmació i canal de veu; incorpora alarma. | QA-S01..06; no acredita encara resistència al servidor actiu ni revocació efectiva del cercle. |
| Preparació WordPress.org i botigues | `[PARCIAL]` | Zip final verificat, PWA implementada i proves d’enxufe dins de Node. | No s’acrediten publicació, revisió de les botigues, dispositius reals ni desplegament web. |

### Troballes funcionals i de conformitat obertes

**QA-H01 · P2 · El nom tardà desincronitza la proposta d’`@username`.** El disparador [SQL :791–796](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2610282100_usuari_i_poble_canonic.sql:791>) regenera el comodí quan arriba el nom real. [PerfilContext :585–593](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/PerfilContext.jsx:585>) només fusiona l’username retornat quan el camp desat és `username`; quan es desa `full_name`, descarta eixa columna derivada. Una prova unitària nova amb el `PerfilProvider` real i resposta sintètica conforme al disparador deixa «Anna Pérez» amb `veina`, tot i que la resposta simulada conté `annaperez`. **1 prova falla i 1 control passa**. [Prova i resultat](/private/tmp/sdp-qa-identity-final/identity-regression.test.jsx), [log](/private/tmp/sdp-qa-identity-final/regression.log). La proposta pot quedar antiga fins a recarregar i tornar a confirmar el valor anterior. **Acceptació:** reconciliar les columnes derivades o rellegir-les, amb guardes contra resposta antiga; provar nom tardà, confirmació, resposta retardada i canvi de sessió. No s’ha aplicat la migració al viu.

**QA-H02 · P2 condicional · Resolució territorial inconsistent amb homònims.** [poble_derivat :556–575](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2610282100_usuari_i_poble_canonic.sql:556>) tria una fila per a `town_uuid` i `primary_town`, però agrega províncies i comarques de totes les files que compartixen nom. [L’esquema inicial](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/2609080000_initial_schema.sql:7>) fa únic `slug`, no `name`. Amb dos pobles homònims de regions diferents, el contracte pot combinar l’UUID d’un amb regions de tots dos. És una condició demostrable per inspecció, **sense SQL executat ni presència d’homònims comprovada en producció**. **Acceptació:** fixture SQL amb dos homònims i una mateixa resolució determinista per a tots els camps territorials.

**QA-H03 · P2 de conformitat · El verd canònic no acredita AAA per a text normal sobre blanc.** El càlcul sRGB independent de `#0F672F` contra `#FFFFFF` dona **6,9965997583:1**. Passa el llindar AA de text normal, però és inferior al 7:1 d’AAA; arredonir-lo a 7,00 no permet donar-lo per conforme. El codi ja ho documenta com a AA. Per tant no és una regressió de contrast respecte del contracte declarat al codi, sinó una limitació davant de l’AAA demanat. Cal comprovar cada ús real, grandària i fons, així com focus, teclat, espaiat, ampliació i dianes. [WCAG 2.2, 1.4.6](https://www.w3.org/TR/WCAG22/#contrast-enhanced). La geometria limitada de Descàrregues no certifica totes les vistes.

**QA-H04 · P1 funcional heretat, parcialment corregit · OpenGraph remot sense cadena de release completa.** [prerenderSocial :146,167,278–282](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/seo/prerender-social.mjs:146>) ja passa la projecció al constructor i admet la CLI: la reproducció antiga d’«argument ignorat» queda superada. Però [build:social](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/package.json:75>) no produïx ni passa cap `--snapshot`; sense ell continua amb `[]`. Les proves noves amb snapshot explícit proven l’adaptador, no la cadena de publicació real. A més, la prova de Storage extern valida la imatge genèrica de reserva, no la primera foto real d’una publicació remota. **Acceptació:** executar la mateixa comanda de release amb una projecció pública sanejada, verificar HTML i primera imatge real, exclusió de privades/pendents i retirada d’una publicació revocada. Els 58/58 de SEO són vàlids dins del seu abast i no tanquen este requisit d’integració.

### P1-12: què resol el disseny final i què falta verificar

Fonts: [disseny final complet](</Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md>) i [decisions vinculants](</Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/decisions_mestre_p112.md>). Les referències següents són requisits del disseny, no funcionalitats ja desplegades.

| Observació de v2.1.0 | Resposta en el disseny final | Estat QA actual |
| --- | --- | --- |
| QA-E01/E02: longitud, metadades i RPC separada d’adjunts | Transport binari opac, límits en bytes, camps de llistes, RPC i recorregut d’adjunts especificats. | Ateses en disseny. El sobre mínim antic de 16.483 B no es dona per compatible amb el límit antic de 16.384 B: cal implementar i provar el nou contracte de punta a punta. |
| QA-E03: sobre i autenticitat | HPKE base P-256/HKDF-SHA256/AES-256-GCM, encapsulació efímera, declaracions d’identitat i època signades, `envHash`, `ckCommit`, TOFU i continuïtat. | Atés en disseny. L’autenticació ve de les declaracions i fixacions: HPKE base per si sol no acredita l’emissor. Sense forward secrecy declarat, coherent amb [RFC 9180 §9.7.4](https://www.rfc-editor.org/rfc/rfc9180.html#section-9.7.4). Vectors i revisió externa pendents. |
| QA-E04: recuperació sense PIN curt | Sis paraules uniformes d’una llista de 2.048: **66 bits**; PBKDF2-HMAC-SHA256, 600.000 iteracions, sal de 16 B; embolcall de `RK`, còpia vinculada a compte i `kid`. | Atés en disseny. PBKDF2 encarix les proves de contrasenya, no aporta entropia a un PIN. Falten llista revisada, vectors, mesures mòbils i prova de restauració. |
| QA-E05: concurrència i rotació | Publicació amb comparar-i-canviar, avanç exacte d’època, cadena de hashes, idempotència, gènesi/rotació dins de l’enviament i reintent amb el mateix id. | Atés en disseny; no s’han provat bloquejos i conflictes amb PostgreSQL concurrent ni diversos aparells. |
| QA-E06: aparell nou, regeneració i entitats | Identitats versionades; IndexedDB buit obliga a restaurar, no a regenerar; restauració i pèrdua d’aparell diferenciades; reembolcallat explícit als gestors i rotació en retirada. | Atés en disseny; implementació, revocació de sessions i regressió amb clients antics pendents. |
| QA-E07: ObjectURL, CryptoKey i àmbit | Rebuig de resultats tardans, revocació de Blob URL i límits honestos de memòria. | **Parcial també en especificació:** §8.5/8.6 usa `clauPersona + generació`, que no incorpora l’actor. |

Per a **QA-E07**, [XatContext :605–614](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/xat/XatContext.jsx:605>) distingix `clauPersona` d’`ambitEstable`, que incorpora `actorKey`; el canvi d’actor pot mantindre la generació de sessió. Les guardes actuals del context sí detecten eixe canvi. El nou decorador haurà de capturar `ambitEstable` i el token d’operació, o una generació pròpia que també avance amb l’actor, per a CK, text desxifrat, URLs i resultats pendents. La identitat persistent pot continuar sota `clauIdentitat=[backendId,endpoint,joId]`. Cal reconciliar-ho amb les regles generals del mateix disseny, que ja exigixen neteja en canvi d’actor. **És una incoherència d’especificació pendent; no s’ha demostrat una fuga actual.**

L’arquitectura proposada del decorador abans del segellat del port és coherent amb el Model B i inclou l’adaptador injectat, el remot i les capacitats del contracte. La implementació haurà de provar també `appendChatMessages`, els ecos locals, `ultimXifrat`, els adjunts, la cerca i les cues; cobrir només l’enviament principal deixaria vies d’integració sense acreditar. L’etiqueta «xifrat» no s’ha d’activar fins que els requisits de la fase corresponent siguen reals.

### IDEA-48: punts que impedixen tancar el protocol social

Es respecta el cercle obert amb **k=3, GF(2⁸), recuperació immediata**, amics verificats i confirmació per veu/persona. El secret repartit és `RK`, no la clau privada. No es proposa una espera ni es reobri eixa decisió humana. Els punts següents són defectes o omissions del contracte de disseny.

| Identificador i prioritat | Evidència del disseny | Conclusió i acceptació necessària |
| --- | --- | --- |
| **QA-S01 · P1 · Autenticació del codi curt** | §5.6, :460–465; D-14(a), :1802. Sis xifres d’un hash públic de petició, compte i EPK. | No especifica un protocol SAS amb compromisos, contribucions i transcripció autenticada que justifique la garantia davant d’un servidor actiu. Seleccionar un protocol revisat, fixar el context i els límits d’intent i retirar l’afirmació que el hash curt «tanca» per si sol eixe risc. El paper del compromís en SAS està explicat en [RFC 6189 §4.4.1.1](https://www.rfc-editor.org/rfc/rfc6189.html#section-4.4.1.1). És revisió de disseny, sense reproducció d’atac. |
| **QA-S02 · P1 · Retirada d’amics i fragments antics** | §5.6, :457–470. Es reseguella si canvia la clau d’un amic, però no es definix una revocació de cercle compromés. | Canviar el repartiment o resegellar no elimina fragments ja oberts. Si un backup antic restaura la mateixa identitat, eixa identitat pot obrir sobres futurs dirigits a ella. Distingir retirada administrativa, nou polinomi, nova RK i canvi d’identitat/èpoques; definir quina garantia futura oferix cadascun i provar còpies antigues. |
| **QA-S03 · P2 · Contracte d’alliberament incomplet** | §5.6, :458–465; taula :750–755. | El sobre inicial té context i declaració signada; el resegellat amic→aparell nou no fixa format, `info`/AAD ni autenticació de procedència complets. Vincular compte, identitat, repartiment, petició, EPK completa, amic/kid, índex, caducitat i aprovació. Rebutjar amics o índexs repetits i repartiments barrejats. No es presenta com una extracció de clau demostrada. |
| **QA-S04 · P2 · Abast real de «No sóc jo»** | :467, :1802–1804 i riscos residuals :1927. | És una cancel·lació de millor esforç: pot arribar després del tercer fragment, a cap aparell connectat, o ser retinguda pel servidor. No recupera fragments ni RK ja lliurats. Fixar la màquina d’estats i descriure honestament el control; la verificació externa de la persona continua sent independent. |
| **QA-S05 · P2 · Pressupost de reconstrucció** | :466, :470 i §15.12. | Amb 5 fragments hi ha 10 ternes; amb 8, 56. El màxim de 255 permetria 2.731.135 ternes si s’hi estenguera literalment l’enumeració. Acotar fragments rebuts i pressupost, o revisar una comprovació de consistència eficient. El text diu 5 o 8: no s’afirma que ja exigisca enumerar els 255. Una comprovació posterior amb més fragments no desfà una recuperació ja completada amb tres. |
| **QA-S06 · P2 · Interoperabilitat Shamir** | :457, :470 i :740–755. | GF(2⁸) i k=3 són compatibles, però falten polinomi irreductible, representació, coeficients aleatoris independents i formats exactes; aclarir ciphertext de 48 B inicial contra 49 B en alliberament. Requerir vectors independents, reconstrucció autenticada i rebuig d’índex zero/repetit. La brevetat del codi i vectors propis no són oracles independents. |

La col·lusió de tres amics o el compromís de tres comptes amb N gran és un **risc explícitament acceptat**, no una fallada a corregir canviant k. La frase alternativa de «fixat fa més de 30 dies» ha de quedar marcada com a descartada: D-14(a) vinculant exigix amics verificats. La revisió externa abans de F2c es manté; F7 requerix, a més, revisió específica del protocol de recuperació i del seu cicle de vida.

### Resultats de proves executades

Les quantitats següents són casos executats, no percentatges de cobertura de línies ni prova d’absència de defectes. Les suites focals se solapen amb les completes i no se sumen.

| Execució en còpia temporal | Resultat i evidència |
| --- | --- |
| Vitest complet: `NODE_PATH="$PWD/node_modules" npx --no-install vitest run -c ../vitest.qa.config.mjs` | **Exit 1: 1.383 fitxers, 1.373 aprovats, 1 fallit i 9 omesos; 23.794 casos, 23.683 aprovats, 1 fallit i 110 omesos**, 653,24 s. [Log complet](/private/tmp/sdp-qa-final-e366-k86jd1uc/vitest-full.log). |
| Node primari: `node tooling/tests/run-node-tests.mjs` | **Exit 1: 1.150 casos; 1.141 aprovats, 1 fallit, 5 omesos i 3 TODO**, 49,23 s. Executa `node --test --test-concurrency=2` sobre 87 fitxers primaris del catàleg de 113. [Log](/private/tmp/sdp-qa-final-e366-k86jd1uc/node-primary.log). |
| SEO: `node --test tooling/seo/*.test.mjs` | **Exit 0: 58/58**, 7,43 s. [Log](/private/tmp/sdp-qa-final-e366-k86jd1uc/seo-58.log). |
| ESLint: `npx --no-install eslint src tooling scripts tests --max-warnings=0` | **Exit 0**, sense errors ni avisos. [Log](/private/tmp/sdp-qa-final-e366-k86jd1uc/eslint.log). |
| Precommit: `/usr/bin/time -p npm run test:precommit` | **Exit 0: 185 fitxers Vitest aprovats; 3.588 casos aprovats i 2 omesos; Node 262/262. Temps real 29,77 s**, dins de 30 s en esta mesura i sense garantia en altres càrregues. [Log](/private/tmp/sdp-qa-final-e366-k86jd1uc/precommit.log). |
| Regressió independent d’identitat | **1 fallida i 1 aprovada**, 1,09 s: QA-H01 i control de desat explícit d’username. No pertanyen a la suite permanent. |
| Proves independents de mapa i compartició | **3/3 aprovades**: centre en ambdós ordres, preagrupament contra oracle i canvi de sessió amb transport que ignora el senyal. [Mapa](/private/tmp/sdp-share-e36606db2/map.test.mjs) i [compartició](/private/tmp/sdp-share-e36606db2/session-cutoff.test.mjs). |
| Mutació independent de compartició | Línia base permanent **43/43**. **3 mutants no equivalents detectats, 0 supervivents i 0 invàlids**: avortament en canvi de sessió, propagació del senyal i avortament per termini. Font original restaurada entre execucions. [Resultats i logs](/private/tmp/sdp-mut-e366-share-1lu9x4mt/mutation-results.json). **3/3 és només el resultat dels tres mutants seleccionats**, sense extrapolar-lo a cobertura global. |

La fallada Node és la mateixa ruta absent del laboratori de botigues identificada en v2.0.0, a [tests/botigues.test.mjs:250](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tests/botigues.test.mjs:250>). Els tres diagnòstics marcats TODO no són tres fallades addicionals. Vitest conserva la ruta absent de la Parròquia a [laParroquia.test.js:198](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/apps/bar/llavors/laParroquia.test.js:198>), també identificada en la base; la resta dels fitxers executats passen. No s’han eliminat casos, creat fixtures falses per fer-los passar ni presentat la suite curta com una passada completa verda.

Comprovació visual limitada sobre el servidor local existent, sense iniciar sessió ni modificar contingut: **Descàrregues a 320×667, 375×667 i 393×852**, sense desbordament horitzontal; els dos botons d’instal·lació tenen 58 px d’alt. Notes a 393 px tampoc desborda; els enllaços mòbils mesurats tenen 48–53,33 px d’ample i 55 px d’alt, amb Noto Sans al 87,5%. S’ha restaurat el viewport i tancat la pestanya temporal. Açò no substituïx Safari/iOS, TalkBack/VoiceOver, teclat virtual ni l’editor autenticat de perfil o Notes.

### Release, governança i mapa de conformitat NIST CSF 2.0

El [zip WordPress.org 1.1.9](</Users/javillinares/Documents/Antigravity/Som de Poble/_builds_de_poble/wordpress/261029_0018_wordpress_directori_v1.1.9.zip>) existix: **3.244.627 B, 43 entrades**, SHA-256 **`8fb6792db33b91d79a7cffec613348e2a22cb847028706e4e4be7ef90bf29f34`**. La comprovació CRC passa; inclou la font variable, no conté fitxers `.env` ni camins de traversament. Estes comprovacions del paquet no acrediten la seua acceptació al directori ni equivalència amb un desplegament natiu.

El relleu final de Claude declara que **la migració P1-68 no està aplicada, no hi ha desplegament i la web de producció continua amb les fotos antigues amb GPS**. Esta ronda comprova el repositori i el paquet; no ha tornat a consultar eixes fotos de producció. La purga del repositori A–G es conserva com a evidència prèvia. Abans de publicar l’entrega cal acreditar la versió real servida, els mitjans nets i la seqüència de desplegament, sense confondre codi corregit amb servei actualitzat.

La [Porta Olivera](/private/tmp/sdp-qa-final-e366-k86jd1uc/olivera-live.log) passa. El [tancament en mode check](/private/tmp/sdp-qa-final-e366-k86jd1uc/closure-live.json) retorna **`valid:false`** per al rebut històric d’este informe: pla absent/modificat, canvis de codi fora del seu abast documental, relleus d’ESTAT/LEDGER absents i captures humanes afegides durant el torn compartit. Les **8 comprovacions d’entorn passen**: Olivera, plantilles, autoritat, ledger, segell, skills, Wiki i SCC. El resultat no atribueix eixos canvis concurrents a esta revisió; tampoc permet afirmar que el torn històric està segellat. No s’ha intentat tancar-lo ni reparar-lo alterant altres fitxers, per la frontera d’escriptura imposada pel Mestre.

La correspondència següent és una avaluació parcial pròpia del projecte. El CSF descriu resultats de gestió de risc i no prescriu una implementació concreta; el títol «Certificació Final» no convertix esta revisió en una certificació de NIST. [NIST CSF 2.0](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf).

| Funció CSF | Evidència del tall | Estat i següent evidència necessària |
| --- | --- | --- |
| Governar · GV | Decisions del Mestre, fronteres de tasca i registre de QA. | Parcial: propietaris, riscos i tancament verificable de l’entrega. |
| Identificar · ID | Inventari del commit, hashes, abast i troballes prioritzades. | Parcial: completar inventari operatiu i dependències desplegades. |
| Protegir · PR | ACL/RLS, sanejament de mitjans, port neutral i proves de desenvolupament. | Parcial: integració SQL real, desplegament i revisió criptogràfica. |
| Detectar · DE | Regressió, mutació i alarmes proposades. | Parcial: detecció operativa i exercicis de l’alarma social. |
| Respondre · RS | «No sóc jo» i regles de revocació dissenyades. | Parcial: procediment provat, responsables i comunicació d’incident. |
| Recuperar · RC | Frase, backup i cercle social especificats. | Parcial: restauració i còpies antigues provades amb criteris d’èxit. |

Les notes que seguixen no són una puntuació oficial del CSF ni un dictamen jurídic de RGPD. La revisió acredita controls observables del seu abast; no tota l’operació de l’organització.

### Butlletí de Qualificacions

Escala de QA aplicada a l’abast revisat: 0,0 = requisit absent o inviable; 5,0 = proposta/implementació útil amb garanties principals obertes; 7,0 = substancialment resolt amb defectes o validacions pendents; 9,0 = integració i regressió acreditades amb límits menors; 10,0 = tots els criteris d’acceptació d’este abast satisfets. Les notes són judici tècnic justificat, no una mesura automàtica de tot el codi del projecte. La mitjana és aritmètica, sense ponderació, sobre les **nou** dimensions; la fila 10 no es torna a comptar.

| # | Dimensió | Nota | Justificació tècnica i què falta per a 10,0 |
| --- | --- | --- | --- |
| 1 | Arquitectura General i Sobirania · Pedra Seca + Port Neutral Model B | **8,0 / 10** | Components i port delimiten responsabilitats; el decorador E2EE proposat respecta adaptadors injectats. Falta certificar les noves capacitats en tots els adaptadors, clients antics i fluxos de càrrega/enviament/adjunt. |
| 2 | Qualitat Visual, UX Mòbil 320–393 px i Accessibilitat WCAG AAA · P1-66, P1-67, IDEA-40 | **7,0 / 10** | Compositor, font i controls milloren i passen proves; geometria pública limitada sense desbordament. Falta matriu visual autenticada amb R1/R2, Safari i teclat virtual, assistència real i tots els criteris AAA; el verd no passa 7:1 per a text normal sobre blanc. |
| 3 | Identitat, Privacitat RGPD i Integritat SQL/RLS · P1-68 + Emowe M2 | **7,0 / 10** | RPC, reserva, límits i baixa estan més ben delimitats; GPS net al repositori. Falta corregir QA-H01, resoldre homònims, provar concurrència/RLS real, validar backfill i acreditar mitjans desplegats nets. No s’ha auditat tot el compliment RGPD. |
| 4 | Editor Universal /notes, Proposa Card i Rendiment de DOM | **8,0 / 10** | Memoització independent i replegament Aa coberts per proves permanents, inclòs cos gran. Falta perfil de rendiment al navegador i regressió visual/autenticada amb selecció, focus i documents grans en mòbil. |
| 5 | Compartició OpenGraph, SEO i Fidelitat del Mapa Fotogràfic EXIF | **7,0 / 10** | SEO 58/58, duplicats exactes i antimeridià comprovats; cancel·lació reforçada. Falta tancar QA-H04 amb la cadena de release remota, primera foto real, revocació i rastrejadors sobre el desplegament resultant. |
| 6 | Disseny Criptogràfic P1-12 + Recuperació Social IDEA-48 | **6,0 / 10** | P1-12 respon de manera sòlida a bona part de GM2-09; el cercle social queda menys madur. Falten SAS revisat, revocació del cercle, formats Shamir interoperables, àmbit d’actor coherent, vectors independents i revisió externa; la nota avalua **disseny**, no E2EE en producció. |
| 7 | Cobertura i Rigor de la Suite · Vitest + Node + Mutants | **8,0 / 10** | Regressió extensa, 58 SEO i tres mutants seleccionats detectats. Falta reparar les dues famílies heretades, incorporar la regressió nova d’identitat i ampliar integració SQL/dispositius/cripto. No es disposa d’un percentatge de cobertura global ni d’un índex global de mutació. |
| 8 | Preparació per a Botigues · TestFlight, Play, PWA i WordPress.org | **6,5 / 10** | PWA i paquet WordPress verificables; sense evidència independent d’acceptació o instal·lació nativa d’esta entrega. Falten desplegament net, smoke tests reals, persistència/compartició en aparell i recorreguts de les botigues. |
| 9 | Governança Multi-Agent · L’Olivera, Portes i Tancament | **7,5 / 10** | Delegació contrastada, MCR i huit portes ambientals en verd. Falta reconciliar el rebut/pla del torn, relleus i canvis concurrents amb una autorització d’escriptura adequada, i segellar el tall exacte validat. |
| 10 | **NOTA MITJANA GLOBAL DEL SISTEMA SÓC DE POBLE** | **7,2 / 10** | **65,0 ÷ 9 = 7,222…**, arredonit a una decimal. El 10,0 exigix tancar els defectes i totes les evidències pendents de les nou files, mantindre regressió completa verda i acreditar la versió desplegada. No equivaldria a una garantia absoluta d’absència de defectes. |

### Condicions de tancament i traçabilitat final

El Gauntlet acaba amb **dictamen verificat de conformitat parcial**, dins del mandat de només lectura. Els punts oberts no es corregixen en esta ronda: queden com a criteris explícits del següent pla del constructor. Prioritat: QA-H04 per al release OpenGraph; QA-H01 abans de donar per integrada la migració; QA-S01/S02 i l’aclariment QA-E07 abans de certificar les fases criptogràfiques afectades. Després, completar les proves d’integració, dispositius, accessibilitat, operació i governança descrites, sense reobrir decisions ja preses pel Mestre.

Empremtes SHA-256 de les fonts documentals revisades: disseny final **`0ca033870815c1f4e4861276d1d5f048a5f5bc559136f417e6053cedd32c58dd`**; decisions **`b80a4f975bd3103af15e7cf12cb1304126a4f8342e2cdbd26f72cbe119f49209`**; informe Claude 2020 final **`1fc3f5706cf9053cc084210c8b89ecb18a2d287294a7477f326fbbc914b24996`**.

Comprovació final a les **00:41:17**: les **3.056 fonts capturades** de les quatre carpetes protegides continuen amb els mateixos hashes del viu inicial, sense fitxers nous no seguits, i HEAD continua a e36606db2. [Rebut de comparació](/private/tmp/sdp-qa-final-e366-k86jd1uc/live-recheck-final.json). Cap fitxer de `src/`, `tooling/`, `tests/` o `supabase/` ha sigut escrit per esta revisió; proves, mutants, memòries cau i logs propis s’han generat fora de l’arbre viu. No s’ha aplicat SQL, publicat cap paquet, fet cap desplegament ni modificat Git. La validació documental es fa amb `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261028_1611_auditoria_codex.md`; el [resultat](/private/tmp/sdp-qa-final-e366-k86jd1uc/document-final-check.json) queda amb les evidències de la ronda. Totes les proves pròpies han acabat; no s’ha iniciat cap servidor, cron o watcher propi.
