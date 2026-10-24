---
type: informe
status: esborrany
description: Auditoria adversarial local de baixa Apple, RLS, moderacio, exportacio i CSP amb limits de verificacio explicits.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1ecae505-dfdb-4b44-8b6a-417c476248b4:3e0892a7-9f2b-4c2c-8fd6-457f7b57bd91
---
# Auditoria Codex de fortificació, DSA i dades personals

**DICTAMEN VIGENT · segon Gauntlet (directiva 2026-10-24 14:40): NO CONCEDISC EL VISTIPLAU DE PUBLICACIÓ.** Hi ha implementació real i correccions verificades, però també una cursa de sessió en la revocació Apple, metadades d’UGC conservades després de la baixa, protecció DNS incompleta en les fonts personals i gestió de fonts que encara presenta les targetes rebutjades. La primera passada es conserva com a evidència històrica; no descriu l’estat actual del nou codi.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1ecae505-dfdb-4b44-8b6a-417c476248b4:3e0892a7-9f2b-4c2c-8fd6-457f7b57bd91 |
| Versió del document | 2.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T11:17:31.841Z |
| Modificació | 2026-10-24T13:06:22.020233+00:00 |
| Propietari | Codex · auditor de seguretat i contractes |
| Aprovació humana | Auditoria ordenada pel Mestre en el prompt del torn; no acredita aprovació del text legal ni d'un desplegament |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, amb tres subagents Codex de revisió en paral·lel |
| Tokens consumits | No disponibles amb precisió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-24T11:17:31.841Z: esborrany creat pel circuit documental.

2026-10-24T11:21:00Z: primer relleu substantiu; Apple, RLS/exportació, Frontissa i CSP contrastades. Suite Vitest general encara en execució; Node i ESLint acabats. L'informe es completa abans del tancament.

2026-10-24T11:34:09.682Z: auditoria emesa amb la suite general acabada: 21.059 passen, 2 fallen i 100 omeses. Informes Claude/Gemini llegits de nou, encara en plantilla. No hi ha canvis de producte al tall final. Recursos propis de proves recollits; cap cron de la missió.

2026-10-24T13:04:00Z: segon Gauntlet sobre les implementacions del worktree. Reproduïda carrera Apple; confirmades metadades retingudes. Durant la revisió Claude corregix catàleg/tests, text Connectar, títol i verd; es revaliden i es retiren els bloquejants ja resolts. Subsistixen D-01/D-02/D-04/D-05/D-06/D-08.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Segona passada · codi aterrat i directiva de les 14:40

Encàrrec directe del Mestre; torn `torn_1d352a66-df43-46f4-91c5-c67a532fb7fa`. HEAD `a4e562bc8`, implementacions al worktree. Claude conserva l’edició del producte; Codex només llig i prova. T5b ha canviat durant la revisió: cada passada té el seu tall. Tall final 2026-10-24 15:06 CEST; els canvis posteriors necessiten una nova passada. Manifest inicial de 141 fitxers: `/tmp/261024_1440_codex_review_manifest_start.json`; tall final amb hashes a `/tmp/261024_1440_codex_review_manifest_final.json`. Els canvis sobrevinguts es revisen amb reexecució dirigida, sense atribuir-los a Codex.

#### D-01 · P1 · La baixa d’A pot revocar Apple de B (CWE-367)

`src/data/supabase/compte.js:114–117`: després d’`await sessioDelCompte()` es revoca Apple **abans** de comprovar `current()`. Una microtasca A→B fa que `teAppleVinculat()` (58–60) llija B i `request()` use el JWT actual de B (`runtime.js:51–53,81`). La comprovació posterior evita donar de baixa B, però arriba després de revocar-lo.

Reproducció aïllada contra el mòdul real, identitats/xarxa sintètiques: `/tmp/261024_compte_race_regressio_codex.test.js`, configuració homònima. Expectativa correcta `revocades=[]`: falla i rep `['B']`. La prova `[DEFECTE]` que espera el defecte passa 1/1; **no significa que estiga corregit**. Còpia temporal amb només `current();` abans de la revocació: **42/42** proves de compte. No aplicada al repo. Cal comprovar la sessió abans de qualsevol efecte posterior a l’await i mantindre la comprovació posterior. Confiança alta; cap Apple real revocat. `requires_human_decision: false`.

#### D-02 · P1 · La purga conserva títols propis al xat (CWE-459)

`2610241440_baixa_completa_ugc_i_fitxers.sql:62–66` conserva `xat_fils.titol/subjecte_titol`. Les RPC vigents encara els retornen a participants (`2610220240_xat_adjunts_i_quota.sql:457,468,499`); `xat_participant_vigent` (`2609282100_xat_de_pagina.sql:568`) no exigix que continue existint la publicació subjecte. Escenari: A publica un títol amb telèfon, B comenta, es purga A/publicació i B conserva la còpia. Netejar les metadades pròpies pot preservar els missatges aliens. El comentari «decisió del Mestre» no acredita una excepció de conservació aprovada. Confiança alta per trajecte SQL; falta PostgreSQL real, cap fuga remota observada. `requires_human_decision: false` per completar T8; qualsevol conservació excepcional necessita base i decisió explícites.

#### D-03 · Corregit durant el Gauntlet · Proves del catàleg T5b

La passada intermèdia donà 55 passen/13 fallen/una suite sense carregar, per referències antigues a `apunt`. Claude les ha corregides amb fixtures del transport separats del catàleg viu. Reexecució final: **190/190 en 11 fitxers**, 25,72 s, `/tmp/261024_lector_ssrf_codex_revisio_final.log`. L’antic 187/187 també pertany a un altre tall. D-03 deixa de ser bloquejant; no es declara roja la suite actual del lector.

#### D-04 · P1 de lliurament · Gestió de fonts encara en targetes

**Corregits i revalidats:** `ConnectarSection.jsx:608` diu `Es connecta a ${persona}.`; `manifest.js:21` diu «Lector de notícies». Navegador final: document «Lector de notícies | Sóc de Poble»; `.sdp-app-barra__titol` té fons `rgb(15,103,47)` (#0F672F) i text `rgb(255,255,255)`. Les proves dirigides del text també passen.

**Pendent:** `GestioFonts.jsx:181,220` conserva `forma="targetes"` i `NavTargetes`. El navegador final confirma targetes taronges inflades, fins i tot amb «Llista» seleccionada. No compleix la directiva expressa d’arbre/bloc de notes/llista neta. Inspeccionades les 22 captures del Mestre en dos fulls de contacte, sense alterar originals; que altres pantalles de descobriment de Feedly usen targetes no anul·la la directiva per a esta gestió. `requires_human_decision: false`.

**Geometria favorable:** viewport CSS efectiu 1200×833, CARPETES/NOTÍCIES/Hui: mateix `y=63.99739456`, `height=57.99478912`, text a `y=80.98957825`, padding horitzontal 16 px. No s’inventa una desalineació: coincideixen en el fallback observat. No acredita tots els breakpoints ni articles reals carregats.

#### D-05 · P1 de publicació · Text legal nou amb versió antiga

`legalContent.js:13` encara declara «Versió 2.1 · En vigor des del 16 d’octubre de 2026» després de canviar moderació/dades/supressió. El test nou `legal.dsa.test.js:116–121` **exigix conservar** el rètol 2.1 del 16 d’octubre de 2026. No és una asserció afluixada: perpetua la inconsistència. Falta avís efectiu i versió/data/registre de política coherents abans de publicar. Les proves de text no acrediten operació, entrega relay ni exempció DSA. `requires_human_decision: false` per completar el protocol de versió ja encarregat.

#### D-06 · P1 de lliurament · Alta de fonts personals inaccessible

El nou servei/adaptador ja llig `feedPersonal` i `noSeguides` ja impedix demanar les fonts desactivades (repro final: només les seguides i la personal). El diagnòstic inicial «sense servei» queda superat. Però `AppLector.jsx:124–126` encara imposa `destinacioEnllac=null` fora de llavor i `GestioFonts` no oferix el formulari d’alta: el camí del Curador per a afegir fonts noves no està connectat. T5b és **parcial**, no absent ni acabat. `requires_human_decision: false`.

#### D-07 · P2 · Dos controls incomplets

1. Quota de 60 seguiments/h: compta files vives (`2610241430_seguiments.sql:259–264`) i deixar de seguir les elimina (:296–299). Model local real/temps fix: **120 altes en la mateixa hora**, cap rebuig. Cal comptador/historial independent i prova del cicle.
2. `2610241400_normes_exigides_ugc.sql:123–138` només cobrix INSERT/canvi de section_id. Un PATCH de title/description/payload a publicació antiga, sense canviar secció, evita normes vigents. Les creacions noves sí passen pel control. Conclusió estàtica, sense PostgreSQL. `requires_human_decision: false`.

#### D-08 · P1 condicional · El servei personal permet funcionar sense validar DNS (CWE-918)

`supabase/functions/noticies/gestor.js:414–415` tracta l’absència de `resolDns` com a xarxa pública. `index.ts:42–61` passa null si l’API no existix i encén personals per defecte llevat de variable explícita `0`. La prova nova `gestor.test.js:419–422` exigix HTTP 200 en eixe mode; una sonda local amb fetch simulat confirma la petició a un domini d’aparença pública sense validar cap IP. Repro guardat a `/tmp/261024_lector_ssrf_codex_repro_final.mjs` i `.log`: absent → 200/1 fetch simulat; error → 502/0; bloquejat → 504/0. Els errors/timeouts del resoledor present sí fallen tancats. No s’ha acreditat que `Deno.resolveDns` falte al Supabase real: és una branca executable del wrapper, no una configuració de producció observada.

La branca sense resoledor s’ha de desactivar o rebutjar. Els README nous reconeixen esta branca i el rebinding com a risc residual; documentar-los no els tanca. Validar que la resposta és un feed actua després del fetch i no impedix la petició interna, i l’afirmació documental que la funció no porta secrets no acredita aïllament ni egress del runtime. A més, la validació (`418–425`) i el fetch per hostname (`456`) són separats: **no s’ha acreditat** fixació de la IP ni egress que impedisca DNS rebinding. És un risc pendent, no una intrusió demostrada al runtime Deno. La guia [OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) tracta expressament el vincle domini/IP i els controls de xarxa; [Deno](https://docs.deno.com/api/deno/network/) documenta `resolveDns`, però la disponibilitat/garanties del runtime desplegat no s’han capturat. Cal demostrar el tancament efectiu abans d’habilitar URLs arbitràries. Cap sonda ha accedit a xarxa interna real ni metadades. `requires_human_decision: false`.

#### Matriu de conformitat de la segona passada (MCR)

| Requeriment | Estat | Evidència i límit |
| --- | --- | --- |
| T1 Apple | [PARCIAL] | Edge/xifrat AAD/porta SQL implementats; D-01 i desplegament pendents |
| T2 normes/DSA | [PARCIAL] | Fail-open corregit, INSERT protegit; D-05 i edicions D-07 |
| T3 CSP | [PARCIAL] | Local correcte; HEAD públic 2026-10-24 14:52:08 CEST encara sense media-src |
| T4 visor del cos | [FET] local | Prova real Aplec: galeria 1/2, ✕, Escape i retorn de focus; proves UI/visor verdes |
| T5 sistema/fallback | [PARCIAL] | Sis referents, proves finals verdes; servei remot no acreditat |
| T5b fonts personals | [PARCIAL] | Lectura implementada; alta D-06 i seguretat D-08 |
| T6 relació/membresia | [PARCIAL] | Blocs separats/text corregit; quota D-07 i desplegament pendents |
| T7 exportació | [PARCIAL] | Moderació/adjunts propis inclosos; migració no aplicada i federació P2-09 pendent d’esquema |
| T8 baixa/Storage | [PARCIAL] | DELETE d’UGC/worker implementats; D-02 i operació pendent |
| Títol/fons verd Lector | [FET] local | D-04: codi, DOM i colors calculats |
| Fonts en arbre/llista | [NO FET] | D-04 i 22 captures |
| Alçària/espaiat capçaleres | [FET] en estat observat | Mateixos y/alçària/baseline |

**Proves favorables:** Apple/baixa **235/235, 10 fitxers**; moderació/exportació/seguiments **100/100, 7 fitxers**; UI/visor/legal/fixtures **277/277, 15 fitxers**. Diffs d’assercions revisats: NO_DISPONIBLE reforçat; SHA complet substituïx abreviació; fixture cru de Mac Mini preservat i variant seed afegida. No s’ha trobat relaxació silenciosa en este abast. Revalidació dels canvis d’integració posteriors: **211/211, 9 fitxers**, 25,90 s (`/tmp/261024_1440_codex_integracio_final.log`); inclou context de moderació, reintent després de rebuig SQL, Notes/Xat i text Connectar. Les suites poden solapar-se: no se sumen els recomptes.

**T7:** exporta moderació/adjunts/seguiments propis amb filtres explícits, sense identitats de tercers denunciants observades. P2-09 persistix a `2610241410_exporta_dades_moderacio.sql:101–128`: inferència per qualsevol UUID i files completes de taules de federació no versionades. Risc pendent de capturar esquema; no fuga demostrada.

**T5b:** la petició de fonts desactivades també ha estat corregida i reprovada. El servei fix i les regles de nom rebutgen URLs loopback/metadata amb zero fetch en sondes locals. Eixe verd no suplix D-08 per a noms arbitraris.

**Producció:** migracions/funcions noves continuen declarades NO aplicades/desplegades. HEAD públic conserva Last-Modified del 23 d’octubre. Sense prova PostgreSQL/Apple/Storage real, no es concedeix vistiplau operatiu basat en mocks o SQL textual.

### Contrast creuat final

Rellegits íntegrament el relleu de Claude i Gemini v1.1.0 (segona passada 15:02:30 CEST). Claude encara reserva edició i té seccions finals pendents: la declaració «implementadors acabats» no suplix el resultat d’integració. Gemini coincidix en targetes, carrera, retenció i versió, i acredita títol/verd/geometria. Els seus 762 casos són una bateria pròpia, no un recompte afegit als de Codex.

Matisos per evitar sobreactuar: G2-02 no prova que el Mestre haja prohibit tot ús de «MAS» en qualsevol context; l’ordre exacta del subtítol ja es compleix. La resta de propostes lèxiques són millores a valorar dins de la simplificació, no una nova prohibició global. G2-04 encerta la carrera, però `current()` és síncron i retorna una guarda, no un usuari obtingut amb await; el JWT es llig a `runtime.request`, no amb getSession dins d’esta funció. La recepta G2-05 cita `context_id/submission_id/p_user_id`, però el SQL real usa `subjecte_id/subjecte_tipus/p_uid`; no copiar eixa proposta literalment. Per a G2-06, contrastar també totes les columnes del trigger amb l’esquema real. Els 404 que Gemini ha capturat són evidència seua; Codex només confirma l’estat de fallback i absència de desplegament acreditat, sense repetir eixe recompte.

### Verificació final i lliurament a Claude

- Últim test afegit durant la revisió, `fontsPersonals.vista.test.jsx`: **17/17**, eixida0, 4,85s; `/tmp/261024_1440_codex_fonts_personals_vista.log`. Verifica lectura, retirada, exclusió de fonts desactivades i absència de destinació d’alta fora llavor.
- `npm run lint`: eixida 0, cap error/avís; `/tmp/261024_1440_codex_lint_final.log`.
- `git diff --check`: eixida 0.
- `document.mjs check` de l’informe: vàlid, zero errors.
- `tancament.mjs --check --turn-id torn_1d352a66-df43-46f4-91c5-c67a532fb7fa`: eixida 1, **planned**, 1.283 incidències. A les 1.282 deutes globals anteriors s’afig «Canvis de codi fora de l’abast documental» perquè l’auditoria documental veu el worktree compartit on Claude implementa. No s’atribuïx eixe codi a Codex ni s’elimina per fer passar la porta. Olivera/plantilles/autoritat/segell/skills passen; LEDGER/Wiki/SCC continuen rojos. Log `/tmp/261024_1440_codex_tancament_final.json`.
- ESTAT i LEDGER registrats amb executor/CAS; lease `7da3358d-526d-4939-aa5c-99c9f1078615` consumida. Footer anterior del LEDGER conservat; no se certifica el checksum trencat.

Últim delta de `AppLector.jsx` revisat: només explicita en comentaris que l’alta s’ajorna; la branca null continua igual. Els README del servei també reconeixen els riscos, sense canviar les guardes. No requerixen repetir proves de comportament.

**Retorn de Gauntlet abans de suite completa:** Claude ha de corregir D-01/D-02, completar D-04/D-06, harmonitzar D-05 i tancar la branca/garanties D-08. D-07 queda com deute concret de fortificació. Després, proves adversarials dels casos nous i suite completa sobre un tall estable. El desplegament i les comprovacions PostgreSQL/Apple/Storage/mitjans continuen sense acreditar; l’informe no autoritza publicar.

### Primera passada de les 13:15 · evidència històrica anterior a les implementacions

Prioritat alta indica un bloquejant concret del contracte de publicació; no significa que s'haja demostrat una intrusió. Classificació: C-01, CWE-613 (revocació de credencials); C-02, CWE-602 (condició imposada només al client); C-06, CWE-459 (neteja incompleta). C-03 és conformitat documental/operativa, C-04 és integritat de l'exportació i C-05 és disponibilitat per CSP: no se'ls inventa una CWE de fuga. Confiança alta en els fets del codi/capçalera citats; efectes en bases remotes i qualificacions jurídiques finals no acreditats.

### C-01 · Alta · P0-04: no hi ha revocació Apple ni credencial revocable custodiada

`src/data/supabase/compte.js:78–88` només crida `demana_baixa` i tanca la sessió Supabase. La purga efectiva de `supabase/migrations/2609282100_xat_de_pagina.sql:684–777` arriba a `delete from auth.users` (767) sense cua, comprovació ni crida a Apple. No existix `esborra_propi_compte()` al producte: el nom del prompt no és la ruta efectiva.

El prerequisit també falta: `src/natiu/entradaSocial.js:65–73` descarta `authorizationCode` i access/refresh tokens; `fluxEntradaNativa.js:15–18` i `auth.js:600–612` transmeten identificació, nonce i nom. Una crida local real a `credencialDe`, amb valors sintètics, confirma que el codi i els tokens revocables no sobreviuen. Un `id_token` no substituïx un access/refresh token de revocació. Confiança alta; no s'ha utilitzat cap compte real.

**Correcció exigible a T1:** intercanvi del codi al servidor vinculat al subjecte autenticat; `.p8` i JWT client secret exclusivament servidor; revocació idempotent i ordre verificable abans de purgar, també pel camí SQL programat. Provar usuaris A/B, 200 sense cos, timeout, error i reintent. La falta de tokens històrics necessita un camí documentat de baixa i instruccions de revocació manual, sense retenció indefinida. Font: [Apple TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple). `requires_human_decision: false` per implementar el contracte aprovat.

### C-02 · Alta · P0-18/P0-05: la prova d'acceptació es pot ometre

`src/app/contexts/ModeracioContext.jsx:327–343` absorbix `NO_DISPONIBLE` i resol l'acceptació amb `true`, encara que el servidor no la guarde. A 279–282 basta el record local; a 297 no es consulta el servidor si ja hi ha eixe record. El test existent `ModeracioContext.test.jsx:284–297` reproduïx i exigix el comportament. És deute reproduït per una prova verda.

Les insercions tampoc imposen el registre: `xat_envia` efectiu (`2610081543_xat_consentiment_i_metadades.sql:207–262`) és executable per `authenticated` sense consultar `private.normes_acceptades`; `xat_publica_adjunt` hi delega (`2610220240_xat_adjunts_i_quota.sql:399`). La política de `section_submissions` (`2609080000_initial_schema.sql:771–777`) comprova propietari i abast, però no normes. Un compte vàlid participant pot evitar la porta del client mitjançant la RPC. Esta última conclusió prové d'inspecció SQL, no d'una explotació PostgreSQL executada.

**Correcció conservadora:** persistir i validar al servidor la versió aplicable abans d'admetre UGC; si falta infraestructura en remot, mostrar error i no donar l'acceptació per guardada. Mantindre explícita la demostració local. Provar peticions directes i canvi d'àmbit. [Google Play UGC](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en) exigix acceptar les normes abans de crear o pujar UGC. `requires_human_decision: false`.

### C-03 · Alta · P0-18: P3 continua separat del codi viu i no tanca la moderació

El pegat `02_investigacio_ia/261003_1330_empaquetat_mobil_claude/PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch` passa `git apply --check`, però no està aplicat. Només modifica `legalContent.js`; no corregix C-02 ni la UI. El text viu encara declara versió 2.1 (`src/sections/text/legalContent.js:13`) i no incorpora la informació de moderació del pegat. Les rutes del prompt són antigues: les reals són `src/app/contexts/ModeracioContext.jsx` i `src/sections/profile/DetallPrivacitat.jsx`.

P3 encara requerix resoldre l'elecció de mitjans de contacte, un procediment proporcional de mesures, avís efectiu de versió, registre coherent de política/acceptacions i prova d'entrega a Apple Private Relay. El seu compromís de revisió en menys de 24 hores necessita operació acreditada. El text de tolerància zero de `textosModeracio.js:70–71` tampoc hauria de prometre expulsió sistemàtica per a qualsevol infracció.

**Límit jurídic concret:** l'exempció de micro/petita empresa de l'article 19 afecta la secció 3 amb excepcions, no elimina els deures dels articles 11–18. L'article 14 requerix informació sobre moderació, avís de canvis significatius i aplicació proporcional; els articles 16–17 regulen avisos i motivació. [Reglament DSA, text oficial](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2065). No s'ha acreditat ací la condició empresarial ni una exempció territorial. Declarar-se Individual a Apple tampoc ho acredita.

Falta, a més, demostrar filtratge de contingut: `src/sections/notes/NotesEditor.jsx:431–437` el deixa pendent. Un límit de denúncies i bloquejar imatges externes no acrediten un filtre de material inadequat abans de publicar. [Apple, apartat 1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content). `requires_human_decision: true` per als canals humans, criteri de mesures i exempcions invocades; no per a corregir els errors tècnics ja autoritzats.

### C-04 · Alta · P2-08: l'exportació no inclou moderació; també perd adjunts

L'única definició de `public.exporta_les_meues_dades()` és a `2609261500_identitat_perfil_f1.sql:963–1087`, anterior a moderació. No inclou `public.denuncies`, `public.bloquejos` ni `private.normes_acceptades`. `src/sections/profile/DetallPrivacitat.jsx:99–101` promet una còpia de tot; `src/data/supabase/compte.js:57` només valida el marcador de format v1.

Deute addicional de severitat mitjana: l'export de missatges només selecciona `fil_id`, `text`, `creat_al` (SQL F1:1075) i el catàleg de fitxers exclou `xat_adjunts` (988). Un àudio sense peu es desa amb `text = null` i referència en `metadades` (`2610220240_xat_adjunts_i_quota.sql:395–403`): el JSON perd la referència al seu contingut.

**Correcció de T7:** migració posterior amb columnes explícites i filtre per qui fa la denúncia/bloqueig/acceptació; no exportar denúncies contra la persona que revelen tercers denunciants. Incloure metadades i accés recuperable als adjunts propis, provar usuaris A/B i un àudio sense text. Confiança alta per inspecció; falta executar la migració en PostgreSQL de proves. `requires_human_decision: false`.

### C-05 · Alta · P0-19: la capçalera pública encara bloqueja mitjans remots

HEAD read-only de `https://socdepoble.org/xat`, **2026-10-24 13:17:15 CEST**, HTTP 200: la CSP no porta `media-src`, i `default-src 'self' data: blob:` no permet mitjans HTTPS externs. `Last-Modified: Fri, 23 Oct 2026 15:10:02 GMT`. La directiva local de `firebase.json:22` sí és `media-src 'self' data: blob: https:;`.

Dev retorna HTTP 200 amb una CSP de capçalera limitada a `frame-ancestors`; la meta de `index.html:17` sí admet mitjans HTTPS. Un segon CSP més restrictiu en capçalera continua aplicant-se encara que la meta permeta el recurs. Açò verifica polítiques; no substituïx reproduir àudio/vídeo en navegador.

**Tancament:** desplegar només pel procediment autoritzat, tornar a capturar la capçalera pública i provar reproducció real. No hi ha hagut desplegament en esta auditoria. `requires_human_decision: false` per al diagnòstic; la publicació no s'ha executat.

### C-06 · Alta · baixa de compte: dissociar autoria no elimina UGC ni fitxers

La purga vigent (`2609282100_xat_de_pagina.sql:731–739`) conserva `section_submissions` personals, substituïx el propietari per UUID zero i elimina claus concretes amb `private.claus_personals_payload`. Eixa funció (`2609261500_identitat_perfil_f1.sql:936–959`) no neteja HTML, cos ni dades personals incrustades. `title` i `description`, escrits com a columnes separades per `src/data/supabase/content.js:122–125`, queden intactes. Un contingut que continga un telèfon o una fotografia identificativa persistiria encara que desaparega l'avatar de l'autor.

`tests/migracio-identitat-f1.test.mjs:183–189` exigix no esborrar estes publicacions. La mateixa purga (748–760) només encola fitxers i preserva els referenciats per les publicacions; `supabase/README.md:575–583` declara que falta el worker. No s'ha acreditat el seu consum real ni s'ha observat PII de cap persona durant l'auditoria.

[Apple, guia de baixa](https://developer.apple.com/support/offering-account-deletion-in-your-app/) inclou l'UGC entre les dades a eliminar, llevat de conservació legal exigible. **Proposta:** contracte de supressió de contingut propi i worker de Storage amb proves de consum, reintent i referències compartides. `requires_human_decision: true` per decidir qualsevol conservació excepcional i la seua base; dissociar autoria no s'ha de descriure com anonimització completa.

### Controls favorables i límits de l'evidència

- RLS de moderació coherent estàticament: denúncies pròpies o superadministrador amb AAL2; bloquejos propis; triggers fixen identitat i camps sensibles. No s'ha demostrat fuga entre usuaris en este abast. Això no certifica la base remota.
- La Frontissa força GET, `credentials: omit`, `redirect: error`, límits i traductor (`src/data/adaptadors/sollutia/creaFrontissa.js:60–63`). `client.js:4–14` conserva el catàleg buit i falla tancat fins a tindre captures reals. No s'ha acreditat integració real amb cap endpoint de Sollutia.
- No s'ha trobat implementació de secrets Apple al client en la cerca acotada. No s'han llegit `.env` ni claus privades. L'absència d'una implementació tampoc prova una custòdia correcta del futur servidor.
- P0-05 continua sense evidència de desplegament de l'esquema. El README és documentació local i no prova l'estat de producció.
- L'exportador de federació inferix propietat a partir de qualsevol UUID coincident i exporta files completes de taules no versionades (F1:1005–1019). Es registra com a risc pendent de capturar l'esquema, no com fuga demostrada.

### Diàleg creuat i millores del prompt

Llegits el pla i prompt complets, el Llibre Mestre i l'índex sencer. La lectura delegada cobrix els 6 Markdown de `01_produccio/` i 5 de `02_investigacio_ia/`, inclòs l'informe Claude Security. El checklist és buit; `article-ayudawp.md` és HTML cru i s'ha llegit tot el text visible extret, sense executar ni auditar els scripts/CSS incrustats. L'informe antic explicita que és estàtic i que F8/F13 compartixen arrel: no es compten com dues explotacions noves.

Llegits també els nous `261024_1315_auditoria_claude.md` i `261024_1315_auditoria_gemini.md`: al tall de les 13:33 CEST tots dos encara són plantilles amb seccions pendents. No hi ha conclusions noves que puguen validar-se. Els tres subagents d'esta revisió són Codex, no substituts d'eixes IAs. Una segona revisió independent dels apartats C-02/C-04 i C-03/C-05 confirma cites i límits. Les capacitats opcionals del port neutral són compatibilitat arquitectònica: no es deduïx d'elles cap absència de mètodes Supabase ni cap desplegament remot; els controls s'han d'acreditar en el servei UGC concret.

Per a la pròxima convocatòria: corregir rutes i nom de la baixa; assignar explícitament T5–T7 al pica-codi (el repartiment inicial només enumera T1–T4); fixar hash/abast del pegat i llista exacta de les «215 proves»; separar test de regressió i prova que reproduïx deute; exigir evidència PostgreSQL/producció i no inferir-la de mocks. «Destructiva» s'ha d'operativitzar com proves adversarials en fixtures, sense comptes ni dades reals. La cancel·lació final ha d'afectar processos/schedules de la missió identificats, no el servidor compartit ni serveis aliens.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

La segona passada i els seus recomptes són a l’addenda/MCR de damunt. Els resultats generals que seguixen corresponen exclusivament a la primera passada, anterior al codi de Claude.

Totes les comandes executades amb cwd `socdepoble.org`, sense instal·lar dependències.

| Comprovació | Resultat final de la passada |
| --- | --- |
| Apple: Vitest compte/auth.testimoni/entradaSocial | 75/75 |
| Apple/baixa: Node identitat F1 + xat de pàgina | 70/70 |
| Exportació/moderació/perfil, cinc fitxers Vitest | 89/89 |
| Frontissa, dos fitxers Vitest | 8/8 |
| Contracte + kit + qualitat, Vitest | 74/74 |
| Node natiu/standalone/amfitrió/frontissa/backend | 115/115, cap omesa |
| `tractor-rls.mjs` | 0 sobre 52 SQL; comprovació estàtica |
| `tractor-sollutia.mjs` | 0 |
| P3 `git apply --check` | 0; no aplicat |
| `npm run test:node` | Eixida 0: 1.028 passen, 3 TODO, 0 fallides, 0 omeses, 1.031 totals |
| `npm run lint` | Eixida 0, cap error ni avís |
| `npm test -- --run --maxWorkers=2 --reporter=dot` | Eixida 1: 21.059 passen, 2 fallen, 100 omeses; 21.161 totals; 923,23 s |
| Olivera inicial | Eixida 0, amb avisos heretats de sediment a l'índex |
| `tancament.mjs --check --turn-id torn_1ecae505-dfdb-4b44-8b6a-417c476248b4` | Eixida 1, `planned`, 1.282 incidències globals; no es declara tancat |

Els tres TODO Node són diagnòstics de classes/tokens CSS heretats (`lint_enxufe` i `lint_logica_usuari`); l'eixida 0 no acredita absència de deute. Les suites se solapen: no se sumen estos recomptes com si foren casos únics. Logs temporals de la passada global: `/tmp/261024_1315_codex_vitest.log`, `/tmp/261024_1315_codex_node.log`, `/tmp/261024_1315_codex_lint.log`.

**Les dues fallades Vitest, reproduïdes sobre fonts sense canvis:** `tests/laboratori-telefonades-261006.test.js:92` espera l'abreviació `76947e5d`, mentre `git log --format=%h` retorna `76947e5d7`; `src/sections/mercat/MercatSection.autoria.test.jsx:321` espera que el fixture Mac Mini no tinga `author_avatar`, però ara sí el té. Coincidixen amb les precondicions heretades ja registrades a ESTAT abans d'este torn. No s'han relaxat assertions ni editat fixtures per fabricar un verd. Fitxers: 1.237 passen, 2 fallen i 9 omesos, de 1.248.

En el tancament passen Olivera, plantilles, autoritat, segell i catàleg de skills; fallen LEDGER, Wiki i SCC. Els quatre errors de metadades del Llibre (rebut absent i tres tags fora de l'enum) ja estaven a HEAD: frontmatter comparat byte a byte, sense canviar-lo en esta auditoria. L'informe Codex no apareix entre els errors i valida separadament. El checksum LEDGER ja era invàlid abans del relleu. Log: `/tmp/261024_1315_codex_tancament_final.json`. Deute registrat també com a P1-10, sense modificar regles ni apagar portes.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Cap codi de producte, migració, credencial, compte real, publicació, commit o desplegament canviat per Codex. Només documentació del torn i verificacions locals/read-only. Els builds standalone s'han executat per la suite existent en temporals.

No hi ha PostgreSQL local disponible ni Docker en marxa: RLS i migracions no s'han exercitat amb un servidor real. No s'ha consultat l'esquema remot ni Play Console/App Store Connect. No es revalida ací l'afirmació de TestFlight ni de signatura al Llibre Mestre. En la primera passada no es féu QA visual. En esta segona sí s’han observat el lector, la gestió de fonts i el visor en el navegador local; no s’ha acreditat playback ni WebPerf, que continuen en l’abast Gemini. Les «215 proves de P3» de la nit no s'han repetit en una còpia amb el pegat en esta passada.

Cap cron/schedule creat. Les cinc automacions Codex locals inspeccionades estan `PAUSED` i no corresponen a este torn; no hi ha cap tasca de la missió al registre local de crons. En el segon tall tots els processos propis de proves i els tres subagents han acabat; viewport restaurat i pestanya temporal tancada. No queda cap procés ni schedule propi de la missió. La baixa i l'exportació encara requerixen correccions de Claude i una altra revisió del canvi concret. L'Acta Marmota general correspon a l'orquestradora.

ESTAT i LEDGER actualitzats amb l'executor de mutació, CAS i lease consumida (`5d854f04-ab16-453c-80fa-5b4267f6faf0`); el resultat final de Vitest s'ha incorporat a ESTAT amb una segona substitució acotada i lease també consumida (`fe43f68e-407a-4ed7-87fd-fc0a7612e795`). El segell de skills conserva el mateix digest. S'ha preservat el checksum anterior del LEDGER ja trencat, sense donar-lo per reconciliat. El registre de la segona passada usa a més la lease consumida `7da3358d-526d-4939-aa5c-99c9f1078615`. Els rebuts i les transaccions mecàniques són evidència del registre, no una autorització per publicar.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio]]
- [[261024_1315_prompt_claude_gemini_codex_fortificacio_i_auditoria_adversarial_trio]]
