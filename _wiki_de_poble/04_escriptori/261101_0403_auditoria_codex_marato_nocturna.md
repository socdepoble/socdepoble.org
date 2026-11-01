---
type: informe
status: canonic
description: Dictamen de la marató i del kit extern Carril 2 per a l'Assalt D01-D15, amb proves, preimatges, reserves i relleu verificables.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ac4e3ecd-3ab5-4e21-b33a-3b5990893846:506842c4-5ba9-421f-b60c-dcbd5cbb8ee3
---
# Dictamen Codex — Marató nocturna Fediversity, Notes i botigues

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ac4e3ecd-3ab5-4e21-b33a-3b5990893846:506842c4-5ba9-421f-b60c-dcbd5cbb8ee3 |
| Versió del document | 1.6.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T03:04:27.277Z |
| Modificació | 2026-11-01T17:27:05+00:00 |
| Propietari | Codex · Carril 2 de dades, federació i conformitat |
| Aprovació humana | ordre explícita del Mestre en este xat, 2026-11-01 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex · família GPT-6; identificador de variant no exposat per la sessió |
| Tokens consumits | no exposats per l’entorn; sense recompte inventat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-01T03:04:27.277Z: plantilla viva entregada i informe creat.

2026-11-01T03:07:48+00:00: passada 1/3 completada; línia base, sense entrega nova de Claude ni informe de Gemini d’esta marató.

2026-11-01T03:43:44+00:00: ampliació K1 expressa (fora del comptador 1/3): quinze notes, visió/argumentari i kit extern pre-verificat; cap canvi al codi viu ni a .agents.

2026-11-01T03:52:04+00:00: ampliació v2 demanada sense build/Vitest, estructura exacta de dos pegats, 20 casos lleugers de proposaCard/OKF i 8 autoproves de l’aplicador; 06:04/08:04 preservats.

2026-11-01T05:13:44+00:00: passada 2/3 completada sobre snapshot de les 06:07 CET; contractes lleugers, contrast d’entregues en curs i relleu per a les 08:04 CET.

2026-11-01T07:06:40+00:00: passada 3/3 final; 328 proves Vitest i 107 Node verdes; Frontissa 16/16; automatització eliminada i relleu registrat, sense commit ni desplegament propis.

2026-11-01T14:23:51+01:00: encàrrec Assalt 261101_1246, Carril 2 exclusiu; kit extern amb 4 pegats i 29 fitxers, tres iteracions consumides, reserves explícites i zero automatitzacions actives.

2026-11-01T17:27:05+00:00: inspecció viva de Claude i Kit Onada 2; quatre defectes reproduïts, 17 fitxers candidats, verificació dirigida verda i cap escriptura de codi al viu.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

<!-- SDP:INSPECCIO_CLAUDE_ONADA2_CODEX -->
### Passada d'Inspecció sobre els 225 fitxers de Claude i Kit Onada 2

**Dictamen actual: entrega viva substancialment ampliada; quatre defectes reproduïts i corregits només en el kit extern. Cap 10/10 global acreditat.** Este bloc substituïx les valoracions vigents anteriors; la resta de l'informe es conserva com a historial. L'abast és la inspecció aprofundida de les superfícies demanades pel Mestre, no una revisió exhaustiva dels 225 fitxers. S'han contrastat **34 fitxers** d'eixes superfícies amb els hashes de la còpia inicial: **zero canvis concurrents** al tall d'`evidence/estabilitat-viu.json`.

S'ha llegit el codi real de l'adaptador local i l'equivalència, el restaurador/lot/lectura pública, la inbox i el generador/instal·lador, els estats/hooks E2EE, persones de confiança i les dues migracions `2611011500` i `2611011510`. El nou informe `261101_1355_auditoria_claude.md` continua en esborrany al tall consultat: declara 28.177 proves després dels carrils, cinc fallades resoltes després i Gauntlet transversal en curs des de les 17:58 CET. És evidència declarada per Claude, no execució pròpia. La frase «cap P1 obert» d'eixe tall queda matisada pels reproductors següents.

#### Defectes demostrats de la inspecció

| ID / prioritat | Codi viu i reproducció | Efecte i correcció empaquetada |
| --- | --- | --- |
| O2-F01 · P1 | `src/data/federacio/inboxActivityPub.js`, càlcul de `caduca` a `verificaSignaturaHttpActivityPub`. RSA signada fa dues hores: es rebutja; afegint `expires` fora de les capçaleres signades: s'accepta. | Un tercer que conserve una petició pot ampliar-ne la finestra d'acceptació dins del màxim de 12 h. Només s'atén `expires` si `(expires)` forma part de la cadena signada; la resta conserva la caducitat curta. No s'ha provat una evasió del digest ni de la clau d'actor. |
| O2-F02 · P1 | `src/data/local/mitjansLocal.js`, `resolveAsset`/`urlDe`. Pujada privada d'Anna; es retarda `blob.arrayBuffer()`, es canvia a Berta i es completa: retorna el `data:` privat. | La comprovació d'autoria anterior a l'`await` no protegix l'eixida tardana. El pegat revalida persona i visibilitat després de llegir el blob i evita repoblar la memòria cau després de `destroy`. La prova cobrix també el tancament. |
| O2-F03 · P2 | `src/data/federacio/inboxActivityPub.js`, `alertaDe`. `endTime` vençut sense `published`, o amb `endTime <= published`: l'alerta es desa amb vigència nova. | Caducitat declarada ignorada i avís vençut reviscolat. Es respecta qualsevol `endTime` vàlid, inclòs el passat, abans de desar. Dos casos reproductors. |
| O2-F04 · P2 | `src/data/localXat.js` i `src/data/local/conversesLocal.js`. Dos tenants seed amb el mateix `filId`: una escriptura al primer notifica també el segon. | Filtració de metadades d'activitat (`filId`/`seq`), sense text de missatges reproduït. Canals vinculats al magatzem de poble/persona; el wrapper transmet l'abast; baixa/reinici anul·len callbacks pendents. Dues subscripcions antigues de prova s'actualitzen perquè passen `SEED` explícitament. |

Les quatre correccions i les proves són a `correccions-inspeccio-claude.patch`. Els logs rojos conserven quatre casos inicials de signatures/alertes/adjunt i un cas separat de canals; els mateixos reproductors passen en la còpia corregida. `requires_human_decision: false`: la intenció dels contractes és explícita; **la integració queda al carril de Claude**, sense cap aplicació de Codex al viu.

#### Entrega Onada 2 i deutes contrastats

Kit: `../_investigacio_ia_de_poble/261101_kits_onda2_llibre_mestre/codex/`. Porta `README_INTEGRACIO.md`, `MANIFEST.json`, `SHA256SUMS`, `verifica_i_aplica.py` amb `--check`/`--apply`/`--rollback`, quatre `.patch`, preimatges, 17 fitxers candidats complets i evidència reproduïble.

- **P1-07 / G-03:** la ruta real és `supabase/functions/noticies/gestor.js`, no les dues carpetes suggerides al prompt. La preimatge de Claude ja usa lectors i cursors monòtons: no s'ha demostrat quadratura residual ni un guany de velocitat contra ella. `p1-07-senseniats-lineal.patch` extraïx un escàner explícit O(n + k), evita concatenacions repetides, passa 3.000 equivalències contra l'oracle anterior i una fita de 5 s per entrada hostil d'aproximadament 1 MiB. Es conserva la semàntica històrica, inclosa la dels fragments malformats; no es canvia a un parser XML nou.
- **P2-09:** la migració `2610311900` ja tenia projeccions parcials tancades i precedència d'autoria; l'estat antic del Llibre no descriu exactament el viu. El nou pegat fixa un contracte JSON v1 de columnes/tipus i un propietari canònic per recurs: `owner_user_id`, `user_id`, `user_id`, `author_id`, respectivament. Exigix UUID i FK simple validada cap al compte, projecta només columnes pactades i retorna error visible per recurs si l'esquema no encaixa. **No s'ha capturat l'esquema remot ni executat PostgreSQL**: codi candidat i prova estàtica preparats, tancament operatiu encara pendent.
- **P1-24:** Claude ja havia afegit huit entrades rurals/d'ús a l'Atles; no es presenta l'antic «0/8» com a estat actual. El pegat amplia modularment amb **16 càpsules** (8 cultura/documentació rural i 8 ús quotidià), en un índex de reserva que no altera el rànquing de l'Atles. S'han verificat les fonts factuals de [pedra seca, UNESCO](https://ich.unesco.org/en/RL/art-of-dry-stone-construction-knowledge-and-techniques-02106) i [pilota valenciana, Ministeri de Cultura](https://www.portalinmaterial.cultura.gob.es/pci-ccaa/comunidad-valenciana/pilota.html); la resta són propostes editorials. No inventa horaris, tràmits, accions fetes ni dades municipals.

#### Reavaluació D01–D15 sobre l'arbre viu

Notes d'enginyeria ordinals i justificades per l'evidència disponible, sense mitjana ni certificació externa. Els pegats externs **no puntuen com a integrats**. En dimensions fora de la inspecció dirigida es conserva prudentment la valoració anterior; les declaracions de Claude s'identifiquen com a tals.

| Dimensió | Nota viva /10 | Evidència actual i bretxa material |
| --- | --- | --- |
| D01 · Port neutral i Model B | 8,0 | Segon adaptador modular viu, nucli/capacitats i conformitat verda en seed amb/sense sessió i local; equivalència de lectures amb Supabase seed. No és equivalència amb un servidor remot independent. O2-F02/F04 encara vius fins a integrar; serveis externs rebutjats honestament. |
| D02 · Pedra Seca i geometria | 7,5 | Claude declara zero crítics/avisos i porta verda. Sense repetir-la ni comprovació visual pròpia sobre tots els dispositius, es conserva la nota. |
| D03 · Accessibilitat rural AAA | 6,5 | Ampliació integrada declarada per Claude; esta passada no acredita lectors reals ni tots els criteris AAA. Nota conservada. |
| D04 · Sobirania i Open Data | 7,5 | Restaurador viu: SHA-256/BagIt, CRC, rutes, esquemes i representacions canòniques abans de restauració local atòmica; round-trip dirigit verd. GET anònim de notícies/agenda, però Supabase torna `memoria: null` i `memoriaOral: null`: col·leccions públiques incompletes. Configuració i binaris queden fora. |
| D05 · Federació oberta | 6,5 | WebFinger dinàmic i nucli RSA/Ed25519, processador idempotent de referència i outbox no buit al viu; proves dirigides verdes. O2-F01/F03 oberts al viu; falta endpoint desplegat, persistència, cua/entrega i interoperabilitat externa. |
| D06 · Enxufabilitat universal | 8,0 | Connector fora del scope directe d'esta passada. No s'ha instal·lat en un amfitrió net ni comprovat la publicació; nota conservada. |
| D07 · Nodes germans | 7,5 | D-13 corregit al viu: manifest d'identitat, actor/JRD/NodeInfo i outbox del node propi. Generador i instal·lador passen proves individuals sobre la còpia actual. Falta provisionament/servei real independent, backend, Nix i temps mesurat. |
| D08 · Privacitat, RLS/RGPD i E2EE | 7,0 | Estats honestos i barrera compilada; proves dirigides verdes. Bandera E2EE apagada i recuperació social explicitament inactiva; Shamir no equival a flux desplegat. P2-09 i migracions encara candidats sense DB real; O2-F02 al viu. |
| D09 · Notes i Karpathy local | 8,0 | Motor/OKF ja existents i round-trip local verificat; rebost ampliat extern amb 390 proves de família IAIA verdes. No s'ha integrat l'Onada 2 ni revalidat tota la UI de Notes; nota conservada. |
| D10 · Memòria oral i multimèdia | 7,5 | Importació viva de fitxes/col·leccions textuals i verificació canònica; prova de compatibilitat v1.0 també verda. Lectura pública remota de memòria absent; àudio, configuració, drets/procedència i restauració de binaris encara no acreditats. |
| D11 · Comunicació comunitària | 7,5 | SQL viu exigix el mateix tenant per a signar com ajuntament; empreses/entitats conserven la política pròpia. Caducitat local/UI i seguretat del fil tenen proves. SQL no aplicat; alertes remotes O2-F03 i canals O2-F04 pendents d'integració; falta entrega real amb reconnexió. |
| D12 · Multilingüisme | 7,0 | TE-01/02/05 ja existien segons el contrast de Claude; no s'han repetit revisió nativa eu/gl ni proves de tot el client natiu/encastat. Nota conservada. |
| D13 · Botigues i PWA | 6,5 | RPC mínim de client viu, ACL i enllaç Android comprovats estàticament; proves verdes amb configuració Capacitor real copiada. No hi ha aplicació SQL ni publicació acreditada, i el build 1 no es pot protegir retroactivament. |
| D14 · Governança i telemetria | 7,0 | Preimatges, rebut extern i hashes; transacció de governança integrada declarada per Claude. Sense modificar `.agents`, Llibre o índexs; falta tancament transversal de Claude i recepció HTTP/desplegament acreditats. |
| D15 · Rendiment i resiliència | 6,0 | Escàner lineal amb prova temporal i bateria individual aïllada. Cap build propi ni bytes gzip mesurats; no es certifica el llindar de 250 KB ni el comportament de xarxa rural. |

#### Verificació, preservació i tancament

**Últim resultat per fitxer: 1.041 proves Vitest (40 fitxers), 23 Node (2 fitxers) i 8 Python, totes verdes, zero omissions.** La família IAIA aporta **390 proves en 20 fitxers**, 372 de regressió i 18 noves. `evidence/resultat-consolidat.json` enumera ordres/logs; no s'hi sumen repeticions com a cobertura addicional. Cada invocació Vitest conté un sol fitxer, `--maxWorkers=1 --no-file-parallelism` i memòria cau externa. Node usa `--test-concurrency=1`. **Cap suite global ni `npm run build`.**

Tres passades organitzades: reproducció; deutes/equivalència; integració final amb comprovacions dirigides de les fallades. Es conserven els logs de dos casos IAIA que fallaven per l'ambigüitat de «pedra» (corregida sense tocar les expectatives antigues), la subscripció antiga sense abast (actualitzada) i els errors de preparació de la còpia (alias, arrel, ESLint, icona i Capacitor). Els últims resultats corresponents són verds. No queda una quarta passada ni cap feina programada.

Packaging: quatre pegats junts passen `git apply --check`; l'aplicador aplica en arrel efímera i passa la comprovació inversa; les huit autoproves cobrixen conflicte, idempotència, rollback, alteració i travessia de rutes. **`--check` sobre el viu és verd; no s'hi ha fet `--apply`.** El circuit documental (`context`, pla aprovat, `own`, plantilla) s'ha executat en la còpia externa, amb torn `torn_e3396d66-4ce8-4fcf-8406-76187dcb2740` i rebut `a9262454-e2ec-4ad1-9438-7ca95f76cc18`; el `reflex` original d'este informe es preserva. El rebut extern no acredita una transacció de governança al viu.

En acabar, sis automatitzacions locals examinades: totes `PAUSED`, **zero actives**, cap creada per esta passada. Al viu, l'única escriptura pròpia és este informe; es preserven codi, proves, `.agents`, índexs i Llibre de Claude. Per la restricció expressa del Mestre no es crea Acta Marmota ni s'executen escriptures de tancament al seu carril; este bloc deixa el relleu i les reserves.

<!-- /SDP:INSPECCIO_CLAUDE_ONADA2_CODEX -->


<!-- SDP:ASSALT_1010_CODEX_CARRIL2 -->
### Dictamen vigent · Assalt 261101_1246 · Carril 2 exclusiu

**Kit materialitzat, pendent d'integració de Claude; cap 10/10 nou acreditat al viu.** S'han llegit íntegres els quatre documents exigits pel Mestre, l'Acta Marmota `261101_1304`, el BIOS i el procediment/plantilla vigents. El nou informe de Claude `261101_1355_auditoria_claude.md` s'ha llegit íntegre al tall de les 14:07 CET: és encara un esborrany de línia base, amb 27.243 proves declarades i sense conclusions d'integració. No es transforma eixa declaració en una prova pròpia. El comptador d'este encàrrec és independent de la marató nocturna anterior: **tres iteracions consumides i cap quarta programada**.

**Lliurament:** `../_investigacio_ia_de_poble/261101_kits_10_10/codex/`, amb `README_INTEGRACIO.md`, `verifica_i_aplica.py` (`--check`, `--apply`, `--rollback`), `MANIFEST.json`, preimatges, fitxers complets, quatre pegats i bateries llestes. **29 fitxers de producte/proves candidats**, sense aplicar-los al viu:

| Pegat | Evidència del kit i frontera |
| --- | --- |
| `adaptador-local-conformitat.patch` | Adaptador en memòria independent; corredor neutral sobre **82 casos canònics**, tots executats sense omissions en el cas local. Notes amb revisió i xat idempotent. Storage amb instància per operació: senyal real sense mutar el cubell original, inclosos originals congelats. Conserva sostres de 4 en vol/32 en cua i reconciliació tardana. OAuth, correu, TOTP i transports privats de servidor rebutgen explícitament: no és un segon servei de producció complet. |
| `open-data-restaurador-roundtrip.patch` | GET anònim d'app_content per notícies, agenda, memòria i OKF; cap JWT/cookie ni section_submissions. BagIt verificat criptogràficament abans de restaurar una instantània pública atòmica/idempotent al local. Round-trip verd de col·leccions textuals i bytes OKF. Falta recuperar configuració, mitjans originals i comptes; el kit no certifica la recuperació de tota la base de dades. |
| `activitypub-fase2-i-node-germa.patch` | RSA/Ed25519 reals, host/query/data/digest vinculats, clau de l'actor, Follow→Accept i deduplicació transaccional, Create/Delete i Announce autoritzat amb caducitat. Xixona amb actor/JRD/NodeInfo propis i outbox no buit. La pàgina municipal real pobla l'outbox; no s'inventen notícies. Falta ruta HTTP desplegada, persistència, cua d'entrega i interoperabilitat externa. |
| `e2ee-shamir-i-alerta-tenant.patch` | CHECK de la fila amb organització i tenant_id, membresia estricta de town_id i baixa; migració candidata no aplicada. Caducitat del Mur per temporitzador únic i visibilitychange. Shamir k=3 amb cercle de 40 amics i regressió E2EE existent. C11-03/C11-05 ja tenen migració 2610281730: es prova el codi existent, sense duplicar-lo ni certificar concurrència PostgreSQL. |

**Resultats executats:** Vitest dirigit: **414 passades, 1 fallada d'expectativa antiga i 2 omissions / 417**; Node: **26/26**; autoproves de l'aplicador: **8/8**. La fallada és `storage.termini.test.js:246`: esperava que un cubell congelat NO rebera senyal; el resultat real és un `AbortSignal`, com demana P1-27. S'ha actualitzat l'expectativa al pegat i **no s'ha reexecutat** per respectar el màxim de tres iteracions. No s'inventa una suite final verda. Les dues omissions són vectors antics de recuperació (caixa S completa i implementació Shamir independent).

Les dues primeres invocacions consten com a preparació/verificació fallida: la primera no va trobar un setup de QA inexistent (0 casos executats); la segona va donar 11/14, amb codi de rebuig local incorrecte i dues assercions equivocades, corregits abans de la tercera. Les proves criptogràfiques i de nodes inicials van passar 8/8; no se sumen als 26 finals com a cobertura única. S'ha usat un worker i una configuració amb memòria cau pròpia. L'enllaç sencer inicial de node_modules s'ha substituït per un directori propi amb enllaços als paquets, excloent les memòries cau; cap build global.

**Packaging final:** els quatre pegats junts passen `git apply --check`, l'aplicador passa `--check` i `--apply` en una arrel efímera, i `git apply --check --reverse` confirma les postimatges. S'ha corregit el format inicial dels fitxers nous amb `new file mode 100644`; el resultat final de packaging és exit 0. Les 8 autoproves són anteriors a eixe ajust del parser i a la guarda final de directoris de rollback; no se'n declara una repetició. `--check` contra el viu passa al tall registrat; no s'hi ha executat `--apply`. Si Claude canvia una preimatge, el check ha de refusar-la i la integració requerix reconciliació en el seu carril.

#### Reavaluació actual de D01–D15

Les notes següents corresponen **al producte viu inspeccionat**, no a la presència de propostes externes. Substituïxen la taula K1 com a valoració vigent; les taules anteriors queden com a historial. Escala ordinal d'enginyeria, sense mitjana ni certificació externa.

| Dimensió | Nota viva /10 | Aportació d'este kit o contrast actual | Bretxa material per al 10/10 |
| --- | --- | --- | --- |
| D01 · Port neutral i Model B | 7,5 | Segon adaptador amb 82 casos i aïllament/cancel·lació provats en còpia; P1-27 real sobre l'SDK. | Integrar i reexecutar l'asserció actualitzada; serveis externs d'un segon backend real, canvi de sessió i restauració integral. |
| D02 · Pedra Seca i geometria | 7,5 | Cap canvi propi de UI al viu; referència prèvia de 9 avisos. | Zero avisos i matriu visual 1024 px/dispositius; entrega de Claude/Gemini encara sense certificar ací. |
| D03 · Accessibilitat rural AAA | 6,5 | Regió viva existent del Mur conservada; rellotge sense una regió per targeta. | Lectors reals, focus/zoom/teclat i tots els criteris AAA aplicables; cap certificació global inferida. |
| D04 · Sobirania i Open Data | 7,0 | Lectura anònima real i restauració textual/OKF amb SHA-256 en el kit. | Integració, dades municipals reals revisades, mitjans/configuració i restauració en un segon servei independent. |
| D05 · Federació oberta | 4,5 | Nucli de fase 2 amb signatures reals i idempotència local. | Endpoint servidor connectat, persistència, entrega/reintents/moderació i interoperabilitat externa. |
| D06 · Enxufabilitat universal | 8,0 | Connector oficial preexistent; fora del carril d'edició de Codex. | 1.1.11 integrat/publicat i comprovació sobre amfitrions nets amb sessió, idioma, CSP i baixa. |
| D07 · Nodes germans | 6,0 | Defecte D-13 resolt en còpia per a Xixona; actor, descoberta i outbox propis. | Integració, build i servei d'un host independent, backend, Nix i temps de provisionament mesurats. |
| D08 · Privacitat, RLS/RGPD i E2EE | 6,5 | Regressió E2EE i Shamir real; C11-03/C11-05 ja implementats al SQL actual. | UI opt-in i recuperació social, rols/baixa reals, prova concurrent PostgreSQL i auditoria independent del protocol. |
| D09 · Notes i Karpathy local | 8,0 | Es corregeix la nota històrica K1 de 6: el motor OKF i revisió sí existixen des de la marató. El kit conserva les fitxes públiques. | Tags/àlies, fixació del tutorial i contrast de la UI final de Claude. |
| D10 · Memòria oral i multimèdia | 7,0 | Round-trip de fitxa OKF revisada i col·lecció textual. | Àudio original/transcripció, procedència/drets, binaris i restauració de preservació; HMR real. |
| D11 · Comunicació comunitària | 6,5 | Migració per poble de la fila i rellotge de caducitat preparats. | Aplicació/validació SQL, client real amb talls/reconnexió, UI E2EE, adjunts i comprovació d'entrega. |
| D12 · Multilingüisme | 7,0 | El kit conserva el traductor existent del Mur; cap diccionari propi reescrit. | TE-01/02/05, revisió nativa eu/gl i llengua efectiva en natiu/encastat. |
| D13 · Botigues i PWA | 5,5 | Cap signatura ni publicació nova feta per Codex. | OAuth/guard Apple, pins reals, proves natives, fitxes i revisió efectiva de botigues. |
| D14 · Governança i telemetria | 7,0 | Rebut extern, hashes i aplicador conservador; tractor-vigilant ja existix segons codi/contrast de Claude. | Cadena del tall integrat i recepció HTTP real, tancament mecànic i desplegament acreditats. |
| D15 · Rendiment i resiliència | 6,0 | Bateria dirigida aïllada i un worker; cap recompte de bytes inventat. | Build final <250 KB gzip, Wiki diferida, mètriques en xarxa rural i recuperació mesurada. |

#### Troballes per al relleu de Claude

**C10-01 · P2 · Contracte citat i rutes inexistents.** No hi havia una funció `executaKitConformitat` en `conformitat/kit.js`: hi ha CASOS/contextDeConformitat/executaCas. El kit afig un corredor separat, sense falsejar la suite canònica. `AlertaMunicipal.jsx` és a `src/sections/mur/`, i no hi ha `xat/e2ee/sessioXat.js`; s'han provat els mòduls xifratXat reals. C11-03/C11-05 i tractor-vigilant no s'han de tractar com a absents. `requires_human_decision: false`.

**C10-02 · P2 · Límit de la restauració.** El round-trip acreditat és públic, textual i OKF; no cobrix mitjans/configuració ni infraestructura. Fer-lo equivalent a «municipi complet restaurat» seria una afirmació superior a l'evidència. El README concreta eixa frontera i la integració pendent del flux que publique les fitxes revisades a app_content. `requires_human_decision: false` per a integrar i completar dins del pla aprovat.

**C10-03 · P2 · Fase 2 no servida per Firebase estàtic.** Les funcions i proves no creen una ruta HTTP. Cal el host de servidor, persistència de transaccions/outbox i un resolutor de claus amb protecció contra SSRF. El nucli no fa fetch arbitrari. Perfil Cavage, no RFC 9421. Referències primàries: [W3C ActivityPub](https://www.w3.org/TR/activitypub/), [draft Cavage](https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12), [BagIt RFC 8493](https://www.rfc-editor.org/rfc/rfc8493). `requires_human_decision: false` per al nucli autoritzat; no hi ha desplegament implícit.

#### Circuit documental, desconvocatòria i Proposta d'Automillora

Per evitar col·lisions, el circuit obrir_torn → context auditoria → pla → own s'ha executat en la **còpia física externa**, torn `torn_cfbd3d07-f7dd-448f-8577-10f4ea979d11`, rebut `sdp:torn_cfbd3d07-f7dd-448f-8577-10f4ea979d11:919ade98-4c78-4cbb-b2e8-b8c37ec9be41`. Plantilla llegida sencera, SHA-256 `f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c`. S'actualitza este dictamen existent mantenint-ne el rebut viu original: no cal create d'un segon informe. ESTAT/LEDGER compartits i índexs no s'han modificat; el relleu s'ha deixat al kit i a este bloc per a MarIA. El tancament mecànic s'informa separadament del resultat de les proves.

**Automatitzacions:** inventari final a `evidence/automacions.json`, **zero ACTIVE**, sis tasques anteriors PAUSED i cap de pròpia creada. No hi ha cap cron nou a cancel·lar; la vigilància nocturna anterior ja constava eliminada. No queden proves, servidors ni agents propis residents. No s'ha enviat correu, aplicat SQL, publicat cap paquet ni desplegat cap servei.

**Millores Proactives Reversibles Aplicades:** quatre pegats amb hashes/preimatges i rollback conservador; prova de concurrència d'inbox i notes; revisió del resultat real amb expectatives antigues visibles; separació explícita entre integritat BagIt i autenticitat del productor. El viu només rep esta ampliació del dictamen; la resta és externa.

**Proposta d'Automillora:** «Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient»: fixar un manifest inicial de rutes reals i separar «kit verificat», «integrat» i «operatiu», amb el límit de tres iteracions aplicat a bateries identificades. Evitaria demanar un 10/10 global quan hi ha proves de servidor/dispositiu fora del carril. El flux útil ací és una còpia física, cacheDir propi i aplicació per preimatges; no s'atribuïx cap capacitat de model nova que l'entorn no haja exposat.

**Tancament mecànic de la còpia externa:** `tancament.mjs --check --turn-id torn_cfbd3d07-f7dd-448f-8577-10f4ea979d11` retorna **exit 1 / planned**. Olivera, plantilles, LEDGER, segell i skills passen. La còpia parcial exclou l'arxiu històric: autoritat/Wiki/SCC detecten eixes absències; també hi ha canvis de codi de laboratori fora del scope documental i el relleu no complix els patrons d'ESTAT/LEDGER d'eixe torn. No és un resultat de les portes sobre el viu, ni es força el tancament. Logs i rebut es conserven al kit. El dictamen existent sí passa `document.mjs check` en còpia abans de publicar-lo.

**Segell material de l'entrega:** MANIFEST.json SHA-256 `f68e8e0cd538f679e0da3dc5b41ee523cb77b8728d5ca9b5db991ad592ecb2bd`; SHA256SUMS SHA-256 `7865dad3adbdb77c1edd44cca6cc61ee5d2e1d3b486fc6331cae671368473318`. 57 fitxers inclosos en les sumes (guia, eines, pegats, preimatges, payloads i evidència seleccionada). `executa_proves.py --repo .` permet a Claude repetir la bateria en el seu checkout amb memòria cau pròpia; el corredor empaquetat tampoc s'ha reexecutat després del límit.

<!-- /SDP:ASSALT_1010_CODEX_CARRIL2 -->

### Dictamen de la passada 1/3

**Marató en curs; acceptació T1–T8 encara no acreditada.** Al tall inspeccionat, `HEAD = a6e4b0d815bd56acbe27337d99da2a8a06d77e47`. No hi havia canvis nous als fitxers de codi del carril ni cap informe nou de Claude/Gemini a l’Escriptori; hi havia el pla, el prompt i el Llibre Mestre. Els canvis documentals anteriors i els recursos del Mestre s’han conservat. Una suite de regressió verda del comportament anterior no acredita els criteris nous d’IDEA-59.

### Control del nombre de passades

- **Passades completades: 3 de 3.** Inicial, 06:06 i última activació de les 08:01 CET (nominal 08:04); K1 no compta. Seguiment nocturn acabat.
- Última passada executada: **2026-11-01 08:01–08:07 CET**, `Europe/Madrid`, abans del límit absolut 08:15.
- Automatització pròpia: `marat-fediversity-inspecci-cada-2-hores`, associada a este mateix xat; **eliminada amb èxit a les 08:04 CET** (`deleteStatus: deleted`). No resta cap activació pròpia.
- Límit **08:15 CET del 2026-11-01** respectat; no s’ha creat cap quarta passada ni un substitut de la vigilància.
- La desconvocatòria afecta únicament esta automatització. Cap servidor o recurs de Claude, Gemini o del Mestre aturat.

<!-- SDP:PASSADA_3_261101 -->
### Dictamen final · passada 3/3 · 08:01–08:07 CET

**Inspecció nocturna acabada. Acceptació local dirigida favorable; producte encara sense desplegament nou ni certificació completa de T1–T9.** HEAD continua en `a6e4b0d815bd56acbe27337d99da2a8a06d77e47`. El snapshot final inclou **156 fitxers amb SHA-256** i 89 refrescats respecte de la còpia anterior; la comprovació de concurrència no detecta cap canvi d’estos fitxers durant les proves. El manifest complet i els informes llegits queden a `passada_3/`. Les conclusions d’esta secció substituïxen els estats pendents dels talls anteriors quan s’indica resolució expressa.

**Entregues contrastades:** informe complet de Claude, modificat a les 07:50 CET (contingut final, encara `status: esborrany`); Gemini **v1.7.0**, 07:47 CET, comparat íntegrament amb la còpia v1.4.0 i llegit tot el delta. No s’ha pres una validació documental com a prova d’execució del build. Gemini ja ha corregit l’actor `iaia-maria` al seu esborrany; les promeses generals d’AAA, temps d’instal·lació i indestructibilitat seguixen necessitant les reserves explicades en K1. Claude manté una crítica antiga al slug de Gemini que ja havia quedat resolta a la passada 2.

#### Verificació final pròpia

| Comprovació | Resultat i abast |
| --- | --- |
| Vitest dirigit al delta | **19 fitxers, 328 proves passades, 0 fallades, 0 omissions**, 17,01 s; un worker i sense paral·lelisme de fitxers. Cobrix Notes/tutorial/URL/guia, toolbar/teclat/segona fila, OKF/revisió, Open Data, alertes, Multimèdia, avatars i associacions natives. |
| Node dirigit | **107 passades, 0 fallades, 0 omissions**, 6,45 s. K1, motor OKF real, CLI immutable de Xixona, plugin, botigues i les 11 proves del generador d’associacions. Metadades Git exclusivament privades, amb objectes de HEAD llegits de l’original; cap índex ni referència del viu escrit. |
| Balanç d’esta passada | **435 proves pròpies verdes**, sense omissions. No sumar-les a recomptes de talls anteriors com si foren cobertura única. La prova `[DEFECTE]` continua sent una reproducció positiva d’un deute. |
| Frontissa | **16/16, exit 0**. Els pendents `descarregues` i `fediversity` de la passada 2 queden resolts en el registre aprovat per Claude; també s’ha actualitzat `versions`. Cap aprovació feta per Codex. |
| Design Guard | **2.803 fitxers, 0 crítics, 9 avisos**, exit 0; reducció real de 12 a 9, sense atribuir-li zero avisos ni certificació AAA. |
| Tractor cromàtic / porta editorial | **exit 0**; C1–C6, 10 contrastos comprovats; errors editorials buits. |
| Autoritat / Olivera vius | **exit 0**, lectura sense moviments ni canvis de governança. |
| Tancament propi, `--check` | **exit 1, planned**. Els huit checks d’entorn passen; resten pla modificat respecte del rebut inicial, canvis aliens de codi fora de l’abast documental i quatre captures humanes posteriors. Ja no hi ha detecció de concurrència ni els cinc deutes documentals inicials. No forçar un tancament ni modificar `.agents/`. |

La suite dirigida s’ha llançat amb `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --no-file-parallelism` i els 19 fitxers del log. Node s’ha executat amb `node --test --test-concurrency=1` sobre `codex-k1-exporta-open-data`, `codex-k1-inicia-node-germa`, `codex-k1-proposa-card-okf`, `codex-passada2-okf`, `inicia-node-germa`, `enxufe-plugin`, `botigues`, l’instal·lador unitari i `tooling/vite/associacio-apps.test.mjs`.

**Globals i build:** Claude declara **27.243 passades Vitest amb 103 omeses**, **1.789 passades Node amb 3 omeses i 3 diagnòstics heretats**, i `npm run build` complet verd al tall 07:24–07:39. És evidència declarada en la seua entrega, sense hash de resultat reproduït ací. No s’han reexecutat suites globals ni build: les proves pròpies són dirigides, el build ja té entrega declarada i es respecten el límit de recursos i els dos intents d’entorn fallits anteriors. No es certifica un build propi ni es confon una compilació local amb producció.

#### Acceptació T1–T9 i pendents del relleu

- **T1/T2:** canal oficial, contingut i Frontissa validats localment. El web públic i el paquet WordPress instal·lat han de rebre els canvis per una acció posterior autoritzada; no s’ha fet cap desplegament, SVN ni correu.
- **T3:** exportador 1.1.0/ICS i verificació adversarial verds. El collector real encara retorna només entitats i quatre omissions explícites: notícies, agenda, memòria cultural i configuració. `memoria.md` explica el paquet; no és una col·lecció de memòria oral exportada. La CLI prova còpia i descoberta, però el node Xixona hereta La Torre; la prova usa `git archive HEAD`, i per això no certifica tota la release encara sense commit. Falten actor propi, construcció/servei del segon node, Nix i restauració real.
- **T4:** criteris de Notes coberts per les proves dirigides; OKF real rellegit amb parser independent, esborrany/revisió explícits i sense xarxa. La visita de navegador la declara Claude; Codex no l’ha repetida. No convertir esta evidència en una certificació completa de dispositius o accessibilitat.
- **T5:** proves de geometria, reserva d’identitat i cares lleugeres verdes. `P1-71` continua **FET EN PART** al Llibre Mestre, amb HMR real i privacitat de les reserves pendents; P1-70/P1-72 indiquen **arbre viu, sense commit**, no producció. La foto gran es conserva i el xat usa `avatar_miniatura`.
- **T6:** el generador d’App Links que faltava a la passada 2 ara existix i passa 11 proves. Amb la configuració real sense empremtes **no emet cap assetlinks**; AASA i Universal Links continuen apagats. Calen certificat de Play, identitat Apple, OAuth servidor, proves natives de baixa, captures i enviament real. Els IDs històrics no s’han reassignat.
- **T7/T8:** integració K1 parcial auditada per Claude: exportador idèntic al kit; instal·lador adaptat a tres casos de frontera i registrat en la suite primària. Els altres tests/helpers continuen com a suplement extern. Gemini aporta tres espècimens, amb els 9 avisos restants explícits; no acceptar com a «integrat» tot el seu kit.
- **T9:** verificació dirigida i gates acreditats en esta passada; globals/build declarats per Claude. Relleu complet amb límits, sense declarar tancat mecànicament el torn propi.

**Kit v2 preservat:** el SHA-256 de `SHA256SUMS` continua `ff46dd7c96f8bf677cb1cecae7d8ba980ecc282cffbd7298a704187bc06fa6ca`. El check de només lectura contra el viu refusa correctament `tests/codex-k1-inicia-node-germa.test.mjs` perquè Claude l’ha adaptat: **no tornar a aplicar el kit v2 en bloc ni forçar la col·lisió**. No és una regressió del producte; és la guarda de preimatge fent la seua funció. El pegat documental inicial ja no és necessari per a eliminar els cinc errors originals.

**Matriu i NLnet:** les quinze notes K1 són un tall històric. D09 ja té més evidència (motor, diàleg i interaccions dirigides), però no s’ha inventat una mitjana nova ni promogut tota la matriu a 10/10. Es conserva l’argumentari tècnic prudent d’este informe: formats oberts i integritat provats localment; recuperació, independència completa i federació bidireccional com a treball mesurable pendent. Abans de copiar el correu, fixar el commit i contrastar els enllaços i l’artefacte realment publicat.

**Anotació de seguretat declarada per Claude D-9:** possible `.env` en una branca pública. Codex no n’ha llegit cap contingut ni ha comprovat el remot; la referència local `origin/main` no existix. No es certifica exposició d’un secret ni es fa cap rotació o canvi de Git. Queda traslladat com a verificació pendent del propietari, separat dels resultats verds del producte.

#### Millores Proactives Reversibles Aplicades i tancament

1. QA diferencial congelada i contrast final de hashes: 156 fitxers, sense canvis durant les proves; logs propis i rèpliques dels dos informes preservats.
2. Verificació independent de la integració parcial K1, de les associacions sense empremtes fictícies i del rebuig segur de reaplicació sobre l’adaptació de Claude.
3. Desconvocatòria consumada: `automation_update(mode="delete")` confirma **`deleteStatus: deleted`** per a `marat-fediversity-inspecci-cada-2-hores`, a les 08:04 CET. No resta cap revisió pròpia ni vigilància intermèdia.

Només s’ha modificat **este dictamen** al viu. ESTAT/LEDGER i el Llibre Mestre compartit no s’han reescrit per preservar la frontera humana; el seu bloc «QA Codex · passada 1/3» és històric i este informe és el relleu vigent. Cap procés de proves propi queda actiu; la còpia i els logs s’han conservat com a evidència, sense servidor, daemon ni agent propi resident. El torn documental queda **planned**, amb les causes explícites de la porta, i el seguiment nocturn queda **acabat**.

Validació final: `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261101_0403_auditoria_codex_marato_nocturna.md`, primer en còpia i després al viu, sense mutació de runtime. Resultat registrat a `passada_3/document-check.log` i `document-check-viu.log`.

#### Empremtes del tall final

Logs: `/private/tmp/sdp-marato-261101-gjusef16/passada_3/` (`vitest-dirigida.log`, `node-contractes.log`, gates, `tancament-check.log`, `kit-check.log`, `snapshot.json`, `end-cut.json`). Reproducció de Node amb Git: metadades creades només a `copia/.git`, `git read-tree HEAD` exclusivament allí i objectes de l’original llegits mitjançant alternates; mai s’ha escrit en `.git` viu.

```text
9a5b19bd4312f59407106a82aafeeaa7c40378b5dcc8ea5bdeaf2858ca2cb6ba  src/sections/notes/memoriaOral.js
cde11107e27fcaa0bcd86cf6ea19d73f92691f58ce3f9a47c5f936acd8d9c67a  src/sections/notes/NotesSection.jsx
c203b70e862e48d27664e1bdcda6b771b43dbc6f5da79bee00ef07fa6356817b  src/components/universal/UniversalToolbar.jsx
6d578e42fc92357491a52f8fe37c3403d30c1a9de0295b04a2c44bf480343193  src/data/exportaMunicipiOpenData.js
abca3055f20f259ecd7094cb39e418b258e2a2f4ff919666e97a029a3a2d868f  tests/inicia-node-germa.test.mjs
51b924d489384b4f6501ab2aae2f250280def49cc6f0a0a2d27863b67573bbf2  tooling/vite/associacio-apps.mjs
25b1881885dd3e64c0e8dc18a69d1f52fb697e4e97be298a0d67114026c7f2f6  .agents/contingut_estructural.json
2a7b1a6d3a7333c5e883851e94905e708c2477a92c057d628812bb9ba02f2eb0  261101_0409_auditoria_claude.md
12e1c750c5572f512f0f9474860478eaaf10e2c19481040a820c6953575273fd  261101_0407_auditoria_gemini_marato_nocturna.md
```

<!-- /SDP:PASSADA_3_261101 -->

<!-- SDP:PASSADA_2_261101 -->
### Dictamen de la passada 2/3 · 06:06–06:14 CET

**Avanç de codi verificat parcialment; marató encara en curs, sense acceptació final.** El tall de proves és la còpia aïllada de les **06:07:17 CET**, HEAD `a6e4b0d815bd56acbe27337d99da2a8a06d77e47`. S’han refrescat 130 fitxers canviats/nous des de la línia base; el manifest és `passada_2/snapshot.json`. No és un commit consolidat: en el contrast final de les 06:12:29 CET, **29 d’eixos 130 fitxers ja havien tornat a canviar**. Les proves següents acrediten els bytes del snapshot, no les versions posteriors.

S’ha llegit íntegre el dictamen de Claude `261101_0409_auditoria_claude.md`: continua com a esborrany de 1.767 bytes, sense troballes ni resultats completats. S’ha llegit íntegre Gemini **v1.4.0**, modificat a les 06:11:30 CET, inclòs el seu Tall 4. S’han llegit sencers els dossiers nous `perfil_minim_allotjament_node_municipal.md` i `guia_publicacio_app_store_i_google_play.md`, i els seus deltes posteriors al snapshot. S’han reconsultat els blocs actualitzats del prompt: ara **T7 = K1, T8 = millora reversible i T9 = verificació final**; les matrius anteriors T1–T8 d’este informe són històriques.

| Bloc actual | Evidència pròpia i límit d’acceptació |
| --- | --- |
| **T1 · WordPress.org** | Canal `wordpress-org` obert a `https://wordpress.org/plugins/socdepoble/`; Google/Apple continuen amb URL nul·la. El contracte Node del plugin passa. Falta la comprovació visual/HTTP pròpia del resultat final i el tall consolidat. |
| **T2 · Fediversity** | `pageContent.js` actualitzat. La Frontissa rebutja encara les dues empremtes `descarregues` i `fediversity`; coincidència amb TG-04 de Gemini. No aprovar empremtes des del carril QA. NodeInfo/actors estàtics no acrediten inbox ni federació d’emergència bidireccional. |
| **T3 · Open Data i node germà** | Exportador ampliat a esquema 1.1.0 i `agenda.ics`; passa la bateria adversarial K1 executada. El collector seguix declarant omissions de notícies, agenda, memòria i configuració: no s’acredita extracció completa real. La CLI real copia i verifica la release, però el test verd **[DEFECTE]** reproduïx que Xixona publica l’actor de La Torre i reescriptures heretades. No equival a replicació municipal completa. |
| **T4 · Notes / IDEA-59** | Tutorial en l’entrada nua, selector H3/H4/H5/H6/H2, guia efímera i extensió sense subratllat presents en el snapshot. **Novetat acreditada:** `memoriaOral.js` genera un concepte OKF rellegible amb YAML independent, draft sense verificació inventada, revisió humana explícita, índex arrel i log. Quatre proves Node pròpies verdes. Falta executar els tests d’interacció de les versions finals i verificar el navegador. |
| **T5 · Multimèdia, avatar i readme** | Canvis als workspaces i miniatura específica `avatar_miniatura` de 256×256; preserva `avatar_url` gran. El contracte del plugin passa amb el readme valencià del snapshot. Posició final dels volums, càrrega HMR i mides realment servides no certificades en navegador. |
| **T6 · Botigues** | Dossier multilingüe complet amb dades, baixa, OAuth, captures i pendents explícits. Firebase `appAssociation: NONE`, App Links i Universal Links encara apagats. L’absència d’associacions estàtiques és intencionada mentre falten identitats reals; no s’ha de substituir amb empremtes fictícies. El generador citat `tooling/vite/associacio-apps.mjs` encara no figura al tall inspeccionat: el dossier el situa pendent del circuit de governança. Preparació local, sense signatura, pujada ni publicació acreditades. |
| **T7 · K1** | Kit Codex v2 conservat amb els dos pegats i sis fitxers de proves/helpers; no regenerat ni aplicat al viu. SHA de SHA256SUMS continua sent la referència de l’entrega v2. Els canvis documentals de Claude poden haver resolt parcialment el pegat 01: tornar a fer check/CAS abans d’integrar. |
| **T8 · Millora reversible** | Hi ha canvis nous d’internacionalització i els kits externs. No s’han atribuït a Codex ni certificats com a integrats amb una lectura parcial. La reversibilitat del nostre treball continua limitada al dictamen i la còpia privada. |
| **T9 · Verificació final** | **Pendent.** Contractes lleugers verds, Frontissa no verda i absència d’un relleu final de Claude. Cap suite global/build pesat en esta passada, per l’ordre expressa del Mestre i els carrils concurrents. |

#### Resultats propis d’esta passada

| Comprovació | Resultat sobre el tall congelat |
| --- | --- |
| Node K1 exportador/proposaCard + plugin/botigues + instal·lador unitari | **83 proves: 81 passades, 0 fallades, 2 omeses** perquè la còpia no porta `.git`; 3,20 s. No ocultar les omissions. |
| Node motor OKF real + nova integració CLI de Xixona | **10 passades, 0 fallades, 0 omissions**, 2,35 s. Dins de les sis de Xixona, una és la reproducció explícita **[DEFECTE]**; no és un criteri d’acceptació satisfet. |
| Balanç Node d’esta activació | **93 comptabilitzades: 91 passades, 2 omeses, 0 fallades**; xifres separades de les 675 inicials i dels 79 casos K1. |
| Design Guard | **2.801 fitxers, 0 crítics, 12 avisos**, exit 0. El kit Gemini no consta integrat al tall: no afirmar zero avisos. |
| Tractor cromàtic | **C1–C6 verds**, 10 contrastos comprovats; no és una certificació WCAG AAA completa. |
| Autoritat / Olivera | **Verds**. Olivera executada en lectura sobre l’arbre viu, sense arxivar ni moure res. |
| Frontissa | **exit 1**, empremtes `descarregues` i `fediversity` pendents; la resta no justifica acceptar estes dues. |
| Tancament documental, `--check` viu | **exit 1, state planned**. Olivera, plantilles, autoritat, ledger, segell, skills, wiki i SCC passen; fallen el pla modificat respecte del rebut inicial, el codi alié fora de l’abast documental, quatre recursos humans posteriors al rebut i la detecció de concurrència. Són discrepàncies del tall compartit, no autoria atribuïda a Codex. Els cinc errors documentals inicials ja no apareixen. |

Comanda principal: `node --test --test-concurrency=1 tests/codex-k1-exporta-open-data.test.mjs tests/codex-k1-proposa-card-okf.test.mjs tests/enxufe-plugin.test.mjs tests/botigues.test.mjs tooling/instalador/inicia-node-germa.test.mjs`. Comanda suplementària: `node --test --test-concurrency=1 tests/codex-passada2-okf.test.mjs tests/inicia-node-germa.test.mjs`. Executades exclusivament dins de `copia/`; cap npm build, Vitest, instal·lació, consulta de dades de producció o publicació.

#### Contrast amb Gemini i matriu D01–D15

Gemini ja ha corregit el slug a `socdepoble`: la discrepància antiga d’este informe queda **resolta**. Coincidim en les rutes, els IDs històrics i TG-04. El seu build verd de les 04:08 és d’un tall anterior i no certifica els canvis de les 06:07.

Les notes D01–D15 de K1 continuen com a valoració datada, sense mitjana ni ascens automàtic. **Se supera l’afirmació històrica de D09 que encara no existia una API OKF**: ara se n’ha provat l’exportació i revisió locals; la nota es reavaluarà amb la UI final, no es transforma en 10/10 per quatre proves de motor. L’exemple `stale_after` s’ha contrastat amb la [norma primària OKF v0.2 §5.5](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md#55-lifecycle-stale_after): demana un instant absolut; no s’ha declarat un defecte basant-se en una data sense fus.

L’argumentari de Gemini requerix revisió abans de l’enviament: **AAA general, node complet en menys de quinze minuts, recuperació íntegra i federació d’emergència operativa no estan demostrats per estes proves**. L’actor `iaia-maria.json` que cita el seu correu no és un dels dos actors generats al tall (`socdepoble`, `la-torre-de-les-macanes`). L’exportador i els formats oberts són evidència defensable; el collector incomplet i la restauració pendent han de continuar explícits. El perfil nou d’allotjament ja separa correctament les mesures locals del build desplegat i admet que no prova la construcció del segon node. Es conserva el nostre esborrany tècnic prudent, pendent de substituir només les afirmacions que el tancament final acredite.

#### Millores Proactives Reversibles Aplicades · passada 2

1. Snapshot diferencial amb hashes i contrast únic de concurrència, evitant recertificar versions canviades; reversió: retirar només els recursos temporals propis després del relleu final.
2. Quatre proves independents lleugeres sobre l’OKF real i execució de la CLI nova en còpia; cap fitxer de proves al viu. Reversió: retirar `tests/codex-passada2-okf.test.mjs` només de la còpia.
3. Reconciliació del seguiment amb T7/T8/T9 i una sola activació restant; el prompt de l’automatització ara conserva la prohibició d’escriptura i el límit de CPU, i ordena cancel·lar-la al final.

**Frontera humana preservada:** cap escriptura pròpia en `src/`, `tooling/`, `tests/` ni `.agents/` vius. No s’ha actualitzat ESTAT/LEDGER ni obert/forçat un torn nou: preval l’ordre expressa de no tocar `.agents/`. Les idees i deutes s’anoten ací per al relleu de MarIA al Llibre Mestre; no es reescriu una matriu compartida durant els nou carrils. El `--check` és de només lectura; no s’ha executat `--verify` ni `--close`.

**Validació del dictamen:** `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261101_0403_auditoria_codex_marato_nocturna.md` retorna **valid: true, errors: []** en la còpia abans de publicar esta ampliació.

**Continuació única:** 08:04 CET, passada 3/3, amb delta des d’este snapshot. Si Claude no ha entregat un tall consolidat, deixar els pendents i tancar igualment el seguiment dins de les 08:15. Cap vigilància intermèdia.

#### Empremtes i logs de la passada 2

Tots els logs i manifests són a `/private/tmp/sdp-marato-261101-gjusef16/passada_2/`: `node-contractes.log`, `node-okf-node-real.log`, `design.log`, `cromatic.log`, `olivera.log`, `frontissa.log`, `tancament-check.log`, `snapshot.json` i `end-cut.json`. El manifest complet evita confondre l’arbre viu amb el tall provat.

```text
b8df667d99aabe39906bc1c2a9c21ff6fc877401ed33bd9646d038a4b8188809  src/config/canalsDeBotiga.js
14b237300484c59b8fbf281412edb5804fb8205a2d7f51e8729691884322afa3  src/sections/text/pageContent.js
62e693c707ac86960af540090c11a9256780cfe197c6876cc6495fb580ba163d  src/data/exportaMunicipiOpenData.js
84960c074dc37fc85bf084a9a44372c9323ac766dc293fe35af9cfab7c87a077  src/sections/notes/memoriaOral.js
ef3cc050347db6025b052ef10a2bb40494e606b7139344c4a84c7218c48b1088  src/sections/notes/NotesSection.jsx
f084c82302323bce62c0dcf172409b7aeac16939d5ddf292f492bc78baaaa380  tests/inicia-node-germa.test.mjs
75c0d6ee250aeacc6d5e817225288918793f2bc33759f18b7ee3306a598d06f8  firebase.json
9a742f5bcb2421b78e092dced2ed942f32374ddece7ba45f0d3f87d8ad03a221  ios/App/App/PrivacyInfo.xcprivacy
```

SHA-256 de l’informe llegit `261101_0407_auditoria_gemini_marato_nocturna.md`: `070caa4ba593b4e733b103d4d07dc2c9cfe6867fb34cd4de0869c9c94de4856a`.

SHA-256 de l’informe llegit `261101_0409_auditoria_claude.md`: `c56d3c231b185c410d3731053e19afa761af94992706438e0ee3dab534e94d75`.

<!-- /SDP:PASSADA_2_261101 -->

### Informe de Gemini aparegut durant el tancament de la passada

A les 04:07 CET s’ha creat `261101_0407_auditoria_gemini_marato_nocturna.md`. S’ha llegit **íntegre**: al tall de lectura és l’esborrany de plantilla, amb model, troballes, verificació i límits encara pendents. No hi ha conclusions tècniques que es puguen contrastar ni consens acreditat. La passada 2 llegirà la versió completada si ha canviat.

### Matriu T1–T8 al tall inicial

| Tasca | Evidència observada i estat de QA |
| --- | --- |
| T1 · WordPress.org | **Pendent d’entrega.** `src/config/canalsDeBotiga.js:28` conserva `wordpress-org` amb `url: null`. No s’ha obert el canal. Les proves actuals continuen acceptant el comportament anterior. |
| T2 · Fediversity | **Pendent de contrast amb l’entrega nova i producció.** Els contractes de contingut i federació passen; això no prova que s’hagen actualitzat les afirmacions del pla ni que estiguen desplegades. No promoure E2EE, inbox o federació bidireccional a «fet» per tindre primitives o JSON estàtic. |
| T3 · Dades obertes i node | **Parcial preexistent.** L’exportador real és `src/data/exportaMunicipiOpenData.js`: ja inclou NewsArticle, Event, CreativeWork, ActivityStreams opcional i verificació SHA-256/BagIt. `recullDadesPubliquesDelMunicipi` declara omissions de notícies, agenda i memòria quan falta una lectura pública adequada; un serialitzador capaç no equival a exportació real completa. El test de l’instal·lador existent és `tooling/instalador/inicia-node-germa.test.mjs`: 6 proves verdes, amb font de joguet. Falta acreditar còpia real, actor/NodeInfo del segon poble, OKF i mètriques mesurades. Preservar els filtres de privacitat. |
| T4 · IDEA-59 / P1-72 | **Criteris nous encara pendents.** `NotesSection.jsx:432–443,530` continua derivant l’entrada nua de la primera carpeta (Mur). `UniversalToolbar.jsx:156–169` conserva H3/H2 com a botons separats. `useUniversalRichText.js` documenta consum de la guia al primer focus; cal demostrar el retorn en blur a zero caràcters, sense tocar text desat. Exigir prova de la card pedagògica per defecte, URL explícita preservada i selector H3/H4/H5/H6/H2. |
| T5 · Multimèdia, xat i readme | **Sense entrega nova acreditada.** Les proves dirigides de workspace, actors i plugin passen. La barra de volums es munta en `GestorMultimediaLocal.jsx:198` dins de `PanellGestorLocal`; no s’ha certificat en navegador la posició a la columna 1 ni HMR, ni mesurat la miniatura servida al xat. No marcar P1-70/P1-71 complets. |
| T6 · Preparació de botigues | **Parcial preexistent.** Hi ha `capacitor.config.json`, manifest `ios/App/App/PrivacyInfo.xcprivacy` amb Tracking=false i UserDefaults/CA92.1 i proves dels scripts de botigues. No hi ha `public/.well-known/assetlinks.json` en el tall inicial. Falta el dossier T6 nou, contracte d’assetlinks i verificació completa de baixa/OAuth/fitxes/captures. Manifest present no acredita aprovació, signatura ni pujada a botiga. |
| T7 · Iniciativa reversible | Millores documentals aïllades descrites baix. Cap fitxer de producte reservat a Claude modificat. |
| T8 · Acceptació i relleu | **Parcial.** 675 proves dirigides verdes i portes indicades en Verificació. Build no certificat; suite global pendent d’entrega consolidada o del tancament. Cap entrada de la matriu passa a FET per esta passada. |

### QN-01 · P2 · Rutes del pla divergents de l’arbre real

**Reproducció:** les comandes literals `node tooling/quality/design_guard.mjs` i `node tooling/quality/wcag_contrast_audit.mjs` fallen amb MODULE_NOT_FOUND. La porta real és `node tooling/gates/design_guard.mjs --arrel=src`. La frontissa real és `node tooling/gates/frontissa-contingut.mjs`; el pla cita `tooling/quality/frontissa_contingut.mjs`. No s’ha trobat el script monolític WCAG citat: les proves de contrast disponibles passen, amb cobertura limitada.

El pla també cita `src/utils/exportaMunicipiOpenData.js`, `src/utils/proposaCard.js`, `src/sections/Notes.jsx` i `_wiki_de_poble/01_sistema/`, que no corresponen a les rutes actives. Les implementacions són en `src/data/`, `src/sections/notes/` i `src/sections/multimedia/`. Proposta per a MarIA/Claude: reconciliar les rutes al pla i situar els documents estables dins de les carpetes vigents, sense crear una carpeta antiga només per satisfer el text. **requires_human_decision: false** per a documentar i corregir referències literals a fitxers existents.

### QN-02 · P2 · Identificadors de T6 ocupats per altres deutes

T6 associa botigues a P0-18/P0-19/P1-13, però el Llibre Mestre reserva estos IDs al pegat legal P3, CSP de mitjans i concurrència/correu de membres. També P0-20 conté text WordPress sota un títol de baixa UGC. Proposta: usar el nom T6 per al dossier de botigues i conservar els IDs vigents; reconciliar cada fila amb evidència, sense donar per resolts els deutes originals. **requires_human_decision: false** per a registrar la discrepància; no s’ha reescrit cap fila.

### Millores Proactives Reversibles Aplicades

1. **Seguiment limitat i sense bucles intermedis:** dues revisions futures, comptador explícit i límit horari. Reversió: pausar l’automatització `marat-fediversity-inspecci-cada-2-hores`.
2. **Traça mínima al Llibre Mestre:** bloc `SDP:QA_MARATO_261101_CODEX` amb enllaç al dictamen, estat i discrepàncies. Reversió: retirar només eixe bloc; cap ID o estat anterior reassignat.
3. **QA aïllada:** còpia temporal de codi per a Vitest/build, sense copiar fitxers .env; dependències ja instal·lades reutilitzades, sense instal·lacions. Reversió: retirar únicament la carpeta temporal pròpia després del relleu. No s’ha tocat cap carpeta de producció humana ni aplicat cap pegat de producte.

<!-- SDP:K1_CODEX_261101 -->
### Taula de Qualificació sobre 10 dels 15 Punts de la Matriu Universal del Sistema (`D01`..`D15`)

**Ampliació K1 sol·licitada pel Mestre; no és la passada 2.** El comptador nocturn continua en **1/3**. Tall de referència reproduïble: còpia de la passada 1, HEAD `a6e4b0d815bd56acbe27337d99da2a8a06d77e47`, contrastada amb lectures del repositori viu durant K1. Claude ja està canviant `canalsDeBotiga.js`, `pageContent.js` i `exportaMunicipiOpenData.js`; esta taula no certifica els seus carrils encara en execució. Les notes són una **valoració d'enginyeria demanada expressament**, no una mesura estadística, una certificació de seguretat ni una probabilitat de concessió.

**Escala comuna:** 0 = absent; 2 = intenció documentada; 4 = prototip parcial; 6 = implementació local amb proves; 8 = integració sòlida amb una part significativa d'evidència operativa; 10 = criteris complets reproduïts independentment, interoperabilitat i recuperació provades, sense pendents materials dins de l'abast. Les dècimes expressen judici ordinal. No es calcula una mitjana: una bona nota visual no compensa una inbox inexistent o una baixa no verificada.

| ID i punt de T7.2 | Nota | Evidència actual inspeccionada | Què falta exactament per al 10/10 |
| --- | --- | --- | --- |
| **D01 · Arquitectura Hexagonal i Port Neutral** | **7.5 / 10** | `src/data/backendPort.js:63–104` valida mètodes i capacitats abans de substituir l'adaptador i evita executar getters; `contracte.js` i `src/data/conformitat/kit.js` fan explícit el contracte. Model B manté la lectura de Sollutia separada del backend propi. | Executar tots els casos de conformitat, amb omissions explícites, contra dos backends independents amb dades equivalents; provar cancel·lació real, límits de peticions, canvi de sessió i reconciliació d'efectes tardans. Demostrar exportació **i restauració**, inclosos fitxers i identitats, sense tocar les vistes. El port neutral facilita migrar; encara no acredita cost zero de migració. |
| **D02 · Pedra Seca i Geometria d'Alta Definició** | **7.5 / 10** | `AppGridShell.jsx/.css` i proves `columnesFixes`, `rail` i `qualitat`; workspaces de Notes i Multimèdia reutilitzen el mateix patró. La regressió dirigida inicial de Multimèdia passa. | Matriu visual registrada a mòbil/escriptori i navegadors objectiu, amb textos llargs, zoom, teclat virtual, diàlegs i llistes carregant; absència de retalls i doble scroll demostrada per mesures i captures. Validar la nova posició dels volums i la toolbar de Notes després de Claude. |
| **D03 · Accessibilitat Universal Rural AAA** | **6.5 / 10** | Design Guard inicial: 0 crítics i **12 avisos**, no zero avisos. Les proves de contrast aporten 25 casos Vitest i 53 Node verds; hi ha `tractor-cromatic.mjs`, `UniversalWorkspace.teclat.test.jsx` i proves de navegació de graelles. | Resoldre o justificar cada avís amb evidència; auditar tots els criteris AAA aplicables, temes i estats dinàmics amb lector de pantalla, focus, reordenació, zoom i teclat. Mesurar els contrastos exigits per la matriu en elements realment renderitzats. Una porta cromàtica verda no certifica tota WCAG. |
| **D04 · Sobirania i Open Data Municipal** | **7.0 / 10** | `src/data/exportaMunicipiOpenData.js` genera JSON-LD/Frictionless i BagIt SHA-256; la bateria inicial passa. K1 afig corrupció de **cada membre** amb CRC refet, truncaments, byteOffset i fallada de digest. | Validar la recollida nova de Claude amb una lectura pública garantida i municipis amb dades reals, sense arreplegar dades de sessió. Completar importador/restauració amb claus estables i mitjans, contrast amb ferramentes externes i prova creuada entre nodes. Fixar confiança del productor per separat de la integritat dels bytes. |
| **D05 · Federació Oberta ActivityPub/NodeInfo/WebFinger** | **4.5 / 10** | `src/data/activitypub.js` declara expressament **fase 1**: descoberta i publicació de documents; el mateix fitxer separa recepció i signatures com a fase 2. Els contractes dirigits passen. | Recepció i entrega server-to-server reals, autenticació/verificació, Follow/Accept/Undo/Delete, idempotència, cues/reintents, paginació i moderació. Provar interoperabilitat amb un servidor extern i dos municipis independents; WebFinger per consulta HTTP real. Una outbox estàtica no equival a federació bidireccional. |
| **D06 · Enxufabilitat Universal** | **8.0 / 10** | Web Component, wrapper WordPress 1.1.10, proves de marcatge/actualitzador/SRI i contractes del plugin dins de les **43 proves Node** inicials. El carril T1 ja està actualitzant el canal oficial. | Instal·lació des del directori verificable en un WordPress net i un amfitrió de segon proveïdor; sessió, idioma, CSP, SRI, navegació i desinstal·lació provats en ambdós. Acreditar la fitxa pública `socdepoble` i l'artefacte exacte amb hash, sense confondre aprovació del slug, paquet local i publicació. |
| **D07 · Replicabilitat de Nodes Germans** | **6.0 / 10** | `inicia-node-germa.mjs` i `flake.nix`; K1 executa la CLI sobre **la release local completa**, comprova el SHA-256 de cada fitxer copiat i la identitat de destí, sense Git ni dependències al node generat. | Construir i servir el node nou, demostrar que actor/NodeInfo/identitat visual i dades corresponen al municipi nou, i validar-los des d'un segon host. Executar Nix amb lock, provisionar backend i mitjans, restaurar un backup i mesurar recursos. La configuració de Sella escrita no prova un node Sella operatiu. |
| **D08 · Privacitat, RLS/RGPD i E2EE** | **6.5 / 10** | Migracions versionades, fluxos de baixa/exportació i mòduls criptogràfics (`xifratXatCripto`, formats, magatzem i protocol). `src/config/xifratXat.js:20` manté **E2EE apagat per defecte**. Les 64 migracions aplicades són evidència declarada per MarIA, no una consulta remota feta en K1. | Revalidació de permisos amb rols reals i concurrència, baixa completa inclòs Storage/tokens i prova de recuperació. Auditoria independent del protocol, claus, grups i dispositius abans d'activar-lo; demostrar que servidor i logs no reben clar. Les primitives existents no permeten afirmar que el xat públic actual ja siga E2EE. |
| **D09 · Bloc de Notes i Mètode Karpathy Local** | **6.0 / 10** | `NotesSection`, `UniversalToolbar`, `useUniversalRichText` i `proposaCard.js` són locals; la regressió inicial passa. El motor determinista estructura contingut sense inferència de pagament. V2 aporta 20 casos lleugers del motor real i de conceptes OKF (immutabilitat, xarxa bloquejada, roundtrip, delimitadors, extensions i UTF-8). La lectura actual del mòdul viu encara no mostra una API OKF; el helper del kit és QA i no es fa passar per exportador de producte. | Cinc criteris d'IDEA-59 complets amb proves d'interacció i navegador; preservar notes existents, URL explícites i canvis de sessió. Generar i rellegir un bundle OKF v0.2 amb índex i metadades coherents, revisió humana i exportació sense serveis remots. «Determinista» no acredita comprensió factual del relat. |
| **D10 · Memòria Oral, Patrimoni i Multimèdia Local** | **7.0 / 10** | `MultimediaSection`, `useGestorArxiusLocals`, FSA/alternativa de selecció i mòduls `MapaFotografic`/EXIF. L'espai de tres columnes té proves dirigides verdes. | Reobertura de permisos, molts fitxers, cancel·lació, canvis de sessió i HMR en navegadors objectiu; trasllat dels volums validat visualment. Provar la cadena àudio original → transcripció → fitxa revisada → exportació/restauració, preservant procedència, drets i política GPS; còpies de preservació i restauració periòdica. |
| **D11 · Comunicació Comunitària i Xat Rural** | **6.5 / 10** | Actors permanents i poble amfitrió amb proves verdes, historial i cua del xat implementats. Les alertes municipals són un objectiu de T3 encara en execució. | Provar reconnectar després de talls, duplicats, ordre, revocació i adversitat de xarxa amb clients reals; grups i adjunts sense efectes tardans aliens. Alertes autoritzades, contrastades i accessibles, amb emissor, caducitat i confirmació d'entrega. No presentar el Mur com a canal garantit d'emergències. |
| **D12 · Multilingüisme Natiu i Traductor Sobirà** | **7.0 / 10** | Diccionaris ca/es/eu/gl/en i motor de traducció amb Apertium/MyMemory; els noms propis tenen tractament explícit a `traductor.js`. | Revisió nativa de tots els fluxos de registre, baixa, errors i botigues, sobretot eu/gl; proves de canvi d'idioma en natiu i encastat. Mesurar límits, timeout i fallada dels serveis i demostrar Apertium propi. MyMemory és un servei de tercers: «sense Google» no equival a «sense xarxa ni dependències». |
| **D13 · Botigues Mòbils i PWA** | **5.5 / 10** | Capacitor, manifest de privacitat d'iOS, scripts de botigues i PWA; els contractes locals de botigues passen. K1 aporta un gate que rebutja associacions absents o amb identitats/pins incorrectes. | Certificat de **Play App Signing** i prefix Apple reals, associacions servides amb HTTPS/200/JSON, entitlements i obertura en dispositiu. Binaris signats del commit, OAuth/baixa verificats, fitxes/captures i revisió de botiga. Fixtures verdes o un TestFlight anterior no acrediten presència pública actual en ambdues botigues. |
| **D14 · Governança, Telemetria Honesta i Consola** | **7.0 / 10** | Portes/Reflex, registre documental i Consola. `telemetria.js:36,96,189–211` distingix intent i recepció, respecta DNT/GPC i condiciona l'encastament. La passada inicial exposa els errors del tancament. | Cadena completa de rebuts vigents, versions i desplegament sobre un tall net; recepció real de telemetria comprovada sense doble recompte ni dades privades. Estat públic associat a una font verificable i degradació honesta si manca Git/servidor. Les sumes d'un rebut no substituïxen autorització ni evidència operativa. |
| **D15 · Rendiment, Lleugeresa i Resiliència Rural** | **6.0 / 10** | Càrrega modular, actius optimitzats i scripts de prerender/social. Hi ha 675 proves dirigides de la passada 1 i 79 casos Node nous de K1 verificats en execucions separades (59 + 20); les 26.900+ globals corresponen a altres talls declarats, no a una execució K1. | Build propi complet sobre el commit final, pressupost de bytes definit (HTML/JS/actius i brut/gzip distingits), comprovació de les 34 rutes i del llindar de 300 KB que fixa la matriu. LCP/INP/CLS i consum de memòria mesurats en mòbil modest i xarxa rural; proves de càrrega, tall d'host i restauració amb RPO/RTO publicats. Nombre de tests i compressió no substituïxen estes mesures. |

### Visió d'Enginyeria · Sistema 100% Indestructible i Argumentari Tècnic Irrefutable per a NLnet Fediversity (`2026-08-1a6`)

#### L'objectiu defensable: continuïtat recuperable i independència de proveïdor

**Cap sistema digital és literalment 100% indestructible.** Es poden perdre totes les còpies, claus, energia o mantenidors. L'objectiu d'enginyeria és que una comunitat puga **verificar, copiar, restaurar i continuar** el servei sense permís d'un proveïdor concret, amb un límit conegut de pèrdua de dades i temps de recuperació. Esta afirmació és més forta davant una revisió tècnica que prometre immortalitat.

El punt fort actual és la separació entre **interfície**, **port de dades** i **representacions obertes**. El Web Component pot continuar allotjat per WordPress/Sollutia mentre les dades passen, mitjançant un adaptador conforme, a infraestructura decidida per Sóc de Poble. No cal confondre esta frontera amb un segon backend que ja estiga validat: hui la font autoritativa continua sent Supabase i el canvi exigix ADR, adaptador i proves.

#### Autoclonació des d'HTML/ZIP i funcionament sense núvol privatiu

Una pàgina HTML visible permet descobrir la versió, l'origen i un enllaç al paquet de recuperació; **no conté per si sola** codi font complet, dependències, base de dades, mitjans, secrets, DNS o claus de les persones. L'autoclonació viable requerix una release exportable amb codi i llicència, lock de dependències/Nix, esquema i migracions, dades/mitjans amb drets, configuració pública i instruccions de restauració. Les claus privades i sessions no s'han de publicar dins de l'HTML o ZIP públic.

La ruta futura és: descarregar un paquet identificat per hash i procedència verificable; verificar-lo abans d'executar res; construir el frontal en un host local; provisionar el backend propi; importar les dades i els mitjans; i executar conformitat i una prova funcional. K1 només acredita la fase de còpia íntegra de la release per a un segon poble. El flake actual és principalment frontal/Nginx: no es presenta com un centre de dades autoallotjat complet.

**Zero consum d'IA al núvol** per a estructurar una nota és compatible amb el motor local actual. **Zero dependència de núvol privatiu** per a tot el servei exigix, a més, backend, identitat, correu, emmagatzematge, temps real i traducció operatius en infraestructura pròpia, amb pressupost i manteniment. «Online-first amb backend propi» i «tolerant a talls temporals» són objectius compatibles; l'existència d'una PWA no transforma automàticament tot el producte en offline-first.

#### Federació inter-pobles i continuïtat durant una incidència

La descoberta NodeInfo/WebFinger i l'outbox actual són una base d'interoperabilitat. El pas següent és entrega ActivityPub entre nodes realment independents: recepció, autoria verificable, cues persistents, reintents amb límit, idempotència, actualitzacions/esborrats i moderació. La distinció entre lectura d'una outbox i entrega entre inboxes està definida en la [recomanació ActivityPub del W3C](https://www.w3.org/TR/activitypub/).

Una xarxa de pobles podria conservar rèpliques públiques de bàndols i recuperar-les si un servidor cau. Cada avís necessitaria identificador estable, municipi emissor, autoritat, data, caducitat, versió i retractació. Caldria provar explícitament que un node no pot fer-se passar per un altre i que la reconnexió no publica avisos caducats o duplicats. La federació per Internet no crea comunicació si tota la infraestructura de xarxa ha caigut; els canals locals o transports alternatius serien un projecte addicional. Tampoc substituïx els serveis oficials d'emergència.

#### Integritat BagIt/SHA-256, privacitat E2EE i coneixement OKF

**BagIt/SHA-256** aporta detecció de corrupció i comprovació del conjunt exportat. K1 comprova el rebuig de corrupció en cada membre fins i tot refent el CRC del ZIP. Però un productor pot construir una altra bossa coherent amb altres dades i nous hashes: K1 també ho comprova. Per autenticar el productor cal un ancoratge de confiança, per exemple signatura del manifest i gestió de claus/revocacions, fora de la bossa mateixa. La [RFC 8493](https://www.rfc-editor.org/rfc/rfc8493) separa expressament fixitat de protecció davant modificació activa.

**E2EE** té una funció distinta: impedir que el servidor llija missatges privats. Les primitives P-256/HKDF/AES-GCM i el protocol implementat són una base que necessita revisió independent, verificació d'identitat, recuperació, rotació, gestió de grups i activació controlada. En el tall de referència la bandera per defecte continua apagada. Un hash, SRI o una bossa BagIt no xifren una conversa, i E2EE tampoc protegix un dispositiu ja compromés.

**OKF v0.2** pot conservar la memòria oral en Markdown amb metadades de font, generació, verificació i vigència que persones i ferramentes diverses puguen llegir. El motor local pot proposar títol/resum/etiquetes i una fitxa; la persona revisa el relat i decidix la publicació. La font de Google Cloud manté `type` com a camp sempre requerit i les noves metadades com a opcionals: no s'ha d'inventar una conformitat incompatible ni confondre `verified` amb prova de veracitat. [OKF v0.2, Google Cloud](https://cloud.google.com/blog/products/data-analytics/okf-v0-2-adds-trust-signals/).

La combinació útil és **formats llegibles + fixitat + autenticitat + permisos/xifrat quan pertoque + còpies independents + restauracions assajades**. Per a memòria oral cal conservar també àudio original, context, atribució, drets i versions revisades; un resum generat no substituïx la veu original. Els objectius de recuperació s'han de fixar i mesurar, no presentar-los com a resultats ja assolits.

#### Argumentari alineat amb l'expedient existent

Fediversity situa la portabilitat, la llibertat de les persones i l'allotjament reproduïble amb NixOS al centre del programa. La pàgina oficial indica que la convocatòria final va tancar l'1 d'agost de 2026: el correu ha de ser **seguiment de l'expedient existent `2026-08-1a6`**, sense presentar-lo com una sol·licitud nova dins d'una convocatòria encara oberta. [NLnet · NGI Fediversity](https://nlnet.nl/fediversity/).

El millor argument no és «ho tenim tot fet». És que hi ha **una aplicació rural utilitzable i una frontera tècnica concreta que el finançament pot completar de manera reutilitzable**. Propose defensar tres lliurables verificables: exportació/restauració entre hosts sense canviar el frontal; federació efectiva entre municipis amb proves d'interoperabilitat; i desplegament/recuperació reproduïbles del servei complet, amb accessibilitat i privacitat auditades. No es reassigna ací el pressupost aprovat ni s'inventen compromisos amb els avaluadors.

**Text en anglés preparat per a la rèplica tècnica; no enviat:**

**Subject: Application 2026-08-1a6 — verifiable portability and federation milestones for Sóc de Poble**

Dear Fediversity team,

We are following up on our existing application, 2026-08-1a6, with a more precise account of what is implemented and what the proposed work would deliver.

Sóc de Poble is a community application for rural municipalities. Its frontend is separated from the authoritative data backend by an explicit contract and capability checks. The same interface is packaged as a Web Component and a WordPress integration. This separation is the basis for provider portability; we do not present it as proof that every alternative backend is already interchangeable.

Our municipal export implementation produces open JSON-LD resources and a Frictionless Data Package inside a reproducible BagIt archive with SHA-256 manifests. Independent supplementary tests now exercise corruption of every archive member, truncated input, cryptographic-provider failure and exact-byte copying of a full local release into a second municipality's installation directory. These tests are local and reproducible; they do not claim that a new backend has already been provisioned or restored.

Federation discovery and public ActivityStreams documents are implemented as a first phase. Full server-to-server delivery, independent-node interoperability, durable retries and moderation remain explicit milestones. Similarly, the chat cryptographic implementation is kept behind a disabled default flag pending verification; we are not claiming that current private conversations already have end-to-end encryption enabled.

The proposed contribution to Fediversity is therefore concrete: demonstrate municipal data export and restoration across independently operated hosts; complete and test federation between municipalities; and make deployment and recovery of the complete service reproducible. Each milestone can be accepted through published source, pinned artifacts, test logs and a demonstration that starts from a clean host. Rural accessibility and multilingual use are acceptance criteria for those demonstrations, rather than claims inferred from an automated contrast check alone.

Our engineering objective is recoverability and independence from a particular provider. We distinguish archive integrity from producer authenticity, local processing from complete cloud independence, and protocol discovery from operational federation. This makes the remaining work measurable and the resulting building blocks reusable by other communities.

The public technical overview is https://socdepoble.org/page/fediversity. The WordPress directory reference for independent verification is https://wordpress.org/plugins/socdepoble/. We can provide the corresponding source snapshot and reproducible verification instructions alongside the milestone demonstrations.

Thank you for reviewing this technical clarification for application 2026-08-1a6.

The Sóc de Poble project

**Comprovació abans d'enviar:** fixar el commit final i els enllaços als logs/artefactes públics que es vulguen adjuntar; verificar per HTTP els enllaços del correu. No adjuntar el Llibre Mestre privat, secrets, dades de persones o kits interns sense seleccionar i revisar-ne el contingut. El text anterior evita atribuir al desplegament actual els resultats que només s'han provat en còpia. Cap argument tècnic pot garantir la decisió de finançament.

### Kit K1 executable pre-verificat · entrega v2 i fronteres

**Encàrrec encadenat del Mestre, sense incrementar la passada 1/3.** S’han rellegit les línies **180–235** del prompt vigent i **sencera** l’Acta Marmota `261101_0334`. Les dues seccions D01–D15 i visió/argumentari s’amplien en el seu lloc, sense duplicar taules ni convertir les afirmacions històriques de l’Acta en una certificació nova. El prompt vigent corregix rutes/IDs i situa la verificació global en **T9**; alguns textos antics de l’Acta conserven rutes i IDs anteriors i es tracten com a historial.

**Directori extern:** `../_investigacio_ia_de_poble/261101_kits_marato_nocturna/codex/`. Estructura exacta lliurada:

```text
codex/
  fitxers/tests/codex-k1-exporta-open-data.test.mjs
  fitxers/tests/codex-k1-inicia-node-germa.test.mjs
  fitxers/tests/codex-k1-associacions.test.mjs
  fitxers/tests/codex-k1-proposa-card-okf.test.mjs
  fitxers/tests/helpers/codex_k1_associacions.py
  fitxers/tests/helpers/codex_k1_okf.mjs
  pegats/01_sanejament_tancament_documental.patch
  pegats/02_tests_frontera_fediversity_i_botigues.patch
  MANIFEST.json
  SHA256SUMS
  verifica_i_aplica.py
  README_INTEGRACIO.md
  test_verificador.py
  baseline/
  evidence/
```

**Pegat 01:** lleva únicament `category`, `created_on`, `updated_on` del frontmatter conegut del Llibre i reapunta les dues referències de l’acta 0142 a `../90_arxiu_historic/`. MarIA ja havia llevat els camps i retirat les àncores trencades al viu: el verificador reconeix els camps absents i pot restaurar les dues referències cap als fitxers arxivats, sense reescriure el cos. No s’ha aplicat al viu.

**Pegat 02:** incorpora sis fitxers suplementaris de nom exclusiu; no modifica implementacions T1..T6 ni el manifest de suites. Manté les proves d’Open Data, instal·lador real i associacions de v1, i afig `proposaCard` real més el sòl de conceptes OKF v0.2. Estes proves passen **20/20** en un únic procés Node (1,12 s al tall registrat), amb entrada congelada, fetch bloquejat, proposta idempotent, delimitadors/cometes, HTML inert, fallback sense DOMParser, camps opcionals/tipus desconeguts, duplicats, metadades no inventades, bytes UTF-8 i gate separat de fitxer exportat. El pressupost d’1 MiB és una política local de QA, no una obligació d’OKF.

El helper OKF seguix la [SPEC v0.2 oficial](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md): `type` no buit és l’únic camp sempre obligatori i les extensions s’han de tolerar. No imposa l’esquema intern estricte de la Wiki al format d’intercanvi. Les fixtures YAML/Markdown no certifiquen un exportador de producte ni la veracitat de la memòria oral. El gate real s’executa sobre un concepte que haja produït l’exportador de Claude i falla si el fitxer no existix. El motor d’estructuració conserva part de l’HTML original: no és un sanejador d’HTML per a publicar-lo sense el renderitzador adequat.

**Comprovacions d’esta ampliació:** 20 proves Node noves passades, 0 fallades/omissions; 8 autoproves Python de l’aplicador v2 passades; 2/2 pegats exactes amb `git apply --check`, aplicació i comprovació inversa verdes en una arrel efímera. Les 59 proves Node i els tres mutants controlats de v1 es conserven com a evidència anterior i no s’han repetit mentre Claude treballa amb nou carrils. Total acumulat: **79 casos Node nous**, executats per blocs. La suite combinada v2 queda per a la integració quan s’alliberen recursos; no s’afirma que s’haja executat ara. El verificador traslladat passa el mode sense escriptures.

**Respecte de CPU/RAM:** en este encàrrec no s’ha executat `npm run build`, cap Vitest ni una altra còpia completa de la release. S’ha reutilitzat la còpia autoritzada i les proves anteriors. Els processos nous són un Node de proves focalitzades i comprovacions curtes de l’aplicador/pegats. Es mantenen les revisions de les **06:04 i 08:04 CET**, amb el comptador en **1/3** i el tall absolut de les 08:15. Si els carrils continuen actius, la següent passada preservarà també la restricció de recursos fins a disposar d’una entrega consolidada.

**Reversibilitat:** `verifica_i_aplica.py` verifica per defecte i no escriu. `--apply` prevalida totes les operacions, rebutja col·lisions i guarda backups amb un rebut fora del repositori; `--rollback` comprova els hashes i refusa sobreescriure una edició posterior. L’allowlist de v2 és de **huit rutes**: dos documents i sis fitxers de proves/helpers. No inclou `src/`, `tooling/`, `.agents/`, codi natiu ni `public/.well-known/` de Claude. La v1 publicada s’ha preservat a `/private/tmp/sdp-marato-261101-gjusef16/kit_publicat_v1/` abans de substituir només els artefactes propis del kit.

**Associacions reals:** les fixtures d’assetlinks/AASA són explícitament de prova. El gate separat necessita pins de Play App Signing i App ID Apple acreditats; no certifica HTTP, entitlements, dispositius o publicació en botiga. Les fonts primàries consultades són [Android](https://developer.android.com/training/app-links/configure-assetlinks) i [Apple](https://developer.apple.com/documentation/xcode/supporting-associated-domains).

**Frontera d’escriptura viva:** només s’amplia este dictamen. No s’ha escrit cap fitxer viu de `src/`, `tooling/`, `tests/` o `.agents/`, ni s’ha obert un torn nou que altere runtime/ESTAT/LEDGER. La traça d’esta ampliació queda ací i al kit per ordre expressa del Mestre.

**Contrast amb Gemini:** la versió completada de l’informe 0407 coincidix amb les discrepàncies de rutes i pendents de la línia base i declara un build complet verd que no es transforma en prova pròpia. TG-02/T1 proposa `wordpress.org/plugins/soc-de-poble-mur/`, mentre el prompt fixa `wordpress.org/plugins/socdepoble/`: es conserva este últim llevat d’una instrucció humana nova amb evidència.

**Millores Proactives Reversibles Aplicades:** kit extern v2, proves de frontera i reconciliació documental preparades per integrar; validadors sense xarxa i gates que diferencien fixture i producte; taula/argumentari actualitzats en este informe. Reversió del kit aplicat: rebut de `--rollback`; de l’ampliació documental: retirar este bloc K1 delimitat o restaurar la versió anterior conservada en la còpia, sense tocar la passada 1.

**Entrega materialitzada:** 29 fitxers, `MANIFEST.json` v2 i sumes comprovatòries. SHA-256 de `SHA256SUMS`: `ff46dd7c96f8bf677cb1cecae7d8ba980ecc282cffbd7298a704187bc06fa6ca`. La integritat del kit és fixitat, no una signatura d’autoria. L’ampliació es valida amb `node tooling/wiki/document.mjs check` en la còpia abans de l’única escriptura del dictamen al viu.

<!-- /SDP:K1_CODEX_261101 -->

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Resultats reproduïbles de la passada inicial

| Comprovació | Resultat |
| --- | --- |
| Vitest dirigit T1–T5 i federació | **20 fitxers / 554 proves passades**, 0 fallades; 10,72 s. |
| Vitest de contrast (controls blaus, verd de marca i taules) | **3 fitxers / 25 passades**, 0 fallades. |
| Node: plugin, scripts de botigues i instal·lador | **43 passades**, 0 fallades ni omissions; executades a l’arbre real per incloure els contractes de Git. |
| Node: contrast d’accions i calendari mes/setmana | **53 passades**, 0 fallades ni omissions. |
| Porta d’autoritat | **valid: true**, errors buits. |
| Porta Olivera inicial | **exit 0**, Safata buida, documents vius ancorats; cap moviment. |
| Design Guard, ruta real | **exit 0**, 2.766 fitxers, 0 crítics i **12 avisos** de base. |
| Frontissa de contingut, ruta real | **16/16** claus amb empremta aprovada. |
| Scripts quality/ literals del pla | **exit 1**, fitxers inexistents; no són un resultat verd de qualitat. |
| `npm run build` en còpia sense .env | **No certificat.** Intent CI inicial: clau mock no admesa pel validador. Intent amb configuració pública fictícia: build web aturat perquè falta VITE_TENANT_ID UUID. S’aplica el Fusible i no s’encadena un tercer intent en esta passada. No s’ha demostrat un defecte del build de producció. |
| Suite Vitest global | No repetida ara: encara no hi ha entrega nova de codi i el relleu de Claude ja declara la seua execució anterior. Eixa declaració és d’un altre tall, no una prova nostra. Executar-la quan hi haja entrega consolidada o al tancament si cal. |
| HTTP viu WordPress/NodeInfo | La ferramenta web no ha pogut obrir les tres URL; **no verificat**, no inferit com a servei caigut. |

Reproducció Vitest: `vitest run` sobre `canalsDeBotiga`, `systemPages`, `InstalaLaPwa`, `pageContent.fediversity`, `paginaDeText`, `App.fediversity`, `exportaMunicipiOpenData`, `activitypub`, `proposaCard`, `NotesSection.url`, `NotesSection.p4`, `NotesEditor`, `llavorNota.tiptap`, `llavorNota.adversari`, `useUniversalRichText.llavorDesada`, `MultimediaSection.espai`, `MultimediaSection`, `actorsDelXat`, `pobleAmfitrio` i `iaiaLocal.atles`; els noms complets consten a la comanda guardada al xat i als logs.

Logs locals d’esta passada: `/private/tmp/sdp-marato-261101-gjusef16/` (`vitest-dirigida.log`, `node-contractes.log`, `contrast-vitest.log`, `contrast-node.log`, `design-real.log`, `frontissa.log`, `build.log`, `build-qa.log`). La còpia temporal és `copia/`; no té .git ni les credencials de l’arbre viu. La manca de .git també apareix com a `git-absent` a la instantània de la Consola. Els dos intents de build fallen abans d’un resultat complet i no es presenten com a prova de desplegament.

### Punt de continuació per a les passades 2 i 3

Comparar HEAD, diff i hashes amb el tall inicial; llegir íntegres només les entregues/documentació noves o canviades. No rellegir l’arxiu històric. Si no hi ha canvis rellevants, registrar la passada sense repetir proves globals. Si hi ha entrega, provar els criteris nous i contrastar Gemini amb evidència pròpia. Per a un build aïllat, preparar abans totes les variables no secretes requerides (mode seed i tenant UUID o una instantània local pública); no encadenar intents incomplets ni accedir al backend real amb configuració de QA. En l’última passada, emetre relleu final amb pendents i pausar la vigilància encara que queden tasques obertes.


### Hashes SHA-256 del codi inspeccionat

```text
34214f1fa4b7f9a450a9aefac5d20e5ad7fbbd19c3266bc32b3c2e970afbd976  src/config/canalsDeBotiga.js
4b630029222e0c9e2babf6b18c3c8eb970b770fe880f4e09e816e9af6c67c781  src/sections/text/pageContent.js
8b321aa26c0e85757d427a82f455042911e190b00eda7539d1dccf04b0f5d31f  src/data/exportaMunicipiOpenData.js
0ae5b2681f91e2da0a95c44290dc9d2dbc0341a2eaf535b9d96426d1d1b8627d  src/sections/notes/proposaCard.js
7e3cb671feca4a6a325867b479b4d9de0e5c307cc0ab0660cf314c4eaf75657f  src/sections/notes/NotesSection.jsx
4fb7cc06d497d25886163a9e060dee66f8d35829e39f3b1bc707ca73ee55f2dd  src/sections/notes/NotesEditor.jsx
2b455420964a32efb5b27e28ca4e4b4e833b2bb5177cbe29ef424a875ad0d668  src/components/universal/richText/useUniversalRichText.js
e05f11fd16c0999a6fca45a8215751f3ff258956714f9d606c0c671a2961a40e  src/sections/multimedia/MultimediaSection.jsx
b8c2e33a1637175908f4347df8a8da45eb147f4d529db54ebeeb56d836d51e47  src/sections/xat/actorsDelXat.js
d203ae1f92541a1b05040d1f6139755f0b13fba44f05378e927211817349e606  tooling/instalador/inicia-node-germa.mjs
bf57c9241323d949add3b8a569ed25362f66ac73f5071a91524e7a955ac2b498  wordpress-plugin/readme.txt
45c0defb376214485eb4803244fcbff7e4713612b071f7b4f0c6134b98008426  ios/App/App/PrivacyInfo.xcprivacy
9bfa89a2527bee2f70fda803f6ca648996b42b0bb5b9958c605350b3261ae996  capacitor.config.json
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

S’han llegit íntegres els tres documents requerits (pla, prompt i Llibre Mestre abans de l’anotació pròpia), AGENTS.md i les plantilles/skills aplicades. La inspecció de codi és dirigida; no és una auditoria de cada fitxer del projecte. S’han consultat l’ESTAT actual i els contractes necessaris. L’esborrany de Gemini aparegut a les 04:07 s’ha llegit íntegre, però encara sense conclusions; no hi ha entrega nova de Claude ni revisió creuada completa acreditada.

No s’ha comprovat visualment el navegador, l’HMR, la baixa en servidor real, les credencials OAuth, Nix, els binaris signats, la cobertura WCAG completa ni cap canvi en producció. Cap dada remota modificada, correu enviat, SQL aplicat, botiga publicada o codi de Claude editat. Els errors d’entorn i les omissions continuen visibles.

### Tancament documental

`document.mjs check` retorna **valid: true, errors: []** per a este informe. Olivera després de crear-lo retorna **exit 0**. Els 13 hashes de codi del punt de control i HEAD continuen idèntics al final de les proves.

Primer `tancament.mjs --check`: **exit 1, state planned**. Falta de relleu al LEDGER corregida en esta passada amb entrada pròpia i signatura. També detecta cinc deutes anteriors: frontmatter del Llibre Mestre amb `category`, `created_on` i `updated_on` fora de l’esquema, i dos enllaços del document `_wiki_de_poble/10_actes/261031_0142_acta_tancament_seo_consola_telemetria_i_full_de_ruta_fediversity.md` als pla/prompt 261031_0136 moguts a l’arxiu. No s’han reescrit metadades ni acta aliena per forçar un verd global. Comprovació final amb `--close`: **valid: false, state planned, exit 1**. Errors restants: _wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md: frontmatter: propietat desconeguda category; _wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md: frontmatter: propietat desconeguda created_on; _wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md: frontmatter: propietat desconeguda updated_on; LINK_INVALID: Enllaç inexistent: 261031_0136_pla_implementacio_assalt_fediversity_deploy_i_botigues.md _wiki_de_poble/10_actes/261031_0142_acta_tancament_seo_consola_telemetria_i_full_de_ruta_fediversity.md; LINK_INVALID: Enllaç inexistent: 261031_0136_prompt_dissabte_fediversity_deploy_i_botigues.md _wiki_de_poble/10_actes/261031_0142_acta_tancament_seo_consola_telemetria_i_full_de_ruta_fediversity.md. El torn documental no ha quedat tancat mecànicament; queda rellevat amb esta evidència per a reconciliar els deutes compartits. La inspecció 1 ha acabat i només continuen les dues activacions autoritzades.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_0311_pla_implementacio_marato_nocturna_fediversity_notes_i_llibre_mestre]]
- [[261101_0311_prompt_marato_nocturna_fediversity_notes_i_llibre_mestre]]
