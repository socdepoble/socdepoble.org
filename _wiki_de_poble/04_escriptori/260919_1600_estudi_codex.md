---
type: informe
status: esborrany
description: Auditoria extrema Codex del sistema local, amb defectes reproduïts, evidències i pla de correcció per a IAIA MarIA.
tags:
  - seguretat
  - arquitectura
---

# ESTUDI D’IA: Codex — Auditoria Extrema del Sistema

## Registre

| Camp | Valor |
| --- | --- |
| Encàrrec | SDP-PROMPT-260919 · Petorreta de les 15:31 |
| Agent emissor | Codex, agent auditor d’OpenAI |
| Data | 19-09-2026 · Europe/Madrid |
| Versió | 1.1.0 · tall fixat i concurrència declarada |
| Entorn | entorn-dev-local |
| Tall de codi | HEAD `2fc1e9795d3adb903240e6ffcba0df169c3dc4a5`, sense canvis funcionals inicials; fonts exactes preservades |
| Estat inicial | Un document de l’encàrrec sense seguiment; cap canvi funcional en `git status --short` |
| Propietari | Consell de la Petorreta |
| Aplicació proposada | IAIA MarIA; este informe no aplica correccions |
| Aprovació humana | Pendent |
| Revisió pendent | Sí |

Vincles: [[00_index_escriptori]] · [[260919_1531_MICRO_PROMPT_Auditoria_Extrema]]. L’Escriptori és el del projecte, segons [.agents/AGENTS.md:20–27](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/.agents/AGENTS.md:20>). «Pedra Seca» significa exclusivament el Sistema de Disseny/UI Kit.

## 1. Verbatim — Informe íntegre emés per Codex

### 1.1. Dictamen

**El tall auditat no es pot certificar com a preparat per a producció.** L’auditoria registra **28 troballes: 11 P1 i 17 P2; cap P0 demostrat**. La prioritat prové de l’impacte i de la reproducció, no de les etiquetes de comentaris antics del codi.

En el tall inicial hi ha fallades funcionals immediates —arrencada web i compartir—, carreres de sessió i Notes, una barrera de credencials que accepta un JWT administratiu sintètic, i comprovadors que retornen verd davant casos que haurien de rebutjar. Les evidències i condicions de cada afirmació estan en F01–F28. **No s’ha demostrat una intrusió, ni s’ha localitzat o reproduït una clau secreta real publicada.** La fallada del validador no equival per si mateixa a provar una filtració efectiva.

La frase «totes les Portes estan en verd» no descriu les comprovacions executades sobre eixe tall: Vitest falla, i frontmatter falla tant en mode estricte com amb el sostre vigent. Alhora, RLS, Frontera i Reflex `doctor --ci` donen verd amb els límits detallats més avant. La cadena agregada sencera no s’ha executat sobre l’original perquè pot escriure artefactes i fonts generades: [tooling/gates/tractor-build-previ.mjs:85–94](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-build-previ.mjs:85>), [package.json:63–71](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/package.json:63>) i [tooling/gates/tancament.mjs:18–29](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tancament.mjs:18>).

### 1.2. Abast, mètode i límits

**Avís de concurrència i estat de les troballes:** durant el tancament altres processos han modificat codi en l’arbre compartit. Les 28 troballes i els resultats de la matriu corresponen al tall inicial identificat, no són una certificació de totes les versions que han anat apareixent després. F02 i F21 tenen correccions parcials observades; altres fitxers afectats, inclosos arrencada i política, han canviat mentre s’escrivia l’informe. L’apartat 1.13 separa el contrast posterior i el que continua pendent de reverificar.

Les cites de codi apunten a **còpies exactes de la revisió auditada** dins de l’evidència temporal i mantenen la ruta original i les línies en l’etiqueta. S’han extret de la revisió Git indicada, comprovant-la contra les empremtes inicials quan existixen. Açò evita que un enllaç mostre una línia distinta per un canvi concurrent. Es pot recuperar qualsevol font original amb `git show 2fc1e9795d3adb903240e6ffcba0df169c3dc4a5:ruta`. No s’ha afegit codi al repositori per conservar les proves.

S’han llegit els punts d’entrada web i embed, el port de backend, la política de runtime, autenticació, renovació, estat de sessió i rols, proveïdors globals, Notes, Xat, Storage, migracions locals, peces del Sistema de Disseny, notificacions, navegació, SEO, configuració de compilació, hooks i comprovadors documentals/de seguretat. Les cites conserven el codi original íntegre dels fitxers referenciats, no una representació resumida.

S’han fet proves locals amb dependències ja instal·lades, mòduls reals carregats en memòria, substituts deterministes de xarxa/persistència i DOM simulat amb jsdom. La prova d’arrencada compila en memòria `src/main.jsx`, amb CSS neutralitzat i xarxa bloquejada. Açò prova la fallada de bootstrap, però no és una prova visual en navegador. Les proves de promoció documental intercepten les operacions d’I/O en memòria: no han escrit fora del projecte ni han aprofitat el defecte per generar l’informe.

**No s’ha usat cerca web, navegador, informació externa, login real, consulta a Supabase, desplegament ni migració.** Tampoc s’han consultat els dos llocs d’orígens indicats en l’encàrrec. No s’ha llegit el contingut de `.env` per a l’informe. No es certifica l’estat desplegat de Sollutia, les seues capçaleres, els seus permisos reals, la revocació de credencials anteriors ni vulnerabilitats de dependències que requeririen fonts externes.

- **[REPRODUÏT]**: comportament observat en prova local controlada sobre el mòdul real.
- **[CODI]**: conclusió directament sustentada pel camí executable o SQL local; no s’ha executat el servei remot.
- **[SUPÒSIT]**: condició externa o de producte que falta confirmar. No es presenta com a fet.
- **P1**: corregir abans d’autoritzar l’ús en producció del flux afectat; privacitat, integritat, autenticació o indisponibilitat important.
- **P2**: defecte concret de funcionalitat, accessibilitat, manteniment o garantia de qualitat que necessita correcció planificada.
- **P0**: emergència efectiva demostrada; no se n’ha acreditat cap en este tall.

### 1.3. Resultats executats sobre el tall inicial

| Comprovació local | Resultat | Lectura correcta |
| --- | --- | --- |
| `vitest run --no-cache --reporter=default` | Eixida 1: 46 proves passen, 1 falla; 1 rebuig de promesa no gestionat | F17. No és una suite verda. |
| `eslint src tooling scripts tests` | Eixida 0: 0 errors, 352 avisos | El resultat no acredita comportament, RLS ni accessibilitat. |
| `node --test tooling/gates/tractor-psicopatia.test.mjs` | 6/6 passen | També comprova que falte un target obligatori. No substituïx les proves d’altres Portes. |
| `tractor-rls.mjs` | Verd sobre 14 fitxers SQL | Té falsos negatius reproduïts: F21. |
| `tractor-sollutia.mjs` | Verd, S1/S3/S4 a zero | No detecta el bootstrap ni els errors de política d’F01–F04. |
| `reflex_petorreta.mjs doctor --ci` | Verd | No acredita el contracte executable de promoció ni l’arbre staged: F22–F23. |
| `tractor-frontmatter.mjs --estricte --json` | Eixida 1, 424 documents; 248 incidències | F1=41, F2=97, F3=24, F4=16, F5=5, F6=0, F7=65, F8=0. |
| Frontmatter amb baseline vigent | Eixida 1 | F1 41>39, F2 97>94 i F7 65>43. No s’ha elevat cap sostre. |
| SCC inicial amb arrel explícita del repositori | Un orfe | El document de l’encàrrec de les 15:31; detall en l’evidència local. |
| `tancament.mjs --json` en còpia temporal del graf operatiu | Mateix orfe inicial | La sincronització de mirrors s’ha executat només en la còpia. |
| Diagnòstics sintètics de seguretat/estat | Fallades reproduïdes | Credencials, política, renovació, rols, tenant, focus, RLS, promoció i SCC buit. |

Les 248 incidències de frontmatter **no són 248 vulnerabilitats ni 248 documents diferents**. Inclouen 117 incidències atribuïdes a rutes de còpies `.frontmatter-copia-*`/`.abans-*`, i F5 és una regla de corpus. Esta contaminació d’abast també fa que els indicadors siguen menys útils. El resultat del document nou es valida separadament en mode estricte, sense relaxar l’esquema.

### 1.4. Registre prioritzat del tall inicial

| ID | Prioritat | Categoria | Defecte |
| --- | --- | --- | --- |
| F01 | P1 | Arrencada | L’entrada web munta sense instal·lar el backend |
| F02 | P1 | Seguretat | La barrera de claus absorbix el rebuig de JWT administratiu |
| F03 | P1 | Autenticació | L’entrada web envia la política amb una forma incompatible |
| F04 | P2 | Arquitectura | Política mutable, inicialització implícita i orígens desconnectats |
| F05 | P1 | Sessió | Una renovació tardana ressuscita la sessió tancada |
| F06 | P2 | Autorització UI | Un rol antic s’aplica a una altra sessió |
| F07 | P1 | Aïllament | Notes conserva el poble anterior després del canvi |
| F08 | P1 | Integritat | Un ACK antic elimina una edició posterior del draft |
| F09 | P1 | Aïllament | El gestor global de desat no té identitat de sessió/tenant |
| F10 | P2 | Concurrència | La revisió recordada bloqueja la recuperació d’un 409 |
| F11 | P1 | Privacitat | Imatges de notes privades al bucket públic |
| F12 | P2 | Resiliència | El termini HTTP no limita la renovació |
| F13 | P2 | Xat | Es carreguen els 200 missatges més antics i es marca lectura fallida |
| F14 | P2 | Dades/rendiment | Límits de 50 sense cursor i càrregues repetides |
| F15 | P2 | UI embed | Els avisos ixen de l’arrel d’estils del component |
| F16 | P2 | Accessibilitat | El desplegable es tanca quan el focus entra en les opcions |
| F17 | P2 | UI | Compartir crida un `showToast` no proporcionat |
| F18 | P2 | Integració | Embed assumix el router i un `#root` de l’amfitrió |
| F19 | P2 | Descobribilitat | La portada redirigix a una ruta amb `noindex` |
| F20 | P2 | Govern de dades | L’índex RAG públic inclou metadades i termes interns |
| F21 | P1 | Porta de seguretat | RLS verd davant permisos excessius o RLS desactivat |
| F22 | P1 | Acte Reflex | Promoció documental sense rebut, esquema ni frontera segura |
| F23 | P1 | Garantia de commit | El hook comprova el worktree, no l’arbre preparat |
| F24 | P2 | Arquitectura cognitiva | Tres contractes incompatibles de frontmatter |
| F25 | P2 | Graf | SCC accepta una arrel inexistent i omet errors de lectura |
| F26 | P2 | Build | Frescor per mida i dues dates, sense proveniència completa |
| F27 | P2 | Operació | Docker no és reproduïble i copia `.env` a la imatge |
| F28 | P2 | Backend | La injecció parcial barreja silenciosament implementacions |

### 1.5. Troballes: arrencada, seguretat i sessió

#### F01 · P1 · L’entrada web no instal·la el backend abans de muntar

**[REPRODUÏT]** `index.html` carrega `main.jsx`, que configura la política i renderitza directament `PedraSecaEmbed`. El port comença buit i `IdentitatProvider` demana `getDefaultUserId` en el primer render. L’adaptador per defecte s’instal·la en `host.arrenca`, camí que esta entrada no invoca. Evidència: [index.html:63–71](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/index.html:63>), [src/main.jsx:7–30](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/main.jsx:7>), [src/data/backendPort.js:5–6](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/backendPort.js:5>), [src/data/backendPort.js:51–55](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/backendPort.js:51>), [src/app/contexts/IdentitatContext.jsx:8–13](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/contexts/IdentitatContext.jsx:8>) i [src/host.js:174–194](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:174>).

La prova freda sobre l’entrada real acaba en la pantalla d’error amb «El mètode getDefaultUserId no està implementat». El test d’App instal·la prèviament un backend de prova i només comprova que existix un contenidor: no cobreix eixa arrencada, [src/app/App.test.jsx:23–37](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/App.test.jsx:23>).

**Solució i acceptació:** unificar el bootstrap: validar configuració, instal·lar i segellar l’adaptador HTTP i només després muntar. Provar les entrades web i embed reals en un procés net, sense inicialitzacions prèvies dels tests; han de renderitzar la interfície o un error de configuració deliberat, mai un port buit.

#### F02 · P1 · El validador deixa passar la clau que pretén rebutjar

**Estat posterior:** el `catch` descrit s’ha corregit de manera concurrent; el primer recontrast encara troba vies sense validació. Vegeu 1.13 abans de tractar tota esta troballa com a pendent.

**[REPRODUÏT]** El `throw` per `role === service_role` viu dins del mateix `try` que té un `catch` que ho ignora tot. A més, l’absència d’URL evita qualsevol revisió de la clau. Un JWT fals amb eixe rol és acceptat; `sb_secret_FAKE` es rebutja amb URL, però s’accepta sense URL. Evidència: [src/config/publicCredentials.js:5–8](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/config/publicCredentials.js:5>) i [src/config/publicCredentials.js:20–45](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/config/publicCredentials.js:20>). El build confia en esta funció, [vite.config.js:11–15](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/vite.config.js:11>); la configuració web entrega l’`anonKey` al client, [src/main.jsx:19–25](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/main.jsx:19>).

L’eliminació d’una cadena literal dels bundles no prova que el valor d’una credencial siga públic. **[SUPÒSIT]** Si una clau administrativa real ocupa eixa variable, la barrera no impediria compilar-la. No s’ha comprovat que actualment n’hi haja cap.

**Solució i acceptació:** separar errors de descodificació i errors de política; validar el tipus de clau amb un domini explícit de valors públics admesos, independentment de la presència d’URL. Fer-ho en build i en totes les entrades de runtime. Tests negatius amb credencials sintètiques, mai reals, han de fallar amb eixida no-zero.

#### F03 · P1 · La configuració d’autenticació web no arriba al contracte correcte

**[REPRODUÏT]** `main.jsx` passa `issuer` i `audiences` en primer nivell; `setRuntimePolicy` només llig `auth.issuer` i `auth.audiences`. El valor desitjat `authenticated` es perd i entra el valor per defecte `socdepoble`. L’emissor passa a dependre d’una altra variable, `VITE_SOLLUTIA_ISSUER`, en lloc del valor enviat per l’entrada. Evidència: [src/main.jsx:12–16](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/main.jsx:12>) i [src/config/runtimePolicy.js:9–39](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/config/runtimePolicy.js:9>). El consumidor rebutja emissor absent i audiències no coincidents, [src/data/identitat.js:247–249](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/identitat.js:247>) i [src/data/identitat.js:276–286](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/identitat.js:276>).

La prova local invoca la mateixa forma d’arguments i observa emissor absent i audiència per defecte. Una variable de build alternativa pot amagar una part del defecte, però no corregix el contracte.

**Solució i acceptació:** una única estructura tipada `{ backend, auth }`, una nomenclatura única d’entorn i validació explícita abans de muntar. Provar sessions sintètiques d’emissor correcte/incorrecte i audiència `authenticated` amb l’entrada web i la d’integració.

#### F04 · P2 · La política «immutable» no té un únic punt d’autoritat

**[REPRODUÏT/CODI]** `Object.freeze` no congela els arrays interns: s’ha afegit una audiència per `push` després de segellar. `getRuntimePolicy()` també crea una política per defecte; `estat()` l’invoca, i el pont d’iframe crida `estat()` en exposar l’API. Una lectura de diagnòstic pot, per tant, tancar prematurament la configuració; `configura()` captura l’error i continua. Evidència: [src/config/runtimePolicy.js:29–53](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/config/runtimePolicy.js:29>), [src/host.js:126–131](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:126>), [src/host.js:282–291](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:282>) i [src/host.js:408–411](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:408>).

El pont `message` tampoc consulta `auth.parentOrigins`: usa una llista pròpia amb subdominis. Es conserva la comprovació `event.source === window.parent`; no és una acceptació arbitrària de qualsevol origen. Evidència: [src/host.js:332–343](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:332>) en comparació amb [src/config/runtimePolicy.js:33–39](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/config/runtimePolicy.js:33>).

**Solució i acceptació:** inicialització explícita i atòmica, getters sense efectes, còpia i congelació profunda de la configuració, i una sola llista exacta d’orígens aplicada pel pont. Consultar l’estat abans de configurar ha de ser innocu; una política rebutjada ha d’impedir la configuració parcial.

#### F05 · P1 · Logout no invalida la renovació en curs

**[REPRODUÏT]** La renovació captura el refresh token, espera la resposta i crida `desaSessio` sense validar la generació actual. `logout` esborra la sessió però no invalida aquella promesa; el singleton `renovacioEnCurs` tampoc està vinculat al backend, tenant o usuari. Evidència: [src/data/supabase/auth.js:8–39](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/auth.js:8>) i [src/data/supabase/auth.js:149](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/auth.js:149>).

Seqüència provada: sessió A → iniciar renovació → logout → resoldre resposta d’A. Resultat: A torna a ser l’usuari actiu. El comptador del servei superior no impedix el commit dins de l’adaptador, [src/data/sessionService.js:44–54](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/sessionService.js:44>) i [src/data/sessionService.js:82–98](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/sessionService.js:82>).

**Solució i acceptació:** epoch de sessió que canvie en logout, substitució de sessió i canvi de backend/tenant; invalidació immediata abans d’esperar Realtime. La resposta només es desa si coincidixen epoch i identitat de credencial. Cancel·lar la xarxa quan siga possible, i ignorar igualment les respostes tardanes. Proves A→fora i A→B amb resolució antiga al final.

#### F06 · P2 · El rol no està vinculat a la sessió que el va demanar

**[REPRODUÏT]** El canvi d’usuari conserva `rol` per propagació de l’estat anterior; després, `elMeuRol().then/catch` actualitza l’estat sense verificar actor, generació ni configuració. Evidència: [src/data/sessionService.js:35–74](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/sessionService.js:35>). S’ha observat B entrant amb el rol `superadmin` d’A i, en una altra seqüència, `usuari:null` amb `rol:superadmin` després de resoldre una consulta antiga.

Açò és una atribució incorrecta de permisos i controls de la UI, **no una escalada SQL demostrada**. La protecció remota ha de continuar decidint sobre cada operació.

**Solució i acceptació:** reiniciar rol a desconegut en cada canvi d’identitat/scope, capturar epoch i aplicar resultats només a la petició vigent. La UI privilegiada no ha d’aparéixer mentre el rol actual no estiga validat. Provar respostes fora d’ordre, logout i canvi de tenant amb el mateix usuari.

### 1.6. Troballes: Notes, privacitat i transport

#### F07 · P1 · El canvi de poble conserva Notes del poble anterior

**[REPRODUÏT]** `scopeKey` forma part de l’estat inicial, però l’efecte de càrrega no el reinicia quan canvia. Quan arriba la càrrega del poble B, `prev.scopeKey !== scopeKey` fa que es descarte; el valor retornat continua exposant el payload d’A. La clau del proveïdor només inclou `actorKey`. Evidència: [src/sections/notes/NotesDataContext.jsx:22–43](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesDataContext.jsx:22>), [src/sections/notes/NotesDataContext.jsx:75–96](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesDataContext.jsx:75>) i [src/app/App.jsx:432–441](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/App.jsx:432>).

La prova DOM canvia el tenant amb el mateix actor: la UI conserva scope i notes d’A. A més, el control de `creaNota` compara variables de la mateixa clausura, no el context vigent, [src/sections/notes/NotesDataContext.jsx:124–135](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesDataContext.jsx:124>).

**Solució i acceptació:** scope explícit amb backend efectiu, tenant, actor i generació; reinici immediat de dades visibles o remuntatge per eixa clau. Les lectures i mutacions han de comprovar un ref vigent i la revisió abans de fer commit. A→B ha d’ocultar A immediatament, acceptar B i rebutjar qualsevol resposta antiga.

#### F08 · P1 · La confirmació d’un desat pot esborrar una edició més nova

**[CODI]** El gestor envia un payload segellat i, en rebre confirmació, neteja només pels noms dels camps. `clearLocalNoteFields` elimina eixos camps sense comparar ni el valor enviat ni una seqüència d’edició. Evidència: [src/sections/notes/GlobalSaveManager.js:35–55](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/GlobalSaveManager.js:35>) i [src/sections/notes/NotesContext.jsx:82–113](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesContext.jsx:82>).

Seqüència deduïda: enviar títol «A», escriure «B» mentre A està pendent i rebre ACK d’A. La neteja elimina l’override B. Si el següent enviament falla, B ja no es conserva com a draft recuperable. No s’ha afirmat una pèrdua concreta en dades reals.

**Solució i acceptació:** seqüència d’edició per camp i ACK que identifique exactament la versió confirmada. Netejar un override només si encara correspon a eixa versió; conservar el contingut pendent i el seu estat d’error en memòria. Prova amb A pendent, B posterior i fallada del desat de B. La persistència autoritativa continua sent exclusivament remota.

#### F09 · P1 · El gestor global de desat travessa canvis de sessió

**[CODI]** Cues, locks i revisions estan indexats únicament per `noteId`, i el singleton sobreviu al desmuntatge. Les funcions capturades no porten epoch. El context celebra expressament que les operacions continuen després del desmuntatge, però no distingix navegar dins de la mateixa sessió de fer logout o canviar de poble. Evidència: [src/sections/notes/GlobalSaveManager.js:3–27](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/GlobalSaveManager.js:3>), [src/sections/notes/GlobalSaveManager.js:68–78](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/GlobalSaveManager.js:68>) i [src/sections/notes/NotesContext.jsx:56–60](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesContext.jsx:56>), [src/sections/notes/NotesContext.jsx:150–162](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesContext.jsx:150>).

Les peticions construïxen Authorization amb el JWT vigent en enviar, [src/data/supabase/runtime.js:38–40](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/runtime.js:38>). Una operació pendent d’A pot arribar a intentar-se després del canvi a B. RLS pot rebutjar-la; no s’ha demostrat escriptura entre usuaris al servidor.

**Solució i acceptació:** clau composta i epoch en cada treball; continuïtat només dins de la mateixa sessió i backend. Invalidar els treballs antics en un canvi de frontera d’identitat, mantindre els drafts separats i no reproduir-los automàticament amb una altra sessió. Provar logout/canvi de tenant durant debounce i durant petició.

#### F10 · P2 · La revisió recordada impedix recuperar-se d’un conflicte

**[CODI]** `getExpectedRevision` preferix sempre `knownRevisions` a la revisió de la nota recarregada. Un error 409 mostra un avís però no reconcilia ni invalida aquella entrada. Evidència: [src/sections/notes/GlobalSaveManager.js:11–19](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/GlobalSaveManager.js:11>) i [src/sections/notes/GlobalSaveManager.js:56–64](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/GlobalSaveManager.js:56>). El proveïdor sí intenta recarregar en 409, [src/sections/notes/NotesDataContext.jsx:101–105](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesDataContext.jsx:101>), però eixa revisió més recent pot continuar sent ignorada pel gestor.

**Solució i acceptació:** una autoritat comuna de revisió per nota i scope. En 409, recuperar versió remota, conservar el draft i oferir resolució explícita del conflicte; no sobreescriure a cegues. Provar revisió pròpia 4, canvi remot a 5, recàrrega i següent desat amb precondició correcta.

#### F11 · P1 · Les imatges d’una nota privada es tracten com a públiques

**[CODI]** L’editor de Notes puja a `carpeta:'notes'`; `uploadToStorage` envia sempre al bucket `mitjans` i retorna `getPublicUrl`. Evidència: [src/sections/notes/NotesEditor.jsx:12–16](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/notes/NotesEditor.jsx:12>) i [src/data/supabase/storage.js:100–114](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/storage.js:100>). La migració crea el bucket públic i permet SELECT a `anon` per a tot el bucket, [supabase/migrations/260913_0500_bucket_mitjans.sql:8–20](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/supabase/migrations/260913_0500_bucket_mitjans.sql:8>). La migració posterior elimina un altre nom de política i manté `public = true`, [supabase/migrations/260914_0100_auditoria_rls_fixes.sql:57–59](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/supabase/migrations/260914_0100_auditoria_rls_fixes.sql:57>).

Les restriccions de la fila privada de Notes, [supabase/migrations/260914_0000_schema_notes.sql:53–59](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/supabase/migrations/260914_0000_schema_notes.sql:53>), no protegixen l’objecte públic. **[SUPÒSIT]** El risc es materialitza remotament si estes migracions estan aplicades i hi ha adjunts privats en eixe bucket; no s’han consultat objectes reals.

**Solució i acceptació:** bucket privat per a adjunts de drafts, permisos per usuari/tenant i URLs d’accés temporals autoritzades. Publicar una nota ha de ser una transició explícita que habilite només els mitjans publicats. Amb Sollutia, provar lectura/listat anònim i d’un altre tenant, i revisar els adjunts ja existents abans de donar per tancat el defecte.

#### F12 · P2 · El timeout no inclou una renovació bloquejada

**[REPRODUÏT]** La petició espera `refresca(config)` després d’un 401. El temporitzador avorta el controlador de la petició original, però el `fetch` de renovació no rep eixe senyal ni té termini propi. El retry també crea un termini nou. Evidència: [src/data/supabase/runtime.js:43–65](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/runtime.js:43>) i [src/data/supabase/auth.js:18–21](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/auth.js:18>). Amb timeout de 15 ms i renovació pendent, la promesa continuava sense resoldre després de 80 ms.

**Solució i acceptació:** termini absolut que incloga petició, cos, renovació i eventual retry; propagar cancel·lació a la renovació i definir com cancel·lar esperadors sense trencar una renovació compartida vigent. Cada consumidor ha d’acabar dins del seu pressupost temporal. El cos JSON ja s’espera abans del `finally`, [src/data/supabase/runtime.js:70–82](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/runtime.js:70>); no es torna a denunciar el defecte antic d’eixa part.

### 1.7. Troballes: producte, accessibilitat i integració

#### F13 · P2 · Xat recupera l’inici del fil i pot marcar com llegit allò no carregat

**[CODI]** El client demana 200 missatges, [src/data/supabase/xat.js:72–90](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/xat.js:72>); l’RPC ordena ascendent abans de limitar, per tant retorna els més antics, [supabase/migrations/260908_xat_v2_correccions.sql:270–304](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/supabase/migrations/260908_xat_v2_correccions.sql:270>). El refresc substituïx els confirmats pel resultat, conservant només els optimistes pendents, [src/sections/xat/XatContext.jsx:199–212](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/xat/XatContext.jsx:199>). En un fil més llarg, els missatges recents poden deixar d’aparéixer després de refrescar.

A més, la càrrega retorna `false` en error, però qui l’espera marca el fil llegit sense comprovar el resultat, [src/sections/xat/XatContext.jsx:215–240](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/sections/xat/XatContext.jsx:215>).

**Solució i acceptació:** últims N per ordre descendent, invertir per a presentar, cursor estable `(data,id)` per recuperar anteriors i deduplicació. Marcar lectura fins a l’últim missatge efectivament rebut, només amb càrrega correcta. Proves de 201/500 missatges i fallada HTTP sense pèrdua del comptador de no llegits.

#### F14 · P2 · Les càrregues són redundants i la paginació queda truncada

**[CODI]** `loadMur` i `loadMultimedia` invoquen cadascun `loadAppData`, que torna a demanar contingut, submissions i, amb sessió, notes privades. Els proveïdors estan muntats conjuntament, [src/data/supabase/content.js:7–24](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/content.js:7>), [src/data/supabase/content.js:76–80](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/content.js:76>) i [src/app/App.jsx:436–442](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/App.jsx:436>). Notes també fa la seua consulta separada i limita a 50 sense cursor; les submissions es limiten abans de separar-les per secció, [src/data/supabase/notes.js:19–29](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/notes.js:19>) i [src/data/supabase/content.js:31–43](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/supabase/content.js:31>).

Açò augmenta trànsit i pot deixar dades antigues sense camí de recuperació. No s’ha mesurat latència real de Sollutia. L’artefacte standalone local existent pesa 1.792.289 bytes; no equival a mesurar bytes transferits ni temps d’arrencada.

**Solució i acceptació:** endpoints/consultes per necessitat de secció, càrrega ajornada i deduplicació en memòria dins del mateix scope; paginació remota estable i filtres abans del límit. Provar 51 notes i més de 50 submissions repartides entre seccions. Mesurar peticions i bytes per ruta; no introduir una font de veritat offline.

#### F15 · P2 · Les notificacions escapen del Shadow DOM

**[CODI]** `NotificationProvider` envia el portal a `document.body` si no rep `targetNode`; `App` no li’l passa. Evidència: [src/components/universal/NotificationContext.jsx:11–42](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/components/universal/NotificationContext.jsx:11>) i [src/app/App.jsx:421–427](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/App.jsx:421>). Els estils de l’element incrustat s’instal·len en la seua arrel, [src/PedraSecaEmbed.jsx:301–319](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/PedraSecaEmbed.jsx:301>). El `setToastTarget` del sistema anterior no configura este provider nou, [src/PedraSecaEmbed.jsx:323–327](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/PedraSecaEmbed.jsx:323>).

**[SUPÒSIT]** En un amfitrió que no carrega CSS global de l’app, els avisos nous quedaran fora dels seus estils i tokens; l’aspecte exacte necessita comprovació visual. La ruptura de l’aïllament sí és directa del codi.

**Solució i acceptació:** target de notificacions per instància dins de la mateixa arrel del Sistema de Disseny, passat al provider i eliminat en desmuntar. Provar dues instàncies amb temes diferents, notificació d’error i desmuntatge; cap portal residual en el body de l’amfitrió.

#### F16 · P2 · El desplegable elimina el menú quan rep focus una opció

**[REPRODUÏT]** El `onBlur` viu en el trigger i comprova si el nou focus és descendent del mateix trigger. Les opcions són un element germà: moure-hi el focus programa el tancament als 200 ms. Evidència: [src/components/PedraSeca/molecules/Dropdown.jsx:21–43](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/components/PedraSeca/molecules/Dropdown.jsx:21>). La prova DOM obri el menú i enfoca una opció: el menú desapareix i el focus acaba en BODY.

**Solució i acceptació:** gestionar eixida de focus al contenidor complet, mantindre’l quan va a una opció, i definir Escape, retorn al trigger i semàntica de menú o llista segons l’ús real. Provar Tab/Shift+Tab/Enter/Escape amb teclat; completar després una passada amb tecnologia assistiva. Esta auditoria no afirma conformitat WCAG global.

#### F17 · P2 · Compartir falla perquè falta el callback d’avís

**[REPRODUÏT]** `compartix` espera un tercer argument `showToast`; el manejador li’n passa dos. El camí de porta-retalls crida la funció absent tant en èxit com en error. Evidència: [src/components/PedraSeca/organismes/UniversalCard.jsx:55–69](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/components/PedraSeca/organismes/UniversalCard.jsx:55>) i [src/components/PedraSeca/organismes/UniversalCard.jsx:244–258](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/components/PedraSeca/organismes/UniversalCard.jsx:244>). Vitest ho exposa amb `TypeError: showToast is not a function` i una prova fallida, [src/components/PedraSeca/organismes/UniversalCard.test.jsx:66–69](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/components/PedraSeca/organismes/UniversalCard.test.jsx:66>).

**Solució i acceptació:** passar el callback correcte i provar el component amb el provider actual. Cobrir compartir natiu, cancel·lació voluntària, còpia correcta i denegació del porta-retalls. No donar el problema per resolt canviant només el mock o eliminant l’expectativa del test.

#### F18 · P2 · Embed assumix propietat de l’historial i d’un `#root` alié

**[CODI]** L’element usa router `browser` per defecte i la primera instància el selecciona; navegar invoca `history.pushState/replaceState` del document amfitrió. Evidència: [src/PedraSecaEmbed.jsx:44–47](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/PedraSecaEmbed.jsx:44>), [src/PedraSecaEmbed.jsx:405–410](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/PedraSecaEmbed.jsx:405>) i [src/app/contexts/RouterContext.jsx:41–68](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/contexts/RouterContext.jsx:41>). L’entrada embed també munta automàticament dins de qualsevol `#root` buit, [src/embed.jsx:28–50](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/embed.jsx:28>).

**[SUPÒSIT]** La col·lisió es produïx quan Sollutia reserva eixe node o gestiona el seu propi historial. El muntatge automàtic que fixa `manageDocumentHead:false` és una millora real; no s’afirma que tot embed segreste sempre el head.

**Solució i acceptació:** perfil web autònom amb router browser i perfil incrustat amb memòria per defecte; node de muntatge explícit i propietat del head expressament acordada. Provar una pàgina amfitriona amb el seu router, un `#root` propi i dues instàncies SDP.

#### F19 · P2 · La navegació principal conduïx a `noindex`

**[CODI]** `/` redirigix a `/jo` més la secció per defecte `/xat`, i la navegació construïx rutes sota `/jo`. `useSEO` imposa `noindex,nofollow` a eixe prefix. Evidència: [src/app/App.jsx:77–83](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/App.jsx:77>), [src/app/App.jsx:513–516](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/app/App.jsx:513>), [src/config/sections.js:34](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/config/sections.js:34>) i [src/hooks/useSEO.js:53–55](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/hooks/useSEO.js:53>). El càlcul de canonical usa `index` i no `finalIndex`, [src/hooks/useSEO.js:61–65](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/hooks/useSEO.js:61>).

**[SUPÒSIT]** Si la portada i el contingut públic han de ser descobribles —decisió de producte a ratificar—, la política és contradictòria amb eixe objectiu. No s’ha comprovat indexació real en cap cercador.

**Solució i acceptació:** separar rutes públiques i privades, assignar una ruta canònica pública i derivar robots/canonical del mateix manifest de rutes. Provar el head de cada ruta en el perfil web i que el perfil embed respecta el de Sollutia.

### 1.8. Troballes: govern, Portes i operació

#### F20 · P2 · El RAG destinat a `public` no té frontera editorial pública

**[CODI + ARTEFACTE LOCAL]** El recorregut admet `.agents` i Markdown de l’Escriptori, sense una llista explícita de documents aprovats per a publicació; extrau termes del cos, els associa a rutes i escriu `public/rag-index.json`. Evidència: [tooling/wiki/core/build_rag_index.mjs:13–25](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/core/build_rag_index.mjs:13>), [tooling/wiki/core/build_rag_index.mjs:63–85](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/core/build_rag_index.mjs:63>) i [tooling/wiki/core/build_rag_index.mjs:108–117](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/core/build_rag_index.mjs:108>).

Els índexs existents `public/rag-index.json` i `dist/rag-index.json` tenen 166 documents, 46 rutes de `.agents/` o de l’Escriptori, i 2.543.065 bytes cadascun. És metadada i vocabulari associat a documents, **no una còpia textual íntegra**. No s’ha provat que este dist siga el publicat ni que continga secrets.

**Solució i acceptació:** separar corpus intern i corpus publicable, amb allowlist o estat d’aprovació revisable i exclusió explícita de diagnòstics, memòries i esborranys. Un document sintètic intern afegit a l’Escriptori no ha d’aparéixer en el RAG públic. Revisar l’abast abans de regenerar/publicar l’índex amb este mateix informe.

#### F21 · P1 · La Porta RLS no acredita la seguretat final de l’esquema

**Estat posterior:** s’han observat canvis en l’exempció de profiles i R5. El diagnòstic següent és del tall inicial; les parts corregides i els límits del contrast consten en 1.13.

**[REPRODUÏT]** La llista d’exempcions inclou `profiles` sense distingir acció, rol o columnes, [tooling/gates/tractor-rls.mjs:77–82](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-rls.mjs:77>) i [tooling/gates/tractor-rls.mjs:167–178](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-rls.mjs:167>). R2 busca textualment un `ENABLE ROW LEVEL SECURITY`, sense comprovar si després es desactiva, [tooling/gates/tractor-rls.mjs:151–165](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-rls.mjs:151>). La branca R5 de grants sense política no fa res, [tooling/gates/tractor-rls.mjs:223–229](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-rls.mjs:223>).

El comprovador real, amb filesystem sintètic, retorna verd per una política oberta de `profiles` i per `ENABLE` seguit de `DISABLE`. També accepta un grant sense política: este últim, amb RLS actiu, pot implicar denegació funcional, no una filtració. El verd de les 14 migracions actuals no resol estes cegueres. No es denuncia com a fuga activa una política històrica de profiles que migracions posteriors ja corregixen.

**Solució i acceptació:** tests de resultat sobre PostgreSQL descartable amb migracions en ordre i rols anon/autenticat/A/B; comprovar estat final, grants, funcions i Storage. Mentrestant, eliminar exempcions globals i declarar-les per cas concret. Les fixtures insegures han de tombar la porta abans de confiar-hi com a barrera de producció.

#### F22 · P1 · La promoció documental evita el contracte del Reflex

**[REPRODUÏT]** `validarDocument` només exigix `type/status` amb valor i alguna cadena `# `; accepta enums inexistents i falta de `description`. `promoureDocument` no crida eixa validació, no comprova rebut/claim/scope i no valida la preimatge del destí. La ruta `../` pot eixir de l’arrel; la funció escriu i renomena sobre el destí. Evidència: [tooling/wiki/reflex_document.mjs:35–74](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/reflex_document.mjs:35>). La CLI invoca esta promoció directament, [tooling/wiki/reflex_petorreta.mjs:1547–1558](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/reflex_petorreta.mjs:1547>).

En la prova amb I/O interceptat, un document invàlid és declarat vàlid i una promoció sense rebut intenta escriure `/fake/outside/report.md` des de `/fake/project`. **No s’ha fet una escriptura real fora de scope.** En el bootstrap, `open` introduïx una plantilla addicional, [tooling/wiki/reflex_petorreta.mjs:681–706](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/reflex_petorreta.mjs:681>), malgrat el contracte d’exactament dos fills del protocol, [.agents/PROTOCOL_PETORRETA.md:22–24](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/.agents/PROTOCOL_PETORRETA.md:22>) i [.agents/PROTOCOL_PETORRETA.md:68–70](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/.agents/PROTOCOL_PETORRETA.md:68>).

**Solució i acceptació:** validar amb el motor canònic, vincular hash validat i destí al rebut, reclamar el claim abans de qualsevol efecte, resoldre ruta física dins del scope i aplicar CAS al destí. Temporals exclusius i errors d’I/O no silenciats. Tests de rebut absent, traversal, destí canviat, replay i bootstrap exacte; cada rebuig ha de produir zero escriptures autoritatives.

#### F23 · P1 · El hook valida el worktree en compte del commit preparat

**[CODI + CONFIGURACIÓ LOCAL]** El hook executa gate/lint/test sobre l’arbre de treball, sense materialitzar l’índex. La cadena llança les ordres en el directori actual. Evidència: [.husky/pre-commit:1–25](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/.husky/pre-commit:1>) i [tooling/gates/run-portes.mjs:95–103](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/run-portes.mjs:95>). El detector del Reflex considera suficient trobar `npm run gate` al pre-commit, [tooling/wiki/reflex_petorreta.mjs:84–91](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/reflex_petorreta.mjs:84>). La configuració local observada és `core.hooksPath=.husky/_`.

**[CODI]** Amb canvis parcialment preparats es pot comprovar una versió distinta de la que es cometrà. El protocol exigix precisament una materialització staged, [.agents/PROTOCOL_PETORRETA.md:58–64](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/.agents/PROTOCOL_PETORRETA.md:58>). No s’ha creat cap commit de prova ni comprovat la protecció de branca remota.

**Solució i acceptació:** auditar l’arbre staged immutable en un directori descartable, vincular rebut a hash d’arbre i pare i comprovar els hooks realment instal·lats. Test d’integració amb worktree bo/índex roín i invers. Sollutia/equip de repositori ha de confirmar CI requerit i protecció de branca, perquè cap hook local impedix tots els bypassos externs.

#### F24 · P2 · Els validadors documentals apliquen contractes diferents

**[CODI/REPRODUÏT]** L’esquema canònic només exigix `description`, mentre que el validador nou exigix `type/status` i no valida `description` ni enums. Evidència: [tooling/wiki/schema.json:8–41](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/schema.json:8>) i [tooling/wiki/reflex_document.mjs:35–50](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/reflex_document.mjs:35>). L’esquema admet també `tipus/estat`, [tooling/wiki/schema.json:43–70](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/schema.json:43>). La regla F5 pot penalitzar un valor opcional constant compartit per dos documents, incloent `type/status`, [tooling/wiki/tractor-frontmatter.mjs:371–377](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/tractor-frontmatter.mjs:371>).

A nivell de govern, un «document vàlid» significa coses diferents segons l’entrada. El mode ordinari permet un sostre per recompte, no una garantia individual de cada document, [tooling/wiki/tractor-frontmatter.mjs:395–408](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/wiki/tractor-frontmatter.mjs:395>); en este tall també supera eixe sostre. El corpus inclou còpies que distorsionen la lectura de les incidències.

**Solució i acceptació:** acordar un esquema únic i fer que plantilla, prepare, validate, promote, hooks i CI el consumisquen. Definir explícitament obligatorietat, aliases i exclusió de còpies; tractar F5 com a advertiment editorial quan la repetició és legítima. Casos idèntics han de rebre el mateix veredicte per totes les vies, sense regenerar baselines per tapar regressions.

#### F25 · P2 · SCC confon «no he llegit res» amb «graf correcte»

**[REPRODUÏT]** Una arrel inexistent torna `{valid:true, errors:[]}`. El lector recursiu captura i ignora errors; la falta d’índex també es descarta. Evidència: [tooling/gates/verificador-scc.mjs:22–44](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/verificador-scc.mjs:22>), [tooling/gates/verificador-scc.mjs:97–131](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/verificador-scc.mjs:97>) i [tooling/gates/verificador-scc.mjs:246–258](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/verificador-scc.mjs:246>).

Hi ha també dos contractes de ruta: el constructor concatena `_wiki_de_poble/...`, però la CLI passa per defecte `CAMINS.wiki`; les constants usen majúscules mentre l’Escriptori real és en minúscules. La resolució per basename substituïx silenciosament homònims. Evidència: [tooling/gates/verificador-scc.mjs:13–14](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/verificador-scc.mjs:13>), [tooling/gates/verificador-scc.mjs:91–94](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/verificador-scc.mjs:91>), [tooling/gates/verificador-scc.mjs:158–163](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/verificador-scc.mjs:158>) i [tooling/gates/verificador-scc.mjs:262–264](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/verificador-scc.mjs:262>). Un filesystem no sensible a majúscules pot amagar part del problema.

**Solució i acceptació:** arrel del repositori única, rutes canòniques amb caixa exacta, abast obligatori no buit i errors d’I/O fatals. Resoldre enllaços per ruta relativa i rebutjar ambigüitats. Provar en filesystem sensible a majúscules, índex absent, lectura denegada i dos noms iguals.

#### F26 · P2 · La Porta Build no prova la correspondència entre font i artefacte

**[CODI]** El standalone es dona per vàlid si supera 1.000 caràcters i és més recent que dos fitxers: `main.jsx` i `PedraSecaEmbed.jsx`. Canvis d’autenticació, dependències, CSS, configuració o entrada embed no formen part de la condició. Evidència: [tooling/gates/tractor-build-previ.mjs:47–53](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-build-previ.mjs:47>) i [tooling/gates/tractor-build-previ.mjs:71–79](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-build-previ.mjs:71>).

Açò no acredita un artefacte adulterat actual; acredita que un artefacte obsolet o contingut invàlid prou llarg pot satisfer la comprovació. La porta també pot executar un build complet durant una comprovació, [tooling/gates/tractor-build-previ.mjs:85–94](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/tooling/gates/tractor-build-previ.mjs:85>).

**Solució i acceptació:** manifest de proveniència amb digest de fonts transitives, lockfile, configuració i variables públiques rellevants; construcció congelada en CI i smoke tests de les dues entrades. La verificació ha de detectar canviar només `auth.js` sense recompilar, i rebutjar un fitxer de 1.001 caràcters arbitraris. Separar comprovar de regenerar.

#### F27 · P2 · El camí Docker del bot no és construïble amb els fitxers actuals

**[CODI + INVENTARI]** `Dockerfile` copia `pnpm-lock.yaml`, que no existix en el tall local, instal·la pnpm global sense versió fixada i executa `pnpm run start`, script absent del manifest d’arrel. Evidència: [Dockerfile:1–23](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/Dockerfile:1>) i [package.json:10–84](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/package.json:10>). A més, copia `.env` a una capa de la imatge, tot i que Compose el munta en runtime, [Dockerfile:16–17](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/Dockerfile:16>) i [docker-compose.yml:8–13](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/docker-compose.yml:8>).

No s’ha construït ni publicat cap imatge. **[SUPÒSIT]** Si `.env` conté secrets i este camí s’arregla només fins que compile, eixos valors quedarien dins de la imatge. No s’ha llegit el fitxer per verificar-ne contingut.

**Solució i acceptació:** decidir si este desplegament continua vigent; si sí, manifest/lockfile del bot correctes, gestor fixat, ordre d’arrencada existent i configuració injectada només en runtime. Provar build en entorn net amb credencials sentinella falses i verificar que cap apareix en les capes. No afecta automàticament el desplegament web de Sollutia.

#### F28 · P2 · La injecció incompleta de backend fa una mescla implícita

**[CODI]** El contracte comentat exigix injecció completa, però `configura` accepta un objecte parcial i retorna pendents. Després `arrenca` ompli el que falta amb Supabase i conserva els mètodes custom. Evidència: [src/host.js:108–114](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:108>), [src/host.js:152–158](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:152>) i [src/host.js:176–190](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/host.js:176>). El port incorpora els mètodes a una implementació acumulada, [src/data/backendPort.js:8–26](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_auditat/src/data/backendPort.js:8>).

**[SUPÒSIT]** Amb un adaptador de Sollutia parcial, una identitat implementada per un backend i dades resoltes per un altre poden no compartir la mateixa semàntica. No s’ha observat trànsit real desviat.

**Solució i acceptació:** o bé un únic adaptador Supabase explícit amb extensió deliberada per capacitats, o bé injecció estricta que rebutge contractes incomplets abans de qualsevol muntatge. Publicar el contracte real i provar que un backend parcial falla amb un diagnòstic precís, sense completar silenciosament mètodes d’un altre origen.

### 1.9. Pla proposat per a IAIA MarIA

| Ordre | Paquet de treball | Troballes | Condició de tancament |
| --- | --- | --- | --- |
| 1 | Entrada i configuració de confiança | F01–F04, F28 | Web i embed arrenquen en fred; política única; secrets sintètics rebutjats; cap injecció parcial accidental. |
| 2 | Frontera de sessió i aïllament | F05–F07, F09, F12 | Logout definitiu; respostes antigues descartades; rol, dades i peticions vinculats al scope vigent. |
| 3 | Integritat i privacitat de Notes | F08, F10–F11 | Cap ACK esborra un draft posterior; conflictes recuperables; mitjans privats realment privats en Sollutia. |
| 4 | Barreres mecàniques fiables | F21–F26 | Les fixtures negatives tomben cada porta; validació de l’arbre staged; esquema comú i proveniència del build. |
| 5 | Fluxos d’ús i Sistema de Disseny | F13–F19 | Xat i Notes paginen; compartir funciona; navegació amb teclat; portals i router aïllats. |
| 6 | Publicació i operació | F20, F27 | Corpus públic aprovat; decisió sobre Docker; evidència del build real que es publicarà. |

Els paquets 1–4 bloquegen la certificació dels fluxos afectats. No cal esperar a acabar tots els canvis per escriure les proves negatives que els delimiten. Les correccions han de ser petites i revisables; els comptadors verds només tenen valor si es coneix l’abast que comproven.

**Contracte proposat per al sistema 100% online:** persistència i autorització autoritatives en Sollutia/Supabase; memòria local temporal per a estat d’interfície i drafts pendents, separada per identitat i mai presentada com a desat remot; HTTP amb terminis i errors explícits; publicació d’adjunts com a operació explícita. No es proposa una base de dades local, replicació offline ni un backend alternatiu.

### 1.10. Incògnites i validacions externes pendents

1. **[SUPÒSIT] Estat remot:** quines migracions i polítiques estan realment aplicades en Sollutia, i quins buckets/URLs són accessibles amb anon, usuari A, usuari B i un altre poble? F11/F21 no equivalen a una inspecció de producció.
2. **[SUPÒSIT] Incident anterior de secrets:** una clau real va arribar a un artefacte publicat? Si sí, s’ha revocat/rotat i s’han revisat els usos? El codi local i l’eliminació de literals no poden respondre açò.
3. **[SUPÒSIT] Contracte d’integració:** emissor, audiència, orígens exactes, propietat de router/head i si hi haurà més d’una instància per document. Cal un contracte de fixtures compartit amb Sollutia.
4. **[SUPÒSIT] Govern de repositori:** CI requerida i protecció de branca. Un `doctor --ci` local no acredita configuració remota.
5. **[SUPÒSIT] Accessibilitat completa:** falta inspecció visual i ús amb lector de pantalla, zoom, contrast i dispositius reals. F16 és un defecte reproduït, no un certificat global.
6. **[SUPÒSIT] Rendiment real:** latència, compressió HTTP, memòria i volum de dades en ús. La mida local dels artefactes només és un indicador per orientar la mesura.
7. **[SUPÒSIT] Disponibilitat operativa:** restauració de còpies remotes, alertes, límits de quota i recuperació de servei. No s’han auditat fora de l’arbre local.

### 1.11. Precisió i acusacions que no es formulen

- El `catch` inicial d’F02 era un defecte del control preventiu, després corregit de manera concurrent; no provava que els bundles contingueren credencials privilegiades.
- No s’assumix que totes les polítiques històriques continuen actives; una auditoria ha de reconstruir l’estat final. No es presenta un `USING(true)` històric com a fuga actual sense comprovar migracions posteriors.
- Els rols incorrectes d’F06 són estat del client. Una escalada al servidor requeriria evidència addicional sobre autorització remota.
- El cos HTTP ja queda dins de l’espera/neteja del temporitzador; el defecte restant verificat és la renovació, F12.
- El head de l’embed ha millorat: la configuració automàtica el desactiva. F18 identifica els límits que persistixen, no repetix l’afirmació antiga d’un segrest universal del head.
- No s’ha buscat en fonts externes ni s’ha atribuït cap CVE a una versió instal·lada.

### 1.12. Evidències, integritat i bateria de veritat

Evidències temporals locals: `/private/tmp/sdp-auditoria-extrema-bim9e_y7/`. No formen part del producte ni s’han publicat. Els noms principals són `vitest.log`, `eslint.json`, `node_tests.log`, `frontmatter_global_inicial.log`, `frontmatter_global_baseline.log`, `rls.log`, `reflex_doctor.json`, `frontera.log`, `web_arrencada.json`, `diagnostics_node.json`, `diagnostics_dom.json`, `diagnostics_addicionals.json`, `scc_inicial.json` i `tancament_abans.json`. Poden desaparéixer amb la neteja dels temporals; l’informe conserva el diagnòstic, les cites i les seqüències de reproducció necessàries.

**Verificació documental de tancament:** frontmatter individual estricte amb F1–F8 a zero. La còpia del graf inicial passa d’un orfe a zero després d’ancorar l’informe i el seu encàrrec. En incorporar l’informe Claude aparegut concurrentment, queda un orfe alié a la producció Codex; el registre del tancament actualitzat es conserva. No s’han regenerat mirrors en l’original ni s’afirma verd global de l’arbre compartit. Les 458 empremtes inicials eren idèntiques en el primer control; els canvis posteriors d’altres processos s’han detectat i registrat. Codex no ha escrit cap font funcional: només este estudi, ancoratge, ESTAT/LEDGER i bootstrap intern. Sessió mecànica: `94f57f9e-abfa-475c-97b9-6478358bc376`. No s’ha creat cap commit.

- [x] S’ha llegit i explorat el codi real, incloses les entrades que executa l’aplicació.
- [x] Les afirmacions de codi tenen ruta i línies del tall auditat.
- [x] Les rutes citades s’han comprovat contra l’arbre local.
- [x] Les condicions no demostrades es marquen com a [SUPÒSIT] o consten en Incògnites.
- [x] No s’ha utilitzat web, navegador ni recuperació externa.
- [x] No s’ha modificat codi funcional, configuració executable, migracions ni tests del projecte.
- [x] El document passa `tractor-frontmatter.mjs --estricte` en abast individual amb l’esquema vigent; el deute global es declara per separat.

### 1.13. Canvis concurrents observats i límit de la reverificació

A les **19-09-2026 16:10:44**, el repositori compartit ja conté modificacions d’altres processos. S’ha preservat el tall inicial i no s’han revertit, completat ni atribuït a Codex eixos canvis. L’inventari i les empremtes estan en `canvis_concurrents_final.json`, `git_concurrent.txt` i `fonts_citades.json`.

- **F02, correcció parcial comprovada:** en el primer recontrast, la funció ja rebutja el JWT administratiu sintètic quan rep URL; accepta encara el mateix JWT o `sb_secret_FAKE` sense URL. Aquella prova també acceptava la configuració de runtime amb `supabaseAnonKey`, perquè el controlador consultava `anonKey`. Resultats exactes: `credencials_recontrast_final.json`. La política ha continuat canviant després: eixa última via requerix tornar a provar la versió final, i no es presenta ací com a encara oberta sense eixa comprovació. La separació del `throw` i el retorn si falta URL es veuen en [src/config/publicCredentials.js:5–8](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_contrast/src/config/publicCredentials.js:5>) i [src/config/publicCredentials.js:26–47](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_contrast/src/config/publicCredentials.js:26>).
- **F21, correccions de codi observades:** s’ha llevat `profiles` de les exempcions i R5 ja té una branca que crida `falla`; açò supera dos defectes textuals del tall inicial, però no equival a una prova de resultat de la política nova. El control d’RLS continua basat en trobar un `ENABLE` al text, sense reconstruir l’estat final. Fonts del contrast: [tooling/gates/tractor-rls.mjs:77–82](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_contrast/tooling/gates/tractor-rls.mjs:77>), [151–165](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_contrast/tooling/gates/tractor-rls.mjs:151>) i [223–231](</private/tmp/sdp-auditoria-extrema-bim9e_y7/codi_contrast/tooling/gates/tractor-rls.mjs:223>).
- **F01/F03/F04 i integració:** `main.jsx`, `runtimePolicy.js` i `host.js` figuren entre els fitxers canviats després de la prova inicial. Les reproduccions del tall inicial són vàlides per a eixa revisió; l’estat de correcció de la versió concurrent queda **pendent de reverificació**, no es dona ni per resolt ni per fallit.
- **Portes i OAuth:** també hi ha canvis en runner, cadena, consell, sanejament/callback i la retirada d’un comprovador. No s’han convertit els verds o rojos inicials en un dictamen sobre eixa nova cadena sense executar-la.

**Passada final proposada per a IAIA MarIA:** quan el treball concurrent quede estable, fixar un nou commit i repetir les proves específiques d’F01–F05 i F21, la suite existent i les Portes sobre eixe arbre exacte. Actualitzar l’estat de les 28 fitxes, conservant les proves negatives. Este informe entrega el diagnòstic complet del tall identificat i no reclama haver auditat modificacions posteriors indefinidament.

## 2. Avaluació DAFO

- **Fortaleses:** recorreguts executables i cites locals; reproduccions amb credencials falses; separació entre estat del client i permisos del servidor; reconeixement de correccions que ja existixen.
- **Debilitats:** sense entorn remot ni navegador real, no es certifica el desplegament, l’experiència visual completa o l’absència de vulnerabilitats no cobertes. La revisió és àmplia, però no és una prova formal de tot el sistema.
- **Amenaces:** aplicar solucions parcialment pot introduir més divergència entre web/embed o perdre drafts; ampliar baselines o eliminar tests per obtindre verd amagaria defectes. Publicar automàticament este informe via RAG ampliaria la informació interna exposada.
- **Oportunitats:** unificar política, scope de sessió i contractes documentals; convertir cada regressió reproduïda en una prova breu; fer que cada Porta demostre què rebutja i sobre quin artefacte.

## 3. Matriu d’urgència i importància

| Quadrant | Treball proposat |
| --- | --- |
| Urgent i important | P1; corregir també F17 perquè la suite actual falla; confirmar amb Sollutia l’estat dels mitjans privats abans d’usar-los amb contingut sensible. |
| Important però no urgent | Paginació, pressupostos de rendiment, accessibilitat completa, SEO públic i govern del corpus RAG. |
| Urgent però menys important | Consolidar un únic estat de resultats amb data, commit, entorn i abast, perquè no es reutilitze «tot verd» fora de context. |
| Ni urgent ni important per a resoldre estos riscos | Retocs cosmètics o renoms sense efecte sobre els contractes i els defectes descrits. |

**Ancoratge de seguretat:** [[00_index_escriptori]]. **Aplicació de canvis reservada a IAIA MarIA.**
