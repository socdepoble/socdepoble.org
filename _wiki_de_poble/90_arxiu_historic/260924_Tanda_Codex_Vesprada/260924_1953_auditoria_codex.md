---
type: informe
status: esborrany
description: Reconciliació revisada del segell, instal·lació de la porta i retirada del destil·lador obsolet del Brain.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_168ee747-2bf8-460c-8daa-629508c2b5c6:83729fa3-ea0d-4af0-87a8-35e9144647cd
---
# Auditoria del segell, plantilla viva i Brain

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260924-1953 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24 19:53 Europe/Madrid |
| Modificació | 2026-09-24 20:06 Europe/Madrid |
| Propietari | Codex |
| Aprovació humana | Execució autoritzada després de l’auditoria tècnica, resposta explícita en este xat. |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats reals: no disponibles. Estimats: no calculats; no es declara una xifra inventada. |
| Tall d’evidència | 80d4d9d85e722594bc96a5849059dac364d8c1f0 i arbre de treball de 2026-09-24 19:53–19:56 |
| requires_human_decision | false |

## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-24: auditoria tècnica completada abans de canviar codi. El Mestre resol el conflicte amb AFK i autoritza executar. El torn documental inicial `torn_95dcfd02-552d-493a-91ea-3a49f9f6a28f` queda substituït pel torn de codi torn_168ee747-2bf8-460c-8daa-629508c2b5c6.

## Troballes

### Segell i porta (P1)

El segell divergent és real. Anterior: `15094d99b83471b471c966eb948f2198b7902a5b1df60f6f59ba45d4d2dd7014`; actual: `a3953a1be9811779814b4e6e5d70b4006d2d97ab0eaf8f1d4ebb638daee97273`. La transacció `edcc16df-47c4-47a4-aa57-a88cdcc7f5be` està accepted i concorda amb l’anterior. Hi ha tres modificacions (índex, estratègia IA, taxonomia estricta) i una alta (editor universal). Revisats continguts i hashes; els originals segellats d’índex i estratègia es troben en Git, el de taxonomia no s’ha localitzat en les revisions del fitxer. No es declara reconstruït eixe diff. El catàleg actual de 22 skills passa. `.DS_Store` queda explícitament fora del segell.

La ruta executable és `tooling/gates/segella.mjs`, i el script npm és `porta:segella`. El prompt cita dues variants inexistents. El hook i Husky encara no invoquen la porta viva. Els pedaços del laboratori s’apliquen nets; cal incloure la correcció de `--staged` de la prova d’instal·lació, que llig el blob de Git. La reproducció índex mutilat/disc correcte falla amb el pedaç complet i passa erròniament sense eixa correcció.

### Brain: inventari real i decisió fitxer a fitxer

El commit 80d4d9d8 ja retirà 16 fonts/configuracions/proves i un pyc; no atribuir eixes baixes a este torn. Ara hi ha 20 scripts, sense duplicats exactes per SHA-256.

| Script de tooling/brain | Evidència / decisió |
| --- | --- |
| ancora.mjs | Restauració i tooling/scripts/ancora.mjs; conservar. |
| brain_distill.py | Migrador obsolet amb bug reproduït: torna a moure l’arxiu canònic dins de legacy_pre_canonical cada vegada. Retirar amb hash i lease, també brain:distill. |
| build_skills_index.mjs | persona_router i skills:index; conservar. |
| cataleg_skills.mjs | hooks, tancament i compiladors; conservar. |
| cens_cromatic.mjs | Orfe de cridades però CLI funcional: 57 colors/227 ocurrències al tall. No és duplicat de design_guard; conservar i exposar com brain:cens. Cap migració de colors autoritzada. |
| consolidar_baselines.mjs | deute:revisa; conservar. |
| context-local.mjs | hooks de sessió; conservar. |
| context_documental.mjs | preflight i matrix; conservar. |
| crear_bundle.mjs | AGENTS §6 i farcell; conservar per a IAs externes. |
| desenterrar.mjs | Restauració amb lease; conservar. |
| despertar.mjs | npm i hooks de sessió; conservar. |
| farcell.mjs | Validació de crear_bundle; conservar. |
| mapa-consola.mjs | Vite i Consola; conservar. |
| matrix.mjs | npm i portes; conservar. |
| quarantena_espills.mjs | Eina de manteniment amb proves; conservar. No executar --aplica en esta tanda. |
| somiador.mjs | Té proves i permís local; conservar. Deute: mutació externa i sense claim, no usar-lo per a higiene nova. |
| termometre_context.mjs | preflight_matrix_wrapper; conservar. |
| time-machine.mjs | cron, frontissa i tanca; conservar. |
| tracker_consum.mjs | core-estrategia-ia ho invoca; conservar. |
| tractor-pedra-seca.mjs | run-portes i disseny; conservar. |

`package.json` manté brain:maintain → maintain.sh, esborrat en HEAD. Cal llevar l’entrada. El detector d’orfes confon mencions en tests, comentaris i llistes de permisos amb execució: el seu verd és només una cerca de referències, no una prova de necessitat. En esta auditoria s’ha contrastat cada família de consumidors.

### Higiene cognitiva (P1/P2)

La porta actual només caduca per dia, no per sessió; dos torns del mateix dia poden acumular-se. L’índex té tres enllaços trencats als documents 1850/1855 ja arxivats, una acta amb caixa incorrecta i falten les àncores dels documents 1910. Es repararan les àncores sense tocar producció ni recerca.

Proposta concreta: abans de generar una petorreta, comprovar inventari i rebuts; cada document anterior ha de constar com actiu (torn/motiu de retenció) o acabat. Només els acabats entren en un manifest d’arxivament amb origen, destí, hash i índex. Executar amb lease, prevalidar totes les col·lisions, registrar handoff i actualitzar índex en la mateixa transacció; després verificar orfandat i permetre el prompt. La mera antiguitat o hora no prova que un document haja acabat. Excloure sempre 01_produccio i 02_investigacio_ia. No activar el vigilant amb quarantena automàtica: pot retirar un document incomplet en plena edició i deixar l’àncora trencada. La proposta v2 del laboratori basada només en hora no s’instal·la cegament.

### Millora de la plantilla

Declarar un mode explícit auditoria/execució i l’autorització que preval sobre AFK; comprovar rutes reals i enum de tags; model i tokens són evidència del motor, no dades assignades per MarIA. Substituir les caselles autoafirmades per resultats verificables. El prompt 1910 i el pla no tenien rebut vàlid i el Context estava retallat: es regularitzaran amb rebut nou, sense afirmar que existia a les 19:10.

### Execució efectuada

- Segell reconciliat amb comparació explícita dels dos hashes; transacció `184e706b-fec9-4302-bfaa-f7c401fe4dad`.
- Porta instal·lada als tres targets previstos; lease `f0000a1d-4c50-4b65-a327-60ed6a859935`, transacció `0e9d9091-0481-479b-99c1-f6920d49284d`, claim completat i lease consumida. Git usa `.husky/_`. No s’ha activat el vigilant launchd.
- `package.json`: retirades brain:maintain i brain:distill, afegida brain:cens. Lease `e6a2ffde-767d-4fb0-9d9e-566918bfa57c`, transacció `06994f0f-13b0-486b-a79b-7d69fd3a7f14`, consumida. Dependències i lockfile sense canvis.
- Únic script esborrat en este torn: `tooling/brain/brain_distill.py` (365 línies). SHA-256 previ `66551d16361419fe91ccb13ab896b680615c9884ac5d451c60f9f818f495470d`, idèntic a HEAD. Lease `4bea5e89-1c6e-4df5-ad54-79a50e67f083`, operació brain-retire, claim completat i consumit. L’executor de substitucions no admet baixes: la retirada explícita ha usat les funcions reals de claim/complete del Reflex, CAS i còpia amb fsync abans d’unlink. Recuperació durable disponible a `80d4d9d8:tooling/brain/brain_distill.py`; còpia temporal addicional a `/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-brain-retired-qJPa8P/brain_distill.py`.
- Regularitzats prompt i pla 1910 amb rebuts nous; restaurat Context íntegre i registrat el canvi posterior d’autorització. Reapuntades les tres àncores 1850/1855, corregida la caixa de l’acta 1445 i ancorats acta 1900/full de ruta. No s’han tornat a moure documents ja arxivats.
- Higiene futura: proposta concreta anterior entregada; no s’ha implantat un arxivador automàtic per sessió.


## Verificació

| Comprovació | Resultat |
| --- | --- |
| Segell de skills | Verd, a3953a1b, 23 fitxers Markdown. |
| Plantilla viva + hooks + instal·lació | 19 passen, 2 omeses. Bloca candidats incorrectes i índex mutilat encara que el disc siga correcte. |
| Cens amb SDP_PORTA_ORFES=1 | 19 scripts, zero orfes; passa. |
| ESLint dels dos mòduls modificats | Zero errors i avisos. |
| Catàleg de skills | 22 skills, zero problemes. |
| npm run porta:orfandat | Zero enllaços trencats i zero orfes en el graf que comprova esta porta. |
| Porta Olivera i porta de plantilla --escriptori | Verdes; tres documents de treball, dos prompts/plans conformes. |
| document.mjs check | Auditoria, pla i prompt vàlids. |
| Vitest --maxWorkers=2 | 57 fitxers, 359 proves passen. |
| Selecció Node de 11 fitxers | 138 proves: 135 passen, 1 falla, 2 omeses. |
| Proves del tancament | 109 proves: 108 passen, 1 falla prèvia de fixture Husky. |

Fallada Node coneguda abans d’editar: `tests/backend_consolidacio.test.mjs:168`, `ReferenceError: CLAU_USUARI is not defined` al doble de runtime. No s’ha modificat runtime ni la prova.

Fallada addicional del tancament: `tests/git-hooks.test.mjs:43` copia tooling/hooks però no src/sections/text/pageContent.js; la Frontissa para abans d’arribar al Reflex. Reproduïda en temporal amb el pre-commit original de HEAD, sense la línia nova. No és una regressió del cablejat.

Primer tancament --check: valid:false, planned; 71 errors incloent dos relleus encara per escriure, checksum preexistent del LEDGER, la fixture Husky i 67 incidències SCC. Plantilles, autoritat, segell, skills i compilació Wiki passen. SCC inspecciona també recursos de recerca i un informe generat en var; el seu roig no queda cobert pel verd més estret de porta:orfandat. Tancament final executat amb `--close`: valid:false, state:planned, 68 errors: 1 grup de proves documentals (fixture Husky), 53 ESCRIPTORI_UNANCHORED i 14 ORPHAN_OPERATIVE. Passen plantilles, autoritat, LEDGER, segell, skills i Wiki. El relleu ja no genera errors. La sessió no es pot declarar closed sense arreglar eixe deute.

Relleu enregistrat per executor, transacció `3d4823ef-fb7b-4012-a7d5-00cb8496e4f7`, lease `2cbc0ad3-9de9-4b74-9ff4-9276884c5413` consumida. El cos històric del LEDGER s’ha preservat; checksum anterior invàlid documentat i nou checksum verificat. Comprovació final: cap mutation.pending ni lease activa, diff --check net. Acta Marmota global de jornada pendent.

Log complet del tancament: `/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-brain-close-final-tsq_vj38/close.log`. Logs de proves: `/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-brain-tests-r_7mbrob/node.log` i `/var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-brain-vitest-c1ry4oyd/vitest.log`. Són temporals; el resultat durable és esta auditoria i les transaccions del segell.

## Límits

No s’han llegit secrets ni escrit en l’arxiu extern o la zona humana. No es toca el frontend concurrent, no es fa commit, push ni desplegament. La cerca de referències no prova usos fora del repositori. La neteja no elimina scripts útils només per no tindre imports. El Somiador i quarantena_espills mantenen deute de governança que esta baixa no resol. Tancament global comprovat i roig pels bloquejos detallats; no es declara el torn closed ni el repositori íntegrament verd. El torn documental preliminar queda com a traça de lectura, substituït pel torn de codi; cap estat s’ha manipulat per fingir tancament.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
