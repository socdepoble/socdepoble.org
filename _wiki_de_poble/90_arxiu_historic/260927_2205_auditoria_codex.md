---
type: informe
status: esborrany
description: Sessió real local, entitats del xat, independència de backend i Workspace universal.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_50456d45-9e64-4577-a336-8f864ab21511:e0b32cf2-3980-43a9-96ca-1c84f6bcdfdb
---
# Auditoria T15–T19 i correccions D1–D2

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_50456d45-9e64-4577-a336-8f864ab21511:e0b32cf2-3980-43a9-96ca-1c84f6bcdfdb |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T20:07:04.326Z |
| Modificació | 2026-09-27 22:12 Europe/Madrid |
| Propietari | Codex |
| Aprovació humana | Execució T15–T19 i correccions D1–D2 autoritzades en la conversa; informe disponible per a revisió |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 / Codex; variant exacta no exposada |
| Tokens consumits | Mesura no disponible en esta sessió; no s’inventa una xifra |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-27 22:07 Europe/Madrid: informe creat amb rebut documental.

Tall de codi: HEAD `76a3643771605d87992d0604aaa56e236d66d682` més canvis locals. Es preserven els canvis previs de Fable i MarIA; no hi ha commit, push ni desplegament remot.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

| Tasca | Resultat i causa corregida |
| --- | --- |
| T15 | Bafarada rebuda amb `--sdp-accent-subtil`: en tema clar, `#fff6f0`, comprovat en navegador. Cap canvi d’espaiat ni de l’eix vertical de 138 px. |
| T17 | Token comú `--sdp-font-barra`: 600, 16 px, interlineat 24 px. Capçaleres i categories mantenen la caixa del text i compartixen el patró. |
| T19 | Wiki entra en `Tot` amb tots els documents; la categoria és independent del document seleccionat. Índex és un document. El Workspace recalcula el mode quan es plega un rail. Consola conserva la llista inicial completa. |
| T16 / D1 | Formulari original de registre directe. S’ha retirat la pantalla intermèdia i el botó/avís de demostració sobre la llista de converses. L’entrada selecciona el backend real per al node i recarrega una vegada abans d’acceptar credencials. |
| T18 | Pont iframe i servei de sessió deleguen validació/adopció a l’adaptador; conserven configuració genèrica completa i comproven origen/emissor quan correspon. El catàleg seed viu en dades, no en la capa de perfil visual. |
| D2 | El Xat reutilitza el divisor del `AppGridShell` en ample i mitjà, amb teclat, persistència i límits compartits. Les revisions de casos extrems es documenten en Verificació. |

**Autenticació i separació de dades.** La preferència es vincula a backend, endpoint i poble, i el document conserva una instantània estable: una altra pestanya no pot transformar una operació local en remota a mitjan petició. Les operacions de contrasenya, OAuth i alta d’organització rebutgen un scope seed. El formulari no consulta `getBackendConfigurat` per decidir si ha de mostrar una pantalla prèvia; desapareix la crida que disparava l’error comunicat. El contracte del port continua validant el nucli de cada adaptador, sense silenciaments ni mètodes buits.

**Padró real.** Una resposta remota buida o nul·la es conserva buida. S’han retirat les fusions que reintroduïen perfils, converses o notes seed, inclòs l’UUID simbòlic de Sóc de Poble. Les pàgines institucionals estàtiques continuen disponibles; no es presenten com a comptes autenticats. Crear «Sóc de Poble» és una alta d’organització administrada per una persona real, des del formulari existent.

**Xat d’entitats.** La migració `2609272200_xat_entitats.sql` crea un fil separat per interlocutor i organització, incorpora organitzacions visibles al padró i deriva autoria d’entitat al servidor. Un client no pot llegir un altre client, triar l’autor amb metadades, entrar en un altre poble ni conservar accés de gestor revocat. El client interlocutor no rep el cens de gestors. L’enviament és idempotent per missatge, actor i fil; repetir un missatge ja admés continua funcionant si després caduca la cita original. Les RLS continuen comprovant les lectures directes.

**Backend intercanviable.** La UI parla amb el port; el backend executa autenticació, persistència i autorització. Fer-lo intercanviable no permet traslladar les decisions de permisos a un navegador manipulable. Es preserven els contractes per implementar altres adaptadors; no s’ha implementat federació ActivityPub ni sincronització offline en este torn.

**Supabase local buit.** L’endpoint efectiu era `http://localhost:54321`, amb mode seed i cap compte ni organització. Faltava el poble de `VITE_TENANT_ID`; s’ha creat el poble configurat, sense sembrar persones. S’han aplicat localment les migracions pendents `2609272100_notes_origen`, `2609272200_xat_entitats` i `2609272201_grups_mare`, amb registre transaccional. L’última resol la discrepància que deixava passar un grup sense mare al helper i després el rebutjava en RLS. La prova HTTP usa una empresa i les metadades reals del formulari (`accepta_rgpd`).

**Estabilitat de proves.** El punt de partida tenia 10 fallades de components (7 Consola, 3 Wiki) i un fitxer de prova que no carregava una migració reanomenada. S’han corregit les causes de Wiki i la composició de `TargetaConsola`. Quatre assertions antigues de `peces.test.jsx` contradeien el seu propi enunciat i el contracte de Consola; ara comproven autor/font, `Obrir`, `Veure detall`, absència de peu buit i ARIA dels desplegables. Les referències de proves SQL i l’exempció històrica del tractor RLS s’han ajustat als noms existents de migracions, sense afegir excepcions de permisos.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- PostgreSQL 15 aïllat, sense xarxa ni volums: migració 2200 aplicada i reaplicada; fixture de regressió verda amb dos clients, anon, pobles diferents, permisos de gestor, revocacions, esborrat de pertinença/organització, idempotència i cites caducades. Les dades de fixture acaben en rollback; el contenidor aïllat creat per a la prova s’ha retirat.
- Supabase local complet: `tests/integration/local-auth-chat.mjs` passa dos registres i login per contrasenya, alta d’organització, padró, fil, enviament, reintent i resposta amb autor d’entitat. No s’imprimixen contrasenyes, JWT ni claus. Neteja dels dos comptes confirmada; recompte final de comptes sintètics: zero.
- Grups: fixture transaccional local comprova mare obligatòria, owner/admin, membre ordinari, tercer, altre poble i absència de sessió. Tot passa i acaba en rollback abans d’aplicar la migració 2201.
- Navegador localhost: formulari original de `/registre` visible, sense pas intermedi; Wiki amb `Tot`; bafarada `rgb(255, 246, 240)` i tipografia comuna. Arrossegament real del divisor de Converses de 300 a 380 px comprovat.
- Lint global i builds web/WordPress passen. Build web conserva l’avís de chunks superiors a 500 kB.
- Vitest global final: **117 fitxers, 1.235 proves passen, cap fallada**. Inclou les regressions D2: menú que passa a overlay, amplària guardada superior a la disponible, drag d’un píxel, teclat i persistència.
- D2 al navegador: amplària efectiva 800 px (mode mitjà), drag 380→420 i recàrrega que conserva 420; amplària efectiva 950 px (ample amb rail plegat), drag 300→340. Amplària de prova restaurada a 300 i visor restablert; en mode estret desapareix el divisor. No s’ha canviat el zoom del navegador.
- Portes d’enxufabilitat, adaptadors, frontera i RLS estàtica correctes; 26 fitxers SQL inspeccionats. Node: **107 proves passen, 0 fallades i 2 TODO heretats**, després de corregir l’assertion del nom reanomenat de migració al README.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

La prova acredita el Supabase **local**, no Sollutia ni cap projecte extern. No s’ha creat cap compte permanent del titular ni s’han triat les seues credencials. OAuth amb Google i confirmació per correu real depenen de la configuració del node i no s’han acreditat contra un proveïdor extern. La recepció HTTP funciona; les polítiques del canal Realtime privat continuen sent deute previ i el xat disposa del sondeig adaptatiu.

No s’afirma independència absoluta, absència total d’errors ni «seguretat indestructible». La portabilitat acreditada és la dels contractes, les proves d’adaptador i els builds web/WordPress. Tancament executat amb `tancament.mjs --check --turn-id torn_50456d45-9e64-4577-a336-8f864ab21511`: **valid:false, state:planned**. Passen plantilles, autoritat, LEDGER, segell, compilació Wiki, proves documentals i SCC. L’única fallada restant és la projecció divergent prèvia del catàleg de skills en `.agents/manifest.yaml` i `.agents/skills/00_INDEX_SKILLS.md`. El torn no es declara `closed`; esta incidència de governança queda separada del resultat verd del producte. Pla i auditoria tenen `check valid:true`; índex actiu reparat i cap orfandat operativa en SCC.

Les comprovacions de diagnòstic heretades de `lint_logica_usuari` marquen com TODO dues classes òrfenes i tres tokens previs; no són fallades noves del torn. El tancament confirma les projeccions divergents del catàleg de skills. No s’ha reescrit governança aliena per ocultar-les.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260927_2130_pla_implementacio_codex]]
- [[260927_2130_prompt_codex_logica]]
- Documentació primària consultada: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) i [registre per contrasenya](https://supabase.com/docs/reference/javascript/auth-signup).

## Proposta d’Automillora

1. **Higiene que bloquege la generació, no una casella declarativa.** Abans de redactar un prompt, el generador ha de mostrar un inventari real amb nom, torn propietari, estat i acció prevista. Un manifest i el hash de l’índex han d’acreditar quins elements continuen actius i quins estan tancats. Només estos últims passen a l’històric, amb moviment i reparació d’àncores en la mateixa operació. Les zones humanes/recerca i documents en revisió es conserven. La comprovació immediata posterior ha de detectar rutes trencades i arxius nous no indexats. Sense eixa evidència, no s’ha d’emetre el rebut del prompt. Això activa el «Tractor d’Higiene» de MarIA abans de generar, sense confiar en la memòria o en una captura ornamental.
2. **Una ordre, un pla verificable.** Conservar la plantilla íntegra mitjançant generació mecànica; exigir l’existència i el hash del pla, i generar els `[x]` a partir de comprovacions. El prompt inicial sense pla i els enllaços a arxius ja moguts són fallades del preflight, no motius per fer repetir manualment tot el context a l’humà.
3. **Pla compartit amb decisions executables.** Separar en files breus: ID, instrucció literal humana, fitxers responsables, criteri observable, estat, prova i hora. D1 hauria d’haver impedit dissenyar cap pantalla nova; D2 ha d’explicitar ample, mitjà, mòbil, teclat, drag i persistència. Quan MarIA o l’humà editen el pla en curs, registrar la nova revisió i tornar a vincular-ne el hash, sense perdre l’ordre ni invalidar silenciosament el torn.
4. **Contractes i fixtures per a clonar.** Mantindre una suite comuna d’adaptadors amb node buit, dos usuaris, una entitat, revocació, reintents i canvi d’endpoint. Distingir sempre seed, backend local i producció en l’evidència. Afegir una preparació idempotent del poble configurat evita que una clonació mostre un formulari correcte però no puga completar el padró.
5. **Telemetria honesta i coordinació acotada.** Anotar tokens només quan l’eina els mesure; guardar «no disponible» en lloc de forçar una estimació inventada. Delegar per superfícies de fitxers i fer revisió creuada dels punts crítics ha detectat els casos de privacitat i de divisor abans de l’entrega, sense multiplicar agents indiscriminadament.
