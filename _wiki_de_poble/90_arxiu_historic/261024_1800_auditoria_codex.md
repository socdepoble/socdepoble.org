---
type: informe
status: esborrany
description: Revisió adversarial de la xarxa del Lector i dels seguiments amb proves locals, contrast de permisos i límits verificables
tags:
  - auditoria
visibility: private
reflex: sdp:torn_7b14119b-d6d2-474c-8f3b-0f2c812786c2:72fb98f4-d043-4162-8864-5f2c13832beb
---
# Auditoria Codex · Anti-SSRF, quota SQL i aïllament RLS

**T1 encara sense vistiplau; T2 corregida en codi i provada localment, pendent d'execució PostgreSQL.** Després del tall inicial `fe14e1756`, els pegats resolen **C6-01 (quota) i C6-03 (port)**; **C6-02 continua parcial, amb bypass privada+error reproduït**. La branca és `backup-notes-publish`. Esta és l'auditoria T6 de Codex; T1–T4 corresponen a Claude i T5 a Gemini. No s'atribuïx consens sense evidència al disc.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7b14119b-d6d2-474c-8f3b-0f2c812786c2:72fb98f4-d043-4162-8864-5f2c13832beb |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T16:06:35.991Z |
| Modificació | 2026-10-24T16:21:10.997Z |
| Propietari | Codex |
| Aprovació humana | Auditoria autoritzada pel prompt del Mestre 261024_1800; no autoritza desplegaments |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, entorn local; identificador exacte del model no exposat |
| Tokens consumits | No disponibles com a mesura verificable de la sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-24T16:06:35.991Z: esborrany creat amb la plantilla viva i el rebut del torn.

2026-10-24: inspecció adversarial paral·lela de xarxa, quota/RLS i client; reproduccions locals sense xarxa real. Refutació de diagnòstics històrics ja superats, criteris de reparació per a Claude i Llibre Mestre actualitzats. Tancament executat, amb límits documentals registrats més avall.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### C6-01 · P2 · Quota per parelles · Corregida en codi, SQL real pendent

**Reauditoria T2:** el SQL nou crea `private.seguiments_altes` (només seguidor i instant), activa RLS i revoca tots els permisos de client i `service_role`. La baixa de la relació/destinatari/poble no hi té cap FK; només la supressió del mateix usuari seguix `auth.users ON DELETE CASCADE`. `segueix` compta i anota l'admissió sota el mateix pany, després dels retorns idempotents i de l'espera, i abans de modificar la relació: una fallada desfà també l'anotació. Açò corregeix per inspecció l'expressió SQL original. La paritat local també està corregida: el PoC de 118 intents dona **60 acceptats i 58 rebutjats**; el de 413 intents en 50 minuts, **60 acceptats i 353 rebutjats**. En tots dos, la 61a admissió topa amb `SDP-SEG-006`. La bateria final és **55/55**. Cap execució PostgreSQL/concurrència real acreditada; no es presenta el bypass local antic com a vigent.

**Evidència històrica del tall inicial:**

**Abast:** `supabase/migrations/2610241430_seguiments.sql:302–323`. `v_hora` compta files que tenen una data recent; una parella només pesa una unitat encara que s'haja reactivat més d'una vegada. `reactivat_al` sobreescriu la data anterior. La baixa tova ha reparat el bypass històric per DELETE, però no conserva l'historial d'altes.

**Reproducció:** crear 59 parelles distintes; deixar i reprendre la primera i la segona immediatament. Les dues represes passen perquè `v_represa` encara és NULL i `v_hora` continua en 59: 61 altes/represes en menys d'una hora. En l'adaptador local real (`src/data/localSeguiments.js:120–125`, que declara paritat amb SQL a les línies 5–8), una represa per parella dona **118 transicions al mateix instant**. Una segona prova del mateix adaptador dona **413 altes/represes en 50 minuts**, respectant els 10 minuts entre represes. El pany per seguidor no ho impedix: la seqüència és serial. No és una execució en PostgreSQL.

**Impacte i refutació:** incompleix T2. El client honest només avisa quan `primer` és cert; este cas no demostra 61 notificacions. No repetim l'afirmació antiga que deixar de seguir elimina la fila: ara la marca amb `deixat_al`.

**Proposta per a Claude:** historial privat d'admissions, una fila immutable per alta o represa acceptada, desvinculada de l'esborrat de la relació. Una baixa del destinatari o del poble tampoc no ha de llevar esdeveniments encara computables mitjançant una FK amb `ON DELETE CASCADE`. Comprovar quota i escriure esdeveniment dins del mateix pany/transacció; tornar a seguir una fila ja viva és idempotent i no genera avís. Actualitzar també `localSeguiments.js` i la prova del cicle, perquè ara les proves de migració fixen l'expressió vulnerable. Provar hora lliscant, represa, baixa i concurrència en PostgreSQL real. `requires_human_decision: false` per a la correcció dins de T2.

### C6-02 · P1 · Les fonts i imatges de hosts aprovats ometen el filtre DNS

**Reauditoria del pegat concurrent:** ja no omet totes les consultes. El cas de privada amb les dues consultes DNS acabades és ara **422**, dos resolucions i zero fetch. Tanmateix, `gestor.js:937–958` usa `Promise.all(A, AAAA)`: si una família retorna privada i l'altra llança, `xarxaDe` torna `desconeguda` i `aprovatVetat` la deixa passar. PoC executat: **A→127.0.0.1 + AAAA→SERVFAIL = 200, DNS2 i fetch1**; també **AAAA→::1 + A→SERVFAIL = 200**. L'absència de resoledor o de resposta continua explícitament oberta per als aprovats. T1 no queda tancada, i el test nou de «disponibilitat» fixa precisament eixa excepció. Cal conservar qualsevol resposta privada i rebutjar resolució desconeguda abans de connectar.

**Evidència històrica del tall inicial, superada parcialment pel pegat:**

**Abast:** `supabase/functions/noticies/gestor.js:859–864,919–930,944–948,1122`. Els feeds de sistema criden `baixa()` sense regles; les imatges de hosts aprovats tornen abans de `xarxaDe()`. Aprovar un nom no acredita que la IP de destí siga pública.

**Reproducció injectable:** configurar `resolDns` perquè torne `127.0.0.1` i demanar el feed d'AyudaWP: el gestor respon 200 amb el fetch simulat i fa zero consultes DNS. Repetir amb una imatge d'AyudaWP i DNS `10.0.0.1`: mateix resultat. No s'ha contactat amb cap IP privada real.

**Impacte i límit:** falta el bloqueig de resolució privada exigit per T1. Per convertir-ho en una intrusió real caldria controlar o comprometre el nom aprovat, el seu DNS o la infraestructura pertinent; este test no demostra eixa precondició en producció. Les personals i imatges externes sí fallen tancades sense DNS i estan apagades per defecte.

**Proposta per a Claude:** aplicar a tots els salts la comprovació de destinació i A/AAAA públiques, també a fonts i CDN aprovats. Per a rebinding, cal lligar la connexió a la IP validada amb Host/SNI correctes o acreditar eixida de xarxa que bloquege privades i metadades. Fer un `resolveDns` i després un `fetch(host)` independent no acredita eixa garantia. Esta distinció seguix la [guia primària OWASP sobre SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html). `requires_human_decision: false` per al filtre dins de T1; l'operació d'infraestructura requerix la seua autoritat corresponent.

### C6-03 · P2 · Canvi de port en redirecció · Corregida en el pegat

**Reauditoria:** el gestor ja exigix `seguent.port === ''` en cada salt. El PoC a 8443 ara dona **502** i només fa el primer fetch; hi ha regressió específica també per al port444. La troballa original següent es conserva com a evidència històrica i ja no és bloquejant al tall del pegat.

**Abast:** `supabase/functions/noticies/gestor.js:919–922,961–977`. La branca sense regles compara protocol, hostname i credencials, però no el port.

**Reproducció:** un fetch simulat del feed retorna `302 Location: https://ayudawp.com:8443/servei-intern`; el gestor fa el segon fetch i retorna 200. Només dos salts permesos i hostname fix no restringixen el port a 443. No permet canviar arbitràriament de hostname; una redirecció maliciosa del host aprovat és precondició.

**Proposta per a Claude:** comparar l'origen efectiu autoritzat o aplicar la regla de port buit/443 a tots els salts. Afegir regressió per a ports 8443/444, esquemes aliens, credencials i canvis de host. `requires_human_decision: false`.

### Contracte del catàleg

Hi ha **sis fonts i cinc hosts**: `emowe.com`, `ayudawp.com`, `iaenaccion.com`, `www.jonhernandez.education` i `www.youtube.com`. El prompt enumera `youtube.com`/`youtu.be` i omet Jon Hernández, encara que la §23 i `fonts.json` el recullen. El pegat ja els fixa en `HOSTS_DEL_SISTEMA` i valida feed/lloc, amb noms exactes i sense ports no estàndard. Conserva els sis referents i no amplia a subdominis per extensió. La llista de CDN és una superfície d'eixida addicional que també necessita el filtre DNS.

### RLS i aïllament de sessió · Cap bypass entre usuaris demostrat

La taula `seguiments` activa RLS, revoca permisos de client i només concedix accés directe a `service_role` (`2610241430_seguiments.sql:150–156`). Les cinc RPC extrauen `auth.uid()` i les escriptures filtren per eixe seguidor; `qui_em_segueix` limita la persona a qui crida i exigix administració per a l'entitat (`:437–473`). Els tres helpers nous tenen EXECUTE revocat; les funcions usen noms qualificats i `search_path` buit. Són controls coherents per inspecció. Una funció `SECURITY DEFINER` executa amb els permisos del propietari; el buit del search_path no substituïx els filtres de files. Font primària: [funcions de PostgreSQL en Supabase](https://supabase.com/docs/guides/database/functions).

El pany transaccional per seguidor a `:292` protegix l'ordre de lectura/comprovació/alta. El defecte C6-01 persistix encara que eixa exclusió mútua funcione perfectament. No s'ha reproduït cap carrera SQL real; el comportament de snapshots depén del nivell d'aïllament. La prova d'integració haurà d'acreditar el nivell efectiu i el límit amb peticions simultànies; referència: [aïllament transaccional PostgreSQL](https://www.postgresql.org/docs/16/transaction-iso.html).

`src/data/supabase/seguiments.js:107–109` només torna `primer: true` si el servidor ho confirma, i les represes tornen fals. Les funcions de xat capturen sessió i llinatge; no s'ha demostrat que una resposta tardana puga enviar amb el compte següent. Les proves de sessió usen dobles de xarxa, amb el límit d'evidència corresponent.

**Garantia de notificacions:** `useSeguiment.js:146–158` envia després de la RPC un missatge ordinari de xat via `missatgeAlXat.js:68–70`; no hi ha una admissió/entrega transaccional identificada en SQL. El límit ordinari del xat és 15 missatges/5 s (`2609080200_xat_v2_correccions.sql:387–416`), no una quota de notificacions de seguiment de 60/h. Açò no demostra un bypass per missatgeria ordinària: indica que una promesa absoluta d'entrega/idempotència requerix un esdeveniment identificable i un consumidor amb idempotència al servidor. Cal definir i provar eixa garantia abans de declarar-la assolida.

**Observació secundària limitada:** la branca d'entitat de `segueix` (`:270–279`) no comprova `baixa_demanada_at` del perfil seguidor, mentre `seguiment_viu` sí ho fa (`:232`). Amb un token encara vigent podria admetre una fila que la lectura amaga. No és una fuga entre usuaris ni un exploit remot acreditat; revisar-ho amb la prova SQL de baixa i no donar-li categoria de bloqueig independent sense eixa validació.

**Retenció del nou comptador T2:** la capçalera diu que el registre no es guarda més enllà d'una hora, però una purga horària pot conservar un esdeveniment quasi dos hores; sense `pg_cron` i sense cap altra alta del mateix usuari, no hi ha caducitat física. El filtre `al > now() - interval '1 hour'` sí exclou els vells de la quota. Cal descriure fidelment esta poda diferida o acreditar el consumidor que faça efectiva la retenció promesa; la quota i la retenció són garanties distintes.

**Cas pendent de PostgreSQL per a la finestra temporal:** `now()` i el DEFAULT de `al` són l'inici de transacció, anterior a una eventual espera del pany. Provar la frontera d'hora amb una crida que espere abans d'admetre: si la garantia es mesura sobre l'instant d'admissió, convé capturar una sola vegada `clock_timestamp()` després del pany i usar eixe instant en poda, recompte i inserció. És una precaució derivada de la [semàntica temporal de PostgreSQL](https://www.postgresql.org/docs/17/functions-datetime.html), no una carrera remota reproduïda ni un bypass nou acreditat.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Xarxa existent:** `npx vitest run supabase/functions/noticies/gestor.test.js supabase/functions/noticies/paritat.test.js`: 2 fitxers, **108/108**, 3,03 s. El verd no refuta les tres reproduccions adversarials anteriors, absents d'esta suite.

**Preflight:** HEAD i branca concorden amb el prompt; arbre de producte inicial net. Pla i prompt vius llegits; cap auditoria del torn de Claude/Gemini present en la primera passada. Porta Olivera inicial: codi 0.

| Superfície | Comanda | Resultat |
| --- | --- | --- |
| SQL estàtic, client de seguiments i adaptador local | `npx vitest run src/data/supabase/seguiments.migracio.test.js src/data/supabase/seguiments.test.js src/data/localSeguiments.test.js` | 3 fitxers, 49/49, 1,08 s |
| Client, sessions i UI de relacions | `npx vitest run src/data/supabase/seguiments.test.js src/data/supabase/sessionIsolation.test.js src/sections/connectar/ConnectarSection.relacions.test.jsx --maxWorkers=2` | 3 fitxers, 75/75, 4,70 s |

Les bateries SQL/client se solapen; no se sumen. La bateria global de 21.756 proves del prompt és històrica i no s'ha tornat a executar per a una auditoria documental. Cap canvi en codi que exigisca repetir-la.

### PoC reproduïble C6-01 · Codi real local, rellotge fix

Des de l'arrel `socdepoble.org`, sense escriure fitxers ni contactar xarxa:

```sh
node --input-type=module <<'JS'
import { createLocalSeguimentsAdapter } from './src/data/localSeguiments.js';
const persones = Array.from({ length: 59 }, (_, i) => ({ id: `p${i}`, nom: `Persona ${i}` }));
const local = createLocalSeguimentsAdapter({
  persones, perfils: { getProfile: u => ({ full_name: u.id }) },
  ara: () => new Date('2026-10-24T16:00:00Z')
});
const ctx = { usuari: { id: 'attacker' }, qui: 'attacker' };
let accepted = 0, firsts = 0;
for (const p of persones) {
  const r = local.segueix({ tipus: 'persona', id: p.id }, ctx);
  accepted++; firsts += Number(r.primer);
}
for (const p of persones) {
  local.deixaDeSeguir({ tipus: 'persona', id: p.id }, ctx);
  const r = local.segueix({ tipus: 'persona', id: p.id }, ctx);
  accepted++; firsts += Number(r.primer);
}
console.log(JSON.stringify({ acceptedTransitionsAtSameInstant: accepted,
  firstNotificationsForHonestClient: firsts, distinctPairs: persones.length }));
JS
```

Eixida observada: `{"acceptedTransitionsAtSameInstant":118,"firstNotificationsForHonestClient":59,"distinctPairs":59}`. La primera crida que faria superar 60 transicions hauria de fallar després de T2; en el tall inicial no fallava.

**Estat després de T2:** l'eixida anterior és històrica. Este script sense captura d'errors ara es deté amb `SDP-SEG-006` quan intenta la transició61. Amb captura de cada error, admet60/rebutja58; el cicle de50min admet60/rebutja353. Per tant C6-01 està resolta en la reproducció local.

### PoC reproduïble C6-02 i C6-03 · DNS/fetch injectats

```sh
node --input-type=module <<'JS'
import { readFileSync } from 'node:fs';
import { creaGestor } from './supabase/functions/noticies/gestor.js';
const cataleg = JSON.parse(readFileSync('./supabase/functions/noticies/fonts.json', 'utf8'));
const rss = '<rss><channel><title>Simulat</title></channel></rss>';
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
let dns = 0, baixades = [];
const gestiona = creaGestor({ cataleg, empremta: async x => x,
  resolDns: async () => { dns++; return ['127.0.0.1']; },
  fetchImpl: async url => { baixades.push(url); return new Response(rss); }
});
let r = await gestiona(new Request('https://project.supabase.co/noticies/feed?font=ayudawp'));
console.log(JSON.stringify({ cas: 'DNS privat del sistema', status: r.status, dns, baixades }));
dns = 0; baixades = [];
const gi = creaGestor({ cataleg, empremta: async x => x,
  resolDns: async () => { dns++; return ['10.0.0.1']; },
  fetchImpl: async url => { baixades.push(url); return new Response(png,
    { headers: { 'content-type': 'image/png' } }); }
});
r = await gi(new Request('https://project.supabase.co/noticies/imatge?u=' +
  encodeURIComponent('https://ayudawp.com/a.png')));
console.log(JSON.stringify({ cas: 'DNS privat imatge aprovada', status: r.status, dns, baixades }));
baixades = [];
const gr = creaGestor({ cataleg, empremta: async x => x,
  fetchImpl: async url => { baixades.push(url); return baixades.length === 1
    ? new Response(null, { status: 302,
      headers: { location: 'https://ayudawp.com:8443/servei-intern' } })
    : new Response(rss); }
});
r = await gr(new Request('https://project.supabase.co/noticies/feed?font=ayudawp'));
console.log(JSON.stringify({ cas: 'Canvi de port del sistema', status: r.status, baixades }));
JS
```

Eixida observada: tots tres casos **200**; `dns: 0` en els dos primers; tercer cas amb baixades `https://ayudawp.com/feed/` i `https://ayudawp.com:8443/servei-intern`. Els fetch són funcions injectades: el hostname de la Request només construïx l'entrada del gestor.

**Reexecució sobre el pegat:** 422/fetch0, 422/fetch0 i 502/fetch1 respectivament. Per tant esta eixida 200 és la prova del tall inicial, no el resultat vigent. C6-02 roman oberta pel cas privada+error descrit més amunt.

### PoC del defecte restant C6-02 · Una família privada i l'altra amb error

```sh
node --input-type=module <<'JS'
import { readFileSync } from 'node:fs';
import { creaGestor } from './supabase/functions/noticies/gestor.js';
const cataleg = JSON.parse(readFileSync('./supabase/functions/noticies/fonts.json', 'utf8'));
const rss = '<rss><channel><title>Simulat</title></channel></rss>';
for (const mode of ['A-privada-AAAA-error', 'AAAA-privada-A-error']) {
  const dns = [], baixades = [];
  const resolDns = async (host, tipus) => {
    dns.push([host, tipus]);
    if ((mode === 'A-privada-AAAA-error' && tipus === 'A') ||
        (mode === 'AAAA-privada-A-error' && tipus === 'AAAA')) {
      return [tipus === 'A' ? '127.0.0.1' : '::1'];
    }
    throw new Error('SERVFAIL');
  };
  const gestor = creaGestor({ cataleg, empremta: async x => x, resolDns,
    fetchImpl: async url => { baixades.push(url); return new Response(rss); }
  });
  const r = await gestor(new Request('https://project.supabase.co/noticies/feed?font=ayudawp'));
  console.log(JSON.stringify({ mode, status: r.status, dns, baixades }));
}
JS
```

Els dos casos donen **200**, dos consultes DNS i un fetch de `https://ayudawp.com/feed/`. És la reproducció sobre el pegat, amb les dues ordenacions de famílies. La frase nova de `supabase/README.md` segons la qual una sola resposta privada veta el destí encara no es complix quan l'altra família falla.

### Criteris de reauditoria per a Claude

T1: qualsevol destí inicial/redirigit i host aprovat amb A o AAAA privada/mixta/absent ha de ser rebutjat abans del fetch; cap esquema alié, credencial, port no aprovat o salt de host. Conservar els sis referents, i provar la política de sortida a nivell de connexió abans d'encendre els destins externs.

T2: 61a admissió dins de la finestra rebutjada amb 60 esdeveniments conservats encara que s'hagen deixat els seguiments o s'haja eliminat un destinatari. Prova concurrent de dos clients del mateix usuari quan ja porta 59 admissions: màxim una alta addicional; usuari B amb quota pròpia; cap accés directe anònim/autenticat a l'historial; cap alteració d'esdeveniments d'A per B. Repetir baixa/represa i provar el límit de finestra. Les repeticions idempotents no poden generar una segona notificació.

### Integritat del tall i tancament documental

| Fitxer | SHA-256 del tall auditat |
| --- | --- |
| `supabase/migrations/2610241430_seguiments.sql` | `d79e89a5e340bc3187a1db16d3e10e2cd4a6915102ed4a3c848760b2d8a5c421` |
| `supabase/functions/noticies/gestor.js` | `5bb4c667b045ca34883cbb241c5d4c2355fbe7a428997671ccaebf8a620c3bb6` |
| `supabase/functions/noticies/index.ts` | `9bb9f2d5107431944ca6448adc1cfe468943ea929653ac8b89f6cbc9ee686d1a` |
| `src/data/localSeguiments.js` | `693c21a9eadb9b83c8f3ce8cebb5f5ebf9181f4dc41f7bd4024f617bfa22690f` |

Pegat de xarxa reauditat: `gestor.js` SHA-256 `24c054effbef70317e63166341c0db6bec93e98daff4bf45c74d7a6de983d7b6`; `gestor.test.js` SHA-256 `7402fc219d98c40d72d677661da2de5484ee6a3597fcb7825f8bd97a7a9962d9`. Nova bateria `npm test -- --run supabase/functions/noticies`: **2 fitxers, 146/146 proves, 2,77 s**. És una nova execució justificada pel canvi de codi, no una suma amb les 108 inicials. També s'han llegit íntegres els diffs del README i de l'embolcall `index.ts`.

Pegat T2 reauditat sobre hashes estables abans/després de les proves: SQL `0eada0277fb39159016ebeeee4cda1586bd0b91c4305dfb12811c11565472736`; `localSeguiments.js` `df74a3236580dc1c3b7c6dc7857f43776cc4ec7549a595ad346c0c1c6d80c90f`; `localSeguiments.test.js` `8eeff8be90c0d644b2a68da11143a21bb62d694c95aeadc45e655c7ba0b71b49`; `seguiments.migracio.test.js` `99d4dceeebf8628ddbf173a83d48abb26c4c2bbc1d86d6715e1afb690d069bd8`.

La bateria SQL/client/local, reexecutada pel canvi, acaba **3 fitxers, 55/55, 0 fallades, 746 ms**. Una execució intermèdia de Codex donà54/55 perquè carregà la versió anterior d'un test que esperava comptar l'alta a l'hora exacta; el test s'actualitzà durant la prova a hora−1ms/hora0, coherent amb `al > límit` de SQL i del local. La reexecució final és verda; no queda cap regressió roja atribuïda a eixa versió intermèdia. La prova concurrent PostgreSQL i el bootstrap sobre una base amb seguiments previs continuen sense executar.

`document.mjs check --file _wiki_de_poble/04_escriptori/261024_1800_auditoria_codex.md`: **codi 0**, informe vàlid. Torn amb pla vinculat i propietat documental registrada per evitar atribuir-se l'informe de Gemini.

`node tooling/gates/tancament.mjs --check --turn-id torn_7b14119b-d6d2-474c-8f3b-0f2c812786c2`: **codi 1**, estat `planned`. Primera passada:1.298 registres; passada final del **24 d'octubre, 18:21:12 CEST**: **1.299**. Olivera, plantilles, autoritat, segell i catàleg de skills ixen amb 0; LEDGER, compilació estricta de Wiki i SCC fallen. El recompte no representa 1.299 vulnerabilitats de seguretat noves.

SCC aporta 1.027 `LINK_INVALID`, 242 `ESCRIPTORI_UNANCHORED` i 22 `ORPHAN_OPERATIVE`. S'hi afegixen la signatura LEDGER, la compilació de Wiki, quatre incidències de metadades/rebut del Llibre Mestre i el relleu de torn absent al LEDGER. El frontmatter del Llibre Mestre és idèntic a HEAD, i el LEDGER és íntegrament idèntic a HEAD: les metadades i la signatura trencada no són introduïdes per esta auditoria. No s'ha resegellat un registre no reconciliat ni ampliat T6 per reescriure el graf sencer. El torn no es declara tancat mecànicament.

L'error addicional final és `Canvis de codi fora de l'abast documental`: el torn de Codex és de documents, però compartix checkout amb la implementació autoritzada, que ha modificat `src/` durant l'auditoria. És un límit de la porta sobre el delta conjunt, no evidència que Codex haja modificat eixe codi. Els hashes finals de xarxa/SQL/local encara concorden amb els de les reauditories descrites més amunt.

Llibre Mestre: P1-07 (C6-02/03), P1-10 (T4 i límit del tancament), P2-10 (diagnòstic vigent i PoC) i P2-11 (T3 ja autoritzada). `.agents/ESTAT.md` conté el relleu del torn. El seu contingut anterior i els documents aliens es conserven.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No hi ha PostgreSQL local disponible ni daemon Docker operatiu en la inspecció. No s'ha aplicat cap migració ni executat cap atac contra Supabase remot. La revisió RLS és de codi i contractes, no una certificació de permisos desplegats o de concurrència real.

Codex no ha modificat codi de producte, tests, SQL, secrets, comptes reals, commits ni desplegaments. L'informe, l'índex, el Llibre Mestre, l'estat de sessió i els rebuts documentals són l'abast d'escriptura de Codex.

Higiene inicial: les cinc automatitzacions locals Codex trobades estan `PAUSED`; la guarda nocturna consta inactiva i finalitzada. No s'ha creat cap cron ni vigilància recurrent per a esta auditoria. Els processos de prova propis són execucions puntuals.

El sistema ha denegat la lectura de `crontab` per restricció de sandbox; per tant no es certifica absència universal de crons del sistema operatiu. No hi ha cap recurs recurrent propi que calga cancel·lar. No s'han aturat serveis compartits ni crons de manteniment de producció.

En el contrast entre agents, el fitxer Gemini `261024_1800_auditoria_gemini.md` ha aparegut i s'ha llegit íntegre quan encara era una plantilla pendent. Després ha arribat el pegat de xarxa, llegit íntegre i reauditat; el seu resultat ja està incorporat. No hi havia encara informe complet de Claude. El relleu de Codex permet continuar la implementació i una altra passada; no és consens del Trio. L'Acta Marmota conjunta queda per a MarIA quan consolide els resultats.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_prompt_claude_gemini_codex_fortificacio_total_i_blindatge_sistema]]
