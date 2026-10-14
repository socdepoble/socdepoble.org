---
type: informe
status: esborrany
description: Auditoria viva del pla 0210, contrast de Gemini i consistencia atomica TPV-Rebost-Gestoria; proves, limitacions i seguiment cada 15 minuts.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_6e1c9735-95eb-43a6-864c-97f640acaccf:e4f8e361-96d6-42bd-a424-3519a6c81a54
---
# Dictamen adversarial del Consell: reparacions, propostes Gemini i atomicitat TPV-Rebost-Gestoria

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6e1c9735-95eb-43a6-864c-97f640acaccf:e4f8e361-96d6-42bd-a424-3519a6c81a54 |
| Versió del document | 1.4.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T00:37:08.500Z |
| Modificació | 2026-10-14T01:29:00.000Z |
| Propietari | codex |
| Aprovació humana | auditoria i vigilància autoritzades per ordre directa; dictamen pendent de decisió del Consell |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex |
| Tokens consumits | no disponibles amb precisió en este entorn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-14T00:37:08.500Z: creat pel circuit documental per al nou encàrrec del Consell. L'informe anterior 0002 ja està a l'arxiu històric per actuació aliena; no es restaura.

2026-10-14T00:43:00.000Z: primer dictamen substantiu. Contrast de Gemini, quatre reproduccions del Bar i vigilància reactivada cada 15 minuts. Claude inicia XAT-01 durant l'auditoria: es diferencia el tall inicial estable del treball concurrent. Açò no és un informe final d'onada completada.

2026-10-14T00:52:00.000Z: incorporada l'ampliació v2 de Gemini 0148, llegida íntegrament. Es retira la conclusió provisional d'absència de proposta sobre graf i empaquetat: la proposta ja està lliurada. S'hi documenten errors del cens, tractors, contracte Z, dependències de trasllat i encaminament natiu. Rel­leu ESTAT/LEDGER aplicat amb CAS i executor, transacció `d15de2a7-80de-4abc-94fc-fadd546509ff`; vigilància encara activa.

2026-10-14T00:58:24.000Z: despertar 00:54 UTC. Sense tancament d'onada ni nous documents aliens. Revisat el pegat XAT-02 en curs: 32 proves acotades passen amb fonts estables; reproduït el cas residual d'esquema opac en majúscules. S'actualitza el punt de comparació només amb les 15 rutes revisades.

2026-10-14T01:11:42.000Z: despertar 01:09 UTC. Sense tancament o canvi documental alié. Nou ajust de focus de XAT-01 verificat amb 143 proves i hashes estables; revisió estàtica del peu dels calaixos. Cap defecte nou identificat; persistix C4-XAT-03, sense canvis en el seu codi.

2026-10-14T01:29:00.000Z: despertar 01:24 UTC. Claude 0320 és encara una plantilla amb resultats pendents. C4-XAT-03 corregit: 7 suites, 74 proves aprovades, fonts estables. S'actualitzen únicament les sis rutes revisades en el punt de comparació; la nova onada continua oberta.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen del primer tall

**La taula encara no pot donar per acabada esta onada.** El pla 0210 està en execució; no hi ha entrega final nova de Claude. Les 17.458 proves verdes i 89 omeses són la referència declarada en l'informe final de l'onada anterior, ara arxivat, no una execució global nova de Codex. Una reducció del recompte sense justificació no demostrarà preservació de cobertura.

Hi ha una objecció reproduïda a la reparació CON-03 proposada: afegir un nom de script faria verdes tres tasques sense acreditar-ne l'execució. També hi ha dos defectes P1 de persistència parcial del Bar, un conflicte P2 condicionat a l'absència de Web Locks i una devolució entre torns que la interfície promet però no permet. Són deute anterior al pegat de Claude, no regressions atribuïdes a esta onada.

La integració TPV–Rebost–Gestoria està **parcialment definida, no implementada com a circuit atòmic**. L'auditoria no la certifica per l'existència de primitives correctes, exportacions o proves verdes separades.

### C4-CON-01 · P2 · Salut falsa en la solució proposada per a les subtasques

**Estat: proposta refutada abans d'aplicar-la.** El pas 3 del pla 0210 proposa posar `script: scripts/immunitari/plaquetes-plan.mjs` a `adopta-orfes`, `lapida-fantasmes` i `quarantena-brossa`. En una còpia en memòria del registre, sense executar cap treball, eixe únic canvi transforma els tres estats `desconegut` en `viu` perquè la mare `plaquetes-diagnostic` està viva. El mapa hereta la salut de la mare quan la filla declara un script existent (`src/sections/consola/mapa/construeixMapa.js:578`). El comentari d'esta branca ja advertix de la diferència entre diagnòstic i aplicació.

| Evidència | Què acredita realment |
| --- | --- |
| `scripts/immunitari/plaquetes.mjs:243,267` | `diagnostic --autonom` exclou les operacions L2 de llàpides i quarantena |
| `plaquetes.mjs:290` | El diagnòstic genera una recepta; no l'aplica |
| `plaquetes.mjs:322–344` | Aplicar exigix recepta aprovada, arbre net, pla, rebut i executor Reflex |
| `scripts/immunitari/plaquetes-plan.mjs:45` | Només admet `LAPIDA` i `ADOPTA`; rebutja `DESTRUEIX`, la quarantena proposada |

**Decisió recomanada:** revisar este pas del pla abans de convertir-lo en codi. Separar diagnòstic executat, proposta pendent, aplicació autoritzada i resultat acreditat amb rebut. Un fitxer existent no prova que un llançador l'invoque ni que haja completat una operació. No s'ha reproduït execució destructiva; s'ha reproduït una atribució falsa de salut en el mapa.

### C4-CON-02 · La resta del diagnòstic de consola necessita actualització

- **CON-01 de Gemini ja està resolta al tall consultat:** les dues skills tenen cinc disparadors cadascuna a `.agents/skills_index.json`. Cens, frontmatter, disparadors i segell: 36/36, zero avisos de skills en `recullFonts` + `construeixMapa`. Regenerar només en memòria dona el mateix resultat. No s'atribuïx autor ni moment a esta correcció: l'índex no està versionat. `build_skills_index.mjs --check` construïx des dels frontmatters i ix 0, però no comprova per si sol la sincronització del fitxer desat.
- **CON-02 de Gemini encerta l'absència del llançador d'higiene** a `~/Library/LaunchAgents/`. El plist del repositori declara 05:30, `RunAtLoad=false` i `--aplica`. Existir com a fitxer tampoc acredita càrrega efectiva de launchd. La recepta de llançar el script manualment és incompleta respecte de l'observabilitat: `cron_higiene.mjs` genera informe i stdout, però sense redirecció no actualitza automàticament `higiene-cron.out`; el mapa usa els mtime dels logs. No s'ha instal·lat, carregat ni executat cap servei.

### C4-XAT-01 · Canvi de requisit en curs, no regressió nova demostrada

En el tall inicial, `EntradaDelPoble.jsx:50` obria automàticament el General només amb poble, llista sense consulta, sessió, dades preparades, primera entrada i mida `ample`. Les proves vigents exigien explícitament eixa conducta. El pla 0210 canvia el requisit: conservar la presentació i esperar el clic de la persona. Classificació de Codex: P2 funcional; no s'ha acreditat la severitat P1 ni l'impacte remot que suggerix l'informe de Gemini. La mida prové del contenidor i de les amplàries desades, no exclusivament del viewport.

Rectificació factual: `Conversa.jsx:469` ja mostra «Cap missatge encara. Inicia la conversa!». Una conversa buida no és literalment un fons mut.

**Treball concurrent observat:** Claude ha substituït l'obertura del General per `/xat?comunitat=<id>`, ha eliminat la creació automàtica en seed/local i ha afegit proves de presentació, retorn sense bucle, comunitat absent, codificació de l'identificador i amplàries. La primera versió revisada no presenta un defecte nou detectat. No obstant això, durant la passada de 139 proves apareixen canvis temporals compatibles amb proves de mutació (`MUTACIO` i navegació prèvia a `/xat/<id>`). **El verd de la passada no es pot atribuir al fitxer final d'un arbre que canvia mentre s'executa.** No es declaren eixos mutants ni reparació acabada ni defectes d'una entrega final. Cal esperar el tall estable i l'informe de Claude.

Actualització del despertar 00:54 UTC: el component torna a `7e8586cd0708901ddd8906b89828295ee76c6bf43a26244539b90511bba2c04f`, la versió inicial revisada sense mutant. No es repeteixen les 139 proves; la tornada del hash no transforma retroactivament una execució concurrent en una certificació de tota l'entrega.

### C4-XAT-02 · P2 · Referències opaques arribant a una imatge renderitzada

**Estat actualitzat a 01:29 UTC:** el pegat corregix les fronteres revisades tant per a l'esquema canònic com per a les variants de majúscules. El diagnòstic següent descriu el tall anterior; el cas residual C4-XAT-03, reproduït en VIG-C4-01, queda corregit i verificat en VIG-C4-03.

Cadena concreta anterior al pegat: `storage.js:323` torna la referència crua si falla la signatura; `useResolvedAsset.js:102` tracta qualsevol cadena no buida com a `ready`; `AvatarResolt` la passa a `Avatar`, que accepta `sdp-media://` i la posa en un `img` (`Avatar.jsx:55`). S'ha identificat la mateixa frontera a `marca.jsx` i EventCard → UniversalCard amb `imatgePrivada`. El resultat plausible i cobert per esta anàlisi és una imatge trencada, no una filtració demostrada.

La majoria de cares del Xat ja passen per `CaraXat.jsx:42`, que descarta resultats encara opacs, amb prova adversarial existent. Excepció concreta: l'avatar propi de `FullAjustos.jsx:367` usa AvatarResolt. No s'ha de generalitzar el defecte a totes les files i al rail.

La prova antiga d'Avatar exigix precisament conservar l'URI opac a l'`img`. Cal canviar eixe contracte de presentació i cobrir resolució correcta, signatura fallida i fallback; **les referències opaques han de continuar sent vàlides com a dades emmagatzemades**. El tall inicial de XatSection tampoc cobria tota l'entrada real de l'amfitrió: un mock no exposava `consumixEntrada` i l'altre l'anul·lava. Un test verd d'eixa superfície no substituïx la nova prova amb poble, sessió i entrada real.

### C4-TPV-01 · P1 · Es continua venent dins d'un torn congelat al disc

**Defecte reproduït, anterior a l'onada.** `ProveidorBar.jsx:375` desa primer el torn tancat i després les metadades. `opera` només actualitza React quan tota l'operació acaba bé. Si falla `desaMeta('traspas',…)`, el disc conserva `tancat` mentre la memòria conserva `obert`; la guarda de venda consulta la memòria.

Reproducció amb el Provider real i magatzem sintètic: preparar una comanda de 130 cèntims, injectar un únic rebuig de `desaMeta`, executar `tancaTorn()` i després `paga()`. Resultat:

```json
{"before":{"ok":false,"error":"NO_DISPONIBLE","memory":"obert","disk":"tancat"},"saleOk":true,"receiptTotal":130,"frozenTotal":0,"diskReceipts":1}
```

La venda queda fora del resum congelat. L'avís recomana recarregar però no impedix operar. Recarregar abans de continuar evita la venda; després no reconstruïx el resum congelat. **Reparació requerida:** transacció conjunta del tancament o recuperació explícita que impedisca operar després d'una persistència parcial i reconcilie el resultat. No s'ha tocat el codi.

### C4-TPV-02 · P1 · Dues vendes diferents reben el mateix número després d'una fallada parcial

**Defecte reproduït, anterior a l'onada.** `bar/magatzem.js:196` inserix el tiquet i després esborra la comanda en una altra operació. Si falla l'esborrat, `tancaDesada` no reconcilia la memòria (`ProveidorBar.jsx:197`). El següent número es calcula sobre els tiquets que esta memòria encara veu.

Reproducció: preparar dues comandes; rebutjar una sola vegada `base.esborra('comandes',…)` en cobrar la primera; cobrar la segona sense recarregar i intentar de nou la primera.

```json
{"after":{"ok":false,"error":"NO_DISPONIBLE","memory":[],"disk":[["c-1",1]],"orders":["c-1","c-2"]},"secondOk":true,"retryError":"JA_TANCAT","disk":[["c-1",1],["c-2",1]],"memory":[["c-2",1]]}
```

`JA_TANCAT` impedix reescriure el mateix tiquet i `carrega()` reconcilia la comanda sobrant; cap de les dues garanties evita la numeració duplicada si es continua abans de recarregar. No s'ha reproduït un càrrec bancari duplicat: el Bar registra una confirmació humana de targeta. **Reparació requerida:** tancar comanda i reservar numeració amb garanties de persistència comunes, o tractar el resultat parcial com a bloqueig recuperable abans de la pròxima venda.

### C4-TPV-03 · P2 · La revisió es comprova fora de la transacció entre pestanyes

**Defecte reproduït condicionat a no disposar de Web Locks.** `bar/magatzem.js:189` comprova `rev` abans d'escriure el tiquet i després esborra la comanda sense tornar a comparar-la. `utils/magatzemLocal.js:523` permet dues escriptores quan no hi ha Web Locks; també hi ha fallback quan la petició del bloqueig és rebutjada.

Reproducció Node amb dos magatzems, IndexedDB fals compartit i `navegador:{}`: preparar rev1/130; pausar el primer abans d'`actualitza('tiquets',…)`; el segon desa rev2/260; reprendre el primer.

```json
{"modes":["escriptora","escriptora"],"acceptedEdit":{"rev":2,"total":260},"closed":{"rev":1,"total":130},"orderRemaining":false,"receipts":[["c-1",130]]}
```

La modificació acceptada desapareix. La cua d'una instància no coordina dues pestanyes. **No s'ha demostrat la carrera amb Web Locks funcionant.** La comprovació de revisió, inserció de tiquet i retirada de comanda necessiten una transacció comuna, o el mode sense bloqueig ha d'impedir una falsa exclusivitat d'escriptura.

### C4-TPV-04 · P2 · La devolució anunciada per al torn següent no està disponible

`Tancament.jsx:199` diu que les correccions es fan amb devolucions al torn següent, però `ProveidorBar.jsx:327` només busca entre els tiquets del torn actual, igual que la vista. Reproducció amb el Provider real: venda → tancar torn → llegir traspàs → obrir torn següent → retornar la venda anterior.

```json
{"refundOk":false,"error":"NO_TROBADA","oldReceiptExists":true}
```

Limitació funcional prèvia amb promesa incorrecta a la UI, no corrupció de dades. Cal una devolució vinculada amb consulta de l'històric i control acumulat d'allò ja retornat, o corregir la promesa fins que existisca. No s'ha implementat ací.

### C4-INT-01 · Estat real de l'enllaç TPV–Rebost–Gestoria

| Tram | Garantia que sí existix | Allò que no es pot acreditar |
| --- | --- | --- |
| Venda → tiquet | Nucli en cèntims, preu/cost/IVA congelats, base local `sdp-bar` | Atomicitat conjunta davant les fallades anteriors |
| Tiquet → consum | `bar/nucli/consum.js` calcula consum teòric i el mostra al full | Descompte d'existències; el fitxer diu expressament que no el fa |
| Recepta de la venda | Cost congelat en línia | Composició congelada: es consulta la carta actual, i modificadors exclosos per decisió documentada |
| Nevera/Rebost | Base separada `sdp-nevera`; estats qualitatius `hi-ha`, `se-n-acaba`, `acabat` | Llibre quantitatiu connectat a la venda |
| TPV → Gestoria | `Torns.jsx:95` exporta el contracte neutre `sdp.vendes.v1` | Importador d'ingressos, apunts comptables o idempotència del consumidor; encara pendents |
| Partida doble | No se n'ha identificat cap assentament en este flux | Assentament equilibrat i persistent vinculat a cada venda |
| Anul·lació/devolució | Anul·lades excloses; devolució immutable vinculada, signe intern negatiu i exportació tipada | Retorn automàtic d'ingredients; s'exclou expressament perquè el plat ja s'ha preparat |
| Mou/dividix | Detecció i avís de moviment parcial entre dues escriptures | Atomicitat: la decisió anterior és detectar i avisar, no reparar d'amagat |

`gestoria_port_bancari.md:82` documenta explícitament que TPV i Rebost encara no entren al llibre. La clau futura `origen.app/origen.establiment/venda.id` és un contracte acordat, no un consumidor implementat. L'absència d'eixe endoll és **treball pendent reconegut**, no una regressió que haja provocat el pegat de Xat.

Per a una entrega futura caldrà demostrar: idempotència després de reintents, imports en enters, una sola regla de desglossament d'IVA, venda/anul·lació/devolució vinculades i estat recuperable davant fallades entre exportació i importació. Si els mòduls persistixen per separat, cal especificar la reconciliació; no anomenar-la transacció atòmica de tres magatzems. La comunicació ha de passar per contractes neutrals sense imports circulars entre apps, i Sollutia continua només com a font GET per la Frontissa.

### C4-GEM-01 · Correccions factuals i condicions de les propostes de Gestoria V3

- Confirmats el reconeixement de `F26 0001` i la guarda contra sèries confusibles amb el llegat a `facturacio/serie.js`. El càlcul de 303/130 correspon a `impostos/nucli/impostos.js:137,177`, no a `serie.js`, i les targetes els consumixen com a estimacions. La v2 de Gemini ja situa el càlcul en la vista d'Impostos. No és una verificació fiscal ni una declaració presentada; l'etiqueta proposada «130 / IS» no acredita un motor d'IS al codi auditat.
- Confirmats Contactes `enObres` a `tauler/ShellGestoria.jsx:125` i la Font de l'Escàner conservada en memòria que es perd en desmuntar `useEscaner`. La persistència automàtica és una proposta nova, no una reparació ja lliurada.
- La proposta de guardar un `FileSystemDirectoryHandle` al cofre no encaixa directament amb el contracte actual: `cofre.js:471` xifra valors JSON i `cripto.js:362` usa `JSON.stringify`. Cal definir persistència específica de la capacitat, revalidació de permisos, revocació/oblit i relació amb desbloqueig; no donar per recuperat un handle a partir d'un JSON.
- Un canal DEV de lectura financera necessita contracte d'accés, origen, abast i cancel·lació. `vite.config.js:61` declara `host:true`: no es pot inferir que «DEV» equival a accessible només des del procés local. Açò és una mancança de la proposta, no un endpoint vulnerable implementat i reproduït.
- La comparació amb Holded/FacturaDirecta i l'avaluació del nombre de donuts no aporten captures, recorreguts mesurats ni fonts al lliurable. Servixen com a criteri editorial proposat, no com a benchmark verificat. No s'ha fet recerca comercial externa en esta auditoria.

### C4-GEM-02 · Proposta v2 de graf, trasllats i PWA rebuda; traçabilitat incompleta

El recompte físic aclarix la xifra: l'arxiu té **386 entrades de primer nivell: 352 fitxers i 34 directoris**. Recursivament són 688 fitxers, dels quals 594 Markdown; 348 Markdown al primer nivell. Per tant, «386 fitxers auditats» no és un inventari exacte. El recompte és de metadades i no implica lectura íntegra dels 688.

**Actualització:** la v2 de l'informe 0148 sí conté censos agregats, GRAF-01..04, proposta de trasllat, roadmap APP/WP i tres tractors en blocs de codi. Rectifica l'absència de lliurable observada en el primer tall. Encara no hi ha manifest individual dels 386 elements, matriu de dependències ni traça document→decisió→destí que sostinga que tota la destil·lació ja està feta. Les xifres agregades 386/688/594 coincideixen amb el cens físic; això no demostra la conclusió de destil·lació completa.

**P2 de proposta — «només cal preservar una taula» és insuficient.** L'arxiu ja queda fora del corpus operatiu (`document-corpus.mjs:9–20`), però continua sent destí d'enllaços (`:42–58`) i el compilador el cataloga expressament (`compile-wiki-to-app.mjs:165`). L'índex actiu conté referències físiques cap a eixe directori. Externalitzar-lo requerix migrar i verificar resolució d'enllaços i eines; una taula cronològica no substituïx eixe contracte.

La proposta de moure **tota** producció com a referència visual també omet dependències: `tooling/gates/tractor-graella.mjs:26` necessita `contracte_graella.md` i donaria `fitxa-absent`; `src/components/PedraSeca/qualitat.alergens.test.js:388` omet tres proves de fidelitat si desapareix `alergens_svg`. A més dels gràfics, el cens forense inicial identificà vint àudios Opus entre els `.img`. No és un conjunt exclusivament visual. Qualsevol decisió de trasllat necessita la matriu element per element ja iniciada en l'informe 0002 i la comparació de proves omeses, sense moure originals unilateralment.

El diff actual d'Obsidian només canvia l'escala del graf; no acredita poda. 810 Markdown menys 594 deixen **216**, no aproximadament 198 sense una altra operació especificada. La vista pot mostrar també etiquetes i adjunts: el recompte Markdown no és automàticament el nombre de nodes visibles. No s'han reproduït els 81 orfes/119 etiquetes perquè falta el cens individual i el programa de còmput. Un node orfe no prova que un original siga prescindible.

**P2 de proposta — ruta d'entrada PWA/nativa incompatible amb el mecanisme citat.** El manifest té una sola icona 180×180, com indica Gemini. Però la ruta proposada `/#sdp=/xat` pertany a l'amfitrió amb router en memòria: `PedraSecaEmbed.jsx:351` condiciona la sincronització del fragment a `router.memoria`; les entrades pròpia i nativa usen `browser` i el pathname. A més, `vite.natiu.config.js:93` elimina expressament el manifest PWA. Cal separar build pròpia, embed, PWA i embolcall natiu i provar l'entrada real de cadascun; canviar el manifest no configura per si sol totes les entrades.

Ja existixen `public/manifest.webmanifest`, `public/sw.js` i `src/pwa/registre.js`. Això acredita infraestructura PWA, no empaquetat natiu ni acceptació en cap botiga. El roadmap rebut requerix permisos, dades locals, funcionament sense connexió, actualització i recuperació de versions, mantenint Model B. Els requisits externs de botigues, versions proposades i «Tested up to» no s'han contrastat externament ni amb builds; no queden certificats per este dictamen.

### C4-GEM-03 · P1 documental · Nou noms de skills de la taula no existixen

La v2 afirma haver llegit íntegrament 36 skills, però el seu inventari només coincidix en **27** amb les 36 carpetes actuals. El cens real per prefix és **22 `core-*`, 10 `sdp-*`, 4 `wiki-*`**, diferent dels 8/22/6 declarats. No s'ha de confondre prefix amb el camp de rol: el recompte de rols core/plugin és una altra dimensió.

No existixen les nou rutes inventariades `core-memoria-immortal`, `sdp-architecture`, `sdp-bessons-digitals`, `sdp-botiga`, `sdp-calendari`, `sdp-clon-gnucash`, `sdp-gestio-projectes`, `sdp-gestoria`, `sdp-ui-design`. S'ometen nou que sí existixen: `core-context-panic`, `core-edicio-segura`, `core-empaquetat-wp`, `core-identitat-visual`, `core-memoria-historica`, `core-neteja-brossa`, `core-restauracio-segellada`, `core-telemetria-huma`, `wiki-cicle-de-vida`.

Reproducció sense mutacions: comparar els noms de les files de la taula amb `.agents/skills/*/SKILL.md`. Cal refer el cens amb rutes i empremtes reals abans de donar per feta l'auditoria completa o decidir fusions. Esta troballa qüestiona la cobertura documental declarada; no demostra un defecte de les nou skills omeses.

### C4-GEM-04 · P2 · Els tres tractors lliurats poden donar exit 0 sense executar-se

Els tres blocs JavaScript v2 usen `if (import.meta.url === \`file://${process.argv[1]}\`)`. En rutes amb espais, com l'arrel real `Som de Poble`, la URL del mòdul conté `%20` i l'argument del procés conserva l'espai. La condició no entra.

Reproducció: extraure els tres blocs **sense canviar-los** a `/private/tmp/codex gemini tractors 261014/tractor{1,2,3}.mjs` i executar-los amb Node. Els tres donen `exit=0`, stdout buit i stderr buit. Amb un fitxer sintètic `991231_2359_futur.md`, el tractor temporal continua ixent 0; importar la funció i cridar-la directament detecta el mateix cas amb `ok:false`. Per tant el CLI no està fent la comprovació.

El tractor de portaveu té una segona evasió reproduïda: la frase «No som una startup» en qualsevol lloc del fitxer anul·la també les denúncies de `blockchain`, `web3` i `metavers`, perquè la mateixa excepció global està dins del bucle de tots els patrons. Tres documents sintètics amb eixa frase, els tres termes i els pilars retornen `ok:true` en invocació directa.

Cal corregir detecció del punt d'entrada amb conversió URL/ruta, acotar l'excepció al terme i context adequats i afegir casos adversarials abans d'incorporar-los. El tractor de llegibilitat només recorre el primer nivell de les tres carpetes; tampoc acredita tota la documentació pública ni calcula paràgrafs que ocupen més d'una línia. Els blocs estan en un informe i no s'han instal·lat en `tooling/gates/`.

### C4-GEM-05 · P1 de proposta · L'assentament Z descrit ignora devolucions i no defineix atomicitat

La transacció B proposa incrementar Caixa amb `resum.vendesPerMetode.efectiu`. Eixe camp és **brut**, separat de `retornatPerMetode` a `bar/nucli/torn.js:113–114`. Experiment amb les funcions pures reals: vendre un tallat de 130 cèntims en efectiu i retornar-lo íntegrament en el mateix torn dona:

```json
{"vendesPerMetode":{"efectiu":130,"targeta":0,"altre":0},"retornatPerMetode":{"efectiu":130,"targeta":0,"altre":0},"efectiuEsperatCents":0,"incrementProposatGemini":130}
```

La recepta comptabilitzaria +130 quan el moviment net és zero. A més, `exportaTancament` només exporta la devolució global, no el retorn per mètode, i el seu resum no inclou desglossament d'IVA; no és suficient per reconstruir totes les dades que la proposta li atribuïx. Ja existix el contracte neutral de vendes `sdp.vendes.v1`, amb vendes i devolucions tipades; la nova proposta ha de justificar com s'hi encaixa i com conserva tipus d'IVA, identitat, devolucions i idempotència. `aSentinella() === null` remet a l'antic contracte dels sentinelles, no prova l'absència de tot contracte entre aplicacions.

Tres operacions pures més un bus sobre IndexedDB/LocalStorage **no constituïxen per si soles una transacció atòmica**. El pont `pontOperatiu.js` encara no existix. La v2 no especifica commit comú o registre durable amb reintents, deduplicació i reconciliació dels tres consumidors. Tampoc definix comptes de càrrec/abonament equilibrats. La baixada d'estoc projectada pressuposa un inventari quantitatiu que la Nevera actual no té, i el consum usa la composició actual: cal una instantània o una política explícita abans d'aplicar-lo a existències persistents.

Són defectes de l'especificació rebuda, no imports comptables erronis ja executats. El límit correcte és completar i provar el contracte abans d'implementar el pont, mantenint la separació modular.

### C4-GEM-06 · Afirmacions d'enxufabilitat que cal precisar

`fs.existsSync` en el compilador multimèdia proposat només comprova existència local: no acredita HTTP 200, publicació, ruta resolta ni permisos de lectura del navegador. Cal distingir validació física del manifest i comprovació de càrrega del paquet desplegat.

La identitat de l'amfitrió no està exclusivament codificada a mà: `pobleAmfitrio.js:32`, `pobleDeConfig`, ja consumix `poble` i `nomPoble` declaratius. Un manifest HTML pot ampliar el contracte, però no s'ha de presentar com a primera possibilitat de configurar el node. Els traductors de nous recursos Sollutia continuen condicionats a captures reals, fixtures i contractes; cap proposta autoritza inventar endpoints ni modificar el port neutral.

### VIG-C4-01 · Despertar 00:54 UTC: XAT-02 en curs i defecte residual C4-XAT-03

No hi ha informe final de Claude ni tancament de la nova onada. Índex, Acta, plans i informes aliens conserven el tall anterior; Gemini v2 continua amb SHA-256 `b9ab1fb4816a320be7389ba06145d10d30a8a9d44e0861d797904a749003f6eb`. No s'han repetit les auditories de Gemini ni les reproduccions del Bar perquè no hi ha canvis associats. HEAD continua `021a03eabf9c11a1bd3dd32eb55b58e4fd1e8929`.

El nou diff extrau `esMitjaOpac` a `src/utils/mitjaOpac.js` i l'aplica a Avatar, AvatarResolt i `fontSegura`; CaraXat manté la reexportació. Les proves noves verifiquen inicials quan la resolució privada torna la cadena opaca, inicials sense cridar el port si falta la capacitat `mitjans`, i conservació del DOM per a URLs vàlides. No hi ha imports de seccions des de Pedra Seca ni canvi del port o dels permisos. XatSection només canvia un comentari; `i18n.js` canvia cinc etiquetes de «Notes personals» a «Bloc de notes» i equivalents, sense alterar fluxos.

**C4-XAT-03 — P2 residual al tall 00:54; corregit en VIG-C4-03.** En esta reproducció històrica, `mitjaOpac.js:20` usa `startsWith('sdp-media://')`, sensible a majúscules; `sanitize.js:179` admet l'esquema amb `/i`. Reproducció amb `resolRecursPropi`, el sanejador, `fontSegura` i Avatar reals, carregats amb Vite SSR i renderitzats amb React:

```text
Entrada: SDP-MEDIA://mitjans_privats/t/u/f.webp
resolRecursPropi → SDP-MEDIA://mitjans_privats/t/u/f.webp
esFontImatgeSegura → true
esMitjaOpac → false
fontSegura → SDP-MEDIA://mitjans_privats/t/u/f.webp
Avatar → <img src="SDP-MEDIA://mitjans_privats/t/u/f.webp">
```

També reproduït amb `sDp-MeDiA://mitjans/t/u/f.webp`. Les proves afegides no cobreixen eixa variant. Cal reconéixer l'esquema amb la mateixa regla de majúscules que el sanejador i provar-lo a les fronteres de renderitzat, mantenint les referències admissibles com a dades.

**Abast:** el productor normal genera minúscules; la reproducció injecta una entrada externa/importada que conserva una altra caixa. No s'ha observat en producció ni es demostra una regressió de permisos o una filtració. És cobertura incompleta de la reparació, no una nova fallada d'autorització. El hook `useResolvedAsset` continua donant `ready` a una cadena opaca: les guardes d'estes peces no acrediten protecció universal de tots els consumidors del hook.

S'han executat una vegada les quatre suites noves (**15/15 PASS**) i, com a complement justificat pels canvis, Avatar i CaraXat (**17/17 PASS**). Els onze fitxers del front conservaven les mateixes empremtes abans/després i al final. No es repeteix XAT-01 ni la suite global.

```sh
node node_modules/vitest/vitest.mjs run src/utils/mitjaOpac.test.js src/components/PedraSeca/qualitat.mitjaOpac.test.js src/components/PedraSeca/organismes/marca.test.jsx src/components/universal/identitat/AvatarResolt.test.jsx --maxWorkers=2
node node_modules/vitest/vitest.mjs run src/components/PedraSeca/atoms/Avatar.test.jsx src/sections/xat/components/CaraXat.test.jsx --maxWorkers=2
```

| Font revisada | SHA-256 |
| --- | --- |
| `src/utils/mitjaOpac.js` | `7546a2b7ae8d1f3b4ea5f7b87dc0d611bc21361af57e8a28081ec077d3052da4` |
| `src/components/PedraSeca/atoms/Avatar.jsx` | `b8576b22a47c9465acb56e4892054b7ec66d1587af5faa46b81d1f4037724b84` |
| `src/components/PedraSeca/organismes/marca.jsx` | `e93b69ac22e2171e6cb7e094945baf034a2a6c82aa3d2f149bb36b4fa24a4e8f` |
| `src/components/universal/identitat/AvatarResolt.jsx` | `243a1b7ddcf3a7c2d409271b7b7600acdefb1c7f77d82c2acc0d82627809a76b` |
| `src/sections/xat/components/CaraXat.jsx` | `745c16d0e65c53313ac065870f4cceac3836fd0151516cb5a156ea4bc61bbafd` |

Nou punt de comparació de lectura: `/tmp/sdp-consell-261014-vig0054-code.json`, 2.513 rutes, SHA-256 `f334aafe5688e75fedd991c2ee9166d79e22b002af6194b8d356538b7b496c14`. És el tall 0235 amb les 15 rutes revisades actualitzades; no incorpora canvis aliens no auditats ni significa aprovació del defecte residual. Els documents aliens mantenen les empremtes anteriors.

La reproducció SSR ha acabat amb exit 0 i servidor tancat; l'avís HMR `EPERM` no ha impedit el render comprovat. No hi ha processos residents nous. Esta activació només actualitza el dictamen; manté el planificador de 15 minuts i no altera codi, originals o governança.

### VIG-C4-02 · Despertar 01:09 UTC: focus de XAT-01 verificat

Continua sense haver-hi tancament de la nova onada ni informe final nou de Claude. Els documents aliens, l'última Acta i el primer ESTAT_ACTUAL conserven el context anterior. Gemini v2 no ha canviat. El registre de tasques conserva SHA-256 `02325586b58edfcc601b7c932eca47b95839a854121c98f612e5935aabd91aba` i l'índex de skills `df1ec5ada5323dc70c33b8ff7f3f16f00de0f56a6858d1c8f41566da27d4ec61`; no hi ha nou pegat de consola a contrastar.

**Nou canvi revisat:** EntradaDelPoble delega la navegació al callback `onEntra`. XatSection construïx la consulta i marca la comunitat com a prèvia quan el focus és extern o absent dins del Shadow DOM; així l'efecte de la fitxa no el pren a la pàgina amfitriona. Si desapareix el cercador propi que tenia focus, es conserva la recol·locació a la fletxa de la fitxa. El callback actualitzat es llig d'una ref i no reinicia la decisió a cada render.

**Verificació:** EntradaDelPoble, XatSection.revisio260930 i XatSection, **3 suites / 143 PASS**, 25,32 s, `maxWorkers=2`, una sola execució. Les proves inclouen amfitrió amb Shadow DOM tancat i input extern, recuperació del focus intern, tornada sense reobertura i canvi de callback entre renders. Els cinc fitxers de codi/prova comparats tenen el mateix hash abans/després; cap mutant observat. No s'ha identificat un defecte nou en este tall. La prova amb navegador simulat no acredita el desplegament remot.

```sh
node node_modules/vitest/vitest.mjs run src/sections/xat/components/EntradaDelPoble.test.jsx src/sections/xat/XatSection.revisio260930.test.jsx src/sections/xat/XatSection.test.jsx --maxWorkers=2
```

| Font | SHA-256 verificat |
| --- | --- |
| `EntradaDelPoble.jsx` | `6c614e578dec5edc158d0d0d4ccfc89f148e73801be45ecb58a3d3dea5266e12` |
| `EntradaDelPoble.test.jsx` | `83bdbf379a50f1615f514f901c6b6c459ebae03f824f0ae4bad6d507bc384d83` |
| `XatSection.jsx` | `0321ec527978fbeb48878a55422ded170e89d154e3b8d187904cb931f435fba1` |
| `XatSection.revisio260930.test.jsx` | `f3725092314d7bcca8dd030dfc506fbe6646559255b7c855cc150767c99c4777` |
| `XatSection.test.jsx` | `e739410419392e19ab225b008851008112f27503ebc2903113f9da61eb672337` |

L'altre delta és `src/css/components.css`: posa els botons dels peus de calaix en columna i a amplària completa, amb `gap` del sistema. Revisió estàtica: selectors limitats als calaixos, sense nous colors literals ni estils inline; afecta tots els calaixos que tinguen peu. No s'ha fet una comprovació visual de navegador ni s'atribuïx un defecte de disseny sense reproducció. Hash `0354fb796da1ee336d2a31bd2d1b45179d009d58c764377a10dbc66eee819634`.

XAT-02 i els nuclis TPV/Rebost/Gestoria no canvien respecte del tall anterior; no es repeteixen eixes suites. El cas residual de majúscules C4-XAT-03 continua obert. Tampoc s'executa la suite global mentre manca l'entrega final.

Punt de comparació següent: `/tmp/sdp-consell-261014-vig0109-code.json`, 2.513 rutes, SHA-256 `769bb7e0f11fc72ae9e882f28d524530fe646bf1a179662f49cbccef2cda4c37`. Deriva del tall VIG-C4-01 actualitzant només les cinc rutes amb nou diff revisat. No s'han modificat codi, originals ni governança. Cap procés o subagent propi queda executant esta comprovació; el monitor continua en el planificador.

### VIG-C4-03 · Despertar 01:24 UTC: C4-XAT-03 corregit

**No hi ha tancament d'esta onada.** S'ha llegit íntegrament el nou `261014_0320_auditoria_claude.md`: el cos declara contingut i verificació pendents, i Troballes, Verificació i Límits contenen `[pendent]`. És una bastida documental, no una entrega final; esta conclusió es basa en el contingut, no en l'etiqueta `esborrany`. SHA-256 `073e04ffe6c2f91678ba24023775c3c97c4ba98b0afa97ccf0ec6cae842ac9fe`, 1.802 bytes. L'índex afegix l'àncora de Claude 0320 i s'ha llegit complet; SHA-256 `48e4ce0158510de79cb4b878fde39a9fd08450613079fa13902df718fb9e44e9`.

**Correcció verificada de C4-XAT-03:** `src/utils/mitjaOpac.js:21–24` reconeix ara l'esquema amb `/^sdp-media:\/\//i` després de `trim()`. Avatar i marca inclouen `SDP-MEDIA://` i `sDp-MeDiA://` en les proves de DOM/fallback (`Avatar.test.jsx:82`, `marca.test.jsx:24–25`); CaraXat comprova també la variant en majúscules (`CaraXat.test.jsx:54`). Les referències continuen admeses pel sanejador com a dades, però estes fronteres no les posen en un `img`. No es relaxen els orígens ni els permisos. `sanitize.js` i `XatContext.jsx:1358` només canvien comentaris; el segon explica la nova entrada per la fitxa de comunitat.

**Verificació acotada:** una passada de 7 suites, **74/74 proves PASS, 0 fallades, cap omissió indicada**, 15,72 s, `maxWorkers=2`; tretze hashes iguals abans/després. Inici 03:25:39 CEST. Cobreix fonts vàlides, variants de caixa, fallback privat, absència de capacitat i fronteres d'importació. No s'ha identificat cap regressió nova en este tall. El verd no certifica tots els consumidors de `useResolvedAsset`, ni substituïx una suite global associada a l'entrega final.

```sh
node node_modules/vitest/vitest.mjs run src/utils/mitjaOpac.test.js src/utils/sanitize.test.js src/components/PedraSeca/qualitat.mitjaOpac.test.js src/components/PedraSeca/atoms/Avatar.test.jsx src/components/PedraSeca/organismes/marca.test.jsx src/components/universal/identitat/AvatarResolt.test.jsx src/sections/xat/components/CaraXat.test.jsx --maxWorkers=2
```

Evidència de ferramenta del subagent d'este xat: resultat `79d03e`, sessió acabada `64220`, hashes previs `9f17f9` i posteriors `782ef0`. No s'ha creat un log separat a `/tmp`; el resum, la comanda i les empremtes queden ací. A més dels cinc fitxers de mitjans canviats de la taula següent, la comprovació pre/post inclou els quatre components amb les empremtes de VIG-C4-01 i estos quatre tests inalterats: `mitjaOpac.test.js` → `37a90ad0f332a09c23ae259c60543dd6f6f4ebb625a5e98d54711201ea9c5f47`; `sanitize.test.js` → `6047ba837edfe451d98c32f739122ca3c0932f8a3b6e83dac99bff0a03d43ccb`; `AvatarResolt.test.jsx` → `cd42d4b255c5c929ce1bf6750441846e10c2e211f61f4f121e4611ec6f436aca`; `qualitat.mitjaOpac.test.js` → `9d897ed09e7e0038c3c3c0d43750fafde7161f47b6359a2d81d44d8a1ed5598b`.

| Delta revisat respecte de VIG-C4-02 | SHA-256 |
| --- | --- |
| `src/utils/mitjaOpac.js` | `5d57abe92d33758f5355badd70bd0f7f40f26bf42ceed76854c47ecc1f922c53` |
| `src/utils/sanitize.js` | `d17f0a2a6f39160f6ff37f1a9a7382fcf7e487c0895eab177a0ebef27738b56c` |
| `src/components/PedraSeca/atoms/Avatar.test.jsx` | `81f32d12295b2a91b49911b1cd9174c73bf6772544b84c0d2fde89c45a927b19` |
| `src/components/PedraSeca/organismes/marca.test.jsx` | `a7411ce94dd87f31318061b5918654943de14ab0668e8badc80fcbc446efa307` |
| `src/sections/xat/XatContext.jsx` | `b27266923aacba1923c931745693c5282e583306712e42660a5ff11af9d6d193` |
| `src/sections/xat/components/CaraXat.test.jsx` | `9edbe156e99594088bbbacabcd6094d4835b05134f66c62555e1d9aa1953f13f` |

Gemini v2, el pla 0210, el registre de tasques i l'índex de skills conserven les empremtes anteriors; no hi ha nova proposta ni reparació de consola a auditar. Els nuclis TPV/Rebost/Gestoria no canvien; els defectes ja reproduïts continuen sent deute pendent. No s'han repetit les suites de focus, atomicitat ni la suite global.

Punt de comparació següent: `/tmp/sdp-consell-261014-vig0124-code.json`, 2.513 rutes, SHA-256 `dc74d1cedab619950cb1960630b298a44c8ff5839dcba56f3a6c7f3890add7fa`. Actualitza només les sis rutes revisades del tall VIG-C4-02. Cap edició de codi, originals, documents aliens ni governança; cap procés propi queda en execució. La vigilància continua únicament amb el planificador de 15 minuts.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Fonts, tall i mètode

Lectura de l'última Acta 0130, primer bloc vigent d'ESTAT, AGENTS i govern documental, i documents actius complets de l'Escriptori (índex inclòs). Genotip, índex mestre, taxonomia i estudi del laboratori ja llegits en la mateixa sessió. Els informes de tercers s'usen com a evidència; no amplien l'autorització humana.

Tall inicial **14-10-2026, 02:35 CEST**, HEAD `021a03eabf9c11a1bd3dd32eb55b58e4fd1e8929`. Les 2.300 rutes de codi del tall anterior 0137 estaven intactes. S'ha creat un inventari ampliat de 2.508 rutes (`src`, `tooling`, `scripts`, `tests`, `supabase`) a `/tmp/sdp-consell-261014-0235-code.json`, SHA-256 agregat `dc36342892c324bc0572bf932449e9c82620c2005235128a7f56149166c4654c`. És una còpia diagnòstica temporal; este informe és la memòria canònica.

| Comprovació | Resultat i abast |
| --- | --- |
| Porta Olivera prèvia | PASS, cap falta d'àncora; avisos de mida de l'índex i seccions buides |
| Xat inicial: EntradaDelPoble, XatSection, XatSection.avatars, CaraXat, Avatar, scopedHooks, sanitize | 7 suites, **192 PASS**, 9,07 s; requisits anteriors al pegat |
| Bar: magatzem, cobrament, tiquet, torn, consum, fullTancament | 6 suites, **64 PASS**, 759 ms; no descarten fallades parcials absents de les suites |
| Provider real amb fallades sintètiques | **3/3 reproduccions confirmades**, 10,45 s amb log; són proves que constaten defectes, no salut funcional |
| Dos escriptors sense Web Locks | 1 carrera reproduïda amb IndexedDB fals compartit, sortida indicada a C4-TPV-03 |
| Mapa de tasques | Simulació pura: tres `desconegut` passen a `viu` només afegint declaració de script |
| Skills | 36/36, zero avisos de disparadors al tall consultat |
| Pegat XAT-01 durant edició de Claude | 3 suites, 139 PASS; **sense atribució al tall final**, perquè les fonts han canviat durant l'execució |
| Gemini v2: cens de skills | 36 files, només 27 coincidències; 9 noms absents i 9 carpetes omeses |
| Gemini v2: tractors | 3 CLI amb exit 0 sense cap execució; funció temporal directa detecta fixture futura; evasió del portaveu reproduïda |
| Gemini v2: transacció Z | Venda i devolució de 130 cèntims: saldo net 0, increment brut proposat +130 |
| Originals protegits | Rehash posterior: 297 + 477 fitxers, cap modificació, falta ni alta respecte del tall inicial |
| Document propi | `document.mjs check` PASS després de l'ampliació v2; enllaços històrics corregits a ruta relativa física |
| Circuit de relleu | ESTAT/LEDGER amb torn present, signatura LEDGER i segell vàlids; lease consumida, cap claim pendent |
| Tancament, només `--check` | Olivera, plantilles, autoritat, LEDGER, segell, skills i wiki: exit 0. SCC global continua amb incidències; també es detecta codi concurrent fora de l'abast documental del torn. No s'ha forçat ni declarat el tancament |
| Suite global de 17.458 | No repetida: l'entrega nova encara no és estable ni final |

Comandes de les comprovacions específiques del Bar, executades des de l'arrel del repositori:

```sh
node node_modules/vitest/vitest.mjs run src/apps/bar/magatzem.test.js src/apps/bar/nucli/cobrament.test.js src/apps/bar/nucli/tiquet.test.js src/apps/bar/nucli/torn.test.js src/apps/bar/nucli/consum.test.js src/apps/bar/nucli/fullTancament.test.js --maxWorkers=2 --reporter=dot
node node_modules/vitest/vitest.mjs run --config /private/tmp/codex-atomic-tpv-20261014/vitest.config.mjs
```

Els cassets sintètics estan a `/private/tmp/codex-atomic-tpv-20261014/atomic.test.jsx`, amb configuració i logs `result.log` i `existing.log`. No s'han incorporat suites ni dependències al repositori. Les precondicions, punts d'injecció i sortides necessàries per reconstruir els experiments consten en les quatre troballes anteriors. Només dades sintètiques; cap cobrament real, xarxa ni document financer personal.

Empremtes de fonts estables verificades abans/després de l'auditoria del Bar:

| Ruta | SHA-256 |
| --- | --- |
| `src/apps/bar/estat/ProveidorBar.jsx` | `6bed887c0af91fe5fa50c8eebe48526e355511325f252594b947f589bf9a01c4` |
| `src/apps/bar/magatzem.js` | `b2874c1b35d3fe33d5dce31173fd28e93f5d6ffb5655396973af2a010b4144a6` |
| `src/utils/magatzemLocal.js` | `d230dc8d5701e2171b634e8995255658ac7a9d1b247b4e64da14be3048adbabb` |
| `src/apps/bar/nucli/consum.js` | `5d901421f2c1c17eee0ab7975bcf97b5effd494523f7147a18d4beb1b5f9fd5a` |
| `261014_0148_auditoria_gemini4.md`, v1 inicial | `5090952c0fd7b56d2b0f3154e5eee130aab0a1bf924dcd8abfa07bebe9f4110b` |
| `261014_0148_auditoria_gemini4.md`, v2 última auditada | `b9ab1fb4816a320be7389ba06145d10d30a8a9d44e0861d797904a749003f6eb` |
| `261014_0130_prompt_gemini4_auditoria_adversarial_extrema.md` | `13457842640ec82dde0e8513fd673345bff6995c3c1736dc7da49cdb969c8cbd` |
| `261014_0210_pla_implementacio_reparacions_xat_i_consola.md` | `84a6253891247c52f60945eeb352bf7a9ce08a08bde49ebe3f782aa93e2a8c39` |

XAT-01: versió inicial del component revisada `7e8586cd0708901ddd8906b89828295ee76c6bf43a26244539b90511bba2c04f`; últim component concurrent observat `bc9430931d2815d6d15a00ec8f1e6920229237868f6ddc2ba84010f45da7328b`, aparent mutant. Són empremtes d'observació, no versions lliurades o aprovades.

### Continuïtat de la vigilància

Automatització **Consell de quatre IAs — auditoria Codex cada 15 minuts**, identificador `consell-de-quatre-ias-auditoria-codex-cada-15-minuts`, **ACTIVE** verificat, vinculada a este xat. No hi ha bucle, espera activa ni procés resident de vigilància entre despertars. No es conserva l'antic monitor de l'onada 1930.

En cada despertar es llegiran íntegrament els documents actius nous o canviats i s'auditarà només el diff pertinent. La nova entrega estable de Claude ha de portar proves associades al seu tall; la suite global es contrastarà amb evidència real de la nova onada i es repetirà una vegada si falta una execució fiable. No es repetiran suites verdes sense canvis o una preocupació concreta.

Este informe s'actualitzarà només amb conclusions noves. Si MarIA l'arxiva, la continuació es crearà amb el circuit documental i l'anterior quedarà intacte. L'aturada correspon a un final inequívoc de **la nova onada del Consell**, que cobrisca el pla 0210 i les entregues Gemini posteriors a 0148 amb proves verdes, o a una ordre humana de parada. Els finals antics 0110/0148 no tanquen automàticament este encàrrec. En arribar eixa condició es cancel·larà només este monitor i s'alliberaran recursos propis; no s'exigirà resoldre deute SCC global alié. El punt de comparació següent és el tall de lectura VIG-C4-03, derivat dels anteriors només en les rutes revisades. No s'adopten mutants ni s'equipara «ja auditat» a «sense defectes»; l'acceptació final de l'entrega continua pendent.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Esta és una auditoria local d'evidència i un dictamen, no autorització per executar reparacions ni una certificació comptable o de desplegament. Els P1 de Bar justifiquen revisió abans de confiar-li operació real davant incidències de persistència; no hi ha evidència de pèrdua real de diners de persones.

No s'ha editat codi, dependències, plans aliens, fitxers originals de producció o laboratori, ni s'han traslladat arxius. Tampoc s'han instal·lat LaunchAgents, desplegat serveis o enviat missatges a altres xats. La cooperació de subagents es limita a este encàrrec. Les metadades de relleu i el document propi segueixen el circuit del repositori.

El tall protegit conté 297 fitxers de producció (224.912.711 bytes) i 477 de laboratori (14.257.230 bytes): 774 originals. El cens no substituïx una verificació del contingut complet d'una proposta futura d'arxivat. Les conclusions detallades dels 27 elements i les 19 entrades es mantenen a l'auditoria inicial arxivada; no s'han reexecutat simulacions de trasllat.

JSDOM comprova atributs i navegació simulada, no la càrrega real d'imatges ni el desplegament de gentdelatorre.net. La injecció de fallades confirma la resposta del codi a eixos punts; no mesura la freqüència d'una avaria física d'IndexedDB. La carrera multiinstància està limitada al fallback sense Web Locks. L'arbre compartit canvia mentre Claude prova mutants: cap resultat s'ha d'atribuir a un hash diferent del verificat.

Millora del procés documental: incloure en cada entrega tall/hash, diff, ordres, recompte PASS/FAIL/SKIP, incidències prèvies separades i declaració clara de parcial/final en el cos. El valor taxonòmic `esborrany` no basta per decidir si un informe declara el treball acabat. Una xifra global verda tampoc prova cobertura d'atomicitat si les suites no injecten les fallades que s'acaben de reproduir.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_0210_pla_implementacio_reparacions_xat_i_consola]]
- [[261014_0210_prompt_claude_reparacions_xat_i_consola]]
- [[261014_0130_pla_implementacio_auditoria_gemini4]]
- [[261014_0130_prompt_gemini4_auditoria_adversarial_extrema]]
- [[261014_0148_auditoria_gemini4]]
- [[261014_0320_auditoria_claude]]
- [[../90_arxiu_historic/261014_0002_auditoria_codex]]
- [[../90_arxiu_historic/261014_0110_auditoria_claude]]
- [[261014_0130_acta_marmota]]
- [[261013_1600_estudi_destil_laboratori_ia]]
