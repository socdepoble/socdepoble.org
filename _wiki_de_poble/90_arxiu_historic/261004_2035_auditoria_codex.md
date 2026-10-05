---
type: informe
status: esborrany
description: Troballes reproduïdes de reintent lazy i cancel·lació; navegació validada, límits de model i relleu documental després d’un arxivat concurrent.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_60aebc0d-ec6a-45bf-8e20-964e41e03e35:57e9c34e-af58-4174-8634-2ff1e3884359
---
# Auditoria adversarial de Gestoria · entrega final després de l’arxivat concurrent

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_60aebc0d-ec6a-45bf-8e20-964e41e03e35:57e9c34e-af58-4174-8634-2ff1e3884359 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T18:38:49Z |
| Modificació | 2026-10-04T18:38:49Z |
| Propietari | codex |
| Aprovació humana | Auditoria de lectura autoritzada pel prompt; informe pendent de lectura humana |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex basat en GPT-6; variant efectiva no exposada. El prompt indica GPT-6.1 Sol Ultra |
| Tokens consumits | Comptador exacte no disponible en aquesta sessió; no s’ha inventat cap xifra |
| Tall d’evidència | HEAD 2022ee3288203938954a2900f9fd2d68bcdcf560 i arbre de treball del 04/10/2026, 20:11–20:32 Europe/Madrid |
| requires_human_decision | false: auditoria acabada sense reparacions ni desplegament |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-04T18:38:49Z: entrega final v1.1.0. Conserva íntegra la revisió tècnica de l’informe2005, arxivat per una operació concurrent mentre es comprovava el tancament. No s’ha mogut cap document des de Codex: s’han registrat els tres handoffs efectivament observats i s’ha creat aquesta entrega final a l’Escriptori. Els dos documents nous2045 s’han llegit com a context, sense executar-ne un encàrrec nou.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte i procedència

No he reproduït una regressió bloquejant de la nova Sidebar, de l’historial o del segell de mòdul. He reproduït dos límits concrets que el veredicte citat no explicava: el reintent d’un import rebutjat no torna a carregar-lo, i oblidar/desmuntar la lectura del Tauler no cancel·la la lectura dels fitxers restants. Per tant, la conclusió defensable és «la navegació ordinària provada funciona, amb deute de recuperació i cancel·lació», i no una garantia absoluta que tot està blindat.

Cal corregir l’atribució: el text citat al prompt 1948 és del subagent revisor anterior de **Codex d’aquest mateix fil**, no de Claude. Codex també implementà part de la Sidebar. Aquesta passada aporta context nou, agents amb encàrrecs separats i reproduccions noves, però continua dins del mateix equip; no és una auditoria externa independent. Els documents de Claude són context, no un adversari al qual atribuir els nostres errors.

### A1 · P2 · «Intentar de nou» no reintenta un import dinàmic rebutjat

**Confirmat amb fallada injectada.** [App.jsx:771](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx>) reinicia l’estat de la barrera d’errors, però no substituïx el component lazy que ja conserva el rebuig. El registre manté un component per app a [registreApps.js:112](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/apps/plataforma/registreApps.js>), i els dos lazy interiors del pont viuen a nivell de mòdul a [AppGestoria.jsx:31](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/apps/gestoria/AppGestoria.jsx>).

Reproducció: un carregador controlat rebutja el primer intent i està preparat per retornar el component real en el segon. Entrar al Tauler, esperar l’alerta, prémer «Intentar de nou» i canviar de mòdul. **El comptador d’intents continua en 1**: el segon intent que funcionaria no s’arriba a demanar.

| Punt que falla | Abast reproduït | Recuperació disponible |
| --- | --- | --- |
| Carregador del manifest de Gestoria | Totes les entrades de l’app conserven l’error | Eixir a Sóc de Poble; recarregar el document per tornar a carregar l’app |
| Import interior de ShellGestoria | Tauler i Bancs tornen a mostrar l’error; els nou accessos compartixen el mateix lazy rebutjat | Aprendre funciona; eixir a Sóc de Poble funciona |
| Import interior d’Aprendre | Reintentar o tornar a Aprendre conserva el rebuig | La closca del Tauler funciona |

Suspense sí que mostra la càrrega pendent. Quan la promesa rebutja, la barrera real de ruta captura l’error; no hi ha spinner infinit ni segrest de tota la navegació. La Sidebar queda fora de la barrera i continua operativa. Canviar pathname reinicia la barrera, però tornar al mateix lazy rebutjat torna a fallar.

**Origen:** deute de recuperació heretat. La classe RouteErrorBoundary és idèntica a la del pare 2022ee32^ i el registre ja conservava els lazy abans d’aquest commit. L’antiga Wiki també declarava lazy a nivell de mòdul. El pont nou hereta aquesta limitació; no hi ha prova que moure el menú haja causat el problema. Tampoc s’ha observat una fallada real de xarxa del servidor: la indisponibilitat s’ha injectat de forma controlada.

**Proposta conservadora per al torn de reparació:** donar a l’error de càrrega una recuperació real i explícita. No afegir una clau volàtil per pathname per forçar remuntatges: perdria lectures privades i contradiria la política del registre. Un reset de barrera per si sol és insuficient. Si la recuperació triada recarrega la pàgina, ha d’explicar que les dades locals en memòria es perdran. Una política de reintent del carregador requerix disseny, límit d’intents i prova específica abans d’implantar-la.

### A2 · P2 · Oblidar o desmuntar evita publicar tard, però no para les lectures restants

**Confirmat amb components i tractor reals.** [useTauler.js:40](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/gestoria/tauler/useTauler.js>) invalida el número de torn en desmuntar; «Oblida» fa el mateix a la línia 57. Les línies 51 i 53 impedixen que el resultat antic s’instal·le al nou estat. Però la crida al tractor continua, i [tractorTauler.js:226](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/gestoria/tauler/nucli/tractorTauler.js>) recorre la llista i demana cada arrayBuffer sense senyal de cancel·lació.

Reproducció sòlida en dos casos: seleccionar dos fitxers sintètics; el primer arrayBuffer queda pendent i el segon encara no s’ha cridat. Passar a Aprendre, o prémer «Oblida les dades» després d’una lectura inicial. Resoldre el primer arrayBuffer. **El segon arrayBuffer es crida després del desmuntatge/oblit.** En tornar al Tauler, la lectura està buida, el titular sense configurar i l’ull tancat. Els fitxers són sintètics i l’aprovació passa pel camí real amb signatura WebAuthn de prova.

La distinció importa: hi ha protecció contra publicar una lectura obsoleta, però no cancel·lació del treball ni del pròxim accés a fitxer. Això manté referències i treball privat fins que acaba l’operació abandonada. No he observat ressorgiment de dades al DOM, persistència financera ni exfiltració. No ho classifique com una fuga entre mòduls ni com un bloquejant actual del connector: la Gestoria està exclosa de producció.

**Origen respecte de la Sidebar: no datable amb la prova disponible.** HEAD agrupa bona part de l’onada en un sol commit i el pare no conté useTauler/tractorTauler. Els informes previs acrediten l’existència del Tauler abans de la Sidebar, però no fixen els bytes d’aquest cicle asíncron. No és rigorós afirmar que és una regressió nova ni que Git demostra que ja existia.

**Proposta conservadora:** un protocol de cancel·lació entre hook i tractor, comprovat després de l’aprovació i abans de començar cada fitxer següent. No es pot prometre interrompre un File.arrayBuffer ja iniciat amb la interfície actual; sí evitar començar més lectures i descartar el treball pendent. Si canvia una font signada del tractor, caldrà actualitzar-ne l’empremta i passar l’aprovació prevista pel sistema. Cap canvi executat en aquesta auditoria.

### A3 · Límit de proves · Un comptador simulat no certifica el cicle financer real

[AppGestoria.test.jsx:40](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/apps/gestoria/AppGestoria.test.jsx>) substituïx ShellGestoria per un doble. El cas de navegació de la línia 171 demostra que React conserva el doble i el seu comptador, no que una lectura aprovada, un procés pendent o Full funcionen igual. Les proves separades del Shell eren útils, però el resum anterior no declarava aquesta frontera de cobertura.

Aquesta passada l’ha reduïda: el muntatge real de plataforma, Sidebar, AppGestoria, Shell, useTauler i useGestoria ha passat les seqüències d’estat i desmuntatge descrites. Hi ha també història real de navegador en jsdom, més les fallades controlades als dos imports interiors. Continuen fora de prova el selector físic del navegador, imports bancaris nous en aquestes sondes, PDF/OCR, ABI d’un backend real i xarxa real amb errors de chunks. Les proves existents del Shell sí que aporten fixtures d’extractes; no s’han substituït per la configuració sintètica.

Proposta per a una reparació futura: conservar com a regressió els casos de cancel·lació i reintent en l’àmbit corresponent. Afegir-ne la reproducció al repositori requerix un nou torn de codi; ara només s’han creat sondes temporals.

### Contrast dels sis punts del veredicte

| Afirmació citada | Atac i evidència actual | Conclusió acotada |
| --- | --- | --- |
| Deu accessos, sense rail interior | Deu URL directes amb AppGestoria real; deu enllaços, un H1, una entrada activa i cap rail interior | Confirmat. El menu és BarraApp. Facturació, Contactes, Burocràcia, Informes i Escàner encara són pàgines «en obres»; nou accessos a la closca no equivalen a nou eines financeres operatives |
| Mateixa instància de closca/useTauler entre nou mòduls | Mateix node de closca i ull en navegació; configuració aprovada conservada; lectura pendent resolta a Impostos | Confirmat per la ruta ordinària. Conservar estat és coherent amb la lectura compartida; no és, per si mateix, stale state |
| Segell de mòdul evita detall/avís antic | Obrir Caixa real i avís de Traduir; recórrer mòduls i tornar amb enrere/endavant reals | Confirmat en la seqüència provada. Els filtres de les línies 203–204 del Shell actuen abans de pintar; l’efecte neteja després. El segell no resol cancel·lació ni errors lazy |
| Guardes DEV i dos imports mantinguts | Lectura del literal del manifest i del pont; proves existents de compilació en memòria i frontera | Confirmat. VITE_SDP_APP_GESTORIA=1 no activa les finances en producció: el pont continua darrere de DEV i la plataforma exigix entorn de desenvolupament |
| Aprendre i eixida de Full desfan panells privats | Aprendre desconnecta Shell i torna buit; Full perd carpeta/trimestre al passar a Bancs, conservant la lectura del Shell | Confirmat en UI i estat del cas provat. Desmuntar no equival a cancel·lar tots els processos privats pendents; A2 limita la frase |
| Cal recompilar i empaquetar | Context 1435/1445 declara builds i ZIP definitiu posteriors a la revisió citada | La frase era una instrucció de la fase de revisió, no l’estat final del paquet. Aquest torn no torna a compilar ni a certificar el ZIP |

El detall de targeta és estat local, no una entrada pròpia de l’historial. Obrir Caixa real no fa push d’una URL de detall; «Tornar» de la targeta i l’enrere del navegador tenen funcions diferents. En tornar per l’historial a un mòdul es mostra el mòdul, sense reobrir automàticament el detall. No he trobat una exigència que obligue a restaurar-lo i no ho marque com a regressió.

El canvi concret de Gestoria usa BarraApp i una PaginaApp central amb ShellGestoria sense rail. No munta un nou espai de treball de Wiki ni un segon AppGridShell per navegar. Els canvis de la graella de Wiki són un front distint i no queden certificats per aquests tests de Gestoria.

### T3 · Model, profunditat i premissa del 7%

**Recomanació: continuar amb GPT-6.1 Sol amb esforç alt/Ultra per a aquest tipus d’auditoria verificable, i escalar una pregunta concreta a Astra quan queda una incertesa material sense reproducció.** La documentació oficial situa Sol per a codi complex i treball professional amb rendiment pròxim a Astra a menor cost, i recomana comparar-los en tasques pròpies; això és orientació del proveïdor, no una garantia d’equivalència. [Guia oficial de models](https://developers.openai.com/api/docs/guides/latest-model#gpt-6-astra-gpt-61-sol).

«Ultra» és un control d’esforç disponible segons client, pla i configuració de Codex; no és un model distint ni el mode de velocitat «Ultrafast». Aquest últim encara no està disponible per a Sol 6.1 segons la pàgina consultada. El nom escrit al prompt no acredita la configuració efectiva d’aquesta execució. [Models de Codex](https://learn.chatgpt.com/docs/models#gpt-61-sol).

Si el **7% és el vostre cost real mesurat per tasca resolta**, és un argument fort per mantindre Sol, sempre que mantinga la precisió. No puc verificar eixa mesura sense el model, la velocitat i el consum anteriors. En crèdits comprats, a velocitat Standard, les tarifes per milió de tokens són:

| Model | Entrada | Entrada en memòria cau | Eixida |
| --- | ---: | ---: | ---: |
| GPT-6.1 Sol | 50 | 2,5 | 250 |
| GPT-6 Astra | 250 | 25 | 1.250 |

A igual nombre de tokens de cada classe, Sol costa el 20% d’Astra en entrada sense cau/eixida i el 10% en entrada en cau. Fast multiplica per 2 i Astra Ultrafast per 6 en la facturació de crèdits comprats/Enterprise aplicable. **Inferència condicionada:** Sol Fast contra Astra Ultrafast dona 2/6 × 20% ≈ 6,7% en tokens sense cau i eixida, pròxim al 7%; això no acredita que fóra la vostra configuració. Les quotes incloses de subscripció tenen altres multiplicadors i no s’han de deduir d’aquesta taula. [Tarifes oficials de Codex](https://learn.chatgpt.com/docs/pricing#token-rates).

Més esforç pot consumir més tokens; per això tarifa per token i cost per auditoria no són el mateix. Compareu el cost d’una incidència resolta i verificada, incloent reintents i falsos positius. Un model més car que redacta una alarma sense reproducció no és una millora d’auditoria. Tampoc tres agents del mateix model equivalen a tres models independents.

Per decidir una escalada, useu un mateix tall de codi, invariants concrets i resultats de proves, amb revisors que no vegen el veredicte previ fins a acabar. Compareu defectes reproduïts, falsos positius i assumptes no resolts. Reserveu Astra per a una disputa de contracte o una fallada difícil que continue oberta; no repetiu tota la lectura documental i les proves ja concloents. No he canviat el model de la sessió ni he encarregat una auditoria a Astra.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. Obligacions de context llegides: AGENTS, Genotip, índex de Wiki i taxonomia documental, skills de workflow/documentació i plantilla canònica retornada pel sistema. El revisor de context ha llegit íntegrament els **17 Markdown de primer nivell** presents abans de crear aquest informe, 244.837 bytes; els hashes abans/després de la lectura coincidien. El catàleg està a /tmp/sdp-adversarial-desktop-context.json. No s’han obert arxius històrics ni continguts de les subcarpetes protegides per aquest procediment.
2. **182/182 proves existents**, set fitxers: AppGestoria, BarraApp, manifestApp, fronteres, integracioApp, ShellGestoria i privacitat. Inclouen les compilacions dirigides de privacitat amb write:false, sense generar un bundle nou. Log: /tmp/sdp-adversarial-existing-tests.log.
3. **13/13 sondes de rutes**, amb components reals i historial de navegador en jsdom: les deu URL directes, navegació/enrere/endavant, fronteres de desmuntatge i rebuig del carregador de manifest. /private/tmp/sdp-gestoria-route-audit/routes.test.jsx i routes.log.
4. **2/2 sondes d’import interior**, amb el codi real del pont i substitució temporal només de les dos expressions d’import per carregadors diferits controlats. La classe RouteErrorBoundary s’ha extret literalment a /tmp per evitar avaluar mòduls aliens. /private/tmp/sdp-gestoria-route-audit/inner_shell.test.jsx, inner_aprendre.test.jsx, inner.config.mjs i inner.log.
5. **6/6 casos sòlids d’estat/privacitat**, amb els hooks, vistes i tractors reals i configuració d’empresa sintètica aprovada. La suite completa té 7/7 perquè incorpora una setena sonda d’input.files, exclosa com a prova de selector natiu. /private/tmp/sdp_adversarial_state_261004/state.test.jsx, vitest.config.mjs i results.txt.

Que les sondes passen significa que han reproduït i assertat el resultat declarat. Les sondes de fallada estan verdes precisament perquè confirmen que el reintent continua en 1 o que el segon fitxer encara es llig; no són un certificat d’absència de defectes.

Reproducció de les suites temporals, des de l’arrel del repositori:

    node node_modules/vitest/vitest.mjs run --config /private/tmp/sdp-gestoria-route-audit/vitest.config.mjs --reporter verbose
    node node_modules/vitest/vitest.mjs run --config /private/tmp/sdp-gestoria-route-audit/inner.config.mjs --reporter verbose
    node node_modules/vitest/vitest.mjs run --config /private/tmp/sdp_adversarial_state_261004/vitest.config.mjs --reporter verbose

Les configuracions temporals han requerit corregir resolució de /tmp→/private/tmp, el plugin de transformació i nonces de signatures sintètiques. Eren errors de preparació de la sonda, no fallades del producte. No s’han instal·lat dependències ni canviat la configuració del repositori.

Tall productiu: inventari inicial de 1.994 fitxers a src, tests, tooling, scripts, el connector sense builds i configuracions d’arrel, guardat a /tmp/sdp-adversarial-source-before.json. Comprovació final: els 1.994 fitxers coincidixen amb l’inventari inicial, cap canvi, HEAD estable. Resultat: /tmp/sdp-adversarial-source-final.json. Les portes documentals es consignen al relleu de tancament d’aquest informe.

**Relleu de tancament:** els tres documents propis originals passaren el comprovador canònic i l’Olivera passà abans de l’arxivat concurrent. El primer --check trobà dos problemes de governança (LEDGER sense signatura i segell de regles divergent) i sis enllaços propis amb sufix de línia no admés pel verificador de Wiki. Els enllaços d’aquesta entrega final conserven la línia al text i apunten al fitxer existent. El segon --check, executat després del moviment extern, trobà 53 incidències, incloent els tres documents retirats sense relleu de rebuts. Els handoffs propis ja s’han registrat, sense esborrar ni moure fitxers; no s’han corregit documents o segells aliens. El torn formal continua planned si la porta global no és vàlida. Logs: /tmp/sdp-adversarial-closure.json i /tmp/sdp-adversarial-closure-final.json.



**Diagnòstic després del relleu:** /tmp/sdp-adversarial-closure-delivery.json retorna valid:false/planned amb10 incidències. Ja no hi ha els sis enllaços propis de línia invàlids. Tres àncores de les eixides arxivades s’han afegit després a l’índex. Persistix una limitació del circuit: handoff actualitza el rebut de l’artefacte creat, però els rebuts previs de context de la mateixa ruta encara apunten a l’antiga ruta absent; checkTurn enumera també eixos rebuts. No s’ha modificat l’eina ni manipulat els rebuts per ocultar-ho. A més hi ha LEDGER sense signatura, segell divergent i dos orfes operatius d’actes alienes. Plantilles, autoritat, skills i compilació estricta de Wiki passen. L’Olivera de l’entrega final passa amb tres documents actius, inclosa aquesta auditoria. El tancament formal no es declara verd. Després d’afegir les tres àncores, la comprovació final /tmp/sdp-adversarial-closure-last.json retorna valid:false/planned amb 10 incidències; el report propi continua vàlid i les 1.994 fonts no tenen cap canvi.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Aquesta auditoria no certifica AEAT, un backend de Sollutia, un desplegament WordPress ni bytes d’un ZIP reconstruït. La Gestoria financera continua sent DEV. El paquet de la sessió anterior queda fora del nou encàrrec; no s’ha reconstruït ni desplegat.
- En la sonda d’input.files, fireEvent injecta una propietat sintètica. Que continue referenciant el fitxer després d’Oblida no prova què farà un selector físic: pot ser un artefacte de la sonda. PortaTauler no declara reset del selector en l’oblit, però la retenció nativa i la re-selecció del mateix fitxer queden com a hipòtesi per a una prova de navegador, no com una regressió acreditada.
- El repositori ja tenia canvis d’altres torns. No s’han revertit ni atribuït a aquesta passada. Els resultats antics de 0605 no es traslladen al tall actual; conserva notes d’avatar i empaquetat superades pels documents 1435/1445.
- En preparar les eines, una invocació d’obrir_torn.mjs amb --help va obrir accidentalment torn_fcd37fe7-c486-45dc-ab4a-715404d6affe de codi. No s’hi ha fet treball productiu ni s’ha esborrat/falsejat el registre. L’auditoria usa el torn documental torn_60aebc0d-ec6a-45bf-8e20-964e41e03e35.
- L’autorització és per a auditar i documentar. A1/A2 són propostes per a un altre torn de codi; no s’han executat reparacions ni obert fronts nous.
- El trasllat extern de l’Escriptori ha ocorregut mentre es finalitzava l’auditoria. Aquesta entrega final evita deixar el resultat només a l’arxiu. No s’ha assumit l’encàrrec2045 de Marató ni s’han alterat els seus documents. La capa de governança i els enllaços afectats per l’arxivat concurrent tenen diagnòstic propi; no s’atribueixen a regressions del producte.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [Pla original vinculat](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/90_arxiu_historic/261004_Auditoria_Gestoria_Codex/261004_1948_pla_implementacio_local_codex_auditoria_adversarial.md>)
- [Informe anterior arxivat externament](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/90_arxiu_historic/261004_Auditoria_Gestoria_Codex/261004_2005_auditoria_codex.md>)
- [Acta Marmota de la passada](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/90_arxiu_historic/261004_Auditoria_Gestoria_Codex/261004_2025_acta_marmota_codex.md>)

## Proposta d’Automillora

**Si m’hagueres demanat això d’aquesta altra forma, hauria sigut més eficient:** «Audita aquest diff i aquest HEAD; contrasta els sis invariants, prova historial, cancel·lació i fallades dels dos lazy; separa regressions, deute anterior i límits; recomana model assumint un 7% observat o especificant model/velocitat anteriors. No repares.» La frase «el teu treball és trobar què està a punt de petar» incentiva falsos positius; l’objectiu millor és falsar el veredicte amb proves, admetent quan una hipòtesi queda descartada.

El prompt confon l’autoria de la revisió amb Claude i usa «AppGridShell» per a un canvi concret que viu en BarraApp/AppGestoria/ShellGestoria. També porta «cal recompilar» d’una fase anterior sense el tall temporal posterior. Afegir autoria, rutes concretes, hash de commit i estat del paquet evitaria aquestes contradiccions. Llegir tot el context actiu té valor, però repetir unes 245 KB en cada auditoria estreta encareix la revisió; un índex amb hashes, documents vigents i relleus consumits permetria una ordre humana de lectura més delimitada. Aquesta passada ha respectat la lectura íntegra exigida.

Flux disponible utilitzat: delegació amb context inicial separat, proves de fallada en configuracions temporals i contrast d’inventaris abans/després. No puc acreditar que siga una capacitat acabada d’estrenar respecte de les vostres sessions anteriors. Per al nucli MarIA–Claude–Codex, propose que MarIA fixe el tall i els invariants; l’executor entregue proves i límits; el revisor reba primer el diff sense el veredicte, i després contraste les conclusions. Les sondes reproduïbles, no el nombre d’agents ni el nom del model, han de decidir el consens.


