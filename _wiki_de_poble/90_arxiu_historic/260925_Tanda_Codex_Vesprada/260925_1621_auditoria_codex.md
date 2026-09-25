---
type: informe
status: esborrany
description: 'Reauditoria després de les fases 1–3: identitat, orígens, portes, higiene documental i salut de la Consola.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_538988c4-8ea8-456e-b930-1c9819e3f127:597dee2c-7801-41f6-b021-6220ef56faeb
---
# Auditoria Codex — Execució de fortificació i salut

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_538988c4-8ea8-456e-b930-1c9819e3f127:597dee2c-7801-41f6-b021-6220ef56faeb |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T14:33:43.871Z |
| Modificació | 2026-09-25T14:33:43.871Z |
| Propietari | Codex |
| Aprovació humana | Execució Fases 1–3 autoritzada expressament en este torn |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats: no disponibles; estimats: no calculats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-25: context i nom reservats a les 16:21 Europe/Madrid; document materialitzat després de l’execució. Tall de proves: 16:31–16:35 Europe/Madrid, HEAD 18acb41b més arbre de treball compartit. Autorització d’execució rebuda dues vegades amb el mateix prompt. L’AFK històric queda substituït per esta ordre humana.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Resultat: fases 1, 2 i 3 implementades; tests de producte verds. El sistema global encara no està 100% net. Puntuació d’enginyeria: 7,5/10.** La nota és una valoració argumentada, no una mesura automàtica ni una garantia de seguretat.

| Dimensió | Punts | Evidència i límit |
|---|---:|---|
| Identitat i aïllament de sessió | 2,5/3 | Curses i persistència parcial cobertes; falta assaig remot RLS multiusuari |
| Arquitectura i endoll | 1,6/2 | Enxufe, adaptadors, Frontissa i frontera auth passen; contracte real Sollutia pendent |
| Proves i construcció | 1,8/2 | Vitest, Node, lint i builds passen; fum de navegador comprovat, sense comparació visual automatitzada completa |
| Governança documental | 0,9/1,5 | Rebuts, segell, SCC i graf operatiu reparats; altres scanners encara discrepen en univers i resolució |
| Salut operativa | 0,7/1,5 | Cens 22/22; vigilants incomplets, disparadors decoratius i 20 portes roges |

### F1 · Guarda de sessió abans del primer await — corregit (P1)

`src/data/identitat.js` aporta una generació d’entrada independent de la versió de credencials. `capturaSessio()` captura la generació i l’actor desat, també si el JWT està caducat. Una renovació vàlida del mateix actor conserva la generació; login, logout i reentrada la canvien. La renovació rebutja un usuari diferent.

`src/data/supabase/auth.js` captura la guarda i una còpia de configuració abans d’esperar. Les passa a `asseguraUsuari` i les comprova abans d’enviar i després de resoldre PUT/PATCH. La resposta tardana no anuncia èxit sobre una sessió substituïda. Els tests avorten A→B, A→logout i reentrada d’A durant refresh amb **zero crides d’escriptura**; mantenen la renovació legítima i la captura d’origen. Una fallada de xarxa només permet continuar si el JWT encara val.

### F2 · Persistència coherent i error observable — corregit (P1)

`src/config/storage.js` serialitza tot el grup abans d’escriure i retorna èxit/fallada. Manté les claus públiques i sessionStorage. Una marca persistent invalida el grup mentre es desa, i només desapareix quan totes les peces s’han escrit. Si falla una peça o la confirmació, s’invalida tot el grup; un conjunt en memòria impedeix rellegir residus fins i tot si la neteja falla. La marca persistent també evita reactivar un grup parcial en recarregar el mòdul.

`desaSessio` retorna false i invalida la sessió davant una fallada. Login i registre comproven el retorn i no anuncien èxit fals. L’actualització d’usuari tampoc anuncia un perfil desat si falla storage. Proves: quota en cadascuna de les tres peces, serialització circular, indisponibilitat/denegació, fallada de neteja i recuperació després d’una nova escriptura completa. Cap prova usa credencials reals.

### F3 · Política d’orígens exactes — corregit (P2)

La política diferencia pares i callbacks. Una `parentOrigins` explícita substituïx els defaults, inclús per a l’origen propi. Les llistes es copien abans de congelar-les. Les ordres del pont exigeixen igualtat de protocol, host i port i `event.source === window.parent`; es rebutgen ports aliens, subdominis, credencials dins d’URL, camins i wildcard. La política de callback té funció separada; el relé conserva el seu retorn local existent.

### Fases 3 i salut documental — executat

- Fixture de `UniversalWorkspace.test.jsx`: afegit `data.lead`, preservant l’assert de l’entradeta. No s’ha modificat cap component visual de producte en este torn: la comparació amb l’inventari inicial només mostra canvis nostres en dades, configuració, host, portes, proves i documentació.
- Cens E4 de `tractor-enxufe.mjs`: les proves i mocks queden fora del recompte de superfície pública. Una fixture independent confirma que la mateixa assignació a `window` en producte continua bloquejada.
- Tractor d’estils existent reforçat amb AST de Babel ja instal·lat, sense dependències noves ni baseline. Compartix `isSafeCromStyle` amb la porta de disseny; no inventa excepcions per a variables CSS. Detecta `style =`, propietats derivades, variables, spreads i errors de parseig. La cadena ja el cridava, per tant no cal una segona porta paral·lela.
- Reparades descripcions, etiquetes i tipus de metadades de cinc skills. Els procediments es conserven. El segell previ divergent corresponia exclusivament al canvi de toolbar ja present: inspeccionat i reconciliat amb hashes explícits. La mutació posterior ha passat per l’executor CAS i claim real.
- Índex derivat reconstruït i sis entrades de catàleg Claude afegides com a enllaços als originals; cap duplicació del cervell. Cens **16/22 → 22/22**, errors de frontmatter de skills **5 → 0**, avisos totals del Mapa **48 → 24**.
- Gràfica de consum ancorada i referències a l’auditoria anterior reapuntades al destí arxivat verificat. Graf operatiu: **3 trencats + 1 orfe → 0/0**. SCC: **valid:true**. El directori regenerable `var/` de l’arrel queda fora del graf; una prova confirma que `_wiki_de_poble/var/` continua auditada.
- Prompt original de les 15:37 regularitzat per `document.mjs import`: revisió activa a l’Escriptori amb rebut actual; original arxivat intacte i còpia immutable per SHA a runtime/imports. No s’atribuïx una lectura ni un rebut retroactiu. Queda actiu per revisar el relleu d’esta execució.

### Allò que continua roig i per què

**P1 · Cadena de portes sense verd global.** De 51 portes individuals del catàleg executades, 31 passen i 20 fallen. La cadena global supera el segell reparat i s’atura en Importacions: interpreta com a import real un text de fixture de `construeixMapa.test.js`. No s’ha relaxat ni regenerat cap baseline. La taula de Verificació conserva cada resultat.

**P2 · Estils i disseny protegits.** La porta AST detecta 18 atributs d’estil no autoritzats en App, primitives, editor i seccions. També fallen graella, tokens, fitxa, crom, estucat i altres portes de disseny. El mandat prohibix modificar components visuals: la correcció necessària és traslladar cada regla a CSS amb comparació visual, dins d’un torn autoritzat per a eixa superfície. El cas `textAlign: 'center'` queda mecànicament bloquejat des d’ara.

**P2 · Universos documentals incompatibles.** Orfandat i SCC resolen el graf operatiu, però Teixidor/Llaurador interpreten altres universos, rebuts JSON, històrics i enllaços relatius; per això «0 orfes» ací no equival a zero en tots els scanners. Frontmatter inclou restes ocultes de cervells antics; nomenclatura arriba a noms del laboratori. Proposta: un únic inventari tipat compartit (operatiu, evidència, derivat, arxiu i zona humana), el resolutor actual d’enllaços i proves de paritat entre portes. No arreglar-ho adoptant automàticament tots els fitxers com a coneixement viu.

**P2 · Execució dels vigilants no acreditada.** La Consola compta 1/3 vigilants vius. Reflex-daemon apunta a un script absent; Time Machine no té llançador detectat. Les cinc plaquetes declarades no són cinc serveis independents instal·lats. No s’ha instal·lat ni activat cap automatització destructiva per forçar verd. Cal decidir la retirada del daemon antic o implementar-ne el substitut amb contracte, i distingir capacitats disponibles de tasques realment programades. Dos hooks d’Antigravity no tenen consumidor acreditat.

**P3 · Disparadors i mencions històriques.** Queden 7 disparadors decoratius, 4 avisos d’orfandat de skills del Mapa i 2 mencions de skills inexistents. El router normal carrega el core, però el camí `--punters` només mostra coincidències; el Mapa ha de representar el mode concret. Una cita històrica («absorbida») no prova una crida executable. Millorar-ne la classificació amb evidència, sense inventar activació. A més, `core-automillora` encara descriu exclusivitat d’edició de MarIA, en tensió amb l’autoritat humana d’AGENTS §15; cal reconciliar eixa instrucció, no usar-la per ignorar este encàrrec.

### Tractor d’higiene: flux proposat, sense arxivar a cegues

1. **Inventari abans del prompt.** Un preflight de només lectura enumera l’Escriptori, safata, documents protegits per torns i àncores. Emet un manifest amb ruta, hash, mida, estat, rebut, torn i enllaços entrants. No recorre contingut de l’arxiu històric ni de carpetes humanes.
2. **Lectura i classificació explícites.** Entrega íntegrament cada document candidat a classificació i registra el hash entregat. L’agent aporta una decisió i motiu: conservar actiu, arxivar tancat o proposar eixida externa. Un rebut acredita entrega, no comprensió: un test no pot demostrar que una IA ha entés un text.
3. **Proteccions per dades.** Pla/auditoria pendent, document vinculat a torn viu, dependència d’una tasca activa o classificació incerta → conservar. Mai classificar només per antiguitat. `01_produccio` i `02_investigacio_ia` són excloses de neteja automàtica. La safata es processa, no rep generacions.
4. **Pla revisable i verificació CAS.** El pla conté origen, destí, motiu i hash previ; calcula també les àncores i relleus que canviaran. Si el fitxer, índex o torn ha canviat després de la lectura, el pla caduca. Cap opció per ignorar-ho silenciosament.
5. **Arxivament transaccional.** Amb autorització vigent i lease d’abast exacte: còpia durable, moviment, actualització d’àncores i handoff del rebut com una operació recuperable. Comprovar contingut al destí i graf final. Una fallada deixa un estat pendent diagnosticable i no permet generar el prompt següent amb caselles fictícies.
6. **Eixida externa separada.** Per a contingut alié al sistema: proposta d’exportació i custòdia. P-10 declara l’arxiu germà `_arxiu_wiki_de_poble` només lectura fins a tindre repositori i Reflex propis; no es mou res fora automàticament ni s’amplien scopes amb `..`. La decisió humana i un mecanisme de custòdia vàlid són el pas final.
7. **Obrir la petorreta.** `document.mjs create` ha de consumir el resultat d’higiene vigent (hash d’inventari, decisions i verificació posterior) abans de permetre el nou prompt. Un `--check` pot funcionar sense mutació quan tot continua actiu i ben ancorat. La generació del pla i prompt ha de ser atòmica o quedar marcada com a incompleta.

Proves d’acceptació del futur tractor: auditoria antiga encara activa conservada; pla tancat arxivat amb hash idèntic i enllaços reparats; document canviat entre lectura i aplicació avorta; binari humà només inventariat; fallada després del moviment recuperable; destí extern bloquejat; zero fitxers perduts. Alternatives descartades: buidar per data i posar enllaços a tot sense llegir.

### Opinió i proposta per a la portada de la Consola

La Consola és útil perquè exposa fonts, contractes i execució. El risc actual és presentar totes les incidències amb el mateix pes i confondre «no mesurat», «declarat» i «trencat». La portada hauria de permetre decidir la següent acció amb sis targetes existents enriquides, sense crear un altre sistema visual:

| Targeta | Informació visible | Acció concreta |
|---|---|---|
| Identitat i backend | Última suite, data, regressions, integració local/remota i RLS sense mesurar | Obrir evidència de la darrera prova |
| Documents | Trencats/orfes operatius, àmbit del recompte, canvis des de l’última mesura | Veure els tres primers fitxers afectats |
| Skills | 22/22 al cens, metadades vàlides, 7 disparadors decoratius | Veure divergències d’activació |
| Portes | 31/51 passen en esta captura, primera fallada, hora i empremta del codi | Obrir la fallada i la comanda reproduïble |
| Vigilants | 1/3 viu, última execució correcta/error, proper venciment | Obrir el servei o declarar-ne la retirada |
| Recuperació | Edat de l’última instantània, cobertura i últim assaig de restauració | Revisar llançador i prova de recuperació |

Cada targeta necessita numerador/denominador, perímetre, timestamp, frescor i font. Separar fallada real, absència de dada, deute conegut i decisió pendent amb text a més de color. Mostrar tres causes agrupades (no dotze avisos derivats del mateix índex caducat). Sense proves remotes, «N/A», mai verd. Fer visibles la darrera execució i l’estat declarat en camps distints. Les dades han de vindre dels mateixos JSON de les portes; la UI no ha de recalcular regles.

### Millora del prompt local

Afegir un camp inequívoc `mode: auditoria|execucio` i un bloc d’autorització amb abast i pla. El prompt actual diu alhora «consens absolut» i «AFK absolut»: la instrucció humana ha resolt el conflicte en este torn, però la plantilla l’hauria d’evitar. Les caselles d’higiene i rebut s’han d’omplir amb resultats verificats, no amb prosa preafirmada. Separar blocs fixos d’identitat dels criteris executius canviants; el circuit ja usa hashes i contractes, una còpia literal no acredita comprensió. Incloure explícitament quines portes defineixen el verd requerit i com es registra deute heretat.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Vitest complet: **514 proves, 71 fitxers, totes passen**. Inclou auth, storage, orígens, relé, host i UX existents.
- Node complet: passada final agregada **304 passen, 0 fallen, 2 omeses** (306 tests, 40 fitxers). Inclou la regressió SCC addicional.
- Lint: cap error ni avís.
- Build web i standalone: correctes. Standalone: 2.702,47 kB / 816,68 kB gzip; avís de chunks web >500 kB conservat per a la fase 5, sense redisseny.
- Navegador `http://localhost:3340`: arrenca a Xat; Perfil sense sessió obri `/registre` amb el formulari d’accés. No s’han creat comptes ni enviat dades.
- Metadades de les cinc skills: esquema canònic local, zero errors. El validador genèric de skill-creator rebutja els camps propis `core`, `status`, `tags`, `triggers_on` i `type`: no és compatible amb el contracte SDP, que és el comprovat ací.
- Orfandat, SCC, segell, catàleg de skills, contracte documental, plantilles, enxufe, adaptadors, frontera auth, Frontissa i RLS estàtic: passen.
- Cadena global executada: falla a Importacions. A continuació s’han executat individualment les 51 portes amb script del catàleg, excepte Build (els dos builds ja s’havien executat), per no ocultar la resta de resultats.

| Porta | Resultat |
|---|---|
| `porta:plantilles` | passa |
| `porta:segella` | passa |
| `porta:documents` | passa |
| `porta:psicopatia` | passa |
| `porta:58px` | passa |
| `porta:importacions` | falla |
| `porta:promesa` | passa |
| `porta:tdz` | passa |
| `porta:arrel` | passa |
| `porta:enxufe` | passa |
| `porta:maquinari` | passa |
| `porta:graella` | falla |
| `porta:innerhtml` | passa |
| `porta:rutes` | falla |
| `porta:rutes-web` | passa |
| `porta:frontera` | passa |
| `porta:adaptadors` | passa |
| `porta:frontera-auth` | passa |
| `porta:sanejador` | passa |
| `porta:cognitiu` | passa |
| `porta:cens` | passa |
| `porta:consell` | passa |
| `porta:registre` | passa |
| `porta:manifest` | passa |
| `porta:doctrina` | falla |
| `porta:reflex` | falla |
| `porta:pedra-seca` | falla |
| `porta:design-guard` | falla |
| `porta:tokens` | falla |
| `porta:fitxa` | falla |
| `porta:cromatic` | passa |
| `porta:crom` | falla |
| `porta:vocabulari` | falla |
| `porta:estucat` | falla |
| `porta:atomic` | passa |
| `porta:llaurador` | falla |
| `porta:frontmatter` | falla |
| `porta:nomenclatura` | falla |
| `porta:teixit` | falla |
| `porta:scc` | passa |
| `porta:orfandat` | passa |
| `porta:persistencia` | falla |
| `porta:cadena` | passa |
| `porta:llavor` | passa |
| `porta:utilitatssdp` | falla |
| `porta:inlinestyles` | falla |
| `porta:classes` | passa |
| `porta:frontissa` | passa |
| `porta:olivera` | passa |
| `porta:rls` | passa |
| `porta:cataleg` | falla |

Reproducció de Node: enumerar `rg --files tests tooling -g '*.test.mjs' -g '*_test.mjs'` i passar totes les rutes a `node --test`. Les dues proves omeses no compten com a verificades. La porta `tancament --check` ha passat després del relleu d’ESTAT i LEDGER: plantilles, autoritat, ledger, segell, skills, wiki, proves documentals i SCC, sense errors. Tot seguit es registra `--close` amb una nova comprovació completa. El tancament documental no equival al verd de la cadena global.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

- `requires_human_decision: true` per a ampliar l’abast als components visuals protegits, decidir el destí del daemon antic o l’eixida de custòdia externa. Estes decisions no bloquejaven les reparacions locals executades.
- Fase 4 fora d’abast: cap contracte real, emissor acceptat per Supabase, captura DTO ni staging multiusuari aportats. No es declara connexió Sollutia real ni zero vulnerabilitats.
- No hi ha commit, push ni desplegament en este torn. Reflex doctor exigix durabilitat en HEAD i assenyala a més un contracte antic del graf; no s’ha forçat el verd.
- UI preservada respecte de l’inventari d’inici d’este torn; el working tree ja tenia canvis visuals previs d’altres torns. No s’atribuïxen a esta execució ni es revertixen.
- El sistema continua amb deute global descrit; no és correcte anomenar-lo «estabilitat completa» o «100% net». Les reparacions de les fases 1–3 i les seues proves sí que estan entregades.
- Acta Marmota global de jornada pendent; esta auditoria i ESTAT aporten el relleu d’execució.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260925_1537_pla_implementacio_codex]]
- [[260925_1537_prompt_codex]]
- [[../90_arxiu_historic/260925_Tanda_Codex_Vesprada/260925_1544_auditoria_codex]]
