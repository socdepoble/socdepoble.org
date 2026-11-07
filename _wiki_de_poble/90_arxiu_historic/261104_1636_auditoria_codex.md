---
type: informe
status: esborrany
description: Execució del carril Node 0, pont Mastodon i Gauntlet amb evidències i límits explícits.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_46554c4a-a614-42ba-9a06-7cfd913310af:cf7c298d-11a8-491f-8339-4329a1b1cd69
---
# Auditoria Codex · Node 0 PostgreSQL i Mastodon

## Onada R6 · Auditoria Gauntlet Adversarial (4ab2d1527..c49d173c4) i Kit CAS R12

### Checkpoint R6.0 · Arrancada i fronteres

- Encàrrec explícit del Mestre del 05-11-2026: auditar el delta `4ab2d1527..c49d173c4` més worktree i construir R12. Torn documental `torn_46554c4a-a614-42ba-9a06-7cfd913310af`. Model: Codex basat en GPT-6; variant exacta no exposada pel runtime.
- Olivera inicial passa (0). Una segona comprovació documental detecta un lock concurrent `261104_1636_auditoria_claude.md.r6.lock`; no es mou ni s'esborra cap fitxer de Claude. Es conserva el rebut de l'informe viu i la plantilla canònica d'auditoria, llegida íntegra. Esta és una ampliació del document existent, no una regeneració que destruïsca l'historial.
- Instantània de treball a `/tmp/sdp-codex-node0-mastodon/`, sincronitzada amb l'arbre viu, sense `.git`, secrets `.env`, artefactes de producció humana ni arxiu històric. Dependències existents enllaçades; cap instal·lació. Cap escriptura de Codex a `src/` ni `.git/` vius, cap desplegament ni enviament a Mastodon.
- Tres subagents de Codex en carrils ortogonals: Notes/editorial; fotos/administració/logotip; Node 0/POSSE/resiliència. No són Claude ni MarIA i no acrediten un consens extern a tres bandes.
- **R6-N01, P0 confirmat:** Notes selecciona `PublicacioDetall` de lectura per a publicacions i conserva l'historial «Ja publicat al Mur». Reparació en curs amb persistència sobre la publicació original, sense clonació de notes.
- **R6-V01, P1 confirmat:** la fusió de pobles Aplec/Viquipèdia trepitja dades pròpies de La Torre. Reparació i prova de precedència en curs.
- **R6-V02, precisió d'abast:** l'arbre actual no conté `PerfilAdmin.jsx`, `AdminTaxonomia.jsx`, `AdminRols`, `AdminTraduccions` ni `RevisioImportacioSection.jsx`, ni selectors `sdp-perfil-admin__*`. Els equivalents vius són el laboratori de taxonomia, banc d'importació i sis panells amb classes `sdp-admin-*`; el cens i el CSS es faran contra estes fonts reals.
- Evidència incremental de cada carril a `r6-evidencia/` dins de la còpia; es copiarà al kit segellat amb els resultats i límits.

### Checkpoint R6.1 · Reproduccions i reparacions en còpia

- **R6-N02, P0 confirmat:** Manifest/Aplec viuen a `app_content` amb id de text; el publicador d'aportacions exigix UUID. La reparació necessita un mètode neutral real i una RPC amb permisos de servidor, camps admesos i control optimista de versió. En construcció coordinada entre carrils editorial i backend; encara no es declara resolt.
- **R6-S01, P1 (CWE-79), confiança alta:** `transformaHtmlEditorialPedraSeca` retornava `<script>`, atributs `onerror`/`onclick` i `javascript:` dins d'`htmlNet`. El nom «HTML net» no acreditava sanejament; el reproductor comprova el resultat de l'importador, no afirma execució a totes les vistes. Ara parseig inert + `sanitizeHtml` final; HTML limitat a 1 MiB abans del parseig.
- **R6-S02, P2 (CWE-20):** confiança en iframes per substring (`youtube.com.evil.invalid`) i interpolació directa d'atributs. Substitució via DOM, protocols HTTP(S) sense credencials, hosts exactes i enllaç de vídeo segur; no es dispara cap iframe arbitrari del document importat.
- **R6-S03, P2:** resolutor històric perdia `?mes=...` i rutes canòniques d'URLs absolutes actuals; també admetia esquema `javascript:` amb host aparent. Corregits protocol, autoritat i conservació de pathname/search/hash canònics.
- **R6-S04, P1:** parsers WXR/Atom podien incorporar drafts i comentaris com si foren articles publicats; ordre d'atributs condicionava la detecció de Blogger. Reescrits amb XML inert, DTD/ENTITY rebutjades, límit 20 MiB, filtre publicació/tipus i parseig per nodes. Sense regex HTML/XML amb backtracking.
- Proves noves de l'importador: **5/5 roges abans**, després **9/9 verdes** (2 suites incloent regressió existent). Logs `importador-roig.log` i `importador-verd.log`; contrast independent en curs.
- **R6-B01, P2:** `node0Client` esperava `tables/publicDocuments/resilience.ok`, mentre el servidor publica `taules/registres` i flags d'integritat/autenticació del mirall. Corrector i regressions del contracte escrits. **R6-B02, P1 (CWE-400):** límit 512 KiB només després de `response.text()`; ara lectura incremental amb cancel·lació, límit de bytes i UTF-8 estricte. Contrast de l'arrel favorable; proves independents i límits al relleu Node 0.
- Regresió transversal executada per l'arrel: **9 suites, 575 proves verdes**, inclou i18n, HMR, connexions públiques, contrasenya, traducció, textos Fediversity i enllaços interns. Es conserva el llistat de **108 suites modificades al delta** per a cobertura addicional; això no és una declaració de 33.060 proves globals.
- **R6-V03, P2:** `PerfilShell` passa `grupsNavegacio` al panell que espera `navigationGroups`; les carpetes visibles queden buides. Corrector focalitzat pendent.
- Cens CSS: **55 selectors reals sense estil**. Amb el corrector, `tractor-vocabulari` reduïx classes forasteres **136 → 23**, passa sense relaxar el baseline. La instrucció antiga «restaurar a 436» no es correspon amb l'estat mesurat; no s'augmentarà cegament el deute permés.

### Checkpoint R6.2 · Segona passada adversarial

- **R6-I01, P1 (CWE-863), reproduït:** canvi de compte deixava pertinences antigues disponibles abans de la nova resposta. **R6-I02, P1:** error en refrescar netejava `useState` però conservava el cau HMR; un remuntatge podia recuperar pertinences revocades. Dues proves roges abans del corrector; ara **29/29** en identitat i HMR, amb revisió independent favorable i prova addicional de renovació del mateix usuari en curs. No s'afirma haver escalat privilegis al servidor: el defecte és selecció/atribució d'actor al client.
- **R6-T01, P2:** utilitat nova `useTraduccioTargeta` compartia traduccions entre transports diferents, podia col·lisionar en camps amb U+001F i retornava cau a una petició cancel·lada. **3/3 roges → 11/11 verdes** incloent suites existents i accions de traducció. Claus JSON, identitat del transport amb WeakMap i comprovació d'AbortSignal. La utilitat encara no té consumidor de producció; `UniversalCard` usa un flux propi ja existent. No es presenta el cau de la utilitat com a cau desplegat de totes les Cards.
- **R6-R01, P2:** `/el-projecte` i `/aplec-2023` no tenien ruta literal d'entrada. Afegides redireccions a `/projecte` i `/events/aplec-2023` amb consulta i fragment conservats. `/el-projecte` continua sent el projecte; no se substituïx pel Manifest. Prova amb l'app real i router propi: **15/15** en rutes canòniques.
- Corregit R6-V03 (prop del panell de carpetes): **1 roja → 35/35 verdes**.
- Passada de les **108 suites modificades al delta**: 101 verdes, 7 roges, 3.321 proves verdes / 7 roges / 6 omeses. Dos errors de suite provenen de React resolt des del cau temporal amb node_modules enllaçat; rerun amb `NODE_PATH` resol els dos. Les altres fallades han destapat incoherències derivades de restituir La Torre: avatar del xat encara hardcoded a Commons, tests GPS sobre coordenades trepitjades i tests de crèdits que atribuïen fotos pròpies a Commons. Reparació de consumidors i guardes en curs, sense afluixar assertions.
- Portes executades: Frontissa **20/20**, còpia editorial **0 errors**, Design Guard **0 crítics i 0 avisos**. La ruta del pla `tooling/gates/check-editorial-copy.mjs` és inexistent; l'eina viva és `tooling/seo/check-editorial-copy.mjs`. La porta de teclat enumera superfícies i no acredita per si sola una prova manual completa.
- Contrast amb el Bloc 1 viu de Claude: coincidim en R5-D5, cens 700, fotos 1.jpg/2.jpg i proves antigues que blindaven el trepitjat. Els pegats es desenvolupen en paral·lel; el CAS impedirà sobreescriure una preimatge de Claude que haja canviat. No es declara consens complet a tres bandes abans del seu arbitratge final.

### Checkpoint R6.3 · Rectificació del Mestre i reconciliació S1–S4 / A1

- **Rectificació humana vinculant del logotip:** s'ha retirat íntegrament l'intent de `.page-title-logo-visor`, el sòl de 600 px i el scroll horitzontal. Va ser una interpretació incorrecta de Codex. El cànon final és **600 px quan caben i reducció proporcional quan no caben** (`width: min(100%, 600px); max-width: 100%; height: auto`). `PageFrame` conserva els atributs naturals `300×78` i el marcatge de lectura consensuat per Claude S1; només es retiren els comentaris «compacte» de Connectar. Les mesures `fixed600` queden INVALIDADES; les evidències vàlides són les captures/mesures `responsive`.
- Llegits els blocs S1–S4 vius de Claude (1270–1490) i el Gauntlet/A1–A2 de Gemini (394–430). Reconciliats X1 (avatar xat `2.jpg`), X2 (GPS `38.5919,-0.4184`), les 55 classes reals i l'atribut `href` de `SdpImage`. R12 conserva figures, peus, contenidors de galeria, vídeo declaratiu validat i enllaços en el roundtrip complet, incloent el problema D1 de Claude.
- La implementació única d'edició es diu `PublicacioEditable` i usa el pont complet R12; substituïx l'adopció parcial S2. No es crea una nota fictícia abans de publicar. Inclou esborrany IndexedDB per àmbit/actor, CAS per a `app_content`, ruta `events`, pàgines sistema i aportacions UUID amb el seu mateix id. A1/A2/D1/D2 incorporats al contracte de proves.
- Guardes S4: grup d'administració, sis panells, renderDetail i revisió WordPress protegits amb `useSuperadminEstable()`, també davant `?revisio=wordpress` i canvis de compte. El servidor continua decidint els permisos. **56/56** proves de permisos/qualitat, **58/58** editorials/permisos i **17/17** de pont/roundtrip en els lots del carril.
- **P1-d, carpetes:** nou contracte opcional `carpetesNotes` i RPC `crea_carpeta_notes`, taula privada `note_folders` amb RLS (usuari+pertinença al tenant), FK a `auth.users` amb baixa en cascada i ids UUID independents del nom. La UI espera el desat abans d'assignar `folderId`; els errors conserven el camp i no mouen la nota. **42/42** UI/local i **6/6** PGlite SQL (anònim, altre usuari, altre tenant, accent/idempotència i purga). Contrast independent ha detectat i està tancant la cursa de canvi de nota durant l'alta.
- El contracte afegit queda en **43 capacitats, 132 mètodes, 184 casos**; no es limita a canviar recomptes: inclou un cas neutral de creació de carpeta i refutació del mutant. **1.209/1.209** proves del lot contracte/local/Supabase/dossier.
- **P1-f/P2 de S4:** eliminat el fallback públic que presentava una entrada del simulador WP amb cos buit com a publicació. La resolució d'inventari és ara explícita per a superadmin i diferida; el magatzem de revisió és un mòdul lleuger separat del tesaurus de 514 KB. Getter de localStorage protegit (Safari/amfitrió aïllat). **2/2** proves de permís de previsualització i storage bloquejat; compilació/pes en verificació.
- Les dades antigues de sistema sense marca editorial mantenen la còpia vigent del seed (preserva IDEA-92). Després de desar, `editorial_format: html-r6` fa autoritativa la versió remota, inclòs un cos buit deliberat. Backfill del Manifest/Aplec només quan coincidixen el resum antic o l'absència coneguts; no sobreescriu edicions divergents.
- La migració 76 actualitza també el mirall públic del Node 0 només per al tenant pilot canònic; una prova de dos tenants amb el mateix slug impedix contaminar-lo. Restauracions xifrades històriques 75 i actuals 76 continuen admeses. Cap migració ni publicació remota executada en este torn.


### Checkpoint R6.4 · Regressió executada i tall de reconciliació

- Sobre el candidat aïllat: **117 suites Vitest, 3.547 proves verdes i 6 omeses**. Les sis omissions corresponen al pes del connector WordPress abans de construir el seu dist; no es compten com a verdes. Proves SQL/HTTP local/CAS amb PostgreSQL PGlite: **77/77 verdes, zero omissions**. La xarxa es limita a loopback de fixtures, sense tocar Supabase ni Mastodon reals.
- La comprovació estricta d'imatges pròpies també s'aplica als articles HTML: no es permet que un URL admés pel sanejador general per a OAuth evite la política pública del Mur. Lot d'articles/editor **20/20** després d'esta reparació.
- Build web verd amb variables seed i credencials fictícies de prova: entrada **247.991 B gzip -9**, sostre250.000 intacte. No s'ha llegit cap .env real per a compilar. ESLint focalitzat net, Frontissa20/20, Design Guard sense crítics ni avisos.
- El build addicional WordPress ha descobert una regressió real del pressupost d'entrada; s'està reparant abans del segell. La primera separació estàtica d'HTML no satisfà el contracte que l'entrada no espere imports estàtics: queda descartada. No es declara verd un test de pes omés ni es relaxa el contracte en silenci.
- Reconciliació explícita en un tercer arbre temporal, amb preimatges vives separades: **34 conflictes textuals resolts**, fitxers només vius conservats, fusió S1 canònica i pont R12 complet. L'antic test viu que esperava perdre href en editar ha passat a exigir-ne conservació. Les proves ara es repetixen sobre l'arbre combinat, no només sobre cada carril separat.
- Quatre selectors addicionals vius (`sdp-mode-rural__punts`, `sdp-admin-importacio__card`, `__card-cap`, `__accions`) incorporats al CSS reconciliat; deute foraster22 conegut, baseline intacte. També s'inclou el document neutral de l'API amb43 capacitats/132 mètodes/184 casos, sense substituir tota la wiki per una còpia antiga.
- Proves manuals acotades amb Chromium i CSS de producció: logo600 en espai756, reducció376/231 en columnes estretes i247 en mòbil375; sense overflow del document. Panell administratiu scrollTop250. Evidència responsive vàlida al kit; no acredita Safari/iOS ni sessió administrativa real.
- El tancament global documental encara detecta fonts vives canviades per altres carrils, captures humanes noves i enllaços d'índex/històrics inexistents o fora d'arrel. ESTAT i LEDGER propis actualitzats i signats; no es reescriuen les captures ni es dóna per tancada l'Onada general.


### Checkpoint R6.5 · Veredicte sobre l'arbre reconciliat

- **145 suites / 4.239 de 4.239 proves verdes, zero omissions**, en una passada independent sobre l'arbre combinat. Inclou les108 suites del delta i les noves/modificades de R12, més les proves vives de S2/S3. Les28 fallades del primer muntatge han quedat classificades: suport públic/natiu/documental absent de la còpia reduïda, fixture de paginació antiga i tres proves que exigien la limitació editorial S3; cap assertion de permisos o política d'imatges s'ha rebaixat.
- Les proves S3 d'Aplec ara exigixen les43 imatges en ordre, les34 fotos de galeria amb dimensions i sense anchors, figures/details, vídeo dins del content editable/eliminable i rebuig de marcadors/iframes hostils. La fixture de carpetes exigix ordre id.asc/500, filtres d'usuari/tenant i primera pàgina sense cursor. Lot afectat604/604 i lint net.
- Les fonts SQL, tooling Node0 i tests Node són byte per byte iguals entre el candidat de la passada **77/77** i l'arbre reconciliat; queda registrat en `sql-backend-fonts-paritat.json`.
- **Web final reconciliat:249.157 B gzip -9 <250.000**, arrencada estàtica447.040 B. El marge és843 B; no s'afirma que siga ampli. Build seed amb credencials fictícies, no una release de producció.
- **WordPress/autònom:2/2 BUILD REAL** (IIFE i ESM) i **7/7 proves de pes**. Màxim mesurat1.680.470 B amb imports estàtics buits,39 imports dinàmics i370 fragments. La partició manual s'ha retirat completament.
- **Decisió explícita de pressupost WP:** el test vigent permet un ajust motivat. Per l'HTML complet del Manifest i els estils/guardes exigits en R12, el límit passa d'1.663.000 a1.684.000 B, amb motiu i mesures al mateix test; increment real18.119 B respecte del build R5 d'1.662.351 B. Aplec continua fora de l'entrada, el corpus territorial de67.169 B es conserva dins, no hi ha façana ni compressor especial. Això rectifica la restricció provisional pròpia d'evitar tot augment; no era una ordre humana. El pressupost web250.000 no canvia.
- Frontissa20/20, còpia editorial0errors, Design Guard0crítics/0avisos i Vocabulari22forasteres conegudes, baseline intacte. Les dues formes de build conserven les invariants de càrrega i empaquetament.
- El viu continua canviant després del tall UTC19:06 de reconciliació. R12 tindrà preimatges fixes i un CAS divergent al viu serà un refús esperat, no una invitació a copiar payload en cru. La integració coordinada requerix aplicar al tall verificat o un suplement reconciliat. No s'ha executat apply contra el viu.


### Checkpoint R6.6 · Entrega CAS R12 segellada

- Destí: `../_investigacio_ia_de_poble/261105_kit_codex_r12_notes_editable_manifest_aplec_i_gauntlet/`. Manifest canònic `sdp.kit-carril.v1`, **151 postimatges (119 modificacions,32 altes),103 precondicions, cap retirada**. Conté preimatges, payload, README, evidències i22 fonts preservades en `context_base/` (incloent la reparació S1 de pobles, ja viva al tall). Estes22 fonts són precondicions verificades; no es tornen a copiar com a pegat.
- **SHA-256 manifest:** `131d3fb2da3147e2100d37f6165acc691110d9731bf7d58ad2164d619be4158b`. El sidecar `manifest.sha256` concorda. La versió provisional de81 precondicions s'ha retirat a TEMP abans de l'entrega; no és el kit final ni el pin vigent.
- Check CAS sobre base congelada: **valid:true**, Frontissa20/20. Apply únicament sobre **una segona còpia independent**: valid:true. Verificació explícita de les151 postimatges en candidat i replay i de les103 precondicions després d'aplicar: **0 discrepàncies** en bytes o modes. Cap apply al viu.
- Dry-run sobre el worktree viu: **refús CAS esperat a BotoneraClassificacio.jsx** per canvis posteriors al tall, sense escriptura. Annex amb15 divergències vives posteriors. Claude ha de reconciliar-les en un suplement o reconstruir el tall verificat; no usar copy/force sobre l'arbre actual.
- Cens final de literals: **457 textos,0 troballes**, sense .env, clauers, logs privats de Chrome ni rebuts own-*. És un detector de patrons, no una prova absoluta d'absència de secrets. **462 artefactes totals**,461 entrades a SHA256SUMS, totes contrastades. SHA-256 de SHA256SUMS: `670519639f440c09da2b46c22563d32415f981832410c09b1cab983305999805`. Kit immutable després d'este segell.
- El document propi passa `document.mjs check`. El tancament estricte global continua roig per canvis de codi/zona humana d'altres carrils i enllaços aliens, amb Olivera/plantilles/autoritat/LEDGER/segell/skills/wiki verds; no s'ha simulat la clausura de tota l'onada.
- Últim check global després del segell:27 errors, SCC roig; també detecta que el pla viu ha canviat després de vincular-lo al torn. El document propi continua valid:true. No es reaprova a cegues ni es falseja el tancament d’un arbre que altres carrils continuen editant.
- **Responsable següent:** Claude integrador, amb MarIA coordinant. Aplicar migració76 pel circuit habitual i validar el desat amb superadmin+AAL2 real i les tres lectures després d'integrar. No hi ha SQL remot, deploy, commit, tut Mastodon ni build natiu en este torn.

---

**Estat històric anterior a R6 · R10 resegellat: 173 postimatges, base R3–R9 de 209 fitxers, Bloc A i AH-27 completats. Precommit verd (8.010 Vitest + 301 Node), 1.092 proves focalitzades, CAS18/18 i helpers11/11. R11 POSSE separat (23 fitxers, 93/93 i replay9/9). Pendent d’integració; aturada total.**

PostgreSQL 17.11 i l’API pròpia operen al Mac mini M4, amb 32 documents públics persistits. OAuth d’eixida configurat a 0600 i `@depoble@mastodont.cat` validat; cap tut enviat. **R8 corregeix el veredicte R6 en còpia aïllada, amb R-5 de custòdia externa encara obert.** R3–R7 de Codex romanen immutables. La ingesta Mastodon periòdica és independent de l’eixida POSSE amb conformitat humana. Auth/escriptura de persones i SPA continuen desactivades en producció. Claude ha tancat el COMMIT R3 `4ab2d1527a05866ebb13af43697a0c4beffba591`; este informe propi es pot actualitzar després del tancament. Cap mutació nostra de `src/` ni `.git/` vius.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_46554c4a-a614-42ba-9a06-7cfd913310af:cf7c298d-11a8-491f-8339-4329a1b1cd69 |
| Versió del document | 4.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-04T15:46:31.506Z |
| Modificació | 2026-11-05T20:34:38+01:00 |
| Propietari | GPT Codex · Enginyer de Sistemes, PostgreSQL, Seguretat i FinOps · Carril 1 |
| Aprovació humana | Ordre directa del Mestre del 05-11-2026: auditoria R6 i Kit R12; rectificació explícita del cànon responsive del logotip |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex basat en GPT-6; variant exacta del runtime no exposada, sense atribuir un canvi a Sol/Astra |
| Tokens consumits | N/D · no hi ha comptador atribuïble exposat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-05T03:11:22+00:00: R10 resegellat sobre 064ec0137 + R3–R9 amb Bloc A/AH-27 i R11 POSSE separat. Proves i pins finals registrats; aturada sense objectiu ni desplegament.

2026-11-05T01:16:25+00:00: R10 finit entregat amb 80 postimatges CAS, 423 Vitest, 14 Node, build i replay9/9; AH-17/18/19/22. Aturada sense goal.

2026-11-04T15:46:31.506Z: esborrany creat pel circuit canònic. Goal natiu actiu, tres subagents de Codex en carrils ortogonals; no representen els agents externs Gemini o Claude.

Històric de Ronda 1: PostgreSQL/migracions, dimoni HTTP, adaptador neutral i pont bidireccional construïts en la còpia temporal. Cap mutació de `src/` ni `.git/` vius. Port 3340 preservat.

Ronda 3 entregada: Kit CAS executable amb 38 postimatges, tres preimatges i 98 artefactes totals; SHA del manifest i sidecar ancorats en este informe. Replay complet en TEMP i dry-run sobre el viu, cap escriptura nostra a `src/` ni `.git/`. Noves rondes han de generar un suplement i deixar immutable el kit R3.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### R10 consolidat · Bloc A + AH-27 · entrega finita resegellada

Ordre directa del Mestre del text adjunt: resegellar el R10 sobre el clon net
`064ec01379e1b5b38103ababe2fdb0607af5baf3` amb R3–R9 plegat. Entrega:
`../_investigacio_ia_de_poble/261105_kit_codex_r10_territori_aplec2023_i_dossier_v120/`.
**173 postimatges** (67 existents i 106 noves), **348 artefactes**.
Substitució atòmica del directori amb `renamex_np(RENAME_SWAP)`, després de
validar el kit copiat al mateix volum. El R10 anterior es conserva íntegre a
`261105_kit_codex_r10_anterior_80_fitxers_5b243f255d3a/`, amb els pins històrics de la secció següent.
R3–R9 romanen immutables. Cap escriptura nostra a `src/` o `.git/` vius.

**Bloc A.** La porta admet només els JSON directes de `turns/` i `contracts/`
com a evidència pública; el seu contingut passa totes les regles literals.
La funció `escanejaLiterals` és byte per byte idèntica a R8 (SHA
`bcd502de485b9d94f72224948d2b40f184183af5cdc051c7bafe60845b696540`).
Els 169 MB de rebuts es processen en lots de 8 MiB de blobs i pressupost
total de 256 MiB; continuen els límits de 8 MiB per fitxer, 12.000 fitxers i
1.000 troballes. **19 regressions verdes**: torn net, contracte amb secret,
logs/locks/punters, índex contra working copy i límits/lots.

HEAD 064ec0137 tenia 590 fitxers de runtime indexats: 574 rebuts JSON admesos
i **16 fitxers privats** fora d’eixos directoris. S’han retirat només de
l’índex del clon de prova, conservant els fitxers locals. El kit aporta
`neteja_index_runtime.py`: dry-run per defecte; `--apply` fixa els 16 noms/OID,
comprova el HEAD i ignora redireccions Git ambientals. `.gitignore` prevé
reintroduccions. Cap aplicador CAS modifica Git. La neteja és un pas explícit
del README; sense eixe pas la porta continua rebutjant els 16 privats.

`tests/enxufe-traduccio.test.mjs` i les dues autoritats font d’R8 usen ara
0644/420. S’ha localitzat també el mateix desajust al fitxer no executable
`src/data/local/adaptadorLocal.multipoble.test.js` d’R6: la compatibilitat fixa
només els seus hashes inicial/final i els modes Git 0644. No es modifica cap
kit antic ni s’ignoren modes en general. `plega_base_r3_r9.py` verifica els
209 estats abans d’escriure; sobre una base antiga ja plegada pot corregir
únicament els dos modes 0600 coneguts, sense reescriure els altres fitxers.

**Base requerida: 209 postimatges**, 205×0644 i 4×0755. `BASE_REQUERIDA.json`
enumera rutes, hashes, modes, orígens i normalitzacions; el verificador en
fixa el pin i comprova també les dependències fora del payload abans i sota
lock, i després de les escriptures. Pins immutables:

| Kit | MANIFEST SHA-256 | SHA256SUMS SHA-256 |
| --- | --- | --- |
| R3 | `cc709422d99a1ed7fc69330810f948fed687d851f12b9ba5fa470ce10a740a60` | `9f428d612bfde4d6a83e476d5fde6b2a88557ed78a122d2378130997066a07cf` |
| R4 | `4a0224886368516031b9da5ebd3339f15f8221c06795c871a361e74b4ef0932c` | `12778b2f0f18c027069aa87cf774bb1ae4d124370ed7a57f85f67e4c3fc2bc56` |
| R5 | `61f58c8567877a49991c78aded75d11e0c4dcb0ace6831239ea50e7039666ba6` | `2a7dd66ddc507a608b48ec0d2fe3e4756789785f8095aa157badae98d5d33a84` |
| R6 | `425f50d147442ad38eaa0ac2e03c2ee87ad8c1760e2b782a151bb097effdc906` | `5e690e0241e0913015b50d66a145df719083d0569af8c3264aa06e57948ef17e` |
| R7 | `30dd0be71f722b77963de10dae8c1a7998477ecf68a082c3fbeb1a5723d40dd6` | `b24d8d93eaaf2fcd8c01792d8fe3e52f477121cd8b9a210a831b92ee0ae9f782` |
| R8 | `f1ca89a7fb01c5e702f354589f040c29ac0e85f4f130c4933808f1e8116c0eae` | `7570d72047377f4a867bb66bcdfd0fb0120fb0c59f45dea58c4dc87cc120c030` |
| R9 | `63ba629938035d1cae9c89f79c1802a70d125c23d696a7bd3dfe3fbc94fc9498` | `e612a395e88b0bc87e2f51ef67626543a45f67dabd470d9e424007915eb3d355` |

**C6-auth-r6-02 · IPv6 /48.** Implementació a
`tooling/node0/xarxa-rate-node0.mjs:6–17`, funció `xarxaRateNodeZero`;
`auth-node0.mjs:1` la importa i `:135` l’aplica a la quota. Prova explícita a
`tests/node0-r8-auth-functional.test.mjs:23–28`: dos /64 del mateix /48
comparteixen quota, el /48 veí no, i IPv4 mapped equival a IPv4. Exemple:
`2001:db8:1234:1::1` → `v6:2001:db8:1234::/48`. Passada amb PostgreSQL
PGlite real: **15/15**, zero omissions. No cal buscar el literal /48 dins
del mòdul d’auth que delega en esta funció.

**AH-27.** Manifest WP 16893 restaurat amb els 17 blocs originals,
dues conversions WebP locals, huit imatges del cos, documents, crida d’Ebo,
organitzadores, cartells, adhesió accessible sense iframe i citació/llicència.
La data continua sent 17/11/2022 a les 23:50. Mur important històric,
enllaç bidireccional amb l’Aplec i prova conjunta dels dos articles als 21
pobles i Ebo. A La Torre es preserva «Gent de la Torre»; el nou Manifest
declarat al poble fa que el seu naixement editorial mostrat siga eixa data
històrica, sense canviar els altres huit pobles inicials.

Hidratació dels 21 participants més Ebo: 22 fotografies reals, 20 escuts
separats, coordenades, altitud, superfície, cens 2025, gentilici i text amb
fonts/revisions. Benialfaquí (33) i Beniaia (31) tenen cens propi; no reben
superfície/altitud/escut del pare. Beniaia no té article català autònom i cita
honestament Beniaya en espanyol i Q141120000. Les absències són null explícits.
La instantània local completa automàticament una fitxa parcial, també amb
foto o cau; la consulta externa continua darrere del botó. Privacitat 2.4 i
les 75 migracions es mantenen íntegres. Skill editorial §2.6 actualitzada.
Crèdits i domini públic també visibles al visor i en natiu sense habilitar API.

La passada completa corregeix 39 imatges històriques WebP sota extensió
JPEG/PNG, conserva camins/dimensions i documenta la recodificació (PSNR mínim
50,75 dB). El cens registra els 88 recursos R10/AH-27, amb exclusions i tres
àlies de còpies exactes. La revisió visual acota l’escut a 96×128 px i elimina
el crèdit genèric d’IA sobre el cartell original de l’Aplec.

**Verificació final al clon net i plegat:** porta `ok:true`, **4.670 fitxers,
0 troballes**; `npm run test:precommit` codi 0, **349 fitxers / 8.010 Vitest
PASS + 4 omissions existents**, i **301/301 Node**. Suplement focalitzat:
**1.092/1.092 en 45 fitxers**, Node addicional **44/44**, ESLint de **78**
fonts sense avisos. Build web verd: **244.460 B gzip -9**, sostre intacte
250.000 B; arrencada estàtica 440.741 B. La instantània és un tros pur
cachejable separat. **CAS 18/18 i helpers 11/11**; refusos sense reescriptura,
rollback capturable, modes, dependències, índex i entorn Git hostil.
El replay publicable reconstrueix la base des de Git i els set kits fixats,
sense usar les preimatges R10 ni dependre del LAB temporal. Captures i logs
en `evidencies/`. No es declara reproducció de YouTube ni matriu mòbil completa.
La previsualització temporal 4186 està aturada; 3340 no s’ha usat.

Pins R10 vigents:

| Artefacte | SHA-256 |
| --- | --- |
| MANIFEST | `5f2e631fe708fd467ecd8d5f885a493760b73cdf8ffead0a4eb1c471ffa7f9b5` |
| SHA256SUMS | `e441502c587cf4b31851d74fb2cb77a9efed8c0525380fee5b43c0cad47c5c78` |
| Verificador CAS | `ffe30e0f9c354674e600bf1175fc625ff2fda70561f03f1338f05a0651a8447e` |
| Base requerida | `494c98b4fea49f9872da1f1581654c2fadb1e0e4ff7dab93e2cf33c96a61689e` |
| Plegador | `b3d382525ec512bc6ad381c0f234a7ae12fd5001e14347ec9aa08f4a6ce7fb65` |
| Neteja d’índex | `4b46fd47c288007cd43ab1dbcb4339825894a876ac638d904de9fc2b96564d4c` |

### R11 POSSE · AH-09 · suplement ortogonal segellat

Entrega separada: `../_investigacio_ia_de_poble/261105_kit_codex_r11_posse_safata_servidor/`.
**23 fitxers** exclusivament `tooling/node0/` i `tests/node0-*`, **43 artefactes**.
GET preparades durable per a Sóc de Poble/El Rentonar, amb hash, revisió i
estats preparat/ja_publicat_canonic/possible_replica; Mercat i oli exclosos.
POST exigeix id/hash/revisió/confirmació explícita, sessió opaca i ACL SQL
abans d’encuar o fer qualsevol preflight de Mastodon. `main()` usa el servei
i repositori SQL real, sense auto-DDL privilegiat. Registre institucional,
certificacions del contingut públic, deduplicació canònica/històrica,
conformitats immutables, leases/checkpoints i retenció davant POST ambigu.
El lector de mitjans locals és acotat i rebutja traversals/symlinks/hardlinks.

**93/93 Node**, zero omissions, amb PGlite 0.3.16 i loopback sintètic;
ESLint 22 MJS net i **replay independent 9/9**. Dry-run sobre R10 consolidat:
aplicable, 23 fitxers. S’integra després d’R10. Instal·lació privilegiada del
ledger, dades/certificacions i activació d’entorn corresponen a l’integrador;
este encàrrec no instal·la res en producció ni envia cap tut real.

MANIFEST `5393b37a519b49c57fcf198e0f3f1f4094add765728fe485a2b08f5839acd682`; SHA256SUMS
`f5e1727ae078a4d4409d204b0130086027b1f00ab0869119298447132b52fcd9`; verificador
`46e36e2e1416733aefb0ff8caa062c720769b7bc9b41c3fca6ec868fce62f24e`.

**Aturada total després d’estes entregues finites.** Sense bucle d’objectiu,
automatització, cron o servei propi persistent. Integració/commit/desplegament
pendents del carril integrador, no declarats com a fets per esta execució.

### R10 inicial · entrega anterior de 80 fitxers, conservada

**Mandat nou del Mestre del 05-11-2026, després de l’aturada R9:** AH-17/18/19/22 (IDEA-74/75/76/79). Treball exclusiu a `/tmp/sdp-codex-node0-mastodon/`; cap nou goal, cron ni bucle autònom. Es reutilitza este informe, mantenint íntegre l’històric anterior.

**Kit entregat:** `../_investigacio_ia_de_poble/261105_kit_codex_r10_anterior_80_fitxers_5b243f255d3a/` (README_INTEGRACIO.md; ruta satèl·lit fora de l’arrel de la wiki), **80 postimatges** (26 existents + 54 noves), 142 artefactes totals. Inclou `fitxers/`, `preimatges/`, `pegats/r10.patch`, manifest, sumes, verificador Python i evidències. Publicació del directori complet amb un únic rename després de contrastar bytes i modes. Aplicació amb preflight de tot el CAS, descriptors `NOFOLLOW`, lock cooperatiu, substitució atòmica per fitxer i rollback d’errors capturables; **no** transacció multiarxiu davant SIGKILL o tall elèctric.

| Pin final R10 | SHA-256 |
| --- | --- |
| MANIFEST | `5b243f255d3a2bed1166e9a26bb9e9e122c565c3e3783a3d6c3314f95e0ee291` |
| SHA256SUMS | `6ab3f0a90132bf8622d73b7e45e6de226ee3593848804c33dc282e146c655bc1` |
| Verificador | `cfc222485bda5af3bd673d4c8763724969ae7bc65ecd058ba556b6f5f130c9d8` |
| Rebut replay | `d9561217d777bec023c52fd512cdb08e3cee7b448e2acbfc5dd7a0eefb35d9bc` |

**AH-17 / AH-19 · territori i autoria:** arbre navegable `Xarxa de Pobles → Comarques d’Alacant/València/Castelló → comarca → poble`, amb municipi pare per a Benialfaquí i Beniaia. Tres pestanyes a cada fitxa: `Tot` per defecte (`esDelPoble || parlaDelPoble`), `Gent de <Poble>` (`esDelPoble`) i `Xarxa` (`!esDelPoble && parlaDelPoble`); accés a empreses i entitats preservat. Alta dels 21 participants etiquetats i menció addicional de la Vall d’Ebo. L’esdeveniment real es comprova contra els 21: autoria de la Torre i Xarxa dels altres 20. Les noves fitxes no inventen censos, fotos o dates de naixement; l’origen històric de l’Aplec usa `author_location`, sense reescriure el naixement registrat del poble.

**AH-18 / AH-19 · Aplec íntegre:** font [WP 16880](https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/) i JSON original fixat a les evidències. Barra taronja `17/11/2022`, `boinaDataPublicacio: true`, celebració `29/01/2023` al SquareBadge de la targeta. Reportatge À Punt NTC `TlZWYbnGuCE` des de `youtube-nocookie.com`, façana negra amb altura acotada i sentinella manual oEmbed, sense descarregar el vídeo ni instal·lar cap programació. Sonda oEmbed **HTTP 200**, metadades exactes disponibles; **reproducció no acreditada**. Cap iframe de Facebook. La font viva conté **34** fotografies úniques (IDs 17044–17077), davant les 25 del mandat: es conserven **25 principals + 9 complementàries**, amb l’ordre original explícit. Nota post-Aplec íntegra de cinc paràgrafs (`30/01/2023`), text previ, Telegram, PDF del Manifest, bàners, A4 amb reserva històrica, tres logos clicables i logo final del Manifest. **44 recursos locals, 5.869.448 B**, amb hash i origen registrats.

**AH-22 · contingut en cinc llengües:** Hero única d’habitatge, treball i publicar mapa; tres seccions documentades de lloguer anual, compra directa, masoveria, cases tancades, oficis, campanyes agrícoles, cures i relleu. Fonts primàries INE, Diputació de Barcelona, MAPA i Oficina C del Congrés, amb límits d’abast. Traduccions editorials `ca/es/en/eu/gl`; el registre històric de Versions conserva la llengua original `ca` marcada. `/fedivers`, `/page/fediversity`, `/page/node-zero` i `/versions` distingixen producció R1–R3, kits preparats i pendents reals. Entrada **v1.2.0 pendent d’integració**; paquet conservat en 1.1.0. Les dades de producció s’atribuïxen al tall de l’acta i de l’auditoria, sense afirmar una sonda pública nova.

**Autoritat de preimatges:** es contrasta cadascuna amb el viu capturat o la postimatge del kit precedent. Es preserven set dependències r31 (cinc diccionaris, `PublicacionsDelPoble.jsx` i `PoblesSection.test.jsx`) i dues r8 (`pageContent.js` i el seu test Fediversity). La còpia de verificació incorpora el viu + r31 + **tota la cadena Codex R3–R9** abans de r10. El contracte carregat té 32 mètodes de nucli, 41 capacitats, 130 mètodes totals i **182 casos de conformitat**; no es confon este recompte amb les 276 proves de la passada històrica r8. `evidencies/preimage-origins.json` fixa rutes, hashes, modes i manifests d’origen.

**Verificació final:** **423/423 Vitest en 22 fitxers**, **14/14 Node**, ESLint **34 fitxers** sense errors ni avisos, Frontissa **20/20** i `npm run build:web` verd amb credencials públiques 100% sintètiques i dades seed. Entrada compilada 242.124 B gzip, dins del sostre 250.000 B; Rollup conserva l’avís de chunks majors de 500 kB. Les 80 postimatges del kit coincidixen amb els bytes i modes provats a la còpia integrada. **Replay independent 9/9**: dry-run sense escriptura, apply, modes, idempotència sense reescriptura, rollback exacte, conflicte tardà sense aplicació parcial, symlink, payload corromput, estat mixt i reversió davant error injectat. La primera passada sobre còpia incompleta es conserva com a diagnòstic, no com a prova verda; el rebut final és `evidencies/final-vitest.json`.

**Revisió visual:** Chrome sobre preview pròpia `127.0.0.1:4178`: Benillup obri Tot, Xarxa conserva l’Aplec i Gent queda buit sense atribuir-li autoria falsa; dates simètriques, article restaurat i habitatge ca/en llegible amb una Hero i tres seccions. Preferència restaurada a valencià, pestanya temporal tancada i servidor propi aturat. La matriu mòbil completa i la reproducció de YouTube no s’han provat; eu/gl tenen traducció implementada i proves de contingut, amb revisió lingüística humana encara útil.

**Preservació i límits de tancament:** `src/` viu (3.199 fitxers) i kits r8 (160 artefactes) / r9_resiliencia (38) mantenen tots els hashes i modes inicials. Cap ordre nostra ha modificat `.git/` viu. S’hi observen 159 objectes nous per activitat concurrent, sense alteració dels fitxers Git ja existents ni del HEAD `4ab2d1527`; per tant no es declara immobilitat global del Git compartit. `tancament.mjs` s’ha executat i retorna 1 perquè l’espai aïllat no té `.git` i la porta exigix `git diff HEAD`; queda el rebut complet, sense declarar la porta global verda. Correspon repetir eixa porta al clon integrador. Custòdia externa R-5, restauració completa en màquina neta, auth/escriptures de persones, connexió de la SPA i entrega federada real continuen pendents. **Entrega acabada i aturada completa, sense activar cap bucle d’objectiu.**

### R9 · Tancament final i aturada · resiliència i proves natives

**Entrega final segellada per ordre d’aturada del Mestre:** `261104_kit_codex_node0_postgres_i_mastodon_r9_resiliencia`,15 postimatges(4 existents+11 noves),base198. Els13 fitxers del bundle natiu eren només canaris i no són el delta de producte. **[CAS OK], replay8/8** amb base reconstruïda independentment, hashes/modes, idempotència, rollback, conflicteCAS i refusos de symlink. Cap canvi als kitsR3–R8 ni activació en producció.

| Pin final R9 | SHA-256 |
| --- | --- |
| MANIFEST | `63ba629938035d1cae9c89f79c1802a70d125c23d696a7bd3dfe3fbc94fc9498` |
| SHA256SUMS | `e612a395e88b0bc87e2f51ef67626543a45f67dabd470d9e424007915eb3d355` |
| VerificadorR9 | `68f0c4e488e5dfea2ce4c86d57948c174fdaa338d7cc7ccb9d86ebc29361506d` |
| Rebutreplay | `ba66f1118f3bd7ef8144c7fa5826bb48233a424cde8950fca557f57d31481c22` |

Rebut persistent al germà `261104_kit_codex_node0_postgres_i_mastodon_r9_verificacio/`,11 fitxers0444/directori0555, sidecarSHA `773d1384647d156cf717565ed9944c8b8662ff89ac7a6c899ec20e6fcae2b340`. Verificador ampliat només amb la ruta estàtica exacta; les altres fronteres es conserven. Les283 proves conjuntes passen sense omissions i les fonts coincixen amb la congelació. El precommit complet en clon net acreditat continua sent el deR8; no s’ha repetit perR9 i no se’n declara el verd. SensePGlite explícit, la bateria SQL nova declara un skip; la passada283sí que l’ha usat. La correcció POSSE històrica queda alLAB, fora del payload perquè no té consumidor.

**Aturada explícita:** el Mestre ha ordenat acabar el tall i aturar-se del tot. Tasca de preparació de clonR9 interrompuda; cap nova iteració, subagent o prova oberta després del tancament. Cap cron de tokens creat. La matriuD01–D15 deR8 es conserva sense cap10global; D15continua6/10 ambR-5 físic obert. La custòdia, integració/revisió deClaude/MarIA, SMTP/auth i publicació remota real mantenen els pendents declarats. El Goal es posa en pausa a petició del Mestre, no es marca complet.

| Pendent explícit | Progrés R9 | Abast de la prova |
| --- | --- | --- |
| Claude509 · esperar PostgreSQL | Espera120s amb retrocés250ms→5s i cancel·lació; rols/ACL insegurs, esquema i binari absent refusen definitivament abans de claus/listen | 12 proves portàtils. `psql`17 real al Mini ha reconegut sòcol temporal inexistent i tres reintents cancel·lats, sense connexió a la DB de producció |
| Claude510 · outbox | Retrocés exponencial acotat, Retry-After que només allarga l’espera i estat `exhausted` derivat de files durables; claim d’un job cada vegada | PGlite explícit. L’àrbitre reproduí un enviament amb lease caducada durant signatura: corregit amb CAS/renovació just abans del dispatch. Seguix sent at-least-once; no es promet exactament-un-cop remot |
| Claude511 · inbox estàtic | POST retorna503, Retry-After60 i no-store; GET/HEAD405 i OPTIONS204 preservats | 7 proves HTTP reals amb port efímer de loopback i clau sintètica temporal; cap canvi als serveis3350/4340 ni Vite3340 |
| AH09 · duplicació latent al LAB | Detectat que un tut verificat amb URL canònica exacta no es proposava com a possible rèplica. Correcció15/15 congelada al LAB separat | No s’integra un mòdul sense consumidor. El wiring AH09 al `main()` i els resoldors SQL continuen pendents; cap tut enviat |

**Integració canònica aïllada R9:**15 rutes,4 existents i11 noves. Passada conjunta **283/283 en33 fitxers, zero salts**, PGlite explícit; lint12 fonts JS/MJS zero avisos/errors. Congelació SHA `787748b3ddcce9572a7842d1c8f3f2ebb8cced57aa5736846d52b4849ba1eba3`. El canvi només viu al clon; els kits R3–R8 continuen intactes.

**Simulacre PostgreSQL17 natiu · prova de la primitiva, no de recuperació del Node0:** un harness revisat crea dues bases noves amb dades100%sintètiques; `pg_dump`→`age` amb identitat efímera només en memòria→pipe del worker→fd3 d’age→`pg_restore`. Contingut complet de dues taules comparat;2/2 bases eliminades després de comprovar nom/OID/propietari/marca i absència, ciphertext propi netejat, buffers propis posats a zero. `coreNativeStreamVerified:true`; **`nativeRestoreVerified`, `cliVerified`, `aclRestored`, `cleanMachineRestoreVerified` i `r5CustodyClosed` continuen false**. No es llig la privada real, l’env o Drive. Font revisada SHA `95e5c493c7c8c28c8cddf8f4244de2150f7590cd9713e5cfcdc49a163937baf2`; rebut `.r9-lab/restore-native/native-proof.json`. S’ha corregit el registre de creació indeterminada: una fallada després de createdb reporta el nom pendent, sense autoritzar-ne drop. No es promet neteja després de SIGKILL.

**Estat públic observat00:20UTC:** API200, PostgreSQL17.11,40 taules del recompte públic iOAuth configurat. Workspace continua amb el rebut històric R7 (`last_verified_snapshot`); no es presenta com la comprovació HMAC viva R8. La identitat `.org` retorna JRD correcte per la ruta LRDD anunciada al host-meta, encara que la consulta WebFinger convencional torne404. Cap prova d’entrega federada remota nova. La sonda de00:36 confirma per metadades que la privada age coneguda encara està al Mini: **R-5 obert**.

### R8 · Correccions al veredicte final R6 · candidat aïllat

**R3 de Claude tancat i suport del candidat alineat per lectura amb el commit exacte `4ab2d1527a05866ebb13af43697a0c4beffba591`.** Els 80 fitxers de suport del canvi R2→R3 s’han incorporat només al clon; cap solapament amb el delta R8 ni amb els payloads R3–R7. El veredicte de Claude (línies 369–430) continua vigent: R3–R6 de Codex no estan aprovats per integrar; R7 no està auditat per Claude. Una entrega CAS nova no revoca eixe veredicte. El HEAD sintètic de les proves de clon net és una fixture identificada, no el commit de Claude.

| Troballa | Correcció verificada al clon | Límit |
| --- | --- | --- |
| `C6-contracte-port-01` · P1 | Document, pàgina i prova: 41 grups / 130 mètodes / 182 casos declarats; 32 core / 98 opcionals. 276 casos de cinc fitxers passen. Adaptador local: 39 grups, sense els dos grups de correu | Precommit final exit 0 en fixture Git neta amb suport alineat amb R3; no és un commit ni un hook executat sobre el viu |
| `C6-auth-r6-02` · P1 latent | IPv6 /48; repte SHA-256 indexat abans de `scrypt`, revalidació sota lock i sostre global de dos KDF actius | Auth de producció OFF; cap prova de càrrega nativa o SMTP real |
| `C6-auth-r6-01/-04/-08` · P2 | Perfil inicial neutral i privat; metadades del preregistre descartades. Reset: 202 públic, espera fixa 100 ms, cua 16 / dos treballadors i màxim dos transports reals pendents. Purga automàtica acotada, tombstone temporal privat per preservar vetos | Cua volàtil; acceptació no acredita entrega. La purga requerix dimoni i DB sans |
| AH-11 `R-1/R-12` · P2 | Arrels públiques revisades per tipus; denegació de dades/configuració/SSH/Library/logs. Escàner únic de dotze patrons, incloent ZIP/gzip i cadenes JSON, en els dos passos | No inventaria tot WordPress/Blogger ni dades privades |
| AH-11 `R-4/R-9/R-13` · P2 | DB fixada a `socdepoble_node0`. `.staging` ocult, rename del directori complet abans de CURRENT. Una generació per dia UTC durant 30 dies i una per cadascun dels dotze mesos anteriors | Versions i paperera remotes fora d’abast. Fallada de retenció separada de la integritat |
| AH-11 `R-10` · P2 | HMAC-SHA256 del MANIFEST exacte i SHA256SUMS, clau local fora de Drive i verificació per descriptors. Rebut privat v3 i comprovació actual completa del contingut autenticat; v2 i rebut privat sense comprovació viva no basten | Cache de salut 60 s, sonda 4 s; una denegació d’accés a Drive dona integritat false. HMAC no acredita upload remot ni impedix reproduir una generació antiga vàlidament signada. Bootstrap R7 explícit i fixat, no executat en producció |
| POSSE · P2 | GET entrant cada cinc minuts, single-flight amb sync manual i backoff acotat. Prova explícita 404/410 o de visibilitat retira el tut del mur; absència d’una pàgina no basta | PostgreSQL sintètic i HTTP controlat. Cap POST d’eixida ni xarxa Mastodon real en R8 |
| Clon net / CI · P2 | ZIP Open Data sintètic determinista generat pel test; retenció i autenticitat portàtils. Porta de literals sobre índex Git o arrels públiques explícites, activada en `test:precommit` i `test:ci` | Detector acotat de literals, no prova universal d’absència de secrets. Resultat complet del clon net documentat en el rebut final |
| `C6-mirall-ah11-01` · P1 | Configurador només de destinatari públic; restauració amb identitat en pipe anònim, fd3 cap a `age`, límits de mida/temps i neteja de buffers. Executor bloqueja si detecta la identitat privada local abans de preparar i abans de crear snapshot | **R-5 obert:** única còpia encara al Mini, cap rebut acreditat de custòdia fora. Sense lectura/còpia/eliminació de la privada real en R8. No s’elimina l’única identitat a cegues |

Evidència integrada: **242/242 proves Node en 27 fitxers**, zero fallades i zero omissions, amb PGlite explícit i les 75 migracions; **276/276 Vitest** de contracte/conformitat després d’alinear el suport amb R3; **63/63** de calendari; **15/15** de la porta de literals; **10/10** de política/àmbit CAS. Les bateries se solapen: no se sumen. Lint dels 58 fitxers JS/JSX/MJS del delta: zero errors i avisos. Una invocació Vitest inicial descobria còpies del laboratori i es va repetir delimitant producte. No s’usen passades SQL amb skips com a prova SQL.

**Canari natiu R8, 23:19:12 UTC:** al Mac mini real, Node 24.22.2 i `age` 1.3.2 han xifrat/desxifrat per fd3 una identitat sintètica construïda només en memòria. El receptor era un sink de canari, no `pg_restore`; cap dada ni credencial de producció. La identitat real només s’ha observat amb `lstat` i seguix present. Esta prova acredita el circuit criptogràfic i el pas de descriptors, no una restauració PostgreSQL ni una recuperació fora de casa.

**Clon net final · precommit exit 0:** 345 fitxers Vitest, **7.980 proves verdes i 4 skips**; fase Node **301/301, zero skips**. Passada focal de 36 fitxers: **409 verdes, zero fallades i 1 skip** opt-in de compilació real FEDI-05. PGlite local explícit en la passada focal. Els quatre skips Vitest són tres reserves «sense projecte natiu» inapplicables perquè els projectes sí hi són, i el contrast Shamir independent pendent. No s’amaguen ni se’n declara la propietat provada. Porta de literals sobre índex Git: **4.034 fitxers, zero troballes**. Font i checkout intactes abans/després; cap ZIP Open Data ignorat. S’han corregit omissions del preparador del laboratori i la resolució CJS de React en cache externa, sense relaxar assertions del producte.

Fixture explícita `SYNTHETIC_R8_FIXTURE`, HEAD `9d795d7824c5f4ce79ca56ce53c08ab73b26b3ec`, 4.816 fitxers i 196.559.367 B públics. Inventari SHA `f3a9a95babdde4408b5f41b4132c9c5a8f18dc9397eec6da7a2f408794122913`; congelació SHA `3784c89d8ee2ab6b83f122dd4c496221ec72fb1caaed8f1374c456e39e40019a`. Les 89 fonts natives estan fixades al commit R3 de Claude; la fixture sintètica no es presenta com eixe commit. `node_modules` local enllaçat després del commit, sense reinstal·lació de dependències. `clean-tests.json` conserva resultats i hashes de logs; no es promet un verd global de `test:ci` o de producció.

**Custòdia sense inventar evidència:** no hi ha CLI de gestor de claus disponible. Un canari aleatori de Keychain sincronitzable, sense dades de producció i amb interacció desactivada, va ser rebutjat pel sistema amb `-34018` (entitlement absent). No es va crear l’ítem ni es va llegir la identitat `age`. És un rebuig del sistema operatiu, no de la revisió automàtica d’aprovacions. La via pendent és gestor del Mestre o paper en dos llocs fora de casa, comprovant recuperació abans de retirar la còpia local. Excloure un fitxer de futures còpies de Time Machine no acredita eliminar còpies històriques o snapshots locals. Cap variable d’entorn es considerarà prova de custòdia externa.

**Entrega R8 segellada:** `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon_r8/`. **78 postimatges: 52 modificades i 26 noves**, base obligatòria 171 (149 del plegat R3–R7 +22 preimatges revisades). Layout executable amb `fitxers/`, `preimatges/`, `pegats/`, MANIFEST, SHA256SUMS, aplicador0755, README i25 evidències. Inventari total160 artefactes;159 entrades de checksums. **`[CAS OK]`**, dry-run primari només lectura, base i kit intactes. Congelació de les78 fonts SHA `8fafa7a929d49dc6539064900815d04cc4888c17a4011f83e607ae4dfc7a7fbc`; plegat base SHA `aacd9281a05338fa8c9135875e43a77179a93569ca5ac6f4569a8a95879be021`.

| Pin independent R8 | SHA-256 |
| --- | --- |
| MANIFEST.json | `f1ca89a7fb01c5e702f354589f040c29ac0e85f4f130c4933808f1e8116c0eae` |
| SHA256SUMS | `7570d72047377f4a867bb66bcdfd0fb0120fb0c59f45dea58c4dc87cc120c030` |
| Aplicador R8 | `48cc1e94ed23166ceab96ad98681613bef950c72aa75daf64a56edb4029967f8` |
| Constructor R8 | `099a7865888be5a69b764b84cf0b65939c976a78055f78091d753d3d81f3f2d4` |
| Autoritat de preimatges/rutes | `adbc77469fb8b39b6b987e7247ecd75853a60f4a536f4f5d73abbf2922c1f6c7` |

El fork de l’aplicador conserva els bytes i el pin de l’històric als kits antics. En R8 amplia només dotze rutes exactes d’àmbit, amb diff mínim auditable; no canvia l’algorisme d’aplicació/reversió ni autoritza Escriptori, `.agents/` o `.git/`. El CAS verifica bytes, modes i preimatges; no acredita custòdia física, SMTP, interop, upload o failover. No és una transacció global davant SIGKILL o tall elèctric. R8 no s’ha activat al runtime ni s’han aplicat SQL nous en producció. No es declara 10/10 global amb R-5 obert.

**Replay independent R8 · 8/8 PASS:** àrbitre amb base171 reconstruïda des dels cinc kits pinats i22 preimatges revisades, no la base de l’arrel; dos canaris aliens preservats. Dry-run sense canvis; apply78 amb hashes/modes exactes; segona aplicació idempotent; rollback sec i real torna a la base; conflicte CAS en ruta tardana refusat abans d’escriptures; symlink de fitxer i ancestre refusats sense desviament. Kit160 fitxers/44 directoris i tots els inputs idèntics abans/després. Rebut SHA `bdd9c56c8a317216f36f213732a8f9149a4a9a7e7db067b77b8b765139cc666b`; harness SHA `dbf35a1bc9b3b74286b4c516db4e99d001df6f8bc7be03c05c5d441d6f204c13`. Suplement persistent `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon_r8_verificacio/`,13 fitxers0444/directori0555; sidecar SHA `fdf8adfc0b0667451520cb32615775c8a430caba428c92c291437181194bb691`. Cap afegit al kit segellat. Reversió de bytes i modes, no d’inodes/timestamps substituïts; pares de la fixture prematerialitzats. Esta prova no exercix runtime, SQL, serveis, xarxa, publicació, escriptors simultanis ni talls elèctrics.

**Gauntlet R8 · rúbrica canònica, no certificació global del producte.** La puntuació reflectix el que acredita este carril; 0 vol dir cap prova nova d’eixa dimensió.

| Dimensió | /10 | Evidència i límit R8 |
| --- | --- | --- |
| D01 Port Neutral i Model B | 8 | Contracte, pàgina i arquitectura sincronitzats; integració pública del backend pendent |
| D02 Pedra Seca i Geometria HD | 0 | Cap certificació visual nova |
| D03 Accessibilitat Rural AAA | 0 | Cap prova nova amb tecnologia assistiva |
| D04 Sobirania i Open Data Municipal | 9 | PostgreSQL natiu anterior i 75 migracions reexecutades amb PGlite; fixture ZIP autònoma |
| D05 ActivityPub, NodeInfo i WebFinger | 8 | Reconciliació periòdica provada amb baixes explícites; cap entrega remota nova |
| D06 WordPress.org i amfitrions | 0 | No s’ha executat una importació completa d’arxius antics |
| D07 Replicabilitat de Nodes Germans | 8 | Autoritat CAS congelada i base 171; instal·lació fresca amb dependències reinstal·lades no acreditada |
| D08 Privacitat, RLS/RGPD i E2EE | 8 | /48, KDF acotat, perfil neutral i reset uniforme; auth OFF i SMTP real pendent |
| D09 Notes i Karpathy Local | 6 | Proves natives històriques; sense activació d’ús personal |
| D10 Memòria Oral, Patrimoni i Multimèdia | 4 | Mirall parcial anterior; cap nou arxiu oral ni completitud històrica |
| D11 Comunicació Comunitària i Xat Rural | 4 | Laboratori històric; UI/Realtime/E2EE del Node 0 pendents |
| D12 Multilingüisme i Traductor Sobirà | 0 | Cap canvi ni validació nova de diccionaris |
| D13 Botigues Mòbils i PWA | 0 | Les fonts natives servixen les proves estàtiques; no hi ha compilació ni publicació mòbil nova |
| D14 Governança, Telemetria i Consola | 8 | Rebut v3 amb comprovació viva autenticada, absència de prova → false; falta desplegar R8 |
| D15 Rendiment i Resiliència Rural | 6 | Retenció acotada, atomicitat i HMAC provats; **R-5 obert**, sense restauració completa ni failover certificat |

**FinOps:** no s’ha contractat cap recurs ni creat servei de pagament. Retenció màxima prevista de 42 generacions seleccionades, no una estimació de bytes ni garantia de quota remota: paperera/versions de Drive i Time Machine queden fora del còmput. Els 20 TB són capacitat declarada pel Mestre, no capacitat lliure verificada. Les proves reutilitzen dependències locals existents; no acrediten `npm ci` en una màquina nova.

### Estat vigent R6 · OAuth, privacitat i AH-09 simètrica

**OAuth real, 19:47 UTC:** instal·lador dedicat amb entrada privada, comprovacions de propietari/enllaços, CAS de bytes i reemplaç atòmic; les quatre variables autoritzades són només a `/Users/javi/.config/socdepoble/node0.env`, mode 0600. Cap valor ni empremta del secret en codi, informes o logs. Reiniciat únicament `cat.socdepoble.node0-soberania`. Preflight GET des del Mac mini validà `username:depoble`, URL i actor de `mastodont.cat`; rebut `/tmp/sdp-node0-mastodon-oauth-preflight.json`, 19:47:35.352Z. Sonda pública posterior `/tmp/sdp-node0-r6-public-oauth-configured.json`, 19:47:40.117Z: huit rutes correctes, PostgreSQL real, `outboundConfigured:true`, `tokenPreflight:verify_credentials`, `automaticSync:false`, `userSessions:false`, `remoteInteropVerified:false`. PostgreSQL, Caddy, empremta i els 32 documents es mantenen. No és prova de publicació ni de possessió d’un scope concret de mitjans.

**AH-09 vigent:** ponts amb propietari persona o entitat, autors vinculats configurables i autorització dins del poble. El default `@depoble` agrupa Sóc de Poble/Rentonar i exclou Mercat/oli; afegir Coordinadora requerix procedència i vinculació autoritzada. Eixa política no impedix que una cooperativa configure el seu propi pont. `GET .../mastodon/preparades` ha de mostrar el draft exacte i l’estat durable; `POST .../mastodon/publish` ha d’exigir `confirm:true` i lligar ID, revisió, hash, actor remot i revisió de política. La configuració o el cos HTTP no poden inventar autoria. Motor i ledger s’estan construint en LAB; **la safata encara no està desplegada**. Mentrestant els antics POST arbitraris REST/AP retornen 503 `posse_editorial_confirmation_required`, fins i tot amb token configurat. No hi ha cap enviament cec habilitat.

**Privacitat federada R6 desplegada:** una Note amb Public només a `cc` no entra al mur públic; Create/Update no públic retira la projecció; Delete i retirada REST creen tombstone permanent. Un Update públic revalida l’estat REST actual, perquè `updated` AP pot perdre les fraccions de `edited_at`. Reconciliació paginada i GET individual: mai s’inferix esborrat d’una pàgina absent o fallida. SQL amb locks de URI i snapshot nou evita resurrecció concurrent. Proves focals 92/92, crítica independent verda i carrera PostgreSQL nativa 4/4; esta última usa connexions d’operador amb `SET ROLE node0_runtime`, no es ven com una prova de peer directe. Reconciliació real 19:36: set fonts comprovades, cap POST; `saved:0` queda en investigació per possible metadada de projecció antiga, sense donar-la per tancada.

**Valors privats i logs R6:** `psql` 17 amb `\\bind` envia valors per paràmetres reals; base64 en text SQL no es considera secret. Política de logging exclusiva del rol autenticador i base LAB, amb startup gate abans de bind. Correccions de BOM, UTF-8 partit i números/booleans privats. Prova independent portable 8/8; prova nativa i HTTP 13/13, sense valors als nous trams de logs ni `pg_stat_activity`. No s’ha aplicat auth ni política privada a producció. Estes proves precedixen la nova fusió auth R6 i no certifiquen eixa fusió.

**Pre-segrest R5:** reproducció P1 conservada. Solució R6 obliga el receptor del correu a triar contrasenya i donar consentiment explícit, lliga token a credencial/propòsit/política, invalida els antics i revoca sessions en reset. Autor i crític 35/35; fusió canònica en còpia 19/19 PGlite. Quotes /64 i buckets acotats també fusionades. **Passada nativa combinada R6 29/29**, incloent gate de permisos del rol directe, HTTP real, Notes/org/xat i serialització de revocació/rotació; rebut `/tmp/sdp-node0-r6-auth-combined-native-final.tap`. Primera passada roja per una fixture amb IP no vàlida, corregida sense relaxar el validador; reproducció conservada. Prova permanent afegida de correu/consentiment/reset/upgrade/UI real:16/16 amb PGlite explícit. Falten UI de sessió i resoldre l’oracle SMTP; **producció auth OFF**. R5 és evidència immutable, no versió autoritzada per activar el registre.

Els apartats de rondes anteriors són històrics; les frases antigues «token absent» o «eixida no configurada» queden superades per esta evidència datada, sense reescriure els rebuts originals.

### AH-11 · Resiliència rural 3-2-1 i còpia navegable

**ACTIVACIÓ PÚBLICA REAL ·21:50:55UTC:** `GET https://socdepoble.cat/api/v1/node0/status` HTTP200 amb `workspaceMirrorConfigured:true`, `lastMirrorSnapshotAt:2026-11-04T21:25:15.804Z` i `mirrorIntegrityOk:true`. La font queda explicitada: `mirrorVerificationSource:last_verified_snapshot`, `lastMirrorVerifiedAt:2026-11-04T21:50:38.999Z`. Rebut `/tmp/sdp-node0-r7-public-proof.json`; estat cru `/tmp/sdp-node0-r7-status-live.json`. PostgreSQL17, empremta i OAuth preservats; cap tut i auth de producció OFF. S’ha reiniciat només el servei HTTP. Esta evidència substituïx els estatsfalse anteriors sense alterar-ne els rebuts.

**Certificació operativa real:** el worker original fixat per SHA ha reverificat dues vegades la mateixa generació i totes les fulles, llegit el manifest amb hash fixat i comprovat que el destinatari públic coincidix. Després ha publicat atòmicament el rebut privatv2,0600 en directori0700, lligat a compte/ruta/destinatari/generació/manifest/sumes. Cap generació addicional, lectura de la privada age o escriptura d’env. Rebut `/tmp/sdp-node0-r7-native-attestation.json` i script d’operació `/tmp/sdp-node0-r7-attest-actual.mjs`. El lector HTTP només observa metadades del muntatge i llig el rebut privat acotat; no llig continguts de Drive ni executa el seu verificador. Caducitat24h, vinculació estricta i7/7 proves pròpies. Passada focal conjunta35/35,0omissions; lint verd. La verificació de còpia és una observació datada, no confirmació d’upload ni d’escaneig viu de cada fulla des de l’API. R7 es prepara per al segell final amb estes evidències; R6/R6_verificacio continuen immutables.

**R7 · primera generació real al compte institucional,21:25:16UTC:** l’actualitzador ha creat exclusivament la carpeta dedicada de `Mi unidad` en el compte verificat,0700; ha afegit una sola variable de ruta a l’env0600 preservant els altres bytes. Reexecució nativa idempotent, cap canvi als altres comptes ni a la privada age. Generació `20261104T212515Z-ef95f03c414aefb7`:10 peces llegibles,2 mitjans,ZIP1.2.0 i3 actius de recepta, cinc carpetes i28 fulles verificades independentment a les21:26:03. Manifest SHA `71fd6fabbedb16df44af41fa942babd9ca02e0759841a416a3f0daac6d837eb9`, sidecar SHA `5a9228938f025ed6e2c06d9ab49a55b6dd5752dba7ecba02ed6b4ac62bb8dc5d`; dump age779576B SHA `f1e0ea19616aa2e8a4111a563723f6e3d664db21fafc6dd2de2c2bf6dd589f67`. Una sola generació aplicada; cap tut. Rebuts `.r7-lab/mirror-workspace/native-first-institutional-generation.json` i `native-institutional-reinspection.json`. `cloudUploadedVerified:false`: integritat local en la carpeta sincronitzada, sense confirmació remota de Drive.

**Bretxa de salut detectada i en correcció:** després del reinici, l’API encara mostrava Workspacefalse. S’ha descartat cache/CDN, procés equivocat, configuració/env, Unicode, UID i HOME. Node24 per SSH valida la mateixa ruta/destinatari i totes les sumes. Una sonda temporal de LaunchAgent amb el mateix Node24 confirma configuració correcta i `lstat` permés, però el probe FD/fill Python no acredita el directori en eixe context. La sonda temporal s’ha desregistrat i netejat; no s’han concedit permisos nous ni s’ha alterat la generació. Això acredita una diferència de context del probe, no encara la causa exacta d’OS. Rebut `native-launchagent-context-diagnostic.json`.

**Frontera de salut adoptada:** el verificador operatiu amb accés autoritzat comprovarà CURRENT i les28 fulles amb el worker FD existent i desarà un rebut privat0600, lligat a ruta/configuració, destinatari públic, generació, manifest/sumes i instant. L’API consumirà només metadades i indicarà explícitament `last_verified_snapshot` i l’instant de verificació; no es presentarà com un escaneig viu de continguts ni com confirmació d’upload. Ruta/root coneguts observables sense enumerar comptes, rebut amb caducitat i cap secret. Backup fort i generació immutables; l’API no rep permisos ampliats de Drive. Implementació/proves en curs, R7 encara no segellat. La relectura funcional també ha descobert que una sonda de Time Machine lenta descartava la prova de mirall ja completada: corregit amb resultats independents i6/6 proves de salut. La passada focal anterior de R7 era27/27,0omissions i lint6; les fonts finals es recongelaran després d’esta esmena.

**Vigent21:14UTC · nou inici de sessió institucional confirmat:** el Mestre acaba d’autenticar Drive Desktop. Sonda SSH real: el root exacte `GoogleDrive-socdepoble@socdepoble.org` existeix, UID501,mode0500; la unitat existent és `Mi unidad`,UID501,mode0700. `My Drive` i `El meu Drive` no hi són. Cap consulta ni canvi als dos comptes previs. Destinació autoritzada: `Mi unidad/Sóc de Poble · Mirall Sobirà Node 0`. Activació atòmica en curs en un suplement R7; el nou resolutor accepta exclusivament els tres noms localitzats previstos dins del compte exacte,9/9 proves. Els paràgrafs inferiors sobre absència de sessió són evidència anterior, superada per esta ordre i sonda; no s’ha inventat encara integritat ni data de Workspace.

**R6 ampliat segellat i replay independent acceptat:**75 postimatges (31 modificades+44 noves), base95 (86 plegades R3/R4/R5+9 preimatges fixades), pegat/aplicador CAS. Ruta `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon_r6/`; manifest SHA `425f50d147442ad38eaa0ac2e03c2ee87ad8c1760e2b782a151bb097effdc906`; sidecar SHA `5e690e0241e0913015b50d66a145df719083d0569af8c3264aa06e57948ef17e`. QA completa551/551,0fallades/0omissions,43 fitxers;34802 entrades de fonts/dependències estables abans/després,lint63 exit0. Congelació de75 fonts SHA `c2c78b4c0934364ddd64ea72c3df0d0f2219da1047a05c779c920af2d2237889`; rebut QA SHA `95632f7a12c0a8ef031ffda6f5b8cd25c5a7ba922b078dd5eaa30e5267a4b566`. Replay en base reconstruïda independent:147 artefactes íntegres, dry-run sense escriptures,75 postimatges aplicades, segon apply sense cap canvi, canaris i kits originals preservats. Sibling `..._r6_verificacio/`,17 fitxers0444/directoris0555; rebut SHA `c7b949d1a498b0cd4680e46e81356d33339af31f5cbb4e6f1713c008e4fdfc63`, sidecar SHA `b740c54b9faf10a230caafa8d53795a95aed02a4cd524a9615d1061e25e35a35`. R6 i rebuts es mantenen immutables durant R7.

**Recuperació real del staging verificada:** `age → pg_restore --single-transaction` en una base nova de template0:68 taules,75 migracions,32 documents públics,6 appContent,0 perfils/Notes. Base descartable eliminada després de comprovar OID/titular/prova de propietat; producció intacta i cap dump en clar. Rebut `.r6-lab/restore-assets/evidencies-final-veyg_w5_/receipt.json`, SHA `53c8e01ddcae0637fefaae2b63040130a4c683855c194e7424832a155b6c6751`; prova nativa SHA `919ffc288d20e67ac7a810b097e18b340060790838f93328cda6aa58b98c7b32`. `nativeRestoreVerified:true`, `cleanMachineRestoreVerified:false`, `aclRestored:false`, `rolesChanged:false`. El manifest immutable de primera generació conserva el seu estat anterior; el rebut separat acredita la prova posterior.

**Precisió executiva del Mestre aplicada:** el compte institucional encara no té sessió en Drive Desktop. Els dos roots previs queden expressament fora de l’abast: no s’han tocat ni vinculat. Destinació autoritzada d’esta ronda: `/Users/javi/socdepoble-node0/mirall-workspace-staging/`. El resolutor només accepta el compte exacte `GoogleDrive-socdepoble@socdepoble.org` i una destinació dins del seu `My Drive`; un directori local de staging no activa Workspace. Les consultes de salut no enumeren altres comptes. AH-11 forma part del tall R6 ampliat; no es diferix a R7.

**Primera generació real de staging, 20:54:53UTC:** `20261104T205452Z-eeb9c27e15263608`, les cinc carpetes exigides,10 publicacions/esdeveniments llegibles (8 del mur i2 esdeveniments),2 mitjans verificats de `.org`,ZIP OpenData1.2.0 i3 actius públics de recepta. Les7 rèpliques públiques Mastodon també s’arxiven;8 peces sense URL canònica acreditada queden amb `canonicalUrl:null`, sense inventar enllaços ni autoritat POSSE. Cinc URL de mitjans externs s’han omés explícitament. No s’afirma haver copiat tot el patrimoni multimèdia ni tot l’històric WordPress/Blogger. El dump consistent de la base completa s’ha comprimit i xifrat directament `pg_dump → age`, sense fitxer temporal en clar i sense copiar PGDATA. Cifrat779576B, SHA `9a2e39cea9c2a09e4328004aa4e49bd0a10d6384bc280c8856ab79e41933bbcc`. Manifest `1f9e426d064fd63a35b496d6ed4c5ace0949b4fdabd8c952736947c59d0ffda3`, SHA256SUMS `1beecf4ba9f734580dc4227026a39c3f87f77209aee75c4f881a9ce6a6de3f03`. Inspecció independent posterior:28 fitxers declarats, hashes correctes, `CURRENT.json` atòmic i rebut privat0600. Rebuts `.r6-lab/mirror-native/native-first-generation.json` i `native-independent-inspection.json`. `cloudUploadedVerified:false`, `institutionalDriveConfigured:false`; restauració encara pendent en este instant.

**Clau de recuperació real, fora del mirall:** `/Users/javi/.config/socdepoble/workspace-node0.agekey`,0600, directori0700. Canari natiu xifrar/desxifrar correcte; reexecució reutilitza la clau i no canvia inode/mtime ni l’env. Tres camps públics configurats atòmicament (`SDP_WORKSPACE_AGE_RECIPIENT`, `SDP_WORKSPACE_ACCOUNT`, `SDP_NODE0_MAIL_FROM`); credencials i resta de bytes preservats, verificats en RAM. No s’ha configurat `SDP_WORKSPACE_MIRROR_DIR`. Rebut de12 casos reals i instal·lació `.r6-lab/ah11-key/evidencies-final-yjdtuk7c/receipt.json`, SHA `db9cdd864a6831104a14c32e670048bc61a0c1ab10df28280063737543125467`. Cap valor ni hash de la privada en codi, informes o logs.

**Build del candidat amb doble opt-in correcte:** `VITE_SDP_NODE0_HTTP=1 VITE_SDP_NODE0_PRIVAT=1 npm run build:web`, exit0; entrada239049B gzip-9, dins del límit250000B. Log `/tmp/sdp-node0-r6-core-double-optin-build.log`. Els avisos de mida de chunks es conserven. Este build i les475 proves Node del nucli precedixen l’ampliació de ferramentes AH-11; no substituïxen la seua verificació final.

AH-09, AH-10 i la nova AH-11 rellegides. **Sonda real del Mac mini a les20:10:50.369Z:** Time Machine configurat i última còpia observada amb marca local `2026-11-04-210642`; `pg_dump`17 disponible. Dos roots Google Drive observats; `SDP_WORKSPACE_MIRROR_DIR` i destinatari age encara no configurats, i age absent en eixe instant. Rebut `/tmp/sdp-node0-ah11-preflight.json`, sense rutes de comptes, valors o empremtes de secrets. No és una comprovació de restauració de Time Machine ni d’upload al núvol.

**Compte institucional resolt pel Mestre:** `socdepoble@socdepoble.org` és l’únic titular autoritzat del mirall, el remitent d’auth/invitacions i el WebFinger principal. Sonda datada20:25:48.794Z i lectura directa posterior de CloudStorage: els dos roots muntats són de comptes personals; el compte institucional no hi apareix. Rebut `/tmp/sdp-node0-ah11-institutional-drive.json`. No s’ha vinculat `SDP_WORKSPACE_MIRROR_DIR` a un compte personal. MarIA té pendent la connexió institucional al Mac mini; la designació del titular ja és definitiva i no es torna a preguntar. El connector Drive de l’app tampoc està connectat, segons descoberta de connectors. Continua tota la feina independent.

**Nou mandat executiu:** el Mestre autoritza generar una clau age permanent amb privada exclusiva en `/Users/javi/.config/socdepoble/`, mode0600 i fora de Drive. Generació/reutilització i actualització atòmica del destinatari públic en curs; cap valor ni SHA de la privada als rebuts. age1.3.2 ja està instal·lat nativament, amb asset oficial fixat i canari xifrar/desxifrar real correcte, rerun idempotent i zero claus temporals restants;19/19 proves. Una generació local fora de Drive quedarà etiquetada com a tal fins acreditar el root institucional. No es declara còpia al núvol per haver escrit un directori local.

**Identitat existent comprovada per HTTPS:** el domini `.org` ja servix host-meta LRDD i el JRD `acct:socdepoble@socdepoble.org` que apunta a `https://socdepoble.org/ap/actors/socdepoble.json`; l’actor es presenta en fase1 de lectura. Es preserva este ID i el de l’actor Node0 `.cat`; s’enllacen com a recursos relacionats i amb la rèplica POSSE, sense simular un Move ni que siguen una sola clau. Els correus del transport auth R6 porten el remitent institucional fixat; SMTP real continua pendent. Node0 admet els dos recursos WebFinger coneguts amb JRD estricte. La descoberta del domini canònic conserva el circuit existent, documentat en [RFC7033](https://www.rfc-editor.org/rfc/rfc7033.html).

**Desplegament públic R6 a les20:21UTC:** estat200 JSON amb `resilience.localTimeMachine.configured:true`, `workspaceMirrorConfigured:false`, `lastMirrorSnapshotAt:null`, `mirrorIntegrityOk:false`, sense rutes. Preflight actual de Time Machine en el dimoni no acredita l’última còpia (`latestBackupFound:null`). Huit rutes públiques correctes i OAuth configurat; auth/POSSEpublish continuenfalse. La reconciliació corregida retorna `received:7,saved:7,retired:0`, conserva32 documents i tombstones permanents, sense publicació remota. Rebut `/tmp/sdp-node0-r6-legacy-reconciliacio-live-final.json`; la investigació `saved:0` queda resolta pel format legacy verificat.

**Contracte del tractor en construcció:** generacions completes immutables amb les cinc carpetes exigides, JSON/Markdown i mitjans exclusivament públics, ZIP OpenData1.2.0, dump PostgreSQL consistent comprimit **xifrat amb age abans d’entrar al directori Drive**, recepta sense secrets i `SHA256SUMS`. `CURRENT.json` es publica per rename atòmic només després de verificar les fulles i els hashes; FD/NOFOLLOW i rebuig de symlinks/hardlinks també als pares. El dump pot contindre dades privades i per això el seu xifrat és obligatori encara que els documents navegables siguen públics. No s’ha executat cap còpia al núvol.

**Salut R6:** `resilience.localTimeMachine` conté `{configured,latestBackupFound,checkedAt}`; booleans `null` si desconeguts. `workspaceMirrorConfigured`, `lastMirrorSnapshotAt` i `mirrorIntegrityOk` no exposen rutes. La inspecció corre fora del camí HTTP, amb cache, singleflight i termini; `/status` no espera un verificador penjat. La crítica ha produït correccions de deadline, dates impossibles i conformitat pròpia de JSON; les proves corresponents queden registrades abans d’habilitar-ho. La integritat d’una generació local no es presenta com a confirmació de sincronització remota.

**Continuïtat real i límit del pla:** el frontal global `.org` té un allotjament diferent del Mac mini; cal provar la lectura del catàleg públic amb `.cat` inaccessible i versionar la instantània servida abans de certificar failover del100%. Un mirall navegable de Drive no commuta el trànsit web per si mateix. RPO, temps de recuperació i restauració en menys de10min requerixen un assaig datat; no es promet pèrdua zero davant un tall entre snapshots. Els LaunchAgents actuals són de sessió d’usuari i no acrediten arrencar després d’un tall sense login.

### Gauntlet R6 addicional · contracte i empaquetatge

**Gauntlet encreuat rellegit a les21:04UTC:** informes Gemini i Claude contrastats amb el kit immutable. Es confirma la discrepància de contracte: `PanellNodeZeroMastodon.jsx:151` de Gemini v3 interpreta `localTimeMachine === true`, mentre el Node0 real envia un objecte amb `configured`, `latestBackupFound` i `checkedAt`. La fixture booleana del seu test no acredita compatibilitat amb el JSON real. Per a Claude/MarIA: adaptar el normalitzador al DTO real i distingir configuració, còpia observada, integritat local i upload desconegut; fixture disponible `/tmp/sdp-node0-r6-ah11-status-after-stage.json`. No s’ha modificat el kit de Gemini ni el seu informe. Les afirmacions de recuperació automàtica/100% i d’accés a Drive durant un tall necessiten les esmenes i proves indicades per Claude; els LaunchAgents actuals i el staging no les acrediten. La instrucció humana de no tocar els comptes Drive previs preval sobre qualsevol recomanació de retirar-los.

**Salut pública posterior al staging,21:00:57UTC:** huit rutes correctes, actor200, inbox sense signatura401, PostgreSQL17.11 i32 documents. `outboundConfigured:true`, `userSessions:false`, `possePublish:false`, `remoteInteropVerified:false`. `resilience` manté Workspacefalse i data/integritat de Workspace null/false, encara que el staging local siga íntegre; cap ruta o destinatari age al DTO. Rebuts `/tmp/sdp-node0-r6-ah11-staging-public.json` i `/tmp/sdp-node0-r6-ah11-status-after-stage.json`.

Les quatre accions noves de correu formen dues capacitats opcionals completes: `verificacioCorreu` i `recuperacioCorreu`;32 mètodes de nucli preservats,98 opcionals/41 grups. L’adaptador offline conserva els39 grups previs i deixa absents els dos que exigixen un servei de correu. Els178 casos històrics de conformitat es preserven com a prefix i els quatre nous s’afegixen al final, amb codi de domini neutral `SDP-CORREU-001`. La primera passada àmplia descobrí recomptes i índexs rígids antics; s’han esmenat mantenint mutacions i assercions, amb837/837 en la primera passada focal dels cinc fitxers. La passada àmplia també mostrà la restricció de loopback i una resolució CJS de React al cache temporal; la reexecució delimita `--dir src` per no descobrir còpies de fixtures LAB i usa el graf de dependències del projecte. No es confon una limitació de l’entorn amb una prova verda.

**Passada àmplia final real:**262 fitxers Vitest,5850 passades,0fallades i1omesa; duració183,51s. Resolució React reparada amb un enllaç de dependències exclusivament al cache temporal propi, sense tocar `node_modules`/Vite del viu. `src/data`, host, arrencada Node0 i App inclosos; cap regressió C1 restant en este abast. Focal posterior60/60 Node,0salts, i fronteres d’identitat/safata/resiliència23/23 amb el registre de proves. No se sumen les bateries solapades. El Gauntlet POSSE LAB ha afegit proves de binding remot de titular: una URI i secretRef inventats no poden reservar el compte d’un altre. Encara no és un dispatch productiu.

**P1 nova del generador CAS R6, tancada en candidat:** substitució del staging per symlink després de crear-lo escrivia fora abans de refusar el segell. Reproductor roig conservat. El nou worker estàtic manté descriptors dels pares/stage i de cada fitxer, fa diff sobre descriptors i limita recursos. Construcció i publicació separades, cap execució dels verificadors dels kits d’entrada. Constructor revisat SHA `65b53745cdc7f73a9d23f1eeef0fea0008475f13c14cef0e5cb97fe0ca5c2c9c`; arrel reexecuta27/27,0salts. Base exigida95 preimatges:86 del plegat R3/R4/R5 més9 fitxers existents amb pin i mode exactes; la prova multipoble conserva0600. R6 **encara no està segellat** i els kits antics continuen immutables.

### Prioritat R6 · noves troballes C4 confirmades

**No activar el registre R5:** el Gauntlet C4 nou de Claude ha identificat pre-segrest d’un compte no confirmat. Reproducció nostra sobre R5, handler real i 75 migracions PGlite: registre atacant PA → registre víctima PV, tots dos202 però una sola entrega; confirmar el token antic activa PA, login PA200 amb cookie i PV401. Rebut `.r6-lab/auth-preseizure/repro-r5-confirmat.json`, SHA `7343173735f50fd124c04ebc4147b78710cc6f4caa20e9dcfe5e77258f5e68cf`. **P1 latent; auth de producció continua OFF.** R5 queda immutable com a evidència, no com a autorització per activar. R6 ha de lligar confirmació/recuperació a credencial+propòsit+versió de consentiment, exigir contrasenya i gest explícit del receptor del correu en confirmar, invalidar tokens anteriors, caducar pendents i revocar sessions en reset. S’ha pausat la proposta UI per prioritzar este defecte.

També confirmats per lectura del codi: la quota usa IPv6 completa i un topall global de files pot tancar auth; s’està construint la quota per /64 amb creixement acotat i carril d’actor ja autenticat sense bypass per email declarat. **P2 actius federats:** sync només upsert conserva posts retirats/privats, `Public` només a `cc` es tracta com a públic i `Update` s’ignora. Correcció prioritària amb revalidació individual de URI local, cap retirada inferida d’una pàgina truncada o fallida, SQL atòmic i tombstones conservadors. La P2 Unicode ja està tancada en R5. L’arrel treballa en paràmetres reals i política de logs privats: base64 dins del text SQL no és confidencialitat davant el registre d’errors PostgreSQL. Cap d’estes esmenes R6 es dona per verificada abans dels seus reproductors i proves.

### Relleu viu per a MarIA

- **SSH Node 0 RESOLT:** el prompt usa `javillinares`, però `~/.ssh/config` té l’usuari real **`javi`**. `ssh -o BatchMode=yes -o StrictHostKeyChecking=yes macmini` funciona amb la clau existent. Verificats `Mac-mini-de-Javi.local`, Apple M4, 10 nuclis i 24 GiB. No cal cap acció humana. Els dos rebutjos anteriors corresponen a l’usuari del prompt, no a una clau absent.
- **Infraestructura real:** no hi ha Homebrew, PostgreSQL ni Caddy; `sudo -n` exigix contrasenya i no s’usa. Node existent és `/Users/javi/local/node/bin/node` v22.14.0; la web corre a 3350 i el túnel Cloudflare va directament a 3350. S’estan preparant PostgreSQL 17 signat amb Postgres.app, Node 24 i Caddy oficials **dins l’espai de l’usuari**, sense tocar el Node/Vite de MarIA ni el servidor web existent.
- **Salut pública:** a les 15:46 UTC, `GET https://socdepoble.cat/api/v1/node0/status` ha retornat HTTP 200 **text/html de la SPA**. No és una resposta d’estat JSON ni prova de PostgreSQL actiu.
- **Paquet Open Data:** la ruta `la-torre-de-les-macanes-1.2.0.zip` del pla no existix en la instantània. El paquet canònic disponible és `public/opendata/dades-obertes-la-torre-de-les-macanes-20261103.zip`, amb manifest `versio/schemaVersion 1.2.0`. La hidratació comprovarà ZIP, SHA i recursos canònics.
- **Dades absents:** el snapshot públic conté tres entitats, una notícia i un acte històric; no aporta perfils privats ni mercat. No s’inventen ni es copien comptes de producció sense origen verificat.
- **Frontera de l’adaptador:** lectura pública opt-in darrere del port neutral; autenticació, xat i escriptura de persones continuen no disponibles fins disposar de sessió local real. Les escriptures d’operador del dimoni exigixen token exclusiu de servidor. Cap fallback remot d’escriptura.
- **Confiança AP:** únicament `@depoble@mastodont.cat` en esta ronda; signatures sobre el camí original, DNS fixat al socket TLS, límits de cos/temps i idempotència PostgreSQL. No es declara interoperabilitat remota sense prova.
- **Còpia compartida:** alguns fitxers nous desaparegueren durant la preparació externa de l’espai temporal; s’han rematerialitzat i no es torna a sincronitzar mentre hi ha escriptors actius.

### Matriu de conformitat provisional

| Requeriment | Estat | Evidència / límit |
| --- | --- | --- |
| T1 PostgreSQL persistent Node 0 | [FET · infraestructura] | PostgreSQL 17.11 natiu, 75 migracions, 32 documents; socket privat i LaunchAgent amb RunAtLoad/KeepAlive; persistència contrastada abans/després del reinici del dimoni |
| T1 dimoni i estat JSON públic | [FET · desplegament] | `https://socdepoble.cat/api/v1/node0/status` 200 JSON, PostgreSQL real, Caddy i empremta existent coincident amb l’actor |
| T1 adaptador i arrencada de la SPA | [PARCIAL] | SDK opt-in 26/32 i auth/RPC privades verificats en LAB natiu; port neutral intacte i dos builds; UI, SPA pública i auth de producció encara pendents |
| T1 entitats, perfils, mercat i actes | [PARCIAL] | Sóc de Poble/Rentonar/Oli i 8 productes públics, 2 actes; `auth.users`, perfils i organitzacions canòniques sense propietària continuen a zero, sense comptes artificials |
| T2 ingesta Mastodon → Node 0 | [FET] | 7 publicacions i 5 imatges contrastades per API/RSS/AP i persistides en PostgreSQL natiu |
| T2 eixida REST i Create Ed25519 | [PARCIAL] | Token OAuth instal·lat i verify_credentials real; cap publicació remota, safata manual multiusuari encara en LAB |
| T3 Inbox/actor | [FET · desplegament] | Actor públic, WebFinger coherent, POST unsigned 401, RSA entrant/Ed25519 eixint provats; no prova de Follow/Create real signat rebut de Mastodon |
| T3 interoperabilitat remota completa | [NO FET] | `remoteInteropVerified:false`, seguidors i recepcions reals a zero |
| Kit CAS R3 i Gauntlet D01–D15 | [FET · entrega R3] | 38 fitxers, replay complet, dry-run contra viu exit 0; matriu honesta, sense 10/10 global |

### Ronda 2 · Evidència contrastada

- **PostgreSQL local WASM:** 75 migracions canòniques, SHA del ledger, reaplicació, drift i ACL verificats; el ZIP 1.2.0 genera un municipi, 3 entitats, 1 notícia, 1 acte històric i 1 memòria. També s’hidraten `public.towns` i cinc claus `app_content`, preservant curacions locals en reaplicar. `public.organizations` exigix una propietària real pel trigger canònic; queda buit, sense fabricar un perfil. Oli de La Torre, perfils i mercat no venen al paquet.
- **Mastodon real:** API, RSS i ActivityPub llegits per xarxa sense credencials: mateixes **7 publicacions / 5 imatges**, WebFinger i autoria verificats, zero publicacions d’eixida executades. Rebuts a `evidencies/mastodon-live*.json` del kit; els hashes indiquen exactament quina versió del normalitzador s’ha usat.
- **Gauntlet:** corregits dedup REST/AP, resurrecció per ingesta antiga després de Delete, públic en l’embolcall però privat en Note, DNS sense termini, overrides de libpq, recompte fals de seguidors, URI pròpia no resoluble, idempotència segons projecció i competència de workers. RSA entrant i Ed25519 eixint verificats amb criptografia real i SQL WASM. La cua té leases de PostgreSQL i límits de reintents.
- **Instal·lador:** tres reproductors rojos independents passaren a verd: rollback de Caddy no trepitja canvis humans concurrents; fitxers i claus rebutgen hardlinks/symlinks. 13/13 proves de l’instal·lador, amb runners injectats, sense atribuir desplegament a eixes proves.
- **Proves locals acumulades del tall:** 83/83 Node en la passada focal (el normalitzador ha afegit després un cas d’esdeveniments i es revalidarà abans del CAS); 58 Vitest del motor AP compartit més 9 de port/host; ESLint sense avisos en la passada posterior a l’únic import sobrant corregit.
- **Build:** primera passada sense xarxa fallà al fetch federat. Reexecució amb lectura pública autoritzada: `npm run build:web` exit 0, 3.072 mòduls, entrada 239.117 B gzip sota sostre 250.000 B. Conserva avisos de chunks/imports i `git-absent` a la còpia sense `.git`; no es declara consola global 0 warnings.
- **CAS:** 12/12 casos més quatre sondes independents; roots symlink, carreres de parents, canvi consistent del kit després de revisió i lock reemplaçat es rebutgen. Preimatges port `ef244b423076fc32f80d0730b89184ed3c0387bb6e9fd963f213f31fb601955c` i registre Node `1f9b745cc22953e9c15e2c471b4efe924e2ef0531825adb933baa8a0810f720b`.

### Gauntlet creuat per a MarIA i Claude

### Ronda 3 · Tall natiu i verificació final (17:43 CET)

**Servei real:** PostgreSQL 17.11 (Postgres.app signat/notaritzat), Node 24.22.2 i Caddy 2.11.8 oficials instal·lats sense sudo en l’espai de `javi`. Esquema canònic `2611032100`, 75 migracions amb el mateix pin del ledger en reaplicar, 40 taules de `public` + `node0`. Recompte actual: 9 pobles, 4 agents, 8 posts, 2 actes, 8 productes i 1 pàgina. La quarta entitat i l’acte històric provenen del ZIP; no es fusionen identitats per nom. Les fonts anònimes actuals tenen GET datat, SHA i llicència conservada; no s’han inventat perfils ni propietàries.

**Prova pública independent del constructor:** 16:29 UTC, transport curl amb TLS del sistema: `/api/v1/node0/status`, `/ap/actors/socdepoble`, WebFinger, `/ap/outbox`, `/api/v1/node0/mur`, NodeInfo i `/` responen 200 amb tipus correcte; `POST /ap/inbox` sense signatura respon 401 `signature_missing`. L’empremta derivada del PEM públic coincidix amb l’estat: `f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11`. Cap activitat pública de prova enviada a Mastodon.

**Persistència i permisos reals:** després del reinici autoritzat d’un únic dimoni, PID 19942→20493, els 32 documents i el ledger de 75 migracions són idèntics. PostgreSQL PID 19554 i Caddy PID 20010 mantenen l’arrencada. `node0_runtime` no té superuser/BYPASSRLS/createDB/createRole/replicació/membres i no pot llegir `auth.users` ni `profiles`. Entorn i clau regulars, un enllaç i mode 0600; cap valor ni SHA de secrets s’ha imprés.

**Incidències corregides, sense ocultació:** la primera activació de Caddy introduí un bucle 301 en el frontal perquè el proxy passava `X-Forwarded-Proto:http` al servidor antic. Es corregí a `https` a les 16:28 UTC i la web/NodeInfo tornaren a 200; s’ha afegit preflight amb Host públic abans de tocar el túnel. Una reexecució de launchd amb bootout/bootstrap tingué un rebuig transitori i deixà el dimoni parat temporalment; restaurat i canviat l’instal·lador perquè només faça bootstrap si falta i reinicie per configuració nova. La prova final confirma serveis saludables. També s’ha corregit el 403 de GET amb origen `.org`: ara les lectures públiques tenen CORS `*`, inclòs 503, sense credencials; POST `.org` continua 403.

**Fonts i proves finals:** congelació R3 de 38 fitxers, digest `6f9a4b90fff36317db852bb9a5e0d490132e25c409fea838e9b8bb2ab0f5a057`. Passada completa focal del constructor: **161/161 Node, zero fallades/salts/TODO**, inclòs PostgreSQL WASM explícit. Vitest: **76/76 en sis fitxers**. Àrbitre independent: **152/152**, 938 fitxers/dependències amb SHA i modes estables, lint 0 errors/avisos. No se sumen els recomptes de bateries solapades. Build habitual final exit 0, entrada **239.794 B gzip**; build opt-in Node 0 final dins la còpia exit 0 i pressupost exit 0, entrada **239.145 B gzip** (sostre 250.000). El primer intent opt-in fora del projecte fou rebutjat per la porta d’eixida; no és un verd ni un build desplegat.

**Frontera que continua oberta:** `VITE_SDP_NODE0_HTTP=1` és una variant de lectura pública, amb canvi d’àmbit i expulsió de la sessió Supabase antiga provats. El frontal públic encara no s’ha canviat a eixa variant; auth, xat i escriptura de persones al Node 0 continuen no disponibles. Les escriptures d’operador i les cues són locals i verificades, però no substituïxen eixa sessió. Eixida Mastodon no configurada i interoperabilitat real signada encara pendents. Este delta no certifica 126 mètodes complets ni 15 dimensions a 10.

**Relleu per a Claude:** integrar només el Kit CAS després del dry-run i Reflex propis, mantenint `socdepoble.org` amb la bandera apagada. No aplicar el panell Gemini actual amb els toots inventats o les mètriques de reserva. Els rebuts públics/natius i les esmenes exactes viuen a `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon/evidencies/`. El segell CAS final i el replay consten en l’apartat següent.

### Entrega CAS executable R3 · immutable

Ruta: `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon/`. Conté `fitxers/`, `pegats/`, `preimatges/`, `MANIFEST.json`, `SHA256SUMS`, `verifica_i_aplica.py`, `README_INTEGRACIO.md` i evidències. No cal cap secret per verificar o aplicar el codi en còpia. L’aplicació no desplega ni activa la variant Node 0 automàticament.

| Artefacte | SHA-256 ancorat |
| --- | --- |
| `MANIFEST.json` | `cc709422d99a1ed7fc69330810f948fed687d851f12b9ba5fa470ce10a740a60` |
| `SHA256SUMS` | `9f428d612bfde4d6a83e476d5fde6b2a88557ed78a122d2378130997066a07cf` |
| `verifica_i_aplica.py` | `7cf18ed61180ffb0bbb00d0adb2517fa717b77178d92d9ae03190bce414daf8b` |

Replay en TEMP: dry-run → apply → no-op → rollback sec → rollback → no-op; 38 postimatges SHA/mode exactes, tres preimatges restaurades, 35 fitxers nous retirats i dos sentinelles aliens intactes. La reversió conserva quatre directoris nous buits; no es declara l’arbre de directoris byte a byte idèntic. Verificació final **sobre el repositori viu, només dry-run: exit 0 i zero escriptures**, rebut `/tmp/sdp-node0-live-dry-run-final.json`, SHA `669eafb8e87eacd5620fe7f1a58d37ee58da388fc4c52148fea4af201af0ed41`. El lock és cooperatiu i el reemplaç és atòmic per fitxer; no és una transacció davant tall elèctric/SIGKILL. Els hashes acrediten integritat respecte d’este ancoratge, no autoria criptogràfica.

### Relleu de continuació per a MarIA · eixida i sessió local

### Entrega R5 segellada · replay independent 8/8

Ruta immutable: `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon_r5/`. **46 fitxers: 21 preimatges canviades sobre R3+R4 i 25 nous.** Layout CAS complet amb aplicador executable, pegat, preimatges i evidències. Base obligatòria: les 61 postimatges plegades R3+R4; el generador valida íntegrament els dos kits fixats sense executar-ne codi. `--check-base` és una precondició d’operador separada: l’aplicador universal valida només les rutes del delta. El preflight de les 61 ha passat sense escriptures, digest del plegat `4bfbc02dbedb8182bf908ba38bda44d34fdf2e9f137b8774ee57162c404b93fb`.

| Artefacte R5 | SHA-256 |
| --- | --- |
| `MANIFEST.json` | `61f58c8567877a49991c78aded75d11e0c4dcb0ace6831239ea50e7039666ba6` |
| `SHA256SUMS` | `2a7dd66ddc507a608b48ec0d2fe3e4756789785f8095aa157badae98d5d33a84` |
| Aplicador universal | `7cf18ed61180ffb0bbb00d0adb2517fa717b77178d92d9ae03190bce414daf8b` |
| Generador R5 revisat | `f9c9495dd55fe490e615b2ba54e62c86781fc592b1d88b4222b2a14d108fee62` |
| Rebut final d’evidències | `9a6084b1ec47f184f754eda938a7c481ee235e92b0c98dec34933e0485263072` |
| Rebut independent de replay, fora del kit | `ce9395a63b45214eb2206a96e3a7469f7d7982b7567e15103c6648ec811c2ad1` |
| `SHA256SUMS` del germà de verificació independent | `3566972fb1e4f466199a2384cc5c5cacaa90e8bae6bf0e820ccf487c83f7780e` |

**Replay independent final 8/8:** base de 61 postimatges reconstruïda des de zero a partir dels kits R3/R4 pinats, no de la còpia preparada per l’arrel. Integritat completa: 97/133/144 entrades de checksums dels kits R3/R4/R5, més cada sidecar, estables abans/després. Seqüència: basegate → dry-run46 → apply46 → no-op → rollback sec → rollback → no-op → basegate restaurada. Inventari complet de fitxers 63→88→63, SHA i modes exactes; dos sentinelles aliens 0640/0600 intactes. Una base només R3 és rebutjada amb `r5_base_postimage_drift` i zero escriptures. Harness SHA `52ab07c8d1ad96358be018c314e2a8b8626a31ce5ba5b974254b4534f04511d7`. Rebut, harness revisat i eixides persistits al germà `261104_kit_codex_node0_postgres_i_mastodon_r5_verificacio/`; no s’ha afegit res al kit segellat. Comparació de fitxers, no promesa d’identitat dels directoris buits ni transacció davant SIGKILL.

**Verificació del tall congelat:** 385/385 Node en 29 fitxers, cap salt/fallada/TODO; PGlite explícit amb 75 migracions i TLS real de loopback. 108/108 Vitest de l’arrel en nou fitxers; el constructor també aporta 128/128 en sis fitxers, amb contracte/adaptadorLocal, abast solapat que no se suma. Lint 0 errors/avisos. 27/27 natives en tres suites de LAB. Builds habitual i doble opt-in HTTP+privat: 238.935 i 238.924 B gzip d’entrada, sota 250.000; no s’han desplegat frontals. Es conserven avisos d’imports/chunks i `govern.json:git-absent`; no equival a consola global neta. Congelació de 46 postimatges, digest `dc6b0818e5ffaa9515c6d6af24c260979cf1827aea4354fda30d2eb48efa042d`, estable abans/després de QA i empaquetatge.

**SDK canònic R5:** `src/data/node0/clientPrivatNodeZero.js`, amb `VITE_SDP_NODE0_HTTP=1` i segon opt-in exacte `VITE_SDP_NODE0_PRIVAT=1`; el segon sol no tria Node 0. Espera sessió de cookie verificada abans d’injectar el backend; comprova capacitats reals i manté la lectura pròpia si el servidor no anuncia sessions. Port neutral intacte SHA `ef244b423076fc32f80d0730b89184ed3c0387bb6e9fd963f213f31fb601955c`. 26/32 mètodes implementats amb les capacitats necessàries; sis operacions pendents rebutgen explícitament. Bootstrap i helper reals han descobert un defecte entre realms: `instanceof Uint8Array` rebutjava bytes natius d’undici/JSDOM. Corregit amb marca i longitud intrínseques, sense acceptar DataView/Uint16/Clamped disfressats ni longitud ombrejada. Roig i verd conservats. Crítica independent acceptada, Node56/56 i Vitest27/27 solapats; rebut `critic-r5-sdk-canonical-composition.json` SHA `1e8b21aeee41e4332ce084eede2eef37a575b8af3574877dbd9e33826af2b182`.

**Continuació R6, sense tocar el segell:** UI de consentiment/contrasenya/contextos i comprovació del perfil RFC9421 entrant assignades a laboratoris ortogonals. Correu real, ingress privat de producció i OAuth Mastodon continuen pendents de configuració per MarIA; no són una petició humana bloquejant. No activar auth ni SPA només per aplicar R5. El replay independent està complet; continuem extingint el deute d’activació i interoperabilitat, sense donar per acabat el Goal.

### Ronda 5 · evidència operativa i regressions

**Tall nou 18:48 UTC:** actualitzat el runtime públic a dimoni `584c3ffd371d834e7420e910efb35b4c8c7e231261cbf3dd1815805c94ed3d58`, driver PostgreSQL `28d73dbaabb81d92518d392f478639c30a3ea7d41c87f59638836209d9723e6a`, hidratador `3fc2552a30d3b75b91c1e88ce7b10898569a4bb08dafa4151baf3304282ebceb` i pont client `74cbbfaaea6fc317f8813db56aed211487cfea3205a3fd993f8c38a9f842c23d`. Un únic `kickstart` del dimoni; cap reinici de PostgreSQL, Caddy o Vite 3340. Verificació TLS pública 18:48:19 UTC: huit rutes correctes, 32 documents, 40 taules, empremta intacta, inbox unsigned 401 i cua buida. Les capacitats privades noves tornen literalment `false` en producció. Rebut `/tmp/sdp-node0-r5-public-runtime-final.json`.

**Connexió privada real, només LAB:** preparador peer revisat amb 15 proves temporals i crítica independent. Aplicat amb CAS el pla `e77852516dfe64640a381a02e61aa8aa53059fa074deb3b11d9e81f6c307ab7e`: una regla HBA exclusiva de `node0_gauntlet_r4` per a `node0_authenticator`, mapa peer de `javi` i `reload` de PostgreSQL sense reinici. La base de producció no rep esta ruta d’auth. La prova nativa de les 18:30:41 UTC entra directament com `session_user=current_user=node0_authenticator`, sense embolcall `SET ROLE`: LOGIN/NOINHERIT, dues afiliacions SET estretes, zero privilegis elevats, accés directe a credencials/sessions/auth.users denegat i escalada a service_role/runtime denegada. Zero comptes i sessions creats per esta comprovació. El primer intent d’introspecció fallà correctament per falta d’USAGE sobre `auth`; corregit amb consulta de privilegis per OID, sense obrir l’esquema. Rebuts `/tmp/sdp-node0-r5-native-auth-peer-apply.json` i `…-proof-final.json`.

**HTTP → PostgreSQL 17 natiu: 27/27, zero omissions.** Tres suites inclouen dues connexions amb `pg_blocking_pids` real, exclusió per credencial abans del bloqueig de sessió, logout/rotació, serialització d’organitzacions pel mateix slug, Notes/perfil/organitzacions/publicacions/xat i una prova HTTP de loopback amb connexió directa d’autenticador. Alta de dues persones `example.invalid`, correu capturat només en memòria, confirmació, cookie HttpOnly/Secure/SameSite, acceptació amb data real, canvi de cookie entre pestanyes rebutjat amb 409 i zero escriptures, origen/mètode privats denegats, publicació de membres absent de tots els endpoints públics i logout efectiu. Les fixtures generades es netegen; zero peticions externes i cap persona de prova en producció. Primer roig del fixture HTTP: `SELECT true::jsonb` no és un cast admés per PostgreSQL 17; substituït per `to_jsonb(true)` i reexecutat en natiu. Rebut `/tmp/sdp-node0-r5-native-business-http-final.tap`.

**P2 Unicode tancada en el codi del carril:** el tall antic de 219 ASCII + emoji produïa un subrogat orfe i `jsonb` el rebutjava amb 22P02. `retallaTextFederat` usa pressupost de punts de codi, conserva grafemes amb `Intl.Segmenter` i substituïx Unicode invàlid per U+FFFD; summary 220, cos AP 5000, hidratació i format REST ≤500 ja no usen el tall UTF-16 defectuós. Huit regressions amb PGlite real, incloent Create entrant signat, ZWJ, combinants, banderes i DTO persistit. Passada conjunta posterior: **95/95** de federació/Unicode/transport, sense omissions; és un abast solapat, no se suma a altres recomptes. Això no acredita la utilitat AH-07 ni l’accessibilitat del carril Gemini.

**Lectura viva del Llibre actualitzada:** lectura semàntica íntegra delegada de la nova instantània de 280.509 B, SHA `594008d047978fb82031c111e2f12e69114a617d316dc746bcf252d2a56ccb54`, 26/26 fragments sense truncar i reconstrucció exacta. Rebut crític `critic-r5-llibre-mestre-semantic.json`, SHA `adde7a8dd1fac31b07177069b3a4ce0c143c76ded0e22cc980cf24d277560fd7`. AH-07 i deute propi tenen prioritat abans de noves idees. La crítica actualitzada v2.2 consta més avall; no s’arrosseguen els dos P1 històrics ja resolts.

**Desplegat al Node 0:** dimoni i pont actualitzats al perfil RFC9421 Ed25519, actor amb `assertionMethod` Multikey i el mateix PEM/empremta `f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11`. El verificador natiu ha signat i verificat localment amb la clau existent, **sense xarxa ni cap activitat en cua**. Cua buida abans del reinici autoritzat. Prova pública a les 18:07:12 UTC: estat, actor, WebFinger, outbox, Mur, NodeInfo i web a 200; inbox sense signatura a 401. `signatureProfile:rfc9421-ed25519`, PostgreSQL 17.11, 75 migracions i els mateixos 32 documents. Continuen **`remoteInteropVerified:false`, `outboundConfigured:false` i `userSessions:false`**. No s’ha publicat cap toot ni activitat de prova.

SHA del primer tall desplegat R5 de les 18:07, substituït pel tall de les 18:48 indicat damunt: dimoni `b1ba3b32100cc663d4ee4d288b9a4923f5119bcc1978629d1789886b20097144`; pont de servidor `91832392516e28db3af589b906241ed1c4406bc5ec6cfc93223c0d5b7edf3f73`; signador `ec9678959959d5844aa164db8f0b2d280c076d68dd44fb7a116e9cdebf152f95`; projector Multikey `3e99672a88286feed588dbdcd7ba6a06806b419e226891ed77340e073b8bba11`. Les preimatges de runtime es preserven a `socdepoble-node0-r4-runtime/`. R3/R4/R5 continuen immutables; l’entrega executable final R5 està ancorada en la taula superior.

**Verificació federada focal:** vector oficial RFC9421 B.2.6 byte a byte, crypto independent Node/WebCrypto, TLS local real amb 202→401 manipulada→202; 31 proves de signador/projector entre constructor i àrbitre. Passada d’integració de l’arrel **87/87, zero salts**, amb PGlite real per cues/tombstones/leases. Un treball massa gran no bloqueja el següent; l’Accept només reflectix els quatre camps de Follow necessaris. No s’equipara este TLS de laboratori amb una entrega Mastodon real.

**P1 token corregida:** un token d’un altre compte podia efectuar un POST abans que la resposta revelara l’actor incorrecte. Ara `GET /api/v1/accounts/verify_credentials` comprova el compte exacte abans del POST. Compte incorrecte, cancel·lació o timeout en el GET = zero POST. Un POST ambigu continua sense reintent automàtic. Revisió independent 64/64, amb solapament respecte de les 87 de l’arrel: no sumar-les. El token futur necessita `profile` o `read:accounts`, a més del permís de publicació; MarIA té el pendent de configuració, sense crear cap credencial ni preguntar al Mestre.

**Autenticació/escriptura, laboratori:** `X-SDP-Expected-Actor` es compara amb l’usuari de la cookie validada **dins de la transacció**; no és una font de propietari ni de claims. Cookie B amb UI A retorna 409 i no escriu. Logout, contrasenya i normes fan també la comparació al servidor, i un mismatch no esborra la cookie de B. Passada nativa **14/14**, amb revocació/locks, Notes, perfil, xat i empresa canònica amb propietària real de prova. Els dos obstacles d’empresa es corregiren amb `SELECT(id)` mínim de towns i projecció de columnes autoritzades d’organizations, sense ampliar RLS. Tot només en `node0_gauntlet_r4`; producció conserva zero usuaris/perfils.

Publicació i paginació sota RLS de membre: nova prova independent **12/12 PGlite**, amb normes exigides, autoria/entitat, aïllament, 51 dates amb microsegons i pressupost d’1 MiB per pàgina amb cursor explícit. SELECT/INSERT/UPDATE es concedixen només a les columnes necessàries d’`authenticated`, sense anon ni bypass. Esta funcionalitat i el client de cookie encara no estan activats en producció. El helper privat exigix actor esperat i saneja també excepcions externes amb codis falsificats; 29/29 focals. UI de consentiment versionat, proxy autenticat real i correu continuen en preparació.

**Gauntlet creuat actualitzat, Gemini v2.2:** reexecutats els reproductors sobre el kit immutable actual de 39 fitxers, MANIFEST `3b0a03f270bf263ac40b2e6ef1918e28e27b1cc3361e2aab9e24c9f76c32e17e` i component `3f9d3bb13e9721abe7bbbff257d83a3174c4985ff3d3ead161656021e10f73a5`. **G2-01 i G2-02 resolts:** `feedPosts` real es mostra sense consultar tercers, i compte absent/buit ja no permet atribuir publicacions alienes a `@depoble`. Es retiren els dos P1 històrics. **G2-03 continua com P2:** la petició d’estat retira el controlador/termini en rebre les capçaleres, abans d’acabar `.json()`; desmuntar amb el cos bloquejat no avorta eixa lectura. Sonda 3/3: dos tancaments i una reproducció persistent, no tres esmenes. 39 payloads i 116 checksums contrastats abans/després sense escriptura al kit. Rebut `critic-r5-cross-reports-v22.json`, SHA `36aa42c595cfc594562b0bfa80e30b409f5547df4812f59df654cb3de427422e`. Les metadades acrediten AH-06/rondes 1–8, no AH-07/R9. Claude ha reconegut C1-01/02 i N0-01/02 de R4; els recomptes dels carrils no són intercanviables.

### Entrega R4 verificada · Goal continua en R5

R3 continua immutable. R4 també queda segellat i immutable en `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon_r4/`, amb `fitxers/`, `preimatges/`, `pegats/`, manifest, sumes, aplicador executable, README i evidències. Conté **35 fitxers: 12 canvis sobre postimatges de R3 i 23 camins nous**. No afegir-hi rebuts posteriors: la verificació independent del segell s’arxiva en el directori germà `261104_kit_codex_node0_postgres_i_mastodon_r4_verificacio/`.

| Artefacte R4 | SHA-256 |
| --- | --- |
| `MANIFEST.json` | `4a0224886368516031b9da5ebd3339f15f8221c06795c871a361e74b4ef0932c` |
| `SHA256SUMS` | `12778b2f0f18c027069aa87cf774bb1ae4d124370ed7a57f85f67e4c3fc2bc56` |
| Aplicador, sense canvi respecte de R3 | `7cf18ed61180ffb0bbb00d0adb2517fa717b77178d92d9ae03190bce414daf8b` |
| Rebut independent de replay, fora del kit | `0d22a72dc9d4e8999a094c9346b68c6878416a859b6bd9a7f816339137f1d8a8` |

**Verificació final del constructor:** **264/264 Node en 21 fitxers, zero salts/TODO/fallades**, amb les 75 migracions PostgreSQL WASM i TLS local real; **159/159 Vitest en huit fitxers**; **12/12 natius**, zero salts; lint 0 errors/avisos. SHA/modes de 61 fonts estables, 35 amb delta CAS. Dos builds finalitzen exit 0 i passen el pressupost de 250.000 B gzip: habitual **239.675 B**, opt-in **238.905 B**. No s’ha desplegat cap dels dos frontals. Rebut `evidencies/root-release-verification.json`, SHA `62dc58bff52d6cae2236dccc529e7205c16fd3f0dffe4b1e95127f2a289cea54`. Les bateries independents solapades no se sumen a estos recomptes.

**CAS i reversió:** integritat completa R4 exit 0; R3 conserva els tres pins originals. Replay independent 8/8 en TEMP: R3 ja aplicat → R4 dry-run → apply → no-op → rollback sec → rollback → no-op → comprovació final R3. Les 35 postimatges concorden en bytes i modes; tornen les 38 postimatges R3 més dos sentinelles aliens 0640/0600, tots intactes. Es compara l’inventari de fitxers; no es promet identitat dels directoris buits. El generador exigix una base R3 completament aplicada i verifica els bytes de l’aplicador abans d’executar-los per stdin. L’aplicador del delta comprova CAS dels fitxers inclosos, no les altres postimatges de R3; el README exigix el preflight R3 complet. Lock cooperatiu i reemplaç per fitxer no equivalen a una transacció davant SIGKILL/tall elèctric.

**N0-01 confirmat i corregit:** el transport HTTPS construïa una `Response` amb cos en els estats 204/205/304 i podia tombar el procés. Reproducció roja en subprocessos TLS locals; correcció amb cos nul, captura de constructors invàlids, HEAD, upgrade, terminis i cancel·lació. Constructor i àrbitre han reexecutat **19/19** proves amb TLS real de loopback. Un primer intent restringit pel sandbox fallà en `listen EPERM`; és un error d’entorn conservat, no una regressió del transport ni una prova verda.

**N0-02 confirmat i corregit:** l’inbox compartia un únic cubell perquè Caddy es veu com `127.0.0.1`. La quota de 30/min s’aplica ara a l’actor després de verificar-ne la signatura; el trànsit sense signatura no la consumix i canviar IP/XFF no l’evadix. S’hi conserva un sostre global separat de 300 peticions signades/min per al cost previ. Prova independent roja→verda i reexecució del constructor. Les dos correccions ja s’han transferit i s’ha reiniciat **només** `cat.socdepoble.node0-soberania`; launchd confirma `running`. SHA del dimoni desplegat: `5245b5e9b63bc9763e9b8cf6f2303b48d80f279260cd38a0250020294030dc71`; transport: `25b68f3dd38dd03ea67b9ffce715243bcfa5bb6e73004f9af93e7d2794036fd6`. Les preimatges de runtime es conserven al Mac mini en `socdepoble-node0-r3-runtime/`.

**Identitat i escriptura, només en laboratori:** creada la base nativa separada `node0_gauntlet_r4`, PostgreSQL 17.11 i 75 migracions, inicialment zero persones/notes. Les altes sintètiques de prova s’hi creen amb transport de correu controlat i token d’un sol ús; cap perfil de prova entra en `socdepoble_node0`. Primera passada nativa trobà que `icon`/`publish_date` no existien en el DDL canònic i que la RPC del xat retorna `cos`; corregits els DTO sense inventar migracions. Passada posterior **7/7**: dos usuaris, confirmació, cookies opaques, grants privats, notes/revisions/aïllament, perfil propi, directe/xat per RPC i logout. Prova independent addicional amb 75 migracions PostgreSQL WASM confirma també el rebuig d’una tercera persona no participant.

**Concurrència real:** la primera passada fou **4/4** en dues connexions natives persistents, amb `pg_blocking_pids` observat abans d’alliberar la transacció. Una prova adversarial posterior trobà un ordre de locks inconsistent, reproduït en natiu amb SQLSTATE `55P03`: context podia retindre la fila de sessió mentre esperava la credencial. S’ha afegit el prelock de credencial abans de la resta i s’ha repetit exactament la mateixa prova, verda. Passada nativa final conjunta **12/12, zero salts**, amb notes/perfil/xat i concurrència. Logout i rotació esperen el commit autoritzat, les transaccions següents reben 401, l’altre usuari continua i la versió antiga no crea sessió. SQL candidat final: `85e332aeb7efbce0d65dafa6e45915cf1f06438dfe755939ca0ce1eb5d42260e`; només aplicat al laboratori. No acredita absència de tots els deadlocks possibles.

**C1-01/C1-02 corregits:** el nou informe de Claude i una execució independent de 100 proves Vitest trobaren **98 verdes i dos roges**: export addicional `injectaNodeZeroHttp` i importacions directes de `local` en el nucli. Les 76 proves seleccionades de R3 no incloïen eixes dos portes; el seu verd no les acreditava. R4 restaura els bytes originals de `backendPort.js`, usa `injectaBackendDelPaquet` existent i fa que `main.jsx` importe l’arrencada canònica de `src/data/node0/`. Les implementacions viuen en `node0/`; els camins `src/data/local/adaptadorNodeZeroHttp.js`, arrencada i sessió són reexports compatibles. L’àrbitre ha repetit les mateixes portes: **100/100 verdes**, a més de les 159 finals del constructor. No integrar R3 sol.

**Clon net i capacitat absent:** un ZIP canònic absent pot reconstruir-se en memòria des de la instantània versionada, exigint exactament SHA `fb1611627c2cd2e23defe38f04d9dd58ed7cdc2a95766d5c5fc381f500a651be`, sense xarxa ni escriptura pública. Un ZIP corrupte no usa fallback. La dependència del generador es carrega només si cal reconstruir, perquè el Node 0 amb ZIP existent no necessita les eines de build. Les 75 migracions no contenen `xat_marca_rebut`: el rebut d’entrega independent retorna 501 sense executar SQL ni marcar lectures fictícies; la marca de lectura explícita sí funciona, provada en natiu.

**Estat públic després de R4:** l’àrbitre independent ha verificat a les 17:24:37 UTC els endpoints públics i la web a 200, amb 32 documents/75 migracions, zero usuaris/perfils de producció i `userSessions:false`. Les rutes privades desactivades retornen 503 sense CORS públic. PostgreSQL PID 19554 i Caddy PID 20010 preservats; API nou PID 21700, serveis `running` i últim exit 0. Rebut `evidencies/native-r4-independent-readonly.json`.

**Nova frontera R5 de federació:** el codi oficial Mastodon 4.7.5, commit `24cd1c875a1ac393e587421726394d5692ff5496`, indica que el nostre perfil Ed25519 amb hs2019 antic no és interoperable: cal RFC9421 i `assertionMethod` Multikey coherent amb la mateixa clau. És una inferència del codi, **no una entrega remota real**. La signatura criptogràfica local de R3/R4 no acreditava interoperabilitat; `remoteInteropVerified:false` continua correcte. Recerca i fonts en `evidencies/mastodon-4.7.5-signatures-research.md`. Signador i verificació adversarial R5 avancen en `.r5-lab/`, separat de les fonts segellades. El token Mastodon i el correu/proxy d’auth continuen pendents de configuració per MarIA, sense cap pregunta al Mestre ni creació de credencials.

**Fronteres per a MarIA abans d’activar:** auth, RPC privades, helper de cookies i ingress autenticat són candidats verificats però **no estan activats en producció ni integrats en la SPA**. Sense correu, el registre retorna 503 abans de crear una persona. El consentiment ha de portar versió explícita; l’Onboarding actual encara no la transmet. El canvi de contrasenya exigix la contrasenya actual. Una petició d’auth sense identificador de proxy confiable és refusada abans del límit i del KDF: mai es pren XFF ni el loopback compartit com a identitat. Cal configurar el canal intern autenticat de Caddy i l’enviament real de correu, adaptar la UI i completar el contracte restant. No es declara OAuth/MFA/Storage/Realtime funcional ni conformitat dels 32 mètodes. El token d’eixida Mastodon continua absent; no s’ha creat cap credencial ni publicat cap toot de prova.

Després de segellar R3 s’ha comprovat l’accés disponible a Mastodon: el navegador seleccionat està en mode anònim i no hi havia cap sessió oberta. La ruta local exacta `/Users/javillinares/.config/socdepoble/node0.env` tampoc existix; al servidor, l’estat real continua `outboundConfigured:false`. Esta observació no altera el compte ni crea cap credencial. MarIA té el context del secret que falta per a l’eixida; no s’ha interromput el Mestre amb preguntes ni botons. La continuació del Goal conserva com a pendents la sessió/escriptura de persones i la interoperabilitat remota, sense donar-les per acabades.

**Actualització operativa 17:23 CET:** PostgreSQL 17.11 natiu i persistent, 75 migracions, dimoni 4340 i Caddy 2.11.8 ja desplegats. `https://socdepoble.cat/api/v1/node0/status` respon **200 application/json, Via Caddy, PostgreSQL ok**, 40 taules públic+node0, 8 posts (7 reals de Mastodon), 3 entitats i empremta Ed25519 existent `f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11`. La sessió d’usuari local i l’activació de la SPA encara queden parcials: el panell ha de reflectir literalment eixos camps, sense prometre més.

**P1 · Esmena per a Gemini / MarIA / Claude abans d’integrar el kit UX:** la revisió independent del payload `PanellNodeZeroMastodon` ha trobat tres toots de mostra inventats atribuïts a `@depoble`, versió PostgreSQL 16 i comptatges de taules per defecte inventats. Cal eliminar-los i mostrar estat buit o dades verificades: el pont real és **`src/data/federacio/pontMastodon.js`**, no `src/data/pontMastodon.js`. API/RSS/AP reals ja retornen 7 posts i 5 imatges; useu el traductor verificat amb autoria, visibilitat i dedup URI. Estat desconegut = `—`, mai «6 taules» o una versió suposada.

**P1 · Endpoint del panell:** una petició relativa `/api/v1/node0/status` des de `socdepoble.org` consulta Firebase, encara que la targeta diga «socdepoble.cat». Useu explícitament `https://socdepoble.cat/api/v1/node0/status` i exigiu JSON amb `postgresql.ok === true`. L’informe UX declara un import/AbortController que no es corresponien amb el component auditat; cal revalidar els bytes finals i no copiar la declaració com a prova. Estes troballes no muten el carril de Gemini i impedixen donar-li 10/10 abans de l’esmena.

Històric del primer tall: Gemini 1636 era una plantilla amb pendents, sense kit auditable. Posteriorment ha publicat el kit; les P1/P2 reals de la Ronda 3 estan descrites damunt i en `critic-gemini-integration-ronda6.json`. Claude 1636 Ronda 0 s’ha llegit íntegre: les portes verdes són evidència declarada pel seu carril, encara no una reexecució nostra.

La rúbrica inicial de Claude diferia de la taula explícita del pla `261101_1246`, línies 52–66, referenciat pel Llibre: **D09 Notes i Karpathy Local; D10 Memòria Oral, Patrimoni i Multimèdia; D11 Comunicació i Xat Rural**. La relectura posterior confirma que Claude ja ha corregit els noms; esmena tancada sense editar l’informe alié.

| Dimensió canònica | Acreditació d’esta ronda /10 | Límit observable |
| --- | --- | --- |
| D01 Port Neutral i Model B | 8 | SDK opt-in 26/32, port exacte i sessió verificada abans d’injectar; UI i activació de producció pendents |
| D02 Pedra Seca i Geometria HD | 0 | Cap certificació visual nova del carril Codex |
| D03 Accessibilitat Rural AAA | 0 | Cap prova d’AT/AAA nova |
| D04 Sobirania i Open Data Municipal | 9 | PostgreSQL 17 natiu, 75 SQL, ZIP i fonts públiques actuals; perfils/propietat canònica pendents |
| D05 ActivityPub, NodeInfo i WebFinger | 8 | Ingesta/endpoints reals, RFC9421 i Multikey desplegats; encara sense entrega remota acceptada |
| D06 WordPress.org i amfitrions | 0 | Cap nova execució del connector |
| D07 Replicabilitat de Nodes Germans | 8 | R4 CAS 8/8, clon sense ZIP resolt i reaplicació nativa; instal·lació fresca en menys de 15 min no certificada |
| D08 Privacitat, RLS/RGPD i E2EE | 8 | ACL natives, fitxers 0600, POST/CORS i cues provats; auth local i E2EE pendents |
| D09 Notes i Karpathy Local | 6 | Notes privades/revisions entre dos usuaris provades en laboratori natiu; UI i ús de persones no activats |
| D10 Memòria Oral, Patrimoni i Multimèdia | 4 | Primer arxiu local navegable10 peces+2 mitjans+ZIP, dump xifrat;8 URLs pendents,5 mitjans externs omesos i cap fitxa oral nova |
| D11 Comunicació Comunitària i Xat Rural | 4 | RPC de directe/text/lectura i aïllament provats al laboratori; UI, Realtime i E2EE Node 0 pendents |
| D12 Multilingüisme i Traductor Sobirà | 0 | Cap diccionari ni traductor validat en este delta |
| D13 Botigues Mòbils i PWA | 0 | Cap compilació nativa nova |
| D14 Governança, Telemetria i Consola | 9 | Estat PostgreSQL públic real i rebuts amb fonts congelades; panell UX alié pendent d’esmena |
| D15 Rendiment i Resiliència Rural | 8 | Dos modes de build sota pressupost, primera generació atòmica xifrada i salut honesta; Workspace absent, restauració/càrrega/failover no certificats |

**0 significa cap acreditació nova en este carril, no qualitat nul·la del producte existent.** No es concedix un 10/10 global fictici.

### AH-10 · Càtedra de codi, esquema i Autopia d’Usuari

Estudi complet incorporat a l’informe del carril. Lectura i recerca delegades en dos subcarrils, amb relectura semàntica dels dos textos per l’arrel; això no atribueix a l’arrel l’auditoria íntegra de totes les fonts Rails. Base immutable comuna Mastodon 4.7.5 `24cd1c875a1ac393e587421726394d5692ff5496`, HEAD observat separat i catàleg real del Node 0. Fonts i rebuts locals: eixos 1–5 SHA `e26d132f79e2137c4150d0b8a0e10de9cafb2530cd970588cefb474491af65af`, rebut `2376ae21ad39b63510a6f0aaaf82f6ed9f062036e2ba26bd346277a640fc38b9`; eixos 6–10 SHA `3be2c27a7e3fa6abc929498cb8681b683daf43f77424094e8a2fbee11cae8fd6`, rebut `3a7f05fea919f46bc33dfffecf140b85300c5091d01a9af3c8e6c54ea00773c4`. Cap taula o ruta proposada es declara desplegada. El token OAuth sí està configurat segons l’estat vigent R6; els textos d’estudi no impliquen cap POST.

## AH-10 · Perfil, privacitat, experiència, graf i filtres

**Estudi de font i proposta d'enginyeria; no implementació ni activació de producte.** Carril Codex, subcarril Node0. Data de recerca: 4 de novembre de 2026. Este document cobreix els eixos 1–5; els eixos 6–10 tenen un altre document i rebut. El rebut propi és `eixos-1-5.sources.json`. Les còpies de fonts permeten repetir la comparació sense dependre d'una branca que es moga.

### 1. Què s'ha contrastat i què significa «existent»

La referència comuna és **Mastodon 4.7.5, commit `24cd1c875a1ac393e587421726394d5692ff5496`**, publicat en el repositori el 3 de novembre a les 15:24:41 UTC. S'han descarregat 64 fitxers d'eixe commit i verificat tots contra la seua empremta Git blob. El model, esquema, controladors, serialitzadors, serveis i vistes es contrasten conjuntament: una casella d'una vista no acredita per si mateixa autorització ni emmagatzematge. La llicència del projecte es conserva entre les fonts. [Commit de referència](https://github.com/mastodon/mastodon/commit/24cd1c875a1ac393e587421726394d5692ff5496).

Com a segona capa, s'han contrastat 12 fitxers d'upstream HEAD **`ca2f092f4f580b1993bae3ac4f4742b748f18ad1`**, del 4 de novembre a les 18:32:36 UTC. HEAD és una observació de desenvolupament, **no la versió instal·lada en `mastodont.cat`**. Dels 12, no canvien `LICENSE`, `account/field`, `follow`, `follow_request`, `list` i `list_account`. Sí canvien `account`, `user`, `user_settings`, `status`, `settings.yml` i `schema.rb`. La comparació no extrapola a fitxers no descarregats. [HEAD observat](https://github.com/mastodon/mastodon/commit/ca2f092f4f580b1993bae3ac4f4742b748f18ad1).

En Sóc de Poble es distingeixen quatre plans:

| Pla | Evidència usada | Allò que es pot afirmar |
|---|---|---|
| Repositori viu `socdepoble.org` | Codi de perfil, accessibilitat, cerca, Supabase, seguiments i migracions, llegit sense escriptures | Hi ha funcionalitat real que no s'ha de tornar a inventar. La integració d'una nova ruta només es dona per feta si el codi viu la conté. |
| Kit R5 segellat | Payload i manifest immutables | Hi ha un SDK Node0 privat parcial i composició explícita; un kit verificat no és una activació de la SPA de producció. |
| Candidat aïllat R6 | Fonts llegides a `/tmp/sdp-codex-node0-mastodon` | La feina addicional d'autenticació, privacitat de consultes i reconciliació té proves pròpies, però no transforma automàticament els esquemes ni les capacitats de producció. |
| PostgreSQL de producció Node0 | `node0-esquema-prod.json`, consulta de metadades a les **19:35:33.324 UTC**, `userRowsRead: 0` | **68 taules** en total: 34 `public` +6 `node0` =les **40 anunciades**, més 26 `private` i 2 `auth`; 75 migracions registrades i 265 signatures de funcions. No s'han llegit files personals. Les taules pròpies d'autenticació Node0 del laboratori no hi apareixen. |

L'empremta del catàleg és `aa4bf275a99ea3a10cdef102de83a71e4054a3218d27053f882666b11e30ce09`. És una observació datada; no substitueix el preflight d'una migració posterior. No s'han inspeccionat definicions de les 265 funcions ni dades d'usuaris amb eixa consulta. L'anàlisi de polítiques es completa amb les migracions de font pertinents.

En la lectura d'esta ronda, **`src/data/node0` no existeix al repositori viu**; sí que existeix al kit R5 i a la còpia aïllada. Per tant, ni el SDK, ni els formularis privats, ni les futures opcions d'estudi es presenten com si ja estigueren disponibles per a un veí en producció. El servei Node0 públic amb PostgreSQL propi és una realitat distinta de l'activació d'`AUTH` o d'un proveïdor de correu. La configuració privada continua subjecta a ingress, correu, rols i integració verificats.

#### Correspondència de dades real, abans de proposar taules

| Concepte Mastodon 4.7.5 | Emmagatzematge Mastodon | Sóc de Poble real observat | Decisió |
|---|---|---|---|
| Identitat visible | `accounts`; credencials/preferències en `users` | `auth.users`, `public.profiles`, `public.organizations`, membresies | Reutilitzar identitat i gestió d'entitats. No fer una segona taula de persones perquè Mastodon tinga `accounts`. |
| Camps addicionals de perfil | **`accounts.fields` JSONB**, array de camps amb nom/valor/verificació | Camps canònics de perfil i presentació rica; no equivalent de verificació `rel=me` acreditat | Afegir metadades acotades i prova de web com a ampliació explícita, sense convertir HTML lliure en identitat verificada. |
| Publicació i audiència | `statuses`, visibilitat i destinataris; serialitzadors REST/AP | `public.section_submissions`, `public.app_content`, `node0.public_documents`; notes i xat separats | Modelar una audiència que es puga executar al servidor abans d'oferir-la al selector. |
| Preferències personals | `users.settings`, `locale`, `chosen_languages` | `UIContext`, `theme.js`, `i18n.js`: opcions locals; `private.ajustos` no equival automàticament al model Mastodon | Conservar Model B. Separar configuració del dispositiu, preferències de lectura i permisos de publicació. |
| Seguir persones/comptes | `follows`, `follow_requests` | `public.seguiments` + RPC; `private.connexions_*` per privacitat de graf | Reutilitzar RPC i semàntica de persones/entitats. Unir-se a una entitat no és demanar seguir un compte tancat. |
| Llistes personals | `lists`, `list_accounts` | No equivalent de llista social acreditat; carpetes de notes tenen un altre propòsit | Introduir llistes privades derivades del graf, sense donar drets sobre el contingut. |
| Nota privada sobre un compte | `account_notes` | `public.notes` són documents privats rics | Fer un recurs diferent; no reutilitzar un document publicable per a una nota de relació. |
| Filtres personals | `custom_filters`, `custom_filter_keywords`, `custom_filter_statuses` | Bloquejos, cerca i proteccions de xat existents; no equivalent de filtre contextual acreditat | Implementar després d'autorització i abans de representació, amb propietari i caducitat reals. |

El `db/schema.rb` de Mastodon és l'esquema Rails; els controladors usen `current_account`, serveis i scopes OAuth. **No és una especificació de RLS PostgreSQL per a Node0**. Copiar-ne les taules sense la capa d'autorització no traslladaria la seua seguretat. [Esquema fixat](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/db/schema.rb).

### 2. Eix 1 · Perfil, metadades i prova descentralitzada

#### Com funciona de veritat Mastodon

El perfil té `display_name`, `note`, avatar, capçalera i descripcions alternatives de les imatges. La identitat local i la remota no tenen exactament els mateixos límits. El model fixa 40 caràcters per al nom local, 500 per a la nota local i 30 per al nom d'usuari local; conté límits defensius més amplis per a dades remotes. No convé substituir els límits locals de Sóc de Poble pels remots d'un protocol. [Model Account](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/account.rb).

Els camps de metadades no són una taula il·limitada clau-valor. En esta versió són una columna JSONB amb **quatre camps locals** (`DEFAULT_FIELDS_SIZE = 4`); `Account::Field` valida nom i valor, aplica un límit local de 255 i representa `verified_at`. El comportament preserva la verificació d'un valor que no ha canviat; no s'ha de marcar un nou URL com a verificat perquè conserve l'etiqueta del camp. [Account::Field](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/account/field.rb).

`VerifyLinkService` demana una pàgina HTTPS i analitza l'HTML de resposta, sense executar JavaScript. Busca un `<a>` o `<link>` amb `rel=me` que torne al perfil. Hi ha una compatibilitat addicional limitada amb redirecció del primer enllaç. La classe de camp descarta URLs amb credencials i determinades normalitzacions de nom que podrien confondre l'usuari. El resultat acredita control de dos extrems web, **no identitat civil, competència professional, propietat d'una cooperativa ni rol d'administrador**. El procés és asíncron mitjançant worker. [Servei](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/services/verify_link_service.rb), [worker](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/workers/verify_account_links_worker.rb), [explicació oficial](https://docs.joinmastodon.org/user/profile/).

L'actual edició del perfil no s'ha de descriure només amb una captura antiga del formulari de servidor. La font 4.7.5 inclou l'editor React `features/account_edit`, modals per als camps, verificació i visibilitat. El controlador de credencials ofereix també una superfície API amb llista de propietats permesa i àmbits `write:accounts`. `discoverable` i `indexable` no són una marca honorífica en el perfil, sinó controls de descoberta i indexació amb efectes diferents. [Editor](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/javascript/mastodon/features/account_edit/index.tsx), [API de credencials](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v1/accounts/credentials_controller.rb).

#### Què hi ha a Sóc de Poble

`perfilCamps.js` ja normalitza nom, biografia, lema, presentació HTML, avatar, imatge principal i icona; conserva una distinció coherent entre persona i entitat. Els límits de producte observats són nom fins a 120, bio fins a 500, lema fins a 256 i presentació rica fins a 20.000. El codi saneja la presentació per a la representació; això no converteix una escriptura SQL arbitrària en segura ni justifica confiar en HTML procedent d'un actor federat.

`public.profiles` té `is_public`, `visibility`, `username`, territoris, `baixa_demanada_at` i els camps visuals. La restricció de `visibility` a `'private'` no significa que tots els perfils tinguen la mateixa representació: la decisió real de fitxa completa usa `is_public`. La migració de perfil públic per defecte respon a una ordre anterior explícita; l'estudi no la canvia. En l'adaptador Supabase, `perfil_public` és una lectura autenticada: perfil complet si està publicat, i mínim nom/foto/poble sota les condicions municipals si és privat. **«Perfil públic» en eixe flux no és una promesa de lectura anònima des d'Internet.**

La política d'actualització pròpia coexisteix amb una política restrictiva de baixa. `FORCE RLS` és fals en el catàleg, de manera que el camí de servei ha d'evitar el rol propietari o `BYPASSRLS`; no s'ha d'interpretar el nombre de polítiques com una demostració suficient. La migració `2610160250_perfil_update_propi.sql` preserva explícitament la restricció i els `GRANT` de columnes.

#### Adaptació proposada

La fitxa actual és la base visual. Afegir un bloc «Enllaços i dades de la fitxa» amb quatre camps inicials; si es vol ampliar a N, el servidor declara el màxim, la UI el mostra i una restricció el fa complir. Un límit màxim dur diferent només s'introdueix amb pressupost de bytes, migració i proves; no s'ofereix una llista sense límit.

La verificació viu en dades que l'usuari no pot escriure: `verified_at`, URL normalitzat, valor/hash de la revisió comprovada i resultat del treball. Canviar el valor invalida el resultat en la mateixa transacció; un treball antic no pot verificar una revisió nova. La UI mostra «Este web enllaça a la teua fitxa», amb l'última comprovació, i manté separades les credencials d'entitat acreditada.

El worker requereix una política d'eixida pròpia: HTTPS, DNS públic comprovat en cada salt, cap adreça loopback/LAN/link-local ni metadades de núvol, límit de redireccions, temps i cos, cap credencial i cap execució de JS. L'allowlist específica de `mastodont.cat` que usa la ingesta actual no és un verificador genèric de webs. Tampoc s'ha d'enviar el navegador del visitant a comprovar cada camp, perquè revelaria les seues visites. El rendiment es resol amb cua i memòria cau del servidor.

Per a entitats, la mateixa UX només permet edició a qui realment les gestiona; no s'accepta un `ownerId` del formulari com a prova. En una primera fase la fitxa es manté local. Un actor AP per persona o entitat exigeix una decisió d'identitat, URL, claus i migració pròpia: no s'obté canviant el nom de l'actor comunitari actual.

**Acceptació mínima:** UTF-8 i grafemes, parells nom/valor buits, límit N, HTML injectat, enllaç HTTP o amb usuari/contrasenya, IDN confusible, redirecció a LAN, DNS reassignat, cos enorme, treball antic després d'editar el camp, edició d'una entitat aliena i resposta per a una persona amb sessió revocada. Una prova de web reeixida mai ha de modificar rols o consentiments.

### 3. Eix 2 · Audiència, descoberta, graf i indexació

#### Quatre decisions que no s'han d'ajuntar

| Decisió | Mastodon 4.7.5 | Conseqüència per a Sóc de Poble |
|---|---|---|
| Qui pot llegir una publicació | Visibilitat i destinataris de l'estat; `public`, `unlisted`, `private`/seguidors i `direct` en la superfície d'usuari | El servidor i cada índex han d'executar l'ACL real. Un nom del desplegable no la crea. |
| Com apareix un compte | `discoverable`, bloqueig de seguiments i presentació de col·leccions | Optar a un directori, aprovar seguidors i mostrar el graf són controls diferents. |
| Si el contingut entra en cerca pública | `accounts.indexable`, treballs de l'índex públic si Chewy està habilitat | Ha d'existir alta i retirada efectives de l'índex, amb versió i tombstone; no sols un booleà al perfil. |
| Què es demana als robots externs | `users.settings.noindex`, marcat HTML i `robots.txt` de la instància | És una política de rastreig, no una barrera d'accés ni garantia contra còpies o entrenament d'IA. |

El valor per defecte per a noves publicacions està en preferències de l'usuari; les opcions per defecte són pública, no llistada o seguidors. Una menció privada no és un valor per defecte general. La configuració del compte tancat influeix en el valor efectiu quan no hi ha preferència explícita. Un canvi de preferència **no reescriu l'audiència de tot l'històric**. [UserSettings](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/user_settings.rb), [preferències de publicació](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/views/settings/preferences/posting_defaults/show.html.haml).

L'opció `accounts.indexable` desencadena treballs d'alta o retirada de **publicacions públiques**, excloent boosts, en l'índex públic; el concern ho condiciona a `Chewy.enabled?`. `users.settings.indexable` és, en canvi, un àlies invers de `noindex`. La vista de privacitat conté les dues opcions, encara que compartisquen una paraula. Confondre-les produiria un únic botó amb dues promeses incompatibles. [Concern d'indexació](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/concerns/account/statuses_search.rb), [vista de privacitat](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/views/settings/privacy/show.html.haml).

La font de `robots.txt` de 4.7.5 **ja prohibeix `GPTBot` per a tota la instància**. Això és rellevant i no s'ha d'ometre en parlar d'IA. No és, però, un consentiment personal granular, ni impedeix que un client que no respecte robots descarregue allò que continua sent públic. Una política sobirana pot sumar controls de publicació, retirada d'índexs propis, llicències/metadades i instruccions als robots; no ha de prometre esborrar còpies o garantir que ningú entrenarà un model. [Robots fixat](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/public/robots.txt).

L'aprovació manual usa `follow_requests` i serveis d'acceptació/rebuig. Amagar les col·leccions de seguidors/seguits limita la presentació del graf; no torna invisibles tots els vincles que altres actors hagen publicat. Els serialitzadors AP exposen propietats específiques com `manuallyApprovesFollowers`, `discoverable`, `indexable` i adjunts de perfil. Un altre servidor pot conservar dades ja federades: la UI ha d'explicar el límit. [FollowRequestsController](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v1/follow_requests_controller.rb), [ActorSerializer](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/serializers/activitypub/actor_serializer.rb).

#### La frontera actual de Sóc de Poble

La regla de `public.section_submissions` observada exigeix membresia del poble per a llegir, amb tractament addicional de notes pròpies. Inserir i editar exigeix el propietari, membresia i, si firma una organització, gestió real de l'entitat. `owner_user_id`, `tenant_id` i `author_org_id` no són camps de disseny: són autoritat que s'ha de calcular o comprovar al servidor.

La projecció de `node0.public_documents` és una altra capa: documents seleccionats explícitament per a lectura pública anònima. **No es pot servir `section_submissions` per GET públic per a «fer funcionar el Mur».** En R5 el client combina dades públiques i pàgines privades lligades a sessió; no converteix eixes pàgines en seed públic. Una futura columna de visibilitat necessita migració, RPC, RLS, projecció i retirada coherents abans de canviar eixe comportament.

`abastConnexio.js` ja diferencia: una connexió privada continua sent privada; enviar-ne un enllaç a una persona o grup és una entrega per xat; «tot el poble» és publicar al mur autenticat municipal. La metadada `origen.abast` no és un permís transportable. Els mappers actuals eviten propagar-la com si fora una ordre d'autorització. Reutilitzar esta disciplina és més important que copiar els quatre noms de Mastodon.

La cerca local `indexCerca.js` indexa col·leccions que els contextos ja han carregat legítimament i evita camps sensibles com el correu; pot incloure notes pròpies i converses autoritzades. Açò no és un índex anònim d'Internet ni una prova d'opt-out individual d'IA. `useSEO`/`seoHead` i `RouteSEO` tenen `noindex,nofollow` per superfícies privades; eixes metadades no substitueixen el control de dades.

El xat ja té un model diferenciat de xifrat i límits d'abast per a IAIA en `xifratXatAbast.js`. No seria exacte escriure «Sóc de Poble no té privacitat davant d'IA»; el que falta acreditar en estos eixos és una política individual de descoberta/indexació pública i el seu circuit de retirada, no la inexistència de proteccions de xat.

#### Pla d'audiència aplicable

Primer documentar una matriu **públic Internet / membres del poble / propietari / participants del fil** amb canals, índexs, exportació i federació. Mantindre els defaults actuals durant la migració. No afegir «seguidors» fins que el servei de seguidors puga decidir lectura i revocació en cada superfície. «No llistat» continua sent accessible a qui té l'URL i no ha de suggerir secret. «Directe» requereix destinataris i la seua comprovació; no implica xifrat d'extrem a extrem.

Separar en el control les preguntes: «Vols aparéixer al directori?», «Vols que la cerca pública trobe les teues peces públiques?», «Vols permetre robots de cercadors?» i «Quina política declares per a usos d'IA?». La quarta necessita text de producte i política aprovats, no una equivalència inventada amb `indexable`. Els endpoints propis d'índex sí poden fer complir la retirada; els robots externs reben instruccions i no una garantia.

Cada canvi restrictiu genera una revisió monotònica i retirada de la projecció, índex, previsualització i cua d'eixida. Una actualització antiga no pot restaurar dades retirades. S'ha d'aprofitar el patró de tombstones i reconciliació del Node0 sense confondre una versió de contingut amb l'hora local de comprovació. La correcció R6 de Mastodon demostra per què una marca temporal truncada no és una prova suficient de novetat.

**Acceptació mínima:** dos usuaris de pobles diferents; anònim; usuari expulsat després de crear cursor; canvi de públic a restringit amb resposta antiga en vol; índex i memòria cau eliminats; revocació del seguiment; compte suspés; cap contingut privat al recompte, snippet, sitemap, RSS o cua AP. Els canvis de default no modifiquen l'històric sense una operació explícita i revisable.

### 4. Eix 3 · Experiència rural, llengües i avisos

#### El model Mastodon no és un únic «idioma»

`users.locale` és l'idioma de la interfície; `users.chosen_languages` és un filtre de lectura en línies públiques; `settings.default_language` és el valor per a redactar. El càlcul de llengua de publicació pot recórrer a locale i al default de la instància quan no hi ha una opció explícita. L'usuari pot voler botons en català, llegir també castellà/gallec i redactar una peça en anglès. La detecció automàtica del contingut és imperfecta i no s'ha d'oferir com a filtre infal·lible. [Preferències oficials](https://docs.joinmastodon.org/user/preferences/), [vista de lectura](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/views/settings/preferences/other/show.html.haml).

Les preferències web contenen `reduce_motion`, `auto_play`, `display_media` (`default`, `hide_all`, `show_all`), `expand_content_warnings`, fonts/barres del sistema, desactivació de gestos/targetes flotants, contrast i esquema de color. La vista separa accessibilitat, mitjans sensibles i confirmacions. El resultat té comportaments, no sols etiquetes: reproducció automàtica i moviment han de poder quedar apagats abans de carregar el mitjà. [Model de preferències](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/user_settings.rb), [vista d'aparença](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/views/settings/preferences/appearance/show.html.haml).

L'API `/api/v1/preferences` observada és de lectura i serialitza un subconjunt, entre altres defaults de publicació i expansió de mitjans/avisos. No és un `PUT` universal de totes les opcions del web. Les credencials i els formularis de servidor tenen transports diferents. Una API Node0 pròpia ha de publicar la seua especificació i capacitats, no anunciar compatibilitat amb tot Mastodon perquè retorne camps de nom semblant. [Controlador](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v1/preferences_controller.rb), [serialitzador](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/serializers/rest/preferences_serializer.rb).

`sensitive` i `spoiler_text` són dades del contingut; l'opció d'obrir o no un avís és una preferència del lector. El nom de l'avís ha de continuar llegible quan el cos està plegat. Un resum o text alternatiu no ha d'exposar automàticament tot el contingut que el lector ha decidit no mostrar. En la font 4.7.5 la política d'avís no s'ha de confondre amb el nou `default_spoiler_field` que apareix en HEAD.

#### Sóc de Poble ja té avantatges propis

`UIContext.jsx`, `theme.js` i `i18n.js` implementen cinc llengües (`ca`, `es`, `en`, `eu`, `gl`), elecció local explícita, càrrega diferida de traduccions, clar/fosc/sistema i contrast **Bancal**, normal o sistema. L'elecció del dispositiu té prioritat definida i es propaga entre superfícies sense usar un JWT per a personalitzar colors. En host/embedded hi ha límits deliberats per a no modificar la pàgina hoste.

El codi de tema declara el Model B: esta preferència és local, no una fila del servidor. Bancal és una funció rural existent, no un nom proposat per al futur ni una còpia del `high` de Mastodon. El CSS ja respecta `prefers-reduced-motion` en diverses superfícies; per tant el gap no és «no hi ha moviment reduït», sinó una opció explícita coherent i cobertura de tots els components/mitjans que encara no s'ha acreditat.

La proposta conserva **Aparença en este dispositiu** i afegeix, quan hi haja servidor privat disponible, **Lectura i publicació del meu compte**. Això evita enviar un canvi de contrast al servidor i evita que canviar l'idioma dels botons reescriga la llengua de totes les peces. Es pot oferir més endavant sincronització voluntària entre dispositius, amb política d'intercanvi explícita; no es presenta com a correcció automàtica del Model B.

Per a CW, usar el sanejador federat pur i els DTO de Node0; no fer fetch directe a Mastodon des del navegador. Les dades remotes `sensitive` i `spoiler_text` es conserven fins a targeta, detall, cerca i multimèdia. Una preferència de «mostrar sempre» no canvia l'audiència ni elimina la marca en exportar. Si no hi ha suport consistent en tots els consumidors, el capability corresponent queda fals i la UI conserva el comportament conservador.

#### Interaccions a construir i provar

| Interacció | Estat inicial segur | Prova de comportament |
|---|---|---|
| Idioma de botons | Elecció local actual; català si no hi ha valor vàlid | Cap flash d'una altra llengua, fallback de traduccions correcte, persistència i sync entre finestres sense bucle. |
| Idiomes de lectura | Sense descartar dades per una etiqueta absent o dubtosa, tret d'elecció explícita | Català i variants/etiquetes BCP47, posts sense llengua i detector erroni; no confondre falta de resultats amb avaria. |
| Llengua d'una peça | Valor explícit del compositor, default acotat del compte | Editar una peça no canvia la resta ni la llengua de la UI. |
| Avís de contingut | Títol d'avís visible, cos plegat segons preferència | Teclat, `aria-expanded`, focus estable, lector de pantalla i canvi de sessió sense conservar la decisió d'un altre usuari. |
| Moviment i vídeo | Respectar preferència del sistema; no reproducció automàtica per defecte | Carrusel, GIF, vídeo, scroll i transicions amb moviment reduït; pausa i controls operables per teclat. |
| Bancal i lectura | Conservar l'opció existent | Sol exterior, zoom al 200–400%, contrast de text/controls/focus i cap significat només per color. No declarar AAA per una classe CSS. |
| Connexió lenta | Descarregar cos/mitjà quan l'usuari l'obri o siga necessari | Cobertura de xarxa rural, cancel·lació, estats honestos d'error i cap confusió entre avís plegat i contingut buit. |

Estos són criteris d'acceptació proposats, no resultats de proves UI executades en esta recerca. Les proves de SDK/HTTP d'altres rondes acrediten la frontera corresponent, no estos nous fluxos de preferències.

### 5. Eix 4 · Graf, llistes i notes de relació

#### Relacions Mastodon amb cicle de vida

`follows` i `follow_requests` tenen origen/destí únics i opcions com `show_reblogs`, `notify` i `languages`. El servei de seguir resol comptes locals/remots, bloquejos, aprovació i treballs de feeds; un INSERT és només una part del procés. Acceptar/rebutjar una petició genera els efectes de xarxa pertinents. La llista d'entrada de peticions es carrega amb `target_account = current_account`, no amb un compte del cos enviat pel client. [Follow](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/follow.rb), [FollowRequest](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/follow_request.rb), [servei](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/services/follow_service.rb).

Les llistes pertanyen a un compte; el model limita a 50 llistes, títol de 256, política de respostes `list`/`followed`/`none` i opció `exclusive`. `list_accounts` vincula una entrada amb un seguiment o petició; permet el compte propi i valida les relacions. Els controladors busquen sempre la llista dins de `current_account`. Canviar una política de llista afecta el feed corresponent, però no fa públic un post restringit ni concedeix permisos de membre. [List](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/list.rb), [ListAccount](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/list_account.rb), [controlador de llistes](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v1/lists_controller.rb), [comptes d'una llista](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v1/lists/accounts_controller.rb).

`account_notes` és una nota privada de fins a 2.000 caràcters, única per parell propietari/destinatari. El controlador la crea sota `current_account` i l'elimina si el comentari és buit. Açò no és una publicació ni un missatge lliurat a l'altra persona. [Model](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/account_note.rb), [controlador](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v1/accounts/notes_controller.rb).

#### La funcionalitat local que cal preservar

Sóc de Poble ja té seguiment de persones i entitats per les RPC `segueix`, `deixa_de_seguir`, `estat_seguiment`, `els_meus_seguiments` i `qui_em_segueix`. Pot actuar una persona o, amb gestió comprovada, una entitat. El codi valida UUID i captura la sessió perquè una resposta antiga no contamine la identitat actual. La migració imposa límits de ritme i cardinalitat, i conserva el cicle de deixar/reactivar. No cal un segon sistema local de `follows` en paral·lel.

El catàleg mostra `public.seguiments` amb `seguidor`, `seguidor_entitat`, `seguit_tipus`, `seguit_persona`, `seguit_entitat`, tenant i temps. Té RLS activat i **zero polítiques directes**: el camí és per RPC controlades; no s'ha d'afegir un `SELECT` genèric per comoditat. `private.connexions_preferencies` i `private.connexions_vincles` ja guarden visibilitat pública/privada de graf i de vincles amb claus tipades. `preferenciesConnexions`, `desaVisibilitatConnexions` i `connexionsPubliquesDe` en són superfícies reals de l'adaptador Supabase.

`private.connexions_sollicituds` és per a membresia d'organització amb rol i estat pendent. No s'ha de reciclar per a `follow_requests`: una aprovació de seguiment mai pot donar el rol `administrador` d'una entitat. Igualment, `node0.followers(actor,inbox,follow_id,followed_at)` és la col·lecció remota de l'actor comunitari, no una còpia del graf personal dels veïns. Les dues famílies AP del repositori tampoc es fusionen només perquè els noms s'assemblen.

Les `public.notes` existents tenen contingut, carpetes, revisions i publicació. Reutilitzar-les per a una nota sobre una persona afegiria risc de publicar-la per error, de trobar-la en un export de peces o de suggerir-la en un editor. La nova nota de relació ha de ser privada sempre, sense acció «publicar» ni lliurament a la persona referida.

#### Adaptació rural i governança

Les llistes «Bàndols municipals», «El Rentonar», «Mercat» o «Comtat» poden ser plantilles explicades, **no llistes de seguiments creades sense l'elecció del veí**. Una llista personal composa peces ja llegibles i pot usar persones, entitats i, més endavant, actors remots resolts. No serveix per esquivar una ACL, bloqueig o retirada. Si es permet seguir un canal públic sense seguir tots els autors, cal un tipus de font diferent i explícit, no un `follow_id` fals.

Per a una entitat, decidir si la llista és un recurs compartit pels gestors o una preferència privada de cada gestor. La proposta inicial és llista **personal privada**; les llistes editorials d'entitat requereixen rols, historial i UX diferenciats. Una nota personal sobre un compte no es comparteix amb altres gestors de l'entitat.

La migració del graf ha de mantenir les decisions de visibilitat vigents i no fer pública cap relació pel fet de crear un nou perfil federat. Quan s'esborra un seguiment, les entrades de llista han de quedar inactives o retirar-se dins del mateix model, amb invalidació del feed. Si una petició encara no està acceptada, la UI pot mostrar-la pendent però no obtenir el feed privat de destí.

**Acceptació mínima:** dos propietaris amb el mateix nom de llista no col·lideixen; consultar/editar llista aliena retorna resultat no enumeratiu; treure seguiment/bloquejar/expulsar de poble canvia immediatament els resultats; nota privada absent de feeds, AP, directoris i cerques públiques; doble petició idempotent; rols d'organització comprovats al servidor; cap perfil mínim convertit en complet per pertànyer a una llista.

### 6. Eix 5 · Filtres contextuals, temps i representació

#### El motor de Mastodon

Un `custom_filter` té propietari, títol, `context` com a array, `expires_at` i acció. Els contextos de servidor són `home`, `notifications`, `public`, `thread` i `account`. En 4.7.5 hi ha **tres accions: `warn`, `hide` i `blur`**, no sols les dues esmentades a l'enunciat. `blur` ja apareix a la documentació d'API des de 4.4. No cal implementar-la en una primera fase de Sóc de Poble si no hi ha representació de mitjans correcta, però l'estudi l'ha de reconéixer. [Model CustomFilter](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/custom_filter.rb), [API oficial](https://docs.joinmastodon.org/methods/filters/).

Les paraules clau són files filles amb `keyword` fins a 512 i `whole_word`; `to_regex` **escapa el text de l'usuari amb `Regexp.escape`** i només afegeix fronteres de paraula quan pertoquen. No ofereix un editor d'expressions regulars arbitràries. Hi ha també files de filtre per a estats concrets. Un títol de grup no és la paraula que es busca, i un filtre pot agrupar més d'un terme. [Keyword](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/custom_filter_keyword.rb), [Status filter](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/custom_filter_status.rb).

El cache del model selecciona filtres no caducats i comprova de nou el temps en aplicar-los; una actualització invalida memòries cau i notifica canvi de filtres. El motor compara el text cercable de la peça efectiva, incloent la peça original d'un boost. En client, els selectors tornen a comprovar context i caducitat, fan que `hide` puga donar estat filtrat i separen els filtres `blur` per al mitjà. És una defensa de coherència, no una raó per a confiar en el rellotge del navegador com a autoritat única. [Cache](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/concerns/custom_filter_cache.rb), [selectors](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/javascript/mastodon/selectors/filters.ts).

El web ofereix caducitats pràctiques —30 minuts, 1/6/12 hores, 1 dia o 1 setmana— i permanència. El controlador v2 filtra els recursos per `current_account.custom_filters`, acota els camps, controla paraules filles i usa scopes de lectura/escriptura. En Node0, un permís d'administració general no equival a la propietat d'un filtre personal. [Formulari](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/views/filters/_filter_fields.html.haml), [controlador v2](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v2/filters_controller.rb).

#### Què significa aplicar-lo a les superfícies locals

La cerca per paraules existent no és un filtre personal persistent. Un bloqueig impedeix una relació o representació segons la seua semàntica; no equival a «amagar durant una setmana peces amb esta expressió». No s'ha acreditat cap esquema productiu equivalent a `custom_filters`; la proposta és nova i separada.

La correspondència inicial de context ha de ser una decisió de producte escrita:

| Superfície Sóc de Poble | Context proposat | Límit |
|---|---|---|
| Mur propi/poble i llistes | `mur` | S'aplica a peces ja autoritzades. No canvia el comptador públic amb dades privades ni causa una falsa «xarxa fora de línia». |
| Notificacions | `notificacions` | Filtra contingut de notificacions de peces; avisos de seguretat/compte no s'oculten amb un terme arbitrari. |
| Detall i fils de comentaris | `conversa-publicacio` | Es diferencia de missatgeria privada i conserva una via clara per mostrar una peça amb avís. |
| Perfil/fitxa amb peces | `perfil` | Filtra peces, no desactiva els controls d'identitat o de bloqueig. |
| Xat E2EE | Preferència local específica, si s'acorda | El servidor no rep claus ni text pla per a filtrar. No anunciar filtratge de converses xifrades pel servidor. |
| Cerca | Política explícita posterior | Aplicar als resultats autoritzats, no exposar snippets que travessen l'avís; no assumir que `public` de Mastodon és el Mur municipal. |

Per a `warn`, una targeta compacta explica «Ocult per un filtre teu: …» i permet desplegar, amb focus i lectura accessibles. Per a `hide`, no es renderitza el cos; el panell de filtres deixa trobar i editar la regla. `blur` requereix provar alternatives textuals, imatges, vídeo i enfocament per teclat abans d'anunciar-la. El motiu que conté termes privats del veí no s'inclou en HTML públic, logs, telemetria o un DTO compartit entre usuaris.

El motor proposat pren **text normalitzat de DTO autoritzat**, inclou títol, cos i CW segons una especificació fixa, escapa literals i té límits de termes, bytes i treball. La decisió d'accents/majúscules/apòstrofs s'ha de fixar per a català i les altres quatre llengües; no basta copiar `\b` de Ruby en JavaScript i assumir la mateixa semàntica Unicode. No es trenca una parella subrogada ni un grafema en retallar. Les expressions amb metacaràcters es tracten com text i no com codi.

La caducitat s'avalua amb temps de servidor en cada lectura o resposta versionada. No depén d'un cron que es puga retardar: a l'instant límit la regla deixa d'aplicar-se encara que la fila continue existint. Es pot netejar després. Una resposta de l'actor A, una memòria cau de filtre o un cursor no es pot reutilitzar després de passar a B; el canvi d'epoch d'identitat invalida tota la vista. Si falla la lectura privada, no s'afirma que no hi ha filtres i no es fa fallback silenciós a Supabase.

**Acceptació mínima:** caducitat exacta al límit i rellotge de client avançat/endarrerit; article original i boost; CW; minúscules, accents, emoji, apòstrofs i expressió `a.*b` literal; canvi de context; edició/eliminació mentre hi ha pàgines en vol; paraula d'un altre usuari mai retornada; cap filtre pot donar accés a una peça aliena; missatges E2EE mai enviats al motor de servidor; límits d'ús sense ReDoS ni creixement indefinit.

### 7. Esquema Node0 proposat i autorització executable

**Tots els noms d'esta taula són propostes, no taules existents al catàleg de producció.** Les migracions s'han de fer després del disseny de tipus i consentiment, en una base de proves independent i amb kit CAS. No afegir privilegis al lector públic `node0_runtime` ni convertir-lo en autenticador.

| Recurs proposat | Claus i invariants | Frontera d'autoritat |
|---|---|---|
| `private.perfil_federat_config` | Persona o entitat real amb FK; exactament una de les dues; tenant si és pertinent; opcions de descoberta/índex/graf; revisió monotònica | Llegir/editar persona pròpia o entitat gestionada en servidor; valors inicials restrictius per a les **noves** capacitats, sense canviar `profiles.is_public` actual. |
| `private.perfil_camps` | FK a la configuració; ID estable, ordre, nom/valor acotats, revisió; verificació separada i no editable | Edició pel mateix control; camps de verificació només per worker amb funció mínima. Retornar un DTO públic només si la configuració i l'audiència ho permeten. |
| `private.preferencies_lectura` | PK usuari, llengües i política de CW/mitjans aprovades, revisió | Propietari derivat de sessió; no guardar tema/Bancal local sense una decisió nova de sincronització. Defaults de publicació separats de canvis a peces existents. |
| `private.llistes_socials` / `private.llistes_socials_membres` | PK usuari+llista; títol, política de respostes, límits; membre amb FK a seguiment/tipus de font real | Només propietari. El feed aplica l'ACL actual de cada peça i revalida relacions; una llista no és cap permís. |
| `private.notes_relacio` | Parell propietari/destí real únic; text pla fins a límit explícit; revisió | Sempre personal privada, sense publicació ni visibilitat a la persona referida; export propi deliberat. |
| `private.filtres_personals` + termes + referències de peces | Propietari, títol, contextos enum, acció enum, `expires_at`, revisió; quotes de files/bytes; FKs filles dins del mateix propietari | Funcions/RLS de propietari; cap filtre retornat pel runtime públic. Modificar un fill comprova pare i propietari, no sols l'ID del fill. |
| Cua de verificació/retirada | Referència i revisió esperada, intents/termini; únic per treball vigent; redacció de logs | Worker separat, permisos mínims i CAS de revisió abans de publicar el resultat. No executar URLs arbitràries des d'una RPC transaccional. |

L'opció de normalitzar els camps en files és una decisió **Node0**, motivada per revisions, treballs de verificació i autorització multi-entitat; no és una afirmació falsa que Mastodon faça el mateix. Un JSONB acotat també seria possible, però hauria de conservar les mateixes invariants i no acceptar metadades de verificació escrites pel client.

La petició privada es vincula a la sessió opaca HttpOnly del servidor. El `X-SDP-Expected-Actor` que ja usa el disseny R5 compara **el UUID d'usuari de la sessió**, no dona autoritat ni és el UUID d'una organització que el navegador tria. Una operació sobre una entitat comprova addicionalment la seua gestió. La comparació, comprovació de revocació i claims de la consulta ocorren en la mateixa transacció, abans d'assumir el rol `authenticated`. No transportar un `sub`, un rol o un `owner_user_id` lliure del cos com si fora un JWT signat.

El patró existent és un autenticador `NOINHERIT`, sense superusuari ni `BYPASSRLS`, i `SET LOCAL ROLE` dins de la transacció verificada; el rol públic resta separat. Els nous recursos poden seguir RLS i RPC acotades o funcions privades amb `EXECUTE` molt concret. En tots dos casos cal provar el camí **amb el rol real de servei**, no només com a propietari de la base. `SECURITY DEFINER` obliga a `search_path` fix, noms qualificats, validació de tots els arguments i cap SQL arbitrari. La política de baixa, normes i membresia existent continua sent efectiva.

Les consultes privades han d'utilitzar el transport parametritzat i la política de logs R6; cap terme de filtre, nota de relació, valor de perfil ni destinatari en SQL visible a `pg_stat_activity` o errors de PostgreSQL. Els identificadors de funcionalitat i ordres SQL romanen fixos; el cos de l'usuari són valors. Els errors públics tenen una llista de codis segura, no missatges de la base. Un timeout d'escriptura conserva estat indeterminat i no dispara un reintent automàtic ni canvi de backend.

### 8. Superfície d'API per fases i portes d'acceptació

Els noms d'acció següents són **contracte proposat**, no rutes actives. La versió final ha de quedar en un esquema de DTO i al registre de capacitats. Si s'usa la ruta privada acotada actual, són accions d'eixa allowlist; no autoritzen `rpc(nombreDelClient)`.

| Fase | Dades i API proposades | UX / què es pot anunciar després de la prova |
|---|---|---|
| A · inventari i base | Registrar decisions d'audiència; confirmar ingress, correu, rol i sessió en laboratori; auditar dades existents sense inventar owners | Mantindre privades les opcions que el servidor no pot executar. Integrar primer el que ja existeix al kit, amb flags apagats per defecte. |
| B · perfil i preferències | `lligConfigPerfil`, `desaConfigPerfil`, `desaCampsPerfil` amb revisió; `lligPreferenciesLectura`, `desaPreferenciesLectura`; cua `sollicitaVerificacioCamp` | Fitxa existent ampliada; verificació pendent/resultat datat; dispositiu separat de compte. Cap marca verificada escrita pel formulari. |
| C · graf local | Portar les RPC reals de seguiments/connexions al backend Node0 amb DTO equivalent; després `lligLlistes`, `desaLlista`, `desaMembresLlista`, `lligNotaRelacio`, `desaNotaRelacio` | Paritat comprovada amb Supabase, no dos grafs divergents. Feeds personals i notes pròpies, sense sincronització AP fingida. |
| D · filtres | `lligFiltres`, `desaFiltre`, `eliminaFiltre`, versionats i acotats; integració de resultats a superfícies autoritzades | `warn`/`hide` quan funcionen en targeta/detall/notificació; `blur` només quan mitjans i accessibilitat estiguen coberts. |
| E · audiència i índex | Migració d'audiència executada i política de projecció; treballs d'alta/retirada; `lligEstatIndexacio` verificable | Noves opcions de descoberta/cerca amb estat real. Controls de robots explicats com instruccions; cap garantia d'oblit de còpies externes. |
| F · identitat federada per usuari/entitat | ADR d'actors, URL, claus, seguiments, revalidació i migració; no canviar l'actor comunitari a cegues | Només després de proves amb servidor remot es declara interoperabilitat real; separar REST de Mastodon, ActivityPub i suport del client local. |

Un capability de parella (`llig`/`desa`, o `estat`/`accepta`) només és cert quan les dues funcions, permisos SQL, transport i representació existeixen. L'autenticació no basta per a anunciar seguiments, filtres o llistes. Una indisponibilitat de servidor no es maquilla com una col·lecció buida. Les proves del client amb transport simulat acrediten contracte/epoch, les de PostgreSQL acrediten ACL/locks i les d'HTTP real acrediten cookies/origin; són evidències complementàries, no intercanviables.

#### Integració obligada amb AH-09 actualitzat

S'ha rellegit l'apartat viu amb la **llei de simetria multiusuari**. El pont editorial `@depoble@mastodont.cat` arranca seleccionant Sóc de Poble i El Rentonar; la Coordinadora s'afegirà quan s'importe. Les peces comercials del mercat —incloses botelles d'oli i cooperativa— **no entren en eixe canal editorial**. La selecció és configuració per pont i propietari, **no una allowlist global d'autors gravada al codi**. Una cooperativa podrà vincular el seu propi compte i aplicar la seua política en el seu pont, amb el mateix mecanisme d'autorització.

La unitat futura és un pont que pertany a una persona o entitat, amb FKs reals, destinació Mastodon resolta, referència a credencial secreta de servidor, autors vinculats, política/revisió i rol de publicació. Una referència de credencial no és un token enviat al navegador ni una propietat que es puga moure entre ponts sense permís. Les revisions inclouen audiència, CW i política del pont, no sols el text del títol.

`GET /api/v1/node0/mastodon/preparades` mostra **l'esborrany exacte**, imatge, resum net, etiquetes i URL canònica `https://socdepoble.org/...`, així com l'estat reconciliat. `POST .../publish` exigeix la conformitat explícita d'un usuari autoritzat i comprova en servidor revisió de font, hash del draft i política actual **en el moment de l'enviament**. Una font editada, retirada, canviada d'audiència o desvinculada obliga a revisar de nou. Un treball de perfil/llista/filtre mai polsa eixe botó. La preparació pot ser automàtica; **la publicació no ho és**.

La UX explica què és Mastodon, què replica el botó i com vincular un compte propi, amb text rural concret. No promet «en un minut» si OAuth/credencials/revisió remota no estan disponibles. Per als primers usos pot haver-hi una configuració assistida de servidor que s'explica com a tal. La lectura de la rèplica continua passant pel Node0, sense exposar cada visitant a `mastodont.cat`. Una peça privada, una nota de relació o una coincidència de filtre mai entra en el draft ni en els logs del pont.

#### Portes de seguretat i operació que tanquen cada fase

1. **Dades reals:** preflight de esquema, modes, migracions i rols; cap perfil/consentiment/proprietari inventat per a omplir una demo. Fixtures només en base aïllada.
2. **Autoritat real:** dos usuaris, dos pobles, entitat gestionada i aliena, sessió revocada i canvi de cookie entre identificar i escriure; comparació dins de TX i resultat no enumeratiu.
3. **Concurrència:** revisió CAS d'edició; dues pestanyes; treball retardat de verificació; retirada i actualització en ordre invers; cap canvi de tenant per cursor.
4. **Privacitat de memòria cau:** claus amb backend/tenant/actor/epoch i versió; cap snippet privat en resposta pública ni termes personals en logs o SQL.
5. **Accessibilitat i ruralitat:** cinc llengües, teclat, focus, lector de pantalla, moviment reduït, Bancal i xarxa lenta en els fluxos afegits; no donar per demostrada AAA sense mesures.
6. **Integració:** esquema+server+SDK+UI concordants; servidor declara només capacitats executables. Default off fins als preflights reals; no fallback extern d'escriptura.
7. **Lliurament:** kit CAS nou sobre baselines exactes, dry/apply/noop/rollback en còpia temporal, sentinelles alienes intactes i rebut extern al kit immutable. La lease del repositori viu continua en Claude.

### 9. Diferències d'upstream i límits de l'estudi

En els 12 fitxers comparats, HEAD afegeix preferències com `default_spoiler_field`, mostrar publicacions/boosts propis i `web.theme_color`, i efectes per a reconstruir feed quan canvien ajustos. `account.rb` introdueix canvis de claus/reach-filter i validació d'actors remots; l'esquema afegeix famílies de moderació i canvia metadades de FASP. **No s'han de vendre com a característiques de 4.7.5 ni com a requisits per a un Node0 inicial.** Els fitxers de llistes, relacions bàsiques i camps verificats comparats no canvien. No s'infereix d'ací que tot el subsistema siga idèntic a HEAD.

No s'ha accedit al menú privat del compte `@depoble`, ni llegit dades personals de producció, ni concedit cap permís, ni canviat Caddy, correu o credencials. L'examen és de font primària i metadades; no és una prova d'interoperabilitat remota de totes les funcionalitats. Les pantalles d'estudi no substitueixen una sessió d'usabilitat amb veïns. Els controls d'IA necessiten una decisió explícita de política i una especificació que distingisca accés, cerca pròpia i instrucció a tercers.

La lectura semàntica s'ha concentrat en els mecanismes d'estos cinc eixos, amb esquema i fitxers de suport complets disponibles per a reproducció. No es diu que s'hagen auditat totes les línies de Rails, tots els workers de Mastodon, les 68 taules o les 265 funcions de Sóc de Poble. Les cerques d'absència són d'un vocabulari concret sobre fonts/migracions i s'han contrastat amb vies equivalents existents; no són una prova matemàtica d'absència de qualsevol implementació possible.

El resultat d'esta ronda és un **pla executable per fases i amb fronteres de dades**, no cinc grups de caselles noves. Es poden adoptar els patrons de Mastodon —verificació asíncrona, separació de preferències, propietat del graf, filtres amb temps i accions— conservant les fortaleses de Sóc de Poble: territori, entitats, Bancal, documents i abast real. La còpia literal de codi requereix conservar-ne autoria i llicència; esta proposta ha fet comparació i disseny, sense introduir codi Mastodon en el producte.

## AH-10 · Mastodon i Sóc de Poble · Eixos 6–10

Estudi de codi i disseny proposat, 4 de novembre de 2026. No és una implantació ni una certificació d’interoperabilitat. Carril Constructor/Àrbitre; sense escriptures al repo viu, SQL de producció o kits segellats. La UI R6 de sessió/perfil continua pausada.

### Base documental i distinció d’estats

La referència comuna és **Mastodon v4.7.5**, commit immutable `24cd1c875a1ac393e587421726394d5692ff5496`. S’han descarregat 61 fitxers públics de models, serveis, controladors, workers, rutes i esquema. Deu fitxers específics d’aquests eixos són byte a byte iguals en el commit de `main` `ca2f092f4f580b1993bae3ac4f4742b748f18ad1`, observat pel carril com a capa d’actualitat del 4-11-2026. **No es presenta aquest HEAD com una release ni com la versió de mastodont.cat.** Els intents amb rutes inexistents també consten al rebut; `Import` antic no s’ha confós amb l’actual `BulkImport`.

El catàleg real de PostgreSQL del Node 0, llegit per root el **4-11-2026 a les 19:35:33 UTC**, conté 75 migracions i **40 taules de producte/runtime: 34 de `public` i 6 de `node0`**. Amb 26 de `private` i 2 taules de compatibilitat d’`auth`, són 68. No són 40 taules `public`. El rebut llegix metadades i **zero files d’usuari**; no acredita zero usuaris. Empremta del catàleg: `aa4bf275a99ea3a10cdef102de83a71e4054a3218d27053f882666b11e30ce09`.

| Capa | Evidència efectiva | Límit |
|---|---|---|
| Repo viu SDP | Instantània de 20 fonts, hashes i lectura dels contractes/implementacions indicades més avall | Un fitxer existent no prova que la funció estiga operativa en tots els backends |
| Node 0 producció | Catàleg real de 68 taules, índexs, constraints, RLS, policies i signatures | Les taules pròpies de credencials/sessions/challenges/rates de Node 0 no hi són; el laboratori auth no està desplegat |
| R6 auth de laboratori | 35 proves reals amb les 75 migracions, incloent UI React → SDK → helper HTTP → handler → SQL; correu capturat | No SMTP, ruta productiva ni ingrés real nous. Queden comprovacions natives i de desplegament de root |
| Mastodon | Fonts fixades al commit i documentació oficial consultada | No s’ha entrat a la configuració privada de cap compte ni enviat cap publicació |

La distinció és decisiva per a POSSE: `public.notes` té RLS de propietari i poble; `section_submissions` requerix pertinença al poble, i `notes` és encara més restringit. El nom de la policy `public read section_submissions` **no significa lectura anònima**: el predicat real crida `private.is_town_member`. No hi ha una taula `public.posts` en el catàleg. No es poden convertir automàticament totes aquestes files en contingut públic ni sindicar-les per haver canviat un camp de JSON.

### 6 · Retenció temporal, marcadors i memòria històrica

Mastodon representa la política a `account_statuses_cleanup_policies`: antiguitat mínima, excepcions per missatges directes, fixats, enquestes, mitjans, favorits i marcadors propis, i llindars de popularitat. La consulta considera un màxim de 5.000 candidats abans de les excepcions i conserva un cursor. La pantalla construeix una política inicial desactivada, encara que el default de columna siga diferent. Fonts: [model de política](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/account_statuses_cleanup_policy.rb), [controlador](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/statuses_cleanup_controller.rb).

El servei descarta els estats i encola `RemovalWorker`; **no fa un arxiu històric**. El scheduler dosifica el treball entre comptes i s’atura sota càrrega. Cal adoptar aquesta separació de política, selecció i execució, sense confondre retirar de la vista amb destruir contingut. Fonts: [servei](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/services/account_statuses_cleanup_service.rb), [scheduler](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/workers/scheduler/accounts_statuses_cleanup_scheduler.rb).

| Peça Mastodon | Estat SDP verificat | Decisió d’adopció |
|---|---|---|
| Política per compte | `notes.status`, `trashed_at`, revisió i capacitat `cicleNotes`; moure/arxivar/paperera és manual | Política explícita per persona/entitat i poble, amb activació inicial apagada |
| `status_pins` | El mapper reconeix camps de fixat, però això no acredita una taula de pins d’usuari amb autoritat | Relació de pins amb FK a una publicació visible; cap `is_pinned` lliure del payload governa el worker |
| `bookmarks` | No hi ha una taula equivalent en el catàleg real de 40 | Marcadors privats independents del contingut; `UNIQUE(tenant,user,publication)` |
| Favorits/marcadors protegits | Els favorits i el fixat del xat no són marcadors de publicacions | L’autoesborrat exclou fixats, patrimoni i publicacions protegides per marcadors/favorits vàlids; mai revela qui els ha marcats |
| Memòria històrica | Notes/OKF, exportació de memòria cultural i oral | Protecció patrimonial com a atribut de servidor amb permisos explícits; no deriva d’un text o categoria lliure importada |
| Cua de retirada | `node0.outbox` i tombstones, diferents de l’arxiu de Notes | L’arxiu manté permisos originals; una retirada federada usa una feina durable, no elimina la làpida ni promet esborrar còpies de tercers |

**Esquema proposat:** `content_retention_policies`, `publication_pins`, `publication_bookmarks`, `publication_preservation` i `retention_jobs`. Cada fila inclou `tenant_id`; la política referencia un actor personal o una organització real. Les proteccions són relacions amb FK, no còpies de dades al JSON. El mode inicial és `archive`; l’esborrat automàtic destructiu queda darrere d’una segona activació explícita. Un bookmark pot impedir l’autoesborrat, però no anul·la el dret del titular a una supressió manual aplicable. La custòdia patrimonial tampoc es presenta com una excepció legal inventada.

**SQL i RLS exigibles:** una persona només modifica la seua política; una entitat necessita `private.can_manage_organization` i pertinença al poble. Els marcadors es lligen i escriuen només per `auth.uid()` amb comprovació que la peça continua accessible. El worker no usa el rol HTTP ni un propietari de taula per a consultes arbitràries: una funció limitada pren lots, reclama `lease_owner`, torna a comprovar proteccions/revisió i registra el resultat dins la transacció. Pins afegits mentre es prepara un lot han de guanyar davant l’autoesborrat; un preview antic mai és autorització permanent.

**API/UX proposades:** `GET/PUT /api/v1/account/retention`, `POST .../retention/preview`, `GET .../retention/runs`; `POST/DELETE /api/v1/publications/:id/bookmark` i `.../pin`. Perfil → Compte → Conservació mostra efecte, excepcions i un exemple real. El preview és de dades pròpies, sense noms ni recomptes de marcadors aliens. Proves d’acceptació: dos usuaris/dos pobles, afegir pin entre selecció i execució, marcador privat, patrimoni immutable per al worker, replay del lot, canvi de revisió, reinici i error d’outbox. Cap canvi a la classificació de privacitat per arxivar.

### 7 · Sessions, factors i migració d’identitat

Mastodon vincula `session_activations` amb usuari, sessió, token d’aplicació i subscripció push. La revocació es busca dins de les sessions de l’usuari actual. Per a Move, `account_migrations` comprova la contrasenya actual quan n’hi ha, que la destinació reconega l’actor antic i un cooldown de 30 dies. Els alias i la redistribució dels seguidors són treballs diferents. Fonts: [sessions](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/session_activation.rb), [revocació](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/settings/sessions_controller.rb), [migració](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/account_migration.rb).

| Capacitat | Mastodon 4.7.5 observat | SDP existent / deute |
|---|---|---|
| Sessions actives | Sessions amb revocació i associacions a token/push | `sessionService`/`SessionContext` vius estan orientats a JWT; R6 cookie té proves de revocació i actor esperat, però falta la proposta neutral de scheduler/UI i la gestió de sessions visibles |
| Canvi de contrasenya | Flux de compte amb comprovació de credencial | R6 fixa pre-segrest: prova d’email + tria de contrasenya, tokens versionats, reset sense netejar la cookie d’un altre compte. No està desplegat |
| TOTP | Model d’usuari i codis de recuperació | Ja hi ha adaptador Supabase i UI `SegonFactor`, orientats al superadmin/`aal2`; això no acredita TOTP local de Node 0 |
| WebAuthn | `webauthn_credentials` i verificació del challenge de sessió | No es troben taules/capacitat de WebAuthn al catàleg de Node 0; disseny i implementació pendents |
| Passkeys sense contrasenya | **No acreditades per aquest codi**: el controlador de claus exigix OTP previ i demana UV `discouraged` | No etiquetar les claus de segon factor com a login passwordless. Per superar-ho cal una especificació separada de WebAuthn amb UV requerida i RP/origen exactes |
| Move i alias | `account_aliases`, `alsoKnownAs`, `moved_to_account_id`, feina de redistribució | Motor FEP i UI de comprovació local ja existeixen; no són un trasllat remot executat |

La distinció WebAuthn/passkey és verificable al [controlador de credencials](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/settings/two_factor_authentication/webauthn_credentials_controller.rb). La migració de Mastodon no transporta els estats i mitjans del compte: cal separar Move, exportació de dades i restauració. [Documentació de canvi de servidor](https://docs.joinmastodon.org/user/moving/).

**Compatibilitat descoberta en SDP:** `portabilitatFediversity.js` i `PortabilitatFederada.jsx` demanen també que l’actor antic incloga la destinació en el seu `alsoKnownAs`. El codi de Mastodon consultat exigix que la destinació reconega l’antic i que l’actor de Move coincidisca amb l’objecte; no imposa aquesta reciprocitat addicional. Una prova amb dos actors sintètics vàlids per a aquella forma és rebutjada pel preflight SDP. És un bloquejador d’interoperabilitat de la preparació local, **no una entrega remota fallida demostrada**. Rebut `move-alias-compatibility.json`, font SDP SHA `404f3b46e26f567734b50212df19e1bfc38ef2036cab779734de6b9f8c7b1167`. [Move entrant](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/lib/activitypub/activity/move.rb), [alias](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/account_alias.rb).

**Esquema proposat:** reutilitzar les sessions locals quan R6 s’integre, afegint etiqueta d’aparell i últim ús mínims, sense exposar hash/token. `webauthn_credentials(user,credential_id,public_key,counter,transports,rp_id)` i challenges d’un ús amb TTL; mai clau privada ni secret TOTP en taules públiques. `account_aliases` i `account_migrations` lliguen actor/tenant, destinació resolta, prova pública i estat durable. No es traspassa una organització ni tot un node amb el permís d’un perfil personal. Les URLs de contingut antigues no es reescriuen per Move.

**Endpoints proposats:** `GET /api/v1/account/sessions`; `DELETE .../sessions/:id`; `POST .../sessions/revoke-others`; `POST .../webauthn/register/options|verify` i `.../authenticate/options|verify`; `GET/POST/DELETE .../aliases`; `POST .../migration/prepare|confirm`; `GET .../migration`. Les operacions destructives necessiten reautenticació vigent i, quan corresponga, segon factor real. L’API no accepta `user_id`, rol o `aal` del navegador com a autoritat. Revalidar email/reset i evitar enumeració SMTP és anterior a habilitar-ho.

**Acceptació:** dos comptes i dos tabs, cookie B amb expectativa A → 409 i zero mutacions; reset d’A no neteja cookie B; credencial/repte WebAuthn d’altre RP o replay → rebuig; comptador/UV/origen verificats; revocació davant RPC concurrent; Move amb signatura real, resolució HTTPS segura, alias de destinació, idempotència/cooldown i intent de moure una entitat aliena. Cal una prova amb receptor Mastodon real de laboratori abans de parlar de seguidors traslladats. La UI actual diu honestament que només prepara/comprova documents locals.

### 8 · Importar, exportar i preparar la sindicació editorial

Mastodon 4.7.5 importa relacions i preferències mitjançant `BulkImport`: seguits, bloquejos, silencis, dominis bloquejats, marcadors, llistes i filtres. Separa fitxer pendent, confirmació, processament, comptadors i informe de fallades. La vista permet revisar abans d’executar; les operacions de substitució poden retirar relacions existents. Fonts: [model](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/bulk_import.rb), [controlador](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/settings/imports_controller.rb), [processador](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/services/bulk_import_service.rb).

L’arxiu complet del commit **sí que és ZIP**: inclou `actor.json`, `outbox.json`, `likes.json`, `bookmarks.json` i mitjans. No s’ha extrapolat un format antic. La política de creació del commit usa `MIN_AGE = 6.days`; la documentació d’usuari descriu una cadència de set dies. Cal fixar el contracte SDP explícitament, sense convertir aquesta discrepància en una garantia. Font: [BackupService](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/services/backup_service.rb), [BackupPolicy](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/policies/backup_policy.rb). La documentació indica que importar l’arxiu no restaura els estats i mitjans a Mastodon; exportació no és restauració. [Import/export de Mastodon](https://docs.joinmastodon.org/user/moving/).

| Format o flux | SDP ja existent | Abast que falta |
|---|---|---|
| Exportació personal | `exportaLesMeuesDades` → RPC canònica i contracte `socdepoble.exportacio.v1`; captura de sessió i control de resposta tardana | Exposar-ho honestament al Node 0 amb API/capacitat pròpies i prova de dos comptes; no prometre que el port Node 0 implemente totes les opcions Supabase |
| Open Data municipal ZIP | BagIt, Data Package, SHA-256, JSON-LD, Markdown/OKF, agenda; camps en llista blanca | No és un arxiu privat complet: exclou persones/mercat i publicacions de membres; les referències de mitjans no contenen el binari |
| Restauració Open Data | Valida manifest, versió i regeneració canònica; capacitat local de restauració | El comentari/contracte viu indica restauració local, no restauració Supabase general; cal backend Node 0 específic i revisió del lot |
| Paquet Fediversity | Motor criptogràfic i UI de comprovació local | No importa dades a un servidor ni anuncia confiança en una clau aportada dins del mateix paquet |
| CSV social de Mastodon | Sense les taules equivalents de llistes/marcadors al Node 0 actual | Importador amb mapping d’URI i permisos; un CSV no pot crear rols, usuaris verificats ni identitats propietàries |
| WordPress | No s’ha acreditat un importador WXR canònic en els mòduls inspeccionats | Parser WXR/XML, mapatge d’autoria, previsualització i deduplicació; els usuaris del WXR són procedència, no comptes locals |
| Blogger | No s’ha acreditat importador de contingut Blogger | Acceptar `feed.atom` de Takeout i l’XML històric de contingut; no confondre l’XML del tema amb les publicacions |
| POSSE nou i històric | Lectura/pont i primitives revisades, amb límits de desplegament documentats | Safata preparada i aprovació de la revisió exacta abans d’enviar; no enviament automàtic de totes les files |

WordPress documenta WXR com a XML de contingut, comentaris, taxonomies i altres dades del lloc. Blogger documenta ara `feed.atom` de Takeout i admet còpies XML històriques. Per tant, un importador nou no pot suposar només un ZIP genèric ni només l’XML antic. [WordPress Export](https://wordpress.org/documentation/article/tools-export-screen/), [Blogger Backup/Import](https://support.google.com/blogger/answer/41387?hl=en).

**Disseny de dades proposat:** `import_jobs` i `import_items` privats del titular/poble; `source_identities` per a l’origen documental, sense equiparar-les a comptes; `legacy_url_map` per a l’enllaç antic → recurs canònic existent; `export_jobs` amb objecte privat, manifest, caducitat i descàrrega autoritzada. Un item es deduplica per `source_system + source_site + external_id`; el hash de contingut registra versions, no substituïx l’identificador estable. `original_published_at`, `imported_at` i `updated_at` són camps diferents. La data d’importació no es fa passar per la publicació històrica.

**Parser i mitjans:** límits de bytes comprimits/descomprimits, entrades i profunditat; cap XXE, DTD externa, ZIP-slip, enllaç simbòlic ni nom duplicat per cas. HTML passat pel sanititzador canònic i text federat pel seu limitador Unicode. Els adjunts s’importen amb origen i drets de cada peça, mida/MIME i descàrrega HTTPS resolta de manera segura; no es copia cap URL privada signada. Un preview no fa seguiments ni publica contingut. La descàrrega CSV pensada per a fulls de càlcul neutralitza fórmules; el format d’intercanvi conserva els valors segons el seu esquema.

**AH-09 actualitzat, inclosa la llei de simetria universal:** la configuració inicial de `@depoble@mastodont.cat` selecciona editorial de **Sóc de Poble**, **El Rentonar** i la **Coordinadora d’Estudis Eòlics del Comtat quan s’importe**; n’exclou els productes del Mercat, l’oli i la cooperativa comercial. Aquesta és la política d’aquest pont, **no una whitelist global codificada**. Qualsevol persona o entitat, inclosa una cooperativa, ha de poder vincular el seu propi Mastodon i seleccionar els autors que pot representar, amb la mateixa safata i conformitat. `linkedAuthors` és una relació configurable autoritzada, no una llista d’IDs acceptada sense comprovació. Slugs i hashtags no proven autoria; una peça sense atribució fiable queda pendent, sense inventar propietari.

La safata fa `GET /api/v1/node0/mastodon/preparades`; mostra el text exacte, cartell, etiquetes i URL canònica. El botó de conformitat del producte publica només la revisió aprovada. `POST .../mastodon/publish` és la ruta del pla; si es conserva `.../publica` per l’ordre anterior, ha de ser un alias del mateix handler i del mateix ledger, mai una cua paral·lela. El catàleg històric només prepara lots editorialment admesos. **Aquest estudi no autoritza cap POST real ni substituïx la conformitat de la targeta.**

**Ledger POSSE proposat:** `bridges(tenant,owner_user|owner_org,remote_actor,secret_ref,policy_revision)` i `bridge_authors(bridge,author_user|author_org)` expressen propietari i autors vinculats, amb FK i ACL que demostren autoritat vigent per a cada vinculació. Exactament un tipus de propietari/autoria per fila; cap secret en el DTO del pont. Un `syndication_record` estable per `tenant + bridge + canonical_publication` usa el mateix registre editorial principal. `drafts(record,revision,draft_hash,media_hashes,policy_revision)` i `approvals(draft,hash,bridge,verified_actor,approved_at)` són separats. El worker revalida propietari, actor remot, vinculacions, abast públic, `policy_revision` i hash abans d’enviar. Canviar la política/autors o el títol/cartell invalida la conformitat anterior. L’ID estable no canvia per cada revisió; una peça amb rèplica s’actualitza/reconcilia, no es torna a crear. Davant timeout de POST ambigu no s’assumix ni èxit ni absència: pausa/reconciliació amb identitat del compte i URI. Una clau d’idempotència remota no és una prova d’exactament-un-enviament indefinida.

**API d’import/export proposada:** `POST /api/v1/imports/prepare`, `GET .../imports/:id`, `POST .../imports/:id/confirm`, `GET .../imports/:id/errors`, `POST /api/v1/exports`, `GET .../exports/:id/download`. Totes les descàrregues personals i feines de mutació són autenticades i lligades al titular. La safata editorial és privada d’editors; només les peces validades públicament poden arribar a la projecció pública. El restabliment d’un arxiu conserva els `access_scope` reals, no els amplia per defecte.

**Acceptació:** fixtures WXR, Atom i XML antic; reimportar dues vegades; dos articles amb títol igual; URL antiga sense recurs canònic; autor no mapat; contingut privat; comentaris personals; mercat d’oli exclòs en el pont `@depoble` i propi canal de cooperativa admés sota la seua política; HTML maliciós; ZIP bomba; foto inaccessible; Unicode; dos workers; revisió o `policy_revision` canviada després d’aprovar; POST ambigu; revocació del propietari/editor abans del dispatch; tenant alié i autoria vinculada sense dret. L’únic resultat públic acceptable és una peça ja pública i explícitament conforme per al pont seleccionat.

### 9 · Invitacions de poble

`Invite` de Mastodon té emissor, codi, usos, límit d’usos, caducitat, comentari i `autofollow`. La validació comprova disponibilitat i que l’emissor siga funcional; el controlador limita l’administració als seus enllaços. **No té poble ni rol de destinatari preassignats**. El permís d’evitar aprovació de registre no equival a concedir un rol administratiu al convidat. Fonts: [model](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/invite.rb), [controlador](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/invites_controller.rb).

| Àmbit | SDP actual | Adopció exigida |
|---|---|---|
| Alta al poble | `town_memberships`, poble resolt i registre amb política versionada | Invitació a un poble existent, fixat pel servidor, sense selector d’ID arbitrari |
| Membres d’organització | Migració i RPCs d’alta directa, explícitament sense invitació | Reutilitzar regles de propietari/admin/membre; no crear un camí que les eludisca |
| Enllaç reutilitzable/caducable | No hi ha taula d’invitacions en el catàleg real | Token de 32 bytes, només hash persistit; caducitat, ús màxim i revocació |
| Rol preassignat | `user_platform_roles` és una autoritat distinta de l’organització | Per defecte membre ordinari. Una invitació no pot crear superadmin ni promocionar el convidat al rol de l’emissor |
| Entrada d’un clic | UI de registre i correu existents, R6 proof en laboratori | L’enllaç ompli el poble/context; no marca consentiment ni prova propietat de correu, i no obvia 2FA |

**Esquema proposat:** `community_invites(tenant,issuer,token_hash,max_uses,uses,expires_at,revoked_at,target_org,proposed_membership_role)` i `invite_redemptions(invite,user)`, amb únic per usuari/invitació. Les dades de reclam d’una invitació són privades. El rol ha de ser un valor canònic permés; assignar `admin` d’una organització requerix l’autoritat de la propietària en el moment d’usar l’enllaç. No es poden convidar persones a gestionar un altre poble.

**Atomicitat:** consumir només després de prova del correu i gest de consentiment, dins la mateixa transacció que la pertinença. `UPDATE ... SET uses=uses+1 WHERE uses<max_uses AND expires_at>clock_timestamp() AND revoked_at IS NULL RETURNING ...`, amb locks i revalidació de l’emissor/rol. Si falla la pertinença o ja s’ha consumit per la mateixa persona, no es gasta una altra plaça. Cap reserva indefinida durant registres pendents ni increments des del navegador.

**API/UX:** `POST /api/v1/community/invites`; `GET .../invites` només propis; `DELETE .../invites/:id`; `POST .../invite-preview` retorna només context públic i disponibilitat genèrica; `POST .../invite-redeem` lligat a la persona verificada. Perfil → Comunitat → Convidar indica usos/caducitat i permet revocar. Acceptació amb últim ús concurrent, doble clic, caducitat durant la prova del correu, emissor degradat/expulsat, poble alié, elevació de rol i mateix usuari repetit. No s’ha executat cap d’aquests endpoints.

### 10 · Aplicacions OAuth, push i webhooks

Mastodon configura Doorkeeper amb authorization-code i client-credentials; el password grant està desactivat, PKCE és S256 i s’exigixen scopes configurats. La configuració del commit posa els access tokens sense caducitat; això és una decisió observada, **no el model recomanat per a Node 0**. La API registra clients i la revocació d’una aplicació retira també push i streaming. Fonts: [Doorkeeper](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/config/initializers/doorkeeper.rb), [registre](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/api/v1/apps_controller.rb), [revocació](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/controllers/oauth/authorized_applications_controller.rb).

Els scopes són jeràrquics i el més limitat possible és preferible. `profile` evita demanar tot `read`; el scope `follow` està deprecat a favor dels granulars. `push` és per a subscripcions Web Push, **no autoritza un webhook administratiu arbitrari**. La discovery d’OAuth permet consultar els scopes anunciats pel servidor. [Scopes oficials](https://docs.joinmastodon.org/api/oauth-scopes/), [OAuth i PKCE](https://docs.joinmastodon.org/methods/oauth/).

| Peça | Mastodon | SDP/Node 0 verificat i concessió |
|---|---|---|
| Clients | `oauth_applications`, redirect URI, owner i scopes | SDP té OAuth d’entrada de proveïdors; no és encara un servidor d’autorització OAuth per a apps de tercers |
| Codis/tokens | `oauth_access_grants`, `oauth_access_tokens`, revocació i PKCE | Auth cookie R6 no és un token OAuth; no exportar-la ni construir JWT simulats |
| Lectura del perfil | Scope `profile`, permisos per endpoint | Proposar DTO mínim sense email/rol de gestió per defecte; email, si algun dia cal, en consentiment/àmbit separat |
| Publicació | Scopes `write:*` i token del titular | El token d’eixida de Mastodon és secret de servidor; no és una credencial d’entrada dels veïns a SDP |
| Push | `web_push_subscriptions`, claus i token associat | Hi ha `xat_dispositius_push` i cua/credencials privades canòniques; desplegament del servei i clients són evidència separada |
| Webhooks | Taula/configuració d’administració i worker HMAC | Falta registre d’apps/consentiment propi. No exposar per defecte esdeveniments amb dades de compte o denúncies |

El worker de webhooks de Mastodon usa `X-Hub-Signature` amb HMAC-SHA256 i permet xarxa local en un canal administratiu. **No s’ha de copiar aquest `allow_local:true` a callbacks creats per usuaris del Node 0.** La documentació situa els webhooks al panell d’administració; no són el mateix que les notificacions personals. [Model de permisos](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/models/webhook.rb), [worker](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/app/workers/webhooks/delivery_worker.rb), [documentació](https://docs.joinmastodon.org/admin/webhooks/).

**Esquema proposat:** `oauth_clients`, `oauth_authorizations`, `oauth_codes`, `oauth_tokens`, `app_webhooks`, `webhook_deliveries` i relacions de push. Secrets/token només hash o xifrat de servidor segons necessitat de reús; codis d’un ús, TTL explícit i refresh rotation amb detecció de replay. `UNIQUE(client,owner,grant)` no implica una única sessió per persona. El consentiment guarda la versió del catàleg de scopes i els exactament acceptats. Un token no adquireix scopes afegits més tard al client sense un gest nou.

**Endpoints proposats:** `POST /api/v1/apps`, `GET /.well-known/oauth-authorization-server`, `GET /oauth/authorize`, `POST /oauth/token`, `POST /oauth/revoke`; `GET/DELETE /api/v1/account/applications/:id`; `POST/DELETE /api/v1/push/subscription`; `POST/DELETE /api/v1/apps/:id/webhooks`. Authorization-code + PKCE S256, state lligat a l’intent i redirect URI exacta; sense password grant ni token a URL/logs. Per al primer desplegament no es necessita client-credentials amb autoritat d’usuari.

**Scopes SDP proposats:** `profile`, `read:publications`, `read:bookmarks`, `write:profile`, `write:publications`, `write:follows`, `push`. Cap `admin:*` al flux ordinari; l’amplitud de `read`/`write` d’un altre producte no es trasllada automàticament. El scope habilita una operació, però la RLS, el poble i l’actor real continuen limitant quines files pot tocar.

**Callbacks i dades:** llista blanca de camps per event i scope, resolució DNS/pinning a IP pública, HTTPS, límits de cos, timeout incloent cos, redirects controlats, retries amb backoff/Retry-After, `delivery_id` i timestamp signats, secret rotatable i cua amb lease. El consumidor deduplica; una entrega HMAC autèntica no vol dir que siga nova. Cada pont POSSE té owner personal o d’organització i autors vinculats dins del mateix tenant: el token remot, la seua referència de secret i els scopes són separats de la sessió SDP. La UI permet preparar i donar conformitat només per a eixe pont i política vigents. La política inicial de `@depoble` exclou el comerç, sense impedir el canal propi autoritzat d’una cooperativa. No publicar notes privades ni subscripcions push per exportació Open Data.

**Acceptació:** client A demana scope no registrat, redirect semblant, codi de l’altre client, PKCE incorrecte/replay, token revocat concurrent amb una escriptura, canvi de compte, permisos d’entitat retirats, IP privada per DNS/redirect, secret de webhook substituït, retry després de resposta ambigua i canvi de revisió editorial. No hi ha cap desplegament d’OAuth ni webhook nou acreditat per aquest estudi.

### Inventari de correspondència SQL i contracte d’autoritat

Les files següents són **disseny**, no DDL executat. Cal començar per una migració amb baseline/rollback revisats; no per crear una còpia paral·lela de totes les taules de Mastodon. Els IDs federats són cadenes opaques; la clau d’una publicació és una URI canònica estable, no un número convertit des d’un altre servidor.

| Mastodon / concepte | Taula o primitiva SDP actual | DDL mínim proposat i invariant |
|---|---|---|
| `account_statuses_cleanup_policies` | `notes.status`, `trashed_at`, `revision`; no política automàtica | Política única per tenant/actor, mode, llindar i excepcions; desactivada inicialment |
| `status_pins` | Camp de presentació reconegut pel mapper, sense relació equivalent en el catàleg | Pin amb tenant/actor/publicació, FK i únic; permís de gestió de l’actor |
| `bookmarks` | Sense taula equivalent de publicacions | Bookmark privat amb tenant/user/publicació; únic i autoritat de lectura vigent |
| Protecció patrimonial | Notes/OKF i memòria cultural | Relació de preservació, motiu tipat i actor que l’autoritza; no camp lliure del payload |
| `session_activations` | `auth.sessions` de compatibilitat; sessions locals R6 només LAB | Reutilitzar taula local quan s’integre; etiqueta/últim ús/revocació, cap token retornat |
| `webauthn_credentials` | Sense equivalent en Node 0 real | Credential ID únic, FK user, clau pública, RP, contador i transports; repte separat d’un ús |
| `account_aliases` | Motor pur FEP i documents aportats localment | Alias amb actor/URI i prova de resolució recent; únic per actor/URI |
| `account_migrations` | Cap taula en Node 0 actual | Origen/destinació, estat, prova, aprovador, dates/cooldown i `outbox_job_id`; únic intent actiu per actor |
| `bulk_imports` / `bulk_import_rows` | Importador Open Data i restauració local | Job, ítems, hashes, estat i errors; fila única per origen/ID extern; mode merge/substitució explicitat |
| `backups` | Export personal JSON i ZIP públic municipal | Job d’exportació privat amb objecte, manifest, expiració i descàrrega amb identitat comprovada |
| Històric i POSSE | `node0.public_documents`, outbox/tombstones; `public.posts` absent | `bridges` + `bridge_authors` amb ACL owner/tenant; registre estable únic recurs/pont + drafts/aprovacions lligades a hash i política |
| `invites` | Pertinences i RPCs d’alta directa | Token hash únic, tenant/emissor, caducitat/usos/rol permés; redemption única per user |
| `oauth_applications` | OAuth d’entrada dels proveïdors, no servidor d’apps | Client, owner, redirects exactes, scopes registrats i secret protegit |
| `oauth_access_grants` | Sense equivalent productiu | Codi d’un ús amb client/owner/PKCE/redirect/TTL; consum i token en una transacció |
| `oauth_access_tokens` | Cookie local no delegable; token Mastodon d’eixida separat | Token hash, client/owner/tenant/scopes/TTL/revocació/família de refresh; sense claims del client |
| `web_push_subscriptions` | `xat_dispositius_push`, cua i credencials privades | Reutilitzar després de revisar model de claus i consentiment; lligar a autorització/app real |
| `webhooks` | Sense registre d’apps equivalent | Endpoint/event/scopes/secret versionat i deliveries amb lease/intent/resultat/TTL; esquema de payload públicament documentat |

#### Matriu RLS i límit de les funcions

| Dades | `anon` | Persona autenticada | Gestió d’entitat/poble | Worker |
|---|---|---|---|---|
| Polítiques i jobs personals | Cap accés | Només `owner=auth.uid()` i pertinença del tenant | No hereta accés a notes o marcadors personals | Funció limitada als jobs reclamats, revalidant owner/tenant/revisió |
| Marcadors | Cap accés | Només propis i sobre objecte que pot llegir | Cap llista de marcadors de veïns | Pot consultar una protecció mínima sense exportar identitats |
| Pins/preservació d’entitat | Només projecció de peça ja pública | Lectura segons peça; escriptura segons actor propi | `can_manage_organization` + pertinença del poble | Funció no pot retirar una protecció ni promocionar visibilitat |
| Sessions, factors i challenges | Cap accés | RPC de metadades/revocació pròpies; no SELECT de secrets | Administració de poble no obté credencials d’una persona | Rol de verificació molt limitat, no rol HTTP amb BYPASSRLS |
| Alias/migracions | Només actor/redirect públic ja confirmat | Canvis del seu actor, reautenticats | Moviment d’entitat només amb autoritat específica; moure el node és altra competència | Resolució segura, signatura i outbox d’un intent aprovat |
| Imports/exports | Cap arxiu privat | Només el seu job i tenant; objectes amb URL efímera | Dret explícit per importar al catàleg editorial | Sense canvi d’owner/rol ni publicació automàtica dels ítems |
| Ponts, safata POSSE/aprovacions | Només peces públiques ja publicades; mai secrets | Només pont propi i autors que pot representar | `can_manage_organization` + tenant; política comercial pròpia de cada pont | Revalida ACL, vinculacions, actor remot, política, hash i aprovació sota lock |
| Invitacions | Només preview públic mínim | Enllaços emesos per ell, dins quota i permisos | Assignació màxima limitada per l’emissor; mai superadmin implícit | Consum atomic amb prova del correu i pertinença |
| Apps/grants/tokens/webhooks | Discovery pública; no secrets | Només apps i autoritzacions pròpies | Admin no pot consentir scopes personals per una altra persona | Egress amb permisos i payload filtrats; cap SQL arbitrari |

Les taules noves privades no reben `SELECT *` per a `anon`, `authenticated` o el rol runtime. Qualsevol `SECURITY DEFINER` té `search_path` fix, propietari dedicat, `REVOKE EXECUTE FROM PUBLIC`, ACL mínima i comprovació de l’actor i tenant dins la mateixa transacció. RLS no protegeix davant un superusuari o rol BYPASSRLS: els rols de petició han de ser no propietaris i no BYPASS. Activar FORCE RLS sobre taules existents indiscriminadament podria trencar funcions canòniques; qualsevol canvi s’ha de provar explícitament amb les seues ACL i dos comptes. Les claus `owner`, `tenant`, `role`, `aal`, `author` o `expectedActor` aportades pel client no són autoritat: `expectedActor` només és una comparació contra la identitat verificada pel servidor.

**Tall de versió del contracte:** el catàleg productiu de `section_submissions` encara enumera les cinc seccions canòniques antigues; AH-08 proposa vuit verticals. Una UI que afegix Mapa/Calendari/Animalets no canvia per si mateixa el CHECK ni la RLS de PostgreSQL. Cal la migració/contracte d’API concordants i la prova de visibilitat abans d’importar/sindicar les noves verticals. No s’ha de relaxar la policy per passar una prova UI.

### Fases executables i criteris de pas

| Fase | Entrega concreta | Criteri que permet passar |
|---|---|---|
| G0 · Autoritat i sessió | R6 auth/rates/driver combinats, preimatges CAS i startup gates; correu/ingrés real revisats | Cap token-only activation, C4 tancat, reset d’A no afecta cookie B, secrets no apareixen en logs, enumeració SMTP resolta i proves natives de concurrència. UI/capacitats continuen apagades fins aleshores |
| G1 · Arxius propis | Export personal i import preview amb formats reals; descàrrega privada | Doble compte/poble, timeout/replay, ZIP/XXE/XSS, reimport idempotent; cap dada privada al paquet públic |
| G2 · Compte i comunitat | Sessions visibles/revocables, factors provats i invitacions limitades | Factor de l’altre origen rebutjat, rols no escalables, últim ús d’invitació concurrent i revocació efectiva |
| G3 · Ponts POSSE simètrics | Pont amb owner user/org, `linkedAuthors` configurable i ACL tenant; URL map, draft exacte, aprovació lligada a revisió/política i ledger únic | Default `@depoble` exclou oli/cooperativa/comerç; canal propi autoritzat d’altre titular funciona sense canvi de codi; canvi de draft/política o revocació invalida aprovació; dos workers no dupliquen; actor remot verificat; cap POST abans d’auditoria/configuració i conformitat del producte |
| G4 · Conservació | Pins/marcadors/patrimoni i preview d’arxivat | Proteccions revalidades dins el lot, cap fuga de marcadors ni canvi d’abast; primer arxivat, esborrat automàtic encara separat |
| G5 · Migració federada | Alias i Move compatibles, feina durable i prova de receptor | Cap confiança en JSON pujat; signatura i target aprovats; seguiments traslladats acreditats a un receptor de laboratori; exportar contingut continua sent un procés diferent |
| G6 · Apps delegades | OAuth code/PKCE amb scopes mínims, revocació, push i webhooks limitats | Redirect/code/token/replay/SSRF negatius; dos clients i dos comptes; revocació tanca els canals associats; payloads filtrats i cap ampliació de scopes silenciosa |

Aquest ordre és una proposta per dependències, no una invitació a obrir treball nou per davant dels deutes P0/P1/P2 del carril. Aplicar fitxers CAS no autoritza activar serveis ni enviar publicacions. Root conserva la integració, el desplegament i l’informe de l’Escriptori; Gemini té l’arquitectura visual i Claude la síntesi/arbitratge.

### Adopció de programari lliure i límits

La llicència de Mastodon és AGPLv3 i el `LICENSE` viu de Sóc de Poble declara AGPLv3 o posterior. Es poden estudiar i adaptar els mecanismes sota les condicions aplicables: conservar avisos, identificar modificacions i proporcionar el codi font corresponent de la versió modificada als usuaris remots quan aplica la secció 13. La llicència no s’ha d’interpretar com una cessió automàtica de marques, ni del contingut personal dels estats i mitjans. Copiar codi concret demana conservar-ne procedència i llicència; les dependències i assets tenen els seus avisos propis. Fonts primàries: [LICENSE de Mastodon al commit](https://github.com/mastodon/mastodon/blob/24cd1c875a1ac393e587421726394d5692ff5496/LICENSE), [secció 13 AGPL](https://www.gnu.org/licenses/agpl-3.0.html#section13), [LICENSE SDP](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/LICENSE>).

L’adopció recomanada és de contractes verificables i mecanismes —política/cua separades, jobs revisables, alias amb prova, scopes mínims— amb una UI pròpia Pedra Seca. No és instal·lar Rails/Redis/Sidekiq com a dependència del Mac mini ni afirmar que el Node 0 és un servidor Mastodon. Tampoc és reanomenar les preferències actuals com si totes les opcions estigueren desplegades.

### Rebuts i límits de lectura

- `eixos-6-10.sources.json`: índex final de les fonts primàries, hashes locals, dates de consulta i inventari SDP.
- `sources-receipt.json`: 61 fitxers de Mastodon 4.7.5 descarregats amb SHA-256, arbre de descobriment i cinc rutes antigues inexistents registrades com a tals.
- `eixos-6-10-head-diff.json`: deu comparacions byte a byte amb HEAD fixat; totes idèntiques, sense atribuir aquest commit a mastodont.cat.
- `eixos-6-10-sdp-sources.json`: 20 fonts vives SDP llegides/capturades, sense modificar-les.
- `node0-esquema-prod.json`: catàleg de producció recollit per root, metadades exclusivament.
- `move-alias-compatibility.json`: reproducció local de l’exigència addicional de reciprocitat; no prova de xarxa.

No s’ha llegit cap secret ni fila personal per a l’estudi. La xarxa s’ha usat per GET de fonts públiques oficials. No s’han modificat els kits segellats ni la base de dades productiva. Les taules, rutes i fases noves són propostes concretes pendents de migració, integració i proves; no s’han marcat com a funcionalitats fetes.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Olivera abans d’obrir el torn: exit 0. Torn documental `torn_6fb89e24-ff16-445b-98a5-87abea29734d`, plantilla íntegra entregada per `context`, informe creat per `create`; comprovació documental final vàlida. R3 històrica: 161/161 Node i 76/76 Vitest en els àmbits indicats. R4 final: 264/264 Node, 159/159 Vitest, 12/12 natives, dos builds sota pressupost i replay CAS independent 8/8. R5 final: 385/385 Node en29 fitxers, 108/108 Vitest en9, 27/27 natives en3, lint0, dos builds sota pressupost i replay independent8/8; sumes del germà de verificació comprovades21/21, sense mutar el kit. Els resultats rojos anteriors es conserven; cap recompte focal acredita un verd global del repositori ni el contracte complet de backend.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Este és un informe viu. El Goal continua actiu i no hi ha cap cron de tokens creat. Pla i prompt llegits per l’arrel; **lectura semàntica íntegra delegada** del Llibre (375 línies, 279.589 B, SHA `754073eb27a95b78d46a09087194d616011c7585167e0e67dec502fe86de7f99`, 19 fragments) i ESTAT (948 línies, 187.187 B, SHA `2934557b479e2b6198ef1c41e4c8ab41d2605d727aa5bf03afa9ccb8e6c6ae0c`) pels subagents, sense truncar. Rebuts al kit, sense atribuir falsament la lectura personal a l’arrel. El desplegament natiu/públic de PostgreSQL/API i el mercat públic sí queden acreditats en R3. GoTrue local, Realtime/Storage reals, migració de perfils, activació de la SPA pública, integració de Claude i 10/10 global continuen pendents. Els LaunchAgents de PostgreSQL, API i Caddy són serveis del Node 0 autoritzats, no crons de tokens; s’executen dins de la sessió d’usuari i no acrediten un arrencament del Mac sense login.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
