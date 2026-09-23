---
type: petorreta
status: esborrany
description: Auditoria local i proposta arquitectonica de Storage, RLS i cadena de portes; sense implementacio.
tags:
  - fortificacio
  - arquitectura
  - supabase
  - portes
---
# Fortificació amb trellat — Fases 4 i 5

## 1. UX i deute humà, abans del codi

Una porta que crida «perill» per una variable sense ús ensenya a ignorar les alarmes. Una pujada que publica una nota per una carpeta equivocada trenca la confiança del veïnat. La fortificació ha de donar dues certeses: **guardar treball amb avisos és possible; travessar una frontera d'autorització no ho és**.

La interfície ha de distingir «desat privat», «publicat» i «no s'ha pogut completar». Tornar silenciosament la referència original després d'un error no acredita una publicació. El deute taronja necessita ubicació, responsable i seguiment; el roig necessita una causa concreta i una via de reparació.

## 2. Registre i contenció

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-LOCAL-260921-CODEX-45 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació / Modificació | 26-09-21 10:14 |
| Propietari | Consell de la Petorreta — Codex |
| Aprovació humana | pendent; proposta sense aplicar |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

Lectura estàtica local, incloent el SDK instal·lat. Sense web, connexió a Supabase, execució de portes, builds o migracions. No s'ha comprovat l'estat remot ni reproduït una fallada RLS. Única escriptura: aquest informe, expressament demanat. La contenció de l'usuari preval sobre actualitzar ESTAT, índexs o executar el tancament del repositori. No es valida ací el tancament de les fases 1–3.

S'han consultat AGENTS.md, protocolledge.json, la plantilla vigent de prompt del Consell i el protocol d'auditoria. Les rutes següents són relatives a `socdepoble.org/`.

## 3. Reunió davall l'Olivera: rèplica als informes previs

Llegits abans d'emetre dictamen: [Supabase](260921_0948_informe_auditoria_supabase.md) i [Portes](260921_0954_informe_auditoria_portes.md). No n'atribuisc l'autoria a Claude perquè els documents no la identifiquen.

- **D'acord:** cal limitar Storage, distingir gravetat i evitar que el primer bloqueig oculte la resta.
- **Discrepe de `--max-warnings=0` com a norma del commit.** Converteix tots els avisos en bloquejos; contradiu la porta taronja. El `package.json` actual ja incorpora eixe llindar.
- **El hook actual no és decoratiu.** `.husky/pre-commit` executa `npm run gate`, i després repeteix lint i Vitest, que ja figuren en la cadena. L'afirmació anterior ha quedat desmentida pel fitxer present.
- **Filtrar profunditat de carpetes no resol la confidencialitat.** La proposta C1 de Supabase continuaria permetent llistar molts objectes públics. En un bucket públic, limitar SELECT no converteix les descàrregues públiques en privades.
- **No done per reproduïts** ni els 362 avisos ni les 27 portes roges de l'informe anterior: són antecedents, no mesures d'aquesta sessió.

## 4. Evidència que corregeix el punt de partida

| Troballa | Evidència local | Gravetat i conseqüència |
| --- | --- | --- |
| Referències del prompt no localitzades en el codi actiu | No s'han trobat `20240321111624_bucket_storage.sql` ni `storageService.js`; les migracions reals són `260913_0500_bucket_mitjans.sql` i `260919_1650_bucket_mitjans_privats.sql` | Alta per a la implementació: no reparar fitxers imaginaris ni crear `public_assets` per suposició |
| Provisió amb actualització implícita | Ambdues migracions fan `ON CONFLICT (id) DO UPDATE`; la pública força `public = true` | Alta: tornar a executar pot canviar la visibilitat d'un bucket existent |
| Superfície de noms oberta | `src/data/supabase/storage.js:27–94` rep buckets als helpers; `resolveAsset`, línies 130–153, tracta qualsevol bucket diferent del privat com a públic | Alta com a superfície d'entrada; no demostra per si mateixa un bypass de RLS |
| Contracte parcialment restringit | `uploadToStorage` tria dos buckets fixos, però `getPublicUrl` travessa `backendPort.js`; `supabase/index.js` reexporta tot Storage | Cal tancar totes les vies, no només la pujada |
| Linter i Promesa són portes diferents | `run-portes.mjs:32` executa lint al pas 3; Promesa és el pas 6 i no executa ESLint | Alta: amb avisos, el llindar actual pot tallar abans de Promesa |
| Promesa té dos veredictes | `tractor-promesa.mjs:203–206` pot aprovar sense baseline en JSON; `:233–236` bloqueja en mode text | Alta: el format de sortida altera la seguretat |
| Baseline per comptadors | Promesa desa `ids`, però compara només `max` | Mitjana: eliminar una incidència i afegir-ne una altra pot passar desapercebut |

La llista actual de `passos` conté **49 entrades**, no les 48 de l'acta. `run-portes.mjs:102–105` avorta al primer retorn no zero; no té estats taronja ni agregació final de troballes.

## 5. Fase 4 — Provisió exclusiva del backend

### 5.1. Decisió arquitectònica

Separar **administrar buckets** de **usar objectes**. Un procés de provisió de desplegament, sense endpoint públic, administra una llista fixa de buckets. El frontend no crea buckets, no rep credencials administratives i no decideix noms físics.

Preferisc l'API Storage del SDK per a la provisió: el SDK local documenta `getBucket(id)` i `createBucket(id, options)` en `node_modules/@supabase/storage-js/src/packages/StorageBucketApi.ts`. El manifest del servidor fixa identificador, visibilitat, límit i MIME. Cap valor arriba del navegador. Credencial administrativa exclusiva d'eixe procés, fora de `VITE_*`, del bundle i dels logs; client separat del client de sessions.

### 5.2. Algorisme idempotent i amb concurrència

1. Consultar exactament el bucket del manifest amb `getBucket`.
2. Si existeix, comparar identificador i configuració amb el manifest. Si difereix, **bloquejar el desplegament i informar**, sense convertir-lo a públic ni sobreescriure'l.
3. Només una resposta estructurada inequívoca de «bucket inexistent» habilita `createBucket`. Un 401/403, timeout, error de xarxa o error desconegut no significa absència.
4. Crear amb configuració explícita. Validar els codis d'error efectius contra la versió desplegada; no deduir-los d'una frase ni assumir que qualsevol 400/404/409 significa el mateix.
5. Si un altre procés l'ha creat mentrestant i arriba un conflicte reconegut de duplicat, rellegir-lo i validar-lo. Conflicte sense relectura satisfactòria: error. Reintents limitats.
6. Després d'una creació satisfactòria, rellegir i validar. Registrar resultat i configuració no sensible.

**`IF NOT EXISTS` no és una reparació de RLS:** necessita permisos de lectura i no elimina la cursa entre comprovació i inserció. `ON CONFLICT` tampoc és insegur intrínsecament: depén del rol, les polítiques i l'UPDATE que executa. Ací sí que és observable el risc de sobreescriure visibilitat; no hi ha evidència local suficient per atribuir una fallada concreta a «RLS intern».

Si Sollutia exigeix SQL de provisió, ha de ser una operació administrativa controlada: comprovar existència, inserir només si falta, gestionar la unicitat concurrent i validar després. No crear una RPC SECURITY DEFINER accessible al navegador per esquivar RLS, ni desactivar RLS per fer passar la migració.

### 5.3. Ordre de desplegament i historial

- Determinar quines migracions estan realment aplicades abans de programar la transició. La lectura del repositori no resol aquesta pregunta.
- No reescriure silenciosament migracions ja aplicades: preparar una evolució versionada i un camí explícit de bootstrap per a entorns nous.
- L'ordre ha de garantir buckets provisionats abans dels passos SQL que n'exigeixen existència. `260920_0300_blindatge_storage_i_contingut.sql` comprova els dos buckets i actualitza el privat; cal incloure aquest pas en el disseny.
- Eliminar d'un futur flux actiu qualsevol segon mecanisme que torne a imposar `public=true`, o la provisió conservadora quedaria anul·lada. Historial aplicat i bootstrap nou necessiten plans diferenciats.

### 5.4. Contracte més restrictiu per a la UI

- Exposar operacions de domini: pujar adjunt de nota, pujar avatar, resoldre actiu i publicar actiu. Ni `bucket`, ni una ruta arbitrària, ni un indicador lliure `public`.
- Per als adjunts, el servidor deriva poble, propietari i destí d'una nota autoritzada. Comprovar sessió i pertinença en servidor; `tenantId` del navegador no acredita permisos.
- Mantindre els noms físics en un mapa intern tancat de l'adaptador. Els helpers genèrics no han de formar part del port públic ni de reexports oberts. Adaptar conjuntament `contracte.js`, `backendPort.js`, adaptadors i consumidors.
- `getPublicUrl` ha de rebre un actiu públic validat; `resolveAsset` ha de rebutjar buckets desconeguts. Durant la compatibilitat amb `sdp-media://`, parser únic, llista exacta de dos buckets, ruta canònica i comprovació d'autorització. Una referència és entrada no fiable.
- No confiar en una allowlist JavaScript com a frontera de seguretat: qualsevol client pot parlar directament amb Storage. El terme precís ací és selecció no restringida de destí; no s'ha demostrat injecció SQL.

Per al perfil **més restrictiu**, les pujades privades poden anar directament a Storage amb JWT d'usuari i RLS estricta; les escriptures públiques queden reservades al servidor després d'autoritzar una publicació concreta. Eliminar llavors les concessions d'escriptura pública directa d'`authenticated`. No transportar totes les operacions a un backend amb `service_role` sense reproduir autorització: eixa credencial pot saltar-se RLS.

### 5.5. Polítiques i publicació

- En `storage.buckets`, anon i usuaris ordinaris no han de poder crear, modificar ni eliminar buckets. Revisar permisos i polítiques efectius, sense tocar a cegues l'esquema gestionat.
- En `storage.objects`, cada operació necessita bucket exacte i autorització. Per a privats: propietari autenticat, poble vàlid i pertinença activa; UPDATE comprova fila anterior i nova. Sense operacions anònimes.
- La migració `260920_0300` ja proposa barreres restrictives i una funció de ruta amb comprovació d'UUID. Conservar eixa defensa davant polítiques permissives afegides amb OR; verificar permisos d'esquema i execució dels helpers amb cada rol real.
- La llista d'objectes públics no ha de quedar oberta si la UI no la necessita. Retirar l'enumeració anònima no revoca les URLs públiques conegudes.
- `promoteToPublic` actual copia i conserva l'original; el comentari que diu «movent» no descriu l'operació. Fer-la una publicació autoritzada i idempotent en servidor, amb clau pública opaca, validació de tipus/mida i recuperació si falla la persistència de la referència. Retornar error explícit; no simular èxit amb la referència antiga.
- Storage i la base de dades no formen una transacció única. Preveure estat pendent, confirmació i neteja de còpies òrfenes. No prometre revocar còpies ja descarregades ni una atomicitat que no existeix.

**Decisió pendent (`requires_human_decision: true`):** confirmar si els adjunts de notes són exclusius del propietari o compartits. Proposta conservadora: exclusius, coherent amb el blindatge del dia 20. No canviar visibilitat de contingut existent durant aquesta auditoria.

## 6. Fase 5 — Roig i taronja sense ambigüitat

### 6.1. Matriu normativa proposada

| Resultat | Color | Commit |
| --- | --- | --- |
| Comprovació completa, sense troballes | Verd | Permetre |
| ESLint severity 1, zero errors fatals o severity 2 | Taronja | Permetre i guardar informe |
| ESLint severity 2 o error de parseig | Roig | Avortar |
| Secret, violació demostrada d'autorització/RLS, import obligatori absent, prova requerida fallida | Roig | Avortar |
| Promesa P1 confirmada en camí executable requerit | Roig | Avortar; sense baseline admissible |
| Promesa P2 que empassa una comprovació obligatòria | Roig | Avortar encara que existisca deute històric |
| P2 heurística no confirmada o fallada d'una eina opcional; P3 documental | Taronja | Permetre, amb evidència i seguiment |
| Baseline requerida absent/corrupta, procés no iniciat, timeout, senyal o JSON invàlid | Roig tècnic | Avortar: validació incompleta |

La gravetat pertany a la **troballa**, no al nom de tota la porta. No marcar Promesa sencera com a informativa ni convertir qualsevol exit 1 en avís. Les regex P1/P2 actuals no constitueixen una anàlisi completa del flux: reforçar-les amb comprovacions estructurals i proves de casos reals abans d'assignar bloquejos definitius.

Els avisos de dependències de React també mereixen seguiment: severity 1 no significa absència de risc. Si una regla ha de bloquejar sempre, configurar-la explícitament com a error i justificar-ho; no elevar tots els avisos amb un llindar global.

### 6.2. Un veredicte únic, diverses presentacions

Cada porta produeix un resultat estructurat amb versió d'esquema, identificador, execució completa o fallida, troballes amb codi/gravetat/ubicació, duració i abast comprovat. El color es deriva del resultat. Text i JSON es generen a partir del **mateix objecte**, incloent la validació de baseline.

Conveni del wrapper: exit 0 per verd/taronja, exit 1 per infracció bloquejant i exit 2 per fallada tècnica. El runner bloqueja amb qualsevol retorn inesperat, senyal o discrepància entre JSON i codi. No imposar eixa convenció als executables externs sense adaptador: ESLint té el seu propi contracte.

El wrapper d'ESLint usa resultats estructurats, sense `--fix` i sense `--max-warnings=0` en el perfil de commit. Zero severity 2 amb avisos dona taronja; error de configuració o execució dona roig tècnic. L'actual `lint` estricte pot conservar-se com a ordre separada de zero deute, però no ha de reintroduir-se després del runner al hook.

### 6.3. Cadena, informes i rendiment

1. Un manifest declara portes obligatòries, dependències, abast i pressupost de temps. Mantindre la guarda anti-recursió existent.
2. Executar totes les comprovacions independents i segures encara que una falle; les dependents queden «no executades per dependència». Cap omissió obligatòria es pinta de verd. Si falla la integritat del mateix executor, aturar-lo.
3. Calcular al final: qualsevol roig o comprovació obligatòria incompleta avorta; només taronges permeten commit amb resum explícit.
4. Guardar JSON i resum Markdown en un directori d'informes ignorat per Git, amb identificador d'execució, hash de l'arbre de l'índex Git, versions, comandaments i troballes. Sense secrets ni contingut sensible. Escriptura atòmica i retenció limitada.
5. Si no es pot guardar l'informe obligatori, retornar roig tècnic. La promesa de traçabilitat també s'ha de complir.
6. `.husky/pre-commit` crida una sola vegada el runner. Traure les repeticions de lint/tests. Verificar després la instal·lació real del hook; la presència del fitxer no prova que Git l'use.
7. Cap porta de commit repara fonts, actualitza baselines o genera artefactes dins del checkout. `tractor-build-previ.mjs:104` encara pot executar `npm run build`: separar comprovació i generació. El build complet pot executar-se en CI o checkout temporal aïllat, amb un perfil declarat.
8. La validació del commit ha de correspondre a l'índex Git, especialment amb staging parcial; no donar per validat el que s'ha comprovat només al working tree. Usar snapshot temporal i detectar canvis de l'índex durant la comprovació. CI revalida el commit complet i és obligatòria per integrar.

### 6.4. Deute amb memòria, no amb una xifra

Comparar empremtes estables de troballes amb la baseline, no sols quantitats. Un avís substituït per un altre ha de constar com a nou. Per a warnings, això informa, no bloqueja per defecte; els riscos durs no es congelen. Les excepcions no crítiques han de tindre motiu, responsable i caducitat. No regenerar `--baseline` dins d'un hook per aconseguir verd.

## 7. Proves d'acceptació abans de donar les fases per tancades

No executades: són el contracte de verificació de la futura implementació.

| Àmbit | Casos mínims | Resultat exigible |
| --- | --- | --- |
| Provisió | Bucket absent, existent conforme, existent divergent, dues creacions concurrents | Crear una vegada; conservar conforme; bloquejar deriva; rellegir duplicat |
| Errors | 401/403, resposta desconeguda, xarxa, timeout | No tractar-los com absència ni continuar com si hi haguera bucket |
| Frontera | Bucket desconegut, URI manipulada, poble alié, usuari alié, anònim | Rebuig real en servidor/Storage, també saltant-se la UI |
| Objectes | CRUD propi, CRUD alié, canvi de prefix, política permissiva addicional | Mantindre la separació de propietari i poble |
| Publicació | Crida duplicada, tipus no admés, còpia feta però DB fallida | Sense fals èxit, amb recuperació i sense eliminar l'original privat |
| Portes | Només warnings; error + warnings; fallada d'una porta seguida d'una altra independent | Commit permés amb informe; commit avortat; informe complet |
| Infraestructura | Timeout, procés absent, JSON corrupte, informe no escrivible | Roig tècnic |
| Promesa | Baseline absent en text/JSON; deute substituït mantenint quantitat | Mateix veredicte; detecció de la substitució |
| Git/CI | Staging parcial, índex canviant, hook omés, execució en CI | Validar l'arbre correcte; mai integrar sense controls obligatoris |

## 8. Dictamen

**Fase 4:** provisió administrativa fixa, idempotència amb relectura, cap canvi implícit de visibilitat i autorització efectiva d'objectes. Tancar el paràmetre de bucket és higiene d'API; RLS i el servidor són la frontera.

**Fase 5:** warnings taronja amb informe; errors i verificació incompleta roig. Corregir primer el llindar del linter, el doble criteri de Promesa i la duplicació del hook. Després validar la cadena completa sobre l'arbre que realment es vol guardar.

El poble necessita portes que expliquen per què tanquen, i avisos que deixen treballar sense desaparèixer.

## Vincles d'ancoratge

- [Acta de relleu](../10_actes/260921_1002_acta_marmota.md)
- [Prompt auditat](260921_0941_prompt_auditoria_fortificacio_codex.md)
- [Índex de l'Escriptori](00_index_escriptori.md)
- [Runner](../../tooling/gates/run-portes.mjs).
