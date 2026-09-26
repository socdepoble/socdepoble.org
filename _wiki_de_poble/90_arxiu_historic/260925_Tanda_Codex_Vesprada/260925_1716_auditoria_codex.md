---
type: informe
status: esborrany
description: Resultats de la reparació autoritzada de CSS, gates i universos documentals; límits reals per al registre del Mestre
tags:
  - auditoria
visibility: private
reflex: sdp:torn_38e3e8e5-ec5c-4070-8cce-c55d6341b6d4:9cbb3e43-20e4-4fd8-b3f3-56247f3702cb
---
# Reauditoria de portes, corpus documental i vigilants

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_38e3e8e5-ec5c-4070-8cce-c55d6341b6d4:9cbb3e43-20e4-4fd8-b3f3-56247f3702cb |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T15:16:54.314Z |
| Modificació | 2026-09-25T15:16:54.314Z |
| Propietari | codex |
| Aprovació humana | Execució autoritzada explícitament pel prompt del Mestre; conclusions pendents de revisió humana |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesura no disponible; estimació no calculada |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-25: el primer context va reservar per error el nom de les 18:00. Materialització amb aquell rebut i reanomenament immediat a la ruta de creació real de les 17:16; handoff explícit, sense atribuir lectures passades.

2026-09-25T15:16:54.314Z: auditoria oberta durant l’execució autoritzada; resultats actualitzats amb evidència local.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Resultat: 44/52 portes verdes; 8 continuen roges.** S’han resolt 16 de les 24 fallades reproduïdes al començament. No es declara el sistema preparat per al registre del Mestre en producció. La cadena actual conté 58 passos, dels quals 52 tenen script de porta: el recompte de 51 de l’encàrrec era anterior. El recompte reproduït abans d’esta execució és 28/52, amb 24 portes roges.

### Canvis executats

- Traslladats 14 dels 18 estils inline detectats a classes CSS equivalents: menú, icona IAIA, notificacions, logotip editable, barra de publicació, metadades de detall, espècimens, onboarding i menú del xat. Queden quatre estils que reben valors dinàmics. Tokens centralitzats amb els valors originals i fallbacks redundants retirats; el full de Wiki passa a la carpeta CSS conservant posició i capa d’importació. Espaiat de composició convertit a modificadors explícits dels components mantenint la mateixa escala. Retirades 25 classes sense declaració CSS nova i explicitades variants de navegació/escala: Vocabulari torna a passar, amb el deute històric encara visible. Les proves de Notes comproven el mateix contingut i ordre amb selectors canònics.
- Importacions analitzades amb AST: les cadenes de fixtures deixen de simular imports; els imports reals de tests continuen comprovats, inclosos dinàmics, require i reexportacions. Un error de parseig continua fallant.
- Accés a preferències llegades centralitzat en storage conservant exactament claus i bytes, inclosa la sessió del refresc de chunks. Persistència ja no tracta fixtures aïllades com codi de producció.
- Teixidor i Llaurador compartixen inventari i resolutor. Inclouen recursos humans i de recerca com a nodes, sense llegir binaris. Rebuts i arxiu històric no són autoria activa. L’arxiu aporta només noms de destinació per resoldre cites: no se’n carrega contingut. El BIOS arrel substituïx el mirall només quan existix. ESTAT aporta el primer relleu i LEDGER les àncores, sense reactivar instruccions històriques.
- Reconnectats els índexs actius amb destins verificats. Teixidor i Llaurador mesuren 233 nodes, tots abastables, zero orfes, zero penjats i zero ambigus. No s’han eliminat documents humans ni recerca.
- Set disparadors decoratius substituïts per peticions concretes, índex reconstruït i comparat amb el constructor. Mapa: disparadors útils 22/22 i cens coherent 22/22. Reparats Vincles i punter ON_ESTIC, que citava un pla mogut i una eina retirada.
- Els quatre documents actius de les 16:50/16:55 amb rebuts nuls s’han importat explícitament: originals immutables conservats per SHA-256 i rebuts nous. Esta operació no acredita lectures passades ni aprova el pla d’un altre agent.

### Vigilants

| Vigilant | Evidència observada | Conclusió |
| --- | --- | --- |
| Plaquetes | launchd org.socdepoble.plaquetes, script present, cadència 3600 s | Consta viu al Mapa |
| Reflex daemon | Registre amb estat mort; fitxer absent i Makefile el declara retirat | No és un vigilant acreditable ni cal reviure’l a cegues |
| Time Machine | Script present i cadència declarada de 1800 s; sense launchd instal·lat | Declarat sense llançador; no s’ha instal·lat durant l’auditoria |
| Hooks de contingut i taxonomia | Declarats com pre-commit; Mapa els qualifica desconeguts | Declaració no equival a execució acreditada |
| Adopció, higiene, làpides i refresc | Sense script o llançador concret al registre | Intencions, no vigilants en funcionament |

La mètrica és 1/3 vigilants vius. La instantània de Time Machine tenia 1547 minuts en la captura de verificació; és una edat observada, no una garantia de còpia recent.

### Millora del prompt

Evitar rebuts amb UUID nul, versions de plantilla copiades a mà i l’AFK contradictori dins d’un prompt que autoritza execució. Generar el prompt amb el contracte vigent i distingir l’objectiu «portes verdes» del permís per canviar disseny o configuració de producte.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat observat |
| --- | --- |
| Portes amb script | 44/52 passen, 8 fallen |
| Passos totals de la cadena, executats individualment | 50/58 passen |
| Vitest complet | 514/514, 71 fitxers |
| Node complet | 304 passen, 0 fallen, 2 omeses |
| Scanners corpus/imports/higiene | Proves negatives i regressions verdes; 18 en la passada de corpus |
| Darrers canvis de Vocabulari | 18/18, App, Notes i càrrega del catàleg |
| Lint | 0 errors i 0 avisos |
| Build web / WordPress | Passen; advertiment existent de grandària del bundle |
| Contracte documental | 6 fitxers comprovats, valid:true |
| Navegador local | Arranca; menú es replega i es reobri; Perfil sense sessió porta a registre |
| Tancament documental previ al segell | valid:true; autoritat, plantilles, LEDGER, segell, skills, Wiki, proves documentals i SCC passen |

La primera execució simultània de Vitest, Node i builds va donar un timeout de catàleg i va detectar regressions reals dels scanners i d’un selector de prova. S’han corregit les regressions i s’han repetit les suites completes: resultat verd sense ampliar timeouts. Després de les últimes retirades de classes, s’han repetit lint i les 18 proves afectades.

### Portes pendents i acció concreta

| Porta | Evidència i scope | Acció conservadora | Decisió humana |
| --- | --- | --- | --- |
| Reflex | doctor: taxonomia de graf anterior, baseline divergent, corpus estable no versionat i bytes fora de HEAD | Migració explícita del contracte del graf i revisió del lot Git compartit; no augmentar baseline a cegues | Sí: abast del versionat i contracte vigent |
| Pedra Seca | Classes card i sdp-imatge-cos sense regla; client i fàbrica Sollutia sense consumidor de producció | Revisar contracte de persistència HTML i destí dels dos mòduls abans de retirar-los o integrar-los | Sí: integració Sollutia i compatibilitat HTML |
| Fitxa Gestor | 7 cites de renderItem en UniversalWorkspace; Notes el consumix | Decidir si Notes conserva la previsualització actual o migra a ManagerItemCard | Sí: disseny |
| Crom | width:100% i border-radius:0 en sidebar-control-btn; la porta exigix píndola | Alinear norma i disseny aprovat | Sí: aparença |
| Frontmatter | F3=22, F4=16, F5=2: actes històriques, vocabulari antic i metadades NEXUS importades | Migració documental amb procedència, sense editar recerca humana ni invalidar rebuts tancats | Sí: abast de migració històrica |
| Nomenclatura | 13 actes amb segments en majúscules | Renoms amb mapa complet d’enllaços i relleus dels torns antics | Sí: migració d’història |
| Inline Styles | 4 casos dinàmics: Graella, Costat, Dropdown, UniversalIndicatorCard | Variables CSS dinàmiques validades o variants fixes amb límits explícits | Sí: pregunta pendent |
| Catàleg | GrupCamps marcat viu sense espècimen real | Afegir espècimen o corregir-ne l’estat segons el contracte de catàleg | Sí: ampliació del catàleg visual |

No hi ha baselines de deute noves, límits incrementats ni portes desactivades. Les reduccions de corpus distingixen evidència/història d’autoria i estan cobertes amb tests que mantenen els errors reals.

### Registre complet de la passada

| # | Comprovació | Resultat |
| --- | --- | --- |
| 1 | Contracte de plantilles | PASSA |
| 2 | Autoritat i arrencada | PASSA |
| 3 | Segell de skills | PASSA |
| 4 | Integritat del LEDGER | PASSA |
| 5 | Contracte documental | PASSA · recomprovada |
| 6 | Proves del contracte documental | PASSA |
| 7 | Tractor Psicopatia | PASSA |
| 8 | Porta 58px | PASSA |
| 9 | Linter | PASSA · recomprovada |
| 10 | Porta Importacions | PASSA |
| 11 | Porta Build | PASSA |
| 12 | Porta Promesa | PASSA |
| 13 | Porta TDZ | PASSA |
| 14 | Porta Arrel | PASSA · recomprovada |
| 15 | Porta Enxufe | PASSA |
| 16 | Porta Maquinari | PASSA |
| 17 | Porta Graella | PASSA |
| 18 | Porta InnerHTML | PASSA |
| 19 | Porta Rutes | PASSA |
| 20 | Porta Rutes Web | PASSA |
| 21 | Porta Frontera | PASSA |
| 22 | Porta Adaptadors | PASSA |
| 23 | Porta Frontera Auth | PASSA |
| 24 | Porta Sanejador Auth | PASSA |
| 25 | Tractor Cognitiu | PASSA |
| 26 | Porta Cens | PASSA |
| 27 | Porta Consell | PASSA |
| 28 | Porta Registre | PASSA |
| 29 | Porta Manifest | PASSA · recomprovada |
| 30 | Porta Doctrina | PASSA |
| 31 | Porta Reflex | FALLA |
| 32 | Tractor Pedra Seca | FALLA · recomprovada |
| 33 | Design Guard | PASSA |
| 34 | Porta Tokens | PASSA |
| 35 | Porta Fitxa Gestor | FALLA |
| 36 | Porta Cromàtic | PASSA |
| 37 | Porta Crom (closca immutable) | FALLA |
| 38 | Porta Vocabulari | PASSA · recomprovada |
| 39 | Porta Estucat | PASSA |
| 40 | Porta Atòmica | PASSA |
| 41 | Llaurador Índexs | PASSA |
| 42 | Porta Frontmatter | FALLA |
| 43 | Porta Nomenclatura | FALLA |
| 44 | Porta Teixit | PASSA |
| 45 | Porta SCC | PASSA |
| 46 | Porta Orfandat | PASSA |
| 47 | Porta Persistència | PASSA |
| 48 | Porta Cadena | PASSA |
| 49 | Porta Llavor | PASSA |
| 50 | Porta Utilitats SDP | PASSA · recomprovada |
| 51 | Porta Inline-Styles (Salfumà) | FALLA |
| 52 | Porta Classes (Salfumà) | PASSA |
| 53 | Porta Frontissa Sollutia | PASSA |
| 54 | Porta Olivera | PASSA · recomprovada |
| 55 | Porta RLS | PASSA |
| 56 | Porta Catàleg | FALLA |
| 57 | Proves NodeJS | PASSA |
| 58 | Proves | PASSA |

Reproducció: passos exportats de tooling/gates/run-portes.mjs, executats en ordre sense tallar després del primer error i amb SDP_DINS_DE_PORTA=1. Els logs locals són /tmp/sdp-portes-before i /tmp/sdp-portes-after; el recompte anterior i final prové de results.json.

## Límits

- No s’ha aprovat canviar l’aspecte visual. Crom exigix píndoles i rebutja els botons rectangulars actuals; Fitxa rebutja renderItem usat per Notes. Són contradiccions entre contracte i producte, no una migració equivalent de CSS. Requerixen decisió de disseny.
- Graella, Costat, Dropdown i UniversalIndicatorCard admeten valors arbitraris en props. Passar-los a variants fixes reduïx la configuració; variables CSS dinàmiques requerixen un contracte validat explícit. La pregunta està pendent de resposta.
- Reflex doctor continua exigint taxonomia de graf antiga, una baseline diferent i corpus versionat a HEAD. No s’ha creat un commit que mescle treball preexistent ni una baseline nova per fabricar el verd.
- Frontmatter i nomenclatura conserven deute real de metadades i noms d’actes antigues. Vocabulari passa; Catàleg no té espècimen real de GrupCamps. Pedra Seca detecta dos mòduls Sollutia sense consumidor de producció.
- El navegador local arranca i el menú d’escriptori es replega i es torna a obrir. No és una comparació pixel a pixel de totes les pantalles; no s’afirma equivalència visual exhaustiva.
- Sollutia real i RLS multiusuari en staging continuen sense comprovació remota. Les portes estàtiques i les proves locals no certifiquen una alta real del Mestre. No s’ha creat cap compte, publicat ni desplegat.
- Treball concurrent preservat; sense commit ni push. Tancament documental comprovat després del relleu: valid:true, zero errors, huit comprovacions d’entorn verdes; s’executa el segell de tancament sobre esta versió final. Este resultat no substituïx les huit portes globals pendents. Acta Marmota de jornada pendent.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260925_1650_pla_implementacio_codex]]
