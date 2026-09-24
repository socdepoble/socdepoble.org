---
type: informe
status: esborrany
description: Diagnòstic amb puntuació, contracte modular, alta de persones i revisió fitxer a fitxer de les skills i del graf actiu.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_13664aa9-acde-475b-8e65-d0f84b2564c9:874d8b1c-5634-46c1-8d43-f80878c4ec49
---
# Auditoria independent del Mas: Sollutia, Workspace i coneixement

Auditoria independent del codi i del coneixement actiu. Les reparacions aplicades i els prototips de laboratori es distingixen de les propostes d’integració.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_13664aa9-acde-475b-8e65-d0f84b2564c9:874d8b1c-5634-46c1-8d43-f80878c4ec49 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T15:09:00.611Z |
| Modificació | 2026-09-24T15:09:00.611Z |
| Propietari | codex |
| Aprovació humana | Auditoria i propostes/codi autoritzats en l’encàrrec; alta real ajornada expressament |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesurats: no disponibles; estimats: no calculats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-24: inspecció independent des de HEAD `57ec5684d80e27981e497c1c0c1880ddb53cf63c` amb arbre brut i treball concurrent. Reproduccions, sis reparacions d’enllaços, àncora de l’acta i dos prototips amb proves. No s’han usat conclusions d’altres auditors.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Nota: 6,0 / 10

**El Mas té un bon esquelet de producte, però encara no és una plataforma modular demostrada.** El principal fre és la distància entre els contractes declarats, les dades reals i les portes que pretenen garantir-los. Més instruccions imperatives no resoldran esta distància.

La nota és un judici d’enginyeria sobre l’arbre local observat, amb rúbrica explícita; no és una mètrica de producció ni una certificació de seguretat. No puntue la intenció, el nombre de tractors ni el nombre de documents. Confiança mitjana: codi i proves locals disponibles, integració remota no contrastada.

| Dimensió | Pes | Nota | Justificació observable |
|---|---:|---:|---|
| Frontera frontend/backend | 25% | 7 | Port central, adaptador encapsulat, origen i sessió protegits; 32 mètodes obligatoris i Sollutia sense catàleg activat. |
| Workspace i extensibilitat | 20% | 7 | Model, renderers, selecció i límits d’error reutilitzables; rutes/proveïdors/menú encara es cablegen manualment. |
| Persones, grups i drets | 15% | 4 | Alta, perfils privats i organitzacions existixen; targeta pública i relacions no estan connectades al compte. |
| Wiki i maduració | 20% | 4 | Reparació documental possible i bon nucli de validació; motors amb taxonomia antiga, cens divergent i instruccions contradictòries. |
| Verificació i operació | 20% | 7 | Proves negatives valuoses, CI i portes; hi ha errors reproduïts i no tenim acceptació de staging. |

Mitjana ponderada: **5,95**, arrodonida a **6,0**. Les reparacions d’este torn no justifiquen augmentar-la: eliminen símptomes documentals, però els buits d’integració i govern continuen.

### 2. Troballes prioritzades i reproduïbles

P1 = impedix afirmar que el flux essencial està preparat o deixa una garantia de govern sense cobertura. P2 = deute funcional o de manteniment amb abast identificat. Cap troballa es presenta com una intrusió demostrada.

| ID | Prioritat | Evidència i efecte | Acció i decisió |
|---|---|---|---|
| A01 | P1 | `src/data/adaptadors/sollutia/client.js`: `apiOrigin: null`, `resources: {}`; `llig()` rebutja qualsevol recurs. Les portes verdes proven la frontera tancada, no una connexió real. | Mantindre-la tancada fins a disposar de contracte i captura versionada del proveïdor. `requires_human_decision: false`; falta evidència externa. |
| A02 | P1 | `ProfileSection.jsx` busca `agentId` dins de `agents`. Les rutes persona/empresa/grup/ajuntament reutilitzen eixe catàleg. `PerfilContext` edita `profiles` i `organizations`: són dos circuits diferents. | Afegir port de directori amb DTO públic i connectar la Card al compte. `requires_human_decision: true` per als camps que Javi vol publicar. |
| A03 | P1 | `contradiction_engine.mjs` només admet jurisdiccions `00_SER_Brain_Identitat`, `01_SABER_Cultura_Coneixement`, `02_ACTUAR_Maquina_Tecnica`, `03_GOVERNAR_Normativa_Regles`. Dos documents idèntics de `02_saber` donen zero candidats en la prova sintètica. | Unificar política de corpus i exigir denominador; zero documents no pot significar salut. `requires_human_decision: false`. |
| A04 | P1 | `cataleg_skills.mjs --check` rebutja `core-taxonomia-estricta` per `status: esborrany`; tampoc té triggers. `build_skills_index.mjs --check` retorna 0 amb 8 core i 14 plugins, sense comparar el fitxer persistit ni exigir estat actiu. | Un inventari validat compartit pels dos constructors; esborranys fora del catàleg actiu. `requires_human_decision: true` per promoure o fusionar una norma. |
| A05 | P1 | `tractor-orfandat` només comprova entrada i exclou l’escriptori del recompte d’orfes; una illa A↔B sense camí des de l’índex passa. `teixidor` usa altres nodes, un altre resolutor i connexió no dirigida. | Un snapshot i resolutor compartits; grau entrant i accessibilitat dirigida com a mètriques diferents. `requires_human_decision: false`. |
| A06 | P2 | `corpus_snapshot.mjs::zoneOf` reconeix `90_historic`, però classifica `90_arxiu_historic` com `fora_taxonomia`; el seu descobridor recorre l’històric. `semantic_auditor` conserva pilars antics. | No reutilitzar estos descobridors per a RAG automàtic; seleccionar el corpus abans de llegir cossos. `requires_human_decision: false`. |
| A07 | P2 | `CONTRACTE_NUCLI` obliga a 32 funcions, inclosos xat, organitzacions, notes i Magic Link, encara que este últim llança una excepció. Existència d’una funció no equival a funcionalitat disponible. | Evolucionar a capacitats completes per domini i estat de servei explícit, mantenint compatibilitat inicial. `requires_human_decision: false`. |
| A08 | P2 | `recursos.js` conserva `...payload` i exposa `_sollutia`; usa `traductor`, mentre el transport usa `decode` i un catàleg separat. La fixture és de prova i no acredita procedència real. | Un únic descriptor per recurs, DTO amb camps permesos i prova de valors exactes. No és una filtració activa: el catàleg runtime està buit. `requires_human_decision: false`. |
| A09 | P2 | `updateProfile` escriu primer metadades Auth i després `profiles`; la segona operació pot fallar després de la primera. `getProfile` transforma fallades en un perfil de metadades, sense indicar l’origen. | `profiles` com a font de perfil, estat d’error explícit i sincronització Auth secundària; provar fallada parcial. `requires_human_decision: false`. |
| A10 | P2 | `ajustosPersona` permet `is_public`, però les migracions finals mantenen lectura de `profiles` només per `auth.uid() = id`. No s’ha trobat una projecció pública de persones que faça efectiu l’interruptor. | Projectar únicament camps públics en un recurs separat. No obrir tota la taula de perfils. `requires_human_decision: true` per política de publicació. |
| A11 | P2 | `UniversalWorkspace` activa `canCreate` per defecte llevat de `false`; `createAndSelect` comprova callback/ocupació, no el permís; el menú diu «Ordenar notes per» dins d’un component genèric. | Resoldre accions en el domini, denegar escriptures per defecte i validar-les també al servidor. El defecte visual no acredita bypass de RLS. `requires_human_decision: false`. |
| A12 | P2 | `SELF-DESCRIBE.md` diu que l’amfitrió injecta el backend, però `host.configura` ho rebutja explícitament. L’ADR diu que el GET envia token, mentre el transport només posa `Accept`. | Reescriure una guia d’integració a partir dels contractes verificats; conservar l’ADR com a decisió amb estat real. `requires_human_decision: true` si es vol canviar de Model B. |

La protecció contra respostes tardanes, la separació de dades per sessió, el transport amb timeout/abort i els límits d’error del Workspace són fortaleses reals. No propose desfer-les per a «simplificar».

### 3. Sollutia: un endoll clar i tres responsabilitats separades

El flux observat és: **vista → backendPort → adaptador Supabase → Auth/PostgREST/Storage/Realtime**. `host.js` selecciona i segella la implementació abans del muntatge. Sollutia pot allotjar l’SPA/Web Component i entregar una sessió; la frontissa GET és una via addicional encara desactivada.

Cal distingir **proveïdor de la infraestructura**, **tecnologia del backend** i **propietari dels contractes de domini**. Sollutia pot gestionar la infraestructura que allotja el backend sense decidir la graella, les Cards o els mòduls. El codi actual conserva Supabase de SdP com a font autoritativa. No pressupose una migració a una API propietària de Sollutia perquè seria una decisió diferent.

| Frontera | Entrada mínima | Evidència d’acceptació |
|---|---|---|
| Allotjament | assets de build, URL base i rutes SPA | càrrega directa i recàrrega d’una ruta profunda, política d’orígens i cache de versions |
| Sessió | emissor, audiència, origen pare, contracte de renovació i logout | token acceptat pel servidor, expiració, canvi d’actor, dues pestanyes i denegació entre usuaris |
| Dades | ports de domini amb DTO i errors comuns | fixtures versionades i proves contra staging; paginació, cancel·lació i permisos |

**Simplificació proposada, incremental:**

1. Conservar `backendPort` com a façana de compatibilitat. Moure la configuració de proveïdor a la composició de l’arrencada i lligar-la una vegada; les funcions de negoci reben identificadors, DTO i `signal`, no configuració Supabase repetida.
2. Introduir ports `session`, `people`, `groups`, `notes`, `chat`, `media` i `agenda`. Cada mòdul exigix només el seu conjunt complet. Un backend sense xat ha de poder obrir la Llibreria sense 32 funcions artificials.
3. Deixar una sola definició de cada recurs Sollutia: identificador, versió, captura, path, paràmetres, límits i `decode`. Validar la fixture contra el mateix decoder que usarà el runtime. Eliminar `_sollutia` del DTO públic i evitar `...payload`.
4. Normalitzar errors (`unauthenticated`, `forbidden`, `not-found`, `conflict`, `unavailable`, `cancelled`) a la frontera. La UI no ha d’interpretar codis PostgREST ni JSON del proveïdor.
5. Exportar/importar dades amb identificadors estables i assajar restauració. Poder canviar una classe d’adaptador no prova per si mateix que es puga abandonar un proveïdor: també cal traslladar dades, fitxers i identitat.

La sessió externa valida forma, caducitat, emissor i audiència al client; **no valida la signatura criptogràfica allí**. Això està documentat al codi i no prova un bypass del servidor. Cal demostrar l’acceptació i verificació del token en el backend real; si l’emissor extern no és compatible, resoldre l’intercanvi al servidor. No afegir tokens al transport públic GET per intuïció.

El lliurable mínim de Sollutia hauria de ser un contracte curt: URL de staging, protocol de sessió, especificació de dades, exemples anonimitzats versionats, política d’errors i responsable dels backups. Una conversa comercial o una fixture de prova no substituïx este lliurable.

### 4. Workspace: mòduls per domini, amb un registre senzill

`UniversalWorkspace` ha de continuar sent un component de presentació: navegació, selecció, llistat i detall. Un mòdul aporta el seu model i els seus renderers. El registre de mòduls compon menú, ruta i càrrega diferida; el shell no conté `if (gestoria)` ni regles de negoci.

Contracte de manifest proposat, encara no integrat en producció:

```js
const gestoria = {
  id: 'gestoria', version: 1, route: '/gestoria',
  requires: ['documents.read', 'documents.write', 'cases.read'],
  entitlement: 'gestoria',
  load: () => import('./gestoria/entry.js'),
  actions: [
    { id: 'sort', kind: 'view', label: 'Ordenar' },
    { id: 'create', kind: 'write', permission: 'documents.create', label: 'Enviar document' }
  ]
};
```

Els identificadors són de domini, no noms de taules. La llista de mòduls és de codi conegut i revisat; «endollable» no requerix executar JavaScript arbitrari descarregat de tercers.

**Condició d’activació:** habilitat pel poble/compte + capacitats disponibles + subscripció concedida pel servidor + permisos per a l’acció. Els quatre factors són independents. Si falla un, la ruta directa tampoc munta el proveïdor ni inicia peticions del mòdul. Apagar un mòdul cancella subscripcions i lectures, controla treball pendent i conserva les dades per a exportació o reactivació. No equival a esborrar-les.

Cada domini tindrà model, port, adaptador, UI i proves dins de la seua secció. Reutilitzem els components visuals, no una taula universal de dades fiscals, llibres, persones i cultius. La clau de cache ha d’incloure compte/poble, actor, mòdul i generació de sessió; ja hi ha patrons útils de scope en Notes i Perfil.

| Mòdul | Model propi | Servei i frontera | Apagat / monetització |
|---|---|---|---|
| Persones | perfil privat i targeta pública separats | lectura pública limitada; edició del titular | Nucli d’identitat; mai supeditar l’accés al compte a un servei de pagament. |
| Grups | organització, membres, invitacions i rols | aprofitar `organizations(kind='group')`; completar gestió de membres | Desactivar la secció no elimina la pertinença. |
| Relacions | origen, destí, tipus i estat | distingir seguir, invitació pendent i relació acceptada; bloqueig independent | No confondre ser membre amb ser administrador o contacte mutu. |
| Gestoria | expedient, documents, període, estat i rebut | arxius privats; permisos per expedient; comandes idempotents i traça de recepció | Subscripció del compte/organització; presentar tràmits és una acció explícita separada de pujar documents. |
| Llibreria | llibre, edició, manifest YAML, pàgines/OCR, drets i procedència | YAML amb esquema i límits de mida, profunditat i àlies; assets amb rutes confinades; renderitzat sanejat | Lectura/catàleg i serveis editorials poden tindre drets diferents. YAML descriu el llibre; no fa l’OCR d’un escaneig. |
| Ajuntament | catàleg de tràmits, sol·licitud, adjunts i rebut | connector municipal substituïble; diferenciar borrador, enviat i registre confirmat | Sense connector/rebut real, mostrar el límit del servei. |
| L’Hort | parcel·la, cultiu, finestra local de sembra i subscripció d’avisos | dades agrícoles versionades amb localitat/font; scheduler de servidor i adaptador d’avisos | SMS desactivat fins a contracte/cost; calendari web independent. |

La idea de plugins amb extensions i càrrega diferida té precedent en la documentació de [Backstage](https://backstage.io/docs/frontend-system/architecture/plugins/). Ací només adopte el patró; instal·lar Backstage seria desproporcionat per a esta aplicació.

**Criteri pràctic d’enxufabilitat:** afegir un segon mòdul no exigix editar el JSX de `UniversalWorkspace`; desactivar-lo impedix càrrega, peticions i accions tant al menú com a la URL; un adaptador alternatiu passa la mateixa suite de contracte. El prototip de política només demostra les decisions d’activació/accions; no afirma que estes tres proves d’integració ja estiguen resoltes.

### 5. Javi: alta formal preparada, sense inventar el compte

L’usuari ha triat expressament **deixar el flux preparat**. No s’ha creat cap compte, enviat correu ni assignat rol. Una Card amb el nom Javi dins del seed no és un usuari registrat.

Flux proposat sobre les peces existents:

1. `/connectar`/onboarding valida nom i correu i inicia el registre o el login. La contrasenya s’introduïx a la UI d’autenticació; no es posa en documents, fixtures ni xat.
2. Si Auth requerix confirmar el correu, l’estat és `pending-verification`. Rebre un `user.id` sense sessió no habilita l’espai privat.
3. El trigger servidor crea `profiles.id = auth.users.id` i la pertinença de poble segons el contracte real. Confirmar-ho en staging: el codi d’una migració al repo no prova que estiga aplicada.
4. El client carrega el perfil propi confirmat. El nom visible «Javi» és una dada editable, mai la clau d’autorització ni un motiu per donar `superadmin`.
5. La Card pública és una projecció del perfil amb camps permesos, slug únic i estat de publicació. Proposta: nom, avatar, biografia breu i poble amb consentiment; correu, credencials i rols interns no entren al DTO públic.
6. Javi pot editar la seua Card i gestionar els seus grups segons rol. Una altra persona no pot editar-la canviant l’ID en una petició.

La documentació de [Supabase sobre dades d’usuari](https://supabase.com/docs/guides/auth/managing-user-data) separa Auth de les taules accessibles per l’API. Els permisos s’han de validar amb [grants i RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), no amb la visibilitat d’un botó.

Acceptació: alta nova, alta repetida, verificació pendent, login, perfil absent/error, edició pròpia, denegació des d’un altre usuari, Card privada/pública i logout amb petició en vol. No s’ha executat cap d’estos casos contra un servidor remot en este torn.

### 6. Botons i permisos: decidir fora de la graella

La proposta és una funció pura en el domini que retorna accions ja resoltes. `WorkspaceToolbar` les pinta i `UniversalWorkspace` només col·loca la barra. L’estat de sessió/rol, els grants i la pertinença es consulten abans d’arribar a la graella.

| Situació | Crear nota | Ordenar/cercar |
|---|---|---|
| Sessió encara comprovant-se | ocult | disponible si hi ha dades llegibles |
| Visitant sense permís d’escriptura | ocult; CTA de connexió al lloc adequat | disponible |
| Usuari amb permís i llista preparada | visible i actiu | disponible |
| Creació en curs | visible, desactivat i amb estat accessible | independent de la creació |
| Columna replegada | ocult per composició visual | els controls que admeta la barra replegada |
| Mòdul apagat o backend no disponible | no munta el flux | no munta el flux |

`canCreate` és una projecció per a UX. El handler ha de tornar a comprovar l’actor/abast abans d’enviar i després de rebre; el servidor és qui autoritza. El permís no ha de dependre de si existix un callback. En paginació, ordenar només els 50 elements carregats no és ordenar tota la col·lecció: el criteri s’ha de passar al port o declarar explícitament ordenació del lot.

El [prototip d’accions](02_investigacio_ia/260924_1706_prototips_codex/moduls.mjs) prova invitats, càrrega, ocupació, absència de capacitat, mòdul apagat i subscripció sense permís d’escriptura. L’app conserva la UI prèvia a este torn.

### 7. Orfenat: reparar el cas actual i resoldre la causa

**Reparat:** les sis referències al fitxer retirat `03_consola_termodinamica` apunten ara a la portada verificada de la carpeta actual. S’han conservat els àlies i el contingut. L’acta de les 14:45 queda ancorada a l’índex de l’escriptori. La porta anterior passa amb 0/0 després de la reparació.

**No confondre 0/0 amb salut de tot el coneixement.** La mateixa porta no inclou les skills ni exigix entrada als documents de l’escriptori. El tall del prototip dirigit va incloure 153 nodes i 405 arestes: 5 documents inaccessibles, 2 referències no resoltes en skills i 0 duplicats byte a byte. Es conserven el hash i l’abast en `evidencia.json`. Tres dels cinc documents eren treball en curs concurrent; no s’han mogut ni adoptat com a autoritat. Els altres dos són les skills `core-taxonomia-estricta` i `sdp-universal-editor`, no recollides pel catàleg llegit.

`teixidor --json` va donar 33 orfes, 147 penjats i 26 nodes en illes en un altre tall. Estes xifres **no se sumen**: inclou altres fitxers, només parseja wikilinks i resol de manera diferent. Per exemple, documents amb enllaços Markdown poden aparéixer desconnectats en eixe motor. Cal reconciliar denominadors abans de fer un semàfor global.

El verificador SCC (`tooling/gates/verificador-scc.mjs::auditGraphConnectivity`) **ja incorpora DFS dirigit** des dels índexs. Per tant, no falta inventar l’algoritme: falta compartir-lo entre les portes amb una política de corpus coherent. El seu diagnòstic final tracta també referències del laboratori com a nodes operatius, fet que reforça la necessitat de distingir zones. El prototip aporta reproduccions mínimes; la integració hauria de reutilitzar i consolidar SCC, no afegir una porta redundant.

Solució de producció proposada:

1. **Un `CorpusSnapshot` per execució.** Identitat/rutes des de `cervell.json`; zones operatives, escriptori, evidència, laboratori, vendors i història diferenciades. Excloure els cossos d’història/backup abans de llegir-los per a RAG. Les referències explícites a història es poden comprovar per existència sense ingerir-ne el contingut.
2. **Un resolutor compartit.** Markdown relatiu, wikilinks, IDs/àlies únics, caixa exacta i ancoratges; ambigu no és absent. No usar `basename` com a identitat global: totes les skills es diuen `SKILL.md`.
3. **Tres propietats separades:** enllaç resolt, entrada des d’un altre node, camí dirigit des de l’índex autoritatiu. Un backlink cap a l’índex no garantix que es puga descobrir la nota des de l’índex.
4. **Pla de reparació amb prova.** Canvi de ruta verificat per identitat/hash o mapa de moviments explícit; preservar àlies/àncores. Una única carpeta amb portada és un candidat, no una llicència universal per triar significat.
5. **Aplicació acotada.** Llista exacta de fitxers, hashes previs, reserva de mutació, escriptura atòmica, diari i comprovació posterior. Un conflicte concurrent avorta el lot; no fa una «neteja» alternativa. No tocar producció humana ni moure contingut amb informació només perquè és orfe.
6. **CI i monitor consultiu:** bloquejar referències noves trencades i regressions de corpus; presentar deute existent amb identificador estable. No augmentar una baseline per aconseguir verd. No s’ha instal·lat cap daemon ni automatització en este torn.

El [prototip de graf](02_investigacio_ia/260924_1706_prototips_codex/graf.mjs) demostra l’accessibilitat dirigida i la detecció de duplicats exactes. Reutilitza el resolutor actual i declara que no valida àncores internes ni àlies YAML. És un experiment per consolidar els tractors existents, no una tercera porta de producció que haja de mantindre’s per sempre.

### 8. Maduració: inventari fitxer a fitxer de les 22 skills

Abast: tots els `SKILL.md` immediats de `.agents/skills/`, llegits en este torn; **21 amb estat actiu/canònic i 1 esborrany**. Els exemples importats al laboratori i els arxius històrics no són skills executives del projecte. `evidencia.json` conserva el SHA-256 de cada font.

La taula proposa noms de destí; no s’ha reescrit ni fusionat cap skill viva. Una skill bona té trigger, entrada, passos, resultat, prova de fallada i límit. Una preferència visual o una idea de producte són coneixement, no un procediment executable per si sols.

| Fitxer dins de `.agents/skills/` | Diagnòstic concret | Proposta i nom clar |
|---|---|---|
| `core-automillora/SKILL.md` | Barreja aprenentatge, interpretació emocional i exclusivitat d’edició de MarIA; contradicció amb l’autorització humana vigent. | Extraure procediment «cas → evidència → regla → prova» a **millora-continua**. Moure filosofia a Wiki; eliminar permisos deduïts del nom de l’agent. |
| `core-consell-i-colmena/SKILL.md` | Congela quotes, crèdits i models en una norma; diu que Codex és macro i recomana paquets incompatibles amb l’excepció local. | Fusionar coordinació amb estratègia en **coordinar-agents**; quotes com a dades amb data de lectura, mai normes permanents. |
| `core-context-panic/SKILL.md` | Detecta bucles, però obliga a abandonar tota la tasca i a un text únic, encara que hi haja treball independent possible. | Incorporar límits de reintent i relleu a **treball-verificat**; parar l’operació fallida amb evidència concreta. |
| `core-edicio-segura/SKILL.md` | Bon procediment de providers, preservació visual i proves; nomena una eina concreta i barreja incident amb contracte. | Conservar com a recepta d’edició UI dins de **verificar-interficie**; incident a l’acta. |
| `core-estrategia-ia/SKILL.md` | Valoracions fixes de cost/capacitat i procés manual; no identifica origen ni caducitat de la dada. | Absorbir en **coordinar-agents** amb pressupost, informació no disponible i data observada. |
| `core-higiene-escriptori/SKILL.md` | Distingix diagnòstic i mutació, però després demana vore que la taula ha quedat neta de documents d’ahir. | Fusionar en **cicle-documental**; classificació per estat i dependències, no antiguitat. |
| `core-identitat/SKILL.md` | És un carregador curt útil, però replica l’ordre d’arrencada que ja declara `cervell.json`. | **iniciar-sessio**: consumir l’ordre únic, no copiar-lo. Mantindre el coneixement a Wiki. |
| `core-memoria-historica/SKILL.md` | Procediment prudent: selecció explícita, estat, acte i arxiu amb decisió; solapa amb cicle de vida. | Absorbir en **cicle-documental**, conservant la prohibició d’ingestió històrica automàtica. |
| `core-restauracio-segellada/SKILL.md` | És la peça més completa: inspecció, salvavides, CAS i retorn; 178 línies amb història i repeticions. | Conservar separada com **restaurar-canvis**; extraure història a Wiki i mantenir proves de concurrència/retorn. |
| `core-taxonomia-estricta/SKILL.md` | Estat esborrany, sense triggers; bloqueja el catàleg i repetix documentació/reflex. | Fusionar el contingut útil en **crear-documents**. No canviar a canònic només per passar la porta. |
| `sdp-app-grid-shell/SKILL.md` | Contracte visual detallat; repetix nidificació de UniversalPage. | Referència **interficie/workspace** a Wiki; procediment de comprovació dins **verificar-interficie**. |
| `sdp-calendari-agricola/SKILL.md` | És un PRD futur amb frontera de dades i SMS, més que una habilitat recurrent. | Moure concepte a **moduls/hort**; recepta de desplegament només quan existisquen port i proves. |
| `sdp-casos-us-essencials/SKILL.md` | Repositori d’idees (menjar, cures, hort), sense resultat verificable; dos enllaços de skills no resolen al parser compartit. | Wiki **producte/casos-dus** amb enllaços de ruta exacta. No perdre cap cas d’ús en la fusió. |
| `sdp-estudi-mercat/SKILL.md` | Mètode útil, però el destí `04_ESCRIPTORI/01_Produccio/..._mercat_...` té caixa/categoria incorrectes i contradiu la zona humana protegida. | **investigar-referents**; lliurar via ruta documental `estudi_ia` a l’escriptori general, amb fonts i incertesa. |
| `sdp-pedra-seca/SKILL.md` | Conté normes visuals i procediment barrejats; coincidix parcialment amb Page/Editor. | Wiki **interficie/fonaments**; **verificar-interficie** carrega tokens i catàleg abans d’editar. |
| `sdp-universal-editor/SKILL.md` | Declara funcionalitats desitjades com a estàndard; autoguardat «al disc» no distingix confirmació remota; fora del catàleg observat. | Wiki **interficie/editor** amb estat implementat/proposat. Provar dirty/saving/saved/error; no buidar text real per fer clic en la plantilla. |
| `sdp-universal-page/SKILL.md` | Manual de 113 línies; repetix Workspace, i prescriu ombra/radis concrets mentre Pedra Seca exigix tokens. | Wiki **interficie/pagina**; una sola regla de nidificació i exemples del catàleg; excepcions visuals explícites. |
| `sdp-workflow/SKILL.md` | Bona exigència de pla/proves; conté autoreferència a «principis matemàtics» que no definix i lliçons que afavorixen bloquejos artificials. | **treball-verificat** com a procediment mestre; remetre a tokens/contractes concrets i respectar autorització humana existent. |
| `wiki-busca-skills/SKILL.md` | Procés de cerca i adaptació útil; anticipa escriure directament una skill sense separar esborrany/promoció. | **investigar-referents**, compartit amb estudis; resultat és proposta amb prova i procedència, seguida del circuit documental. |
| `wiki-cicle-de-vida/SKILL.md` | Procediment executable més precís del bloc documental, amb own/handoff/check. Duplica arrencada/generació. | Nucli de **cicle-documental** per estat, retenció i relleu; delegar creació a **crear-documents**. |
| `wiki-documentacio-i-reflex/SKILL.md` | Passos mecànics bons, però 89 línies d’analogia i lliçons reiterades; ordre de llegir primer l’altre auditor incompatible amb auditoria independent. | **crear-documents** per context/create/check. Coordinació a **coordinar-agents**, amb modes independent i contrast explícits. |
| `wiki-propagar-veritat/SKILL.md` | Proposa `find`/`sed` global sobre tota la Wiki sense excloure història/producció ni verificar hashes; pot alterar evidència i semàntica. | **actualitzar-coneixement**: inventari acotat, proposta de diff, precondicions, aplicació i verificació. Mai reescriure història per eliminar contradiccions actuals. |

Destí orientatiu: **9 procediments** (`iniciar-sessio`, `treball-verificat`, `crear-documents`, `cicle-documental`, `restaurar-canvis`, `coordinar-agents`, `millora-continua`, `investigar-referents`, `actualitzar-coneixement`) i **1 procediment d’interfície** amb tres manuals consultius. El recompte no és un objectiu per si mateix: només consolidar si es preserven triggers, excepcions i proves útils.

### 9. Motor de maduració sense fabricar autoritat

Ja existixen `contradiction_engine`, `brain_distill`, `somiador` i constructors de catàleg. El problema no és absència de noms o scripts: és la seua divergència. `somiador.mjs` reconeix al codi que les fases de destil·lació no estan implementades; sense `--dry-run` mou fitxers. No l’he executat.

Cicle proposat:

- **Capturar:** un incident amb font, data, exemple i resultat observat. El registre no és automàticament una norma.
- **Comparar:** hash exacte; després semblança sobre el cos sense frontmatter, boilerplate ni àncores comuns. Reutilitzar shingles del motor existent després d’arreglar el corpus. La semblança és una prioritat de revisió, no una contradicció demostrada.
- **Proposar:** parella de documents, fragments solapats, diferències, excepcions que es perdrien, destí canònic i canvi de triggers. No proposar fusions entre requisits i procediments només perquè compartixen vocabulari.
- **Verificar:** una prova negativa que falle abans i passe amb la nova regla; recompte del corpus i fonts exactes. Un detector que examina zero fonts ha d’eixir amb diagnòstic d’àmbit invàlid.
- **Promoure:** aplicar el canvi amb hashes i decisió editorial; regenerar índex, manifest i projeccions des d’un únic inventari. Registrar `supersedes` només quan l’esquema l’admeta o en un registre separat versionat; no inventar frontmatter incompatible.
- **Recuperar:** router/RAG consulta per defecte fonts actives amb ID canònic; col·lapsa equivalències aprovades, no còpies semblants. El contenidor històric continua disponible per consulta explícita i no competeix amb la instrucció vigent.

La mesura de maduració útil és «incidents repetits després de la correcció», «candidats revisats/descartats» i «proves negatives cobertes». Una escala automàtica de saviesa basada en longitud, edat o número de skills seria fictícia.

### 10. Ordre d’execució per a l’Olivera

| Fase | Resultat exigible | Estat d’este torn |
|---|---|---|
| 0 | Tall independent, nota i evidència pròpia | Entregat; sense llegir informes de Fable. |
| 1 | Reparar sis referències i ancorar l’acta | Aplicat i verificat 0/0 en la porta existent. |
| 2 | Unificar corpus/catàleg i substituir motors divergents | Disseny i prototip; integració no feta. Primer arreglar denominadors, després interpretar mètriques. |
| 3 | Contracte de sessió/dades Sollutia provat en staging | Pendent del proveïdor i de proves amb dos usuaris. |
| 4 | Javi: compte confirmat → perfil → Card | Flux preparat; alta ajornada expressament per l’usuari. |
| 5 | Registre modular i Persones/Grups | Disseny concret; integrar un domini i assajar un segon sense editar el shell. |
| 6 | Llibreria/Hort, després Gestoria/Ajuntament | Proposta; activació per capacitats i permisos, conservació/exportació de dades. |

Per arribar a 8/10 exigiria catàleg coherent, tots els tests rellevants verds, corpus sense omissions silencioses i alta/Card/Sollutia verificats de punta a punta. Per a 9/10, assaig de canvi de proveïdor, denegació entre comptes/pobles, desactivació de mòduls amb feina pendent i restauració de dades demostrada. No assigne terminis sense dimensionar l’API remota i el catàleg real.

Millora del protocol d’auditoria: separar `mode: independent` de `mode: contrast`; la lectura dels altres informes només correspon al segon. El camp d’aprovació ha d’indicar l’abast ja autoritzat, no quedar «pendent» mecànicament. Les mètriques de tokens desconegudes s’han de registrar com a no disponibles. Cap guió d’auditoria hauria de forçar ingesta de tot ESTAT, que acumula història, quan ja especifica llegir el bloc actual.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat | Límit |
|---|---|---|
| Prototips i reproduccions natives | 14/14 passen | Inclouen tres proves que demostren defectes dels motors antics; no signifiquen que estos motors estiguen corregits. |
| Vitest seleccionat | 29 passen, 1 falla | 6 fitxers: frontissa, auth, runtime, sessionService, host i UniversalWorkspace. El test de Workspace busca un combobox; el menú actual usa botons. |
| Node seleccionat | 32 passen, 10 fallen | 4 fitxers: backend_consolidacio, sistema_nervios, corpus-scope, public_exports. Els 10 fallen preparant fixtures pel mateix catàleg invàlid; no són 10 errors de producte independents. |
| tractor-enxufe / tractor-sollutia | passen | Comprovacions locals d’estructura. |
| tractor-frontissa / tractor-adaptadors | passen | GET tancat i 1 fixture de prova; no acceptació del proveïdor. |
| tractor-orfandat abans/després | 6 trencats + 1 orfe → 0 + 0 | Abast del tractor existent; no inclou totes les skills ni orfes de l’escriptori. |
| cataleg_skills --check | falla | Esborrany dins de la carpeta d’actius. |
| build_skills_index --check | retorna 0 | No comprova igualtat del fitxer persistit ni aplica el mateix filtre d’estat. |
| teixidor --json | falla | Tall inicial: 33 orfes, 147 penjats, 26 nodes en illes; resolutor i abast diferents. |
| run-portes --diagnostic | falla | En el tall intermedi: segell, signatura LEDGER i documents (incloent aleshores el meu esborrany incomplet). No s’atribuïx tota la fallada a treball alié. |

Reproducció des de l’arrel del repositori:

```sh
node --test _wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1706_prototips_codex/prototips.test.mjs
node _wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1706_prototips_codex/graf.mjs
node tooling/gates/tractor-orfandat.mjs
node tooling/gates/tractor-frontissa.mjs
node tooling/gates/tractor-adaptadors.mjs
node tooling/brain/cataleg_skills.mjs --check
node tooling/brain/build_skills_index.mjs --check
npx vitest run src/data/adaptadors/sollutia/creaFrontissa.test.js src/data/supabase/auth.test.js src/data/supabase/runtime.test.js src/data/sessionService.test.js src/components/universal/workspace/UniversalWorkspace.test.jsx tests/host.test.js --maxWorkers=2
node --test tests/backend_consolidacio.test.mjs tests/sistema_nervios.test.mjs tests/corpus-scope.test.mjs tests/public_exports.test.mjs
```

Els recomptes són del tall indicat i poden variar perquè altres agents estan escrivint. No s’ha llançat el build complet ni la cadena amb passos mutadors, no s’ha modificat cap baseline i no es declara CI verda. Validació documental i tancament es registren al final d’esta secció.

**Tancament observat:** `tancament.mjs --check --turn-id torn_13664aa9-acde-475b-8e65-d0f84b2564c9` retorna `valid: false`, estat `planned`, 72 incidències globals. Passen plantilles, autoritat i compilació Wiki en mode check; fallen LEDGER, segell, catàleg de skills i SCC. Els quatre artefactes propis del laboratori ja estan ancorats i no generen errors en este control final.

El control d’abast també veu canvis de codi durant el torn documental. La comparació amb el snapshot inicial identifica canvis concurrents en `src/data/wikiManifest.js`, `WikiDePobleSection.jsx` i proves d’Olivera/autosanació; este torn no ha escrit en `src`, `tooling`, `scripts` ni `tests`. No s’ha canviat l’abast a posteriori per ocultar el resultat. El LEDGER incorpora l’entrada pròpia, conserva el hash observat i continua sense un segell vàlid; no s’ha signat el conjunt de canvis aliens.

**Lliurables propis:** auditoria i pla passen `document.mjs check` amb `valid: true`. No s’ha declarat `closed`, commit, push ni desplegament.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Auditoria de fonts locals seleccionades i de les 22 skills completes; no equival a revisió línia a línia de tot el repositori. No s’han llegit secrets ni ingerit els cossos de l’arxiu històric. Les rutes físiques i els documents de tercers al laboratori no es confonen amb fonts executives.

No hi ha prova de contracte remot Sollutia, estat de migracions aplicades ni RLS amb usuaris reals. No es declara Javi registrat. No s’han activat serveis, subscripcions, SMS, tràmits, desplegaments o comptes.

Els prototips són de laboratori i no estan connectats a la UI, el router ni els hooks de producció. El scanner compartix les limitacions del resolutor actual, i la seua comprovació final de contingut no és una transacció atòmica amb la resta d’agents. Zero duplicats exactes no exclou redundància semàntica. La fusió de skills i el canvi del protocol de dades continuen com a propostes per al contrast de l’Olivera.

El sistema de tancament pot fallar per deute de segell, documents concurrents o validacions globals. Esta auditoria no ho amaga ni resegella regles que no ha revisat. L’acta global de final de jornada queda pendent del responsable de la sessió compartida.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_1706_pla_implementacio_codex]]
- [Prototip de graf](02_investigacio_ia/260924_1706_prototips_codex/graf.mjs)
- [Prototip de política modular](02_investigacio_ia/260924_1706_prototips_codex/moduls.mjs)
- [14 proves i reproduccions](02_investigacio_ia/260924_1706_prototips_codex/prototips.test.mjs)
- [Evidència i hashes de skills](02_investigacio_ia/260924_1706_prototips_codex/evidencia.json)

**Ancoratge de Seguretat:** [[00_index_escriptori]]

