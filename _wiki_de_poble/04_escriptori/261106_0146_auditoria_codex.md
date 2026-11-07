---
type: informe
status: esborrany
description: Auditoria viva de GPT-6.1 Sol Ultra (Codex) per a l'Onada R7.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9db8dcac-b45e-467e-8733-c3944e24fd3b:78efba84-4d24-409a-99f6-aee8cb821634
---
# Auditoria Codex — Onada R7, Kits CAS R13-R17+ (NixOS, E2EE Shamir, RPC Multipoble i Karpathy)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9db8dcac-b45e-467e-8733-c3944e24fd3b:78efba84-4d24-409a-99f6-aee8cb821634 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-06T00:47:53.016Z |
| Modificació | 2026-11-06T00:47:53.016Z |
| Propietari | agent-local |
| Aprovació humana | validada |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6.1 Sol Ultra (Codex) |
| Tokens consumits | ~22% finestra activa (Obrer Backend, Criptografia i NixOS) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-06T00:47:53.016Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

- **Sèrie completa de Kits CAS d'Onada R7 (`R13` a `R19`) dipositats a `../_investigacio_ia_de_poble/` sobre `HEAD d79a0b530`:**
  1. **`261106_kit_codex_r13_fediversity_nix_e2ee_multipoble_i_usuaris`:**
     - `IDEA-104a`: Configuració NixOS (`nix/flake.nix`, `module.nix`, `containers.nix`).
     - `IDEA-103b`: Client d'administració d'usuaris (`adminUsuaris.js`, `adminUsuarisLocal.js`) i migracions SQL (arbitrat per Claude: les migracions SQL `2611052345` i `2611060010` queden fora de `COMMIT R7` per mantindre les 76 migracions vives en verd sota PGlite i reescriure el model de consentiment d'`IDEA-103`).
     - `IDEA-104b` / `IDEA-104c` / `IDEA-104d`: Biblioteca E2EE + Shamir $k=3$, `importacioPaquetMunicipal` i compilador determinista `karpathyWikiCompiler.js`.
  2. **`261106_kit_codex_r14_corpus_dialectal` → `261106_kit_codex_r15_auditoria_ingesta_i_deute_historic` (en cadena):**
     - `IDEA-106` i `IDEA-107`: Ingesta estructurada del corpus dialectal i auditoria de deute històric (integrats per Claude a `scratchpad/r7g/copia_integracio`).
  3. **`261106_kit_codex_r16_cerca_recompte_accessible`:**
     - Recompte accessible amb `aria-live` als cercadors i filtres (integrat a `copia_integracio`).
  4. **`261106_kit_codex_r17_fediversity_contracte_vigent`:**
     - Sincronització de recomptes i contracte de `/page/fediversity` (aplicat després de `R13` a `copia_integracio`).
  5. **`261106_kit_codex_r18_video_editorial_segur` (5 fitxers, 01:55 CET):**
     - Renderitzat segur d'iframes de vídeo (`youtube-nocookie.com`) a `htmlEditorial.jsx`, `CosAmbTargetes.jsx`, `detailRichText.jsx` i `Aplec2023Article.jsx` + test `detailRichText.videoEditorial.test.jsx` (clau per a `IDEA-109` amb Eugenio Monesma i per a `IDEA-111` amb els vídeos de `socdepoble.net` de 1988, 1990 i 1995).
  6. **`261106_kit_codex_r19_limit_autoria_uuid` (2 fitxers, 01:55 CET):**
     - `tests/uuid-editorial-authorship-boundary-r19.test.mjs` (7/7 en verd amb 76 migracions en PGlite) i `tooling/tests/node-suite-manifest.json`.
- **Històric d'Onades R1–R6:** Vegeu [[../90_arxiu_historic/261104_1636_auditoria_codex]].

<!-- CODEX:R20-R22:INICI -->
### Fase 2 de Codex · R20 → R24

Tall 2026-11-06T03:05:06.673Z. Còpia aïllada sincronitzada amb COMMIT R7b real 62ded5ad9cb55ac4bf1ab33e05d0f4939cbd95f3. HEAD viu observat 62ded5ad9cb55ac4bf1ab33e05d0f4939cbd95f3. Cap canvi de src/.git viu ni dels kits R13–R19. Preimatge històrica preservada en /tmp/sdp_r20_source_base.

- **R20/R20b/R21/R22:** quatre kits CAS en _investigacio_ia_de_poble,85 fitxers. Auditoria independent:4/4 aplicacions i Frontissa correctes,85/85 destins idèntics al candidat,82 precondicions i4 reaplicacions rebutjades sense escriptura. R20b també s’aplica sol sobre la base neta de76. Rebut evidence/r20/independent-cas-review.json.
- **R20:** opt-in IndexedDB per compte/backend/endpoint/kid/fil amb revocació/caducitat i revalidació en enviar; sis paraules i tres amics als cinc diccionaris. Traducció privada/E2EE bloquejada en transport i DOM. Carril inicial902 proves i1skip històric. F2a/F7 mantenen les guardes; material durable i wordlist revisada no s’han inventat. Aparador amb abast real de cada prova i compilador privat lazy: cancel·lació en esborrar/desmuntar,4 proves del widget,17 del motor/CLI. Reutilitza tooling/wiki/lib de R7b; font primària consultada https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f. S’explica que és inspirat en LLM Wiki, determinista i sense model.
- **R20b:** SQL77/78 proposats com a fitxers nous sobre76, cap base real alterada. Invitació member amb acceptació i revalidació de consentiment/municipi/caducitat/autoritat, correu emmascarat i audit immutable; cap autoassignació admin/editor.25/25 proves SQL reals PGlite sobre R7b compost, cap omesa; carril inicial102 Node+682 client i revisió independent65 SQL+9 negatives pròpies. UI d’acceptació i transport receptor Node0 pendents. No és una actualització in situ del vell SQL77 insegur.
- **R21:** deu pàgines WP amb import dinàmic, previsualització privada en Administració, esborrany i Edició avançada real en Notes; revisió lligada a hash/actor/sessió.151/151 proves sobre R7b i revisió independent52/52; TipTap preserva deu documents i tres vídeos en dos cicles. Sense aprovació/publicació automàtica; mitjans pendents bloquegen publicació.
- **R22:** Monesma3RQv3xjVr-M exclusiu del Pou de Neu; oli_knm0PiGE9A,vi vpTVDipdXi4,blat/molí/carro VBzEBQq_4LA; altres estructures sense documental heretat. Cotes18=15+3m,diàmetres9,75/10m,galeria29=24+5m,boca43cm i19elements contrastats amb els plànols. Herbari117/117 cites exactes amb pàgina/SHA;3 advertiments i114 toxicitats desconegudes, mai innocuïtat inferida. Taxonomia no revisada. Veu privada local. Visor R7 existent adaptat, sense duplicar-lo.35 proves de les suites reconciliades i31 visor/fonts correctes.
- **Auditoria r60–r63:** payloads íntegres amb bases completes declarades inexistents; no s’apliquen a cegues. r61 envia text privat a veu remota i repetia el vídeo; r62 inferia innocuïtat. r63 divergeix en5 precondicions i perd els3 vídeos amb R18 (3/3 DOM), amb aprovació deslligada de contingut/sessió i bypass de mitjans/autoria. R21 conserva eixes guardes. Rebut evidence/r23/r63-review.json. Filtre de col·lecció del Banc d’Importació: millora posterior.
- **R23:** kit separat verificat independentment;96/96 proves, inclosos dos HTTP efímers locals autoritzats automàticament. Ledgers76/78 lligats a identitats i SHA de tots els SQL; readiness antiga falla tancada fins a instal·lar explícitament el parell SQL/JS nou. Cap desplegament. Rebut evidence/r20/extension-delivery.json.
- **R24:** 86/87 imatges originals copiades i verificades;10.872.221B. Una URL del Molí2002 falla per certificat TLS de domini incorrecte i continua pendent, sense desactivar TLS ni substituir-la. Nou pàgines amb mitjans complets, però les deu pendent_admin i sense aprovació/publicació automàtica.154/154 proves,lint0. El gràfic Pou R22 queda0644 amb bytes idèntics. Detall evidence/r24/resultat.json.

ESLint net en76 fonts pròpies. Builds web/WordPress seed correctes: entrada 248628 B gzip sota250.000; arrencada estàtica completa 464027 B gzip, informada separat. Proves UI DOM/Vitest; navegador natiu impedit pel sandbox. FEDiversity100% desplegat no acreditat: Nix natiu/lock, converses/custodis reals, MFA/Mac mini, Mastodon bidireccional i3-2-1 físic exigixen els seus rebuts.

Heartbeat creat en este xat cada dues hores fins al6-11-2026 a les11:00 Europe/Madrid, id r7-revisi-nocturna-fins-al-mat. L’app i el Mac han d’estar disponibles. IDEA-112–118 detectades en lectura incremental: deute per a següents revisions.
<!-- CODEX:R20-R24:LLIURAT -->

Tancament del lliurament 2026-11-06T03:10:34.461Z: sis kits CAS,183 operacions i176 fitxers finals, bytes i modes coincidents en el replay complet. Auditoria CAS independent6/6 i Frontissa20/20; reaplicacions rebutjades sense canvi. R24 també contrastat independentment amb86 descodificacions físiques i4 proves TipTap/R18. Entrada final248.628Bgzip. Tancament formal de la còpia aïllada verificat0 després de completar i ancorar les còpies exactes de context documental; document check compartit es torna a executar amb esta nota. Índex de lliurament: _investigacio_ia_de_poble/261106_codex_r20_r24_lliurament.md. Una imatge TLS del Molí i les proves de serveis físics/productius continuen pendents, sense declarar100% en viu.

<!-- CODEX:HEARTBEAT:0545 -->

### Passada nocturna · 05:45 CET · R25 i revisions noves

Tall 2026-11-06T05:05:38.313Z. HEAD continua62ded5ad9. Lectura incremental per diff, sense modificar producte/Git vius. Baseline menut: evidence/heartbeat-0545/baseline.json.

- **R25 lliurat:**117 fitxes i145 localitzacions contrastades independentment amb els rètols del TXT primari;17 plantes amb múltiples zones preservades. Parterres1–4 i Abelles separats; línies reals, sense inventar pàgines. Cerca amb punt volat, punt simple i sense punt. Noms/usos/toxicitat/cites PDF anteriors intactes. Tres fitxers CAS després deR24.16/16 proves d’integració, Frontissa i builds web/WordPress passen; entrada248.637Bgzip. Rebuts evidence/r25/.
- **r67–r70:**81 payloads íntegres i preimatges coherents amb HEAD net, però rutes en conflicte amb R20–R25. Sense aplicació. Claude encara no publica veredicte explícit R20–R24: F2R/F3R tracten els seus pegats alternatius. Inventari i revisió en evidence/heartbeat-0545/.
- **r68 requerix correcció:** QR decoratiu amb matriu idèntica per als tres canals; URL iOS/Android són guies web, no botigues. Falten huit claus push als cinc idiomes. Gest síncron i avisos cecs conservats. La bandera client no acredita connector natiu, VAPID o entrega. Rebut r68-review.json. R27 en preparació: correctiu condicionat a postimatge r68 amb codificador QR real del repositori.
- **r69 requerix correcció:** exportació per defecte insuficientment privada per a persones vives/desconegudes/defunció futura; clear i write separats poden buidar la família; Web Locks anunciats però no adquirits.13/13 proves originals passen malgrat les reproduccions. Permís/sessió i abast de dispositiu pendents abans d’activar l’app, que continua apagada. Rebut r69-review.json. R26 en preparació: correctiu condicionat a postimatge r69, sense activar-la.
- **Node0 públic observat:** GET autoritzat https://socdepoble.cat/api/v1/node0/status a04:53UTC:200JSON, PostgreSQL/publicRead=true; userSessions/actorBinding/adminPublish/POSSE=false. No prova sessions privades ni push. L’auditoria Node0 afegix propostes dels models i estat creuat encara referit aR13, sense transformar-los en execució. Rebut node0-public-status.json.
- **Molí:** dos miralls del fitxer en socdepoble.net donen404; www.socdepoble.com manté TLS incorrecte. Continua86/87, sense substitució ni desactivació TLS. Detall moli-mirrors/results.json.

R20–R24 immutables. Els correctius condicionals no acrediten integració viva. Heartbeat actualitzat per reprendre des dels rebuts nous; conserva el límit nocturn i s’eliminarà quan acabe el motiu de seguiment.

<!-- CODEX:HEARTBEAT:0545:LLIURAT -->

Final de la passada 2026-11-06T05:38:27.018Z: R25 verificat i segellat; R26 correctiu condicional comprovat i aplicat sobre post-r69 exacte; R27 QR descodificable amb20proves, però aplicació integral bloquejada per quatre empremtes Frontissa heretades, sense resegelar-les. El laboratori principal conserva només la cadena R20–R25 i tancament formal0. Índex _investigacio_ia_de_poble/261106_codex_r25_r27_heartbeat_0545.md. No s’han aplicat r68/r69 al viu ni activat serveis.

<!-- CODEX:HEARTBEAT:0750 -->

### Passada nocturna · 07:50 CET

2026-11-06T06:52:42.171Z: HEAD continua62ded5ad9. Cap kit nou ni manifest canviat després de05:38UTC; Claude/Gemini i el pla mantenen els hashes. El prompt reconeix R25–R27 i encarrega r71 a Gemini; r71 encara no s’ha lliurat. Les rondes Node0 afegides són propostes dels models i conserven l’estat creuat antic R13, sense nous rebuts d’execució. Es mantenen els límits R26/R27 ja documentats. No s’han repetit proves/builds ni reauditat kits immutables, ni canviat fonts/Git vius o serveis. Rebut incremental en evidence/heartbeat-0750; pròxima revisió dins de la franja nocturna.

<!-- CODEX:HEARTBEAT:0950 -->

### Relleu final nocturn · 09:50 CET

2026-11-06T08:56:44.300Z: HEAD62ded5ad9 sense canvis; cap kit nou ni manifest modificat des de06:50UTC, r71 encara pendent. Pla/prompt/Claude/Gemini conserven els hashes; Node0 amplia propostes i actualitza el resum dels carrils, sense convertir-los en proves natives. Lectura pública nova a08:54UTC:200JSON, PostgreSQL/publicRead=true, userSessions/actorBinding/adminPublish/POSSE=false. No s’han repetit proves o builds, modificat kits/fonts/Git vius, desplegat o publicat.

Relleu final: _investigacio_ia_de_poble/261106_codex_relleu_final_nocturn_0950.md i rebut261106_codex_heartbeat_0950_rebut_final.json. R20–R25 queden verificats en la còpia principal; R26 és condicional sobre r69 exacte, amb permís/sessió pendents; R27 manté el bloqueig de quatre empremtes heretades. Cap100% productiu declarat.

Automatització r7-revisi-nocturna-fins-al-mat eliminada i confirmada per l’eina: la passada següent de dues hores quedaria fora de la franja autoritzada fins ales11:00 Europe/Madrid. Es conserva tot el treball i el relleu per a la integració posterior.

<!-- CODEX:R20-R22:FI -->


<!-- CODEX:R9:INICI -->
### Onada R9 · Codex · 6 de novembre, 14:20 CET

- Base comprovada: R8 70b651636. Laboratori aïllat nou: /tmp/sdp_r9_codex_fediversity; el laboratori R7 i tots els kits lliurats es conserven.
- Encàrrec actual autoritza R9, publicació i desplegament. Carrils locals: Push/QR/preflight; higiene RPC/headers/GPS/taxonomia; publicació del Pou i catàlegs contrastats. Pla nou 261106_1416_pla_implementacio_onada_r9_fediversity_push_i_cultura en el laboratori, torn torn_c3b3584a-5e57-4c27-8b6f-a7e1085dc2d8.
- Coordinació: detectat el workflow paral·lel de Claude R9 a les 14:14. Cap canvi viu de producte/Git ni desplegament per Codex fins a reconciliar les preimatges i l’estat de la integració. Les proves i pegats nous es lliuraran amb hashes; no s’aplica cap kit antic a cegues.
- Descoberta independent: R26 Codex és genealogia, cap kit Push R26 inequívoc; r68 rebutjat. Plugin Push natiu absent, Node0 sense capacitat Push, VAPID encara no acreditat. El catàleg AVL és de l’Associació de Varietats Locals de Mallorca. WP619 conté els dinou arbres originals, sense completar mesures no contrastades.
- Proves d’implementació, lliurament Push i desplegament R9 encara no acreditats al tall. No es confon codi local amb servei real.
- **14:32 CET · R28 congelat:** kit `261106_kit_codex_r28_higiene_r9_rpc_gps_sha256`, 19 camins, manifest SHA-256 `401f99d1b5fef899d6f8777d213c1415e228fd8d6fbd1902a937d8080ba4ae44`. RPC absent sense primera petició, preserves PGRST202/205, MIME SHA256, mostraBuides false i huit actius GPS netejats sense recompressió. Proves locals: 100/100 Vitest, 10/10 Node, lint net; sips→BMP acredita els mateixos píxels en 8/8. No s’ha aplicat al viu.
- **Textos i producció observada:** 117 proves editorials/rutes locals verdes abans d’incrustar la targeta nova (test actualitzat després d’ampliar-la). GET autoritzat real a les 14:26 CET confirma els dos dominis amb el mateix `index-BhqiZS2s.js`, SHA `872d4a50ed8a879c64979682fe49da3696981aca532e803ed6097f9e4909ea2c`, gzip 249.091 B. MIME SHA incorrecte en els dos servidors: text/html a org, octet-stream a cat. L’API pública Node0 torna 200 i 41 taules/32 documents; el text local conserva 40 com a recompte històric i informa 41 com a observació actual.
- **Pressupost i límits:** el primer build local amb Push encés mesura 250.234 B gzip; no és apte. S’ha extret el receptor a lazy i es mesurarà de nou després de congelar fonts. Cap lliurament Push, publicació de botigues ni desplegament R9 acreditat.
- **14:40 CET · Prerequisit remot de consentiment:** `backend-availability.mjs` ha fet GET anònim real de `politiques_privacitat` usant la configuració pública de producció (sense exposar credencials). HTTP200: versió vigent **2.3**, data `2026-10-31T23:00:00Z`, SHA `abd827d07af5aa30dc364f156a551deed4e9a43a830b9f57eca5a861ea4eadca`. La 2.4 del text R8 tampoc no està acreditada en eixe backend. Cal reconciliar el registre/consentiment abans de desplegar el client2.5. Cap migració ni credencial de gestió remota aplicada per Codex. Rebut local `.r9/evidence/backend-availability.json`.
- **Push i QR locals:** 30 rutes congelades, 1.607 proves úniques verdes, lint0. Codificador pur extret a `src/utils/qrDibuix.js` amb shim compatible de Facturació; cap import Admin→Gestoria, cap relaxació d’eixa frontera i mateix algorisme. El build conjunt anterior amb receptor lazy ha mesurat **248.033 B gzip**; cal una mesura final amb totes les peces.
- **Legal2.5 local:** hashHTML/SQL `1f434b4e2c1716cca6fed9a095344282c2bdff3c3fe960ecf889cf31bc783b4a`; versionsSQL2.3/2.4 intactes. 69 proves Vitest, 9 políticaPGlite, 51 regressionsSQL i 36 inventari/ordre verdes; 79 migracions locals. Aplicació real no acreditada.
- **R28 CAS:** aplicació completa sobre còpia neta R8 verificada, 19/19 rutes i Frontissa20/20. La comprovació directa del viu refusa correctament un mode600 preexistent de `connexionsPubliques.seed.test.js` que Git guarda com644; no s’ha forçat chmod ni aplicació al viu. Certificació estàtica local:100/100 enllaços després de reproduir el ZIP determinista del snapshot versionat.
- **14:53 CET · P1 consentiment reproduït amb SQL real:** amb només la política2.3 publicada, el trigger de registre accepta l’alta i grava2.3 encara que la persona haja llegit2.5; enviar metadata `versio_politica: 2.5` també baixa silenciosament a2.3. Prova aïllada amb PostgreSQL WASM i migracions originals, rebut `.r9/evidence/adversarial-consent.json`. La RPC de consentiment directa sí que refusa2.5 absent. Es prepara preflight de versió+hash abans de GoTrue: cap compte creat amb política absent/divergent, cap substitució tardana de la versió triada.
- **Publicació i Notes:** el post canònic ja està al Mur remot per la mateixa capa editorial, però la persistència de revisions necessita el primer registre real d’app_content i la seua versió autoritativa. No es fabrica `_editorialVersio`; s’està preparant una operació CAS limitada per a publicar-lo. L’edició local sí que té prova. La publicació remota encara no està executada.
- **Aparador:** 114 proves locals verdes després de separar el balançR9 de l’històric5Nov de Versions. Cinc llengües: serveis de traducció i IP explícits, dictat SuperWhisper/Parakeet pendent, resiliènciaR8/R9 ja al codi i E2EE apagat per defecte. Primera targeta real al cos FEDiversity, sense relaxar el recompte de negretes.
- Tall observat: 2026-11-06T14:25:57.440Z.

- **Connexió remota i arbitratge de Legal2.5:** la credencial PostgreSQL configurada correspon al projecte, però l’endpoint directe només publica AAAA i acaba en `EHOSTUNREACH` inclús amb xarxa autoritzada; TLS no relaxat, **0 consultes SQL i 0 escriptures**. Pla limitat a política2.5 + CAS editorial1→2, rebut `supabase-r9-bounded-plan.json`. No s’ha aplicat cap de les79 migracions al servei real.
- **Bloqueig d’integració immutable:** comparació AST de la font del carrilClaudeC3, sense executar-la: també usa versió2.5, però el seu cos té SHA `d58a226027fe78015a23fd28b834d8ce21c05ce0b3dfce2c951dcd64406fd1c3`; Codex té `1f434b4e2c1716cca6fed9a095344282c2bdff3c3fe960ecf889cf31bc783b4a`. Cal triar **un únic cos** abans d’aplicarSQL; el preflight client ha de portar eixa mateixa empremta. Cap kit pot donar per equivalent una altra2.5. Rebut `peer-policy-comparison.json`.
- **Consentiment corregit:**11 fitxers de preflight abans de GoTrue, versió i hash capturats en acceptar, 283 proves úniques +9SQL i lint verds. La política real observada continua2.3; sense2.5 exacta el client falla tancat i no crea comptes. Esta és una condició de desplegament, no un verd de registre en producció.
- **Natiu:** connector oficial necessari `@capacitor/push-notifications@8.1.3` fixat; una sola dependència afegida, lifecycle desactivat i node_modulesR9 independents, R7 intacte.15 fitxers natius preparats: APNs Debug/Release separats, reenviament delegat, FCM sense inicialització automàtica, SDK36 i comprovació real d’entitlementRelease.265 proves verdes; compilació del frontal natiu reeixida amb telemetria apagada, sincronització en verificació. FCM, perfils i lliurament físic no acreditats.
- Tall observat: 2026-11-06T15:25:19.275Z.

- **Compilacions natives reals:** Android Debug compila amb JBR21/SDK36, 187 tasques i APK de 88.919.262 B, SHA `79e7dc6fff056a7cf80d7873a8a9c9e65ce5f5a9d42743de06d6ec12f4a2f30c`. iOS Simulator Debug sense signatura: Xcode27.2, `BUILD SUCCEEDED`. Compilen també el frontal natiu amb telemetria apagada i el connector WordPress. Cap binari de Release signat, pujada de botigues, instal·lació física ni missatge Push.
- **Canvi extern executat i acotat:** alta de l’aplicació Android `org.socdepoble.app` al projecte Firebase existent `soc-de-poble`; appID `1:523935040612:android:ebc51e2b200d4469a9cb71`. El SDK JSON és privat/ignorat/mode600 i no entrarà al kit. Açò prepara FCM; no acredita el sender, APNs o l’entrega física. Hosting sense canvis de Codex.
- **Bateria controlada:** 372 fitxers Vitest, 8.203 proves aprovades i 4 omeses; Node314/314. Els dos timeouts criptogràfics amb quatre workers passen aïllats i en la mateixa suite amb dos workers, sense ampliar terminis ni relaxar assertions. Navegador net: 9 rutes sense errors, avisos ni fallides; La Torre no demana l’RPC absent. Prova local, no desplegament R9. Revisió visual del Pou vertical/horitzontal feta.
- **Cens abans de segellar:** sis portes noves detecten imports CSS no canònics, colors literals, classes dinàmiques i dos corpus de prova `.md` interpretats com documents operatius. Es corregixen abans de congelar R29, sense relaxar les portes. Les altres tres són `.sdp-paperera` absent, SEO WP no generat i Reflex que no certifica canvis durables fora de HEAD.
- **Rectificació editorial explícita:** la frase anterior «post canònic ja està al Mur remot» es referia erròniament a la projecció local en mode remot. El registre autoritatiu `app_content` **no s’ha publicat**. Només està provat el post local i l’edició local; la persistència remota requerix el primer CAS editorial, encara no executat.
- **Ruta alternativa de base de dades:** SSH al Node0 validat sense prompts ni túnel; l’únic TCP cap al mateix PostgreSQL:5432 també falla des d’allí. Cap consulta SQL, credencial transferida o servei canviat. No es relaxa TLS ni s’inventen endpoints pooler.
- Tall observat: 2026-11-06T15:37:29.989Z.

- **R29 lliurat i immutable:** `_investigacio_ia_de_poble/261106_kit_codex_r29_onada_r9_integral_consentiment_push_natiu_i_cultura/`. Manifest SHA-256 `2edc8e1a0be4246e4454b0a9357404365b30ed7ab39a647dc2835e7a8c31293b`; segell `SHA256SUMS` SHA-256 `f38be4b58a8fbd07c665c6f7060af9ff32686546f24ae8be3736958f4dbc0b90`, 261 fitxers segellats. **113 canvis +19 precondicions R28**; conjunt R28+R29:132 fitxers de producte. Check CAS i aplicació completa sobre una còpia neta R8→R28→R29: vàlids, Frontissa20/20. Cap aplicació al Git/producte viu.
- **Mesura final després de normalitzar estils:** `index-C43juUOO.js`, 714.971 B crus i **249.105 B gzip**; el graf de precàrregues es mesura separat i és major que l’entrada. CSS per porta única `modules.css`, tokens semàntics i estats `data-*`; fixtures `.txt` amb els mateixos bytes. 29 proves culturals i després 60 proves en huit fitxers verdes; ESLint98/98, detector18/18 i dist real475 fitxers de text sense troballes. La bateria completa8203+314 és anterior a esta última normalització visual; les dues fotografies de fonts estan preservades als rebuts.
- **Cens final íntegre:** 57 portes executades, **56 verdes**; només Reflex refusa certificar els bytes durables no integrats en HEAD. Porta Build omesa pel mode cens, amb rebuts de compilació separats. Cap porta/baseline relaxada. Les còpies natives generades que sumaven fals deute documental es preserven completes a `/tmp/sdp_r9_build_artifacts/`, amb hashes i modes abans/després; no s’han alterat els recursos públics ni les verificacions de la seua API. Restaurar o executar build/sync abans d’un preflight que exigisca assets generats.
- **Revisió final de serveis i relleu:** 15:33 UTC, GET real de la política pública continua en2.3; falta VAPID públic. 15:36 UTC, HEAD viu continua `70b651636`; les seccions ClaudeR9-3/R9-4 encara estan buides. El kit és una candidata alternativa completa: **reconciliar amb els carrils Claude, no aplicar-lo sobre un R9 diferent**. Cal un únic cos legal2.5 (hash coincident client/SQL), després el primer CAS editorial autoritatiu. PostgreSQL continua sense ruta pels dos accessos provats; no hi ha SQL, publicació del post, commit/push ni desplegament R9 de Codex. El preview propi4399 s’ha aturat; els serveis vius continuen intactes. L’única mutació externa de Codex ha sigut l’alta de l’app Android a Firebase ja documentada, sense canvi de Hosting.
- Tall observat: 2026-11-06T15:42:38.809Z.

- **Segona verificació R29 acabada, sense incidències:** 261/261 membres del segell, 113 payloads, 70 preimatges i 19/19 precondicions contrastades amb R28; hashes i modes correctes, cap configuració bruta. Manifest i kit intactes; cap prova repetida. Rebut durable al satèl·lit `261106_rebut_codex_r29_verificacio_independent.json`, SHA-256 `0b5f693a2fcdffe0a7a7c172780953ee9b41675dbfe0c854beeca5bad726c66d`, amb sidecar `.sha256`. La procedència diferencia explícitament la suite completa anterior a la normalització CSS de les60 proves, builds, lint i escaneig final posteriors. Relació d’aplicació i límits a `context.json` dins del kit.
<!-- CODEX:R9:FI -->

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Suites PGlite i Node en verd a la còpia d'integració (`migracio-verificador` 27/27, `node0-auth-proof` 16/16, `node0-r8-auth-functional` 15/15, `R19` 7/7, `administracio-multipoble-postgres` 40/40).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Cap mutació directa a `src/` ni `.git/` del repositori viu; lliurament exclusiu per Kits CAS.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261106_0146_pla_implementacio_onada_r7_genealogia_8132_pobles_fediversity_notebook_i_tresor]]
- [[261106_0146_prompt_onada_r7_genealogia_8132_pobles_fediversity_notebook_i_tresor]]
- [[03_llibre_mestre_tasques_i_idees]]
