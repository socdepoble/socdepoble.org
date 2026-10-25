---
type: informe
status: esborrany
description: Revisió independent de T1-T4, quota de 30 altes, RLS, xarxa, Connectar i pre-commit amb proves locals i límits explícits
tags:
  - auditoria
visibility: private
reflex: sdp:torn_87cf11b4-29f5-4e9f-aac2-7ab291c1d1b1:22068b15-f1c8-4039-912b-cd9e66ac684a
---
# Gauntlet post-commit 472f704d0 · Auditoria Codex i matriu MCR

**DICTAMEN: CONFORMITAT TOTAL REBUTJADA.** El commit aplica 60 admissions/hora i el contracte vigent exigix 30. A més, la verificació DNS té una excepció oberta i el parser conserva un camí quadràtic fora del temporitzador. Els punts corregits es reconeixen explícitament en la MCR.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_87cf11b4-29f5-4e9f-aac2-7ab291c1d1b1:22068b15-f1c8-4039-912b-cd9e66ac684a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T17:46:25.700Z |
| Modificació | 2026-10-24T17:57:00.350Z |
| Propietari | Codex |
| Aprovació humana | Auditoria autoritzada pel Mestre en este xat i pel prompt 261024_1945; cap desplegament autoritzat |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex local; model exacte no exposat per l’entorn |
| Tokens consumits | No disponibles com a mesura verificable de la sessió |


<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`, v2.0.0; SHA-256 `855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf`. Rebut `sdp:torn_87cf11b4-29f5-4e9f-aac2-7ab291c1d1b1:22068b15-f1c8-4039-912b-cd9e66ac684a`. Pla 1800 vinculat; el prompt 1945 i l'ordre humana fixen els requisits nous. El rebut acredita procedència, no comprensió ni permís de desplegament.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-24: revisió independent de `472f704d0917d52a633c315cb0c6e167e0b9d507`, branca `backup-notes-publish`. Llegits el prompt complet, pla 1800, informes de Claude/Gemini/Codex, Llibre Mestre i acta1945. Tres revisions paral·leles de xarxa, SQL/RLS i UI; la troballa del parser ha tingut refutació independent de lectura. Execucions locals, sense serveis remots ni secrets.

El requisit nou és **30 admissions/hora**, mentre el pla 1800 exigia60. Es rebutja la conformitat amb el contracte vigent; no es presenta el canvi de llindar com una regressió respecte del pla antic. Els diagnòstics previs de Codex sobre `Promise.all` i quota per parelles són històrics: el commit els ha corregit.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Matriu de Conformitat de Requeriments (MCR)

Les rutes abreujades són relatives a l'arrel `socdepoble.org`. `[FET]` acredita el nivell d'evidència indicat; no amplia una prova de codi a un desplegament.

| Requeriment | Estat ([FET] / [PARCIAL] / [NO FET]) | Evidència Codi (fitxer:línia) | Motiu / Risc Detectat |
| --- | --- | --- | --- |
| Màxim estricte de 30 altes o reactivacions/hora | [NO FET] | `supabase/migrations/2610241430_seguiments.sql:374`; `src/data/localSeguiments.js:44,130` | Llindar60. La 31a admissió i una represa després de 30 altes passen. G-01. |
| Comptar cada alta i represa, sense reiniciar en donar baixa | [FET] | `2610241430_seguiments.sql:363–382`; `localSeguiments.js:128–133` | Registre independent, recompte i insert sota el mateix pany/transacció. Conformitat estàtica SQL i executable local. |
| Idempotència sense consumir quota ni repetir primer | [FET] | `2610241430_seguiments.sql:351–352`; `localSeguiments.js:123` | Retorna abans de comptar; comprovada a quota plena. |
| Instant d'admissió del registre després del pany | [FET] | `2610241430_seguiments.sql:341–345,365,369,382` | `clock_timestamp()` únic post-lock, emprat en poda, recompte i insert. |
| Concurrència PostgreSQL real | [PARCIAL] | `2610241430_seguiments.sql:291,341–382` | Disseny coherent sota READ COMMITTED; falta motor i execució SQL concurrent. |
| Denegació declarada d'accés directe anon/authenticated a taules | [FET] | `2610241430_seguiments.sql:191–202` | RLS activa, ACL revocada, cap política oberta. No acredita ACL desplegada. |
| RPC limitades a identitat autenticada i lectures autoritzades | [FET] | `2610241430_seguiments.sql:296–308,398–399,450–455,514–534` | auth.uid(), EXECUTE només authenticated, propietat en filtres i administració exigida per a entitats. Revisió estàtica, cap bypass anònim demostrat. |
| Ports8080/8443 bloquejats en301/302/307 | [FET] | `supabase/functions/noticies/gestor.js:984,989` |18 casos locals en feed, personal i imatge; només primer fetch. HTTPS:443 normalitzat a port buit és el port estàndard, no bypass. |
| Privada A/AAAA mentre l'altra família falla | [FET] | `gestor.js:937–944,974` | allSettled conserva la privada,422 i zero fetch. Cas històric de Codex corregit. |
| DNS buit/ambdues famílies fallades i revalidació entre salts | [FET] | `gestor.js:975,1033` |502 sense baixada; canvi públic→privat entre salts vetat. |
| Fonts aprovades verificades encara sense resoledor al runtime | [NO FET] | `gestor.js:971–975` | `if (!nom) return null`: fonts/imatges aprovades baixen sense verificar IP. G-02. |
| Connexió lligada al destí públic verificat | [PARCIAL] | `gestor.js:937–975,1014–1015` | fetch rep el hostname després del DNS; rebinding/eixida de xarxa sense garantia acreditada. |
| Mida màxima i flux lent cooperatiu amb AbortSignal | [FET] | `gestor.js:504–532,1044` | Max+1 rebutjat i cancel·lat en sistema/personal/imatge; flux lent cooperatiu acaba504. |
| Protecció integral de termini/CPU davant cossos hostils | [PARCIAL] | `gestor.js:730–731,758,1053,1072,1186–1189` | Parser quadràtic després de retirar timer;1,04 MB admesos gasten7,08 s. G-03 heretada. |
| Textos visibles de Notes sense MAS | [FET] | `src/sections/notes/visibilitatNota.js:112–161`; `SnippetCurador.jsx:118–120,369` | Etiquetes i avisos nets; prova recursiva `visibilitatNota.test.js:157–169`. |
| Absència literal de MAS als fitxers, sense excepció per comentaris | [PARCIAL] | `visibilitatNota.js:124,152` | Dos comentaris encara el contenen; no es renderitzen. No és un defecte de privacitat ni un residu visible. |
| Cap botó solt Seguir en fitxes/targetes; connexió via /connectar | [FET] | `src/sections/profile/PerfilPublicSection.jsx:656`; `ProfileSection.jsx:45–47,82`; `src/sections/detail/ItemDetailSection.jsx:205`; `ConnectarSection.jsx:637–638` | Fitxes/targetes naveguen a Connectar. useSeguiment només té consumidor UI en BlocRelacio. |
| Vocabulari connectar en tota la UI de relacions | [PARCIAL] | `src/sections/connectar/BlocRelacio.jsx:80–84,114–115,137–138`; `src/sections/profile/Seguidors.jsx:125,154` | Seguir/Deixar de seguir/Gent que et seguix continuen visibles. Distingir esta migració lèxica de la prohibició d'accions disperses, que sí es complix. |
| npm run test:precommit en menys de 60 s | [FET] | `package.json:110`; `vitest.precommit.config.js:35–65`; `tooling/gates/git-staged.mjs:48` |25,402 s;2.927 Vitest+259 Node, zero fallades. Mesura d'este entorn. |
| Plànol T5b executable literalment | [PARCIAL] | `src/data/contracte.js:201–213,467`; `GestioMembres.jsx:310–313`; `PerfilShell.jsx:273–277` | Respecta explícitament Connectar; filtres de poble inexistents, DTOs i referències de components requerixen correcció. No són canvis de T1–T4. |

### G-01 · P2 · Quota vigent de 30 no implementada

**Confiança alta.** SQL permet60 i el local també. Les proves fixen60 (`seguiments.migracio.test.js:219`, `localSeguiments.test.js:103`): una suite verda pot certificar el contracte anterior i no el vigent.

**Reproducció executada sobre l'adaptador real:**60 altes úniques admeses; després de 30 altes, deixar i reprendre p0 s'admet com a31a (`primer:false`); la61a falla amb SDP-SEG-006. Això demostra el llindar local i concorda amb l'expressió explícita SQL; no és execució PostgreSQL ni intrusió remota.

```sh
node --input-type=module <<'JS'
import { createLocalSeguimentsAdapter } from './src/data/localSeguiments.js';
const persones = Array.from({length:32}, (_,i) => ({id:`p${i}`,nom:`Persona ${i}`}));
const local = createLocalSeguimentsAdapter({persones,ara:()=>new Date('2026-10-24T18:00:00Z')});
const ctx = {qui:'auditor'};
for (let i=0;i<30;i++) local.segueix({tipus:'persona',id:`p${i}`},ctx);
local.deixaDeSeguir({tipus:'persona',id:'p0'},ctx);
console.log(local.segueix({tipus:'persona',id:'p0'},ctx));
JS
```

**Reparació requerida:** alinear SQL, local, documentació i proves amb 30; la31a alta i represa han de fallar. Conservar historial, atomicitat i idempotència. `requires_human_decision:false`: el nou límit és explícit. L'acta1945 afirma30 i parla d'is_active; el codi usa60, deixat_al i reactivat_al. Cal reconciliar eixa afirmació documental amb el resultat.

### G-02 · P1 · Sense resoledor, els hosts aprovats passen igual

**Confiança alta sobre el codi; explotació remota no demostrada.** Amb `resolDns:null`, feed aprovat i imatge aprovada donen 200 i fan fetch; personals/imatges externes sí es tanquen 503. Aprovar el nom no acredita la IP. Per convertir-ho en intrusió real caldria la precondició de DNS/origen aprovat i xarxa accessible; no s'ha provat contra producció.

```js
const gestiona = creaGestor({cataleg,resolDns:null,empremta:async x=>x,
  fetchImpl:async()=>new Response('<rss><channel/></rss>')});
const resposta = await gestiona(new Request('https://audit.example.org/feed?font=ayudawp'));
//200 i una baixada; el destí no s'ha resolt/validat.
```

El cas privada+error antic està corregit i es dona per comprovada eixa part. Queda l'excepció sense DNS i el rebinding entre validació i connexió. La [guia primària OWASP sobre SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) distingix validar DNS de garantir el destí de la connexió.

**Reparació requerida:** fallar tancat sense capacitat de comprovació o acreditar una política d'eixida que impedisca privades/metadades. Les flags externes continuen tancades fins a eixa evidència. Un GET200 del feed **no prova** que el resoledor existisca: el camí sense resoledor també respon 200. Cal un diagnòstic real de capacitat/eixida. És una manca de la garantia T1 ja exigida, no una autorització per desplegar infraestructura.

### G-03 · P2 / CWE-1333 · Parser quadràtic fora del temporitzador

**Confiança alta en Node local; risc de disponibilitat condicionat al contingut d'origen. És heretat, no una regressió introduïda per 472f704d0.** `senseNiats` torna a cercar el tancament des de cada obertura no tancada. `esFeed` admet arrel RSS sense exigir XML complet; sense item, tota la capçalera passa al patró.

Payload: `'<rss><channel>' + '<description>'.repeat(80000) + '</channel></rss>'`.

| Obertures | Bytes | Temps del parser observat |
| --- | --- | --- |
|10.000|130.030|113 ms|
|20.000|260.030|443 ms|
|40.000|520.030|1.777 ms|

Una petició completa al gestor amb80.000 obertures i **1.040.030 B**, dins de2 MiB, torna **HTTP200 en7.080,922 ms**. El temporitzador de6 s s'havia retirat als **12,906 ms**, abans de recordaImatges. El script de prova executà este cas en subprocess amb tall forçós15 s; acabà normalment i no deixà processos vius. No depén d'un mock que ignore AbortSignal: el bloc problemàtic és el parser síncron real del gestor.

Reproducció mínima del camí, exclusivament local:

```sh
node --input-type=module <<'JS'
import {creaGestor,MAXIM_BYTES} from './supabase/functions/noticies/gestor.js';
const xml='<rss><channel>'+'<description>'.repeat(80000)+'</channel></rss>';
let timerClearedAtMs=null;
const start=performance.now();
const handler=creaGestor({cataleg:{categories:[],fonts:[
  {id:'f',feed:'https://ayudawp.com/feed/',lloc:'https://ayudawp.com'}]},
  empremta:async x=>x,fetchImpl:async()=>new Response(xml),
  temporitzador:{posa:(fn,ms)=>setTimeout(fn,ms),lleva:id=>{
    timerClearedAtMs=performance.now()-start;clearTimeout(id);}}});
const response=await handler(new Request('https://audit.example.org/feed?font=f'));
console.log({status:response.status,bytes:Buffer.byteLength(xml),max:MAXIM_BYTES,
  ms:performance.now()-start,timerClearedAtMs});
JS
```

Amb defaults, una persona no pot injectar qualsevol URL: cal contingut malformat/controlat en una font aprovada. Les personals són opt-in i tenen512 KiB, de manera que no s'hi extrapola el cas d'1,04 MB. El parser de sistema es crida encara amb imatgesExternes=false. No s'afirma un DoS públic ni comportament Deno/Supabase mesurat.

La prova existent `gestor.test.js:1308–1316` dona fins a10 s a una mostra distinta i no comprova creixement lineal. **Reparació dins de T1:** reemplaçar el recorregut per un escàner amb treball lineal/fitat i una regressió que distingisca esta entrada. Un AbortController no preempta CPU síncrona; tornar a posar un timer no basta per reparar la complexitat. La lectura independent d'un segon revisor ha confirmat l'admissió i la ruta, inclosa la retirada prèvia del timer.

### RLS, concurrència i precisió temporal

No s'ha identificat un vector concret perquè anon accedisca a les RPC/registre: auth.uid() obligatori, EXECUTE només authenticated, seguidor sense paràmetre triable, RLS/ACL explícites. Lectures pròpies filtren titular i llista d'entitat exigix owner/admin; helpers amb search_path buit i noms qualificats. És inspecció de fonts, no certificació de permisos remots.

La quota usa bé v_ara post-lock. El cooldown encara usa `v_represa > now() - 10 min` i `reactivat_al = now()` (`SQL:355,385`): un instant de transacció anterior a l'espera pot avançar la pròxima represa respecte de l'admissió real. És una deducció pendent de prova PostgreSQL; no evita el ledger horari. Reutilitzar v_ara en eixes dos expressions elimina la discrepància.

### Connectar i plànol T5b

La centralització **sí es complix**: no s'ha trobat cap botó solt de seguir en les fitxes/targetes inspeccionades. El llenguatge encara mostra Seguir/Deixar de seguir dins de Connectar, i llistes de seguiment en perfil propi/administració. Cal alinear-lo amb connectar sense inventar que estes llistes són botons solts.

Gemini ja corregix explícitament T5B-02 per prohibir eixos botons i remetre a Connectar. El plànol encara requerix precisions abans d'implementar: listPublicOrganizations no admet town_name/town_id i talla a500 abans d'un filtre local; itemsPublicatsDe retorna notes amb data.item/data.seccio i la vista espera item/seccio/esdeveniment (hi ha traductor existent publicacionsDeLaSeccio); GestioMembres ja inclou QuiSegueixOrganitzacio, i moure tots dos separats duplicaria la llista. La referència DetallCompte:200–355 és impossible en el fitxer de150 línies; el flux real passa per DetallAjust. PerfilShell munta PaginaDeLAgent i no es generalitza a persona/organització només afegint un menú. Estes reserves són del plànol posterior, no regressions T1–T4.

### Contrast creuat amb Gemini post-commit

S'ha llegit íntegre `261024_1945_auditoria_gemini.md`. Hi ha coincidència independent en quota 30 no assolida, centralització correcta en Connectar i vocabulari pendent. Les mesures ràpides són compatibles: Codex 25,402 s, Gemini 27,6 s; són execucions distintes, no una mitjana ni una garantia universal.

G1945-01 de Gemini precisa un altre camí obert: per a aprovats, A pública + error AAAA (o invers) passa perquè `aprovatVetat` no mira fallades. És una comprovació incompleta i la proposta de fallar tancat és coherent amb T1. No s'ha observat una AAAA privada quan la consulta ha fallat: eixa IP seria una precondició hipotètica del fetch posterior. Això **no desfà** el [FET] específic del nostre cas privada retornada + altra família fallada, que sí queda vetat. El wrapper ja usa [] per NotFound; no cal convertir absència legítima d'AAAA en un error de família.

G1945-03 barreja dos garanties: la primera represa immediata, amb reactivat_al=NULL, **consumeix una admissió del registre** i no evita la quota; una segona represa dins dels10 min queda vetada. El contracte anterior deia una represa per parella cada10 min, i el prompt vigent no afegix una espera de10 min entre l'alta inicial i la primera represa. Per tant no es ratifica eixe cas com un bypass P1 del límit horari. La discrepància now()/v_ara post-lock sí es conserva com a cas temporal a provar. Si es vol una espera també després de l'alta inicial, ha de quedar explícita al criteri executable, sense inventar que hui ja existix.

La MCR de Gemini marca el termini/mida [FET], però la nostra reproducció G-03 demostra un camí de CPU posterior al timer que impedix eixa garantia integral. El seu resultat de lectura de streams és compatible amb el nostre [FET] de mida/AbortSignal cooperatiu. No es declara consens total ni s'edita l'informe alié per imposar-lo.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comanda / superfície | Resultat independent |
| --- | --- |
|`npm run test:precommit`|Codi 0; **25,402 s** de rellotge;151 fitxers/2.927 Vitest i 259 Node, zero fallades.|
|SQL estàtic/client/local: localSeguiments.test.js, seguiments.test.js, seguiments.migracio.test.js|**3 fitxers,56/56**,895 ms; no SQL real.|
|Notes, visibilitat, navegació Connectar i fitxes|**8 fitxers,209/209**,7,47 s,2workers; no navegador real.|
|noticies/gestor.test.js i paritat.test.js|**2 fitxers,152/152**,3,61 s,config temporal sense .env.|
|Casos locals nous de xarxa|Nou grups d'asserts:ports18,DNS privat+error 6,DNS buit 2,absència DNS,revalidació entre salts,mida 3,flux lent cooperatiu i límits de mocks. Parser aïllat amb tall15 s.|

Les bateries se solapen i **no se sumen**. No s'ha reexecutat la suite global: les 21.808 del prompt són evidència atribuïda a Claude/MarIA. La mesura ràpida acredita el llindar60 s en este entorn, no el conjunt de portes del hook ni tots els estats possibles de càrrega. El pas del hook té timeout120 s (`git-staged.mjs:11`), i la suiteUI/T3 queda fora de l'include ràpid: s'ha verificat separadament.

Les18 rutes de producte coincideixen amb el commit en el preflight (`git diff 472f704d0 -- src supabase tooling package.json vitest.precommit.config.js` buit). SHA-256:

- gestor.js: `9374ff05fa577349c49c5761f67698a4724305f4c7fb9f2f0066dc8de3b625c5`.
- SQL seguiments: `c5c13e5413b44144f430fcd1be503f27e7ec8625f87259a418a042ba617f864e`.
- localSeguiments.js: `df74a3236580dc1c3b7c6dc7857f43776cc4ec7549a595ad346c0c1c6d80c90f`.

Canvis documentals/de governança previs i avatars sense seguiment preservats.

**Tancament documental executat:** `document.mjs check` de l'informe passa amb codi 0; `git diff --check` també. `tancament.mjs --check --turn-id torn_87cf11b4-29f5-4e9f-aac2-7ab291c1d1b1` ix 1, estat planned, amb 1.297 registres: 1.026 LINK_INVALID, 242 ESCRIPTORI_UNANCHORED, 22 ORPHAN_OPERATIVE, error de Wiki, signatura LEDGER, quatre incidències heretades de metadades/rebut del Llibre Mestre i absència del relleu d'este torn al LEDGER. Olivera, plantilles, autoritat, segell i skills passen. No és un recompte de vulnerabilitats noves. No s'ha resegellat ni reescrit el LEDGER per fabricar verd; la comprovació contra l'inventari inicial confirma que Codex no l'ha canviat. El torn no es declara tancat mecànicament.

**Recomprovació directa de Codex:** A pública+AAAA error dona 200/fetch1; A privada+AAAA error dona 422/fetch0. La 31a admissió per represa retorna seguint:true, primer:false. El primer cas reforça el límit de verificació DNS incompleta; el segon certifica la correcció de la privada retornada.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Codex no ha modificat codi, tests, SQL, secrets, comptes, commits ni desplegaments. Informe, índex, Llibre Mestre, relleu d'estat i rebuts són l'abast d'escriptura. Les proves de xarxa utilitzen DNS/fetch injectats, sense peticions a privades/metadades reals.

No hi ha psql/postgres/initdb disponible ni daemon Docker operatiu en la inspecció. No s'han instal·lat dependències ni usat credencials remotes per fabricar execució de RLS/concurrència. No s'han verificat Deno/Supabase ni egrés real. Les esperes de mocks que ignoren AbortSignal són límits del contracte injectat, no vulnerabilitats Deno demostrades.

No s'ha creat cron ni vigilància recurrent. Els processos puntuals propis han acabat. Les cinc automacions Codex locals estan PAUSED i la guarda consta inactiva/finalitzada; no hi ha cap recurs recurrent propi per cancel·lar. No s’afirma absència universal de crons del sistema operatiu. El dictamen queda per a l’Acta Marmota conjunta de MarIA, sense crear una altra acta fora de l’eixida sol·licitada. No s'atura infraestructura compartida de producció. Cap resultat d'una altra IA substituïx la comprovació de codi; l’informe post-commit de Gemini s’ha llegit i contrastat, amb les precisions de més avall. E2EE és fase següent i no s'implementa ací.

**Millora del prompt:** declarar quota vigent versionada i prova 31a rebutjada; usar noms reals (no is_active); separar conformitat de codi, runtime i desplegament; separar accions disperses de la migració del vocabulari connectar. No usar GET200 com a prova de DNS disponible. Els [NO FET]/[PARCIAL] d'esta MCR han de passar al següent pla de reparació, i els [FET] no es reobrin sense canvi nou.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1945_prompt_codex_gemini_gauntlet_loop_revisio_adversarial_postcommit]]
- [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_auditoria_claude]]
- [[261024_1800_auditoria_codex]]
- [[261024_1800_auditoria_gemini]]
