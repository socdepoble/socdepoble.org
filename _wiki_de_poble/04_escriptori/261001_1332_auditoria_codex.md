---
type: informe
status: esborrany
description: "Auditoria de Calendari i Enxufe, diagnòstic reproduïble de la Consola i proposta de telemetria i comunicació privada/publicable."
tags: [auditoria, codex, arquitectura]
visibility: private
---

# Auditoria Codex — Calendari, Consola Termodinàmica i Comunicació

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CODEX-261001-1332 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local; servidor existent al port 3340 |
| Creació | 26-10-01 13:32 CEST |
| Modificació | 26-10-01 13:42 CEST |
| Propietari | Mestre / Agents Locals |
| Plantilla | auditoria_canonica.md; ruta auditoria de protocolledge.json |
| Aprovació humana | Auditoria autoritzada pel pla aprovat i pel missatge directe; informe pendent de revisió |
| requires_human_decision | false per al diagnòstic; les implementacions proposades requerixen un torn amb abast propi |
| Model IA | Codex, família GPT-6; identificador exacte de la variant no exposat a esta sessió |
| Tokens consumits | No disponibles: l'entorn no exposa un comptador exacte atribuïble a esta auditoria. No equival a zero |
| Tall Git | HEAD 70ce2dfacac86dc1d1db89d33df8e8bce60fd236; branca backup-notes-publish; arbre amb canvis aliens sense commit |
| Tall numèric de la Consola | 2026-10-01T11:28:39.197Z, 13:28:39 CEST, abans de crear este informe |
| Tall dels fitxers crítics | Empremtes de les 13:30:40 CEST, detallades a Verificació |
| Rebut de procedència del pla | sdp:torn_c320797f-eb16-40bd-9ab3-46549ae407d4:30489088-d26a-401b-8e2c-d030374b7c69 |
| Rebut propi de l'informe | No generat: el pla autoritza una única escriptura, este informe; no es presenta el rebut del pla com a rebut de l'informe |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Pla llegit sencer i validat: `261001_1310_pla_implementacio_codex.md`, estat explícit **aprovat**, ancorat i amb rebut reconegut pel lector de torns. És una auditoria de lectura amb una única eixida documental. Esta instrucció específica preval sobre les escriptures auxiliars del protocol general: no he creat torns, canviat ESTAT, ancorat documents, arxivat res, segellat fitxers ni modificat codi.

He llegit AGENTS.md, genotip, índex de la Wiki, taxonomia documental, cervell, bootstrap, el relleu vigent i les rutes documentals. He llegit íntegrament els set Markdown del primer nivell de l'Escriptori —inclòs l'índex— i els documents Markdown dels seus subdirectoris de producció i investigació, inclosos els exemples NEXUS. La skill local `wiki-documentacio-i-reflex` i la plantilla canònica s'han consultat com a contracte documental, amb l'excepció d'escriptura indicada. Els exemples no s'han convertit en agents instal·lats.

El directori privat de comunicació s'ha comprovat només estructuralment: existix com a germà del repositori, amb un Markdown, sense subdirectoris ni enllaços simbòlics en l'inventari observat. No se n'ha llegit ni copiat el cos. L'anàlisi de confidencialitat es basa en la frontera del codi i del servidor.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- v1.0.0: auditoria amb lectura de codi, proves existents, consultes HTTP locals, verificació de la UI i experiments purs en memòria. Durant la revisió han aparegut canvis nous de Pantalla Completa, incorporats a l'avaluació. No són modificacions de Codex.
- Verificació final de les 13:40–13:41: 18 fallades en 37 proves d'integració després dels canvis entrants de copy i jerarquia. S'incorpora F13 i es rebutja el tancament del calendari actual, sense esborrar els resultats positius dels talls anteriors.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Veredicte i prioritats

**Conformitat parcial sobre les correccions T1–T4 del tall inicial; tancament del lliurament actual REBUTJAT.** Les correccions de regressions superaren les proves seleccionades, amb el deute funcional de Pobles indicat més avall. El mode de closca nou funciona en la prova interactiva local d'obertura, canvi de vista i Escape i supera les seues 19 proves noves. Tanmateix, la passada final de les dues suites d'integració dona **18 fallades i 19 èxits** després dels canvis entrants de copy/jerarquia: no és correcte presentar el calendari actual com completament validat. Tampoc té certificació Safari/iOS ni verificació d'un paquet WordPress desplegat. **No aprove declarar la Consola sana:** el contracte de crèdits trenca el pols i Vite servix fitxers interns per vies diferents de la Consola.

La hipòtesi «falten tractors que confirmen recepció i per això tot marca zero» només explica una necessitat futura de traçabilitat. No és la causa demostrada dels zeros actuals. El sistema mescla inventari estàtic, registre documental, heurístiques de processos i telemetria parcial; no disposa d'un model comú d'execució.

| ID / prioritat | Evidència i reproducció | Conseqüència | Proposta, sense executar |
| --- | --- | --- | --- |
| F01 · P1 | `consolaContent.js:68` exigix `consumit` i `limit` a totes les entrades; `PanellCredits`, a `ConsolaSection.jsx:150`, accepta també `tipus: ajust`. La font real té una quota i quatre ajustos. `normalitza(recullConsola())` llança `Resposta de consola invàlida: credits[1].consumit.`; visible a `/consola/pols`. | Cauen conjuntament consums, rebuts, skills i crèdits, encara que les altres dades siguen vàlides. HTTP 200 no significa contracte vàlid. | Unió discriminada quota/ajust, validació per tipus, contracte compartit productor-consumidor i error localitzat per panell. No substituir el fallo per zeros. |
| F02 · P1 | `vite.config.js:61,75`: `host: true`; `fs.deny` no exclou `.agents` ni l'Escriptori. GET local a `/.agents/manifest.yaml` retorna 200 `text/yaml`; al Markdown de l'auditoria de Claude, 200 `text/markdown`. | La protecció loopback de `/__iaia/*` no protegix les rutes de fitxers. Amb escolta a xarxa, hi ha risc d'exposició LAN si la xarxa/tallafoc permet l'accés. No he provat accés des d'un altre equip ni observe una exfiltració consumada. | Denegar fitxers operatius i privats en totes les vies de servei; loopback per defecte; exposició LAN explícita i protegida. Proves HTTP de denegació, no només exclusió del build. |
| F03 · P2 | `consolaContent.js:108` reconstruïx el DTO sense `estrategia_consum`, que el middleware sí retorna i la UI sí intenta llegir. Eliminant només els ajustos en una còpia en memòria, la normalització passa però perd l'estratègia. | Reparar F01 encara deixaria un camp invisible. A més, la targeta comptaria cinc «proveïdors» quan quatre files són ajustos. | Preservar i validar el camp; separar recompte de proveïdors, quotes i preferències. |
| F04 · P2 | `mapa/construeixMapa.js:372` només processa `contracte.llig` de skills. Una prova productor amb `contracte.escriu` + consumidor amb `contracte.llig` crea la lectura, però cap escriptura ni cadena. | Afegir metadades d'eixida sense canviar el compilador no repararà les cadenes. La promesa de la vista d'entrades/eixides excedix el lector actual. | Contracte versionat d'entrades, eixides i crides; implementar-lo en el compilador i verificar productor→artefacte→consumidor. |
| F05 · P2 | `construeixMapa.js:445`: una subtasca hereta `viu` del pare; un hook és viu si el text inclou el script. `estatDeLlancador` usa existència, antiguitat de logs i traces d'error. | Les dotze tasques «vives» no acrediten dotze execucions correctes. Un fill mai executat pot aparéixer viu. | Separar declarat, instal·lat, activitat observada, última execució i resultat verificat; rebut propi per cada pas. |
| F06 · P2 | `tooling/vite/consola-iaia.mjs:25`: lectura fallida→null, JSONL malformat→línia descartada, diari absent→llista buida; JSON invàlid de crèdits→null. | Una font corrupta o inaccessible pot semblar absent o buida. No tots els zeros són observacions vàlides. | DTO amb estat de font, motiu, línies descartades i hora observada. Mantindre l'última dada bona amb avís de caducitat. |
| F07 · P2 | `actorsMapa.js:62` agrega nodes hook i tasques git-hook; `construeixMapa.js:488` ja crea nodes hook per a estes. La UI mostra 17 candats. | Mescla controls i invocacions. Diverses tasques d'un únic pre-commit inflen la xifra i «10 no acreditats» barreja absència d'evidència amb negació. | Identitat única del control i llista d'accions separada; acreditat/no acreditat/desconegut explícits. |
| F08 · P2 | `tooling/wiki/lib/publication-policy.mjs:17`: sense `visibility`, un document dins de les arrels públiques pot publicar-se, també amb `status: esborrany`. Provat en memòria. | Traslladar un esborrany privat a SER/SABER/ACTUAR sense metadades pot fer-lo exportable. La carpeta temàtica no és un permís. | Noves peces privades per defecte; promoció pública explícita amb contracte i proves. Migració separada per no retirar tot el llegat accidentalment. |
| F09 · P2 | `tooling/vite/wiki-watcher.mjs:25` actualitza el manifest, però exclou deliberadament RAG i slugs. | La Wiki pot mostrar una revisió i la cerca/els enllaços conservar-ne una altra durant desenvolupament. | Revisió de font comuna i frescor per projecció; actualitzacions incrementals o avís explícit de projecció pendent. |
| F10 · P2 | `PoblesSection.jsx:23` reconeix que la pastilla obri el calendari però el calendari no rep `sortedTowns`; `CalendariSection.jsx` agrega actes, mur, mercat i pàgines. | El poble que origina el clic no apareix en el mes de destí. Avatar/data arreglats no equivalen a integració completa. | Decidir si Pobles entra al calendari; si sí, DTO canònic i contracte de deduplicació. `requires_human_decision: true` per a esta semàntica de producte. |
| F11 · P2 | La cadena antiga «El calendari no està disponible» continua en `dist/assets/AgendaSection-CnMUbGDM.js` i `wordpress-plugin/dist/soc-de-poble.standalone.js` al tall. | Hi ha artefactes locals que no reflectixen el camí font corregit. No prova quin paquet està instal·lat en producció. | Lliurament amb commit + hash de fonts + hash del bundle; regenerar i provar en un torn d'implementació autoritzat. |
| F12 · P3 | `inventariMapa.js:21` calcula color pel nombre d'avisos: un avís alt dona ambre; tres baixos donen roig. | El color no representa severitat, tot i que el detall sí la mostra. | Severitat màxima per al color; volum i recurrència com a dimensions diferents. |
| F13 · P2 | Passada final de `CalendariSection.test.jsx` i `CalendariSection.vistes.test.jsx`: 18/37 fallades, exit 1. Exemples: s'espera «Targetes del mes · octubre del 2026» i un heading de nivell 2, mentre la font entrant pinta «Octubre» o «Publicacions…» en h3; l'assert del mode de closca en `CalendariSection.vistes.test.jsx:389` també conserva nivell 2/text antic. | Codi i proves no tenen un contracte sincronitzat. Les passades anteriors no acrediten estos canvis posteriors. No prova per si mateix una fuga de memòria o una fallada funcional del modal. | Fixar el tall i el copy/jerarquia aprovats; alinear les assercions amb eixe contracte i tornar a passar les dues suites. No revertir un canvi de producte autoritzat només per satisfer un test antic. |

P1 = reparar abans de declarar el sistema fiable/exposable; P2 = fallada funcional o de mesurament; P3 = millora de representació. No atribuïsc automàticament els defectes previs de Consola i Vite als commits de Claude.

### 2. Calendari, regressions i Enxufe

| Peça revisada | Resultat constructiu | Límit destructiu / condició de conformitat |
| --- | --- | --- |
| T1 · calendari i agenda | La pàgina conserva les targetes locals si falla l'agenda. El port continua desacoblat de l'adaptador. Hi ha AbortController i comprovació de cancel·lació abans d'actualitzar estat; captures d'errors síncrons i asíncrons. | Un DTO invàlid rebutja tota l'agenda: decisió explícita de consistència. Cal indicar error, no «cap acte». S'han exercitat respostes malformades, cancel·lació i duplicats. |
| Identitat d'ocurrències | La clau inclou id i instant inicial; dos actes amb el mateix id en dates diferents es conserven. Mateix id+inici duplicat rebutja la resposta. | Sollutia haurà de documentar identitat, zona, recurrències, interval semiobert i cancel·lació. Encara no hi ha validació d'endpoints reals del futur proveïdor. |
| T2 · Pobles | Avatar amb fallback `avatar_url → image_url → imageSrc`; data mostrada i ordre compartixen el lector editorial. | F10 continua obert. La data del poble no demostra qui ha fet l'última publicació al Mur; no confondre les dues fonts. |
| T3 · autoria Mercat | Identitat de persona i entitat resoltes al seed; la signatura prefereix `author_avatar`; fallback genèric quan correspon. Les proves d'autoria passen. | Este resultat valida dades pilot i contractes locals, no el contingut de perfils reals de tots els adaptadors. |
| T4 · pastilla temporal | Un ISO amb hora continua sent un instant, també a mitjanit UTC; una data sense hora continua sense hora inventada. La representació local deixa de suprimir l'hora per aquella coincidència. | La correcció del format no certifica que les hores editorials d'origen siguen històricament certes. UTC i dia civil són tipus diferents i cal preservar-los als adaptadors. |
| Estat de navegació | La URL governa vista, mes, setmana, any i dia; canvi Setmana→Mes verificat en UI. | Falta una prova de sessió oberta durant el canvi de dia: `hui` es calcula al render del pare i el temporitzador d'una vista no garantix renderitzar el pare. Hipòtesi de desfasament, no bug reproduït en esta auditoria. |
| Memòria | Els hooks inspeccionats retiren temporitzadors, ResizeObserver i listeners; l'agenda aborta; la desconnexió de l'Enxufe desmunta React amb comprovació de reconnexió. | No he fet un perfil de heap prolongat. No trobar una fuga per inspecció no equival a provar que no n'hi ha cap. |

**Pantalla Completa actual:** `PantallaCompleta.jsx` reutilitza `Dialeg`; no usa `requestFullscreen`. A la SPA crida `showModal`; dins de `soc-de-poble`, el portal queda en `.sdp-root` i usa modalitat local. L'estat efímer viu a `CalendariSection`, per damunt de la branca de càrrega, i el focus retorna pel mateix id dins del Document o ShadowRoot. El contingut s'ajorna fins que el diàleg està obert, evitant mesurar amplada nul·la. La CSS incorpora safe areas i un visor amb scroll. `base.css` dona contenció de layout a la closca de l'Enxufe.

La prova interactiva ha mostrat: botó visible; calendari obert amb focus a «Eixir»; canvi Setmana→Mes sense abandonar el mode; URL actualitzada; Escape tanca i retorna focus a «Pantalla completa». No hi ha motiu per exigir listeners `fullscreenchange` a una funcionalitat que no usa eixa API. `show()` i `showModal()` tenen semàntiques diferents; la segona afecta la modalitat del document, d'acord amb l'[estàndard HTML de dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element).

En Shadow DOM, `modalLocal.js` manté una pila per arrel amb WeakMap, restaura `inert`/`aria-hidden`, desconnecta MutationObserver i lleva listeners en tancar. L'Enxufe conserva la referència del ShadowRoot tancat i no depén de `document.querySelector` per recuperar-lo. És una base correcta d'aïllament. La pantalla completa PHP de WordPress i este mode de closca són superfícies distintes i necessiten proves distintes.

Abans d'aprovar compatibilitat completa: Safari macOS i iOS reals, orientació i teclat virtual, scroll llarg i retorn de focus, dos Enxufes simultanis, obrir/tancar repetidament, diàleg secundari sobre el calendari, desconnectar/reconnectar l'host amb modal obert, i refresc de dades durant el mode. Si el suport inclou navegadors sense `showModal`, el fallback de posar `open` necessita validar modalitat/teclat: no és equivalent al mètode natiu. No marque estes comprovacions com passades.

### 3. Inventari complet de mètriques de la Consola

Hi ha dues fonts independents: `/__iaia/consola.json` per al pols i `/__iaia/mapa.json` per al graf, actors, processos i salut. Només existixen en el servidor de desenvolupament. Producció sense estes fonts ha de dir «no disponible», no «zero». El botó de privacitat de la UI oculta representacions; no és autenticació.

Totes les xifres següents corresponen al tall de les **13:28:39**, abans d'este informe. Distingisc dades brutes i valors realment accessibles per la UI: F01 impedix mostrar el pols encara que la font continga dades.

#### 3.1. Les nou targetes del tauler

| Targeta | Mesures al tall | Què significa / per què pot estar buida |
| --- | --- | --- |
| Pols | Font: 1 consum, 38 rebuts, 28 skills, 4 orfes | UI en error per F01. No són comptadors zero. |
| Explorador | 260 nodes, 217 arestes | Inventari compilat. No són 217 execucions. Nodes: 3 agents, 14 documents, 12 hooks, 13 plantilles, 13 rutes, 165 scripts, 28 skills, 12 tasques. |
| Fluxos / cadenes | 0 cadenes declarades, 0 suggeriments | No hi ha enllaç declarat entre eixida d'una peça i entrada d'una altra; vegeu §4. |
| Calendari de processos | 12 tasques, 12 vives, 0 mortes | El zero de morts és real dins de l'heurística; «viu» no acredita èxit. No he reproduït zero tasques en esta font. |
| Inventari | 28 skills | Disc i catàlegs, no nombre d'agents executant-se. |
| Entrades i eixides | 28 skills, 13 rutes | 24 skills opaques; 4 amb alguna lectura declarada. |
| Agents atòmics | 0 atòmics, 3 arnesos | El lector crea arnesos, però no perfils atòmics amb contracte d'E/S. |
| Actors | 3 arnesos, 17 candats, 2 programades | Candats mesclats amb invocacions; F07. Només dos launchd compten com a programades autònomes. |
| Avisos i salut | 22 avisos, 8 alts, 14 mitjans; 18 mètriques | Són avisos sobre nodes; diversos poden tindre una sola causa arrel. |

Font dels recomptes: `consolaPagines.js:80`, `mapa/actorsMapa.js` i `mapa/mapaContent.js`.

#### 3.2. Els cinc panells del pols i el peu immunitari

| Panell / camp | Valor de la font | Interpretació, límit i connexió que falta |
| --- | --- | --- |
| Càrrega documental: artefactes actius, abast i excés | N/A; llindar d'avís 150 | `termometria.artefactesActius` no és produït pel middleware. No sumar skills i rebuts per fabricar esta mesura. La barra limita el dibuix a 150, l'excés és recompte−150. |
| Consums: registres | 1 | Una entrada `consum.tokens`, no una sessió completa ni tot el consum del compte. |
| Consums: entrada / eixida totals i per agent | 31.740.000 / 1.700; agent claude; 1 registre | Lector suma declaracions. El registre és del 30/09 a les 13:13:37Z. La magnitud necessita procedència, unitat i període; no és telemetria d'esta auditoria. |
| Crèdits: consum, límit i proporció | 1 quota + 4 ajustos | Sense observació temporal verificable no és saldo en temps real. Els ajustos tenen `valor` i `actiu`, no consum numèric. F01 i F03. |
| Estratègia de consum | Present a la font, perduda al normalitzador | Cal preservar-la; no és mètrica de saldo. |
| Rebuts: quantitat, última data i antiguitat | 38; últim 19/09/2026 23:03:39.753Z | Uns 11 dies i mig: supera llindar de 7 dies. La font és `matrix.rebut`, no tots els receipts dels torns moderns. |
| Rebuts: protocols i fonts per rebut | Longitud de cada llista; hash de cada font | Acredita procedència/empremta registrada, no comprensió, recepció del següent agent ni acceptació d'un resultat. |
| Skills: total / core / orfes / fantasmes | 28 / 7 / 4 / 0 | «Orfe» ací és disc sense manifest. En el graf significa sense relació entrant: definicions distintes encara que coincidisca el 4. |
| Skills: estat, presència en disc/manifest | Per skill; booleans i estat textual | Inventari, no taxa d'èxit d'execució. |
| Segell: hash, fitxers i antiguitat | 27 fitxers; 30/09/2026 21:58:09.763Z | Inclou l'índex; no equival a les 28 skills ni prova coherència de totes les seues fonts auxiliars. |
| Peu immunitari: operacions i última data | 119; 03/08/2026 13:43:04.716Z | Històric d'uns 59 dies sense operació nova en esta font. Un peu amb 119 no prova salut actual. |

#### 3.3. Les 18 mètriques de salut, una per una

| Mètrica | Valor al tall | Font i significat real |
| --- | --- | --- |
| disparadors-utils | 24/24 = 1 | `skills_index.json`; disparadors no decoratius segons heurística textual. No mesura encert del router. |
| cens-skills-coherent | 24/28 = 0,857 | Coincidència disc/índex/catàleg Claude/presència al segell. |
| vigilants-vius | 2/2 = 1 | LaunchAgents, registre i activitat de logs. No dos processos certificats sans. |
| integritat-contingut | 11/11 = 1 | Fitxers requerits per la frontissa; no tot el repositori. |
| frescor-instantania | 12 minuts | Última ref `refs/time-machine/*`; no edat de cada mètrica ni còpia remota verificada. |
| segell-skills-coherent | 25/28 = 0,893 | Comparació SHA de SKILL.md i manifest del segell. |
| antiguitat-segell | 14 hores | Diferència temporal arredonida, no hores completes truncades. |
| frontmatter-skills-valid | 24/28 = 0,857 | Metadades validades contra schema.json. |
| torns-caducats-oberts | 117/149 = 0,785 | Torn no tancat amb caducitat superada. És acumulat sobre els torns llegits. |
| torns-tancats | 5/149 = 0,034 | `state === closed`; no taxa d'èxit d'una cohort de treball homogènia. |
| escriptori-ancorat | 6/6 = 1 | Només Markdown solts de primer nivell, exclòs l'índex; cerca wikilinks a l'índex. No cobrix subcarpetes ni valida contingut. |
| escriptori-amb-rebut | 4/6 = 0,667 | Coincidència de ruta amb `receipts[].file` dels torns. No verifica que el document estiga acabat ni que el seu contingut actual coincidisca amb una versió acceptada. |
| safata-entrada | 0/20 = 0 | Safata buida sobre límit de 20 elements. Zero saludable, no dada trencada. |
| recaigudes-ledger | 2 | Entrades de tipus recaiguda dins de la finestra de 7 dies, amb tolerància de data UTC; no percentatge de tasques defectuoses. |
| integritat-ledger | 1/1 = 1 | Segell final del ledger vàlid segons els dos lectors; no veracitat de cada afirmació escrita. |
| frescor-relleu-estat | 5 hores | Data de relleu d'ESTAT arredonida; no darrera acció de qualsevol agent. |
| conformitat-documental | N/A | El compilador declara la mètrica sense resultat del productor. Falta integrar l'evidència de la porta de documents. |
| cadena-portes | N/A | Igualment declarada sense resultat de run-portes. No és un suspens ni un aprovat. |

Font executable: `mapa/construeixMapa.js:542–716`, `tooling/brain/fonts-vigilancia.mjs`. Un denominador inexistent ha de continuar sent N/A.

Els dos documents sense rebut reconegut són el prompt i el pla de Claude de les 11:40. El pla Codex de les 13:10 sí té rebut reconegut. En canvi, l'auditoria de Claude té rebut i àncora però encara conté `[pendent]` a Troballes, Verificació i Límits: **el sistema pot comptar com acreditat un esquelet buit**. És una demostració directa de la diferència entre document creat i faena acceptada.

#### 3.4. Altres xifres, filtres i dimensions que mostra la Consola

| Família | Valors / fórmula | Límit |
| --- | --- | --- |
| Cinc xifres de capçalera | 28 skills; 3 arnesos; 24 opaques; 2 autònomes, 2 vives; 5 skills amb avisos | Reutilitzen dades del mapa; no són cinc fonts noves. |
| Semàfor d'inventari | 23 verdes, 1 ambre, 4 roges; 4 òrfenes i 4 fora d'algun cens | Conjunts superposats. Verd significa cap avís implementat, no correcció provada. |
| Pes per skill | Paraules del cos; tokens aproximats = round(paraules × 1,3); nombre de lliçons detectades | Estimació documental sense tokenizer ni consum real; més lliçons no prova més aprenentatge. |
| Procedència per skill | Disc, índex, catàleg Claude, segell; core; status; avisos i severitat | Les quatre skills conflictives són core-empaquetat-wp, core-identitat-visual, core-temps-termodinamic i sdp-clon-whatsapp. |
| Relacions d'E/S | Llig, escriu, crida, cridada per; confiança declarat/derivat/inferit; opacitat | No deduir execució d'una aresta. |
| Fluxos i punts de trobada | 10 punts; 2 eixides sense lector; Escriptori: 13 escriptors i 0 lectors; Actes: 1 escriptor i 0 lectors | El graf només coneix declaracions. El lector humà/Codex de l'Escriptori existix, però no està declarat en el model. |
| Cadenes visibles | Màxim 12 cadenes i 5 passos en la construcció actual | Un futur recompte amb límit de presentació no serà cens complet de workflows. |
| Peces d'agents | Fluxos: FALTA; tauler: SENSE LECTOR; autònoms: EN MARXA; vigilants: EN MARXA | EN MARXA hereta les heurístiques anteriors, no capacitat cognitiva. |
| Actors i arrencada | Arnesos, hooks acreditats/desconeguts, documents/skills carregats transitivament, tasques sense llançador | Carregar instruccions no demostra haver-les comprés o executat. |
| Cadències de processos | Diàries 7; per esdeveniment 5; setmanals, mensuals, altres, residents, només-arrencada i sense cadència: 0 | Les 7 diàries inclouen 5 subtasques heretades. El calendari projecta programacions, no l'històric d'execucions. |
| Estat i quan de cada procés | Viu/mort/desconegut/sense llançador/sense declaració; interval o cron, arrencada, script i llançador | Una casella de dia amb tasca no és un rebut d'èxit d'eixe dia. |
| Etiquetes d'interfície | Cal reparar, falta, sense mesura, nou respecte de l'última visita, privacitat | «Nou» és comparació amb record local; no versió causal ni indicador d'èxit. |

Els 22 avisos es desglossen en: 1 torns-caducats, 1 segell-trencat, 4 fora-cataleg-claude, 4 fora-index, 4 frontmatter-invalid, 4 orfe, 1 segell-divergent, 1 recaiguda-recent i 2 fora-segell. Reparar una font canònica pot eliminar-ne diversos; no cal crear 22 tractors.

Les dotze tasques són: time-machine, plaquetes-diagnostic, adopta-orfes, higiene-basica, lapida-fantasmes, quarantena-brossa, refresc-tokens, frontissa-contingut, git-staged, porta-plantilla-viva, porta-taxonomia i reflex-consume-commit. Les cinc entre adopta-orfes i refresc-tokens depenen de plaquetes-diagnostic; els cinc últims són hooks Git.

### 4. Per què hi ha zeros i què falta connectar

**Cadenes = 0.** Les tretze rutes documentals declaren l'Escriptori com a eixida; acta declara també Actes. Només prompt.local declara les tres lectures bàsiques d'arrencada. Cap ruta declara consumir l'eixida de l'Escriptori. Només quatre skills declaren lectures: sdp-calendari-agricola, sdp-casos-us-essencials, sdp-workflow i core-memoria-historica. El compilador no interpreta eixides de skills. `fluxosMapa.js` encadena skills/rutes per E/S coincident o crida acreditada, no per relacions de govern o càrrega. Amb estes dades, zero és el resultat esperable.

**Suggeriments = 0.** No és «cap millora possible»: és cap menció de prosa elegible en el lector, després d'excloure Historial, autoreferències i relacions ja declarades. La prosa no ha d'inventar execucions.

**Agents atòmics = 0.** `recullFonts` llig configuracions d'arnesos, hooks i documents; no hi ha un carregador del perfil atòmic. Els tres arnesos generen relacions de càrrega/disparador, no contractes d'E/S. Els exemples NEXUS són exemples. A més, el filtre `agentsAtomics` acceptaria només una lectura o només una eixida: és massa feble per certificar un agent que rep una faena, produïx un artefacte i l'entrega a algú.

**Processos = 12, no 0 en este tall.** No he reproduït zero tasques; cal demanar timestamp/versió exactes si torna a passar. La URL de categoria Wiki indicada ha mostrat la portada en la sessió de navegació; les rutes directes `/consola` i `/consola/pols` sí han permés verificar els panells. No atribuïsc eixa divergència d'enllaç a una causa no comprovada.

**Quins tractors falten realment?** Primer quatre peces deterministes, sense cap LLM nou:

1. Un compilador de contractes que consumisca entrades, eixides i crides versionades. Un contracte usa tipus d'artefacte i esquema, no només «escriu en una carpeta», perquè tots els escriptors de l'Escriptori no són predecessors de tots els seus lectors.
2. Un receptor/validador d'artefactes que comprove existència, hash, esquema, autoritat i completitud; un esborrany amb camps obligatoris buits no pot satisfer un pas finalitzat.
3. Un registre d'execució per pas i una projecció de salut: inici, resultat, error, expiració i frescor. Integrar els rebuts Matrix, documentals i d'execució sense presentar-los com la mateixa cosa.
4. Un adaptador de telemetria que aporte consum real quan l'arnés l'expose; `null` amb motiu quan no. Les anotacions manuals han de dir que ho són.

Després, ampliar procediments existents —workflow, documentació, automillora— perquè usen estes peces. Un «bibliotecari» o un «tancador» pot ser una responsabilitat d'un procediment, sense convertir-se obligatòriament en un agent autònom que gaste tokens.

Contracte mínim proposat, independent de Supabase/Sollutia: `schema_version`, `run_id`, `step_id`, `attempt`, `correlation_id`, hashes d'entrades i artefactes, estat, timestamps, productor, consumidor, error tipat i proves. Estats: **creat → rebut → en curs → artefacte escrit → validat → acceptat → tancat**; branques explícites fallit, cancel·lat i caducat. Un ACK de recepció no dona per vàlid l'artefacte. El següent pas que en depén només s'habilita amb acceptació del contracte requerit. Una excepció bloqueja amb causa, no salta silenciosament.

Entrega repetible amb clau d'idempotència `(run, step, hash d'entrada, versió del contracte)`, reintents acotats i detecció d'ACK duplicat. Si hi ha concurrència, lease amb venciment i identificador d'intent per impedir que un treballador antic publique sobre un intent nou. Un error del registre d'observabilitat no ha d'invalidar treball independent ja fet: cal separar ACK necessari per al workflow i telemetria auxiliar. No prometre «exactament una vegada» sense mecanisme demostrable.

Començar amb JSONL append-only i un únic escriptor, o SQLite local transaccional si hi ha diversos productors. La UI rep projeccions compactes amb `state: ok|empty|missing|invalid|stale|unsupported`, `observed_at`, `source_revision` i `reason`. El transport va darrere d'un port; adaptadors locals, Sollutia, WordPress o altres no canvien el domini.

Per a interoperabilitat futura, A2A ja especifica tasques, estats, artefactes i operacions; no cal inventar tota la conversa IA-IA. La seua idempotència de Send Message és opcional, per tant el receptor local ha de definir-la explícitament. Adoptar només el subconjunt útil darrere d'un adaptador, sense introduir una xarxa d'agents ara. [Especificació A2A](https://a2a-protocol.org/latest/specification/).

### 5. Maduració, autoaprenentatge i estalvi de tokens

La mètrica útil és resultat acceptat amb evidència i cost atribuïble. «Fatiga» no és una propietat mental que esta Consola puga observar: usar degradació operacional, pèrdua de context, repetició i correccions. Tampoc un fitxer de lliçons modifica els pesos del model. Ací autoaprenentatge significa millora controlada del coneixement recuperat i dels procediments, contrastada amb proves.

#### Mètriques noves mínimes

| Mètrica proposada | Fórmula / dada necessària | Acció útil i protecció contra trampes |
| --- | --- | --- |
| Cobertura de telemetria | execucions amb consum mesurat / execucions elegibles | Mostrar sempre n i període. Sense cobertura suficient, cap conclusió de cost. |
| Cost per resultat acceptat | suma tokens d'entrada+eixida, incloent intents fallits / resultats acceptats | Comparar tasques de classe semblant; sense acceptacions, N/A amb cost acumulat visible. No premiar tasques trivials. |
| Acceptació al primer intent | resultats acceptats sense correcció / entregues avaluades | Denominador de la mateixa cohort; criteris congelats abans de l'execució. |
| Retraball | intents de correcció / passos completats; tokens de retraball / tokens totals | Senyal de degradació del procés; no diagnòstic psicològic de l'agent. |
| Pèrdua de relleu | entregues que exigien ACK i han vençut sense ell / entregues exigibles | No marcar treball en curs abans del timeout ni exigir ACK a peces que no el necessiten. |
| Latència d'acceptació | p50/p95 de temps acceptat−artefacte escrit | Separar espera humana, cua i validació mecànica; n visible. |
| Cobertura contractual | peces amb esquema d'entrada, eixida i criteri d'acceptació verificables / peces actives elegibles | No acceptar un únic `llig` com a contracte complet; separar declarat i exercitat. |
| Frescor útil | fonts dins del TTL propi / fonts requerides disponibles; edat màxima visible | TTL segons naturalesa de la font. Un manifest estable no caduca com una quota. |
| Reincidència comprovada | incidències amb la mateixa signatura després d'una correcció validada / correccions observades | Finestra de 30 dies inicial, canviable amb evidència; no simples mencions al ledger. |
| Context redundant | tokens de fonts ja presents sense canvis / tokens de context aportats, quan siga mesurable | Hashos detecten duplicació de fonts, no comprensió. Si només hi ha bytes, etiquetar ratio de bytes, no tokens. |
| Desfasament de projeccions | revisions de manifest/RAG/slugs/bundle diferents de la revisió canònica | Targeta concreta de què falta regenerar, sense RAG per calcular-la. |
| Evidència del veredicte | afirmacions verificables amb font vigent i prova / afirmacions verificables mostrejades | Mostra revisada; no autodeclaració acrítica del mateix autor. |

Recollida incremental per esdeveniments, finestres de 7/30 dies i retenció limitada. No enviar prompts, respostes privades ni contingut de documents a telemetria: identifiers, hashes, quantitats i errors tipats solen bastar. OpenTelemetry manté convencions GenAI per a spans, mètriques i esdeveniments; es pot preparar un adaptador opcional, fixant-ne versió, sense fer-ne una dependència del frontend. [Font oficial OpenTelemetry GenAI](https://github.com/open-telemetry/semantic-conventions-genai).

#### Propostes radicals, amb prova d'utilitat

1. **Traure burocràcia repetida del context.** Un manifest de torn amb objectiu, límits, fitxers, hashes i criteris; plantilles canòniques referenciades per versió. Llegir una vegada el context obligatori i tornar a llegir només canvis o dubtes. Eliminar historials repetits del prompt operatiu sense destruir l'històric conservat al disc.
2. **Fer amb codi tot allò determinista.** Inventaris, schemas, completitud, diffs, dependències i recompte no necessiten una IA. Reservar la revisió del model per a ambigüitat, decisions i contradiccions.
3. **Recuperació en dos passos.** Primer índex local mínim de noms, tipus, permisos, dates i resums; després fragments o documents necessaris amb font exacta. Per a un contracte crític, llegir-lo complet. Cap GraphRAG global abans de demostrar que una cerca per text i metadades falla.
4. **Memòria que ha de guanyar-se la permanència.** Cada lliçó porta error reproduït, abast, canvi, prova i revisió. Promoure-la només si millora una bateria de casos separada de l'exemple original; retirar o revisar lliçons contradictòries. No apilar instruccions antigues per sempre.
5. **Revisió adversarial per risc i canvi.** Una segona revisió quan canvien privacitat, persistència o contractes crítics; no tres agents repetint la mateixa lectura per a cada canvi de text. Aturar iteracions quan el criteri està satisfet i no ha canviat l'evidència.
6. **Pressupost per resultat.** Definir abans de començar què és suficient, quines proves i quina amplària de cerca; registrar intents que no aporten evidència. Un pressupost esgotat no equival a treball acabat.
7. **Versions de context reproduïbles.** Fitxer canònic + hash + posició de l'evidència; invalidar la conclusió afectada quan canvia la font. En esta auditoria, la Pantalla Completa ha aparegut durant el treball: sense això s'hauria pogut publicar un fals «no implementada».
8. **Experiment de cost amb qualitat fixa.** Mesurar un conjunt acotat de tasques repetibles, comparar flux actual i flux reduït amb criteris idèntics, revisar omissions i consum. Només adoptar estalvis observats. No prometre un 80% o 90% sense dades.

La prioritat és reparar F01 i la cobertura del registre abans d'afegir més indicadors. Un únic índex sintètic de «maduresa» amagaria just les absències que cal fer visibles.

### 6. Taxonomia i subsistema de Comunicació

Mantindria **SER / SABER / ACTUAR** com a navegació estable. No convertiria ACTUAR en una carpeta comercial: l'índex vigent inclou eines, guies i plantilles operatives. El problema no és tindre tres carpetes; és barrejar domini temàtic, estat documental, visibilitat i artefactes generats.

L'inventari real també conté `01_produccio`, `04_escriptori`, `10_actes`, `10_metriques`, arxiu, quarantena i `.obsidian`. Dins de SABER conviuen `architecture`, `protocols_tecnics`, documentació d'IA i de Consola. Això no obliga a una migració massiva: cal declarar què és contingut canònic, temporal, privat o projecció. Les dimensions de `.agents/cervell.json` poden funcionar com a facetes, sense duplicar físicament cada document.

| Contingut de Comunicació | Ubicació proposada | Regla de veritat i visibilitat |
| --- | --- | --- |
| Dossier institucional públic: identitat, llegat i afirmacions verificades | `01_ser/comunicacio/` | Una font canònica; cites del llegat de 30 anys i evidència. Públic només després de revisió. |
| Arquitectura editorial, criteris de veu, públics, canals i política de publicació | `02_saber/comunicacio/` | Coneixement reutilitzable. Estratègia sensible fora del repositori públic. |
| Procediment de preparar, revisar, publicar i comprovar una peça | `03_actuar/comunicacio/` | Guia operativa, responsabilitats i criteris. No copiar ací el dossier sencer. |
| Plantilles de nota, dossier breu, fitxa, entrevista, FAQ i canal | `03_actuar/plantilles/comunicacio/` | Estructures sense contactes ni dades privades d'exemple. La instància té id i visibilitat propis. |
| Procediment executable per IA | `.agents/skills/` quan s'aprove | Referència les fonts canòniques; contracte d'E/S. No manté una segona narrativa institucional. |
| Materials, contactes, esborranys i investigació confidencials | directori extern `_comunicacio_de_poble` | Vault privat local, fora de Git públic, public/, bundle, manifest i RAG públic. |
| Faena activa i revisió | `04_escriptori/` | Només peces aptes per a este entorn; no importar material privat per comoditat. |
| README, readme WordPress, app i web | Projeccions d'una revisió pública aprovada | Manifest de publicació amb font, revisió, adaptador i checksum; verificar cada destí. |

Les noves subcarpetes són una proposta, no carpetes creades. Abans d'implantar-les, validar la nomenclatura amb la taxonomia i resoldre els índexs, en lloc de crear una altra taxonomia paral·lela.

**Frontera privada:** el compilador públic compartit ja restringix les arrels, rebutja `visibility: private` i no seguix symlinks dins de l'arrel. El directori germà queda fora. Conservar esta frontera, amb denegació per defecte per a material nou i proves de manifest, RAG, slugs, SEO i bundle. No fer symlinks, còpies automàtiques o «sincronització total» del vault privat al repositori. F02 demostra que protegir només l'exportador no protegix el servidor dev.

**RAG intern sense filtració:** índex físicament separat, fora del repositori i de qualsevol directori servit, amb permisos i recuperació local explícita. El fet que l'índex siga local no implica que una consulta siga confidencial si el seu contingut es passa després a un model remot. Si la condició és que el material no isca de l'ordinador, també la generació ha de ser local. La promoció pública crea una peça nova revisada i depurada; no publica l'original privat ni els seus fragments per defecte.

**Sincronització:** documents amb id estable, alias de noms antics, estat i revisió; un compilador genera índexs i manifest, amb validació d'enllaços ambigus. Evitar que el nom base d'un fitxer siga l'única identitat. README, WordPress i app reben artefactes derivats de la mateixa revisió amb adaptadors independents. No permetre edició bidireccional silenciosa d'eixes projeccions: les correccions retornen a la font, es revisen i es regeneren.

**Comunicació IA-IA:** entregar un objecte xicotet amb id, pregunta, límits, evidències i hashes, artefacte esperat i estat d'acceptació. La resposta conté resultat, evidència i dubtes oberts. Una referència resoluble i autoritzada substituïx reenviar tot el dossier; una font privada no s'envia a un altre entorn pel fet de tindre un id. Markdown continua sent editable amb Obsidian o qualsevol editor; els ports i schemas mantenen la independència respecte d'eines i proveïdors.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Proves executades

| Grup | Resultat verificat | Abast |
| --- | --- | --- |
| Vitest: calendari, models temporals, Pobles, Mercat, autoria, editorial, pastilla i Consola | 28 fitxers, 892 proves passades | Inclou regressions, contractes, errors i funcions pures. Primera passada anterior a la integració final de Pantalla Completa. |
| Vitest: useAra, amplada, CSS i les vistes/navegació del calendari | 8 fitxers, 82 proves passades | Temporitzadors, responsive de contenidor i components. |
| Vitest: PedraSecaEmbed.config, PedraSecaEmbed.router, RouterContext.embed i Dialeg | 4 fitxers, 155 proves passades | Configuració/rutes de l'encastament i modalitat. No són Safari real. |
| Vitest: repetició dels sis fitxers afectats per la integració del mode de closca | 6 fitxers, 220 proves passades | CalendariSection, robustesa, CalendariEsdeveniments, CalendariMes, NavegacioPeriode i CalendariMur; 139,18 s. Repetició parcial, no 220 casos nous. |
| Vitest: proves noves de PantallaCompleta, usePantallaCompleta i CSS | 3 fitxers, 19 proves passades | Inclou portal en ShadowRoot tancat, focus, Tab, Escape, restauració d'inert i neteja en desmuntar; cascada CSS comprovada textualment, no render Safari. |
| Vitest: passada final d'integració sobre canvis entrants de copy/jerarquia | **2 fitxers fallats; 18 proves fallades, 19 passades, 37 totals; exit 1** | 13:40:43, duració 55,18 s. CalendariSection.test: 7 fallades de 19; CalendariSection.vistes.test: 11 de 18. F13 explica les discrepàncies de headings verificades. |
| Node test: mapa-consola, fonts-vigilancia, enxufe-pantalla, lint_enxufe | 48 casos: 46 passats, 0 fallats, 2 TODO diagnòstics; codi d'eixida 0 | Els TODO informen d'abast històric de fitxers i de set classes CSS heretades sense regla. No es compten com aprovats ni com regressions noves demostrades. |
| HTTP local i UI | Fonts JSON accessibles, error del pols visible, calendari i mode de closca exercitats | També provades les dues rutes internes servides indegudament. No s'ha exposat el seu cos en l'evidència de la prova HTTP. |
| Experiments purs en memòria | Rebuig de crèdits, pèrdua d'estratègia, eixida de skill ignorada, herència de tasca viva i permissivitat del draft públic | No modifiquen fitxers ni creen agents o tasques. |

Les tres primeres passades sumen **1.129 proves Vitest passades**, més la repetició parcial de 220 i les 19 proves noves del mode de closca. No les presente com 1.368 casos únics. No s'ha executat build, instal·lació, desplegament ni una prova global de totes les portes documentals. Les proves PHP/WordPress són fixtures de plantilla i empaquetament, no una instància WordPress instal·lada.

**La passada final fallida preval per al tancament del calendari actual.** Comanda exacta: `node node_modules/vitest/vitest.mjs run --configLoader runner --no-cache src/sections/calendari/CalendariSection.test.jsx src/sections/calendari/CalendariSection.vistes.test.jsx`. No he corregit codi ni proves perquè este torn només autoritza diagnòstic.

Les passades Vitest usen `node node_modules/vitest/vitest.mjs run --configLoader runner --no-cache` amb els fitxers/àrees indicats. La passada Node usa `node --test tests/mapa-consola.test.mjs tests/fonts-vigilancia.test.mjs tests/enxufe-pantalla.test.mjs tests/lint_enxufe.test.mjs`. Les proves noves trobades al working tree són alienes: no les he escrites.

### Reproducció mínima dels diagnòstics

Des de l'arrel del repositori, una importació Node de `recullConsola` i `normalitza`, seguida de `normalitza(recullConsola())`, reproduïx F01 sense navegador. Aplicar en memòria `credits.filter(c => c.tipus !== 'ajust')` permet observar F03: el camp `estrategia_consum` desapareix. Esta filtració és un experiment, no una solució proposada.

`node tooling/brain/mapa-consola.mjs --json` reconstruïx les mètriques; canvien els valors temporals. `resumEscriptori(process.cwd())` explica les rutes sense rebut. La prova HTTP de F02 és GET dels dos camins de la taula, comprovant status i content-type; no cal llegir claus ni dades sensibles.

### Empremtes del tall de font

Les línies citades corresponen al working tree, que no està congelat. Estes empremtes SHA-256 de les 13:30:40 permeten identificar les peces crítiques revisades:

| Fitxer | SHA-256 |
| --- | --- |
| src/components/PedraSeca/hooks/usePantallaCompleta.js | e2caf19e32ce10441dbf2132aa9d0b6d78c09a91eb2f3cabd9e86e1754da9822 |
| src/components/PedraSeca/organismes/PantallaCompleta.jsx | 10f385293a6642b4b7490c64a4bbd2a15c25367d42fa1f6606b2b426ad69311d |
| src/components/PedraSeca/organismes/Dialeg.jsx | 1e5b83b1c96f5278df87e40734ab7f0a0358940673f62a2e215970ee71d32a1e |
| src/sections/calendari/CalendariSection.jsx | a0fb396cb3358a99bcb2d23c5796899157a05a2a5ed7d7dbc3af2d46fc1ea9cb |
| src/sections/consola/consolaContent.js | 4d7043ee9d7ddea179dfd299312adb80f02387c46e3ecd3b053ef885305357e8 |
| src/sections/consola/mapa/construeixMapa.js | dc95df3970b5347be85353de2279577a12fa7dc4cf7358d73a5e0fc50265ecde |
| tooling/vite/consola-iaia.mjs | 64917175903a6cfd606c03fe1f31f87d84715d2900056d11c2012b303fd70208 |
| vite.config.js | 7ed76e72704a9a9ae5b19416b7b8e82c249074b03de49101dc428315cab9b19b |

Revisió addicional de les 13:39: s'ha llegit el canvi posterior de l'espai del nom accessible d'Eixir, i els canvis de copy/jerarquia h3 del calendari. Les empremtes noves són `5817ea3da11e2b1e4e8cd70da8d3b979c4a678e910f9f75efbeb7c191b67f130` per a PantallaCompleta.jsx i `80db18d291f351b10dc4c1c17605e4aba9d4b84ffc2e8ca41c8e50f1be18848b` per a CalendariSection.jsx. Les altres sis peces de la taula continuaven iguals. Això delimita l'abast; no estenc el veredicte a canvis futurs.

Les metadades d'este informe s'han validat en memòria amb `parseDocument` i `validateSchema` del repositori: zero errors. Conté les set seccions de la ruta auditoria i acaba amb Proposta d'Automillora; no conté seccions deixades amb un marcador pendent.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Auditoria del codi i working tree observats; no del futur estat d'una branca mutable. Claude o altres processos han continuat introduint canvis durant la revisió. No declare un consens formal amb un agent amb qui no he intercanviat una acceptació.
- No s'ha verificat Safari/iOS físic, desplegament WordPress, xarxa LAN des d'un altre equip, heap de llarga durada ni endpoints futurs de Sollutia.
- El contingut privat de comunicació no s'ha llegit. La proposta és d'arquitectura, no una auditoria de cada document d'eixe vault. Tampoc s'han reinterpretat com a instruccions els exemples de tercers de l'Escriptori.
- Els recomptes són una instantània, no una sèrie temporal. Les fraccions de torns no són un indicador estadístic d'èxit sense definir cohort i criteris.
- La lectura completa de Markdown actiu no implica validació factual de tots els seus annexos binaris, imatges o material històric enllaçat.
- L'informe és l'única escriptura persistent pròpia al repositori. Per això no s'ha registrat un rebut nou ni modificat l'índex. En guardar-lo, els recomptes d'ancoratge/rebuts de l'Escriptori poden baixar: no falsege eixa conseqüència ni marque les portes com passades. L'orquestrador pot registrar-lo en un torn amb eixe abast.
- Tokens consumits exactes no accessibles. Ni l'estimació paraules×1,3 ni el registre anterior de Claude substituïxen eixa dada.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[261001_1310_pla_implementacio_codex]]
- [[261001_1245_prompt_auditoria_codex]]
- [[261001_1140_pla_implementacio_claude]]
- [[261001_1140_auditoria_claude]]
- [[261001_1232_prompt_sistema_comunicacio]]
- [[taxonomia_documental]]
- [[02_genotip]]
- [[00_index]]
- [[00_index_actuar]]
- [[00_index_escriptori]]

## Proposta d'Automillora

**Si m'hagueres demanat esta auditoria amb un tall de codi immutable, el pla aprovat al primer missatge, un manifest breu de documents actius i una definició exacta de «Pantalla Completa», hauria sigut més eficient i precís.** El mode encara s'estava integrant mentre l'auditoria ja comprovava el seu lliurament. La correcció és donar commit i hashes dels canvis sense commit, o declarar explícitament que s'audita treball en curs.

| Contradicció, duplicitat o ambigüitat | Millora concreta del prompt/protocol |
| --- | --- |
| «Dues missions» seguides de tres blocs i quatre tasques | Enumerar quatre eixides verificables, separant aprovació de regressions i diagnòstic del cervell. |
| Preflight diu «Pla generat si cal», però el dogma rebutja qualsevol absència | Per a auditoria, demanar pla d'auditoria breu; indicar quan cal i la ruta exacta. El pla present resol el bloqueig d'este torn. |
| Pla aprovat però frontmatter esborrany; aprovació pendent i requires_human_decision false en el prompt | Separar autorització d'executar, estat editorial i acceptació del resultat en camps diferents, validats. |
| Auditoria «només lectura» i «única escriptura informe» contra creació automàtica de torn/rebut/índex/ESTAT | Declarar en la plantilla l'excepció read-only i qui registra posteriorment el lliurament. No obligar l'agent a inventar un rebut o vulnerar l'abast. |
| Repetir íntegrament tota la plantilla/historial i llegir tot l'Escriptori contra estalvi radical de tokens | Manifest de context obligatori + versions + fonts complementàries sota demanda. Mantindre els textos íntegres al disc, no duplicats en cada torn. |
| «Escriptori net» entés com buit contra documents de treball i exemples conservats | Definir net com classificat, amb propietari i estat. Distingir documents actius de recursos consultius; no arxivar automàticament. |
| Rebut interpretat com comprensió o acabament | Etiquetar creat/llegit/validat/acceptat per separat. Una plantilla amb `[pendent]` no pot tancar una tasca. |
| Pantalla Completa ambigu: navegador, viewport, closca o plantilla PHP | Especificar superfície, comportament dins d'Enxufe, estat en URL, focus i navegadors suportats abans d'implementar. |
| «Tot zero» sense data, versió ni estat de transport | Adjuntar URL efectiva, hora, build/commit, camps JSON i error. Diferenciar zero mesurat de missing/invalid/stale. |
| «Model IA» i «Tokens consumits» obligatoris encara que l'arnés no els expose | Admetre valor desconegut amb motiu i font; registrar mesurat/estimat/manual. Mai forçar un número inventat. |
| Canvi anunciat a «Versió del document», però auditoria_canonica encara diu «Versió» | Migrar plantilla, schema del registre i protocolledge en una mateixa revisió, amb prova de generació. |
| SER/SABER/ACTUAR tractats com permisos de publicació | Afegir visibilitat i promoció explícites; la classificació temàtica no concedix accés. |
| «Radical» pot incentivar afegir agents i mètriques sense dada | Demanar una causa reproduïda, una intervenció mínima i una prova d'estalvi/qualitat abans de nous components. |

Plantilla operativa proposada: **objectiu → fonts i tall → abast d'escriptura → quatre criteris d'acceptació → verificació → eixida i registre**. La identitat, el llegat rural i la independència de proveïdor continuen canònics i consultables, amb una referència inequívoca. Així es preserva el context sense que la burocràcia substituïsca l'evidència.
