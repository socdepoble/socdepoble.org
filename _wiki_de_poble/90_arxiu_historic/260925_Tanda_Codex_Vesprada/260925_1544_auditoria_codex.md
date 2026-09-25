---
type: informe
status: esborrany
description: Auditoria local del nucli, identitat, Model B i proves, amb correccions proposades abans del consens.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9668985a-fe3e-47c2-871d-dfdb234b0d2a:c5726444-64c0-4467-9c14-463dd7cd1729
---
# Auditoria de fortificació i connexió Sollutia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9668985a-fe3e-47c2-871d-dfdb234b0d2a:c5726444-64c0-4467-9c14-463dd7cd1729 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T13:45:46.862Z |
| Modificació | 2026-09-25T13:45:46.862Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats: no disponibles; estimats: no calculats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-25: auditoria sobre HEAD `18acb41be86c7fa9f8a3b884c9b9e68d38e1ea38` més el working tree heretat; proves i sondes locals. Pla compartit llegit i completat. Cap canvi de codi de producte.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dictamen: encara no és acceptable declarar 100% verd ni connexió Sollutia verificada.** Hi ha dues fractures d’identitat reproduïdes amb dades sintètiques, una política d’orígens massa ampla, una prova desactualitzada i deute de portes. No s’ha demostrat cap bypass de RLS remota; tampoc se n’ha certificat l’absència.

### F1 · P1 · Accions d’A poden escriure amb la sessió B durant la renovació

- **Fitxers:** `src/data/supabase/auth.js:80-84`, `:109-148`; proves actuals a `auth.test.js`.
- **Reproducció:** A té JWT amb 10 segons de vida; inicia `updateUserPassword` o `updateProfile`; la renovació queda pendent; entra B i augmenta `versioSessio`; arriba la resposta antiga. `renova` rebutja correctament el resultat antic, però `asseguraUsuari` retorna després el nou usuari B. `updateProfile` captura l’epoch massa tard; `updateUserPassword` no fixa l’actor de l’acció.
- **Resultat observat:** la contrasenya sintètica destinada a A s’envia en un `PUT /auth/v1/user` amb actor B. El perfil envia `PUT /auth/v1/user` i `PATCH /rest/v1/profiles?id=eq.B` amb el nom destinat a A. Les dues funcions anuncien èxit.
- **Abast:** cursa entre sessions en la mateixa instància; no prova accés remot a un compte alié sense la seua sessió. RLS no pot distingir una intenció d’A quan el client envia la petició autenticada com B.
- **Font de veritat:** Model B amb identitat autoritativa, contracte de l’arbitratge existent i prova «perfil d’A pendent no escriu ni actualitza la sessió B». La prova actual cobrix el PUT ja començat, no la renovació prèvia.
- **Correcció:** capturar actor desat, configuració i identitat de sessió abans del primer `await`; permetre només la renovació legítima d’eixa mateixa sessió. Un canvi d’actor, logout o nova entrada, inclús del mateix actor, ha de produir `AbortError` abans del PUT. Cal distingir refresh legítim de reemplaçament de sessió, no comparar cegament l’epoch inicial després de qualsevol refresh.
- **requires_human_decision:** false per al diagnòstic i la correcció; execució subjecta al consens global del prompt.

### F2 · P1 · Persistència parcial mescla token B i usuari A

- **Fitxers:** `src/config/storage.js:81-89`, `src/data/identitat.js:135-145`.
- **Reproducció:** desar A, permetre desar JWT i refresh de B, provocar `QuotaExceededError` en desar `socdepoble-user`. S’ha carregat el codi real de storage i identitat en una VM amb emmagatzematge sintètic.
- **Resultat observat:** `desaSessio(...) === true`, JWT desat de B i `usuariDeSessio().id === 'A'`. `setEfimer` amaga l’error i el desat de les tres peces no és atòmic malgrat el contracte del comentari. L’estat visible i les peticions poden correspondre a persones diferents.
- **Correcció:** escriptura de sessió que propague errors, serialització abans de modificar i verificació de la persistència; davant qualsevol fallada, invalidació completa i lectures tancades encara que la neteja del navegador també falle. `desaSessio` no pot tornar èxit ni els fluxos de login emetre’l si no hi ha sessió coherent. Conservar APIs públiques i no migrar a localStorage.
- **Font de veritat:** contracte «Les tres peces o cap» d’identitat i restricció d’emmagatzematge efímer.
- **requires_human_decision:** false, amb el mateix límit d’execució.

### F3 · P2 · La frontera de missatges no respecta l’origen exacte

- **Fitxers:** `src/config/runtimePolicy.js:62-91`, consumidor `src/host.js:exposaGlobal` i relé OAuth.
- **Evidència:** `esOrigenPermes('https://socdepoble.org:8443')` retorna `true`, encara que és un origen diferent del port HTTPS per defecte. A més, configurar `parentOrigins: ['https://only.example.test']` continua acceptant `https://v2.sollutia.com` per les eixides anticipades basades només en `hostname`.
- **Abast:** la comprovació `event.source === window.parent` es manté i limita l’exposició al pare real; no és acceptació de qualsevol finestra. El test actual descriu els orígens configurables com a «extres», però el comentari principal promet una llista blanca de política: cal fer explícita la semàntica.
- **Correcció:** defaults com a llista d’orígens exactes, mai hostnames; política efectiva explícita per als pares, separada dels destins del relé. Propose que una llista explícita substituïsca els defaults en el canal host. Afegir proves de ports, protocols i font del missatge.
- **requires_human_decision:** true per a acordar els orígens reals i si la llista del host substituïx els defaults. No afegir dominis intuïts.

### F4 · P2 · La integració real de Sollutia continua desactivada

- **Fitxers:** `src/data/adaptadors/sollutia/client.js:4-17`, `recursos.js`, `creaFrontissa.js`; ADR Model B.
- **Evidència:** `CONFIGURACIO` té `apiOrigin: null`, zero orígens i zero recursos; `llig` torna `UNKNOWN_RESOURCE`. El traductor de `recursos.js` i el contracte que compta la porta d’adaptadors no estan activats en el catàleg de producció.
- **El que sí funciona localment:** `configura({backend})` es rebutja, el port es congela, la Frontissa imposa GET, `credentials: omit`, `redirect: error`, límit de bytes, timeout, cancel·lació i decodificador de DTO.
- **El que falta per acceptar:** origen i recurs Sollutia confirmats, captura sense secrets i fixture, contracte d’emissor/audiència i prova que Supabase confia en eixa sessió; prova RLS multiusuari en staging i OAuth real amb les Redirect URLs correctes.
- **Precisió:** comprovar claims al navegador no crea confiança criptogràfica a Supabase. La confiança d’un emissor extern s’ha de configurar al servidor segons [Third-party auth](https://supabase.com/docs/guides/auth/third-party/overview) o les [claus JWT admeses](https://supabase.com/docs/guides/auth/jwts). Tampoc tot JWT extern implica que GoTrue puga renovar-lo: cal acordar el mecanisme real.
- **Correcció:** mantindre el catàleg tancat fins a disposar del contracte; actualitzar després la documentació ADR, que encara cita peces pendents ja existents i un token de Frontissa que el transport actual no envia.
- **requires_human_decision:** true per al contracte i staging. No s’han inventat endpoints ni enviat credencials.

### F5 · P2 · Una fixture de Vitest no representa el contracte actual de Notes

- **Fitxers:** `src/components/universal/workspace/UniversalWorkspace.test.jsx:45-57,142`; `src/sections/notes/NotaFitxa.jsx:68-70`; `NotesSection.jsx:31-50`.
- **Fallada:** espera «El teu estudi d’escriptura privat» però rep el text llavor de l’entradeta. El model de la prova només porta `excerpt`; la targeta activa usa `item.data.lead` i el mapper real conserva `data: note`.
- **Correcció conservadora:** completar la fixture amb `data.lead` coherent amb el text esperat i comprovar el contracte actiu/inactiu. No substituir l’assert per qualsevol text ni canviar UniversalCard, DocumentEditor o NotaFitxa per fer passar la prova.
- **requires_human_decision:** false.

### F6 · P2 · La porta d’enxufe tracta mocks de proves com a globals de producció

- **Fitxer:** `tooling/gates/tractor-enxufe.mjs`, recol·lector `fonts` i E4.
- **Evidència:** 13 infraccions E4, totes en `.test.js/.test.jsx`, per assignacions de mocks `window.umami` i `window.fetch`; E1–E3 passen. No s’ha trobat una nova superfície de producció en eixe resultat.
- **Correcció:** excloure fitxers de prova del cens de producte, amb tests de la porta que exigisquen que la mateixa assignació en un fitxer productiu continue fallant. No traslladar mocks al host ni augmentar una baseline.
- **requires_human_decision:** false.

### F7 · P2 · Precondicions documentals no acreditades

- El prompt 15:37 afirma tindre rebut però posa «Pendent» i la porta confirma que manca `reflex`; el pla també arribà sense rebut. S’ha obtingut rebut nou per al pla que este torn completa; el prompt original queda preservat, sense atribuir-li una lectura retroactiva.
- `porta:orfandat`: zero enllaços trencats i un orfe, `_wiki_de_poble/10_metriques/11_grafica_consum.md`, anterior a este torn. No s’ha esborrat ni arxivat cap document alié.
- Cal regularitzar el prompt pel circuit documental i ancorar la gràfica a l’índex pertinent. No buidar investigació ni producció humana.
- **requires_human_decision:** false per a l’ancoratge; no falsejar rebuts de generació.

### F8 · P3 · Cost del paquet incrustable

El build web té un chunk de 650,75 kB (188,53 kB gzip); el standalone és un únic JS de 2.701,00 kB (816,18 kB gzip). És evidència de pes, no una mesura de latència. Abans de canviar l’empaquetat, mesurar descàrrega i execució en l’amfitrió real. No propose una reestructuració general durant la reparació d’identitat.

### Millora del prompt i rèplica al pla de MarIA

1. Separar explícitament `auditoria` i `execucio_autoritzada`: ara la missió ordena reparar i el protocol final ho prohibix fins al consens. En este torn preval la fase AFK expressa.
2. Substituir «zero vulnerabilitats» per criteris comprovables: proves de concurrència, política d’orígens, matriu RLS amb dos usuaris i evidència de staging. Una auditoria local no acredita absència absoluta de vulnerabilitats.
3. Diferenciar Sollutia com a amfitrió/lectura i Supabase SdP com a backend autoritatiu; no usar «Supabase (Sollutia)» com a equivalència sense contracte.
4. Validar les caselles amb rebuts i portes reals abans d’enviar el prompt. `prompt.local` anuncia v2.3.0 mentre el router conserva 2.2.0: alinear en una revisió de govern específica.
5. Model i consum: variant no exposada; no s’han inventat tokens ni telemetria mesurada.

El pla 15:37 s’ha completat amb F1–F8. No hi ha una auditoria activa de Claude d’esta tanda a l’escriptori principal; no s’ha llegit automàticament l’arxiu històric ni s’ha presumit consens. No fa falta revertir la UX per resoldre F1, F2, F5 o F6.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Tall final de tancament (15:53):** `tancament.mjs --turn-id torn_9668985a-fe3e-47c2-871d-dfdb234b0d2a` retorna `valid:false`, estat `planned`. Passen plantilles, autoritat, LEDGER, catàleg de skills i compilació Wiki. Fallen el segell i SCC (gràfica de consum i `var/plantilla-viva/informe.md`). El controlador també detecta canvi de codi fora de l’abast documental.

**Canvis concurrents identificats:** la comparació amb l’inventari d’inici mostra `src/sections/onboarding/OnboardingSection.jsx` modificat a les 15:51:44 i `.agents/skills/sdp-universal-editor/SKILL.md` a les 15:50:17, més un briefing extern a `_wiki_de_poble/01_produccio/`. No els ha editat este torn. El segell passava abans i ara el hash és `206fd794`, diferent d’`a3953a1b`. No s’ha renovat per encobrir la modificació. Les proves i builds de la taula corresponen al tall anterior a eixes edicions; les troballes d’identitat es mantenen perquè eixos fitxers no han canviat respecte de l’inventari inicial.

**Entrega pròpia:** auditoria i pla passen `document.mjs check`, els dos ancorats a l’escriptori, amb relleu en ESTAT i LEDGER. No es declara el torn `closed` ni la cadena global verda.

| Comprovació | Resultat observat |
|---|---|
| `npm test -- --run --reporter=verbose` | 490 proves: **489 passen, 1 falla**; 69/70 fitxers verds, 41,35 s |
| `node --test tests/*.test.mjs tooling/gates/tractor-psicopatia.test.mjs tooling/broker/broker.test.mjs` | **300 passen, 0 fallen, 2 omeses**; 302 comptades; broker inclou 22 casos interns verds |
| `npm run lint` | Exit 0 |
| Build web i `build:wp`, eixides noves en `/tmp` | Els dos passen; sense executar el prebuild que regenera fonts |
| Enxufe | Falla: 13 E4 sobre fitxers de prova |
| Adaptadors / Frontissa / RLS / Frontera / Frontera auth | Passen; RLS és anàlisi estàtica de 18 SQL, no execució remota |
| Orfandat | 0 enllaços trencats, 1 orfe heretat |
| `npm run porta -- --diagnostic` inicial | Plantilles, autoritat, segell i LEDGER passen; documental falla (documents 15:37 sense rebut i auditoria encara esborrany en aquell tall) |
| Sonda F1 | Dues accions d’A enviades amb B, reproduïdes sobre el mòdul real amb transport simulat |
| Sonda F2 | Desat anuncia èxit amb JWT B i usuari A després d’error de quota |
| Sonda F3 | Accepta port 8443 i domini fora de la política explícita |
| Navegador local | Arranca `/xat`; clic a Perfil sense sessió porta a `/registre`; cap compte creat ni credencial introduïda |

La primera execució Vitest retornà exit 1 sense resum complet en el log; es repetí una sola vegada amb reporter detallat per obtindre l’evidència íntegra. No s’han repetit suites verdes innecessàriament.

Evidència temporal: `/tmp/sdp-audit-vitest-verbose-260925.log`, `/tmp/sdp-audit-node-260925.log`, `/tmp/sdp-audit-lint-260925.log`, `/tmp/sdp-audit-build-web-260925.log`, `/tmp/sdp-audit-build-wp-260925.log`. Les sondes íntegres queden incloses a continuació per a no dependre de la retenció de `/tmp`.

#### Reproducció F1 sense xarxa ni credencials reals

Desar este bloc fora del producte i executar `node --experimental-vm-modules CAMI.mjs`. Ajustar només `root` si es mou el repositori.

```js
import vm from 'node:vm';
import fs from 'node:fs';
const root = '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org';
async function probe(action) {
 let user={id:'A'}, epoch=1, writes=[], finish;
 const context=vm.createContext({console, setTimeout, clearTimeout, AbortController, DOMException, fetch:()=>new Promise(r=>{finish=r;})});
 const synthetic=values=>new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v] of Object.entries(values))this.setExport(k,v);},{context});
 const identity=synthetic({CLAU_REFRESC:'refresh',versioSessio:epoch,desaSessio:()=>true,esborraSessio:()=>{},usuariDeSessio:()=>user,actualitzaUsuariSessio:()=>{},caducitatJwt:()=>Date.now()+10_000,MARGE_RENOVACIO_MS:60_000});
 const modules={
 '../authAttempt.js':synthetic({beginAuthAttempt:()=>{},cancelAuthAttempts:()=>{}}),
 '../../config/storage.js':synthetic({getEfimer:()=>'synthetic-refresh-A'}),
 '../identitat.js':identity,
 '../oauthRelay.js':synthetic({entraAmbGoogle:()=>{},gestionaTornada:()=>{}}),
 './runtime.js':synthetic({configuraRefrescSessio:()=>{},getCurrentUser:()=>user,getResolvedConfig:()=>({supabaseUrl:'https://example.test',supabaseAnonKey:'synthetic',runtimeDataMode:'remote'}),request:async(path,config,options)=>{writes.push({actor:user.id,path,method:options.method,body:options.body});return path.startsWith('/auth/')?user:[user];},rpc:()=>{}}),
 './realtime.js':synthetic({tancaRealtime:async()=>{}}), './config.js':synthetic({resetClient:()=>{}})
 };
 const mod=new vm.SourceTextModule(fs.readFileSync(root+'/src/data/supabase/auth.js','utf8'),{context});
 await mod.link(spec=>modules[spec]);await mod.evaluate();
 const work=action==='password'?mod.namespace.updateUserPassword('synthetic-password-for-A'):mod.namespace.updateProfile({full_name:'Synthetic name A'});
 user={id:'B'}; identity.setExport('versioSessio',++epoch);
 finish({ok:false,status:401});
 let result;try{result=await work;}catch(e){result=e.name+': '+e.message;}
 console.log(JSON.stringify({scenario:action+' A starts → refresh pending → B signs in → stale refresh resolves',result,writes}));
}
await probe('password');await probe('profile');
```

#### Reproducció F2 sense navegador real

```js
import vm from 'node:vm';import fs from 'node:fs';
const root='/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org';
const saved=new Map();let rejectUser=false;
const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>{if(rejectUser&&k.endsWith('socdepoble-user'))throw new Error('QuotaExceededError');saved.set(k,v);},removeItem:k=>saved.delete(k)};
const context=vm.createContext({window:{sessionStorage:storage,localStorage:{getItem:()=>null}},console,atob,crypto:globalThis.crypto});
const mod=(file)=>new vm.SourceTextModule(fs.readFileSync(root+file,'utf8'),{context});
const synthetic=values=>new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});
const st=mod('/src/config/storage.js');await st.link(()=>{});await st.evaluate();
const identity=mod('/src/data/identitat.js');
await identity.link(spec=>spec.includes('storage')?st:spec.includes('runtimePolicy')?synthetic({getRuntimePolicy:()=>null}):synthetic({esFontImatgeSegura:()=>true}));await identity.evaluate();
identity.namespace.desaSessio({access_token:'synthetic-A',refresh_token:'synthetic-refresh-A',user:{id:'A'}});
rejectUser=true;const success=identity.namespace.desaSessio({access_token:'synthetic-B',refresh_token:'synthetic-refresh-B',user:{id:'B'}});
console.log(JSON.stringify({success,token:saved.get('sdp_embed_socdepoble-jwt'),currentUser:identity.namespace.usuariDeSessio()}));
```


<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Fase AFK del prompt: no s’ha modificat codi, SQL, components visuals ni configuració de producció. S’han creat documents i evidència temporal; el pla continua pendent de consens.
- Les sondes executen codi real amb dependències simulades; demostren comportament local, no explotació remota ni auditoria criptogràfica.
- No s’han consultat ni imprés secrets `.env`, canviat comptes, executat migracions remotes, publicat, fet push ni commit.
- OAuth real, confiança d’emissor Sollutia, RLS multiusuari i catàleg real no verificats. La documentació de [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) confirma la dependència del verificador; les proves locals no substituïxen el flux complet amb el proveïdor.
- La suite Node executada enumera els fitxers indicats, no qualsevol script arbitrari del repositori. No s’ha fet un escaneig de CVE de totes les dependències.
- El treball ja tenia modificacions heretades: HEAD sol no representa l’evidència auditada. Cap afirmació de «tot el sistema perfecte» ni certificació ISO deriva d’este informe.
- Acta Marmota global pendent al final de jornada; el relleu d’este torn queda a ESTAT i LEDGER.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260925_1537_pla_implementacio_codex]]
- [[260925_1537_prompt_codex]]
