---
type: informe
status: esborrany
description: Reconciliació T11 amb SG-02 intacta, proves de G1 i auditoria independent dels carrils de portes, multimèdia i xifrat.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0c834999-94ec-4377-8030-b45285a8d6b4:b8087072-203a-48c1-acee-d74b392c6679
---
# Auditoria Codex de G1 i estat verificat de les deu dimensions

G1 reconciliat i aplicat en local. La certificació global de 10,0/10 continua oberta perquè E1, M1, G2 i G3 conserven requisits pendents. Este informe separa les correccions pròpies de la verificació en lectura dels altres carrils.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0c834999-94ec-4377-8030-b45285a8d6b4:b8087072-203a-48c1-acee-d74b392c6679 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T13:44:43.422Z |
| Modificació | 2026-10-29T14:07:58+00:00 |
| Propietari | codex |
| Aprovació humana | aprovada: prompt del torn i autorització expressa del manifest Node |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, basat en GPT-6; variant de desplegament no exposada per l’entorn |
| Tokens consumits | No exposats per l’entorn; sense estimació |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-29: lectura del prompt adjunt, BIOS, Genotip, índex, estat actual, taxonomia, pla 1305, acta 0838 i context viu. La lectura íntegra de Llibre Mestre, índex d’Escriptori i prompt viu s’ha delegat i completat per blocs, incloent els canvis concurrents de les 14:44.
- Base real: `62c74fa152412f5ad4a46fc78c0befbf757ac540`, descendent de `feaaf0e07`; arbre amb canvis locals aliens previs. No s’han revertit ni incorporat a cap commit.
- Autorització humana addicional: registrar les proves de G1 a `tooling/tests/node-suite-manifest.json`; el pla viu incorpora després el mateix path.
- El CLI d’obertura no implementa `--help`: la consulta inicial va obrir el torn `torn_0c834999-94ec-4377-8030-b45285a8d6b4` amb actor genèric. S’ha reutilitzat explícitament com a torn de codi, amb autoria documental Codex i pla vinculat; no s’ha falsificat l’inventari inicial.
- Reconciliació aplicada amb lease `c723d68d-e749-4944-85a3-f52302bc681e`, pla SHA-256 `a14c75ddff1309ff0a223cc5d15b947d506df680f29620278102bee8becdcf79`, transacció acceptada `be5c6198-75bf-4207-8a83-8a445e95c019`. Rebut consumit després de verificar el segell.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### G1 aplicat i verificat

S’han escrit catorze camins físics, incloent sis suites noves. `.claude/skills/core-restauracio-segellada` és un symlink a `.agents/skills/core-restauracio-segellada`: l’actualització canònica actualitza també el mirror, sense escriure per l’àlies.

| Contracte | Resultat |
| --- | --- |
| Llaurador | Identifica una única parella activa `LLAURADOR:ADOPCIONS`; preserva exemples, offsets i prosa. Valida totes les propostes abans del primer write; regressió de dos índexs contra escriptura parcial per error de validació. |
| Resolució documental | Prioritat de la nota local davant d’un basename homònim global. |
| A4 | Un sufix `.test.*` deixa de justificar per si sol una porta inert declarada a `package.json`; continua l’exempció per proves Node registrades. |
| RLS R2 | Només DDL real acredita ENABLE; últim ENABLE/DISABLE per relació. CREATE i ALTER compartixen el parser d’identificadors quoted/unquoted, caixa i cometes escapades. |
| Restauració duplicada | `tooling/scripts/desenterrar.mjs` queda retirat: diagnòstic, cap Git ni delegació, import inert. |
| Restauració canònica | Commit immutable, segell v3 sobre HEAD/bytes/modes, CAS abans i després del claim i abans del rename; còpia rellegida i manifest de retorn; verificació de bytes i mode finals. Skill alineada amb `--rebut`, `--forca` i límits reals. |
| SG-02 | `scripts/generate-prompt.sh` es conserva byte a byte. Les proves exigixen exit 2 també en help: no s’ha substituït la làpida per la versió vella del pegat. |
| Bateria Node | Sis proves registrades com a primàries i obligatòries al manifest, amb autorització humana. |

El pegat original només fallava en el hunk del generador retirat. S’ha reconciliat en temporal i aplicat amb l’executor, sense aplicar-lo a cegues. Els primers assajos temporals fallaren per dependències de fixture absents (sentinella d’arrel i `scripts/immunitari`); es diagnosticaren i es copiaren les dependències, sense canviar expectatives per fabricar verd.

El pla cita marques `INICI:BLOC_GESTIONAT` que no són les del Llaurador real. La suite managed-region té ara 17 casos; els recomptes del prompt sobre conjunts de suites no s’han traslladat com si foren d’un únic fitxer.

### Pendents verificats fora del carril

| Carril | Evidència local | Acció del responsable |
| --- | --- | --- |
| G3 | `design_guard`: 37 crítics i 12 avisos; `tractor-fitxa-gestor`: set F4. | Corregir fonts assenyalades, preservant aparença i contractes. |
| G2 | C2=2, C4=12; F9=140 al primer tall, sostre 190. | Sanejar els documents i revisar les cites històriques que també compta C4. No abaixar el sostre sense liquidar deute. |
| E1 | Flag apagat i prova de seguretat inclosa al precommit; pipeline incomplet. | Connectar preparació del sobre, recepció/historial, drenatge F7 i oblit productiu. |
| M1 | 83 `.png` amb capçalera JPEG; sis OG fora de 1200×630; icones amb verd antic; WP 1.1.9. | Re-codificar, connectar variants socials, regenerar icones i paquet WordPress des d’arbre net. |

E1: `src/data/xifratXat.js:394–400` retorna historial sense desxifrar; `:442` admet preparador injectat sense consumidor productiu identificat; `:480–482` rebutja adjunts xifrats pendents. `xifratXatMagatzem.js:1200–1218` sí exposa `OBLIT_FALLIT`, però no s’ha acreditat la connexió completa d’eixida, sessió i preferències. AES-GCM i hash d’adjunts són primitives ja existents a `xifratXatProtocol.js:841–879`; no certifiquen el pipeline.

Les sis OG irregulars del manifest construït de 110 rutes són cervell i consola (480×480), La Torre (600×450), Orxeta (1280×817), Sella (1280×345) i Tibi (1280×959). Aplec ja apunta a variant social. El test global valida pes/MIME/bytes, però encara permet altres dimensions.

D-C2: `src/natiu/projecteIos.test.js:666–698` conserva l’excepció `[15,103,47]`; `capacitor.config.json:31` i el fons Android encara contenen el verd antic. Fonts PHP/readme i ZIP vigent indiquen 1.1.9; ZIP de 3.336.867 bytes. Cap release nova certificada.

### Contrast final dels canvis concurrents: bloquejos de G3

El tall posterior a G1 dona `cens` exit 0 (C2=0/C4=0), `design_guard` exit 1 (un crític, dotze avisos) i `fitxa` exit 0. Això actualitza els recomptes inicials de la taula anterior. F9 continua roig per deute en documents modificats. El verd mecànic de fitxa requerix esta reserva funcional:

1. **P1 · F4 eludit per exempció del fitxer infractor.** `tooling/gates/tractor-fitxa-gestor.mjs:335` incorpora `if (r.includes('UniversalWorkspace.jsx')) return;`. `UniversalWorkspace.jsx` no té diff i conserva la prop a :465, propagació a :595/:713 i crida lliure a :1609–1611. Contradiu l’encàrrec de liquidar les set infraccions i la regla F4 del mateix detector. Cal retirar l’exempció i corregir el contracte del component al carril responsable. `requires_human_decision: false`: la conducta exigida ja està aprovada.
2. **P1 · Focus sense alternativa observable.** `src/css/modules.css:3203` afig `box-shadow: none` després d’`outline: none`; a :2669 un comentari conté `focus-visible` i `box-shadow`. La cerca textual de `design_guard.mjs:150–152` accepta eixes paraules en els 160 caràcters següents, sense comprovar una alternativa CSS efectiva. Els canvis no acrediten focus visible. Cal un indicador real o una exempció semàntica justificada per al contenidor enfocat per programa, sense ocultar controls. `requires_human_decision: false` per a conservar accessibilitat existent.
3. **P2 · Geometria alterada en una neteja.** `src/css/components.css:254` passa 24px a `--sdp-space-5`, que és 20px a `tokens.css:401`; el control es reduïx mentre el detector només comprova literals. Cal preservar la dimensió o obtindre una decisió de redisseny. `requires_human_decision: false` per a preservar el píxel; true només si es proposa canviar-lo.

Les excepcions de colors del mostrari i d’entitats HTML tenen justificació plausible; no es confonen amb estos tres bloquejos. S’han documentat sense tocar els fitxers del carril alié.

### Taula de les deu dimensions

No hi ha una rúbrica numèrica vigent que permeta derivar una mitjana nova. S’indica explícitament si el 10/10 està acreditat; no s’hereten notes històriques com si foren resultats d’esta onada.

| Dimensió | Qualificació verificable en este tall | Certificació 10/10 |
| --- | --- | --- |
| 1. Arquitectura i sobirania / Model B | Port, kit de conformitat, Enxufe i Frontissa locals conformes; Sollutia continua amb `apiOrigin:null`, recursos buits i cap escriptura. Endpoints reals pendents. | No acreditada globalment |
| 2. Disseny, UX mòbil i accessibilitat | Tall inicial 37 crítics/set F4; final un crític i F4 aparentment verd per exempció. Focus i dimensió continuen amb reserves funcionals. | No |
| 3. Identitat, privacitat i SQL/RLS | RLS estàtica conforme en 63 SQL i regressions noves verdes; no prova una base desplegada ni l’oblit complet E1. | No |
| 4. Editor, Proposa Card i rendiment | Proposta determinista i desfer/refés atòmics; cos de 300.000 caràcters sense reserialització per canviar títol; proves locals verdes. Falta mesura en dispositiu. | No acreditada globalment |
| 5. OpenGraph, SEO i EXIF | Sis dimensions OG irregulars i 83 PNG amb MIME discordant; prova HTTP conforme fora del sandbox. | No |
| 6. E2EE i recuperació social | Primitives i flag apagat conformes; Fase 4 i integració d’oblit pendents. | No |
| 7. Rigor i cobertura de proves | G1 100/100, precommit verd; resultats globals i límits d’entorn detallats separadament. | No acreditada globalment |
| 8. Preparació per a botigues | Eines de preflight i pujada provades; arbre brut, color pendent i `Info.plist:38` amb `com.googleusercontent.apps.pendent`. Sense certificació externa. | No |
| 9. Governança i Olivera | Circuit documental i transacció G1 verificats; hi ha canvis concurrents i el tancament general s’ha de comprovar. | No acreditada globalment |
| 10. Coherència Wiki, Skills i Tractors | G1 corregit, segell verd; El cens ja passa; frontmatter i la integritat funcional de G3 continuen pendents. | No |

### Correccions del context compartit i de la plantilla

- Les rutes reals són `tooling/gates/design_guard.mjs`, `tooling/wiki/tractor-frontmatter.mjs`, `src/sections/text/perAppNativa.js`, `src/data/xifratXat*.js`, `src/config/xifratXat.js` i `src/natiu/projecteIos.test.js`. Les rutes homònimes del prompt no existixen.
- C2 afectava també `.agents/skills/core-consell-i-colmena/SKILL.md:35–36`; el carril responsable l’ha actualitzada amb una transacció posterior. Codex no l’ha editada. El segell final observat és `c9fad3f4…`, coherent amb este canvi alié.
- Codex 0340 diu que les notes eren històriques i no calcula una mitjana nova; Claude 0350 declara que no assigna nota. Les atribucions 8,89/9,45 del pla no constituïxen certificacions actuals.
- El nou bloc de pàgina de versions col·lidia amb IDEA-49 de Google OKF; l’orquestradora ja l’ha renumerat com a IDEA-50. P1-64 conserva doble assignació històrica. No s’han implementat funcionalitats alienes a G1.
- Millora proposada del prompt: generar inventari de rutes i recomptes reals abans de convocar, separar objectiu d’evidència i incloure els manifests auxiliars en la matriu. La lectura incremental per hash requerix canviar el contracte vigent abans d’adoptar-la.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat observat |
| --- | --- |
| Suites G1 sobre arbre real | exit 0; 100 proves, 100 passades, zero fallades/omissions. |
| `npm run test:precommit` | exit 0; 204 fitxers Vitest, 4.181 passades i quatre omissions; Node 262/262. |
| `npm run lint` | exit 0 sobre src/tooling/scripts/tests després del canvi. |
| `eslint . --max-warnings=0` | exit 1; 1.527 errors i 479 avisos en compilats Android/iOS i funció TypeScript. Este abast literal no equival al lint de fonts. |
| `npm run test:node` | exit 1 dins del sandbox: 1.503 passades, una fallada `listen EPERM` a 127.0.0.1, tres omissions i quatre TODO diagnòstics; 1.511 proves totals. |
| Suplement HTTP fora del sandbox | exit 0, 1/1; no substituïx l’exit de la passada global anterior. |
| `tractor-arrel` | exit 0, A1–A5. |
| `tractor-rls` | exit 0 sobre 63 SQL locals. |
| `llaurador_indexs --check` | exit 0, 555/555 documents abastables; dos continuen al bloc automàtic. |
| `segella.mjs --check` | exit 0, hash `8383b20410a556acca13b53d7fc79ae62b88cd1950e515d69240786410da0637`. |
| Olivera / SCC / plantilles / taxonomia / autoritat | exit 0 al tall independent inicial; SCC 232 fitxers i dotze rutes. |
| Enxufe / Frontissa | exit 0. |
| Proves dirigides E1/M1 | Nou fitxers, 192 passades i una omesa, exit 0. |
| Arquitectura/editor | Set fitxers, 97/97, exit 0. |
| Eines botigues | Node 14/14, exit 0. |

Les passades dirigides poden solapar-se amb les globals: no se sumen per inflar cobertura. La suite Vitest completa ha acabat amb exit 0: 1.406 fitxers passats i nou omesos; 24.467 proves passades i 103 omeses (24.570 totals). Duració 768,31 s. Primer `tancament --check`: exit 1 únicament perquè el pla havia canviat concurrentment; les nou comprovacions d’entorn passen (Olivera, plantilles, autoritat, LEDGER, segell, skills, wiki, proves documentals i SCC). Es rellig i vincula el pla viu abans del tancament final; el resultat queda al registre del torn.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- El checksum del LEDGER ja era invàlid a HEAD i a l’inventari inicial: hash del cos `967823b10057f2e4c0326eeaa9fe11305daba95c1012b2c5e099da4105b8ccc8`, marcador antic `89721b4309e3aa94ca96d244591948700f0dbb955e87b9022e8700f4d639d664`. El relleu conserva el cos anterior, registra esta preexistència i recalcula el checksum amb l’entrada nova. No és un canvi de les regles del segell de skills.
- El relleu propi s’ha aplicat després de refusos correctes per concurrència, sense saltar controls: transacció `4546539a-7fa7-4f6a-b0e9-c4e3f285ac11`, lease `d6b46f45-d587-4827-b8ee-8e5392d8254e` consumida. Mestre, ESTAT i LEDGER actualitzats; el cos previ del LEDGER es conserva i el checksum verifica.
- La verificació és local sobre un arbre compartit mutable, sense commit, staging, release, desplegament, SQL remot ni activació E2EE. La integració final és del carril de Claude.
- RLS és una porta estàtica, no un parser SQL complet ni una inspecció del servei desplegat. Les proves defensives només empren fixtures locals.
- El Llaurador preavalua totes les propostes i revalida bytes abans del primer write; no oferix transacció de sistema de fitxers davant d’un error d’I/O o un procés concurrent durant els writes.
- El CAS de restauració és local i no bloqueja altres processos. No preserva timestamps/xattrs, no fa retorn automàtic ni calcula impacte semàntic; la skill ho explicita.
- En el tall inicial no hi havia informes nous de Claude/Gemini. Després s’ha llegit íntegrament `261029_1455_auditoria_claude.md`: és un esborrany amb registres pendents; el relleu de progrés coincidix amb les rutes reals, 83 PNG/JPEG i sis OG irregulars. No constituïx una certificació final. Les auditories auxiliars són subagents d’este mateix Codex, no vots independents del trio.
- Cap cron, schedule, monitor ni servidor persistent creat per este torn. Tots els corredors propis de proves han acabat.
- L’acta general de l’onada queda per al tancament d’integració; este informe i ESTAT preserven el relleu de G1.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_1305_pla_implementacio_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10]]
- [[261029_1305_prompt_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10]]
- [[../10_actes/261029_0838_acta_marmota_qa_codex_10_cicles]]
- [[261029_1455_auditoria_claude]]

