---
type: informe
status: actiu
description: Revisio independent de sessio i publicacio, amb avaluacio creuada de les troballes ultracode.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f182fbfd-8f40-4665-b5d4-43f527d877ae:2c2240f0-af33-4ef3-b614-7b38bdd906ba
---
# Auditoria complementaria de seguretat i contrast amb ultracode

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f182fbfd-8f40-4665-b5d4-43f527d877ae:2c2240f0-af33-4ef3-b614-7b38bdd906ba |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T02:37:23.568Z |
| Modificació | 2026-09-24T04:50:58.395731+02:00 |
| Propietari | codex |
| Aprovació humana | Text adjunt rebut: auditoria i espera ultracode, sense implementar |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats: no disponibles. Estimats: no calculats. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-24T02:37:23.568Z: esborrany creat. 04:39: C14 reproduïda i proves seleccionades executades; espera ultracode activa al tall inicial; entrega completa llegida i contrastada posteriorment.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### C14 · P1 · Reintent 401 amb canvi d’actor després de renovar

**Font:** `src/data/supabase/runtime.js`, línies 47–70, especialment 69–70; renovació real de `src/data/supabase/auth.js`. Contradiu la invalidació del treball antic que establixen C01–C03 del pla.

La funció request compara versioSessio abans d’await refresca(config), però no després. El reintent recursiu reconstruïx Authorization a partir de la sessió actual. He reproduït amb els mòduls reals esta seqüència: POST d’A → 401 → renovació correcta d’A → canvi a B en una microtasca d’auth-change → mateix POST d’A amb Bearer de B.

Resultat de la sonda: primera petició amb `Bearer synthetic-A`, renovació amb refresh sintètic A, tercera petició amb `Bearer synthetic-B` i el mateix cos `synthetic-consent-A`. Usuari final B. La sonda substituïx fetch completament; no s’ha contactat cap servidor ni escrit cap dada real. La intercalació està programada deliberadament: no mesura freqüència d’explotació en navegador.

**Impacte:** una acció originada en A pot atribuir-se a B. La funció registra_consentiment de `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql`, línies 23–35, usa auth.uid() per inserir i actualitzar el perfil. RLS pot funcionar correctament i igualment permetre l’acció perquè el client envia un token vàlid de B. No és un bypass RLS demostrat ni una escriptura remota acreditada.

**Proposta:** separar generació d’autenticació de rotació de tokens, o retornar un rebut intern de renovació amb actor/origen/versió resultant i validar-lo abans de reintentar. Comparar només l’epoch inicial després d’await no és prou: la renovació legítima també l’incrementa. Mantindre el límit d’un reintent. Proves d’eixida: A→refresh→A reintenta una vegada; A→refresh→B, A→logout i A→logout→A cancel·len el treball antic. `requires_human_decision: false` per al diagnòstic; implementació pendent del consens del prompt.

Proves addicionals de la mateixa sonda: sense canvi d’actor reintenta correctament amb A-renovat; si només es fa logout, encara envia el POST amb la clau anònima; si es fa logout i torna A, usa les noves credencials per a l’acció antiga. Per tant, comparar només user.id tampoc resol la invalidació d’intents. La simulació confirma enviament, no acceptació del servidor per a la clau anònima.

### Confirmacions de la fortificació

Les proves seleccionades passen per a OAuth tardà, invalidació de Perfil/Xat, exportació privada i symlinks, i modes mutadors disfressats de lectura. Les proves d’auth simulen runtime: no cobrixen juntes la seqüència C14. Cap verd parcial equival a seguretat integral.

El pla compartit conté una proclamació antiga de «tot el deute eixugat», rectificada pel tall Codex 0420. La rectificació és coherent amb Doctrina roja (155 referències) i staging pendent. No cal repetir l’escombratge complet per afirmar que encara no hi ha verd global.

### Contrast complet amb ultracode · entrega llegida i avaluada

Llegit íntegrament [[260924_0435_auditoria_ultracode]], de 534 línies. SHA-256 del contingut contrastat: **0c9c5eb33f1e6c01e56f0e9de19322e3e024f24e234c964188f4aa82cc568cd3**. La publicació completa substituïx l’esborrany buit observat al principi. El torn administratiu de Claude continua obert segons el seu informe; això no impedix avaluar l’entrega ja redactada i validada, ni m’autoritza a tancar el torn d’un altre agent.

**Cautela de procedència:** el registre d’ultracode fixa 02:18–02:35 UTC però cita segones comprovacions a02:52UTC; el meu rellotge local encara marcava04:47CEST quan llegia eixes afirmacions. No utilitze eixos horaris per certificar cronologia, duració, quotes ni execucions alienes. Les conclusions següents es basen en codi i comprovacions pròpies.

| Referència | Avaluació independent i decisió proposada |
| --- | --- |
| U01 · eines bloquejades | Confirmat al codi: knownRead no admet ToolSearch/Agent/Workflow. És disponibilitat de l’auditor, no una vulnerabilitat P0 de producte demostrada. Consideraria P1 operativa. Admissió de ToolSearch només amb nom/esquema exacte revisat i test del hook posterior. No admetre comodins mcp__ccd_view__*; tampoc classificar mark_chapter com a lectura només pel nom: pot escriure estat de sessió. Agent/Workflow requerixen abast i controls específics. |
| U02 · validació tardana | Diagnòstic de frontera parcialment correcte; rebut no és conformitat. **Rebutge la garantia proposada:** PostToolUse arriba després de l’escriptura i no la desfà. A més, un check final immediat faria fallar tots els drafts legítims que create emet amb placeholders. Cal distingir draft de document lliurable i validar el candidat abans de promocionar-lo amb CAS. |
| U17 · cadena curta | Confirmat l’aturada per defecte. Però existix --diagnostic i continua després de fallades dels passos readOnly; hui en cobrix només cinc. No són59portes invàlides ni totes les proves independents són silenci. Mantindre la cadena que falla tancada i ampliar diagnòstic només a ordres revisades. |
| U03 · controls blaus | Control normal verificat en navegador: fons rgb(0,73,131), tinta blanca. Coincidisc a conservar el blau de marca i revisar superfícies de text actives. **Font dels tokens trobada:** src/config/design-tokens.json. **btn-publish sense consumidors en src:** només declaracions CSS; no comptar-lo com incidència visual activa. Les set superfícies barregen ús real, regles mortes i risc latent. |
| U04 · salt invisible | **Confirmat en navegador amb focus real:** enllaç actiu de1×1px, clip rect(0px,0px,0px,0px). Corregir focus-visible i comprovar navegació al main. |
| U05 · enllaços | El problema de color únic és coherent amb el CSS. Amb el text i fons que calcula, cal pista no cromàtica. Subratllar la prosa és una bona proposta, però no és l’única tècnica possible ni convé aplicar-ho cegament a tots els enllaços que són controls. W3C també cita la negreta com a pista alternativa. |
| U06 · data | **Confirmat en navegador en tema clar:** blanc,14px, fons rgba(0,0,0,.15) sobre barra rgb(255,115,0). Sosté el contrast insuficient descrit. Proposta sobre-accent coherent; repetir normal/hover/disabled en clar i fosc. No he canviat la preferència de tema ni certificat el fosc visualment. |
| U07 · badge | Confirmada estàticament la segona regla genèrica després dels modificadors, mateixa especificitat. Corregir l’ordre o consolidar base/modificadors; revisar consumidors i mida abans d’esborrar el bloc complet. No totes les combinacions d’altres selectors queden provades amb esta lectura. |
| U08 · CONNECTAR + | **Confirmat en navegador a460px CSS:** text CONNECTAR visible, span plus amagat i pseudo-element after amb +. També ocorre en el botó de pàgina sense spans. La reparació ha de cobrir UniversalCard i UniversalPage/Editor: llevar el pseudo i ampliar un span només no arregla totes les variants. |
| U09 · Markdown | Reproduïts errors de negreta, tanques de codi i callout amb espai amb la funció real extreta, sense editar-la. Ampliació C15 davall: una taula de dos columnes perd tota la capçalera. No basta canviar .* per .*?: cal protegir blocs de codi abans de formats en línia, preservar sagnia i conservar sanejament final. |
| U10 · headings | Confirmada la baixada semàntica amb classes visuals; coincidisc que no cal una nova decisió de mida. Les84comparacions CSS són evidència de0420, no meues. |
| U10b · ISO/callouts | Classes note/warning/caution sense declaracions CSS en la cerca completa de src. Separar estil ISO de bug de callouts. El quadre té també el defecte funcional C15 de capçalera; no és només una qüestió d’identitat gràfica. |
| U11 · menú | **Confirmat en navegador:** calaix visible després d’obrir-lo, però mobile-logo-wrapper manté aria-expanded=false. Vincular a l’estat real i provar obert/tancat. |
| U12 · recàrrega | Confirmats reload global i debounce800ms del rich text. GlobalSaveManager persistix a IndexedDB quan rep enqueue, però això no demostra que el contingut pendent al debounce ja haja arribat. Risc concret en eixa finestra; no he provocat pèrdua de cap esborrany real. Desactivar el gest en controls/editors i mentre hi haja canvis pendents; no confiar en un flush asíncron durant unload. |
| U13 · vh | Les dues regles existixen. La conseqüència exacta requerix dispositiu/navegador amb barra dinàmica; no la convertisc en una pèrdua d’accés universal demostrada. Proposar dvh amb proves del contenidor i scroll, evitant conservar el200px màgic sense justificació. |
| U14 · SEO | **Confirmat el TypeError amb el mòdul useSEO real i dependències simulades:** canonical sense esquema falla; origen HTTPS correcte passa. RouteSEO està fora del boundary de ruta. Validar protocol/origen i tractar SEO com a fallada no fatal; moure’l al mateix boundary protegix l’arrel però encara pot substituir el contingut per l’error de ruta. **Descartat el dubte resolveAsset:** és una funció importada estable i actionsValue usa useMemo. |
| U15 · JSON-LD | Millora editorial, no vulnerabilitat demostrada. El generador SEO ja usa publicSeoRoute en llistes i detalls; les proves d’exportació passen. noindex no autoritza ni protegix dades. No es deduïx una fuga al sitemap només de useSEO; provar l’artefacte del consumidor. |
| U16 · calendari | Inventari útil de rangs i primitives, però incomplet per a implementar: falta el contracte persistent publication_date, migració compatible i mapeig de Notes, ja advertits en0420. Un giny i una prop no acrediten desat/recarrega. Mantindre Agenda en quarantena i no prometre calendari persistent fins a resoldre eixe contracte. |
| U18 · output | Confirmat el desajust entre skill i flags autoritzats. Llevar --output de l’exemple o autoritzar una destinació temporal exacta amb validació física; no obrir output arbitrari. Correcció documental recomanada, sense reescriure-la en este torn. |
| U19 · touch | Dos tokens iguals són risc de divergència, no bug actual acreditat. Proposar un alias o una comprovació d’igualtat; no inflar-lo a incidència funcional. |
| U20 · DS_Store | Cosmètic i exclòs expressament del segell. No cal esborrar-lo per reparar seguretat; respectar l’abast. |
| U21 · CSS mort | Hi ha sobreescriptures, però no tot el bloc és mort: U08 demostra que ::after sí s’aplica. Inventari per propietat/consumidor abans de llevar regles. |

#### Esmena de seguretat a U02: validar abans de promocionar

La documentació oficial de Claude Code confirma que PostToolUse s’executa quan l’eina ja ha acabat; un error posterior no desfa els fitxers escrits. Pot donar feedback i impedir que el torn es done per bo, però no garantix zero escriptures invàlides. [Referència oficial dels hooks](https://code.claude.com/docs/en/hooks#posttooluse).

La proposta «blocsFixos maximalista» tampoc hauria evitat tags invàlids, falta de rebut o falta d’àncora: són validacions diferents. Fixar literalment Tasques/Riscos impediria personalitzar-les. Millora acordable: seccions estructurals obligatòries, contracte per secció quan siga necessari i blocs literals només per doctrina invariable. Una CLI fill pot reduir errors, però ha de validar el document resultant complet, rebutjar claus desconegudes i comprovar hash previ per no perdre canvis concurrents.

Flux recomanat: create genera draft ancorat; fill/edició prepara candidat; check valida contracte complet; promoció atòmica amb CAS; PostToolUse informa i porta final impedix lliurament invàlid. Les proves han de cobrir candidat invàlid sense modificar el document acceptat, esborrany legítim, àncora absent, rebut equivocat i dos editors concurrents.

Per als enllaços U05, la pista visual s’ha d’aplicar a enllaços dins de prosa, amb tokens i focus verificats; el subratllat és la proposta més simple, no l’única solució conforme. [W3C, tècnica G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183).

### C15 · P2 · El parser elimina la capçalera de les taules

Ampliació reproduïda d’U09/U10b, a `src/sections/wiki-de-poble/WikiDePobleSection.jsx`, construcció de thead: la captura head ja exclou les barres exteriors, però després fa split i slice(1,-1). Una taula amb `| Camp | Valor |` acaba en `<thead><tr></tr></thead>`, mentre el tbody conserva dues cel·les. En més columnes lleva la primera i l’última. És pèrdua de contingut/semàntica, no sols falta de pell ISO.

Proposta conservadora: alinear el tractament de capçalera amb els límits reals de la captura i afegir fixtures de1,2i3columnes, buides i alineació; comprovar sanejament i nombre de th/td. `requires_human_decision: false` per al diagnòstic, codi encara pendent de consens. Reproducció usada: extraure exactament la funció parseMarkdown abans de formatDate i invocar-la amb una taula mínima; sense mutar fonts. Resultats addicionals: negreta múltiple genera em imprevist; un heading dins de tanca de codi es transforma en h2; callout amb espai cau en blockquote.

### Prioritat proposta al pla

1. C14: evitar accions amb actor equivocat i afegir regressions conjuntes.
2. U14 i U04/U11: error SEO no fatal i accessibilitat de focus/estat.
3. U06/U03/U08/U07: reparacions visuals amb mesures i consens de la pissarra; cap canvi de color aplicat en esta auditoria.
4. C15/U09, U12 i contracte de data d’U16: preservar contingut, esborranys i persistència real.
5. U01/U02/U17/U18: millorar el circuit mantenint denegació per defecte i distingint drafts de documents acceptats. No ampliar permisos per comodí ni usar post-hooks com a transaccions.

### Millores de la plantilla

- Definir finalització per contingut complet, verificació i hash de l’entrega; la mera existència del fitxer no basta.
- Unificar auditoria_codex/claude i posar ultracode/astra_alto en Propietari; el prompt dona dos patrons incompatibles.
- Separar ordre actual i antecedent citat: la nota de procedència d’una altra conversa no activa aquella implementació en esta.
- Separar proves locals, RLS estàtica i staging real; exigir proves conjuntes de refresh, request i canvi d’actor.
- Mantindre «variant no exposada» i «mesurats no disponibles» quan l’entorn no aporta telemetria.

### Tall i abast

HEAD `e2179043f607f71252e056fdf2ce52395db4b99a`, worktree compartit amb canvis previs, 2026-09-24 04:40 CEST. Llegits AGENTS, genotip, índex, arrencada, ESTAT actual, skills workflow/documentació, protocol, plantilla prompt_local completa i plantilla auditoria entregada pel circuit documental. Nom auditoria_codex segons la norma final del prompt. No s’ha modificat codi ni normes de la Wiki.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Contrast posterior: navegador real a1280px i460px CSS, sense escriptures de dades, viewport restaurat i pestanya temporal tancada. Confirmats U04/U06/U08/U11. Sondes de parser i useSEO detallades damunt. No són nous tests del repositori: s’han executat en memòria.

| Comprovació nova | Resultat |
| --- | --- |
| node --test tests/public_exports.test.mjs tests/dist-secrets.test.mjs tests/tractor-fortification.test.mjs tests/document-command-policy.test.mjs | 27/27 passen |
| npx vitest run src/data/oauthRelay.test.js src/data/supabase/auth.test.js src/data/supabase/xat.test.js src/sections/xat/XatContext.test.jsx src/sections/profile/PerfilContext.test.jsx --maxWorkers=2 | 44/44, 5 fitxers, 4,05 s |
| Sonda C14 amb codi real i fetch simulat | Canvi d’actor A→B confirmat |
| node tooling/gates/tractor-rls.mjs | Exit 0; 18 SQL, anàlisi estàtica |
| node tooling/gates/tractor-doctrina.mjs | Exit 1; 155 referències no resoltes |

227 Node i 187 React són totals de l’informe 0420, no mesures noves d’este torn. No s’ha repetit el build global ni canviat cap baseline.

Reproducció C14: executar des de l’arrel amb `node --input-type=module` el bloc següent. Tot el trànsit usa fetch simulat i tokens sintètics.

```js
import { JSDOM } from 'jsdom';
const dom = new JSDOM('', {url:'https://app.example.test'});
globalThis.window=dom.window;
globalThis.document=dom.window.document;
globalThis.CustomEvent=dom.window.CustomEvent;
const identity = await import('./src/data/identitat.js');
const {request}=await import('./src/data/supabase/runtime.js');
await import('./src/data/supabase/auth.js');
const calls=[]; let switched=false;
identity.desaSessio({access_token:'synthetic-A',refresh_token:'synthetic-refresh-A',user:{id:'A'}});
window.addEventListener('sdp:auth-change',()=>{
 if (!switched && identity.usuariDeSessio()?.id==='A') {
  switched=true;
  queueMicrotask(()=>{
   identity.esborraSessio();
   identity.desaSessio({access_token:'synthetic-B',refresh_token:'synthetic-refresh-B',user:{id:'B'}});
   window.dispatchEvent(new CustomEvent('sdp:auth-change'));
  });
 }
});
globalThis.fetch=async (url, options)=>{
 calls.push({path:new URL(url).pathname,actor:options.headers.Authorization,body:options.body});
 if(url.includes('grant_type=refresh_token')) return new Response(JSON.stringify({access_token:'synthetic-A-renewed',refresh_token:'synthetic-refresh-A2',user:{id:'A'}}),{status:200});
 if(calls.length===1) return new Response('expired',{status:401});
 return new Response(JSON.stringify({ok:true}),{status:200});
};
await request('/rest/v1/rpc/registra_consentiment',{supabaseUrl:'https://api.example.test',supabaseAnonKey:'sb_publishable_synthetic'},{method:'POST',body:{p_tipus:'synthetic-consent-A',p_versio:'synthetic'}});
console.log(JSON.stringify({calls,currentUser:identity.usuariDeSessio()?.id},null,2));
dom.window.close();
```


<!-- SDP:SECTION auditoria.s6 -->
## Límits

**Últim tall de tancament:** després de completar la rèplica ha aparegut [[260924_0445_pla_implementacio_olivera]], sense rebut ni àncora. L’he llegit i hi he afegit les esmenes anteriors, especialment U02, aria-expanded i persistència del calendari. tancament --check torna valid:false/state:planned, amb errors documentals i SCC d’eixe pla. No el done per regularitzat ni tanque administrativament el torn. L’auditoria requerida està entregada i la dependència ultracode satisfeta.

Auditoria entregada després del contrast complet amb ultracode; consens d’implementació no presumit. Cap codi de producte, SQL, secret, dada remota, deploy o commit modificat. No es reivindiquen canvis previs o concurrents. No s’ha provat staging. La validació de l’auditoria passa. El primer tancament check passava, però el final falla pel pla concurrent0445 sense rebut ni àncora; no equival a cadena global verda. Acta Marmota global pendent al final de conversa.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260924_0245_pla_implementacio_fortificacio]]
- [[260924_0420_auditoria_codex]]
- [[260924_0435_auditoria_ultracode]]
